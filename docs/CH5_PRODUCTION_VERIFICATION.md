# Chapter 5 Production Rollout Verification

Date: 2026-07-13
Branch: `codex/chapter-5-production-rollout`
Base: `origin/main` at `d54c25b4`

## Scope

- Rebuilt the four stable Chapter 5 maps without renaming save-facing ids:
  - `minimus_major` — 72×56 production capital with sixteen live facades.
  - `procession_way` — 104×64 clearing-chain route with two exploration branches.
  - `the_hedgerow` — 88×72 solid-belt wilderness dungeon with reward pockets.
  - `ducal_crown` — 52×40 staged south-to-north boss and resonance approach.
- Preserved the historical Minimus facade order and generated unit ids 0–5.
- Wired all five existing Chapter 5 quests end to end, including rewards and caller records.
- Split the Chapter 5 art reel into story-safe flight, arrival, Lens, join, boss, and Heartlight sequences.
- Moved the Big-Little Lens and Royal Thimble into the capacity-free key-item ledger.
- Added save migration v22 for map recovery, vehicle parking, and prerelease bag copies.
- Added Chapter 5 developer profiles for arrival, city, route, boss, post-boss, and completion QA.
- Regenerated map-editor data and added the Chapter 5 render set.

## Pinned contracts

- Four-map roster and production dimensions.
- Deterministic repeated map builds.
- Reciprocal, walkable route landings and in-bounds authored anchors.
- Sixteen-facade capital with historical unit/service identity preserved.
- Every Chapter 5 quest objective placed and handled.
- Whiskerzilla encountered before the Crown resonance.
- Hedgerow encounter cleanup after the mercy win.
- Three picnic rests and the Royal Long-View scale landmark.
- Contextual cutscenes cannot spoil later Chapter 5 reveals during the flight.
- All v21 Chapter 5 saves recover to a safe tile on the same stable map id.
- Rehomed vehicles use deterministic, non-overlapping parking slots.
- Full bags cannot lose either Chapter 5 key item during migration.

## Verification

| Gate | Result |
| --- | --- |
| TypeScript | Pass |
| Content validation | Pass — 234 maps, 31 quests, 1,281 dialogue scripts |
| Map-editor generation/check | Pass — 234 map definitions current |
| Strict door audit | Pass — 0 non-waived stuck, wrong-edge, or body-blocked doors |
| Chapter 5 map/cutscene/migration/dev-profile tests | Pass |
| Full Vitest suite | Pass — 105 files, 1,751 tests |
| Balance simulation | Pass — Chapter 5 target level 26, Whiskerzilla 7-turn conservative TTK |
| Enemy frame audit | Pass — 147/147 fully authored battle frames |
| Strict visual identity audit | Pass — 144/144 authored, 0 legacy |
| Production build | Pass |

The build retains the existing Vite advisory for the optional standing-frame URL and the existing bundle-size advisory. Content validation retains only the repository's documented frozen-pyramid waivers and reported one-way travel links; Chapter 5 introduced no new hard finding.

## Visual audit

The generated contact sheet is [maps_ch5.png](../output/maps_ch5.png). It includes all four overworld maps plus the six historical Minimus unit interiors. The sheet was inspected at original resolution after regeneration.
