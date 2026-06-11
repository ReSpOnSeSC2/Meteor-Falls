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
| 10 | **S10 ARCADE LEGEND, full cabinet** — one 60s run driven entirely by the touch overlay (left thumb d-pad flies, right thumb A autofires while held), then again pad-only; hardware back mid-run opens EJECT (and does NOT exit the app); place a score, type 3-letter initials by TAPPING grid cells, table shows the row; walk away and the room music returns | ⬜ | ⬜ | the waves are scripted — a learned pattern should score the same twice |

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

## S10 browser pre-flight — 2026-06-11, ARCADE LEGEND & the STARPORT interiors

All via the ADR-008 driver; the regime legs at `pump(n, 8.33)` one-frame
keydown→keyup taps. The cabinet's waves are SCRIPTED (data/arcade.ts), so
every score below reproduces exactly.

| Check | Result |
|---|---|
| **Both arcades enterable** — fresh save: name entry → intro → street → STARPORT doorstep (found+fixed: the park hedge ran across the new doorstep — shortened to tiles 3-6); post-ch1 save: STARPORT II entered, exit lands on the jitter-derived Brickton doorstep (computed (329,313), landed (329,315)) | ✅ shots `s10_arcade2_int`, `s10_arcade_int` |
| **Sal's beat chain** — ask arms `q_arcade`; active line; claim pays the CHAMPION JACKET through the bag flow; after-line; "in a meeting" branch after `manager_defeated` | ✅ ledger gains `Sal / damage 425` (frozen record) |
| **Cabinet end-to-end** — sign pages → "Step up" → attract (MGR's lonely 003000 row, {playername}/{coolthing} live in the tag) → CAMPER run (hold fire, never move) **2337 — loses to MGR by design** → SWEEPER run (lane sweeps per the scene-header recipe) **3817 — DETHRONED**, `q_arcade_beat` set at TIME UP | ✅ deterministic both runs |
| **Initials → table** — shared letter grid (ui/lettergrid.ts), cap 3, prefilled from {playername}; rank order AAA 3817 / MGR 3000 / AAA 2337; dethrone banner + "(TELL SAL.)" | ✅ shot `s10_dethroned` |
| **The corn dog ruling** — held fire SHOOTS it (+5, the cabinet is disappointed); eating (+300) demands a ceasefire | ✅ both branches |
| **Champion Jacket** — EQUIP → Body → "Rex: Defense up by 8!"; STATUS Defense 24 (16 base + 8) through `heroDefense`; Body line on the sheet | ✅ shot `s10_defense_preview` |
| **JOURNAL** — Arcade Legend row + phone icon; detail "Done. Handled. Legendary. / Sal owes you a phone call." | ✅ |
| **Save → kill → Continue** — payphone save (Notebook 1), page reload: v4 blob, table + jacket + ledger intact | ✅ |
| **v3→v4 migration, live** — crafted TRUE v3 blob (no `arcadeScores`) in slot 2 → Continue → v4 with MGR's lonely row backfilled, rest untouched | ✅ (+ vitest covers v1→v4 chain) |
| **ADR-024 regime @ 8.33ms one-frame taps** — attract→READY on one tap; one fire tap = exactly one bolt; B→eject ask→"Keep flying" resumes; letter grid types/navigates/erases/OKs | ✅ zero drops (presses during a scene fade-in are pre-create, correctly inert) |
| **Eject (ADR-026 back = B)** — mid-run B → EJECT discards the score, returns to attract; B again walks away, overworld resumes with map music | ✅ |
| **Replayable post-quest** — third run starts from attract with the quest done; table is save data, quest completes once | ✅ |
| **Negative validator (ADR-017)** — reward typo / wrong caller power / wrong MGR score each fail naming the gap | ✅ 3 axes |
| `npm test` + `npm run android:apk` | ✅ validator (§A10 #1–4, 16 maps) + 126 vitest; fresh `meteor-falls-debug.apk` |

Driver notes added the hard way: a killed eval leaves held keys stuck —
release ALL keys before each chunk (S9's note, now twice-earned); never
`scene.restart` while a typewriter is mid-page (the everyFrame text handle
dies with the scene); presses dispatched during a fade-in land before
`create()` and are lost — settle scenes with `pump` first.

## S11 browser pre-flight — 2026-06-11, THE LIVING BATTLE (ADR-008 driver)

All legs at `pump(n, 8.33)` one-frame taps on the dev build; shots in
`.shots/s11_*`. The bench: L9 four-hero party built via `mfMakeHero` (L9
keeps Ch.1 enemies standing — an L20 bench one-shots the roster, learned
live); battles launched over the paused overworld exactly as
`startBattle` does. The full recipe lives in BattleScene's header.

| Check | Result |
|---|---|
| **Party cards** — four MOTHER-style cards: bust rises from BEHIND the box, name centered (the player's rename shows: JAY), HP/PP drums beside labels; per-hero command rows (Jay: Bash/Vibe/Goods/Defend · Mia: +Pray · Milo: Bash/GADGETS/Goods/Defend) ; Run absent in boss fights | ✅ shots `s11_latch_tether`, `s11_spy_report2` |
| **Bust states** — idle breathing, cast w/ Vibe glow, pray, gadget fiddle, rummage+munch, guard (held while defending), hurt flinch + card shake (drums never move), victory cheer loop (all four, fists up), DOWN slump → fade → per-hero angel floating over the card | ✅ cheer + dissolve in `s11_pray_nothing`; angels in `s11_angels_beside_cards`, `s11_wipe_slumping` |
| **§A4.8 statuses ON the cards** — Sunburn red edge-tint pulsing, Crying droplets, Asleep Zzz drift, Paralyzed sparks, HUSHED muzzle shimmer, Homesick {favoritefood} thought-bubble (and the §A4.4 daydream skip fired naturally in-battle: "Jay is a thousand miles away, thinking about corn dogs...") | ✅ shot `s11_status_cards_a/b` |
| **Status ticks both sides** — hero asleep skip/wake-on-hit, paralyzed skip, crying miss, hushed Vibe-block, sunburn dot + expiry lines; enemy asleep skip + wake-on-damage, crying miss, hushed move restriction | ✅ exercised over the Tick rounds via `qa()` pins |
| **The Tick's latch made visible** — latch line → throbbing magenta TETHER from mandibles to Jay's card; drain pulses + self-heal popup; **Goods → Salt Shaker**: thrown white arc over the field, burst, tether severed (`latched: false`), salt consumed from the bag, §A6 salt_break line | ✅ shots `s11_latch_tether`, `s11_salt_arc`, `s11_salt_sever` (1 try) |
| **Pray as distinct events** (qa().forcePray) — nothing (the lone hopeful mote), miraculous (warm flood + canon line), strange (wobble-dart misfires onto a random combatant), backfire (soft flare, doze branch); good/wonderful share the verified pipeline | ✅ shots `s11_pray_*` |
| **Gadgets** — solo-Milo: Gadgets row replaces Vibe (§A3 no-Vibe), Spy scanline + revealed stats, Bottle Rocket arc + payload burst (flat power, defense-pierced) | ✅ shots `s11_spy_*`, `s11_rocket_*` |
| **Mortal-roll save-by-victory (§A4.1, the soul)** — ally drum rolls mortal, NERVOUS loop + sweat while the meter races, win lands mid-roll → drum FROZEN at 41 HP, hero standing (`down: false`) | ✅ shot `s11_mortal_nervous` |
| **Full wipe** — four drums race to 000, four cards slump → fade → four per-hero angels float, defeat line, outcome `defeat`, respawn flow intact | ✅ shot `s11_wipe_slumping` |
| **Skip law (ADR-010)** — held A through victory text + timelines: ×4 compression, zero dropped beats (fx.test.ts proves event ordering under big ticks) | ✅ |
| **Enemy-side vocabulary** — impact bursts + hit-flash + flinch on every hit, floating damage/heal popups (popFoe idiom, pooled), SMAAASH comic burst + shake (collided with a rocket payload in one glorious frame), death dissolves (sprites break up and float — never squash, ADR-020) | ✅ shot `s11_rocket_arc` |
| **Fx registry gate** — ability fx unregistered / orphaned ability key / item unresolvable / orphaned item key: all four axes fail `npm run validate` naming the gap | ✅ verified live |
| **rex_hall door mats** (user catch) — north-wall door mats sit flush against the wall base, never floating mid-floor | ✅ |
| **Rename JAY** (user decree, ADR-031) — name entry prefills Jay, card reads Jay, "JAY'S ROOM" banner, {rex} token resolves everywhere; ids frozen | ✅ |
| `npm test` | ✅ validator (fx registry both directions live) + 140 vitest |

Driver lore added this session: a PHYSICAL GAMEPAD feeding INPUT trumps any
script — the user's DualSense kept winning the gauntlet's battles mid-leg;
mute the pad for scripted runs (`navigator.getGamepads = () => []`, restore
after) and field a SOLO party when a leg needs one hero's menu
deterministically. `ow.scene.restart({ mapId, x, y, facing })` is the
sanctioned way to relocate the harness between maps.

### S11 device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 11 | **S11 living battle, on device** — one Tick fight: busts animate at 60fps with all four cards, latch tether visible, salt severs it, a pray fires, held-A fast-forward stays smooth, victory cheer plays; then one wipe → four angels → defeat | ⬜ | ⬜ | pool check: no GC hitches during multi-target fx |

## S11b browser pre-flight — 2026-06-11, THE BATTLE STAGE (ADR-008 driver)

All legs on the dev build, pad muted (`navigator.getGamepads = () => []`,
the S11 lore), battles launched over the paused overworld per the
BattleScene header recipe; shots in `.shots/s11b_*`. Bench: L9 four-hero
party with the full §A8 stage kit equipped (Jay cracked_bat · Mia
hand_me_down_pan · Milo pellet_popper · Dorin cedar_beads).

| Check | Result |
|---|---|
| **The caster takes the stage** — Bash: Jay's rear-3/4 battler steps up from his card (which stands EMPTY — BustView away state), faces the bird, back-swings HIS bat looking up at it, swings, walks back; bust returns | ✅ shots `s11b_jay_walkon/backswing/swing` |
| **Every §A8 swing class** — Mia winds up HER pan, Milo shoulders the rifle (aim → crack → recoil), Dorin strikes with bead-wrapped fists; each battler distinct (bob+dress, blazer+satchel, gi+topknot from behind), each card away while its hero is out | ✅ shots `s11b_mia_pan_*`, `s11b_milo_rifle_*`, `s11b_dorin_beads_*` |
| **Stage choreography per family** — cast (Dorin's Comet: arms raised under the glow), aim (Milo's Spy, Hypno's point), pray (Mia KNEELS mid-stage, §A11.4 straight, stays kneeling through the answered event), throw (salt lob + rockets), oncard (food/cola consume at the card; guard braces there) | ✅ shots `s11b_dorin_cast_glow`, `s11b_milo_spy_aim`, `s11b_mia_pray_kneel/event`, `s11b_salt_throw/arc` |
| **Green SMAAAASH** — GRASS-ramp comic letters over INK offsets slam in at 3× (5×→3× crash) with a green radial burst + camera shake | ✅ shot `s11b_jay_backswing` (banner mid-slam) |
| **The Mother-3 combo** — smash opens the ~1.1s window, ring timer drains under the target at fx depth, edge-A presses re-swing the battler with the rising pitch ladder + "N HITS!" popups; slow taps expire honestly (x4), tight taps MAX it; one EB line totals it | ✅ `"Jay swung true! SMAAAASH!! x8 — 189 damage!"` — deterministic to the digit (450−189=261 confirmed); shots `s11b_combo_*` |
| **Wear, enemy side** — the Tick scuffed at <66% (bruise clusters, sag crease) and BATTERED at <33%: dome visibly DEFLATES (crown drops 6 rows, taut shine gone), graspers droop, veins dim; texture swap live on the hp thresholds, swap-back on drain-heal | ✅ shots `s11b_tick_scuffed/battered` |
| **Wear, hero side** — drums forced via qa(): Mia scuffed at 49%, Jay/Milo battered at 20% (mussed hair, bruise, torn sleeve + thread, sweat sheen on bust AND battler sheets — keyed on the DISPLAYED odometer); below 33% the idle becomes the WINDED heave (windedA/B loop + breath tick), battler heaves on stage too | ✅ shots `s11b_hero_wear_cards_a/b`, `s11b_salt_stage_winded` |
| **The shield picker** — candidate card LIFTS 2px under a gold frame pulse, bust brightened, every other card DIMMED, "> Mia" tag rides the hand; arrows move the spotlight, B backs out, tap zones intact | ✅ shots `s11b_shield_picker_jay/mia/milo` |
| **The barrier locks like armor** — six hex panels FLY IN from the field corners (per-panel lock ticks), flash + closing ring on the lock, persistent cyan hex PIP seats on the card's LEFT shoulder (opposite the ailment row) while shield turns remain | ✅ shots `s11b_barrier_flyin/lock`, `s11b_hex_pip`; `status.shield` 4→3 ticked |
| **REAL DOORS** — rex_hall's three north doorways carry framed panel doors with brass knobs IN the wall band (mats at their feet); walking in swings the door OPEN (creak + 260ms hold, the dark room reads through the jamb) before the whoosh; closed again on re-entry; all three opened (bedroom / Ana / Vivi) | ✅ shots `s11b_doors_closed`, `s11b_door_mid_open/whoosh/arrived` |
| **Victory** — the kill mid-stage: Tick dissolves, busts break into the cheer, drums frozen (§A4.1), the actor walks home through the EXP text | ✅ shot `s11b_victory_cheer` |
| **Skip law (ADR-010)** — held A through an ENTIRE bash: walk-on + backswing + swing + prints + walk-back compressed into 36 frames, stage actor home, damage exact | ✅ |
| **Found & fixed live** — BattleFx.update's `filter()` reassignment stranded inner timelines pushed by events mid-tick (latent since S11; surfaced as stuck guard rings at full alpha): drain now snapshots, ticks, then folds in newborn timelines. Re-ran shield + 3 defends: **0 rings / 0 bolts** residual | ✅ shot `s11b_rings_clean` |
| **Console** — zero errors/warnings across the whole gauntlet | ✅ |
| `npm test` | ✅ validator (WEAPON_ART + STAGE_ANIM + wear + door-law gates live, all four verified failing loudly) + 164 vitest |

### S11b device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 12 | **S11b battle stage, on device** — one Tick fight at 60fps: Jay steps up and back-swings his bat (re-equip the pan/rifle/beads via the menu across heroes), a SMAAAASH combo mashed by real taps (ring timer readable, pitch ladder audible), both sides visibly wear down, shield picker by tap (lift/dim/tag), barrier panels fly in; then upstairs: all three rex_hall doors creak open before admitting | ⬜ | ⬜ | tap-mash the combo with the A overlay — edge detection must catch every tap |

## S12 browser pre-flight — 2026-06-11, THE CAGE (ADR-008 driver)

All legs on the dev build, pad muted AND **`game.loop.sleep()` held for the
whole scripted session** (new driver law, learned live: a visible preview tab
fires real rAF frames between pumps; worse, once real time runs ahead of
pump's virtual clock, every navTick-style cursor cooldown compares against a
future `scene.time.now` and the arrows go dead while edges still land —
sleep first, wake last). Talk pacing: `pump(380)` lets a page type out, ONE
KeyZ advances; never mash into an ask (KeyX cancels it, a stray KeyZ picks
row 0 — both bit this session before the recipe settled). Full recipe in
HoopsScene's header; shots in `.shots/s12_*`.

| Check | Result |
|---|---|
| **The gate** — fresh v5 save (name entry → 2AM intro), Brickton sidewalk (808,396) walking south through the carved fence tile (50,26) | ✅ lands in the_cage at (320,60); the 1995 stream untouched (jitter tests green); exit door returns to the sidewalk |
| **The venue** — court lines, keys, the two backboards, bleachers with their baked bench crowd, the chalk board, the CALL YOUR OWN FOULS sign, PERMIT standing the floor | ✅ shot `s12_status_arms_line` (venue under the command list) |
| **3v3 pickup END-TO-END, twice, byte-identical** — snapshot → PERMIT ask row 0 (seed `pickupSeed(0)=7`, the Casserole Dads) → scripted tape to the horn: trail **2-7 / 8-15 / 12-21 FINAL** both runs, event-for-event | ✅ the cabinet law holds at scene level (vitest pins the math headlessly; 26 sim tests) |
| **Tally pays the Prompt-18 flow** — the 21-11 loss paid 55 EXP to each suited hero, Jay L1→L3 announced post-game with stat tables + `played` 0→1 | ✅ |
| **Walk-off = the eject rule** — START → pause ask → WALK OFF mid-pickup: no rewards, no `played` tick, overworld resumes with map music | ✅ |
| **5v5 Classic registered** — ask row 1 (ArrowDown aimed by the hand probe, y 110→124): `classicSeed(0,0)=1995`, bracket chalked, round 0 vs the wet_socks (tier-1 soft open per the seeding law) | ✅ |
| **One seeded 5v5 QUARTER end-to-end** — the drive tape runs Q1 to the horn: **30-23 us** (street 1s/2s arithmetic at a four-quarter pace) | ✅ shot `s12_5v5_q1_live` (game clock 0:20, shot clock :19, the painted key) |
| **THE v5 CHECKPOINT** — the break panel wrote `hoops.match {Q2, 30-23, seed 1995, clock 300000}` AND auto-saved Notebook 1 (blob verified carrying it) | ✅ |
| **Process death** — `location.reload()` at the break → Continue → Notebook 1: bracket round 0 + the Q2 checkpoint intact; PERMIT row 1 reads "Pick up the Classic game (Q2)"; resume enters Q2 at **30-23** with a fresh quarter clock | ✅ process death cost exactly nothing |
| **The 24** — idle possession: PERMIT counts 5…1 out loud, violation flips the ball with a fresh 24 (also pinned in vitest) | ✅ |
| **ADR-024 regime @ pump(n, 8.33), one-frame taps** — a 1-frame A tap opens the GATHER on the tap frame (meter 0, release next frame — honestly a brick); 1-frame START opens the pause ask; 1-frame A resumes; 1-frame B swipes | ✅ zero drops |
| **THE STARTING FOUR** — constructed titles=1 (the S11 bench precedent): hands-full (14/14 bag) BLOCKS the handoff with `handed` still empty (PERMIT keeps them warm); cleared bag retry hands all four, `handed` ledger complete; `GS.equipItem('rex','cage_sweatband')` = ok; Mia's scrunchie on Jay = **not-yours** (wielder law); heroGuts/heroSpeed read-throughs + "Guts up by N!" preview pinned in vitest (formulas + confirmEquip arms branch) | ✅ |
| **Found & fixed live** — a dead ball had no chaser: both AIs spaced/defended around a `free` ball forever (surfaced the moment a real tape played). The sim gained THE SCRAMBLE: each side's nearest free body chases a loose ball (the user's athlete excluded from team 0's pick so an AI teammate always covers) | ✅ re-run green |
| `npm test` | ✅ validator (31 fives + 5 walk-ons + STARTING FOUR + venue + rewards manifests, verified failing loudly on three axes) + 196 vitest |
| `npm run android:apk` | ✅ fresh meteor-falls-debug.apk (web build + validate + sync + gradle 32s) |

Driver lore added this session (the hard way): **sleep the loop for the whole
scripted session** — `game.loop.wake()` mid-session lets real frames interleave
and desyncs pump's virtual clock from `scene.time.now` (cursor cooldowns lock
out); a visible tab is NOT the hidden-tab regime ADR-008 assumed. And the S10
safe-pick rule has a corollary: KeyZ-mash is only safe when every reachable
ask's row 0 is the row you want — PERMIT's ask puts the Classic at row 1, so
the cage recipe aims with ArrowDown and verifies by reading the hand cursor's
y before confirming.

### S12 device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 13 | **S12 THE CAGE, on device** — walk the lot gate; one 3v3 pickup to 21 driven entirely by the touch overlay (d-pad drives, B-tap passes where aimed, B-hold turbos, A-hold gather + GREEN release readable on the meter, a dunk at speed near the rim); register the Classic and play Q1 at 60fps with all ten athletes; quarter break → kill the app → Continue resumes Q2 with the score; STARTING FOUR handoff after a title run, "Speed/Guts up by N!" previews by tap | ⬜ | ⬜ | ten athletes + ball + HUD must hold 60fps; hardware back mid-match = a B swipe (pause is START — by design, a game button stays a game button) |

## S12b browser pre-flight — 2026-06-11, AWAKENINGS + the casting-distance fix (ADR-035)

All legs via the ADR-008 driver, loop slept end to end, shots `.shots/s12b_*`.

| Check | Result |
|---|---|
| **The reported bug** — "Vibe Surge is just a normal bash attack": REAL, and it was STAGING — S11b walked every actor to arm's reach (the bash approach), so a point-blank cast read as melee. Casts/aims/prayers/throws now stand at CASTING DISTANCE (standoff 72 vs bash 12) and the surge timeline rebuilt: charge at the hands → the light TRAVELS the field → escalating rings | ✅ verified live: actor x128 vs Tick x200, charge/travel/rings, "67 damage!" (`s12b_surge_charge/rings`) |
| **Heroes start with ZERO Vibe** — availability = unlocks ∪ awakened flags; pre-crater Jay's Vibe row prints "searched for the old light... not yet."; Mia L6 = Pray alone until the Locket | ✅ pinned in vitest (state.test ADR-035 block) |
| **The crater awakening, end-to-end** — fresh save → hill → the trigger → prophecy pages → THE OLD LIGHT beat (flash, pages, flag at press 18, jingle + toast) → locket in keyItems | ✅ live |
| **The Surge severs the latch (§A6 amended)** — the Tick latched Jay (tether visible, drain line mid-type) → Vibe list now carries Surge → cast: **tethered true→false**, PP 10→0, damage landed | ✅ live (`s12b_surge_severs_latch`) |
| **Save v6 (registered)** — v5→v6 backfills awakening flags from story flags (met_glint/zapper_done/faye_joined); a pre-crater save awakens nothing; the v1→v6 chain carries bags+ledger+MGR+hoops+awakenings | ✅ vitest (migrations S12b block) |
| **Validator** — awakening manifest both directions, no double-path (an ability cannot be awakened AND level-unlocked), flag uniqueness vs quests, §A3-amended pins (Jay no L≤3 unlock; Pray innate L1) — double-path axis verified failing loudly | ✅ |
| `npm test` | ✅ validator + 199 vitest |

Driver lore: **HMR splits module instances** — `window.mfGS` goes stale
against the scenes' live GS after hot reloads (flags read empty while the
game sets them); full-reload before any flag-reading leg. And the loop-sleep
rule is ABSOLUTE: a single `wake()` mid-session desyncs pump's virtual clock
from `scene.time.now` and every nav cooldown locks out.

### S12b device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 14 | **S12b awakenings, on device** — fresh save: pre-crater Vibe row says not yet; the crater beat plays (flash, pages, jingle, toast); the Tick latches and the Surge visibly severs the tether from CASTING DISTANCE (the caster stands at range — never reads as a bash) | ⬜ | ⬜ | |

## S12c browser pre-flight — 2026-06-11, CAGE 2.0 (ADR-036)

All legs via the ADR-008 driver, loop slept end to end, pump(n, 8.33)
throughout; shots `.shots/s12c_*`. Fresh profile (localStorage cleared),
full ADR-013 name entry, constructed stand at PERMIT (the S9 precedent).

| Check | Result |
|---|---|
| **THE RANGE LAW (the heave fix)** — greenWindow CLOSES at effectiveRange (quadratic, steepening); non-green make% zero at 1.5× range; brick floor GONE; AI range-gated with the ≤1s heave exception | ✅ vitest pins window edges + the zero beyond + an 80k-tick tape on two seeds: **no AI make beyond 1.2× shooter range**; the heave fires from the far-end take, reads as one (PERMIT files it), and never drops |
| **PERMIT'S SCHOOL, end-to-end by the bot** — first cage visit asks; row 0 launches the drill; all 8 lessons advanced ON THE DEED: 600ms X-sprint → green release (window read live off `meterOf`, released 0.976 inside [0.944, 1] → bucket) → rim finish → spin+btb+btl all read → 2 completed passes → a TIMED block erased the dummy's release → a window swipe stripped a move startup → the goaltend warning held → `cage_tutored` set, scene closed | ✅ (`s12c_tutorial_board`, `s12c_goaltend_warning`) |
| **One 3v3 with every new move performed** — PERMIT (no school ask once tutored) → pickup: autopilot played to the horn (2-21 — the Wet Socks earned it) with Y-spin/Y-btb/Y-btl, B-tap passes, X sprint, meter shots, timed leaps all performed in match conditions; tally paid lossExp 55 (Jay exp 2→57), `played` ticked, clean close | ✅ |
| **THE METER, OVER THE HEAD** — world-space drum follows the shooter, fills toward the GREEN AT THE TOP, window shrinks live (range + contest), zero-window = NO green band drawn (range closed it — honest HUD); dunks run their own gold-banded meter | ✅ live + vitest (top-anchored grades, 60/20/0 falloff, overfill auto-miss) |
| **TIMED DEFENSE** — BLOCK_TIMING (±120ms peak window, 0.10→0.65, (dfn−sht)·0.004, reach-scaled, clamp [0.05,0.85]) and STEAL_TIMING (0.08→0.50 in the 150ms windows: move startup, gather first beat, pass release; hawk +0.08; clamp [0.04,0.70]; whiff = beaten 720ms) exported beside TUNE; "TIMED!" pops on window-hit attempts either outcome | ✅ vitest pins both curves + drill-mode end-to-end: timed leaps block ≥1.6× more than early hops across 24 seeds; window swipes strip at the timed rate |
| **GOALTENDING** — descent contact near the iron counts the basket (pre-apex stays a legal block); PERMIT: "THAT WAS COMING DOWN. WE ALL SAW IT." (canon, validator-pinned) | ✅ vitest (drill scenario: leap on the way down → goaltend event + the score lands) |
| **THE DRIBBLE PACKAGE** — Y=spin · Y+lateral=behind-the-back · Y+at-defender=between-the-legs; 150ms startup IS the steal window (validator-pinned equality); tiered ankle ladder (ANKLE_TIERS 0.30/0.62 splits): STUN wobble / TRIP stumble / the FALL — each with frames + PERMIT pools; double-tap crossover unchanged | ✅ live (all three read in lesson 4 + the 3v3) |
| **PASS STYLES** — chest / BOUNCE (low, floor-kiss at midpoint, picks ×0.45, flight ×1.35) / BEHIND-THE-BACK (target behind facing); style by context, distinct flights + frames | ✅ sim + frames live; flight profiles in updateBall |
| **X/Y + REBINDABLE CONTROLS** — InputBus grows X (KeyC, pad 2) Y (KeyV, pad 3), pad B narrowed to button 1; UIScene thumb-arc X/Y visible during hoops only ('mf-hoops-open/closed'); SETUP → CONTROLS: press-to-capture rebound A→KeyJ live (KeyJ then DROVE A), persisted device-local 'meteor-falls-controls', Reset restored [KeyZ, Space] | ✅ (`s12c_controls_page`) |
| **CAMERA TOGGLE** — pause row 2: SIDE ⇄ BEHIND (perspective floor via behindMap — texture and runtime share the projection; depth-scaled sprites; fixed seat); persisted 'meteor-falls-cage-cam' | ✅ (`s12c_camera_behind` — the pseudo-3D read holds) |
| **SPORT_FRAME 25 → 39** — S12 indices frozen, the package appended (spin/btb/btl ×2, stun ×2, trip, 3 pass anims, follow-through, landing recovery); validator pins count + names | ✅ |
| Console | ✅ zero errors/warnings across the whole gauntlet |
| `npm test` | ✅ validator (cage2 manifests: frames contract, range/meter/timing math, the goaltend line, the syllabus — alongside every standing gate) + 213 vitest |

### S12c device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 15 | **S12c CAGE 2.0, on device** — X/Y buttons appear on the thumb arc only in the cage; PERMIT'S SCHOOL completes by touch; the over-head meter reads at arm's length (green at the top, shrinks under a closing hand); one timed block + one window steal landed by feel; the BEHIND camera holds 60fps; SETUP → CONTROLS captures a pad button and the rebind survives an app restart | ⬜ | ⬜ | pad B is button 1 now (2 = X, 3 = Y) — re-verify B-cancel feel in menus |

## S13 browser pre-flight — 2026-06-11, COSTA ESTRELLA LINKS (ADR-037)

All legs via the ADR-008 driver, loop slept end to end, pump(n, 8.33);
shots `.shots/s13_*`. Entry: the dev title row (the Sprite Lab precedent —
the resort is complete and standalone ahead of Prompt 28).

| Check | Result |
|---|---|
| **The venue** — costa_estrella renders: the LINKS clubhouse (gold awning), FITO in resort greens + the white flat cap at the first tee, the plaque, hedge lawns, the banner | ✅ (`s13_resort`) |
| **The caddy gate** — npc_caddy intro (the world in putts), the ask (stroke / Invitational / never mind), launches LinksScene over the paused world ('mf-links-closed' resumes with map music) | ✅ |
| **STROKE PLAY, hole 1 tee-to-cup at scene level** — the documented bot line (A starts, A at want on the rise, A inside the acc window) closed hole 1 **in 2 strokes** (drive + holed approach); the same line plays it HEADLESSLY twice byte-identical, and every one of the nine closes out under it (vitest) | ✅ |
| **The table view** — per-hole ground texture (surf swells, cliff bands, WIDE mow stripes, rough, the bunkers, green + fringe + honest slope arrows + the cup), ball-cam riding the flight, splash/sand bursts | ✅ (`s13_aim_clean`, `s13_flight_followthrough`) |
| **THE SWING PANE** — the player hero's GOLF sheet (cut from the S12 contract, drawProfileHead shared) at 1.6× addressing/coiling/striking/following beside the meter drum; fist-pump under par, the universal sad putter slump over | ✅ (`s13_meter_power`) |
| **The 3-tap meter** — power BOUNCES (rise → fall → die = swing cancelled, no stroke), accuracy falls into the shrinking club×lie window (gold zero line + green band drawn live), push/pull curves the flight; putt/chip run the power tap | ✅ live + vitest (bounce-cancel, floor auto-push, window math) |
| **WIND** — seeded per round, announced in the caddy's units ("1 PUTTS OUT OF THE SOUTH" — he rounds, he does not apologize) on HUD row 2 | ✅ |
| **THE INVITATIONAL** — register at FITO: flags lit (links_seed 2026, links_round 0, links_bracket_live), the match card reads vs UMBRELLA STAND UGO (tier-1 — the soft gate), holes tally line; bracket DERIVES from (seed, round) forever (vitest: entrants replay identically; tiers ramp 8/8/7/5/3) | ✅ (`s13_match_card`) |
| **Walk-offs** — the eject rule both formats: stroke pays nothing; a match forfeit clears the bracket flags (the stub kept via links_was_in) | ✅ |
| **Process death** — the Invitational lives on NUMBER FLAGS inside the save (no v7): each finished match saves the active notebook; (seed, round) reconstruct the field, the opponents, and the board from zero state (vitest pins the derivation) | ✅ |
| **THE SUNDAY SET** — four wielder-tagged 'other' charms (visor/glove/tee/marker, drawn trinket icons through the S11b WEAPON_ART gate), luck previews through the S9 seam, the caddy hands off PERMIT's way (hands-full BLOCKS, links_handed_<hero> rainchecks, zero missables); repeats pay $400 in hand | ✅ validator-pinned both directions |
| **The tease** — Brickton's bus-stop corner grew the travel poster (fresh rng stream 2095 — 1995 + 2077 byte-identical, jitter tests green) with its sign read | ✅ |
| Console | ✅ zero errors/warnings across both legs |
| `npm test` | ✅ validator (links manifests: 9 holes + geometry + signatures, 31 golfers + tier curve, rewards pins, SUNDAY SET both directions, venue + tease pins, GOLF_FRAME contract, LINKS_TEXT/holes/golfer-line sweeps) + 228 vitest |

### S13 device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 16 | **S13 LINKS, on device** — one stroke round by touch (aim by d-pad, B cycles the bag, the 3-tap meter readable at arm's length, after-touch mid-flight); the Invitational's first match registered, played, and resumed across an app kill; THE SUNDAY SET handoff with previews | ⬜ | ⬜ | the swing pane + ball-cam must hold 60fps on the par-5s |
