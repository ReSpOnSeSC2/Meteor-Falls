# Chapter 8 production verification

**Chapter:** 8 — *The Paper Dragon*
**Production branch:** `codex/chapter-8-production-rollout`
**Published starting main:** `00aab118987fe144517482fe3335039844b7442f`
(`Ship Chapter 7 production rollout`)
**Required parent / animation commit:**
`0be2777214fa3de9c2bd6304ffc62261100de2ee`
(`Close strict character animation gate`)
**Production date:** 2026-07-13
**Chapter 8 commit:** this commit, `Complete Chapter 8 production rollout`
(the immutable hash is recorded by Git history)
**Push / merge:** none; neither action was authorized or performed

This record supersedes the compact Chapter 8 scaffold label and pre-production
PKG-15 assumptions. It does not infer a release pass from registration or
compilation. Every close result below is taken from a completed final command,
inspection, or live-QA result.

## Branch and inherited animation gate

The rollout began from published main `00aab118`. The inherited strict character
animation baseline was 38/97 clean, 0 errors, 263 warnings, and 82 review hints.
The separate `codex/animation-gate-remediation` branch closed that gate and
committed `0be27772`; at that commit the strict report was 81/97 clean, 0 errors,
0 warnings, and 58 visually assessed review hints. Thresholds, severity, and
strict exit behavior were not weakened.

Chapter 8 then branched from the exact remediation tip and added three named NPC
sheets to the audited roster. Therefore the animation-remediation commit's
81/97 total is historical branch evidence, not the Chapter 8 final total.

- Final Chapter 8 strict animation result: **PASS** — 84/100 clean, 0 errors,
  0 warnings, 58 review hints, exit 0.
- Final review-hint assessment: **PASS** — all 58 hints are the visually
  assessed inherited Phase 1 set; the three new Chapter 8 named NPC sheets
  added no hint. The identity-drifting Whistle Guard candidate remains rejected
  and outside this commit.
- Final Chapter 8 commit: this commit, `Complete Chapter 8 production rollout`.

## World contract

| Map | Final size | Headline spatial signature |
| --- | ---: | --- |
| Lotus Harbor | 112×80 | A fan-shaped working river crescent that rises through curved quay, market/tea, and civic terraces to the Bamboo/Yak interchange. |
| Bamboo Road | 104×64 | Reconnecting river braids meet a public lock and barge, then become alternating mountain switchbacks toward the Yak depot. |
| Spore Forest | 88×104 | Three deterministic fungal hazard belts are learned through asymmetric loops, clean safe pockets, and retreat lines. |
| Mt. Shu Temple | 96×104 | Alternating folded courts and guardian halls climb to a Dragon arena, then a separately gated bell resonance. |

The stable save-facing ids remain `lotus_harbor`, `bamboo_road`,
`spore_forest`, and `mt_shu_temple`. `CH8_MAP_IDS` pins that order and
`CH8_WORLD` is the single source for dimensions, native route mouths and
landings, story/quest/hazard rectangles, safe pockets and exits, recovery,
vehicle bay, migration, hotel/unit recovery, and developer profile spawns.
`LOTUS_HARBOR_LANDING` remains a compatibility alias to the registry's
riverboat arrival rather than a second coordinate source.

Every regional connection is reciprocal and uses a body-safe authored landing:
Lotus ⇄ Bamboo ⇄ Spore ⇄ Mt. Shu. The Dragon arena is below and distinct from
the bell; the only post-boss stair remains gated by `paper_fan_claimed`. Ten
Chapter 8 hostile spawners use the focused four-enemy set and retire under
`paper_dragon_defeated`. The recovery rhythm is Lotus Harbor, Spore Forest, and
Mt. Shu; Bamboo Road's pavilion is a landmark, not a fourth registered recovery.

The frozen `CH8_WORLD` recovery points remain Lotus (53,57), Spore (17,70), and
Mt. Shu (48,40). Their prop-clear visible picnic anchors are deliberately adjacent
at Lotus (54,57), Spore (15,70), and Mt. Shu (49,40); Bamboo has none. Focused
geometry contracts verify the separation instead of moving the save-facing
recovery coordinates.

Final deterministic/editor signatures are the four dimensions above, the
27-panel Chapter 8 render set, the 275-map generated catalog, and the exhaustive
`maps_ch8` contract: **21/21 passing**.

## Lotus Harbor art, tenancy, and services

Lotus Harbor places twenty-four source facades from eight identities: Grand
Market, Harbor Office, Lantern Shop, Pagoda, Row House, Tea House, Temple, and
Theater. Two deterministic suffix lots remain locked, producing exactly
twenty-two live interiors, `lotus_harbor_unit_0` through `_21`.

The historical unlocked prefix is stable:

1. Lantern Shop → `lotus_harbor_unit_0` → realtor / Lotus Harbor Homes
2. Tea House → `lotus_harbor_unit_1` → home host / Lotus Row Townhouse
3. Temple → `lotus_harbor_unit_2` → dealer / Neon Crane Auto Salon
4. Tea House → `lotus_harbor_unit_3` → hotel clerk / Lotus Lantern Hotel

Every Lotus source has an explicit authored city-scale promotion, including
landmark treatment for Grand Market, Pagoda, Temple, and Theater. The authored
closed world prevents Lotus city-scale fallback. The existing market, property,
agency, dealership, hotel room, phone, ATM, dock, fuel, vehicle bay, and
`the_stretch` ids remain live. `citysvc_lotus_harbor_hotel_room` is included in
rendering and v25 recovery.

- Source facade identities: 8
- Exterior facade placements: 24
- Live generated units: 22
- Dedicated named Chapter 8 roles: 7
- Generated editor totals currently measure 62 legend/tile registrations, 325
  props, 276 facades, 10 regions, 99 NPCs, 1,461 dialogue IDs, 275 maps, 154
  trigger handlers, and 153 used trigger IDs. Final regeneration, generated-data
  freshness, content validation, and amenity checks all pass.

## Travel, story, and contextual cutscenes

Bert and Lucille bring the party only to the riverboat connection. The riverboat
owns the canonical arrival at Lotus Harbor, Lucille remains the safe world-network
and backtracking link, and the visible Yak Express owns the Spore Forest-to-Mt.
Shu leg.

The complete `ch8_journey` gallery preserves this exact seven-panel order:

1. `riverboat_to_lotus_harbor`
2. `lotus_harbor_arrival`
3. `spore_forest_scramble`
4. `yak_express_to_mt_shu`
5. `paper_guardians_false_folds`
6. `paper_dragon_reveal`
7. `temple_bell_resonance`

Runtime uses the one-panel ids `ch8_riverboat`, `ch8_arrival`, `ch8_spore`,
`ch8_yak`, `ch8_false_folds`, `ch8_dragon`, and `ch8_heartlight` at their real
world moments. `ch8_dragon_departed` and `ch8_heartlight_departed` are dedicated
post-Trust variants that omit Pippa when she has left. The corrected canonical
panels contain Rex, Faye, Milo, Dorin, and Pippa where she is present; Dorin is
not silently dropped from the chapter's painted party.

## Trust, Clicker, and Pippa compatibility

The runtime stages genuinely missing Trust beats rather than granting migration
flags: Lotus carries missing setup through `thread_trust_esc2`, Bamboo carries
`thread_trust_esc3`, Spore Forest carries `thread_trust_esc4`, and Mt. Shu owns
the climax and resolution. No migration or fallback invents FREE or STRINGS.

- FREE keeps Pippa.
- STRINGS keeps her only with `pippa_reconciled` and rewind count at most two.
- A decided, unreconciled STRINGS leaf persists her exact serialized hero record
  on the departed bench; restoration reuses that record and cannot duplicate her.
- Neutral/undecided state remains neutral; it is not interpreted as STRINGS.
- Pippa supplies early false-crease reads when present; the elder provides the
  same route-critical information when absent. Completion never requires Pippa.

Clicker compatibility stages the Lotus setup, Bamboo barge crisis, and public
clearing. Milo narrates the intervention, controls only unoccupied machinery,
saves the crowd, exposes the spoof, and leaves a visibly repaired/painted lock.
The Lotus Bargeman Caller is added exactly once.

## Mushroomized

The stable internal token is `mushroomize`; the player-facing name is
**Mushroomized**. Save v25 stores `{active, phase, source, recovery}`. Authored
hazards latch one deterministic phase until cured: phase 0 rotates movement
clockwise, phase 1 counter-clockwise, and phase 2 reverses it. Transformation
occurs after the shared `INPUT.dir()` read for on-foot overworld movement, so
keyboard, touch, and controller mappings share one logical rule while
confirm/cancel/menu/dialogue/cutscene input remains unchanged.

The status persists across map travel and save/load, records a clean fallback,
and clears on cure or chapter defeat recovery. Spore Puffer can inflict it in
battle. Spore Antidote is consumed only when it performs a cure; Scroll of Calm
uses the shared reusable-cure path; doctors are the guaranteed service fallback.
This resolves and supersedes the catalog-era deferred/doctor-only prose.

## Teleport Beta

Teleport Alpha remains the level-26 ability with a 96-native-pixel run-up and
2 PP cost. Teleport Beta is removed from level progression; the Mt. Shu elder is
the sole canonical teacher of `awake_teleport_b`, after “You run too much. Run
less.” Beta uses a 32-native-pixel run-up and 4 PP cost.

Only legitimately visited, story-open destinations with authored safe arrivals
are offered. A successful attempt charges once, reforms followers, and leaves
active/parked vehicles unchanged. A premature wall collision produces the
soot-faced failure, charges once, does not travel, and cannot strand the party.
Battle, cutscene, modal, incompatible-vehicle, and stolen-Locket states block
field use. v25 backfills Beta only from flags proving the elder or a later state;
level or early-map presence alone is not proof of teaching.

## Exactly five regional quests

| Quest | Persistent flow / footprint | Reward / Caller |
| --- | --- | --- |
| Brushes of Mt. Shu | Three forest brushes → return; completed banner and recovered-brush rack | `scroll_of_calm`; The Calligrapher heal 1,400 |
| Lanterns of the False Fold | Read three tooth folds → refold honest cranes → return; three corrected lanterns | `paper_crane_charm`; The Lantern Girl damage 820 |
| The Yak Who Waits | Carry/feed Yak Treats → repair route bell and walk loop → return; fed Yak/open depot loop | `jade_salamander_charm`; The Yak Handler damage 880 |
| The Harbor's Balance | Recover two tide weights → balance/deliver allotment → return; scales, quay, and market shelf | `river_beads`; The Harbor Master damage 900 |
| Tea for the Empty Chair | Brew remembrance tea → carry it to Mt. Shu → return; steaming cup at the chair | `temple_incense`; The Tea-House Monk heal 960 |

Each interaction is idempotent and save-compatible. Giver completion routes
through the existing hands-full transaction: a full bag leaves the quest ready
to retry, and the reward, done flag, and Caller commit exactly once only after
the item fits. Every quest remains completable through post-boss backtracking.

## Combat and Paper Dragon

The accepted regular roster is intentionally focused rather than inflated to the
obsolete twenty-enemy package:

- `paper_lantern_wisp`: 5,500 HP, level 36, floating/fire tell
- `spore_puffer`: 6,500 HP, level 37, real Mushroomized infliction
- `origami_warrior`: 8,000 HP, level 38; dedicated `refold` move kind lasts four
  turns, keeps its physical shield, replaces normal FIRE weakness/FREEZE
  resistance with FREEZE
  weakness/FIRE resistance while VOLT remains weak, feeds the same live profile
  to damage and Spy/Scope, then restores the normal profile on relaxation; the
  real battle handler/scout/status lifecycle is pinned by a focused runtime test
- `porcelain_warlord`: 11,000 HP, level 40, tested smaller-problem split

Each regular has an authored map tell, base/`_w1`/`_w2`, mini, battle hook,
drop, and retirement after Paper Dragon.

Paper Dragon is exactly **45,000 HP**, level 40, offense 80, defense 42, speed
34, no weakness, Volt resistant, and mind immune. It begins AIRBORNE and is
physical-immune only in that form. Vibe Volt and Bottle Rockets ground it for
exactly two turns even though Volt is resisted. Below 30% once, it switches to
a distinct BURNING base/wear family, plays the burn line, and doubles speed once.
Victory is normal HP victory.

Post-boss order is boss flag → retry-safe Paper Fan exactly once → safe restart →
unlocked bell stair → `ch8_heartlight_seen` → contextual branch panel → `ember8`
→ exact `embers = 8` → `ch8_complete`. Paper Fan state is independent of Ember
state, so full inventory cannot consume or skip the bell progression.

## Save v25 and development profiles

Save v25 adds the Mushroomized record and exact departed-hero bench and recovers
the four stable maps, twenty-two generated units, Lotus hotel room, and Chapter
8 parking through `CH8_WORLD`. It preserves party stats/equipment, inventory,
key items, money, properties, vehicles/fuel, Caller order, quests, flags, choices,
echoes/rewind count, previous Embers, Locket state, and unrelated coordinates.
It does not infer completion from location, invent branch choices, duplicate a
hero/reward/cure item, or rewrite unrelated maps. The step is deterministic,
idempotent, and future-version rejecting; nested Held Breath snapshots walk the
same chain.

All twenty-two appended Lotus units and the hotel room recover to the verified
prop-clear interior point (5,7); the earlier implementation-only unit point
(5,6) is not part of the final safety contract.

The thirteen TitleScene profiles are `arrival`, `city`, `barge`, `trustFree`,
`trustStrings`, `mushroomized`, `forestCured`, `brushes`, `yak`, `temple`,
`boss`, `postBoss`, and `complete`. They use `CH8_WORLD` feet, level ~40, seven
prior Embers until `complete`, coherent Trust/Pippa/Clicker and Teleport state,
unique rewards, and no false Chapter 9 arrival. `complete` has the boss,
Heartlight, Ember 8, chapter-complete, and one Paper Fan state.

## Art inventory and evidence paths

New/promoted/corrected production art includes:

- eight Lotus city-scale facade PNGs with retained generation sources;
- `lh_yak_handler`, `lotus_bargeman`, and `mt_shu_elder` 46-frame runtime/master
  pairs and retained directional sources;
- corrected seven-panel canonical Ch8 compositions plus two departed-Pippa
  Dragon/bell variants, all with retained source pairs;
- distinct Paper Dragon BURNING `_w1` and `_w2` art completing the BURNING
  base/wear family.

Retained and reused: the China strip, Bamboo/Spore edge props, four existing
Lotus quest-giver sheets, four regular enemy base/wear/mini families, Paper
Dragon base/wear/mini family, Spore Forest background, riverboat, Yak Express,
item/ability art, shared world props, and service interiors.

Evidence paths:

- Final Chapter render: `output/maps_ch8.png` — 1186×7084, 27 panels
  including all four exteriors, `citysvc_lotus_harbor_hotel_room`, and units
  0–21; rerendered after the picnic-anchor correction
- Lotus facades: `output/ch8_lotus_harbor_facades_contact.png`
- Corrected cutscenes: `output/ch8_cutscenes_corrected_contact.png`
- Strict visual report: `output/visual_identity_ch8.md` — 144/144 authored,
  0 legacy
- Strict animation reports: `output/character_animation_ch8.md` and `.html`
- Final original-resolution finding: no missing panel, disconnected geometry,
  or clipped title. The review renderer's long hotel-title issue was corrected;
  facade/cutscene contacts, named NPC sheets, regular-enemy families, and both
  Paper Dragon BURNING wear states were also reviewed without a release defect.

## Final command evidence

| Gate | Measured result |
| --- | --- |
| `npx.cmd tsc --noEmit` | **PASS** after final production and Refold-runtime-test changes |
| `npx.cmd tsx tools/door-audit.ts` | **PASS** — 275 maps; 0 real stuck landings, wrong-edge landings, or body-blocked doors; 12 intentional one-way transitions and 2 frozen-pyramid body-box waivers reported |
| `npm.cmd run mapeditor:gen` | **PASS** — 62 legend/tile registrations, 325 props, 276 facades, 10 regions, 99 NPCs, 21 tracks, 17 areas, 1,461 dialogue IDs, 275 maps, 154 handlers / 153 used trigger IDs |
| `npm.cmd run validate` | **PASS** — 272/275 maps clear static reachability with 3 frozen-rotor waivers; 273/275 clear encounter pressure with 2 frozen-rotor waivers; generated data current |
| Focused behavioral safety | **PASS** — actual-method Ch8 runtime 9/9; broader behavioral group 108/108; `ch8_combat` 6/6; real BattleScene Refold runtime 1/1; `maps_ch8` 21/21; cutscenes 13/13; items 42/42; quests 15/15; bosses 20/20; dungeons 130/130; migrations + Title profiles 230/230 |
| `npm.cmd run visuals:audit:strict -- --out=output/visual_identity_ch8.md` | **PASS** — 144/144 authored, 0 legacy |
| `npm.cmd run enemies:frames` | **PASS** — 147/147 battlers fully hi-res; 0 partial, 0 procedural |
| `npm.cmd run anim:audit:strict -- --out=output/character_animation_ch8.md --html=output/character_animation_ch8.html` | **PASS** — 84/100 clean, 0 errors, 0 warnings, 58 assessed review hints, exit 0 |
| `npm.cmd run balance` | **PASS** — Paper Dragon 45,000 HP at target level 40; conservative TTK 6, read/setup TTK 5 |
| `npm.cmd run test` | **PASS** — 123/123 files, 2,017/2,017 tests, 68.47 s final run |
| `npm.cmd run build` | **PASS** — TypeScript/validation plus 1,066 modules, Vite build 8.41 s; existing runtime-resolved Jay URL and chunk-size advisories accepted |
| `node_modules\.bin\vite-node.cmd tools/render-map.ts ch8` | **PASS** — `output/maps_ch8.png`, 1186×7084, 27 panels including hotel room and units 0–21; final original-resolution rereview clean |
| `npm.cmd run encounters` | **PASS** — 275 maps scored, 273 clear; only the 2 documented frozen-rotor pressure waivers reported |
| `git diff --check` | **PASS** |

## Original-resolution and live QA

Final original-resolution inspection covered district readability, facade
repetition/doors, harbor silhouette, Bamboo/Yak staging, Spore loop/hazard
telegraphing, false folds, temple escalation, boss/bell separation, encounter/
collision pressure, interiors, named NPC motion, enemy families, Paper Dragon
forms, riverboat, Yak, and every branch-safe panel variant.

- Final map-sheet finding: all 27 panels are present with no missing/disconnected
  geometry; the long hotel-title renderer issue is fixed. The city terraces,
  braided road, fungal safe-pocket loops, folded courts, Dragon arena, and
  separate bell destination remain legible at original resolution.
- Desktop live proof: at 1280×720, Lotus Harbor, Bamboo Road, and a regular
  Chapter 8 battle rendered; keyboard KeyZ advanced dialogue and combat. The
  thirteen deterministic developer profiles and actual-method tests cover the
  remaining story states; no unperformed end-to-end manual replay is claimed.
- Phone/touch live proof: portrait 390×844 and landscape 844×390 rendered;
  touch A and D-pad selection worked in Chapter 8 combat. Shared logical-input
  tests pin Mushroomized and menu behavior across keyboard/touch/controller maps.
- Teleport Alpha/Beta success and soot-faced wall failure: **PASS** in 13
  Teleport-domain tests, 6 menu tests, and the actual-method runtime suite;
  followers reform and parked vehicles remain byte-identical on success.
- Full-inventory quest/Paper Fan retries and hazardous save/load: **PASS** in
  actual-method reward/cache tests plus v25 migration/profile coverage.
- Browser console: an unhandled `navigator.storage.persist` rejection was found
  during live QA and patched in `native.ts`; a fresh settled Lotus Harbor tab
  after the fix reported **0 warnings and 0 errors**.
- Physical controller: **unavailable**. Automated gamepad tests do not equal a
  live hardware pass and no physical-controller pass is claimed.
- Development server/temp-tab shutdown: **PASS** — QA tabs finalized and the
  temporary Vite server stopped after the clean-console retest.

## Superseded assumptions

ADR-143 and this production record explicitly retire:

- “Chapter 8 is unlanded / has no maps / has no art”;
- the claim that registering the compact scaffold made it production-complete;
- Paper Dragon at 4,100 HP (executable canon is 45,000);
- the obsolete twenty-regular-enemy package quota (accepted roster is four plus boss);
- “Mushroomized remains deferred” or “doctor is the only cure”;
- automatic level-34 Teleport Beta (the elder is the sole teacher);
- scattered `LOTUS_HARBOR_LANDING` coordinates (the compatibility export now
  points into `CH8_WORLD`);
- generic/reused Yak Handler, Bargeman, or Elder identities;
- a party-painted reel that omits Dorin or shows departed Pippa;
- the idea that compile/manifest registration alone proves release readiness.

## Protected-work and staging proof

Preflight protected hashes:

- `docs/VERIFICATION.md` —
  `079CD5D7012FF9FB8C3DF40AA99181ED354B1E099B79861AF6A544A8476E5390`
- `docs/asset-lists/visual_identity.md` —
  `16E707CBE88D145D5885B377E6B089FA17C59F0A7A94A12AC0618016FB228F19`
- Protected `tmp/` status entries at preflight: 58

Final proof:

- Post-implementation hashes rechecked after the documentation pass: **PASS** —
  both exactly match the preflight values above.
- Protected paths absent from `git diff --cached --name-only`: **PASS** after
  final staging; protected/excluded count 0.
- Explicit intended-path staging and cached diff/check: **PASS** — exactly 142
  literal allow-list paths, 0 protected/excluded paths, cached diff check clean.
- Chapter 8 commit: this commit, `Complete Chapter 8 production rollout`.
- Push/merge: **none**; neither action was authorized or performed.

## Remaining work classification

- Required close work: none after the explicit index and commit proof below.
- Genuinely optional polish: no release-relevant item identified. The
  map-renderer hotel-title issue was fixed and is not open debt.
