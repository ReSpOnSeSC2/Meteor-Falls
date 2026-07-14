# PKG-09 - Existing NPCs + Chapters 1-3 world polish

> **Chapter 1 production amendment (ADR-145, 2026-07-14):** the expanded
> Chapter 1 enemy base/wear/overworld families are authored; no gray-box or
> queued-art claim in an older plan overrides runtime registration and strict
> audit evidence. Borden, the Realtor, and the Waitress now have authored
> 46-frame, 384x1536 runtime/master sheets with distinct grounded walk poses and
> fresh native review contacts. Deterministic source/runtime/master/review
> hashes live in
> `assets/art/masters/generated/ch1-expanded/npc-walk-atlas-provenance.json`.
> Rebuild one with `npm run ch1:npc:borden`, `npm run ch1:npc:realtor`, or
> `npm run ch1:npc:waitress`; rebuild all three with `npm run ch1:npcs:walks`.
> Waiting-bench and ward-bed acceptance retains clean alpha-edge/compositing
> evidence. Current contacts are assembled under `output/ch1_asset_contacts/`,
> including accepted real runtime phase captures.

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

Current Otterbrook composition uses 47 distinct physical facade placements
after collapsing open/closed state twins. Measured facade height is 3.104
minimum, 3.844 mean, 3.75 median, and 5.31 maximum Jay-heights; residential
homes stay in the 3.6-3.9 band. These are live placement measurements, not the
historical package's approximate count of facade art identities.

## E. Battle backgrounds - Ch.1-3, about 5

One backdrop per area family: Otterbrook, Brickton city, jungle/SA, England,
school. Path `assets/art/backgrounds/<area>.png`.

## Acceptance

42 human NPC sheets + the Glint special sheet + the Ch.1-3 tiles, props, facades,
and backgrounds are authored, wired, and frame-audited.
