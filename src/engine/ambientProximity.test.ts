import { describe, expect, it } from 'vitest';
import {
  WATER_ACCENT_INTERVAL_MS,
  containsWater,
  isNearWater,
} from './ambientProximity';

const GRID = [
  '..........',
  '.......E..',
  '.......e..',
  '..........',
] as const;

describe('sparse water ambience proximity', () => {
  it('recognizes authored sea and shoreline cells', () => {
    expect(containsWater(GRID)).toBe(true);
    expect(containsWater(['....', '.RR.'])).toBe(false);
  });

  it('only reports water inside the requested physical radius', () => {
    expect(isNearWater(GRID, 5, 1, 2)).toBe(true);
    expect(isNearWater(GRID, 1, 1, 2)).toBe(false);
  });

  it('handles map edges and keeps accents genuinely occasional', () => {
    expect(isNearWater(['e...'], 0, 0, 1)).toBe(true);
    expect(isNearWater(['e...'], 3, 0, 1)).toBe(false);
    expect(WATER_ACCENT_INTERVAL_MS).toBeGreaterThanOrEqual(30_000);
  });
});
