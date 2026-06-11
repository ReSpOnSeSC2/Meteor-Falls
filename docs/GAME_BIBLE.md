# ☄️ METEOR FALLS
## The Complete AI Prompt Build Guide — A Production-Ready EarthBound-Style Mobile RPG

> **How to use this document:** This file is both the **Game Design Bible** (Part A–B) and the **Prompt Sequence** (Part C). Step 1 of the build is committing THIS file into your repo as `docs/GAME_BIBLE.md`. Every prompt afterward tells Claude Code to read the Bible — that's how we get real content with **zero mock data**. Work through the 44 prompts in order. Each has acceptance criteria; don't move on until they pass.

---

# PART A — GAME DESIGN BIBLE

## A1. Pitch

**METEOR FALLS** is a turn-based RPG in the spirit of MOTHER 2 / EarthBound: 90s Americana, four kids, psychic powers, absurdist humor, rolling-odometer HP, and a cosmic horror at the end of the road. It begins in a sleepy Ohio town and becomes a journey across **nine countries and one planet** — America, South America, England, Africa, India, China, Romania, Alaska, Hawaii — finishing **on Mars**.

- **Platform:** Android phone, landscape, virtual D-pad + Bluetooth controller support
- **Engine:** Phaser 3 + TypeScript + Vite, packaged with Capacitor
- **Length:** 4–6 hours main story, +3 hours of side quests, 8 chapters, 8 bosses
- **Themes:** friendship, family, faith, and growing up — the meteor took something from the world (its *Vibe*), and four kids put it back

## A2. Story Synopsis

**The Night It Fell.** Summer, 1995. **REX**, a quiet 12-year-old in **Otterbrook, Ohio**, is woken at 2 AM by a roar — a meteor has slammed into **Hickory Hill** behind his house. At the crash site he meets **GLINT**, a firefly-like star-creature who escaped the meteor's true passenger: **THE HUSH**, an entity that devours *Vibe* — the warmth between living things. Where the Hush spreads, people stop calling their moms, dogs stop greeting their owners, and music goes flat. Glint prophesies that **four kids carrying the old light** can silence it, hands Rex the **Star Locket**, and is promptly fried by the neighbor's bug zapper mid-prophecy ("...tell the girl who prays— *BZZT*").

**The Quest.** The meteor shattered into **Eight Embers** that scattered along the Hush's path around the globe. Each Ember rests at a **Resonance Site** guarded by something the Hush has corrupted. When Rex holds the Locket at a Site, it records a **Heartlight** — one-eighth of the **Homesong**, the only frequency the Hush cannot devour. Collect all eight, ride a homemade rocket to Mars, and play the Homesong into the dark.

**The Ending.** The Hush cannot be beaten by bats and bottle rockets alone. In the final battle, **MIA PRAYS** — and every NPC the party helped across the world (every completed side quest) answers a ringing phone, one by one, and sends their Vibe to Mars. Friendship, family, and faith literally win the fight. Replay value = more side quests done = more callers = an easier final battle and extended credits.

## A3. The Four Heroes

| | **REX** | **MIA** | **MILO** | **DORIN** |
|---|---|---|---|---|
| Archetype | Ness — silent psychic hero | Paula — psychic + **Pray** | Jeff — gadget genius, no Vibe | Poo — monastery martial artist |
| Age / Home | 12, Otterbrook, USA | 11, Brickton, USA | 12, Wintermoor Academy, England | 13, Stone Brow Monastery, Romania |
| Joins | Ch.1 (start) | Ch.1 end (rescued in Brickton) | Ch.3 (crashes his rocket into the Academy greenhouse to reach you) | Ch.7 (after the Trial of the Mute Mountain) |
| Weapon line | Baseball bats | Frying pans | Air rifles + Bottle Rockets | Prayer-bead bracelets (fists) |
| Specialty | Vibe Surge (signature nuke), Lifeup, Shield, Teleport | Vibe Fire/Freeze/Volt, **PRAY** | Spy, Repair Gizmos, Bottle Rockets, Multi-target tech | Vibe Comet (Starstorm analog), Mirror, Brainjam |
| Personality | Silent. Nods. Eats too many corn dogs. | Kind, steel-spined, hears the Embers sing | Talks to machines more than people; tea snob | Speaks formally; baffled by vending machines |

**Stats:** Offense, Defense, Speed, Guts (crit % + chance to survive mortal blow at 1 HP), Vibe (power of Vibe abilities), Luck. HP/PP grow per level via per-character growth curves (defined in A9 balancing tables).

> *(Amended 2026-06-11 per Appendix rule 6, ADR-023: the second hero, formerly
> Faye, is canonically named **MIA**. Internal engine ids stay `faye` — saves,
> flags like `faye_joined`, and dialogue keys are frozen identifiers.)*

### Mia's PRAY — the high-variance faith mechanic (canon, do not change)

Costs 0 PP. Rolls once per use on this table (weights shift +5% toward better tiers every 15 levels of Mia, and Guts adds ±1% per 10 Guts):

| Roll | Tier | Effect |
|---|---|---|
| 10% | **Miraculous** | Full party HP+PP restore AND heavy holy damage to all enemies |
| 20% | **Wonderful** | Big damage to all enemies OR big party heal (whichever is more needed) |
| 30% | **Good** | Moderate heal to party or moderate damage to all enemies |
| 25% | **Nothing** | "Mia prayed with all her heart... but nothing happened." |
| 10% | **Strange** | Random status effect on a random combatant — *including allies* |
| 5% | **Backfire** | Soft light flares; party takes small damage or one ally dozes off |

In the final battle, Pray becomes **scripted** (see A8, Chapter 8).

### Vibe ability unlock tables (abridged — full PP costs in data files, Prompt 9)

- **Rex:** Vibe Surge α (L1) /β (L16) /γ (L31) /Ω (L47); Lifeup α/β/γ (L3/L20/L38); Shield α/Σ (L9/L33); Flash α (L24); Hypno α (L6); **Teleport α (L26, story-gated Ch.4) / Teleport β (Ch.6)**
- **Mia:** Vibe Fire α–Ω (L1/15/29/44); Vibe Freeze α–Ω (L4/18/32/46); Vibe Volt α–γ (L10/26/40); Magnet α (L8); **Pray (L1)**
- **Dorin:** Vibe Comet α (joins) / Ω (L52); Vibe Freeze line shared; Mirror (joins); Brainjam α/Ω (L40/50); Healing α–γ
- **Milo:** No Vibe. **Spy** (reveals enemy HP/weakness), **Repair** (turns Broken Gizmos found in the world into working battle items overnight when sleeping), Bottle Rocket tiers (single → Big → Multi)

## A4. Core Systems (the EarthBound DNA)

1. **Rolling Odometer HP.** HP/PP tick down like a mechanical odometer (~2 digits/sec). A mortal hit can be outraced by healing or by *winning the battle* before the meter hits zero. This is the single most important feel-mechanic — Prompt 13 is dedicated to it.
2. **Visible overworld enemies, no random encounters.** Touch an enemy to battle. Back-attacks give them a green-swirl first strike; you get red-swirl priority by touching them from behind. If your party vastly outlevels the enemy: **instant auto-win** screen, no battle.
3. **Save = Call Your Dad.** Phones (home phones, payphones, banana-shaped novelty phones, a yak with a satellite dish in China) let you call **Dad**, who saves the game ("Have you been eating well, champ?"), tracks playtime, and occasionally insists you take a break. **3 save slots.**
4. **Money = Dad's deposits.** Battle winnings are deposited by Dad into the **Otterbrook Savings & Loan** card, withdrawn at ATMs worldwide. Mom's home cooking (your favorite food, chosen at game start) cures **Homesickness** — a status Rex randomly contracts that makes him skip turns daydreaming about Mom's cooking. Call Mom to cure it.
5. **Picnic.** At picnic tables scattered through every region (≈3 per chapter), use a **Picnic Basket** item: full party HP/PP restore + the **Sunny Side** buff (+10% all stats for the next 5 battles). Baskets are bought (Basic), assembled at delis from 3 regional foods (Family), or earned from Buni's quest (Feast — adds auto-revive once). Tables are placed *before* dungeons — finding one is strategy.
6. **Teleport.** Rex learns Teleport α (run-up required — on touch, hold the D-pad to sprint a circle; with a controller, hold the stick) to revisit any visited town. Teleport β (Ch.6) needs only a short dash. Crashing into walls = comic soot-faced failure.
7. **Death & Angels.** Hitting 0 HP makes a hero **unconscious**; if the whole party drops, Rex wakes at the last Dad-save with **half his cash on hand** (banked money is safe). Fallen party members trail behind Rex as **little haloed angels** — visible on the overworld, unusable in battle — until revived at a **hospital** (or **Healing γ / Hallelujah-tier prayer items**).
8. **Status effects:** Sunburn (poison-over-time), Crying (can't aim — gnats, onion ghosts), Asleep, Paralyzed, Homesick (Rex only), **Hushed** (silenced — no Vibe), Mushroomized (Ch.6 spore forest — controls scramble until cured at a doctor).
9. **The Star Locket.** Key item UI: shows Embers collected (0–8) and plays the growing Homesong on the pause screen — one more instrument layer per Ember.

## A5. The World Route & Travel

| Ch. | Region | Locales | Travel in |
|---|---|---|---|
| 1 | 🇺🇸 America | Otterbrook → Hickory Hill → Brickton City | On foot / city bus |
| 2 | 🇵🇪 South America | Puerto Sol → Valle Dorado → Gilded Ruins | Banana cargo ship |
| 3 | 🏴 England | Foggybottom-on-Tyne → Wintermoor Academy → The Old Stones | Uncle Bert's biplane "Lucille" |
| 4 | 🌍 Africa | Bazaar port of Zanzibel → Savanna crossing → Laughing Ruins | Lucille again (she barely makes it) |
| 5 | 🇮🇳 India | Chandrapore bazaar → River ghats → Cobra Palace | Overloaded night train |
| 6 | 🇨🇳 China | Lotus Harbor → Spore Forest → Mt. Shu Temple | Riverboat + the Yak Express |
| 7 | 🇷🇴 Romania | Valea Stelelor village → Castle Hoaxula → Stone Brow Monastery | The Orient Less-Express (third-class) |
| 8 | 🇺🇸→🌋→🔴 | Aurora Station, Alaska → Mauna Lani launch pad, Hawaii → **MARS: The Sea of Silence** | Snow-cat, then Professor Pemberton's rocket *The Long Shot* |

The world FEELS open: every region has off-path screens, optional caves, side quests, and once Teleport unlocks (Ch.4) the whole visited world reopens — but the Ember trail keeps the story linear and completable.

## A6. The Eight Chapters & Eight Bosses

> Boss stat lines are canon starting values; Prompt 31–38 wire them. Format: **HP / signature gimmick**.

### Chapter 1 — "The Night It Fell" (USA) — target end level: 8

Tutorial-by-doing. Meteor crash, Glint's prophecy and death-by-bug-zapper, the neighbor kid **Chad Pickle** (Pokey analog) tags along then betrays you twice before lunch. Rex crosses Hickory Hill, takes the bus to **Brickton City**, and rescues **Mia** from the **Department of Smiles** — a cult of unsettlingly cheerful adults in blue blazers ("Have a PRODUCTIVE day!") who've been Hushed.

**Resonance Site:** Hickory Hill crater. **BOSS 1 — THE TITANIC TICK** (450 HP / latches onto a hero and drains HP each turn until hit with Vibe Fire or a thrown Salt Shaker).

### Chapter 2 — "The Gilded Grin" (South America) — target level: 13

Banana boat to **Puerto Sol**. The mountain village **Valle Dorado** worships a golden idol that recently "started granting wishes" (it eats Vibe as payment — wishers go gray and quiet). Llama-herding side content, jungle paths, step-pyramid dungeon with rotating-floor puzzles.

**Resonance Site:** pyramid apex. **BOSS 2 — IDOL OF THE GILDED GRIN** (980 HP / alternates between SOLID GOLD form (physical immune — use Vibe) and HOLLOW form (Vibe immune — swing bats); telegraphs the swap by grinning wider).

### Chapter 3 — "A Very Foggy Term" (England) — target level: 18

**Milo joins**, crash-landing his homemade rocket into his own school's greenhouse. Wintermoor Academy's mainframe — installed to "optimize student happiness" — has been Hushed and runs the school like a factory; the fog outside is *machine-generated*. Stealth-lite dorm sneaking, library side quests, tea that restores PP.

**Resonance Site:** The Old Stones (a pocket Stonehenge). **BOSS 3 — HEADMASTER MAINFRAME** (1,600 HP / summons two Prefect Drones each time both are down; Milo's Spy reveals its cooling fan weak point — Vibe Freeze doubles damage).

### Chapter 4 — "The Ruins That Laugh" (Africa) — target level: 24

Port city **Zanzibel** (best market music in the game), caravan escort across the savanna at dusk (waves of hyena-ish enemies), then desert ruins where laughter echoes from nowhere. **Teleport α unlocks here** (taught by a retired courier mystic, "The Fastest Man in Zanzibel, 1961").

**Resonance Site:** the Sphinx's chin. **BOSS 4 — THE LAUGHING SPHINX** (2,300 HP / opens with a riddle — answer via menu choice; correct = skip its first 3 turns, wrong = party starts Crying. Riddles drawn from a pool of 8 for replays).

### Chapter 5 — "The Cobra's Palace" (India) — target level: 30

**Chandrapore**: the game's biggest city — bazaars, river ghats, a cinema playing a movie *about your party* (nobody believes you're them). The Maharaja's palace has been usurped by his royal vivarium. Night-train heist sequence to recover the stolen Locket (story beat: brief item loss, 30 minutes max).

**Resonance Site:** palace throne. **BOSS 5 — COBRA RAJA** (3,200 HP / Paralyzing gaze every 3rd turn — block with Shield Σ or Mia's Magnet; sheds skin once at 40% HP, restoring 800 — burn it down fast through the threshold).

### Chapter 6 — "The Paper Dragon" (China) — target level: 37

Riverboat to **Lotus Harbor**, through the **Spore Forest** (Mushroomized status — controls scramble), up the Yak Express to **Mt. Shu Temple**, where monks fold paper guardians. The Hush got into the paper. **Teleport β unlocks** (temple elder: "You run too much. Run less.").

**Resonance Site:** temple bell. **BOSS 6 — THE PAPER DRAGON** (4,100 HP / immune to physical while airborne; Vibe Volt or Bottle Rockets knock it down for 2 turns; casts Vibe Fire on ITSELF when low — it's paper — entering a desperate burning phase with doubled speed).

### Chapter 7 — "The Count of Valea Stelelor" (Romania) — target level: 45

The emotional heart. **Valea Stelelor** ("Valley of the Stars") — painted gates, haystacks, a grandmother named **Buni** who feeds the party until their HP overflows and gives the **Feast Basket** recipe quest. A "vampire," **Count Hoaxula**, terrorizes the valley from his castle — he's actually a Hushed theme-park actor from Cleveland whose haunted-castle attraction went bankrupt, now armed with very real stolen Vibe. Meanwhile Rex's group is summoned up the mountain: **Dorin** completes the **Trial of the Mute Mountain** at Stone Brow Monastery (playable solo sequence: Dorin meditates while the mountain "deletes" his senses one by one — screen goes dark, then silent, then UI vanishes — until he releases his fear) and **joins the party**.

**Resonance Site:** monastery bell tower. **BOSS 7 — COUNT HOAXULA** (5,300 HP / two phases: Theatrical phase — fake spells, real damage, steals one equipped item (returned on win); Unmasked phase at 50% — sobbing Cleveland accent, attacks become wild AoE; Mia's Pray "Good" tier or better instantly ends his second phase in mercy — the game's quietest victory).

### Chapter 8 — "The Long Shot" (Alaska → Hawaii → MARS) — target level: 52–55+

The Locket holds 7 Embers; the 8th never landed on Earth. **Aurora Station, Alaska** (mini-boss: **FROST SENTINEL**, 2,800 HP) decodes its position: Mars. **Professor Pemberton** (Milo's estranged dad, Dr. Andonuts analog) needs parts ferried to **Mauna Lani, Hawaii** (mini-boss: **TIKI MAGMA GOLEM**, 3,000 HP — fought *on* the volcano that powers the launch). Phone Dad. Phone Mom. She says she's proud of you. Launch.

**Mars — The Sea of Silence:** a dread-soaked final dungeon where the music thins out instrument by instrument as you walk. The 8th Ember sits in the Hush's core.

**FINAL BOSS — THE HUSH** (effectively unkillable by damage / three movements):

1. **The Static:** a normal-looking fight against its shell (6,000 HP) — beatable conventionally.
2. **The Quiet:** attacks "cannot be grasped." Damage does almost nothing. The UI itself glitches. Survival turns.
3. **THE CALLING:** **PRAY appears as Mia's only command.** Each scripted Pray makes a phone ring somewhere on Earth — and *every side-quest NPC you helped* answers, sends their Vibe, and deals massive scripted damage (base allies: Mom, Dad, Buni, Pemberton, Chad Pickle — yes, even Chad). More side quests completed = more callers = fewer survival rounds. Final Pray: the player is asked to **say the player-name they entered at the start** (text confirm), the Homesong plays in full, and the Hush — for the first time — hears something it cannot eat.

## A7. Enemy Roster (48 standard enemies — canon names/stats; full movesets in data files, Prompt 10)

| Ch | Enemies (HP / quirk) |
|---|---|
| 1 | Cranky Mailbox (24/spits letters), Runaway Lawnmower (38), Coily Cicada (30/Sunburn), Blazer Smiler (55/"productive" debuff), Pigeon Gang (45/steals one food item), Hill Slug Deluxe (60) |
| 2 | Pickpocket Parrot (70/steals cash), Gilded Beetle (85/gold form), Cursed Souvenir (95/Crying), Step-Mask (110/Shield), Banana Bunch United (5×22), Jungle Jitterbug (120/Paralyze) |
| 3 | Prefect Drone (130), Possessed Textbook (115/Hushed status), Fog Hound (150), Tea Poltergeist (90/heals allies), Cricket Eleven (11×14, attacks in "overs"), Greenhouse Creeper (170) |
| 4 | Cackling Hyena (180), Mirage Vendor (160/sells fake items mid-battle), Scarab Sergeant (210), Dust Devilkin (190/blinds), Riddling Head (170/asks mini-riddles), Sun-Stroked Statue (240/Sunburn aura) |
| 5 | Bazaar Bull (260/charges), Monkey Magnate (220/steals equipped hat), Hypno Flautist (240/Asleep), Palace Peacock (280/Flash), Spice Spirit (230/random element), Rail Bandit (300) |
| 6 | Paper Crane Swarm (6×40), Mush Uncle (290/Mushroomize), Porcelain Warrior (340/shatters into 2), River Serpentlet (310), Incense Wisp (270/PP drain), Terracotta Understudy (380) |
| 7 | Haystack Mimic (360), Moss Strigoi (400/HP drain), Castle Bat Choir (5×60/Crying), Animated Armor of Hoaxula (450), Mămăligă Blob (380/splits), Wolf of the Old Road (470/calls pack) |
| 8 | Frost Wraith (480), Hush Static (520/Hushed), Null Walker (560/"cannot be grasped" 25% of hits), Ember Mimic (500/disguised as the pickup), Gravity Gremlin (450/reverses turn order), Silent Choirboy (3×180/heals Hush enemies) |

Every enemy has: sprite, 2–4 moves, weakness tag, EXP/cash/drop-table, and one **flavor death line** ("The Cranky Mailbox returned to sender.").

## A8. Items (canon catalog — ~90 items; full prices/stats in data files, Prompt 10)

**Weapons** — Rex's bats: Cracked → T-Ball → Sandlot Slugger → Aluminum → Hall-of-Famer → *Casey's Last Swing* (Ch.8 drop). Mia's pans: Hand-Me-Down → Copper → Cast-Iron → Chef's → *The Holy Pan*. Milo's guns: Pellet Popper → Spud Gun → Double-Barrel Sparker → *Gauss Lobber*; Bottle Rocket / Big / Multi (consumables). Dorin: Cedar Beads → River Beads → *Comet Bead* (1/128 drop, Null Walker — the chase chase).

**Armor:** regional hats (Otterbrook Cap → Cricket Cap → Turban of Calm → Paper Crown → Cushma → Fur-Lined Hood), bracelets, pendants (elemental resists), *Star Pendant* (Ch.7).

**Food (HP):** Corn Dog, PB&J, Alfajor, Scone & Clotted Cream, Jollof Bowl, Samosa, Baozi, **Sarmale**, **Mămăligă cu Brânză** (best HP/$ in the game — Buni's), Akutaq, Poke Bowl, Freeze-Dried Ice Cream (Mars vending machines).

**PP:** Star Cola line, Monastery Tea, Temple Incense. **Cures:** Salt Shaker (anti-Tick!), Aloe Leaf (Sunburn), Hanky (Crying), Doctor's Note (Mushroomize), Mom's Voice Tape (Homesick, 3 uses).

**Battle items:** Bottle Rockets, Firecracker String, Bug Zapper (irony — heavy vs insects), Glint's Spark (revive, rare). **Picnic Baskets:** Basic / Family / Feast.

**Key items:** Star Locket, 8 Embers, ATM Card, Lucille's Spare Propeller, Train Ticket (3rd class), Yak Treats, Monastery Bell Clapper, Rocket Manifest, **Player's House Key** (it matters at the very end: the post-credits scene is just... walking home and unlocking the door).

## A9. Balancing & Playtime Targets (canon — Prompt 42 verifies)

- EXP curve: `EXP(L) = 4·L³ ÷ 3` (faithfully grindy). Expected per-chapter levels listed in A6; if testers arrive >4 under target, enemies en route get +15% EXP.
- Main story: 4.5–6 hr (8 chapters × 30–45 min). Side quests: +3 hr. Boss attempts budgeted at 1.5 avg (grindy difficulty = some party wipes are expected and fine — that's EarthBound).
- Cash economy tuned so a full equipment refresh per region costs ≈ 2 chapters of battle income → choices hurt a little, like 1995.

## A10. Side Quests (16 — each one adds a CALLER to the final battle)

| # | Quest (chapter) | Reward + Caller |
|---|---|---|
| 1 | **Biscuit, Come Home** (1): track a lost beagle across 3 screens by sniff-clues | Lucky Collar; Caller: Mrs. Pemmel |
| 2 | **Mail Must Move** (1): finish Mr. Plummer's route, 5 doors, one guarded by the Lawnmower | Fresh Stamps (sell high); Caller: Mr. Plummer |
| 3 | **Lemonade Empire** (1): supply run for twin sisters **Ana & Vivi**'s stand | Infinite free lemonade at the stand (small HP); Callers: Ana & Vivi |
| 4 | **Arcade Legend** (1, replayable): beat the Brickton arcade high score (playable mini shoot-'em-up) | Champion Jacket; Caller: arcade owner |
| 5 | **The Llama Drama** (2): herd 6 llamas, each with a personality, one of which is a disguised enemy | Wool Poncho; Caller: herder Tomás |
| 6 | **Museum of Almost-Gold** (2): photograph 4 fake idols for a skeptical curator | Camera Flash (battle Flash item); Caller: curator |
| 7 | **Overdue** (3): recover 3 library books from students-turned-drones | Library Card (free PP tea refills); Caller: librarian |
| 8 | **The Groundskeeper's Cuppa** (3): brew his exact tea order (find 3 ingredients) | Thermos (carry a hot tea = portable PP); Caller: groundskeeper |
| 9 | **Stones That Speak** (4): solve 4 riddle stones across the savanna | Riddle Ring (+10 Vibe); Caller: the eldest stone (it has a phone, don't ask) |
| 10 | **Watering Hole Convoy** (4): escort animals at dusk, 3 ambush waves | Canteen of the Crossing; Caller: caravan master |
| 11 | **Seven Spices** (5): scavenger hunt through Chandrapore's bazaar maze | Spice Box (cooked foods heal +50%); Caller: spice merchant |
| 12 | **The Monkey Who Stole Tuesday** (5): chase the Monkey Magnate over rooftops | Your hat back + Monkey Paw Charm (+Luck); Caller: the monkey (breathing only) |
| 13 | **Brushes of Mt. Shu** (6): retrieve the calligrapher's 3 brushes from the Spore Forest | Scroll of Calm (cures Mushroomize, reusable); Caller: calligrapher |
| 14 | **Buni's Table** (7): gather 5 ingredients across the valley for the true Feast Basket | **Feast Basket recipe** (craft at any deli) + she calls you "puiul meu"; Caller: **Buni** (her call in the finale heals the full party) |
| 15 | **Lights of Aurora Station** (8): restore 3 generators while Frost Wraiths hunt | Insulated Suit; Caller: station chief |
| 16 | **The Last Wave** (8): find the surf legend's lost board inside the volcano approach | Board of Legends (Rex's funniest weapon, sidegrade); Caller: surf legend |

Plus **Mr. Click**, a photographer who ambushes the party for a photo 12 times worldwide ("Say fuzzy pickles— I mean, cheese!") → photo album rolls during the credits.

## A11. Tone & Writing Rules (every prompt that writes dialogue must obey)

1. Full EarthBound absurdism: enemies apologize, signs editorialize, NPCs have exactly one weird obsession each.
2. Sincerity is never the joke. Buni, Mom's phone calls, Dorin's trial, and the finale are played straight.
3. The Hush is never funny. Its dialogue is sparse, lowercase, and wrong-feeling: "you came so far. it was quiet here. why."
4. Faith is treated warmly and lightly — Pray's flavor text is hopeful even on "Nothing."
5. Battle text in classic second person: "Rex tried the Casey swing! SMAAAASH!! 412 damage!"

---

# PART B — TECHNICAL ARCHITECTURE (decisions are final; prompts assume them)

## B1. Stack

| Layer | Choice | Why |
|---|---|---|
| Engine | **Phaser 3.80+ / TypeScript / Vite** | Your stack muscle (TS/Vercel), huge ecosystem, perfect for tile RPGs |
| Mobile shell | **Capacitor 6 → Android APK/AAB** | One codebase; WebView supports Gamepad API for Bluetooth controllers |
| Maps | **Tiled** (.tmj JSON), 16×16 tiles @ 3× zoom, landscape 16:9 | EarthBound-scale readability on a phone |
| State | Plain TS game-state singleton + event bus (no React) | Phaser scenes own rendering; state stays serializable for saves |
| Saves | **IndexedDB** via `idb`, 3 slots + 1 rolling auto-backup, versioned schema with migrations | Survives app updates; localStorage fallback |
| Content | **100% data-driven** in `/src/data` (enemies, items, abilities, shops, dialogue, quests, encounter tables) validated by **Zod** schemas at build time — authored as typed TS modules whose types are `z.infer`'d from `src/schemas`, not JSON files; the Tiled loader will parse its JSON through the same schemas *(amended 2026-06-10 per Appendix rule 6, ADR-004/ADR-017)* | "No mock data" enforced by CI: `tools/content-validate.ts` fails the build if any entity in the Bible is missing |
| Audio | OGG music + SFX, generated in-repo (see B3), played via Phaser sound, ducking system for jingles | |
| Art | CC0 16-bit asset packs + AI-generated sprites unified by a **64-color master palette** and an `npm run art:check` palette-conformance script (see B3) | Easiest path to production quality |
| Input | Virtual D-pad + A/B/Start overlay **and** Gamepad API (auto-hides touch UI when a controller connects) | Your requirement #3 |
| CI | GitHub Actions: typecheck, Zod content validation, Vitest unit tests (battle math), Playwright smoke run, debug-APK artifact | Production ready means provable |

## B2. Repo layout (Prompt 1 creates this exactly)

```
meteor-falls/
├── docs/GAME_BIBLE.md          # THIS FILE — canon
├── docs/DECISIONS.md           # running ADR log Claude Code appends to
├── src/
│   ├── main.ts                 # Phaser boot
│   ├── scenes/                 # Boot, Title, Overworld, Battle, Menu, Dialogue, SaveSlots, Credits
│   ├── systems/                # input/, save/, audio/, party/, inventory/, quests/, picnic/, teleport/, phone/
│   ├── battle/                 # engine/, ui/ (rolling meter), ai/, rewards/
│   ├── data/                   # enemies/, items/, abilities/, shops/, dialogue/, quests/, encounters/, bosses/
│   ├── schemas/                # Zod schemas mirroring the Bible
│   └── ui/                     # virtual controls, windows (EB-style beveled), fonts
├── assets/  (tilesets/ sprites/ portraits/ audio/music/ audio/sfx/ ui/)
├── maps/                       # Tiled projects, one folder per chapter
├── tools/                      # content-validate.ts, art-check.ts, music-render.ts, balance-sim.ts
├── e2e/                        # Playwright runs
├── android/                    # Capacitor (generated Prompt 40)
└── capacitor.config.ts
```

## B3. Asset strategy (production quality, easiest path)

**Art.** Base layer: CC0/free 16-bit packs (Kenney; itch.io CC0 RPG packs) for tiles/props; AI-generated character & enemy sprites (one prompt per sheet, Prompt 39 includes the exact image-prompt templates with the locked palette + 4-frame walk cycles + battle-sprite spec). Everything passes `npm run art:check`, which rejects any PNG using colors outside `palette.gpl` — this single rule is what makes mixed sources look like one game.

**Music.** EarthBound-themed chiptune+sample hybrid: tracks are authored as code in **Tone.js** (`tools/music-render.ts` renders them offline to OGG so runtime cost is zero). Prompt 41 contains per-track briefs (tempo, key, mood, EB reference vibe — e.g., Otterbrook = laid-back I-IV shuffle w/ slap bass à la Onett; Mars = near-silent drones with a heartbeat). SFX via jsfxr presets, also rendered to files.

## B4. The non-negotiables checklist (every phase's Definition of Done inherits these)

- 60 fps on a mid-range Android phone (test on yours), landscape locked, safe-area aware
- No mock/lorem/placeholder strings anywhere `tools/content-validate.ts` can see
- Every battle calculation unit-tested; save/load round-trip tested per schema version
- Touch and Bluetooth controller verified for every new UI screen
- Game completable start-to-finish at every phase boundary from Phase 6 onward
- Settlement maps follow the Brickton rules (ADR-012): seeded organic irregularity
  everywhere; CITIES (tagged `settlement: 'city'`) are multi-street grids — ≥2 streets
  joined by an avenue, buildings on 2+ block faces, alleys, negative space — never a
  single shop strip. Enforced by the city-structure test sweep; cross-map coordinates
  that touch jittered placement are computed, never hardcoded. *(Amended 2026-06-10 per
  Appendix rule 6, alongside ADR-012.)*

---

# PART C — THE PROMPT SEQUENCE (44 prompts, 10 phases)

> **Workflow:** open Claude Code in the repo, paste one prompt, review the diff, run the acceptance checks, commit, next prompt. If something fails, tell Claude Code *what failed*, not how to fix it. Each prompt begins with the same header line — keep it, it's what keeps 44 sessions consistent.

**The Standard Header (start EVERY prompt with this):**

```
Read docs/GAME_BIBLE.md fully before doing anything. It is canon — never invent
content that contradicts it, never use placeholder/mock data for anything it
defines. Follow repo conventions in docs/DECISIONS.md and append any new
architectural decision you make to it. TypeScript strict, no `any`.
```

---

## PHASE 0 — Foundation (Prompts 1–2)

### Prompt 1 — Repo bootstrap

```
[Standard Header]
Initialize the Meteor Falls project: Phaser 3.80+, TypeScript strict, Vite,
Vitest, Playwright, ESLint+Prettier, Zod, idb. Create the exact directory
layout from GAME_BIBLE.md §B2 with .gitkeep files. Configure Vite for a
landscape 16:9 mobile web build (960×540 logical, integer scaling).
Add npm scripts: dev, build, test, e2e, validate (runs tools/content-validate.ts,
stub it for now), art:check (stub), music:render (stub).
Set up GitHub Actions per §B1 CI row (debug-APK step commented until Phase 9).
Create docs/DECISIONS.md with an ADR template and the first entry: this stack.
```

**Done when:** `npm run dev` shows a black 960×540 canvas with "METEOR FALLS" placeholder text; CI passes; repo matches §B2.

### Prompt 2 — Boot, Title, scene flow & game-state core

```
[Standard Header]
Implement BootScene (asset manifest loader w/ progress bar), TitleScene
(title, "Press A", file-select hook for later), and a SceneRouter.
Implement the core GameState singleton: party roster, inventory, cash-on-hand
vs banked cash, flags map (string->bool/number) for story progress, playtime
clock, settings (volume, touch-control size). GameState must be fully
serializable to JSON (this is the save format). Event bus (typed) for
systems to communicate. Unit-test GameState serialization round-trip.
```

**Done when:** Title boots in <2s, state round-trips in tests, playtime ticks.

---

## PHASE 1 — Core Engine (Prompts 3–7)

### Prompt 3 — Input: virtual D-pad + Bluetooth controllers

```
[Standard Header]
Build the unified input system: a semantic action layer (UP/DOWN/LEFT/RIGHT,
A=confirm/interact, B=cancel/run, START=menu) consumed by all scenes.
Sources: (1) on-screen virtual D-pad (left) + A/B (right) + START, with
opacity/size settings, multi-touch safe, positioned for landscape thumbs;
(2) Gamepad API — when any gamepad connects, hide touch controls and show a
toast "Controller connected"; standard mapping, hot-swap both directions;
(3) keyboard for dev. 8-direction movement intent with diagonal handling.
```

**Done when:** all three sources drive a debug square; controls hide/show on controller hot-plug.

### Prompt 4 — Tiled map runtime

```
[Standard Header]
Implement the Tiled (.tmj) pipeline: layered rendering (ground/decor/overhead),
collision layer, object layers for: spawn points, doors (map->map transitions
with facing), NPCs, enemies, signs, phones, ATMs, picnic tables, shops,
chests, resonance sites. Camera follow with map-edge clamping and smooth
room transitions. Author maps/dev/playground.tmx exercising every object type
(this is a dev map, not game content — mark it excluded from content-validate).
```

**Done when:** walking the playground hits every object type and transitions between two test rooms.

### Prompt 5 — Player movement, party followers & overworld feel

```
[Standard Header]
Grid-free 8-direction movement EB-style: walk + B-held run, collision sliding,
party members follow the leader's breadcrumb trail (up to 3 followers),
dead party members render as small haloed ANGEL sprites in the trail per
GAME_BIBLE §A4.7. Interaction probe (A in facing direction). Footstep SFX
hooks by terrain tag. Map-name banner on area entry.
```

**Done when:** 4-character conga line feels right at 60fps; angels float instead of walk.

### Prompt 6 — Dialogue & window system

```
[Standard Header]
Build the EB-style window system: beveled rounded windows, configurable
palette per save file (classic blue default + 3 flavors), monospace pixel
font with the @-prefixed speaker convention ("@Hi! I'm a mailbox enthusiast."),
letter-by-letter text (A to fast-forward), choice menus (Yes/No and N-way for
the Sphinx riddles later), text variables ({rex}, {favoritefood}, {playername}),
and a dialogue script format in src/data/dialogue (id, pages, choices,
flag conditions, flag effects). Write tests for the condition evaluator.
```

**Done when:** a dev NPC runs a branching conversation that sets and reads flags.

### Prompt 7 — Pause menu & status screens

```
[Standard Header]
START opens the EB-style command menu: Items (per-character 14-slot
inventories + shared key items), Status (full stat sheet per hero incl.
Guts/Vibe/Luck), Vibe (ability list w/ PP costs, greyed when unusable),
Equip, Setup (controls/audio/window flavor), and the STAR LOCKET screen:
shows 0–8 Embers and layers the Homesong stems per GAME_BIBLE §A4.9
(stems wired in Phase 8; stub with tones now, behind the real interface).
```

**Done when:** menu fully navigable by touch AND controller; locket shows ember count from flags.

---

## PHASE 2 — Data Layer: ALL canon content as JSON (Prompts 8–11)

### Prompt 8 — Zod schemas + content validator

```
[Standard Header]
Define Zod schemas in src/schemas for: Hero, Enemy, Boss, Ability (vibe |
gadget | pray | physical), Item (weapon/armor/food/pp/cure/battle/basket/key),
Shop, Quest (objectives, flags, caller metadata), DialogueScript,
EncounterTable, MapMeta. Implement tools/content-validate.ts: loads every
JSON in src/data, validates against schemas, AND cross-checks completeness
against canon manifests (counts: 4 heroes, 48 enemies from §A7, 8 bosses +
2 minibosses from §A6, 16 quests from §A10, ~90 items from §A8). Any miss,
mismatch, or string containing "TODO/placeholder/lorem" fails the build.
```

**Done when:** `npm run validate` fails loudly on an empty data dir, listing exactly what's missing.

### Prompt 9 — Heroes & abilities data

```
[Standard Header]
Author src/data for the four heroes per GAME_BIBLE §A3: base stats, per-level
growth curves tuned to §A9 targets, full Vibe/gadget unlock tables with PP
costs and power coefficients (extend the abridged Bible tables sensibly —
follow EarthBound's α/β/γ/Ω power ratios ~1:2.2:3.6:5.5). Encode PRAY exactly
per the §A3 variance table including the level/Guts weight shifts. Encode
Milo's Spy/Repair and Bottle Rocket tiers. Unit-test: pray distribution over
100k rolls matches weights ±0.5%; level-50 Rex stats land within §A9 targets.
```

**Done when:** validator passes hero/ability sections; distribution tests green.

### Prompt 10 — Enemies, bosses, items, shops

```
[Standard Header]
Author every enemy from §A7 (stats, 2–4 moves each w/ EB-flavored move text,
weakness tags, EXP/cash from the §A9 economy, drop tables, flavor death line),
all 8 bosses + 2 minibosses from §A6 with their scripted gimmick phases
expressed as a declarative phase-machine (triggers: hpBelow, turnCount,
bothSummonsDead, riddleAnswered...), and the full §A8 item catalog with
prices satisfying the §A9 "equipment refresh ≈ 2 chapters of income" rule.
Author one shop inventory per town (12 towns) using region-appropriate items.
```

**Done when:** validator counts all 48/10/~90/12; `tools/balance-sim.ts` stub created for Prompt 42.

### Prompt 11 — Quests, encounter tables, dialogue manifests

```
[Standard Header]
Author all 16 side quests from §A10 as data: multi-step objectives, item
rewards, flag wiring, and the CALLER record each contributes to the finale
(caller name, one-line phone quote in §A11 tone, scripted damage/heal value).
Author per-map encounter tables (which §A7 enemies roam where, densities,
respawn rules). Create the dialogue manifest skeleton: one script file per
story beat in §A6 and per quest — files exist with scene IDs and beat
summaries as structured fields (NOT placeholder prose; actual dialogue is
written chapter-by-chapter in Phase 6 prompts).
```

**Done when:** validator passes quests/encounters; every §A6 beat has a manifest entry.

---

## PHASE 3 — Battle System (Prompts 12–17)

### Prompt 12 — Battle scene & turn engine

```
[Standard Header]
Build BattleScene: first-person EB layout — enemy sprites front and center on
an animated psychedelic background (build 4 shader patterns now: scrolling
sine plasma, kaleidoscope, slow vortex, Hush static; assignable per enemy),
party status strip along the bottom (name, HP, PP boxes). Turn engine:
speed-ordered round system, command menu per hero (Bash/Vibe/Goods/Defend/
Pray for Mia/Spy for Milo/Run), target selection, enemy AI executing data-
driven movesets, multi-enemy groups w/ EB naming ("Coily Cicada A and its
cousin B drew near!"). Run chance = EB formula on speed differential.
```

**Done when:** a full fight vs 3 mixed Ch.1 enemies plays start to finish with touch and controller.

### Prompt 13 — THE ROLLING HP ODOMETER (the soul — take your time)

```
[Standard Header]
Implement rolling HP/PP meters per GAME_BIBLE §A4.1: each digit is a vertical
drum that physically scrolls; damage sets a TARGET value and the meter rolls
down at a constant rate (~2 digits/sec, configurable); healing and battle
victory FREEZE the meter at its current displayed value and resolve from
there; a hero only falls unconscious when the DISPLAYED value reaches 0; all
queued actions resolve against displayed values. Mortal damage (target 0)
triggers urgency: meter SFX pitch rises, status box flashes. Exhaustive unit
tests: outracing death with Lifeup, winning mid-roll, simultaneous rolls on
multiple heroes, PP rolls, overkill, Guts survival proc interacting with roll.
```

**Done when:** you can take a fatal hit and save yourself by ending the battle — and it FEELS like EarthBound.

### Prompt 14 — Vibe, Pray, gadgets & status effects in combat

```
[Standard Header]
Wire all abilities from Phase 2 data into battle: damage/heal formulas
(EB-style: power coefficient × Vibe stat, defense applied to physical only),
elemental weakness tags (fire/freeze/volt/holy/physical), Shield/Mirror
reflection, Milo's Spy info panel and Bottle Rocket multi-hit, PRAY rolling
its full §A3 table with distinct text+SFX per tier (including Strange hitting
allies). Implement every status from §A4.8 with per-turn ticks, cure items,
and battle text. Homesick: Rex randomly skips a turn "thinking about
{favoritefood}".
```

**Done when:** scripted test battles demonstrate each ability class and each status; Pray feels like gambling with grace.

### Prompt 15 — Boss phase-machine & the riddle/menu gimmicks

```
[Standard Header]
Implement the declarative boss phase-machine from Prompt 10 data: phase
triggers, scripted lines mid-battle, form swaps (Gilded Grin), summons
(Mainframe), skin-shed heal (Cobra Raja), airborne/grounded states (Paper
Dragon), item-steal-and-return (Hoaxula), mercy-end hook (Hoaxula via Pray
tier >= Good), and the riddle prompt UI (N-way choice mid-battle, pool of 8
riddles, consequences per §A6 Ch.4). Integration-test each boss's gimmick
headlessly via the engine API.
```

**Done when:** all 10 boss/miniboss scripts run green in headless tests.

### Prompt 16 — Battle flow: intros, swirls, victory, defeat, auto-win

```
[Standard Header]
Implement encounter transitions: overworld contact triggers the EB swirl
(green = enemy back-attacked you ⇒ enemy free round; red = you touched their
back ⇒ your free round; neutral otherwise), battle intro text, VICTORY flow
("YOU WON! Rex gained 86 EXP." level-up fanfare + stat gains + new-ability
text + drops w/ inventory-full handling), DEFEAT flow per §A4.7 (fade,
"Rex... pick yourself up..." respawn at last save, cash-on-hand halved, party
as angels), and INSTANT WIN: if party strength >> enemy per EB's formula,
flash the win screen without entering battle.
```

**Done when:** all four outcomes reachable in playtesting; instant-win triggers correctly when overleveled.

### Prompt 17 — Overworld enemy AI & spawning

```
[Standard Header]
Implement roaming overworld enemies from encounter tables: spawn rules,
sight-radius pursuit (faster than walk, slower than run), wander when idle,
flee from the party when vastly outleveled (EB detail!), despawn/respawn on
map re-entry, contact angle detection feeding the swirl system, and enemy
density that respects "dungeon corridors are dangerous, towns are safe."
```

**Done when:** Hickory Hill playground map feels alive; weak enemies visibly run from a strong party.

---

## PHASE 4 — Progression & Economy (Prompts 18–21)

### Prompt 18 — Leveling & stat growth

```
[Standard Header]
Wire EXP from victories through the §A9 curve into level-ups: stat gains from
per-hero growth data with EB-style slight randomization (±15% around curve,
deficit-correcting so long-run totals converge), HP/PP max increases, ability
unlock announcements, and the level-up jingle hook. Status screen reflects
everything. Unit-test convergence at L20/L40/L55 against §A9 targets.
```

**Done when:** grinding feels rewarding; tests prove curves converge.

### Prompt 19 — Inventory & equipment

```
[Standard Header]
Implement per-hero 14-slot inventories + shared key-item bag: get/give/drop/
use from menu and battle, equipment slots (weapon/body/arms/other) with
equip-from-anyone's-bag, stat deltas previewed before confirming (EB
"Offense up by 14!"), cursed-free design (no traps), full-inventory handling
on pickups/drops ("Rex's hands are full!"). Chests, gift boxes on maps.
```

**Done when:** full loop: open chest → bag → equip → see stats change → sell later.

### Prompt 20 — Shops, ATMs & the phone economy

```
[Standard Header]
Implement shop UI (buy/sell with the §A8 catalog and Prompt 10 inventories,
equip-immediately-after-buy prompt, sell at half), ATM withdraw/deposit, and
Dad's deposit flow: battle winnings accrue to a pending balance; the NEXT
phone call to Dad announces the deposit ("I put $412 into your account.
Don't spend it all on corn dogs."). Wire Mom's call curing Homesick and
asking about {favoritefood}. Phone UI lists contacts: Dad, Mom, (Pemberton
and Pizza-to-Go gated by story flags later).
```

**Done when:** earn → call Dad → withdraw → buy a Sandlot Slugger → Offense up by 14.

### Prompt 21 — Name entry & New Game setup

```
[Standard Header]
Implement the New Game sequence: EB-style name-entry screens for the four
heroes (pre-filled Rex/Mia/Milo/Dorin, editable, on-screen keyboard +
controller grid), the player's own name (used by the finale per §A6 Ch.8),
favorite food, and coolest thing. Don't-care button randomizes from canon-
flavored lists. All values flow into dialogue variables from Prompt 6.
```

**Done when:** a fresh game greets you with your choices; finale hook variable exists.

---

## PHASE 5 — World Systems (Prompts 22–26)

### Prompt 22 — Save system: Call Your Dad

```
[Standard Header]
Implement saving per GAME_BIBLE §A4.3: interacting with any phone object
opens the call menu; calling Dad runs his dialogue (rotating warm lines,
playtime callout "You've been at it for 2 hours — maybe take a breather,
champ?", deposit announcement from Prompt 20) then writes the save.
IndexedDB via idb: 3 slots + rolling auto-backup before every overwrite,
versioned schema with a migration registry, corruption detection w/ backup
restore. Save data: full GameState + map id + position + facing. SaveSlots
scene on Title (slot summaries: name, level, location, playtime, embers).
Continue resumes exactly. Test: save/load round-trip per schema version,
forced-corruption recovery.
```

**Done when:** kill the app mid-game, relaunch, continue from Dad's last call — flawless.

### Prompt 23 — Picnic system

```
[Standard Header]
Implement Picnic per §A4.5: picnic-table map objects; using a Basket at one
plays a short scene (blanket unrolls, party sprites sit, birds land), fully
restores HP/PP, applies SUNNY SIDE (+10% all stats, 5-battle counter shown
as a small sun icon by the status strip), Feast Basket additionally arms a
one-shot party-wide auto-revive. Deli NPCs craft Family Baskets from 3 foods
and Feast Baskets once Buni's recipe flag is set. Baskets unusable away from
tables ("There's no good spot here.").
```

**Done when:** the pre-dungeon picnic is a real strategic ritual.

### Prompt 24 — Teleport

```
[Standard Header]
Implement Teleport α/β per §A4.6: destination list = visited towns (auto-
registered on first entry); α requires a run-up — hold direction (touch:
hold D-pad; controller: hold stick) while the party sprints a widening loop,
trailing flames, then vanishes; collision during run-up = comic crash, soot
faces, small HP cost, retry allowed. β needs a short straight dash. Arrival
at each town's teleport pad. Gate α behind the Ch.4 story flag, β behind Ch.6.
```

**Done when:** crashing into a fence is funny every time; world reopens post-Ch.4.

### Prompt 25 — Hospitals, churches & revival

```
[Standard Header]
Implement hospitals in every town: pay-to-revive angels (price scales by
level), cure all statuses, the doctor's one weird line each. Add small
chapels in Otterbrook, Valle Dorado, and Valea Stelelor where a free prayer
restores 50 HP party-wide and (flavor, not mechanics) the priest comments on
Mia's gift warmly per §A11.4. Mushroomize curable only at doctors per §A4.8.
```

**Done when:** angels → humans at the front desk; wallet appropriately lighter.

### Prompt 26 — Quest engine & journal

```
[Standard Header]
Implement the quest system over Prompt 11 data: objective tracking, multi-
step state machines, map markers OFF by default (EB didn't hold hands) but a
JOURNAL menu page summarizing active/complete quests in-voice ("Find Biscuit.
He smells like pond."), reward granting, and the CALLER ledger: completing a
quest appends its caller record to the save — this ledger is the finale's
fuel. Show callers earned as tiny phone icons on the journal page.
```

**Done when:** Biscuit quest completable end-to-end on the dev map; ledger shows Mrs. Pemmel.

---

## PHASE 6 — CONTENT: Build the Eight Chapters (Prompts 27–34)

> One prompt per chapter. Each follows the same template — shown in full for Chapter 1, then per-chapter deltas. These are the biggest prompts; expect each to be a long Claude Code session. Playtest the chapter fully before moving on.

### Prompt 27 — Chapter 1: "The Night It Fell"

```
[Standard Header]
Build Chapter 1 per GAME_BIBLE §A6 completely:
MAPS (Tiled, real art per the Phase-8-ready palette, dev-art acceptable until
Prompt 39 but layouts FINAL): Rex's house (interior, the starting bedroom),
Otterbrook town (≈30s walk edge-to-edge, 12+ enterable: homes, drugstore/shop,
hospital, chapel, arcade-bus-stop, Ana & Vivi's stand), Hickory Hill trail +
crater Resonance Site, the bus interior cutscene map, Brickton City block,
Department of Smiles office dungeon (3 floors).
STORY: full dialogue (write it NOW, §A11 voice) for: 2AM wake-up, crater
scene, Glint's prophecy + bug-zapper death, Chad Pickle's two betrayals,
meeting Mia in the Smiles holding room, BOSS: THE TITANIC TICK at the
crater with its §A6 gimmick, first Ember + Heartlight scene (locket plays
stem 1), Mia joins.
SYSTEMS USED: everything from Phases 1–5 — first phone tutorialized by Mom
calling YOU. Populate §A7 Ch.1 enemies via encounter tables, Ch.1 shops,
quests #1–4 fully playable, 3 picnic tables placed per §A4.5.
EXIT: ch1_complete is set by Mom's call to the Brickton payphone after the
Department falls (amended 2026-06-10 per Appendix rule 6, ADR-014); the
docks bus that opens Chapter 2 requires the flag rather than setting it.
```

**Done when:** Chapter 1 plays start-to-finish in ~35–45 min at the §A9 level target with zero dev text.

### Prompt 28 — Chapter 2: "The Gilded Grin" (South America)

```
[Same template.] Maps: Puerto Sol port, jungle path (2 screens + optional
grotto), Valle Dorado village, step-pyramid dungeon w/ rotating-floor puzzle
(design: 4 rooms, rotation toggled by mask switches). Story per §A6 incl.
gray "wishers" who recover after the boss. Boss: IDOL OF THE GILDED GRIN
form-swap fight. Quests #5–6. Ch.2 enemies/shops/tables. Banana-boat arrival
and Lucille-departure cutscenes.
```

### Prompt 29 — Chapter 3: "A Very Foggy Term" (England)

```
[Same template.] Maps: Foggybottom-on-Tyne high street, Academy grounds +
3-floor school, dorm stealth wing (sight-cone prefects, caught = battle not
fail), boiler room, The Old Stones site. Story: Milo's greenhouse crash +
join, machine-fog reveal. Boss: HEADMASTER MAINFRAME w/ summons. Quests
#7–8. Tea-as-PP economy flavor. Milo's Repair tutorial via a Broken Gizmo
gift.
```

### Prompt 30 — Chapter 4: "The Ruins That Laugh" (Africa)

```
[Same template.] Maps: Zanzibel port + grand market, savanna crossing
(escort framework for quest #10), dune ruins w/ echo-laughter ambience
zones, Sphinx forecourt. Story per §A6; Teleport α taught by the courier
mystic (his dojo: a bus stop). Boss: THE LAUGHING SPHINX with the 8-riddle
pool from Prompt 15. Quests #9–10. After the Ember: teleport tutorial pad.
```

### Prompt 31 — Chapter 5: "The Cobra's Palace" (India)

```
[Same template.] Maps: Chandrapore (biggest town — 3 districts: bazaar maze,
ghats, cinema block w/ the movie-about-you gag), night-train heist sequence
(linear car-by-car set piece, Locket stolen/recovered ≤30 min per §A6),
Cobra Palace dungeon. Boss: COBRA RAJA w/ paralyze-gaze + skin-shed
mechanics. Quests #11–12 incl. rooftop monkey chase (simple platforming-ish
hop routes using existing movement).
```

### Prompt 32 — Chapter 6: "The Paper Dragon" (China)

```
[Same template.] Maps: Lotus Harbor, riverboat scene, Spore Forest
(Mushroomize zones — implement the control-scramble shader/input warp now),
Yak Express mountain switchbacks, Mt. Shu Temple (paper-guardian statues
animate as enemies). Teleport β taught by the elder. Boss: THE PAPER DRAGON
airborne/grounded + self-immolation desperation phase. Quest #13.
```

### Prompt 33 — Chapter 7: "The Count of Valea Stelelor" (Romania)

```
[Same template — this is the heart chapter, write it with full sincerity
where the Bible demands it.] Maps: Valea Stelelor village (painted gates,
haystack fields w/ Haystack Mimics, Buni's house — her cooking scene
overheals HP visibly), Old Road through wolf country, Castle Hoaxula (gothic
theme-park-gone-wrong props: gift shop, queue ropes), Stone Brow Monastery +
the Trial of the Mute Mountain as a PLAYABLE solo Dorin sequence per §A6:
senses stripped one by one — darken screen, then mute audio, then hide UI —
finish on text alone. Dorin joins at L40 w/ canon kit. Boss: COUNT HOAXULA
two-phase + the Pray-mercy ending hook. Quest #14 (Buni's Table → Feast
recipe). Buni's send-off line is the chapter button: "Du-te, puiul meu.
The stars were always yours."
```

### Prompt 34 — Chapter 8: "The Long Shot" (Alaska → Hawaii → Mars)

```
[Same template + finale systems.] Maps: Aurora Station (generator-restore
gauntlet, quest #15, MINIBOSS: FROST SENTINEL), Mauna Lani launch pad +
volcano approach (quest #16, MINIBOSS: TIKI MAGMA GOLEM on the caldera rim),
the launch cutscene (Mom's call — play it straight), MARS: Sea of Silence
(3 zones; the soundtrack loses one instrument layer per zone — wire to the
audio stem system; §A7 Ch.8 enemies).
FINALE: THE HUSH in three movements exactly per §A6 Ch.8 — Movement 2's UI
glitching (windows jitter, text corrupts non-destructively), Movement 3's
scripted PRAY: iterate the CALLER ledger from Prompt 26, one phone-ring
vignette per caller w/ their Prompt 11 quote and scripted effect, base
callers always present (Mom, Dad, Buni, Pemberton, Chad Pickle), then the
player-name confirm box and the full 8-stem Homesong. ENDING: quiet
walk-home epilogue across Otterbrook, the House Key, credits over Mr.
Click's photo album (photos = his 12 encounter flags), "THE END...?"
```

**Done when (33–34):** full game completable; finale caller count visibly scales with quests done.

---

## PHASE 7 — Side Quest Sweep & Replayability (Prompts 35–37)

### Prompt 35 — Quest pass: all 16 + Mr. Click

```
[Standard Header]
Audit every §A10 quest end-to-end in a fresh playthrough save: fix
sequencing, ensure each is completable in its chapter AND later via
Teleport (no missables — this is canon: zero permanently-missable content),
implement Mr. Click's 12 worldwide photo ambushes with pose menu, and the
credits album. Verify each caller fires correctly in a finale test harness.
```

### Prompt 36 — Replayability layer

```
[Standard Header]
Implement: NEW GAME+ (carry levels OR carry nothing but unlock "Hush Whispers"
hard mode — enemies +25%, Pray weights shift 5% darker), the Arcade Legend
shmup as an endlessly replayable score-attack from any save, a post-credits
flag that adds NPC dialogue variations worldwide ("the world feels louder
now"), and a stats page (battles, smashes, prayers answered, photos taken).
```

### Prompt 37 — Full-game balance simulation

```
[Standard Header]
Build out tools/balance-sim.ts: headless monte-carlo of the §A9 progression —
simulate expected EXP along the critical path per chapter, fight every boss
at target level ±2 with median-skill policies, output a report (win rates,
expected attempts, economy surplus/deficit per region). Tune data (never
code) until: boss win-rate at target level ≈ 55–70%, at target+3 ≈ 90%;
total mainline time ≥ 4.5h at design walk speeds. Commit the report.
```

**Done when:** the report proves the 4+ hour grindy-but-fair mandate with numbers.

---

## PHASE 8 — Art & Audio Production Pass (Prompts 38–40)

### Prompt 38 — Master palette & art pipeline

```
[Standard Header]
Create assets/palette.gpl (64-color master palette, EB-inspired: warm
mid-saturation daylight ramp, dusty shadows, one acid accent row for
psychedelia) and implement tools/art-check.ts fully: fail any PNG with
off-palette pixels (with a quantize --fix mode). Write docs/ART_SPEC.md:
16×16 tiles, character sheets 4-dir × 4-frame, battle sprites 64–128px,
portrait spec, per-chapter tileset shopping list derived from every Phase-6
map, and the exact AI-image prompt templates (style descriptors + palette
swatch reference) for generating each character/enemy/boss sprite sheet.
```

### Prompt 39 — Asset integration sweep

```
[Standard Header]
Replace ALL dev art: integrate the CC0 packs and generated sheets listed in
docs/ART_SPEC.md across every map, character, enemy, boss, battle background,
UI skin, and the title screen (the meteor streaking over Otterbrook at
night). Every asset passes art:check. Re-export all Tiled maps. Add juice:
battle hit-flash, screen shake on SMAAAASH crits, swirl shader polish,
Ember pickup sparkle. Record asset attributions in docs/CREDITS.md.
```

### Prompt 40 — Music & SFX render

```
[Standard Header]
Implement tools/music-render.ts (Tone.js offline render → OGG) and compose
the 18-track score to these canon briefs: Title (wonder, distant choir pad),
Otterbrook (lazy I-IV shuffle, slap bass), Battle (driving swing, 140bpm),
Boss (asymmetric meter, sneering brass), Victory/LevelUp jingles, one town +
one dungeon theme per region in local flavor THROUGH the chiptune lens
(pan flute Valle Dorado; music-box fog England; kora-pattern Zanzibel;
tabla-loop Chandrapore; guzheng Lotus Harbor; doina-bent lead + cimbalom
hammer Valea Stelelor; aurora drones Alaska; slack-key Mauna Lani), Mars =
heartbeat + subtractive silence (stems!), The Hush (3 movements), Homesong
(the 8-stem theme — each Ember adds a layer; full version is the finale),
Epilogue. SFX set via jsfxr presets (menu, swirls, SMAAASH, odometer tick,
phone ring, prayer chime tiers). Wire the audio ducking + stem system for
the Locket screen and Mars.
```

**Done when:** play 10 minutes with eyes closed and know exactly where you are.

---

## PHASE 9 — Ship It (Prompts 41–44)

### Prompt 41 — Capacitor & Android hardening

```
[Standard Header]
Add Capacitor 6, generate the android/ project: landscape-locked,
fullscreen/immersive, safe-area insets respected by the touch UI, app icon +
splash (the meteor), keep-awake during play, audio focus handling
(pause/duck on calls), back-button = B/cancel, Bluetooth controllers
verified through the WebView Gamepad API on a real device, IndexedDB
persistence flagged durable. Wire the CI debug-APK artifact step from
Prompt 1.
```

### Prompt 42 — Performance & device QA

```
[Standard Header]
Profile on a mid-range Android target: texture atlas everything, object-pool
battle text/particles, cap shader cost on the psychedelic backgrounds with a
quality setting, eliminate GC spikes in the odometer and follower systems,
cold start < 4s, steady 60fps overworld / ≥ 45fps battles. Add a hidden FPS
overlay (tap version string 5×). Fix everything Playwright smoke + a full
scripted speedrun-bot pass (build it: replays an input script through Ch.1)
surfaces.
```

### Prompt 43 — Full QA gauntlet

```
[Standard Header]
Execute and fix against this checklist, logging results in docs/QA.md:
(1) 100% playthrough touch-only; (2) 100% playthrough controller-only;
(3) all 16 quests + Mr. Click ×12 + both minibosses + NG+ boot;
(4) save/quit/resume in every chapter incl. mid-dungeon and mid-Trial;
(5) death/angel/hospital flow in 3 different regions; (6) finale with 0
side quests vs all 16 (caller scaling visibly different); (7) validator,
tests, balance-sim, art-check all green; (8) the §A11 tone read-through:
every dialogue file proofed in-voice.
```

### Prompt 44 — Release build

```
[Standard Header]
Produce the signed release: versioning + changelog, AAB build config with
signing docs (keystore generation steps documented, key NOT committed),
Proguard-safe config, final asset compression pass, docs/RELEASE.md with
Play Store listing draft (description in the game's voice, feature list,
screenshots checklist) and sideload-APK instructions. Tag v1.0.0,
codename "FUZZY PICKLES".
```

**Done when:** `meteor-falls-v1.0.0.aab` installs on your phone and your kids fight you for it.

---

# APPENDIX — Session Tips for the 44-Prompt Run

1. **One prompt = one session = one commit.** Fresh Claude Code context each time; the Standard Header + Bible carries the continuity.
2. **When a chapter prompt is too big for one session**, split on the natural seam: "maps + encounters first," then "story dialogue + boss." Tell Claude Code which half.
3. **Never let it summarize the Bible into its own notes** — drift starts there. The Bible is the notes.
4. **You are the tone editor.** Claude Code will nail systems; read every dialogue diff out loud. If a line wouldn't make your daughters laugh or Buni's scene doesn't land, send it back.
5. **Playtest on the phone every Phase boundary**, not just at the end — touch feel can't be reviewed in a diff.
6. **Drift log:** any time you accept a deviation from the Bible, make Claude Code amend the Bible in the same commit. Canon stays canon.

*Now go pick up the cracked bat. The meteor's already falling.* ☄️
