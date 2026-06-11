/**
 * Battle math (EB-style, GAME_BIBLE Prompt 14): offense×2 − defense for
 * physical, power coefficient × Vibe for abilities, Guts drives SMAAASH and
 * mortal-blow survival. Every function takes its RNG so tests are exact.
 */
import { ITEMS, slotOf } from '../data/items';
import type { HeroState } from '../engine/state';

export type Rng = () => number;

/** a hero's swing: base offense + THEIR equipped weapon (S3 — was the
 *  first weapon in the shared bag, applied to everyone) */
export function heroOffense(hero: HeroState): number {
  const weapon = hero.equip.weapon ? ITEMS[hero.equip.weapon] : undefined;
  return hero.stats.offense + (weapon?.offense ?? 0);
}

/** Prompt 19's preview: how much Offense changes if hero equips itemId */
export function equipDelta(hero: HeroState, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'weapon') return 0;
  const current = hero.equip.weapon ? (ITEMS[hero.equip.weapon]?.offense ?? 0) : 0;
  return (item.offense ?? 0) - current;
}

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

/* ---- Homesick (§A4.4/§A4.8, S4): Rex-only, cured by Mom's call ---- */

export const HOMESICK_CHANCE = 0.08;
export const HOMESICK_SKIP_CHANCE = 0.5;

/** rolled once per battle victory — the quiet hits him after the noise */
export function contractHomesick(rng: Rng): boolean {
  return rng() < HOMESICK_CHANCE;
}

/** rolled whenever a Homesick Rex is about to act */
export function homesickSkips(rng: Rng): boolean {
  return rng() < HOMESICK_SKIP_CHANCE;
}
