import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { eligibleEnemyMoves } from './enemyAi';

const kinds = (enemyId: string, latched: boolean, hushed = false): string[] =>
  eligibleEnemyMoves(ENEMIES[enemyId].moves, latched, hushed).map((move) => move.kind);

describe('enemy move eligibility', () => {
  it('makes Titanic Tick latch before it can use its fixed drain', () => {
    expect(kinds('titanic_tick', false)).toContain('latch');
    expect(kinds('titanic_tick', false)).not.toContain('drain');
  });

  it('switches Titanic Tick from latch to drain once attached', () => {
    expect(kinds('titanic_tick', true)).not.toContain('latch');
    expect(kinds('titanic_tick', true)).toContain('drain');
  });

  it('keeps standalone drains legal without a latch', () => {
    expect(kinds('cackling_mask', false)).toContain('drain');
  });

  it('limits Hushed enemies to their plain vocabulary when available', () => {
    expect(kinds('titanic_tick', false, true)).toEqual(['attack', 'taunt']);
  });
});
