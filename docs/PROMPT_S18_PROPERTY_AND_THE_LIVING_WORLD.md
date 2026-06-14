# PROMPT — S18: PROPERTY & THE LIVING WORLD (Movements 25–34)

> Paste this whole file as the next Claude Code session's opening prompt. It continues straight
> from **S17 Movement 18 / ADR-063** (THE AMERICAS CATALOG — the ~500-item catalog poured and
> placed live for Ch.1 USA + Ch.2 South America). It is written in the same law-driven,
> movement-sequenced style as the S15i / S16 / S17 prompts.
>
> **This session CONSOLIDATES and SUPERSEDES the unbuilt parts of the old `docs/
> PROMPT_S16_LIVING_WORLD.md`.** Only S16 Movement 8 (THE ICON ATLAS, ADR-060) ever shipped; the
> project then pivoted to the S17 item catalog (ADR-061→063). Movements 9–15 of that prompt — the
> vehicle forge, traffic, the control system, overworld PSI, the story weave, the paperboy, and
> the fleet — **were never built**. They are folded back in here, in dependency order, alongside
> the user's new decree: a **full property-tycoon market** (buy/sell/flip/rent real estate, with
> a **real-estate agency** and a **lawyer's office** in every town) and a **Sims-style
> free-placement HOME EDITOR**. Treat the old S16 prompt as a design appendix; THIS file is the
> source of truth. When you finish, mark the old S16 file superseded (one line at its top).

---

Read `docs/GAME_BIBLE.md` FULLY before doing anything — it is canon; never invent content that
contradicts it, never use placeholder/mock data for anything it defines. Follow
`docs/DECISIONS.md` conventions and APPEND every new architectural decision to it. **Use the next
free ADR id — check `docs/DECISIONS.md` for the highest `## ADR-NNN` and continue from there**
(ADR-063 was the last as of S17 M18). TypeScript strict, no `any`. Be CREATIVE and
PRODUCTION-QUALITY: every new system must feel **smooth, easy, and fun**; every NPC gets exactly
one §A11 obsession; every line is plain-spoken + kid-readable (EarthBound-flavored, never a
riddle); nothing reads like generic RPG filler. Read GAME_BIBLE §A3/§A4/§A5/§A6/§A7/§A8/§A9/§A10/
§A11/§B1/§B3/§B4 and **ADR-012 (the city grid law), ADR-015 (prefer-flags state), ADR-017 (extend
the manifest, never ad-hoc), ADR-020 (hand-art by construction), ADR-035 (AWAKENINGS), ADR-049
(frozen cores), ADR-050/051/052/053 (the building forge + facade collision + door cooldown),
ADR-060 (THE ICON ATLAS), and ADR-061/062/063 (THE GREAT CATALOG) FIRST.**

Keep the validator + full vitest + tsc + `npm run build` GREEN at EVERY step. The baseline you
inherit (S17 M18): **tsc clean**, `npm run validate` green (the ~500-item catalog with both-
directions icon gate across 10 chapters, 49 maps, the quest pins, the dialogue sweep, pray sums
100), `npx vitest run` green, `vite build` clean, `npm run art:icons` contact sheets render. Save
schema is at **v9** (party, guest, keyItems, cash/banked/pendingDeposit, flags, callers,
arcadeScores, hoops). You will bump it.

---

## WHERE YOU ARE (read this carefully — what is DONE vs. what is UNBUILT)

**DONE (do NOT redo):**
- **The world forge + frozen cores** (ADR-049/050/051/052/053): the levelkit generators
  (`buildCity/buildTown/buildVillage/buildInterior/buildRoute/buildWild/buildTravelScene/
  buildDungeon` in `src/levelkit/`), the 100+ facade catalog, texture-true facade collision
  (`facadeSolids()` in `OverworldScene.ts`), the door re-entry cooldown (900ms), and the
  byte-identical frozen cores (Otterbrook/Brickton/Puerto Sol, proven in `world_block.test.ts`).
- **THE ICON ATLAS + THE ICON FORGE** (ADR-060/062): `src/spritegen/icons.ts` + `iconforge.ts`
  give EVERY `ITEMS` entry a distinct, palette-clean menu icon, gated both directions in
  `tools/content-validate.ts` + `icons.test.ts`. **Every new item you add this session MUST get
  an icon** — that gate is your slop-detector, and it WILL fail the build otherwise.
- **THE GREAT CATALOG** (ADR-061/062/063): ~500 items across 10 chapters; the `tonic` ItemKind,
  the multi-tier revival line, elemental-resist gear, Vibe-on-gear, and secondary equip bonuses.
  Ch.1–2 are placed live; Ch.3–10 are defined + iconed + manifested + shop-data-ready.
- **The economy + base systems:** the ATM withdraw/deposit split (`cashOnHand`/`banked`/
  `pendingDeposit`), Dad-save, picnic, hospitals/revival (§A4.7), the three existing paused-world
  minigames (Arcade `ArcadeScene`, Hoops `HoopsScene`, Links `LinksScene`) — your precedent for
  every new sub-scene. The five heroes, their kits, and the AWAKENINGS staging (ADR-035).

**UNBUILT (this session builds it — the S16 decree never landed):**
- **No vehicles exist.** There is no `src/spritegen/vehicles.ts`, no traffic system, no garages/
  driveways/gas-stations/bus-stations/airports as drivable-world fixtures.
- **No control system.** Jay's `mindwarp` / Hypno line and the `mind_immune` enemy flag exist
  only as BATTLE canon (`src/data/abilities.ts`, `src/battle/`). There is **no overworld
  ability-use system at all** — PSI is battle-only today. The "borrow a driver / drive the party"
  toy does not exist.
- **No overworld PSI keys.** No field-cast UI, no field FX animations, no obstacle-reacts-to-PSI
  gates. (Confirmed: "NO overworld field abilities yet.")
- **No real estate.** Despite scattered queue notes ("27 Maple", a mortgage, "Hillcrest Manor",
  a title registry), NONE of it is built — the live save is **v9** and carries **no deed, no
  homeChest, no property registry, no furniture layout, no vehicle ownership**. Real estate is
  **greenfield**. There is no realtor, no lawyer's office, no home editor.
- **No paperboy, no disguise/costume system, no highway maps, no plane-interior travel scene,
  no purchasable fleet.**

**The patterns you inherit and will reuse constantly:**
- **The tile+PROP-solid BFS probe.** The content-validate map-quality BFS IGNORES prop solids, so
  trees / gift-boxes / buildings / **vehicles / driveways / furniture / psi-obstacles** can
  soft-lock a fixture the validator calls reachable. ALWAYS re-prove a dense-prop or MOVING-prop
  map with a throwaway `tools/_probe_*.mts` (model the player foot box `{x:cx-5,y:cy-9,w:10,h:9}`
  over tile solidity + prop solid rects, excluding `ifFlag` props), then delete it. A moving
  vehicle that can corner the player against a wall is a soft-lock — the traffic system must
  guarantee a lane at every time-step.
- **The post-build-fixup re-route** (re-route a door out of a frozen core without breaking the
  byte-identical proof — proven for docks, the foot-return, the cage; ADR-056/059).
- **The 3-way quest law** (`quests.ts` + the §A10 QuestPin in `content-validate.ts` +
  `chapters.ts`, pinned both directions).
- **The per-area-skins law** — every named area draws ONLY from its OWN `AREA_SKINS` slice; a new
  area registers its own roster, never reusing another's.
- **ADR-015 prefer-flags** — carry ledgers as number/bool FLAGS where possible; only an
  array-shaped thing (a bag, a furniture layout) earns a new typed save field + a migration.
- **Frozen cores stay byte-identical** (`world_block.test.ts`); growth is append-only outside the
  copied core (`x ≥ CW || y ≥ CH`); the FNV re-pin rule (`levelkit.test.ts`) fires ONLY for
  sample-routed generators or a building family inserted BEFORE existing ones in `buildings.ts`
  (APPEND new families at the END).

---

## THE VISION (the user's S18 decree — consolidated)

The world already bustles with people and shops; now it gets **wheels, keys, and a home**.

1. **A FULL PROPERTY-TYCOON MARKET.** You can **buy and sell real estate** across the world.
   Every town has a **real-estate agency** (the listings, the keys, the open houses) and a
   **lawyer's office** (the closing, the deed, the signatures — "initial the crayon box"). A home
   is your **base**: sleep to fully restore HP/PP, save (a phone), store items, and decorate it.
   Beyond your home, real estate is a **wealth engine** for the back half (§A9's Fortune Arc):
   buy run-down properties cheap, **renovate + furnish them, and flip them for more**; **collect
   rent** from owned shops and rentals; prices move at chapter boundaries on a seeded walk. It
   stays EarthBound: a twelve-year-old with a mortgage, a lawyer who doesn't blink, a beagle that
   comes with the house.
2. **A SIMS-STYLE HOME EDITOR.** Decorate any home you own with **free-placement furniture** on
   the room's tile grid — pick a piece from a furniture catalog, place / move / rotate it, and the
   layout saves per-home. Furniture is more than dressing: a home's **COZINESS** (computed from
   what you place) gives a small rest buff AND **raises a property's resale value** — the
   Sims-meets-tycoon hook. Invent warm, specific, EarthBound use-cases for what a home can hold
   (see §A4.14 below).
3. **THE CONTROL SYSTEM (the borrowed hands).** **JAY learns literal MIND CONTROL — of PEOPLE**
   (a higher turn of his Hypno line): borrow a person briefly — a vehicle's *driver* (then the
   party boards if the seats fit and you drive), or a *guard/clerk/citizen* to open a gate, flip a
   switch, or vouch you past a checkpoint. **MILO controls MACHINES — the vehicles themselves**
   (a TV-clicker he builds): pilot an *empty* car/truck/bus/excavator with no driver to unlock a
   path even when the party can't fit. **TOGETHER they RIDE** — usable seats = `vehicle.seats − 1`
   (the driver); board only if `usable seats ≥ party size`, so a motorcycle fits a tiny party, a
   4-seat car fits a party of ≤3, and an SUV/van/bus is needed at 4–5. **The COUNTER:** the
   **DEAD-AIR HELMET** (the diegetic face of the existing `mind_immune` flag) — some people/bosses
   can't be Puppeted and some machines are shielded against the Clicker; route around them
   (disguise, a PSI gate, a remote vehicle) or knock the helmet off in a boss fight. **It SCALES**
   all game (ADR-035 staging): cars → trucks/buses → boats → planes → submarines → yachts, and
   later you **purchase** the bigger craft.
4. **PSI AS OVERWORLD KEYS.** PSI Fire burns vine walls / lights furnaces / melts ice; PSI Freeze
   bridges waterfalls and geysers; PSI Flash reveals hidden ways — each with a NEW overworld
   casting animation and an obstacle that reacts. Every chapter dungeon seeds ≥1 such gate, with
   the ability LEARNED first and the gate paying it off (never the sole teacher).
5. **A LIVING, DRIVABLE WORLD.** Cars/trucks/buses/bikes drive the streets; houses have
   **garages + driveways + parked cars**; **gas stations, bus stations, airports, heliports** you
   can enter; **highway** stretches where the map IS the road; one **plane-interior** travel
   scene; and the **PAPERBOY** minigame with a real prize. A **disguise/costume sneak** to slip
   past the Smilers (and reused for later sneaks). Every area's buildings **sized + styled to that
   area's feel**.

**Travel model (decided, unchanged):** the §A5 set-pieces (banana boat, Lucille, the night train,
the rocket) stay canon for crossing regions — the Ember-trail linearity is untouched. Everything
above is a NEW intra-region free-roam + targeted story-gate layer on TOP. Teleport α/β (Ch.6/Ch.8)
remains the global fast-travel; vehicles are flavor + early-/mid-game + the wealth fantasy.

---

## CARRY EVERY PRIOR LAW FORWARD (non-negotiable)

- **FROZEN CORES** (`world_block.test.ts`) stay byte-identical; all growth is append-only,
  strictly outside the copied core (`x ≥ CW || y ≥ CH`). Two builds byte-identical; the live MAPS
  entry matches a fresh build. **Traffic/vehicles/parked-cars/driveways/furniture-props must NEVER
  be baked into a frozen core's prop array** — spawn traffic at runtime (the traffic system), and
  append static fixtures only on GROWN maps via the documented exception pattern.
- **ADR-012:** `cityViolations(map) === []` on every `settlement:'city'` map, unexempted. New road
  tiles for traffic keep the `'R'/'D'/'X'` street-cell accounting intact (the sweep keys on it).
  Gas stations / bus stations / lots / agencies / lawyer offices use existing walkable dressing;
  never break the ≥6-road-row / connector-avenue / 2-block-face minimums.
- **ADR-020 hand-art, by construction:** every new sprite (vehicles, furniture, the new buildings,
  the PSI overworld FX, the disguise looks) is REAL drawn `Pixmap` art in the 64-color master
  palette — flat fills, deliberate marks, no scatter noise, `outline()` last, shadows never
  outlined. `npm run art:check` (palette conformance) stays green. Never invent a sprite key not
  registered in `src/spritegen/index.ts`. **NO AI smell** (§A11.7): a vehicle, a sofa, a listing,
  or a line that could move to another region unchanged isn't done.
- **ADR-050/051/053 (buildings):** buildings + vehicles collide as their TRUE drawn footprint (you
  can't walk through a parked truck); keep `PLACE_MARGIN` walkable tiles between footprints; never
  seal a lane. A MOVING vehicle must never trap the player against a wall (the M26 traffic safety
  law). APPEND new facade FAMILIES at the END of `buildings.ts` (never before existing ones, or
  you shift the litSeq/FNV pins).
- **THE ICON GATE (ADR-060, both directions):** every `ITEMS` entry — including every new
  furniture piece, paperboy prize, deed/title key-item, and vehicle-title — has an `ITEM_ICON`/
  forge row; no icon row names a missing item. Mirror in `icons.test.ts`.
- **THE MANIFEST PINS WILL FIGHT YOU — widen them on purpose (ADR-017).** New mechanics need new
  optional schema fields + new bidirectional manifests (a vehicle registry, a furniture registry,
  a property registry, a psi-gate registry), each gated BOTH directions in `content-validate.ts`
  + a mirror test. Never delete a law to pass; widen it.
- **PLAIN-SPOKEN dialogue** (§A11): cutscene captions auto-time via `Math.max(2600, 1000+len·55)`;
  interactive dialogue is A-advanced. The Hush is never funny; sincerity is never the joke; faith
  is warm. **No chapter UI ever** (§A11.6) — area banners may show diegetic place names, never
  chapter numbers/titles. Jay's Puppet is a comedic, apologetic *borrow* — the deliberate OPPOSITE
  of the Hush, which steals free will FOREVER. Never let the two read alike.
- **FNV re-pin rule** (`levelkit.test.ts`): re-pin ONLY if you change the body of a sample-routed
  generator or insert a building family before existing ones. The control system, traffic, icons,
  vehicles, furniture, the property registry, and the new venues are NOT sample-routed — they need
  no re-pin. The home editor writes to SAVE state + per-home layout DATA, not into a frozen core.
- **The §A10 quest law (both directions)** and the **per-area-skins law** as above.

---

## AMEND THE BIBLE FIRST (the new canon — do this in the SAME commit as the movement that introduces it)

Per Appendix rule 6, a system is canon only once it's in the Bible. Draft text below — refine in
the game's voice, keep §A11 tone. Each amendment lands with its movement + its ADR. (Append the
new §A4 subsections after §A4.12; reserved numbers 10/11 from the §A4.12 note are now claimed by
the control system + overworld PSI, exactly as that note foresaw.)

### §A4.10 — THE CONTROL SYSTEM (the borrowed hands)

Two complementary powers the party earns when it becomes three (Ch.3, on Milo's join), each
staged as an AWAKENING/BUILD per ADR-035:
- **JAY — VIBE PUPPET (mind control of PEOPLE).** A higher turn of his **Hypno** line (Hypno α
  already lulls to sleep; PUPPET takes the strings instead — a canon-consistent evolution, not a
  new ability from nowhere). Tap a highlighted person in range; for a short, PP-costed window Jay
  acts AS them — walk them, open a gate, flip a switch, vouch past a guard, or take a vehicle's
  driver's seat. They snap back bewildered and unharmed ("sorry, ma'am, you're going to
  parallel-park for me"). The OPPOSITE of the Hush.
- **MILO — THE CLICKER (machine control of VEHICLES/MACHINERY).** A universal remote he builds
  (very EarthBound: a TV clicker that drives cars). Point it at an *unoccupied* machine and pilot
  it driver-less — send an empty car/truck/bus somewhere to unlock a path even when the party
  can't fit; run an excavator/crane/dump truck (clear rubble, lift, dump). Scales to boats, planes,
  subs, yachts as the Clicker upgrades through the chapters.
- **THE RIDE (combined).** Jay borrows the driver + Milo keeps the machine running → the party
  boards if **usable seats (= `vehicle.seats − 1`) ≥ party size** and you drive free-roam or as a
  scripted beat. If the party is too big to ride, you can STILL Clicker-drive the empty vehicle to
  a destination — its own puzzle layer.
- **THE COUNTER — the DEAD-AIR HELMET.** The diegetic face of the existing `mind_immune` flag: the
  Hush issues its lieutenants (and certain bosses) a control-blocking helmet, and some machines are
  Faraday-shielded against the Clicker. A helmeted target can't be Puppeted/Clickered — route
  around it (disguise, a PSI gate, a remote vehicle) or knock the helmet off first in a boss fight.
  Introduced as a Department-of-Smiles prototype (Ch.1), refined by the Hush thereafter.
- **UX law:** controllable targets are clearly highlighted; seat-fit + range read at a glance;
  driving feels smooth on D-pad + controller; blocked (helmeted/shielded) targets show a clear "no
  signal" tell. Smooth, easy, fun — or it isn't done.

### §A4.11 — PSI IN THE WORLD (powers as keys)

Beyond battle, certain abilities are OVERWORLD KEYS, EarthBound-style: **PSI Fire** burns vine
walls / lights furnaces / melts ice blocks; **PSI Freeze** freezes waterfalls, geysers, and lakes
into crossable ice; **PSI Flash** reveals hidden paths/items; **Teleport** stays per §A4.6.
Field-casting plays a NEW overworld animation and the obstacle reacts. Every chapter dungeon seeds
≥1 such gate using a chapter-appropriate ability; the ability is LEARNED first (awakening/level),
then the gate pays it off — a gate is never the sole teacher, and is non-missable + retry-safe.

### §A4.13 — THE PROPERTY MARKET (deeds, agencies, lawyers, and the flip)

Real estate is a buyable, sellable, **ownable** layer over the world, and the back half's wealth
engine (§A9 Fortune Arc).
- **THE AGENCY (one per town).** A real-estate office with an agent (one §A11 obsession — e.g.
  she describes every room as "cozy" no matter the size) who LISTS the region's properties: price,
  a one-line in-voice blurb ("One previous owner. She took the doorknobs."), and an OPEN-HOUSE walk
  (enter the empty interior before you buy). Listings refresh by chapter-flag; some are story homes,
  some are flips.
- **THE LAWYER'S OFFICE (one per town).** Closing happens here: review the deed, sign ("initial the
  crayon box"), pay the down payment (or finance it at the S&L), and walk out with **THE DEED** — a
  key item; the door opens the day you sign. Selling closes here too (the lawyer takes "the tenth
  part, for the pen"). The lawyer never blinks at a twelve-year-old.
- **FINANCING (the S&L loan desk).** The Otterbrook Savings & Loan gains a LOAN DESK: a **car note**
  and a **mortgage** are borrowed cash now, repaid as a 25% GARNISH of every future Dad deposit
  until principal ×1.1 clears. One active garnish at a time; the officer remembers you.
- **OWN, FLIP, RENT.** A home is a base (§A4.14). Beyond your home: buy a run-down property cheap,
  **renovate + furnish it (the COZINESS lifts its resale)**, and sell it through the lawyer for
  more — a real flip loop. **Owned shops/rentals pay RENT** into Dad's deposits at chapter
  boundaries. Property prices move at chapter boundaries on a seeded deterministic walk per save
  (ADR-008 bot replays byte-equal). The Ember trail never cares about money; the epilogue's quiet
  walk home is unchanged (§A11.2) — net worth is a number, the callers are the score.
- **THE REGISTRY.** Owned properties + their loan ledgers ride number/bool FLAGS (ADR-015):
  `owned`, `garnishPrincipal`/`garnishPaid` per title, `deed` key-items. Each home's furniture
  LAYOUT is the only array-shaped state and earns a typed save field + a migration.

### §A4.14 — THE HOME EDITOR (a Sims-style base you make yours)

Any home you own can be decorated with **free-placement furniture** on its room tile grid: open the
editor, pick a piece from the FURNITURE CATALOG, place / move / rotate it; the layout saves
per-home. Furniture is a new `furniture` ItemKind (bought at a HOME GOODS store, the agency, or
quest-earned), iconed like every item, and each piece has a footprint + a function. A home's
**COZINESS** (a score computed from placed furniture — variety, matching themes, the "good stuff")
gives a small rest buff (a Sunny-Side-lite for your next battles after sleeping) AND **raises the
property's resale value** (the flip hook). Canon home use-cases (invent more, all warm + specific):
- **THE BED** — free full HP/PP restore for standing heroes (Mom's rules; angels still point at the
  hospital).
- **THE PHONE / YOUR OWN LINE** — Dad saves here; sometimes it's already ringing when you walk in
  (Mom heard you bought a HOUSE: "A twelve-year-old with a MORTGAGE. Wait till your father—").
- **THE FRIDGE** — one free regional food per region-flag.
- **THE FOOTLOCKER / STORAGE** — home storage that grows with the property tier (a starter chest →
  a manor's grand footlocker); deposit/withdraw from any hero's bag (hands-full finally has a home).
- **THE MANTEL / TROPHY SHELF** — trophies + Mr. Click photos render as earned (the credits album,
  previewed at home).
- **THE RECORD PLAYER** — plays the Homesong stems earned so far (§A4.9's cozy twin).
- **THE MAILBOX** — Dad mails a postcard per completed chapter (a validator-swept collectible set);
  the sisters tape a drawing to the fridge after quest #3.
- **THE WORKBENCH** — Milo's Repair happens here overnight (Broken Gizmo → battle item).
- **THE KITCHEN COUNTER** — assemble Family picnic baskets at home (the deli law, at home).
- **THE GUEST BOOK / GUEST ROOMS** — post-quest CALLERS visit owned homes on rotation (the S9
  ledger's warmth; Buni leaves sarmale in the fridge).
- **THE PET BED** — Biscuit the beagle visits a home with one (quest #1 tie-in).
- **DECOR THAT MATTERS** — a houseplant you water and it grows; a fish tank; a gnome; wallpaper /
  floor / theme swaps that change COZINESS. The decor is the soul; the buff is the wink.

### §A5 — travel addendum (append; do NOT rewrite the set-piece table)

The set-piece travel table is unchanged (Embers keep the journey linear). NEW: a free-roam
**road/traffic** layer inside regions; **HIGHWAY** stretches (long driving sections where the map
IS the road); one **PLANE-INTERIOR** travel scene (the bus/boat-interior precedent applied to a
flight); and a late-game **FLEET** (boats/planes/subs/yachts, purchasable at marinas/airfields/
helipads — including on owned properties) the Clicker scales into. None replace an Ember leg.

### §A6 — chapter beats (amend the relevant chapters; §A11 voice; no chapter UI)

Weave the new beats into the EXISTING chapters:
- **Ch.1 (America):** traffic debuts in Brickton; the **DISGUISE SNEAK** (don a blue blazer to blend
  with the Smilers and reach Mia in the Department of Smiles); the **PAPERBOY** minigame in
  Otterbrook/Brickton; the Department issues the first **DEAD-AIR HELMET** prototype; the **AGENCY +
  LAWYER + S&L LOAN DESK** open and **27 MAPLE** (the starter home) goes up FOR SALE.
- **Ch.3 (England):** the CONTROL SYSTEM UNLOCKS on Milo's join (Jay's PUPPET awakening + Milo's
  CLICKER build, §A11.2 staged); a control-the-guard beat at Wintermoor; an early remote-drive
  puzzle (Clicker the groundskeeper's mower/cart); a PSI gate (freeze a coolant pipe to cross).
- **Ch.5 (Minimus):** comedic scale — Puppet a Whistle Guard; Clicker a tiny parade float; the
  duchy's agency lists a knee-high cottage.
- **Ch.6 (Africa):** the **INVESTMENT DESK** opens at the S&L (the Fortune-Arc wealth engine);
  property flipping becomes worthwhile.
- **Ch.7 (India):** Chandrapore traffic + a **HIGHWAY** chase to the city; the **MANDATORY DRIVE**
  (control a taxi/bus to ferry the party — in the backseat — where the train can't reach); a palace
  **disguise**; **Cobra Raja wears a DEAD-AIR HELMET** (knock it off to win); the bluff above
  Brickton lists **HILLCREST MANOR** (the user's mansion).
- **Ch.8 (China):** boats (Clicker the riverboat); machine puzzles with the paper guardians.
- **Ch.9 (Romania):** Hoaxula's bankrupt theme-park property can be bought + flipped post-mercy (a
  warm, not gag-heavy, beat).
- **Ch.10 (Alaska→Hawaii→Mars):** the **PLANE-INTERIOR** travel scene (the flight to the launch);
  the **FLEET** capstone (the Clicker scales to the rocket-adjacent machinery; planes/subs as final
  traversal toys).
- Seed PSI-FIRE / PSI-FREEZE / PSI-FLASH gates through the chapter dungeons (≥1 per dungeon).

### §A7 / §A8 / §A9 — additions

- **§A7:** helmeted enemy variants (DEAD-AIR-HELMET guards/lieutenants) as a mechanical hook
  (can't be controlled until the helmet's off). Keep the §A7 Enemy Flow Law (map tell, battle
  hook, identity drop, death line). Traffic vehicles are ambiance + control targets, NOT enemies;
  ONE optional "road-rage" hostile-vehicle set-piece per highway is allowed.
- **§A8:** the vehicle roster is world props/key-item TITLES, not inventory weapons; **FURNITURE
  is a new `furniture` ItemKind** (iconed, priced, banded, placed by the editor); property DEEDS
  and vehicle TITLES are key items / unlock flags; the PAPERBOY prize is a real §A8 item (a charm
  or fun sidegrade — extend the right manifest in the same commit).
- **§A9:** prices for properties, vehicles, furniture, and the flip/rent yields track the §A9
  level/economy targets AND the Fortune-Arc net-worth table (Ch.1 ~$1K → Ch.10 $3B+). The 1995
  economy of Ch.1–3 stays tight; the back half escalates BY DESIGN. `tools/balance-sim.ts` adopts
  the targets; tune DATA, never code. A NET WORTH line joins the stats page.

### §B — technical (append to §B1/§B3/§B4)

- A **traffic system** (deterministic/seeded vehicle movement on road tiles, culled + pooled for
  60fps), a **control system** (overworld targeting, seat-fit, driving, the helmet/shield blocks),
  an **overworld-PSI caster** (field FX + obstacle reactions), a **property registry** (deeds,
  loans, rent, the seeded price walk), and a **home editor** (free-placement furniture, per-home
  layout serialization, COZINESS). All data-driven, validated both directions.
- New SAVE state (bump the schema, register migrations, round-trip test): per-home **furniture
  layouts**, the **home storage** array(s), and any **vehicle-ownership/fuel** state that can't be
  a flag. Everything else rides ADR-015 number/bool flags.

---

## DO THESE IN ORDER — MOVEMENTS 25–34

> Each movement is one focused arc that ships GREEN (validator + vitest + tsc + build), ends with
> its own ADR + the matching Bible amendment (SAME commit), and re-renders the relevant contact
> sheet(s). Append ADRs from the next free id (ADR-064 as of S17 M18). Re-prove dense/moving-prop
> maps with the tile+PROP BFS. Keep frozen cores byte-identical; re-pin FNV only if a sample-routed
> generator changed. Vehicles/furniture/icons/property data are NOT sample-routed — no FNV re-pin.

### MOVEMENT 25 — AREA-TRUE BUILDINGS (sizes + aesthetics per area) — do FIRST
The lowest-risk, everywhere-visible win, and the canvas everything else sits on.
- **Audit every area's `AREA_SKINS` slice + hand-placed facades** against its §A5/§A6 feel and fix
  mismatches: sleepy Otterbrook stays low + warm; Brickton towers (cool glass, the colossi); Puerto
  Sol reads as a grand PORT; England foggy-academy stone; Norway giant-scale (Lilleby vs. normal
  Kvisthavn); Minimus tabletop-tiny; Africa bazaar; India dense Chandrapore; China temple; Romania
  painted village; Alaska/Hawaii claustrophobic; Mars dread. For unlanded chapters this is the
  AREA_SKINS spec the forge will wear (no maps required yet).
- **Tune `BUILDING_DIMS` + the height ladder per area** so a building's drawn size matches what the
  place should feel like (a sleepy town never towers; a metropolis does). Add per-area facade
  families only where a place needs a silhouette the catalog lacks — **APPEND families at the END**
  of `buildings.ts`.
- **Re-prove:** `cityViolations` clear on every city; `npm run art:buildings` renders the refreshed
  catalog at hero scale; frozen cores untouched (this is AREA_SKINS/dims/new-families work).
- **DONE-WHEN:** each area's buildings unmistakably belong to that area. Append the ADR; amend §B4.

### MOVEMENT 26 — THE VEHICLE FORGE + TRAFFIC + THE LIVING NEIGHBORHOOD — do SECOND
The art + ambiance foundation the control system rides on. No control yet — just a world with wheels.
- **`src/spritegen/vehicles.ts`** (registered in `index.ts`): car, motorcycle, bicycle, bus, van,
  race car, SUV, large SUV, modern EV, truck, dump truck, trash cans, excavator + heavy machinery;
  and — defined now for later movements — boat, yacht, submarine, fighter jet, small plane, jumbo
  jet, blimp, helicopter. Each in **several seeded colors/designs** (a `RAMP`-driven palette like
  the building catalog), drawn to read against the 16×24 hero, with a clear FOOTPRINT solid and a
  `seats` count in a `VEHICLE_DIMS` data table. Pixel-clean under ADR-020; `art:check` green;
  `npm run art:vehicles` contact sheet renders. Both-directions VEHICLE manifest in the validator.
- **THE TRAFFIC SYSTEM** (a new overworld system): vehicles spawn on `'R'/'D'` road tiles and drive
  deterministic/seeded routes as ambiance + future control targets. **Safety law:** a moving vehicle
  may NEVER corner/crush the player or seal a lane — it yields/pauses/reroutes; prove it with the
  tile+PROP BFS over the road graph at several time-steps. Object-pool + cull for 60fps (§B4).
- **THE NEW BUILDINGS + NEIGHBORHOODS:** gas stations (+ convenience-store interior), bus stations
  (+ interior), airports (+ interior/runway), heliports, and house **GARAGES + DRIVEWAYS** (a
  driveway tile/dressing + a parked car) so suburban blocks read lived-in. Optional pooled
  pedestrian wanderers for bustle. Wire a couple into grown Otterbrook/Brickton as a first showcase
  (append-only on grown maps; cores frozen).
- **DONE-WHEN:** a city street has cars driving, a gas station, parked cars in driveways, and a bus
  station you can enter — alive at 60fps; tile+PROP BFS clear with traffic moving. Append the ADR;
  amend §A5/§B.

### MOVEMENT 27 — THE CONTROL SYSTEM (Jay's PUPPET + Milo's CLICKER + the overworld-ability spine) — do THIRD
The signature new toy. It also builds the **overworld ability-use spine** that M28 (PSI) reuses, so
do them adjacent.
- **The overworld-ability spine:** a clean field-invoke entry (e.g. Y-button alt → a small ability
  wheel/menu, A to invoke), a target/range highlight, a PP cost, and a result hook. Build it
  generic — Puppet, Clicker, and the M28 PSI casts are all consumers.
- **JAY — VIBE PUPPET (people):** target a controllable person in range (highlighted); act as them
  for a PP-costed window — walk them, open a gate, flip a switch, vouch past a guard, take a
  vehicle's driver's seat. They snap back unharmed. Stage it as a Hypno-line AWAKENING (ADR-035) on
  the party hitting three (Ch.3).
- **MILO — THE CLICKER (machines):** target an unoccupied vehicle/machine; pilot it directly
  (D-pad/stick), driver-less; **remote-drive empty vehicles to unlock areas** (weight-limited
  bridge, bus-only gate, a ferry); run heavy machinery (clear rubble, lift, dump). Stage it as a
  Milo gadget BUILD on his join.
- **THE RIDE (combined) + SEAT-FIT:** usable seats = `vehicle.seats − 1`; ride only if `≥ party
  size`. If too big, Clicker-drive empty. Driving must feel SMOOTH (accel, turn, collision-slide, a
  satisfying engine SFX) on touch + controller; the party rides as followers/in-cabin; free-roam any
  city for fun.
- **THE DEAD-AIR HELMET / SHIELD:** helmeted people can't be Puppeted; shielded machines can't be
  Clickered — a clear "no signal" tell. Wire the first helmet at the Department of Smiles (Ch.1) and
  helmeted enemy variants (§A7) whose helmet must come off in battle before control works (reuse the
  existing `mind_immune` flag as the data spine).
- **Re-prove:** control targeting, seat-fit gating, remote-drive area-unlocks, and helmet/shield
  blocks all in a vitest harness over the engine API; BFS the maps that gain drivable vehicles.
- **DONE-WHEN:** you can Puppet a driver, pile the party into a car, drive a city smoothly, and
  Clicker an empty truck across a bridge — and a helmeted guard cleanly refuses. Append the ADR;
  amend §A4.10 to canon as built.

### MOVEMENT 28 — PSI IN THE WORLD (overworld casting + the puzzle gates) — do FOURTH
Reuses M27's overworld-ability spine.
- **The PSI field-cast UI + NEW overworld FX** (a flame wash, a freezing bloom, a flash) + the
  obstacle reacting (vines burn away, a waterfall becomes an ice bridge, a hidden path lights up).
  Casts cost PP and play smoothly. Add a `psi_gate` TriggerDef kind (x/y/w/h, required ability,
  effect on contact/cast) and a both-directions PSI-GATE manifest.
- **The gates:** seed ≥1 PSI obstacle per chapter dungeon, chapter-appropriate, with a §A11-clear
  sign that teaches without explaining the joke. Learned first, gate pays it off; non-missable,
  retry-safe.
- **Re-prove:** each gated map with the tile+PROP BFS in BOTH states (obstacle present / cleared) —
  cleared opens the route; present never strands a required fixture reachable only past it.
- **DONE-WHEN:** PSI Fire burns a vine wall on the field and you walk through; PSI Freeze bridges a
  waterfall. Append the ADR; amend §A4.11 to canon as built.

### MOVEMENT 29 — THE PROPERTY MARKET (agencies, lawyers, the S&L loan desk, deeds & the flip) — do FIFTH
The wealth + base spine. Build the systems; M30 makes homes editable; later movements pour content.
- **THE PROPERTY REGISTRY** (ADR-015 flags): per-title `owned` / `garnishPrincipal` / `garnishPaid`
  / `deed`; one active garnish; a seeded chapter-boundary price walk; rent accrual into Dad's
  deposits at chapter flags. Bump the SAVE schema for the array-shaped bits (home storage); register
  the migration; round-trip test. Generalize any existing deed/garnish notes into this registry.
- **THE AGENCY interior + the LAWYER'S OFFICE interior** (extend `buildInterior` templates — add
  `agency` and `lawyer` alongside home/shop/hospital/chapel/deli/civic/hotel): the agent LISTS
  properties (price, in-voice blurb, an OPEN-HOUSE walk into the empty interior); the lawyer CLOSES
  (sign, pay/finance, hand the DEED key-item; selling closes here too, minus "the tenth part"). One
  §A11 obsession each. Place an agency + lawyer in Otterbrook/Brickton live now; spec them for every
  other town's AREA_SKINS.
- **THE S&L LOAN DESK:** the car note + the mortgage (25% garnish, ×1.1, one at a time), gated by
  chapter flags. The Investment Desk (bonds + the goofy tickers) is in-scope here OR may be deferred
  to its own follow-up — if you build it, gate it `ch6_complete` and replay byte-equal under the bot.
- **HOMES AS BASES:** a bought home's interior gives the §A4.14 payloads MINUS the editor (bed full
  restore, phone-save, fridge, footlocker, mantel, mailbox). **27 MAPLE** (Otterbrook starter) is
  placed live; the per-region homes + **HILLCREST MANOR** are defined + priced + registered (placed
  when their chapter lands, per the unlanded discipline).
- **THE FLIP loop (systems now, value tuned in M34):** buy run-down → (furnish in M30) → sell higher
  through the lawyer; owned shops/rentals pay rent. Prices + yields feed §A9's Fortune Arc.
- **Re-prove:** buy/sell/finance/garnish/rent math in a vitest harness; every new interior BFS-clean;
  the registry round-trips through save/load.
- **DONE-WHEN:** you can walk into the Otterbrook agency, tour 27 Maple, close at the lawyer's, get
  the deed, sleep there to full-restore, save on its phone, and (with a flip property) sell one back
  for a profit. Append the ADR; amend §A4.13 to canon as built.

### MOVEMENT 30 — THE HOME EDITOR (Sims-style free-placement furniture) — do SIXTH
The fun heart of the property layer. Needs M29's ownable homes.
- **THE FURNITURE CATALOG:** a new `furniture` ItemKind (schema field + superRefine pairing — a
  footprint + a function tag), each piece ICONED (the M-?? icon gate applies — extend the forge),
  priced, banded, and on-theme per region (§A11.7). Sell at a HOME GOODS store (a new interior
  template or a shelf in the agency); some pieces are quest/flip rewards. Functions per §A4.14 (bed,
  phone, fridge, footlocker, mantel, record player, mailbox, workbench, kitchen counter, pet bed,
  plant, fish tank, gnome, wallpaper/floor/theme).
- **THE EDITOR SCENE** (the paused-world sub-scene precedent — `ArcadeScene/HoopsScene/LinksScene`):
  open it inside an owned home; pick a piece from the catalog (only pieces you own/bought), place /
  move / **rotate** it on the room's tile grid with a clear ghost preview + collision feedback (no
  overlapping footprints, no blocking the door — re-prove with the tile+PROP BFS that the room stays
  traversable and the exit reachable). Save the layout per-home (the new typed save field). Smooth on
  touch + pad + keys (ADR-024 edge law).
- **COZINESS:** compute a score from placed furniture (variety, theme match, the "good stuff"); a
  cozy home grants a small rest buff after sleeping (a Sunny-Side-lite) AND raises the property's
  resale value (the flip hook — wire it into M29's sell price). Show the score in the editor HUD.
- **Re-prove:** placement never soft-locks a room (BFS both empty + fully furnished); the layout
  serializes + restores byte-stable; the furniture icon gate is green both directions.
- **DONE-WHEN:** you can furnish 27 Maple from a catalog, rotate a couch, see COZINESS rise, sleep
  for the cozy buff, and a furnished flip sells for more than an empty one. Append the ADR; amend
  §A4.14 + §A8 (the furniture kind) to canon as built.

### MOVEMENT 31 — THE STORY WEAVE (disguise, the mandatory drive, highway, plane, the helmet boss) — do SEVENTH
Wire the new mechanics into §A6 as REQUIRED, non-missable beats (retry law holds; §A11 voice).
- **THE DISGUISE/COSTUME SNEAK (Ch.1):** a small costume system (equip a disguise; NPCs react to
  your look via a sprite-variant swap + `ifFlag` gating) — don a blue blazer to blend with the
  Smilers and reach Mia; a disguise/blow-your-cover read; getting "made" = a fight, never a fail.
  Reusable for later sneaks (palace guards Ch.7, Hoaxula's park Ch.9).
- **THE MANDATORY DRIVE (Ch.7):** a stretch where the ONLY way forward is to control a taxi/bus and
  drive the party (in the backseat, bickering) to a place the train can't reach — a real driving
  sequence, EarthBound-funny.
- **HIGHWAY SECTIONS:** long road maps (the map IS the highway) — America and the India approach —
  with traffic, ONE optional "road-rage" hostile-vehicle set-piece, and gas-station rest stops.
- **THE PLANE-INTERIOR (Ch.10):** a flight scene (the bus/boat-interior precedent) — the party in
  the cabin, land sliding by a window, a quiet beat, arrival.
- **THE HELMET BOSS (Ch.7):** Cobra Raja wears a DEAD-AIR HELMET — phase 1 is knocking it off so
  Puppet/Clicker come online for phase 2.
- **Re-prove:** every beat non-missable (post-Teleport reopen where relevant), retry-safe, BFS-clean;
  each adds/strengthens a finale CALLER. **DONE-WHEN:** the disguise gets you to Mia; the drive is the
  only road on; the plane lands. Append the ADR; amend §A6 to canon as built.

### MOVEMENT 32 — THE PAPERBOY (the minigame + the prize) — do EIGHTH
- A self-contained paused-world sub-scene (the Arcade/Hoops/Links precedent): ride the **bicycle**
  (from M26) down a suburban street, deliver papers to mailboxes, dodge obstacles (dogs, sprinklers,
  cars, the open car door), beat a route/score. Deterministic + replayable; clean HUD; smooth
  controls. Emits a close event like the other minigames.
- **The prize:** a real §A8 item for completion (a charm or fun sidegrade — extend the right manifest
  in the same commit) + a finale caller (the paper-route tie-in, Mr. Plummer / quest #2). Reachable
  from a paper-stand prop in Otterbrook/Brickton; non-missable.
- **DONE-WHEN:** you can play a full paper route and win the prize. Append the ADR; amend §A10 (the
  minigame as optional long-form content) + §A8 (the prize).

### MOVEMENT 33 — THE FLEET SCALES (boats/planes/subs/yachts + purchasing) — do NINTH
The traversal capstone — needs the control system + the bigger vehicle sprites + the property layer.
- **Scale the Clicker/Puppet** up the chapters (ADR-035 staging): trucks/buses (Ch.5) → boats
  (Ch.8) → planes (Ch.10) → submarines/yachts (late/NG+). Each scale-up is a staged story moment,
  not a menu unlock.
- **PURCHASING:** buy vehicles at a dealership/marina/airfield/helipad (including the GARAGE / HELIPAD
  / MARINA on owned properties — the Comet GT in the PRE-LOVED lot's back room, the Starhopper jet at
  the airport, a yacht at a marina) as key-item TITLES; a purchased vehicle is yours to summon/drive
  in free-roam. Cost ties to §A9's Fortune Arc.
- **Late-game traversal:** planes/subs open optional world pockets (the §A4.6 Teleport-reopen spirit)
  without breaking the Ember linearity.
- **DONE-WHEN:** you can buy and pilot a boat/plane, park it at your property, and the control power
  clearly grew with the party. Append the ADR; amend §A4.10/§A5 to canon as built.

### MOVEMENT 34 — BALANCE & THE GREAT VERIFICATION — do LAST
- **The curve:** sweep property prices, rent yields, flip margins, vehicle costs, and furniture
  prices against §A9's level targets AND the Fortune-Arc net-worth table (Ch.1 ~$1K → Ch.10 $3B+);
  COZINESS→resale stays a meaningful-but-not-broken lever. Extend `tools/balance-sim.ts`; tune DATA,
  never code, to green. Add the NET WORTH stats line.
- **The great verification:** the both-directions gates (icon, vehicle, furniture, property, psi-gate)
  all green; every shop/listing/reward references a real item/property; no orphans; the §A11
  read-through (Hush never funny, Puppet a comedic borrow, sincerity clean, no chapter UI); perf
  (§B4) — traffic + the editor hold 60fps overworld on a mid-range Android target (pool + cull;
  `bench-map.ts` caps respected); every map that gained vehicles/driveways/stations/psi-gates/
  furniture re-proven with the tile+PROP BFS (moving vehicles at several time-steps — no soft-lock,
  no corner-trap, lanes preserved).
- **DONE-WHEN:** `npm run validate` prints the new manifests' counts, full vitest green, tsc clean,
  `vite build` clean, balance-sim green; the `android:apk` path stays green. Append the consolidated
  ADR; confirm every §A4/§A5/§A6/§A8/§A9/§B amendment is in.

---

## QA (docs/QA.md pre-flight + new rows) + DONE-WHEN

- validator + full vitest + tsc + `npm run build` GREEN at EVERY movement; `art:check` green;
  frozen cores byte-identical (`world_block`); FNV re-pinned ONLY if a sample-routed generator
  changed.
- **Perf (§B4):** traffic + the control system + the home editor hold 60fps overworld / ≥45fps
  battle on a mid-range Android target; prop count is the p99 lever — pool + cull vehicles and
  pedestrians; `bench-map.ts` caps respected (raise with a reason if a busy city needs it).
- **Every map** that gains vehicles / driveways / stations / psi-gate obstacles / placed furniture
  re-proven with the tile+PROP-solid BFS (moving vehicles at several time-steps — no soft-lock, no
  corner-trap, lanes preserved); every editable room BFS-clean empty AND fully furnished.
- **The UX read out loud:** control targeting is obvious, seat-fit is legible, driving is smooth on
  touch AND controller, helmet/shield blocks are clear, the home editor places/rotates/saves
  smoothly, buying/selling/financing a property is legible. Smooth, easy, fun — the bar.
- **Saves:** the schema bump (furniture layouts + home storage + any vehicle-ownership state)
  migrates cleanly from v9, round-trips byte-stable, and the ADR-008 bot replays the property price
  walk + a furnished layout byte-equal across a kill/reload.
- **The §A11 read-through:** every new line plain-spoken, kid-readable, one obsession per NPC, the
  Hush never funny, Jay's Puppet a comedic *borrow* (never the Hush's theft), sincerity clean. No
  chapter UI.
- **`.shots/`** of: the refreshed per-area buildings; a bustling city with traffic + a gas station +
  driveways; the control-targeting UI; an overworld PSI-Fire/Freeze cast; the disguise sneak; the
  highway; the plane interior; the paperboy route; the real-estate agency + lawyer's office; the
  home editor mid-decorate with the COZINESS read; and a piloted boat/plane parked at an owned
  property. Use the `art:*` contact sheets or the `window.shot` pipeline — **NOT
  `preview_screenshot`** (it hangs on the WebGL canvas).
- Append one ADR per movement (next free id) per the drift rule, amending the Bible (§A4.10/§A4.11/
  §A4.13/§A4.14/§A5/§A6/§A8/§A9/§B) in the SAME commit. Mark `docs/PROMPT_S16_LIVING_WORLD.md`
  superseded at its top.

**Build it like it ships: a world you can drive, a home you can make yours, and an honest little
power fantasy to flip your way into — smooth, easy, fun, and unmistakably EarthBound.** ☄️
