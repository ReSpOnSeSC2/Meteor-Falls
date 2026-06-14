# PKG-07 — All vehicles & held weapons/charms

## A. Vehicles (~25)
Multi-view sprites (`carViews` / `drawVehicleViews` in `src/spritegen/vehicles.ts`).
Path `assets/art/vehicles/<id>.png`.
- **Dealership road cars — 14:** ids in `src/data/dealership.ts` (the NEW-CAR
  SMELL lists them by chapter band).
- **Travel set-piece craft — ~8:** banana boat, biplane "Lucille", night train,
  riverboat + yak express, Orient Less-Express, snowcat, Pemberton's rocket
  "The Long Shot" (`travel` field per chapter in `src/data/chapters.ts`).
- **Boats / llama** and any region ferries (`src/data/fleet.ts`).

Each vehicle needs its overworld facing views; the travel craft also appear in
their chapter's entry cutscene (those panels are PKG-01).

## B. Held weapons & charms (~90)
The hand art drawn onto the battle-stage battler. Source of truth: `WEAPON_ART`
in `src/spritegen/weapons.ts` (classes: bat, pan, rifle, beads, fist + dozens of
accessory charms). Path `assets/art/weapons/<key>.png`.

## Acceptance
All dealership + travel craft + the full WEAPON_ART catalog present and wired.
