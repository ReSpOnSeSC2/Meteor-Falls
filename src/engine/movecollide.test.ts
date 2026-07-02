import { describe, it, expect } from 'vitest';
import { aabbOverlap, entersNewBody, type Rect } from './movecollide';

const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

describe('aabbOverlap', () => {
  it('detects an overlap', () => expect(aabbOverlap(R(0, 0, 10, 10), R(5, 5, 10, 10))).toBe(true));
  it('touching edges do not overlap', () => expect(aabbOverlap(R(0, 0, 10, 10), R(10, 0, 10, 10))).toBe(false));
  it('disjoint boxes do not overlap', () => expect(aabbOverlap(R(0, 0, 10, 10), R(50, 0, 10, 10))).toBe(false));
});

describe('entersNewBody — the ADR-137 soft-lock rule', () => {
  // a car/NPC collision rect that is bigger than the player's ~10x9 foot-box
  const car = R(20, 0, 40, 40); // spans x[20,60] y[0,40]

  it('blocks a step that enters a body fresh (solidity preserved)', () => {
    const cur = R(0, 10, 10, 9); // outside the car
    const box = R(15, 10, 10, 9); // step right, x[15,25] now overlaps the car
    expect(entersNewBody(box, cur, [car])).toBe(true);
  });

  it('does NOT block a step while already inside the body (escapes the soft-lock)', () => {
    const cur = R(35, 10, 10, 9); // deep inside the car
    const box = R(30, 10, 10, 9); // step left, still inside — must be allowed so we can walk out
    expect(entersNewBody(box, cur, [car])).toBe(false);
  });

  it('does NOT block the remaining steps out of the body', () => {
    const cur = R(52, 10, 10, 9); // inside, near the right edge
    const box = R(56, 10, 10, 9); // stepping further right, still overlapping on the way out
    expect(entersNewBody(box, cur, [car])).toBe(false);
  });

  it('never blocks once fully clear of every body', () => {
    const cur = R(62, 10, 10, 9); // just past the car (touching-only, no overlap)
    const box = R(66, 10, 10, 9); // free space
    expect(entersNewBody(box, cur, [car])).toBe(false);
  });

  it('still blocks entering a SECOND body while escaping the first (no free phase-through)', () => {
    const carA = R(20, 0, 40, 40); // x[20,60]
    const carB = R(60, 0, 40, 40); // x[60,100], flush against carA
    const cur = R(50, 10, 10, 9); // x[50,60] — inside carA only (touches carB's edge, no overlap)
    const box = R(52, 10, 10, 9); // x[52,62] — still in carA AND now overlaps carB → blocked
    expect(entersNewBody(box, cur, [carA, carB])).toBe(true);
  });

  it('no bodies present → never blocks', () => {
    expect(entersNewBody(R(0, 0, 10, 9), R(5, 0, 10, 9), [])).toBe(false);
  });
});
