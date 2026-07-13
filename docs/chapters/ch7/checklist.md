# Ch.7 — The Cobra's Palace (India) — production checklist

> Production close: 2026-07-13. This file supersedes the old scaffold-promotion
> checklist. Chapter 7 is shipped; its executable contract is pinned in
> `src/data/maps_ch7.ts`, `src/data/chapters.ts`, and
> `docs/CH7_PRODUCTION_VERIFICATION.md`.

## Canon

- [x] Region/travel: India; Bert and Lucille reach the western railhead, the
      overloaded Tilak Mail completes the arrival into Chandrapore, and Lucille
      remains the safe backtracking link; Chandrapore, Monsoon Road, Night Train,
      Royal Vivarium
- [x] Target level 35; Ember 7; no party member joins
- [x] Stable maps: `chandrapore`, `monsoon_road`, `night_train`, `palace_throne`
- [x] Final dimensions: 120×88, 108×68, 48×128, 88×104
- [x] Cobra Raja: exactly **20,000 HP**, level 35, no weakness, fire resistance,
      mind immunity, two-turn party Paralysis every third turn, one 800-HP skin
      shed at 40%
- [x] Focused regular roster retained: `rickshaw_swarm`, `spice_djinn`,
      `temple_macaque`, `naga_sentry`

## World and tenancy

- [x] Chandrapore is a three-district city: Bazaar Maze, River Ghats, Cinema/Station Block
- [x] Monsoon Road is a changing water/causeway journey with shelter, branch, and rail approach
- [x] Night Train is a car-by-car theft, chase, coupling, and recovery set piece
- [x] Palace is a vivarium habitat loop with spatially separated boss and resonance spaces
- [x] `CH7_WORLD` supplies every fixed point and `CHANDRAPORE_LANDING`
- [x] Historical city order preserved: Hillcrest → unit 0; Moon Gate → unit 1;
      Civic Hall → locked; Motor Gallery → unit 2; Silver Parasol → unit 3
- [x] Four historical service roles and all city amenities preserved
- [x] 14 Chandrapore source facades, 18 live units, and no Zanzibel facade borrowing

## Story and quests

- [x] Explicit Locket stolen/recovered availability, with safe mid-heist save/load
- [x] Bazaar context precedes the heist; Monsoon Road remains locked until the
      theft beat and unlocks immediately afterward without a reload
- [x] Seven contextual runtime cuts plus intact seven-panel `ch7_journey` gallery
- [x] Boss → post-battle recovery → Heartlight → Ember 7 → completion ordering
- [x] Five one-shot restored-king reactions precede (and do not replace) the
      regional quest state machines; completion sets the Ember count to exactly 7
- [x] Exactly five regional quests: Seven Spices; The Monkey Who Stole Tuesday;
      The Last Showing; Third-Class Rules; The River Remembers
- [x] Full-bag retry safety, one reward, one caller, and persistent local footprints

## Production seams

- [x] Save migration v24, including four-map/unit coordinate recovery, vehicle bay,
      and Locket normalization
- [x] Developer profiles: arrival, city, theft, train, recovered, palace, boss,
      postBoss, complete
- [x] Fourteen original source and fourteen city-scale facade PNGs plus palace-spire prop
- [x] Existing four NPC sheets, seven panels, train, background, item art, and focused
      enemy set retained
- [x] `maps_ch7.test.ts`, story/boss/quest/migration/profile coverage, and generated editor data
- [x] `output/maps_ch7.png` generated and inspected at original resolution
- [x] Dedicated production record: `docs/CH7_PRODUCTION_VERIFICATION.md`

Release-gate results are recorded in `docs/CH7_PRODUCTION_VERIFICATION.md`. Do not
reopen the obsolete twenty-enemy or 3,200-HP scope.
