# AI HANDOFF PROMPT — Settlement Redesign + Vibrancy Program (Meteor Falls)

Copy everything below this line into a fresh Claude Code session in `C:\Meteor Falls` to continue the program.

---

You are continuing the **settlement redesign + vibrancy program** for Meteor Falls (an EarthBound-style TypeScript JRPG, Vite, repo root `C:\Meteor Falls`). Read this whole prompt before acting.

## THE MISSION (two halves, one program)

1. **FULL REBUILD (upgraded 2026-07-02 — the user rejected the first Otterbrook pass as too timid).** Every outdoor settlement map is scrapped and redesigned from a blank grid around a place identity — street hierarchy, districts, alleys, plazas, yards, furniture rhythm, wear — while preserving content by id/flags and the blueprint's fixed-point table. Additive dress-up passes are NOT acceptable; if before/after renders look like siblings, redo it. In-between ROUTE maps (the walking legs) get the same treatment as their chapter comes up. The design language is codified in **`docs/CITY_DESIGN_LANGUAGE.md`** (§0 the bar, hard rails, moves M1–M8, implementer procedure, review rubric). It is BINDING; every implementer reads it first; do not re-derive it. Each finished map ships with a bootable preview for a user walkthrough checkpoint.
2. **Vibrancy.** The user's standing directive (2026-07-02): cities must read **FULL and ALIVE**. Concretely, per map: (a) no dead quarters — every district has at least one furnished anchor (plaza, market, yard cluster, dock, forecourt); (b) facade VARIETY — never the same silhouette 4+ times consecutively along a face-band; big towns mix small/medium/tall faces per block; (c) prop budgets are USED — land 75–90% of the map's prop envelope, clustered at anchors (never confetti-scattered); (d) region-true dressing — market stalls, crates, lanterns, laundry, banners, drains, wear, whatever THIS place would have; (e) where the area's authored palette cannot support (b)/(d), GROW the palette — § GROWING THE PALETTE below.

**Scope guard:** dialogue text, quest logic, new NPCs, and the balance curve are OUT of scope (furniture props are key-free; existing content is preserved by id/dialogue/flags and moves only within its semantic cluster). Existing art is untouched; NEW art is authored ONLY via the ChatGPT image workflow per `/CLAUDE.md` and `docs/ART_PIPELINE.md` — image generation is ALWAYS chatgpt.com, NEVER procedural; `src/spritegen/` stays FROZEN (boot fallback only).

## TOKEN DISCIPLINE (non-negotiable — usage is running out fast; treat every agent-token as scarce)

- Model ladder, strictly: **haiku** for ALL reading/extraction/inventory; **sonnet** for ALL code implementation and mechanical wiring; the expensive main model does ONLY blueprints (the creative judgment step), schematic-PNG review, and orchestration. **Never spawn an expensive-model subagent.** When in doubt, use the cheaper model.
- ONE implementer agent per map, ever. Never two agents in one file. Maps in *different* files may run in parallel (e.g. `maps_ch3.ts` + `maps.ts`).
- Follow-ups go to the SAME warmed agent via SendMessage — never spawn a fresh agent to ask a question the last one can answer.
- Cap extraction output ≤250 lines; instruct agents to "read excerpts, not whole files." Never let any agent read `maps.ts` (~3400 lines) end-to-end; that's what manifests are for. In the main loop, read only short load-bearing ranges (legends, constants, tests, rosters).
- Implementers run TARGETED gates per map (tsc → door-audit → validate → that map's vitest files → render). The FULL suite (`npx vitest run` + `npm run build`) runs ONCE per session, at batch close — never per map.
- Validators + `tools/render-map.ts` schematic PNGs prove layout correctness during iteration; the live boot happens ONCE per finished map, as the user's walkthrough preview checkpoint (dev server up, confirm the map loads clean) — not per-edit.
- Palette art (ChatGPT image generation) is MAIN-LOOP work over Chrome MCP — agents cannot drive the browser. Batch every strip the session needs into ONE chatgpt.com run (a row strip carries 4–6 facades; ~5 concurrent generations is the stall ceiling). Slicing/wiring the harvested strips is mechanical → sonnet.
- Batch size: 2–3 maps per session for layout-only batches; **1–2 maps when the batch is art-heavy** (chandrapore-class palette work). If budget runs low, STOP at a green-gates state (never mid-edit), update the memory status file, and report what remains.

## WHAT IS ALREADY DONE (as of 2026-07-02 — all gates green: 1290/1290 vitest, door-audit, validate, build)

- **`docs/CITY_DESIGN_LANGUAGE.md`** — the binding spec (now includes the Palette hard rail: implementers place only already-authored keys, from the area's own roster).
- **Otterbrook** — FULLY REBUILT (2026-07-02, second pass) to the §0 bar: the brook + 4 footbridges, town square w/ otter-statue fountain, storefront row, hand-built Creekside + Maple Ct (forge districts dropped), gazebo civic green, orchard + outflow meadow, playground/dog-run park, per-yard Americana dressing. 12 new authored prop keys (otterbrook-props-a/b strips). The 5382edb1 first pass is superseded — do not treat it as the pattern.
- **Brickton** (`buildBrickton`/`growBrickton`, `maps.ts`) — stripes broken: parked `P` lanes + storm drains, 2 derived-position alleys with dumpsters, park + clock plaza as furnished rooms, south market lot with stalls, Maple Heights restaggered with yard fences, spire forecourt. 251/320 props.
- **Puerto Sol** (`buildPuertoSol`/`growPuertoSol`, `src/data/maps_ch2.ts`) — zócalo centered + benches, museum terminates the avenue axis, 2 callejón alcoves, casa courtyard, tightened market lane, malecón palm rhythm + pier-root crates, junction crosswalks/drains. 88/120 props (**hard cap 120**).
- **The citygen hi-res promotion** — the 26 generated-catalog facades current maps place (+ THE SPIRE) are authored hi-res; the `hi-res-facades` content-validate law now FAILS the build if a map places a still-procedural generated facade. This is the palette program's enforcement backbone.
- `tools/render-map.ts` has SETS for ch1 + ch2 (`npx tsx tools/render-map.ts ch1|ch2` → `output/maps_*.png`). Later chapters need their own SETS entry added (trivial, copy the pattern at the file bottom).
- A memory file `settlement-redesign-program.md` (Claude memory dir) holds status + gotchas — update it as maps land, if you have memory access.
- **Git reality:** the user makes frequent full-tree commits mid-session that sweep unstaged agent work in (has happened; it's fine). `git status` + `git log --oneline -5` FIRST, verify zero diff loss rather than panic, and leave all work UNSTAGED — the user drives git.

## THE EB GROUND KIT (2026-07-02 — the baseline tile overhaul; Ch.1 is the proof slice)

The user's second directive: the whole game's GROUND art moves to an EarthBound-construction
baseline — real asphalt downtowns, checkered sidewalks + curbs, mottled lawns, dirt paths with
soft grass fringes, and CLIFF TERRACING (towns built on levels, Onett-style). Status:
- **BAKED + GREEN:** `tools/apply-eb-tile-kit.ts` installed the kit into
  `assets/art/world/otterbrook_tiles_16.png` (now 134 columns; pre-kit backup
  `*.pre-eb-kit.bak.png` beside it; sources `eb-ground-kit-{a,b}-source.png` in masters).
  Repainted: grass_a/b/tuft, road/road_dash/crosswalk/parking, sidewalk + all 3 curbs +
  crack + storm_drain + road_patch, plaza, scorch/scorch_ember, fairway, and ALL 32
  path_<v>_<m> mask columns (baked from dirt base + grass fringe per buildTiles mask bits).
  Sea tiles deliberately NOT touched. Spare authored cells (cracked cliff, rubble, gravel,
  mud, pebble bed, paver variant) live in the b-source master, unused.
- **NEW TILES + CHARS:** TILESET tail now has cliff_face (solid) / cliff_lip / stairs;
  CHAR_LEGEND: `K` cliff face (paint 1–2 rows below the upper level), `^` lip trim on the
  upper edge row, `T` stairs. Scanned free across every shipped grid before adoption.
- **Region skins are unaffected** (they override by name per-map); chapters without a skin
  inherit the new baseline visually — their re-review happens when their redesign lands.
- **vitest note:** vite.config.ts now excludes `.claude/**` — agent worktrees were being
  globbed into main-tree test runs and cross-failing.
- **EAGLELAND CONSTRUCTION (2026-07-02, the current bar — supersedes everything above
  about layout):** Otterbrook shipped as a 126×96 REGIONAL map: zone clearings (bluff,
  meadow+green, downtown, the Hollow, civic, Maple Ct, pond park, orchard, thicket)
  separated by SOLID FOREST BELTS ('b' masses + canopy tree ranks) so the next zone is
  HIDDEN until you emerge from each zone's ONE winding connector cut. Roads/trails are
  painted from hand-authored CENTER TABLES (`windV`/`windH` in maps.ts), never straight
  rects; plazas/rings/ponds get rounded corners. NO stairs/rims at wilderness features
  (worn dirt cuts through `K` bands; `T` is town-only). NO subagents on map code — the
  user requires main-loop hand authorship. Every remaining settlement + route map
  follows THIS grammar; study the shipped `buildOtterbrook`/`growOtterbrook`.

## THE PALETTE LEDGER — what art exists vs. what must be authored (the "do we need more facades?" answer)

**Authored and ready to place freely (reuse FIRST, and place MORE of them — repeats with different neighbors read fine):**
- Nine bespoke region sets (~52 keys, all hi-res): `bldg_kvisthavn_*` (5), `bldg_lilleby_*` (4, + `bldg_tower_arms`), `bldg_minimus_*` (9), `bldg_zanzibel_*` (9), `bldg_lotus_harbor_*` (8), `bldg_valea_*` (8), `bldg_aurora_*` (6), `bldg_mauna_lani_*` (6), `bldg_mars_*` (5). Rosters live in `src/spritegen/buildings.ts` (`AREA_SKINS`).
- 26 generated keys (`HI_RES_GEN_FACADES`, `src/spritegen/authored.ts`): warm shop/cafe/brownstone (Otterbrook family), the Brickton cool set (neon/theater/deptstore/bank), civic + market halls, THE SPIRE.
- Golf/Valle bespoke landmarks (clubhouse_grand, gatehouse, mansions, valle_* set) — authored.

**Known gaps (these WILL need ChatGPT authoring when their maps come up):**
- **foggybottom** (roster: brownstone/bank/civic/cafe × EARTH/PAPER/BLUE/CYAN): only paper-bank, earth-brownstone, cyan/paper-civic exist. Its cafes and the remaining ramp variants need authoring.
- **chandrapore** (deptstore/theater/hotel/market/neon/apartments × ORANGE/GOLD/MAGENTA/RED/PURPLE): the **hotel** and **apartments** families have ZERO authored keys game-wide; several orange/gold/red variants of the other families are missing too. This is the biggest art lift — plan it as its own 1-map, art-heavy session.
- **Vibrancy bespoke types:** any settlement whose set is small may earn 0–3 NEW bespoke types (`bldg_<area>_<type>`) when a district would otherwise repeat one silhouette 4+ times — e.g. kvisthavn (only 5 types) could take a fish market / smokehouse / net shed; lilleby (4) another giant face. The blueprint decides; don't author speculatively.
- **Region props for aliveness** (the "and such"): market/dock/street dressing per region — stall variants, hanging laundry, lantern strings, crab pots, prayer flags, snow drifts… authored via the chroma-strip prop pipeline. Cheap (many per strip) and high-impact; every blueprint should list 3–8.

**Exact gap enumeration is done at blueprint time, not now:** compare the area's `AREA_SKINS` roster against `HI_RES_GEN_FACADES`, and run `npx tsx tools/facade-audit.ts` after placement. Never precompute art for maps that don't have blueprints yet.

## GROWING THE PALETTE (the reuse ladder — cheapest first; sequencing below in Step 2.5)

Every area draws ONLY from its own `AREA_SKINS` roster (validator-pinned ⇄ `CANON_AREAS` both directions — extend your area's roster, never borrow another's).

1. **Reuse authored keys** from the area's roster (see ledger above).
2. **Promote generated-catalog keys** the blueprint wants: ChatGPT row-strip (4–6 facades per image; match the shipped EarthBound-painterly facade look — paste an existing authored facade strip as the style reference) → save master to `assets/art/masters/world/citygen-*-source.png` → `tools/slice-facade-row.js` → `tools/fit-facade-aspect.cjs` (aspect-pins each slice to its procedural canvas so the `GEN_FACADE_FOOTPRINT_W` width-anchor keeps the exact old footprint — facades take **NO display-size entries**) → slices to `assets/art/world/facades/<key>.png` → add key to `HI_RES_GEN_FACADES` (authored.ts). The `hi-res-facades` validate law confirms.
3. **Author a NEW bespoke type** (`bldg_<area>_<type>`): mirror a sibling key end-to-end — grep one (e.g. `bldg_zanzibel_indigo_dyer`) and touch the same spots: region `*_FACADES` list + `AREA_SKINS` roster + `BESPOKE_AREA_FACADES` (buildings.ts), `WORLD_FACADE_KEYS` (authored.ts), PNG in `assets/art/world/facades/` + master. `bldg_*` facades get texture-derived solids + `occupyCity` door-grafts automatically — keep frontages clear.
4. **New region props:** chroma-strip → `tools/slice-prop-strip.cjs` → `assets/art/world/props/<key>.png` + an `AUTHORED_WORLD_PROP_DISPLAY_SIZE` height-anchor entry in authored.ts (skip the anchor and the prop double-scales — canon law).

## WHAT REMAINS (order of play)

1. **Valle Dorado** (`buildValleDorado`, `maps_ch2.ts`) — full rebuild like everywhere else, BUT `valle_shop`/`valle_clinic`/`valle_chapel` are FIXED POINTS (exact positions — their `door.ox` values are hand-measured against authored art; re-verify current state via `git log` — the user actively edits this map). Redesign the village around them: lanes, yards/fences, flower beds, well/plaza detail, furniture.
2. **Full re-layout + vibrancy passes, roughly in play order (2–3 per session; art-heavy = 1–2):**
   `foggybottom` (ch3, `maps_ch3.ts` — ART-HEAVY, see ledger) · `kvisthavn` + `lilleby` (ch4) · `minimus_major` (ch5) · `zanzibel` (ch6) · `chandrapore` (ch7 — ART-HEAVY, its own session) · `lotus_harbor` (ch8) · `valea_stelelor` (ch9) · `aurora_station` + `mauna_lani` (ch10) · ch1–2 stragglers `costa_estrella` + `golf_resort` (`maps.ts`) · **RE-DO to the §0 bar: `brickton` + `puerto_sol`** (their 2026-07-02 passes predate the full-rebuild directive — same timid style the user rejected on Otterbrook) · route maps per chapter (ch1: hill_road, hickory_trail, whisperwood_rise, hickory_hill, the four meadow legs — currently bare snake-paths).
3. **Design hooks per map** (expand into blueprints at execution time): foggybottom = damp fog-stone river town (market green, stone lanes, bank/civic quarter); kvisthavn = fjord fishing hamlet (working dock, crate racks, cliff-terraced lanes); **lilleby = GIANT 2.3× scale** — design in big shapes, wide streets, SPARSE furniture (it renders huge); minimus = 1/100 jewel-box miniature (dainty grid, hedge-maze motifs, DAINTY traffic); zanzibel = bazaar port (souk lanes, caravanserai courtyard, stall-crowded shade); chandrapore = the game's biggest city (dense bazaar blocks, arcade rows, sign riot, colossus spire axis); lotus_harbor = river temple town (lantern rows, pagoda forecourt, tea-house lane, docks); valea_stelelor = painted folk village (yards, well, church green, mill lane); aurora_station = utilitarian arctic outpost (boardwalk `:` paths, crate depots, huddled habitats); mauna_lani = launch resort (sand `n` beach band, palm lines, surf-shop row); costa_estrella/golf_resort = links villages (fairway `m`, mansion drives, gatehouse).

## THE PER-MAP WORKFLOW (proven on Otterbrook/Brickton/Puerto Sol — follow it exactly)

**Step 0 — recon (main loop, cheap):** `git status --short` + `git log --oneline -5`; confirm the builder's file/line (`grep -n "export function build<Name>"`); check for a `grow<Name>()`; find the map's tests (`world_block.test.ts` covers ch1–2; `maps_chX.test.ts` may pin later maps — a map with NO envelope test gets its budget SET by the blueprint).

**Step 1 — extraction (haiku Explore agent, one per map):** produce a CONTENT MANIFEST, coordinates quoted VERBATIM: builder line range; map fields (id/settlement/area/W×H); grid-painting code verbatim; buildings table (sprite, x, y, solid, door{to,tx,ty}); other props grouped; NPCs (id/sprite/x/y/dialogue/flags); signs; map-level doors; triggers + spawners (rects, pools, flags); post-processing (occupyCity/buildDistrict/edge features); exported constants and HOW they're computed; **an external-reference grep of src/ for the map id** — every file:line referencing coordinates ON this map (scene warps, cutscene targets, dev warps), quoted; **and the area's `AREA_SKINS` roster verbatim from `src/spritegen/buildings.ts`, plus which of its keys appear in `HI_RES_GEN_FACADES`/`BESPOKE_AREA_FACADES` (authored) vs. not.** If a grow function exists, manifest it via a follow-up message to the SAME agent.

**Step 2 — blueprint (main model, the ONLY expensive step, ~60 lines):** name 3–5 districts; sketch the street skeleton; write a FIXED-POINT table (external warp landings, test-pinned coords, gate constants, door mouths that must not move, canvas dims + prop/tile envelopes); list per-district moves referencing M1–M8; state the VIBRANCY targets (prop count goal at 75–90% of envelope, facade-variety plan per face-band, the district anchors and their dressing); end with the **PALETTE PLAN** — every facade/prop key placed, each marked `authored` / `needs-promotion` / `new-bespoke` / `new-prop`, with the strip layout for the missing ones.

**Step 2.5 — palette (main loop, only when the plan lists missing art):** author ALL missing keys for the whole batch in ONE ChatGPT session (Chrome MCP → chatgpt.com; style-reference an existing authored strip); hand slicing/wiring to a sonnet agent per the reuse ladder; confirm `npm run validate` green BEFORE any implementer launches. If image generation is unavailable this session, re-plan the blueprint around authored-only keys (variety via mixing, rotation of neighbors, prop dressing) and note the deferred keys in the report — NEVER place an unauthored key.

**Step 3 — implementation (ONE sonnet general-purpose agent per map, background):** prompt = read `docs/CITY_DESIGN_LANGUAGE.md` first (binding) + the blueprint + fixed points + scope guard ("edit ONLY build<Name>/grow<Name> in <file>; never touch other builders/files; never stage/commit; git status before+after; count props BEFORE adding — respect the envelope; no new dialogue keys — key-free furniture props only; place ONLY facade/prop keys named in the palette plan — if the `hi-res-facades` validate law fires, STOP and report the gap; all content preserved by id/dialogue/flags, positions move only within semantic clusters") + gates in order: `npx tsc --noEmit` → `npx tsx tools/door-audit.ts` → `npm run validate` → targeted vitest → `npx tsx tools/render-map.ts <set>` (add the SETS entry if the chapter lacks one) + report format (per-district changes, before/after prop counts, gate results verbatim on failure, render path, deviations+reasons).

**Step 4 — review (main model):** view `output/maps_<set>.png` against the design-doc rubric PLUS the vibrancy bar: districts distinguishable; no unbroken straight runs; plaza reads as a furnished room; alleys + a dead-end pocket; furniture clustered at anchors; a landmark terminates an axis; gateways framed; **no dead quarter; no 4-in-a-row same facade; prop budget 75–90% used.** Iterate via follow-up messages to the SAME implementer until it passes.

**Step 5 — close the batch:** full `npx vitest run` + `npm run build` ONCE; leave everything UNSTAGED; update the memory status file; report per-city changes + palette keys authored + gate results + render paths.

## HARD RAILS RECAP (trap list — full detail in the design doc; these have all bitten before)

- **Frozen-core law:** where `growX()` exists, the shipped map embeds `buildX()` byte-identical top-left and APPENDS (core arrays = prefix). Edit core+grow together; growth paints only `x≥CW || y≥CH`. Tests are relational — a coherent rewrite stays green.
- **Envelopes are test-pinned** (tiles ratio + max tiles + max props; Puerto Sol ≤120 is HARD). Count props first. Raising a cap for vibrancy is allowed ONLY with the test updated in the same change + an explicit note in the report — never silently.
- **Determinism:** seeded streams only (`seededRng`), no `Math.random`/`Date`; reflowing a stream within one builder is fine; never share streams across builders.
- **ADR-012 city minima** for `settlement:'city'`: ≥2 separated street bands (R/D/X rows), a ≥12-cell vertical avenue, ≥2 face bands.
- **Doors:** landings computed (`doorstepOf`/`trailRowAt`); farFromReturn gate is 40px (ADR-138); player body ~40×36px → mandatory routes ≥3 tiles wide (4 preferred); `tools/door-audit.ts` is the fast offline check.
- **occupyCity** runs post-build and grafts doors onto doorless `bldg_*` facades — keep frontages clear.
- `':'` = edge-masked path/trail char (not in CHAR_LEGEND; renderer special-cases it) — small-town/park material; R/D/X = asphalt + traffic. City ground fill is often `=` — texture comes from P/p/d/wear + props.
- Wear glyphs `'1'`/`'2'` draw their own sidewalk/road base — never paint them on plaza `p`, dock `d`, or grass.
- **Picnic law:** ≥3 rest tables per chapter before dungeons — never remove one.
- **Region tile skins** remap ground per chapter (MINIMUS/ZANZIBEL/CHINA/ROMANIA/AURORA/LANI…) — paint semantics, not colors.
- **Scale traps:** Lilleby renders 2.3× giant, Minimus at tabletop scale — check `mapNativeScale`/traffic notes before furnishing (a "dense" Lilleby plan renders as clutter; a "sparse" Minimus reads empty).
- **Facade law:** placing ANY generated facade not in `HI_RES_GEN_FACADES` fails `npm run validate` (`hi-res-facades`). That failure means the palette step was skipped — fix the art, never work around the law.

Start with **Step 0 recon on Valle Dorado** (additive pass — no palette work expected), then proceed down WHAT REMAINS in order. Ask the user only when a genuine scope decision comes up (raising a prop envelope, adding a bespoke landmark, or batching an art-heavy map).
