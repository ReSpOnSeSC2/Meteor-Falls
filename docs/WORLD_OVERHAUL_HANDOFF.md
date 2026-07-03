# WORLD OVERHAUL — Ch3+ program handoff (the master doc)

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
- **P3 — Cross-level collision + reachability.** `collidesStatic` (`:2038`): a tile with
  `levelGrid[ty][tx] !== playerLevel` is solid unless it's a T stair. Door landings set the
  player's level from the destination tile. `mapcheck` proves the upper terrace is reachable
  ONLY via the stair (no orphan). **Gate: `elev_spike` guard test + door-audit; 90 flat maps
  byte-identical.**
- **P4 — Cliff art kit (see art ledger).** Author the LAYERED cliff set (overhang band +
  `cliff_face_top/mid/base` + `stair_top/mid/base` + corners/caps). Different from the
  in-plane fake. **Gate: visual review.**
- **P5 — foggybottom terrace-aware.** First real content map to opt in (its own guard test +
  allowlist entry). Comes after the flat foggybottom rebuild OR is authored terrace-aware in
  one pass — decide at S-foggybottom time.

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
handoff's palette ledger — **chandrapore hotel+apartment facades have ZERO authored keys**,
its own art-heavy session), and venue/interior furniture.

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

## CURRENT STATUS (Session 2, 2026-07-03)

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

**NOT YET STARTED:** elevation **P3** (cross-level collision + reachability — the next engine
step), P4 cliff art, P5 foggybottom; **Track B remaining flat strips** (road-junction, path→grass
transition, foliage-fade — hedge + bramble DONE); any map rebuild; `PICKUPS` extraction; back-room
generator; KaraokeScene.

## NEXT SESSION (S3) — recommended kickoff

Step 0 recon first (`git status`; confirm no sibling edits to `OverworldScene.ts`/`tiles.ts`/
`maps.ts`/`schemas`/`mapcheck.ts`). Then pick up either/both:

1. **Elevation P3 — cross-level collision + reachability (Track A cont.).** Now that the render
   walk-behind is proven, make levels COLLIDE: in `collidesStatic` (`OverworldScene.ts`), a tile
   whose `levelGrid[ty][tx] !== this.playerLevel` is solid UNLESS it's a `T` stair. Wire the
   `mapcheck` `LevelJoin` (already seamed in P1) from real maps so `content-validate` proves the
   upper terrace is reachable ONLY via the stair (no orphan). Door landings set `playerLevel`
   from the destination tile. **Gate: `elev_spike` guard + door-audit; 201 flat maps byte-
   identical (the `LevelJoin` must stay `FLAT_JOIN` for every flat map).** On `elev_spike` today
   the `K` wall already blocks cross-level walking, so P3 is the GENERAL rule + the validator wire.
2. **Track B — remaining flat terrain strips.** HEDGE-wall (`'H'`) + BRAMBLE-wall (`'V'`) autotiles
   both LANDED this session (see above). Remaining, same recipe (ChatGPT author on magenta → clone
   `apply-hedge-kit.ts` → `<NAME>_BASE` + 16 tiles + a FREE grid char (taken: `H`,`V`) + `CHAR_LEGEND`
   entry + `buildTiles` mask branch → maze proof): road-junction (turn/T/cross), path→grass
   transition band, foliage-fade (sapling/shrub/tall-grass). None BLOCK P3.
   - **Reuse recipe for the ChatGPT harvest** (this session, works): the generated `<img>` src is
     a same-origin signed `estuary/content` URL — fetch it IN-PAGE (`await fetch(img.src)` where
     `img.naturalWidth` is large), `URL.createObjectURL` → `<a download>` → move from Downloads.
     A plain `?id=...` fetch 404s (needs the signed `p`/`ts`). Do NOT return the URL from the JS
     tool (it blocks query-string data).

The dev-preview boot workaround (loader unstick + loop pump) is documented under P2 above —
reuse it for any future live elevation preview from the automation browser.
