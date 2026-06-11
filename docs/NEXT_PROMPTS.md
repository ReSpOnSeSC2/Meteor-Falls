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
beats (a patrol fight, Mia's join, PRAY from her command row by tap,
answering Mom's payphone), then the S4 loop by tap alone: buy at STARMART
(pick() rows are tap zones), withdraw at the ATM (dialogue ask rows), call
Mom from the contact list.
Done when: meteor-falls-debug.apk installs and Chapter 1 plays to
ch1_complete on the phone with touch alone — including one shop purchase
and one ATM withdrawal — and again with a paired controller.
```

## Prompt S9 — Quest engine & the first callers (Bible Prompt 26 + §A10 #1–3)

```
[Standard Header]
Implement the quest system: multi-step objective state machines, a JOURNAL
page in the S3 menu (in-voice summaries, map markers OFF — EB didn't hold
hands), reward granting, and the CALLER ledger appended to the save (this
is the finale's fuel; it's the first REAL new save field since v2 —
REGISTER the v2→v3 step in engine/migrations.ts per ADR-015/016, never
spread-merge). ADR-014's flag-gated NpcDef/PropDef (ifFlag/unlessFlag) are
available for quest-state NPCs, and S5's Quest schema validates the data.
Author and wire quests #1–3 end-to-end: Biscuit, Come Home (sniff-clue
trail across 3 screens); Mail Must Move (5 doors, one guarded by the
Runaway Lawnmower); Lemonade Empire (Ana & Vivi supply run — the lemonade
item and stand exist; the infinite-free-lemonade reward gates on the
quest flag). Each completion records its §A10 caller (Mrs. Pemmel, Mr.
Plummer, Ana & Vivi) with a one-line phone quote in §A11 tone. Quest
dialogue may land the first natural consumer of {coolthing} — don't force
it, but it's live.
Done when: all three are completable on a fresh save AND after
ch1_complete (zero missables — canon; the flag is set by Mom's payphone
call, ADR-014); the journal shows phone icons for earned callers; the
ledger survives a save/load round-trip through the migration registry; the
ADR-008 bot can finish one quest end-to-end.
```

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
persists on the save via the migration registry (ADR-015 pattern — ride
the same v3 step family as S9's ledger or add the next).
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

---

After S11, Chapter 1 is genuinely complete — name entry through ch1_complete
with quests, arcade, revival, and picnics all live. Then return to the
Bible's Part C order at Prompt 28 (Chapter 2) — Puerto Sol and Valle Dorado
inherit ADR-012, the §B4 city tests, AND the S4 shop pattern (a ShopDef +
a keeper NPC per town buys the whole flow) automatically — and run the
balance sim (Prompt 37) once two chapters exist to measure, as planned.
