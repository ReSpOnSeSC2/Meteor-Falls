/**
 * S21 (ADR-128) — THE COMPOSED ENDING. Proves every axis combination composes
 * one card per slot (never empty), the default path is a complete fallback-only
 * sequence, the 8 combos + the golden Long Shot give ≥9 distinct experiences,
 * and the golden gate + party-fate overrides behave.
 */
import { describe, it, expect } from 'vitest';
import { composeEnding, isLongShot, forgiveViable, type EndingContext } from './ending';
import { SLOT_ORDER, ENDING_CARDS } from '../data/endings';
import { GOLDEN_CALLER_THRESHOLD, FORGIVE_CALLER_FLOOR } from '../data/echoes';

const TRUST = ['axis_trust_free', 'axis_trust_strings'] as const;
const COMP = ['axis_compassion_openhand', 'axis_compassion_iron'] as const;
const FIN = ['axis_finale_silence', 'axis_finale_forgive'] as const;

function ctx(flags: string[], opts: Partial<EndingContext> = {}): EndingContext {
  const set = new Set(flags);
  // default rewindCount high + callers 0 so non-golden combos never trip the golden gate
  return { flag: (f) => set.has(f), callers: 0, chapter: 10, netWorth: 0, rewindCount: 9, ...opts };
}

describe('composed ending — every slot fills, never empty', () => {
  it('every epilogue card is dialogue-backed', () => {
    for (const c of Object.values(ENDING_CARDS)) expect(c.dialogue.length).toBeGreaterThan(0);
  });

  it('the default (no choices) composes a full fallback-only sequence', () => {
    const cards = composeEnding(ctx([]));
    expect(cards).toHaveLength(SLOT_ORDER.length);
    expect(cards.every((c) => c.fallback)).toBe(true);
  });

  it('every axis combination composes one card per slot', () => {
    for (const t of TRUST)
      for (const c of COMP)
        for (const f of FIN) {
          const cards = composeEnding(ctx([t, c, f]));
          expect(cards).toHaveLength(SLOT_ORDER.length);
          expect(new Set(cards.map((x) => x.slot)).size).toBe(SLOT_ORDER.length);
        }
  });
});

describe('composed ending — ≥9 distinct experiences', () => {
  it('the 8 axis combos + the golden Long Shot give ≥9 distinct sequences', () => {
    const sigs = new Set<string>();
    for (const t of TRUST)
      for (const c of COMP)
        for (const f of FIN)
          sigs.add(composeEnding(ctx([t, c, f])).map((x) => x.id).join(','));
    expect(sigs.size).toBeGreaterThanOrEqual(8);

    const virtuous = ['axis_trust_free', 'axis_compassion_openhand', 'axis_finale_forgive'];
    const golden = composeEnding(ctx(virtuous, { callers: GOLDEN_CALLER_THRESHOLD, rewindCount: 0 }));
    sigs.add(golden.map((x) => x.id).join(','));
    expect(sigs.size).toBeGreaterThanOrEqual(9);
    expect(golden.find((c) => c.slot === 'home')?.id).toBe('home_long_shot');
  });
});

describe('composed ending — the golden gate + party fates', () => {
  it('the golden gate needs the virtuous path AND high callers AND few rewinds', () => {
    const virtuous = ['axis_trust_free', 'axis_compassion_openhand', 'axis_finale_forgive'];
    expect(isLongShot(ctx(virtuous, { callers: GOLDEN_CALLER_THRESHOLD, rewindCount: 0 }))).toBe(true);
    expect(isLongShot(ctx(virtuous, { callers: GOLDEN_CALLER_THRESHOLD, rewindCount: 5 }))).toBe(false);
    expect(isLongShot(ctx(virtuous, { callers: 0, rewindCount: 0 }))).toBe(false);
    expect(
      isLongShot(ctx(['axis_trust_strings', 'axis_compassion_openhand', 'axis_finale_forgive'], { callers: 99, rewindCount: 0 })),
    ).toBe(false);
  });

  it('party-fate cards override their slot fallback', () => {
    const left = composeEnding(ctx(['axis_trust_strings', 'pippa_left', 'dorin_left']));
    expect(left.find((c) => c.slot === 'pippa')?.id).toBe('pippa_left');
    expect(left.find((c) => c.slot === 'dorin')?.id).toBe('dorin_left');
  });
});

describe('the FORGIVE gate — the Hush "Answer" is viable only when warm (ADR-130 §7)', () => {
  it('OPEN_HAND alone makes FORGIVE viable, even with zero callers', () => {
    expect(forgiveViable(ctx(['axis_compassion_openhand'], { callers: 0 }))).toBe(true);
  });

  it('a full-enough caller ledger makes FORGIVE viable even on the IRON path', () => {
    expect(forgiveViable(ctx(['axis_compassion_iron'], { callers: FORGIVE_CALLER_FLOOR }))).toBe(true);
  });

  it('too Iron with too few callers FAILS into a forced Silence', () => {
    expect(forgiveViable(ctx(['axis_compassion_iron'], { callers: FORGIVE_CALLER_FLOOR - 1 }))).toBe(false);
    expect(forgiveViable(ctx([], { callers: 0 }))).toBe(false);
  });

  it('the FORGIVE floor sits below the golden bar (mercy or community each qualify)', () => {
    expect(FORGIVE_CALLER_FLOOR).toBeLessThan(GOLDEN_CALLER_THRESHOLD);
  });
});
