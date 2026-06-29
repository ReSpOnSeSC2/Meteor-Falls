# Visual Identity Audit

Authored means the runtime key resolves through `src/spritegen/authored.ts` and a committed `assets/art/...` file. Legacy means a procedural mini, generated draw function, borrowed generic character sheet, or orphaned authored file remains in the identity path.

- Enemies: 129
- Fully authored identities: 129
- Legacy identities: 0
- Orphan authored battle images: 0
- Orphan authored overworld sheets: 0
- Authored battle PNGs on disk but not registered for current runtime: 97

## Enemy Rows

| enemy | map use | battle | field | status | notes |
|---|---|---|---|---|---|
| cranky_mailbox | otterbrook, meadow_mile, hill_road, brickton | battle_cranky_mailbox | ow_enemy_cranky_mailbox | authored | - |
| runaway_lawnmower | otterbrook, meadow_far, hickory_trail | battle_runaway_lawnmower | ow_enemy_runaway_lawnmower | authored | - |
| coily_cicada | meadow_mile, meadow_woods, hill_road, hickory_trail, whisperwood_rise, hickory_hill | battle_coily_cicada | ow_enemy_coily_cicada | authored | - |
| blazer_smiler | meadow_overpass, brickton, dos_f1, dos_f2, dos_f3 | battle_blazer_smiler | ow_enemy_blazer_smiler | authored | - |
| pigeon_gang | otterbrook, meadow_far, meadow_overpass, brickton | battle_pigeon_gang | ow_enemy_pigeon_gang | authored | - |
| hill_slug_deluxe | meadow_woods, hill_road, hickory_trail, whisperwood_rise, hickory_hill | battle_hill_slug | ow_enemy_hill_slug_deluxe | authored | - |
| borden | - | battle_constable_borden | ow_enemy_borden | authored | - |
| sprinkler_sentry | otterbrook | battle_sprinkler_sentry | ow_enemy_sprinkler_sentry | authored | - |
| recycling_raccoon | otterbrook, meadow_woods | battle_recycling_raccoon | ow_enemy_recycling_raccoon | authored | - |
| skeeter_swarm | otterbrook, meadow_far, hill_road, whisperwood_rise | battle_skeeter_swarm | mini:mini_skeeter_swarm | authored | - |
| unionized_gnome | otterbrook, hill_road | battle_unionized_gnome | ow_enemy_unionized_gnome | authored | - |
| mandatory_memo | dos_f2 | battle_mandatory_memo | ow_enemy_mandatory_memo | authored | - |
| motivational_poster | dos_f2 | battle_motivational_poster | ow_enemy_motivational_poster | authored | - |
| quota_clock | dos_f2 | battle_quota_clock | ow_enemy_quota_clock | authored | - |
| expired_meter | brickton | battle_expired_meter | ow_enemy_expired_meter | authored | - |
| showroom_mannequin | brickton | battle_showroom_mannequin | ow_enemy_showroom_mannequin | authored | - |
| good_investment | otterbrook, meadow_overpass | battle_good_investment | ow_enemy_good_investment | authored | - |
| rogue_icecream_truck | brickton | battle_rogue_icecream_truck | ow_enemy_rogue_icecream_truck | authored | - |
| tick_nymph | hickory_hill | battle_tick_nymph | ow_enemy_tick_nymph | authored | - |
| the_suit | dos_f2 | battle_the_suit | ow_enemy_the_suit | authored | - |
| pickpocket_parrot | puerto_sol, jungle_1 | battle_pickpocket_parrot | ow_enemy_pickpocket_parrot | authored | - |
| gilded_beetle | jungle_2, pyramid_ante, pyramid_4 | battle_gilded_beetle | ow_enemy_gilded_beetle | authored | - |
| cursed_souvenir | jungle_2, grotto, pyramid_2 | battle_cursed_souvenir | ow_enemy_cursed_souvenir | authored | - |
| step_mask | pyramid_ante, pyramid_1, pyramid_2, pyramid_4 | battle_step_mask | ow_enemy_step_mask | authored | - |
| banana_bunch | jungle_1, jungle_2 | battle_banana_bunch | ow_enemy_banana_bunch | authored | - |
| jungle_jitterbug | jungle_1, jungle_2, pyramid_3 | battle_jungle_jitterbug | ow_enemy_jungle_jitterbug | authored | - |
| brass_market_mimic | puerto_sol | battle_brass_market_mimic | mini:mini_brass_market_mimic | authored | - |
| bronze_mask_guardian | pyramid_ante | battle_bronze_mask_guardian | mini:mini_bronze_mask_guardian | authored | - |
| cackling_mask | pyramid_2 | battle_cackling_mask | mini:mini_cackling_mask | authored | - |
| confetti_cannon | jungle_1 | battle_confetti_cannon | mini:mini_confetti_cannon | authored | - |
| postage_stampede | jungle_1 | battle_postage_stampede | mini:mini_postage_stampede | authored | - |
| prefect_drone | wintermoor_grounds, wintermoor_dorm | battle_prefect_drone | ow_enemy_prefect_drone | authored | - |
| possessed_textbook | wintermoor_f1 | battle_possessed_textbook | ow_enemy_possessed_textbook | authored | - |
| fog_hound | foggy_moor, the_old_stones | battle_fog_hound | ow_enemy_fog_hound | authored | - |
| tea_poltergeist | wintermoor_f1 | battle_tea_poltergeist | ow_enemy_tea_poltergeist | authored | - |
| cricket_eleven | wintermoor_grounds | battle_cricket_eleven | ow_enemy_cricket_eleven | authored | - |
| greenhouse_creeper | wintermoor_boiler | battle_greenhouse_creeper | ow_enemy_greenhouse_creeper | authored | - |
| pillar_box | foggybottom | battle_pillar_box | ow_enemy_pillar_box | authored | - |
| brolly_bat | foggybottom, foggy_moor | battle_brolly_bat | ow_enemy_brolly_bat | authored | - |
| moor_sheep | foggy_moor | battle_moor_sheep | ow_enemy_moor_sheep | authored | - |
| soot_imp | wintermoor_boiler | battle_soot_imp | ow_enemy_soot_imp | authored | - |
| detention_desk | wintermoor_f2 | battle_detention_desk | ow_enemy_detention_desk | authored | - |
| schedule_bell | wintermoor_grounds, wintermoor_f1, wintermoor_f2 | battle_schedule_bell | ow_enemy_schedule_bell | authored | - |
| foggy_locker | wintermoor_f2 | battle_foggy_locker | ow_enemy_foggy_locker | authored | - |
| tea_trolley | wintermoor_f2 | battle_tea_trolley | ow_enemy_tea_trolley | authored | - |
| telephone_box | wintermoor_f1 | battle_telephone_box | ow_enemy_telephone_box | authored | - |
| overdue_tome | wintermoor_f1 | battle_overdue_tome | ow_enemy_overdue_tome | authored | - |
| roman_sentry | foggy_moor, the_old_stones | battle_roman_sentry | ow_enemy_roman_sentry | authored | - |
| head_prefect | wintermoor_f3 | battle_head_prefect | ow_enemy_head_prefect | authored | - |
| boiler_golem | wintermoor_boiler | battle_boiler_golem | ow_enemy_boiler_golem | authored | - |
| the_invigilator | wintermoor_f3 | battle_the_invigilator | ow_enemy_the_invigilator | authored | - |
| gilded_grin | - | battle_gilded_grin | mini:mini_mask | authored | - |
| headmaster_mainframe | - | battle_headmaster_mainframe | mini:mini_ch3_lurker_3 | authored | - |
| titanic_tick | - | battle_titanic_tick | mini:mini_hill_slug | authored | - |
| hush_sentinel | - | battle_hush_sentinel | mini:mini_hill_slug | authored | - |
| colossal_gnat | bootstep_moor | battle_colossal_gnat | mini:mini_colossal_gnat | authored | - |
| knitting_needles | lilleby | battle_knitting_needles | mini:mini_knitting_needles | authored | - |
| thunder_snail | bootstep_moor | battle_thunder_snail | mini:mini_thunder_snail | authored | - |
| dog_sized_berry | bootstep_moor | battle_giant_berry_blocker | mini:mini_giant_berry_blocker | authored | - |
| hushed_gull | kvisthavn | battle_fjord_gull_bully | mini:mini_fjord_gull_bully | authored | - |
| junior_jotun | bootstep_moor | battle_junior_jotun | mini:mini_junior_jotun | authored | - |
| moor_midge_cloud | bootstep_moor | battle_moor_midge_cloud | mini:mini_moor_midge_cloud | authored | - |
| boulder_lichen | bootstep_moor | battle_boulder_lichen | mini:mini_boulder_lichen | authored | - |
| frost_hare | bootstep_moor | battle_frost_hare | mini:mini_frost_hare | authored | - |
| bog_cotton_wisp | bootstep_moor | battle_bog_cotton_wisp | mini:mini_bog_cotton_wisp | authored | - |
| earwax_golem | spine_shoulder, spine_ear | battle_earwax_golem | mini:mini_earwax_golem | authored | - |
| dream_leech | spine_hand, spine_ear | battle_dream_leech | mini:mini_dream_leech | authored | - |
| snore_gust | spine_hand, spine_shoulder | battle_snore_gust | mini:mini_snore_gust | authored | - |
| giant_house_cat | lilleby | battle_giant_house_cat | mini:mini_giant_house_cat | authored | - |
| lost_mitten | lilleby | battle_lost_mitten | mini:mini_lost_mitten | authored | - |
| amber_hoard_troll | bootstep_moor | battle_amber_hoard_troll | mini:mini_amber_hoard_troll | authored | - |
| aurora_moth | bootstep_moor | battle_aurora_moth | mini:mini_aurora_moth | authored | - |
| hushed_skua | bootstep_moor | battle_hushed_skua | mini:mini_hushed_skua | authored | - |
| frost_jotun_elder | spine_shoulder | battle_frost_jotun_elder | mini:mini_frost_jotun_elder | authored | - |
| bridge_berry | - | battle_giant_berry_blocker | mini:mini_giant_berry_blocker | authored | - |
| the_whisperwig | - | battle_the_whisperwig | mini:mini_souvenir | authored | - |
| tin_parade | procession_way | battle_tin_parade | mini:mini_tin_parade | authored | - |
| duelist_pip | procession_way | battle_duelist_pip | mini:mini_duelist_pip | authored | - |
| crumb_cannoneer | procession_way | battle_crumb_cannoneer | mini:mini_crumb_cannoneer | authored | - |
| powderwig_wasp | procession_way, the_hedgerow | battle_powderwig_wasp | mini:mini_powderwig_wasp | authored | - |
| windup_wyrmlet | procession_way | battle_windup_wyrmlet | mini:mini_windup_wyrmlet | authored | - |
| dust_bunny | procession_way, the_hedgerow | battle_dust_bunny | mini:mini_dust_bunny | authored | - |
| whistle_guard | procession_way | battle_whistle_guard | mini:mini_whistle_guard | authored | - |
| census_pigeon | procession_way | battle_census_pigeon | mini:mini_census_pigeon | authored | - |
| toll_clerk | procession_way | battle_toll_clerk | mini:mini_toll_clerk | authored | - |
| cobble_mite | procession_way | battle_cobble_mite | mini:mini_cobble_mite | authored | - |
| hedge_sprite | the_hedgerow | battle_hedge_sprite | mini:mini_hedge_sprite | authored | - |
| topiary_knight | the_hedgerow | battle_topiary_knight | mini:mini_topiary_knight | authored | - |
| bramble_tangle | the_hedgerow | battle_bramble_tangle | mini:mini_bramble_tangle | authored | - |
| lapel_pin_mob | minimus_major | battle_lapel_pin_mob | mini:mini_lapel_pin_mob | authored | - |
| town_crier | minimus_major | battle_town_crier | mini:mini_town_crier | authored | - |
| snuffbox_beetle | procession_way | battle_snuffbox_beetle | mini:mini_snuffbox_beetle | authored | - |
| tax_assessor | procession_way | battle_tax_assessor | mini:mini_tax_assessor | authored | - |
| halberd_column | the_hedgerow | battle_halberd_column | mini:mini_halberd_column | authored | - |
| bell_ringer_acolyte | the_hedgerow | battle_bell_ringer_acolyte | mini:mini_bell_ringer_acolyte | authored | - |
| grand_parade | procession_way | battle_grand_parade | mini:mini_grand_parade | authored | - |
| whiskerzilla | - | battle_whiskerzilla | mini:mini_hill_slug | authored | - |
| flat_bell | - | battle_flat_bell | mini:mini_souvenir | authored | - |
| caravan_hyena_pack | savanna_run | battle_caravan_hyena_pack | mini:mini_caravan_hyena_pack | authored | - |
| baobab_root_snare | savanna_run | battle_baobab_root_snare | mini:mini_baobab_root_snare | authored | - |
| laughing_dust_pot | laughing_ruins | battle_laughing_dust_pot | mini:mini_laughing_dust_pot | authored | - |
| sphinx_paw_shadow | laughing_ruins | battle_sphinx_paw_shadow | mini:mini_sphinx_paw_shadow | authored | - |
| hollow_jackal | savanna_run | battle_hollow_jackal | mini:mini_hollow_jackal | authored | - |
| dust_devil_charm | savanna_run | battle_dust_devil_charm | mini:mini_dust_devil_charm | authored | - |
| salt_flat_lurker | savanna_run | battle_salt_flat_lurker | mini:mini_salt_flat_lurker | authored | - |
| thornbush_bomber | savanna_run | battle_thornbush_bomber | mini:mini_thornbush_bomber | authored | - |
| ribbon_serpent | savanna_run | battle_ribbon_serpent | mini:mini_ribbon_serpent | authored | - |
| canteen_mirage | savanna_run | battle_canteen_mirage | mini:mini_canteen_mirage | authored | - |
| trade_salt_heap | savanna_run | battle_trade_salt_heap | mini:mini_trade_salt_heap | authored | - |
| mirage_vendor | savanna_run | battle_mirage_vendor | mini:mini_mirage_vendor | authored | - |
| griot_string_snare | savanna_run | battle_griot_string_snare | mini:mini_griot_string_snare | authored | - |
| town_gossip_troll | savanna_run | battle_town_gossip_troll | mini:mini_town_gossip_troll | authored | - |
| punchline_head | laughing_ruins | battle_punchline_head | mini:mini_punchline_head | authored | - |
| echoing_riddle | laughing_ruins | battle_echoing_riddle | mini:mini_echoing_riddle | authored | - |
| laughing_sphinx_riddle | laughing_ruins | battle_laughing_sphinx_riddle | mini:mini_laughing_sphinx_riddle | authored | - |
| rare_riddle_ring | laughing_ruins | battle_rare_riddle_ring | mini:mini_rare_riddle_ring | authored | - |
| sunbaked_idol | laughing_ruins | battle_sunbaked_idol | mini:mini_sunbaked_idol | authored | - |
| fastest_man_echo | laughing_ruins | battle_fastest_man_echo | mini:mini_fastest_man_echo | authored | - |
| laughing_sphinx | - | battle_laughing_sphinx | mini:mini_laughing_sphinx | authored | - |
| rickshaw_swarm | monsoon_road | battle_rickshaw_swarm | mini:mini_rickshaw_swarm | authored | - |
| spice_djinn | monsoon_road, night_train | battle_spice_djinn | mini:mini_spice_djinn | authored | - |
| temple_macaque | monsoon_road, night_train | battle_temple_macaque | mini:mini_temple_macaque | authored | - |
| naga_sentry | monsoon_road, night_train | battle_naga_sentry | mini:mini_naga_sentry | authored | - |
| cobra_raja | - | battle_cobra_raja | mini:mini_cobra_raja | authored | - |
| paper_lantern_wisp | bamboo_road | battle_paper_lantern_wisp | mini:mini_paper_lantern_wisp | authored | - |
| spore_puffer | bamboo_road, spore_forest | battle_spore_puffer | mini:mini_spore_puffer | authored | - |
| origami_warrior | bamboo_road, spore_forest | battle_origami_warrior | mini:mini_origami_warrior | authored | - |
| porcelain_warlord | spore_forest | battle_porcelain_warlord | mini:mini_porcelain_warlord | authored | - |
| paper_dragon | - | battle_paper_dragon | mini:mini_paper_dragon | authored | - |

## Procedural Overworld Roamer Queue (retire these)

Each row still resolves to a PROCEDURAL mini (the old pixel style). Cheapest lift (CLAUDE.md): DERIVE an authored hi-res mini from the enemy's battler (`tools/derive-ch5-minis.ts` — crop-to-alpha + downscale) and register it in `ENEMY_MINI_ART`. For the directional gold standard instead, author an 8-frame `768x128` sheet (eight `96x128` frames) + register in `ENEMY_OVERWORLD_SHEET_IDS` / `src/spritegen/authored.ts`.

| enemy | display name | map use | battle reference | current fallback | output PNG | runtime key |
|---|---|---|---|---|---|---|

## Orphans

- Battle: none
- Overworld: none

## Authored Disk Assets Not In Current Runtime

- battle_acorn_catapult
- battle_acorn_catapult_w1
- battle_acorn_catapult_w2
- battle_angry_lutefisk_tin
- battle_angry_lutefisk_tin_w1
- battle_angry_lutefisk_tin_w2
- battle_ballot_box_brawler
- battle_ballot_box_brawler_w1
- battle_ballot_box_brawler_w2
- battle_bootstep_boulder
- battle_bootstep_boulder_w1
- battle_bootstep_boulder_w2
- battle_button_shield_guard
- battle_button_shield_guard_w1
- battle_button_shield_guard_w2
- battle_census_ledger_wraith
- battle_census_ledger_wraith_w1
- battle_census_ledger_wraith_w2
- battle_cold_charm_mimic
- battle_cold_charm_mimic_w1
- battle_cold_charm_mimic_w2
- battle_crumb_knight
- battle_crumb_knight_w1
- battle_crumb_knight_w2
- battle_decree_scroll_swarm
- battle_decree_scroll_swarm_w1
- battle_decree_scroll_swarm_w2
- battle_driftwall_snowbank
- battle_driftwall_snowbank_w1
- battle_driftwall_snowbank_w2
- battle_earwax_wisp
- battle_earwax_wisp_w1
- battle_earwax_wisp_w2
- battle_false_exit_hedge
- battle_false_exit_hedge_w1
- battle_false_exit_hedge_w2
- battle_frostbitten_postcard
- battle_frostbitten_postcard_w1
- battle_frostbitten_postcard_w2
- battle_giant_banknote_folder
- battle_giant_banknote_folder_w1
- battle_giant_banknote_folder_w2
- battle_gilt_thimble_guard
- battle_gilt_thimble_guard_w1
- battle_gilt_thimble_guard_w2
- battle_magnifying_lens_mite
- battle_magnifying_lens_mite_w1
- battle_magnifying_lens_mite_w2
- battle_moor_lantern
- battle_moor_lantern_w1
- battle_moor_lantern_w2
- battle_needle_fencer
- battle_needle_fencer_w1
- battle_needle_fencer_w2
- battle_oversized_cod
- battle_oversized_cod_w1
- battle_oversized_cod_w2
- battle_pocket_lint_sprite
- battle_pocket_lint_sprite_w1
- battle_pocket_lint_sprite_w2
- battle_rare_crown_jewel_chip
- battle_rare_crown_jewel_chip_w1
- battle_rare_crown_jewel_chip_w2
- battle_rare_giant_button
- battle_rare_giant_button_w1
- battle_rare_giant_button_w2
- battle_ribcage_rattler
- battle_ribcage_rattler_w1
- battle_ribcage_rattler_w2
- battle_royal_doubloon_roller
- battle_royal_doubloon_roller_w1
- battle_royal_doubloon_roller_w2
- battle_sigrids_lost_lens
- battle_sigrids_lost_lens_w1
- battle_sigrids_lost_lens_w2
- battle_sleepwalking_helmet
- battle_sleepwalking_helmet_w1
- battle_sleepwalking_helmet_w2
- battle_snowshoe_phantom
- battle_snowshoe_phantom_w1
- battle_snowshoe_phantom_w2
- battle_spine_tick
- battle_spine_tick_w1
- battle_spine_tick_w2
- battle_teacup_tilter
- battle_teacup_tilter_w1
- battle_teacup_tilter_w2
- battle_thimble_drummer
- battle_thimble_drummer_w1
- battle_thimble_drummer_w2
- battle_tin_soldier_squad
- battle_tin_soldier_squad_w1
- battle_tin_soldier_squad_w2
- battle_whiskerzilla_knighted
- battle_woolly_pressure_kettle
- battle_woolly_pressure_kettle_w1
- battle_woolly_pressure_kettle_w2
