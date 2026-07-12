/** Phaser-free presentation helpers for the production vehicle showroom. */
import type { VehicleView } from '../engine/vehicle-domain';

/** Stable regional merchandising: the featured model leads without disturbing
 * the chapter/filter order of every other listing. */
export function featuredVehicleFirst(
  cars: readonly VehicleView[],
  featuredVehicleId?: string,
): VehicleView[] {
  const ordered = [...cars];
  if (!featuredVehicleId) return ordered;
  const featured = ordered.findIndex((car) => car.id === featuredVehicleId);
  if (featured <= 0) return ordered;
  const [hero] = ordered.splice(featured, 1);
  ordered.unshift(hero);
  return ordered;
}

/** Stable short labels keep the showroom list clear of the preview panel. */
export function vehicleListLabel(car: VehicleView): string {
  const name = car.name.slice(0, 16);
  return `${car.active ? '> ' : car.owned ? '* ' : '  '}${name}`;
}

/** Actual save-backed energy copy for an owned ride; catalog rows that are not
 * yet owned retain a simple powertrain label instead of implying a real tank. */
export function vehicleEnergyLabel(car: VehicleView): string {
  if (car.fuelKind === 'none') return 'PEDAL POWER';
  if (!car.owned || car.fuelCurrent === null || !car.fuelCapacity) {
    return `${car.fuelKind.toUpperCase()} POWER`;
  }
  const percent = Math.max(0, Math.min(100, Math.round((car.fuelCurrent / car.fuelCapacity) * 100)));
  return car.fuelKind === 'electric' ? `CHARGE ${percent}%` : `${car.fuelKind.toUpperCase()} ${percent}%`;
}

export function compactVehicleRange(tiles: number): string {
  if (tiles <= 0) return 'LEGS';
  if (tiles >= 10_000) return `${Math.round(tiles / 1000)}K TILES`;
  return `${tiles.toLocaleString('en-US')} TILES`;
}
