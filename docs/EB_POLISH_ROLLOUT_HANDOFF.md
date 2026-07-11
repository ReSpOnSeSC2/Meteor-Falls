# EB POLISH ROLLOUT — the game-wide handoff (for the next session/AI)

The `claude/earthbound-art-style-01p1w9` branch (PR #107) built the complete
**EarthBound street-polish kit** and proved every piece on Otterbrooke. This
document is the recipe for rolling those features out to EVERY other map and
level. Read it top to bottom before touching anything: the GOTCHAS section
encodes real failures this branch hit and fixed, and the per-feature notes say
what is already global versus what needs per-map work.

Companion docs: `docs/DOWNTOWN_OTTERBROOKE_REBUILD.md` (the pilot's spec +
ChatGPT prompt packs), `docs/EARTHBOUND_STYLIZATION_OVERHAUL.md` (the umbrella
program + the MF→EB region mapping), `docs/CITY_DESIGN_LANGUAGE.md`,
`docs/WILDERNESS_DESIGN_LANGUAGE.md` § Elevation.

## 0. The kit — what exists and where

| Feature | Mechanism | Scope today |
|---|---|---|
| GPU-safe tile atlas | `TILE_ATLAS_COLS` (`src/spritegen/tiles.ts`) reflows the runtime `tiles` texture to a 64-col grid; disk strips stay single-row | GLOBAL, done — never regress (guard test in `authored_assets.test.ts`) |
| Pale EB asphalt | `tools/recolor-asphalt.ts` (idempotent, remaps from its `.bak`) | Base-strip cells — every map that renders `road/road_dash/road_dash_h/crosswalk/parking/road_patch/storm_drain` |
| EB pavement slab | `tools/apply-eb-pavement.ts` (flat cream + sparse ticks) | Base `sidewalk`/`sidewalk_crack` cells — all base-tile maps |
| Curb autotile | `CURB_BASE` 16-mask + 3 curb-cuts; swap in `OverworldScene.buildTiles`; art re-derived from the live sidewalk cell by `tools/apply-curb-kit.ts` | ENGINE-GLOBAL for any map where the tile NAME `sidewalk` survives skinning (see §2 caveat) |
| Manhole | tile `manhole`, char `'4'`, `tools/apply-manhole.ts` | Tile global; PLACEMENT per map |
| Intersection props | `traffic_light`, `stop_sign` (`tools/derive-intersection-props.ts`) | Keys global; PLACEMENT per map |
| 2-tile promenade + street wall | map-builder edits (shop foot row paved; facades butted ≤1-tile gaps) | PER TOWN |
| Tall facades + back rank | `tools/derive-tall-facades.ts` storey-band cloning; doorless masses behind the drag | PER TOWN (clone that region's facades) |
| Downtown terrace | `elevation` plane + `'^'/'K'/'T'` seam grammar | PER TOWN |
| Horizon band | tile `horizon_ridge`, char `'5'`, `tools/apply-horizon.ts` (night-tuned) | Tile global; PLACEMENT per vista edge; day variant still to add (§3.8) |

## 1. Rollout order (leverage-first)

Work region-by-region in the EARTHBOUND_STYLIZATION_OVERHAUL §3 order, but
note the polish kit is INDEPENDENT of the pending EB tile-art batches — you
can polish a town's streets/massing/terraces before its ground kit lands.

1. **TWOTON (Brickton)** — town #2, editor-authored (`tools/mapeditor/twoton.json`
   ⇄ `src/data/maps_twoton.ts`). CAVEAT: Brickton has its OWN tile strip
   (`assets/art/world/brickton-tiles-*`), so check whether its road/sidewalk
   cells come from the base strip or its own before assuming the asphalt/
   pavement passes reached it. Its diagonal boulevard is ALSO the pilot for
   the Batch-C diagonal family — coordinate, don't collide.
2. **Puerto Sol + Valle Dorado + Las Dunas** (Ch.2 belt) — Puerto Sol and
   Foggybottom use the shared BASE tiles (already recolored); Las Dunas rides
   the Zanzibel ochre skin (needs the per-biome value pass, §3.1).
3. **Foggybottom/Wintermoor** (Ch.3) — base tiles + the shipped fog-terrace
   pilot; mostly needs massing/props/horizon.
4. **The skinned regions** (Minimus, Kvisthavn, Zanzibel/Savanna/Ruins, Lotus
   Harbor, Chandrapore?, Valea Stelelor, Aurora, Mauna Lani, Mars) — each
   needs the per-biome street-value pass and the curb-skin decision (§2).
5. **Routes/dungeons** — only the pieces that apply (terracing, horizon at
   vista edges, props). No curbs/asphalt where there are no streets.

For EVERY town, mirror its EB equivalent (the §3 table in the overhaul doc)
and attach the banked references in `assets/art/masters/reference/earthbound/`
to any ChatGPT ask (user directive 2026-07-11: always give ChatGPT the EB
examples so the style/angles match exactly).

## 2. THE BIG CAVEAT — skinned maps bypass the curb kit

`OverworldScene.buildTiles` resolves tiles through an else-if chain:
region SKINS come BEFORE the `name === 'sidewalk'` curb branch. On a skinned
map (`MINIMUS_SKIN_MAPS`, `NORWAY_SKIN_MAPS`, …) the char `'='` remaps to the
region's own path tile and NEVER reaches the curb mask. Consequences:

- Base-tile towns (Otterbrooke, Foggybottom, Puerto Sol, Valle Dorado…) get
  curbs automatically. Skinned towns get NONE today (same as before).
- To roll curbs into a skinned region you must choose per region:
  (a) add a region curb family (`<region>_curb_<mask>` tail cells derived from
  that region's path tile — clone `apply-curb-kit.ts`, swap the slab source)
  and extend the buildTiles branch to pick skinned curb names; or
  (b) decide the region doesn't curb (a fjord quay or desert track has no
  curb — often correct!). Write the decision into the region's design doc.
- The same choice applies to the asphalt VALUE pass: skinned "road" tiles
  (`norway_path`, `china_path`, …) live in their own strips
  (`assets/art/world/<Region>_tiles_16.png`). If a region's lane reads too
  dark against EB (compare its EB equivalent), clone `recolor-asphalt.ts`
  into a `recolor-<region>-lane.ts` operating on that strip's cells. Check
  each region visually before deciding — several are already pale.

## 3. Per-feature rollout recipes

### 3.1 Street value pass (asphalt/lane)
Base maps: already done. Per skinned region: screenshot the town center
(recipe §5), compare against the region's EB reference; if the lane is
value-heavy, clone `tools/recolor-asphalt.ts`, point STRIP at the region
strip, list that region's lane/ground cells, tune `liftBody`. Keep the
idempotent read-from-`.bak` pattern. Yellow/white markings rules carry over.

### 3.2 Curbs + pavement
Per §2. When a region gets its own curb family: TAIL-APPEND the 16+3 cells
(`tiles.ts`, `export const <REGION>_CURB_BASE = TILESET.length` — NEVER
insert mid-array), grow the strip via the apply tool (the size-pin test
`authored_assets.test.ts` enforces `strip.w === TILESET.length*64`), then
extend the buildTiles sidewalk branch to resolve the skinned family. Update
`tools/mapeditor/gen-manifest.ts` (`sidewalkCurb` block) + the editor mirror
in `tools/mapeditor/index.html` and REGENERATE the manifest (validate runs
`mapeditor:check`).

### 3.3 Street furniture + manholes
Per town: paint `'4'` on plain `'R'` cells near junctions (guard
`at(x,y)==='R'` — never on `D/_/X/P`, mid-lane on 4-wide roads so the
one-road-component tests hold). Place `traffic_light` at 1-2 major junction
corners, `stop_sign` on approaches, both with small foot solids (copy the
Otterbrooke PropDefs in `buildOtterbrookTownReplica`). Region reskins of the
two props are Batch-B ChatGPT asks (replace the PNG, keep the key).

### 3.4 Promenade + street wall (the massing pass)
Per town, in its builder or editor doc:
1. Identify the shop drag. Make the shop FOOT row pavement and add a second
   walk row (Otterbrooke pattern: paint `'='` where `grassLike`, AFTER the
   builder's lane-marking re-assert pass, skipping park/lawn frontages).
2. Re-space storefronts into continuous blocks: gaps ≤ ~1 tile, party walls,
   doors at the foot. Compute spans from the facade dims table (width/64
   tiles, centered) — in Otterbrooke that's `OTTERBROOK_LANDMARK_DIMS` +
   `otterCentered`; other towns have their own helpers or editor docs.
3. Step one or two shops a row forward/back for parapet rhythm.
4. Move anchored NPCs/props (meters, regulars) with their shops.
Return doors self-heal ONLY where interiors use `doorstepOf(map, '<int>')`
(Otterbrooke does). Other towns may hardcode return `tx/ty` — grep the
interior defs for `to: '<town>'` and re-derive or update them, then trust
the door-audit (it hard-fails `landsSolid`/`farFromReturn`).

### 3.5 Tall facades + the back rank (scale + stacking)
Per region: pick 1-2 facades with clean repeating storey bands and clone
floors via `tools/derive-tall-facades.ts` (add entries — band coords by
ruler-overlay screenshot, seams land on floor lines). Register the new keys:
- **NON-`bldg_` key names** (e.g. `facade_<x>_tall`) — see GOTCHA G2.
- `BASE_FACADE_KEYS`/`REGION_FACADE_KEYS` (`authored.ts`) + the town's dims
  table + `LANDMARK_FACADE_SPRITES` (`buildings.ts`).
Place 2-4 doorless masses on block interiors behind the drag so storefronts
occlude their bases (foot rows chosen so upper storeys break the skyline).
**NO `markFootprint`/occupied-marking for back-rank masses** — see GOTCHA G1.
EB equivalents to mirror: Twoson/Fourside are the tower-heavy ones;
Threed's masses are gothic; Winters/Dalaam towns stay low (skip the rank).

### 3.5b Enlarging the ON-STREET buildings (the scale pass)
The back rank fixes the skyline, but the buildings the player walks up to
must ALSO hit EB ratios (Onett's smallest storefront ≈ 3.1 units, anchors
4-6.5; a 384px facade is only 3.0). Two production tools, both shipped on
Otterbrooke — use per building:
1. **Storey-band cloning** (best; zero pixel distortion) — for facades with a
   repeating floor: `tools/derive-tall-facades.ts`. Works when a horizontal
   band contains no unique emblem (signs/crosses/pediments duplicate!). The
   hotel/apartments cloned cleanly; bank/drugstore/city-hall/clinic did NOT
   (sign- and emblem-centered compositions).
2. **Per-instance `scale`** (the realty/autolot precedent) — for everything
   else: Otterbrooke's landmark helpers (`otterLandmark`/`otterCentered`/
   `build` in `maps.ts`) now take a `scale` arg that sizes position, solid
   and footprint; door offsets stay NATIVE (the runtime multiplies them).
   Shipped spread: bank ×1.3, drugstore ×1.22, clinic/city-hall/bakery ×1.15,
   arcade ×1.12, burger ×1.1 — and one wide unit per block deliberately stays
   ×1.0 (EB's rhythm). Keep scales ≤ ~1.45 (the autolot ceiling; above that
   the art softens visibly).
3. **The true tower ON the street**: swap a drag/civic anchor for a tall
   derivation as an ENTERABLE facade (Otterbrooke's Civic hotel →
   `facade_hotel_tall`, door preserved). If the tall image would put a street
   inside the footprint rect, mark the footprint BY HAND from below the
   street (see the Civic hotel block in `buildOtterbrookTownReplica`) — G1.
Rolling out: each town builder/editor doc needs the same scale plumbing in
ITS landmark helper (or explicit PropDefs with `scale` + manual door), then
re-space centers for the grown widths (overlaps of ≤1-2 tiles at party walls
are the intended stacking, but keep DOORS clear of neighbours).

### 3.6 Downtown terrace (elevation)
Per town with a drag. The Otterbrooke pattern (copy it):
1. In the town grid: pick block-interior rectangles CLEAR OF EVERY CROSSING
   AVENUE (GOTCHA G3). Paint solid buffer (`'b'`/region wall char) on the
   north row + both edge columns FIRST, then `'^'` lip strictly inside the
   buffers, then `'K'` face row below, then `'T'` stair flights (3 rows:
   top row = upper level, face+bottom = lower — the seam-B convention).
2. In the map's `elevation.level` plane: the same rectangles → upper level;
   face row: `ch==='T' ? lower : upper`.
3. Run `npx vite-node tools/content-validate.ts` and iterate until the
   elevation law reports ZERO `invisible ledge` lines. It names exact cells —
   fix data, don't waive.
Maps whose builders don't declare `elevation` yet: add the plane exactly like
`growOtterbrook` (a per-cell string map, default '0').

### 3.7 Horizon bands (vista edges)
`horizon_ridge` ('5') is NIGHT-tuned (Otterbrooke's 2AM starfield). For
daylight vista edges (coastal Puerto Sol, the Twoson river, cliff overlooks):
add a `horizon_ridge_day` tail tile + legend char ('6' is free) and a day
palette block in `tools/apply-horizon.ts` (the original daylight ramp is in
git history — commit `EB downtown pass 3`, pre-edit version). Paint the rim
row where the map edge represents distance (solid→solid swaps only, and
check treeline-front prop pins — GOTCHA G5). Sea edges: sky band + the
existing `sea_a`/`E` rows already compose an EB coast.

### 3.8 Aspect discipline for ALL new art
Every ChatGPT ask attaches: the region's EB reference + a current in-game
sprite of the same category (keeps palette/pixel density) + the relevant
banked EB screenshots. One oblique axis: front + RIGHT side. Facades:
roof plane 2-3 tiles deep, party walls, door at the foot.

## 4. GOTCHAS — real failures this branch hit (do not rediscover)

- **G1 — the occupied-clear punches roads.** Town builders' `markFootprint`
  → occupied set → the clear pass rewrites `R/=/D/_/P/X` to `'.'` inside
  footprints, and lane-marking re-assert only restores sidewalk/centerline,
  NOT carriageway. A tall back-rank mass whose footprint touches a street
  PERMANENTLY holes it. Back-rank scenery: push the prop directly, no
  footprint marking; collision comes from `facadeSolids` (texture-true) and
  merely narrows the street behind (EB walk-behind is normal).
- **G2 — `bldg_` keys get grafted.** `occupyCity` turns doorless `bldg_*`
  facades into housing units with generated interiors (and unit tests then
  pin beds/tables). Scenery masses MUST use non-`bldg_` keys + a
  `LANDMARK_FACADE_SPRITES` entry (the 27-Maple rule).
- **G3 — terrace rectangles vs avenues.** Level-plane rectangles are blind to
  the grid: any avenue crossing the block band gets raised road cells
  (invisible-ledge law) or, worse, K-walled lanes. Dump the actual grid rows
  first (tsx one-liner over `MAPS.<id>.grid`), size rectangles between the
  avenues, and remember curved lanes wobble ±1-2 cols.
- **G4 — paint buffers before lips.** `'^'` isn't in the walkable guard set;
  if the lip pass runs first, the buffer pass skips those cells and leaves a
  walkable L1 edge beside L0 grass. Buffers first; lip inset `x0+1..x1-1`.
- **G5 — test pins that WILL bite:** per-town prop budgets
  (`maps_otterbrook.test.ts` style — bump with a justifying comment, never
  silently); treeline-front pins requiring specific chars under the sprites
  (extend the accepted set when a band tile legitimately sits behind);
  two-build byte-determinism tests (all edits must be seedless/deterministic);
  the strip size-pin (append cells + grow strip in the SAME commit);
  `authored_assets` disk↔registry pins (commit PNG + key together).
- **G6 — interiors' return doors.** Only `doorstepOf`-derived exits self-heal
  after moving shops. Hardcoded `tx/ty` returns need updating; the door-audit
  catches them (hard fail) — run validate immediately after any re-massing.
- **G7 — chars are a global namespace.** Every grid char in every map must be
  in `CHAR_LEGEND` (validate law) — so any char NOT in the legend is provably
  free. Claimed by this branch: `'4'` manhole, `'5'` horizon_ridge.
- **G8 — the 8192 texture ceiling.** The runtime atlas is now a grid; keep
  `TILE_ATLAS_COLS*64 ≤ 8192` and rows under it too (the guard test computes
  both). Never upload a full-width strip as a texture anywhere else. Also:
  headless SwiftShader WebGL boots SLOWLY (~30-60s) — poll for the overworld
  scene, don't fixed-sleep, and don't misdiagnose "black at 15s" as a bug.
- **G9 — night vs day palettes.** Check the target map's ambient scene (the
  plateau runs a 2AM starfield) before picking band/prop palettes.
- **G10 — after ANY tiles/legend/map change**, regenerate the editor data
  (`npx vite-node --script tools/mapeditor/gen-manifest.ts`) or
  `mapeditor:check` fails validate.
- **G11 — scaled facades and return doorsteps.** `doorstepOf` (mapkit) is now
  scale-aware, but any OTHER helper that derives an exterior landing from
  door offsets must multiply by `prop.scale` too — the symptom is the
  door-audit's `bodyBlocked` on the town side (the bank's return landed two
  rows short, inside the terrace face, until the fix). When a town hardcodes
  return `tx/ty` instead of deriving, recompute them after any scale change.
- **G12 — tall images near cross streets.** A scaled/tall building whose
  IMAGE reaches a street above is fine (walk-behind); its FOOTPRINT reaching
  the street is not (G1). At foot row F with image height H rows, the
  footprint clears rows F−H−1..F+1 — cap the scale or hand-mark the footprint
  when that band touches a carriageway (Civic's curved lanes peak a row lower
  than their base row; dump the grid, don't trust the base coordinate).

## 5. Verification loop (use it after every slice)

1. `npx tsc --noEmit`
2. `npx vite-node tools/content-validate.ts` — read the elevation/door lines,
   not just the exit code.
3. `npx vitest run <the map's test file>` fast, full `npx vitest run` before
   push. 4. `npm run build`.
5. **Live screenshots** (headless, works in CI containers):
   `npm run dev`, then Playwright with `--disable-webgl` (Canvas renders
   instantly; SwiftShader WebGL is slow but valid for the GPU-limit check):
   load `http://localhost:5173/?devMap=otterbrook` (add equivalent dev-boot
   params per map in `TitleScene` as needed — the pattern is there), poll
   until the `overworld` scene is active, teleport via
   `game.scene.getScene('overworld').player.setPosition(x*64+32, y*64)`,
   screenshot, compare against the EB reference AND the previous state.
6. Walk the seams: curbs mate at corners, cuts at crossings, stairs cross
   levels, walk-behind occludes, doors round-trip.

## 6. Definition of done (per map)

- Streets: pale lane values, curbs (or a documented no-curb decision),
  crosswalk cuts, manholes + drains at junctions, traffic light/stop signs
  where the region has traffic.
- Massing: shops front a ≥2-tile walk in continuous blocks; at least one
  tall anchor breaking the skyline; a back rank where the EB equivalent has
  one; parapet rhythm (mixed foot rows).
- Depth: a terrace or elevation beat where the EB equivalent has one; horizon
  band on true vista edges.
- Gates green (incl. ZERO elevation-law lines), editor data regenerated,
  live screenshots taken and compared, doc + diversity ledger updated.
