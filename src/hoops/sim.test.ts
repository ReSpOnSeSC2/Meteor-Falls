/**
 * THE CAGE sim — the determinism creed, headless (S12/ADR-034). The bot
 * proves the WIRING at pump(n, 8.33); these prove the MATH: same seed +
 * same inputs = same final score, shot grading lives on release timing,
 * the street rules (1s/2s, win-by-2, the 24 count) hold to the digit.
 */
import { describe, expect, it } from 'vitest';
import {
  HoopsSim,
  IDLE_INPUT,
  SIM_DT,
  TUNE,
  makeRng,
  gradeShot,
  greenWindow,
  makeChance,
  pickupGameOver,
  stuffChance,
  stealChance,
  ankleChance,
  contestOf,
  type AthleteDef,
  type SimEvent,
  type TickInput,
} from './sim';
import { COURT, pointsFor } from './court';

const five = (tag: string, spd = 50): AthleteDef[] =>
  Array.from({ length: 5 }, (_, i) => ({
    key: `athlete_test_${tag}_${i}`,
    name: `${tag.toUpperCase()} ${i}`,
    rating: { spd, sht: 50, dnk: 50, dfn: 50 },
    archetype: i === 0 ? 'rusher' : i === 1 ? 'sniper' : i === 2 ? 'post' : i === 3 ? 'hawk' : 'balanced',
  }));

/** a seeded input tape: deterministic chunks of held directions + taps —
 *  the same tape drives both runs of every reproducibility check */
function tape(seed: number, ticks: number): TickInput[] {
  const rng = makeRng(seed);
  const out: TickInput[] = [];
  let cur: TickInput = { ...IDLE_INPUT };
  let hold = 0;
  let prevA = false;
  let prevB = false;
  for (let t = 0; t < ticks; t++) {
    if (hold-- <= 0) {
      hold = 20 + Math.floor(rng() * 50);
      const aHeld = rng() < 0.3;
      const bHeld = rng() < 0.25;
      cur = {
        dx: ([-1, 0, 1] as const)[Math.floor(rng() * 3)],
        dy: ([-1, 0, 1] as const)[Math.floor(rng() * 3)],
        aHeld,
        aPressed: false,
        aReleased: false,
        bHeld,
        bPressed: false,
        bReleased: false,
      };
    }
    const frame: TickInput = {
      ...cur,
      aPressed: cur.aHeld && !prevA,
      aReleased: !cur.aHeld && prevA,
      bPressed: cur.bHeld && !prevB,
      bReleased: !cur.bHeld && prevB,
    };
    prevA = cur.aHeld;
    prevB = cur.bHeld;
    out.push(frame);
  }
  return out;
}

function runTape(sim: HoopsSim, inputs: TickInput[]): SimEvent[] {
  const log: SimEvent[] = [];
  for (const inp of inputs) {
    if (sim.over) break;
    sim.tick(inp);
    log.push(...sim.events);
    sim.events.length = 0;
  }
  return log;
}

describe('the cabinet law: same seed + same inputs = same final score', () => {
  it('replays a 3v3 to the identical score and event stream', () => {
    const inputs = tape(42, 60_000); // ~8.3 sim minutes — plenty of buckets
    const mk = (): HoopsSim => new HoopsSim({ format: '3v3', seed: 1995, us: five('us').slice(0, 3), them: five('vs').slice(0, 3) });
    const a = mk();
    const b = mk();
    const logA = runTape(a, inputs);
    const logB = runTape(b, inputs);
    expect(a.scoreUs).toBe(b.scoreUs);
    expect(a.scoreThem).toBe(b.scoreThem);
    expect(a.scoreUs + a.scoreThem).toBeGreaterThan(0); // the game happened
    expect(JSON.stringify(logA)).toBe(JSON.stringify(logB));
  });

  it('a different seed plays a different game', () => {
    const inputs = tape(42, 30_000);
    const a = new HoopsSim({ format: '3v3', seed: 1995, us: five('us').slice(0, 3), them: five('vs').slice(0, 3) });
    const b = new HoopsSim({ format: '3v3', seed: 1996, us: five('us').slice(0, 3), them: five('vs').slice(0, 3) });
    const logA = runTape(a, inputs);
    const logB = runTape(b, inputs);
    expect(JSON.stringify(logA)).not.toBe(JSON.stringify(logB));
  });

  it('advance() quantizes any dt mix onto the same tick stream', () => {
    const a = new HoopsSim({ format: '5v5', seed: 7, us: five('us'), them: five('vs') });
    const b = new HoopsSim({ format: '5v5', seed: 7, us: five('us'), them: five('vs') });
    // a ticks 8.33ms quanta directly; b advances in ragged frame deltas
    for (let i = 0; i < 1200; i++) a.tick(IDLE_INPUT);
    let fed = 0;
    for (const dt of [16.7, 8.33, 33.4, 8.33, 25, 16.7]) {
      while (fed + dt <= 1200 * SIM_DT) {
        b.advance(dt, IDLE_INPUT);
        fed += dt;
      }
    }
    // the accumulator may hold float dust below one quantum — flush it
    b.advance(1200 * SIM_DT - fed + 0.01, IDLE_INPUT);
    expect(b.t).toBeCloseTo(a.t, 3);
    expect(b.scoreUs).toBe(a.scoreUs);
    expect(b.scoreThem).toBe(a.scoreThem);
  });
});

describe('shots live and die on release timing', () => {
  it('the GREEN window scales with stat, range, and a hand in the face', () => {
    const base = greenWindow(50, 100, 0);
    expect(greenWindow(90, 100, 0)).toBeGreaterThan(base); // shooters get more
    expect(greenWindow(50, 250, 0)).toBeLessThan(base); // range taxes it
    expect(greenWindow(50, 100, 0.8)).toBeLessThan(base); // contests squeeze it
    expect(greenWindow(10, 400, 1)).toBeGreaterThanOrEqual(0.022); // never closes
  });

  it('grades read off the window the HUD draws', () => {
    const half = greenWindow(50, 120, 0);
    expect(gradeShot(TUNE.GREEN_CENTER, 50, 120, 0)).toBe('green');
    expect(gradeShot(TUNE.GREEN_CENTER - half - 0.05, 50, 120, 0)).toBe('early');
    expect(gradeShot(TUNE.GREEN_CENTER + half + 0.05, 50, 120, 0)).toBe('late');
    expect(gradeShot(0.1, 50, 120, 0)).toBe('brick');
  });

  it('GREEN is money; bricks are bricks', () => {
    expect(makeChance('green', 50, 200, 0)).toBeGreaterThan(0.95);
    expect(makeChance('brick', 50, 60, 0)).toBeLessThan(0.1);
    const early = makeChance('early', 50, 120, 0);
    expect(makeChance('early', 50, 120, 0.9)).toBeLessThan(early); // contested
  });

  it('contest pressure needs proximity and ideally air', () => {
    expect(contestOf(60, 0, 0)).toBe(0);
    expect(contestOf(10, 0, 30)).toBeGreaterThan(contestOf(10, 0, 0));
  });

  it('the seeded rolls stay inside honest bands', () => {
    expect(stuffChance(90, 10, false)).toBeGreaterThanOrEqual(0.04);
    expect(stuffChance(10, 90, true)).toBeLessThanOrEqual(0.85);
    expect(stealChance(99, true, 10)).toBeLessThanOrEqual(0.45);
    expect(ankleChance(99, 10, true)).toBeLessThanOrEqual(0.62);
  });
});

describe('street rules', () => {
  it('FIRST TO 21, WIN BY 2 — the pickup horn', () => {
    expect(pickupGameOver(21, 19)).toBe(true);
    expect(pickupGameOver(21, 20)).toBe(false); // win by 2 means win by 2
    expect(pickupGameOver(22, 20)).toBe(true);
    expect(pickupGameOver(20, 18)).toBe(false);
    expect(pickupGameOver(19, 21)).toBe(true);
  });

  it('the 24 runs out and PERMIT counts the last five out loud', () => {
    const sim = new HoopsSim({ format: '5v5', seed: 3, us: five('us'), them: five('vs') });
    // idle input: our controlled handler stands at the take forever
    const log = runTape(sim, Array.from({ length: 4000 }, () => IDLE_INPUT));
    const counts = log.filter((e): e is Extract<SimEvent, { kind: 'count' }> => e.kind === 'count').map((e) => e.n);
    expect(counts).toContain(5);
    expect(counts).toContain(1);
    expect(log.some((e) => e.kind === 'violation')).toBe(true);
  });

  it('a quarter ends at the horn and the next one re-seeds identically', () => {
    const mk = (): HoopsSim =>
      new HoopsSim({ format: '5v5', seed: 9, us: five('us'), them: five('vs'), clockMs: 2_000 });
    const a = mk();
    const logA = runTape(a, Array.from({ length: 600 }, () => IDLE_INPUT));
    expect(logA.some((e) => e.kind === 'quarterEnd' && e.quarter === 1)).toBe(true);
    // resume equivalence (the v5 checkpoint): a live Q2 and a constructed
    // Q2 play out identically under the same tape
    a.startQuarter(2);
    const fresh = new HoopsSim({
      format: '5v5',
      seed: 9,
      us: five('us'),
      them: five('vs'),
      quarter: 2,
      scoreUs: a.scoreUs,
      scoreThem: a.scoreThem,
    });
    const inputs = tape(8, 24_000);
    const liveLog = runTape(a, inputs);
    const freshLog = runTape(fresh, inputs);
    expect(a.scoreUs).toBe(fresh.scoreUs);
    expect(a.scoreThem).toBe(fresh.scoreThem);
    expect(JSON.stringify(liveLog)).toBe(JSON.stringify(freshLog));
  });

  it('1s and 2s — 2 behind the arc (pointsFor is the law at release)', () => {
    const rim = { x: COURT.RIM_L_X, y: COURT.RIM_Y };
    expect(pointsFor(rim.x + COURT.ARC_R + 4, rim.y, rim)).toBe(2);
    expect(pointsFor(rim.x + COURT.ARC_R - 4, rim.y, rim)).toBe(1);
    expect(pointsFor(rim.x + 10, rim.y - 10, rim)).toBe(1);
    // corner 2: the arc is a circle, not a line — deep corners count
    expect(pointsFor(rim.x, rim.y + COURT.ARC_R + 2, rim)).toBe(2);
    // and a long game produces only street scores, both denominations live
    const inputs = tape(11, 80_000);
    const sim = new HoopsSim({ format: '5v5', seed: 21, us: five('us'), them: five('vs') });
    const log = runTape(sim, inputs);
    const scores = log.filter((e): e is Extract<SimEvent, { kind: 'score' }> => e.kind === 'score');
    expect(scores.length).toBeGreaterThan(0);
    for (const s of scores) expect([1, 2]).toContain(s.pts);
  });

  it('overtime: a tied Q4 horn opens a 2-minute period, never a winner', () => {
    const sim = new HoopsSim({ format: '5v5', seed: 5, us: five('us'), them: five('vs'), quarter: 4, clockMs: 1_000 });
    const log = runTape(sim, Array.from({ length: 300 }, () => IDLE_INPUT));
    // scores are 0-0 (idle take) — the horn must NOT end the game
    expect(log.some((e) => e.kind === 'gameEnd')).toBe(false);
    expect(log.some((e) => e.kind === 'quarterEnd' && e.quarter === 4)).toBe(true);
    sim.startQuarter(5);
    expect(sim.clockMs).toBe(TUNE.OT_MS);
  });
});
