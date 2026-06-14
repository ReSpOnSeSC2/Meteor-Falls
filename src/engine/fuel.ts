/**
 * THE FUEL SYSTEM (S20 Movement 43, ADR-084) — every vehicle carries a tank and
 * burns it as it drives, human-driven OR CPU-driven (the traffic sim refuels its
 * pool the same way). Pure, deterministic, tested: it answers what a vehicle runs
 * on, how far a full tank goes, how much is left after driving a distance, and what
 * it costs to fill.
 *
 * §A4.16 in one place:
 *   · FUEL KINDS — `gas` (most road cars), `diesel` (heavy/military/sub), `jet`
 *     (anything that flies), `electric` (the EV line — the Nikolai charges cheap),
 *     and `none` (human-powered: bicycles, the BMX, the road bike — never need fuel).
 *   · A vehicle goes a PRETTY LONG WAY on a tank (thousands of tiles) but it runs
 *     out, and you PAY to fill — electric is far cheaper, cheapest of all at home.
 *
 * The fuel PROFILE is DERIVED from a vehicle's class/terrain (with a few honest
 * overrides) so VEHICLE_SPECS stays the art+gameplay source and fuel is its own
 * concern. The player's per-car fuel rides the save (`fuel`, v14); ambient/CPU
 * vehicles use the same functions on a transient level in the traffic sim.
 */
import { VEHICLE_SPECS, type VehicleClass } from '../spritegen/vehicles';

export type FuelKind = 'gas' | 'diesel' | 'jet' | 'electric' | 'none';

export interface FuelProfile {
  kind: FuelKind;
  /** tank capacity in fuel UNITS (gallons / kWh for electric) */
  tank: number;
  /** ECONOMY — distance in TILES travelled per fuel unit (range = tank × econ) */
  econ: number;
}

/* ─── derivation ─────────────────────────────────────────────────────────── */

/** honest per-type kind overrides (the rest derive from class/terrain) */
const KIND_OVERRIDE: Record<string, FuelKind> = {
  bicycle: 'none', bmx: 'none', road_bike: 'none', trash_cans: 'none',
  ev: 'electric', nikolai: 'electric',
};

function kindFor(type: string): FuelKind {
  if (type in KIND_OVERRIDE) return KIND_OVERRIDE[type];
  const spec = VEHICLE_SPECS[type];
  if (!spec) return 'none';
  if (spec.cls === 'prop' || spec.cls === 'bike') return 'none';
  if (spec.terrain === 'air') return 'jet';                       // planes, jets, helis, blimp
  if (spec.cls === 'tank' || spec.cls === 'truck' || spec.cls === 'bus'
    || spec.cls === 'machine' || spec.cls === 'sub') return 'diesel';
  return 'gas';                                                   // cars, suvs, vans, motos, boats
}

/** base tank capacity by class (units) — heavier silhouettes carry more */
const TANK_BY_CLS: Partial<Record<VehicleClass, number>> = {
  moto: 16, car: 50, suv: 70, van: 60, bus: 120, truck: 130, machine: 80,
  tank: 300, boat: 90, sub: 200, plane: 400, heli: 180,
};
/** base economy by class (tiles per unit) — a full tank goes a LONG way */
const ECON_BY_CLS: Partial<Record<VehicleClass, number>> = {
  moto: 130, car: 90, suv: 64, van: 72, bus: 42, truck: 46, machine: 26,
  tank: 18, boat: 52, sub: 44, plane: 60, heli: 36,
};

/** the fuel profile for a vehicle type (derived; human-powered → none/0/0) */
export function fuelProfile(type: string): FuelProfile {
  const spec = VEHICLE_SPECS[type];
  const kind = kindFor(type);
  if (!spec || kind === 'none') return { kind: 'none', tank: 0, econ: 0 };
  let tank = TANK_BY_CLS[spec.cls] ?? 40;
  let econ = ECON_BY_CLS[spec.cls] ?? 70;
  // the exotics are thirsty (less econ); EVs are efficient + carry a big battery
  if (type === 'limo' || type === 'muscle_car') econ = Math.round(econ * 0.75);
  if (type === 'grand_tourer' || type === 'race_car') econ = Math.round(econ * 0.85);
  if (kind === 'electric') { tank = Math.round(tank * 1.1); econ = Math.round(econ * 1.4); }
  return { kind, tank, econ };
}

/** TRUE when a vehicle burns fuel at all (false for human-powered bikes/props) */
export function needsFuel(type: string): boolean {
  return fuelProfile(type).kind !== 'none';
}

/** the full-tank range, in TILES (a long but finite distance) */
export function rangeTiles(type: string): number {
  const p = fuelProfile(type);
  return p.tank * p.econ;
}

/* ─── burning + filling ──────────────────────────────────────────────────── */

/** fuel left after driving `distanceTiles` from `current` units (floored at 0).
 *  Human-powered vehicles never deplete (returns current unchanged). */
export function consume(current: number, type: string, distanceTiles: number): number {
  const p = fuelProfile(type);
  if (p.kind === 'none' || p.econ <= 0) return current;
  const used = Math.max(0, distanceTiles) / p.econ;
  return Math.max(0, current - used);
}

/** how many units a fill-up would add (tank capacity − current) */
export function unitsToFill(current: number, type: string): number {
  const p = fuelProfile(type);
  return Math.max(0, p.tank - Math.max(0, current));
}

/** a low-fuel warning: under this fraction of the tank, find a station soon */
export const LOW_FUEL_FRACTION = 0.15;
export function isLow(current: number, type: string): boolean {
  const p = fuelProfile(type);
  if (p.kind === 'none' || p.tank <= 0) return false;
  return current / p.tank < LOW_FUEL_FRACTION;
}

/** out of gas — the engine won't turn over (or the EV won't roll) */
export function isEmpty(current: number, type: string): boolean {
  return needsFuel(type) && current <= 0;
}

/** the base price PER UNIT by fuel kind (a region multiplier scales this; M45) */
export const BASE_PRICE_PER_UNIT: Record<FuelKind, number> = {
  gas: 3, diesel: 3.4, jet: 6, electric: 0.5, none: 0,
};

/** the cost to fill `type` from `current` at a price-per-unit (M45 sets price) */
export function fillCost(current: number, type: string, pricePerUnit: number): number {
  return Math.round(unitsToFill(current, type) * Math.max(0, pricePerUnit));
}
