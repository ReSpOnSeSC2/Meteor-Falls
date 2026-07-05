# HANDOFF — continue building Otterbrooke (Ch.1) from the elevated-map milestone

> Paste this whole file into a fresh Claude Code / AI session in `C:\Meteor Falls`. It is a
> self-contained continuation prompt: mission, exactly what's DONE, what REMAINS (prioritised),
> the map ARCHITECTURE + technical knowledge you need, the WORKFLOW + recipes + gotchas, and
> the REFERENCES to review. Read the "READ FIRST" docs before editing anything.
>
> _Supersedes `docs/OTTERBROOK_BUILD_HANDOFF_PROMPT.md` (that one predates the elevation merge)._
> _Baseline: commit **`4a9325e8`** on **main** ("Ch.1 Otterbrooke: elevated Onett rebuild")._

---

## 0. MISSION

Continue the **EarthBound-stylization overhaul** of *Meteor Falls* (an EarthBound-style JRPG).
Current focus = **MAP #1: Otterbrooke = ONETT** (Chapter 1). The user locked a concept image and
directed: recreate this town in-game as ONE continuous world, with detailed unique interiors,
faithful to Onett's design language (NOT a pixel-copy). The **overworld is DONE** (a single
elevated map — town + wooded hill + crater + cave, no map transitions). The remaining work is
mostly **interiors + mechanics + authored cliff/cave art + the Pemberton/27-Maple beats**.

**THE VISUAL TARGET is locked:** `assets/art/masters/world/otterbrook-CONCEPT-locked.png`
(the user's own ChatGPT image — a top-down Onett grid town below a wooded hill whose top-left has
a CAVE and top-right has the meteor CRATER, with Jay/Chad houses on a terrace and Pond Park SW).

---

## 1. READ FIRST (canonical — this prompt is a summary)

1. **`CLAUDE.md`** — art is AUTHORED PNGs via the ChatGPT→PNG pipeline (`src/spritegen/` is FROZEN,
   boot-fallback only); the balance/money curve is canon.
2. **`docs/EARTHBOUND_MAP_REFERENCE.md`** — the design PATTERNS distilled from EarthBound's map
   archetypes (towns, wilderness, dungeons, interiors, sky-islands, deserts). **Read this before
   authoring any map** — it tells you the layout grammar to apply in our tiles.
3. **`assets/art/masters/reference/CATALOG.md`** — the renamed EarthBound reference IMAGES
   (`lvl1_onett_*`, `lvl4_fourside_*`, etc.) + 96 `.url` links to the sprite/tileset resources.
   ⚠ **The copyrighted raster screenshots are gitignored (local-only)** — a fresh clone has the
   CATALOG descriptions + `.url` links but NOT the images. If you need the actual reference art,
   ask the user (it's on their machine) or open the `.url` resource links.
4. **`docs/OTTERBROOK_INTERIOR_MANIFEST.md`** — THE per-building interior build spec (rooms,
   furniture, keepers, mechanics). **This is your primary to-do list for the interiors phase.**
5. **`docs/OTTERBROOK_ONETT_REBUILD.md`** — the town/boss/Pemberton/27-Maple blueprint (§3 boss cave,
   §5 Pemberton, §4 27-Maple). Note: the overworld parts (§2 the elevated town) are now DONE.
6. **`docs/OTTERBROOK_ASSET_MANIFEST.md`** — the exterior/prop/tile asset ledger (facades + 34 props
   + 4 tile-skins = DONE).
7. **`docs/ART_PIPELINE.md`** — the authored-PNG pipeline + per-category sizes.
8. Memory (loaded each session): `otterbrook-onett-rebuild` (full log + gotchas),
   `earthbound-stylization-overhaul`, `world-overhaul-program`, `image-generation-workflow`,
   `character-art-reference-paste`, `parallel-edit-coordination`, `git-workflow`.

**FIRST STEP EVERY SESSION:** `git fetch` + `git status` + check mtimes on the hot files
(`src/data/maps.ts`, `src/scenes/OverworldScene.ts`, `src/spritegen/authored.ts`, `tiles.ts`,
`src/data/dialogue.ts`) — siblings edit concurrently. Work stays UNSTAGED; the user drives git.

---

## 2. WHAT IS DONE (on main, `4a9325e8` — gates green: tsc 0 · validate · vitest 1354 · build 0)

### 2a. ALL authored ART (prior sessions)
- **19 building facades** (`assets/art/world/facades/*.png`, wired in `BASE_FACADE_KEYS`).
- **34 interior furniture props** (`assets/art/world/props/*.png`, wired in `WORLD_PROP_KEYS` +
  `AUTHORED_WORLD_PROP_DISPLAY_SIZE`).
- **4 interior tile skins** (`tile_{pharmacy,civic,kitchen,concrete}_{floor,wall}` in the tile strip).

### 2b. The town-assembly SHELL (S3)
`growOtterbrook` was rewritten from scratch (the old frozen `buildOtterbrook` core is DELETED): a
believable Onett grid town — civic quarter (columned City Hall + fountain plaza + red-cross clinic),
a Main St drag, a pedestrian MARKET PLAZA (BURGER/BANK/BAKERY/ARCADE), residential blocks, apartment
blocks, Pond Park (Heart Oak + duck pond + gazebo + playground), an "OTTERBROOKE, OH" sign at the
east gate. 18 authored facades placed; the destination buildings hand-doored to interiors. 3 new
**shop-stub interiors** (`bank_int`/`bakery_int`/`burger_int` via `buildShopStub`). Every Ch.1 story
hook re-homed (Biscuit + mail quests, Chad, Borden frame-up, twins, presents, daybreak gate).

### 2c. The ELEVATION MERGE (S4) — the big one
The town + hill + crater + cave are now **ONE continuous elevated map** — you walk from the town UP
through terraces to the crater with **NO map transition**. Structure:
- **`buildOtterbrookTown()`** = the flat L0 town (126×112) at y0.
- **`growOtterbrook()`** copies it into the LOWER band of a tall **126×177** grid at offset
  **`OTTERBROOK_TOWN_BASE = 65`** (all town content shifted +65 rows), then authors the wooded hill
  above via the **foggybottom elevation engine** (`K` cliff-face / `^` lip / `T` stairs +
  `elevation: { level }` plane, descending **L3→L0**):
  - **L3 crest (rows 0-20):** the meteor CRATER (right — `meteor_rock_hickory_hill`@(72,7),
    `sentinel_husk`@(69.5,6), the `crater` trigger `{x:66,y:9,w:8,h:3}` → the Hush-Sentinel
    `craterScene`) and the **CAVE mouth** (left — `burrow_mouth`@(14,3) + a door@(14,4) → the
    Titanic Tick dungeon).
  - **L2 climb (rows 23-42):** winding trails, Pemberton's fenced `bldg_ob_workshop` (decorative),
    Biscuit breadcrumbs, Hodgkin's mower patrol + shed, climb spawners, presents/rests.
  - **L1 terrace (rows 45-62):** `house_rex`@(12,46) + `house_chad`@(24,46), porch trigger, yards,
    lemonade twins, the sniff-trail head.
  - **L0 town (rows 65+):** the town, offset down.
  Seams: L3→L2 stairs at x22/x66; L2→L1 at x22/x52; L1→L0 at x22/x52.
- **Boss relocated:** the Titanic Tick (HP 200) is reached via the **hilltop cave** — the existing
  `oak_roots`→`oak_hollow`→`oak_heart` dungeon (the `heart_oak` trigger → the Tick) was re-pointed to
  enter from the cave; the **Pond-Park Under-Oak burrow is retired** (Heart Oak stays as a healed
  landmark). ⚠ The cave/dungeon is still the OLD oak gray-box art (see REMAINS §3.3).
- **4 climb maps RETIRED** (`hill_road`/`hickory_trail`/`whisperwood_rise`/`hickory_hill`) — builders
  deleted, content re-homed, all consumers updated (`chapters.ts`, `CH1_STORY_NIGHT_MAPS`,
  content-validate TABLES, render-map, saves.test).
- **Opening cinematic COLLAPSED** to one on-map sequence: `openingPhase` keys phase 1 on
  `otterbrook` (not `hickory_hill`); `playOpeningCinema` → `openingHouseOverview` →
  `openingHillClimb` run INLINE (no cut); only the `rex_bedroom` wake still cuts. `NameEntryScene`
  boots `otterbrook` at the crater.
- **Guards:** new `src/data/maps_otterbrook.test.ts` (determinism, 4-level plane, crater+cave, no
  `hill_road` door, all facade doors two-way); `'otterbrook'` added to `ELEVATED_ALLOWLIST`; the old
  `world_block.test.ts` frozen-core block removed.

### Interiors that EXIST today (real MapDefs)
`rex_home` (+ `rex_hall`/bedrooms), `drugstore_int`, `arcade_int`, `otter_station`,
`otterbrook_cityhall`, `bus_depot_int`, `chapel_int`, `downtown_otterbrook` (+ `hardware_int`,
`diner_int`, `otter_clinic_int` reached from downtown), and the 3 **stubs** `bank_int`/`bakery_int`/
`burger_int`.

---

## 3. WHAT REMAINS (prioritised)

### 3.0 LIVE-VERIFY the elevated map (do this FIRST — it was blocked last session)
The gates are green but the visual walk-through was blocked by a dev-server boot-stall. Boot the
game (foreground window boots fast), then WALK: town → up the L1/L2/L3 stairs to the crater + cave,
confirm the **walk-behind elevation renders** (hero occluded behind cliff faces), the stairs work,
there's **no map transition**, the cave enters the Tick dungeon, and the **opening cinematic plays**
end-to-end (new game → meteor-fall at the crater → house pan → climb → bedroom wake → emerge). Fix
anything that reads wrong. (Warp recipe: §5.)

### 3.1 THE ~30 BESPOKE INTERIORS (the bulk — per `OTTERBROOK_INTERIOR_MANIFEST.md`)
- **Enrich the 3 stubs** (`bank_int`/`bakery_int`/`burger_int`) to their full multi-room specs
  (bank + vault; bakery + kitchen; burger + grill line).
- **Build the ~27 others**: `drugstore_int` upgrade + `drugstore_pharmacy`; `otterbrook_council`;
  `otter_clinic_ward`; `chad_home` (+ bedroom); `house_green_int`; the tract homes; the apartment
  lobby/units; `workshop_int` (+ nook). All the authored furniture props already exist — place them.
- Each: hand-authored `MapDef` (mirror `buildRexHome`/`buildDrugstoreInt`), register in `MAPS` +
  `ROOMY_INTERIORS` + optional `MAP_AREA`, wire the facade door, add a save `payphone`.
- **Apply the 4 tile skins** per-interior (a per-map `TILE_SKIN` in `OverworldScene.buildTiles`,
  mirror `UNDEROAK_TILE_SKIN`): pharmacy/clinic→`tile_pharmacy`, civic/bank/vault→`tile_civic`,
  bakery/burger kitchens→`tile_kitchen`, workshop→`tile_concrete`.

### 3.2 BANK + PHARMACY MECHANICS
Bank teller → a **savings/loan interface tied to `src/data/fortune.ts`** (net-worth axis; keep
combat < money). Pharmacist → a **status-cure / antidote shop** (reuse the shop system + item table).

### 3.3 FRESH GIANT-STEP CAVE (§3) — replace the oak gray-box
The hilltop cave currently re-points to the OLD `oak_roots`→`oak_hollow`→`oak_heart` dungeon (retired
root/ember/glow-shroom art). Author a **fresh carved-stone cave descent + a light-shaft sanctuary**
(the diversity gate rejects re-skinning the oak dressing). Keep the `heart_oak` trigger → Titanic
Tick (HP 200) unchanged. Reference: `docs/EARTHBOUND_MAP_REFERENCE.md` §3 (branching cave route-map)
+ the `Giant Step.url` / cave `.url` resources.

### 3.4 FULL PEMBERTON BEAT (§5)
The `bldg_ob_workshop` on L2 is decorative (blocked by a sawhorse; the sign reuses `locked_house`).
Build `workshop_int` (+ nook), author `npc_pemberton_night`/`_day` + `sign_pemberton_gate` dialogue
(replace the `locked_house` placeholder), the flag-gated (`tick_defeated`) daytime treasure + the
`met_pemberton` Ch.10 canon-bridge hook. Wire the workshop facade door (currently doorless).

### 3.5 27 MAPLE WEST (§4)
The buy flow ships (`agencyBeat`, ADR-115; don't rename the `27_maple` id). Build a west section
(`27_maple_west` settlement + `27_maple_int` interior with a save phone) + the west-edge door on
otterbrook (`x:0`, a mid-height row) + relocate the realtor beat; entry = OPEN HOUSE.

### 3.6 AUTHORED CLIFF-CORNER + STAIR ART (§6) — make the terraces read as Onett
The elevation currently uses the gray-box `K`/`^`/`T` tiles (vertical bands). Install the authored
**rounded Onett cliff-corner nine-slice + stair art** (the cliff-continuous/corner sheets in
`assets/art/masters/world/onett-cliff-continuous.png` + the ChatGPT cliff kit) so the hill reads as
rounded Onett cliffs, not gray boxes. This is an apply-kit tile job (clone `apply-cliff-kit.ts`).
Also author the CAVE mouth + crater dressing so the crest matches the concept.

### 3.7 HILL/TERRACE VISUAL POLISH
Trees + fences on the L1/L2 terraces, the crater bowl dressing, the two winding trails, and a look
pass so the climb reads like the concept image.

---

## 4. MAP ARCHITECTURE + KEY TECHNICAL KNOWLEDGE (read before editing `maps.ts`)

- **Structure:** `buildOtterbrookTown()` returns the flat town at y0; `growOtterbrook()` offset-copies
  it into rows [`OTTERBROOK_TOWN_BASE`=65 .. 177) and authors the hill above. **Town coords in
  `buildOtterbrookTown` are y0-relative; the assembled map adds +65** (props/npcs/signs via `offY`,
  spawners/triggers via `offRect`). `OTTERBROOK_EAST_GATE = {x:124, y:50+65=115}` (meadow_mile reads
  the const). If you move town content, edit `buildOtterbrookTown`; if hill content, edit the
  `growOtterbrook` hill section.
- **Elevation engine (foggybottom, `maps_ch3.ts:122`):** `elevation: { level }` is a per-row plane of
  '0'-'3' matching grid dims. `K`=cliff face (SOLID wall), `^`=lip (walkable upper rim), `T`=stairs
  (walkable, steps EXACTLY 1 level). Level generated per-row: a terrace band + its lip = the upper
  level; the K-seam rows stay upper EXCEPT `T` cells drop to lower. **LAW** (`elevationLawViolations`,
  `isSolid = ch==='K'`): every level change = a K-wall OR a single-step T-stair (no bare "invisible
  ledge", no >1-level jump, dims match). Stairs ≥3-wide. `ELEVATED_ALLOWLIST` (`elevation.test.ts`)
  must list any elevated map.
- **Facade render/placement:** authored facades render at **scale 1 = texW/64 tiles** (`TILE_PX=64`).
  `bldg_*` + `LANDMARK_FACADE_SPRITES` collide as their DRAWN texture footprint (ADR-051 — the data
  `solid` is ignored); a hand `door:{ox,oy,w,h,to,tx,ty}` immunises them from `occupyCity` auto-doors.
  Door centre = `img.x + s(ox) + s(w)/2` with `s()=×4`, so a CENTRED door has `ox = texW/8 - w/2`.
  `house_rex` is NOT a landmark (keeps its data solid+door for the opening pan).
- **Interior authoring:** mirror `buildRexHome`/`buildDrugstoreInt`. `MapDef{ id,name,music:'home',
  interior:true, grid, props, npcs, signs, phones:[{x,y}], atms?, doors:[{...,indicator}], spawners,
  triggers }`. Register in `MAPS`; add single-room ids to `ROOMY_INTERIORS` (grows to 16×11); compute
  the street exit via `doorstepOf(otterbrookMap, '<int_id>')`. Door indicators: bottom exit=`mat`,
  inter-room top-wall=`door`, level change=`stairs`. Reciprocate every linked door (ADR-138 re-aims
  landings snug; `tx/ty` in native px = tile×16). Every shop/civic needs a SAVE `payphone` prop +
  matching `phones:[{x,y}]`. ⚠ `otter_station`'s ADR-118 Borden holding cell is byte-locked.
- **Opening:** `openingPhase` (`src/engine/opening.ts`) returns phase 1 on `otterbrook`+`openingRequested`
  and phase 4 on `rex_bedroom`; the dispatch (`OverworldScene.ts ~5036`) runs `playOpeningCinema`
  (which chains house-pan + hill-climb inline) then cuts to the bedroom. The crater/house/climb all
  self-derive from the live props (`meteor_rock_hickory_hill`, `house_rex`).
- **Boss:** the hilltop cave door (`otterbrook`, tile 14,4) → `oak_roots` → `oak_hollow` → `oak_heart`
  (the `heart_oak` trigger fires the Titanic Tick). `oak_roots`'s return door lands at otterbrook
  (232,96), by the cave.
- **Determinism + `noUnusedLocals:true`:** seeded RNG only; delete dead code (an unused local/function
  fails tsc). No `Date.now()`/`Math.random()`.

---

## 5. WORKFLOW + RECIPES + GOTCHAS

**Gated slice loop (each slice ends green + live-verified; user drives commits):**
`npx tsc --noEmit` → `npm run validate` (content + door-audit + reachability + elevation law) →
`npx vitest run` (full 1354; run one file first while iterating) → `npm run build`. Then LIVE-VERIFY
by WALKING (not warp-only).

**Authoring art (never procedural — `src/spritegen/` is FROZEN):** ChatGPT→PNG. Facades:
`node tools/slice-facade-row.js <src> keys --bg=FF00FF --tol=60` → `BASE_FACADE_KEYS`. Props:
`node tools/slice-prop-strip.cjs <src> <prefix> --expect=N --target=256` → `WORLD_PROP_KEYS` +
`AUTHORED_WORLD_PROP_DISPLAY_SIZE` (⚠ display `{w,h}` MUST be aspect-matched to the sliced art).
Tiles/skins: append at the `TILESET` tail + run the matching `apply-*-kit.ts` (pair every append with
its apply run or `authored_assets.test` fails). **ChatGPT refuses "rocket"/"rocketry"** → reword.

**Live-verify recipe:** `preview_start meteor-falls` (`.claude/launch.json` exists). In a foreground
window the game boots fast; a background/throttled reload STALLS the asset loader (known gotcha — pump
`g.loop.step` won't beat the network). Warp: `window.mfGS.reset()`; set flags (`zapper_done`,
`meteor_fell`, `intro_done`, `tick_defeated` for the daytime post-boss town); `game.scene.start(
'overworld', {mapId:'otterbrook', x:<tile*64>, y:<tile*64>})`; pump `g.loop.step`. Spawn in the L0
town (rows 65+) and walk UP to check the terraces.

**Gotchas discovered this session:** balanced-brace deletion can orphan a preceding doc comment (fix
the dangling `*/`). Two `sawhorse` props now exist (daybreak gate + Pemberton) — match tests on
`unlessFlag`, not `.find()`. When you move a landmark, grep for hardcoded coords that point at it
(`rex_home`/`oak_roots` return doors, `MAP_REFLECT`, opening literals). Interiors reached from
`downtown_otterbrook` (hardware/diner/clinic) are a separate annex — don't double-door them.

---

## 6. REFERENCES — REVIEW THESE BEFORE AUTHORING (the user emphasised this)

Before building ANY map/interior/cave, review the reference material and match the archetype:
1. **`docs/EARTHBOUND_MAP_REFERENCE.md`** — the design PATTERNS (which grammar each area uses). This
   is the "how to build it in our tiles" guide.
2. **`assets/art/masters/reference/CATALOG.md`** — the labelled EB reference images
   (`lvl1_onett_interiors_spritesheet` is literally the interiors backlog; `lvl4_fourside_*`,
   `lvl5_winters_*`, etc.) + the 96 `.url` resource links (tilesets/exteriors/interiors). ⚠ The
   raster images are LOCAL-ONLY (gitignored) — on a fresh clone you have the descriptions + links; ask
   the user for the actual images if you need them, or open the `.url` links.
3. **`assets/art/masters/world/otterbrook-CONCEPT-locked.png`** — THE locked visual target for the
   whole town (read it with the Read tool to view it).
4. **EB→level convention** (user, 2026-07-04, for the reference filenames): Onett=1, Twoson=2,
   Threed=3, Fourside=4, then Winters=5, Summers=6, Scaraba=7, Dalaam=8, Deep-Darkness=9. (This is a
   simpler naming than the nuanced program mapping in `EARTHBOUND_STYLIZATION_OVERHAUL.md` — the user
   overrode it for the reference files; confirm 5-9 with the user if it matters.)

---

## 7. IMMEDIATE NEXT ACTION

1. `git fetch` / status / mtimes; skim the READ-FIRST docs + review the REFERENCES (§6).
2. **Live-verify the elevated map (§3.0)** — walk town→crater+cave in a foreground window, confirm no
   transition + walk-behind rendering + the opening plays. Fix anything visually wrong.
3. Confirm sequencing with the user, then execute in gated slices. Recommended order: **interiors
   (§3.1) + bank/pharmacy mechanics (§3.2)** (the bulk, self-contained, all art exists) → **fresh
   cave art (§3.3) + Pemberton (§3.4)** → **cliff/stair authored art (§3.6) + hill polish (§3.7)** →
   **27 Maple (§3.5)**. Author bespoke art via the ChatGPT recipe only where a gap is flagged.

_Everything stays UNSTAGED; the user drives git. Baseline = `4a9325e8` on main._
