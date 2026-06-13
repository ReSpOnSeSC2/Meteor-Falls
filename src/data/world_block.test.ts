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
    // ADR-056 (§B4): the woods nook earns a hidden present beside its rest
    expect(MAPS.otterbrook.props.some((p) => p.sprite === 'gift_box')).toBe(true);
    expect(MAPS.otterbrook.signs.some((s) => s.dialogue === 'otter_woods_gift')).toBe(true);
  });

  it('the daybreak gate seals the road east until zapper_done (the daybreak law, §B4)', () => {
    const ob = MAPS.otterbrook;
    // the foot connector east still exists (kept for Movement 2)...
    expect(ob.doors.some((d) => d.to === 'meadow_mile')).toBe(true);
    // ...but a sleeping-town barricade + notice guard it, both gated to RETIRE
    // at daybreak (the door itself is gated in OverworldScene.checkDoors too)
    expect(ob.props.find((p) => p.sprite === 'sawhorse')?.unlessFlag).toBe('zapper_done');
    expect(ob.signs.some((s) => s.dialogue === 'sign_meadow_gate_closed' && s.unlessFlag === 'zapper_done')).toBe(true);
    // the treeline gawker + the gate walker swap night→day on the daybreak flip
    const gawker = ob.npcs.find((n) => n.id === 'treeline_gawker');
    expect(gawker?.dialogue && gawker?.dialogueDay).toBeTruthy();
    expect(ob.npcs.find((n) => n.id === 'gate_walker')?.dialogueDay).toBeTruthy();
    // APPEND-ONLY: the frozen 1995 core carries none of the gate (byte-identical above)
    expect(buildOtterbrook().props.some((p) => p.sprite === 'sawhorse')).toBe(false);
  });
});

describe('THE LONG WALK — the multi-screen foot journey (Movement 3, ADR-056)', () => {
  const LEGS = ['meadow_mile', 'meadow_woods', 'meadow_far', 'meadow_overpass'] as const;
  /** the trail row (':') at a column — the door-landing the legs compute (ADR-012) */
  const trailRow = (m: MapDef, col: number): number => {
    for (let y = 0; y < m.grid.length - 1; y++) if (m.grid[y][col] === ':') return y;
    return Math.round(m.grid.length / 2);
  };

  it('all four legs exist, each its own screen', () => {
    for (const id of LEGS) expect(MAPS[id], id).toBeDefined();
  });

  it('the west end is wired two-way to Otterbrook (the exported east gate)', () => {
    const east = MAPS.otterbrook.doors.find((d) => d.to === 'meadow_mile');
    expect(east).toBeDefined();
    const back = MAPS.meadow_mile.doors.find((d) => d.to === 'otterbrook');
    expect(back?.tx).toBe(OTTERBROOK_EAST_GATE.x * 16);
    expect(back?.ty).toBe(OTTERBROOK_EAST_GATE.y * 16);
  });

  it('the legs chain west→east with COMPUTED two-way doors (landing on the neighbour trail)', () => {
    const chain: ReadonlyArray<readonly [string, string]> = [
      ['meadow_mile', 'meadow_woods'],
      ['meadow_woods', 'meadow_far'],
      ['meadow_far', 'meadow_overpass'],
    ];
    for (const [a, b] of chain) {
      const fwd = MAPS[a].doors.find((d) => d.to === b);
      const back = MAPS[b].doors.find((d) => d.to === a);
      expect(fwd, `${a}→${b}`).toBeDefined();
      expect(back, `${b}→${a}`).toBeDefined();
      // forward lands at the neighbour's WEST mouth (tile 1) on its real trail row
      expect(fwd?.tx).toBe(16);
      expect(fwd?.ty).toBe(trailRow(MAPS[b], 0) * 16);
      // back lands at the neighbour's EAST mouth (tile W-2) on its real trail row
      expect(back?.tx).toBe((MAPS[a].grid[0].length - 2) * 16);
      expect(back?.ty).toBe(trailRow(MAPS[a], MAPS[a].grid[0].length - 1) * 16);
    }
  });

  it('the city line is the OVERPASS now (the gate + proctors moved off meadow_mile)', () => {
    // the gate is a TRIGGER on the overpass, never a plain east door
    expect(MAPS.meadow_overpass.triggers.some((t) => t.id === 'orientation_gate')).toBe(true);
    expect(MAPS.meadow_overpass.doors.some((d) => d.to === 'brickton')).toBe(false);
    // and it is GONE from meadow_mile (relocated to the city-adjacent leg)
    expect(MAPS.meadow_mile.triggers.some((t) => t.id === 'orientation_gate')).toBe(false);
    const proctors = MAPS.meadow_overpass.npcs.filter((n) => n.dialogue === 'npc_proctor');
    expect(proctors.length).toBe(3);
    expect(proctors.every((p) => p.unlessFlag === 'visitor_badge')).toBe(true);
  });

  it('every leg rests before it runs hot (a payphone + a §A7 spawner)', () => {
    for (const id of LEGS) {
      expect(MAPS[id].phones.length, `${id} phones`).toBeGreaterThanOrEqual(1);
      expect(MAPS[id].spawners.length, `${id} spawners`).toBeGreaterThanOrEqual(1);
    }
  });

  it('the meteor-drop roadblock stays on its leg (meadow_mile, Task 0)', () => {
    const mm = MAPS.meadow_mile;
    expect(mm.props.some((p) => p.sprite === 'meteor_rock')).toBe(true);
    expect(mm.props.some((p) => p.sprite === 'sawhorse')).toBe(true);
    expect(mm.npcs.some((n) => n.id === 'roadblock_worker' && n.dialogue === 'npc_roadblock_worker')).toBe(true);
    expect(mm.signs.some((s) => s.dialogue === 'sign_roadblock')).toBe(true);
    // the chunk's solid blocks only the UPPER lane (oy ≥ 16 px), the lower stays open
    expect(mm.props.find((p) => p.sprite === 'meteor_rock')?.solid?.oy).toBeGreaterThanOrEqual(16);
  });

  it('carries two flag-gated cutscene beats + hidden presents along the way (§B4)', () => {
    expect(MAPS.meadow_woods.triggers.some((t) => t.id === 'woods_vignette')).toBe(true);
    expect(MAPS.meadow_overpass.triggers.some((t) => t.id === 'city_reveal')).toBe(true);
    // a present on the woods glade + one in the far meadow (the gift-box pattern)
    expect(MAPS.meadow_woods.props.some((p) => p.sprite === 'gift_box')).toBe(true);
    expect(MAPS.meadow_far.props.some((p) => p.sprite === 'gift_box')).toBe(true);
    expect(MAPS.meadow_woods.signs.some((s) => s.dialogue === 'meadow_gift_woods')).toBe(true);
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
    // ADR-056: the foot return now lands on the OVERPASS (the city-adjacent leg),
    // not the town-edge meadow — the long walk reads correctly in both directions
    expect(grown.doors.some((d) => d.to === 'meadow_overpass')).toBe(true);
    expect(grown.doors.some((d) => d.to === 'meadow_mile')).toBe(false);
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
