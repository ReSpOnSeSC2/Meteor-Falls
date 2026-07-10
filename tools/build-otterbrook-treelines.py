"""Build Otterbrooke's wide treeline props from the authored tree set.

The map uses these transparent, non-colliding strips along the south/front edge
of solid forest cells.  Compositing the existing trees keeps the art perfectly
on-model while replacing thousands of individual display objects with a few
wide forest-wall segments.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PROPS = ROOT / "assets" / "art" / "world" / "props"
TREES = {
    name: Image.open(PROPS / f"{name}.png").convert("RGBA")
    for name in ("tree", "tree_b", "tree_c")
}


def build(name: str, width: int, back: list[tuple[str, int]], front: list[tuple[str, int]]) -> None:
    canvas = Image.new("RGBA", (width, 320), (0, 0, 0, 0))
    # Rear crowns sit ten displayed pixels higher than the front row.  At the
    # declared 40-pixel display height, y=0/80 becomes a clean two-depth wall.
    for key, x in back:
        canvas.alpha_composite(TREES[key], (x, 0))
    for key, x in front:
        canvas.alpha_composite(TREES[key], (x, 80))
    canvas.save(PROPS / f"{name}.png", optimize=True)


build(
    "treeline_2",
    256,
    [("tree_c", 36)],
    [("tree_b", 0), ("tree", 92)],
)
build(
    "treeline_2_b",
    256,
    [("tree", 28)],
    [("tree_c", 0), ("tree_b", 78)],
)
build(
    "treeline_4",
    512,
    [("tree_c", 72), ("tree", 250)],
    [("tree_b", 0), ("tree", 151), ("tree_c", 310)],
)
build(
    "treeline_4_b",
    512,
    [("tree_b", 58), ("tree_c", 244)],
    [("tree", 0), ("tree_c", 146), ("tree_b", 296)],
)
build(
    "treeline_8",
    1024,
    [("tree_c", 76), ("tree_b", 254), ("tree", 438), ("tree_c", 618), ("tree_b", 800)],
    [("tree_b", 0), ("tree", 164), ("tree_c", 326), ("tree_b", 492), ("tree", 660), ("tree_c", 820)],
)
build(
    "treeline_8_b",
    1024,
    [("tree", 70), ("tree_c", 246), ("tree_b", 430), ("tree", 612), ("tree_c", 792)],
    [("tree_c", 0), ("tree_b", 158), ("tree", 324), ("tree_c", 486), ("tree_b", 650), ("tree", 822)],
)
