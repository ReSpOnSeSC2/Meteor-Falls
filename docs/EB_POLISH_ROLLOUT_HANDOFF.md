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

1. **TWOTON (Brickton)** — ✅ **DONE (2026-07-11)**, the first full rollout after
   the pilot. What landed (all folded into `tools/mapeditor/author-twoton.ts`,
   the canonical authoring source — run it to regenerate BOTH artifacts):
   - Streets: brickton renders the BASE strip (the old own-strip caveat was
     STALE — no runtime `brickton-tiles-*` exists, it's in no `*_SKIN_MAPS`), so
     asphalt/pavement/curbs applied automatically. Added 7 manholes, 2 traffic
     lights, 2 stop signs, 2-tile promenades on all three drags (rows 12/53/68),
     a dirt apron to house_a.
   - Scale pass: the TEN named-door buildings grew (hotel ×1.33 = 4.0u anchor,
     hospital ×1.4, dept ×1.42, civic ×1.15, starmart/arcade2 ×1.45,
     theater ×1.3, bike ×1.18, diner ×1.35; warehouse + market stay ×1.0 as the
     per-block wide-low rhythm units). **The 7 doorless occupy facades were NOT
     moved or scaled — `stableTwotonLotId` keys their save-stable unit ids on
     x/y** (a new per-map constraint this rollout discovered; see G13).
   - Back rank: `facade_brickmore_tall`/`facade_brownstone_tall` derived from
     Twoton's own brick vernacular (added to `tools/derive-tall-facades.ts`,
     registered BASE_FACADE_KEYS + LANDMARK_FACADE_SPRITES); 3 masses behind the
     Main St blocks + 1 north of the civic block. Feet sit one row BEHIND the
     promenade so it stays walkable, and park NPCs were checked against parapet
     lines (a pigeon-watcher read as a roof-walker until moved — sight-check
     every NPC within ~2 rows above a mass top).
   - Doors: `makeTwoton` now derives door `oy` from the storefront's APRON row
     (`oy = (apron·16 + 4 − y·16)/scale − 18`) so doorsteps land mid-sidewalk at
     ANY scale — bit-identical to the old tuned values at ×1 (G11 applied).
   - Decisions: NO terrace (Twoson is flat in EB) and NO horizon band (the map
     is forest-framed on all four edges; treeline-front pins also make edge
     bands hostile here). Facade contact shadows now include brickton
     (OverworldScene gate widened). Dev boot: `?devMap=brickton` lands at the
     bus corner.
   Its diagonal boulevard is still the pilot for the Batch-C diagonal family —
   coordinate, don't collide.
2. **Puerto Sol + Valle Dorado + Las Dunas** (Ch.2 belt) — ✅ **PRODUCTION
   REBUILD DONE (2026-07-11)**. Puerto and Valle are now deterministic,
   dual-output authored maps with composed micro-districts instead of random
   tree fields; Las Dunas keeps the approved Sunken Compass / Split Horizon
   desert grammar. The full transition chain (Twoton docks, boat deck, grotto,
   and Costa Estrella) was rebuilt in the same pass. See the production record
   below before changing any of these maps.
3. **Foggybottom/Wintermoor** (Ch.3) — ✅ **PRODUCTION ROLLOUT DONE
   (2026-07-12)** across the exact twelve-map route. The fog-terrace pilot is
   now a complete town/moor/academy/standing-stones chapter with authored
   landmarks, live ambience and field-control interactions. See §7.
4. **The skinned regions** (Minimus, Kvisthavn, Zanzibel/Savanna/Ruins, Lotus
   Harbor, Chandrapore?, Valea Stelelor, Aurora, Mauna Lani, Mars) — each
   needs the per-biome street-value pass and the curb-skin decision (§2).
5. **Routes/dungeons** — only the pieces that apply (terracing, horizon at
   vista edges, props). No curbs/asphalt where there are no streets.

For EVERY town, mirror its EB equivalent (the §3 table in the overhaul doc)
and attach the banked references in `assets/art/masters/reference/earthbound/`
to any ChatGPT ask (user directive 2026-07-11: always give ChatGPT the EB
examples so the style/angles match exactly).

### Ch.2 diversity ledger — rollout lock

These signatures are the no-formula contract for the Puerto Sol → Las Dunas
slice. Keep the headline idea of each row exclusive even when shared terrain
or street-polish tools are reused elsewhere.

| Map | Unique signature | Anti-repetition controls |
|---|---|---|
| **puerto_sol** | **THE LANTERN PROCESSION** — a moonlit, Threed-like port whose old cemetery lane and two slanted commercial streets visually process toward one warm civic/carnival plaza, then spill downhill to the black-water quay. | Keep it flat and theatrical: no Foggybottom-style tiered fog descent, no Otterbrooke climb, and no Twoton rectilinear drag. Campo Viejo is a quiet navigation landmark, not another combat dungeon; amber lamps, funeral stone, coral stucco, and harbour reflections own the mood. |
| **jungle_1 / LAS DUNAS WEST** | **THE SUNKEN COMPASS** — the west crossing bends around a half-buried bus and oasis basin, then offers one genuinely enterable malt-shop waystation before the road curls away. | Never restore the old four-row corridor or jungle-tunnel grammar. Use asymmetric doglegs, lee-side pockets, sparse travellers, and ochre stone; the shop must remain a real room/store/save point, never a scenery facade. |
| **jungle_2 / LAS DUNAS EAST** | **THE SPLIT HORIZON** — the final approach divides around a broken ridge: one branch reveals Valle early while the other dives past the grotto mouth, then both rejoin at the eastern threshold. | The fork-and-reveal belongs to this screen. Do not repeat the Sunken Compass loop, Puerto's converging procession, or a generic enemy hallway; preserve two readable choices, unequal silhouettes, and a single late reunion. |

### Ch.2 production rebuild — what now owns the route

| Map / leg | Production result | Canonical source |
|---|---|---|
| **brickton_docks** | 30×18 working harbor: terminal wall, ticket pavilion and waiting pocket; timber departure wharf; cargo-tally machinery; south fish auction; harbor bell; real workers/signs; existing ticket gift, Brickton return and `board_boat` trigger retained. | `buildBricktonDocks`, `src/data/maps_ch2.ts` |
| **boat_interior** | 24×14 playable night deck with a sky/sea horizon and clean teak silhouette; port cargo bay; passenger benches; starboard wheelhouse and mail stack. Purpose-built bollards, machinery and vessel props replace the generic fence/wear tiles that failed live review. The cinematic center spawn remains deliberately clear. | `buildBoatInterior`, `src/data/maps_ch2.ts` |
| **puerto_sol** | The Threed street skeleton now opens into authored places: **Moonwake Garden**, **Candleworks Court**, **Midnight Radio Lot**, the festival-lit plaza, the rebuilt Campo Viejo cemetery, and a working quay sequence (bell → ticket office → mooring lane → crane → fish auction → luggage). Reserved-scene masks stop deterministic street trees from repopulating those compositions. | `tools/mapeditor/author-puerto-threed.ts` → `tools/mapeditor/puerto_sol.json` + `src/data/maps_puerto_sol.ts` |
| **jungle_1 / jungle_2** | Approved Las Dunas West/East maps remain the desert quality bar: Sunken Compass + real malt-shop waystation, then Split Horizon + grotto fork. Internal ids remain unchanged for saves. | `tools/mapeditor/author-dunas.ts` → both editor JSONs + `src/data/maps_dunas.ts` |
| **grotto** | 28×20 irregular multi-chamber cave with distinct cache, shrine, crystal and spring vaults; real fissure/rope-bridge traversal; authored sun shrine, stone arch and underground spring. All three legacy chest flags and the jungle return are preserved. | `buildGrotto`, `src/data/maps_ch2.ts` |
| **valle_dorado** | The Fourside boulevard lattice now contains two working river decks, **Sun-Print Bazaar**, **Starfall Civic Apron**, **Taxi + Night-Café Court**, **Pyramid Pilgrim Market**, **Old-Quarter Artisan Yard**, llama-pen care and a festival-lit clock plaza. Reserved-scene masks remove tree noise without altering the skyline, park quest or named interiors. | `tools/mapeditor/author-valle-fourside.ts` → `tools/mapeditor/valle_dorado.json` + `src/data/maps_valle_dorado.ts` |
| **costa_estrella** | 27×16 moonlit clifftop threshold with surf and cliff lip, first tee/bunker, overlook balcony, caddie shelter, practice green/water garden and winding cart paths. Both live world doors (Puerto and the full Links) remain wired. | `buildCostaEstrella`, `src/data/maps.ts` |

The new landmark art is source-banked under `assets/art/masters/world/` and
sliced to semantic runtime keys under `assets/art/world/props/`; keep those
source sheets, registry entries, map placements and generated manifest in the
same change.

`output/maps_ch2.png` is a **topology-only schematic**, not an art review. It
flattens the real props to footprint boxes and cannot show sprite silhouettes,
pixel art, scale, draw order, night tint, lighting, animation, reflections or
the player's camera composition. Use it to review route order, ground grammar,
doors, triggers, encounter regions and gross collision density for:
`brickton_docks → boat_interior → puerto_sol → jungle_1 → dunas_waystation
→ jungle_2 → grotto → valle_dorado → costa_estrella`. **Live Phaser at the
actual gameplay zoom is the visual source of truth.** A map does not pass art
review because its schematic looks dense; boot it, walk it and capture its
signature scenes in the live renderer.

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
- **G13 — occupy facades are POSITION-KEYED (Twoton rollout).** Doorless
  `bldg_`+solid facades get occupyCity tenancy units whose save-stable ids
  derive from x/y (`stableTwotonLotId` = `brickton_lot_<x*100>_<y*100>`; other
  towns may share the pattern). Moving OR scaling one BEFORE `occupyCity`
  renames its unit — orphaning save flags and any interior the player saved
  inside. The formal-city scale pass is the safe exception: tenancy runs first,
  then `promoteFormalCityScale` grows exterior art north from the frozen apron,
  after the door target/unit id already exists. New passes must keep that order.
- **G14 — mass parapets vs park NPCs.** A back-rank mass's top rows overlap
  whatever sits 1-2 rows above them in screen space; an NPC standing there
  reads as ON the roof (depth is foot-based, so the NPC draws over the
  parapet). After placing masses, screenshot and sight-check every NPC/prop
  within ~2 rows above each mass top.
- **G15 — hidden-tab dev boots stall without a pump.** The in-app Browser
  pane's tab is background-throttled: the Phaser loader only issues its next
  XHR batch on an update tick, so boot crawls (32 files/pump) and the boot→
  title delayedCall never fires. Install a `setInterval(() => game.loop.step(
  performance.now()), 50)` pumper until the overworld scene is status 5, then
  clear it (it also blocks the pane's own screenshots — use the
  `tools/shot-server.mjs` + `canvas.toDataURL` POST recipe for captures).
- **G16 — Ch.2 generated artifacts are not authoring sources.** Durable
  edits belong in `author-puerto-threed.ts`, `author-dunas.ts`, or
  `author-valle-fourside.ts`; run `npm run mapeditor:puerto`,
  `npm run mapeditor:dunas`, or `npm run mapeditor:valle` to regenerate the
  paired editor JSON and runtime TS. Do not patch one generated artifact and
  leave its twin drifting. Puerto reports building overlaps, fixture
  walkability and spawner clearance; Dunas checks door openings, solid props
  on water and 1.5-tile spawner clearance; Valle reports facade/ground
  collision warnings. Treat every warning/issue as an authoring failure to
  inspect and clear before accepting generated output, even though the scripts
  print findings rather than exiting nonzero.
- **G17 — Puerto/Valle `bldg_*` order is a save invariant.** Unlike Twoton's
  coordinate-stable lot ids, these two cities still receive sequential
  `<map>_unit_N` tenancy ids from `occupyCity`. Adding, deleting or reordering
  an eligible `bldg_*` prop can remap existing interiors and also change which
  facade the seeded lock pass closes. New scenery and background masses must
  use registered non-`bldg_` aliases. Do not duplicate sprite keys used by the
  named-door graft tables either: the wrapper is sprite-based and would graft
  the same destination onto every duplicate. Preserve edge-door rectangles,
  story-trigger ids/rectangles and conditional gift flag pairs when rebuilding.

- **G18 — formal-city scale is real storeys, not transform stretch.** Every
  exterior facade in the seven `settlement:'city'` maps is promoted in place to
  a city/source-specific `bldg_cityscale_*` procedural variant of the same lot
  width. Ordinary variants are 220 native px (6.875× a 32px hero); landmark
  variants are 300px (9.375×). `formal_city_scale.test.ts` measures the actual
  generated Pixmap height after map-native and instance scaling. Minimus is the
  unavoidable narrative/scale conflict: its citizens and props remain 0.5×
  Gulliver miniatures, while facade sources use 444/588px needle architecture,
  yielding 222/294px at runtime (6.94×/9.19×). The placed Royal Long-View Lens
  and sign make that optical exaggeration explicit. Do not remove the device or
  silently exempt Minimus; do not make its people normal-sized to solve it.

- **G19 — four services are a formal-city contract, not a route-map stamp.**
  Every `settlement:'city'` map is registered in `CITY_AMENITIES` and must expose
  a buyable home/open house, a staffed real-estate agency, a real dealership,
  and a paid hotel with an unoccupied guest room. Exterior service markers and
  readable plaques are mandatory; an interior hidden behind contradictory art
  does not count. Transition routes, wilderness, dungeons, and villages are
  deliberately exempt. Preserve `citysvc_<city>_<role>` NPC ids and generated
  unit ids when remassing a city.
- **G20 — a title is not a drivable car until every save field agrees.** Vehicle
  transactions go through `engine/vehicle-domain.ts`: cash, title key-item,
  fuel/charge, continent, garage membership, active/driving state, and exact
  parking commit together. Delivery uses `allocateVehicleDeliverySlot`; never
  copy one dealer coordinate onto multiple titles. Home garages use real
  capacity plus park/pull mutations. Regional dealers only service/sell/trade
  vehicles on the same continent.
- **G21 — owned-car controls are one visible contract.** A beside a parked car
  enters it; D-pad steers/accelerates; B brakes; A sounds the horn; X parks and
  exits; Y folds/restores the dashboard. Combustion cars enter with the engine
  off and use START to turn the key; EVs are keyless and BMXes are human power.
  The dashboard shows the authored three-view model, speed, actual fuel/charge,
  ignition state, low-resource warning, and the live controls. The full party
  must fit the authored seat count. Personal titled cars work when bought;
  Milo's Ch.3 Clicker unlock is for remotely moving unoccupied machines.
- **G22 — vehicle collision must reach route portals.** A sedan's full body is
  wider than a one-tile edge door, so outdoor edge transitions trigger when the
  vehicle body overlaps the portal while steering outward; centre-point-only
  tests soft-lock the route. Turning checks the NEW orientation before movement.
  Ambient traffic treats every driven/parked owned-car footprint as blocked, and
  parking chooses a dynamic-body-safe exit point.
- **G23 — field PUPPET is taught by THE FIRST BORROW.** It awakens in the
  Wintermoor arrival scene after Milo joins and the Clicker lesson, when Jay
  borrows the porter to open the gate (`awake_mindwarp_a`). Y opens the field
  wheel: spend 14 PP, choose a nearby person, then move for eight seconds; A
  talks or works a nearby authored sign/switch and B/Y releases. Dogs are not
  people. `mindImmune:true` produces the red `NO SIGNAL` ring (the Whistle Guard
  is the shipped proof). Held-Breath rewind locks PUPPET only on the current map.

## 5. Verification loop (use it after every slice)

1. `npx.cmd tsc --noEmit`.
2. `npx.cmd tsx tools/door-audit.ts` — a non-waived body-box or snug-entry
   finding is a release failure.
3. `npm.cmd run validate` — read the elevation, door, ambience, machine, and
   map-editor drift lines, not just the exit code.
4. `npx.cmd vitest run <the map's focused test files>` during iteration; run
   the complete `npm.cmd test` once at release close.
5. `npx.cmd tsx tools/render-map.ts <set>` and inspect the schematic. After a
   map or metadata change, run `npm.cmd run mapeditor:gen`, review the generated
   diff, then `npm.cmd run mapeditor:check`.
6. `npm.cmd run balance` and `npm.cmd run visuals:audit:strict`.
7. `npm.cmd run build`.
8. **Live browser survey:** `npm.cmd run dev`, load the supported
   `http://localhost:5173/?devMap=<id>` URL (Chapter 3 also accepts
   `devState=arrival|joined|coolant|postBoss|complete`), wait for the overworld,
   and capture the intended areas/states. Compare against the design reference
   and previous state; inspect console errors.
9. Walk the seams and interactions: curbs mate at corners, cuts at crossings,
   stairs cross levels, walk-behind occludes, doors round-trip, atmosphere
   phases, and authored PUPPET/Clicker actions release safely.

## 6. Definition of done (per map)

- Streets: pale lane values, curbs (or a documented no-curb decision),
  crosswalk cuts, manholes + drains at junctions, traffic light/stop signs
  where the region has traffic.
- Massing: shops front a ≥2-tile walk in continuous blocks; at least one
  tall anchor breaking the skyline; a back rank where the EB equivalent has
  one; parapet rhythm (mixed foot rows).
- Formal cities only: visible home-for-sale + agency + dealership + paid hotel;
  buy/check-in/garage/vehicle-delivery flows use real save data and cash.
- Depth: a terrace or elevation beat where the EB equivalent has one; horizon
  band on true vista edges.
- Gates green (incl. ZERO elevation-law lines), editor data regenerated,
  live screenshots taken and compared, doc + diversity ledger updated.

## 7. Chapter 3 production rollout — shipped 2026-07-12

This section supersedes the Chapter 3 “mostly needs massing/props/horizon” line
that earlier rollout sessions inherited. The save-facing roster is now exactly
`biplane_interior`, `foggybottom`, `kettle_taproom`, `kettle_snug`,
`foggy_moor`, `wintermoor_grounds`, `the_old_stones`, `wintermoor_f1`,
`wintermoor_f2`, `wintermoor_f3`, `wintermoor_dorm`, and
`wintermoor_boiler`. These twelve ids are a compatibility contract; rename,
deletion, or door-target reordering requires a new migration.

What is live:

- Foggybottom remains the four-level sinking-fog town, now backed by a complete
  service layer: fixed dealer/motor-works, open flat, agency, bank, petrol,
  Kettle paid lodging, and a real guest-room wake-up loop. It is deliberately
  `settlement:'town'`, not an eighth formal city; its amenity registration is an
  explicit Chapter 3 exception, not a weakening of the seven-city contract.
- The moor is a 126×96 winding route with branch rewards, picnic/quest anchors,
  a viaduct, Roman culvert, and telegraph rhythm. The grounds stage the porter
  gate, wrecked greenhouse, academy frontage, quad, cricket edge, services, and
  the Clicker practice cart. The Old Stones use a ring-and-spring composition
  and retire hostile spawners after the Mainframe falls.
- The academy dungeon is no longer a sequence of placeholder corridors: the
  great hall/library/tuck-shop floor, classroom/fog-pipe floor, exam hall and
  raised Mainframe arena, patrol-driven dorm wing, and two-loop boiler plant all
  have distinct circulation. The coolant barrier is the exact save-facing
  `WINTERMOOR_COOLANT_CROSSING`; Freeze changes its five cells from blocking
  `K` to traversable `T` and restarts the scene so art/collision agree.
- Field PUPPET and Milo's Clicker are real overworld systems. PUPPET spends 14
  PP, rejects dogs and mind-immune targets, times out safely, and restores the
  borrowed body. Clicker requires Milo plus `milo_clicker` and `fleet_road`,
  controls only authored unoccupied machines inside their control rectangles,
  and ships with `wm_clicker_practice_cart` and `wm_fogworks_tug` interactions.
- Chapter fog, rain/wind/machine ambience, post-boss thinning and reactions,
  seven story cutscene beats, vehicle showroom/delivery feedback, and the
  Headmaster Mainframe at the canon **750 HP** all execute in the live runtime.
- Two retained source banks produce sixteen registered props: eight exterior/
  campus landmarks, three Lucille pieces, two additional machine-room pieces,
  and three stones/spring pieces. (The cargo net is deliberately reused in the
  machine plant.) The exact keys and native
  dimensions live in `docs/IMAGE_ASSET_MANIFEST.md` and
  `src/spritegen/authored.ts`.
- Save migration **v20** relocates saves from every old Chapter 3 layout to a
  deterministic walkable point and deterministically rehomes parked vehicles
  from the four rebuilt outdoor maps. Ownership, fuel, continent, story, party,
  and economy state remain exact. The
  twelve-map roster, migration fixtures, elevation/fog rules, machine schemas,
  PUPPET/Clicker helpers, amenities, vehicle UI, story beats, and post-boss
  retirements are covered by focused tests.

Release/maintenance risks:

- `src/data/maps_ch3.ts` is the canonical authoring source. Map-editor
  `maps.json`/`manifest.json` are generated review artifacts; regenerate with
  `npm run mapeditor:gen` and prove drift-free with `npm run mapeditor:check`.
- Preserve the first four Foggybottom facade positions/order: their generated
  unit ids back the dealer, flat, agency, and bank. Preserve both machine ids
  and the coolant-crossing rectangle; flags and focused tests depend on them.
- The strict visual audit still reports a pre-existing, non-failing inventory
  of 94 unregistered battle PNGs. That debt predates this Chapter 3 prop kit and
  is not evidence that these sixteen world props are unregistered.
- On this Windows workspace, invoke package binaries through `npx.cmd` when the
  PowerShell `npx` wrapper is blocked. Close every map/art change with typecheck,
  door audit, validate, focused tests, map render, balance, strict visual audit,
  full test, build, and live browser survey.
