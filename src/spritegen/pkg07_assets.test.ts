import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pkg07ChapterTravelIds, PKG07_TRAVEL_VEHICLE_IDS, pkg07VehicleArtIds } from '../data/pkg07';
import { WEAPON_ART } from './weapons';

function png(path: string): boolean {
  return existsSync(path) && statSync(path).size > 64;
}

describe('PKG-07 exported vehicle and weapon assets', () => {
  it('exports a vehicle PNG for every dealership, fleet, and travel id', () => {
    for (const id of pkg07VehicleArtIds()) {
      const path = resolve(process.cwd(), 'assets/art/vehicles', `${id}.png`);
      expect(png(path), `missing vehicle asset ${path}`).toBe(true);
    }
  });

  it('represents every chapter travel key in the package id list', () => {
    const packageIds = new Set(PKG07_TRAVEL_VEHICLE_IDS);
    for (const id of pkg07ChapterTravelIds()) {
      expect(packageIds.has(id), `chapter travel '${id}' is not in PKG07_TRAVEL_VEHICLE_IDS`).toBe(true);
    }
  });

  it('exports a weapon/charm PNG for the full WEAPON_ART catalog', () => {
    for (const id of Object.keys(WEAPON_ART)) {
      const path = resolve(process.cwd(), 'assets/art/weapons', `${id}.png`);
      expect(png(path), `missing weapon asset ${path}`).toBe(true);
    }
  });
});
