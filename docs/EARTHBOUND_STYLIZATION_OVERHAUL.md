# EARTHBOUND STYLIZATION OVERHAUL — the game-wide program

User directive (2026-07-03): **scrap and rebuild EVERY overworld/city/route tileset + map in
authentic EarthBound (Mother 2) style** — rounded AND jagged organic tiles, believable, polished.
Each map is rebuilt based on its **EarthBound map equivalent**; the user supplies an EB reference
per map; we go **MAP BY MAP**, including the **transitional/route areas** between towns. This is the
umbrella program; the Otterbrook→Onett rebuild (`docs/OTTERBROOK_ONETT_REBUILD.md`) is map #1 (the
pilot) and slots under this. Built on the World Overhaul engine (`docs/WORLD_OVERHAUL_HANDOFF.md`,
elevation P0–P5 done) + the S5 anti-formula Prime Law (`docs/DIVERSITY_LEDGER.md`).

Grounded in a 5-analyst workflow (2026-07-03): tile-system audit, full map inventory, the EB tile
vocabulary, the MF→EB mapping, and the pipeline/seamless-tiling solution. Cited files inline.

## 0. THE ANSWER: "do we need more than the cliffs?"

**Yes — cliffs are ~1 of 7 tile families (~5–20% of the surface).** The rounded cliff nine-slice +
organic-curve sheet already authored (ChatGPT, user-approved) are the dramatic-but-infrequent tiles.
What makes a screen read as EarthBound is the **ground vocabulary underfoot** — and the current town
"looks horrible / not like a real town" precisely because that vocabulary is generic. The full set:

| # | Family | EB role | Status | Seamless mechanism |
|---|---|---|---|---|
| 1 | **Ground fields** (grass A/B/C, flat-with-sparse-tuft; sand, snow, muck, stone, brick) | the lawn/floor | ⚠️ base grass only | trivial self-tiling flat fill |
| 2 | **Ground↔ground transitions** (grass↔dirt, grass↔sand, grass↔snow, grass↔muck) | EB's dithered nibbled boundary — **the defining move** | ❌ biggest gap | **47-blob autotile** |
| 3 | **Cliff face + corners/caps/inner-corners** | the terrace wall | ⚠️ face bands (P4) done; corners/stairs deferred | **47-blob** face |
| 4 | **Cliff-lip** (`^`, the grass-over-rock rounded rim) | the bluff edge | ⚠️ flat placeholder | **47-blob edge** |
| 5 | **Stairs** (top/mid/base) | the cross-level connector | ⚠️ sidewalk placeholder | small fixed 3-band set |
| 6 | **Water/shore** (sea/pond/river + foam crest) | coastline | ⚠️ single-char foam | **47-blob shore** |
| 7 | **Path/road + Belts** (hedge/bramble) | trails, foliage walls | ✅ 16-mask autotiles done | already autotiled |

Plus, cross-cutting: **round biome-specific trees** (`treeSprite` is region-blind, only ~4 temperate
variants — a flagged gap), **tall-grass** (the iconic EB walk-through weeds), **flowers/tufts**,
region **props**, and **feathered biome-seam transitions**. See `analysis-earthbound-tile-vocabulary`
(scratchpad) for the exhaustive per-biome table.

## 1. THE EARTHBOUND ORGANIC LAW (every tile family obeys these)

EarthBound's terrain was art-directed off paper-clay models + a crayon palette. At 16×16 (→64px):
1. **No visible tile grid.** Material edges are **rounded/jagged/dithered nibbles** — the path *bites*
   into grass in 2–3 stepped pixels; nothing meets at a clean 90° line.
2. **Flat interiors, busy edges.** Tile centers are near-noise-free; all life is in dedicated
   tuft/flower/edge tiles sprinkled sparsely. (Uniform speckle = reads "generated.")
3. **Blobby, not linear, masses.** Trees = fat rounded canopies; bushes pillowy; rocks potato-shaped;
   ponds kidney-shaped with a wobbling foam rim — never rectangles.
4. **Two-tone dithered warm palette.** 3–4 step ramps, checker-dither not gradients, slightly
   oversaturated "crayon" hues.
5. **Autotiling is mandatory for every edge material** (see §2).

## 2. THE SEAMLESS-TILING SOLUTION (the #1 technical risk — SOLVED)

**Problem:** ChatGPT authors beautiful *individual* 64px cells, but the grass/rock boundary lands at
a different position per cell → two cells side by side show a seam. Placing our nine-slice/curve
tiles raw does NOT tile.

**Solution — 47-blob (8-neighbour Wang) autotiles, authored as ONE continuous reference-block per
family, sliced into cases.** Author a single continuous image (e.g. a 5×5 grass-island-in-cliff
showing every outer corner, inner elbow, straight run, and single nub **in context, mated**), then
the slicer cuts the 47 cases out of that one image at grid positions — so mated edges come from
literally-adjacent pixels and are **seamless by construction**. Cheaper (1 sheet, not 47 asks), more
on-model (ChatGPT keeps global coherence), and it IS EarthBound's actual construction (Mother 2
tilesets are Wang-style edge sets; 16-mask "bites" corners, which is fine for a hedge but fake for a
cliff — 47-blob is the minimum for rounded organic corners).

**Why 47-blob and not the alternatives** (evaluated against the real constraints):
- **16-mask** (hedge/bramble) — cannot distinguish an outer corner from a diagonal-only neighbour →
  bitten 90° corners. Fine for belts, wrong for cliffs. (Keep for hedge/bramble/path.)
- **Boundary-alignment warp** — destroys the EB dither rhythm, fights the AUTHORED law, can't do
  corners. **Rejected as primary** (keep only as a within-sheet drift cleanup).
- **Hand-painted CHUNKS as terrain** — **breaks the tile-based walk-behind elevation** (`buildElevationOverlay`
  emits one image per `K` cell at `(y+1)·TILE_PX` so a lower player sorts in front of the exact rows
  below their feet; a monolithic chunk has ONE depth). **Rejected for terrain**, but **PERFECT for
  non-collidable signature scenery** (a waterfall, a statue, a rock arch) via the prop system — the
  S5 "distinct every step" lever.

**Machinery already exists (zero new pipeline infra).** A 47-set is "the hedge kit with 47 cells + an
8-bit mask." Reuse: the `spans()` magenta-grid slicer, `scaleCellAlpha/Opaque`, `over()/rimEdge()`
compositors, the BAK-first surgical column write at `idxOf(name)*64` (`tools/apply-hedge-kit.ts`,
`apply-cliff-kit.ts`). Extend `buildElevationOverlay` (`OverworldScene.ts:1148`) to compute an
8-neighbour blob index over `K`/`^` cells (same logic as the `buildTiles` hedge mask at `:968-984`,
just 8-bit) and pick `cliff_face_<blob>`. Flat fields = trivial self-tiling cells. Stairs = a small
fixed 3-band set. **Universal geometry, per-region recolor:** one 47-blob shape set, N cheap
per-region skin strips that override the same indices (how China/Romania recolor shared shapes today).

## 3. THE MF → EARTHBOUND MAPPING + BUILD ORDER

Each MF region steals the *complete stylization grammar* of its EB equivalent (terrace shape, ground
family, foliage, palette, signature gimmick, route rhythm). Full table + motifs in
`analysis-mf-to-earthbound-mapping` (scratchpad). Summary + the leverage-optimized order:

**USER LOCK (2026-07-08): the first FOUR towns the player visits mirror EarthBound's
first four, in order — Onett / Twoson / Threed / Fourside — in SNES EB style and feel.**
Town 2 was RENAMED **Brickton → TWOTON** (internal id stays `brickton` for saves/flags)
and its LAYOUT rebuilt to the Twoson grammar the same day (the user's Twoson map ref):
the roads draw a big "2" (top bar → 45° diagonal → the drag), Burglin-Park market in
the bowl, hospital/shops/theater-corner on the drag, river + bridge → docks east, pond
park, skyline corner (towers + Spire) on High St. **Built IN THE MAP EDITOR** — the map
is the editor document `tools/mapeditor/twoton.json` ⇄ `src/data/maps_twoton.ts` (the
editor's TS export); dynamic wiring (named doors, occupy, overpass re-aim) stays in
maps.ts. This supersedes the frozen-core pair (buildBrickton/growBrickton, retired).
Twoton's EB TILE-ART kit (Eagleland grass/path/river/trees) is still to be authored —
the rebuild is the Track-A layout; the town renders in the existing tileset until then.

| Order | MF region | → EB equivalent | Establishes / reuses |
|---|---|---|---|
| 1 | **Otterbrook/USA** (Ch1) | **Onett** *(LOCKED, pilot)* | Establishes the **universal 47-blob geometry** + Americana ground kit + Giant-Step boss |
| 2 | **TWOTON** (ex-Brickton, Ch1) | **Twoson** *(LOCKED; layout SHIPPED 2026-07-08)* | Same Eagleland palette; the "2" road grammar + market park done; EB tile kit pending |
| 3 | **Foggybottom/Wintermoor** (Ch3) | **Winters** | Fog-terrace pilot shipped; **locks Winters grammar** (reused Ch4, Ch10a) |
| 4 | **Puerto Sol** (Ch2, town #3) | **Threed** *(USER LOCK — layout SHIPPED 2026-07-08)* + **Scaraba/Pyramid** (dungeon) | Spine + gate arches, slanted parallelogram blocks, catedral plaza, EL CAMPO VIEJO graveyard; EB tile kit pending |
| 4a | **Las Dunas** (ex-jungle_1/2, the 3→4 crossing) | **Dusty Dunes Desert** *(layout SHIPPED 2026-07-08)* | South road band + dunes + rock fringes + oases + waystation + the east bridge; rides the Zanzibel ochre skin until its own kit |
| 4b | **Valle Dorado** (Ch2, town #4) | **Fourside** *(USER LOCK — layout SHIPPED 2026-07-08; village → CITY)* | Diamond boulevards + river seawall + the relocated Starfall Spire/towers + THE GOLDEN MINUTE clock plaza + the old quarter |
| 5 | **Kvisthavn/Lilleby** (Ch4) | **Winters** + scale-gag (Saturn Valley tone) | Reuses Winters; giant-scale layer built |
| 6 | **Minimus** (Ch5) | **Dalaam** (jewel-box scale) | Reuses hedge autotile; **locks Dalaam grammar** (reused Ch8) |
| 7 | **Zanzibel** (Ch6) | **Scaraba/Dusty Dunes** | Reuses Pyramid/desert kit; cleanest 1:1 |
| 8 | **Lotus Harbor** (Ch8) | **Dalaam** (temple) + spore-forest | Reuses Dalaam; +bamboo, +spore layer |
| 9 | **Chandrapore** (Ch7) | **Fourside** (density) + **Scaraba** (warmth) | **Biggest art lift** (hotel/apartment facades = zero keys) — its own session |
| 10 | **Valea Stelelor** (Ch9) | **Threed** (castle) + Winters/Dalaam (monastery) | Emotional heart; bespoke Threed gothic palette |
| 11 | **Aurora + Mauna Lani** (Ch10) | **Winters-ice** + **Summers-lava** | Reuses proven grammars + elemental layers |
| 12 | **Mars/Sea of Silence** (Ch10) | **Cave of the Past + Magicant + Giygas lair** | **Do LAST** — most bespoke + tonally load-bearing |

Route/transition maps get their own EB-between-town treatment (Peaceful Rest Valley, the Winters road,
Dusty Dunes, the caves) — table in the mapping analysis. **Deviations from strict 1→10:** Ch2 after Ch3
(so coast+desert kits exist before mid-game), Ch8 before Ch7 (so Chandrapore's huge lift sits alone,
late). If the user prefers strict chapter order, only cost is authoring Chandrapore's facades earlier.

## 4. THE PER-REGION PIPELINE (~4–6 ChatGPT batches; front-loaded on Otterbrook)

Unit of work = **a region** (a biome shared by a town + its routes = one skin strip = one batch set).
Per region:
1. **Concept/palette blueprint** (concept-first, anti-formula): from the user's EB reference, enumerate
   which of the 7 families this region uses (Onett = all; a desert route drops shore, adds sand-transition),
   its signature gimmick, its palette. (Fable-5-tier judgment; fall back to Opus if credits out.)
2. **Author the sheets via ChatGPT** (reference-paste the EB ref + the approved Otterbrook cliff for
   one coherent world): each **flat field** = a cell on a few-cell strip; each **47-blob family** = ONE
   continuous reference-block (§2); **stairs** = a small strip; **region trees/props** = their own sheet.
   ~4–6 sheets (later regions RECOLOR the universal geometry → ~2–3). **User approves each render.**
3. **Install at the TILESET tail** (frozen-column law, BAK-first, byte-identical to other maps):
   - simple grounds → the partial-override **skin strip** (clone `sync-romania-tiles.ts` + a
     `<REGION>_TILE_ART` in `authored.ts` + a `<REGION>_TILE_SKIN` remap + `buildTiles` branch).
   - 47-blob families → the **apply-kit** (clone `apply-cliff-kit.ts`: `spans()` the block, cut the
     cases, area-average to 64px, surgical write at `idxOf`). Each dumps a **proof PNG** (autotile
     mating proof — review before commit). **LAW:** every tail append is immediately followed by its
     `apply-*`/`sync-*` run or the size-pin (`authored_assets.test.ts:155`, `strip.w===TILESET.length*64`) fails.
4. **Rebuild the map builder** to EB grammar (WILDERNESS/CITY design language: clearing-chain, winding
   center-tables, belts, opt-in elevation plane). New tile chars get `CHAR_LEGEND` entries or are
   emitted by mask (paint one char, `buildTiles` picks the blob).
5. **Gate + live-verify:** `npm run validate` (names resolve, doors walkable, `elevationLawViolations`
   clean, flat maps byte-identical) + door-audit + targeted vitest + the diversity-ledger critic +
   **walk it on foot** (verify seams mate, corners round, walk-behind reads, stairs cross). Log the
   map's signature in the diversity ledger.

## 5. IMMOVABLE LAWS (re-check every slice)

- **Art is AUTHORED via ChatGPT** (user approves each render); `src/spritegen/` FROZEN (fallback only);
  new tiles APPEND at the TILESET tail (no index shift → other maps byte-identical); never re-pack.
- **47-blob is the seamless mechanism** for boundary families; hand-chunks only for non-collidable scenery.
- **Universal geometry + per-region recolor** (one shape set, cheap skin strips).
- **Determinism** (seededRng only) so renders are screenshot-stable + the byte-identity/diversity gates
  are meaningful. **Solidity is immutable** per TILESET entry (skins are cosmetic; different solidity =
  a separate entry).
- **Balance/story canon** stay canon per the World Overhaul guardrails. **Git:** leave unstaged; user drives.

## 6. STATUS + NEXT

- **DONE:** the analysis (this doc). Otterbrook cliff LOOK approved (rounded nine-slice + organic-curve
  sheets, ChatGPT). Per-mover terrace collision engine (S-1, gated green). foggybottom fog-terrace pilot
  shipped (the Winters grammar seed). **TOWNS 1–4 LAYOUTS ALL SHIPPED (2026-07-08), every one an
  editor-authored document: TWOTON=Twoson (renamed, then DE-CITIFIED — its spire/towers/neon/clock
  moved out), PUERTO SOL=Threed, LAS DUNAS=Dusty Dunes (the 3→4 crossing, ex-jungle legs, ochre
  skin), VALLE DORADO=Fourside (village→CITY; inherited the Starfall Spire + towers + THE GOLDEN
  MINUTE beat). Gates green; EB tile kits per region are the remaining art batches. Track-B art
  list: Eagleland grass/path/river kit (Twoton), gloom-port kit + tombstone props (Puerto Sol),
  desert road/dune kit (Las Dunas), gold-deco facades (Valle) — plus the four Ch.2 cutscene PANELS
  that still depict the old jungle/village looks (banana_boat_to_puerto_sol, puerto_sol_arrival,
  llama_jungle_paths, valle_dorado_wishers) and the baked BRICKTON lettering (hospital sign, Bugle box).**
- **KEY PIVOT:** the approved cliff LOOK stays, but the production art is (re)authored as **continuous
  47-blob reference-blocks** for seamlessness (the nine-slice/curve sheets were the look study).
- **NEXT (Otterbrook/Onett, map #1 — establishes the universal geometry):** author the full Onett EB
  kit — the cliff-face + cliff-lip 47-blob continuous blocks, the grass fields + tall-grass, the
  grass↔dirt path transition, round oak trees, stairs — via ChatGPT (user approves each), install via
  the apply-kit/skin machinery, then rebuild `growOtterbrook` to the Onett grammar (`docs/OTTERBROOK_ONETT_REBUILD.md`).
- Then map-by-map per §3, each with the user's EB reference.

_Analyst reports (full detail) in the session scratchpad: analysis-{tile-system-audit, maps-regions-inventory,
earthbound-tile-vocabulary, mf-to-earthbound-mapping, pipeline-and-seamless-tiling}.md._
