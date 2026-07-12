import { describe, expect, it } from 'vitest';
import type { VehicleView } from '../engine/vehicle-domain';
import {
  featuredVehicleFirst,
  vehicleDeliveryPreview,
  vehicleEnergyLabel,
  vehicleListLabel,
  vehicleOwnershipLabel,
  vehiclePartyFit,
  vehiclePurchaseReadiness,
} from '../ui/vehicle-shop-view';

const view = (over: Partial<VehicleView> = {}): VehicleView => ({
  id: 'commuter',
  title: 'title_car_sedan',
  textureKey: 'commuter',
  name: 'Comet Sedan',
  vehicleType: 'sedan',
  price: 5500,
  note: 'Bert note',
  owned: false,
  active: false,
  driving: false,
  sellValue: 2475,
  seats: 4,
  fuelKind: 'gas',
  fuelCurrent: null,
  fuelCapacity: 14,
  rangeTiles: 4500,
  ...over,
});

describe('VehicleShopScene catalog labels', () => {
  it('renders canonical friendly names instead of raw ids', () => {
    expect(vehicleListLabel(view())).toBe('  Comet Sedan');
    expect(vehicleListLabel(view())).not.toContain('commuter');
  });

  it('marks owned and active rows with stable showroom glyphs', () => {
    expect(vehicleListLabel(view({ owned: true }))).toBe('* Comet Sedan');
    expect(vehicleListLabel(view({ owned: true, active: true }))).toBe('> Comet Sedan');
  });

  it('shows the real save-backed fuel or charge percentage for owned vehicles', () => {
    expect(vehicleEnergyLabel(view())).toBe('GAS POWER');
    expect(vehicleEnergyLabel(view({ owned: true, fuelCurrent: 3.5, fuelCapacity: 14 }))).toBe('GAS 25%');
    expect(vehicleEnergyLabel(view({
      owned: true,
      fuelKind: 'electric',
      fuelCurrent: 18,
      fuelCapacity: 24,
    }))).toBe('CHARGE 75%');
    expect(vehicleEnergyLabel(view({ fuelKind: 'none', fuelCurrent: null, fuelCapacity: null }))).toBe('PEDAL POWER');
  });

  it('moves a regional featured model first without reordering the remaining catalog', () => {
    const cars = [view({ id: 'a' }), view({ id: 'b' }), view({ id: 'c' })];
    expect(featuredVehicleFirst(cars, 'c').map((car) => car.id)).toEqual(['c', 'a', 'b']);
    expect(cars.map((car) => car.id)).toEqual(['a', 'b', 'c']);
  });

  it('preflights total party size against total seats and names the overflow', () => {
    expect(vehiclePartyFit(view({ seats: 4 }), 3)).toEqual({
      partySize: 3,
      seats: 4,
      fits: true,
      overflow: 0,
      label: 'PARTY 3/4  FITS',
    });
    expect(vehiclePartyFit(view({ seats: 2 }), 5)).toEqual({
      partySize: 5,
      seats: 2,
      fits: false,
      overflow: 3,
      label: "PARTY 5/2  3 CAN'T RIDE",
    });
  });

  it('surfaces an exact cash shortfall before the atomic purchase call', () => {
    expect(vehiclePurchaseReadiness(view({ price: 5_500 }), 2_000)).toEqual({
      affordable: false,
      shortfall: 3_500,
    });
    expect(vehiclePurchaseReadiness(view({ price: 5_500 }), 5_500)).toEqual({
      affordable: true,
      shortfall: 0,
    });
  });

  it('renders clear owned and post-sale catalog states', () => {
    expect(vehicleOwnershipLabel(view({ owned: true }))).toBe('OWNED');
    expect(vehicleOwnershipLabel(view({ owned: true, active: true }))).toBe('PREFERRED');
    expect(vehicleOwnershipLabel(view({ owned: true, driving: true }))).toBe('ON THE ROAD');
    // A completed sell refreshes VehicleView with owned=false.
    expect(vehicleOwnershipLabel(view({ owned: false, active: false, driving: false }))).toBe('FOR SALE');
  });

  it('previews the exact authored or allocated delivery bay', () => {
    expect(vehicleDeliveryPreview({
      area: 'foggybottom',
      x: 736.4,
      y: 512.6,
      facing: 'downleft',
    })).toBe('DELIVERY FOGGYBOTTOM @ 736,513 DOWN LEFT');
    expect(vehicleDeliveryPreview({
      area: 'foggybottom',
      x: 736,
      y: 513,
      facing: 'down',
    }, 'PARKED')).toBe('PARKED FOGGYBOTTOM @ 736,513 DOWN');
  });
});
