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
recovery exit; saves v7)~~ → **S15–S16** make the world dense and
navigable, then Prompt 29 (Chapter 3: Foggybottom + Wintermoor + the
MAINFRAME on the phase machine — its summons-refill trigger is already
proven headlessly) and the balance sim (Prompt 37) now that TWO chapters
exist to measure. S12 and
S13 are each big enough to split on their natural seam if a session runs
long (Appendix rule 2): core game first, tournament + rewards second.
The "big city like New York" ask maps onto canon:
**Chandrapore (Ch.5, Prompt 31) is the game's biggest city** — three
ADR-012 districts, 4–5-story facades, the palace/cinema/bazaar sprawl —
and Brickton's vertical growth in S15 gives the US chapter its skyline
(THE CAGE gives it its soundtrack of chain-link and trash talk).
Then return to the Bible's Part C order at Prompt 28 (Chapter 2) — Puerto
Sol and Valle Dorado inherit ADR-012, the §B4 city tests, the S4 shop
pattern, AND the S12 interior taxonomy automatically — and run the balance
sim (Prompt 37) once two chapters exist to measure, as planned.
