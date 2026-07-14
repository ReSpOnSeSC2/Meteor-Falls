# Chapter 9 production blueprint — The Count of Valea Stelelor

This document is the durable production contract for Chapter 9. It supersedes
the compact shipped scaffold and stale planning prose; it does not depend on an
attachment or chat. Executable canon remains the authority where this document
does not explicitly freeze a new production decision.

> **Status (2026-07-14):** the four-map world, story/combat systems, developer
> matrix, and contextual art remediation are implemented and production-closed.

## Canon and stable roster

- Chapter: 9, Romania, target level 46, Heartlight/Ember 9.
- Travel: the Orient Less-Express. Bert and Lucille do not fly the party to
  Valea. The train owns the arrival fiction and contextual arrival art.
- Settlement: `valea_stelelor`.
- Route: `old_road`.
- Dungeon: `castle_hoaxula`.
- Resonance site: `stone_brow_monastery`.
- Regional quest: `bunis_table`.
- Regular encounters: exactly five — Haystack Mimic, Ribcage Rattler, Moss
  Strigoi, Animated Armor, and Wolf of the Old Road.
- Boss: Count Hoaxula, 95,000 HP, theatrical and unmasked forms, target level
  46. The obsolete 5,300-HP and twenty-enemy package plans are rejected.
- Dorin has travelled with the party since Chapter 5. This is his homecoming
  and awakening, never an introduction or join scene.

The final stable map set remains the four canonical shipped IDs. Dedicated
train, shop, church, home, or castle-room map IDs are not added: the train is a
large exterior platform landmark and the village's furnished social/service
spaces are readable outdoor courts behind authored facades. This preserves the
published world graph while replacing all four test layouts.

| Map | Production dimensions | Spatial signature |
| --- | ---: | --- |
| `valea_stelelor` | 80 × 64 | A warm crescent village around a green, table, well, and painted-gate lane; rail platform below, Old Road mouth above-east. |
| `old_road` | 96 × 72 | A broad climbing switchback with alternating screened and exposed reaches, three safe pockets, and rising encounter pressure. |
| `castle_hoaxula` | 72 × 96 | A south-to-north attraction route: ticket queue, fake scare rooms, bankrupt backstage, throne arena, separate choice chamber, mountain exit. |
| `stone_brow_monastery` | 64 × 88 | A quiet processional climb through three courts: trial, name/awakening, then a spatially separate bell and Heartlight crown. |

## `CH9_WORLD` fixed-point contract

`src/data/maps_ch9.ts` owns `CH9_MAP_IDS`, `CH9_WORLD`, and a native-feet
conversion helper. Map builders, scene handlers, migrations, developer
profiles, and tests consume this registry. No save-facing coordinate may be
repeated as an unrelated literal.

All points below are native tiles. Landings describe player feet; door `tx` and
`ty` use the shared 16-pixel feet conversion.

### Valea Stelelor — 80 × 64

- Rail platform and arrival:
  - train landmark/apron: `{x:3,y:52,w:20,h:11}`;
  - arrival feet: `{x:14,y:53,facing:'up'}` (settled-frame body-safe at the train apron);
  - arrival story rectangle: `{x:8,y:49,w:16,h:10}`.
- Districts:
  - Buni's west table court: center `{x:20,y:36}`;
  - village green and well: center `{x:39,y:38}`;
  - painted homes/cottage lane: north-west, x 9..33, y 10..25;
  - provisioner and hall: north civic lane, x 35..55, y 12..27;
  - church court: north-east, x 58..72, y 9..27;
  - mill/barn/work lane: south-east, x 54..72, y 37..53;
  - Old Road gate approach: east, x 69..79, y 27..36.
- Authored facade identities are placed deliberately: painted house, cottage,
  inn, shop, hall, church, mill, and barn. They are not randomly selected.
- Nine live villagers make the settlement read as inhabited: Buni, the
  provisioner, shepherd, child, orchard keeper, miller, church neighbor, green
  dancer, and station cousin. They deliberately reuse the four strict-clean
  `vs_buni`, `vs_provisioner`, `vs_shepherd`, and `vs_kid` sheet identities;
  this is a live-cast expansion, not a request for five new NPC sheets.
- Furnished social/service seams:
  - Buni's table is a broad, collision-clear picnic court and quest giver area;
  - the provisioner is a live shop counter at the shop facade;
  - the church court, inn porch, hall noticeboard, mill yard, barn yard, well,
    payphone, and recovery table create distinct civic uses without fake doors;
  - Buni's Spare Cottage is visibly marked as the `valea_cottage` property seam;
    its purchase/interior editor remains a future property-system placement;
  - Castle Hoaxula's `hoaxula_park` flip seam is signposted backstage after the
    boss, also without inventing a new purchase UI in this chapter pass.
- Old Road transition:
  - Valea mouth: `{x:77,y:28,w:3,h:6}`;
  - reciprocal Old Road landing: `{x:4,y:62,facing:'right'}`.
- Recovery: `{x:38,y:41,facing:'down'}`.
- Migration: `{x:14,y:53,facing:'up'}`.
- Vehicle/legacy parking recovery apron: `{x:5,y:53,w:16,h:9}`. A v25
  vehicle parked anywhere on rebuilt Chapter 9 geometry recovers here without
  reintroducing a Lucille-arrival story.
- Developer spawns:
  - arrival: arrival feet;
  - village/Buni: `{x:22,y:40,facing:'up'}`;
  - Buni-active and full-bag retry: `{x:20,y:38,facing:'right'}`, directly
    beside Buni without sharing her tile;
  - complete/backtrack: `{x:40,y:41,facing:'down'}`.
- Buni ingredient pickups:
  - `smantana` / `q_buni_smantana`: mill dairy shelf `{x:64,y:47}`;
  - `pickled_cabbage` / `q_buni_cabbage`: Buni's cellar hatch `{x:13,y:29}`;
  - `grandfather_plums` / `q_buni_plums`: plum orchard `{x:29,y:18}`.

The Orient Less-Express stays visible at the rail apron after arrival. It is a
landmark, not a one-way door into an unrelated Chapter 7 train dungeon. Safe
backtracking means every Chapter 9 route remains reciprocal before and after
the boss; Chapter 10 travel remains the responsibility of the existing frontier
handoff, not an invented Chapter 9 interior.

### The Old Road — 96 × 72

- The route is a follower-safe ribbon at least five walkable tiles wide along:
  `{2,63} → {19,56} → {40,59} → {57,45} → {39,31} → {61,20} → {76,5}`.
- Valea transition:
  - mouth: `{x:0,y:59,w:3,h:8}`;
  - reciprocal Valea landing: `{x:75,y:31,facing:'left'}`.
- Castle transition:
  - mouth: `{x:72,y:0,w:9,h:3}`;
  - reciprocal Castle landing: `{x:36,y:91,facing:'up'}`.
- Pacing and sightlines:
  - lower hay fields teach Haystack Mimic tells;
  - beech bend hides Moss Strigoi until the first safe pocket;
  - wayside shrine/recovery at `{x:55,y:47,facing:'up'}`;
  - exposed wolf overlook raises pressure after the midpoint;
  - final castle switchback mixes Wolf and Moss without blocking the mouth.
- Safe pockets: `{x:18,y:56}`, `{x:55,y:47}`, and `{x:42,y:30}`. Spawner
  rectangles and props never enter them or either landing body.
- Buni ingredient pickups:
  - `branza_burduf` / `q_buni_branza`: shepherd cache `{x:22,y:54}`;
  - `valley_mushrooms` / `q_buni_mushrooms`: beech hollow `{x:43,y:32}`.
- Every one of the five pantry pickup tiles has a visible adjacent prop in
  `CH9_BUNI_PICKUP_CUES`. Each cue uses the ingredient's own `unlessFlag`, so
  collecting an ingredient retires its landmark instead of leaving a false
  promise in the world.
- Migration: `{x:7,y:62,facing:'right'}`.
- Developer spawn: `{x:18,y:56,facing:'right'}`.

All five ingredients are obtainable before the castle and remain obtainable
after the boss. The stale “smoked meat” prose is replaced by valley mushrooms,
matching the five committed pantry items and avoiding a sixth phantom item.

### Castle Hoaxula — 72 × 96

- Old Road mouth/landing: south mouth `{x:32,y:93,w:9,h:3}`, feet
  `{x:36,y:91,facing:'up'}`.
- Monastery mouth: north `{x:32,y:0,w:9,h:3}`; it is gated by
  `ch9_count_decided`, not by location or boss defeat alone.
- Attraction sequence:
  - ticket court/velvet queue: y 78..92;
  - fake crypt and cardboard bat showroom: y 57..77;
  - gift shop, dressing room, foreclosure wall, and backstage service lane:
    y 39..56;
  - picnic recovery/restart foyer: usable table `{x:37,y:39}` with clear
    recovery feet `{x:36,y:40,facing:'up'}`;
  - throne/boss arena: `{x:18,y:20,w:36,h:15}`;
  - post-boss kneeling/choice chamber: `{x:27,y:8,w:18,h:7}`;
  - monastery exit: y 0..5.
- Boss trigger: `{x:18,y:22,w:36,h:11}`. It cannot overlap the restart point,
  choice rectangle, north door, props, spawners, or a recovery site.
- Boss restart: `{x:36,y:39,facing:'up'}`.
- Choice approach: `{x:28,y:10,w:16,h:5}`. The boss handler returns here only
  after terminal cleanup and `count_hoaxula_defeated`; the choice owns its own
  durable transaction and cannot retrigger once decided.
- Monastery reciprocal landing: `{x:32,y:83,facing:'up'}`.
- Migration: `{x:36,y:88,facing:'up'}`.
- Developer spawns: castle entry `{x:36,y:78,facing:'up'}`, pre-boss and
  theatrical `{x:36,y:39,facing:'up'}`, post-unmask battle launch at the same
  safe restart, post-boss/choice `{x:36,y:16,facing:'up'}`.

Castle dressing reuses authored ticket window, velvet ropes, curtains, posters,
gift boxes, crates, benches, and stage fixtures. Meteor rocks and trail markers
do not stand in for a throne, scenery, or accounting office. Regular spawners
use `unlessFlag: 'count_hoaxula_defeated'`; post-boss Castle and Old Road travel
is intentionally calm and fully reciprocal.

### Stone Brow Monastery — 64 × 88

- Castle transition: south mouth `{x:28,y:85,w:9,h:3}`, Castle landing
  `{x:36,y:4,facing:'down'}`.
- Processional route: entrance court y 72..84, three offset stair/ribbon reaches,
  trial court y 48..60, name/awakening court y 27..40, and bell crown y 4..18.
- Recovery: `{x:32,y:68,facing:'up'}`.
- Story rectangles are non-overlapping and ordered by the only upward route:
  - Trial of the Mute Mountain: `{x:18,y:49,w:28,h:9}`;
  - birth name and Comet Ω awakening: `{x:20,y:29,w:24,h:8}`;
  - bell/Heartlight resonance: `{x:23,y:7,w:18,h:8}`.
- Migration: `{x:32,y:81,facing:'up'}`.
- Developer spawns sit inside their real durable trigger frontiers: monastery
  `{x:32,y:57,facing:'up'}`, awakening `{x:32,y:36,facing:'up'}`, and complete
  `{x:32,y:16,facing:'up'}` just above the resonance court.

The monastery has no random encounters. Quiet, spacing, changing elevation
grammar, memorial stones, bell silhouette, and three separate courts carry the
four-chapter destination; scale alone does not.

## Retry-safe story chronology

Scene handlers use pure planners where practical and commit each durable stage
before its presentation. An interrupted presentation resumes at the next
uncommitted stage rather than replaying a reward or skipping a prerequisite.

### Train and arrival

1. The Chapter 8 frontier offers the Orient Less-Express only after Chapter 8
   completion and before `ch9_arrived`.
2. Accepting sets `ch9_train_committed` before playback and grants the
   `orient_express_ticket` key item exactly once.
3. The contextual train panel is selected from current Pippa state. Its
   successful presentation sets `ch9_train_seen`.
4. A committed-but-not-arrived save resumes the remaining train/teleport work;
   it does not ask again.
5. Teleport uses `CH9_WORLD.valea.arrival`. Entering the arrival rectangle sets
   `ch9_arrived` before the contextual arrival panel/dialogue.
6. The full seven-panel `ch9_journey` gallery is never played as an entry reel.

### Buni's Table

Persistent flags are:

- `q_bunis` — accepted;
- `q_buni_smantana`, `q_buni_branza`, `q_buni_mushrooms`,
  `q_buni_cabbage`, `q_buni_plums` — independent pickups;
- `q_bunis_gather` — all five present;
- `q_bunis_cook` — returned and cooking/presentation begun;
- `q_bunis_done` — reward transaction accepted;
- `feast_recipe` — crafting unlock, committed only with a successful reward;
- `ch9_buni_panel_seen` — contextual family panel presented.

The pickup planner is idempotent. Pickups use flags rather than five temporary
bag entries, so ordinary inventory capacity cannot lose quest progress. Buni
reports exact progress. Once all five are set, the return commits `q_bunis_gather`
and then `q_bunis_cook` before presentation. `completeQuest('bunis_table')`
remains the one reward/Caller transaction:

- if the bag is full, the Feast Basket, done flag, recipe, and Caller remain
  uncommitted; `q_bunis_cook` keeps the retry available;
- on acceptance, `basket_feast`, `q_bunis_done`, Buni's Caller, and
  `feast_recipe` commit exactly once;
- repeated interactions return post-quest dialogue and cannot duplicate any of
  them;
- every pickup and Buni remain reachable after Count Hoaxula.

### Count Hoaxula

1. Entry requires the boss not already defeated and begins in THEATRICAL form.
   The theatrical introduction is shown once per attempt.
2. On boss turn two, Hoaxula chooses one valid equipped slot. Escrow is the exact
   `{heroId,slot,itemId}`. An empty, invalid, or dangling slot produces no theft.
3. The item remains in its owner's bag but is unequipped for battle. Battle UI
   cannot re-equip it, and no save occurs inside BattleScene; this avoids a new
   save field while still making teardown deterministic.
4. “Command the Night” telegraphs on its declared cadence. BREAK, Sleep, or
   Freeze cancels the pending cast; ward mitigates its landing. Each answer is
   directly tested through BattleScene.
5. At HP less than or equal to exactly 50%, once and only once, narration knocks
   the cape away and then switches to the UNMASKED art family. The trigger is
   form-aware and inclusive without changing older bosses' strict thresholds.
6. Good-or-better PRAY can mercy only while UNMASKED. Earlier PRAY cannot end the
   fight. Zero HP remains a standard victory path.
7. Mercy and zero-HP victory both restore the exact item to its original slot
   before returning control. Defeat/retry and battle teardown perform the same
   restoration. Escrow clears only after a successful exact restore.
8. On success, `count_hoaxula_defeated` commits before the post-boss scene; the
   scene lands at the separate choice approach. No moral branch is implied by
   mercy versus HP victory.

Battle-local theft cannot be serialized because BattleScene does not expose a
save command. Save/load safety is therefore the stronger invariant that every
exit restores equipment before OverworldScene can save and that no item ever
leaves the owning bag.

### COMPASSION, Held Breath, and continuity

- `recordChoice` validates an option before mutating state, clears sibling
  option flags, sibling `alsoSets`, and the prior choice Caller, then commits the
  selected transaction synchronously.
- OPEN HAND (`mercy`) sets `axis_compassion_openhand`, returns the valley's
  warmth, clears `stolen_light_banked` and `dorin_withholds`, and banks exactly
  one Vlad Caller.
- IRON sets `axis_compassion_iron`, `stolen_light_banked`, and
  `dorin_withholds` in the same transaction and removes any prior Vlad Caller.
- Both set `ch9_count_decided` exactly once in ordinary play. A Held Breath
  rewind restores the whole pre-choice snapshot, including Pippa bench/departed
  serialization, equipment, Buni progress, Trust/Clicker/army continuity, and
  previous Embers, while clearing Chapter 9 and later branch consequences.
- Re-deciding after a rewind creates exactly the selected branch and Caller.
- Chapter 9 never rewrites Chapter 6 Trust, Clicker state, army callers, Pippa's
  `departedHeroes` record, or earlier choice flags.

### Dorin, Comet Ω, Heartlight, and completion

The route requires both `count_hoaxula_defeated` and `ch9_count_decided`.
Location alone proves nothing. The three monastery courts stage:

1. Trial court commits `ch9_trial_seen` before the trial presentation.
2. Awakening court commits `ch9_dorin_name_spoken` before Dorin says his birth
   name, then uses the canonical `trial_of_the_mute_mountain` awakening to grant
   `awake_comet_o` exactly once. IRON still grants the awakening but
   `dorin_withholds` keeps Comet Ω unavailable until branch restoration.
3. Bell court commits `ch9_heartlight_seen` before the contextual resonance
   panel/dialogue.
4. If `ember9` is absent, set it before presenting Ember 9. Repair the scalar
   with `embers = Math.max(embers, 9)`; never reduce a later/imported value.
5. Set `ch9_complete` only after trial, name, awakening, Heartlight, and Ember 9
   all exist. The Chapter 9 card is presented once via its own seen flag.

Every stage is independently resumable and idempotent. No partial save can
duplicate Comet Ω, Heartlight, Ember, chapter card, Caller, or reward.

## Pippa-present and Pippa-departed compatibility

Pippa's Chapter 8 departure record is authoritative. Chapter 9 never fabricates
her in party, bench, dialogue, or art and never reconstructs a departed record.
Scene copy selects present/departed keys for train, arrival, Buni, Castle,
unmask, monastery, and choice; the solo Trial remains branch-neutral.

The inherited panels predate Dorin's Chapter 5 move: ensemble images omit Dorin
and include Pippa. Production now ships corrected contextual pairs for train,
arrival, Buni, castle, unmask, monastery, and the choice. Each pair has:

- `_pippa` — Jay, Mia/Faye, Milo, Dorin, and Pippa when she is present;
- `_departed` — Jay, Mia/Faye, Milo, and Dorin only.

The solo Trial panel is shared. Runtime chooses from serialized state, never
from a developer-profile label. All new raster work uses the image-generation
workflow, retains a source/master, produces a 1600×900 runtime derivative,
registers it, passes asset tests/audits, and receives original-resolution review.

## Combat roster contract

| Enemy | Map tell and placement | Decision hook | Identity-specific drop | Death line contract |
| --- | --- | --- | --- | --- |
| Haystack Mimic | visibly isolated haystacks in Valea edge/lower Old Road | FIRE rewards target knowledge; Play Dead inflicts three-turn PARALYZED risk and turns the feint into a real action-cost decision | Plăcintă | collapses to straw; field mouse escapes |
| Ribcage Rattler | bone/display alcoves inside Castle | HOLY weakness and a self-only mend of exactly 12% max HP (1,800 at 15,000 HP) make focus fire matter | Vigil Candle | falls apart and forgets how to stand |
| Moss Strigoi | damp wooded and crypt verges | life drain plus crying pressures healing and status response | Pelin Bitters | becomes a sad mossy log |
| Animated Armor | staged parade suits in Castle queue/showroom | high defense, VOLT weakness, shield stance | Ciorbă | crashes down as an empty costume |
| Wolf of the Old Road | visible Wolf mini at the exposed overlook on upper switchbacks | fast high-pressure attacker, HOLY weakness | Mici | becomes a tired grey dog asleep in moonlight |

All five remain level 42–45 with current HP 12,000/15,000/17,000/20,000/24,000
unless measured balance proves a targeted adjustment. Each has base, visibly
progressive byte-distinct wear 1/wear 2, and mini art. Count theatrical and
unmasked also satisfy the same three-stage contract; Ribcage's previously
distinct stages remain unchanged.

All Chapter 9 spawners retire on `count_hoaxula_defeated`. Valea's teaching
Haystack encounter also retires. The final balance report must keep Count at
95,000 HP and preserve the established boss ladder while measuring level-46
party DPR, read/setup turns, status windows, ward, gear, Caller, and branch effects.

## Completed art inventory

Retain and reuse:

- four strict-clean 384×1536 Valea 46-frame NPC sheets and their masters;
- eight Valea facades and Romania regional strip;
- the 1600×900 Castle battle background;
- five regular-enemy bases/minis and both Count form bases;
- the Orient Less-Express strip;
- the seven journey compositions and one choice composition as visual/source
  references, plus the solo Trial runtime panel.

Production remediation is complete:

- fourteen contextual runtime panels ship the seven Pippa-present/departed
  pairs described above, with fourteen matching source masters;
- eleven visibly progressive, byte-distinct wear corrections ship for
  Haystack, Moss, Armor, Wolf, Count theatrical, and Count unmasked, with eleven
  matching generated masters;
- named masters are retained for every new image-generation result and both
  choice variants; legacy Orient Less-Express and Ribcage assets retain Git
  provenance (`b83bc19a`/`8bcfe5f2`/`01aa9171` and `74bca949`, respectively).

No new NPC sheet/identity, facade, regional tile, background, base enemy
identity, or mini is justified. Valea's nine live villagers reuse its four
strict-clean sheet identities, and Castle/world detail first reuses registered
authored props. Strict visual, enemy-frame, and animation gates may not be
weakened.

## Save v26 and migration

Generic flags and callers need no new schema fields. Version 26 is required only
because all four shipped Chapter 9 geometries and the Chapter 9 parking apron
move. The v25→v26 step is deterministic, idempotent, and recursive through
Held Breath snapshots.

- A save physically located on one of the four Chapter 9 maps recovers to that
  map's `CH9_WORLD.migration` point.
- Chapter 9 vehicle parking recovers to Valea's apron; unrelated parking and
  coordinates are byte-preserved.
- `ember9` or `ch9_complete` is irreversible proof that old scaffold play passed
  the missing awakening/Heartlight path. Migration may backfill
  `awake_comet_o` and `ch9_heartlight_seen`, while leaving
  `ch9_dorin_name_spoken` false so one nonblocking name catch-up can occur.
- Migration never infers IRON, OPEN HAND, Buni progress, Count defeat, or any
  story state from coordinates.
- Party stats/equipment/bags, inventory, money, property/home/garage data,
  vehicles/fuel, quests, callers, choices, echoes, departed heroes, previous
  Embers, Locket, and all unrelated flags remain exact.
- Future versions are rejected and migrating the same payload twice is stable.

## Developer-profile matrix

`TitleScene` exposes Chapter 9 maps and the following exact states. Every state
uses level-46 coherent hero records/loadouts, eight previous Embers until the
complete profile, the Star Locket/Held Breath prerequisites, prior awakenings,
Trust/Clicker/army continuity, callers, choices, and `CH9_WORLD` feet.

| Profile | Required purpose |
| --- | --- |
| `arrival` / `arrivalDeparted` | unplayed arrival; present/departed panel selection |
| `village` | Buni and settlement navigation |
| `buniActive` | partial ingredient serialization |
| `buniFull` / `buniFullDeparted` | all ingredients, completely full bags, reward retry; present/departed story twins |
| `oldRoad` | mid-route encounters and pickups |
| `castleEntry` | ticket/queue route |
| `preBoss` / `preBossDeparted` | safe restart before trigger |
| `theatrical` | direct dev battle launch in initial form/turn context |
| `postUnmask` / `postUnmaskDeparted` | direct real-battle launch at exact 50% UNMASKED phase context, including stolen-weapon state |
| `postBoss` / `postBossDeparted` | defeated, pre-choice Held Breath anchor |
| `iron` / `ironDeparted` | exact IRON transaction and withheld Ω |
| `openHand` / `openHandDeparted` | exact OPEN HAND transaction and Vlad Caller |
| `monastery` / `monasteryDeparted` | post-choice trial approach |
| `awakening` / `awakeningDeparted` | name committed, awakening pending/resume case |
| `complete` / `completeDeparted` | nine Embers, calm backtracking, branch art |

These are exactly 25 states, including ten present/departed pairs: arrival,
full-bag Buni retry, pre-boss, post-unmask, post-boss, IRON, OPEN HAND,
monastery, awakening, and complete. Theatrical/post-unmask labels launch real
BattleScene contexts; they do not mislabel overworld pre-boss saves. Full-bag
state is hazardous by design but its feet are safe.

## Automated and live-QA acceptance

Focused automated coverage must include:

- map dimensions, fixed points, exhaustive bounds/reachability, real body box,
  route widths, reciprocal doors, trigger uniqueness, and collision separation;
- every Buni transition, serialization, full-bag retry, reward/recipe/Caller
  exactly-once behavior, and post-boss availability;
- actual OverworldScene train, arrival, Buni, boss-to-choice, Pippa variants,
  trial/name/awakening/Heartlight/Ember/completion resume behavior;
- actual BattleScene theft identity/slot, invalid slots, terminal cleanup,
  windup cadence and counters, exact 50%, art family, PRAY threshold, mercy,
  zero-HP victory, defeat/retry, and choice handoff;
- choice validation, re-decision, Caller cleanup, and exact Held Breath rollback;
- v25→v26/nested migration and every Title profile;
- authored art/source wiring, panel variants, byte-distinct wear, NPC animation,
  regular roster, and balance.

Final settled-frame live QA covers desktop 1280×720; phone portrait 390×844 and
landscape 844×390; touch D-pad, A/B, menu, dialogue, battle choice, and a
full-inventory retry; arrival through completion and post-boss backtracking; and
a fresh console after assets settle. Physical controller status is reported
honestly, never inferred.

The final evidence set includes `output/maps_ch9.png`, measured strict visual,
animation, enemy-frame, balance, encounter, and door reports, focused/full test
totals, screenshots, and `docs/CH9_PRODUCTION_VERIFICATION.md`.

## Documentation reconciliation

Update executable-canon prose in:

- `docs/asset-packages/PKG-16-ch9-Romania.md` and its package index;
- `docs/asset-lists/unbuilt_chapters.txt` and orphan battler list;
- `docs/GAME_BIBLE.md`, `docs/CUTSCENE_BLUEPRINT.md`, and
  `docs/IMAGE_ASSET_MANIFEST.md`;
- `docs/QA.md`, `docs/ENCOUNTERS.md`, `docs/DIVERSITY_LEDGER.md`,
  `docs/SETTLEMENT_REDESIGN_HANDOFF.md`, and `docs/WORLD_OVERHAUL_HANDOFF.md`.

A new ADR freezes the four production dimensions, train-owned arrival, focused
five-enemy roster, Pippa/Dorin contextual panel rule, and v26 geometry recovery,
explicitly superseding PKG-16's historical unbuilt/5,300/twenty-enemy claims.
The two protected documentation paths named in the rollout request remain
untouched.

## Explicit non-goals

- Chapter 10 implementation or pre-completion of any finale flag.
- A new train dungeon or reuse of Chapter 7's story-specific night train.
- A new generic city/tenancy generator or five new NPC sheet identities for
  Valea's nine-villager live cast.
- Shipping the future Valea property purchase, home editor, castle flip, hotel,
  dealership, or vehicle-delivery economy; only their honest world seams remain.
- New base NPC/facade/tile/background/enemy/mini art where committed art is good.
- A save field for battle-local theft or any migration based on location as
  proof of moral choice/story completion.
- Rebalancing the established 95,000-HP Count or wider boss ladder without
  measured evidence.
- Weakening strict visual, animation, map, save, or test gates.
