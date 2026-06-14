/**
 * S18 Movement 32 (ADR-072) — THE PAPERBOY sim.
 *
 * Proves the minigame law: deterministic (same seed + tape → same score), a clean
 * route is winnable, hazards cost, a bad run floors at 0, and the prize gates on
 * the deliver goal.
 */
import { describe, it, expect } from 'vitest';
import { buildRoute, PaperboySim, prizeEarned, type PaperInput, type Lane } from './sim';
import { PAPERBOY, liveRoute } from '../data/paperboy';

/** an optimal tape: ride toward each upcoming mailbox's side and throw on its column */
function optimalTape(route = liveRoute()): PaperInput[] {
  const mail = new Map<number, Lane>();
  for (const it of route.items) if (it.kind === 'mailbox') mail.set(it.x, it.lane);
  const tape: PaperInput[] = [];
  for (let x = 1; x < route.length; x++) {
    const here = mail.get(x);
    if (here !== undefined) tape.push({ lane: here === 0 ? 0 : 2, throw: true });
    else tape.push({ lane: 1, throw: false });
  }
  return tape;
}

describe('paperboy — determinism (the minigame law)', () => {
  it('same seed + tape → identical score', () => {
    const r = buildRoute('t', 42);
    const tape = optimalTape(r);
    const a = new PaperboySim(r).run(tape);
    const b = new PaperboySim(r).run(tape);
    expect(a.score).toBe(b.score);
    expect(a.delivered).toBe(b.delivered);
  });
  it('the route builds the same from the same seed', () => {
    expect(JSON.stringify(buildRoute('t', 7))).toBe(JSON.stringify(buildRoute('t', 7)));
  });
});

describe('paperboy — a clean run wins; a lazy run does not', () => {
  it('an optimal run delivers the goal and earns the prize', () => {
    const r = liveRoute();
    const s = new PaperboySim(r).run(optimalTape(r));
    expect(s.done).toBe(true);
    expect(s.delivered).toBeGreaterThanOrEqual(r.deliverGoal);
    expect(prizeEarned(r, s)).toBe(true);
    expect(s.score).toBeGreaterThan(0);
  });
  it('never throwing misses every house and loses the prize', () => {
    const r = liveRoute();
    const lazy = Array.from({ length: r.length }, () => ({ lane: 1 as Lane, throw: false }));
    const s = new PaperboySim(r).run(lazy);
    expect(s.delivered).toBe(0);
    expect(prizeEarned(r, s)).toBe(false);
    expect(s.score).toBe(0); // EarthBound-kind: floored, never negative
  });
});

describe('paperboy — hazards cost the score', () => {
  it('riding into a hazard lane loses points vs dodging it', () => {
    // a tiny hand-built route: one hazard at x=2 lane 0, one mailbox at x=4 lane 2
    const route = { id: 'h', length: 6, papers: 2, deliverGoal: 1, items: [
      { x: 2, lane: 0 as Lane, kind: 'dog' as const },
      { x: 4, lane: 2 as Lane, kind: 'mailbox' as const },
    ] };
    const dodge = new PaperboySim(route).run([
      { lane: 2, throw: false }, { lane: 2, throw: false }, { lane: 2, throw: false }, { lane: 2, throw: true },
    ]);
    const crash = new PaperboySim(route).run([
      { lane: 0, throw: false }, { lane: 0, throw: false }, { lane: 2, throw: false }, { lane: 2, throw: true },
    ]);
    expect(crash.hits).toBe(1);
    expect(dodge.hits).toBe(0);
    expect(dodge.score).toBeGreaterThan(crash.score);
  });
});

describe('paperboy — the prize config', () => {
  it('the live prize is a flag + a finale caller', () => {
    expect(PAPERBOY.prize.flag).toBe('paperboy_won');
    expect(PAPERBOY.prize.caller.length).toBeGreaterThan(0);
  });
});
