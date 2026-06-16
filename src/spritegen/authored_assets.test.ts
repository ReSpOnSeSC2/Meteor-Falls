import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../../tools/imageio';
import {
  AUTHORED_NPC_CHARACTER_IDS,
  AUTHORED_WORLD_FACADE_KEYS,
  AUTHORED_WORLD_PROP_KEYS,
  NPC_CHARACTER_ART,
} from './authored';
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

const HERO_ASSETS = [
  { id: 'rex', art: 'jay' },
  { id: 'faye', art: 'mia' },
  { id: 'milo', art: 'milo' },
  { id: 'pippa', art: 'pippa' },
  { id: 'dorin', art: 'dorin' },
] as const;

const HERO_IDS = new Set(HERO_ASSETS.map((hero) => hero.id));

function listedNpcIds(): string[] {
  return readFileSync(resolve(process.cwd(), 'docs/asset-lists/characters_8dir.txt'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !HERO_IDS.has(line));
}

function frameAlphaCount(path: string, frame: number, cellW: number, cellH: number, cols: number): number {
  const img = decodePng(readFileSync(path));
  const ox = (frame % cols) * cellW;
  const oy = Math.floor(frame / cols) * cellH;
  let count = 0;
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      if (img.data[((oy + y) * img.w + (ox + x)) * 4 + 3] >= 24) count++;
    }
  }
  return count;
}

describe('authored hero asset wiring', () => {
  it('has every required authored hero image on disk', () => {
    for (const hero of HERO_ASSETS) {
      expect(pngSize(resolve(process.cwd(), `assets/art/characters/${hero.art}_anim_46_4x.png`)), hero.id)
        .toEqual({ w: 384, h: 1536 });
      expect(pngSize(resolve(process.cwd(), `assets/art/busts/${hero.art}_bust_18_32x32.png`)), hero.id)
        .toEqual({ w: 128, h: 160 });
      expect(pngSize(resolve(process.cwd(), `assets/art/busts/${hero.art}_bust_32.png`)), hero.id)
        .toEqual({ w: 32, h: 32 });
      expect(pngSize(resolve(process.cwd(), `assets/art/battlers/${hero.art}_battler_14_28x36.png`)), hero.id)
        .toEqual({ w: 896, h: 1152 });
    }
  });

  it('keeps every used overworld hero frame populated at full resolution', () => {
    for (const hero of HERO_ASSETS) {
      const path = resolve(process.cwd(), `assets/art/characters/${hero.art}_anim_46_4x.png`);
      for (let frame = 0; frame < 46; frame++) {
        expect(frameAlphaCount(path, frame, 96, 128, 4), `${hero.id} overworld frame ${frame}`)
          .toBeGreaterThan(1500);
      }
    }
  });

  it('keeps every used battler frame populated', () => {
    for (const hero of HERO_ASSETS) {
      const path = resolve(process.cwd(), `assets/art/battlers/${hero.art}_battler_14_28x36.png`);
      for (let frame = 0; frame < 14; frame++) {
        expect(frameAlphaCount(path, frame, 224, 288, 4), `${hero.id} battler frame ${frame}`)
          .toBeGreaterThan(8000);
      }
    }
  });
});

describe('authored NPC asset wiring', () => {
  it('matches the PKG-09 character list and loads 96x128-frame sheets', () => {
    const npcIds = listedNpcIds();
    expect(npcIds).toHaveLength(42);
    expect(AUTHORED_NPC_CHARACTER_IDS).toEqual(npcIds);

    const artById = new Map(NPC_CHARACTER_ART.map((art) => [art.id, art]));
    for (const id of npcIds) {
      const art = artById.get(id);
      expect(art?.url, id).toContain(`${id}_8dir_96x128.png`);
      expect(pngSize(resolve(process.cwd(), `assets/art/characters/${id}_8dir_96x128.png`)), id)
        .toEqual({ w: 384, h: 1536 });
    }
  });
});

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
