#!/usr/bin/env python3
"""
Blender NPC animation pipeline (OFF-CANON — see docs/BLENDER_NPC_PIPELINE.md).

Builds a rigged low-poly humanoid, tints it from the palette of a single
"standing" sprite, animates idle / walk / run, renders it from 8 facings, and
bakes the result into the game's exact 46-frame, 384x1536 character sheet
(`assets/art/characters/<id>_anim_46_4x.png`).

IMPORTANT HONEST CAVEAT: a single flat PNG contains no 3D geometry, so the
standing image only drives PALETTE + rough proportions, NOT likeness. The
output is a posed mannequin in the NPC's colors — it will NOT match the
hand-authored pixel-art cast (that is exactly why ADR-109 mandated authored
PNGs). Use only with eyes open.

Run headless with the pip `bpy` module:
    python3 tools/blender/npc_blender_anim.py \
        --input assets/art/masters/characters/npc_borden-8dir-transparent.png \
        --name npc_borden \
        --out-sheet assets/art/review/blender/npc_borden_anim_46_4x.png \
        --out-preview assets/art/review/blender/npc_borden_preview.png

The 46-frame layout is the contract enforced by
`src/spritegen/authored.ts::makeCharacterCanvas` — do not change the frame map
below without changing that function too.
"""

import argparse
import math
import os
import sys
import tempfile

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ----------------------------------------------------------------------------
# Runtime sheet contract (must match src/spritegen/authored.ts).
# FRAME_W/H = 24x32 * ART_SCALE(4) = 96x128. 4 cols, 12 rows, 46 frames.
# ----------------------------------------------------------------------------
ART_SCALE = 4
FRAME_W = 24 * ART_SCALE      # 96
FRAME_H = 32 * ART_SCALE      # 128
COLS = 4
TOTAL_FRAMES = 46
ROWS = math.ceil(TOTAL_FRAMES / COLS)   # 12
SHEET_W = COLS * FRAME_W       # 384
SHEET_H = ROWS * FRAME_H       # 1536

# Facings, counter-clockwise from front (matches sourceByFacing in authored.ts).
# yaw = world Z rotation applied to the rig root; camera is fixed at +Y.
FACING_YAW = {
    "down": 0,
    "downleft": 45,
    "left": 90,
    "upleft": 135,
    "up": 180,
    "upright": 225,
    "right": 270,
    "downright": 315,
}


def build_frame_plan():
    """Return list of (frame_index, facing, pose) reproducing the exact 46-frame
    layout drawn by makeCharacterCanvas()."""
    plan = []
    cardinals = ["down", "left", "right", "up"]
    diagonals = ["downright", "downleft", "upright", "upleft"]
    # cardinal walk: base = di*4 -> stand, walkA, stand, walkB
    for di, f in enumerate(cardinals):
        base = di * 4
        plan += [(base, f, "stand"), (base + 1, f, "walkA"),
                 (base + 2, f, "stand"), (base + 3, f, "walkB")]
    # cardinal run: base = 16 + di*2 -> runA, runB
    for di, f in enumerate(cardinals):
        base = 16 + di * 2
        plan += [(base, f, "runA"), (base + 1, f, "runB")]
    # diagonal walk: base = 24 + di*3 -> stand, walkA, walkB
    for di, f in enumerate(diagonals):
        base = 24 + di * 3
        plan += [(base, f, "stand"), (base + 1, f, "walkA"), (base + 2, f, "walkB")]
    # diagonal run: base = 36 + di*2 -> runA, runB
    for di, f in enumerate(diagonals):
        base = 36 + di * 2
        plan += [(base, f, "runA"), (base + 1, f, "runB")]
    # idle frames (down)
    plan += [(44, "down", "idleBreath"), (45, "down", "idleBlink")]
    plan.sort(key=lambda t: t[0])
    assert [p[0] for p in plan] == list(range(TOTAL_FRAMES)), "frame plan gap"
    return plan


# ----------------------------------------------------------------------------
# Pose library. Angles in DEGREES about each part's local X (sagittal swing).
# Keys: lean (torso), bob (root z offset, metres), and per-limb rotations.
# walkB / runB are the opposite-foot mirror of walkA / runA.
# ----------------------------------------------------------------------------
def _mirror(p):
    m = dict(p)
    m["thighL"], m["thighR"] = p["thighR"], p["thighL"]
    m["shinL"], m["shinR"] = p["shinR"], p["shinL"]
    m["armL"], m["armR"] = p["armR"], p["armL"]
    m["foreL"], m["foreR"] = p["foreR"], p["foreL"]
    return m


_WALK_A = {"lean": 5, "bob": -0.015,
           "thighL": 24, "shinL": -18, "thighR": -22, "shinR": 16,
           "armL": -20, "armR": 20, "foreL": -10, "foreR": 12}
_RUN_A = {"lean": 16, "bob": -0.045,
          "thighL": 44, "shinL": -48, "thighR": -36, "shinR": 62,
          "armL": -48, "armR": 52, "foreL": -55, "foreR": 25}

POSES = {
    "stand": {"lean": 0, "bob": 0, "thighL": 0, "shinL": 0, "thighR": 0,
              "shinR": 0, "armL": 6, "armR": 6, "foreL": 4, "foreR": 4},
    "idleBreath": {"lean": 2, "bob": 0.012, "thighL": 0, "shinL": 0, "thighR": 0,
                   "shinR": 0, "armL": 9, "armR": 9, "foreL": 6, "foreR": 6},
    "idleBlink": {"lean": 0, "bob": 0, "thighL": 0, "shinL": 0, "thighR": 0,
                  "shinR": 0, "armL": 6, "armR": 6, "foreL": 4, "foreR": 4},
    "walkA": _WALK_A,
    "walkB": _mirror(_WALK_A),
    "runA": _RUN_A,
    "runB": _mirror(_RUN_A),
}


# ----------------------------------------------------------------------------
# Palette sampling from the standing sprite.
# ----------------------------------------------------------------------------
def sample_palette(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    px = px[::-1]  # bpy stores rows bottom-up -> flip to top-down
    # Wide 8-dir strip? take the first (front/down) cell.
    cell_w = w // 8 if w >= h * 2.5 else w
    cell = px[:, :cell_w]
    alpha = cell[:, :, 3]
    ys, xs = np.where(alpha > 0.3)
    if len(ys) == 0:
        gray = (0.6, 0.6, 0.6)
        return {k: gray for k in ("skin", "hair", "shirt", "pants", "shoe")}
    y0, y1 = ys.min(), ys.max()
    span = max(1, y1 - y0)

    def band(lo, hi):
        a = int(y0 + lo * span)
        b = int(y0 + hi * span)
        region = cell[a:b]
        mask = region[:, :, 3] > 0.3
        if mask.sum() == 0:
            return (0.6, 0.6, 0.6)
        rgb = region[:, :, :3][mask]
        return tuple(float(c) for c in rgb.mean(axis=0))

    bpy.data.images.remove(img)
    return {
        "hair":  band(0.00, 0.16),
        "skin":  band(0.14, 0.30),
        "shirt": band(0.40, 0.62),
        "pants": band(0.66, 0.90),
        "shoe":  band(0.90, 1.00),
    }


# ----------------------------------------------------------------------------
# Rig construction (object-FK hierarchy = a real, keyframable articulated rig).
# ----------------------------------------------------------------------------
def _clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)


def _make_box(name, dims, color, top_pivot=True):
    """Box mesh sized `dims` (x,y,z). If top_pivot, the object origin sits at the
    TOP face centre (so X-rotation swings it like a limb hanging from a joint)."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= dims[0]
        v.co.y *= dims[1]
        v.co.z *= dims[2]
    if top_pivot:
        for v in bm.verts:
            v.co.z -= dims[2] / 2.0   # hang below origin
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.color = (color[0], color[1], color[2], 1.0)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
        bsdf.inputs["Roughness"].default_value = 0.85
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.1
    mesh.materials.append(mat)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _parent(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def build_rig(pal):
    _clear_scene()
    root = bpy.data.objects.new("root", None)  # empty
    bpy.context.scene.collection.objects.link(root)

    parts = {"root": root}

    # Torso leans from the pelvis; upper body parents to it.
    torso = _make_box("torso", (0.30, 0.18, 0.52), pal["shirt"], top_pivot=False)
    torso.location = Vector((0, 0, 0.9 + 0.26))
    _parent(torso, root)
    # shift mesh so pivot is at pelvis (bottom of torso)
    torso.data.transform(Matrix.Translation((0, 0, -0.26)))
    parts["torso"] = torso

    head = _make_box("head", (0.20, 0.20, 0.22), pal["skin"], top_pivot=False)
    head.location = Vector((0, 0, 1.58))
    _parent(head, torso)
    parts["head"] = head

    hair = _make_box("hair", (0.215, 0.215, 0.09), pal["hair"], top_pivot=False)
    hair.location = Vector((0, 0, 1.70))
    _parent(hair, torso)
    parts["hair"] = hair

    # nose marker on +Y front face (orientation check; tiny, skin tone darker)
    nose = _make_box("nose", (0.05, 0.06, 0.05),
                     tuple(c * 0.8 for c in pal["skin"]), top_pivot=False)
    nose.location = Vector((0, 0.11, 1.55))
    _parent(nose, head)
    parts["nose"] = nose

    def limb(name, joint, dims, color, parent):
        o = _make_box(name, dims, color, top_pivot=True)
        o.location = Vector(joint)
        _parent(o, parent)
        return o

    # Arms (upper = sleeve/shirt, fore = skin), hang from shoulders.
    for side, sx in (("L", -1), ("R", 1)):
        up = limb(f"arm{side}", (sx * 0.20, 0, 1.36), (0.09, 0.10, 0.30),
                  pal["shirt"], torso)
        fore = limb(f"fore{side}", (0, 0, -0.30), (0.08, 0.09, 0.28),
                    pal["skin"], up)
        parts[f"arm{side}"] = up
        parts[f"fore{side}"] = fore

    # Legs (thigh + shin = pants, foot = shoe), hang from hips.
    for side, sx in (("L", -1), ("R", 1)):
        th = limb(f"thigh{side}", (sx * 0.09, 0, 0.9), (0.12, 0.13, 0.46),
                  pal["pants"], root)
        sh = limb(f"shin{side}", (0, 0, -0.46), (0.10, 0.11, 0.42),
                  pal["pants"], th)
        foot = _make_box(f"foot{side}", (0.12, 0.22, 0.08), pal["shoe"],
                         top_pivot=False)
        foot.location = Vector((0, 0.04, -0.40))
        _parent(foot, sh)
        parts[f"thigh{side}"] = th
        parts[f"shin{side}"] = sh
        parts[f"foot{side}"] = foot

    return parts


def apply_pose(parts, pose_name, yaw_deg):
    p = POSES[pose_name]
    r = lambda d: math.radians(d)
    parts["root"].rotation_euler = (0, 0, math.radians(yaw_deg))
    parts["root"].location.z = p["bob"]
    parts["torso"].rotation_euler.x = r(p["lean"])
    for side in ("L", "R"):
        parts[f"thigh{side}"].rotation_euler.x = r(p[f"thigh{side}"])
        parts[f"shin{side}"].rotation_euler.x = r(p[f"shin{side}"])
        parts[f"arm{side}"].rotation_euler.x = r(p[f"arm{side}"])
        parts[f"fore{side}"].rotation_euler.x = r(p[f"fore{side}"])


# ----------------------------------------------------------------------------
# Scene / camera / render setup (Workbench = reliable headless, no GPU needed).
# ----------------------------------------------------------------------------
def setup_render():
    scene = bpy.context.scene
    # Cycles on CPU renders headless with NO OpenGL/EGL context (Workbench/EEVEE
    # need a GL context that isn't available on a GPU-less box).
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = FRAME_W
    scene.render.resolution_y = FRAME_H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"  # keep palette colours literal

    # Soft 3/4 key light + ambient world so the mannequin reads with depth.
    world = scene.world or bpy.data.worlds.new("w")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.55, 0.58, 0.62, 1.0)
        bg.inputs["Strength"].default_value = 0.7
    sun_data = bpy.data.lights.new("sun", type="SUN")
    sun_data.energy = 3.0
    sun_data.angle = math.radians(20)
    sun = bpy.data.objects.new("sun", sun_data)
    sun.rotation_euler = (math.radians(55), 0, math.radians(35))
    scene.collection.objects.link(sun)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 2.15   # frames a ~1.7m figure with head/foot room
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    target = Vector((0, 0, 0.92))
    cam.location = Vector((0, 5.0, 3.1))   # +Y, elevated -> JRPG 3/4 view (~25deg)
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam


def render_frame(tmp_path):
    bpy.context.scene.render.filepath = tmp_path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(tmp_path, check_existing=False)
    w, h = img.size
    arr = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]
    bpy.data.images.remove(img)
    return arr  # top-down RGBA float


# ----------------------------------------------------------------------------
# Sheet assembly + output.
# ----------------------------------------------------------------------------
def save_rgba(path, arr_top_down):
    h, w, _ = arr_top_down.shape
    out = bpy.data.images.new("out", width=w, height=h, alpha=True)
    flat = arr_top_down[::-1].reshape(-1)  # back to bottom-up for bpy
    out.pixels[:] = flat.tolist()
    out.filepath_raw = path
    out.file_format = "PNG"
    out.save()
    bpy.data.images.remove(out)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="standing sprite (PNG)")
    ap.add_argument("--name", required=True, help="npc id, e.g. npc_borden")
    ap.add_argument("--out-sheet", required=True)
    ap.add_argument("--out-preview", default=None)
    ap.add_argument("--blend", default=None, help="save the .blend rig here")
    args = ap.parse_args(argv)

    pal = sample_palette(args.input)
    print("[palette]", {k: tuple(round(c, 2) for c in v) for k, v in pal.items()})

    parts = build_rig(pal)
    setup_render()

    plan = build_frame_plan()
    sheet = np.zeros((SHEET_H, SHEET_W, 4), dtype=np.float32)
    tmpdir = tempfile.mkdtemp(prefix="npcblender_")
    for idx, facing, pose in plan:
        apply_pose(parts, pose, FACING_YAW[facing])
        frame = render_frame(os.path.join(tmpdir, f"f{idx:02d}.png"))
        if frame.shape[0] != FRAME_H or frame.shape[1] != FRAME_W:
            raise RuntimeError(f"frame {idx} wrong size {frame.shape}")
        cx = (idx % COLS) * FRAME_W
        cy = (idx // COLS) * FRAME_H
        sheet[cy:cy + FRAME_H, cx:cx + FRAME_W] = frame
        print(f"  frame {idx:2d}  {facing:9s} {pose}")

    os.makedirs(os.path.dirname(args.out_sheet), exist_ok=True)
    save_rgba(args.out_sheet, sheet)
    print("[sheet]", args.out_sheet, f"{SHEET_W}x{SHEET_H}")

    if args.out_preview:
        # Composite onto mid-gray so the transparent sheet is viewable.
        bg = np.empty_like(sheet)
        bg[:, :, :3] = 0.5
        bg[:, :, 3] = 1.0
        a = sheet[:, :, 3:4]
        comp = bg.copy()
        comp[:, :, :3] = sheet[:, :, :3] * a + bg[:, :, :3] * (1 - a)
        save_rgba(args.out_preview, comp)
        print("[preview]", args.out_preview)

    if args.blend:
        os.makedirs(os.path.dirname(args.blend), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=args.blend)
        print("[blend]", args.blend)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main(argv)
