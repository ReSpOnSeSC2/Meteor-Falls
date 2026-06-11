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
| 9 | **S9 JOURNAL, tap-only** — accept Mail Must Move from Mr. Plummer by tap, deliver one letter, open START → JOURNAL: rows tap-select, the detail page tap-dismisses, hardware back closes the journal (= B, ADR-026); after completion the row shows its phone icon | ⬜ | ⬜ | |

Chapter-1-twice run (the S8 "done when"): name-entry → ch1_complete
touch-only ⬜ · pad-only ⬜ — each including one shop purchase, one ATM
withdrawal, one save/kill/continue.

When a row fails: reproduce in the browser at `pump(n, 8.33)` first
(ADR-024's regime catches every drop so far), fix, re-pre-flight, rebuild,
re-test the row on device.

> Prompt 43's full-game gauntlet will extend this file; keep S8 rows intact
> as the baseline input record.

## S9 browser pre-flight — 2026-06-11, quests + journal (ADR-008 driver)

All on the dev build via `pump/key/holdKey`; the journal leg additionally at
the ADR-024 worst case (`pump(n, 8.33)`, one-frame keydown→keyup taps):

| Check | Result |
|---|---|
| **Mail Must Move end-to-end on a FRESH save** — name entry → intro → Mom's gear → Plummer's ask (fade-restart arms the lawn guard) → 5 doors → Salt Shaker one-shots the guard mower (flat 40 ≥ 38 HP) → completion | ✅ stamps granted, `q_mail_done`, ledger `[Mr. Plummer]` |
| **Biscuit, Come Home end-to-end POST-ch1** (constructed post-`ch1_complete` state: Mia in party, all S2 flags) — dawn ask, paw-print clue at the trailhead, hill clue, Biscuit at OTTERBROOK DRUG, zoom home, collar | ✅ `lucky_collar` granted, biscuit_home NPC in the park, ledger `+ Mrs. Pemmel` |
| **Lemonade Empire end-to-end POST-ch1** — jug at the ask, sugar (drugstore), city lemons (STARMART via the 6:15 both ways), spring fill on the hill, delivery cascade, glass one | ✅ goods consumed, jug returned, ledger `+ Ana & Vivi`; free lemonade granted on every later talk (hands-full variant heals 12 on the spot) |
| **JOURNAL at 120Hz one-frame taps** — START → Down ×4 → confirm; rows with phone icons; detail page; KeyZ dismiss; B-out ×2 | ✅ all three quests listed, 3 phone icons, in-voice details ("Mrs. Pemmel owes you a phone call."), every one-frame press registered |
| **Ledger survives process death** — Dad save → tab kill AND a full dev-server kill → Continue | ✅ `callers[]` intact, v3 blob; v2→v3 migration covered in vitest (empty-ledger backfill, v1→v3 chain) |
| **Fresh Stamps sell-high gag** — drugstore SELL flow | ✅ "Fresh Stamps: $120" (`sellPrice(240)`), cash conserved to the dollar across the whole run |
| **Lucky Collar equip** — EQUIP → Other → preview | ✅ "Rex: Luck up by 7!" (charm branch of `confirmEquip`), STATUS Luck reads through `heroLuck` |
| `npm test` | ✅ validator (3 quests counted, §A10 manifest live) + 121 vitest |

Driver notes for future bots (learned the hard way): drain PAGES with KeyX,
confirm ASKS with KeyZ (KeyX picks the cancel row — it "Stay"-ed the bus);
edge-triggers re-fire only after leaving the rect; never `scene.restart` onto
an NPC's tile (their solid wedges the player); a killed eval can leave a held
key stuck — release all keys before each chunk.

## S9b browser pre-flight — 2026-06-11, motion / night / the upstairs wing

| Check | Result |
|---|---|
| **Follower animation** (the frozen-conga bug) — sustained walk: follower plays `chad-walk-left`, frames cycling, stops on the stand frame on release | ✅ (the old per-crumb motion check thrashed play/stop — leader motion drives the conga now) |
| **Run cycles** — leader `rex-run-right` + follower `chad-run-right` while B-held, frames cycling; patrol chases and pursuing walkers use `-run-` too | ✅ sprint gait (step poses only, no neutral frame), zero new pixels, ADR-009/022 contracts intact |
| **Night** — pre-dawn hill banner shows "HICKORY HILL" + dim "2 A.M.", haze overlay on; after `zapper_done` the tag AND haze are gone (dawn reaches the hill now) | ✅ |
| **The upstairs wing** — bedroom → hall → Ana's room (present → STAR COLA, box swaps open) → Vivi's room (present → CORN DOG) → stairs → kitchen → Mom → street, fresh save | ✅ shots `s9b_rex_hall.png`, `s9b_ana_room.png` |
| `npm test` + `npm run build` | ✅ 121 vitest + validator (3 new maps swept) |
