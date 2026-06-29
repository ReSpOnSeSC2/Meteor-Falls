# Character Animation Audit

This checks the authored 46-frame character sheets against the runtime frame contract.

- Frame size: 96x128
- Sheet size: 384x1536
- Frame count: 46
- Registered characters: 87
- Unregistered character sheets on disk: 0
- Path overrides: 0
- Characters with issues: 51
- Errors: 0
- Warnings: 191
- Review hints: 235

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
- WARN walk left: step frames 1/3 are nearly frozen (0.009)
- WARN walk right: step frames 1/3 are nearly frozen (0.009)

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
- WARN walk left: step frames 1/3 are nearly frozen (0.005)

### ana (ana)
- REVIEW frame 15: walk up looks closer to left than up
- REVIEW frame 16: run down looks closer to upright than down
- REVIEW frame 17: run down looks closer to upright than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to upright than left
- REVIEW frame 20: run right looks closer to upright than right
- REVIEW frame 21: run right looks closer to up than right
- REVIEW frame 40: run up-right looks closer to down than upright
- WARN walk up: stand frames 0/2 are not stable (0.082)

### arcadeOwner (arcadeOwner)
- WARN walk down: step frames 1/3 are nearly frozen (0.008)
- WARN walk left: step frames 1/3 are nearly frozen (0.010)
- WARN walk right: step frames 1/3 are nearly frozen (0.010)
- WARN run left: run pair is nearly frozen (0.010)
- WARN run right: run pair is nearly frozen (0.010)

### baobab_healer (baobab_healer)
- WARN walk up: step frames 1/3 are nearly frozen (0.010)
- WARN run up: run pair is nearly frozen (0.010)

### bell_choir_child (bell_choir_child)
- WARN walk up: step frames 1/3 are nearly frozen (0.006)
- WARN run up: run pair is nearly frozen (0.006)

### bootstep_shepherd (bootstep_shepherd)
- WARN walk down: step frames 1/3 are nearly frozen (0.006)
- WARN walk left: step frames 1/3 are nearly frozen (0.008)
- WARN walk right: step frames 1/3 are nearly frozen (0.008)
- WARN run down: run pair is nearly frozen (0.006)
- WARN run left: run pair is nearly frozen (0.008)
- WARN run right: run pair is nearly frozen (0.008)

### busDriver (busDriver)
- REVIEW frame 5: walk left looks closer to right than left
- REVIEW frame 6: walk left looks closer to right than left
- REVIEW frame 7: walk left looks closer to right than left
- REVIEW frame 11: walk right looks closer to upright than right
- REVIEW frame 15: walk up looks closer to downleft than up
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to up than left
- REVIEW frame 20: run right looks closer to up than right
- REVIEW frame 21: run right looks closer to up than right
- REVIEW frame 22: run up looks closer to downright than up
- REVIEW frame 23: run up looks closer to downright than up
- REVIEW frame 25: walk down-right looks closer to downleft than downright
- REVIEW frame 26: walk down-right looks closer to downleft than downright
- REVIEW frame 36: run down-right looks closer to upleft than downright
- REVIEW frame 37: run down-right looks closer to upleft than downright
- REVIEW frame 38: run down-left looks closer to upleft than downleft
- REVIEW frame 39: run down-left looks closer to upleft than downleft
- REVIEW frame 40: run up-right looks closer to upleft than upright
- REVIEW frame 41: run up-right looks closer to upleft than upright
- WARN walk left: stand frames 0/2 are not stable (0.117)
- WARN run up: run pair is nearly frozen (0.010)
- WARN run down-right: run pair is nearly frozen (0.007)

### caddy (caddy)
- WARN walk left: step frames 1/3 are nearly frozen (0.003)
- WARN walk right: step frames 1/3 are nearly frozen (0.003)
- WARN run left: run pair is nearly frozen (0.003)
- WARN run right: run pair is nearly frozen (0.003)
- WARN walk up-right: diagonal step pair is nearly frozen (0.005)
- WARN walk up-left: diagonal step pair is nearly frozen (0.005)
- WARN run up-right: run pair is nearly frozen (0.005)
- WARN run up-left: run pair is nearly frozen (0.005)

### captain (captain)
- REVIEW frame 3: walk down looks closer to downright than down

### chad (chad)
- REVIEW frame 6: walk left looks closer to upleft than left
- REVIEW frame 7: walk left looks closer to upleft than left
- REVIEW frame 18: run left looks closer to upleft than left
- REVIEW frame 19: run left looks closer to upleft than left
- REVIEW frame 22: run up looks closer to right than up
- REVIEW frame 23: run up looks closer to right than up
- REVIEW frame 36: run down-right looks closer to upright than downright
- REVIEW frame 39: run down-left looks closer to upright than downleft
- WARN walk left: stand frames 0/2 are not stable (0.116)
- WARN walk right: stand frames 0/2 are not stable (0.082)

### cp_dabbawala (cp_dabbawala)
- REVIEW frame 3: walk down looks closer to downleft than down
- REVIEW frame 15: walk up looks closer to downleft than up
- REVIEW frame 17: run down looks closer to downleft than down
- REVIEW frame 23: run up looks closer to downleft than up
- WARN walk left: step frames 1/3 are nearly frozen (0.008)
- WARN walk right: step frames 1/3 are nearly frozen (0.008)
- WARN run left: run pair is nearly frozen (0.008)
- WARN run right: run pair is nearly frozen (0.008)
- WARN walk up-right: diagonal step pair is nearly frozen (0.003)
- WARN walk up-left: diagonal step pair is nearly frozen (0.003)
- WARN run up-right: run pair is nearly frozen (0.003)
- WARN run up-left: run pair is nearly frozen (0.003)

### cp_stationmaster (cp_stationmaster)
- REVIEW frame 3: walk down looks closer to up than down
- REVIEW frame 15: walk up looks closer to down than up
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 23: run up looks closer to down than up
- WARN walk down-right: diagonal step pair is nearly frozen (0.007)
- WARN walk down-left: diagonal step pair is nearly frozen (0.007)
- WARN run down-right: run pair is nearly frozen (0.007)
- WARN run down-left: run pair is nearly frozen (0.007)

### deliKeeper (deliKeeper)
- REVIEW frame 6: walk left looks closer to right than left
- REVIEW frame 7: walk left looks closer to right than left
- REVIEW frame 10: walk right looks closer to up than right
- REVIEW frame 11: walk right looks closer to up than right
- REVIEW frame 16: run down looks closer to downright than down
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to downright than left
- REVIEW frame 20: run right looks closer to downleft than right
- REVIEW frame 21: run right looks closer to downright than right
- REVIEW frame 22: run up looks closer to downleft than up
- REVIEW frame 23: run up looks closer to downleft than up
- REVIEW frame 26: walk down-right looks closer to downleft than downright
- REVIEW frame 34: walk up-left looks closer to down than upleft
- REVIEW frame 35: walk up-left looks closer to upright than upleft
- REVIEW frame 36: run down-right looks closer to upright than downright
- REVIEW frame 37: run down-right looks closer to down than downright
- REVIEW frame 38: run down-left looks closer to upright than downleft
- REVIEW frame 39: run down-left looks closer to upleft than downleft
- REVIEW frame 42: run up-left looks closer to right than upleft
- REVIEW frame 43: run up-left looks closer to right than upleft
- WARN walk left: stand frames 0/2 are not stable (0.113)
- WARN walk right: stand frames 0/2 are not stable (0.111)

### docBrickton (docBrickton)
- WARN walk up-right: diagonal step pair is nearly frozen (0.006)
- WARN walk up-left: diagonal step pair is nearly frozen (0.006)
- WARN run up-right: run pair is nearly frozen (0.006)
- WARN run up-left: run pair is nearly frozen (0.006)

### docPuerto (docPuerto)
- WARN walk left: step frames 1/3 are nearly frozen (0.010)
- WARN walk right: step frames 1/3 are nearly frozen (0.010)
- WARN run down: run pair is nearly frozen (0.006)
- WARN run left: run pair is nearly frozen (0.010)
- WARN run right: run pair is nearly frozen (0.010)

### docValle (docValle)
- WARN walk left: step frames 1/3 are nearly frozen (0.006)
- WARN walk right: step frames 1/3 are nearly frozen (0.006)
- WARN run left: run pair is nearly frozen (0.006)
- WARN run right: run pair is nearly frozen (0.006)
- WARN walk down-right: diagonal step pair is nearly frozen (0.005)
- WARN walk down-left: diagonal step pair is nearly frozen (0.005)
- WARN run down-right: run pair is nearly frozen (0.005)
- WARN run down-left: run pair is nearly frozen (0.005)

### drugClerk (drugClerk)
- WARN walk up-right: diagonal step pair is nearly frozen (0.003)
- WARN walk up-left: diagonal step pair is nearly frozen (0.003)
- WARN run up-right: run pair is nearly frozen (0.003)
- WARN run up-left: run pair is nearly frozen (0.003)

### fernLady (fernLady)
- REVIEW frame 3: walk down looks closer to upright than down
- REVIEW frame 5: walk left looks closer to up than left
- REVIEW frame 6: walk left looks closer to right than left
- REVIEW frame 7: walk left looks closer to right than left
- REVIEW frame 11: walk right looks closer to up than right
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to up than left
- REVIEW frame 20: run right looks closer to upleft than right
- REVIEW frame 21: run right looks closer to downleft than right
- REVIEW frame 22: run up looks closer to downright than up
- REVIEW frame 23: run up looks closer to downright than up
- REVIEW frame 39: run down-left looks closer to upleft than downleft
- REVIEW frame 40: run up-right looks closer to down than upright
- REVIEW frame 41: run up-right looks closer to right than upright
- REVIEW frame 43: run up-left looks closer to left than upleft
- WARN walk left: stand frames 0/2 are not stable (0.103)
- WARN walk right: stand frames 0/2 are not stable (0.082)
- WARN run down-right: run pair is nearly frozen (0.008)
- REVIEW left/right: standing pair is not mirror-compatible (0.198)
- REVIEW up diagonals: standing pair is not mirror-compatible (0.221)

### fjord_nurse (fjord_nurse)
- REVIEW frame 1: walk down looks closer to upleft than down
- REVIEW frame 2: walk down looks closer to downleft than down
- REVIEW frame 3: walk down looks closer to downleft than down
- REVIEW frame 6: walk left looks closer to upright than left
- REVIEW frame 9: walk right looks closer to upleft than right
- REVIEW frame 10: walk right looks closer to downleft than right
- REVIEW frame 11: walk right looks closer to downleft than right
- REVIEW frame 14: walk up looks closer to upright than up
- REVIEW frame 17: run down looks closer to upleft than down
- REVIEW frame 18: run left looks closer to downleft than left
- REVIEW frame 19: run left looks closer to downleft than left
- REVIEW frame 22: run up looks closer to upright than up
- REVIEW frame 25: walk down-right looks closer to upleft than downright
- REVIEW frame 26: walk down-right looks closer to downleft than downright
- REVIEW frame 28: walk down-left looks closer to down than downleft
- REVIEW frame 29: walk down-left looks closer to down than downleft
- REVIEW frame 32: walk up-right looks closer to down than upright
- REVIEW frame 38: run down-left looks closer to upright than downleft
- REVIEW frame 39: run down-left looks closer to upright than downleft
- REVIEW frame 40: run up-right looks closer to down than upright
- REVIEW frame 41: run up-right looks closer to upleft than upright
- WARN walk down: stand frames 0/2 are not stable (0.147)
- WARN walk left: stand frames 0/2 are not stable (0.077)
- WARN walk right: stand frames 0/2 are not stable (0.147)
- WARN walk up: stand frames 0/2 are not stable (0.077)

### glint (glint)
- REVIEW frame 11: walk right looks closer to up than right
- REVIEW frame 15: walk up looks closer to downright than up
- REVIEW frame 22: run up looks closer to upright than up
- REVIEW frame 23: run up looks closer to left than up
- REVIEW frame 36: run down-right looks closer to upleft than downright
- REVIEW frame 37: run down-right looks closer to right than downright

### grand_duchess_millimetta (grand_duchess_millimetta)
- WARN walk down: step frames 1/3 are nearly frozen (0.010)
- WARN walk left: step frames 1/3 are nearly frozen (0.008)
- WARN walk right: step frames 1/3 are nearly frozen (0.008)
- WARN run down: run pair is nearly frozen (0.010)
- WARN run left: run pair is nearly frozen (0.008)
- WARN run right: run pair is nearly frozen (0.008)

### kvisthavn_fisher (kvisthavn_fisher)
- WARN walk left: step frames 1/3 are nearly frozen (0.009)
- WARN walk right: step frames 1/3 are nearly frozen (0.009)
- WARN run left: run pair is nearly frozen (0.009)
- WARN run right: run pair is nearly frozen (0.009)

### lh_calligrapher (lh_calligrapher)
- REVIEW frame 3: walk down looks closer to right than down
- REVIEW frame 15: walk up looks closer to right than up
- REVIEW frame 17: run down looks closer to right than down
- REVIEW frame 23: run up looks closer to right than up
- WARN walk left: step frames 1/3 are nearly frozen (0.006)
- WARN walk right: step frames 1/3 are nearly frozen (0.006)
- WARN run left: run pair is nearly frozen (0.006)
- WARN run right: run pair is nearly frozen (0.006)
- WARN walk down-right: diagonal step pair is nearly frozen (0.006)
- WARN walk down-left: diagonal step pair is nearly frozen (0.006)
- WARN walk up-right: diagonal step pair is nearly frozen (0.006)
- WARN walk up-left: diagonal step pair is nearly frozen (0.006)
- WARN run down-right: run pair is nearly frozen (0.006)
- WARN run down-left: run pair is nearly frozen (0.006)
- WARN run up-right: run pair is nearly frozen (0.006)
- WARN run up-left: run pair is nearly frozen (0.006)

### lh_harbor_master (lh_harbor_master)
- WARN walk left: step frames 1/3 are nearly frozen (0.007)
- WARN walk right: step frames 1/3 are nearly frozen (0.007)
- WARN run left: run pair is nearly frozen (0.007)
- WARN run right: run pair is nearly frozen (0.007)

### lh_lantern_girl (lh_lantern_girl)
- REVIEW frame 3: walk down looks closer to downleft than down
- REVIEW frame 15: walk up looks closer to upleft than up
- REVIEW frame 17: run down looks closer to downleft than down
- REVIEW frame 23: run up looks closer to upleft than up

### lh_tea_monk (lh_tea_monk)
- REVIEW frame 15: walk up looks closer to upleft than up
- REVIEW frame 23: run up looks closer to upleft than up
- WARN walk left: step frames 1/3 are nearly frozen (0.010)
- WARN walk right: step frames 1/3 are nearly frozen (0.010)
- WARN run left: run pair is nearly frozen (0.010)
- WARN run right: run pair is nearly frozen (0.010)
- WARN walk down-right: diagonal step pair is nearly frozen (0.002)
- WARN walk down-left: diagonal step pair is nearly frozen (0.002)
- WARN run down-right: run pair is nearly frozen (0.002)
- WARN run down-left: run pair is nearly frozen (0.002)

### lilleby_giant_child (lilleby_giant_child)
- WARN walk down: step frames 1/3 are nearly frozen (0.010)
- WARN walk left: step frames 1/3 are nearly frozen (0.005)
- WARN walk right: step frames 1/3 are nearly frozen (0.005)
- WARN run down: run pair is nearly frozen (0.010)
- WARN run left: run pair is nearly frozen (0.005)
- WARN run right: run pair is nearly frozen (0.005)

### lilleby_undertaker (lilleby_undertaker)
- WARN walk down-right: diagonal step pair is nearly frozen (0.007)
- WARN walk down-left: diagonal step pair is nearly frozen (0.007)
- WARN run down-right: run pair is nearly frozen (0.007)
- WARN run down-left: run pair is nearly frozen (0.007)

### mrPlummer (mrPlummer)
- REVIEW frame 11: walk right looks closer to up than right
- REVIEW frame 15: walk up looks closer to downright than up
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 17: run down looks closer to downleft than down
- REVIEW frame 19: run left looks closer to up than left
- REVIEW frame 20: run right looks closer to downleft than right
- REVIEW frame 21: run right looks closer to downleft than right
- REVIEW frame 34: walk up-left looks closer to left than upleft
- REVIEW frame 35: walk up-left looks closer to left than upleft
- REVIEW frame 36: run down-right looks closer to left than downright
- REVIEW frame 37: run down-right looks closer to left than downright
- REVIEW frame 38: run down-left looks closer to left than downleft
- REVIEW frame 39: run down-left looks closer to left than downleft
- REVIEW frame 40: run up-right looks closer to left than upright
- REVIEW frame 41: run up-right looks closer to right than upright

### mrsPemmel (mrsPemmel)
- REVIEW frame 5: walk left looks closer to down than left
- REVIEW frame 6: walk left looks closer to down than left
- REVIEW frame 7: walk left looks closer to down than left
- REVIEW frame 11: walk right looks closer to up than right
- REVIEW frame 15: walk up looks closer to downright than up
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to up than left
- REVIEW frame 20: run right looks closer to up than right
- REVIEW frame 21: run right looks closer to up than right
- REVIEW frame 22: run up looks closer to downright than up
- REVIEW frame 23: run up looks closer to downright than up
- REVIEW frame 26: walk down-right looks closer to downleft than downright
- REVIEW frame 28: walk down-left looks closer to upright than downleft
- REVIEW frame 32: walk up-right looks closer to downleft than upright
- REVIEW frame 36: run down-right looks closer to upleft than downright
- REVIEW frame 37: run down-right looks closer to upleft than downright
- REVIEW frame 38: run down-left looks closer to upleft than downleft
- REVIEW frame 39: run down-left looks closer to upleft than downleft
- REVIEW frame 40: run up-right looks closer to upleft than upright
- REVIEW frame 41: run up-right looks closer to upleft than upright
- WARN walk up-left: diagonal step pair is nearly frozen (0.008)
- WARN run down-right: run pair is nearly frozen (0.007)
- WARN run up-right: run pair is nearly frozen (0.008)
- WARN run up-left: run pair is nearly frozen (0.004)

### npc_borden (npc_borden)
- REVIEW frame 3: walk down looks closer to up than down

### npc_realtor (npc_realtor)
- REVIEW frame 3: walk down looks closer to up than down
- REVIEW frame 15: walk up looks closer to down than up

### npc_waitress (npc_waitress)
- REVIEW frame 3: walk down looks closer to up than down
- REVIEW frame 15: walk up looks closer to down than up
- REVIEW down diagonals: standing pair is not mirror-compatible (0.183)

### oldTimer (oldTimer)
- WARN walk left: step frames 1/3 are nearly frozen (0.006)
- WARN walk right: step frames 1/3 are nearly frozen (0.006)
- WARN run left: run pair is nearly frozen (0.006)
- WARN run right: run pair is nearly frozen (0.006)
- WARN walk up-right: diagonal step pair is nearly frozen (0.004)
- WARN walk up-left: diagonal step pair is nearly frozen (0.004)
- WARN run up-right: run pair is nearly frozen (0.004)
- WARN run up-left: run pair is nearly frozen (0.004)

### pajamaKid (pajamaKid)
- WARN walk down-right: diagonal step pair is nearly frozen (0.006)
- WARN walk down-left: diagonal step pair is nearly frozen (0.006)
- WARN run down-right: run pair is nearly frozen (0.006)
- WARN run down-left: run pair is nearly frozen (0.006)

### pigeonKid (pigeonKid)
- REVIEW frame 1: walk down looks closer to left than down
- REVIEW frame 2: walk down looks closer to left than down
- REVIEW frame 5: walk left looks closer to down than left
- REVIEW frame 6: walk left looks closer to down than left
- REVIEW frame 7: walk left looks closer to right than left
- REVIEW frame 10: walk right looks closer to left than right
- REVIEW frame 15: walk up looks closer to downleft than up
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to up than left
- REVIEW frame 20: run right looks closer to up than right
- REVIEW frame 21: run right looks closer to up than right
- REVIEW frame 36: run down-right looks closer to upleft than downright
- REVIEW frame 37: run down-right looks closer to upleft than downright
- REVIEW frame 38: run down-left looks closer to upleft than downleft
- REVIEW frame 39: run down-left looks closer to upleft than downleft
- REVIEW frame 40: run up-right looks closer to upleft than upright
- REVIEW frame 41: run up-right looks closer to upleft than upright
- WARN walk down: stand frames 0/2 are not stable (0.073)
- WARN walk left: stand frames 0/2 are not stable (0.082)
- WARN walk right: stand frames 0/2 are not stable (0.101)
- WARN walk up-left: diagonal step pair is nearly frozen (0.004)
- WARN run down-right: run pair is nearly frozen (0.005)

### priestOtter (priestOtter)
- WARN walk down-right: diagonal step pair is nearly frozen (0.008)
- WARN walk down-left: diagonal step pair is nearly frozen (0.008)
- WARN run down-right: run pair is nearly frozen (0.008)
- WARN run down-left: run pair is nearly frozen (0.008)

### quarterMan (quarterMan)
- REVIEW frame 2: walk down looks closer to left than down
- REVIEW frame 3: walk down looks closer to downright than down
- REVIEW frame 5: walk left looks closer to down than left
- REVIEW frame 6: walk left looks closer to right than left
- REVIEW frame 7: walk left looks closer to right than left
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 17: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 19: run left looks closer to right than left
- REVIEW frame 21: run right looks closer to up than right
- REVIEW frame 26: walk down-right looks closer to left than downright
- REVIEW frame 28: walk down-left looks closer to left than downleft
- WARN walk down: stand frames 0/2 are not stable (0.115)
- WARN walk left: stand frames 0/2 are not stable (0.120)

### royal_census_taker (royal_census_taker)
- WARN walk down: step frames 1/3 are nearly frozen (0.009)
- WARN run down: run pair is nearly frozen (0.009)

### senora (senora)
- REVIEW frame 15: walk up looks closer to downleft than up
- REVIEW frame 16: run down looks closer to up than down
- REVIEW frame 18: run left looks closer to up than left
- REVIEW frame 20: run right looks closer to up than right
- REVIEW frame 21: run right looks closer to up than right
- REVIEW frame 23: run up looks closer to upright than up
- REVIEW frame 36: run down-right looks closer to upleft than downright
- REVIEW frame 37: run down-right looks closer to upleft than downright
- REVIEW frame 38: run down-left looks closer to upleft than downleft
- REVIEW frame 39: run down-left looks closer to upleft than downleft
- REVIEW frame 40: run up-right looks closer to upleft than upright
- REVIEW frame 41: run up-right looks closer to upleft than upright
- WARN walk up-left: diagonal step pair is nearly frozen (0.006)
- WARN run down-right: run pair is nearly frozen (0.005)
- WARN run down-left: run pair is nearly frozen (0.004)
- WARN run up-left: run pair is nearly frozen (0.003)

### spool_engineer (spool_engineer)
- REVIEW frame 3: walk down looks closer to downright than down
- REVIEW frame 15: walk up looks closer to downleft than up
- REVIEW frame 17: run down looks closer to downright than down
- REVIEW frame 23: run up looks closer to downleft than up

### teacup_innkeeper (teacup_innkeeper)
- REVIEW frame 3: walk down looks closer to downright than down
- REVIEW frame 17: run down looks closer to downright than down
- WARN walk left: step frames 1/3 are nearly frozen (0.006)
- WARN walk right: step frames 1/3 are nearly frozen (0.006)
- WARN run left: run pair is nearly frozen (0.006)
- WARN run right: run pair is nearly frozen (0.006)

### tiny_postmaster (tiny_postmaster)
- REVIEW frame 3: walk down looks closer to downright than down
- REVIEW frame 17: run down looks closer to downright than down

### whistle_guard_npc (whistle_guard_npc)
- WARN walk down-right: diagonal step pair is nearly frozen (0.002)
- WARN walk down-left: diagonal step pair is nearly frozen (0.002)
- WARN walk up-right: diagonal step pair is nearly frozen (0.004)
- WARN walk up-left: diagonal step pair is nearly frozen (0.004)
- WARN run down-right: run pair is nearly frozen (0.002)
- WARN run down-left: run pair is nearly frozen (0.002)
- WARN run up-right: run pair is nearly frozen (0.004)
- WARN run up-left: run pair is nearly frozen (0.004)

### wisherB (wisherB)
- WARN walk left: step frames 1/3 are nearly frozen (0.004)
- WARN walk right: step frames 1/3 are nearly frozen (0.004)
- WARN run left: run pair is nearly frozen (0.004)
- WARN run right: run pair is nearly frozen (0.004)
- WARN walk down-right: diagonal step pair is nearly frozen (0.008)
- WARN walk down-left: diagonal step pair is nearly frozen (0.008)
- WARN run down-right: run pair is nearly frozen (0.008)
- WARN run down-left: run pair is nearly frozen (0.008)

### wokeA (wokeA)
- REVIEW frame 3: walk down looks closer to downleft than down

### wokeB (wokeB)
- WARN walk down-right: diagonal step pair is nearly frozen (0.009)
- WARN walk down-left: diagonal step pair is nearly frozen (0.009)
- WARN walk up-right: diagonal step pair is nearly frozen (0.007)
- WARN walk up-left: diagonal step pair is nearly frozen (0.007)
- WARN run down-right: run pair is nearly frozen (0.009)
- WARN run down-left: run pair is nearly frozen (0.009)
- WARN run up-right: run pair is nearly frozen (0.007)
- WARN run up-left: run pair is nearly frozen (0.007)

### zanzibel_dockmaster (zanzibel_dockmaster)
- WARN walk down-right: diagonal step pair is nearly frozen (0.004)
- WARN walk down-left: diagonal step pair is nearly frozen (0.004)
- WARN run down-right: run pair is nearly frozen (0.004)
- WARN run down-left: run pair is nearly frozen (0.004)

### zanzibel_market_queen (zanzibel_market_queen)
- REVIEW frame 3: walk down looks closer to downright than down
- REVIEW frame 15: walk up looks closer to upright than up
- REVIEW frame 17: run down looks closer to downright than down
- REVIEW frame 23: run up looks closer to upright than up
- WARN walk left: step frames 1/3 are nearly frozen (0.009)
- WARN walk right: step frames 1/3 are nearly frozen (0.009)
- WARN run left: run pair is nearly frozen (0.009)
- WARN run right: run pair is nearly frozen (0.009)
- WARN walk up-right: diagonal step pair is nearly frozen (0.008)
- WARN walk up-left: diagonal step pair is nearly frozen (0.008)
- WARN run up-right: run pair is nearly frozen (0.008)
- WARN run up-left: run pair is nearly frozen (0.008)

## All Registered Sheets

| id | art | role | issue count |
|---|---|---|---|
| dorin | dorin | hero | 6 |
| faye | mia | hero | 0 |
| milo | milo | hero | 0 |
| pippa | pippa | hero | 3 |
| rex | jay | hero | 7 |
| ana | ana | npc | 9 |
| arcadeOwner | arcadeOwner | npc | 5 |
| aurora_busker | aurora_busker | npc | 0 |
| baobab_healer | baobab_healer | npc | 2 |
| bell_choir_child | bell_choir_child | npc | 2 |
| bootstep_shepherd | bootstep_shepherd | npc | 6 |
| busDriver | busDriver | npc | 24 |
| caddy | caddy | npc | 8 |
| canteen_keeper | canteen_keeper | npc | 0 |
| captain | captain | npc | 1 |
| chad | chad | npc | 10 |
| cp_dabbawala | cp_dabbawala | npc | 12 |
| cp_spice_merchant | cp_spice_merchant | npc | 0 |
| cp_stationmaster | cp_stationmaster | npc | 8 |
| cp_usher | cp_usher | npc | 0 |
| curator | curator | npc | 0 |
| deliKeeper | deliKeeper | npc | 23 |
| docBrickton | docBrickton | npc | 4 |
| dockworker | dockworker | npc | 0 |
| docPuerto | docPuerto | npc | 5 |
| docValle | docValle | npc | 8 |
| drugClerk | drugClerk | npc | 4 |
| fernLady | fernLady | npc | 22 |
| fjord_nurse | fjord_nurse | npc | 25 |
| glint | glint | npc | 6 |
| grand_duchess_millimetta | grand_duchess_millimetta | npc | 6 |
| grayCommuter | grayCommuter | npc | 0 |
| kvisthavn_fisher | kvisthavn_fisher | npc | 4 |
| kvisthavn_shopkeeper | kvisthavn_shopkeeper | npc | 0 |
| laughing_ruins_guide | laughing_ruins_guide | npc | 0 |
| lh_calligrapher | lh_calligrapher | npc | 16 |
| lh_harbor_master | lh_harbor_master | npc | 4 |
| lh_lantern_girl | lh_lantern_girl | npc | 4 |
| lh_tea_monk | lh_tea_monk | npc | 10 |
| lilleby_giant_child | lilleby_giant_child | npc | 6 |
| lilleby_undertaker | lilleby_undertaker | npc | 4 |
| manager | manager | npc | 0 |
| martClerk | martClerk | npc | 0 |
| matchbox_herald | matchbox_herald | npc | 0 |
| mayor_of_lilleby | mayor_of_lilleby | npc | 0 |
| mercadoKeeper | mercadoKeeper | npc | 0 |
| mom | mom | npc | 0 |
| mr_click | mr_click | npc | 0 |
| mrPlummer | mrPlummer | npc | 15 |
| mrsPemmel | mrsPemmel | npc | 26 |
| npc_bert | npc_bert | npc | 0 |
| npc_borden | npc_borden | npc | 1 |
| npc_clerk | npc_clerk | npc | 0 |
| npc_depot_clerk | npc_depot_clerk | npc | 0 |
| npc_hodgkin | npc_hodgkin | npc | 0 |
| npc_realtor | npc_realtor | npc | 2 |
| npc_waitress | npc_waitress | npc | 3 |
| nurse | nurse | npc | 0 |
| oldTimer | oldTimer | npc | 8 |
| pajamaKid | pajamaKid | npc | 4 |
| permit | permit | npc | 0 |
| pigeonKid | pigeonKid | npc | 24 |
| priestOtter | priestOtter | npc | 4 |
| priestValle | priestValle | npc | 0 |
| quarterMan | quarterMan | npc | 14 |
| royal_census_taker | royal_census_taker | npc | 2 |
| senora | senora | npc | 16 |
| sidewalkCritic | sidewalkCritic | npc | 0 |
| sigrid_spectacles | sigrid_spectacles | npc | 0 |
| sleepwalker_miner | sleepwalker_miner | npc | 0 |
| smiler | smiler | npc | 0 |
| smilerB | smilerB | npc | 0 |
| spool_engineer | spool_engineer | npc | 4 |
| teacup_innkeeper | teacup_innkeeper | npc | 6 |
| tiny_postmaster | tiny_postmaster | npc | 2 |
| tomas | tomas | npc | 0 |
| uncleBert | uncleBert | npc | 0 |
| vivi | vivi | npc | 0 |
| whistle_guard_npc | whistle_guard_npc | npc | 8 |
| wisherA | wisherA | npc | 0 |
| wisherB | wisherB | npc | 8 |
| wisherC | wisherC | npc | 0 |
| wokeA | wokeA | npc | 1 |
| wokeB | wokeB | npc | 8 |
| wokeC | wokeC | npc | 0 |
| zanzibel_dockmaster | zanzibel_dockmaster | npc | 4 |
| zanzibel_market_queen | zanzibel_market_queen | npc | 12 |
