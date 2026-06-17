/**
 * S18 Movement 33 (ADR-074) — THE FLEET (§A4.10/§A5 scale-up).
 *
 * Proves the staging (control scales road→water→air by chapter), the depth + pad
 * piloting rules, the Ember-trail reach law, no-fly/no-wake zones, and purchasing.
 */
import { describe, it, expect } from 'vitest';
import {
  controlReach, canPilot, canEnterWater, canTakeOff, reachesNode, zoneOpen,
  craftForSale, canBuy, titleOf, ownsCraft,
} from './fleet';
import { FLEET_CRAFT } from '../data/fleet';

describe('fleet — control scales by chapter (ADR-035 staging)', () => {
  it('Ch.3 pilots cars but not boats or planes', () => {
    expect(canPilot('sedan', 3)).toBe(true);
    expect(canPilot('boat', 3)).toBe(false);
    expect(canPilot('small_plane', 3)).toBe(false);
  });
  it('Ch.5 adds trucks/buses', () => {
    expect(canPilot('bus', 5)).toBe(true);
    expect(canPilot('school_bus', 5)).toBe(true);
    expect(canPilot('truck', 5)).toBe(true);
  });
  it('Ch.8 adds boats; Ch.10 adds planes + subs', () => {
    expect(canPilot('boat', 8)).toBe(true);
    expect(canPilot('boat', 7)).toBe(false);
    expect(canPilot('small_plane', 10)).toBe(true);
    expect(canPilot('submarine', 10)).toBe(true);
  });
  it('the reach grows monotonically with the chapter', () => {
    expect(controlReach(10).length).toBeGreaterThan(controlReach(3).length);
  });
});

describe('fleet — water depth + air pads', () => {
  it('a dinghy hugs rivers, a yacht needs open water, a sub dives', () => {
    expect(canEnterWater('boat', 'river')).toBe(true);
    expect(canEnterWater('boat', 'deep')).toBe(false);
    expect(canEnterWater('yacht', 'river')).toBe(false);
    expect(canEnterWater('yacht', 'open')).toBe(true);
    expect(canEnterWater('submarine', 'deep')).toBe(true);
  });
  it('a jet needs a runway; a heli lifts off anything flat', () => {
    expect(canTakeOff('small_plane', 'runway')).toBe(true);
    expect(canTakeOff('small_plane', 'flat')).toBe(false);
    expect(canTakeOff('helicopter', 'flat')).toBe(true);
    expect(canTakeOff('helicopter', 'helipad')).toBe(true);
  });
});

describe('fleet — the Ember-trail law + zones', () => {
  it('a craft reaches only VISITED nodes (flying never skips story)', () => {
    expect(reachesNode(['otterbrook', 'zanzibel'], 'zanzibel')).toBe(true);
    expect(reachesNode(['otterbrook'], 'mars')).toBe(false); // can't fly ahead of the Embers
  });
  it('a no-fly/no-wake zone opens only at its chapter', () => {
    expect(zoneOpen('ch10', 8)).toBe(false);
    expect(zoneOpen('ch8', 8)).toBe(true);
  });
});

describe('fleet — purchasing', () => {
  it('a craft lists only at/after its band, and you must afford it', () => {
    const dinghy = FLEET_CRAFT.river_dinghy;
    expect(canBuy(dinghy, dinghy.price, 8)).toBe(true);
    expect(canBuy(dinghy, dinghy.price, 7)).toBe(false);      // not listed yet
    expect(canBuy(dinghy, dinghy.price - 1, 8)).toBe(false);  // can't afford
  });
  it('a marina at Ch.10 lists the dinghy, yacht, and sub', () => {
    const ids = craftForSale('marina', 10).map((c) => c.id).sort();
    expect(ids).toEqual(['deep_marlin', 'pearl_yacht', 'river_dinghy']);
  });
  it('the school bus lists as its own bus-class dealer craft', () => {
    const schoolBus = FLEET_CRAFT.school_bus;
    expect(schoolBus.vehicleType).toBe('school_bus');
    expect(craftForSale('dealer', 5).map((c) => c.id)).toContain('school_bus');
  });
  it('ownership rides a title key-item, parked at your property', () => {
    expect(titleOf('comet_gt')).toBe('title_comet_gt');
    expect(ownsCraft('comet_gt', ['title_comet_gt'])).toBe(true);
    expect(ownsCraft('comet_gt', [])).toBe(false);
  });
});
