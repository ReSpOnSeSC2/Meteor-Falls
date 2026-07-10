import { describe, expect, it } from 'vitest';
import {
  BMX_SPEED_MULTIPLIER,
  TWOTON_BMX_TITLE,
  bicycleContinent,
  ridingBmx,
  toggleBmx,
} from './bicycle';
import { MAPS } from '../data/maps';

const owned = [TWOTON_BMX_TITLE];
const inUsa = { [TWOTON_BMX_TITLE]: 'usa' };

describe('the Twoton BMX uses the save-backed garage contract', () => {
  it('maps Twoton and Otterbrook to the bicycle home continent', () => {
    expect(bicycleContinent('brickton')).toBe('usa');
    expect(bicycleContinent('otterbrook')).toBe('usa');
    expect(bicycleContinent('puerto_sol')).toBe('south_america');
  });

  it('keeps the connected Long Walk and docks on the BMX home continent', () => {
    for (const id of ['meadow_mile', 'meadow_woods', 'meadow_far', 'meadow_overpass', 'brickton_docks']) {
      expect(MAPS[id].area, `${id} area`).toBeDefined();
      expect(bicycleContinent(MAPS[id].area), `${id} continent`).toBe('usa');
    }
  });

  it('rides only when title, active selection, location, and outdoor map agree', () => {
    expect(ridingBmx(TWOTON_BMX_TITLE, owned, inUsa, 'brickton', false)).toBe(true);
    expect(ridingBmx(TWOTON_BMX_TITLE, [], inUsa, 'brickton', false)).toBe(false);
    expect(ridingBmx(TWOTON_BMX_TITLE, owned, inUsa, 'brickton', true)).toBe(false);
    expect(ridingBmx(TWOTON_BMX_TITLE, owned, inUsa, 'puerto_sol', false)).toBe(false);
    expect(BMX_SPEED_MULTIPLIER).toBeGreaterThan(1);
  });

  it('toggles ride/park without overwriting another active vehicle', () => {
    expect(toggleBmx(null, owned, inUsa, 'brickton', false)).toEqual({
      activeVehicle: TWOTON_BMX_TITLE,
      reason: 'riding',
    });
    expect(toggleBmx(TWOTON_BMX_TITLE, owned, inUsa, 'brickton', false)).toEqual({
      activeVehicle: null,
      reason: 'parked',
    });
    expect(toggleBmx('title_car_sedan', owned, inUsa, 'brickton', false)).toEqual({
      activeVehicle: 'title_car_sedan',
      reason: 'other_active',
    });
  });
});
