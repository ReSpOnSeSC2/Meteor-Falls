# Scale convention — ART_SCALE resolution (canonical)

The native framebuffer is **1600×900** (16:9). Every **runtime pixel quantity** is
routed through one knob, `ART_SCALE` (in
[`src/spritegen/scale.ts`](../src/spritegen/scale.ts)), which is **4** — lifting the
legacy **400×225** base to **1600×900** (`400×225 × 4`). Characters render at
**96×128** (native `24×32 × 4`).

**The iron rule: `ART_SCALE === 1` must stay byte-for-byte identical to the legacy
400×225 game.** So always scale via the helpers (`s(n) === n` at ×1, `TILE_PX === 16`
at ×1) — never hardcode the ×4 numbers.

> ⚠️ Scaling mistakes are **invisible at ×1** (everything is identity) and only break
> at ×4. There is no test that catches a missed site. Convert by careful reading and
> classify every literal deliberately.

## Canonical resolutions

| Thing | Native (×1, generator base) | Runtime (×4, on screen) |
|---|---|---|
| Framebuffer / logical screen | 400×225 | **1600×900** |
| Tile | 16×16 | **64×64** (`TILE_PX`) |
| Hero / NPC character frame | 24×32 | **96×128** |
| Battle bust | 32×32 | **128×128** |
| Stage battler | 28×36 | **112×144** |
| Sport (athlete / golfer) | 32×40 | **128×160** |
| Retro glyph cell | 6×9 | 24×36 |

Full-screen art (boot / title / name-entry / save-slots / links backgrounds and
cutscene / cinematic panels) is authored directly at **1600×900**.

## Imports

```ts
import { s, ART_SCALE, TILE_PX } from '<relative>/spritegen/scale';
```
- `s(n)` — scale a native pixel quantity to runtime.
- `TILE_PX` — runtime tile size (16 × ART_SCALE = **64**). Use for ALL tile↔pixel math.
- `ART_SCALE` — only if you need the raw factor (**4**).

## SCALE these (wrap the literal in `s(...)`, or use `TILE_PX`)

- **Positions** x/y and **sizes** w/h passed to `add.image/sprite/rectangle/graphics`,
  `setPosition`, `setDisplaySize`, `setSize`, `fillRect`, window/box/panel geometry.
- **Offsets** added to positions: `+ 8`, `+ 22`, `- 14`, `- 6` … → `+ s(8)` etc.
  A half-tile centering `+ 8` (= 16/2) is clearest as `+ TILE_PX / 2`.
- **Hitboxes / AABBs / collision rects** `{x,y,w,h}` and collision **radii**.
- **Pixel-based motion**: speed (px/s, px/frame), velocity, acceleration, **gravity**,
  jump/launch velocity, knockback, drift speed, and oscillation **amplitude**
  (`Math.sin(...) * A` → scale `A`).
- **Tile↔pixel**: `* 16` → `* TILE_PX`; `/ 16` → `/ TILE_PX`;
  `Math.floor(px / 16)` → `Math.floor(px / TILE_PX)`. Map bounds `w * 16` → `w * TILE_PX`.
- **Camera** follow-target offsets and `pan()` targets expressed in pixels (NOT zoom).
- **Font metrics in layout math**: the retro glyph cell is **6×9 native**. Any
  `text.length * 6`, `+ 6`, advance widths → `* s(6)`. **BitmapText size args** scale
  too: `bitmapText(x, y, 'retro', t, 6)` → `bitmapText(s(x), s(y), 'retro', t, s(6))`.
- **Map DATA pixel fields read at the consumption site** — `prop.solid.ox/oy/w/h`,
  `door.ox/oy/w/h`, `AUTHORED_WORLD_PROP_DISPLAY_SIZE.w/h`, sight ranges in px. Wrap in
  `s()` **where they are read**. Do NOT edit the data files (`maps*.ts`, the prop record).

## DO NOT scale

- **Counts / indices**: frame counts, lives, lane counts, ember counts, array indices,
  and the autotile expression `... % PATH_VARIANTS * 16 + mask` (that `16` is a
  **mask count**, not pixels — leave it).
- **Time**: ms, seconds, cooldowns, `think` timers, tween/anim **durations**, delays.
- **Unitless ratios**: lerp/follow factors (`0.18`), `setOrigin` fractions
  (`0.5`, `0.6`), alpha, `TURBO_MUL`/`SLIDE_MUL`/lie taxes, probabilities, ease params,
  meter fill fractions.
- **Camera ZOOM factors** (`setZoom(1)`, `zoomTo(1.08)`, any base 3× zoom) — UNCHANGED.
  Framebuffer AND tiles both scale ×4, so the same zoom shows the same tiles.
- **Depth / z-order** values (`setDepth(2)`, `DEPTH_UI`), **RNG seeds**, **palette/color**
  indices, and **tile-UNIT** values in map logic (grid coords stay tile units).
- **Sprite `setScale(...)` multipliers** (e.g. `setScale(5)`, `setScale(1.6)`, the
  `min(1, maxW/spr.width)` enemy-fit ratio). The sprite's TEXTURE is already upscaled
  ×ART_SCALE, so a fixed scale multiplier keeps the same on-screen size — scaling it too
  would double to 16×. Only **positions** and **explicit pixel sizes** scale. Note:
  `setDisplaySize(W, H)` sets an ABSOLUTE px size, so its args DO scale when they are
  native-px literals/data — but `setDisplaySize(this.scale.width, this.scale.height)`
  already reads the runtime screen and needs no change.

## Cross-function contract

Every coordinate/size passed between functions is **runtime px**. Helpers
(`makeWindow`, `makeBox`, `pick`, vitals) keep their signatures; **callers pass
`s()`-scaled values**, and the helper's **own internal native literals** (9-slice corner
sizes, font advance widths, paddings) scale inside the helper. Both sides assume runtime
px, so files convert independently.

## Tilemap (OverworldScene)

```ts
this.make.tilemap({ data, tileWidth: TILE_PX, tileHeight: TILE_PX });
map.addTilesetImage('tiles');           // inherits the map's tile size
const mw = w * TILE_PX, mh = h * TILE_PX; // camera bounds
```
The `tiles` texture is already upscaled to `TILE_PX`-sized (64×64) tiles by the boot seam.

## Quality bar

Fully wired, **no stubs / TODOs / placeholder values**. Match surrounding style.
Comment only the non-obvious scalings (e.g. why a given `16` is or isn't pixels).
The `s()`/`TILE_PX` indirection must hold so `ART_SCALE = 1` still reproduces the
legacy 400×225 game byte-for-byte. Do **not** touch any file outside your scope.
