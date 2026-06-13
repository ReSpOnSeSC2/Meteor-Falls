# PROMPT — PIPPA: Ability Expansion ("The Page's Full Brief")

> **Hand this whole file to the build AI.** Self-contained. Build only Pippa's
> kit. Finish green: `npm test`, `npm run build`, `npm run validate`.

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
out-maneuvers things at thimble-scale. **Important architecture note:** her
current six abilities already exist as DATA with fx, but several of their
statuses (`marked`, `rally`, `focus`, `evasion`, `morale`) are **fx-only and not
yet mechanically wired** (see the comment in `abilities.ts`). **This prompt's
first job is to actually IMPLEMENT those statuses**, then add ~6 new abilities.

---

## 1. SHARED SYSTEM FACTS

- `src/data/abilities.ts` (`ABILITIES`/`AbilityDef`); `src/data/heroes.ts`
  (`HEROES.pippa.unlocks[]`); `src/battle/fxRegistry.ts` (validator both ways);
  `src/battle/fx.ts`; `src/scenes/BattleScene.ts`; `src/schemas/index.ts`.
- **`AbilityDef`:** `{ id, name, kind, pp>=0, power>=0, heal?, target, element, status?, text, fx }`.
- **Pippa's rule: `kind:'physical'`, `pp:0` on everything** (no Vibe, no PP).
  Her heals/damage are small and **must not scale on Vibe** — flat or
  Offense/Luck-based. She is absurdly **lucky** (base Luck 9) and accurate —
  build her math off Luck where a stat is needed.
- **STATUS CONTRACT (this is the bulk of the work):** a status string is inert
  until wired in `BattleScene.ts` — add a struct field, apply it, make it *do
  something* at the right seam, tick it down + print a wear-off line, add to the
  schema `z.enum` if validated.
- **Story/grind split:** no Vibe → **no awakenings**; all level unlocks (she
  earns her brief through service). Optionally tie one unlock's *flavor* to the
  Ch.5 join beat, but mechanically it's a level row.
- **FX:** all her faces reuse existing families (`scan`, `sparkle_rain`,
  `barrier`) — no new `fx.ts` case or `STAGE_ANIM` rows needed.

---

## 2. CURRENT KIT (baseline — keep, but WIRE THE STATUSES)

| id | name | pp | power | target | status | fx | source | status wired? |
|---|---|---|---|---|---|---|---|---|
| pinpoint_mark | Pinpoint Mark | 0 | 0 | ally | **marked** | pinpoint_mark | L1 | ❌ implement |
| royal_rally | Royal Rally | 0 | 0 | allies | **rally** | royal_rally | L1 | ❌ implement |
| pocket_patch | Pocket Patch | 0 | 35 heal | ally | cure | pocket_patch | L1 | cure exists |
| big_little_focus | Big-Little Focus | 0 | 0 | allies | **focus** | big_little_focus | L1 | ❌ implement |
| scale_step | Scale Step | 0 | 0 | self | **evasion** | scale_step | L30 | ❌ implement |
| bellwether | Bellwether | 0 | 0 | allies | **morale** | bellwether | L44 | ❌ implement |

**Define these five statuses** (the support spine of the party):

| status | applies to | effect | duration | notes |
|---|---|---|---|---|
| `marked` | ally→enemy target | the marked enemy can't be missed by the party AND takes ~×1.25 damage | 3 turns | **shared with Milo's Scope** — implement once; if Milo's is amplify-only and Pippa's is also guaranteed-hit, use two sub-flags (`marked_hit`, `marked_dmg`). Don't collide. |
| `rally` | party | +Speed and +Luck (quick and lucky) | 3 turns | temp boosts via `heroSpeed()`/`heroLuck()` |
| `focus` | party | +accuracy / next physical hit can't miss (the "big-little focus" combo with Milo) | 2 turns | |
| `evasion` | hero (self) | high dodge chance + leaves a decoy (first incoming hit auto-misses) | 3 turns | the "thimble-scale" gimmick |
| `morale` | party | the next PRAY/heal "carries" — boosts Mia's PRAY tier-up odds or amplifies the next party heal | until consumed | Bellwether feeds Mia's faith mechanic — cross-character synergy |

---

## 3. TARGET KIT — BUILD THESE (Pippa → ~12)

Six **new** abilities. All `kind:'physical'`, `pp:0`. Reuse fx families.

| id | name | power | target | status | fx | source | role / strategy |
|---|---|---|---|---|---|---|---|---|
| **volley_mark** | Volley Mark | 0 | enemies | **marked** | scan (reuse, GOLD) | **L20** | Mark the WHOLE enemy row — sets up a party AoE turn (Mia's Fire β, Milo's Multi-Rocket). The team-wide focus-fire enabler. |
| **standing_ovation** | Standing Ovation | 0 | allies | **rally** (stronger/longer) | sparkle_rain (RED) | **L34** | Royal Rally++: bigger Speed/Luck swing — her "go" button before a boss burst. |
| **field_dressing** | Field Dressing | 90 heal | allies | cure | sparkle_rain (GRASS) | **L26** | Party heal + status clear (0-PP). With Milo's Med-Spray, the no-magic kids cover upkeep so the psychics stay on offense. |
| **diplomatic_immunity** | Diplomatic Immunity | 0 | ally | **guarded** (NEW) | barrier (CYAN) | **L22** | She steps in front: redirect the next single-target hit aimed at a chosen ally onto a decoy / negate it. Protect the squishy caster on a telegraphed turn. |
| **stern_decree** | Stern Decree | 0 | enemies | **rattled** (NEW) | scan (PURPLE) | **L31** | She speaks like a furious diplomat: enemies' Offense down (incoming party damage taken ×0.8) + small chance to skip. Control without magic. |
| **the_minutes** | The Minutes | 0 | allies | **cure** + **focus** | big_little_focus (reuse) | **L40** | "Takes minutes during disasters": cleanse a party debuff AND set focus — turns a bad round around. Her signature comeback tool. |

> Optional 7th: **`last_stamp`** (physical, 0 pp, `target:'ally'`, an emergency
> single-revive at low HP — "the royal seal, pressed one last time") at L46. Keep
> if you want her at lucky-13.

**Count:** 6 existing + 6 new = **12** (13 with `last_stamp`). ✅

---

## 4. NEW STATUSES (beyond the five being wired in §2)

| status | applies to | effect | duration | notes |
|---|---|---|---|---|
| `guarded` | hero | the next single-target hit on this ally is redirected to a decoy / negated | until consumed | Diplomatic Immunity; resolve in the enemy-targeting seam |
| `rattled` | enemy | its Offense down → its hits deal ×0.8; small skip chance | 3 turns | Stern Decree; the no-magic debuff |

Follow the STATUS CONTRACT for all of these. **Coordinate `marked` and `frozen`/
`cure` with the Milo and Mia prompts** — implement shared statuses once.

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
Her current six fx keys already exist in the registry — leave them. No
`STAGE_ANIM` changes.

---

## 6. STRATEGIC-DEPTH CHECK (a support hero that's actually a choice)

- **Force multiplier, not a passenger:** marks (`marked`/`volley_mark`) make the
  big hitters reliable and amplified; her turn *enables* a bigger party turn —
  the central support loop.
- **No-magic upkeep:** with Milo, Pippa lets the team run long dungeons without
  draining Jay/Mia's PP — a real attrition-economy lever.
- **Protect-the-caster:** `guarded`/Diplomatic Immunity answers telegraphed
  single-target boss hits — a defensive *read*, not a reflex.
- **Cross-character synergy is her identity:** Bellwether→Mia's PRAY, Focus→
  Milo's Big-Little Focus, Marks→everyone's burst. Build the combos so the player
  *discovers* them.
- **Luck flavor mechanically real:** route her accuracy/dodge math through Luck so
  her "absurdly lucky" characterization shows up in the numbers.

---

## 7. ACCEPTANCE CRITERIA

- [ ] The five existing fx-only statuses (`marked`, `rally`, `focus`, `evasion`, `morale`) are now mechanically wired (apply → effect → tick-down → wear-off line).
- [ ] New abilities in `ABILITIES` (`kind:'physical'`, `pp:0`); none scale on Vibe; fx resolve in `FX_REGISTRY` (validator both ways).
- [ ] New statuses `guarded`, `rattled` wired; `marked` shared cleanly with Milo (no collision); `cure` reused.
- [ ] `HEROES.pippa.unlocks` updated; no awakenings.
- [ ] `availableAbilities('pippa', 99, ()=>false)` returns ~12 ids (all level unlocks).
- [ ] Tests: `marked` makes a party hit unmissable + amplified; `rally` boosts Speed/Luck; `guarded` redirects a single hit; `morale` boosts the next PRAY/heal; `rattled` lowers enemy damage.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Voice: precise, diplomatic, takes herself very seriously and is *furious* when
called adorable. Battle lines read like minutes of a meeting ("Noted. Marked.
Proceed.").**
