/**
 * THE CAGE sim — the determinism creed, headless (S12/ADR-034; overhauled
 * S12c). The bot proves the WIRING at pump(n, 8.33); these prove the MATH:
 * same seed + same inputs = same final score, shots live on release timing
 * against a TOP-ANCHORED meter, THE RANGE LAW closes the green and kills
 * makes past range (the full-court-heave fix, pinned by an 80k-tick tape),
 * and TIMED DEFENSE (BLOCK_TIMING / STEAL_TIMING) is pinned curve by curve.
 */
import { describe, expect, it } from 'vitest';
import {
  HoopsSim,
  IDLE_INPUT,
  SIM_DT,
  TUNE,
  METER,
  RANGE,
  BLOCK_TIMING,
  STEAL_TIMING,
  ANKLE_TIERS,
  MOVES,
  DUNK_METER,
  LAYUP_METER,
  FINISH_RANGE_PX,
  makeRng,
  effectiveRange,
  greenWindow,
  gradeShot,
  makeChance,
  blockChance,
  stealChance,
  dunkWindow,
  layupWindow,
  pickupGameOver,
  stuffChance,
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

/** a seeded input tape over the FULL S12c control surface: held directions,
 *  meter holds + releases, B-tap passes/swipes, X sprint, Y sauce — the same
 *  tape drives both runs of every reproducibility check */
function tape(seed: number, ticks: number): TickInput[] {
  const rng = makeRng(seed);
  const out: TickInput[] = [];
  let cur = { dx: 0 as -1 | 0 | 1, dy: 0 as -1 | 0 | 1, aHeld: false, xHeld: false };
  let hold = 0;
  let prevA = false;
  for (let t = 0; t < ticks; t++) {
    if (hold-- <= 0) {
      hold = 20 + Math.floor(rng() * 50);
      cur = {
        dx: ([-1, 0, 1] as const)[Math.floor(rng() * 3)],
        dy: ([-1, 0, 1] as const)[Math.floor(rng() * 3)],
        aHeld: rng() < 0.3,
        xHeld: rng() < 0.25,
      };
    }
    const frame: TickInput = {
      dx: cur.dx,
      dy: cur.dy,
      aHeld: cur.aHeld,
      aPressed: cur.aHeld && !prevA,
      aReleased: !cur.aHeld && prevA,
      bPressed: rng() < 0.006,
      xHeld: cur.xHeld,
      yPressed: rng() < 0.004,
    };
    prevA = cur.aHeld;
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

describe('THE RESPONSIVENESS LAW (ADR-038): edges are lossless', () => {
  function liveSim(): HoopsSim {
    const sim = new HoopsSim({ format: '3v3', seed: 4, us: five('us').slice(0, 3), them: five('vs').slice(0, 3) });
    for (let i = 0; i < 130; i++) sim.tick(IDLE_INPUT); // the check settles
    return sim;
  }

  it('a press inside a ZERO-TICK frame still starts the gather', () => {
    const sim = liveSim();
    // 4ms < one 8.33ms quantum: zero ticks run — the 120Hz half-frame case
    sim.advance(4, { ...IDLE_INPUT, aHeld: true, aPressed: true });
    expect(sim.holder()?.state).toBe('play'); // nothing ran yet…
    sim.advance(5, { ...IDLE_INPUT, aHeld: true });
    expect(sim.holder()?.state).toBe('gather'); // …the press CARRIED
  });

  it('a release inside a zero-tick frame still fires the shot', () => {
    const sim = liveSim();
    sim.advance(SIM_DT + 0.01, { ...IDLE_INPUT, aHeld: true, aPressed: true });
    const shooter = sim.holder();
    expect(shooter?.state).toBe('gather');
    for (let i = 0; i < 40; i++) sim.tick({ ...IDLE_INPUT, aHeld: true });
    // the release lands in a sub-quantum frame — it must not vanish
    sim.advance(4, { ...IDLE_INPUT, aReleased: true });
    sim.advance(5, IDLE_INPUT);
    expect(shooter?.state).toBe('rise'); // the jumper left the hand
  });

  it('a same-tick tap (press+release in one frame) releases instantly', () => {
    const sim = liveSim();
    const shooter = sim.holder();
    sim.advance(SIM_DT + 0.01, { ...IDLE_INPUT, aPressed: true, aReleased: true });
    expect(shooter?.state).toBe('rise'); // a quick flick, honest near-zero fill
  });
});

describe('THE FINISH METER (ADR-038): easy to reach, timed to make', () => {
  it('plain movement near the rim triggers the finish — no sprint gate', () => {
    const sim = new HoopsSim({ format: '3v3', seed: 4, us: five('us').slice(0, 3), them: five('vs').slice(0, 3) });
    for (let i = 0; i < 130; i++) sim.tick(IDLE_INPUT);
    const h = sim.holder();
    expect(h).not.toBeNull();
    if (!h) return;
    // walk (NOT sprint) toward the shared rim until inside the trigger zone
    let guard = 0;
    while (Math.hypot(h.x - 46, h.y - 184) >= FINISH_RANGE_PX - 6 && guard++ < 2000) {
      sim.tick({ ...IDLE_INPUT, dx: -1 });
    }
    sim.tick({ ...IDLE_INPUT, dx: -1, aHeld: true, aPressed: true });
    // five() test ratings carry dnk 50 ≥ 40 — the finish is a dunk
    expect(h.state).toBe('dunk');
  });

  it('the layup window is the forgiving one, clamped, sht-scaled', () => {
    expect(layupWindow(50, 0)).toBeGreaterThan(dunkWindow(50, 0));
    expect(layupWindow(90, 0)).toBeGreaterThan(layupWindow(30, 0));
    expect(layupWindow(99, 0)).toBeLessThanOrEqual(LAYUP_METER.HI);
    expect(layupWindow(8, 1)).toBeGreaterThanOrEqual(LAYUP_METER.LO);
  });

  it('a layup released in the green is MONEY, end to end', () => {
    // a low-dnk five so the finish resolves as a layup (dnk 30 < 40)
    const low = (tag: string): AthleteDef[] =>
      Array.from({ length: 3 }, (_, i) => ({
        key: `athlete_low_${tag}_${i}`,
        name: `${tag} ${i}`,
        rating: { spd: 50, sht: 50, dnk: 30, dfn: 50 },
        archetype: 'balanced',
      }));
    let makes = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const sim = new HoopsSim({ format: '3v3', seed, drill: true, us: low('us'), them: low('vs') });
      for (let i = 0; i < 130; i++) sim.tick(IDLE_INPUT);
      const h = sim.holder();
      if (!h || h.team !== 0) continue;
      let guard = 0;
      while (Math.hypot(h.x - 46, h.y - 184) >= 120 && guard++ < 3000) sim.tick({ ...IDLE_INPUT, dx: -1 });
      sim.tick({ ...IDLE_INPUT, dx: -1, aHeld: true, aPressed: true });
      expect(h.state).toBe('layup');
      // hold through the run; release inside the live window
      for (let i = 0; i < 200 && h.state === 'layup'; i++) {
        const m = sim.meterOf(sim.athletes.indexOf(h));
        if (m && m.frac >= m.lo + (1 - m.lo) * 0.45) {
          sim.tick({ ...IDLE_INPUT, aReleased: true });
          break;
        }
        sim.tick({ ...IDLE_INPUT, aHeld: true });
      }
      for (let i = 0; i < 400 && !sim.events.some((e) => e.kind === 'score' || e.kind === 'miss'); i++) sim.tick(IDLE_INPUT);
      if (sim.events.some((e) => e.kind === 'score')) makes++;
      sim.events.length = 0;
    }
    expect(makes).toBeGreaterThanOrEqual(5); // green = money (timing decides)
  });

  it('holding the finish all the way through is the overfill miss', () => {
    const low: AthleteDef[] = Array.from({ length: 3 }, (_, i) => ({
      key: `athlete_hold_${i}`,
      name: `H ${i}`,
      rating: { spd: 50, sht: 50, dnk: 30, dfn: 50 },
      archetype: 'balanced',
    }));
    const sim = new HoopsSim({ format: '3v3', seed: 2, drill: true, us: low, them: low });
    for (let i = 0; i < 130; i++) sim.tick(IDLE_INPUT);
    const h = sim.holder();
    if (!h) return;
    let guard = 0;
    while (Math.hypot(h.x - 46, h.y - 184) >= 120 && guard++ < 3000) sim.tick({ ...IDLE_INPUT, dx: -1 });
    sim.tick({ ...IDLE_INPUT, dx: -1, aHeld: true, aPressed: true });
    const log: SimEvent[] = [];
    for (let i = 0; i < 600; i++) {
      sim.tick({ ...IDLE_INPUT, aHeld: true }); // never lets go
      log.push(...sim.events);
      sim.events.length = 0;
    }
    expect(log.some((e) => e.kind === 'miss')).toBe(true);
    expect(log.some((e) => e.kind === 'score')).toBe(false);
  });
});

describe('THE RANGE LAW (S12c — the full-court-heave fix)', () => {
  it('effectiveRange derives from sht and clamps to the spec band', () => {
    expect(effectiveRange(50)).toBe(COURT.ARC_R);
    expect(effectiveRange(60)).toBeCloseTo(COURT.ARC_R + 12, 5);
    expect(effectiveRange(8)).toBeCloseTo(COURT.ARC_R * 0.85, 5); // clamped low
    expect(effectiveRange(99)).toBeCloseTo(COURT.ARC_R * 1.35, 5); // clamped high
    expect(RANGE.MIN).toBeCloseTo(COURT.ARC_R * 0.85, 5);
    expect(RANGE.MAX).toBeCloseTo(COURT.ARC_R * 1.35, 5);
  });

  it('the GREEN window shrinks with distance and CLOSES TO ZERO at range', () => {
    const r = effectiveRange(50);
    const w0 = greenWindow(50, 0, 0);
    const w25 = greenWindow(50, r * 0.25, 0);
    const w50 = greenWindow(50, r * 0.5, 0);
    const w75 = greenWindow(50, r * 0.75, 0);
    expect(w0).toBeGreaterThan(w25);
    expect(w25).toBeGreaterThan(w50);
    expect(w50).toBeGreaterThan(w75);
    expect(w75).toBeGreaterThan(0); // still open just inside
    // the distance term STEEPENS — the falloff accelerates going back
    expect(w25 - w50).toBeLessThan(w50 - w75);
    // AT range the window is exactly shut; beyond it no green exists
    expect(greenWindow(50, r, 0)).toBe(0);
    expect(greenWindow(50, r + 1, 0)).toBe(0);
    expect(greenWindow(50, r * 2, 0)).toBe(0);
    // the old 0.022 floor is dead: no minimum window at silly distance
    expect(greenWindow(10, 400, 1)).toBe(0);
  });

  it('shooters get more window; a hand in the face squeezes it', () => {
    expect(greenWindow(90, 100, 0)).toBeGreaterThan(greenWindow(50, 100, 0));
    expect(greenWindow(50, 100, 0.8)).toBeLessThan(greenWindow(50, 100, 0));
  });

  it('non-green make% decays hard past range: ≤2% at 1.5×, zero beyond', () => {
    const r = effectiveRange(50);
    const inRange = makeChance('slight', 50, r * 0.8, 0);
    expect(inRange).toBeGreaterThan(0.4); // slightly off pays ≈60% in range
    const past = makeChance('slight', 50, r * 1.2, 0);
    expect(past).toBeLessThanOrEqual(RANGE.DECAY_CAP);
    expect(past).toBeLessThan(inRange);
    expect(makeChance('slight', 50, r * 1.45, 0)).toBeLessThanOrEqual(0.02);
    expect(makeChance('slight', 50, r * 1.5, 0)).toBe(0);
    expect(makeChance('far', 50, r * 1.5, 0)).toBe(0);
    expect(makeChance('slight', 50, r * 3, 0)).toBe(0);
  });

  it('GREEN is money inside range (100%) and IMPOSSIBLE beyond it', () => {
    const r = effectiveRange(50);
    expect(makeChance('green', 50, r * 0.5, 0)).toBe(METER.GREEN_P);
    expect(makeChance('green', 50, r + 1, 0)).toBe(0);
    // …and gradeShot can never even produce a green out there
    expect(gradeShot(METER.TOP, 50, r + 1, 0)).not.toBe('green');
  });

  it('way off = ZERO: bricks have no floor anywhere', () => {
    expect(makeChance('brick', 50, 20, 0)).toBe(0);
    expect(makeChance('brick', 50, 300, 0)).toBe(0);
  });
});

describe('the meter, rebuilt (S12c): green sits AT THE TOP', () => {
  it('the window ends at METER.TOP and overfilling auto-misses', () => {
    const half = greenWindow(50, 100, 0);
    expect(half).toBeGreaterThan(0);
    expect(gradeShot(METER.TOP, 50, 100, 0)).toBe('green'); // released at the top
    expect(gradeShot(METER.TOP - half * 2 + 0.001, 50, 100, 0)).toBe('green'); // window floor
    expect(gradeShot(METER.TOP + 0.01, 50, 100, 0)).toBe('brick'); // overfill
  });

  it('make% falls off with distance from the window: ~60 / ~20 / zero', () => {
    const half = greenWindow(50, 100, 0);
    const lo = METER.TOP - half * 2;
    expect(gradeShot(lo - 0.03, 50, 100, 0)).toBe('slight');
    expect(gradeShot(lo - 0.1, 50, 100, 0)).toBe('far');
    expect(gradeShot(lo - 0.2, 50, 100, 0)).toBe('brick');
    expect(makeChance('slight', 50, 100, 0)).toBeCloseTo(METER.SLIGHT_P, 5);
    expect(makeChance('far', 50, 100, 0)).toBeCloseTo(METER.FAR_P, 5);
    expect(makeChance('brick', 50, 100, 0)).toBe(0);
  });

  it('contest pressure needs proximity and ideally air', () => {
    expect(contestOf(60, 0, 0)).toBe(0);
    expect(contestOf(10, 0, 30)).toBeGreaterThan(contestOf(10, 0, 0));
  });

  it('the dunk meter window scales with dnk and clamps', () => {
    expect(dunkWindow(90, 0)).toBeGreaterThan(dunkWindow(40, 0));
    expect(dunkWindow(99, 0)).toBeLessThanOrEqual(DUNK_METER.HI);
    expect(dunkWindow(8, 1)).toBeGreaterThanOrEqual(DUNK_METER.LO);
  });
});

describe('TIMED DEFENSE (S12c): the weighting tables', () => {
  it('BLOCK_TIMING: a peak that brackets the release blocks at a high rate', () => {
    const perfect = blockChance(0, 50, 50, 8);
    const edge = blockChance(BLOCK_TIMING.PEAK_WINDOW_MS, 50, 50, 8);
    const late = blockChance(BLOCK_TIMING.PEAK_WINDOW_MS * 3, 50, 50, 8);
    expect(perfect).toBeGreaterThan(0.55); // ~0.65 perfectly timed
    expect(edge).toBeLessThan(perfect);
    expect(late).toBeLessThan(0.16); // ~0.10 poorly timed
    expect(late).toBeGreaterThanOrEqual(BLOCK_TIMING.LO);
    // monotone inside the window
    expect(blockChance(40, 50, 50, 8)).toBeGreaterThan(blockChance(90, 50, 50, 8));
  });

  it('BLOCK_TIMING: rating + proximity scale, clamped [0.05, 0.85]', () => {
    expect(blockChance(0, 90, 30, 4)).toBeGreaterThan(blockChance(0, 30, 90, 4));
    expect(blockChance(0, 99, 8, 0)).toBeLessThanOrEqual(BLOCK_TIMING.HI);
    expect(blockChance(500, 8, 99, BLOCK_TIMING.REACH_PX)).toBeGreaterThanOrEqual(BLOCK_TIMING.LO);
    // closer hands block more, all else equal
    expect(blockChance(0, 50, 50, 4)).toBeGreaterThan(blockChance(0, 50, 50, 24));
  });

  it('STEAL_TIMING: window-hit swipes steal high, neutral stays low', () => {
    expect(stealChance(50, false, 50, true)).toBeCloseTo(STEAL_TIMING.TIMED, 5);
    expect(stealChance(50, false, 50, false)).toBeCloseTo(STEAL_TIMING.NEUTRAL, 5);
    expect(stealChance(70, false, 50, true)).toBeCloseTo(0.5 + 20 * STEAL_TIMING.RATING, 5);
    expect(stealChance(50, true, 50, false)).toBeCloseTo(STEAL_TIMING.NEUTRAL + STEAL_TIMING.HAWK, 5);
    expect(stealChance(99, true, 8, true)).toBeLessThanOrEqual(STEAL_TIMING.HI);
    expect(stealChance(8, false, 99, false)).toBeGreaterThanOrEqual(STEAL_TIMING.LO);
  });

  it('the seeded rolls stay inside honest bands', () => {
    expect(stuffChance(90, 10, false)).toBeGreaterThanOrEqual(0.04);
    expect(stuffChance(10, 90, true)).toBeLessThanOrEqual(0.85);
    expect(ankleChance(99, 10, true)).toBeLessThanOrEqual(0.62);
    expect(ANKLE_TIERS.LARGE).toBeLessThan(ANKLE_TIERS.SMALL);
    expect(ANKLE_TIERS.SMALL).toBeLessThan(1);
    expect(MOVES.STARTUP_MS).toBe(STEAL_TIMING.WINDOW_MS); // the startup IS the window
  });
});

describe('timed defense, end to end (drill-mode scenarios)', () => {
  /** stand the user defender at the drill shooter's hip */
  function drillSim(seed: number, script: 'shoot' | 'moves'): HoopsSim {
    const sim = new HoopsSim({ format: '3v3', seed, drill: true, us: five('us').slice(0, 3), them: five('vs').slice(0, 3) });
    for (let i = 0; i < 130; i++) sim.tick(IDLE_INPUT); // check settles
    sim.drillGiveBall(1);
    for (let i = 0; i < 130; i++) sim.tick(IDLE_INPUT);
    sim.drillScript = script;
    return sim;
  }

  it('a leap timed to the release blocks far more often than an early hop', () => {
    const tryBlock = (early: boolean): number => {
      let blocks = 0;
      for (let seed = 1; seed <= 24; seed++) {
        const sim = drillSim(seed, 'shoot');
        let jumped = false;
        for (let i = 0; i < 4000 && !sim.over; i++) {
          const h = sim.holder();
          let input: TickInput = IDLE_INPUT;
          if (h && h.team === 1) {
            const u = sim.athletes[sim.controlled];
            // teleport the defender to the hip once (test setup, not play)
            if (Math.abs(u.x - h.x) > 16) {
              u.x = h.x + 12;
              u.y = h.y;
            }
            if (h.state === 'gather' && !jumped && u.leapCd <= 0 && u.z === 0) {
              const releaseMs = h.planFrac * TUNE.METER_MS;
              const peakMs = ((TUNE.JUMP_V + u.def.rating.dnk * 0.6) / TUNE.GRAVITY) * 1000;
              const jumpAt = early ? 0 : releaseMs - peakMs;
              if (h.gatherMs >= jumpAt) {
                input = { ...IDLE_INPUT, aPressed: true };
                jumped = true;
              }
            }
            if (h.state !== 'gather') jumped = false;
          }
          sim.tick(input);
          if (sim.events.some((e) => e.kind === 'block')) {
            blocks++;
            break;
          }
          sim.events.length = 0;
        }
      }
      return blocks;
    };
    const timed = tryBlock(false);
    const early = tryBlock(true);
    expect(timed).toBeGreaterThanOrEqual(10); // high rate across 24 seeds
    expect(timed).toBeGreaterThan(early * 1.6); // timing IS the input
  });

  it('GOALTENDING: touching it on the way down counts the basket', () => {
    let goaltends = 0;
    let countedWithIt = 0;
    for (let seed = 1; seed <= 40 && goaltends === 0; seed++) {
      const sim = drillSim(seed, 'shoot');
      const rim = sim.rimOf(1);
      let themBefore = sim.scoreThem;
      for (let i = 0; i < 8000 && goaltends === 0; i++) {
        const u = sim.athletes[sim.controlled];
        let input: TickInput = IDLE_INPUT;
        // camp the rim (test placement, not play)
        if (u.state === 'play' && Math.hypot(u.x - rim.x, u.y - rim.y) > 8) {
          u.x = rim.x + 5;
          u.y = rim.y;
        }
        // leap as the shot comes DOWN over the iron — the violation
        if (sim.ball.kind === 'shot') {
          const b = sim.ball;
          const k = b.t / b.t1;
          if (k > 0.5 && k < 0.85 && u.z === 0 && u.leapCd <= 0 && Math.hypot(b.x - rim.x, b.y - rim.y) < 70) {
            input = { ...IDLE_INPUT, aPressed: true };
          }
        }
        themBefore = sim.scoreThem;
        sim.tick(input);
        for (const e of sim.events) {
          if (e.kind === 'goaltend') goaltends++;
        }
        if (goaltends > 0 && sim.scoreThem > themBefore) countedWithIt++;
        sim.events.length = 0;
      }
    }
    expect(goaltends).toBeGreaterThan(0); // the descent is protected
    expect(countedWithIt).toBeGreaterThan(0); // and the basket COUNTED
  });

  it('a swipe inside the dribble-move startup strips it at the timed rate', () => {
    let timedEvents = 0;
    let steals = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const sim = drillSim(seed, 'moves');
      const before = steals;
      for (let i = 0; i < 4000 && !sim.over; i++) {
        const h = sim.holder();
        let input: TickInput = IDLE_INPUT;
        if (h && h.team === 1) {
          const u = sim.athletes[sim.controlled];
          if (Math.abs(u.x - h.x) > 16) {
            u.x = h.x + 12;
            u.y = h.y;
          }
          const inStartup = (h.state === 'spin' || h.state === 'btb' || h.state === 'btl') && h.stateT < STEAL_TIMING.WINDOW_MS;
          if (inStartup && u.swipeCd <= 0 && u.state === 'play' && u.beatenT <= 0) {
            input = { ...IDLE_INPUT, bPressed: true };
          }
        }
        sim.tick(input);
        for (const e of sim.events) {
          if (e.kind === 'timed' && e.action === 'steal') timedEvents++;
          if (e.kind === 'steal') steals++;
        }
        sim.events.length = 0;
        if (steals > before) break; // one strip per seed proves the window
      }
    }
    expect(timedEvents).toBeGreaterThanOrEqual(12); // the window read fired
    expect(steals).toBeGreaterThanOrEqual(8); // ~0.5 timed rate lands strips
  });
});

describe('the 80k-tick tape: the AI never banks from beyond its range', () => {
  it('every basket in two long games lands inside 1.2× the shooter range', () => {
    for (const seed of [21, 1995]) {
      const inputs = tape(seed ^ 11, 80_000);
      const sim = new HoopsSim({ format: '5v5', seed, us: five('us'), them: five('vs') });
      let lastWasGoaltend = false;
      let scores = 0;
      for (const inp of inputs) {
        if (sim.over) break;
        sim.tick(inp);
        for (const e of sim.events) {
          if (e.kind === 'goaltend') lastWasGoaltend = true;
          if (e.kind === 'score') {
            scores++;
            if (!lastWasGoaltend) {
              const shooter = sim.athletes[e.by];
              const limit = 1.2 * effectiveRange(shooter.def.rating.sht);
              expect(e.dist, `seed ${seed}: ${shooter.def.name} scored from ${Math.round(e.dist)}px`).toBeLessThanOrEqual(limit);
            }
            lastWasGoaltend = false;
          }
        }
        sim.events.length = 0;
      }
      expect(scores).toBeGreaterThan(4); // the games happened
    }
  });

  it('the ≤1s desperation heave fires from deep, reads as one, never drops', () => {
    // idle through OUR camped possession: the 24 dies, THEY take under their
    // own rim — a full court from the rim they attack. Pin the clock at 950ms
    // and the very next decision is the heave (the lone range-gate exception).
    const sim = new HoopsSim({ format: '5v5', seed: 13, us: five('us'), them: five('vs') });
    for (let i = 0; i < 12_000; i++) {
      sim.tick(IDLE_INPUT);
      sim.events.length = 0;
      if (sim.phase === 'live' && sim.holder()?.team === 1) break;
    }
    const h = sim.holder();
    expect(h?.team).toBe(1);
    sim.shotMs = 950;
    let heaved = false;
    let scored = false;
    for (let i = 0; i < 1200; i++) {
      sim.tick(IDLE_INPUT);
      for (const e of sim.events) {
        if (e.kind === 'heave') heaved = true;
        if (e.kind === 'score' && e.team === 1) scored = true;
      }
      sim.events.length = 0;
      if (heaved && sim.ball.kind !== 'shot' && i > 200) break; // the prayer landed (or died)
    }
    expect(heaved).toBe(true); // it exists and reads as one
    expect(scored).toBe(false); // and it is honestly terrible
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
