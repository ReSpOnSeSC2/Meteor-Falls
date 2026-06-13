# PROMPT — JAY: Ability Expansion ("The Old Light, Doubled")

> **Hand this whole file to the build AI.** It is self-contained. Build only
> Jay's kit here; Mia, Milo, Dorin and Pippa have their own prompt files. Do
> not touch their data. When you finish, `npm test` and `npm run build` must
> both pass and `npm run validate` must be green.

---

## 0. ROLE

You are extending the battle/ability layer of **Meteor Falls**, an
EarthBound-style TypeScript RPG (Phaser 3 + Vite + Zod, zero binary assets —
every pixel and sound is generated procedurally). Your job: roughly **double
Jay's special abilities** (from 12 to ~24) in a way that is mechanically deep,
strategically meaningful, and story-driven. Jay is the silent psychic hero
(Ness analog). His pillars are: **Vibe Surge** (the signature nuke),
**defensive shields** for the whole party, **mind control**, and **Lifeup**.

Honor the design intent: this is not "more buttons." Every ability must create
a *real choice* at the menu — a reason to pick it over Bash, over an item, over
another spell — and the most powerful/iconic ones should arrive as **story
awakenings**, while the bread-and-butter tiers are **earned by leveling**.

---

## 1. SHARED SYSTEM FACTS (read before designing anything)

**Where things live**
- `src/data/abilities.ts` — the `ABILITIES` record. Every ability is an `AbilityDef`.
- `src/data/heroes.ts` — `HEROES[...].unlocks[]` (level → ability id). Jay's id is `'rex'` (frozen identifier; display name is "Jay").
- `src/data/awakenings.ts` — story-granted abilities (flag on the save).
- `src/battle/fxRegistry.ts` — `FX_REGISTRY` (every `fx` key) + `FX_FAMILY` list + `STAGE_ANIM` (pose per family). The validator checks this **both directions**.
- `src/battle/fx.ts` — the builders that turn an fx family into moving pixels (the `switch (family)`).
- `src/scenes/BattleScene.ts` — turn resolution, status application/tick-down, damage application.
- `src/schemas/index.ts` — Zod schemas; compile-time types are `z.infer`'d from here.

**`AbilityDef` shape (strict — no extra keys):**
```ts
{ id: string, name: string,
  kind: 'vibe' | 'gadget' | 'pray' | 'physical',
  pp: number,            // >= 0
  power: number,         // >= 0 ; damage or heal base, scaled by Vibe
  heal?: boolean,        // true = power heals instead of damages
  target: 'enemy' | 'enemies' | 'ally' | 'allies' | 'self',
  element: 'fire' | 'freeze' | 'volt' | 'holy' | 'physical' | 'none',
  status?: string,       // optional status the hit applies (see §4)
  text: string,          // battle line; {user} is filled with the display name
  fx: string }           // REQUIRED, must exist in FX_REGISTRY
```

**Damage / heal formulas (`src/battle/formulas.ts`) — design `power` against these:**
```
vibeDamage = round( power * (1 + Vibe/60) * (0.9 .. 1.1) )
vibeHeal   = round( power * (1 + Vibe/80) * (0.95 .. 1.05) )
```
Jay's Vibe grows from base 6 at ~+1.8/level, so by L40 he's ~70 Vibe → a
power-341 nuke lands ~740. Keep that in mind when you place new powers.

**Tier ladder (canon, EB-style α/β/γ/Ω ≈ 1 : 2.2 : 3.6 : 5.5).** We extend
every "5-level" line to a **fifth capstone tier, Sigma (Σ)**, sitting above
Omega. The canonical 5-rung naming for this game is **Alpha α, Beta β, Gamma γ,
Omega Ω, Sigma Σ**. Σ is the "fully powered up" pinnacle and should almost
always be a **story awakening**, not a level grind.

**Status mechanics that ALREADY exist** (reuse, don't reinvent): `shield`
(halves incoming physical, 4 turns — `BattleScene` ~L1807/1880), `mirror`
(halves AND reflects part — §A3), `asleep`, `crying`, `pp_drain`. Enemy
weaknesses are `fire | freeze | volt | insect | salt`.

**STATUS CONTRACT — read this before you invent a new status string.** A new
`status` value is inert unless you wire it. To add one you MUST:
1. Add a counter field to the hero status struct in `BattleScene.ts` (the
   `shield: number` block near L161/176/187) and to the enemy struct if it can
   land on enemies.
2. Apply it where abilities resolve (the `case 'shield':` style block ~L1264).
3. Make it *do something* at the right seam (e.g. damage mitigation ~L1807,
   the `aliveHeroes` loop, or turn-start).
4. Tick it down + print the "wears off" line in the end-of-round loop (~L1949).
5. If it should be schema-validated, add it to the relevant `z.enum` in
   `schemas/index.ts`.
Document each new status you add in a short comment block.

**Awakenings vs. level unlocks (the story/grind split — keep this ratio):**
- A **level unlock** = a row in `HEROES.rex.unlocks` `{ level, ability }`.
- An **awakening** = an entry in `AWAKENINGS` `{ id, hero:'rex', ability, flag, dialogue, toast }`, granted when a story flag flips. Needs a matching dialogue key in `src/data/dialogue.ts`.
- **VALIDATOR RULE (one path only):** an ability granted by an awakening must **not** also appear in `unlocks`. Pick one source per ability.
- **Design ratio for Jay:** of his new abilities, make **~80% level unlocks** (earned by grinding) and reserve **awakenings for the 2-3 most iconic/powerful beats** (the Surge Σ capstone, the party reflect-shield). Existing awakenings stay: `old_light` → `vibe_surge_a`, `last_spark` → `lifeup_a`.

**FX / animation system.** Each ability points at an `fx` key in
`FX_REGISTRY`, which maps to a **family** (the visual archetype) + a `tier`
(escalation) + a `ramp` (palette) + an `sfx` (procedural synth preset). The
family's builder in `fx.ts` draws it; `STAGE_ANIM[family]` decides the caster's
pose (`cast`/`aim`/`throw`/`pray`/`oncard`/`none`). Reusing an existing family
is free; a **new** family means a new `case` in `fx.ts` **and** a new row in
`STAGE_ANIM`.

---

## 2. JAY'S CURRENT KIT (baseline — do not delete, only extend/retier)

| id | name | kind | pp | power | target | element | status | fx | source |
|---|---|---|---|---|---|---|---|---|---|
| vibe_surge_a | Vibe Surge Alpha | vibe | 10 | 55 | enemy | none | — | surge_a | awakening `old_light` |
| vibe_surge_b | Vibe Surge Beta | vibe | 22 | 143 | enemy | none | — | surge_b | L18 |
| vibe_surge_g | Vibe Surge Gamma | vibe | 38 | 231 | enemies | none | — | surge_g | L31 |
| vibe_surge_o | Vibe Surge Omega | vibe | 64 | 341 | enemies | none | — | surge_o | L47 |
| lifeup_a | Lifeup Alpha | vibe | 5 | 45 | ally | none | — | lifeup | awakening `last_spark` |
| lifeup_b | Lifeup Beta | vibe | 11 | 110 | ally | none | — | lifeup | L22 |
| lifeup_g | Lifeup Gamma | vibe | 24 | 180 | allies | none | — | lifeup | L38 |
| hypno_a | Hypno Alpha | vibe | 6 | 0 | enemy | none | asleep | hypno | L10 |
| shield_a | Shield Alpha | vibe | 6 | 0 | ally | none | shield | shield_snap | L14 |
| shield_s | Shield Sigma | vibe | 18 | 0 | allies | none | shield | shield_snap | L33 |
| flash_a | Flash Alpha | vibe | 8 | 0 | enemies | none | crying | flash | L24 |
| teleport_a | Teleport Alpha | vibe | 2 | 0 | self | none | — | run_up | L26 |

> Note `shield_s` is already named "Sigma." Keep the id, but in the expanded
> shield suite below treat it as the party-wide **physical** shield; the new
> reflect/ward tiers slot around it.

---

## 3. TARGET KIT — BUILD THESE (Jay → 24 abilities)

Twelve **new** abilities across four pillars. NEW rows are flagged. Powers are
tuned to the ladder + formulas above; adjust ±10% if playtests demand, but keep
the relative spacing.

### Pillar A — Vibe Surge, now FIVE tiers with per-tier fireworks (the headline)

Jay's signature gets a true 5-rung ladder ending in a screen-filling finale.
**The animation must escalate visibly per tier, EarthBound-style** (see §5).

| id | name | pp | power | target | fx | source |
|---|---|---|---|---|---|---|
| vibe_surge_a | Vibe Surge Alpha | 10 | 55 | enemy | surge_a | awakening (existing) |
| vibe_surge_b | Vibe Surge Beta | 22 | 143 | enemy | surge_b | L18 (existing) |
| vibe_surge_g | Vibe Surge Gamma | 38 | 231 | enemies | surge_g | L31 (existing) |
| vibe_surge_o | Vibe Surge Omega | 64 | 341 | enemies | surge_o | L47 (existing) |
| **vibe_surge_x** | **Vibe Surge Sigma** | **96** | **480** | **enemies** | **surge_x (NEW)** | **awakening `the_whole_sky` (NEW)** |

- **Surge Sigma** is the capstone — hits all enemies for ~Vibe×everything,
  text: `"Otterbrook, the Embers, every porch light he ever ran home to — all of it surged through {user}!"`. Awakened late (see §6), so it lands as a *moment*, not a level-up toast.
- **Strategy:** the single-target α/β stay relevant because Surge has no element
  and ignores resistances — Jay is the answer to *elementally-immune* foes that
  shrug off Mia. Keep β cheap enough to spam mid-game; make Σ's 96 PP a real
  commitment (most of his bar) so the player chooses between one Σ and three βs.

### Pillar B — Mind control (expanded into a real control suite)

Currently just Hypno (sleep). Give Jay genuine **mind control** — turning a foe
against its allies — plus mass sleep. NEW status `puppet` (see §4).

| id | name | pp | power | target | status | fx | source |
|---|---|---|---|---|---|---|---|
| hypno_a | Hypno Alpha | 6 | 0 | enemy | asleep | hypno | L10 (existing) |
| **hypno_o** | **Hypno Omega** | **18** | 0 | **enemies** | asleep | hypno | **L29 (NEW)** |
| **mindwarp_a** | **Mind Warp Alpha** | **14** | 0 | enemy | **puppet** | **mindwarp (NEW fx)** | **L21 (NEW)** |
| **mindwarp_o** | **Mind Warp Omega** | **40** | 0 | enemy | **puppet** | mindwarp | **awakening `the_borrowed_voice` (NEW)** |

- **Mind Warp** = literal mind control: the target acts on Jay's side for
  `puppet` turns (attacks its own allies, uses its own moves against them).
  This is the iconic "Jay reaches into a mind" power. α controls one common foe
  for 1 turn; Ω (awakened) controls for 2-3 turns and can grip stronger enemies.
- **Strategy & story:** mind control trivializes group fights if uncapped, so
  bosses must carry **`mind_immune`** (a flag the build adds to boss defs — see
  §4) and elite foes resist it (% miss scaling with their level vs Jay's). This
  makes it a *crowd-control / tempo* tool against trash and mid-tier packs, not
  an "I win" button. It also pays off thematically: the Hush is mind-theft made
  cosmic, and Jay learning to *borrow* a voice (the `the_borrowed_voice` beat)
  mirrors what the villain does — staged sincerely per §A11.2.

### Pillar C — Defensive shields (buffed vs. EarthBound: protect the WHOLE party from DIFFERENT attack types)

EarthBound's PSI Shield/Power Shield only handled physical/PSI. Jay's are
upgraded into a **layered ward system**: physical shields, elemental wards, and
a reflect shield — single-target and party-wide. NEW statuses `ward` and
`reflect` (see §4).

| id | name | pp | power | target | status | fx | source |
|---|---|---|---|---|---|---|---|
| shield_a | Shield Alpha | 6 | 0 | ally | shield | shield_snap | L14 (existing) |
| shield_s | Shield Sigma (party physical) | 18 | 0 | allies | shield | shield_snap | L33 (existing) |
| **ward_a** | **Ward Alpha** | **8** | 0 | ally | **ward** | **ward_snap (NEW fx)** | **L16 (NEW)** |
| **ward_s** | **Ward Sigma** | **22** | 0 | **allies** | **ward** | ward_snap | **L36 (NEW)** |
| **powershield_a** | **Power Shield Alpha** | **14** | 0 | ally | **reflect** | **reflect_snap (NEW fx)** | **L28 (NEW)** |
| **powershield_s** | **Power Shield Sigma** | **34** | 0 | **allies** | **reflect** | reflect_snap | **awakening `the_wall_that_answers` (NEW)** |

- **`shield`** (existing) — halves incoming **physical**. Keep as-is.
- **`ward`** (NEW) — reduces incoming **elemental** (fire/freeze/volt/holy) by
  ~50%. This is the "different attacks" the user asked for: physical vs.
  elemental are separate layers, so against a fire boss you cast Ward, against a
  brawler you cast Shield, and a careful player stacks both. Lasts 4 turns.
- **`reflect`** (NEW, the buffed Power Shield) — halves incoming damage of ALL
  types AND bounces ~1/3 back at the attacker (generalize the existing `mirror`
  logic to a party-applicable status). The party-wide Σ version is an awakening
  — turning the whole team into a wall that answers is a late, earned, dramatic
  power. Lasts 3 turns (shorter because it's strong).
- **Strategy:** shields finally make a *defensive turn* worth it. Real choice:
  spend Jay's turn nuking with Surge, or fortify so Mia/Dorin survive a boss's
  telegraphed AoE. Wards/reflect counter specific boss archetypes (the Gilded
  Beetle's fire form, the Step-Mask's physical) so encounter design can *teach*
  shield usage. Cap stacking so it mitigates, never nullifies (mirror the
  existing "always leaves ≥1 damage" rule).

### Pillar D — Lifeup capstone + a clutch self-buff

| id | name | pp | power/heal | target | status | fx | source |
|---|---|---|---|---|---|---|---|
| lifeup_b | Lifeup Beta | 11 | 110 heal | ally | — | lifeup | L22 (existing) |
| lifeup_g | Lifeup Gamma | 24 | 180 heal | allies | — | lifeup | L38 (existing) |
| **lifeup_o** | **Lifeup Omega** | **40** | **320 heal** | **allies** | — | lifeup | **L46 (NEW)** |
| **resolve_a** | **Resolve** | **10** | 0 | ally | **steeled** (NEW) | **brace_snap (NEW fx)** | **L33 (NEW)** |

- **Lifeup Omega** — big party heal, so Jay can main-heal when Mia is nuking or
  down. Keeps both psychics from being forced into the medic role.
- **Resolve** (`steeled` status) — raises an ally's **Guts** (crit + survive a
  mortal blow at 1 HP) for 4 turns. A proactive, EB-flavored "don't die"
  button: cast it on Dorin before he dives in, or on Jay himself before a boss's
  big swing. Adds a buff axis the party otherwise lacks.

**New-ability count:** Pillar A +1, B +3, C +4, D +2 = **+10**… push to the full
double by also adding the two below (nice-to-have, keep if budget allows):

| id | name | pp | power | target | status | fx | source |
|---|---|---|---|---|---|---|---|
| **flash_o** | **Flash Omega** | 16 | 0 | enemies | crying | flash | **L40 (NEW)** — stronger blind, higher land rate |
| **teleport_b** | **Teleport Beta** | 4 | 0 | self/allies | — | run_up | **L34 (NEW)** — guaranteed escape + small party speed pulse next encounter |

→ **Total ≈ 24 abilities** (12 existing + 12 new). If you trim, trim the last
two first; never trim a Pillar A-C item.

---

## 4. NEW STATUSES TO IMPLEMENT (follow the STATUS CONTRACT in §1)

| status | applies to | effect | duration | notes |
|---|---|---|---|---|
| `puppet` | enemy | target acts on the party's side; on its turn it targets its own allies with its own moves | 1 turn (α) / 2-3 (Ω) | bosses get `mind_immune: true`; elites roll resist = clamp( (enemyLevel - jayLevel) × 4%, 0..85% ) to **miss** the application |
| `ward` | hero | incoming fire/freeze/volt/holy damage ×0.5 (stacks multiplicatively with gear resist, min 1) | 4 turns | mirror the `shield` plumbing exactly, but gate on `element !== 'none' && element !== 'physical'` |
| `reflect` | hero | incoming damage of all types ×0.5 **and** ~33% bounced to attacker (reuse `mirror`'s reflect path) | 3 turns | party-applicable; cap so it never zeroes a hit |
| `steeled` | hero | +Guts (e.g. +8) → raises crit and the 1-HP survive chance | 4 turns | read through `heroGuts()` as a temporary boost; don't bake into permanent `boosts` |

Add `mind_immune?: boolean` to the boss/enemy schema (`schemas/index.ts`) and
respect it in the `puppet` application. Add a short BATTLE_TEXT line for each
status's "wears off" message and wire tick-down in the end-of-round loop.

---

## 5. NEW FX — the per-tier fireworks (make Surge feel like EarthBound)

Add these keys to `FX_REGISTRY`. Surge already uses family `surge` with a
`tier` field; the **builder in `fx.ts` (`case 'surge'`) must branch on tier so
each rung is visibly its own firework**, escalating like EB's PSI Rockin':

```ts
surge_x: S({ kind:'ability', family:'surge', tier:5, ramp:RAMP.MAGENTA, sfx:'fx_surge_x' }),
mindwarp:     S({ kind:'ability', family:'spiral',  ramp:RAMP.PURPLE, sfx:'fx_mindwarp' }),   // reuse spiral pose (aim)
ward_snap:    S({ kind:'ability', family:'barrier', ramp:RAMP.GRASS,  sfx:'fx_ward' }),       // reuse barrier (cast)
reflect_snap: S({ kind:'ability', family:'barrier', ramp:RAMP.GOLD,   sfx:'fx_reflect' }),    // reuse barrier (cast)
brace_snap:   S({ kind:'ability', family:'barrier', ramp:RAMP.RED,    sfx:'fx_brace' }),       // reuse barrier (cast)
```

**Per-tier fireworks spec for `case 'surge'` in `fx.ts` (escalate, don't just scale):**
- **α (tier 1):** one tight starburst ring on the single target — a single bottle-rocket pop.
- **β (tier 2):** 2-3 staggered concentric rings + a brief screen-edge bloom.
- **γ (tier 3):** rings sweep the whole enemy row; add falling spark trails (the "willow" firework).
- **Ω (tier 4):** multi-burst volley — several rings firing in sequence across the field, palette cycling through `RAMP.MAGENTA`.
- **Σ (tier 5):** the finale — a held white flash, then a grand chrysanthemum filling the screen, sequential secondary bursts, and a slow spark-rain settle. Keep it **below the UI layer** (the odometer-law: HP wheels stay readable on top). End on a beat of quiet before damage resolves.

Only `surge_x` needs a genuinely new visual *within* the existing `surge`
family; the rest reuse `spiral`/`barrier` families (no new `STAGE_ANIM` rows).
If you prefer a dedicated reflect look, you may add a new family `reflect_field`
— but then you must also add its `case` in `fx.ts` and its `STAGE_ANIM` row.

---

## 6. AWAKENING STORY BEATS (the 3 story-granted abilities — write the dialogue keys)

Add these to `AWAKENINGS` (hero `'rex'`) with matching entries in
`dialogue.ts`. Each must **not** also appear in `unlocks`.

1. **`the_borrowed_voice` → `mindwarp_o`.** Mid-to-late game, the party reaches a
   Resonance Site where the Hush has hollowed a crowd into a single droning
   voice. To pass, Jay has to do the unthinkable — *borrow* one of those voices
   and turn it. The beat is uneasy, not triumphant: he gains true Mind Warp but
   the writing should sit with what it cost. Toast: `'{rex} learned to borrow a voice…'`
2. **`the_wall_that_answers` → `powershield_s`.** After a boss nearly wipes the
   party with an unblockable-looking AoE, Jay instinctively throws up a wall
   that *bounces it back* — saving everyone. Party-wide reflect awakens.
   Toast: `'{rex} raised the wall that answers!'`
3. **`the_whole_sky` → `vibe_surge_x`.** The Mars approach / penultimate beat:
   every porch light, every friend, the whole homeward road surges through him at
   once — Surge Sigma. The "fully powered up" moment.
   Toast: `'{rex} let the WHOLE SKY surge!'`

> Slot the actual chapter/flag for each into wherever the current story
> sequence has room (check `docs/GAME_BIBLE.md` §A2 and `src/data/chapters.ts`).
> Keep `old_light` and `last_spark` exactly as they are.

---

## 7. STRATEGIC-DEPTH CHECK (the point of all this)

Before you finalize numbers, confirm each of these *real choices* exists:
- **Nuke vs. fortify:** on a boss turn, casting Surge Ω and casting Shield/Ward
  should both be defensible — neither strictly dominates.
- **Element-blind answer:** Surge (element `none`) must out-damage Mia's
  elementals against a foe that resists everything, so Jay is the pick there.
- **Control vs. damage:** Mind Warp/Hypno trade a damage turn for tempo; they
  shine against packs and falter against bosses (immune) — so the player reads
  the encounter, not the spell list.
- **Layered defense:** Shield (physical) and Ward (elemental) are *different
  answers*; a smart player stacks them for a telegraphed combo hit.
- **PP economy:** Surge Σ at 96 PP ≈ "one big or several small" — a meaningful
  per-fight budget decision.

---

## 8. ACCEPTANCE CRITERIA

- [ ] `ABILITIES` contains all new ids; every `fx` resolves in `FX_REGISTRY` (validator green both directions).
- [ ] `HEROES.rex.unlocks` has the new level rows; awakened abilities are **not** in `unlocks` (one-path rule holds).
- [ ] New `AWAKENINGS` entries have valid `dialogue` keys that exist in `dialogue.ts`.
- [ ] New statuses (`puppet`, `ward`, `reflect`, `steeled`) are applied, mitigated/resolved, ticked down, and print a wear-off line; `mind_immune` respected by bosses.
- [ ] `case 'surge'` in `fx.ts` branches on tier 1-5 with visibly distinct fireworks; Σ stays under the UI layer.
- [ ] `availableAbilities('rex', 99, allFlagsTrue)` returns ~24 unique ids.
- [ ] Add/extend unit tests: a damage test for Surge Σ scaling, a `puppet` resolution test (puppeted enemy hits its ally; boss is immune), a `ward` mitigation test (elemental halved, physical unaffected), a `reflect` bounce test.
- [ ] `npm test`, `npm run build`, `npm run validate` all pass.

**Build it as data first (abilities + unlocks + registry), then statuses, then
the Surge fireworks, then tests. Keep every new line short, sincere, and in
Jay's voice: he barely speaks — let the light do the talking.**
