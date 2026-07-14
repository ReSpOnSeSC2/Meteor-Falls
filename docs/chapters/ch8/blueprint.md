# Chapter 8 production blueprint — The Paper Dragon

Status: frozen implementation contract for ADR-143. This document records the
production decisions made before implementation. The attached Chapter 8 rollout
request is newer than stale planning text in the Game Bible; in particular, this
chapter ships four regular enemies plus Paper Dragon, not the obsolete twenty-
enemy planning roster.

## Stable roster and route

```text
CH8_MAP_IDS = [
  'lotus_harbor',
  'bamboo_road',
  'spore_forest',
  'mt_shu_temple',
]

riverboat → Lotus Harbor ⇄ Bamboo Road ⇄ Spore Forest ⇄ Mt. Shu Temple
```

All coordinates below are native tile coordinates. Pixel landings are derived in
one place with `nativeFeet({x, y}) = {x: x * 16 + 8, y: y * 16 + 12}`. Maps,
OverworldScene, migrations, profiles, and tests must consume `CH8_WORLD`; they
must not repeat these literals.

## CH8_WORLD fixed-point contract

### Lotus Harbor — 112 × 80

- Signature: a crescent working harbor that fans upward from the river ghats,
  through lantern-market lanes, to a painted-gate civic and temple terrace.
- Regions: west riverboat quay; south working ghats; central lantern market and
  tea lanes; east civic/temple terrace; northeast road/Yak interchange.
- Traversal: three curved terrace routes, two cross-lanes, and a quay loop. The
  river remains visible from arrival, market bridge, and civic approach.
- Landmarks: riverboat, Grand Market, painted gate, temple, pagoda, theater.
- Optional reward branch: the quay warehouse/old ferry steps hide a jade cache.
- Set pieces: riverboat arrival; Trust/Clicker setup; harbor economy quest.
- Palette/props: lacquer red, jade, gold leaf, cyan river, paper lanterns,
  bamboo awnings, tea tables, mooring posts, painted gates, working crates.
- Collision: three-tile main lanes, four-tile plaza mouths, clear facade
  doorsteps, no decorative false doors, and a body-clear edge mouth.
- Fixed points:
  - `arrival.riverboat = {x: 14, y: 68, facing: 'up'}`
  - `arrival.city = {x: 50, y: 56, facing: 'up'}`
  - `transition.bamboo.mouth = {x: 109, y: 44, w: 3, h: 4}`
  - `transition.bamboo.landing = {x: 3, y: 51, facing: 'right'}`
  - `story.arrival = {x: 10, y: 64, w: 12, h: 8}`
  - `story.orientation = {x: 39, y: 52, w: 18, h: 10}`
  - `story.trustSetup = {x: 61, y: 43, w: 12, h: 8}`
  - `story.clickerSetup = {x: 78, y: 55, w: 10, h: 8}`
  - `quest.calligrapher = {x: 47, y: 45}`
  - `quest.lanternGirl = {x: 37, y: 55}`
  - `quest.teaMonk = {x: 55, y: 50}`
  - `quest.harborMaster = {x: 29, y: 62}`
  - `quest.yakHandler = {x: 91, y: 45}`
  - `quest.lanternFolds = [{x: 26,y: 66}, {x: 39,y: 55}, {x: 70,y: 39}]`
  - `quest.harborWeights = [{x: 23,y: 65}, {x: 57,y: 63}]`
  - `recovery = {x: 53, y: 57, facing: 'down'}`
  - `vehicleBay = {x: 87, y: 65, w: 10, h: 7}`
  - `riverboat = {x: 8, y: 70}`
  - `dock = {x: 19, y: 68}`
  - `migration = {x: 50, y: 58, facing: 'down'}`
  - `profiles.arrival = arrival.riverboat`
  - `profiles.city = arrival.city`

### Bamboo Road — 104 × 64

- Signature: a braided river-to-mountain ascent of switchbacks, bamboo wind
  corridors, lock pools, and the Yak Express staging spur—not a horizontal road.
- Regions: Lotus gate; lower river braid; public lock and barge; mid-road rest
  grove; upper switchbacks; Yak depot; Spore Forest gate.
- Traversal: two braids reconnect at the lock, split around water pockets, then
  climb via three switchbacks. No corridor is the only visual read.
- Landmarks: red lock gate, runaway barge, moon bridge, rest pavilion, Yak dish.
- Optional reward: a river-islet cache reached after the barge clears.
- Set pieces: barge crisis, public Clicker clearing, visible cleared lock state.
- Palette/props: bamboo green, wet slate, turquoise pools, red lock machinery,
  wind ribbons, trail stones, barge gear, Yak feed sacks.
- Collision: main route ≥3 tiles, bends ≥4 tiles, door/landing and recovery grace
  zones free of encounters; water pockets cannot pinch followers.
- Fixed points:
  - `transition.lotus.mouth = {x: 0, y: 49, w: 3, h: 4}`
  - `transition.lotus.landing = {x: 108, y: 46, facing: 'left'}`
  - `transition.spore.mouth = {x: 91, y: 0, w: 6, h: 3}`
  - `transition.spore.landing = {x: 44, y: 100, facing: 'up'}`
  - `story.bargeCrisis = {x: 24, y: 40, w: 18, h: 12}`
  - `story.clickerClearing = {x: 28, y: 43, w: 11, h: 7}`
  - `story.trustEscalation = {x: 48, y: 31, w: 10, h: 8}`
  - `quest.yakFeed = {x: 88, y: 12}`
  - `quest.yakWater = {x: 72, y: 25}`
  - `recovery = {x: 62, y: 34, facing: 'up'}`
  - `yakDepot = {x: 89, y: 10}`
  - `barge = {x: 33, y: 46}`
  - `migration = {x: 8, y: 51, facing: 'right'}`
  - `profiles.barge = {x: 21, y: 47, facing: 'right'}`

### Spore Forest — 88 × 104

- Signature: an asymmetric fungal forest of organic loops whose route becomes
  legible through safe pockets, cap silhouettes, kiln smoke, and learned shortcuts.
- Regions: clean trailhead; low-cap loop; kiln basin; three spore belts; central
  hollow; upper safe pocket; Yak pickup ledge.
- Traversal: one winding trunk with three reconnecting loops and two shortcuts.
  Every hazard has a clean-margin retreat to a safe pocket and ultimately the
  south exit.
- Landmarks: blue-white kiln, giant crescent cap, paper-fold grove, red-cap arch,
  Yak bell platform.
- Optional reward: kiln cache after the Porcelain Warlord encounter.
- Set pieces: forest scramble/tutorial; first real Mushroomized exposure; three
  brush recoveries; Pippa’s false-crease observation; Yak departure.
- Palette/props: violet loam, cyan and amber caps, porcelain blue-white, drifting
  spores, folded paper caught in roots, bamboo trail markers.
- Collision: organic walls but ≥3-tile mandatory paths; follower-safe pockets;
  no encounter within four tiles of transitions, cures, or recovery.
- Fixed points:
  - `transition.bamboo.mouth = {x: 40, y: 101, w: 8, h: 3}`
  - `transition.bamboo.landing = {x: 94, y: 4, facing: 'down'}`
  - `transition.temple.mouth = {x: 40, y: 0, w: 8, h: 3}`
  - `transition.temple.landing = {x: 48, y: 98, facing: 'up'}`
  - `story.scramble = {x: 38, y: 87, w: 12, h: 7}`
  - `story.trustEscalation = {x: 35, y: 47, w: 12, h: 8}`
  - `story.pippaCreases = {x: 35, y: 30, w: 12, h: 8}`
  - `hazards = [{id:'mushroomize_0',rect:{x:29,y:80,w:17,h:9},phase:0},
    {id:'mushroomize_1',rect:{x:47,y:49,w:16,h:12},phase:1},
    {id:'mushroomize_2',rect:{x:23,y:22,w:18,h:11},phase:2}]`
  - `safePockets = [{x:17,y:87}, {x:17,y:69}, {x:58,y:65},
    {x:27,y:42}, {x:57,y:17}]`
  - `safeExits = [{x:44,y:97}, {x:17,y:76}, {x:58,y:68}, {x:27,y:37}]`
  - `quest.brushes = [{id:'river',x:61,y:85,flag:'q_brush_river'},
    {id:'kiln',x:19,y:55,flag:'q_brush_kiln'},
    {id:'cloud',x:58,y:25,flag:'q_brush_cloud'}]`
  - `kiln = {x: 67, y: 42}`
  - `recovery = {x: 17, y: 70, facing: 'up'}`
  - `yakPickup = {x: 44, y: 7}`
  - `migration = {x: 44, y: 96, facing: 'up'}`
  - `profiles.mushroomized = {x: 34,y:84,facing:'right'}`
  - `profiles.forestCured = recovery`
  - `profiles.brushes = {x: 54,y:28,facing:'right'}`
  - `profiles.yak = {x: 44,y:8,facing:'up'}`

### Mt. Shu Temple — 96 × 104

- Signature: a processional folded ascent through stepped courts and guardian
  halls, into a Dragon bell court, then a separately framed resonance approach.
- Regions: Yak terrace; lower court; guardian hall; false-fold gallery; elder’s
  teaching court; recovery court; Dragon arena; gated bell stair; resonance court.
- Traversal: alternating left/right stairs read like an opened paper fold. The
  boss arena lies below a post-boss-only bell stair; resonance never overlaps it.
- Landmarks: Yak dish, four guardian screens, elder’s ink stone, ash court,
  Dragon frame, great bell, Heartlight ring.
- Optional reward: a hidden guardian crease exposes a jade salamander cache.
- Set pieces: Yak arrival; false-fold reveal; Trust climax/resolution; Teleport
  Beta lesson; Paper Dragon reveal/fight; separately approached bell resonance.
- Palette/props: cloud white, cinnabar, soot black, muted gold, rice-paper screens,
  blue roof tile, bells, ink stones, charred folds after victory.
- Collision: processional lanes ≥4 tiles; fair recovery before trigger; boss
  restart clear of trigger; bell is unreachable until the victory flag.
- Fixed points:
  - `transition.spore.mouth = {x: 44, y: 101, w: 8, h: 3}`
  - `transition.spore.landing = {x: 44, y: 4, facing: 'down'}`
  - `yakArrival = {x: 48, y: 94, facing: 'up'}`
  - `story.falseFolds = {x: 31, y: 64, w: 34, h: 11}`
  - `story.trustClimax = {x: 35, y: 55, w: 26, h: 8}`
  - `story.elderBeta = {x: 41, y: 45, w: 14, h: 7}`
  - `story.paperDragon = {x: 39, y: 27, w: 18, h: 7}`
  - `bossArena = {x: 29, y: 19, w: 38, h: 17}`
  - `bossRestart = {x: 48, y: 39, facing: 'up'}`
  - `earlyBell = {x: 40, y: 12, w: 16, h: 5}`
  - `resonanceApproach = {x: 48, y: 9, facing: 'up'}`
  - `resonance = {x: 41, y: 4, w: 14, h: 6}`
  - `quest.emptyChair = {x: 70, y: 54}`
  - `recovery = {x: 48, y: 40, facing: 'up'}`
  - `migration = {x: 48, y: 96, facing: 'up'}`
  - `profiles.temple = {x: 48,y:72,facing:'up'}`
  - `profiles.boss = bossRestart`
  - `profiles.postBoss = bossRestart`
  - `profiles.complete = resonanceApproach`

Chapter recovery distribution is exactly Lotus Harbor, Spore Forest, and Mt. Shu
Temple. Bamboo Road’s pavilion is a rest landmark but not a fourth chapter-level
recovery registration.

## Historical Lotus Harbor tenancy and facade art

The first four unlocked occupancy candidates are pinned before any new tenancy:

1. lantern shop → `lotus_harbor_unit_0`, `LOTUS HARBOR HOMES`, realtor
2. tea house → `lotus_harbor_unit_1`, `OPEN HOUSE — LOTUS ROW TOWNHOUSE`, home host
3. temple → `lotus_harbor_unit_2`, `NEON CRANE AUTO SALON`, dealer
4. tea house → `lotus_harbor_unit_3`, `LOTUS LANTERN HOTEL — LOBBY`, hotel clerk

`occupyCity` receives a Lotus-only pinned unlocked prefix so the seeded lock count
for appended facades cannot renumber these units. New deterministic tenancy begins
at unit 4. Existing property, agency, dealership, hotel room, market, phone, ATM,
dock, fuel, and `the_stretch` vehicle IDs remain unchanged.

All eight Lotus source identities are intentional and must have authored city-
scale runtime art. Classification:

| source | treatment | role |
|---|---|---|
| grand_market | explicit city-scale promotion | landmark/market |
| harbor_office | explicit city-scale promotion | civic/working harbor |
| lantern_shop | reuse composition; city-scale promotion | historic unit 0 |
| pagoda | explicit landmark promotion | skyline landmark |
| row_house | explicit city-scale promotion | appended housing |
| tea_house | reuse composition; city-scale promotion | historic units 1/3 |
| temple | explicit landmark promotion | historic unit 2/civic axis |
| theater | explicit landmark promotion | night-market loop |

No Lotus city-scale key may remain in the procedural-fallback set. Source masters
remain under `assets/art/masters`; runtime PNG order and dimensions are pinned.

## Story and contextual cutscene order

The complete `ch8_journey` reel is gallery-only and preserves this exact order:

1. `riverboat_to_lotus_harbor`
2. `lotus_harbor_arrival`
3. `spore_forest_scramble`
4. `yak_express_to_mt_shu`
5. `paper_guardians_false_folds`
6. `paper_dragon_reveal`
7. `temple_bell_resonance`

Each panel also has a one-panel contextual runtime cut at its actual story point.
Bert/Lucille reaches only the riverboat connection; the riverboat owns arrival;
Lucille remains the backtracking network; the Yak owns the forest-to-temple leg.

The stable runtime chronology is fixed to these 25 steps:

1. `ch7_complete` prerequisite
2. Lucille-to-riverboat handoff
3. riverboat arrival
4. Lotus Harbor introduction
5. city orientation and local quest access
6. Trust/Clicker setup
7. Bamboo Road/barge crisis
8. public Clicker clearing
9. Spore Forest warning/tutorial
10. real Mushroomized encounter
11. Brushes and optional forest routes
12. Yak Express transition
13. paper-guardian false folds
14. Pippa read and Trust resolution
15. elder’s Teleport Beta lesson
16. Paper Dragon reveal
17. boss battle
18. `paper_dragon_defeated`
19. retry-safe Paper Fan reward
20. safe post-battle restart/reposition
21. bell approach
22. `ch8_heartlight_seen`
23. Ember 8
24. `ch8_complete`
25. safe backtracking and Chapter 9 frontier access

Stable flags include `ch8_arrived`, `paper_dragon_defeated`,
`ch8_heartlight_seen`, `ember8`, and `ch8_complete`. Stable triggers include
`ch8_arrival`, `paper_dragon_boss`, and `mt_shu_temple_resonance`.

Trust compatibility stages real missing scenes instead of migration flags:

- Lotus orientation plays any genuinely missing non-choice setup through
  `thread_trust_esc2`.
- Bamboo crisis plays `thread_trust_esc3`.
- Spore Forest plays `thread_trust_esc4`.
- Mt. Shu plays `thread_trust_climax` and `thread_trust_resolve`.
- No scene or migration invents FREE or STRINGS.
- FREE keeps Pippa.
- STRINGS keeps her only with `pippa_reconciled` and
  `GS.data.echoes.rewindCount <= 2`.
- A decided, unreconciled STRINGS leaf uses `departHero`; neutral/undecided is
  preserved and does not mean STRINGS.
- Departure moves her exact serialized hero record to a persisted bench; rejoin
  restores that record, so she is neither duplicated nor silently rebuilt.
- Pippa adds early crease observations when present; an elder annotation provides
  the same route/boss knowledge when absent. Completion never requires her.

Clicker compatibility also stages actual beats:

- Lotus setup plays the missing seed scene.
- The Bamboo lock plays the crisis scene, then a public clearing in which Milo
  takes the Clicker openly, narrates every input, moves only unoccupied machinery,
  saves the crowd, and exposes the spoof.
- Clearing sets `thread_clicker_clearing`, leaves the repaired/painted lock state,
  and adds `The Lotus Bargeman` Caller exactly once.

## Mushroomized

The stable internal token is `mushroomize`; player-facing text is “Mushroomized.”
Save v25 stores `{active, phase, source, recovery}`. Phases are deterministic:

- phase 0 rotates logical movement clockwise
- phase 1 rotates logical movement counter-clockwise
- phase 2 reverses logical movement

The phase is selected by the entered `CH8_WORLD` hazard and latches until cured;
it never changes per frame and uses no randomness or wall clock. Transformation
happens after the common `INPUT.dir()` read for on-foot overworld movement, so
keyboard, touch, and controller share it. Confirm/cancel/menu/dialogue/cutscene
inputs are untouched. The status persists across map changes and save/load; a
cure or chapter defeat recovery clears it. Zone entry records the nearest clean
recovery. Spore Puffer inflicts it. Spore Antidote consumes once and cures it;
Scroll of Calm is reusable and cures it; doctors cure it as the guaranteed
fallback. This explicitly supersedes doctor-only/deferred stand-in prose.

## Teleport Alpha and Beta

- Alpha remains Rex’s level-26 ability and uses a 96-native-pixel sustained run-up.
- Beta is removed from the level-34 row and has one canonical grant:
  `awake_teleport_b`, set by the Mt. Shu elder after “You run too much. Run less.”
- Beta uses a 32-native-pixel short dash.
- Field activation is unavailable without the corresponding learned ability and
  Beta story flag. It lists only legitimately visited, story-open towns and uses
  stable safe-arrival anchors.
- A wall collision before the threshold causes the soot-faced failure, consumes
  no travel, charges the documented PP attempt cost once, and cannot strand the
  party. Success charges PP once.
- Followers re-form at the safe arrival; active/parked vehicles remain where they
  were and are never duplicated. Teleport is blocked during battle, cutscenes,
  other modals, incompatible vehicle state, and stolen-Locket state.
- v25 grants Beta only when old flags prove the elder/post-Chapter-8 state; merely
  being level 34+ or present in an early Chapter 8 map does not pretend the lesson
  occurred.

## Exactly five Chapter 8 quests

The manifest order and contracts are frozen:

1. `brushes_of_mt_shu`
   - giver `lh_calligrapher`; start `q_brushes`
   - interaction flags `q_brush_river`, `q_brush_kiln`, `q_brush_cloud`
   - objectives `q_brushes_gather`, `q_brushes_return`; done `q_brushes_done`
   - reward `scroll_of_calm`
   - Caller `The Calligrapher`, heal 1,400
   - footprint: finished temple banner and marked recovered-brush rack
2. `lanterns_of_the_false_fold`
   - giver `lh_lantern_girl`; start `q_false_fold_lanterns`
   - objectives `q_false_fold_lanterns_read`,
     `q_false_fold_lanterns_refolded`; done `q_false_fold_lanterns_done`
   - reward `paper_crane_charm`
   - Caller `The Lantern Girl`, damage 820
   - footprint: three honest crane lanterns replace the tooth folds
3. `the_yak_who_waits`
   - giver `lh_yak_handler`; start `q_yak_waits`
   - objectives `q_yak_waits_feed`, `q_yak_waits_route`; done `q_yak_waits_done`
   - uses existing `yak_treats`; reward `jade_salamander_charm`
   - Caller `The Yak Handler`, damage 880
   - footprint: fed Yak, repaired route bell, open scenic depot loop
4. `the_harbors_balance`
   - giver `lh_harbor_master`; start `q_harbor_balance`
   - objectives `q_harbor_balance_weights`,
     `q_harbor_balance_delivered`; done `q_harbor_balance_done`
   - reward `river_beads`
   - Caller `The Harbor Master`, damage 900
   - footprint: balanced scales, cleared quay, stocked market shelf
5. `tea_for_the_empty_chair`
   - giver `lh_tea_monk`; start `q_empty_chair`
   - objectives `q_empty_chair_brewed`, `q_empty_chair_offered`;
     done `q_empty_chair_done`
   - reward `temple_incense`
   - Caller `The Tea-House Monk`, heal 960
   - footprint: steaming cup remains at the temple remembrance chair

Every interaction is persistent and idempotent. Completion uses the existing
hands-full retry machine: reward and Caller happen exactly once only after the
reward fits. All five remain completable after the boss and via backtracking.

## Enemies and Paper Dragon

The regular roster is exactly:

- `paper_lantern_wisp`: HP 5,500, level 36, floating/fire tell
- `spore_puffer`: HP 6,500, level 37, real Mushroomized infliction
- `origami_warrior`: HP 8,000, level 38; dedicated `refold` move kind lasts four
  turns and retains its physical shield, replaces normal FIRE weakness/FREEZE
  resistance with FREEZE
  weakness/FIRE resistance, retains VOLT weakness, feeds both damage and
  Spy/Scope, then restores the normal profile when the creases relax
- `porcelain_warlord`: HP 11,000, level 40, breaks into a tested same-roster phase

All have authored overworld tell, battle hook, useful drop, base/`_w1`/`_w2`, mini,
Spore Forest backdrop where appropriate, and `unlessFlag: paper_dragon_defeated`
on Chapter 8 spawners.

Paper Dragon is exactly HP 45,000, level 40, offense 80, defense 42, speed 34,
no weakness, mind immune, and Volt resistant. It begins AIRBORNE; physical damage
is immune only while airborne. Vibe Volt and Bottle Rockets ground it for exactly
two turns even though Volt is resisted. Below 30% once, it switches to the
distinct BURNING art family, plays `dragon_burn`, and doubles speed once. Victory
is normal HP victory. The Paper Fan is awarded retry-safely exactly once before
the bell and is independent of Ember state.

Post-boss order is flag → Paper Fan → safe restart → bell → Heartlight flag →
context panel → Ember 8 → `embers = 8` → chapter complete. Later interaction is
harmless.

## Save v25 and profiles

Save v25 adds the Mushroomized record and exact departed-hero bench, normalizes
Chapter 8 fixed points/parking, and preserves every unrelated value and nested
echo snapshot. Migration is deterministic, idempotent, future-version rejecting,
and never invents branch choices, completion, rewards, Callers, or heroes.

The 13 exact developer profiles are:

`arrival`, `city`, `barge`, `trustFree`, `trustStrings`, `mushroomized`,
`forestCured`, `brushes`, `yak`, `temple`, `boss`, `postBoss`, `complete`.

They use `CH8_WORLD` spawns, level ~40, seven Embers until completion and exactly
eight in `complete`, coherent Pippa/Trust/Clicker state, and unique reward/key
items. `complete` has `paper_dragon_defeated`, `ch8_heartlight_seen`, `ember8`,
`ch8_complete`, one Paper Fan, no false Chapter 9 arrival, and a harmless spawn.

## Diversity ledger deltas

- Lotus Harbor differs from Chandrapore’s rectilinear bazaar/ghat/cinema axis and
  Kvisthavn’s narrow quay by using a fan-shaped terraced working river crescent.
- Bamboo Road differs from Foggy Moor and Monsoon Road by using two river braids,
  lock pools, and alternating switchback ascent rather than a single weather lane.
- Spore Forest differs from the organic Spine Ear by teaching a repeatable control
  transform through safe-pocket loops, kiln silhouettes, and unlocked shortcuts.
- Mt. Shu differs from Old Stones, the Cobra Palace, and Wintermoor floors by
  alternating processional folded courts and physically separating boss and bell.

## Required evidence

Implementation must produce `output/maps_ch8.png`,
`output/ch8_lotus_harbor_facades_contact.png`, strict visual/animation reports,
focused tests for every contract above, full validation/test/build gates, desktop
and phone live QA, and honest disclosure where physical controller hardware is not
available.
