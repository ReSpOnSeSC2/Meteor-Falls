# WORLD OVERHAUL — Ch3+ program handoff (the master doc)

> **Chapter 8 production rollout (2026-07-13):** China now has four production
> maps, a five-quest regional contract, real Mushroomized and Teleport Beta,
> contextual branch-safe panels, stable Lotus tenancy, thirteen developer
> profiles, explicit city-scale facade art, and v25 recovery. Its fixed-point
> contract is ADR-143; final command/live evidence is tracked in
> `docs/CH8_PRODUCTION_VERIFICATION.md`.

Copy this whole file into a fresh Claude Code session in `C:\Meteor Falls` to continue the
program. It is the canonical, living source of truth; the plan-mode file
`~/.claude/plans/lively-percolating-sparkle.md` is the original approval artifact and is
now SUPERSEDED by this doc (elevation moved in-scope after approval).

## THE MISSION (user directive, 2026-07-03)

Overhaul **the entire world from Chapter 3 onward** to feel fully polished and deeply
thought-out — EarthBound-grade:

- **Overworlds** rebuilt to the ~126×96 **regional bar** (the shipped Otterbrook grammar):
  winding tree/bush corridors, solid forest belts that HIDE the next zone until you emerge
  from a winding connector, **branching routes / dead-ends / scenic pockets / secrets**, and
  staged biome transitions. (User weights **winding corridors + branching routes** highest,
  but wants *more of all* the signatures.)
- **True elevation** — real **walk-behind cliff parallax** (Onett/Zelda), an opt-in engine
  feature (the user explicitly accepted a large engine change). NOT the in-plane fake.
- **Interiors**: **every building multi-room with real things to do** — buy/sell shops,
  chests/pickups, quests, and playable venues. Maximal density.
- **Dungeons**: maximally fleshed — more rooms, keys/locks, puzzles, hazards, interactive
  objects, PLUS **1–2 new bespoke enemies per dungeon** (existing rosters + new, on-curve).
- **Transitions**: route/connector maps get the same corridor/branch treatment (no bare
  snake-paths).

**Cadence:** small, fully-gated slices per session; **each session ends by updating THIS doc**
(status + what's next + exact workflow). Chapter-by-chapter, **Ch3 is the pilot**. Art is
authored via ChatGPT (Claude drives Chrome MCP; **user approves each batch's render**).

## THE THREE BINDING DESIGN DOCS (read the relevant one before authoring)

| Category | Doc | Bar |
|---|---|---|
| Settlements/cities | `docs/CITY_DESIGN_LANGUAGE.md` (existing) | §0 scrap-and-rebuild, M1–M8 |
| Wilderness / routes / overworld corridors / **elevation** | `docs/WILDERNESS_DESIGN_LANGUAGE.md` (NEW) | §0 forest-belt grammar, W1–W8, § Elevation |
| Interiors / things-to-do / venues | `docs/INTERIOR_DESIGN_LANGUAGE.md` (NEW) | §0 multi-room, I1–I7, the things-to-do checklist |

The settlement program's per-map machinery (extract → blueprint → implement → gate → review,
token discipline, palette growth) is documented in `docs/SETTLEMENT_REDESIGN_HANDOFF.md` and
is REUSED wholesale — this program extends its driver to wilderness/interiors/dungeons.

## GUARDRAILS (immovable — every slice re-checks)

- **Balance is CANON.** Boss HP < the chapter's Fortune-Arc money target
  (`tools/content-validate.ts`); TTK 4–10 (`npm run balance`). New enemies/rewards/shop
  sinks go ON the curve with the canon pin updated — never ad-hoc.
- **Art is authored, never procedural.** `src/spritegen/` stays frozen (boot fallback). New
  tiles append at the **TILESET tail** via a grow-and-write script using `findIndex` (never a
  mid-array insert / re-pack). `tools/apply-eb-tile-kit.ts` is the canonical installer; write
  a `.bak` first.
- **Elevation is OPT-IN, default-flat.** The ~90 shipped maps must stay byte-identical. The
  `elevation` field is absent everywhere except the freeze allowlist
  (`src/data/elevation.test.ts`); every level-aware branch short-circuits when it's absent.
- **Gate order per change:** `npx tsc --noEmit` → `npx tsx tools/door-audit.ts` →
  `npm run validate` → targeted vitest → `npx tsx tools/render-map.ts <set>` →
  `npm run balance` (only if enemies/rewards changed). Full `npx vitest run` + `npm run build`
  once at session close.
- **Door law + reachability:** door-audit farFromReturn ≤40px (recompute paired doors
  together); mandatory corridors ≥3 tiles wide; `sealed()` BFS for dungeons.
- **Determinism:** seeded RNG only (`seededRng`/`Streams`), no `Math.random`/`Date`.
- **Git:** leave everything UNSTAGED (user drives commits). `git status` + mtime check before
  editing shared files (`maps.ts`, `authored.ts`, `tiles.ts`, `OverworldScene.ts`,
  `schemas/index.ts`) — sibling sessions edit concurrently.

## THE ELEVATION ENGINE WORKSTREAM (early, parallel to the flat overworld art)

Design proven by spike (2026-07-03). Approach = **one optional `elevation` plane + a second
"above" render band + level-gated collision**, all no-op when absent. Phases, each gated green
before the next:

- **P0 — Freeze tripwire.** ✅ DONE. `src/data/elevation.test.ts` asserts no shipped map is
  elevated (empty allowlist). The regression ratchet for every later phase.
- **P0.5 — Schema seam.** ✅ DONE. `ElevationSchema = { level: string[] }` optional on
  `MapDefSchema` (`src/schemas/index.ts`). A parallel per-tile level plane ('0'=ground,
  '1'..'9' terraces), same W×H as `grid`. Absent ⇒ flat. tsc + full suite green.
- **P1 — No-op plumbing.** ✅ DONE (S2, 2026-07-03). `buildTiles` now builds
  `this.levelGrid: number[][]` beside `solidTiles` via `buildLevelGrid(h,w)` (all-zero when
  `elevation` is absent; also computes `this.maxLevel` + `this.levelDepthBias`). `mapcheck`
  (`src/levelkit/mapcheck.ts`) gained an optional trailing `LevelJoin` predicate on
  `components`/`reachable`/`bfsField`, default `FLAT_JOIN` (always joins) — no real caller
  passes it. **PROVEN byte-identical:** captured `door-audit` + `content-validate` stdout
  before the edit, re-ran after → `diff` empty for all 201 maps (DOOR_IDENTICAL /
  VALIDATE_IDENTICAL). tsc 0.
- **P2 — The spike map + walk-behind.** ✅ DONE (S2, 2026-07-03). **LIVE-VERIFIED walk-behind
  + stair climb** (screenshots this session). `elev_spike` authored (`maps.ts` `buildElevSpike`;
  24×18, upper terrace level 1 over a 2-row `K` face, one 3-wide `T` stair; **dev-only via
  `window.mfWarp('elev_spike')`** — no shipped map touched). `buildElevationOverlay()` re-emits
  the **solid `K` face only** as depth-sorted images at `depth = (y+1)*TILE_PX` — its own BASE-Y,
  NO level·BIAS (2026-07-03 fix: the BIAS drew the face OVER a lower-ground character at the base,
  swallowing their torso — "blending into the cliff"; base-y sorting makes the character stand
  correctly IN FRONT of the wall, Onett-style). The `levelDepthBias` (`= maxLevel>0 ? mapH*TILE_PX
  : 0`, 0 on flat maps) still lifts the PLAYER/movers so an upper-terrace actor sorts above the
  terrace. `nightDepth` raised by `maxLevel*BIAS`. Player-level scalar (`this.playerLevel`) changes ONLY on a `T` tile; seeded
  at spawn from `levelAtPx`. `elev_spike` on the freeze allowlist + a structural guard test
  (`maps_elev_spike.test.ts`, 5 tests: sole-join, ±1 seams, monotonic stair descent). Live
  values matched design exactly: `maxLevel 1`, `BIAS 1152`, player depth 636 (ground, occluded)
  vs cliff-face 1728; terrace depth 1492. **Adversarial review (8-agent workflow) found 3, all
  fixed:** (F1) props/NPCs/roamers/patrols/followers/vehicles also get the `levelLift(px,py)`
  lift (0 on flat maps ⇒ byte-identical) so terrace actors sort right; (F2) overlay drops the
  walkable `^` lip (only the solid face occludes); (F3) guard test hardened (±1 magnitude +
  monotonic descent). tsc 0; door-audit/validate byte-identical to P1 except the map count
  `201→202`; render-map `elev` set added.
  - **NOTE (dev preview boot):** the automation browser tab is background-throttled, so Phaser's
    1303-asset loader stalls (`inflight:0`). Unstick it from the console:
    `const L=game.scene.getScene('boot').load; L.maxParallelDownloads=64; const p=setInterval(()=>{ if(!L.list.size&&!L.inflight.size){clearInterval(p);return;} L.checkLoadQueue(); },150);`
    then pump `game.loop.step(t+=16)` to run boot→title, `GS.reset()`, `game.scene.start('overworld',{mapId:'elev_spike',x:736,y:960})`, pump again, screenshot. A FOREGROUND
    user tab boots normally with no pump.
- **P3 — Cross-level collision + reachability.** ✅ DONE (S3, 2026-07-03). Completes P0–P3 — the
  de-risk milestone. `collidesStatic` (`OverworldScene.ts:2176`) gained the cross-level rule,
  guarded by `if (this.maxLevel > 0)` so every FLAT map is byte-identical: a sampled tile whose
  `levelGrid[ty][tx] !== this.playerLevel` is SOLID unless its grid char is `'T'` (the stair
  exemption). Proven soft-lock-safe against the 40×36 body box straddling two rows: `playerLevel`
  flips the instant the feet reach a `'T'` row, before the box top can poke the next terrace at
  the ≤23px/frame cap (`RUN·dt_max` = 115·ART_SCALE·0.05). **Player-scoped** (keyed on
  `this.playerLevel`): today only the player collision-tests on an elevated map — `elev_spike` has
  no wandering NPCs/roamers/patrols and followers don't test collision — so the shared
  `collides()`/`collidesStatic()` path is player-correct + inert for others. **Per-mover terraces
  are deferred to the first elevated map that carries NPCs (P5+).** Door/spawn landings already set
  the terrace: `buildPlayer` (`:1564`) seeds `playerLevel = levelAtPx(spawn)`, so a door restart
  arrives on the right level (no code change needed — verified). Reachability wire:
  `levelJoinFor(m)` (`mapcheck.ts:44`, exported) returns `FLAT_JOIN` for flat maps and otherwise
  joins two 4-adjacent cells iff same terrace-level OR either endpoint is a `'T'` stair;
  `mapQualityFlags` gained an optional `join` param (default `FLAT_JOIN`) threaded into
  `components`/`reachable`, and `content-validate.ts` (`:3072`) passes `levelJoinFor(m)` per map.
  The OR-either-endpoint exemption is the **undirected** model of the directed runtime rule — it is
  the more robust choice (a lower cell can step ONTO a single-cell stairhead, which the runtime
  always allows); the two AGREE on any no-invisible-ledge map, diverging only where a `'T'` abuts a
  bare different-level non-`'T'` cell (a law violation the per-map guard catches). **`doorAudit`
  needs NO join** — it is purely geometric (landing-solidity + return-distance), runs no
  reachability flood, so there is nothing for a `LevelJoin` to plug into (this is exactly why its
  stdout stays byte-identical). Tests: `maps_elev_spike.test.ts` +2 (the collision predicate mirror
  + the terrace-is-one-world-via-the-stair proof) and `levelkit.test.ts` +3 (a **synthetic**
  block-a-bare-seam / bridge-via-stair guard — the real catch for a `levelJoinFor`→`FLAT_JOIN`
  revert, which `elev_spike` alone cannot catch because its stair is a walkable GAP so there
  `levelJoinFor ≡ FLAT_JOIN`). **Gates (all green):** tsc 0 · door-audit + content-validate stdout
  **BYTE-IDENTICAL** to the S3 baseline (diff empty across all 202 maps) · full vitest 1331/1331 ·
  `render-map elev` clean · build 0. **Adversarial review** (8-agent workflow): 1 confirmed
  (test-validity — the weak reachability test above; FIXED with the synthetic guard), 3 refuted (the
  `levelJoinFor` OR-vs-target divergence — inert, comment corrected; no global elevation law — P4/P5
  hardening; door-audit not join-threaded — mechanically N/A). **Live-verify deliberately skipped:**
  on `elev_spike` the solid `K` wall already blocks the observable "walk off the terrace mid-face"
  case (unchanged since P2's verified walk-behind), so the P3 rule adds nothing new to SEE there —
  it is a general backstop for future partial-wall terraces, proven by the tests + the byte-identical
  diff + the frame math.
- **P4 — Cliff art kit (multi-band FACE done; corners/stairs deferred).** ✅ CORE DONE (S4,
  2026-07-03). The LAYERED CLIFF KIT's face bands are authored + wired: `cliff_top` (grassy
  overhang baked into the top pixels), `cliff_mid_a`/`cliff_mid_b` (rock strata, hashed per
  cell for organic variety), `cliff_base` (scree + ground shadow). Authored via ChatGPT
  (`assets/art/masters/world/cliff-kit-source.png`, 2×2 magenta strip, **user-approved**),
  installed by `tools/apply-cliff-kit.ts` (hedge-kit clone; `.pre-cliff.bak.png` first; strip
  grown to `TILESET.length*64`; cols 167–170; `CLIFF_KIT_BASE` + 4 `solid` tiles in
  `tiles.ts`). `buildElevationOverlay` (`OverworldScene.ts`) now selects a band per K-cell by a
  **vertical K-run scan** (top row = overhang, base row = scree, else mid_a/b) — each emitted at
  its OWN base-y `(y+1)·TILE_PX`, so banding is a pure TEXTURE choice, **orthogonal to depth**
  (no level·BIAS, no per-band delta ⇒ the P2 walk-behind is preserved by construction). The
  `tileData` field (the old single-K re-emit's only reader) was removed. Overlay-only +
  `maxLevel>0`-guarded ⇒ **flat maps byte-identical** (proven: door-audit + validate diffed EMPTY
  vs the S4 baseline). Design was adversarially reviewed by 2 sonnet critics (the intended Fable 5
  design agent hit usage limits; findings implemented faithfully — depth-orthogonality, baked
  overhang, no-lip-emission, K-run banding). Gates: tsc 0 · full vitest 1339/1339 (elev_spike
  guard +1 P4 band test) · render-map elev · build 0.
  - **DEFERRED (documented, honest):** corners/caps + `stair_top/mid/base`. Corners need 2D
    shape detection (false-positives at the stair gap, `{top,mid,base}×{left,right}` cap table);
    stair bands are a DIFFERENT code path (base-tilemap, not an overlay occluder — "stairs are
    never occluded"). Neither blocks the face payoff; both are a fast-follow (a second small strip
    + a `buildTiles` T-run branch). Do them when a shipped map's cliffs actually END mid-map or
    show prominent stairs (foggybottom may want caps).
  - **LIVE-VERIFIED (S5, 2026-07-03):** the running multi-band walk-behind. Via the P2 loader-pump
    recipe on `window.mfWarp('elev_spike')` (Chrome MCP, dev tab): the 3-row face renders all three
    P4 bands DISTINCTLY (grassy `cliff_top` overhang → hashed `cliff_mid_a/b` masonry strata →
    `cliff_base` scree), the `T` stair is drawn un-occluded cutting the face, and depth-sorting is
    correct in all three states — ground player at the cliff FOOT draws IN FRONT of the wall (feet
    depth 704 > base-row depth 640, not swallowed), terrace player is LIFTED (depth 1408 = y256 +
    1·BIAS1152) so it sorts above the terrace, and `playerLevel` flips 0↔1 exactly on the stair.
    Screenshots in this session's transcript. **P4 face is fully DONE** (corners/caps + dedicated
    stair-band tiles remain the documented fast-follow, only if a shipped map's cliffs END mid-map
    or show prominent stairs).
- **P5 — foggybottom terrace-aware.** ✅ DONE (S5, 2026-07-03). The FIRST shipped elevated map +
  the S5 anti-formula pilot. **SIGNATURE: a four-terrace sea-cliff you descend into a sinking
  fog-ceiling** — RIM GARDENS (L3, sunlit) → HIGH STREET (L2, grey canyon) → MARKET SHELF (L1) →
  DROWNED QUAY (L0, fog-soup), 60×52, three stairs STAGGERED W/C/E so the descent doglegs. New
  engine: an opt-in `atmosphere:'fog'` veil (`buildFog`, cloned from `buildNight`) whose alpha
  scales with `playerLevel` (0.14 rim → 0.62 quay; NORMAL blend, cool slate 0xaeb9c4, re-tweens on
  each stair via `updateFogForLevel`) — the "fog ceiling that sinks with you." The bespoke fog
  wisps/haloes/fog-horn/Roman-drain + per-mover terraces + facade-density are the honest FAST-FOLLOW
  (NPCs are `idle`, spawner pinned to the flat L1 interior, since per-mover terrace collision is
  still deferred). `maps_foggybottom.test.ts` (10 tests, mirrors elev_spike + generalised to 4
  terraces + passes `elevationLawViolations`) + `ELEVATED_ALLOWLIST` entry, same change. All fixed
  points preserved (Lucille landing moved to the quay + `FOGGYBOTTOM_LANDING` synced; foggy_moor
  paired door re-aimed to the rim gate; `MAP_REFLECT` moved to the new Tyne rows; the 3 q_sender
  triggers one-per-terrace; the chemist shop; one picnic; settlement/area/ambience by id). The Kettle
  is a bespoke front+back pub interior (taproom keeper + snug lore-regular). Gates: tsc 0 · door-audit
  (no real/non-waived) · validate (byte-identical for EVERY other map; foggybottom's occupyCity unit
  count dropped 202→197 maps as the terraced town carries fewer catalog facades, +2 Kettle) · full
  vitest 1349/1349 · build 0. **LIVE-VERIFIED** (Chrome MCP, loader-pump): the four terraces render,
  the fog visibly thickens rim→quay, walk-behind cliffs at every terrace foot, staggered stairs, and
  the hi-res occupyCity buildings (ARCHIVE/FLATS) all read. Files: `src/schemas/index.ts`
  (`atmosphere` seam), `src/scenes/OverworldScene.ts` (`buildFog`/`fogAlphaForLevel`/`updateFogForLevel`
  + the T-tile hook), `src/data/maps_ch3.ts` (rebuilt `buildFoggybottom` + `buildKettleTaproom/Snug` +
  `FOGGYBOTTOM_LANDING` + foggy_moor return door), `src/data/maps.ts` (`MAP_ATMOSPHERE` + `MAP_REFLECT`),
  `src/data/dialogue.ts` (4 Kettle lines), `src/data/elevation.test.ts`, `src/data/maps_foggybottom.test.ts`
  (new), `docs/DIVERSITY_LEDGER.md` (new — the NO-FORMULA gate ledger).

Effort: ~2–2.5 focused weeks to a terraced foggybottom; **P0–P3 (~1 week) is the de-risking
milestone.** Risk concentrates in the depth/occlusion band, the hot-path collision change,
stair-transition edge cases (soft-lock history: ADR-137/102), and art iteration. Full spike
notes are in this session's transcript (elevation-engine-spike).

## THE ART LEDGER (authored via ChatGPT; Claude drives, user approves)

**Universal terrain kit (author once, region-tint per chapter):**

| Strip | Contents | Pipeline | Elevation-coupled? |
|---|---|---|---|
| hedge-wall ✅ DONE (S2) | 16-mask autotile, `hedge_0..15` @ TILESET tail (HEDGE_BASE); `'H'` grid char; `tools/apply-hedge-kit.ts` (interior base + lit rim on open edges, round post for isolated) | tile-tail + buildTiles neighbor-mask | NO (flat) |
| bramble-wall ✅ DONE (S2) | 16-mask autotile, `bramble_0..15` @ TILESET tail (BRAMBLE_BASE); `'V'` grid char; `tools/apply-bramble-kit.ts` (hedge clone, thornier/darker briar) | tile-tail + buildTiles neighbor-mask | NO (flat) |
| road-junction | turn/T/cross/dashed-corner | tile-tail (+ isRoad mask) | NO |
| path→grass transition | soft dither band + apron | augments the 32 path masks | NO |
| foliage-fade | sapling/shrub/tall-grass fade | tile-tail walkable | NO |
| **cliff layered set** | overhang band + face top/mid/base + stair top/mid/base + corners/caps | tile-tail + overlay band | **YES (P4)** |

Flat strips can be authored anytime (S2+, parallel to the engine). The cliff set waits for the
engine spike (P4) so the slice layout matches the overlay renderer.

**Per-chapter bespoke needs** (enumerate at each chapter's blueprint): region trees
(`treeSprite` is region-blind today — only 4 temperate variants; make it region-aware
additively or place bespoke tree props per map), region facades/props (see the settlement
handoff's palette ledger — Chandrapore's 14-source family and 14 promoted city-scale
variants shipped in the Chapter 7 art-heavy session), and venue/interior furniture.

## THINGS-TO-DO ARE ~80% ALREADY BUILT (reuse, don't rebuild)

| Need | Reuse | Where |
|---|---|---|
| Chests / pickups | `signBeat` loot-map + flag-gated open/closed props | `OverworldScene.ts:4189–4245`; walk-over = `questPickup` :6391 |
| Shop buy/sell/equip UI | `ShopScene` + `SHOPS` data + NPC `shop:` field | `src/scenes/ShopScene.ts`, `src/data/shops.ts` |
| Multi-room interiors | linked MapDefs + stairs/door zones | `maps.ts` `buildDosF1/F2/F3`; house = `rex_home/hall/bedroom` |
| Interior auto-fill (~90%) | `occupyCity` / `buildUnitInterior` (runs on EVERY `settlement` map) | `src/data/citylife.ts:336,187` |
| Venue launch | pause world → `launchX` → scene → `mf-*-closed` | Arcade/Hoops/Links; `OverworldScene.ts:3662,3736` |
| Winding roads/rivers | `windV`/`windH` + hand center-tables | growOtterbrook grammar, `maps.ts` |
| Dungeon grammar | `sealed()` BFS, PSI gates, spawner bands | `src/levelkit/dungeons/*`, `src/data/psigates.ts` |

Net-new engineering is small: (1) the elevation engine (above); (2) an optional occupyCity
**back-room** generator for "every building multi-room"; (3) one new **KaraokeScene** (lights
up the karaoke shells game-wide); (4) a ~20-line `PICKUPS` data-table extraction so chests are
pure data. Everything else is authoring within shipped systems.

## PER-MAP WORKFLOW (proven; see the settlement handoff for full detail)

Step 0 recon (git status + builder line + tests) → Step 1 extract (haiku, one manifest/map,
quote coords verbatim + fixed points) → Step 2 blueprint (main model; districts/spine/
fixed-point table/palette plan) → Step 2.5 palette (ChatGPT batch, user approves) → Step 3
implement (ONE sonnet agent/map; read the binding doc first) → Step 4 gate + render/boot
review → Step 5 close (full suite + build, update THIS doc, leave unstaged).

## CURRENT STATUS (Session 5, 2026-07-03) — THE PILOT SHIPPED

**LANDED S5 (all gates green, UNSTAGED — user drives the commit):**
- **Target 0 (recon):** on latest main (`fd8ca10f`); door-audit + validate baselines captured. Confirmed
  the `foggybottom` levelkit HASH_PIN is DECOUPLED (it pins a `SAMPLE_RECIPES` draft, not `buildFoggybottom`
  — no re-pin needed) and `maps_ch3.test.ts` is the semantic rebuild guard (contracts pinned, no coords).
- **Target 1 (P4 close-out):** LIVE-VERIFIED the multi-band walk-behind on `elev_spike` (all three bands
  distinct, stair un-occluded, depth-sorting correct in all states). P4 face is fully DONE. See the P4 entry.
- **Target 2 (P5 foggybottom PILOT):** ✅ SHIPPED — the first anti-formula rebuild AND the first shipped
  elevated map. Signature = the four-terrace fog-cliff descent + the opt-in `atmosphere:'fog'` level-scaled
  veil. Full detail in the **P5 phase entry** above. Diversity ledger seeded (`docs/DIVERSITY_LEDGER.md`),
  foggybottom logged as signature #1. The user's three art-direction decisions this session (AskUserQuestion):
  engine fog-tint (not bespoke overlay), ship structure first (bespoke props = fast-follow), The Kettle a full
  front+back interior — all delivered.
- Gates: tsc 0 · door-audit (no real/non-waived) · validate (every non-foggybottom map BYTE-IDENTICAL) · full
  vitest 1349/1349 · build 0 · render-map + live-verify. Files listed in the P5 entry.

**NEXT (S6): the foggybottom FAST-FOLLOWS, then the next Ch3 maps.**
1. **foggybottom polish (optional, art-gated):** bespoke ChatGPT art — drifting fog-wisp props, landmark HALO
   glows (market cross / gas lamps / pub sign, drawn ABOVE `fogDepth`), a fog-horn post, and the Roman
   drain-arch that turns the SW-quay nook into the real walk-behind + machine-fog-source SECRET. Then the
   deferred P4 corners/caps + stair-band strip if a live cliff-end reads raw. Each needs a user-approved batch.
2. **per-mover terrace collision** — the engine gap the S5 pilot side-stepped with idle NPCs. Do it when a
   map needs cross-terrace ROAMERS/wanderers; unblocks living elevated towns.
3. **The next Ch3 maps** (foggy_moor → wintermoor_grounds → the_old_stones → the Wintermoor dungeon), each
   through the concept→blueprint→(palette)→implement→gate→review→ledger process. The foggybottom builder is now
   the reference pattern for an elevated settlement (grid bands + generated level plane + staggered stairs +
   fixed-point recomputes). Non-elevated maps can be delegated to one Sonnet implementer per map.

## CURRENT STATUS (Session 4, 2026-07-03)

**LANDED S4 (all gates green, pushed to main):**
- **C — the GLOBAL elevation law.** `elevationLawViolations(m, isSolid)` (`src/levelkit/mapcheck.ts`,
  exported via `index.ts`) machine-checks no-invisible-ledge + no->1-level-jump + plane-dims across
  EVERY opt-in map; wired as a SILENT fail-only gate in `content-validate.ts` (returns `[]` on flat
  maps ⇒ byte-identical stdout). 7 synthetic vitest pins + an elev_spike-passes-law assertion; bite-
  proven end-to-end (clean on real elev_spike; 21 violations on a dissolved-face ledge; catches a
  malformed plane). foggybottom's seams are now auto-checked, not just guard-checked.
- **A — the P4 LAYERED CLIFF KIT (face bands).** See the P4 phase entry above. Authored + wired +
  gated; corners/stairs deferred (documented); live-verify pending (dev-only, zero shipped-map blast
  radius). elev_spike rebuilt to a 3-row face to exercise top/mid/base.
- Gates for the S4 commit: tsc 0 · full vitest 1339/1339 · door-audit + content-validate BYTE-
  IDENTICAL to the S4 baseline · render-map elev · build 0. `elev_spike` remains the sole allowlisted
  elevated map. Files: `src/levelkit/mapcheck.ts`, `src/levelkit/index.ts`, `tools/content-validate.ts`,
  `src/levelkit/levelkit.test.ts`, `src/data/maps_elev_spike.test.ts`, `src/spritegen/tiles.ts`,
  `src/scenes/OverworldScene.ts`, `src/data/maps.ts`, `tools/apply-cliff-kit.ts` (new),
  `assets/art/world/otterbrook_tiles_16.png` (grown strip), `assets/art/masters/world/cliff-kit-source.png`
  (new master), `output/{maps_elev,cliff_proof}.png`.

## CURRENT STATUS (Session 3, 2026-07-03)

**LANDED S1 (all gates green):** Ch3 fixed-point guard (`maps_ch3.test.ts`, 29 tests), the P0
freeze tripwire (`elevation.test.ts`), the P0.5 `ElevationSchema` seam (`schemas/index.ts`), the
three framework docs.

**LANDED S2 — ELEVATION ENGINE P1 + P2 (Track A), all gates green, UNSTAGED:**
- **P1 no-op plumbing** — `mapcheck` `LevelJoin` seam + `OverworldScene` `levelGrid`/`maxLevel`/
  `levelDepthBias` fields + `buildLevelGrid`. PROVEN byte-identical (door-audit + validate diffs
  empty across all 201 maps).
- **P2 spike + walk-behind** — `elev_spike` map (dev-only `window.mfWarp`), `buildElevationOverlay`
  (solid-face occluder band), player-level scalar, `nightDepth` raise, `levelLift` on all movers,
  `maps_elev_spike.test.ts` guard (5 tests), freeze allowlist entry, `render-map elev` set.
  **LIVE-VERIFIED**: walk-behind + stair climb screenshots; live values matched design.
- **Adversarial review** (8-agent workflow): 3 confirmed findings, all fixed (F1 mover depth
  lift, F2 lip-not-occluder, F3 test hardening). Files touched: `src/levelkit/mapcheck.ts`,
  `src/scenes/OverworldScene.ts`, `src/data/maps.ts`, `src/data/elevation.test.ts`,
  `src/data/maps_elev_spike.test.ts` (new), `tools/render-map.ts`, this doc.

**LANDED S2 — TERRAIN ART: the HEDGE-WALL + BRAMBLE-WALL autotiles (Track B, batch 1), UNSTAGED:**
- Authored via ChatGPT (`assets/art/masters/world/hedge-wall-source.png`, user-approved),
  installed by `tools/apply-hedge-kit.ts` into `otterbrook_tiles_16.png` at the `hedge_0..15`
  tail columns (`.pre-hedge.bak.png` written first; strip grown to `TILESET.length*64` — the
  authored_assets pin; existing columns byte-preserved). `HEDGE_BASE` + 16 `solid` tiles in
  `tiles.ts`; `CHAR_LEGEND['H']='hedge_15'` (solidity + fallback); a `buildTiles` `'H'`
  neighbour-mask painter (a lit rim faces every OPEN edge, seamless where hedges meet). Gates:
  tsc 0; door-audit + validate **byte-identical to the P2 baseline** (no shipped map uses `'H'`
  yet); autotiling proven by `output/hedge_proof.png` (a hedge maze assembled from the 16 tiles).
- **BRAMBLE-WALL** (Track B batch 1 part 2) — DONE, the hedge pipeline cloned: ChatGPT master
  (`bramble-wall-source.png`, thornier/darker briar) → `tools/apply-bramble-kit.ts` → `bramble_0..15`
  @ tail (`BRAMBLE_BASE`), `'V'` grid char, `buildTiles` `'V'` mask branch, `CHAR_LEGEND['V']=
  'bramble_15'`. `.pre-bramble.bak.png` first; byte-identical to the P2 baseline; maze proof in
  `output/bramble_proof.png`.
- **STILL REMAINING (flat strips):** road-junction, path→grass transition, foliage-fade
  (`docs/WORLD_OVERHAUL_HANDOFF.md` art ledger) — same tile-tail + neighbour-mask recipe.

**LANDED S3 — ELEVATION ENGINE P3 (Track A), all gates green, UNSTAGED:** cross-level collision +
reachability (completes P0–P3, the de-risk milestone). Files: `src/scenes/OverworldScene.ts` (the
`collidesStatic` level rule), `src/levelkit/mapcheck.ts` (`levelJoinFor` + `mapQualityFlags` join
param), `src/levelkit/index.ts` (export), `tools/content-validate.ts` (per-map join wire),
`src/data/maps_elev_spike.test.ts` (+2), `src/levelkit/levelkit.test.ts` (+3 synthetic `levelJoinFor`
guard). Full detail + guardrail proofs + the adversarial-review outcome (1 confirmed→fixed, 3
refuted) are in the **P3 phase entry** above. door-audit + content-validate stdout diffed EMPTY vs
the S3 baseline across all 202 maps; full vitest 1331/1331; tsc + build 0. No shipped map opted into
elevation (`elev_spike` remains the sole allowlisted map).

**HISTORICAL S3 QUEUE (completed or superseded by the later status sections):**
elevation **P4** (the LAYERED cliff art kit — overhang band +
`cliff_face_top/mid/base` + `stair_top/mid/base` + corners/caps; slice layout must match the overlay
renderer), **P5** foggybottom terrace-aware (its own guard + allowlist entry); **Track B remaining
flat strips** (road-junction, path→grass transition, foliage-fade — hedge + bramble DONE; needs the
interactive ChatGPT author+approve loop); a **global content-validate elevation law** (enforce
no-invisible-ledge + no >1-level jump across ALL elevated maps, not just per-map guards — P3 review
hardening); **per-mover terraces** in `collides()` (when the first elevated map carries
NPCs/roamers/patrols); any map rebuild; `PICKUPS` extraction; back-room generator; KaraokeScene.

## NEXT SESSION (S5) — THE ANTI-FORMULA OVERWORLD REBUILD (user directive, 2026-07-03)

> Paste the block below into a fresh Claude Code session in `C:\Meteor Falls` (after this whole doc).
> It is the canonical S5 kickoff. The engine is DONE through P4; S5 is where the WORLD gets rebuilt to
> the bar. The user's exact words: *"every aspect of every map needs to be extremely creative and
> polished and thoroughly thought out the same way EarthBound was. It needs to be interesting and fun
> to walk around each map area and always feel fresh and new and completely novel when moving from one
> area to the next. Not mechanical or formulaic — polished and thoroughly planned and thought out with
> a distinct feel every step of the way."*

### THE PRIME LAW OF S5 — NO FORMULA (read this first, it overrides convenience)

The single biggest failure mode of AI-built maps is FORMULA: every area silently converges on the same
skeleton (forest belt → winding corridor → clearing with an anchor → nature pass) and the world starts
to feel like one map re-tinted. **That is the thing we are actively destroying.** Every map area must:

- **Have a SIGNATURE** — one central spatial idea / gimmick / mood that NO other area in the game uses.
  (Examples, do not reuse verbatim — invent per map: a boardwalk zig-zagging over a sphagnum bog; a
  terraced orchard you descend switchback by switchback; a birch maze where sightlines are blocked by
  white trunks not hedges; a dry creekbed you walk IN, below the banks; a meadow bisected by a single
  impossibly-long fallen log you balance across; a fog hollow navigated shrine-to-shrine by lantern
  light; a hillside of grazing terraces with a runaway cart hazard; a flooded path where stepping
  stones are the only floor.) The signature is chosen FIRST, before any tile is placed.
- **Feel DISTINCT EVERY STEP** — not just distinct from the next map, but internally varied: no two
  screens of the same map should read as "more of the same corridor." Each region within a map gets a
  micro-identity (a change in palette, elevation, prop vocabulary, sightline, or rhythm).
- **Reward WALKING** — branches, dead-ends with a payoff, scenic pockets, secrets, framed vistas,
  set-pieces, surprising transitions. Walking through is the game; make it fun, not a commute.
- **Earn its transitions** — moving from one area to the next should feel like arriving somewhere NEW
  (a reveal, a biome flip, a change of scale/light/sound), never like scrolling the same field.

Enforce this with a **DIVERSITY LEDGER** (a running list, kept in this doc or a sibling `.md`): every
signature, gimmick, mood, set-piece, layout trick, palette, and prop-combo you use gets logged, and a
**diversity critic** (an agent) checks each new map against the ledger and REJECTS repeats. Novelty is a
gate, not an aspiration.

### PROCESS — dismantle & rebuild each map FROM SCRATCH (concept-first)

We are rebuilding the overworld from the ground up AGAIN, map by map, to this bar. For EACH map:

1. **CONCEPT (Fable 5 agent — this is the creative core).** Before touching the builder, a Fable 5
   agent invents the map's SIGNATURE + a beat-by-beat walk-through (what you see/feel at each step,
   the branches, the secret, the vista, the transition in and out), checked against the DIVERSITY
   LEDGER. Output: a short, vivid design brief + a fixed-point table (external warps, test-pinned
   coords, cutscene grounds that must survive the rebuild). *If Fable 5 is out of usage credits
   (it was in S4 — see the note), fall back to Opus main-loop or Sonnet for the concept; do NOT
   block. Log the fallback.*
2. **BLUEPRINT (Fable 5 or main-loop).** Turn the concept into a spatial plan: districts/regions with
   their micro-identities, the spine + branches, elevation plane (use the P4 cliff kit + terraces as a
   creativity tool now that they render), the palette-growth needs (any NEW authored tile/prop the
   signature requires — author via ChatGPT, user approves, BEFORE the implementer runs).
3. **PALETTE (ChatGPT, user approves).** Author any new terrain strips / props the signature needs
   (magenta → PNG → clone `apply-hedge-kit.ts`/`apply-cliff-kit.ts` → TILESET tail → `buildTiles`
   branch → proof). SHOW the render for approval before wiring. (Recipes below.)
4. **IMPLEMENT (one Sonnet agent per map).** Rebuild the builder in-place per the binding docs: belts
   first (solid), THEN winding connectors, THEN clearings/anchors/branches/pockets/secrets/set-pieces,
   THEN the elevation plane, THEN the seeded nature/wear pass, THEN the tree-guard filter LAST.
   Recompute paired door landings on BOTH sides together; re-author any pinned rect the new layout moved.
5. **GATE + REVIEW.** Per-change gate order (below). Then an ADVERSARIAL diversity+quality review
   (agent panel): does it clear the Prime Law (signature present, distinct-every-step, fun to walk,
   earned transitions)? Does it repeat anything in the ledger? Live-verify the walk (loader-pump
   recipe). Fix, re-review, then log the map's signature into the ledger.

### THE FIRST S5 TARGETS (in order)

0. **Recon** (`git fetch`; `git status`; confirm this branch is on latest main; re-capture the door-
   audit + content-validate baselines; mtimes on the hot files). The S4 work (C + P4 face kit) is on
   main.
1. **P4 close-out (small, do first):** LIVE-VERIFY the multi-band walk-behind on
   `window.mfWarp('elev_spike')` (the 3-row face now shows top/mid/base) with the P2 loader-pump
   recipe. If the depth/selection reads correctly, P4 face is fully done. THEN (optional, if a target
   map needs it) author the deferred **corners/caps + `stair_top/mid/base`** as a second small strip.
2. **P5 — foggybottom, the PILOT reimagined map.** The first map rebuilt to the full S5 bar AND the
   first shipped elevated map. Give it a real SIGNATURE (it's "foggybottom" — lean into fog + a sunken
   terraced hollow; navigate by landmarks; the P4 cliffs make the terraces real). Author terrace-aware
   in one pass. Add `maps_foggybottom.test.ts` (mirror `maps_elev_spike.test.ts`: two-terrace, sole-
   stair-join, no-invisible-ledge, monotonic descent, P3 collision mirror, + it passes
   `elevationLawViolations`) + an `ELEVATED_ALLOWLIST` entry in `elevation.test.ts` in the SAME change.
   HEADS-UP: foggybottom has a generator hash-pin (`levelkit.test.ts` HASH_PINS `foggybottom`) — if the
   rebuild changes its generator output, re-pin. door-audit/validate will now DIFFER for foggybottom
   ONLY (the deliberate opt-in); every OTHER map stays byte-identical.
3. **Then chapter-by-chapter (Ch3 pilot first),** each map through the concept-first process above,
   each logged in the diversity ledger, until the whole Ch3+ overworld is rebuilt to the bar. Weave in
   the Track B flat strips (road-junction, path→grass, foliage-fade) as maps need them.

### GUARDRAILS (unchanged, immovable — re-check every slice)

- **NO FORMULA** (the Prime Law above) is now a GATE: the diversity critic must pass.
- Elevation stays OPT-IN / default-flat: every FLAT map byte-identical (door-audit + validate stdout
  diff empty — EXCEPT the map you deliberately elevate). The global `elevationLawViolations` gate now
  machine-checks every elevated map's seams.
- Art is AUTHORED (ChatGPT → PNG), never procedural. `src/spritegen/` FROZEN. New tiles APPEND at the
  TILESET tail via a grow-and-write installer (`findIndex`, `.bak` first, never re-pack).
- Balance is CANON: boss HP < money target; TTK 4–10. Terraced dungeons with bespoke enemies/rewards
  go ON the curve, update the canon pin, `npm run balance`.
- Determinism: seeded RNG only, no `Math.random`/`Date` in shipped paths.
- Gate order per change: `npx tsc --noEmit` → `npx tsx tools/door-audit.ts` → `npm run validate` →
  targeted vitest → `npx tsx tools/render-map.ts <set>` → `npm run balance` (only if combat changed).
  Full `npx vitest run` + `npm run build` once at close.
- Git: user drives commits normally, BUT when they say "push to main" (as in S4), commit the gated-
  green work (leave `.pre-*.bak.png` UNTRACKED) and `git push origin HEAD:main`.

### AGENT USAGE (per user directive + [[agent-cost-discipline]])

- **Fable 5 for the CREATIVE / complex-judgment work**: the per-map CONCEPT + signature, the blueprint,
  the diversity-critic + adversarial-review synthesis. **REALITY CHECK: Fable 5 ran OUT OF USAGE CREDITS
  mid-S4** — if a Fable 5 agent errors with "out of usage credits," fall back to Opus main-loop (highest
  judgment available) or Sonnet, and keep moving. Do NOT stall the session waiting on Fable.
- haiku/sonnet for mechanical work (extract, tile installers, test scaffolding, one implementer/map).
- main-loop for small localized edits.

### RECIPES & GOTCHAS (reuse — they save hours)

- **ChatGPT harvest** (works): the generated `<img>` src is a same-origin signed `estuary/content`
  URL — fetch it IN-PAGE (`await fetch(img.src)` where `img.naturalWidth` is large) → `blob` →
  `URL.createObjectURL` → `<a download>` → move from `~/Downloads`. Do NOT return the URL (or any
  query-string data) from the JS tool — it blocks. The ChatGPT SEND button: set the composer via
  `#prompt-textarea` (`execCommand('insertText')`), then click `button[data-testid="send-button"]`
  via `.click()` (a pixel-click on the arrow can miss). The automation tab is `visibilityState:hidden`
  ⇒ throttled: screenshots hit the 30s CDP ceiling during image paint; detect completion via JS
  (`img.naturalWidth>400`) instead, and be patient (gen ~60–90s).
- **Installer**: a 2×2 (or NxM) magenta strip slices with the hedge `spans()` (`>60px` is the min
  CELL width, NOT gutter width — a ~22px gutter between ~570px cells is fine). Opaque tiles (cliff)
  force alpha 255 + exclude magenta from the colour average + a small INSET to skip gutter bleed;
  autotile masks composite a rim (hedge/bramble).
- **Dev-preview boot** (P2, for live-verify): the automation tab is background-throttled → Phaser's
  1303-asset loader stalls; force-pump `boot.load.checkLoadQueue()` on a `setInterval`, then
  `game.loop.step(t+=16)` to run boot→title, `GS.reset()`, `game.scene.start('overworld',{mapId,x,y})`,
  pump again, screenshot. A FOREGROUND user tab boots normally.

*(Superseded S4 kickoff removed; its work — P4 face + the global elevation law — landed. The dev-preview
boot workaround + the P2/P3 phase entries above remain the reference for any live elevation preview.)*

## CURRENT STATUS (Chapter 3 production close, 2026-07-12) — PILOT COMPLETE

This section supersedes the Session 3–5 “not yet started / fast-follows / next
Ch3 maps” queue language. Chapter 3 is no longer the next world-overhaul target: its complete
twelve-map route, live chapter systems, authored landmark kit, compatibility
migration, and regression surface are implemented.

### Shipped map contract

The exact save-facing roster is `biplane_interior`, `foggybottom`,
`kettle_taproom`, `kettle_snug`, `foggy_moor`, `wintermoor_grounds`,
`the_old_stones`, `wintermoor_f1`, `wintermoor_f2`, `wintermoor_f3`,
`wintermoor_dorm`, and `wintermoor_boiler`.

- **Lucille** is a storm cabin rather than a transition box: cockpit, animated
  windows/lightning, cargo net, seating, and vibration/rattle sell the flight.
- **Foggybottom** retains the four descending terraces and sinking-fog
  identity, but now supports stable town services, a buyable flat, agency,
  bank, dealership/motor works, and petrol. **The Kettle** extends that service
  loop with paid lodging and a real guest room. The first four town facade
  slots are save- and service-facing.
- **Foggy Moor** is the 126×96 regional walk: a winding dry-stone-wall route,
  branches, secret/reward pockets, picnic/quest anchors, telegraph sequence,
  viaduct, and Roman culvert. **Wintermoor Grounds** stages the gate/porter,
  greenhouse wreck, academy/quad, cricket edge, service approach, and Clicker
  lesson. **The Old Stones** are a concentric landscape with authored menhirs,
  trilithon and spring, including a restored post-boss state.
- **The school** has five substantial dungeon maps: great hall/library/tuck
  shop, classroom/fog-pipe floor, exam hall plus raised Mainframe arena, a
  cover-rich patrol dorm, and the boiler/fog plant. The boiler's exact
  `WINTERMOOR_COOLANT_CROSSING` is the sole Freeze-opened crossing; machine and
  blocker art phase with the same flags as collision.

### Live systems and story

- The seven Chapter 3 beats are wired where they occur: flight, Milo join,
  first borrow, Old Stones, machine-fog reveal, Mainframe, and Heartlight. The
  Headmaster Mainframe is canonically **750 HP**; this supersedes historical
  1,600-HP planning text.
- Field PUPPET is a real 14-PP, eight-second overworld control state with target
  eligibility, mind-immunity, range UI, interaction, release/timeout and body
  restoration. Milo's Clicker is a separate story-gated system for authored,
  unoccupied machines; it owns the grounds practice cart and the boiler valve
  tug and never serializes transient machine position.
- Chapter maps now consume actual rain, wind, and machine ambience beds. Fog
  density follows the player's Foggybottom terrace before victory, falls to
  24% of that density after victory, and the Old Stones/enemy/NPC state reacts
  to `mainframe_defeated`.
- Foggy town amenities use real cash/property/fuel/vehicle state. The showroom
  exposes price, class, seats, resource/range, party fit, ownership, delivery
  pad and shortfall; the driving HUD reports party fit and exact parking map.
- `?devMap=<one-of-the-12>&devState=arrival|joined|coolant|postBoss|complete`
  is the supported survey seam. Default spawn derives from a valid inbound
  door; explicit `devX`/`devY` only override when actually supplied.

### Art and compatibility

Two original source banks are retained under `assets/art/masters/world/`:
`ch3-outdoor-landmarks-source.png` and `ch3-machinery-stones-source.png`. They
slice to sixteen alpha-clean runtime props registered in `authored.ts`:
`ch3_viaduct_arch`, `ch3_roman_culvert`, `ch3_greenhouse_wreck`,
`ch3_cricket_pavilion`, `ch3_school_gate`, `ch3_porter_lodge`,
`ch3_telegraph_pole`, `ch3_lucille_cockpit`, `ch3_lucille_window`,
`ch3_cargo_net`, `ch3_fog_engine`, `ch3_valve_manifold`, `ch3_menhir`,
`ch3_trilithon`, `ch3_spring`, and `ch3_academy_main`.

Save version **v20** owns deterministic recovery for all twelve rebuilt map
layouts plus safe rehoming for parked vehicles on the four rebuilt outdoor
maps. It changes only invalidated Chapter 3 world-location data; ownership,
fuel, continent, story, party, and economy remain exact, and unaffected saves
and parking remain byte-stable. Any future movement of route mouths,
Foggy service slots, the coolant rectangle, or machine ids must update both the
map contract tests and the migration strategy.

### Gate state, risks, and next phase

Focused suites cover the exact roster/topology, Foggy elevation and fixed
points, amenities, property/refuel, vehicle domain/showroom, control helpers,
PUPPET/Clicker lifecycle, cutscenes, audio ambience, post-boss fog, Title dev
spawns, and v20 migration. The load-bearing files are
`maps_ch3.test.ts`, `maps_foggybottom.test.ts`, `city_amenities.test.ts`,
`control.test.ts`, `OverworldScene.test.ts`, `TitleScene.test.ts`,
`VehicleShopScene.test.ts`, `audio.test.ts`, `cutscenes.test.ts`, and
`migrations.test.ts`; keep them in the focused command when changing this
chapter. Keep the normal close sequence authoritative:
typecheck → strict door audit → content validate → focused tests → Chapter 3
render → balance → strict visual audit → full tests → build → live browser
survey. Regenerate and drift-check the map-editor manifest after map metadata
changes.

Known non-blocking debt is limited to shared/global surfaces: the strict visual
audit's pre-existing report of 94 unregistered battle PNGs and the broader
stylization program's still-unfinished universal/per-region 47-blob ground
families. Neither is a missing Chapter 3 runtime dependency; the sixteen new
world props are registered and in use.

## Chapter 6 production close

The Chapter 6 save-facing roster is exactly `zanzibel`, `savanna_run`,
`laughing_ruins`, and `sphinx_chin`, at 72×56, 104×64, 80×88, and 56×44.
`CH6_WORLD` owns route mouths, landing, story rectangles, boss/resonance staging,
developer spawns, and migration reasoning. Zanzibel has sixteen supported source
facades and fourteen live generated units; the first six source sprites,
historical locked index 4, units 0–4, service NPC ids, return doors, and established
unit identities are frozen. New lock index 12 is part of the v23 contract.

Savanna Run is a clearing-chain route with separate watering-hole and escort
beats. Laughing Ruins forces the Held Breath unlock before the Trust dilemma in
both geometry and runtime logic; early choice contact is explicitly rejected.
Every ruin spawner retires under `laughing_sphinx_defeated`. Sphinx’s Chin keeps
the 9,000-HP boss and Heartlight chamber spatially separate.

The full Chapter 6 gallery remains `ch6_journey`, while runtime uses flight,
arrival, courier, ruins, Sphinx, and Heartlight subsets plus the Held Breath
panel. Teleport Alpha remains Jay’s established level-26 ability; the courier is
a real story tutorial, not a second grant path. Both core quests now award their
fixed item and Caller, block cleanly on full bags, retry, and complete only once.

Save v23 relocates only invalidated Chapter 6 player/parking geometry and keeps
flags—including Held Breath, Trust, and quest progress—exact. The supported dev
seam is `?devMap=<ch6-id>&devState=arrival|city|savanna|ruins|choice|boss|postBoss|complete`.
All profiles use the five-person level-30 party, five prior Embers, and the Lens
and Thimble key items without preselecting Trust. Exact evidence lives in
`docs/CH6_PRODUCTION_VERIFICATION.md`; Chapter 7 is now also complete.

## Chapter 7 production close

The save-facing roster is exactly `chandrapore`, `monsoon_road`, `night_train`,
and `palace_throne`, at 120×88, 108×68, 48×128, and 88×104. `CH7_WORLD`
owns every route mouth, landing, story/quest rectangle, recovery point, vehicle
bay, profile spawn, and migration target. The four maps deliberately claim four
different signatures: three-district city knot, diagonal floodwater causeway,
car-by-car heist, and vivarium habitat loop with separated boss/throne goals.

Chandrapore supports 14 source facades and 18 units without Zanzibel borrowing.
Historical sources remain Hillcrest → unit 0, Moon Gate → unit 1, Civic Hall →
locked, Motor Gallery → unit 2, and Silver Parasol → unit 3. The four services
remain stable and new tenancy appends. Four original image-generation master
banks feed 14 source PNGs, 14 explicit city-scale PNGs, and the palace-spire
landmark; `src/spritegen/authored.ts` owns the closed-world authored allowlist.

The Star Locket uses explicit availability state through theft, chase, coupling,
and recovery; completed saves normalize to one Locket while a valid mid-heist
save stays stolen. The seven-panel gallery remains intact and runtime uses seven
contextual cuts. Exactly five quests ship, including all three new cinema,
station, and ghat stories. Cobra Raja remains exactly 20,000 HP and must precede
the retry-safe Heartlight 7 trigger.

Save v24 recovers the four maps, generated interiors, parked vehicles, and
Locket state without inventing story completion. Nine development profiles span
arrival through complete. Exact art, test, editor, and visual evidence lives in
`docs/CH7_PRODUCTION_VERIFICATION.md`; Chapter 8's successor contract is below.

## Chapter 8 production rollout

The save-facing roster is exactly `lotus_harbor`, `bamboo_road`,
`spore_forest`, and `mt_shu_temple`, at 112×80, 104×64, 88×104, and 96×104.
`CH8_WORLD` owns every dimension, route mouth and landing, story/quest/hazard
rectangle, safe pocket, recovery point, vehicle bay, profile spawn, and
migration target. The four maps deliberately claim different signatures: a
fan-shaped terraced working river crescent, braided lock-and-switchback ascent,
asymmetric safe-pocket fungal loop network, and folded processional temple with
separate Dragon/bell goals.

Lotus Harbor places twenty-four source facades and yields twenty-two live units.
The historical unlocked prefix is lantern shop → `unit_0` realtor, tea house →
`unit_1` home host, temple → `unit_2` dealer, and tea house → `unit_3` hotel
clerk; appended tenancy cannot renumber those roles. All eight Lotus source
identities have explicit authored city-scale variants, and the existing market,
property, agency, dealership, hotel, phone, ATM, dock, fuel, and vehicle ids
remain live.

Riverboat, not Lucille, owns the Lotus arrival. Lucille remains the safe
backtracking network and the visible Yak Express owns the forest-to-temple leg.
The seven-panel `ch8_journey` gallery remains intact; contextual one-panel cuts
play where each beat occurs, with dedicated departed-Pippa Dragon and bell
variants. Missing Trust escalations are staged rather than invented by migration.
FREE keeps Pippa; STRINGS retains her only when reconciled with rewind debt at
most two, otherwise her exact serialized record moves to the departed bench.
The Bamboo Clicker clearing is public, controls only unoccupied machinery, and
leaves a repaired painted lock plus The Lotus Bargeman Caller.

Mushroomized is a saved deterministic control transform: authored hazards latch
clockwise, counter-clockwise, or reverse logical movement after common input
handling. Spore Puffer can inflict it; a consumed Spore Antidote, reusable Scroll
of Calm, doctor, or defeat recovery clears it. Clean-pocket recovery prevents
stranding. The Mt. Shu elder is the sole Teleport Beta teacher; Alpha/Beta use
96/32-native-pixel run-ups, safe visited destinations, single-charge PP
accounting, follower re-forming, unchanged vehicles, and comic wall failure.

Exactly five regional quests ship: Brushes of Mt. Shu, Lanterns of the False
Fold, The Yak Who Waits, The Harbor's Balance, and Tea for the Empty Chair.
Every flow is persistent, hands-full retry-safe, backtrackable after the boss,
and leaves a local footprint. The accepted combat set is four authored regulars
plus Paper Dragon, not the obsolete twenty-enemy package. Paper Dragon remains
exactly 45,000 HP with AIRBORNE physical immunity, two-turn Volt/Bottle-Rocket
grounding, one below-30% BURNING speed double, and normal HP victory. Retry-safe
Paper Fan award precedes the gated bell, Heartlight 8, and exact Ember count 8.

Save v25 recovers the four maps, `lotus_harbor_unit_0` through `_21`, the hotel
room, and parking; adds Mushroomized and the departed-hero bench; preserves
Trust, Clicker, Pippa, quest, reward, caller, echo, party, inventory, and economy
state; and rejects future versions. Thirteen development profiles span arrival,
city, barge, both Trust outcomes, hazardous/cured forest states, brushes, Yak,
temple, boss, postBoss, and complete. Exact final editor, test, audit, render,
original-resolution, and live-QA evidence belongs in
`docs/CH8_PRODUCTION_VERIFICATION.md`; do not infer those passes from this
implementation handoff.
