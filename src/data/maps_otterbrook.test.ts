/**
 * OTTERBROOKE — the rebuilt Onett town (World Overhaul S5, Ch.1 pilot).
 *
 * The old frozen-1995-core contract is RETIRED (user directive 2026-07-03: scrap
 * the town, rebuild ground-up Onett-faithful). This guard pins the NEW invariants
 * of the from-scratch town: it is deterministic, stays a TOWN, keeps every fixed
 * external warp + the opening anchors, and every authored destination building is
 * placed and doored to a real, two-way interior. Mirrors maps_foggybottom.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { growOtterbrook, OTTERBROOK_EAST_GATE, MAPS } from './maps';

describe('OTTERBROOKE — the rebuilt Onett town', () => {
  const ob = MAPS.otterbrook;

  it('two fresh builds are byte-identical (deterministic, seeded only)', () => {
    const a = growOtterbrook();
    const b = growOtterbrook();
    expect(a.grid.join('|')).toBe(b.grid.join('|'));
    expect(JSON.stringify(a.props)).toBe(JSON.stringify(b.props));
    expect(JSON.stringify(a.npcs)).toBe(JSON.stringify(b.npcs));
  });

  it('the live MAPS grid matches a fresh build (the living-city pass adds props, never re-paints)', () => {
    expect(MAPS.otterbrook.grid.join('|')).toBe(growOtterbrook().grid.join('|'));
  });

  it('stays a TOWN, sized to the elevated regional envelope', () => {
    expect(ob.settlement).toBe('town');
    const tiles = ob.grid[0].length * ob.grid.length;
    expect(tiles).toBeLessThanOrEqual(23000);
    expect(ob.props.length).toBeLessThanOrEqual(450);
  });

  it('is ONE elevated map (no north map-transition; the crater is walkable up the terraces)', () => {
    // there is NO hill_road door anymore — the hill is on this map now
    expect(ob.doors.some((d) => d.to === 'hill_road')).toBe(false);
    // EAST — MEADOW MILE, landing at the exported east gate (meadow_mile reads the const)
    const east = ob.doors.find((d) => d.to === 'meadow_mile');
    expect(east?.y).toBe(OTTERBROOK_EAST_GATE.y);
    expect(MAPS.meadow_mile.doors.find((d) => d.to === 'otterbrook')?.tx).toBe(OTTERBROOK_EAST_GATE.x * 16);
    // the hilltop CAVE leads to the Titanic Tick dungeon (re-homed from the Pond-Park burrow)
    expect(ob.doors.some((d) => d.to === 'oak_roots')).toBe(true);
  });

  it('declares a well-formed 4-terrace elevation plane (crater L3 top → town L0 bottom)', () => {
    expect(ob.elevation, 'otterbrook must declare elevation').toBeDefined();
    const level = ob.elevation!.level;
    // dims match the grid exactly (row-for-row, col-for-col)
    expect(level.length).toBe(ob.grid.length);
    for (let y = 0; y < ob.grid.length; y++) expect(level[y].length).toBe(ob.grid[y].length);
    // all four terrace levels appear; the crest (row 0) is L3, the town floor (last row) is L0
    const flat = level.join('');
    for (const lv of ['0', '1', '2', '3']) expect(flat.includes(lv), `level ${lv}`).toBe(true);
    expect(level[0].includes('3')).toBe(true); // the crater crest
    expect(level[ob.grid.length - 1].split('').every((c) => c === '0')).toBe(true); // the town floor
    // the seams exist: K cliff-faces + T stairs are painted into the grid
    const gflat = ob.grid.join('');
    expect(gflat.includes('K')).toBe(true);
    expect(gflat.includes('T')).toBe(true);
  });

  it('the crater set-piece + the hilltop cave are on the crest (L3)', () => {
    expect(ob.props.some((p) => p.sprite === 'meteor_rock_hickory_hill')).toBe(true);
    expect(ob.triggers.some((t) => t.id === 'crater')).toBe(true);
    expect(ob.props.some((p) => p.sprite === 'burrow_mouth')).toBe(true); // the cave mouth (gray-box)
  });

  it('the opening anchors survive (house_rex + rex_home door + the porch trigger)', () => {
    expect(ob.props.some((p) => p.sprite === 'house_rex' && p.door?.to === 'rex_home')).toBe(true);
    expect(ob.triggers.some((t) => t.id === 'porch')).toBe(true);
  });

  it('every authored destination building is placed + doored to a real, two-way interior', () => {
    const wiring: ReadonlyArray<readonly [string, string]> = [
      ['drugstore', 'drugstore_int'],
      ['arcade', 'arcade_int'],
      ['facade_otter_station', 'otter_station'],
      ['bldg_ob_city_hall', 'otterbrook_cityhall'],
      ['chapel', 'chapel_int'],
      ['facade_busdepot', 'bus_depot_int'],
      ['bldg_brickmore', 'downtown_otterbrook'],
      ['bldg_bank', 'bank_int'],
      ['bldg_ob_bakery', 'bakery_int'],
      ['bldg_ob_burger', 'burger_int'],
    ];
    for (const [sprite, to] of wiring) {
      expect(ob.props.some((p) => p.sprite === sprite && p.door?.to === to), `${sprite} → ${to}`).toBe(true);
      expect(MAPS[to], `${to} exists`).toBeDefined();
      expect(MAPS[to].doors.some((d) => d.to === 'otterbrook'), `${to} → otterbrook`).toBe(true);
    }
  });

  it('the hospital + residential + apartment fabric is placed', () => {
    for (const s of ['bldg_ob_clinic', 'house_rex', 'house_chad', 'house_a', 'house_b', 'bldg_apartments', 'bldg_ob_apt_green']) {
      expect(ob.props.some((p) => p.sprite === s), s).toBe(true);
    }
  });

  it('has Pond Park (the Heart Oak), a save payphone, and the daybreak barricade', () => {
    expect(ob.props.some((p) => p.sprite === 'tree_c')).toBe(true); // the Heart Oak
    expect(ob.phones.length).toBeGreaterThanOrEqual(1);
    expect(ob.props.some((p) => p.sprite === 'sawhorse' && p.unlessFlag === 'tick_defeated')).toBe(true);
  });

  it('the three new storefront stubs are enterable + savable', () => {
    for (const id of ['bank_int', 'bakery_int', 'burger_int']) {
      const m = MAPS[id];
      expect(m, id).toBeDefined();
      expect(m.interior, id).toBe(true);
      expect(m.phones.length, `${id} save phone`).toBeGreaterThanOrEqual(1);
      expect(m.doors.some((d) => d.to === 'otterbrook'), `${id} exit`).toBe(true);
    }
  });
});
