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

The two columns separate **what the code draws today** (Ch.1–3 built) from the
**full-game target** the canon (`docs/GAME_BIBLE.md`, `src/data/chapters.ts`)
commits to. "Author everything" means the right column.

> **Producing it in parallel?** This whole job is split into 17 standalone work
> packages in [`docs/asset-packages/`](./asset-packages/INDEX.md) — one brief per
> agent, each with its own image checklist, sizes, and wiring. Start there.

| Category | In code today | Full-game target | Notes |
|---|---:|---:|---|
| Opening / title / framing screens | ~12 | ~12 | logo, title, app icon, name entry, save slots, boot |
| Cutscene panels | ~8 (Ch.1) | **~80** | §A6 beats + travel set-pieces, ~8/chapter ×10 |
| Overworld characters (8-dir) | **47** | **~140** | 5 heroes done; ~10–15 new NPCs per unbuilt chapter |
| Hero battle busts | 5 × 18 frames | 5 × 18 | all 5 heroes already exist |
| Hero battle-stage battlers | 5 × 14 frames | 5 × 14 (× weapon) | all 5 heroes exist; weapon variants optional |
| **Enemies** (× 3 wear each) | **35** (=105 imgs) | **200** (=600 imgs) | §A7 law: 20/chapter ×10 — see §18 |
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
almost all in the **seven unbuilt chapters (Ch.4–10)** — see **§18**, which is
the part not represented anywhere in the current `assets/art/` tree. Item and
ability icons are the exception: the registries already anticipate all ten
regions, so that 469/92 work mostly stands for the whole game.

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

## 18. Future & unbuilt content — Chapters 4–10

This is the part **not present in `assets/art/` at all today.** METEOR FALLS is
a ten-chapter, ten-region world tour chasing the **Ten Embers** to Mars
(`docs/GAME_BIBLE.md` §A6; `CHAPTER_MANIFESTS` in `src/data/chapters.ts`).
Chapters 1–3 are `shipped`; **Chapters 4–10 are `unlanded`** — designed in canon
but with no art. Each unbuilt chapter needs a complete region art set.

### The ten chapters

| Ch | Region | Status | Boss (HP) | Settlements | Travel in |
|---:|---|---|---|---|---|
| 1 | USA — Otterbrook / Brickton | **shipped** | Titanic Tick (450) | otterbrook, brickton | — |
| 2 | South America — Puerto Sol / Valle Dorado | **shipped** | Idol of the Gilded Grin (980) | puerto_sol, valle_dorado | banana boat |
| 3 | England — Foggybottom | **shipped** | Headmaster Mainframe (1600) | foggybottom | biplane "Lucille" |
| 4 | Norway — Kvisthavn / Lilleby | **unbuilt** | The Whisperwig (1900) | kvisthavn, lilleby | biplane |
| 5 | Minimus — Minimus Major | **unbuilt** | Whiskerzilla (2150) | minimus_major | biplane |
| 6 | Africa — Zanzibel | **unbuilt** | The Laughing Sphinx (2300) | zanzibel | biplane |
| 7 | India — Chandrapore | **unbuilt** | Cobra Raja (3200) | chandrapore | night train |
| 8 | China — Lotus Harbor | **unbuilt** | The Paper Dragon (4100) | lotus_harbor | riverboat + yak |
| 9 | Romania — Valea Stelelor | **unbuilt** | Count Hoaxula (5300) | valea_stelelor | Orient Less-Express |
| 10 | Alaska → Hawaii → Mars | **unbuilt** | **The Hush (6000)** + Frost Sentinel + Tiki Magma Golem | aurora_station, mauna_lani | snowcat → rocket |

### Per-chapter art set (repeat for each of Ch.4–10)

Each unbuilt chapter needs, at minimum:

- [ ] **Region tileset** — ground/wall/floor/water cells in that biome (fjord,
      hedgerow, bazaar, spore forest, castle, ice/lava/Mars…). ~10–16 new tiles.
- [ ] **Dungeon art** — the Resonance Site (e.g. "The Sleeper's Spine", "The
      Laughing Ruins", "Castle Hoaxula") — walls, props, set dressing.
- [ ] **Settlement(s)** — landmark facades + generic buildings in the region
      style (`spire-canton`, `bazaar-port`, `painted-gates`, `fog-stone`).
- [ ] **NPC roster (8-dir)** — townsfolk, shopkeepers, quest-givers. ~10–15 per
      chapter, same 24×32 / 8-direction contract as §3.
- [ ] **Enemy roster — 20 enemies × 3 wear = 60 images** (see ecosystem below).
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

## Recommended production order

The art that's already authored covers leads + NPCs + Otterbrook + Ch.1–3
enemies. Two tracks run in parallel: **(A) finish the global art** (icons, UI,
font, polish for already-shipped chapters) and **(B) build the seven unbuilt
chapters** (§18), one region at a time.

**Track A — global, most visible payoff first:**

1. **Opening + title + Ch.1 cutscene panels** (first impression).
2. **Item icons** (469 — the biggest visible volume; reused everywhere, all regions).
3. **Ability icons** (92) + status icons (12) + battle FX.
4. **Full character frames** (real walk/run/idle, not just 8 static).
5. **UI chrome + font + glyph banners.**
6. **Vehicles, weapons/charms, minigame art.**

**Track B — per unbuilt chapter (Ch.4 → Ch.10), each as one bundle:**

For each region, deliver the §18 per-chapter set together — tileset, town
facades, NPCs, **20-enemy roster (×3 wear)**, boss, battle background, cutscene
panels, regional home + vehicle. Do them in chapter order (4→10) so the game
becomes playable region by region. **Save the Mars finale (Ch.10) for last** —
its three bosses, caller portraits, and Homesong UI are the art centerpiece.

> The single biggest line item across everything is the **§A7 enemy roster:
> ~165 unbuilt enemies × 3 wear ≈ 495 images.** Plan capacity around it.

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
