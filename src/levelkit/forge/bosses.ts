/**
 * THE TEN BOSS TEMPLATES (S15g Movement Three, ADR-046) — the §A6 boss
 * gimmicks as parameterized FACTORIES over the proven phase machine
 * (src/battle/phases.ts). Each factory takes the canon numbers (HP-derived
 * heal amounts, thresholds, forms) and returns a plain BossScriptDef — the
 * SAME data shape the shipped Gilded Grin ships as (src/data/bosses.ts). The
 * factories invent nothing the machine can't already drive: the four template
 * extensions (noise-grounding, evasion, the golem heal-inversion, the latch
 * archetype) landed in phases.ts as ADDITIVE primitives, the Grin frozen.
 *
 * Promotion is a human act (Prime Law 1): a chapter session instantiates its
 * boss from the matching template into src/data/drafts/bosses.ts, then the
 * tone editor rewrites the draft dialogue ids into real §A11 lines and the
 * draft enters src/data/bosses.ts as canon. The factories are pure — no
 * Date.now()/Math.random() under src/levelkit/** (Prime Law 2).
 *
 * The roster, by §A6 chapter:
 *   formSwap            — Gilded Grin (Ch.2, SHIPPED reference)
 *   latchDrain          — Titanic Tick (Ch.1, archetype; the Tick stays bespoke)
 *   summoner            — Headmaster Mainframe (Ch.3)
 *   thresholdHeal       — Cobra Raja (Ch.7)
 *   riddle              — Laughing Sphinx (Ch.6)
 *   mercyEnding         — Count Hoaxula (Ch.9)
 *   airborneGrounded    — Paper Dragon (Ch.8)
 *   scriptedSurvival    — Whiskerzilla (Ch.5)
 *   untargetableUntilNoise — The Whisperwig (Ch.4)
 *   elementalGolem      — Frost Sentinel + Tiki Magma Golem (Ch.10 minibosses)
 */
import type { BossFormDef, BossScriptDef, Element, NoiseSource, PrayTier, RiddleDef } from '../../schemas';

/** every template's first argument: the §A7 enemy id the script drives */
type Boss = string;

/* ============================ 1. formSwap ============================ */

export interface FormSwapOpts {
  /** the opening form (becomes initialForm) and the form it alternates with */
  opening: BossFormDef;
  other: BossFormDef;
  /** the DIALOGUE id printed one turn before each swap (the grin-wider tell) */
  telegraphLine: string;
  /** telegraph on boss turns n, n+every, …; the swap lands one turn later */
  telegraphAt?: number;
  every?: number;
  /** ADR-035: an awakening staged the first time a form appears */
  awakeningOnForm?: { form: string; awakening: string };
}

/**
 * Two forms alternate on a cadence, each swap TELEGRAPHED one turn early — the
 * §A6 Ch.2 Gilded Grin shape (and its only canon user; the shipped script
 * stays bespoke in src/data/bosses.ts). Immunities/cracks ride the forms.
 */
export function formSwap(boss: Boss, o: FormSwapOpts): BossScriptDef {
  const tel = o.telegraphAt ?? 2;
  const every = o.every ?? 4;
  return {
    boss,
    initialForm: o.opening.id,
    forms: [o.opening, o.other],
    ...(o.awakeningOnForm ? { awakeningOnForm: o.awakeningOnForm } : {}),
    phases: [
      { id: 'telegraph', trigger: { kind: 'turnCount', n: tel, every }, once: false, actions: [{ kind: 'scriptLine', line: o.telegraphLine }] },
      { id: 'swap', trigger: { kind: 'turnCount', n: tel + 1, every }, once: false, actions: [{ kind: 'setForm', form: 'cycle' }] },
    ],
  };
}

/* ============================ 2. latchDrain ============================ */

export interface LatchDrainOpts {
  /** HP drained from the latched hero each turn (the scene reads latchAmount) */
  amount: number;
  /** the line printed the turn the latch clamps on */
  latchLine: string;
  /** the boss latches on this turn (default 1 — it opens with the grab) */
  latchAt?: number;
}

/**
 * The §A6 Ch.1 Titanic Tick ARCHETYPE: the boss clamps a hero and drains HP
 * each turn until the cure hit (Vibe Fire / a thrown Salt Shaker) releases it.
 * The shipped Tick keeps its bespoke engine latch (S11, frozen law); this
 * template is the data-driven shape for any FUTURE latcher — the scene reads
 * `runner.latchAmount` per turn and calls `releaseLatch()` on the cure.
 */
export function latchDrain(boss: Boss, o: LatchDrainOpts): BossScriptDef {
  return {
    boss,
    phases: [
      {
        id: 'latch',
        trigger: { kind: 'turnCount', n: o.latchAt ?? 1 },
        actions: [{ kind: 'scriptLine', line: o.latchLine }, { kind: 'latch', amount: o.amount }],
      },
    ],
  };
}

/* ============================ 3. summoner ============================ */

export interface SummonerOpts {
  /** the unit summoned (e.g. prefect_drone) and how many per wave */
  minion: string;
  n: number;
  /** the line printed on the opening summon */
  openLine: string;
}

/**
 * The §A6 Ch.3 Headmaster Mainframe: summons a fresh wave the instant every
 * minion is down, forever (bothSummonsDead, repeatable). The "Spy reveals a
 * cooling-fan weak point — Vibe Freeze ×2" lives on the ENEMY's data, not the
 * script: a freeze weakness (super-effective ×1.5) + a `weakMul: 2` override make
 * the freeze hit literally double on the live boss (ADR-099); the script stays pure.
 */
export function summoner(boss: Boss, o: SummonerOpts): BossScriptDef {
  return {
    boss,
    phases: [
      { id: 'open', trigger: { kind: 'turnCount', n: 1 }, actions: [{ kind: 'scriptLine', line: o.openLine }, { kind: 'summon', enemy: o.minion, n: o.n }] },
      { id: 'refill', trigger: { kind: 'bothSummonsDead' }, once: false, actions: [{ kind: 'summon', enemy: o.minion, n: o.n }] },
    ],
  };
}

/* ============================ 4. thresholdHeal ============================ */

export interface ThresholdHealOpts {
  /** heal fires once when HP drops under this fraction */
  frac: number;
  healAmount: number;
  healLine: string;
  /** a recurring status pulse (Cobra Raja's paralyzing gaze every 3rd turn) */
  gaze: { every: number; status: 'crying' | 'asleep' | 'paralyzed' | 'sunburn' | 'hushed'; turns: number };
}

/**
 * The §A6 Ch.7 Cobra Raja: sheds skin ONCE at a HP threshold, restoring a big
 * chunk (burn it down fast through the line), and lays a recurring status pulse
 * every Nth turn (the paralyzing gaze — block with Shield Σ / Mia's Magnet).
 */
export function thresholdHeal(boss: Boss, o: ThresholdHealOpts): BossScriptDef {
  return {
    boss,
    phases: [
      { id: 'shed', trigger: { kind: 'hpBelow', frac: o.frac }, actions: [{ kind: 'scriptLine', line: o.healLine }, { kind: 'healSelf', amount: o.healAmount }] },
      { id: 'gaze', trigger: { kind: 'turnCount', n: o.gaze.every, every: o.gaze.every }, once: false, actions: [{ kind: 'partyStatus', status: o.gaze.status, turns: o.gaze.turns }] },
    ],
  };
}

/* ============================ 5. riddle ============================ */

export interface RiddleOpts {
  /** the DIALOGUE id of the asking pages */
  intro: string;
  /** the pool the fight draws one riddle from (the Sphinx ships 8 for replays) */
  pool: RiddleDef[];
  /** correct → the boss stuns itself this many turns */
  stunTurns: number;
  /** wrong → the party starts under this status */
  wrong: { status: 'crying' | 'asleep' | 'paralyzed' | 'sunburn' | 'hushed'; turns: number };
}

/**
 * The §A6 Ch.6 Laughing Sphinx: opens on a riddle (menu choice). Correct skips
 * its first N turns (stunSelf); wrong starts the party under a status. The pool
 * holds 8 so a replay asks a different one (pickRiddle wraps it).
 */
export function riddle(boss: Boss, o: RiddleOpts): BossScriptDef {
  return {
    boss,
    riddle: { intro: o.intro, pool: o.pool },
    phases: [
      { id: 'right', trigger: { kind: 'riddleAnswered', ok: true }, actions: [{ kind: 'stunSelf', turns: o.stunTurns }] },
      { id: 'wrong', trigger: { kind: 'riddleAnswered', ok: false }, actions: [{ kind: 'partyStatus', status: o.wrong.status, turns: o.wrong.turns }] },
    ],
  };
}

/* ============================ 6. mercyEnding ============================ */

export interface MercyEndingOpts {
  /** the opening theatrical form and the unmasked form it drops into */
  theatrical: BossFormDef;
  unmasked: BossFormDef;
  /** unmask when HP drops under this fraction */
  unmaskAt: number;
  unmaskLine: string;
  /** the boss steals one equipped item on this turn (returned on win) */
  stealAt: number;
  stealLine: string;
  /** a Pray at this tier OR BETTER ends the second phase in mercy */
  prayTier: PrayTier;
}

/**
 * The §A6 Ch.9 Count Hoaxula: theatrical phase (steals one equipped item,
 * returned on win) → unmasked phase at a HP threshold → Mia's Pray at the tier
 * (or better) ends it in MERCY (the game's quietest victory). The stolen gear
 * comes home on the mercy end (returnStolen) and on any other win the scene
 * already returns it.
 */
export function mercyEnding(boss: Boss, o: MercyEndingOpts): BossScriptDef {
  return {
    boss,
    initialForm: o.theatrical.id,
    forms: [o.theatrical, o.unmasked],
    phases: [
      { id: 'steal', trigger: { kind: 'turnCount', n: o.stealAt }, actions: [{ kind: 'scriptLine', line: o.stealLine }, { kind: 'stealEquipped' }] },
      { id: 'unmask', trigger: { kind: 'hpBelow', frac: o.unmaskAt }, actions: [{ kind: 'setForm', form: o.unmasked.id }, { kind: 'scriptLine', line: o.unmaskLine }] },
      { id: 'mercy', trigger: { kind: 'prayTierAtLeast', tier: o.prayTier }, actions: [{ kind: 'returnStolen' }, { kind: 'endBattleMercy' }] },
    ],
  };
}

/* ============================ 7. airborneGrounded ============================ */

export interface AirborneGroundedOpts {
  /** the airborne form: physicalImmune, grounded by `noise` for a beat */
  airborne: BossFormDef;
  /** the noise sources that knock it down (Vibe Volt / Bottle Rockets) */
  noise: NoiseSource[];
  /** how many turns a grounding lasts (default 2 — the §A6 Ch.8 beat) */
  groundedTurns?: number;
  /** when HP drops under this fraction it self-immolates (doubled speed) */
  desperateAt: number;
  desperateLine: string;
  speedMul?: number;
  /** the optional burning form it drops into when desperate */
  burning?: BossFormDef;
}

/**
 * The §A6 Ch.8 Paper Dragon: immune to physical while AIRBORNE; Vibe Volt or
 * Bottle Rockets ground it for two turns (physical lands while grounded — the
 * same suspension the Grin's crack uses). When low it casts Vibe Fire on
 * ITSELF — it's paper — entering a desperate burning phase at doubled speed.
 */
export function airborneGrounded(boss: Boss, o: AirborneGroundedOpts): BossScriptDef {
  const airborne: BossFormDef = {
    ...o.airborne,
    physicalImmune: true,
    groundedBy: o.noise,
    ...(o.groundedTurns ? { groundedTurns: o.groundedTurns } : {}),
  };
  const forms = o.burning ? [airborne, o.burning] : [airborne];
  return {
    boss,
    initialForm: airborne.id,
    forms,
    phases: [
      {
        id: 'desperate',
        trigger: { kind: 'hpBelow', frac: o.desperateAt },
        actions: [
          ...(o.burning ? [{ kind: 'setForm' as const, form: o.burning.id }] : []),
          { kind: 'scriptLine' as const, line: o.desperateLine },
          { kind: 'setSpeedMul' as const, mul: o.speedMul ?? 2 },
        ],
      },
    ],
  };
}

/* ============================ 8. scriptedSurvival ============================ */

export interface ScriptedSurvivalOpts {
  /** the Flat Bell: a second target that grants the boss evasion while it rings */
  bell: { enemy: string; n: number; ringLine: string; brokenLine: string };
  /** every Nth turn it telegraphs a POUNCE (Defend or be knocked flat) */
  pounce: { every: number; line: string };
  /** it gets BORED on this boss turn — a non-kill victory (endBattleMercy) */
  boredAt: number;
  boredLine: string;
}

/**
 * The §A6 Ch.5 Whiskerzilla: an ordinary lost housecat, their kaiju. The Flat
 * Bell is a SECOND 150-HP target that grants it evasion while it rings — break
 * the bell and the purr gives every move away (setEvasion off). It telegraphs
 * a POUNCE every Nth turn. Victory does not defeat it: it gets BORED and wanders
 * off (endBattleMercy on the bored turn — a non-kill win).
 */
export function scriptedSurvival(boss: Boss, o: ScriptedSurvivalOpts): BossScriptDef {
  return {
    boss,
    phases: [
      { id: 'ring', trigger: { kind: 'turnCount', n: 1 }, actions: [{ kind: 'scriptLine', line: o.bell.ringLine }, { kind: 'summon', enemy: o.bell.enemy, n: o.bell.n }, { kind: 'setEvasion', on: true }] },
      { id: 'pounce', trigger: { kind: 'turnCount', n: o.pounce.every, every: o.pounce.every }, once: false, actions: [{ kind: 'scriptLine', line: o.pounce.line }, { kind: 'partyStatus', status: 'paralyzed', turns: 1 }] },
      { id: 'broken', trigger: { kind: 'bothSummonsDead' }, actions: [{ kind: 'setEvasion', on: false }, { kind: 'scriptLine', line: o.bell.brokenLine }] },
      { id: 'bored', trigger: { kind: 'turnCount', n: o.boredAt }, actions: [{ kind: 'scriptLine', line: o.boredLine }, { kind: 'endBattleMercy' }] },
    ],
  };
}

/* ============================ 9. untargetableUntilNoise ============================ */

export interface UntargetableUntilNoiseOpts {
  /** the burrowed form: untargetable, surfaces to `exposed` when noise lands */
  burrowed: BossFormDef;
  exposed: BossFormDef;
  /** the noise that forces it out (Vibe Volt / a Firecracker String) */
  noise: NoiseSource[];
  /** ADR-035: the awakening Mia gets when it surfaces (Vibe Volt α) */
  awakening: string;
  /** every Nth turn it whispers party-wide Hushed pressure */
  hush: { every: number; turns: number };
}

/**
 * The §A6 Ch.4 Whisperwig: burrows into the ear canal — UNTARGETABLE — until
 * NOISE forces it out (Vibe Volt / a Firecracker String → `noiseOut` surfaces
 * it, firing Mia's Vibe Volt α awakening the first time). Every Nth turn it
 * whispers party-wide Hushed. The surface is the awakening beat (ADR-035).
 */
export function untargetableUntilNoise(boss: Boss, o: UntargetableUntilNoiseOpts): BossScriptDef {
  const burrowed: BossFormDef = {
    ...o.burrowed,
    untargetable: true,
    groundedBy: o.noise,
    surfacesTo: o.exposed.id,
  };
  return {
    boss,
    initialForm: burrowed.id,
    forms: [burrowed, o.exposed],
    awakeningOnForm: { form: o.exposed.id, awakening: o.awakening },
    phases: [
      { id: 'hush', trigger: { kind: 'turnCount', n: o.hush.every, every: o.hush.every }, once: false, actions: [{ kind: 'partyStatus', status: 'hushed', turns: o.hush.turns }] },
    ],
  };
}

/* ============================ 10. elementalGolem ============================ */

export interface ElementalGolemOpts {
  /** the stone form: physical-immune, CRACKED by the right element… */
  form: Omit<BossFormDef, 'physicalImmune' | 'crackedBy' | 'healedBy'>;
  /** …the element that works (cracks the stone and lands) */
  weakTo: Element;
  /** …and the WRONG element, which HEALS it instead of harming it */
  healedBy: Element;
  /** an optional periodic slam telegraph */
  slam?: { every: number; line: string };
}

/**
 * The §A6 Ch.10 minibosses (Frost Sentinel, Alaska / Tiki Magma Golem, Hawaii):
 * physical-immune until the RIGHT element cracks the stone (crackedBy = weakTo,
 * the key) — and the WRONG element HEALS it (healedBy → `healsFromElement`, the
 * scene turns that hit into a heal). Read the golem, then pick the element.
 */
export function elementalGolem(boss: Boss, o: ElementalGolemOpts): BossScriptDef {
  const form: BossFormDef = {
    ...o.form,
    physicalImmune: true,
    crackedBy: o.weakTo,
    healedBy: o.healedBy,
  };
  return {
    boss,
    initialForm: form.id,
    forms: [form],
    phases: o.slam
      ? [{ id: 'slam', trigger: { kind: 'turnCount', n: o.slam.every, every: o.slam.every }, once: false, actions: [{ kind: 'scriptLine', line: o.slam.line }] }]
      : [],
  };
}
