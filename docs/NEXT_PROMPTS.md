# NEXT_PROMPTS — continuing the build from here

State as of these prompts: Phase 0–1 engine + a playable Chapter 1 opening
slice are done (see DECISIONS.md ADR-001..010). Characters are 24×32 v2
sprites. Maps are code-grids (ADR-004), audio is the synth (ADR-006), data is
typed TS (ADR-005). Work through these in order, one prompt per session, per
the Bible's Appendix rules (review the diff, run the checks, commit).

Every prompt starts with the Standard Header:

```
Read docs/GAME_BIBLE.md fully before doing anything. It is canon — never invent
content that contradicts it, never use placeholder/mock data for anything it
defines. Follow repo conventions in docs/DECISIONS.md and append any new
architectural decision you make to it. TypeScript strict, no `any`.
```

---

## Prompt S1 — Brickton City & the Department of Smiles (maps + enemies)

```
[Standard Header]
Build the second half of Chapter 1's geography per §A6 Ch.1, extending
src/data/maps.ts (ADR-004 grid format) and the sprite engine where new tiles
are needed (sidewalk, brick wall, office floor, cubicles, elevator):
(1) the bus-ride transition: boarding at the Otterbrook bus stop plays a
short interior cutscene scene (window scrolling by, one weird passenger),
then arrives in (2) BRICKTON CITY — a 2-screen downtown block: sidewalks,
storefronts, payphone, hospital front, 4+ NPCs with one weird obsession each
(§A11), Blazer Smilers roaming the streets (they're in §A7 Ch.1); and
(3) THE DEPARTMENT OF SMILES — a 3-floor office dungeon: cubicle maze floors,
sight-line Smiler patrols (caught = battle, not fail), locked "holding room"
on floor 3. Wire encounter spawners (§A7: Blazer Smiler, Pigeon Gang) and 2
picnic tables per §A4.5. Don't write the Faye story beats yet — rooms,
enemies, doors (with indicators, ADR door-marker convention) and ambient NPC
dialogue only.
Done when: you can bus from Otterbrook to Brickton, fight Smilers, and walk
every floor of the Department to the locked holding room. Tests + build green.
```

## Prompt S2 — Faye joins (story pass)

```
[Standard Header]
Write Chapter 1's ending per §A6/§A2 in §A11 voice, on top of S1's maps:
Rex reaches the floor-3 holding room; FAYE is inside (she has been hearing
the Embers sing — and heard Rex coming, §A3 "kind, steel-spined"); free her
(small puzzle: the door's "PRODUCTIVITY LOCK" opens when three patrol Smilers
on the floor are defeated); Faye joins the party at level 6 with her canon
kit (Vibe Fire α, PRAY at L1 — they're already in src/data). Add Faye to the
party system end-to-end: follower conga, battle command menu (Pray!), status
box with her own odometers, defeat/respawn. The Smiles' manager blocks the
exit — a scripted 2-Smiler fight with Faye's first Pray tutorialized. Mom
calls the Brickton payphone afterward (the Bible's "first phone tutorialized
by Mom calling YOU"). Set ch1_complete.
Done when: a fresh save plays from 2 AM to ch1_complete with both heroes;
Pray's table fires in real battle; all dialogue in-voice.
```

## Prompt S3 — Full pause menu & equipment (Bible Prompt 7 + 19)

```
[Standard Header]
Replace the interim pause menu (OverworldScene.pauseMenu) with the EB command
menu per Prompt 7: Items (per-hero 14-slot bags + shared key items — migrate
GS.data.inventory to per-hero, with a save-version migration), Status (full
§A3 stat sheet per hero), Vibe (ability list, PP costs, greyed when
unusable), Equip (weapon/body/arms/other slots with "Offense up by N!"
preview per Prompt 19), Setup (volume, text speed), and the STAR LOCKET
screen (embers + Homesong stems per §A4.9). Touch AND controller navigable
(§B4). Unit-test the save migration v1→v2.
Done when: equip a T-Ball Bat from the menu and see battle damage change;
old saves still load.
```

## Prompt S4 — Shops, ATM & the cash loop (Bible Prompt 20)

```
[Standard Header]
Open the Otterbrook drugstore and a Brickton corner store as real interiors
(grid maps + shopkeeper NPCs): buy/sell UI per Prompt 20 (sell at half,
equip-after-buy prompt), stock from §A8 Ch.1-appropriate items (T-Ball Bat,
Hand-Me-Down Pan, Corn Dogs, PB&J, Salt Shakers, Star Cola). Add an ATM in
Brickton: withdraw/deposit against GS.data.banked. Keep Dad's deposit flow
(ADR: only pendingDeposit + first-time gift). Replace the locked_drugstore
line with the real door.
Done when: earn cash on the hill → call Dad → withdraw at the ATM → buy a
T-Ball Bat → "Offense up by 4!".
```

## Prompt S5 — Zod data layer & content validator (Bible Prompt 8, adapted)

```
[Standard Header]
Begin Phase 2 per §B1: add zod; define schemas in src/schemas mirroring the
existing typed interfaces (Hero, Ability incl. the PRAY table, Enemy w/
moves+deathLine, Item, MapDef incl. door indicators, DialogueScript, Quest);
convert src/data modules to satisfy schema inference (z.infer) so compile
types and runtime schemas can't drift. Implement tools/content-validate.ts
(run via "npm run validate", wire into the test script): validates all data,
cross-checks canon counts for everything BUILT SO FAR (4 heroes, Ch.1 enemy
roster from §A7, Pray weights sum 100, every dialogue id referenced by
maps/cutscenes exists, no TODO/placeholder/lorem strings — §B4). Update
ADR-005 status to superseded.
Done when: deleting any enemy from data fails `npm run validate` loudly,
naming exactly what's missing.
```

## Prompt S6 — Save slots & Continue (Bible Prompt 22, adapted)

```
[Standard Header]
Extend saves to 3 slots + 1 rolling auto-backup per §A4.3/Prompt 22 (keep
localStorage for now — IndexedDB swap is a later hardening prompt; design the
storage behind a small interface so the swap is a driver change). Calling Dad
asks which slot on first save, then reuses it; Title gains a SaveSlots scene:
slot summaries (name, level, location, playtime, embers — playtime clock
needs wiring into GameState.update). Corruption detection: bad JSON falls
back to the backup with an in-voice apology from Dad.
Done when: three parallel playthroughs coexist; yanking a slot's JSON mid-
string still continues from backup.
```

## Prompt S7 — World art pass 2 (tiles & juice)

```
[Standard Header]
Sprite-engine quality pass on the WORLD to match the v2 characters (ADR-009;
characters are done, don't touch them): interior wood floor that reads as
planks not bricks; grass auto-edges where grass meets path corners; 2-3 tree
sizes + a pine; window glow at night; drugstore/arcade interiors get their
own props (shelves, counter, cabinet arcade machines with tiny marquees).
Add juice per Prompt 39's list: hit-flash already exists — add screen shake
scale on SMAAASH (done), Ember pickup sparkle particles, footstep dust puffs
when running, door-transition whoosh. Verify every new texture in Sprite Lab
page 3.
Done when: a side-by-side before/after of Otterbrook looks one full
generation better and the palette check (structural, ADR-002) still holds.
```

## Prompt S8 — Capacitor & Android APK (Bible Prompt 41)

```
[Standard Header]
Add Capacitor 6 and generate the android/ project per Prompt 41:
landscape-locked, immersive fullscreen, safe-area insets for the touch UI,
app icon + splash from the title meteor art (export from the sprite engine
at build time), keep-awake during play, back-button = B, localStorage
persistence flagged durable. Document the debug-APK build steps in
docs/RELEASE.md (keystore generation documented, key NOT committed). Verify
the Gamepad API works in the WebView with a Bluetooth controller on a real
device — log results in docs/QA.md.
Done when: meteor-falls-debug.apk installs and plays the full slice on an
Android phone with touch and a paired controller.
```

---

After S8, return to the Bible's Part C order: Chapter 2 (Prompt 28) onward,
with the balance sim (Prompt 37) once two chapters exist to measure.
