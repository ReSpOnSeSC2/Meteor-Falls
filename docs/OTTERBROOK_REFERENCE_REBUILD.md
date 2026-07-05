# Otterbrooke — REFERENCE-FAITHFUL rebuild spec (user-locked 2026-07-04)

*The definitive layout for a from-scratch rebuild of `growOtterbrook`, taken directly from
`assets/art/masters/world/otterbrook-CONCEPT-locked.png` + the user's explicit direction.
Supersedes the S4 elevation-merge layout (which the user rejected: "the entire layout is
completely wrong… both layout and look"). Build to THIS, not the current map.*

## Governing changes (why the current map is wrong)
1. **Proportions:** the wooded hill must be **~25%** of the map (top); the **city ~75%** (bottom).
   Current is ~37% hill / 63% town — the hill is too big and the town too cramped.
2. **Kill the rectangular grid.** Roads and routes must be **rounded and winding**, not
   right-angle straight streets + rectangular terrace bands. This is the #1 aesthetic fix.
3. **Two separate single paths up** (not the current merged/parallel trails):
   - **LEFT path → the CAVE** (far top-left). Gated by a **locked SHED** partway up: the door
     is locked; you get the **key by doing something in the city** (the existing
     `hodgkin_mower` → `has_trail_key` chain), then pass the shed → the cave mouth → the
     Titanic Tick dungeon.
   - **RIGHT path → the CRATER/meteor** (top-right). **Police patrol right below the crater**
     + a **DO NOT ENTER sign** blocks it; a **house (green cottage)** sits **~75% of the way up**
     this path.
4. **Jay + Chad's houses** on a terrace **between** the two paths (mid-hill).

## Layout, top → bottom (from the reference)
- **TOP (the hill, ~25%):**
  - far top-LEFT: the **CAVE mouth** (dark arch in the tan cliff).
  - top-RIGHT: the **CRATER** (dark scorched bowl) + the **meteor sphere** (already authored).
  - the **3 police** on the path just below the crater + a **DO NOT ENTER** sign.
  - the **green cottage** ~75% up the RIGHT path (a townsperson's house).
  - the **shed** (locked, needs the trail key) partway up the LEFT path.
  - dense **tree canopy** (the authored `tree_canopy` tile) blankets the whole slope; the two
    tan winding paths cut through it; tan **cliff** rims frame the top.
- **MID:** the terrace with **Jay's (purple) + Chad's (blue) houses**, cars, fences, gardens —
  between the two paths.
- **CITY (~75%):** winding streets (NOT a grid). Keep ALL current content, re-laid organically:
  - civic core: **City Hall** (columns) + **fountain plaza**, **Hospital** (red cross), **Drugstore**.
  - main drag: **BURGER, BANK, BAKERY, ARCADE**, **POLICE station** (right), the **Bus Depot**, downtown mouth.
  - **residential** blocks (varied houses + fences + yards).
  - **Pond Park** bottom-LEFT (Heart Oak, duck pond, gazebo, playground).
  - **"OTTERBROOKE, OH"** sign (right, by the road out east → meadow_mile).
  - **FOR SALE** lots (2: one mid-left, one bottom-left by the pond) = the 27-Maple hook.

## Mechanics to preserve/wire
- Opening cinematic (meteor fall at the crater → house → climb → bedroom wake).
- The **locked-shed key gate** on the cave path (`hodgkin_mower`/`has_trail_key`) — the trail key
  is earned in the city, then opens the shed → the cave (Titanic Tick, HP 200, `oak_roots` chain).
- The **DO NOT ENTER** + police below the crater (the crater is the story set-piece, guarded).
- All Ch.1 story beats re-homed (Biscuit, mail, Chad, Borden, twins, presents, daybreak gate).
- Elevation law (K cliff / ^ lip / T stair per-cell), reachability, door-audit must stay green.

## Build stages (each gated: tsc · validate · maps_otterbrook.test · screenshot)
1. **Skeleton:** new 126×~176 grid — hill top ~25% (44 rows) + city ~75% (132 rows, TB=44).
   Two winding paths (windV) — LEFT to the cave, RIGHT to the crater — through canopy; the
   terrace with Jay/Chad between them. Re-point all offset-coupled coords (TB, EAST_GATE,
   rex_home exit, oak_roots return, MAP_REFLECT).
2. **Hill set-pieces:** cave mouth (top-left) + locked shed on the left path; crater + meteor
   (top-right) + police + DO NOT ENTER + green cottage on the right path.
3. **Winding city:** re-lay the town's roads as rounded/curved routes (retire the rigid
   hStreet/vStreet grid); place the civic core, main drag, residential, Pond Park, signs, FOR SALE.
4. **Re-home content + wire:** all NPCs/quests/spawners/triggers; the shed key gate; the opening.
5. **Polish:** canopy density, cliff art, tile skins; live-verify by WALKING both paths + the city.
