# ☄️ THE GREAT VERIFICATION — S18 Movement 24 (ADR-094)

The capstone that makes the whole machine HONEST: it runs the numbers, reads them by eye, and proves
**METEOR FALLS** is *consistent, completable, and balanced* — and clears the four standing debts so S18
closes with no IOUs. This file is the human-readable verdict; `npm run balance` is the live worktable and
`src/battle/verify.test.ts` + `tools/content-validate.ts` are the gates that keep it true.

> **How to re-run:** `npm run balance` (the report, read by eye) · `npm run validate` (the both-directions
> gates + the §A9/§A6 sweep) · `npx vitest run src/battle/verify.test.ts` (the combat pins). All headless —
> the WebGL canvas hangs `preview_screenshot`, so the proof is the sim + the tests, never a screenshot
> (ADR-059/060).

---

## VERDICT — ✅ the game is consistent, completable, and balanced

| Question THE GREAT VERIFICATION asks | Answer |
|---|---|
| Do the per-character **growth curves** climb sanely (HP/PP/Off/Def/Spd/Guts/Vibe per level)? | ✅ all five heroes monotone L1→52; the three Vibe heroes (Jay/Mia/Dorin) grow Vibe, Milo & Pippa never do (§A3 — no old light) and carry no PP bar |
| Do the **ability ladders** leap per tier the way ADR-035 promises (α→β ≈ 2.6×)? | ✅ Vibe **Surge** and **Fire** α→β are **exactly ×2.60**; Freeze/Volt ×2.19/×2.21; every ladder strictly climbs in power AND PP |
| Does **Boss N fall in a fair number of turns** for a party at the §A6 level? | ✅ every boss falls in **4–10 turns** at a CONSERVATIVE read (base stats, no weapons, no items, no Pray) — real geared fights are faster |
| Is the **Fortune Arc** ($1K→$3B) + the §A4 sinks (picnic, tonic, hospital, fuel, property, rocket) coherent? | ✅ monotone, ≤10×/chapter, every sink priced to the arc (the revival line, the 22 tonics, the picnic/Spice-Box economy below) |
| Is the **landed Ch.1–2 slice completable** start-to-finish (B4)? | ✅ both chapters `shipped` with live maps + quests + a boss that's beatable at its §A6 level; the gate chain (ch1→docks→ch2) is coherent — proven headlessly, not by hand |

---

## HALF A — the numbers, read by eye

### Per-character growth curves (the §A9 spine)
Monotone and well-shaped. Sample endpoints (full table in `npm run balance`):

| Hero | L1 HP/PP | L8 | L26 | L52 HP/PP · Off/Vibe |
|---|---|---|---|---|
| **Jay** (rex) | 30/10 | 79/28 | 243/89 | 570/210 · Off 113 / Vibe 98 |
| **Mia** (faye) | 26/14 | 69/38 | 210/119 | 494/281 · Off 86 / Vibe 120 (top caster) |
| **Milo** (milo) | 28/0 | 73/0 | 222/0 | 516/0 · Off 102 / **Vibe 0** (out-engineers magic) |
| **Pippa** (pippa) | 24/0 | 62/0 | 187/0 | 435/0 · Off 74 / **Vibe 0** (luckiest, frailest) |
| **Dorin** (dorin) | 34/12 | 87/33 | 265/104 | 625/246 · Off 119 / Vibe 109 (the late bruiser) |

### Vibe ability ladders — PP cost vs power tier (ADR-035: the awakening LEAP)
The signature lines leap hardest at α→β, then taper — the ADR-035 "every ability is an event" shape:

| Ladder | α | β | γ | Ω | Σ | α→β leap |
|---|---|---|---|---|---|---|
| **Vibe Surge** | 55 (PP10) | 143 (PP22) | 231 (PP38) | 341 (PP64) | 480 (PP96) | **×2.60** |
| **Vibe Fire** | 48 (PP6) | 125 (PP14) | 202 (PP28) | 298 (PP49) | 430 (PP78) | **×2.60** |
| **Vibe Freeze** | 52 | 114 | 187 | 286 | 405 | ×2.19 |
| **Vibe Volt** | 58 | 128 | 209 | 300 | 420 | ×2.21 |

### Boss HP vs TIME-TO-KILL @ §A6 target level
Conservative floor — **base stats, no weapons, no items, no Pray/support** — so the real geared fight is at
least this fast. The party DPR climbs to match the HP ladder; nobody is a 1-turn faceroll or a 30-turn slog.

| Ch | Boss | HP | Lv | Party | DPR | **TTK** | exploitable weakness |
|---|---|---|---|---|---|---|---|
| 1 | The Titanic Tick | 450 | 8 | 1 (Jay solo) | 47 | **10** | fire/salt/insect (via items) |
| 2 | Idol of the Gilded Grin | 980 | 13 | 2 | 191 | **6** | freeze (Mia's awakening) |
| 3 | Headmaster Mainframe | 1600 | 18 | 3 | 336 | **5** | — |
| 4 | The Whisperwig | 1900 | 22 | 3 | 444 | **5** | — |
| 5 | Whiskerzilla | 2150 | 26 | 3 | 494 | **5** | — |
| 6 | The Laughing Sphinx | 2300 | 30 | 4 | 685 | **4** | — |
| 7 | Cobra Raja | 3200 | 35 | 4 | 859 | **4** | — |
| 8 | The Paper Dragon | 4100 | 40 | 4 | 957 | **5** | — |
| 9 | Count Hoaxula | 5300 | 46 | 4 | 1165 | **5** | — |
| 10 | The Hush (the Static shell) | 6000 | 52 | 5 | 1904 | **4** | — (the finale is scripted survival + PRAY, not a damage race) |

The Tick reads slowest (10) because it is fought **solo** by a level-8 Jay whose Surge α is elementless — a
meaty, fair tutorial boss (EB's Titanic Ant is the same shape). The Hush's "4" is a floor on its first
movement's shell only; movements 2–3 are scripted (§A6) and don't race damage.

### The §A4 economy
- **Revival line (§A4.12):** Second Wind 30 → Guardian-Angel Feather 200 → **Defibrillator 280 (REUSABLE)** →
  Sacred Ash 350 → Joss Paper 450 → Vigil Candle 650 → Hallelujah Bell (full) — a smooth, priced climb;
  Glint's Spark stays the rare full-revive.
- **Tonics (§A4.12):** 22 permanent +stat consumables, $280 (Sudden Guts Pill) → $2,000 (Meteor Shard, the
  dearest item in the game). Rare and dear by design.
- **Picnic (§A4.5):** Basic basket $44; Family/Feast crafted ($0). SUNNY SIDE = ×1.1 all stats for 5 battles.
- **Hospital (§A4.7):** revive scales by the fallen hero's level ($42 @ L8 → $218 @ L52); cure-all $18; the
  free chapel heals 50 HP party-wide.
- **The Spice Box (§A10 #15):** cooked food heals **×1.5** while owned (a 60-HP dish → 90).

### EXP grind (§A9: EXP(L)=4·L³/3) — "faithfully grindy"
The §A6 target levels cost 683 EXP by Ch.1, 23,435 by Ch.5, 85,334 by Ch.8 — the curve is cubic, so the
back-half climbs hard, exactly the "grindy difficulty, some wipes expected" §A9 mandate.

---

## HALF B — the four deferred debts, CLEARED

S18 closes with no IOUs. Each debt landed FULLY: the binding, a both-directions gate, a unit test, a Bible
amendment where earned. **No save migration** — every debt is static catalog data or derived-at-runtime, so
none adds persistent save state (the Defibrillator rides the existing inventory id list; resists/Spice-Box/
drops are derived).

| # | Debt | How it landed |
|---|---|---|
| **1** | **heroResist DAMAGE binding** | `resistIncoming()` (formulas.ts) binds the §A8 pendant read at BattleScene's incoming-damage seam — a worn fire/freeze/volt/holy pendant halves a matching elemental hit, gear-first, parallel to Jay's ward. The **Coily Cicada's "August glare"** is the first LANDED elemental enemy move. Gate: `resist` (every elemental move is resistable + gear-covered). Test: the Jade Salamander Charm halves a fire hit, leaves volt/physical alone. |
| **2** | **THE REUSABLE-CURE PATH + the Defibrillator** | `consumesOnUse()` (items.ts) skips the consume step for `reusable` items in BOTH the battle and menu cure/revive paths. **Milo's Defibrillator** (a §A4.12 Repaired-Gizmo reusable revive, heal 280) joins the catalog with a forged icon. Gate: `reusable` (rides cures/battle only; the Defibrillator cures 'down' + heals). Test: a reusable item survives use, a normal one is spent. |
| **3** | **THE SPICE BOX food-multiplier** | `spiceFoodHeal()` (items.ts) ×1.5s the §A8 food heal in BOTH the battle and menu food paths, keyed off owning the Spice Box key item (`GS.hasKeyItem`). Test: 60 → 90 with the box, 60 plain without. |
| **4** | **EnemyDef.drops** (owed to THIS pass) | `EnemyDropSchema` + `EnemyDef.drops?` (schemas) + `rollDrops()` (formulas.ts) wired into the battle victory rewards (a defeated enemy rolls its drops into the bag, EB-style full-hands handling). **6 tasteful Ch.1–2 drops** seeded (§A7 identity: the sunburn cicada drops the Aloe Leaf, the food-thief pigeons a Corn Dog, the gold beetle a Doubloon…). Gate: `drops` (real item, sane chance, economy-neutral). Test: the roll is independent, deterministic, and seeded drops are real + cheap. |

---

## The gates — all green, headless

| Gate | Result |
|---|---|
| `npm run validate` | ✅ green — **468 items · 6 §A7 drops** · the new `drops`/`reusable`/`resist`/`verify` sweeps pass; the verdict is truthful |
| `npx tsc --noEmit` | ✅ clean, no `any` |
| `npx vitest run` | ✅ **1043 green** (+30 over M23's 1013: verify.test.ts + the four debts' pins) |
| `npx vite build` | ✅ clean |
| `npm run balance` | ✅ the report above, read BY EYE |

*S18 (M22 GLYPH FORGE → M23 FLAIR WEAVE → M24 GREAT VERIFICATION) is COMPLETE.* ☄️
