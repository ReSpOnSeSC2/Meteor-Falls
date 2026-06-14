import { describe, it, expect, afterEach } from 'vitest';
import {
  physicalDamage,
  smashChance,
  vibeDamage,
  gadgetDamage,
  runChance,
  instantWin,
  expShare,
  applyWeakness,
  heroOffense,
  heroVibe,
  heroSpeed,
  heroGuts,
  equipArmsDelta,
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
import * as F from './formulas';
import { RAMP, px } from '../palette';
import { rollPray, prayWeights, PRAY_BASE, ABILITIES, type PrayTier } from '../data/abilities';
import { FX_REGISTRY } from './fxRegistry';
import { availableAbilities, HEROES } from '../data/heroes';
import { mulberry32 } from '../spritegen/pixmap';
import { expForLevel, makeHeroState } from '../engine/state';
import { ITEMS } from '../data/items';
import { ENEMIES } from '../data/enemies';

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

describe('the arms slot (S12/S15h — THE STARTING FIVE read-throughs)', () => {
  it('heroSpeed/heroGuts read through the arms slot the heroOffense way', () => {
    const rex = makeHeroState('rex', 8);
    const baseSpd = rex.stats.speed;
    const baseGuts = rex.stats.guts;
    expect(heroSpeed(rex)).toBe(baseSpd);
    expect(heroGuts(rex)).toBe(baseGuts);
    rex.bag.push('cage_sweatband');
    rex.equip.arms = 'cage_sweatband'; // Guts +6
    expect(heroGuts(rex)).toBe(baseGuts + 6);
    expect(heroSpeed(rex)).toBe(baseSpd); // a guts piece moves only guts
  });

  it('equipArmsDelta names the stat THE PIECE carries — the preview contract', () => {
    const faye = makeHeroState('faye', 8);
    expect(equipArmsDelta(faye, 'victory_scrunchie')).toEqual({ stat: 'Speed', d: 6 });
    const dorin = makeHeroState('dorin', 40);
    expect(equipArmsDelta(dorin, 'iron_wristguard')).toEqual({ stat: 'Guts', d: 7 });
    // re-equipping over a piece previews the DIFFERENCE
    const milo = makeHeroState('milo', 10);
    milo.bag.push('shooters_sleeve');
    milo.equip.arms = 'shooters_sleeve'; // Speed +7
    expect(equipArmsDelta(milo, 'shooters_sleeve')).toEqual({ stat: 'Speed', d: 0 });
    // a non-arms item previews nothing through this path
    expect(equipArmsDelta(milo, 'corn_dog')).toEqual({ stat: 'Speed', d: 0 });
  });

  it('every STARTING FIVE piece is wielder-locked arms gear with one stat', () => {
    for (const id of ['cage_sweatband', 'victory_scrunchie', 'shooters_sleeve', 'iron_wristguard', 'minister_ribbon']) {
      const item = ITEMS[id];
      expect(item.kind).toBe('arms');
      expect(item.wielder).toBeDefined();
      expect([item.speed, item.guts].filter((v) => v !== undefined)).toHaveLength(1);
    }
  });
});

describe('§A4.5 SUNNY SIDE + the §A4.7 hospital economy (S14)', () => {
  it('sunnyMul reads the flag counter: 1.1 while battles remain, 1 after', () => {
    expect(F.sunnyMul(() => 5)).toBe(1.1);
    expect(F.sunnyMul(() => 1)).toBe(1.1);
    expect(F.sunnyMul(() => 0)).toBe(1);
    expect(F.sunnyMul(() => false)).toBe(1);
  });

  it('the picnic covers exactly five battles (§A4.5 canon)', () => {
    expect(F.SUNNY_BATTLES).toBe(5);
  });

  it('reviveCost scales by the fallen level (§A4.7 — hospitals are the economy)', () => {
    expect(F.reviveCost(1)).toBe(14);
    expect(F.reviveCost(6)).toBe(34);
    expect(F.reviveCost(13)).toBe(62);
    expect(F.reviveCost(13)).toBeGreaterThan(F.reviveCost(6));
  });
});

describe('§A4.2 contact advantage & the swirl traffic-light (S15c, ADR-043)', () => {
  it('contactAdvantage: behind-us = enemy, fleeing-back = player, face-on = none', () => {
    expect(F.contactAdvantage(-0.5, false)).toBe('enemy'); // it got our back
    expect(F.contactAdvantage(-0.36, true)).toBe('enemy'); // their angle wins outright
    expect(F.contactAdvantage(0.5, true)).toBe('player'); // we got its back
    expect(F.contactAdvantage(0.5, false)).toBe('none'); // head-on chase, no sneak
    expect(F.contactAdvantage(0, false)).toBe('none'); // sideswipe
    expect(F.contactAdvantage(0.36, false)).toBe('none'); // facing it isn't sneaking
  });

  it('the swirl is a traffic light: GREEN = player free round, RED = ambush (user law — was reversed)', () => {
    expect(F.SWIRL_TINT.player).toBe(px(RAMP.GRASS, 2));
    expect(F.SWIRL_TINT.enemy).toBe(px(RAMP.RED, 2));
    expect(F.SWIRL_TINT.none).toBe(px(RAMP.PAPER, 1));
  });
});

describe('S16 — "The Old Light, Doubled": Jay\'s expanded kit', () => {
  it('Vibe Surge Σ scales with Vibe like every Vibe line (power 480)', () => {
    // the canonical mid roll (rng 0.5 → ×1.0 variance). By ~L40 Jay is ~70 Vibe
    expect(vibeDamage(480, 70, () => 0.5)).toBe(Math.round(480 * (1 + 70 / 60)));
    // Σ out-damages Ω (power 341) at the same Vibe — the ladder holds
    expect(vibeDamage(480, 70, () => 0.5)).toBeGreaterThan(vibeDamage(341, 70, () => 0.5));
    // no element: it is the answer to elementally-immune foes (never resisted)
    expect(applyWeakness(vibeDamage(480, 70, () => 0.5), false)).toBe(vibeDamage(480, 70, () => 0.5));
  });

  describe('layered wards — mitigateIncoming', () => {
    const none: F.WardState = { shield: false, ward: false, reflect: false, mirror: false, steeled: false };

    it('WARD halves elemental and leaves PHYSICAL untouched (separate layers)', () => {
      const ward = { ...none, ward: true };
      expect(F.mitigateIncoming(100, 'fire', ward).taken).toBe(50);
      expect(F.mitigateIncoming(100, 'freeze', ward).taken).toBe(50);
      expect(F.mitigateIncoming(100, 'holy', ward).taken).toBe(50);
      // physical sails straight through a ward — that's Shield's job
      expect(F.mitigateIncoming(100, 'physical', ward).taken).toBe(100);
    });

    it('SHIELD halves physical and leaves elemental untouched (the mirror layer of Ward)', () => {
      const shield = { ...none, shield: true };
      expect(F.mitigateIncoming(100, 'physical', shield).taken).toBe(50);
      expect(F.mitigateIncoming(100, 'fire', shield).taken).toBe(100);
    });

    it('REFLECT halves ALL classes AND bounces ~1/3 back at the attacker', () => {
      const reflect = { ...none, reflect: true };
      const phys = F.mitigateIncoming(99, 'physical', reflect);
      expect(phys.taken).toBe(49); // halved
      expect(phys.reflected).toBe(33); // ~1/3 of the incoming
      // bounces typeless 'none' damage too (an unblockable-looking AoE)
      expect(F.mitigateIncoming(99, 'none', reflect).reflected).toBe(33);
    });

    it('BRACE-AND-ANSWER: a STEELED hero behind a reflect bounces harder (~1/2)', () => {
      const braced = { ...none, reflect: true, steeled: true };
      expect(F.mitigateIncoming(100, 'physical', braced).reflected).toBe(50);
    });

    it('BULWARK: holding Shield AND Ward trims a little extra (double-guarded)', () => {
      const bulwark = { ...none, shield: true, ward: true };
      // physical: shield halves (50), bulwark shaves 15% → 42
      expect(F.mitigateIncoming(100, 'physical', bulwark).taken).toBe(42);
      // a lone shield on the same hit only reaches 50 — the stack is strictly better
      expect(F.mitigateIncoming(100, 'physical', { ...none, shield: true }).taken).toBe(50);
    });

    it('never zeroes a hit (the §A3 "always ≥1 damage" rule)', () => {
      const stacked = { shield: true, ward: true, reflect: true, mirror: true, steeled: false };
      expect(F.mitigateIncoming(1, 'physical', stacked).taken).toBe(1);
    });
  });

  describe('MIND WARP — puppet', () => {
    it('bosses are mind_immune by design; mooks are not', () => {
      expect(F.mindImmune({ boss: true })).toBe(true);
      expect(F.mindImmune({ mind_immune: true })).toBe(true);
      expect(F.mindImmune({})).toBe(false);
      expect(F.mindImmune({ boss: false })).toBe(false);
    });

    it('an even-or-lower-level foe never resists (the puppet lands) — control shines on trash', () => {
      expect(F.puppetResist(10, 10)).toBe(0);
      expect(F.puppetResist(8, 12)).toBe(0);
    });

    it('an elite that outlevels Jay resists, clamped at 85%', () => {
      expect(F.puppetResist(15, 10)).toBeCloseTo(0.2); // +5 levels → 20%
      expect(F.puppetResist(40, 10)).toBe(0.85); // hard cap, never an auto-fail spell vs a hero
    });

    it('Ω holds 2–3 turns; α holds exactly 1', () => {
      expect(F.puppetTurns(false, () => 0.99)).toBe(1);
      expect(F.puppetTurns(true, () => 0.2)).toBe(3);
      expect(F.puppetTurns(true, () => 0.9)).toBe(2);
    });
  });
});

describe('S17 (ADR-061) — secondary bonuses, Vibe-on-gear, resists, tonic boosts', () => {
  // Synthetic gear carrying the new riders — injected per test, removed after.
  // No real item carries them yet (M16 is the spine), so the seams are proven
  // here; with the shipped 41-item catalog every rider is 0 (no behaviour change).
  const TEST_IDS = ['t_vibe_charm', 't_guts_bat', 't_fire_robe', 't_cap_robe'];
  const inject = (): void => {
    ITEMS.t_vibe_charm = { id: 't_vibe_charm', name: 'Test Pendant', kind: 'charm', luck: 1, vibe: 10, usableInBattle: false, price: 0, text: 'test.', band: 'cross' };
    ITEMS.t_guts_bat = { id: 't_guts_bat', name: 'Test Bat', kind: 'weapon', offense: 5, wielder: 'rex', bonus: { guts: 3 }, usableInBattle: false, price: 0, text: 'test.', band: 'cross' };
    ITEMS.t_fire_robe = { id: 't_fire_robe', name: 'Test Robe', kind: 'armor', defense: 4, vibe: 2, resists: [{ element: 'fire', pct: 30 }], usableInBattle: false, price: 0, text: 'test.', band: 'cross' };
    ITEMS.t_cap_robe = { id: 't_cap_robe', name: 'Test Cap Robe', kind: 'armor', defense: 1, resists: [{ element: 'fire', pct: 100 }], usableInBattle: false, price: 0, text: 'test.', band: 'cross' };
  };
  afterEach(() => { for (const id of TEST_IDS) delete ITEMS[id]; });

  it('heroVibe reads the dedicated Vibe rider on worn gear', () => {
    inject();
    const rex = makeHeroState('rex', 5);
    expect(heroVibe(rex)).toBe(rex.stats.vibe); // base only
    rex.equip.other = 't_vibe_charm';
    expect(heroVibe(rex)).toBe(rex.stats.vibe + 10);
  });

  it('a secondary bonus stacks on the primary without leaking into other stats', () => {
    inject();
    const rex = makeHeroState('rex', 5);
    const baseGuts = heroGuts(rex);
    rex.equip.weapon = 't_guts_bat';
    expect(heroOffense(rex)).toBe(rex.stats.offense + 5); // the primary slot stat
    expect(heroGuts(rex)).toBe(baseGuts + 3); // the secondary rider
    expect(heroLuck(rex)).toBe(rex.stats.luck); // no leak
  });

  it('elemental resists sum per element; applyResist reduces, never below 1', () => {
    inject();
    const rex = makeHeroState('rex', 5);
    expect(F.heroResist(rex, 'fire')).toBe(0);
    rex.equip.body = 't_fire_robe';
    expect(F.heroResist(rex, 'fire')).toBeCloseTo(0.3);
    expect(F.heroResist(rex, 'freeze')).toBe(0); // only the listed element
    expect(heroVibe(rex)).toBe(rex.stats.vibe + 2); // the robe carries a vibe rider too
    expect(F.applyResist(100, 0.3)).toBe(70);
    expect(F.applyResist(1, 0.8)).toBe(1);
  });

  it('heroResist caps stacked resistance at RESIST_CAP_PCT', () => {
    inject();
    const rex = makeHeroState('rex', 5);
    rex.equip.body = 't_cap_robe'; // a 100%-fire robe
    expect(F.heroResist(rex, 'fire')).toBeCloseTo(F.RESIST_CAP_PCT / 100);
  });

  it('a permanent tonic boost rides boosts and every seam reads it', () => {
    const rex = makeHeroState('rex', 5);
    expect(F.boostOf(rex, 'offense')).toBe(0);
    rex.boosts.offense = 4;
    rex.boosts.vibe = 7;
    expect(heroOffense(rex)).toBe(rex.stats.offense + 4);
    expect(heroVibe(rex)).toBe(rex.stats.vibe + 7);
    expect(F.boostOf(rex, 'offense')).toBe(4);
  });
});

describe('DORIN — "The Monk\'s Full Path" (ability expansion)', () => {
  it('the Comet ladder scales with Vibe and stays NON-elemental (defense-pierce)', () => {
    // β(190) → γ(250) → Ω(320): each rung out-damages the last at the same Vibe
    const v = 60;
    expect(vibeDamage(250, v, () => 0.5)).toBeGreaterThan(vibeDamage(190, v, () => 0.5));
    expect(vibeDamage(320, v, () => 0.5)).toBeGreaterThan(vibeDamage(250, v, () => 0.5));
    // Comet is element 'none' — the reliable answer that weakness can't touch
    const omega = vibeDamage(320, v, () => 0.5);
    expect(applyWeakness(omega, false)).toBe(omega);
  });

  it('Stone Brow Stance counter returns ~40% of a physical swing (bracedCounter)', () => {
    expect(F.bracedCounter(100)).toBe(40);
    expect(F.bracedCounter(0)).toBe(0);
    // it never lands the last hit itself — the seam clamps; here we just prove
    // the math is a strict fraction of the dealt damage
    expect(F.bracedCounter(255)).toBe(Math.floor(255 * 0.4));
  });

  it('Flowing Step dodge is a deterministic Speed/Luck roll (flowingDodge)', () => {
    // a roll under the chance dodges; a roll over it does not — rng injected
    const fast = makeHeroState('dorin', 50);
    const chance = Math.min(0.6, 0.35 + (heroSpeed(fast) + heroLuck(fast)) / 400);
    expect(F.flowingDodge(heroSpeed(fast), heroLuck(fast), () => chance - 0.01)).toBe(true);
    expect(F.flowingDodge(heroSpeed(fast), heroLuck(fast), () => chance + 0.01)).toBe(false);
  });

  it('the +Defense / +Speed stance bumps are real, finite seams', () => {
    expect(F.BRACED_DEFENSE).toBeGreaterThan(0);
    expect(F.FLOWING_SPEED).toBeGreaterThan(0);
  });

  it('party Mirror bounces ~1/4 through the shared mitigateIncoming seam (S16)', () => {
    const mirror: F.WardState = { shield: false, ward: false, reflect: false, mirror: true, steeled: false };
    const hit = F.mitigateIncoming(100, 'physical', mirror);
    expect(hit.taken).toBe(50); // halved, like reflect
    expect(hit.reflected).toBe(25); // but bounces a quarter, not a third — faster, softer
  });

  it('availableAbilities(dorin) returns the full ~14-ability path with Comet Ω awakened', () => {
    const ids = availableAbilities('dorin', 99, () => true);
    // the seven new rows are all reachable
    for (const id of ['vibe_comet_b', 'vibe_comet_g', 'healing_b', 'healing_o', 'mirror_o', 'brainjam_g', 'stone_stance', 'flowing_step']) {
      expect(ids).toContain(id);
    }
    // Comet Ω is granted by the awakening, NOT a level unlock (one-path rule)
    expect(ids).toContain('vibe_comet_o');
    expect(HEROES.dorin.unlocks.some((u) => u.ability === 'vibe_comet_o')).toBe(false);
    // a full master's kit — roughly double the baseline seven
    expect(ids.length).toBeGreaterThanOrEqual(14);
  });
});

/* ================= S-Mia ("Ability Expansion") ================= */

describe("Mia's elemental edge (the OUTGOING weak/resist multiplier)", () => {
  it('weakness ×1.5, resist ×0.5, neither ×1, never below 1', () => {
    expect(F.elementMultiplier({ weak: true })).toBe(1.5);
    expect(F.elementMultiplier({ resist: true })).toBe(0.5);
    expect(F.elementMultiplier({})).toBe(1);
    expect(F.applyElement(100, { weak: true })).toBe(150);
    expect(F.applyElement(100, { resist: true })).toBe(50);
    expect(F.applyElement(100, {})).toBe(100);
    expect(F.applyElement(1, { resist: true })).toBe(1); // ≥1 floor
  });

  it('ADR-099 — a per-enemy weakMul override DOUBLES (the §A6 Mainframe cooling fan); default stays 1.5', () => {
    expect(F.elementMultiplier({ weak: true, weakMul: 2 })).toBe(2); // the Mainframe's ×2
    expect(F.elementMultiplier({ weak: true })).toBe(1.5); // every other foe
    expect(F.applyElement(100, { weak: true, weakMul: 2 })).toBe(200);
    expect(F.applyElement(100, { weakMul: 2 })).toBe(100); // ignored unless the hit is weak
  });

  it('holy PIERCES a slice of resistance — resisted holy still lands ~×0.75', () => {
    expect(F.elementMultiplier({ resist: true, holy: true })).toBe(F.HOLY_PIERCE_MUL);
    expect(F.elementMultiplier({ resist: true, holy: true })).toBeGreaterThan(F.RESIST_MUL);
    // a weakness still wins outright, even a "resisted" holy reads as weak
    expect(F.elementMultiplier({ weak: true, resist: true, holy: true })).toBe(1.5);
    // distinct seam from the incoming ward: applyElement never touches mitigateIncoming
    expect(F.applyElement(200, { resist: true, holy: true })).toBe(150);
  });
});

describe("Mia's focus-fire amplifier (exposed × marked)", () => {
  it('exposed is ×1.3, marked ×1.25, and they STACK multiplicatively', () => {
    expect(F.focusMultiplier({ exposed: true })).toBeCloseTo(1.3);
    expect(F.focusMultiplier({ marked: true })).toBeCloseTo(1.25);
    expect(F.focusMultiplier({ exposed: true, marked: true })).toBeCloseTo(1.3 * 1.25);
    expect(F.focusMultiplier({})).toBe(1);
    // the spike is bigger than either tag alone (coordinated focus-fire pays)
    const both = F.applyFocus(100, { exposed: true, marked: true });
    expect(both).toBeGreaterThan(F.applyFocus(100, { exposed: true }));
    expect(both).toBe(Math.round(100 * 1.3 * 1.25));
  });
});

describe("Mia's new statuses (burn / frozen / lifedrain / lucky)", () => {
  it('burn DoT is ~6% max HP with a floor of 4, over 3 turns', () => {
    expect(F.burnTick(1000)).toBe(60);
    expect(F.burnTick(10)).toBe(4); // the min-4 floor on a small foe
    expect(F.BURN_TURNS).toBe(3);
  });

  it('frozen lands by tier (γ40 / Ω55 / Σ70%) — an injected roll decides', () => {
    expect(F.frozenChance(3)).toBeCloseTo(0.4);
    expect(F.frozenChance(4)).toBeCloseTo(0.55);
    expect(F.frozenChance(5)).toBeCloseTo(0.7);
    expect(F.frozenChance(1)).toBe(0); // α/β don't freeze
    expect(F.frozenLands(5, () => 0.69)).toBe(true);
    expect(F.frozenLands(5, () => 0.71)).toBe(false);
  });

  it('the boss control-cap is the SHARED mindImmune gate (frozen mirrors puppet)', () => {
    expect(F.mindImmune({ boss: true })).toBe(true);
    expect(F.mindImmune({ mind_immune: true })).toBe(true);
    expect(F.mindImmune({})).toBe(false);
  });

  it('lifedrain heals half of what it takes (HP + PP), never below 1', () => {
    expect(F.lifedrainHeal(100)).toBe(50);
    expect(F.lifedrainHeal(1)).toBe(1);
    // the bite scales with Vibe; Σ (AoE) bites less per target than Ω (single)
    const single = F.lifedrainDamage(false, 60, () => 0.5);
    const aoe = F.lifedrainDamage(true, 60, () => 0.5);
    expect(single).toBeGreaterThan(aoe);
  });

  it("LUCKY STAR's +Luck feeds the SMAAASH/crit roll (smashChance luck term)", () => {
    // base curve unchanged when no luck is passed (Guts-only callers)
    expect(smashChance(0)).toBeCloseTo(0.02);
    expect(smashChance(1000)).toBe(0.2);
    // luck raises the chance, still capped at the EB 0.2 ceiling
    expect(smashChance(0, F.LUCKY_LUCK)).toBeGreaterThan(smashChance(0));
    expect(smashChance(1000, F.LUCKY_LUCK)).toBe(0.2);
  });
});

describe("Mia grows to ~30 spells (Ability Expansion)", () => {
  it('availableAbilities(faye) returns ~30 unique ids — five ladders + PRAY + utility', () => {
    const ids = availableAbilities('faye', 99, () => true);
    expect(new Set(ids).size).toBe(ids.length); // unique
    expect(ids.length).toBe(30);
    // every ladder reaches its Σ capstone, plus the utility four + PRAY
    for (const id of [
      'vibe_fire_x', 'vibe_freeze_x', 'vibe_volt_x', 'magnet_x', 'starsong_x',
      'starsong_a', 'magnet_o', 'heartmend_a', 'lucky_star', 'hush_hex', 'dreamlull', 'pray',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('her 3 iconic beats AWAKEN and are NOT in the level table (one-path rule)', () => {
    for (const awakened of ['starsong_a', 'vibe_fire_x', 'magnet_x']) {
      expect(HEROES.faye.unlocks.some((u) => u.ability === awakened)).toBe(false);
    }
    // and her opener still prays from L1 (the canon centerpiece, untouched)
    expect(HEROES.faye.unlocks.some((u) => u.ability === 'pray' && u.level === 1)).toBe(true);
  });
});

/* ================= PIPPA ("The Page's Full Brief") ================= */

describe('PIPPA — the page\'s tactical kit (NO Vibe, NO PP: competence, not magic)', () => {
  it('marked makes a party hit UNMISSABLE and AMPLIFIED (×1.25, shared with the focus seam)', () => {
    // the guaranteed-hit gate opens on either a marked foe or a focused hero
    expect(F.guaranteedHit({ marked: true })).toBe(true);
    expect(F.guaranteedHit({ focus: true })).toBe(true);
    expect(F.guaranteedHit({})).toBe(false);
    // and the amplify rides the existing focus-fire multiplier (×1.25), so a
    // marked hit is unmissable AND bigger — the focus-fire enabler
    expect(F.applyFocus(100, { marked: true })).toBe(Math.round(100 * F.MARKED_MUL));
    expect(F.applyFocus(100, { marked: true })).toBeGreaterThan(100);
    expect(F.MARKED_TURNS).toBeGreaterThan(0);
  });

  it('rally boosts Speed AND Luck (read the steeled way), Ovation lasting longer', () => {
    expect(F.RALLY_SPEED).toBeGreaterThan(0);
    expect(F.RALLY_LUCK).toBeGreaterThan(0);
    // Standing Ovation is the Royal Rally++ — a longer hold (her pre-boss button)
    expect(F.OVATION_TURNS).toBeGreaterThan(F.RALLY_TURNS);
  });

  it('focus guarantees the next swing — the big-little combo (consumed, 2 turns)', () => {
    expect(F.guaranteedHit({ focus: true })).toBe(true);
    expect(F.FOCUS_TURNS).toBeGreaterThan(0);
  });

  it('evasion is a HIGH dodge that scales with her absurd Luck (evasionDodges)', () => {
    // Pippa is the luckiest hero (base Luck 9) — her dodge floor is genuinely high
    const pippa = makeHeroState('pippa', 30);
    const chance = Math.min(0.85, 0.55 + (heroSpeed(pippa) + heroLuck(pippa)) / 300);
    expect(chance).toBeGreaterThan(0.55); // her Speed/Luck lift it above the floor
    expect(F.evasionDodges(heroSpeed(pippa), heroLuck(pippa), () => chance - 0.01)).toBe(true);
    expect(F.evasionDodges(heroSpeed(pippa), heroLuck(pippa), () => chance + 0.01)).toBe(false);
    expect(F.EVASION_TURNS).toBeGreaterThan(0);
  });

  it('rattled (Stern Decree) lowers enemy damage ×0.8 and rolls a small skip', () => {
    expect(F.rattledDamage(100)).toBe(80);
    expect(F.rattledDamage(1)).toBe(1); // never below 1
    expect(F.rattledDamage(100)).toBeLessThan(100); // the no-magic Offense-down is real
    expect(F.rattledSkips(() => F.RATTLED_SKIP_CHANCE - 0.01)).toBe(true);
    expect(F.rattledSkips(() => F.RATTLED_SKIP_CHANCE + 0.01)).toBe(false);
    expect(F.RATTLED_TURNS).toBeGreaterThan(0);
  });

  it('morale (Bellwether) carries the next PRAY one tier better and amplifies a heal', () => {
    // the prayer rings one rung brighter — the cross-character feed to Mia's faith
    expect(F.moraleTierUp('nothing')).toBe('good');
    expect(F.moraleTierUp('good')).toBe('wonderful');
    expect(F.moraleTierUp('wonderful')).toBe('miraculous');
    // ...but it can't exceed the canon ceiling
    expect(F.moraleTierUp('miraculous')).toBe('miraculous');
    // and the next party heal lands ×1.5 (never below 1)
    expect(F.moraleHeal(100)).toBe(150);
    expect(F.moraleHeal(1)).toBe(2);
    expect(F.MORALE_HEAL_MUL).toBeGreaterThan(1);
  });

  it('availableAbilities(pippa) returns ~12 ids — all LEVEL unlocks, no awakenings', () => {
    // no Vibe → no awakenings: the flag source can never grant her anything
    const ids = availableAbilities('pippa', 99, () => false);
    expect(new Set(ids).size).toBe(ids.length); // unique
    expect(ids.length).toBe(12);
    // the six new tactical moves are all reachable by leveling
    for (const id of [
      'volley_mark', 'standing_ovation', 'field_dressing',
      'diplomatic_immunity', 'stern_decree', 'the_minutes',
    ]) {
      expect(ids).toContain(id);
    }
    // and her on-join four are still there
    for (const id of ['pinpoint_mark', 'royal_rally', 'pocket_patch', 'big_little_focus']) {
      expect(ids).toContain(id);
    }
    // even with EVERY flag set, nothing extra appears (she earns her brief by service)
    expect(availableAbilities('pippa', 99, () => true).length).toBe(12);
  });
});

/* ================= MILO ("Gadget Genius, Doubled") ================= */

describe('MILO — gadgets (NO Vibe, NO PP: competence, not the old light)', () => {
  it('gadgetDamage reads OFF power alone — a rocket hits the same at any Vibe', () => {
    // there is NO vibe parameter: the machine cannot scale on a stat Milo lacks
    expect(gadgetDamage(90, () => 0.5)).toBe(90);
    expect(gadgetDamage(360, () => 0.5)).toBe(360); // the siege rocket, fixed
    // a ±10% spread, never below 1
    expect(gadgetDamage(100, () => 0)).toBe(90);
    expect(gadgetDamage(100, () => 0.9999)).toBe(110);
    expect(gadgetDamage(0, () => 0.5)).toBe(1);
    // and it is INDEPENDENT of the vibeDamage curve (which DOES read Vibe up)
    expect(vibeDamage(90, 60, () => 0.5)).toBeGreaterThan(gadgetDamage(90, () => 0.5));
  });

  it('every Milo gadget is kind:gadget at 0 PP (no Vibe, no PP — by design)', () => {
    for (const id of availableAbilities('milo', 99, () => false)) {
      const ab = ABILITIES[id];
      expect(ab.kind).toBe('gadget');
      expect(ab.pp).toBe(0);
    }
  });

  it('Static Bomb is a volt AoE + paralyze; volt-weak foes take ×1.5', () => {
    const ab = ABILITIES.static_bomb;
    expect(ab.element).toBe('volt');
    expect(ab.target).toBe('enemies');
    expect(ab.status).toBe('paralyzed');
    // the EMP's volt finds a volt-weakness through the gadget path (applyWeakness)
    expect(applyWeakness(gadgetDamage(70, () => 0.5), true)).toBe(Math.round(70 * 1.5));
    expect(applyWeakness(gadgetDamage(70, () => 0.5), false)).toBe(70);
  });

  it('Cryo Grenade freezes (skip-lock) at a real, nonzero chance — shared FROZEN math', () => {
    const ab = ABILITIES.cryo_grenade;
    expect(ab.element).toBe('freeze');
    expect(ab.status).toBe('frozen');
    // the fx tier the on-hit status reads resolves a genuine skip-lock chance
    const tier = FX_REGISTRY.cryo_grenade.tier ?? 1;
    expect(F.frozenChance(tier)).toBeGreaterThan(0);
    expect(F.frozenLands(tier, () => F.frozenChance(tier) - 0.01)).toBe(true);
    expect(F.frozenLands(tier, () => F.frozenChance(tier) + 0.01)).toBe(false);
  });

  it('Forcefield Gizmo deploys a PARTY shield; Med-Spray heals AND clears status', () => {
    const ff = ABILITIES.forcefield_gizmo;
    expect(ff.target).toBe('allies'); // party-wide deployable
    expect(ff.status).toBe('shield'); // the existing physical-halving status, reused
    expect(ff.power).toBe(0);
    const med = ABILITIES.med_spray;
    expect(med.heal).toBe(true);
    expect(med.status).toBe('cure'); // a reliable 0-PP heal that also cleanses
    expect(med.power).toBeGreaterThan(0);
  });

  it('availableAbilities(milo) returns 11 ids — all LEVEL unlocks, no awakenings', () => {
    const ids = availableAbilities('milo', 99, () => false);
    expect(new Set(ids).size).toBe(ids.length); // unique
    expect(ids.length).toBe(11);
    // the six new gadgets are all reachable by leveling
    for (const id of ['scope', 'static_bomb', 'cryo_grenade', 'forcefield_gizmo', 'med_spray', 'siege_rocket']) {
      expect(ids).toContain(id);
    }
    // and his original five are still there
    for (const id of ['spy', 'repair', 'bottle_rocket', 'big_bottle_rocket', 'multi_bottle_rocket']) {
      expect(ids).toContain(id);
    }
    // no Vibe → no awakenings: even with EVERY flag set, nothing extra appears
    expect(availableAbilities('milo', 99, () => true).length).toBe(11);
  });
});

/* ---- S18 M24 (ADR-094) — Debt #1: THE §A8 PENDANT SEAM (incoming resist) ---- */

describe('resistIncoming — a worn pendant halves a matching elemental hit', () => {
  it('the §A8 Jade Salamander Charm (fire 25%) shaves a fire hit, leaves volt/physical alone', () => {
    const rex = makeHeroState('rex', 20);
    rex.equip.other = 'jade_salamander_charm'; // fire 25%
    expect(F.heroResist(rex, 'fire')).toBeCloseTo(0.25, 5);
    // a 100-point fire hit lands at 75; volt and physical are untouched
    expect(F.resistIncoming(100, 'fire', rex)).toBe(75);
    expect(F.resistIncoming(100, 'volt', rex)).toBe(100);
    expect(F.resistIncoming(100, 'physical', rex)).toBe(100);
    expect(F.resistIncoming(100, 'none', rex)).toBe(100);
  });

  it('a hero with no resist gear takes the full elemental hit', () => {
    const faye = makeHeroState('faye', 20);
    expect(F.resistIncoming(100, 'fire', faye)).toBe(100);
    expect(F.resistIncoming(100, 'freeze', faye)).toBe(100);
  });

  it('an elemental hit is never reduced below 1, even at the resist cap', () => {
    const rex = makeHeroState('rex', 20);
    rex.equip.other = 'jade_salamander_charm';
    expect(F.resistIncoming(1, 'fire', rex)).toBe(1);
  });
});

/* ---- S18 M24 (ADR-094) — Debt #4: §A7 LOOT (rollDrops) ---- */

describe('rollDrops — a defeated enemy rolls its identity drops', () => {
  it('no drops table → nothing', () => {
    expect(F.rollDrops(undefined, () => 0)).toEqual([]);
    expect(F.rollDrops([], () => 0)).toEqual([]);
  });

  it('a guaranteed drop (chance 1) always lands; a near-zero one with a high roll never does', () => {
    expect(F.rollDrops([{ item: 'corn_dog', chance: 1 }], () => 0.99)).toEqual(['corn_dog']);
    expect(F.rollDrops([{ item: 'corn_dog', chance: 0.001 }], () => 0.5)).toEqual([]);
  });

  it('each drop rolls independently — the roll decides each item', () => {
    const table = [
      { item: 'a', chance: 0.5 },
      { item: 'b', chance: 0.5 },
    ];
    // a fixed rng that returns 0.2 then 0.8: a drops (0.2<0.5), b does not (0.8<0.5 is false)
    const seq = [0.2, 0.8];
    let i = 0;
    expect(F.rollDrops(table, () => seq[i++])).toEqual(['a']);
  });

  it('is deterministic for a seeded rng (ADR-008 replay-safe)', () => {
    const table = [{ item: 'aloe_leaf', chance: 0.3 }];
    const a = F.rollDrops(table, mulberry32(99));
    const b = F.rollDrops(table, mulberry32(99));
    expect(a).toEqual(b);
  });

  it('every seeded Ch.1–2 drop names a real, cheap §A8 item (economy-neutral)', () => {
    for (const e of Object.values(ENEMIES)) {
      for (const d of e.drops ?? []) {
        expect(ITEMS[d.item], `${e.id} drops ${d.item}`).toBeDefined();
        expect(d.chance).toBeGreaterThan(0);
        expect(d.chance).toBeLessThanOrEqual(1);
        expect(ITEMS[d.item].price * d.chance).toBeLessThanOrEqual(e.cash + 20);
      }
    }
  });
});
