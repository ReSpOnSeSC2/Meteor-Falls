# Visual Identity Audit

Authored means the runtime key resolves through `src/spritegen/authored.ts` and a committed `assets/art/...` file. Legacy means a procedural mini, generated draw function, borrowed generic character sheet, or orphaned authored file remains in the identity path.

- Enemies: 49
- Fully authored identities: 38
- Legacy identities: 11
- Orphan authored battle images: 0
- Orphan authored overworld sheets: 0
- Authored battle PNGs on disk but not registered for current runtime: 192

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
| skeeter_swarm | otterbrook, meadow_far, hill_road, whisperwood_rise | battle_skeeter_swarm | mini:mini_skeeter_swarm | legacy | uses legacy mini 'mini_skeeter_swarm' instead of authored overworld art |
| unionized_gnome | otterbrook, hill_road | battle_unionized_gnome | ow_enemy_unionized_gnome | authored | - |
| mandatory_memo | dos_f2 | battle_mandatory_memo | ow_enemy_mandatory_memo | authored | - |
| motivational_poster | dos_f2 | battle_motivational_poster | ow_enemy_motivational_poster | authored | - |
| quota_clock | dos_f2 | battle_quota_clock | mini:mini_runaway_lawnmower | legacy | uses legacy mini 'mini_runaway_lawnmower' instead of authored overworld art |
| expired_meter | brickton | battle_expired_meter | mini:mini_cranky_mailbox | legacy | uses legacy mini 'mini_cranky_mailbox' instead of authored overworld art |
| showroom_mannequin | brickton | battle_showroom_mannequin | mini:mini_pigeon_gang | legacy | uses legacy mini 'mini_pigeon_gang' instead of authored overworld art |
| good_investment | otterbrook, meadow_overpass | battle_good_investment | mini:mini_pigeon_gang | legacy | uses legacy mini 'mini_pigeon_gang' instead of authored overworld art |
| rogue_icecream_truck | brickton | battle_rogue_icecream_truck | mini:mini_runaway_lawnmower | legacy | uses legacy mini 'mini_runaway_lawnmower' instead of authored overworld art |
| tick_nymph | hickory_hill | battle_tick_nymph | mini:mini_coily_cicada | legacy | uses legacy mini 'mini_coily_cicada' instead of authored overworld art |
| the_suit | dos_f2 | battle_the_suit | mini:mini_pigeon_gang | legacy | uses legacy mini 'mini_pigeon_gang' instead of authored overworld art |
| pickpocket_parrot | puerto_sol, jungle_1 | battle_pickpocket_parrot | ow_enemy_pickpocket_parrot | authored | - |
| gilded_beetle | jungle_2, pyramid_ante, pyramid_4 | battle_gilded_beetle | ow_enemy_gilded_beetle | authored | - |
| cursed_souvenir | jungle_2, grotto, pyramid_2 | battle_cursed_souvenir | ow_enemy_cursed_souvenir | authored | - |
| step_mask | pyramid_ante, pyramid_1, pyramid_2, pyramid_4 | battle_step_mask | ow_enemy_step_mask | authored | - |
| banana_bunch | jungle_1, jungle_2 | battle_banana_bunch | ow_enemy_banana_bunch | authored | - |
| jungle_jitterbug | jungle_1, jungle_2, pyramid_3 | battle_jungle_jitterbug | ow_enemy_jungle_jitterbug | authored | - |
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
| gilded_grin | - | battle_gilded_grin | mini:mini_mask | legacy | uses legacy mini 'mini_mask' instead of authored overworld art |
| headmaster_mainframe | - | battle_headmaster_mainframe | mini:mini_ch3_lurker_3 | legacy | uses legacy mini 'mini_ch3_lurker_3' instead of authored overworld art |
| titanic_tick | - | battle_titanic_tick | mini:mini_hill_slug | legacy | uses legacy mini 'mini_hill_slug' instead of authored overworld art |

## Missing Enemy Overworld Generation Queue

Each row needs a committed 8-frame runtime sheet and then registration in `ENEMY_OVERWORLD_SHEET_IDS` / `src/spritegen/authored.ts`. Output sheets must be `768x128` total: eight `96x128` frames laid left-to-right.

| enemy | display name | map use | battle reference | current fallback | output PNG | runtime key |
|---|---|---|---|---|---|---|
| skeeter_swarm | Skeeter Swarm | otterbrook, meadow_far, hill_road, whisperwood_rise | assets/art/enemies/battle_skeeter_swarm.png | mini:mini_skeeter_swarm | assets/art/enemies/overworld/skeeter_swarm_8dir.png | ow_enemy_skeeter_swarm |
| quota_clock | Quota Clock | dos_f2 | assets/art/enemies/battle_quota_clock.png | mini:mini_runaway_lawnmower | assets/art/enemies/overworld/quota_clock_8dir.png | ow_enemy_quota_clock |
| expired_meter | Expired Parking Meter | brickton | assets/art/enemies/battle_expired_meter.png | mini:mini_cranky_mailbox | assets/art/enemies/overworld/expired_meter_8dir.png | ow_enemy_expired_meter |
| showroom_mannequin | Showroom Mannequin | brickton | assets/art/enemies/battle_showroom_mannequin.png | mini:mini_pigeon_gang | assets/art/enemies/overworld/showroom_mannequin_8dir.png | ow_enemy_showroom_mannequin |
| good_investment | The Good Investment | otterbrook, meadow_overpass | assets/art/enemies/battle_good_investment.png | mini:mini_pigeon_gang | assets/art/enemies/overworld/good_investment_8dir.png | ow_enemy_good_investment |
| rogue_icecream_truck | Rogue Ice-Cream Truck | brickton | assets/art/enemies/battle_rogue_icecream_truck.png | mini:mini_runaway_lawnmower | assets/art/enemies/overworld/rogue_icecream_truck_8dir.png | ow_enemy_rogue_icecream_truck |
| tick_nymph | Tick Nymph | hickory_hill | assets/art/enemies/battle_tick_nymph.png | mini:mini_coily_cicada | assets/art/enemies/overworld/tick_nymph_8dir.png | ow_enemy_tick_nymph |
| the_suit | The Suit | dos_f2 | assets/art/enemies/battle_the_suit.png | mini:mini_pigeon_gang | assets/art/enemies/overworld/the_suit_8dir.png | ow_enemy_the_suit |
| gilded_grin | IDOL OF THE GILDED GRIN | - | assets/art/enemies/battle_gilded_grin.png | mini:mini_mask | assets/art/enemies/overworld/gilded_grin_8dir.png | ow_enemy_gilded_grin |
| headmaster_mainframe | HEADMASTER MAINFRAME | - | assets/art/enemies/battle_headmaster_mainframe.png | mini:mini_ch3_lurker_3 | assets/art/enemies/overworld/headmaster_mainframe_8dir.png | ow_enemy_headmaster_mainframe |
| titanic_tick | TITANIC TICK | - | assets/art/enemies/battle_titanic_tick.png | mini:mini_hill_slug | assets/art/enemies/overworld/titanic_tick_8dir.png | ow_enemy_titanic_tick |

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
- battle_baobab_root_snare
- battle_baobab_root_snare_w1
- battle_baobab_root_snare_w2
- battle_bootstep_boulder
- battle_bootstep_boulder_w1
- battle_bootstep_boulder_w2
- battle_brass_market_mimic
- battle_brass_market_mimic_w1
- battle_brass_market_mimic_w2
- battle_bronze_mask_guardian
- battle_bronze_mask_guardian_w1
- battle_bronze_mask_guardian_w2
- battle_button_shield_guard
- battle_button_shield_guard_w1
- battle_button_shield_guard_w2
- battle_cackling_mask
- battle_cackling_mask_w1
- battle_cackling_mask_w2
- battle_canteen_mirage
- battle_canteen_mirage_w1
- battle_canteen_mirage_w2
- battle_caravan_hyena_pack
- battle_caravan_hyena_pack_w1
- battle_caravan_hyena_pack_w2
- battle_census_ledger_wraith
- battle_census_ledger_wraith_w1
- battle_census_ledger_wraith_w2
- battle_cold_charm_mimic
- battle_cold_charm_mimic_w1
- battle_cold_charm_mimic_w2
- battle_confetti_cannon
- battle_confetti_cannon_w1
- battle_confetti_cannon_w2
- battle_crumb_knight
- battle_crumb_knight_w1
- battle_crumb_knight_w2
- battle_decree_scroll_swarm
- battle_decree_scroll_swarm_w1
- battle_decree_scroll_swarm_w2
- battle_driftwall_snowbank
- battle_driftwall_snowbank_w1
- battle_driftwall_snowbank_w2
- battle_dust_devil_charm
- battle_dust_devil_charm_w1
- battle_dust_devil_charm_w2
- battle_earwax_wisp
- battle_earwax_wisp_w1
- battle_earwax_wisp_w2
- battle_echoing_riddle
- battle_echoing_riddle_w1
- battle_echoing_riddle_w2
- battle_false_exit_hedge
- battle_false_exit_hedge_w1
- battle_false_exit_hedge_w2
- battle_fastest_man_echo
- battle_fastest_man_echo_w1
- battle_fastest_man_echo_w2
- battle_fjord_gull_bully
- battle_fjord_gull_bully_w1
- battle_fjord_gull_bully_w2
- battle_flat_bell
- battle_flat_bell_w1
- battle_flat_bell_w2
- battle_frostbitten_postcard
- battle_frostbitten_postcard_w1
- battle_frostbitten_postcard_w2
- battle_giant_banknote_folder
- battle_giant_banknote_folder_w1
- battle_giant_banknote_folder_w2
- battle_giant_berry_blocker
- battle_giant_berry_blocker_w1
- battle_giant_berry_blocker_w2
- battle_gilt_thimble_guard
- battle_gilt_thimble_guard_w1
- battle_gilt_thimble_guard_w2
- battle_griot_string_snare
- battle_griot_string_snare_w1
- battle_griot_string_snare_w2
- battle_hollow_jackal
- battle_hollow_jackal_w1
- battle_hollow_jackal_w2
- battle_laughing_dust_pot
- battle_laughing_dust_pot_w1
- battle_laughing_dust_pot_w2
- battle_laughing_sphinx
- battle_laughing_sphinx_riddle
- battle_laughing_sphinx_w1
- battle_laughing_sphinx_w2
- battle_magnifying_lens_mite
- battle_magnifying_lens_mite_w1
- battle_magnifying_lens_mite_w2
- battle_mirage_vendor
- battle_mirage_vendor_w1
- battle_mirage_vendor_w2
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
- battle_postage_stampede
- battle_postage_stampede_w1
- battle_postage_stampede_w2
- battle_punchline_head
- battle_punchline_head_w1
- battle_punchline_head_w2
- battle_rare_crown_jewel_chip
- battle_rare_crown_jewel_chip_w1
- battle_rare_crown_jewel_chip_w2
- battle_rare_giant_button
- battle_rare_giant_button_w1
- battle_rare_giant_button_w2
- battle_rare_riddle_ring
- battle_rare_riddle_ring_w1
- battle_rare_riddle_ring_w2
- battle_ribbon_serpent
- battle_ribbon_serpent_w1
- battle_ribbon_serpent_w2
- battle_ribcage_rattler
- battle_ribcage_rattler_w1
- battle_ribcage_rattler_w2
- battle_royal_doubloon_roller
- battle_royal_doubloon_roller_w1
- battle_royal_doubloon_roller_w2
- battle_salt_flat_lurker
- battle_salt_flat_lurker_w1
- battle_salt_flat_lurker_w2
- battle_sigrids_lost_lens
- battle_sigrids_lost_lens_w1
- battle_sigrids_lost_lens_w2
- battle_sleepwalking_helmet
- battle_sleepwalking_helmet_w1
- battle_sleepwalking_helmet_w2
- battle_snowshoe_phantom
- battle_snowshoe_phantom_w1
- battle_snowshoe_phantom_w2
- battle_sphinx_paw_shadow
- battle_sphinx_paw_shadow_w1
- battle_sphinx_paw_shadow_w2
- battle_spine_tick
- battle_spine_tick_w1
- battle_spine_tick_w2
- battle_sunbaked_idol
- battle_sunbaked_idol_w1
- battle_sunbaked_idol_w2
- battle_teacup_tilter
- battle_teacup_tilter_w1
- battle_teacup_tilter_w2
- battle_the_whisperwig
- battle_the_whisperwig_exposed
- battle_the_whisperwig_w1
- battle_the_whisperwig_w2
- battle_thimble_drummer
- battle_thimble_drummer_w1
- battle_thimble_drummer_w2
- battle_thornbush_bomber
- battle_thornbush_bomber_w1
- battle_thornbush_bomber_w2
- battle_thunder_snail
- battle_thunder_snail_w1
- battle_thunder_snail_w2
- battle_tin_soldier_squad
- battle_tin_soldier_squad_w1
- battle_tin_soldier_squad_w2
- battle_town_gossip_troll
- battle_town_gossip_troll_w1
- battle_town_gossip_troll_w2
- battle_trade_salt_heap
- battle_trade_salt_heap_w1
- battle_trade_salt_heap_w2
- battle_whiskerzilla
- battle_whiskerzilla_knighted
- battle_whiskerzilla_w1
- battle_whiskerzilla_w2
- battle_woolly_pressure_kettle
- battle_woolly_pressure_kettle_w1
- battle_woolly_pressure_kettle_w2
