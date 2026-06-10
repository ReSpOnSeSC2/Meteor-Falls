import { describe, it, expect } from 'vitest';
import {
  physicalDamage,
  smashChance,
  vibeDamage,
  runChance,
  instantWin,
  expShare,
  applyWeakness,
} from './formulas';
import { rollPray, prayWeights, PRAY_BASE, type PrayTier } from '../data/abilities';
import { mulberry32 } from '../spritegen/pixmap';
import { expForLevel } from '../engine/state';

describe('battle formulas', () => {
  it('physical: offense*2 - defense with ±15% variance, min 1', () => {
    expect(physicalDamage(10, 5, () => 0.5)).toBe(15);
    expect(physicalDamage(1, 99, () => 0.5)).toBe(1);
    const lo = physicalDamage(10, 0, () => 0);
    const hi = physicalDamage(10, 0, () => 0.9999);
    expect(lo).toBe(17);
    expect(hi).toBe(23);
  });

  it('smash chance is guts-driven and capped', () => {
    expect(smashChance(0)).toBeCloseTo(0.02);
    expect(smashChance(1000)).toBe(0.2);
  });

  it('vibe damage scales with the Vibe stat', () => {
    const base = vibeDamage(55, 0, () => 0.5);
    const strong = vibeDamage(55, 60, () => 0.5);
    expect(strong).toBe(base * 2);
  });

  it('weakness multiplies 1.5x', () => {
    expect(applyWeakness(100, true)).toBe(150);
    expect(applyWeakness(100, false)).toBe(100);
  });

  it('run chance clamps 15%..92%', () => {
    expect(runChance(1, 99)).toBe(0.15);
    expect(runChance(99, 1)).toBe(0.92);
  });

  it('instant-win requires +6 levels and never fires on bosses', () => {
    expect(instantWin(8, 1, false)).toBe(true);
    expect(instantWin(6, 1, false)).toBe(false);
    expect(instantWin(50, 1, true)).toBe(false);
  });

  it('exp splits among the conscious, minimum 1', () => {
    expect(expShare(320, 2)).toBe(160);
    expect(expShare(1, 4)).toBe(1);
  });
});

describe('canon EXP curve §A9: EXP(L) = 4L^3/3', () => {
  it('matches the table', () => {
    expect(expForLevel(1)).toBe(2);
    expect(expForLevel(2)).toBe(11);
    expect(expForLevel(10)).toBe(1334);
    expect(expForLevel(50)).toBe(166667);
  });
});

describe('PRAY — §A3 canon variance table', () => {
  it('base weights are exactly canon and sum to 100', () => {
    expect(PRAY_BASE).toEqual({
      miraculous: 10,
      wonderful: 20,
      good: 30,
      nothing: 25,
      strange: 10,
      backfire: 5,
    });
    const w = prayWeights(1, 0);
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('distribution over 100k rolls matches weights ±0.5% (Prompt 9)', () => {
    const rng = mulberry32(12345);
    const counts: Record<PrayTier, number> = {
      miraculous: 0,
      wonderful: 0,
      good: 0,
      nothing: 0,
      strange: 0,
      backfire: 0,
    };
    const N = 100_000;
    for (let i = 0; i < N; i++) counts[rollPray(1, 0, rng)]++;
    (Object.keys(PRAY_BASE) as PrayTier[]).forEach((k) => {
      const expected = PRAY_BASE[k] / 100;
      expect(Math.abs(counts[k] / N - expected)).toBeLessThan(0.005);
    });
  });

  it('weights shift toward better tiers with level, and Guts trades Nothing for Miraculous', () => {
    const w15 = prayWeights(15, 0);
    expect(w15.miraculous).toBeGreaterThan(PRAY_BASE.miraculous);
    expect(w15.nothing).toBeLessThan(PRAY_BASE.nothing);
    const wg = prayWeights(1, 30);
    expect(wg.miraculous).toBe(13);
    expect(wg.nothing).toBe(22);
    const sum = Object.values(wg).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});
