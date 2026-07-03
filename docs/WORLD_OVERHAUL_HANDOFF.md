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
- **P1 — No-op plumbing.** Parse `elevation` into `this.levelGrid: number[][]` in
  `buildTiles` (`OverworldScene.ts:855`) alongside `solidTiles` (all-zero when absent). Add an
  OPTIONAL trailing `level?: number[][]` / `sameLevel` predicate to `mapcheck`
  `components`/`bfsField`/`reachable` (`src/levelkit/mapcheck.ts`) defaulting to flat. Thread
  nothing from real maps. **Gate: diff `door-audit` + `content-validate` stdout before/after —
  must be empty for all 90 maps.**
- **P2 — The spike map + walk-behind.** Author `elev_spike` (dev-only door), two levels + a K
  face + one T stair. Wire the `buildTiles` elevated branch: the base layer as today, then the
  **overlay band** (re-emit the upper terrace's lip/face tiles as depth-sorted images at
  `depth = y + level*LEVEL_DEPTH_BIAS`, `BIAS ≈ mapH*TILE_PX`), and the player "current level"
  scalar (changes ONLY on a T tile). Keep `LEVEL_DEPTH_BIAS*maxLevel` below `nightDepth`
  (`OverworldScene.ts:1621` — raise the veil by the same term). Add `elev_spike` to the
  freeze allowlist. **Gate: live preview — walk behind the lip, climb the stair.**
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
| hedge-wall | straights/corners/T/cross/caps (16-mask) | tile-tail + buildTiles neighbor-mask | NO (flat) |
| bramble-wall | same mask family, thorny | tile-tail + neighbor-mask | NO |
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

## CURRENT STATUS (Session 1, 2026-07-03)

**LANDED (all gates green: tsc 0, targeted vitest green):**
- `src/data/maps_ch3.test.ts` — Ch3 fixed-point guard (29 tests): Lucille arrival door,
  picnic law, all story/PSI/quest trigger ids, reflective Tyne, inter-map door targets.
- `src/data/elevation.test.ts` — the P0 freeze tripwire (allowlist empty).
- `src/schemas/index.ts` — the optional `ElevationSchema` seam (P0.5).
- The three framework docs (this file + WILDERNESS + INTERIOR design languages).

**NOT YET STARTED:** elevation P1+ (engine), any art authoring, any map rebuild, the
`PICKUPS` extraction, the back-room generator, KaraokeScene. All work UNSTAGED for the user.

## NEXT SESSION (S2) — recommended kickoff

Two parallel tracks (pick per the user's appetite that session):
1. **Elevation engine P1→P2** — the no-op plumbing + the `elev_spike` map + the overlay
   renderer, ending in a live walk-behind preview for user sign-off. (Foundational.)
2. **Flat terrain art batch 1** — author the hedge + bramble corridor strips (elevation-
   independent) via ChatGPT (user approves), install at the TILESET tail, add the buildTiles
   neighbor-mask, prove with a render. (Unblocks every overworld.)

Do Step 0 recon first (`git status`; confirm no sibling edits to `OverworldScene.ts`/
`tiles.ts`/`schemas`). Then run the P1 diff-gate (door-audit + content-validate stdout must be
byte-identical for all 90 maps) before touching the spike.
