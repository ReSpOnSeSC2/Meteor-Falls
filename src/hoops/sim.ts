/**
 * THE CAGE — the deterministic streetball sim (S12, overhauled S12c).
 * Phaser-free on purpose: vitest proves "same seed + same inputs = same final
 * score" headlessly, and HoopsScene is a renderer over this state, never the
 * other way around.
 *
 * THE CABINET LAW (ADR-029, extended by ADR-034): the sim advances on FIXED
 * 8.333ms ticks fed by accumulated dt, every roll goes through the per-match
 * SEEDED rng (the Homesick injectable pattern — zero Math.random anywhere),
 * and shot outcomes resolve AT RELEASE from (release frac, distance, contest,
 * rating, roll) — timing-deterministic. NO RUBBER-BANDING: nothing in here
 * reads the score to pick a behavior; archetypes play themselves.
 *
 * S12c — THE RANGE LAW (the full-court-heave fix): every athlete owns an
 * EFFECTIVE RANGE derived from sht (effectiveRange below). The GREEN window
 * shrinks with distance INSIDE range — the distance term steepens, the
 * farther back the smaller — and CLOSES TO ZERO beyond it: no green exists
 * out there. Non-green make% decays hard past range (zero at 1.5×); AI shot
 * selection only attempts inside its range, with ONE exception — the
 * shot-clock ≤1s desperation heave, which is honestly terrible and reads as
 * one. There is no make-chance floor at distance anymore, anywhere.
 *
 * S12c — THE METER, REBUILT: hold A to fill toward the TOP, where the GREEN
 * window sits AT THE END ([1 − 2·half, 1]); release inside = green (100%),
 * below = make% falls off with distance from the window (METER table:
 * slightly off ≈60%, far ≈20%, way off = ZERO), past the top = overfill =
 * auto-miss. AI shooters run the SAME meter: they enter the gather, plan a
 * release frac off their sht skill, and release when the fill reaches it —
 * which is what makes TIMED BLOCKS readable against them.
 *
 * S12c — TIMED DEFENSE: blocks key on the leap's start time vs the release
 * (BLOCK_TIMING: the leap's peak ±120ms brackets the release → high rate);
 * steals key on the handler's VULNERABILITY WINDOWS (STEAL_TIMING:
 * dribble-move startup, the gather's first beat, pass release). Jumping
 * early just means the shooter can hold the meter and wait you out — the
 * hold-release meter makes pump-faking emergent. GOALTENDING: touching the
 * ball on its way DOWN near the rim counts the basket (blocks stay legal
 * pre-apex).
 *
 * Street rules (S12 canon): 1s and 2s (2 behind the arc), check-up after
 * scores (3v3 checks at the top; the 5v5 equivalent is the take under the
 * rim), CALL YOUR OWN FOULS and nobody ever has (no foul system — the cage
 * polices itself), and no out of bounds: the chain-link is live.
 */
import { COURT_RT, HALF_RT, type Vec, rimForRT, dist, pointsForRT, clampToCageRT, spacingSpotsRT } from './court';
import { s, ART_SCALE } from '../spritegen/scale';
import type { AthleteRating, HoopsArchetype } from '../schemas';

/** fixed sim quantum — 120Hz so pump(n, 8.33) is exactly 1 tick per frame */
export const SIM_DT = 1000 / 120;

export type Rng = () => number;

/** mulberry32 — the maps.ts seeded stream, exported for matches + brackets */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface AthleteDef {
  /** sprite-sheet key (athlete_<id>… — the scene resolves it) */
  key: string;
  /** display name (PERMIT calls it) */
  name: string;
  rating: AthleteRating;
  archetype: HoopsArchetype;
}

export type AthleteState =
  | 'play' // ground game: idle/run/slide read from motion
  | 'gather' // A held (or AI plan) — the over-head shot meter fills
  | 'rise' // jumper airborne, post release
  | 'layup' // driving finish
  | 'dunk' // the cinematic — travels to the rim under its OWN meter
  | 'block' // timed leap
  | 'steal' // the swipe
  | 'spin' // the dribble package (S12c) — startup is a steal window
  | 'btb' // behind-the-back
  | 'btl' // between-the-legs
  | 'stun' // ankle tier 1: wobble, brief slow
  | 'trip' // ankle tier 2: stumbles a step
  | 'fall' // ankle tier 3: flat (the ankle tax)
  | 'celebrate';

export type MoveKind = 'spin' | 'btb' | 'btl';

export interface Athlete {
  def: AthleteDef;
  team: 0 | 1;
  slot: number;
  x: number;
  y: number;
  /** air height; >0 while jumping */
  z: number;
  vz: number;
  face: 1 | -1;
  moving: boolean;
  turbo: boolean;
  state: AthleteState;
  stateT: number;
  /** beaten/recovering — capped speed, no actions */
  beatenT: number;
  /** steal-swipe cooldown */
  swipeCd: number;
  /** block-leap landing recovery — can't re-jump instantly (S12c) */
  leapCd: number;
  /** ms to the leap's apex, stamped at takeoff (BLOCK_TIMING reads it) */
  leapPeakMs: number;
  /** the shot meter: ms gathered (user and AI both fill it) */
  gatherMs: number;
  /** AI's planned release frac (−1 = none; the user releases by hand) */
  planFrac: number;
  /** dunk meter: the captured release frac (−2 unset, −1 = held through) */
  dunkFrac: number;
  /** AI's planned dunk frac (−1 = user dunks by hand) */
  dunkPlan: number;
  /** spacing-spot assignment (offense) */
  spot: number;
  /** AI decision cooldown */
  thinkCd: number;
  /** dunk cinematic index 0..2 (rolled at launch) */
  dunkStyle: number;
  /** crossover/dribble-move burst time remaining */
  burstT: number;
  /** "calls for it" cooldown */
  callCd: number;
}

export type PassStyle = 'chest' | 'bounce' | 'btb';

interface ShotFlight {
  kind: 'shot';
  by: number;
  pts: 1 | 2;
  /** release distance to the rim (the range-law tape reads it off scores) */
  d0: number;
  x0: number;
  y0: number;
  z0: number;
  rim: Vec;
  t: number;
  t1: number;
  apex: number;
  outcome: 'in' | 'rim_in' | 'rim_out' | 'air';
  green: boolean;
  x: number;
  y: number;
  z: number;
}

interface PassFlight {
  kind: 'pass';
  from: number;
  to: number;
  style: PassStyle;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  t1: number;
  /** defender idx who picks it, or null (rolled at launch) */
  picked: number | null;
  /** flight fraction where the pick lands (release picks land early) */
  pickK: number;
  /** the bounce pass touched the floor already (sfx once) */
  bounced: boolean;
  x: number;
  y: number;
  z: number;
}

interface FreeBall {
  kind: 'free';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

interface HeldBall {
  kind: 'held';
  by: number;
}

export type Ball = HeldBall | ShotFlight | PassFlight | FreeBall;

export type AnkleTier = 'stun' | 'trip' | 'fall';

export type SimEvent =
  | { kind: 'score'; team: 0 | 1; pts: 1 | 2; by: number; dist: number; x: number; y: number; green: boolean; dunk: boolean }
  | { kind: 'sfx'; name: string }
  | { kind: 'banner'; text: string; ms: number }
  | { kind: 'permit'; text: string }
  | { kind: 'count'; n: number }
  | { kind: 'check'; team: 0 | 1 }
  | { kind: 'ankles'; victim: number; tier: AnkleTier }
  | { kind: 'move'; who: number; move: MoveKind }
  | { kind: 'stuffed'; by: number }
  | { kind: 'block'; by: number }
  | { kind: 'steal'; by: number }
  | { kind: 'pick'; by: number }
  | { kind: 'timed'; by: number; action: 'steal' | 'block' }
  | { kind: 'goaltend'; by: number }
  | { kind: 'flub'; by: number }
  | { kind: 'heave'; by: number }
  /** a shot/finish died — the HUD prints NO GOOD/AIR at the iron (ADR-038) */
  | { kind: 'miss'; x: number; y: number; air: boolean }
  | { kind: 'violation' }
  | { kind: 'callsForIt'; who: number }
  | { kind: 'quarterEnd'; quarter: number }
  | { kind: 'gameEnd'; us: number; them: number };

export type ShotGrade = 'green' | 'slight' | 'far' | 'brick';

export interface TickInput {
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  /** A — SHOOT: hold gathers, release fires (the meter) */
  aHeld: boolean;
  aPressed: boolean;
  aReleased: boolean;
  /** B — PASS (offense tap) / STEAL SWIPE (defense tap). Tap-responsive. */
  bPressed: boolean;
  /** X — SPRINT (offense turbo / defense slide-burst), dedicated (S12c) */
  xHeld: boolean;
  /** Y — DRIBBLE-MOVE modifier: alone=spin, +lateral=behind-the-back,
   *  +toward-defender=between-the-legs */
  yPressed: boolean;
}

export const IDLE_INPUT: TickInput = {
  dx: 0,
  dy: 0,
  aHeld: false,
  aPressed: false,
  aReleased: false,
  bPressed: false,
  xHeld: false,
  yPressed: false,
};

export interface SimConfig {
  format: '5v5' | '3v3';
  seed: number;
  us: AthleteDef[];
  them: AthleteDef[];
  /** resume support (the v5 quarter checkpoint): scores + period to start */
  scoreUs?: number;
  scoreThem?: number;
  quarter?: number;
  /** ms per 5v5 period (Classic now runs 2-minute quarters; OT matches it) */
  clockMs?: number;
  /** S12c tutorial drill: clocks freeze; the visitors stand down until the
   *  scene arms a drill script (PERMIT teaches, the sim obeys) */
  drill?: boolean;
}

/* ---------------- tuning (data-shaped, tests pin the feel) ---------------- */

export const TUNE = {
  QUARTER_MS: 120_000,
  OT_MS: 120_000,
  SHOT_CLOCK_MS: 24_000,
  CHECK_MS: 900,
  TARGET_3V3: 21,
  /** base run speed px/s; rating adds on top — px/s, scales with the frame */
  RUN: s(84),
  /** px/s added PER spd point (rating is unitless, so this carries the px/s
   *  units and scales — keeps top speed proportional to RUN at any ART_SCALE) */
  SPD_GAIN: s(0.52),
  TURBO_MUL: 1.36, // unitless speed multiplier — KEEP
  SLIDE_MUL: 0.86, // unitless speed multiplier — KEEP
  /** shot meter: 0→1 over this many ms of gather (fill rate; release times shots) */
  METER_MS: 760, // time — KEEP
  /** the meter can overfill to here before it auto-releases (an auto-miss) */
  METER_CAP: 1.12, // meter fraction — KEEP
  /** baseline GREEN half-width at the shooter's feet (range scales it shut) */
  GREEN_BASE: 0.105, // meter fraction — KEEP
  /** double-tap window for the quick crossover */
  XOVER_TAP_MS: 240, // time — KEEP
  /** gravity px/s² and jump launch px/s — BOTH scale, so apex (∝ v²/g) scales
   *  linearly with positions: the jump FEEL is identical at any ART_SCALE */
  GRAVITY: s(700),
  JUMP_V: s(250),
} as const;

/* ============== THE RANGE LAW (S12c — pure, test-pinned) ============== */

export const RANGE = {
  /** px of range per sht point above/below 50, anchored at the arc — sht is
   *  unitless so this literal carries the px units and scales */
  PER_SHT: s(1.2),
  MIN: COURT_RT.ARC_R * 0.85, // derived from the scaled arc — auto-scales
  MAX: COURT_RT.ARC_R * 1.35, // derived from the scaled arc — auto-scales
  /** non-green make% is ZERO at this multiple of range (decays hard to it) */
  DECAY_END: 1.5, // a multiple of range (ratio) — KEEP
  /** the hard-decay band's make ceiling right at the range line */
  DECAY_CAP: 0.12, // a probability ceiling — KEEP
} as const;

/** every athlete's EFFECTIVE RANGE in px, derived from sht */
export function effectiveRange(sht: number): number {
  return Math.max(RANGE.MIN, Math.min(RANGE.MAX, COURT_RT.ARC_R + (sht - 50) * RANGE.PER_SHT));
}

/**
 * GREEN half-width: the shooter's stat opens it, a hand closes it, and RANGE
 * shuts it — quadratically (the distance term STEEPENS: the farther back,
 * the smaller, accelerating), reaching exactly zero AT range. Beyond range
 * there is NO green window. No floor (the 0.022 floor was the heave bug).
 */
export function greenWindow(sht: number, distPx: number, contest: number): number {
  const range = effectiveRange(sht);
  if (distPx >= range) return 0;
  const t = distPx / range;
  const open = TUNE.GREEN_BASE + (sht - 50) * 0.0011 - contest * 0.05;
  const w = open * (1 - t * t);
  return Math.max(0, Math.min(0.16, w));
}

/* ============== THE METER (S12c — green sits AT THE TOP) ============== */

export const METER = {
  /** the fill's top — the GREEN window ENDS here: [1 − 2·half, 1] */
  TOP: 1,
  /** make% falloff below the window, in frac units off its lower edge */
  OFF_SLIGHT: 0.05,
  OFF_FAR: 0.16,
  OFF_DEAD: 0.3,
  GREEN_P: 1.0,
  SLIGHT_P: 0.6,
  FAR_P: 0.2,
} as const;

/** grade a release frac against the live window (overfill = auto-miss) */
export function gradeShot(frac: number, sht: number, distPx: number, contest: number): ShotGrade {
  const half = greenWindow(sht, distPx, contest);
  if (frac > METER.TOP) return 'brick'; // overfilled past the top
  if (half > 0 && frac >= METER.TOP - half * 2) return 'green';
  const off = METER.TOP - half * 2 - frac;
  if (off <= METER.OFF_SLIGHT) return 'slight';
  if (off <= METER.OFF_FAR) return 'far';
  return 'brick';
}

/**
 * Make chance: GREEN IS MONEY (100% — release timing decides) but only where
 * a green can exist; off-window falls off by METER's curve; and the RANGE
 * LAW decays everything hard past range — zero at 1.5×, zero for "way off"
 * anywhere. No floors.
 */
export function makeChance(grade: ShotGrade, sht: number, distPx: number, contest: number): number {
  const range = effectiveRange(sht);
  if (grade === 'green') return distPx >= range ? 0 : METER.GREEN_P;
  if (distPx >= range * RANGE.DECAY_END) return 0;
  let p: number;
  if (grade === 'slight') p = METER.SLIGHT_P;
  else if (grade === 'far') p = METER.FAR_P;
  else return 0; // brick / overfill: way off = ZERO
  p += (sht - 50) * 0.002 - contest * 0.18;
  if (distPx > range) {
    const k = (distPx - range) / (range * (RANGE.DECAY_END - 1));
    p = Math.min(p, (1 - k) * RANGE.DECAY_CAP);
  }
  return Math.max(0, Math.min(1, p));
}

/** contest pressure 0..1 from the nearest defender's reach on the shooter.
 *  d and the 44px reach are both runtime px (their ratio is the unitless
 *  pressure); the 12px z threshold scales too (jump heights scale). */
export function contestOf(dx: number, dy: number, defZ: number): number {
  const d = Math.hypot(dx, dy);
  const reach = s(44);
  if (d > reach) return 0;
  const base = (reach - d) / reach;
  return Math.min(1, base * (defZ > s(12) ? 1.35 : 0.8));
}

/* ============== TIMED DEFENSE (S12c — the weighting tables) ============== */

/**
 * BLOCKS key on TIMING: the leap's start time vs the shooter's release. A
 * jump whose PEAK window (±PEAK_WINDOW_MS) brackets the release blocks at a
 * high rate; jumping early just means the shooter holds the meter and waits
 * you out (pump-faking is emergent — no new button). Exported beside TUNE,
 * curve pinned in vitest.
 */
export const BLOCK_TIMING = {
  /** |leap-elapsed − leap-peak| at the release instant must sit inside this */
  PEAK_WINDOW_MS: 120,
  BASE: 0.1,
  TIMED: 0.65,
  /** (dfn − sht) · this */
  RATING: 0.004,
  /** reach: a release further than this can't be eaten at the hand (px) */
  REACH_PX: s(26),
  /** proximity scale floor — at max reach you keep this fraction */
  PROX_FLOOR: 0.65,
  LO: 0.05,
  HI: 0.85,
  /** landing recovery: no instant re-jump */
  LAND_CD_MS: 240,
} as const;

/** the BLOCK_TIMING curve (pure): offsetMs = leapElapsed − leapPeak at release */
export function blockChance(offsetMs: number, dfn: number, sht: number, distPx: number): number {
  const o = Math.abs(offsetMs);
  const timed = o <= BLOCK_TIMING.PEAK_WINDOW_MS ? 1 - o / BLOCK_TIMING.PEAK_WINDOW_MS : 0;
  let p = BLOCK_TIMING.BASE + (BLOCK_TIMING.TIMED - BLOCK_TIMING.BASE) * timed;
  p += (dfn - sht) * BLOCK_TIMING.RATING;
  p *= BLOCK_TIMING.PROX_FLOOR + (1 - BLOCK_TIMING.PROX_FLOOR) * Math.max(0, 1 - distPx / BLOCK_TIMING.REACH_PX);
  return Math.max(BLOCK_TIMING.LO, Math.min(BLOCK_TIMING.HI, p));
}

/**
 * STEALS key on the handler's VULNERABILITY WINDOWS: dribble-move startup,
 * the gather's first beat, and pass release (the lane pick). A swipe inside
 * a window steals at a high rate; outside it stays low-percentage and a
 * whiff still means BEATEN.
 */
export const STEAL_TIMING = {
  /** the startup/first-beat window length */
  WINDOW_MS: 150,
  NEUTRAL: 0.08,
  TIMED: 0.5,
  /** (dfn − handlerSht) · this */
  RATING: 0.0035,
  HAWK: 0.08,
  LO: 0.04,
  HI: 0.7,
  REACH_PX: s(24), // px reach for the swipe
  /** a failed in-reach swipe leaves you beaten this long */
  WHIFF_BEATEN_MS: 720,
} as const;

/** the STEAL_TIMING curve (pure) */
export function stealChance(dfn: number, hawk: boolean, handlerSht: number, inWindow: boolean): number {
  let p = (inWindow ? STEAL_TIMING.TIMED : STEAL_TIMING.NEUTRAL) + (dfn - handlerSht) * STEAL_TIMING.RATING + (hawk ? STEAL_TIMING.HAWK : 0);
  return Math.max(STEAL_TIMING.LO, Math.min(STEAL_TIMING.HI, p));
}

export function stuffChance(atkDnk: number, defDfn: number, defAirborne: boolean): number {
  const p = 0.18 + (defDfn - atkDnk) * 0.005 + (defAirborne ? 0.34 : 0);
  return Math.max(0.04, Math.min(0.85, p));
}

/* ============== THE DRIBBLE PACKAGE (S12c) ============== */

export const MOVES = {
  /** the move's startup — a steal-vulnerability window (the price of sauce) */
  STARTUP_MS: 150,
  TOTAL_MS: 430,
  /** burst carried out of a completed move (btb/btl add a little) */
  BURST_MS: 240,
  /** a set defender further than this can't be broken (px) */
  BREAK_RANGE_PX: s(36),
} as const;

/** tiered ankle outcomes: fractions of ankleChance — roll under LARGE·p =
 *  the FALL, under SMALL·p = the trip, under p = the stun, else held */
export const ANKLE_TIERS = { LARGE: 0.3, SMALL: 0.62 } as const;

export function ankleChance(atkSpd: number, defSpd: number, defCommitted: boolean): number {
  const p = 0.17 + (atkSpd - defSpd) * 0.005 + (defCommitted ? 0.24 : 0);
  return Math.max(0.04, Math.min(0.62, p));
}

/* ============== THE DUNK METER (S12c — same mechanic, own window) ========= */

export const DUNK_METER = {
  /** the dunk flight = the meter's travel (release inside the window) */
  MS: 520,
  BASE: 0.07,
  PER_DNK: 0.0011,
  CONTEST: 0.04,
  LO: 0.022,
  HI: 0.14,
} as const;

export function dunkWindow(dnk: number, contest: number): number {
  const w = DUNK_METER.BASE + (dnk - 50) * DUNK_METER.PER_DNK - contest * DUNK_METER.CONTEST;
  return Math.max(DUNK_METER.LO, Math.min(DUNK_METER.HI, w));
}

/* ============== THE LAYUP METER (ADR-038 — the forgiving finish) ========= */

/**
 * Layups run the SAME finish meter as dunks with a GENEROUS window — the
 * finish is easy to GENERATE (drive at the rim and press A; no sprint gate)
 * and the TIMING decides it. Green is money; off the window the make
 * falls away fast and a hand makes everything worse.
 */
export const LAYUP_METER = {
  /** the layup run = the meter's travel */
  MS: 430,
  BASE: 0.11,
  PER_SHT: 0.0008,
  CONTEST: 0.035,
  LO: 0.05,
  HI: 0.17,
  /** off-window make: p = OFF_P0 − off·OFF_DECAY − contest·OFF_CONTEST */
  OFF_P0: 0.8,
  OFF_DECAY: 2.4,
  OFF_CONTEST: 0.25,
} as const;

export function layupWindow(sht: number, contest: number): number {
  const w = LAYUP_METER.BASE + (sht - 50) * LAYUP_METER.PER_SHT - contest * LAYUP_METER.CONTEST;
  return Math.max(LAYUP_METER.LO, Math.min(LAYUP_METER.HI, w));
}

/** the rim-finish trigger: this close, MOVING toward a press = the finish
 *  (no turbo gate — ADR-038 made the finish easy to reach, timed to make).
 *  A px distance to the rim — scales with the court. */
export const FINISH_RANGE_PX = s(165);

/** 3v3 street game-over: FIRST TO 21, WIN BY 2 (pure — tests pin it) */
export function pickupGameOver(us: number, them: number): boolean {
  return Math.max(us, them) >= TUNE.TARGET_3V3 && Math.abs(us - them) >= 2;
}

/** what the over-head meter HUD draws for one athlete */
export interface MeterRead {
  frac: number;
  /** the window's lower edge (it ENDS at METER.TOP) — live, shrinks as
   *  defenders close and range taxes it */
  lo: number;
  kind: 'shot' | 'dunk' | 'layup';
}

/* ======================================================================== */

export class HoopsSim {
  readonly format: '5v5' | '3v3';
  readonly perSide: number;
  athletes: Athlete[] = [];
  ball: Ball = { kind: 'held', by: 0 };
  /** team that last possessed (for flight/free balls) */
  posTeam: 0 | 1 = 0;
  scoreUs = 0;
  scoreThem = 0;
  quarter = 1;
  clockMs: number;
  shotMs: number = TUNE.SHOT_CLOCK_MS;
  phase: 'check' | 'live' | 'dead' = 'check';
  checkT = 0;
  over = false;
  /** index the user drives this tick (handler on O, nearest-ball on D) */
  controlled = 0;
  events: SimEvent[] = [];
  /** simulated ms this period (drives anims + deterministic patterns) */
  t = 0;
  /** S12c drill mode (the tutorial): clocks freeze, visitors obey the script */
  readonly drill: boolean;
  /** what the drill dummies do: stand · shoot on a loop · sauce on a loop */
  drillScript: 'stand' | 'shoot' | 'moves' = 'stand';

  private rng: Rng;
  private readonly seed: number;
  private acc = 0;
  /** crossover double-tap bookkeeping: last tap dir + sim time */
  private lastTapDir = 0;
  private lastTapT = -9999;
  private prevDx: -1 | 0 | 1 = 0;
  /** shot-clock seconds already counted out loud */
  private counted = new Set<number>();
  /** pending end-of-period once the live ball dies */
  private hornPending = false;

  constructor(cfg: SimConfig) {
    this.format = cfg.format;
    this.perSide = cfg.format === '5v5' ? 5 : 3;
    this.seed = cfg.seed;
    this.drill = cfg.drill === true;
    this.scoreUs = cfg.scoreUs ?? 0;
    this.scoreThem = cfg.scoreThem ?? 0;
    this.quarter = cfg.quarter ?? 1;
    this.clockMs = cfg.clockMs ?? (this.quarter > 4 ? TUNE.OT_MS : TUNE.QUARTER_MS);
    this.rng = makeRng(this.periodSeed());
    cfg.us.slice(0, this.perSide).forEach((def, i) => this.athletes.push(this.spawn(def, 0, i)));
    cfg.them.slice(0, this.perSide).forEach((def, i) => this.athletes.push(this.spawn(def, 1, i)));
    // the opening take alternates by period (Q2/Q4 are theirs) — and a
    // RESUMED quarter must open exactly like the live one did (v5 law)
    this.startCheck(this.quarter % 2 === 0 ? 1 : 0);
  }

  /** quarter-keyed sub-seed: a resumed Q3 replays exactly like a live Q3 */
  private periodSeed(): number {
    return (this.seed ^ (this.quarter * 7919)) >>> 0;
  }

  private spawn(def: AthleteDef, team: 0 | 1, slot: number): Athlete {
    return {
      def,
      team,
      slot,
      x: COURT_RT.W / 2,
      y: COURT_RT.H / 2,
      z: 0,
      vz: 0,
      face: team === 0 ? 1 : -1,
      moving: false,
      turbo: false,
      state: 'play',
      stateT: 0,
      beatenT: 0,
      swipeCd: 0,
      leapCd: 0,
      leapPeakMs: 0,
      gatherMs: 0,
      planFrac: -1,
      dunkFrac: -2,
      dunkPlan: -1,
      spot: slot,
      thinkCd: 0,
      dunkStyle: 0,
      burstT: 0,
      callCd: 0,
    };
  }

  /* ---------------- geometry helpers ---------------- */

  /** the rim a team attacks. 3v3: everyone plays the near (left) rim. */
  rimOf(team: 0 | 1): Vec {
    if (this.format === '3v3') return { x: HALF_RT.RIM.x, y: HALF_RT.RIM.y };
    return rimForRT(team === 0);
  }

  private holderIdx(): number | null {
    return this.ball.kind === 'held' ? this.ball.by : null;
  }

  holder(): Athlete | null {
    const i = this.holderIdx();
    return i === null ? null : this.athletes[i];
  }

  ballPos(): { x: number; y: number; z: number } {
    if (this.ball.kind === 'held') {
      const h = this.athletes[this.ball.by];
      // hand/hip/grip offsets — all px, scale with the frame
      return { x: h.x + h.face * s(9), y: h.y + s(2), z: s(12) + h.z };
    }
    return { x: this.ball.x, y: this.ball.y, z: this.ball.z };
  }

  /** the over-head meter for athlete i (HUD reads it; null = no meter).
   *  The window edge is LIVE — a defender closing space shrinks it mid-hold
   *  (release-time numbers are what the shot rolls on, the law). */
  meterOf(i: number): MeterRead | null {
    const a = this.athletes[i];
    if (a.state === 'gather') {
      const rim = this.rimOf(a.team);
      const half = greenWindow(a.def.rating.sht, dist(a.x, a.y, rim.x, rim.y), this.nearestContest(a));
      return { frac: Math.min(TUNE.METER_CAP, a.gatherMs / TUNE.METER_MS), lo: METER.TOP - half * 2, kind: 'shot' };
    }
    if (a.state === 'dunk') {
      const half = dunkWindow(a.def.rating.dnk, this.nearestContest(a));
      const frac = a.dunkFrac >= -1 && a.dunkFrac !== -2 ? a.dunkFrac : Math.min(TUNE.METER_CAP, a.stateT / DUNK_METER.MS);
      return { frac, lo: METER.TOP - half * 2, kind: 'dunk' };
    }
    if (a.state === 'layup') {
      const half = layupWindow(a.def.rating.sht, this.nearestContest(a));
      const frac = a.dunkFrac >= -1 && a.dunkFrac !== -2 ? a.dunkFrac : Math.min(TUNE.METER_CAP, a.stateT / LAYUP_METER.MS);
      return { frac, lo: METER.TOP - half * 2, kind: 'layup' };
    }
    return null;
  }

  private emit(e: SimEvent): void {
    this.events.push(e);
  }

  /* ---------------- period / check flow ---------------- */

  /** place everyone for a check-up; `team` takes the ball (scored-on team) */
  private startCheck(team: 0 | 1): void {
    this.phase = 'check';
    this.checkT = 0;
    this.posTeam = team;
    this.shotMs = TUNE.SHOT_CLOCK_MS;
    this.counted.clear();
    const three = this.format === '3v3';
    const attackRim = this.rimOf(team);
    const spotBase: Vec = three
      ? { x: HALF_RT.CHECK.x, y: HALF_RT.CHECK.y }
      : { x: this.rimOf(team === 0 ? 1 : 0).x, y: COURT_RT.RIM_Y }; // take under your own rim
    let handler: Athlete | null = null;
    for (const a of this.athletes) {
      a.state = 'play';
      a.stateT = 0;
      a.z = 0;
      a.vz = 0;
      a.beatenT = 0;
      a.burstT = 0;
      a.gatherMs = 0;
      a.planFrac = -1;
      a.dunkFrac = -2;
      a.dunkPlan = -1;
      const lane = (a.slot - (this.perSide - 1) / 2) * (three ? s(84) : s(64)); // px lane spacing
      if (a.team === team) {
        if (a.slot === 0) {
          a.x = spotBase.x;
          a.y = spotBase.y;
          handler = a;
        } else {
          // spread between the check spot and the attack end
          a.x = spotBase.x + (attackRim.x - spotBase.x) * 0.35;
          a.y = COURT_RT.RIM_Y + lane;
        }
      } else {
        // defense sets between their marks and the rim they protect
        a.x = spotBase.x + (attackRim.x - spotBase.x) * (a.slot === 0 ? 0.18 : 0.55);
        a.y = COURT_RT.RIM_Y + lane * 0.8;
      }
      clampToCageRT(a);
      a.face = a.x < attackRim.x ? 1 : -1;
    }
    if (handler) {
      this.ball = { kind: 'held', by: this.athletes.indexOf(handler) };
    }
    this.emit({ kind: 'check', team });
  }

  /** begin the next 5v5 period (scene calls this off the quarter-break UI) */
  startQuarter(q: number): void {
    this.quarter = q;
    this.clockMs = q > 4 ? TUNE.OT_MS : TUNE.QUARTER_MS;
    this.rng = makeRng(this.periodSeed());
    this.t = 0;
    this.hornPending = false;
    this.over = false;
    this.phase = 'check';
    // alternating takes: even quarters Q2/Q4 give them the ball first
    this.startCheck(q % 2 === 0 ? 1 : 0);
  }

  /** drill helper (the tutorial's defense leg): hand the visitors the ball */
  drillGiveBall(team: 0 | 1): void {
    this.startCheck(team);
  }

  /* ==================== the tick ==================== */

  /** edges seen by advance() that no tick has consumed yet (ADR-038) */
  private pendA = false;
  private pendAr = false;
  private pendB = false;
  private pendY = false;

  /**
   * Feed real dt; the sim quantizes to SIM_DT ticks (cabinet law). EDGES ARE
   * LOSSLESS (ADR-038): a frame shorter than one quantum runs zero ticks —
   * its press/release edges CARRY to the next frame's first tick instead of
   * vanishing. At 120Hz (dt ≈ 8.3ms vs the 8.333ms quantum) roughly every
   * other frame is sub-quantum; before this carry, half of all shot presses
   * and meter releases were silently dropped. That was the reported bug.
   */
  advance(dtMs: number, input: TickInput): void {
    this.acc += Math.min(dtMs, 100);
    this.pendA = this.pendA || input.aPressed;
    this.pendAr = this.pendAr || input.aReleased;
    this.pendB = this.pendB || input.bPressed;
    this.pendY = this.pendY || input.yPressed;
    let first = true;
    while (this.acc >= SIM_DT) {
      this.acc -= SIM_DT;
      if (first) {
        // edges land on the first quantum that actually runs; held on all
        this.tick({ ...input, aPressed: this.pendA, aReleased: this.pendAr, bPressed: this.pendB, yPressed: this.pendY });
        this.pendA = this.pendAr = this.pendB = this.pendY = false;
        first = false;
      } else {
        this.tick({ ...input, aPressed: false, aReleased: false, bPressed: false, yPressed: false });
      }
    }
  }

  tick(input: TickInput): void {
    if (this.phase === 'dead') return;
    this.t += SIM_DT;
    if (this.phase === 'check') {
      this.checkT += SIM_DT;
      if (this.checkT >= TUNE.CHECK_MS) this.phase = 'live';
      this.pickControlled();
      return;
    }

    // ---- clocks (5v5; the 3v3 game self-polices to 21; drills freeze) ----
    if (this.format === '5v5' && !this.hornPending && !this.drill) {
      this.clockMs = Math.max(0, this.clockMs - SIM_DT);
      if (this.ball.kind === 'held') {
        this.shotMs -= SIM_DT;
        const secs = Math.ceil(this.shotMs / 1000);
        if (this.shotMs > 0 && secs <= 5 && !this.counted.has(secs)) {
          this.counted.add(secs);
          this.emit({ kind: 'count', n: secs });
        }
        if (this.shotMs <= 0) {
          this.emit({ kind: 'violation' });
          this.emit({ kind: 'sfx', name: 'buzzer' });
          this.startCheck(this.posTeam === 0 ? 1 : 0);
          return;
        }
      }
      if (this.clockMs <= 0) {
        if (this.ball.kind === 'shot') {
          this.hornPending = true; // the release beat the horn — let it land
        } else {
          this.endPeriod();
          return;
        }
      }
    }

    this.pickControlled();
    const holder = this.holder();

    // ---- the user's athlete ----
    const user = this.athletes[this.controlled];
    if (user.team === 0) {
      if (holder && holder === user) this.userOffense(user, input);
      else this.userDefenseOrOffBall(user, input);
    }

    // ---- AI for everyone else ----
    this.athletes.forEach((a, i) => {
      if (i === this.controlled && a.team === 0) return;
      this.ai(a);
    });

    // ---- integrate motion + air + timers ----
    for (const a of this.athletes) this.integrate(a);

    // ---- the ball ----
    this.updateBall();
  }

  private endPeriod(): void {
    this.hornPending = false;
    this.emit({ kind: 'sfx', name: 'buzzer' });
    const last = this.quarter >= 4;
    if (last && this.scoreUs !== this.scoreThem) {
      this.finishGame();
      return;
    }
    this.phase = 'dead';
    this.emit({ kind: 'quarterEnd', quarter: this.quarter });
  }

  private finishGame(): void {
    this.phase = 'dead';
    this.over = true;
    for (const a of this.athletes) {
      const won = (this.scoreUs > this.scoreThem) === (a.team === 0);
      a.state = won ? 'celebrate' : 'play';
      a.stateT = 0;
    }
    this.emit({ kind: 'gameEnd', us: this.scoreUs, them: this.scoreThem });
  }

  /* ---------------- control routing ---------------- */

  private pickControlled(): void {
    const holder = this.holder();
    if (holder && holder.team === 0) {
      this.controlled = this.athletes.indexOf(holder);
      return;
    }
    if (this.ball.kind === 'pass' && this.athletes[this.ball.to].team === 0) {
      this.controlled = this.ball.to;
      return;
    }
    // defense (or scramble): nearest of ours to the ball, with hysteresis
    const bp = this.ballPos();
    const cur = this.athletes[this.controlled];
    let best = -1;
    let bestD = Infinity;
    this.athletes.forEach((a, i) => {
      if (a.team !== 0) return;
      const d = dist(a.x, a.y, bp.x, bp.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0) return;
    if (cur.team !== 0 || dist(cur.x, cur.y, bp.x, bp.y) > bestD + s(22)) this.controlled = best; // px hysteresis
  }

  /* ---------------- user input: offense ---------------- */

  private userOffense(a: Athlete, input: TickInput): void {
    if (a.state === 'gather') {
      a.gatherMs += SIM_DT;
      const frac = a.gatherMs / TUNE.METER_MS;
      if (input.aReleased || frac >= TUNE.METER_CAP) {
        this.releaseJumper(a, Math.min(TUNE.METER_CAP, frac));
      }
      return;
    }
    if (a.state === 'dunk' || a.state === 'layup') {
      // the FINISH meter (dunk or layup): release A inside the window;
      // held all the way through = overfill = the miss you earned
      if (input.aReleased && a.dunkFrac === -2) {
        const T = a.state === 'dunk' ? DUNK_METER.MS : LAYUP_METER.MS;
        a.dunkFrac = Math.min(TUNE.METER_CAP, a.stateT / T);
      }
      return;
    }
    if (a.state !== 'play') return;

    // quick crossover: double-tap a horizontal direction (S12 canon)
    if (input.dx !== 0 && input.dx !== this.prevDx) {
      if (input.dx === this.lastTapDir && this.t - this.lastTapT < TUNE.XOVER_TAP_MS) {
        this.crossover(a, input.dx);
        this.lastTapT = -9999;
      } else {
        this.lastTapDir = input.dx;
        this.lastTapT = this.t;
      }
    }
    this.prevDx = input.dx;

    // Y — THE DRIBBLE PACKAGE: alone = spin; +lateral = behind-the-back;
    // +toward-defender = between-the-legs (the startup is a steal window)
    if (input.yPressed) {
      this.dribbleMove(a, this.pickMoveKind(a, input.dx, input.dy));
      return;
    }

    // B — PASS, on the tap (responsive; X owns sprint now)
    if (input.bPressed) {
      this.pass(a, input.dx, input.dy);
      return;
    }

    // X — SPRINT (dedicated)
    a.turbo = input.xHeld;

    // A — gather into the over-head meter, or the contextual rim finish.
    // ADR-038: the finish triggers on plain MOVEMENT near the rim (no
    // sprint gate) — easy to generate, the meter decides it.
    if (input.aPressed) {
      const rim = this.rimOf(a.team);
      const d = dist(a.x, a.y, rim.x, rim.y);
      if (d < FINISH_RANGE_PX && a.moving) {
        if (a.def.rating.dnk >= 40) this.startDunk(a, true);
        else this.startLayup(a, true);
        return;
      }
      a.state = 'gather';
      a.stateT = 0;
      a.moving = false;
      a.gatherMs = 0;
      a.planFrac = -1;
      this.emit({ kind: 'sfx', name: 'gather' });
      // a tap that pressed AND released inside this same tick is a quick
      // flick — it releases NOW (lossless and honest: near-zero fill)
      if (input.aReleased) this.releaseJumper(a, SIM_DT / TUNE.METER_MS);
      return;
    }

    this.steer(a, input.dx, input.dy);
  }

  /** spin alone · btb on lateral input · btl when the held direction points
   *  at the nearest set defender (the sauce goes THROUGH him) */
  private pickMoveKind(a: Athlete, dx: number, dy: number): MoveKind {
    if (dx === 0 && dy === 0) return 'spin';
    const def = this.nearestDefender(a);
    if (def) {
      const toDef = Math.atan2(def.y - a.y, def.x - a.x);
      const aim = Math.atan2(dy, dx);
      let da = Math.abs(toDef - aim);
      if (da > Math.PI) da = 2 * Math.PI - da;
      if (da < 0.9 && dist(a.x, a.y, def.x, def.y) < s(52)) return 'btl'; // 0.9 rad cone; 52px proximity
    }
    return 'btb';
  }

  private nearestDefender(a: Athlete): Athlete | null {
    let best: Athlete | null = null;
    let bd = Infinity;
    for (const b of this.athletes) {
      if (b.team === a.team || b.state === 'fall') continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best;
  }

  /* ---------------- user input: defense / off-ball ---------------- */

  private userDefenseOrOffBall(a: Athlete, input: TickInput): void {
    if (a.state !== 'play') return;
    a.turbo = input.xHeld;
    if (input.bPressed) this.swipe(a);
    if (input.aPressed && a.z === 0 && a.leapCd <= 0) this.blockLeap(a);
    this.steer(a, input.dx, input.dy);
  }

  private blockLeap(a: Athlete): void {
    a.state = 'block';
    a.stateT = 0;
    // vz is px/s: JUMP_V is scaled and the per-dnk bonus carries px/s units too
    // (dnk is unitless), so vz scales. peakMs = vz/GRAVITY is a ratio of two
    // scaled speeds → the leap's TIMING is identical at any ART_SCALE.
    a.vz = TUNE.JUMP_V + a.def.rating.dnk * s(0.6);
    a.leapPeakMs = (a.vz / TUNE.GRAVITY) * 1000;
    this.emit({ kind: 'sfx', name: 'jump' });
  }

  private steer(a: Athlete, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) {
      a.moving = false;
      return;
    }
    const len = Math.hypot(dx, dy);
    const sp = this.speedOf(a);
    a.x += (dx / len) * sp * (SIM_DT / 1000);
    a.y += (dy / len) * sp * (SIM_DT / 1000);
    a.moving = true;
    if (dx !== 0) a.face = dx > 0 ? 1 : -1;
    this.clampWalker(a);
  }

  private clampWalker(a: Athlete): void {
    clampToCageRT(a);
    if (this.format === '3v3') a.x = Math.min(a.x, HALF_RT.X_MAX);
  }

  private speedOf(a: Athlete): number {
    let sp = TUNE.RUN + a.def.rating.spd * TUNE.SPD_GAIN;
    const defending = this.posTeam !== a.team;
    if (a.turbo) sp *= TUNE.TURBO_MUL;
    if (defending && !a.turbo) sp *= TUNE.SLIDE_MUL;
    if (a.burstT > 0) sp *= 1.55;
    if (a.beatenT > 0) sp *= 0.45;
    return sp;
  }

  /* ---------------- the dribble package ---------------- */

  /** the quick crossover (double-tap) — the package's instant entry */
  private crossover(a: Athlete, dir: -1 | 1): void {
    a.burstT = 260;
    a.face = dir;
    this.emit({ kind: 'sfx', name: 'bounce' });
    const def = this.nearestDefender(a);
    if (!def || def.state !== 'play' || dist(a.x, a.y, def.x, def.y) > s(34)) return; // 34px break range
    const committed = def.moving && Math.sign(def.x - a.x) !== Math.sign(dir);
    this.resolveBreak(a, def, committed, 0.8);
  }

  /** Y-move: spin / behind-the-back / between-the-legs — startup is a steal
   *  window; completion rolls the TIERED ankle ladder vs the nearest set
   *  defender's commitment, then carries a burst out the far side */
  private dribbleMove(a: Athlete, kind: MoveKind): void {
    if (a.state !== 'play') return;
    a.state = kind;
    a.stateT = 0;
    a.moving = false;
    this.emit({ kind: 'move', who: this.athletes.indexOf(a), move: kind });
    this.emit({ kind: 'sfx', name: kind === 'spin' ? 'spin' : 'bounce' });
  }

  /** the ankle ladder: one seeded roll, three rungs (ANKLE_TIERS splits) */
  private resolveBreak(a: Athlete, def: Athlete, committed: boolean, mult: number): void {
    const p = ankleChance(a.def.rating.spd, def.def.rating.spd, committed) * mult;
    const r = this.rng();
    const vi = this.athletes.indexOf(def);
    if (r < p * ANKLE_TIERS.LARGE) {
      def.state = 'fall';
      def.stateT = 0;
      def.beatenT = 950;
      this.emit({ kind: 'ankles', victim: vi, tier: 'fall' });
      this.emit({ kind: 'sfx', name: 'thud' });
    } else if (r < p * ANKLE_TIERS.SMALL) {
      def.state = 'trip';
      def.stateT = 0;
      def.beatenT = 620;
      // the stumble carries him a step the wrong way (px)
      def.x += -a.face * s(6);
      this.clampWalker(def);
      this.emit({ kind: 'ankles', victim: vi, tier: 'trip' });
      this.emit({ kind: 'sfx', name: 'thud' });
    } else if (r < p) {
      def.state = 'stun';
      def.stateT = 0;
      def.beatenT = 380;
      this.emit({ kind: 'ankles', victim: vi, tier: 'stun' });
    }
  }

  /* ---------------- passes (three styles, picked by context) ------------ */

  /** B-tap pass: nearest teammate inside the held d-pad cone (aim it).
   *  Style is contextual: BEHIND-THE-BACK when the target sits behind the
   *  passer's facing; BOUNCE when a hand waits in the lane (goes UNDER it —
   *  lower pick chance, slower); CHEST otherwise. */
  private pass(a: Athlete, dx: number, dy: number): void {
    if (this.ball.kind !== 'held') return;
    const from = this.athletes.indexOf(a);
    const aim = dx !== 0 || dy !== 0 ? Math.atan2(dy, dx) : null;
    let best = -1;
    let bestScore = Infinity;
    this.athletes.forEach((m, i) => {
      if (m.team !== a.team || i === from) return;
      const ang = Math.atan2(m.y - a.y, m.x - a.x);
      const d = dist(a.x, a.y, m.x, m.y);
      if (aim !== null) {
        let da = Math.abs(ang - aim);
        if (da > Math.PI) da = 2 * Math.PI - da;
        if (da > 0.96) return; // outside the cone (radians)
        // pick score blends angle (radians · 220) with distance: take d in
        // NATIVE px so the px term keeps the same weight vs. the angle term at
        // any ART_SCALE (a ×4 d would otherwise swamp the cone preference)
        const score = da * 220 + (d / ART_SCALE) * 0.25;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      } else if (d < bestScore) {
        bestScore = d;
        best = i;
      }
    });
    if (best < 0) return;
    const to = this.athletes[best];
    // lead the cutter: aim where they're going, not where they were (px)
    const lead = to.moving ? s(30) : 0;
    const x1 = to.x + lead * (to.face > 0 ? 1 : -1) * 0.7;
    const y1 = to.y;
    const lineLen = Math.max(1, dist(a.x, a.y, x1, y1));

    // the lane read: nearest defender standing close to the line
    let laneDef: number | null = null;
    let laneT = 0;
    this.athletes.forEach((d, i) => {
      if (d.team === a.team || d.beatenT > 0) return;
      const t = Math.max(0, Math.min(1, ((d.x - a.x) * (x1 - a.x) + (d.y - a.y) * (y1 - a.y)) / lineLen ** 2));
      const lx = a.x + (x1 - a.x) * t;
      const ly = a.y + (y1 - a.y) * t;
      if (dist(d.x, d.y, lx, ly) > s(13) || t < 0.15 || t > 0.85) return; // 13px lane; t is a fraction
      if (laneDef === null) {
        laneDef = i;
        laneT = t;
      }
    });

    // style by context
    const toAng = Math.atan2(y1 - a.y, x1 - a.x);
    const faceAng = a.face > 0 ? 0 : Math.PI;
    let dFace = Math.abs(toAng - faceAng);
    if (dFace > Math.PI) dFace = 2 * Math.PI - dFace;
    const style: PassStyle = dFace > 1.75 ? 'btb' : laneDef !== null ? 'bounce' : 'chest';

    // flight is a DURATION (ms): it must stay scale-invariant so the ball
    // crosses the (now bigger) gap in the same time as ×1 — i.e. implicitly
    // faster in px/s, matching every other scaled motion. lineLen is runtime
    // px, so divide it back to native before the ms-per-px coefficient.
    let flight = Math.max(180, (lineLen / ART_SCALE) * 1.45);
    if (style === 'bounce') flight *= 1.35; // slower — the price of safe (ratio)
    if (style === 'btb') flight *= 1.1;

    // pass-release window (STEAL_TIMING): a defender MID-SWIPE at the
    // passer's hip picks the release itself — the lane pick, timed
    let picked: number | null = null;
    let pickK = 0.12;
    this.athletes.forEach((d, i) => {
      if (picked !== null || d.team === a.team) return;
      if (d.state !== 'steal' || d.stateT > STEAL_TIMING.WINDOW_MS) return;
      if (dist(d.x, d.y, a.x, a.y) > STEAL_TIMING.REACH_PX + s(4)) return; // +4px margin
      this.emit({ kind: 'timed', by: i, action: 'steal' });
      if (this.rng() < stealChance(d.def.rating.dfn, d.def.archetype === 'hawk', a.def.rating.sht, true)) picked = i;
    });
    // the standing lane hand (un-timed, low-percentage; bounce goes UNDER it)
    if (picked === null && laneDef !== null) {
      const d = this.athletes[laneDef];
      const base = stealChance(d.def.rating.dfn, d.def.archetype === 'hawk', a.def.rating.sht, false) + 0.05;
      const p = style === 'bounce' ? base * 0.45 : base;
      if (this.rng() < p) {
        picked = laneDef;
        pickK = Math.max(0.3, Math.min(0.7, laneT));
      }
    }

    this.ball = {
      kind: 'pass',
      from,
      to: best,
      style,
      x0: a.x + a.face * s(9), // hand-release offset (px)
      y0: a.y,
      x1,
      y1,
      t: 0,
      t1: flight,
      picked,
      pickK,
      bounced: false,
      x: a.x,
      y: a.y,
      z: s(22), // ball leaves at chest height (px)
    };
    this.emit({ kind: 'sfx', name: style === 'bounce' ? 'bounce' : 'pass' });
  }

  /* ---------------- steals (the windows) ---------------- */

  /** is the handler inside a vulnerability window right now? */
  vulnerableNow(h: Athlete): boolean {
    if ((h.state === 'spin' || h.state === 'btb' || h.state === 'btl') && h.stateT < STEAL_TIMING.WINDOW_MS) return true;
    if (h.state === 'gather' && h.gatherMs < STEAL_TIMING.WINDOW_MS) return true;
    return false;
  }

  private swipe(a: Athlete): void {
    if (a.swipeCd > 0 || a.state !== 'play') return;
    a.swipeCd = 380;
    a.state = 'steal';
    a.stateT = 0;
    this.emit({ kind: 'sfx', name: 'swipe' });
    const h = this.holder();
    if (!h || h.team === a.team) return;
    if (dist(a.x, a.y, h.x, h.y) > STEAL_TIMING.REACH_PX) return;
    const inWindow = this.vulnerableNow(h);
    if (inWindow) this.emit({ kind: 'timed', by: this.athletes.indexOf(a), action: 'steal' });
    if (this.rng() < stealChance(a.def.rating.dfn, a.def.archetype === 'hawk', h.def.rating.sht, inWindow)) {
      // stripped mid-move/mid-gather: the handler's action dies with the ball
      if (h.state === 'gather' || h.state === 'spin' || h.state === 'btb' || h.state === 'btl') {
        h.state = 'play';
        h.stateT = 0;
        h.gatherMs = 0;
        h.planFrac = -1;
      }
      this.ball = { kind: 'held', by: this.athletes.indexOf(a) };
      this.posTeam = a.team;
      this.shotMs = TUNE.SHOT_CLOCK_MS;
      this.counted.clear();
      this.emit({ kind: 'steal', by: this.athletes.indexOf(a) });
      this.emit({ kind: 'sfx', name: 'steal' });
    } else {
      a.beatenT = STEAL_TIMING.WHIFF_BEATEN_MS; // whiffed — BEATEN
    }
  }

  /* ---------------- finishes ---------------- */

  private startDunk(a: Athlete, byUser: boolean): void {
    a.state = 'dunk';
    a.stateT = 0;
    a.dunkStyle = Math.floor(this.rng() * 3);
    a.dunkFrac = -2;
    if (byUser) {
      a.dunkPlan = -1;
    } else {
      // AI plans its dunk release off dnk skill — same window, same meter
      const skill = Math.min(0.92, 0.35 + a.def.rating.dnk * 0.008);
      const half = dunkWindow(a.def.rating.dnk, 0);
      a.dunkPlan = this.rng() < skill ? METER.TOP - this.rng() * half * 1.8 : Math.max(0.5, METER.TOP - half * 2 - 0.03 - this.rng() * 0.2);
    }
    this.emit({ kind: 'sfx', name: 'jump' });
  }

  private startLayup(a: Athlete, byUser: boolean): void {
    a.state = 'layup';
    a.stateT = 0;
    a.dunkFrac = -2;
    if (byUser) {
      a.dunkPlan = -1;
    } else {
      // AI plans its layup release off sht — same meter, same law (ADR-038)
      const skill = Math.min(0.93, 0.42 + a.def.rating.sht * 0.0075);
      const half = layupWindow(a.def.rating.sht, 0);
      a.dunkPlan = this.rng() < skill ? METER.TOP - this.rng() * half * 1.8 : Math.max(0.5, METER.TOP - half * 2 - 0.03 - this.rng() * 0.18);
    }
    this.emit({ kind: 'sfx', name: 'jump' });
  }

  /** the jumper leaves the hand — outcome rolls NOW (timing-deterministic) */
  private releaseJumper(a: Athlete, frac: number): void {
    const rim = this.rimOf(a.team);
    const d = dist(a.x, a.y, rim.x, rim.y);
    const contest = this.nearestContest(a);
    const grade = gradeShot(frac, a.def.rating.sht, d, contest);
    a.state = 'rise';
    a.stateT = 0;
    a.vz = TUNE.JUMP_V * 0.9;
    a.gatherMs = 0;
    a.planFrac = -1;
    // a TIMED block eats the release outright (BLOCK_TIMING is the law)
    const blocker = this.findBlocker(a);
    if (blocker) {
      // swatted: x/z are px positions, the rest are px/s knockback velocities
      this.looseBall(a.x + a.face * s(8), a.y, s(30), blocker.face * s(90), (this.rng() - 0.5) * s(60), s(120));
      this.emit({ kind: 'block', by: this.athletes.indexOf(blocker) });
      this.emit({ kind: 'sfx', name: 'block' });
      return;
    }
    this.launchShot(a, rim, d, grade, contest);
  }

  private launchShot(a: Athlete, rim: Vec, d: number, grade: ShotGrade, contest: number): void {
    const pts = pointsForRT(a.x, a.y, rim);
    const p = makeChance(grade, a.def.rating.sht, d, contest);
    const roll = this.rng();
    const made = roll < p;
    let outcome: ShotFlight['outcome'];
    if (made) outcome = grade === 'green' ? 'in' : this.rng() < 0.55 ? 'in' : 'rim_in';
    else outcome = grade === 'brick' && this.rng() < 0.4 ? 'air' : 'rim_out';
    this.ball = {
      kind: 'shot',
      by: this.athletes.indexOf(a),
      pts,
      d0: d,
      x0: a.x + a.face * s(6), // release offset (px)
      y0: a.y,
      z0: s(46) + a.z, // release height (px)
      rim,
      t: 0,
      // t1 is a DURATION (ms): the 480ms base stays, and the distance term is
      // taken in NATIVE px so the arc lasts the same time at any ART_SCALE
      t1: 480 + (d / ART_SCALE) * 0.5,
      // apex is a z POSITION (px): RIM_Z + the 34px base scale; the d term
      // already scales because d is runtime px
      apex: COURT_RT.RIM_Z + s(34) + d * 0.07,
      outcome,
      green: grade === 'green',
      x: a.x,
      y: a.y,
      z: s(46) + a.z,
    };
    if (grade === 'green') this.emit({ kind: 'sfx', name: 'green' });
  }

  /** a defender mid-leap whose PEAK brackets this release (BLOCK_TIMING) */
  private findBlocker(shooter: Athlete): Athlete | null {
    for (const b of this.athletes) {
      if (b.team === shooter.team || b.state !== 'block') continue;
      const d = dist(b.x, b.y, shooter.x, shooter.y);
      if (d > BLOCK_TIMING.REACH_PX) continue;
      const offset = b.stateT - b.leapPeakMs;
      if (Math.abs(offset) <= BLOCK_TIMING.PEAK_WINDOW_MS) {
        this.emit({ kind: 'timed', by: this.athletes.indexOf(b), action: 'block' });
      }
      if (this.rng() < blockChance(offset, b.def.rating.dfn, shooter.def.rating.sht, d)) return b;
    }
    return null;
  }

  private nearestContest(a: Athlete): number {
    let c = 0;
    for (const b of this.athletes) {
      if (b.team === a.team) continue;
      c = Math.max(c, contestOf(b.x - a.x, b.y - a.y, b.z));
    }
    return c;
  }

  private looseBall(x: number, y: number, z: number, vx: number, vy: number, vz: number): void {
    this.ball = { kind: 'free', x, y, z, vx, vy, vz };
  }

  /* ---------------- AI ---------------- */

  private ai(a: Athlete): void {
    if (a.state === 'fall' || a.state === 'stun' || a.state === 'trip' || a.state === 'celebrate') return;
    a.thinkCd -= SIM_DT;
    const holder = this.holder();
    // drill dummies obey the script (the tutorial's controlled reps)
    if (this.drill && a.team === 1) {
      this.aiDrill(a, holder);
      return;
    }
    // THE SCRAMBLE: a loose ball gets chased — each side's nearest free body
    // goes and GETS it (the user's athlete is excluded from team 0's pick so
    // an AI teammate always covers the floor even while a tape dawdles)
    if (this.ball.kind === 'free') {
      const bp = this.ball;
      let nearest: Athlete | null = null;
      let nd = Infinity;
      for (const m of this.athletes) {
        if (m.team !== a.team || m.state !== 'play' || m.beatenT > 0) continue;
        if (m.team === 0 && this.athletes.indexOf(m) === this.controlled) continue;
        const d = dist(m.x, m.y, bp.x, bp.y);
        if (d < nd) {
          nd = d;
          nearest = m;
        }
      }
      if (nearest === a) {
        this.seek(a, bp.x, bp.y, true);
        return;
      }
    }
    const onO = this.posTeam === a.team;
    if (holder === a) {
      if (a.team === 0 && this.athletes.indexOf(a) === this.controlled) return;
      this.aiHandler(a);
      return;
    }
    if (onO) this.aiOffBall(a, holder);
    else this.aiDefense(a);
  }

  /** tutorial dummies: stand at marks · shoot on a loop · sauce on a loop */
  private aiDrill(a: Athlete, holder: Athlete | null): void {
    if (holder !== a) {
      if (this.ball.kind === 'free') {
        // somebody fetches so the drill never stalls
        this.seek(a, this.ball.x, this.ball.y, false);
      }
      return;
    }
    if (a.state === 'gather') {
      a.gatherMs += SIM_DT;
      if (a.planFrac >= 0 && a.gatherMs / TUNE.METER_MS >= a.planFrac) this.releaseJumper(a, a.planFrac);
      return;
    }
    if (a.state !== 'play') return;
    a.thinkCd -= 0; // drills run on stateT cadence below
    if (this.drillScript === 'shoot') {
      if (a.stateT > 1100) {
        const rim = this.rimOf(a.team);
        const d = dist(a.x, a.y, rim.x, rim.y);
        this.aiShoot(a, d, this.nearestContest(a));
      }
      return;
    }
    if (this.drillScript === 'moves') {
      if (a.stateT > 950) {
        const kinds: MoveKind[] = ['spin', 'btb', 'btl'];
        this.dribbleMove(a, kinds[Math.floor(this.rng() * 3)]);
      }
      return;
    }
    // 'stand': hold the rock and wait to be taught on
  }

  private aiHandler(a: Athlete): void {
    // mid-gather: the AI fills the SAME meter and releases at its plan —
    // which is exactly what a timed block leap reads against
    if (a.state === 'gather') {
      a.gatherMs += SIM_DT;
      if (a.planFrac >= 0 && a.gatherMs / TUNE.METER_MS >= a.planFrac) {
        this.releaseJumper(a, a.planFrac);
      }
      return;
    }
    if (a.state !== 'play') return;
    const rim = this.rimOf(a.team);
    const d = dist(a.x, a.y, rim.x, rim.y);
    const contest = this.nearestContest(a);
    const range = effectiveRange(a.def.rating.sht);
    const inRange = d <= range * 0.96; // the RANGE GATE — AI shoots its game
    const forced = this.format === '5v5' && this.shotMs < 4200 && !this.drill;
    if (a.thinkCd > 0 && !forced) {
      this.seek(a, a.x + a.face * s(30), a.y, false); // drift 30px up-court
      return;
    }
    a.thinkCd = 620;
    const arch = a.def.archetype;
    const r = this.rng();
    // finishing range — everybody takes the rim when it's there (64px)
    if (d < s(64) && contest < 0.55) {
      if (a.def.rating.dnk >= 52 && r < 0.6) this.startDunk(a, false);
      else this.startLayup(a, false);
      return;
    }
    if (forced) {
      if (inRange) {
        this.aiShoot(a, d, contest);
      } else if (this.shotMs <= 1000) {
        // the lone exception to the range gate: the desperation heave —
        // honestly terrible (brick grade, zero past 1.5×range) and it
        // READS as one (PERMIT files it under "prayers, unanswered")
        this.heave(a, rim, d, contest);
      } else {
        this.driveTo(a, rim); // get inside your range first
      }
      return;
    }
    const driveLane = this.laneOpen(a, rim);
    // the sauce: ball-dominant archetypes break out the package (their
    // startup is a real steal window — the risk is the price)
    if ((arch === 'rusher' || arch === 'balanced') && driveLane && contest > 0.25 && r < 0.16) {
      const kinds: MoveKind[] = ['spin', 'btb', 'btl'];
      this.dribbleMove(a, kinds[Math.floor(this.rng() * 3)]);
      return;
    }
    switch (arch) {
      case 'rusher':
        if (driveLane || r < 0.25) this.driveTo(a, rim);
        else if (r < 0.45) this.aiPass(a);
        else this.seek(a, rim.x - Math.sign(rim.x - a.x) * s(110), rim.y + (r - 0.5) * s(120), true); // reset 110/120px off the rim
        return;
      case 'sniper': {
        const behind = d > COURT_RT.ARC_R;
        if (behind && inRange && contest < 0.3 && r < 0.62) {
          this.aiShoot(a, d, contest);
          return;
        }
        if (r < 0.3) this.aiPass(a);
        else this.seek(a, rim.x - Math.sign(rim.x - a.x) * (COURT_RT.ARC_R + s(14)), rim.y + (r - 0.5) * s(190), false); // spot up a step beyond the arc (px)
        return;
      }
      case 'post':
        if (d < s(96) && inRange && r < 0.55) {
          this.aiShoot(a, d, contest);
          return;
        }
        if (r < 0.25) this.aiPass(a);
        else this.driveTo(a, { x: rim.x + (rim.x > COURT_RT.W / 2 ? -s(52) : s(52)), y: rim.y + (r - 0.5) * s(70) }); // post up 52/70px off the block
        return;
      default:
        if (driveLane && r < 0.4) this.driveTo(a, rim);
        else if (r < 0.42) this.aiPass(a);
        else if (d < s(120) && inRange && contest < 0.32 && r < 0.7) this.aiShoot(a, d, contest);
        else this.seek(a, rim.x - Math.sign(rim.x - a.x) * s(120), rim.y + (r - 0.5) * s(150), false); // reset 120/150px out
    }
  }

  /** AI enters the gather and PLANS a release frac off its sht skill — the
   *  same window the player faces, graded at release by the same law. No
   *  score reads, no bands — the rating IS the player. */
  private aiShoot(a: Athlete, d: number, contest: number): void {
    a.state = 'gather';
    a.stateT = 0;
    a.gatherMs = 0;
    a.moving = false;
    const sht = a.def.rating.sht;
    const half = greenWindow(sht, d, contest);
    const skill = Math.min(0.92, 0.3 + sht * 0.0085);
    if (half > 0 && this.rng() < skill) {
      a.planFrac = METER.TOP - this.rng() * half * 1.8; // inside the window
    } else {
      const lo = METER.TOP - half * 2;
      a.planFrac = Math.max(0.45, lo - 0.02 - this.rng() * 0.16); // under it
    }
    this.emit({ kind: 'sfx', name: 'gather' });
  }

  /** the ≤1s desperation heave: no gather, brick grade, reads as a prayer */
  private heave(a: Athlete, rim: Vec, d: number, contest: number): void {
    a.state = 'rise';
    a.stateT = 0;
    a.vz = TUNE.JUMP_V * 0.9;
    this.emit({ kind: 'heave', by: this.athletes.indexOf(a) });
    this.launchShot(a, rim, d, 'brick', contest);
  }

  private aiPass(a: Athlete): void {
    // find the most open teammate ahead of the play
    let best: Athlete | null = null;
    let bestOpen = -1;
    for (const m of this.athletes) {
      if (m.team !== a.team || m === a || m.state !== 'play') continue;
      let near = Infinity;
      for (const d of this.athletes) {
        if (d.team === a.team) continue;
        near = Math.min(near, dist(m.x, m.y, d.x, d.y));
      }
      if (near > bestOpen) {
        bestOpen = near;
        best = m;
      }
    }
    if (!best || bestOpen < s(30)) return; // needs 30px of daylight
    const dx = Math.sign(best.x - a.x) as -1 | 0 | 1;
    const dy = Math.sign(best.y - a.y) as -1 | 0 | 1;
    this.pass(a, dx, dy);
  }

  private laneOpen(a: Athlete, rim: Vec): boolean {
    for (const d of this.athletes) {
      if (d.team === a.team || d.beatenT > 0) continue;
      const t = Math.max(0, Math.min(1, ((d.x - a.x) * (rim.x - a.x) + (d.y - a.y) * (rim.y - a.y)) / Math.max(1, dist(a.x, a.y, rim.x, rim.y) ** 2)));
      const lx = a.x + (rim.x - a.x) * t;
      const ly = a.y + (rim.y - a.y) * t;
      if (dist(d.x, d.y, lx, ly) < s(26)) return false; // 26px lane clearance
    }
    return true;
  }

  private driveTo(a: Athlete, p: Vec): void {
    a.turbo = a.def.archetype === 'rusher' || this.rng() < 0.4;
    this.seek(a, p.x, p.y, a.turbo);
  }

  private aiOffBall(a: Athlete, holder: Athlete | null): void {
    if (a.state !== 'play') return;
    const rim = this.rimOf(a.team);
    const spots = spacingSpotsRT(rim, this.format === '5v5' ? a.team === 0 : false);
    const spot = spots[(a.spot + this.quarter) % spots.length];
    // cut when the handler drives: nearest teammate dives baseline (px gates)
    if (holder && dist(holder.x, holder.y, rim.x, rim.y) < s(130) && dist(a.x, a.y, rim.x, rim.y) < s(200)) {
      this.seek(a, rim.x + (rim.x > COURT_RT.W / 2 ? -s(30) : s(30)), rim.y + (a.slot % 2 === 0 ? -s(46) : s(46)), true);
      return;
    }
    this.seek(a, spot.x, spot.y, false);
    // call for it when open and the ball stalls (the cage hears about it)
    a.callCd -= SIM_DT;
    if (a.callCd <= 0 && holder && holder.team === a.team) {
      let near = Infinity;
      for (const d of this.athletes) {
        if (d.team === a.team) continue;
        near = Math.min(near, dist(a.x, a.y, d.x, d.y));
      }
      if (near > s(56) && !a.moving) { // open by 56px and standing
        a.callCd = 3400;
        this.emit({ kind: 'callsForIt', who: this.athletes.indexOf(a) });
      }
    }
  }

  private aiDefense(a: Athlete): void {
    if (a.state !== 'play') return;
    const rimD = this.rimOf(this.posTeam); // the rim being attacked
    const mark = this.athletes.find((m) => m.team !== a.team && m.slot === a.slot);
    const holder = this.holder();
    const onBall = holder !== null && mark === holder;
    // hawk gamble: jump the lane when pressing the ball (honest tendency) —
    // and every defender SWIPES THE WINDOW when the handler shows startup
    if (onBall && holder && a.swipeCd <= 0 && dist(a.x, a.y, holder.x, holder.y) < STEAL_TIMING.REACH_PX) {
      const window = this.vulnerableNow(holder);
      const gamble = a.def.archetype === 'hawk' ? 0.012 : 0.004;
      if (window ? this.rng() < 0.04 + a.def.rating.dfn * 0.0008 : this.rng() < gamble) {
        this.swipe(a);
        return;
      }
    }
    // AI block: TIME the leap so its peak meets the shooter's release — read
    // off the mark's meter fill, exactly the read the player makes
    if (mark && mark.state === 'gather' && dist(a.x, a.y, mark.x, mark.y) < s(38) && a.z === 0 && a.leapCd <= 0) {
      const frac = mark.gatherMs / TUNE.METER_MS;
      // peakMs mirrors blockLeap exactly: vz (px/s, scaled) / GRAVITY (px/s²,
      // scaled) → the leap's time-to-apex is the same ms at any ART_SCALE, so
      // the meter-fill jump cue (jumpAt) is unchanged. The per-dnk 0.6 scales.
      const peakMs = ((TUNE.JUMP_V + a.def.rating.dnk * s(0.6)) / TUNE.GRAVITY) * 1000;
      const jumpAt = 1 - peakMs / TUNE.METER_MS;
      if (frac >= jumpAt - 0.05 && this.rng() < 0.09 + a.def.rating.dfn * 0.0012) {
        this.blockLeap(a);
        return;
      }
    }
    // a late hop at a rising shooter still happens (it just times poorly, 30px)
    if (mark && mark.state === 'rise' && dist(a.x, a.y, mark.x, mark.y) < s(30) && a.z === 0 && a.leapCd <= 0) {
      if (this.rng() < 0.05 + a.def.rating.dfn * 0.0007) {
        this.blockLeap(a);
        return;
      }
    }
    // help: collapse on a drive in my lane (px gates)
    if (holder && dist(holder.x, holder.y, rimD.x, rimD.y) < s(96) && dist(a.x, a.y, rimD.x, rimD.y) < s(130) && !onBall) {
      this.seek(a, (holder.x + rimD.x) / 2, (holder.y + rimD.y) / 2, true);
      return;
    }
    if (!mark) return;
    const gap = onBall ? 0.22 : 0.42;
    const tx = mark.x + (rimD.x - mark.x) * gap;
    const ty = mark.y + (rimD.y - mark.y) * gap;
    this.seek(a, tx, ty, onBall && mark.turbo);
  }

  private seek(a: Athlete, x: number, y: number, turbo: boolean): void {
    const dx = x - a.x;
    const dy = y - a.y;
    const d = Math.hypot(dx, dy);
    if (d < s(5)) { // arrived within 5px
      a.moving = false;
      return;
    }
    a.turbo = turbo;
    const sp = this.speedOf(a);
    a.x += (dx / d) * sp * (SIM_DT / 1000);
    a.y += (dy / d) * sp * (SIM_DT / 1000);
    a.moving = true;
    if (Math.abs(dx) > s(2)) a.face = dx > 0 ? 1 : -1; // 2px facing deadzone
    this.clampWalker(a);
  }

  /* ---------------- integration ---------------- */

  private integrate(a: Athlete): void {
    const prevT = a.stateT;
    a.stateT += SIM_DT;
    a.beatenT = Math.max(0, a.beatenT - SIM_DT);
    a.swipeCd = Math.max(0, a.swipeCd - SIM_DT);
    a.leapCd = Math.max(0, a.leapCd - SIM_DT);
    a.burstT = Math.max(0, a.burstT - SIM_DT);
    if (a.burstT > 0 && a.state === 'play') {
      // burst crawl: 1.55px/frame · 60fps = px/s, scales with the frame
      a.x += a.face * s(1.55) * (SIM_DT / 1000) * 60;
      this.clampWalker(a);
    }
    // air
    if (a.z > 0 || a.vz !== 0) {
      a.z += a.vz * (SIM_DT / 1000);
      a.vz -= TUNE.GRAVITY * (SIM_DT / 1000);
      if (a.z <= 0) {
        a.z = 0;
        a.vz = 0;
        if (a.state === 'block' || a.state === 'rise') {
          a.state = 'play';
          a.stateT = 0;
          // landing recovery both ways: no instant re-leap, and the scene
          // reads this window for the knees-soft land frame (S12c)
          a.leapCd = BLOCK_TIMING.LAND_CD_MS;
          a.leapPeakMs = 0;
        }
      }
    }
    if (a.state === 'steal' && a.stateT > 260) {
      a.state = 'play';
      a.stateT = 0;
    }
    if (a.state === 'stun' && a.stateT > 380) {
      a.state = 'play';
      a.stateT = 0;
    }
    if (a.state === 'trip' && a.stateT > 620) {
      a.state = 'play';
      a.stateT = 0;
    }
    if (a.state === 'fall' && a.stateT > 900) {
      a.state = 'play';
      a.stateT = 0;
    }
    // the dribble package: startup ends → the break rolls; move completes →
    // burst out the far side (the move carried you somewhere)
    if (a.state === 'spin' || a.state === 'btb' || a.state === 'btl') {
      if (prevT < MOVES.STARTUP_MS && a.stateT >= MOVES.STARTUP_MS && this.holderIdx() === this.athletes.indexOf(a)) {
        const def = this.nearestDefender(a);
        if (def && def.state === 'play' && dist(a.x, a.y, def.x, def.y) <= MOVES.BREAK_RANGE_PX) {
          const committed = def.moving;
          const mult = a.state === 'spin' ? 1.0 : a.state === 'btb' ? 1.05 : 1.15;
          this.resolveBreak(a, def, committed, mult);
        }
      }
      if (a.stateT >= MOVES.TOTAL_MS) {
        const kind = a.state;
        a.state = 'play';
        a.stateT = 0;
        a.burstT = MOVES.BURST_MS + (kind === 'btl' ? 60 : kind === 'btb' ? 30 : 0);
      }
    }
    // the rim runs: layup/dunk travel to the hoop and finish
    if (a.state === 'layup' || a.state === 'dunk') {
      const rim = this.rimOf(a.team);
      const T = a.state === 'dunk' ? DUNK_METER.MS : 430;
      const k = Math.min(1, a.stateT / T);
      a.x += (rim.x - a.x) * k * 0.28;
      a.y += (rim.y - a.y) * k * 0.28;
      // hop apex (z px): RIM_Z scaled, the ±8/14px tweaks scale too
      a.z = Math.sin(k * Math.PI) * (a.state === 'dunk' ? COURT_RT.RIM_Z + s(8) : COURT_RT.RIM_Z - s(14));
      if (k >= 1) this.finishAtRim(a);
    }
  }

  private finishAtRim(a: Athlete): void {
    const rim = this.rimOf(a.team);
    const i = this.athletes.indexOf(a);
    const dunk = a.state === 'dunk';
    const dunkFrac = a.dunkPlan >= 0 ? a.dunkPlan : a.dunkFrac === -2 ? TUNE.METER_CAP : a.dunkFrac;
    a.state = 'play';
    a.stateT = 0;
    a.z = 0;
    a.vz = 0;
    a.dunkFrac = -2;
    a.dunkPlan = -1;
    if (this.ball.kind !== 'held' || this.ball.by !== i) return;
    const contest = this.nearestContest(a);
    if (dunk) {
      // THE DUNK METER (S12c): green = the slam; a missed meter is a
      // rim-hang flub — STUFFED instead when somebody contested the summit
      const half = dunkWindow(a.def.rating.dnk, contest);
      const green = half > 0 && dunkFrac <= METER.TOP && dunkFrac >= METER.TOP - half * 2;
      if (green) {
        this.scoreBasket(a.team, 1, rim, false, true, i, 0);
        return;
      }
      let stuffer: Athlete | null = null;
      for (const b of this.athletes) {
        if (b.team === a.team) continue;
        if (dist(b.x, b.y, rim.x, rim.y) < s(30) && (b.state === 'block' || b.z > s(18))) { // 30px at the summit, 18px off the floor
          if (this.rng() < stuffChance(a.def.rating.dnk, b.def.rating.dfn, b.state === 'block')) stuffer = b;
          break;
        }
      }
      if (stuffer) {
        // stuffed: z is a px height, the trailing three are px/s knockback
        this.looseBall(rim.x, rim.y, COURT_RT.RIM_Z - s(8), -a.face * s(110), (this.rng() - 0.5) * s(90), s(60));
        this.emit({ kind: 'stuffed', by: this.athletes.indexOf(stuffer) });
        this.emit({ kind: 'sfx', name: 'block' });
        return;
      }
      this.looseBall(rim.x, rim.y, COURT_RT.RIM_Z, -a.face * s(60), (this.rng() - 0.5) * s(80), s(100));
      this.emit({ kind: 'flub', by: i });
      this.emit({ kind: 'sfx', name: 'rim' });
      return;
    }
    // THE LAYUP METER (ADR-038): green is money; off the window the make
    // falls away fast and the contest taxes what's left. Timing decides.
    const half = layupWindow(a.def.rating.sht, contest);
    const green = half > 0 && dunkFrac <= METER.TOP && dunkFrac >= METER.TOP - half * 2;
    if (green) {
      this.scoreBasket(a.team, 1, rim, true, false, i, 0);
      return;
    }
    const off = dunkFrac > METER.TOP ? TUNE.METER_CAP - METER.TOP : METER.TOP - half * 2 - dunkFrac;
    const p = Math.max(0, LAYUP_METER.OFF_P0 - off * LAYUP_METER.OFF_DECAY - contest * LAYUP_METER.OFF_CONTEST);
    if (this.rng() < p) {
      this.scoreBasket(a.team, 1, rim, false, false, i, 0);
    } else {
      // rimmed-out layup: px/s scatter off the iron
      this.looseBall(rim.x, rim.y, COURT_RT.RIM_Z, (this.rng() - 0.5) * s(120), (this.rng() - 0.5) * s(100), s(90));
      this.emit({ kind: 'miss', x: rim.x, y: rim.y, air: false });
      this.emit({ kind: 'sfx', name: 'rim' });
    }
  }

  private scoreBasket(team: 0 | 1, pts: 1 | 2, at: Vec, green: boolean, dunk: boolean, by: number, distPx: number): void {
    if (team === 0) this.scoreUs += pts;
    else this.scoreThem += pts;
    this.emit({ kind: 'score', team, pts, by, dist: distPx, x: at.x, y: at.y, green, dunk });
    this.emit({ kind: 'sfx', name: dunk ? 'dunk' : 'swish' });
    if (this.format === '3v3' && pickupGameOver(this.scoreUs, this.scoreThem)) {
      this.finishGame();
      return;
    }
    if (this.hornPending) {
      this.endPeriod();
      return;
    }
    this.startCheck(team === 0 ? 1 : 0);
  }

  /* ---------------- ball flight ---------------- */

  private updateBall(): void {
    const b = this.ball;
    if (b.kind === 'held') {
      const h = this.athletes[b.by];
      this.posTeam = h.team;
      return;
    }
    if (b.kind === 'pass') {
      b.t += SIM_DT;
      const k = Math.min(1, b.t / b.t1);
      b.x = b.x0 + (b.x1 - b.x0) * k;
      b.y = b.y0 + (b.y1 - b.y0) * k;
      // flight profile by style: the bounce pass dives UNDER hands in the
      // lane and kisses the floor at the midpoint; btb rides low and flat
      if (b.style === 'bounce') {
        // dive-under-the-hands profile (z px): down to the floor, back up
        b.z = k < 0.5 ? s(18) * (1 - k * 2) : s(14) * ((k - 0.5) * 2);
        if (!b.bounced && k >= 0.5) {
          b.bounced = true;
          this.emit({ kind: 'sfx', name: 'bounce' });
        }
      } else if (b.style === 'btb') {
        b.z = s(16) + Math.sin(k * Math.PI) * s(8); // low and flat (px)
      } else {
        b.z = s(22) + Math.sin(k * Math.PI) * s(16); // chest arc (px)
      }
      if (b.picked !== null && k >= b.pickK) {
        const d = this.athletes[b.picked];
        this.ball = { kind: 'held', by: b.picked };
        this.posTeam = d.team;
        this.shotMs = TUNE.SHOT_CLOCK_MS;
        this.counted.clear();
        this.emit({ kind: 'pick', by: b.picked });
        this.emit({ kind: 'sfx', name: 'steal' });
        return;
      }
      if (k >= 1) {
        const to = this.athletes[b.to];
        if (dist(to.x, to.y, b.x1, b.y1) < s(34) && to.state !== 'fall') { // 34px catch radius
          this.ball = { kind: 'held', by: b.to };
          this.posTeam = to.team;
          this.emit({ kind: 'sfx', name: 'catch' });
        } else {
          this.looseBall(b.x, b.y, b.z, (b.x1 - b.x0) * 0.4, (b.y1 - b.y0) * 0.4, 0);
        }
      }
      return;
    }
    if (b.kind === 'shot') {
      b.t += SIM_DT;
      const k = Math.min(1, b.t / b.t1);
      // air balls die short; everything else flies to the iron
      const reach = b.outcome === 'air' ? 0.88 : 1; // air balls fall short (ratio)
      b.x = b.x0 + (b.rim.x - b.x0) * k * reach;
      b.y = b.y0 + (b.rim.y - b.y0) * k * reach;
      const z1 = b.outcome === 'air' ? COURT_RT.RIM_Z - s(18) : COURT_RT.RIM_Z; // 18px short of the iron
      b.z = b.z0 + (z1 - b.z0) * k + Math.sin(k * Math.PI) * (b.apex - Math.max(b.z0, z1));
      // GOALTENDING (S12c): near the rim, an airborne defender's hand on the
      // ball — pre-apex contact is a LIVE block (legal); on the way DOWN it
      // is a violation and the basket COUNTS. PERMIT saw it. We all saw it.
      if (k < 1 && dist(b.x, b.y, b.rim.x, b.rim.y) < s(44)) { // within 44px of the iron
        const shooter = this.athletes[b.by];
        for (let i = 0; i < this.athletes.length; i++) {
          const d = this.athletes[i];
          if (d.team === shooter.team || d.z <= s(12)) continue; // airborne (12px up)
          if (dist(d.x, d.y, b.x, b.y) > s(11)) continue; // hand on the ball within 11px
          if (Math.abs(b.z - (d.z + s(36))) > s(10)) continue; // reach 36px overhead, 10px band
          if (k < 0.5) {
            // pre-apex swat: px/s knockback
            this.looseBall(b.x, b.y, b.z, d.face * s(80), (this.rng() - 0.5) * s(60), s(60));
            this.emit({ kind: 'block', by: i });
            this.emit({ kind: 'sfx', name: 'block' });
          } else {
            this.emit({ kind: 'goaltend', by: i });
            this.scoreBasket(shooter.team, b.pts, b.rim, b.green, false, b.by, b.d0);
          }
          return;
        }
      }
      if (k < 1) return;
      const shooter = this.athletes[b.by];
      switch (b.outcome) {
        case 'in':
        case 'rim_in':
          if (b.outcome === 'rim_in') this.emit({ kind: 'sfx', name: 'rim' });
          this.scoreBasket(shooter.team, b.pts, b.rim, b.green, false, b.by, b.d0);
          return;
        case 'rim_out': {
          this.emit({ kind: 'miss', x: b.rim.x, y: b.rim.y, air: false });
          this.emit({ kind: 'sfx', name: 'rim' });
          if (this.format === '5v5') {
            this.shotMs = TUNE.SHOT_CLOCK_MS; // iron resets the count (street)
            this.counted.clear();
          }
          const ang = this.rng() * Math.PI * 2; // radians
          const sp = s(60) + this.rng() * s(90); // px/s carom off the rim
          this.looseBall(b.rim.x, b.rim.y, COURT_RT.RIM_Z, Math.cos(ang) * sp, Math.sin(ang) * sp * 0.7, s(110) + this.rng() * s(60));
          return;
        }
        case 'air': {
          this.emit({ kind: 'miss', x: b.x, y: b.y, air: true });
          this.emit({ kind: 'permit', text: 'AIR. THE PIGEONS FELT THAT.' });
          this.looseBall(b.x, b.y, b.z, (b.rim.x - b.x0) * 0.12, (b.rim.y - b.y0) * 0.12, 0);
          return;
        }
      }
      return;
    }
    // free ball: gravity + cage walls (no out of bounds — the fence is live)
    b.x += b.vx * (SIM_DT / 1000);
    b.y += b.vy * (SIM_DT / 1000);
    b.z += b.vz * (SIM_DT / 1000);
    b.vz -= TUNE.GRAVITY * (SIM_DT / 1000);
    if (b.z <= 0) {
      b.z = 0;
      // px/s velocity gates; 0.55 restitution and 0.8 friction are ratios
      b.vz = Math.abs(b.vz) > s(40) ? -b.vz * 0.55 : 0;
      b.vx *= 0.8;
      b.vy *= 0.8;
      if (Math.abs(b.vz) > s(30)) this.emit({ kind: 'sfx', name: 'bounce' });
    }
    // the live fence inset 4px in from the apron (px)
    const fx = -COURT_RT.FENCE + s(4);
    const fx1 = COURT_RT.W + COURT_RT.FENCE - s(4);
    const fy = -COURT_RT.FENCE + s(4);
    const fy1 = COURT_RT.H + COURT_RT.FENCE - s(4);
    if (b.x < fx || b.x > fx1) {
      b.vx = -b.vx * 0.6;
      b.x = Math.max(fx, Math.min(fx1, b.x));
      this.emit({ kind: 'sfx', name: 'fence' });
    }
    if (b.y < fy || b.y > fy1) {
      b.vy = -b.vy * 0.6;
      b.y = Math.max(fy, Math.min(fy1, b.y));
      this.emit({ kind: 'sfx', name: 'fence' });
    }
    // the scramble: first body on it takes it (board work is dfn+dnk)
    if (b.z < s(28)) { // ball is grabbable below 28px
      let best: number | null = null;
      let bestScore = -Infinity;
      this.athletes.forEach((a, i) => {
        if (a.beatenT > 0 || a.state === 'fall') return;
        const d = dist(a.x, a.y, b.x, b.y);
        if (d > s(17)) return; // reach the ball within 17px
        // ranking is in rating-point space: the distance penalty uses NATIVE
        // px (divide the scaled d) so it weighs the same against ratings/noise
        // at any ART_SCALE — otherwise a ×4 d would swamp the ratings
        const score = (a.def.rating.dfn + a.def.rating.dnk) / 2 - (d / ART_SCALE) * 2 + this.rng() * 14;
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      });
      if (best !== null) {
        const winner = this.athletes[best];
        this.ball = { kind: 'held', by: best };
        const changed = winner.team !== this.posTeam;
        this.posTeam = winner.team;
        if (changed || this.format === '5v5') {
          this.shotMs = TUNE.SHOT_CLOCK_MS;
          this.counted.clear();
        }
        if (this.hornPending) this.endPeriod();
      }
    }
  }
}
