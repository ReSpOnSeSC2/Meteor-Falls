"""
rig.py — turn a skeleton + its part masks into a posed RGBA frame.

Each part is a kinematic chain rooted at the pelvis (torso/arms) or at a hip
(legs). A FramePose supplies a rotation per logical joint, a global root
translation (the bob / step displacement) and a back-to-front z-order. We warp
each part layer by its composed forward matrix and alpha-composite.

OBJECT PERMANENCE (the "don't cut up the image" fix)
----------------------------------------------------
A single source drawing has no pixels for the body *behind* a limb, so swinging
a limb away would open a transparent hole and parts would tear at their shared
seam. To hide that we build a solid **body core** — the head+torso+pelvis filled
into one piece, with the crotch gap and any under-arm gaps inpainted from
neighbouring body colour — and draw it *behind* the limbs. Limbs then reveal
body colour instead of holes, and they overlap the core so joints never split.
We can't invent the true occluded detail without generation, but this removes
almost all of the fragmented look.

Logical joint angles a motion may set:
    torso, head, armL, forearmL, armR, forearmR, thighL, shinL, thighR, shinR
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from PIL import Image

from . import geometry as G
from .skeleton import PART_NAMES, Skeleton

# part -> kinematic chain, listed ROOT-first as (pivot joint, angle key)
CHAINS: dict[str, list[tuple[str, str]]] = {
    "torso": [("pelvis", "torso")],
    "head": [("pelvis", "torso"), ("neck", "head")],
    "upperArmL": [("pelvis", "torso"), ("shoulderL", "armL")],
    "lowerArmL": [("pelvis", "torso"), ("shoulderL", "armL"), ("elbowL", "forearmL")],
    "upperArmR": [("pelvis", "torso"), ("shoulderR", "armR")],
    "lowerArmR": [("pelvis", "torso"), ("shoulderR", "armR"), ("elbowR", "forearmR")],
    "thighL": [("hipL", "thighL")],
    "shinL": [("hipL", "thighL"), ("kneeL", "shinL")],
    "thighR": [("hipR", "thighR")],
    "shinR": [("hipR", "thighR"), ("kneeR", "shinR")],
}

DEFAULT_Z = [
    "thighL", "shinL", "thighR", "shinR",
    "torso", "upperArmL", "lowerArmL", "upperArmR", "lowerArmR", "head",
]


@dataclass
class FramePose:
    angles: dict[str, float] = field(default_factory=dict)
    root: tuple[float, float] = (0.0, 0.0)  # global dx, dy in cell px
    zorder: list[str] | None = None


class RiggedCell:
    """Pre-extracted, padded part layers (+ a solid body core) ready to pose."""

    def __init__(self, cell: Image.Image, sk: Skeleton):
        self.sk = sk
        cw, ch = cell.size
        self.padx = int(cw * 0.60)
        self.padt = int(ch * 0.45)
        self.padb = int(ch * 0.18)
        self.W = cw + 2 * self.padx
        self.H = ch + self.padt + self.padb
        self.off = (self.padx, self.padt)
        arr = np.asarray(cell.convert("RGBA"))

        self.layers: dict[str, Image.Image] = {}
        for name in PART_NAMES:
            mask = sk.parts.get(name)
            if mask is None:
                continue
            mask = _grow(mask, 2)  # overlap neighbours so joints never tear
            self.layers[name] = self._place(arr, mask)

        # solid backing core (head+torso+pelvis, holes inpainted) drawn behind
        self.core = self._build_core(arr, sk)

        self.pj = {k: (v[0] + self.padx, v[1] + self.padt) for k, v in sk.joints.items()}

    # --- layer construction -------------------------------------------------
    def _place(self, arr: np.ndarray, mask: np.ndarray) -> Image.Image:
        lay = np.zeros_like(arr)
        lay[mask] = arr[mask]
        canvas = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
        canvas.paste(Image.fromarray(lay, "RGBA"), self.off)
        return canvas

    def _build_core(self, arr: np.ndarray, sk: Skeleton) -> Image.Image:
        """A filled, inpainted trunk so swung limbs reveal body, not holes."""
        H, W = arr[:, :, 3].shape
        head = sk.parts.get("head", np.zeros((H, W), bool))
        torso = sk.parts.get("torso", np.zeros((H, W), bool))
        thighL = sk.parts.get("thighL", np.zeros((H, W), bool))
        thighR = sk.parts.get("thighR", np.zeros((H, W), bool))
        hipY = min(sk.j("hipL")[1], sk.j("hipR")[1])
        footY = max(sk.j("footL")[1], sk.j("footR")[1])
        leglen = max(1.0, footY - hipY)
        ys = np.arange(H)[:, None]
        upper_thigh = (thighL | thighR) & (ys <= hipY + 0.32 * leglen)
        core = head | torso | upper_thigh
        solid = _row_hull(core)  # bridge the crotch + small notches
        rgba = _inpaint_rows(arr, solid)  # fill empty interior with body colour
        return self._place_rgba(rgba)

    def _place_rgba(self, rgba: np.ndarray) -> Image.Image:
        canvas = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
        canvas.paste(Image.fromarray(rgba, "RGBA"), self.off)
        return canvas

    # --- posing -------------------------------------------------------------
    def _matrix(self, part: str, pose: FramePose) -> np.ndarray:
        rots = [G.JointRot(self.pj[piv], pose.angles.get(key, 0.0)) for piv, key in CHAINS[part]]
        dx, dy = pose.root
        return G.translate(dx, dy) @ G.chain_matrix(rots)

    def _torso_matrix(self, pose: FramePose) -> np.ndarray:
        dx, dy = pose.root
        return G.translate(dx, dy) @ G.chain_matrix(
            [G.JointRot(self.pj["pelvis"], pose.angles.get("torso", 0.0))]
        )

    def _warp(self, layer: Image.Image, m: np.ndarray) -> Image.Image:
        return layer.transform(
            (self.W, self.H), Image.AFFINE, G.pil_affine_coeffs(m),
            resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0),
        )

    def pose(self, pose: FramePose) -> Image.Image:
        canvas = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
        # body core first, moving with the torso, so limb gaps reveal body colour
        canvas = Image.alpha_composite(canvas, self._warp(self.core, self._torso_matrix(pose)))
        for part in (pose.zorder or DEFAULT_Z):
            lay = self.layers.get(part)
            if lay is None:
                continue
            canvas = Image.alpha_composite(canvas, self._warp(lay, self._matrix(part, pose)))
        return canvas

    @property
    def foot_baseline(self) -> float:
        return max(self.pj["footL"][1], self.pj["footR"][1])


# --------------------------------------------------------------------------- #
# mask / image helpers
# --------------------------------------------------------------------------- #
def _grow(mask: np.ndarray, r: int = 1) -> np.ndarray:
    out = mask.copy()
    for _ in range(r):
        g = out.copy()
        g[1:, :] |= out[:-1, :]
        g[:-1, :] |= out[1:, :]
        g[:, 1:] |= out[:, :-1]
        g[:, :-1] |= out[:, 1:]
        out = g
    return out


def _row_hull(mask: np.ndarray) -> np.ndarray:
    """Per row, fill between the leftmost and rightmost set pixel (solid trunk)."""
    out = np.zeros_like(mask)
    for y in range(mask.shape[0]):
        idx = np.where(mask[y])[0]
        if len(idx):
            out[y, idx[0] : idx[-1] + 1] = True
    return out


def _inpaint_rows(arr: np.ndarray, region: np.ndarray) -> np.ndarray:
    """RGBA for ``region``: keep opaque source pixels, fill the rest with the
    nearest opaque pixel in the same row (cheap horizontal inpaint)."""
    H, W, _ = arr.shape
    out = np.zeros_like(arr)
    opaque = arr[:, :, 3] > 16
    for y in range(H):
        reg = np.where(region[y])[0]
        if len(reg) == 0:
            continue
        op = np.where(opaque[y])[0]
        if len(op) == 0:
            continue
        for x in reg:
            if opaque[y, x]:
                out[y, x] = arr[y, x]
            else:
                j = int(op[np.argmin(np.abs(op - x))])
                out[y, x] = arr[y, j]
        out[y, reg, 3] = 255
    return out
