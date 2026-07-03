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
import { components, mapQualityFlags, levelJoinFor, elevationLawViolations } from './mapcheck';
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
  // S15i (ADR-050) fixed facadeSolid (oy:26→10, h:H-38→H-22 — the walk-through
  // bug) to match Brickton core, so every FACADE-bearing draft's solid bytes
  // shifted and re-pins here: zanzibel + foggybottom + lilleby (cities) and
  // brickmore_heights (a facade-laden district). The faceless route/interior
  // drafts (grand_market_int, meadow_mile, bootstep_moor, lucille) and all
  // eight dungeons place no city facades, so they stayed byte-identical.
  zanzibel: '60e9e88e',
  brickmore_heights: 'c25ff676',
  foggybottom: 'edeb30f9',
  lilleby: '3de72061',
  grand_market_int: 'fd4ef0b7',
  meadow_mile: 'fa7ffd37',
  bootstep_moor: '853e27b2',
  lucille: '80200b19',
  // Movement Two — the eight dungeon sites (the dungeon test pins ≥3 seeds each)
  wintermoor_academy: '600554a0',
  sleepers_spine: '7f0641af',
  the_hedgerow: 'dedb40c4',
  laughing_ruins: 'b4538cb0',
  night_train: '502a7283',
  spore_forest: 'cb637efb',
  castle_hoaxula: '711e297c',
  sea_of_silence: '36e4fc55',
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

describe('WORLD-OVERHAUL P3 — levelJoinFor gates cross-level reachability (the elevation seam)', () => {
  const open = (): boolean => false; // nothing solid — the join alone separates levels
  // A synthetic 4x4 with a BARE cross-level seam (rows 0-1 level 1 over rows 2-3
  // level 0, ALL walkable, NO 'K' wall between them). This is the case elev_spike
  // deliberately cannot exercise (its stair is a real walkable GAP in the K face,
  // so there levelJoinFor === FLAT_JOIN): here only levelJoinFor's level logic can
  // keep the terraces apart, so this is the guard that a revert to FLAT_JOIN fails.
  const grid = ['....', '....', '....', '....'];
  const bareSeam = { grid, elevation: { level: ['1111', '1111', '0000', '0000'] } };

  it('a BARE level seam splits into two components under levelJoinFor (but ONE under a flat join)', () => {
    const split = components(grid, open, levelJoinFor(bareSeam));
    expect(split.comp[0][0]).not.toBe(split.comp[3][0]); // upper (L1) ≠ lower (L0): the seam holds
    // the exact P3 revert — level-blind join — would flood all 16 cells as one world
    const flat = components(grid, open); // default FLAT_JOIN
    expect(flat.comp[0][0]).toBe(flat.comp[3][0]);
    expect(flat.mainId).toBeGreaterThanOrEqual(0);
  });

  it('a single-cell stair bridges the seam (the OR-either-endpoint exemption is load-bearing)', () => {
    // put one 'T' at col 0 spanning the seam: (0,1) stays L1, (0,2) drops to L0.
    // A lower-ground cell steps ONTO the stairhead — the runtime always allows that,
    // so the reachability join must too (why the exemption is OR, not target-only).
    const withStair = {
      grid: ['....', 'T...', 'T...', '....'],
      elevation: { level: ['1111', '1111', '0000', '0000'] },
    };
    const joined = components(withStair.grid, open, levelJoinFor(withStair));
    expect(joined.comp[0][0]).toBe(joined.comp[3][0]); // terrace ↔ ground, bridged by the stair column
    // and with the stair sealed back to plain ground the seam re-separates
    const sealed = { grid: ['....', '....', '....', '....'], elevation: withStair.elevation };
    const resplit = components(sealed.grid, open, levelJoinFor(sealed));
    expect(resplit.comp[0][0]).not.toBe(resplit.comp[3][0]);
  });

  it('a flat map (no elevation) yields FLAT_JOIN — reachability is byte-identical', () => {
    // the opt-in guarantee at the predicate level: no elevation ⇒ the SAME function
    // the ~201 shipped maps already flood through.
    const flatMap = { grid: ['....', '....'] };
    const join = levelJoinFor(flatMap);
    expect(join(0, 0, 0, 1)).toBe(true);
    expect(join(9, 9, 9, 8)).toBe(true); // always joins, position-independent
  });
});

describe('WORLD-OVERHAUL P3 hardening — elevationLawViolations (the global no-invisible-ledge law)', () => {
  const solid = (ch: string): boolean => ch === 'K'; // the cliff face is the only wall

  it('a flat map (no elevation) is byte-identical: zero violations, no allocation path', () => {
    // the opt-in default-flat contract at the function level — this is why the
    // content-validate gate emits nothing on the ~201 shipped flat maps.
    expect(elevationLawViolations({ grid: ['....', '....', '....'] }, solid)).toEqual([]);
  });

  it('a legal two-terrace map (K wall + a single stair, 1-level steps) passes', () => {
    // upper terrace (lvl 1) over ground (lvl 0), separated by a solid 'K' wall and
    // joined ONLY by the centre 'T' stair, which steps down exactly one level.
    const legal = {
      grid: ['.T.', 'KTK', '.T.'],
      elevation: { level: ['111', '010', '000'] },
    };
    expect(elevationLawViolations(legal, solid)).toEqual([]);
  });

  it('a solid K face may wall two levels with NO stair — the block is VISIBLE, so it is legal', () => {
    // the defining exemption: where a 'K' cliff separates the terraces, no stair is
    // required (you cannot walk onto K, so there is no invisible ledge to cross).
    const walled = { grid: ['.', 'K', '.'], elevation: { level: ['1', '1', '0'] } };
    expect(elevationLawViolations(walled, solid)).toEqual([]);
  });

  it('a BARE cross-level seam (two walkable levels, no stair, no wall) is an invisible ledge', () => {
    // the exact bug the law exists to catch: the ground LOOKS continuous but the P3
    // runtime rule silently walls it. elev_spike alone cannot exercise this (its
    // stair is a walkable GAP in a K face), so this synthetic grid is the guard.
    const bare = { grid: ['...', '...'], elevation: { level: ['111', '000'] } };
    const v = elevationLawViolations(bare, solid);
    expect(v.length).toBeGreaterThan(0);
    expect(v.some((s) => s.includes('invisible ledge'))).toBe(true);
  });

  it('a stair that steps two levels at once is a >1-level jump', () => {
    // a 1-wide stair column dropping lvl 2 → lvl 0 in a single tile: both cells are
    // 'T' (so it is NOT an invisible ledge) but the magnitude is illegal.
    const leap = { grid: ['T', 'T'], elevation: { level: ['2', '0'] } };
    const v = elevationLawViolations(leap, solid);
    expect(v.some((s) => s.includes('>1-level jump'))).toBe(true);
  });

  it('a malformed plane (short by a row / short by a column) is reported, never silently read as ground', () => {
    // ElevationSchema only checks non-empty rows; levelJoinFor/buildLevelGrid read a
    // missing cell as ground 0, so a truncated plane would erase a terrace. The law
    // is the machine-check for that (elevation.test.ts only guards the allowlist).
    const shortRows = { grid: ['..', '..'], elevation: { level: ['11'] } };
    expect(elevationLawViolations(shortRows, solid).some((s) => s.includes('rows'))).toBe(true);
    const shortCols = { grid: ['...', '...'], elevation: { level: ['11', '111'] } };
    expect(elevationLawViolations(shortCols, solid).some((s) => s.includes('cols'))).toBe(true);
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
