# Character Animation Audit

This checks the authored 46-frame character sheets against the runtime frame contract.

- Frame size: 96x128
- Sheet size: 384x1536
- Frame count: 46
- Registered characters: 100
- Unregistered character sheets on disk: 0
- Path overrides: 0
- Characters with issues: 16
- Errors: 0
- Warnings: 0
- Review hints: 58

Interactive playback page: [character_animation_audit.html](character_animation_audit.html)

## Correction Workflow

Generated character art is corrected one frame at a time. If a frame image fails visual review, do not salvage, trace, mirror, repaint, or derive from that failed image. Generate a new single 96x128 PNG, then import it back into one slot.

- Export one frame: `npm run anim:frame -- --char <id> --frame <N> --out assets/art/review/fixes/<id>_frame_<N>.png`
- Check one generated frame: `npm run anim:frame:check -- --image assets/art/review/fixes/<id>_frame_<N>.png`
- Import one corrected frame: `npm run anim:fix -- --char <id> --image assets/art/review/fixes/<id>_frame_<N>.png --op importImage:<N>`
- Preview first: `anim:fix` is a dry run unless `--apply` is passed.
- Verify a candidate sheet: `npm run anim:audit -- --override <id>=assets/art/review/<candidate>.png`

Use `npm run anim:fix -- --char <id> ...` for frame moves and one-frame imports. Frame moves are only for correct images placed in the wrong slot; failed images are regenerated.

Common operations:

- `--op copy:FROM:TO` copies one frame into another slot.
- `--op mirror:FROM:TO` horizontally mirrors one frame into another slot.
- `--image <path> --op importImage:TO` imports one 96x128 PNG into one frame slot.
- `--op swap:A:B` swaps two frame cells.
- `--op swapRange:A-B:C-D` swaps equal-length frame ranges.
- `--op reverse:A-B` reverses a frame range.
- `--op rotate:A-B:N` rotates a frame range by N cells.

Common presets:

- `--preset swap-left-right` swaps all left/right walk and run blocks.
- `--preset swap-up-down` swaps all up/down walk and run blocks.
- `--preset normalize-cardinal-stands` copies cardinal stand frames into their matching neutral slots.
- `--preset mirror-right-from-left` builds right-facing cardinal frames from mirrored left-facing frames.
- `--preset mirror-left-from-right` builds left-facing cardinal frames from mirrored right-facing frames.

## Frame Contract

| frames | meaning |
|---|---|
| 0-3 | walk down |
| 4-7 | walk left |
| 8-11 | walk right |
| 12-15 | walk up |
| 16-17 | run down |
| 18-19 | run left |
| 20-21 | run right |
| 22-23 | run up |
| 24-26 | walk down-right |
| 27-29 | walk down-left |
| 30-32 | walk up-right |
| 33-35 | walk up-left |
| 36-37 | run down-right |
| 38-39 | run down-left |
| 40-41 | run up-right |
| 42-43 | run up-left |
| 44 | idle breath |
| 45 | idle blink |

## Issue Summary

### dorin (dorin)
- REVIEW frame 18: run left looks closer to downleft than left
- REVIEW frame 19: run left looks closer to downleft than left
- REVIEW frame 20: run right looks closer to downright than right
- REVIEW frame 21: run right looks closer to downright than right

### pippa (pippa)
- REVIEW frame 21: run right looks closer to downright than right
- REVIEW frame 31: walk up-right looks closer to downright than upright
- REVIEW frame 32: walk up-right looks closer to up than upright

### rex (jay)
- REVIEW frame 18: run left looks closer to downright than left
- REVIEW frame 19: run left looks closer to downright than left
- REVIEW frame 20: run right looks closer to downleft than right
- REVIEW frame 21: run right looks closer to downleft than right
- REVIEW frame 22: run up looks closer to upright than up
- REVIEW frame 23: run up looks closer to downleft than up

### ana (ana)
- REVIEW frame 18: run left looks closer to upright than left
- REVIEW frame 19: run left looks closer to upright than left
- REVIEW frame 20: run right looks closer to left than right
- REVIEW frame 21: run right looks closer to left than right
- REVIEW frame 40: run up-right looks closer to downleft than upright
- REVIEW frame 41: run up-right looks closer to downleft than upright

### as_radio (as_radio)
- REVIEW frame 5: walk left looks closer to down than left
- REVIEW frame 9: walk right looks closer to up than right
- REVIEW frame 18: run left looks closer to down than left
- REVIEW frame 20: run right looks closer to up than right

### captain (captain)
- REVIEW frame 3: walk down looks closer to downright than down

### chad (chad)
- REVIEW frame 5: walk left looks closer to upleft than left
- REVIEW frame 7: walk left looks closer to upleft than left
- REVIEW frame 9: walk right looks closer to upright than right
- REVIEW frame 11: walk right looks closer to upright than right
- REVIEW frame 18: run left looks closer to upleft than left
- REVIEW frame 19: run left looks closer to upleft than left
- REVIEW frame 20: run right looks closer to upright than right
- REVIEW frame 21: run right looks closer to upright than right

### cp_dabbawala (cp_dabbawala)
- REVIEW frame 3: walk down looks closer to downleft than down
- REVIEW frame 15: walk up looks closer to downleft than up
- REVIEW frame 17: run down looks closer to downleft than down
- REVIEW frame 23: run up looks closer to downleft than up

### cp_stationmaster (cp_stationmaster)
- REVIEW frame 3: walk down looks closer to up than down
- REVIEW frame 15: walk up looks closer to down than up
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 23: run up looks closer to down than up
- REVIEW frame 25: walk down-right looks closer to down than downright
- REVIEW frame 36: run down-right looks closer to down than downright

### lh_lantern_girl (lh_lantern_girl)
- REVIEW up diagonals: standing pair is not mirror-compatible (0.278)

### npc_borden (npc_borden)
- REVIEW frame 3: walk down looks closer to up than down

### npc_realtor (npc_realtor)
- REVIEW frame 3: walk down looks closer to up than down
- REVIEW frame 15: walk up looks closer to down than up

### npc_waitress (npc_waitress)
- REVIEW frame 3: walk down looks closer to up than down
- REVIEW frame 15: walk up looks closer to down than up
- REVIEW down diagonals: standing pair is not mirror-compatible (0.183)

### senora (senora)
- REVIEW frame 7: walk left looks closer to right than left
- REVIEW frame 11: walk right looks closer to left than right
- REVIEW frame 19: run left looks closer to right than left
- REVIEW frame 21: run right looks closer to left than right

### wokeA (wokeA)
- REVIEW frame 3: walk down looks closer to downright than down

### zanzibel_market_queen (zanzibel_market_queen)
- REVIEW frame 3: walk down looks closer to downright than down
- REVIEW frame 15: walk up looks closer to upright than up
- REVIEW frame 17: run down looks closer to downright than down
- REVIEW frame 23: run up looks closer to upright than up

## All Registered Sheets

| id | art | role | issue count |
|---|---|---|---|
| dorin | dorin | hero | 4 |
| faye | mia | hero | 0 |
| milo | milo | hero | 0 |
| pippa | pippa | hero | 3 |
| rex | jay | hero | 6 |
| ana | ana | npc | 6 |
| arcadeOwner | arcadeOwner | npc | 0 |
| as_keeper | as_keeper | npc | 0 |
| as_provisioner | as_provisioner | npc | 0 |
| as_radio | as_radio | npc | 4 |
| aurora_busker | aurora_busker | npc | 0 |
| baobab_healer | baobab_healer | npc | 0 |
| bell_choir_child | bell_choir_child | npc | 0 |
| bootstep_shepherd | bootstep_shepherd | npc | 0 |
| busDriver | busDriver | npc | 0 |
| caddy | caddy | npc | 0 |
| canteen_keeper | canteen_keeper | npc | 0 |
| captain | captain | npc | 1 |
| chad | chad | npc | 8 |
| cp_dabbawala | cp_dabbawala | npc | 4 |
| cp_spice_merchant | cp_spice_merchant | npc | 0 |
| cp_stationmaster | cp_stationmaster | npc | 6 |
| cp_usher | cp_usher | npc | 0 |
| curator | curator | npc | 0 |
| deliKeeper | deliKeeper | npc | 0 |
| docBrickton | docBrickton | npc | 0 |
| dockworker | dockworker | npc | 0 |
| docPuerto | docPuerto | npc | 0 |
| docValle | docValle | npc | 0 |
| drugClerk | drugClerk | npc | 0 |
| fernLady | fernLady | npc | 0 |
| fjord_nurse | fjord_nurse | npc | 0 |
| glint | glint | npc | 0 |
| grand_duchess_millimetta | grand_duchess_millimetta | npc | 0 |
| grayCommuter | grayCommuter | npc | 0 |
| kvisthavn_fisher | kvisthavn_fisher | npc | 0 |
| kvisthavn_shopkeeper | kvisthavn_shopkeeper | npc | 0 |
| laughing_ruins_guide | laughing_ruins_guide | npc | 0 |
| lh_calligrapher | lh_calligrapher | npc | 0 |
| lh_harbor_master | lh_harbor_master | npc | 0 |
| lh_lantern_girl | lh_lantern_girl | npc | 1 |
| lh_tea_monk | lh_tea_monk | npc | 0 |
| lh_yak_handler | lh_yak_handler | npc | 0 |
| lilleby_giant_child | lilleby_giant_child | npc | 0 |
| lilleby_undertaker | lilleby_undertaker | npc | 0 |
| lotus_bargeman | lotus_bargeman | npc | 0 |
| manager | manager | npc | 0 |
| martClerk | martClerk | npc | 0 |
| matchbox_herald | matchbox_herald | npc | 0 |
| mayor_of_lilleby | mayor_of_lilleby | npc | 0 |
| mercadoKeeper | mercadoKeeper | npc | 0 |
| ml_local | ml_local | npc | 0 |
| ml_pemberton | ml_pemberton | npc | 0 |
| ml_vendor | ml_vendor | npc | 0 |
| mom | mom | npc | 0 |
| mr_click | mr_click | npc | 0 |
| mrPlummer | mrPlummer | npc | 0 |
| mrsPemmel | mrsPemmel | npc | 0 |
| mt_shu_elder | mt_shu_elder | npc | 0 |
| npc_bert | npc_bert | npc | 0 |
| npc_borden | npc_borden | npc | 1 |
| npc_clerk | npc_clerk | npc | 0 |
| npc_depot_clerk | npc_depot_clerk | npc | 0 |
| npc_hodgkin | npc_hodgkin | npc | 0 |
| npc_realtor | npc_realtor | npc | 2 |
| npc_waitress | npc_waitress | npc | 3 |
| nurse | nurse | npc | 0 |
| oldTimer | oldTimer | npc | 0 |
| pajamaKid | pajamaKid | npc | 0 |
| permit | permit | npc | 0 |
| pigeonKid | pigeonKid | npc | 0 |
| priestOtter | priestOtter | npc | 0 |
| priestValle | priestValle | npc | 0 |
| quarterMan | quarterMan | npc | 0 |
| royal_census_taker | royal_census_taker | npc | 0 |
| senora | senora | npc | 4 |
| sidewalkCritic | sidewalkCritic | npc | 0 |
| sigrid_spectacles | sigrid_spectacles | npc | 0 |
| sleepwalker_miner | sleepwalker_miner | npc | 0 |
| smiler | smiler | npc | 0 |
| smilerB | smilerB | npc | 0 |
| spool_engineer | spool_engineer | npc | 0 |
| teacup_innkeeper | teacup_innkeeper | npc | 0 |
| tiny_postmaster | tiny_postmaster | npc | 0 |
| tomas | tomas | npc | 0 |
| uncleBert | uncleBert | npc | 0 |
| vivi | vivi | npc | 0 |
| vs_buni | vs_buni | npc | 0 |
| vs_kid | vs_kid | npc | 0 |
| vs_provisioner | vs_provisioner | npc | 0 |
| vs_shepherd | vs_shepherd | npc | 0 |
| whistle_guard_npc | whistle_guard_npc | npc | 0 |
| wisherA | wisherA | npc | 0 |
| wisherB | wisherB | npc | 0 |
| wisherC | wisherC | npc | 0 |
| wokeA | wokeA | npc | 1 |
| wokeB | wokeB | npc | 0 |
| wokeC | wokeC | npc | 0 |
| zanzibel_dockmaster | zanzibel_dockmaster | npc | 0 |
| zanzibel_market_queen | zanzibel_market_queen | npc | 4 |
