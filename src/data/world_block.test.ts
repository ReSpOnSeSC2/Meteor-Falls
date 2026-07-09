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

describe('TWOTON — the editor-authored Twoson rebuild (map id brickton, 2026-07-08)', () => {
  // The frozen-core pair (buildBrickton 1995 / growBrickton 2077) is RETIRED — the
  // map is now the map-editor DOCUMENT (src/data/maps_twoton.ts ⇄ tools/mapeditor/
  // twoton.json), so these pins assert the LIVE invariants every system depends on,
  // not a generator's byte stream. (The Otterbrook S3 precedent, applied to town #2.)

  it('is the editor document, registered live (name, size, settlement)', () => {
    const b = MAPS.brickton;
    expect(b.name).toBe('TWOTON');
    expect(b.settlement).toBe('city');
    expect(b.grid[0].length).toBe(124);
    expect(b.grid.length).toBe(96);
  });

  it('clears the ADR-012 city sweep AND the Living-City Law at full size', () => {
    expect(cityViolations(MAPS.brickton)).toEqual([]);
    expect(livingCityViolations(MAPS.brickton)).toEqual([]);
  });

  it('keeps every fixed connection: the overpass, the docks, the Cage', () => {
    const b = MAPS.brickton;
    // the long-walk foot gate is re-aimed off the LIVE overpass trail (computed, never baked)
    const foot = b.doors.find((d) => d.to === 'meadow_overpass');
    expect(foot).toBeDefined();
    expect(foot?.tx).toBe((MAPS.meadow_overpass.grid[0].length - 5) * 16 + 8);
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

  it('the four NAMED interiors keep their grafted facade doors (makeTwoton)', () => {
    // (spire_lobby moved to Valle Dorado with the Starfall Spire — stage 4)
    const doors = MAPS.brickton.props.filter((p) => p.door).map((p) => p.door?.to);
    for (const to of ['dos_f1', 'starmart_int', 'hospital_int', 'arcade2_int']) {
      expect(doors, to).toContain(to);
    }
  });

  it('the dial story + the bus + the payphone ring keep their trigger ids', () => {
    // (the CLOCK story — THE MINUTE — moved to Valle Dorado, stage 4: see below)
    const ids = MAPS.brickton.triggers.map((t) => t.id);
    for (const id of ['bus_stop_brickton', 'brickton_dial_goal', 'payphone_ring']) {
      expect(ids, id).toContain(id);
    }
    expect(MAPS.brickton.props.some((p) => p.sprite === 'cage_gate')).toBe(true);
  });

  it('the bus + foot spawns land on open street', () => {
    const b = MAPS.brickton;
    const walkable = (px: { x: number; y: number }): boolean =>
      'RD_XP123=:'.includes(b.grid[px.y >> 4][px.x >> 4]);
    expect(walkable(BRICKTON_BUS_SPAWN)).toBe(true);
    expect(walkable(BRICKTON_FOOT_SPAWN)).toBe(true);
  });

  it('holds the XL envelope and occupy gave the catalog facades purpose', () => {
    const b = MAPS.brickton;
    expect(b.grid[0].length * b.grid.length).toBeLessThanOrEqual(12000);
    expect(b.props.length).toBeLessThanOrEqual(700); // the EB tree-lined read costs props; still far under Otterbrook's ~3.4k
    // tenancy ran: at least one doorless catalog facade became a brickton_unit_*
    expect(b.props.some((p) => p.door?.to.startsWith('brickton_unit_'))).toBe(true);
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
