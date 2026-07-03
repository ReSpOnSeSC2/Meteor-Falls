# HANDOFF PROMPT — complete the Otterbrook → Onett map rebuild

> Paste this entire file into a fresh Claude Code session in `C:\Meteor Falls`. It is a
> self-contained continuation prompt. It tells you the mission, what is DONE, what REMAINS,
> the exact workflow, the laws/gates, and the agent-usage policy (**use a Fable 5 agent for
> the highly complex/creative work**). Read the two canonical docs it points at before acting.

## 0. MISSION

You are continuing a **game-wide EarthBound-stylization overhaul** of *Meteor Falls* (an
EarthBound-style JRPG). Every overworld/city/route tileset + map is being scrapped and rebuilt
in authentic EarthBound (Mother 2) style — rounded/jagged **organic** tiles, believable, polished —
each map based on its EarthBound map equivalent, **map by map**. Your job right now is to finish
**MAP #1: Otterbrook = ONETT** (Chapter 1), the pilot that establishes the reusable tile geometry.

The user's bar (do not soften it): the current Otterbrook "looks horrible / not like a real town."
It must be **completely scrapped** and rebuilt to look and feel like EarthBound's **Onett** — a town
in a bowl of rounded brown cliffs and round trees, winding roads (never a grid), a real Main Street of
distinct buildings (drugstore, hospital, bakery, arcade, police station, city hall), cars in traffic,
yards with fences/mailboxes, the hero's + Chad's houses up on a hilltop terrace, a fenced "DON'T ENTER"
house 3/4 up, a north road winding up to the meteor crater and the Giant-Step boss cave, a park with a
foam-rimmed pond — all in the warm EarthBound "crayon" palette with organic nibbled edges.

## 1. READ THESE FIRST (canonical, authoritative — this prompt is a summary of them)

1. `docs/EARTHBOUND_STYLIZATION_OVERHAUL.md` — the game-wide program: the full 7-family tile
   vocabulary, the **47-blob seamless-tiling method**, the MF→EB mapping + build order, the
   per-region pipeline, the immovable laws.
2. `docs/OTTERBROOK_ONETT_REBUILD.md` — the Otterbrook blueprint v2 (review-hardened): the locked
   decisions, the topology, the terrace plan, the boss relocation, Pemberton, 27 Maple, and the
   **gated slice plan S-0…S-6**. §0.0 = the "scrap and rebuild Onett-faithful" law.
3. `docs/WORLD_OVERHAUL_HANDOFF.md` (elevation engine P0–P5), `docs/WILDERNESS_DESIGN_LANGUAGE.md`,
   `docs/CITY_DESIGN_LANGUAGE.md`, `docs/DIVERSITY_LEDGER.md` (the NO-FORMULA gate), `CLAUDE.md`
   (art-is-authored law + balance law).
4. Memory (loaded each session): `earthbound-stylization-overhaul`, `otterbrook-onett-rebuild`,
   `world-overhaul-program`, `image-generation-workflow`, `parallel-edit-coordination`,
   `agent-cost-discipline`, `git-workflow`, `character-art-reference-paste`.

`git fetch` + `git status` + mtimes on the hot files FIRST — sibling sessions edit concurrently
(a sibling landed foggybottom mid-session last time). Leave everything UNSTAGED; the user drives git.

## 2. WHAT IS DONE (do not redo)

- **All planning/analysis** (the two canonical docs above + memory), grounded in two multi-agent
  workflows (recon + a 4-critic blueprint review + a 5-analyst game-wide analysis; the analyst
  reports are in the session scratchpad `analysis-*.md`).
- **Engine S-1 — per-mover terrace collision** (in `src/scenes/OverworldScene.ts`): added a `level`
  field to `Roamer`/`PatrolObj`/`NpcObj`, seeded from `levelAtPx` at spawn, flipped on `T` via the
  new `levelAfterStep` helper, threaded through `collidesStatic(box, level)` / `collides(box, actor?,
  level)` / `patrolMove(…, level)` at every mover call site. Guarded `maxLevel>0` ⇒ all flat maps
  byte-identical. **Gated green** (tsc 0 · door-audit · validate · full vitest 1349 · build 0). This
  unblocks a LIVING elevated town (town wanderers/traffic no longer freeze when the player climbs).
  UNSTAGED.
- **Cliff ART authored via ChatGPT** (in the "Pixel-Art Cliff Texture" chat at chatgpt.com; the user
  is logged in as a Pro user on their local "Browser 1"). Three sheets, ALL user-approved as the LOOK:
  1. a rounded cliff **nine-slice** (axis edges + rounded corners) — *look study*,
  2. an **organic-curve** sheet (diagonals, peninsulas, coves, S-bends) — *look study*,
  3. **the seamless continuous cliff PLATEAU block** — the PRODUCTION source (one continuous
     organic grass-plateau-in-rock image; slice the mated cliff tiles OUT of it).
  Saved in the session scratchpad: `cliff-curves-source.png`, `onett-cliff-continuous.png`.
  **These are NOT yet sliced or installed.** The look is locked; the production method is the 47-blob
  continuous-block (§4 below).
- **foggybottom P5** shipped (a sibling) = the game's first 4-terrace ELEVATED map — your reference/
  template for the elevation authoring (`src/data/maps_ch3.ts` `buildFoggybottom`, guard test
  `src/data/maps_foggybottom.test.ts`). It uses static NPCs; Otterbrook (with S-1) can carry live ones.

## 3. WHAT REMAINS (the Otterbrook build)

Follow the sliced plan in `OTTERBROOK_ONETT_REBUILD.md` §7, updated to lead with the tile kit:

- **T — THE ONETT TILE KIT (art first; establishes the universal geometry).** Author + install the
  full Onett tileset the 47-blob way (§4): (a) slice+install the **cliff-face + cliff-lip** from the
  authored continuous plateau block; (b) author + install **grass fields** (2–3 tints) + **tall-grass**
  (walk-through weeds); (c) the **grass↔dirt path transition** (EB's nibbled winding edge); (d) **round
  Onett oak trees**; (e) **stairs** (3-band). User approves EACH render. Extend `buildElevationOverlay`
  to an 8-neighbour blob index if the cliff autotile needs it.
- **S-2 — the elevated overworld, GRAY-BOX.** Rewrite `growOtterbrook` FROM SCRATCH (scrap the current
  layout + `buildOtterbrook` core) to the Onett grammar: town in a bowl (L0) + winding roads + distinct
  Main-Street buildings + a hilltop residential terrace (Jay + Chad, L1) + the winding climb (L2) +
  Pemberton's DON'T ENTER house (L2/3) + the crater crest (L3), Hickory-mountain cliff wall on the west,
  the elevation plane. Redesign the **opening state machine** flag-driven (`src/engine/opening.ts` +
  `NameEntryScene.ts:218` boot + the pan geometry). Migrate the **Biscuit quest** clues + decide the
  **mower/shed** fate. Dissolve the 4 old climb maps. Replace the `world_block` Otterbrook pins with a
  new `maps_otterbrook.test.ts` guard (mirror `maps_foggybottom.test.ts`) + `ELEVATED_ALLOWLIST`.
  Live-verify the climb on foot.
- **S-3 — boss hill + Giant Step + Tick relocation.** New `boss_hill` (bald knob) → `giant_step_cave`
  (downward carved-stone descent, FRESH dressing — not the oak reskin) → `giant_step_sanctuary`
  (light-shaft bowl). Move the `heart_oak` trigger to the sanctuary; retire `oak_roots/hollow/heart`
  + all references (`chapters.ts:50`, content-validate `TABLES`, `UNDEROAK_SKIN_MAPS`, the Pond Park
  burrow door/prop, `world_block.test.ts:93`); keep the Heart Oak as a healed landmark; Tick HP 200
  unchanged. Rewrite the location-locked dialogue (`dawn_hush_dark`, `heart_oak_approach`, `tick_after`,
  `meadow_gate_hushdark`, `bus_closed_detour`).
- **S-4 — 27 Maple west section.** New `27_maple_west` + `27_maple_int` (facade w/ a HAND-door +
  visitable interior + save phone; buy flow ALREADY exists in `agencyBeat`; don't rename the id) + a
  west-edge door on grown Otterbrook (append at `x:0, y≥32`) + the return-door test.
- **S-5 — Pemberton beat.** The DON'T ENTER house (solid fence prop `unlessFlag:tick_defeated`),
  stationary Pemberton NPC (`dialogue`+`dialogueDay`), the daytime-gated treasure, the `met_pemberton`
  Ch.10 hook + the canon-bridge dialogue (verify the Ch.10 reunion doesn't say "never met").
- **S-6+ — bespoke facade art** (drugstore, hospital, bakery, arcade, police station, characterful
  houses) via ChatGPT, swap gray-box → authored, log the diversity ledger row, final gates.
- **(Optional) a full-town concept MOCKUP** (Onett-style illustration of the whole Otterbrook) — the
  user was offered this to lock the look/layout before the build; offer it again if useful.

## 4. THE TILE ART PIPELINE (the seamless-tiling method — READ CAREFULLY)

**The problem:** ChatGPT makes gorgeous individual tiles that DON'T mate at their edges → seams.
**The solution (proven-in-EarthBound):** for each terrain BOUNDARY family (cliff-face, cliff-lip,
shore, ground↔ground transitions) author **ONE continuous reference-block** — a single seamless image
where the material boundary winds through every edge/corner case IN CONTEXT (mated) — then **slice the
tiles out of that one image**, so neighbours came from adjacent pixels and connect seamlessly. This is
the **47-blob (8-neighbour Wang) autotile**. It reuses the EXISTING installer machinery 1:1.

**Steps per tile family:**
1. **Author via ChatGPT** (drive the user's Chrome via the claude-in-chrome MCP; load tools via
   ToolSearch). CONTINUE the "Pixel-Art Cliff Texture" chat (on-model) or a per-family chat;
   reference-paste the approved cliff + the user's EB reference for one coherent world. The composer
   recipe: set `#prompt-textarea` via `document.execCommand('insertText', …)`, then click
   `button[data-testid="send-button"]`. **User approves each render.**
2. **Detect completion + harvest** (the automation tab is background-throttled → screenshots time out
   during paint, and the generated `<img>` may show `naturalWidth:0`/`loaded:false`). Detect via DOM
   (`streaming` = `button[data-testid="stop-button"]` present). Harvest by fetching the `img.src`
   (a `chatgpt.com/backend-api…` URL) IN-PAGE → `blob` → `URL.createObjectURL` → `<a download>` →
   it lands in `~/Downloads`; move it to the masters folder. Do NOT return the URL from the JS tool
   (it blocks). `Read` the PNG to view it.
3. **Install at the TILESET tail** (clone `tools/apply-cliff-kit.ts` / `apply-hedge-kit.ts`): `spans()`
   the magenta-bordered block, cut the cases, area-average downscale to 64px, **BAK-first surgical
   write** at `idxOf(name)*64` (never re-pack; every other column byte-identical). Add the tile entries
   at the `TILESET` tail (`src/spritegen/tiles.ts`) with immutable solidity + a fallback painter. Dump
   a **proof PNG** (a mini-map assembled from the tiles — the autotile-mating proof; review it).
   **LAW:** every tail append is IMMEDIATELY followed by its `apply-*`/`sync-*` run or the size-pin
   (`authored_assets.test.ts:155`, `strip.w === TILESET.length*64`) fails.
4. **Wire:** `CHAR_LEGEND` entry (or emit-by-mask), extend `buildTiles`/`buildElevationOverlay` with
   the blob-index branch. **Universal geometry, per-region recolor** (later regions recolor these
   shapes via a skin strip; see the `sync-*-tiles.ts` / `*_TILE_SKIN` pattern).

## 5. THE PER-CHANGE GATE (every slice ends green)

`npx tsc --noEmit` → `npx tsx tools/door-audit.ts` → `npm run validate` → targeted vitest →
`npx tsx tools/render-map.ts <set>` → `npm run balance` (only if combat changed). Close with full
`npx vitest run` + `npm run build`. `npm run validate` GREEN is the explicit exit proof for the
map-retire slices. Live-verify maps by WALKING them (the dev-preview loader-pump recipe is in
`WORLD_OVERHAUL_HANDOFF.md` P2 / the `verifying-the-running-game` memory).

## 6. IMMOVABLE LAWS

- **Art is AUTHORED via ChatGPT** (user approves each render); `src/spritegen/` FROZEN (fallback only);
  tiles APPEND at the TILESET tail (no index shift → other maps byte-identical); never re-pack.
- **Scrap-and-rebuild Otterbrook** (no preserving the old layout/core); replace its `world_block` pins.
- **47-blob continuous-block** is the seamless mechanism; hand-painted chunks ONLY for non-collidable
  signature scenery (as terrain they break the tile-based walk-behind overlay).
- **Elevation opt-in** (K face / ^ lip / T stair; `elevationLawViolations` gate); per-mover terraces
  now DONE (S-1). **Determinism** (seededRng only). **Balance canon** (Tick HP 200; boss HP < money).
- **NO FORMULA** (S5 Prime Law) — run the diversity critic; log the signature in the ledger.
- **Git:** UNSTAGED, user drives commits; `git status` + mtimes before editing shared hot files
  (`maps.ts`, `OverworldScene.ts`, `tiles.ts`, `authored.ts`, `schemas/index.ts`, `elevation.test.ts`,
  `dialogue.ts`) — siblings edit concurrently.

## 7. AGENT-USAGE POLICY (ultracode is ON — use the Workflow tool for substantive work)

- **Use a Fable 5 agent for the highly complex / creative-judgment work:** the per-map CONCEPT +
  signature, the Onett-grammar BLUEPRINT for `growOtterbrook`, the diversity/quality adversarial
  critique, the full-town concept-mockup art direction, and any ambiguous design synthesis. Spawn it
  via the Agent tool / a Workflow stage with the appropriate model. **REALITY CHECK: Fable 5 has run
  OUT OF USAGE CREDITS before** — if it errors "out of usage credits," fall back to Opus main-loop
  (highest judgment available) or Sonnet, log the fallback, and keep moving. Do NOT stall.
- **Sonnet / main-loop for mechanical work:** cloning the `apply-*`/`sync-*` tile installers, test
  scaffolding, the ChatGPT drive/harvest, one map-implementer per map, localized edits.
- **Author the highest-stakes builder (the Otterbrook `growOtterbrook` rebuild) carefully** — main-loop
  or a single focused agent using `buildFoggybottom` as the elevation reference (as the foggybottom
  pilot was authored). Verify by walking, not warping.

## 8. IMMEDIATE NEXT ACTION

Confirm state (`git fetch`/status/mtimes), then either (a) generate the full-town concept MOCKUP for
the user to lock the look, or (b) proceed with Slice T: slice+install the authored continuous cliff
block, then author the grass/tall-grass, path-transition, and tree sheets (user approves each), then
begin the `growOtterbrook` Onett-grammar rebuild (S-2). Ask the user which they want if unsure.
