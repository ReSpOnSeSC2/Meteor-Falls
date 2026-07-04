# HANDOFF PROMPT — finish the Otterbrooke = Onett rebuild (interiors + map assembly)

> Paste this entire file into a fresh Claude Code session in `C:\Meteor Falls`. It is a
> self-contained continuation prompt: the mission, exactly what is DONE, what REMAINS, the
> step-by-step WORKFLOW, every RECIPE and GOTCHA, the LAWS, and the full list of SAMPLE IMAGES
> (all in-repo). Read the two manifests it points at before acting.
>
> _(Supersedes the original "complete the Otterbrook → Onett map rebuild" handoff. As of 2026-07-04
> ALL authored art is done; the remaining work is the code-heavy interiors + map assembly.)_

---

## 0. MISSION

Continuing a **game-wide EarthBound-stylization overhaul** of *Meteor Falls* (an EarthBound-style
JRPG). Current work = **MAP #1: Otterbrooke = ONETT** (Chapter 1). The user **locked a concept
image** and directed, in two steps:
1. *"Generate every asset from this image individually to fully recreate this city in game."*
2. *"We need detailed, thorough, unique interiors for each building that is placed as well — many
   of these buildings should have multiple rooms — and must match what they are designed to be for."*

**ALL the authored ART is now DONE** (19 building facades + 34 interior furniture props + 4 interior
tile skins, all sliced, wired, gated). **What REMAINS is the code-heavy half:** build ~30 interior
MAPS, the bank/pharmacy gameplay mechanics, and the **`growOtterbrook` map REBUILD** that assembles
the whole Onett-faithful town, wires every door → interior, and gets live-verified.

---

## 1. READ FIRST (canonical — this prompt is a summary)

1. **`docs/OTTERBROOK_INTERIOR_MANIFEST.md`** — the per-building interior build spec: §2 per-building
   rooms/furniture/build-approach, §3 furniture batches (DONE), §4 tile skins (DONE), §5 the BUILD
   ORDER, §6 the RESOLVED decisions. **This is your primary to-do list now.**
2. **`docs/OTTERBROOK_ASSET_MANIFEST.md`** — the exterior/tile/prop asset manifest + reuse ledger +
   the locked-decisions block. Batch 2 (facades) is marked DONE.
3. **`docs/OTTERBROOK_ONETT_REBUILD.md`** — the town blueprint (topology, terraces, boss, Pemberton,
   27 Maple, the S-2…S-6 slice plan). Partly superseded by the locked image (see §2).
4. **`docs/EARTHBOUND_STYLIZATION_OVERHAUL.md`** (program), **`docs/ART_PIPELINE.md`** (sizes + the
   AUTHORED-PNG pipeline), **`CLAUDE.md`** (art-is-authored + balance laws).
5. Memory (loaded each session): **`otterbrook-onett-rebuild`** (full session log + gotchas),
   `world-overhaul-program`, `earthbound-stylization-overhaul`, `image-generation-workflow`,
   `door-snug-entry-and-grand-interiors`, `parallel-edit-coordination`, `git-workflow`.

**FIRST:** `git fetch` + `git status` + mtimes on the hot files (`src/data/maps.ts`,
`src/spritegen/authored.ts`, `src/spritegen/tiles.ts`, `src/scenes/OverworldScene.ts`,
`src/schemas/index.ts`, `src/data/dialogue.ts`) — siblings edit concurrently. Everything stays
**UNSTAGED**; the user drives git.

---

## 2. THE LOCKED CONCEPT + LOCKED DECISIONS (do not relitigate)

- **CONCEPT = `assets/art/masters/world/otterbrook-CONCEPT-locked.png`** ("Otterbrooke, OH — town
  under the stars"). The USER's OWN image, authored in their ChatGPT chat **"Expand Earthbound City"**
  (`chatgpt.com/c/6a4857b4-87a8-83ea-aba3-66e03ab080ca`) — NOT the earlier v1–v4 mockups (rejected).
  THE canonical visual target: a flatter, top-down Onett-downtown GRID town, text-labeled buildings,
  rounded brown cliffs framing a wooded meteor-hill (cave top-LEFT, crater top-RIGHT), a lower-left
  Pond Park, an "OTTERBROOKE, OH" highway sign, and two FOR-SALE lots.
- **Palette = DAYTIME masters + RUNTIME lighting.** All art is authored in clean daytime color. The
  three lighting states — (1) the NIGHT opening, (2) DAYTIME + HAZE until the Titanic Tick is beaten,
  (3) clear DAY after — are the engine's existing hush-dark overlays, NOT baked into art.
- **Labels = BAKED** into shop facades / the highway sign / FOR-SALE signs (game font can't draw text
  on art).
- **Boss = CAVE ON THE HILL (top-left).** The Titanic Tick's cave is on the hill, NOT a city spot.
  (Overrides `OTTERBROOK_ONETT_REBUILD.md` §1/§3.)
- **Interiors:** story homes get bespoke MULTI-ROOM interiors; the 4 generic tract houses + apartment
  units share a few layouts with furniture/NPC variety. **Bank + pharmacy get REAL mechanics** — the
  bank teller opens a **savings/loan tied to `src/data/fortune.ts`**; the pharmacist opens a
  **status-cure/antidote shop** (reuse the shop system). All 4 interior tile skins authored.

---

## 3. WHAT IS DONE (all AUTHORED ART — gated `tsc 0` · `validate 0` · `npm test` 1349/1349 · boots clean)

### 3a. 19 building facades — `assets/art/world/facades/<key>.png`, wired in `BASE_FACADE_KEYS` (`authored.ts`)
Sliced by `tools/slice-facade-row.js <src> <keys> --bg=FF00FF --tol=60`. 9 new `bldg_ob_*` keys, 10
existing overwritten on-model.

| Group | Keys | Master (`assets/art/masters/world/`) |
|---|---|---|
| Shops | `drugstore` · `bldg_ob_bakery` · `bldg_ob_burger` · `bldg_bank` · `arcade` | `otterbrook-shops-source.png` |
| Civic | `bldg_ob_city_hall` · `bldg_ob_clinic` · `facade_otter_station` (police) | `otterbrook-civic-source.png` |
| Story homes | `house_rex` · `house_chad` · `bldg_ob_house_green` · `bldg_ob_workshop` (Pemberton) | `otterbrook-houses-source.png` |
| Tract homes | `house_a` · `house_b` · `bldg_ob_house_c` · `bldg_ob_cottage` | `otterbrook-tract-source.png` |
| Apartments | `bldg_apartments` · `bldg_ob_apt_green` · `bldg_brickmore` | `otterbrook-apts-source.png` |

### 3b. 34 interior furniture props — `assets/art/world/props/<key>.png`, wired in `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE` (`authored.ts`)
Sliced by `tools/slice-prop-strip.cjs <src> <outPrefix> --expect=N --target=256`, renamed to keys.

| Batch | Keys | Master |
|---|---|---|
| Shop fixtures (10) | `prop_soda_fountain` `prop_pastry_case` `prop_brick_oven` `prop_flour_bins` `prop_mixing_station` `prop_burger_counter` `prop_flat_grill` `prop_deep_fryer` `prop_range_hood` `prop_pharmacy_rack` | `otterbrook-shopfix-source.png` |
| Domestic (5) | `fridge` `dining_table` `mailboxes` `rocking_chair` `trophy_shelf` | `otterbrook-domestic-source.png` |
| Bank + civic (9) | `prop_teller_grille` `prop_velvet_rope` `prop_rate_board` `prop_vault_door` `prop_deposit_boxes` `prop_gold_stack` `civic_directory_board` `ballot_box` `council_podium` | `otterbrook-bankcivic-source.png` |
| Police + medical (6) | `wanted_board` `gun_rack` `cell_bars` `evidence_locker` `privacy_curtain` `iv_stand` | `otterbrook-policemed-source.png` |
| Workshop (4) | `prop_rocket_fuselage` (a brass CONTRAPTION — see §7 gotcha) `prop_workbench` `prop_blueprint_table` `prop_parts_bin` | `otterbrook-workshop-source.png` |

### 3c. 4 interior tile skins (8 tiles) — installed in the tile strip
`TILESET` tail (`tiles.ts`, `export const TILE_SKIN_BASE`), columns 171–178 of
`assets/art/world/otterbrook_tiles_16.png`, written by **`tools/apply-tileskin-kit.ts`** from
`otterbrook-tileskins-source.png` (proof: `output/tileskins_proof.png`). Keys:
`tile_{pharmacy,civic,kitchen,concrete}_{floor,wall}`. Floors `solid:false`, walls `solid:true`;
`make()` reuses `floorWood`/`wallInterior`/`officeFloor`/`officeWall` (spritegen FROZEN). **Not yet
USED by any map** — interiors opt in during their build (see §4/§5).

### 3d. Manifests + decisions written; memory updated; all reference images stabilized in-repo (§6).

---

## 4. WHAT REMAINS (the code-heavy half)

**B — Build ~30 interior MAPS** (the bulk). Per `OTTERBROOK_INTERIOR_MANIFEST.md` §2 + §5. Hand-authored
`MapDef`s (mirror `buildRexHome`/`buildRexHall`/`buildBedroom`, `src/data/maps.ts` ~2036–2206). 22 NEW
maps + 8 UPGRADES. Multi-room = **linked maps** (separate ids, doors between). Register each in `MAPS`
(~4390) + `MAP_AREA`; single-room interiors → append to `ROOMY_INTERIORS` (grown to 16×11). Place the
authored furniture props (§3b) + apply the tile skins. ⚠ **HAZARDS:** the ADR-118 Borden holding-cell
in `otter_station` is byte-locked (don't touch geometry/cot/flags); `bldg_ob_workshop` has NO overworld
door prop yet (add BOTH sides or `doorAudit` fails); **arcade + police station have NO save `payphone`**
(add one each).

**Tile-skin per-interior MAPPING** (small): to make an interior use a skin, remap its `'w'`/`'W'` grid
chars → `tile_<skin>_floor`/`tile_<skin>_wall` via a per-map `TILE_SKIN` in `OverworldScene.buildTiles`
(mirror the existing `UNDEROAK_TILE_SKIN`). pharmacy/clinic → `tile_pharmacy`; city-hall/council/bank/
vault → `tile_civic`; bakery/burger kitchens → `tile_kitchen`; workshop → `tile_concrete`.

**C — Bank + pharmacy mechanics.** Bank teller NPC → a savings/loan interface tied to
`src/data/fortune.ts` (the net-worth / Fortune-Arc axis; keep combat < money). Pharmacist NPC → a
status-cure/antidote **shop** (reuse the existing shop system + item table).

**D — The `growOtterbrook` REBUILD (the map assembly / big visual payoff).** Per
`OTTERBROOK_ONETT_REBUILD.md` §2 + §7 (slice S-2), adjusted to the locked image. Scrap the current
Otterbrook layout; author the Onett-faithful town placing all 19 facades + the props, the cliff bowl +
wooded climb + crater + hill-cave + Pond Park + 27 Maple west + east gate, in DAYTIME palette (runtime
lighting = night/haze). Wire **each facade's `door:{ox,oy,w,h,to,tx,ty}`** → its interior id. Redesign
the flag-driven opening (`opening.ts`, `NameEntryScene.ts:218`). Replace the `world_block` Otterbrook
pins + add a `maps_otterbrook` guard (mirror `maps_foggybottom.test.ts`) + `ELEVATED_ALLOWLIST`. NOTE:
the cliff is a **vertical-band** system (`buildElevationOverlay`, `OverworldScene.ts:1148`); the rounded
**47-blob corner** upgrade is a deferred ENGINE task — the existing 4-band `cliff_top/mid_a/mid_b/base`
works for the gray-box.

**E — Live verify.** Walk the town + a sample of interiors on foot (not warp).

> **Sequencing choice for the user:** interiors-first (self-contained), OR the `growOtterbrook`
> assembly first (recommended — makes the door→interior targets exist and gives a walkable town with
> buildings placed, interiors filled in after). Ask if unsure.

---

## 5. THE WORKFLOW / RECIPES (proven this session)

### Authoring more art via ChatGPT (only if a new asset is needed)
- Drive the user's Chrome (claude-in-chrome MCP; load tools via ToolSearch). Work **in the user's
  "Expand Earthbound City" chat** so the locked map is IN-CONTEXT as the style reference —
  `file_upload` REJECTS non-session files, so in-context reference is the only way.
- Compose: `#prompt-textarea`.focus() → `execCommand('selectAll')` → `execCommand('insertText', false,
  PROMPT)` → click `button[data-testid="send-button"]` (first click often no-ops; retry ~1.5s later, or
  press Enter). Done = `button[data-testid="stop-button"]` absent.
- Harvest (tab is background-throttled; screenshots time out mid-paint, `<img>` may read
  naturalWidth 0): in-page `fetch(img.src,{credentials:'include'})` → `blob` →
  `URL.createObjectURL` → `<a download>` → lands in `~/Downloads`; copy to scratchpad +
  `assets/art/masters/world/`. `Read` the PNG to view. Keep in-page `await` sleeps ≤ ~40s (CDP ceiling).
- **GOTCHA: the ChatGPT image filter REFUSES `rocket`/`rocketry`/`spaceship`** (hit 3× this session).
  Reword to a whimsical contraption / toy / decorative ornament.

### Slicing + wiring
- **Facades:** `node tools/slice-facade-row.js <src.png> key1,key2,... --bg=FF00FF --tol=60` →
  `assets/art/world/facades/<key>.png`. Add NEW keys to `BASE_FACADE_KEYS`.
- **Props:** `node tools/slice-prop-strip.cjs <src.png> <outPrefix> --expect=N --target=256` →
  `<outPrefix>_0..N.png`; `mv` each to its key in `assets/art/world/props/`. Add keys to
  `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`. **CRITICAL: display `{w,h}` MUST be
  ASPECT-MATCHED to the sliced art** — the scene `setDisplaySize`s BOTH dims (e.g. `counter` 600×360 →
  `{30,18}`), so a mismatched aspect DISTORTS. Compute `w = round(h × artW/artH)` from the ACTUAL
  sliced dims, NOT the manifest's guessed sizes.
- **Tiles/skins:** append `TILESET` entries at the tail (`tiles.ts`, reuse an existing `make` painter —
  spritegen FROZEN) → run the matching `apply-*` tool (`tools/apply-tileskin-kit.ts`; or clone
  `apply-cliff-kit.ts`/`apply-eb-tile-kit.ts`) → surgical BAK-first write into `otterbrook_tiles_16.png`,
  grow to `TILESET.length*64`, dump a proof PNG. **LAW: every TILESET tail append is IMMEDIATELY paired
  with its apply run, or `authored_assets.test.ts` (`strip.w === TILESET.length*64`) fails.** Never
  re-pack.

### Building an interior MapDef (mirror `buildRexHome`, `maps.ts` ~2036)
```
const g = new Grid(W, H, 'w');      // 'w' wood floor
g.rect(0, 0, W, 2, 'W');            // top wall band ('W')
g.rect(cx, cy, 2, 2, 'r');          // welcome rug ('r')
return { id, name, music, interior: true, grid: g.out(),
  props: [{ sprite, x, y, solid?: {ox,oy,w,h} }, …],       // the authored furniture
  npcs, signs, phones: [{x,y}],                            // + a `payphone` prop = save point
  doors: [{ x, y, w, h, to, tx, ty, facing, indicator }],  // exit bottom-center facing:'down' indicator:'mat'
  spawners: [], triggers: [] };
```
Multi-room = separate `MapDef`s linked by door zones. **S11b:** top-edge/side interior doors use
`indicator:'door'`, bottom exits `'mat'`, stairs `'stairs'`. **ADR-138:** `ROOMY_INTERIORS` rooms get
their inbound landings re-aimed snug (40px) by the assembly pass (`maps.ts` ~4444). Aim facade-door
`tx/ty` at the tile interior (+8/+12).

### The gate (after every change)
`npx tsc --noEmit` → `npm run validate` → `npx tsx tools/door-audit.ts` (maps) → `npm test` (full
vitest 1349, incl. the tile-strip size-pin) → `npm run build`. **Live-verify maps by WALKING:** dev =
`npm run dev` (Vite `--host`); `preview_start meteor-falls` (`.claude/launch.json` exists); drive via
`window.game` (Phaser; scenes boot/title/nameentry/overworld/…). A dev server was left on **:3000**.

---

## 6. SAMPLE IMAGES / REFERENCE ASSETS (all in-repo + stable — `Read` any PNG to view)

- **THE LOCKED CONCEPT →** `assets/art/masters/world/otterbrook-CONCEPT-locked.png` ← the visual target.
- **Facade sheets →** `otterbrook-{shops,civic,houses,tract,apts}-source.png`
- **Prop sheets →** `otterbrook-{shopfix,domestic,bankcivic,policemed,workshop}-source.png`
- **Tile-skin sheet →** `otterbrook-tileskins-source.png` (+ proof `output/tileskins_proof.png`)
- **Cliff look-study / source →** `onett-cliff-continuous.png`
- **Runtime, sliced, wired art →** `assets/art/world/facades/*.png`, `assets/art/world/props/*.png`,
  the tile strip `assets/art/world/otterbrook_tiles_16.png` (179 columns).
- (all in `assets/art/masters/world/…` unless noted.) The "Expand Earthbound City" ChatGPT chat also
  holds every generated sheet in context.

---

## 7. IMMOVABLE LAWS + SESSION GOTCHAS

- **Art is AUTHORED via ChatGPT** (user approves each render); `src/spritegen/` FROZEN (boot fallback
  only — reuse painters, never add generators). Tiles APPEND at the TILESET tail (no index shift);
  never re-pack; pair every append with its apply run.
- **Prop display sizes MUST be aspect-matched to the art** (else distortion) — §5.
- **ChatGPT refuses "rocket"** → reword (§5).
- **Balance canon:** Titanic Tick HP 200; combat < money (Fortune Arc). The bank mechanic must respect it.
- **Interior laws:** `interior:true`; save `payphone` per shop; S11b door indicators; ADR-138 snug entry;
  `doorAudit` reciprocity. **ADR-118 Borden cell byte-locked.** `bldg_ob_workshop` needs a door.
- **Determinism** (seededRng only). **Git:** UNSTAGED; user drives; `git status`+mtimes before shared
  edits (siblings edit concurrently).

---

## 8. IMMEDIATE NEXT ACTION

1. `git fetch` / status / mtimes; skim `OTTERBROOK_INTERIOR_MANIFEST.md` §2/§5 + this file.
2. Confirm sequencing with the user: **`growOtterbrook` assembly first (S-2 gray-box, recommended)** so
   door targets exist, OR interiors first.
3. Execute in small gated slices (build a map/room → wire its door → `tsc`/`validate`/`door-audit`/
   `npm test` → walk-verify), rolling through the interior manifest + the S-2…S-6 plan. Author bespoke
   art via the §5 ChatGPT recipe only where the manifest flags a gap.

_Status at handoff (2026-07-04): ALL authored art DONE + gated (19 facades · 34 props · 4 tile skins ·
tsc 0 · 1349/1349 tests). Remaining = interiors + mechanics + the growOtterbrook assembly + verify.
Everything UNSTAGED; user drives git._
