# Chapter 1 Overhaul — approved design spec (the build bible for this work)

> Status: APPROVED direction (2026-06-17), build in progress. This is the
> source-of-truth for the Ch.1 story restructure + the combat/economy revamp.
> Decisions captured from the design review; see ADR-121 / ADR-122.

## 1. The story restructure (APPROVED)

### The new Chapter 1 flow
1. **2 AM, meteor night** (reuse the 4-phase opening cinema). Climb to the crater.
   Glint's prophecy + the **Star Locket**.
2. **The crater holds a MACHINE, not a bug.** A **HUSH SENTINEL** unfolds out of the
   wreck — an end-game-tier Mars construct, the Hush's advance scout, that rode the
   meteor ahead. It is *wildly* out of Jay's league. This is a **strong "cannot-win-
   alone" encounter, NOT a boss.**
3. **Glint goes supernova.** Glint joins as a **temporary super-powered party member**
   and carries the fight; **Jay's VIBE SURGE α awakens here** (the old light is what
   lets a kid survive a piece of Mars — bigger stakes than the old Tick tutorial).
   You **repel** it: it powers down and sinks into the crater (**it RETURNS as a
   late-game callback**; its husk stays as an Otterbrook landmark).
4. **Dawn, and the cost.** Spent saving Jay, Glint flickers to a single spark on the
   porch — the Pickles' **bug zapper** finishes the diminished light (the death now
   EARNED: the firefly who fought off a Mars war-machine, killed by a $5 zapper). →
   **Glint's Spark → Lifeup α.** It becomes **daytime**; Otterbrook opens to explore.
5. **The town starts dying.** The meteor left a parasite: the **TITANIC TICK** has
   burrowed into Otterbrook's HEART (a great **Heart Oak** in Pond Park / the old
   water tower) and is draining the whole town's Vibe. As it feeds, a **"HUSH-DARK"**
   creeps over town at noon — colors desaturate, streetlights flicker on, music
   thins, and Otterbrook **progressively HARD-LOCKS** (shops shutter, NPCs go gray,
   the 6:15 won't run, the roads out fog over). *This is the diegetic "night" that
   matches the existing Tick cutscene art.*
6. **The hunt → the Tick** in the Hush-dark: **BOSS 1 — the Titanic Tick**, now deep
   in Ch.1, earned and menacing, under a sky that reads like the cutscene's night.
7. **Victory = real dawn.** The Tick pops; the stolen Vibe floods back; the Hush-dark
   breaks into warm sunrise; the bus runs, the fog lifts — **BRICKTON OPENS.** →
   bus → Dept. of Smiles → **Mia**.

### Why beating the Tick opens Brickton (story-driven)
The Tick is literally **eating the town's warmth**. While it feeds, nobody will leave
(the bus won't run, the roads fog with Hush). Killing it **returns the drained Vibe**,
the town wakes, and the way out clears. Soft-lock → hard-lock escalates as it feeds;
victory un-locks the world.

### Day/night reuse (the lighting puzzle, solved)
meteor **night** (robot) → **dawn** (Glint dies) → **day** (explore) → **Hush-dark**
returns as the Tick feeds (reuse the night Tick cutscene) → **real dawn** on victory.
The Hush-dark is a Vibe-blight tint, not astronomical night — diegetic + creepy.

### Awakening cadence (preserved)
Surge α at the **Sentinel** fight (was the Tick) · Lifeup α from Glint's Spark on the
porch · Mia's Fire α still in Brickton. The Tick fight now uses the already-awakened
Surge + the Salt Shaker to sever its latch (Jay-solo-able).

## 2. Combat numbers — the new scale (APPROVED: ADR-122)
**Wide JRPG dynamic range: 1–2 digits EARLY → THOUSANDS by the end.**
- Early (Ch.1): bat 1–3, α-abilities ~6–12, trash HP ~6–15, Tick ~40–60. Clean + small.
- Late (Ch.10): hits in the **thousands**, boss HP tens of thousands, Σ abilities 1000s.
- Fixes the slow-burn gap (α no longer one-shots Ch.1 trash) AND gives epic late-game.
- **Money is the OTHER axis** (ADR-120): combat ramps to thousands, net worth ramps to
  **billions** — money stays the bigger number. Full-restore shows "FULL", not 9999.
- The exact current→proposed value table (every ability/item/enemy/boss + PP pools +
  upgrade-tier deltas) is the next deliverable, verified with `npm run balance` (TTK
  fair) before applying. DATA only, never formula/code.

## 3. Strategic battle layers (proposed; system is rich but attack-spam-viable)
Small early numbers make these BITE:
1. Weakness becomes a decision (readable tells; Spy/observe reveals).
2. Telegraph → counter windows (Defend/Shield/Freeze/Mind-Warp answer the wind-up).
3. Poise / Guard-Break (focus-fire + Pippa mark → stagger).
4. PP scarcity as core tension (small pools = real choices).
5. Status as a first-class win condition (lock-down as a legit alt to damage).
6. Lean on latch/drain + the swirl (back-attacks really hurt at small HP).
(Deferred unless wanted: front/back rows, turn-order manipulation moves.)

## 4. Pricing / income (ADR-120)
Reward ladders per band to the Fortune Arc: Ch.1 enemy cash modest ($2–30; rare types
like the Good Investment $90+), quests $50–200, minigame titles pay real lump sums,
property flip/rent is the multiplier. Exact table ships with the combat table.

## 5. Opening-scene fixes (SHIPPED this pass)
- Ana & Vivi are **home asleep** through the meteor night (in `ana_room`/`vivi_room`,
  `unlessFlag: zapper_done`, with night dialogue); they appear at the stand only in the
  **morning** (`ifFlag: zapper_done`).
- The **lemonade stand** is gated to morning + moved north, out of the opening pan.

## 6. New assets (prompts in docs/CH1_ART_PROMPTS.md)
- **Hush Sentinel** battler (×3 wear) + overworld sprite + a **damaged-husk** prop (§8).
- Optional **super-Glint** glow sprite. The **Hush-dark** is a tint/shader overlay
  (procedural — no authored art expected). Tick's-nest map = a layout I build (tiles reuse).

## 7. Build order (open)
1. ✅ Opening-scene fixes (Ana/Vivi/stand).  2. Combat+economy value table → apply.
3. The Sentinel encounter (scripted, super-Glint ally) at the crater + Surge α restage.
4. Relocate the Tick to the Heart-Oak nest; the Hush-dark hard-lock escalation; Brickton
   gate rewire.  5. Strategic battle layers.  6. Asset prompts as each piece lands.
