# NEXT_PROMPTS — continuing the build from here

State as of these prompts: Phase 0–1 engine + ALL of Chapter 1 are done
through S2 (commit `c99d676`; see DECISIONS.md ADR-001..014). A fresh save
plays name entry → 2AM → the Tick → the 6:15 → the Department → the
PRODUCTIVITY LOCK → Faye's join → the Manager → Mom's payphone call →
ch1_complete, with a real two-hero party (conga + angels), Pray as a
top-level battle command, and 62 green tests. Maps are code-grids (ADR-004),
audio is the synth (ADR-006), data is typed TS (ADR-005 — Zod lands in S5).
Work through these in order, one prompt per session, per the Bible's
Appendix rules (review the diff, run the checks, commit).

Every prompt starts with the Standard Header:

```
Read docs/GAME_BIBLE.md fully before doing anything. It is canon — never invent
content that contradicts it, never use placeholder/mock data for anything it
defines. Follow repo conventions in docs/DECISIONS.md and append any new
architectural decision you make to it. TypeScript strict, no `any`.
```

---

## Prompt S3 — Full pause menu & equipment (Bible Prompt 7 + 19)

```
[Standard Header]
Replace the interim pause menu (OverworldScene.pauseMenu — its Status page
hardcodes Rex and Goods feeds only him, but the party is genuinely two
heroes now, ADR-014) with the EB command menu per Bible Prompt 7:
Items (per-hero 14-slot bags + shared key items — migrate the shared
GS.data.inventory to per-hero with a REAL v1→v2 migration registry, folding
ADR-013's deserialize spread-merge backfill into it; the registry grants
Faye her Hand-Me-Down Pan when faye_joined — she canonically took it back
off the intake shelf — and the join scene grants it on future saves),
Status (full §A3 stat sheet per hero incl. Guts/Vibe/Luck and DOWN state —
it reads HeroState.name, so custom names appear free),
Vibe (ability list w/ PP costs, greyed when unusable; Pray stays a battle
command per ADR-014, not a menu vibe),
Equip (weapon/body/arms/other slots with the "Offense up by N!" preview per
Prompt 19; weapons carry a wielder tag — bats are Rex's, pans are Faye's per
§A8 — and BattleScene.heroOffense currently applies the FIRST weapon in the
shared bag to BOTH heroes: make it read the acting hero's equipped weapon),
Setup (keep the M-key + persisted Sound preference from S1), and the
STAR LOCKET screen (embers + Homesong stems behind the real §A4.9 interface;
the interim menu already plays the heartlight cue — keep it).
Glint's Spark's out-of-battle revive (ADR-014) must survive the rewrite.
Touch AND controller navigable (§B4). Unit-test the migration registry: a
v1 save (including a pre-S12 one missing heroNames) loads as v2 with Rex's
bag = the old shared inventory.
Done when: equipping the T-Ball Bat from the menu changes Rex's battle
damage and nobody else's; a renamed Faye's status page shows her chosen
name; old v1 saves still load; every page drives by touch and by pad.
```

## Prompt S4 — Shops, ATM & the cash loop (Bible Prompt 20)

```
[Standard Header]
Open the Otterbrook drugstore and Brickton's STARMART (bldg_starmart) as
real interiors (ADR-004 grid maps + shopkeeper NPCs with one weird obsession
each, §A11): buy/sell UI per Bible Prompt 20 — sell at half,
equip-after-buy prompt (S3's equip), purchases routed into a chosen hero's
bag. Stock §A8 Ch.1 items: T-Ball Bat, Hand-Me-Down Pan (Faye-wield), Corn
Dogs, PB&J, Salt Shakers, Star Cola. Street doors derive their coords from
the jittered facades per ADR-012 (the dos_f1 doorstep pattern) — replace
locked_drugstore/locked_starmart with real doors; the SAVINGS & LOAN stays
locked but gains the ATM at its facade: withdraw/deposit against
GS.data.banked. Keep Dad's deposit flow (pendingDeposit + first-time gift).
Phones gain Prompt 20's contact list — Dad saves; Mom cures Homesick and
asks about {favoritefood} (the resolver and the player's choice are live,
and her payphone call already consumes it per ADR-014). Implement Homesick
per §A4.4 so the cure means something: Rex randomly skips a turn "thinking
about {favoritefood}".
Done when: earn cash on the hill → call Dad → withdraw at the ATM → buy a
T-Ball Bat → "Offense up by 4!" — and a pan bought for Faye lands in HER
bag, equippable only by her.
```

## Prompt S5 — Zod data layer & content validator (Bible Prompt 8, adapted)

```
[Standard Header]
Begin Phase 2 per §B1: add zod; define schemas in src/schemas mirroring the
typed interfaces 1:1 (Hero, Ability incl. the PRAY table, Enemy w/ moves +
deathLine, Item incl. wielder tags, MapDef incl. door indicators and the S2
fields — PatrolDef.countFlag, NpcDef.ifFlag/unlessFlag, PropDef.ifFlag —
DialogueScript, and Quest ahead of S9); convert src/data modules to z.infer
so compile types and runtime schemas can't drift. Implement
tools/content-validate.ts (npm run validate, wired into the test script):
validate all data; cross-check canon counts built so far (4 heroes, the §A7
Ch.1 roster + Boss 1, Pray weights sum 100, three distinct dos_f3 quota
countFlags); and FOLD IN, don't duplicate: maps.test.ts's cross-refs
(legend chars, tile names, door targets, dialogue ids, enemy ids),
newgame.test.ts's typeable-on-grid rule, and text.test.ts's S2 token sweep —
every {...} in dialogue.ts must be a variable src/ui/text.ts actually
resolves, so a typo like {favortefood} fails the build (battle text's
{user}/{e}/{t} is a separate allowed set). Behavioral tests stay vitest
(odometer, pray distribution, carveHoldingRoom, the ADR-012 city sweep).
Update ADR-005 to superseded.
Done when: deleting any enemy, misspelling a dialogue token, or unlinking a
door fails `npm run validate` loudly, naming exactly what broke.
```

## Prompt S6 — Save slots & Continue (Bible Prompt 22, adapted)

```
[Standard Header]
Extend saves to 3 slots + 1 rolling auto-backup per §A4.3/Prompt 22 (keep
localStorage; put storage behind a small interface so the IndexedDB swap
later is a driver change). Calling Dad asks which slot on first save, then
reuses it. Title's Continue currently calls GS.load() directly — replace it
with a SaveSlots scene: summaries show name, level, location, playtime,
embers; render names/locations through vars() (banner pattern:
vars(name).toUpperCase(), ADR-013), and wire the playtime clock so it
actually ticks. Corruption detection: bad JSON falls back to the backup
with an in-voice apology from Dad. Defeat respawn: handleDefeat hardcodes
rex_home — make it the last Dad-save's map/position per §A4.7 (cash-on-hand
still halves; keep ADR-014's interim revive-all until S11's hospitals own
revival), routed through one function S11 will reuse.
Done when: three parallel playthroughs coexist; yanking a slot's JSON
mid-string still continues from backup; wiping inside the Department
respawns at the Brickton payphone when that's where Dad last saved.
```

## Prompt S7 — World art pass 2 (tiles & juice)

```
[Standard Header]
Sprite-engine quality pass on the WORLD to match the v2 characters (ADR-009
— characters are done, don't touch them): interior wood floor that reads as
planks not bricks; grass auto-edges where grass meets path corners; 2-3
tree sizes + a pine; window glow at night; drugstore/STARMART interiors get
shelf/counter props; extend the pass to the Brickton city set and the
Department floors (cubicles, the S2 holding-room set). Give Otterbrook
ADR-012 looseness — broken hedges, jittered furniture from a FIXED seed —
without moving canon buildings or any coordinate a cutscene depends on
(porch trigger, bus stop, lemonade corner, rex_home door). Add juice per
Prompt 39's list: Ember pickup sparkle particles, footstep dust when
running, door-transition whoosh (hit-flash and SMAAASH shake exist).
Verify every new texture in Sprite Lab.
Done when: a before/after of Otterbrook and Brickton looks one generation
better; palette conformance holds by construction (ADR-002); maps.test's
city sweep and the S2 canon block stay green.
```

## Prompt S8 — Capacitor & Android APK (Bible Prompt 41)

```
[Standard Header]
Add Capacitor 6 and generate android/ per Bible Prompt 41:
landscape-locked, immersive fullscreen, safe-area insets for the touch UI,
app icon + splash from the title meteor art (exported from the sprite
engine at build time), keep-awake during play, back-button = B,
localStorage persistence flagged durable. Document debug-APK build steps in
docs/RELEASE.md (keystore generation documented, key NOT committed). On a
real device, log results in docs/QA.md: the Gamepad API over Bluetooth in
the WebView, and a TOUCH-ONLY smoke of the fresh-player path — name entry
first (it's the first thing a fresh Android player touches; cells/buttons
are tap-wired, verify no keyboard assumptions slipped in), then the S2
beats: a patrol fight, Faye's join, picking PRAY from her command row by
tap, answering Mom's payphone.
Done when: meteor-falls-debug.apk installs and Chapter 1 plays to
ch1_complete on the phone with touch alone, and again with a paired
controller.
```

## Prompt S9 — Quest engine & the first callers (Bible Prompt 26 + §A10 #1–3)

```
[Standard Header]
Implement the quest system: multi-step objective state machines, a JOURNAL
page in the S3 menu (in-voice summaries, map markers OFF — EB didn't hold
hands), reward granting, and the CALLER ledger appended to the save (this
is the finale's fuel; register the new fields with S3's migration registry
per the ADR-013 pattern). ADR-014's flag-gated NpcDef/PropDef
(ifFlag/unlessFlag) are available for quest-state NPCs, and S5's Quest
schema validates the data. Author and wire quests #1–3 end-to-end: Biscuit,
Come Home (sniff-clue trail across 3 screens); Mail Must Move (5 doors, one
guarded by the Runaway Lawnmower); Lemonade Empire (Ana & Vivi supply run,
infinite-lemonade reward). Each completion records its §A10 caller (Mrs.
Pemmel, Mr. Plummer, Ana & Vivi) with a one-line phone quote in §A11 tone.
Quest dialogue may land the first natural consumer of {coolthing} — don't
force it, but it's live.
Done when: all three are completable on a fresh save AND after ch1_complete
(zero missables — canon; the flag is set by Mom's payphone call, ADR-014);
the journal shows phone icons for earned callers; the ledger survives a
save/load round-trip; the ADR-008 bot can finish one quest end-to-end.
```

## Prompt S10 — Arcade Legend (§A10 #4 + the STARPORT interiors)

```
[Standard Header]
Open both arcades as real interiors: STARPORT (Otterbrook) and STARPORT II
(Brickton, bldg_arcade2). Build the Arcade Legend mini shoot-'em-up as a
playable cabinet: its own Scene on the existing input layer, ~60-second
runs, EB-goofy enemies, high-score table seeded with "MGR" (the
locked_arcade2 attract-mode gag is canon now — and after S2, so is the
Manager it belongs to). Beating the score asks for 3-letter initials —
reuse the S12 letter-grid pattern (extract it from NameEntryScene if that's
cleaner, keeping the QA recipe in that scene's header true) and prefill
from the first letters of {playername}. Quest #4: beat the score → Champion
Jacket + the arcade-owner caller; replayable score-attack from any save
afterward (Prompt 36's hook lands early). Score persists on the save via
S3's migration registry (ADR-013 pattern).
Done when: the shmup is genuinely fun for 60 seconds, the score + initials
persist on the save, and quest #4 completes with its caller registered.
```

## Prompt S11 — Otterbrook fills out + death/revival/picnic systems (Prompts 23, 25, 27-scope)

```
[Standard Header]
Expand Otterbrook toward Prompt 27's "12+ enterable" with ADR-012
looseness, without moving canon buildings: home interiors (incl. Chad's —
he is conspicuously not home), chapel interior (free 50-HP prayer; the
priest is warm about {faye}'s gift, §A11.4 — played straight, and yes he
uses her chosen name), and a small Otterbrook clinic implementing the full
§A4.7 flow: fallen heroes trail as angels (S2 reality: the angel conga
already renders, ADR-014 — what's left is the economics), pay-to-revive
scaled by level, cure-all, one weird doctor line (he may address {rex} by
name — vars() is everywhere now). End ADR-014's interim revive-all: a wipe
now leaves non-leaders down as angels, routed through the single respawn
function S6 established (last Dad-save); Glint's Spark stays the rare item
path. Replace the picnic half-heal with real Picnic Baskets per §A4.5:
Basic Basket stocked in S4's shops, table-only use ("There's no good spot
here."), blanket scene, SUNNY SIDE +10%/5-battle buff with its little sun
icon. Ch.1's tables already exist (Otterbrook park, hill trail, dos_f2
break room, Brickton park) — keep them, and make the pre-Department one
read as deliberate strategy.
Done when: wipe → angels → hospital revival works in both towns; a
pre-Department picnic is a real strategic ritual; 12+ Otterbrook doors
open.
```

---

After S11, Chapter 1 is genuinely complete — name entry through ch1_complete
with quests, arcade, revival, and picnics all live. Then return to the
Bible's Part C order at Prompt 28 (Chapter 2) — Puerto Sol and Valle Dorado
inherit ADR-012 and the §B4 city tests automatically — and run the balance
sim (Prompt 37) once two chapters exist to measure, as planned.
