# PKG-14 — Chapter 7: India (full region bundle)

A complete art set for an **unlanded** chapter (no art exists yet). Canon source:
`src/data/chapters.ts` (`CHAPTER_MANIFESTS['7']`) + `docs/GAME_BIBLE.md §A6/§A7`.

- **Region:** India · **biome:** bazaar-port / palace
- **Boss:** cobra_raja (3200 HP)
- **Settlement(s):** chandrapore
- **Travel in:** night train · **Dungeon:** night_train

## Resolution target
The HD render is live: `ART_SCALE = 4` → **1600×900** framebuffer. Runtime cells
are **native × 4**; size source art to the 4× cell (a gentle reduction, not the
old 1× crush).

- Tiles: 16×16 native → **64×64** runtime cells.
- Characters: 24×32 native → **96×128** runtime cells, exactly the
  `*_4x_master` cell, so they are native at 4× with no downscale.
- Busts: 32×32 native → **128×128** runtime cells.
- Battlers: 28×36 native → **112×144** runtime cells.
- Athletes/golfers: 32×40 native → **128×160** runtime cells.

Full-screen art (cutscene panels, screen backgrounds) is authored at **1600×900**.

## 1. Region tileset (~12–16 cells, 64×64 runtime / 16×16 native)
Ground/wall/floor/water for the bazaar-port / palace biome. Add new named cells to
`TILESET` (`src/spritegen/tiles.ts`) and pack into a region strip
`assets/art/world/India_tiles_16.png`.

## 2. Dungeon art (night_train)
Walls, floor, props, set dressing, the boss-trigger door. Built in the LEVELKIT
LAB recipe; reskin with hand art. `assets/art/world/dungeons/night_train/`.

## 3. Settlement facades (~8)
Landmark + generic buildings for chandrapore in the region style. Path
`assets/art/world/facades/`.

## 4. NPC roster — ~10–15, 8-dir 96×128 runtime / 24×32 native
Townsfolk, shopkeepers, quest-givers. Same 8-direction → 46-frame contract as
the heroes. `assets/art/characters/<id>_anim_46_4x.png`; add ids to
`NPC_CHARACTER_ART` in `src/spritegen/authored.ts`. (Ids come from the
chapter's promoted settlement draft — `src/data/drafts/ch7/`.)

## 5. Enemy roster — **20 enemies × 3 wear = 60 images**
The §A7 ecosystem (`GAME_BIBLE.md` line 530/551):
- 4 road/field roamers
- 3 dungeon specialists
- 2 social/urban oddities
- 2 rare/high-value
- 2 late-chapter pressure
- 1 set-piece enemy

Author each at battle scale (large; fit-scaled in engine). Three wear stages
each: `battle_<id>.png`, `_w1.png`, `_w2.png` under `assets/art/enemies/`;
add to `ENEMY_BATTLE_ART` in `src/spritegen/authored.ts`. The 20 ids are
scaffolded in `src/data/drafts/ch7/roster.ts` (`npm run scaffold -- ch7`).

## 6. Boss — cobra_raja
Bespoke, multi-frame, larger than enemies (NOT an enlarged enemy). 3 wear
stages. `assets/art/enemies/battle_cobra_raja*.png`.

## 7. Battle background
The region's arena backdrop. `assets/art/backgrounds/night_train.png`.

## 8. Cutscene panels (~6–8, 1600×900)
The chapter's §A6 beats + the **night train** travel-in set-piece. (Coordinate file
names with PKG-01: `assets/art/cutscenes/ch7/<beat>_NN.png`.)

## 9. Regional extras
- One **home/interior** for the property arc (`src/data/properties.ts`).
- The region's **road vehicle(s)** (coordinate with PKG-07).
- ~3 **picnic table** placements use the shared prop (no new art).

## Acceptance
Tileset, dungeon, facades, ~12 NPCs, 20-enemy roster (×3 wear), boss, backdrop,
cutscene panels, and the regional home all authored and wired for Chapter 7.
