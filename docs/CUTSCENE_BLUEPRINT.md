# Cutscene Blueprint — every beat, ch1–ch10

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

- **ch1–ch3:** maps + scenes exist → **hybrid-capable now.**
- **ch4–ch10:** the overworld maps **do not exist yet** in `src/data/maps*.ts`,
  and many NPC sprites are missing. **Until those maps are built, ch4–ch10
  cutscenes are STILLS** (the painted panels, already scaffolded in the registry).
  They each become HYBRID the moment their map + cast land.

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
ch4–ch10 have **no maps**. Hybrid is blocked until they exist. Priority order
matches play order:
- **ch4:** kvisthavn, lilleby, sleeper_spine, bootstep_moor, whisperwig site, resonance site
- **ch5:** minimus, minimus_major, the hedgerow (heartlight 5)
- **ch6:** zanzibel, savanna route, laughing_ruins, sphinx chamber *(cast sprites mostly exist already)*
- **ch7:** night_train, chandrapore, royal vivarium palace, throne room
- **ch8:** lotus_harbor, spore_forest, mt_shu, temple
- **ch9:** valea, castle_hoaxula, monastery, mute_mountain
- **ch10:** sea_of_silence, aurora_station, launch_site

Until a map exists, I keep that chapter's beats as stills and wire them at
chapter entry.

### C. Dialogue
Most ch2–ch10 beats have **no dialogue** authored (`captions` empty). Stills play
fine silent; hybrids need lines. I can draft in-voice first passes on request.

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

### Ch4 — Norway · ❌ NO MAPS YET → all STILL for now
fjord_establishing, lucille_north_sea_hop, kvisthavn_under_cliffs,
sleeper_spine_crossing, bootstep_moor_growth, whisperwig_reveal,
lilleby_giants_kneel, heartlight_4_deep_hum.
→ **STILL** today (registry `ch4_journey`). Become HYBRID when ch4 maps exist;
ch4 NPC PNG masters already exist — adding the 5 loaders is a cheap early win.

### Ch5 — Minimus · ❌ NO MAPS → all STILL
tabletop_duchy_establishing, grand_duchy_travel_in, minimus_major_tabletop_capital,
big_little_lens_build, pippa_matchbox_briefing, **pippa_joins_party (→HYBRID, Pippa ✅)**,
whiskerzilla_knighted, heartlight_5_bell_choir.
→ STILL today; `pippa_joins_party` is the prime hybrid once a Minimus map exists.

### Ch6 — Zanzibel · ❌ NO MAPS (but cast sprites mostly EXIST) → STILL
caravan_to_zanzibel, savanna_caravan_at_dusk, zanzibel_market,
courier_teaches_teleport_alpha, laughing_ruins, laughing_sphinx_riddle,
sphinx_chin_resonance.
→ STILL today. **Cast already has sprites** (caravan_captain, market_queen,
courier_mystic, ruins_guide, riddle_stone_elder) — so ch6 is the **best
hybrid-ready chapter the moment its maps are authored.**

### Ch7 — Chandrapore · ❌ NO MAPS → STILL
night_train_to_chandrapore, chandrapore_bazaars, locket_train_heist,
royal_vivarium_palace, cobra_raja_reveal, palace_throne_resonance,
cinema_about_the_party. → STILL; needs maps + bazaar/palace NPCs + Cobra Raja.

### Ch8 — Lotus Harbor · ❌ NO MAPS → STILL
riverboat_to_lotus_harbor, lotus_harbor_arrival, spore_forest_scramble,
yak_express_to_mt_shu, paper_guardians_false_folds, paper_dragon_reveal,
temple_bell_resonance. → STILL; dockworker sprite exists, rest need maps.

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
3. **ch6 cast → maps** — its sprites exist; authoring ch6 maps unlocks a whole
   hybrid chapter cheaply.
4. **ch4 loaders** — 5 PNG masters already exist; add loaders so ch4 is ready.
5. Everything else follows its **map** being authored. Until then: stills (live).
