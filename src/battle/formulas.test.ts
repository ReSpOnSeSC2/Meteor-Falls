import { describe, it, expect } from 'vitest';
import {
  physicalDamage,
  smashChance,
  vibeDamage,
  runChance,
  instantWin,
  expShare,
  applyWeakness,
  heroOffense,
  equipDelta,
  heroDefense,
  equipDefenseDelta,
  heroLuck,
  equipLuckDelta,
  contractHomesick,
  homesickSkips,
  HOMESICK_CHANCE,
  HOMESICK_SKIP_CHANCE,
  comboCap,
  comboHitDamage,
  comboTotal,
  COMBO_WINDOW_MS,
  wearTier,
} from './formulas';
import { rollPray, prayWeights, PRAY_BASE, type PrayTier } from '../data/abilities';
import { mulberry32 } from '../spritegen/pixmap';
import { expForLevel, makeHeroState } from '../engine/state';
import { ITEMS } from '../data/items';

describe('battle formulas', () => {
  it('physical: offense*2 - defense with ±15% variance, min 1', () => {
    expect(physicalDamage(10, 5, () => 0.5)).toBe(15);
    expect(physicalDamage(1, 99, () => 0.5)).toBe(1);
    const lo = physicalDamage(10, 0, () => 0);
    const hi = physicalDamage(10, 0, () => 0.9999);
    expect(lo).toBe(17);
    expect(hi).toBe(23);
  });

  it('smash chance is guts-driven and capped', () => {
    expect(smashChance(0)).toBeCloseTo(0.02);
    expect(smashChance(1000)).toBe(0.2);
  });

  it('vibe damage scales with the Vibe stat', () => {
    const base = vibeDamage(55, 0, () => 0.5);
    const strong = vibeDamage(55, 60, () => 0.5);
    expect(strong).toBe(base * 2);
  });

  it('weakness multiplies 1.5x', () => {
    expect(applyWeakness(100, true)).toBe(150);
    expect(applyWeakness(100, false)).toBe(100);
  });

  it('run chance clamps 15%..92%', () => {
    expect(runChance(1, 99)).toBe(0.15);
    expect(runChance(99, 1)).toBe(0.92);
  });

  it('instant-win requires +6 levels and never fires on bosses', () => {
    expect(instantWin(8, 1, false)).toBe(true);
    expect(instantWin(6, 1, false)).toBe(false);
    expect(instantWin(50, 1, true)).toBe(false);
  });

  it('exp splits among the conscious, minimum 1', () => {
    expect(expShare(320, 2)).toBe(160);
    expect(expShare(1, 4)).toBe(1);
  });
});

describe('equipped offense (S3 — the acting hero, not the shared bag)', () => {
  it("equipping the T-Ball Bat raises Jay's offense and nobody else's", () => {
    const rex = makeHeroState('rex', 5);
    const faye = makeHeroState('faye', 6);
    const before = heroOffense(rex);
    rex.bag.push('tball_bat');
    rex.equip.weapon = 'tball_bat';
    expect(heroOffense(rex)).toBe(before + (ITEMS.tball_bat.offense ?? 0));
    expect(heroOffense(faye)).toBe(faye.stats.offense); // untouched
  });

  it('bare hands swing at base offense', () => {
    const rex = makeHeroState('rex', 5);
    expect(heroOffense(rex)).toBe(rex.stats.offense);
  });

  it('equipDelta previews Prompt 19\'s "Offense up by N!" exactly', () => {
    const rex = makeHeroState('rex', 5);
    rex.bag = ['cracked_bat', 'tball_bat'];
    rex.equip.weapon = 'cracked_bat';
    expect(equipDelta(rex, 'tball_bat')).toBe(4); // 8 - 4
    expect(equipDelta(rex, 'cracked_bat')).toBe(0); // already wearing it
    rex.equip.weapon = 'tball_bat';
    expect(equipDelta(rex, 'cracked_bat')).toBe(-4); // downgrades preview too
    expect(equipDelta(rex, 'corn_dog')).toBe(0); // not equipment
  });

  it("the Lucky Collar rides the 'other' slot: heroLuck and its preview (S9)", () => {
    const rex = makeHeroState('rex', 5);
    expect(heroLuck(rex)).toBe(rex.stats.luck);
    expect(equipLuckDelta(rex, 'lucky_collar')).toBe(ITEMS.lucky_collar.luck ?? 0);
    rex.bag.push('lucky_collar');
    rex.equip.other = 'lucky_collar';
    expect(heroLuck(rex)).toBe(rex.stats.luck + (ITEMS.lucky_collar.luck ?? 0));
    expect(equipLuckDelta(rex, 'lucky_collar')).toBe(0); // already wearing it
    expect(equipLuckDelta(rex, 'corn_dog')).toBe(0); // not a charm
    expect(heroOffense(rex)).toBe(rex.stats.offense); // luck never leaks into offense
  });

  it("the Champion Jacket rides the 'body' slot: heroDefense and its preview (S10)", () => {
    const rex = makeHeroState('rex', 5);
    const faye = makeHeroState('faye', 6);
    expect(heroDefense(rex)).toBe(rex.stats.defense);
    expect(equipDefenseDelta(rex, 'champion_jacket')).toBe(ITEMS.champion_jacket.defense ?? 0);
    rex.bag.push('champion_jacket');
    rex.equip.body = 'champion_jacket';
    expect(heroDefense(rex)).toBe(rex.stats.defense + (ITEMS.champion_jacket.defense ?? 0));
    expect(heroDefense(faye)).toBe(faye.stats.defense); // one back, one jacket
    expect(equipDefenseDelta(rex, 'champion_jacket')).toBe(0); // already wearing it
    expect(equipDefenseDelta(rex, 'corn_dog')).toBe(0); // not armor
    expect(heroOffense(rex)).toBe(rex.stats.offense); // defense never leaks into offense
    expect(heroLuck(rex)).toBe(rex.stats.luck); // nor into luck
    // the jacket actually shrinks an enemy hit (BattleScene reads heroDefense)
    const bare = physicalDamage(20, rex.stats.defense, () => 0.5);
    const jacketed = physicalDamage(20, heroDefense(rex), () => 0.5);
    expect(jacketed).toBeLessThan(bare);
  });
});

describe('Homesick (§A4.4/§A4.8, S4) — deterministic rng', () => {
  it('contraction fires strictly under HOMESICK_CHANCE', () => {
    expect(contractHomesick(() => HOMESICK_CHANCE - 0.0001)).toBe(true);
    expect(contractHomesick(() => HOMESICK_CHANCE)).toBe(false);
    expect(contractHomesick(() => 0.99)).toBe(false);
  });

  it('a Homesick Jay skips on the low half of the die', () => {
    expect(homesickSkips(() => HOMESICK_SKIP_CHANCE - 0.0001)).toBe(true);
    expect(homesickSkips(() => HOMESICK_SKIP_CHANCE)).toBe(false);
  });

  it('skip frequency over a seeded 10k-run matches the rate ±2%', () => {
    const rng = mulberry32(1995);
    let skips = 0;
    const N = 10_000;
    for (let i = 0; i < N; i++) if (homesickSkips(rng)) skips++;
    expect(Math.abs(skips / N - HOMESICK_SKIP_CHANCE)).toBeLessThan(0.02);
  });
});

describe('canon EXP curve §A9: EXP(L) = 4L^3/3', () => {
  it('matches the table', () => {
    expect(expForLevel(1)).toBe(2);
    expect(expForLevel(2)).toBe(11);
    expect(expForLevel(10)).toBe(1334);
    expect(expForLevel(50)).toBe(166667);
  });
});

describe('PRAY — §A3 canon variance table', () => {
  it('base weights are exactly canon and sum to 100', () => {
    expect(PRAY_BASE).toEqual({
      miraculous: 10,
      wonderful: 20,
      good: 30,
      nothing: 25,
      strange: 10,
      backfire: 5,
    });
    const w = prayWeights(1, 0);
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('distribution over 100k rolls matches weights ±0.5% (Prompt 9)', () => {
    const rng = mulberry32(12345);
    const counts: Record<PrayTier, number> = {
      miraculous: 0,
      wonderful: 0,
      good: 0,
      nothing: 0,
      strange: 0,
      backfire: 0,
    };
    const N = 100_000;
    for (let i = 0; i < N; i++) counts[rollPray(1, 0, rng)]++;
    (Object.keys(PRAY_BASE) as PrayTier[]).forEach((k) => {
      const expected = PRAY_BASE[k] / 100;
      expect(Math.abs(counts[k] / N - expected)).toBeLessThan(0.005);
    });
  });

  it('weights shift toward better tiers with level, and Guts trades Nothing for Miraculous', () => {
    const w15 = prayWeights(15, 0);
    expect(w15.miraculous).toBeGreaterThan(PRAY_BASE.miraculous);
    expect(w15.nothing).toBeLessThan(PRAY_BASE.nothing);
    const wg = prayWeights(1, 30);
    expect(wg.miraculous).toBe(13);
    expect(wg.nothing).toBe(22);
    const sum = Object.values(wg).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});

/* ---- S11b: the SMAAAASH combo (window, cap, ladder) + wear tiers ---- */

describe('combo math (S11b — deterministic: presses in, hits out)', () => {
  it('the cap is 3 + Guts/40 TOTAL hits, ceiling 8', () => {
    expect(comboCap(0)).toBe(3);
    expect(comboCap(39)).toBe(3);
    expect(comboCap(40)).toBe(4);
    expect(comboCap(120)).toBe(6);
    expect(comboCap(200)).toBe(8);
    expect(comboCap(999)).toBe(8); // max 8, however gutsy
  });

  it('each follow-up lands 25% of the smash, floor 1', () => {
    expect(comboHitDamage(100)).toBe(25);
    expect(comboHitDamage(213)).toBe(53);
    expect(comboHitDamage(2)).toBe(1); // never zero — a press always lands
  });

  it('the damage ladder climbs monotonically with hits', () => {
    const smash = 160;
    let prev = 0;
    for (let hits = 1; hits <= 8; hits++) {
      const total = comboTotal(smash, hits);
      expect(total).toBeGreaterThan(prev);
      prev = total;
    }
    // the canon shape: x4 = smash + 3 follow-ups, exactly
    expect(comboTotal(160, 4)).toBe(160 + 40 * 3);
    expect(comboTotal(160, 1)).toBe(160); // no presses = the smash alone
  });

  it('the window is ~1.1s of skip-scaled time', () => {
    expect(COMBO_WINDOW_MS).toBe(1100);
  });
});

describe('wear tiers (S11b — battle sprites read the drums)', () => {
  it('full ≥66%, scuffed <66%, battered <33% — keyed on displayed values', () => {
    expect(wearTier(100, 100)).toBe(0);
    expect(wearTier(67, 100)).toBe(0);
    expect(wearTier(66, 100)).toBe(1);
    expect(wearTier(34, 100)).toBe(1);
    expect(wearTier(33, 100)).toBe(2);
    expect(wearTier(1, 100)).toBe(2);
    expect(wearTier(0, 100)).toBe(2);
    // a mortal roll degrades AS the drum falls — fractional displays count
    expect(wearTier(65.9, 100)).toBe(1);
    expect(wearTier(0, 0)).toBe(2);
  });
});
