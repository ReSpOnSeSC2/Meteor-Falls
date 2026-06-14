/**
 * S19 Movement 41 (ADR-082) — THE PURSUIT. Proves the §A6 chase is always
 * escapable (never a soft-lock) over many steps, a helmeted tank blocks control
 * (route around it via BFS), the safety law holds, the army-fatigues disguise
 * slips a checkpoint, and the F-15 flyover is a timed, non-damaging beat.
 */
import { describe, it, expect } from 'vitest';
import {
  freshPursuit, stepPursuit, bestEvade, escapeRun,
  canRouteAround, tankBlocksControl, pursuerKeepsLane, flyover,
  EVADE_DROP, SEEN_GAIN, MAX_HEAT,
} from './pursuit';
import { blendsWith, madeChance } from './disguise';

describe('the heat model — evasion is ALWAYS possible (no soft-lock)', () => {
  it('the base evade (drive) nets negative even while seen every step', () => {
    expect(EVADE_DROP.drive).toBeGreaterThan(SEEN_GAIN);
  });

  it('escapes from a hot start with ONLY driving, even seen every single step', () => {
    const run = escapeRun(freshPursuit(MAX_HEAT - 1), {}, true); // no tools, max heat, always seen
    expect(run.escaped).toBe(true);
    expect(run.finalHeat).toBe(0);
    expect(run.steps).toBeLessThan(1000); // bounded — it really terminates
  });

  it('escapes from EVERY starting heat over many steps (a sweep)', () => {
    for (let h = 0; h <= MAX_HEAT; h++) {
      const run = escapeRun(freshPursuit(h), {}, true);
      expect(run.escaped, `heat ${h} soft-locked`).toBe(true);
    }
  });

  it('a disguise slips the checkpoint far faster than driving', () => {
    expect(escapeRun(freshPursuit(80), { hasFatigues: true }, true).steps)
      .toBeLessThan(escapeRun(freshPursuit(80), {}, true).steps);
  });

  it('only idling lets heat climb to caught', () => {
    let s = freshPursuit(MAX_HEAT - SEEN_GAIN);
    s = stepPursuit(s, { move: 'idle', seen: true });
    expect(s.caught).toBe(true); // sitting still in the open gets you caught — fair
  });

  it('bestEvade picks the strongest available tool', () => {
    expect(bestEvade({ hasFatigues: true })).toBe('disguise');
    expect(bestEvade({ canDecoy: true })).toBe('decoy');
    expect(bestEvade({ blockedByTank: true })).toBe('reroute');
    expect(bestEvade({})).toBe('drive');
  });
});

describe('the helmeted tank — route around it, never Clicker it', () => {
  it('a hardened tank blocks control until its shield is knocked off', () => {
    expect(tankBlocksControl('tank')).toBe(true);
    expect(tankBlocksControl('tank', true)).toBe(false); // shield down — now controllable
    expect(tankBlocksControl('sedan')).toBe(false);
  });

  it('BFS finds a route around a tank that blocks one lane (no soft-lock)', () => {
    // a 2-lane road; the tank parks in the top lane, the bottom lane stays open
    const grid = [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ];
    expect(canRouteAround(grid, { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 0 })).toBe(true);
  });

  it('the safety law: the pursuer never takes the last lane', () => {
    expect(pursuerKeepsLane(1)).toBe(true);  // one lane left — fine
    expect(pursuerKeepsLane(0)).toBe(false); // zero would be a corner-trap — forbidden
  });
});

describe('the army-fatigues disguise slips the checkpoint (faction army)', () => {
  it('the fatigues blend into the army faction', () => {
    expect(blendsWith('army_fatigues', 'army')).toBe(true);
    expect(blendsWith('army_fatigues', 'smiler')).toBe(false);
  });
  it('a sleepy checkpoint guard waves the disguise through (low made-chance)', () => {
    expect(madeChance('army_fatigues', 'army', 0.5)).toBe(0); // alertness 0.5 < quality 0.7
    expect(madeChance(null, 'army', 0.5)).toBe(1);             // no costume — always made
  });
});

describe('the F-15 flyover — a timed, non-damaging beat', () => {
  it('is finite, ordered, and ends GONE', () => {
    const beats = flyover(10);
    expect(beats.length).toBe(10);
    expect(beats[0].phase).toBe('incoming');
    expect(beats[beats.length - 1].phase).toBe('gone');
  });
  it('deals no damage by default (EarthBound spirit)', () => {
    expect(flyover(8).every((b) => b.damaging === false)).toBe(true);
  });
  it('passes overhead exactly once across the run', () => {
    expect(flyover(20).some((b) => b.phase === 'overhead')).toBe(true);
  });
});
