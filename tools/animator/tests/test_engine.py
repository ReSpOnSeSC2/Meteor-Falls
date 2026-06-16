"""
test_engine.py — Cadence regression tests against the REAL Jay fixture.

No mock data: every test rigs and renders the actual
``assets/art/masters/characters/jay-8angle-transparent.png`` through the engine.

Run from the animator dir:  python -m pytest tests/ -q
"""
from __future__ import annotations

import os
import tempfile

import numpy as np
import pytest
from PIL import Image

from engine.project import Project
from engine.sheet import FRAME_H, FRAME_W, SheetRenderer
from engine.skeleton import PART_NAMES, detect_skeleton
from engine.sourcesheet import DIRECTION_SOURCE, slice_source


def _find_repo_root(start: str) -> str:
    """Walk up until we find assets/art/masters/characters (location-independent)."""
    d = os.path.abspath(start)
    while True:
        if os.path.isdir(os.path.join(d, "assets", "art", "masters", "characters")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            raise RuntimeError("repo root with assets/art/masters/characters not found")
        d = parent


_THIS = os.path.dirname(os.path.abspath(__file__))
JAY = os.path.join(_find_repo_root(_THIS), "assets", "art", "masters",
                   "characters", "jay-8angle-transparent.png")


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #
@pytest.fixture(scope="module")
def source_sheet():
    assert os.path.isfile(JAY), f"Jay fixture missing: {JAY}"
    return slice_source(JAY)


@pytest.fixture(scope="module")
def down_cell(source_sheet):
    compass, _ = DIRECTION_SOURCE["down"]  # "S"
    return source_sheet.cells[compass].image


@pytest.fixture(scope="module")
def down_skeleton(down_cell):
    return detect_skeleton(down_cell, "down")


def _alpha(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("RGBA"))[:, :, 3]


def _nonempty(im: Image.Image, thresh: int = 8) -> bool:
    return bool((_alpha(im) > thresh).any())


# --------------------------------------------------------------------------- #
# Slicing
# --------------------------------------------------------------------------- #
def test_slice_source_returns_eight_cells(source_sheet):
    assert len(source_sheet.cells) == 8


# --------------------------------------------------------------------------- #
# Skeleton anatomy (the core "legs don't start at the chest" fix)
# --------------------------------------------------------------------------- #
def test_down_skeleton_is_frontback(down_skeleton):
    assert down_skeleton.model == "frontback"


def test_down_pelvis_in_lower_body(down_skeleton, down_cell):
    h = down_cell.height
    neck_y = down_skeleton.joints["neck"][1]
    pelvis_y = down_skeleton.joints["pelvis"][1]
    chest_y = down_skeleton.joints["chest"][1]
    # pelvis sits well below the neck (clearly in the lower body, not the chest)...
    assert pelvis_y > neck_y + 0.12 * h
    assert pelvis_y > chest_y  # below the chest, never up in it (the old bug)
    # ...but still in the lower torso, not down at the knees.
    assert pelvis_y < 0.7 * h


def test_down_has_all_sixteen_joints(down_skeleton):
    expected = {
        "headTop", "neck", "chest", "pelvis",
        "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR",
        "hipL", "hipR", "kneeL", "kneeR", "footL", "footR",
    }
    assert set(down_skeleton.joints) == expected
    assert len(down_skeleton.joints) == 16


def test_every_part_has_pixels(down_skeleton):
    for part in PART_NAMES:
        assert part in down_skeleton.parts, f"missing part {part}"
        assert int(down_skeleton.parts[part].sum()) > 0, f"empty part {part}"


def test_old_chest_legs_bug_is_gone(down_skeleton, down_cell):
    """Regression: feet plant near the bottom and thighs live below the neck."""
    h = down_cell.height
    foot_y = min(down_skeleton.joints["footL"][1], down_skeleton.joints["footR"][1])
    assert foot_y > 0.9 * h, "lowest foot joint should be near the cell bottom"

    neck_y = down_skeleton.joints["neck"][1]
    for thigh in ("thighL", "thighR"):
        ys = np.where(down_skeleton.parts[thigh].any(axis=1))[0]
        assert len(ys) > 0
        assert ys.mean() > neck_y, f"{thigh} pixels should sit below the neck"


# --------------------------------------------------------------------------- #
# Full sheet rendering
# --------------------------------------------------------------------------- #
@pytest.fixture(scope="module")
def project():
    with tempfile.TemporaryDirectory(prefix="cadence_test_") as projects_dir:
        proj = Project.create("jay", "Jay", JAY, projects_dir)
        yield proj


def test_full_sheet_is_384x1536_with_46_filled_cells(project):
    sheet_path = project.render_sheet_png()
    with Image.open(sheet_path) as sheet:
        assert sheet.size == (384, 1536)
        cols, rows = 4, 12
        filled = 0
        empties = []
        for idx in range(cols * rows):
            c, r = idx % cols, idx // cols
            cell = sheet.crop((c * FRAME_W, r * FRAME_H,
                               (c + 1) * FRAME_W, (r + 1) * FRAME_H))
            if _nonempty(cell):
                filled += 1
            else:
                empties.append(idx)
    # exactly the 46 contract cells are drawn...
    assert filled == 46, f"expected 46 filled cells, got {filled}"
    # ...and the two trailing pad cells (46, 47) are empty.
    assert 46 in empties and 47 in empties


# --------------------------------------------------------------------------- #
# Mirror correctness (left = flipX of right)
# --------------------------------------------------------------------------- #
def test_left_walk_is_flipx_of_right_walk(project):
    from engine.sheet import CONTRACT
    renderer: SheetRenderer = project.renderer()
    params = project.params

    def cell_for(facing: str, pose: int) -> Image.Image:
        slot = next(s for s in CONTRACT
                    if s.facing == facing and s.motion == "walk" and s.pose == pose)
        return renderer.render_cell(slot, params)

    for pose in (0, 2):
        left = np.asarray(cell_for("left", pose).convert("RGBA"))
        right = np.asarray(cell_for("right", pose).convert("RGBA"))
        right_flipped = right[:, ::-1, :]
        # near-equal (allow a hair of LANCZOS rounding)
        diff = np.abs(left.astype(int) - right_flipped.astype(int))
        assert diff.mean() < 1.0, f"left/right mirror mismatch at pose {pose}"


# --------------------------------------------------------------------------- #
# Anchoring (feet planted across the walk cycle)
# --------------------------------------------------------------------------- #
def test_down_walk_feet_are_planted(project):
    from engine.sheet import CONTRACT
    renderer: SheetRenderer = project.renderer()
    params = project.params

    bottoms = []
    for pose in (0, 1, 2, 3):
        slot = next(s for s in CONTRACT
                    if s.facing == "down" and s.motion == "walk" and s.pose == pose)
        cell = renderer.render_cell(slot, params)
        a = _alpha(cell)
        rows = np.where(a.any(axis=1))[0]
        assert len(rows) > 0
        bottoms.append(int(rows[-1]))

    spread = max(bottoms) - min(bottoms)
    assert spread <= 3, f"foot baseline jitter too large: {spread}px {bottoms}"


# --------------------------------------------------------------------------- #
# Persistence round-trip
# --------------------------------------------------------------------------- #
def test_project_create_load_roundtrips_joints():
    with tempfile.TemporaryDirectory(prefix="cadence_rt_") as projects_dir:
        proj = Project.create("jay", "Jay", JAY, projects_dir)
        before = {f: {j: list(xy) for j, xy in sk.joints.items()}
                  for f, sk in proj.rigs.items()}

        reloaded = Project.load(proj.root)
        after = {f: {j: list(xy) for j, xy in sk.joints.items()}
                 for f, sk in reloaded.rigs.items()}

        assert set(before) == set(after)
        for facing in before:
            assert set(before[facing]) == set(after[facing])
            for joint in before[facing]:
                bx, by = before[facing][joint]
                ax, ay = after[facing][joint]
                assert abs(bx - ax) < 1e-6 and abs(by - ay) < 1e-6
