from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MASTER_DIR = ROOT / "assets/art/masters/characters/animation"
RUNTIME_DIR = ROOT / "assets/art/characters"
REVIEW_DIR = ROOT / "assets/art/review"

NAMES = ["dorin", "jay", "mia", "milo", "pippa"]
FW = 96
FH = 128
COLS = 4
TOTAL = 46

RUN_SLOTS = [
    ("down", 0, 16, 17),
    ("left", 4, 18, 19),
    ("right", 8, 20, 21),
    ("up", 12, 22, 23),
    ("downright", 24, 36, 37),
    ("downleft", 27, 38, 39),
    ("upright", 30, 40, 41),
    ("upleft", 33, 42, 43),
]

DIR_VEC = {
    "down": (0, 1),
    "left": (-1, 0),
    "right": (1, 0),
    "up": (0, -1),
    "downright": (1, 1),
    "downleft": (-1, 1),
    "upright": (1, -1),
    "upleft": (-1, -1),
}

FACE_VISIBLE = {"down", "left", "right", "downright", "downleft"}


try:
    NEAREST = Image.Resampling.NEAREST
except AttributeError:
    NEAREST = Image.NEAREST


def frame_box(index: int) -> tuple[int, int, int, int]:
    x = (index % COLS) * FW
    y = (index // COLS) * FH
    return x, y, x + FW, y + FH


def alpha_bbox(img: Image.Image, threshold: int = 8) -> tuple[int, int, int, int] | None:
    alpha = np.array(img.getchannel("A"))
    ys, xs = np.where(alpha > threshold)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def mask_where(base: Image.Image, pred) -> Image.Image:
    arr = np.array(base)
    alpha = arr[:, :, 3]
    yy, xx = np.indices((FH, FW))
    mask = (alpha > 8) & pred(xx, yy)
    out = np.zeros((FH, FW), dtype=np.uint8)
    out[mask] = alpha[mask]
    return Image.fromarray(out, "L")


def shifted(base: Image.Image, mask: Image.Image, dx: int, dy: int) -> Image.Image:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.paste(base, (0, 0), mask)
    out = Image.new("RGBA", base.size, (0, 0, 0, 0))
    out.alpha_composite(layer, (dx, dy))
    return out


def local_palette(img: Image.Image) -> dict[str, tuple[int, int, int, int]]:
    arr = np.array(img)
    bbox = alpha_bbox(img) or (20, 8, 76, 124)
    x0, y0, x1, y1 = bbox
    px = arr[y0:y1, x0:x1, :]
    opaque = px[:, :, 3] > 120
    if opaque.any():
        colors = px[opaque]
        luma = colors[:, 0] * 0.2126 + colors[:, 1] * 0.7152 + colors[:, 2] * 0.0722
        dark = tuple(int(v) for v in colors[int(luma.argmin()), :3]) + (255,)
        light = tuple(int(v) for v in colors[int(luma.argmax()), :3]) + (255,)
    else:
        dark = (18, 16, 24, 255)
        light = (245, 226, 196, 255)

    w = x1 - x0
    h = y1 - y0
    face = arr[int(y0 + h * 0.24):int(y0 + h * 0.49), int(x0 + w * 0.18):int(x1 - w * 0.18), :]
    m = face[:, :, 3] > 120
    skin = light
    if m.any():
        face_colors = face[m]
        luma = face_colors[:, 0] * 0.2126 + face_colors[:, 1] * 0.7152 + face_colors[:, 2] * 0.0722
        warm = (luma > 70) & (face_colors[:, 0] >= face_colors[:, 2])
        chosen = face_colors[warm] if warm.any() else face_colors
        if len(chosen):
            skin = tuple(int(v) for v in np.median(chosen[:, :3], axis=0)) + (255,)
    return {"dark": dark, "light": light, "skin": skin}


def face_band(img: Image.Image, facing: str) -> tuple[int, int]:
    arr = np.array(img)
    bbox = alpha_bbox(img) or (20, 8, 76, 124)
    x0, y0, x1, y1 = bbox
    w = x1 - x0
    h = y1 - y0
    yy, xx = np.where(arr[:, :, 3] > 120)
    if facing == "left":
        x_min, x_max = x0 + w * 0.12, x0 + w * 0.58
    elif facing == "right":
        x_min, x_max = x0 + w * 0.42, x1 - w * 0.12
    elif "left" in facing:
        x_min, x_max = x0 + w * 0.10, x0 + w * 0.68
    elif "right" in facing:
        x_min, x_max = x0 + w * 0.32, x1 - w * 0.10
    else:
        x_min, x_max = x0 + w * 0.18, x1 - w * 0.18
    mask = (
        (xx >= x_min)
        & (xx <= x_max)
        & (yy >= y0 + h * 0.22)
        & (yy <= y0 + h * 0.50)
    )
    candidates: list[int] = []
    for x, y in zip(xx[mask], yy[mask]):
        r, g, b, _ = arr[y, x]
        luma = r * 0.2126 + g * 0.7152 + b * 0.0722
        if luma < 55:
            candidates.append(int(y))
    eye_y = int(round(float(np.median(candidates)))) if candidates else int(round(y0 + h * 0.34))
    return eye_y, int(round(y0 + h * 0.43))


def stamp_determined_face(img: Image.Image, facing: str, phase: int) -> None:
    if facing not in FACE_VISIBLE:
        return
    bbox = alpha_bbox(img)
    if not bbox:
        return
    x0, y0, x1, y1 = bbox
    w = x1 - x0
    palette = local_palette(img)
    dark = palette["dark"]
    skin = palette["skin"]
    eye_y, mouth_y = face_band(img, facing)
    draw = ImageDraw.Draw(img)

    def line(a, b, width=2) -> None:
        draw.line([tuple(map(int, a)), tuple(map(int, b))], fill=dark, width=width)

    def wipe(x: float, width: int = 9) -> None:
        draw.rectangle(
            [int(x - width / 2), eye_y - 3, int(x + width / 2), eye_y + 4],
            fill=skin,
        )

    if facing == "down":
        cx = (x0 + x1) / 2
        left = cx - w * 0.17
        right = cx + w * 0.17
        wipe(left)
        wipe(right)
        line((left - 5, eye_y), (left + 5, eye_y + 2))
        line((right - 5, eye_y + 2), (right + 5, eye_y))
        if phase == 0:
            draw.rectangle([int(cx - 5), mouth_y, int(cx + 5), mouth_y + 3], fill=dark)
            draw.line([(int(cx - 3), mouth_y + 1), (int(cx + 3), mouth_y + 1)], fill=palette["light"], width=1)
        else:
            line((cx - 5, mouth_y + 2), (cx + 5, mouth_y + 1), 2)
        return

    dirx = -1 if "left" in facing else 1
    cx = x0 + w * (0.38 if dirx < 0 else 0.62)
    wipe(cx, 10)
    line((cx - dirx * 5, eye_y), (cx + dirx * 5, eye_y + 2), 2)
    mx = x0 + w * (0.30 if dirx < 0 else 0.70)
    if phase == 0:
        draw.rectangle(
            [int(min(mx, mx + dirx * 5)), mouth_y, int(max(mx, mx + dirx * 5)), mouth_y + 3],
            fill=dark,
        )
    else:
        line((mx - dirx * 4, mouth_y + 1), (mx + dirx * 4, mouth_y + 2), 2)


def make_run_frame(stand: Image.Image, facing: str, phase: int) -> Image.Image:
    bbox = alpha_bbox(stand)
    if not bbox:
        return stand.copy()
    x0, y0, x1, y1 = bbox
    w = x1 - x0
    h = y1 - y0
    cx = x0 + w / 2
    vx, vy = DIR_VEC[facing]
    sign = -1 if phase == 0 else 1

    head_cut = y0 + h * 0.42
    torso_top = y0 + h * 0.38
    hip = y0 + h * 0.68
    foot = y0 + h * 0.87

    head = mask_where(stand, lambda x, y: y < head_cut)
    torso = mask_where(stand, lambda x, y: (y >= torso_top) & (y < hip) & (x >= x0 + w * 0.22) & (x <= x1 - w * 0.22))
    left_arm = mask_where(stand, lambda x, y: (y >= torso_top) & (y < foot) & (x < x0 + w * 0.38))
    right_arm = mask_where(stand, lambda x, y: (y >= torso_top) & (y < foot) & (x > x1 - w * 0.38))
    left_leg = mask_where(stand, lambda x, y: (y >= hip) & (x < cx))
    right_leg = mask_where(stand, lambda x, y: (y >= hip) & (x >= cx))

    masks = [np.array(m) > 0 for m in (head, torso, left_arm, right_arm, left_leg, right_leg)]
    claimed = np.logical_or.reduce(masks)
    alpha = np.array(stand.getchannel("A"))
    core_arr = np.zeros((FH, FW), dtype=np.uint8)
    core_arr[(alpha > 8) & ~claimed] = alpha[(alpha > 8) & ~claimed]
    core = Image.fromarray(core_arr, "L")

    out = Image.new("RGBA", stand.size, (0, 0, 0, 0))

    def fwd(amount: int, extra_x: int = 0, extra_y: int = 0) -> tuple[int, int]:
        # The extra downward nudge is the little runner hunch: head lower,
        # shoulders lower, feet still active.
        return int(round(vx * amount + extra_x)), int(round(vy * amount + extra_y))

    perp = (-vy, vx)
    leg_spread = 4 if facing in {"down", "up"} else 1
    arm_spread = 2 if facing in {"down", "up"} else 0

    layers = [
        (core, 0, 0),
        (torso, *fwd(3, 0, 2)),
        (left_leg, *fwd(sign * 5, perp[0] * sign * leg_spread, perp[1] * sign * leg_spread)),
        (right_leg, *fwd(-sign * 5, -perp[0] * sign * leg_spread, -perp[1] * sign * leg_spread)),
        (left_arm, *fwd(-sign * 6, -perp[0] * sign * arm_spread, 2 - perp[1] * sign * arm_spread)),
        (right_arm, *fwd(sign * 6, perp[0] * sign * arm_spread, 2 + perp[1] * sign * arm_spread)),
        (head, *fwd(7, 0, 4)),
    ]
    for mask, dx, dy in layers:
        out.alpha_composite(shifted(stand, mask, dx, dy))

    stamp_determined_face(out, facing, phase)
    return out


def paste_frame(sheet: Image.Image, index: int, frame: Image.Image) -> None:
    x0, y0, _, _ = frame_box(index)
    sheet.paste(Image.new("RGBA", (FW, FH), (0, 0, 0, 0)), (x0, y0))
    sheet.alpha_composite(frame, (x0, y0))


def repair_sheet(name: str) -> Image.Image:
    sheet = Image.open(MASTER_DIR / f"{name}_anim_46_4x_master.png").convert("RGBA")
    for facing, stand_index, run_a, run_b in RUN_SLOTS:
        stand = sheet.crop(frame_box(stand_index))
        paste_frame(sheet, run_a, make_run_frame(stand, facing, 0))
        paste_frame(sheet, run_b, make_run_frame(stand, facing, 1))
    return sheet


def validate_sheet(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    if img.size != (FW * COLS, FH * 12):
        raise RuntimeError(f"{path} has {img.size}, expected {(FW * COLS, FH * 12)}")
    for i in range(TOTAL):
        if alpha_bbox(img.crop(frame_box(i))) is None:
            raise RuntimeError(f"{path} has blank frame {i}")
    for _, stand, run_a, run_b in RUN_SLOTS:
        base = np.array(img.crop(frame_box(stand)))
        for run in (run_a, run_b):
            candidate = np.array(img.crop(frame_box(run)))
            if not np.any(base != candidate):
                raise RuntimeError(f"{path} run frame {run} still equals stand {stand}")


def save_reviews() -> None:
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    full = Image.new("RGBA", (92 + TOTAL * 48 + 16, 28 + len(NAMES) * 72 + 8), (26, 30, 38, 255))
    draw = ImageDraw.Draw(full)
    draw.text((8, 7), "46-frame movement sheets: stand / walk / run / diagonal / idle", fill=(235, 238, 244, 255))
    for row, name in enumerate(NAMES):
        sheet = Image.open(MASTER_DIR / f"{name}_anim_46_4x_master.png").convert("RGBA")
        y = 28 + row * 72
        draw.text((8, y + 27), name, fill=(235, 238, 244, 255))
        for i in range(TOTAL):
            thumb = sheet.crop(frame_box(i)).resize((48, 64), NEAREST)
            full.alpha_composite(thumb, (92 + i * 48, y))
    full.save(REVIEW_DIR / "hero_movement_46_review.png")

    run_indices = []
    for facing, stand, run_a, run_b in RUN_SLOTS:
        run_indices.extend([(facing, stand), (f"{facing} runA", run_a), (f"{facing} runB", run_b)])
    run = Image.new("RGBA", (108 + len(run_indices) * 72 + 16, 28 + len(NAMES) * 104 + 8), (26, 30, 38, 255))
    draw = ImageDraw.Draw(run)
    draw.text((8, 7), "run repair review: stand / runA / runB for each direction", fill=(235, 238, 244, 255))
    for col, (label, _) in enumerate(run_indices):
        draw.text((108 + col * 72 + 2, 18), label[:10], fill=(190, 198, 210, 255))
    for row, name in enumerate(NAMES):
        sheet = Image.open(MASTER_DIR / f"{name}_anim_46_4x_master.png").convert("RGBA")
        y = 28 + row * 104
        draw.text((8, y + 42), name, fill=(235, 238, 244, 255))
        for col, (_, idx) in enumerate(run_indices):
            thumb = sheet.crop(frame_box(idx)).resize((72, 96), NEAREST)
            run.alpha_composite(thumb, (108 + col * 72, y + 8))
    run.save(REVIEW_DIR / "hero_run_motion_review.png")


def main() -> None:
    for name in NAMES:
        repaired = repair_sheet(name)
        master_path = MASTER_DIR / f"{name}_anim_46_4x_master.png"
        runtime_path = RUNTIME_DIR / f"{name}_anim_46_4x.png"
        repaired.save(master_path)
        repaired.save(runtime_path)
        validate_sheet(master_path)
        validate_sheet(runtime_path)
        print(f"repaired run frames for {name}")
    save_reviews()
    print(f"wrote {REVIEW_DIR / 'hero_run_motion_review.png'}")
    print(f"wrote {REVIEW_DIR / 'hero_movement_46_review.png'}")


if __name__ == "__main__":
    main()
