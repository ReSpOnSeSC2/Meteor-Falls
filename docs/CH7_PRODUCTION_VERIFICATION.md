# Chapter 7 production verification

**Chapter:** 7 — *The Cobra's Palace*
**Branch:** `codex/chapter-7-production-rollout`
**Starting commit:** `634fb701` (`Polish opening cutscene and ambient audio`)
**Production date:** 2026-07-13

This record supersedes the compact Chapter 7 scaffold notes and the pre-production
language in PKG-14. The save-facing map IDs remain `chandrapore`, `monsoon_road`,
`night_train`, and `palace_throne`.

Bert and Lucille bring the party to the western railhead; the visibly overloaded
**Tilak Mail** completes the canonical arrival into Chandrapore. Lucille remains
the safe world-network/backtracking link rather than masquerading as the arrival
train.

## World contract

| Map | Final size | Headline spatial signature |
| --- | ---: | --- |
| Chandrapore | 120×88 | A dense three-district knot: looping bazaar lanes, a stepped river-ghat edge, and a cinema/station axis aimed at the distant palace spire. |
| Monsoon Road | 108×68 | A diagonal rain-dark causeway that moves above, beside, across, and briefly into flooded margins before climbing into the rail yard. |
| Night Train | 48×128 | A vertical, car-by-car heist: boarding crowd, luggage/dining inspection, theft, chase, coupling climax, recovery, then the palace threshold. |
| Palace Throne / Royal Vivarium | 88×104 | A processional palace ascent opening into a broad habitat loop, then a separated Cobra arena and post-victory throne resonance. |

`CH7_WORLD` is the single fixed-point registry for dimensions, reciprocal doors,
arrival feet, story rectangles, quest anchors, recovery points, vehicle parking,
migration, and developer profiles. `CHANDRAPORE_LANDING` remains the compatibility
export for flight/travel callers. All four builders are deterministic.

The schematic review sheet is `output/maps_ch7.png` (1186×5064). It contains all
four maps and every live generated interior, `chandrapore_unit_0` through
`chandrapore_unit_17`. Original-resolution review confirmed the three city
districts, diagonal water route, train-car rhythm, palace escalation, door markers,
and all 18 interiors; no clipped review cells or omitted live units were found.

## City art, tenancy, and services

Chandrapore now has 14 supported source facades and 18 live generated units. The
first five source positions preserve the historical occupancy contract:

1. Hillcrest Manor → `chandrapore_unit_0`
2. Moon Gate Realty → `chandrapore_unit_1`
3. Civic Hall → locked
4. Monsoon Motor Gallery → `chandrapore_unit_2`
5. The Silver Parasol → `chandrapore_unit_3`

The original service roles remain the home host, realtor, vehicle dealer, and hotel
clerk. Grand Bazaar retail, filling station, and the featured `drop_top` dealership
vehicle remain live. New tenancy is appended after the historical sequence.

Fourteen original authored source PNGs (256×192) and fourteen explicit authored
city-scale PNGs were added. Ordinary variants are 264×880; Civic Hall, Silver
Parasol, Majestic Cinema, and Chandrapore Station are 264×1200 landmarks. The
closed-world allowlist in `src/spritegen/authored.ts` prevents these keys from
falling back to procedural formal-city art. The 288×776
`prop_chandrapore_palace_spire` is registered at a 72×194 native display footprint.
All source masters are retained under `assets/art/masters/world/`.

## Story, Locket, and cutscenes

The full seven-panel `ch7_journey` gallery remains in canonical order. Runtime uses
the contextual cuts `ch7_train_in`, `ch7_bazaar`, `ch7_heist`, `ch7_palace`,
`ch7_raja`, `ch7_heartlight`, and `ch7_cinema`, so arrival cannot spoil later beats.

The Locket state is explicit: the Chandrapore setup leads to the train theft;
`ch7_locket_stolen` makes the Star Locket unavailable without deleting or
duplicating it; chase and coupling beats precede `ch7_locket_recovered`; the palace
door is unavailable until recovery. Mid-heist saves retain the stolen state.
Completed Chapter 7 saves normalize to exactly one available Star Locket.

The heist fallback first establishes the southern bazaar context, and the Monsoon
Road threshold requires `ch7_heist_seen`; its locked/open signs are mutually
exclusive. The transition is evaluated every frame, so completing the heist opens
the route immediately without a map reload. Locket loss also gates the pause-menu
page, Held Breath/echo use, Pray refill, and throne resonance while the physical
key-item record remains intact.

Palace order is reveal → Raja reveal → battle → `cobra_raja_defeated` → safe
post-battle restart → throne approach → `ch7_heartlight_seen` → `ember7` →
`ch7_complete`. Early resonance interaction is retryable and cannot consume the
completion beat. Completion assigns the Ember count to exactly seven. Five
one-shot restored-king reactions play before, never instead of, the regional quest
state machines; palace signage also switches cleanly across the victory state.

## Quest contract

Chapter 7 has exactly five regional quests, each with permanent local footprints,
retry-safe completion, one reward, and one caller ledger entry:

| Quest | Flow | Reward / caller |
| --- | --- | --- |
| Seven Spices | start → seven bazaar finds → gather → return | `spice_box`; Spice Merchant heal 700 |
| The Monkey Who Stole Tuesday | start → rooftop chase → cinema-roof corner | `monkey_paw_charm`; Monkey Magnate damage 690 |
| The Last Showing | repair projector → watch final reel → report | `cinema_stub`; Majestic Usher heal 680 |
| Third-Class Rules | inspect signal/coupling/brake → report | `star_pendant`; Stationmaster damage 710 |
| The River Remembers | follow three ghat marks → recover/return brass boat | `brass_elephant`; Ghat Elder heal 720 |

The Ghat Elder deliberately reuses the already-authored `oldTimer` 46-frame sheet;
the four chapter-specific NPC sheets remain `cp_spice_merchant`, `cp_dabbawala`,
`cp_stationmaster`, and `cp_usher`.

## Boss and encounter contract

Cobra Raja remains level 35 with exactly 20,000 HP, no elemental weakness, fire
resistance, mind immunity, party-wide two-turn Paralysis every third turn, and one
800-HP skin shed at the 40% threshold. Victory is normal HP victory and wakes the
real king. The focused regular roster remains `rickshaw_swarm` (3,000 HP),
`spice_djinn` (2,000), `temple_macaque` (2,400), and `naga_sentry` (5,000).
Enemy bases and matching minis are visually distinct authored assets; existing wear
derivatives retain the stable tier keys. Three strategically separated recovery
points support city, road, and train/pre-palace pacing, and chapter spawners retire
after the boss. Grand Bazaar stock includes Antivenom Vials and Rosewater Drops for
Paralysis recovery as well as Clarified Ghee and Turmeric Draught for the level-35
economy.

## Save v24 and developer profiles

Save version 24 recovers legacy Chapter 7 coordinates through `CH7_WORLD` for the
four exterior/dungeon maps and all `chandrapore_unit_N` interiors. It preserves
party, inventory, economy, callers, quests, story flags, and vehicle ownership;
parked/active vehicles recover to the Chandrapore vehicle bay. The migration keeps
a valid mid-heist theft and normalizes only clearly completed saves to Locket
recovered. Unrelated saves receive only the version bump and future versions remain
rejected.

TitleScene supports `arrival`, `city`, `theft`, `train`, `recovered`, `palace`,
`boss`, `postBoss`, and `complete`, all derived from `CH7_MAP_IDS` and `CH7_WORLD`.
Profiles carry all five heroes, six prior Embers (seven only for `complete`), a
representative Chapter 7 level, coherent key items, and safe map-specific feet.

## Art inventory and generation record

Reused and retained: four Chapter 7 NPC sheets and animation masters; seven 1600×900
cinematic panels and masters; night-train vehicle; Cobra Palace battle background;
Cobra Flute weapon/icon; four regular enemy base/wear/mini sets; Cobra Raja
base/wear/mini set.

New: four original 1536×1024 Chandrapore image-generation master banks and their
keyed derivatives; 14 source facades; 14 authored promoted facades; the palace-spire
prop. Generation used the built-in image generation tool in new-image mode, followed
by the imagegen skill's chroma-key helper and deterministic authored-storey export.
No frozen procedural generator was extended.

## Verification evidence

- Map editor generation: **pass** — 62 tiles, 325 props, 263 facades, 10 regions,
  96 NPCs, 21 tracks, 17 areas, 1,373 dialogue IDs, 257 maps; 127 handled / 126 used
  triggers.
- Content validation: **pass, exit 0** — 257 maps, 34 quests, 1,373 dialogue
  scripts, generated editor data current, and zero non-waived body-blocked doors.
- Authored asset contract: **pass** — `authored_assets.test.ts`, 18/18.
- Formal-city scale contract: **pass** — `formal_city_scale.test.ts`, 29/29.
- Focused Chapter 7 contracts: **pass** — 11 files, 333/333 tests across map,
  cutscene, story/Locket, echo, quest, boss, migration, profile, overworld, facade,
  and authored-asset coverage.
- Full test suite: **pass, exit 0** — 110/110 files, 1,858/1,858 tests.
- Strict visual identity: **pass** — 144/144 authored, 0 legacy; 94 dormant
  unregistered battle PNGs remain outside current runtime identity.
- Enemy frame registry: 147/147 fully wired, 0 partial/procedural (focused audit).
- Character animation strict gate: **required gate exception, not green** — the
  inherited repository-wide baseline remains **38/97 clean, 0 errors, 263 warnings,
  82 review hints, exit 1**. Chapter 7 adds no new sheet to that set, and the
  validator and its thresholds were not weakened. This is a release waiver, not
  optional Chapter 7 polish.
- Balance simulation: **pass, exit 0** — Cobra Raja remains exactly 20,000 HP at
  level 35; the conservative no-gear table reports TTK 4 before the scripted gaze,
  defense/recovery turns, and one-time skin shed extend the played encounter.
- Production build: **pass, exit 0** — TypeScript, validation, and Vite completed;
  1,050 modules transformed and the production bundle built in 7.50 seconds. The
  accepted Jay full-resolution URL and large-chunk advisories remain.
- Chapter renderer: **pass, exit 0** — `output/maps_ch7.png`, 1186×5064.
- Facade visual QA: `output/ch7_chandrapore_facades_contact.png`; 14/14 unique,
  clean alpha, readable entrances, aligned authored storey bands.
- Map visual QA: `output/maps_ch7.png`; inspected at original resolution.
- Live QA: in-app browser profiles covered arrival, normal city, theft, train,
  recovered, palace, boss setup, post-boss, and complete. The Tilak Mail arrival,
  contextual train chase, follower movement, keyboard input, touch MENU control,
  cinematic skip, and state-specific spawn landings were exercised. Settled frames
  showed aligned entrances, readable city facades, distinct train cars, and stable
  palace/recovery states. Controller hardware was unavailable. Automated contracts
  cover mid-heist save/load and death recovery, full-inventory quest retries,
  reciprocal doors, post-completion travel, and gamepad mappings.

Existing accepted warnings are the optional Jay full-resolution URL, Vite
large-chunk advisory, documented rotating-pyramid reachability waivers, documented
intentional one-way links, and the separately identified required animation-gate
waiver above.

Protected user files `docs/VERIFICATION.md`,
`docs/asset-lists/visual_identity.md`, and repository `tmp/` are outside this
production record and must remain unstaged.
