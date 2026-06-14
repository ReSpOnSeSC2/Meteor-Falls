# ☄️ METEOR FALLS
## The Complete AI Prompt Build Guide — A Production-Ready EarthBound-Style Mobile RPG

> **How to use this document:** This file is both the **Game Design Bible** (Part A–B) and the **Prompt Sequence** (Part C). Step 1 of the build is committing THIS file into your repo as `docs/GAME_BIBLE.md`. Every prompt afterward tells Claude Code to read the Bible — that's how we get real content with **zero mock data**. Work through the 46 prompts in order. Each has acceptance criteria; don't move on until they pass.

---

# PART A — GAME DESIGN BIBLE

## A1. Pitch

**METEOR FALLS** is a turn-based RPG in the spirit of MOTHER 2 / EarthBound: 90s Americana, five kids, psychic powers, absurdist humor, rolling-odometer HP, and a cosmic horror at the end of the road. It begins in a sleepy Ohio town and becomes a journey across **eleven countries and one planet** — America, South America, England, Norway, Minimus, Africa, India, China, Romania, Alaska, Hawaii — finishing **on Mars**.

- **Platform:** Android phone, landscape, virtual D-pad + Bluetooth controller support
- **Engine:** Phaser 3 + TypeScript + Vite, packaged with Capacitor
- **Length:** 40–50 hours total planned play time: 32–38 hours main story, +8–12 hours side quests and optional long-form activities, 10 chapters, 10 bosses
- **Themes:** friendship, family, faith, and growing up — the meteor took something from the world (its *Vibe*), and five kids put it back

## A2. Story Synopsis

**The Night It Fell.** Summer, 1995. **JAY**, a quiet 12-year-old in **Otterbrook, Ohio**, is woken at 2 AM by a roar — a meteor has slammed into **Hickory Hill** behind his house. At the crash site he meets **GLINT**, a firefly-like star-creature who escaped the meteor's true passenger: **THE HUSH**, an entity that devours *Vibe* — the warmth between living things. Where the Hush spreads, people stop calling their moms, dogs stop greeting their owners, and music goes flat. Glint prophesies that **five kids carrying the old light** can silence it, hands Jay the **Star Locket**, and is promptly fried by the neighbor's bug zapper mid-prophecy ("...tell the girl who prays— *BZZT*").

**The Quest.** The meteor shattered into **Ten Embers** that scattered along the Hush's path around the globe. Each Ember rests at a **Resonance Site** guarded by something the Hush has corrupted. When Jay holds the Locket at a Site, it records a **Heartlight** — one-tenth of the **Homesong**, the only frequency the Hush cannot devour. Collect all ten, ride a homemade rocket to Mars, and play the Homesong into the dark.

**The Ending.** The Hush cannot be beaten by bats and bottle rockets alone. In the final battle, **MIA PRAYS** — and every NPC the party helped across the world (every completed side quest) answers a ringing phone, one by one, and sends their Vibe to Mars. Friendship, family, and faith literally win the fight. Replay value = more side quests done = more callers = an easier final battle and extended credits.

## A3. The Five Heroes

| | **JAY** | **MIA** | **MILO** | **PIPPA** | **DORIN** |
|---|---|---|---|---|---|
| Archetype | Ness — silent psychic hero | Paula — psychic + **Pray** | Jeff — gadget genius, no Vibe | Minimus royal page — tiny tactician, support, accuracy, morale | Poo — monastery martial artist |
| Age / Home | 12, Otterbrook, USA | 11, Brickton, USA | 12, Wintermoor Academy, England | 9, Minimus Major, Grand Duchy of Minimus | 13, Stone Brow Monastery, Romania |
| Joins | Ch.1 (start) | Ch.1 end (rescued in Brickton) | Ch.3 (crashes his rocket into the Academy greenhouse to reach you) | Ch.5 end (after WHISKERZILLA; appointed Foreign Minister of Being Taken Seriously) | Ch.9 (after the Trial of the Mute Mountain) |
| Weapon line | Baseball bats | Frying pans | Air rifles + Bottle Rockets | Stamp slings, sewing-needle sabers, thimble bells | Prayer-bead bracelets (fists) |
| Specialty | Vibe Surge (signature nuke), Lifeup, Shield, Teleport | Vibe Fire/Freeze/Volt, **PRAY** | Spy, Repair Gizmos, Bottle Rockets, Multi-target tech | Pinpoint Mark, Royal Rally, Pocket Patch, Scale Step, Big-Little Focus | Vibe Comet (Starstorm analog), Mirror, Brainjam |
| Personality | Silent. Nods. Eats too many corn dogs. | Kind, steel-spined, hears the Embers sing | Talks to machines more than people; tea snob | Takes minutes during disasters; speaks like a diplomat; furious when called adorable | Speaks formally; baffled by vending machines |

**Stats:** Offense, Defense, Speed, Guts (crit % + chance to survive mortal blow at 1 HP), Vibe (power of Vibe abilities), Luck. HP/PP grow per level via per-character growth curves (defined in A9 balancing tables).

> *(Amended 2026-06-11 per Appendix rule 6, ADR-023: the second hero, formerly
> Faye, is canonically named **MIA**. Internal engine ids stay `faye` — saves,
> flags like `faye_joined`, and dialogue keys are frozen identifiers.)*

> *(Amended 2026-06-11 per Appendix rule 6, ADR-031: the first hero, formerly
> Rex, is canonically named **JAY**. Internal engine ids stay `rex` — map ids
> like `rex_home`, flags like `rex_homesick`, texture keys, and the `{rex}`
> text token are frozen identifiers; the token resolves to the live display
> name. 'Rex' survives as the first don't-care alternate on his name screen.)*

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

In the final battle, Pray becomes **scripted** (see A6, Chapter 10).

### Vibe ability unlock tables (abridged — full PP costs in data files, Prompt 9)

- **Jay:** Vibe Surge α (L1) /β (L16) /γ (L31) /Ω (L47); Lifeup α/β/γ (L3/L20/L38); Shield α/Σ (L9/L33); Flash α (L24); Hypno α (L6); **Teleport α (L26, story-gated Ch.6) / Teleport β (Ch.8)**
- **Mia:** Vibe Fire α–Ω (L1/15/29/44); Vibe Freeze α–Ω (L4/18/32/46); Vibe Volt α–γ (L10/26/40); Magnet α (L8); **Pray (L1)**
- **Pippa:** No Vibe. **Pinpoint Mark** (joins; next ally ignores miss/evasion), **Royal Rally** (joins; party Speed/Luck pulse), **Pocket Patch** (joins; small heal + status peel), **Scale Step** (L30; self-evasion + decoy), **Big-Little Focus** (Ch.5 build with Milo; party-wide Focus), **Bellwether** (L44; morale burst that strengthens the next Pray/caller-style effect)
- **Dorin:** Vibe Comet α (joins) / Ω (L52); Vibe Freeze line shared; Mirror (joins); Brainjam α/Ω (L44/50); Healing α–γ
- **Milo:** No Vibe. **Spy** (reveals enemy HP/weakness), **Repair** (turns Broken Gizmos found in the world into working battle items overnight when sleeping), Bottle Rocket tiers (single → Big → Multi)

> *(Amended 2026-06-12 per Appendix rule 6: the main cast expands from four
> to **five** with a new future-land hero, not an Otterbrook sibling.
> **Pippa Quill** joins from Minimus in Ch.5. Ana and Vivi remain Jay's
> little sisters, the Lemonade Empire heart, and quest #3 callers. Pippa's
> scale is held readable by the Royal Thimble / Big-Little Lens gag: on the
> overworld she rides at kid-readable sprite scale, in battle her animations
> snap back to tiny precision. Engine support is planned in the prompt
> sequence as a five-hero expansion: save names, party rail, battle/status
> layouts, follower trails, equipment, art, and validators must all prove
> five without shrinking the emotional focus.)*

> *(Amended 2026-06-11 per Appendix rule 6, ADR-035 — **AWAKENINGS**: heroes
> no longer start with Vibe. The old light arrives at STORY MOMENTS, scene-
> staged and played straight (§A11.2), so every ability is an event; level
> unlocks are spaced out and the signature lines leap harder per tier
> (Surge/Fire α→β ≈ 2.6×). Teleport α/β (story-gated, Ch.6/Ch.8) was always
> the precedent — it is the rule now. **Ch.1 ships three:** Jay awakens
> VIBE SURGE α at Glint's crater prophecy — one beat before the Tick, whose
> latch the Surge can sever (§A6 amended below) — and LIFEUP α at the porch
> when Glint's last spark settles into him (beside the GLINT'S SPARK item
> the beat already grants: progression gear is handed at story beats, never
> floor-found). Mia keeps **Pray innate at L1** (her faith is who she is)
> and awakens VIBE FIRE α touching the Locket in the holding room — "hears
> the Embers sing," made literal. Jay's level table now opens at Hypno α
> (L10) → Shield α (L14) → Surge β (L18); Mia's at Freeze α (L12) →
> Magnet (L15) → Fire β (L17). **The arc forward (chapter sessions
> implement, one awakening per chapter's emotional center):** Ch.2 the
> Gilded Grin's HOLLOW reveal; Ch.3 Milo's gadget tiers stay level/quest
> work (gadgets are built, not awakened — his identity); Ch.5 Pippa's
> Big-Little Focus is built, not awakened; Ch.6 Teleport α (canon);
> Ch.7 the Locket recovered on the night train re-awakens loud; Ch.8
> Teleport β (canon); Ch.9 Dorin's Trial IS his awakening (canon
> already staged it); Ch.10 the finale's scripted PRAY is the last one. The
> validator pins each chapter's manifest as it lands.)*


> *(Amended 2026-06-11 per Appendix rule 6, ADR-039 — Ch.2's awakening
> SHIPPED: Mia awakens **VIBE FREEZE α** the moment the Gilded Grin goes
> hollow ("cold reads what gold hides" — staged sincere, §A11.2, and it
> cracks the SOLID form's physical immunity for a beat). Freeze α leaves
> her L12 unlock row accordingly; her ladder restates as Magnet (L15) →
> Fire β (L17) → Volt α (L20) onward, unchanged. Saves from before the
> move keep any Freeze a v6 Mia at L12+ could already cast — the v7
> migration backfills the flag.)*

## A4. Core Systems (the EarthBound DNA)

1. **Rolling Odometer HP.** HP/PP tick down like a mechanical odometer (~2 digits/sec). A mortal hit can be outraced by healing or by *winning the battle* before the meter hits zero. This is the single most important feel-mechanic — Prompt 13 is dedicated to it.
2. **Visible overworld enemies, no random encounters.** Touch an enemy to battle. The swirl reads like a traffic light: touch them from behind and the swirl is **green** — your free round; let them back-attack you and it is **red** — theirs. If your party vastly outlevels the enemy: **instant auto-win** screen, no battle.

> *(Amended 2026-06-12 per Appendix rule 6, ADR-043: the swirl colors above
> were originally written reversed — green for the enemy's drop, red for
> yours. The user's playtest (and EarthBound itself) read green as GOOD
> NEWS; the engine now shows green = player advantage, red = enemy
> advantage, paper-grey = neutral. `SWIRL_TINT` in battle/formulas.ts is
> the pinned source of truth.)*
3. **Save = Call Your Dad.** Phones (home phones, payphones, banana-shaped novelty phones, a yak with a satellite dish in China) let you call **Dad**, who saves the game ("Have you been eating well, champ?"), tracks playtime, and occasionally insists you take a break. **3 save slots.**
4. **Money = Dad's deposits.** Battle winnings are deposited by Dad into the **Otterbrook Savings & Loan** card, withdrawn at ATMs worldwide. Mom's home cooking (your favorite food, chosen at game start) cures **Homesickness** — a status Jay randomly contracts that makes him skip turns daydreaming about Mom's cooking. Call Mom to cure it.
5. **Picnic.** At picnic tables scattered through every region (≈3 per chapter, ≈30 total), use a **Picnic Basket** item: full party HP/PP restore + the **Sunny Side** buff (+10% all stats for the next 5 battles). Baskets are bought (Basic), assembled at delis from 3 regional foods (Family), or earned from Buni's quest (Feast — adds auto-revive once). Tables are placed *before* dungeons — finding one is strategy.
6. **Teleport.** Jay learns Teleport α (run-up required — on touch, hold the D-pad to sprint a circle; with a controller, hold the stick) in Ch.6 to revisit any visited town. Teleport β (Ch.8) needs only a short dash. Crashing into walls = comic soot-faced failure.
7. **Death & Angels.** Hitting 0 HP makes a hero **unconscious**; if the whole party drops, Jay wakes at the last Dad-save with **half his cash on hand** (banked money is safe). Fallen party members trail behind Jay as **little haloed angels** — visible on the overworld, unusable in battle — until revived at a **hospital** (or **Healing γ / Hallelujah-tier prayer items**).
8. **Status effects:** Sunburn (poison-over-time), Crying (can't aim — gnats, onion ghosts), Asleep, Paralyzed, Homesick (Jay only), **Hushed** (silenced — no Vibe), Mushroomized (Ch.8 spore forest — controls scramble until cured at a doctor).
9. **The Star Locket.** Key item UI: shows Embers collected (0–10) and plays the growing Homesong on the pause screen — one more instrument layer per Ember.

> *(Amended 2026-06-13 per Appendix rule 6, ADR-061 — **§A4.12 TONICS & THE
> SECOND WIND.** TONICS are a one-shot consumable (`tonic` ItemKind) that
> PERMANENTLY raises a stat on use and persists in the save — EarthBound's
> pills/capsules made literal and warm: Sudden Guts Pill (+Guts), Growth Spurt
> Milk (+max HP), Charged Battery (+max PP), Brain-Food Lunch (+Vibe),
> Speed-Demon Soda (+Speed), Iron Tonic (+Offense), Turtle Wax (+Defense), a
> Lucky Penny (+Luck). Rare and dear by design; a few are quest/boss rewards.
> The boost rides a per-hero `boosts` map kept apart from level-recomputed
> stats, so it never washes out on level-up. THE REVIVAL LINE scales a hero
> back up from a cheap **Second Wind** (revive at 1 HP) through Glint's Spark /
> Ember and the Guardian-Angel Feather to **Milo's Defibrillator** (a Repaired
> Gizmo, §A3 Repair made an item — reusable) and the **Hallelujah Bell**
> (prayer-tier, full revive): mechanically, any `cure` that lists `'down'`
> revives, healing by its own value. §A4.7's front-desk revival still works for
> cash; these are the item path. The numbers 10/11 in this list are reserved
> for the unlanded S16 systems (the dead-air helmet, the overworld PSI keys).)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-068 — **§A4.10 THE CONTROL SYSTEM
> (the borrowed hands).** Two complementary powers the party earns when it becomes
> THREE (Ch.3, on Milo's join), staged as ADR-035 awakenings/builds. **JAY — VIBE
> PUPPET (mind control of PEOPLE):** a higher turn of his Hypno line. PUPPET (field)
> and **Mind Warp** (battle) are now ONE staged power — the engine ability
> `mindwarp_a`, RE-STAGED off Jay's old L21 level unlock to the Ch.3 PUPPET
> AWAKENING (`the_first_borrow`); the engine id is FROZEN (ADR-031/023), only the
> display face + the timing moved. Tap a highlighted person in range, act AS them
> for a PP-costed window (walk them, open a gate, vouch past a guard, take a
> driver's seat), then give it back — the comedic, apologetic OPPOSITE of the Hush's
> permanent theft. **MILO — THE CLICKER (machine control):** a universal remote he
> builds; pilot an UNOCCUPIED vehicle/machine driver-less to unlock a path. **THE
> RIDE (combined):** usable seats = `vehicle.seats − 1`; board only if ≥ party size,
> else Clicker-drive it empty. **THE COUNTER — the DEAD-AIR HELMET** is the diegetic
> face of the `mind_immune` flag, ONE identity across both contexts (a helmeted enemy
> resists Mind Warp in battle AND can't be Puppeted on the field; a Faraday-shielded
> machine refuses the Clicker) — route around it or knock it off in a boss fight. The
> rules live in `src/engine/control.ts` (targeting, range, the helmet/shield block,
> PP cost, the seat-fit ride/remote split, remote-drive gate unlocks); the
> OverworldScene owns the wheel UI + driving feel. **THE TRUST THREAD opens here**
> (§A11.2): the first time the others SEE Jay PUPPET someone they pull back a step
> and the borrowed stranger comes back rattled — the start of a game-long slow burn
> that climaxes at the three-quarter mark (the weave lands in a later movement). It
> SCALES all game (ADR-035 staging): cars → trucks/buses → boats → planes → subs →
> yachts.)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-069 — **§A4.11 PSI IN THE WORLD
> (powers as keys).** Beyond battle, certain abilities are OVERWORLD KEYS,
> EarthBound-style: **PSI Fire** burns vine walls / lights furnaces / melts ice;
> **PSI Freeze** freezes coolant pipes, waterfalls, and geysers into crossable ice;
> **PSI Flash** reveals hidden paths and lights dark rooms; Teleport stays per §A4.6.
> Field-casting plays a NEW overworld animation and the obstacle reacts. Each gate is
> a `PsiGateDef` (`src/data/psigates.ts`) with a `kind` and the single `key` that
> answers it (`GATE_KEY` is the one truth); the casting rules live in
> `src/engine/psi.ts` (which ability is which key, the learned-first check, which cast
> clears which gate) and reuse the §A4.10 control spine for range + PP. Every chapter
> DUNGEON seeds ≥1 gate using a chapter-appropriate ability; the ability is LEARNED
> first (awakening/level) and the gate pays it off — a gate is never the sole teacher,
> and is non-missable + retry-safe (a PSI cast has no cooldown and no fail state).
> Pinned both directions (`psi-gate` gate + `psi.test.ts`): every gate's key matches
> its kind and has a real teacher, and every dungeon band (ch3–10) carries one.)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-070 — **§A4.13 THE PROPERTY MARKET
> (deeds, agencies, lawyers, the flip).** Real estate is a buyable, sellable, OWNABLE
> layer over the world and the back-half wealth engine (§A9 Fortune Arc). Every town
> has a REAL-ESTATE AGENCY (an agent with one §A11 obsession — she calls every room
> "cozy" — who LISTS the region's properties: price, an in-voice blurb, an open-house
> walk) and a LAWYER'S OFFICE (closing: sign "the crayon box", pay or finance, walk
> out with THE DEED — a key-item; selling closes here too, minus "the tenth part, for
> the pen"). The OTTERBROOK SAVINGS & LOAN gains a LOAN DESK (a car note + a mortgage:
> borrowed cash now, repaid as a 25% GARNISH of every future Dad deposit until the
> principal × 1.1 clears; one active garnish at a time). A HOME is a base (§A4.14);
> beyond it you buy run-down cheap, renovate + furnish it (COZINESS lifts resale), and
> FLIP it through the lawyer, while owned shops/rentals pay RENT into Dad's deposits at
> chapter boundaries. Prices move at chapter boundaries on a SEEDED deterministic walk
> per save (ADR-008 replay byte-equal). The registry is DATA (`src/data/properties.ts`)
> + pure economy math (`src/engine/property.ts`, validated); ownership + loans ride
> ADR-015 FLAGS, a DEED is a key-item string, and the only array-shaped save state is
> per-home storage (`homeStorage`, save v11). 27 MAPLE is Otterbrook's live starter;
> HILLCREST MANOR + the per-region homes are defined/priced and land with their
> chapters. The Ember trail never cares about money; net worth is a number, the callers
> are the score.)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-071 — **§A4.14 THE HOME EDITOR (a
> Sims-style base you make yours).** Any home you own can be decorated with
> FREE-PLACEMENT furniture on its room tile grid: open the editor (the paused-world
> sub-scene precedent), pick a piece from the FURNITURE CATALOG (`src/data/furniture.ts`
> — each piece a footprint + a §A4.14 FUNCTION + a COZINESS value + a theme + a price),
> place / move / ROTATE it; the layout saves per-home (`homeLayouts`, save v12). The
> placement RULES (`src/engine/homeeditor.ts`, validated) guarantee a furnished home
> can never soft-lock: no overlap, never block the door, and the room stays fully
> traversable from the door (a BFS refuses any wall-off). Furniture is more than
> dressing: a home's COZINESS (computed from what you place — points + a variety bonus
> + a theme bonus, 0–100) gives a small REST BUFF after sleeping (a Sunny-Side-lite)
> AND raises the property's resale (the flip hook — it feeds `property.sellProceeds`).
> The §A4.14 use-cases are the FUNCTION tags: THE BED (free full restore), THE PHONE
> (Dad saves), THE FRIDGE (a free regional food), THE FOOTLOCKER (home storage by
> tier), THE MANTEL (trophies + Mr. Click photos), THE RECORD PLAYER (the Homesong
> stems), THE MAILBOX (Dad's postcards), THE WORKBENCH (Milo's Repair), THE KITCHEN
> COUNTER (picnic baskets), THE PET BED (Biscuit), plus décor that matters (plant,
> fish tank, gnome, sofa, lamp, rug). The decor is the soul; the buff is the wink.)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-078/079 — **§A4.15 THE GARAGE & THE DEALERSHIP.**
> Road vehicles are buyable, sellable, and OWNED — the fleet pattern: a `title_*` key-item + an
> `owned_*` flag, never the §A8 item catalog (ADR-015 prefer-flags). A CAR DEALERSHIP (Bert's lot,
> one §A11 obsessive — the NEW-CAR SMELL) LISTS the region's road vehicles by chapter band, buys and
> sells them on a DEPRECIATION curve (trade-in < sticker always — a banded `RESALE_BY_BAND` factor;
> cheap early rides lose hardest, dear exotics hold value better but never reach par; "the tenth, and
> the new-car smell"). The data is `src/data/dealership.ts`; the buy/sell/own math is pure +
> validated in `src/engine/garage.ts` (`carsForSale`/`buyCar`/`sellCar`/`titleOf`/`ownsCar`), gated
> both directions (`dealership`). A HOME'S GARAGE stores owned cars by the property's `storageTier`
> (a starter home holds a couple, a manor a fleet); you pick the ACTIVE car to drive and the rest
> park visibly. The garage + active ride are the only array/scalar save state this earns (`garage:
> Record<propertyId, titles[]>` + `activeVehicle`, save v13); everything else rides flags. Prices tie
> to §A9 / the Fortune Arc; the Ember trail never cares which car you drive.)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-072 — **§A6 STORY WEAVE: the two
> threads + the disguise sneaks.** The §A4.10 control system grows two game-long,
> NON-MISSABLE arcs, each a flag-chained beat registry (`src/data/storythreads.ts`,
> driven by `src/engine/storythread.ts`, validated ordered + single-terminal). THE
> TRUST THREAD (Jay's free-will mirror): OPENS the first time the others see him
> PUPPET someone (Ch.3), slow-burns the "are we even free?" doubt across Ch.4–7,
> CLIMAXES at the three-quarter mark (Ch.7→8 — the Hush weaponizes the doubt to split
> the party), and RESOLVES when they choose trust and Jay proves he's the Hush's
> opposite (he refuses to take a will even when it would fix everything) — the party
> bonds for Ch.9–10 and it feeds the finale free-will PRAY. THE CLICKER QUESTION
> (Milo's blame mirror): the comedic SEED (Ch.5 parade float), the sincere CRISIS
> (Ch.7 — a Hush-spoofed signal frames him; even he isn't sure), the public CLEARING
> (Ch.8 — he Clickers a disaster to safety in the open and exposes the spoof, earning
> a finale caller). The two RHYME (the Hush turning each hero's gift into a reason to
> fear them) but peak on different beats. THE DISGUISE/COSTUME SNEAK
> (`src/data/disguise.ts` + engine): don a costume to blend with a faction (the
> Smilers Ch.1, palace guards Ch.7, Hoaxula's cast Ch.9); getting "made" is a FIGHT,
> never a fail. The highway set-pieces, the mandatory drive, the plane-interior, and
> the Cobra Raja DEAD-AIR-HELMET boss are the per-chapter scene staging that rides
> these spines + the M26 vehicles + the M27 control system.)*

> *(Added 2026-06-14 per Appendix rule 6, ADR-074 — **§A4.10/§A5 THE FLEET (the
> traversal capstone).** The control power SCALES up the chapters (ADR-035 staging,
> `FLEET_STAGES`): cars (Ch.3) → trucks/buses/machinery (Ch.5) → boats (Ch.8) →
> planes + helicopters (Ch.10) → submarines/yachts (late) — each a staged story
> moment, not a menu unlock. WATER becomes drivable terrain and AIR a traversal
> layer (the M26 `VEHICLE_SPECS` terrain axis); the piloting rules live in
> `src/engine/fleet.ts`: depth (a dinghy hugs rivers, a yacht needs open water, a
> sub DIVES — `WATER_ACCESS`), launch (a jet needs a runway, a heli lifts off
> anything flat — `AIR_ACCESS`), and the boat/plane/sub SCENES (momentum/drift, a
> wake, takeoff + landing, the dive layer) render over them. PURCHASING: the bigger
> craft are bought at dealers/marinas/airfields/helipads (incl. on owned properties)
> as key-item TITLES (`FLEET_CRAFT` — the Comet GT, the river dinghy, the Starhopper
> jet, the Pearl yacht, the Deep Marlin sub, the Sky Taxi heli), priced to the §A9
> Fortune Arc, sold by §A11 obsessives (Bert, the harbormaster, Roxanne); a purchased
> craft parks visibly at your property. THE EMBER-TRAIL LAW HOLDS (§A5): a flown/
> sailed craft reaches VISITED nodes ONLY (`reachesNode`) and new chapters still gate
> on the Embers; DEAD-AIR-shielded craft + no-fly/no-wake zones (`zoneOpen`) are the
> diegetic fences. Teleport stays the no-luggage option; the fleet is the wealth +
> traversal fantasy on top. Validator-pinned (`fleet`): venue↔terrain, unique titles,
> staging climbs road→water→air.)*

## A5. The World Route & Travel

| Ch. | Region | Locales | Travel in |
|---|---|---|---|
| 1 | 🇺🇸 America | Otterbrook → Hickory Hill → Brickton City | On foot / city bus |
| 2 | 🇵🇪 South America | Puerto Sol → Valle Dorado → Gilded Ruins | Banana cargo ship |
| 3 | 🏴 England | Foggybottom-on-Tyne → Wintermoor Academy → The Old Stones | Uncle Bert's biplane "Lucille" |
| 4 | 🇳🇴 Norway | Kvisthavn → Bootstep Moor → Lilleby → The Sleeper's Spine | Lucille's North Sea hop (she barely makes it) |
| 5 | 🏰 Minimus | Minimus Major → Procession Way → The Hedgerow → Ducal Crown | Lucille again (she lands in the duchy. All of it.) |
| 6 | 🌍 Africa | Bazaar port of Zanzibel → Savanna crossing → Laughing Ruins | Lucille again (she has no business making it) |
| 7 | 🇮🇳 India | Chandrapore bazaar → River ghats → Cobra Palace | Overloaded night train |
| 8 | 🇨🇳 China | Lotus Harbor → Spore Forest → Mt. Shu Temple | Riverboat + the Yak Express |
| 9 | 🇷🇴 Romania | Valea Stelelor village → Castle Hoaxula → Stone Brow Monastery | The Orient Less-Express (third-class) |
| 10 | 🇺🇸→🌋→🔴 | Aurora Station, Alaska → Mauna Lani launch pad, Hawaii → **MARS: The Sea of Silence** | Snow-cat, then Professor Pemberton's rocket *The Long Shot* |

The world FEELS open: every region has off-path screens, optional caves, side quests, and once Teleport unlocks (Ch.6) the whole visited world reopens — but the Ember trail keeps the story linear and completable.

**The road/traffic layer (S18 M26, ADR-067).** On TOP of the set-piece travel table above
(which is unchanged — the Embers keep the journey linear), the world's streets now have
WHEELS: a deterministic, seeded TRAFFIC system (`src/engine/traffic.ts`) drives cars, buses,
trucks, bikes, and machinery over a map's road graph as living ambiance + the control
system's future borrow-targets. It is pure, pooled, and culled for 60fps, and it obeys the
SAFETY LAW — a moving vehicle never crushes the player and never seals the player's last lane
(it yields/turns instead; proven over many time-steps in `traffic.test.ts`). The art is THE
VEHICLE FORGE (`src/spritegen/vehicles.ts`): a deterministic, hand-drawn, RAMP-painted catalog
of every road vehicle PLUS the fleet the §A4.10 control power scales into (boats/subs/planes/
heli/blimp), each carrying its true gameplay DATA — a `seats` count (usable-to-ride = seats − 1,
the seat-fit law), a collision footprint, and the terrain it travels (road/water/air). Pinned
both directions (`VEHICLE_CATALOG` ⇄ `VEHICLE_SPECS`). None of this replaces an Ember leg.

## A6. The Ten Chapters & Ten Bosses

> Boss stat lines are canon starting values; Prompt 31–40 wire them. Format: **HP / signature gimmick**.

### Chapter 1 — "The Night It Fell" (USA) — target end level: 8

Tutorial-by-doing. Meteor crash, Glint's prophecy and death-by-bug-zapper, the neighbor kid **Chad Pickle** (Pokey analog) tags along then betrays you twice before lunch. Jay crosses Hickory Hill, takes the bus to **Brickton City**, and rescues **Mia** from the **Department of Smiles** — a cult of unsettlingly cheerful adults in blue blazers ("Have a PRODUCTIVE day!") who've been Hushed.

**Resonance Site:** Hickory Hill crater. **BOSS 1 — THE TITANIC TICK** (450 HP / latches onto a hero and drains HP each turn until hit with Vibe Fire or a thrown Salt Shaker).

> *(Amended 2026-06-11 per Appendix rule 6, ADR-035: the OLD LIGHT severs
> the latch too — Jay awakens VIBE SURGE α at Glint's prophecy one beat
> before this fight, and the awakening is its diegetic tutorial. Vibe Fire
> and the Salt Shaker remain canon severs.)*

### Chapter 2 — "The Gilded Grin" (South America) — target level: 13

Banana boat to **Puerto Sol**. The mountain village **Valle Dorado** worships a golden idol that recently "started granting wishes" (it eats Vibe as payment — wishers go gray and quiet). Llama-herding side content, jungle paths, step-pyramid dungeon with rotating-floor puzzles.

**Resonance Site:** pyramid apex. **BOSS 2 — IDOL OF THE GILDED GRIN** (980 HP / alternates between SOLID GOLD form (physical immune — use Vibe) and HOLLOW form (Vibe immune — swing bats); telegraphs the swap by grinning wider).

### Chapter 3 — "A Very Foggy Term" (England) — target level: 18

**Milo joins**, crash-landing his homemade rocket into his own school's greenhouse. Wintermoor Academy's mainframe — installed to "optimize student happiness" — has been Hushed and runs the school like a factory; the fog outside is *machine-generated*. Stealth-lite dorm sneaking, library side quests, tea that restores PP.

**Resonance Site:** The Old Stones (a pocket Stonehenge). **BOSS 3 — HEADMASTER MAINFRAME** (1,600 HP / summons two Prefect Drones each time both are down; Milo's Spy reveals its cooling fan weak point — Vibe Freeze doubles damage).

### Chapter 4 — "The Fjord That Sleeps" (Norway) — target level: 22

Lucille's North Sea hop lands at **Kvisthavn**, a normal-scale fishing hamlet under the cliffs. Past the tree line the LOW Ember's hum has swelled every living thing for generations: **Bootstep Moor** (10× wildlife, half of it friendly) and **Lilleby**, the giants' town, pop. 41, where the party walks under doors and giants kneel to talk ("WELCOME TO LILLEBY. Everything here is normal-sized. — the Booster Club"). The mountain behind town is a giant: **Grandfather Storheim**, 100×, asleep forty years. The dungeon, **The Sleeper's Spine**, crosses his body hand → shoulder → ear; his terrain is the map, never a giant sprite.

**Resonance Site:** the Sleeper's Ear. **BOSS 4 — THE WHISPERWIG** (1,900 HP / burrows into the ear canal — untargetable — until NOISE forces it out: Vibe Volt or a Firecracker String; every 3rd turn it whispers party-wide Hushed pressure. Mia awakens **VIBE VOLT α** mid-fight, the thunder-snore in her teeth. Heartlight 4 = **The Deep Hum**, the Homesong's bass stem).

### Chapter 5 — "The Grand Duchy of Minimus" (Minimus) — target level: 26

The HIGH Ember fell on coronation night and shrank the realm to 1/100; the duchy calls it a blessing ("rent has never been cheaper"). The party are the visiting colossi: **Minimus Major** is a tabletop capital — knee-high cathedral, ribbon streets — walked only on the **Procession Way** so the Whistle Guards do not have to panic. **Pippa Quill**, royal census cadet and page to Grand Duchess Millimetta I, keeps trying to brief the party from a matchbox podium and being mistaken for a talking lapel pin. Milo's Ch.5 build happens here: the duchy's hundred engineers help grind Sigrid's spare lens into the **Big-Little Lens**, upgrading Spy with party-wide Focus and giving Pippa a readable travel scale without "fixing" Minimus. After WHISKERZILLA is knighted instead of beaten, the Duchess appoints Pippa **Foreign Minister of Being Taken Seriously** and sends her with the party; Pippa joins with the Royal Thimble as her scale-anchor key item.

**Resonance Site:** the Ducal Crown. **BOSS 5 — WHISKERZILLA** (2,150 HP / an ordinary lost housecat, their kaiju; every 3rd turn the tail-wiggle telegraphs a POUNCE — Defend or be knocked flat, Paralyzed. The Flat Bell is a second 150-HP target granting evasion while it rings; break the bell and the purr gives every move away. Victory does not defeat it: it gets bored. Heartlight 5 = **The Bell Choir**, the Homesong's highest stem).

### Chapter 6 — "The Ruins That Laugh" (Africa) — target level: 30

Port city **Zanzibel** (best market music in the game), caravan escort across the savanna at dusk (waves of hyena-ish enemies), then desert ruins where laughter echoes from nowhere. **Teleport α unlocks here** (taught by a retired courier mystic, "The Fastest Man in Zanzibel, 1961").

**Resonance Site:** the Sphinx's chin. **BOSS 6 — THE LAUGHING SPHINX** (2,300 HP / opens with a riddle — answer via menu choice; correct = skip its first 3 turns, wrong = party starts Crying. Riddles drawn from a pool of 8 for replays).

### Chapter 7 — "The Cobra's Palace" (India) — target level: 35

**Chandrapore**: the game's biggest city — bazaars, river ghats, a cinema playing a movie *about your party* (nobody believes you're them). The Maharaja's palace has been usurped by his royal vivarium. Night-train heist sequence to recover the stolen Locket (story beat: brief item loss, 30 minutes max).

**Resonance Site:** palace throne. **BOSS 7 — COBRA RAJA** (3,200 HP / Paralyzing gaze every 3rd turn — block with Shield Σ or Mia's Magnet; sheds skin once at 40% HP, restoring 800 — burn it down fast through the threshold).

### Chapter 8 — "The Paper Dragon" (China) — target level: 40

Riverboat to **Lotus Harbor**, through the **Spore Forest** (Mushroomized status — controls scramble), up the Yak Express to **Mt. Shu Temple**, where monks fold paper guardians. The Hush got into the paper. **Teleport β unlocks** (temple elder: "You run too much. Run less."). Pippa's tiny-diplomat read pays off here: she spots false folds and hidden creases in the paper guardians before the taller kids can see them.

**Resonance Site:** temple bell. **BOSS 8 — THE PAPER DRAGON** (4,100 HP / immune to physical while airborne; Vibe Volt or Bottle Rockets knock it down for 2 turns; casts Vibe Fire on ITSELF when low — it's paper — entering a desperate burning phase with doubled speed).

### Chapter 9 — "The Count of Valea Stelelor" (Romania) — target level: 46

The emotional heart. **Valea Stelelor** ("Valley of the Stars") — painted gates, haystacks, a grandmother named **Buni** who feeds the party until their HP overflows and gives the **Feast Basket** recipe quest. A "vampire," **Count Hoaxula**, terrorizes the valley from his castle — he's actually a Hushed theme-park actor from Cleveland whose haunted-castle attraction went bankrupt, now armed with very real stolen Vibe. Meanwhile Jay's group is summoned up the mountain: **Dorin** completes the **Trial of the Mute Mountain** at Stone Brow Monastery (playable solo sequence: Dorin meditates while the mountain "deletes" his senses one by one — screen goes dark, then silent, then UI vanishes — until he releases his fear) and **joins the party**.

**Resonance Site:** monastery bell tower. **BOSS 9 — COUNT HOAXULA** (5,300 HP / two phases: Theatrical phase — fake spells, real damage, steals one equipped item (returned on win); Unmasked phase at 50% — sobbing Cleveland accent, attacks become wild AoE; Mia's Pray "Good" tier or better instantly ends his second phase in mercy — the game's quietest victory).

### Chapter 10 — "The Long Shot" (Alaska → Hawaii → MARS) — target level: 52–55+

The Locket holds 9 Embers; the 10th never landed on Earth. **Aurora Station, Alaska** (mini-boss: **FROST SENTINEL**, 2,800 HP) decodes its position: Mars. **Professor Pemberton** (Milo's estranged dad, Dr. Andonuts analog) needs parts ferried to **Mauna Lani, Hawaii** (mini-boss: **TIKI MAGMA GOLEM**, 3,000 HP — fought *on* the volcano that powers the launch). Phone Dad. Phone Mom. She says she's proud of you. Launch.

**Mars — The Sea of Silence:** a dread-soaked final dungeon where the music thins out instrument by instrument as you walk. The 10th Ember sits in the Hush's core.

**FINAL BOSS — THE HUSH** (effectively unkillable by damage / three movements):

1. **The Static:** a normal-looking fight against its shell (6,000 HP) — beatable conventionally.
2. **The Quiet:** attacks "cannot be grasped." Damage does almost nothing. The UI itself glitches. Survival turns.
3. **THE CALLING:** **PRAY appears as Mia's only command.** Each scripted Pray makes a phone ring somewhere on Earth — and *every side-quest NPC you helped* answers, sends their Vibe, and deals massive scripted damage (base allies: Mom, Dad, Buni, Pemberton, Chad Pickle — yes, even Chad). More side quests completed = more callers = fewer survival rounds. Final Pray: the player is asked to **say the player-name they entered at the start** (text confirm), the Homesong plays in full, and the Hush — for the first time — hears something it cannot eat.

## A7. Enemy Roster (200 unique enemy types — canon target; full movesets in data files, Prompt 10)

The shipped game targets **200 unique standard enemy types**: 20 per chapter across 10 chapters. "Unique" means a distinct concept, sprite/silhouette, moveset hook, death line, and drop identity; palette swaps, raw stat bumps, and "same enemy but stronger" variants do **not** count. The table below is the **seed six per chapter** that anchors the tone and mechanics. Chapter content sessions expand each row to 20 with the same voice: local jokes first, one real mechanical hook per enemy, and no filler.

Per-chapter expansion mix: 6 seed enemies listed below, 4 road/field roamers, 3 dungeon specialists, 2 social/urban oddities, 2 rare/high-value enemies, 2 late-chapter pressure enemies, and 1 one-off set-piece enemy. Each chapter's manifest must name all 20 before the chapter is considered content-complete.

| Ch | Enemies (HP / quirk) |
|---|---|
| 1 | Cranky Mailbox (24/spits letters), Runaway Lawnmower (38), Coily Cicada (30/Sunburn), Blazer Smiler (55/"productive" debuff), Pigeon Gang (45/steals one food item), Hill Slug Deluxe (60) |
| 2 | Pickpocket Parrot (70/steals cash), Gilded Beetle (85/gold form), Cursed Souvenir (95/Crying), Step-Mask (110/Shield), Banana Bunch United (5×22), Jungle Jitterbug (120/Paralyze) |
| 3 | Prefect Drone (130), Possessed Textbook (115/Hushed status), Fog Hound (150), Tea Poltergeist (90/heals allies), Cricket Eleven (11×14, attacks in "overs"), Greenhouse Creeper (170) |
| 4 | Colossal Gnat (150/Crying), Runaway Knitting Needles (175/Paralyze), Thunder Snail (230/slow, hits like weather), Dog-Sized Berry (160/heals itself, poses as a pickup), Hushed Gull, Enormous (200/steals one food), Junior Jötun (260/grabs a hero) |
| 5 | Tin Parade (12×8/attacks in formation), Duelist Pip (210/minuscule), Crumb Cannoneer (240/fires your own rations back), Powder-Wig Wasp (260/Asleep), Wind-Up Wyrmlet (280/winds up), Dust Bunny of Unusual Size (300/splits) |
| 6 | Cackling Hyena (180), Mirage Vendor (160/sells fake items mid-battle), Scarab Sergeant (210), Dust Devilkin (190/blinds), Riddling Head (170/asks mini-riddles), Sun-Stroked Statue (240/Sunburn aura) |
| 7 | Bazaar Bull (260/charges), Monkey Magnate (220/steals equipped hat), Hypno Flautist (240/Asleep), Palace Peacock (280/Flash), Spice Spirit (230/random element), Rail Bandit (300) |
| 8 | Paper Crane Swarm (6×40), Mush Uncle (290/Mushroomize), Porcelain Warrior (340/shatters into 2), River Serpentlet (310), Incense Wisp (270/PP drain), Terracotta Understudy (380) |
| 9 | Haystack Mimic (360), Moss Strigoi (400/HP drain), Castle Bat Choir (5×60/Crying), Animated Armor of Hoaxula (450), Mămăligă Blob (380/splits), Wolf of the Old Road (470/calls pack) |
| 10 | Frost Wraith (480), Hush Static (520/Hushed), Null Walker (560/"cannot be grasped" 25% of hits), Ember Mimic (500/disguised as the pickup), Gravity Gremlin (450/reverses turn order), Silent Choirboy (3×180/heals Hush enemies) |

Every enemy has: sprite, 2–4 moves, weakness tag, EXP/cash/drop-table, and one **flavor death line** ("The Cranky Mailbox returned to sender."). The 200-type target excludes the 10 chapter bosses, minibosses, sports teams, arcade foes, and scripted hazards.

### Enemy Flow Law — 200 enemies that feel handcrafted

Every standard enemy is a tiny interactive scene, not a stat block. Before the player ever sees a battle menu, the enemy must do something readable on the map: pace, hide, bargain, chase, run away, pretend to be furniture, block a shortcut, guard a picnic table, or make the party wonder whether touching it is wise. The battle then pays that behavior off with a mechanical gag, and the victory text lands the final little joke. The loop is always **see the bit -> touch the bit -> play the bit -> remember the bit**.

The 20 enemies in each chapter are built as a local ecosystem:

- **Four road/field roamers** teach the chapter's everyday rules. In Otterbrook, the first roamers are annoyed suburbia: mailboxes, yard tools, itchy hill bugs. In Norway, the roamers are scale comedy: berries that are too big to fit in your inventory and weather-sized nuisances that drift across paths like moving walls.
- **Three dungeon specialists** make the dungeon's gimmick fight back. Wintermoor's school enemies enforce sight lines and schedule bells. Mt. Shu's paper enemies fold, unfold, and reveal false weak points unless Pippa reads the crease first.
- **Two social/urban oddities** turn towns into jokes without making towns unsafe forever: a boutique mannequin that only attacks if you try on three hats, a vending machine that refuses your dollar and then spends it on itself, a royal clerk who mistakes Jay's shoe for a public building.
- **Two rare/high-value enemies** are little stories, not loot bags. They have odd spawn rules, visible tells, and rewards tied to their joke: the Null Walker drops Comet Bead because it is the only thing in the world that remembers where it was.
- **Two late-chapter pressure enemies** remix earlier lessons right before the boss. They should make the player say, "Oh, I know this trick," then add one nasty twist.
- **One set-piece enemy** is allowed to break the normal encounter rhythm: a chase down a hallway, a tollbooth argument, a silent thing that only moves when the music cuts out, or a Minimus formation battle where Pippa's Pinpoint Mark turns chaos into order.

Chapter-by-chapter enemy identity:

- **Ch.1 Otterbrook / Brickton:** ordinary objects have lost patience. Enemies introduce the grammar: back attacks, food theft, status cures, and instant auto-win. Nothing here should feel epic; it should feel like the neighborhood is having the worst Tuesday of its life.
- **Ch.2 Puerto Sol / Valle Dorado:** greed and wish-making bend combat. Enemies haggle, steal cash, pretend to be treasure, or become physically beautiful and spiritually empty. The Gilded Grin's form-swap is foreshadowed by standard enemies that alternate "valuable" and "hollow" states.
- **Ch.3 England:** institutions become monsters. Prefects patrol like rules with shoes, textbooks punish wrong answers, tea ghosts heal the enemy side because hospitality got misfiled. Milo's Spy should feel essential here: he reads machines the way Mia reads people.
- **Ch.4 Norway:** scale is the mechanic. Some enemies are not bigger numbers; they are bigger problems. A giant berry blocks a bridge until fought or rolled aside. A thunder snail is slow on the field but hits like a storm in battle. The player learns that size changes tactics, not just sprite dimensions.
- **Ch.5 Minimus:** tiny things become politically serious. Enemy groups fight in formations, use turns to take votes, and exploit the party's huge hitboxes. Pippa's kit is born here: Pinpoint Mark lets the party respect small targets instead of whiffing at them, Royal Rally makes frightened citizens brave, and Pocket Patch treats status like a field medic with a sewing kit.
- **Ch.6 Zanzibel / Laughing Ruins:** the world tests attention. Mirage vendors sell fake items mid-battle, riddle heads punish button-mashing, dust enemies hide their real position. Teleport alpha arrives after the player has learned to read place and direction.
- **Ch.7 Chandrapore:** motion, crowds, and rhythm. Enemies steal hats, interrupt trains, call for backup from off-screen rooftops, and use market noise as cover. The best fights feel like trying to keep your party together in a festival crowd.
- **Ch.8 Lotus Harbor / Mt. Shu:** shape is unstable. Paper enemies change weakness when folded; Mushroomized controls make even a familiar enemy feel wrong; porcelain enemies break into smaller, more embarrassing problems. Pippa gets special reads here because she understands scale, paper, and ceremony.
- **Ch.9 Valea Stelelor:** theater, hunger, and mercy. The enemies are props that forgot they were props, old-road dangers, pantry jokes, and quiet tests before Dorin's chapter. The closer the party gets to the monastery, the fewer cheap jokes the enemies get; the Hush is near, so the writing breathes.
- **Ch.10 Alaska / Hawaii / Mars:** survival turns strange. Earth enemies are severe but still local: cold, generators, volcanic pressure. Mars enemies attack interface comfort itself: missing sound cues, scrambled turn order, attacks that "cannot be grasped." They must be fair, but they should feel like the game is becoming lonely.

Enemy data must include a **map tell**, a **battle hook**, a **drop with identity**, and a **death line**. If any of those four are generic, the enemy is not done. Acceptable: "The Mirage Vendor refunded your confidence." Not acceptable: "Enemy defeated." If an enemy could be moved to another chapter without rewriting its joke, silhouette, and moves, it is not specific enough yet.

## A8. Items (canon catalog — ~500 items; full prices/stats in data files, Prompt 10)

> *(Amended 2026-06-13 per Appendix rule 6, ADR-061 — **THE GREAT CATALOG**: the
> target moves from "~140 items" to **~500 items**, a real shopkeeper's inventory
> of a world. The rough per-category breakdown the validator counts: ~60 weapons
> (a 5–7-rung personal ladder for each of the five heroes + funny regional
> sidegrades), ~70 armor (the hat ladder + bodies/robes/vests/coats per region),
> ~45 arms (wraps, gloves, bracers — incl. the hero-signature SETS), ~55 charms
> (pendants/charms: luck + resists + small riders, incl. hero SETS), ~110 foods,
> ~30 PP drinks, ~35 cures (every §A4.8 status, tiered) + ~12 revival items, ~25
> tonics (permanent boosts), ~55 battle items, ~45 valuables, ~50 key items, ~12
> picnic baskets. Every item is unique, iconed (ADR-060), priced to §A9, carries
> a chapter band, and smells of its exact region (§A11.7). NEW mechanics become
> canon here: **TONICS** (a `tonic` ItemKind — a one-shot consumable that
> PERMANENTLY raises a stat: Offense/Defense/Speed/Guts/Luck/Vibe/max HP/max PP;
> see §A4.12); **the MULTI-TIER REVIVAL LINE** (Second Wind → Glint's Spark →
> Glint's Ember → Guardian-Angel Feather → Milo's Defibrillator → the Hallelujah
> Bell; §A4.12); **ELEMENTAL RESIST gear** (armor + charms carry fire/freeze/
> volt/holy resist %, the "pendants (elemental resists)" line made real); **VIBE
> on gear** (charms/arms/robes can buff Vibe power — the §A10 Riddle Ring's +10
> Vibe finally has a field); and **SECONDARY equip bonuses** (equipment keeps ONE
> primary slot stat — weapon→Offense, body→Defense, arms→Speed|Guts, other→Luck —
> AND may carry a small rider summed on top, shown as "(also +N X)"). Movement 16
> (the spine) added the schema + mechanics + the per-region validator tables; the
> regional catalogs pour the items in, Americas → Mars.)*

**Weapons** — Jay's bats: Cracked → T-Ball → Sandlot Slugger → Aluminum → Hall-of-Famer → *Casey's Last Swing* (Ch.10 drop). Mia's pans: Hand-Me-Down → Copper → Cast-Iron → Chef's → *The Holy Pan*. Milo's guns: Pellet Popper → Spud Gun → Double-Barrel Sparker → *Gauss Lobber*; Bottle Rocket / Big / Multi (consumables). Pippa's kit: Stamp Sling → Needle Saber → Thimble Bell → *Royal Red Pen*. Dorin: Cedar Beads → River Beads → *Comet Bead* (1/128 drop, Null Walker — the chase chase).

**Armor:** regional hats (Otterbrook Cap → Cricket Cap → Turban of Calm → Paper Crown → Cushma → Fur-Lined Hood), bracelets, pendants (elemental resists), *Star Pendant* (Ch.7).

> *(Amended 2026-06-11 per Appendix rule 6, ADR-034: the 'arms' slot opens
> with **THE STARTING FIVE** — the Brickton Classic's first-title prize,
> one wielder-tagged piece per hero: Champ's Sweatband (Jay, Guts+6),
> Victory Scrunchie (Mia, Speed+6), Shooter's Sleeve (Milo, Speed+7),
> Minister's Ribbon (Pippa, Luck+6), Iron Wristguard (Dorin, Guts+7). Battle and STATUS read Speed/Guts through the
> slot the way Defense reads the Champion Jacket. The §A8 manifest extends
> in the validator in the same commit, per ADR-017.)*

> *(Amended 2026-06-11 per Appendix rule 6, ADR-037: the 'other' slot
> expands with **THE SUNDAY SET** — the Costa Estrella Invitational's
> first-title prize, five hero-tagged charms: Sunday Visor (Jay, Luck+7),
> Sunday Glove (Mia, Luck+6), Lucky Tee (Milo, Luck+6), Tiny Green Jacket
> (Pippa, Luck+6), Caddy's Marker (Dorin, Luck+7). Luck reads through the S9 charm seam; repeat titles pay
> cash in hand. The §A8 manifest extends in the validator in the same
> commit.)*

> *(Amended 2026-06-14 per Appendix rule 6, ADR-076 — **§A8 THE ROAD ROSTER GROWS.** The §A4.10
> vehicle forge fleshes out into a real car habit. The TWO-WHEELER tier: a **BMX** + a **road bike**
> (1 seat each), a **cruiser** + a **sport bike** (2 seats — rider + pillion). The HIGH-END / EXOTIC
> tier reads unmistakably expensive: a **grand tourer** (long low wedge, chrome rocker), a
> **roadster** (an OPEN convertible — cut windshield, headrests, no roof), a **stretch limo** (8
> seats, swallows the whole party), and a hot-rod **muscle car** (hood scoop, side pipes). All are
> drawn FACING RIGHT under ADR-020, seat-fit-correct (§A4.10), footprint-in-bounds, and Fortune-Arc
> priced when the §A4.15 dealership sells them. None is a bag weapon — they are world props / drive
> targets / `title_*` ownership.)*

> *(Amended 2026-06-14 per Appendix rule 6, ADR-077 — **§A8 THE NIKOLAI** (a wink at Nikola Tesla,
> never the trademark). The flagship of the EV line: a sleek, silent, premium electric car — a
> glassy near-frameless greenhouse, flush door handles, a front LIGHT BAR, an instant-torque
> "ludicrous" launch, and a SELF-CREEP autopilot gag (it can trundle around an empty lot on its own,
> no Puppet/Clicker needed — a perfect control-system bit, gated so it only creeps in a cleared
> lot). Five seats (rides the whole party), its own monochrome+accent paint pool, drawn premium
> under ADR-020.)*

**Food (HP):** Corn Dog, PB&J, Alfajor, Scone & Clotted Cream, Jollof Bowl, Samosa, Baozi, **Sarmale**, **Mămăligă cu Brânză** (best HP/$ in the game — Buni's), Akutaq, Poke Bowl, Freeze-Dried Ice Cream (Mars vending machines).

**PP:** Star Cola line, Monastery Tea, Temple Incense. **Cures:** Salt Shaker (anti-Tick!), Aloe Leaf (Sunburn), Hanky (Crying), Doctor's Note (Mushroomize), Mom's Voice Tape (Homesick, 3 uses).

**Battle items:** Bottle Rockets, Firecracker String, Bug Zapper (irony — heavy vs insects), Glint's Spark (revive, rare). **Picnic Baskets:** Basic / Family / Feast.

**Key items:** Star Locket, 10 Embers, ATM Card, Lucille's Spare Propeller, Sigrid's Monocle, Royal Thimble, Train Ticket (3rd class), Yak Treats, Monastery Bell Clapper, Rocket Manifest, **Player's House Key** (it matters at the very end: the post-credits scene is just... walking home and unlocking the door).

## A9. Balancing & Playtime Targets (canon — Prompt 39 verifies)

- EXP curve: `EXP(L) = 4·L³ ÷ 3` (faithfully grindy). Expected per-chapter levels listed in A6; if testers arrive >4 under target, enemies en route get +15% EXP.
- Main story: 32–38 hr (10 chapters averaging 3–4 hr each, with larger cities and dungeons after Ch.3). Side quests and optional long-form content: +8–12 hr. Total planned playability target: **40–50 hr**. Boss attempts budgeted at 1.5 avg (grindy difficulty = some party wipes are expected and fine — that's EarthBound).
- Cash economy tuned so a full equipment refresh per region costs ≈ 2 chapters of battle income → choices hurt a little, like 1995.

> *(Amended 2026-06-14 per Appendix rule 6, ADR-075: THE FORTUNE ARC — the §A8/§A9
> property-tycoon wealth curve. The Ch.1–3 battle economy stays TIGHT (a refresh costs
> ~2 chapters of income, above); on TOP of it, a player who leans into the property
> market (buy/flip/rent — §A4.13) + the fleet (§A4.10/§A5) tracks a back-half NET-WORTH
> arc that escalates BY DESIGN: **Ch.1 ~$1,000 → Ch.10 $3,000,000,000+** (`FORTUNE_ARC`
> in `src/data/fortune.ts` — monotonic, ≤10× per chapter so it stays reachable). A NET
> WORTH line joins the stats page (`property.netWorth` = cash + bank + owned property +
> fleet titles − loans; `fortuneBand` reads it under/on-track/ahead). The Ember trail
> never cares about money and the epilogue's quiet walk home is unchanged (§A11.2) —
> net worth is a number, the callers are the score. `tools/balance-sim.ts` (`npm run
> balance`) prints the curve + the property/fleet/furniture ladders to tune DATA (never
> code) toward the targets as each region's catalog pours in; the curve's shape is
> validator-pinned (`fortune`) + `balance.test.ts`.)*

> *(Amended 2026-06-11 per Appendix rule 6, ADR-034: THE BRICKTON CLASSIC —
> S12's 32-team 5v5 streetball tournament at the cage — is **optional
> long-form content within the +8–12hr side/optional budget**: five four-quarter
> games ≈ two hours for a title run, BY DESIGN, built to be left and
> returned to (the bracket and a live match's quarter checkpoints are save
> data, v5). 3v3 pickup at the cage pays EXP forever and fits any session.
> The 40–50hr target above includes room for this long-form content.)*

> *(Amended 2026-06-14 per Appendix rule 6, ADR-073: THE PAPERBOY — a fourth
> optional paused-world minigame alongside the Arcade, the Cage, and the Links.
> Ride the M26 bicycle down a seeded 3-lane suburban street, throw papers into the
> mailboxes, dodge the dog / sprinkler / parked car / open car door, and clear the
> deliver goal to win. Deterministic + replayable (the §A10 #4 minigame law —
> `src/paperboy/sim.ts`, inputs in / a score out, same seed + tape = same run);
> getting "crashed" never fails the run (EarthBound-kind — a bad run floors at 0).
> Reachable from a paper-stand prop in Otterbrook/Brickton, non-missable. THE PRIZE
> is a finale CALLER (Mr. Plummer, the paper-route tie-in, quest #2) + a flag; the
> §A8 charm pour (the Steady Hands Charm) rides the catalog manifest in a follow-up.)*

## A10. Side Quests (55 — each one adds or strengthens the CALLER ledger)

The shipped game targets **55 quests**: 50 regional quests (5 per chapter) plus 5 cross-world questlines. The first 20 below are the named core ledger quests; chapter sessions add three more per chapter, and late systems add the five cross-world chains. Every quest must be permanently non-missable, journaled in §A11 voice, and either add a new final-battle caller or strengthen an existing caller's scripted effect. Tiny errands are allowed only when they reveal a person, place, joke, or mechanic the main path would miss.

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
| 9 | **Sigrid's Spectacles** (4): find both pond-sized lenses across Bootstep Moor | Sigrid's Monocle (reusable Focus); Caller: Sigrid |
| 10 | **The Unsent Letter** (4): carry Halvor's love letter to the post one page at a time | Giant's Banknote (valuable); Caller: Halvor |
| 11 | **The Royal Census** (5): count all 100 citizens of Minimus, who will not stand still | Stamp Quilt; Caller: the Census-Taker |
| 12 | **Civic Repairs** (5): repair the cathedral, drawbridge, and reservoir after Lucille lands | Banquet of the Realm ×2 + duchy discount; Caller: Grand Duchess Millimetta I |
| 13 | **Stones That Speak** (6): solve 4 riddle stones across the savanna | Riddle Ring (+10 Vibe); Caller: the eldest stone (it has a phone, don't ask) |
| 14 | **Watering Hole Convoy** (6): escort animals at dusk, 3 ambush waves | Canteen of the Crossing; Caller: caravan master |
| 15 | **Seven Spices** (7): scavenger hunt through Chandrapore's bazaar maze | Spice Box (cooked foods heal +50%); Caller: spice merchant |
| 16 | **The Monkey Who Stole Tuesday** (7): chase the Monkey Magnate over rooftops | Your hat back + Monkey Paw Charm (+Luck); Caller: the monkey (breathing only) |
| 17 | **Brushes of Mt. Shu** (8): retrieve the calligrapher's 3 brushes from the Spore Forest | Scroll of Calm (cures Mushroomize, reusable); Caller: calligrapher |
| 18 | **Buni's Table** (9): gather 5 ingredients across the valley for the true Feast Basket | **Feast Basket recipe** (craft at any deli) + she calls you "puiul meu"; Caller: **Buni** (her call in the finale heals the full party) |
| 19 | **Lights of Aurora Station** (10): restore 3 generators while Frost Wraiths hunt | Insulated Suit; Caller: station chief |
| 20 | **The Last Wave** (10): find the surf legend's lost board inside the volcano approach | Board of Legends (Jay's funniest weapon, sidegrade); Caller: surf legend |

Plus **Mr. Click**, a photographer who ambushes the party for a photo 14 times worldwide ("Say fuzzy pickles— I mean, cheese!") → photo album rolls during the credits. The new world stops add two shots: in Lilleby he shoots from very far away; in Minimus he uses a macro lens.

**Quest expansion law:** each chapter owns five quests total. The named core quest(s) above are mandatory; the remaining chapter slots are filled during that chapter's content prompt using this mix: one local-person problem, one mechanical tutorial/remix, one hidden-place discovery, one economy/crafting quest, and one emotionally sincere quest. The five cross-world chains are: Mr. Click's Photo Album, Dad's Postcards, The Traveling Hint Stand, The Homesong Recordings, and The Lost & Found of Impossible Sizes.

### Quest Flow Law — 55 quests without checklist stink

Side quests are how the game teaches that the world is worth saving. They are not chores stapled to the road. Each chapter's five regional quests must sit in the chapter flow like this:

- **Arrival quest:** found in the first town screen or first phone call; teaches local manners. Example: in Minimus, the Royal Census starts as a joke about counting citizens who keep walking under postage stamps, then becomes Pippa's proof that every tiny person has a name.
- **Route quest:** solved while traveling the required path; changes how the player reads the map. Example: in Norway, Sigrid's Spectacles turns pond-sized lenses into landmarks, then into a reusable Focus item.
- **Dungeon-adjacent quest:** uses the dungeon mechanic safely before the dungeon demands it. Example: Mt. Shu brush recovery teaches paper folds and Mushroomized routing before the Paper Dragon makes both dangerous.
- **Town economy quest:** makes shops, food, money, or crafting feel local. Example: Ana & Vivi's Lemonade Empire is not a fetch quest; it teaches supply, free healing, sibling comedy, and a finale caller pair who sound like they are sharing one phone.
- **Sincere quest:** gives the chapter a heart outside the boss. Example: Halvor's Unsent Letter is funny because the pages are enormous, but the delivery is played straight when the recipient reads it.

Quest verbs must vary. Across the 55, the player should herd, photograph, brew, repair, count, escort, chase, pose, trade, listen, cook, decode, perform, deliver, assemble, rescue, remember, and choose. "Bring three things to a person" is allowed only when the three things are weird, the route changes, and the person becomes more real afterward.

The journal is written in the game's voice and never exposes chapter structure. It should sound like Jay's group trying to remember things on the bus: "Find Biscuit. He smells like pond." "Count the duchy again. The duchy moved." Map markers are off by default; NPC hints, phone calls, signs, and environmental changes do the guiding. Dad can nudge without solving. Mom can comfort without becoming a quest log.

Every quest leaves a footprint after completion:

- **Local footprint:** an NPC moves, a shop shelf changes, a sign gets rewritten, a shortcut opens, or a room looks lived-in again.
- **Mechanical footprint:** the player earns a useful item, discount, recipe, caller boost, photo, travel convenience, or repeatable service.
- **Finale footprint:** the CALLER ledger gains or strengthens a voice. In THE CALLING, each completed quest gets one phone-ring vignette with a quote that could only belong to that person.

The five cross-world chains are the long-form glue that helps the 40–50 hour target feel playful instead of padded:

- **Mr. Click's Photo Album:** 14 ambush photos, each with a tiny pose choice. The joke evolves: first annoying, then comforting, then heartbreaking when the Mars credits show how young everyone looked at the start. Lilleby's photo is taken from absurd distance; Minimus uses a macro lens and makes Pippa stand on a thimble like a podium.
- **Dad's Postcards:** Dad mails one postcard after each region save milestone. The front is always wrong in a specific way ("England looks very jungly this time of year"), but the back is sincerely worried. Collecting all postcards strengthens Dad's finale call from cash/status help into a full-party Guts save.
- **The Traveling Hint Stand:** a vendor appears in impossible but fair places and sells hints as objects: a folded map, a suspicious peanut, a receipt that says "LOOK LEFT." The stand remembers where the player struggled and changes inventory accordingly.
- **The Homesong Recordings:** optional sound stems gathered from local musicians, machines, bells, chants, and accidental noises. Each recording adds a pause-menu layer and gives Mia's final Pray one more visual pulse. This chain makes exploration audible.
- **The Lost & Found of Impossible Sizes:** items displaced by Norway and Minimus scale logic need to be returned across the world: a giant button that is a shield in one town and a manhole cover in another, a Minimus spoon that becomes a perfect tuning fork, a postcard too small for Dad to read. Pippa should shine here because she treats wrong-sized objects as diplomatic incidents.

No quest may be permanently missable. Post-Ch.6 Teleport must reopen old threads with fresh lines, not stale leftovers. The player who waits until the end should still get the quest, but the player who does it early should see the world react for longer.

> *(Amended 2026-06-11 per Appendix rule 6, ADR-028: the twin sisters **Ana &
> Vivi** of quest #3 are canonically **Jay's little sisters**. The lemonade
> stand is the branch office; headquarters is their two bedrooms upstairs at
> Jay's house. Their npc ids, dialogue keys, quest data, and §A10 caller
> record are unchanged.)*

## A11. Tone & Writing Rules (every prompt that writes dialogue must obey)

1. Full EarthBound absurdism: enemies apologize, signs editorialize, NPCs have exactly one weird obsession each.
2. Sincerity is never the joke. Buni, Mom's phone calls, Dorin's trial, and the finale are played straight.
3. The Hush is never funny. Its dialogue is sparse, lowercase, and wrong-feeling: "you came so far. it was quiet here. why."
4. Faith is treated warmly and lightly — Pray's flavor text is hopeful even on "Nothing."
5. Battle text in classic second person: "Jay tried the Casey swing! SMAAAASH!! 412 damage!"
6. **No chapter UI, ever.** Chapter numbers and chapter titles exist only in the Bible, planner, flags, save internals, tests, and developer docs. The shipped game must never show "Chapter 1," "Chapter 5," "The Grand Duchy of Minimus," or any other chapter-card/message as player-facing UI. Area banners may show diegetic place names like "OTTERBROOK" or "MINIMUS MAJOR"; they must not reveal chapter structure.
7. **No AI smell.** Content must be specific enough that it could not belong to a generic RPG: no "ancient evil rises," no interchangeable fetch errands, no palette-swap enemy padding, no lore paragraphs that sound like a wiki wrote them, and no dialogue that explains the joke. If a line, quest, enemy, item, or town can be moved to another region unchanged, rewrite it until it smells like that exact place.

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
├── android/                    # Capacitor (generated Prompt 43)
└── capacitor.config.ts
```

## B3. Asset strategy (production quality, easiest path)

**Art.** Base layer: CC0/free 16-bit packs (Kenney; itch.io CC0 RPG packs) for tiles/props; AI-generated character & enemy sprites (one prompt per sheet, Prompt 40 includes the exact image-prompt templates with the locked palette + 4-frame walk cycles + battle-sprite spec). Everything passes `npm run art:check`, which rejects any PNG using colors outside `palette.gpl` — this single rule is what makes mixed sources look like one game.

**Music.** EarthBound-themed chiptune+sample hybrid: tracks are authored as code in **Tone.js** (`tools/music-render.ts` renders them offline to OGG so runtime cost is zero). Prompt 42 contains per-track briefs (tempo, key, mood, EB reference vibe — e.g., Otterbrook = laid-back I-IV shuffle w/ slap bass à la Onett; Mars = near-silent drones with a heartbeat). SFX via jsfxr presets, also rendered to files.

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
- **BUILDINGS MATCH THE HUMANS, and the catalog is deep (ADR-050).** Characters are
  16×24; a storefront reads two-to-three stories OVER the hero, and cities carry
  **MEGA-buildings** that are COMMON, not rare — towers whose tops run off-screen
  (`upperRows ≥ 11`, `H ≥ 220px`) and landmark COLOSSI whose footprint spans a slice
  of the map (you round them on foot). The forge skin pool is 100+ deterministic
  facades across 13 families (`src/spritegen/buildings.ts`). A FACADE COLLIDES AS ITS
  REAL DRAWN FOOTPRINT (ADR-051): the OverworldScene rebuilds every `bldg_*` solid +
  entrance zone from the LOADED TEXTURE at scene-build — the full footprint MINUS the
  doorway you walk into (left-wall + right-wall + lintel for a doored facade) — so
  collision matches what's on screen even when the map data placed the facade at a story
  count that disagrees with the sprite. A building can never be walked through (player
  OR enemy — roamers/patrols share `collides()`), on any shipped / grown / generated map;
  `window.mfSolids()` is the dev overlay. Entering a room locks doors for ~0.9 s
  (`DOOR_REENTRY_MS`, ADR-052) so the door you came through can't bounce you back.
  *(Added 2026-06-13 per Appendix rule 6, alongside ADR-050/051/052.)*
- **THE SPACING LAW — buildings never seal a walkway (ADR-053).** Because a facade now
  collides as its full footprint, the generator (`buildDistrict.tryPlaceFacade`) places
  every building at its TRUE `BUILDING_DIMS` size and keeps ≥`PLACE_MARGIN` (2) walkable
  tiles between footprints — across regions too (shared `occupied` list). Anywhere the
  player can walk, there is a lane, never a wall of touching buildings. City BLOCKS
  (adjacent storefronts lining a street, the path being the street) are the intended
  exception, not a violation. *(Added 2026-06-13 alongside ADR-053.)*
- **EACH AREA FEELS FRESH — per-area building skins (ADR-050/065).** Every named level
  area draws its facades ONLY from its own curated slice of the catalog (`AREA_SKINS`
  in `src/spritegen/buildings.ts`): a distinct family mix + ramp palette, so no two
  areas read alike (Otterbrook's warm low brownstones ≠ Brickton's cool glass towers ≠
  Puerto Sol's colonial faces). A NEW area MUST register its own skin set — never reuse
  another area's roster. **ALL seventeen canon §A5/§A6 areas now own a slice** (S18 M25):
  the live Americas areas PLUS forward-looking specs for every unlanded place — England's
  damp Foggybottom stone + Wintermoor's pale faculty blocks, Norway's cozy Kvisthavn vs
  Lilleby's giants'-town towers, Minimus's hand-picked tabletop jewel-box (tiniest tiers
  only — a mega can never step into a town the party steps over), Zanzibel's sun-baked
  bazaar, Chandrapore's dense riot + a palace-spire colossus, Lotus Harbor's temple
  red/gold, Valea's painted-village rustic, Aurora's cold steel, Mauna Lani's lush
  resort, and Mars's neon husks + the lone NIGHT needle. Pinned BOTH directions
  (`CANON_AREAS` ⇄ `AREA_SKINS`, `area-skins` gate + `buildings.test.ts`): every area
  has a non-empty roster of REAL facades, no orphan slice, no reskin. *(Added 2026-06-13
  per Appendix rule 6; extended 2026-06-14 alongside ADR-066.)*
- **MAPS BREATHE, AND MOSTLY GROW (the size law).** Every map feels like a
  real place — organic irregular edges, varied block shapes + access (linear and
  sporadic), and NOOK variety (shacks, alleys, vacant lots, courtyards, rooftops,
  underground/sewer stretches, wooded pockets). Going forward maps vary in size AND in
  transition count, and most keep getting LARGER unless the aesthetic demands smaller
  (Hawaii reads claustrophobic, true to life). Stay in the p99 envelope: the tilemap
  CULLS, so PROP COUNT is the real lever (`bench-map.ts MAX_PROPS`); mega-buildings are
  few props for many tiles, so lean into them. Every grown area EARNS its size with
  CONTENT (a task/quest or two, purposeful NPCs, a hidden reward in a nook, a cutscene
  beat) — new space without new things to do is empty. *(Added 2026-06-13.)*
- **THE OPENING GATES THE WORLD (the daybreak law).** Ch.1's night section is sealed:
  the wider world past the hometown treeline is NOT reachable until the beginning ends
  and it is light out (the `zapper_done` flag flips `storyNight`→day across
  `otterbrook`/`hill_road`/`hickory_hill`). At daybreak the world OPENS, every NPC on
  the far side of the treeline swaps to its `dialogueDay` line, and the road onward
  carries a meteor-drop ROADBLOCK the player must route around — travel is never a
  silent corridor. *(Added 2026-06-13.)*
- **EVERY ITEM HAS A FACE — the icon atlas (ADR-060).** Every §A8 item, of every ItemKind
  (weapon/armor/arms/charm/food/pp/cure/battle/valuable/basket/key), maps to a bespoke 12–16px
  drawn icon (`ITEM_ICON`, `src/spritegen/icons.ts`), shown beside its name in the Items bag,
  the Equip screen (and in each slot), the shop buy/sell rows, and battle Goods. The law is
  gated BOTH directions (the validator + a vitest mirror): every item has an icon, and no icon
  row names a missing item — equipment is never faceless, the way ADR-032 made it never
  invisible. The equippable WEAPON_ART pins (the battler swing + the torso dress) stand;
  ITEM_ICON widens the law to ALL kinds (trinket charms/arms reuse their WEAPON_ART icon).
  *(Added 2026-06-13 per Appendix rule 6, alongside ADR-060.)*
- **THE CATALOG SPINE — the §A8 catalog can hold ~500 (ADR-061).** `ItemDef` (`src/schemas`)
  carries optional `vibe`, `bonus` (a secondary stat map summed on top of the primary slot
  stat), `resists` (fire/freeze/volt/holy %, armor + charm only), a `tonic` ItemKind paired
  with `boost` (a permanent stat raise, §A4.12), and a `band` ('ch1'…'ch10' | 'cross') — each
  with a `superRefine` pairing, every older pairing intact. Every item MUST carry a band; the
  validator slices the catalog per region and ratchets a per-chapter quota (`BAND_FLOOR`) toward
  the §A8 ~40/region target. The old narrow Ch.1–2 pins are GENERALISED, never deleted, into
  per-region tables: `PP_LINE`, `ARMOR_LINE`, `WEAPON_LADDER` (wielder- + band-tagged), and a
  `SET_REGISTRY` of hero-signature arms/charm sets — each gated both directions. Permanent tonic
  boosts ride `HeroState.boosts` (save v9) kept apart from level-recomputed stats; the heroX
  seams (incl. a new `heroVibe`) sum primary + bonus + boost; `heroResist`/`applyResist` are
  ready for elemental enemy moves. STATUS, the equip preview, tonic use, and the revival line all
  read the new stats. *(Added 2026-06-13 per Appendix rule 6, alongside ADR-061.)*
- **THE ICON FORGE — ~500 distinct faces without slop (ADR-062).** THE ICON ATLAS (ADR-060)
  gave the shipped items a bespoke face each; the catalog now headed for ~500 (ADR-061) is poured
  through a PARAMETRIC forge (`src/spritegen/iconforge.ts`) so no face is a one-off OR a palette-swap.
  Each parametric icon composes THREE independent layers — a SUBCATEGORY silhouette (`can`, `pastry`,
  `pendant`, `firework`, `hat`…), a REGION ramp (the item's `band` mood pool, seeded off its stable
  id), and a per-item DETAIL mark (a label, a bite, a cork, a gem, a fuse) — so two icons are never
  the same drawing BY CONSTRUCTION (§A11.7 at the pixel level: an icon that could move to another
  region unchanged isn't done). Every SIGNATURE (hero weapon rungs incl. the boss-drop tops, the §A8
  hero SETS, the named key items) stays a HAND drawing (`icons.ts` / WEAPON_ART); the forge is
  ADDITIVE, for the generic tail (foods, drinks, generic gear, cures, tonics, battle items,
  valuables). The both-directions ITEM_ICON ⇄ ITEMS gate (ADR-060) stands, and the distinctness test
  (every shipped icon AND every forge-gallery sample byte-distinct, across + within kinds) is the
  slop-detector; `npm run art:icons` paginates a sheet per kind, `--region chN` filters one region,
  `--forge` renders one sample of every subcategory. ADR-020 holds by construction (px-only DSL,
  `outline()` last, pure light after). A regional catalog (M18–21) then authors a parametric item as
  one line — `() => forgeIcon({ subcat, band, detail, seed: id })`. *(Added 2026-06-13 per Appendix
  rule 6, alongside ADR-062.)*

---

# PART C — THE PROMPT SEQUENCE (46 prompts, 10 phases)

> **Workflow:** open Claude Code in the repo, paste one prompt, review the diff, run the acceptance checks, commit, next prompt. If something fails, tell Claude Code *what failed*, not how to fix it. Each prompt begins with the same header line — keep it, it's what keeps 46 sessions consistent.

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
hooks by terrain tag. Area-name banner on area entry: local place names only,
never chapter numbers, chapter titles, "Chapter N," or non-diegetic chapter
messages per §A11.6.
```

**Done when:** 5-character conga line feels right at 60fps; angels float instead of walk.

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
shows 0–10 Embers and layers the Homesong stems per GAME_BIBLE §A4.9
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
against canon manifests (counts: 5 heroes, 200 unique enemy types from §A7,
10 bosses + 2 minibosses from §A6, 55 quests from §A10, ~500 items from §A8 — amended
2026-06-13, ADR-061; was ~140). Any miss,
mismatch, or string containing "TODO/placeholder/lorem" fails the build.
```

**Done when:** `npm run validate` fails loudly on an empty data dir, listing exactly what's missing.

### Prompt 9 — Heroes & abilities data

```
[Standard Header]
Author src/data for the five heroes per GAME_BIBLE §A3: base stats, per-level
growth curves tuned to §A9 targets, full Vibe/gadget unlock tables with PP
costs and power coefficients (extend the abridged Bible tables sensibly —
follow EarthBound's α/β/γ/Ω power ratios ~1:2.2:3.6:5.5). Encode PRAY exactly
per the §A3 variance table including the level/Guts weight shifts. Encode
Milo's Spy/Repair and Bottle Rocket tiers, plus Pippa's support/accuracy kit and
late-join defaults. Unit-test: pray distribution over 100k rolls matches
weights ±0.5%; level-50 Jay stats land within §A9 targets.
```

**Done when:** validator passes hero/ability sections; distribution tests green.

### Prompt 10 — Enemies, bosses, items, shops

```
[Standard Header]
Author every enemy from §A7 (200 unique standard types: stats, 2–4 moves each
w/ EB-flavored move text, weakness tags, EXP/cash from the §A9 economy, drop tables, flavor death line),
obeying the §A7 Enemy Flow Law: each enemy needs a map tell, battle hook,
identity drop, and place-specific death line before it counts as unique.
all 10 bosses + 2 minibosses from §A6 with their scripted gimmick phases
expressed as a declarative phase-machine (triggers: hpBelow, turnCount,
bothSummonsDead, riddleAnswered...), and the full §A8 item catalog with
prices satisfying the §A9 "equipment refresh ≈ 2 chapters of income" rule.
Author one shop inventory per town (12 towns) using region-appropriate items.
```

**Done when:** validator counts all 200/12/~500/14 (items ~140 → ~500, ADR-061); `tools/balance-sim.ts` stub created for Prompt 39.

### Prompt 11 — Quests, encounter tables, dialogue manifests

```
[Standard Header]
Author all 55 side quests from §A10 as data: multi-step objectives, item
rewards, flag wiring, and the CALLER record each contributes to the finale
(caller name, one-line phone quote in §A11 tone, scripted damage/heal value).
Obey the §A10 Quest Flow Law: each quest needs a varied verb, local footprint,
mechanical footprint, finale footprint, and journal text that never exposes
chapter structure.
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
and battle text. Homesick: Jay randomly skips a turn "thinking about
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
riddles, consequences per §A6 Ch.6). Integration-test each boss's gimmick
headlessly via the engine API.
```

**Done when:** all 10 boss/miniboss scripts run green in headless tests.

### Prompt 16 — Battle flow: intros, swirls, victory, defeat, auto-win

```
[Standard Header]
Implement encounter transitions: overworld contact triggers the EB swirl
(green = you touched their back ⇒ your free round; red = enemy back-attacked
you ⇒ enemy free round; neutral otherwise — amended 2026-06-12 per Appendix
rule 6, ADR-043: as first written the two colors were swapped), battle intro
text, VICTORY flow
("YOU WON! Jay gained 86 EXP." level-up fanfare + stat gains + new-ability
text + drops w/ inventory-full handling), DEFEAT flow per §A4.7 (fade,
"Jay... pick yourself up..." respawn at last save, cash-on-hand halved, party
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
on pickups/drops ("Jay's hands are full!"). Chests, gift boxes on maps.
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
heroes (pre-filled Jay/Mia/Milo/Dorin, editable, on-screen keyboard +
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
at each town's teleport pad. Gate α behind the Ch.6 story flag, β behind Ch.8.
```

**Done when:** crashing into a fence is funny every time; world reopens post-Ch.6.

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

## PHASE 6 — CONTENT: Build the Ten Chapters (Prompts 27–36)

> One prompt per chapter. Each follows the same template — shown in full for Chapter 1, then per-chapter deltas. These are the biggest prompts; expect each to be a long Claude Code session. Playtest the chapter fully before moving on.

### Prompt 27 — Chapter 1: "The Night It Fell"

```
[Standard Header]
Build Chapter 1 per GAME_BIBLE §A6 completely:
MAPS (Tiled, real art per the Phase-8-ready palette, dev-art acceptable until
Prompt 41 but layouts FINAL): Jay's house (interior, the starting bedroom),
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
calling YOU. Populate §A7 Ch.1's 20 unique enemy types via encounter tables,
Ch.1 shops, five Ch.1 quests fully playable (#1–4 plus one new regional slot), 3 picnic tables placed per §A4.5.
EXIT: ch1_complete is set by Mom's call to the Brickton payphone after the
Department falls (amended 2026-06-10 per Appendix rule 6, ADR-014); the
docks bus that opens Chapter 2 requires the flag rather than setting it.
```

**Done when:** Chapter 1 plays start-to-finish in ~3–4 hr at the §A9 level target with zero dev text.

### Prompt 28 — Chapter 2: "The Gilded Grin" (South America)

```
[Same template.] Maps: Puerto Sol port, jungle path (2 screens + optional
grotto), Valle Dorado village, step-pyramid dungeon w/ rotating-floor puzzle
(design: 4 rooms, rotation toggled by mask switches). Story per §A6 incl.
gray "wishers" who recover after the boss. Boss: IDOL OF THE GILDED GRIN
form-swap fight. Five Ch.2 quests (#5–6 plus three new regional slots). Ch.2's 20 unique enemy types/shops/tables. Banana-boat arrival
and Lucille-departure cutscenes.
```

> *(Amended 2026-06-11 per Appendix rule 6, ADR-039 — SHIPPED as S14,
> bundled with Prompts 15/23/25. EXIT: `ch2_complete` is set by the Valle
> Dorado RECOVERY beat — the wishers waking is the chapter's close, not
> the boss's death; the "Lucille departure" tease is Uncle Bert standing
> at the Brickton docks behind that flag (no map for her until Ch.3).
> The §A6 rotation shipped as 7×7 rotor channels turned 90° per mask
> press; the documented solve is 1/1/2/2 presses.)*

### Prompt 29 — Chapter 3: "A Very Foggy Term" (England)

```
[Same template.] Maps: Foggybottom-on-Tyne high street, Academy grounds +
3-floor school, dorm stealth wing (sight-cone prefects, caught = battle not
fail), boiler room, The Old Stones site. Story: Milo's greenhouse crash +
join, machine-fog reveal. Boss: HEADMASTER MAINFRAME w/ summons. Five Ch.3
quests (#7–8 plus three new regional slots). Ch.3's 20 unique enemy types. Tea-as-PP economy flavor. Milo's Repair tutorial via a Broken Gizmo
gift.
```

### Prompt 30 — Chapter 4: "The Fjord That Sleeps" (Norway)

```
[Same template.] Maps: Kvisthavn, Bootstep Moor at 10× scale, Lilleby with
under-door traversal, and The Sleeper's Spine as body-terrain architecture
(hand → shoulder → ear). Story per §A6: the LOW Ember's hum, giants who kneel
to talk, Grandfather Storheim asleep forty years. Boss: THE WHISPERWIG with
NOISE forcing it targetable and Mia's VIBE VOLT α awakening mid-fight. Five
Ch.4 quests (#9–10 plus three new regional slots), Lilleby Trading Post shelf, Ch.4's 20 unique enemy types/shops/tables, Heartlight 4
as the Homesong bass stem.
```

### Prompt 31 — Chapter 5: "The Grand Duchy of Minimus" (Minimus)

```
[Same template.] Maps: Minimus Major, Procession Way, the Hedgerow, Ducal
Crown Resonance Site. Scale law: party are visiting colossi; citizens remain
readable and protected by Whistle Guard nudges, not damage. Story per §A6:
the HIGH Ember, Lucille landing in the duchy, Milo's Big-Little Lens build,
and WHISKERZILLA's mercy ending. Pippa joins at chapter close with Royal
Thimble scale-anchor art, a full five-hero status/battle/follower proof, and
Big-Little Focus wired beside Milo's Spy. Five Ch.5 quests (#11–12 plus three new regional slots), Ducal Provisioner
shelf, Ch.5's 20 unique enemy types/shops/tables, Heartlight 5 as the Homesong high stem.
```

### Prompt 32 — Chapter 6: "The Ruins That Laugh" (Africa)

```
[Same template.] Maps: Zanzibel port + grand market, savanna crossing
(escort framework for quest #14), dune ruins w/ echo-laughter ambience
zones, Sphinx forecourt. Story per §A6; Teleport α taught by the courier
mystic (his dojo: a bus stop). Boss: THE LAUGHING SPHINX with the 8-riddle
pool from Prompt 15. Five Ch.6 quests (#13–14 plus three new regional slots). Ch.6's 20 unique enemy types. After the Ember: teleport tutorial pad.
```

### Prompt 33 — Chapter 7: "The Cobra's Palace" (India)

```
[Same template.] Maps: Chandrapore (biggest town — 3 districts: bazaar maze,
ghats, cinema block w/ the movie-about-you gag), night-train heist sequence
(linear car-by-car set piece, Locket stolen/recovered ≤30 min per §A6),
Cobra Palace dungeon. Boss: COBRA RAJA w/ paralyze-gaze + skin-shed
mechanics. Five Ch.7 quests (#15–16 plus three new regional slots) incl. rooftop monkey chase (simple platforming-ish
hop routes using existing movement).
```

### Prompt 34 — Chapter 8: "The Paper Dragon" (China)

```
[Same template.] Maps: Lotus Harbor, riverboat scene, Spore Forest
(Mushroomize zones — implement the control-scramble shader/input warp now),
Yak Express mountain switchbacks, Mt. Shu Temple (paper-guardian statues
animate as enemies). Teleport β taught by the elder. Pippa gets chapter
reactivity here: tiny-diplomat paper reads, fold warnings, and unique
comments on the temple's scale discipline. Boss: THE PAPER DRAGON airborne/grounded + self-immolation
desperation phase. Five Ch.8 quests (#17 plus four new regional slots) and Ch.8's 20 unique enemy types.
```

### Prompt 35 — Chapter 9: "The Count of Valea Stelelor" (Romania)

```
[Same template — this is the heart chapter, write it with full sincerity
where the Bible demands it.] Maps: Valea Stelelor village (painted gates,
haystack fields w/ Haystack Mimics, Buni's house — her cooking scene
overheals HP visibly), Old Road through wolf country, Castle Hoaxula (gothic
theme-park-gone-wrong props: gift shop, queue ropes), Stone Brow Monastery +
the Trial of the Mute Mountain as a PLAYABLE solo Dorin sequence per §A6:
senses stripped one by one — darken screen, then mute audio, then hide UI —
finish on text alone. Dorin joins at L46 w/ canon kit. Boss: COUNT HOAXULA
two-phase + the Pray-mercy ending hook. Five Ch.9 quests (#18 plus four new regional slots) incl. Buni's Table → Feast
recipe). Buni's send-off line is the chapter button: "Du-te, puiul meu.
The stars were always yours."
```

### Prompt 36 — Chapter 10: "The Long Shot" (Alaska → Hawaii → Mars)

```
[Same template + finale systems.] Maps: Aurora Station (generator-restore
gauntlet, Ch.10 quests incl. Lights of Aurora Station, MINIBOSS: FROST SENTINEL), Mauna Lani launch pad +
volcano approach (Ch.10 quests incl. The Last Wave, MINIBOSS: TIKI MAGMA GOLEM on the caldera rim),
the launch cutscene (Mom's call — play it straight), MARS: Sea of Silence
(3 zones; the soundtrack loses one instrument layer per zone — wire to the
audio stem system; §A7 Ch.10's 20 unique enemy types).
FINALE: THE HUSH in three movements exactly per §A6 Ch.10 — Movement 2's UI
glitching (windows jitter, text corrupts non-destructively), Movement 3's
scripted PRAY: iterate the CALLER ledger from Prompt 26, one phone-ring
vignette per caller w/ their Prompt 11 quote and scripted effect, base
callers always present (Mom, Dad, Buni, Pemberton, Chad Pickle), then the
player-name confirm box and the full 10-stem Homesong. ENDING: quiet
walk-home epilogue across Otterbrook, the House Key, credits over Mr.
Click's photo album (photos = his 14 encounter flags), "THE END...?"
```

**Done when (35–36):** full game completable; finale caller count visibly scales with quests done.

---

## PHASE 7 — Side Quest Sweep & Replayability (Prompts 37–39)

### Prompt 37 — Quest pass: all 55 + Mr. Click

```
[Standard Header]
Audit every §A10 quest end-to-end in a fresh playthrough save, including the
five cross-world chains (#51–55): fix
sequencing, ensure each is completable in its chapter AND later via
Teleport (no missables — this is canon: zero permanently-missable content),
verify every quest has the §A10 flow footprints, implement Mr. Click's 14
worldwide photo ambushes with pose menu, and the
credits album. Verify each caller fires correctly in a finale test harness.
```

### Prompt 38 — Replayability layer

```
[Standard Header]
Implement: NEW GAME+ (carry levels OR carry nothing but unlock "Hush Whispers"
hard mode — enemies +25%, Pray weights shift 5% darker), the Arcade Legend
shmup as an endlessly replayable score-attack from any save, a post-credits
flag that adds NPC dialogue variations worldwide ("the world feels louder
now"), and a stats page (battles, smashes, prayers answered, photos taken).
```

### Prompt 39 — Full-game balance simulation

```
[Standard Header]
Build out tools/balance-sim.ts: headless monte-carlo of the §A9 progression —
simulate expected EXP along the critical path per chapter, fight every boss
at target level ±2 with median-skill policies, output a report (win rates,
expected attempts, economy surplus/deficit per region). Tune data (never
code) until: boss win-rate at target level ≈ 55–70%, at target+3 ≈ 90%;
total planned playability time lands in the 40–50h target at design walk speeds. Commit the report.
```

**Done when:** the report proves the 40–50 hour grindy-but-fair mandate with numbers.

---

## PHASE 8 — Art & Audio Production Pass (Prompts 40–42)

### Prompt 40 — Master palette & art pipeline

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

### Prompt 41 — Asset integration sweep

```
[Standard Header]
Replace ALL dev art: integrate the CC0 packs and generated sheets listed in
docs/ART_SPEC.md across every map, character, enemy, boss, battle background,
UI skin, and the title screen (the meteor streaking over Otterbrook at
night). Every asset passes art:check. Re-export all Tiled maps. Add juice:
battle hit-flash, screen shake on SMAAAASH crits, swirl shader polish,
Ember pickup sparkle. Record asset attributions in docs/CREDITS.md.
```

### Prompt 42 — Music & SFX render

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

## PHASE 9 — Ship It (Prompts 43–46)

### Prompt 43 — Capacitor & Android hardening

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

### Prompt 44 — Performance & device QA

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

### Prompt 45 — Full QA gauntlet

```
[Standard Header]
Execute and fix against this checklist, logging results in docs/QA.md:
(1) 100% playthrough touch-only; (2) 100% playthrough controller-only;
(3) all 55 quests + Mr. Click ×14 + both minibosses + NG+ boot;
(4) save/quit/resume in every chapter incl. mid-dungeon and mid-Trial;
(5) death/angel/hospital flow in 3 different regions; (6) finale with 0
side quests vs all 55 (caller scaling visibly different); (7) validator,
tests, balance-sim, art-check all green; (8) the §A11 tone read-through:
every dialogue file proofed in-voice; (9) grep/player-facing QA proves there
are no chapter numbers, chapter titles, title cards, or chapter messages in
the shipped UI.
```

### Prompt 46 — Release build

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

# APPENDIX — Session Tips for the 46-Prompt Run

1. **One prompt = one session = one commit.** Fresh Claude Code context each time; the Standard Header + Bible carries the continuity.
2. **When a chapter prompt is too big for one session**, split on the natural seam: "maps + encounters first," then "story dialogue + boss." Tell Claude Code which half.
3. **Never let it summarize the Bible into its own notes** — drift starts there. The Bible is the notes.
4. **You are the tone editor.** Claude Code will nail systems; read every dialogue diff out loud. If a line wouldn't make your daughters laugh or Buni's scene doesn't land, send it back.
5. **Playtest on the phone every Phase boundary**, not just at the end — touch feel can't be reviewed in a diff.
6. **Drift log:** any time you accept a deviation from the Bible, make Claude Code amend the Bible in the same commit. Canon stays canon.

*Now go pick up the cracked bat. The meteor's already falling.* ☄️
