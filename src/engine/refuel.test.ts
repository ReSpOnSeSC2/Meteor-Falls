/**
 * S20 Movement 45 (ADR-086) — GAS STATIONS & CHARGING. Mirrors the `stations`
 * gate and proves the §A4.17 fill math: pay to fill, region prices, every fuel
 * kind sold somewhere, and the EV line charges cheapest at home.
 */
import { describe, it, expect } from 'vitest';
import {
  sells, canRefuelHere, stationPricePerUnit, homeChargePricePerUnit,
  refuelAtStation, chargeAtHome, stationsInArea, NEEDED_FUEL_KINDS,
} from './refuel';
import { STATIONS } from '../data/stations';
import { fuelProfile } from './fuel';

const otterbrook = STATIONS.otterbrook_gasngo;
const mars = STATIONS.mars_solar;

describe('stations — what they sell, where they are', () => {
  it('every needed fuel kind is sold at some station (never stranded)', () => {
    for (const k of NEEDED_FUEL_KINDS) {
      expect(Object.values(STATIONS).some((s) => sells(s, k)), `nobody sells '${k}'`).toBe(true);
    }
  });
  it('stationsInArea finds the pumps', () => {
    expect(stationsInArea('otterbrook').map((s) => s.id)).toContain('otterbrook_gasngo');
    expect(stationsInArea('nowhere')).toEqual([]);
  });
  it('canRefuelHere matches the vehicle fuel kind', () => {
    expect(canRefuelHere(otterbrook, 'sedan')).toBe(true);   // gas
    expect(canRefuelHere(otterbrook, 'nikolai')).toBe(true); // electric
    expect(canRefuelHere(otterbrook, 'tank')).toBe(false);   // diesel — not sold here
    expect(canRefuelHere(otterbrook, 'bmx')).toBe(false);    // human-powered
  });
  it('there is no gas on Mars — electric only', () => {
    expect(sells(mars, 'gas')).toBe(false);
    expect(sells(mars, 'diesel')).toBe(false);
    expect(sells(mars, 'electric')).toBe(true);
  });
});

describe('the fill — you pay, region prices vary', () => {
  it('fills the tank and charges units × the region price', () => {
    const r = refuelAtStation(0, 'sedan', otterbrook);
    expect(r.ok).toBe(true);
    expect(r.newFuel).toBe(fuelProfile('sedan').tank);
    expect(r.cost).toBe(Math.round(fuelProfile('sedan').tank * stationPricePerUnit(otterbrook, 'gas')));
  });
  it("won't fill a full tank, a human-powered bike, or a fuel it doesn't sell", () => {
    expect(refuelAtStation(fuelProfile('sedan').tank, 'sedan', otterbrook).reason).toBe('already_full');
    expect(refuelAtStation(0, 'bmx', otterbrook).reason).toBe('human_powered');
    expect(refuelAtStation(0, 'tank', otterbrook).reason).toBe('not_sold');
  });
  it('Mars is the dearest place to charge (cost-of-living 2.5×)', () => {
    expect(stationPricePerUnit(mars, 'electric')).toBeGreaterThan(stationPricePerUnit(otterbrook, 'electric'));
  });
});

describe('the home charger — the EV line charges cheapest at home', () => {
  it('charges the EV line, refuses combustion', () => {
    const r = chargeAtHome(0, 'nikolai');
    expect(r.ok).toBe(true);
    expect(r.newFuel).toBe(fuelProfile('nikolai').tank);
    expect(chargeAtHome(0, 'sedan').reason).toBe('not_electric');
  });
  it('home charging beats every station electric price', () => {
    const home = homeChargePricePerUnit();
    for (const st of Object.values(STATIONS)) {
      if (sells(st, 'electric')) expect(home).toBeLessThan(stationPricePerUnit(st, 'electric'));
    }
  });
  it('charging the Nikolai is far cheaper than gassing a sedan of similar size', () => {
    const charge = chargeAtHome(0, 'nikolai').cost;
    const gas = refuelAtStation(0, 'sedan', otterbrook).cost;
    expect(charge).toBeLessThan(gas);
  });
});
