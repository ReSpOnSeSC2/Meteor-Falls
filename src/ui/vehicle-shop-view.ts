/** Phaser-free presentation helpers for the production vehicle showroom. */
import type { VehicleView } from '../engine/vehicle-domain';
import type { VehicleParkingState } from '../engine/state';

export interface VehiclePartyFit {
  partySize: number;
  seats: number;
  fits: boolean;
  overflow: number;
  /** Compact copy for the showroom comparison panel. */
  label: string;
}

export interface VehiclePurchaseReadiness {
  affordable: boolean;
  shortfall: number;
}

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

/** One stable ownership read covers catalog, action and post-sale refreshes. */
export function vehicleOwnershipLabel(
  car: Pick<VehicleView, 'owned' | 'active' | 'driving'>,
): 'ON THE ROAD' | 'PREFERRED' | 'OWNED' | 'FOR SALE' {
  if (car.driving) return 'ON THE ROAD';
  if (car.active) return 'PREFERRED';
  if (car.owned) return 'OWNED';
  return 'FOR SALE';
}

/** The driver is already part of `partySize`, matching the vehicle spec's
 * total-seat contract. A non-fitting vehicle remains buyable as a garage ride,
 * but callers must show the warning before committing a purchase or trade. */
export function vehiclePartyFit(
  car: Pick<VehicleView, 'seats'>,
  partySize: number,
): VehiclePartyFit {
  const normalizedPartySize = Math.max(1, Math.floor(partySize));
  const seats = Math.max(0, Math.floor(car.seats));
  const overflow = Math.max(0, normalizedPartySize - seats);
  return {
    partySize: normalizedPartySize,
    seats,
    fits: overflow === 0,
    overflow,
    label: overflow === 0
      ? `PARTY ${normalizedPartySize}/${seats}  FITS`
      : `PARTY ${normalizedPartySize}/${seats}  ${overflow} CAN'T RIDE`,
  };
}

/** A presentation preflight only. The vehicle domain repeats the cash check at
 * the mutation seam, so a stale UI frame can never create a partial sale. */
export function vehiclePurchaseReadiness(
  car: Pick<VehicleView, 'price'>,
  cashOnHand: number,
): VehiclePurchaseReadiness {
  const shortfall = Math.max(0, car.price - Math.max(0, cashOnHand));
  return { affordable: shortfall === 0, shortfall };
}

/** Exact allocated bay copy used before the player signs the title. */
export function vehicleDeliveryPreview(
  parking: Pick<VehicleParkingState, 'area' | 'x' | 'y' | 'facing'>,
  prefix: 'DELIVERY' | 'PARKED' = 'DELIVERY',
): string {
  const area = parking.area.trim().replace(/_/g, ' ').toUpperCase();
  const facing = parking.facing
    .replace(/_/g, ' ')
    .replace(/^(up|down)(left|right)$/i, '$1 $2')
    .toUpperCase();
  return `${prefix} ${area} @ ${Math.round(parking.x)},${Math.round(parking.y)} ${facing}`;
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
