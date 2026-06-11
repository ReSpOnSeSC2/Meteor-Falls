# NEXT_PROMPTS — continuing the build from here

State as of these prompts: Phase 0–1 engine + ALL of Chapter 1 are done
through S7 (see DECISIONS.md ADR-001..020). S7 (ADR-019) rebuilt the whole
look to the Mother 2 bar: re-tuned 64-color palette (warm shadows, cream
whites — same 16×4 structure, `px()` unchanged), 3/4-roofed buildings,
telephone-pole streets with curbs/cracks/drains, plank-floor interiors
with a real furniture set, silhouette-true cast (Mia carries her pan),
and 64–96px battle portraits (the Tick is a proper boss). TWO HARD RULES
it added: (1) prop pixmaps that data aims solids/door zones at keep their
EXACT dimensions and internal band positions — restyle inside the bands;
(2) new Brickton content uses its own seeded stream (`seededRng(2077)`)
opened after the 1995 stream's last call, and new solids keep ≥2 tiles
from phones/doors/triggers (poles are visual-only). Tree variety is
`treeSprite(x,y)` hashing — positions and the shared solid rect are canon.
Juice landed: porch glows at night, Ember sparkles, run dust, door whoosh.
S7b (ADR-020, user art direction) pushed true 2.5D — roof-dominant houses
(plane runs into the wall band, door rects untouched), wall-cap thickness
on interior walls, city side-returns, bosses at battle y=97 — and made the
SIX ANTI-GENERATION RULES binding for all future art: flat surfaces w/
clustered deliberate detail (no scatter on ground/bodies), shadows never
outlined (`Pixmap.shadowUnder` after `outline()`), big curves are
hand-authored runs (`Pixmap.contour`), repetition breaks (edge-aware
region tiles — rugs mask like paths via `rug_0..15`; off-center focals),
battle sprites float shadowless, one 2px-cluster dither seam per tone
transition (checker only where EB itself uses it). Read ADR-020 before
drawing ANYTHING new. S7c (ADR-021) rebuilt Biscuit/Glint/the angels,
added the `CharacterSpec.detail` one-off hook (2-6px, never extends the
silhouette, never sees 'left'), and per-hero mourning angels
(`angel_<id>` w/ plain-`angel` fallback); "light after outline" joined
"shadow after outline" as the rule-2 idiom. S7d (ADR-022, user review)
rebuilt the cast CONSTRUCTION: hand-authored skull-dome span tables
(SKULL_FRONT/SKULL_SIDE per build — never chamfer a rect), hair as
drawn mass per style, weighted 2-column garment shading, and per-id
`eyes`/`mouth` face styles across all 24 — variety is a spec field now.
ADR-009 metrics, 24x32 frames, sheet order, and standFrame() remain
law. Sprite Lab shows everything; `.shots/` holds the side-by-sides
(`s7c_*`, `v6_*`). INPUT (ADR-024): UI promise-polls read justPressed
via `everyFrame(scene, cb)` from ui/windows.ts — NEVER a 16ms Clock
timer (drops presses on >60Hz displays); keydown/touch presses latch in
the InputBus so sub-frame taps land; `pump(frames, dtMs)` simulates
120Hz for responsiveness checks. A fresh save plays name entry →
2AM → the Tick → the 6:15 → the Department → the PRODUCTIVITY LOCK → Mia's
join → the Manager → Mom's payphone call → ch1_complete — and the §A9 cash
loop is real: winnings pend until Dad banks them, the ATM at the SAVINGS &
LOAN facade moves them to cash on hand (`GS.withdraw/deposit`, clamped +
conserving), and the Otterbrook drugstore + Brickton STARMART sell the §A8
Ch.1 stock. ShopScene runs over a paused world ('mf-shop-closed'); shop
data is `SHOPS` in src/data/shops.ts; keepers open shops via `NpcDef.shop`.
Buying routes into a CHOSEN hero's bag (`GS.addItem(id, heroId)`,
hands-full handled); selling is half price (`sellPrice`); the
equip-after-buy prompt is the SAME confirmEquip the menu uses — the list
widget + "Offense up by N!" preview/confirm live in **src/ui/pick.ts** now:
reuse them, never reimplement. Star Cola is the first PP item
(`ItemDef.ppHeal`, kind 'pp') wired into menu Use and battle Goods. Phones
are contact lists (Dad saves + deposits + first-time gift; Mom asks about
{favoritefood} and cures Homesick on either call direction). Homesick is
the flag `rex_homesick` — `contractHomesick` (8% per victory) /
`homesickSkips` (50% per turn) in battle/formulas.ts, HOMESICK tag on
STATUS, no migration needed (flags ride the save). Cross-map doorsteps
derive from the jittered facades via `doorstepOf()` in maps.ts (ADR-012 —
computed, never hardcoded; new `rng()` calls before existing ones in
buildBrickton would shift the 1995 layout — don't). The party is two heroes
with per-hero 14-slot bags and wielder-tagged equipment, START opens the
full EB menu, saves are v2 behind the migration registry
(engine/migrations.ts — REGISTER new save fields there), and the Locket
layers Homesong stems. Maps are code-grids (ADR-004), audio is the synth
(ADR-006). S6 (ADR-018): saves are a SLOT FAMILY in **engine/saves.ts** —
3 slots (slot 1 = the old single key) + ONE rolling auto-backup written
before every overwrite (envelope remembers its source slot; recovery never
crosses playthroughs), all behind the 3-call `SaveStorage` interface
(localStorage driver now, §B1 IndexedDB later = new driver; tests inject a
Map via `GS.bank`). `GS.save/load/hasSave` are GONE — use
`saveTo(slot)/continueFrom(slot)/anySave()/slotPeeks()/respawnPoint()`.
`GS.activeSlot` is runtime-only: Dad asks "Which notebook?" on his FIRST
save (dialogue `dad_slot_ask`), then reuses it; Title's Continue is
**SaveSlotsScene** ('saveslots', bot recipe in its header) whose panels are
DERIVED from the blobs — no summary field rides the save, the registry is
still v2. Corrupt slots (bad JSON or the loud unknown-version throw) fall
back to the backup with Dad's apology and heal in place. The playtime
clock ticks (main.ts PRE_STEP while the overworld is active/paused; H:MM
via `fmtPlaytime`). Defeat respawns at the last Dad-save via
`GS.respawnPoint()` (rex_home only when never saved; S11 reuses it).
`vars(text, data?)` takes an optional blob for per-slot rendering — bare
`.map(vars)` is a type error now. `Dialogue.justReleased(now)` guards the
overworld against the same-frame ask→interact re-fire (latent since S4's
menus — don't reintroduce raw `justPressed` interaction triggers). S5 (ADR-017): data types are `z.infer`'d from **src/schemas**
(zod stays out of the bundle — `import type` only) and
**tools/content-validate.ts** is the gate — `npm run validate` is the
first leg of `npm test` AND `build`. It owns ALL existence/cross-ref
truth: schema parses, canon manifests (§A7 roster w/ HP pins, §A8 shop
shelves, PRAY table, quota countFlags), doors→maps, dialogue ids, enemy
ids, stock ids, the {token} sweep against `TEXT_VARS` (src/ui/text.ts —
add variables THERE; battle text also allows `BATTLE_FILL_TOKENS`
{user}/{e}/{t}), typeable-on-grid, and the §B4 placeholder sweep. Vitest
(107 green) keeps behavior only. ADDING CONTENT = extending the validator's
canon manifests in the same commit, or validate fails naming the gap; the
Quest schema already waits in src/schemas for S9, which must wire QUESTS
into the validator's parse list (S6's slot/backup/respawn suite lives in
engine/saves.test.ts).
S8 (ADR-026): the Capacitor 6 shell wraps the SAME vite build — `npm run
android:apk` → meteor-falls-debug.apk; back button = `INPUT.tapBtn('B')`
(edge-only latch), insets reach UIScene via `gameInsets()`, icon/splash
render FROM the engine on every sync (`art:appart`, git-ignored). The
docs/QA.md device table is the USER's phone sign-off — leave its boxes
open. S9: quests #1–3 (§A10) are LIVE end-to-end — engine/quests.ts derives
quest state from flags (`startFlag`/objective flags/`doneFlag`, schema field
`startFlag` added in S9), completion routes rewards through GS.addItem with
hands-full BLOCKING (zero missables), and freezes the §A10 CALLER record
onto **`GS.data.callers` — save v3** (registered v2→v3 step; old saves load
with an empty ledger, their true history). §A6 Ch.8's finale iterates that
ledger in earned order. The JOURNAL is a MenuScene page (command order is
now ITEMS STATUS VIBE EQUIP JOURNAL LOCKET SETUP) on the shared pick()
widget — which gained optional per-row `icons` (phone icon = caller earned).
Quest world-wiring is ALL data gates: SignDef + PropDef gained
ifFlag/unlessFlag, SpawnerDef gained unlessFlag (the §A10 #2 lawnmower
guard), sniff clues are gated signs + `paw_prints` ground markings (ADR-020
rule-2 idiom: markings never outlined), and ask-beats that arm same-map
gates MUST fade-restart (ADR-014 — Pemmel's and Plummer's do). Items gained
kinds `charm` ('other' slot — Lucky Collar, `luck` field, `heroLuck`/
`equipLuckDelta` in formulas, charm branch in confirmEquip's preview) and
`valuable` (Fresh Stamps $240 — §A10 "sell high", the drugstore pays $120;
the lemonade supplies). The validator pins the §A10 #1–3 manifest (names,
flags, callers, effects, rewards — extend it in the same commit as any new
quest) and sweeps quest strings through TEXT_VARS ({coolthing} found its
first consumer in the twins' ask). Bot recipe: engine/quests.ts header.
QA driver: `window.pump/key/holdKey/shot` + `mfGS` + `mfMakeHero` (canon
heroes for mid-game party setup); bot recipes live in the scene headers.
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

## Prompt S10 — Arcade Legend (§A10 #4 + the STARPORT interiors)

```
[Standard Header]
Open both arcades as real interiors (the S4 interior pattern: ADR-004 grid
floating in void, facade doors derived via doorstepOf(), door zones below
the collision floor per ADR-011): STARPORT (Otterbrook) and STARPORT II
(Brickton, bldg_arcade2). Build the Arcade Legend mini shoot-'em-up as a
playable cabinet: its own Scene on the existing input layer, ~60-second
runs, EB-goofy enemies, high-score table seeded with "MGR" (the
locked_arcade2 attract-mode gag is canon now — and after S2, so is the
Manager it belongs to). Beating the score asks for 3-letter initials —
extract the S12 letter grid from NameEntryScene for sharing the way S4
extracted pick/confirmEquip into ui/pick.ts (keep that scene's header QA
recipe true) and prefill from the first letters of {playername}. Quest #4:
beat the score → Champion Jacket + the arcade-owner caller; replayable
score-attack from any save afterward (Prompt 36's hook lands early). Score
persists on the save via the migration registry (ADR-015 pattern — v3
SHIPPED with S9's ledger, so the score REGISTERS the v3→v4 step; old
saves backfill an empty score table).
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
uses her chosen name), and clinics implementing the full §A4.7 flow — a
small Otterbrook practice plus Brickton General behind its real door at
last (locked_hospital retires the way locked_drugstore/locked_starmart did
in S4; the nurse already has opinions): fallen heroes trail as angels (S2
reality: the angel conga already renders, ADR-014 — what's left is the
economics), pay-to-revive scaled by level, cure-all incl. clearing
rex_homesick for a fee Mom would not approve of, one weird doctor line
each (§A11). End ADR-014's interim revive-all: a wipe now leaves
non-leaders down as angels, routed through the single respawn function S6
established (last Dad-save); Glint's Spark stays the rare item path.
Replace the picnic half-heal with real Picnic Baskets per §A4.5: add the
Basic Basket to ITEMS and stock it in both SHOPS (src/data/shops.ts — the
S4 buy flow inherits it for free), table-only use ("There's no good spot
here."), blanket scene, SUNNY SIDE +10%/5-battle buff with its little sun
icon. Ch.1's tables already exist (Otterbrook park, hill trail, dos_f2
break room, Brickton park) — keep them, and make the pre-Department one
read as deliberate strategy.
Done when: wipe → angels → hospital revival works in both towns; a
pre-Department picnic is a real strategic ritual; 12+ Otterbrook doors
open; a basket bought at STARMART restores the party at the Brickton park
table.
```

## Prompt S12 — EVERY DOOR OPENS (the interior program + city vocabulary)

```
[Standard Header]
Design law, then content. LAW: no decorative buildings — every facade the
player can walk to either opens or is a labeled ruin with a reason (the
§A11 locked_* lines retire one by one as interiors land). ENFORCE it in
tools/content-validate.ts: every prop with a door must lead to a map with
≥1 interactable (npc/sign/phone/atm/shop/gift); every map tagged
settlement must have ≥60% of its door-bearing facades OPEN by Prompt 43.
A new INTERIOR PAYLOAD TAXONOMY drives authoring — every interior gets
≥1 payload from category A plus ≥1 from B–L, never two "important" in one
block (pacing). Categories (seeds → ~120 concrete instances; chapter
sessions pull from here instead of inventing):
 A. §A11 bit — one-obsession NPC, editorializing sign, running gag
    (Mr. Click ambush spots; the sidewalk critic reviews interiors now).
 B. Economy — shops, delis (basket crafting), trade-in collector (buys
    'valuable' kind at FULL price: the stamps gag pays out properly once
    per region), busker tips, vending machines.
 C. Recovery — hospitals (LARGEST building in every city — Brickton
    General grows to 3 stories in this pass), chapels, tea rooms, HOTELS
    (two-story template: lobby + upstairs hall of rooms; a paid bed =
    full restore + Sunny Side breakfast, the picnic system's indoor twin).
 D. Quest nodes — givers, delivery doors, clue rooms (the S9 gated-sign
    pattern IS the API).
 E. Collection — gift boxes (S9b sprites), libraries with readable §A11
    books, photo spots.
 F. Systems tutors — the gym teaches Guts (battle tutor fight), the
    STARPORT teaches the shmup (S10).
 G. World-building — museum wings, the mayor's office, a radio station
    broadcasting the chapter's rumor (foreshadow channel).
 H. Secrets — basements, rooftop access (city buildings gain a roof map
    pattern), one vault per region with a silly combination.
 I. Ledger callbacks — visit a completed quest's caller at home: they are
    ON THE PHONE telling someone about you (reads GS.data.callers — S9's
    ledger powers ambient warmth before the finale cashes it in).
 J. Residences — every home has a family with one §A11 dynamic, a fridge
    (1 free food/day-equivalent: gated on a per-region flag), mail you
    delivered visible on their table after quest #2.
 K. Civic clutter — bus stations (see S13), post office (Plummer's HQ),
    the SAVINGS & LOAN finally opens (teller line beats the ATM rate by
    $0 — §A11).
 L. Chapter set-pieces — one per chapter, big interiors (the Department
    was Ch.1's; Ch.5's palace + cinema are canon's).
CITY VOCABULARY (spritegen): hotel facade (2-story, awning + ROOMS sign),
hospital tower (3-story, the block anchor), apartment walk-up (the
Brickmore OPENS: stair core + two flats), rooftop tile family. Brickton
grows VERTICALLY here (more upperRows variety on the existing grid — the
1995 stream stays byte-identical; new content on rng3).
Done when: validator enforces the no-decorative-doors law; Brickton +
Otterbrook hit 100% open facades; the taxonomy doc lives at
docs/INTERIORS.md with every category seeded; hotel/hospital/walk-up
templates render in Sprite Lab; one ledger-callback interior is live.
```

## Prompt S13 — STATIONS & WHEELS (bus, bike, car — and the travel UI)

```
[Standard Header]
Formalize getting around WITHOUT touching canon's spine: §A5's chapter
vehicles stay scripted story beats, and Teleport α/β (Ch.4/Ch.6) stays THE
global fast-travel. This prompt adds local pace + money sinks + ritual:
 1. BUS STATIONS: the 6:15's stops become small interiors (bench, schedule
    board in §A11 voice, the driver's obsession canonized) — boarding
    moves indoors; the bus_interior scene stays for first rides; a fare
    ($2) starts mattering. The bus network = same-chapter towns only.
 2. BIKE (~$180 at OTTERBROOK DRUG, of course it sells bikes): overworld
    speed ×1.35 outdoors-only, with its own 2-frame ride pose per facing
    drawn INSIDE the 24×32 contract (the S9b run-cycle precedent: new
    anims, same sheet metrics — this pass MAY add sheet rows and if it
    does, it supersedes ADR-009's frame-count law in its own ADR with
    standFrame() preserved). B-run on foot stays the dungeon answer —
    no bikes indoors ("NO BIKES. — the floor").
 3. CAR (Ch.2+, "PRE-LOVED AUTOS" lot in Brickton, ~$1400): unlocks a
    REGION ROAD MAP UI — pick a same-chapter town, play a 3-second
    driving vignette (the bus-window pattern reversed), arrive. It is
    Teleport for people who fear Teleport, priced like a boss reward.
 4. AIRPORT (Ch.3+, one per region once Lucille exists): the §A5 legs get
    a ticket-counter UI skin — destination board, boarding pass gag,
    Lucille's flight vignette. Strictly chapter-gated: flying never skips
    the Ember trail; post-Ch.4 it coexists with Teleport as the themed
    long-haul (some players ride for the vignettes).
Done when: fare/bike/car costs satisfy §A9's economy (a car is a real
choice against gear); all three UIs drive by touch+pad+keys at the
ADR-024 regime; the validator knows stations/vehicle gates; Teleport
remains strictly better post-Ch.4 (vehicles are flavor + early-game).
```

---

After S11, Chapter 1 is genuinely complete — name entry through ch1_complete
with quests, arcade, revival, and picnics all live. S12–S13 then make the
world dense and navigable. The "big city like New York" ask maps onto canon:
**Chandrapore (Ch.5, Prompt 31) is the game's biggest city** — three
ADR-012 districts, 4–5-story facades, the palace/cinema/bazaar sprawl —
and Brickton's vertical growth in S12 gives the US chapter its skyline.
Then return to the Bible's Part C order at Prompt 28 (Chapter 2) — Puerto
Sol and Valle Dorado inherit ADR-012, the §B4 city tests, the S4 shop
pattern, AND the S12 interior taxonomy automatically — and run the balance
sim (Prompt 37) once two chapters exist to measure, as planned.
