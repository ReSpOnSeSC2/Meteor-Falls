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

## S12d/S13b browser pre-flight — 2026-06-11, THE RESPONSIVENESS LAW (ADR-038)

All legs via the ADR-008 driver, loop slept end to end; shots `.shots/s12d_*`.

| Check | Result |
|---|---|
| **The reported bug, root-caused** — both sims' advance() DISCARDED any frame shorter than one 8.333ms quantum, edges included; at 120Hz that is roughly every other frame: half of all shot presses and meter releases silently died. Fixed by the EDGE CARRY (pending edges fold into the next frame's first tick) | ✅ pinned headlessly (press/release/tap inside 4ms frames all land) |
| **Worst-case live regime** — pump(n, 4.1): EVERY frame sub-quantum. Ten one-frame A presses → ten gathers opened; ten one-frame releases mid-hold → ten jumpers fired | ✅ 10/10 + 10/10 |
| **The release latch** — INPUT.justReleased() (keyup/touch-lift latched, the ADR-024 mirror); UIScene lifts latch through releaseBtn; HoopsScene reads the bus (prevA bookkeeping deleted); a press+release inside ONE tick releases instantly (the honest quick flick) | ✅ |
| **THE FINISH METER** — walking (no sprint) inside 165px + A starts the finish; Jay (dnk 37) lays it up under the CYAN band, holds, releases green → **"IN! +1" + scoreboard flash**; a mistimed release → **"NO GOOD."** at the iron; held-through = overfill miss (pinned); AI layups plan through the same window | ✅ live both ways (`s12d_finish_meter`, `s12d_in_read`, `s12d_nogood_read`) |
| **The make/miss reads** — every bucket pops IN!/+2 FROM DEEP at the rim + board flash; rim-outs/airballs/layup misses pop NO GOOD./AIR. ('miss' events). The "is it counting 3s?" confusion answered in canon: 3v3 street is 1s and 2s — and the deep make now says FROM DEEP! | ✅ |
| **Golf parity** — GolfSim edge carry (a 4ms-frame tap still starts the meter, pinned); the third tap's verdict reads like the cage's green: **PURE!** inside the window (green sfx), DRAW./FADE. outside; a pure drive on hole 1 left 13y and auto-armed the chip | ✅ live (`s12d_pure_read`) |
| Console | ✅ zero errors/warnings |
| `npm test` | ✅ validator (LAYUP_METER + finish-range + read-key pins) + 237 vitest |

### S12d device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 17 | **ADR-038 feel, on device** — on the phone's real refresh rate: twenty quick shot attempts, every press opens the meter and every thumb-lift releases on the spot; five walk-up layups under the cyan band; makes/misses read at the iron without squinting; one golf tee shot taps PURE | ⬜ | ⬜ | this is the fix for the reported feel bug — verify on the SAME device that showed it |

## S14 browser pre-flight — 2026-06-11, THE GILDED GRIN (ADR-039)

All legs via the ADR-008 driver over the dev server; bench states constructed
per the S9/S11 lore (post-ch1 flags + mfMakeHero). Driver lore this session
earned: settle scene RESTARTS (not just fades) before pressing — a restart
eats one or two latched presses; and a trigger rect is EDGE-fired, so a bot
that brushes its first column and gets canceled must LEAVE and re-enter.

| Check | Result |
|---|---|
| Boot → title, zero console noise | ✅ |
| **THE CROSSING** — docks spawn → walked into the gangplank trigger → the captain's ask (the ch1_complete gate held when unset in earlier bench) → BOARD → the §A11 deck scene over the masked scrolling sea reel → PUERTO SOL pier, `boat_ride_done` set; later rides quick-fade both ways | ✅ map=puerto_sol, ride=true |
| **PUERTO SOL renders** — the banana boat moored (structurally a banana), dock planks + surf line, plaza pavers, striped stalls, departure board, street B's dashes + crosswalk; ADR-012 city sweep passes in vitest; the 1898 stream pinned byte-identical | ✅ screenshot |
| **THE PYRAMID ROTATION** — pyr_rot_1 flag advanced by the mask sign beat (grind + shake + fade-restart); the LIVE solidTiles dump showed the rotor's channel turned; at the canonical 1 press the player walked the T's stem from the south lobby THROUGH the rotor (live, the long way) | ✅ |
| **The solve, proven** — BFS in vitest: every room blocked as found, OPEN after the documented presses (1/1/2/2), and the mask ALWAYS reachable at every rotation (no soft-lock, all 4 × 4 cases) | ✅ headless |
| **A §A7 Ch.2 enemy, organically** — a roaming Step-Mask spotted the player mid-channel and got the swirl; fought and beaten live | ✅ |
| **BOSS 2, the whole §A6 gimmick live** — opens SOLID GOLD (texture `battle_gilded_grin`); Jay's bash **CLANGED — 980 untouched**; the telegraph printed on boss turn 2; the swap landed turn 3 (texture `battle_gilded_grin_hollow`); **MIA AWAKENED VIBE FREEZE α mid-battle at the HOLLOW reveal** (flag + the §A11.2 pages + jingle, staged sincere); hollow bash LANDED (108); the solid return composed with WEAR (`battle_gilded_grin_w1` — form × tier swaps stack); victory paid $632 pending | ✅ |
| **Freeze cracks the gold** — pinned in vitest (phases.test.ts: crackBy('freeze') suspends the physical immunity for CRACK_TURNS, refill not re-read, a fresh form arrives whole); the scene consumes the same damageMul gate the clang proved | ✅ headless + clang live |
| **PICNIC (§A4.5)** — Feast Basket at the plaza table: blanket unrolls, party sits, birds land, basket consumed, full restore (Mia 96/96), `sunny_side=5`, `feast_armed` set; ANGELS excluded by design (hospitals own revival) | ✅ |
| **HOSPITAL (§A4.7)** — Brickton General behind its real door: the desk revived angel-Jay for exactly reviveCost(10)=$50 (200→150), angel walked out a person | ✅ |
| Console, whole session | ✅ zero errors/warnings |
| `npm test` | ✅ validator (the §A7 Ch.1–2 + Boss 1–2 manifest, 4-shop shelves, §A10 #1–6, awakenings ×4, weapon manifest +2, armor line +poncho, phase-script pins incl. the telegraph cadence + crackedBy + FORM_ART both directions, picnic table placements, hospital/chapel doors + staff, the boat chain, the costa wire FLIPPED to assert the round trip — four axes verified failing loudly) + 270 vitest |

Not yet driven live (wired + validator-pinned + pattern-proven, the S9 quest
machinery verbatim): the llama herd beats, the museum camera beats, the deli
crafting rows, the chapel prayer, the valley recovery → ch2_complete beat.
First full start-to-finish §A9 timing run belongs to the device pass below.

### S14 device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 18 | **Chapter 2, on device** — boat → Puerto Sol → jungle → Valle Dorado → pyramid (all four masks) → the Grin → Ember 2 → the recovery → boat home, by touch AND pad, ~35–45 min at the §A9 target (~13); both quests end-to-end; a picnic before the pyramid; a wipe inside it → angels → clinic revival for scaled cash | ⬜ | ⬜ | the §A11 tone read-through rides along: every new line out loud |

## S14b browser pre-flight — 2026-06-11, the settings suite + the meter's real bug (ADR-040)

All legs live over the dev server via the ADR-008 driver. Driver lore
earned: the user's OWN browser focus matters — InputBus wipes held keys on
window blur (by design), so bot MOVEMENT legs need the tab focused or the
loop slept; and `renderer.snapshotArea` only fulfills with the loop AWAKE.

| Check | Result |
|---|---|
| **SETUP, production pass** — Sound / Text speed (PATIENT-NORMAL-BRISK, unset defaults NORMAL after the coercion fix) / Window flavor / Controls / Return to Title / Back, every row applying instantly | ✅ driven end-to-end |
| **WINDOW FLAVORS (Prompt 6 canon)** — CLASSIC → MINT → STRAWBERRY cycled live on screen: the pick windows + say windows repaint on the very next open; the flag rides the SAVE (per file, like EB) | ✅ screenshots |
| **CONTROLS, rebuilt** — the binding sheet (action/keyboard/pad columns) + the WHAT-THEY-DO legend + footer rule; **sprint captured onto KeyL live and persisted to 'meteor-falls-controls', then Reset restored KeyC** — the user's exact ask ("sprint on a different button") round-trips | ✅ |
| **RETURN TO TITLE** — the confirmed close path: title active, overworld + menu stopped (proven by direct invocation after bot-vs-ask timing noise; the dialogue flow itself is the battle-tested say/ask) | ✅ |
| **THE GOLF METER'S REAL BUG** — root cause found by pixel sampling: Phaser Shape `.height` assignment never rebuilds geometry, so the S13 fill NEVER grew (the user's "stub at the bottom" screenshot) and the acc phase read as draining. Scale-based fix verified by renderer pixel column: empty above, GOLD power mark at the capture, dimmed HELD fill beneath, cyan needle mid-descent, PURE band + zero line at the base | ✅ pixel-sampled + screenshot |
| **THE RUN LEAN (ADR-040)** — 24-frame sheets: run frames 16–23 with head down+forward and the determined glare brow; staged at 3× beside the walk frames for Jay AND Mia — the lean is unmistakable; anims resolve [20,21] for right-run | ✅ + 4 vitest pins (incl. center-of-mass forward) |
| **THE LAB SCROLLS** — cast page rows 4–6/6 reached by Down; the whole Ch.2 cast (Tomás, doctors, priests, wishers + woke twins, the captain, the curator…) visible; position read in the corner | ✅ screenshot |
| Console, whole session | ✅ zero errors/warnings |
| `npm test` | ✅ validator + 274 vitest |

### S14b device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 19 | **The settings, on the player's pad** — rebind SPRINT onto the preferred DualSense button via the capture card and play a cage possession with it; flip the window flavor and read three conversations; BRISK text through a shop; Return to Title and Continue back | ⬜ | ⬜ | the rebind page exists FOR this pad — verify the capture reads its buttons |

## S15c browser pre-flight — 2026-06-12, the third playtest fixed live (ADR-043)

All legs over the dev server via the ADR-008 driver. Driver lore earned this
session: on a FRESH page, wait for `game.cache.bitmapFont.exists('retro')`
before starting scenes (mfGS exists before BootScene registers the font);
`window.shot()` needs the sidecar (`node tools/shot-server.mjs`, :5179) or it
silently no-ops; and NEVER scene.restart over an open say() — drain pages
first (the S6 lesson; the everyFrame SHUTDOWN fix now makes the crash class
survivable, but the lesson stands).

| Check | Result |
|---|---|
| **THE NIGHT LINE (overscan)** — pixel-proven root cause: at scrollY 171 screen row 0 read day-grass [164,220,100] over a night map (scroll rounding shifts scrollFactor-0 shapes vs the tilemap by unequal sub-pixels). After `overscanRect`: row 0 reads tinted [73,101,55]/[106,92,78] identical to row 1, bottom row 224 tinted too | ✅ pixel-sampled + s15c_night_top_row.png |
| **THE SWIRL TRAFFIC LIGHT** — startBattle driven with both advantages: player → 0xa4dc64 (GRASS green), enemy → 0xec5448 (RED); `SWIRL_TINT`/`contactAdvantage` pinned headless (+2 vitest); Bible §A4.2 + Prompt 16 amended | ✅ driven + s15c_swirl_green.png |
| **LEVEL-UPS WAIT** — two-level victory (L1 + 30 EXP + mailbox share): "jumped to level 2!" HELD 400 input-free frames with the gold ▼ blinking, KeyZ → "jumped to level 3!" held again, KeyZ → deposit line → battle ended at L3/38 EXP | ✅ driven end-to-end |
| **DAY-AFTER OTTERBROOK** — pajama kid + old-timer read their `dialogueDay` lines in daylight and their originals at 2 A.M.; Mrs. Pemmel's rewritten present-tense 2 A.M. lines read with {rex} resolved | ✅ all four read back in-scene |
| **BISCUIT'S VERDICT** — hill_road with tick_defeated && !zapper_done builds ONLY `biscuit_road_after` ("pointing at YOU now"); the pre-Tick pointer correctly retired | ✅ read back in-scene |
| **THE SEATED 6:15** — root cause: player depth only assigned in update(), which the cut lock skips → depth 0 under the seat back (88). buildPlayer now y-sorts at build; first ride spawns (296,100,'up'): hero fully visible at his seat, facing the window reel | ✅ screenshot + s15c_bus_seated.png |
| **THE ARRIVAL PAN** — three legs sampled live: (6,354) bus stop → (216,98) Department block → (643,147) clock district → (0,363) back on the player; arrival flag set, control released (then a roaming Pigeon Gang ambushed the idle bot — organic proof the world resumed) | ✅ scroll-sampled |
| **POLLS DIE WITH THE SCENE** — deliberate scene.restart mid-say: 120 pumped frames clean after the everyFrame SHUTDOWN fix (the same flow threw `'chars' of null` every frame before it) | ✅ repro before/after |
| Console, whole session | ✅ zero product errors (both thrown stacks were harness-induced and are now hardened against) |
| `npm test` | ✅ validator (41 maps, 331 dialogue scripts) + 277 vitest |

### S15c device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 24 | **The third playtest, on device** — walk Otterbrook at night and confirm no day-lit line at the screen top; sneak a roamer (green swirl) and get ambushed (red swirl); win a fight that levels twice and confirm each level waits for a press; talk to the pajama kid at night AND after dawn; talk to Biscuit on Hill Road right after the Tick falls; ride the 6:15 and watch the seated hero + the slow three-leg Brickton pan | ⬜ | ⬜ | rows 20–23 stay reserved for S14c–f; 25–27 for S15d–f |

## S15g browser pre-flight — 2026-06-12, THE WORLD FORGE Movement One (ADR-044)

Driven live on the dev server (`levelkitlab` reached directly via the scene
manager, the Sprite Lab way). The LAB is dev-only; its drafts are injected
into the RUNTIME MAPS registry for the walk and never touch the source the
validator reads. Console clean (zero errors) across the whole session.

| Check | Result |
|---|---|
| **THE LAB RENDERS THE READ** — `LEVELKIT LAB — zanzibel (seed 4104)`: grid 58×36, props 50, npcs 14, picnic 3, and the live ADR-012 overlay (street rows 6, avenue joins 3, block faces 2, negative space 5%) → **SWEEP: PASS (no exemptions)** in green | ✅ driven + screenshot |
| **RECIPE CYCLE** — `</>` walks the eight sample recipes (zanzibel → brickmore_heights → …); the title + metrics recompute per recipe | ✅ driven (idx + title read back) |
| **WALK A GENERATED CITY** — A on brickmore_heights injected the 64×42 city and launched the overworld on it: a real street grid (road + phase-shifted dashed centerline, full-height avenue, crosswalks), curbed sidewalks, the brick spine, role-slot NPCs adapted to live CAST sheets, trees/bench/market-stall, the player walking the sidewalk — the scene runtime never knew it was generated | ✅ driven + screenshot, zero console errors |
| **DETERMINISM + ENVELOPE** — `npm run bench:map -- zanzibel`: 0.16ms/build over 200, deterministic=true, 58×36 = 2088 tiles / 50 props → WITHIN ENVELOPE | ✅ CLI |
| `npm test` | ✅ validator (41 maps, 36 clean + 5 waived) + 317 vitest |

### S15g device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 28 | **The forge, at thumb scale** — open the Levelkit Lab from the title's DEV menu; cycle to a generated TOWN (foggybottom) and a generated CITY (zanzibel), read the ADR-012 overlay (PASS) at phone size; reroll the seed live (^v) and watch the street feel change while the sweep stays green; WALK both drafts and confirm the streets/lanes read at thumb scale with no collision snags; `.shots/` of a town draft and a city draft | ⬜ | ⬜ | M2 extends this row with a dungeon draft + contact sheet once the grammars/forge land; rows 25–27 stay reserved for S15d–f |

## S15g (Movement Two) browser pre-flight — 2026-06-13, THE DUNGEON GRAMMARS + ENCOUNTER PRESSURE (ADR-045)

Driven live on the dev server (`levelkitlab` reached via the scene manager,
the Sprite Lab way). Drafts are injected into the RUNTIME MAPS registry for
the walk and never touch the source the validator reads. Console clean (zero
errors) across the session.

| Check | Result |
|---|---|
| **THE LAB READS THE SEAL** — paging to `laughing_ruins` shows the Movement-Two read: **POST-CONDITIONS: SEALED (entrance→exit, boss, rest)** in green, `density 1.23/screen  grace 96px  prox 48px`, and **false loops: PROVEN (the floor is a tree — no real loop)** | ✅ driven (content lines read back) |
| **REST-BEFORE-SPIKE ON THE PHONE** — the `grace`/`prox` line IS the rest-before-pressure read: a phone sits at the entrance camp, the first spawner is deeper; confirmed the payphone renders at the entrance throat in the walk | ✅ driven + screenshot |
| **SEED REROLL (^v) STAYS SEALED** — rerolled `laughing_ruins` across seeds 6060 / 6061 / 99 / 31337: the false-loop layout reshuffles (grace 96→704→128→96px) while **SEALED + tree PROVEN** hold every time | ✅ driven (4 seeds read back) |
| **WALK A GENERATED DUNGEON** — A on `laughing_ruins` injected the 42×34 draft and launched the overworld: the player spawned at the ENTRANCE on a floor tile (`'n'`, `onFloor: true` — a carved dungeon's CENTRE is a wall, so the LAB spawns at `doors[0]`), the 1-wide tree maze of ruined corridors reads at scale, the scene runtime never knew it was generated | ✅ driven + screenshot (`.shots/s15g_m2_laughing_ruins`, zero console errors) |
| **PROVE A FALSE LOOP IS NOT A LOOP** — `floorIsTree()` on the walked grid is `true` (edges == cells − 1): every passage that looks like it circles back is a dead branch | ✅ driven |
| `npm run encounters` → `docs/ENCOUNTERS.md` for all 41 canon maps; HARD subset (grace + proximity) | ✅ 39/41 clear, `pyramid_1`/`_2` reasoned-waived (frozen rotor chambers) |
| `npm test` | ✅ validator (41 maps; map-quality 36+5, pressure 39+2) + 471 vitest (130 new dungeon proofs) |

### S15g (Movement Two) device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 29 | **The dungeon forge, at thumb scale** — open the Levelkit Lab; page to `laughing_ruins`, read SEALED + "false loops: PROVEN" at phone size; WALK it end-to-end and confirm the maze navigates with no collision snags and that a passage that LOOKS like a loop dead-ends (it is BFS-provably a tree); reroll the seed (^v) and watch the layout reshuffle while the seal holds; confirm a generated dungeon's rest phone sits at the entrance camp BEFORE the first spawner; `.shots/` of a dungeon draft | ⬜ | ⬜ | rows 25–27 stay reserved for S15d–f; M3 (the forges) extends this with a Sprite Lab contact sheet |

### S15g (Movement Three) device row (appended to the S8 gate — existing boxes stay open)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 30 | **The party VITALS BAR + the forged dungeon** — open the START menu and read ALL heroes' HP/PP at the BOTTOM (one panel each: name, HP cur/max, PP cur/max, a thin bar, a DOWN/HOMESICK tag); open ITEMS → a hero's bag and confirm the strip YIELDS to the item description panel (no overlap, no clip) and RESUMES on back-out. From the OVERWORLD press the VITALS button (Y / the thumb-arc Y) and confirm the SAME panel pops; dismiss it with the same button, B, AND a tap — by touch AND pad. Then open the Levelkit Lab, WALK a Ch.3–10 dungeon draft, and confirm it fights FORGED foes (the chapter's banded names, placeholder sprites until 3b); `.shots/` of the menu strip + the overworld glance | ⬜ | ⬜ | 3b extends this with the Sprite Lab contact sheet + the picked `partsSpec`; Pippa (5th panel) lands deferred |

### S15g (Movement 3b) device row — THE SPRITE FORGE (ADR-046, the part catalog + Sprite Lab)

Browser-proven this session via the dev driver: the SPRITE LAB → THE FORGE page renders 8 live composed candidates + the recorded pick at all three wear tiers; walking the Wintermoor draft registers the picked roster's faces and a forged grunt (the Foggy Locker) renders its COMPOSED carapace/iron/grin face in a real battle and swaps to the cracked tier under 33% HP. `.shots/forge_catalog.png` (every silhouette × material), `forge_wear.png` (the drums), `forge_picks.png` (the 6 Ch.3 picks) via `npm run art:facesheet`.

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 31 | **The Sprite Forge, at thumb scale** — open the Sprite Lab from the title's DEV menu and page to THE FORGE; cycle the forged grunts (^v) and the candidate faces (A) and confirm each composed face + its FULL/SCUFFED/BATTERED row read at phone size, and that a Ch.3 grunt shows a green RECORDED pick. Then open the Levelkit Lab, WALK the Wintermoor (Ch.3) dungeon, touch a forged grunt, and confirm it fights with its COMPOSED face — and that it visibly WEARS DOWN (scuff under 66%, batter under 33%) just like a shipped foe. `.shots/` of THE FORGE page + a forged grunt mid-battle at two wear tiers | ⬜ | ⬜ | Ch.3 roster is picked; Ch.4–10 grunts keep a borrowed placeholder until their chapter session picks faces. Bosses + heroes stay bespoke (never forged) |

## S15h browser pre-flight — 2026-06-13, THE WORLD BLOCK (ADR-049)

The towns grew up. Verified this session via the ADR-008 dev driver (warp → measured
`game.step` walk → `window.shot`), the perf legs measured at the §S14d worst case
(`pump(n, 8.33)`, 120Hz). The authoritative p99 ≤ 8.3ms gate HOLDS at the new sizes:

| Leg | Result |
|---|---|
| **Grown Otterbrook renders** (70×56, 3920 tiles, 122 props) — the frozen 1995 core walks byte-identical (DRUGS, STARPORT, the lemonade corner, the kids, the cross lane); the new south civic spine + east blocks lay in clean | ✅ shots `world_otterbrook_cityhall`, `world_otterbrook_pond` |
| **The landmarks read at thumb scale** — CITY HALL opens its door (the brick draft skin + the OTTERBROOK CITY HALL plaque; a bespoke facade is a promotion item, ADR-020); the CIVIC GREEN's nibbled hedges read as a park, not a rectangle (§B4); the POND PARK's water + two picnic rests sit before the south field | ✅ no collision snags on the walk |
| **Otterbrook p99 walk** — south through the civic spine, east to the gateway, back | ✅ **p99 0.3ms / max 0.9ms** (gate ≤ 8.3ms) |
| **Meadow Mile + the orientation gate** — the road wanders (never a straight corridor), treelines both edges, a picnic + payphone BEFORE the hot middle; the three Blazer-Smiler proctors man the overpass; reaching the city line WITHOUT the badge fires the gate scene ("A blazer-smiler steps onto the line…") | ✅ shots `world_meadow_mile_gate`, `world_meadow_mile_orientation_gate` |
| **Grown Brickton renders** (144×76, 10944 tiles = literal 4×, 153 props) — the frozen 2077 downtown walks byte-identical (DINER/VIDEO, the east park, street B's poled wires, the parking lot, the Cage); MAPLE HEIGHTS' brick rows back onto Maple Street; the south gateway lands the foot route with a payphone rest | ✅ shots `world_brickton_downtown`, `world_brickton_maple_heights`, `world_brickton_south_gateway` |
| **Brickton p99 walk** — the new south district, north into downtown, east toward the relocated docks | ✅ **p99 0.2ms / max 0.7ms** (gate ≤ 8.3ms — the 4× sprawl holds it; the tilemap culls, prop count barely moved) |
| **The frozen cores are proven** — `src/data/world_block.test.ts`: two builds byte-identical, the live MAPS entry matches a fresh build, and the core GRID region equals the untouched `buildOtterbrook()`/`buildBrickton()` char-for-char (only Brickton's docks EXIT door relocates) | ✅ vitest |
| **Brickton clears ADR-012 AT 4×** — `cityViolations(MAPS.brickton) === []` at 144×76 (the maps.test city sweep runs on it unexempted) | ✅ vitest |
| `npm test` | ✅ validator (43 maps; map-quality 38+5, pressure 41+2) + full vitest green |

### S15h (THE WORLD BLOCK) device rows — the reserved 25–27, claimed (appended to the S8 gate)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 25 | **Grown Otterbrook, at thumb scale** — walk the grown town end-to-end: read the CIVIC GREEN (nibbled, irregular — a park, not a box), CITY HALL (enter it, talk to the Mayor + clerk, save at the lobby phone, exit lands on the jitter-derived doorstep), and the POND PARK (two picnic rests before the south field's danger) at phone size with NO collision snags; confirm the 1995 core (bus corner, lemonade, chapel) is exactly where it was; `.shots/` of the grown map | ⬜ | ⬜ | the byte-identical core is vitest-proven; this row is the human's thumb-scale read |
| 26 | **Meadow Mile through the orientation gate** — leave Otterbrook's EAST gate on foot, walk MEADOW MILE (rest at the picnic/phone before the hot middle), reach the overpass, clear the THREE proctor fights for the VISITOR BADGE, and walk into grown Brickton — then confirm the CAGE block reads from the new street and the relocated docks sit at the city's east edge. LOSE a proctor fight on purpose and confirm you wake at the last save and the gate is still there (retry, never a dead end). Then ride the 6:15 instead and confirm the bus ALSO opens the line (the grandfather clause) | ⬜ | ⬜ | the gate scene fires browser-proven; the retry + grandfather paths want a device confirm |
| 27 | **THE BRICKTON MINUTE + THE WARM DIAL TONE** — walk onto the civic-clock plaza and the bus-stop payphone (the two existing gate flags) and confirm each plays as a REAL staged beat now — the clock strikes, the block turns, the clock lady reads you the city, the Locket takes the tick; the phone rings, the quarter man names the note, the dial tone folds into the first Heartlight — not a bare toast. Both at thumb scale, both advancing cleanly by tap AND pad | ⬜ | ⬜ | same flags as before (`brickton_clock_goal`, `brickton_dial_goal`); the scenes are rebuilt, the gating unchanged |

## S15i Movement 2 pre-flight — 2026-06-13, THE DAYBREAK GATE + MAPS THAT BREATHE (ADR-054/055)

Task 0 (the daybreak gate + treeline + meteor roadblock) and Task 1 (the grammar upgrade:
mega pass + nook/woods/sewer verbs + per-area skins + the Otterbrook/Brickton re-grow).
Verified headlessly this session via tsc + full vitest + the content-validate map-quality
sweep + an IN-GAME collision BFS (tile **+ prop** solids, the engine's real walkability) and
the `art:buildings` contact sheets. The authoritative thumb-scale p99 walk is the device rows.

| Leg | Result |
|---|---|
| **The daybreak gate seals the world at night** — Otterbrook's east connector is barricaded (a `sawhorse` + a "GATE CLOSED — town asleep" notice, both `unlessFlag: zapper_done`) AND `checkDoors` refuses the `meadow_mile` door until `zapper_done` (a sleeping-town reason, never an invisible wall). At daybreak `porchScene` fade-restarts: the barricade retires, the door opens, the treeline NPCs swap to `dialogueDay` | ✅ `world_block.test` (+ `meadow_gate_asleep` wired); append-only — the 1995 core carries no `sawhorse` |
| **The meteor-drop roadblock on Meadow Mile** — a fallen `meteor_rock` + a `sawhorse` block the UPPER trail lane; a town-worker waves you around and a ROAD WORK sign explains it; the LOWER lane stays walkable (BFS-proven, never a soft-lock) | ✅ validate map-quality clears `meadow_mile`; worker + sign reachable |
| **Per-area skins read distinct** — Otterbrook now draws ONLY its warm low brownstones/shops/cafés (`bldg_gen_brownstone_earth_3`, `…shop…`, `…cafe…`, ≤3 stories); Brickton ONLY its cool glass/neon/theaters/deptstore + the mega-towers + the colossus. No shared roster | ✅ probe: Otterbrook = brownstone/shop/cafe families; Brickton = theater/deptstore/neon/bank + towers |
| **Mega-buildings are common in Brickton + a colossus landmark** — the HIGH-RISE DOWNTOWN (west of the avenue) stands 3 mega-towers whose tops run off-screen, and the STARFALL SPIRE colossus (`bldg_colossus_spire`, 226×524 ≈ 2.3 screens) is the far-east landmark you round on foot | ✅ 4 megas total; `art:buildings` shots `buildings_s15i`, `buildings_colossi` show the off-screen-top scale vs the 16×24 hero |
| **The colossus does NOT strand the city (in-game BFS)** — from the Brickton foot-spawn, the tile+prop-solid flood reaches EVERY door (the_cage, brickton_docks past the spire, meadow_mile), every interior (dept, starmart, hospital, arcade2), and every new NPC (spire-gazer, downtown-suit, dockward) | ✅ 8353/10944 tiles reached; all targets reachable=true |
| **Otterbrook's woods nook** — a hidden thicket in the SW with a discoverable picnic rest at the glade + a birdwatcher (§A11), reachable in-game; trees off the clearing path (no soft-lock) | ✅ all 4 picnics + the birder reachable (prop-solid BFS) |
| **The frozen cores stay byte-identical** — `world_block.test`: Otterbrook + Brickton cores char-for-char, prefix props/npcs/signs/doors unchanged; caps held (OB 141/260, BK 146/320); `cityViolations(brickton) === []` at 144×76 | ✅ vitest |
| `npm test` + `npm run build` | ✅ validator (43 maps, 374 dialogue) + **632 vitest** + `vite build` green |

### S15i Movement 2 device rows (appended to the S8 gate)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 28 | **The daybreak gate, both states** — at 2 AM walk Otterbrook's EAST edge: the road is barricaded, the sign reads "town asleep," and pushing the gate bumps you back with the sleeping-town line (never an invisible wall). Talk the treeline gawker (night line — "you go look"). Finish the opening (hill → crater → porch); at daybreak confirm the world OPENS in place — barricade gone, gawker + gate-walker on their DAY lines — then walk EAST onto Meadow Mile and route AROUND the meteor roadblock (the worker waves you by; the lower lane is clear) | ⬜ | ⬜ | the rebuild is `porchScene`'s fade-restart; retry law holds (a lost fight never dead-ends the gate) |
| 29 | **Grown Brickton at thumb scale — the towers READ** — walk into the high-rise downtown and confirm the mega-towers TOWER (tops off the top of the screen, solid all the way round), then walk the full ~20-tile loop AROUND the Starfall Spire to the relocated docks; confirm you can't clip any tower and the docks/cage/dept are all reachable | ⬜ | ⬜ | in-game BFS proves reachability; this is the human's "it feels like a city" read |
| 30 | **The grown towns breathe** — walk Otterbrook's warm low blocks (no two facades alike, 2–3 stories over the hero) and find the hidden WOODS nook in the SW (the birder + the glade picnic); confirm Brickton's cool glass/neon downtown reads as a DIFFERENT place than Otterbrook (per-area skins) | ⬜ | ⬜ | nooks reward poking; the per-area roster is `AREA_SKINS` |

## S16 Movement 8 pre-flight — 2026-06-13, THE ICON ATLAS (ADR-060)

Every §A8 item gets a bespoke 12–16px menu icon (`ITEM_ICON`, `src/spritegen/icons.ts`), wired
into the Items bag, KEY ITEMS, the EQUIP page (slots + candidates), shop buy/sell, and battle
Goods. Verified headlessly this session via tsc + full vitest + the both-directions validator
gate + the `art:icons` contact sheet (the authoritative icon-art review; `preview_screenshot`
hangs on the WebGL canvas, so the contact sheet is the visual proof, per the ADR-059 precedent).

| Check | Result |
|---|---|
| **Every item has a face, both directions** — the validator + `icons.test.ts` sweep ITEM_ICON ⇄ ITEMS: an item with no icon fails; an icon row naming no item fails | ✅ `41 items (41 icons)`; the equippable WEAPON_ART pins (weapons.test) unchanged |
| **The contact sheet reads** — `npm run art:icons` → `.shots/icons_s16.png`, all 41 grouped by kind, each labelled; reviewed at 4× | ✅ distinct + on-theme; first-pass PB&J (a dark triangle) and poncho (a hat) redrawn until they read |
| **The 13 trinket charms/arms reuse their WEAPON_ART icon** — one drawing, two registries (no duplicate art, no drift) | ✅ ITEM_ICON pulls every `kind:'trinket'` from WEAPON_ART; the 28 held-weapon/torso/consumable/key faces are fresh in icons.ts |
| **Held weapons + torso armor get a standalone menu OBJECT** — they compose onto the battler via WEAPON_ART and had no face | ✅ a little bat/pan/rifle/beads, a folded varsity jacket + a fringed poncho |
| **Wiring is the existing per-row `icons` channel** — `pick()` (menu/shop) already drew per-row icons (the S9 JOURNAL phone icons); `Dialogue.ask()` gained the same optional `icons` param for battle Goods | ✅ tsc clean across MenuScene ×4, ShopScene ×2, BattleScene Goods, windows.ts ask() |
| `npm run validate` + `npx vitest run` + `npm run build` | ✅ validator green + **648 vitest** (+5 icons.test) + `vite build` clean; no FNV re-pin (icons are not a sample-routed generator) |

### S16 Movement 8 device rows (appended to the S8 gate)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| 31 | **Every item shows its face in the menu** — START → ITEMS on a stocked bag: each row draws its icon left of the name (corn dog, salt shaker, Star Cola…); KEY ITEMS shows the Star Locket; EQUIP shows the equipped piece's icon in each slot AND in the candidate list | ⬜ | ⬜ | icons ride `pick()`; the equipped (E) tag still reads |
| 32 | **Shops + battle Goods show icons** — a shop BUY/SELL row shows each item's face beside its price; in a battle, the GOODS menu shows the icon beside each usable item | ⬜ | ⬜ | Goods uses `ask()`'s new `icons`; rows shift right for the icon exactly like pick() |

## S17 Movement 17 pre-flight — 2026-06-13, THE ICON FORGE AT SCALE (ADR-062)

THE ICON FORGE (`src/spritegen/iconforge.ts`) — the parametric engine for the §A8 ~500-item long
tail: SUBCATEGORY silhouette × REGION ramp × per-item DETAIL, distinct by construction. M17 is
RENDER-CAPABILITY only: it adds NO items, so the shipped 41 icons and the menus/shops/battle-Goods
wiring are byte-unchanged and there is nothing new to drive in the browser this movement. Verified
headlessly via tsc + full vitest + the both-directions validator gate + the `art:icons` contact
sheets (the authoritative review; `preview_screenshot` hangs on the WebGL canvas, per ADR-059/060).

| Check | Result |
|---|---|
| **The forge renders every planned subcategory** — `npm run art:icons -- --forge` → `.shots/icons_forge.png`, one curated sample (silhouette × sample ramp × sample detail) per subcat, grouped by kind, labelled | ✅ 54 subcategories across 10 kinds; reads distinct + on-theme at 4× |
| **No two faces are the same drawing** — `icons.test.ts` hashes every ITEM_ICON AND every forge gallery sample; none byte-identical (across + within kinds); per-layer proofs (silhouette / ramp / detail / gem tint each differentiate) | ✅ the slop-detector — 41 shipped + 54 gallery all distinct |
| **Both-directions gate green, 41 unchanged** — the ADR-060 ITEM_ICON ⇄ ITEMS sweep; the shipped 41 keep their EXACT bespoke look (no new items in M17) | ✅ `41 items (41 icons)`; bands unchanged ch1:23 ch2:14 ch3:1 ch9:2 cross:1 |
| **The sheets paginate + filter** — default writes a sheet per ItemKind + the combined `icons_s17.png`; `--region chN` filters one region's catalog by item band | ✅ 11 kind pages + combined; `icons_region_ch2.png` |
| **No FNV re-pin / no frozen-core change** — icons are not sample-routed map generators; the forge seeds off the item id, not a map stream | ✅ no world_block/levelkit touch; determinism proven in vitest |
| `npm run validate` + `npx vitest run` + `npm run build` | ✅ validator green + **717 vitest** (icons.test.ts +10 forge proofs) + `vite build` clean |

### S17 Movement 17 device rows (appended to the S8 gate)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| — | **No new device scenario** — M17 ships render-capability only (no new items, no UI change); the M8 icon rows (31–32) still cover the menus / shops / battle Goods. The browser p99 loop + `android:apk` paths are unaffected (icon textures are tiny; boot registers ITEM_ICON once) | ⬜ | ⬜ | re-verify at M18 when the Americas catalog pours real forged items into shops / drops |

## S17 Movement 18 pre-flight — 2026-06-14, THE AMERICAS CATALOG (ADR-063, Part A)

The first real POUR: Ch.1 (USA) + Ch.2 (South America) grow **23 + 14 → 42 + 42** items (**+47**),
each defined + iconed + priced + banded, region-true (§A11.7), in §A11 voice. Part A ships data-complete
+ live in SHOPS + the two signature SETS bespoke & registered; live map gift-box/quest grants of the
price-0 SET pieces + picnic re-verification are the documented Part B seam. Verified headlessly via tsc +
full vitest + the both-directions validator gate + the `art:icons` regional sheets (the authoritative
review; `preview_screenshot` hangs on the WebGL canvas, per ADR-059/060).

| Check | Result |
|---|---|
| **The Americas catalog reads on its per-region sheets** — `npm run art:icons -- --region ch1` / `--region ch2` → `.shots/icons_region_ch{1,2}.png`, grouped by kind, labelled | ✅ 42 + 42 items; distinct + region-true (USA warm mix / Andean clay-gold-forest), no AI smell, read at 4× |
| **Both-directions icon + ladder + set gates green** — ITEM_ICON ⇄ ITEMS; WEAPON_ART ⇄ equippables (held/torso/trinket); WEAPON_LADDER / PP_LINE / ARMOR_LINE / SET_REGISTRY both ways; BAND_FLOOR ratcheted to the count | ✅ `88 items (88 icons)`; bands `ch1:42 ch2:42` ch3:1 ch9:2 cross:1; the distinctness sweep caught + fixed one ramp-aligned collision |
| **A tonic raises a stat for keeps (save v9 round-trip)** — Sudden Guts Pill (+4 Guts) / Speed-Demon Soda (+3 Speed) ride `applyTonic` → `HeroState.boosts` (ADR-061), survive level-up | ✅ items well-formed (`boost:{stat,amount}`); the v9 boosts path + its migration are unchanged (proven by the existing state/migration suite) |
| **Second Wind revives; the revival line scales** — Second Wind (heal 30) → Guardian-Angel Feather (heal 200), both `cure` listing `'down'` → revive at their own value (ADR-061 generalised path) | ✅ M18 catalog test asserts both revive + the feather out-heals the floor; the in-menu/in-battle `'down'` branch is the shipped ADR-061 code |
| **New shop items appear + are buyable** — the 31 priced items stock OTTERBROOK DRUG / STARMART / MERCADO DEL SOL / LANA & MAS; the 4-shop pin matches both directions | ✅ shops.ts + the validator shop canon agree; valuables / price-0 keys / SET charms correctly excluded (loot/quest goods) |
| **No FNV re-pin / no frozen-core change / no save migration** — items + icons are not sample-routed map generators; inventory references ids; tonics already ride v9 | ✅ no world_block/levelkit touch; forge seeds off the item id |
| `npm run validate` + `npx vitest run` + `npm run build` | ✅ validator green + **722 vitest** (items.test.ts +5 Americas proofs; distinctness still green at 88 + 54 gallery) + `vite build` clean |

### S17 Movement 18 device rows (appended to the S8 gate)

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| — | **Shop the Americas** — open any of the 4 shops on a save with cash: the new priced rows (Grilled Cheese, Second Wind, Otterbrook Cap, Empanada, Guardian-Angel Feather, Speed-Demon Soda…) show their forged icon beside the price (icon rows 31–32 cover the UI, unchanged); BUY adds to the bag, SELL halves | ⬜ | ⬜ | item textures are tiny; boot registers the +47 ITEM_ICON rows once — browser p99 loop + `android:apk` paths unaffected |
| — | **A tonic + a Second Wind in the menu** — use Sudden Guts Pill: "…Guts went up by 4 — for keeps!" and it survives a level-up (save → reload); knock a hero to 0, use Second Wind in battle → revived at a sliver | ⬜ | ⬜ | rides the shipped ADR-061 tonic/revival code; **Part B** lands the gift-box/quest grants of the price-0 SET pieces + the picnic re-proof |

## S17 Movement 18 — Part B (PLACE LIVE): the 16 deferred Americas items land in the world (ADR-063 Part B)

Part B grants a live, reachable home to the 16 items Part A defined but did not place: the two price-0
hero SETs, the 4 sell-fodder valuables, and the 2 story keys — all via the shipped gift-box pattern
(a closed box over an opened one, flag-gated, handed only when the bag has room → zero missables). It
also lands a Ch.1 deli so the §A4.5 Family Basket path is real in the USA too. Append-only on every
grown/landed map; verified headlessly via tsc + full vitest (incl. the BFS reachability re-proofs) +
the validator's map-quality prop-solid sweep + `vite build` + the `art:icons` sheets (unchanged — Part B
adds no items/icons).

| Check | Result |
|---|---|
| **The two hero SETs are placed + handed cleanly** — THE PORCH SET (coffee can, grown Otterbrook green) + THE MERCADO SET (market stall, grown Puerto Sol malecón), each holding all 5 hero-tagged charms, dealt one-at-a-time with a per-piece flag so a full bag loses none | ✅ `SET_CACHE` multi-grant handler in `signBeat`; the box's master flag flips only when every piece is home; the §A8 set test asserts 5 charms, price 0, one per hero |
| **The 4 valuables + 2 keys land where their joke does** — Spare Hubcap (Otterbrook pond / "Earl"), Fool's-Gold Idol (Gilded Ruins ramp), Emerald (deep jungle), Gold Doubloon (Puerto Sol dockside), Banana-Boat Ticket (Brickton pier), Wish Token (the idol's bowl, post-Grin) | ✅ each a `loot`-record gift box; the wish token is `ifFlag:'grin_defeated'`-gated; ids cross-validated against ITEMS |
| **Every box is REACHABLE + seals NO lane (BFS re-proof)** — the sub-tile box solid + an open sign tile, on hand-laid/grown-open ground; static-grid BFS in the map tests + the validator's prop-solid map-quality sweep | ✅ maps_ch2/world_block tests BFS each sign tile from a map entry; `validate` map-quality still 44/49 (same 5 frozen waivers — no new flags) |
| **Append-only — no frozen core disturbed** — the grants append after every core prop/sign; the 1995/1898 cores carry none of them | ✅ world_block prefix proofs green; `buildOtterbrook()`/`buildPuertoSol()` carry no Part-B sign (asserted) |
| **The picnic + deli Family Basket path works with Americas foods** — Ch.2's Mercado deli + Ch.1's new OTTERBROOK DRUG lunch counter both craft `basket_family` from any 3 foods; ≈3+ picnic tables per region | ✅ `deli_otter` wired to `deliBeat`; deli + table existence asserted both regions; deliBeat already accepts any `kind:'food'` (the Americas foods qualify) |
| **No new canon / FNV re-pin / save migration** — placing §A8 items via the existing gift-box + deli code introduces no mechanic; inventory references ids; no map generator touched | ✅ Bible unamended; no world_block/levelkit/FNV touch; ADR-063 gains a Part B sub-note only |
| `npm run validate` + `npx vitest run` + `npm run build` | ✅ validator green (88 items / 456 dialogue / 49 maps) + **731 vitest** (+9 Part B map/reach proofs) + `vite build` clean |

| # | Scenario | Touch | BT pad | Notes |
|---|---|---|---|---|
| — | **Open the PORCH SET coffee can** — walk the grown Otterbrook green to the oak, open the can: five charms toast in one by one (firefly_jar…lucky_acorn); with a full bag, the rest wait — come back and the can still has them | ⬜ | ⬜ | per-piece flags `porch_can_0..4`; the box swaps to opened only when all five are home |
| — | **The MERCADO stall + the dockside loot** — on the Puerto Sol malecón, take the 5-charm tray; pick up the Gold Doubloon east on the dock; sell the Hubcap/Idol/Emerald/Doubloon at any shop (half price) | ⬜ | ⬜ | same multi-grant cache; valuables route through the standard sell flow |
| — | **The Wish Token after the Grin** — return to Valle Dorado once `grin_defeated`: the token now sits in the idol's bowl (absent before the boss); the Locket hums near it | ⬜ | ⬜ | `ifFlag:'grin_defeated'` on the closed box + prompt sign; still non-missable (always re-reachable) |
| — | **A Ch.1 Family Basket** — at the OTTERBROOK DRUG lunch counter, hand over 3 USA foods (Corn Dog, Apple Pie Slice, Grilled Cheese) → one Family Basket; use it at a town picnic table for the Sunny Side buff | ⬜ | ⬜ | `deli_otter` shares `deliBeat`; the three-foods-leave / one-basket-lands path is the shipped Ch.2 code |

---

## S17 M19 (ADR-064) — THE OLD-WORLD CATALOG (Ch.3 England · Ch.4 Norway · Ch.5 Minimus)

The second regional pour, copying the M18 template ×3. Grows the catalog **88 → 214 items** (+126):
**ch3 1→42, ch4 0→41, ch5 0→41, cross 1→4**. Ch.3/4/5 are UNLANDED, so this movement is **DATA +
ICONS + the validator MANIFEST ONLY** — no shops, maps, quests, or gift-boxes were touched (live
placement lands in each chapter's own session, the way M18 Part B placed the Americas). Every item is
region-true (§A11.7), in §A11 voice, priced to §A9 (the chapters get richer climbing — Ch.3 > Ch.2),
banded, and iconed (forged tail / hand-drawn signatures). Verified headlessly: tsc + full vitest + the
validator + `vite build` + the `art:icons` region/forge sheets read by eye.

| Check | Result |
|---|---|
| **Ch.3 England — Milo's chapter** — the GUN LADDER (Pellet Popper → Spud Gun → Double-Barrel Sparker → *Gauss Lobber*, the Mainframe drop), the Cricket Bat sidegrade, TEA AS PP, canteen stodge + proper foods, the gizmo/repair line (Broken Gizmo + repaired battle goods), the Cricket Cap rung, academic gear, library/groundskeeper goods | ✅ 42 items; `WEAPON_LADDER[ch3]` + `PP_LINE[ch3]` + `ARMOR_LINE[ch3]` pass both directions; the gun-ladder test climbs |
| **Ch.4 Norway — SCALE is the joke** — fishing-hamlet foods (the Dog-Sized Berry, Growth-Spurt Milk for +max HP), funny sidegrades (Frozen Cod / Lefse Griddle), the Fur-Lined Hood rung, THE FIRST RESIST PENDANTS (the **Cool Charm** vs cold, freeze-resist DATA), the Firecracker String (the Whisperwig's NOISE), the Giant's Banknote, Sigrid's Monocle | ✅ 41 items; the resist test asserts `cool_charm`/`fur_lined_hood` carry `freeze` resist; Akutaq held back as Alaskan (§A8 region-true) |
| **Ch.5 Minimus — TINY is the joke** — PIPPA'S KIT LADDER (Stamp Sling → Needle Saber → Thimble Bell → *Royal Red Pen*, the Minister's appointment top), tiny-everything food/charms, the Paper Crown rung, diplomatic gear (Luck/morale riders), census/duchy valuables, the Royal Thimble + Big-Little Lens scale-anchor keys | ✅ 41 items; a new `kit` WeaponClass (silhouette + sfx) opens for Pippa; her ladder climbs, all `pippa`-tagged |
| **THE LOST & FOUND OF IMPOSSIBLE SIZES** (§A10 cross-chain seed) — the Giant Button (a shield in Lilleby, a manhole cover in Kvisthavn), the Impossible Berry, the Tiny Postcard (too small for Dad to read) | ✅ 3 items banded `cross` (they travel the world, not one region); the cross-seed test pins the band |
| **heroResist DECISION — DATA only, binding DEFERRED** — the resist pendants carry real `resists` (summed by `heroResist`, capped at 80%, shown in STATUS, ADR-061); the actual damage-reduction binding waits for the first landed chapter (no shipped enemy carries elemental moves) | ✅ no battle-math / enemy-schema / save-migration change; the Bible needs **no** amendment (no new mechanic shipped — pouring §A8-anticipated items is implementing canon) |
| **THE DISTINCTNESS LAW** — every new item gets exactly ONE byte-distinct ITEM_ICON; the forge tail is one line each, signatures hand-drawn; one new `book` subcat added (England library / duchy census) | ✅ `icons.test.ts` green at 214 icons + the 55-subcat forge gallery; 3 seeded collisions caught + fixed (eye_drops/smelling_salts, oilcloth/oilskin, wish_token/lucky_penny) — the test working as designed |
| **BOTH-DIRECTIONS GATES + the floor ratchet** — ITEM_ICON ⇄ ITEMS, WEAPON_ART ⇄ equippables, WEAPON_LADDER / PP_LINE / ARMOR_LINE both ways; `BAND_FLOOR` ratcheted ch3→42 ch4→41 ch5→41 cross→4 | ✅ `validate` prints `ch3:42 ch4:41 ch5:41 … cross:4`; every battle item carries an `ITEM_FX` row |
| **UNLANDED HELD** — no maps*.ts / shops.ts / quests touched; Ch.3/4/5 aren't landed | ✅ only `data/items.ts`, `spritegen/{icons,weapons,iconforge}.ts`, `battle/fxRegistry.ts`, `engine/audio.ts`, the validator + tests changed |
| `npm run validate` + `npx vitest run` + `npx tsc --noEmit` + `npx vite build` | ✅ validator green (**214 items / 214 icons**) + **738 vitest** (+7 M19 catalog proofs) + tsc clean + `vite build` clean + the ch3/ch4/ch5/forge sheets re-rendered and read by eye (England damp-grey/brass · Norway cold-blue/birch · Minimus jewel-box velvet — no AI smell) |

## S17 M20 (ADR-065) — THE FAR-WORLD CATALOG (Ch.6 Africa · Ch.7 India · Ch.8 China)

The third regional pour, copying the M18/M19 template ×3. Grows the catalog **214 → 337 items** (+123):
**ch6 0→41, ch7 0→41, ch8 0→41**. Ch.6/7/8 are UNLANDED, so this movement is **DATA + ICONS + the validator
MANIFEST ONLY** — no shops, maps, quests, or gift-boxes were touched (live placement lands in each chapter's
own session, the way M18 Part B placed the Americas). Every item is region-true (§A11.7), in §A11 voice,
priced to §A9 (the chapters get richer climbing — Ch.6 > Ch.5, Ch.7 > Ch.6, Ch.8 > Ch.7; §A6 levels
30/35/40), banded, and iconed (forged tail / hand-drawn signatures). Verified headlessly: tsc + full vitest
+ the validator + `vite build` + the `art:icons` region/forge sheets read by eye.

| Check | Result |
|---|---|
| **Ch.6 Africa — Teleport α's chapter** — Jay's **Aluminum Bat → Hall-of-Famer** (the Laughing Sphinx drop, price 0), Mia's **Cast-Iron Pan**, Zanzibel-market + savanna foods (the Jollof Bowl §A8), kola/hibiscus/baobab PP, the **Turban of Calm** (it does nothing calming), the **RIDDLE RING** (§A10 #13 — the first +10 Vibe gear, bespoke), the **Canteen of the Crossing** (§A10 #14 key), savanna charms + desert-ruin valuables | ✅ 41 items; `WEAPON_LADDER[ch6]` + `PP_LINE[ch6]` + `ARMOR_LINE[ch6]` pass both directions; the Riddle Ring test asserts `vibe:10` |
| **Ch.7 India — the game's biggest city** — Mia's **Chef's Pan** (the Cobra Raja drop, price 0) + the cobra-flute kit sidegrade, bazaar street food (the Samosa §A8), the **Star Pendant** (§A8 treasure), the **SPICE BOX** (§A10 #15, data-only key), the **Monkey Paw** (§A10 #16), the **Train Ticket** (§A8 key, bespoke), the volt-resist **Rubber Brooch**, a river-ghat revival, a cinema stub | ✅ 41 items; the resist test asserts `rubber_brooch` carries `volt` 25; the Spice Box ships as a flavor KEY |
| **Ch.8 China — Teleport β's chapter** — Dorin's **River Beads** (defined early) + the Paper Dragon's **Folded-Paper Fan** (boss drop, price 0), harbor + temple foods (the Baozi §A8), jade tea / monks' broth / **Temple Incense** PP, the **SCROLL OF CALM** (§A10 #17, reusable DATA) + a Spore Antidote (the Mushroomize cure tier debuts), the fire-resist **Jade Salamander**, the Bamboo Hat rung, paper-fold charms (Pippa's "false folds"), **Yak Treats** (§A8 key, bespoke), porcelain/lantern valuables | ✅ 41 items; the Scroll-of-Calm test asserts `cures:['mushroomize']` + `reusable:true`; the Bell Clapper kept out (Romania, §A11.7) |
| **THE THREE NEW-MECHANIC DECISIONS — all DATA-only, bindings DEFERRED** — (1) `heroResist`: volt+fire resist ships as DATA (summed, capped, shown in STATUS), the damage binding waits for the first landed elemental enemy; (2) the Spice Box food-multiplier: a flavor KEY, wiring deferred to Ch.7; (3) the Scroll of Calm reusable-cure: `reusable:true` DATA, the cure-path binding deferred to Ch.8 (consistent with M19's reusable-revive Defibrillator) | ✅ no battle-math / enemy-schema / food-path / cure-path / save-migration change; the Bible needs **no** amendment (no new mechanic shipped — pouring §A8/§A10-anticipated items is implementing canon) |
| **THE §A4.12 TONIC LINE completes; the §A8 RESIST gear fills** — M20's Turmeric Draught fills the last unfilled tonic stat (Defense); the resist pendants now cover fire (Jade Salamander) / freeze (M19) / volt (Rubber Brooch) | ✅ the tonic test asserts `turmeric_draught` = `{defense, 3}`; the resist test asserts volt + fire DATA |
| **THE DISTINCTNESS LAW** — every new item gets exactly ONE byte-distinct ITEM_ICON; the forge tail is one line each, signatures hand-drawn (7 bespoke: cobra-flute, paper-fan, Train Ticket, Yak Treats, Spice Box, Scroll of Calm, Riddle Ring); one new `lantern` subcat added (Lotus Harbor) | ✅ `icons.test.ts` green at 337 icons + the 56-subcat forge gallery; 7 seeded collisions caught + fixed (akara/empanada, kola/bug-juice, riddle-shard/crown-jewel, jeweled-pagri/paper-crown, star-ruby/amber-chunk+gallery, baozi/crumpet, sesame/dog-berry) — the test working as designed |
| **BOTH-DIRECTIONS GATES + the floor ratchet** — ITEM_ICON ⇄ ITEMS, WEAPON_ART ⇄ equippables, WEAPON_LADDER / PP_LINE / ARMOR_LINE both ways; `BAND_FLOOR` ratcheted ch6→41 ch7→41 ch8→41 | ✅ `validate` prints `ch6:41 ch7:41 ch8:41`; every battle item carries an `ITEM_FX` row |
| **UNLANDED HELD** — no maps*.ts / shops.ts / quests touched; Ch.6/7/8 aren't landed | ✅ only `data/items.ts`, `spritegen/{icons,weapons,iconforge}.ts`, `battle/fxRegistry.ts`, the validator + tests + docs changed |
| `npm run validate` + `npx vitest run` + `npx tsc --noEmit` + `npx vite build` | ✅ validator green (**337 items / 337 icons**) + **745 vitest** (+7 M20 catalog proofs) + tsc clean + `vite build` clean + the ch6/ch7/ch8/forge sheets re-rendered and read by eye (Africa savanna-ochre/indigo · India bazaar-jewel · China jade/lacquer-red/rice-paper — no AI smell) |

## S17 M21 (ADR-091) — THE LAST-WORLD CATALOG (Ch.9 Romania · Ch.10 Alaska→Hawaii→Mars)

The FOURTH and FINAL regional pour — it closes S17 "THE GREAT CATALOG." Grows the catalog
**337 → 467 items** (+130): **ch9 2→45, ch10 0→76, cross 4→15**, landing the grand total near the §A8
~500. Ch.9/10 are UNLANDED, so this movement is **DATA + ICONS + the validator MANIFEST ONLY** — no
shops, maps, quests, or gift-boxes touched (live placement lands in each chapter's own session, the
M18-Part-B way). Region-true (§A11.7), in §A11 voice, priced to §A9 (Ch.9 > Ch.8; Ch.10 the dearest in
the game; §A6 levels 46 / 52–55+), banded, iconed (forged tail / hand-drawn signatures). Verified
headlessly: tsc + full vitest + the validator + `vite build` + the `art:icons` region/forge sheets read
by eye. **The catalog ends with the LAST item in the game — the Player's House Key.**

| Check | Result |
|---|---|
| **Ch.9 Romania — the emotional heart** — Mia's **THE HOLY PAN** (§A8 TOP — the monastery's sincere home, price 0), the **Candelabra** (Hoaxula's boss-drop), **BUNI'S PANTRY** (Sarmale §A8; **Mămăligă cu Brânză** = best HP/$ in the game; the 5 Feast Basket ingredients §A10 #18; cozonac/mici/ciorbă/plăcintă/papanași), **Monastery Tea** (§A8), the căciulă hat rung + velvet/harvest/monastery bodies, the **MONASTERY BELL CLAPPER** (§A8 key — Stone Brow, NOT Mt. Shu), the **Saint's Medal** (HOLY-resist, completing the §A8 four), Hoaxula's theatrical props (fake fangs, a Cleveland season pass, Vibe in a jar), a sincere Vigil-Candle revival | ✅ 45 items; `WEAPON_LADDER[ch9]`/`PP_LINE[ch9]`/`ARMOR_LINE[ch9]` pass both ways; mămăligă asserted best HP/$ in the whole catalog |
| **Ch.10 Alaska→Hawaii→Mars — the endgame (ONE band, THREE locales, a double pour)** — ALASKA: **Akutaq** (§A8, held back from Norway per §A11.7), the **Insulated Suit** (§A10 #19), freeze-resist gear, the Frost Sentinel drop; HAWAII: **Poke Bowl** (§A8), the **Board of Legends** (§A10 #20 — Jay's funniest), the fire-resist rung + Tiki Magma Golem drop, the **ROCKET MANIFEST** (§A8 key); MARS: **Freeze-Dried Ice Cream** (§A8), **Casey's Last Swing** (Jay TOP), **Comet Bead** (Dorin TOP, the 1/128 Null Walker), the **HALLELUJAH BELL** (revival TOP, full revive, WORKS today), the dearest tonics, and **THE PLAYER'S HOUSE KEY** (the LAST item) | ✅ 76 items; the §A8 TOPS close (priced 0, each tops its line); the Hallelujah Bell full-revives via the LIVE `'down'` path; the House Key is asserted the last key (ch10, key, price 0) |
| **The §A8 HERO LADDERS CLOSE; the resist set + revival line complete** — Jay (Casey's), Mia (Holy Pan), Dorin (Comet Bead) topped; all five heroes now laddered; the §A8 ELEMENTAL RESIST gear covers all four — freeze (M19) · volt + fire (M20) · **HOLY** (M21, Saint's Medal); the multi-tier revival line ends at the working Hallelujah Bell | ✅ the catalog test asserts the TOPS climb + price 0, `comet_bead` Vibe +10, the resist set, and the Meteor Shard as the dearest item ($2000) |
| **THE THREE NEW-MECHANIC DECISIONS — all DATA-only, bindings DEFERRED** — (1) `heroResist`: HOLY ships as DATA (the §A8 four now exist), the damage binding waits for the first landed elemental enemy (or M24); (2) the reusable-cure path: the Hallelujah Bell works CONSUMED via the live `'down'` path; the reusable binding stays owed with M20's Scroll of Calm; (3) the Spice Box multiplier stays owed from M20 | ✅ no battle-math / enemy-schema / food-path / cure-path / save-migration change; the Bible needs **no** amendment (no new mechanic — pouring §A8/§A10-anticipated items is implementing canon) |
| **THE DISTINCTNESS LAW** — every new item gets exactly ONE byte-distinct ITEM_ICON; the tail forges one line each, signatures hand-drawn (9 bespoke: Holy Pan, Candelabra, Board of Legends, Casey's bat, Comet Bead, Bell Clapper, Rocket Manifest, Hallelujah Bell, and — most loved — the House Key); three new forge subcats (`parka`, `foilpack`, `candle`) | ✅ `icons.test.ts` green at 467 icons + the 59-subcat forge gallery; 8 seeded collisions caught + fixed (censer/temple, pineapple/mango, lava-salt/turmeric, thruster/smoke-bomb, cosmonaut/duchy, sentinels/pendant, airlock/note, vigil/candle) — the test working as designed |
| **BOTH-DIRECTIONS GATES + the floor ratchet** — ITEM_ICON ⇄ ITEMS, WEAPON_ART ⇄ equippables, WEAPON_LADDER / PP_LINE / ARMOR_LINE both ways; `BAND_FLOOR` ratcheted ch9→45 ch10→76 cross→15; every battle item carries an `ITEM_FX` row | ✅ `validate` prints `ch9:45 ch10:76 cross:15` |
| **UNLANDED HELD** — no maps*.ts / shops.ts / quests touched; Ch.9/10 aren't landed | ✅ only `data/items.ts`, `spritegen/{icons,weapons,iconforge}.ts`, `battle/fxRegistry.ts`, the validator + tests + docs changed |
| `npm run validate` + `npx vitest run` + `npx tsc --noEmit` + `npx vite build` | ✅ validator green (**467 items / 467 icons**) + **977 vitest** (+9 M21 catalog proofs) + tsc clean + `vite build` clean + the ch9/ch10/forge sheets re-rendered and read by eye (Romania velvet/harvest/candlelit · Alaska ice · Hawaii magma/island · Mars near-silent dread — no AI smell) |

## S18 M22 (ADR-092) — THE GLYPH FORGE / §A11.8 THE GLYPH LAW

The first of S18's three closing movements (M22 GLYPH FORGE → M23 FLAIR WEAVE → M24 VERIFICATION).
Builds the icon forge's sibling: a parametric, deterministic, palette-clean engine that stamps a
DECORATIVE, REGION-TRUE glyph script for every canon §A5/§A6 area, and CLOSES THE GAP ADR-061 left —
its amendment record claimed it added §A11.8 THE GLYPH LAW, but §A11.8 was never written into the
Bible (§A11 stopped at rule 7). M22 writes the real §A11.8 AND ships the forge that implements it.
The catalog is untouched (still 467 items); this movement is ENGINE + LAW + GATE + WIRING. Verified
headlessly: tsc + full vitest + the validator + `vite build` + the `art:glyphs` area/forge sheets read
BY EYE (ADR-059/060 — not `preview_screenshot`).

| Check | Result |
|---|---|
| **§A11.8 THE GLYPH LAW written** — the gap ADR-061 promised, delivered: §A11.8 added to the Bible (Appendix rule 6, dated, in §A11 voice) — diegetic decoration never chapter UI (§A11.6), abstract stroke-forms that spell nothing readable, the Hush's script sparse + never funny (§A11.3), region-true at the stroke (§A11.7). The discrepancy is documented in ADR-092 | ✅ §A11.8 reads in §A11 voice; the old §A11.8 pixel-emoji sketch is reassigned to M23 THE FLAIR WEAVE (the road's reorganisation, noted in the ADR) |
| **THE THREE-LAYER FORGE** (`src/spritegen/glyphforge.ts`) — SCRIPT FAMILY (stroke grammar) × REGION RAMP (`REGION_RAMPS` reused) × stable SEED, Phaser-free, ADR-020 by construction (palette-only, `outline()` last, pure light after), NO map FNV / world_block re-pin | ✅ `forgeGlyphRun({script,band,seed,length})` pure → identical bytes forever; 13 script families (colonial/deco/talavera/fraktur/runic/heraldic/cursive/barscript/seal/slavonic/frost/tiki/hush) |
| **Every canon area owns a region-true script** — `GLYPH_SCRIPT` maps all 17 `CANON_AREAS` the way `AREA_SKINS` (ADR-066) gave each a building roster; the Hush (`mars`) is the sparsest, saddest writing in the game | ✅ 17 areas scripted; America sign-paint / Brickton deco / Andean tile / England blackletter / Norse runes / ducal heraldry / bazaar cursive / India headline-bar / temple seal / village Cyrillic / Aurora frost / island tiki / Mars hush — each unmistakable |
| **BOTH-DIRECTIONS GATE** — `GLYPH_SCRIPT ⇄ CANON_AREAS` in `tools/content-validate.ts` (the new `glyph-script` section) AND the vitest mirror (`src/spritegen/glyphs.test.ts`): every area has a real script that draws something; no orphan row; any `map.area` names a real script | ✅ `validate` prints "17 area glyph scripts (13 families)"; the gate fails loudly on a missing/orphan/empty script |
| **THE DISTINCTNESS LAW** (the slop-detector, ADR-060/062 discipline) — every shipped area run + every forge gallery sample byte-distinct; the three layers each differentiate; two areas sharing a family stay distinct via seed=area-id; palette + determinism + the Hush-is-sparsest read | ✅ `glyphs.test.ts` green at 17 areas + the 13-family gallery; NO seeded collisions (the per-cell streams spread cleanly) |
| **A CONTACT SHEET, READ BY EYE** — `art:glyphs` (the `art:icons` precedent): an area sheet by region + a `--forge` family gallery to `.shots/` | ✅ `glyphs_areas.png` + `glyphs_forge.png` re-rendered and read with the Read tool — region-true, slop-free, no AI smell; the Mars hush sparse + sad |
| **WIRED TASTEFULLY** — boot registers one `glyph_<area>` texture per area; `OverworldScene.showBanner` draws the region-true run beneath the place name when `MapDef.area` is set; the LIVE Americas overworlds (otterbrook/brickton/cage_park/puerto_sol) declare their area; unlanded regions inherit the hook | ✅ optional `MapDef.area` (validated); banner widens to fit the glyph; §A11.6-safe (decoration, not text) |
| **DEFERRED DEBTS STAY DEFERRED** — heroResist damage, the reusable-cure path, the Spice Box multiplier, `EnemyDef.drops` — glyph work needed none of them | ✅ no battle-math / enemy-schema / food-path / cure-path change; no save migration (`MapDef.area` is static map data, not save state) |
| `npm run validate` + `npx vitest run` + `npx tsc --noEmit` + `npx vite build` | ✅ validator green (467 items / 17 area glyph scripts) + **991 vitest** (+14 glyph proofs) + tsc clean + `vite build` clean + the area/forge glyph sheets re-rendered and read by eye |

## S18 M23 (ADR-093) — THE FLAIR WEAVE / §A11.9 THE FLAIR LAW

The second of S18's three closing movements (M22 GLYPH FORGE → **M23 FLAIR WEAVE** → M24 VERIFICATION).
The icon/glyph forge's youngest sibling: the tiny pixel-emoji `{g:NAME}` layer inlined IN TEXT (a real
🔥, a 💥 SMAAASH burst, a ⭐, a 💔), rendered as little sprites mixed into the letter-by-letter dialogue
and battle captions — flair in a LINE, never decoration on a wall (that is M22). The catalog is untouched
(still 467 items); this movement is ENGINE + LAW + GATE + WIRING + a sparse dialogue pass. Verified
headlessly: tsc + full vitest + the validator + `vite build` + the `art:flair` contact sheet read BY EYE
(ADR-059/060 — not `preview_screenshot`).

| Check | Result |
|---|---|
| **§A11.9 THE FLAIR LAW written** — added to the Bible (Appendix rule 6, dated, in §A11 voice): a glyph never carries meaning the words don't (§A11.7), the Hush never carries a glyph (§A11.3), sincere beats + bosses stay clean (§A11.2), never chapter UI (§A11.6) | ✅ §A11.9 reads in §A11 voice, beside §A11.8; the two glyph systems explicitly named siblings, never the same thing |
| **THE GLYPH VOCABULARY** (`src/spritegen/flair.ts`) — 42 palette-clean ~11px pixel glyphs, ADR-020 by construction (`outline()` last, palette indices only), memoised + registered at boot under `flairGlyphKey(name)` with a DISTINCT `flair_` prefix (never collides with M22's `glyph_<area>`) | ✅ 42 glyphs (elements/feeling/status/sky/objects/marks/EB-food winks); the slop-detector proves all 42 byte-distinct |
| **THE MIXED-RUN RENDERER** — pure `ui/runlayout.ts` (Phaser-free, unit-tested) splits a caption into RUNS, word-wraps in CELLS, maps UNIT→CHAR with **a glyph = ONE timed unit**; `ui/flairline.ts` binds it to a live BitmapText (reads the real font metrics) and overlays the sprites, woven into BOTH Dialogue AND BattleScene.print | ✅ each glyph reveals as one visual unit respecting wrap + A-to-fast-forward; a no-flair caption takes the original plain typewriter UNCHANGED (461 scripts byte-identical) |
| **BATTLE AUTO-FLAIR** — `FLAIR_BY_ELEMENT` (fire/freeze/volt/holy on a hero's cast) + `FLAIR_BY_RESULT` (a SMAAASH crit burst, a heal sparkle, a non-boss KO star), driven by the move's element/result, never hand-typed per enemy; bosses' own lines stay clean | ✅ sparse — most lines (bashes/misses/status/enemy turns) stay plain; the line reads fully WITHOUT the glyph (§A11.9) |
| **DIALOGUE FLAIR — hand-placed + RARE** — one warm glyph only where it earns it: Ana's lemonade `{g:lemon}`, Biscuit at the corn dogs `{g:corn_dog}`, the welcome sign's "one very good dog" `{g:paw}`, the Casi-Oro curator's real-gold fixation `{g:coin}` | ✅ 4 placements across 461 scripts (≈1%); Hush / Mom's calls / sincere beats untouched; every line readable without its glyph |
| **GATED BOTH DIRECTIONS** — a new `flair` section in `tools/content-validate.ts` AND `flair.test.ts`: every `{g:NAME}` names a real glyph; `GLYPH_TOKENS ⇄` the drawn registry both ways (no undeclared draw, no undrawn token); battle maps reference real glyphs; DISCIPLINE forbids a literal `{g:}` on menu/shop/journal surfaces | ✅ `validate` prints "42 flair glyphs"; a typo'd `{g:fier}` fails the build loudly |
| **THE DISTINCTNESS LAW** (the slop-detector, ADR-060/062/092 discipline) — `flair.test.ts` hashes every glyph: no two share a drawing; palette-conformance; in-bounds; stable bytes. `runlayout.test.ts` proves the layout + the one-unit timing + the plain-caption passthrough | ✅ +22 vitest (12 flair art + 10 runlayout); NO glyph collisions among the 42 |
| **A CONTACT SHEET, READ BY EYE** — `npm run art:flair` (`tools/render-flair.ts`, the `art:glyphs` precedent): every glyph in a labelled gallery + SAMPLE LINES through the REAL mixed-run layout to `.shots/flair.png` | ✅ `flair.png` rendered + read with the Read tool — all 42 legible/distinct at 11px, inline glyphs centred on the line, wrap clean, no AI smell; `holy` redrawn (window → Latin cross) on the eye-check |
| **DEFERRED DEBTS STAY DEFERRED** — heroResist damage, the reusable-cure path, the Spice Box multiplier, `EnemyDef.drops` — flair work needed none | ✅ no battle-math / enemy-schema / food-path / cure-path change; no FNV / world_block re-pin; no save migration (text/flair is static) |
| `npm run validate` + `npx vitest run` + `npx tsc --noEmit` + `npx vite build` | ✅ validator green (467 items / 42 flair glyphs) + **1013 vitest** (+22 flair/runlayout proofs) + tsc clean + `vite build` clean + the flair contact sheet re-rendered and read by eye |

## S18 M24 (ADR-094) — BALANCE & THE GREAT VERIFICATION

The LAST of S18's three closing movements (M22 GLYPH FORGE → M23 FLAIR WEAVE → **M24 GREAT VERIFICATION**),
and the capstone that PROVES the whole game is consistent, completable, and balanced — then CLEARS the four
standing deferred debts so S18 closes with no IOUs. Two halves: **(A)** `npm run balance` grows into a real
report (growth curves + ability ladders + boss TTK + the §A4 economy + the EXP grind), the validator gains a
GREAT-VERIFICATION sweep, and the landed slice is proven completable; **(B)** heroResist damage, the
reusable-cure path, the Spice Box multiplier, and `EnemyDef.drops` all land FULLY. Verdict recorded in
`docs/VERIFICATION.md`. Verified headlessly (the WebGL canvas hangs `preview_screenshot`, ADR-059/060): tsc +
full vitest + the validator + `vite build` + `npm run balance` read BY EYE. **No save migration** — every
debt is static/derived, none adds persistent save state.

| Check | Result |
|---|---|
| **HALF A — `npm run balance` is now a REPORT a human reads** (`tools/balance-sim.ts` + the pure `src/battle/verify.ts`): per-character GROWTH curves, the Vibe LADDERS (PP vs power + the α→β leap), boss HP vs TIME-TO-KILL at each §A6 target level, the §A4 economy (revival line / tonics / picnic / hospital / Spice Box), and the EXP grind — beside the inherited Fortune-Arc/property/fleet/fuel ladders | ✅ read BY EYE + recorded in `docs/VERIFICATION.md`: every ladder climbs, α→β is **exactly ×2.60** (Surge/Fire), every boss falls in **4–10 turns** (conservative floor) — the curves are SANE, no §A9 retune needed |
| **HALF A — the validator's GREAT-VERIFICATION sweep** (`tools/content-validate.ts`, new `drops`/`reusable`/`resist`/`verify` sections): boss HP+level climb together, landed boss HP == live ENEMIES, every boss TTK in the fair 2–25 window, every shop shelf affordable on the Fortune Arc at its chapter, every revive heals + every cure lists a real status, `AWAKENING_LEVEL ⇄ AWAKENINGS` both ways | ✅ the cross-checks the old gates didn't make; the VERDICT line stays truthful ("6 §A7 drops") |
| **HALF A — the landed Ch.1–2 slice is COMPLETABLE** (B4) — proven headlessly via the sim/manifests, not by hand: both chapters `shipped` with live maps + quests + a boss beatable at its §A6 level (Tick TTK 10, Grin TTK 6); the ch1→docks→ch2 gate chain coherent | ✅ `verify.test.ts` pins it; no by-hand playthrough needed |
| **DEBT #1 — heroResist DAMAGE binding** — `resistIncoming()` (formulas.ts) binds the §A8 pendant read at BattleScene's incoming-damage seam (gear-first, parallel to Jay's ward); a worn fire/freeze/volt/holy pendant HALVES a matching elemental ENEMY hit. The **Coily Cicada's "August glare"** is the first landed elemental move (§A11 voice) | ✅ gate `resist` (every elemental move is resistable + gear-covered, the four-set whole); test: the Jade Salamander Charm (fire 25%) takes a 100 fire hit to 75, leaves volt/physical at 100 |
| **DEBT #2 — THE REUSABLE-CURE PATH + the Defibrillator** — `consumesOnUse()` (items.ts) skips the consume step for `reusable` items in BOTH the battle AND menu cure/revive paths (and the Camera-Flash/battle paths). **Milo's Defibrillator** (§A4.12 Repaired-Gizmo reusable revive, heal 280, forged icon) joins the catalog and completes the revival line | ✅ gate `reusable` (rides cures/battle only; the Defibrillator cures 'down' + heals + is reusable; the Scroll of Calm stays reusable); test: a reusable item survives use, a normal one is spent |
| **DEBT #3 — THE SPICE BOX food-multiplier** — `spiceFoodHeal()` (items.ts) ×1.5s the §A8 food heal in BOTH the battle AND menu food paths, keyed off owning the Spice Box key item (`GS.hasKeyItem`, new) | ✅ test: a 60-HP dish → 90 with the box owned, 60 plain without; rounds cleanly, never lost below 1 |
| **DEBT #4 — `EnemyDef.drops`** (owed to THIS pass) — `EnemyDropSchema` + `EnemyDef.drops?` (schemas) + `rollDrops()` (formulas.ts) wired into the battle VICTORY rewards (a defeated enemy rolls its drops into the bag, EB-style, full-hands handling). **6 tasteful Ch.1–2 drops** seeded with §A7 identity (the sunburn Cicada → Aloe Leaf, the food-thief Pigeons → Corn Dog, the gold Beetle → Doubloon, the crying Souvenir → Hanky…) | ✅ gate `drops` BOTH ways (every drop a real item, sane 0<chance≤1, economy-neutral, key items boss-only); test: the roll is independent + deterministic + seeded drops are real + cheap |
| **CARRY EVERY PRIOR LAW** — the both-directions gates (new registry/field pinned in the validator AND a vitest mirror); the conservative TTK read is a LOWER bound (no weapons), so a fair read here is fair in play; no off-palette art (the Defibrillator's forged icon passes the ADR-060/062 distinctness sweep by construction) | ✅ no slop-detector regression; no `any`; the §A11 spine holds (the cicada's line + the drop lines are in voice, sincere beats untouched) |
| **NO SAVE MIGRATION** (correctly) — heroResist is derived from gear, reusable/Defibrillator ride the existing inventory id list, the Spice Box reads an existing key item, drops land in existing bag arrays. None adds persistent save state | ✅ save schema UNCHANGED (no v-bump invented that wasn't needed); old saves load byte-identical |
| `npm run validate` + `npx vitest run` + `npx tsc --noEmit` + `npx vite build` + `npm run balance` | ✅ validator green (**468 items / 6 §A7 drops**) + **1043 vitest** (+30: verify + the four debts' pins) + tsc clean + `vite build` clean + the balance report read by eye |
