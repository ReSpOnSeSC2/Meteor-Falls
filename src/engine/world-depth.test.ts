import { describe, expect, it } from 'vitest';
import { groundedVisualDepth } from './world-depth';

describe('groundedVisualDepth', () => {
  it('sorts from the visual bottom-centre instead of the roof', () => {
    const samples: Array<readonly [number, number]> = [];
    const result = groundedVisualDepth(
      { x: 20, y: 30, w: 80, h: 120 },
      1_000,
      (x, y) => {
        samples.push([x, y]);
        return 2;
      },
    );

    expect(samples).toEqual([[60, 150]]);
    expect(result).toEqual({ x: 60, y: 150, level: 2, lift: 2_000, depth: 2_150 });
  });

  it('uses a facade doorway as the preferred ground contact', () => {
    const result = groundedVisualDepth(
      { x: 20, y: 30, w: 80, h: 120 },
      500,
      (x, y) => (x === 84 && y === 138 ? 1 : 9),
      { x: 84, y: 138 },
    );

    expect(result).toEqual({ x: 84, y: 138, level: 1, lift: 500, depth: 650 });
  });

  it('keeps a malformed preferred contact inside the visual footprint', () => {
    const result = groundedVisualDepth(
      { x: 20, y: 30, w: 80, h: 120 },
      0,
      () => 0,
      { x: 500, y: 150 },
    );

    expect(result.x).toBe(100);
  });
});
