# PKG-09 - Existing NPCs + Chapters 1-3 world polish

Bring the already-shipped Ch.1-3 overworld up to authored quality.

## A. NPC overworld sprites - 42 + Glint special, 46-frame 96x128 runtime / 24x32 native

Full id list: [`../asset-lists/characters_8dir.txt`](../asset-lists/characters_8dir.txt)
(skip the 5 heroes - those are PKG-08). Same 8-direction -> 46-frame contract as
PKG-08 section A. Path `assets/art/characters/<id>_anim_46_4x.png`. Wired in
`NPC_CHARACTER_ART` (`src/spritegen/authored.ts`).

Otterbrook's focused replacement roster lives in
[`../asset-lists/otterbrook_npcs_46.txt`](../asset-lists/otterbrook_npcs_46.txt).
It is derived from the live Otterbrook maps/interiors plus story-only Chad and
Glint, not a prompt-only or mock roster.

## B. World tiles - the 53-cell set

Source of truth: `TILESET` in `src/spritegen/tiles.ts`. One 16x16 native
(64x64 runtime) cell per name, packed in a strip
`assets/art/world/otterbrook_tiles_16.png` and mapped by `WORLD_TILE_ART.names`.
Covers USA/SA/England biomes plus office, bus, arcade, and sea.

## C. Props & furniture - about 70

The `draw*` functions in `src/spritegen/tiles.ts` + `src/spritegen/ch2.ts`:
trees, pine, sign, bed, desk, sofa, counter, dresser, TV, bookshelf, floor lamp,
picnic table+blanket, phone table, bug zapper, meteor rock, lemonade stand,
payphone, dumpster, bench, hydrant, planter, telephone pole, trash can, parking
meter, newspaper box, elevator, water cooler, copier, ATM, shop shelf, arcade
cabinet, cola fridge, cot, fountain, market stall, banana boat, idol shrine,
pyramid gate, crate, gangplank, gift box. Path `assets/art/world/props/<name>.png`.

## D. Facades - about 25, Ch.1-3

Houses (`house_rex`, `house_chad`, `house_a`, `house_b`), drugstore, arcade,
chapel, `valle_house_b`, the city catalog, and landmark facades
(`src/spritegen/buildings.ts`). Path `assets/art/world/facades/<name>.png`.

## E. Battle backgrounds - Ch.1-3, about 5

One backdrop per area family: Otterbrook, Brickton city, jungle/SA, England,
school. Path `assets/art/backgrounds/<area>.png`.

## Acceptance

42 human NPC sheets + the Glint special sheet + the Ch.1-3 tiles, props, facades,
and backgrounds are authored, wired, and frame-audited.
