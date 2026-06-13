# PROMPT — DORIN: Ability Expansion ("The Monk's Full Path")

> **Hand this whole file to the build AI.** Self-contained. Build only Dorin's
> kit. Finish green: `npm test`, `npm run build`, `npm run validate`.
>
> **REWRITTEN for the S16 strategic-depth layer.** Jay's expansion already
> shipped the shared substrate Dorin's path slots into — and crucially, it
> **unified the reflect/mirror math into one seam** (`mitigateIncoming`) and made
> `mirror` party-capable, so Dorin's party-Mirror, stances, and counters are now
> small, clean additions instead of new plumbing. **Read §1.5 first.**

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
defensive/offensive choice. His niche vs Jay/Mia: cheap, fast, defense-piercing
multi-hits and the party's emergency-revive backbone. **Post-S16 his speed niche
is sharper:** in a battle where defensive/answer turns matter, the hero who can
throw up a party Mirror or revive *before the enemy even moves* is invaluable.

---

## 1. SHARED SYSTEM FACTS

- `src/data/abilities.ts` (`ABILITIES`/`AbilityDef`); `src/data/heroes.ts`
  (`HEROES.dorin.unlocks[]`); `src/battle/fxRegistry.ts` (`FX_REGISTRY` + families
  + `STAGE_ANIM`, validator both directions); `src/battle/fx.ts`;
  `src/scenes/BattleScene.ts`; `src/battle/formulas.ts` (pure rng-injected math);
  `src/schemas/index.ts`; `tools/content-validate.ts` (the awakening manifest).
- **`AbilityDef`:** `{ id, name, kind, pp>=0, power>=0, heal?, target, element, status?, text, fx }`. Dorin uses `kind:'vibe'`.
- **Formulas:** `vibeDamage = round(power*(1+Vibe/60)*0.9..1.1)`;
  `vibeHeal = round(power*(1+Vibe/80)*0.95..1.05)`. Dorin's Vibe is solid (base
  7, +2.0/lvl); his **Speed is the highest in the party** (base 8) — lean into
  *acting first* and *cheap* spells over raw ceiling.
- **Comet = `element:'none'`** (defense-piercing nuke, like Starstorm) — keep it
  non-elemental so it's the reliable answer alongside Jay's Surge.
- **Tier ladder** α/β/γ/Ω ≈ 1:2.2:3.6:5.5.

### 1.5 WHAT'S ALREADY LIVE — the S16 layer you build ON

> Shipped with Jay's expansion. **Most of Dorin's "new plumbing" is already done.**

- **`mirror` is now part of the ONE incoming-damage seam.** `mitigateIncoming(dmg,
  element, WardState)` (`{shield, ward, reflect, mirror, steeled}` → `{taken,
  reflected}`) already halves-and-bounces for both `mirror` (~¼ back) and Jay's
  `reflect` (~⅓ back), and the `castAbility` `mirror` case already loops
  `allyTargets`. **So `mirror_o` (party Mirror) is nearly free:** add the ability
  row with `target:'allies'` and the existing apply + mitigation path handles it.
  Keep the mirror=¼ / reflect=⅓ distinction — Dorin's is *faster*, Jay's bounces
  *harder*; two answers, different speeds/costs, on purpose.
- **The counter belongs at that same seam.** `mitigateIncoming` returns
  `reflected`, applied to the attacker in `enemyAct`. **`braced`'s counter
  resolves right beside it** — when a `braced` Dorin is struck by a **physical**
  hit, return ~40% as fist damage to the attacker. Don't add a parallel damage
  path; hook the existing `reflected` application.
- **The temp-boost-via-status pattern (for `braced`/`flowing`).** Resolve's
  `steeled` adds `STEELED_GUTS` at the `heroGutsS()` read seam and ticks off in
  `statusPhase`, never baked into permanent `boosts`. **Copy it:** `braced` →
  +Defense at the `heroDefense` read (the incoming-damage calc reads
  `heroDefense(target.hero)`); `flowing` → +Speed at the `heroSpeed` read.
- **Dodge has a home.** Pippa's `evasion` and **Dorin's `flowing`** both add a
  pre-damage dodge roll at the incoming seam — implement the dodge check once
  (a shared "did this hit miss?" gate in `enemyAct` before `mitigateIncoming`),
  read off the hero's live status. Route the chance through Speed/Luck.
- **Live statuses to REUSE:** `mirror` (now party-capable), `cure`, `revive`,
  `hushed` — all wired. `shield`/`ward`/`reflect`/`steeled` exist if referenced.
- **Card pips:** GOOD statuses ride a tinted hex via `BustTick`. Add `braced`
  (EARTH/red) and `flowing` (cyan) pips for legibility.
- **Awakening manifest discipline (REQUIRED for his one awakening).** A new
  awakening must be added to BOTH `AWAKENINGS` (with a real `dialogue` key) AND
  the pinned `canon` record in `tools/content-validate.ts` (checked both
  directions). Jay's S16 awakenings extended that record — follow the same edit.
- **The Σ-firework pattern** (Jay's `surge` tier-1→5 builder) is the reference if
  you escalate the Comet builder — but Comet only needs β/γ here, so just confirm
  the `comet` builder tiers cleanly for `tier:2/3`.
- **STATUS CONTRACT** (for `braced`/`flowing`): struct field → apply in
  `castAbility` → effect at the live seam above → tick + wear-off in
  `statusPhase` → card pip → schema `z.enum` if validated.

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
> lets him join is the "mastery earned" beat). **One-path rule:** remove its
> `unlocks` row AND add it to both `AWAKENINGS` and the content-validate manifest.

### Healing — complete the ladder (the party's revive backbone)

| id | name | pp | power/heal | target | status | fx | source |
|---|---|---|---|---|---|---|---|
| healing_a | Healing Alpha | 5 | cure (status) | ally | — | cure | healing_cure | L1 (existing) |
| **healing_b** | **Healing Beta** | **12** | **150 heal** | ally | — | — | healing_cure | **L1 (NEW)** |
| healing_g | Healing Gamma | 20 | revive | ally | — | revive | healing_revive | L44 (existing) |
| **healing_o** | **Healing Omega** | **34** | **revive + 60% HP, all allies status-clear** | allies | — | revive | healing_revive | **L51 (NEW)** |

- `healing_a` is a status-cure; **Healing Beta adds an actual HP heal** so Dorin
  can main-heal. **Healing Omega** = the clutch party pickup (mass revive/cleanse)
  — his defining endgame support, distinct from Mia's offense-healing. Combined
  with his **high Speed**, it lands *first*, which is the whole point.

### Mirror — add a party version (nearly free post-S16)

| id | name | pp | target | status | fx | source |
|---|---|---|---|---|---|---|
| mirror | Mirror | 4 | self | mirror | mirror_snap | L1 (existing) |
| **mirror_o** | **Mirror Omega** | **16** | **allies** | mirror | mirror_snap | **L49 (NEW)** |

- Party-wide reflect — overlaps intentionally with Jay's Power Shield but is
  *faster* (Dorin acts turn 1). **The `mirror` status is already party-capable
  through `mitigateIncoming`** (S16) — just add the `target:'allies'` row.

### Brainjam — fill the middle

| id | name | pp | target | status | fx | source |
|---|---|---|---|---|---|---|
| brainjam_a | Brainjam Alpha | 12 | enemy | hushed | brainjam | L40 (existing) |
| **brainjam_g** | **Brainjam Gamma** | **20** | enemy | **hushed** (longer) | brainjam | **L46 (NEW)** |
| brainjam_o | Brainjam Omega | 30 | enemies | hushed | brainjam | L50 (existing) |

- `hushed` (existing) silences enemy casters/specials. Gamma bridges the
  single→AoE jump with a longer single-target lock — the anti-caster tool (great
  vs Mia-like enemy mages and boss spell phases).

### Martial stances — make his own turn a choice (NEW statuses `braced`/`flowing`)

| id | name | pp | target | status | fx | source |
|---|---|---|---|---|---|---|
| **stone_stance** | **Stone Brow Stance** | 6 | self | **braced** (NEW) | barrier (reuse, EARTH) | **L1 (NEW)** |
| **flowing_step** | **Flowing Step** | 6 | self | **flowing** (NEW) | barrier (reuse, CYAN) | **L45 (NEW)** |

- **Stone Brow Stance** (`braced`): +Defense AND a **counter** — struck by a
  physical hit, Dorin returns ~40% as fist damage (resolves at the live
  `reflected` seam, §1.5). The monk who turns patience into offense. 3 turns.
- **Flowing Step** (`flowing`): +Speed AND ~35% dodge (the shared dodge gate).
  He's already fastest; this makes him untouchable for a window. 3 turns.
- **Strategy:** his stances mean Dorin's turn isn't always "nuke or heal" — and
  they mirror Jay's nuke/fortify/control trichotomy: against a physical boss,
  brace+counter; against a flurry, flow+dodge; against casters, Brainjam-silence.

**Count:** 7 existing + 7 new = **14.** ✅

---

## 4. NEW STATUSES (STATUS CONTRACT)

| status | applies to | effect | duration | notes (post-S16 seams) |
|---|---|---|---|---|
| `braced` | hero | +Defense AND counter physical hits for ~40% of dealt damage | 3 turns | +Def via the `steeled` temp-boost pattern at `heroDefense`; counter at the live `mitigateIncoming` `reflected` application |
| `flowing` | hero | +Speed AND ~35% dodge | 3 turns | +Speed temp boost at `heroSpeed`; dodge at the shared pre-damage miss gate (with Pippa's `evasion`) |
| `mirror` (extend) | hero | already party-capable via `mitigateIncoming` (S16) | as canon | `mirror_o` just adds the `target:'allies'` row — no new plumbing |

Reuse `cure`, `revive`, `hushed` as-is.

---

## 5. FX KEYS (extend existing families — minimal new art)

```ts
comet_b: S({ kind:'ability', family:'comet', tier:2, ramp:RAMP.PAPER, sfx:'fx_comet' }),
comet_g: S({ kind:'ability', family:'comet', tier:3, ramp:RAMP.PAPER, sfx:'fx_comet' }),
// healing_b/o reuse the existing 'healing_cure'/'healing_revive' fx keys directly.
mirror_o:     S({ kind:'ability', family:'barrier', ramp:RAMP.PAPER, sfx:'fx_shield' }),
stone_stance: S({ kind:'ability', family:'barrier', ramp:RAMP.EARTH, sfx:'fx_guard' }),
flowing_step: S({ kind:'ability', family:'barrier', ramp:RAMP.CYAN,  sfx:'fx_guard' }),
```
Brainjam Gamma reuses the existing `brainjam` fx key. Confirm the `comet` builder
escalates for `tier:2/3` (the S16 surge work proves the tier pattern). No new
`STAGE_ANIM` rows required.

---

## 6. AWAKENING — the one story beat

**`trial_of_the_mute_mountain` → `vibe_comet_o`.** Dorin masters the full Comet
at the Trial that gates his joining (Ch.9). His single awakening; remove
`vibe_comet_o` from `unlocks`, add it to `AWAKENINGS` **and** the
`tools/content-validate.ts` `canon` manifest, and add a `dialogue.ts` key.
Toast: `'{dorin} called down the whole sky — VIBE COMET Omega!'`

---

## 7. STRATEGIC-DEPTH CHECK

- **Speed niche (louder post-S16):** Dorin acts first — stances, party Mirror,
  and emergency revive land *before* the enemy moves. In a system that rewards
  answering a telegraph, getting your wall/heal up turn-1 is his whole identity.
- **Defense-pierce:** Comet (`element:'none'`) is the reliable nuke vs armored/
  resistant foes — complements Mia's weakness game and overlaps Jay's Surge on
  purpose (two answers, different speeds/costs).
- **The answer-the-telegraph family:** Dorin's party `mirror` (fast, ¼ bounce),
  Jay's `reflect` (¼-turn slower, ⅓ bounce), Pippa's `guarded` (redirect) — three
  reads the party picks between, and Dorin's is the one that beats the enemy to it.
- **Stance reads:** brace-counter vs flow-dodge vs Brainjam-silence = three
  distinct answers to three enemy archetypes; his turn is a *decision*, not a default.
- **Revive backbone:** Healing Omega is the "don't wipe" insurance, freeing
  Jay/Mia to commit to offense — the counterpart to Mia's offense-healing.

---

## 8. ACCEPTANCE CRITERIA

- [ ] New abilities in `ABILITIES`; fx resolve in `FX_REGISTRY` (validator both ways).
- [ ] `HEROES.dorin.unlocks` updated; `vibe_comet_o` removed from `unlocks` and granted by the awakening (one-path rule); **awakening added to the content-validate `canon` manifest**.
- [ ] `AWAKENINGS` has the `dorin` entry with a real `dialogue` key.
- [ ] `braced` (+Def via temp-boost pattern, counter at the live `reflected` seam) and `flowing` (+Speed, dodge at the shared miss gate) wired; `mirror_o` reuses the now-party-capable `mirror` (no new plumbing).
- [ ] `availableAbilities('dorin', 99, allFlagsTrue)` returns ~14 ids.
- [ ] Tests: Comet Ω scaling; `braced` counter fires on a physical hit (returns ~40%); `flowing` dodge roll; Healing Ω mass-revive; party `mirror_o` bounces via `mitigateIncoming`.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Voice: formal, calm, faintly baffled by the modern world. His battle lines read
like sutras ("Be still water." "The mountain answers." "Patience is also a fist.").**
