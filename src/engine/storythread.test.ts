/**
 * S18 Movement 31 (ADR-072) — THE STORY THREADS (§A4.10).
 *
 * Proves the Trust Thread + Clicker Question fire IN ORDER, the climax is earned
 * and non-missable, resolution reads, and finale callers accrue.
 */
import { describe, it, expect } from 'vitest';
import { THREAD_BEATS, threadChain } from '../data/storythreads';
import { nextBeat, isResolved, climaxReady, earnedCallers, chainProblems } from './storythread';

/** a flag set you can grow beat by beat */
function flagset(): { set: (f: string) => void; has: (f: string) => boolean } {
  const s = new Set<string>();
  return { set: (f) => s.add(f), has: (f) => s.has(f) };
}

describe('story threads — well-formed chains', () => {
  it('the trust + clicker chains have no structural problems', () => {
    expect(chainProblems('trust')).toEqual([]);
    expect(chainProblems('clicker')).toEqual([]);
  });
});

describe('story threads — fire in order, non-missable', () => {
  it('the trust thread fires opener → escalations → climax → resolve, in order', () => {
    const fl = flagset();
    const fired: string[] = [];
    for (let i = 0; i < 20; i++) {
      const b = nextBeat('trust', fl.has);
      if (!b) break;
      fired.push(b.id);
      fl.set(b.flag);
    }
    expect(fired).toEqual(threadChain('trust').map((b) => b.id));
    expect(isResolved('trust', fl.has)).toBe(true);
  });

  it('the climax is not ready until every earlier beat has fired', () => {
    const fl = flagset();
    expect(climaxReady('trust', fl.has)).toBe(false);
    // fire everything up to (not including) the climax
    for (const b of threadChain('trust')) {
      if (b.kind === 'climax') break;
      fl.set(b.flag);
    }
    expect(climaxReady('trust', fl.has)).toBe(true);
  });

  it('the next clicker beat respects its prevFlag gate', () => {
    const fl = flagset();
    expect(nextBeat('clicker', fl.has)?.id).toBe('clicker_seed');
    fl.set('thread_clicker_seed');
    expect(nextBeat('clicker', fl.has)?.id).toBe('clicker_crisis');
    fl.set('thread_clicker_crisis');
    expect(nextBeat('clicker', fl.has)?.id).toBe('clicker_clearing');
  });
});

describe('story threads — finale callers', () => {
  it('the clearing earns a caller for the finale PRAY', () => {
    const fl = flagset();
    for (const b of threadChain('clicker')) fl.set(b.flag);
    expect(earnedCallers('clicker', fl.has)).toContain('lotus_bargeman');
  });
  it('an un-fired thread has earned no callers', () => {
    const fl = flagset();
    expect(earnedCallers('trust', fl.has)).toEqual([]);
  });
});

describe('story threads — the trust beat ties to the PUPPET awakening', () => {
  it('the opener is the Ch.3 first-borrow beat', () => {
    expect(THREAD_BEATS.trust_open.band).toBe('ch3');
    expect(THREAD_BEATS.trust_open.kind).toBe('open');
  });
});
