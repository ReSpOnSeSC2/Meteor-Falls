import { describe, it, expect } from 'vitest';
import { projectPoint, projectScreen, pivotY, DEFAULT_PERSPECTIVE } from './perspective';

describe('HD-2D perspective projection core', () => {
  const p = DEFAULT_PERSPECTIVE;

  it('is the identity at the pivot row (dy = 0)', () => {
    const r = projectPoint(50, 0, p);
    expect(r.scale).toBeCloseTo(1, 6);
    expect(r.sx).toBeCloseTo(50, 6);
    expect(r.sy).toBeCloseTo(0, 6);
  });

  it('shrinks things ABOVE the pivot (far / dy < 0)', () => {
    const r = projectPoint(0, -300, p);
    expect(r.scale).toBeLessThan(1);
    // farther rows are pulled DOWN toward the horizon (|sy| < |dy|)
    expect(Math.abs(r.sy)).toBeLessThan(300);
  });

  it('enlarges things BELOW the pivot (near / dy > 0)', () => {
    const r = projectPoint(0, 300, p);
    expect(r.scale).toBeGreaterThan(1);
  });

  it('never collapses past minScale in the far distance', () => {
    const r = projectPoint(0, -100000, p);
    expect(r.scale).toBeGreaterThanOrEqual(p.minScale);
  });

  it('flat (tilt 0) is a pure identity — the OFF state', () => {
    const flat = { ...p, tiltDeg: 0 };
    const r = projectPoint(123, -456, flat);
    expect(r.scale).toBeCloseTo(1, 6);
    expect(r.sx).toBeCloseTo(123, 6);
    expect(r.sy).toBeCloseTo(-456, 6);
  });

  it('projectScreen anchors the pivot and centres X', () => {
    const vh = 900, originX = 800;
    const py = pivotY(vh, p);
    const at = projectScreen(originX, py, originX, vh, p); // a point ON the pivot at centre
    expect(at.x).toBeCloseTo(originX, 4);
    expect(at.y).toBeCloseTo(py, 4);
    expect(at.scale).toBeCloseTo(1, 5);
  });
});
