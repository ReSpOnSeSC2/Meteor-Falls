/**
 * Battle math (EB-style, GAME_BIBLE Prompt 14): offense×2 − defense for
 * physical, power coefficient × Vibe for abilities, Guts drives SMAAASH and
 * mortal-blow survival. Every function takes its RNG so tests are exact.
 */

export type Rng = () => number;

export function physicalDamage(offense: number, defense: number, rng: Rng): number {
  const base = Math.max(1, offense * 2 - defense);
  return Math.max(1, Math.round(base * (0.85 + rng() * 0.3)));
}

/** SMAAASH!! chance — Guts-driven, capped like EB */
export function smashChance(guts: number): number {
  return Math.min(0.2, 0.02 + guts / 100);
}

export function smashDamage(offense: number, defense: number, rng: Rng): number {
  const base = Math.max(2, offense * 3 - Math.floor(defense / 2));
  return Math.round(base * (0.9 + rng() * 0.2));
}

export function vibeDamage(power: number, vibe: number, rng: Rng): number {
  return Math.max(1, Math.round(power * (1 + vibe / 60) * (0.9 + rng() * 0.2)));
}

export function vibeHeal(power: number, vibe: number, rng: Rng): number {
  return Math.max(1, Math.round(power * (1 + vibe / 80) * (0.95 + rng() * 0.1)));
}

/** elemental weakness ×1.5 */
export function applyWeakness(dmg: number, weak: boolean): number {
  return weak ? Math.round(dmg * 1.5) : dmg;
}

/** Guts: chance to survive a mortal blow at 1 HP (§A3) */
export function gutsSurvive(guts: number, rng: Rng): boolean {
  return rng() < Math.min(0.5, guts / 120);
}

export function runChance(heroSpeed: number, maxEnemySpeed: number): number {
  return Math.min(0.92, Math.max(0.15, 0.5 + (heroSpeed - maxEnemySpeed) * 0.025));
}

/**
 * §A4.2 instant auto-win: the party vastly outlevels the enemy.
 */
export function instantWin(avgPartyLevel: number, enemyLevel: number, isBoss: boolean): boolean {
  return !isBoss && avgPartyLevel >= enemyLevel + 6;
}

/** EXP split among conscious heroes, rounded up (everyone gets something) */
export function expShare(total: number, aliveCount: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, aliveCount)));
}
