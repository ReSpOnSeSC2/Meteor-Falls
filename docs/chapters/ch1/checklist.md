# Chapter 1 — The Night It Fell — production checklist

Boxes are checked only after implementation and measured evidence exist.

## Canon, compatibility, and world

- [x] Freeze the exact 81-map Chapter 1-owned roster and dimensions.
- [x] Classify `brickton_docks` as Chapter 2-owned and `downtown_otterbrook` as an orphaned duplicate.
- [x] Add `CH1_WORLD`/roster fixed points and exhaustive contract tests.
- [x] Add deterministic recursive save-v27 recovery for downtown and four retired climb IDs.
- [x] Repair Lemonade twins/stand, `pajama_kid`, `pigeon_kid`, and every other phase-specific embedded interaction.
- [x] Make mail targets instance-specific rather than reused sprite-key specific.
- [x] Validate every transition, NPC, objective, recovery, trigger, and spawner with the real body in all four phases.
- [x] Render and inspect all 81 maps exactly once in clear native-detail groups.
- [x] Lock the mandatory Pemberton -> Hodgkin -> mower -> Trail Key -> shed -> `oak_roots` -> `oak_hollow` -> `oak_heart` -> Titanic Tick route in durable stage tests.
- [x] Measure all 47 physical Otterbrook facades: 3.104/3.844/3.75/5.31 Jay-height min/mean/median/max, with homes in the 3.6-3.9 band.

## Profiles and story transactions

- [x] Implement and exhaustively test the named 57-profile Chapter 1 developer matrix.
- [x] Make the opening exterior/house/wake chain resumable at every commit seam.
- [x] Make Glint meeting/Locket/Sentinel/walk-home exact and reward-once.
- [x] Make porch Spark/awakening full-bag safe, resumable, and idempotent.
- [x] Make Hush morning and Tick/Ember stages resumable and monotonic.
- [x] Make Faye/pan/equip one coherent idempotent transaction.
- [x] Make Manager outcome/presentation reward-once and restart-safe.
- [x] Wire the real payphone/First Heartlight/Ember/completion/card chronology.
- [x] Serialize overlapping trigger contacts and prove cleanup after every terminal path.

## Quests, combat, input, and audio

- [x] Exercise all five quest frontiers, full bags, repeats, reloads, defeats, post-boss, and post-chapter states through runtime methods.
- [x] Add direct Hush Sentinel BattleScene coverage and live pass.
- [x] Add direct Titanic Tick latch/drain/sever/terminal coverage and live pass.
- [x] Add direct Manager/PRAY coverage and live pass.
- [x] Reconcile every Chapter 1 encounter tell with actual trigger/spawner behavior.
- [x] Add gamepad pre-connected/fallback/multi-pad/disconnect and rebinding tests.
- [x] Add dialogue/battle/cinematic touch geometry and held-role cleanup tests.
- [x] Add unified audio visibility/native-focus/mute/restart tests.
- [x] Measure/tune opening timing, rapid/held input, focus loss, and camera completion.

## Art and evidence

- [x] Reproduce the bench stripe, ward-bed residue, crater Tick panel, and false/dead First Heartlight context.
- [x] Repair bench and ward bed with retained accepted masters, provenance, broad-processor guards, and live compositing proof.
- [x] Author and retain sources for the new Hickory Hill cave Tick, Brickton Mom-call, and Jay/Mia First Heartlight panels; wire their ordinary-play consumers.
- [x] Complete native and exact-viewport crop/context review for the three new Chapter 1 panels; exercise timing and resumability through profile-driven runtime/live QA.
- [x] Classify every Chapter 1 panel as live, conditional, gallery-only, or dead.
- [x] Eliminate unrelated enemy mini fallback identities.
- [x] Ship authored Borden/Realtor/Waitress 46-frame sheets, accepted runtime/master pairs, native review contacts, deterministic provenance, broad-processor guard, and named individual/aggregate rebuild scripts.
- [x] Produce native-detail story, enemy, NPC, prop/facade, phase, boss, and changed-item contacts, including accepted real runtime captures for all three story phases.
- [x] Add automated dimensions, alpha-edge, clone, wear, direction, registry, provenance, context, and crop contracts.

## Live close and release record

- [ ] Complete one uninterrupted New Game-through-Chapter-1-completion-and-backtracking session; critical phases were instead covered by 57 deterministic profiles, runtime suites, and live captures.
- [x] Pass desktop 1280×720, portrait 390×844, and landscape 844×390.
- [x] Exercise keyboard, touch, remap, automated controller mapping, rapid/held input, save/continue, focus loss, defeat, flee, and full bags across runtime suites and profile-driven live QA.
- [x] Record settled fresh-load console with zero unexpected warnings and zero errors.
- [ ] Obtain a physical-controller hardware pass; hardware was unavailable, and automated mapping coverage is not counted as physical evidence.
- [x] Reconcile Chapter 1 documentation while preserving labeled history.
- [x] Run the broadened exact fourteen-step final gate sequence and confirm the 34-file/1,030-test focused result.
- [x] Review the literal staging allow-list, protected primary-tree hashes, and complete diff before the requested no-push commit.
