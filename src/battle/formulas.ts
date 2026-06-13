/**
 * Battle math (EB-style, GAME_BIBLE Prompt 14): offense×2 − defense for
 * physical, power coefficient × Vibe for abilities, Guts drives SMAAASH and
 * mortal-blow survival. Every function takes its RNG so tests are exact.
 */
import { ITEMS, slotOf, EQUIP_SLOTS } from '../data/items';
import { RAMP, px } from '../palette';
import type { HeroState } from '../engine/state';
import type { ItemDef, ItemBonus, ResistElement } from '../schemas';

export type Rng = () => number;

/* ---- S17 (ADR-061): the SECONDARY-bonus + permanent-boost + resist seams ----
 * Equipment keeps ONE primary slot stat (weapon→Offense, body→Defense,
 * arms→Speed|Guts, other→Luck) read by the heroX functions below; on TOP of
 * that, any worn piece may carry a small `bonus` map, a `vibe` rider, or
 * elemental `resists`, and a TONIC may have permanently raised the hero's stat
 * (HeroState.boosts). These helpers sum those extras; with the existing 41
 * items (none carry them, no tonic used) every sum is 0 — identical math. */

/** the items a hero currently has equipped, in slot order */
export function equippedItems(hero: HeroState): ItemDef[] {
  const out: ItemDef[] = [];
  for (const slot of EQUIP_SLOTS) {
    const id = hero.equip[slot];
    const it = id ? ITEMS[id] : undefined;
    if (it) out.push(it);
  }
  return out;
}

/** Σ of one secondary `bonus` stat across worn gear (§A8 secondaries) */
export function equipBonus(hero: HeroState, stat: keyof ItemBonus): number {
  return equippedItems(hero).reduce((a, it) => a + (it.bonus?.[stat] ?? 0), 0);
}

/** Σ of the dedicated `vibe` rider across worn gear (Riddle Ring +Vibe) */
export function equipVibe(hero: HeroState): number {
  return equippedItems(hero).reduce((a, it) => a + (it.vibe ?? 0), 0);
}

/** a permanent tonic boost (§A4.12), 0 if none */
export function boostOf(hero: HeroState, stat: 'offense' | 'defense' | 'speed' | 'guts' | 'vibe' | 'luck' | 'hp' | 'pp'): number {
  return hero.boosts?.[stat] ?? 0;
}

/** a hero's swing: base offense + THEIR equipped weapon (S3) + any secondary
 *  bonus on worn gear + any permanent Iron-Tonic boost (S17) */
export function heroOffense(hero: HeroState): number {
  const weapon = hero.equip.weapon ? ITEMS[hero.equip.weapon] : undefined;
  return hero.stats.offense + (weapon?.offense ?? 0) + equipBonus(hero, 'offense') + boostOf(hero, 'offense');
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
  return hero.stats.defense + (armor?.defense ?? 0) + equipBonus(hero, 'defense') + boostOf(hero, 'defense');
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
  return hero.stats.luck + (charm?.luck ?? 0) + equipBonus(hero, 'luck') + boostOf(hero, 'luck');
}

/** a hero's VIBE: base stat + any Vibe rider on worn gear (§A10 Riddle Ring,
 *  S17) + any Brain-Food-Lunch boost. Vibe ability power reads through this the
 *  heroOffense way — before S17 nothing buffed Vibe, so battles read the raw
 *  stat; now gear and tonics can. */
export function heroVibe(hero: HeroState): number {
  return hero.stats.vibe + equipVibe(hero) + boostOf(hero, 'vibe');
}

/** a hero's speed: base stat + their 'arms'-slot gear (S12 — THE STARTING
 *  FOUR is §A8's first). Run chance, turn order, and THE CAGE's court
 *  ratings all read through this, the heroOffense way. */
export function heroSpeed(hero: HeroState): number {
  const arms = hero.equip.arms ? ITEMS[hero.equip.arms] : undefined;
  return hero.stats.speed + (arms?.speed ?? 0) + equipBonus(hero, 'speed') + boostOf(hero, 'speed');
}

/** a hero's guts: base stat + their 'arms'-slot gear (S12). SMAAASH chance,
 *  mortal-blow survival, the combo cap, and the cage's rim game read here. */
export function heroGuts(hero: HeroState): number {
  const arms = hero.equip.arms ? ITEMS[hero.equip.arms] : undefined;
  return hero.stats.guts + (arms?.guts ?? 0) + equipBonus(hero, 'guts') + boostOf(hero, 'guts');
}

/* ---- S17 (ADR-061): elemental resists (§A8 pendants/robes made mechanical) ----
 * Worn armor + charms may carry `resists` lines; a hero's resist to an element
 * is the summed pct across gear, capped, applied to incoming elemental damage.
 * The display lives on the STATUS screen now; the APPLICATION binds at the
 * hero-damage seam the day enemies carry elemental moves (none do today, so
 * heroResist is 0 for every current fight — no behaviour change). */

/** cap on stacked elemental resistance — even four pendants can't make a hero
 *  immune (EB never let you fully no-sell an element) */
export const RESIST_CAP_PCT = 80;

/** a hero's resistance to one element, 0..RESIST_CAP/100 (a fraction) */
export function heroResist(hero: HeroState, element: ResistElement): number {
  const pct = equippedItems(hero).reduce(
    (a, it) => a + (it.resists?.find((r) => r.element === element)?.pct ?? 0),
    0,
  );
  return Math.min(RESIST_CAP_PCT, pct) / 100;
}

/** reduce elemental damage by a resist fraction (always leaves ≥1) */
export function applyResist(dmg: number, resistFrac: number): number {
  return Math.max(1, Math.round(dmg * (1 - resistFrac)));
}

/** the S12 arms preview — slot-generalized: an arms piece carries exactly
 *  one stat (schema law), and the preview names THAT stat ("Speed up by N!") */
export function equipArmsDelta(hero: HeroState, itemId: string): { stat: 'Speed' | 'Guts'; d: number } {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'arms') return { stat: 'Speed', d: 0 };
  const cur = hero.equip.arms ? ITEMS[hero.equip.arms] : undefined;
  if (item.guts !== undefined) {
    return { stat: 'Guts', d: item.guts - (cur?.guts ?? 0) };
  }
  return { stat: 'Speed', d: (item.speed ?? 0) - (cur?.speed ?? 0) };
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

/* ---- §A4.5 SUNNY SIDE (S14 / Bible Prompt 23) ---- */

/** the picnic buff covers the NEXT five battles (§A4.5, canon) */
export const SUNNY_BATTLES = 5;
export const SUNNY_MUL = 1.1;

/**
 * +10% ALL stats while the picnic counter holds (the seam beside
 * heroOffense — battle stat reads multiply through this). The counter is a
 * plain number flag ('sunny_side'), so the remainder persists on the save
 * with no migration step; BattleScene burns one per battle resolved.
 */
export function sunnyMul(flagOf: (flag: string) => number | boolean): number {
  return (Number(flagOf('sunny_side')) || 0) > 0 ? SUNNY_MUL : 1;
}

/* ---- §A4.7 hospitals (S14 / Bible Prompt 25) ---- */

/** pay-to-revive an angel: scales with the FALLEN hero's level (canon) */
export function reviveCost(level: number): number {
  return 10 + level * 4;
}

/** the cure-all-statuses desk — flat, a little steep, very effective */
export const CURE_ALL_COST = 18;

/** chapels restore 50 HP party-wide, free (§A4.7 / Prompt 25) */
export const CHAPEL_HEAL = 50;

/* ---- Homesick (§A4.4/§A4.8, S4): Jay-only, cured by Mom's call ---- */

// ADR-042: was 0.08 — user playtest: "pops up way too often... it just
// generates way too fast". The mechanic stays; the dice calm down.
export const HOMESICK_CHANCE = 0.02;
export const HOMESICK_SKIP_CHANCE = 0.5;

/** rolled once per battle victory — the quiet hits him after the noise */
export function contractHomesick(rng: Rng): boolean {
  return rng() < HOMESICK_CHANCE;
}

/** rolled whenever a Homesick Jay is about to act */
export function homesickSkips(rng: Rng): boolean {
  return rng() < HOMESICK_SKIP_CHANCE;
}

/* ---------------- §A4.2 contact angle & the swirl traffic-light (S15c) ---------------- */

/** contact angle → first strike. dotF = facing·(unit toEnemy); an enemy
 *  fleeing away from you caught from behind gives up its back. Thresholds
 *  are the S1 originals, extracted here so the read is pinned headless. */
export function contactAdvantage(dotF: number, enemyFleeing: boolean): 'player' | 'enemy' | 'none' {
  if (dotF < -0.35) return 'enemy'; // it got our back
  if (enemyFleeing && dotF > 0.35) return 'player'; // we got its back
  return 'none';
}

/** The swirl reads like a traffic light (user law, S15c — and EB-faithful;
 *  Bible §A4.2 + Prompt 16 amended in the same commit): GREEN = you snuck
 *  up and move first, RED = it got the drop on you, paper-grey = neutral.
 *  The flip ships ahead of queued S14d item 1 — its per-color sfx and
 *  spin-direction colorblind channel remain queued there. */
export const SWIRL_TINT: Record<'player' | 'enemy' | 'none', number> = {
  player: px(RAMP.GRASS, 2),
  enemy: px(RAMP.RED, 2),
  none: px(RAMP.PAPER, 1),
};
