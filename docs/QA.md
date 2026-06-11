# QA.md — device & input QA log

> Started S8 (2026-06-11). INPUT IS THE RELEASE GATE (ADR-024/ADR-025):
> phones ship 90/120Hz WebViews — the exact regime where the old clock-timer
> polls dropped presses. Every fix is pre-flighted in the browser with
> `pump(frames, 8.33)` (120Hz worst-case stepping, one-frame taps) BEFORE
> re-deploying to the phone; the table at the bottom is signed off only on a
> real device.

## S8 browser pre-flight — 2026-06-11, pump @ 8.33ms, one-frame taps

Everything below ran on the dev build via the ADR-008 driver, stepping at
120Hz with worst-case one-frame key taps (`keydown` → 1 frame → `keyup`):

| Check | Result |
|---|---|
| Boot with the Capacitor shell module loaded (`initNativeShell`) | ✅ clean console; `storage.persist()` requested (false in a plain tab — the grant is meaningful on-device) |
| Title → New Game on one-frame taps | ✅ `title → nameentry` |
| Full ADR-013 name entry (4 prefills, typed player letter, food, thing, Yep!) | ✅ lands in the 2AM intro; `heroNames = Rex/Mia/Milo/Dorin`, player name committed |
| Dialogue mash — 70 one-frame advances through the intro pages | ✅ every press advanced; no double-press ever needed |
| Side-facing walk both directions (S8 hair fix, in-game) | ✅ `.shots/s8_ingame_side_right/left.png` |
| START opens the command menu on a one-frame tap | ✅ `menu` scene up |
| **Back-button path**: `INPUT.tapBtn('B')` (what `App.backButton` fires) with a menu open | ✅ menu cancelled from ONE latched frame; `held('B')` false afterward (cannot read as B-held run) |
| `npm test` | ✅ validator + 107 vitest; saves stay v2 |
| `npm run build` + `npx cap sync android` | ✅ the wrapped bundle is the same dist/ the browser runs |

Not pre-flightable in a browser: real touch overlay geometry under a camera
notch, Bluetooth pad hot-plug against Android's Gamepad API, audio focus from
an actual incoming call, and process-death persistence. Those are exactly
what the device gate below exists for.

## S8 device gate — meteor-falls-debug.apk on a real phone

Build: `npm run android:apk` → install per docs/RELEASE.md. Run each row
twice where it says so — once touch-only, once Bluetooth-pad-only. A row
passes only if **every press registers first time** (the ADR-024 standard:
zero double-presses).

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 1 | **Dialogue mash** — 30 rapid advances through Mom's kitchen lines, zero double-press needed | ⬜ | ⬜ | |
| 2 | **Full patrol battle** — Bash target select, Goods via `pick()`, Mia's PRAY from her command row; entire battle driven by tap only, then again pad only | ⬜ | ⬜ | |
| 3 | **S4 cash loop** — STARMART purchase, ATM withdrawal, Mom call curing Homesick — touch alone | ⬜ | — | |
| 4 | **Name entry, fresh install, FIRST touch** — tap cells, DON'T CARE, OK; no keyboard assumptions; verify the ADR-006 audio unlock fires from that first tap (title music starts) | ⬜ | — | |
| 5 | **Controller hot-plug both directions mid-overworld** — toast appears, touch overlay hides/shows; pad still works after backgrounding the app and returning (ADR-024 pad fallback) | — | ⬜ | |
| 6 | **Save / kill app / continue** — Call Dad, swipe the app away, relaunch, Continue resumes exactly (ADR-018 slots survive process death) | ⬜ | ⬜ | |
| 7 | **Shell behavior** — landscape locked both rotations, immersive (no status/nav bar; swipe shows them transiently), screen never sleeps during play, back button cancels menus (= B) and does NOT exit the app, overlay clear of the camera notch in both landscape orientations | ⬜ | — | |
| 8 | **Audio focus** — receive a call mid-play: synth silences; on return it resumes (no fresh tap needed) | ⬜ | — | |

Chapter-1-twice run (the S8 "done when"): name-entry → ch1_complete
touch-only ⬜ · pad-only ⬜ — each including one shop purchase, one ATM
withdrawal, one save/kill/continue.

When a row fails: reproduce in the browser at `pump(n, 8.33)` first
(ADR-024's regime catches every drop so far), fix, re-pre-flight, rebuild,
re-test the row on device.

> Prompt 43's full-game gauntlet will extend this file; keep S8 rows intact
> as the baseline input record.
