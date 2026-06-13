/**
 * THE WORLD BLOCK — the FROZEN-CORE proofs (S15h, ADR-049).
 *
 * The growth law's spine: Otterbrook's 1995 layout and Brickton's 2077 layout
 * are CANON and ship today — they stay BYTE-IDENTICAL while the towns grow
 * around them. These pins are the maps_ch2 "two builds byte-identical / the
 * live MAPS entry matches a fresh build" pattern, plus the stronger proof that
 * the grown map's top-left REGION is the untouched core char-for-char and every
 * core prop/npc/door keeps its coordinates. A change that disturbs a frozen
 * core fails HERE, loudly. (cityViolations at the larger size lives in maps.test.)
 */
import { describe, expect, it } from 'vitest';
import { buildOtterbrook, growOtterbrook, buildBrickton, growBrickton, OTTERBROOK_EAST_GATE, MAPS } from './maps';
import { cityViolations } from '../levelkit/metrics';
import type { MapDef } from './maps';

/** the grown map's top-left CW×CH region equals the core grid, char-for-char */
function coreRegionMatches(grown: MapDef, core: MapDef): void {
  const cw = core.grid[0].length;
  for (let y = 0; y < core.grid.length; y++) {
    expect(grown.grid[y].slice(0, cw), `core row ${y}`).toBe(core.grid[y]);
  }
}

/** the grown map's arrays START with the core's, unchanged (top-left anchored) */
function corePrefixUnchanged(grown: MapDef, core: MapDef): void {
  expect(JSON.stringify(grown.props.slice(0, core.props.length))).toBe(JSON.stringify(core.props));
  expect(JSON.stringify(grown.npcs.slice(0, core.npcs.length))).toBe(JSON.stringify(core.npcs));
  expect(JSON.stringify(grown.signs.slice(0, core.signs.length))).toBe(JSON.stringify(core.signs));
  expect(JSON.stringify(grown.spawners.slice(0, core.spawners.length))).toBe(JSON.stringify(core.spawners));
  // the core's doors stay FIRST + unchanged; growth only appends (e.g. the east gate)
  expect(JSON.stringify(grown.doors.slice(0, core.doors.length))).toBe(JSON.stringify(core.doors));
  // triggers + phones spread straight through from the core (growth adds none here)
  expect(JSON.stringify(grown.triggers)).toBe(JSON.stringify(core.triggers));
  expect(JSON.stringify(grown.phones)).toBe(JSON.stringify(core.phones));
}

describe('OTTERBROOK — the 1995 core is frozen (≈3× growth, town stays organic)', () => {
  it('two grown builds are byte-identical: grid, props, npc positions', () => {
    const a = growOtterbrook();
    const b = growOtterbrook();
    expect(a.grid.join('|')).toBe(b.grid.join('|'));
    expect(JSON.stringify(a.props)).toBe(JSON.stringify(b.props));
    expect(JSON.stringify(a.npcs)).toBe(JSON.stringify(b.npcs));
  });

  it('the live MAPS entry matches a fresh build (no later stream disturbed it)', () => {
    expect(MAPS.otterbrook.grid.join('|')).toBe(growOtterbrook().grid.join('|'));
  });

  it('the frozen 1995 core sits byte-identical in the top-left', () => {
    coreRegionMatches(MAPS.otterbrook, buildOtterbrook());
    corePrefixUnchanged(MAPS.otterbrook, buildOtterbrook());
  });

  it('grew about 3× and stays inside the XL envelope (≤4000 tiles)', () => {
    const core = buildOtterbrook();
    const coreTiles = core.grid[0].length * core.grid.length;
    const grownTiles = MAPS.otterbrook.grid[0].length * MAPS.otterbrook.grid.length;
    expect(grownTiles / coreTiles).toBeGreaterThan(2.5);
    expect(grownTiles).toBeLessThanOrEqual(4000);
    expect(MAPS.otterbrook.props.length).toBeLessThanOrEqual(260);
  });

  it('stays a TOWN (organic, never bumped to city) and keeps its landmarks', () => {
    expect(MAPS.otterbrook.settlement).toBe('town');
    // CITY HALL opens into the hand-authored civic interior
    expect(MAPS.otterbrook.props.some((p) => p.door?.to === 'otterbrook_cityhall')).toBe(true);
    expect(MAPS.otterbrook_cityhall).toBeDefined();
    expect(MAPS.otterbrook_cityhall.doors.some((d) => d.to === 'otterbrook')).toBe(true);
    // the bus corner + lemonade stand + chapel door survived byte-identical
    expect(MAPS.otterbrook.props.some((p) => p.sprite === 'lemonade')).toBe(true);
    expect(MAPS.otterbrook.props.some((p) => p.door?.to === 'chapel_int')).toBe(true);
    expect(MAPS.otterbrook.triggers.some((t) => t.id === 'bus_stop')).toBe(true);
  });
});

describe('MEADOW MILE — the foot route + the orientation gate (Movement 2)', () => {
  it('the road is wired two-way to Otterbrook (the exported east gate)', () => {
    expect(MAPS.meadow_mile).toBeDefined();
    // Otterbrook leaves EAST onto the road; the road's west door returns to the gate
    const east = MAPS.otterbrook.doors.find((d) => d.to === 'meadow_mile');
    expect(east).toBeDefined();
    const back = MAPS.meadow_mile.doors.find((d) => d.to === 'otterbrook');
    expect(back).toBeDefined();
    expect(back?.tx).toBe(OTTERBROOK_EAST_GATE.x * 16);
    expect(back?.ty).toBe(OTTERBROOK_EAST_GATE.y * 16);
  });

  it('the city line is a TRIGGER (gated), not a plain east door', () => {
    expect(MAPS.meadow_mile.triggers.some((t) => t.id === 'orientation_gate')).toBe(true);
    // no straight-through east door — entry is the gated scene
    expect(MAPS.meadow_mile.doors.some((d) => d.to === 'brickton')).toBe(false);
  });

  it('three proctors man the line until the badge is earned, and the road rests before it runs hot', () => {
    const proctors = MAPS.meadow_mile.npcs.filter((n) => n.dialogue === 'npc_proctor');
    expect(proctors.length).toBe(3);
    expect(proctors.every((p) => p.unlessFlag === 'visitor_badge')).toBe(true);
    // §B4: a rest point (payphone) sits west of the hot middle band
    expect(MAPS.meadow_mile.phones.length).toBeGreaterThanOrEqual(1);
    expect(MAPS.meadow_mile.spawners.length).toBeGreaterThanOrEqual(1);
  });
});

describe('BRICKTON — the 2077 core is frozen (≈4× sprawl, stays a city)', () => {
  it('two grown builds are byte-identical: grid, props, npc positions', () => {
    const a = growBrickton();
    const b = growBrickton();
    expect(a.grid.join('|')).toBe(b.grid.join('|'));
    expect(JSON.stringify(a.props)).toBe(JSON.stringify(b.props));
    expect(JSON.stringify(a.npcs)).toBe(JSON.stringify(b.npcs));
  });

  it('the live MAPS entry matches a fresh build (no later stream disturbed it)', () => {
    expect(MAPS.brickton.grid.join('|')).toBe(growBrickton().grid.join('|'));
  });

  it('the frozen 2077 core GRID sits byte-identical in the top-left', () => {
    coreRegionMatches(MAPS.brickton, buildBrickton());
  });

  it('every 2077 core prop/npc/sign/trigger keeps its coordinates', () => {
    const core = buildBrickton();
    const grown = MAPS.brickton;
    expect(JSON.stringify(grown.props.slice(0, core.props.length))).toBe(JSON.stringify(core.props));
    expect(JSON.stringify(grown.npcs.slice(0, core.npcs.length))).toBe(JSON.stringify(core.npcs));
    expect(JSON.stringify(grown.signs.slice(0, core.signs.length))).toBe(JSON.stringify(core.signs));
    expect(JSON.stringify(grown.triggers)).toBe(JSON.stringify(core.triggers)); // the two stories' flags + payphone ring, untouched
  });

  it('the only door change is the relocated docks exit; the Cage gate is byte-identical', () => {
    const core = buildBrickton();
    const grown = MAPS.brickton;
    const coreCage = core.doors.find((d) => d.to === 'the_cage');
    const grownCage = grown.doors.find((d) => d.to === 'the_cage');
    expect(JSON.stringify(grownCage)).toBe(JSON.stringify(coreCage)); // S12 court gate untouched
    expect(grown.doors.some((d) => d.to === 'brickton_docks')).toBe(true); // relocated, still wired
    expect(grown.doors.some((d) => d.to === 'meadow_mile')).toBe(true); // the foot return
  });

  it('stays a CITY and clears the ADR-012 sweep AT the 4× size', () => {
    expect(MAPS.brickton.settlement).toBe('city');
    expect(cityViolations(MAPS.brickton)).toEqual([]);
  });

  it('grew about 4× and holds the raised XL envelope (≤12000 tiles, ≤320 props)', () => {
    const core = buildBrickton();
    const coreTiles = core.grid[0].length * core.grid.length;
    const grownTiles = MAPS.brickton.grid[0].length * MAPS.brickton.grid.length;
    expect(grownTiles / coreTiles).toBeGreaterThan(3.5);
    expect(grownTiles).toBeLessThanOrEqual(12000);
    expect(MAPS.brickton.props.length).toBeLessThanOrEqual(320);
  });

  it('the Cage, the dept, the bus stop, and the two stories survived byte-identical', () => {
    const b = MAPS.brickton;
    expect(b.props.some((p) => p.sprite === 'cage_gate')).toBe(true); // the S12 court reads from the street
    expect(b.props.some((p) => p.door?.to === 'dos_f1')).toBe(true); // the Department
    expect(b.triggers.some((t) => t.id === 'bus_stop_brickton')).toBe(true);
    expect(b.triggers.some((t) => t.id === 'brickton_clock_goal')).toBe(true); // THE BRICKTON MINUTE flag
    expect(b.triggers.some((t) => t.id === 'brickton_dial_goal')).toBe(true); // THE WARM DIAL TONE flag
  });
});
