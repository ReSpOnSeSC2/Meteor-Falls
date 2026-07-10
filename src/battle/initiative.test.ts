import { describe, expect, it } from 'vitest';
import { initiativePlan, type BattleAdvantage, type InitiativeActor } from './initiative';

const actors: InitiativeActor<string>[] = [
  { side: 'player', speed: 16, value: 'Jay' },
  { side: 'player', speed: 18, value: 'Mia' },
  { side: 'enemy', speed: 19, value: 'Postage Stampede' },
  { side: 'enemy', speed: 8, value: 'Gilded Beetle' },
];

const values = (advantage: BattleAdvantage): { preemptive: string[]; normal: string[] } => {
  const plan = initiativePlan(actors, advantage);
  return {
    preemptive: plan.preemptive.map((actor) => actor.value),
    normal: plan.normal.map((actor) => actor.value),
  };
};

describe('live-Speed initiative planning', () => {
  it('interleaves both sides fastest-first in every normal round', () => {
    expect(values('none')).toEqual({
      preemptive: [],
      normal: ['Postage Stampede', 'Mia', 'Jay', 'Gilded Beetle'],
    });
  });

  it('gives player advantage one party-only phase, then the same normal round', () => {
    expect(values('player')).toEqual({
      preemptive: ['Mia', 'Jay'],
      normal: ['Postage Stampede', 'Mia', 'Jay', 'Gilded Beetle'],
    });
  });

  it('gives enemy advantage one enemy-only phase, then the same normal round', () => {
    expect(values('enemy')).toEqual({
      preemptive: ['Postage Stampede', 'Gilded Beetle'],
      normal: ['Postage Stampede', 'Mia', 'Jay', 'Gilded Beetle'],
    });
  });

  it('keeps authored order for exact Speed ties', () => {
    const tied: InitiativeActor<string>[] = [
      { side: 'player', speed: 10, value: 'first' },
      { side: 'enemy', speed: 10, value: 'second' },
      { side: 'player', speed: 10, value: 'third' },
    ];
    expect(initiativePlan(tied, 'none').normal.map((actor) => actor.value)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });
});
