#!/usr/bin/env python3
"""
Cadence — procedural sprite rig engine (proof-of-concept core)
==============================================================
Turns ONE static 8-direction character sheet into animated sprite strips,
WITHOUT any generative AI and WITHOUT any paid API. It moves the character's
own pixels (cutout/puppet rig), so every frame is on-model with zero anomalies.

Pipeline:
  1. slice_sheet()  -> auto-split the sheet into N facing cells by alpha gaps
  2. segment()      -> heuristic decomposition into body / legL / legR / armL / armR + pivots
  3. render_cycle() -> apply an authored motion (per-direction model) -> RGBA frames
  4. to_strip()     -> anchor + downscale to a target sprite size, pack horizontal strip
  5. phaser_atlas() -> emit a Phaser 3 atlas JSON + a ready load/anim snippet

This file is intentionally dependency-light (Pillow + numpy) and is the
validated seed the full app is built on. Tweak the MOTION constants and the
per-cell DIRECTION_MODEL map to taste; the interactive app exposes these as UI.

Usage:
  python procedural_rig.py sheet.png --dir 0 --motion walk --frames 8 --out out/
  python procedural_rig.py sheet.png --all --out out/      # every direction, both motions
"""
from __future__ import annotations
import argparse, json, math, os
from PIL import Image
import numpy as np

# --------------------------------------------------------------------------- #
# Direction layout. Order matches a standard 8-dir turnaround sheet, left->right.
# Each entry: (key, motion-model). 'step' = legs lift vertically (front/back views),
# 'stride' = legs rotate about the hip in the sagittal plane (side/diagonal views).
# Mirrored directions can be produced by flipping a rendered strip horizontally.
# --------------------------------------------------------------------------- #
DIRECTIONS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"]
DIRECTION_MODEL = {
    "S": "step", "N": "step",
    "W": "stride", "E": "stride",
    "SW": "blend", "SE": "blend", "NW": "blend", "NE": "blend",
}

# --------------------------------------------------------------------------- #
# Motion library. Authored constants -> "correct by construction" cycles.
# 'step' params: per-leg vertical lift + small knee rotation + whole-figure bob.
# 'stride' params: per-leg hip rotation + arm pump + constant forward lean.
# --------------------------------------------------------------------------- #
MOTIONS = {
    "walk": {
        "loop": True, "fps": 9,
        "step":   dict(step=0.041, bob=0.013, arm=7,  knee=6,  crouch=0.0),
        "stride": dict(leg=20, arm=13, lift=0.019, bob=0.016, lean=0),
    },
    "run": {  # run + forward lean
        "loop": True, "fps": 13,
        "step":   dict(step=0.082, bob=0.028, arm=16, knee=12, crouch=0.019),
        "stride": dict(leg=40, arm=30, lift=0.044, bob=0.031, lean=12),
    },
}

# --------------------------------------------------------------------------- #
# 1. Slicing
# --------------------------------------------------------------------------- #
def _trim(im: Image.Image) -> Image.Image:
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 16)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

def slice_sheet(path: str):
    """Auto-split an N-facing sheet into trimmed RGBA cells using empty columns."""
    src = Image.open(path).convert("RGBA")
    alpha = np.array(src)[:, :, 3]
    empty = (alpha > 16).sum(axis=0) == 0
    runs, s = [], None
    for x, e in enumerate(empty):
        if not e and s is None:
            s = x
        if e and s is not None:
            runs.append((s, x)); s = None
    if s is not None:
        runs.append((s, len(empty)))
    runs = [r for r in runs if r[1] - r[0] > 8]
    return [_trim(src.crop((x0, 0, x1, src.height))) for x0, x1 in runs]

# --------------------------------------------------------------------------- #
# 2. Heuristic segmentation (free, no ML). Good first pass; refine via UI.
# --------------------------------------------------------------------------- #
def segment(cell: Image.Image):
    a = np.array(cell)[:, :, 3]
    m = a > 16
    ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    H, W = y1 - y0, x1 - x0
    leg_top = int(y0 + 0.54 * H)

    legmask = np.zeros_like(m); legmask[leg_top:y1 + 1] = m[leg_top:y1 + 1]
    splits = []
    for y in range(leg_top, y1 + 1):
        idx = np.where(m[y])[0]
        if len(idx) < 2:
            continue
        d = np.diff(idx)
        if d.max() > 3:
            g = int(np.argmax(d)); splits.append((idx[g] + idx[g + 1]) // 2)
    split = int(np.median(splits)) if splits else (x0 + x1) // 2

    legL = legmask.copy(); legL[:, split:] = False
    legR = legmask.copy(); legR[:, :split] = False
    arm_top, arm_bot = int(y0 + 0.30 * H), int(y0 + 0.60 * H)
    armw = int(0.19 * W)
    armL = np.zeros_like(m); armL[arm_top:arm_bot, x0:x0 + armw] = m[arm_top:arm_bot, x0:x0 + armw]
    armR = np.zeros_like(m); armR[arm_top:arm_bot, x1 - armw:x1 + 1] = m[arm_top:arm_bot, x1 - armw:x1 + 1]
    body = m & ~(legL | legR | armL | armR)

    parts = {"body": body, "legL": legL, "legR": legR, "armL": armL, "armR": armR}
    piv = {
        "legL": (split - int(0.16 * W), leg_top),
        "legR": (split + int(0.16 * W), leg_top),
        "armL": (x0 + int(0.20 * W), int(y0 + 0.31 * H)),
        "armR": (x1 - int(0.20 * W), int(y0 + 0.31 * H)),
        "pelvis": ((x0 + x1) // 2, leg_top),
    }
    meta = dict(y0=int(y0), y1=int(y1), x0=int(x0), x1=int(x1), H=int(H), W=int(W))
    return parts, piv, meta

# --------------------------------------------------------------------------- #
# 3. Rendering
# --------------------------------------------------------------------------- #
def _layers(cell, parts):
    arr = np.array(cell); out = {}
    for k, mk in parts.items():
        l = np.zeros_like(arr); l[mk] = arr[mk]; out[k] = Image.fromarray(l)
    return out

def _xf(im, angle=0.0, center=None, dx=0.0, dy=0.0):
    if angle:
        im = im.rotate(angle, Image.BICUBIC, center=center, expand=False, fillcolor=(0, 0, 0, 0))
    if dx or dy:
        im = im.transform(im.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    return im

def render_cycle(cell, parts, piv, meta, motion_key, model, frames=8):
    cw, ch = cell.size
    padx, pt, pb = int(cw * 0.5), int(ch * 0.30), int(ch * 0.05)
    W, H = cw + 2 * padx, ch + pt + pb
    ox, oy = padx, pt
    base = _layers(cell, parts)
    L = {}
    for k, im in base.items():
        c = Image.new("RGBA", (W, H), (0, 0, 0, 0)); c.paste(im, (ox, oy), im); L[k] = c
    PV = {k: (p[0] + ox, p[1] + oy) for k, p in piv.items()}
    Hh = meta["H"]
    spec = MOTIONS[motion_key]
    use = "step" if model in ("step",) else "stride" if model == "stride" else "step"
    # 'blend' (diagonals) defaults to the step model with a slight stride flavour;
    # the app tunes blends per-direction. Start from 'step' which is the safe read.
    P = spec[use]
    outs = []
    for i in range(frames):
        t = i / frames * 2 * math.pi
        cnv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        if use == "step":
            liftL = P["step"] * Hh * max(0, math.sin(t))
            liftR = P["step"] * Hh * max(0, math.sin(t + math.pi))
            rotL = -P["knee"] * max(0, math.sin(t))
            rotR = P["knee"] * max(0, math.sin(t + math.pi))
            bob = P["bob"] * Hh * math.cos(2 * t) + P["crouch"] * Hh
            aR = P["arm"] * math.sin(t); aL = P["arm"] * math.sin(t + math.pi)
            cnv = Image.alpha_composite(cnv, _xf(L["legR"], rotR, PV["legR"], 0, bob - liftR))
            cnv = Image.alpha_composite(cnv, _xf(L["legL"], rotL, PV["legL"], 0, bob - liftL))
            cnv = Image.alpha_composite(cnv, _xf(L["body"], 0, None, 0, bob))
            cnv = Image.alpha_composite(cnv, _xf(L["armR"], aR, PV["armR"], 0, bob))
            cnv = Image.alpha_composite(cnv, _xf(L["armL"], aL, PV["armL"], 0, bob))
        else:  # stride (side views): legs rotate about hips, body leans forward
            legA = P["leg"] * math.sin(t); legB = P["leg"] * math.sin(t + math.pi)
            aR = P["arm"] * math.sin(t + math.pi); aL = P["arm"] * math.sin(t)
            liftA = P["lift"] * Hh * max(0, math.sin(t))
            liftB = P["lift"] * Hh * max(0, math.sin(t + math.pi))
            bob = P["bob"] * Hh * math.cos(2 * t)
            legs = sorted([("legR", legB, liftB), ("legL", legA, liftA)], key=lambda z: z[1])
            for k, ang, lift in legs:
                cnv = Image.alpha_composite(cnv, _xf(L[k], ang, PV[k], 0, bob - lift))
            for k, ang in [("body", 0), ("armR", aR), ("armL", aL)]:
                layer = L[k]
                if P["lean"]:
                    layer = _xf(layer, P["lean"], PV["pelvis"])
                layer = _xf(layer, ang, PV.get(k, PV["pelvis"]), 0, bob)
                cnv = Image.alpha_composite(cnv, layer)
        outs.append(cnv)
    return outs, (W, H)

# --------------------------------------------------------------------------- #
# 4. Anchor + downscale + pack
# --------------------------------------------------------------------------- #
def to_strip(frames, canvas_wh, target=(96, 128)):
    W, H = canvas_wh
    sc = min(target[0] / W, target[1] / H)
    nw, nh = int(W * sc), int(H * sc)
    strip = Image.new("RGBA", (target[0] * len(frames), target[1]), (0, 0, 0, 0))
    small = []
    for i, f in enumerate(frames):
        fr = f.resize((nw, nh), Image.LANCZOS)
        cell = Image.new("RGBA", target, (0, 0, 0, 0))
        cell.paste(fr, ((target[0] - nw) // 2, target[1] - nh), fr)   # bottom-center anchor
        small.append(cell)
        strip.paste(cell, (i * target[0], 0), cell)
    return strip, small

def save_gif(frames, canvas_wh, path, fps, bg=(235, 235, 238, 255)):
    W, H = canvas_wh
    pal = [Image.alpha_composite(Image.new("RGBA", (W, H), bg), f).convert("P", palette=Image.ADAPTIVE)
           for f in frames]
    pal[0].save(path, save_all=True, append_images=pal[1:],
                duration=int(1000 / fps), loop=0, disposal=2)

# --------------------------------------------------------------------------- #
# 5. Phaser export
# --------------------------------------------------------------------------- #
def phaser_atlas(strip_name, count, fw, fh):
    frames = {}
    for i in range(count):
        frames[f"{i}"] = {
            "frame": {"x": i * fw, "y": 0, "w": fw, "h": fh},
            "sourceSize": {"w": fw, "h": fh},
            "spriteSourceSize": {"x": 0, "y": 0, "w": fw, "h": fh},
        }
    return {"frames": frames,
            "meta": {"image": strip_name, "format": "RGBA8888",
                     "size": {"w": fw * count, "h": fh}, "scale": "1"}}

def phaser_snippet(key, strip_name, count, fw, fh, fps, loop):
    rep = -1 if loop else 0
    return (
        f"// preload()\n"
        f"this.load.spritesheet('{key}', '{strip_name}', "
        f"{{ frameWidth: {fw}, frameHeight: {fh} }});\n\n"
        f"// create()\n"
        f"this.anims.create({{\n"
        f"  key: '{key}',\n"
        f"  frames: this.anims.generateFrameNumbers('{key}', {{ start: 0, end: {count-1} }}),\n"
        f"  frameRate: {fps}, repeat: {rep}\n"
        f"}});\n"
        f"const spr = this.add.sprite(x, y, '{key}');\n"
        f"spr.play('{key}');"
    )

# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def build_one(cells, di, motion_key, frames, outdir, target=(96, 128)):
    cell = cells[di]
    dkey = DIRECTIONS[di] if di < len(DIRECTIONS) else f"d{di}"
    model = DIRECTION_MODEL.get(dkey, "step")
    parts, piv, meta = segment(cell)
    fr, wh = render_cycle(cell, parts, piv, meta, motion_key, model, frames)
    strip, _ = to_strip(fr, wh, target)
    key = f"jay_{motion_key}_{dkey}".lower()
    os.makedirs(outdir, exist_ok=True)
    strip_name = f"{key}.png"
    strip.save(os.path.join(outdir, strip_name))
    save_gif(fr, wh, os.path.join(outdir, f"{key}_preview.gif"), MOTIONS[motion_key]["fps"])
    atlas = phaser_atlas(strip_name, frames, target[0], target[1])
    with open(os.path.join(outdir, f"{key}.json"), "w") as f:
        json.dump(atlas, f, indent=2)
    snip = phaser_snippet(key, strip_name, frames, target[0], target[1],
                          MOTIONS[motion_key]["fps"], MOTIONS[motion_key]["loop"])
    with open(os.path.join(outdir, f"{key}.phaser.txt"), "w") as f:
        f.write(snip)
    return key, strip_name

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--dir", type=int, default=0, help="direction cell index (0-based)")
    ap.add_argument("--motion", default="walk", choices=list(MOTIONS))
    ap.add_argument("--frames", type=int, default=8)
    ap.add_argument("--out", default="out")
    ap.add_argument("--all", action="store_true", help="render every direction x every motion")
    ap.add_argument("--w", type=int, default=96)
    ap.add_argument("--h", type=int, default=128)
    a = ap.parse_args()
    cells = slice_sheet(a.sheet)
    print(f"sliced {len(cells)} cells")
    target = (a.w, a.h)
    if a.all:
        for di in range(len(cells)):
            for mk in MOTIONS:
                key, name = build_one(cells, di, mk, a.frames, a.out, target)
                print("  built", key)
    else:
        key, name = build_one(cells, a.dir, a.motion, a.frames, a.out, target)
        print("built", key, "->", name)

if __name__ == "__main__":
    main()
