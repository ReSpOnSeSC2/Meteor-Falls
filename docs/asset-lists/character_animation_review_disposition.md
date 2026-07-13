# Character Animation Gate Review Disposition

Date: 2026-07-13
Branch: `codex/animation-gate-remediation`

## Outcome

The inherited strict audit moved from **38/97 clean, 0 errors, 263 warnings,
82 review hints** to **81/97 clean, 0 errors, 0 warnings, 58 review hints**.
`npm.cmd run anim:audit:strict` exits 0. No audit rule, threshold, registry entry,
or severity was weakened.

The final report is `output/character_animation_final.md` with its interactive
companion at `output/character_animation_final.html`. The original snapshot is
retained at `output/character_animation_baseline.{md,html}`.

## Review method

- Every baseline issue-bearing loop was played as a repeating loop in the
  interactive audit at native 1x and at a 390x844 phone-like viewport.
- New or moved frames were checked as transparent 96x128 frames, assembled into
  a 384x1536 / 46-frame candidate, audited with an override, then applied only
  after visual review.
- Runtime and master sheets were kept byte-identical for every changed ID.
- Final hero movement was exercised live in the Otterbrook development map in
  down, down-right, right, up-right, up, up-left, left, and down-left directions.
- The metric was treated as a detector, not as a substitute for looking at the
  art. One metric-clean Whistle Guard candidate was rejected because its
  down-left sequence changed into a different bearded character; the shipped
  sequence mirrors the canonical opposite diagonal and preserves identity.

## Baseline hints corrected

All 33 baseline hints below were genuine enough to repair. None remain in the
final report.

| Character | Baseline hint(s) | Disposition |
| --- | --- | --- |
| `busDriver` | 7, 11, 36-39 | Re-authored readable side and down-diagonal motion. |
| `deliKeeper` | 7, 11, 19, 21, 26, 29, 36-39 | Re-authored side and diagonal facings while preserving the uniform and apron. |
| `lh_calligrapher` | 3, 17 | Rebuilt the directional set; the down-facing stride now reads cleanly. |
| `lh_lantern_girl` | 3, 15, 17, 23 | Rebuilt the directional set with direct opposite-facing art so the lantern remains in her anatomical right hand. |
| `lh_tea_monk` | 15, 23 | Rebuilt the directional set; up-facing walk/run motion now reads cleanly. |
| `mrsPemmel` | 7, 11 | Re-authored strict left/right profiles. |
| `priestOtter` | 21 | Corrected the right-running facing. |
| `quarterMan` | 7, 11, 13, 23 | Confirmed frame 0 as canonical neutral, then rebuilt the ambiguous side/back motion and neutral pair. |
| `smilerB` | 20, 21 | Replaced the reversed right-run pair with the valid mirrored left-run motion. |

## Final review hints accepted after visual inspection

These 58 hints are intentionally non-blocking. Each loop has readable motion
and the requested facing; the classifier is reacting to asymmetric props,
costume mass, or a strong running lean. Frame numbers are the canonical
46-frame sheet indices.

| Character | Final hint(s) | Visual disposition |
| --- | --- | --- |
| `dorin` | 18-21 | Left/right run silhouettes lean toward the travel direction, but the face, torso, feet, and full loop are unambiguously side-facing. |
| `pippa` | 21, 31-32 | The right run and up-right walk are readable in motion; hair and stride asymmetry bias the nearest-facing comparison. |
| `rex` (`jay` art key) | 18-23 | Side and up run loops are correctly authored; the cap, backpack, and athletic forward lean dominate silhouette distance. |
| `ana` | 18-21, 40-41 | The side and up-right run loops read correctly; asymmetric hair, arms, and stride alter the silhouette more than facing does. |
| `as_radio` | 5, 9, 18, 20 | These are strict left/right profiles. The radio backpack and antenna dominate the metric. These four hints were introduced by the repaired, visually correct profile art. |
| `captain` | 3 | The walk frame is clearly front/down-facing; asymmetric shoulder and equipment mass pull the comparison toward down-right. |
| `chad` | 5, 7, 9, 11, 18-21 | All side walk/run loops are readable; hair, shoulders, and forward lean make them resemble the adjacent upper diagonals metrically. |
| `cp_dabbawala` | 3, 15, 17, 23 | Front/back facings are clear; the large meal canister biases every silhouette toward one side. |
| `cp_stationmaster` | 3, 15, 17, 23, 25, 36 | Front/back and down-right loops are visually distinct. The broad cap, uniform, and carried signal prop dominate the silhouette. Frames 25 and 36 are new, visually acceptable classifier hints from the corrected down-right motion. |
| `lh_lantern_girl` | up-diagonal mirror compatibility | The two up diagonals are deliberately direct-authored rather than mirrored so the lantern stays in her anatomical right hand. This one new hint is an honest prop-asymmetry exception. |
| `npc_borden` | 3 | The pose reads down/front; carried paperwork biases the silhouette. |
| `npc_realtor` | 3, 15 | Down/front and up/back are readable; the papers and arm placement dominate the nearest-facing comparison. |
| `npc_waitress` | 3, 15; down-diagonal mirror compatibility | Cardinal facings are readable. The coffee pot/menu arrangement is intentionally asymmetric, so the diagonal standing pair is not a literal mirror. |
| `senora` | 7, 11, 19, 21 | Strict left/right walk and copied run profiles are visually clear; the near-symmetric shawl and skirt make opposite profiles close in silhouette. Frames 19 and 21 are new classifier hints from the corrected run copies. |
| `wokeA` | 3 | The walk frame reads down/front; the asymmetric stance pulls the comparison slightly down-right. |
| `zanzibel_market_queen` | 3, 15, 17, 23 | Down/front and up/back loops are readable; the large fruit basket deliberately sits on one side and dominates the silhouette. |

## Reproducibility

The applied operations are recorded in:

- `docs/asset-lists/character_animation_gate_fixes.json`
- `docs/asset-lists/character_animation_gate_fixes_batch_a.json`
- `docs/asset-lists/character_animation_gate_fixes_batch_b.json`
- `docs/asset-lists/character_animation_gate_fixes_batch_c.json`

Only final manifest-referenced normalized frames and reviewed source masters are
release artifacts. Fixer backups, rejected candidates, and progress reports are
local review material and are not part of the commit.
