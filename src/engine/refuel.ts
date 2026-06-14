/**
 * REFUELING (S20 Movement 45, ADR-086) — §A4.17 the fill-up math, pure + tested.
 * What a station sells, what a unit costs there (the region multiplier), what a
 * full fill costs, and the HOME CHARGER (the EV line charges cheapest at home).
 * The OverworldScene runs the pump UI off these; ownership/cash is the scene's.
 */
import { STATIONS, type StationDef } from '../data/stations';
import { fuelProfile, unitsToFill, BASE_PRICE_PER_UNIT, type FuelKind } from './fuel';

/** the home charger is this fraction of the base electric price — cheapest of all */
export const HOME_CHARGE_MULT = 0.4;

/** does this station sell `kind`? */
export function sells(station: StationDef, kind: FuelKind): boolean {
  return station.fuels.includes(kind);
}

/** can this station fill THIS vehicle (it sells the vehicle's fuel kind)? */
export function canRefuelHere(station: StationDef, type: string): boolean {
  const k = fuelProfile(type).kind;
  return k !== 'none' && sells(station, k);
}

/** the price per unit at a station for a fuel kind (base × the region multiplier) */
export function stationPricePerUnit(station: StationDef, kind: FuelKind): number {
  return BASE_PRICE_PER_UNIT[kind] * station.priceMult;
}

/** the price per unit to charge an EV AT HOME (always cheaper than any station) */
export function homeChargePricePerUnit(): number {
  return BASE_PRICE_PER_UNIT.electric * HOME_CHARGE_MULT;
}

export type RefuelReason = 'ok' | 'not_sold' | 'human_powered' | 'already_full' | 'not_electric';
export interface RefuelResult {
  ok: boolean;
  reason: RefuelReason;
  /** the cash the fill costs (0 when it can't proceed) */
  cost: number;
  /** the fuel level after a successful fill (= the tank); unchanged otherwise */
  newFuel: number;
}

/** fill `type` from `current` at `station`: the cost + the topped-off level */
export function refuelAtStation(current: number, type: string, station: StationDef): RefuelResult {
  const p = fuelProfile(type);
  if (p.kind === 'none') return { ok: false, reason: 'human_powered', cost: 0, newFuel: current };
  if (!sells(station, p.kind)) return { ok: false, reason: 'not_sold', cost: 0, newFuel: current };
  const units = unitsToFill(current, type);
  if (units <= 0) return { ok: false, reason: 'already_full', cost: 0, newFuel: current };
  const cost = Math.round(units * stationPricePerUnit(station, p.kind));
  return { ok: true, reason: 'ok', cost, newFuel: p.tank };
}

/** charge the EV line AT HOME (cheapest) — only the electric line qualifies */
export function chargeAtHome(current: number, type: string): RefuelResult {
  const p = fuelProfile(type);
  if (p.kind !== 'electric') return { ok: false, reason: 'not_electric', cost: 0, newFuel: current };
  const units = unitsToFill(current, type);
  if (units <= 0) return { ok: false, reason: 'already_full', cost: 0, newFuel: current };
  const cost = Math.round(units * homeChargePricePerUnit());
  return { ok: true, reason: 'ok', cost, newFuel: p.tank };
}

/** the stations in an area (where the pump props stand) */
export function stationsInArea(area: string): StationDef[] {
  return Object.values(STATIONS).filter((s) => s.area === area);
}

/** every fuel kind a real vehicle needs (so the validator can prove each is sold) */
export const NEEDED_FUEL_KINDS: readonly FuelKind[] = ['gas', 'diesel', 'jet', 'electric'];
