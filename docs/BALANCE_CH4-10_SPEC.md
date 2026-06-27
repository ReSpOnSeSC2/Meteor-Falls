# BALANCE_CH4–10 SPEC — the exact numbers (ADR-122, LATE game)

> Concrete, apply-ready values that extend the combat rescale to **Ch.4–10**, so
> the curve is coherent end-to-end. Same method, formulas, and verification model
> as `docs/BALANCE_CH1-3_SPEC.md`. This is **DATA only** — `src/battle/formulas.ts`
> is unchanged; every target below is derived through it. This doc DOES NOT touch
> code; it drives a later code change.
>
> **Damage model (verbatim from the formulas + `BALANCE_REVAMP.md`):**
> - Vibe dmg = `power · (1 + Vibe/60)` ±10%  → **power = targetDmg ÷ (1 + Vibe/60)**
> - Gadget dmg (Milo/Pippa, no Vibe) = `power` ±10% (read directly — these ARE the numbers)
> - Physical = `max(1, off·2 − def)` ±15%
> - Heal = `power · (1 + Vibe/80)` ±10%  → **power = targetHeal ÷ (1 + Vibe/80)**
> - A matching enemy weakness ×1.5 (`WEAK_MUL`).
>
> **Vibe read off `growthRow` at each rung's EARNING level** (`statsAtLevel`,
> `round(base + grow·(L−1))`). Earning level = `heroes.ts` unlock level OR the
> `AWAKENING_LEVEL` (verify.ts) for awakened rungs. Chapter boundary by §A6
> `targetLevel`: **Ch.4 ≤ L22 · Ch.5 ≤ L26 · Ch.6 ≤ L30 · Ch.7 ≤ L35 · Ch.8 ≤ L40
> · Ch.9 ≤ L46 · Ch.10 ≤ L52.**

### Vibe at every earning level used (computed, `round(base+grow·(L−1))`)

| Hero | base/grow | L20 | L22 | L24 | L26 | L27 | L29 | L30 | L31 | L32 | L38 | L40 | L44 | L46 | L47 | L48 | L52 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Jay (`rex`) | 6 / 1.8 | 40 | 44 | 47 | 51 | — | — | 58 | 60 | — | 73 | 76 | — | 87 | 89 | — | 98 |
| Mia (`faye`) | 8 / 2.2 | 50 | 54 | 59 | 63 | 65 | 70 | 72 | — | 76 | 89 | 94 | 103 | 107 | 109 | 111 | 120 |
| Dorin | 7 / 2.0 | — | — | — | — | — | — | — | — | — | — | — | — | 97 | — | 101 | 109 |
| Milo / Pippa | 0 / 0 | 0 (no Vibe — gadgets/competence read `power` directly) ||||||||||||||||

---

## Scope: which rungs are EARNED in Ch.4–10

Carried forward from the Ch1-3 spec §1e (everything L19+). Identified from
`heroes.ts` unlocks + `awakenings.ts`/`AWAKENING_LEVEL`, mapped to chapter:

- **Jay (`rex`):** Surge γ (`vibe_surge_g` L31, **Ch7**), Surge Ω (`vibe_surge_o` L47,
  **Ch10**), Surge Σ (awaken `the_whole_sky` L52, **Ch10**); Lifeup β (`lifeup_b`
  L22, **Ch4** heal), Lifeup γ (`lifeup_g` L38, **Ch8** heal), Lifeup Ω (`lifeup_o`
  L46, **Ch9** heal). *(All the new buffs — `powershield_a/s`, `ward_s`, `hypno_o`,
  `mindwarp_a/o`, `flash_o`, `resolve_a`, `teleport_b`, `shield_s` — are `power:0`;
  stay 0, §1f.)*
- **Mia (`faye`):** Fire γ/Ω/Σ (`vibe_fire_g` L29 **Ch6**, `vibe_fire_o` L44 **Ch9**,
  `vibe_fire_x` awaken `the_match_that_stays_lit` L46 **Ch9**); Freeze β/γ/Ω/Σ
  (`vibe_freeze_b` L24 **Ch5**, `_g` L32 **Ch7**, `_o` L46 **Ch9**, `_x` L52 **Ch10**);
  Volt α/β/γ/Ω/Σ (`vibe_volt_a` L20 **Ch4**, `_b` L26 **Ch5**, `_g` L40 **Ch8**, `_o`
  L47 **Ch10**, `_x` L52 **Ch10**); Starsong β/γ/Ω/Σ (`starsong_b` L30 **Ch6**, `_g`
  L38 **Ch8**, `_o` L48 **Ch10**, `_x` L52 **Ch10**); Heartmend (`heartmend_a` L27,
  **Ch5** heal). *(Magnet α/β/γ/Ω/Σ all `power:0` — pp/lifedrain statuses, stay 0.
  Lucky Star / Hush Hex / Dreamlull `power:0`.)*
- **Milo (`milo`):** gadgets, flat `power`, no Vibe, 0 PP — Cryo Grenade (L22 **Ch4**),
  Multi Bottle Rocket (L28 **Ch6**), Siege Rocket (L34 **Ch7**). *(Med-Spray heal
  power 90 already set in Ch1-3 spec §1c; Scope/Forcefield `power:0`.)*
- **Dorin:** joins **Ch9** (party from Ch10 per `BOSS_PARTY`). Comet α/β/γ/Ω
  (`vibe_comet_a/b` L1-on-join, `_g` L48, `_o` awaken `trial_of_the_mute_mountain`
  L46); Healing β (`healing_b` HP heal). *(Healing α/γ/Ω, Brainjam α/γ/Ω, Mirror/
  Mirror Ω, the two stances — all `power:0` status/cure/revive, stay 0.)*
- **Pippa:** joins **Ch5**, no Vibe/PP, kind `physical`. Pocket Patch (`pocket_patch`
  heal 35) + Field Dressing (`field_dressing` heal 90) are her only `power>0` lines;
  every other Pippa move is `power:0` (marks/morale/guard). See §1e.

---

## 1. ABILITIES — new `power` / `pp`

Powers are `target ÷ (1+Vibe/60)` (heals `÷(1+Vibe/80)`) at the rung's earn-level
Vibe. **Ladders climb monotonically in power** (the `verify.test` ladder check) and
the **α→β leap stays in [2.4,2.9]** for Surge & Fire — those are already pinned by
the Ch1-3 spec (Surge α20→β55 = 2.75; Fire α10→β18 = 1.8 — see §1g FLAG). PP pools
rescale so "one Ω vs three γs" stays a real per-fight budget choice (max PP at the
earn-level: Jay 74/89/105/126/149/179/210; Mia 99/119/140/169/200/239/281 at
L22/26/30/35/40/46/52).

### 1a. Jay (`rex`) — Vibe Surge γ/Ω/Σ + Lifeup β/γ/Ω

| id | tier | band | earn L | Vibe | new `power` | new `pp` | resulting |
|---|---|---|---|---|---|---|---|
| `vibe_surge_g` | γ | Ch7 | L31 | 60 | **1100** *(was 231)* | **38** *(keep)* | dmg **2200** |
| `vibe_surge_o` | Ω | Ch10 | L47 | 89 | **6846** *(was 341)* | **64** *(keep)* | dmg **17001** |
| `vibe_surge_x` | Σ | Ch10 | L52 | 98 | **9114** *(was 480)* | **96** *(keep)* | dmg **24000** |
| `lifeup_b` (heal) | β | Ch4 | L22 | 44 | **116** *(was 110)* | **11** *(keep)* | heal **180** |
| `lifeup_g` (heal) | γ | Ch8 | L38 | 73 | **1464** *(was 180)* | **24** *(keep)* | heal **2800** |
| `lifeup_o` (heal) | Ω | Ch9 | L46 | 87 | **2683** *(was 320)* | **40** *(keep)* | heal **5601** |

Surge ladder powers **20 → 55 → 1100 → 6846 → 9114** (monotonic ✓). Leaps:
β→γ ×20.0, γ→Ω ×6.2, Ω→Σ ×1.33. The β→γ leap is large because β is pinned to Ch3
(player-facing 89) and γ is earned four bands later at Ch7 — this is the intended
wide JRPG ramp (`BALANCE_REVAMP`: "Σ 480 → 24k"), not a tuning error. The α→β leap
the test gates is **unchanged** (still 2.75). See §1g.

### 1b. Mia (`faye`) — Fire / Freeze / Volt / Starsong γ+ (and Volt α/β, Freeze β, Starsong β)

| id | tier | band | earn L | Vibe | new `power` | new `pp` | resulting (raw / ×1.5 weak) |
|---|---|---|---|---|---|---|---|
| `vibe_fire_g` | γ | Ch6 | L29 | 70 | **508** *(was 202)* | **28** | dmg **1101** / 1652 |
| `vibe_fire_o` | Ω | Ch9 | L44 | 103 | **3239** *(was 298)* | **49** | dmg **8799** / 13199 |
| `vibe_fire_x` | Σ | Ch9 | L46 | 107 | **4311** *(was 430)* | **78** | dmg **11999** / 17999 |
| `vibe_freeze_b` | β | Ch5 | L24 | 59 | **72** *(was 114)* | **15** | dmg **143** / 215 |
| `vibe_freeze_g` | γ | Ch7 | L32 | 76 | **971** *(was 187)* | **30** | dmg **2201** / 3302 |
| `vibe_freeze_o` | Ω | Ch9 | L46 | 107 | **3162** *(was 286)* | **52** | dmg **8801** / 13202 |
| `vibe_freeze_x` | Σ | Ch10 | L52 | 120 | **8000** *(was 405)* | **80** | dmg **24000** / 36000 |
| `vibe_volt_a` | α | Ch4 | L20 | 50 | **49** *(was 58)* | **9** | dmg **90** / 135 |
| `vibe_volt_b` | β | Ch5 | L26 | 63 | **228** *(keep)* | **19** *(keep)* | dmg **467** / 701 |
| `vibe_volt_g` | γ | Ch8 | L40 | 94 | **1714** *(was 209)* | **36** | dmg **4399** / 6599 |
| `vibe_volt_o` | Ω | Ch10 | L47 | 109 | **6036** *(was 300)* | **55** | dmg **17001** / 25502 |
| `vibe_volt_x` | Σ | Ch10 | L52 | 120 | **8000** *(was 420)* | **82** | dmg **24000** / 36000 |
| `starsong_b` | β | Ch6 | L30 | 72 | **500** *(was 132)* | **17** | dmg **1100** (holy) |
| `starsong_g` | γ | Ch8 | L38 | 89 | **1772** *(was 210)* | **30** | dmg **4400** (holy) |
| `starsong_o` | Ω | Ch10 | L48 | 111 | **5965** *(was 300)* | **50** | dmg **17000** (holy) |
| `starsong_x` | Σ | Ch10 | L52 | 120 | **8000** *(was 440)* | **84** | dmg **24000** (holy) |
| `heartmend_a` (heal) | — | Ch5 | L27 | 65 | **199** *(was 160)* | **12** *(keep)* | heal **361** |

Ladder powers (monotonic ✓): Fire **10→18→508→3239→4311**; Freeze **12→72→971→3162→8000**
(NB Freeze β drops 114→72 to keep it inside the new Ch5 band and below γ — the old 114
was an OLD-HP artifact); Volt **49→228→1714→6036→8000**; Starsong **10→500→1772→5965→8000**.
Volt α drops 58→49 to seat α at the Ch4 player-facing band (~90) and stay below β. Mia's
elemental edge (×1.5 weakness) is what keeps her the party's DPR engine — the raw numbers
above already land her in-band; a weak target pushes her ahead, by design.

### 1c. Milo (`milo`) — gadgets, flat `power`, no Vibe, 0 PP

| id | band | earn L | new `power` | resulting dmg |
|---|---|---|---|---|
| `cryo_grenade` | Ch4 | L22 | **80** *(keep)* | **80** freeze + skip-lock (×1.5 weak = 120) |
| `multi_bottle_rocket` | Ch6 | L28 | **140** *(keep)* | **140** AoE |
| `siege_rocket` | Ch7 | L34 | **360** *(keep)* | **360** the boss-buster, flat, no resource |

Milo's gadgets are **already on the right shape** for the late bands and need no change
from their current values — they read `power` directly (no Vibe). His role is the
party's reliable flat-damage TOOLBOX, deliberately a fraction of the psychics' nukes by
the endgame (siege 360 vs Surge Σ 24000) — he never out-scales the old light. *(Bottle
Rocket 28 / Big Bottle Rocket 60 / Static Bomb 20 / Med-Spray 90 already set in Ch1-3
spec §1c.)*

### 1d. Dorin — Comet α/β/γ/Ω + Healing β

> ⚠ **SUPERSEDED BY ADR-125 ("Dorin: The Long Way Home") — re-derive when built.**
> Dorin now joins **Ch.5 end** (Minimus) and is in `BOSS_PARTY` **from Ch.6**, not Ch.10.
> The powers in this section were computed for the OLD **Ch.9/L46** join, so they are NOW
> a CEILING, not the live values: when the Ch.4–10 chapters are built, his Comet/Healing
> rungs spread across Ch.5–9 (earn ~L26 at Ch.5) and their `power` is re-derived for those
> earlier earn-levels through the unchanged formulas, and a prayer-bead rung is added below
> `cedar_beads`. **Net balance effect:** adding Dorin to `BOSS_PARTY[6..9]` raises the
> mid/late party DPR and directly **resolves the §2 Ch.9 conservative TTK-16 flag** (that
> fight read slow precisely because the model excluded Dorin). Re-run `npm run balance`
> after the rebuild. The table below is retained as the Ch.9/10 (fully-grown) end-state.

Dorin joins **Ch9** (party from Ch10). His ladder must climb **by TIER** (`ladder()`
sorts α→β→γ→Ω and the test wants power increasing), even though `vibe_comet_o` (Ω,
awaken L46) is earned *before* `vibe_comet_g` (γ, L48). So Comet γ is banded BELOW Ω in
power on purpose (its dmg target is Ch9-Ω, Ω's is Ch10-Ω).

| id | tier | band | earn L | Vibe | new `power` | new `pp` | resulting |
|---|---|---|---|---|---|---|---|
| `vibe_comet_a` | α | Ch9 | L46 | 97 | **1070** *(was 130)* | **20** *(keep)* | dmg **2800** |
| `vibe_comet_b` | β | Ch9 | L46 | 97 | **2140** *(was 190)* | **30** *(keep)* | dmg **5600** |
| `vibe_comet_g` | γ | Ch9→10 | L48 | 101 | **3280** *(was 250)* | **44** *(keep)* | dmg **8801** |
| `vibe_comet_o` | Ω | Ch10 | L46 | 97 | **6497** *(was 320)* | **60** *(keep)* | dmg **17000** |

Powers **1070 → 2140 → 3280 → 6497** (monotonic ✓). Leaps α→β ×2.0, β→γ ×1.53, γ→Ω ×1.98.
Comet is a no-element AoE (no weakness multiplier) — these are the player-facing numbers.

### 1e. Pippa — the two `power>0` lines (no Vibe, kind `physical`)

| id | kind | band | earn L | new `power` | resulting heal |
|---|---|---|---|---|---|
| `pocket_patch` (heal) | physical | Ch5 | L1-on-join | **360** *(was 35)* | heal **360** flat |
| `field_dressing` (heal) | physical | Ch6 | L26 | **700** *(was 90)* | heal **700** flat (party) |

Pippa heals are flat `power` (no Vibe). Banded to her join era's heal column (Ch5 ~360,
Ch6 ~700). Every other Pippa ability is `power:0` (marks/morale/guard/evasion) → unchanged.

### 1f. Buffs / status / drain — `power` stays **0** (rescale nothing)

All keep `power:0` and current PP. Jay: `powershield_a` `powershield_s` `ward_s`
`hypno_o` `mindwarp_a` `mindwarp_o` `flash_o` `resolve_a` `teleport_b` `shield_s`.
Mia: `magnet_a/b/g/o/x` (pp_drain/lifedrain statuses) `lucky_star` `hush_hex`
`dreamlull`. Milo: `scope` `forcefield_gizmo`. Dorin: `healing_a` `healing_g`
`healing_o` `brainjam_a/g/o` `mirror` `mirror_o` `stone_stance` `flowing_step`.
Pippa: `pinpoint_mark` `royal_rally` `scale_step` `big_little_focus` `bellwether`
`volley_mark` `diplomatic_immunity` `stern_decree` `standing_ovation` `the_minutes`.
*(Dorin `healing_b` is the one `power>0` Dorin support line — see §1d row.)*

### 1g. ⚠ FLAG — leaps & one ratio tension

- **Big β→γ leaps are intended, not a regression.** Surge β→γ ×20, Fire β→γ ×28: β is
  pinned at Ch3 (player-facing ~89 / ~31) and γ is earned 3–4 bands later. The
  `verify.test` ladder check only requires power to **increase** rung-to-rung (it does,
  everywhere) and the **α→β** leap in **[2.4,2.9]** — which is untouched from Ch1-3.
  Both hold. No conflict with the test; the magnitude is the deliberate wide ramp.
- **Fire α→β is 1.8, NOT in [2.4,2.9].** This was ALREADY the case after the Ch1-3
  landing (α10/β18). The test gates `['Vibe Surge','Vibe Fire']` α→β at [2.4,2.9] — so
  **`vibe_fire_b` must be ≥ 24** (α10 → β≥24 gives ≥2.4) to pass `verify.test`. The
  Ch1-3 spec set it to 18, which the late retune does not move. **CONFLICT to resolve at
  apply time:** either the Ch1-3 value of `vibe_fire_b` rises to **26** (player-facing
  dmg ~45 at L17, the Ch3 β-band — fully in band, ratio 2.6) or the test's gated set
  drops 'Vibe Fire'. **Recommended: set `vibe_fire_b` power 26** (matches Surge's 2.6 and
  the `BALANCE_REVAMP` α:β ≈ 1:2.6 promise). All §1b Fire γ+ powers already sit above 26.

---

## 2. BOSS_HP Ch4–9 + the_hush(Ch10) + minibosses — the new ladder + TTK

The new ladder (replaces the old `curves.ts` `BOSS_HP` Ch4–9 of 1900/2150/2300/3200/
4100/5300 — a nearly-flat line that never climbed with the new damage):

| Ch | Boss | id | level | party (`BOSS_PARTY`) | **new HP** | smooth ramp |
|---|---|---|---|---|---|---|
| 4 | The Whisperwig | `the_whisperwig` | 22 | rex,faye,milo | **1,800** | ×2.40 vs Ch3 750 |
| 5 | Whiskerzilla | `whiskerzilla` | 26 | rex,faye,milo | **4,000** | ×2.22 |
| 6 | The Laughing Sphinx | `laughing_sphinx` | 30 | rex,faye,milo,pippa | **9,000** | ×2.25 |
| 7 | Cobra Raja | `cobra_raja` | 35 | rex,faye,milo,pippa | **20,000** | ×2.22 |
| 8 | The Paper Dragon | `paper_dragon` | 40 | rex,faye,milo,pippa | **45,000** | ×2.25 |
| 9 | Count Hoaxula | `count_hoaxula` | 46 | rex,faye,milo,pippa | **95,000** | ×2.11 |
| 10 | The Hush (finale) | `the_hush` | 52 | rex,faye,milo,pippa,dorin | **150,000** | ×1.58 (3-phase ~50k/phase) |
| 10 | Frost Sentinel (mini) | `frost_sentinel` | 52 | (gauntlet) | **50,000** | — |
| 10 | Tiki Magma Golem (mini) | `tiki_magma_golem` | 52 | (gauntlet) | **50,000** | — |

The ladder climbs smoothly (~2.1–2.4× per chapter, easing to 1.58× at the finale because
the Hush is split across three ~50k phases). `verify.test` "boss HP and target level climb
together" passes (each row > the one below; Ch3 750 < Ch4 1800).

### The Hush — finale loadout variants (ADR-130, BRANCHING_REDESIGN §4.3)

The "Held Breath" branch makes the Hush fightable at **party size 3/4/5**, with Dorin's
**Comet Ω** possibly withheld (IRON) and the **Stolen Light** chip possibly banked (IRON).
Two small, on-curve knobs keep every reachable loadout in the fair **TTK 4–10** window —
modeled in `src/battle/verify.ts` (`finaleHushChecks`), printed by `npm run balance`, pinned
by `verify.test.ts`:

- a per-party-size **effective-HP ease** `FINALE_HUSH_HP` = {5: 150k, 4: 138k, 3: 120k} — a
  wounded party faces a Hush the long road had already worn thinner;
- the **Stolen Light** per-round chip = its own §A8 item `power` (600), a survival-round
  reducer, **not** a nuke (well under a tenth of party DPR).

Conservative read (base stats, no weapons): warm full-five **TTK 7** (== `bossCheck(10)`); the
Dorin-less paths sit at **8–9** (the control path's legible cost); none below 4 or above 10.
Money > combat holds — every effective HP ≤ 150k ≪ the $3B Ch.10 Fortune target.

### TTK — computed exactly as `verify.ts` (`bossCheck`)

Model: party = `BOSS_PARTY[ch]`, each hero's `heroDamagePerRound` at the §A6 target level,
**base stats, NO weapon, bossDef = level** (reduces only the physical term; Vibe ignores
defense). Best **affordable** nuke (pp ≤ maxPp) amortized over `SUSTAIN_ROUNDS=8`, then
physical. **Unlanded bosses have NO `ENEMIES[id]` entry → `bossWeakness` returns ∅ → no
×1.5** (the conservative floor). `ttk = ceil(HP / partyDPR)`. Powers = the new §1 values.

| Ch | HP | level | partyDPR (new, conservative) | **TTK** | window [4,10]? | verify [2,25]? |
|---|---|---|---|---|---|---|
| 4 | 1,800 | 22 | 261 (rex 88 + faye 93 + milo 80) | **7** | ✓ | ✓ |
| 5 | 4,000 | 26 | 562 (rex 100 + faye 369 + milo 93) | **8** | ✓ | ✓ |
| 6 | 9,000 | 30 | 1,052 (rex 112 + faye 730 + milo 140 + pippa 70) | **9** | ✓ | ✓ |
| 7 | 20,000 | 35 | 2,877 (rex 954 + faye 1482 + milo 360 + pippa 81) | **7** | ✓ | ✓ |
| 8 | 45,000 | 40 | 4,918 (rex 1028 + faye 3438 + milo 360 + pippa 92) | **10** | ✓ | ✓ |
| 9 | 95,000 | 46 | 6,476 (rex 1434 + faye 4578 + milo 360 + pippa 104) | **15** | ✗ (slow) | ✓ |
| 10 | 150,000 | 52 | 24,968 (rex 6145 + faye 9089 + milo 360 + pippa 116 + dorin 9258) | **7** | ✓ | ✓ |
| 10 mini | 50,000 | 52 | 24,968 | **3** | ✗ (fast)* | ✓ |

**Sample DPR math (Ch7, L35, conservative, no weakness):**
- Jay: best affordable nuke = Surge γ (pw1100, V67 → dmg 2695, pp38 ≤ maxPp126). casts =
  126÷38 = 3, so 3 nuke rounds + 5 phys rounds (phys ≈ off73·2−def35 SMAAASH-weighted ≈ 113):
  (3·2695 + 5·113)/8 = **954**.
- Mia: best = Volt β (pw228, V83 → dmg 543) capped only by pp19; Freeze γ (pw971, V83 →
  dmg 2314, pp30 ≤ maxPp169) wins. casts 169÷30 = 5 → (5·2314 + 3·~75)/8 = **1482**.
- Milo: Siege Rocket 360 (0 PP, sustains all 8 rounds) = **360**.
- Pippa: pure physical (no `power>0` nuke) ≈ **81**.
- partyDPR = 954+1482+360+81 = **2877**. TTK = ceil(20000/2877) = **7**. ✓

### ⚠ FLAG — Ch9 Count Hoaxula TTK = 15 (above the design [4,10], inside verify [2,25])

The prescribed ladder's Ch9 = 95,000 is the steepest spot relative to the **conservative
floor**: at L46 the party is still **four** (Dorin doesn't join the `BOSS_PARTY` until
Ch10), and Jay/Mia are capped at **γ**-tier nukes (their Ω rungs earn at L47/L47/L48,
one level too late). HP jumped 45k→95k (×2.11) while conservative DPR rose only 4918→6476.

- **Conservative (model floor):** TTK **15** — passes the pinned `verify.test` [2,25].
- **With the single elemental weakness a real Ch9 boss carries (×1.5 on Mia's Freeze/Fire
  Ω):** partyDPR ≈ 8,726 → TTK **11** — still a hair over 10.
- **±15% boss adjustment (the rule):** Ch9 −15% = **80,750** → conservative TTK **13**,
  weakness TTK **10** (in window). To reach conservative ≤10 would need ~64,760 (−32%),
  which **breaks** the ±15% band and the smooth ladder.

**Recommendation:** keep **95,000** (the coherent geometric value) and ACCEPT the
conservative TTK 15, exactly as the Ch1-3 spec accepted the Tick's TTK-3 floor: note in
the commit that the headless model under-reads Ch9 because Dorin is excluded pre-Ch10 and
the Ω nukes land one level late. The felt fight (geared, weakness, Dorin available by the
chapter's end) sits at ~9–11. If the balance-sim MUST print ≤13, the only in-rule lever is
**Ch9 80,750** (−15%); flagged, coordinator's call.

*Miniboss note (TTK 3): the Ch10 gauntlet golems at 50k each fall in 3 conservative
rounds against the full five-hero L52 party — fast, but they are GATES on the way to the
finale (two back-to-back, elemental-golem gimmick), not the boss. 50k holds; the fast read
is expected (same spirit as the Tick flag). Passes verify [2,25].

---

## 3. The Ch10 the_hush change 6,000 → 150,000 — every pin

`the_hush` is currently the bespoke **6,000**-HP finale shell, hard-coded in THREE places.
All must move together to **150,000** (and the validator's special-case literal updated):

1. **`src/data/chapters.ts`** L218 — `CHAPTER_MANIFESTS['10'].boss`:
   `{ id: 'the_hush', name: 'The Hush', hp: 6000 → 150000, template: 'bespoke' }`.
   This manifest `boss.hp` is what `verify.ts`/`balance-sim` read for the TTK check.
2. **`tools/content-validate.ts`** L2245 — the finale special-case:
   `} else if (m.boss.hp !== 6000) {` → `} else if (m.boss.hp !== 150000) {`
   and the fail message text "the 6,000-HP shell" → "the 150,000-HP shell". (Ch.10 is the
   one chapter NOT pinned to `BOSS_HP[ch]`; this literal IS its pin.)
3. **`src/levelkit/forge/curves.ts`** — `MINIBOSS_HP` (L67):
   `{ frost_sentinel: 2800 → 50000, tiki_magma_golem: 3000 → 50000 }`. The manifest
   minibosses (`chapters.ts` L219–222, `frost_sentinel.hp 2800→50000`,
   `tiki_magma_golem.hp 3000→50000`) MUST match — `content-validate.ts` L2248–2252 fails
   on any mismatch against `MINIBOSS_HP`.

Also update (BOSS_HP Ch4–9, §2) and its test pin:
4. **`src/levelkit/forge/curves.ts`** `BOSS_HP` (L52–64): Ch4 1900→**1800**, Ch5 2150→**4000**,
   Ch6 2300→**9000**, Ch7 3200→**20000**, Ch8 4100→**45000**, Ch9 5300→**95000** (Ch1–3
   already 60/300/750; Ch10 stays bespoke, not in this map).
5. **`src/data/chapters.ts`** boss HP Ch4–9 (`the_whisperwig` 1900→1800, `whiskerzilla`
   2150→4000, `laughing_sphinx` 2300→9000, `cobra_raja` 3200→20000, `paper_dragon`
   4100→45000, `count_hoaxula` 5300→95000) — `content-validate.ts` L2244 fails if
   `m.boss.hp !== BOSS_HP[ch]`, so these must equal §2.
6. **`src/levelkit/forge/forge.test.ts`** L79 — the pinned literal:
   `expect(BOSS_HP).toMatchObject({ 1:60, 2:300, 3:750, 4:1900, 5:2150, 6:2300, 7:3200,
   8:4100, 9:5300 })` → update Ch4–9 to `4:1800, 5:4000, 6:9000, 7:20000, 8:45000, 9:95000`
   (and the ADR-122 comment on L78). **This test WILL fail until updated** — it is the
   forward pin the Ch4–10 retune lands against.

*(No `enemies.ts` edits for Ch4–10: those bosses are still `unlanded` — they have no live
`ENEMIES[id]` entry yet, which is also why the TTK model runs them weakness-free. When a
late chapter ships its boss as a live enemy, that commit adds the `enemies.ts` row at the
same HP, exactly as Ch1-3 did.)*

---

## 4. MONEY check — boss HP ≪ `fortuneTarget(ch)` (monetary-dominance invariant)

`fortuneTarget` (from `src/data/fortune.ts` `FORTUNE_ARC`): Ch4 $60k, Ch5 $250k, Ch6
$1.2M, Ch7 $8M, Ch8 $60M, Ch9 $400M, Ch10 $3B. Every boss HP sits **far** below it, and
the gap **widens** every chapter — money owns the big numbers, exactly the approved vision:

| Ch | boss HP | `fortuneTarget` | ratio (money / HP) |
|---|---|---|---|
| 4 | 1,800 | $60,000 | **33×** |
| 5 | 4,000 | $250,000 | **63×** |
| 6 | 9,000 | $1,200,000 | **133×** |
| 7 | 20,000 | $8,000,000 | **400×** |
| 8 | 45,000 | $60,000,000 | **1,333×** |
| 9 | 95,000 | $400,000,000 | **4,211×** |
| 10 | 150,000 | $3,000,000,000 | **20,000×** |

Combat reads into the **thousands per hit** (Surge Σ 24,000) against **tens/hundreds of
thousands** of boss HP by the endgame — epic and legible — while net worth runs three to
five orders of magnitude higher. Invariant holds with a growing margin at every chapter. ✓

---

## Summary of edit sites (for the coordinator)

1. `src/data/abilities.ts` — §1a Jay (Surge γ/Ω/Σ power; Lifeup β/γ/Ω power), §1b Mia
   (Fire γ/Ω/Σ, Freeze β/γ/Ω/Σ, Volt α/β/γ/Ω/Σ, Starsong β/γ/Ω/Σ, Heartmend power+pp),
   §1c Milo (no change — already in-band), §1d Dorin (Comet α/β/γ/Ω, Healing β),
   §1e Pippa (`pocket_patch`, `field_dressing` power). **Plus the §1g fix:
   `vibe_fire_b` power 18→26** so the gated α→β leap stays ≥2.4.
2. `src/levelkit/forge/curves.ts` — `BOSS_HP` Ch4–9 (§2) + `MINIBOSS_HP` (§3.3).
3. `src/data/chapters.ts` — boss HP Ch4–9 (must match `BOSS_HP`), `the_hush` 6000→150000,
   the two miniboss HPs (§3.1, §3.3).
4. `tools/content-validate.ts` — the `!== 6000` finale literal → `!== 150000` + message (§3.2).
5. `src/levelkit/forge/forge.test.ts` — the `BOSS_HP` `toMatchObject` pin Ch4–9 (§3.6).
6. Re-run `npm run balance` + `npm test`; expect TTK 7/8/9/7/10/15/7 for Ch4–10 and 3 for
   the minibosses (Ch9 = 15 conservative is the §2 flag — note it in the commit so it is
   not read as a regression).

## Hard-pin conflict check (required by ADR-122)

- **Ch9 95,000 vs the [4,10] design window:** CONFLICT (conservative TTK 15). Documented in
  §2; recommended resolution is to LAND 95,000 and rely on Dorin/weakness/gear (felt ~9–11),
  noting the model floor in the commit — or take the −15% (80,750) in-rule option. This is
  the only curve-vs-window tension in Ch4–10.
- **`vibe_fire_b` α→β leap (1.8) vs `verify.test` [2.4,2.9]:** CONFLICT inherited from the
  Ch1-3 landing. Resolved by raising `vibe_fire_b` power 18→26 (§1g) — in-band and
  ratio-correct; **must ship in the same commit** or `verify.test` fails.
- **Comet γ earned (L48) after Ω (L46) but must rank below it:** RESOLVED by banding γ to
  Ch9-Ω (power 3280) and Ω to Ch10-Ω (power 6497) so `ladder()`'s tier-ordered power check
  passes (1070 < 2140 < 3280 < 6497).
- **`the_hush` 6,000 → 150,000 three-way (manifest / validator literal / forge test):** all
  pins listed in §3 so they move together (the validator + the test fail on any mismatch).
- **Ch10 minibosses 50k vs TTK 3:** fast-read FLAG (§2), not a hard conflict — passes the
  pinned [2,25]; they are gauntlet gates, like the Tick.
