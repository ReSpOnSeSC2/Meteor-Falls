# Cutscene Blueprint — every beat, ch1–ch10

## Chapter 4 contextual runtime contract

`ch4_journey` remains the complete gallery reel. Runtime plays `ch4_flight`,
`ch4_arrival`, `ch4_moor`, `ch4_lilleby`, `ch4_spine`, `ch4_whisperwig`, and
`ch4_heartlight` only at their matching world moments. Each is guarded by a
persistent flag; the flight cannot spoil Lilleby, the Spine, boss, or Ember.

## Chapter 8 contextual runtime contract

`ch8_journey` remains the complete seven-panel gallery reel in canonical order:
riverboat, Lotus arrival, Spore scramble, Yak Express, false folds, Paper Dragon,
then temple bell. Runtime uses `ch8_riverboat`, `ch8_arrival`, `ch8_spore`,
`ch8_yak`, `ch8_false_folds`, `ch8_dragon`, and `ch8_heartlight` only at their
matching world moments. The Dragon and Heartlight moments select
`ch8_dragon_departed` / `ch8_heartlight_departed` when Pippa has left, so the
painted party never contradicts serialized party state. All nine runtime/source
panel pairs are 1600×900. Riverboat owns arrival, Yak owns the temple leg, and
Lucille remains the non-spoiling backtracking connection.

How cutscenes are made now, the per-beat execution plan, and **the stages/sprites
that still need to be built** for the hybrid versions. Pairs with
[`PROMPT_WORLD_ANIMATIONS.md` §7](PROMPT_WORLD_ANIMATIONS.md) (the beat list) and
the code: `src/data/cutscenes.ts` (panel registry), `src/engine/cutscene.ts`
(panel player), `src/engine/cutsceneStage.ts` (the staging Director +
`showCard`/`letterbox`), `src/data/cutscenes_staged.ts` (staged scenes).

## The three execution modes

- **STILL** — a painted panel card with Ken Burns + caption (and optional
  sfx/flash/shake). For establishing shots, travel, arrivals, scenic reveals, and
  pure spectacle. Already playable via `playCutscene(scene, id)`.
- **HYBRID** — a painted card establishes "for a second," then we **cut to the
  live overworld map** and the real sprites act the beat out (walk/face/emote/say
  under letterbox + camera). For character beats: joins, briefings, boss reveals,
  resonances/awakenings, two-handers. Built with `showCard()` + `letterbox()` +
  the existing scene staging (or the `Director` for set-based scenes).
- **ANIMATED STILL** — a STILL whose panel is a short frame strip (`frames:N`),
  for intrinsic motion (a launch, a rotation). See the animation note in
  `cutscene-panel-system`.

**Rule of thumb:** environmental/travel/spectacle → STILL. Anyone speaks, joins,
or a Heartlight wakes → HYBRID (where a map exists to stage on).

## ⚠️ Reality check — what's stageable today

Hybrid needs an **overworld map to stage on** and **sprites for the cast**.

- **ch1–ch8:** executable map stages exist. Chapters 4, 6, 7, and 8 have
  production-scale world contracts; a beat may still deliberately use a STILL
  when spectacle or travel reads better than sprite blocking.
- **ch9–ch10:** retain their existing execution until their own production-stage
  and cast contracts are reviewed. Do not use Chapter 8's implementation to infer
  their hybrid readiness.

So "mostly use the overworld map" is the plan — it just can't apply to chapters
whose overworld doesn't exist yet. Those play as stills in the meantime, no waste.

---

## 🔨 STAGES / SPRITES I NEED YOU TO BUILD (the ask)

Ordered by payoff. Each unblocks the HYBRID column below.

### A. NPC sprites (overworld 8-dir, the cast that speaks)
| Need | For | Status |
|---|---|---|
| **Glint** (firefly spirit) | ch1 glints_prophecy | no sprite — or I fake it as a glow/sparkle (cheapest) |
| **Llama** overworld NPC loader | ch2 llama_jungle_paths | ambient sprite exists; needs an `NPC_CHARACTER_ART` entry |
| **Wintermoor groundskeeper, porter** | ch3 greenhouse/first-borrow | no art — author 2 sheets |
| **ch4 loaders:** kvisthavn_fisher, kvisthavn_shopkeeper, mayor_of_lilleby, lilleby_giant_child, lilleby_undertaker | ch4 town beats | **PNG masters already exist — just add `NPC_CHARACTER_ART` loaders** (cheap win) |
| **Buni, Count Hoaxula** | ch9 | no art — author 2 sheets |
| Boss overworld stand-ins (Whisperwig, Whiskerzilla, Cobra Raja, paper dragon, etc.) | reveals | optional — reveals can use the battle art as a card instead |

### B. Overworld maps (the actual stages — the big one)
Production stages now exist through Chapter 8. The Chapter 8 stage roster is
exactly `lotus_harbor`, `bamboo_road`, `spore_forest`, and `mt_shu_temple`;
do not revive the historical “no maps” blocker. Remaining stage work belongs to:
- **ch9:** valea, castle_hoaxula, monastery, mute_mountain
- **ch10:** sea_of_silence, aurora_station, launch_site

Until a map exists, I keep that chapter's beats as stills and wire them at
chapter entry.

### C. Dialogue
Historical scaffold panels often had empty captions. Chapter 8's contextual
runtime dialogue and branch reactions are now authored in the world scenes;
do not classify it as blocked on dialogue. Review later chapters beat by beat
rather than carrying the old ch2–ch10 blanket assumption forward.

---

## Per-beat plan

Legend: **execution** = what it is now / what it becomes. **Needs** = blocker for the hybrid.

### Ch1 — Otterbrook · maps EXIST · hybrid-capable
| Beat | Execution | Stage | Cast | Status / Needs |
|---|---|---|---|---|
| meteor_2am · hickory_hill · otterbrook_at_night | **STILL** | — | — | ✅ DONE — `ch1_opening`, wired in `playOpeningCutscene()` |
| glints_prophecy | **HYBRID** | crater map | Rex, Glint | Glint as glow/sparkle (no sprite) — ready to wire into `craterScene` |
| titanic_tick_reveal | **HYBRID** | crater map | Rex, the Tick | use battle art as the reveal image |
| bug_zapper | **HYBRID** | porch | Rex, the ember | wire into `porchScene` |
| moms_payphone_call | **HYBRID** | Brickton (payphone) | Rex, Mom (voice) | rex + payphone prop — clean live-map hybrid |
| first_heartlight | **STAGED HYBRID** | set (Resonance Site) | Mia, Rex, Ember | ✅ BUILT — `ch1FirstHeartlight`, `playFirstHeartlightStaged()` (drivable; wire to ch1-close trigger) |

### Ch2 — Puerto Sol / Valle Dorado · maps EXIST · partly wired
| Beat | Execution | Stage | Cast | Needs |
|---|---|---|---|---|
| banana_boat_to_puerto_sol | STILL | boat | Rex, Faye, Senora | card over `boatCutscene` |
| puerto_sol_arrival | STILL→hybrid | puerto_sol | Rex, Faye | wire card into `puerto_arrival` case |
| llama_jungle_paths | STILL | jungle | +llama | llama NPC loader for hybrid |
| valle_dorado_wishers | **HYBRID** | valle_dorado | wisherA/B/C, wokeA/B/C ✅ | dialogue |
| rotating_step_pyramid | STILL | pyramid | — | environmental |
| pyramid_apex_heartlight | **HYBRID** | pyramid_4 | Rex, Faye, idol | resonance; wire near `apex_grin` |
| gilded_grin_reveal | **HYBRID** | pyramid_4 | Grin (card) | wire card into `grinScene` |

### Ch3 — Wintermoor · maps EXIST · scenes wired
| Beat | Execution | Stage | Cast | Needs |
|---|---|---|---|---|
| lucille_to_wintermoor | STILL | biplane | Rex, Faye, Bert, Milo | card into `ch3ArrivalScene` |
| milo_greenhouse_crash | **HYBRID** | wintermoor grounds | Milo ✅, groundskeeper ❌ | groundskeeper sprite + dialogue |
| porter_first_borrow | **HYBRID** | wintermoor | porter ❌ | porter sprite + dialogue |
| old_stones_resonance | **HYBRID** | old_stones | Rex, Faye, Milo | wire card into `oldStonesScene` |
| wintermoor_machine_fog | STILL | grounds | — | environmental |
| headmaster_mainframe | **HYBRID** | wintermoor_f3 | Headmaster (card) | wire into `mainframeBossScene` |
| heartlight_3_machine_fog_lifts | **HYBRID** | old_stones | party | resonance close |

### Ch4 — Norway · ✅ PRODUCTION MAPS → CONTEXTUAL RUNTIME PANELS
fjord_establishing, lucille_north_sea_hop, kvisthavn_under_cliffs,
sleeper_spine_crossing, bootstep_moor_growth, whisperwig_reveal,
lilleby_giants_kneel, heartlight_4_deep_hum. `ch4_journey` retains the complete
gallery while the contextual ids listed at the top of this document play at
their matching production-map moments.

### Ch5 — Minimus · ✅ MAPS EXIST → CONTEXTUAL RUNTIME PANELS
tabletop_duchy_establishing, grand_duchy_travel_in, minimus_major_tabletop_capital,
big_little_lens_build, pippa_matchbox_briefing, **pippa_joins_party (→HYBRID, Pippa ✅)**,
whiskerzilla_knighted, heartlight_5_bell_choir.
→ `ch5_journey` retains the full gallery; runtime uses `ch5_flight`,
`ch5_arrival`, `ch5_lens`, `ch5_join`, `ch5_knighted`, and `ch5_heartlight`.

### Ch6 — Zanzibel · ✅ PRODUCTION MAPS → CONTEXTUAL RUNTIME PANELS
caravan_to_zanzibel, savanna_caravan_at_dusk, zanzibel_market,
courier_teaches_teleport_alpha, laughing_ruins, laughing_sphinx_riddle,
sphinx_chin_resonance.
→ `ch6_journey` retains the full gallery in that exact order. Runtime now plays
spoiler-safe contextual ids: `ch6_flight`, `ch6_arrival`, `ch6_courier`,
`ch6_ruins`, `ch6_sphinx`, and `ch6_heartlight`; `ch6_held_breath` remains the
dedicated rewind awakening. The courier event contextualizes Jay’s established
level-26 Teleport Alpha without creating a second ability-grant path.

### Ch7 — Chandrapore · ✅ PRODUCTION MAPS → CONTEXTUAL RUNTIME PANELS
night_train_to_chandrapore, chandrapore_bazaars, locket_train_heist,
royal_vivarium_palace, cobra_raja_reveal, palace_throne_resonance,
cinema_about_the_party. → `ch7_journey` retains the full gallery in that order.
Runtime uses `ch7_train_in`, `ch7_bazaar`, `ch7_heist`, `ch7_palace`,
`ch7_raja`, `ch7_heartlight`, and `ch7_cinema`, preventing arrival/travel from
spoiling the heist, Raja, Heartlight, or cinema beats.

### Ch8 — Lotus Harbor · ✅ PRODUCTION MAPS → CONTEXTUAL RUNTIME PANELS
riverboat_to_lotus_harbor, lotus_harbor_arrival, spore_forest_scramble,
yak_express_to_mt_shu, paper_guardians_false_folds, paper_dragon_reveal,
temple_bell_resonance. → `ch8_journey` retains that exact seven-beat gallery
order. Runtime uses `ch8_riverboat`, `ch8_arrival`, `ch8_spore`, `ch8_yak`,
`ch8_false_folds`, `ch8_dragon`, and `ch8_heartlight`. Post-Trust Dragon and
bell cards branch to dedicated departed-Pippa panels when required. The
production world supplies the riverboat quay, harbor terraces, forest safe
pockets, Yak terrace, folded guardian halls, Dragon arena, and separate bell
approach; Chapter 8 is no longer blocked on maps or named NPC sheets.

### Ch9 — Valea · ❌ NO MAPS → STILL
orient_less_express_to_valea, valea_stelelor_arrival, buni_feast_basket,
castle_hoaxula, count_hoaxula_unmasked, monastery_bell_tower_resonance,
**trial_of_the_mute_mountain (Dorin joins ✅ + dialogue exists →HYBRID)**.
→ STILL; the Dorin trial is the prime hybrid once a Valea map exists. Needs
Buni + Count Hoaxula sprites.

### Ch10 — Mars / Endgame · ❌ NO MAPS → STILL / SPECTACLE
sea_of_silence_arrival, tiki_magma_golem, mauna_lani_parts_run,
snowcat_run_to_aurora_station, frost_sentinel, aurora_station_decodes_mars,
the_calling_worldwide_phones, **phone_dad_phone_mom (Rex+Mom ✅ →HYBRID)**,
**the_long_shot_launch (→ANIMATED STILL)**, hush_undone, homesong_full,
**mia_prays (Mia ✅ →HYBRID)**, player_name_confirm, extended_credits.
→ Mostly spectacle STILLS; the family call and Mia's prayer are intimate hybrids;
the launch + homesong are the animation candidates.

---

## Build order (recommendation)

1. **ch1 hybrids** — wire `craterScene`/`porchScene`/mom + the staged first
   Heartlight (maps/cast all exist). *Fully buildable now.*
2. **ch2–ch3 hybrids** — prepend `showCard()` to the wired scenes + author the
   missing groundskeeper/porter sprites. *Buildable now.*
3. **Maintain contextual cuts for production chapters 4–8** — preserve each full
   gallery reel and attach only spoiler-safe one-beat ids at runtime.
4. **Ch9–10 stages and missing cast** — review those chapters independently;
   until then their deliberate stills remain live.
