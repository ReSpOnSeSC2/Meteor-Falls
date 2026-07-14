# Chapter 1 production verification

This record contains measured evidence for the Chapter 1 production-polish
branch. It begins with the inherited baseline and is completed only after the
final gate/live-QA sequence.

## Scope and preservation

- Starting commit: `bd50dcab685733c67c1119eafcd89bc71453559e`.
- Branch: `codex/chapter-1-polish`.
- Isolated worktree: `C:\tmp\meteor-falls-ch1-polish`.
- Primary checkout was not reset, restored, stashed, cleaned, switched, merged,
  or used for implementation.
- Required primary hashes at preflight:
  - `docs/VERIFICATION.md` — `079CD5D7012FF9FB8C3DF40AA99181ED354B1E099B79861AF6A544A8476E5390`.
  - `docs/asset-lists/visual_identity.md` — `16E707CBE88D145D5885B377E6B089FA17C59F0A7A94A12AC0618016FB228F19`.

## Inherited baseline — 2026-07-14

| Gate | Measured result |
| --- | --- |
| TypeScript | PASS. |
| Door/body audit | 273 maps; 0 real stuck, wrong-edge, or body-blocked; 11 one-way; 2 frozen-pyramid body waivers. The report reproduced orphan/asymmetric `downtown_otterbrook` plus its three interiors. |
| Map editor | 62 tiles, 325 props, 276 facades, 10 regions, 99 NPCs, 21 tracks, 17 areas, 1,495 dialogue IDs, 273 maps, 161 handled/160 used trigger IDs. |
| Validation | 270/273 clear; only three frozen-rotor static waivers. |
| Strict visual identity | 144/144 authored, 0 legacy; broad gate PASS. |
| Enemy frames | 147/147 fully high resolution. |
| Strict animation | 84/100 clean, 0 errors, 0 warnings, 58 review hints. |
| Balance | PASS; Titanic Tick measured at 200 HP, level 8 simulation band, conservative TTK 6/read TTK 5. |
| Focused Chapter 1 baseline | 21/21 files, 554/554 tests. |
| Full tests | 133/133 files, 2,177/2,177 tests. |
| Production build | PASS; 1,082 modules. Inherited advisories: unresolved `jay_standing_8dir_fullres.png` URL and large main chunk. |
| Baseline Ch1 render | 1,186×3,462, only 13 maps; inspected at original resolution and proven incomplete versus the frozen 81-map roster. |
| Encounter pressure | 271/273 clear; only two frozen-rotor waivers. |
| Patch integrity | PASS; generated line-ending markers noted, no whitespace errors. |

The prescribed `npx.cmd tsx tools/door-audit.ts` was not reproducible at
baseline because `tsx` is not a pinned dependency; `npx` attempted an unpinned
download and execution. The same repository audit was measured with the pinned
`vite-node` runtime. Final close must make the exact prescribed command
reproducible rather than silently substituting it.

`npm ci` reported seven dependency advisories (3 moderate, 3 high, 1 critical).
Those are package metadata and are not represented as a clean or dirty live
browser console.

## Reproduced defects before editing

- Native bench art contains a bright horizontal magenta stripe through its
  slats; ward-bed alpha edges/seams contain visible magenta/purple residue.
- Titanic Tick's 1600×900 reveal depicts the meteor crater rather than its live
  deepest-Hickory-Hill-cave arena.
- The registered First Heartlight panel/staged chamber is not called in ordinary
  play and contradicts the live post-payphone copy.
- New Game reached the authored opening; first bedroom dialogue appeared only
  after the long card/house/hill sequence. Fourteen 120-ms rapid A presses did
  not clear the seven-line wake dialogue and left it partway through line three,
  establishing a rapid-input pacing seam for controlled tests.
- Broad baseline tests/gates remained green despite all of the above.
- Runtime audit reproduced non-atomic opening, Locket/Sentinel, porch Spark,
  Tick/Ember, Faye pan/equip, Manager, and Mom/Heartlight/completion seams;
  fire-and-forget Chapter 1 trigger concurrency; battle shutdown cleanup gaps;
  gamepad/touch/rebinding state drift; and split audio-focus authority.
- World audit reproduced embedded Lemonade twins, `pajama_kid`, and
  `pigeon_kid`; orphan downtown; and reused-sprite mail delivery ambiguity.

## Baseline evidence intentionally excluded from staging

- `output/visual_identity_ch1_baseline.md`
- `output/character_animation_ch1_baseline.md`
- `output/character_animation_ch1_baseline.html`
- `output/maps_ch1_baseline.png`

## Implementation and asset evidence (final gate totals follow)

- The mandatory Hush-morning route now advances through Pemberton, Hodgkin's
  request, the runaway mower, the shared Trail Key, the walk-through shed,
  `oak_roots`, `oak_hollow`, and `oak_heart` before Titanic Tick. Durable route
  stages and the developer-profile frontier use the same route reducer.
- Otterbrook currently has 47 distinct physical facade placements after
  collapsing open/closed state twins. Their measured heights are 3.104
  minimum, 3.844 mean, 3.75 median, and 5.31 maximum Jay-heights; homes stay in
  the 3.6-3.9 band. This is executable placement evidence, not an art-file
  dimension claim.
- New contextual Mom-payphone, First Heartlight, and Hickory Hill cave Tick
  panels exist as 1600x900 runtime assets with retained generated sources.
  Their ordinary-play consumers are wired, and their native and exact-viewport
  crop contacts have been reviewed in `output/ch1_asset_contacts/`.
- Borden, Realtor, and Waitress now use authored 46-frame, 384x1536 walk
  sheets with distinct grounded walk poses. Runtime sheets are synchronized to
  accepted masters, and native review contacts are included in the Chapter 1
  contact set. `npm run ch1:npc:borden`, `npm run ch1:npc:realtor`, and
  `npm run ch1:npc:waitress` rebuild them individually; the aggregate
  `npm run ch1:npcs:walks` rebuilds all three.
- Deterministic source/runtime/master/review hashes for those three NPCs live
  in
  `assets/art/masters/generated/ch1-expanded/npc-walk-atlas-provenance.json`
  and are enforced by the Chapter 1 asset contract.
- The broad `tools/process-ch1-expanded-art.py` processor excludes Borden,
  Realtor, and Waitress, so it cannot overwrite their accepted walk cycles.
  Their dedicated `tools/assemble-ch1-walk-atlas.ts` pipeline is the only
  rebuild path, and the asset guard pins each byte-identical runtime/accepted-
  master pair plus its retained atlas and review hashes.
- Contact 23 uses accepted, real 1600x900 runtime captures for `meteor-night`,
  `hush-morning`, and `restored-day`. The contact generator requires those
  captures explicitly and does not synthesize phase evidence by tinting a
  still.

This implementation record is paired with the final gate sequence, runtime
phase coverage, settled-console evidence, and final measured totals below.

## Final measured close

| Gate | Final measured result |
| --- | --- |
| Door/body audit | 272 maps; 0 real stuck, wrong-edge, or body-blocked doors; 7 intentional one-way doors; 2 frozen-pyramid body waivers. |
| Map editor | 62 tiles, 325 props, 276 facades, 10 regions, 99 NPCs, 21 tracks, 17 areas, 1,506 dialogue IDs, 272 maps, 162 handled/161 used trigger IDs. |
| Validation | 269/272 clear; only 3 frozen-rotor static waivers. |
| Strict visual identity | 144/144 authored; 0 legacy. |
| Enemy frames | 147/147 fully high resolution. |
| Strict animation | 86/100 clean; 0 errors; 0 warnings; 60 review hints. |
| Balance | PASS; Titanic Tick is 200 HP with conservative TTK 6/read TTK 5. |
| Full tests | 145/145 files; 2,630/2,630 tests. |
| Production build | PASS; 1,085 modules. The inherited missing `jay_standing_8dir_fullres.png` URL and large-main-chunk advisories remain advisories. |
| Chapter 1 map evidence | `output/maps_ch1.png` is 1,186x18,922 and contains all 81 Chapter 1-owned maps exactly once; `output/maps_ch1_boundary.png` is 1,186x532; `output/maps_otterbrook_scale.png` is 1,586x1,396. |
| Encounter pressure | 270/272 clear; only 2 frozen-rotor waivers. |
| Save compatibility | Save version 27; retired Chapter 1 map IDs recover recursively and deterministically. |
| Live/viewport QA | 1,280x720 desktop, 390x844 portrait, and 844x390 landscape passed keyboard, touch, and profile-driven live QA. A fresh game console settled with 0 unexpected warnings and 0 errors. |

The exact final focused command passed 34/34 files and 1,030/1,030 tests. It
broadens an intermediate post-change 20-file/646-test run--distinct from the
inherited 21-file/554-test baseline--to include the added asset-pipeline guard
and every prompt-suggested or changed Chapter 1-adjacent suite.

The only failed full-suite run was a stale state test that still expected save
version 26. The expectation was corrected to version 27, after which all
2,630 tests passed.

Critical Chapter 1 phases were exercised with all 57 deterministic developer
profiles plus runtime suites and real live captures. This record does **not**
claim one uninterrupted single-session New Game-through-post-chapter-
backtracking playthrough. Physical-controller hardware was unavailable;
controller mapping was covered by automation and is not misreported as a
physical-device pass.
