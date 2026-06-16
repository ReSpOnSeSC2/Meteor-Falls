"""
Cadence — the Meteor Falls character rig engine.

Turns ONE 8-angle character source sheet into the game's exact 46-frame runtime
animation sheet (``*_anim_46_4x.png``) by building an anatomical skeleton out of
the character's own pixels and posing it — no generative AI, no paid APIs, fully
offline (Pillow + numpy).

Modules
-------
geometry     : affine / forward-kinematics math helpers
sourcesheet  : slice an 8-angle source row into per-facing cells + direction map
skeleton     : anatomical segmentation -> editable ~16-joint / 12-part Skeleton
rig          : extract part layers and pose the skeleton into a single frame
motion       : motion library (walk/run/diag/idle) + per-frame joint poses
sheet        : assemble the 46-frame sheet, slice/scale, atlas, preview gif
project       : Project orchestration (create / segment / edit / render / export)

The 46-frame contract (mirrors src/spritegen/characters.ts, ADR-009/040/096/101):
     0-15  walk   (down x4, left x4, right x4, up x4)
    16-23  run    (down x2, left x2, right x2, up x2)
    24-35  diag walk (downright x3, downleft x3, upright x3, upleft x3)
    36-43  diag run  (downright x2, downleft x2, upright x2, upleft x2)
       44  idle breath
       45  idle blink
"""
from __future__ import annotations

__all__ = [
    "geometry",
    "sourcesheet",
    "skeleton",
    "rig",
    "motion",
    "sheet",
    "project",
]

__version__ = "1.0.0"
