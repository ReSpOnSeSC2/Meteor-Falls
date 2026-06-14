import { describe, expect, it } from 'vitest';
import { money } from './text';

describe('money() formatter', () => {
  it('comma-groups exact amounts', () => {
    expect(money(0)).toBe('$0');
    expect(money(7)).toBe('$7');
    expect(money(279)).toBe('$279');
    expect(money(1234)).toBe('$1,234');
    expect(money(1234567)).toBe('$1,234,567');
    expect(money(1_000_000_000)).toBe('$1,000,000,000');
  });
  it('floors fractional input (display-only)', () => {
    expect(money(12.9)).toBe('$12');
  });
  it('handles negatives', () => {
    expect(money(-50)).toBe('-$50');
  });
  it('abbreviates large amounts for a tight HUD when asked', () => {
    expect(money(999_999, { abbrev: true })).toBe('$999,999'); // under 1M → still commas
    expect(money(1_200_000, { abbrev: true })).toBe('$1.2M');
    expect(money(3_400_000_000, { abbrev: true })).toBe('$3.4B');
    expect(money(120_000_000, { abbrev: true })).toBe('$120M'); // ≥100 of unit drops the decimal
    expect(money(1_000_000_000_000, { abbrev: true })).toBe('$1T');
  });
  it('keeps abbrev opt-in — the default stays exact', () => {
    expect(money(1_200_000)).toBe('$1,200,000');
  });
});
