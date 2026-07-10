import type { EnemyMove } from '../data/enemies';

/**
 * Move eligibility before weighted selection. Latch-based drains wait until a
 * hero is attached; standalone drains remain legal without any latch.
 */
export function eligibleEnemyMoves(
  moves: readonly EnemyMove[],
  latchedAlready: boolean,
  hushed: boolean,
): EnemyMove[] {
  const needsLatch = moves.some((move) => move.kind === 'latch');
  let eligible = moves.filter(
    (move) =>
      !(move.kind === 'latch' && latchedAlready) &&
      !(move.kind === 'drain' && needsLatch && !latchedAlready),
  );
  if (hushed) {
    const plain = eligible.filter((move) => move.kind === 'attack' || move.kind === 'taunt');
    if (plain.length > 0) eligible = plain;
  }
  return eligible;
}
