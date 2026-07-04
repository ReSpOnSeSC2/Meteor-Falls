# Otterbrooke, OH — Interior Build Manifest

*Definitive spec for the interiors of every placed building in Otterbrooke. Merges the four group deliverables (SHOPS · CIVIC-SERVICES · RESIDENCES · SPECIAL-AND-FURNITURE) into one buildable plan.*

---

## 1. Intro & governing laws

The user requires that **every placed Otterbrooke building has a detailed, unique interior that matches its purpose**, and that **many buildings are multi-room**. The 19 exterior facades are already authored + wired; this manifest designs what is behind each door.

**Concept lock:** Otterbrooke, OH is the EarthBound/Onett-style Ch.1 hometown. Interiors are cozy, small-town, lived-in, EarthBound-flat palette. No procedural sprite generation — all new fixtures are AUTHORED PNGs via the ChatGPT → PNG pipeline (`docs/ART_PIPELINE.md`).

**Build methods (two, both already in the codebase):**
- **`buildInterior({template})`** (`src/levelkit/interiors.ts`) — templates `home/shop/hospital/civic/deli/chapel/hotel`. Used only where a stock dress is acceptable. Small rooms auto-grow to 16×11 via `ROOMY_INTERIORS` + `growInterior` (`maps.ts` ~4253/4426).
- **Hand-authored `MapDef`s** — the shipped bespoke pattern (`buildRexHome`/`buildDrugstoreInt`/`buildDinerInt`/`buildOtterClinicInt`). **Every building below is hand-authored** because each wants unique dress; the templates can't express council seating, wards, cells, grill lines, or vaults.

**Multi-room = the LINKED-maps pattern** (confirmed `maps.ts` ~2036–2206, `rex_home ↔ rex_hall ↔ rex_bedroom/ana_room/vivi_room`): separate `MapDef` entries joined by `doors[]` zones, each with its own grid, `interior:true`, and an exit door back down. This is preferred over the one-big-grid-zoned pattern (`bus_depot_int`) for any building where a room needs its own scale, music, or crowd.

**Door law (confirmed from shipped interiors + S11b):**
- A `door:{ x,y,w,h,to,tx,ty,facing,indicator }` zone. Bottom-center 2-wide exit → `facing:'down'`, `indicator:'mat'`.
- **Through the TOP wall (interior→interior) → `indicator:'door'`** (S11b void law). Stairs → `indicator:'stairs'`.
- Every LINKED door is **reciprocated** by the other room's `to`+`tx`/`ty`.
- **ADR-138 re-aim pass** snugs inbound landings — aim each `tx`/`ty` at the tile **interior** (+8/+12 px), never at the wall, or `doorAudit` flags a spawn-in-wall.

**Save law:** every shop/civic building carries a **SAVE payphone** — prop `{sprite:'payphone', solid:{ox:1,oy:10,w:14,h:16}}` **plus** a matching `phones:[{x,y}]` row. ATM is optional (`atm` prop + `atms:[]`). Residences carry a save phone too (lobby/back-left corner). Two genuine gaps to close: **the Otterbrook ARCADE and POLICE STATION currently have NO payphone** — both must gain one.

**Registration & gates:** each new map → `MAPS` + `MAP_AREA` (Otterbrooke). Single-room interiors → append id to `ROOMY_INTERIORS` (~4426) for the 16×11 grow. Every new `prop_*` → **both** `WORLD_PROP_KEYS` (`authored.ts` ~534) **and** `AUTHORED_WORLD_PROP_DISPLAY_SIZE` (~800) or it double-scales. Must pass `npm run validate` + `doorAudit` (`mapcheck.ts` ~604).

**Coordinate conventions (shipped):** edges `'W'` wall, floor `'w'` wood (`'o'` office / `'a'` arcade), rug `'r'`. Partition = a `g.rect(...,'W')` band with one tile re-set to floor as the doorway.

**Grounding anchors (verified this pass):** `buildOtterbrookCityHallInt` `maps.ts:1030` · `buildOtterStationInt` :1092 · `buildRexHome` :2036 · `buildDrugstoreInt` :3257 · `buildBusDepotInt` :3339 · `buildDinerInt` :3492 · `buildOtterClinicInt` :3535 · `buildArcadeInt` :3656 · `MAPS` table :4390+ · `ROOMY_INTERIORS` ~4426. Props: `authored.ts` `WORLD_PROP_KEYS` ~534, `AUTHORED_WORLD_PROP_DISPLAY_SIZE` ~800.

---

## 2. Per-building interior specs

Legend: **[UPGRADE]** = an existing interior we enrich in place · **[NEW]** = a new `MapDef` · furniture keys in `code` are REUSE unless flagged **AUTHOR**.

### SHOPS

#### 2.1 Drugstore — facade `drugstore`
| | |
|---|---|
| Interior map ids | `drugstore_int` **[UPGRADE]** + `drugstore_pharmacy` **[NEW]** |
| Rooms | 2 — A: retail floor (grow 13×9 → 16×11); B: prescription/back-stock (12×9) |
| Build | Hand-authored, LINKED. Keep the wired NPCs (`drug_clerk` shop=`drugstore`, `deli_otter` Family Basket, `biscuit_drug` dog quest) + `sign_drug_wall` — do not break those hooks |

- **Room A — `drugstore_int` (retail):** REUSE `counter`×2 (register), `shelf`/`shelf_b`×4 (pharmacy/first-aid/candy aisles, relabel via signs), `cola_fridge` (soda feed), existing `payphone` **SAVE** (x2,y7) + `atm` (x10,y7). AUTHOR **`prop_soda_fountain`** (chrome fountain counter + syrup taps + swivel stools) at the lunch-counter, back-of-floor x8,y2–3.
  - Door to pharmacy (top wall): `{x:11,y:2,w:1,h:1,to:'drugstore_pharmacy',tx:48,ty:64,facing:'down',indicator:'door'}`.
  - Exit (bottom): reciprocates facade `door:{...to:'drugstore_int'}`.
- **Room B — `drugstore_pharmacy` (12×9, `music:'home'`):** REUSE `counter`×2 (raised Rx counter), `shelf`/`shelf_b`×4 (pill/inventory racks), `desk`, `plant_pot`. AUTHOR (nice-to-have) **`prop_pharmacy_rack`** (amber-bottle apothecary cabinet); fallback `shelf_b`. Keeper **`pharmacist`** at the Rx counter (`dialogue:'npc_pharmacist'`; sprite reuse `drugClerk` or new). Natural home for a status-cure/antidote sub-shop. No 2nd payphone (A has SAVE). Exit `{x:5,y:8,w:2,h:1,to:'drugstore_int',tx:184,ty:64,facing:'down',indicator:'mat'}`.

#### 2.2 Bakery — facade `bldg_ob_bakery`
| | |
|---|---|
| Interior map ids | `bakery_int` **[NEW]** + `bakery_kitchen` **[NEW]** |
| Rooms | 2 — A: front shop (14×10); B: back-of-house kitchen (13×9) |
| Build | Hand-authored, LINKED. Facade needs `door:{...to:'bakery_int',tx:120,ty:128}` wired |

- **Room A — `bakery_int`:** REUSE `counter`×2 (register/service), `prop_pie_case`×2 (glass display — reads as pastry), `shelf`/`shelf_b` (bread racks), `plant_pot`, `payphone` **SAVE** (x2,y8). AUTHOR **`prop_pastry_case`** (tiered frosted-cake case; fallback `prop_pie_case`). Keeper **`baker`** at counter (`dialogue:'npc_baker'`, `shop:'bakery'` if it vends food). Door to kitchen (top): `{x:11,y:2,...to:'bakery_kitchen',indicator:'door'}`.
- **Room B — `bakery_kitchen` (`music:'home'`):** REUSE `stove`×2 (ovens, wall band), `counter`×2–3 (prep), `shelf` (flour/supply). AUTHOR **`prop_brick_oven`** (domed brick oven w/ fire glow — hero), **`prop_flour_bins`** (scoop-topped bins), **`prop_mixing_station`** (floured worktable + stand mixer). `stove` is interim fallback. NPC **`baker_asst`** kneading (idle). Exit `{x:5,y:8,...to:'bakery_int',indicator:'mat'}`.

#### 2.3 Burger Joint — facade `bldg_ob_burger`
| | |
|---|---|
| Interior map ids | `burger_int` **[NEW]** + `burger_kitchen` **[NEW]** |
| Rooms | 2 — A: diner floor (16×11); B: grill line (13×9) |
| Build | Hand-authored, LINKED. Model on `buildDinerInt` but distinct (this is a burger counter, not Sunny Side sit-down). Wire facade `door:{...to:'burger_int'}` |

- **Room A — `burger_int`:** REUSE `prop_counter_stools` (burger counter), `prop_booth`×3 (walls), `prop_jukebox` (NE), `cola_fridge` (back), `menu_board` (back wall), `payphone` **SAVE** (x2,y8). AUTHOR **`prop_burger_counter`** (griddle-side counter + squeeze bottles + shake machine; fallback `prop_counter_stools`+`menu_board`). Keeper **`burger_cook`** (`dialogue:'npc_burger_cook'`, `shop:'burger'`). Door to kitchen (top): `{x:13,y:2,...to:'burger_kitchen',indicator:'door'}`.
- **Room B — `burger_kitchen` (`music:'home'`):** REUSE `stove` (grill stand-in), `counter`×2 (prep), `shelf` (dry-stock), `freezer_case` (patty freezer). AUTHOR **`prop_flat_grill`** (sizzling flat-top + patties — hero), **`prop_deep_fryer`** (twin baskets), **`prop_range_hood`** (stainless hood on wall band). `stove`+`freezer_case` fallbacks. NPC **`fry_cook`** (idle). Exit `{x:5,y:8,...to:'burger_int',indicator:'mat'}`.

#### 2.4 Bank — facade `bldg_bank`
| | |
|---|---|
| Interior map ids | `bank_int` **[NEW]** + `bank_vault` **[NEW]** |
| Rooms | 2 — A: teller hall (16×11); B: vault (12×9) |
| Build | Hand-authored, LINKED. Money-axis anchor — lean into the Fortune Arc. Wire facade `door:{...to:'bank_int'}` |

- **Room A — `bank_int`:** REUSE `counter`×3 (teller line), `prop_ticket_window`×2 (barred windows), `desk`+chair (loan-officer nook), `prop_waiting_bench`/`bench`×2, `plant_pot`×2 (entrance), `payphone` **SAVE** (x2,y9), **`atm`×2** prominent (x13,y9 + x14,y9) + `atms:[{x:13,y:9},{x:14,y:9}]`. AUTHOR **`prop_teller_grille`** (brass-barred cage window — defining look; fallback `prop_ticket_window`), **`prop_velvet_rope`** (stanchion+rope queue), **`prop_rate_board`** (interest/exchange board — Fortune-Arc flavor). Keeper **`teller`** (`dialogue:'npc_bank_teller'`); optional **`bank_manager`** at desk (`dialogue:'npc_bank_manager'`; hook for a savings/loan mechanic tied to `fortune.ts`). Door to vault (top): `{x:13,y:2,...to:'bank_vault',indicator:'door'}` (optionally gate behind a manager flag).
- **Room B — `bank_vault` (`music:'home'`):** REUSE `shelf`/`shelf_b`×4 (safe-deposit walls), small `counter` (inspection table), `plant_pot`. AUTHOR **`prop_vault_door`** (round spoked steel door — hero, at top wall by entry), **`prop_deposit_boxes`** (numbered brass box grid), **`prop_gold_stack`** (cash/gold bricks — net-worth easter egg). `shelf` fallback. Optional **`vault_guard`** (idle). Exit `{x:5,y:8,...to:'bank_int',indicator:'mat'}`.

#### 2.5 Arcade — facade `arcade`
| | |
|---|---|
| Interior map ids | `arcade_int` **[UPGRADE]**, single room |
| Rooms | 1 — STARPORT arcade floor (grow 11×8 → ~14×10) |
| Build | Hand-authored upgrade. Keep single-room (Onett-faithful; the "big" arcade is STARPORT II in Brickton). Keep the famous LEGEND gap |

- REUSE all present: `cab_a`/`cab_b`/`cab_c` + LEGEND gap at x6.2 (keep `arcade_gap` sign), `cola_fridge`, `counter` (prize desk), the `*` carpet sparkles, all six cab signs. Add a **second row** of `cab_a/b/c` (south wall / center) to fill the grown room. Leave the Legend gap (Legend moved to Brickton) — drop a different filler cab beside it. Turn the bare `counter` into a real prize desk with `shelf`/`shelf_b` behind it as a prize wall; add keeper **`arcade_attendant`** (promote `arcade_counter_note` → spoken `npc_arcade_attendant`). Add `plant_pot` + `trash_can` for dressing.
- **CLOSE THE SAVE GAP:** add `payphone` **SAVE** (x2,y7) + `phones:[{x:2,y:7}]` — the arcade has none today. Optional `atm`.
- AUTHOR **`prop_change_machine`** (coin/token CHANGE machine — task-called-out; side wall), **`prop_prize_wall`** (pegged plush/trinket redemption wall behind counter; fallback `shelf_b`), optional **`prop_ticket_muncher`** (skee-ball redemption cab; fallback another `cab_*`).

### CIVIC-SERVICES

#### 2.6 City Hall — facade `bldg_ob_city_hall`
| | |
|---|---|
| Interior map ids | `otterbrook_cityhall` **[UPGRADE]** + `otterbrook_council` **[NEW]** |
| Rooms | 4 across 2 maps — A(one 26×16 grid, 3 zones): records W / lobby C / mayor E; B: council chamber (20×14) |
| Build | Hand-authored. Keep the 3-zone lobby grid; PROMOTE the council chamber to a LINKED second map (theater seating too tall/wide for the lobby grid) |

- **Room A — `otterbrook_cityhall`:** keep geometry + props (`counter`×2 clerk, `payphone` **SAVE** + `phones:[{x:10,y:12}]`, `prop_waiting_bench`, `planter`, `shelf_b`×4 records, `copier`, `crate`×2, `desk` mayor, `flagpole`, `floor_lamp`). Keep NPCs `hall_clerk` (fernLady, save keeper) + `mayor_otter` (oldTimer). Edits: carve a 2-wide gap in the back wall (`g.rect(0,0,26,2,'W')` cols 12–13) + council door `{x:12,y:1,w:2,h:1,to:'otterbrook_council',...,facing:'up',indicator:'door'}`, flanked by `flagpole` + AUTHOR **`civic_directory_board`** ("RECORDS ← · COUNCIL ↑ · MAYOR →"). Reinforce the "built this year" beat: add `poster_chart` (budget chart) + one zoning `crate`; AUTHOR **`ballot_box`** (padlocked wooden box) in the mayor corner. Keep bottom exit `{x:12,y:15}` → `otterbrook`.
- **Room B — `otterbrook_council` (20×14, `music:'home'`):** raised podium + dais (3-wide `'r'` rug band rows 2–3 cols 8–11), two `bench` pew blocks (left cols 2–6, right cols 13–17, rows 5/7/9/11) with a center aisle (cols 9–10) — the chapel-template pew idiom. AUTHOR **`council_podium`** (lectern + mic + town seal, solid) center (9.5,3); flank with two `flagpole` (US+Ohio) + `chalk_board` behind ("AGENDA / BUILT THIS YEAR"). NPC `councilmember` (reuse `oldTimer`/`fernLady`) front-row carrying the civic line; mayor may appear `ifFlag` a session flag. No save (`phones:[]`). Exit `{x:9,y:13,w:2,h:1,to:'otterbrook_cityhall',...,facing:'down',indicator:'mat'}` reciprocating A.

#### 2.7 Clinic / Hospital — facade `bldg_ob_clinic`
| | |
|---|---|
| Interior map ids | `otter_clinic_int` **[UPGRADE]** + `otter_clinic_exam` (existing) + `otter_clinic_ward` **[NEW]** |
| Rooms | 3 — A: waiting/reception (14×10); B: exam (12×9); C: ward (16×10) |
| Build | Hand-authored, LINKED. Reception branches to BOTH exam and ward (two top-edge doors) |

- **Room A — `otter_clinic_int` (upgrade):** REUSE `counter`×2 (front desk, keeper `doc_otter`=docBrickton), swap bare `bench` → `prop_waitingchairs` + `prop_waiting_bench`, add `prop_vending` + `water_cooler`, `poster_chart` (eye/vaccination), keep `plant_pot`. `payphone` **SAVE** (12,7) + `phones:[{x:12,y:7}]`. Doors: keep bottom exit `{x:6,y:9}` → `downtown_otterbrook`; keep top-edge back door `{x:11,y:2}` → `otter_clinic_exam` (`indicator:'door'`); **ADD** top-edge door cols 2–3 → `otter_clinic_ward` (`indicator:'door'`).
- **Room B — `otter_clinic_exam` (keep 12×9):** keep two `cot`, `water_cooler`, `poster_chart`, `pajamaKid` patient. Add AUTHOR **`privacy_curtain`** (ceiling-rail curtain) between the cots. Keep door back to `otter_clinic_int`.
- **Room C — `otter_clinic_ward` (16×10, `music:'home'`):** 3× `prop_wardbed` along back wall (cols 3/7/11), each with AUTHOR **`iv_stand`** (wheeled drip pole) + AUTHOR **`privacy_curtain`** rail between bays (author curtain once, shared with B). Keeper `nurse` (reuse hospital nurse sprite); one recovering patient (reuse `pajamaKid`/`oldTimer`, idle in bed). Dressing: `water_cooler`, `plant_pot`, `poster_chart` (vitals), `floor_lamp`. No save (`phones:[]`). Exit bottom `{...to:'otter_clinic_int',...,indicator:'mat'}` reciprocating A's ward door.

#### 2.8 Police Station — facade `facade_otter_station`
| | |
|---|---|
| Interior map ids | `otter_station` **[UPGRADE]** — single grid, multi-zone |
| Rooms | 3 zones in one 24×16 grid — booking/bullpen W · holding cell top-C · east wing (Borden office + evidence) |
| Build | Hand-authored upgrade. **No new map ids.** |

- **⚠ CRITICAL — preserve the ADR-118 Borden beat byte-for-byte:** the holding-cell geometry is byte-locked (`OTTER_CELL`; Borden-march spawn native 200,56; west wall col 10 rows 2–6, front rail row 6 cols 11–15, barred gap at 13,6, east wall col 16 rows 2–6, `cot` at 11,2). Do NOT move any of those tiles or the `cot`; keep `borden_cell` NPC with `ifFlag:'borden_marching' unlessFlag:'borden_cleared'` unchanged. The `bordenCellBeat` runner (`OverworldScene`) depends on this map id + spawn.
- **Zone 1 — booking/bullpen (W):** keep `counter`×2 (booking), `shelf_b` (case files), `prop_waiting_bench`, `water_cooler`, `planter`. Add sheriff's `desk` + `floor_lamp`. AUTHOR **`wanted_board`** (cork board + pinned mugshots, W wall — more on-theme than the wing's `chalk_board`) and **`gun_rack`** (locked long-arm wall rack, solid). **CLOSE THE SAVE GAP:** add `payphone` **SAVE** ~(8,12) clear of the cell + `phones:[{x:8,y:12}]` — the station has none today.
- **Zone 2 — holding cell (top-C, BYTE-STABLE):** keep barred front + `cot`. Optionally AUTHOR **`cell_bars`** (vertical iron-bar panel) as a **NON-solid overlay** on the front rail (cols 11–15) so the cell READS as barred without shifting the Borden spawn or blocking the 13,6 gap. If any risk to the locked spawn, skip the prop (wall tiles already collide). The existing `holding_door`/`holding_door_1..3` keys can supply a swinging gate at 13,6 if wanted.
- **Zone 3 — east wing (Borden office + evidence locker):** keep `desk` (the book), `chalk_board` (case board), `floor_lamp`; `prop_lockbox_counter`, `shelf_b`, `crate`×2 (bagged evidence). AUTHOR **`evidence_locker`** (numbered steel locker wall, solid) behind the lockbox counter. Optional desk-`sergeant` NPC (reuse townsfolk) as the everyday keeper.
- Keep bottom exit `{x:11,y:15}` → `otterbrook`.

### RESIDENCES

> **Kitchen reality:** there is NO authored `fridge`/`sink`/`dining_table` yet — shipped homes fake a kitchen with **`stove` + `counter`** (rex_home). Reuse that everywhere; the fridge/table below are AUTHOR-flagged with clean fallbacks. All residences use `music:'home'`; single-room ids append to `ROOMY_INTERIORS`.

#### 2.9 Hero's House — facade `house_rex`
| | |
|---|---|
| Interior map ids | `rex_home` ↔ `rex_hall` ↔ `rex_bedroom`/`ana_room`/`vivi_room` **[UPGRADE — do not rebuild]** |
| Rooms | 5 (already the multi-room gold standard) |
| Build | Keep. Light upgrade only |

- Add AUTHOR **`fridge`** beside the stove (~x12.5,y0.5) + AUTHOR **`dining_table`** (~x4,y6) to make the eat-in kitchen legible; fallback `phone_table`+`bench` nook. Keep mom NPC, phone-save (x1,y2), twins' gift-box beats. This house is the template all others echo.

#### 2.10 Chad's House — facade `house_chad`
| | |
|---|---|
| Interior map ids | `chad_home` **[NEW]** + `chad_bedroom` **[NEW]** (+ optional `chad_hall` if 2-story) |
| Rooms | 2–3 — A: living+kitchenette (14×10); C: bedroom (9×8) |
| Build | Hand-authored, LINKED (mirror `buildRexHome`/bedroom). Fold the kitchen into Room A (map-count discipline) |

- **Room A — `chad_home`:** REUSE `sofa` (x2,y4), `tv` (x2.8,y0.6), `bookshelf` (x7.5,y0), `floor_lamp`, `plant_pot`, rug; kitchenette `counter`×2 (x10–11,y3) + `stove` (x12,y0.5) (+ `fridge` AUTHOR if available). AUTHOR **`trophy_shelf`** (little-league + bug-catching trophies — Chad's beat) back wall x10,y0. Keeper `chad_mom` (or Chad pre-adventure) x9,y5. `payphone` **SAVE** (x1,y2) + `phones:[{x:1,y:2}]`. Exit `mat` down → facade; `stairs`/top-`door` → bedroom.
- **Room C — `chad_bedroom`:** REUSE `bed` (x1,y2), `desk` (x5,y2), `dresser` (x7,y0.3), a wall `sign` (sports poster, no new art), optional gift-box beat. Door `mat` down back.

#### 2.11 Green Cottage — facade `bldg_ob_house_green`
| | |
|---|---|
| Interior map ids | `house_green_int` **[NEW]** — 1 room |
| Rooms | 1 — cozy retiree studio (14×10 → grow 16×11) |
| Build | Hand-authored (home template too sparse). Add to `ROOMY_INTERIORS` |

- REUSE `sofa` (x2,y4) + `floor_lamp`, `bookshelf` (x0,y0), `plant_pot`×2 (plant-filled cottage), kitchenette `counter` (x10,y3) + `stove` (x12,y0.5), `bed` tucked back-right (x11,y1.5, studio). AUTHOR **`rocking_chair`** (wooden rocker + quilt — signature) x8,y5; fallback `sofa`. Keeper `cottage_gran` (`dialogue:'npc_cottage_gran'`). `payphone` **SAVE** (x1,y2) + `phones:[{x:1,y:2}]`. Single `mat` exit down → facade.

#### 2.12 Tract Houses — facades `house_a` · `house_b` · `bldg_ob_house_c` · `bldg_ob_cottage`
| | |
|---|---|
| Interior map ids | `tract_home_a` **[NEW]** · `tract_home_b` **[NEW]** · `tract_home_c` + `tract_bed_c` **[NEW]** |
| Rooms | 3 built layouts serve 4 facades — T1 living+kitchen (14×10); T2 mirror of T1; T3 living(12×9)+bedroom(9×8) |
| Build | Hand-authored. **All existing furniture — no new art.** Felt variety via NPC/sign/mirroring |

- **T1 `tract_home_a`:** `sofa` (x2,y4), `tv` (x2.8,y0.6), `bookshelf` (x7.5,y0), kitchenette `counter` (x10,y3)+`stove` (x12,y0.5), `plant_pot`, rug; keeper `resident_a`, `payphone` **SAVE** (x1,y2), `mat` exit.
- **T2 `tract_home_b`:** T1 **mirrored** (kitchen LEFT / sofa RIGHT) so back-to-back houses differ; different keeper sprite + wall-`sign` text.
- **T3 `tract_home_c`** (living 12×9) → top-`door` → `tract_bed_c` (9×8: `bed`+`desk`+`dresser`) — the family-with-kid variant.
- **Wiring:** `house_a`→`tract_home_a` · `house_b`→`tract_home_b` · `bldg_ob_house_c`→`tract_home_c` · `bldg_ob_cottage`→`tract_home_a` (reuse T1, swap keeper NPC + sign + rug recolor). 4 doors, 3 built layouts, no per-house bloat. Add built ids to `ROOMY_INTERIORS`.

#### 2.13 Apartment Blocks — facades `bldg_apartments` · `bldg_ob_apt_green` · `bldg_brickmore`
| | |
|---|---|
| Interior map ids | `apt_lobby` **[NEW]** (cloned per block — see wiring) + `apt_unit_studio` **[NEW]** + `apt_unit_1bed` + `apt_bed_1` **[NEW]** |
| Rooms | shared lobby/stairwell (16×9) + studio unit (12×9) + 1-bed unit (living 12×9 + bedroom 9×8) |
| Build | Hand-authored, LINKED (mirrors `rex_hall`→bedrooms) |

- **`apt_lobby` (16×9):** REUSE `lobby_desk` (x2,y3), `plant_pot`, `bench` (x13,y4), `floor_lamp`. AUTHOR **`mailboxes`** (brass mailbox bank) back wall x6,y0; fallback `shelf_b`. Keeper `apt_super` at desk. `payphone` **SAVE** (x1,y7 — classic lobby phone) + `phones:[{x:1,y:7}]`. Doors: `mat` exit down (parameterized `to`/`tx`/`ty` per facade); TWO top-`door`s → `apt_unit_studio` (x4,y2) + `apt_unit_1bed` (x11,y2).
- **`apt_unit_studio` (12×9):** `bed` (x1,y2), `sofa` (x5,y4), `tv`, kitchenette `counter` (x9,y3)+`stove` (x11,y0.5), `dresser`, rug; resident NPC; no phone (lobby save). Door `mat` down → lobby.
- **`apt_unit_1bed`:** living (12×9: `sofa`+`tv`+`bookshelf`+kitchenette) → top-`door` → `apt_bed_1` (9×8: `bed`+`desk`+`dresser`); different resident sprite. `mat` down → lobby.
- **Lobby-per-block wiring:** clone the lobby 3× (`apt_lobby_a`/`_green`/`_brickmore`) with distinct exit `to`/`tx`/`ty`, matching how `buildDrugstoreInt(streetExit)` parameterizes the exit — simpler than a return-flag. Add lobby + unit ids to `ROOMY_INTERIORS`.

### SPECIAL

#### 2.14 Pemberton's Workshop — facade `bldg_ob_workshop`
| | |
|---|---|
| Interior map ids | `workshop_int` **[NEW]** + `workshop_nook` **[NEW]** |
| Rooms | 2 — A: main lab (18×12); B: living nook (10×8) |
| Build | Hand-authored, LINKED (`buildWorkshopInt` + `buildWorkshopNook`). Too many bespoke fixtures for a template |

- **⚠ Facade door not yet wired:** `bldg_ob_workshop` is in `BASE_FACADE_KEYS` but has NO overworld `door:` prop. The implementer must add `door:{ox,oy,w,h,to:'workshop_int',tx,ty}` to the placed facade AND the reciprocal exit in `workshop_int`, or `doorAudit` fails.
- **Room A — `workshop_int` (garage lab):** REUSE `prop_pegboard_wall`×2 (top band, hanging tools), `prop_tool_shelf`×2 (parts), `prop_lockbox_counter` (blueprint counter, x15,y9), `shelf`+`shelf_b` (spare parts), `crate`×3 (scrap), `desk` (drafting, x9,y2), `floor_lamp`. AUTHOR **`prop_rocket_fuselage`** (half-built rocket on a cradle, ~5-tile floor centerpiece, solid, x6,y4), **`prop_workbench`** (vise + tools + spark), **`prop_blueprint_table`** (slanted drafting table, pinned schematics — treasure hint), optional **`prop_parts_bin`**. Treasure beat: `gift_box` `unlessFlag:'workshop_reward'` / `gift_box_open` `ifFlag:'workshop_reward'` behind the fuselage. NPC `pemberton` (hermit, x13,y3, `dialogue:'npc_pemberton'`). `payphone` **SAVE** (x1,y10) + `phones:[{x:1,y:10}]`. Doors: exit `mat` down → `otterbrook`; to nook (right through-wall) `{x:16,y:2,w:1,h:2,to:'workshop_nook',tx:32,ty:96,facing:'right',indicator:'door'}`.
- **Room B — `workshop_nook` (10×8):** REUSE `cot` (x1,y2 — sleeps here), `bookshelf` (astronautics manuals), `stove` (hot plate, x7,y0.5), `plant_pot` (half-dead), `floor_lamp`, `poster_chart` (star/orbit chart — no new art). `signs` on bookshelf + chart for lore. Door back: `{x:4,y:7,w:2,h:1,to:'workshop_int',...,facing:'down',indicator:'mat'}`.

---

## 3. Consolidated NEW furniture to author

Deduped across all four groups, grouped into **ChatGPT magenta prop-strip batches** (each strip = same-scale props on magenta, ready for `tools/slice-prop-strip.cjs`). Sizes are runtime NATIVE map units (w×h), matched to shipped entries (counter 30×18, cot 20×24, shelf-class ~32×20). Every key must be added to **both** `WORLD_PROP_KEYS` and `AUTHORED_WORLD_PROP_DISPLAY_SIZE`.

### Batch A — `eb-workshop-props`
| Prop key | Description | Size | Used by | Fallback |
|---|---|---|---|---|
| `prop_rocket_fuselage` | Half-built rocket on a wooden cradle, riveted panels, one fin, EB-flat shading — large floor centerpiece | 96×40 | workshop_int | — (hero) |
| `prop_workbench` | Cluttered bench: vise, hand tools, wood-shaving pile, tiny spark | 34×20 | workshop_int | `desk` |
| `prop_blueprint_table` | Slanted drafting table, pinned rocket schematics, T-square | 30×22 | workshop_int | `desk` |
| `prop_parts_bin` | Rolling metal bin of bolts/scrap (optional) | 18×18 | workshop_int | `crate` |

### Batch B — `eb-shop-fixtures`
| Prop key | Description | Size | Used by | Fallback |
|---|---|---|---|---|
| `prop_soda_fountain` | Chrome soda-jerk fountain w/ syrup taps + swivel stools | 34×22 | drugstore_int (also diner) | `counter` |
| `prop_pastry_case` | Tiered glass case of frosted cakes/pastries | 34×22 | bakery_int | `prop_pie_case` |
| `prop_brick_oven` | Domed brick baking oven w/ warm door glow (hero) | 30×26 | bakery_kitchen | `stove` |
| `prop_flour_bins` | Row of scoop-topped flour/sugar bins | 22×22 | bakery_kitchen | `crate` |
| `prop_mixing_station` | Floured worktable + stand mixer + rolling pin | 30×20 | bakery_kitchen | `counter` |
| `prop_burger_counter` | Griddle-side counter + squeeze bottles + shake machine | 34×22 | burger_int | `prop_counter_stools` |
| `prop_flat_grill` | Sizzling flat-top griddle w/ patties + spatula (hero) | 34×22 | burger_kitchen | `stove` |
| `prop_deep_fryer` | Twin-basket deep fryer in oil | 20×22 | burger_kitchen | `stove` |
| `prop_range_hood` | Stainless exhaust hood (wall-band mounted) | 30×16 | burger_kitchen | — (skip) |
| `prop_pharmacy_rack` | Glass-front amber-bottle apothecary cabinet | 22×26 | drugstore_pharmacy | `shelf_b` |

### Batch C — `eb-civic-medical`
| Prop key | Description | Size | Used by | Fallback |
|---|---|---|---|---|
| `prop_teller_grille` | Brass-barred teller cage window w/ marble sill | 30×24 | bank_int | `prop_ticket_window` |
| `prop_velvet_rope` | Stanchion + rope queue divider | 20×18 | bank_int | — (skip) |
| `prop_rate_board` | Wall board of interest/exchange rates | 24×18 | bank_int | `chalk_board` |
| `prop_vault_door` | Round spoked steel vault door (hero) | 40×40 | bank_vault | `shelf` |
| `prop_deposit_boxes` | Grid wall of numbered brass safe-deposit boxes | 30×26 | bank_vault | `shelf_b` |
| `prop_gold_stack` | Stack of cash/gold bricks on a pallet (easter egg) | 22×18 | bank_vault | `crate` |
| `civic_directory_board` | Glass-front municipal wayfinding directory (wall) | 24×18 | otterbrook_cityhall | `sign` |
| `ballot_box` | Padlocked wooden ballot box (solid) | 16×18 | otterbrook_cityhall | `crate` |
| `council_podium` | Speaker's lectern + mic + town seal (solid) | 20×22 | otterbrook_council | `counter` |
| `wanted_board` | Cork wanted board w/ pinned mugshot flyers | 24×20 | otter_station | `chalk_board` |
| `gun_rack` | Locked wall-mounted long-arm rack (solid) | 22×20 | otter_station | `shelf` |
| `cell_bars` | Vertical iron-bar decorative panel (NON-solid overlay) | 30×26 | otter_station | — (skip; wall tiles collide) |
| `evidence_locker` | Wall of numbered steel evidence lockers (solid) | 20×28 | otter_station | `shelf_b` |
| `privacy_curtain` | Hospital curtain on a ceiling rail | 22×24 | otter_clinic_exam + _ward | — (skip) |
| `iv_stand` | Wheeled IV drip pole (slim solid) | 12×26 | otter_clinic_ward | — (skip) |

### Batch D — `eb-domestic`
| Prop key | Description | Size | Used by | Fallback |
|---|---|---|---|---|
| `fridge` | Cream 1-door fridge w/ magnets (highest reuse — most kitchens) | 20×30 | rex/chad/green/tract/apt kitchens | 2nd `counter` |
| `dining_table` | Small round Formica table + 2 chairs | 34×26 | rex_home, kitchens | `bench`+`phone_table` |
| `mailboxes` | Wall bank of brass apartment mailboxes | 22×20 | apt_lobby | `shelf_b` |
| `rocking_chair` | Wooden rocker + quilt | 20×18 | house_green_int | `sofa` |
| `trophy_shelf` | Shelf of little-league + bug-catching trophies | 22×20 | chad_home | `bookshelf` |

> **Do NOT re-author** (already exist): `poster_chart`, `poster_smile`, `bookshelf`, `stove`, `tv`, `dresser`, `sofa`, `cola_fridge`, `freezer_case`, `mart_aisle`, `checkout_lane`, `video_shelf`, `noodle_counter`, `menu_board`, `prop_pie_case`, `prop_jukebox`, `prop_booth`, `prop_counter_stools`, `prop_frontdesk`, `prop_wardbed`, `prop_waitingchairs`, `prop_vending`, `lobby_desk`, `prop_ticket_window`, `prop_waiting_bench`, `prop_lockbox_counter`, `prop_pegboard_wall`, `prop_tool_shelf`, `holding_door`/`_1..3`. Every fallback above is buildable TODAY (gray-box) and upgrades to authored art per the pipeline.

**Prop counts:** Batch A = 4 · Batch B = 10 · Batch C = 15 · Batch D = 5 → **34 new props** (several optional/skippable).

---

## 4. Interior tile-skin needs

Most interiors reuse `floor_wood`('w') + `wall_int`('W'), plus existing `office_floor`('o')/`office_wall`('O') and `arcade_floor`('a')/`arcade_wall`('A'). Author new skins as a **tile strip appended to the interior tileset** (tile-strip override pipeline — **never re-pack**), each a floor+wall recolor:

| Skin key | Palette | Used by |
|---|---|---|
| `tile_pharmacy` | white/mint checker (clean-room read) | drugstore_int/pharmacy, all clinic rooms |
| `tile_civic` | polished marble/terrazzo (institutional) | otterbrook_cityhall + council, bank_int + vault |
| `tile_kitchen` | food-safe white/red tile | bakery_kitchen, burger_kitchen |
| `tile_concrete` | oil-stained gray garage floor | workshop_int (wood floor looks wrong under a rocket) |

If tile skins are out of scope for this pass, fallbacks: workshop → `office_floor`('o') (reads industrial); all others → `floor_wood`('w'). Tile skins are **optional polish**, not a blocker.

---

## 5. Build order

**Phase 0 — furniture strips first.** Author + wire the 4 prop-strip batches (ChatGPT → PNG → `tools/slice-prop-strip.cjs` → register in `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`). Priority: **Batch D `fridge`** (highest reuse) → Batch B (shop heroes) → Batch C (civic) → Batch A (workshop). Because every prop has a fallback, interiors can be **gray-boxed in parallel** with authoring — but wiring an interior to a not-yet-registered key breaks the build, so register the key (even pointing at a fallback) before referencing it.

**Phase 1 — build/upgrade interiors room by room** (hand-authored `MapDef`s; mirror `buildRexHome`/`buildDrugstoreInt`/`buildOtterClinicInt`):
- **UPGRADES (edit in place):** `drugstore_int`, `arcade_int`, `otterbrook_cityhall`, `otter_clinic_int`, `otter_clinic_exam`, `otter_station`, `rex_*` (light). ⚠ `otter_station` — preserve the ADR-118 Borden cell byte-for-byte.
- **NEW builds:** `drugstore_pharmacy` · `bakery_int` + `bakery_kitchen` · `burger_int` + `burger_kitchen` · `bank_int` + `bank_vault` · `otterbrook_council` · `otter_clinic_ward` · `chad_home` + `chad_bedroom` · `house_green_int` · `tract_home_a` + `tract_home_b` + `tract_home_c` + `tract_bed_c` · `apt_lobby`(×3 clones) + `apt_unit_studio` + `apt_unit_1bed` + `apt_bed_1` · `workshop_int` + `workshop_nook`.
- Register each in `MAPS` + `MAP_AREA` (Otterbrooke); append single-room ids to `ROOMY_INTERIORS`.

**Phase 2 — wire facade doors.** Add/verify the overworld `door:{...to:<int_id>,tx,ty}` on each facade and the reciprocal interior exit. ⚠ `bldg_ob_workshop` has NO door prop yet — add both sides. Aim every `tx`/`ty` at the tile interior (+8/+12) for ADR-138 snug entry.

**Phase 3 — gate.** `npm run validate` + `doorAudit` (`mapcheck.ts` ~604). Checklist: `interior:true` on every map; every shop/civic has a reachable SAVE payphone (**arcade + station gaps closed**); every inter-room door reciprocated; top-edge/side interior doors `indicator:'door'`, bottom exits `indicator:'mat'`; Borden spawn (native 200,56) unchanged; every new `prop_*` in both prop tables. Then live-verify a sample by WALKING (not warp) per the door-body-box audit.

**New map ids to register (count):** 22 new maps — pharmacy(1), bakery(2), burger(2), bank(2), council(1), ward(1), chad(2), green(1), tract(4), apartments(6: lobby×3 + studio + 1bed + bed_1), workshop(2). Plus 8 upgraded-in-place.

---

## 6. Open questions for the user

**RESOLVED (user, 2026-07-03):** Q1 = bespoke unique MULTI-ROOM for the STORY homes
(hero/Chad/green cottage/Pemberton workshop), shared-with-variety for the 4 tract houses + apt units.
Q3 = keep the shared/filler residences compact (kitchen folded in); story homes stay multi-room.
Q4 = **REAL MECHANICS** — the bank teller opens a **savings/loan tied to `src/data/fortune.ts`**; the
pharmacist opens a **status-cure / antidote shop** (reuse the shop system). Q5 = **AUTHOR the 4
interior tile skins** (`tile_pharmacy`/`tile_civic`/`tile_kitchen`/`tile_concrete`) this pass.
Defaults taken: Q2 apartment lobbies cloned per block; Q6 `cell_bars` = NON-solid overlay (Borden
spawn untouched).

1. **Tract-house variants:** the plan builds **3 layouts for 4 facades** (T1, T2-mirror, T3-with-bedroom) and reuses T1 for `bldg_ob_cottage`. Do you want each of the 4 tract facades to have a **fully unique** interior instead (4 built maps), or is the 3-layout + NPC/sign/mirror variety enough?
2. **Apartment lobbies:** clone the lobby **3× per block** (distinct names + exit targets) as specced, or use **one shared `apt_lobby`** with a return-flag? Cloning is simpler and matches `streetExit` parameterization; shared saves 2 map units.
3. **Depth per building — split kitchens?** Chad's/tract kitchens are folded into the living room for map-count discipline. Do you want any of them **promoted to their own back-of-house rooms** (like the bakery/burger split), or keep residences compact?
4. **Bank & pharmacy sub-shops:** should `bank_manager` open a real **savings/loan mechanic** tied to `fortune.ts`, and `pharmacist` open a **status-cure/antidote shop** — or are these NPCs flavor-only for now?
5. **Tile skins (§4):** author the 4 interior tile skins this pass, or ship on `floor_wood`/`office_floor` fallbacks and add skins later?
6. **Cell bars prop:** author `cell_bars` as a non-solid overlay on the holding cell, given the byte-locked Borden spawn — or leave the cell relying on wall tiles to avoid any risk to ADR-118?
