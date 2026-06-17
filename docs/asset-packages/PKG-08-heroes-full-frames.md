# PKG-08 — Heroes: full overworld + battle frames

The five leads exist as first-pass art; this package brings them to the full
production frame contract (`docs/GRAPHICS_ASSET_ROLLOUT.md`).
Heroes (internal ids): Jay=`rex`, Mia=`faye`, Milo=`milo`, Pippa=`pippa`, Dorin=`dorin`.

## A. Overworld 8-dir — 5 × up to 46 frames, 96×128 runtime (24×32 native × ART_SCALE 4)
Replace the 8-static-facing sheets with **real** frames: 4 cardinal + 4 diagonal
walk loops, the same 8 run loops, idle breathe, idle blink. Facing order:
down, down-left, left, up-left, up, up-right, right, down-right.
Path `assets/art/characters/<jay|mia|milo|pippa|dorin>_anim_46_4x.png`.

## B. Battle busts — 5 × 18 frames, 128×128 runtime (32×32 native × ART_SCALE 4) (4 cols)
Frame order: idleA, idleB, lunge, castA, castB, pray, gadget, rummage, munch,
guard, hurt, nervousA, nervousB, down, cheerA, cheerB, windedA, windedB.
Path `assets/art/busts/<hero>_bust_18_32x32.png`.

## C. Battle-stage battlers — 5 × 14 frames, 112×144 runtime (28×36 native × ART_SCALE 4)
The figures that step on stage to swing/cast/pray/throw/aim. Optionally × weapon
class. Path `assets/art/battlers/<hero>_battler_14_28x36.png`.

## D. Per-hero mourning angels
`angel_<id>` overworld sprite (fallen party trails Jay as haloed angels).

## Acceptance
All 5 heroes at full frame counts for overworld, bust, and battler; angels done.
