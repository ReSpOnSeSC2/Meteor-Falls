/**
 * COSTA ESTRELLA LINKS — the determinism creed, headless (S13). Same seed +
 * same input tape = same card, forever; the 2-tap meter, lies, wind, slopes,
 * the splash penalty, and the cup are pinned; a scripted BOT plays hole 1
 * tee-to-cup REPRODUCIBLY (the LinksScene header documents the same line).
 */
import { describe, expect, it } from 'vitest';
import { GolfSim, GOLF, GOLF_IDLE, windOf, windPutts, type GolfEvent, type GolfInput } from './sim';
import { CLUBS, HOLES, COURSE_PAR, LIES, YD, expandRow, expandGrid, terrainAt, dist } from './course';
import { s } from '../spritegen/scale';
import { makeRng } from '../hoops/sim';
import { GOLFERS, GOLFER_ORDER, golferHoleScore, linksField, linksEntrants, linksNextOpponent, matchHoles, strokeExp, LINKS_REWARDS } from '../data/links';

describe('the course (eighteen authored holes)', () => {
  it('RLE expands exactly', () => {
    expect(expandRow('W2C2R10C2W2')).toBe('WWCCRRRRRRRRRRCCWW');
    expect(expandGrid(['2*W3', 'C3'])).toEqual(['WWW', 'WWW', 'CCC']);
  });

  it('eighteen holes: uniform grids, tee on T, pin on G, par mix 3/4/5', () => {
    expect(HOLES).toHaveLength(18);
    const pars = new Set(HOLES.map((h) => h.par));
    expect(pars.has(3) && pars.has(4) && pars.has(5)).toBe(true);
    for (const h of HOLES) {
      const grid = expandGrid(h.rle);
      const w = grid[0].length;
      grid.forEach((row) => expect(row.length, `${h.id} row width`).toBe(w));
      expect(terrainAt(grid, h.tee.x, h.tee.y), `${h.id} tee lie`).toBe('T');
      expect(terrainAt(grid, h.pin.x, h.pin.y), `${h.id} pin lie`).toBe('G');
      expect(h.name.length).toBeGreaterThan(0);
      expect(h.plaque).toContain(h.name.toUpperCase());
    }
    expect(COURSE_PAR).toBe(72);
  });

  it('the bag descends in carry and the lies tax honestly', () => {
    for (let i = 1; i < CLUBS.length; i++) {
      expect(CLUBS[i].carry).toBeLessThan(CLUBS[i - 1].carry);
      expect(CLUBS[i].loft).toBeGreaterThan(CLUBS[i - 1].loft);
    }
    expect(LIES.R.carry).toBeLessThan(LIES.F.carry);
    expect(LIES.S.carry).toBeLessThan(LIES.R.carry);
    expect(LIES.S.acc).toBeLessThan(LIES.F.acc); // sand shrinks the window
  });

  it('off the grid is the surf', () => {
    const grid = expandGrid(HOLES[0].rle);
    expect(terrainAt(grid, -10, 50)).toBe('W');
    expect(terrainAt(grid, 5, 1e6)).toBe('W');
  });
});

describe('the wind (seeded per round, announced in putts)', () => {
  it('is deterministic off the round rng and bounded', () => {
    const a = windOf(makeRng(7));
    const b = windOf(makeRng(7));
    expect(a).toEqual(b);
    expect(a.mph).toBeLessThanOrEqual(GOLF.WIND_MAX_MPH);
    expect(windPutts(8)).toBe(4); // the caddy's units
    expect(windPutts(0)).toBe(0);
  });
});

/** the scripted bot: tee-to-cup on one hole, by polling the live meter —
 *  deterministic by construction (the LinksScene header carries this line) */
function playHole(holeIdx: number, seed: number): { strokes: number; log: GolfEvent[] } {
  const rng = makeRng(seed);
  const wind = windOf(rng);
  const sim = new GolfSim(HOLES[holeIdx], rng, wind);
  const log: GolfEvent[] = [];
  let guard = 0;
  while (!sim.over && guard++ < 400_000) {
    let input: GolfInput = GOLF_IDLE;
    if (sim.phase === 'aim') {
      input = { ...GOLF_IDLE, aPressed: true };
    } else if (sim.phase === 'power') {
      const d = dist(sim.ball.x, sim.ball.y, s(sim.hole.pin.x), s(sim.hole.pin.y));
      let want = 1; // full sends for full swings (the bag self-selects)
      if (sim.mode === 'putt') want = Math.min(1, Math.sqrt(2 * GOLF.FRICTION_G * d) / GOLF.PUTT_V + 0.04);
      if (sim.mode === 'chip') want = Math.min(1, d / (GOLF.CHIP_CARRY_YD * YD) + 0.05);
      // full sends ride to the top band (power clamps to 1.0); putt/chip tap their
      // computed power on the up-leg (powerFromNeedle maps it 1:1)
      const trigger = sim.mode === 'full' ? sim.meterT >= 1.0 : sim.meterT >= Math.min(0.99, want);
      if (trigger) input = { ...GOLF_IDLE, aPressed: true };
    } else if (sim.phase === 'acc') {
      // tap inside the CENTERED green window (meterT ≈ ACC_CENTER 0.5) → pure
      if (Math.abs(sim.meterT - 0.5) <= sim.accWindow() * 0.4) input = { ...GOLF_IDLE, aPressed: true };
    }
    sim.tick(input);
    log.push(...sim.events);
    sim.events.length = 0;
  }
  expect(sim.over).toBe(true);
  return { strokes: sim.strokes, log };
}

describe('the cabinet law on grass: same seed + same tape = same card', () => {
  it('the bot plays hole 1 tee-to-cup, twice, byte-identical', () => {
    const a = playHole(0, 1995);
    const b = playHole(0, 1995);
    expect(a.strokes).toBe(b.strokes);
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
    expect(a.strokes).toBeGreaterThanOrEqual(2);
    expect(a.strokes).toBeLessThanOrEqual(8); // a par-4 within reason
  });

  it('every hole closes out under the same driver', () => {
    for (let h = 0; h < HOLES.length; h++) {
      const { strokes } = playHole(h, 7 + h);
      expect(strokes, `hole ${h + 1}`).toBeLessThanOrEqual(HOLES[h].par + 6);
    }
  });

  it('a different seed blows a different wind', () => {
    expect(windOf(makeRng(1)).mph === windOf(makeRng(2)).mph && windOf(makeRng(1)).x === windOf(makeRng(2)).x).toBe(false);
  });
});

describe('THE RESPONSIVENESS LAW (ADR-038) on grass', () => {
  it('a tap inside a ZERO-TICK frame still starts the meter', () => {
    const sim = new GolfSim(HOLES[0], makeRng(3), { x: 0, y: 0, mph: 0 });
    sim.advance(4, { ...GOLF_IDLE, aPressed: true }); // sub-quantum: zero ticks
    expect(sim.phase).toBe('aim'); // nothing ran…
    sim.advance(5, GOLF_IDLE);
    expect(sim.phase).toBe('power'); // …the tap CARRIED
  });

  it('the strike verdict reads PURE inside the window, pull/push outside', () => {
    const swing = (accTapAt: (t: number, w: number) => boolean): ReturnType<GolfSim['events']['filter']> => {
      const sim = new GolfSim(HOLES[0], makeRng(3), { x: 0, y: 0, mph: 0 });
      sim.tick({ ...GOLF_IDLE, aPressed: true });
      for (let i = 0; i < 400 && sim.meterT < 1; i++) sim.tick(GOLF_IDLE);
      sim.tick({ ...GOLF_IDLE, aPressed: true }); // power
      const log: GolfEvent[] = [];
      for (let i = 0; i < 2000 && sim.phase === 'acc'; i++) {
        sim.tick(accTapAt(sim.meterT, sim.accWindow()) ? { ...GOLF_IDLE, aPressed: true } : GOLF_IDLE);
        log.push(...sim.events);
        sim.events.length = 0;
      }
      log.push(...sim.events);
      sim.events.length = 0;
      return log.filter((e) => e.kind === 'stroke');
    };
    const pure = swing((t, w) => Math.abs(t - 0.5) <= w * 0.4);
    expect(pure[0]?.kind === 'stroke' && pure[0].quality).toBe('pure');
    const pull = swing((t, w) => t - 0.5 > w * 1.5 && t - 0.5 <= w * 3); // tapped early/high → pull
    expect(pull[0]?.kind === 'stroke' && pull[0].quality).toBe('pull');
    const push = swing((t, w) => 0.5 - t > w * 1.5 && 0.5 - t <= w * 3); // tapped late/low → push
    expect(push[0]?.kind === 'stroke' && push[0].quality).toBe('push');
  });
});

describe('the 2-tap meter + the swing law', () => {
  it('power bounces (rise → fall → CANCEL); acc falls to the floor', () => {
    const rng = makeRng(3);
    const sim = new GolfSim(HOLES[0], rng, { x: 0, y: 0, mph: 0 });
    sim.tick({ ...GOLF_IDLE, aPressed: true }); // start
    expect(sim.phase).toBe('power');
    // never tap again: the needle rises, turns at the cap, dies at zero —
    // the swing CANCELS without a stroke (you waggled and stepped off)
    for (let i = 0; i < 600 && sim.phase === 'power'; i++) sim.tick(GOLF_IDLE);
    expect(sim.phase).toBe('aim');
    expect(sim.strokes).toBe(0);
    // now swing for real: start, capture near the top, never tap the third —
    // the acc needle hits the floor and auto-swings the big push
    sim.tick({ ...GOLF_IDLE, aPressed: true });
    for (let i = 0; i < 400 && sim.meterT < 1; i++) sim.tick(GOLF_IDLE);
    sim.tick({ ...GOLF_IDLE, aPressed: true }); // capture power ≈ 1
    expect(sim.phase).toBe('acc');
    for (let i = 0; i < 2000 && sim.phase === 'acc'; i++) sim.tick(GOLF_IDLE);
    expect(sim.phase).not.toBe('acc');
    expect(sim.strokes).toBe(1);
    expect(sim.acc).toBeCloseTo(GOLF.ACC_FLOOR, 3);
  });

  it('the window shrinks with the lie (club × lie, the HUD truth)', () => {
    const rng = makeRng(3);
    const sim = new GolfSim(HOLES[0], rng, { x: 0, y: 0, mph: 0 });
    const fairway = CLUBS[sim.clubIdx].accWindow * LIES.T.acc;
    expect(sim.accWindow()).toBeCloseTo(fairway, 6);
    expect(CLUBS[0].accWindow).toBeLessThan(CLUBS[6].accWindow); // driver is harder
  });

  it('the splash costs a stroke and drops at the last dry point', () => {
    // hole 2 carries surf: a fat tee shot finds water
    const rng = makeRng(11);
    const sim = new GolfSim(HOLES[1], rng, { x: 0, y: 0, mph: 0 });
    sim.tick({ ...GOLF_IDLE, aPressed: true });
    // capture a weak power (the carry dies over the surf)
    for (let i = 0; i < 40; i++) sim.tick(GOLF_IDLE);
    sim.tick({ ...GOLF_IDLE, aPressed: true }); // power ≈ 0.33 — wet
    for (let i = 0; i < 4000 && sim.phase !== 'aim'; i++) sim.tick(GOLF_IDLE);
    const splashed = sim.strokes;
    expect(splashed).toBe(2); // the swing + the penalty
    expect(sim.lie()).not.toBe('W'); // dropped dry (lie() bridges runtime→native)
  });

  it('putts now take the accuracy tap and can be mishit (pull/push)', () => {
    const sim = new GolfSim(HOLES[0], makeRng(3), { x: 0, y: 0, mph: 0 });
    sim.ball.x = s(HOLES[0].pin.x);
    sim.ball.y = s(HOLES[0].pin.y);
    sim.clubIdx = 0; // tightest window so the max-push read is unambiguous
    expect(sim.swingMode()).toBe('putt');
    sim.tick({ ...GOLF_IDLE, aPressed: true }); // aim → power
    for (let i = 0; i < 60 && sim.meterT < 0.5; i++) sim.tick(GOLF_IDLE);
    sim.tick({ ...GOLF_IDLE, aPressed: true }); // capture power
    expect(sim.phase).toBe('acc'); // ← the unification: a putt now takes the 2nd tap
    for (let i = 0; i < 2000 && sim.phase === 'acc'; i++) sim.tick(GOLF_IDLE); // no tap → floor
    expect(sim.acc).toBeCloseTo(-GOLF.ACC_MAG, 2); // max push
    const stroke = sim.events.find((e) => e.kind === 'stroke');
    expect(stroke && stroke.kind === 'stroke' && stroke.quality).toBe('push');
  });

  it('the accuracy window is centered (0.5) and the error grows with distance', () => {
    const accAt = (tapAt: number): number => {
      const sim = new GolfSim(HOLES[0], makeRng(3), { x: 0, y: 0, mph: 0 });
      sim.tick({ ...GOLF_IDLE, aPressed: true }); // → power
      for (let i = 0; i < 400 && sim.meterT < 1; i++) sim.tick(GOLF_IDLE);
      sim.tick({ ...GOLF_IDLE, aPressed: true }); // capture power → 'acc', needle at the top
      for (let i = 0; i < 2000 && sim.phase === 'acc'; i++) {
        if (sim.meterT <= tapAt) {
          sim.tick({ ...GOLF_IDLE, aPressed: true });
          break;
        }
        sim.tick(GOLF_IDLE);
      }
      return sim.acc;
    };
    expect(accAt(0.5)).toBeCloseTo(0, 1); // dead center → ~straight (sub-window; the tick reads just past 0.5)
    expect(accAt(0.7)).toBeCloseTo(0.2, 1); // high → pull (+)
    expect(accAt(0.3)).toBeCloseTo(-0.2, 1); // low → push (−)
    expect(accAt(-1)).toBeCloseTo(-GOLF.ACC_MAG, 2); // past the floor → clamped to −ACC_MAG
    expect(Math.abs(accAt(0.8))).toBeGreaterThan(Math.abs(accAt(0.6))); // farther = worse
  });
});

describe('the Invitational (flags carry the bracket)', () => {
  it('the field seats 32 with the party at the gate and tiers ramping', () => {
    const f = linksField(2026);
    expect(f).toHaveLength(32);
    expect(f[0]).toBe('party');
    expect(new Set(f).size).toBe(32);
    expect(GOLFERS[f[1]].tier).toBe(1);
    expect(GOLFERS[f[31]].tier).toBe(5);
    for (const id of GOLFER_ORDER) expect(f).toContain(id);
    expect(linksField(2026)).toEqual(f); // recomputable forever
  });

  it('entrants derive by replayed seeded sims — the party always alive', () => {
    for (let r = 0; r <= 4; r++) {
      const ent = linksEntrants(2026, r);
      expect(ent).toHaveLength(32 >> r);
      expect(ent).toContain('party');
      expect(linksEntrants(2026, r)).toEqual(ent);
    }
    const opp = linksNextOpponent(2026, 0);
    expect(GOLFERS[opp].tier).toBe(1); // the soft open
    expect(matchHoles(0)).toHaveLength(3);
    expect(matchHoles(4)[0].id).toBe(HOLES[(4 * 3) % HOLES.length].id);
  });

  it('golfer curves are honest: more acc, better cards; agg widens tails', () => {
    const hole = HOLES[0];
    const avg = (acc: number, agg: number): number => {
      const rng = makeRng(99);
      let s = 0;
      for (let i = 0; i < 4000; i++) s += golferHoleScore({ id: 'x', name: 'X', line: 'x', acc, agg, tier: 3 }, hole, rng);
      return s / 4000;
    };
    expect(avg(0.75, 0.4)).toBeLessThan(avg(0.25, 0.4)); // acc scores
    const eagleRate = (agg: number): number => {
      const rng = makeRng(5);
      let n = 0;
      for (let i = 0; i < 6000; i++) if (golferHoleScore({ id: 'x', name: 'X', line: 'x', acc: 0.5, agg, tier: 3 }, hole, rng) <= hole.par - 2) n++;
      return n;
    };
    expect(eagleRate(0.8)).toBeGreaterThan(eagleRate(0.1)); // agg makes eagles
  });

  it('stroke rewards pay the §A9-tuned card', () => {
    expect(strokeExp(0)).toBe(LINKS_REWARDS.stroke.evenPar);
    expect(strokeExp(-3)).toBe(150 + 75);
    expect(strokeExp(9)).toBe(Math.max(40, 150 - 108));
    expect(strokeExp(30)).toBe(LINKS_REWARDS.stroke.floor);
  });
});
