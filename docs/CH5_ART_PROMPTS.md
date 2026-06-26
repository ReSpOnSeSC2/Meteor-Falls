# CH5 ART PROMPTS — the Minimus authored-art pass (PKG-12)

> The Ch.5 **data spine is shipped + green** (ADR-129): all 22 §A7 battlers, the boss,
> 4 maps, 5 quests, dialogue, the shop, and the manifest flip validate, and the chapter
> is end-to-end playable. **Art is the only remaining work.** Everything below currently
> renders **gray-box** (a reused boot-fallback `draw` / a reused character sheet / the
> procedural tileset); the loader **keys are already wired**, so each authored PNG drops
> straight onto its key with no code change.
>
> Pipeline is canon — **ALL image generation is ChatGPT → PNG** (chatgpt.com image gen),
> authored at the `assets/art/masters/` resolution, then sliced/downscaled into the
> runtime folder and (where needed) re-pointed in `src/spritegen/authored.ts`. Never
> procedural, never a different model. Full step-by-step: `docs/ART_PIPELINE.md`.
> Resolution targets: `docs/asset-packages/PKG-12-ch5-Minimus.md` §"Resolution target".
>
> Region voice (§A11): **tiny-but-dignified, heraldic, civic.** Jewel-box velvets —
> purple, magenta, gold, ivory. Spire-canton silhouettes (thin towers, ribbon streets).
> Everything is procedure; the joke is that smallness is taken with deadly seriousness.

---

## 1. Region tileset — `assets/art/world/Minimus_tiles_16.png`
**Gray-box now:** the procedural `TILESET` (Otterbrook strip) renders all Ch.5 grids.
**Author:** ~12–16 cells, 16×16 native → 64×64 runtime, in the spire-canton biome —
ribbon-cobble road + dashes, ivory flagstone, velvet-lawn turf, a privet-hedge wall, a
gilt kerb, a dewdrop-water tile. Append the new painters at the `TILESET` tail + one
strip column each (the surgical-append template `tools/sync-melt-ice-tile.ts`; **never**
re-pack via `pack-world-tiles` — it clobbers hand-authored tiles). See the
[tile-strip-override memory] convention.

## 2. Dungeon art — `assets/art/world/dungeons/the_hedgerow/`
**Gray-box now:** `the_hedgerow` + `ducal_crown` use `'O'` walls / `'.'` turf.
**Author:** the hedge-maze skin — towering privet walls (a forest at their scale), a
mossy maze floor, fallen-acorn boulders, the gilt boss-trigger arch at the Ducal Crown,
the crown-jewel dais, the Flat Bell hung above. Reskin the LEVELKIT recipe (ADR-020).

## 3. Settlement facades — `assets/art/world/facades/`
**Status:** the `minimus` catalog **already exists procedurally** (`bldg_minimus_cathedral,
_census_office, _major_palace, _manor, _needle_armory, _petit_market, _post_office,
_thimble_inn, _whistle_barracks` — `AREA_SKINS.minimus`). Optional authored upgrades of
these ~9 in the heraldic spire-canton style; not blocking.

## 4. NPC roster — `assets/art/characters/<id>_anim_46_4x.png` (24×32 native → 96×128)
**Gray-box now:** each Ch.5 NPC reuses an existing 46-frame sheet (see "stand-in").
Author a dedicated sheet, add the id to `NPC_CHARACTER_ART` in `authored.ts`, and
**re-point the NPC `sprite`** in `src/data/maps_ch5.ts`. The 8-dir → 46-frame contract +
the ChatGPT reference-paste pipeline are canon (`docs/ART_PIPELINE.md` § Character sheets;
paste the clean turnaround as the reference so it stays on-model). **Pippa is a HERO** —
already authored (`pippa`); do not regenerate her here.

| map NPC id | role | stand-in sheet | author as |
|---|---|---|---|
| `mn_duchess` | Grand Duchess Millimetta I (chess-queen regal) | `senora` | `duchess_millimetta` |
| `mn_engineer` | Chief Engineer of the Hundred (lens-grinder) | `quarterMan` | `duchy_engineer` |
| `mn_census` | the Census-Taker (quill + ledger) | `npc_clerk` | `census_taker` |
| `mn_provisioner` | the Ducal Provisioner (shopkeeper) | `mercadoKeeper` | `ducal_provisioner` |
| `mn_lostfound` | Lost & Found clerk | `npc_depot_clerk` | `lostfound_clerk` |
| `mn_bellkeeper` | the Belfry Keeper | `aurora_busker` | `belfry_keeper` |
| `pw_click` | Mr. Click (macro-lens photographer) | `curator` | `mr_click` |
| `pw_guard` | a Whistle Guard on point duty | `npc_borden` | `whistle_guard_npc` |

## 5. Enemy roster — **22 battlers × 3 wear = 66** + minis
**Gray-box now:** each owns its `battle_<id>` key (wired in `authored.ts`) but renders a
**reused** generator (the `ENEMY_BATTLE_ART` `draw` stand-in). Author each at battle scale
(28×36 native → 112×144 runtime), **three identical-footprint wear tiers**
(`battle_<id>{,_w1,_w2}.png`) under `assets/art/enemies/`, then slice (`tools/slice-enemy-
wear.js`) onto the existing key. Author a dedicated overworld mini too (currently each
reuses a registered mini — see `maps_ch5.ts`/`spritegen/index.ts`).

| enemy id | name | role | gray-box draw | art note |
|---|---|---|---|---|
| `tin_parade` | Tin Parade | seed-six formation | drawStepMask | a column of a dozen wind-up tin soldiers, one square |
| `duelist_pip` | Duelist Pip | seed-six | drawBlazerSmiler | a minuscule formal swordsman, pin-rapier, salute |
| `crumb_cannoneer` | Crumb Cannoneer | seed-six | drawCrankyMailbox | a matchstick cannon that fires biscuit-crumbs |
| `powderwig_wasp` | Powder-Wig Wasp | seed-six | drawCoilyCicada | a courtier-wasp in a powdered wig |
| `windup_wyrmlet` | Wind-Up Wyrmlet | seed-six | drawRunawayLawnmower | a clockwork dragon-toy, brass key, overwound |
| `dust_bunny` | Dust Bunny of Unusual Size | seed-six | drawHillSlugDeluxe | a fuzzy under-throne dust-ball mid-split |
| `whistle_guard` | Whistle Guard | road | drawBlazerSmiler | thumb-high constable, whistle, matchstick baton |
| `census_pigeon` | Census Pigeon | road/flyer | drawPigeonGang | a parade-balloon-huge ordinary pigeon |
| `toll_clerk` | Toll Clerk | road/caster | drawBlazerSmiler | a clerk at a matchbox podium "taking a vote" |
| `cobble_mite` | Cobble Mite | road/evasive | drawGildedBeetle | a tiny mite hiding between cobblestones |
| `hedge_sprite` | Hedge Sprite | hedgerow/lurker | drawJungleJitterbug | a leaf-clad duelist melting into a hedge |
| `topiary_knight` | Topiary Knight | hedgerow/bruiser | drawStepMask | a clipped-shrub knight, leaf greatsword |
| `bramble_tangle` | Bramble Tangle | hedgerow/caster | drawBananaBunch | a knot of thorn vines that roots feet |
| `lapel_pin_mob` | Lapel-Pin Mob | social/swarm | drawGildedBeetle | citizens climbing you, planting tiny flags |
| `town_crier` | Town Crier | social/support | drawBlazerSmiler | a crier with scroll + brass handbell |
| `snuffbox_beetle` | Gilded Snuffbox Beetle | rare | drawGildedBeetle | a jeweled beetle folding into a gold snuffbox |
| `tax_assessor` | Royal Tax Assessor | rare/flees | drawStepMask | an official with a ledger, edging to the exit |
| `halberd_column` | Halberd Column | late-pressure | drawBananaBunch | a wall of matchstick pikes, lowered |
| `bell_ringer_acolyte` | Bell-Ringer Acolyte | late-pressure | drawCursedSouvenir | an acolyte swinging a bright warning bell |
| `grand_parade` | The Grand Parade | set-piece | drawPigeonGang | a whole procession-float voting on its move |

## 6. Boss — `assets/art/enemies/battle_whiskerzilla{,_w1,_w2}.png` (+ the Flat Bell)
**Gray-box now:** `whiskerzilla` → drawHillSlugDeluxe; `flat_bell` → drawCursedSouvenir.
**Author:** WHISKERZILLA **bespoke**, larger than the enemies (NOT an enlarged enemy) —
an ordinary lost housecat painted as a benign kaiju asleep on the crown jewel; warm fur,
half-lidded eyes, a tail mid-wiggle (the POUNCE tell). 3 wear tiers = drowsier, not
bloodier (it is never hurt). `battle_flat_bell{,_w1,_w2}.png` — a cracked bronze bell on a
ribbon, the crack widening across the tiers.

## 7. Battle backdrop — `assets/art/backgrounds/the_hedgerow.png`
**Gray-box now:** battles use the enemy `bg` RAMP swirl.
**Author:** the region arena backdrop (1600×900) — the hedge-maze interior / the Ducal
Crown dais. Add `'the_hedgerow'` to `BATTLE_BACKGROUND_ART` in `authored.ts` and set the
Ch.5 dungeon maps' battle-area binding.

## 8. Cutscene panels (~7, 1600×900) — `assets/art/cutscenes/ch5/<beat>_NN.png`
**Gray-box now:** `playCutscene(this, 'ch5_journey')` silently no-ops on missing art; all
beats currently play as code-driven dialogue. Author panels for: the **biplane travel-in**
(Lucille over the tabletop capital), the **arrival** (the party towering over the duchy),
the **Big-Little Lens** bench, the **Whiskerzilla** reveal, the **POUNCE**, the
**knighting**, and the **two joins** (Pippa as Minister / Dorin on the wall). Register in
`src/data/cutscenes.ts` (coordinate filenames with PKG-01).

## 9. Regional extras
- **Manor interior** — the property-arc home (`minimus_manor`, `src/data/properties.ts`):
  a manor you live *around* (you can't fit inside; you nap against it). Footprint-sized
  interior in the spire-canton style.
- **Minis** — dedicated 16×16 overworld roamers for the 20 enemies (currently reuse
  registered minis); add via `addPixmap` only as authored PNGs land (`spritegen` is FROZEN
  for *new generators* — these are authored art, not code).
- **Road vehicle(s)** — coordinate with PKG-07 if Minimus gets a regional craft.

---

## Acceptance
Tileset, dungeon, ~12 NPC sheets, 22-battler roster (×3 wear) + minis, the bespoke boss +
Flat Bell, the backdrop, ~7 cutscene panels, and the manor interior all authored, sliced,
and wired onto their existing keys — then `npm run build` (the full `vite build`) green and
the live look/feel eyeball in the preview browser (the boss flow + the two joins).

> **STATUS — LANDED 2026-06-25.** ✅ **NPCs:** 7 placed quest NPCs wired to dedicated
> 46-frame sheets (`pw_click` keeps the `curator` stand-in). ✅ **Battlers:** all 20 §A7
> enemies authored ×3 wear (`enemies:frames` 94/94 hi-res). ✅ **Boss + Flat Bell** + ✅ **8
> cutscene panels:** already authored + wired. ✅ **Backdrop:** `the_hedgerow` added to
> `BATTLE_BACKGROUND_ART` + a `backdropArea` Ch.5 branch. ✅ **Build green** + ✅ **live-verified**
> (Minimus Major NPCs + Whiskerzilla boss/backdrop/party render in the preview).
> **N/A — Manor interior** (properties are data-only deeds; the design is "live AROUND it").
>
> **UPDATE — 2026-06-26 (continuation pass).** ✅ **Dungeon props (§2) WIRED:** the 4
> `the_hedgerow/*_64.png` props copied into `world/props/` (clean keys), registered in
> `WORLD_PROP_KEYS` + `AUTHORED_WORLD_PROP_DISPLAY_SIZE`, placed in `maps_ch5.ts` as NON-solid
> dressing (hedge leaf-walls + a thorn-arch gateway · the gilt `ducal_crown_gate` dais threshold ·
> Pippa's `matchbox_podium`); live-verified rendering. ✅ **Boss flow VERIFIED end-to-end:** a new
> headless `phases.test.ts` block pins the real 12-turn `whiskerzilla` arc, and the preview drove
> the live battle (launch → Flat Bell summon turn 1 → 12 turns → bored-mercy → victory) + the
> post-win `ducalCrownScene` (Ember 5 + Pippa + Dorin joins → party 3→5 → `ch5_complete`); the
> `the_hedgerow` backdrop + battlers render. ✅ **Region tileset (§1) WIRED — Ch.5 render-time skin
> (author chose all 4 maps):** appended `minimus_turf`/`minimus_hedge`/`minimus_cobble` to `TILESET`
> (reused painters = FROZEN-safe), surgically grew `otterbrook_tiles_16.png` to 105 cols
> (`tools/sync-minimus-tiles.ts`), wired `Minimus_tiles_16.png` as a partial-override strip
> (`MINIMUS_TILE_ART`, cols 4/6/7), and added a COLLISION-PRESERVING name-remap in
> `OverworldScene.buildTiles` (`MINIMUS_TILE_SKIN`) keyed on the 4 ch5 map ids. LIVE-VERIFIED: privet
> hedge maze (121/121 `'O'` still solid — no soft-lock), privet/cobble city + crown. All gates green
> (`build` · `test` 1237 · `enemies:frames` 94/94). The decorative strip cells (teacup/columns/banner/
> crown/arches) remain for a future grid-char pass.
>
> **UPDATE 2 — 2026-06-26 (user playtest fixes).** ✅ **Overworld minis DONE (§9):** all 20 §A7 roamers
> now use AUTHORED hi-res minis DERIVED from their battlers (`tools/derive-ch5-minis.ts` — crop-alpha +
> downscale to 64px → `ENEMY_MINI_ART` → repoint each `mini:`), so the field sprite is the enemies-section
> art, not the old procedural pixel minis. Procedural overworld minis dormanted as policy (CLAUDE.md) +
> `visuals:audit` fixed to credit authored minis & only flag ROAMING procedural enemies → **92/93 authored,
> 1 legacy** game-wide (only the borrowed-battler `dog_sized_berry`). ✅ **Traffic cars:** fixed the
> backward/rotated orientation (the oblique art faces LEFT; code assumed right) + Minimus runs dainty
> matchbox-scale cars (`MINIMUS_TRAFFIC_SCALE=0.5`). See [[overworld-minis-and-traffic]]. All gates green.
