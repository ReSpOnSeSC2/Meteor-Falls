# Otterbrook = Onett (Map #1) — Asset Manifest

> **Historical asset-build ledger—superseded by ADR-145 (2026-07-14).** The
> prompts, batches, and locked concept remain provenance; their unchecked
> status is not a current gap claim. Production uses unified Otterbrook and the
> `oak_roots`/`oak_hollow`/`oak_heart` route, not proposed `boss_hill` or a live
> downtown annex. Titanic Tick is the 200-HP Hush-morning boss in the deepest
> Hickory Hill cave (`oak_heart`). Current
> runtime/master registration, native-detail contacts, and automated asset
> contracts—not the historical queue below—decide whether an asset is complete.

> **The locked concept illustration is the canonical visual target.** File:
> `otterbrook_USER_locked.png` — "Otterbrooke, OH — town under the stars": rounded
> brown Onett cliffs framing a wooded meteor-hill (top-left cave mouth, top-right
> crater with a cracked meteor-rock sphere + 3 figures, a fenced hillside workshop,
> two mid-hill houses purple+blue) descending into an Onett-downtown GRID town
> (columned City Hall + fountain, red-cross clinic/hospital, labeled
> DRUGSTORE/BURGER/BANK/BAKERY/ARCADE/POLICE, office/apartment blocks, ~18–20 houses,
> an "OTTERBROOKE, OH" highway sign, two FOR SALE lots, a lower-left Pond Park with a
> big oak + gazebo + ducks + windmill).
>
> **Every asset below is authored FRESH in the correct GAME FORMAT** (top-down tile /
> EarthBound-oblique facade / prop sprite / character walk-sheet / water-shore
> autotile) **using the locked image as the STYLE + DESIGN reference only** — never a
> crop of the oblique illustration. Art is AUTHORED via ChatGPT (`chatgpt.com` image
> generation) per `CLAUDE.md` and `docs/ART_PIPELINE.md`; **the user approves each
> render.** `src/spritegen/` stays FROZEN (boot fallback). New tile-family cells
> APPEND at the TILESET tail (BAK-first, never re-pack); every tail append MUST be
> paired with its apply/sync run or `authored_assets.test.ts`
> (`strip.w === TILESET.length*64`) fails. This manifest is the single production
> spec that merges the five category inventories (terrain / foliage / facades / props
> / characters) into one build.

---

## Locked decisions (user, 2026-07-03)

- **Palette = DAYTIME masters; lighting is RUNTIME.** Author every asset in its clean, warm
  DAYTIME Onett palette. The three lighting states are engine overlays (the existing hush-dark
  veil), NOT baked into art: (1) NIGHT opening sequence; (2) DAYTIME + HAZE from after the opening
  until the Titanic Tick is beaten; (3) clear DAY after. → no night/haze in any master; the locked
  "under the stars" image is the reference for LAYOUT + building identity, not color.
- **Labels = BAKE the iconic ones** into shop facades, POLICE, the "OTTERBROOKE, OH" highway sign,
  and FOR-SALE signs — bold + legible at 64px. (Resolves §8 Q2.)
- **Boss routing = CAVE ON THE HILL** (top-left) as the locked image; the crater is separate
  (top-right). The hill cave-mouth is the door into the giant-step cave/boss — NOT a city-spot
  entrance. → update `OTTERBROOK_ONETT_REBUILD.md` §1/§3 (boss via the hill cave; place `cave_mouth`
  once, on the hill). (Resolves §8 Q1/Q7.)
- **Remaining §8 defaults (adjust on request):** Q4 house types = 4 base geometries × ~2 recolors;
  Q5 conditional polish (heart_oak hero, lily_pad, lit-lamp toggle, spinning windmill) = ship reused
  `tree_c` + static first, add polish later; Q6 ejecta stones = ONE shared key set; Q8 apartment =
  reuse re-authored `bldg_brickmore`.

---

## Build progress

- **Batch 2 (FACADES) — DONE (2026-07-03).** All 19 building facades authored from the locked
  image via ChatGPT (5 sheets → `masters/world/otterbrook-{shops,civic,houses,tract,apts}-source.png`),
  sliced (`tools/slice-facade-row.js --bg=FF00FF`), wired into `BASE_FACADE_KEYS`. 9 new keys
  (`bldg_ob_bakery/burger/city_hall/clinic/house_green/workshop/house_c/cottage/apt_green`) + 10
  overwritten on-model (`drugstore`, `bldg_bank`, `arcade`, `facade_otter_station`, `house_rex`,
  `house_chad`, `house_a`, `house_b`, `bldg_apartments`, `bldg_brickmore`). Gate: tsc 0 · validate 0
  · game boots clean (all facades bundle + load, no errors).

## NEW SCOPE — building INTERIORS (user directive, 2026-07-03)

Every PLACED building needs a **detailed, unique, often MULTI-ROOM interior that matches its
purpose**: drugstore = pharmacy shelves + soda-fountain counter; bank = teller line + vault; bakery
= display cases + kitchen; burger = diner + kitchen; arcade = cabinet rows; city hall = lobby +
offices + council chamber; clinic = waiting + exam rooms + ward; police = front desk + holding cells;
houses = living/kitchen/bedrooms; apartments = stairwell + units; Pemberton's workshop = a cluttered
rocketry lab. This is a major content phase = author interior furniture + interior tile skins + build
the interior MAPS (`growInterior`) + wire each facade door → its interior. A dedicated **interior
manifest** follows (pending the interior-system recon).

---

## Table of contents

1. [Terrain tiles](#1--terrain-tiles)
2. [Foliage & nature](#2--foliage--nature)
3. [Building facades](#3--building-facades)
4. [Props & set-pieces](#4--props--set-pieces)
5. [Characters / NPCs](#5--characters--npcs)
6. [Reuse ledger](#6--reuse-ledger)
7. [Batched build order](#7--batched-build-order)
8. [Open questions for the user](#8--open-questions-for-the-user)

---

## 1 · Terrain tiles

Scope: the ground the town sits on. Runtime tile = **16×16 native → 64×64 at
`ART_SCALE=4`**; the apply-kit area-averages masters down to 64px columns, so every
prompt targets a crisp 64px-final read (chunky, bold-outlined, 3–4-step dithered EB
"crayon" ramps). All writes target the one shared runtime strip
`assets/art/world/otterbrook_tiles_16.png`, surgically at `idxOf(name)*64`. 47-blob
families are authored as ONE continuous reference-block sliced into the Wang cases
(seamless by construction). Machinery = clones of `tools/apply-cliff-kit.ts` /
`tools/apply-eb-tile-kit.ts` (magenta `spans()` slicer → `scaleCellOpaque` /
`scaleCellAlpha` → BAK-first surgical write → proof PNG).

### T1 · Cliff face — `cliff_<0..46>`
- **Pipeline:** tile-kit-47blob (rounded brown terrace wall).
- **Master:** ONE continuous reference-block ≈ **1536×1536** — a 5×5 grass-island-in-cliff showing every outer corner, inner elbow, straight run, single nub, mated in-context; magenta-gridded.
- **REUSE / AUTHOR:** **AUTHOR (reference-paste).** Base `cliff_face` + 4-band overlay `cliff_top/mid_a/mid_b/base` already exist (single-cell installs, `tiles.ts:980, 1019–1022`); the 47-blob upgrade is the new work. Reference-paste `C:/Users/jay19/Downloads/onett-cliff-continuous.png` (user-approved rounded-brown look, dated today) — do NOT author from zero.
- **ChatGPT prompt (paste `onett-cliff-continuous.png` as reference):**
  > Pixel-art terrain autotile block, top-down JRPG map tile, EarthBound/Mother-2 look — use the attached rounded-brown-cliff image as the EXACT style reference (same crayon browns, rounded blobby rock, dithered 3–4 step shading, bold soft outline, NO hard grid lines). Draw ONE continuous scene on a MAGENTA (#FF00FF) grid: a kidney-shaped island of green mown grass sitting ON TOP of a rounded brown rock cliff, so the single image contains — in context and seamlessly mated — every edge case: straight cliff runs (N/E/S/W), rounded OUTER corners, INNER elbow corners, and lone single-tile nubs. The cliff face reads as a banded wall: a grassy overhang lip at top, 2 rows of rounded rock strata in the middle, scree + a soft ground-shadow at the base. Flat noise-free interiors, all detail in the rounded edges. Magenta gridlines separate a 5×5 layout of cells; magenta background only, no text, no characters.
- **Wiring:** append `cliff_<0..46>` (`solid:true`, `make:pyramidWall`) at TILESET tail after `hedge_*`; clone `apply-cliff-kit.ts` → `apply-cliff-47.ts` (widen `spans()` to 5×5, keep `scaleCellOpaque`, BAK `.pre-cliff47.bak.png`, grow strip to `TILESET.length*64`, write at each `idxOf`, dump `output/cliff47_proof.png`). Blob index picked in `buildElevationOverlay` (`OverworldScene.ts:1148`).

### T2 · Cliff-lip — `cliff_lip_<0..46>`
- **Pipeline:** tile-kit-47blob (grass-over-rock rounded rim).
- **Master:** fold into T1's block (author the lip AS the top band of the same island so lip and face mate) — recommended, one sheet.
- **REUSE / AUTHOR:** **AUTHOR (upgrade).** `cliff_lip` entry exists (`tiles.ts:981`, walkable `make:grassBase`, single cell); upgrade to 47-blob, ideally inside T1's sheet.
- **ChatGPT prompt (only if authored separately):**
  > Pixel-art terrain autotile block, top-down EarthBound map tile — same crayon style as the attached cliff reference. ONE continuous scene on a MAGENTA (#FF00FF) 5×5 grid: the ROUNDED BLUFF EDGE where flat green grass meets the drop-off — a soft brown rounded rim of exposed rock capping the grass, curving around every case (straight rim runs on all 4 sides, rounded outer corners, inner corners, single points). Walkable grass on the high side. Rounded, blobby, dithered — no straight grid edges. Magenta gridlines + magenta background, no text.
- **Wiring:** append `cliff_lip_<0..46>` (`solid:false`) at tail; same apply-kit run using `scaleCellAlpha` (grass composites over ground). Grid char `^`.

### T3 · Grass fields — `grass_a` ✅ · `grass_b` ✅ · `grass_tuft` ✅ · `grass_wild` 🆕 · `tallgrass` 🆕
- **Pipeline:** tile-skin / self-tiling flat cell.
- **Master:** a 4-cell strip ≈ **512×128** (author only the two new tints + a fresh tuft).
- **REUSE / AUTHOR:** **REUSE town lawn, AUTHOR wild tint + weeds.** `grass_a/b/tuft` (`tiles.ts:805–807`) are the mown town lawn — reuse. The concept's darker, bluer WILD hill grass and walk-through weeds are the gap; `grass_wild` can be a cheap darkened skin of `grass_a` (universal-geometry / per-region-recolor).
- **ChatGPT prompt:**
  > Pixel-art top-down grass tiles, EarthBound/Mother-2 crayon look, a horizontal strip of 4 seamless 1:1 tiles on a MAGENTA (#FF00FF) grid: (1) bright mown lawn green, near-flat with a faint 2-tone dither; (2) the same lawn with ONE tiny sparse grass tuft; (3) DARKER, bluer WILD hill grass (unmown, wooded-slope tone); (4) tall walk-through weeds — a cluster of upright dithered grass blades on the wild-grass base. Flat noise-free interiors, all detail deliberate and sparse, must tile seamlessly edge-to-edge. Magenta gridlines + background, no text.
- **Wiring:** append `grass_wild` + `tallgrass` (`solid:false`) at tail; add columns via an `apply-eb-tile-kit`-style put. Town = `grass_a/b`; hill = `grass_wild`; weeds placed by the builder.

### T4 · Forest floor — `forest_floor` 🆕 (+ `forest_floor_leaf` 🆕)
- **Pipeline:** tile-skin / self-tiling (under-canopy ground).
- **Master:** 2-cell strip ≈ **256×128**.
- **REUSE / AUTHOR:** **AUTHOR fresh.** No woodland-floor tile exists (only `jungle_floor`, wrong biome). The hill is wall-to-wall canopy; the ground between trees needs a dim leaf-litter tile.
- **ChatGPT prompt:**
  > Pixel-art top-down forest-floor ground tiles, EarthBound/Mother-2 crayon look — 2 seamless 1:1 tiles on a MAGENTA (#FF00FF) grid: (1) shaded woodland earth, cool dark brown-green, faint scattered leaf-litter and a couple of rounded pebbles, dappled shade dither; (2) a variant with a few more fallen leaves. Dim (it sits under dense tree shade), flat noise-free base with sparse deliberate specks, tiles seamlessly. Magenta gridlines + background, no text.
- **Wiring:** append `forest_floor` (+`_leaf`) `solid:false` at tail; put-column via apply-kit. Builder fills the hill's tree understory.

### T5 · Dirt path / trail — `path_<v>_<mask>` ✅ (32 variants)
- **Pipeline:** tile autotile (16-mask, grass-edge).
- **REUSE / AUTHOR:** **REUSE — already done.** `apply-eb-tile-kit.ts:238–256` bakes all 32 `path_v_mask` columns (dirt base A12 + A13 grass fringe per masked edge). The concept's tan winding switchbacks read correctly. **47-blob upgrade deferred** unless live-verify flags ugly bitten hairpin corners (16-mask is "fine for a path" per overhaul §0).
- **ChatGPT prompt (ONLY if 47-blob upgrade is needed):**
  > Pixel-art top-down dirt-trail autotile block, EarthBound crayon look — ONE continuous scene on a MAGENTA (#FF00FF) 5×5 grid: a winding tan-brown dirt path snaking through green grass, the grass biting into the dirt edge in soft 2–3 pixel dithered nibbles (no straight edge), showing every case: straight runs, rounded bends, T-junctions, corners, path ends. Packed-earth interior with a few pebbles. Magenta gridlines + background, no text.
- **Wiring:** none for the shipped kit. (If upgraded: append `path_<0..46>` at tail.)

### T6 · Street / sidewalk / curb — `road` `road_dash` `crosswalk` `parking` `sidewalk` `sidewalk_curb`(S) `sidewalk_curb_e` `sidewalk_curb_w` `sidewalk_crack` `road_patch` `storm_drain` ✅ · GAPS: `sidewalk_curb_n` 🆕 · `road_dash_v` 🆕 · `crosswalk_v` 🆕 · `manhole` 🆕
- **Pipeline:** tile-skin (fixed set, placed by the city builder, not autotiled).
- **Master:** 2×2 magenta strip for the 4 missing pieces.
- **REUSE / AUTHOR:** **REUSE the downtown kit, AUTHOR 4 gaps.** `apply-eb-tile-kit.ts:223–228` installs the entire road/sidewalk/curb/crosswalk/parking/storm-drain kit from sheet A — the Onett grid is already covered. Missing: a N-facing curb, vertical centre-line dash + vertical crosswalk for the N–S streets, and a manhole accent.
- **ChatGPT prompt:**
  > Pixel-art top-down street tiles, EarthBound/Mother-2 crayon look, 4 seamless 1:1 tiles on a MAGENTA (#FF00FF) grid: (1) a curb where light-grey concrete SIDEWALK meets dark asphalt road along the TOP edge — sunlit lip highlight then a shaded curb face; (2) dark asphalt with a VERTICAL yellow centre-line dash; (3) a VERTICAL white crosswalk (parallel white bars across the road); (4) an asphalt tile with a round cast-iron manhole cover. Flat matte asphalt, subtle dither, bold and readable at small size. Magenta gridlines + background, no text.
- **Wiring:** append `sidewalk_curb_n`, `road_dash_v`, `crosswalk_v`, `manhole` at tail; put-columns via the apply-kit. `occupyCity` places them on the grid.

### T7 · Stairs — `stairs` ✅ → `stair_top` 🆕 · `stair_mid` 🆕 · `stair_base` 🆕
- **Pipeline:** tile-skin (small fixed 3-band set; stairs are explicitly NOT 47-blob).
- **Master:** a 3-cell vertical strip ≈ **128×384**.
- **REUSE / AUTHOR:** **AUTHOR 3-band (deferred P4 fast-follow).** Single `stairs` cell exists (`tiles.ts:982`); the winding corridors make cliffs end mid-map and show prominent stairs, so the single cell reads poorly (`OTTERBROOK_ONETT_REBUILD.md §6.1`).
- **ChatGPT prompt:**
  > Pixel-art top-down stone STAIRS, EarthBound/Mother-2 crayon look — a vertical strip of 3 seamless 1:1 tiles on a MAGENTA (#FF00FF) grid, stacking into a flight of steps descending a rounded brown cliff: (1) TOP — the upper landing lip and first steps; (2) MIDDLE — a repeatable run of rounded concrete/stone treads with shaded risers; (3) BASE — the last steps meeting the ground with a soft contact shadow. Warm grey stone, bold tread outlines, must stack seamlessly top-to-bottom. Magenta gridlines + background, no text.
- **Wiring:** append `stair_top/mid/base` (`solid:false`) at tail; put-columns; grid char `T` maps to the band by row-in-run in `buildTiles`/`buildElevationOverlay`.

### T8 · Pond water + foam shore — `pond_water` 🆕 · `shore_<0..46>` 🆕
- **Pipeline:** water-shore-autotile (47-blob shore).
- **Master:** ONE continuous block ≈ **1536×1536** — a kidney-shaped pond in grass, every shore case mated.
- **REUSE / AUTHOR:** **AUTHOR fresh.** `sea_a`/`sea_foam` (`tiles.ts:853–854`) are the Ch.2 marine tiles and `apply-eb-tile-kit` deliberately leaves them alone; the concept's Pond Park is a still freshwater kidney pond with a wobbling foam/reed rim on ALL sides (single-char foam can't do it). `sea_a` may be recolored as the deep-water fill, but the shore rim is new.
- **ChatGPT prompt:**
  > Pixel-art top-down POND autotile block, EarthBound/Mother-2 crayon look — ONE continuous scene on a MAGENTA (#FF00FF) 5×5 grid: a kidney-shaped still freshwater pond sitting in green grass, the water meeting the grassy bank with a soft WOBBLING foam-and-reed crest that curves around EVERY case seamlessly — straight shore runs on all sides, rounded coves (inner corners), points (outer corners), and a tiny single-tile pool. Deep pond water = calm dithered blue-green with 1–2 deliberate still glints (never scattered); shore = a pale foam lip with a few reed tufts. Rounded blobby organic pond, no straight edges. Magenta gridlines + background, no text.
- **Wiring:** append `pond_water` (`solid:true`) + `shore_<0..46>` at tail; clone `apply-cliff-kit.ts` → `apply-shore-47.ts` (`scaleCellAlpha` for foam-over-grass, opaque for deep water); blob-index over water cells in `buildTiles`. Grid `w` = pond_water.

**Terrain net-new authoring:** T1 cliff 47-block (reference-paste), T4 forest floor, T3 grass-wild + tallgrass, T6 four street pieces, T7 stairs 3-band, T8 pond+shore 47-block. Already installed & reusable: town lawn, all 32 path masks, the whole downtown road kit, base cliff + 4-band overlay, single stair cell.

---

## 2 · Foliage & nature

Everything green/rocky that is NOT a tile-fill. Pipeline for all = **world-prop**
(magenta `#FF00FF` strip master ~256²/cell → `tools/slice-prop-strip.cjs` →
transparent runtime PNG in `assets/art/world/props/` → key in `WORLD_PROP_KEYS` +
row in `AUTHORED_WORLD_PROP_DISPLAY_SIZE`), unless noted. Trees are **reuse-first**
per `CLAUDE.md` + blueprint §6.5 (temperate `treeSprite` re-authoring deferred for
Ch.1). The two firmly-needed new batches are the ground-detail strip and the
rock/ejecta strip.

### F1 · Primary oak — `tree_b` ✅
- world-prop · exists (984×999 source, `{w:33,h:34}`) · **REUSE as-is.** This IS the concept's dominant hillside/yard oak (best of the three). Scatter densely on the wooded scarp, sparser lining the grid.

### F2 · Small oak — `tree` ✅
- world-prop · `{w:24,h:34}` · **REUSE** as size variation. Mix ~60% `tree_b` / 25% `tree` / 15% `tree_c` for a believable canopy field.

### F3 · Broad oak / Heart-Oak base — `tree_c` ✅
- world-prop · `{w:29,h:34}` · **REUSE** — blueprint-designated Pond-Park Heart Oak (drop the boss-era scorch, keep as a healed landmark).

### F4 · Heart Oak hero — `heart_oak` 🆕 CONDITIONAL
- world-prop · master ~**1200×1400** · new display-size `{w:56,h:64}` (~2× a normal tree, foot-anchored). **AUTHOR only if `tree_c` reads too small as the landmark** (blueprint §6.5 defers tree re-authoring, so this is conditional polish).
- **ChatGPT prompt:**
  > Pixel-art overworld prop for a top-down EarthBound/Mother-2 style game. A single large, ancient, round bushy OAK TREE — one broad billowing pillowy canopy of layered rounded leaf-clumps in a two-tone dithered warm green (a lit yellow-green crown fading to a shaded blue-green underside), sitting on a thick gnarled brown trunk with a few exposed roots flaring at the base. Slightly oversized "landmark" tree, wider than tall. Bold dark outline, crayon-saturated palette, checker-dither shading (no smooth gradients). Night-town palette but the tree itself reads warm and healthy. ONE tree, centered, on a fully transparent background, no ground shadow baked in, no grass, no text.
- **Wiring:** add `heart_oak` to `WORLD_PROP_KEYS` + display-size row; place one in Pond Park via `growOtterbrook`.

### F5 · Ground-detail strip — `grass_tuft_a/b` 🆕 · `weeds_tall` 🆕 · `flowerbed` 🆕 · `flower_tuft_red/gold` 🆕 · `bush_low` 🆕
- world-prop, ONE magenta strip (~6–8 cells) · **AUTHOR (highest-value single win).** The EB overhaul wants the procedural `grass_tuft`/`flowers_*`/`bush` tiles replaced by authored cells (uniform procedural speckle "reads generated"). Procedural tiles stay as frozen boot fallback, overridden where props are placed.
  - `grass_tuft_a/b` `{w:12,h:10}` — sparse lawn/verge/clearing sprinkle (2 variants).
  - `weeds_tall` `{w:12,h:16}` — scruffy overgrowth for the FOR-SALE lots.
  - `flowerbed` `{w:22,h:12}` — cultivated border row (house yards, fountain plaza, park beds).
  - `flower_tuft_red/gold` `{w:10,h:10}` — small bloom clusters (2 colors).
  - `bush_low` `{w:18,h:16}` — pillowy foundation shrub (decorative, non-solid prop path; the collidable `bush` tile already exists at `tiles.ts:810`).
- **ChatGPT prompt (whole strip):**
  > A horizontal pixel-art sprite strip of small top-down EarthBound/Mother-2 style ground foliage props, each in its own cell separated by wide gaps, on ONE solid flat magenta (#FF00FF) background — no shadows, no ground, no text. Left to right: (1) a small clump of grass blades; (2) a second, differently-shaped grass tuft; (3) a taller scruffy weed clump; (4) a low cultivated flower bed — a wide low row of mixed red/gold/white blooms with green leaves; (5) a tiny cluster of 2–3 red flowers; (6) a tiny cluster of 2–3 gold flowers; (7) a rounded pillowy low bush/shrub with checker-dithered two-tone green leaves. All bold-outlined, crayon-saturated, two-tone dithered shading (no gradients), sized like small ground details. Flat magenta background only.
- **Wiring:** slice → runtime PNGs → append each key to `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`; master → `assets/art/masters/world/otterbrook-foliage-strip-source.png`.

### F6 · Hedges — `hedge_0..15` ✅ · `bramble_0..15` ✅
- belt autotile (16-mask, `tiles.ts:997/1006`) · **REUSE.** Clipped garden hedges = the hedge belt; no new prop. (An authored hedge re-skin later belongs to the tile-kit category, not foliage.)

### F7 · Cattails — `cattails` ✅
- world-prop · `{w:14,h:22}` · **REUSE** for Pond-Park reeds.

### F8 · Lily pads — `lily_pad` 🆕 LOW-PRI
- world-prop · master ~**200×200** · `{w:16,h:8}` (flat, non-solid, drawn ON water, no ground shadow). **AUTHOR** — none exists.
- **ChatGPT prompt:**
  > Pixel-art top-down prop for an EarthBound/Mother-2 style game: a small cluster of flat round lily pads floating on water — 3–4 overlapping rounded green pads, one with a tiny pink/white waterlily bloom, two-tone dithered green, bold outline, crayon-saturated. Seen from directly above, flat (no side view). ONE cluster on a fully transparent background, no water, no shadow, no text.
- **Wiring:** `lily_pad` key + display-size; placed on pond water tiles.

### F9 · Rock / boulder / meteor-ejecta strip — `boulder_a/b` 🆕 · `meteor_ejecta_stone(_b)` 🆕 · `scree_rubble` 🆕
- world-prop, ONE magenta strip · **AUTHOR fresh (real gap).** No generic authored rock prop exists (only named story props + enemy battlers). Blueprint §2.4 wants the crater "ringed by meteor ejecta standing stones" + scree. (This overlaps the Props §G4 `meteor_standing_stone` request — build ONE ejecta-stone set and share it; see Open Questions.)
  - `boulder_a` `{w:22,h:18}`, `boulder_b` `{w:30,h:24}` — potato rocks (hillside/roadside/crater-rim scatter, solid).
  - `meteor_ejecta_stone(_b)` `{w:24,h:34}` — upright charred/glassy menhirs ringing the L3 crater bowl (solid).
  - `scree_rubble` `{w:16,h:8}` — flat gravel scatter (non-solid).
- **ChatGPT prompt (whole strip):**
  > A horizontal pixel-art sprite strip of top-down EarthBound/Mother-2 style rock props, each in its own cell with wide gaps, on ONE flat magenta (#FF00FF) background — no shadows, no ground, no text. Left to right: (1) a small rounded "potato-shaped" grey boulder, two-tone dithered with a lit top and shaded underside; (2) a larger boulder of the same style; (3) a taller upright meteor-ejecta standing stone — a jagged charred dark-grey rock chunk with faint glassy/scorched edges, standing on end like a small monolith; (4) a second, differently-shaped ejecta stone; (5) a low scatter of small rubble/gravel pebbles. Bold dark outlines, crayon-saturated, checker-dither shading, no gradients. Flat magenta background only.
- **Wiring:** append `boulder_a/b`, `meteor_ejecta_stone(_b)`, `scree_rubble` to `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`; master → `assets/art/masters/world/otterbrook-rocks-strip-source.png`.

### F10 · Meteor-rock sphere — `meteor_rock_hickory_hill` ✅
- world-prop story prop · exists (master `meteor-rock-hickory-hill-source.png`) · **REUSE.** The big cracked crater sphere. (Consider adding `{w:44,h:40}` size row for a stable ground-line.)

### F11 · Pine — `pine` ✅ DO NOT PLACE
- exists (`{w:25,h:34}`) but not in the all-broadleaf Onett concept. Keep for routes; don't place here.

**Foliage net-new authoring = 2 magenta strips (F5 ground-detail + F9 rocks) + conditional `heart_oak` + low-pri `lily_pad`.** Everything else is reuse. No TILESET tail append for props (world-prop loader, no size-pin risk).

---

## 3 · Building facades

Every distinct building, re-authored FRESH as a top-down-town **EarthBound-oblique
front facade** (flat front wall + a thin sliver of roof, no true perspective),
transparent bg, footprint at the bottom edge (anchors bottom-center). Authored at
runtime ×4 for crispness (ADR-110). Hi-res hand-authored facades render **1:1** via
the `worldSpriteScale` `texW>160 → scale 1` branch — so **do NOT add a
`GEN_FACADE_FOOTPRINT_W` entry**; the on-map width is set by the `w:` field on the
building's `maps.ts` row (keep the PNG footprint proportional to `w`). New keys
append to `BASE_FACADE_KEYS` in `authored.ts`. **Prepend to every prompt:**

> Pixel-art building FACADE sprite in the EarthBound / Mother 2 overworld style — chunky bold outlines, flat two-tone dithered "crayon" palette, slight night-time saturation. Front-oblique view (flat front wall facing the camera with a thin sliver of the roof visible on top, NO true 3D perspective, NO ground/shadow/text label). ONE building, centered, on a FULLY TRANSPARENT background. Use the attached concept illustration as the exact design + color reference for THIS building. …

Attach `otterbrook_USER_locked.png` as reference on every ask.

**Master canvas per class:** small shop/house (3–4 tiles) ~**512×512**; mid shop/civic
annex (5–7 tiles) ~**768×640**; large landmark (7–9 tiles) ~**1024×896**.

### Civic / landmark (bespoke)

- **A1 · City Hall — `bldg_ob_city_hall` 🆕** · ~1024×896 · **w:8, u:3** · AUTHOR (no close repo match; `bldg_civic` is a smaller brick colonial — don't reuse). Prompt tail: *…the white neoclassical CITY HALL: symmetrical two-story, cream/white columned portico with 4–6 tall columns, a central pediment/gable, wide stone front steps, a low dome/cupola, arched windows, warm-lit at night.* Fountain is a separate prop.
- **A2a · Hospital — `bldg_hospital` ♻️** · ~1024×768 · **w:7, u:2** · REUSE key, re-author PNG. Prompt tail: *…the white HOSPITAL: wide flat-roofed two-story medical building, white/pale walls, a bold RED CROSS centered high, rows of square windows, an ambulance-bay entrance.* (Keep the `maps.ts:2351,2424` special-case.)
- **A2b · Clinic — `bldg_ob_clinic` 🆕** · ~640×640 · **w:4, u:1** · AUTHOR (don't reuse Mediterranean `bldg_ps_clinic`). Prompt tail: *…the small neighborhood CLINIC: compact one-story teal-and-white building with a RED CROSS over the door, an awning, a small parking stub.*
- **A3 · Police — `facade_otter_station` ♻️ (recommended)** · ~768×704 · **w:5, u:2** · REUSE the existing Otterbrook brick P.D. key (keeps the Borden/ADR-118 cutscene wiring), re-author in place. Prompt tail: *…the POLICE STATION: squat two-story red-brick municipal building, a small columned/portico entrance with blue "POLICE" signage over the door, barred lower windows, a lamp globe each side, an American small-town precinct look.* (Drop the alt `bldg_ob_police` key.)

### Main-street shops (bespoke)

- **B1 · Drugstore — `drugstore` ♻️** · ~640×576 · **w:5, u:2** · REUSE key, re-author. Tail: *…purple striped awning, "DRUGSTORE" sign board, display windows either side of a glass door, a mortar-and-pestle / Rx motif.*
- **B2 · Burger — `bldg_ob_burger` 🆕** · ~640×640 · **w:5, u:2** · AUTHOR (or reskin `facade_diner` geometry). Tail: *…the BURGER fast-food joint: diner-style building, red-and-white "BURGER" sign, a giant three-layer hamburger sculpture on top, big front windows, a striped awning, cheerful roadside-Americana.*
- **B3 · Bank — `bldg_bank` ♻️** · ~640×576 · **w:6, u:2** · REUSE key, re-author (catalog → hi-res renders 1:1, keep `w:6` rows). Tail: *…the BANK: dignified single-story, green facade + green awning, "BANK" sign, two short columns flanking a recessed glass door, a stone base, a clock/dollar motif.*
- **B4 · Bakery — `bldg_ob_bakery` 🆕** · ~576×576 · **w:4, u:1** · AUTHOR (don't reuse Brickton `bldg_bagels`). Tail: *…the BAKERY: cozy one-story, yellow-and-cream front, "BAKERY" sign, striped awning, a window of bread/cakes, a pretzel/wheat-sheaf hanging sign.*
- **B5 · Arcade — `arcade` ♻️** · ~768×704 · **w:5, u:2** · REUSE key, re-author. Tail: *…the ARCADE: two-story, bold PURPLE neon marquee reading "ARCADE", a glowing entrance archway, star/lightning neon, dark glass, 80s-arcade vibe glowing at night.*

### Residential — named / story houses (bespoke)

- **C1 · Jay's house (purple roof) — `house_rex` ♻️** · ~640×576 · **w:4, u:2** · REUSE key (opening-cutscene anchor — renaming breaks the opening), re-author. Tail: *…two-story suburban house, PURPLE gabled roof, cream/tan walls, front porch, chimney, shuttered windows, a small fenced yard + driveway — the hero's family home.*
- **C2 · Chad's house (blue roof) — `house_chad` ♻️** · ~640×576 · **w:4, u:2** · REUSE key, re-author. Tail: *…two-story house, BLUE gabled roof, light walls, a covered front PORCH (leave the porch clear — a bug-zapper prop mounts here), fenced yard, driveway.* (Bug-zapper is a separate prop; Glint-death beat is sacred.)
- **C3 · Green hillside house — `bldg_ob_house_green` 🆕** · ~640×576 · **w:4, u:2** · AUTHOR (or reskin `house_b` if budget-constrained). Tail: *…a charming two-story cottage, GREEN gabled roof + green trim, cream walls, a white picket-fenced front yard, a flower garden, on a wooded hillside.*
- **C4 · Pemberton's workshop/shed — `bldg_ob_workshop` 🆕** · ~576×512 · **w:4, u:1** · AUTHOR (blueprint §5). Tail: *…a rustic hillside WORKSHOP SHED: small weathered wood-plank building, slanted shingle roof, a workbench/tools through a window, a stovepipe chimney, a fence around a dirt yard cluttered with rocketry scrap and crates.* ("DON'T ENTER" sign + fence-across-door are separate props.)

### Residential — generic house types (grouped, recolored)

The concept has ~18–20 tract houses. Author **4 base geometries**, each with a small
set of roof-color variants (2 explicit color PNGs per geometry; the map alternates
them). Counts are placement targets, not sheet counts.

- **D1 · Type A (compact gable) — `house_a` ♻️** (+ `house_a_blue`, `house_a_brown` 🆕) · ~512×512 · **w:3, u:1** · ~6–8 placements. Tail: *…a small 1½-story gabled cottage, one dormer, a stoop, two front windows, a modest fenced yard — [ROOF: red/blue/brown] shingles. Author 3 copies differing ONLY in roof + trim color.*
- **D2 · Type B (wide L-plan) — `house_b` ♻️** (+ `house_b_*` 🆕) · ~576×512 · **w:4, u:1** · ~6–8 placements. Tail: *…a wider single-story L-plan house, covered side porch, two-car driveway, picket fence, bushes — [ROOF] shingles. Author 3 recolors.*
- **D3 · Type C (two-story foursquare) — `bldg_ob_house_c` 🆕** (+ `_blue`, `_tan`) · ~576×576 · **w:4, u:2** · ~4–6 placements. Reskin `house_pink` for one variant. Tail: *…a two-story American FOURSQUARE: boxy, hipped roof with a central dormer, a full-width front porch with posts, symmetrical windows, a chimney — [WALL: red-brick / blue clapboard / tan]. Author 3 recolors.*
- **D4 · Type D (cottage w/ porch) — `bldg_ob_cottage` 🆕** (+ `_brown`) · ~512×512 · **w:3, u:1** · pond-park corners + the FOR-SALE starter homes. Tail: *…a cozy one-story COTTAGE, steep front-gable roof, small covered entry porch, window boxes, a low fence, a garden path — storybook starter home. [ROOF: red/brown].* (FOR-SALE lots = this facade + a "FOR SALE" sign prop.)

### Office / apartment blocks (grouped)

- **E1 · Apartment A (tan brick, 3-story) — `bldg_apartments` ♻️** · ~768×896 · **w:5, u:3** · REUSE key, re-author. Tail: *…3-story TAN BRICK apartment: flat parapet roof, a grid of windows with sills, a central stoop with a small canopy, a fire-escape hint, ground-floor bays.*
- **E2 · Apartment B (green, 4-story) — `bldg_ob_apt_green` 🆕** · ~768×1024 · **w:5, u:4** · AUTHOR (reskin `bldg_brownstone` candidate). Tail: *…a 4-story GREEN walk-up: muted sage-green walls, white window trim, a flat cornice roof, a symmetrical window grid, a modest recessed entrance.*
- **E3 · Apartment C (red-brick block) — `bldg_brickmore` ♻️ (recommended)** · ~768×896 · **w:6, u:3** · REUSE the existing brick-block key, re-author (strong reskin match — avoids a new key). Tail: *…a wide 3-story RED-BRICK block: dark-red brick, stone lintels, a flat roof, a grand double-door entrance with a stone surround, ground-floor shopfront windows.*
- **E4 · Office (lavender) — `bldg_office` ♻️** · ~768×768 · **w:5, u:2** · REUSE key, re-author. Tail: *…a 2-story LAVENDER/PALE-PURPLE office: pastel plaster walls, a flat cornice roof, tall arched ground-floor windows, a modest awning entrance, potted plants.*

**Facade totals:** ~19–22 distinct sheets (11 reused keys re-authored on-model + ~8–11
new keys), before ~6 cheap roof-color recolors (D1–D3). New keys to append to
`BASE_FACADE_KEYS`: `bldg_ob_city_hall, bldg_ob_clinic, bldg_ob_burger,
bldg_ob_bakery, bldg_ob_house_green, bldg_ob_workshop, bldg_ob_house_c(+_blue,_tan),
bldg_ob_cottage(+_brown), bldg_ob_apt_green`. Each PNG → `assets/art/world/facades/`
(+ master), placed in the rewritten `growOtterbrook` with a `{ sprite, w, u, x, y }`
row. Signs/awnings that are separable game objects live in Props, not here.

---

## 4 · Props & set-pieces

Pipeline = **world-prop** unless noted (magenta `#FF00FF` strip master ~1536×1024 →
`tools/slice-prop-strip.cjs` → transparent PNG in `assets/art/world/props/` → key in
`WORLD_PROP_KEYS` + row in `AUTHORED_WORLD_PROP_DISPLAY_SIZE`, native map units).
Vehicles are their own category (`assets/art/vehicles/` + `AUTHORED_VEHICLE_ART` +
`DIRECTIONAL_VEHICLE_KEYS` + `compose-vehicle-directional.cjs`). Fence belt +
driveway + crater ground install at the **TILESET tail** (BAK-first, frozen-column
law), not as props. **✅ REUSE / ♻️ RESKIN / 🆕 AUTHOR.**

### Town-square & civic
- **`fountain` ✅** `{w:40,h:38}` — City-Hall round tiered basin; reuse (reskin only if off-palette).
- **`gazebo` ✅** `{w:39,h:56}` — Pond-Park octagon; reuse.
- **`town_clock` ✅** `{w:19,h:32}` — optional square accent; reuse.

### Street furniture (repeat props)
- **`bench` ✅** `{w:22,h:13}` — Pond Park + sidewalks; reuse ×8–12.
- **`street_lamp` 🆕** `{w:12,h:38}` — AUTHOR. Gap: no standalone lamp (`phone_pole` is a horizontal run, `fb_gas_lamp` is Foggybottom Victorian). Prompt: *"Top-down EarthBound/Mother-2 pixel-art street lamp: a slim black cast-iron post with a small base and TWO round frosted-white glowing globes on curved arms near the top, faint warm halo, bold dark outline, night palette. One object, upright, on a flat MAGENTA (#FF00FF) background — no shadow, no ground, no text."* Wiring: `WORLD_PROP_KEYS` + `street_lamp:{w:12,h:38}`. Optional `street_lamp_lit` (mirror `mask_switch_lit`).
- **`mailbox` ✅** `{w:10,h:21}` — reuse ×15+. **`hydrant` ✅** `{w:10,h:14}` — reuse ×6–10. **`parking_meter`/`trash_can`/`news_box` ✅** — reuse near shops. **`planter` ✅** `{w:22,h:16}` — reuse.

### Fences / driveways / yard boundaries
- **White picket fence 🆕 — belt autotile (NOT a prop).** Fences are currently painted tile-chars (`maps.ts:253–258`, `-`); the concept's picket fences ring nearly every yard and must round corners + leave gate gaps. Author as a **16-mask belt** via a clone of `apply-hedge-kit.ts`; append 16 cells at the TILESET tail; add a `CHAR_LEGEND` char (e.g. `f`), solid. Prompt: *"Top-down EarthBound/Mother-2 pixel-art WHITE PICKET FENCE tileset as ONE continuous reference block on a grid: horizontal runs, vertical runs, all four outer corners, T-junctions, and a single post — clean white-painted pointed pickets with a dark outline, thin cast shadow, night palette. Flat MAGENTA (#FF00FF) background, no text."* (Low-tech fallback if kept a prop: `fence_picket` `{w:24,h:12}` + `fence_picket_gate`, but corners won't round — belt is correct.)
- **Driveway 🆕 — tile-skin (NOT a prop).** A concrete/asphalt apron cell reusing the road/path family recolor, painted as a short street→garage stub. (Discrete `driveway_apron` `{w:24,h:16}` only if a decorative one-off is wanted; tile-skin is cleaner.)
- **Rustic rail fences ♻️ optional** — Pemberton's shed + mid-hill houses; covered by a picket-belt recolor (`fence_rail` variant) — no separate asset unless wanted.

### Pond Park
- **`footbridge_rail` ♻️** `{w:44,h:29}` — reuse if it reads arched; reskin master to a warm wooden EB arch if not.
- **`windmill` 🆕** `{w:22,h:48}` — AUTHOR. Gap (the `athletes.ts` windmill is a hoops anim). Prompt: *"Top-down EarthBound/Mother-2 pixel-art American farm windmill: a tall slim galvanized-metal lattice tower with a multi-blade fan wheel and tail vane at the top, small pump at the base, weathered grey-and-rust, bold dark outline, night palette. One upright object on a flat MAGENTA (#FF00FF) background — no shadow, no ground, no text."* (Static first; blade spin is a later frame-anim.)
- **`duck` / `duck_b` 🆕** `{w:10,h:8}` — AUTHOR ×2. Prompt: *"Top-down EarthBound/Mother-2 pixel-art ducks seen from above floating on water: a small white duck and a small green-headed mallard, each a rounded body with a little bill, tiny ripple ring beneath, bold dark outline. Two separate objects on a flat MAGENTA (#FF00FF) background — no text."* Scatter 3–5 on the pond.
- **`cattails` ✅** `{w:14,h:22}` — reuse. **Heart Oak ✅** — reuse `tree_b`/`tree_c` (see Foliage F3/F4). **Americana yard set ✅** — `kiddie_pool`, `swing_set`, `seesaw`, `tree_swing`, `clothesline`, `doghouse`, `flagpole` all exist; reuse in yards/park.

### Vehicles
- **Civilian traffic ✅** — reuse the existing directional roster (`commuter`, `work_van`, `city_ev`, `drop_top`, `grand_tourer`, `comet_gt`, `big_block`, `trail_boss`, `the_nikolai`, `vehicle_clunker`, `bus`/`school_bus`), per-instance tinted. No new civilian car art. The purple/green mid-hill parked cars = tinted reuse.
- **`ambulance` 🆕 — vehicle (3-frame directional).** AUTHOR at the clinic. Prompt: *"EarthBound/Mother-2 pixel-art AMBULANCE van, 3/4 oblique top-down, THREE views in a row: side, front, back. White boxy van body with a red cross on the side, red stripe, small light bar on the roof, bold dark outline, night palette. Flat MAGENTA (#FF00FF) background, no shadow, no text."* Wiring: `AUTHORED_VEHICLE_ART` + `DIRECTIONAL_VEHICLE_KEYS`.
- **`police_cruiser` 🆕 — vehicle (3-frame).** AUTHOR at the station (Borden beat). Prompt: *"EarthBound/Mother-2 pixel-art POLICE SQUAD CAR, 3/4 oblique top-down, THREE views in a row: side, front, back. Black-and-white sedan with a red/blue roof light bar and a small door shield, bold dark outline, night palette. Flat MAGENTA (#FF00FF) background, no shadow, no text."* Wiring: `AUTHORED_VEHICLE_ART` + `DIRECTIONAL_VEHICLE_KEYS`.

### Signs
- **`sign_town_highway` 🆕** `{w:34,h:24}` — AUTHOR ("OTTERBROOKE, OH" green highway sign). Prompt: *"Top-down EarthBound/Mother-2 pixel-art green highway road sign on two grey posts reading 'OTTERBROOKE, OH' in white block letters, reflective green panel with a white border, bold dark outline, night palette. One object on a flat MAGENTA (#FF00FF) background — no ground shadow, no extra text."* (Text baked in — the game font can't render on a prop.)
- **`sign_for_sale` 🆕** `{w:18,h:20}` — AUTHOR ×2+. Prompt: *"Top-down EarthBound/Mother-2 pixel-art real-estate 'FOR SALE' yard sign: a small white rectangular board on a wooden post with red 'FOR SALE' text, bold dark outline, night palette. One object on a flat MAGENTA (#FF00FF) background — no shadow, no extra text."* Place on the 2 empty lots (+ optionally 27 Maple).
- **Shop label signs (BURGER/BANK/BAKERY/DRUGSTORE/ARCADE/POLICE) ✅ on facades — DON'T author here** (baked into each facade). Optional generic `sign_blade` `{w:16,h:20}` hanging sign for secondary storefronts (low pri).
- **`sawhorse` ✅** — reuse for the boss-hill barricade + Pemberton gate; **add missing size row** `sawhorse:{w:24,h:16}` (currently falls to the heuristic).
- **`sign_dont_enter` 🆕** `{w:16,h:16}` — AUTHOR (red placard on Pemberton's fence, blueprint §5/§6.2; distinct from the sawhorse). Prompt: *"Top-down EarthBound/Mother-2 pixel-art small red 'DON'T ENTER' warning sign on a short post: a red square placard with white 'DON'T ENTER' text, bold dark outline, night palette. One object on a flat MAGENTA (#FF00FF) background — no shadow, no extra text."* Place across Pemberton's door with `unlessFlag:'tick_defeated'`.

### Meteor / crater (top of hill)
- **`meteor_rock_hickory_hill` ✅** — reuse the cracked sphere; add `{w:44,h:40}` size row for a stable ground-line. (Same as Foliage F10.)
- **Crater bowl / scorched ground 🆕 — tile-skin/47-blob (NOT a prop)** — a scorched-earth field cell + a dithered crater-rim transition (grass↔dirt kit "scorched" recolor) so the player walks in and it y-sorts. Optional discrete `crater_rim` decal only if a hard lip is wanted.
- **`cave_mouth` 🆕** `{w:36,h:30}` — AUTHOR (do NOT reuse `burrow_mouth` — that's the retired Under-Oak root hole). Top-left cliff entrance + the boss-hill `giant_step_cave` door. Prompt: *"Top-down EarthBound/Mother-2 pixel-art CAVE MOUTH set into a rocky cliff: a rounded dark arched opening in warm-brown rounded stone, deep black interior, a few rubble rocks at the base, bold dark outline, night palette. One object on a flat MAGENTA (#FF00FF) background — no extra ground, no text."*
- **`meteor_standing_stone` a/b/c 🆕** `{w:16,h:26}` — AUTHOR ×3 to ring the crater (blueprint §2.4/§8). **NOTE:** this overlaps Foliage F9 `meteor_ejecta_stone` — build ONE ejecta/standing-stone set and share the keys (see Open Questions §Q6). Prompt: *"Top-down EarthBound/Mother-2 pixel-art standing stones / meteor ejecta rocks: three upright jagged dark basalt monolith shards of varying height with faint reddish scorch, bold dark outline, night palette. THREE separate objects on a flat MAGENTA (#FF00FF) background — no shadow, no text."*
- **`sentinel_husk` / `hush_sentinel` ✅** — reuse the dormant-guardian set-piece (ADR-121, `ifFlag sentinel_repelled`); add a size row if missing.
- **`gift_box` / `gift_box_open` ✅** `{w:14,h:14}` / `{w:16,h:14}` — reuse the `walkPresent` healing presents up the climb.
- **`bug_zapper` ✅** — reuse exactly (Chad's porch, sacred Glint-death beat); **add** `bug_zapper:{w:14,h:20}` size row.

**Props net-new authoring:** `street_lamp` (+opt `_lit`), white-picket-fence belt
(tile-kit), driveway skin (tile-skin), crater scorched-ground skin, `windmill`,
`duck`/`duck_b`, `ambulance` + `police_cruiser` (vehicles), `sign_town_highway`,
`sign_for_sale`, `cave_mouth`, `meteor_standing_stone` a/b/c, `sign_dont_enter`.
**Housekeeping:** add `AUTHORED_WORLD_PROP_DISPLAY_SIZE` rows for `sawhorse`,
`bug_zapper`, `meteor_rock_hickory_hill`, `sentinel_husk` (currently unstable
ground-lines). Big reuse wins: the whole civilian car roster, benches, mailbox,
hydrant, parking_meter, trash_can, gazebo, fountain, footbridge, cattails, gift
boxes, sentinel_husk, and the Americana yard set.

---

## 5 · Characters / NPCs

**Scope: LIGHT / reuse-heavy — new character art to author for Map #1 is NONE.**
The heavy per-NPC ChatGPT reference-paste pipeline (`docs/ART_PIPELINE.md` § Character
46-frame walk sheets) is invoked **zero times** for this map. Every figure the concept
implies is already served by an authored 46-frame sheet or by the citylife/traffic
reuse pools.

### Named / story NPCs — all exist (REUSE)
| Concept figure | Existing sheet — REUSE | `authored.ts` |
|---|---|---|
| Hero (Jay) — player | `rex` (`HERO_ART`, `jay_anim_46_4x.png`) | :42–44 |
| Chad — hillside/porch beat | `chad` (`chad_anim_46_4x.png`) | :310 |
| Pemberton — fenced workshop, "DON'T ENTER" man | `ml_pemberton` (`ml_pemberton_anim_46_4x.png`, Ch.10 sheet — same character per canon bridge, blueprint §5) | :407 |
| Realtor — FOR-SALE lots + 27 Maple | `npc_realtor` (`npc_realtor_anim_46_4x.png`) | :358 |
| Hodgkin — mower/shed reward chain | `npc_hodgkin` (`npc_hodgkin_anim_46_4x.png`) | :353 |

### Crater trio (3 figures at the meteor)
Cast from existing sheets — `oldTimer`, `grayCommuter`, `permit` (or `smiler`/`smilerB`
gawkers). Static/idle placements on L3 (no per-mover terrace collision). No authoring.

### Hillside / FOR-SALE-lot figures
Reuse residents (`mrsPemmel`, `mrPlummer`, `fernLady`, `mom`) or the realtor. No authoring.

### Generic townsfolk (~40+ sidewalk figures) — REUSE the citylife pool
Spawned by `src/data/citylife.ts` from `arch.pool[rnd]`; Otterbrook's roster is curated
in **`OTTERBROOK_NPC_CHARACTER_IDS`** (`authored.ts:414–433`, 18 sheets: `chad, glint,
mom, mrsPemmel, mrPlummer, ana, vivi, oldTimer, pajamaKid, fernLady, quarterMan,
senora, grayCommuter, pigeonKid, drugClerk, deliKeeper, priestOtter, busDriver`) plus
shop clerks (`martClerk, arcadeOwner, nurse, manager, sidewalkCritic, npc_waitress,
npc_clerk`). Sufficient for the crowd density. For more variety, ADD already-authored
ids (`smiler`, `smilerB`, `permit`, `quarterMan`) — a one-line id-list edit, zero
authoring.

### Traffic cars (~8–10) — REUSE directional vehicle sheets
Served by `DIRECTIONAL_VEHICLE_KEYS` (`authored.ts:703–709`); see Props §Vehicles. No new
vehicle art for Ch.1 characters (the `ambulance`/`police_cruiser` in Props are the only
new vehicles, and they're set-piece props not townsfolk).

### Biscuit the dog (Pond Park / Biscuit quest)
`biscuit_dog_4frame.png` (`BISCUIT_DOG_ART`, `authored.ts:435`) — 4-frame sheet; reuse as-is.

**Character-side WIRING work (not authoring):** (1) register `ml_pemberton` for the
Otterbrook map so the Ch.1 hillside NPC reuses the Ch.10 sheet; (2) optionally extend
`OTTERBROOK_NPC_CHARACTER_IDS` with `smiler`/`smilerB`/`permit`. Both are id-list edits
in `src/spritegen/authored.ts`.

---

## 6 · Reuse ledger

Assets already in the repo — reuse as-is (✅) or reskin the master on-model (♻️). Do
NOT re-author these from zero.

| Asset / key | Category | Verdict | Note |
|---|---|---|---|
| `grass_a` `grass_b` `grass_tuft` | terrain (tile) | ✅ | town lawn; installed by `apply-eb-tile-kit` |
| `path_<v>_<mask>` (×32) | terrain (autotile) | ✅ | full dirt-path kit installed |
| `road` `road_dash` `crosswalk` `parking` `sidewalk` `sidewalk_curb(_e/_w)` `sidewalk_crack` `road_patch` `storm_drain` | terrain (skin) | ✅ | whole downtown road kit installed |
| `cliff_face` + `cliff_top/mid_a/mid_b/base` | terrain (tile) | ♻️ | base + 4-band exist; upgrade to 47-blob (T1/T2) |
| `stairs` | terrain (tile) | ♻️ | single cell; upgrade to 3-band (T7) |
| `sea_a` `sea_foam` | terrain (tile) | ✅ | Ch.2 ocean — leave untouched; NOT the pond |
| `hedge_0..15` `bramble_0..15` | foliage (belt) | ✅ | clipped garden hedges |
| `tree_b` `tree` `tree_c` | foliage (prop) | ✅ | primary/small/broad oaks (`tree_c` = Heart Oak base) |
| `cattails` | foliage (prop) | ✅ | pond reeds |
| `meteor_rock_hickory_hill` `meteor_rock` | foliage/prop | ✅ | cracked crater sphere (add size row) |
| `pine` | foliage (prop) | ✅ | exists but DON'T place (all-broadleaf Onett) |
| `bldg_hospital` | facade | ♻️ | re-author PNG, keep key + special-case |
| `drugstore` `arcade` `bldg_bank` `bldg_office` `bldg_apartments` | facade | ♻️ | re-author PNGs, keep keys |
| `facade_otter_station` | facade | ♻️ | police station — keeps Borden wiring |
| `bldg_brickmore` | facade | ♻️ | red-brick block → apartment C |
| `house_rex` `house_chad` | facade | ♻️ | Jay/Chad houses — keep keys (story anchors) |
| `house_a` `house_b` `house_pink` | facade | ♻️ | generic house types A/B (+ C reskin) |
| `fountain` `gazebo` `town_clock` `bench` `mailbox` `hydrant` `parking_meter` `trash_can` `news_box` `planter` | prop | ✅ | civic + street furniture |
| `footbridge_rail` | prop | ♻️ | reskin to warm wooden EB arch if not arched |
| `kiddie_pool` `swing_set` `seesaw` `tree_swing` `clothesline` `doghouse` `flagpole` | prop | ✅ | Americana yard set |
| `commuter` `work_van` `city_ev` `drop_top` `grand_tourer` `comet_gt` `big_block` `trail_boss` `the_nikolai` `vehicle_clunker` `bus` `school_bus` | vehicle | ✅ | civilian traffic (per-instance tint) |
| `sawhorse` `bug_zapper` `gift_box(_open)` `sentinel_husk` `hush_sentinel` | prop | ✅ | reuse (add missing size rows) |
| `rex` `chad` `ml_pemberton` `npc_realtor` `npc_hodgkin` | character | ✅ | named-NPC 46-frame sheets |
| `OTTERBROOK_NPC_CHARACTER_IDS` (18) + shop clerks | character | ✅ | townsfolk pool for citylife |
| `biscuit_dog_4frame` | character | ✅ | Biscuit quest dog |

---

## 7 · Batched build order

Author-fresh assets grouped into ChatGPT batches in dependency order, matching the
blueprint's **Slice T → S-2 → … → S-6** flow. The user approves every render; after
each batch, slice + wire + run the gate before moving on. Tile-family appends are
**BAK-first** and each is paired with its apply/sync run (or `authored_assets.test.ts`
fails on `strip.w === TILESET.length*64`).

### Batch 1 — TILE KIT (gray-box the map) · Slice **T**
The ground vocabulary so the rebuilt `growOtterbrook` can gray-box and be walked.
1. **T1 Cliff face** `cliff_<0..46>` — 47-blob continuous block (reference-paste `onett-cliff-continuous.png`).
2. **T2 Cliff-lip** `cliff_lip_<0..46>` — author as the top band of T1's block.
3. **T3 Grass** `grass_wild` + `tallgrass` (town lawn already installed).
4. **T4 Forest floor** `forest_floor` (+ `_leaf`).
5. **T6 Street gaps** `sidewalk_curb_n`, `road_dash_v`, `crosswalk_v`, `manhole`.
6. **T7 Stairs** `stair_top/mid/base`.
7. **T8 Pond** `pond_water` + `shore_<0..46>` — 47-blob shore block.
8. **White picket fence belt** (Props §Fences) — 16-mask belt via `apply-hedge-kit` clone.
9. **Driveway skin** + **crater scorched-ground skin** — road/grass-kit recolors.
- **Slice/wire:** clone `apply-cliff-kit.ts`/`apply-eb-tile-kit.ts`/`apply-hedge-kit.ts` per block → append cells at the TILESET tail (BAK-first) → surgical write to `otterbrook_tiles_16.png` at `idxOf` → dump proof PNGs.
- **Gate:** `npm run build` (tsc + `authored_assets.test.ts` size-pin) + `npm test`; live gray-box walk the map (cliffs/stairs/pond/fences collide + read).

### Batch 2 — FACADES · Slice **S-2**
Re-author the 11 reused keys on-model + author the new keys. Attach the locked image on every ask.
1. Civic: `bldg_ob_city_hall` 🆕, `bldg_hospital` ♻️, `bldg_ob_clinic` 🆕, `facade_otter_station` ♻️.
2. Shops: `drugstore` ♻️, `bldg_ob_burger` 🆕, `bldg_bank` ♻️, `bldg_ob_bakery` 🆕, `arcade` ♻️.
3. Story houses: `house_rex` ♻️, `house_chad` ♻️, `bldg_ob_house_green` 🆕, `bldg_ob_workshop` 🆕.
4. Generic houses: `house_a` ♻️(+`_blue`/`_brown`), `house_b` ♻️(+recolors), `bldg_ob_house_c` 🆕(+`_blue`/`_tan`), `bldg_ob_cottage` 🆕(+`_brown`).
5. Blocks: `bldg_apartments` ♻️, `bldg_ob_apt_green` 🆕, `bldg_brickmore` ♻️, `bldg_office` ♻️.
- **Slice/wire:** PNG → `assets/art/world/facades/<key>.png` (+ master); append new keys to `BASE_FACADE_KEYS`; place each in `growOtterbrook` with `{ sprite, w, u, x, y }` (footprint from `w`, NO `GEN_FACADE_FOOTPRINT_W`).
- **Gate:** `npm run validate` (`hi-res-facades` + `cityViolations`/ADR-012) + build; live-verify facades render 1:1 with signage legible.

### Batch 3 — FOLIAGE & PROP STRIPS · Slice **S-3/S-4**
1. **Foliage ground-detail strip** (F5): `grass_tuft_a/b`, `weeds_tall`, `flowerbed`, `flower_tuft_red/gold`, `bush_low`.
2. **Rock / ejecta strip** (F9 ⊕ Props §G4, shared): `boulder_a/b`, `meteor_ejecta_stone`(=`meteor_standing_stone`) a/b, `scree_rubble`.
3. **Street furniture / signs strip:** `street_lamp` (+`_lit`), `sign_town_highway`, `sign_for_sale`, `sign_dont_enter`.
4. **Pond & crater set-pieces:** `windmill`, `duck`/`duck_b`, `cave_mouth`, (opt) `lily_pad`, (conditional) `heart_oak`.
- **Slice/wire:** magenta strips → `tools/slice-prop-strip.cjs` → PNGs in `assets/art/world/props/` (masters in `assets/art/masters/world/`); append keys to `WORLD_PROP_KEYS` + rows to `AUTHORED_WORLD_PROP_DISPLAY_SIZE`; add the missing housekeeping size rows (`sawhorse`, `bug_zapper`, `meteor_rock_hickory_hill`, `sentinel_husk`); place via `growOtterbrook`.
- **Gate:** build + `npm run visuals:audit`; live-verify ground-lines/y-sort + placements.

### Batch 4 — VEHICLES · Slice **S-5**
1. `ambulance` (3-frame directional) — clinic.
2. `police_cruiser` (3-frame directional) — station.
- **Slice/wire:** side/front/back strip → `assets/art/vehicles/<key>.png` → `compose-vehicle-directional.cjs` → add to `AUTHORED_VEHICLE_ART` + `DIRECTIONAL_VEHICLE_KEYS`.
- **Gate:** build; live-verify parked + facing swaps.

### Batch 5 — CHARACTERS (wiring only) · Slice **S-6**
No authoring. (1) Register `ml_pemberton` for the Otterbrook map; (2) optionally extend `OTTERBROOK_NPC_CHARACTER_IDS` with `smiler`/`smilerB`/`permit`.
- **Gate:** build + `npm test`; live full-map playthrough — opening cutscene (Jay/Chad houses), crater trio, hillside/Pemberton beat, FOR-SALE realtor, townsfolk density, traffic, Biscuit, boss-hill routing.

---

## 8 · Open questions for the user

1. **Boss-cave routing.** Confirm the retire-Under-Oak / relocate-first-boss plan (Titanic Tick HP200 → `boss_hill` → `giant_step_cave` → sanctuary, Heart Oak → healed landmark). This decides whether `cave_mouth` is placed twice (Otterbrook top-left + boss-hill approach) and where the barricade/`sawhorse` gates.
2. **Building text-labels.** Keep the on-facade text labels (BURGER/BANK/BAKERY/DRUGSTORE/ARCADE/POLICE, "OTTERBROOKE, OH", "FOR SALE", "DON'T ENTER") baked into the art? The game font can't render text on props/facades, so any label must be painted into the master. Confirm exact wording + that baked text is acceptable at 64px read.
3. **Night vs day palette.** The locked image is "town under the stars" (night). Author every master in the night palette, or author a neutral/day base and tint at runtime? (Foggybottom's opt-in fog-veil precedent suggests a runtime night-tint could keep masters reusable, but the concept's warm-lit windows read best baked.)
4. **House-type count & recolors.** Confirm 4 base geometries (A/B/C/D) with ~2 roof-color recolors each is enough for the ~18–20 tract houses, or whether more distinct silhouettes are wanted.
5. **Conditional polish.** Author the `heart_oak` hero landmark and `lily_pad`, or ship with reused `tree_c` + no pads for the pilot? Same for `street_lamp_lit` (dark→dawn toggle) and spinning windmill blades (static first?).
6. **Ejecta-stone de-dup.** The rock strip (F9) and crater stones (Props §G4) request the same asset under two names (`meteor_ejecta_stone` vs `meteor_standing_stone`). Confirm ONE set of keys authored once and shared (recommended) — this manifest assumes so in Batch 3.
7. **Police key.** Confirm reusing `facade_otter_station` (keeps the Borden/ADR-118 cutscene) rather than minting `bldg_ob_police`.
8. **Apartment-C key.** Confirm reusing `bldg_brickmore` (re-authored) for the red-brick block rather than a new `bldg_ob_apt_brick` key.
