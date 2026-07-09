/**
 * OTTERBROOKE -- reference-inspired playable rebuild.
 *
 * The reference image is a layout/style guide, not a backdrop. The shipped map is
 * a real EarthBound-style tile scene: terrain, props, depth-sorted facades,
 * facade doors, NPCs, signs, elevation, and generated residential interiors.
 */
import { describe, expect, it } from 'vitest';
import { growOtterbrook, OTTERBROOK_EAST_GATE, MAPS } from './maps';

describe('OTTERBROOKE -- playable reference rebuild', () => {
  const ob = MAPS.otterbrook;
  const hasEntry = (id: string): boolean => ob.props.some((p) => p.door?.to === id) || ob.doors.some((d) => d.to === id);

  it('two fresh builds are byte-identical before the living-city pass', () => {
    const a = growOtterbrook();
    const b = growOtterbrook();
    expect(a.grid.join('|')).toBe(b.grid.join('|'));
    expect(JSON.stringify(a.props)).toBe(JSON.stringify(b.props));
    expect(JSON.stringify(a.npcs)).toBe(JSON.stringify(b.npcs));
  });

  it('the live MAPS grid matches a fresh build', () => {
    expect(MAPS.otterbrook.grid.join('|')).toBe(growOtterbrook().grid.join('|'));
  });

  it('is a real tile-and-prop town, not a zero-prop backdrop', () => {
    expect(ob.settlement).toBe('town');
    expect(ob.grid[0].length).toBe(112);
    expect(ob.grid.length).toBe(66 + 160); // hill (66) + town grown southward to 160 for the long approach
    expect(ob.props.length).toBeGreaterThan(40);
    expect(ob.props.filter((p) => p.sprite.startsWith('bldg_gen_'))).toEqual([]);
    for (const sprite of [
      'house_rex',
      'house_chad',
      'meteor_rock_hickory_hill',
      'bldg_ob_city_hall',
      'bldg_ob_house_green',
      'bldg_ob_house_c',
      'bldg_ob_cottage',
      'bldg_ob_workshop',
      'drugstore',
      'arcade',
      'chapel',
      'house_maple', // 27 MAPLE — the for-sale house (flag-gated door pair)
      'facade_realty', // OTTERBROOK REALTY
      'facade_autolot', // Bert's used cars
    ]) {
      expect(ob.props.some((p) => p.sprite === sprite), sprite).toBe(true);
    }
    // 27 Maple is the flag-gated pair: doorless until owned, doored after
    const m27 = ob.props.filter((p) => p.sprite === 'house_maple');
    expect(m27).toHaveLength(2);
    expect(m27.find((p) => p.unlessFlag === 'owned_27_maple')?.door).toBeUndefined();
    expect(m27.find((p) => p.ifFlag === 'owned_27_maple')?.door?.to).toBe('maple27_int');
  });

  it('keeps one elevated map with the meadow gate and hill cave wired', () => {
    expect(ob.doors.some((d) => d.to === 'hill_road')).toBe(false);
    const east = ob.doors.find((d) => d.to === 'meadow_mile');
    expect(east?.x).toBe(OTTERBROOK_EAST_GATE.x);
    expect(east?.y).toBe(OTTERBROOK_EAST_GATE.y);
    expect(MAPS.meadow_mile.doors.find((d) => d.to === 'otterbrook')?.tx).toBe(OTTERBROOK_EAST_GATE.x * 16);
    // exactly ONE cave entry now — the hilltop mouth (top-left); the lower-town burrow is retired
    const caveEntries = ob.doors.filter((d) => d.to === 'oak_roots');
    expect(caveEntries).toHaveLength(1);
    expect(caveEntries[0].tx).toBe(14 * 16 + 8);
    // lands one row above the cave's row-38 exit pad (row 39 is solid wall — the
    // old pad there was unreachable, so leaving the cave on foot was impossible)
    expect(caveEntries[0].ty).toBe(37 * 16);
    const rootsExit = MAPS.oak_roots.doors.find((d) => d.to === 'otterbrook');
    expect(rootsExit?.tx).toBe(7 * 16 + 8); // surface return lands below the top-left-corner cave mouth
    expect(rootsExit?.ty).toBe(11 * 16);
    expect(hasEntry('rex_home')).toBe(true);
  });

  it('declares a well-formed 6-level elevation plane (crest -> benches -> base -> shelf -> town)', () => {
    expect(ob.elevation, 'otterbrook must declare elevation').toBeDefined();
    const level = ob.elevation!.level;
    expect(level.length).toBe(ob.grid.length);
    for (let y = 0; y < ob.grid.length; y++) expect(level[y].length).toBe(ob.grid[y].length);
    const flat = level.join('');
    // L5 crater crest / L4 police bench / L3 Fibbins bench / L2 base / L1 shelf / L0 town
    for (const lv of ['0', '1', '2', '3', '4', '5']) expect(flat.includes(lv), `level ${lv}`).toBe(true);
    expect(level[0].includes('5')).toBe(true); // the crater crest is the top level
    expect(level[ob.grid.length - 1].split('').every((c) => c === '0')).toBe(true);
    expect(ob.grid.join('').includes('K')).toBe(true);
    expect(ob.grid.join('').includes('T')).toBe(true);
  });

  it('matches the reference hill grammar: two winding paths (right→crater, left→cave)', () => {
    const onTrail = (x: number, y: number): boolean => [':', 'T'].includes(ob.grid[y][x]);
    // the WINDING CLIMB (2026-07-08, terraced): three switchback legs, each one
    // terrace up via a 'T' flight, then the scree zig-zag to the bowl — one pin
    // per leg AND per flight, so a reroute that drops a step fails loudly
    for (const [x, y] of [
      [64, 41], // Leg 1 (L2) — weaving east along the low treeline
      [87, 35], // flight B — the east stairs
      [74, 31], // Leg 2 (L3) — west past Old Man Fibbins' door
      [44, 25], // flight C — the west stairs
      [50, 20], // Leg 3 (L4) — east into the police muster
      [47, 17], // flight D — the last stairs (the cordon's foot)
      [43, 12], // scree zig-zag (L5)
      [48, 10], // scree zig-zag (L5)
      [53, 6], // the bowl's west-apron entry
      [48, 28], // the hairpin rest at flight C's bend (picnic + present ON the road)
      [55, 51], // the terrace walk
      [56, 57],
    ]) {
      expect(onTrail(x, y), `right (crater) path @${x},${y}`).toBe(true);
    }
    for (const [x, y] of [
      [7, 12], // the corridor below the top-left-corner cave shelf
      [11, 33], // the shed pocket's south walk
      [20, 42], // the mower lane
      [26, 44],
      [26, 60],
    ]) {
      expect(onTrail(x, y), `left (cave) path @${x},${y}`).toBe(true);
    }
    // the SEALING TREELINE (user 2026-07-09): the x28-39 band stays solid woods the
    // full hill height, so the cave/shed corridor is detached from the climb — a
    // reconnecting trail or carve here fails loudly
    for (const y of [4, 12, 20, 28, 36, 44]) {
      for (let x = 28; x <= 39; x++) {
        expect(ob.grid[y][x], `treeline breach @${x},${y}`).toBe('b');
      }
    }
  });

  it('preserves the crater, porch, and civic/shop destinations', () => {
    expect(ob.triggers.some((t) => t.id === 'crater')).toBe(true);
    expect(ob.triggers.some((t) => t.id === 'porch')).toBe(true);
    for (const id of [
      'otterbrook_cityhall',
      'drugstore_int',
      'bus_depot_int',
      'downtown_otterbrook',
      'burger_int',
      'bank_int',
      'bakery_int',
      'arcade_int',
      'chapel_int',
      'otter_station',
      'realty_int', // the agency office (agencyBeat's realtor works here now)
      'oldman_int', // Fibbins' cottage on the crater trail
      'maple27_int', // 27 Maple (flag-gated door — the def still carries it)
    ]) {
      expect(hasEntry(id), `otterbrook -> ${id}`).toBe(true);
      expect(MAPS[id], `${id} exists`).toBeDefined();
      expect(MAPS[id].doors.some((d) => d.to === 'otterbrook'), `${id} -> otterbrook`).toBe(true);
    }
  });

  it('keeps named houses accessible and ordinary facades inhabited', () => {
    for (const id of ['chad_home', 'otter_home_sodd', 'otter_home_birch', 'otter_home_pond', 'workshop_int']) {
      expect(hasEntry(id), `otterbrook -> ${id}`).toBe(true);
      expect(MAPS[id], `${id} exists`).toBeDefined();
      expect(MAPS[id].doors.some((d) => d.to === 'otterbrook'), `${id} -> otterbrook`).toBe(true);
    }
    const generatedHomes = ob.props.filter((p) => p.door?.to.startsWith('otterbrook_unit_'));
    expect(generatedHomes.length).toBeGreaterThanOrEqual(5);
    for (const p of generatedHomes) expect(MAPS[p.door!.to]?.doors.some((d) => d.to === 'otterbrook')).toBe(true);
  });

  it('connects the town road grid and gives every house a gated walk to its door', () => {
    const roadChars = new Set(['R', 'D', '_']);
    const seen = new Set<string>();
    const roadComponents: number[] = [];
    for (let y = 0; y < ob.grid.length; y++) {
      for (let x = 0; x < ob.grid[y].length; x++) {
        const start = `${x},${y}`;
        if (!roadChars.has(ob.grid[y][x]) || seen.has(start)) continue;
        const q: Array<[number, number]> = [[x, y]];
        seen.add(start);
        for (let i = 0; i < q.length; i++) {
          const [cx, cy] = q[i];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = cx + dx;
            const ny = cy + dy;
            const key = `${nx},${ny}`;
            if (nx < 0 || ny < 0 || ny >= ob.grid.length || nx >= ob.grid[ny].length) continue;
            if (!roadChars.has(ob.grid[ny][nx]) || seen.has(key)) continue;
            seen.add(key);
            q.push([nx, ny]);
          }
        }
        roadComponents.push(q.length);
      }
    }
    expect(roadComponents).toHaveLength(1);

    const frontageChars = new Set(['=', ':', 'R', 'D', '_', 'X']);
    const houses = ob.props.filter((p) => /^(house_|bldg_ob_house|bldg_ob_cottage)/.test(p.sprite));
    expect(houses.length).toBeGreaterThanOrEqual(15);
    for (const p of houses) {
      const cx = Math.round(p.x + (p.solid?.w ?? 96) / 32);
      const bottom = Math.round(p.y + 6);
      expect(frontageChars.has(ob.grid[bottom + 1]?.[cx]), `${p.sprite} @${cx},${bottom + 1} has a doorstep walk`).toBe(true);
    }
    expect([...ob.grid.join('')].filter((c) => c === '-' || c === '|').length).toBeGreaterThan(90);
  });

  it('keeps Pond Park, save points, and the restored rest spots', () => {
    expect(ob.reflect?.some((z) => z.x === 2 && z.y === 132 && z.w === 18 && z.h === 16)).toBe(true);
    expect(ob.phones.length).toBeGreaterThanOrEqual(1);
    // town green + terrace + the climb's HAIRPIN REST (picnic beside the present)
    expect(ob.props.filter((p) => p.sprite === 'picnic')).toHaveLength(3);
    // the re-homed hill present (otter_woods_gift — Star Cola) is placed + gated
    expect(ob.props.some((p) => p.sprite === 'gift_box' && p.unlessFlag === 'otter_woods_gift')).toBe(true);
    expect(ob.props.some((p) => p.sprite === 'gift_box_open' && p.ifFlag === 'otter_woods_gift')).toBe(true);
    expect(ob.signs.some((s) => s.dialogue === 'otter_woods_gift')).toBe(true);
    for (const id of ['bank_int', 'bakery_int', 'burger_int']) {
      const m = MAPS[id];
      expect(m, id).toBeDefined();
      expect(m.interior, id).toBe(true);
      expect(m.phones.length, `${id} save phone`).toBeGreaterThanOrEqual(1);
      expect(m.doors.some((d) => d.to === 'otterbrook'), `${id} exit`).toBe(true);
    }
  });
});
