import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../../tools/imageio';
import {
  AUTHORED_NPC_CHARACTER_IDS,
  AUTHORED_ENEMY_BATTLE_ART_KEYS,
  AUTHORED_ENEMY_OVERWORLD_ART_IDS,
  AUTHORED_ENEMY_OVERWORLD_ART_KEYS,
  AUTHORED_VEHICLE_ART_KEYS,
  AUTHORED_WORLD_FACADE_KEYS,
  AUTHORED_WORLD_PROP_DISPLAY_SIZE,
  AUTHORED_WORLD_PROP_KEYS,
  NPC_CHARACTER_ART,
  OTTERBROOK_NPC_CHARACTER_IDS,
} from './authored';
import {
  AREA_SKINS,
  AURORA_FACADES,
  KVISTHAVN_FACADES,
  LILLEBY_FACADES,
  LOTUS_HARBOR_FACADES,
  MARS_FACADES,
  MAUNA_LANI_FACADES,
  MINIMUS_FACADES,
  VALEA_FACADES,
  ZANZIBEL_FACADES,
} from './buildings';
import { TILESET, TILE_ATLAS_COLS } from './tiles';
import { ENEMY_OVERWORLD_SHEET_IDS } from '../data/visuals';
import { ENEMY_BATTLE_ART, FORM_ART } from './enemies';

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

const HERO_IDS: ReadonlySet<string> = new Set(HERO_ASSETS.map((hero) => hero.id));

function listedNpcIds(): string[] {
  return readFileSync(resolve(process.cwd(), 'docs/asset-lists/characters_8dir.txt'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !HERO_IDS.has(line));
}

function listedOtterbrookNpcIds(): string[] {
  return readFileSync(resolve(process.cwd(), 'docs/asset-lists/otterbrook_npcs_46.txt'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
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
      // The battle bust is now a single high-res portrait (ADR-110 follow-up);
      // makeBustCanvas tiles it into the 18 BUST_FRAME pose cells at boot.
      expect(pngSize(resolve(process.cwd(), `assets/art/busts/${hero.art}-battle-bust-transparent.png`)), hero.id)
        .toEqual({ w: 1254, h: 1254 });
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
          .toBeGreaterThan(5000);
      }
    }
  });
});

describe('authored NPC asset wiring', () => {
  it('matches the PKG-09 character list and loads 96x128-frame sheets', () => {
    const npcIds = listedNpcIds();
    expect(npcIds).toHaveLength(92);
    expect(AUTHORED_NPC_CHARACTER_IDS).toEqual(npcIds);

    const artById = new Map<string, (typeof NPC_CHARACTER_ART)[number]>(NPC_CHARACTER_ART.map((art) => [art.id, art]));
    for (const id of npcIds) {
      const art = artById.get(id);
      const file = `${id}_anim_46_4x.png`;
      expect(art?.url, id).toContain(file);
      expect(pngSize(resolve(process.cwd(), `assets/art/characters/${file}`)), id)
        .toEqual({ w: 384, h: 1536 });
    }
  });

  it('keeps every authored NPC frame populated', () => {
    for (const id of AUTHORED_NPC_CHARACTER_IDS) {
      const path = resolve(process.cwd(), `assets/art/characters/${id}_anim_46_4x.png`);
      const minAlpha = id === 'glint' ? 40 : 1500;
      for (let frame = 0; frame < 46; frame++) {
        expect(frameAlphaCount(path, frame, 96, 128, 4), `${id} overworld frame ${frame}`)
          .toBeGreaterThan(minAlpha);
      }
    }
  });

  it('keeps the mart clerk apron above a readable trouser-and-shoe silhouette', () => {
    const path = resolve(process.cwd(), 'assets/art/characters/martClerk_anim_46_4x.png');
    const img = decodePng(readFileSync(path));
    for (let frame = 0; frame < 46; frame++) {
      const ox = (frame % 4) * 96;
      const oy = Math.floor(frame / 4) * 128;
      let navyTrouserPixels = 0;
      let darkShoePixels = 0;
      for (let y = 109; y < 125; y++) {
        for (let x = 12; x < 85; x++) {
          const i = ((oy + y) * img.w + ox + x) * 4;
          const [r, g, b, a] = img.data.subarray(i, i + 4);
          if (a > 16 && b > g * 1.2 && g > r * 1.3 && b < 170) navyTrouserPixels++;
          if (y >= 116 && a > 16 && Math.max(r, g, b) < 100) darkShoePixels++;
        }
      }
      expect(navyTrouserPixels, `martClerk frame ${frame} trousers`).toBeGreaterThan(150);
      expect(darkShoePixels, `martClerk frame ${frame} shoes`).toBeGreaterThan(200);
    }
  });

  it('pins the live Otterbrook replacement roster, including Chad and Glint', () => {
    expect(OTTERBROOK_NPC_CHARACTER_IDS).toEqual(listedOtterbrookNpcIds());
    expect(OTTERBROOK_NPC_CHARACTER_IDS).toContain('chad');
    expect(OTTERBROOK_NPC_CHARACTER_IDS).toContain('glint');
  });
});

describe('authored world asset wiring', () => {
  it('uses the 64px replacement strip for the runtime world tiles', () => {
    const size = pngSize(resolve(process.cwd(), 'assets/art/world/otterbrook_tiles_16.png'));
    expect(size).toEqual({ w: TILESET.length * 64, h: 64 });
  });

  it('keeps the runtime tiles texture inside the 8192px GPU MAX_TEXTURE_SIZE floor', () => {
    // The disk strip is one row, but the runtime upload is reflowed to a
    // TILE_ATLAS_COLS grid — a single row would be TILESET.length·64px wide
    // and render the ground layer black on 8192-limit GPUs (SwiftShader,
    // many Android devices). Guard both grid axes.
    expect(TILE_ATLAS_COLS * 64).toBeLessThanOrEqual(8192);
    expect(Math.ceil(TILESET.length / TILE_ATLAS_COLS) * 64).toBeLessThanOrEqual(8192);
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

  it('pins the WELCOME mat to its runtime footprint instead of editor fallback sizing', () => {
    const display = AUTHORED_WORLD_PROP_DISPLAY_SIZE as Record<string, { w: number; h: number }>;
    expect(display.doormat).toEqual({ w: 18, h: 10 });
    expect(display.vehicle_clunker).toEqual({ w: 38, h: 16 });
  });

  it('registers every committed vehicle PNG with the authored bridge', () => {
    const registered = new Set<string>(AUTHORED_VEHICLE_ART_KEYS);
    for (const key of pngBasenames('assets/art/vehicles')) {
      expect(registered.has(key), `vehicle '${key}' is on disk but never preloaded/applied`).toBe(true);
    }
  });

  it('selects the authored regional facade sets in future-region rosters', () => {
    expect(AREA_SKINS.kvisthavn).toEqual(KVISTHAVN_FACADES);
    expect(AREA_SKINS.minimus).toEqual(MINIMUS_FACADES);
    expect(AREA_SKINS.zanzibel).toEqual(ZANZIBEL_FACADES);
    expect(AREA_SKINS.lotus_harbor).toEqual(LOTUS_HARBOR_FACADES);
    expect(AREA_SKINS.valea).toEqual(VALEA_FACADES);
    expect(AREA_SKINS.aurora).toEqual(AURORA_FACADES);
    expect(AREA_SKINS.mauna_lani).toEqual(MAUNA_LANI_FACADES);
    expect(AREA_SKINS.mars).toEqual([...MARS_FACADES, 'bldg_colossus_needle']);
    expect(AREA_SKINS.lilleby).toEqual([...LILLEBY_FACADES, 'bldg_tower_arms']);
  });
});

describe('authored enemy identity wiring', () => {
  it('exports every current canon enemy/form battle key', () => {
    const registered = new Set<string>(AUTHORED_ENEMY_BATTLE_ART_KEYS);
    const current = new Set<string>([
      ...Object.values(ENEMY_BATTLE_ART).map((art) => art.sprite),
      ...Object.values(FORM_ART).map((art) => art.sprite),
    ]);
    for (const key of current) {
      expect(registered.has(key), `current enemy battle '${key}' is not preloaded/applied`).toBe(true);
    }
  });

  it('keeps the authored overworld enemy sheet list in one order', () => {
    expect(AUTHORED_ENEMY_OVERWORLD_ART_IDS).toEqual([...ENEMY_OVERWORLD_SHEET_IDS]);
    expect(AUTHORED_ENEMY_OVERWORLD_ART_KEYS).toEqual(ENEMY_OVERWORLD_SHEET_IDS.map((id) => `ow_enemy_${id}`));
  });

  it('loads authored overworld enemy sheets at the 8-frame runtime contract', () => {
    for (const id of ENEMY_OVERWORLD_SHEET_IDS) {
      expect(pngSize(resolve(process.cwd(), `assets/art/enemies/overworld/${id}_8dir.png`)), id)
        .toEqual({ w: 768, h: 128 });
    }
  });
});
