/**
 * S4 shops BEHAVIOR — sell-at-half math and the per-hero buy routing
 * (ADR-015) exercised headlessly. Data cross-refs (stock ids exist + priced,
 * greet/farewell dialogue, keeper placement, the §A8 stock manifests, Star
 * Cola as the lone 'pp' item) moved to tools/content-validate.ts (S5).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { ITEMS, sellPrice, BAG_MAX } from './items';
import { GS, makeHeroState } from '../engine/state';

describe('S4 shop math (Prompt 20 / §A8 Ch.1)', () => {
  it('the T-Ball Bat upgrade previews "Offense up by 2" over the Cracked Bat', () => {
    // §S4 done-when: 8 offense vs the starter's 4
    expect((ITEMS.tball_bat.offense ?? 0) - (ITEMS.cracked_bat.offense ?? 0)).toBe(2);
    expect(ITEMS.tball_bat.wielder).toBe('rex');
    expect(ITEMS.hand_me_down_pan.wielder).toBe('faye');
  });
});

describe('sell-at-half (Prompt 20)', () => {
  it('halves the catalog price and floors the change', () => {
    expect(sellPrice(ITEMS.tball_bat)).toBe(24); // 48
    expect(sellPrice(ITEMS.corn_dog)).toBe(3); // 6
    expect(sellPrice(ITEMS.star_cola)).toBe(4); // 9 → floored
    expect(sellPrice(ITEMS.hand_me_down_pan)).toBe(18); // 36
    expect(sellPrice(ITEMS.cracked_bat)).toBe(9); // 18
  });

  it("Glint's Spark is not merchandise", () => {
    expect(sellPrice(ITEMS.glints_spark)).toBe(0);
  });
});

describe('buy/sell routing through GS (ADR-015 bags)', () => {
  beforeEach(() => {
    GS.reset();
    GS.data.party.push(makeHeroState('faye', 6, 'Mia'));
  });

  it('a purchase lands in the CHOSEN hero\'s bag and cash falls by the price', () => {
    GS.data.cashOnHand = 50;
    const price = ITEMS.hand_me_down_pan.price;
    expect(GS.addItem('hand_me_down_pan', 'faye')).toBe(true);
    GS.data.cashOnHand -= price;
    expect(GS.bagOf('faye')).toContain('hand_me_down_pan');
    expect(GS.bagOf('rex')).not.toContain('hand_me_down_pan');
    expect(GS.data.cashOnHand).toBe(14);
  });

  it('a 14-item bag refuses the 15th — hands are full', () => {
    const faye = GS.hero('faye');
    while (faye && faye.bag.length < BAG_MAX) faye.bag.push('pbj');
    expect(GS.addItem('star_cola', 'faye')).toBe(false);
    expect(GS.bagOf('faye')).toHaveLength(BAG_MAX);
  });

  it('the spare pan is equippable only by Mia (wielder tag, §A8)', () => {
    GS.addItem('hand_me_down_pan', 'faye');
    expect(GS.equipItem('rex', 'hand_me_down_pan')).toBe('not-yours');
    expect(GS.equipItem('faye', 'hand_me_down_pan')).toBe('ok');
  });

  it('selling the equipped weapon clears the dangling equip ref and pays half', () => {
    GS.data.cashOnHand = 0;
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
    GS.removeItem('cracked_bat', 'rex');
    GS.data.cashOnHand += sellPrice(ITEMS.cracked_bat);
    expect(GS.hero('rex')?.equip.weapon).toBeUndefined();
    expect(GS.bagOf('rex')).not.toContain('cracked_bat');
    expect(GS.data.cashOnHand).toBe(9);
  });
});
