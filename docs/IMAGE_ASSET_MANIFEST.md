# Image Asset Manifest — "Author Everything"

> **Chapter 1 production amendment (ADR-145, 2026-07-14):** Chapter 1's
> expanded enemy base/wear/overworld families are authored, not queued gray
> boxes. Titanic Tick is 200 HP and its contextual reveal is the deepest
> Hickory Hill cave arena (`oak_heart`) during Hush morning, reached through
> Pemberton, Hodgkin's mower request, the shared Trail Key, the walk-through
> shed, `oak_roots`, and `oak_hollow`--never at the outdoor Heart Oak.
> First Heartlight is the post-Manager Mom-payphone beat with Jay and Mia. At
> the start of the pass, only `meteor_2am_4x` and
> `hickory_hill_4x` were proven ordinary-play panels; registry membership alone
> is not a live-use claim. Current provenance, context, and crop evidence lives
> in `output/ch1_asset_contacts/` and the Chapter 1 production record.
> The current implementation adds new Mom-payphone, First Heartlight, and
> Hickory Hill cave Tick panels, each with a retained generated source and a
> 1600x900 runtime derivative, plus ordinary-play consumers and reviewed native
> and exact-viewport crop contacts. Real 1600x900 runtime captures for
> `meteor-night`, `hush-morning`, and `restored-day` are accepted as Contact 23;
> the generator requires the three source captures and does not manufacture
> phase evidence by tinting a still. Borden, Realtor, and Waitress now have
> authored 46-frame runtime/master sheets, deterministic source and review
> hashes in
> `assets/art/masters/generated/ch1-expanded/npc-walk-atlas-provenance.json`,
> and named rebuilds (`npm run ch1:npc:borden`, `npm run ch1:npc:realtor`,
> `npm run ch1:npc:waitress`, or the aggregate `npm run ch1:npcs:walks`).
> Otterbrook's implemented exterior composition
> contains 47 distinct physical facades (state twins collapsed), measuring
> 3.104/3.844/3.75/5.31 Jay-heights at min/mean/median/max; homes stay in the
> 3.6-3.9 band.

> ✅ **This is now the way (ADR-109).** Authored PNGs are canonical: produce art
> at the `assets/art/masters` resolution and wire it into
> `src/spritegen/authored.ts`. The old `npm run art:*` render scripts are parked
> in `dormant/sprite-tools/` (except `art:appart`, the Android icon copier).
> Full workflow: [ART_PIPELINE.md](ART_PIPELINE.md).

> **Chapter 8 production amendment (ADR-143, 2026-07-13):** China is no
> longer unbuilt. Its four production maps, eight Lotus source/promoted facade
> pairs, seven named NPC sheets, four-regular-enemy package, 45,000-HP Paper
> Dragon (including distinct BURNING wear), Spore background, riverboat/Yak,
> and branch-safe cutscene panels are live. The old 4,100-HP and twenty-enemy
> PKG-15 claims are superseded; see
> [`asset-packages/PKG-15-ch8-China.md`](asset-packages/PKG-15-ch8-China.md).

> **Chapter 9 production amendment (ADR-144, 2026-07-14):** Romania is no
> longer a blank/unbuilt art package. Its four-map production contract retains
> the Romania strip, eight Valea facades, four strict-clean NPC sheets, Castle
> background, focused five-regular-enemy/minis package, both Count forms, train,
> and existing compositions. Nine live villagers reuse the four sheet
> identities, and Count is **95,000 HP**. The closed remediation ships fourteen
> Dorin-correct, branch-truthful contextual runtime panels with fourteen source
> masters plus eleven distinct wear corrections with eleven generated masters;
> see
> [`asset-packages/PKG-16-ch9-Romania.md`](asset-packages/PKG-16-ch9-Romania.md).

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

> **Scale note (ADR-110).** The game renders into a **1600×900** framebuffer
> (`GAME_W/GAME_H` in `src/spritegen/index.ts`, `ART_SCALE = 4`) with
> nearest-neighbor scaling. The "engine size" numbers below are the **×1 native
> base**; the runtime cell is **native × 4** (tile 16→**64**, char 24×32→**96×128**,
> bust 32×32→**128×128**, battler 28×36→**112×144**, sport 32×40→**128×160**).
> Full-screen art (boot/title/name-entry/save-slots/links backgrounds and cutscene
> panels) is authored at **1600×900**. Author at the **highest** resolution you can
> and let the pipeline downscale, so the same masters survive a resolution bump.

---

## 0. Totals at a glance

The two columns separate **what the current production registry draws today**
from the **full-game target** the canon (`docs/GAME_BIBLE.md`,
`src/data/chapters.ts`) commits to. "Author everything" means the right column;
rows not touched by a chapter close remain historical planning snapshots.

> **Producing it in parallel?** This whole job is split into 17 standalone work
> packages in [`docs/asset-packages/`](./asset-packages/INDEX.md) — one brief per
> agent, each with its own image checklist, sizes, and wiring. Start there.

| Category | In code today | Full-game target | Notes |
|---|---:|---:|---|
| Opening / title / framing screens | ~12 | ~12 | logo, title, app icon, name entry, save slots, boot |
| Cutscene panels | live multi-chapter registry through Ch.9 | **~80** historical target | chapter amendments supersede the old Ch.1-only snapshot; Ch.9 alone closes 14 contextual outputs plus retained gallery/reference art |
| Overworld characters (8-dir) | **100** | **~140** | historical target; current registry includes four strict-clean Valea sheets, and ADR-144 rejects a 10–15-NPC Chapter 9 quota |
| Hero battle busts | 5 × 18 frames | 5 × 18 | all 5 heroes already exist |
| Hero battle-stage battlers | 5 × 14 frames | 5 × 14 (× weapon) | all 5 heroes exist; weapon variants optional |
| **Enemies** (× 3 wear each) | **35** (=105 imgs) | **200** (=600 imgs) | historical baseline/target; accepted focused rosters override per-chapter quotas — see §18 |
| Bosses (bespoke) | **3** | **13** | one per chapter + 3 in the Ch.10 finale |
| World tiles | **53** | **~120** | each region adds its own ground/wall/floor set |
| Props / furniture / set pieces | **~70** | **~130** | region-specific props per chapter |
| Building facades / landmarks | **~30** | **~80** | each region's town + landmarks |
| Battle backgrounds | **~5** | **~12** | one per region family |
| Item icons | **469** (~250 shapes) | **469+** | already spans all 10 regions' foods — mostly done |
| Ability icons | **92** | **92+** | already spans the full hero kit |
| Battle FX / flair glyphs | **~40** | **~40** | elements × hit results |
| Status-effect icons | **12** | **12** | sleep, burn, frozen… |
| UI chrome | **~25** | **~30** | + Star Locket / Homesong UI, phone/caller UI |
| Font | 1 sheet + 8 emoji | 1 sheet + 8 emoji | full character set |
| Area title banners (glyph scripts) | **15** | **15** | one per region voice |
| Vehicles | **14** + boats | **~25** | + per-region road cars & travel craft |
| Travel set-piece craft | 3 | **~8** | boat, biplane, 2 trains, riverboat, snowcat, rocket |
| Held weapons / charms | **~90** | **~90** | spans the full charm catalog |
| Regional homes (property) | a few | **15** | the §"cozy" property arc, one per region |
| Finale callers (credits art) | 0 | **~30+** | every helped NPC who phones Mars — see §18 |
| Minigame: Hoops | ~10 | ~10 | athletes, ball, hoop, court, bleachers |
| Minigame: Golf / Links | ~25 | ~25 | golfers, 18 hole textures, flag, ball |
| Minigame: Arcade | ~7 | ~7 | ship, moth, rock, saucer, corndog, bolt |

**Built today: ~1,400–1,600 images. Full "author everything" game:
~3,000–3,500 individual images** (every frame + wear variant). The growth is
mostly in remaining future chapter/finale work — see **§18**. Chapters 4, 6,
7, 8, and 9 now have production-world art records and must not be counted as
blank packages. Item and
ability icons are the exception: the registries already anticipate all ten
regions, so that 469/92 work mostly stands for the whole game.

---

## 1. Opening / title / framing screens

The first thing the player sees, plus the wrapper screens.

| Image | Where | Engine size (runtime) | Source of truth |
|---|---|---|---|
| Studio/boot splash | `BootScene` | 1600×900 | `src/scenes/BootScene.ts` |
| Title logo / wordmark | `TitleScene` | ~1200×480 | `src/spritegen/ui.ts` `drawLogo`, `drawTitleArt` |
| Title background art | `TitleScene` | 1600×900 | `src/scenes/TitleScene.ts` |
| Android app icon | launcher | 512×512 + mipmaps | `src/spritegen/ui.ts` `drawAppIcon` |
| Splash art (Android) | native | 1080×1920-ish | `npm run art:appart` output |
| Name-entry background | `NameEntryScene` | 1600×900 | `src/scenes/NameEntryScene.ts` |
| Save-slot frame / cards | `SaveSlotsScene` | 1600×900 | `src/scenes/SaveSlotsScene.ts` |
| Links / external screen | `LinksScene` | 1600×900 | `src/scenes/LinksScene.ts` |

## 2. Cutscenes

Story beats are scripted in the scenes (`OverworldScene.ts` §"cutscenes (Ch.1
per §A6 / ADR-007)" around line 3476, plus `BattleScene` intros). Today they're
staged from existing sprites; authoring them means **full-screen cinematic
panels**.

**Chapter 1 known beats** (the shipped slice): the 2 AM meteor, Otterbrook at
night, Hickory Hill, Glint's prophecy, the cave-arena TITANIC TICK reveal, the
post-Manager First Heartlight, the bug zapper, and Mom's Brickton payphone
call. Budget **~8 panels** for Ch.1; count a panel as live only when an
ordinary-play consumer and its conditions are proven.

The full game spans many chapters (`maps.ts`, `maps_ch2.ts`, `maps_ch3.ts` and
the `docs/chapters/` drafts → **208 maps** across regions). Each chapter has a
similar handful of cinematic beats. Canon beats live in `docs/GAME_BIBLE.md`
(§A6) — use it as the cutscene shot list. Budget **~40+ panels** game-wide.

Format: full-frame **1600×900**, one PNG per
panel; multi-panel beats are just numbered sequences.

## 3. Overworld characters (8-direction)

Walking sprites for every actor. **48 total** (5 heroes + 42 human NPCs + Glint special).

- **Engine size:** 96×128 per frame (24×32 native × ART_SCALE 4).
- **Current contract:** a full 46-frame authored sheet. Legacy 8-static-facing
  expansion is fallback only. Real frames include 4 cardinal + 4 diagonal
  **walk** loops, the same 8 **run** loops, plus **idle breathe** and
  **idle blink**.
- **Facing order (must match):** down, down-left, left, up-left, up, up-right,
  right, down-right (counter-clockwise from front).
- **Naming:** `assets/art/characters/<id>_anim_46_4x.png`.
- **Source of truth / full list:** [`asset-lists/characters_8dir.txt`](./asset-lists/characters_8dir.txt);
  wired in `NPC_CHARACTER_ART` / `HERO_ART` in `src/spritegen/authored.ts`.

> Heroes use internal ids: Jay=`rex`, Mia=`faye`, Milo=`milo`, Pippa=`pippa`,
> Dorin=`dorin`.

## 4. Hero battle busts (the "cards")

The character portraits sitting above each HP/PP box in battle.

- **5 heroes × 18 frames**, 128×128 runtime each (32×32 native × ART_SCALE 4), 4 columns.
- **Frame order:** idleA, idleB, lunge, castA, castB, pray, gadget, rummage,
  munch, guard, hurt, nervousA, nervousB, down, cheerA, cheerB, windedA, windedB.
- **Naming:** `assets/art/busts/<jay|mia|milo|pippa|dorin>_bust_18_32x32.png`.
- **Source of truth:** `applyAuthoredBustSheet` in `src/spritegen/authored.ts`.

## 5. Hero battle-stage battlers

The small figures that step onto the stage to swing / cast / pray / throw / aim.

- **5 heroes × 14 frames**, 112×144 runtime each (28×36 native × ART_SCALE 4).
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

The ground/wall/floor cells — 64×64 runtime (16×16 native × ART_SCALE 4).

- **53 tiles**, 64×64 runtime each (16×16 native), packed in one strip.
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
- **Chapter 3 production kit (2026-07-12):** two original chroma-key source
  banks, `assets/art/masters/world/ch3-outdoor-landmarks-source.png` and
  `ch3-machinery-stones-source.png`, slice to 16 registered runtime props:
  `ch3_viaduct_arch`, `ch3_roman_culvert`, `ch3_greenhouse_wreck`,
  `ch3_cricket_pavilion`, `ch3_school_gate`, `ch3_porter_lodge`,
  `ch3_telegraph_pole`, `ch3_lucille_cockpit`, `ch3_lucille_window`,
  `ch3_cargo_net`, `ch3_fog_engine`, `ch3_valve_manifold`, `ch3_menhir`,
  `ch3_trilithon`, `ch3_spring`, and `ch3_academy_main`. Semantic keys and
  native display dimensions are pinned in `src/spritegen/authored.ts`; map
  solids remain authored beside placement in `src/data/maps_ch3.ts`. The
  source strips are retained; `tools/slice-prop-strip.cjs` is the reproducible
  slicer. No reference image or third-party asset ships with the kit.

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

## 18. Later-chapter production inventory — Chapters 4–10

METEOR FALLS is
a ten-chapter, ten-region world tour chasing the **Ten Embers** to Mars
(`docs/GAME_BIBLE.md` §A6; `CHAPTER_MANIFESTS` in `src/data/chapters.ts`).
This table mixes shipped production slices with future regions; executable
chapter status and the per-chapter verification docs are authoritative.

### The ten chapters

| Ch | Region | Status | Boss (HP) | Settlements | Travel in |
|---:|---|---|---|---|---|
| 1 | USA — Otterbrook / Brickton | **production-polished** | Titanic Tick (**200**) | otterbrook, brickton | — |
| 2 | South America — Puerto Sol / Valle Dorado | **shipped** | Idol of the Gilded Grin (980) | puerto_sol, valle_dorado | banana boat |
| 3 | England — Foggybottom / Wintermoor | **shipped** | Headmaster Mainframe (750) | foggybottom | biplane "Lucille" |
| 4 | Norway — Kvisthavn / Lilleby | **production world shipped** | The Whisperwig (1800) | kvisthavn, bootstep_moor, lilleby, spine_hand, spine_shoulder, spine_ear | biplane |

Chapter 4's production rebuild reuses the retained Norway masters, authored
battlers/minis/NPCs/facades, both battle backdrops, Sleeper props,
`giant_bootprint_snow`, and the Bridge Berry's derived mini. The Norway strip
now registers all sixteen cells; live maps consume its ground, path, water,
wall, shore, frozen-pond, boardwalk, and masonry materials. No procedural or
placeholder bitmap was introduced.
| 5 | Minimus — Minimus Major | **unbuilt** | Whiskerzilla (2150) | minimus_major | biplane |
| 6 | Africa — Zanzibel | **production world shipped** | The Laughing Sphinx (9000) | zanzibel, savanna_run, laughing_ruins, sphinx_chin | biplane |
| 7 | India — Chandrapore | **production world shipped** | Cobra Raja (**20000**) | chandrapore, monsoon_road, night_train, palace_throne | biplane + night train |
| 8 | China — Lotus Harbor | **production world shipped** | The Paper Dragon (**45000**) | lotus_harbor, bamboo_road, spore_forest, mt_shu_temple | riverboat + yak |
| 9 | Romania — Valea Stelelor | **production world and art remediation shipped** | Count Hoaxula (**95000**) | valea_stelelor, old_road, castle_hoaxula, stone_brow_monastery | Orient Less-Express |
| 10 | Alaska → Hawaii → Mars | **unbuilt** | **The Hush (6000)** + Frost Sentinel + Tiki Magma Golem | aurora_station, mauna_lani | snowcat → rocket |

Chapter 6’s production rollout reuses the registered Africa tile strip, supported
formal-city facade sources, regional NPCs, full enemy wear/mini set, Laughing
Sphinx boss, battle background, seven gallery panels, and shared world props.
No new bitmap was required.

Chapter 7 retains four authored NPC sheets, seven 1600×900 panels, the train,
Cobra Palace background, Cobra Flute, and the focused enemy/boss package. Its new
city package adds four source master banks, fourteen 256×192 source facades,
fourteen explicit 264px-wide city-scale facades, and the palace-spire prop. See
`docs/asset-packages/PKG-14-ch7-India.md` for the exact inventory.

Chapter 8 retains the China strip, Bamboo/Spore edges, Spore Forest background,
riverboat, Yak Express, four quest-giver sheets, and the focused regular
enemy/boss package. Its production additions include eight explicit Lotus
city-scale facade promotions, three distinct named NPC sheets (Yak Handler,
Lotus Bargeman, Mt. Shu Elder), corrected seven-panel party compositions, two
departed-Pippa panel variants, and distinct Paper Dragon BURNING wear. See
`docs/asset-packages/PKG-15-ch8-China.md` for the exact inventory.

Chapter 9 retains the Romania strip, all eight Valea facade identities, four
strict-clean named NPC sheets, Castle background, five regular-enemy bases and
minis, both Count form bases, the Orient Less-Express, and seven journey plus
one choice compositions. Its nine live villagers reuse the four strict-clean
sheet identities. Production remediation is complete: fourteen
Pippa-present/departed contextual runtime outputs for train, arrival, Buni,
Castle, unmask, monastery, and choice have fourteen source masters; eleven
byte-distinct wear corrections have eleven generated masters. Every new result
and both choice variants retain named source masters; the legacy train and
Ribcage families retain their Git provenance rather than invented master files.
The solo Trial panel remains shared. See
`docs/asset-packages/PKG-16-ch9-Romania.md`.

### Per-chapter art set (historical planning checklist)

Each unbuilt chapter needs, at minimum:

- [ ] **Region tileset** — ground/wall/floor/water cells in that biome (fjord,
      hedgerow, bazaar, spore forest, castle, ice/lava/Mars…). ~10–16 new tiles.
- [ ] **Dungeon art** — the Resonance Site (e.g. "The Sleeper's Spine", "The
      Laughing Ruins", "Castle Hoaxula") — walls, props, set dressing.
- [ ] **Settlement(s)** — landmark facades + generic buildings in the region
      style (`spire-canton`, `bazaar-port`, `painted-gates`, `fog-stone`).
- [ ] **NPC roster (8-dir)** — townsfolk, shopkeepers, quest-givers. The
      historical ~10–15 target applies only where a newer production ADR has not
      frozen a focused cast; ADR-144 retains Chapter 9's four strict-clean Valea
      sheets for its nine live villagers. Same 96×128 runtime (24×32 native) /
      8-direction contract as §3.
- [ ] **Enemy roster — chapter-approved authored roster with complete wear and
      minis.** The twenty-enemy figure is a historical full-game planning target,
      not a per-chapter production gate when a newer ADR freezes a focused set;
      ADR-143 freezes Chapter 8 at four regulars plus Paper Dragon, and ADR-144
      freezes Chapter 9 at five regulars plus Count Hoaxula.
- [ ] **Boss(es)** — bespoke multi-frame sheet, larger than enemies.
- [ ] **Battle background** — the region's arena backdrop.
- [ ] **Cutscene panels** — the chapter's §A6 story beats + the travel-in
      set-piece. ~6–8 panels.
- [ ] **Regional home** — one property/interior for the §"cozy" property arc.
- [ ] **Regional road vehicle(s)** + the travel craft above.

### The §A7 enemy law (this is the big one)

Canon mandates **200 unique enemy types** total (`GAME_BIBLE.md` §A7, lines
1156/1184) — **20 per chapter**, built as a fixed local ecosystem:

> 4 road/field roamers · 3 dungeon specialists · 2 social/urban oddities ·
> 2 rare/high-value · 2 late-chapter pressure enemies · 1 set-piece enemy.

**35 of 200 are built (Ch.1–3).** The remaining **~165 enemies × 3 wear stages =
~495 enemy images** are the single largest unbuilt block. The named bosses for
each are in the table above; the 20-id rosters per chapter are scaffolded as
dev-only drafts (`src/data/drafts/chN/`, `npm run scaffold -- chN`) and promoted
chapter by chapter.

Those counts are a historical planning snapshot, not the current registry
audit. ADR-143 explicitly supersedes the per-Chapter-8 twenty-id expansion and
nonexistent Chapter 8 draft-path assumption: its accepted production set is
four authored regular enemies plus Paper Dragon. ADR-144 does the same for
Chapter 9: five authored regulars plus Count Hoaxula, with no `drafts/ch9`
roster requirement. Use live registries and the enemy-frame audit for current
totals.

### Travel set-pieces

Each chapter is entered by a signature vehicle/cinematic — these are both
overworld craft and cutscene art: **banana boat, biplane "Lucille", night
train, riverboat + yak express, Orient Less-Express, snowcat,** and finally
**Pemberton's rocket "The Long Shot."**

### The Mars finale (Ch.10) — bespoke

The ending is the game's art centerpiece and needs unique assets:

- [ ] **Three boss forms** — Frost Sentinel (Alaska), Tiki Magma Golem (Hawaii),
      and **The Hush** itself (Mars), each bespoke and large.
- [ ] **Mars / Sea of Silence** environment — tileset + backdrop + the rocket
      interior.
- [ ] **The Calling — caller portraits.** In the final battle every side-quest
      NPC the party helped *answers a ringing phone and sends their Vibe.* Base
      callers: **Mom, Dad, Buni, Pemberton, Chad Pickle** — plus one per
      completed quest across all regions (**~30+ caller portraits**). This is
      also the **extended-credits art** (more quests done = more callers).
- [ ] **Star Locket / Homesong UI** — the key-item screen showing Embers 0–10,
      one instrument layer per Ember (`GAME_BIBLE.md` §A9; pause-screen UI).

### Already region-complete (no per-chapter work)

Worth stating so you don't double-count: the **item icons (469)** and **ability
icons (92)** registries already span all ten regions (Norwegian lutefisk,
Romanian sarmale, Chinese mooncakes, African jollof are all present). Those
sets stand for the whole game — only a handful of new story items per chapter
will trickle in.

---

## 19. Animation requirements & frame contracts

**Every authored PNG that replaces an engine-animated texture MUST be a frame
sheet containing all the frames the animation expects — never a single still.**
The engine binds animations to texture frames at boot; a one-frame image where a
sheet is expected reads as a frozen pose (and can crash if frames are missing).

### What the engine animates (frame sheets required)

| Category | Animated how | Frames | Sheet layout | Status |
|---|---|---:|---|---|
| Overworld characters | frame anim: `<id>-idle/walk/run-<dir>` | **46** | 4 cols × 12 rows of 24×32 native = **384×1536 runtime** | 100 registered authored sheets; final Ch8 strict audit 84/100 clean, 0 errors, 0 warnings, 58 assessed hints |
| Hero battle busts | frame anim: idle/cast/pray/hurt… | **18** | 4 cols × 5 rows of 32×32 = **128×160** | ✅ 5 complete |
| Hero stage battlers | frame anim: swing/cast/throw/aim | **14** | 4 cols × 4 rows of 28×36 = **112×144** | ✅ 5 complete |
| Mourning angels (`angel_<id>`) | `*-float` 2-frame loop | **2** | 2 cols of the angel cell | procedural (author ⇒ 2 frames) |
| Glint (`glint-flit`) | 2-frame loop alias | **2** | first two cells of `glint_anim_46_4x.png` | authored special; procedural fallback remains |
| Dog (`dog-walk`/`-left`) | 4-frame (E + W trot) | **4** | — | procedural |
| Picnic songbird | 2 hop frames | **2** | — | procedural |
| Run dust / Ember sparkle / gift box | short FX frame runs | 2–4 | — | procedural |

### What is NOT frame-animated (a single still is correct)

- **Enemies & bosses** — the battle scene gives every foe a floating **breath bob
  via a y-tween** on the static image (`BattleScene` ~line 526). One PNG per wear
  stage (`w0/w1/w2`) is correct; do **not** author per-frame enemy animation
  unless we add a real attack-telegraph sheet later (a deliberate future feature,
  not a current gap).
- **Item / ability / status icons, font, tiles, props, facades, battle
  backgrounds** — static (backgrounds are shader-animated in code, not by frames).
- **Vehicles** — multi-**view** (facing swaps), not multi-frame animation; wheels
  don't spin by frame.

### The frame audit (this pass)

Swept every authored asset on disk against the contract above:

- **Characters:** 100 registered sheets are 384×1536 runtime — full walk + run + idle. The inherited 97-sheet gate was remediated before Chapter 8, and the 100-sheet Chapter 8 strict close completed successfully.
- **Busts:** 5/5 at 128×160 (18 frames). **Battlers:** 5/5 at 112×144 (14 frames).
- **Enemies:** 108 single-frame images — correct (engine-tweened).

**Conclusion: no current image needs animation frames added.** The only loose end
is any orphaned `*_8dir_24x32.png` sheet, superseded by the `*_anim_46_…`
sheets and no longer referenced — safe to delete (a cleanup, not an animation gap).

### Rule for all future authored art

When a package below produces art for an **animated** slot (characters, busts,
battlers, and any new animated prop/FX), ship the **full frame sheet** in the
exact layout above — author every frame, don't hand back a single pose and expect
the bridge to synthesise the cycle. Static slots stay single-image.

## Recommended production order

The art that's already authored covers leads + NPCs + Otterbrook + Ch.1–3
enemies. Two tracks run in parallel: **(A) finish the global art** (icons, UI,
font, polish for already-shipped chapters) and **(B) build the remaining
unbuilt chapter/finale packages** (§18), one region at a time.

**Track A — global, most visible payoff first:**

1. **Opening + title + Ch.1 cutscene panels** (first impression).
2. **Item icons** (469 — the biggest visible volume; reused everywhere, all regions).
3. **Ability icons** (92) + status icons (12) + battle FX.
4. **Full character frames** (real walk/run/idle, not just 8 static).
5. **UI chrome + font + glyph banners.**
6. **Vehicles, weapons/charms, minigame art.**

**Track B — per remaining unbuilt chapter, each as one bundle:**

For each remaining region, deliver the §18 per-chapter set together — tileset,
town facades, NPCs, its accepted authored enemy roster and wear, boss, battle
background, cutscene panels, regional home + vehicle. Do them in play order so
the game becomes playable region by region. Do not reopen Chapters 4, 6, 7, or
8 or 9 as blank art packages. Chapter 9's narrow ADR-144 panel/wear/provenance
remediation is complete. **Save the Mars finale (Ch.10) for last** —
its three bosses, caller portraits, and Homesong UI are the art centerpiece.

> The historical **~165 unbuilt enemies × 3 wear ≈ 495 images** estimate is not
> a current production count or a release quota for focused-roster Chapters 8
> and 9. Re-run live registry/enemy-frame audits before capacity planning.

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
