/**
 * S21 (ADR-127) — THE THREE AXES. Proves a choice records exactly one option
 * flag, re-deciding clears the sibling, the OPEN_HAND caller banks once, and the
 * rewind's downstream-clear drops at/after a chapter while keeping earlier picks.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GS } from './state';
import {
  recordChoice,
  recordedOption,
  isDecided,
  clearDownstreamChoiceFlags,
  choiceProblems,
} from './choice';

beforeEach(() => GS.reset());

describe('choices — structural soundness', () => {
  it('the choice registry has no structural problems', () => {
    expect(choiceProblems()).toEqual([]);
  });
});

describe('choices — record sets exactly one option flag', () => {
  it('records a pick, exposed via recordedOption + isDecided', () => {
    expect(isDecided('ch6_string')).toBe(false);
    recordChoice('ch6_string', 'pull');
    expect(isDecided('ch6_string')).toBe(true);
    expect(recordedOption('ch6_string')?.id).toBe('pull');
    expect(GS.flag('axis_trust_strings')).toBe(true);
    expect(GS.flag('axis_trust_free')).toBe(false);
  });

  it('re-deciding clears the prior sibling flag', () => {
    recordChoice('ch6_string', 'pull');
    recordChoice('ch6_string', 'open');
    expect(GS.flag('axis_trust_strings')).toBe(false);
    expect(GS.flag('axis_trust_free')).toBe(true);
    expect(recordedOption('ch6_string')?.id).toBe('open');
  });

  it('IRON banks its alsoSets flag; OPEN_HAND banks a finale caller', () => {
    recordChoice('ch9_count', 'iron');
    expect(GS.flag('stolen_light_banked')).toBe(true);
    expect(GS.data.callers.some((c) => c.quest === 'choice:ch9_count')).toBe(false);

    GS.reset();
    recordChoice('ch9_count', 'mercy');
    expect(GS.flag('stolen_light_banked')).toBe(false);
    const caller = GS.data.callers.find((c) => c.quest === 'choice:ch9_count');
    expect(caller?.name).toBe('Vlad, the Actor');
    expect(caller?.effect.kind).toBe('damage');
  });

  it('the caller is banked only once even if recorded twice', () => {
    recordChoice('ch9_count', 'mercy');
    recordChoice('ch9_count', 'mercy');
    expect(GS.data.callers.filter((c) => c.quest === 'choice:ch9_count')).toHaveLength(1);
  });
});

describe('choices — clearDownstreamChoiceFlags', () => {
  it('clears choices at/after a chapter (+ their callers), keeping earlier picks', () => {
    recordChoice('ch6_string', 'open'); // ch6
    recordChoice('ch9_count', 'mercy'); // ch9 + caller
    clearDownstreamChoiceFlags(9);

    // ch6 (earlier) survives
    expect(GS.flag('axis_trust_free')).toBe(true);
    expect(isDecided('ch6_string')).toBe(true);
    // ch9 (at/after) cleared + caller dropped
    expect(isDecided('ch9_count')).toBe(false);
    expect(GS.flag('axis_compassion_openhand')).toBe(false);
    expect(GS.data.callers.some((c) => c.quest === 'choice:ch9_count')).toBe(false);
  });
});
