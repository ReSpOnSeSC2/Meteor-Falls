# PROMPT — S21: LIVING-CITY SERVICES (Gas Stations + Property Market, production quality)

You are continuing work on **Meteor Falls**, a TypeScript + Phaser 3 + Vite + Capacitor
EarthBound-style RPG. Your job is to finish the "living cities" initiative to **full
production quality** — not stubs, not "minimal." Two complete, shippable systems:

1. **Gas stations** — placed and functional in every city, with a real pump/refuel UI.
2. **The property market** — purchasable (and sellable/financeable) homes, placed and
   functional in every city, with a real real-estate UI.

Plus documentation and verification. Everything must compile, pass `npm run build`
(`tsc --noEmit && npm run validate && vite build`) and `npm test` (validate + vitest),
and be playable.

---

## 0) Ground rules (read first — these are hard laws in this repo)

- **Strict TypeScript.** `tsconfig.json` has `noUnusedLocals` and `noUnusedParameters`.
  No unused imports/locals. No `any` unless unavoidable.
- **Determinism (Prime Law 2).** No `Math.random()` / `Date.now()` in `src/data/**` or
  `src/engine/**`. Use a seeded RNG (inline `mulberry32(seed)`), seeded off stable ids.
  Same save + same seed must replay byte-equal.
- **Strict schemas.** All content is validated at build time by Zod schemas in
  `src/schemas/index.ts` (`MapDefSchema`, `PropDefSchema`, `NpcDefSchema`, `SignDefSchema`,
  `DoorZoneSchema`, etc. — all `z.strictObject`, so **no extra fields**). Every map in
  `MAPS` is parsed; every door target, dialogue id, sprite, and area must resolve.
- **The validator can fail the build.** `tools/content-validate.ts` collects `fail(section, msg)`
  and `process.exit(1)` on any error. Add new laws here so regressions can't ship.
- **Saves are versioned.** Any NEW persistent state field in `GameData` (`src/engine/state.ts`)
  needs a migration + version bump in `src/engine/migrations.ts` AND a test in
  `migrations.test.ts`. Do NOT add persistent state casually.
- **Line endings:** repo is CRLF on Windows; don't fight it (git normalizes).
- **Editing big files:** `src/data/maps.ts` (~2.8k lines), `src/scenes/OverworldScene.ts`
  (~3.9k lines), `src/data/dialogue.ts` (~2k lines), `tools/content-validate.ts` (~2.7k lines)
  are large. Use targeted reads/edits; don't rewrite whole files.

---

## 1) What is ALREADY DONE (do not redo; build on it)

This session shipped the foundation. It is committed and `npm run build` is green.

- **Traffic** (`src/engine/traffic.ts` was pre-existing & tested) is now WIRED into
  `src/scenes/OverworldScene.ts`: on any outdoor `settlement` map it reads `R`/`D`/`X`
  road cells, spawns pooled `veh_<type>_<ramp>` sprites (scaled `TRAFFIC_SCALE = 1.7`,
  rotated to travel dir), lerps them on a fixed step, and they are **solid** (full-body
  collision rects folded into `collides()`), safe (the sim never takes the player's cell
  or last lane). Methods: `buildTraffic()`, `spawnTrafficSprite()`, `updateTraffic()`.
- **occupyCity** (`src/data/citylife.ts`, `src/data/citylife_text.ts`): the "alive by
  default" pass. For every `settlement` map (auto-run in `maps.ts`), ~90% of `bldg_*`
  facades get a door into a **footprint-sized** interior (homes/shops/cafes/offices/
  clinics, themed names + NPCs from EarthBound-weird pools), and the locked ~10% get a
  `cl_knock_*` knock-knock sign. `dressStreets()` sprinkles benches/cans/poles on blank
  pavement. `dialogue.ts` spreads `CITYLIFE_DIALOGUE`.
- **Living-City Law** (`src/levelkit/metrics.ts` → `livingCityViolations()`), wired into
  BOTH `tools/content-validate.ts` and `src/data/maps.test.ts`: a settlement with ≥8
  facades must be ≥75% enterable and every locked facade must answer a knock.

**Gotchas already learned (don't repeat):**
- `rug` is a **floor TILE only** (`'r'` in the grid, edge-aware), NOT a prop sprite.
  Registered interior PROP sprites: `counter`, `shelf`, `shelf_b`, `bench`, `bookshelf`.
  Referencing an unregistered sprite renders Phaser's green-diagonal **missing-texture box**.
- `DEPTH_UI` was raised to **90000** (`src/ui/windows.ts`) so dialogue/HUD always paints
  above y-based world sprites (tall buildings were covering the text box). All other UI
  depths are relative to it; the only thing above it is the 99998 screen-transition fade.
- Interiors are canon `MapDef` (NOT the `DraftMapDef` that `levelkit/interiors.ts`
  `buildInterior()` emits — that has role-tagged NPCs that fail strict schema). Build
  interiors directly as `MapDef` with real `dialogue` ids.
- Map reachability validator is **tile-based and ignores props**, so prop solids never
  affect connectivity — but a door's exit `tx/ty` (doorstep) MUST land on a walkable tile.

---

## 2) Systems that exist as DATA/ENGINE but are NOT wired into the overworld

Your two features wire these existing, unit-tested engines into the world. Do not
reinvent the math; call these.

### Fuel / stations
- `src/data/stations.ts` — `STATIONS: Record<id, StationDef>` keyed by entries like
  `otterbrook_gasngo` (area `otterbrook`), `brickton_fillup` (area `brickton`),
  `puerto_sol_bomba` (area `puerto_sol`), each with `{ id, area, kind, fuels[], priceMult,
  attendant, note }`. `kind: 'gas'|'charging'|'both'|'airfield'|'marina'`. The `note` is an
  EarthBound joke for the attendant's voice.
- `src/engine/refuel.ts` — `refuelAtStation(current, type, station) → {ok, reason, cost, newFuel}`,
  `stationPricePerUnit(station, kind)`, `sells(station, kind)`, `canRefuelHere(station, type)`,
  `chargeAtHome(current, type)`, `stationsInArea(area) → StationDef[]`, `NEEDED_FUEL_KINDS`.
- `src/engine/fuel.ts` — `fuelProfile(type) → { kind, tank, ... }`, `unitsToFill(current, type)`,
  `BASE_PRICE_PER_UNIT`, `FuelKind`, `needsFuel(type)`.

### Property / homes
- `src/data/properties.ts` — `PROPERTIES: Record<id, PropertyDef>`: `27_maple` (otterbrook),
  `brickton_walkup` (brickton), `casa_del_sol` (puerto_sol), plus forward-looking per-region
  homes/flips. Fields: `{ id, name, band, area, kind('home'|'shop'|'rental'|'flip'),
  basePrice, rent, deed('deed_<id>'), storageTier, rundown? }`. Also `LIVE_PROPERTIES`,
  `PROPERTY_KINDS`.
- `src/engine/property.ts` — `walkedPrice(def, chapter, walkSeed)`, `buyCost(...)`,
  `sellProceeds(def, chapter, walkSeed, coziness)`, `loanTarget(principal)`,
  `garnishFromDeposit(deposit, principal, paid)`, `loanCleared(...)`, `loanRemaining(...)`,
  `rentAccrued(ownedIds)`, `netWorth(NetWorthInput)`, `storageSlots(def)`. Constants:
  `LAWYER_CUT 0.1`, `GARNISH_RATE 0.25`, `LOAN_FACTOR 1.1`, `MAX_COZY_LIFT 0.5`.
- `src/engine/homeeditor.ts` (coziness/layout), `src/engine/garage.ts` (`garageCapacity(def)`,
  car titles per property), `src/data/furniture.ts` (`FURNITURE`, `FURNITURE_FUNCTIONS`).

### Game state (`src/engine/state.ts`, the `GS` singleton)
- `GS.data.cashOnHand`, `GS.data.banked` (pocket vs card; `GS.withdraw(n)`, `GS.deposit(n)`).
- `GS.data.keyItems: string[]`, `GS.addItem(itemId, heroId?)`, `GS.hasItem(id)`,
  `GS.hasKeyItem(id)` — **deeds are key-item strings** (`deed_<id>`).
- `GS.flag(name)` / `GS.setFlag(name, v)` — property flags use `owned_<id>`,
  `garnishPrincipal`, `garnishPaid`, `propWalk` (the per-save price-walk seed).
- `GS.data.garage: Record<propId, string[]>` (car TITLES parked per property),
  `GS.data.activeVehicle: string|null`, `GS.data.fuel: Record<title, units>`.
- You will need the current **chapter number** and the **property walk seed** for
  `walkedPrice`. Find the chapter accessor in `state.ts` / `data/chapters.ts` (look for a
  `chapter`/`chapterNum` getter or a `ch*_complete` flag scheme) and `propWalk` for the seed.
- **Title → vehicle type:** the refuel UI needs each owned car title's *type* to call
  `fuelProfile(type)`. Find the mapping (check `engine/garage.ts`, `data/dealership.ts`,
  and how `GS.data.fuel`/`activeVehicle` titles are formed, e.g. `title_car_<id>`). Use
  the canonical helper if one exists; otherwise add a small pure helper + test.

### Overworld UI patterns to MATCH (don't invent new UI primitives)
- `OverworldScene.atmFlow()` (≈ line 2725) is the gold-standard inline economic flow:
  `await this.dlg.say(...pages)`, `const i = await this.dlg.ask(options, { cancelIndex })`,
  `AUDIO.sfx('confirm'|'cursor')`, loop until "Done". **Mirror this** for refuel + property.
- `this.dlg.ask(options: string[], { cancelIndex?, icons? }): Promise<number>` returns the
  chosen index. `this.dlg.say(...pages: string[])` — `'@'`-prefixed page = spoken line.
- Interaction entry points live in `OverworldScene.interact()` (≈ line 1521): it probes
  NPCs (proximity), `signs`, `phones`, `atms`, `picnic`, `MAIL_DOORS`, and `lockedLines`.
  NPCs with `.shop` call `openShop(id)`. To trigger a new flow, EITHER:
  (a) add a dedicated prop-probe in `interact()` (like `atms`/`picnic`), keyed by a sprite
  (e.g. a `gas_pump` prop or a `realty_desk`), OR
  (b) give the keeper NPC a sentinel `shop` id (e.g. `__gas:<stationId>`, `__realty:<propId>`)
  and intercept it at the top of `openShop()` before it launches `ShopScene`.
  Prefer (a) for the pump (a forecourt prop you walk up to) and (b) for indoor keepers.

---

## 3) FEATURE A — Gas stations (production quality)

### Placement
- In `src/data/maps.ts` (or a new `src/data/citysvc.ts` invoked from `maps.ts`, mirroring
  how `occupyCity` is wired), place **one station per city** for every area that has a
  `STATIONS` entry — at minimum `otterbrook`, `brickton`, `puerto_sol`. Use the existing
  `STATIONS[*].area` to map station → city map.
- Build a real forecourt: a small lot (sidewalk/asphalt tiles), 1–2 **pump props** + a
  canopy/kiosk, and the **attendant NPC** (give them the `STATIONS[*].attendant` name and
  voice them with `STATIONS[*].note`). Place it on a street-adjacent open area; do NOT seal
  any lane (run the reachability sweep mentally / via the validator).
- You will need a pump sprite. Check `src/spritegen/**` for an existing pump/station sprite;
  if none, add one (e.g. `drawGasPump()` in the props area of `spritegen/tiles.ts` or a
  props module, registered via `addPixmap(scene, 'gas_pump', drawGasPump())` in
  `spritegen/index.ts`). Keep the art consistent with the existing 16px tile style.

### Refuel flow (mirror `atmFlow`)
Triggered by walking up to a pump (probe in `interact()`) or talking to the attendant:
1. Greet in the attendant's voice (use the station `note`).
2. Resolve `station = STATIONS[<id>]` for this area (`stationsInArea(area)`).
3. Enumerate the player's owned vehicles (titles from `GS.data.garage` values, plus
   `activeVehicle`), dedupe. For each: resolve its `type`, then `fuelProfile(type)` and the
   current `GS.data.fuel[title]`.
   - If none owned → flavor line ("Nice... bike. Pedal's free." etc.), exit.
4. Present a menu: each vehicle as `NAME — fuel X/▣tank (kind @ $/unit)`, plus "Done".
   Use `stationPricePerUnit(station, kind)` for the per-unit price; gray-out / refuse
   vehicles whose fuel kind this station doesn't `sells()`.
5. On pick: `const r = refuelAtStation(GS.data.fuel[title] ?? 0, type, station)`. Handle
   `r.reason`: `already_full`, `not_sold`, `human_powered`, `ok`. If `ok`, check
   `cashOnHand >= r.cost`; if not, "can't afford" line. On confirm:
   `GS.data.cashOnHand -= r.cost; GS.data.fuel[title] = r.newFuel;` SFX + result line.
6. Loop until Done. Always show running `CASH $`. EarthBound-voiced throughout (add lines
   to a new `CITYSVC_DIALOGUE` pool spread into `DIALOGUE`, same as `CITYLIFE_DIALOGUE`).
- Also support the **home charger** (`chargeAtHome`) when the player is in an OWNED home
  with an EV — wire that into the home interior (Feature B) for the cheapest electric fill.

### Validator law (build-time)
In `content-validate.ts`, add a station law: every area that any owned/ownable road vehicle
could need (i.e., each `NEEDED_FUEL_KIND`) is sold by a reachable station, AND every city
map actually PLACES its station prop + attendant. Fail otherwise. Add matching vitest cases.

---

## 4) FEATURE B — Property market (production quality)

### Placement
- For each city, place the area's `PROPERTIES` home(s) (`27_maple`, `brickton_walkup`,
  `casa_del_sol`, …) as a distinct, enterable building with a **"FOR SALE" sign** out front
  (a sign prop + `SignDef` reading the listing) and a real interior (the home you can buy).
- Add a **real-estate desk** somewhere central per city — either a realty office interior
  (a keeper NPC, sentinel `shop: '__realty'`) or a `realty_desk` prop probe — that runs the
  full buy/sell/finance UI for that area's listings. (The agency lists; the lawyer closes.)

### Buy / finance / sell flow (mirror `atmFlow`, use `engine/property.ts`)
- **Listing:** show `walkedPrice(def, chapter, GS.flag('propWalk') as number)` and the
  player's cash/banked. (Resolve `chapter` from the game's chapter accessor.)
- **Cash buy:** if `cashOnHand >= price` and not already `owned_<id>`: deduct, `setFlag('owned_<id>')`,
  `addItem('deed_<id>')` (deed is a key item). Voiced closing with the lawyer (`LAWYER_CUT`
  applies to SELLS, not buys).
- **Finance (S&L loan):** if can't pay cash, offer a loan: set `garnishPrincipal`, and let
  `garnishFromDeposit`/`loanTarget`/`loanCleared`/`loanRemaining` skim future "Dad deposits"
  (find where Dad deposits happen — phone/bank — and apply the garnish there). Show owed.
- **Sell:** via the lawyer — `sellProceeds(def, chapter, walkSeed, coziness)`; clear
  `owned_<id>`, remove the deed, credit cash. Coziness comes from `homeeditor` furniture.
- **Owned home perks:** enterable interior; a **storage footlocker** (`storageSlots(def)`
  slots, persisted per `PropertyDef` id — this is the one array-shaped property state, see
  `state.ts` comment near `garage`); the **home editor** (place furniture → coziness); the
  **home garage** (`garageCapacity`, park car titles); the **home EV charger** (`chargeAtHome`).
- **Rent:** owned `shop`/`rental` kinds accrue `rentAccrued(ownedIds)` at chapter boundaries
  into Dad's deposits — wire at the chapter-flag transition.
- **Net worth:** ensure the stats/menu page shows `netWorth(...)` (wire if missing).

### Save migration
If you add any new persistent field (e.g. a per-home storage map if not already present —
check `state.ts`; the property storage field already exists), bump the save version in
`migrations.ts`, write the migration, and add a `migrations.test.ts` case.

### Validator law
In `content-validate.ts`: every `PROPERTIES` home whose `area` is a live city must be PLACED
(a building + FOR SALE sign) and reachable, and its `deed` must be a valid key-item id. Fail
otherwise. Add vitest cases.

---

## 5) FEATURE C — Documentation

- Add ADR entries to `docs/DECISIONS.md` for: the Living-City Law + occupyCity (already
  shipped — document it retroactively), the traffic wiring, the gas-station overworld UI,
  and the property-market overworld UI.
- Add a **"Living City Law"** section to `docs/GAME_BIBLE.md`: every settlement is alive by
  default (occupyCity), has traffic, ≥1 gas station, ≥1 buyable home, no large dead pavement,
  and the build fails if a city regresses to dead. State the enforced thresholds.

---

## 6) Acceptance criteria (definition of "done")

- `npm run build` green (tsc + validate + vite). `npm test` green (validate + vitest).
- New vitest coverage: refuel math wiring, property buy/finance/sell wiring, the new
  validator laws (positive + negative controls), and any new pure helpers (title→type).
- In-game (human playtest checklist to include in the PR):
  - Each city has a visible, enterable gas station; filling a vehicle deducts the correct
    cash and tops the tank; edge cases (no car, full, can't afford, wrong fuel) are voiced.
  - Each city has a visible FOR SALE home; cash-buy and financed-buy both work; deed is
    granted; owned home is enterable with storage/garage/charger; sell returns correct cash.
  - No missing-texture boxes; no sealed lanes; dialogue never covered by buildings.
- All new content is EarthBound-voiced (surreal, deadpan, sincerity is never the joke,
  every NPC one weird obsession — see `docs/GAME_BIBLE.md` §A11).

---

## 7) Working method (important given the constraints)

- Build in **two self-contained slices**: ship Feature A (gas stations) fully, get the
  human to `npm run build` + playtest, then Feature B (property market).
- Verify pure logic with **standalone Node scripts** (replicate the function under test on
  synthetic inputs) before wiring — the engines are already unit-tested; your job is correct
  wiring + UI.
- Read the actual response shapes before coding against them (e.g. inspect `GS.data` fields,
  `STATIONS`/`PROPERTIES` entries, the chapter accessor) — match what's there, not what you
  assume.
- Keep edits surgical in the big files; never rewrite `maps.ts`/`OverworldScene.ts` wholesale.

Deliver production quality: complete flows, all edge cases handled, validated, documented,
and voiced — the same bar as the rest of this codebase.
