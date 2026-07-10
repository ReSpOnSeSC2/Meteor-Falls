/**
 * Pure battle-turn planning. Callers provide LIVE Speed values each round;
 * ties retain authored party/enemy order so replays stay deterministic.
 */
export type BattleAdvantage = 'player' | 'enemy' | 'none';
export type InitiativeSide = 'player' | 'enemy';

export interface InitiativeActor<T> {
  side: InitiativeSide;
  speed: number;
  value: T;
}

export interface InitiativePlan<T> {
  /** The advantaged side's free opening phase. Empty for a neutral encounter. */
  preemptive: InitiativeActor<T>[];
  /** The ordinary round: both sides interleaved from fastest to slowest. */
  normal: InitiativeActor<T>[];
}

export function initiativePlan<T>(
  actors: readonly InitiativeActor<T>[],
  advantage: BattleAdvantage,
): InitiativePlan<T> {
  const normal = actors
    .map((actor, order) => ({ actor, order }))
    .sort((a, b) => b.actor.speed - a.actor.speed || a.order - b.order)
    .map(({ actor }) => actor);
  const favored: InitiativeSide | null = advantage === 'none' ? null : advantage;
  return {
    preemptive: favored ? normal.filter((actor) => actor.side === favored) : [],
    normal,
  };
}
