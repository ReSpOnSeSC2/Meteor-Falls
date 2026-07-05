# PROMPT — build an EXACT in-engine replica of the Otterbrooke reference

> Paste this whole file into a fresh Claude Code session in `C:\Meteor Falls`. It is a
> self-contained build spec: the target, the engine model, the **placement math that
> prevents "houses on the road,"** the exact layout, the asset-authoring (ChatGPT) workflow,
> and the gated verify loop. Follow it literally. Do **not** free-hand coordinates by eye —
> that has failed three times. Read the gridded reference and use the math.

---

## 0. MISSION + THE ONE GOLDEN RULE

Recreate **`assets/art/masters/world/otterbrook-CONCEPT-locked.png`** as a real, playable,
EarthBound-style **TILE map** — the player walks the streets, enters buildings, climbs the
plateau to the crater. It is **NOT** a backdrop image pasted behind gameplay (the user
rejected that) and it is **NOT** a sparse grid of buildings floating in empty grass (the user
rejected that twice). It is a **dense Onett suburb** where **every block is full** and **no
building ever overlaps a street**.

**GOLDEN RULE — build in this order, every time:**
1. **Place BUILDINGS first**, at the exact footprints read off the reference.
2. **Then carve STREETS only into the gaps between buildings.**
3. **Then fill the remaining yard/verge grass** with fences + trees.

Never carve a uniform road grid first and drop buildings into it — that is what put houses on
the road. Streets go where the reference has them, *around* the buildings.

**The measuring tool:** `output/otterbrook_concept_grid.png` is the reference with a **112×168
tile grid** drawn on it and **8-tile lines numbered** (yellow = columns 0–104, cyan = rows
0–160). Open it with the Read tool. Every coordinate below was read off it; re-read it to
place anything not listed. Regenerate it if missing:

```ts
// scratch_grid_overlay.ts — draws the numbered tile grid on the concept; run: npx tsx scratch_grid_overlay.ts
// (recipe: decode the PNG, draw a line every imgW/112 px (cols) and imgH/168 px (rows),
//  heavy red every 8, label col/row numbers every 8 with a tiny 3x5 digit font; write output/otterbrook_concept_grid.png)
```

---

## 1. THE MAP + FILES

- **One map**, id `otterbrook`, **112 wide × 168 tall** tiles (the reference is 1024×1535 →
  same 2:3 aspect; 1 tile ≈ 9.1 source px). Built by `growOtterbrook()` in
  **`src/data/maps.ts`**.
- **Vertical split (concept-locked):** wooded **PLATEAU = rows 0–65** (~40%); **TOWN = rows
  66–167** (~60%). Const `OTTERBROOK_TOWN_BASE = 66`. (City a touch bigger than the hill, per
  the user.)
- `buildOtterbrookTown()` authors the town at y0 (town-relative rows 0–101); `growOtterbrook()`
  copies it into rows 66+ and authors the plateau above it (offset town content by `+66`).
- Runtime **art overrides** = `src/spritegen/authored.ts` (`BASE_FACADE_KEYS`, `WORLD_PROP_KEYS`,
  `AUTHORED_WORLD_PROP_DISPLAY_SIZE`, `OTTERBROOK_LANDMARK_DIMS`). Tile strip =
  `assets/art/world/otterbrook_tiles_16.png` (append-only at the tail; never re-pack).
- Guard test = `src/data/maps_otterbrook.test.ts`. Content gate = `tools/content-validate.ts`.

---

## 2. HOW TILES + FACADES RENDER  ← the physics you must respect

### 2a. Grid chars → tiles (`CHAR_LEGEND` in maps.ts)
`.` grass · `,`/`~`/`f`/`F` grass detail · `R` road · `=` sidewalk · `D` road centre-dash ·
`b` woods/canopy (SOLID; the OTTERBROOK skin renders `b` as the authored dense tree canopy) ·
`e` water (SOLID) · `E` foam lip (SOLID) · `-` picket fence horizontal (SOLID) · `|` picket
fence vertical (SOLID) · `K` cliff face (SOLID) · `^` cliff lip (walkable upper edge) · `T`
stairs (walkable, steps exactly 1 elevation level) · `s`/`S` crater scorch.

### 2b. Roads are 6 rows tall
`roadH(g, yCenters[], xLeft, h=4)` paints, per column, a road **4 rows** tall centred on the
y value, PLUS **a sidewalk row above and below**. So a road with `yCenter=54, h=4` occupies
**rows 52–55 as road** and **rows 51 & 56 as sidewalk** → **a 6-row band, rows 51–56**.
`roadV` is the same, vertical. **Reserve 6 rows for every street.**

### 2c. Facades render as their full drawn texture (this is why buildings landed on roads)
- A facade prop `{sprite, x, y}` renders with its **top-left at tile (x, y)** and spans
  **`texW/64 × texH/64` tiles** (TILE_PX = 64). Its **collision = the drawn texture footprint**
  (ADR-051 — the data `solid` box is ignored for `bldg_*`/landmark facades). A hand `door`
  immunises it from `occupyCity` auto-doors.
- Helper `otterLandmarkBottom(sprite, x, bottomRow)` puts the building's **BASE at `bottomRow`**,
  so it occupies **rows `[bottomRow − texH/64 , bottomRow]`**, left edge at col `x`.
- Helper `otterCentered(sprite, cx, bottomRow)` centres it on col `cx` (`x = cx − texW/128`).
- **Door centre** (px) = `img.x + s(ox) + s(w)/2`, `s()=×4`; a CENTRED door has `ox = texW/8 − w/2`.

### 2d. THE ANTI-"building-on-road" LAW (obey exactly)
For a building that **fronts a horizontal street** whose road center row is `Sc` (6-row band
`Sc−3 … Sc+2`):
- its **base row** `B` must satisfy **`B ≤ Sc − 4`** (base sits ≥1 tile above the upper
  sidewalk `Sc−3`), and
- the whole sprite `[B − texH/64 , B]` must **not** intersect any street band, and
- the tiles **below** the base down to the sidewalk (`B+1 … Sc−3`) must be **walkable** (grass
  `.` / the fence gate) so the door is reachable from the sidewalk.

Because you place buildings FIRST (rule §0), you then run `roadH` at `Sc` only if
`Sc−3 > B` for every building above it — i.e., the street is carved into the *gap*, never
through a footprint. After carving, **assert** no facade footprint cell is `R`/`=`/`D`
(a cheap loop; fail loudly if violated).

---

## 3. THE FACADE CATALOGUE (`OTTERBROOK_LANDMARK_DIMS`, in tiles = px/64)

| sprite | px (w×h) | tiles (w×h) | role in the reference |
|---|---|---|---|
| `bldg_ob_city_hall` | 614×597 | 9.6 × 9.3 | CITY HALL (columns), civic centre |
| `bldg_ob_clinic` | 593×483 | 9.3 × 7.5 | HOSPITAL (red cross) |
| `facade_busdepot` | 520×250 | 8.1 × 3.9 | wide transit / civic block |
| `facade_otter_station` | 476×480 | 7.4 × 7.5 | POLICE station (right) |
| `bldg_ob_apt_green` | 466×638 | 7.3 × 10.0 | tall green apartment (right) |
| `bldg_apartments` | 409×537 | 6.4 × 8.4 | lavender apartment (left) |
| `bldg_brickmore` | 350×541 | 5.5 × 8.5 | brick block → downtown door |
| `house_rex` | 464×466 | 7.25 × 7.3 | JAY's house (plateau) — NOT a landmark; keep data solid+door for the opening pan |
| `house_chad` | 458×466 | 7.2 × 7.3 | CHAD's house (plateau) |
| `house_a` | 415×337 | 6.5 × 5.3 | red gable house |
| `house_b` | 409×373 | 6.4 × 5.8 | blue gable house |
| `bldg_ob_house_c` | 342×355 | 5.3 × 5.6 | suburban house (variant) |
| `bldg_ob_house_green` | 356×349 | 5.6 × 5.5 | suburban house (green roof) |
| `bldg_ob_cottage` | 497×271 | 7.8 × 4.2 | wide low cottage |
| `bldg_ob_workshop` | 427×447 | 6.7 × 7.0 | the plateau SHED (Pemberton) |
| `drugstore` | 311×333 | 4.9 × 5.2 | DRUGSTORE (purple storefront) |
| `bldg_bank` | 307×336 | 4.8 × 5.3 | BANK |
| `bldg_ob_bakery` | 301×335 | 4.7 × 5.2 | BAKERY |
| `bldg_ob_burger` | 298×356 | 4.7 × 5.6 | BURGER |
| `arcade` | 323×328 | 5.0 × 5.1 | ARCADE (purple) |
| `chapel` | 304×389 | 4.75 × 6.1 | chapel |
| `facade_hardware` | (default 5×5) | 5 × 5 | the yellow general store |
| `facade_fillshop` | (default 5×5) | 5 × 5 | the small clinic/pharmacy in the shop row |

Doors (hand-wire each, reciprocate on the interior side — `doorstepOf()` auto-derives most
return doors): `bldg_ob_city_hall`→`otterbrook_cityhall`, `drugstore`→`drugstore_int`,
`facade_busdepot`→`bus_depot_int`, `bldg_brickmore`→`downtown_otterbrook`,
`bldg_ob_burger`→`burger_int`, `bldg_bank`→`bank_int`, `bldg_ob_bakery`→`bakery_int`,
`arcade`→`arcade_int`, `facade_otter_station`→`otter_station`, `chapel`→`chapel_int`,
`house_rex`→`rex_home`, `house_chad`→`chad_home`, each `OTTERBROOK_HOME_SPECS` house → its
`otter_home_*` interior. Un-doored houses auto-generate `otterbrook_unit_*` interiors.

---

## 4. THE EXACT LAYOUT (read footprints off `output/otterbrook_concept_grid.png`)

All coordinates are **absolute concept tiles** (col, row). Town builders work in town-relative
rows = **concept row − 66**. For each building, `bottomRow` = the building's bottom edge in the
reference; centre col = its horizontal centre. Place with `otterCentered(sprite, centreCol,
bottomRow, door)`. **Then** run the street law (§2d).

### 4A. THE PLATEAU (rows 0–65) — already correct; keep as built
- **CRATER** bowl centred ~(72, 11), radius ~22×9 (`s` fill + `S` ember flecks + a thin `.`
  grass rim), the **meteor** `meteor_rock_hickory_hill` at ~(67, 8), top-RIGHT.
- **CAVE** mouth `burrow_mouth` at ~(28, 4), top-LEFT, with a door → `oak_roots` at (28, 12).
- **Green cottage** `bldg_ob_cottage` centred ~(76, 31), upper-RIGHT, on the right path.
- **Shed** `bldg_ob_workshop` centred ~(31, 38), LEFT, on the left path (door → `workshop_int`).
- **JAY** `house_rex` centred ~(50, 53) + **CHAD** `house_chad` centred ~(62, 53), on the mid
  shelf between the paths.
- **3 police** in a carved clearing ~(55–61, 21), just below the crater.
- **Two dirt paths** (`:`): LEFT cave→shed→town (col ~26–30), RIGHT crater→between-houses→town
  (col ~56). **Elevation:** L2 plateau (rows 0–45) → L1 shelf (49–60) → L0 town (66+), with
  `^`/`K` seams at rows 45–48 & 61–65 and `T` stairs on both paths. The whole plateau is `b`
  dense woods except the carved clearings/paths (the canopy skin renders `b` as treetops; a
  DENSE decorative-tree fill on `b` cells makes it read as forest).

### 4B. THE TOWN (concept rows 66–167) — REBUILD to these footprints, buildings-first
Read each footprint off the grid; the centre col / bottom row anchors below are the targets.
**Bands run top→bottom; within a band, buildings sit shoulder-to-shoulder.** Streets get
carved into the gaps AFTER (see §4C).

**Band 1 — top houses (bottoms ~row 77):** red `house_a` @col 31 · blue `house_b` @col 41.

**Band 2 — CIVIC (bottoms ~row 86):** lavender `bldg_apartments` @col 24 · **`bldg_ob_city_hall`
@col 53** · **`bldg_ob_clinic` (hospital) @col 78** · `bldg_brickmore` @col 89 (→downtown) ·
orange `bldg_ob_apt_green`-or-`bldg_brickmore` @col 11. **Fountain** `otter_statue` @(52, 88)
with a paved plaza apron directly below City Hall.

**Band 3 — drugstore row (bottoms ~row 100):** `bldg_ob_house_c` @col 20 · `bldg_ob_house_green`
@col 31 · purple `bldg_ob_house_c` @col 44 · **`drugstore` @col 64** (→drugstore_int) ·
`bldg_ob_cottage` @col 78 · tall green `bldg_ob_apt_green` @col 92.

**Band 4 — THE SHOP DRAG (bottoms ~row 116):** FOR-SALE `house_a` @col 14 (+ "FOR SALE" sign) ·
**`bldg_ob_burger` @col 25** · `facade_hardware` @col 37 · **`bldg_bank` @col 48** ·
**`bldg_ob_bakery` @col 58** · **`arcade` @col 69** · `facade_fillshop` (clinic) @col 80 ·
**`facade_otter_station` (POLICE) @col 93**. **"OTTERBROOKE, OH" highway sign** @(98, 109) at
the east exit. Keep this left→right order EXACTLY.

**Band 5 — residential (bottoms ~row 130):** houses @cols 30, 42, 56, 68, 80, 90
(mix `bldg_ob_house_c`/`_green`/`cottage`/`house_a`/`house_b`).

**Band 6 — residential (bottoms ~row 146):** houses @cols 44, 56, 68, 82 + **POND PARK (SW)**:
duck pond `e`/`E` at cols ~2–20 rows ~132–150, the big oak `tree_c`, gazebo, swing_set, picnic,
ducks; the 3 `OTTERBROOK_HOME_SPECS` homes sit in this quarter.

**Band 7 — residential (bottoms ~row 162):** FOR-SALE #2 `house_a` @col 14 (+ sign, by the pond) ·
houses @cols 48, 60, 72, 84.

### 4C. STREETS (carve into the gaps, §0 rule)
Horizontal avenues run in the ~2-tile gaps BELOW each band's building bases (i.e., street center
`Sc` chosen so every building above has `base ≤ Sc − 4`). Vertical avenues run in the column
gaps the reference shows (~cols 16, 34, 46, 62, 76, 90) — but **shifted to miss footprints**.
Give each a slight sine wobble so it reads organic, add crosswalk `=` at intersections. The
**east highway spur** (rows ~108–112, cols 100–111) exits to `meadow_mile` past the OTTERBROOKE
sign (`OTTERBROOK_EAST_GATE`).

### 4D. YARDS + DENSITY (fill AFTER streets)
- Each **house** gets a **white picket front yard**: `-` fence tiles along the row just below its
  base, with a **3-tile gate gap at the door column** (so the door stays reachable). Optionally
  `|` down the sides.
- **Flanking trees**: a decorative tree (`{sprite:treeSprite(x,y), x, y}` — **NO solid**) at each
  shoulder of every building.
- **Fill pass**: for every grass `.` cell that is **not** a footprint and **not** touching a
  road/sidewalk, place a **decorative tree** at ~45% (hash-based, deterministic); ~14% along the
  verges. Decorative = no solid → they can never strand a door (walkability is the grid alone).
  This kills every "bare grass square." Civic buildings/shops get plaza trees, not fences.
- Dressing: `hydrant`, `mailbox`, `bench`, lampposts along the main drag; the traffic system adds
  moving cars.

---

## 5. ASSET GAPS → ChatGPT IMAGE-GEN WORKFLOW (author only what's missing)

Pipeline (see `docs/ART_PIPELINE.md`): author on **chatgpt.com** (magenta `#FF00FF` bg, EarthBound-
flat, top-down/slightly-oblique) → download → **slice** (`tools/slice-facade-row.js` for facades,
`tools/slice-prop-strip.cjs` for props, `tools/apply-*-kit.ts` for tiles) → **wire** in
`authored.ts` (aspect-match the display `{w,h}`) → pair every tile-strip append with its apply run.
Harvest via in-page `fetch(img.src)→blob→<a download>` (URLs are blocked from direct return).

**Priority asset — the tan EB CLIFFS** (the #1 remaining eyesore; the brown corduroy `K`/`^`):
- Master already on disk: **`assets/art/masters/world/cliff-kit-source.png`** — a 2×2 magenta
  sheet: **grass-topped cliff edge** (top-left), **stacked-stone face** (top-right), **rubble
  base** (bottom-left), **face variant** (bottom-right).
- Slice the 4 cells → append `cliff_stone_top` / `cliff_stone_face` / `cliff_stone_base` to the
  tile strip (clone `tools/apply-canopy-tile.ts`'s strip-write) → add an `OTTERBROOK_TILE_SKIN`
  remap `cliff_face:'cliff_stone_face'` + skin the `^` lip to `cliff_stone_top` and the base row
  to `cliff_stone_base` (mirror `UNDEROAK_TILE_SKIN`). Same solidity as `K`, so collision is
  unchanged. For rounded corners where the plateau's left/right edges meet the front, either
  author corner cells or accept straight runs for v1.

**If a facade/prop is missing or off-model**, author it with a prompt like:
> "A single [BUILDING] for a top-down EarthBound-style town — [colours/features from the
> reference]. Slightly-oblique 2.5D game facade, flat cel shading, crisp 1px outline, warm
> daytime palette. One building, centred, on a solid magenta `#FF00FF` background, no ground/
> shadow beyond the footprint." (ChatGPT refuses "rocket/rocketry" — reword.)

Reference-paste the concept image first to lock the look.

---

## 6. BUILD + VERIFY (gated slices — each ends GREEN + a screenshot vs the grid)

1. `npx tsc --noEmit` → **0 errors**.
2. `npm run validate` → content + **elevation-law** + **reachability** + **door-audit** all green
   (this is what catches a door landing on a solid/road tile — fix every hit).
3. `npx vitest run src/data/maps_otterbrook.test.ts` then the full suite → green (update the guard
   test's pinned coords when you move things).
4. `npm run build` → 0.
5. **Live-verify:** `preview_start meteor-falls`; warp with
   `mfGS.reset(); ['meteor_fell','intro_done','zapper_done','tick_defeated'].forEach(f=>mfGS.data.flags[f]=true); game.scene.start('overworld',{mapId:'otterbrook',x:56*64,y:120*64})`; then
   `cam.setZoom(0.082); cam.centerOn(112*64/2,168*64/2)` for the whole map, and 0.34–0.72 for
   closeups; pump `game.loop.step(performance.now())`. **A fresh `preview_stop`+`preview_start`
   is required after edits** (HMR stalls the loader). Screenshot each district and **overlay-compare
   against `output/otterbrook_concept_grid.png`** — the crater, cave, Jay/Chad, civic core, shop-row
   order, and pond must sit at the same tile coordinates, and **no facade may touch a road tile**.

**Definition of done:** every labelled building sits at its reference footprint, the shop-row
order is exact, every block is packed (no bare grass, no building on a road), the plateau reads
as tan-cliff wooded mesa with the crater/cave, and all gates are green + live-verified against
the grid. Everything stays UNSTAGED; the user drives git.
