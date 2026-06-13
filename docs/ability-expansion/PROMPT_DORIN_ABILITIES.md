# PROMPT — DORIN: Ability Expansion ("The Monk's Full Path")

> **Hand this whole file to the build AI.** Self-contained. Build only Dorin's
> kit. Finish green: `npm test`, `npm run build`, `npm run validate`.

---

## 0. ROLE

Extend the ability layer of **Meteor Falls** (EarthBound-style TS RPG; Phaser 3 +
Vite + Zod; zero binary assets). Dorin (Poo analog, engine id **`dorin`**) is the
**monastery martial artist** of Stone Brow — fast, disciplined, a hybrid of fists
and Vibe. Goal: roughly **double his kit (7 → ~14)**. He joins **late (Ch.9,
after the Trial of the Mute Mountain)**, so his unlocks cluster high (L1 on join
through ~L52), and he arrives nearly complete — a master, not a student.

His fantasy: **Vibe Comet** (the Starstorm-analog nuke that ignores defense),
**Mirror** (reflect), **Brainjam** (silence/disable), reliable **Healing**
(including revive), plus **martial stances** that make his *own turn* a
defensive/offensive choice. His niche vs. Jay/Mia: cheap, fast, defense-piercing
multi-hits and the party's emergency-revive backbone.

---

## 1. SHARED SYSTEM FACTS

- `src/data/abilities.ts` (`ABILITIES`/`AbilityDef`); `src/data/heroes.ts`
  (`HEROES.dorin.unlocks[]`); `src/battle/fxRegistry.ts` (`FX_REGISTRY` + families
  + `STAGE_ANIM`, validator both directions); `src/battle/fx.ts` (family
  builders); `src/scenes/BattleScene.ts` (resolution/status); `src/schemas/index.ts`.
- **`AbilityDef`:** `{ id, name, kind, pp>=0, power>=0, heal?, target, element, status?, text, fx }`. Dorin uses `kind:'vibe'`.
- **Formulas:** `vibeDamage = round(power*(1+Vibe/60)*0.9..1.1)`;
  `vibeHeal = round(power*(1+Vibe/80)*0.95..1.05)`. Dorin's Vibe is solid (base
  7, +2.0/lvl) and his Speed is the **highest in the party** (base 8) — lean into
  *acting first* and *cheap* spells over raw ceiling.
- **Comet = `element:'none'`** (defense-piercing nuke, like Starstorm) — keep it
  non-elemental so it's the reliable answer alongside Jay's Surge.
- **Tier ladder** α/β/γ/Ω ≈ 1:2.2:3.6:5.5.
- **STATUS CONTRACT:** wire any new status in `BattleScene.ts` (struct → apply →
  effect → tick-down + wear-off → schema enum). Reuse `mirror`, `hushed`, `cure`,
  `revive`.
- **Story/grind split:** keep **most as level unlocks**; reserve **one awakening**
  for the iconic capstone (Comet Omega already exists as a plain unlock — convert
  the *new* top, or add a single Trial-of-the-Mute-Mountain awakening). Dorin
  currently has **no awakenings**; adding exactly one fits his "earns mastery
  through a trial" arc.

---

## 2. CURRENT KIT (baseline — extend)

| id | name | pp | power | target | element | status | fx | source |
|---|---|---|---|---|---|---|---|---|
| vibe_comet_a | Vibe Comet Alpha | 20 | 130 | enemies | none | — | comet_a | L1 |
| vibe_comet_o | Vibe Comet Omega | 60 | 320 | enemies | none | — | comet_o | L52 |
| mirror | Mirror | 4 | 0 | self | none | mirror | mirror_snap | L1 |
| healing_a | Healing Alpha | 5 | 0 | ally | none | cure | healing_cure | L1 |
| healing_g | Healing Gamma | 20 | 0 | ally | none | revive | healing_revive | L44 |
| brainjam_a | Brainjam Alpha | 12 | 0 | enemy | none | hushed | brainjam | L40 |
| brainjam_o | Brainjam Omega | 30 | 0 | enemies | none | hushed | brainjam | L50 |

Note the gaps: Comet skips β/γ, Healing skips β, Mirror has no party version,
Brainjam skips γ. We fill them — a complete path.

---

## 3. TARGET KIT — BUILD THESE (Dorin → ~14)

Seven **new** abilities, mostly filling ladders + two martial stances.

### Comet — complete the ladder (defense-piercing nuke)

| id | name | pp | power | target | element | status | fx | source |
|---|---|---|---|---|---|---|---|---|
| vibe_comet_a | Vibe Comet Alpha | 20 | 130 | enemies | none | — | comet_a | L1 (existing) |
| **vibe_comet_b** | **Vibe Comet Beta** | **30** | **190** | enemies | none | — | **comet_b (NEW)** | **L1 (NEW, joins ready)** |
| **vibe_comet_g** | **Vibe Comet Gamma** | **44** | **250** | enemies | none | — | **comet_g (NEW)** | **L48 (NEW)** |
| vibe_comet_o | Vibe Comet Omega | 60 | 320 | enemies | none | — | comet_o | **awakening `trial_of_the_mute_mountain` (NEW)** ← move off L52 |

> Convert Comet Omega from a level row to the single awakening (the Trial that
> lets him join is the perfect "mastery earned" beat). Remember the one-path
> rule: remove its `unlocks` row when you add the awakening.

### Healing — complete the ladder (the party's revive backbone)

| id | name | pp | power/heal | target | status | fx | source |
|---|---|---|---|---|---|---|---|
| healing_a | Healing Alpha | 5 | cure (status) | ally | — | cure | healing_cure | L1 (existing) |
| **healing_b** | **Healing Beta** | **12** | **150 heal** | ally | — | — | healing_cure | **L1 (NEW)** |
| healing_g | Healing Gamma | 20 | revive | ally | — | revive | healing_revive | L44 (existing) |
| **healing_o** | **Healing Omega** | **34** | **revive + 60% HP, all allies status-clear** | allies | — | revive | healing_revive | **L51 (NEW)** |

- `healing_a` is a status-cure; **Healing Beta adds an actual HP heal** so Dorin
  can main-heal. **Healing Omega** = the clutch party pickup (mass revive/cleanse)
  — his defining endgame support, distinct from Mia's offense-healing.

### Mirror — add a party version

| id | name | pp | target | status | fx | source |
|---|---|---|---|---|---|---|
| mirror | Mirror | 4 | self | mirror | mirror_snap | L1 (existing) |
| **mirror_o** | **Mirror Omega** | **16** | **allies** | mirror | mirror_snap | **L49 (NEW)** |

- Party-wide reflect — overlaps intentionally with Jay's Power Shield but is
  *faster* (Dorin's high Speed gets it up turn 1). Coordinate the `mirror` status
  so it's party-applicable (same plumbing Jay's `reflect` needs).

### Brainjam — fill the middle

| id | name | pp | target | status | fx | source |
|---|---|---|---|---|---|---|
| brainjam_a | Brainjam Alpha | 12 | enemy | hushed | brainjam | L40 (existing) |
| **brainjam_g** | **Brainjam Gamma** | **20** | enemy | **hushed** (longer) | brainjam | **L46 (NEW)** |
| brainjam_o | Brainjam Omega | 30 | enemies | hushed | brainjam | L50 (existing) |

- `hushed` (existing) = silences enemy casters/specials. Gamma bridges the
  single→AoE jump with a longer single-target lock — the anti-caster specialist
  tool (great vs. Mia-like enemy mages and boss spell phases).

### Martial stances — make his own turn a choice (NEW status `stance`)

| id | name | pp | target | status | fx | source |
|---|---|---|---|---|---|---|
| **stone_stance** | **Stone Brow Stance** | 6 | self | **braced** (NEW) | barrier (reuse, EARTH) | **L1 (NEW)** |
| **flowing_step** | **Flowing Step** | 6 | self | **flowing** (NEW) | barrier (reuse, CYAN) | **L45 (NEW)** |

- **Stone Brow Stance** (`braced`): +Defense and a **counter** — when struck by a
  physical hit, Dorin returns a fraction as fist damage. The monk who turns
  patience into offense. 3 turns.
- **Flowing Step** (`flowing`): +Speed and +evasion (dodge chance). He's already
  fastest; this makes him untouchable for a window — a tempo/defensive choice
  versus just attacking. 3 turns.
- **Strategy:** stances mean Dorin's turn isn't always "nuke or heal." Against a
  physical boss, brace+counter; against a flurry, flow+dodge; against casters,
  Brainjam. Three distinct reads.

**Count:** 7 existing + 7 new = **14.** ✅

---

## 4. NEW STATUSES (STATUS CONTRACT)

| status | applies to | effect | duration | notes |
|---|---|---|---|---|
| `braced` | hero | +Defense (temp) AND counter physical hits for ~40% of dealt damage | 3 turns | read +Def through `heroDefense()` as temp boost; counter resolves in the incoming-physical seam (~BattleScene L1807) |
| `flowing` | hero | +Speed (temp) AND ~35% chance to dodge an incoming hit | 3 turns | dodge check before damage apply; +Speed via `heroSpeed()` temp boost |
| `mirror` (extend) | hero | already exists for self — make it **party-applicable** | as canon | needed for `mirror_o`; same generalization Jay's `reflect` uses |

Reuse `cure`, `revive`, `hushed` as-is.

---

## 5. FX KEYS (extend existing families — minimal new art)

```ts
comet_b: S({ kind:'ability', family:'comet', tier:2, ramp:RAMP.PAPER, sfx:'fx_comet' }),
comet_g: S({ kind:'ability', family:'comet', tier:3, ramp:RAMP.PAPER, sfx:'fx_comet' }),
// healing_b/o reuse healing_cure / healing_revive keys (already registered) — or:
// (Dorin's new heals can point at the existing 'healing_cure'/'healing_revive' fx keys directly)
mirror_o: S({ kind:'ability', family:'barrier', ramp:RAMP.PAPER, sfx:'fx_shield' }),
// stances reuse barrier:
stone_stance: S({ kind:'ability', family:'barrier', ramp:RAMP.EARTH, sfx:'fx_guard' }),
flowing_step: S({ kind:'ability', family:'barrier', ramp:RAMP.CYAN,  sfx:'fx_guard' }),
```
Brainjam Gamma reuses the existing `brainjam` fx key. Confirm the `comet`
builder escalates for `tier:2/3`. No new `STAGE_ANIM` rows required.

---

## 6. AWAKENING — the one story beat

**`trial_of_the_mute_mountain` → `vibe_comet_o`.** Dorin masters the full Comet
at the Trial that gates his joining (Ch.9). This is his single awakening; remove
`vibe_comet_o` from `unlocks` when you add it. Toast: `'{dorin} called down the
whole sky — VIBE COMET Omega!'` Add the dialogue key in `dialogue.ts`. Everything
else is a level unlock.

---

## 7. STRATEGIC-DEPTH CHECK

- **Speed niche:** Dorin acts first — stances, party Mirror, and emergency revive
  land *before* the enemy moves. That first-turn tempo is his whole identity.
- **Defense-pierce:** Comet (element none) is the reliable nuke vs. armored/
  resistant foes, complementing Mia's weakness game and overlapping Jay's Surge
  on purpose (two answers, different speeds/costs).
- **Stance reads:** brace-counter vs. flow-dodge vs. Brainjam-silence = three
  distinct answers to three enemy archetypes; his turn is a *decision*.
- **Revive backbone:** Healing Omega makes him the "don't wipe" insurance, freeing
  Jay/Mia to commit to offense.

---

## 8. ACCEPTANCE CRITERIA

- [ ] New abilities in `ABILITIES`; fx resolve in `FX_REGISTRY` (validator both ways).
- [ ] `HEROES.dorin.unlocks` updated; `vibe_comet_o` removed from `unlocks` and granted by the awakening (one-path rule holds).
- [ ] `AWAKENINGS` has the `dorin` entry with a real `dialogue` key.
- [ ] `braced` (+Def, counter) and `flowing` (+Speed, dodge) wired; `mirror` made party-applicable for `mirror_o`.
- [ ] `availableAbilities('dorin', 99, allFlagsTrue)` returns ~14 ids.
- [ ] Tests: Comet Ω scaling; `braced` counter fires on physical hit; `flowing` dodge roll; Healing Ω mass-revive.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Voice: formal, calm, faintly baffled by the modern world. His battle lines read
like sutras ("Be still water." "The mountain answers.").**
