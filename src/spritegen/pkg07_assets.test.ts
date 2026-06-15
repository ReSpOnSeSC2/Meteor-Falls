import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pkg07ChapterTravelIds, PKG07_TRAVEL_VEHICLE_IDS, pkg07VehicleArtIds } from '../data/pkg07';
import { WEAPON_ART } from './weapons';

function png(path: string): boolean {
  return existsSync(path) && statSync(path).size > 64;
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function pngSize(path: string): { w: number; h: number } {
  const data = readFileSync(path);
  return { w: data.readUInt32BE(16), h: data.readUInt32BE(20) };
}

function duplicatePngNames(dir: string): string[] {
  const byHash = new Map<string, string[]>();
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.png')).sort()) {
    const path = resolve(dir, file);
    const hash = sha256(path);
    const names = byHash.get(hash) ?? [];
    names.push(file);
    byHash.set(hash, names);
  }

  return [...byHash.values()]
    .filter((names) => names.length > 1)
    .map((names) => names.join(', '));
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

  it('keeps exported vehicle art unique and valid', () => {
    const dir = resolve(process.cwd(), 'assets/art/vehicles');
    expect(duplicatePngNames(dir)).toEqual([]);

    for (const file of readdirSync(dir).filter((name) => name.endsWith('.png'))) {
      const { w, h } = pngSize(resolve(dir, file));
      expect(w, `${file} width should stay on a 4px grid`).toBeGreaterThan(0);
      expect(h, `${file} height should stay on a 4px grid`).toBeGreaterThan(0);
      expect(w % 4, `${file} width should stay on a 4px grid`).toBe(0);
    }
  });

  it('exports a weapon/charm PNG for the full WEAPON_ART catalog', () => {
    for (const id of Object.keys(WEAPON_ART)) {
      const path = resolve(process.cwd(), 'assets/art/weapons', `${id}.png`);
      expect(png(path), `missing weapon asset ${path}`).toBe(true);
    }
  });

  it('keeps exported weapon art unique and valid', () => {
    const dir = resolve(process.cwd(), 'assets/art/weapons');
    expect(duplicatePngNames(dir)).toEqual([]);

    for (const file of readdirSync(dir).filter((name) => name.endsWith('.png'))) {
      const { w, h } = pngSize(resolve(dir, file));
      expect(w, `${file} width should be positive`).toBeGreaterThan(0);
      expect(h, `${file} height should be positive`).toBeGreaterThan(0);
    }
  });
});
