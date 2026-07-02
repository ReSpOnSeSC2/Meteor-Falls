# Balance Revamp — the combat rescale (ADR-122) · proposal

> Goal (approved): combat reads **1–2 digits early → THOUSANDS by the endgame**
> (a wide JRPG ramp), while MONEY is the bigger axis (Fortune Arc → billions,
> ADR-120). DATA only — formulas in `src/battle/formulas.ts` are unchanged.
> Source: the full current-numbers inventory (abilities/heroes/enemies/bosses/
> items/economy). Verify each band with `npm run balance` (TTK stays 4–10 turns).

## The problem (from the audit)
- The Slow-Burn (ADR-111) compressed Ch.1 ENEMIES (HP 12–32) + Jay's bat (1–2),
  but NOT abilities: **Vibe Surge α = 55 power → ~64 dmg**, so it one-shots all
  Ch.1 trash and out-damages the bat ~6×. Same for Fire α (48), early heals (45).
- Headline magnitudes (Σ 480, boss 6000, heals 9999) sit in the **same digit-range
  as early money** ($1,000s) — money should own the big numbers.

## The damage formula (unchanged — targets must account for it)
- physical = `max(1, off·2 − def)` ±15%
- vibe = `power · (1 + Vibe/60)` ±10%  → so **player-facing damage ≈ power × ~1.2 (early) … ×~3 (late, Vibe ~120)**
- gadget = `power` ±10% (Milo, no Vibe)
- Heals: `power · (1 + Vibe/80)`

So to hit a target *damage*, ability **power = target ÷ (1 + Vibe/60)** at the band's typical Vibe.

## The new per-band curve (player-facing targets)

| Band | Basic hit | Trash HP | Boss HP | α-dmg | Ω-dmg | Σ-dmg | Heal (med) |
|---|---|---|---|---|---|---|---|
| Ch1 | 1–4 | 6–30 | **Tick ~60** | 8–14 | — | — | ~15 |
| Ch2 | 4–12 | 25–80 | ~300 | ~22 | ~60 | — | ~40 |
| Ch3 | 10–28 | 70–200 | ~750 | ~45 | ~140 | — | ~90 |
| Ch4 | 24–60 | 180–450 | ~1,800 | ~90 | ~280 | — | ~180 |
| Ch5 | 50–130 | 400–1,000 | ~4,000 | ~180 | ~560 | — | ~360 |
| Ch6 | 110–280 | 900–2,200 | ~9,000 | ~360 | ~1,100 | — | ~700 |
| Ch7 | 240–600 | 2k–5k | ~20,000 | ~700 | ~2,200 | — | ~1,400 |
| Ch8 | 500–1,300 | 5k–12k | ~45,000 | ~1,400 | ~4,400 | ~6k | ~2,800 |
| Ch9 | 1k–2.8k | 11k–26k | ~95,000 | ~2,800 | ~8,800 | ~12k | ~5,600 |
| Ch10 | 2k–6k | 25k–60k | **Hush ~150k** (3×~50k phases) | ~5,600 | ~17k | ~24k | ~11k |

- Early game is tiny and legible; the endgame deals **thousands per hit** vs
  tens-of-thousands HP — epic, but still dwarfed by net worth ($1K→$3B).
- Ratios INSIDE each ability ladder are preserved (α:β:γ:Ω:Σ ≈ 1:2.6:4.2:6.2:8.7),
  so the awakening leaps still feel great; only the per-band magnitude moves.

## How it's applied (deterministic, per category)
Each category gets a **per-band scale** derived from the table, applied to the
current values so intra-ladder shape is kept:
1. **Abilities** (`abilities.ts`): set each line's power from its band's α/Ω/Σ
   target ÷ formula. PP pools rescale with the hero PP curve so "one Σ vs three
   βs" stays a real choice.
2. **Enemies** (`enemies.ts`): HP/offense to the band's Trash/Basic-hit row; cash
   stays on the INCOME ladder (below), NOT the combat ladder.
3. **Bosses** (`bosses.ts` + the §A6/validate canon table): the Boss-HP column.
4. **Items** (`items.ts`): weapon offense + heal/PP values to the band rows;
   full-restore shows **"FULL"** not 9999.
5. **Hero growth** (`heroes.ts`): HP curve widened so survivability tracks the
   damage ramp (heroes ~30 HP Ch1 → ~tens of thousands Ch10).
   **⚠️ NOT LANDED — superseded.** The shipped hero HP curve tops out ~435–625
   at L52 (see `npm run balance`, hero growth table) and enemy offense was tuned
   to it. Do NOT derive heal/enemy-offense magnitudes from this row; target the
   shipped ~600-HP endgame heroes (the 2026-07 heal-axis retune in
   `abilities.ts` is the reference).
6. **Callers/quests** (`quests.ts`): finale caller power to the Ch10 band (the
   finale is endgame), not the current 400.

## The INCOME ladder (separate axis — money goes UP, ADR-120)
Tuned per band toward the Fortune Arc ($1K→$3B). Combat HP/dmg shrink early but
CASH does not collapse — a kid's first fights still pay, and late fights pay big.

| Band | Enemy cash (typical / rare) | Quest reward $ | Minigame title $ | Fortune target |
|---|---|---|---|---|
| Ch1 | 3–30 / 90+ | 50–200 | a few hundred | $1,000 |
| Ch2 | 25–120 / 600 | 150–500 | — | $4,000 |
| Ch3 | 60–300 / 800 | 300–1,000 | — | $15,000 |
| … | …(geometric)… | … | … | … |
| Ch10 | 50k–300k / millions | 1M+ | — | $3,000,000,000 |

## Verification (my non-browser "playtest" for combat math)
`npm run balance` prints per-character growth, ability ladders, boss HP vs
time-to-kill at each §A6 target level, and Fortune-Arc affordability. Each band
is applied then re-run; TTK must land in the fair 4–10-turn window before commit.
(The validator's GREAT-VERIFICATION sweep + `balance.test.ts` pin the curve.)

## Apply order
Land the **Ch.1–3 (shipped) numbers first** (concrete, balance-sim-verifiable),
then set Ch.4–10 as the forge/target curve the unlanded chapters tune to.
