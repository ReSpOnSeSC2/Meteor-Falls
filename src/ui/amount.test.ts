import { describe, it, expect } from 'vitest';
import { amountColumns } from './amountscale';

describe('amountColumns (ADR-105) — the ATM odometer place columns', () => {
  it('gives one place-value column per digit, most-significant first', () => {
    expect(amountColumns(4_820)).toEqual([1_000, 100, 10, 1]);
    expect(amountColumns(100)).toEqual([100, 10, 1]);
    expect(amountColumns(7)).toEqual([1]);
    expect(amountColumns(50)).toEqual([10, 1]);
  });

  it('scales the column count to the §A9 billions', () => {
    expect(amountColumns(1_000_000_000)).toEqual([
      1_000_000_000, 100_000_000, 10_000_000, 1_000_000, 100_000, 10_000, 1_000, 100, 10, 1,
    ]);
    expect(amountColumns(4_820_000_000).length).toBe(10);
  });

  it('is defensive about zero/negative/fractional pools (at least the ones column)', () => {
    expect(amountColumns(0)).toEqual([1]);
    expect(amountColumns(-50)).toEqual([1]);
    expect(amountColumns(9)).toEqual([1]);
    expect(amountColumns(10)).toEqual([10, 1]);
    expect(amountColumns(4_820.9)).toEqual([1_000, 100, 10, 1]); // floored
  });

  it('always returns descending powers of ten ending in 1, count = digit count', () => {
    for (const pool of [0, 1, 5, 42, 100, 777, 4_820, 50_000, 1_234_567, 9_999_999_999]) {
      const cols = amountColumns(pool);
      expect(cols[cols.length - 1]).toBe(1); // a ones column always exists
      expect(cols).toEqual([...cols].sort((a, b) => b - a)); // strictly descending
      for (const c of cols) expect(Math.log10(c) % 1).toBe(0); // each a power of ten
      const expectedLen = pool < 1 ? 1 : String(Math.floor(pool)).length;
      expect(cols.length).toBe(expectedLen);
    }
  });

  it('the coarsest column never exceeds the pool, so one step never overshoots from zero', () => {
    for (const pool of [1, 5, 42, 100, 777, 4_820, 50_000, 1_234_567, 9_999_999_999]) {
      expect(amountColumns(pool)[0]).toBeLessThanOrEqual(pool);
    }
  });
});
