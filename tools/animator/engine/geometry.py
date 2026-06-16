"""
geometry.py — affine + forward-kinematics helpers for the rig.

A "pose" is a chain of rotations about joints. We compose them into a single
forward affine matrix per part, then hand the *inverse* to PIL (whose
``Image.transform(AFFINE)`` maps output->input).

All matrices are 3x3 homogeneous; points are (x, y).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np

Point = tuple[float, float]


def identity() -> np.ndarray:
    return np.eye(3, dtype=np.float64)


def translate(dx: float, dy: float) -> np.ndarray:
    m = np.eye(3, dtype=np.float64)
    m[0, 2] = dx
    m[1, 2] = dy
    return m


def rotate_about(angle_deg: float, cx: float, cy: float) -> np.ndarray:
    """Rotation by ``angle_deg`` (CCW, screen-y-down) about (cx, cy)."""
    a = math.radians(angle_deg)
    c, s = math.cos(a), math.sin(a)
    r = np.array([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]], dtype=np.float64)
    return translate(cx, cy) @ r @ translate(-cx, -cy)


def scale_about(sx: float, sy: float, cx: float, cy: float) -> np.ndarray:
    s = np.array([[sx, 0.0, 0.0], [0.0, sy, 0.0], [0.0, 0.0, 1.0]], dtype=np.float64)
    return translate(cx, cy) @ s @ translate(-cx, -cy)


def compose(*mats: np.ndarray) -> np.ndarray:
    """Compose left-to-right: compose(A, B, C) applies C first, then B, then A."""
    out = identity()
    for m in mats:
        out = out @ m
    return out


def apply(mat: np.ndarray, pt: Point) -> Point:
    v = mat @ np.array([pt[0], pt[1], 1.0])
    return (float(v[0]), float(v[1]))


def pil_affine_coeffs(forward: np.ndarray) -> tuple[float, float, float, float, float, float]:
    """Return the 6 coeffs PIL needs (it maps output->input, i.e. the inverse)."""
    inv = np.linalg.inv(forward)
    return (inv[0, 0], inv[0, 1], inv[0, 2], inv[1, 0], inv[1, 1], inv[1, 2])


@dataclass(frozen=True)
class JointRot:
    """A single rotation in a kinematic chain: rotate by ``angle`` about ``pivot``."""

    pivot: Point
    angle: float  # degrees, CCW


def chain_matrix(chain: Sequence[JointRot]) -> np.ndarray:
    """
    Forward matrix for a kinematic chain ordered ROOT -> ... -> LEAF.

    The leaf part rotates about its own joint *inside* every ancestor's rotation,
    so the world transform is  R_root ∘ R_child ∘ ... ∘ R_leaf  (root applied
    last). ``pivot`` coordinates are given in the ORIGINAL (rest) image space; we
    rotate each joint about its rest position, which is correct because the
    accumulated parent rotation is applied on the outside.
    """
    m = identity()
    for j in chain:  # root first
        m = m @ rotate_about(j.angle, j.pivot[0], j.pivot[1])
    return m


def ease_sin(t: float) -> float:
    """0..1 -> smooth 0..1 (sine ease-in-out)."""
    return 0.5 - 0.5 * math.cos(math.pi * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_pt(a: Point, b: Point, t: float) -> Point:
    return (lerp(a[0], b[0], t), lerp(a[1], b[1], t))


def mirror_x_matrix(width: int) -> np.ndarray:
    """Horizontal flip of an image ``width`` px wide."""
    m = np.array([[-1.0, 0.0, float(width - 1)], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
    return m
