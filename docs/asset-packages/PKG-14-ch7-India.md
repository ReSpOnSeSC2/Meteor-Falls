# PKG-14 — Chapter 7: India (production asset package)

Chapter 7 is shipped. This inventory replaces the old “unlanded / no art” brief.
Executable canon is the four-map Chapter 7 implementation and the focused
four-regular-enemy roster; Cobra Raja has exactly **20,000 HP**.

## Runtime contracts

- Framebuffer: 1600×900; `ART_SCALE = 4`
- Tiles: 16×16 native / 64×64 runtime
- Characters: 24×32 native / 96×128 runtime, 46-frame sheets
- Battler target cell where applicable: about 112×144
- Cutscene panels: 1600×900

## Reused authored production art

- NPC sheets and masters: `cp_spice_merchant`, `cp_dabbawala`,
  `cp_stationmaster`, `cp_usher`
- Seven cutscene panels and masters: train arrival, bazaars, heist, vivarium,
  Raja reveal, throne resonance, cinema gag
- Night-train vehicle art
- `cobra_palace` battle background and source master
- Cobra Flute weapon and item-icon art
- Distinct authored battlers/minis for `rickshaw_swarm`, `spice_djinn`,
  `temple_macaque`, `naga_sentry`, and `cobra_raja`, with stable wear-tier keys
- Shared regional tiles/props where the production maps deliberately reuse a
  compatible authored vocabulary

The Ghat Elder deliberately uses the existing authored `oldTimer` 46-frame sheet;
there is no unregistered partial `cp_ghat_elder` asset.

## New Chandrapore package

Four original 1536×1024 image-generation source banks and keyed derivatives live
under `assets/art/masters/world/ch7-chandrapore-facades-*.png`.

The package exports 14 source facades at 256×192 and 14 explicit city-scale
facades under `assets/art/world/facades/`:

- Hillcrest Manor; Moon Gate Realty; Civic Hall; Monsoon Motor Gallery;
  The Silver Parasol
- Bazaar Shops A/B; Market Arcades A/B
- Apartments A/B/C
- Majestic Cinema; Chandrapore Station

Ordinary promoted variants are 264×880. Civic Hall, Silver Parasol, Majestic
Cinema, and Station are 264×1200. The allowlist in
`src/spritegen/authored.ts` makes all 14 promoted keys authored at runtime instead
of silently accepting formal-city procedural fallback.

`assets/art/world/props/prop_chandrapore_palace_spire.png` is a 288×776 distant
navigation landmark registered at 72×194 native display size.

## Enemy and boss scope

The old request for twenty regular enemies is retired. The production package uses
four mechanically distinct regulars plus Cobra Raja. Visual inspection confirmed
unique base silhouettes and matching minis. Existing wear files remain registered;
their optional future polish is to deepen local damage storytelling without
changing any runtime key or balance contract.

## Verification

- Authored asset wiring: 18/18 focused tests pass
- Formal-city scale: 29/29 tests pass
- Strict visual identity: 144/144 authored, 0 legacy
- Enemy frame wiring: 147/147 fully wired, 0 partial/procedural
- Facade contact sheet: `output/ch7_chandrapore_facades_contact.png`
- Map contact sheet: `output/maps_ch7.png`
- Full record: `docs/CH7_PRODUCTION_VERIFICATION.md`

Optional future polish is limited to art-quality upgrades that preserve these
contracts. It is not permission to recreate a twenty-enemy roster, rename assets,
reorder tile indices, or revert Cobra Raja to 3,200 HP.
