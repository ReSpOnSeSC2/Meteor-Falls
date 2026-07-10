/**
 * Save-backed BMX riding policy.
 *
 * Ownership stays in the existing garage contract (`title_*` key item), the
 * selected ride stays in `activeVehicle`, and its continent stays in
 * `carLocation`. This module only answers whether that saved vehicle can be
 * drawn/driven on the current outdoor map and resolves the X-button toggle.
 */
import { AREA_CONTINENT } from '../data/world';
import { ownsCar, setActive } from './garage';

export const TWOTON_BMX_ID = 'kids_bmx';
export const TWOTON_BMX_TITLE = 'title_car_bmx';
export const TWOTON_BMX_HOME_CONTINENT = 'usa';
export const BMX_SPEED_MULTIPLIER = 1.25;

export type BicycleToggleReason = 'riding' | 'parked' | 'not_owned' | 'indoors' | 'not_here' | 'other_active';

export interface BicycleToggleResult {
  activeVehicle: string | null;
  reason: BicycleToggleReason;
}

/** The map's area id is the same vocabulary AREA_CONTINENT uses. */
export function bicycleContinent(area: string | undefined): string | null {
  return area ? (AREA_CONTINENT[area] ?? null) : null;
}

/** True only when all three save contracts agree and the current map is outdoors. */
export function ridingBmx(
  activeVehicle: string | null,
  keyItems: readonly string[],
  carLocation: Readonly<Record<string, string>>,
  area: string | undefined,
  interior: boolean,
): boolean {
  if (interior || activeVehicle !== TWOTON_BMX_TITLE || !ownsCar(TWOTON_BMX_ID, keyItems)) return false;
  const here = bicycleContinent(area);
  return here !== null && carLocation[TWOTON_BMX_TITLE] === here;
}

/** Resolve the X-button ride/park action without mutating the save. */
export function toggleBmx(
  activeVehicle: string | null,
  keyItems: readonly string[],
  carLocation: Readonly<Record<string, string>>,
  area: string | undefined,
  interior: boolean,
): BicycleToggleResult {
  if (!ownsCar(TWOTON_BMX_ID, keyItems)) return { activeVehicle, reason: 'not_owned' };
  if (interior) return { activeVehicle, reason: 'indoors' };
  const here = bicycleContinent(area);
  if (here === null || carLocation[TWOTON_BMX_TITLE] !== here) return { activeVehicle, reason: 'not_here' };
  if (activeVehicle === TWOTON_BMX_TITLE) return { activeVehicle: null, reason: 'parked' };
  if (activeVehicle !== null) return { activeVehicle, reason: 'other_active' };
  return { activeVehicle: setActive(TWOTON_BMX_TITLE, keyItems), reason: 'riding' };
}
