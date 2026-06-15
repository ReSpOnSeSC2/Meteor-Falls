import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTHORED_WORLD_FACADE_KEYS, AUTHORED_WORLD_PROP_KEYS } from './authored';
import {
  AREA_SKINS,
  KVISTHAVN_FACADES,
  LILLEBY_FACADES,
  MINIMUS_FACADES,
  ZANZIBEL_FACADES,
} from './buildings';
import { TILESET } from './tiles';

function pngSize(path: string): { w: number; h: number } {
  const data = readFileSync(path);
  return { w: data.readUInt32BE(16), h: data.readUInt32BE(20) };
}

function pngBasenames(dir: string): string[] {
  return readdirSync(resolve(process.cwd(), dir))
    .filter((name) => name.endsWith('.png'))
    .map((name) => name.replace(/\.png$/, ''))
    .sort();
}

describe('authored world asset wiring', () => {
  it('uses the 64px replacement strip for the runtime world tiles', () => {
    const size = pngSize(resolve(process.cwd(), 'assets/art/world/otterbrook_tiles_16.png'));
    expect(size).toEqual({ w: TILESET.length * 64, h: 64 });
  });

  it('registers every committed facade PNG with the authored bridge', () => {
    const registered = new Set(AUTHORED_WORLD_FACADE_KEYS);
    for (const key of pngBasenames('assets/art/world/facades')) {
      expect(registered.has(key), `facade '${key}' is on disk but never preloaded/applied`).toBe(true);
    }
  });

  it('registers every committed prop PNG with the authored bridge', () => {
    const registered = new Set<string>(AUTHORED_WORLD_PROP_KEYS);
    for (const key of pngBasenames('assets/art/world/props')) {
      expect(registered.has(key), `prop '${key}' is on disk but never preloaded/applied`).toBe(true);
    }
  });

  it('selects the authored regional facade sets in future-region rosters', () => {
    expect(AREA_SKINS.kvisthavn).toEqual(KVISTHAVN_FACADES);
    expect(AREA_SKINS.minimus).toEqual(MINIMUS_FACADES);
    expect(AREA_SKINS.zanzibel).toEqual(ZANZIBEL_FACADES);
    expect(AREA_SKINS.lilleby).toEqual([...LILLEBY_FACADES, 'bldg_tower_arms']);
  });
});
