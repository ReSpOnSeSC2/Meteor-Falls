# PROMPT — PIPPA: Ability Expansion ("The Page's Full Brief")

> **Hand this whole file to the build AI.** Self-contained. Build only Pippa's
> kit. Finish green: `npm test`, `npm run build`, `npm run validate`.
>
> **REWRITTEN for the S16 strategic-depth layer.** Jay's expansion already
> shipped the shared substrate Pippa's support kit slots into: the unified
> incoming-damage seam (`mitigateIncoming`), the live `shield`/`ward`/`reflect`/
> `steeled` statuses, the **temp-boost-via-status pattern** (the exact recipe her
> `rally`/`focus`/`morale`/`evasion` need), the card-pip system, and the boss
> control-cap philosophy. **Read §1.5 first** — Pippa is the party's *glue*, so
> her job is to wire into these seams and create the cross-character combos.

---

## 0. ROLE

Extend the ability layer of **Meteor Falls** (EarthBound-style TS RPG; Phaser 3 +
Vite + Zod; zero binary assets). Pippa Quill (engine id **`pippa`**) is the
**royal page of Minimus** — a tiny tactician with **NO Vibe and NO PP**, like
Milo: her power is *competence* (accuracy, morale, field medicine), not magic.
Goal: roughly **double her kit (6 → ~12)**. She joins **Ch.5 end** (after
WHISKERZILLA, appointed "Foreign Minister of Being Taken Seriously"), so her
unlocks span ~L1-on-join to ~L48.

Her fantasy: the **support/control specialist** who makes everyone else better —
marks targets so the big kids can't miss, rallies morale, stitches wounds, and
out-maneuvers things at thimble-scale. **Architecture note:** her current six
abilities already exist as DATA with fx, but several statuses (`marked`, `rally`,
`focus`, `evasion`, `morale`) are **fx-only and NOT yet mechanically wired** (see
the comment in `abilities.ts`). **This prompt's first job is to actually IMPLEMENT
those statuses** — and post-S16 there's now a clean, proven pattern to do it.

---

## 1. SHARED SYSTEM FACTS

- `src/data/abilities.ts` (`ABILITIES`/`AbilityDef`); `src/data/heroes.ts`
  (`HEROES.pippa.unlocks[]`); `src/battle/fxRegistry.ts` (validator both ways);
  `src/battle/fx.ts`; `src/scenes/BattleScene.ts`; `src/battle/formulas.ts`
  (pure rng-injected math); `src/schemas/index.ts`.
- **`AbilityDef`:** `{ id, name, kind, pp>=0, power>=0, heal?, target, element, status?, text, fx }`.
- **Pippa's rule: `kind:'physical'`, `pp:0` on everything** (no Vibe, no PP).
  Her heals/damage are small and **must not scale on Vibe** — flat or Luck-based.
  She is absurdly **lucky** (base Luck 9): build her accuracy/dodge math off
  `heroLuck()` so the "absurdly lucky" characterization is mechanically real.

### 1.5 WHAT'S ALREADY LIVE — the S16 layer your statuses plug into

> Shipped with Jay's expansion. **These are the seams that make wiring Pippa's
> dormant statuses straightforward.**

- **The temp-boost-via-status pattern (THE recipe for `rally`/`focus`/`morale`).**
  Resolve's `steeled` adds `STEELED_GUTS` at the `heroGutsS()` stat-read seam and
  ticks off in `statusPhase` — never baked into permanent `boosts`. **Copy this
  shape exactly:** `rally` → add +Speed/+Luck at the `heroSpeed`/`heroLuck` read
  seams while `rally>0`; `focus`/`evasion` → read at the accuracy/dodge roll.
  There are already `heroGutsS`/`heroVibeS` wrappers in `BattleScene`; add the
  matching `heroSpeedS`/`heroLuckS` reads the same way.
- **The ONE incoming-damage seam — `mitigateIncoming(dmg, element, WardState)`**
  (`{shield, ward, reflect, mirror, steeled}` → `{taken, reflected}`), called
  once in `enemyAct`. **`guarded` (Diplomatic Immunity) resolves HERE**, as a
  sibling of Jay's `reflect`: when a single-target hit lands on a `guarded` ally,
  redirect/negate it (decoy) before `mitigateIncoming`. Don't open a second
  damage path — extend the one that exists.
- **The "answer the telegraph" suite now exists.** Jay's `reflect` (bounce),
  Dorin's party `mirror`, and **Pippa's `guarded`** (redirect) together give the
  party three reads on a telegraphed single-target boss hit. Build `guarded` so
  it composes with that family, not in isolation.
- **Live statuses to REUSE, never re-add:** hero `shield/mirror/ward/reflect/
  steeled` (+ `sunburn/productive/crying/asleep/paralyzed/hushed`); enemy
  `puppet/asleep/crying/hushed/gilded/shield`. **`cure`** (status-clear) is live —
  Pocket Patch/Field Dressing/The Minutes reuse it.
- **Card pips:** GOOD statuses ride a tinted hex via `BustTick` (shield=cyan,
  ward=grass, reflect=gold, steeled=red…). **Add `rally`/`focus`/`guarded`/
  `evasion` pips** so the player can read who's buffed at a glance.
- **Boss control-cap philosophy:** Jay's `puppet` is gated by `mindImmune(def)`.
  **`rattled`'s skip-chance and any Pippa control honors the same cap** —
  devastating on mooks, capped on bosses.
- **The amplify family.** Milo's Scope and Mia's Hush Hex (`exposed`) are
  *amplify* effects (×1.25 / ×1.3 on damage the target takes). **Pippa's `marked`
  is the third member** — implement it so the amplify components stack
  multiplicatively (Scope+Mark+Exposed = the party's hardest focus-fire spike).
- **Awakening manifest:** Pippa has **no awakenings** (no Vibe), so you touch
  none of it — all level unlocks (she earns her brief through service).
- **STATUS CONTRACT** (the bulk of this work): struct field → apply in
  `castAbility` → make it *do something* at the right seam → tick down + wear-off
  line in `statusPhase` → card pip in `BustTick` → schema `z.enum` if validated.

---

## 2. CURRENT KIT (baseline — keep, but WIRE THE STATUSES)

| id | name | pp | power | target | status | fx | source | wired? |
|---|---|---|---|---|---|---|---|---|
| pinpoint_mark | Pinpoint Mark | 0 | 0 | ally | **marked** | pinpoint_mark | L1 | ❌ implement |
| royal_rally | Royal Rally | 0 | 0 | allies | **rally** | royal_rally | L1 | ❌ implement |
| pocket_patch | Pocket Patch | 0 | 35 heal | ally | cure | pocket_patch | L1 | cure exists |
| big_little_focus | Big-Little Focus | 0 | 0 | allies | **focus** | big_little_focus | L1 | ❌ implement |
| scale_step | Scale Step | 0 | 0 | self | **evasion** | scale_step | L30 | ❌ implement |
| bellwether | Bellwether | 0 | 0 | allies | **morale** | bellwether | L44 | ❌ implement |

**Wire these five statuses** (the support spine of the party):

| status | applies to | effect | duration | notes (post-S16 seams) |
|---|---|---|---|---|
| `marked` | ally→enemy | the marked enemy can't be missed by the party AND takes ~×1.25 dmg | 3 turns | **shared with Milo's Scope.** Implement ONCE with sub-fields `marked_hit` (Pippa, guaranteed-hit) + `marked_dmg` (amplify). Amplify stacks ×`exposed`. |
| `rally` | party | +Speed and +Luck | 3 turns | temp boosts via the `steeled` pattern (`heroSpeedS`/`heroLuckS`) |
| `focus` | party | next physical hit can't miss (the "big-little focus" combo with Milo) | 2 turns | read at the accuracy roll; consumed on the hit |
| `evasion` | hero (self) | high dodge + decoy (first incoming hit auto-misses) | 3 turns | dodge check + decoy resolves at the incoming seam beside `guarded` |
| `morale` | party | the next PRAY/heal "carries" — boosts Mia's PRAY tier-up odds / amplifies the next party heal | until consumed | **cross to Mia:** read where `rollPray`/heal applies |

---

## 3. TARGET KIT — BUILD THESE (Pippa → ~12)

Six **new** abilities. All `kind:'physical'`, `pp:0`. Reuse fx families.

| id | name | power | target | status | fx | source | role / strategy |
|---|---|---|---|---|---|---|---|---|
| **volley_mark** | Volley Mark | 0 | enemies | **marked** | scan (reuse, GOLD) | **L20** | Mark the WHOLE enemy row — sets up a party AoE turn (Mia's Fire β, Milo's Multi-Rocket). The team-wide focus-fire enabler. |
| **standing_ovation** | Standing Ovation | 0 | allies | **rally** (stronger/longer) | sparkle_rain (RED) | **L34** | Royal Rally++: bigger Speed/Luck swing — her "go" button before a boss burst. |
| **field_dressing** | Field Dressing | 90 heal | allies | cure | sparkle_rain (GRASS) | **L26** | Party heal + status clear (0-PP). With Milo's Med-Spray, the no-magic kids cover upkeep so the psychics stay on offense. |
| **diplomatic_immunity** | Diplomatic Immunity | 0 | ally | **guarded** (NEW) | barrier (CYAN) | **L22** | She steps in front: redirect/negate the next single-target hit aimed at a chosen ally. Protect the squishy caster on a telegraphed turn — the third "answer the telegraph" tool beside Jay's `reflect` and Dorin's `mirror`. |
| **stern_decree** | Stern Decree | 0 | enemies | **rattled** (NEW) | scan (PURPLE) | **L31** | She speaks like a furious diplomat: enemy Offense down (their hits ×0.8) + small **boss-capped** skip chance. Control without magic. |
| **the_minutes** | The Minutes | 0 | allies | **cure** + **focus** | big_little_focus (reuse) | **L40** | "Takes minutes during disasters": cleanse a party debuff AND set focus — turns a bad round around. Her signature comeback tool. |

> Optional 7th (lucky-13): **`last_stamp`** (physical, 0 pp, `target:'ally'`,
> emergency single-revive at low HP — "the royal seal, pressed one last time")
> at L46, fx `sparkle_rain` GOLD, sfx `fx_revive`. Keep if you want the breadth.

**Count:** 6 existing + 6 new = **12** (13 with `last_stamp`). ✅

---

## 4. NEW STATUSES (beyond the five wired in §2)

| status | applies to | effect | duration | notes |
|---|---|---|---|---|
| `guarded` | hero | next single-target hit on this ally is redirected to a decoy / negated | until consumed | **resolve in `mitigateIncoming`'s call site in `enemyAct`** — sibling of Jay's `reflect`; consume on the first single-target hit |
| `rattled` | enemy | Offense down → its hits ×0.8; small skip chance | 3 turns | the no-magic debuff (inverse of Mia's `exposed`); apply the ×0.8 to enemy `dmg` BEFORE `mitigateIncoming`; **skip chance boss-capped** |

Follow the STATUS CONTRACT for all of these. **Coordinate `marked` (Milo) and
`cure` (live) — implement/reuse shared statuses once.**

---

## 5. FX KEYS (all reuse existing families — zero new art)

```ts
volley_mark:          S({ kind:'ability', family:'scan',         ramp:RAMP.GOLD,   sfx:'fx_spy' }),
standing_ovation:     S({ kind:'ability', family:'sparkle_rain', ramp:RAMP.RED,    sfx:'fx_lifeup' }),
field_dressing:       S({ kind:'ability', family:'sparkle_rain', ramp:RAMP.GRASS,  sfx:'fx_cure' }),
diplomatic_immunity:  S({ kind:'ability', family:'barrier',      ramp:RAMP.CYAN,   sfx:'fx_shield' }),
stern_decree:         S({ kind:'ability', family:'scan',         ramp:RAMP.PURPLE, sfx:'fx_spy' }),
the_minutes:          S({ kind:'ability', family:'sparkle_rain', ramp:RAMP.PURPLE, sfx:'fx_lifeup' }),
// last_stamp (optional): family 'sparkle_rain', ramp RAMP.GOLD, sfx 'fx_revive'
```
Her current six fx keys already exist — leave them. No `STAGE_ANIM` changes.

---

## 6. STRATEGIC-DEPTH CHECK (a support hero that's actually a choice)

- **Force multiplier, not a passenger:** `marked`/`volley_mark` make the big
  hitters reliable AND amplified, and the amplify **stacks with Milo's Scope and
  Mia's `exposed`** — Pippa's turn enables the party's biggest spike.
- **No-magic upkeep:** with Milo, Pippa lets the team run long dungeons without
  draining Jay/Mia's PP — a real attrition-economy lever in a system where PP is
  now genuinely scarce late.
- **Protect-the-caster as a read:** `guarded`/Diplomatic Immunity joins Jay's
  `reflect` and Dorin's `mirror` as the party's three answers to a telegraphed
  single-target boss hit — a *read*, not a reflex.
- **Cross-character synergy is her identity:** Bellwether→Mia's PRAY,
  Focus→Milo's Big-Little Focus, Marks→everyone's burst, Rally→the whole party's
  crit/tempo (and her +Luck/+Guts/SMAAASH play touches the same crit math Mia's
  `lucky` and Jay's `steeled` do). Build the combos so the player *discovers* them.
- **Luck flavor mechanically real:** route accuracy/dodge through `heroLuck()` so
  her characterization shows up in the numbers.

---

## 7. ACCEPTANCE CRITERIA

- [ ] The five fx-only statuses (`marked`, `rally`, `focus`, `evasion`, `morale`) are mechanically wired (apply → effect at the right live seam → tick-down → wear-off line → card pip).
- [ ] New abilities in `ABILITIES` (`kind:'physical'`, `pp:0`); none scale on Vibe; fx resolve in `FX_REGISTRY` (validator both ways).
- [ ] New statuses `guarded`, `rattled` wired; `guarded` resolves at the `mitigateIncoming` call site; `rattled` skip-chance boss-capped; `marked` shared cleanly with Milo (`marked_hit`/`marked_dmg`, no collision); `cure` reused.
- [ ] `rally`/`focus`/`evasion` use the `steeled` temp-boost pattern (read-site boost, ticked in `statusPhase` — never permanent `boosts`).
- [ ] `marked` amplify stacks multiplicatively with `exposed`; `morale` boosts the next PRAY/heal.
- [ ] `HEROES.pippa.unlocks` updated; **no awakenings**.
- [ ] `availableAbilities('pippa', 99, ()=>false)` returns ~12 ids (all level unlocks).
- [ ] Tests: `marked` makes a party hit unmissable + amplified (and stacks with `exposed`); `rally` boosts Speed/Luck; `guarded` redirects a single hit through the live damage seam; `morale` boosts the next PRAY/heal; `rattled` lowers enemy damage by ×0.8.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Voice: precise, diplomatic, takes herself very seriously and is *furious* when
called adorable. Battle lines read like minutes of a meeting ("Noted. Marked.
Proceed." / "The motion to flee is DENIED.").**
