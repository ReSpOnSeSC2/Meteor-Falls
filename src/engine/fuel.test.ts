/**
 * S20 Movement 43 (ADR-084) — THE FUEL SYSTEM. Mirrors the content-validate `fuel`
 * gate and proves the model: kinds, a long-but-finite range, burning down with
 * distance (human OR CPU — same functions), refuel units + cost, and that the EV
 * line runs on cheap electricity.
 */
import { describe, it, expect } from 'vitest';
import {
  fuelProfile, needsFuel, rangeTiles, consume, unitsToFill, fillCost,
  isLow, isEmpty, BASE_PRICE_PER_UNIT,
} from './fuel';
import { VEHICLE_SPECS } from '../spritegen/vehicles';

describe('fuel profiles — every vehicle runs on the right thing', () => {
  it('human-powered bikes never need fuel', () => {
    for (const t of ['bicycle', 'bmx', 'road_bike']) {
      expect(fuelProfile(t).kind).toBe('none');
      expect(needsFuel(t)).toBe(false);
      expect(rangeTiles(t)).toBe(0);
    }
  });
  it('the EV line runs on electric; muscle/diesel/jet read right', () => {
    expect(fuelProfile('nikolai').kind).toBe('electric');
    expect(fuelProfile('ev').kind).toBe('electric');
    expect(fuelProfile('sedan').kind).toBe('gas');
    expect(fuelProfile('tank').kind).toBe('diesel');
    expect(fuelProfile('troop_transport').kind).toBe('diesel');
    expect(fuelProfile('f15').kind).toBe('jet');
    expect(fuelProfile('jumbo_jet').kind).toBe('jet');
    expect(fuelProfile('boat').kind).toBe('gas');
    expect(fuelProfile('submarine').kind).toBe('diesel');
  });
  it('every powered vehicle goes a long but finite way', () => {
    for (const t of Object.keys(VEHICLE_SPECS)) {
      if (!needsFuel(t)) continue;
      expect(rangeTiles(t), `'${t}' range`).toBeGreaterThanOrEqual(500);
      expect(rangeTiles(t)).toBeLessThan(1_000_000); // finite — it DOES run out
    }
  });
});

describe('burning fuel — human or CPU, the same math', () => {
  it('a sedan drains with distance and floors at empty', () => {
    const full = fuelProfile('sedan').tank;
    const after = consume(full, 'sedan', rangeTiles('sedan') / 2);
    expect(after).toBeCloseTo(full / 2, 5);
    expect(consume(full, 'sedan', rangeTiles('sedan') * 2)).toBe(0); // can't go negative
  });
  it('a human-powered bike never drains (pedal forever)', () => {
    expect(consume(0, 'bmx', 9999)).toBe(0);
    expect(consume(5, 'road_bike', 9999)).toBe(5);
  });
  it('low + empty read correctly', () => {
    const tank = fuelProfile('sedan').tank;
    expect(isEmpty(0, 'sedan')).toBe(true);
    expect(isEmpty(0, 'bmx')).toBe(false);     // a bike is never "out of gas"
    expect(isLow(tank * 0.1, 'sedan')).toBe(true);
    expect(isLow(tank * 0.9, 'sedan')).toBe(false);
  });
});

describe('filling up — you pay, electric is far cheaper', () => {
  it('unitsToFill tops the tank, never overfills', () => {
    const tank = fuelProfile('suv').tank;
    expect(unitsToFill(0, 'suv')).toBe(tank);
    expect(unitsToFill(tank, 'suv')).toBe(0);
    expect(unitsToFill(tank + 99, 'suv')).toBe(0);
  });
  it('fillCost = units × price; a gas fill costs more than a charge', () => {
    const gas = fillCost(0, 'sedan', BASE_PRICE_PER_UNIT.gas);
    const charge = fillCost(0, 'nikolai', BASE_PRICE_PER_UNIT.electric);
    expect(gas).toBeGreaterThan(0);
    expect(charge).toBeGreaterThan(0);
    expect(charge).toBeLessThan(gas); // the Nikolai is much cheaper to "fill"
  });
  it('base prices order gas < jet, electric cheapest', () => {
    expect(BASE_PRICE_PER_UNIT.electric).toBeLessThan(BASE_PRICE_PER_UNIT.gas);
    expect(BASE_PRICE_PER_UNIT.jet).toBeGreaterThan(BASE_PRICE_PER_UNIT.gas);
  });
});
