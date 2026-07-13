# PKG-13 — Chapter 6: Africa (shipped region bundle)

Chapter 6 is shipped. This package records the retained authored inventory used
by the production rollout; it is no longer a request for missing art.

- **Region:** Africa · bazaar-port / savanna / carved ruins
- **Settlement:** Zanzibel
- **Dungeon:** Laughing Ruins → Sphinx’s Chin
- **Boss:** Laughing Sphinx, **9,000 HP**
- **Runtime:** 1600×900, `ART_SCALE = 4`

## Wired authored inventory

- `Africa_tiles_16.png` supplies sand, water, wall, path, carved ruin wall,
  grass, and earth cells through the existing Zanzibel/Savanna/Ruins skins.
- Formal Zanzibel uses only the supported promoted sources
  `bldg_zanzibel_home`, `bldg_zanzibel_indigo_dyer`, and
  `bldg_zanzibel_caravanserai`; no unsupported facade source was introduced.
- Authored regional NPCs include `zanzibel_market_queen`,
  `zanzibel_dockmaster`, `laughing_ruins_guide`, and `baobab_healer`.
- The Chapter 6 enemy ecosystem, three wear stages, minis, Laughing Sphinx boss,
  and `laughing_ruins` battle background remain the shipped registered assets.
- The complete seven-panel gallery remains registered under `ch6_journey`:
  caravan, savanna dusk, market, courier lesson, ruins, Sphinx, and resonance.
  Runtime plays spoiler-safe contextual subsets plus the Held Breath panel.
- Shared props provide the three-rest rhythm. `baobab_shade`, palms, resonance
  stones, market furniture, and trail markers furnish the regional maps.
- Zanzibel’s generated interiors and live amenity systems reuse the existing
  interior prop and NPC registries; the historical five units remain stable.

## Acceptance — complete

- [x] Region tile skins registered and live on all four production maps.
- [x] Authored facades, NPCs, enemy wear/minis, boss, backdrop, and panels wired.
- [x] Four-map production world, fourteen live Zanzibel units, and three picnic
      placements visible in `output/maps_ch6.png`.
- [x] No new bitmap or procedural substitute introduced by the rollout.
- [x] Strict content, map-editor, visual, test, build, and live-game QA evidence
      recorded in `docs/CH6_PRODUCTION_VERIFICATION.md`.
