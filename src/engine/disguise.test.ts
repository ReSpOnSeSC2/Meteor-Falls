/**
 * S18 Movement 31 (ADR-072) — THE DISGUISE / COSTUME SYSTEM (§A6 sneaks).
 * Blend-by-faction, the deterministic "made" check, and the always-a-fight law.
 */
import { describe, it, expect } from 'vitest';
import { blendsWith, madeChance, isMade, onSpotted, disguisesForBand } from './disguise';

describe('disguise — blending', () => {
  it('the blue blazer blends you with the Smilers, not the palace', () => {
    expect(blendsWith('blue_blazer', 'smiler')).toBe(true);
    expect(blendsWith('blue_blazer', 'palace_guard')).toBe(false);
    expect(blendsWith(null, 'smiler')).toBe(false);
  });
});

describe('disguise — the made check', () => {
  it('no/wrong disguise is always made against that faction', () => {
    expect(madeChance(null, 'smiler', 0.5)).toBe(1);
    expect(madeChance('palace_silks', 'smiler', 0.5)).toBe(1);
  });
  it('a good disguise vs low alertness is hard to make', () => {
    // blue_blazer quality 0.7; a sleepy guard (alertness 0.4) can't see through it
    expect(madeChance('blue_blazer', 'smiler', 0.4)).toBe(0);
    expect(isMade('blue_blazer', 'smiler', 0.4, 0.99)).toBe(false);
  });
  it('a sharp guard can sometimes see through it', () => {
    // alertness 0.9 vs quality 0.7 → 0.2 chance
    expect(madeChance('blue_blazer', 'smiler', 0.9)).toBeCloseTo(0.2, 5);
    expect(isMade('blue_blazer', 'smiler', 0.9, 0.1)).toBe(true);  // rolled under
    expect(isMade('blue_blazer', 'smiler', 0.9, 0.5)).toBe(false); // rolled over
  });
});

describe('disguise — getting spotted is a fight, never a fail', () => {
  it('onSpotted always returns a fight', () => {
    expect(onSpotted()).toBe('fight');
  });
});

describe('disguise — the wardrobe', () => {
  it('Ch.1 offers the blue blazer', () => {
    expect(disguisesForBand('ch1').map((d) => d.id)).toContain('blue_blazer');
  });
});
