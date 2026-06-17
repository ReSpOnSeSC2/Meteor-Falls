# 🗺️ Map Vibrancy & Transitional-World Plan

**Status:** Planning canon (S22, ADR-124). The forward standard that makes every
chapter's overworld VIBRANT, CREATIVE, full of TRANSITIONAL MAPS, with plenty to
do and a constantly-ALIVE, action-filled feel — applied to the shipped chapters
(retrofit) and required of every unlanded chapter (gate).

Built from a three-way review: the full GAME_BIBLE (§A5/A6/A7/A10/A4.18 + the
ADR amendments), an audit of the shipped maps (Ch.1–3), and the planning docs
(ENCOUNTERS, NEXT_PROMPTS, the asset packages, CUTSCENE_BLUEPRINT, DECISIONS).

> **The finding in one line.** Transitions in Ch.1 are now excellent (the Cage,
> the Docks, and the Costa golf resort each got a multi-screen approach). But the
> *living-world layer* is barely wired in the shipped chapters, and the planned
> chapters (4–10) have **no transitional/approach maps at all** — they jump from
> "vehicle arrives" straight to a settlement. This plan fixes both.

---

## 0. THE STANDARD — five laws every map answers to

Four are canon (the bible); the fifth is new, promoted from the Ch.1 work.

### Pillar 1 — The Enemy Flow Law (§A7)
Every enemy is a tiny interactive scene: **see the bit → touch the bit → play the
bit → remember the bit.** Each carries a MAP TELL (paces / hides / bargains /
chases / pretends to be furniture / guards a picnic table), a BATTLE HOOK, a
DROP with identity, and a flavor DEATH LINE. 20 per chapter as a local ecosystem
(4 road/field · 3 dungeon · 2 social · 2 rare · 2 late-pressure · 1 set-piece).

### Pillar 2 — The Quest Flow Law (§A10)
Five regional quests per chapter, one of each shape: **Arrival · Route ·
Dungeon-adjacent · Town-economy · Sincere.** Every quest is non-missable, leaves
a **local footprint** (an NPC moves, a shelf changes, a shortcut opens), a
**mechanical footprint** (item/discount/recipe), and a **finale footprint** (a
CALLER joins THE CALLING).

### Pillar 3 — The Living-World Layer (§A4.18, ADR-108)
Every overworld map carries atmosphere as DATA:
- **`ambience`** — a soundscape bed. The engine ships **eight**: `rain · wind ·
  waves · river · crowd · machine · birds · cave`. **Every outdoor/settlement map
  MUST declare one** (mapping tables below). New beds = engine work; default to
  the eight.
- **`reflect`** — water that mirrors the hero + nearby NPCs. Required on every
  map with standing water (harbour, river, pond, course hazard, ear-canal stream).
- **`idle` / `emote`** — standing NPCs BREATHE and pop a mood (🎵 💤 … ❗). The
  ambient-life minimum (below).
- **`muffle`** — indoor veil depth where a room wants it (boiler = DEEP).
- **Traffic** (ADR-067) — seeded cars/bikes/machinery on road cells; living
  ambiance + control-system borrow targets. Live Ch.3+.

### Pillar 4 — The Spacing & Breathing Law (§B4, ADR-049/055)
No building seals a walkway; organic irregular edges; NOOK variety (alleys,
vacant lots, rooftops, wooded pockets). **The Size Law:** every grown area EARNS
its size with content — a task, purposeful NPCs, a hidden reward in a nook, a
beat. New space without new things to do is empty.

### Pillar 5 — ⭐ The Approach Law (NEW — S22, ADR-121/122/123)
**No notable destination opens off a single door.** Every dungeon, special venue,
or district hub is reached through a SEQUENCE of transitional screens that build
toward it; every region-to-region move is a *walked journey*, not a cut. The
Ch.1 template, now shipped:
- 🏀 Brickton → **The Block → The Lot** → Cage Park → The Cage
- ⚓ Brickton → **The Warehouses → The Seawall** → Brickton Docks → boat
- ⛳ Puerto Sol → **The Coast Road → The Resort Gate** → Costa Estrella Links
- ⛰️ Otterbrook → Hill Road → **Hickory Trail → Whisperwood Rise** → crater

**The rule:** ≥2 transitional screens before every major hub; mid-region journeys
(caravans, night trains, switchback rides, sleeping-giant bodies, the Mars
descent) get their own screens with action on them — **travel is never a silent
corridor** (§B4 daybreak law).

### The ambient-life minimum (per map type)
| Map type | Ambient NPCs (idle/emote/wander) | Ambience bed | Reflect | Spawners |
|---|---|---|---|---|
| Town / city screen | ≥5 (≥2 wander, ≥2 idle+emote) | required | if water | cool (0–1.2) |
| Approach / route screen | ≥1–2 with idle/emote | required | if water | hot (1.5–4.5) |
| Dungeon room | 0 NPCs OK (the gimmick is the life) | required | if water | rising (1–4) |
| Threshold (gate/moor/ante) | ≥2 (it's a *place*, not a checkpoint) | required | if water | light |

---

## 1. SHIPPED CHAPTERS (1–3) — the liveliness retrofit (do now)

Transitions: ✅ no remaining one-door hubs. The work here is **Pillar 3** —
soundscape + ambient life on the maps that read dead. (Ambience uses the real
eight ids.)

### Ch.1 — Otterbrook & Brickton
| Map | Add ambient NPCs | `ambience` | `reflect` |
|---|---|---|---|
| `meadow_woods` (Whisperwood) | **2** — a forest-keeper (wander/idle, 🎵) + a lost hiker (wander, … ) — currently **0** | `birds` | — |
| `meadow_far` | +1 forager to pair the lone walker; give both idle/emote | `wind` | — |
| `meadow_overpass` | +1–2 travelers waiting for the city (idle, … ) — it's a threshold, not just a gate | `crowd` (city hum) | — |
| `hill_road` | +1 late hiker/researcher (idle, …) for the climb | `wind` | — |
| `otterbrook` | already vibrant (19 NPCs) — just add `birds` (park) | `birds` | the Pond Park |
| `brickton` | already a city — add `crowd` | `crowd` | — |
| The new approach screens (Block/Lot/Warehouses/Seawall) | already wired; Seawall has `waves`+reflect ✓ | — | — |

### Ch.2 — South America
| Map | Add ambient NPCs | `ambience` | `reflect` |
|---|---|---|---|
| `jungle_1` (Jungle Path) | **1** — a guide/tracker (idle, ❗) — currently **0** | `birds` | — |
| `jungle_2` (Deep Jungle) | **1** — an explorer/naturalist (wander, 🎵) — currently **0** | `birds` | — |
| `pyramid_ante` | **1** — an elder/archaeologist at the gate — currently **0** | `wind` | — |
| `puerto_sol` | vibrant already — add the bed | `waves` (or `crowd` for market) | the malecón |
| `valle_dorado` | 13 NPCs ✓ — add the bed | `crowd` (village) | — |
| `pyramid_1–4`, `apex`, `grotto` | dungeon — gimmick is the life | `cave` | — |

### Ch.3 — England
| Map | Fix | `ambience` | `reflect` |
|---|---|---|---|
| `foggy_moor` | **+2** — a shepherd (idle, 🎵) + a fog-walker (wander, …) — lonely with 1 | `wind` | — |
| `wintermoor_f1` | give the Librarian `idle`+`…`; add 1 wandering prefect | `crowd` | — |
| `wintermoor_f2` | give the Umpire `idle`+`…` (he's lost) | `machine` | — |
| `wintermoor_dorm` | give the student `idle`+`💤` (hiding) | `machine` | — |
| `wintermoor_boiler` | (no NPCs by design) | `machine`, `muffle: 2` | — |
| `foggybottom` | 4 NPCs ✓ | `river` (the Tyne) | the Tyne quay |
| `the_old_stones` | (ritual site — sparse OK) | `wind` | — |
| `wintermoor_grounds` | 4 NPCs ✓ | `crowd` (school) | — |
| `wintermoor_f3` (exam) | (boss approach — sparse OK) | `crowd` (low) | — |

**Effort:** ~a day of NPC + ambience wiring, landed chapter-by-chapter, each green
(the ADR-108 validator gates `ambience`/`emote`/`reflect` both directions).

---

## 2. PLANNED CHAPTERS (4–10 + Mars) — the per-chapter vibrancy roster

Each chapter below gets the thing the docs were missing: a **transitional-map
roster** (Pillar 5), a **liveliness spec** (Pillar 3, mapped to the real beds),
**things-to-do** (Pillars 1–2), and the **action set-pieces**. The levelkit forge
builds dungeon/settlement frames; this is the hand-authored vibrancy laid on top.

### Ch.4 — Norway · "The Fjord That Sleeps" (Whisperwig, 1,900 HP)
**Transitional roster (the scale-shift journey):**
`Lucille splashdown` → **KVISTHAVN HARBOUR** (cliffs, fishing boats) → **Kvisthavn**
town → **THE TREE LINE** (the scale-shift screen — wildlife visibly grows 10×) →
**Bootstep Moor** → **THE GIANT'S GATE** (you walk *under* a normal door) →
**Lilleby** (giants' town) → **THE SLEEPER'S FOOT** (approach to Storheim) →
**Sleeper's Spine**: hand → shoulder → ear (Resonance).
**Liveliness:** `waves`+reflect (harbour), `wind` (moor), `crowd` (Lilleby murmur
at 100× = low), `cave`+reflect (ear-canal drip/stream), a diegetic GIANT SNORE on
the Spine. Ambient NPCs: Kvisthavn fishers (idle, weather-watch); Lilleby Whistle
Guards (nervous ❗ as you pass); Storheim's rare yawn/twitch emote.
**Things to do:** #9 Sigrid's Spectacles (Route — pond-lenses), #10 The Unsent
Letter (Sincere — enormous pages, sincere delivery) + 3 expansion slots; the
Lilleby trading post; a giant-berry road-block puzzle.
**Set-pieces:** giant berries that block bridges until fought/rolled; Mia awakens
**Vibe Volt α** mid-Whisperwig.

### Ch.5 — Minimus · "The Grand Duchy" (Whiskerzilla, 2,150 HP)
**Transitional roster:** `Lucille lands ON the duchy` → **MINIMUS OUTSKIRTS** (the
crash, citizens panicking) → **PROCESSION WAY** (a careful multi-screen march —
Whistle Guards nudge you off the cathedral) → **Minimus Major** → **THE HEDGEROW
MOUTH** → **The Hedgerow** (a tabletop-garden maze dungeon) → **Ducal Crown**
approach (Resonance).
**Liveliness:** `crowd` (tiny squeaky murmur), `birds`/`wind` (Hedgerow), reflect
on Procession Way's polished basins. Ambient NPCs: citizens scurrying (quick
idle), courtiers posturing (formal idle), Whistle Guards (alert ❗). **Visual
scale tells** are the job here — the party is colossal; doors are knee-high.
**Things to do:** #11 The Royal Census (Arrival — count 100 who won't stand
still; Pippa's proof), #12 Civic Repairs (Economy — fix what Lucille crushed) + 3
slots; Pippa joins; Milo builds the **Big-Little Lens**.
**Set-pieces:** Tin Parade formation battle (Pippa's Pinpoint Mark turns chaos to
order); WHISKERZILLA gets *bored* (mercy ending).

### Ch.6 — Africa · "The Ruins That Laugh" (Laughing Sphinx, 2,300 HP)
**Transitional roster:** `Lucille` → **ZANZIBEL HARBOUR** → **Zanzibel bazaar**
(best market music in the game) → **THE CARAVAN MUSTER** → **SAVANNA CROSSING**
(a *multi-screen dusk journey* — the escort quest IS the road, 3 ambush waves) →
**THE DUNE APPROACH** (laughter from nowhere) → **Laughing Ruins** → Sphinx
forecourt (Resonance).
**Liveliness:** `crowd` (Zanzibel market), `wind` (savanna), echo-laughter via
`cave`/`wind` in the ruins, reflect on oases. Ambient NPCs: hagglers (🎵), caravan
guards (alert ❗), the eldest riddle-stone (it has a phone).
**Things to do:** #13 Stones That Speak (Dungeon-adjacent — 4 riddle stones,
teaches the Sphinx), #14 Watering-Hole Convoy (Route — the escort) + 3 slots;
**Teleport α unlocks** here.
**Set-pieces:** the dusk caravan waves; Mirage Vendors that sell fake items
*mid-battle*.

### Ch.7 — India · "The Cobra's Palace" (Cobra Raja, 3,200 HP)
**Transitional roster (the game's biggest city, 3 districts):** `night train`
→ **CHANDRAPORE STATION** → **Bazaar district** (maze) → **River Ghats district**
→ **Cinema block** (the diegetic meta-screen — a movie about your party) → **THE
NIGHT-TRAIN HEIST** (a *car-by-car* mobile dungeon, the Locket recovery) → **PALACE
APPROACH** (the grand staircase) → **Cobra Palace** → throne (Resonance).
**Liveliness:** `crowd` (bazaar), `river` (ghats) + reflect, `machine` (train
clatter), low `crowd` (palace). Ambient NPCs: hawkers (🎵), drowsy train passengers
(💤), formal palace servants. Traffic: rickshaws/carts in the bazaar.
**Things to do:** #15 Seven Spices (Economy — the Spice Box), #16 The Monkey Who
Stole Tuesday (Route — rooftop chase) + 3 slots; the brief Locket loss (≤30 min).
**Set-pieces:** the night-train heist; the disguise sneak past palace guards.

### Ch.8 — China · "The Paper Dragon" (Paper Dragon, 4,100 HP)
**Transitional roster:** `riverboat` → **LOTUS HARBOUR DOCK** → **Lotus Harbor**
(red/gold) → **THE RIVERBOAT** (a multi-screen scenic leg) → **river landing** →
**SPORE FOREST** (multi-screen, Mushroomized controls scramble) → **THE YAK
EXPRESS** (switchback ride screens) → **Mt. Shu approach** → **temple** → bell
(Resonance).
**Liveliness:** `waves`/`crowd` (harbour) + reflect, `river` (boat) + reflect,
`birds`/`wind` (spore forest), `wind`/`cave` (Mt. Shu), incense `muffle` indoors.
Ambient NPCs: harbour merchants, meditating monks (prayer emote), yak handlers.
**Things to do:** #17 Brushes of Mt. Shu (Dungeon-adjacent — teaches Mushroomize)
+ 4 slots; **Teleport β unlocks**; Pippa reads false paper folds.
**Set-pieces:** the Spore-Forest scramble; the Paper Dragon's self-immolation
burning phase.

### Ch.9 — Romania · "The Count of Valea Stelelor" (Hoaxula, 5,300 HP) — the heart
**Transitional roster:** `Orient Less-Express (3rd class)` → **VALEA STATION** →
**Valea Stelelor** (painted gates, haystacks, **Buni's lane**) → **THE OLD ROAD**
(wolf country — a *multi-screen dangerous traverse*) → **CASTLE APPROACH** (the
theme-park queue: gift shop, rope lines) → **Castle Hoaxula** → **THE MONASTERY
CLIMB** (a multi-screen reverent ascent) → **Stone Brow Monastery** → **Trial of
the Mute Mountain** (Dorin's solo, senses stripped) → bell tower (Resonance).
**Liveliness:** `wind` (valley/old road, distant wolf howl), `cave` (castle
creaks), `wind` (monastery, bell toll + chant), reflect on the Valea stream.
Ambient NPCs: warm villagers, **Buni humming over a pot**, nervous castle staff,
chanting monks. The writing *breathes* nearer the monastery (fewer jokes).
**Things to do:** #18 Buni's Table (Sincere — 5 ingredients → the Feast Basket;
her finale call **heals the full party**) + 4 slots; **Dorin joins**.
**Set-pieces:** the Old-Road wolf pack; Hoaxula's two-phase fight ending in
**Mia's Pray = mercy** (the quietest victory).

### Ch.10 — Alaska → Hawaii → MARS · "The Long Shot" (The Hush, 6,000 HP)
**Transitional roster:** `snow-cat` → **AURORA APPROACH** (ice, aurora) → **Aurora
Station** (the generator gauntlet; **Frost Sentinel**) → **THE ICE FIELD** (Frost
Wraiths hunt — a route screen) → *(ferry)* → **MAUNA LANI APPROACH** → **Mauna
Lani** (launch pad + a second golf nine, the Costa precedent) → **THE VOLCANO
RIM** (**Tiki Magma Golem**, fought ON the caldera) → **THE LONG SHOT** (rocket
interior; phone Mom, played straight) → **MARS LANDING** → **Sea of Silence Z1 →
Z2 → Z3** (the *sound-stripping descent* — one instrument layer lost per screen) →
**THE HUSH CORE** (Resonance, the 10th Ember).
**Liveliness:** `wind` (Alaska), `waves`/`wind` (Hawaii), **NO ambience on Mars —
the silence is the point** (the bed strips: drone → heartbeat → void). No ambient
NPCs on Mars (it's dead); the Hush presence pops *wrongness* emotes. Interface
glitch FX (Movement 2). The Homesong returns, one stem per caller, in THE CALLING.
**Things to do:** #19 Lights of Aurora (Route), #20 The Last Wave (Sincere — the
surf legend's board); the **14th Mr. Click photo**; the cross-world chains
resolve (Dad's Postcards, the Hint Stand, the Homesong Recordings, the Lost &
Found).
**Finale:** three movements — The Static → The Quiet → **THE CALLING** (every
helped NPC phones in; the player types their own name; the Homesong plays whole).
**Epilogue:** the quiet walk home — Otterbrook in daylight, the **House Key**,
unlock the door. Credits over Mr. Click's album.

---

## 3. CROSS-CUTTING — the arcs that keep the whole journey alive

These run *through* the regions and must surface on the maps, not just in text:
- **The Trust Thread** (Jay's free-will mirror): opens Ch.3 (others see him
  PUPPET), slow-burns Ch.4–7, climaxes Ch.7→8 (the Hush splits the party),
  resolves Ch.9–10.
- **The Clicker Question** (Milo's blame mirror): seed Ch.5 → crisis Ch.7 →
  public clearing Ch.8.
- **The Army Arc** (General Buckle): misread → checkpoint Humvee → helmeted tank
  (route around) → **F-15 flyover set-piece** → clearing (he becomes a caller).
- **The Disguise/Costume Sneaks:** Smilers (Ch.1), palace guards (Ch.7),
  Hoaxula's cast (Ch.9) — getting "made" is a FIGHT, never a fail.
- **The five cross-world chains** (Pillar 2's glue): Mr. Click's Album, Dad's
  Postcards, the Traveling Hint Stand, the Homesong Recordings, the Lost & Found
  of Impossible Sizes — each appears region after region.

---

## 4. ENFORCEMENT — make the standard stick (recommended validator gates)

So vibrancy can't silently regress, add these to the content validator as each
chapter lands (mirrors how the Cage/Docks/Golf chains are pinned):
1. **Ambience coverage:** every non-interior canon map declares an `ambience`
   from the eight (warn on any outdoor map with none).
2. **Approach-chain pin:** every chapter manifest lists ≥2 transitional/approach
   maps between its arrival and its dungeon/hub (the Pillar-5 gate), pinned both
   directions like `hoops`/`links`/`ch2`.
3. **Ambient-life floor:** every settlement map has ≥5 NPCs with ≥2 `wander` and
   ≥2 `idle`+`emote`; every route/threshold ≥1 with `idle`/`emote`.
4. **Reflect-on-water:** any map whose grid contains sea/river tiles in an open
   pool carries a `reflect` rect over it.
5. **Picnic law:** ≈3 picnic tables per chapter, placed *before* dungeons.

---

## 5. SEQUENCING — how to build it

1. **Now (shipped, low-risk):** the §1 liveliness retrofit for Ch.1–3 — ambient
   beds + the dead-map NPCs + reflections. Land chapter-by-chapter, each green.
2. **Add the enforcement gates** (§4) so the standard is enforced going forward.
3. **Per unlanded chapter (4→10), at promotion:** forge the dungeon/settlement
   frames (levelkit), then hand-author this chapter's **transitional roster**
   (§2) + liveliness spec + the 5 quests + the set-pieces, validated against the
   §4 gates. The chapter isn't "shipped" until it clears the vibrancy checklist.

### The per-chapter vibrancy checklist (definition of done)
- [ ] ≥2 transitional/approach screens before each major hub (Pillar 5)
- [ ] every outdoor/settlement map declares an `ambience` bed (Pillar 3)
- [ ] reflections on all standing water (Pillar 3)
- [ ] ambient-life floor met on every map (Pillar 3 table)
- [ ] 20-enemy ecosystem with map-tells (Pillar 1)
- [ ] 5 quests (Arrival/Route/Dungeon/Economy/Sincere), each a caller (Pillar 2)
- [ ] ≈3 picnic tables, placed before dungeons (Pillar 4)
- [ ] the chapter's set-piece(s) + the active cross-cutting arc beat
- [ ] no dead stretch; every grown area earns its size (Pillar 4)
