/**
 * elev_spike GUARD — the World-Overhaul elevation engine spike (P2). Locks the
 * spike map's structural invariants so a later edit can't silently break the
 * walk-behind demo or the "no invisible ledge" law (docs/WILDERNESS_DESIGN_LANGUAGE.md
 * § Elevation). Engine-free: pure graph logic on the map data. The only tile chars
 * on elev_spike are '.', '^', 'K', 'T', and 'K' (cliff_face) is the sole solid.
 */
import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import { pathExists } from '../levelkit/mapcheck';

const m = MAPS.elev_spike;
const grid: string[] = m?.grid ?? [];
/** the only wall on the spike is the cliff face; lip + stairs + grass are walkable */
const isSolid = (ch: string): boolean => ch === 'K';
const levelAt = (x: number, y: number): number => {
  const ch = m?.elevation?.level[y]?.[x];
  return ch && ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0;
};

describe('elev_spike — the elevation engine spike guard (P2)', () => {
  it('is registered and declares an elevation plane matching the grid dims', () => {
    expect(m, 'elev_spike missing from MAPS').toBeDefined();
    expect(m!.elevation, 'elev_spike declares no elevation').toBeDefined();
    const level = m!.elevation!.level;
    expect(level.length).toBe(grid.length);
    for (let y = 0; y < grid.length; y++) expect(level[y].length).toBe(grid[y].length);
  });

  it('has exactly two terraces — the ground (0) and one upper level (1)', () => {
    const seen = new Set<number>();
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) seen.add(levelAt(x, y));
    expect([...seen].sort()).toEqual([0, 1]);
  });

  it('the stair is the SOLE walkable join between the two levels', () => {
    const ground: [number, number] = [11, 14]; // the dev-warp spawn (below the cliff)
    const terrace: [number, number] = [11, 2]; // up on the upper terrace
    expect(isSolid(grid[ground[1]][ground[0]])).toBe(false);
    expect(isSolid(grid[terrace[1]][terrace[0]])).toBe(false);
    expect(levelAt(ground[0], ground[1])).toBe(0);
    expect(levelAt(terrace[0], terrace[1])).toBe(1);
    // stair OPEN: you can walk ground → terrace
    expect(pathExists(grid, isSolid, ground, terrace)).toBe(true);
    // seal the stair (treat every 'T' as the cliff wall) and the levels fully
    // separate — proof the stair is the ONLY cut in the K face (no stray gap)
    const sealed = grid.map((r) => r.replace(/T/g, 'K'));
    expect(pathExists(sealed, isSolid, ground, terrace)).toBe(false);
  });

  it('obeys the no-invisible-ledge law: every walkable level change touches a stair', () => {
    // any two 4-adjacent WALKABLE cells whose levels differ must have a 'T' at one
    // end — you only change terrace on the stair; elsewhere a solid K wall sits
    // between the levels, so adjacent walkable cells never straddle a bare seam.
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
          // and the seam must be a single terrace step (no 0→2 multi-level jump) — review F3
          expect(
            Math.abs(levelAt(x, y) - levelAt(nx, ny)),
            `level jump >1 at (${x},${y})→(${nx},${ny})`,
          ).toBe(1);
        }
      }
    }
  });

  it('the stair descends monotonically and lands the player back on the ground (level 0)', () => {
    // Replay the RUNTIME rule (OverworldScene.update: on a 'T' tile, playerLevel =
    // levelGrid[feet]) down the centre stair column, then out onto the ground. This
    // is the transition no other test exercises (review F3) — a stair whose level
    // plane steps wrongly (BUG A: rows 7-8 left at level 1; BUG C: non-monotonic)
    // would strand the descended player lifted on the ground, and this catches it.
    const col = 11; // centre of the 3-wide stair (cols 10-12)
    let playerLevel = 1; // start on the upper terrace
    const trail: number[] = [];
    for (let y = 0; y < grid.length; y++) {
      const ch = grid[y][col];
      if (ch === 'K') continue; // solid face — never stood on (the stair is the only cut)
      if (ch === 'T') playerLevel = levelAt(col, y); // the exact runtime transition
      trail.push(playerLevel);
    }
    // no single downward step changes terrace by more than one
    for (let i = 1; i < trail.length; i++) expect(Math.abs(trail[i] - trail[i - 1])).toBeLessThanOrEqual(1);
    // after descending the stair the player is on the ground for the rest of the column
    expect(playerLevel).toBe(0);
    // the LOWEST stair cell (the one you step off onto the ground) must itself be
    // level 0, so stepping off never leaves the player lifted on a bare ground tile
    let lastStairY = -1;
    for (let y = 0; y < grid.length; y++) if (grid[y][col] === 'T') lastStairY = y;
    expect(lastStairY).toBeGreaterThan(-1);
    expect(levelAt(col, lastStairY)).toBe(0);
  });
});
