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

/** a hero's defense: base stat + their 'body'-slot armor (S10 — the Champion
 *  Jacket is §A8's first). Enemy physical damage and STATUS both read this
 *  the way Offense reads heroOffense. */
export function heroDefense(hero: HeroState): number {
  const armor = hero.equip.body ? ITEMS[hero.equip.body] : undefined;
  return hero.stats.defense + (armor?.defense ?? 0);
}

/** the S10 armor preview — equipDelta's shape, aimed at the 'body' slot */
export function equipDefenseDelta(hero: HeroState, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'body') return 0;
  const current = hero.equip.body ? (ITEMS[hero.equip.body]?.defense ?? 0) : 0;
  return (item.defense ?? 0) - current;
}

/** a hero's luck: base stat + their 'other'-slot charm (S9 — Lucky Collar).
 *  STATUS reads this the way Offense reads heroOffense. */
export function heroLuck(hero: HeroState): number {
  const charm = hero.equip.other ? ITEMS[hero.equip.other] : undefined;
  return hero.stats.luck + (charm?.luck ?? 0);
}

/** the S9 charm preview — equipDelta's shape, aimed at the 'other' slot */
export function equipLuckDelta(hero: HeroState, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'other') return 0;
  const current = hero.equip.other ? (ITEMS[hero.equip.other]?.luck ?? 0) : 0;
  return (item.luck ?? 0) - current;
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

/* ---- the SMAAAASH combo (S11b — Mother-3 spam-A multi-hits) ---- */

/** the combo window: edge-triggered A presses land follow-up hits for this
 *  long after the smash connects (skip-scaled like everything else) */
export const COMBO_WINDOW_MS = 1100;

/** max TOTAL hits in one combo (the opening smash counts as hit 1):
 *  3 + Guts/40, capped at 8 (§A3 — Guts drives the crit game) */
export function comboCap(guts: number): number {
  return Math.min(8, 3 + Math.floor(guts / 40));
}

/** each follow-up press lands 25% of the smash — deterministic, no dice
 *  inside the window (ADR-029: presses in, hits out) */
export function comboHitDamage(smashDmg: number): number {
  return Math.max(1, Math.floor(smashDmg * 0.25));
}

/** total damage of a combo: the smash + (hits − 1) follow-ups */
export function comboTotal(smashDmg: number, hits: number): number {
  return smashDmg + comboHitDamage(smashDmg) * Math.max(0, hits - 1);
}

/* ---- wear tiers (S11b): battle sprites read the drums ---- */

/** 0 full · 1 scuffed (<66%) · 2 battered (<33%) — heroes key this on the
 *  DISPLAYED odometer value, never the target: a mortal roll degrades AS
 *  the drum falls. Enemies key it on their plain hp. */
export function wearTier(hp: number, max: number): 0 | 1 | 2 {
  if (max <= 0) return 2;
  const r = hp / max;
  if (r < 1 / 3) return 2;
  if (r < 2 / 3) return 1;
  return 0;
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

/* ---- §A4.8 status rolls (S11) — injected rng, tested exactly ---- */

export const CRYING_MISS_CHANCE = 0.5;
export const PARALYZED_SKIP_CHANCE = 0.5;
export const ASLEEP_WAKE_CHANCE = 0.34;

/** Crying: can't aim — gnats, onion ghosts, and Flash α agree */
export function cryingMisses(rng: Rng): boolean {
  return rng() < CRYING_MISS_CHANCE;
}

export function paralyzedSkips(rng: Rng): boolean {
  return rng() < PARALYZED_SKIP_CHANCE;
}

/** rolled when a sleeper's turn comes up (a hit always wakes them) */
export function asleepWakes(rng: Rng): boolean {
  return rng() < ASLEEP_WAKE_CHANCE;
}

/** Magnet α: the PP trickle — enemy PP pools arrive with the Phase-2 data;
 *  until then the siphon draws a small fixed sip out of the air */
export function magnetSiphon(rng: Rng): number {
  return 2 + Math.floor(rng() * 5);
}

/* ---- Homesick (§A4.4/§A4.8, S4): Jay-only, cured by Mom's call ---- */

export const HOMESICK_CHANCE = 0.08;
export const HOMESICK_SKIP_CHANCE = 0.5;

/** rolled once per battle victory — the quiet hits him after the noise */
export function contractHomesick(rng: Rng): boolean {
  return rng() < HOMESICK_CHANCE;
}

/** rolled whenever a Homesick Jay is about to act */
export function homesickSkips(rng: Rng): boolean {
  return rng() < HOMESICK_SKIP_CHANCE;
}
