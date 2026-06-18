/**
 * COSTA ESTRELLA LINKS — the deterministic golf sim (S13). Phaser-free under
 * the S10/S12 minigame law (ADR-029/034/036): fixed 8.333ms quanta off
 * accumulated dt, one seeded injectable rng per ROUND (wind + cliff kicks —
 * nothing else rolls), inputs in / strokes out — same seed + same input tape
 * = same card, forever. LinksScene is a renderer over this state.
 *
 * SWING FEEL (canon, two buttons + the d-pad): aim with the d-pad, B cycles
 * the CLUB BAG, A runs the RISE-AND-RETURN METER — A starts the needle, then
 * two taps shape the shot: POWER on the way up, then ACCURACY as the needle
 * falls back through a CENTERED perfect window (early/high = pull/draw,
 * late/low = push/fade; the window scales by club AND lie). EVERY shot takes
 * both taps now — chips and putts read pull/push too. After-touch spin rides
 * the held d-pad mid-flight (capped). Inside 30y the CHIP is a lofted hop with
 * tiny roll (no curve); on the green the PUTT reads the grid — the slope
 * arrows draw EXACTLY the acceleration the ball rolls under (honest,
 * validator-pinned by construction: one vector).
 *
 * WATER is a splash: one penalty stroke, drop at the last dry point under
 * the flight. SAND plugs (no roll). CLIFF rock kicks (the round rng's only
 * other customer). The cup takes any roll that crosses it slow enough.
 */
import { CLUBS, LIES, YD, expandGrid, terrainAt, dist, type HoleDef, type Terrain, type Vec } from './course';
import { s, ART_SCALE } from '../spritegen/scale';

export const SIM_DT = 1000 / 120;

export type Rng = () => number;

/**
 * The swing constants. The sim runs in RUNTIME px (tee/pin are scaled
 * ×ART_SCALE on read), so every PIXEL quantity here scales: distances (CUP_R),
 * velocities px/s (CUP_SPEED, PUTT_V) and accelerations px/s² (CURVE, AFTER,
 * WIND_PER_MPH, FRICTION_*) all wear s(). The trajectory stays geometrically
 * similar (S× bigger) traversed in the SAME wall-clock time, so feel + yardage
 * hold; at ART_SCALE=1 every s(n)===n (byte-identical to the legacy game).
 *
 * KEPT (not pixels): POWER_MS/FLIGHT_BASE_MS/CHIP_MS are ms; PUSH_RAD is
 * radians; POWER_CAP/ACC_FLOOR are meter fractions; WIND_MAX_MPH is mph;
 * CHIP_CARRY_YD/CHIP_ZONE_YD are YARDS (they reach px through YD, which already
 * scales). FLIGHT_PER_PX is the subtle one: flightT1 = BASE + carryPx·PER_PX is
 * a TIME, and launch speed = carryPx/flightT1. carryPx already scales (via YD),
 * so KEEPING PER_PX makes flightT1 invariant and the launch SPEED scale ×S —
 * which is exactly what carries the ×S geometry under the ×S accelerations.
 * Scaling PER_PX too would stretch flight time ×S and over-curve by ×S².
 */
export const GOLF = {
  /** power needle: 0 → cap over this many ms (then it pins and waits) */
  POWER_MS: 850,
  POWER_CAP: 1.12,
  /** the accuracy needle falls from the TOP of the rail; the green window is
   *  CENTERED at ACC_CENTER and the captured error is the signed distance from
   *  it, clamped to ±ACC_MAG (pull = +, push = −). ACC_MAG === |ACC_FLOOR| so an
   *  un-tapped swing auto-fires at the floor with the SAME max push as ever. */
  ACC_FLOOR: -0.3,
  ACC_CENTER: 0.5,
  ACC_MAG: 0.3,
  /** push/pull: radians of launch deflection per unit of acc error */
  PUSH_RAD: 0.34,
  /** draw/fade: lateral curve accel per unit of acc error (px/s²) */
  CURVE: s(220),
  /** after-touch: held d-pad accel mid-flight (px/s²) */
  AFTER: s(26),
  /** wind: px/s² per mph; loft rides it (0.6 + loft) */
  WIND_PER_MPH: s(1.05),
  WIND_MAX_MPH: 11,
  /** flight ms per carry px (KEEP: a time-per-px ratio — see header), + base ms */
  FLIGHT_BASE_MS: 560,
  FLIGHT_PER_PX: 0.85,
  /** rolling friction px/s² (greens run truer than rough) */
  FRICTION_G: s(92),
  FRICTION_F: s(150),
  FRICTION_R: s(320),
  /** the cup: radius (px) + the max speed (px/s) it will swallow */
  CUP_R: s(5),
  CUP_SPEED: s(70),
  /** putt: launch px/s at full power; chip: carry yards at full power */
  PUTT_V: s(340),
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

/** the accuracy tap's verdict (ALL swings now): the cage-green equivalent —
 *  PURE inside the centered window; early/high pulls, late/low pushes (ADR-038) */
export type StrikeQuality = 'pure' | 'pull' | 'push';

export type GolfEvent =
  | { kind: 'stroke'; n: number; mode: SwingMode; quality: StrikeQuality }
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
    // tee/pin are authored in NATIVE px; the sim works in RUNTIME px (matches
    // the seam-upscaled ground), so scale them on read. atan2 is scale-free.
    this.ball = { x: s(hole.tee.x), y: s(hole.tee.y), z: 0 };
    this.lastDry = { x: s(hole.tee.x), y: s(hole.tee.y) };
    this.aim = Math.atan2(s(hole.pin.y) - s(hole.tee.y), s(hole.pin.x) - s(hole.tee.x));
    this.autoClub();
  }

  /** the bag suggests by distance (B still cycles freely) */
  private autoClub(): void {
    const ydsToPin = dist(this.ball.x, this.ball.y, s(this.hole.pin.x), s(this.hole.pin.y)) / YD;
    let best = CLUBS.length - 1;
    for (let i = 0; i < CLUBS.length; i++) {
      if (CLUBS[i].carry >= ydsToPin - 4) best = i;
    }
    this.clubIdx = best;
  }

  lie(): Terrain {
    // The ball is runtime px; terrainAt queries the NATIVE course grid, so bridge
    // back to native (÷ ART_SCALE) here — the single runtime↔native boundary.
    return terrainAt(this.grid, this.ball.x / ART_SCALE, this.ball.y / ART_SCALE);
  }

  /** what the next swing will be: putt on the green, chip inside 30y, full */
  swingMode(): SwingMode {
    const lie = this.lie();
    if (lie === 'G') return 'putt';
    const yds = dist(this.ball.x, this.ball.y, s(this.hole.pin.x), s(this.hole.pin.y)) / YD;
    return yds <= GOLF.CHIP_ZONE_YD ? 'chip' : 'full';
  }

  /** the live accuracy window half-width (club × lie) — HUD draws THIS */
  accWindow(): number {
    return CLUBS[this.clubIdx].accWindow * LIES[this.lie()].acc;
  }

  /** captured POWER from the rising needle — today's exact clamp (the yardage
   *  contract is unchanged); shared by tick() and the test bot */
  private powerFromNeedle(m: number): number {
    return Math.max(0.05, Math.min(1, m));
  }

  /** captured ACCURACY: the falling needle's signed distance from the centered
   *  green window, clamped to ±ACC_MAG (pull = +, push = −) */
  private accFromNeedle(m: number): number {
    return Math.max(-GOLF.ACC_MAG, Math.min(GOLF.ACC_MAG, m - GOLF.ACC_CENTER));
  }

  ydsToPin(): number {
    return Math.round(dist(this.ball.x, this.ball.y, s(this.hole.pin.x), s(this.hole.pin.y)) / YD);
  }

  private emit(e: GolfEvent): void {
    this.events.push(e);
  }

  /** edges seen by advance() that no tick has consumed yet (ADR-038) */
  private pendA = false;
  private pendB = false;

  /**
   * Feed real dt; the sim quantizes to SIM_DT ticks. EDGES ARE LOSSLESS
   * (ADR-038, the cage's law applied to grass): a sub-quantum frame runs
   * zero ticks — its taps CARRY to the next frame's first tick. The 3-tap
   * meter is a timing game; it cannot eat taps.
   */
  advance(dtMs: number, input: GolfInput): void {
    this.acc_ += Math.min(dtMs, 100);
    this.pendA = this.pendA || input.aPressed;
    this.pendB = this.pendB || input.bPressed;
    let first = true;
    while (this.acc_ >= SIM_DT) {
      this.acc_ -= SIM_DT;
      if (first) {
        this.tick({ ...input, aPressed: this.pendA, bPressed: this.pendB });
        this.pendA = this.pendB = false;
        first = false;
      } else {
        this.tick({ ...input, aPressed: false, bPressed: false });
      }
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
          this.meterDir = 1; // always rise from the bottom (clear any leftover dir)
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
          // tap 1 captures POWER (same clamp as ever — yardage unchanged); the
          // needle then snaps to the TOP of the rail and falls as the ACCURACY
          // needle. EVERY mode now takes the second tap (chips & putts too).
          this.power = this.powerFromNeedle(this.meterT);
          this.meterDir = -1;
          this.meterT = GOLF.POWER_CAP;
          this.phase = 'acc';
        }
        return;
      }
      case 'acc': {
        // tap 2 captures ACCURACY: the falling needle's distance from the
        // centered green window (reuse POWER_MS — same speed as the up-leg)
        this.meterT -= SIM_DT / GOLF.POWER_MS;
        if (input.aPressed || this.meterT <= GOLF.ACC_FLOOR) {
          this.acc = this.accFromNeedle(this.meterT);
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
        if (this.lie() !== 'W') {
          this.lastDry = { x: this.ball.x, y: this.ball.y };
        }
        if (k >= 1) this.land();
        return;
      }
      case 'roll': {
        const dt = SIM_DT / 1000;
        const lie = this.lie();
        const fr = lie === 'G' ? GOLF.FRICTION_G : lie === 'F' || lie === 'T' ? GOLF.FRICTION_F : GOLF.FRICTION_R;
        const sp = Math.hypot(this.vx, this.vy);
        if (sp > 0) {
          const dec = fr * dt;
          const ns = Math.max(0, sp - dec);
          this.vx = (this.vx / sp) * ns;
          this.vy = (this.vy / sp) * ns;
        }
        // the green's honest break — exactly the slope the arrows draw.
        // slope is an accel (px/s²) authored in NATIVE units (the arrows are
        // painted native then seam-upscaled), so scale it to the runtime roll.
        if (lie === 'G') {
          this.vx += s(this.hole.slope.x) * dt;
          this.vy += s(this.hole.slope.y) * dt;
        }
        this.ball.x += this.vx * dt;
        this.ball.y += this.vy * dt;
        this.ball.z = 0;
        // the cup (pin in runtime px to match the ball)
        const d = dist(this.ball.x, this.ball.y, s(this.hole.pin.x), s(this.hole.pin.y));
        const speed = Math.hypot(this.vx, this.vy);
        if (d <= GOLF.CUP_R && speed <= GOLF.CUP_SPEED) {
          this.phase = 'holed';
          this.over = true;
          this.ball.x = s(this.hole.pin.x);
          this.ball.y = s(this.hole.pin.y);
          this.emit({ kind: 'sfx', name: 'swish' });
          this.emit({ kind: 'holed', strokes: this.strokes, par: this.hole.par });
          return;
        }
        if (this.lie() === 'W') {
          this.splash();
          return;
        }
        if (speed < s(6)) {
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
    // the strike-quality read (the cage-green equivalent): PURE inside the
    // window — putts and chips are power-only, so a clean tap reads pure
    const quality: StrikeQuality = Math.abs(this.acc) <= this.accWindow() ? 'pure' : this.acc > 0 ? 'pull' : 'push';
    this.emit({ kind: 'stroke', n: this.strokes, mode: this.mode, quality });
    if (quality === 'pure' && this.mode === 'full') this.emit({ kind: 'sfx', name: 'green' });
    const lie = LIES[this.lie()];
    if (this.mode === 'putt') {
      // a mishit putt leaves the face off-line (the centered window applies to
      // putts now); at acc=0 this is byte-identical to a pure putt. Still no curve.
      const a = this.aim - this.acc * GOLF.PUSH_RAD;
      const v = GOLF.PUTT_V * this.power;
      this.vx = Math.cos(a) * v;
      this.vy = Math.sin(a) * v;
      this.phase = 'roll';
      this.emit({ kind: 'sfx', name: 'bounce' });
      return;
    }
    const club = CLUBS[this.clubIdx];
    const carryYd = this.mode === 'chip' ? GOLF.CHIP_CARRY_YD : club.carry;
    // carryPx is runtime (YD scales); floor it at a runtime minimum carry
    const carryPx = Math.max(s(8), carryYd * YD * this.power * lie.carry);
    // push/pull deflects the line; the same error CURVES the flight
    const dir = this.aim + -this.acc * GOLF.PUSH_RAD;
    this.dirX = Math.cos(dir);
    this.dirY = Math.sin(dir);
    this.flightT = 0;
    // flight DURATION is a time (ms) and must NOT scale with the framebuffer,
    // so derive it from the NATIVE carry (carryPx/ART_SCALE). This keeps
    // flightT1 invariant across ART_SCALE; the launch speed (carryPx/flightT1)
    // then scales ×ART_SCALE on its own, so the whole flight — carry, curve,
    // wind, apex — stays geometrically similar. (At ×1, carryPx/1 = today.)
    const carryPxNative = carryPx / ART_SCALE;
    this.flightT1 = this.mode === 'chip' ? GOLF.CHIP_MS : GOLF.FLIGHT_BASE_MS + carryPxNative * GOLF.FLIGHT_PER_PX;
    const v = carryPx / (this.flightT1 / 1000);
    this.vx = this.dirX * v;
    this.vy = this.dirY * v;
    this.curve = this.mode === 'chip' ? 0 : -this.acc * GOLF.CURVE;
    const loft = this.mode === 'chip' ? 0.9 : club.loft;
    // apex height is runtime px: a base lift s(22) + a loft-fraction of carryPx
    this.apex = s(22) + carryPx * loft * 0.16;
    this.phase = 'flight';
    this.emit({ kind: 'sfx', name: 'swing_bat' });
  }

  private land(): void {
    const terr = this.lie();
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
      const v = s(90) + this.rng() * s(120); // cliff-kick speed (px/s) — runtime
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
    // convert remaining momentum into a roll at landing speed (px/s, runtime;
    // rollPx already scales via YD, so only the floor needs s())
    const v = Math.max(s(30), rollPx * 1.6);
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
    // re-aim at the pin (runtime px, like the ball) and re-suggest a club
    this.aim = Math.atan2(s(this.hole.pin.y) - this.ball.y, s(this.hole.pin.x) - this.ball.x);
    this.autoClub();
  }
}
