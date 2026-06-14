# PKG-16 — Chapter 9: Romania (full region bundle)

A complete art set for an **unlanded** chapter (no art exists yet). Canon source:
`src/data/chapters.ts` (`CHAPTER_MANIFESTS['9']`) + `docs/GAME_BIBLE.md §A6/§A7`.

- **Region:** Romania · **biome:** painted-gates / castle
- **Boss:** count_hoaxula (5300 HP)
- **Settlement(s):** valea_stelelor
- **Travel in:** train · **Dungeon:** castle_hoaxula

## 1. Region tileset (~12–16 cells, 16×16)
Ground/wall/floor/water for the painted-gates / castle biome. Add new named cells to
`TILESET` (`src/spritegen/tiles.ts`) and pack into a region strip
`assets/art/world/Romania_tiles_16.png`.

## 2. Dungeon art (castle_hoaxula)
Walls, floor, props, set dressing, the boss-trigger door. Built in the LEVELKIT
LAB recipe; reskin with hand art. `assets/art/world/dungeons/castle_hoaxula/`.

## 3. Settlement facades (~8)
Landmark + generic buildings for valea_stelelor in the region style. Path
`assets/art/world/facades/`.

## 4. NPC roster — ~10–15, 8-dir 24×32
Townsfolk, shopkeepers, quest-givers. Same 8-direction → 46-frame contract as
the heroes. `assets/art/characters/<id>_8dir_24x32.png`; add ids to
`NPC_CHARACTER_ART` in `src/spritegen/authored.ts`. (Ids come from the
chapter's promoted settlement draft — `src/data/drafts/ch9/`.)

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
scaffolded in `src/data/drafts/ch9/roster.ts` (`npm run scaffold -- ch9`).

## 6. Boss — count_hoaxula
Bespoke, multi-frame, larger than enemies (NOT an enlarged enemy). 3 wear
stages. `assets/art/enemies/battle_count_hoaxula*.png`.

## 7. Battle background
The region's arena backdrop. `assets/art/backgrounds/castle_hoaxula.png`.

## 8. Cutscene panels (~6–8, 400×225)
The chapter's §A6 beats + the **train** travel-in set-piece. (Coordinate file
names with PKG-01: `assets/art/cutscenes/ch9/<beat>_NN.png`.)

## 9. Regional extras
- One **home/interior** for the property arc (`src/data/properties.ts`).
- The region's **road vehicle(s)** (coordinate with PKG-07).
- ~3 **picnic table** placements use the shared prop (no new art).

## Acceptance
Tileset, dungeon, facades, ~12 NPCs, 20-enemy roster (×3 wear), boss, backdrop,
cutscene panels, and the regional home all authored and wired for Chapter 9.
