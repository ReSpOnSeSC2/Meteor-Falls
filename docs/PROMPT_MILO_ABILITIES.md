# PROMPT — MILO: Ability Expansion ("Gadget Genius, Doubled")

> **Hand this whole file to the build AI.** Self-contained. Build only Milo's
> kit. Finish green: `npm test`, `npm run build`, `npm run validate`.
>
> **REWRITTEN for the S16 strategic-depth layer.** Jay's expansion ("The Old
> Light, Doubled") already shipped the shared battle-depth substrate this file
> now builds ON — the layered-ward damage seam, the `puppet`/`steeled`/`ward`/
> `reflect` statuses, enemy-move elements, `mind_immune`, the cross-character
> *synergy philosophy*, and the awakening validator manifest. **Read §1.5
> before writing a line of code** — most of the plumbing you'd have reinvented
> is already there; your job is to plug Milo's toolbox into it, not re-pour it.

---

## 0. ROLE

Extend the ability layer of **Meteor Falls** (EarthBound-style TS RPG; Phaser 3 +
Vite + Zod; zero binary assets). Milo (Jeff analog, engine id **`milo`**) is the
**gadget genius with NO Vibe and NO PP** — his power is *competence*, not magic.
Goal: roughly **double his kit (5 → ~11)** while keeping the no-magic identity.
He joins **Ch.3** (crashes a rocket into the Academy greenhouse), so his unlock
levels should sit in his active range (~L1 spy/repair, then climbing).

His fantasy: the kid who *reads* the battlefield (Spy), fixes broken things
(Repair), and out-engineers magic with **0-PP tech** — rockets, deployable
shields, EMP and cryo grenades, a med-spray. He's the party's toolbox: utility,
debuffs, and reliable physical/elemental damage that costs no resource but a turn.
**Post-S16 his role is sharper than ever:** in a battle system where a defensive
or control turn is now genuinely worth taking, Milo is the hero who supplies
*coverage and economy* — the layers the psychics would otherwise spend PP on.

---

## 1. SHARED SYSTEM FACTS

- `src/data/abilities.ts` — `ABILITIES` (`AbilityDef`). `src/data/heroes.ts` —
  `HEROES.milo.unlocks[]`. `src/battle/fxRegistry.ts` — `FX_REGISTRY` + families
  + `STAGE_ANIM` (validator both directions). `src/battle/fx.ts` — family
  builders. `src/scenes/BattleScene.ts` — resolution/status. `src/schemas/index.ts`
  — Zod. `src/battle/formulas.ts` — pure, rng-injected battle math (tested headlessly).
- **`AbilityDef`:** `{ id, name, kind:'vibe'|'gadget'|'pray'|'physical', pp>=0,
  power>=0, heal?, target:'enemy'|'enemies'|'ally'|'allies'|'self',
  element:'fire'|'freeze'|'volt'|'holy'|'physical'|'none', status?, text,
  fx /* must be in FX_REGISTRY */ }`.
- **Milo's rule: `kind:'gadget'`, `pp:0` on everything.** His gadgets bypass the
  Vibe stat — they must **not** scale on `vibeDamage`. The existing gadget path
  in `castAbility` already does this: gadget damage is `round(power * (0.9 +
  rng*0.2))` (flat, no Vibe, defense pierced) — **reuse it**. If a gadget should
  scale with his growth, add a `gadgetDamage(power, offense/level)` branch in
  `formulas.ts`; do NOT route a gadget through `vibeDamage`.

### 1.5 WHAT'S ALREADY LIVE — the S16 "strategic-depth layer" you build ON

> These shipped with Jay's expansion. **Reuse them; do not reinvent.** Every
> bullet is a seam your gadgets are expected to plug into.

- **The ONE incoming-damage seam — `mitigateIncoming(dmg, element, WardState)`**
  in `formulas.ts`, returning `{ taken, reflected }`. `WardState = { shield,
  ward, reflect, mirror, steeled }` (all booleans). It already gates **Shield**
  (halves `physical`), **Ward** (halves elemental: fire/freeze/volt/holy),
  **Reflect** & **Mirror** (halve all + bounce), and the **Bulwark** synergy
  (shield + ward held at once trims extra). The enemy-attack resolver in
  `enemyAct` calls this once — **any new mitigation you add (a Milo forcefield)
  works through the SAME `shield`/`ward` statuses, not a parallel `if` block.**
- **Hero statuses already wired** (`HeroStatus` struct, applied in the
  `castAbility` status switch, ticked in `statusPhase`, drawn as a tinted card
  hex-pip via `BustTick`): `shield`, `mirror`, **`ward`**, **`reflect`**,
  **`steeled`**, plus `sunburn/productive/crying/asleep/paralyzed/hushed`.
  **Milo's `forcefield_gizmo` reuses the LIVE `shield` status verbatim.**
- **Enemy statuses already wired** (`EnemyUnit`): **`puppet`** (Jay's Mind Warp),
  `asleep`, `crying`, `hushed`, `gilded`, `shield`, `stolenCash`.
  **`paralyzed` lands on enemies via the existing enemy path** — confirm/extend
  for Static Bomb (see §4).
- **Enemy attacks now carry an optional `element`** (`EnemyMoveSchema.element?`,
  default `'physical'`). `impactKeyOf(element)` picks the impact face; the
  element drives which of the party's wards answers. This is why Ward exists —
  and it's why **Milo's elemental grenades (volt/freeze) are legitimate
  *outgoing* elements**, symmetrical to the incoming ones the wards block.
- **`EnemyDef.mind_immune?`** + `mindImmune(def)` helper — bosses can't be
  puppeted. **Control philosophy (reuse it):** any disable Milo lands
  (`paralyzed`, `frozen`) must be **capped or no-op on bosses** so control stays
  a crowd/tempo tool, never an "I win." Mirror Jay's `mindImmune` gate.
- **Damage classes:** every hit declares `'physical' | 'vibe' | 'pray'` into
  `damageEnemy(...)`. Gadgets resolve as `'physical'` today (rockets pierce
  defense) — keep that unless a gadget is explicitly elemental, in which case
  pass its element through to weakness/impact (see Mia coordination, §4).
- **The temp-boost-via-status pattern.** Resolve's `steeled` adds `STEELED_GUTS`
  at the `heroGutsS()` stat-read seam (never baked into permanent `boosts`).
  **Any temp stat buff you add follows this exact shape:** boost at the read
  site, tick off in `statusPhase`. (Milo has no buffs in the base kit, but the
  optional drone marks ride the live `marked` field — see §4.)
- **fx families live + tier-escalating:** `rocket`, `scan`, `barrier`,
  `sparkle_rain`, `bolt`, `lattice`, `flame_wave`, `comet`, `siphon`, `spiral`,
  `wire_cross`, and the **new `reflect_field`** (mirror-wall). The `surge`
  builder now branches **tier 1–5** with per-rung fireworks — **the reference
  pattern** if you ever add a capstone visual (you won't here; all Milo fx reuse).
- **Awakening manifest discipline:** Milo has **no awakenings** (no Vibe), so you
  touch none of this — but know it exists: any new awakening must be added to
  BOTH `AWAKENINGS` and the pinned `canon` record in `tools/content-validate.ts`.
- **STATUS CONTRACT** (for anything NOT already live): struct field →
  apply in `castAbility` → make it *do something* at the right seam → tick down +
  wear-off line in `statusPhase` → add the card pip in `BustTick` if it's a
  GOOD/visible status → add to the schema `z.enum` if validated.

- **Story/grind split:** Milo has no Vibe → **no awakenings**; *all unlocks are
  level rows* (pure competence — he earns gear by building it). A flavor line
  tied to the Ch.3 join is fine, but mechanically it's still a level row.

---

## 2. CURRENT KIT (baseline — extend)

| id | name | kind | pp | power | target | element | status | fx | source |
|---|---|---|---|---|---|---|---|---|---|
| spy | Spy | gadget | 0 | 0 | enemy | none | — | spy_scan | L1 |
| repair | Repair | gadget | 0 | 0 | self | none | — | repair_overnight | L1 |
| bottle_rocket | Bottle Rocket | gadget | 0 | 90 | enemy | physical | — | rocket | L1 |
| big_bottle_rocket | Big Bottle Rocket | gadget | 0 | 220 | enemy | physical | — | rocket_big | L14 |
| multi_bottle_rocket | Multi Bottle Rocket | gadget | 0 | 140 | enemies | physical | — | rocket_multi | L28 |

---

## 3. TARGET KIT — BUILD THESE (Milo → ~11)

Six **new** gadgets. All `kind:'gadget'`, `pp:0`.

| id | name | power | target | element | status | fx | source | role / strategy |
|---|---|---|---|---|---|---|---|---|
| **scope** | Scope | 0 | enemy | none | **marked** | spy_scan (reuse, GOLD ramp) | **L8** | Spy++: reveals stats AND marks the foe — party damage vs a `marked` target ×1.25 for 3 turns. Force-multiplier; pairs with everyone's big hit. **Stacks multiplicatively with Mia's `exposed` (×1.3) — a Scope+Hush Hex target eats ~×1.6, the party's hardest focus-fire combo.** |
| **static_bomb** | Static Bomb | 70 | enemies | **volt** | **paralyzed** | bolt (reuse) | **L18** | EMP grenade: volt AoE (hits volt-weak foes hard) + chance to paralyze. His answer to fast packs, no PP needed. **Boss-capped paralyze (reuse the `mindImmune`/control-cap philosophy).** |
| **cryo_grenade** | Cryo Grenade | 80 | enemy | **freeze** | **frozen** | lattice (reuse) | **L22** | Cryo canister: freeze damage + skip-turn chance (`frozen`, the status Mia's file defines — reuse it, don't re-add). Single-target lockdown for the no-magic kid. |
| **forcefield_gizmo** | Forcefield Gizmo | 0 | allies | none | **shield** | barrier (reuse, CYAN) | **L16** | Deployable emitter: party-wide physical `shield` (the **LIVE** status). Milo fortifies the team even when Jay is busy nuking. **Cast on an ally Jay has Warded and you get BULWARK for free — the live Shield+Ward synergy, set up by two heroes.** |
| **med_spray** | Med-Spray | 120 heal | ally | none | **cure** | sparkle_rain (reuse) | **L20** | Aerosol medkit: reliable single-target heal + clears a status. 0-PP healing means the party isn't hostage to PSI/PRAY for upkeep. |
| **siege_rocket** | Siege Rocket | 360 | enemy | physical | — | rocket_big (reuse, tier up to 3) | **L34** | The ultimate single-target rocket — Milo's "boss buster." Big fixed damage, no resource, but it's his whole turn and pierces nothing extra, so it's reliable, not broken. **The 0-PP nuke that keeps firing when Jay/Mia are PP-dry late in a dungeon.** |

> Optional 7th (exactly-double-plus): **`recon_drone`** (gadget, 0 pp,
> `target:'enemies'`, status `marked`, fx `scan`, ramp CYAN) at L26 — marks the
> whole enemy row, setting up a party AoE turn. Keep if budget allows.
>
> Optional 8th, **a real new synergy hook** if you want Milo to own a *layer*:
> **`thermal_ward`** (gadget, 0 pp, `target:'allies'`, status **`ward`** — the
> LIVE elemental-mitigation status — fx `barrier` GRASS) at ~L24. This lets
> *Milo alone* set up Bulwark (cast forcefield + thermal_ward across two turns),
> or hand the party an elemental wall before a fire/freeze boss telegraph
> without spending a drop of Jay's PP. It plugs straight into `mitigateIncoming`
> with zero new plumbing. Strong but turn-expensive — a deliberate trade.

**Count:** 5 existing + 6 new = **11** (12–13 with the drone / thermal_ward).

---

## 4. NEW / REUSED STATUSES

| status | source | live? | effect | notes |
|---|---|---|---|---|
| `shield` | Forcefield Gizmo | **LIVE (S16)** | halves incoming physical | reuse verbatim — combos into **Bulwark** with Jay's `ward` |
| `ward` | (optional thermal_ward) | **LIVE (S16)** | halves incoming elemental | reuse verbatim; plugs into `mitigateIncoming` |
| `paralyzed` | Static Bomb | exists (enemy) | skip/reduced action | reuse; **add the boss cap** if not present (control philosophy) |
| `cure` | Med-Spray | exists | clears a status + heals | reuse |
| `marked` | Scope / Recon Drone | **NEW — coordinate** | party damage vs target ×1.25, 3 turns | **Pippa's file also builds `marked`** (hers = guaranteed-hit + amplify). Implement it **ONCE** as a shared status with sub-fields `marked_dmg` (Milo's amplify) and `marked_hit` (Pippa's can't-miss). Whichever prompt ships first builds the field; the other reuses it. **Do not silently collide.** The amplify must stack multiplicatively with Mia's `exposed`. |
| `frozen` | Cryo Grenade | **NEW — coordinate** | skip next turn (chance by source), boss-capped | **Defined in Mia's file** (freeze γ+). If Milo ships first, build `frozen` here to that spec (skip-turn chance, bosses capped/immune via the `mindImmune` philosophy); Mia reuses it. One implementation only. |

Follow the STATUS CONTRACT for anything not already wired. **The hard rule:
shared statuses (`marked`, `frozen`) get exactly one struct field and one apply
site across all five hero prompts.**

---

## 5. FX KEYS

All reuse existing families — **no new `fx.ts` case or `STAGE_ANIM` row:**
```ts
scope:            S({ kind:'ability', family:'scan',         ramp:RAMP.GOLD,  sfx:'fx_spy' }),
static_bomb:      S({ kind:'ability', family:'bolt', tier:2, ramp:RAMP.GOLD,  sfx:'fx_volt' }),
cryo_grenade:     S({ kind:'ability', family:'lattice', tier:2, ramp:RAMP.CYAN, sfx:'fx_freeze' }),
forcefield_gizmo: S({ kind:'ability', family:'barrier',      ramp:RAMP.CYAN,  sfx:'fx_shield' }),
med_spray:        S({ kind:'ability', family:'sparkle_rain', ramp:RAMP.GRASS, sfx:'fx_cure' }),
siege_rocket:     S({ kind:'ability', family:'rocket', tier:3, ramp:RAMP.RED, sfx:'fx_rocket' }),
// recon_drone (optional): family 'scan', ramp RAMP.CYAN, sfx 'fx_spy'
// thermal_ward (optional): family 'barrier', ramp RAMP.GRASS, sfx 'fx_ward'  (fx_ward is a LIVE preset)
```
Confirm the `rocket` builder handles `tier:3` (escalate the volley/payload); the
`bolt`/`lattice` builders already tier for Mia and for Jay's S16 work.

---

## 6. STRATEGIC-DEPTH CHECK (now that the depth layer is real)

- **The toolbox identity:** Milo brings *coverage* — elemental grenades (volt/
  freeze) for the no-magic team, deployable defense (Shield, optional Ward),
  0-PP healing, and marks that amplify everyone. He never out-nukes Mia; he
  *enables* the party.
- **Resource asymmetry is now load-bearing.** Post-S16, a defensive/control turn
  genuinely competes with a damage turn (Jay's nuke-vs-fortify, Mia's PP budget,
  the layered wards). Milo's **0-PP everything** means when the psychics are
  PP-starved deep in a dungeon, *he* supplies the shields, wards, heals, and
  control they can't afford — a real late-attrition payoff and a genuine "who
  acts this turn" decision.
- **He participates in the live synergies, he doesn't bypass them.** Forcefield
  (`shield`) + Jay's Ward = **Bulwark** on a chosen ally. Scope (`marked`) +
  Mia's Hush Hex (`exposed`) = the party's deepest focus-fire multiplier. Static
  Bomb `paralyzed` is the 0-PP sibling of Jay's `puppet`/Hypno control — and is
  boss-capped by the same philosophy.
- **Mark synergy = cross-character combo, not solo value.** Scope/Recon set up;
  Jay/Dorin/Mia/Pippa cash in. Build the amplify so focus-fire is *discoverably*
  the right play against a fat target.

---

## 7. ACCEPTANCE CRITERIA

- [ ] All new gadgets in `ABILITIES` (`kind:'gadget'`, `pp:0`); fx resolve in `FX_REGISTRY` (validator both ways).
- [ ] Gadget damage does **not** scale on Vibe (verify it routes the flat gadget path, never `vibeDamage`).
- [ ] `HEROES.milo.unlocks` has the level rows; **no awakenings** for Milo.
- [ ] `forcefield_gizmo` applies the **LIVE** party `shield` (reuse, no new plumbing) and visibly combos to **Bulwark** with Jay's `ward` (assert mitigation stacks via `mitigateIncoming`).
- [ ] `marked` implemented **once** and shared cleanly with Pippa (`marked_dmg`/`marked_hit`, no field collision); `frozen` shared with Mia's spec (one implementation, boss-capped).
- [ ] `static_bomb` paralyze is **boss-capped** (the control philosophy); volt-weakness multiplier applies.
- [ ] `availableAbilities('milo', 99, ()=>false)` returns ~11 ids (no flags — all level unlocks).
- [ ] Tests: rocket damage scales **without** Vibe; `static_bomb` paralyze + volt-weakness; `forcefield_gizmo` → party `shield` and Shield+Ward = Bulwark mitigation via `mitigateIncoming`; `med_spray` heals + clears a status; `marked` amplify stacks with `exposed`.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Keep Milo dry and clever in tone — he talks to machines more than people. His
lines are deadpan technical ("Calibrating…", "Payload away.", "Forcefield
nominal. You're welcome.").**
