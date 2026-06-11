/**
 * COSTA ESTRELLA LINKS — the deterministic golf sim (S13). Phaser-free under
 * the S10/S12 minigame law (ADR-029/034/036): fixed 8.333ms quanta off
 * accumulated dt, one seeded injectable rng per ROUND (wind + cliff kicks —
 * nothing else rolls), inputs in / strokes out — same seed + same input tape
 * = same card, forever. LinksScene is a renderer over this state.
 *
 * SWING FEEL (canon, two buttons + the d-pad): aim with the d-pad, B cycles
 * the CLUB BAG, A runs the 3-TAP METER — first tap starts the needle, second
 * sets POWER on the way up, third sets ACCURACY in a shrinking perfect
 * window on the way back down (early = pull/draw, late past the line =
 * push/fade; the window scales by club AND lie). After-touch spin rides the
 * held d-pad mid-flight (capped). Inside 30y the dedicated CHIP meter takes
 * over (power tap only, lofted hop, tiny roll); on the green the PUTT meter
 * reads the grid — the slope arrows draw EXACTLY the acceleration the ball
 * rolls under (honest, validator-pinned by construction: one vector).
 *
 * WATER is a splash: one penalty stroke, drop at the last dry point under
 * the flight. SAND plugs (no roll). CLIFF rock kicks (the round rng's only
 * other customer). The cup takes any roll that crosses it slow enough.
 */
import { CLUBS, LIES, YD, expandGrid, terrainAt, dist, type HoleDef, type Terrain, type Vec } from './course';

export const SIM_DT = 1000 / 120;

export type Rng = () => number;

export const GOLF = {
  /** power needle: 0 → cap over this many ms (then it pins and waits) */
  POWER_MS: 850,
  POWER_CAP: 1.12,
  /** the accuracy needle falls from the captured power back past zero */
  ACC_FLOOR: -0.3,
  /** push/pull: radians of launch deflection per unit of acc error */
  PUSH_RAD: 0.34,
  /** draw/fade: lateral curve accel per unit of acc error (px/s²) */
  CURVE: 220,
  /** after-touch: held d-pad accel mid-flight (px/s²) */
  AFTER: 26,
  /** wind: px/s² per mph; loft rides it (0.6 + loft) */
  WIND_PER_MPH: 1.05,
  WIND_MAX_MPH: 11,
  /** flight ms per carry px, plus the base */
  FLIGHT_BASE_MS: 560,
  FLIGHT_PER_PX: 0.85,
  /** rolling friction px/s² (greens run truer than rough) */
  FRICTION_G: 92,
  FRICTION_F: 150,
  FRICTION_R: 320,
  /** the cup: radius + the max speed it will swallow */
  CUP_R: 5,
  CUP_SPEED: 70,
  /** putt: launch px/s at full power; chip: carry yards at full power */
  PUTT_V: 340,
  CHIP_CARRY_YD: 32,
  CHIP_MS: 760,
  /** the chip zone: inside this many yards (and off the green) chips */
  CHIP_ZONE_YD: 30,
} as const;

export type SwingMode = 'full' | 'chip' | 'putt';
export type GolfPhase = 'aim' | 'power' | 'acc' | 'flight' | 'roll' | 'holed';

export interface GolfInput {
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  aPressed: boolean;
  bPressed: boolean;
}

export const GOLF_IDLE: GolfInput = { dx: 0, dy: 0, aPressed: false, bPressed: false };

export type GolfEvent =
  | { kind: 'stroke'; n: number; mode: SwingMode }
  | { kind: 'land'; terrain: Terrain }
  | { kind: 'splash' }
  | { kind: 'cliff' }
  | { kind: 'holed'; strokes: number; par: number }
  | { kind: 'sfx'; name: string };

/** seeded wind for a ROUND: one honest vector the caddy announces */
export function windOf(rng: Rng): { x: number; y: number; mph: number } {
  const mph = Math.round(rng() * GOLF.WIND_MAX_MPH);
  const ang = rng() * Math.PI * 2;
  return { x: Math.cos(ang) * mph * GOLF.WIND_PER_MPH, y: Math.sin(ang) * mph * GOLF.WIND_PER_MPH, mph };
}

/** the caddy measures everything in putts: 1 putt ≈ 8 yards, he insists */
export function windPutts(mph: number): number {
  return Math.max(0, Math.round(mph / 2));
}

export class GolfSim {
  readonly hole: HoleDef;
  readonly grid: string[];
  readonly wind: { x: number; y: number; mph: number };
  ball: { x: number; y: number; z: number };
  strokes = 0;
  phase: GolfPhase = 'aim';
  /** aim angle (radians; default = at the pin); d-pad nudges it in 'aim' */
  aim: number;
  clubIdx = 0;
  /** the meter needle (power: rises; acc: falls). −1 = idle */
  meterT = -1;
  power = 0;
  /** captured accuracy error (0 = pure; the window is accWindow-scaled) */
  acc = 0;
  mode: SwingMode = 'full';
  over = false;
  events: GolfEvent[] = [];
  t = 0;

  private rng: Rng;
  private acc_ = 0; // dt accumulator
  private meterDir: 1 | -1 = 1;
  private vx = 0;
  private vy = 0;
  private flightT = 0;
  private flightT1 = 0;
  private apex = 0;
  private curve = 0;
  private dirX = 0;
  private dirY = 0;
  private lastDry: Vec;

  constructor(hole: HoleDef, rng: Rng, wind: { x: number; y: number; mph: number }) {
    this.hole = hole;
    this.grid = expandGrid(hole.rle);
    this.rng = rng;
    this.wind = wind;
    this.ball = { x: hole.tee.x, y: hole.tee.y, z: 0 };
    this.lastDry = { x: hole.tee.x, y: hole.tee.y };
    this.aim = Math.atan2(hole.pin.y - hole.tee.y, hole.pin.x - hole.tee.x);
    this.autoClub();
  }

  /** the bag suggests by distance (B still cycles freely) */
  private autoClub(): void {
    const ydsToPin = dist(this.ball.x, this.ball.y, this.hole.pin.x, this.hole.pin.y) / YD;
    let best = CLUBS.length - 1;
    for (let i = 0; i < CLUBS.length; i++) {
      if (CLUBS[i].carry >= ydsToPin - 4) best = i;
    }
    this.clubIdx = best;
  }

  lie(): Terrain {
    return terrainAt(this.grid, this.ball.x, this.ball.y);
  }

  /** what the next swing will be: putt on the green, chip inside 30y, full */
  swingMode(): SwingMode {
    const lie = this.lie();
    if (lie === 'G') return 'putt';
    const yds = dist(this.ball.x, this.ball.y, this.hole.pin.x, this.hole.pin.y) / YD;
    return yds <= GOLF.CHIP_ZONE_YD ? 'chip' : 'full';
  }

  /** the live accuracy window half-width (club × lie) — HUD draws THIS */
  accWindow(): number {
    return CLUBS[this.clubIdx].accWindow * LIES[this.lie()].acc;
  }

  ydsToPin(): number {
    return Math.round(dist(this.ball.x, this.ball.y, this.hole.pin.x, this.hole.pin.y) / YD);
  }

  private emit(e: GolfEvent): void {
    this.events.push(e);
  }

  advance(dtMs: number, input: GolfInput): void {
    this.acc_ += Math.min(dtMs, 100);
    let first = true;
    while (this.acc_ >= SIM_DT) {
      this.acc_ -= SIM_DT;
      this.tick(first ? input : { ...input, aPressed: false, bPressed: false });
      first = false;
    }
  }

  tick(input: GolfInput): void {
    if (this.over) return;
    this.t += SIM_DT;
    switch (this.phase) {
      case 'aim': {
        // d-pad aims; B cycles the bag; A starts the meter
        if (input.dx !== 0) this.aim += input.dx * 0.012;
        if (input.dy !== 0) this.aim += input.dy * 0.004;
        if (input.bPressed && this.swingMode() === 'full') {
          this.clubIdx = (this.clubIdx + 1) % CLUBS.length;
          this.emit({ kind: 'sfx', name: 'cursor' });
        }
        if (input.aPressed) {
          this.mode = this.swingMode();
          this.phase = 'power';
          this.meterT = 0;
          this.emit({ kind: 'sfx', name: 'gather' });
        }
        return;
      }
      case 'power': {
        // the classic bounce: the needle rises to the cap, turns, and falls —
        // tap on the way you like; let it die back to zero and the swing is
        // CANCELLED (no stroke; you waggled and stepped off)
        this.meterT += (this.meterDir * SIM_DT) / GOLF.POWER_MS;
        if (this.meterT >= GOLF.POWER_CAP) {
          this.meterT = GOLF.POWER_CAP;
          this.meterDir = -1;
        }
        if (this.meterT <= 0 && this.meterDir < 0) {
          this.phase = 'aim';
          this.meterT = -1;
          this.meterDir = 1;
          this.emit({ kind: 'sfx', name: 'cancel' });
          return;
        }
        if (input.aPressed) {
          this.power = Math.max(0.05, Math.min(1, this.meterT));
          this.meterDir = 1;
          if (this.mode === 'full') {
            this.meterT = this.power; // the acc needle falls from the capture
            this.phase = 'acc';
          } else {
            // putts and chips launch straight off the power tap
            this.acc = 0;
            this.launch();
          }
        }
        return;
      }
      case 'acc': {
        this.meterT -= SIM_DT / GOLF.POWER_MS;
        if (input.aPressed || this.meterT <= GOLF.ACC_FLOOR) {
          this.acc = Math.max(GOLF.ACC_FLOOR, this.meterT);
          this.launch();
        }
        return;
      }
      case 'flight': {
        this.flightT += SIM_DT;
        const k = Math.min(1, this.flightT / this.flightT1);
        const dt = SIM_DT / 1000;
        // wind + curve + after-touch act on the velocity (the ball-cam shows it)
        const loftRide = 0.6 + CLUBS[this.clubIdx].loft;
        const wf = this.mode === 'full' ? loftRide : 0.35;
        this.vx += (this.wind.x * wf + -this.dirY * this.curve + input.dx * GOLF.AFTER) * dt;
        this.vy += (this.wind.y * wf + this.dirX * this.curve + input.dy * GOLF.AFTER) * dt;
        this.ball.x += this.vx * dt;
        this.ball.y += this.vy * dt;
        this.ball.z = Math.sin(k * Math.PI) * this.apex;
        if (terrainAt(this.grid, this.ball.x, this.ball.y) !== 'W') {
          this.lastDry = { x: this.ball.x, y: this.ball.y };
        }
        if (k >= 1) this.land();
        return;
      }
      case 'roll': {
        const dt = SIM_DT / 1000;
        const lie = terrainAt(this.grid, this.ball.x, this.ball.y);
        const fr = lie === 'G' ? GOLF.FRICTION_G : lie === 'F' || lie === 'T' ? GOLF.FRICTION_F : GOLF.FRICTION_R;
        const sp = Math.hypot(this.vx, this.vy);
        if (sp > 0) {
          const dec = fr * dt;
          const ns = Math.max(0, sp - dec);
          this.vx = (this.vx / sp) * ns;
          this.vy = (this.vy / sp) * ns;
        }
        // the green's honest break — exactly the slope the arrows draw
        if (lie === 'G') {
          this.vx += this.hole.slope.x * dt;
          this.vy += this.hole.slope.y * dt;
        }
        this.ball.x += this.vx * dt;
        this.ball.y += this.vy * dt;
        this.ball.z = 0;
        // the cup
        const d = dist(this.ball.x, this.ball.y, this.hole.pin.x, this.hole.pin.y);
        const speed = Math.hypot(this.vx, this.vy);
        if (d <= GOLF.CUP_R && speed <= GOLF.CUP_SPEED) {
          this.phase = 'holed';
          this.over = true;
          this.ball.x = this.hole.pin.x;
          this.ball.y = this.hole.pin.y;
          this.emit({ kind: 'sfx', name: 'swish' });
          this.emit({ kind: 'holed', strokes: this.strokes, par: this.hole.par });
          return;
        }
        if (terrainAt(this.grid, this.ball.x, this.ball.y) === 'W') {
          this.splash();
          return;
        }
        if (speed < 6) {
          this.vx = 0;
          this.vy = 0;
          this.settle();
        }
        return;
      }
      default:
        return;
    }
  }

  /* ---------------- the swing ---------------- */

  private launch(): void {
    this.strokes += 1;
    this.meterT = -1;
    this.emit({ kind: 'stroke', n: this.strokes, mode: this.mode });
    const lie = LIES[this.lie()];
    if (this.mode === 'putt') {
      const v = GOLF.PUTT_V * this.power;
      this.vx = Math.cos(this.aim) * v;
      this.vy = Math.sin(this.aim) * v;
      this.phase = 'roll';
      this.emit({ kind: 'sfx', name: 'bounce' });
      return;
    }
    const club = CLUBS[this.clubIdx];
    const carryYd = this.mode === 'chip' ? GOLF.CHIP_CARRY_YD : club.carry;
    const carryPx = Math.max(8, carryYd * YD * this.power * lie.carry);
    // push/pull deflects the line; the same error CURVES the flight
    const dir = this.aim + -this.acc * GOLF.PUSH_RAD;
    this.dirX = Math.cos(dir);
    this.dirY = Math.sin(dir);
    this.flightT = 0;
    this.flightT1 = this.mode === 'chip' ? GOLF.CHIP_MS : GOLF.FLIGHT_BASE_MS + carryPx * GOLF.FLIGHT_PER_PX;
    const v = carryPx / (this.flightT1 / 1000);
    this.vx = this.dirX * v;
    this.vy = this.dirY * v;
    this.curve = this.mode === 'chip' ? 0 : -this.acc * GOLF.CURVE;
    const loft = this.mode === 'chip' ? 0.9 : club.loft;
    this.apex = 22 + carryPx * loft * 0.16;
    this.phase = 'flight';
    this.emit({ kind: 'sfx', name: 'swing_bat' });
  }

  private land(): void {
    const terr = terrainAt(this.grid, this.ball.x, this.ball.y);
    this.emit({ kind: 'land', terrain: terr });
    if (terr === 'W') {
      this.splash();
      return;
    }
    if (terr === 'C') {
      // the cliff kicks — the round rng's only other customer
      this.emit({ kind: 'cliff' });
      this.emit({ kind: 'sfx', name: 'thud' });
      const ang = this.rng() * Math.PI * 2;
      const v = 90 + this.rng() * 120;
      this.vx = Math.cos(ang) * v;
      this.vy = Math.sin(ang) * v;
      this.phase = 'roll';
      return;
    }
    if (terr === 'S') {
      this.emit({ kind: 'sfx', name: 'thud' });
      this.vx = 0;
      this.vy = 0;
      this.settle();
      return;
    }
    // bounce-and-roll: the club's roll, taxed by the landing lie
    const club = CLUBS[this.clubIdx];
    const rollYd = (this.mode === 'chip' ? 3 : club.roll) * this.power;
    const rollPx = rollYd * YD * (terr === 'G' ? LIES.G.roll : LIES[terr].roll);
    // convert remaining momentum into a roll at landing speed
    const v = Math.max(30, rollPx * 1.6);
    const sp = Math.hypot(this.vx, this.vy) || 1;
    this.vx = (this.vx / sp) * v;
    this.vy = (this.vy / sp) * v;
    this.emit({ kind: 'sfx', name: 'bounce' });
    this.phase = 'roll';
  }

  private splash(): void {
    this.strokes += 1; // the penalty
    this.emit({ kind: 'splash' });
    this.emit({ kind: 'sfx', name: 'splash' });
    this.ball.x = this.lastDry.x;
    this.ball.y = this.lastDry.y;
    this.ball.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.settle();
  }

  private settle(): void {
    this.phase = 'aim';
    this.ball.z = 0;
    // re-aim at the pin and re-suggest a club for the new lie
    this.aim = Math.atan2(this.hole.pin.y - this.ball.y, this.hole.pin.x - this.ball.x);
    this.autoClub();
  }
}
