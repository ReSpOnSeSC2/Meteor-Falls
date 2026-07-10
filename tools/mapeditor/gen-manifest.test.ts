import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { manifest as generatedManifest } from './gen-manifest';

interface LegendEntry {
  char: string;
  name: string;
  index: number;
  solid: boolean;
}

interface PropEntry {
  key: string;
  url?: string;
  w?: number;
  h?: number;
  solidDefault?: boolean;
  frames?: number;
  frame?: number;
}

interface EditorManifest {
  atlasCells: number;
  legend: LegendEntry[];
  props: PropEntry[];
  mapSkins: Record<string, Record<string, number>>;
  triggerIds: string[];
  triggerHandlers: string[];
}

interface EditorMaps {
  [id: string]: { def: { grid: string[] } };
}

const here = resolve(process.cwd(), 'tools/mapeditor');
const manifest = JSON.parse(readFileSync(resolve(here, 'manifest.json'), 'utf8')) as EditorManifest;
const maps = JSON.parse(readFileSync(resolve(here, 'maps.json'), 'utf8')) as EditorMaps;
const editorSource = readFileSync(resolve(here, 'index.html'), 'utf8');

describe('map-editor generated render metadata', () => {
  it('renders the valid space grass alias instead of a green fallback block', () => {
    const dot = manifest.legend.find((entry) => entry.char === '.');
    const space = manifest.legend.find((entry) => entry.char === ' ');

    expect(dot).toMatchObject({ name: 'grass_a', solid: false });
    expect(space).toMatchObject({ name: 'grass_a', solid: false, index: dot?.index });
  });

  it('previews Otterbrooke with the same forest-canopy skin used at runtime', () => {
    const bush = manifest.legend.find((entry) => entry.name === 'bush');
    const canopy = manifest.mapSkins.otterbrook?.bush;

    expect(bush).toBeDefined();
    expect(canopy).toBeGreaterThanOrEqual(0);
    expect(canopy).toBeLessThan(manifest.atlasCells);
    expect(canopy).not.toBe(bush?.index);
    expect(editorSource).toContain('M.mapSkins?.[m.id]?.[l?.name]');
  });

  it('gives every shipped editor-map character a real atlas cell', () => {
    const legend = new Map(manifest.legend.map((entry) => [entry.char, entry]));
    const missing: string[] = [];

    for (const [mapId, entry] of Object.entries(maps)) {
      const used = new Set(entry.def.grid.join(''));
      for (const char of used) {
        const tile = legend.get(char);
        if (!tile || tile.index < 0 || tile.index >= manifest.atlasCells) {
          missing.push(`${mapId}:${JSON.stringify(char)}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('crops directional vehicle sheets to the same frame runtime uses', () => {
    for (const key of ['vehicle_clunker', 'kids_bmx', 'ten_speed']) {
      expect(manifest.props.find((prop) => prop.key === key), key).toMatchObject({
        frames: 3,
        frame: 0,
      });
    }
  });

  it('embeds the runtime Links poster as a real procedural PNG prop', () => {
    const poster = generatedManifest.props.find((prop) => prop.key === 'poster_links');

    expect(poster).toMatchObject({
      key: 'poster_links',
      w: 20,
      h: 26,
      solidDefault: false,
    });
    expect(poster?.url).toMatch(/^data:image\/png;base64,/);

    const png = Buffer.from(poster?.url.split(',')[1] ?? '', 'base64');
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.readUInt32BE(16)).toBe(20);
    expect(png.readUInt32BE(20)).toBe(26);
    expect(png.length).toBeGreaterThan(100);
  });

  it('has a runtime handler for every trigger id used by a shipped map', () => {
    const handlers = new Set(generatedManifest.triggerHandlers);
    expect(generatedManifest.triggerIds.filter((id) => !handlers.has(id))).toEqual([]);
  });

  it('defaults new exterior doors to no welcome-mat marker', () => {
    expect(editorSource).toContain("indicator:state.map.interior?'mat':'none'");
  });

  it('shares the runtime character frame, feet anchor, and foot-body contract', () => {
    expect(generatedManifest.charFrame).toMatchObject({
      wTiles: 1.5,
      hTiles: 2,
      feetX: 0.5,
      feetY: 1.375,
      npcFoot: { ox: -0.375, oy: -0.625, w: 0.75, h: 0.625 },
      patrolFoot: { ox: -0.3125, oy: -0.5625, w: 0.625, h: 0.5625 },
    });
    expect(editorSource).toContain('const characterFeet=(x,y)');
    expect(editorSource).toContain('function npcCollisionBox(npc)');
    expect(editorSource).toContain('function patrolRouteCollision(p,grid,m)');
    expect(editorSource).toContain('route:[[cx,cy]]');
    expect(editorSource).not.toContain('route:[[cx+0.5,cy+0.5]]');
  });

  it('offers phase presets including The Hush and filters render plus hit-test paths', () => {
    for (const phase of ['restored', 'hush', 'initial']) {
      expect(editorSource).toContain(`<option value="${phase}">`);
    }
    expect(editorSource).toMatch(/state\.phase\s*===\s*['"]hush['"][\s\S]{0,180}meteor_fell[\s\S]{0,100}zapper_done/);
    expect(editorSource).toContain('function phaseVisible(o)');

    const renderStart = editorSource.indexOf('function render()');
    const renderEnd = editorSource.indexOf('function drawTagRect', renderStart);
    const renderPath = editorSource.slice(renderStart, renderEnd);
    expect(renderStart).toBeGreaterThanOrEqual(0);
    expect(renderEnd).toBeGreaterThan(renderStart);
    for (const use of ['phaseVisible(p)', 'phaseVisible(npc)', 'phaseVisible(sg)', 'phaseVisible(d)', 'phaseVisible(s)']) {
      expect(renderPath, `render path uses ${use}`).toContain(use);
    }

    const hitStart = editorSource.indexOf('function hitTest(');
    const hitEnd = editorSource.indexOf('function selectInMarquee', hitStart);
    const hitPath = editorSource.slice(hitStart, hitEnd);
    expect(hitStart).toBeGreaterThanOrEqual(0);
    expect(hitEnd).toBeGreaterThan(hitStart);
    expect(hitPath.match(/phaseVisible\(/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
  });
});
