/**
 * The procedural-transition MATH (engine/transitions). The runtime draw is a thin
 * Phaser shell; the timing curves live in pure helpers, so the endpoints,
 * monotonicity, and the swirl's ACCELERATION are pinned here (the wipes can't
 * silently drift). Mirrors the formulas.test.ts style: exact, no Phaser.
 */
import { describe, it, expect } from 'vitest';
import {
  easeAccel,
  clamp,
  irisRadiusAt,
  irisMaxRadius,
  swirlAngleAt,
  swirlRadiusAt,
  barOffsetsAt,
  swirlTintIndex,
} from './transitions';
import { SWIRL_TINT } from '../battle/formulas';

const STEPS = 20;
/** sample a [0,1]-domain function at evenly spaced progress points */
const sample = (f: (p: number) => number, n = STEPS): number[] =>
  Array.from({ length: n + 1 }, (_, i) => f(i / n));
const isNonDecreasing = (xs: number[]): boolean => xs.every((v, i) => i === 0 || v >= xs[i - 1] - 1e-9);
const isStrictlyIncreasing = (xs: number[]): boolean => xs.every((v, i) => i === 0 || v > xs[i - 1] + 1e-9);

describe('clamp', () => {
  it('clamps to [lo,hi]', () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});

describe('easeAccel — the swirl wind-up curve', () => {
  it('hits the endpoints exactly', () => {
    expect(easeAccel(0)).toBe(0);
    expect(easeAccel(1)).toBe(1);
  });
  it('clamps out-of-range progress', () => {
    expect(easeAccel(-3)).toBe(0);
    expect(easeAccel(5)).toBe(1);
  });
  it('is strictly increasing', () => {
    expect(isStrictlyIncreasing(sample(easeAccel))).toBe(true);
  });
  it('ACCELERATES — each step is bigger than the last (slope grows)', () => {
    const xs = sample(easeAccel);
    const deltas = xs.slice(1).map((v, i) => v - xs[i]);
    // every successive delta strictly exceeds the previous → convex / accelerating
    expect(deltas.every((d, i) => i === 0 || d > deltas[i - 1] + 1e-9)).toBe(true);
  });
});

describe('irisRadiusAt', () => {
  const maxR = 500;
  it("'in' grows the hole from a point to full screen", () => {
    expect(irisRadiusAt(0, maxR, 'in')).toBe(0);
    expect(irisRadiusAt(1, maxR, 'in')).toBe(maxR);
  });
  it("'out' shrinks the hole from full screen to a point", () => {
    expect(irisRadiusAt(0, maxR, 'out')).toBe(maxR);
    expect(irisRadiusAt(1, maxR, 'out')).toBe(0);
  });
  it("'in' is monotonic up, 'out' monotonic down", () => {
    expect(isNonDecreasing(sample((p) => irisRadiusAt(p, maxR, 'in')))).toBe(true);
    expect(isNonDecreasing(sample((p) => -irisRadiusAt(p, maxR, 'out')))).toBe(true);
  });
  it('in and out are mirror images (sum to maxR at every p)', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expect(irisRadiusAt(p, maxR, 'in') + irisRadiusAt(p, maxR, 'out')).toBeCloseTo(maxR, 6);
    }
  });
});

describe('irisMaxRadius', () => {
  it('a centred focus reaches the corner (half-diagonal)', () => {
    // 800×600 centred → corner is (400,300) away → 500
    expect(irisMaxRadius(800, 600, 400, 300)).toBeCloseTo(500, 6);
  });
  it('an off-centre focus measures to the FARTHEST corner', () => {
    // focus at the top-left corner → farthest corner is the full diagonal
    expect(irisMaxRadius(800, 600, 0, 0)).toBeCloseTo(1000, 6);
    // focus past one edge still reaches the opposite extent
    expect(irisMaxRadius(800, 600, 800, 600)).toBeCloseTo(1000, 6);
  });
  it('always covers the screen — radius ≥ every corner distance', () => {
    const w = 700;
    const h = 400;
    const cx = 120;
    const cy = 360;
    const R = irisMaxRadius(w, h, cx, cy);
    const corners: Array<[number, number]> = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ];
    for (const [x, y] of corners) expect(R).toBeGreaterThanOrEqual(Math.hypot(x - cx, y - cy) - 1e-9);
  });
});

describe('swirlAngleAt — the accelerating spin', () => {
  it('starts at 0 and ends after the requested whole turns', () => {
    expect(swirlAngleAt(0)).toBe(0);
    expect(swirlAngleAt(1)).toBeCloseTo(3 * Math.PI * 2, 6); // default 3 turns
    expect(swirlAngleAt(1, 5)).toBeCloseTo(5 * Math.PI * 2, 6);
  });
  it('is strictly increasing (never unspins mid-wind)', () => {
    expect(isStrictlyIncreasing(sample((p) => swirlAngleAt(p)))).toBe(true);
  });
  it('ACCELERATES — angular steps grow toward the end', () => {
    const xs = sample((p) => swirlAngleAt(p));
    const deltas = xs.slice(1).map((v, i) => v - xs[i]);
    expect(deltas[deltas.length - 1]).toBeGreaterThan(deltas[0]);
    expect(deltas.every((d, i) => i === 0 || d > deltas[i - 1] + 1e-9)).toBe(true);
  });
});

describe('swirlRadiusAt — the spiral filling the screen', () => {
  const maxR = 640;
  it('grows from the centre point out to maxR', () => {
    expect(swirlRadiusAt(0, maxR)).toBe(0);
    expect(swirlRadiusAt(1, maxR)).toBeCloseTo(maxR, 6);
  });
  it('is strictly increasing and accelerating', () => {
    const xs = sample((p) => swirlRadiusAt(p, maxR));
    expect(isStrictlyIncreasing(xs)).toBe(true);
    const deltas = xs.slice(1).map((v, i) => v - xs[i]);
    expect(deltas.every((d, i) => i === 0 || d > deltas[i - 1] + 1e-9)).toBe(true);
  });
});

describe('barOffsetsAt — the louvre half-cover', () => {
  const BARS = 8;
  const H = 480;
  const slot = H / BARS;
  it('opens (p=0 → zero cover) and shuts (p=1 → the two rects meet at slot/2)', () => {
    expect(barOffsetsAt(0, BARS, H).every((v) => v === 0)).toBe(true);
    expect(barOffsetsAt(1, BARS, H).every((v) => Math.abs(v - slot / 2) < 1e-9)).toBe(true);
  });
  it('returns one entry per bar', () => {
    expect(barOffsetsAt(0.5, BARS, H)).toHaveLength(BARS);
  });
  it('two half-covers exactly tile the slot at full close (no gap, no overlap)', () => {
    const half = barOffsetsAt(1, BARS, H)[0];
    expect(half * 2).toBeCloseTo(slot, 6);
  });
  it('the cover grows monotonically with the close fraction', () => {
    const first = sample((p) => barOffsetsAt(p, BARS, H)[0]);
    expect(isNonDecreasing(first)).toBe(true);
  });
  it('clamps out-of-range progress', () => {
    expect(barOffsetsAt(-1, BARS, H)[0]).toBe(0);
    expect(barOffsetsAt(2, BARS, H)[0]).toBeCloseTo(slot / 2, 6);
  });
});

describe('swirlTintIndex — reuses the ADR-043 traffic-light palette', () => {
  it('sneak=green(player), spotted=red(enemy), neutral=paper-grey — the SWIRL_TINT values', () => {
    expect(swirlTintIndex('sneak')).toBe(SWIRL_TINT.player);
    expect(swirlTintIndex('spotted')).toBe(SWIRL_TINT.enemy);
    expect(swirlTintIndex('neutral')).toBe(SWIRL_TINT.none);
  });
});
