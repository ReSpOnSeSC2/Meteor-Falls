import { describe, expect, it } from 'vitest';
import type { VehicleView } from '../engine/vehicle-domain';
import { featuredVehicleFirst, vehicleEnergyLabel, vehicleListLabel } from '../ui/vehicle-shop-view';

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
});
