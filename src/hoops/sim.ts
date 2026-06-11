/**
 * THE CAGE — the deterministic streetball sim (S12). Phaser-free on purpose:
 * vitest proves "same seed + same inputs = same final score" headlessly, and
 * HoopsScene is a renderer over this state, never the other way around.
 *
 * THE CABINET LAW (ADR-029, extended by ADR-034): the sim advances on FIXED
 * 8.333ms ticks fed by accumulated dt, every roll goes through the per-match
 * SEEDED rng (the Homesick injectable pattern — zero Math.random anywhere),
 * and shot outcomes resolve AT RELEASE from (grade, distance, contest,
 * rating, roll) — timing-deterministic. NO RUBBER-BANDING: nothing in here
 * reads the score to pick a behavior; archetypes play themselves.
 *
 * Street rules (S12 canon): 1s and 2s (2 behind the arc), check-up after
 * scores (3v3 checks at the top; the 5v5 equivalent is the take under the
 * rim), CALL YOUR OWN FOULS and nobody ever has (no foul system — the cage
 * polices itself), and no out of bounds: the chain-link is live.
 */
import { COURT, HALF, type Vec, rimFor, dist, pointsFor, clampToCage, spacingSpots } from './court';
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
  | 'gather' // A held — the shot meter fills
  | 'rise' // jumper airborne, pre/post release
  | 'layup' // driving finish
  | 'dunk' // the cinematic — travels to the rim
  | 'block' // timed leap
  | 'steal' // the swipe
  | 'fall' // ankles broken
  | 'celebrate';

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
  /** spacing-spot assignment (offense) */
  spot: number;
  /** AI decision cooldown */
  thinkCd: number;
  /** dunk cinematic index 0..2 (rolled at launch) */
  dunkStyle: number;
  /** crossover burst time remaining */
  burstT: number;
  /** "calls for it" cooldown */
  callCd: number;
}

interface ShotFlight {
  kind: 'shot';
  by: number;
  pts: 1 | 2;
  x0: number;
  y0: number;
  z0: number;
  rim: Vec;
  t: number;
  t1: number;
  apex: number;
  outcome: 'in' | 'rim_in' | 'rim_out' | 'air';
  x: number;
  y: number;
  z: number;
}

interface PassFlight {
  kind: 'pass';
  from: number;
  to: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  t1: number;
  /** defender idx who picks it at the midpoint, or null (rolled at launch) */
  picked: number | null;
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

export type SimEvent =
  | { kind: 'score'; team: 0 | 1; pts: 1 | 2; x: number; y: number; green: boolean }
  | { kind: 'sfx'; name: string }
  | { kind: 'banner'; text: string; ms: number }
  | { kind: 'permit'; text: string }
  | { kind: 'count'; n: number }
  | { kind: 'check'; team: 0 | 1 }
  | { kind: 'ankles'; victim: number }
  | { kind: 'stuffed'; by: number }
  | { kind: 'block'; by: number }
  | { kind: 'steal'; by: number }
  | { kind: 'pick'; by: number }
  | { kind: 'violation' }
  | { kind: 'callsForIt'; who: number }
  | { kind: 'quarterEnd'; quarter: number }
  | { kind: 'gameEnd'; us: number; them: number };

export type ShotGrade = 'green' | 'early' | 'late' | 'brick';

export interface TickInput {
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  aHeld: boolean;
  aPressed: boolean;
  aReleased: boolean;
  bHeld: boolean;
  bPressed: boolean;
  bReleased: boolean;
}

export const IDLE_INPUT: TickInput = {
  dx: 0,
  dy: 0,
  aHeld: false,
  aPressed: false,
  aReleased: false,
  bHeld: false,
  bPressed: false,
  bReleased: false,
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
  /** ms per 5v5 period (canon 5min; OT periods pass 2min) */
  clockMs?: number;
}

/* ---------------- tuning (data-shaped, tests pin the feel) ---------------- */

export const TUNE = {
  QUARTER_MS: 300_000,
  OT_MS: 120_000,
  SHOT_CLOCK_MS: 24_000,
  CHECK_MS: 900,
  TARGET_3V3: 21,
  /** base run speed px/s; rating adds on top */
  RUN: 84,
  SPD_GAIN: 0.52,
  TURBO_MUL: 1.36,
  SLIDE_MUL: 0.86,
  /** shot meter: 0→1 over this many ms of gather */
  METER_MS: 760,
  /** the GREEN window: center + half-width bounds (scaled by sht/dist/contest) */
  GREEN_CENTER: 0.76,
  GREEN_BASE: 0.085,
  /** B held this short = a tap = the pass (longer = turbo) */
  TAP_MS: 220,
  /** double-tap window for the crossover */
  XOVER_TAP_MS: 240,
  GRAVITY: 700,
  JUMP_V: 250,
} as const;

/* ---------------- the shot mathematics (pure, test-pinned) -------------- */

/** GREEN half-width: a shooter's stat opens it, range and a hand close it */
export function greenWindow(sht: number, distPx: number, contest: number): number {
  const w = TUNE.GREEN_BASE + (sht - 50) * 0.0011 - distPx * 0.00016 - contest * 0.05;
  return Math.max(0.022, Math.min(0.16, w));
}

export function gradeShot(frac: number, sht: number, distPx: number, contest: number): ShotGrade {
  const half = greenWindow(sht, distPx, contest);
  const lo = TUNE.GREEN_CENTER - half;
  const hi = TUNE.GREEN_CENTER + half;
  if (frac >= lo && frac <= hi) return 'green';
  if (frac < lo - 0.22) return 'brick';
  if (frac < lo) return 'early';
  return 'late';
}

/** make chance by grade — GREEN IS MONEY (release timing decides, S12) */
export function makeChance(grade: ShotGrade, sht: number, distPx: number, contest: number): number {
  if (grade === 'green') return 0.99;
  if (grade === 'brick') return 0.06;
  const p = 0.58 + (sht - 50) * 0.004 - distPx * 0.0011 - contest * 0.3;
  return Math.max(0.05, Math.min(0.82, p));
}

/** contest pressure 0..1 from the nearest defender's reach on the shooter */
export function contestOf(dx: number, dy: number, defZ: number): number {
  const d = Math.hypot(dx, dy);
  if (d > 44) return 0;
  const base = (44 - d) / 44;
  return Math.min(1, base * (defZ > 12 ? 1.35 : 0.8));
}

export function stuffChance(atkDnk: number, defDfn: number, defAirborne: boolean): number {
  const p = 0.18 + (defDfn - atkDnk) * 0.005 + (defAirborne ? 0.34 : 0);
  return Math.max(0.04, Math.min(0.85, p));
}

export function stealChance(defDfn: number, hawk: boolean, handlerSht: number): number {
  const p = 0.15 + (hawk ? 0.09 : 0) + (defDfn - handlerSht) * 0.0035;
  return Math.max(0.05, Math.min(0.45, p));
}

export function ankleChance(atkSpd: number, defSpd: number, defCommitted: boolean): number {
  const p = 0.17 + (atkSpd - defSpd) * 0.005 + (defCommitted ? 0.24 : 0);
  return Math.max(0.04, Math.min(0.62, p));
}

/** 3v3 street game-over: FIRST TO 21, WIN BY 2 (pure — tests pin it) */
export function pickupGameOver(us: number, them: number): boolean {
  return Math.max(us, them) >= TUNE.TARGET_3V3 && Math.abs(us - them) >= 2;
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
  shotMs = TUNE.SHOT_CLOCK_MS;
  phase: 'check' | 'live' | 'dead' = 'check';
  checkT = 0;
  over = false;
  /** index the user drives this tick (handler on O, nearest-ball on D) */
  controlled = 0;
  events: SimEvent[] = [];
  /** simulated ms this period (drives anims + deterministic patterns) */
  t = 0;

  private rng: Rng;
  private readonly seed: number;
  private acc = 0;
  /** B-tap bookkeeping (pass vs turbo) */
  private bHeldMs = -1;
  /** crossover double-tap bookkeeping: last tap dir + sim time */
  private lastTapDir = 0;
  private lastTapT = -9999;
  private prevDx: -1 | 0 | 1 = 0;
  /** shot-clock seconds already counted out loud */
  private counted = new Set<number>();
  /** the meter, exposed for the HUD */
  meterFrac = -1;
  meterWindow: { lo: number; hi: number } | null = null;
  /** pending end-of-period once the live ball dies */
  private hornPending = false;

  constructor(cfg: SimConfig) {
    this.format = cfg.format;
    this.perSide = cfg.format === '5v5' ? 5 : 3;
    this.seed = cfg.seed;
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
      x: COURT.W / 2,
      y: COURT.H / 2,
      z: 0,
      vz: 0,
      face: team === 0 ? 1 : -1,
      moving: false,
      turbo: false,
      state: 'play',
      stateT: 0,
      beatenT: 0,
      swipeCd: 0,
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
    if (this.format === '3v3') return { x: HALF.RIM.x, y: HALF.RIM.y };
    return rimFor(team === 0);
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
      return { x: h.x + h.face * 9, y: h.y + 2, z: 12 + h.z };
    }
    return { x: this.ball.x, y: this.ball.y, z: this.ball.z };
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
    this.meterFrac = -1;
    this.meterWindow = null;
    const three = this.format === '3v3';
    const attackRim = this.rimOf(team);
    const spotBase: Vec = three
      ? { x: HALF.CHECK.x, y: HALF.CHECK.y }
      : { x: this.rimOf(team === 0 ? 1 : 0).x, y: COURT.RIM_Y }; // take under your own rim
    let handler: Athlete | null = null;
    for (const a of this.athletes) {
      a.state = 'play';
      a.stateT = 0;
      a.z = 0;
      a.vz = 0;
      a.beatenT = 0;
      a.burstT = 0;
      const lane = (a.slot - (this.perSide - 1) / 2) * (three ? 84 : 64);
      if (a.team === team) {
        if (a.slot === 0) {
          a.x = spotBase.x;
          a.y = spotBase.y;
          handler = a;
        } else {
          // spread between the check spot and the attack end
          a.x = spotBase.x + (attackRim.x - spotBase.x) * 0.35;
          a.y = COURT.RIM_Y + lane;
        }
      } else {
        // defense sets between their marks and the rim they protect
        a.x = spotBase.x + (attackRim.x - spotBase.x) * (a.slot === 0 ? 0.18 : 0.55);
        a.y = COURT.RIM_Y + lane * 0.8;
      }
      clampToCage(a);
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

  /* ==================== the tick ==================== */

  /** feed real dt; the sim quantizes to SIM_DT ticks (cabinet law) */
  advance(dtMs: number, input: TickInput): void {
    this.acc += Math.min(dtMs, 100);
    let first = true;
    while (this.acc >= SIM_DT) {
      this.acc -= SIM_DT;
      // edges land on the first quantum of the frame; held states on all
      this.tick(first ? input : { ...input, aPressed: false, aReleased: false, bPressed: false, bReleased: false });
      first = false;
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

    // ---- clocks (5v5; the 3v3 game self-polices to 21) ----
    if (this.format === '5v5' && !this.hornPending) {
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
    if (cur.team !== 0 || dist(cur.x, cur.y, bp.x, bp.y) > bestD + 22) this.controlled = best;
  }

  /* ---------------- user input: offense ---------------- */

  private userOffense(a: Athlete, input: TickInput): void {
    if (a.state === 'gather') {
      this.meterFrac = Math.min(1.12, this.meterFrac + SIM_DT / TUNE.METER_MS);
      if (input.aReleased || this.meterFrac >= 1.12) {
        this.releaseJumper(a, Math.min(1, Math.max(0, this.meterFrac)));
      }
      return;
    }
    if (a.state !== 'play') return;

    // crossover: double-tap a horizontal direction
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

    // B: tap = directional pass, hold = turbo
    if (input.bPressed) this.bHeldMs = 0;
    if (input.bHeld && this.bHeldMs >= 0) this.bHeldMs += SIM_DT;
    a.turbo = input.bHeld && this.bHeldMs >= TUNE.TAP_MS;
    if (input.bReleased) {
      if (this.bHeldMs >= 0 && this.bHeldMs < TUNE.TAP_MS) this.pass(a, input.dx, input.dy);
      this.bHeldMs = -1;
      a.turbo = false;
    }

    // A: gather — jumper meter, or the contextual rim finish at speed
    if (input.aPressed) {
      const rim = this.rimOf(a.team);
      const d = dist(a.x, a.y, rim.x, rim.y);
      const fast = a.moving && (a.turbo || a.burstT > 0);
      if (d < 150 && fast) {
        if (a.def.rating.dnk >= 40) this.startDunk(a);
        else this.startLayup(a);
        return;
      }
      a.state = 'gather';
      a.stateT = 0;
      a.moving = false;
      this.meterFrac = 0;
      const contest = this.nearestContest(a);
      const half = greenWindow(a.def.rating.sht, d, contest);
      this.meterWindow = { lo: TUNE.GREEN_CENTER - half, hi: TUNE.GREEN_CENTER + half };
      this.emit({ kind: 'sfx', name: 'gather' });
      return;
    }

    this.steer(a, input.dx, input.dy);
  }

  /* ---------------- user input: defense / off-ball ---------------- */

  private userDefenseOrOffBall(a: Athlete, input: TickInput): void {
    if (a.state !== 'play') return;
    a.turbo = input.bHeld && this.bHeldMs >= TUNE.TAP_MS;
    if (input.bPressed) this.bHeldMs = 0;
    if (input.bHeld && this.bHeldMs >= 0) this.bHeldMs += SIM_DT;
    if (input.bReleased) {
      if (this.bHeldMs >= 0 && this.bHeldMs < TUNE.TAP_MS) this.swipe(a);
      this.bHeldMs = -1;
      a.turbo = false;
    }
    if (input.aPressed && a.z === 0) {
      a.state = 'block';
      a.stateT = 0;
      a.vz = TUNE.JUMP_V + a.def.rating.dnk * 0.6;
      this.emit({ kind: 'sfx', name: 'jump' });
    }
    this.steer(a, input.dx, input.dy);
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
    clampToCage(a);
    if (this.format === '3v3') a.x = Math.min(a.x, HALF.X_MAX);
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

  /* ---------------- actions ---------------- */

  private crossover(a: Athlete, dir: -1 | 1): void {
    a.burstT = 260;
    a.face = dir;
    this.emit({ kind: 'sfx', name: 'bounce' });
    // the nearest set defender eats the move or doesn't (seeded)
    let def: Athlete | null = null;
    let dd = Infinity;
    for (const b of this.athletes) {
      if (b.team === a.team || b.state !== 'play') continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d < dd) {
        dd = d;
        def = b;
      }
    }
    if (!def || dd > 34) return;
    const committed = def.moving && Math.sign(def.x - a.x) !== Math.sign(dir);
    if (this.rng() < ankleChance(a.def.rating.spd, def.def.rating.spd, committed)) {
      def.state = 'fall';
      def.stateT = 0;
      def.beatenT = 950;
      this.emit({ kind: 'ankles', victim: this.athletes.indexOf(def) });
      this.emit({ kind: 'sfx', name: 'thud' });
    }
  }

  /** B-tap pass: nearest teammate inside the held d-pad cone (aim it) */
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
        if (da > 0.96) return; // outside the cone
        const score = da * 220 + d * 0.25;
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
    // lead the cutter: aim where they're going, not where they were
    const lead = to.moving ? 30 : 0;
    const x1 = to.x + lead * (to.face > 0 ? 1 : -1) * 0.7;
    const y1 = to.y;
    const flight = Math.max(180, dist(a.x, a.y, x1, y1) * 1.45);
    // pass-lane pick, rolled at launch (deterministic): nearest defender
    // standing close to the line gets a seeded hand in it
    let picked: number | null = null;
    this.athletes.forEach((d, i) => {
      if (d.team === a.team || d.beatenT > 0) return;
      const t = Math.max(0, Math.min(1, ((d.x - a.x) * (x1 - a.x) + (d.y - a.y) * (y1 - a.y)) / Math.max(1, dist(a.x, a.y, x1, y1) ** 2)));
      const lx = a.x + (x1 - a.x) * t;
      const ly = a.y + (y1 - a.y) * t;
      if (dist(d.x, d.y, lx, ly) > 13 || t < 0.15 || t > 0.85) return;
      if (picked === null && this.rng() < stealChance(d.def.rating.dfn, d.def.archetype === 'hawk', a.def.rating.sht) + 0.05) {
        picked = i;
      }
    });
    this.ball = {
      kind: 'pass',
      from,
      to: best,
      x0: a.x + a.face * 9,
      y0: a.y,
      x1,
      y1,
      t: 0,
      t1: flight,
      picked,
      x: a.x,
      y: a.y,
      z: 22,
    };
    this.emit({ kind: 'sfx', name: 'pass' });
  }

  private swipe(a: Athlete): void {
    if (a.swipeCd > 0 || a.state !== 'play') return;
    a.swipeCd = 380;
    a.state = 'steal';
    a.stateT = 0;
    this.emit({ kind: 'sfx', name: 'swipe' });
    const h = this.holder();
    if (!h || h.team === a.team) return;
    if (dist(a.x, a.y, h.x, h.y) > 24) return;
    if (this.rng() < stealChance(a.def.rating.dfn, a.def.archetype === 'hawk', h.def.rating.sht)) {
      this.ball = { kind: 'held', by: this.athletes.indexOf(a) };
      this.posTeam = a.team;
      this.shotMs = TUNE.SHOT_CLOCK_MS;
      this.counted.clear();
      this.emit({ kind: 'steal', by: this.athletes.indexOf(a) });
      this.emit({ kind: 'sfx', name: 'steal' });
    } else {
      a.beatenT = 720; // whiffed — beaten
    }
  }

  private startDunk(a: Athlete): void {
    a.state = 'dunk';
    a.stateT = 0;
    a.dunkStyle = Math.floor(this.rng() * 3);
    this.emit({ kind: 'sfx', name: 'jump' });
  }

  private startLayup(a: Athlete): void {
    a.state = 'layup';
    a.stateT = 0;
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
    this.meterFrac = -1;
    this.meterWindow = null;
    // a timed block beats the release outright
    const blocker = this.findBlocker(a);
    if (blocker) {
      this.looseBall(a.x + a.face * 8, a.y, 30, blocker.face * 90, (this.rng() - 0.5) * 60, 120);
      this.emit({ kind: 'block', by: this.athletes.indexOf(blocker) });
      this.emit({ kind: 'sfx', name: 'block' });
      return;
    }
    this.launchShot(a, rim, d, grade, contest);
  }

  private launchShot(a: Athlete, rim: Vec, d: number, grade: ShotGrade, contest: number): void {
    const pts = pointsFor(a.x, a.y, rim);
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
      x0: a.x + a.face * 6,
      y0: a.y,
      z0: 46 + a.z,
      rim,
      t: 0,
      t1: 480 + d * 0.5,
      apex: COURT.RIM_Z + 34 + d * 0.07,
      outcome,
      x: a.x,
      y: a.y,
      z: 46 + a.z,
    };
    if (grade === 'green') this.emit({ kind: 'sfx', name: 'green' });
  }

  /** a defender mid-block close enough to eat the release */
  private findBlocker(shooter: Athlete): Athlete | null {
    for (const b of this.athletes) {
      if (b.team === shooter.team || b.state !== 'block') continue;
      if (dist(b.x, b.y, shooter.x, shooter.y) < 24 && b.z > 14) {
        if (this.rng() < 0.32 + b.def.rating.dfn * 0.004) return b;
      }
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
    if (a.state === 'fall' || a.state === 'celebrate') return;
    a.thinkCd -= SIM_DT;
    const holder = this.holder();
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

  private aiHandler(a: Athlete): void {
    if (a.state !== 'play') return;
    const rim = this.rimOf(a.team);
    const d = dist(a.x, a.y, rim.x, rim.y);
    const contest = this.nearestContest(a);
    const forced = this.format === '5v5' && this.shotMs < 4200;
    if (a.thinkCd > 0 && !forced) {
      this.seek(a, a.x + a.face * 30, a.y, false);
      return;
    }
    a.thinkCd = 620;
    const arch = a.def.archetype;
    const r = this.rng();
    // finishing range — everybody takes the rim when it's there
    if (d < 64 && contest < 0.55) {
      if (a.def.rating.dnk >= 52 && r < 0.6) this.startDunk(a);
      else this.startLayup(a);
      return;
    }
    if (forced) {
      this.aiShoot(a, rim, d, contest);
      return;
    }
    const driveLane = this.laneOpen(a, rim);
    switch (arch) {
      case 'rusher':
        if (driveLane || r < 0.25) this.driveTo(a, rim);
        else if (r < 0.45) this.aiPass(a);
        else this.seek(a, rim.x - Math.sign(rim.x - a.x) * 110, rim.y + (r - 0.5) * 120, true);
        return;
      case 'sniper': {
        const behind = d > COURT.ARC_R;
        if (behind && contest < 0.3 && r < 0.62) {
          this.aiShoot(a, rim, d, contest);
          return;
        }
        if (r < 0.3) this.aiPass(a);
        else this.seek(a, rim.x - Math.sign(rim.x - a.x) * (COURT.ARC_R + 14), rim.y + (r - 0.5) * 190, false);
        return;
      }
      case 'post':
        if (d < 96 && r < 0.55) {
          this.aiShoot(a, rim, d, contest);
          return;
        }
        if (r < 0.25) this.aiPass(a);
        else this.driveTo(a, { x: rim.x + (rim.x > COURT.W / 2 ? -52 : 52), y: rim.y + (r - 0.5) * 70 });
        return;
      default:
        if (driveLane && r < 0.4) this.driveTo(a, rim);
        else if (r < 0.42) this.aiPass(a);
        else if (d < 120 && contest < 0.32 && r < 0.7) this.aiShoot(a, rim, d, contest);
        else this.seek(a, rim.x - Math.sign(rim.x - a.x) * 120, rim.y + (r - 0.5) * 150, false);
    }
  }

  /** AI release grades honestly off its sht rating — better teams hit GREEN
   *  more (deterministic roll → frac inside/outside the window; no score
   *  reads, no bands — the rating IS the player) */
  private aiShoot(a: Athlete, rim: Vec, d: number, contest: number): void {
    const half = greenWindow(a.def.rating.sht, d, contest);
    const skill = Math.min(0.92, 0.3 + a.def.rating.sht * 0.0085);
    const frac =
      this.rng() < skill
        ? TUNE.GREEN_CENTER + (this.rng() * 2 - 1) * half * 0.9
        : TUNE.GREEN_CENTER + (this.rng() * 2 - 1) * (half + 0.16);
    const grade = gradeShot(frac, a.def.rating.sht, d, contest);
    a.state = 'rise';
    a.stateT = 0;
    a.vz = TUNE.JUMP_V * 0.9;
    const blocker = this.findBlocker(a);
    if (blocker) {
      this.looseBall(a.x + a.face * 8, a.y, 30, blocker.face * 90, (this.rng() - 0.5) * 60, 120);
      this.emit({ kind: 'block', by: this.athletes.indexOf(blocker) });
      this.emit({ kind: 'sfx', name: 'block' });
      return;
    }
    this.launchShot(a, rim, d, grade, contest);
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
    if (!best || bestOpen < 30) return;
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
      if (dist(d.x, d.y, lx, ly) < 26) return false;
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
    const spots = spacingSpots(rim, this.format === '5v5' ? a.team === 0 : false);
    const spot = spots[(a.spot + this.quarter) % spots.length];
    // cut when the handler drives: nearest teammate dives baseline
    if (holder && dist(holder.x, holder.y, rim.x, rim.y) < 130 && dist(a.x, a.y, rim.x, rim.y) < 200) {
      this.seek(a, rim.x + (rim.x > COURT.W / 2 ? -30 : 30), rim.y + (a.slot % 2 === 0 ? -46 : 46), true);
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
      if (near > 56 && !a.moving) {
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
    // hawk gamble: jump the lane when pressing the ball (honest tendency)
    if (onBall && holder && a.def.archetype === 'hawk' && a.swipeCd <= 0 && dist(a.x, a.y, holder.x, holder.y) < 26) {
      if (this.rng() < 0.012) {
        this.swipe(a);
        return;
      }
    }
    // AI block: my mark is rising to shoot beside me
    if (mark && (mark.state === 'gather' || mark.state === 'rise') && dist(a.x, a.y, mark.x, mark.y) < 38 && a.z === 0) {
      if (this.rng() < 0.06 + a.def.rating.dfn * 0.0009) {
        a.state = 'block';
        a.stateT = 0;
        a.vz = TUNE.JUMP_V + a.def.rating.dnk * 0.6;
        return;
      }
    }
    // help: collapse on a drive in my lane
    if (holder && dist(holder.x, holder.y, rimD.x, rimD.y) < 96 && dist(a.x, a.y, rimD.x, rimD.y) < 130 && !onBall) {
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
    if (d < 5) {
      a.moving = false;
      return;
    }
    a.turbo = turbo;
    const sp = this.speedOf(a);
    a.x += (dx / d) * sp * (SIM_DT / 1000);
    a.y += (dy / d) * sp * (SIM_DT / 1000);
    a.moving = true;
    if (Math.abs(dx) > 2) a.face = dx > 0 ? 1 : -1;
    this.clampWalker(a);
  }

  /* ---------------- integration ---------------- */

  private integrate(a: Athlete): void {
    a.stateT += SIM_DT;
    a.beatenT = Math.max(0, a.beatenT - SIM_DT);
    a.swipeCd = Math.max(0, a.swipeCd - SIM_DT);
    a.burstT = Math.max(0, a.burstT - SIM_DT);
    if (a.burstT > 0 && a.state === 'play') {
      a.x += a.face * 1.55 * (SIM_DT / 1000) * 60;
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
        }
      }
    }
    if (a.state === 'steal' && a.stateT > 260) {
      a.state = 'play';
      a.stateT = 0;
    }
    if (a.state === 'fall' && a.stateT > 900) {
      a.state = 'play';
      a.stateT = 0;
    }
    // the rim runs: layup/dunk travel to the hoop and finish
    if (a.state === 'layup' || a.state === 'dunk') {
      const rim = this.rimOf(a.team);
      const T = a.state === 'dunk' ? 520 : 430;
      const k = Math.min(1, a.stateT / T);
      a.x += (rim.x - a.x) * k * 0.28;
      a.y += (rim.y - a.y) * k * 0.28;
      a.z = Math.sin(k * Math.PI) * (a.state === 'dunk' ? COURT.RIM_Z + 8 : COURT.RIM_Z - 14);
      if (k >= 1) this.finishAtRim(a);
    }
  }

  private finishAtRim(a: Athlete): void {
    const rim = this.rimOf(a.team);
    const i = this.athletes.indexOf(a);
    const dunk = a.state === 'dunk';
    a.state = 'play';
    a.stateT = 0;
    a.z = 0;
    a.vz = 0;
    if (this.ball.kind !== 'held' || this.ball.by !== i) return;
    // contested at the summit?
    let stuffer: Athlete | null = null;
    for (const b of this.athletes) {
      if (b.team === a.team) continue;
      if (dist(b.x, b.y, rim.x, rim.y) < 30 && (b.state === 'block' || b.z > 18)) {
        if (this.rng() < stuffChance(a.def.rating.dnk, b.def.rating.dfn, b.state === 'block')) stuffer = b;
        break;
      }
    }
    if (dunk && stuffer) {
      this.looseBall(rim.x, rim.y, COURT.RIM_Z - 8, -a.face * 110, (this.rng() - 0.5) * 90, 60);
      this.emit({ kind: 'stuffed', by: this.athletes.indexOf(stuffer) });
      this.emit({ kind: 'sfx', name: 'block' });
      return;
    }
    if (dunk) {
      this.scoreBasket(a.team, 1, rim, false, true);
      return;
    }
    // the layup rolls (close-range, honest)
    const contest = this.nearestContest(a);
    const p = Math.max(0.2, Math.min(0.93, 0.74 + a.def.rating.sht * 0.0015 - contest * 0.32));
    if (this.rng() < p) {
      this.scoreBasket(a.team, 1, rim, false, false);
    } else {
      this.looseBall(rim.x, rim.y, COURT.RIM_Z, (this.rng() - 0.5) * 120, (this.rng() - 0.5) * 100, 90);
      this.emit({ kind: 'sfx', name: 'rim' });
    }
  }

  private scoreBasket(team: 0 | 1, pts: 1 | 2, at: Vec, green: boolean, dunk: boolean): void {
    if (team === 0) this.scoreUs += pts;
    else this.scoreThem += pts;
    this.emit({ kind: 'score', team, pts, x: at.x, y: at.y, green });
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
      b.z = 22 + Math.sin(k * Math.PI) * 16;
      if (b.picked !== null && k >= 0.5) {
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
        if (dist(to.x, to.y, b.x1, b.y1) < 34 && to.state !== 'fall') {
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
      const reach = b.outcome === 'air' ? 0.88 : 1;
      b.x = b.x0 + (b.rim.x - b.x0) * k * reach;
      b.y = b.y0 + (b.rim.y - b.y0) * k * reach;
      const z1 = b.outcome === 'air' ? COURT.RIM_Z - 18 : COURT.RIM_Z;
      b.z = b.z0 + (z1 - b.z0) * k + Math.sin(k * Math.PI) * (b.apex - Math.max(b.z0, z1));
      if (k < 1) return;
      const shooter = this.athletes[b.by];
      switch (b.outcome) {
        case 'in':
        case 'rim_in':
          if (b.outcome === 'rim_in') this.emit({ kind: 'sfx', name: 'rim' });
          this.scoreBasket(shooter.team, b.pts, b.rim, b.outcome === 'in', false);
          return;
        case 'rim_out': {
          this.emit({ kind: 'sfx', name: 'rim' });
          if (this.format === '5v5') {
            this.shotMs = TUNE.SHOT_CLOCK_MS; // iron resets the count (street)
            this.counted.clear();
          }
          const ang = this.rng() * Math.PI * 2;
          const sp = 60 + this.rng() * 90;
          this.looseBall(b.rim.x, b.rim.y, COURT.RIM_Z, Math.cos(ang) * sp, Math.sin(ang) * sp * 0.7, 110 + this.rng() * 60);
          return;
        }
        case 'air': {
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
      b.vz = Math.abs(b.vz) > 40 ? -b.vz * 0.55 : 0;
      b.vx *= 0.8;
      b.vy *= 0.8;
      if (Math.abs(b.vz) > 30) this.emit({ kind: 'sfx', name: 'bounce' });
    }
    const fx = -COURT.FENCE + 4;
    const fx1 = COURT.W + COURT.FENCE - 4;
    const fy = -COURT.FENCE + 4;
    const fy1 = COURT.H + COURT.FENCE - 4;
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
    if (b.z < 28) {
      let best: number | null = null;
      let bestScore = -Infinity;
      this.athletes.forEach((a, i) => {
        if (a.beatenT > 0 || a.state === 'fall') return;
        const d = dist(a.x, a.y, b.x, b.y);
        if (d > 17) return;
        const score = (a.def.rating.dfn + a.def.rating.dnk) / 2 - d * 2 + this.rng() * 14;
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
