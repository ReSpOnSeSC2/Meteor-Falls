# PKG-09 — Existing NPCs + Chapters 1–3 world polish

Bring the already-shipped (Ch.1–3) overworld up to authored quality.

## A. NPC overworld sprites — 42, 8-dir 24×32
Full id list: [`../asset-lists/characters_8dir.txt`](../asset-lists/characters_8dir.txt)
(skip the 5 heroes — those are PKG-08). Same 8-direction → 46-frame contract as
PKG-08 §A. Path `assets/art/characters/<id>_8dir_24x32.png`. Wired in
`NPC_CHARACTER_ART` (`src/spritegen/authored.ts`).

## B. World tiles — the 53-cell set
Source of truth: `TILESET` in `src/spritegen/tiles.ts`. One 16×16 cell per name,
packed in a strip `assets/art/world/otterbrook_tiles_16.png` (mapped by
`WORLD_TILE_ART.names`). Covers USA/SA/England biomes + office/bus/arcade/sea.

## C. Props & furniture — ~70
The `draw*` functions in `src/spritegen/tiles.ts` + `src/spritegen/ch2.ts`:
trees, pine, sign, bed, desk, sofa, counter, dresser, TV, bookshelf, floor lamp,
picnic table+blanket, phone table, bug zapper, meteor rock, lemonade stand,
payphone, dumpster, bench, hydrant, planter, telephone pole, trash can, parking
meter, newspaper box, elevator, water cooler, copier, ATM, shop shelf, arcade
cabinet, cola fridge, cot, fountain, market stall, banana boat, idol shrine,
pyramid gate, crate, gangplank, gift box… Path `assets/art/world/props/<name>.png`.

## D. Facades — ~25 (Ch.1–3)
houses (rex/chad/a/b), drugstore, arcade, chapel, valle_house_b + the city
catalog + landmark facades (`src/spritegen/buildings.ts`). Path
`assets/art/world/facades/<name>.png`.

## E. Battle backgrounds — Ch.1–3 (~5)
One backdrop per area family (Otterbrook, Brickton city, jungle/SA, England,
school). `assets/art/backgrounds/<area>.png`.

## Acceptance
42 NPCs + the Ch.1–3 tiles/props/facades/backgrounds authored and wired.
