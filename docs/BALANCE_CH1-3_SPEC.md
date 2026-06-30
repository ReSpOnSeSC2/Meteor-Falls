# BALANCE_CH1–3 SPEC — the exact numbers (ADR-122)

> Concrete, apply-ready values for the **shipped Ch.1–3 combat rescale**. This
> is the data the coordinator lands; it touches NO code logic. Damage formulas
> in `src/battle/formulas.ts` are **unchanged** — every target below is derived
> through them.
>
> **Damage model (verbatim from the formulas + `BALANCE_REVAMP.md`):**
> - Vibe dmg = `power · (1 + Vibe/60)` ±10%  → **power = targetDmg ÷ (1 + Vibe/60)**
> - Gadget dmg (Milo, no Vibe) = `power` ±10%
> - Physical = `max(1, off·2 − def)` ±15%
> - Heal = `power · (1 + Vibe/80)` ±10%  → **power = targetHeal ÷ (1 + Vibe/80)**
> - A matching enemy weakness ×1.5 (Mainframe cooling-fan freeze override ×2).
>
> **Vibe read off `growthRow` at each rung's EARNING level** (`statsAtLevel`,
> `round(base + growth·(L−1))`). Chapter boundary by §A6 `targetLevel`:
> **Ch.1 ≤ L8 · Ch.2 ≤ L13 · Ch.3 ≤ L18.** Heroes' Vibe at the levels used:
>
> | Hero | base/grow | L1 | L6 | L7 | L8 | L13 | L17 | L18 |
> |---|---|---|---|---|---|---|---|---|
> | Jay (`rex`) | 6 / 1.8 | 6 | — | 17 | 19 | 28 | — | 37 |
> | Mia (`faye`) | 8 / 2.2 | 8 | 19 | — | 23 | 34 | 43 | 45 |
> | Milo (`milo`) | 0 / 0 | 0 | … | … | … | … | … | 0 |
> | Dorin | 7 / 2.0 | — joins Ch.9, OUT OF SCOPE — |
> | Pippa | 0 / 0 | — joins Ch.5, OUT OF SCOPE — |

---

## Scope: which rungs are EARNED in Ch.1–3

Using `AWAKENING_LEVEL` + `heroes.ts` unlock levels mapped to chapter:

- **Jay:** Surge α (`old_light` L1, Ch1), Lifeup α (`last_spark` L1, Ch1 heal),
  Surge β (unlock L18, **Ch3**). *(Hypno α L10, Shield α L14, Ward α L16, Mind
  Warp α L18 are all `power:0` buffs — power stays 0, see §1d.)*
- **Mia:** Fire α (`first_listen` L6, Ch1), Starsong α (`the_first_heartlight`
  L8, Ch1 close), Freeze α (`cold_reads` L13, **Ch2** boss), Fire β (unlock L17,
  **Ch3**). *(Magnet α L15 is `power:0`.)*
- **Milo:** gadgets only, **no Vibe** (joins Ch3). In Ch.1–3 menu by L18: Bottle
  Rocket (L1), Scope (L8, power 0), Big Bottle Rocket (L14), Forcefield (L16,
  power 0), Static Bomb (L18), Med-Spray (L20 — borderline, included for the
  heal band).
- **γ/Ω/Σ rungs and Comet, Multi-Rocket, Siege Rocket, all of Dorin/Pippa →
  Ch.4+ — NOTED, NOT finalized here.** (See §1e for the forward curve note.)

---

## 1. ABILITIES — new `power` / `pp`

### 1a. Jay (`rex`)

| id | tier | band | earn L | Vibe used | new `power` | new `pp` | resulting player-facing |
|---|---|---|---|---|---|---|---|
| `vibe_surge_a` | α | Ch1 | L1 | 6 → 17 | **38** *(was 20; ADR-131)* | **6** *(was 10)* | dmg **42→49** *(see note)* |
| `vibe_surge_b` | β | Ch3 | L18 | 37 | **55** *(was 143)* | **18** *(was 22)* | dmg **89** |
| `lifeup_a` (heal) | α | Ch1 | L1 | 6 → 17 | **12** *(was 45)* | **5** | heal **13→15** |

**Surge α note (ADR-131 — REVISED):** the original power-20 tuning made Surge α
merely *track* the bat — by L5+ a free SMAAASH swing matched or beat the 6-PP
signature nuke, so the menu pick was effectively dead (a playtest "this does not
make sense"). Surge α is now **power 38**, reading **42 (L1, Vibe 6) → 49 (L7,
Vibe 17)** — a real nuke that clearly out-damages a swing (~1.5×) through its
L1–17 window, before Surge β takes over at L18. The old "don't one-shot 30-HP
trash" worry is moot post-ADR-111 (Ch.1 trash is 12–14 HP — even power 20 already
one-shot it), and the nuke stays a *limited* resource (6 PP × ~2 casts at L1 →
fall back to the slow-burn bat). The β:α power ratio is now ~1.45× (55/38): a
strengthened α intentionally **gentles** the α→β awakening leap (β is still a
clear single-hit upgrade for 3× the PP). The Tick's HP rises 100→**200** so the
solo-Jay TTK stays a fair ~5 with the bigger nuke (see the boss-TTK table below).

### 1b. Mia (`faye`)

| id | tier | band | earn L | Vibe used | new `power` | new `pp` | resulting player-facing |
|---|---|---|---|---|---|---|---|
| `vibe_fire_a` | α | Ch1 | L6 | 19 | **10** *(was 48)* | **6** | dmg **13** (×1.5 weak = **20**) |
| `starsong_a` | α | Ch1 | L8 | 23 | **10** *(was 56)* | **8** | dmg **14** (holy) |
| `vibe_freeze_a` | α | Ch2 | L13 | 34 | **12** *(was 52)* | **7** | dmg **19** (×1.5 weak = **29**) |
| `vibe_fire_b` | β | Ch3 | L17 | 43 | **18** *(was 125)* | **14** | dmg **31** (×1.5 weak = **46**) |
| `pray` | — | Ch1 | L1 | — | 0 (unchanged) | 0 | RNG table unchanged |
| `heartmend_a` (heal) | — | Ch3* | L27 | — | **70** *(was 160)* | **12** | heal ~**95** @Ch3 Vibe — *L27 is Ch4-ish; trim listed for consistency, finalize w/ Ch4* |

Mia's α band lands 13–19 (Ch1–2) climbing to ~31 (Ch3 β), matching the curve's
Ch2 ~22 / Ch3 ~45 once the freeze/fire weakness multiplier is in play (her
identity is the elemental edge). PP held to a fraction of her pool (mp ≈ 14 at
L6, 52 at L13, 65 at L17) so an α is cheap and a β is a real choice.

### 1c. Milo (`milo`) — gadgets, flat `power`, no Vibe, 0 PP

| id | band | earn L | new `power` | resulting dmg |
|---|---|---|---|---|
| `bottle_rocket` | Ch3 (L1 kit) | L1 | **28** *(was 90)* | **28** (×1.5 weak = 42) |
| `big_bottle_rocket` | Ch3 | L14 | **60** *(was 220)* | **60** |
| `static_bomb` | Ch3 | L18 | **20** *(was 70)* | **20** AoE + paralyze |
| `med_spray` (heal) | Ch3 | L20 | **90** *(was 120)* | heal **90** flat |
| `scope` | Ch3 | L8 | 0 (unchanged) | mark, no dmg |
| `forcefield_gizmo` | Ch3 | L16 | 0 (unchanged) | party shield |

Milo joins Ch.3, so his whole damaging kit is banded to **Ch3 (Basic-hit
10–28)**. Bottle Rocket 28 sits at the top of that band (a tool, not a nuke);
Big Bottle Rocket 60 is his boss-buster of the era. Gadgets read `power`
directly (no Vibe), so these ARE the player-facing numbers.

### 1d. Buffs — power stays **0** (rescale nothing)

All of these keep `power: 0` and current PP (they are status/utility, not
damage/heal): Jay — `hypno_a` `shield_a` `shield_s` `flash_a` `teleport_a`
`ward_a` `mindwarp_a`; Mia — `magnet_a`; Milo — `spy` `repair` `scope`
`forcefield_gizmo`. (Multi-rung versions of these belong to Ch.4+.)

### 1e. Ch4+ rungs — NOTED, defer

Surge γ/Ω/Σ, Fire/Freeze/Volt/Starsong γ/Ω/Σ, Magnet Ω/Σ, all Comet, Milo's
Multi/Siege Rocket, all of Dorin & Pippa: these are earned at L31+ and must be
tuned against the **Ch4–10 boss curve** with the same `power = target ÷ (1+V/60)`
method. They are **out of scope** for this landing per ADR-122's apply order.

---

## 2. BOSSES — HP + implied TTK

TTK computed exactly as `verify.ts` does: party = `BOSS_PARTY[chapter]`, each
hero's DPR via `heroDamagePerRound` (base stats, NO weapon — a conservative
lower bound), `bossDef = targetLevel`, best affordable nuke amortized over 8
rounds, then `ttk = ceil(HP / partyDPR)`. Powers used = the new §1 values.

| Boss | id | level | party | partyDPR (new) | **new HP** | TTK | window 4–10? |
|---|---|---|---|---|---|---|---|
| Titanic Tick | `titanic_tick` | 8 | Jay solo | ~40 | **200** *(ADR-131; was 100)* | **5** | ✓ |
| Idol of the Gilded Grin | `gilded_grin` | 13 | Jay+Mia | ~94 | **300** | **4** | ✓ |
| Headmaster Mainframe | `headmaster_mainframe` | 18 | Jay+Mia+Milo | ~192 | **750** | **4** | ✓ |

DPR breakdown:
- **Tick L8 (ADR-131):** solo Jay ~40 — with Surge α at **pw38** the nuke (~50)
  now beats his swing (~34), so the amortized DPR rises ~30→40 and the HP rises
  100→**200** to hold TTK at **5**. (β doesn't exist yet — α is the whole kit.)
- **Grin L13:** Jay ~55 (Surge α **pw38**, nuke ~56 ≳ swing ~50), Mia ~39 (Freeze α
  pw12 ×1.5 weak) = **94**. 300/94 = **4 turns.** ✓ (HP pin holds — Jay's nuke and
  swing are close at L13, so the α buff barely moves the Grin.)
- **Mainframe L18:** Jay ~67 (Surge β pw55), Mia ~52 (Fire β pw18 ×1.5),
  Milo ~65 (Big Bottle Rocket 60) = **184**. 750/184 = **5 turns.** ✓
  *(Note: `verify.ts` applies the generic ×1.5 weakness, not the `weakMul:2`
  cooling-fan override, so the real geared fight is faster — the model is a
  floor. The 750 pin holds comfortably.)*

### ✓ RESOLVED — Titanic Tick HP (was a 60-HP TTK-floor conflict)

This flag is closed. The Tick was relocated to the Heart Oak and bumped 60→**100**
(ADR-121), then 100→**200** (ADR-131) to absorb Surge α's nuke buff. At L8 solo
Jay's DPR is ~40 (Surge α pw38), so 200/40 = **TTK 5** — comfortably inside the
4–10 window, no latch/sever hand-waving needed. Pinned in all six places (the §A7
`canon` table, `BOSS_HP`, `CHAPTER_MANIFESTS`, `enemies.ts`, and the `forge`/
`state` test fixtures), same commit.

**Recommendation: land 60** and rely on the latch turns, but the sim WILL print
TTK 3 — note it in the commit so it isn't read as a regression.

### Pin locations (BOTH must change, same value)

- `src/data/enemies.ts`: `titanic_tick.hp 150→60`, `gilded_grin.hp 980→300`,
  `headmaster_mainframe.hp 1600→750`.
- `src/data/chapters.ts`: `CHAPTER_MANIFESTS` boss HP — `titanic_tick 150→60`,
  `gilded_grin 980→300`, `headmaster_mainframe 1600→750` (manifest boss.hp is
  the source `verify.ts`/`balance-sim` read; it MUST match `enemies.ts`).
- `tools/content-validate.ts` `canon{}`: `titanic_tick 150→60`,
  `gilded_grin 980→300`, `headmaster_mainframe 1600→750`.

---

## 3. ENEMIES — only those OVER their band (Ch.2 trash 25–80, Ch.3 70–200)

Ch.1 trash (HP 12–32) is already in-band → **leave every Ch.1 enemy unchanged**
(incl. `borden` 70, the set-piece). Ch.2 band 25–80, Ch.3 band 70–200. Listing
ONLY the over-band trims; in-band enemies untouched. `canon` value == enemy HP.

| id | chapter | old HP | band ceiling | **new HP** | reason |
|---|---|---|---|---|---|
| `cursed_souvenir` | Ch2 | 95 | 80 | **78** | over Ch2 80 |
| `step_mask` | Ch2 | 110 | 80 | **80** | over Ch2 80 |
| `jungle_jitterbug` | Ch2 | 120 | 80 | **80** | over Ch2 80 (late-pressure → top of band) |
| `the_invigilator` | Ch3 | 210 | 200 | **200** | over Ch3 200 (set-piece → ceiling) |

**Borderline kept as-is:** `gilded_beetle` 85 (Ch2) is 5 over 80 — within noise,
the gold-form gimmick justifies the tank; **leave 85** unless the sim flags it.
All other Ch.2 (`pickpocket_parrot` 70, `banana_bunch` 22, `gilded_beetle` 85)
and **every Ch.3** enemy (70–190) are in-band → **unchanged.**

For each trimmed id, **update the matching `tools/content-validate.ts` `canon`
entry to the identical value** (`cursed_souvenir:78`, `step_mask:80`,
`jungle_jitterbug:80`, `the_invigilator:200`).

> Note: Ch.1 enemy HP is NOT the bug — the audit's culprit was ability power
> (Surge α=55) one-shotting in-band trash. §1 fixes that; Ch.1 HP stays put.

---

## 4. ITEMS — Ch.1–3 weapon `offense` + cure/PP `heal`

### 4a. Weapons — `offense` to the per-chapter Basic-hit band

Physical = `off·2 − def`. Bands (player-facing basic hit): Ch1 1–4, Ch2 4–12,
Ch3 10–28. Weapon offense is on TOP of base offense, so these are tuned so a
*geared* hero's swing sits in-band against same-chapter trash defense (~2–16).

| id | wielder | chapter | old `offense` | **new `offense`** |
|---|---|---|---|---|
| `cracked_bat` | rex | Ch1 | 4 | **2** |
| `tball_bat` | rex | Ch1 | 8 | **4** |
| `wiffle_bat` | rex | Ch1 | 2 | **1** |
| `foam_finger` | rex | Ch1 | 1 | **1** (keep; it's a Luck joke, +8 Luck rider stays) |
| `hand_me_down_pan` | faye | Ch1 | 6 | **3** |
| `nonstick_pan` | faye | Ch1 | 13 | **5** |
| `sandlot_slugger` | rex | Ch2 | 18 | **8** |
| `copper_pan` | faye | Ch2 | 15 | **7** |
| `pellet_popper` | milo | Ch3* | 14 | **10** |
| `spud_gun` | milo | Ch3 | 22 | **14** |
| `double_barrel_sparker` | milo | Ch3 | 32 | **20** |
| `gauss_lobber` | milo | Ch3 (boss drop) | 46 | **26** |
| `cricket_bat` | rex | Ch3 | 17 | **12** |

Ladder shape preserved within each wielder line (e.g. Jay Ch1 cracked 2 →
tball 4; Milo Ch3 popper 10 → spud 14 → sparker 20 → gauss 26). `cedar_beads`
(26, Dorin) is Ch9 → **out of scope, unchanged.**

### 4b. Cure / PP / battle `heal` & `power` to the band

Med (heal) band: Ch1 ~15 · Ch2 ~40 · Ch3 ~90. Foods follow the same curve;
listing the ones that *exceed* it (most Ch1 foods are already ≤45 and fine —
trim only the high ones).

| id | kind | chapter | old | **new** | note |
|---|---|---|---|---|---|
| `corn_dog` | food | Ch1 | heal 30 | **18** | Ch1 med ~15 |
| `apple_pie_slice` | food | Ch1 | heal 45 | **24** | Ch1 high food |
| `choco_comet_bar` | food | Ch1 | heal 35 | **20** | |
| `grilled_cheese` | food | Ch1 | heal 28 | **16** | |
| `pbj` / `lemonade` | food | Ch1 | 20 / 12 | **12 / 8** | |
| `star_cola` `bug_juice` `diet_star_cola` | pp | Ch1 | 12/10/14 | **8 / 6 / 10** | Ch1 PP small |
| `salt_shaker` | battle | Ch1 | power 40 | **20** | breaksLatch stays; was a Tick one-shot |
| `bug_zapper` | battle | Ch1 | power 34 | **18** | |
| `alfajor` `empanada` `ceviche` `tres_leches` … | food | Ch2 | 60–70 | **~40** (40/40/45/45) | Ch2 med ~40 |
| `mango` `arepa` `humita` `choripan` | food | Ch2 | 40–55 | **30–35** | |
| `mate_gourd` `jungle_fizz` | pp | Ch2 | 14 / 11 | **18 / 14** | Ch2 PP rises |
| `guardian_angel_feather` | cure(revive) | Ch2 | heal 200 | **90** | Ch2 big heal band; still "most of the way" |
| `unknot_drops` | cure | Ch2 | (status only) | unchanged | no heal value |
| `fish_and_chips` `sticky_toffee_pudding` `treacle_tart` | food | Ch3 | 70/75/60 | **90/95/80** | Ch3 med ~90 (these RISE) |
| `scone_clotted_cream` `bangers_and_mash` `pork_pie` | food | Ch3 | 50/64/48 | **75/85/65** | |
| `builders_tea` `earl_grey` `school_cocoa` | pp | Ch3 | 16/14/12 | **22/18/16** | Ch3 PP band |
| `second_wind` | cure(revive) | Ch1 | heal 30 | **15** | revive-at-a-sliver, Ch1 band |
| `honey_lozenge` `eye_drops` | cure | Ch3 | (status only) | unchanged | no heal value |

> Direction note: Ch.1/Ch.2 foods come **down** to the new small bands; **Ch.3
> foods come UP** (the old draft Ch.3 foods were tuned to the OLD inflated HP and
> are now too small for ~90-band heroes). Keep the intra-region ladder ordering.

### 4c. Full-restore / full-revive items → **sentinel, not 9999**

Replace the literal `9999` heal with a named sentinel so "FULL" reads in the UI
(per BALANCE_REVAMP §4). Coordinator: add `export const HEAL_FULL = -1;` (a
sentinel the heal seam maps to "restore to max") OR keep a single large const
`HEAL_FULL = 99999` — **the spec's intent is the items show "FULL", not a digit
that collides with the damage scale.** Items affected:

| id | chapter | current | **new** |
|---|---|---|---|
| `glints_spark` | Ch1 | `heal: 9999` | `heal: HEAL_FULL` (full revive) |
| `hallelujah_bell` | Ch10 (OUT OF SCOPE, noted) | `heal: 9999` | leave for Ch10 pass |

Only `glints_spark` is the Ch1–3 full-restore. `hallelujah_bell` is Ch10 — flag
it for the same treatment when Ch10 lands, do **not** touch it now.

---

## 5. HERO HP GROWTH (`heroes.ts`) — early survivability

The HP curve is **already correct for the new bands** and needs **no change**:
`maxHpAtLevel = base + lin·(L−1) + quad·(L−1)²`. Current early values:

| Hero | `hp{base,lin,quad}` | HP L1 | HP L7 | HP L13 | verdict |
|---|---|---|---|---|---|
| Jay | 30 / 6.5 / 0.08 | **30** | 72 | 109 | ✓ "~30 Ch1 climbing" — exact |
| Mia | 26 / 5.6 / 0.07 | 26 | 60 | 103 | ✓ |
| Milo | 28 / 6.0 / 0.07 | 28 | 64 | — | ✓ |
| Dorin | 34 / 7.0 / 0.09 | 34 (joins Ch9) | — | — | ✓ |
| Pippa | 24 / 5.0 / 0.06 | 24 (joins Ch5) | — | — | ✓ |

**No HP-growth params change for Ch.1–3.** Jay at ~30 HP in Ch1 vs Ch1 enemy
hits of 1–5 and a Tick that drains a few per turn is exactly the intended fair
scrap; by L7 (~72 HP) he survives the Tick's ~8–11-offense swings for the 4–5
turns the fight wants. The §5 widening BALANCE_REVAMP mentions is a **Ch.4–10**
concern (so HP reaches tens-of-thousands by Ch10) — out of scope here, and the
quadratic term already starts that ramp. **Flag if a future Ch.4+ pass changes
`quad`: re-run the boss-sim, since HP feeds nothing in Ch.1–3 TTK but does gate
how many enemy turns a hero eats.**

---

## Hard-pin conflict check (required by ADR-122)

- **Titanic Tick 60 vs verify floor:** CONFLICT, documented in §2 (model TTK 3,
  not ≥4). Recommended resolution: land 60, rely on the latch mechanic, note in
  commit. This is the only curve-vs-pin tension in Ch.1–3.
- **Ch.10 finale 6,000-HP Hush shell (`the_hush`, `chapters.ts` L218):** NO
  conflict with this landing — it's untouched and lives in a different band. But
  note for the record: the BALANCE_REVAMP curve says Ch10 Hush **~150k** (3×~50k
  phases), while the pinned manifest shell is **6,000**. **These disagree by
  25×.** That is a Ch.10 problem to resolve when Ch4–10 lands (either the shell
  HP rises to the new curve or the curve's Ch10 row is revised down); **flagged
  here, not actioned.** Nothing in Ch.1–3 depends on it.
- **`enemies.ts` ↔ `chapters.ts` ↔ `canon{}` three-way pin:** all three carry
  the boss HP; §2 lists all three edit sites so they stay equal (the validator
  fails on any mismatch).

## Summary of edit sites (for the coordinator)

1. `src/data/abilities.ts` — §1a/1b/1c power+pp.
2. `src/data/enemies.ts` — §2 boss HP (3) + §3 trash HP (4).
3. `src/data/chapters.ts` — §2 boss HP (3, must match enemies).
4. `tools/content-validate.ts` `canon{}` — §2 boss HP (3) + §3 trash HP (4).
5. `src/data/items.ts` — §4a weapons, §4b heals/pp/power, §4c sentinel.
6. `src/data/heroes.ts` — **no change** (§5).
7. Re-run `npm run balance` + `npm test`; expect Grin TTK 4, Mainframe TTK 5,
   Tick TTK 3 (see §2 flag).
