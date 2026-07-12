import { describe, expect, it } from 'vitest';
import { DEALERSHIP } from '../data/dealership';
import { fuelProfile } from './fuel';
import { newGameData } from './state';
import {
  allocateVehicleDeliverySlot,
  beginDrivingVehicle,
  chooseActiveVehicle,
  currentVehicleChapter,
  parkDrivingVehicle,
  purchaseVehicle,
  sellVehicle,
  tradeVehicle,
  vehicleByTitle,
  vehicleCatalog,
  vehicleContinent,
  vehicleParkingSlotsOverlap,
  vehicleServiceableAtArea,
} from './vehicle-domain';

describe('production vehicle catalog', () => {
  it('has stable player-facing names and resolves titles back to their listing', () => {
    const names = new Set<string>();
    for (const car of Object.values(DEALERSHIP)) {
      expect(car.displayName.trim(), car.id).not.toBe('');
      expect(names.has(car.displayName), car.displayName).toBe(false);
      names.add(car.displayName);
      expect(vehicleByTitle(car.title)?.id).toBe(car.id);
    }
  });

  it('uses the Ember ledger and real filters without exposing future stock', () => {
    const data = newGameData();
    expect(currentVehicleChapter(data)).toBe(1);
    expect(vehicleCatalog(data, 1, 'bikes').map((v) => v.id)).toEqual(['kids_bmx', 'ten_speed']);
    expect(vehicleCatalog(data, 1, 'powered').map((v) => v.id)).toEqual(['old_reliable', 'commuter']);
    expect(vehicleCatalog(data, 1, ['commuter', 'the_nikolai']).map((v) => v.id)).toEqual(['commuter']);
    data.flags.ember1 = true;
    data.flags.ember2 = true;
    expect(currentVehicleChapter(data)).toBe(3);
    expect(vehicleCatalog(data, 3).map((v) => v.id)).toContain('city_ev');
  });

  it('resolves every rebuilt formal-city delivery id to its real continent', () => {
    expect(vehicleContinent('brickton')).toBe('usa');
    expect(vehicleContinent('valle_dorado')).toBe('south_america');
    expect(vehicleContinent('minimus_major')).toBe('minimus');
    expect(vehicleContinent('lotus_harbor')).toBe('china');
  });

  it('services a vehicle only on its current continent while preserving missing legacy locations', () => {
    const data = newGameData();
    data.carLocation.title_car_sedan = 'usa';
    expect(vehicleServiceableAtArea(data, 'title_car_sedan', 'brickton')).toBe(true);
    expect(vehicleServiceableAtArea(data, 'title_car_sedan', 'foggybottom')).toBe(false);
    expect(vehicleServiceableAtArea(data, 'title_car_ev', 'foggybottom')).toBe(true);
  });
});

describe('atomic vehicle purchase and sale', () => {
  it('buys with real cash and initializes title, flag, full tank, location, and exact parking', () => {
    const data = newGameData();
    data.cashOnHand = 6000;
    data.map = 'otterbrook';
    data.x = 144;
    data.y = 288;
    data.facing = 'left';

    const bought = purchaseVehicle(data, 'commuter', { chapter: 1, area: 'otterbrook' });

    expect(bought.ok).toBe(true);
    expect(bought.cashDelta).toBe(-5500);
    expect(data.cashOnHand).toBe(500);
    expect(data.keyItems).toContain('title_car_sedan');
    expect(data.flags.owned_commuter).toBe(true);
    expect(data.fuel.title_car_sedan).toBe(fuelProfile('sedan').tank);
    expect(data.carLocation.title_car_sedan).toBe('usa');
    expect(data.vehicleParking.title_car_sedan).toEqual({
      area: 'otterbrook', x: 144, y: 288, facing: 'left',
    });
    expect(data.activeVehicle).toBeNull();
    expect(data.drivingVehicle).toBeNull();
    expect(bought.car?.fuelCurrent).toBe(fuelProfile('sedan').tank);
    expect(bought.car?.fuelCapacity).toBe(fuelProfile('sedan').tank);
  });

  it('human-powered purchases preserve the existing no-fuel contract', () => {
    const data = newGameData();
    data.cashOnHand = 100;
    expect(purchaseVehicle(data, 'kids_bmx', { chapter: 1, area: 'brickton' }).ok).toBe(true);
    expect(data.keyItems).toContain('title_car_bmx');
    expect('title_car_bmx' in data.fuel).toBe(false);
    expect(data.carLocation.title_car_bmx).toBe('usa');
  });

  it('allocates deterministic non-overlapping bays for repeated deliveries at one dealer', () => {
    const data = newGameData();
    data.cashOnHand = 20_000;
    const bay = { area: 'otterbrook', x: 640, y: 320, facing: 'right' as const };

    expect(purchaseVehicle(data, 'commuter', { chapter: 1, area: 'otterbrook', parking: bay }).ok).toBe(true);
    expect(purchaseVehicle(data, 'old_reliable', { chapter: 1, area: 'otterbrook', parking: bay }).ok).toBe(true);
    expect(purchaseVehicle(data, 'kids_bmx', { chapter: 1, area: 'otterbrook', parking: bay }).ok).toBe(true);

    const parked = [
      ['title_car_sedan', data.vehicleParking.title_car_sedan],
      ['title_car_motorcycle', data.vehicleParking.title_car_motorcycle],
      ['title_car_bmx', data.vehicleParking.title_car_bmx],
    ] as const;
    expect(new Set(parked.map(([, point]) => `${point.x},${point.y}`)).size).toBe(3);
    for (let i = 0; i < parked.length; i++) {
      for (let j = i + 1; j < parked.length; j++) {
        expect(vehicleParkingSlotsOverlap(
          parked[i][0], parked[i][1], parked[j][0], parked[j][1],
        )).toBe(false);
      }
    }

    const cloned = JSON.parse(JSON.stringify(data)) as typeof data;
    expect(allocateVehicleDeliverySlot(data, 'title_car_ev', bay)).toEqual(
      allocateVehicleDeliverySlot(cloned, 'title_car_ev', bay),
    );
  });

  it('lets a garage redeploy helper re-seat its own title without self-collision', () => {
    const data = newGameData();
    const bay = { area: 'brickton', x: 512, y: 384, facing: 'up' as const };
    data.vehicleParking.title_car_sedan = { ...bay };
    expect(allocateVehicleDeliverySlot(data, 'title_car_sedan', bay)).toEqual(bay);
  });

  it('a failed purchase is byte-for-byte non-mutating', () => {
    const data = newGameData();
    const before = JSON.stringify(data);
    const failed = purchaseVehicle(data, 'commuter', { chapter: 1, area: 'otterbrook' });
    expect(failed.reason).toBe('cant_afford');
    expect(JSON.stringify(data)).toBe(before);
  });

  it('selling cleans every dependent record in the same commit', () => {
    const data = newGameData();
    data.cashOnHand = 6000;
    purchaseVehicle(data, 'commuter', { chapter: 1, area: 'otterbrook' });
    data.activeVehicle = 'title_car_sedan';
    data.garage['27_maple'] = ['title_car_sedan'];

    const sold = sellVehicle(data, 'commuter');

    expect(sold.ok).toBe(true);
    expect(data.keyItems).not.toContain('title_car_sedan');
    expect(data.flags.owned_commuter).toBe(false);
    expect(data.garage['27_maple']).toBeUndefined();
    expect(data.fuel.title_car_sedan).toBeUndefined();
    expect(data.carLocation.title_car_sedan).toBeUndefined();
    expect(data.vehicleParking.title_car_sedan).toBeUndefined();
    expect(data.activeVehicle).toBeNull();
  });
});

describe('atomic trade, active selection, and driving hand-off', () => {
  it('marks a preferred title without moving or deploying its parked vehicle', () => {
    const data = newGameData();
    data.cashOnHand = 6000;
    purchaseVehicle(data, 'commuter', { chapter: 1, area: 'otterbrook' });
    const parkedBefore = { ...data.vehicleParking.title_car_sedan };

    const preferred = chooseActiveVehicle(data, 'title_car_sedan');

    expect(preferred.ok).toBe(true);
    expect(preferred.message).toContain('stays wherever it is parked');
    expect(data.activeVehicle).toBe('title_car_sedan');
    expect(data.drivingVehicle).toBeNull();
    expect(data.vehicleParking.title_car_sedan).toEqual(parkedBefore);
  });

  it('trades an owned title as credit, fills the replacement, and carries active selection forward', () => {
    const data = newGameData();
    data.cashOnHand = 30_000;
    purchaseVehicle(data, 'commuter', { chapter: 3, area: 'otterbrook' });
    chooseActiveVehicle(data, 'title_car_sedan');
    const cashBefore = data.cashOnHand;

    const traded = tradeVehicle(data, 'city_ev', {
      chapter: 3,
      area: 'foggybottom',
      tradeTitle: 'title_car_sedan',
    });

    expect(traded.ok).toBe(true);
    expect(data.cashOnHand).toBe(cashBefore + traded.cashDelta);
    expect(data.keyItems).not.toContain('title_car_sedan');
    expect(data.keyItems).toContain('title_car_ev');
    expect(data.flags.owned_commuter).toBe(false);
    expect(data.flags.owned_city_ev).toBe(true);
    expect(data.fuel.title_car_ev).toBe(fuelProfile('ev').tank);
    expect(data.carLocation.title_car_ev).toBe('england');
    expect(data.activeVehicle).toBe('title_car_ev');
  });

  it('an unaffordable trade is byte-for-byte non-mutating', () => {
    const data = newGameData();
    data.cashOnHand = 6000;
    purchaseVehicle(data, 'commuter', { chapter: 8, area: 'otterbrook' });
    data.cashOnHand = 0;
    const before = JSON.stringify(data);
    const failed = tradeVehicle(data, 'the_stretch', {
      chapter: 8,
      area: 'otterbrook',
      tradeTitle: 'title_car_sedan',
    });
    expect(failed.reason).toBe('cant_afford');
    expect(JSON.stringify(data)).toBe(before);
  });

  it('enters and exits through explicit drivingVehicle + save-backed parking state', () => {
    const data = newGameData();
    data.cashOnHand = 6000;
    purchaseVehicle(data, 'commuter', { chapter: 1, area: 'otterbrook' });

    expect(beginDrivingVehicle(data, 'title_car_sedan').ok).toBe(true);
    expect(data.drivingVehicle).toBe('title_car_sedan');
    expect(data.vehicleParking.title_car_sedan).toBeUndefined();

    const parked = parkDrivingVehicle(data, {
      area: 'brickton', x: 640, y: 320, facing: 'up',
    });
    expect(parked.ok).toBe(true);
    expect(data.drivingVehicle).toBeNull();
    expect(data.activeVehicle).toBeNull();
    expect(data.carLocation.title_car_sedan).toBe('usa');
    expect(data.vehicleParking.title_car_sedan).toEqual({
      area: 'brickton', x: 640, y: 320, facing: 'up',
    });
  });
});
