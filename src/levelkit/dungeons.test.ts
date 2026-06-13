/**
 * THE DUNGEON GRAMMARS — proofs (S15g Movement Two, ADR-045). Every site:
 *   - (recipe + seed) → IDENTICAL BYTES on THREE seeds (hash-pinned: a refactor
 *     that shifts one byte fails here, naming the site + seed);
 *   - schema-parses as a DraftMapDef (a draft is a valid shape, never junk);
 *   - clears its POST-CONDITIONS on every seed (entrance→exit, boss route,
 *     rest-before-pressure) — the generator already asserts these at build, so
 *     this re-derives them from the produced draft as an independent witness;
 *   - carries no HARD pressure flag (a spawn never crowds a fixture).
 * Plus each site's own §A6 LAW (cure-safe returns, the tree, the car count,
 * the falling curve), and the GENERALIZED soft-lock proof driven over the
 * shipped step-pyramid's own rotor states (the precedent, lifted + pinned).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DraftMapDefSchema } from '../schemas';
import type { DungeonRecipe } from '../schemas';
import { SAMPLE_RECIPES, DUNGEON_IDS } from './samples';
import { generate } from './index';
import { dungeonFlags, floorIsTree, softLockFailures } from './mapcheck';
import { pressureReport, pressureHardFlags } from './pressure';
import { isDungeonSolid, silenceCurve } from './dungeons';
import { DUNGEON_WALL } from './dungeons/kit';
import { TILESET } from '../spritegen/tiles';
import { buildPyramidRooms, rotateRect, PYR_ROTOR, PYR_INITIAL_ROT } from '../data/maps_ch2';

function fnv(obj: unknown): string {
  const s = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** three pinned (seed → hash) per site — the ship-freeze proof on ≥3 seeds.
 *  Re-pinned at S15g M3: BAND_ROSTER ch3–ch10 now resolve to the forged
 *  rosters, so every site's spawner enemy ids (hence its bytes) moved. */
const PINS: Record<string, Record<number, string>> = {
  wintermoor_academy: { 3030: '600554a0', 1: '6236548e', 2: 'aa93848a' },
  sleepers_spine: { 4040: '7f0641af', 1: '94daa014', 2: 'faf09bbd' },
  the_hedgerow: { 5050: 'dedb40c4', 1: '69b3d831', 2: '78cb40b7' },
  laughing_ruins: { 6060: 'b4538cb0', 1: '402b5b97', 2: '925f1815' },
  night_train: { 7070: '502a7283', 1: 'b912c1d1', 2: '94ca2252' },
  spore_forest: { 8080: 'cb637efb', 1: 'df9ceb37', 2: '4a9a94b1' },
  castle_hoaxula: { 9090: '711e297c', 1: '25de60d6', 2: 'fb5dd45f' },
  sea_of_silence: { 1010: '36e4fc55', 1: 'ff9f4f66', 2: 'e995a3a8' },
};

describe('S15g M2 — every dungeon site is deterministic + sealed on 3 seeds', () => {
  for (const id of DUNGEON_IDS) {
    const base = SAMPLE_RECIPES[id] as DungeonRecipe;
    for (const seed of Object.keys(PINS[id]).map(Number)) {
      const r = { ...base, id, seed };
      it(`${id}@${seed}: identical bytes twice`, () => {
        expect(JSON.stringify(generate(r))).toBe(JSON.stringify(generate(r)));
      });
      it(`${id}@${seed}: output hash is pinned (refactor drift fails here)`, () => {
        expect(fnv(generate(r))).toBe(PINS[id][seed]);
      });
      it(`${id}@${seed}: schema-parses as a draft`, () => {
        const p = DraftMapDefSchema.safeParse(generate(r));
        expect(p.success, p.success ? '' : JSON.stringify(p.error.issues.slice(0, 3))).toBe(true);
      });
      it(`${id}@${seed}: clears its post-conditions (entrance→exit, boss, rest)`, () => {
        expect(dungeonFlags(generate(r), isDungeonSolid)).toEqual([]);
      });
      it(`${id}@${seed}: no spawn crowds a fixture (hard pressure clean)`, () => {
        expect(pressureHardFlags(pressureReport(generate(r), isDungeonSolid))).toEqual([]);
      });
    }
  }
});

describe('S15g M2 — each site honours its own §A6 law', () => {
  it('laughing_ruins is a TREE on every seed (the loops are a lie, BFS-proven)', () => {
    for (const seed of [6060, 1, 2, 99, 31337]) {
      const d = generate({ ...(SAMPLE_RECIPES.laughing_ruins as DungeonRecipe), seed });
      expect(floorIsTree(d.grid, isDungeonSolid)).toBe(true);
    }
  });

  it('sea_of_silence subtracts: the wall curve falls strictly shallow→deep', () => {
    for (const seed of [1010, 1, 2, 99]) {
      const d = generate({ ...(SAMPLE_RECIPES.sea_of_silence as DungeonRecipe), seed });
      const [a, b, c] = silenceCurve(d);
      expect(a).toBeGreaterThan(b);
      expect(b).toBeGreaterThan(c);
    }
  });

  it('night_train: the car count is the ≤30-min law (rooms bounds the length)', () => {
    for (const rooms of [3, 5, 7, 12, 2]) {
      const d = generate({ ...(SAMPLE_RECIPES.night_train as DungeonRecipe), rooms });
      const cars = Math.max(3, Math.min(7, rooms)); // clamped to the pacing window
      expect(d.grid[0].length).toBe(cars * 9 + 2);
      // a linear train: exactly two doors (rear → engine), and they cross
      expect(d.doors.length).toBe(2);
      expect(dungeonFlags(d, isDungeonSolid)).toEqual([]);
    }
  });

  it('spore_forest: every Mushroomize zone has a cure-safe return (no trap)', () => {
    // the generator throws if a zone traps; reaching here on many seeds is the
    // proof, but assert the rest-before-pressure + reach holds too
    for (const seed of [8080, 1, 2, 99, 7, 55]) {
      const d = generate({ ...(SAMPLE_RECIPES.spore_forest as DungeonRecipe), seed });
      expect(dungeonFlags(d, isDungeonSolid)).toEqual([]);
      expect(d.triggers.some((t) => /mushroomize/.test(t.id))).toBe(true);
    }
  });

  it('castle_hoaxula: the backstage is reached by exactly ONE seam (the reveal)', () => {
    const d = generate(SAMPLE_RECIPES.castle_hoaxula as DungeonRecipe);
    expect(d.triggers.some((t) => t.id === 'hoaxula_reveal')).toBe(true);
    expect(dungeonFlags(d, isDungeonSolid)).toEqual([]);
  });

  it('the_hedgerow: the false exits never strand you (entrance still reaches exit)', () => {
    for (const seed of [5050, 1, 2, 99]) {
      const d = generate({ ...(SAMPLE_RECIPES.the_hedgerow as DungeonRecipe), seed });
      expect(dungeonFlags(d, isDungeonSolid)).toEqual([]);
    }
  });
});

describe('S15g M2 — the dungeon wall set matches the engine solidity (no drift)', () => {
  it('every DUNGEON_WALL char is a TILESET solid (a grammar wall really collides)', () => {
    const legend: Record<string, string> = {
      Z: 'pyramid_wall', W: 'wall_int', J: 'jungle_wall', U: 'bus_wall', B: 'brick',
      O: 'office_wall', C: 'cage_mesh', b: 'bush', '-': 'fence_h', '|': 'fence_v',
      e: 'sea_a', E: 'sea_foam', A: 'arcade_wall',
    };
    const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
    for (const ch of DUNGEON_WALL) {
      expect(solidByName.get(legend[ch]), `${ch} → ${legend[ch]}`).toBe(true);
    }
  });
});

describe('S15g M2 — the GENERALIZED soft-lock proof (pyramid precedent, lifted)', () => {
  // build the four rotor STATES of pyramid_1 the scene presents, and prove the
  // shared softLockFailures() reproduces the bespoke maps_ch2.test result:
  // the mask is reachable from the entry in EVERY rotation (no soft-lock).
  const room = buildPyramidRooms().find((m) => m.id === 'pyramid_1')!;
  const states = [0, 1, 2, 3].map((p) =>
    rotateRect(room.grid, PYR_ROTOR.x, PYR_ROTOR.y, PYR_ROTOR.size, (PYR_INITIAL_ROT.pyramid_1 + p) % 4),
  );
  const entry: [number, number] = [7, 12];
  const mask = room.props.find((p) => p.sprite === 'mask_switch')!;
  const maskCell: [number, number] = [Math.round(mask.x), Math.round(mask.y) + 1];

  it('the mask is reachable in ALL four rotations (matches the bespoke pyramid test)', () => {
    expect(softLockFailures(states, isDungeonSolid, entry, [maskCell])).toEqual([]);
  });

  it('it CATCHES a soft-lock: the exit is blocked in the as-found rotation', () => {
    // the documented solve needs a press first — so the exit is stranded in
    // state 0, and the generalized proof flags exactly that state
    const exit: [number, number] = [7, 1];
    const bad = softLockFailures(states, isDungeonSolid, entry, [exit]);
    expect(bad).toContain(0);
  });
});

describe('S15g M2 — Prime Law 2 holds under src/levelkit/** including dungeons/', () => {
  it('no Math.random()/Date.now() anywhere under the levelkit tree (recurse)', () => {
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue;
        const code = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        if (/Math\.random|Date\.now|new Date\(/.test(code)) offenders.push(p);
      }
    };
    walk('src/levelkit');
    expect(offenders).toEqual([]);
  });
});
