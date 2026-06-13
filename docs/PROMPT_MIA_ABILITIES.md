# PROMPT — MIA: Ability Expansion ("The Girl Who Prays, ~30 Spells")

> **Hand this whole file to the build AI.** Self-contained. Build only Mia's
> kit; the other four heroes have their own files — don't touch their data.
> Finish green: `npm test`, `npm run build`, `npm run validate`.
>
> **REWRITTEN for the S16 strategic-depth layer.** Jay's expansion ("The Old
> Light, Doubled") already shipped the shared substrate: the unified incoming-
> damage seam (`mitigateIncoming`), the `ward`/`reflect`/`steeled`/`puppet`
> statuses, **enemy-move elements**, `mind_immune` + the boss control-cap
> philosophy, the temp-boost-via-status pattern, the per-tier Σ firework
> escalation in `fx.ts`, and the awakening validator manifest. **Read §1.5
> before designing** — Mia's elemental and control work must *coordinate* with
> these seams, not duplicate them.

---

## 0. ROLE

You are extending the battle/ability layer of **Meteor Falls** (EarthBound-style
TS RPG: Phaser 3 + Vite + Zod, zero binary assets — every pixel/sound is
procedural). Mia (Paula analog, engine id **`faye`**) is **the biggest spellcaster
in the game**. Goal: grow her to **~30 distinct spells** — five full elemental
ladders plus PRAY and a small utility set — each doing something *different*,
with deep strategic trade-offs. Per the user: **add emoji flair to several of her
spell battle-lines** (🔥❄️⚡✨🧲) for personality — see the FONT CAVEAT in §5,
which you MUST implement or the emojis won't render.

She is "the girl who prays / hears the Embers sing." Her fantasy: a virtuoso who
covers every element, steals enemy magic, and channels the Embers' holy light —
balanced by **PRAY**, the high-variance faith mechanic that is canon and must not
change. **Post-S16 her elemental edge is mechanically louder than ever:** the
battle now has *layered elemental defense* (Jay's Ward), *elemental enemy
attacks*, and a *boss control-cap*, so picking the right element and the right
control window is the heart of the puzzle.

---

## 1. SHARED SYSTEM FACTS

**Where things live**
- `src/data/abilities.ts` — `ABILITIES`. `src/data/heroes.ts` —
  `HEROES.faye.unlocks[]`. Mia's id is `'faye'` (frozen; display "Mia").
- `src/data/awakenings.ts` — story-granted abilities (save flag).
- `src/battle/fxRegistry.ts` — `FX_REGISTRY` + families + `STAGE_ANIM`; validator both ways.
- `src/battle/fx.ts` — family builders (`switch (family)`).
- `src/scenes/BattleScene.ts` — turn resolution, status apply/tick, damage.
- `src/battle/formulas.ts` — pure rng-injected math (tested headlessly).
- `src/schemas/index.ts` — Zod schemas. `tools/content-validate.ts` — cross-refs + the **awakening manifest**.

**`AbilityDef` (strict):** `{ id, name, kind:'vibe'|'gadget'|'pray'|'physical',
pp>=0, power>=0, heal?, target:'enemy'|'enemies'|'ally'|'allies'|'self',
element:'fire'|'freeze'|'volt'|'holy'|'physical'|'none', status?, text, fx }`.

**Formulas:** `vibeDamage = round(power*(1+Vibe/60)*(0.9..1.1))`;
`vibeHeal = round(power*(1+Vibe/80)*(0.95..1.05))`. Mia has the **highest Vibe**
(base 8, +2.2/lvl → ~95 by L40), so keep base `power` slightly under Jay's Surge
so her *elemental* edge (weakness multiplier) is the multiplier, not raw numbers.

### 1.5 WHAT'S ALREADY LIVE — the S16 layer you coordinate with

> Shipped with Jay's expansion. **Reuse / coordinate; do not reinvent.**

- **Enemy attacks already carry `element`** (`EnemyMoveSchema.element?`, default
  `'physical'`). This is the *incoming* elemental seam — it exists so Jay's
  **Ward** can halve elemental hits via `mitigateIncoming(dmg, element,
  WardState)`. **Your job is the OUTGOING seam: the weakness/resist multiplier on
  the hero→enemy hit.** They are two different seams — do not conflate them.
  `impactKeyOf(element)` already maps every element to its impact face.
- **Boss control-cap philosophy is established.** Jay's Mind Warp (`puppet`)
  can't grip a boss — gated by `mindImmune(def)` (`EnemyDef.mind_immune?` or
  `boss`). **Mia's `frozen` (skip-turn) MUST honor the same gate:** bosses are
  capped/immune so control never trivializes a boss. Reuse `mindImmune`, or add
  a parallel cap with the identical rule — never an uncapped lock on a boss.
- **The ONE incoming-mitigation seam:** `mitigateIncoming` in `formulas.ts`
  (`{shield, ward, reflect, mirror, steeled}` → `{taken, reflected}`). You won't
  add to it, but know it: **`exposed` (Hush Hex) is its OUTGOING mirror** — a
  ×1.3 *amplifier* on damage the enemy takes. Implement `exposed` as a clean
  outgoing multiplier at `damageEnemy`, parallel to (not inside) `mitigateIncoming`.
- **Temp-boost-via-status pattern.** Resolve's `steeled` adds `STEELED_GUTS` at
  the `heroGutsS()` read seam (never baked into permanent `boosts`), ticked off
  in `statusPhase`. **`lucky` follows this exact shape:** add a `heroLuckS()`-style
  temp read (or extend the existing luck read) that adds the bonus while
  `lucky>0`. Same for any temp buff.
- **The per-tier Σ firework pattern.** Jay's Surge `case 'surge'` in `fx.ts` now
  branches **tier 1→5** with visibly distinct fireworks (α a single pop → Σ a
  held-flash chrysanthemum kept below the UI layer). **Mia's Σ tiers
  (fire_x/freeze_x/volt_x/starsong_x) must escalate the same way** — extend each
  family's builder so tier 5 is a genuine finale, not tier 4 scaled up.
- **Awakening manifest discipline (REQUIRED for her 3 awakenings).** A new
  awakening must be added to BOTH `AWAKENINGS` (with a real `dialogue` key) AND
  the pinned `canon` record in `tools/content-validate.ts` — the validator
  checks the manifest **both directions** and will fail an "ad-hoc" awakening.
  (Jay's S16 awakenings extended this record; follow the same edit.)
- **Hero/enemy statuses already live:** hero `shield/mirror/ward/reflect/steeled`
  + `sunburn/productive/crying/asleep/paralyzed/hushed`; enemy `puppet/asleep/
  crying/hushed/gilded/shield`. **Reuse `asleep` (Dreamlull), `paralyzed` (Volt),
  `pp_drain` (Magnet).** Card pips: GOOD statuses ride a tinted hex via `BustTick`
  — add `lucky`/`exposed`-on-enemy reads where it helps legibility.
- **Damage classes:** hits declare `'physical'|'vibe'|'pray'`. Mia's spells are
  `'vibe'` (and PRAY is `'pray'`). `holy` is an `element`, not a class.

**Element vs. weakness (the OUTGOING multiplier — build this if absent).** Enemy
weaknesses are `fire | freeze | volt | insect | salt`. Hitting a weakness must
multiply damage (**~×1.5 weak, ~×0.5 resist, leaving ≥1**) on the hero→enemy
seam in `damageEnemy`/`castAbility`. There is already a partial `applyWeakness`
(×1.5) for fire/freeze/volt — **extend it to a full weak/resist multiplier and
make `holy` pierce a slice of resistance** (the Embers' light is the Hush's bane;
give Hush/undead-style foes a `holy` weakness). This multiplier is the core
reason Mia has five elements — the right element is a *choice*, not flavor, and
post-S16 it's also the answer the Ward system can't take away from her.

**Tier ladder.** α/β/γ/Ω ≈ 1:2.2:3.6:5.5; add a 5th capstone **Sigma (Σ)** above
Ω. Naming: **Alpha α, Beta β, Gamma γ, Omega Ω, Sigma Σ.** Capstones are usually awakenings.

**Awakenings vs level unlocks.** Keep **MOST** spells as level unlocks (she's a
grind-and-learn virtuoso); reserve awakenings for ~3 iconic beats. Existing stay:
`first_listen` → `vibe_fire_a`, `cold_reads` → `vibe_freeze_a`. **One-path rule:**
an awakened ability must not also be in `unlocks`.

---

## 2. MIA'S CURRENT KIT (baseline — extend, don't delete)

| id | name | pp | power | target | element | status | fx | source |
|---|---|---|---|---|---|---|---|---|
| pray | Pray | 0 | 0 | allies | holy | — | pray | L1 (innate) |
| vibe_fire_a/b/g/o | Vibe Fire α/β/γ/Ω | 6/14/28/49 | 48/125/202/298 | enemy→enemies | fire | — | fire_a..o | awk `first_listen` (α) + L17/29/44 |
| vibe_freeze_a/b/g/o | Vibe Freeze α/β/γ/Ω | 7/15/30/52 | 52/114/187/286 | enemy | freeze | — | freeze_a..o | awk `cold_reads` (α) + L24/32/46 |
| vibe_volt_a/b/g | Vibe Volt α/β/γ | 9/19/36 | 58/128/209 | enemy→enemies | volt | — | volt_a..g | L20/26/40 |
| magnet_a | Magnet Alpha | 3 | 0 | enemy | none | pp_drain | magnet | L15 |

That's 13. We're going to ~30.

---

## 3. TARGET KIT — BUILD THESE (Mia → ~30 spells)

Five complete ladders + PRAY + four utility spells. NEW rows flagged. Several
`text` lines carry **emojis** (see §5 caveat).

### Ladder 1 — FIRE 🔥 (5 tiers; single→AoE; applies `burn`)

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| vibe_fire_a | Vibe Fire Alpha | 6 | 48 | enemy | — | fire_a | awk (existing) | `{user} snapped her fingers — FWOOSH! 🔥` |
| vibe_fire_b | Vibe Fire Beta | 14 | 125 | enemies | — | fire_b | L17 | `{user} snapped her fingers — FWOOSH! 🔥🔥` |
| vibe_fire_g | Vibe Fire Gamma | 28 | 202 | enemies | **burn** | fire_g | L29 | `The air itself caught! 🔥🔥🔥` |
| vibe_fire_o | Vibe Fire Omega | 49 | 298 | enemies | **burn** | fire_o | L44 | `The air itself caught!` |
| **vibe_fire_x** | **Vibe Fire Sigma** | **78** | **430** | **enemies** | **burn** | **fire_x (NEW, tier 5)** | **awakening `the_match_that_stays_lit` (NEW)** | `🔥 The whole sky went orange — and stayed. 🔥` |

- `burn` (NEW): small fire DoT at end of the burned foe's turn (~6% max HP, min
  4), 3 turns. γ+ apply it. Fire's "stack damage over time" identity vs Freeze's
  control. **Stacks with `exposed`** (burned + exposed = the chip-and-amplify combo).

### Ladder 2 — FREEZE ❄️ (5 tiers; control element; applies `frozen`)

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| vibe_freeze_a | Vibe Freeze Alpha | 7 | 52 | enemy | — | freeze_a | awk (existing) | `{user} exhaled winter! ❄️` |
| vibe_freeze_b | Vibe Freeze Beta | 15 | 114 | enemy | — | freeze_b | L24 | `{user} exhaled winter! ❄️❄️` |
| vibe_freeze_g | Vibe Freeze Gamma | 30 | 187 | enemy | **frozen** | freeze_g | L32 | `Absolute zero, with feeling! ❄️` |
| vibe_freeze_o | Vibe Freeze Omega | 52 | 286 | enemy | **frozen** | freeze_o | L46 | `Absolute zero, with feeling!` |
| **vibe_freeze_x** | **Vibe Freeze Sigma** | **80** | **405** | **enemies** | **frozen** | **freeze_x (NEW)** | **L52 (NEW)** | `❄️ She breathed, and the whole room held still. ❄️` |

- `frozen` (NEW): target skips its next turn, chance by tier (γ~40% / Ω~55% /
  Σ~70%), 1 turn. **Bosses capped/immune via the LIVE `mindImmune` philosophy** —
  reuse that gate so Freeze control mirrors Jay's puppet-control rules exactly.
  **Shared with Milo's Cryo Grenade** — implement `frozen` ONCE; whoever ships
  first builds the field + apply + skip-roll + wear-off, the other reuses it.

### Ladder 3 — VOLT ⚡ (extend 3 → 5 tiers; AoE + `paralyzed`)

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| vibe_volt_a | Vibe Volt Alpha | 9 | 58 | enemy | — | volt_a | L20 | `{user} pointed at the sky! ⚡` |
| vibe_volt_b | Vibe Volt Beta | 19 | 128 | enemies | — | volt_b | L26 | `{user} pointed at the sky! ⚡⚡` |
| vibe_volt_g | Vibe Volt Gamma | 36 | 209 | enemies | **paralyzed** | volt_g | L40 | `The sky answered! ⚡` |
| **vibe_volt_o** | **Vibe Volt Omega** | **55** | **300** | **enemies** | **paralyzed** | **volt_o (NEW)** | **L47 (NEW)** | `The sky answered — and kept answering!` |
| **vibe_volt_x** | **Vibe Volt Sigma** | **82** | **420** | **enemies** | **paralyzed** | **volt_x (NEW)** | **L52 (NEW)** | `⚡ Every hair on every arm stood up at once. ⚡` |

- `paralyzed` already exists (enemy) — reuse. Volt = AoE + disruption, the
  "answer to fast packs." **Boss-cap the paralyze** like every other control.

### Ladder 4 — PP STEAL 🧲 (NEW LINE, 5 tiers — Mia drains enemy magic)

element `none`, family `siphon`. Builds on `magnet_a`.

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| magnet_a | Magnet Alpha | 3 | 0 | enemy | pp_drain | magnet | L15 (existing) | `{user} held out her palm! 🧲` |
| **magnet_b** | **Magnet Beta** | **6** | 0 | enemy | **pp_drain** | magnet | **L22 (NEW)** | `{user} pulled harder — 🧲💜` |
| **magnet_g** | **Magnet Gamma** | **10** | 0 | enemies | **pp_drain** | magnet | **L31 (NEW)** | `She drew the magic out of the whole room! 🧲` |
| **magnet_o** | **Magnet Omega** | **16** | 0 | enemy | **lifedrain** | magnet | **L42 (NEW)** | `🧲 She took the spark AND the warmth. 💜` |
| **magnet_x** | **Magnet Sigma** | **24** | 0 | enemies | **lifedrain** | magnet | **awakening `she_hears_it_all` (NEW)** | `🧲💜 Every Ember in earshot leaned toward her. 💜🧲` |

- `pp_drain` (existing): enemy PP → Mia, scaling with tier. `lifedrain` (NEW):
  drain HP → Mia too (Ω single, Σ AoE). Makes her partly self-sufficient — but a
  drain turn is *not a nuke turn*, the trade.
- **Economy synergy (post-S16):** Mia's drain, **Jay's puppet-kill PP refund**,
  and **Milo's 0-PP toolbox** together form the party's "keep the lights on"
  attrition economy. PP-steal answers caster enemies and long Hush grinds; it's
  the pressure valve that lets a careful party keep casting Σ-tier spells.

### Ladder 5 — STARSONG ✨ (NEW LINE, 5 tiers — holy light, the anti-Hush element)

`element: 'holy'` — **pierces a slice of resistance** (build this into the
weak/resist multiplier), extra effective vs Hush/undead-style foes (give those a
`holy` weakness). New family `starsong` (or reuse `comet` sparkle). Ties straight
into the Homesong endgame.

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| **starsong_a** | **Starsong Alpha** | 8 | 56 | enemy | — | **starsong_a (NEW)** | **awakening `the_first_heartlight` (NEW)** | `{user} hummed a note the dark couldn't eat. ✨` |
| **starsong_b** | **Starsong Beta** | 17 | 132 | enemies | — | starsong_b | **L30 (NEW)** | `✨ The note spread, warm and gold. ✨` |
| **starsong_g** | **Starsong Gamma** | 30 | 210 | enemies | — | starsong_g | **L38 (NEW)** | `Every Ember she'd ever heard answered. 🌟` |
| **starsong_o** | **Starsong Omega** | 50 | 300 | enemies | — | starsong_o | **L48 (NEW)** | `The Homesong, one verse of it, let loose. ✨🌟` |
| **starsong_x** | **Starsong Sigma** | 84 | 440 | enemies | — | starsong_x | **L52 (NEW)** | `🌟✨ She sang, and for a moment the Hush remembered being light. ✨🌟` |

### PRAY (innate — DO NOT CHANGE the table)

| pray | Pray | 0 | 0 | allies | holy | — | pray | L1 |

Keep the six-tier PRAY weights/rolls/text exactly as canon (`abilities.ts`
`PRAY_*`). It's her wildcard identity. **Cross-synergy:** Pippa's **`morale`**
(Bellwether) is allowed to nudge the next PRAY's tier odds — coordinate so a
`morale`-buffed PRAY reads its boost where `rollPray` is called.

### Utility (4 spells — round to ~30, non-damage choices)

| id | name | pp | power/heal | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| **heartmend_a** | **Heartmend** | 12 | 160 heal | ally | — | lifeup (reuse) | **L27 (NEW)** | `{user} pressed a warm hand to a hurt. 💛` — a *reliable* heal so she isn't hostage to PRAY's RNG |
| **lucky_star** | **Lucky Star** | 10 | 0 | allies | **lucky** (NEW) | starsong_a (reuse) | **L34 (NEW)** | `{user} wished on the first star out. 🍀⭐` — party Luck/crit up 4 turns |
| **hush_hex** | **Hush Hex** | 14 | 0 | enemies | **exposed** (NEW) | wire_cross (reuse) | **L36 (NEW)** | `{user} named the hollow in them.` — incoming damage ×1.3 for 4 turns |
| **dreamlull** | **Dreamlull** | 12 | 0 | enemies | asleep (reuse) | hypno (reuse) | **L25 (NEW)** | `{user} hummed the lullaby Mom used. 🌙` — mass sleep (lower land rate than single Hypno) |

**Count:** Fire 5 + Freeze 5 + Volt 5 + PP-steal 5 + Starsong 5 + Pray 1 +
Utility 4 = **30 spells.** ✅

---

## 4. NEW STATUSES (STATUS CONTRACT in §1.5)

| status | applies to | live? | effect | duration | notes |
|---|---|---|---|---|---|
| `burn` | enemy | NEW | DoT ~6% max HP (min 4) at end of its turn | 3 turns | Fire γ+; small flame tick fx; stacks with `exposed` |
| `frozen` | enemy | **NEW — shared w/ Milo** | skip next turn, chance by tier (γ40/Ω55/Σ70%); **boss-capped via `mindImmune` philosophy** | 1 turn | reuse `paralyzed` plumbing if simpler; ONE implementation |
| `lifedrain` | (effect) | NEW | on hit, heal Mia for a fraction of PP+HP drained | instant | Magnet Ω/Σ |
| `lucky` | hero | NEW | +Luck (raises crit/SMAAASH and dodge) | 4 turns | Lucky Star; temp boost via the **`steeled` pattern** (read at the luck seam, tick in `statusPhase`) |
| `exposed` | enemy | NEW | incoming damage ×1.3 | 4 turns | Hush Hex; the party's universal focus-this-target enabler. Outgoing multiplier at `damageEnemy`, **stacks with `marked`** (Milo/Pippa) |

`pp_drain`, `paralyzed`, `asleep` already exist — reuse. Add wear-off lines +
tick-down for the new lingering ones (`burn`, `lucky`, `exposed`) and the card
pips where visible.

---

## 5. EMOJI FLAIR — FONT CAVEAT (must implement or emojis show as blanks)

The game draws its **own procedural bitmap font** (`src/spritegen/font.ts`) with
zero binary assets — no emoji glyphs, so 🔥❄️⚡ render as tofu unless you:

**Option A (recommended) — author tiny pixel "emoji" glyphs.** Add a small set of
font-height sprites for the handful used (🔥 ❄️ ⚡ ✨ 🌟 🧲 💜 💛 🍀 ⭐ 🌙) to the
spritegen font/icon system, and a tokenizer in `src/ui/text.ts` that swaps the
literal codepoint for the glyph at draw time. Store the real codepoint in `text`;
map codepoint → glyph at render. Keeps zero-binary-assets intact (glyphs are
code-drawn) and looks intentional/retro.

**Option B —** restrict to font-drawable symbols. Less fun; use only if A is out
of scope.

Pick A. Add a `characters.test.ts`/`text.test.ts` case asserting each used emoji
codepoint resolves to a glyph (no tofu). **Do not ship literal emojis in `text`
without the glyph map** — that's the one way this visibly breaks.

---

## 6. NEW FX KEYS

```ts
// extend existing families by tier — and MAKE TIER 5 A FINALE (copy the S16
// surge tier-1→5 escalation pattern in fx.ts; don't just scale tier 4):
fire_x:   S({ kind:'ability', family:'flame_wave', tier:5, ramp:RAMP.ORANGE, sfx:'fx_fire' }),
freeze_x: S({ kind:'ability', family:'lattice',    tier:5, ramp:RAMP.CYAN,   sfx:'fx_freeze' }),
volt_o:   S({ kind:'ability', family:'bolt',       tier:4, ramp:RAMP.GOLD,   sfx:'fx_volt' }),
volt_x:   S({ kind:'ability', family:'bolt',       tier:5, ramp:RAMP.GOLD,   sfx:'fx_volt' }),
// Starsong: NEW family recommended (warm gold notes rising into bursting stars):
starsong_a: S({ kind:'ability', family:'starsong', tier:1, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_b: S({ kind:'ability', family:'starsong', tier:2, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_g: S({ kind:'ability', family:'starsong', tier:3, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_o: S({ kind:'ability', family:'starsong', tier:4, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_x: S({ kind:'ability', family:'starsong', tier:5, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
```
If you add family `starsong`, add a `case 'starsong'` in `fx.ts` + a
`STAGE_ANIM` row (`starsong: 'cast'`) + a `fx_starsong` audio preset. Otherwise
point those keys at `family:'comet'`. Confirm `flame_wave`/`lattice`/`bolt`
builders handle `tier:4/5` (the S16 surge work proves the pattern).

---

## 7. AWAKENING STORY BEATS (3 story-granted; write dialogue keys; not in `unlocks`)

> **Remember the manifest step (§1.5):** add each to `AWAKENINGS` AND the `canon`
> record in `tools/content-validate.ts`, or the validator fails it as ad-hoc.

1. **`the_first_heartlight` → `starsong_a`.** When Mia records the first
   Heartlight at a Resonance Site, the Embers' note becomes something she can
   *sing back* — Starsong α awakens. Opens her holy/anti-Hush line.
   Toast: `'{faye} awakened STARSONG Alpha! ✨'`
2. **`the_match_that_stays_lit` → `vibe_fire_x`.** Late beat where she finally
   makes a flame the Hush can't smother — Fire Sigma.
   Toast: `'{faye} awakened VIBE FIRE Sigma! 🔥'`
3. **`she_hears_it_all` → `magnet_x`.** She hears every corrupted Ember at once
   and pulls the song back out of a whole field — Magnet Sigma.
   Toast: `'{faye} awakened MAGNET Sigma! 🧲'`

Keep `first_listen` and `cold_reads` exactly as they are.

---

## 8. STRATEGIC-DEPTH CHECK (why 30 spells, not 30 reskins)

- **Element matters more post-S16:** the weak/resist multiplier means choosing
  Fire vs Freeze vs Volt vs Starsong per enemy is the core puzzle; no element
  dominates. Starsong's `holy` pierce is her dedicated anti-Hush answer.
- **Identity per element:** Fire = AoE + `burn` DoT; Freeze = single-target
  lockdown (`frozen`, boss-capped); Volt = AoE disruption (`paralyzed`);
  Starsong = holy pierce + anti-Hush; PP-steal = attrition/economy + self-sustain.
- **Control respects the boss-cap.** Her `frozen`/`paralyzed` follow the exact
  rule Jay's `puppet` does — devastating on packs, capped on bosses. Reading the
  encounter (cap or not) is the skill, same as the rest of the live kit.
- **Force-multiplier turns:** `exposed` (Hush Hex) and `lucky` (Lucky Star) turn
  Mia into a party amplifier — and `exposed` **stacks multiplicatively with
  Milo/Pippa `marked`**, so a coordinated focus-fire turn is the party's biggest
  spike. A non-nuke turn that's worth taking.
- **PRAY tension + economy:** guaranteed tools (Heartmend, the ladders) vs PRAY's
  swing; Σ spells (~78–84 PP) are once-a-fight, and her drain line + Jay's
  puppet-refund + Milo's 0-PP are the valves that keep a careful party casting.

---

## 9. ACCEPTANCE CRITERIA

- [ ] `ABILITIES` has all ~30 ids; every `fx` resolves in `FX_REGISTRY` (validator both ways).
- [ ] `HEROES.faye.unlocks` updated; awakened abilities not in `unlocks`; **awakenings added to the `tools/content-validate.ts` `canon` manifest**; PRAY table unchanged.
- [ ] New `AWAKENINGS` (`faye`) have real `dialogue` keys.
- [ ] Weak/resist multiplier exists on the hero→enemy seam (×1.5 weak / ×0.5 resist, ≥1); `holy` pierces a slice of resist. (Distinct from the incoming `mitigateIncoming` seam — don't duplicate it.)
- [ ] New statuses (`burn`, `frozen`, `lucky`, `exposed`, `lifedrain` effect) apply, resolve, tick down, print wear-off lines; `frozen` boss-capped via `mindImmune`; `frozen` shared once with Milo.
- [ ] `exposed` stacks multiplicatively with `marked`; `lucky` uses the `steeled` temp-boost pattern.
- [ ] **Emoji glyph map implemented** (§5 Option A); a test asserts every used emoji codepoint resolves to a drawn glyph (no tofu).
- [ ] `availableAbilities('faye', 99, allFlagsTrue)` returns ~30 unique ids.
- [ ] Tests: weakness-multiplier damage; `burn` DoT; `frozen` skip-turn (+ boss cap); `pp_drain`/`lifedrain` transfer; `exposed`×`marked` stack; emoji-glyph.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Build order: data (abilities + unlocks + registry) → weak/resist multiplier →
new statuses (coordinate `frozen` with Milo) → emoji glyph system → Starsong fx
(tier-5 finale) → tests. Keep her voice kind and steel-spined; the emojis are
sparkle, not noise — use them on the lines that already feel like a flourish.**
