/**
 * S21 (ADR-127) — PARTY FATE. A choice can bench a companion and bring them back;
 * a benched hero is gone from the active party but their `<id>_left` flag (read by
 * the ending cards) is set, and rejoin rebuilds them.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GS } from './state';
import { departHero, rejoinHero, isPresent, withholdUltimate, isWithholding } from './party';

beforeEach(() => GS.reset());

describe('party fate — depart + rejoin', () => {
  it('benches a hero and records the leaving flag', () => {
    rejoinHero('faye', 6); // seed a 2-hero party
    expect(isPresent('faye')).toBe(true);
    expect(departHero('faye')).toBe(true);
    expect(isPresent('faye')).toBe(false);
    expect(GS.flag('faye_left')).toBe(true);
  });

  it('rejoin brings a benched hero back and clears the leaving flag', () => {
    rejoinHero('pippa', 26);
    departHero('pippa');
    expect(GS.flag('pippa_left')).toBe(true);
    rejoinHero('pippa', 30);
    expect(isPresent('pippa')).toBe(true);
    expect(GS.flag('pippa_left')).toBe(false);
  });

  it('departing an absent hero is a no-op', () => {
    expect(departHero('dorin')).toBe(false);
  });

  it('withhold flags an ultimate lock the finale reads', () => {
    withholdUltimate('dorin');
    expect(isWithholding('dorin')).toBe(true);
    withholdUltimate('dorin', false);
    expect(isWithholding('dorin')).toBe(false);
  });
});
