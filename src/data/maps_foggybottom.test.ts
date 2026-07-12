/**
 * foggybottom GUARD — the World-Overhaul S5 PILOT (P5): the first SHIPPED elevated
 * map (opt-in true-elevation engine). Locks the four-terrace fog-cliff's structural
 * invariants so a later edit can't silently break the descent, the walk-behind, or the
 * "no invisible ledge" law (docs/WILDERNESS_DESIGN_LANGUAGE.md § Elevation). Mirrors
 * maps_elev_spike.test.ts, generalised from two terraces to FOUR (L0 quay → L3 rim),
 * and uses the SHIPPED tile solidity (CHAR_LEGEND × TILESET) so the graph logic matches
 * exactly what content-validate's global elevation gate sees. Engine-free.
 */
import { describe, expect, it } from 'vitest';
import { MAPS, CHAR_LEGEND } from './maps';
import { FOGGYBOTTOM_LANDING } from './maps_ch3';
import { TILESET } from '../spritegen/tiles';
import { pathExists, components, levelJoinFor, elevationLawViolations } from '../levelkit/mapcheck';

const m = MAPS.foggybottom;
const grid: string[] = m?.grid ?? [];

// the SHIPPED tile solidity — identical to content-validate.ts's isSolidChar (':'/'r'
// walkable; every other char resolves via CHAR_LEGEND → TILESET.solid). This is what
// the global elevationLawViolations gate uses, so the guard proves the same thing.
const solidByName = new Map(TILESET.map((t) => [t.name, t.solid] as const));
const isSolid = (ch: string): boolean => {
  if (ch === ':' || ch === 'r') return false;
  const tile = CHAR_LEGEND[ch];
  if (!tile) throw new Error(`foggybottom uses unknown/fallback tile '${ch}'`);
  return solidByName.get(tile) === true;
};

const levelAt = (x: number, y: number): number => {
  const ch = m?.elevation?.level[y]?.[x];
  return ch && ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0;
};

// one representative WALKABLE cell per terrace (asserted walkable + correct level below)
const RIM: [number, number] = [30, 5]; // L3
const HIGH: [number, number] = [24, 21]; // L2
const MKT: [number, number] = [24, 30]; // L1
const QUAY: [number, number] = [24, 42]; // L0
const CELLS: Array<[[number, number], number]> = [
  [RIM, 3],
  [HIGH, 2],
  [MKT, 1],
  [QUAY, 0],
];

/** Connected stair footprints, derived from the authored grid rather than
 * frozen coordinates. Sorting west-to-east captures the town's dog-leg. */
function stairClusters(): Array<Array<[number, number]>> {
  const unseen = new Set<string>();
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++) if (grid[y][x] === 'T') unseen.add(`${x},${y}`);
  const found: Array<Array<[number, number]>> = [];
  while (unseen.size) {
    const first = unseen.values().next().value as string;
    unseen.delete(first);
    const [sx, sy] = first.split(',').map(Number);
    const queue: Array<[number, number]> = [[sx, sy]];
    const cluster: Array<[number, number]> = [];
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      cluster.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const key = `${x + dx},${y + dy}`;
        if (!unseen.delete(key)) continue;
        queue.push([x + dx, y + dy]);
      }
    }
    found.push(cluster);
  }
  return found.sort(
    (a, b) => a.reduce((sum, [x]) => sum + x, 0) / a.length - b.reduce((sum, [x]) => sum + x, 0) / b.length,
  );
}

describe('foggybottom — the S5 pilot: the four-terrace fog-cliff descent (P5)', () => {
  it('is registered, opts into elevation + fog, and its level plane matches the grid dims', () => {
    expect(m, 'foggybottom missing from MAPS').toBeDefined();
    expect(m!.elevation, 'foggybottom declares no elevation').toBeDefined();
    expect(m!.atmosphere, 'foggybottom must opt into the fog veil').toBe('fog');
    expect(m!.settlement, 'foggybottom must stay a settlement town for occupyCity').toBe('town');
    const level = m!.elevation!.level;
    expect(level.length).toBe(grid.length);
    for (let y = 0; y < grid.length; y++) expect(level[y].length).toBe(grid[y].length);
  });

  it('stacks exactly FOUR terraces — the ground quay (0) up to the rim (3)', () => {
    const seen = new Set<number>();
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) seen.add(levelAt(x, y));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('each representative terrace cell is walkable and on its expected level', () => {
    for (const [[x, y], lvl] of CELLS) {
      expect(isSolid(grid[y][x]), `terrace cell (${x},${y}) must be walkable`).toBe(false);
      expect(levelAt(x, y), `terrace cell (${x},${y}) level`).toBe(lvl);
    }
    // the Lucille landing must sit on the L0 quay (fog-soup bottom)
    expect(levelAt(FOGGYBOTTOM_LANDING.x, FOGGYBOTTOM_LANDING.y)).toBe(0);
    expect(isSolid(grid[FOGGYBOTTOM_LANDING.y][FOGGYBOTTOM_LANDING.x])).toBe(false);
  });

  it('the STAIRS are the sole walkable joins between terraces (seal them and the town shatters)', () => {
    // normally you can walk quay → rim across all three stairs...
    expect(pathExists(grid, isSolid, QUAY, RIM)).toBe(true);
    // ...seal every 'T' (treat each as the cliff wall) and the four terraces fully
    // separate — proof no stray gap joins two levels except the stairs.
    const sealed = grid.map((r) => r.replace(/T/g, 'K'));
    expect(pathExists(sealed, isSolid, QUAY, RIM)).toBe(false);
    expect(pathExists(sealed, isSolid, QUAY, MKT)).toBe(false);
    expect(pathExists(sealed, isSolid, MKT, HIGH)).toBe(false);
    expect(pathExists(sealed, isSolid, HIGH, RIM)).toBe(false);
  });

  it('has exactly three legal T joins, staggered west-to-east across adjacent level pairs', () => {
    const stairs = stairClusters();
    expect(stairs).toHaveLength(3);
    expect(stairs.map((cluster) => cluster.length)).toEqual([12, 12, 12]);
    expect(stairs.map((cluster) => [...new Set(cluster.map(([x, y]) => levelAt(x, y)))].sort())).toEqual([
      [2, 3],
      [1, 2],
      [0, 1],
    ]);
    const centres = stairs.map(
      (cluster) => cluster.reduce((sum, [x]) => sum + x, 0) / cluster.length,
    );
    expect(centres[0]).toBeLessThan(centres[1]);
    expect(centres[1]).toBeLessThan(centres[2]);
  });

  it('obeys the no-invisible-ledge law: every walkable level change touches a stair, ±1 only', () => {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (isSolid(grid[y][x])) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= grid.length || nx >= grid[ny].length) continue;
          if (isSolid(grid[ny][nx])) continue;
          if (levelAt(x, y) === levelAt(nx, ny)) continue;
          const straddlesStair = grid[y][x] === 'T' || grid[ny][nx] === 'T';
          expect(straddlesStair, `bare level seam at (${x},${y})→(${nx},${ny})`).toBe(true);
          expect(
            Math.abs(levelAt(x, y) - levelAt(nx, ny)),
            `level jump >1 at (${x},${y})→(${nx},${ny})`,
          ).toBe(1);
        }
      }
    }
  });

  it('passes the GLOBAL elevation law (the content-validate gate finds nothing here)', () => {
    // exactly what the shipped silent gate runs — same isSolid, over the real map.
    expect(elevationLawViolations(m!, isSolid)).toEqual([]);
  });

  it('each stair column descends MONOTONICALLY and lands you on the terrace below', () => {
    // Replay the runtime rule (OverworldScene.update: on a 'T', playerLevel = levelGrid[feet])
    // down each staggered stair column; no downward step may change terrace by >1, and the
    // LOWEST 'T' cell must be the lower terrace's level (stepping off never strands you lifted).
    for (const [col, expectLow] of [[9, 2], [29, 1], [47, 0]] as const) {
      const trail: number[] = [];
      let lastStairY = -1;
      let lvl = -1;
      for (let y = 0; y < grid.length; y++) {
        const ch = grid[y][col];
        if (ch === 'K') continue; // solid face — never stood on
        if (ch === 'T') {
          lvl = levelAt(col, y);
          lastStairY = y;
        }
        if (lvl >= 0) trail.push(ch === 'T' ? levelAt(col, y) : lvl);
      }
      for (let i = 1; i < trail.length; i++)
        expect(Math.abs(trail[i] - trail[i - 1]), `stair col ${col} jump`).toBeLessThanOrEqual(1);
      expect(lastStairY, `stair col ${col} has a 'T'`).toBeGreaterThan(-1);
      expect(levelAt(col, lastStairY), `stair col ${col} bottom lands on level ${expectLow}`).toBe(expectLow);
    }
  });

  it('P3 cross-level collision: a lower-terrace body enters a higher tile ONLY on a stair', () => {
    // mirror OverworldScene.collidesStatic (guarded by maxLevel>0): to a mover on terrace
    // `playerLevel`, a tile is level-solid when its terrace differs AND it is not a 'T'.
    const levelSolidTo = (playerLevel: number, x: number, y: number): boolean =>
      levelAt(x, y) !== playerLevel && grid[y][x] !== 'T';
    let higherTiles = 0;
    let stairExemptions = 0;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (levelAt(x, y) > 0) {
          higherTiles++;
          const isStair = grid[y][x] === 'T';
          // a level-0 player is blocked from every higher tile UNLESS it is a stair
          expect(levelSolidTo(0, x, y), `higher tile (${x},${y}) block`).toBe(!isStair);
          if (isStair) stairExemptions++;
        } else {
          expect(levelSolidTo(0, x, y), `ground tile (${x},${y}) free`).toBe(false);
        }
      }
    }
    expect(higherTiles).toBeGreaterThan(0);
    expect(stairExemptions).toBeGreaterThan(0);
  });

  it('P3 reachability: all four terraces are ONE world through the stairs; a same-level join shatters it', () => {
    const join = levelJoinFor(m!);
    const c = components(grid, isSolid, join);
    for (const [[x, y]] of CELLS) expect(c.comp[y][x], `(${x},${y}) reachable`).toBe(c.mainId);
    // a hand-rolled SAME-LEVEL-ONLY join orphans the upper terraces — proof the seams
    // are genuine multi-level cuts that only the stairs bridge.
    const sameLevelOnly = (ax: number, ay: number, bx: number, by: number): boolean =>
      levelAt(ax, ay) === levelAt(bx, by);
    const orphaned = components(grid, isSolid, sameLevelOnly);
    expect(orphaned.comp[RIM[1]][RIM[0]]).not.toBe(orphaned.comp[QUAY[1]][QUAY[0]]);
  });

  it('P4 layered kit: at least one seam is a 3-row face exercising top/MID/base bands', () => {
    // buildElevationOverlay bands a K cell TOP (nothing K above) / BASE (nothing K below) /
    // else MID. A 3-row seam MUST yield ≥1 MID somewhere (a 2-row face never does — review F8).
    let mid = 0;
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++)
        if (grid[y][x] === 'K' && grid[y - 1]?.[x] === 'K' && grid[y + 1]?.[x] === 'K') mid++;
    expect(mid, 'no 3-row cliff face (no MID band)').toBeGreaterThan(0);
  });
});
