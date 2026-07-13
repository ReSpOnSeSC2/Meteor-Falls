# CH.4 NORWAY — ART-PASS HANDOFF PROMPT (for the next agent)

> **Historical as of 2026-07-12.** Norway's tile skin, facades, battlers,
> minis, NPC sheets, backdrops, and Spine props are live. The production
> rebuild integrated this authored package without replacement art.

> **Read this whole file before touching anything.** Then read
> `docs/ART_PIPELINE.md`, `/CLAUDE.md`, and `docs/GAME_BIBLE.md` §A6/§A7 (Ch.4).
> The Chapter-4 **data spine is already SHIPPED and GREEN** — your job is the
> **authored-art pass** (ChatGPT → PNG) plus an end-to-end playtest. Do **not**
> rebuild the spine; only add art, repoint sprite keys, and verify.

---

## 0. MISSION

Chapter 4 ("The Fjord That Sleeps", Norway) was landed `unlanded → shipped` on
2026-06-19. It validates, type-checks, passes all 1237 tests, balances
(Whisperwig TTK 6), builds, and the Kvisthavn overworld renders + plays. What
remains is **replacing gray-box placeholder art with authored ChatGPT art** and
**a real playthrough**. All art is AUTHORED PNGs via the **ChatGPT → PNG**
workflow (never procedural code, never a different model — `/CLAUDE.md` rule 1).

**Definition of done for this pass:** every Ch.4 enemy wears its own authored
battler, the six Norway NPCs wear their authored character sheets, the
Kvisthavn/Lilleby authored facades render (not generic houses), and a human/agent
has played Kvisthavn → boss → Heartlight 4 without a soft-lock. `npm run build`,
`npm test`, `npm run validate`, `npm run balance` stay green throughout.

---

## 1. WHAT SHIPPED THIS SESSION (do not redo)

The Ch.4 **content spine**, wired end-to-end. Files touched and what each got:

- **`src/data/enemies.ts`** — 20 Norway enemies + `the_whisperwig` boss (HP 1800,
  weak `volt`, `boss:true`, `mind_immune:true`). Each carries §A7 stats, 2–4 moves,
  a RAW death line, drops, `bg`, and a `sprite`/`mini` key (see §3 — most are
  gray-box).
- **`src/spritegen/enemies.ts`** — `ENEMY_BATTLE_ART` rows for all 21 (id → `{sprite,
  draw}`); `FORM_ART['the_whisperwig_exposed']`. `draw` is a *reused* generator
  fallback (no new generators — `src/spritegen/` is FROZEN).
- **`src/spritegen/authored.ts`** — loader entries for the 4 real Ch.4 battler PNGs
  (`battle_thunder_snail`, `battle_fjord_gull_bully`, `battle_giant_berry_blocker`,
  `battle_the_whisperwig` + `_exposed`, all with `_w1`/`_w2`); `'sleepers_spine'`
  added to `BATTLE_BACKGROUND_ART`.
- **`src/data/bosses.ts`** — `the_whisperwig` `BossScriptDef` (`untargetableUntilNoise`):
  starts `burrowed`/untargetable → NOISE (`volt`/`firecracker`/`bottle_rockets`)
  surfaces it permanently (`surfacesTo`) → `awakeningOnForm` fires Mia's Vibe Volt α;
  party-wide Hushed pressure every 3rd turn.
- **`src/data/awakenings.ts`** + **`src/data/heroes.ts`** + **`src/battle/verify.ts`** +
  **`tools/content-validate.ts`** — the `the_thunder_snore` awakening (Mia → `vibe_volt_a`);
  `vibe_volt_a` REMOVED from `faye.unlocks` (one-path rule); `AWAKENING_LEVEL` + the
  awakening canon manifest extended.
- **`src/data/quests.ts`** + **`tools/content-validate.ts`** — 4 quests
  (`sigrids_spectacles`, `unsent_letter`, `the_silenced_bell`, `the_giants_picnic`) +
  the both-directions canon pin.
- **`src/data/shops.ts`** + **`tools/content-validate.ts`** — `kvisthavn_supply` +
  `lilleby_warehouse` + `KNOWN_SHOPS`.
- **`src/data/dialogue.ts`** — ~60 Ch.4 dialogue keys (NPCs, signs, shops, boss lines,
  arrival/ember/card, the awakening, the 4 quest flows + pickups) + `BATTLE_TEXT`
  noise lines (`boss_burrowed`, `noise_out`).
- **`src/data/maps_ch4.ts`** (NEW) + **`src/data/maps.ts`** — `kvisthavn`,
  `bootstep_moor`, `lilleby`, and the `spine_hand`/`spine_shoulder`/`spine_ear`
  dungeon; spread into `MAPS` + `MAP_AREA`/`MAP_AUDIO`/`MAP_REFLECT`.
- **`src/scenes/OverworldScene.ts`** — `bertAirBeat` (England→Norway flight from
  Lucille's cabin once `ch3_complete`), trigger cases, `QUEST_PICKUPS`, and the
  scene methods: `ch4ArrivalScene`, `whisperwigBossScene`, `sleepersEarScene`
  (Ember 4 → `ch4_complete`), `meltfallGate`, `bridgeBerryScene`, + 5 quest beats.
- **`src/scenes/BattleScene.ts`** — `noiseOut`/`targetable` wiring in the ability
  path (Volt / Bottle Rockets) and item path (`firecracker_string`); Ch.4 enemies →
  `sleepers_spine` battle backdrop in `backdropArea`.
- **`src/data/chapters.ts`** — manifest flipped to `shipped` (maps, dungeon.maps,
  quests filled; settlement `style` dropped).
- **`src/data/drafts/bosses.ts`** + **`src/levelkit/forge/bosses.test.ts`** —
  retired the `the_whisperwig` draft (count 8→7, hash → `7a70ae16`).

**Already done by PRIOR sessions (don't touch):** the full ch4 ITEM catalog (41,
`src/data/items.ts`), all the cutscene panels (`assets/art/cutscenes/ch4/`), the
4 real battler PNGs, the 6 NPC masters, the Norway tileset, 9 facades, the PSI
gate, the property, the world node, stations, balance numbers.

---

## 2. ARCHITECTURE & INVARIANTS YOU MUST RESPECT

1. **The validator is a CANON-PIN file.** `tools/content-validate.ts` pins enemies
   (HP), quests (both directions), shops, awakenings, items per band, etc. If you
   change a pinned value you must update its pin in the same commit. `npm run
   validate` is the source of truth.
2. **Enemy battle art is gated BOTH directions** (`content-validate.ts` ≈ L919–972):
   - every `ENEMIES[id]` needs an `ENEMY_BATTLE_ART[id]` row (`src/spritegen/enemies.ts`),
   - `ENEMY_BATTLE_ART[id].sprite` MUST equal `ENEMIES[id].sprite`,
   - that `sprite` key MUST be in `AUTHORED_ENEMY_BATTLE_ART_KEYS` (= the keys of the
     `ENEMY_BATTLE_ART` **loader array** in `src/spritegen/authored.ts`),
   - every authored loader key (minus `_w1`/`_w2`) must be claimed by some row.
   **Gray-box = an enemy points its `sprite` at an EXISTING authored key** (ADR-119).
   To author real art you give the enemy its OWN key and add the loader entry.
3. **`src/spritegen/` is FROZEN.** Never write or extend a `draw*` generator. The
   reused `draw` fallbacks in `ENEMY_BATTLE_ART` are fine; authored PNGs override
   them at boot.
4. **Wear tiers must be identical W×H** to the base (`battle_<id>` /
   `_w1` / `_w2`) or the sprite jumps when damaged (see `[[meteor-falls-enemy-wear-frames]]`,
   `npm run enemies:frames` audits).
5. **Enemy `deathLine` renders RAW** — literal canon names, never `{tokens}`.
6. **Image generation is ALWAYS ChatGPT** (chatgpt.com image generation). Use the
   user's browser. Reuse current assets as the style reference (the user's standing
   instruction).
7. **Run the gates after every batch:** `npm run validate` → `npx tsc --noEmit` →
   `npm test` → `npm run build`. All must stay green.
8. **Git:** the user drives git. Leave work unstaged unless asked.

---

## 3. REMAINING WORK

### TASK A — 16 enemy battle sprites (the bulk) ⬅ start here

These Ch.4 enemies currently **gray-box** on a borrowed authored key. Author a real
`battle_<id>.png` (+ `_w1`, `_w2`) for each, then repoint. Design intent + death
lines + moves are in `src/data/enemies.ts` (read each enemy's block — it's the art
brief). Style reference = the existing authored Ch.4 battlers (`battle_thunder_snail.png`,
`battle_the_whisperwig.png`) — EarthBound front-facing battler, cold-blue Norway palette.

| enemy id | concept (read enemies.ts for full brief) | currently borrows |
|---|---|---|
| `colossal_gnat` | dog-sized gnat, inflicts Crying | `battle_skeeter_swarm` |
| `knitting_needles` | animate granny's needles, Paralyze | `battle_cursed_souvenir` |
| `junior_jotun` | baby frost giant, grabs a hero | `battle_step_mask` |
| `moor_midge_cloud` | swarm of fist-sized midges | `battle_banana_bunch` |
| `boulder_lichen` | a rolling lichen-covered boulder | `battle_hill_slug` |
| `frost_hare` | enormous arctic hare, kicks hard | `battle_pickpocket_parrot` |
| `bog_cotton_wisp` | drifting bog-cotton, Asleep | `battle_cursed_souvenir` |
| `earwax_golem` | amber-wax golem in the ear canal | `battle_step_mask` |
| `dream_leech` | feeds on the Sleeper's dreams, drain | `battle_cursed_souvenir` |
| `snore_gust` | a gust from the giant's breathing | `battle_coily_cicada` |
| `giant_house_cat` | Lilleby housecat, kaiju to you (Ch.5 Whiskerzilla seed) | `battle_step_mask` |
| `lost_mitten` | animate giant mitten wanting a hand | `battle_cursed_souvenir` |
| `amber_hoard_troll` | small troll hoarding amber (wealth wink) | `battle_gilded_beetle` |
| `aurora_moth` | rare luminous moth, flees | `battle_jungle_jitterbug` |
| `hushed_skua` | fiercer gull remix (steals + Crying) | `battle_fjord_gull_bully` |
| `frost_jotun_elder` | bigger jotun remix | `battle_step_mask` |

Already authored + wired (leave alone): `thunder_snail`, `hushed_gull`
(`battle_fjord_gull_bully`), `dog_sized_berry` + `bridge_berry`
(`battle_giant_berry_blocker`), `the_whisperwig` (+`_exposed`).

**Per-enemy wiring (after the PNGs exist in `assets/art/enemies/`):**
1. `src/data/enemies.ts` — change that enemy's `sprite:` from the borrowed key to
   `'battle_<id>'` (and optionally `mini:` to a real Ch.4 mini if you author one).
2. `src/spritegen/enemies.ts` — change its `ENEMY_BATTLE_ART` row's `sprite` to
   `'battle_<id>'` (keep a reused `draw` as the boot fallback).
3. `src/spritegen/authored.ts` — add to the `ENEMY_BATTLE_ART` loader array:
   `{ key: 'battle_<id>', url: new URL('../../assets/art/enemies/battle_<id>.png', import.meta.url).href }`
   plus `_w1` and `_w2` rows (the PNGs must exist or Vite build fails).
4. `npm run validate` (proves the three keys agree + the key is authored).

### TASK B — 6 Norway NPC character sheets

Masters exist at `assets/art/masters/characters/animation/<id>_anim_46_4x_master.png`
but are UNWIRED; the NPCs currently use generic sprites. The six + their NPC ids:

| master / character id | NPC in maps_ch4.ts | current generic sprite |
|---|---|---|
| `sigrid_spectacles` | `kv_sigrid` | `senora` |
| `kvisthavn_fisher` | `kv_halvor` | `dockworker` |
| `kvisthavn_shopkeeper` | `kv_shopkeeper` | `smilerB` |
| `mayor_of_lilleby` | `ll_mayor` | `smilerB` |
| `lilleby_giant_child` | `ll_child` | `pajamaKid` |
| `lilleby_undertaker` | `ll_undertaker` | `dockworker` |

**Workflow** (the proven NPC walk-sheet pipeline — see `[[character-walk-sheet-pipeline]]`,
`[[forward-walk-mirror-feet]]`, `docs/ART_PIPELINE.md` § "Character 46-frame walk sheets"):
1. Verify each master with `node tools/extract-char-frames.js` — if the facings are
   wrong/broken, REPAIR via the ChatGPT chroma-green reference-paste pipeline (paste
   the ORIGINAL as reference, grounded 2-step walk, then `slice-chroma-strip.js` →
   `assemble-char-sheet.js --mirror=3:1 --mirror=15:13` for down+up opposite-foot steps).
2. Copy/repair the master to the runtime path `assets/art/characters/<id>_anim_46_4x.png`.
3. Add the id to `NPC_CHARACTER_ART` in `src/spritegen/authored.ts` (shape:
   `{ id, key: 'authored_<id>_8dir', url: .../characters/<id>_anim_46_4x.png }`).
4. Repoint the NPC `sprite:` in `src/data/maps_ch4.ts` from the generic to the
   character id (e.g. `kv_sigrid` `sprite: 'senora'` → `'sigrid_spectacles'`).
5. `npm test` — the "authored NPC asset wiring" test verifies every frame populates.

(Optional later: author sheets for `kv_bellkeeper`, `ll_keeper`, `ll_sweetheart`,
`kv_kid`, `moor_walker`, and the Dorin-cameo `spine_walker` — they're fine on
generics for now. Do NOT hand-author the 5 hero sheets or the caddy.)

### TASK C — investigate Kvisthavn/Lilleby facade rendering

The authored facades (`bldg_kvisthavn_*`, `bldg_lilleby_*`) are wired in
`AREA_SKINS`/`REGION_FACADE_KEYS`, but the Kvisthavn screenshot showed generic
occupyCity houses. Determine whether `buildDistrict(catalog: AREA_SKINS.kvisthavn)`
is actually placing the authored facades or whether the living-city pass
(`maps.ts` ≈ L3251 `occupyCity`) overlays generic homes. Compare against how Ch.3
`foggybottom` renders. If the authored facades need height-anchored display sizes,
see `[[meteor-falls-authored-prop-sizing]]` (`AUTHORED_WORLD_PROP_DISPLAY_SIZE`).
Likely a small wiring fix, not new art.

### TASK D (optional) — a dedicated Norway outdoor battle backdrop

Every Ch.4 fight currently reuses `sleepers_spine.png` (the dungeon backdrop), set
in `BattleScene.backdropArea`. If desired, author a Kvisthavn/moor outdoor backdrop
(`assets/art/backgrounds/<area>.png`, 1600×900), add it to `BATTLE_BACKGROUND_ART`
(`authored.ts`), and split the moor/town enemies onto it in `backdropArea`.

### TASK E — end-to-end playtest (verification)

Static gates can't drive the battle scene; a real playthrough must confirm the flow.
The overworld can be warped via debug globals `window.mfGS`, `window.game`,
`window.mfMakeHero` (see `[[verifying-the-running-game]]`). Verify, with the dev
server (`npm run dev`):
- Boarding Lucille's cabin in Foggybottom after `ch3_complete` offers "Fly to NORWAY"
  and lands you in Kvisthavn (`ch4_arrival` fires once).
- Each of the 4 quests: giver gives → pickups set objective flags → giver completes
  (reward + caller). Givers: `kv_sigrid`, `kv_halvor`(+`ll_sweetheart` delivery),
  `kv_bellkeeper`, `ll_mayor`.
- The PSI gate (`spine_meltfall`) accepts Vibe Freeze and hands a Firecracker String.
- The boss: it opens UNTARGETABLE; a Bottle Rocket / Firecracker String / Volt
  surfaces it (prints `noise_out`), Mia awakens Vibe Volt α on the surface, every
  3rd turn the party is Hushed, and it dies → `whisperwig_defeated`.
- The ear's resonance trigger then records Ember 4 → `ch4_complete` → the chapter card.

---

## 4. THE IMAGE-GENERATION WORKFLOW (canonical — `[[image-generation-workflow]]`)

1. Drive the **Chrome MCP** (`mcp__Claude_in_Chrome__*`) to **chatgpt.com**. (If the
   extension isn't connected, ask the user to connect it.)
2. New chat → attach the **style reference** (an existing Ch.4 battler PNG, or the
   character's clean turnaround for NPCs — `[[character-art-reference-paste]]`).
   Paste FIRST, then type the prompt (STA-clipboard quirk).
3. Prompt for an EarthBound front-facing battler / the requested frame, transparent
   or chroma-green background, matching the reference's scale + palette.
4. Capture via the canvas-export JS (`img.decode()` forces the bg-tab load — NOT the
   duplicate-dumping share "Download"). Parallelize ~4 tabs.
5. Download → slice with the right tool (white-matte strip: `tools/slice-enemy-mini.js`;
   battler wear tiers: `tools/slice-enemy-wear.js <src> <outKey> <baseKey>`; chroma
   character strips: `tools/slice-chroma-strip.js` → `tools/assemble-char-sheet.js`).
   See `docs/ART_PIPELINE.md` for the exact per-category commands + masters resolution.
6. Save under `assets/art/...`, wire per Task A/B above, then run the gates.

---

## 5. ACCEPTANCE / COMMANDS

Run after every art batch (all must pass):
```
npm run validate     # canon pins + asset-key agreement
npx tsc --noEmit     # types
npm test             # 1237+ tests incl. authored-asset wiring
npm run build        # tsc + validate + Vite bundle (catches missing PNGs)
npm run balance      # Whisperwig TTK must stay in [4,10] (currently 6)
npm run enemies:frames  # wear-tier W×H audit for the new battlers
```
Done when: all green, every Ch.4 enemy/NPC wears authored art, facades render, and
the §3-E playthrough completes without a soft-lock.

---

## 6. REFERENCES

- `/CLAUDE.md` — art-is-authored rule, balance canon, build/test commands.
- `docs/ART_PIPELINE.md` — the full pipeline + masters resolutions + slicer commands.
- `docs/GAME_BIBLE.md` §A6 (Ch.4 story/boss), §A7 (enemy roster + Enemy Flow Law).
- `docs/BALANCE_CH4-10_SPEC.md` — the Ch.4 numbers (already applied).
- Memory (`C:\Users\jay19\.claude\projects\C--Meteor-Falls\memory\`):
  `ch4-norway-landing.md`, `image-generation-workflow.md`,
  `character-walk-sheet-pipeline.md`, `forward-walk-mirror-feet.md`,
  `character-art-reference-paste.md`, `meteor-falls-enemy-wear-frames.md`,
  `meteor-falls-npc-character-art.md`, `verifying-the-running-game.md`.
- **Next chapter after the art pass:** Ch.5 Minimus (Pippa joins) — same landing
  playbook as this file's §1 (re-grep ADRs first).
