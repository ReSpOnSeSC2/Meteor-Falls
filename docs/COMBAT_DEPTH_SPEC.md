# COMBAT DEPTH SPEC — Elemental Identity + the Break System (ADR-134)

The living reference for the two systems that make **the right action beat the biggest
action**. Companion to `docs/BALANCE_REVAMP.md` (the band curve) and
`docs/BALANCE_CH1-3_SPEC.md` / `docs/BALANCE_CH4-10_SPEC.md` (the shipped numbers).
Source of truth for the CODE is always the code (`src/battle/formulas.ts`,
`src/data/enemies.ts`, `src/scenes/BattleScene.ts`, `src/battle/phases.ts`); this doc
explains the WHY and pins the constants and the verification method.

**The diagnosis.** Combat collapsed to "cast the highest-damage spell every turn." Two
measurable causes: (1) the element multiplier was a small swing (×1.5 / ×0.5), **0 of 144
enemies used the `resists` seam**, and Mia's same-tier nukes were unequal (Fire Σ 4,311 vs
the others' 8,000 — Fire Σ strictly dead); (2) there was no reason to set up — the
flat-damage crew (Milo/Pippa) and the control/ward kit had no payoff loop.

**The invariants (never violated).** Money > combat (no boss HP / `fortune.ts` / `canon{}`
pin moved — `npm run validate`'s monetary-vision check stays green). Determinism (ADR-008):
every new stochastic helper takes an injected `Rng`; the Break system is entirely
deterministic (fixed meter fractions, a threshold, a flat skip) so it adds NO rng to the
live scene. The chapter-to-chapter ramp is canon — we compressed the WITHIN-a-tier spread,
not the ramp.

---

## 1. TIER 1 — ELEMENTAL IDENTITY

### 1a. The multipliers (`src/battle/formulas.ts`)

| constant | old | ADR-134 | meaning |
|---|---|---|---|
| `WEAK_MUL` | 1.5 | **1.8** | a weakness hit — the big, decisive swing |
| `RESIST_MUL` | 0.5 | **0.4** | the wrong element — a real reason to rotate off |
| `HOLY_PIERCE_MUL` | 0.75 | 0.75 | a resisted Holy hit still pierces (Starsong's identity) |
| `ABSORB_HEAL_FRAC` | — | **0.5** | an absorbed hit deals 0 and HEALS ~½ the would-be damage |

Per-enemy `weakMul` override survives (the Mainframe's ×2 cooling fan). The ×1.8→×0.4
spread is a **×4.5 swing** — the element the foe's colour dictates is the pick, not the
biggest raw number. `applyElement` returns exactly 0 for an absorbed hit; `absorbHeal`
computes the heal. All pure + rng-free (pinned in `formulas.test.ts`).

### 1b. Same-tier parity (Mia's γ/Ω/Σ) — re-derived through the band formula

Within a hero, same-tier elemental nukes share ONE base power so the element multiplier is
the only differentiator. Powers derive through the **unchanged** `power = bandTarget ÷
(1 + Vibe/60)` method; the four elements land at one value per tier. **Fire sits ~13%
under** (its DoT discount — it makes the difference up in `burn`). α/β are untouched (tiny
leap-gated openers). This amends `BALANCE_CH4-10_SPEC` §1b.

| tier | Fire (DoT-discounted) | Freeze | Volt | Starsong (Holy) |
|---|---|---|---|---|
| γ | **1542** | 1772 | 1772 | 1772 |
| Ω | **5251** | 6036 | 6036 | 6036 |
| Σ | **6960** | 8000 | 8000 | 8000 |

The 24k-player-facing Σ still exists; it only lands FULL against the right colour and is
halved/absorbed against the wrong one. The finale is driven by max raw power with an empty
weakness set, so keeping the Σ trio at 8,000 leaves finale TTK **exactly unchanged**.

### 1c. Enemy colour — the assignment rule (`src/data/enemies.ts`)

Every combat enemy carries a **weakness** (1–2) and, for 141 of 144, a **`resists`** (1–2,
`{fire,freeze,volt,holy}`, always ≠ its weakness). Assigned by thematic affinity:

- **fire ↔ freeze are opposites.** Ice/frost/cold → weak fire, resist freeze. Fire/lava/
  ember/sun/desert → weak freeze, resist fire.
- **volt** bites metal / machine / wet / armour; those resist freeze or fire.
- **holy** (Starsong) is the anti-dark: undead / masks / cursed / hush / shadow → weak holy.
- plants/paper/wood/wax → weak fire; bugs → weak fire (+ the `insect` gimmick).
- `insect` / `salt` are **weakness-only** gimmicks (no hero casts them) — they never count
  toward the ≤60% castable-dominance audit.

**Absorbers (7 signature foes)** take 0 and heal from an element (differ from their
weakness): `boiler_golem`, `sunbaked_idol`, `spice_djinn`, `paper_lantern_wisp` (fire),
`frost_wisp` (freeze), `cinder_imp` (fire), `static_wraith` (volt). The two Ch.10 elemental
golems keep their form-level `healedBy` (bosses.ts) — no duplication; `the_hush` stays fully
neutral (finale safety — it must equal `bossCheck(10)`).

### 1d. The distribution rule (gated in `tools/content-validate.ts`)

Per chapter, **no castable element is the weakness of >60% of the NON-boss roster** — so
Mia must rotate her five chapter-to-chapter. Current spread (max is Ch.4 fire at 50%):

```
Ch.1 fire40 freeze20 volt30 holy10   Ch.6 fire10 freeze35 volt20 holy15
Ch.2 fire27 freeze27 volt27 holy09   Ch.7 fire25 freeze50 volt25 holy00
Ch.3 fire35 freeze40 volt40 holy10   Ch.8 fire50 freeze25 volt50 holy00
Ch.4 fire50 freeze15 volt15 holy10   Ch.9 fire40 freeze00 volt20 holy40
Ch.5 fire29 freeze14 volt33 holy10   Ch.10 fire33 freeze33 volt00 holy33
```

The validator also enforces the **differ rule** (resist/absorb never overlap the weakness)
and the **roster both-directions** check (every enemy is in exactly one chapter roster).

### 1e. Scout reveal (`BattleScene.revealColor`)

Milo's **Spy** and **Scope** print the foe's weakness / resist / absorb into the message
panel and set `scouted` — a persistent gold pip glows on the composure meter for the rest of
the fight. Scouting is a real first-turn read.

---

## 2. TIER 2 — THE BREAK SYSTEM

Deterministic Composure/stagger loop. State on `EnemyUnit`: `composure`, `composureMax`
(default `40 + level*4` if no explicit `EnemyDef.composure`; 0 = unbreakable, no meter),
`broken` (turns).

### 2a. The chip (`composureChip`, pure)

Chip = a FRACTION of `composureMax` (so the break-COUNT is fraction-driven, not
meter-size-driven), scaled by the boss's `breakResist`:

| source | fraction | note |
|---|---|---|
| `COMPOSURE_CHIP_WEAK` | **0.34** | a weakness hit — the big stagger |
| `COMPOSURE_CHIP_CONTROL` | **0.25** | a LANDED control status (freeze/paralyze/sleep/hush) |
| `COMPOSURE_CHIP_OFF` | **0.08** | a neutral / off-element / resisted hit |
| `COMPOSURE_FOCUS_BONUS` | **+0.5** | a MARKED or EXPOSED foe → ×1.5 chip (Milo/Pippa) |

Sources ADD (a weak hit that also lands control chips both). Then `×(1 − breakResist)`. The
**single biggest** chip (weak + control + focused) is 0.885 of the meter — so a break is
**NEVER one action**. `chip = round(max × frac)`, floored at 0.

### 2b. The break payoff

At `composure ≤ 0` the foe **BREAKS**: `broken = breakTurns(boss)` (`BREAK_TURNS_BOSS = 1`,
`BREAK_TURNS_TRASH = 2`). While broken, all damage is **×`BREAK_MUL` = 2.0** (`applyBreak`,
after element + focus at the one damage seam). On the foe's turn it **skips its beat**; on
expiry the meter **refills to `nextComposureMax` (×`BREAK_ESCALATE` = 1.2)** — escalating
breaks, so a boss can never be perma-stunlocked. Bosses default `breakResist =
DEFAULT_BOSS_BREAK_RESIST = 0.4` (a break takes ~5 plain weakness hits, ~2 with mark+control).

### 2c. Integration seams (`src/scenes/BattleScene.ts`)

- **`damageEnemy`** (the ONE outgoing seam): `applyBreak(×2)` after `applyFocus`; then
  `chipComposure` in the survived branch (every hero-attack path passes `chip=true` — bash,
  SMAAASH, vibe, gadget, pray, item; DoT/reflect do not).
- **`applyOnHitStatus` / the control cases**: a landed freeze/paralyze/sleep/hush calls
  `chipControl` (the +control chip, focus-aware) — Milo/Pippa's break-enabler lane.
- **`enemyPhase`**: the broken-skip sits AFTER `onBossTurnStart`, so a broken boss STILL
  runs its scripted phases (the finale is audited — `the_hush` runs its movements).
- **`drawComposureBars`** (in `update`, one shared Graphics): a slim cyan poise bar that
  depletes; hot-gold when BROKEN; a gold weakness pip when scouted. Reuses existing draw
  primitives — no new art.

---

## 3. THE TELEGRAPH / WIND-UP PATTERN (the reusable boss hook)

A `windup` **PhaseAction** (`{ line, amount?, status?, turns? }`) turns any boss beat into a
two-turn telegraph:

1. **Turn N — announce.** The action arms `PhaseRunner.pendingWindup` and prints `line` via
   `printWait` (HOLD-to-read).
2. **Turn N+1 — resolve.** `enemyPhase` reads `phase.dueWindup()`: if the party **BROKE** the
   boss (or froze/slept it), the charge **COLLAPSES** (`windupCancel`); otherwise it
   **LANDS** (`windupLand` — `amount` party damage routed through `mitigateIncoming`, so
   Jay's WARD/SHIELD still soften it, plus an optional `status`). Either way it IS the boss's
   action that turn.

So a boss's signature blow **demands a response ON CUE** — ward the class, control it, or
BREAK it to cancel. **Reference:** Count Hoaxula's `command_windup` ("COMMAND THE NIGHT",
`amount: 800` + a blind, every 3rd turn) — fire-weak + full party, so the BREAK-cancel is a
real read. Any other boss adopts the pattern as a **data beat** (one `windup` action), no
bespoke code.

---

## 4. MILO & PIPPA IN THE BREAK ECONOMY

The flat-tool crew is no longer dead weight late:

- **Break enablers.** Milo's Cryo/Static (control chip) + Scope (mark) and Pippa's
  Pinpoint/Volley (mark) apply the **+50% focus chip** — they cut a ~5-action boss break to
  **~2** (`breakEconomy` ledger, printed by `npm run balance`).
- **Milo scales.** His top gadget `siege_rocket` carries a **`pctMaxHp = 0.02`** rider (armour-
  piercing) so it climbs **360 → 3,360** against the 150k Hush, plus a **`deepensBreak`** flag
  (a hit inside the ×2 window extends it). The verify model's 0-PP-gadget undercount is fixed
  (free tech sustains every round), so his scaling shows up in the sim and in play.

---

## 5. VERIFICATION METHOD

`npm run balance` (`tools/balance-sim.ts` → `src/battle/verify.ts`) prints, and
`verify.test.ts` / `formulas.test.ts` / `phases.test.ts` PIN:

- **Element multipliers** (1.8 / 0.4 / 0.75), **absorb → 0**, and **holy pierce** — exact.
- **Parity**: Freeze=Volt=Starsong per γ/Ω/Σ tier; Fire ∈ [0.83, 0.90] of parity.
- **Read-vs-spam** (`readVsSpam`): SPAM = biggest raw nuke ignoring colour (eats resists,
  misses weaknesses); READ = rotate onto the weakness (×1.8) + cash the break loop
  (`breakLoopDpr`). `readTTK ≤ spamTTK` for every boss; strictly faster across the suite.
- **Break math**: chip fractions, "never breaks in 1," "breaks in 2–3 optimal actions,"
  the ×2 window, the escalating refill.
- **Break economy**: Milo's siege scales monotonically; mark+control cuts the setup.
- **Distribution / differ / roster** audits in `tools/content-validate.ts` (a build gate).
- The unchanged windows: main-boss **TTK ∈ [2,25]**, finale **∈ [4,10]**, partyDPR climbs,
  ladders monotonic, `warm == bossCheck(10)`, and **every eased HP < the canon Hush HP <
  the Ch.10 Fortune target** (money > combat).

To extend: add a colour to `enemies.ts` (the audits keep it honest), tune a constant in
`formulas.ts` (the tests pin it), or give a boss a `windup` beat (the hook is data). Run
`npm run balance` after any numeric change and keep TTK in window.
