/**
 * THE DOOR AUDIT — pinned on a tiny synthetic map set (S15i playtest C).
 *
 * doorAudit is pure (the caller supplies `isSolid` + the maps record), so we
 * pin its three failure modes and the clean case on hand-built grids, exactly
 * as levelkit.test.ts pins the reachability math: a synthetic `isSolid` where
 * '#' is wall and everything else is floor, and 16px tiles (the engine's).
 *
 * Maps proven here:
 *   hub      — a real map whose doors exercise every verdict at once.
 *   room     — a correct round-trip with hub (clean both ways).
 *   wallroom — its door back to hub lands ON a wall  (landsSolid / STUCK).
 *   oneway   — has NO door back to hub               (noReturn).
 *   faredge  — its return-door sits at the far edge  (farFromReturn).
 */
import { describe, it, expect } from 'vitest';
import { doorAudit, FAR_FROM_RETURN_PX, type DoorFinding } from './mapcheck';
import type { MapDef } from '../schemas';

/** synthetic solidity: '#' is the only wall (keeps the proof self-contained) */
const isSolid = (ch: string): boolean => ch === '#';

/** a MapDef with only the fields doorAudit reads filled; the rest legal-empty */
function map(id: string, grid: string[], doors: MapDef['doors'], props: MapDef['props'] = []): MapDef {
  return {
    id,
    name: id,
    music: null,
    grid,
    props,
    npcs: [],
    signs: [],
    phones: [],
    doors,
    spawners: [],
    triggers: [],
  };
}

// a 5×5 walled room: solid border '#', floor '.' inside. Tile (2,2) center is
// floor → pixel (32,32) lands there; tile (0,0) is a wall → pixel (0,0) sticks.
const WALLED = ['#####', '#...#', '#...#', '#...#', '#####'];

// a 3×10 walled SHAFT (a stand-in for the real wrong-edge faults — wintermoor's
// inter-floor doors, the pyramid approach — where you land at one END but the
// way back is the far END, hundreds of px away).
const SHAFT = ['###', '#.#', '#.#', '#.#', '#.#', '#.#', '#.#', '#.#', '#.#', '###'];

/**
 * THE FIXTURE. hub has four doors:
 *   → room      lands @px(32,32)=tile(2,2) FLOOR, beside room's return (clean)
 *   → wallroom  lands @px(15,15)=tile(0,0) WALL  → landsSolid (STUCK), and its
 *               return is right there so NOT far
 *   → oneway    lands on floor, but oneway never points back → noReturn
 *   → faredge   lands at the TOP of a tall shaft, but faredge's only return-door
 *               sits at the far BOTTOM (~104px away) → farFromReturn (wrong end).
 */
function fixture(): Record<string, MapDef> {
  const hubReturn = { x: 1, y: 1, w: 1, h: 1, to: 'hub', tx: 16, ty: 16, facing: 'down' as const };

  const hub = map(
    'hub',
    WALLED,
    [
      // CLEAN: lands on floor tile (2,2); room's return door zone centers near (32,32)
      { x: 1, y: 3, w: 1, h: 1, to: 'room', tx: 32, ty: 32, facing: 'up' },
      // STUCK only: lands on the solid corner tile (0,0) at px(15,15), which is
      // still ~12.7px from wallroom's return-zone center (24,24) → no far flag
      { x: 2, y: 3, w: 1, h: 1, to: 'wallroom', tx: 15, ty: 15, facing: 'up' },
      // NO-RETURN: floor landing, but `oneway` has no door back to hub
      { x: 3, y: 3, w: 1, h: 1, to: 'oneway', tx: 32, ty: 32, facing: 'up' },
      // WRONG-EDGE: lands at the shaft's TOP px(24,24)=tile(1,1); faredge's only
      // return-door is at the far BOTTOM → ~104px from where you'd return-stand
      { x: 1, y: 1, w: 1, h: 1, to: 'faredge', tx: 24, ty: 24, facing: 'down' },
    ],
  );

  // room: a clean round-trip. Its door back to hub centers at tile (2,2)≈px(40,40),
  // close to hub's landing px(32,32) → within FAR_FROM_RETURN_PX, no flag.
  const room = map('room', WALLED, [{ x: 2, y: 2, w: 1, h: 1, to: 'hub', tx: 16, ty: 16, facing: 'down' }]);

  // wallroom: legal floor return to hub (so hub→wallroom trips ONLY landsSolid).
  const wallroom = map('wallroom', WALLED, [hubReturn]);

  // oneway: a door, but it points elsewhere — never back to hub.
  const oneway = map('oneway', WALLED, [{ x: 1, y: 1, w: 1, h: 1, to: 'room', tx: 16, ty: 16, facing: 'down' }]);

  // faredge: a tall shaft. Its return-door to hub sits at the far BOTTOM (tile
  // 1,8, facing 'up' → interior cell tile(1,7) ≈ px(24,120)); hub lands at the
  // TOP px(24,24) → ~96px away (> FAR_FROM_RETURN_PX) → farFromReturn.
  const faredge = map('faredge', SHAFT, [{ x: 1, y: 8, w: 1, h: 1, to: 'hub', tx: 16, ty: 16, facing: 'up' }]);

  return { hub, room, wallroom, oneway, faredge };
}

/** pull the finding for a given hub→to edge (zone doors only here) */
function find(fs: DoorFinding[], to: string): DoorFinding | undefined {
  return fs.find((f) => f.from === 'hub' && f.to === to);
}

describe('doorAudit', () => {
  const findings = doorAudit(fixture(), isSolid);

  it('flags a door that lands on a SOLID tile (STUCK)', () => {
    const f = find(findings, 'wallroom');
    expect(f).toBeDefined();
    expect(f!.issue).toContain('landsSolid');
    expect(f!.char).toBe('#');
    expect(f!.lx).toBe(0);
    expect(f!.ly).toBe(0);
    // wallroom DOES return to hub on floor, so it must NOT also be no-return/far
    expect(f!.issue).not.toContain('noReturn');
    expect(f!.issue).not.toContain('farFromReturn');
  });

  it('flags a one-way door (noReturn) without false STUCK/far', () => {
    const f = find(findings, 'oneway');
    expect(f).toBeDefined();
    expect(f!.issue).toEqual(['noReturn']);
  });

  it('flags a door that lands FAR from its reciprocal return-door (wrong edge)', () => {
    const f = find(findings, 'faredge');
    expect(f).toBeDefined();
    expect(f!.issue).toContain('farFromReturn');
    // the measured distance must exceed the threshold and be reported, naming
    // the reciprocal return-door it measured against
    expect(f!.detail.join(' ')).toMatch(/nearest return-door on faredge/);
    expect(f!.detail.join(' ')).toMatch(new RegExp(`>${FAR_FROM_RETURN_PX}`));
  });

  it('passes a correct door (clean round-trip → no finding at all)', () => {
    expect(find(findings, 'room')).toBeUndefined();
  });

  it('audits a prop door too (landsSolid via a prop `door`)', () => {
    // a porch whose door dumps you onto wallroom's solid corner
    const porchMaps = {
      porchHub: map('porchHub', WALLED, [], [
        { sprite: 'porch', x: 1, y: 1, door: { ox: 0, oy: 0, w: 8, h: 8, to: 'wallroom', tx: 0, ty: 0 } },
      ]),
      wallroom: map('wallroom', WALLED, [{ x: 2, y: 2, w: 1, h: 1, to: 'porchHub', tx: 16, ty: 16, facing: 'down' }]),
    };
    const fs = doorAudit(porchMaps, isSolid);
    const prop = fs.find((f) => f.from === 'porchHub' && f.kind === 'prop');
    expect(prop).toBeDefined();
    expect(prop!.issue).toContain('landsSolid');
  });

  it('clean fixture has no STUCK or wrong-edge on REAL paths other than the seeded ones', () => {
    // exactly the three seeded broken edges from hub, nothing spurious
    const hubEdges = findings.filter((f) => f.from === 'hub').map((f) => f.to).sort();
    expect(hubEdges).toEqual(['faredge', 'oneway', 'wallroom']);
  });

  it('EXEMPTS stairs/elevator: a stairwell landing far from the up-stairs is NOT wrong-edge', () => {
    // two floors joined by stairs. Same geometry as `faredge` (land at the top,
    // up-stairs at the far bottom → ~96px), but both doors are `stairs` → the
    // landing is OFF the stairhead by design and must NOT flag farFromReturn.
    const SHAFT = ['###', '#.#', '#.#', '#.#', '#.#', '#.#', '#.#', '#.#', '#.#', '###'];
    const stairMaps = {
      floorA: map('floorA', WALLED, [
        { x: 1, y: 1, w: 1, h: 1, to: 'floorB', tx: 24, ty: 24, facing: 'down', indicator: 'stairs' },
      ]),
      floorB: map('floorB', SHAFT, [
        { x: 1, y: 8, w: 1, h: 1, to: 'floorA', tx: 16, ty: 16, facing: 'up', indicator: 'stairs' },
      ]),
    };
    const fs = doorAudit(stairMaps, isSolid);
    // a clean two-way stair pair on floor → zero findings (no far, no no-return)
    expect(fs).toEqual([]);
  });
});
