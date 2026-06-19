# Meteor Falls — Branching Redesign: "The Held Breath"
### Choices, a time-rewind, party fates, and nine composed endings — layered onto the canon spine

> **ADR-126** (The Held Breath — Jay's Locket-borne rewind) · **ADR-127** (The Three
> Axes — choices, party-fate, power & map divergence) · **ADR-128** (Composed
> Endings — the modular epilogue-card finale). Amends GAME_BIBLE §A4 / §A6.
> Re-grep `docs/DECISIONS.md` for the next free ADR before landing (last seen: ADR-125).

This document is the canon spec for adding **player choice, consequence, and replay
value** to Meteor Falls without rewriting a single shipped beat. It is the product of
a multi-agent design pass (narrative + technical architecture + adversarial feasibility)
and a set of locked product decisions (below).

---

## 0. The locked decisions (what we're building)

| Decision | Answer |
|---|---|
| **How many endings** | **Nine.** Not nine bespoke cinematics — **3 binary axes → 8 + 1 golden = 9**, assembled from ~22 modular epilogue cards. |
| **Where the tree begins** | **End of Ch.5 / Ch.6**, once the core roster is together and the rewind unlocks. Divergence then widens every chapter to Ch.10. |
| **Who owns the rewind** | **Jay** — but as the **Star Locket's** power (not a 4th body-power), **fuelled by Mia's faith**, and it **locks his Puppet** when used. Self-limiting, no damage, climaxes in renunciation. |
| **How varied are branches** | **Weight-bearing.** Choices change **party composition** (members leave), **end-game powers/loadout**, **the final-boss rules**, and **map state** — not just cutscenes. |
| **Build order** | **All at once**, behind the layering discipline in §1. |

### The through-line that makes this *this game's* redesign

> The **Trust Thread** already asks *"is the boy holding our strings?"* Make the
> time-rewind **literal**, give it to Jay, and **every rewind is a held string** —
> undoing a friend's choice to get a better outcome. The three choices, the rewind's
> cost, and the finale all run on **one nerve: control vs. letting go** — the Hush's
> own theme, turned inward. Jay can Teleport (control space), Puppet (control will),
> and now Hold the Breath (control time). The whole game becomes *the boy who could
> control everything, learning not to* — and the finale is him giving it all up.

---

## 1. The layering discipline (how we touch nothing we've shipped)

Every branch is one of three things, and we tag every beat in §9 as such:

- **[CANON]** — existing beat, **byte-for-byte unchanged**. The un-flagged path is
  today's game.
- **[GATED]** — an existing scene gains **flag-conditional lines/outcomes** via the
  already-pervasive `ifFlag` / `unlessFlag` mechanism (40+ live uses in `maps.ts`).
  The default (no flag) renders exactly as before.
- **[NEW]** — a brand-new short scene **wedged between** existing beats, or a new
  data registry. Additive only.

**Three places this discipline must legitimately yield** (called out honestly, all
additive-in-spirit, none touching shipped player-facing content):

1. **The finale is assembled, not fixed.** `ch10_finale` is today one 14-beat
   cutscene (`cutscenes.ts:286`). We **split** it so the composer can interleave
   epilogue cards (the file already documents "split a chapter into multiple ids when
   beats fire at different moments"). The linear payoff beats are reused verbatim.
2. **The validator gains checks.** `tools/content-validate.ts` is *extended* with new
   cross-ref blocks (choices, cards, echoes). Additive — it only adds failure modes
   for the new content.
3. **We add new threads, we don't fork the old ones.** The shipped `trust` / `clicker`
   threads have validator-pinned single terminals (`storythreads.ts`, validated at
   `content-validate.ts:~588`). We **read** their flags but never mutate their chain;
   all new state lives in new flags.

**The Ember spine is sacred.** Choice flags **never** gate Ember collection, boss
access, or `CHAPTER_MANIFESTS` progression. A player who ignores every choice gets
today's game + a default-composed ending. The money axis (`fortune.ts`) is untouched.

---

## 2. THE HELD BREATH — Jay's Locket-borne rewind

### 2.1 In-fiction
Jay doesn't "time travel." The **Star Locket already records moments** (each Heartlight
is 1/10 of the Homesong — a captured instant of warmth). Jay discovers it records the
**breath around** the song, and that he can press his thumb to it and **make the world
take a breath back**. Diegetically tiny and intimate — a held breath, a thumb on a
locket — not a chrono-blast. Visually: a soft **inhale-and-reverse** (reuse the
cutscene cross-dissolve + a reversed Ken Burns push).

Mia frames it the first time, and it's the thesis of the whole system:
> *"You're not changing what happened. You're changing what they **chose**. Be careful
> which one of those you think it is."*

### 2.2 Unlock
A new staged scene at the **Ch.6 Laughing Ruins** (the same chapter that canonically
unlocks Teleport α — so "Jay bends another axis of reality" lands where the game
already expected a Jay-power beat, mid-Trust-escalation `thread_trust_esc3`). The
Sphinx's chamber loops; the game itself stutters (a caption replays, an sfx repeats);
Jay realises what the Locket can do. Staged **uneasy, not triumphant** — the others
watch a moment un-happen and go quiet.

> **Toast:** `{rex} learned to hold the world's breath…`
> **Flag:** `held_breath_unlocked` · **Dialogue:** `held_breath_awaken`

> **Implementation note:** this is **not** an `AwakeningDef` (that schema requires a
> validated combat ability id). It's its own tiny staged-scene + flag, tracked by the
> Echoes system (§10.3). It grants a **field/menu power**, never a battle row.

### 2.3 What it costs (so choices stay weighty)
Four stacked costs, each wired to an existing system:

1. **Finite "Breaths," refuelled by faith.** Jay holds **3 Breaths**, shown on the
   Locket pause-screen beside the Embers. Charges **only** refill when **Mia PRAYs the
   "Wonderful"/"Miraculous" tier** (the canon high-variance table). You cannot farm
   undo; the RNG owns the supply, and leaning on rewind **spends Mia's best prayers on
   undoing instead of healing** — an organic opportunity cost. *(Shared power: Jay
   holds the breath; Mia gives him the air.)*
2. **It locks Puppet.** Rewind and Mind-Warp/Puppet (`mindwarp_a`) draw the same Locket
   well — **using a Breath disables Puppet for the rest of the current map/encounter.**
   You can bend will *or* time, never both at once. *(This is the anti-OP mechanic.)*
3. **A Trust/Hush penalty per use.** Every rewind ticks a hidden `rewind_count`, adds a
   small **Hush-pressure** beat (the dark notices Jay holding strings), and fires
   escalating barks — Mia at 1 (*"…Was that yours to take?"*), Milo at 3 (rationalising
   too fast — his canon tell), Pippa at 5 (*"Wait — did I decide that, or did we already
   do this?"*). **High `rewind_count` closes the golden ending** (§8.4).
4. **The big choices are locked or witnessed** (§3): Choice 1's life-or-death instant is
   **rewind-locked**; Choice 2 is rewindable **once, witnessed**; Choice 3 is
   **fully, permanently non-rewindable** (the Locket is empty of Breaths by design — the
   last recorded moment *is* the Homesong). The power's final word is its own
   renunciation, mirroring Jay's canon Ch.8 *"refuses to take a will even when it would
   fix everything."*

### 2.4 What it's *for* (the player's tool)
Between choice points the player may **revisit a past rewindable choice** and re-make it
— previewing how a branch's party/power/map state changes — at the cost of a Breath, a
Hush tick, and the golden ending if overused. It is how a *single* playthrough can taste
consequences and step back, **without** trivialising the choices (which are locked or
witnessed). New Game+ grants extra Breaths for branch-tourism.

---

## 3. THE THREE AXES & THE DECISION TREE (Ch.6 → Ch.10)

Three **primary** choices define the 9 endings. Each is a real dilemma (both options
cost something the player wants), placed at an existing dramatic peak, setting one
binary axis flag:

- **TRUST** — `axis_trust = STRINGS | FREE` (Choice 1, Ch.6)
- **COMPASSION** — `axis_compassion = IRON | OPEN_HAND` (Choice 2, Ch.9)
- **FINALE** — `axis_finale = SILENCE | FORGIVE` (Choice 3, Ch.10)

Around them, **secondary consequence-beats** widen the tree without adding endings —
they shape **who's in your party, what powers you hold, and the map** (§4–6).

### CHOICE 1 — "The String You Could Pull" · Ch.6, Laughing Ruins · TRUST
**Rides:** the Trust escalation `thread_trust_esc3` (the chapter the rewind also
unlocks). This is the **first pull** — the Ch.8 Trust climax becomes its *payoff*.

**Setup [GATED on the existing escalation]:** the Hushed ruins corner the party with
the canon whisper — *"How do you know the boy isn't holding your strings right now?"* —
then Hush **Pippa** mid-step, freezing her at the edge of a collapsing stair. Jay can
borrow her hands for one step (Puppet) and walk her back. The Hush *wants* him to — it
proves the whisper true in front of everyone.

> The fog has Pippa by the feet. One more step and she's gone where you can't reach.
> You know how to move her. You've moved strangers all the way across the world.
> The dark is very quiet, waiting to see what you'll do.
>
> ▸ **PULL THE STRING.**  *Borrow Pippa. Walk her back. Save her now — and let them all see exactly what you can do.*
> ▸ **OPEN YOUR HAND.**  *Drop the power where she can see you drop it. Trust her to find her own feet. Even if she doesn't.*

This instant is **rewind-locked** ("not this one — this one's hers"). You cannot
un-choose the moment that the whole system is *about*.

- **PULL → `axis_trust = STRINGS`.** Pippa is safe *now*, but comes back rattled. The
  party goes cold, not split. **Mechanical ripples:** Jay's Puppet stays available in
  the finale (you leaned into control) — but Pippa's doubt begins compounding toward a
  **mid-game departure** (§4.1).
- **OPEN → `axis_trust = FREE`.** A held beat where Pippa *almost* steps into the fog —
  then her own footing finds her. The party chose trust under the worst pressure.
  **Mechanical ripples:** a party-wide "freely given" finale buff; Pippa never wavers;
  the finale's free-will PRAY unlocks freely.

### CHOICE 2 — "The Iron and the Open Hand" · Ch.9, Count Hoaxula · COMPASSION
**Rides:** the canon Hoaxula mercy beat (the one boss whose win condition is already a
moral act). **We keep the mercy ending exactly as-is and add a second valid door.**

**Setup [GATED on the Unmasked phase]:** Vlad Dragomir — bankrupt Cleveland actor
stuffed with stolen Vibe — drops to his knees; the valley greys around him each turn.
Mia can PRAY him to peace (canon). **Or** Milo's **Vibe Siphon** (a new optional
build-quest off his Repair/Clicker identity — he has no Vibe, so it *contains* Vibe, it
doesn't channel it) can rip the stolen warmth out and **bank it** as the **Stolen
Light** — a real finale edge — leaving Vlad hollow: alive, un-Hushed, emptied.

> ▸ **THE OPEN HAND.**  *Pray. Let the stolen warmth go home. Win nothing but the valley back.*
> ▸ **THE IRON.**  *Pull the Vibe out and keep it. He lives. He just lives with nothing. You'll need it where you're going.*

- **OPEN_HAND.** Canon mercy, untouched. Vlad goes home and **becomes a finale caller**
  ("the actor"). **Ripples:** the party stays whole; **Dorin** at full power.
- **IRON.** Bank the **Stolen Light** (§5). No Vlad caller. **Ripples:** **Dorin**, the
  monk who knows what being emptied costs, is so disturbed he **withholds his ultimate**
  (and, on the most extreme paths, **leaves before Mars** — §4.2). Buni's quiet,
  loving, unforgettable line lands either way.

> Buni, IRON path: *"You took the cold out of him, puiul meu. You did not put anything
> warm back. That is a thing you **did**, not a thing that happened to you."*

### CHOICE 3 — "What the Song Is For" · Ch.10, THE CALLING · FINALE
**Rides:** the finale's third movement (the scripted PRAY where every helped NPC phones
in). **Both options end the Hush** (canon is honored). They differ in *what the
Homesong does* — and that changes the **boss's rules** (§7).

The Hush, for the first time, speaks (sparse, lowercase, wrong): *"you came so far. it
was quiet here. i was quiet here. why."* It is revealed, gently, as a **loneliness so
total it learned to eat the thing it couldn't have** (recontextualises, doesn't
contradict).

> ▸ **SILENCE IT.**  *Play the Homesong like a key turning a lock. End the quiet. Send the dark home and never hear it again.*
> ▸ **FORGIVE IT.**  *Play the Homesong like a hand reaching down. Don't beat the loneliness — outlast it. Let it choose to stop being hungry.*

- **SILENCE → `axis_finale = SILENCE`.** The canon damage-race CALLING (callers pulse
  the Hush to 0). Clean, final. The Sea of Silence goes still and empty.
- **FORGIVE → `axis_finale = FORGIVE`.** A **different final phase, "The Answer"**: you
  stop dealing damage and spend turns *giving* Vibe to fill a meter while surviving its
  grief-AoE. **Only achievable if you arrive warm enough** (callers + Open-Hand history)
  — too Iron with too few callers and the game lets you *try* and **fail** (a tragic
  gated beat that forces Silence). The Sea goes **luminous** — a single firefly-light
  drifts off across it. Jay leaves his bedroom window open.

**The Trust gate on Choice 3:** if `axis_trust = STRINGS`, a [NEW] micro-beat fires
first — Mia: *"Jay, I need to know this one's mine. Promise me you'll let me pray it
wrong if I pray it wrong."* The player must, via a no-rewind confirm, **give the choice
to Mia**. A player who pulled the string in Ch.6 must *earn the finale's free will back*
by refusing to pull it at the very end.

---

## 4. PARTY-FATE SYSTEM — who leaves, when, how they return

Party membership is a mutable array (`GS.data.party`, joins via
`party.push(makeHeroState(...))`, e.g. `OverworldScene.ts:4222`). We add a clean
**bench/depart** path (the inverse of the existing join) plus flag-gated return. Two
heroes can leave, each tied to an axis; finale party size becomes **3, 4, or 5**.

### 4.1 Pippa — the early departure (TRUST axis)
Pippa (joined Ch.5; her canon Ch.7 line is *"…that WAS me, right?"*) is the conscience
of the Trust question.

- **STRINGS + unreconciled** → Pippa **leaves at Ch.8** (the Trust-climax chapter): she
  can't trust her own agency near Jay. `pippa_left = true`; she's removed from the party
  for Ch.8–9.
- **Reconciliation [NEW, Ch.7 secondary beat]:** a quiet sub-scene where Jay (silently,
  via action not Puppet) can begin to earn her trust back; combined with **low
  `rewind_count`**, this sets `pippa_reconciled` and she **stays / returns**.
- **FREE** → she never wavers.
- **Return for the finale:** if she left, a [NEW] Ch.10 beat lets her rejoin **only** if
  reconciled — otherwise she phones in as a *caller* instead of fighting (still present
  in spirit; never just deleted).

### 4.2 Dorin — the late withhold/departure (COMPASSION axis)
Dorin joins Ch.9 (canon, after the Trial of the Mute Mountain) — and the **Iron** choice
in that same chapter directly implicates him (he, of all people, knows being emptied).

- **OPEN_HAND** → Dorin at full power; his Vibe Comet Ω available all finale.
- **IRON** → Dorin **withholds Comet Ω** (flag-locked) entering Mars; a [NEW] redemption
  beat can restore it. On **IRON + STRINGS + low warmth**, he **leaves before the Sea of
  Silence** (`dorin_left`), and the player fights the Hush without him.

### 4.3 Balance consequence (real, bounded)
The Hush fight must stay in the validated **TTK 4–10** window at party sizes 3/4/5 and
across loadouts. We add **finale balance variants** (a small `BOSS_HP`/survival-round
adjustment keyed to party size + Stolen Light) and assert each in `npm run balance`.
This is the one genuinely new balancing chore; it's bounded (one fight, a handful of
loadouts) and money > combat is unaffected.

---

## 5. END-GAME POWER MATRIX (what you hold at the finale)

| Source | FREE / OPEN_HAND (warm path) | STRINGS / IRON (control path) |
|---|---|---|
| **Jay** | "Freely given" party buff; Held Breath **renounced** (empty at Mars by design) | **Puppet usable** vs Hushed adds (costs Hush pressure); Breath still empties at Mars |
| **Mia** | Full-strength PRAY; awakens her finale support | PRAY **weakened** unless the Ch.10 "give it to Mia" beat is passed |
| **Milo** | No Stolen Light; **+Vlad caller** (more CALLING damage) | **Stolen Light** — damage the Hush during "The Quiet" (canonically un-damageable) |
| **Dorin** | **Vibe Comet Ω** all finale | Comet Ω **withheld** (or Dorin **absent**) until/unless redeemed |
| **Pippa** | In party, steadfast | **May be absent** (caller-only) unless reconciled |

Two genuinely different finale loadouts: **warm = a fuller, kinder party + extra
callers**; **control = raw power (Stolen Light + Puppet) but a wounded, smaller party
and a moral debt.** The rewind is the player's lever to reshape which one they bring.

---

## 6. MAP-STATE DIVERGENCE (the world plays differently)

All via `ifFlag`/`unlessFlag` on existing map data + a few branch-exclusive rooms — no
new full dungeons (the one expensive thing we deliberately don't promise ×9):

- **Overworld warmth:** STRINGS/IRON paths **grey a handful of NPCs** between chapters
  (the Hush leaning in); FREE/OPEN_HAND keep them warm. Same maps, gated props/NPCs.
- **Pippa's bunk:** if `pippa_left`, her spot at camp/inn renders **empty** with a gated
  "she's not here" sign — a small, constant ache.
- **Stone Brow shrine (Ch.9):** lit (OPEN_HAND) vs dark (IRON) — gated props.
- **The Sea of Silence (Mars, the finale dungeon):** the **same map** renders
  dark-and-empty (SILENCE) vs **luminous with drifting firefly-lights** (FORGIVE); a
  side path is **sealed on one branch, open on the other**, leading to a **branch-only
  alcove** (the "I went somewhere you didn't" beat).
- **The porch (epilogue):** the golden ending shows the **bug zapper unplugged** (the
  one that killed Glint in the opening) — closing the game's loop.

---

## 7. THE FINAL BOSS — the Hush plays differently per path

The Hush is a bespoke 3-phase fight (`enemies.ts` + `BattleScene.ts`). We keep phases
1–2 and **branch phase 3 + the loadout you bring**:

- **Phase 1 "The Static"** — normal fight. *(IRON: Stolen Light adds a damage option.)*
- **Phase 2 "The Quiet"** — canonically un-damageable, survival turns. **IRON's Stolen
  Light lets you chip it here**, shortening the slog.
- **Phase 3 —**
  - **SILENCE → "THE CALLING"** (canon): scripted PRAY; every caller pulses damage;
    more callers = fewer survival rounds; player confirms their name; Homesong plays.
  - **FORGIVE → "THE ANSWER"** [NEW phase variant]: you **give** Vibe to fill a warmth
    meter instead of damaging; survive the grief-AoE; the win triggers when the meter
    completes. **Gated viability:** requires a warmth threshold (callers + Open-Hand);
    below it, the attempt **fails** into a forced Silence (a tragic, intentional beat).

Both end with the **canon** player-name confirm + Homesong + walk-home (sacred,
unchanged). The branching lives in the phase rules and the epilogue, never in the
walk-home beat itself.

---

## 8. THE NINE ENDINGS — composed from ~22 cards

### 8.1 Why composed, not bespoke
Nine hand-built endings = ~60–110 manual art panels against a slow, human-in-the-loop
pipeline and unfinished ch4–10 — not realistic, and *worse design* (bespoke endings
can't acknowledge **combinations** of choices). Instead the epilogue is a **sequence of
modular cards** the flag-state selects and assembles — the same principle the game
already trusts for the **caller ledger** and **Mr. Click's photo album**.

### 8.2 The five epilogue slots (5 cards shown, drawn from ~22 authored)
1. **TONE FRAME** — by `axis_finale`.
2. **THE HUSH'S FATE** — by `axis_finale × axis_compassion`.
3. **WORLD-STATE** — by `axis_trust × axis_compassion`.
4. **PER-CHARACTER "where are they now"** (Jay/Mia/Milo/Pippa/Dorin) — each by the axis
   that most implicates them, so the same kid gets a different future per path (and a
   rider if they left).
5. **HOMECOMING TAG** — over the canon House-Key beat; golden vs standard.

3 (world) × 3 (companion) × 3 (jay) ≥ **27 reachable compositions** from ~22 cards,
far exceeding 9 distinguishable endings; callers + money-band add texture on top. Cards
are authored once and reused across compositions. **Sample card copy** lives in the
appendix (§A).

### 8.3 The nine, named (`T`rust / `C`ompassion / `F`inale)
1. **The Open Hand** — `FREE / OPEN_HAND / FORGIVE` **+ golden** → *he could have decided everything and instead asked, gave, and forgave; the universe's loneliest thing chose to come in from the cold.*
2. **The Long Way Home** — `FREE / OPEN_HAND / SILENCE` → *clean hands, kind heart, the dark sent gently home.*
3. **What the Light Cost** — `FREE / IRON / SILENCE` → *free and kind to your friends, but you emptied a stranger to be sure; the win has a hum in a sock drawer.*
4. **The Useful Mercy** — `FREE / IRON / FORGIVE` → *you forgave the dark with hands that had just taken everything from a man.*
5. **His Own Two Feet** — `STRINGS / OPEN_HAND / SILENCE` → *you pulled a string once, then spent the road proving you'd never again.*
6. **The Quiet Kept** — `STRINGS / IRON / SILENCE` → *total victory, pocket-sized, not discussed at parties.*
7. **The Hand That Held On** — `STRINGS / OPEN_HAND / FORGIVE` → *you gave the dark the mercy you couldn't quite give yourself.*
8. **The Light You Took** — `STRINGS / IRON / FORGIVE` → *two debts and one impossible kindness; Buni says there's time.*
9. **Some Things You Let Be Empty** — `FREE / OPEN_HAND / SILENCE`, **low callers** → *the bittersweet near-miss of #2; a good ending that knows it could've been the best* (teaches "callers are the score," pulls toward New Game+).

### 8.4 The golden "Long Shot" gate (ending #1)
`ending_long_shot = true` **iff** `FREE` **and** `OPEN_HAND` **and** `FORGIVE`
**and** callers ≥ high threshold (~45/55) **and** `rewind_count ≤ 2`. It is the only
ending that composes **all four systems** — the three choices, the caller ledger, and
the rewind cost — and the only one with the unplugged bug zapper + the firefly off the
Sea. The reward for letting the world choose for itself.

---

## 9. BEAT-BY-BEAT (Ch.6 → Ch.10)

**Ch.6 Africa — Laughing Ruins** · *Trust esc.3 + REWIND UNLOCKS + CHOICE 1*
- [CANON] Zanzibel, savanna convoy, Teleport α, Laughing Sphinx (riddle boss).
- [NEW] `held_breath_awaken` — the Locket rewind, staged uneasy; Breath meter appears.
- [GATED] `thread_trust_esc3` now has teeth — it fires right after the party watches a
  moment un-happen.
- [GATED] **CHOICE 1** (rewind-locked instant) sets `axis_trust`.
- *Tutorial:* the Sphinx's wrong-riddle (canon: party Cries) is the **safe** rewind
  sandbox — undo it with no Trust penalty.

**Ch.7 India — Cobra's Palace** · *Trust esc.4 + Clicker crisis + Pippa reconciliation*
- [CANON] Chandrapore, the night-train Locket heist, Cobra Raja, `thread_clicker_crisis`.
- [GATED] rewinding the heist ticks `rewind_count` + Hush pressure; a gated Hush bark
  weaponises the rewind itself ("you and the machine-boy, both holding strings").
- [NEW] **Pippa reconciliation** secondary beat (gates §4.1).

**Ch.8 China — Paper Dragon** · *Trust CLIMAX payoff + Clicker clearing + Pippa fate*
- [CANON] Spore Forest, Mt. Shu, Teleport β, Paper Dragon, `thread_clicker_clearing`
  (Lotus Bargeman caller).
- [GATED] the canon `trust_climax`/`trust_resolve` fire in their **STRINGS-guarded** or
  **FREE-warm** form (the Choice-1 payoff); `the_party` caller takes its variant.
- [NEW] **Pippa departs or stays** (§4.1) — `pippa_left` resolves here.

**Ch.9 Romania — Count Hoaxula** · *CHOICE 2 + Dorin joins & is tested*
- [CANON] Buni's table & Feast Basket, Trial of the Mute Mountain (Dorin joins, Comet Ω),
  Hoaxula Theatrical→Unmasked with the canon Pray-mercy intact.
- [NEW] Milo's **Vibe Siphon** build-quest (arms the Iron door; skippable → mercy default).
- [GATED] **CHOICE 2** at the Unmask sets `axis_compassion`; Stolen Light / Vlad caller /
  **Dorin withhold-or-leave** (§4.2) resolve; Dorin & Buni riders fire.

**Ch.10 Alaska→Hawaii→Mars — The Long Shot** · *CHOICE 3 + the assembled ending*
- [CANON] Aurora Station (Frost Sentinel), Mauna Lani (Tiki Golem), Phone Dad/Mom, launch,
  the Sea of Silence, the 3-movement Hush, the name-confirm, Homesong, walk home / House Key.
- [GATED] Mom's "proud of you" gains `axis_compassion` riders; the Sea renders by
  `axis_finale`; **Pippa/Dorin finale status** resolves (rejoin or caller-only).
- [NEW] if `STRINGS`, the **"give the choice to Mia"** gate; the **Hush speaks** beat.
- [GATED] **CHOICE 3** → phase-3 variant (§7); **then** [CANON] name-confirm + Homesong +
  walk-home, with the **assembled epilogue cards** played **over** the credits (§8).

**Total new authored load:** ~1 rewind unlock, 3 choice nodes, ~6 secondary beats
(reconciliation/departure/redemption/Mia-gate/Hush-speaks/Vibe-Siphon), ~40 gated rider
lines, 22 epilogue cards, 1 new boss phase variant. Everything else is the canon game,
gated.

---

## 10. EXECUTION PLAN — every system updated

### 10.1 New data registries (`src/data/`)
- **`choices.ts`** — `ChoiceDef` / `ChoiceOption` registry of the 3 primary choices
  (id, chapter, band, intro/outro dialogue, `decidedFlag`, `terminal?`, options with
  `label`/`blurb`/`flag`/`alsoSets?`/`cards?`/`caller?`).
- **`echoes.ts`** — `EchoAnchorDef` (which choices are rewindable + offer/cost dialogue);
  `MAX_BREATHS = 3`.
- **`endings.ts`** — `EpilogueCard` registry (slot, order, `requires`, `minCallers?`,
  `moneyBand?`, `cutscene?`, `dialogue`, `fallback?`) + `SLOT_ORDER`.

### 10.2 New engine modules (`src/engine/`)
- **`choice.ts`** — `runChoice(scene, id)` integration helper (under the existing `cut`
  lock); `presentChoice` (reuses `pick()` + `onHighlight` + an iteminfo-style blurb
  panel so options have **descriptions**); `recordChoice` (sets one option-flag, clears
  siblings, sets `decidedFlag`); `recordedOption`; `choiceProblems` (validator helper).
- **`echo.ts`** — `captureEcho`, `rewindTo` (restore `GS.deserialize`, decrement Breath,
  tick `rewind_count`, clear downstream choice flags, drop later snapshots), `breathsLeft`,
  the Puppet-lock + Hush-pressure hooks.
- **`ending.ts`** — `composeEnding(ctx)` (pure, per-slot best-match with fallback) +
  `playEnding(scene)` (plays the split finale spine, then the selected cards).
- **`party.ts`** (or extend state) — `departHero(id, reason)` / `rejoinHero(id)` /
  `isPresent(id)` and the withhold-ability gating.

### 10.3 State + migration (`state.ts`, `migrations.ts`) — **v15 → v16**
- `GameStateData.version: 16`; add **`echoes: EchoState`** (`{ stack, breaths, rewind_count }`).
  *(Choices ride `flags` per ADR-015 — no field needed; party departures ride flags +
  the existing `party[]`.)*
- `newGameData()` inits `echoes: { stack: [], breaths: MAX_BREATHS, rewind_count: 0 }`.
- One additive migration step `{ to: 16 }` backfilling `echoes` (pre-v16 saves never
  rewound — full breaths, empty stack, zero count is their true history). Never touches
  `flags`/`party`/any v15 field. Snapshots store `GS.serialize()` opaquely and
  self-migrate on `deserialize` (add a round-trip-through-a-version-bump test).

### 10.4 Schemas (`schemas/index.ts`)
- Add `ChoiceDefSchema`, `EpilogueCardSchema`, `EchoAnchorDefSchema` (strict Zod, mirror
  the existing `AwakeningDef`/thread schemas). Validated by content-validate.

### 10.5 Abilities & items (`abilities.ts`, `items.ts`)
- **Stolen Light** — a banked finale resource (item + a battle action). Tuned as a
  **survival-round reducer / Quiet-phase chip**, **not** a big-number nuke — stays on the
  canon combat curve (money > combat unaffected). Verified by `npm run balance`.

### 10.6 Maps (`maps.ts`, `maps_ch*.ts`)
- Gated prop/NPC/sign variants for overworld warmth, Pippa's empty bunk, the Stone Brow
  shrine, and the Sea-of-Silence dark/luminous states + the branch-only alcove + the
  sealed/open path. **All via `ifFlag`/`unlessFlag`** (no shipped entries edited).

### 10.7 Cutscenes (`cutscenes.ts`)
- **Split** `ch10_finale` → `ch10_finale_core` (linear payoff) + `ch10_finale_credits`
  (name-confirm + credits), so `playEnding` interleaves cards between.
- Scaffold `ch6_choice_*`, the new secondary-beat scenes, `held_breath_awaken`,
  `echo_rewind`, and the 22 `epi_*` card cutscenes (**data now, art later** — missing
  panels silently skip, the established pattern).

### 10.8 Dialogue (`dialogue.ts` / a new `dialogue_choices.ts` spread)
- Choice intros/outros + blurbs; the rewind unlock + cost + escalating barks; every
  gated rider (Mom/Buni/Dorin/Pippa/the party variants); the Hush-speaks monologue
  (§A11.3 voice); the 22 card captions. New `{tokens}` registered in `text.ts`.

### 10.9 BattleScene (`BattleScene.ts`)
- The Hush **phase-3 variant** ("The Answer" give-Vibe meter + grief-AoE + viability
  gate); **Stolen Light** action + Quiet-phase chip; **Puppet-in-finale** availability;
  **Mia PRAY strength** modifier; **Dorin withhold/absent** handling and the
  party-size-aware finale tuning.

### 10.10 OverworldScene (`OverworldScene.ts`)
- The integration seam: new `TriggerDef` walk-zones + `runTrigger` cases calling
  `runChoice(this, id)` at each chapter beat (additive `case`s only, like the existing
  `crater`/`porch`); the Held Breath **unlock scene** + the **Breath/Echoes** field
  power; **departHero/rejoinHero** wiring; map-state fade-restarts on flag change; the
  Ch.10 finale handler calling `playEnding(this)`.

### 10.11 MenuScene (`MenuScene.ts`)
- The **Locket / Echoes** pause-screen: Breath meter beside the Embers; the "revisit a
  moment" list (reuse `pick()` + `onHighlight` description panel); the rewind confirm +
  cost warning.

### 10.12 Validation & tests
- **`content-validate.ts`** extensions: choices well-formed + dialogue-backed +
  option-flags globally unique; every ending **slot has a fallback** (no empty
  composition); card dialogue/cutscene refs exist; echo anchors reference real
  **non-terminal** choices; the terminal choice is **not** anchored; summary counts.
- **Vitest:** `choice.test.ts` (record/clear/round-trip), `echo.test.ts` (snapshot
  serialize↔deserialize exactness; breaths bound; `rewind_count` survives restore;
  downstream-flag clearing; terminal non-rewindable; Puppet lock; migration round-trip),
  `ending.test.ts` (all 27 combos × caller/money tiers reachable, non-empty, ≥9
  distinct, default-path holds), party depart/rejoin, and a balance assertion for finale
  party sizes 3/4/5.

### 10.13 Canon docs
- This file; an entry each in `docs/DECISIONS.md` (ADR-126/127/128); GAME_BIBLE §A4/§A6
  amendments; a note in `BALANCE_CH4-10_SPEC.md` for the finale loadout variants.

---

## 11. Build phases (all in one pass, sequenced to de-risk)

1. **Backbone:** state v16 + migration + `echoes`; `choices.ts`/`echoes.ts`/`endings.ts`
   + schemas; `choice.ts`/`echo.ts`/`ending.ts`/party; validator + tests **green** with
   one placeholder choice and a fallback-only ending. *(Proves the system headless.)*
2. **Choice 1 + rewind, fully wired:** Ch.6 unlock, Choice 1, the Breath/Echoes UI, the
   rewind cost + Puppet lock, the safe-sandbox tutorial. Playable end-to-end.
3. **Choices 2 & 3 + party fates + boss variant:** Iron/Open-Hand, Silence/Forgive, the
   Stolen Light, Pippa/Dorin departures & returns, the Hush "Answer" phase, finale tuning.
4. **The ending composer + 22 cards + map-state:** all gated variants, the split finale,
   `playEnding`, the golden gate; full validator + balance + test sweep; `npm run build`.
5. **Art deferral:** all cutscene/card panels scaffolded as data; art authored later via
   the ChatGPT→PNG pipeline (silently skipped until present).

---

## 12. Risks & tone guardrails

| Risk | Mitigation |
|---|---|
| Rewind save-scums weight | Locked/witnessed big choices; faith-gated finite Breaths; Puppet-lock; `rewind_count` closes the golden ending; finale non-rewindable. |
| Combinatorial QA blow-up | Snapshot only at the (few) rewindable anchors; clear downstream flags on rewind; pure `composeEnding` exhaustively unit-tested over all combos. |
| Save corruption / migration | One self-contained `echoes` field; snapshots self-migrate on `deserialize`; additive v16 step; round-trip tests. |
| Balance drift (party size / Stolen Light) | Finale loadout variants tuned to TTK 4–10; Stolen Light is a survival-round reducer, not a nuke; `npm run balance` gates it; money > combat untouched. |
| Grimdark creep | **No option is cruel — the darkest is only *heavy*.** Every one of the 9 ends on the warm walk home, kitchen light on (Slot 5 enforces it). The Hush stays sparse/sincere, never a punchline. Comedy lives in the world (Pippa's medal, the bug zapper), never on load-bearing beats. Buni always says *"there's time."* |
| "Don't change what I have" | Layering discipline (§1); the only yields are the finale **assembly point** and the **validator**, both additive; no shipped player-facing line is edited. |

---

## §A — Appendix: sample epilogue-card copy (production-voice)

- **`tone_open_window`** *(FORGIVE)* — "The dark didn't lose. It listened. Somewhere
  past Mars a quiet went soft, the way a quiet does when it finally has company. A few
  windows, here and there, stayed open all night — just in case something lonely wanted in."
- **`hush_befriended`** *(FORGIVE × OPEN_HAND)* — "They say if you sit by the Sea of
  Silence at the right hour, a single firefly-light comes up off the water to see who's
  there. They say it isn't hungry anymore. They say it just likes the company."
- **`jay_holding`** *(STRINGS)* — "Jay keeps the Locket on his nightstand where he can
  see it. He could move the whole world with his thumb. He's spent the rest of his life
  learning not to want to. Mia checks on him. He lets her. That's the part that matters
  — he lets her."
- **`milo_iron`** *(IRON)* — "Milo built the device that emptied a man, and it worked
  perfectly, and that's the trouble — it worked perfectly. He builds bikes for kids now.
  He says it's better work. He's right."
- **`pippa_minister` (+STRINGS rider)** — "Pippa Quill returned to Minimus a giant's-
  height hero and was immediately mistaken for a commemorative statue. *(+STRINGS: she
  still sometimes asks, mid-sentence, 'that was my idea, wasn't it?' Jay always says yes.
  He's always telling the truth.)*"
- **`home_long_shot`** *(golden)* — "From upstairs, two little voices, fighting over the
  lemonade money. He smiled. The best kind of ordinary. *(the open door, held — and a
  single firefly drifts past the porch light, and this time the bug zapper is unplugged.)*"
