"""
skeleton.py — anatomical segmentation of one facing cell into an editable rig.

This replaces the old 5-band ``segment()`` (whose legs began at 0.54*H — i.e. the
chest — and whose arms were thin fixed side slivers). Instead we:

  1. read the silhouette and find real anatomical landmarks from the *shape*
     (neck pinch, shoulder line, the crotch gap where the legs actually split,
     hips, knees, ankles, the arm masses lateral to the torso), and
  2. lay down a 16-joint skeleton of *bones*, then assign every opaque pixel to
     its nearest bone.

Parts (10): head, torso, upperArmL, lowerArmL, upperArmR, lowerArmR,
            thighL, shinL, thighR, shinR.
Joints (16): headTop, neck, chest, pelvis, shoulderL/R, elbowL/R, wristL/R,
             hipL/R, kneeL/R, footL/R.

Because parts are *derived* from joints, the UI only needs to persist joint
positions; dragging a joint re-derives clean masks that move with it.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

import numpy as np
from PIL import Image

Model = Literal["frontback", "side"]
Point = tuple[float, float]

# bone -> (proximal joint, distal joint, capture weight). Lower weight = greedier.
BONES: list[tuple[str, str, str, float]] = [
    ("head", "neck", "headTop", 0.92),
    ("torso", "neck", "pelvis", 1.00),
    ("upperArmL", "shoulderL", "elbowL", 1.14),
    ("lowerArmL", "elbowL", "wristL", 1.14),
    ("upperArmR", "shoulderR", "elbowR", 1.14),
    ("lowerArmR", "elbowR", "wristR", 1.14),
    ("thighL", "hipL", "kneeL", 1.00),
    ("shinL", "kneeL", "footL", 1.00),
    ("thighR", "hipR", "kneeR", 1.00),
    ("shinR", "kneeR", "footR", 1.00),
]

PART_NAMES = [b[0] for b in BONES]


@dataclass
class Skeleton:
    facing: str
    model: Model
    size: tuple[int, int]  # (W, H) of the cell the joints live in
    joints: dict[str, list[float]]  # name -> [x, y]
    parts: dict[str, np.ndarray] = field(default_factory=dict)  # name -> bool mask
    bbox: tuple[int, int, int, int] = (0, 0, 0, 0)  # x0,y0,x1,y1

    # ---- serialization (joints only; masks are derived) ----------------
    def to_dict(self) -> dict:
        return {
            "facing": self.facing,
            "model": self.model,
            "size": list(self.size),
            "joints": {k: [float(v[0]), float(v[1])] for k, v in self.joints.items()},
            "bbox": list(self.bbox),
        }

    @classmethod
    def from_dict(cls, d: dict, cell: Image.Image | None = None) -> "Skeleton":
        sk = cls(
            facing=d["facing"],
            model=d.get("model", "frontback"),
            size=tuple(d["size"]),  # type: ignore[arg-type]
            joints={k: [float(v[0]), float(v[1])] for k, v in d["joints"].items()},
            bbox=tuple(d.get("bbox", (0, 0, 0, 0))),  # type: ignore[arg-type]
        )
        if cell is not None:
            sk.parts = assign_parts(cell, sk)
        return sk

    def j(self, name: str) -> Point:
        v = self.joints[name]
        return (v[0], v[1])


# --------------------------------------------------------------------------- #
# Silhouette analysis
# --------------------------------------------------------------------------- #
def _mask(cell: Image.Image, thresh: int = 24) -> np.ndarray:
    return np.asarray(cell.convert("RGBA"))[:, :, 3] > thresh


def _row_stats(m: np.ndarray):
    H, W = m.shape
    width = m.sum(axis=1)
    xmin = np.full(H, -1)
    xmax = np.full(H, -1)
    cx = np.zeros(H)
    biggest_gap = np.zeros(H)
    for y in range(H):
        idx = np.where(m[y])[0]
        if len(idx) == 0:
            continue
        xmin[y], xmax[y] = idx[0], idx[-1]
        cx[y] = idx.mean()
        if len(idx) > 1:
            d = np.diff(idx)
            biggest_gap[y] = d.max() - 1  # px of empty span inside the silhouette
    return width, xmin, xmax, cx, biggest_gap


def _detect_crotch(m: np.ndarray, y0: int, y1: int, biggest_gap: np.ndarray, width: np.ndarray) -> int | None:
    """Highest row in the lower body where a sustained two-leg gap opens."""
    H = m.shape[0]
    start = int(y0 + 0.42 * (y1 - y0))
    end = int(y1 - 0.04 * (y1 - y0))
    for y in range(start, end):
        w = width[y]
        if w <= 0:
            continue
        # a real crotch gap is a meaningful fraction of the body width, and it
        # must persist for a few rows (not a single-row notch).
        if biggest_gap[y] >= max(2.0, 0.16 * w):
            ahead = biggest_gap[y : min(end, y + 4)]
            if (ahead >= 2.0).sum() >= 2:
                return y
    return None


# the model follows the KNOWN facing: profiles read as a single leg column,
# everything else (front / back / 3-4 diagonals) shows two separable legs.
SIDE_FACINGS = {"left", "right"}


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def detect_skeleton(cell: Image.Image, facing: str) -> Skeleton:
    """Heuristic anatomical landmark detection -> a full joint set.

    Landmark heights come from chibi proportion priors (these are big-headed
    kids: head ~ the top 40%), nudged toward silhouette features but clamped so
    a noisy stylized sprite can never push e.g. the pelvis up into the chest.
    """
    m = _mask(cell)
    H, W = m.shape
    width, xmin, xmax, cx, gap = _row_stats(m)
    ys = np.where(width > 0)[0]
    if len(ys) == 0:
        raise ValueError("empty cell")
    y0, y1 = int(ys[0]), int(ys[-1])
    bh = y1 - y0
    bodycx = float(cx[y0:y1].mean())
    model: Model = "side" if facing in SIDE_FACINGS else "frontback"

    # --- neck: silhouette pinch, clamped into the chibi neckline band -----
    nb0, nb1 = int(y0 + 0.30 * bh), int(y0 + 0.46 * bh)
    band = width[nb0:nb1].copy().astype(float)
    band[band == 0] = 1e9
    neck_y = nb0 + int(np.argmin(band)) if nb1 > nb0 else int(y0 + 0.38 * bh)
    neck_y = int(_clamp(neck_y, y0 + 0.34 * bh, y0 + 0.44 * bh))

    # --- shoulders: widest row just under the neck ------------------------
    sb0, sb1 = neck_y, int(neck_y + 0.14 * bh) + 1
    shoulder_y = sb0 + int(np.argmax(width[sb0:sb1])) if sb1 > sb0 else neck_y + 2
    sh_l, sh_r = int(xmin[shoulder_y]), int(xmax[shoulder_y])

    # --- crotch / pelvis --------------------------------------------------
    crotch = _detect_crotch(m, y0, y1, gap, width) if model == "frontback" else None
    if crotch is None:
        crotch_y = int(_clamp(y0 + 0.60 * bh, y0 + 0.54 * bh, y0 + 0.66 * bh))
        split_x = bodycx
    else:
        crotch_y = int(_clamp(crotch, y0 + 0.54 * bh, y0 + 0.68 * bh))
        row = np.where(m[crotch_y])[0]
        d = np.diff(row)
        gi = int(np.argmax(d))
        split_x = (row[gi] + row[gi + 1]) / 2.0

    pelvis_y = int(crotch_y - 0.03 * bh)
    pelvis_y = max(pelvis_y, shoulder_y + 2)

    # --- legs -------------------------------------------------------------
    leg_top = pelvis_y
    leg_len = max(1, y1 - leg_top)
    knee_y = leg_top + int(0.46 * leg_len)
    ankle_y = leg_top + int(0.82 * leg_len)
    foot_y = y1

    if model == "frontback":
        # centers of the left/right leg blobs a little below the crotch
        probe = min(y1 - 1, crotch_y + max(2, int(0.06 * bh)))
        left_idx = np.where(m[probe][: int(split_x)])[0]
        right_idx = np.where(m[probe][int(split_x) :])[0]
        legL_cx = float(left_idx.mean()) if len(left_idx) else split_x - 0.12 * (sh_r - sh_l)
        legR_cx = float(right_idx.mean() + split_x) if len(right_idx) else split_x + 0.12 * (sh_r - sh_l)
        # enforce a believable minimum stance width (hips don't collapse to center)
        min_sep = 0.16 * (sh_r - sh_l + 1)
        if legR_cx - legL_cx < min_sep:
            legL_cx, legR_cx = split_x - min_sep / 2, split_x + min_sep / 2
        # foot centers (toes can extend); recompute near the ankle
        footL_cx = _blob_center(m, ankle_y, foot_y, None, int(split_x)) or legL_cx
        footR_cx = _blob_center(m, ankle_y, foot_y, int(split_x), None) or legR_cx
    else:
        # side: two legs nearly coincident, slight fore/aft split
        off = 0.10 * (xmax[shoulder_y] - xmin[shoulder_y] + 1)
        legL_cx, legR_cx = bodycx - off, bodycx + off
        footL_cx, footR_cx = legL_cx, legR_cx

    # --- arms: lateral masses across the torso band -----------------------
    arm_top = int(shoulder_y + 0.02 * bh)
    arm_bot = pelvis_y
    if model == "frontback":
        armL_x = (sh_l + bodycx) / 2.0
        armR_x = (sh_r + bodycx) / 2.0
        # refine: outermost opaque column over the torso band on each side
        sl = [xmin[y] for y in range(arm_top, arm_bot) if xmin[y] >= 0]
        sr = [xmax[y] for y in range(arm_top, arm_bot) if xmax[y] >= 0]
        if sl:
            armL_x = float(np.percentile(sl, 25)) + 0.04 * bh
        if sr:
            armR_x = float(np.percentile(sr, 75)) - 0.04 * bh
    else:
        armL_x = bodycx - 0.04 * bh
        armR_x = bodycx + 0.04 * bh
    arm_len = max(1, arm_bot - arm_top)
    elbowL_y = arm_top + int(0.52 * arm_len)
    elbowR_y = elbowL_y
    wrist_y = arm_bot - int(0.04 * bh)

    headTop = (bodycx, float(y0))
    neck = (bodycx, float(neck_y))
    chest = (bodycx, float((neck_y + pelvis_y) / 2))
    pelvis = (split_x if model == "frontback" else bodycx, float(pelvis_y))

    joints: dict[str, list[float]] = {
        "headTop": [headTop[0], headTop[1]],
        "neck": [neck[0], neck[1]],
        "chest": [chest[0], chest[1]],
        "pelvis": [pelvis[0], pelvis[1]],
        "shoulderL": [float(sh_l + 0.10 * (sh_r - sh_l)), float(shoulder_y)],
        "shoulderR": [float(sh_r - 0.10 * (sh_r - sh_l)), float(shoulder_y)],
        "elbowL": [armL_x, float(elbowL_y)],
        "elbowR": [armR_x, float(elbowR_y)],
        "wristL": [armL_x, float(wrist_y)],
        "wristR": [armR_x, float(wrist_y)],
        "hipL": [legL_cx, float(leg_top)],
        "hipR": [legR_cx, float(leg_top)],
        "kneeL": [legL_cx, float(knee_y)],
        "kneeR": [legR_cx, float(knee_y)],
        "footL": [footL_cx, float(foot_y)],
        "footR": [footR_cx, float(foot_y)],
    }
    sk = Skeleton(facing=facing, model=model, size=(W, H), joints=joints,
                  bbox=(0, y0, 0, y1))
    # proper bbox
    cols = np.where(m.any(0))[0]
    sk.bbox = (int(cols[0]), int(y0), int(cols[-1]) + 1, int(y1) + 1)
    sk.parts = assign_parts(cell, sk)
    return sk


def _blob_center(m: np.ndarray, ya: int, yb: int, xa: int | None, xb: int | None) -> float | None:
    sub = m[ya : yb + 1, (xa or 0) : (xb if xb is not None else m.shape[1])]
    xs = np.where(sub.any(0))[0]
    if len(xs) == 0:
        return None
    return float(xs.mean() + (xa or 0))


# --------------------------------------------------------------------------- #
# Part assignment: nearest weighted bone
# --------------------------------------------------------------------------- #
def _seg_dist(px: np.ndarray, py: np.ndarray, ax: float, ay: float, bx: float, by: float) -> np.ndarray:
    """Vectorised distance from points to segment AB."""
    abx, aby = bx - ax, by - ay
    L2 = abx * abx + aby * aby
    if L2 < 1e-6:
        return np.hypot(px - ax, py - ay)
    t = ((px - ax) * abx + (py - ay) * aby) / L2
    t = np.clip(t, 0.0, 1.0)
    cxp = ax + t * abx
    cyp = ay + t * aby
    return np.hypot(px - cxp, py - cyp)


def assign_parts(cell: Image.Image, sk: Skeleton) -> dict[str, np.ndarray]:
    """Assign every opaque pixel to its nearest (weighted) bone."""
    m = _mask(cell)
    H, W = m.shape
    ys, xs = np.where(m)
    px = xs.astype(np.float64)
    py = ys.astype(np.float64)

    best = np.full(px.shape, np.inf)
    who = np.full(px.shape, -1, dtype=np.int32)
    for bi, (name, p0, p1, weight) in enumerate(BONES):
        a = sk.j(p0)
        b = sk.j(p1)
        d = _seg_dist(px, py, a[0], a[1], b[0], b[1]) * weight
        upd = d < best
        best[upd] = d[upd]
        who[upd] = bi

    parts: dict[str, np.ndarray] = {name: np.zeros((H, W), dtype=bool) for name, *_ in BONES}
    names = [b[0] for b in BONES]
    for bi, name in enumerate(names):
        sel = who == bi
        parts[name][ys[sel], xs[sel]] = True
    return parts


def overlay(cell: Image.Image, sk: Skeleton) -> Image.Image:
    """Debug visual: tint each part, draw bones + joints. Returns RGBA."""
    base = cell.convert("RGBA")
    arr = np.asarray(base).astype(np.float32)
    tint = {
        "head": (255, 210, 90),
        "torso": (90, 200, 255),
        "upperArmL": (255, 120, 120),
        "lowerArmL": (255, 60, 60),
        "upperArmR": (120, 255, 140),
        "lowerArmR": (40, 200, 90),
        "thighL": (200, 120, 255),
        "shinL": (150, 60, 230),
        "thighR": (255, 170, 80),
        "shinR": (230, 120, 30),
    }
    out = arr.copy()
    for name, mask in sk.parts.items():
        col = np.array(tint.get(name, (255, 255, 255)), dtype=np.float32)
        sel = mask & (arr[:, :, 3] > 24)
        out[sel, :3] = arr[sel, :3] * 0.45 + col * 0.55
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGBA")
    from PIL import ImageDraw

    dr = ImageDraw.Draw(img)
    for name, p0, p1, _ in BONES:
        a = sk.j(p0)
        b = sk.j(p1)
        dr.line([a, b], fill=(20, 20, 20, 255), width=1)
    for nm, (x, y) in sk.joints.items():
        r = 2.5
        dr.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
    return img
