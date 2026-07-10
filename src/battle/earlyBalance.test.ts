import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { expForLevel, makeHeroState } from '../engine/state';
import { heroDefense, heroOffense, physicalDamage } from './formulas';

const department = {
  blazer_smiler: [50, 8],
  mandatory_memo: [40, 7],
  motivational_poster: [46, 7],
  quota_clock: [56, 9],
  the_suit: [80, 10],
} as const;

const chapter2 = {
  pickpocket_parrot: [150, 19],
  gilded_beetle: [180, 20],
  cursed_souvenir: [150, 21],
  step_mask: [175, 22],
  banana_bunch: [36, 17],
  jungle_jitterbug: [155, 24],
  brass_market_mimic: [180, 21],
  bronze_mask_guardian: [190, 22],
  cackling_mask: [150, 23],
  confetti_cannon: [145, 24],
  postage_stampede: [155, 23],
} as const;

describe('Chapters 1-2 production balance envelope', () => {
  it('pins the Department and Chapter 2 HP/Offense pairs', () => {
    for (const [id, expected] of Object.entries({ ...department, ...chapter2 })) {
      const enemy = ENEMIES[id];
      expect([enemy.hp, enemy.offense], id).toEqual(expected);
    }
  });

  it('keeps the scripted Sentinel reward below level 4 from a fresh save', () => {
    const afterSentinel = expForLevel(1) + ENEMIES.hush_sentinel.exp;
    expect(ENEMIES.hush_sentinel.exp).toBe(80);
    expect(afterSentinel).toBeGreaterThanOrEqual(expForLevel(3));
    expect(afterSentinel).toBeLessThan(expForLevel(4));
  });

  it('makes Department specialists survive Jay L7 gear without becoming sponges', () => {
    const jay = makeHeroState('rex', 7);
    jay.equip.weapon = 'tball_bat';
    for (const id of Object.keys(department)) {
      const enemy = ENEMIES[id];
      const centerHit = physicalDamage(heroOffense(jay), enemy.defense, () => 0.5);
      const rounds = enemy.hp / centerHit;
      expect(centerHit, id).toBeLessThan(enemy.hp);
      expect(rounds, id).toBeGreaterThan(1);
      expect(rounds, id).toBeLessThan(2.5);
    }
  });

  it('lands Chapter 2 regulars in a 1.5-3 round geared-party envelope', () => {
    const jay = makeHeroState('rex', 9);
    const mia = makeHeroState('faye', 8);
    jay.equip.weapon = 'sandlot_slugger';
    mia.equip.weapon = 'copper_pan';
    for (const id of Object.keys(chapter2).filter((id) => id !== 'banana_bunch')) {
      const enemy = ENEMIES[id];
      const partyDpr =
        physicalDamage(heroOffense(jay), enemy.defense, () => 0.5) +
        physicalDamage(heroOffense(mia), enemy.defense, () => 0.5);
      const rounds = enemy.hp / partyDpr;
      expect(rounds, id).toBeGreaterThan(1.5);
      expect(rounds, id).toBeLessThan(3);
    }
  });

  it('keeps even top Chapter 2 armor from reducing every base hit to one', () => {
    const jay = makeHeroState('rex', 9);
    const mia = makeHeroState('faye', 8);
    jay.equip.body = 'cushma';
    mia.equip.body = 'cushma';
    for (const id of Object.keys(chapter2)) {
      const enemy = ENEMIES[id];
      const meanBaseHit =
        (physicalDamage(enemy.offense, heroDefense(jay), () => 0.5) +
          physicalDamage(enemy.offense, heroDefense(mia), () => 0.5)) /
        2;
      expect(meanBaseHit, id).toBeGreaterThan(1);
      expect(meanBaseHit, id).toBeLessThan(25);
    }
  });
});
