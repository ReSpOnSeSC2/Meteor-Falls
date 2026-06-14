> **STATUS (2026-06-14): SUPERSEDED — design appendix only.** Only Movement 8 (THE ICON ATLAS,
> ADR-060) of this prompt ever shipped; the project then pivoted to the S17 item catalog
> (ADR-061→063). Movements 9–15 (vehicles, traffic, the control system, overworld PSI, the story
> weave, the paperboy, the fleet) were **never built**. They are consolidated, with the new
> property-tycoon market + Sims-style home editor, into the live build prompt
> **`docs/PROMPT_S18_PROPERTY_AND_THE_LIVING_WORLD.md`** — use that file. This one is kept for
> its design detail.

# PROMPT — S16: THE LIVING WORLD (Movements 8–15)

> Paste this whole file as the next Claude Code session's opening prompt. It continues
> straight from **S15i / ADR-059** (THE WORLD, DEEPENED — all seven movements landed).
> It is written in the same law-driven, movement-sequenced style as the S15i prompt.

---

Read `docs/GAME_BIBLE.md` FULLY before doing anything — it is canon; never invent
content that contradicts it, never use placeholder/mock data for anything it defines.
Follow `docs/DECISIONS.md` conventions and APPEND every new architectural decision to it
(**next free id is ADR-060**). TypeScript strict, no `any`. Be CREATIVE and
PRODUCTION-QUALITY: every new system must feel **smooth, easy, and fun**; every NPC gets
exactly one §A11 obsession; every line is plain-spoken + kid-readable (EarthBound-flavored,
never a riddle); nothing reads like generic RPG filler. Read GAME_BIBLE §A3/§A4/§A5/§A6/
§A7/§A8/§A10/§A11/§B3/§B4 and ADR-012, ADR-020, ADR-035 (AWAKENINGS), ADR-049 through
ADR-059 FIRST.

Keep the validator + full vitest + tsc + `npm run build` GREEN at EVERY step. The baseline
you inherit is green: **tsc clean**, `npm run validate` (49 maps · map-quality 44 clear + 5
waived · pressure 47 + 2 waived · 8 quests · 41 items · 431 dialogue scripts), `npx vitest
run` **643 passing**, `npm run build` clean.

---

## WHERE YOU ARE (what S15i finished — do NOT redo)

THE WORLD, DEEPENED shipped as **ADR-050 → ADR-059** (seven movements):
- **Building forge** (050–053): a 100+ facade catalog across 13 families + 5 colossi;
  texture-true facade collision; the door re-entry cooldown; the spacing law.
- **Living-map verbs + size law** (054–055): the mega pass, `buildWoods`/`buildUnderground`/
  `placeNook`, per-area `AREA_SKINS`, the "every grown area earns its size" rule.
- **The Long Walk** (056): Otterbrook→Brickton as four foot legs with computed inter-leg
  doors, rests, presents, an escalating Ch.1.5 band, and two cutscenes.
- **Puerto Sol grows** (057): the frozen 1898 core + a 128×44 dock district (the sealed-core
  grow variant), colonial megas, a market nook, the relocated jungle gate.
- **Real quests** (058): two §A10 quests — *The Walkers' Register* (Ch.1 #5, the Long-Walk
  route quest) and *The Quiet Crate* (Ch.2 dock) — each wired through all THREE strict places
  (quests.ts + the content-validate QuestPin manifest + chapters.ts), with reward charms +
  WEAPON_ART icons + finale callers.
- **Walk-through venues** (059): a Cage Park (Brickton ⇄ cage_park ⇄ the_cage) and a Golf
  Resort (costa_estrella → golf_resort → golf_clubhouse, the round-start moved indoors), with
  new mansion/clubhouse/mural/fairway art and the **post-build-fixup re-route pattern** (freeze
  the core door literal, rewrite the live map's door — proven 3× now: docks, foot return, cage).

**Patterns you inherit and will reuse constantly:**
- **The post-build-fixup re-route** (re-route a door out of a frozen core without breaking the
  byte-identical proof). See ADR-056/059.
- **The tile+PROP-solid BFS probe** — the content-validate map-quality BFS IGNORES prop solids,
  so trees / gift-boxes / buildings / **vehicles** can soft-lock a fixture the validator calls
  reachable. ALWAYS re-prove a dense-prop or moving-prop map with a throwaway
  `tools/_probe_*.mts` (model the player foot box `{x:cx-5,y:cy-9,w:10,h:9}` over tile solidity
  + prop solid rects, excluding `ifFlag` props), then delete it.
- **The 3-way quest law** (quests.ts + the §A10 QuestPin in content-validate.ts + chapters.ts,
  pinned both directions).
- **The per-area-skins law** — every named area draws ONLY from its OWN `AREA_SKINS` slice;
  a new area registers its own roster, never reusing another's.
- **Frozen cores stay byte-identical** (`world_block.test.ts`); growth is append-only outside
  the copied core; the FNV re-pin rule (`levelkit.test.ts`) only fires for sample-routed
  generators (`buildCity/buildTown/buildVillage/buildRoute/buildWild/buildInterior/
  buildTravelScene/buildDungeon`) or a family inserted BEFORE existing ones in buildings.ts.

---

## THE VISION (the user's S16 decree — the world comes ALIVE)

Cities should **bustle**: cars, trucks, buses, bikes, and people moving on the streets;
houses with garages + driveways + parked cars; gas stations, bus stations, airports,
heliports. Every item and piece of equipment shows a real **icon** in the menu. Every area's
buildings are **sized and styled to that area's feel**. And the heroes gain a **control
system** that becomes the game's signature new toy AND a story engine:

- **JAY learns literal MIND CONTROL — of PEOPLE.** Take over a person briefly: the *driver*
  of a vehicle (then the party boards if the seats fit, and you drive), or a *guard / clerk /
  citizen* to walk them somewhere, open a gate, flip a switch, or vouch for you into a
  restricted area.
- **MILO controls MACHINES — the vehicles themselves.** No driver needed: remote-drive an
  *empty* vehicle to send it somewhere and **unlock an area** (across a weight-limited bridge,
  through a gate that only opens for a bus, etc.) even when the party can't fit; operate heavy
  machinery (an excavator clears rubble, a crane lifts, a dump truck dumps).
- **TOGETHER** they ride: Jay controls the driver + Milo keeps the machine running → the party
  piles in (seats permitting) and you drive freely around cities for fun, or as a **required
  story beat** (the mandatory drive — party in the backseat — to a place reachable no other way).
- **The COUNTER:** some characters CANNOT be controlled — bosses and the Hush's lieutenants
  wear a control-blocking **HELMET** (and certain machines are shielded against Milo). This is a
  story device: a helmeted guard forces you to find another route (a disguise, a psi gate, a
  remote-driven vehicle); a helmeted boss fight is about removing the helmet.
- **It SCALES** all game long (ADR-035 AWAKENINGS staging): small cars → trucks/buses →
  boats → planes → submarines → yachts; later you can **purchase** vehicles; the control grows
  "larger and bigger" as the heroes do.

Plus: **psi abilities become overworld keys** (EarthBound-style) — PSI Fire burns/melts an
obstacle, PSI Freeze freezes a waterfall/geyser into a path, PSI Flash reveals a hidden way —
needing NEW overworld casting animations. A **disguise/costume sneak** section. **Highway**
sections and a **plane-interior** travel scene. And a full **PAPERBOY minigame** with a prize.

**Travel model (decided):** the §A5 set-pieces (banana boat, Lucille, the night train, the
rocket) stay canon for crossing regions — the Ember-trail linearity is untouched. The
vehicle/control system is a NEW **intra-region free-roam + targeted story-gate** layer on top.

---

## CARRY EVERY PRIOR LAW FORWARD (non-negotiable)

- **FROZEN CORES** (`world_block.test.ts`) stay byte-identical; all growth is append-only,
  strictly outside the copied core (`x ≥ CW || y ≥ CH`). Two builds byte-identical; the live
  MAPS entry matches a fresh build. **Traffic/vehicles must NEVER be baked into a frozen
  core's prop array** — spawn them at runtime (a traffic system), or append them only on grown
  maps via the documented exception pattern.
- **ADR-012:** `cityViolations(map) === []` on every `settlement:'city'` map, unexempted. New
  road tiles for traffic must keep the `'RDX'` street-cell accounting intact (the sweep keys on
  it). Gas stations / bus stations / lots use existing walkable dressing; never break the
  ≥6-road-row / connector-avenue / 2-block-face minimums.
- **ADR-020 hand-art:** every new sprite (vehicles, item icons, the new buildings, the psi
  overworld FX) is REAL drawn pixmap art in the 64-color master palette — flat fills,
  deliberate marks, no scatter noise, shadows never outlined. `npm run art:check` (palette
  conformance) stays green. Never invent a sprite key not registered in `src/spritegen/index.ts`.
- **ADR-050/051/053:** buildings tower over the 16×24 hero and collide as their TRUE drawn
  footprint; keep `PLACE_MARGIN` walkable tiles between footprints; never seal a lane. Vehicles
  collide as their drawn footprint too (you can't walk through a parked truck), but a MOVING
  vehicle must never trap the player against a wall (see the traffic safety law in M10).
- **The map-quality BFS IGNORES prop solids** — re-prove EVERY map that gains vehicles,
  driveways, gas stations, or psi-gate obstacles with the tile+prop-solid probe. A moving
  vehicle that can corner the player = a soft-lock; the traffic system must guarantee a lane.
- **PLAIN-SPOKEN dialogue** (§A11): cutscene captions auto-time via `Math.max(2600, 1000+len·55)`;
  interactive dialogue is A-advanced. The Hush is never funny; sincerity is never the joke;
  faith is warm. **No chapter UI ever** (§A11.6) — area banners may show diegetic place names,
  never chapter numbers/titles.
- **FNV re-pin rule** (`levelkit.test.ts`): re-pin ONLY if you change the body of a sample-routed
  generator or insert a building FAMILY before existing ones in buildings.ts (APPEND new
  families at the end). The control system, traffic, icons, and the new venues are NOT
  sample-routed — they need no re-pin.
- **The §A10 quest law (both directions)** and the **per-area-skins law** as above.

---

## AMEND THE BIBLE FIRST (the new canon — do this in the SAME commit as each movement)

Per Appendix rule 6, every new system is canon only once it's in the Bible. Add these
(draft text — refine in the game's voice; keep §A11 tone). Each is also an ADR.

### §A4 — new core systems (append)

- **§A4.10 THE CONTROL SYSTEM (the borrowed hands).** Two complementary powers the party
  earns when it becomes three (Ch.3, on Milo's join), each staged as an AWAKENING/BUILD per
  ADR-035:
  - **JAY — VIBE PUPPET (mind control of PEOPLE).** A higher turn of his **Hypno** line
    (Hypno α already lulls to sleep; PUPPET takes the strings instead — canon-consistent
    evolution, not a wholly new ability). Tap a person in range; for a short, PP-costed window
    Jay walks/acts AS them. They snap back bewildered and unharmed — the tone is a comedic,
    apologetic *borrow* ("sorry, ma'am, you're going to parallel-park for me"), the deliberate
    OPPOSITE of the Hush, which steals free will FOREVER. Uses: drive a vehicle by controlling
    its driver; walk a guard/clerk to open a gate, flip a switch, or vouch you past a checkpoint.
  - **MILO — THE CLICKER (machine control of VEHICLES/MACHINERY).** A universal remote he
    builds (very EarthBound: a TV clicker that drives cars). Point it at an *unoccupied* machine
    and pilot it with no driver — send an empty car/truck/bus somewhere to unlock a path even
    when the party doesn't fit; run an excavator/crane/dump truck. Scales to boats, planes,
    subs, yachts as he upgrades the Clicker through the chapters.
  - **THE RIDE (combined).** Jay controls the driver + Milo keeps the machine → the party
    boards if **usable seats (= vehicle seats − 1 for the driver) ≥ party size** and you drive
    free-roam or as a scripted beat. A motorcycle (1–2 seats) fits a tiny party; a 4-seat car
    fits a party of ≤3; an SUV/van/bus fits 4–5+. If the party is too big to ride, you can STILL
    Clicker-drive the empty vehicle to a destination — that is its own puzzle layer (unlock areas
    by sending a vehicle somewhere).
  - **THE COUNTER — the DEAD-AIR HELMET.** The Hush issues its lieutenants (and certain bosses)
    a control-blocking helmet; some machines are Faraday-shielded against the Clicker. A helmeted
    target can't be Puppeted/Clickered — you must route around it (disguise, a psi gate, a
    remote vehicle) or, in a boss fight, knock the helmet off first. Introduced as a Department-
    of-Smiles prototype (Ch.1), refined by the Hush thereafter.
  - **UX law:** controllable targets are clearly highlighted; the seat-fit and range read at a
    glance; driving feels smooth on D-pad + controller; blocked (helmeted/shielded) targets show
    a clear "no signal" tell. Smooth, easy, fun — or it isn't done.
- **§A4.11 PSI IN THE WORLD (powers as keys).** Beyond battle, certain abilities are OVERWORLD
  KEYS, EarthBound-style: **PSI Fire** burns vine walls / lights furnaces / melts ice blocks;
  **PSI Freeze** freezes waterfalls, geysers, and lakes into crossable ice; **PSI Flash**
  reveals hidden paths/items; **Teleport** stays per §A4.6. Casting in the field plays a NEW
  overworld animation and the obstacle reacts. Every chapter's dungeon seeds ≥1 such gate using
  a chapter-appropriate ability; a gate is never the ONLY way the story can teach the ability
  (you learn it first, then the gate pays it off).

### §A5 — travel addendum (append, do not rewrite the set-piece table)

- The set-piece travel table is unchanged (Embers keep the journey linear). NEW: a free-roam
  **road/traffic** layer inside regions; **HIGHWAY** stretches (long driving sections) where the
  map IS the road; one **PLANE-INTERIOR** travel scene (the bus/boat-interior precedent, ADR-007,
  applied to a flight); and a late-game **fleet** (boats/planes/subs/yachts, purchasable) the
  Clicker scales into. None of these replace an Ember leg; they enrich the regions around it.

### §A6 — chapter beats (amend the relevant chapters, §A11 voice, no chapter UI)

Weave the new beats into the EXISTING chapters where they fit:
- **Ch.1 (America):** traffic debuts in Brickton; the **DISGUISE SNEAK** (don a blue blazer to
  blend with the Smilers and reach Mia in the Department of Smiles); the **PAPERBOY** minigame
  in Otterbrook/Brickton; the Department issues the first **DEAD-AIR HELMET** prototype.
- **Ch.3 (England):** the CONTROL SYSTEM UNLOCKS on Milo's join (Jay's PUPPET awakening + Milo's
  CLICKER build, §A11.2 staged). A control-the-guard beat at Wintermoor; an early **remote-drive**
  puzzle (Clicker a groundskeeper's mower/cart). A PSI gate (freeze a coolant pipe to cross).
- **Ch.5 (Minimus):** comedic scale — Puppet a Whistle Guard; Clicker a tiny parade float.
- **Ch.7 (India):** Chandrapore traffic + a **HIGHWAY** chase to the city; the **MANDATORY DRIVE**
  (control a taxi/bus to ferry the party where the train can't reach, party in the backseat); a
  palace **disguise**; **Cobra Raja wears a DEAD-AIR HELMET** (knock it off to win).
- **Ch.8 (China):** boats (Clicker the riverboat); machine puzzles with the paper guardians.
- **Ch.10 (Alaska→Hawaii→Mars):** the **PLANE-INTERIOR** travel scene (the flight to the launch);
  the **fleet** capstone (Clicker scales to the rocket-adjacent machinery); planes/subs as the
  final traversal toys.
- Seed PSI-FIRE / PSI-FREEZE / PSI-FLASH gates through the chapter dungeons (≥1 per dungeon).

### §A7/§A8 — additions

- **§A7:** helmeted enemy variants (DEAD-AIR-HELMET guards/lieutenants) as a mechanical hook
  (can't be controlled until the helmet's off). Keep the §A7 Enemy Flow Law (map tell, battle
  hook, identity drop, death line). Traffic vehicles are NOT enemies (ambiance + control
  targets), but a "road rage" hostile-vehicle set-piece is allowed (one per highway).
- **§A8:** the new vehicle roster is world props/key-items, not inventory weapons; the PAPERBOY
  prize is a real §A8 item (a charm or a sidegrade — extend the right manifest in the same
  commit); any purchasable vehicle is a key item / unlock flag, not a stat item.

### §B — technical (append to §B1/§B3)

- A **traffic system** (deterministic/seeded vehicle movement on road tiles, culled + pooled for
  60fps — §B4 perf), a **control system** (targeting, seat-fit, driving, the helmet/shield
  blocks), and an **overworld-psi** caster (FX + obstacle reactions). All data-driven, validated.
- An **ICON registry** covering EVERY `ItemKind` (the menu/inventory/equip art), validated both
  directions (every item has an icon; no orphan icons).

---

## DO THESE IN ORDER — MOVEMENTS 8–15

> Each movement is one focused arc that ships GREEN (validator + vitest + tsc + build) and ends
> with its own ADR + the matching Bible amendment. Re-prove dense/moving-prop maps with the
> tile+prop BFS. Keep frozen cores byte-identical; re-pin FNV only if a sample-routed generator
> changed. Append ADRs from **ADR-060**.

### MOVEMENT 8 — THE ICON ATLAS (every item & equipment gets a face) — do FIRST
The lowest-risk, everywhere-visible win, and it makes the menus feel finished.
- **Generalize the equippable-only `WEAPON_ART` (src/spritegen/weapons.ts) into a universal
  ITEM-ICON registry** covering ALL `ItemKind` (weapon/armor/arms/charm/food/pp/cure/battle/
  key/basket/valuable). Draw a bespoke, palette-clean 12–16px icon for every item in `ITEMS`
  that lacks one (food = the actual food; cure = the bottle/leaf/hanky; pp = the can/tea; battle
  = the firework/zapper/spark; key = the locket/ember/ticket/key; basket = the picnic basket;
  valuable = the stamps/keepsake). Reuse the existing `Pixmap` icon vocabulary.
- **Wire icons into the UI:** the Items menu, the per-hero inventory, the Equip screen
  (show the icon beside the name + in the slot), shop buy/sell rows, and battle "Goods". Make it
  crisp and readable at the menu's scale.
- **Validator (both directions):** every `ITEMS` entry has an icon row; no icon row names a
  missing item. Mirror it in a vitest like `weapons.test.ts`. (The equippable WEAPON_ART pins
  stay; this widens the law to all kinds.)
- **DONE-WHEN:** open the menu and every item/equipment shows a distinct, on-theme icon.
  Append **ADR-060**; amend §B (the icon law).

### MOVEMENT 9 — AREA-TRUE BUILDINGS (sizes + aesthetics match each area) — do SECOND
The user: "for each area ensure the building sizes match the style/aesthetic/feel."
- **Audit every area's `AREA_SKINS` slice + the hand-placed facades** against its §A5/§A6 feel,
  and fix mismatches: sleepy Otterbrook stays low + warm; Brickton towers (cool glass, the
  colossi); Puerto Sol colonial (already grown — verify the mega scale reads as a grand PORT,
  not a downtown); England foggy-academy stone; Norway giant-scale (giants' Lilleby vs. normal
  Kvisthavn); Minimus tabletop-tiny; Africa bazaar; India dense Chandrapore; China temple;
  Romania painted village; Alaska/Hawaii claustrophobic; Mars dread. For unlanded chapters,
  this is the AREA_SKINS spec the forge will wear (no maps required yet).
- **Tune `BUILDING_DIMS` + the height ladder per area** so a building's drawn size matches what
  the place should feel like (a sleepy town never towers; a metropolis does). Add per-area
  facade families if a place needs a silhouette the catalog lacks (APPEND families at the END of
  buildings.ts — never before existing ones, or you shift the litSeq/FNV pins).
- **Re-prove:** `cityViolations` clear on every city; the `art:buildings` contact sheet
  (`npm run art:buildings`) renders the refreshed catalog at hero scale; frozen cores untouched
  (this is AREA_SKINS/dims/new-families work, not core edits).
- **DONE-WHEN:** each area's buildings unmistakably belong to that area. Append **ADR-061**;
  amend §B4 (the area-size-true law).

### MOVEMENT 10 — THE VEHICLE FORGE (the roster + traffic + the new buildings) — do THIRD
The art + ambiance foundation the control system rides on. No control yet.
- **THE VEHICLE SPRITE FAMILY** (src/spritegen — a new `vehicles.ts`, registered in index.ts):
  car, motorcycle, bicycle, bus, van, race car, SUV, large SUV, modern EV ("tesla"-style),
  truck, dump truck, excavator + heavy machinery, and — for later movements — boat, yacht,
  submarine, and military/air: fighter jet, small plane, jumbo jet, blimp, helicopter. Each in
  **several seeded colors/designs** (a `RAMP`-driven palette like the building catalog), top-down/
  three-quarter to match the 16×24 overworld read, with a clear FOOTPRINT solid and a `seats`
  count in a `VEHICLE_DIMS`-style data table. Pixel-clean under ADR-020; `art:check` green.
- **THE TRAFFIC SYSTEM** (a new overworld system): vehicles spawn on `'R'/'D'` road tiles and
  drive deterministic/seeded routes as ambiance + future control targets. **Safety law:** a
  moving vehicle may NEVER corner or crush the player or seal a lane — it yields/pauses/reroutes;
  prove it with the tile+prop BFS over the road graph at several time-steps. Object-pool + cull
  for 60fps (§B4). Parked cars in lots + driveways; pedestrians for bustle (optional pooled
  wanderers).
- **THE NEW BUILDINGS + LIVING NEIGHBOURHOODS:** gas stations (+ a convenience-store interior),
  bus stations (+ interior), airports (+ interior/runway), heliports, and house **GARAGES +
  DRIVEWAYS** (a driveway tile/dressing + a parked car) so suburban blocks read lived-in. New
  area skins where a place needs them (own rosters). Wire a couple of these into grown
  Otterbrook/Brickton as a first showcase (append-only on the grown maps; cores frozen).
- **DONE-WHEN:** a city street has cars driving, a gas station, parked cars in driveways, and a
  bus station you can enter — and it FEELS alive at 60fps. tile+prop BFS clear with traffic
  moving. Append **ADR-062**; amend §A5/§B (traffic + the new building types).

### MOVEMENT 11 — THE CONTROL SYSTEM (Jay's PUPPET + Milo's CLICKER) — do FOURTH
The signature new toy. Needs M10's vehicles + traffic.
- **JAY — VIBE PUPPET (people):** target a controllable person in range (highlighted); for a
  PP-costed window you act as them — walk them, open a gate, flip a switch, vouch past a guard,
  or take a vehicle's driver's seat. They snap back unharmed (the comedic, apologetic borrow).
  Stage it as a Hypno-line AWAKENING (ADR-035) on the party hitting three (Ch.3).
- **MILO — THE CLICKER (machines):** target an unoccupied vehicle/machine; pilot it directly
  (D-pad/stick), driver-less. **Remote-drive empty vehicles to unlock areas** (weight-limited
  bridge, bus-only gate, a ferry); run heavy machinery (clear rubble, lift, dump). Stage it as a
  Milo gadget BUILD on his join.
- **THE RIDE (combined) + SEAT-FIT:** usable seats = `vehicle.seats − 1`; ride only if `≥ party
  size`. If too big, Clicker-drive empty. Driving the overworld vehicle must feel SMOOTH (accel,
  turn, collision-slide, a satisfying engine SFX) on touch + controller; the party rides as
  followers/in-cabin. Free-roam around any city for fun.
- **THE DEAD-AIR HELMET / SHIELD:** helmeted people can't be Puppeted; shielded machines can't be
  Clickered — a clear "no signal" tell. Wire the first helmet at the Department of Smiles (Ch.1),
  and helmeted enemy variants (§A7) whose helmet must come off in battle before control works.
- **Re-prove:** control targeting, seat-fit gating, remote-drive area-unlocks, and the
  helmet/shield blocks all in a vitest harness over the engine API; BFS the maps that gain
  drivable vehicles.
- **DONE-WHEN:** you can Puppet a driver, pile the party into a car, drive a city smoothly, and
  Clicker an empty truck across a bridge to open a path — and a helmeted guard cleanly refuses.
  Append **ADR-063**; amend §A4.10 to canon as built.

### MOVEMENT 12 — PSI IN THE WORLD (overworld casting + the puzzle gates) — do FIFTH
- **Overworld psi caster:** a clean field-cast UI (pick PSI Fire/Freeze/Flash from a wheel/menu)
  + NEW overworld FX animations (a flame wash, a freezing bloom, a flash) + the obstacle
  reacting (vines burn away, a waterfall becomes an ice bridge, a hidden path lights up). Casts
  cost PP and play smoothly; never battle-only again for these.
- **The gates:** seed ≥1 psi obstacle per chapter dungeon, using a chapter-appropriate ability
  and a §A11-clear sign that teaches it without explaining the joke. Each ability is LEARNED
  first (awakening/level), then the gate pays it off (never the sole teacher). Non-missable;
  retry-safe.
- **Re-prove:** each gated map with the tile+prop BFS in BOTH states (obstacle present / cleared)
  — the cleared state must open the route, the present state must not strand a required fixture
  reachable only past it (gate it so the path the story needs stays solvable).
- **DONE-WHEN:** PSI Fire burns a vine wall on the field and you walk through; PSI Freeze bridges
  a waterfall. Append **ADR-064**; amend §A4.11 to canon as built.

### MOVEMENT 13 — THE STORY WEAVE (drive, disguise, highway, plane, helmet boss) — do SIXTH
Wire the new mechanics into §A6 as REQUIRED, non-missable beats (retry law holds; §A11 voice).
- **THE DISGUISE/COSTUME SNEAK (Ch.1):** dress in a blue blazer to blend with the Smilers and
  reach Mia (a disguise meter/blow-your-cover read; getting "made" = a fight, never a fail). A
  small costume system (equip a disguise; NPCs react by your look). Reuse for later sneaks
  (palace guards Ch.7, Hoaxula's bankrupt theme park Ch.9).
- **THE MANDATORY DRIVE (Ch.7):** a story stretch where the ONLY way forward is to control a
  taxi/bus and drive the party (in the backseat) to a place the train can't reach — a real
  driving sequence, EarthBound-funny, with the party bickering in back.
- **HIGHWAY SECTIONS:** long road maps (the map IS the highway) — America and the India approach
  — with traffic, one optional "road rage" hostile-vehicle set-piece, rest stops (gas stations
  as the §A4.5-style rests).
- **THE PLANE-INTERIOR (Ch.10):** a flight scene (the bus/boat-interior precedent) — the party in
  the cabin, the land sliding by a window, a quiet character beat, then arrival.
- **THE HELMET BOSS (Ch.7):** Cobra Raja wears a DEAD-AIR HELMET — phase 1 is knocking it off so
  Puppet/Clicker (and the §A6 mechanics) come online for phase 2.
- **Re-prove:** every new beat is non-missable (post-Teleport reopen where relevant), retry-safe,
  and BFS-clean. Each adds/strengthens a finale CALLER where a person becomes more real.
- **DONE-WHEN:** the disguise gets you to Mia; the drive is the only road on; the plane scene
  lands. Append **ADR-065**; amend §A6 chapter beats to canon as built.

### MOVEMENT 14 — THE PAPERBOY (the minigame + the prize) — do SEVENTH
- A self-contained scene (the arcade/cage/golf minigame precedent — a paused-world sub-scene):
  ride the **bicycle** (from M10) down a suburban street, deliver papers to mailboxes, dodge
  obstacles (dogs, sprinklers, cars, the open car door), beat a route/score. Deterministic +
  replayable; a clean HUD; smooth controls.
- **The prize:** a real §A8 item for completion (a charm or a fun sidegrade — extend the right
  manifest in the same commit) + a finale caller (the paper-route boss / Mr. Plummer tie-in).
- Where: Otterbrook/Brickton (Ch.1), reachable from a paper-stand prop; non-missable.
- **DONE-WHEN:** you can play a full paper route and win the prize. Append **ADR-066**; amend
  §A10 (the minigame as optional long-form content) + §A8 (the prize).

### MOVEMENT 15 — THE FLEET SCALES (boats/planes/subs/yachts + purchasing) — do LAST
The capstone — needs the control system + the bigger vehicle sprites.
- **Scale the Clicker/Puppet** up the chapters (ADR-035 staging): trucks/buses (Ch.5) → boats
  (Ch.8) → planes (Ch.10) → submarines/yachts (late/NG+). Each scale-up is a staged story moment,
  not a menu unlock.
- **Purchasing:** buy vehicles (a dealership/marina/airfield) as key-item unlocks; a purchased
  vehicle is yours to summon/drive in free-roam. Tie cost to the §A9 economy ("a real refresh
  hurts").
- **Late-game traversal:** planes/subs open optional world pockets (the §A4.6 Teleport-reopen
  spirit) without breaking the Ember linearity.
- **DONE-WHEN:** you can buy and pilot a boat/plane, and the control power clearly grew with the
  party. Append **ADR-067**; amend §A4.10/§A5 to canon as built.

---

## QA (docs/QA.md pre-flight + new rows) + DONE-WHEN

- validator + full vitest + tsc + `npm run build` GREEN at EVERY movement; `art:check` green;
  frozen cores byte-identical (re-prove `world_block`); FNV re-pinned ONLY if a sample-routed
  generator changed.
- **Perf (§B4):** traffic + the control system hold 60fps overworld / ≥45fps battle on a
  mid-range Android target; prop count is the p99 lever — pool + cull vehicles; `bench-map.ts`
  caps respected (raise with reason if a busy city needs it, like ADR-049 did).
- **Every map** that gains vehicles / driveways / gas stations / psi-gate obstacles re-proven
  with the tile+prop-solid BFS (moving vehicles at several time-steps — no soft-lock, no corner-
  trap, lanes preserved).
- **The control system UX** read out loud: targeting is obvious, seat-fit is legible, driving is
  smooth on touch AND controller, helmet/shield blocks are clear. Smooth, easy, fun — the bar.
- **The §A11 read-through:** every new line plain-spoken, kid-readable, one obsession per NPC,
  the Hush never funny, Jay's Puppet a comedic *borrow* (never the Hush's theft). No chapter UI.
- **`.shots/`** of: the refreshed per-area buildings, a bustling city with traffic + a gas
  station + driveways, the control-targeting UI, an overworld PSI-Fire/Freeze cast, the disguise
  sneak, the highway, the plane interior, the paperboy route, and a piloted boat/plane. Use the
  `art:*` contact sheets or the `window.shot` pipeline — **NOT `preview_screenshot`** (it hangs
  on the WebGL canvas).
- Append ADRs ADR-060 → ADR-067 per the drift rule, amending the Bible in the SAME commit.
- Browser p99 loop + `android:apk` paths stay green.

**Build it like it ships: smooth, easy to use, fun — and unmistakably EarthBound.**
