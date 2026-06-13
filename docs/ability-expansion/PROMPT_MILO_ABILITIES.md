# PROMPT — MILO: Ability Expansion ("Gadget Genius, Doubled")

> **Hand this whole file to the build AI.** Self-contained. Build only Milo's
> kit. Finish green: `npm test`, `npm run build`, `npm run validate`.

---

## 0. ROLE

Extend the ability layer of **Meteor Falls** (EarthBound-style TS RPG; Phaser 3 +
Vite + Zod; zero binary assets). Milo (Jeff analog, engine id **`milo`**) is the
**gadget genius with NO Vibe and NO PP** — his power is *competence*, not magic.
Goal: roughly **double his kit (5 → ~10)** while keeping the no-magic identity.
He joins **Ch.3** (crashes a rocket into the Academy greenhouse), so his unlock
levels should sit in his active range (~L1 spy/repair, then climbing).

His fantasy: the kid who *reads* the battlefield (Spy), fixes broken things
(Repair), and out-engineers magic with **0-PP tech** — rockets, deployable
shields, EMP and cryo grenades, a med-spray. He's the party's toolbox: utility,
debuffs, and reliable physical/elemental damage that costs no resource but a turn.

---

## 1. SHARED SYSTEM FACTS

- `src/data/abilities.ts` — `ABILITIES` (`AbilityDef`). `src/data/heroes.ts` —
  `HEROES.milo.unlocks[]`. `src/battle/fxRegistry.ts` — `FX_REGISTRY` + families
  + `STAGE_ANIM` (validator both directions). `src/battle/fx.ts` — family
  builders. `src/scenes/BattleScene.ts` — resolution/status. `src/schemas/index.ts`
  — Zod.
- **`AbilityDef`:** `{ id, name, kind:'vibe'|'gadget'|'pray'|'physical', pp>=0,
  power>=0, heal?, target:'enemy'|'enemies'|'ally'|'allies'|'self',
  element:'fire'|'freeze'|'volt'|'holy'|'physical'|'none', status?, text,
  fx /* must be in FX_REGISTRY */ }`.
- **Milo's rule: `kind:'gadget'`, `pp:0` on everything.** His gadgets bypass the
  Vibe stat — they should **not** scale on Vibe (his Vibe is 0). Tech damage
  scales on a flat curve or his Offense/Guts, **not** `vibeDamage`. If the
  current `bottle_rocket` already deals fixed `power` damage through a gadget
  path, reuse that path; otherwise add a `gadgetDamage(power, level/offense)`
  branch in `formulas.ts` so rockets scale sensibly without Vibe.
- **STATUS CONTRACT:** a new status string is inert until wired in
  `BattleScene.ts` (struct field → apply → effect → tick-down + wear-off line →
  schema enum). Reuse existing `paralyzed`, `crying`, `asleep`, `shield`.
- **Story/grind split:** Milo has no Vibe so he has **no awakenings** — *all his
  unlocks are level rows* (pure grind/competence). That's canon-consistent: he
  earns gear by building it. (If you want one story beat, make it a *flavor*
  unlock tied to reaching Ch.3, but mechanically it's still a level row.)
- **FX:** reuse families where possible (`rocket`, `scan`, `barrier`,
  `sparkle_rain`, `bolt`, `lattice`). New family only if unavoidable.

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
| **scope** | Scope | 0 | enemy | none | **marked** | spy_scan (reuse, GOLD ramp) | **L8** | Spy++: reveals stats AND marks the foe — party damage vs a `marked` target ×1.25 for 3 turns. Turns Milo into a force-multiplier; pairs with everyone's big hit. |
| **static_bomb** | Static Bomb | 70 | enemies | **volt** | **paralyzed** | bolt (reuse) | **L18** | EMP grenade: volt AoE (hits volt-weak foes hard) + chance to paralyze. His answer to fast packs, no PP needed. |
| **cryo_grenade** | Cryo Grenade | 80 | enemy | **freeze** | **frozen** | lattice (reuse) | **L22** | Cryo canister: freeze damage + skip-turn chance (`frozen`, the status Mia's file defines — reuse it). Single-target lockdown tool for the no-magic kid. |
| **forcefield_gizmo** | Forcefield Gizmo | 0 | allies | none | **shield** | barrier (reuse, CYAN) | **L16** | Deployable emitter: party-wide physical `shield` (the existing status) — Milo can fortify the team even when Jay is busy nuking. Real redundancy/choice in defense. |
| **med_spray** | Med-Spray | 120 heal | ally | none | **cure** | sparkle_rain (reuse) | **L20** | Aerosol medkit: reliable single-target heal + clears a status. 0-PP healing means the party isn't hostage to PSI/PRAY for upkeep. |
| **siege_rocket** | Siege Rocket | 360 | enemy | physical | — | rocket_big (reuse, tier up) | **L34** | The ultimate single-target rocket — Milo's "boss buster." Big fixed damage, no resource, but it's his whole turn and ignores no defense, so it's reliable, not broken. |

> Optional 7th if you want exactly-double-plus: **`recon_drone`** (gadget, 0 pp,
> `target:'enemies'`, status `marked`, fx `scan`) at L26 — marks the whole enemy
> row for the party. Keep if budget allows.

**Count:** 5 existing + 6 new = **11** (12 with the drone).

---

## 4. NEW / REUSED STATUSES

| status | source | effect | notes |
|---|---|---|---|
| `marked` | Scope/Recon | party damage vs target ×1.25, 3 turns | NOTE: `marked` already exists as Pippa's fx-only status (`pinpoint_mark`). **Coordinate:** implement `marked` ONCE as a shared status (whoever's prompt builds it first). Scope's mark is an *amplify* mark; if Pippa's is a *guaranteed-hit* mark, use two fields (`marked_dmg` vs `marked_hit`) or a small struct. Don't silently collide. |
| `paralyzed`, `frozen`, `shield`, `cure` | existing / Mia's file | reuse | `frozen` is defined in the Mia prompt; if Milo ships first, implement `frozen` here per that spec (skip-turn chance, boss-capped). |

Follow the STATUS CONTRACT for anything not already wired.

---

## 5. FX KEYS

All reuse existing families — **no new `fx.ts` case or `STAGE_ANIM` row needed:**
```ts
scope:            S({ kind:'ability', family:'scan',         ramp:RAMP.GOLD, sfx:'fx_spy' }),
static_bomb:      S({ kind:'ability', family:'bolt', tier:2, ramp:RAMP.GOLD, sfx:'fx_volt' }),
cryo_grenade:     S({ kind:'ability', family:'lattice', tier:2, ramp:RAMP.CYAN, sfx:'fx_freeze' }),
forcefield_gizmo: S({ kind:'ability', family:'barrier',      ramp:RAMP.CYAN, sfx:'fx_shield' }),
med_spray:        S({ kind:'ability', family:'sparkle_rain', ramp:RAMP.GRASS, sfx:'fx_cure' }),
siege_rocket:     S({ kind:'ability', family:'rocket', tier:3, ramp:RAMP.RED, sfx:'fx_rocket' }),
// recon_drone (optional): family 'scan', ramp RAMP.CYAN
```
Confirm the `rocket` builder handles `tier:3` (escalate the volley/payload); the
`bolt`/`lattice` builders already tier for Mia.

---

## 6. STRATEGIC-DEPTH CHECK

- **The toolbox identity:** Milo brings *coverage* — elemental grenades (volt/
  freeze) for the no-magic team, a deployable shield, 0-PP healing, and marks
  that amplify everyone. He never out-nukes Mia; he *enables* the party.
- **Resource asymmetry:** his moves cost only a turn (0 PP) — so when the
  psychics are PP-starved late in a dungeon, Milo carries. That's a genuine
  late-attrition payoff and a real "who acts this turn" decision.
- **Mark synergy:** Scope/`marked` rewards focus-fire coordination — set it up,
  then Jay/Dorin/Mia cash it in. Cross-character combo, not solo value.

---

## 7. ACCEPTANCE CRITERIA

- [ ] All new gadgets in `ABILITIES` (`kind:'gadget'`, `pp:0`); fx resolve in `FX_REGISTRY` (validator both ways).
- [ ] Gadget damage does **not** scale on Vibe (verify in `formulas.ts`/resolution).
- [ ] `HEROES.milo.unlocks` has the level rows; no awakenings for Milo.
- [ ] `marked` implemented once and shared cleanly with Pippa's mark (no field collision); `frozen` shared with Mia's spec.
- [ ] `availableAbilities('milo', 99, ()=>false)` returns ~11 ids (no flags needed — all level unlocks).
- [ ] Tests: rocket damage scales without Vibe; `static_bomb` paralyze + volt-weakness; `forcefield_gizmo` applies party `shield`; `med_spray` heals + clears status.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Keep Milo dry and clever in tone — he talks to machines more than people. His
lines are deadpan technical ("Calibrating…", "Payload away.").**
