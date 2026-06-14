/**
 * S19 Movement 40 (ADR-081) — THE ARMY ON OUR TAIL: the arc fires IN ORDER, the
 * clearing is non-missable, and the General is an earned finale caller.
 */
import { describe, it, expect } from 'vitest';
import { nextBeat, isResolved, earnedCallers, armyArcProblems } from './armyarc';
import { ARMY_BEATS, armyChain } from '../data/armyarc';

/** a flag-set backed by a plain Set, for driving the chain in tests */
function flagset(initial: string[] = []): { isSet: (f: string) => boolean; set: (f: string) => void } {
  const s = new Set(initial);
  return { isSet: (f) => s.has(f), set: (f) => void s.add(f) };
}

describe('the army arc is well-formed (mirrors the army-arc gate)', () => {
  it('has no chain problems', () => {
    expect(armyArcProblems()).toEqual([]);
  });
  it('opens on the misread and ends on the clearing', () => {
    const chain = armyChain();
    expect(chain[0].kind).toBe('misread');
    expect(chain[chain.length - 1].kind).toBe('clearing');
  });
  it('carries all five set-piece beats', () => {
    const kinds = armyChain().map((b) => b.kind);
    expect(kinds).toEqual(['misread', 'checkpoint', 'tank', 'flyover', 'clearing']);
  });
});

describe('the arc fires in order, non-missably', () => {
  it('nextBeat walks the chain one beat at a time', () => {
    const f = flagset();
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) {
      const b = nextBeat(f.isSet);
      if (!b) break;
      seen.push(b.id);
      f.set(b.flag);
    }
    expect(seen).toEqual(['army_misread', 'army_checkpoint', 'army_tank', 'army_flyover', 'army_clearing']);
  });
  it('a later beat cannot fire before its predecessor', () => {
    const f = flagset(['army_misread']); // only the opener has fired
    expect(nextBeat(f.isSet)?.id).toBe('army_checkpoint'); // not the tank/flyover
  });
  it('the clearing is reachable from any partial progress (non-missable)', () => {
    const f = flagset(['army_misread', 'army_checkpoint', 'army_tank', 'army_flyover']);
    expect(nextBeat(f.isSet)?.kind).toBe('clearing');
  });
});

describe('the clearing earns the General as a finale caller', () => {
  it('no caller until the clearing fires', () => {
    const f = flagset(['army_misread', 'army_checkpoint', 'army_tank', 'army_flyover']);
    expect(earnedCallers(f.isSet)).toEqual([]);
    expect(isResolved(f.isSet)).toBe(false);
  });
  it('the General joins the callers once the misunderstanding clears', () => {
    const all = armyChain().map((b) => b.flag);
    const f = flagset(all);
    expect(isResolved(f.isSet)).toBe(true);
    expect(earnedCallers(f.isSet)).toEqual(['general_buckle']);
    expect(ARMY_BEATS.army_clearing.caller).toBe('general_buckle');
  });
});
