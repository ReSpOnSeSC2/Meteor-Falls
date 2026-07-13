# Chapter 4 production verification

Verified 2026-07-12 (America/New_York) on `codex/chapter-4-production-rollout`, based on `main` at `55ab08cb`.

## Shipped contract

- Six-map Norway route: Kvisthavn (64x48), Bootstep Moor (112x80), Lilleby (72x56), the Sleeper's Hand (48x36), Shoulder (56x40), and Ear (52x40).
- Kvisthavn's first four stable generated units provide a live cabin/home service, supply shop, property agency, and vehicle/fuel service.
- Bridge Berry's art and collider share `moor_berry_cleared`; fight and roll outcomes both clear the same blocker.
- Meltfall art and collision share one rectangle and `spine_meltfall_frozen`; a full inventory leaves the Firecracker String claimable rather than losing it.
- The Unsent Letter uses the real `halvors_letter` key item, including compatibility repair for old flag-only saves.
- Save schema v21 repairs Chapter 4 map/spawn and parking layouts without stacking vehicles or rewriting unrelated data.
- Contextual Chapter 4 cutscenes, five regional quests, Norway Trust escalation, Whisperwig (1,800 HP), resonance, optional ending cards, and all nine Chapter 4 developer profiles are wired.

## Automated gates

| Gate | Result |
|---|---|
| `npm test` | PASS — 104 files, 1,720 tests |
| `npm run build` | PASS — TypeScript, content validation, editor freshness, and Vite production bundle |
| `npx tsc --noEmit` | PASS |
| `npm run validate` | PASS — 226 maps, 31 quests, 1,243 dialogue scripts |
| `npm run mapeditor:gen` + `npm run mapeditor:check` | PASS — 226 map definitions, 215 atlas cells |
| `vite-node tools/door-audit.ts` | PASS — zero real stuck, wrong-edge, or body-blocked landings |
| `npm run balance` | PASS — Whisperwig level 22, 1,800 HP, six-turn conservative TTK, five-turn read TTK |
| `npm run enemies:frames` | PASS — 147/147 battlers fully high resolution |
| `npm run visuals:audit:strict` | PASS — 144/144 authored, zero legacy |
| `git diff --check` | PASS |

The authored world atlas is 215 cells wide and matches `TILESET` exactly. The Chapter 4 schematic review sheet is `output/maps_ch4.png` and includes the six route maps plus Kvisthavn service units 0-3.

## Live game QA

The production client was exercised through the title-screen developer profiles in the in-app browser, with keyboard input and the visible touch overlay active.

- Kvisthavn arrival and Norway ground/quay/fjord skin.
- Bootstep Moor at Bridge Berry before clearing; the scaled blocker and solid footprint cover the same bridge span.
- Lilleby's giant-scale composition and service district.
- Sleeper's Shoulder before and after Freeze; the opened crossing changes from solid meltwater to authored blue-white ice.
- Sleeper's Ear boss profile entered the real Whisperwig battle scene with the level-22 Jay/Mia/Milo party.
- Post-boss and complete profiles loaded without pre-boss encounter spawners.
- A final fresh Lilleby run reported no console warnings or errors. Unsupported wandering animations found during the pass were removed from the affected decorative children.

Controller behavior is covered by the existing input/runtime test suite; no physical gamepad was available for this browser session.

## Known repository warnings and waivers

- Door audit reports 12 intentional one-way transitions, including region-to-Lucille travel.
- Three generated/frozen body-box findings are explicitly waived and clamp-rescued; there are zero non-waived body-box failures.
- Static content validation retains the documented frozen-pyramid reachability and encounter-pressure waivers.
- Strict visual audit reports 94 authored battle PNGs that are present on disk but not registered; authored coverage remains 144/144 with zero legacy assets.
- Vite reports the existing unresolved-at-build-time `jay_standing_8dir_fullres.png` URL and the existing large main-chunk advisory. Neither fails the production build.
- The i18n test intentionally logs its missing-key fallback case for `menu.doesNotExist`.

No test was skipped or deleted. Pre-existing edits in `docs/VERIFICATION.md`, `docs/asset-lists/visual_identity.md`, and everything under `tmp/` are excluded from the Chapter 4 commit.
