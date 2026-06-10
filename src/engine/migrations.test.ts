import { describe, it, expect, beforeEach } from 'vitest';
import { GS, makeHeroState, newGameData } from './state';
import { migrateSave, CURRENT_SAVE_VERSION } from './migrations';
import { BAG_MAX } from '../data/items';
import type { HeroId } from '../data/heroes';

/** a hero exactly as v1 saves stored them — no bag, no equip */
function v1Hero(id: HeroId, level: number, name?: string): Record<string, unknown> {
  const h = makeHeroState(id, level, name) as unknown as Record<string, unknown>;
  delete h.bag;
  delete h.equip;
  return h;
}

/** an S2-era version-1 save: shared inventory, two heroes, Faye joined */
function v1SaveS2(): Record<string, unknown> {
  return {
    version: 1,
    party: [v1Hero('rex', 7, 'Casey'), v1Hero('faye', 6, 'Wren')],
    guest: null,
    inventory: ['cracked_bat', 'corn_dog', 'salt_shaker'],
    keyItems: ['star_locket'],
    cashOnHand: 33,
    banked: 50,
    pendingDeposit: 12,
    flags: { faye_joined: true, holding_open: true, manager_defeated: true },
    playtimeSec: 1234,
    map: 'brickton',
    x: 230,
    y: 420,
    facing: 'down',
    embers: 1,
    favoriteFood: 'pancakes',
    playerName: 'Jay',
    coolestThing: 'dial tones',
    heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', dorin: 'Petru' },
  };
}

describe('save migration registry (S3) — v1 → v2', () => {
  beforeEach(() => GS.reset());

  it('an S2-era v1 save lifts to v2: Rex inherits the shared inventory', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.data.version).toBe(2);
    expect(GS.hero('rex')?.bag).toEqual(['cracked_bat', 'corn_dog', 'salt_shaker']);
    expect('inventory' in (GS.data as unknown as Record<string, unknown>)).toBe(false);
    // progress fields survive untouched
    expect(GS.data.cashOnHand).toBe(33);
    expect(GS.data.embers).toBe(1);
    expect(GS.flag('holding_open')).toBe(true);
    expect(GS.hero('faye')?.name).toBe('Wren');
  });

  it("old battles used the bag's first weapon — migration equips it so Rex's damage doesn't change", () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
  });

  it('auto-equip skips food and picks the first weapon Rex can wield', () => {
    const save = v1SaveS2();
    save.inventory = ['corn_dog', 'tball_bat', 'cracked_bat'];
    GS.deserialize(JSON.stringify(save));
    expect(GS.hero('rex')?.equip.weapon).toBe('tball_bat');
  });

  it('grants Faye her Hand-Me-Down Pan when faye_joined (the intake shelf, canonically)', () => {
    GS.deserialize(JSON.stringify(v1SaveS2()));
    const faye = GS.hero('faye');
    expect(faye?.bag).toContain('hand_me_down_pan');
    expect(faye?.equip.weapon).toBe('hand_me_down_pan');
  });

  it('no pan before she joins', () => {
    const save = v1SaveS2();
    save.party = [v1Hero('rex', 7, 'Casey')];
    save.flags = { holding_open: true };
    GS.deserialize(JSON.stringify(save));
    expect(GS.hasItem('hand_me_down_pan')).toBe(false);
  });

  it('a pre-S12 v1 save (missing heroNames et al.) loads as v2 with canon backfill', () => {
    // before Prompt 21/S12, saves had no heroNames/playerName/coolestThing
    const save = v1SaveS2();
    delete save.heroNames;
    delete save.playerName;
    delete save.coolestThing;
    save.party = [v1Hero('rex', 3)];
    save.flags = { intro_done: true };
    save.inventory = ['cracked_bat', 'corn_dog', 'corn_dog'];
    GS.deserialize(JSON.stringify(save));
    expect(GS.data.version).toBe(2);
    expect(GS.data.heroNames.faye).toBe('Faye'); // ADR-013 backfill, folded in
    expect(GS.data.playerName).toBe('Player');
    expect(GS.data.coolestThing).toBe('meteors');
    expect(GS.hero('rex')?.bag).toEqual(['cracked_bat', 'corn_dog', 'corn_dog']);
    expect(GS.hero('rex')?.equip.weapon).toBe('cracked_bat');
  });

  it('an overstuffed v1 inventory clips to the 14-slot bag', () => {
    const save = v1SaveS2();
    save.inventory = Array.from({ length: 16 }, () => 'pbj');
    GS.deserialize(JSON.stringify(save));
    expect(GS.hero('rex')?.bag.length).toBe(BAG_MAX);
  });

  it('a v2 save round-trips exactly (no migration applied)', () => {
    GS.reset();
    GS.data.party.push(makeHeroState('faye', 6, 'Wren'));
    GS.addItem('hand_me_down_pan', 'faye');
    GS.equipItem('faye', 'hand_me_down_pan');
    GS.setFlag('faye_joined');
    const snapshot = JSON.parse(GS.serialize()) as unknown;
    GS.reset();
    GS.deserialize(JSON.stringify(snapshot));
    expect(JSON.parse(GS.serialize())).toEqual(snapshot);
  });

  it('rejects unknown and future versions loudly', () => {
    expect(() => GS.deserialize(JSON.stringify({ ...newGameData(), version: 99 }))).toThrow();
    expect(() =>
      GS.deserialize(JSON.stringify({ ...newGameData(), version: CURRENT_SAVE_VERSION + 1 })),
    ).toThrow();
    expect(() => GS.deserialize(JSON.stringify({ party: [] }))).toThrow(); // no version at all
    expect(() => migrateSave('"not an object"', newGameData())).toThrow();
  });
});
