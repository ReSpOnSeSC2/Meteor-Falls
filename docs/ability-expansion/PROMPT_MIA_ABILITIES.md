# PROMPT — MIA: Ability Expansion ("The Girl Who Prays, ~30 Spells")

> **Hand this whole file to the build AI.** Self-contained. Build only Mia's
> kit; the other four heroes have their own files — don't touch their data.
> Finish green: `npm test`, `npm run build`, `npm run validate`.

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
change.

---

## 1. SHARED SYSTEM FACTS

**Where things live**
- `src/data/abilities.ts` — `ABILITIES` (each is an `AbilityDef`).
- `src/data/heroes.ts` — `HEROES.faye.unlocks[]` (`{ level, ability }`). Mia's id is `'faye'` (frozen; display name "Mia").
- `src/data/awakenings.ts` — story-granted abilities (save flag).
- `src/battle/fxRegistry.ts` — `FX_REGISTRY` + families + `STAGE_ANIM`; validator checks both directions.
- `src/battle/fx.ts` — family builders (`switch (family)`).
- `src/scenes/BattleScene.ts` — turn resolution, status apply/tick, damage.
- `src/schemas/index.ts` — Zod schemas.

**`AbilityDef` shape (strict):**
```ts
{ id, name, kind:'vibe'|'gadget'|'pray'|'physical', pp>=0, power>=0,
  heal?:boolean, target:'enemy'|'enemies'|'ally'|'allies'|'self',
  element:'fire'|'freeze'|'volt'|'holy'|'physical'|'none', status?:string,
  text, fx /* must exist in FX_REGISTRY */ }
```

**Formulas (`formulas.ts`) — tune `power` against these:**
```
vibeDamage = round( power * (1 + Vibe/60) * (0.9 .. 1.1) )
vibeHeal   = round( power * (1 + Vibe/80) * (0.95 .. 1.05) )
```
Mia has the **highest Vibe in the game** (base 8, +2.2/level → ~95 by L40), so
her per-point damage is largest — keep base `power` slightly under Jay's Surge so
her *elemental* edge (hitting weaknesses) is the multiplier, not raw numbers.

**Element vs. weakness.** Enemy weaknesses are `fire | freeze | volt | insect |
salt`. Hitting a weakness should multiply damage (if the build doesn't yet apply
an elemental multiplier on the hero→enemy seam, **add one**: ~×1.5 on weakness,
~×0.5 on resist, leaving ≥1). This is the core reason Mia has five elements — the
right element is a *choice*, not flavor. `holy` should pierce a slice of
resistance (the Embers' light is the Hush's bane).

**Tier ladder.** Canon α/β/γ/Ω ≈ 1 : 2.2 : 3.6 : 5.5; we add a 5th capstone
**Sigma (Σ)** above Omega for the "fully powered up" rung. 5-rung naming:
**Alpha α, Beta β, Gamma γ, Omega Ω, Sigma Σ.** Capstones are usually awakenings.

**STATUS CONTRACT** (before inventing a status): add a counter to the
hero/enemy status struct in `BattleScene.ts`, apply it where abilities resolve,
make it *do something* at the right seam, tick it down + print a wear-off line,
and add to the schema `z.enum` if validated. Existing statuses to reuse:
`asleep`, `crying`, `paralyzed`, `pp_drain`, `shield`. `frozen` and `burn` are
NEW (see §4).

**Awakenings vs level unlocks (story/grind split).** Level unlock = row in
`unlocks`. Awakening = entry in `AWAKENINGS` (`hero:'faye'`, with `flag`,
`dialogue`, `toast`) + a dialogue key. **One-path rule:** an awakened ability must
not also be in `unlocks`. **For Mia, keep MOST spells as level unlocks** (she's a
grind-and-learn virtuoso) and reserve awakenings for ~3 iconic beats (first
flame, the holy Starsong line, the Sigma capstone). Existing awakenings stay:
`first_listen` → `vibe_fire_a`, `cold_reads` → `vibe_freeze_a`.

**FX system.** `fx` key → family (visual) + tier + ramp + sfx. Reusing a family
is free; a new family = new `case` in `fx.ts` + new `STAGE_ANIM` row. Mia's
existing families: `flame_wave` (fire), `lattice` (freeze), `bolt` (volt),
`siphon` (magnet), `pray`.

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

### Ladder 1 — FIRE 🔥 (5 tiers; single→AoE; can apply `burn`)

| id | name | pp | power | target | status | fx | source | text (emoji) |
|---|---|---|---|---|---|---|---|---|
| vibe_fire_a | Vibe Fire Alpha | 6 | 48 | enemy | — | fire_a | awk (existing) | `{user} snapped her fingers — FWOOSH! 🔥` |
| vibe_fire_b | Vibe Fire Beta | 14 | 125 | enemies | — | fire_b | L17 | `{user} snapped her fingers — FWOOSH! 🔥🔥` |
| vibe_fire_g | Vibe Fire Gamma | 28 | 202 | enemies | **burn** | fire_g | L29 | `The air itself caught! 🔥🔥🔥` |
| vibe_fire_o | Vibe Fire Omega | 49 | 298 | enemies | **burn** | fire_o | L44 | `The air itself caught!` |
| **vibe_fire_x** | **Vibe Fire Sigma** | **78** | **430** | **enemies** | **burn** | **fire_x (NEW, tier 5)** | **awakening `the_match_that_stays_lit` (NEW)** | `🔥 The whole sky went orange — and stayed. 🔥` |

- `burn` (NEW): small fire DoT at end of the burned foe's turn (~6% max HP, min
  4), 3 turns. γ+ apply it. Gives Fire a "stack damage over time" identity vs.
  Freeze's control.

### Ladder 2 — FREEZE ❄️ (5 tiers; control element; can apply `frozen`)

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| vibe_freeze_a | Vibe Freeze Alpha | 7 | 52 | enemy | — | freeze_a | awk (existing) | `{user} exhaled winter! ❄️` |
| vibe_freeze_b | Vibe Freeze Beta | 15 | 114 | enemy | — | freeze_b | L24 | `{user} exhaled winter! ❄️❄️` |
| vibe_freeze_g | Vibe Freeze Gamma | 30 | 187 | enemy | **frozen** | freeze_g | L32 | `Absolute zero, with feeling! ❄️` |
| vibe_freeze_o | Vibe Freeze Omega | 52 | 286 | enemy | **frozen** | freeze_o | L46 | `Absolute zero, with feeling!` |
| **vibe_freeze_x** | **Vibe Freeze Sigma** | **80** | **405** | **enemies** | **frozen** | **freeze_x (NEW)** | **L52 (NEW)** | `❄️ She breathed, and the whole room held still. ❄️` |

- `frozen` (NEW): target skips its next turn (chance-based, γ ~40% / Ω ~55% / Σ
  ~70%; bosses get a hard cap or immunity), 1 turn. Freeze = single-target lockdown
  until Σ goes AoE. Strategic counterpoint to Fire's AoE-DoT.

### Ladder 3 — VOLT ⚡ (extend 3 → 5 tiers; AoE + `paralyzed`)

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| vibe_volt_a | Vibe Volt Alpha | 9 | 58 | enemy | — | volt_a | L20 | `{user} pointed at the sky! ⚡` |
| vibe_volt_b | Vibe Volt Beta | 19 | 128 | enemies | — | volt_b | L26 | `{user} pointed at the sky! ⚡⚡` |
| vibe_volt_g | Vibe Volt Gamma | 36 | 209 | enemies | **paralyzed** | volt_g | L40 | `The sky answered! ⚡` |
| **vibe_volt_o** | **Vibe Volt Omega** | **55** | **300** | **enemies** | **paralyzed** | **volt_o (NEW)** | **L47 (NEW)** | `The sky answered — and kept answering!` |
| **vibe_volt_x** | **Vibe Volt Sigma** | **82** | **420** | **enemies** | **paralyzed** | **volt_x (NEW)** | **L52 (NEW)** | `⚡ Every hair on every arm stood up at once. ⚡` |

- `paralyzed` already exists in the enemy status enum — reuse it (skip-turn /
  reduced action). Volt = AoE + disruption; the "answer to fast packs."

### Ladder 4 — PP STEAL 🧲 (NEW LINE, 5 tiers — Mia drains enemy magic)

Her signature support-offense. Builds on `magnet_a`. NEW status concept: at high
tiers, also drain HP back to Mia. element `none`, family `siphon`.

| id | name | pp | power | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| magnet_a | Magnet Alpha | 3 | 0 | enemy | pp_drain | magnet | L15 (existing) | `{user} held out her palm! 🧲` |
| **magnet_b** | **Magnet Beta** | **6** | 0 | enemy | **pp_drain** | magnet | **L22 (NEW)** | `{user} pulled harder — 🧲💜` |
| **magnet_g** | **Magnet Gamma** | **10** | 0 | enemies | **pp_drain** | magnet | **L31 (NEW)** | `She drew the magic out of the whole room! 🧲` |
| **magnet_o** | **Magnet Omega** | **16** | 0 | enemy | **lifedrain** | magnet | **L42 (NEW)** | `🧲 She took the spark AND the warmth. 💜` |
| **magnet_x** | **Magnet Sigma** | **24** | 0 | enemies | **lifedrain** | magnet | **awakening `she_hears_it_all` (NEW)** | `🧲💜 Every Ember in earshot leaned toward her. 💜🧲` |

- `pp_drain` (existing): transfer enemy PP → Mia, scaling with tier (α small … γ
  room-wide). `lifedrain` (NEW): drain HP → Mia too (Ω single, Σ AoE). Makes Mia
  partly self-sufficient on PP/HP so she can keep casting — but draining is a
  *turn spent not nuking*, the trade-off.
- **Strategy & story:** PP-steal answers PP-hungry caster enemies and long
  attrition fights (the Hush wears you down). Thematically she "hears the Embers
  sing" — pulling the song *back* out of corrupted things is core to her arc.

### Ladder 5 — STARSONG ✨ (NEW LINE, 5 tiers — holy light, the Embers made into a weapon)

`element: 'holy'` — pierces a slice of resistance, extra effective vs. Hush /
undead-style foes (give those a `holy` weakness). Family: a new `starsong`
look (or reuse `comet`/`pray_event` sparkle). This is her "anti-Hush" element
and ties straight into the Homesong endgame.

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
`PRAY_*`). It's her wildcard identity.

### Utility (4 spells — round her to ~30 and give non-damage choices)

| id | name | pp | power/heal | target | status | fx | source | text |
|---|---|---|---|---|---|---|---|---|
| **heartmend_a** | **Heartmend** | 12 | 160 heal | ally | — | lifeup (reuse) | **L27 (NEW)** | `{user} pressed a warm hand to a hurt. 💛` — a *reliable* heal so she isn't hostage to PRAY's RNG |
| **lucky_star** | **Lucky Star** | 10 | 0 | allies | **lucky** (NEW) | starsong_a (reuse) | **L34 (NEW)** | `{user} wished on the first star out. 🍀⭐` — party Luck/crit up 4 turns |
| **hush_hex** | **Hush Hex** | 14 | 0 | enemies | **exposed** (NEW) | wire_cross (reuse) | **L36 (NEW)** | `{user} named the hollow in them.` — enemy Defense down (incoming damage ×1.3) 4 turns |
| **dreamlull** | **Dreamlull** | 12 | 0 | enemies | asleep (reuse) | hypno (reuse) | **L25 (NEW)** | `{user} hummed the lullaby Mom used. 🌙` — mass sleep (lower land rate than single Hypno) |

**Count:** Fire 5 + Freeze 5 + Volt 5 + PP-steal 5 + Starsong 5 + Pray 1 +
Utility 4 = **30 spells.** ✅

---

## 4. NEW STATUSES TO IMPLEMENT (STATUS CONTRACT in §1)

| status | applies to | effect | duration | notes |
|---|---|---|---|---|
| `burn` | enemy | DoT ~6% max HP (min 4) at end of its turn | 3 turns | Fire γ+; show a small flame tick fx |
| `frozen` | enemy | skip next turn, chance by tier (γ40/Ω55/Σ70%); bosses capped/immune | 1 turn | Freeze γ+; reuse `paralyzed` plumbing if simpler |
| `lifedrain` | (effect, not a lingering status) | on hit, heal Mia for a fraction of PP+HP drained | instant | Magnet Ω/Σ |
| `lucky` | hero | +Luck (raises crit/SMAAASH and dodge) | 4 turns | Lucky Star; read through `heroLuck()` as temp boost |
| `exposed` | enemy | incoming damage ×1.3 | 4 turns | Hush Hex; the party's universal "focus this target" enabler |

`pp_drain` and `paralyzed` and `asleep` already exist — reuse. Add wear-off
lines and tick-down for the new lingering ones (`burn`, `lucky`, `exposed`).

---

## 5. EMOJI FLAIR — FONT CAVEAT (must implement or emojis show as blanks)

The game draws its **own procedural bitmap font** (`src/spritegen/font.ts`) with
zero binary assets — it has no emoji glyphs, so 🔥❄️⚡ will render as tofu/blank
unless you do one of:

**Option A (recommended) — author tiny pixel "emoji" glyphs.** Add a small set
of 8×8 (or font-height) sprites for the handful of emojis used (🔥 ❄️ ⚡ ✨ 🌟 🧲
💜 💛 🍀 ⭐ 🌙) to the spritegen font/icon system, and a tokenizer in the battle
text renderer (`src/ui/text.ts`) that swaps `:fire:` / the literal emoji
codepoint for the glyph mid-line. Store the emoji in `text` as the real
codepoint; map codepoint → glyph at draw time. This keeps zero-binary-assets
intact (the glyphs are code-drawn) and looks intentional/retro.

**Option B — restrict emojis to an ASCII-safe stand-in** (e.g. the renderer
already supports the font's symbol set) and only use codepoints the font can
draw. Less fun; use only if A is out of scope.

Pick A. Add a `characters.test.ts`/`text.test.ts` case asserting each used
emoji codepoint resolves to a glyph (no tofu). **Do not ship literal emojis in
`text` without the glyph map** — that's the one way this feature visibly breaks.

---

## 6. NEW FX KEYS

```ts
// extend existing families by tier (fx.ts builders already escalate on tier):
fire_x:   S({ kind:'ability', family:'flame_wave', tier:5, ramp:RAMP.ORANGE, sfx:'fx_fire' }),
freeze_x: S({ kind:'ability', family:'lattice',    tier:5, ramp:RAMP.CYAN,   sfx:'fx_freeze' }),
volt_o:   S({ kind:'ability', family:'bolt',       tier:4, ramp:RAMP.GOLD,   sfx:'fx_volt' }),
volt_x:   S({ kind:'ability', family:'bolt',       tier:5, ramp:RAMP.GOLD,   sfx:'fx_volt' }),
// Starsong: new family OR reuse comet's sparkle. New family recommended:
starsong_a: S({ kind:'ability', family:'starsong', tier:1, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_b: S({ kind:'ability', family:'starsong', tier:2, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_g: S({ kind:'ability', family:'starsong', tier:3, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_o: S({ kind:'ability', family:'starsong', tier:4, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
starsong_x: S({ kind:'ability', family:'starsong', tier:5, ramp:RAMP.GOLD, sfx:'fx_starsong' }),
```
If you add family `starsong`, add a `case 'starsong'` in `fx.ts` (warm gold
notes rising into bursting stars, escalating per tier) and a `STAGE_ANIM`
row (`starsong: 'cast'`). Otherwise set those keys to `family:'comet'`.
Make sure `fire`/`freeze`/`bolt` builders handle `tier:4/5` (extend if capped at 3-4).

---

## 7. AWAKENING STORY BEATS (3 story-granted; write dialogue keys; not in `unlocks`)

1. **`the_first_heartlight` → `starsong_a`.** When Mia records the first
   Heartlight at a Resonance Site, the Embers' note becomes something she can
   *sing back* — Starsong α awakens. Opens her holy/anti-Hush line.
   Toast: `'{faye} awakened STARSONG Alpha! ✨'`
2. **`the_match_that_stays_lit` → `vibe_fire_x`.** Late beat where she finally
   makes a flame the Hush can't smother — Fire Sigma.
   Toast: `'{faye} awakened VIBE FIRE Sigma! 🔥'`
3. **`she_hears_it_all` → `magnet_x`.** A moment where she hears every corrupted
   Ember at once and pulls the song back out of a whole field — Magnet Sigma.
   Toast: `'{faye} awakened MAGNET Sigma! 🧲'`
Keep `first_listen` and `cold_reads` exactly as they are.

---

## 8. STRATEGIC-DEPTH CHECK (why 30 spells, not 30 reskins)

- **Element matters:** with the weakness multiplier, choosing Fire vs Freeze vs
  Volt vs Starsong per enemy is the core puzzle; no single element dominates.
- **Identity per element:** Fire = AoE + burn DoT; Freeze = single-target
  lockdown (`frozen`); Volt = AoE disruption (`paralyzed`); Starsong = holy
  pierce + anti-Hush; PP-steal = attrition/economy + self-sustain.
- **PRAY tension:** her guaranteed tools (Heartmend, the ladders) vs. PRAY's
  swingy upside is a real risk/reward call each turn.
- **Support vs nuke:** Hush Hex (`exposed`) + Lucky Star turn Mia into a force
  multiplier for the whole party — a different turn than nuking.
- **PP budget:** Σ spells (~78-84 PP) are once-a-fight; her drain line is the
  pressure valve that lets a careful player keep the lights on.

---

## 9. ACCEPTANCE CRITERIA

- [ ] `ABILITIES` has all ~30 ids; every `fx` resolves in `FX_REGISTRY` (validator green both ways).
- [ ] `HEROES.faye.unlocks` updated; awakened abilities not in `unlocks` (one-path rule); PRAY table unchanged.
- [ ] New `AWAKENINGS` entries (`faye`) have real `dialogue` keys.
- [ ] Elemental weakness/resist multiplier exists on the hero→enemy seam; `holy` pierces a slice of resist.
- [ ] New statuses (`burn`, `frozen`, `lucky`, `exposed`, `lifedrain` effect) apply, resolve, tick down, print wear-off lines.
- [ ] **Emoji glyph map implemented** (§5 Option A); a test asserts every used emoji codepoint resolves to a drawn glyph (no tofu).
- [ ] `availableAbilities('faye', 99, allFlagsTrue)` returns ~30 unique ids.
- [ ] Tests added: weakness-multiplier damage test, `burn` DoT test, `frozen` skip-turn test, `pp_drain`/`lifedrain` transfer test, emoji-glyph test.
- [ ] `npm test`, `npm run build`, `npm run validate` pass.

**Build order: data (abilities + unlocks + registry) → elemental multiplier →
new statuses → emoji glyph system → Starsong fx → tests. Keep her voice kind and
steel-spined; the emojis are sparkle, not noise — use them on the lines that
already feel like a flourish.**
