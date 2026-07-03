/**
 * ELEVATION FREEZE TRIPWIRE — the World-Overhaul opt-in ratchet.
 *
 * True multi-level elevation (walk-behind cliff parallax, docs/WILDERNESS_DESIGN_LANGUAGE.md
 * § Elevation) is being built as an OPT-IN engine feature: a map is flat unless it declares
 * an `elevation` plane. The entire zero-regression guarantee for the ~90 shipped maps rests
 * on ONE fact — none of them set `elevation`, so every render/collision/BFS path stays
 * byte-identical to today.
 *
 * This test is that guarantee, made loud. Any map that gains elevation must be added to
 * ELEVATED_ALLOWLIST in the SAME change that authors + guards it (its own maps_*.test.ts +
 * door-audit + content-validate elevation pass). If elevation leaks onto a map by accident,
 * this fails before the subtle rendering/collision drift ever ships.
 */
import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import { ElevationSchema } from '../schemas';

/** Maps that have DELIBERATELY opted into the elevation engine. Empty until the
 *  engine spike (`elev_spike`) lands; grows one deliberate id at a time thereafter. */
const ELEVATED_ALLOWLIST = new Set<string>([
  // 'elev_spike',   // added when the engine spike map lands (World Overhaul S2)
  // 'foggybottom',  // added when the Ch3 pilot goes terrace-aware
]);

describe('elevation — the opt-in freeze (shipped maps stay flat until deliberately elevated)', () => {
  it('no shipped map declares elevation except the allowlist', () => {
    const leaked = Object.entries(MAPS)
      .filter(([id, m]) => m.elevation !== undefined && !ELEVATED_ALLOWLIST.has(id))
      .map(([id]) => id);
    expect(leaked, `unexpected elevated maps: ${leaked.join(', ')}`).toEqual([]);
  });

  it('every allowlisted map actually declares a well-formed elevation plane', () => {
    // catches an id left on the allowlist after its elevation was removed, and any
    // malformed plane (wrong shape) before it can reach the renderer.
    for (const id of ELEVATED_ALLOWLIST) {
      const m = MAPS[id];
      expect(m, `allowlisted '${id}' is missing from MAPS`).toBeDefined();
      expect(m.elevation, `allowlisted '${id}' declares no elevation`).toBeDefined();
      expect(() => ElevationSchema.parse(m.elevation)).not.toThrow();
      // the level plane must match the grid's dimensions exactly (one level cell per tile)
      expect(m.elevation!.level.length).toBe(m.grid.length);
      for (let y = 0; y < m.grid.length; y++) {
        expect(m.elevation!.level[y].length, `${id} level row ${y} width`).toBe(m.grid[y].length);
      }
    }
  });
});
