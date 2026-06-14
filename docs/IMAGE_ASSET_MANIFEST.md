# Image Asset Manifest — "Author Everything"

This is the complete, start-to-finish list of every image METEOR FALLS needs if
we drop the procedural-only rule (ADR-002, "zero binary assets") and ship
authored art for **everything** — opening screen, cutscenes, characters,
enemies, world, items, abilities, UI, font, and the minigames.

It is organized so you can produce art category by category. Each section gives:

- **What** the images are and where they appear
- **How many** (exact counts pulled from the live registries)
- **Size / format** the engine currently expects
- **Naming** convention the runtime bridge (`src/spritegen/authored.ts`) keys off
- **Source of truth** — the code file that defines the canonical list

Literal id checklists for the big sets live in [`docs/asset-lists/`](./asset-lists/).

> **Scale note.** The game currently renders into a **400×225** framebuffer
> (`GAME_W/GAME_H` in `src/spritegen/index.ts`) with nearest-neighbor scaling.
> All "engine size" numbers below are that low-res target. If we also raise the
> render resolution (the separate "hi-res rework" track), every size here scales
> up by the chosen factor — author at the **highest** resolution you can and let
> the pipeline downscale, so the same masters survive a resolution bump.

---

## 0. Totals at a glance

| Category | Count (approx.) | Notes |
|---|---:|---|
| Opening / title / framing screens | ~12 | logo, title, app icon, name entry, save slots, boot |
| Opening + per-chapter cutscene panels | ~40+ | Ch.1 alone has ~8 beats; grows per chapter |
| Overworld characters (8-dir) | **47** | 5 heroes + 42 NPCs — see appendix |
| Hero battle busts | **5 × 18 frames** | the in-battle "cards" |
| Hero battle-stage battlers | **5 × 14 frames** | (× weapon-class variants) |
| Enemy families | **35 × 3 wear = 105** | + boss forms / swarm minis |
| Bosses (bespoke) | **8** | folded into enemy art today |
| World tiles | **53** | one 16×16 cell each |
| Props / furniture / set pieces | **~70** | trees, beds, ATMs, payphones… |
| Building facades / landmarks | **~30** | houses, shops, chapel, city catalog |
| Battle backgrounds | **~15** | one per area family |
| Item icons | **469 items** (~250 distinct shapes) | see appendix |
| Ability icons | **92** | see appendix |
| Battle FX / flair glyphs | **~40** | elements × hit results |
| Status-effect icons | **12** | sleep, burn, frozen… |
| UI chrome | **~25** | window skins, d-pad, buttons, cursor, odometer… |
| Font | **1 glyph sheet** + 8 emoji glyphs | full character set |
| Area title banners (glyph scripts) | **15** | decorative per-region wordmarks |
| Vehicles | **14** + boats | overworld + dealership |
| Held weapons / charms | **~90** | battle-stage hand art |
| Minigame: Hoops | **~10** | athletes, ball, hoop, court, bleachers |
| Minigame: Golf / Links | **~25** | golfers, 18 hole textures, flag, ball |
| Minigame: Arcade | **~7** | ship, moth, rock, saucer, corndog, bolt |

**Order-of-magnitude total: ~1,400–1,600 individual images** (counting every
animation frame and wear variant). The bulk is item icons (469), enemy frames
(105+), and character sheets (47). See the priority order in §16.

---

## 1. Opening / title / framing screens

The first thing the player sees, plus the wrapper screens.

| Image | Where | Engine size | Source of truth |
|---|---|---|---|
| Studio/boot splash | `BootScene` | 400×225 | `src/scenes/BootScene.ts` |
| Title logo / wordmark | `TitleScene` | ~300×120 | `src/spritegen/ui.ts` `drawLogo`, `drawTitleArt` |
| Title background art | `TitleScene` | 400×225 | `src/scenes/TitleScene.ts` |
| Android app icon | launcher | 512×512 + mipmaps | `src/spritegen/ui.ts` `drawAppIcon` |
| Splash art (Android) | native | 1080×1920-ish | `npm run art:appart` output |
| Name-entry background | `NameEntryScene` | 400×225 | `src/scenes/NameEntryScene.ts` |
| Save-slot frame / cards | `SaveSlotsScene` | 400×225 | `src/scenes/SaveSlotsScene.ts` |
| Links / external screen | `LinksScene` | 400×225 | `src/scenes/LinksScene.ts` |

## 2. Cutscenes

Story beats are scripted in the scenes (`OverworldScene.ts` §"cutscenes (Ch.1
per §A6 / ADR-007)" around line 3476, plus `BattleScene` intros). Today they're
staged from existing sprites; authoring them means **full-screen cinematic
panels**.

**Chapter 1 known beats** (the shipped slice): the 2 AM meteor, Otterbrook at
night, Hickory Hill, Glint's prophecy, THE TITANIC TICK reveal, the first
Heartlight, the bug zapper, the phone call to Dad. Budget **~8 panels** for Ch.1.

The full game spans many chapters (`maps.ts`, `maps_ch2.ts`, `maps_ch3.ts` and
the `docs/chapters/` drafts → **208 maps** across regions). Each chapter has a
similar handful of cinematic beats. Canon beats live in `docs/GAME_BIBLE.md`
(§A6) — use it as the cutscene shot list. Budget **~40+ panels** game-wide.

Format: full-frame **400×225** (or higher if we lift resolution), one PNG per
panel; multi-panel beats are just numbered sequences.

## 3. Overworld characters (8-direction)

Walking sprites for every actor. **47 total** (5 heroes + 42 NPCs).

- **Engine size:** 24×32 per frame.
- **Current contract:** 8 static facings expanded to a 46-frame sheet by the
  bridge. **Production target** (per `docs/GRAPHICS_ASSET_ROLLOUT.md`): real
  frames — 4 cardinal + 4 diagonal **walk** loops, the same 8 **run** loops,
  plus **idle breathe** and **idle blink** = up to 46 authored frames each.
- **Facing order (must match):** down, down-left, left, up-left, up, up-right,
  right, down-right (counter-clockwise from front).
- **Naming:** `assets/art/characters/<id>_8dir_24x32.png`.
- **Source of truth / full list:** [`asset-lists/characters_8dir.txt`](./asset-lists/characters_8dir.txt);
  wired in `NPC_CHARACTER_ART` / `HERO_ART` in `src/spritegen/authored.ts`.

> Heroes use internal ids: Jay=`rex`, Mia=`faye`, Milo=`milo`, Pippa=`pippa`,
> Dorin=`dorin`.

## 4. Hero battle busts (the "cards")

The character portraits sitting above each HP/PP box in battle.

- **5 heroes × 18 frames**, 32×32 each, 4 columns.
- **Frame order:** idleA, idleB, lunge, castA, castB, pray, gadget, rummage,
  munch, guard, hurt, nervousA, nervousB, down, cheerA, cheerB, windedA, windedB.
- **Naming:** `assets/art/busts/<jay|mia|milo|pippa|dorin>_bust_18_32x32.png`.
- **Source of truth:** `applyAuthoredBustSheet` in `src/spritegen/authored.ts`.

## 5. Hero battle-stage battlers

The small figures that step onto the stage to swing / cast / pray / throw / aim.

- **5 heroes × 14 frames**, 28×36 each.
- Multiply by **weapon class** if we want per-weapon hands (classes: `bat`,
  `pan`, `rifle`, `beads`, `fist` — see `weaponClassOf` in `spritegen/weapons.ts`).
- **Naming:** `assets/art/battlers/<hero>_battler_14_28x36.png`.
- **Source of truth:** `applyAuthoredBattlerSheet` in `src/spritegen/authored.ts`.

## 6. Enemies

Battle sprites with three wear stages each (fresh → scuffed → wrecked).

- **35 families × 3 wear = 105 images**, plus boss forms and swarm "mini"
  variants (`drawCicadaMini`, `drawSlugMini`, … in `spritegen/enemies.ts`).
- **Engine size:** flexible; scaled to fit (`fitEnemySprite`, max ~112px normal
  / ~132px boss). Author large — the current authored set runs up to 683×768.
- **Naming:** `assets/art/enemies/battle_<family>.png`,
  `..._w1.png`, `..._w2.png`.
- **Source of truth / full list:** [`asset-lists/enemy_families.txt`](./asset-lists/enemy_families.txt);
  wired in `ENEMY_BATTLE_ART` in `src/spritegen/authored.ts`.

## 7. Bosses (bespoke)

Per the rollout doc, bosses should be **bespoke art, not enlarged enemies**.
Currently folded into the enemy set: `titanic_tick`, `headmaster_mainframe`,
`the_invigilator`, `head_prefect`, `boiler_golem`, `gilded_grin`(+`_hollow`),
plus chapter bosses in `src/data/bosses.ts` and `src/data/drafts/`. Each wants
its own large multi-frame sheet. Budget **8+**, growing per chapter.

## 8. World tiles

The 16×16 ground/wall/floor cells.

- **53 tiles**, 16×16 each, packed in one strip.
- **Naming:** one sheet `assets/art/world/otterbrook_tiles_16.png`; the bridge
  maps named cells by `WORLD_TILE_ART.names`.
- **Source of truth / full list:** `TILESET` in `src/spritegen/tiles.ts` (see
  appendix-worthy names: grass, road, sidewalk, office, bus, arcade, sea, sand,
  jungle, pyramid…). Tiles span every region, so this grows with chapters.

## 9. Props, furniture & set pieces

Free-standing overworld objects (drawn by the `draw*` functions in
`spritegen/tiles.ts` and `spritegen/ch2.ts`). **~70**, e.g.: trees ×3, pine,
sign, bed, desk, sofa, counter, dresser, TV, bookshelf, floor lamp, picnic
table+blanket, phone table, bug zapper, meteor rock, lemonade stand, payphone,
dumpster, bench, hydrant, planter, telephone pole, trash can, parking meter,
newspaper box, elevator, water cooler, copier, ATM, shop shelf, arcade cabinet,
cola fridge, cot, fountain, market stall, banana boat, idol shrine, pyramid
gate, crate, gangplank, gift box…

- **Naming:** `assets/art/world/props/<name>.png` (see `WORLD_PROP_ART`).
- **Size:** variable, native object size.

## 10. Building facades / landmarks

House and shop fronts plus civic landmarks.

- Currently: `house_rex`, `house_chad`, `house_a/b`, `drugstore`, `arcade`,
  `chapel`, `valle_house_b` (in `WORLD_PROP_ART/facades`), plus the procedural
  **city catalog** + bespoke landmark facades in `spritegen/buildings.ts`
  (`CITY_CATALOG`, `BESPOKE_AREA_FACADES`, `LANDMARK_FACADE_SPRITES`).
- Budget **~30** across all regions.
- **Naming:** `assets/art/world/facades/<name>.png`.

## 11. Battle backgrounds

Each area family has a battle backdrop (`first.bg` in `BattleScene.ts` ~line
638, today a shader-driven palette pair). Budget **~15** full-frame backdrops,
one per region (Otterbrook, city, school/England, jungle, pyramid, sea, etc.).

## 12. Item icons

Inventory / shop / battle item art.

- **469 items**, mapping to **~250 distinct icon shapes** (some shared).
- **Engine size:** small (≈16×16 cell).
- **Source of truth / full list:** [`asset-lists/item_icons.txt`](./asset-lists/item_icons.txt)
  (all 469 ids); shape keys in `ITEM_ICON` (`src/spritegen/icons.ts`).
- **Decision point:** one icon per *item* (469) for max fidelity, or one per
  *icon key* (~250) reusing shapes. Recommend per-icon-key first, bespoke for
  hero/story items.

## 13. Ability icons + battle FX

- **Ability icons: 92** — [`asset-lists/ability_icons.txt`](./asset-lists/ability_icons.txt)
  (`src/data/abilities.ts`). Used in the battle menu and PSI/skill lists.
- **Battle FX / flair glyphs: ~40** — element × result spritelets
  (`FLAIR_BY_ELEMENT`, `FLAIR_BY_RESULT` in `spritegen/flair.ts`), the little
  bursts/sparks on a hit.

## 14. Status-effect icons

**12 badges**, drawn on busts/battlers: asleep, burn, crying, exposed, frozen,
gilded, hushed, marked, paralyzed, puppet, rattled, shield
(`src/scenes/BattleScene.ts`). Tiny (≈8×8) overlay icons.

## 15. UI chrome & font

| Asset | Count | Source |
|---|---:|---|
| Window/box skins (flavors) | several | `WINDOW_FLAVORS` in `spritegen/ui.ts` |
| Touch d-pad | 1 | `drawDpad` |
| Round buttons (A/B) | 2 | `drawRoundButton` |
| Start pill | 1 | `drawStartPill` |
| Hand cursor | 1 | `drawHandCursor` |
| Rolling ATM odometer strip | 1 | `drawOdometerStrip` |
| Phone / sun / misc HUD icons | ~5 | `drawPhoneIcon`, `drawSunIcon` |
| **Font glyph sheet** | 1 sheet | `makeFontSheet` (`spritegen/font.ts`) — full character set, `FONT_CELL_W×H` |
| Inline emoji glyphs | 8 | `EMOJI_GLYPH` (`spritegen/font.ts`) |
| Area title banners | **15** | glyph scripts in `spritegen/glyphforge.ts` (accent, colonial, cursive, deco, fraktur, frost, heraldic, hush, ramp, runic, seal, slavonic, talavera, tiki, barscript) |

> The font is the one asset I'd think hardest about replacing — the whole UI is
> laid out around the current `retro` bitmap metrics. If you author a font,
> match the cell size or expect to re-tune text layout.

## 16. Vehicles & held weapons

- **Vehicles: 14** dealership models + boats/llama
  (`src/data/dealership.ts`, `VEHICLE_SPECS` in `spritegen/vehicles.ts`),
  each needing multi-view frames (`carViews`).
- **Held weapons / charms: ~90** hand-art keys (`WEAPON_ART` in
  `spritegen/weapons.ts`) — bats, pans, rifles, beads, and dozens of accessory
  charms drawn into the battler's hand.

## 17. Minigames

- **Hoops (basketball):** athletes, ball, hoop/backboard, court tiles, cage
  mesh, bleachers, mural, chalkboard (`spritegen/athletes.ts`, court draws in
  `spritegen/tiles.ts`). ~10 assets.
- **Golf / Links:** golfer frames, **18 hole textures** (+ holes appendix),
  pin flag, golf ball, splash/sand FX, links poster (`spritegen/golfers.ts`,
  `src/data/links.ts`). ~25 assets.
- **Arcade:** ship, moth, rock, saucer, corndog, bolt, scanline overlay
  (`spritegen/arcade.ts`). ~7 assets.

---

## Recommended production order

The art that's already authored covers leads + NPCs + Otterbrook + Ch.1 enemies.
To extend "author everything" with the most visible payoff first:

1. **Opening + title + Ch.1 cutscene panels** (first impression).
2. **Item icons** (469 — the biggest visible volume; reused everywhere).
3. **Ability icons** (92) + status icons (12) + battle FX.
4. **Remaining enemies & bosses** per chapter.
5. **Remaining characters** (full walk/run/idle frames, not just 8 static).
6. **World tiles + props + facades** per region.
7. **Battle backgrounds** per region.
8. **UI chrome + font + glyph banners.**
9. **Vehicles, weapons/charms, minigame art.**

## How art gets wired in

Every authored PNG is registered through the runtime bridge,
`src/spritegen/authored.ts` (`preloadAuthoredArt` → `applyAuthoredArt`), which
swaps the generated texture for the authored one at boot. Adding a new asset =
drop the PNG in the right `assets/art/...` folder and add one line to the
matching list in that file. As coverage approaches 100%, the procedural
generators can be retired generator-by-generator (they stay as fallback until
then).

## Performance

Authoring everything multiplies texture memory and boot-time decode (these PNGs
load eagerly at boot today). See the analysis in this session: the wins are
(a) free the redundant `authored_*` source textures after they're copied to
canvases, (b) lazy-load per chapter instead of all-at-boot, and (c) keep the
211 MB of `masters/`+`drafts/` out of the shipped build (Vite already excludes
them, but they bloat the repo). Worth doing before the asset count climbs.
