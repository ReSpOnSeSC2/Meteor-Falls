# PKG-16 — Chapter 9: Romania (production reconciliation)

> **Status (ADR-144, 2026-07-14):** the historical “unlanded / no art,”
> 5,300-HP boss, 10–15-NPC, and twenty-enemy package requests are superseded.
> Chapter 9's four-map production contract and retained art package are now
> implemented and production-closed. This document records what was reused and
> the completed remediation; it is not authority to regenerate the region
> wholesale.

Canon sources are `docs/chapters/ch9/blueprint.md`, ADR-144 in
`docs/DECISIONS.md`, and executable registries under `src/data/` and
`src/spritegen/`.

- **Region:** Romania · painted-gates village / bankrupt gothic attraction
- **Travel in:** the Orient Less-Express; Bert and Lucille do not own arrival
- **Maps:** `valea_stelelor` 80×64 · `old_road` 96×72 ·
  `castle_hoaxula` 72×96 · `stone_brow_monastery` 64×88
- **Regional quest:** `bunis_table`
- **Regular roster:** exactly five — Haystack Mimic, Ribcage Rattler, Moss
  Strigoi, Animated Armor, Wolf of the Old Road
- **Boss:** Count Hoaxula, 95,000 HP, theatrical and unmasked forms
- **Continuity:** Dorin joined in Chapter 5; Romania is his homecoming and
  Comet Ω awakening. Every party-visible panel obeys serialized Pippa state.

## Resolution and animation contract

The live framebuffer is 1600×900 at `ART_SCALE = 4`. Runtime cells are native
×4: tile 64×64, character 96×128, bust 128×128, and nominal battler 112×144.
Full-screen panels/backgrounds are 1600×900. Valea's nine live villagers reuse
four strict-clean identities under the 46-frame, four-column, 384×1536 sheet
contract. Strict visual, animation, and enemy-frame gates may not be weakened
to accept replacement art.

## Retained runtime package

- `assets/art/world/Romania_tiles_16.png` — registered 192×64 regional strip.
- Eight registered Valea facades: painted house, cottage, inn, shop, hall,
  church, mill, and barn, with retained source masters.
- Four registered strict-clean NPC sheets and exact runtime masters:
  `vs_buni`, `vs_provisioner`, `vs_shepherd`, and `vs_kid`.
- The five regular-enemy base identities, their minis, Ribcage's three distinct
  wear stages, Count's theatrical/unmasked bases, and Count's mini.
- `assets/art/backgrounds/castle_hoaxula.png` at 1600×900.
- `assets/art/vehicles/orient_less_express.png`; production uses it as a large
  exterior rail-apron landmark, not a new interior or Chapter 7 dungeon.
- Seven existing Chapter 9 journey compositions and the existing choice
  composition as source/visual references; the solo Trial panel remains shared.
- Shared authored ticket window, velvet ropes, curtains, posters, gift boxes,
  crates, benches, and stage fixtures for Castle Hoaxula dressing.

## Completed raster remediation

1. Seven contextual **Pippa-present/Pippa-departed pairs** now ship for train,
   arrival, Buni, castle, unmask, monastery, and COMPASSION choice. Present
   versions show Jay, Mia/Faye, Milo, Dorin, and Pippa; departed versions show
   Jay, Mia/Faye, Milo, and Dorin. Runtime chooses from serialized party state.
   All fourteen 1600×900 runtime panels have fourteen matching source masters.
2. Haystack Mimic, Moss Strigoi, Animated Armor, and Wolf of the Old Road now
   have visibly progressive, byte-distinct wear 1 and wear 2.
3. Count theatrical now has distinct wear 2; Count unmasked has distinct wear 1
   and wear 2. Ribcage's already-distinct stages remain intact. These eleven
   corrected wear outputs have eleven matching generated masters.
4. New image-generation results retain the named masters above. Legacy assets
   without master files retain repository provenance: the Orient Less-Express
   runtime asset traces through `b83bc19a`, `8bcfe5f2`, and `01aa9171`, while
   Ribcage's retained battler family traces to `74bca949`. Choice remediation
   has its dedicated runtime pair and source masters.

The closed remediation is fourteen contextual panel outputs plus eleven wear
corrections and their 25 corresponding masters. It did not require a new NPC
sheet identity, facade family, regional strip, background, base enemy identity,
mini set, or generic dungeon-art folder.

## World-art use

Valea deliberately places all eight facade identities and nine live villagers
around an outdoor Buni table court, green/well, civic lane, church court, and
mill/barn work lane. Five visible pantry cues sit beside their pickup tiles and
retire with the same durable collection flags.
Dedicated shop, church, home, castle-room, and train map ids are non-goals.
Castle Hoaxula first reuses the registered attraction/backstage prop vocabulary;
meteor rocks and trail markers do not substitute for its throne, scenery, gift
shop, dressing room, or foreclosure wall. Its restart foyer includes a usable
picnic recovery table with collision-clear recovery feet.

## Acceptance

- The four frozen map dimensions and `CH9_WORLD` points pass production map,
  reachability, door/body, migration, profile, and render contracts.
- The train owns contextual arrival; the seven-panel gallery is never an entry
  reel; party art is Dorin-correct and Pippa-branch-truthful.
- The exact five-regular roster plus 95,000-HP Count is wired, balanced, and
  covered by byte-distinct wear/source tests.
- All retained/new art passes strict visual, animation, enemy-frame, and
  original-resolution review.
- Integrated production-close evidence is recorded in
  `docs/CH9_PRODUCTION_VERIFICATION.md`; the package is closed by that combined
  world, gameplay, art, automated, and live-QA evidence rather than asset
  registration alone.
