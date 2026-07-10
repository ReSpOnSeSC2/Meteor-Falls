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
import { BRICKTON_BUS_SPAWN, BRICKTON_FOOT_SPAWN, BRICKTON_DOCKS_RETURN, OTTERBROOK_EAST_GATE, MAPS } from './maps';
import { PUERTO_SOL_JUNGLE_RETURN, PUERTO_SOL_PIER_SPAWN } from './maps_ch2';
import { cityViolations, livingCityViolations } from '../levelkit/metrics';
import type { MapDef } from './maps';

describe('THE LONG WALK — the multi-screen foot journey (Movement 3, ADR-056)', () => {
  const LEGS = ['meadow_mile', 'meadow_woods', 'meadow_far', 'meadow_overpass'] as const;
  /** the trail column (':') at a row — the north/south landing the legs compute (ADR-012) */
  const trailCol = (m: MapDef, row: number): number => m.grid[row]?.indexOf(':') ?? -1;
  const walkable = (m: MapDef, tx: number, ty: number): boolean =>
    !'beEKW|-OBCZJ'.includes(m.grid[ty >> 4]?.[tx >> 4] ?? 'b');
  const northReachesSouth = (m: MapDef): boolean => {
    const start: [number, number] = [trailCol(m, 0), 1];
    const goal = `${trailCol(m, m.grid.length - 1)},${m.grid.length - 2}`;
    const seen = new Set<string>([`${start[0]},${start[1]}`]);
    const queue: Array<[number, number]> = [start];
    while (queue.length) {
      const [x, y] = queue.shift() as [number, number];
      if (`${x},${y}` === goal) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (nx < 0 || ny < 0 || nx >= m.grid[0].length || ny >= m.grid.length || seen.has(key)) continue;
        if ('beEKW|-OBCZJ'.includes(m.grid[ny][nx])) continue;
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
    return false;
  };

  it('all four legs are portrait screens running north → south', () => {
    const heights = [40, 36, 38, 34]; // the old 40/36/38/34-wide routes, rotated clockwise
    LEGS.forEach((id, i) => {
      const m = MAPS[id];
      expect(m, id).toBeDefined();
      expect(m.grid[0].length, `${id} width`).toBe(16);
      expect(m.grid.length, `${id} height`).toBe(heights[i]);
      expect(trailCol(m, 0), `${id} north trail`).toBeGreaterThanOrEqual(0);
      expect(trailCol(m, m.grid.length - 1), `${id} south trail`).toBeGreaterThanOrEqual(0);
      expect(northReachesSouth(m), `${id} north → south route`).toBe(true);
    });
  });

  it('Otterbrook exits from its SOUTH edge into Meadow Mile\'s NORTH edge', () => {
    const south = MAPS.otterbrook.doors.find((d) => d.to === 'meadow_mile');
    expect(south).toBeDefined();
    expect(south?.y).toBe(OTTERBROOK_EAST_GATE.y);
    expect((south?.y ?? -1) + (south?.h ?? 0)).toBe(MAPS.otterbrook.grid.length);
    expect(south?.facing).toBe('down');

    const back = MAPS.meadow_mile.doors.find((d) => d.to === 'otterbrook');
    expect(back?.y).toBe(0);
    expect(back?.facing).toBe('up');
    expect(back?.tx).toBe(OTTERBROOK_EAST_GATE.x * 16);
    expect(back?.ty).toBe(OTTERBROOK_EAST_GATE.y * 16);
    expect(south && walkable(MAPS.meadow_mile, south.tx, south.ty), 'Otterbrook → Meadow Mile landing').toBe(true);
    expect(back && walkable(MAPS.otterbrook, back.tx, back.ty), 'Meadow Mile → Otterbrook landing').toBe(true);
  });

  it('the legs chain north→south with COMPUTED two-way doors on the neighbour trail', () => {
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
      expect(fwd?.y).toBe(MAPS[a].grid.length - 1);
      expect(fwd?.facing).toBe('down');
      expect(back?.y).toBe(0);
      expect(back?.facing).toBe('up');
      // southbound lands one tile inside the neighbour's NORTH mouth.
      expect(fwd?.tx).toBe(trailCol(MAPS[b], 0) * 16 + 8);
      expect(fwd?.ty).toBe(16);
      // northbound lands one tile inside the neighbour's SOUTH mouth.
      expect(back?.tx).toBe(trailCol(MAPS[a], MAPS[a].grid.length - 1) * 16 + 8);
      expect(back?.ty).toBe((MAPS[a].grid.length - 2) * 16);
      expect(fwd && walkable(MAPS[b], fwd.tx, fwd.ty), `${a}→${b} walkable landing`).toBe(true);
      expect(back && walkable(MAPS[a], back.tx, back.ty), `${b}→${a} walkable landing`).toBe(true);
    }
  });

  it('the city line is the OVERPASS now (the gate + proctors moved off meadow_mile)', () => {
    // the gate is a TRIGGER across the overpass's SOUTH end, never a plain door
    const gate = MAPS.meadow_overpass.triggers.find((t) => t.id === 'orientation_gate');
    expect(gate).toBeDefined();
    expect(gate?.rect.y).toBe(MAPS.meadow_overpass.grid.length - 3);
    expect(gate?.rect.h).toBe(3);
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

  it('keeps every story-gate id while rotating the route (§B4 / save compatibility)', () => {
    expect(MAPS.meadow_mile.triggers.some((t) => t.id === 'walk_token')).toBe(true);
    expect(MAPS.meadow_woods.triggers.some((t) => t.id === 'walk_token')).toBe(true);
    expect(MAPS.meadow_far.triggers.some((t) => t.id === 'walk_token')).toBe(true);
    const vignette = MAPS.meadow_woods.triggers.find((t) => t.id === 'woods_vignette');
    const reveal = MAPS.meadow_overpass.triggers.find((t) => t.id === 'city_reveal');
    expect(vignette).toBeDefined();
    expect(reveal).toBeDefined();
    // Both formerly-west entry strips rotate into NORTH entry strips.
    expect(vignette?.rect.y).toBe(1);
    expect(reveal?.rect.y).toBe(1);
    // a present on the woods glade + one in the far meadow (the gift-box pattern)
    expect(MAPS.meadow_woods.props.some((p) => p.sprite === 'gift_box')).toBe(true);
    expect(MAPS.meadow_far.props.some((p) => p.sprite === 'gift_box')).toBe(true);
    expect(MAPS.meadow_woods.signs.some((s) => s.dialogue === 'meadow_gift_woods')).toBe(true);
  });
});

describe('TWOTON — the editor-authored Twoson rebuild (map id brickton, 2026-07-08)', () => {
  // The frozen-core pair (buildBrickton 1995 / growBrickton 2077) is RETIRED — the
  // map is now the map-editor DOCUMENT (src/data/maps_twoton.ts ⇄ tools/mapeditor/
  // twoton.json), so these pins assert the LIVE invariants every system depends on,
  // not a generator's byte stream. (The Otterbrook S3 precedent, applied to town #2.)

  it('is the editor document, registered live (name, size, settlement)', () => {
    const b = MAPS.brickton;
    expect(b.name).toBe('TWOTON');
    expect(b.settlement).toBe('city');
    expect(b.grid[0].length).toBe(104);
    expect(b.grid.length).toBe(84);
  });

  it('clears the ADR-012 city sweep AND the Living-City Law at full size', () => {
    expect(cityViolations(MAPS.brickton)).toEqual([]);
    expect(livingCityViolations(MAPS.brickton)).toEqual([]);
  });

  it('keeps every fixed connection: the overpass, the docks, the Cage', () => {
    const b = MAPS.brickton;
    // The clockwise-rotated Long Walk arrives through Twoton's NORTH edge.
    // Its return is re-aimed off the live overpass trail, never a baked pixel.
    const foot = b.doors.find((d) => d.to === 'meadow_overpass');
    expect(foot).toBeDefined();
    expect(foot?.y).toBe(0);
    expect(foot?.facing).toBe('up');
    const overpassReturnRow = MAPS.meadow_overpass.grid.length - 5;
    const overpassReturnCol = MAPS.meadow_overpass.grid[overpassReturnRow].indexOf(':');
    expect(overpassReturnCol).toBeGreaterThanOrEqual(0);
    expect(foot?.tx).toBe(overpassReturnCol * 16 + 8);
    expect(foot?.ty).toBe(overpassReturnRow * 16);
    expect(foot && !'beEKW|-OBCZJ'.includes(MAPS.meadow_overpass.grid[foot.ty >> 4][foot.tx >> 4])).toBe(true);
    expect(b.doors.some((d) => d.to === 'meadow_mile')).toBe(false); // ADR-056 holds
    expect(b.doors.some((d) => d.to === 'brickton_docks')).toBe(true);
    expect(b.doors.some((d) => d.to === 'cage_park')).toBe(true);
    expect(MAPS.cage_park.doors.some((d) => d.to === 'the_cage')).toBe(true); // the park still leads in
    // the docks' return door lands just inside the east gate, ON the drag (walkable road)
    const back = MAPS.brickton_docks.doors.find((d) => d.to === 'brickton');
    expect(back?.tx).toBe(BRICKTON_DOCKS_RETURN.tx);
    expect(back?.ty).toBe(BRICKTON_DOCKS_RETURN.ty);
    const ch = b.grid[BRICKTON_DOCKS_RETURN.ty >> 4][BRICKTON_DOCKS_RETURN.tx >> 4];
    expect('RD_XP123'.includes(ch), `docks return tile '${ch}'`).toBe(true);
  });

  it('the ten NAMED interiors keep their grafted facade doors (makeTwoton)', () => {
    // (spire_lobby moved to Valle Dorado with the Starfall Spire — stage 4)
    const doors = MAPS.brickton.props.filter((p) => p.door).map((p) => p.door?.to);
    for (const to of [
      'dos_f1', 'starmart_int', 'hospital_int', 'arcade2_int',
      'twoton_hotel_lobby', 'twoton_bus_station', 'twoton_theater', 'twoton_community_center',
      'twoton_bike_shop', 'twoton_pizza',
    ]) {
      expect(doors, to).toContain(to);
    }
  });

  it('uses continuous forest fronts and an active market instead of empty scatter', () => {
    const b = MAPS.brickton;
    const fronts = b.props.filter((p) => /^treeline_(2|4|8)(_b)?$/.test(p.sprite));
    expect(fronts.length).toBeGreaterThanOrEqual(12);
    expect(b.npcs.filter((n) => n.shop).length).toBeGreaterThanOrEqual(2);
    expect(b.props.filter((p) => p.sprite.startsWith('market_stall_')).length).toBeGreaterThanOrEqual(5);
    for (const p of fronts) {
      const width = Number(/^treeline_(2|4|8)/.exec(p.sprite)?.[1] ?? 0);
      const forestRow = Math.round(p.y + 1.5);
      for (let x = Math.floor(p.x); x < Math.floor(p.x) + width; x++) {
        expect(b.grid[forestRow]?.[x], `${p.sprite} at ${p.x},${p.y} covers non-forest`).toBe('b');
      }
    }
  });

  it('keeps the Cage lot notice outside the transition-only fence', () => {
    const lot = MAPS.brickton.signs.find((s) => s.dialogue === 'sign_lot');
    expect(lot).toBeDefined();
    expect(lot?.x).toBeLessThan(82);
  });

  it('keeps full landmark-house footprints off the roads and parked cars solid', () => {
    const b = MAPS.brickton;
    for (const p of b.props.filter((prop) => prop.sprite === 'house_a' || prop.sprite === 'house_b')) {
      const width = p.sprite === 'house_a' ? 7.15 : 6.2;
      for (let y = Math.floor(p.y); y < Math.ceil(p.y + 6); y++) {
        for (let x = Math.floor(p.x); x < Math.ceil(p.x + width); x++) {
          expect('RDX'.includes(b.grid[y]?.[x] ?? 'R'), `${p.sprite} overlaps road at ${x},${y}`).toBe(false);
        }
      }
    }
    const parked = b.props.filter((p) => p.sprite === 'vehicle_clunker');
    expect(parked.length).toBeGreaterThanOrEqual(2);
    for (const p of parked) {
      expect(p.solid, `parked car at ${p.x},${p.y} collision`).toBeDefined();
      const cx = Math.floor((p.x * 16 + (p.solid?.ox ?? 0)) / 16);
      const cy = Math.floor((p.y * 16 + (p.solid?.oy ?? 0)) / 16);
      expect('RDX'.includes(b.grid[cy]?.[cx] ?? ''), `parked car at ${p.x},${p.y} road placement`).toBe(true);
    }
  });

  it('starts the bus-corner and market NPCs clear of static props', () => {
    const b = MAPS.brickton;
    const overlaps = (a: { x: number; y: number; w: number; h: number }, c: { x: number; y: number; w: number; h: number }): boolean =>
      a.x < c.x + c.w && a.x + a.w > c.x && a.y < c.y + c.h && a.y + a.h > c.y;
    for (const id of ['quarter_man', 'new_commuter']) {
      const npc = b.npcs.find((n) => n.id === id);
      expect(npc, id).toBeDefined();
      const body = { x: (npc?.x ?? 0) * 16 - 6, y: (npc?.y ?? 0) * 16 - 10, w: 12, h: 10 };
      for (const p of b.props.filter((prop) => prop.solid)) {
        const solid = p.solid!;
        const propBody = { x: p.x * 16 + solid.ox, y: p.y * 16 + solid.oy, w: solid.w, h: solid.h };
        expect(overlaps(body, propBody), `${id} overlaps ${p.sprite} at ${p.x},${p.y}`).toBe(false);
      }
    }
  });

  it('gives both hand-drawn landmark houses a porch interaction', () => {
    const b = MAPS.brickton;
    const houses = b.props.filter((p) => p.sprite === 'house_a' || p.sprite === 'house_b');
    expect(houses.length).toBe(2);
    for (const p of houses) {
      const width = p.sprite === 'house_a' ? 7.15 : 6.2;
      const center = p.x + width / 2;
      expect(
        b.signs.some((s) => s.dialogue.startsWith('cl_knock_') && Math.abs(s.x - center) <= 1 && Math.abs(s.y - (p.y + 6)) <= 1),
        `${p.sprite} at ${p.x},${p.y}`,
      ).toBe(true);
    }
  });

  it('keeps street story triggers while the return bus lives only inside its station', () => {
    // (the CLOCK story — THE MINUTE — moved to Valle Dorado, stage 4: see below)
    const ids = MAPS.brickton.triggers.map((t) => t.id);
    for (const id of ['brickton_dial_goal', 'payphone_ring']) {
      expect(ids, id).toContain(id);
    }
    expect(ids).not.toContain('bus_stop_brickton');
    expect(MAPS.twoton_bus_station.triggers.some((t) => t.id === 'bus_stop_brickton')).toBe(true);
    expect(MAPS.brickton.props.some((p) => p.sprite === 'cage_gate')).toBe(true);
  });

  it('the bus + north-entry foot spawns land safely, and the bus never re-triggers itself', () => {
    const b = MAPS.brickton;
    const walkable = (px: { x: number; y: number }): boolean =>
      'RD_XP123=:'.includes(b.grid[px.y >> 4][px.x >> 4]);
    expect(walkable(BRICKTON_BUS_SPAWN)).toBe(true);
    expect(walkable(BRICKTON_FOOT_SPAWN)).toBe(true);
    expect(b.grid[BRICKTON_BUS_SPAWN.y >> 4][BRICKTON_BUS_SPAWN.x >> 4]).toBe('=');
    expect(b.triggers.some((t) => t.id === 'bus_stop_brickton')).toBe(false);
    const north = b.doors.find((d) => d.to === 'meadow_overpass');
    expect(north).toBeDefined();
    expect(BRICKTON_FOOT_SPAWN.y >> 4).toBeGreaterThan(0);
    expect(BRICKTON_FOOT_SPAWN.y >> 4).toBeLessThanOrEqual(6);
    expect(BRICKTON_FOOT_SPAWN.x >> 4).toBeGreaterThanOrEqual((north?.x ?? 0) - 2);
    expect(BRICKTON_FOOT_SPAWN.x >> 4).toBeLessThanOrEqual((north?.x ?? 0) + (north?.w ?? 1) + 1);
  });

  it('every purpose-built service returns to its own clear sidewalk', () => {
    const b = MAPS.brickton;
    for (const id of [
      'twoton_hotel_lobby', 'twoton_bus_station', 'twoton_theater',
      'twoton_community_center', 'twoton_bike_shop', 'twoton_pizza',
    ]) {
      const room = MAPS[id];
      const back = room.doors.find((d) => d.to === 'brickton');
      expect(back, `${id} return door`).toBeDefined();
      const ch = back ? b.grid[back.ty >> 4]?.[back.tx >> 4] : undefined;
      expect(ch, `${id} return tile`).toBe('=');
      expect(b.props.some((p) => p.door?.to === id), `${id} exterior door`).toBe(true);
    }
  });

  it('holds the XL envelope and occupy gave the catalog facades purpose', () => {
    const b = MAPS.brickton;
    expect(b.grid[0].length * b.grid.length).toBeLessThanOrEqual(12000);
    expect(b.props.length).toBeLessThanOrEqual(700); // the EB tree-lined read costs props; still far under Otterbrook's ~3.4k
    // Twoton uses lot-stable tenancy ids: adding a named venue cannot renumber
    // every later generated interior in an existing save.
    expect(b.props.some((p) => p.door?.to.startsWith('brickton_lot_'))).toBe(true);
    expect(b.props.some((p) => p.door?.to.startsWith('brickton_unit_'))).toBe(false);
  });
});

describe('PUERTO SOL — the editor-authored Threed rebuild (2026-07-08)', () => {
  // buildPuertoSol (1898 frozen core) + growPuertoSol are RETIRED — the port is
  // the map-editor DOCUMENT (maps_puerto_sol.ts ⇄ tools/mapeditor/puerto_sol.json),
  // so these pins assert the LIVE invariants every system depends on.

  it('is the editor document, registered live (name, size, settlement)', () => {
    const p = MAPS.puerto_sol;
    expect(p.name).toBe('PUERTO SOL');
    expect(p.settlement).toBe('city');
    expect(p.grid[0].length).toBe(100);
    expect(p.grid.length).toBe(72);
  });

  it('clears the ADR-012 city sweep AND the Living-City Law', () => {
    expect(cityViolations(MAPS.puerto_sol)).toEqual([]);
    expect(livingCityViolations(MAPS.puerto_sol)).toEqual([]);
  });

  it('the five NAMED interiors keep their grafted facade doors (makePuertoSol)', () => {
    const doors = MAPS.puerto_sol.props.filter((p) => p.door).map((p) => p.door?.to);
    for (const to of ['mercado_int', 'clinic_ps_int', 'museum_int', 'deli_int', 'hotel_ps_lobby']) {
      expect(doors, to).toContain(to);
    }
  });

  it('the boat round-trip + the arrival + the malecón beats survive on the quay', () => {
    const p = MAPS.puerto_sol;
    expect(p.props.some((pr) => pr.sprite === 'banana_boat')).toBe(true);
    expect(p.props.some((pr) => pr.sprite === 'departure_board')).toBe(true);
    for (const id of ['board_boat_return', 'puerto_arrival', 'puerto_malecon']) {
      expect(p.triggers.map((t) => t.id), id).toContain(id);
    }
    // the pier spawn (the boat drops you here) is a walkable quay tile
    const ch = p.grid[PUERTO_SOL_PIER_SPAWN.y >> 4][PUERTO_SOL_PIER_SPAWN.x >> 4];
    expect('d=Rp:D_X123'.includes(ch), `pier tile '${ch}'`).toBe(true);
  });

  it('the three §A8 gift caches keep their flag pairs', () => {
    const p = MAPS.puerto_sol;
    for (const flag of ['ps_dock_gift', 'mercado_stall', 'gift_doubloon']) {
      expect(p.props.some((pr) => pr.sprite === 'gift_box' && pr.unlessFlag === flag), flag).toBe(true);
      expect(p.signs.some((s) => s.dialogue === flag && s.unlessFlag === flag), flag).toBe(true);
    }
    expect(p.props.filter((pr) => pr.sprite === 'picnic').length).toBe(2); // the §A4.5 pair holds
  });

  it('the corridor gates are wired both ways with COMPUTED landings', () => {
    const p = MAPS.puerto_sol;
    expect(p.doors.some((d) => d.to === 'costa_estrella')).toBe(true);
    const east = p.doors.find((d) => d.to === 'jungle_1');
    expect(east).toBeDefined();
    // the desert road's return lands just inside the port's east gate, on road
    const back = MAPS.jungle_1.doors.find((d) => d.to === 'puerto_sol');
    expect(back?.tx).toBe(PUERTO_SOL_JUNGLE_RETURN.tx);
    expect(back?.ty).toBe(PUERTO_SOL_JUNGLE_RETURN.ty);
    const ch = p.grid[PUERTO_SOL_JUNGLE_RETURN.ty >> 4][PUERTO_SOL_JUNGLE_RETURN.tx >> 4];
    expect('R=D_XP123:'.includes(ch), `return tile '${ch}'`).toBe(true);
  });
});

describe('LAS DUNAS — the Dusty Dunes crossing (jungle_1/jungle_2, 2026-07-08)', () => {
  it('the legs are the desert now, chained both ways on walkable landings', () => {
    const w = MAPS.jungle_1;
    const e = MAPS.jungle_2;
    expect(w.name).toBe('LAS DUNAS DESERT');
    expect(e.name).toBe('DEEP DUNAS');
    const walkable = (m: typeof w, tx: number, ty: number): boolean =>
      !'beEKW|-'.includes(m.grid[ty >> 4][tx >> 4]);
    for (const [m, to] of [
      [w, 'jungle_2'],
      [e, 'jungle_1'],
      [e, 'valle_dorado'],
    ] as const) {
      const d = m.doors.find((dd) => dd.to === to);
      expect(d, `${m.id}→${to}`).toBeDefined();
      const target = MAPS[to];
      expect(d && walkable(target, d.tx, d.ty), `${m.id}→${to} landing`).toBe(true);
    }
  });

  it('the grotto + the emerald rest survive in the deep desert', () => {
    const e = MAPS.jungle_2;
    expect(e.doors.some((d) => d.to === 'grotto')).toBe(true);
    expect(e.props.some((p) => p.sprite === 'gift_box' && p.unlessFlag === 'gift_emerald')).toBe(true);
    expect(e.props.some((p) => p.sprite === 'picnic')).toBe(true);
    // desert dressing actually shipped (cacti + rocks + an oasis pool)
    expect(e.props.some((p) => p.sprite === 'edge_desert_cactus')).toBe(true);
    expect(e.grid.some((row) => row.includes('e'))).toBe(true);
  });
});

describe('VALLE DORADO — the Fourside golden city (stage 4, 2026-07-08)', () => {
  it('is a CITY now and clears the ADR-012 sweep + the Living-City Law', () => {
    const v = MAPS.valle_dorado;
    expect(v.settlement).toBe('city');
    expect(cityViolations(v)).toEqual([]);
    expect(livingCityViolations(v)).toEqual([]);
  });

  it('inherited the skyline: the Starfall Spire (lobby door) + the three towers', () => {
    const v = MAPS.valle_dorado;
    expect(v.props.some((p) => p.sprite === 'bldg_colossus_spire' && p.door?.to === 'spire_lobby')).toBe(true);
    for (const t of ['bldg_tower_arms', 'bldg_tower_glass', 'bldg_tower_corp']) {
      expect(v.props.some((p) => p.sprite === t), t).toBe(true);
    }
  });

  it('THE GOLDEN MINUTE lives here now: clock prop + clock lady + the goal trigger', () => {
    const v = MAPS.valle_dorado;
    expect(v.props.some((p) => p.sprite === 'town_clock')).toBe(true);
    expect(v.npcs.some((n) => n.id === 'clock_lady')).toBe(true);
    const trig = v.triggers.find((t) => t.id === 'brickton_clock_goal');
    expect(trig).toBeDefined();
    // the trigger rect covers the clock so the beat fires at the plaza
    const clock = v.props.find((p) => p.sprite === 'town_clock');
    expect(
      trig && clock && clock.x >= trig.rect.x - 1 && clock.x <= trig.rect.x + trig.rect.w + 1,
    ).toBe(true);
    // and Twoton no longer carries it (the beat MOVED, not copied)
    expect(MAPS.brickton.triggers.some((t) => t.id === 'brickton_clock_goal')).toBe(false);
    expect(MAPS.brickton.props.some((p) => p.sprite === 'town_clock')).toBe(false);
  });

  it('the old quarter keeps its named doors + the shrine + the pyramid gate', () => {
    const v = MAPS.valle_dorado;
    const doors = v.props.filter((p) => p.door).map((p) => p.door?.to);
    for (const to of ['valle_shop_int', 'clinic_valle_int', 'chapel_valle_int']) {
      expect(doors, to).toContain(to);
    }
    expect(v.props.some((p) => p.sprite === 'idol_shrine')).toBe(true);
    expect(v.doors.some((d) => d.to === 'pyramid_ante')).toBe(true);
    expect(v.doors.some((d) => d.to === 'jungle_2')).toBe(true);
    expect(v.triggers.some((t) => t.id === 'valle_arrival')).toBe(true);
    // the pyramid's RETURN lands on a walkable Valle tile just inside the south gate
    const back = MAPS.pyramid_ante.doors.find((d) => d.to === 'valle_dorado');
    expect(back).toBeDefined();
    const ch = back ? v.grid[back.ty >> 4][back.tx >> 4] : '#';
    expect('R=D_XP123:p'.includes(ch), `pyramid return tile '${ch}'`).toBe(true);
  });
});
