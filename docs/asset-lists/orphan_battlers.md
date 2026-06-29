# Orphan Battler Reserve — intentional inventory, not noise

**What this is.** 32 fully-authored enemy battlers live on disk under
`assets/art/enemies/` but are **not wired into any roster** (`src/data/enemies.ts`)
or runtime loader (`src/spritegen/authored.ts`). The visual-identity audit
(`npm run visuals:audit` → [`visual_identity.md`](visual_identity.md)) reports them
as *"Authored battle PNGs on disk but not registered for current runtime: 97"*
— that count is **these 32 battlers × 3 wear tiers = 96, plus the 1
`whiskerzilla_knighted` cutscene panel** (see Exclusions below).

They are **kept on purpose** as a reserve bank, **not deleted**. This file records
each one's theme and the chapter it could be adopted into, so the audit's "97
unregistered" reads as *tracked reserve inventory* rather than drift. Decision
ratified 2026-06-28 (track: canon/design cleanup — "keep + catalog").

**Status of every entry below (verified 2026-06-28):** complete `battle_<id>` +
`_w1` + `_w2` set, all **112×144** (uniform — adoptable as-is, no wear-frame
regen needed). Like most shipped enemies, these are runtime PNGs without a
`masters/enemies/` source (that dir only covers a Ch.1 subset), so the runtime
PNG is the source of truth.

## How to adopt one (cheap — zero new art)

Follow the proven **§4-B orphan-adoption recipe** (used for the Ch.6 ×16 and
Ch.2 ×5 adoptions). Per enemy, 6 wiring sites:
1. `src/data/enemies.ts` — full `EnemyDef` (on-band hp/stats, weakness, moves,
   `sprite: 'battle_<id>'`, `mini: 'mini_<id>'`, `bg:` ramp).
2. `tools/content-validate.ts` §A7 canon HP pin (both directions).
3. `src/spritegen/authored.ts` — 3 `ENEMY_BATTLE_ART` rows (`battle_<id>` + `_w1` + `_w2`).
4. Derive + register the mini — `npx vite-node tools/derive-ch5-minis.ts <id>` → 1 `ENEMY_MINI_ART` row.
5. `src/spritegen/enemies.ts` — `ENEMY_BATTLE_ART` fallback row (`{ sprite, draw }`, reuse a frozen `draw*` fn).
   **Easy to miss:** the validator's visual-id "claimed" check reads `.sprite`
   here, not the authored loader — omit it and `npm run validate` fails.
6. `src/data/maps_chN.ts` — add the id to a spawner pool (`count ≤ 5`, reuse a proven rect).

Then keep all gates green (`npm run build` · `npm test` · `npm run validate`).
**Note:** the §A7 design vision caps each chapter's roster at **twenty** — the
Norway and Minimus banks below are *surplus to chapters already at twenty*, so
adopting them would push past the canon twenty (a deliberate design choice, not a
free win). The ambiguous three are the realistic adoption candidates.

---

## Norway-themed (12) — surplus to Ch.4 (already at the §A7 twenty)

Ch.4 "The Fjord That Sleeps" is full (20 regulars + The Whisperwig). These are
extra Norway flavor — reserve for a future Ch.4 expansion or any cold/coastal reuse.

| id | gloss |
|---|---|
| `angry_lutefisk_tin` | a tin of irate cured fish |
| `bootstep_boulder` | a boulder that walks the moor |
| `driftwall_snowbank` | a creeping snowbank wall |
| `earwax_wisp` | a wisp off the Sleeper's ear (cf. the shipped `earwax_golem`) |
| `frostbitten_postcard` | a frozen undelivered postcard |
| `moor_lantern` | a will-o'-the-wisp moor lantern |
| `oversized_cod` | a hum-swollen cod (the 10× moor gag) |
| `sigrids_lost_lens` | Sigrid's pond-sized spectacle lens (cf. the `q_sigrid` quest) |
| `sleepwalking_helmet` | an empty viking helmet, sleepwalking |
| `snowshoe_phantom` | tracks with no walker |
| `spine_tick` | a tick off the Sleeper's Spine |
| `woolly_pressure_kettle` | a screaming wool-wrapped kettle |

## Minimus-themed (17) — surplus to Ch.5 (already at the §A7 twenty)

Ch.5 "The Grand Duchy of Minimus" is full (20 regulars + Whiskerzilla + Flat
Bell). These are extra tiny-duchy flavor — reserve for a future Ch.5 expansion.

| id | gloss |
|---|---|
| `button_shield_guard` | a guard behind a button shield |
| `census_ledger_wraith` | a haunted census ledger (cf. the shipped `census_pigeon`) |
| `cold_charm_mimic` | a mimic posing as a charm |
| `crumb_knight` | a knight the size of a crumb (cf. `crumb_cannoneer`) |
| `decree_scroll_swarm` | a swarm of royal decrees |
| `false_exit_hedge` | a hedge painted to look like the way out |
| `giant_banknote_folder` | a folding banknote (cf. the `giants_banknote` item) |
| `gilt_thimble_guard` | a guard in a gilt thimble helm |
| `magnifying_lens_mite` | a mite under a magnifying lens (cf. `cobble_mite`) |
| `needle_fencer` | a duelist with a sewing-needle rapier (cf. `duelist_pip`) |
| `pocket_lint_sprite` | a sprite of pocket lint |
| `rare_crown_jewel_chip` | a high-value chipped crown jewel (rare/wealth-wink) |
| `rare_giant_button` | a high-value oversized button (rare/wealth-wink) |
| `royal_doubloon_roller` | a rolling royal coin |
| `teacup_tilter` | a teacup that tilts to pour scalding tea |
| `thimble_drummer` | a drummer on a thimble (cf. `tin_parade`) |
| `tin_soldier_squad` | a squad of tin soldiers (group enemy, cf. `halberd_column`) |

## Ambiguous (3) — the realistic adoption candidates

| id | theme | reserved for |
|---|---|---|
| `ribcage_rattler` | skeletal / gothic | **Ch.9 (Romania — `count_hoaxula`, gothic)** — strong fit when Ch.9 lands |
| `ballot_box_brawler` | civic / bureaucracy | Ch.1 (USA Dept.-of-Smiles) or Ch.5 (Minimus tax/toll/census) bureaucracy — both currently full |
| `acorn_catapult` | woodland / forest | no clean landed home (Ch.3 England woodland is full); generic forest reserve |

---

## Exclusions — confirmed IN USE, do NOT treat as orphans

These three share the `battle_`/disk-asset shape but are **wired and active**.
Re-flagging them as orphans (or deleting them) would break shipped content:

| id | what it actually is | wired via |
|---|---|---|
| `gilded_grin_hollow` | Ch.1 boss **Idol of the Gilded Grin** `formSwap` hollow form (Mia's-awakening beat) | `authored.ts` + `spritegen/enemies.ts` |
| `the_whisperwig_exposed` | Ch.4 boss **The Whisperwig** phase-2 exposed form | `authored.ts` + `spritegen/enemies.ts` |
| `whiskerzilla_knighted` | Ch.5 **cutscene panel** (not an enemy at all) | `src/data/cutscenes.ts` |

---

*Provenance: catalogued 2026-06-28. Companion to the auto-generated
[`visual_identity.md`](visual_identity.md) "Authored Disk Assets Not In Current
Runtime" list, which enumerates the same PNGs by filename without theme context.*
