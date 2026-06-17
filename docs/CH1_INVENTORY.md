# Chapter 1 — Content Inventory (the durable source of truth)

> Why this file exists: Ch.1 gameplay is spread across many system files and is
> NOT tagged to a chapter in one place, so a surface read undercounts it badly.
> This is the audited, file-grounded inventory. Keep it current when Ch.1 changes.
> (Region: USA — Otterbrook → Hickory Hill → Brickton. §A6 Ch.1, target level 8.)

## Maps (35)
- **Overworld (13):** `otterbrook`, `downtown_otterbrook`, `hill_road`, `hickory_trail`,
  `whisperwood_rise`, `hickory_hill` (crater / Boss 1), `meadow_mile`, `meadow_woods`,
  `meadow_far`, `meadow_overpass`, `brickton`, `cage_park`, `bus_interior`.
- **Dungeon — The Department of Smiles (3):** `dos_f1`, `dos_f2`, `dos_f3` (holding room).
- **Interiors / houses / shops (19):** `rex_home`, `rex_bedroom`, `rex_hall`, `ana_room`,
  `vivi_room`, `otterbrook_cityhall`, `drugstore_int`, `arcade_int` (STARPORT),
  `arcade2_int` (STARPORT II), `hardware_int`, `diner_int`, `otter_clinic_int`,
  `otter_clinic_exam`, `bus_depot_int`, `starmart_int`, `hospital_int`, `hospital_f2`
  (WARD), `the_cage`, plus the golf set (`costa_estrella`, `golf_resort`, `golf_clubhouse`).

## Quests — 5 journaled (`src/data/quests.ts`, chapter:1)
1. **Biscuit, Come Home** (Mrs. Pemmel) → Lucky Collar · caller dmg 400
2. **Mail Must Move** (Mr. Plummer) → Fresh Stamps · caller dmg 450
3. **Lemonade Empire** (Ana & Vivi) → free lemonade · caller **heal 400**
4. **Arcade Legend** (Sal) → Champion Jacket · caller dmg 425
5. **The Walkers' Register** (Hal) → Walkers' Charm · caller dmg 430

## Optional long-form activities (the +8–12 hr layer)
- **The Cage** (`src/hoops`, `src/data/hoops.ts`): 3v3 pickup + the **Brickton Classic**
  32-team tournament → *Champion Jacket* + the **Starting Five** arms set.
- **The Links** (`src/links`, `src/data/links.ts`): golf at **Costa Estrella** + **The Links
  Estates** → the **Sunday Set** charms.
- **The Arcade** (`src/data/arcade.ts`): a playable shoot-'em-up (the *Arcade Legend* quest).
- **Paperboy** (`src/paperboy`, `src/data/paperboy.ts`): a BMX paper route (28 houses).

## The wealth layer — Fortune Arc starts here (~$1K)
- **Property** (`src/data/properties.ts`, LIVE: `27_maple`, `maple_fixer`, `brickton_walkup`):
  27 Maple (home $1,200), 29 Maple "the Fixer" (flip $800, rundown), Brickton Walk-Up
  (rental $2,600 / rent $120). Buy / flip / rent via the realtor.
- **Dealership** (`src/data/dealership.ts`, band ch1): BMX $90 → ten-speed $240 →
  motorcycle $2,600 → sedan $5,500. The rags-to-riches teaser (visible before affordable).

## Town services & set-pieces
- **Otterbrook Clinic** (front desk revive) + **Brickton General** with a multi-floor **WARD**.
- **Constable Borden** — optional by-the-book cop fight (rhymes with General Buckle).
- **Trail Key interlock** — Hodgkin's mower + a soft-gated locked shed on the climb.
- **Transit Depot** (the bus stop became a real building); the 6:15 unlocks after walking
  to Brickton on foot once.
- Picnic tables, hidden presents along the routes, the first **Mr. Click** photo.

## Enemies — 20 §A7 types (ADR-119) + Borden + Boss 1
- **Seed six:** Cranky Mailbox, Runaway Lawnmower, Coily Cicada, Blazer Smiler, Pigeon
  Gang, Hill Slug Deluxe.
- **Roamers:** Sprinkler Sentry, Recycling Raccoon, Skeeter Swarm, Garden Gnome (Unionized).
- **Dept. of Smiles:** Mandatory Memo, Motivational Poster, Quota Clock.
- **Social/urban:** Expired Parking Meter, Showroom Mannequin.
- **Rare/high-value:** The Good Investment (golden retriever, big purse), Rogue Ice-Cream Truck.
- **Late pressure:** Tick Nymph (foreshadows the boss latch), The Suit (inflicts Hushed).
- **Set-piece:** Constable Borden. **BOSS 1:** The Titanic Tick (150 HP).
- Art: the 36 originals are battler-complete (W0/W1/W2); the 13 new ones are gray-boxed
  (39 PNGs queued in `docs/CH1_ART_PROMPTS.md §7`). Minis are procedural.

## Cast (Otterbrook 18+ named NPCs)
Mrs. Pemmel, Biscuit, Mr. Plummer, Ana, Vivi, Old Timer, Pajama Kid, Green Keeper, Pond
Angler, South Neighbor, Woods Birder, Gate Walker, Treeline Gawker, two Bus Waiters,
Realtor, Car Dealer (Bert), Constable Borden — plus Brickton's crowd, the Smilers/Manager,
and the Cage/golf casts.
