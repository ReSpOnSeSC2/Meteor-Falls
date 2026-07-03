# Interior Design Language — multi-room buildings & things to do

Guides building INTERIORS (`src/data/maps*.ts` interior MapDefs + the `occupyCity` auto-fill
in `src/data/citylife.ts`). Part of the World Overhaul program
(`docs/WORLD_OVERHAUL_HANDOFF.md`). BINDING: every interior implementer reads it first.

**The symptom this fixes:** you push open a door and it's a single square room — a rug, two
props, one ambient NPC, an exit mat, nothing to DO. Enterable ≠ inhabited.

## 0. The bar (user directive 2026-07-03)

**Every building multi-room, with real things to do — maximal EarthBound interior density.**

- **Enterable first.** `occupyCity` already grafts a furnished single-room interior onto ~90%
  of a settlement's DOORLESS `bldg_` catalog facades (it runs on EVERY map with a `settlement`
  field — Ch3–10 included). Step 1 for any city is to VERIFY that fill (bespoke regional
  facades like Ch3 `fb_*` are NOT auto-filled — they need hand-authored doors/interiors).
- **Then multi-room + purpose.** Key buildings become **front + back (or upper floor)** with a
  concrete reason to go deeper — a shop back-room, a quest room, a chest, a venue, a lore
  vault. Each multi-room building satisfies **≥1 item from the things-to-do checklist** below.
- **A single-room shell in a named building is a defect.** If the fiction says "the chemist,"
  "the pub," "the boarding house" — it earns a back room and an activity.

## 1. Hard rails

| Rail | Rule |
|---|---|
| Body box | Player ≈40×36px. Interior corridors/doorways **≥3 tiles wide**; a 2-wide door GAP is fine, a 1-wide passage is not. |
| Door law | Every interior door sits on flat frontage with a computed landing (`doorstepOf`); return doors land snug (ADR-138 farFromReturn ≤40px). Multi-room links use `indicator:'stairs'\|'door'`. Check `tools/door-audit.ts`. |
| Reachability | Every NPC, sign, chest, shop keeper, venue prop, and exit is BFS-reachable; no prop seals the path (`mapcheck`). |
| occupyCity interplay | Don't hand-author a door onto a `bldg_` catalog facade — `occupyCity` grafts those. Hand-author interiors for BESPOKE facades and story buildings only. Gate multi-room to a FRACTION of units (perf + variety). |
| Zero missables | A chest/pickup commits in the exact order: say → `GS.addItem` → **on-fail (`hands full`) return WITHOUT setting the flag** → `GS.setFlag` → toast. Never set the flag before a successful add (§B4). |
| Balance | New chest/venue rewards + shop cash feed the Fortune Arc — re-validate against the chapter's money target (`content-validate`) + `npm run balance`. |
| Palette | Furniture/venue props must be AUTHORED keys with an `AUTHORED_WORLD_PROP_DISPLAY_SIZE` anchor (props double-scale without it). |

## 2. Room vocabulary

Interiors use the `o` floor / `O` wall dungeon-palette idiom (or a themed skin). A room = a
walled rect with a 2-wide door gap; link rooms with a stairs/door zone. Precedents to copy:
the department store `buildDosF1/F2/F3` (`maps.ts`, elevator + stairs chain) for a multi-floor
building; `rex_home ↔ rex_hall ↔ rex_bedroom` for a small house; `otterbrook_cityhall` for a
hand-authored civic interior; `buildUnitInterior` (`citylife.ts:187`) for the auto-fill room.

## 3. The moves (I1–I7)

- **I1 — Front + back.** Front room: street door + an interior stairs/door zone
  `to:<id>_back`. Back room: reciprocal return door + the activity. Both are normal MapDefs →
  door-audit + reachability gate them automatically.
- **I2 — Upper floor.** Where the building is tall, a `stairs` zone up to a second MapDef
  (the dept-store pattern). Reserve for landmarks + tall facades.
- **I3 — Furniture rhythm.** Anchor the room's purpose (counter for a shop, hearth for a home,
  stacks for a library), then dress with region-true props at 60–80% density — furnished, not
  cluttered, not bare.
- **I4 — The activity.** Every multi-room building satisfies ≥1 checklist item (§4). Wire it
  with the REUSE path, not new engine code where one exists.
- **I5 — Keeper + voice.** A back room usually has one NPC with §A11 obsessive voice — a
  shopkeeper (`shop:` field), a quest-giver, or a lore-holder.
- **I6 — Venue.** Where the chapter earns it, a building IS a playable venue (arcade / court /
  karaoke). One venue prop/sign → `launchX` pattern. Karaoke is the first new venue and lights
  up game-wide via `occupyCity`'s music shells.
- **I7 — Secret room.** Optional: a flag-gated or hidden back room with a real reward (a chest,
  a rare shop, a set-cache piece).

## 4. The "things to do" checklist (each = a REUSE path, not new code)

A building/room should offer at least one; a rich one offers several:

- **Pickup / chest** — closed-box prop (`unlessFlag`) + open-box (`ifFlag`) + a sign with a
  loot id → `signBeat` grants the item (`OverworldScene.ts:4189`). (Extract to a `PICKUPS`
  data table so it's pure data.)
- **Walk-over pickup** — a `TriggerDef` rect → `questPickup` grants + sparkle + N/total toast.
- **Shop (buy/sell/equip)** — a keeper NPC `shop:` id + a `SHOPS` entry → full `ShopScene`.
- **Heal / rest** — an inn/clinic keeper or bed prop restoring HP/PP (the Mom-reset pattern).
- **Quest hook** — a giver NPC (`questTalk`) + steps + `completeQuest` reward/caller.
- **Venue / minigame** — a prop/NPC → `launchX` → scene → `mf-*-closed` (Arcade/Hoops/Links;
  new: KaraokeScene).
- **Lore / flavor anchor** — a readable sign or ambient NPC (`occupyCity` scatters these).
- **Phone / save** — a phone prop → `phoneFlow` (Call Dad saves, Call Mom heals).
- **ATM / bank** — an `atm` point → `atmFlow`.
- **Set-collection cache** — a multi-piece cache opening when N flags are set (museum_idol
  pattern).
- **Puzzle / gate** — a flag-gated or PSI-gated door with a locked-line refusal until solved.

## 5. occupyCity — extend to multi-room (the one net-new lever)

`occupyCity` (`citylife.ts:336`) doors ~90% of catalog facades into `buildUnitInterior`
single rooms + locks ~10% with knock signs. To hit "every building multi-room" at scale
without hand-authoring hundreds of rooms:

- Add an optional `back` flag per archetype in `buildUnitInterior` — when set, emit TWO
  MapDefs (front + back) with a reciprocal stairs/door zone, returned into the interiors
  record `occupyCity` already merges. Gate it to a fraction of units (variety + perf).
- Attach `shop:` ids to the auto-generated `shop`/`cafe`/`noodles` keepers (a curated generic
  stock per archetype) so auto interiors actually transact.
- These reuse the door/`doorstepOf` machinery entirely — no new engine, just a bigger
  generator. Hand-author only the story/landmark buildings on top.

## Implementer procedure

1. Read this doc + the guardrails + the building's role in the map blueprint.
2. Verify the `occupyCity` fill; hand-author only bespoke/story interiors.
3. For each multi-room building: front + back MapDefs, computed doorsteps, the activity via
   its reuse path, region-true furniture at rhythm.
4. Gate: `tsc` → `door-audit` → `validate` → the map's vitest → `render-map`; `balance` if
   rewards/shops changed.

## Review rubric

No named building is a single-room shell; multi-room links land snug (door-audit green);
every multi-room building has ≥1 real activity; furniture reads region-true at rhythm (not
bare, not cluttered); chests are zero-missable; shop stock valid; reachability green;
new rewards re-validated against the money curve.
