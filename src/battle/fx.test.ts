/**
 * S11 — FX timeline math + pooling (the headless half of battle/fx).
 * The skip law under test: choreography compresses by the SAME ×4 the text
 * typewriter uses (ADR-010) — the caller pre-scales dt, the timeline only
 * ever sees milliseconds, so 'fast' can never desync events from spans.
 */
import { describe, expect, it } from 'vitest';
import { FxTimeline, Pool, staggerTimes } from './fxTimeline';

describe('FxTimeline', () => {
  it('fires events at their times, in order, under chunky dt', () => {
    const tl = new FxTimeline();
    const log: string[] = [];
    tl.event(300, () => log.push('c'));
    tl.event(100, () => log.push('a'));
    tl.event(200, () => log.push('b'));
    tl.tick(50); // 50ms: nothing
    expect(log).toEqual([]);
    tl.tick(100); // 150ms: a
    expect(log).toEqual(['a']);
    // one giant tick jumps past b AND c — both fire, schedule order kept
    tl.tick(500);
    expect(log).toEqual(['a', 'b', 'c']);
    expect(tl.done).toBe(true);
  });

  it('spans get progress in [0,1] and always end exactly at 1', () => {
    const tl = new FxTimeline();
    const seen: number[] = [];
    tl.span(100, 300, (p) => seen.push(p));
    tl.tick(100); // at from-edge
    tl.tick(100); // halfway
    tl.tick(1000); // way past
    expect(seen[0]).toBeCloseTo(0, 5);
    expect(seen[1]).toBeCloseTo(0.5, 5);
    expect(seen[seen.length - 1]).toBe(1);
    // never updates again once done
    const n = seen.length;
    tl.tick(100);
    expect(seen.length).toBe(n);
  });

  it('completes when the clock passes the latest event/span/hold', () => {
    const tl = new FxTimeline();
    tl.event(50, () => undefined);
    tl.hold(400);
    expect(tl.duration).toBe(400);
    tl.tick(399);
    expect(tl.done).toBe(false);
    tl.tick(1);
    expect(tl.done).toBe(true);
  });

  it('whenDone resolves on completion (and immediately if already done)', async () => {
    const tl = new FxTimeline();
    tl.hold(100);
    let resolved = false;
    void tl.whenDone().then(() => (resolved = true));
    tl.tick(100);
    await Promise.resolve();
    expect(resolved).toBe(true);
    await tl.whenDone(); // already-done path must not hang
  });

  it('×4 skip (pre-scaled dt) compresses wall time without dropping beats', () => {
    const run = (mult: number): { frames: number; fired: number[] } => {
      const tl = new FxTimeline();
      const fired: number[] = [];
      [120, 240, 360, 480].forEach((at, i) => tl.event(at, () => fired.push(i)));
      let frames = 0;
      while (!tl.tick(16.7 * mult)) frames++;
      return { frames, fired };
    };
    const slow = run(1);
    const fast = run(4); // holding A/B: same dt×4, like the typewriter
    expect(fast.fired).toEqual(slow.fired); // every beat still fires, in order
    expect(fast.frames).toBeLessThan(slow.frames / 3); // ~4× fewer frames
  });

  it('staggerTimes spreads multi-target sweeps one impact per enemy', () => {
    expect(staggerTimes(3, 200, 110)).toEqual([200, 310, 420]);
    expect(staggerTimes(1, 50)).toEqual([50]);
  });
});

describe('Pool', () => {
  it('reuses released objects instead of constructing new ones', () => {
    interface P {
      live: boolean;
    }
    const pool = new Pool<P>(
      () => ({ live: true }),
      (o) => (o.live = false),
    );
    const a = pool.take();
    const b = pool.take();
    expect(pool.totalCreated).toBe(2);
    pool.give(a);
    pool.give(b);
    expect(pool.available).toBe(2);
    // a 100-burst cycle on a 2-deep pool never constructs a third object
    for (let i = 0; i < 100; i++) {
      const x = pool.take();
      const y = pool.take();
      pool.give(x);
      pool.give(y);
    }
    expect(pool.totalCreated).toBe(2);
    expect(pool.available).toBe(2);
  });
});
