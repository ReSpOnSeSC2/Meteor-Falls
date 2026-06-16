"""
sourcesheet.py — slice an 8-angle character source row into per-facing cells and
map them onto the game's directions.

An 8-angle turnaround is laid out left->right as the standard compass order used
by the project's masters (``assets/art/masters/characters/*-8angle-*.png``):

    index 0 1 2  3  4 5  6 7
    facing S SW W  NW N NE E SE

The game's animation contract works in screen directions:

    down=S  up=N  right=E  left=W
    downright=SE  downleft=SW  upright=NE  upleft=NW

The game derives left-facings by horizontally mirroring the right-facings
(``left = flipX(right)`` etc.). We follow that contract: the canonical set the
user actually rigs is  down, up, right, downright, upright  — the three left
facings are produced by mirroring at render time. The real W / SW / NW source
cells are still sliced and kept so the UI can opt to rig them directly.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from PIL import Image

# compass order of an 8-angle source row
COMPASS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"]

# game direction  ->  (source compass cell, mirror?)
#   the canonical rigged facings map to a real cell with mirror=False;
#   the mirrored facings point at their right-hand twin with mirror=True.
DIRECTION_SOURCE: dict[str, tuple[str, bool]] = {
    "down": ("S", False),
    "up": ("N", False),
    "right": ("E", False),
    "downright": ("SE", False),
    "upright": ("NE", False),
    "left": ("E", True),  # mirror of right
    "downleft": ("SE", True),  # mirror of downright
    "upleft": ("NE", True),  # mirror of upright
}

# the five facings a user must actually rig; the rest are mirrors
CANONICAL_DIRS = ["down", "up", "right", "downright", "upright"]
ALL_DIRS = ["down", "left", "right", "up", "downright", "downleft", "upright", "upleft"]


@dataclass
class Cell:
    """One trimmed facing cut out of the source row."""

    compass: str
    image: Image.Image  # trimmed RGBA
    src_x0: int
    src_x1: int
    width: int
    height: int


@dataclass
class SourceSheet:
    path: str
    size: tuple[int, int]
    cells: dict[str, Cell] = field(default_factory=dict)  # keyed by compass

    def cell_for_direction(self, direction: str) -> tuple[Cell, bool]:
        compass, mirror = DIRECTION_SOURCE[direction]
        return self.cells[compass], mirror


def _alpha(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("RGBA"))[:, :, 3]


def _trim(im: Image.Image, thresh: int = 12) -> Image.Image:
    a = _alpha(im)
    ys, xs = np.where(a > thresh)
    if len(xs) == 0:
        return im
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def slice_source(path: str, *, thresh: int = 12, min_w: int = 8) -> SourceSheet:
    """
    Split an 8-angle source row into trimmed RGBA cells by empty alpha columns.

    Robust to uneven spacing: we find runs of columns that contain *any* opaque
    pixel and treat each wide-enough run as one facing.
    """
    src = Image.open(path).convert("RGBA")
    alpha = _alpha(src)
    nonempty = (alpha > thresh).sum(axis=0) > 0

    runs: list[tuple[int, int]] = []
    start: int | None = None
    for x, on in enumerate(nonempty):
        if on and start is None:
            start = x
        elif not on and start is not None:
            runs.append((start, x))
            start = None
    if start is not None:
        runs.append((start, len(nonempty)))
    runs = [r for r in runs if r[1] - r[0] >= min_w]

    sheet = SourceSheet(path=path, size=src.size)
    for i, (x0, x1) in enumerate(runs):
        compass = COMPASS[i] if i < len(COMPASS) else f"d{i}"
        trimmed = _trim(src.crop((x0, 0, x1, src.height)), thresh)
        sheet.cells[compass] = Cell(
            compass=compass,
            image=trimmed,
            src_x0=int(x0),
            src_x1=int(x1),
            width=trimmed.width,
            height=trimmed.height,
        )
    return sheet
