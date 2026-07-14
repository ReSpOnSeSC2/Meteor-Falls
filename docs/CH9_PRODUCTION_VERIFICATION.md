# Chapter 9 production verification

**Chapter:** 9 — *The Count of Valea Stelelor*
**Production branch:** `codex/chapter-9-production-rollout`
**Exact starting commit:** `f2b27c5a8125b13ce658bc36aaf282f98265cc8b`
**Production date:** 2026-07-14
**Chapter 9 commit:** this commit, `Complete Chapter 9 production rollout`
(the immutable hash is recorded by Git history)
**Push / merge:** none; neither action was authorized or performed

This record supersedes the compact Chapter 9 scaffold and the historical M21
catalog-only assumptions. Registration, compilation, or an inherited asset by
itself is not treated as release proof. The results below are the measured
production close for the implemented world, systems, art, tests, and live QA.

## Final world contract

| Stable map id | Final size | Production signature |
| --- | ---: | --- |
| `valea_stelelor` | 80×64 | Warm crescent village, rail apron, Buni's table, civic green, painted homes, church, mill, and Old Road gate. |
| `old_road` | 96×72 | Five-wide climbing switchback, three safe pockets, five pantry cues, and escalating encounter overlooks. |
| `castle_hoaxula` | 72×96 | Ticket queue and fake attraction give way to bankrupt backstage, a separate throne arena, choice chamber, picnic recovery, and mountain exit. |
| `stone_brow_monastery` | 64×88 | Quiet processional climb through separate trial, name/awakening, and bell/Heartlight courts. |

`CH9_WORLD` is the single fixed-point source for dimensions, route mouths,
body-safe landings, story/quest rectangles, recoveries, migration, parking, and
developer spawns. Valea has nine live villagers using four strict-clean NPC
sheet identities. All five Buni pickups have adjacent, ingredient-specific
visible cues that retire when collected. Castle has a usable picnic table and
clear restart/recovery feet. The complete four-panel map render was inspected
at original resolution with no disconnected route, clipped title, or release
geometry defect.

The Orient Less-Express owns arrival; Bert and Lucille do not. All four regional
connections remain reciprocal for backtracking. Old Road and Castle hostile
spawners retire after Count Hoaxula, leaving calm Castle/Monastery travel after
the chapter outcome.

## Story, quest, choice, and combat

Buni's five pickup flags serialize independently. Her return planner commits
gathering and cooking in order; a full bag keeps the Feast Basket, recipe,
completion flag, and Caller retryable, while a successful transaction grants
each exactly once. All quest work remains reachable after the boss.

OPEN HAND and IRON validate before mutation and atomically replace sibling
flags, branch side effects, and the Vlad Caller. Actual Held Breath rewind tests
restore the exact pre-choice party/Pippa record, equipment, bag state, Buni
progress, Trust/Clicker/army continuity, callers, choices, and earlier Embers,
then permit an exact re-decision. Dorin's name, Comet Ω awakening, Heartlight,
Ember 9, and `ch9_complete` remain separate resumable stages.

The accepted regular roster is exactly Haystack Mimic, Ribcage Rattler, Moss
Strigoi, Animated Armor, and Wolf of the Old Road. Their world tells, useful
drops, battle hooks, death lines, retirement, and aligned base/wear/mini families
are tested. Haystack's Play Dead creates a three-turn PARALYZED action risk;
Ribcage's self-only mend restores exactly 12% max HP, or 1,800 of 15,000.

Count Hoaxula remains level 46 and exactly 95,000 HP. THEATRICAL turn-two theft
escrows the exact valid hero/slot/item without removing the item from its bag.
Invalid slots invent nothing. BREAK, Sleep, Freeze, and ward answer the declared
windup; the 50% UNMASKED transition occurs once in narration/form/art order;
good-or-better PRAY mercy is UNMASKED-only. Mercy, zero-HP victory, defeat/retry,
and teardown restore the exact equipment slot before overworld saving. The final
balance report measures conservative TTK 5 and read/setup TTK 4.

## Save v26 and developer profiles

Save v26 exists for the four replaced Chapter 9 geometries and Valea parking
apron. The v25→v26 step is deterministic, idempotent, future-rejecting, and
recursive through Held Breath snapshots. It recovers only invalid Chapter 9
location/parking geometry, performs only justified completed-scaffold
awakening/Heartlight backfill, and does not infer a moral choice, Count defeat,
or Buni progress. Unrelated state remains exact.

The developer matrix contains exactly 25 level-46 states and ten
present/departed Pippa pairs. It covers arrival, village and Buni states,
full-bag retry, Old Road, Castle entry, pre-boss, real THEATRICAL and UNMASKED
battle contexts, post-boss, both choices, monastery, awakening resume, complete,
and calm departed-Pippa backtracking. Exhaustive profile and rewind tests use
real `CH9_WORLD` feet and exact serialized records.

## Art and original-resolution evidence

Production ships fourteen 1600×900 contextual panels for seven
Pippa-present/departed beats and fourteen retained source masters. Eleven
visible wear corrections cover Haystack, Moss, Armor, Wolf, theatrical Count,
and unmasked Count, with eleven retained generated masters. Existing good NPC,
facade, regional, background, base, mini, train, Ribcage, and solo trial assets
remain reused.

Original-resolution review covered `output/maps_ch9.png`, all contextual panels,
all corrected wear families, and thirteen intentional contact sheets under
`output/ch9_asset_contacts/`; no release defect remained. Final evidence uses
`output/visual_identity_ch9.md`, `output/character_animation_ch9.md`, and
`output/character_animation_ch9.html`. Exploratory `*_baseline*` reports are
excluded from the release commit.

## Focused and final command evidence

Focused Chapter 9 safety coverage is **PASS — 17/17 files, 462/462 tests**. It
pins map/body reachability, Buni transactions, actual OverworldScene and
BattleScene paths, choice/Held Breath integration, save migration, all profiles,
contextual assets, wear families, roster, and balance.

After production documentation is frozen, the exact close sequence is rerun in
the following order without substitutions. These are the final measured
results; volatile durations are intentionally not recorded.

| # | Command | Final measured result |
| ---: | --- | --- |
| 1 | `npx.cmd tsc --noEmit` | **PASS** |
| 2 | `npx.cmd tsx tools/door-audit.ts` | **PASS** — 273 maps; 0 real stuck, wrong-edge, or body-blocked doors; 11 intentional one-way transitions and 2 frozen-pyramid body-box waivers. |
| 3 | `npm.cmd run mapeditor:gen` | **PASS** — 62 tiles, 325 props, 276 facades, 10 regions, 99 NPCs, 21 tracks, 17 areas, 1,495 dialogue ids, 273 maps, 161 handlers / 160 used trigger ids. |
| 4 | `npm.cmd run validate` | **PASS** — 270/273 maps clear static reachability with 3 frozen-rotor waivers; 271/273 clear encounter pressure with 2 frozen-rotor waivers; generated data current. |
| 5 | `npm.cmd run visuals:audit:strict -- --out=output/visual_identity_ch9.md` | **PASS** — 144/144 authored, 0 legacy; the inherited global 94-unregistered-battler advisory remains informational. |
| 6 | `npm.cmd run enemies:frames` | **PASS** — 147/147 battlers fully hi-res. |
| 7 | `npm.cmd run anim:audit:strict -- --out=output/character_animation_ch9.md --html=output/character_animation_ch9.html` | **PASS** — 84/100 clean, 0 errors, 0 warnings, 58 inherited visually reviewed hints. |
| 8 | `npm.cmd run balance` | **PASS** — Count 95,000 HP at level 46; conservative TTK 5, read/setup TTK 4. |
| 9 | `npm.cmd run test` | **PASS** — 133/133 files, 2,177/2,177 tests. |
| 10 | `npm.cmd run build` | **PASS** — 1,082 modules; inherited runtime-resolved Jay URL and chunk-size advisories accepted. |
| 11 | `node_modules\.bin\vite-node.cmd tools/render-map.ts ch9` | **PASS** — `output/maps_ch9.png`, 1186×1088, 4 panels; original-resolution rereview clean. |
| 12 | `npm.cmd run encounters` | **PASS** — 273 maps scored, 271 clear; only 2 documented frozen-rotor waivers. |
| 13 | `git diff --check` | **PASS** |

## Settled-frame live QA

- Desktop 1280×720: arrival, Buni, Old Road, a regular battle, Castle, both
  Count forms, choice, monastery, IRON, OPEN HAND, `completeDeparted`, and calm
  Castle/Monastery backtracking rendered and responded correctly.
- Portrait 390×844: touch overlay, A/B, menu, dialogue, Jay's 14/14 full bag,
  and Buni's retry path were exercised.
- Landscape 844×390: a real `postUnmaskDeparted` battle rendered; touch A chose
  Bash for 154 damage and touch B responded.
- A fresh settled `completeDeparted` tab reported **0 warnings and 0 errors**.
  QA tabs were finalized and the temporary development server was stopped.
- Physical controller hardware was unavailable. No live hardware pass is
  claimed; automated controller mapping coverage is not presented as one.

## Protected work and release scope

The protected files in the user's primary dirty checkout were rehashed exactly:

- `docs/VERIFICATION.md` —
  `079CD5D7012FF9FB8C3DF40AA99181ED354B1E099B79861AF6A544A8476E5390`
- `docs/asset-lists/visual_identity.md` —
  `16E707CBE88D145D5885B377E6B089FA17C59F0A7A94A12AC0618016FB228F19`

The isolated clean worktree's committed `docs/VERIFICATION.md` differs from the
primary checkout because the user's protected edit remains only in that dirty
primary checkout. It was never copied into, overwritten from, or staged by the
Chapter 9 worktree. Neither protected path nor `tmp/**` is part of this rollout.

Only literal Chapter 9 allow-list paths are staged. The final cached path audit
contains no protected or excluded path, final cached diff checking is clean,
and exploratory baseline reports are excluded. The rollout is committed with
the exact message `Complete Chapter 9 production rollout`; nothing is pushed or
merged.

## Accepted non-blocking debt

Required release work is complete. Remaining observations are limited to 58
inherited reviewed animation hints, the global 94-unregistered-battler visual
advisory, the inherited runtime-resolved Jay URL advisory, the build chunk-size
advisory, and unavailable physical controller hardware. None is a missing
Chapter 9 runtime or content dependency.
