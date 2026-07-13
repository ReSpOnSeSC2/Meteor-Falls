# Chapter 6 Production Verification

Verified 2026-07-13 on `codex/chapter-6-production-rollout` from production baseline
`b5d8af715aa938e39b82bfcd516f0ff28e1f7537`.

## Shipped world contract

| map id | production size | fixed recovery landing | role |
|---|---:|---:|---|
| `zanzibel` | 72×56 | tile (12,52) | three-road-band bazaar capital, two street loops, quay, city services |
| `savanna_run` | 104×64 | tile (2,50) | organic clearing chain, watering-hole branch, escorted convoy stretch |
| `laughing_ruins` | 80×88 | tile (40,85) | nonlinear chamber climb, echo archive, Held Breath, Trust gate |
| `sphinx_chin` | 56×44 | tile (28,41) | separate Sphinx arena and Heartlight resonance chamber |

- All reciprocal outdoor doors land on walkable, body-safe tiles and all doors,
  triggers, NPCs, and signs are reachable from the relevant entry point.
- Chapter 6 contains three picnic recovery points: one each in Zanzibel, the
  Savanna Run, and the Laughing Ruins; the Sphinx's Chin has none.
- Zanzibel uses exactly 16 supported formal-scale source facades. Occupancy
  leaves source indices 4 and 12 locked and creates 14 enterable units.
- The five historical unit identities remain stable:
  `OPEN HOUSE — INDIGO COURTYARD HOUSE`, `BAOBAB KEYS & LAND`,
  `CARAVAN ROAD MOTORS`, `ODDS & ENDS`, and
  `INDIGO CARAVANSERAI — LOBBY`.
- Historical service roles remain in units 0, 1, 2, and 4 (home host, realtor,
  dealer, and hotel clerk). Existing property, fuel, dealership, shop, and
  travel identifiers are unchanged.
- Zanzibel is registered for its cursive area glyph. The Savanna Run uses the
  savanna tile skin; both ruin maps share the carved-stone skin.

## Story, quest, and balance contract

- Contextual panel order is now flight (`ch6_flight`) → market arrival
  (`ch6_arrival`) → courier (`ch6_courier`) → ruin reveal (`ch6_ruins`) →
  Sphinx (`ch6_sphinx`) → Heartlight (`ch6_heartlight`). The complete
  `ch6_journey` gallery remains available in canonical seven-panel order.
- The outbound courier event is unavoidable and contextualizes Jay's existing
  level-26 Teleport Alpha; it does not add a second unlock or awakening.
- `watering_hole_convoy` is playable from the Dockmaster through distinct reach
  and escort zones. It preserves flags `q_convoy`, `q_convoy_reach`,
  `q_convoy_escort`, `q_convoy_done`, reward `savanna_cloak`, and caller heal 460.
- `stones_that_speak` is playable from the Ruins Guide through the western echo
  archive and return report. It preserves flags `q_stones`, `q_stones_listen`,
  `q_stones_carry`, `q_stones_done`, reward `griot_string`, and caller damage 455.
- Both completions are idempotent and retain their reward when inventory is full
  so the player can make room and retry.
- The Trust choice is suppressed until Held Breath is learned and remains
  undecided in every developer profile. The Sphinx encounter precedes resonance;
  post-boss spawners clear on `laughing_sphinx_defeated`.
- The Laughing Sphinx remains exactly 9,000 HP. The balance simulation reports a
  conservative five-turn level-30 TTK and a four-turn read/setup TTK.

## Save v23 and developer profiles

- Save version is 23. The v22→v23 migration only relocates positions affected by
  the four rebuilt maps and affected outdoor parking records.
- Player recovery tiles are Zanzibel (12,52), Savanna Run (2,50), Laughing Ruins
  (40,85), and Sphinx's Chin (28,41). Parking anchors are Zanzibel (23,45) and
  Savanna Run (8,50); multiple vehicles are allocated without stacking.
- Migration tests prove each affected location is walkable, flags are preserved
  exactly, unrelated/prototype-bearing/malformed saves change only their version,
  and repeated migration is inert.
- Eight Title developer states are available: `arrival`, `city`, `savanna`,
  `ruins`, `choice`, `boss`, `postBoss`, and `complete`. Every profile has all
  five heroes at level 30, the Big-Little Lens, the Royal Thimble, the correct
  five-or-six Ember count, stable ordered prior flags, a safe in-bounds spawn,
  and no preselected `ch6_string` branch.

## Generated artifacts and audits

- `npm run mapeditor:gen`: 62 tiles, 324 props, 225 facades, 10 regions, 96 NPCs,
  21 tracks, 17 areas, 1,299 dialogue ids, and 243 map ids (215 atlas cells).
- `tools/render-map.ts ch6`: `output/maps_ch6.png`, 1186×4232, covering all four
  outdoor maps and Zanzibel units 0–13. Visual review confirmed distinct road
  bands and loops, the winding savanna/side pocket, nonlinear ruin chambers, and
  the separated boss/resonance rooms without clipped map content.
- Strict visual-identity audit: 144/144 enemy identities authored, 0 legacy;
  94 authored battle PNGs remain unregistered inventory and are not a strict
  identity failure.
- Door audit: 243 maps, 0 real stuck landings, 0 real wrong-edge landings, and
  0 non-waived body-box collisions. The 12 reported one-way transitions and two
  frozen-pyramid body-box findings are the existing documented waivers.
- Content validation: 240/243 maps pass static reachability with the existing
  three rotating-pyramid waivers; 241/243 pass encounter pressure with the
  existing two rotor-room waivers. Map-editor generated data is current.
- Focused Chapter 6 regression suite: 5 files, 188/188 tests passed.
- Full suite: 107 files, 1,791/1,791 tests passed.
- Production build: TypeScript, validation, map-editor check, and Vite build all
  passed. Vite retained the existing unresolved full-resolution Jay URL warning
  and large-bundle advisory; neither is introduced by Chapter 6.

## Live runtime QA

The local Vite runtime was loaded through the Title developer route with
`devFullMap=1` at 1600×900 internal resolution (1280×720 viewport):

- `zanzibel` / `city`: full capital, city services, traffic, and safe city spawn
- `savanna_run` / `savanna`: complete clearing chain, branch pool, encounters,
  and safe west entry
- `laughing_ruins` / `choice`: full chamber sequence, encounter population, and
  safe pre-choice spawn
- `sphinx_chin` / `boss`: player staged at the south approach to the lower arena
- `sphinx_chin` / `postBoss`: defeated-state profile staged for the distinct
  northern resonance approach

All five live profiles rendered without browser console errors or warnings. The
initial city pass exposed a wandering-guide animation warning; the guide was made
stationary and the fresh-profile sweep was clean.

## Scope protection

No new Chapter 6 bitmap art was required; the shipped PKG-13 runtime assets were
retained. The pre-existing user changes in `docs/VERIFICATION.md`,
`docs/asset-lists/visual_identity.md`, and all of `tmp/` were deliberately left
unstaged and untouched by this rollout.
