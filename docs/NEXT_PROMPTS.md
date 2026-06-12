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
the lemonade supplies). The validator pins the §A10 #1–4 manifest (names,
flags, callers, effects, rewards — extend it in the same commit as any new
quest) and sweeps quest strings through TEXT_VARS ({coolthing} found its
first consumer in the twins' ask). Bot recipe: engine/quests.ts header.
S10 (ADR-029): BOTH STARPORTS ARE OPEN (locked_arcade/locked_arcade2
retired the S4 way; the Otterbrook park hedge shortened to clear the new
doorstep) and the ARCADE LEGEND shmup is live — **ArcadeScene** ('arcade',
the ShopScene launch pattern, 'mf-arcade-closed'), ~60s score-attack with
SCRIPTED waves from **src/data/arcade.ts** (deterministic by design: the
ADR-008 bot reproduces scores exactly; cabinet strings = ARCADE_TEXT,
validator-swept, {playername}/{coolthing} live). The score table is
**save v4** (`GS.data.arcadeScores`, registered v3→v4 step backfills MGR's
lonely 3000 — the Manager's row, canon). The ADR-013 letter grid lives in
**src/ui/lettergrid.ts** now (NameEntryScene delegates; recipe unchanged) —
initials entry reuses it, prefilled from {playername}. Quest #4 runs on the
S9 engine (giver Sal, the new `arcadeOwner` cast member — he keeps score of
everything); the CHAMPION JACKET is the first 'body' armor (`ItemDef.
defense`, `heroDefense`/`equipDefenseDelta` in formulas, battle + STATUS
read through it, confirmEquip previews "Defense up by N!" — the slot-aware
pattern future §A8 armor inherits). The cabinet stays endlessly replayable
from any save; the quest completes once.
S11 (ADR-030/031): THE LIVING BATTLE — party cards carry per-hero 32×32
BATTLE BUSTS (src/spritegen/busts.ts, the ADR-021 variant pattern;
BUST_FRAME is the 16-state contract) rising MOTHER-style from BEHIND each
box (depth DEPTH_UI−1, name centered, drums beside labels — drums NEVER
move or hide, and every fx layer renders BELOW DEPTH_UI). `AbilityDef.fx`
is REQUIRED and resolves into **src/battle/fxRegistry.ts** (Phaser-free;
validator + fxRegistry.test.ts enforce BOTH directions; battle items
resolve via `itemFxKey`; kind-'system' keys incl. `summon_flash`/
`phase_swap` await Prompt 15's phase-machine). **battle/fxTimeline.ts**
(events+spans on dt, `Pool`, stagger) + **battle/fx.ts** (pooled
particles/rings/bolts/floods/popups/tether) advance at the text's exact ×4
under held A/B — tweens only for pure cosmetics, no dice in fx. The full
§A4.8 status set is LIVE both sides (crying/asleep/paralyzed/hushed/
sunburn + shield/mirror; rolls in battle/formulas.ts) and renders ON the
cards via **battle/bust.ts** BustView (edge-tint, droplets, Zzz, sparks,
muzzle shimmer, the Homesick thought-bubble). Status abilities work
(Hypno/Flash/Brainjam/Shield/Mirror/Healing α cure/γ revive/Magnet sip/
Spy stamp/rockets flat-pierce); Milo's command row is GADGETS; ally
targeting = hand over the cards. THE FIRST HERO IS CANONICALLY **JAY**
(ADR-031, user decree — ids stay `rex`, {rex} resolves live, 'Rex' is his
first don't-care). North-wall interior door mats anchor flush to the wall
(facing-'up' branch in buildDoorMarkers). New-ability rule: fx key +
registry row in the SAME commit or validate fails naming it. The S11
gauntlet recipe lives in BattleScene's header (incl. the pad-mute trick —
a physical gamepad trumps any bot script).
QA driver: `window.pump/key/holdKey/shot` + `mfGS` + `mfMakeHero` (canon
heroes for mid-game party setup) + `mfBattle.qa()` in-battle; bot recipes
live in the scene headers.
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

## Prompt S11 — THE LIVING BATTLE — ✅ DONE 2026-06-11 (ADR-030/031)

Shipped: per-hero 32×32 battle busts rising MOTHER-style from behind the
party cards (BustView, src/battle/bust.ts — derived state only), the FX
registry (`AbilityDef.fx` schema-required; validator fails both
directions), pooled timeline engine (battle/fxTimeline.ts + fx.ts, ×4
under held A/B), the §A4.8 status set live on both sides and rendered ON
the cards, the Tick's visible tether + salt sever, pray as six events,
Milo's GADGETS row, ally targeting, ~30 synth presets, and — by user
decree mid-session — the first hero is canonically JAY (ADR-031; ids stay
`rex`) and north-wall interior door mats sit flush against the wall.
Gauntlet log + shots: docs/QA.md S11 section, `.shots/s11_*`. The original
prompt is kept below for the record.

```
[Standard Header]
S11 — The Living Battle pass (Prompt 12/14 presentation, user direction:
"each character in an active UI like a real character" — ADR-001..029).
THE PARTY STRIP BECOMES PARTY CARDS. Each hero's battle box grows a
portrait pane holding a NEW per-hero BATTLE BUST sheet (≈32×32, generated
from CharacterSpec the way angels are — ADR-021's variant pattern, ADR-022
construction, ADR-025 hairTones; overworld 24×32 sheets stay untouchable
law). Bust states, all driven by HeroState + battle events, nothing stored:
idle breathing ×2 · act lunge (Bash) · cast ×2 (arms raised, Vibe glow
between the hands) · pray (Mia: hands together, eyes closed — §A11.4,
played straight) · gadget fiddle (Milo) · item use (rummage + munch/drink)
· guard brace · hurt flinch (card shakes, bust recoils 1 frame) · LOW HP
nervous loop while the odometer is mid-roll to 0 (ties into Prompt 13's
urgency pitch — the card sweats while the meter races) · DOWN slumps then
fades to the hero's angel_<id> sprite floating beside the card (§A4.7) ·
revive/heal glow · victory cheer. Status conditions render ON the card:
Sunburn red edge-tint, Crying droplets, Asleep Zzz drift, Paralyzed
sparks, HUSHED muzzle shimmer, Homesick thought-bubble of {favoritefood},
Mushroomized later. HARD LAW: cards may never cover or delay the rolling
odometer (Prompt 13 is the soul) and all choreography fast-forwards under
held A/B exactly like text (ADR-010) — wire FX timelines to the same
skip state.
EVERY ABILITY GETS A FACE. New `battle/fx.ts`: composable, OBJECT-POOLED
primitives (particle bursts, expanding rings, beams, screen flashes,
camera shakes, sprite tint/flash, palette-cycle pulses on the psychedelic
bg) composed into named effect TIMELINES that advance on dt via
everyFrame (ADR-024; pump-friendly so the ADR-008 bot replays them —
tween use only for pure cosmetics). AbilityDef gains a required `fx` key
(schema + z.infer per ADR-017) resolving into an FX REGISTRY; `npm run
validate` fails naming any ability whose fx key is unregistered, both
directions. Author distinct effects in the EB register: Vibe Surge α→Ω
(starburst rings that escalate per tier), Fire (rolling flame wave),
Freeze (crystal lattice + shatter), Volt (zigzag bolts), Lifeup (green
sparkle rain), Shield/Mirror (hex barrier snap), Hypno (spiral), Flash,
Bottle Rockets (arcing projectile + payload burst, Multi = volley), Spy
(scanline sweep + revealed-stats stamp), Salt Shaker (thrown arc — the
anti-Tick salt visibly breaks the latch, §A6), food/cola (sparkle/fizz),
Glint's Spark (porch-light warmth), and PRAY AS SIX DISTINCT EVENTS —
Miraculous floods the screen warm with choir tones, Wonderful/Good scale
down, Nothing is a single mote that tries anyway (§A11.4: hopeful even on
Nothing), Strange misfires onto a random combatant, Backfire's soft flare
dozes an ally. Enemy-side: per-element impact bursts, hit-flash + flinch
on the target sprite, multi-target sweeps stagger per enemy, SMAAASH!!
keeps its comic burst + shake, floating damage/heal popups (the S10
popFoe idiom), death dissolves per ADR-020 (battle sprites float — no
shadows, light never outlined), and the Titanic Tick's latch/drain gets
a visible tether the salt severs. Enemy moves reuse the element/impact
vocabulary; the Manager's summons and boss phase swaps (Prompt 15 data)
get timeline hooks for the phase-machine to call.
AUDIO: extend ADR-006 synth presets per element + pray tiers; ducking
under jingles unchanged.
QA: vitest for timeline math + registry completeness mirrors; scripted
test battles (Prompt 14's harness) exercising every ability class, every
status tick, a full wipe (cards → angels), and a mortal-roll save-by-
victory with the nervous loop visible — run via the ADR-008 driver at
pump(n, 8.33) one-frame taps; document the recipe in the scene header;
log the pre-flight in docs/QA.md and add ONE device row (leave existing
boxes open). 60fps: pool everything (Prompt 42 will profile this scene
hardest). Append the ADR.
Done when: a Ch.1 battle reads like a cartoon — every command visibly
performed by the caster's card and answered on the enemy, every spell
distinguishable with eyes only, statuses legible at a glance, the
odometer never upstaged, the whole show skippable, npm test green with
the fx registry enforced, and the bot finishes its scripted gauntlet.
```

## Prompt S11b — THE BATTLE STAGE (battlers act, weapons render, wear states, real doors)

```
[Standard Header]
S11b — The Battle Stage pass (continues ADR-030's Living Battle; user
direction: "the character moves and does like a back swing looking at
the bird — animations for each ability", "animations for every
equippable item and every psi ability", "enemies show damage as they
near death — same for our characters: tattered, breathing hard",
"any entry way needs a door, not just a mat", "shield needs clearer
target UI and a better animation", "a huge green SMAAASH with Mother-3
spam-A multi-hits" — ADR-001..031). Full production quality, no mock
data, every new registry gated both directions like ADR-030's fx gate.

THE CASTER TAKES THE STAGE. New per-hero BATTLER sheets in
src/spritegen/battlers.ts — the ADR-021 variant pattern off the SAME
CharacterSpec (ADR-022 span-table construction, ADR-025 hairTones; the
24×32 overworld and 32×32 bust sheets stay untouchable law): a full-body
REAR-3/4 view (~28×36, seen from behind-left with enough face turned to
read — the MOTHER framing, looking UP at the bird). When a hero acts,
their battler steps up from their card onto the STAGE (the field band
between cards and the enemy row, fx depth — below DEPTH_UI, never over a
drum), faces the target, performs the ability's choreography, and steps
back; BustView holds an 'away' state meanwhile so card and stage never
pose-fight. Stage anims advance on the ADR-030 timeline clock — the one
×4 skip state (ADR-010), pump-replayable (ADR-008), tweens for nothing.

WEAPONS ARE REAL OBJECTS. src/spritegen/weapons.ts: a WEAPON_ART
registry — EVERY §A8 equippable maps to drawn art (bats: taped shaft;
pans: disc + handle; rifles: stock + barrel; bead loops) sized for the
battler's grip, item-specific by ramp + detail pass (Cracked vs T-Ball
bat read differently, silhouettes never drift). Bash composes the
EQUIPPED weapon into the swing at sheet-generation time: Jay back-swings
HIS bat, Mia winds up HER pan, Milo shoulders the air rifle (aim →
crack → recoil; Bottle Rockets keep the throw-arc), Dorin strikes with
bead-wrapped fists. Body/arms gear RENDERS on battler AND bust torsos
(the Champion Jacket is visible the moment it's equipped — equipment is
never invisible again). The validator gates WEAPON_ART both directions
(an equippable without art / an art row no item claims both fail naming
the gap), and vitest mirrors it. EVERY ability gets stage choreography:
map FX_REGISTRY families → stage anims beside the registry (cast
families raise arms under the Vibe glow, spiral/scan families aim a
gadget, throw_arc lobs, pray kneels hands-together — §A11.4 straight,
food/cola consume on-card); the validator proves every family resolves
a stage anim. No AbilityDef changes — presentation keys off fx.

WEAR STATES, BOTH SIDES. Battle sprites read the drums: enemies redraw
at three authored tiers (full / scuffed <66% / battered <33%) — each
spritegen/enemies.ts draw gains a wear param with DELIBERATE damage per
ADR-020 rule 1 (mailbox dents + flag knocked askew, mower bends a blade
and coughs smoke, cicada's wing glass cracks, the slug's crown chips,
the Smiler's tie loosens as the smile strains, pigeons shed feathers,
the Tick bruises and visibly DEFLATES) — clustered marks, never noise.
Heroes wear down the same way: bust + battler sheets generate the same
three tiers (mussed hair, a cheek bruise, torn sleeve with a hanging
thread, sweat sheen) and below 33% the idle becomes WINDED — faster
breath, heaving shoulders (ADR-030's nervous loop still owns the mortal
roll). Tier swaps key on the DISPLAYED odometer value, never the target
— a mortal roll degrades AS the drum falls. Texture cost: all tiers
generate at boot like everything else (ADR-002); zero per-frame draws
(Prompt 42 looms).

REAL DOORS. A doorway through a wall is a DOOR, not a mat — user law;
mats alone stay legal only for bottom-edge exits. DoorIndicatorSchema
gains 'door': drawInteriorDoor() closed + open variants (tiles.ts —
frame, panel door, brass knob, lit top rail, ADR-019/020 discipline)
mounted IN the wall band above the zone (the S11 mat stays at its
foot); walking in swings it open (closed→open swap + the S7 whoosh +
a short hold) before the transition, closed again on re-entry. Audit
EVERY interior facing-'up' zone (rex_hall ×3 first) and tag it 'door';
the validator enforces the law structurally — an interior facing-'up'
door zone still tagged 'mat' fails naming map and zone. Facades keep
their ADR-019 drawn doors; no canon drift expected (presentation only —
amend the Bible per Appendix rule 6 only if §A4/§B wording shifts).

SHIELD READS LIKE A SPELL. The ally picker becomes unmistakable: the
candidate card LIFTS 2px and glows (gold frame pulse, bust brightens),
the others dim, a "> {name}" tag rides the hand, B backs out — ADR-024
everyFrame polling, tap zones intact. The barrier upgrades: six hex
panels FLY IN from the field corners, lock with a flash + closing ring,
and leave a persistent hex PIP on the card while shield/mirror turns
remain — the first GOOD-status indicator; seat it opposite the §A4.8
ailment row so buffs and ailments never collide on the card.

SMAAAASH, IN GREEN, IN COMBO. The crit banner becomes the show: huge
GREEN comic letters (GRASS ramp, INK outline — the palette law holds)
slam in at 3× with a radial burst and camera shake. And the Mother-3
mash: a SMAAASH opens a COMBO WINDOW (~1.1s; edge-triggered A PRESSES
only — held A still means fast-forward, ADR-010 untouched): every press
in the window lands a follow-up hit (battler re-swings, 25% of the
smash per hit, rising-pitch hit SFX, popup counter "2 HITS! 3 HITS!"),
capped at 3 + Guts/40 (max 8). A ring timer renders under the target at
fx depth. Deterministic inside the window — presses in, hits out, no
dice (ADR-029) — and the total prints as one EB line: "Jay tried the
Casey swing! SMAAAASH!! x4 — 213 damage!"

AUDIO: per-weapon swing whoosh, rifle crack, the combo pitch ladder,
door creak-whoosh, shield panel locks, winded breath tick — ADR-006
presets; ducking under jingles unchanged.

QA: vitest — WEAPON_ART / stage-anim / wear-tier completeness mirrors
(both directions each) + combo math (window, cap, ladder) headless;
the ADR-008 gauntlet extends BattleScene's header recipe at
pump(n, 8.33) one-frame taps, pad muted (the S11 lore): one ability of
every family performed ON STAGE; Bash with bat AND pan AND rifle AND
beads (re-equip via qa()); a combo maxed by scripted taps; wear tiers
forced via qa() drums on BOTH sides, shot at each tier; the shield
picker end-to-end; every rex_hall door opened (shots: closed, mid-open,
arrived). Log the pre-flight in docs/QA.md + ONE device row (existing
boxes stay open). Append the ADR.

Done when: Jay steps up and back-swings his equipped bat at the bird —
Mia her pan, Milo his rifle, Dorin his beads — every PSI, gadget, and
battle item has stage choreography; both sides visibly wear down as
the drums fall; every interior doorway has a door that opens before it
admits you; Shield's target is unmistakable and its barrier locks like
armor; a green SMAAAASH mashes into Mother-3 multi-hits; npm test green
with all three new completeness gates enforced; the bot finishes the
extended gauntlet.
```

## Prompt S12 — THE CAGE — ✅ DONE 2026-06-11 (ADR-033/034)

Shipped: the vacant lot's gate → 'the_cage' venue (PERMIT, the chalked
bracket board, bleacher crowds, two bent rims; sign_lot finally paid off),
the Phaser-free deterministic streetball sim (src/hoops/sim.ts — fixed
8.333ms quanta, per-match seeded rng, outcomes rolled at release, NO
rubber-banding; vitest replays input tapes to byte-equal event logs) under
HoopsScene ('hoops', the cabinet law), both formats off one engine (5v5
four-quarter Classic games with the 24 PERMIT counts out loud + halftime
chalkboard + OTs; 3v3 first-to-21-win-by-2 pickup that pays XP forever),
the SPORT SHEET contract (athletes.ts, 32×40 ×25 frames off CharacterSpec
— ADR-033; opponents get hashed faces in TEAMS jerseys, use-time cached),
the 32-team Classic on **save v5** (bracket + quarter checkpoints +
auto-written notebooks: process death costs at most the quarter in
progress — verified by reload), 31 §A11 entrant fives + the walk-on bench
(Chad guests pre-Milo), rewards through the Prompt-18 flow scaled by
format/depth + seeded drops, and THE STARTING FOUR ('arms' opens:
heroSpeed/heroGuts read-throughs, "Speed up by N!" previews, hands-full
raincheck ledger at PERMIT, zero missables; arms art ships as trinket
icons — ADR-034 amends ADR-032's provisional mapping). Validator: teams/
walk-ons/rewards/venue manifests, three axes verified failing loudly.
196 vitest + the full bot gauntlet in docs/QA.md (3v3 to 21 twice,
byte-identical; Q1 to the horn; death/resume; 8.33ms one-frame taps).
The original prompt is kept below for the record.

```
[Standard Header]
S12 — THE CAGE: 5v5 FULL-COURT streetball in Brickton, with a 3v3
halfcourt pickup mode (user spec: an NBA-2K-grade minigame that stands
alone, 5v5 first-class; ADR-028 maps the "New York" ask onto Brickton,
canon's US city). The S10 cabinet rules govern ALL
minigames from now on (ADR-029): own Scene on the existing input layer,
everyFrame polls (ADR-024), hardware back = B (ADR-026), DETERMINISTIC
under the bot (here: per-match SEEDED injectable rng — the Homesick
pattern — plus timing-deterministic shots; same seed + same inputs =
same final score), endlessly replayable, one-time special rewards,
validator manifests in the same commit (ADR-017), scene-header bot
recipe, QA.md pre-flight + one open device row.
VENUE: the SE vacant lot's fence gains a gate → 'the_cage' map (ADR-004
void grid; a FULL COURT in a chain-link cage — two bent-rim backboards,
painted keys and arcs, bleacher planks, a hand-chalked bracket board —
with the camera following the ball 2K-style; 3v3 pickup plays the near
half). The lot's grid coords are fixed —
any new Brickton street props ride a fresh seeded stream so the 1995
layout stays byte-identical (ADR-016); amend sign_lot: the FUTURE SITE
finally arrived, and it's a basketball cage. Cast: PERMIT (the announcer
— §A11 obsession: he has historically ranked every crossover he has ever
seen) + bench-crowd minis. New ADR for the SPORT SHEET contract: bespoke
≈32×40 multi-frame athlete sheets (dribble idle/run, gather, jumper with
readable RELEASE frames, layup, THREE dunk cinematics, block leap, steal
swipe, celebration) generated from CharacterSpec so the four heroes —
and every §A11 opponent — inherit ADR-022 faces and ADR-025 hair; ball
gets real arc/rim/backboard physics + net ripple frames; ADR-020 rules
bind (deliberate pixels, no scatter, shadows never outlined).
TWO FORMATS at the gate, one engine: 5v5 FULL COURT (the Classic's
format — ten athletes live at 60fps, pool hard; transition offense,
fast breaks, spacing; FOUR 5-MINUTE QUARTERS on a running clock, a
24-second shot clock PERMIT counts out loud, quarter breaks + a
halftime chalkboard beat, 2-minute overtimes until somebody wins) and
3v3 HALFCOURT pickup (FIRST TO 21, win by 2 — the anytime XP run).
Street rules both ways: 1s and 2s (2 behind the arc), check-up after
scores, a sign says CALL YOUR OWN FOULS and nobody ever has. Two buttons, honest (§B1's overlay untouched). OFFENSE: B tap =
DIRECTIONAL pass (nearest teammate in the held d-pad cone — aim your
passes, lead the cutter), B hold = turbo, A hold = gather + SHOT METER
(release grading: too-early / early / GREEN / late — window scales with
shooter stat, distance, contest), A at speed near the rim = contextual
dunk gather (contested dunks can get STUFFED), double-tap a direction =
crossover (ankle-break chance vs defender timing, seeded). DEFENSE: you
hold the defender nearest the ball (auto-switch on drives and passes),
A = timed block jump, B tap = steal swipe (whiff = beaten), B hold =
turbo slide. TEAMMATE AI earns its minutes: runs the lanes, spaces the
arc, cuts when you drive, calls for it when open — per-archetype
tendencies. NO rubber-banding — opponent AI plays archetypes honestly
(rusher, sniper, post bully, ball-hawk) from a TEAMS data table.
THE BRICKTON CLASSIC: 32-team single-elimination, PLAYED 5v5 in full
four-quarter games (≈20–25 min each → the title run is a LONG HAUL of
roughly two hours across 5 rounds, BY DESIGN — note the §A9 time-budget
drift in the Bible amendment: the Classic is optional long-form content
beyond the +3hr side-quest line, built to be left and returned to); the
other 31 teams are EB-goofy data entries (the Pigeon Counters, the
Quota Crushers, Permit's nephews…) whose names/taunts live in
HOOPS_TEXT (validator-swept, {playername}/{coolthing} live where used).
Bracket between rounds simulates seeded results and draws on the chalk
board; TOURNAMENT STATE IS SAVE DATA — register the v4→v5 step
(ADR-015): the bracket survives save → kill app → continue from any
round, and a live match CHECKPOINTS AT QUARTER BREAKS (score, clock,
quarter ride the v5 field) so process death costs at most the quarter
in progress — a 20-minute game on a phone demands nothing less. Your five =
the current party plus named WALK-ONS from a data table (Chad guests
pre-Milo; the walk-on bench is §A11 local color with its own tiny stat
lines — the four heroes are the stars once Dorin joins; no invented
heroes ever join the PARTY itself).
REWARDS (data-tuned, §A9-conscious, validator-pinned): every match pays
EXP through the Prompt 18 flow (level-ups announce post-game) scaled by
FORMAT and bracket depth — a four-quarter Classic war pays like the war
it is, a 3v3 run to 21 pays its weight — plus seeded goods drops
(foods/colas); pickup runs at the cage pay forever, come back anytime. FIRST Classic title pays
THE STARTING FOUR: four hero-tagged items, the first 'arms'-slot gear
(§A8 manifest extension + Bible drift note per Appendix rule 6) — wire
them the S10 way: new stat read-throughs in battle/formulas.ts
(heroSpeed/heroGuts beside heroDefense/heroLuck, battle + STATUS reading
through them) and generalize confirmEquip's preview to the item's
carried stat ("Speed up by N!"). Hands-full BLOCKS the handoff, zero
missables; repeat titles pay cash + goods only. NOT a §A10 quest — the
canon sixteen stay sixteen; no caller, no journal row.
Done when: one 5v5 game plays a true four-quarter 20-minute arc —
shots live and die on release timing, dunks feel earned, crossovers
break ankles, passes go where you aim, the shot clock forces offense,
ten athletes hold 60fps — and the full Classic crowns a champion
across ~2 hours of bracket the player can leave and resume freely;
first-to-21 3v3 pickup pays XP anytime; drivable by keys, pad, AND the
touch overlay at pump(n, 8.33); bracket AND quarter checkpoints
survive process death through v5; THE STARTING FOUR equips with stat
previews; the bot completes one seeded 5v5 QUARTER and one 3v3 game to
21 end-to-end reproducibly; npm test green (teams/walk-ons/rewards
manifests enforced); browser loop and android:apk untouched.
```

## Prompt S12c — CAGE 2.0 (user spec, captured verbatim-faithful 2026-06-11: the control room)

```
[Standard Header]
S12c — CAGE 2.0: the control, feel, and presentation overhaul of THE CAGE
(user spec, in full; ADR-029/033/034 law stands — deterministic sim,
Phaser-free, vitest first; ADR-024 input law; manifests same-commit).
Code map: the sim + all shot/steal/block math live in src/hoops/sim.ts
(greenWindow, makeChance, stealChance, findBlocker, aiHandler/aiShoot);
the renderer is src/scenes/HoopsScene.ts; semantic input is
src/engine/input.ts + the UIScene touch overlay; athlete frames are
src/spritegen/athletes.ts (SPORT_FRAME is the pinned contract).
FIX FIRST — THE FULL-COURT HEAVES (live bug, root cause named): the AI
banks shots from the opposite end because (a) greenWindow() clamps to a
0.022 FLOOR at any distance, (b) makeChance('green') pays 0.99
distance-blind, and (c) aiShoot has no range gate, so shot-clock
desperation heaves can roll green and drop. Give every athlete an
EFFECTIVE RANGE derived from sht (≈ ARC_R + (sht−50)·1.2 px, clamp
[ARC_R·0.85, ARC_R·1.35]): the green window SHRINKS WITH DISTANCE inside
range (steepen the distance term — the farther back, the smaller, per
the user spec) and CLOSES TO ZERO beyond it (no green exists out there);
non-green make% decays hard past range (≤2% at 1.5× range, 0% beyond);
AI shot selection only attempts inside its range — the lone exception is
a shot-clock ≤1s desperation heave that is honestly terrible and reads
as one. Pin all of it in vitest (window at range edges, the zero beyond,
an 80k-tick tape asserting no AI make from beyond 1.2× range).
TIMED DEFENSE (user spec — smart weighting, challenging, competitive):
blocks and steals key on TIMING, not proximity alone.
 - BLOCKS: the leap's START TIME vs the shooter's RELEASE is the input —
   a jump whose peak window (~±120ms) brackets the release blocks at a
   HIGH rate (base ~0.10 poorly timed → ~0.65 perfectly timed, scaled by
   (dfn − sht)·0.004 and reach/proximity, clamp [0.05, 0.85]); jumping
   early = the shooter holds the meter and waits you out (the hold-
   release meter makes pump-faking emergent — no new button needed);
   goaltending still rules the descent. Export the weighting table
   (BLOCK_TIMING) beside TUNE and pin the curve in vitest.
 - STEALS: the handler has VULNERABILITY WINDOWS — dribble-move startup
   (~first 150ms of spin/BTB/between-legs), the gather's first beat, and
   pass release (the lane pick). A swipe landing inside a window steals
   at a HIGH rate (neutral ~0.08 → timed ~0.50, scaled by (dfn −
   handlerSht)·0.0035, hawk +0.08, clamp [0.04, 0.70]); outside the
   windows it stays low-percentage and a whiff still means BEATEN.
   Export STEAL_TIMING, pin it, and surface both reads in the HUD
   ("TIMED!" popup on a window-hit attempt, either outcome).
NEW SEMANTIC BUTTONS: InputBus gains X and Y (keyboard KeyC/KeyV; pad
buttons 2/3 — pad B narrows to button 1, note it in the ADR; UIScene's
touch overlay grows X/Y buttons VISIBLE DURING HOOPS ONLY, thumb-arc
placed). Hoops mapping — clean, extremely responsive, fast, full control:
A = SHOOT, B = PASS, X = SPRINT (the dedicated run-faster button), Y =
DRIBBLE-MOVE modifier. Defense: A = timed block leap, B = steal swipe,
X = sprint slide. CUSTOMIZABLE CONTROLS: a SETUP → CONTROLS page rebinds
which physical key/pad button drives each semantic action (press-to-
capture, per-device, persisted device-local like the Sound preference —
never save data; reset-to-defaults row; the RPG and the cage both read
through the binding table).
THE METER, REBUILT: it renders OVER THE SHOOTER'S HEAD (world-space,
follows the athlete), fills toward the TOP where the GREEN window sits AT
THE END — you HOLD the button until the fill lands in the green and
RELEASE: inside = green make (100%); outside, the make% falls off with
distance from the window (slightly off ≈ 60%, far ≈ 20%, way off = ZERO);
overfilling past the top auto-misses. A defender closing space SHRINKS
the green window — and RANGE shrinks it too (the law above). DUNKS get
their own meter (same mechanic; miss = rim-hang flub; contested miss =
STUFFED).
THE DRIBBLE PACKAGE: Y alone = SPIN MOVE; Y + lateral = BEHIND-THE-BACK;
Y + toward-defender = BETWEEN-THE-LEGS; double-tap stays the quick
crossover. Each move rolls seeded vs the defender's commitment into
TIERED ankle outcomes with their own animations: STUN (defender wobbles,
brief slow), SMALL BREAK (defender trips/stumbles a step), LARGE BREAK
(defender falls over flat — the existing FALL frame is the floor of this
ladder). Every move's STARTUP is a steal-vulnerability window (the risk
IS the price of the sauce). SPORT_FRAME grows: spin ×2, behind-back ×2,
between-legs ×2, stun ×2, trip — and PASS ANIMATIONS: chest (straight),
BOUNCE (low flight with a floor bounce that goes UNDER hands in the
lane — lower pick chance, slower), BEHIND-THE-BACK (when the target sits
behind the passer's facing); style picked by context, distinct ball
flights.
GOALTENDING: a block that touches the ball on its way DOWN to the rim =
violation, basket COUNTS, PERMIT has a line ("THAT WAS COMING DOWN. WE
ALL SAW IT."). Blocks stay legal pre-apex.
PRESENTATION: upgrade the athlete animations a lot (livelier frames,
follow-throughs, landing recoveries); CAMERA TOGGLE in the pause menu —
SIDE (current) or BEHIND (facing the backboard from the player's
perspective): ship the pseudo-3D read (perspective court, depth-scaled
sprites, 8-facing sheets as needed). The user asked for TRUE 3D PLAYER
MODELS in this mode — that conflicts with ADR-002 (zero binary assets,
palette-by-construction) and ADR-020; S12c ships the best pre-rendered
pseudo-3D and the ADR records the decision point: a true-3D cage
(Three.js layer) is its own future prompt if the author calls for it
after seeing pseudo-3D.
TUTORIAL: PERMIT teaches the cage on first visit (skippable, flag
cage_tutored): move/sprint → the over-head meter and the green release →
the dunk meter → the dribble package and ankle tiers → pass styles →
defense (the TIMED steal and block windows, THE GOALTEND WARNING).
Done when: every mechanic above is live and drivable by keys, pad, AND
the grown touch overlay at pump(n, 8.33); bindings rebind and persist;
the sim stays seed-deterministic (vitest tape-replays green, new rolls
through the match rng only); the AI never banks from beyond its range;
a perfectly timed block visibly erases a release and a window-timed
swipe strips a dribble-move startup; the bot completes the tutorial +
one 3v3 with every new move performed; manifests pinned (frames
contract count, goaltend rule, meter/range/timing math); QA.md
pre-flight + one device row; ADR appended; browser loop and android:apk
untouched.
```

## Prompt S13 — COSTA ESTRELLA LINKS (resort golf, the 32-player Invitational)

```
[Standard Header]
S13 — COSTA ESTRELLA LINKS, the golf twin of S12 under the same S10
minigame law (own scene, everyFrame input, back = B, seeded injectable
determinism, replayable forever, once-only specials, manifests + bot
recipe + QA row in the same commit). VENUE: a clifftop resort north of
PUERTO SOL — canon's Ch.2 Spanish-colonial port covers the "Spain"
ask; build the module COMPLETE AND STANDALONE now (the Sprite Lab
precedent: dev-reachable scene + full bot run) with its world door
authored for Puerto Sol so Prompt 28 wires it in one line; tease it
meanwhile with a travel poster in Brickton (new props on a fresh rng
stream — 1995 byte-identical). Mauna Lani (Ch.8 Hawaii) remains the
alternate venue if the author prefers; note the choice in the ADR.
THE COURSE: 9 authored holes in a HOLES data table (par 3/4/5 mix, tee/
pin/hazard geometry, §A11 hole NAMES and plaque lines — validator counts
9 and sweeps the strings): cliff carries over surf, a bunker the staff
treat as a beach, terraced fairways, one par-3 onto a sea stack. ¾
overhead course view with terrain tiles (fairway/rough/sand/water/green
+ slope-grid arrows) + a SWING PANE close-up using large animated golfer
sheets cut from the S12 sport-sheet contract (address, backswing with
power tick, strike, follow-through, fist-pump, the universal sad putter
slump); ball-cam follows flight with draw/fade curvature, bounce/roll by
lie, splash/sand bursts per ADR-020 discipline.
SWING FEEL, two buttons, classic and exact: aim with the d-pad, B cycles
the CLUB BAG (data table: carry ranges, loft, roll), A starts the
3-TAP METER — second tap sets power, third tap sets accuracy in a
shrinking perfect window (push/pull miss curves the flight); after-touch
spin on the d-pad mid-flight; dedicated chip meter inside 30y and a
putt meter reading the green grid (slope arrows are honest). WIND is
seeded per round and announced by the caddy. CADDY: one new cast member
(§A11 obsession: he measures the entire world in putts — "that cloud?
two putts away, señor") who reads greens, hands clubs, and plays the
§A11.2 sincerity straight on the 9th tee at sunset.
THE COSTA ESTRELLA INVITATIONAL: 32-player MATCH-PLAY bracket — five
3-hole matches (≈5 min each → 20–30 min the title run) against 31
data-table golfers with honest accuracy/aggression curves and §A11
names; bracket state persists (register the next save step per ADR-015
only if number-flags can't carry it — prefer flags). STROKE-PLAY rounds
pay EXP + seeded goods forever (come back anytime, §A9-tuned, pinned);
the FIRST Invitational pays THE SUNDAY SET — four hero-tagged charms
(§A8 'other' expansion, Bible drift note) through the S10/S12 stat
read-through seams with stat-aware previews, hands-full BLOCKS, zero
missables; repeat titles pay cash. NOT a §A10 quest.
Done when: 9 holes play true — wind, lies, slopes, and the 3-tap window
decide everything — by keys, pad, AND touch at pump(n, 8.33); a full
Invitational runs 20–30 min and survives process death; THE SUNDAY SET
equips with previews; the bot plays one seeded hole tee-to-cup
reproducibly (document the line in the scene header); npm test green
with the HOLES/golfers/rewards manifests enforced; browser loop and
android:apk untouched; the ADR records the venue call.
```

## Prompt S14 — ✅ DONE 2026-06-11 as THE GILDED GRIN (ADR-039) — Chapter 2 complete + Prompts 15/23/25

Shipped far beyond this queued draft: the BOSS PHASE MACHINE
(src/battle/phases.ts — declarative BossScriptDef data; every §A6 trigger
type proven headlessly; forms = FORM_ART texture swaps; the riddle UI on
the ask widget; the Tick stays bespoke), PICNIC per §A4.5 (baskets
Basic/Family/Feast, the blanket scene, SUNNY SIDE ×5 battles through the
sunnyMul() seam, deli crafting at Puerto Sol, the Feast's one-shot
auto-revive), HOSPITALS & CHAPELS per §A4.7 (Brickton General + two
clinics, reviveCost(level), the cure-all desk, ADR-014's revive-all
RETIRED — wipes leave angels; chapels pray 50 HP free, the priest warm on
Mia's gift), and ALL OF CHAPTER 2: the docks + banana boat (ch1_complete
gate, first-ride deck scene, quick fades forever), PUERTO SOL (a true
ADR-012 city on frozen seed 1898, colonial arch pass inside fixed
canvases, the costa wire landed + validator flipped to assert the round
trip), the jungle (2 screens + grotto chest run), VALLE DORADO (pen,
shrine, gray wishers + woke twins), THE STEP-PYRAMID (7×7 rotor channels,
mask presses, BFS-proven solve 1/1/2/2), the §A7 Ch.2 six + their
mechanics (pending-cash theft, gold form, cast Shield, Paralyze, 5×22),
BOSS 2 on the machine (clang/telegraph/swap verified live), MIA'S FREEZE
AWAKENING at the HOLLOW reveal (§A3 amended; save v7 backfill), quests
#5–6, the Ch.2 §A8 shelf, the full §A11 script, EMBER #2 + the recovery
exit beat + Uncle Bert's Ch.3 tease. Validator + 270 vitest green; QA.md
S14 pre-flight + device row 18. NOTE for S15: this queued draft's
remaining scraps — Otterbrook home interiors (incl. Chad's empty house)
— roll into S15's interior program below.

The original queued draft is kept for the record:

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

## Prompt S14c — THE PLAYTEST FOUR & THE WORLDS OF SCALE (eight chapters become ten)

```
[Standard Header]
S14c — two movements, one session (split on the seam between them per
Appendix rule 2 if the session runs long: fixes first, canon second).
MOVEMENT ONE answers the user's playtest (four reports, root causes
already traced — fix them production-grade, bot-proven). MOVEMENT TWO
is the largest canon amendment since ADR-031: METEOR FALLS grows from
eight chapters to TEN — two scale-warped worlds, one where the party
walks tiny among 10×–100× giants, one where the party are the giants
over a 1/10–1/100 realm — written INTO the Bible per Appendix rule 6
with every engine seam landed NOW so the chapter sessions later land
both worlds as data (the Prompt-15 precedent). No chapter maps or
dialogue this session beyond Sprite Lab proof rows.

=== MOVEMENT ONE — THE PLAYTEST FOUR ===

1. NOT ENOUGH PP NEVER, EVER BASHES. Report: picking an unaffordable
ability prints "Not enough PP!" and the hero bashes anyway instead of
returning you to the menu to choose again. Root cause (traced):
heroVibe() (BattleScene.ts ~1095–1125) lists EVERY ability affordable
or not, checks PP only after the pick, prints a HARDCODED 'Not enough
PP!' and returns false — heroCommand()'s loop does re-ask, but the
latched confirm press that dismissed the message feeds the re-opened
command ask() the same frame and confirms its default row: BASH. This
is the same ask→re-fire class S4 killed on the overworld with
Dialogue.justReleased (ADR-024). Fix all three layers:
 (a) the shared list widget (ui/pick.ts) gains DISABLED ROWS —
     rendered dim (shadow tone, PP cost still shown), the cursor
     lands on them fine, A on one = soft buzz + the in-window "Not
     enough PP!" line and THE LIST STAYS OPEN. heroVibe/heroGadgets
     mark every row where pp < cost. An affordable pick or Back are
     the only exits.
 (b) battle ask()/print() inherit the same-frame justReleased guard
     so no dismissed message can ever confirm the next menu's default
     row — sweep EVERY return-false path in the command loop (Vibe,
     Gadgets, Goods, target cancel, hushed_no_vibe) for the re-fire
     class.
 (c) the string moves to BATTLE_TEXT (validator-swept, §A11 voice —
     keep it terse; insufficiency is not a joke beat).
Enemy AI is untouched (pickMove() is a separate, PP-less path —
verified). Vitest pins the canAfford/disabled-row derivation headless;
the BattleScene header gains a bot recipe driving a 1-PP hero into a
5-PP Surge at pump(n, 8.33), proving the command menu survives with no
bash queued and the turn unconsumed.

2. GLINT RETURNS EVERY TIME UNTIL THE TICK DIES. Report: lose the
crater fight once and the star scene never replays — no Glint, no
assist, a much harder retry. Root cause (traced): craterScene()
(OverworldScene.ts ~2771) gates the cutscene AND the glint:true assist
on met_glint, which is set on FIRST VIEW; tick_defeated is only set on
victory (~2801), so a defeat strands the save in the dead zone between
the flags. Fix: the scene content re-gates on !tick_defeated (the map
trigger at ~2538 already does); met_glint keeps being SET (the
awakening backfill in migrations keys off it — migrations.test.ts pins
this, do not break it) but it gates NOTHING anymore. First approach
plays the full prophecy (the awakening beat stays once-only behind
awake_surge_a — never re-toast a lived moment); retries play a NEW
short rally variant in §A11 voice (Glint flits back to the rim, two or
three lines — he has opinions about the Tick's posture and about your
last attempt), and EVERY attempt launches startBattle(['titanic_tick'],
…, { boss: true, glint: true }) until tick_defeated. Victory wiring
unchanged (tick_defeated + ember1). Vitest pins the gating predicate +
assist derivation headless (lose → flag state → re-entry yields scene
and assist); the bot loses on purpose, re-enters, sees Glint, wins.
Then sweep for the same one-shot-flag-gates-a-retryable-boss pattern
elsewhere (the Grin's approach, the pyramid apex) and fix any sibling
the same way.

3. THE PARTY RAIL — HP/PP AT A GLANCE, MENU AND MID-WALK. Two asks:
START should show the party's HP/PP boxes, and a button should pop
them while walking, then let you walk on. Build ONE widget, use it
twice: src/ui/partyrail.ts — a per-hero mini-card on the windows.ts
9-slice (window flavor + EB font law): name, HP n/max and PP n/max
boxes in the battle-card arrangement (static text, no drums), §A4.8
status tags (HOMESICK in red, the angel mark for down heroes). MENU:
the rail renders on MenuScene's ROOT — all four at a glance the moment
START opens (the EB hotel-clerk read; the STATUS page keeps the full
§A3 sheet). OVERWORLD PEEK: new semantic button SELECT in the InputBus
(ADR-024/036 lineage — keyboard KeyE, pad button 8, the literal
Select; the CONTROLS page grows row 6 "Party check" under the existing
capture/steal/reset law; the touch overlay grows a small safe-area
chip, overworld only). SELECT toggles the rail as an overlay over the
LIVE overworld — no pause, walk with it up — depth above the touch
layer, scrollFactor 0, values live, auto-hides on battle/menu/shop/
cutscene/map transition, never overlapping the dialogue band. Persisted
nowhere (a peek, not a setting). Vitest pins the party→card-model
derivation headless; bot recipe in the scene header.

4. MOM'S TABLE IS THE ORIGINAL HOTEL. Report: Mom's house should feed
you, sleep you, and wake you maxed — free, every time. Today Mom only
hands the one-time gear (mom_gear) and repeats flavor lines. Build the
ritual at rex_home (the mom branch, OverworldScene ~1340): every visit
after the gift offers "Sit down. I'll fix {favoritefood}." → kitchen
table scene (party sits — stage it on the picnic-blanket pattern
~2311; no blanket, the kitchen IS the good spot) → fade upstairs to
Jay's bed (the S6 fade law) → wake next morning: full HP/PP for every
STANDING hero, Homesick and every §A4.8 status cured (Mom's cooking
cures Homesick — §A4.4 made flesh), and the SUNNY SIDE breakfast
(+10% ×5 battles — Mom is the original hotel; S15's paid hotels
inherit HER template, note it in taxonomy row C when that session
runs). FREE, infinite, no flag-gating. Angels are NOT revived — Mom
stops at the doorway and worries ("Go see a doctor, sweetheart.
Please." — played straight, §A11.2; the hospital keeps its §A9 job).
New dialogue ids validator-swept, {favoritefood} lives. Phone-Mom
flows untouched. Bot: arrive Homesick at 1 HP, sleep, leave full +
sunny; vitest pins the restore-and-cure seam headless.

=== MOVEMENT TWO — THE WORLDS OF SCALE (the ten-world amendment) ===

THE CANON (write ALL of this into the Bible per Appendix rule 6 —
these are the user's worlds, named and numbered; contradict nothing
below, and extend freely in its voice wherever the Bible needs
connective tissue):

THE TWIN SHARDS. Over the North Sea the meteor CALVED: two Embers fell
twinned — one humming LOW, one humming HIGH — and where they landed,
the hum changed the SIZE of living things. §A2 amends: the meteor
shattered into TEN Embers; the Locket records ten Heartlights; the
Homesong is ten stems. The Hush's path gains two stops between England
and Africa, and every chapter after them renumbers.

CHAPTER 4 — "THE FJORD THAT SLEEPS" (Norway) — target end level 22.
Lucille's North Sea hop (she barely makes it). Land at KVISTHAVN, a
normal-scale fishing hamlet under the cliffs; past the tree line the
LOW Ember's hum has swelled every living thing for generations:
BOOTSTEP MOOR (10× wildlife, half of it friendly) and LILLEBY, the
giants' town, pop. 41, where the party walks UNDER doors and giants
KNEEL to talk ("WELCOME TO LILLEBY. Everything here is normal-sized.
— the Booster Club"). Some giants are friends — SIGRID the
grandmother, HALVOR the letter-writer, the tweezer-counter shopkeep —
and some are Hushed and fight. The mountain behind town IS a giant:
GRANDFATHER STORHEIM, 100×, asleep forty years. The dungeon, THE
SLEEPER'S SPINE, crosses his body hand→shoulder→ear — his terrain is
the map (the 100× read is architecture, never a sprite; see THE SCALE
LAW). The Hush nested THE WHISPERWIG in his ear and whispered him to
sleep; his silence hushed the fjord's deep songs.
Resonance Site: the Sleeper's Ear. BOSS 4 — THE WHISPERWIG (1,900 HP /
burrows into the ear canal — untargetable — until NOISE forces it out:
Vibe Volt or a Firecracker String; every 3rd turn it whispers,
party-wide HUSHED pressure — the first boss that silences Vibe. MIA
AWAKENS VIBE VOLT α MID-FIGHT, the thunder-snore in her teeth — the
ADR-035 pattern, the awakening as its own diegetic tutorial; her
ladder amends: Magnet L15 → Fire β L17 → Freeze β L21, Volt α leaves
L20 for this beat). Ember 4 sits in the ear like a hearing aid;
Heartlight 4 = THE DEEP HUM, the Homesong's bass stem. Storheim
half-wakes — "...morning." — and goes back down humming it; Lilleby
hears the deep songs again; Sigrid cries one plate-sized tear.
Quests: #17 SIGRID'S SPECTACLES (find both pond-sized lenses across
the moor; reward SIGRID'S MONOCLE — reusable battle FOCUS, see THE
SCALE LAW; caller: Sigrid) and #18 THE UNSENT LETTER (carry Halvor's
love letter to the post ONE PAGE AT A TIME, three trips, wind hazard;
reward a GIANT'S BANKNOTE (valuable, sells $250,000 — pocket change
to Halvor, who apologizes for only having small bills; the §A9
WEALTH ARC's first rung, see S14e); caller: Halvor — his phone is a
church bell).
§A7 row (six, full contract — sprite+mini, 2–4 moves, weakness,
EXP/cash/drop, death line): Colossal Gnat (150/Crying — dog-sized;
"finally, a fair fight"), Runaway Knitting Needles (175/Paralyze),
Thunder Snail (230/slow, hits like weather), Dog-Sized Berry
(160/heals itself, poses as a pickup), Hushed Gull, Enormous
(200/steals one food), Junior Jötun (260/grabs a hero — a toddler who
thinks you're toys; the latch family). §A8 shelf at LILLEBY TRADING
POST (the tweezer counter): Jumbo Crumb (food), Half-a-Pea (cheap
food), Thimble Stew (food, small party-wide), Giant's Sugar Lump (PP,
the Star Cola tier-up), Mitten Cap (hat line, after Cricket Cap),
Bootlace Belt (body), Button Buckler (arms), Giant's Coin (valuable,
sells high — "legal tender, somewhere bigger"). Music briefs for the
Prompt-40 list: Lilleby = hardingfele drone over a taiko heartbeat at
sleeping-giant tempo; the Spine = the snore is the bar line.

CHAPTER 5 — "THE GRAND DUCHY OF MINIMUS" (the smallest country on
Earth) — target end level 26. Lucille again (she lands in the duchy.
All of it.) The HIGH Ember fell on coronation night and shrank the
realm to 1/100; the duchy calls it a blessing ("rent has never been
cheaper"). The party are THE VISITING COLOSSI: the capital MINIMUS
MAJOR is a tabletop kingdom — knee-high cathedral, ribbon streets —
walked ONLY on the PROCESSION WAY (their boulevards fit your boots;
step off and the Whistle Guards nudge you back — comedy, never
damage). Citizens are 1/2–1/3 minis with enormous civic pride; crowds
parade. The treasury pays in MICRO-DUCAT chests — one hundred
thousand coins, $12; the counting outlasts the spending (the §A9
WEALTH ARC's inverse gag, see S14e). You owe them a crushed orchard
(the landing), so: #20 CIVIC
REPAIRS (re-roof the cathedral with one coin, raise the drawbridge
with one playing card, refill the reservoir with one watering can;
reward Banquet of the Realm ×2 + the duchy discount; caller: GRAND
DUCHESS MILLIMETTA I — tiny duchess, enormous voice) and #19 THE ROYAL
CENSUS (count all 100 citizens; they will not stand still; reward the
Stamp Quilt; caller: the Census-Taker, who counts the rings before
answering). MILO'S CH.5 BUILD (gadgets are built, not awakened —
ADR-035): the duchy's hundred engineers help him grind Sigrid's spare
lens into the BIG-LITTLE LENS — Spy gains FOCUS, party-wide for the
battle (see THE SCALE LAW). The terror: WHISKERZILLA — a perfectly
ordinary lost housecat, their kaiju — its bell rolled through Hush
static and rings FLAT, so the Silent Paw is never heard coming (a
LOST CAT poster goes up in Foggybottom when Ch.3 lands —
zero-missable flavor payoff). Dungeon: THE HEDGEROW, their Mirkwood —
escort the Tin Battalion through it at your scale.
Resonance Site: the Ducal Crown. BOSS 5 — WHISKERZILLA (2,150 HP /
"it is only playing": every 3rd turn the tail-wiggle telegraphs a
POUNCE — Defend or be knocked flat, Paralyzed; THE FLAT BELL is a
second 150-HP target granting evasion while it rings — break the bell
and the purr gives every move away; victory does not defeat it, it
gets BORED — the duchess knights it SIR WHISKERZILLA, WARDEN OF THE
REALM; mercy played straight, §A11.2). Ember 5 under the crown;
Heartlight 5 = THE BELL CHOIR — all one hundred citizens sing into
the Locket, the Homesong's highest stem; humans passing the meadow
hear wind chimes. The Homesong now owns its floor (Ch.4) and its
ceiling (Ch.5). §A7 row: Tin Parade (12×8/attacks in formation),
Duelist Pip (210/minuscule — the miss-floor's first lesson), Crumb
Cannoneer (240/fires your own rations back), Powder-Wig Wasp
(260/Asleep — the cavalry mount gone feral), Wind-Up Wyrmlet
(280/winds up: one telegraphed huge turn), Dust Bunny of Unusual Size
(300/splits — unusual to THEM). §A8 shelf at THE DUCAL PROVISIONER
("Colossus rates apply" — the prices are normal, the sign is proud):
Dewdrop Flask (PP), Banquet of the Realm (food, full single-hero —
their entire harvest festival, eaten in one bite; they cheered),
Stamp Quilt ('other' charm, Guts — sewn by one hundred hands),
Wind-Up Mouse (battle item: one enemy wastes a turn — yes it works on
the cat), Parade Drum (battle item: party Speed up), Powdered Wig
(hat, gag stats), Snow Globe of Minimus (valuable — "the whole duchy,
to scale. Which scale? Exactly."), Royal Thimble (key item, the
duchess's gift). Music briefs: Minimus Major = celesta gavotte at
double tempo; the Hedgerow = pizzicato terror, very small strings.

THE RENUMBER SWEEP (the Bible must read TEN end-to-end with zero
orphan references — grep every "Ch.4"–"Ch.8" and every §-table row
you move): §A1 (eleven countries and one planet; 10 chapters, 10
bosses; length 5.5–7 hr main + ~3.75 hr sides), §A2 (Ten Embers /
one-tenth / collect all ten), §A3 (Dorin joins Ch.9, Trial at L44;
Teleport α story-gate Ch.6, β Ch.8; Mia's ladder per Ch.4 above),
§A4.5 (~3 tables per chapter holds — ~30), §A4.6 (gates Ch.6/Ch.8),
§A4.8 (Mushroomized — "Ch.8 spore forest"), §A4.9 (0–10 Embers, ten
stems), §A5 (insert rows 4–5, renumber the rest 6–10; Lucille's
three-leg running gag: "she barely makes it" → "she lands in the
duchy. all of it." → "she has no business making it"), §A6 (insert
the two chapters above verbatim-faithful; renumber old 4–8 → 6–10;
restate the end-level ladder 8/13/18/22/26/30/35/40/46/52–55; boss HP
lines stay canon — Prompt 37's sim may tune data ±10%, never code),
§A7 (60 standard enemies; the two new rows), §A8 (the two shelves +
SIGRID'S MONOCLE), §A9 (playtime amended; the Classic note
untouched), §A10 (20 quests — #17–20 as above, four new CALLERS in
the finale ledger; Mr. Click 12 → 14 ambushes, one per new world: in
Lilleby he shoots from VERY far away, in Minimus through a macro
lens), Part C (insert Prompt 30 — Chapter 4 and Prompt 31 — Chapter 5
in the Prompt-27 chapter template; renumber old 30–34 → 32–36 and
Phase 7–9's 35–44 → 37–46, each annotated "(formerly Prompt N)").
Stamp every amendment with the standard Appendix-rule-6 dateline.
Then update THIS file (NEXT_PROMPTS.md): run order becomes S15 → S16
→ Prompt 29 (Ch.3) → Prompt 30 (THE FJORD THAT SLEEPS) → Prompt 31
(MINIMUS) → 32+ (renumbered) — and append the two chapter prompts
FULLY WRITTEN into the queue (the Prompt-28 [Same template] style,
folding in every canon block above) so those sessions start cold and
land hot.

THE SCALE LAW (the engine seam, THIS session — its own ADR; chapter
sessions must be able to land both worlds as DATA):
 1. Living sprites keep the 24×32 law at 1×. GIANTS author at 3–4×
    (≈72×96–96×128) via a giants pass in spritegen off the SAME
    CharacterSpec (ADR-022 construction AT SCALE — drawn span tables,
    never naive-scaled pixels; ADR-020 rules bind; the new ADR
    supersedes ADR-009's frame law the way S16's bike note
    anticipates, standFrame() preserved). Giant sheets include KNEEL
    frames — dialogue is eye-level; that is the warmth.
 2. 10× AND BEYOND IS ARCHITECTURE, NEVER A SPRITE: terrain-giants
    (Storheim's hand/shoulder/ear are MAPS — tiles + fixed canvases,
    the colonial-arch precedent), boot/hand multi-tile props beside
    1× heroes, and in battle the PARTIAL VIEW — an ankle, a palm, an
    ear canal FILLS the 64–128px battle frame. The camera that cannot
    fit the enemy IS the size read; the Whisperwig stages inside the
    ear.
 3. TINY is the mini pipeline grown up: citizens at 1/2 and 1/3
    (authored minis, 2–3 tone reads — the enemies' mini_* precedent);
    crowds as authored prop rows; the player NEVER rescales (the
    user's spec verbatim: you look normal — the world is the effect).
    Architecture small: knee-high building props, ribbon streets, and
    PROCESSION WAY walk lanes as map data.
 4. BATTLE TRAITS land in formulas NOW, vitest-pinned headless:
    `towering` (its big party-wide move must telegraph the turn
    before — the Defend answer; bash text reads "you hit what you can
    reach") and `minuscule` (physical hit chance HALVES; Vibe and
    Pray never miss for size — warmth doesn't aim; FOCUS effects
    clear it for the battle: SIGRID'S MONOCLE as the item path now,
    Milo's BIG-LITTLE LENS when Ch.5 lands). EnemyDef gains the
    optional trait tag in the schema; the §A7 rows above declare
    them.
 5. THE LOCKET COUNTS TEN: the Locket screen grid reads 0–10 and the
    stem map grows to ten (stems 4 and 5 reserved for THE DEEP HUM
    and THE BELL CHOIR — synth voices stubbed behind the §A4.9
    playMusic stem-cap API exactly like the existing eight; Phase 8
    renders them all). ember1..ember10 stay flags (ADR-015 — no save
    bump this session).
 6. SPRITE LAB proves the pipeline before any chapter spends on it:
    one 4× giant (kneel + walk beside a 1× hero), one boot prop, one
    1/3 mini crowd row, one partial-view battler mock (an ankle at
    128px). Shots in .shots/.
 7. The validator amends per-chapter manifests ONLY as chapters land
    — do NOT pre-assert Ch.4/5 content; the Bible carries the totals
    until the Prompt 30/31 sessions exist. Today's validate stays
    green.

QA: pre-flight in docs/QA.md + device row 20: fail a 5-PP cast at 1
PP and keep the menu; lose to the Tick on purpose and watch Glint
return; SELECT-peek the rail mid-walk and see it in the START root;
Mom's ritual from Homesick-at-1-HP to full + SUNNY; the Sprite Lab
scale rows on device. Append the ADRs (041: the playtest four + the
party rail + Mom's table; 042: THE SCALE LAW + the ten-world
amendment). 274 vitest is the floor — every new seam adds pins.

Done when: all four playtest reports are dead and bot-proven; START
shows the party rail and SELECT peeks it mid-walk on keys, pad, AND
touch; Mom feeds, sleeps, and wakes the party maxed for free forever
while angels still point at the hospital; the Bible reads TEN
chapters with zero dangling renumber orphans (grep proves it); the
Homesong API counts ten; towering/minuscule + FOCUS are formula law
under green vitest; the giants/minis/partial-view pipeline renders
its proof rows in the Lab; the two chapter prompts sit fully written
in this queue; validator + vitest green; browser loop and android:apk
untouched.
```

## Prompt S14d — THE SECOND PLAYTEST: SWIRLS, PACKS, DROPS & THE FIRST NATIONAL BANK (runs AFTER S14c)

```
[Standard Header]
S14d — the second playtest answer + the money infrastructure, one
session (split per Appendix rule 2 if it runs long: the feel pass
first, THE FIRST NATIONAL second). Chapter numbers below use the
post-S14c TEN-chapter numbering. The user withdrew the
outleveled-flee report (already canon §A4.2, instantWin() live in
formulas.ts) — it is NOT in scope.

=== MOVEMENT ONE — THE FEEL PASS ===

1. THE SWIRL IS A TRAFFIC LIGHT (user decree — Bible §A4.2 amends).
Today the contact swirl tints player-advantage RED, enemy-advantage
GREEN, neutral paper-white (OverworldScene.ts ~1125, tintMap), with
ONE shared 'swirl' sfx. Flip it to the intuitive read and make the
sound tell the same story: YOU got the drop = GREEN swirl; neutral =
GREY (pick the neutral mid-tone from the 64 — never paper-warm);
THEY got your back = RED. Three NEW ADR-006 synth presets:
swirl_jump (bright, ascending — good news), swirl_even (the classic
whoosh, recentered), swirl_ambush (descending sting with a low
thump — bad news). A second channel for color-blind reads: the green
swirl spins OUTWARD fast (cubic.out), the red swirl drills INWARD
heavier (cubic.in), grey keeps today's lazy spiral. Advantage
DETECTION (~1090–1099, the dot-product math) is untouched — this is
presentation. Amend §A4.2's color sentence (supersedes the original
green/red line; record the decree in the ADR) and re-shoot the three
swirls for .shots/.

2. HOMESICK GROWS WITH DISTANCE, NOT WITH SPAM (user report: "Jay
gets homesick a bit too quickly"). Today: flat HOMESICK_CHANCE = 0.08
per victory, no geography, no cooldown (formulas.ts ~226). Retune as
a pure-data law in formulas.ts, vitest-pinned:
 - BASE 0.025, and ZERO on Chapter-1 home turf (Otterbrook/Brickton
   region maps — you can practically see Mom's street);
 - +0.005 per chapter of distance (Ch.2 ≈ 3%, rising to ≈6.5% by
   Ch.9 — homesickness is a function of how far from home you are;
   that is the THEME doing the balancing);
 - HARD COOLDOWN: never within 12 victories of the last contraction
   OR cure (a number flag counts down per victory — ADR-015, no
   save bump);
 - never while SUNNY SIDE is active (you just had a picnic; you feel
   great).
HOMESICK_SKIP_CHANCE stays 0.5 — the status stays scary; only the
frequency tunes. Vitest: distribution per chapter band, the cooldown
window, the sunny immunity, home-turf zero.

3. MOM CURES IT IN PERSON (user report). Talking to Mom at rex_home
while rex_homesick cures it on the spot — the hug, no meal required
(S14c's table ritual stays the deluxe path; phone calls unchanged).
One new line, played straight (§A11.2): she doesn't ask, she just
knows. Wire BOTH touchpoints: the mom NPC branch (~1340) and
callMom()'s at-home hug branch (~2195). Validator-swept dialogue id.

4. CALL FOR HELP — PACKS STACK (user spec: some enemy types call
reinforcements; be selective — sociality is the criterion). The
engine: EnemyDef.moves gains kind 'call' (schema + z.infer per
ADR-017): the call CONSUMES the turn, spawns its summon id mid-battle
through the Prompt-15 summon seam (the Mainframe's summons-refill
trigger is already proven headless — reuse its entry flow +
'summon_flash' fx), with a per-enemy §A11 call line. LAWS: the row
caps at 8 standard combatants (canon multi-part groups are exempt —
they ARE one enemy); each caller lands at most 2 successful calls; a
cap-blocked call whiffs honestly ("...nobody came. It pretended that
was the plan."); arrivals are full citizens (EXP/cash/drops all
count); Spy tags CALLER. AI: the data carries the weight, the engine
doubles it when the caller is alone or under half HP. THE NINE
CALLERS (Bible §A7 gains a caller annotation on each row; the three
whose data exists land LIVE this session, the rest land with their
chapters):
 - Pigeon Gang (Ch.1, LIVE): "flashed a wing sign! The block
   answered." → another Pigeon Gang.
 - Blazer Smiler (Ch.1, LIVE): "scheduled a quick sync! A colleague
   synergized in." — the Department's whole satire in one move.
 - Banana Bunch United (Ch.2, LIVE): "called an emergency meeting!
   The union grew."
 - Fog Hound (Ch.3): a howl with nothing at the end of it.
 - Cricket Eleven (Ch.3): "appealed! A twelfth man padded up." —
   refills its multi-part count toward eleven (the refill trigger).
 - Cackling Hyena (Ch.6): the cackle IS the call.
 - Paper Crane Swarm (Ch.8): "folded itself a friend."
 - Castle Bat Choir (Ch.9): "hit the high note! A soprano descended."
 - Wolf of the Old Road (Ch.9): canon already says "calls pack" —
   this mechanic IS that quirk, formalized.
 (+ Tin Parade joins the roster when Ch.5 lands: "the drumline caught
 up!" — annotate its S14c §A7 row.) Vitest: cap math, the two-call
 limit, the whiff path, refill-toward-eleven — all headless.

5. STYLE DROPS — §A7's DROP-TABLE CONTRACT, FINALLY IMPLEMENTED (user
spec: enemies drop items that fit their style; today NO standard
enemy drops anything — the Bible has promised drop tables since §A7).
EnemyDef gains optional drop { id, rate } (schema); the victory flow
rolls per defeated enemy after EXP/cash and routes through the S4
chooser (hands-full = offer, skippable — a passed-up drop is lost,
EB-honest; quest rewards keep their zero-missable law, drops are not
quests). Battle text: "The {e} left {item} behind!" with per-enemy
flavor where style demands. THREE DROP LAWS into §A7's preamble:
 (1) THE APOLOGY: status-inflictors may carry their own cure;
 (2) THE RESTITUTION: thieves return what they stole on victory (the
     Parrot's pending-cash seam EXTENDS to the Pigeon Gang's stolen
     food — always returned, plus interest sometimes);
 (3) THE SIGNATURE: a drop is a punchline about who they were.
LIVE NOW (Ch.1–2 data exists): Cranky Mailbox → Fresh Stamps 8%
("returned to sender. Profitably."), Runaway Lawnmower → Broken Gizmo
15% (Milo's Repair fuel — until Ch.3 it sells), Coily Cicada → Aloe
Leaf 12%, Blazer Smiler → Star Cola 10% (break-room perks), Pigeon
Gang → stolen food back ALWAYS + Corn Dog 8%, Hill Slug Deluxe → Salt
Shaker 6% ("it kept its enemy close"), Gilded Beetle → GOLD FLAKE 10%
(ONE newly minted 'valuable', sells $60 — §A8 amendment in the same
commit, validator-pinned), Cursed Souvenir → Hanky 12%, Banana Bunch
United → Alfajor 10%. ANNOTATED INTO THE BIBLE for the chapter
sessions to inherit: Tea Poltergeist → Monastery Tea; Prefect Drone →
Broken Gizmo; Mirage Vendor → one REAL item for once (8%, a random
good from the region's shop — the gag inverts); Scarab Sergeant →
Firecracker String; Rail Bandit → Bottle Rocket; Mush Uncle →
Doctor's Note; Incense Wisp → Temple Incense; Mămăligă Blob →
Mămăligă cu Brânză ("waste not"); Frost Wraith → Akutaq; Ember Mimic
→ Freeze-Dried Ice Cream; Null Walker → Comet Bead 1/128 (canon,
restated as a drop row); and from S14c's worlds: Junior Jötun →
Half-a-Pea, Dog-Sized Berry → Jumbo Crumb, Tin Parade → Parade Drum
5%. Validator: every drop id exists, both directions. Vitest: roll
math + the chooser's hands-full path headless.

6. THE 6:15 SEATS YOU (user report + screenshot: "the chair is on my
head, instead of sitting down"). Today boarding drops the player at
(296,108) — ON the x=18 seat column of bus_interior (maps.ts ~1396:
seats at x 3..18, y 4) — so the hero STANDS in the seat row with the
seat sprite overlapping their head for the whole ride. Fix it the way
the user expects: the party SITS. On ride start (the bus_interior
beat, OverworldScene ~2503 / boarding ~2943), snap the party into
seats — player to one seat tile, followers (Chad or Mia as the
chapter has them) to neighboring seats — facing the windows, on the
picnic-scene sit idiom (~2311; same staging law, this.cut input
lock), the hero drawn IN the seat (depth/y so the seat back reads
behind the shoulders, never over the face). The fern lady keeps her
fern. The narration beats play over the seated party; on arrival
everyone stands and the post-ride spawn moves OFF the seat column
into the aisle. Re-check the banana-boat deck scene for the same
standing-in-furniture read and apply the idiom if it needs it. Shot
in .shots/.

7. STOREFRONTS READ SOLID — THE WALK-BEHIND BAND SCALES (user report
+ screenshot: "I can walk right through the buildings" at the
DINER/VIDEO row). Traced: collision is FINE — what reads as walking
through is the 2.5D walk-behind. Every city building's solid starts
oy=26 (maps.ts ~615), and on a ONE-story storefront
(cityBuildingHeight(1) = 60px) that 26px hidden-ground band is nearly
half the facade: a hero strolling the plaza behind the mid-row shops
tucks BODY-DEEP into the sign and window rows with their hair poking
over the parapet — "inside the building", exactly as reported.
(North-row u=2 buildings at 76px carry the same band fine —
proportion is the whole problem.) THE LAW: the walk-behind band
scales with the building — solid oy = 26 for u≥2, 12 for u=1 — with
the solid BOTTOM unchanged (oy+h stays H−12: h grows by the 14 that
oy gives up; the doorstep band and the maps.test floor-alignment pins
stay byte-identical, zero rng consumed — ADR-016 holds, prove the
1995 layout unchanged). Sweep EVERY u=1 city storefront in Brickton
AND Puerto Sol (maps_ch2.ts rides the same cityBuildingHeight seam)
and re-walk the bot behind the row: behind a 1-story shop you now
tuck to the parapet coping, never into the windows. And answer the
report's other half in place: DINER and VIDEO are §A11 locked facades
BY DESIGN until S15's EVERY DOOR OPENS lands their interiors — their
locked lines stay canon ("closed between breakfast and breakfast").

=== MOVEMENT TWO — THE FIRST NATIONAL ===

8. THE ATM-AND-PHONE LAW (user spec, answering "is there supposed to
be an ATM?" — §A4.4 says ATMs worldwide; make it LAW): every
ENTERABLE shop interior and every hotel lobby contains a working
PHONE and an ATM — the EB drugstore-phone tradition, now enforced.
Outdoor stands exempt (Ana & Vivi accept exact change only; the sign
says so). Retrofit NOW: the Otterbrook drugstore, Brickton STARMART,
and Puerto Sol's shops/deli get both props — placed on FRESH seeded
rng streams (ADR-012/016 law: the 1995/1898 layouts stay
byte-identical, prove it the usual way). Validator law (the S15
no-decorative-doors enforcement pattern): any map whose NPCs open a
shop must contain ≥1 phone + ≥1 atm interactable, exemptions tagged.
EDIT THE QUEUE in the same commit: S15's taxonomy row C bakes "every
hotel lobby: phone + ATM (the S14d law)" so hotels inherit it the day
they exist.

9. THE AMOUNT STEPPER (user report + screenshot: the ATM's fixed
$10/$50/$100/All list — "there needs to be an option to slide the
amount up or down"). Replace the fixed picks with a STEPPER row on
the ask widget: ◄ ► adjusts the amount by the STEP; the step itself
cycles $10 → $50 → $100 (and grows with wealth — magnitude-aware:
the offered steps scale with the balance so the late game isn't
tapped out in tens, see S14e's big-number law); HOLD a direction to
RAMP (ADR-024 held-state law — acceleration roughly ×10 per second
held); All and Back stay. ONE widget, used by ATM withdraw AND
deposit AND the S&L teller (item 10) — built on pick()/ask() so
touch, pad, and keys inherit it (ADR-024/038 edge law). Clamp to the
balance; preview the result live ("take $250 → pocket $801, bank
$301"). Vitest: clamp/ramp/step-cycle math headless; the bot
withdraws an exact odd amount by stepper alone.

10. THE SAVINGS & LOAN OPENS — LOANS, AND 27 MAPLE (user spec: banks
with loans for the car, a mortgage for a HOUSE with creative
features). The Otterbrook SAVINGS & LOAN gets its interior NOW (S15's
row K updates to "landed early in S14d"): the teller line that beats
the ATM rate by $0 (canon gag), the velvet queue ropes with nobody in
them, the pen on a chain ("the pen is warm. Someone was just here."),
and THE LOAN DESK — the officer does not blink at a twelve-year-old
("Sign here. And here. Initial the crayon box."):
 - THE CAR NOTE (gated ch2_complete; $1,500 cap): borrowed cash in
   hand NOW, repaid as a 25% GARNISH of every future Dad deposit
   until principal ×1.1 clears ("The tenth part is for the pen.").
   One note at a time. It exists to meet S16's PRE-LOVED AUTOS lot —
   EDIT S16's car bullet in the queue: financing exists at the S&L.
 - THE MORTGAGE (gated ch3_complete + a clear note): 27 MAPLE,
   Otterbrook — plant the FOR SALE sign NOW ("FOR SALE: cozy. One
   previous owner. She took the doorknobs."). $1,500 down + $4,500
   garnished at the same 25%, ×1.1. THE DEED is a key item; the door
   opens the day you sign.
 - ADR-015 prefer-flags carries the WHOLE ledger as number flags
   (note principal/paid, mortgage principal/paid, deed) — the ONLY
   new save field is the house chest (an item array can't be a
   flag): GS.data.homeChest, SAVE v8, registered migration,
   round-trip tested.
27 MAPLE'S PAYLOADS (every one a real system, in-voice):
 a. YOUR BED — free full restore for standing heroes (Mom's rules;
    angels still point at the hospital).
 b. THE FOOTLOCKER — 32-slot home storage on the pick widget,
    deposit/withdraw from any hero's bag; hands-full finally has a
    home answer.
 c. YOUR OWN LINE — a phone (Dad saves here); and SOMETIMES when you
    walk in, it is already ringing: Mom heard you bought a HOUSE ("A
    twelve-year-old with a MORTGAGE. Wait till your father— he says
    congratulations.").
 d. THE MANTEL — trophies render as earned: the Classic trophy, the
    Invitational cup, the arcade initials plaque; Mr. Click's photos
    hang on the wall as collected, count visible — the credits
    album, previewed at home.
 e. THE RECORD PLAYER — plays the Homesong stems earned so far, the
    Locket screen's cozy twin (same §A4.9 stem-cap API).
 f. THE FRIDGE — one free regional food per region-flag (the S15
    row-J law, instantiated here first).
 g. THE GARAGE — empty until S16's car; then it parks here, home
    becomes a road-map node, and Lucille's spare propeller hangs on
    the wall ("in case." — Bert).
 h. THE MAILBOX — Dad mails a postcard per completed chapter (a
    collectible set, validator-swept; he underlines things), and Ana
    & Vivi tape a drawing to the fridge after quest #3 — the S15
    row-I ledger warmth, here first.
=== MOVEMENT THREE — THE DRUM & THE HITCH (fold into the feel pass) ===

11. THE DRUM CARRY IS WRONG AT REST (user report + screenshot: "the
HP number seems to be glitching" — Jay's hundreds drum parked BETWEEN
digits at 94 HP while Mia's 056 reads clean). Root cause (traced, the
real math): OdoDisplay.setValue (BattleScene.ts ~229) computes the
carry for place p as max(0, lower/(p/10) − 9). For the tens drum
(p=10) that correctly reads "roll while the ones pass 9→0" — but for
the hundreds (p=100) it evaluates to (lower−90)/10: it starts rolling
at x90 and smears the carry across the whole nineties, so ANY resting
value with a 9 in its tens digit (94, 92, 190…) parks the hundreds
strip a fraction between cells. The screenshot is exactly 94: carry
0.4, the strip caught between the bottom of 0 and the top of 1. FIX —
the carry spans only the final unit before rollover:
pos = floor(v/p)%10 + max(0, (v % p) − (p − 1)). One line, correct at
every place. Vitest pins: resting values 56/94/99/100/199/949 land
EVERY strip on exact integer cells; the carry animates only across
…99→…00 (both roll directions); the ones drum still rolls
fractionally. Then eyeball it live at 94 HP and shoot it for .shots/
— the S14b golf-meter lesson: pixel-sample the strip, don't trust the
math alone.

12. THE HITCH HUNT (user report: "a bit of an unresponsive game from
time to time… walking through some areas it may have been lagging").
Hunt it, don't guess it: pull Prompt 42's hidden FPS overlay FORWARD
(tap the title version string 5× — frame ms + a worst-frame counter),
add window.mfPerf to the ADR-008 driver (captures frame-time spikes
with timestamps during bot walks), then bot-walk Otterbrook, Hickory
Hill, and Brickton end-to-end and log the spike table in docs/QA.md.
PRIME SUSPECTS to sweep regardless (steady-state allocation hygiene):
per-frame object literals in the movement hot path (tryMove's box +
collides() run per axis per entity per frame — reuse scratch rects),
follower crumb-trail array churn, roamer pursuit vector allocations,
per-frame setDepth/sort churn on the big maps, spawner
despawn/respawn thrash at map edges, and footstep/SFX scheduling. Fix
what the table convicts; ZERO per-frame allocations in steady-state
walking is the bar. (Prompt 42 keeps the full atlas/profile pass —
this is the playable-now slice.) Verify on the user's lane: browser
AND android:apk, pad connected and disconnected. Record before/after
worst-frame numbers in the same QA.md table.

13. DOORS DON'T PING-PONG — THE EXIT LATCH (user report +
screenshots: holding UP through the Department's elevator doors
bounces you between floors as fast as the fades can run). Root cause
(traced): door transitions fire on pure ZONE OVERLAP (OverworldScene
~2380 map doors, ~2397 prop doors — no press, no entry-direction
check), and arrival spawns sit inside or one held step from the
RETURN door's zone, so held input re-fires the opposite door on
every arrival; `transitioning` only guards the fade, not re-entry.
FIX — spatial debounce, not just a timer: on every map arrival,
DISARM each door zone that overlaps (or sits within one player-box
step of) the spawn point; a disarmed door re-arms only once the
player's collision box has FULLY exited its zone plus a 2px margin.
Held input then parks you harmlessly on the threshold — you step off
before the door will take you back, which is also how deliberate
backtracking naturally moves. Apply to BOTH loops (map doors AND
prop doors; goThroughInteriorDoor inherits via the shared path), and
add a ~300ms post-arrival global door cooldown for layouts where two
zones tile flush. Every door in the game inherits — elevators, mats,
interior doors, facades; the bus/boat boarding beats are flag-gated
scenes and unaffected. Vitest: the arm/disarm predicate headless
(spawn-on-zone → disarmed; box exits → re-arms; the elevator pair
never double-fires under a held-direction frame pump); the bot holds
UP at the Department elevator for five seconds and changes floors
exactly once.

Bible amendments (Appendix rule 6, datelined): §A4.2 (the traffic
light), §A4.4 (Homesick geography + cooldown; the ATM-and-phone law;
banking grows loans + the mortgage), §A7 (the three drop laws + the
caller annotation + per-row drop/caller notes), §A8 (GOLD FLAKE; THE
DEED + Dad's postcards), §A9 (the note + mortgage as the long-arc
money sinks beyond gear refresh; numbers above are canon, Prompt 37's
sim tunes data ±10% only). Append the ADRs: 043 (the feel pass —
swirls, homesick geography, callers, the drop contract), 044 (THE
FIRST NATIONAL — the law, the loan ledger on flags, 27 Maple, save
v8). QA pre-flight + device row 21: see all three swirl colors and
HEAR all three sounds in one stroll; go homesick abroad and get hug-
cured at home; watch a Smiler sync a colleague in and the cap whiff
line land; ride the 6:15 SEATED both ways; stroll the plaza behind
the DINER row and stay out of its windows; rest a drum at exactly 94
HP and read it clean; walk all three towns with the FPS overlay up
and no spikes; hold UP at the Department elevator and ride it ONCE;
step an exact $237 out of the ATM; bank a loan, buy
the car later, sign the mortgage, sleep at 27 Maple, stash a bat in
the footlocker, hear the phone ring.

Done when: the swirl reads green/grey/red with three distinct sounds
matching who got the drop; Jay homesicks rarely at home, more abroad,
never twice in 12 victories, and Mom's hug cures it in person; the
6:15 seats the whole party for the ride and stands them up on
arrival; one-story storefronts hold you at the parapet (frozen seeds
proven byte-identical); every drum rests on exact digit cells and
carries only through the nines; the three towns walk spike-free with
the overlay up to prove it; the ATM and teller move exact amounts by
stepper; no door in the game re-fires under held input until the
player has stepped off its threshold; the three live callers stack
the row mid-fight under the caps; Ch.1–2
style drops fall and route through the chooser with the Bible
annotated for every later chapter; every enterable shop holds a
working phone + ATM under a green validator law with frozen seeds
proven byte-identical; the S&L opens with the teller gag and a
working loan desk; the car note garnishes Dad's deposits; 27 Maple
sells, opens, and all EIGHT payloads work; save v8 migrates clean;
the queue's S15/S16 prompts carry their inherited edits; validator +
vitest green; browser loop and android:apk untouched.
```

## Prompt S14e — THE FORTUNE ARC (user decree: billions by the finale — the Manor, the Comet GT, the Starhopper)

```
[Standard Header]
S14e — the wealth decree, canon-first. Runs AFTER S14d (the S&L, the
deed flags, the garnish, and the amount stepper exist). USER DECREE,
verbatim-faithful: "we should be able to get A TON of money like in
the billions by the end of it. and own a mansion and a super fast
car and a jet." Design law for every session after this one: the
1995 economy of Chapters 1–3 is UNTOUCHED — choices hurt a little,
exactly as §A9 wrote it — and then the back half ESCALATES BY DESIGN
into an honest power fantasy. Money is the side-quest of the back
half; the Embers never care about it, and the epilogue's quiet walk
home is unchanged (§A11.2) — the §A9 amendment's last line says it
straight: the net worth is a number; the callers are the score.

=== MOVEMENT ONE — THE CANON (Bible amendments, Appendix rule 6) ===

THE WEALTH ARC lands in §A9 as a NET-WORTH TARGET TABLE with named
sources per chapter (post-S14c numbering; balance-sim — Prompt 39,
formerly 37 — adopts these targets; tune data, never code):
 Ch.1 ~$1K · Ch.2 ~$5K · Ch.3 ~$25K — canon income, untouched;
 Ch.4 ~$1M — THE WINDFALL: giants tip in GIANT'S BANKNOTES (S14c's
   #18 pays the first: $250,000 and an apology for the small
   bills); Bootstep Moor drops + Lilleby trade make five figures
   routine;
 Ch.5 ~$1.2M — the inverse gag holds wealth flat: the duchy pays in
   MICRO-DUCAT chests (100,000 coins, $12 — the counting outlasts
   the spending);
 Ch.6 ~$8M — THE INVESTMENT DESK opens at the S&L (below);
 Ch.7 ~$60M — the collectors' market: late 'valuable' kinds price
   in seven figures (the Maharaja's gratitude is rubies, not
   rupees);
 Ch.8 ~$400M — bond maturities + the temple's relic exchange;
 Ch.9 ~$1.5B — HOAXULA'S SETTLEMENT: the bankrupt park's liability
   pays out post-mercy, sobbing, in a Cleveland accent;
 Ch.10 $3B+ — the finale's stats page shows NET WORTH.
THE INVESTMENT DESK (the S&L's third window, gated ch6_complete):
BONDS — fixed-term, mature at chapter boundaries, ×1.5 per chapter
held ("40% APY is normal for 1995," says the officer, wrongly) — and
THE TICKER: five EB-goofy listings (Smile Industries, Banana
Futures, Fog Holdings, Tin Parade Records, Comet Beads LLC) whose
prices move ONLY at chapter boundaries (nobody day-trades a JRPG) on
a seeded DETERMINISTIC walk per save (ADR-015 number flags; the
ADR-008 bot replays a portfolio byte-equal). NPCs you've helped drop
in-voice tips that are right exactly as often as they should be.
§A8 gains THE PROPERTY & VEHICLE CATALOG — each a deed/title on the
S14d registry, the garnish law intact (one at a time; the loan
officer remembers you):
 - HILLCREST MANOR (Ch.7+, $150M, the bluff above Brickton) — the
   user's mansion, PAYLOADS each a real system: the GRAND
   FOOTLOCKER (96 slots — the 27-Maple chest's big brother); the
   TROPHY HALL (every cup, plaque, initials row, and Mr. Click
   photo at architectural scale); THE POOL (a swim = SUNNY SIDE —
   the picnic law's luxe twin); the HOME THEATER (replays Mr.
   Click's reel, and the movie-about-you once Ch.7's cinema
   exists); JEEVESBY the butler (§A11 obsession: he announces
   everything, including himself; hands one regional food per
   region-flag; answers the phone "the residence of a
   twelve-year-old, YES"); the CONSERVATORY (the Homesong stems as
   a live arrangement — walk the room and each stem solos near its
   instrument); GUEST ROOMS (post-quest CALLERS visit on rotation —
   the S9 ledger's warmth at scale; Buni leaves sarmale in the
   fridge); the HELIPAD (the Starhopper parks here; before the jet
   it is a koi pond labeled FUTURE HELIPAD — the koi know); the
   GARAGE ROW (every owned vehicle on display). 27 Maple stays
   canon — the starter home the manor never invalidates: the
   mailbox postcards and the sisters' fridge drawing live THERE,
   and Jeevesby refuses to poach the fridge gag.
 - THE COMET GT (Ch.6+, $2.5M, the back room of S16's PRE-LOVED
   lot — "a show car for a movie that never came out"): overworld
   drive ×2.0 outdoors (supersedes the bike's ×1.35 when both are
   owned), the S16 region road-map UI inherited at twice the
   vignette speed, a horn that plays the first two notes of the
   Homesong, valet at every town edge ("NO COMETS. — the floor"
   stands indoors).
 - THE STARHOPPER (Ch.8+, $1.2B, sold at any S16 airport): a
   private jet — any VISITED region instantly, airport-to-airport.
   The Ember trail still gates new chapters (§A5 law: flying never
   skips story; Teleport stays the no-luggage option). CABIN
   INTERIOR map: a phone, a fridge, and a PICNIC TABLE AT 30,000
   FEET (same buff, better view). Bert REFUSES to fly it ("Lucille
   would hear about it") and recommends his niece ROXANNE, who
   flies anything with a door.
BIG-PICTURE CONSISTENCY: §A6/§A7/§A10 rows gain their wealth-source
annotations (banknote drops, the settlement, the relic exchange);
§A4.4 notes the desk beside the teller; the stats page (Prompt 38,
formerly 36) gains NET WORTH.

=== MOVEMENT TWO — THE INFRASTRUCTURE (THIS session) ===

 1. THE BIG-NUMBER LAW: one fmtCash() in ui/text.ts comma-formats
    every money render in the game ($1,234,567,890) — ATM, teller,
    shops, battle winnings, Dad's deposits, the stats page, the
    stepper preview. Sweep EVERY raw '$'+number concatenation onto
    it, and teach the validator to grep for stragglers (the
    placeholder-sweep pattern). JS numbers hold to 2^53 — vitest
    pins headroom at the edges and format goldens; the S14d stepper
    goes magnitude-aware off the same law (steps offer $10/$50/$100
    at three figures, $10K/$50K/$100K at six, onward — a
    billionaire never taps tens).
 2. THE TITLE REGISTRY: generalize S14d's deed/garnish flags into a
    property + vehicle registry on number flags (owned / garnish
    principal / paid per title; one active garnish; the loan
    officer's lines read the registry).
 3. THE INVESTMENT DESK lands COMPLETE behind its ch6_complete
    gate: UI on the ask/pick widgets, bonds + the five tickers as
    data, the seeded walk advancing on chapter flags, the portfolio
    on number flags — chapter sessions flip content, never build
    the system. The bot buys a bond and a ticker spread, kills the
    app, reloads, and the portfolio replays byte-equal.
 4. QUEUE EDITS in the same commit: S16's car section gains the
    COMET GT back room + valet; S16's airport section gains the
    Starhopper hangar; S15's row C notes the manor outclasses
    hotels on purpose (status, not function). The S14c chapter
    canon already carries the banknote/ducat beats.
 5. ICONS ONLY for the catalog rows (the ADR-032/034 provisional
    trinket-icon precedent) — the Manor, the GT, and the jet are
    CHAPTER content: no maps, no sheets this session.

QA: pre-flight + device row 22: format a nine-figure balance at the
ATM and step it by $10K; mature a bond across a chapter flip; read
five ticker prices twice off one seed; the §A9 table reads
end-to-end with every source named. Append the ADR (045: THE
FORTUNE ARC — the decree, the arc table, the desk, the registry,
the big-number law).

Done when: §A9 carries the WEALTH ARC table (Ch.1–3 untouched) with
sources named per chapter; fmtCash formats every money string under
a validator sweep with 2^53 headroom pinned; the stepper scales its
steps with the balance; the investment desk runs deterministic and
complete behind its gate; the title registry carries deeds, titles,
and one garnish at a time; catalog rows + icons exist for the
Manor, the Comet GT, and the Starhopper with their chapters
annotated; the queue edits landed; validator + vitest green;
browser loop and android:apk untouched.
```

## Prompt S15 — EVERY DOOR OPENS (the interior program + city vocabulary)

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
 C. Recovery — hospitals (a landmark-LARGE building in every town: wide
    footprint, instantly findable — but never required to be the tallest;
    big-city skylines out-build it), chapels, tea rooms, HOTELS
    (two-story template: lobby + upstairs hall of rooms; a paid bed =
    full restore + Sunny Side breakfast, the picnic system's indoor twin).
 D. Quest nodes — givers, delivery doors, clue rooms (the S9 gated-sign
    pattern IS the API).
 E. Collection — gift boxes (S9b sprites), libraries with readable §A11
    books, photo spots.
 F. Systems tutors — the gym teaches Guts (battle tutor fight), the
    STARPORT teaches the shmup (S10), THE CAGE and the LINKS run their
    tournaments (S12–S13).
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
 K. Civic clutter — bus stations (see S16), post office (Plummer's HQ),
    the SAVINGS & LOAN finally opens (teller line beats the ATM rate by
    $0 — §A11).
 L. Chapter set-pieces — one per chapter, big interiors (the Department
    was Ch.1's; Ch.5's palace + cinema are canon's).
CITY VOCABULARY (spritegen): hotel facade (2-story, awning + ROOMS sign),
hospital block (WIDE footprint, 2–3 stories — the prominent landmark, not
the skyline cap: office/apartment towers run taller in the big cities,
4–5 stories in Chandrapore), apartment walk-up (the Brickmore OPENS:
stair core + two flats), rooftop tile family. Brickton grows VERTICALLY
here (more upperRows variety on the existing grid — the 1995 stream stays
byte-identical; new content on rng3).
Done when: validator enforces the no-decorative-doors law; Brickton +
Otterbrook hit 100% open facades; the taxonomy doc lives at
docs/INTERIORS.md with every category seeded; hotel/hospital/walk-up
templates render in Sprite Lab; one ledger-callback interior is live.
```

## Prompt S16 — STATIONS & WHEELS (bus, bike, car — and the travel UI)

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

Run order: ~~S11~~ → ~~S11b~~ → ~~S12~~ → ~~S13 (the LINKS — DONE,
ADR-037/038)~~ → ~~S14 (THE GILDED GRIN — DONE, ADR-039: Chapter 2
complete on the phase machine, with picnics, hospitals, and the §A6
recovery exit; saves v7)~~ → **S14c** (the playtest four + THE WORLDS
OF SCALE: the Bible grows to TEN chapters — Jötunfjord's giants and
the Grand Duchy of Minimus land as canon, the scale seams land as
engine law, and S14c itself appends the two fully-written chapter
prompts to this queue) → **S14d** (the second playtest: the swirl
traffic-light, homesick-by-distance, Mom's in-person cure, the nine
callers, the §A7 drop contract, the 6:15 seats you, the storefront
walk-behind law, the drum-carry fix, the hitch hunt, the door
exit-latch, the ATM stepper,
the ATM-and-phone law, and THE FIRST NATIONAL — the S&L loan desk,
the car note, and 27 Maple on save v8)
→ **S14e** (THE FORTUNE ARC: the §A9 wealth decree — billions by the
finale on the giants' banknotes, the S&L investment desk, and the
collectors' market; the big-number law; HILLCREST MANOR, THE COMET
GT, and THE STARHOPPER as deeds on the title registry)
→ **S15–S16** make the world dense and
navigable, then Prompt 29 (Chapter 3: Foggybottom + Wintermoor + the
MAINFRAME on the phase machine — its summons-refill trigger is already
proven headlessly; it also plants the LOST CAT poster S14c canonized),
then **Prompt 30 (Ch.4 — THE FJORD THAT SLEEPS)** and **Prompt 31
(Ch.5 — THE GRAND DUCHY OF MINIMUS)** off the amended Bible, then the
renumbered 32+ (Africa onward) and the balance sim (Prompt 39,
formerly 37) once enough chapters exist to measure. S12 and
S13 are each big enough to split on their natural seam if a session runs
long (Appendix rule 2): core game first, tournament + rewards second.
The "big city like New York" ask maps onto canon:
**Chandrapore (now Ch.7, Prompt 33 after the renumber) is the game's
biggest city** — three ADR-012 districts, 4–5-story facades, the
palace/cinema/bazaar sprawl — and Brickton's vertical growth in S15
gives the US chapter its skyline (THE CAGE gives it its soundtrack of
chain-link and trash talk).
