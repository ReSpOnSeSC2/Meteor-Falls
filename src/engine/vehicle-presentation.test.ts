import { describe, expect, it } from 'vitest';
import {
  STATIC_CLUNKER_DISPLAY_SIZE,
  STATIC_CLUNKER_SOLID,
  vehicleHeadFrame,
  vehicleOccupantPose,
  vehicleRiderFrame,
} from './vehicle-presentation';

describe('vehicle presentation', () => {
  it('keeps the parked clunker human-sized with a lower-body collision box', () => {
    expect(STATIC_CLUNKER_DISPLAY_SIZE).toEqual({ w: 64, h: 35 });
    expect(STATIC_CLUNKER_SOLID).toEqual({ ox: 16, oy: 9, w: 32, h: 24 });
    expect(STATIC_CLUNKER_SOLID.w).toBeGreaterThan(24);
  });

  it('provides a distinct bent-leg cycle and head frame for every facing', () => {
    const facings = ['down', 'left', 'right', 'up', 'downright', 'downleft', 'upright', 'upleft'] as const;
    expect(facings.map(vehicleHeadFrame)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(facings.map((facing) => vehicleRiderFrame(facing, 0))).toEqual([16, 18, 20, 22, 36, 38, 40, 42]);
    expect(facings.map((facing) => vehicleRiderFrame(facing, 1))).toEqual([17, 19, 21, 23, 37, 39, 41, 43]);
  });

  it('shows full riders on open vehicles and cabin occupants on enclosed ones', () => {
    expect(vehicleOccupantPose('bike', 'right', 0, 1, 72, 64)).toMatchObject({
      mode: 'rider', visible: true, scale: 0.9,
    });
    expect(vehicleOccupantPose('moto', 'left', 1, 2, 96, 72)).toMatchObject({
      mode: 'rider', visible: true, scale: 0.78,
    });
    expect(vehicleOccupantPose('car', 'right', 3, 4, 252, 140).visible).toBe(true);
    expect(vehicleOccupantPose('car', 'down', 2, 4, 252, 140).visible).toBe(false);
  });
});
