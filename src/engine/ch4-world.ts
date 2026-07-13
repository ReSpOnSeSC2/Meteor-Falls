export type BridgeBerryChoice = 'fight' | 'roll' | 'leave';

/** Pure retry-safe resolution used by the world scene and contract tests. */
export function bridgeBerryClears(choice: BridgeBerryChoice, battleWon = false): boolean {
  return choice === 'roll' || (choice === 'fight' && battleWon);
}
