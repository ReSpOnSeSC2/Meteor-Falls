"""
sheet.py — assemble the game's exact 46-frame runtime sheet from a rig.

Contract (see src/spritegen/characters.ts):
     0-15  walk   down/left/right/up  x4 poses [0,1,2,3]
    16-23  run    down/left/right/up  x2 poses [1,3]
    24-35  diag walk downright/downleft/upright/upleft x3 poses [0,1,3]
    36-43  diag run  downright/downleft/upright/upleft x2 poses [1,3]
       44  idle breath (down)   45  idle blink (down)

Cells are 96x128 (24x32 native x ART_SCALE 4), packed 4 columns wide ->
384x1536, byte-for-byte the layout of ``*_anim_46_4x.png``. Left/up-left/etc.
are horizontal mirrors of their right twin, exactly as the game derives them.

Registration: every cell shares ONE global scale, and each facing is centered on
the union bbox of its whole animation so wide strides never clip the cell.
"""
from __future__ import annotations

import json
from dataclasses import dataclass

import numpy as np
from PIL import Image

from .motion import MotionParams, frame_pose, idle_pose
from .rig import RiggedCell
from .skeleton import Skeleton

FRAME_W, FRAME_H = 96, 128
COLS = 4
TOTAL = 46
FILL = 0.90  # fraction of cell height the character occupies
BOTTOM_MARGIN = 0.05


def _alpha_bbox(img: Image.Image, thresh: int = 8) -> tuple[int, int, int, int] | None:
    """(minx, miny, maxx, maxy) of opaque pixels, or None if fully transparent."""
    a = np.asarray(img)[:, :, 3] > thresh
    ys = np.where(a.any(axis=1))[0]
    xs = np.where(a.any(axis=0))[0]
    if len(xs) == 0:
        return None
    return int(xs[0]), int(ys[0]), int(xs[-1]) + 1, int(ys[-1]) + 1


@dataclass(frozen=True)
class Slot:
    index: int
    facing: str  # game facing this cell depicts
    motion: str  # walk | run | idle
    pose: int  # pose index (or 0/1 for idle breath/blink)
    src: str  # canonical facing actually rigged
    mirror: bool


def _seq(start: int, facing: str, motion: str, poses: list[int]) -> list[Slot]:
    src_map = {
        "left": ("right", True), "downleft": ("downright", True), "upleft": ("upright", True),
    }
    src, mir = src_map.get(facing, (facing, False))
    return [Slot(start + i, facing, motion, p, src, mir) for i, p in enumerate(poses)]


def build_contract() -> list[Slot]:
    s: list[Slot] = []
    s += _seq(0, "down", "walk", [0, 1, 2, 3])
    s += _seq(4, "left", "walk", [0, 1, 2, 3])
    s += _seq(8, "right", "walk", [0, 1, 2, 3])
    s += _seq(12, "up", "walk", [0, 1, 2, 3])
    s += _seq(16, "down", "run", [1, 3])
    s += _seq(18, "left", "run", [1, 3])
    s += _seq(20, "right", "run", [1, 3])
    s += _seq(22, "up", "run", [1, 3])
    s += _seq(24, "downright", "walk", [0, 1, 3])
    s += _seq(27, "downleft", "walk", [0, 1, 3])
    s += _seq(30, "upright", "walk", [0, 1, 3])
    s += _seq(33, "upleft", "walk", [0, 1, 3])
    s += _seq(36, "downright", "run", [1, 3])
    s += _seq(38, "downleft", "run", [1, 3])
    s += _seq(40, "upright", "run", [1, 3])
    s += _seq(42, "upleft", "run", [1, 3])
    s.append(Slot(44, "down", "idle", 0, "down", False))  # breath
    s.append(Slot(45, "down", "idle", 1, "down", False))  # blink
    return s


CONTRACT = build_contract()
CANONICAL = ["down", "up", "right", "downright", "upright"]


class SheetRenderer:
    """Holds rigged canonical facings and renders any contract cell on demand."""

    def __init__(self, rigs: dict[str, Skeleton], cells: dict[str, Image.Image]):
        self.rigged: dict[str, RiggedCell] = {}
        # facing -> (center_x, ground_y, scale) in padded-canvas coords
        self.anchor: dict[str, tuple[float, float, float]] = {}
        self._calibrated_for: dict | None = None
        for facing in CANONICAL:
            if facing not in rigs:
                continue
            self.rigged[facing] = RiggedCell(cells[facing], rigs[facing])

    # -- calibration: fit the WHOLE animation (every pose), not the rest pose --
    def _calibrate(self, params: dict[str, MotionParams]) -> None:
        """Size + center each facing from the union bbox of all its posed frames
        so wide run strides / leans never clip the 96x128 cell, and the figure is
        a single consistent size across the sheet."""
        key = {m: params[m].to_dict() for m in params}
        if self._calibrated_for == key and self.anchor:
            return
        margin = 0.93
        probe = (("walk", [0, 1, 2, 3]), ("run", [1, 3]))
        envs: dict[str, tuple[float, float, float, float]] = {}
        for facing, rc in self.rigged.items():
            minx = miny = 1e9
            maxx = maxy = -1e9
            for motion, poses in probe:
                for p in poses:
                    img = rc.pose(frame_pose(facing, motion, p, params[motion]))
                    bb = _alpha_bbox(img)
                    if bb is None:
                        continue
                    minx, miny = min(minx, bb[0]), min(miny, bb[1])
                    maxx, maxy = max(maxx, bb[2]), max(maxy, bb[3])
            if maxx < 0:  # nothing rendered (shouldn't happen)
                minx, miny, maxx, maxy = 0, 0, rc.W, rc.H
            envs[facing] = (minx, miny, maxx, maxy)
        # one global scale so the character is the same size in every direction
        scale = 1e9
        for (minx, miny, maxx, maxy) in envs.values():
            w = max(1.0, maxx - minx)
            h = max(1.0, maxy - miny)
            scale = min(scale, FRAME_W * margin / w, FRAME_H * margin / h)
        for facing, (minx, miny, maxx, maxy) in envs.items():
            cx = (minx + maxx) / 2.0  # center the whole envelope horizontally
            ground = maxy  # bottom-align the lowest foot of the cycle
            self.anchor[facing] = (cx, ground, scale)
        self._calibrated_for = key

    def render_cell(self, slot: Slot, params: dict[str, MotionParams]) -> Image.Image:
        self._calibrate(params)
        src = slot.src
        rc = self.rigged[src]
        if slot.motion == "idle":
            pose = idle_pose("breath" if slot.pose == 0 else "blink", params["walk"])
        else:
            pose = frame_pose(src, slot.motion, slot.pose, params[slot.motion])
        posed = rc.pose(pose)
        cell = self._anchor(posed, src)
        if slot.mirror:
            cell = cell.transpose(Image.FLIP_LEFT_RIGHT)
        return cell

    def _anchor(self, posed: Image.Image, facing: str) -> Image.Image:
        cx, gy, s = self.anchor[facing]
        sw, sh = max(1, round(posed.width * s)), max(1, round(posed.height * s))
        scaled = posed.resize((sw, sh), Image.LANCZOS)
        out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        px = round(FRAME_W / 2 - cx * s)
        py = round((FRAME_H * (1 - BOTTOM_MARGIN)) - gy * s)
        out.alpha_composite(scaled, (px, py))
        return out

    def render_sheet(self, params: dict[str, MotionParams]) -> Image.Image:
        self._calibrate(params)
        rows = (TOTAL + COLS - 1) // COLS
        sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * rows), (0, 0, 0, 0))
        for slot in CONTRACT:
            cell = self.render_cell(slot, params)
            col, row = slot.index % COLS, slot.index // COLS
            sheet.alpha_composite(cell, (col * FRAME_W, row * FRAME_H))
        return sheet

    # ---- previews -----------------------------------------------------
    def render_anim(self, facing: str, motion: str, params: dict[str, MotionParams]) -> list[Image.Image]:
        poses = [0, 1, 2, 3] if motion == "walk" else [1, 3]
        if facing in ("downright", "downleft", "upright", "upleft") and motion == "walk":
            poses = [0, 1, 3]
        out = []
        for p in poses:
            slot = next(s for s in CONTRACT if s.facing == facing and s.motion == motion and s.pose == p)
            out.append(self.render_cell(slot, params))
        return out


def save_gif(frames: list[Image.Image], path: str, fps: int, checker: bool = True) -> None:
    bg = _checker(FRAME_W, FRAME_H) if checker else Image.new("RGBA", (FRAME_W, FRAME_H), (30, 30, 34, 255))
    flat = [Image.alpha_composite(bg, f).convert("P", palette=Image.ADAPTIVE) for f in frames]
    flat[0].save(path, save_all=True, append_images=flat[1:], duration=int(1000 / max(1, fps)),
                 loop=0, disposal=2)


def _checker(w: int, h: int, sq: int = 8) -> Image.Image:
    im = Image.new("RGBA", (w, h), (210, 210, 214, 255))
    px = im.load()
    for y in range(h):
        for x in range(w):
            if ((x // sq) + (y // sq)) % 2 == 0:
                px[x, y] = (188, 188, 192, 255)
    return im


def atlas(image_name: str, sheet_w: int, sheet_h: int) -> dict:
    frames = {}
    for slot in CONTRACT:
        col, row = slot.index % COLS, slot.index // COLS
        frames[str(slot.index)] = {
            "frame": {"x": col * FRAME_W, "y": row * FRAME_H, "w": FRAME_W, "h": FRAME_H},
            "sourceSize": {"w": FRAME_W, "h": FRAME_H},
            "spriteSourceSize": {"x": 0, "y": 0, "w": FRAME_W, "h": FRAME_H},
        }
    return {"frames": frames, "meta": {"image": image_name, "format": "RGBA8888",
            "size": {"w": sheet_w, "h": sheet_h}, "scale": "1",
            "contract": [s.__dict__ for s in CONTRACT]}}
