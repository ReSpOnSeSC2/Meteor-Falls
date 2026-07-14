# Chapter 9 — The Count of Valea Stelelor — production checklist

This checklist records completion against `blueprint.md`. Boxes are checked only
after the implementation or measured evidence exists.

## Canon and world

- [x] `CH9_WORLD` centralizes four map sizes, transitions, safe landings,
      recoveries, story/quest rectangles, migration, parking, and profiles.
- [x] Valea is an inhabited crescent village with rail apron, Buni's table,
      provisioner, homes, church, mill, well, authored facades, and honest seams.
- [x] Old Road is a readable five-wide climbing journey with three safe pockets,
      recovery rhythm, escalating tells, and accessible quest pickups.
- [x] Castle communicates queue/showroom fakery, bankruptcy/backstage hurt,
      distinct boss/choice staging, gated monastery route, and calm retirement.
- [x] Stone Brow separates trial, name/awakening, and bell/Heartlight courts.
- [x] Every door is reciprocal and body-safe; required paths are exhaustive-BFS
      reachable; landings, props, NPCs, signs, spawners, recoveries, and triggers
      do not overlap.
- [x] `tools/render-map.ts ch9` includes every relevant Chapter 9 map and produces
      a legible original-resolution labeled sheet.

## Story, quest, and branches

- [x] Orient Less-Express travel is resumable, contextual, and never plays the
      seven-panel spoiler gallery or repeats the offer indefinitely.
- [x] Buni's five pantry pickups persist independently and match committed items.
- [x] Buni's return/cook/reward planner handles partial, full-bag, retry, done,
      recipe, and exactly-one Caller/reward transactions.
- [x] All Buni work remains reachable after the boss.
- [x] Boss success lands at a distinct pre-choice anchor without inventing a
      moral outcome.
- [x] Choice recording validates before mutation and atomically handles sibling
      flags, `alsoSets`, withholding, and the Vlad Caller.
- [x] Held Breath restores exact Pippa, equipment, quest, Trust/Clicker/army,
      Caller, choice, and Ember state before re-decision.
- [x] Present/departed Pippa dialogue and panel selection are correct.
- [x] Trial, birth name, Comet Ω, Heartlight, Ember 9, and `ch9_complete` are
      separately staged, resumable, idempotent, and never inferred from location.

## Combat

- [x] Five regular enemies have distinct map tells, decision hooks, useful
      identity drops, specific death lines, correct placement, and retirement.
- [x] Every regular has aligned, visibly progressive base/w1/w2 and mini art.
- [x] Count begins THEATRICAL; turn-two theft records exact valid hero/slot/item.
- [x] Empty/invalid slots cannot invent or destroy an item.
- [x] Break, Sleep, Freeze, and ward answer the telegraphed windup as designed.
- [x] Exactly 50% unmask occurs once, in narration/form/art order.
- [x] Good-or-better PRAY mercies only UNMASKED Count; zero HP still wins.
- [x] Mercy, HP victory, defeat/retry, and teardown restore the exact slot before
      OverworldScene can save.
- [x] Level-46 balance and the wider boss ladder remain measured and acceptable.

## Save and developer profiles

- [x] Save version 26 exists only for real Chapter 9 geometry recovery.
- [x] v25→v26 is deterministic, idempotent, future-rejecting, recursive through
      Held Breath, and exact for unrelated state.
- [x] All four map anchors and Valea parking recovery are covered.
- [x] Completed scaffold saves receive only justified awakening/Heartlight
      backfill; no moral choice or Buni progress is invented.
- [x] All blueprint profiles are coherent level-46 states at safe registry feet,
      including direct theatrical/post-unmask battle contexts, departed Pippa,
      and full-bag retry.

## Art and evidence

- [x] Existing NPCs, facades, tiles, background, enemy bases/minis, train, and
      solo Trial panel are retained where good.
- [x] New raster edits use image generation, retain masters/provenance, create
      correct runtime derivatives, register cleanly, and pass original-size QA.
- [x] Seven contextual beats have Dorin-correct Pippa-present/departed pairs.
- [x] Haystack, Moss, Armor, Wolf, and both Count form families have real wear.
- [x] Strict visual, enemy-frame, and animation audits pass without weakened gates.
- [x] Map, panel, enemy-wear, and live-QA evidence is intentional and reviewed.

## Focused tests

- [x] `maps_ch9` production contract, bounds, widths, reachability, transitions,
      trigger uniqueness, collisions, retirement, and fixed-point consumers.
- [x] Buni state machine and serialization/full-bag/exactly-once tests.
- [x] Actual-method OverworldScene Chapter 9 runtime tests.
- [x] Actual-method BattleScene Hoaxula tests for every terminal/counter path.
- [x] Choice/Held Breath integration tests.
- [x] Migration and exhaustive Title profile tests.
- [x] Chapter 9 authored-asset, panel, wear, roster, and balance tests.

## Documentation and close gates

- [x] New production ADR and all blueprint-listed stale documents reconcile to
      executable canon without rewriting accurately labeled history.
- [x] `docs/CH9_PRODUCTION_VERIFICATION.md` contains measured results and waivers.
- [x] Final TypeScript, full test, build, map-editor, map/door, strict visual,
      enemy-frame, animation, balance, and encounter commands pass.
- [x] Desktop, phone portrait/landscape, touch, hazardous retry, and fresh-console
      live QA are settled-frame checks; controller availability is honest.
- [x] Primary protected hashes still match exactly and protected paths/`tmp/**`
      are absent from worktree diff, index, and commit.
- [x] Only the explicit Chapter 9 allow-list is staged and committed with message
      `Complete Chapter 9 production rollout`; nothing is pushed or merged.
