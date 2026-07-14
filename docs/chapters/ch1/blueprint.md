# Chapter 1 production blueprint — The Night It Fell

This is the durable production contract for the Chapter 1 polish pass. It
supersedes stale inventory prose and the compact manifest map list wherever
they disagree with executable code. The source at the start of this pass is
`bd50dcab685733c67c1119eafcd89bc71453559e`.

> Status (2026-07-14): audit frozen; implementation and the exact final gate
> sequence complete; literal staging and the requested no-push commit remain.

## Executable canon

- Chapter 1, USA, target level 8, Heartlight/Ember 1.
- Opening settlement: Otterbrook. Secondary city: Brickton.
- Route: Meadow Mile, Whisperwood, Far Meadow, and the Overpass.
- Dungeon: Department of Smiles (`dos_f1`, `dos_f2`, `dos_f3`).
- Boss: Titanic Tick, exactly 200 HP and level 7, met on the raised meteor
  mound in the final Hickory Hill cave arena (`oak_heart`). The outdoor Heart
  Oak/Pond Park placement and the 150-HP and 40–60-HP historical plans are not
  executable canon.
- Five regional quests, in manifest order: `biscuit_come_home`,
  `mail_must_move`, `lemonade_empire`, `arcade_legend`, and
  `walkers_register`.
- The four world phases are `meteor-night`, `hush-morning`, `restored-day`, and
  `chapter-complete`. They derive from durable story state rather than local
  time-of-day guesses.
- The mandatory Hush-morning key route is Pemberton -> Hodgkin -> the
  request-gated runaway mower -> the shared Trail Key -> the walk-through shed
  -> `oak_roots` -> `oak_hollow` -> `oak_heart` -> Titanic Tick. These are
  durable route frontiers, not optional flavor or a direct bedroom-to-boss
  shortcut.

## Canonical playable roster

Runtime closure was evaluated after map growth, door re-aiming, occupancy
generation, and formal-city promotion. Chapter 1 owns exactly 81 playable map
IDs. Every ID below must appear exactly once in final map evidence.

### World and routes (12)

| ID | Tiles | Spatial signature |
| --- | ---: | --- |
| `otterbrook` | 112×198 | Six-elevation unified town and hill, meteor route, restored civic grid, hotels, annexes, and southern road. |
| `oak_roots` | 36×52 | North/south stone-and-root descent and branching cave approach. |
| `oak_hollow` | 30×26 | Still-pool breather chamber and final cave approach. |
| `oak_heart` | 28×30 | Raised meteor-mound Titanic Tick cave arena and separate post-fight return lane. |
| `meadow_mile` | 16×40 | First narrow road leg with clear end mouths. |
| `meadow_woods` | 16×36 | Screened forest leg with orientation pressure. |
| `meadow_far` | 16×38 | Open meadow leg and readable north/south continuation. |
| `meadow_overpass` | 16×34 | Final road leg and Brickton boundary. |
| `bus_interior` | 22×9 | Handler-entered 6:15 transit scene; not door-closure discoverable. |
| `brickton` | 104×84 | Secondary city, bus arrival, Department district, hospital, civic and commercial routes. |
| `cage_park` | 26×22 | Exterior basketball approach and optional park activity. |
| `the_cage` | 40×30 | Standalone basketball court. |

### Otterbrook homes and annexes (13)

`rex_home` 14×10; `rex_hall` 16×7; `rex_bedroom` 16×11;
`ana_room` 16×11; `vivi_room` 16×11; `chad_home` 16×11;
`otter_home_sodd` 16×11; `otter_home_birch` 16×11;
`otter_home_pond` 16×11; `maple27_int` 16×11; `oldman_int` 16×11;
`workshop_int` 18×11; `trail_shed_int` 14×12.

### Otterbrook public interiors (19)

`bus_depot_int` 19×13; `otterbrook_cityhall` 26×16;
`otter_station` 24×16; `otter_clinic_int` 16×11;
`otter_clinic_exam` 12×9; `diner_int` 16×11; `diner_kitchen` 16×11;
`burger_int` 16×11; `bank_int` 16×11; `bank_vault` 14×10;
`hardware_int` 16×11; `hardware_stockroom` 16×11; `bakery_int` 16×11;
`drugstore_int` 16×11; `drugstore_pharmacy` 16×11;
`arcade_int` 16×11; `arcade_service` 16×11; `realty_int` 16×11;
`chapel_int` 16×11.

### Otterbrook hotel and generated units (15)

`otter_hotel_lobby` 18×12; `otter_hotel_hall` 22×10;
`otter_hotel_room_201`, `_202`, and `_203`, each 12×9;
`otterbrook_unit_0` 13×13; `_1` 15×13; `_2` 13×15; `_3` 13×13;
`_4` 15×13; `_5` 20×9; `_6` 13×13; `_7` 15×13; `_8` 15×13;
`_9` 15×13.

### Brickton public interiors and generated lots (19)

`twoton_hotel_lobby` 20×12; `twoton_hotel_hall` 20×10;
`twoton_hotel_room` 12×9; `hospital_int`, `hospital_f2`, and `hospital_f3`,
each 20×12; `twoton_community_center` 22×14;
`twoton_bus_station` 21×13; `starmart_int` 17×11; `arcade2_int` 16×11;
`twoton_theater` 24×16; `twoton_bike_shop` 18×12;
`twoton_pizza` 20×14; `brickton_lot_5700_725` 13×13;
`brickton_lot_1500_5025` 11×9; `brickton_lot_7100_5025` 15×9;
`brickton_lot_5100_6325` 13×13; `brickton_lot_5900_6225` 13×15;
`brickton_lot_6700_6325` 11×13.

### Department of Smiles (3)

`dos_f1` 40×26; `dos_f2` 48×32; `dos_f3` 42×28.

### Explicit exclusions and compatibility

- `brickton_docks` (30×18) is the Chapter 2 boundary. It can be physically
  entered before Chapter 1 completion, but its onward departure remains
  Chapter-2-gated. It is owned and rendered by Chapter 2 and is not counted
  twice. The pre-completion traversal surface is therefore
  82 physical maps (81 Chapter 1-owned maps plus this explicit Chapter 2 edge),
  while Chapter 1 evidence and ownership remain exactly 81.
- `downtown_otterbrook` (28×16) has no inbound live edge. Its hardware, diner,
  and clinic exits already return to unified Otterbrook. Reconnecting it would
  duplicate venues and preserve asymmetric fiction, so it is retired.
- `hill_road`, `hickory_trail`, `whisperwood_rise`, and `hickory_hill` are
  retired pre-unification IDs. Published saves containing any retired ID are
  recovered deterministically to a body-safe unified-Otterbrook anchor.
- This geometry/map-ID recovery is a persisted compatibility change, so the
  pass uses save version 27. The migration must recurse through Held Breath,
  be idempotent, reject future versions, and preserve unrelated state exactly.

## World fixed-point contract

`src/data/maps_ch1.ts` owns the stable Chapter 1 map roster and fixed points.
The registry must cover dimensions, every route mouth and landing, recovery and
migration feet, story rectangles, quest-giver/objective feet, bus anchors,
parking anchors, and every named developer-profile spawn. Values are native
tiles and convert to runtime player feet in one helper.

Exhaustive real-body validation rejected the old preview feet because they can
overlap the retired downtown transition. The compatibility recovery anchor is
tile `{x:56,y:100,facing:'down'}`, serialized as native player feet
`{x:904,y:1612}`. No migration may retain arbitrary coordinates from a retired
map ID.

Known placement repairs are production requirements:

- Ana and Vivi move out of the Rex-house body onto a visible lemonade apron
  with a stand/sign and normal interaction reach.
- `pajama_kid` moves out of the promoted Otterbrook hotel body.
- `pigeon_kid` moves out of Brickton's promoted arcade/STARPORT facade.
- Mail objectives become instance/door-ID specific; repeated `house_a`,
  `house_b`, or `arcade` sprite identities cannot satisfy named addresses.
- Every NPC, sign, recovery, trigger, spawner, door, and prop door is swept in
  all four phases against live facade/prop solids and the real player body.

Implemented facade-scale evidence is measured from the 47 distinct physical
Otterbrook facades after collapsing open/closed story-state twins. Facade
height relative to Jay is 3.104 minimum, 3.844 mean, 3.75 median, and 5.31
maximum; the residential home family stays in the narrower 3.6-3.9 Jay-height
band. `src/data/maps_otterbrook.test.ts` owns the executable scale contract;
these are measured placement results, not source-texture dimensions.

## Story chronology and restart semantics

The player chronology is fixed:

1. New Game and authored meteor cinema.
2. House overview, hill climb, bedroom wake, first agency.
3. Mom/Chad and the crater approach.
4. Glint meeting, Star Locket, Hush Sentinel, walk home.
5. Porch/zapper event, Glint's Spark, awakening, sleep.
6. Hush morning: Pemberton → Hodgkin's mower request → shared Trail Key →
   locked/open walk-through shed → rear breach → `oak_roots` → `oak_hollow`
   recovery/save → Titanic Tick in `oak_heart`.
7. Restored Otterbrook and all five regional quests.
8. Four meadow/orientation legs, bus, and Brickton.
9. Department F1/F2/F3 quotas, Faye join, Manager.
10. Mom's ringing payphone, First Heartlight, Ember 1, chapter card.
11. Pre-completion docks-boundary inspection, then post-chapter backtracking.

Every long beat uses a one-stage-at-a-time planner. Durable effects commit
before optional presentation, while presentation has its own pending/seen
state. A restart resumes the next missing stage rather than replaying rewards or
skipping payloads. Trigger contact is serialized. All scene methods release
`cut`, input locks, camera ownership, tweens, listeners, temporary sprites,
pause, and touch latches through terminal cleanup.

Critical transactions are exact:

- Star Locket and Glint's Spark are unique. A full leader bag must deliver to
  another eligible party bag or leave an explicit durable retry; completion
  cannot imply delivery.
- Sentinel outcome, walk-home state, and its one reward cannot be separated by
  an interrupted scene return.
- The mower request controls patrol existence; its victory, Hodgkin's shared
  Trail Key, the shed crossing, and cave threshold are separate durable facts.
  A full bag cannot block the key, and the shed's $60/Choco-Comet cache remains
  wholly pending until a bag slot exists.
- Tick victory, Ember presentation, `ember1`, and the monotonic Ember scalar are
  separate resumable stages; replay cannot duplicate EXP or lower Embers.
- Faye appears once. Her Hand-Me-Down Pan exists once, is in her bag, and is
  equipped in the intended slot before the join transaction is complete.
- Manager victory commits once and its presentation resumes without replaying
  battle rewards.
- Mom call, First Heartlight awakening/panel, Ember 1, `ch1_complete`, and the
  chapter card are individually recoverable. `ch1_complete` does not suppress a
  pending Heartlight or card.

## Quest contract

All five quests remain visible and reachable after Tick and after Chapter 1.
Each supports not-started, active, partial, ready, full-bag retry, successful
turn-in, repeat interaction, save/reload, defeat/retry, and exact one-time
reward/Caller behavior.

`lemonade_empire` owns the repaired twins/stand footprint. `mail_must_move`
targets named physical doors, never a reused facade sprite key. Arcade Legend
must exercise the actual arcade scene/score path, and Walkers Register must use
its current named route objects rather than historical prose.

## Combat contracts

- Hush Sentinel: 240 HP; turn 2 Old Light once; Hushed on its cadence; Glint
  supplies most damage and prevents lethal party damage; Sentinel cannot fall
  below 1 before the scripted turn-5 repel; no ordinary kill/loot path; success,
  defeat, retry, teardown, and event-listener cleanup are exact.
- Titanic Tick: 200 HP, level 7; latch precedes drain; attached targets suppress
  re-latch; Fire and Salt sever; downed heroes are not valid drain targets;
  victory, defeat, flee, retry, and teardown clear all battle-local tether state.
- Manager: The Suit plus Blazer Smiler; the PRAY tutorial runs through real
  BattleScene orchestration; victory/defeat and presentation cleanup are direct
  runtime tests.
- Constable Borden and representative regulars retain authored encounter rules.
  Declared world tells are either implemented or rewritten to match actual
  spawners; comments are not evidence.

## Developer profile matrix

Exactly 57 named profiles create real, serializable level-band states at
registry feet, including direct BattleScene launch contexts. The first 45 are
the critical chronology matrix:

- Opening/night: `openingStart`, `openingAfterFall`, `houseOverview`,
  `hillClimb`, `bedroomWake`, `preSentinel`, `sentinelTurn2`, `sentinelTurn5`,
  `postSentinel`, `walkHome`, `porchPending`, `porchRewardPending`,
  `porchComplete`.
- Morning/cave: `hushMorning`, `preTick`, `tickBattle`, `postTick`,
  `restoredOtterbrook`.
- Travel: `meadowLeg1` through `meadowLeg4`, `orientation0` through
  `orientation3`, `orientationComplete`, `busGrandfather`, `bricktonArrival`.
- Department: `dosF1`, `dosF1Quota`, `dosF2`, `dosF2Quota`, `dosF3`,
  `dosF3BossPending`, `dosComplete`.
- Party/close: `preFaye`, `fayeFullBag`, `postFaye`, `preManager`,
  `managerBattle`, `postManager`, `momCallPending`, `heartlightPending`,
  `chapterComplete`.
- Seven hazards: `porchFullBag`, `leaderDown`, `partialParty`, `defeatRetry`,
  `staleLegacyFlags`, `retiredLegacyMap`, and `touchMode`.
- Five quest frontiers: `questBiscuit`, `questMail`, `questLemonade`,
  `questArcade`, and `questWalkers`.

Each profile pins flags, party, bags/equipment, item uniqueness, money/level,
Embers, map/feet/facing, phase, impossible earlier triggers, ambience, and
round-trip serialization.

## Art inventory and decisions

| Family | Decision |
| --- | --- |
| Waiting bench | Repair visible magenta stripe; preserve form/palette and create retained provenance. |
| Ward bed | Repair magenta/purple edge and seam residue; verify alpha on contrasting backgrounds. |
| Titanic Tick reveal | A new Hickory Hill cave-arena panel and retained source are wired to the `oak_heart` consumer; native and exact-viewport crop contacts are accepted. |
| Mom payphone call | A new Brickton payphone panel and retained source serve the post-Manager Jay/Mia/Mom beat; native and exact-viewport crop contacts are accepted. |
| First Heartlight | A new Jay/Mia/Star-Locket panel and retained source serve the staged ordinary-play consumer; native and exact-viewport crop contacts are accepted. |
| Story phases | Contact 23 contains accepted, real 1600x900 runtime captures for `meteor-night`, `hush-morning`, and `restored-day`; the generator rejects missing phase sources rather than tinting a still. |
| Ch1 registry panels | Classify loaded, selected, displayed, conditions, and crop; registry/gallery-only art is labeled honestly. |
| Expanded enemies | Preserve good base/wear/8-dir art; replace unrelated mini fallbacks and produce a complete native-detail contact. |
| Borden/Realtor/Waitress | Completed authored 46-frame, 384x1536 runtime/master sheets with grounded pose changes and native review contacts. Deterministic hashes live in `assets/art/masters/generated/ch1-expanded/npc-walk-atlas-provenance.json`; use the named `ch1:npc:*` scripts or `npm run ch1:npcs:walks` to rebuild them. |
| `.bak.png` tiles | Keep if inert and provenance-only; remove from runtime ambiguity only with concrete bundle/registry evidence. |

Accepted raster changes use the ChatGPT image-generation workflow for authored
content, retain a named master/source, produce the correct runtime derivative,
and pass dimension, alpha, identity, direction, wear, registry, crop, and
live-context checks. Exploratory candidates and `_baseline` evidence are not
committed.

## UI, input, audio, and performance acceptance

- Dialogue, battle, and cinematic touch layouts are explicit at 390×844 and
  844×390. Controls cannot cover text, prompts, choices, status, or enemy info;
  hiding controls clears every held touch role.
- Gamepad polling reconciles pads already connected before reload, missing
  browser connect events, fallback pads, multiple pads, and disconnects with
  the touch-visibility state. Rebinding cannot create duplicate physical
  bindings after reload or leave a displaced action empty.
- Audio runs only while unmuted, document-visible, and native-focused. Unlock,
  visibility, native focus, battle return, flee/defeat, and scene restart do not
  stack tracks, retain muffle, or leave silence.
- Opening timing is measured from New Game through first agency. Caption skips
  do not terminate required camera/player movement. Rapid/held input, focus
  loss, and 60/120/144-Hz delta simulation are covered.
- Unified Otterbrook is profiled for stable depth, collision, follower travel,
  and no jitter at all critical stairs/elevation seams.

## Automated and live acceptance

The focused command names every relevant existing and new Chapter 1 suite.
Scene behavior is tested through actual runtime methods with controlled timers,
tweens, and event cleanup. Static validation is paired with phase-aware
real-body traversal.

Live close runs New Game through completion and backtracking at 1280×720,
390×844, and 844×390 with keyboard, touch, remapped input, automated controller
mappings, hazardous full-bag/defeat/retry paths, focus loss, save/continue, all
doors, Sentinel, Tick, Manager, and a fresh settled console. Physical controller
hardware is claimed only if present.

## Non-goals

- No speculative Chapter 1 rewrite, new regional quest, whole-roster art
  regeneration, global balance rewrite, or weakening of strict gates.
- No duplicate Chapter 2 docks evidence and no resurrection of retired climb
  maps or orphan downtown fiction.
- No push, merge, history rewrite, primary-checkout cleanup, or modification of
  protected primary documentation.
