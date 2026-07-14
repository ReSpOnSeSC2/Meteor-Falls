# PKG-15 — Chapter 8: China (production asset record)

Status: **production implementation present on `codex/chapter-8-production-rollout`**.
Canonical source: ADR-143, `src/data/chapters.ts`, `src/data/maps_ch8.ts`, and
`docs/CH8_PRODUCTION_VERIFICATION.md`.

This package record supersedes its pre-production “unlanded / no art” brief,
the 4,100-HP Paper Dragon, nonexistent `src/data/drafts/ch8/` paths, and the
twenty-enemy art quota. Executable canon is a four-regular-enemy authored roster
plus a **45,000-HP** Paper Dragon.

## Production world contract

| Map | Size | Production identity |
| --- | ---: | --- |
| `lotus_harbor` | 112×80 | Fan-shaped terraced working river crescent: quay, ghats, lantern market, tea lanes, painted civic gate, Yak/road interchange. |
| `bamboo_road` | 104×64 | Braided river-and-lock ascent with a public barge crisis, reconnecting paths, switchbacks, rest grove, and Yak depot. |
| `spore_forest` | 88×104 | Asymmetric fungal loop network with three deterministic Mushroomized belts, clean retreats, kiln, shortcuts, and Yak pickup. |
| `mt_shu_temple` | 96×104 | Alternating folded courts and guardian halls; the Dragon arena and gated bell resonance are separate destinations. |

`CH8_WORLD` owns dimensions, landings, route mouths, story/quest/hazard
rectangles, recovery, parking, migration, and profile spawns. Riverboat owns
arrival, Yak Express owns the forest-to-temple leg, and Lucille remains the
safe backtracking connection.

## Resolution and frame contracts

- Full-screen panels: 1600×900.
- World tiles: 16×16 native → 64×64 runtime cells.
- Characters: 24×32 native → 96×128 runtime cells; 46 populated frames in a
  384×1536 four-column sheet.
- Enemies and bosses: one authored still per base/wear/form key; BattleScene
  supplies motion. Matching minis provide overworld tells.
- Runtime and retained master/source pairs are pinned by focused asset tests.

## Environment, facades, and interiors

- The retained regional strip is `assets/art/world/China_tiles_16.png`; Bamboo
  and Spore edge props provide place-specific silhouettes.
- Lotus Harbor has eight source identities: Grand Market, Harbor Office,
  Lantern Shop, Pagoda, Row House, Tea House, Temple, and Theater.
- Each source has an explicit authored city-scale PNG under
  `assets/art/world/facades/` and a retained generation source under
  `assets/art/masters/generated/lh_cityscale_*_src.png`. No Lotus city-scale key
  is allowed to use procedural formal-city fallback.
- Twenty-four facade placements produce twenty-two deterministic live units,
  `lotus_harbor_unit_0` through `_21`; two suffix lots remain locked. Historical
  units 0–3 retain realtor, home-host, dealer, and hotel-clerk roles.
- `citysvc_lotus_harbor_hotel_room` and the existing property, agency,
  dealership, market, phone, ATM, dock, fuel, and vehicle seams remain live.
- Visual evidence: `output/ch8_lotus_harbor_facades_contact.png` and
  `output/maps_ch8.png`. Final close findings belong in the verification record.

## Named Chapter 8 cast

Seven named roles have distinct 46-frame authored identities:

- retained: `lh_harbor_master`, `lh_calligrapher`, `lh_lantern_girl`,
  `lh_tea_monk`;
- added for the production world: `lh_yak_handler`, `lotus_bargeman`,
  `mt_shu_elder`.

The three added sheets have synchronized runtime and animation masters under
`assets/art/characters/` and `assets/art/masters/characters/animation/`, with
their retained directional generation sources under
`assets/art/masters/generated/ch8-named-npcs/`.

## Enemy and boss package

The production regular roster is exactly:

| Enemy | HP | Authored gameplay/art hook |
| --- | ---: | --- |
| `paper_lantern_wisp` | 5,500 | Floating fire tell; base, `_w1`, `_w2`, mini. |
| `spore_puffer` | 6,500 | Inflicts real Mushroomized; base, `_w1`, `_w2`, mini. |
| `origami_warrior` | 8,000 | Dedicated `refold` move kind lasts four turns, keeps physical shield, swaps FIRE weakness/FREEZE resistance to FREEZE weakness/FIRE resistance, retains VOLT weakness, and updates damage plus Spy/Scope until relaxation; base, `_w1`, `_w2`, mini. |
| `porcelain_warlord` | 11,000 | Breaks into smaller same-roster pressure; base, `_w1`, `_w2`, mini. |

`paper_dragon` is a bespoke boss at exactly 45,000 HP. Its authored package
contains base, `_w1`, `_w2`, mini, and a distinct BURNING base/`_w1`/`_w2`
family. It starts AIRBORNE, is physical-immune only there, grounds for exactly
two turns from Volt or Bottle Rockets, and enters BURNING below 30% once with
doubled speed. The Spore Forest battle background remains
`assets/art/backgrounds/spore_forest.png`.

## Cutscenes and travel craft

The canonical seven 1600×900 panel pairs are:

1. `riverboat_to_lotus_harbor`
2. `lotus_harbor_arrival`
3. `spore_forest_scramble`
4. `yak_express_to_mt_shu`
5. `paper_guardians_false_folds`
6. `paper_dragon_reveal`
7. `temple_bell_resonance`

Dorin is present in the corrected canonical party compositions. Dedicated
`paper_dragon_reveal_departed` and `temple_bell_resonance_departed` variants
keep the post-Trust story accurate when Pippa has left. Runtime art lives under
`assets/art/cutscenes/ch8/`; source panels live under
`assets/art/masters/world/ch8-cutscene-panels/`. The complete gallery remains
`ch8_journey`, while one-panel contextual ids play at their actual world beats.
The existing `assets/art/vehicles/riverboat.png` and `yak_express.png` are the
two visible chapter travel craft.

## Items and system-facing art

- Paper Dragon reward: `paper_fan`, awarded retry-safely once before bell access.
- Quest/cure items include Scroll of Calm, Spore Antidote, Paper Crane Charm,
  Jade Salamander Charm, River Beads, Temple Incense, and Yak Treats.
- Mushroomized is a real saved/input status; it is not only an icon or shader.
- Teleport Beta is taught once by the Mt. Shu elder; it is not a level-34 grant.

## Production acceptance

Source and focused tests must continue to pin the four maps, eight promoted
facades, twenty-two units, seven named NPC identities, four regular enemies,
Paper Dragon form families, nine branch-safe panel pairs, save v25, and thirteen
developer profiles. Exact final strict visual/animation, enemy-frame, balance,
test, build, render, original-resolution, and live-QA results are intentionally
recorded only in `docs/CH8_PRODUCTION_VERIFICATION.md` after those commands run.
