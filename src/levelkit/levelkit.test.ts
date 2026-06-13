/**
 * THE LEVELKIT — the determinism + ADR-012 proofs (S15g, Prime Laws 1–3).
 *
 *  - every generator is (recipe + seed) → IDENTICAL BYTES (hash-pinned: a
 *    refactor that shifts one byte fails here, naming the generator);
 *  - generated cities pass the SAME ADR-012 sweep maps.test.ts runs on the
 *    shipped cities — BY CONSTRUCTION, on fresh seeds, with no exemptions;
 *  - drafts SCHEMA-PARSE, yet a role-tagged slot can never masquerade as
 *    canon (MapDefSchema refuses it);
 *  - §A4.5 rest-before-pressure holds by construction;
 *  - no Date.now()/Math.random() anywhere under src/levelkit/** (Prime Law 2).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { MapDefSchema, DraftMapDefSchema } from '../schemas';
import type { CityRecipe, MapDef } from '../schemas';
import { SAMPLE_RECIPES } from './samples';
import { generate, buildCity, cityViolations } from './index';
import { components, mapQualityFlags } from './mapcheck';
import { CHAR_LEGEND } from '../data/maps';
import { TILESET } from '../spritegen/tiles';

/** FNV-1a over the canonical JSON — the same byte-identity the ship freezes */
function fnv(obj: unknown): string {
  const s = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** one pinned output hash per generator — the ship-freeze proof */
const HASH_PINS: Record<string, string> = {
  zanzibel: 'c710e18d',
  brickmore_heights: 'e445325a',
  foggybottom: '81237782',
  lilleby: '876ba569',
  grand_market_int: 'fd4ef0b7',
  meadow_mile: 'fa7ffd37',
  bootstep_moor: '3ddedc6c',
  lucille: '80200b19',
};

describe('S15g — the levelkit is deterministic (Prime Law 2)', () => {
  for (const [name, recipe] of Object.entries(SAMPLE_RECIPES)) {
    it(`${name}: recipe + seed → identical bytes, twice`, () => {
      expect(JSON.stringify(generate(recipe))).toBe(JSON.stringify(generate(recipe)));
    });
    it(`${name}: output hash is pinned (refactor drift fails here)`, () => {
      expect(fnv(generate(recipe))).toBe(HASH_PINS[name]);
    });
    it(`${name}: the draft schema-parses (drafts are valid shapes)`, () => {
      const r = DraftMapDefSchema.safeParse(generate(recipe));
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true);
    });
  }
});

describe('S15g — generated cities pass ADR-012 BY CONSTRUCTION (Prime Law 3)', () => {
  const base = SAMPLE_RECIPES.zanzibel as CityRecipe;
  for (const seed of [4104, 1, 2, 99, 7777, 123456, 31337]) {
    it(`seed ${seed}: clears the city sweep with no exemptions`, () => {
      expect(cityViolations(buildCity({ ...base, id: `city_${seed}`, seed }))).toEqual([]);
    });
  }
  it('a one-street strip would still be rejected (negative control)', () => {
    const strip = buildCity({ ...base, id: 'strip', size: [50, 30] });
    strip.grid = ['='.repeat(50), 'R'.repeat(50), 'R'.repeat(50), '='.repeat(50)];
    strip.props = [];
    expect(cityViolations(strip).length).toBeGreaterThanOrEqual(3);
  });
});

describe('S15g — drafts cannot masquerade as canon (Prime Law 1)', () => {
  it('a role-tagged city draft is REFUSED by the canon MapDefSchema', () => {
    const city = generate(SAMPLE_RECIPES.zanzibel);
    expect(city.npcs.some((n) => 'role' in n)).toBe(true);
    expect(MapDefSchema.safeParse(city).success).toBe(false);
  });
  it('the same draft is ACCEPTED by DraftMapDefSchema', () => {
    expect(DraftMapDefSchema.safeParse(generate(SAMPLE_RECIPES.zanzibel)).success).toBe(true);
  });
});

describe('S15g — §A4.5 rest-before-pressure holds by construction', () => {
  it('a generated city seats a rest point south of (closer to the entrance than) its spawner', () => {
    const city = buildCity(SAMPLE_RECIPES.zanzibel as CityRecipe);
    const restY = Math.min(
      ...city.props.filter((p) => p.sprite === 'picnic' || p.sprite === 'payphone').map((p) => p.y),
    );
    const spawnerY = Math.max(...city.spawners.map((s) => s.rect.y + s.rect.h));
    // the entrance is the south edge — a larger y is closer to it
    expect(restY).toBeGreaterThan(spawnerY);
  });
});

describe('S15g — the map-quality library catches orphans (Prime Law 4)', () => {
  const wall = (ch: string): boolean => ch === '#';
  const mk = (grid: string[], npcX: number, npcY: number): MapDef => ({
    id: 't', name: 'T', music: null, grid,
    props: [], npcs: [{ id: 'n', sprite: 'oldTimer', x: npcX, y: npcY, facing: 'down', dialogue: 'x' }],
    signs: [], phones: [], doors: [], spawners: [], triggers: [],
  });
  it('components separates a walled grid into two', () => {
    const { comp, mainId } = components(['.#.', '.#.', '.#.'], wall);
    expect(comp[0][0]).not.toBe(comp[0][2]); // the wall column splits them
    expect(mainId).toBeGreaterThanOrEqual(0);
  });
  it('an npc walled off from the main world is flagged orphaned', () => {
    // left strip (cols 0) is larger → main; an npc in the right strip is orphaned
    const grid = ['..#.', '..#.', '..#.', '..#.'];
    expect(mapQualityFlags(mk(grid, 3, 1), wall, {}).some((f) => /orphaned/.test(f))).toBe(true);
    expect(mapQualityFlags(mk(grid, 0, 1), wall, {})).toEqual([]); // same map, npc on the main side
  });
  it('a door landing on a solid target tile is flagged', () => {
    const target: MapDef = { id: 'b', name: 'B', music: null, grid: ['##', '##'], props: [], npcs: [], signs: [], phones: [], doors: [], spawners: [], triggers: [] };
    const src: MapDef = { id: 'a', name: 'A', music: null, grid: ['..', '..'], props: [], npcs: [], signs: [], phones: [], doors: [{ x: 0, y: 0, w: 1, h: 1, to: 'b', tx: 0, ty: 0, facing: 'up' }], spawners: [], triggers: [] };
    expect(mapQualityFlags(src, wall, { a: src, b: target }).some((f) => /lands on a solid/.test(f))).toBe(true);
  });

  it('generated city + route content is all reachable (the kit builds nothing orphaned)', () => {
    const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
    const isSolid = (ch: string): boolean =>
      ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;
    const city = generate(SAMPLE_RECIPES.zanzibel) as unknown as MapDef;
    const route = generate(SAMPLE_RECIPES.meadow_mile) as unknown as MapDef;
    expect(mapQualityFlags(city, isSolid, {})).toEqual([]);
    expect(mapQualityFlags(route, isSolid, {})).toEqual([]);
  });
});

describe('S15g — no Date.now()/Math.random() under src/levelkit (Prime Law 2)', () => {
  it('every levelkit source re-derives, never rolls', () => {
    const offenders: string[] = [];
    for (const f of readdirSync('src/levelkit')) {
      if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue;
      // scan CODE, not prose — strip block + line comments first (the laws
      // are written out in the headers; only real calls are a violation)
      const code = readFileSync(`src/levelkit/${f}`, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      if (/Math\.random|Date\.now|new Date\(/.test(code)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
