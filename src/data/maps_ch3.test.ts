/**
 * Chapter 3 production-map contract.
 *
 * Geometry is intentionally free to improve. Stable map ids, route topology,
 * story hosts, tenancy order, authored landmarks, and machine interactions are
 * save- and runtime-facing, so this suite guards those semantics directly.
 */
import { describe, expect, it } from 'vitest';
import { CHAR_LEGEND, MAPS } from './maps';
import {
  buildChapter3Maps,
  FOGGYBOTTOM_LANDING,
  WINTERMOOR_COOLANT_CROSSING,
} from './maps_ch3';

const CH3_MAP_IDS = [
  'biplane_interior',
  'foggybottom',
  'foggy_moor',
  'kettle_taproom',
  'kettle_snug',
  'wintermoor_grounds',
  'the_old_stones',
  'wintermoor_f1',
  'wintermoor_f2',
  'wintermoor_f3',
  'wintermoor_dorm',
  'wintermoor_boiler',
] as const;
type Ch3MapId = (typeof CH3_MAP_IDS)[number];

const RAW = buildChapter3Maps();
const raw = (id: Ch3MapId) => RAW[id]!;
const assembled = (id: Ch3MapId) => MAPS[id]!;

const EXPECTED_DIMS: Record<Ch3MapId, readonly [number, number]> = {
  biplane_interior: [38, 22],
  foggybottom: [60, 52],
  foggy_moor: [126, 96],
  kettle_taproom: [24, 16],
  kettle_snug: [28, 20],
  wintermoor_grounds: [72, 58],
  the_old_stones: [64, 48],
  wintermoor_f1: [64, 42],
  wintermoor_f2: [68, 44],
  wintermoor_f3: [64, 42],
  wintermoor_dorm: [72, 44],
  wintermoor_boiler: [68, 42],
};

function doorTargets(id: Ch3MapId): string[] {
  const m = raw(id);
  return [
    ...m.doors.map((door) => door.to),
    ...m.props.flatMap((prop) => (prop.door ? [prop.door.to] : [])),
  ].sort();
}

describe('Chapter 3 authored roster and geometry', () => {
  it('exports exactly the twelve stable authored map ids (the guest room stays inside the snug)', () => {
    expect(Object.keys(RAW).sort()).toEqual([...CH3_MAP_IDS].sort());
  });

  it.each(CH3_MAP_IDS)('%s assembles as a rectangular, fully-authored map', (id) => {
    const m = raw(id);
    const [width, height] = EXPECTED_DIMS[id];
    expect(MAPS[id], `${id} missing from assembled MAPS`).toBeDefined();
    expect(m.id).toBe(id);
    expect(m.grid).toHaveLength(height);
    expect(m.grid.every((row) => row.length === width), `${id} is ragged`).toBe(true);
    for (const row of m.grid) {
      for (const ch of row) {
        expect(
          ch === ':' || ch === 'r' || Object.prototype.hasOwnProperty.call(CHAR_LEGEND, ch),
          `${id} uses unknown/fallback tile '${ch}'`,
        ).toBe(true);
      }
    }
  });

  it('keeps the rebuilt spaces production-scale rather than legacy box rooms', () => {
    expect(raw('foggy_moor').grid[0].length * raw('foggy_moor').grid.length).toBeGreaterThan(11_000);
    expect(raw('wintermoor_grounds').grid[0].length).toBeGreaterThanOrEqual(72);
    for (const id of ['wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3', 'wintermoor_dorm', 'wintermoor_boiler'] as const) {
      const m = raw(id);
      expect(m.grid[0].length).toBeGreaterThanOrEqual(64);
      expect(m.grid.length).toBeGreaterThanOrEqual(42);
      expect(m.grid.join('').split('').filter((ch) => ch === 'O').length, `${id} needs authored internal walls`).toBeGreaterThan(75);
    }
  });
});

describe('Chapter 3 route topology and Lucille landing', () => {
  const TOPOLOGY: Record<Ch3MapId, string[]> = {
    biplane_interior: ['foggybottom'],
    foggybottom: ['biplane_interior', 'foggy_moor', 'kettle_taproom'],
    foggy_moor: ['foggybottom', 'the_old_stones', 'wintermoor_grounds'],
    kettle_taproom: ['foggybottom', 'kettle_snug'],
    kettle_snug: ['kettle_taproom'],
    wintermoor_grounds: ['foggy_moor', 'wintermoor_f1'],
    the_old_stones: ['foggy_moor'],
    wintermoor_f1: ['wintermoor_boiler', 'wintermoor_f2', 'wintermoor_grounds'],
    wintermoor_f2: ['wintermoor_dorm', 'wintermoor_f1', 'wintermoor_f3'],
    wintermoor_f3: ['wintermoor_f2'],
    wintermoor_dorm: ['wintermoor_f2'],
    wintermoor_boiler: ['wintermoor_f1'],
  };

  it.each(CH3_MAP_IDS)('%s keeps its exact authored route targets', (id) => {
    expect(doorTargets(id)).toEqual([...TOPOLOGY[id]].sort());
    for (const target of doorTargets(id)) {
      expect(MAPS[target], `${id} -> ${target} is dangling`).toBeDefined();
    }
  });

  it('every authored Chapter 3 edge has a reciprocal return', () => {
    for (const id of CH3_MAP_IDS) {
      for (const target of doorTargets(id)) {
        if (!(CH3_MAP_IDS as readonly string[]).includes(target)) continue;
        expect(doorTargets(target as Ch3MapId), `${target} has no return to ${id}`).toContain(id);
      }
    }
  });

  it('Lucille lands on the exported drowned-quay tile and returns to its rebuilt hatch', () => {
    const out = raw('biplane_interior').doors.filter((door) => door.to === 'foggybottom');
    expect(out).toHaveLength(1);
    expect([out[0].tx, out[0].ty]).toEqual([
      FOGGYBOTTOM_LANDING.x * 16,
      FOGGYBOTTOM_LANDING.y * 16,
    ]);
    const back = raw('foggybottom').doors.filter((door) => door.to === 'biplane_interior');
    expect(back).toHaveLength(1);
    expect([Math.floor(back[0].tx / 16), Math.floor(back[0].ty / 16)]).toEqual([19, 19]);
  });

  it('the rebuilt dorm entrance leaves the reciprocal F2 landing walkable', () => {
    expect(raw('wintermoor_dorm').grid[2][36]).toBe('o');
    const door = raw('wintermoor_f2').doors.find((candidate) => candidate.to === 'wintermoor_dorm');
    expect([Math.floor(door!.tx / 16), Math.floor(door!.ty / 16)]).toEqual([36, 2]);
  });
});

describe('Foggybottom settlement and Kettle contracts', () => {
  it('keeps the first four eligible facades in stable tenancy order and skips the hand-doored Kettle', () => {
    const facades = raw('foggybottom').props.filter((prop) => prop.sprite.startsWith('bldg_'));
    const eligible = facades.filter(
      (prop) => prop.solid && !prop.door && !prop.ifFlag && !prop.unlessFlag,
    );
    expect(eligible.map((prop) => prop.sprite)).toEqual([
      'bldg_gen_civic_cyan_3',
      'bldg_gen_brownstone_earth_3',
      'bldg_gen_civic_paper_3',
      'bldg_gen_bank_paper_2',
    ]);
    const kettle = facades.filter((prop) => prop.door?.to === 'kettle_taproom');
    expect(kettle).toHaveLength(1);

    const units = assembled('foggybottom').props
      .filter((prop) => prop.door?.to.startsWith('foggybottom_unit_'))
      .map((prop) => prop.door!.to);
    expect(units).toEqual(['foggybottom_unit_0', 'foggybottom_unit_1', 'foggybottom_unit_2', 'foggybottom_unit_3']);
  });

  it('keeps Foggybottom a four-level town with its assembled ambience and reflective Tyne', () => {
    const fb = assembled('foggybottom');
    expect(fb.settlement).toBe('town');
    expect(fb.area).toBe('foggybottom');
    expect(fb.ambience).toBe('rain');
    expect(fb.atmosphere).toBe('fog');
    expect(fb.reflect?.some((zone) => zone.y <= 49 && zone.y + zone.h >= 52)).toBe(true);
  });

  it('builds a furnished taproom and a physically separated guest room inside the snug', () => {
    const taproom = raw('kettle_taproom');
    const snug = raw('kettle_snug');
    expect(taproom.props.length).toBeGreaterThanOrEqual(15);
    expect(snug.props.length).toBeGreaterThanOrEqual(15);
    expect(snug.props.some((prop) => prop.sprite === 'bed' && prop.x >= 19)).toBe(true);
    expect(snug.grid.filter((row) => row[18] === 'W').length).toBeGreaterThan(10);
    expect(snug.grid.slice(9, 12).every((row) => row[18] === 'w')).toBe(true);
  });
});

describe('Story, quest, NPC, rest, and landmark inventory', () => {
  const TRIGGERS: Partial<Record<Ch3MapId, string[]>> = {
    biplane_interior: ['ch3_arrival'],
    foggybottom: ['q_sender_l1', 'q_sender_l2', 'q_sender_l3'],
    foggy_moor: ['q_penny_found'],
    wintermoor_grounds: ['q_cuppa_milk', 'wm_arrival'],
    the_old_stones: ['old_stones_resonance', 'q_cuppa_water'],
    wintermoor_f1: ['q_overdue_b1'],
    wintermoor_f2: ['q_overdue_b2'],
    wintermoor_f3: ['mainframe_boss'],
    wintermoor_dorm: ['q_overdue_b3'],
    wintermoor_boiler: ['wintermoor_coolant'],
  };

  it.each(Object.entries(TRIGGERS))('%s keeps its trigger ids on the same host', (id, ids) => {
    expect(raw(id as Ch3MapId).triggers.map((trigger) => trigger.id).sort()).toEqual([...ids].sort());
  });

  it('keeps the named story and quest NPC ids on their authored maps', () => {
    const expected: Partial<Record<Ch3MapId, string[]>> = {
      biplane_interior: ['uncle_bert_air'],
      foggybottom: ['fb_boy', 'fb_chemist', 'fb_fishmonger', 'fb_postmistress'],
      kettle_taproom: ['kettle_keeper'],
      kettle_snug: ['kettle_regular'],
      foggy_moor: ['moor_rambler'],
      wintermoor_grounds: ['cricket_captain', 'wm_groundskeeper', 'wm_porter', 'wm_student'],
      wintermoor_f1: ['wm_librarian', 'wm_tuck_keeper'],
      wintermoor_f2: ['wm_umpire'],
      wintermoor_dorm: ['dorm_student'],
    };
    for (const [id, npcIds] of Object.entries(expected)) {
      expect(raw(id as Ch3MapId).npcs.map((npc) => npc.id).sort()).toEqual([...npcIds].sort());
    }
  });

  it.each(['foggybottom', 'foggy_moor', 'wintermoor_grounds'] as const)(
    '%s has exactly one pre-dungeon picnic',
    (id) => expect(raw(id).props.filter((prop) => prop.sprite === 'picnic')).toHaveLength(1),
  );

  const LANDMARKS: Partial<Record<Ch3MapId, string[]>> = {
    biplane_interior: ['ch3_lucille_cockpit', 'ch3_lucille_window', 'ch3_cargo_net'],
    foggybottom: ['ch3_academy_main', 'ch3_telegraph_pole'],
    foggy_moor: ['ch3_viaduct_arch', 'ch3_roman_culvert', 'ch3_academy_main', 'ch3_telegraph_pole'],
    wintermoor_grounds: ['ch3_academy_main', 'ch3_greenhouse_wreck', 'ch3_cricket_pavilion', 'ch3_school_gate', 'ch3_porter_lodge'],
    the_old_stones: ['ch3_menhir', 'ch3_trilithon', 'ch3_spring'],
    wintermoor_f2: ['ch3_valve_manifold'],
    wintermoor_f3: ['ch3_fog_engine', 'ch3_valve_manifold'],
    wintermoor_boiler: ['ch3_fog_engine', 'ch3_valve_manifold'],
  };

  it.each(Object.entries(LANDMARKS))('%s uses its authored Chapter 3 landmark set', (id, sprites) => {
    const have = new Set(raw(id as Ch3MapId).props.map((prop) => prop.sprite));
    for (const sprite of sprites) expect(have, `${id} lost ${sprite}`).toContain(sprite);
  });

  it('keeps landmark openings walkable and retires the closed school gate with story state', () => {
    const viaduct = raw('foggy_moor').props.find((prop) => prop.sprite === 'ch3_viaduct_arch');
    expect(viaduct?.solid).toBeUndefined();
    expect(viaduct?.solidParts).toHaveLength(2);
    const trilithons = raw('the_old_stones').props.filter((prop) => prop.sprite === 'ch3_trilithon');
    expect(trilithons).toHaveLength(4);
    expect(trilithons.every((prop) => prop.solidParts?.length === 2 && !prop.solid)).toBe(true);
    expect(raw('wintermoor_grounds').props.find((prop) => prop.sprite === 'ch3_school_gate')).toMatchObject({
      unlessFlag: 'wm_gate_open',
    });
  });

  it('replaces the old Stones and Boilerworks placeholder art', () => {
    expect(raw('the_old_stones').props.some((prop) => /meteor|space_rock/.test(prop.sprite))).toBe(false);
    const boilerSprites = raw('wintermoor_boiler').props.map((prop) => prop.sprite);
    expect(boilerSprites).not.toContain('water_cooler');
    expect(boilerSprites).not.toContain('copier');
  });

  it('retires machine-fog spawners once the Mainframe is defeated', () => {
    for (const id of CH3_MAP_IDS) {
      for (const spawner of raw(id).spawners) {
        expect(spawner.unlessFlag, `${id} spawner remains after the boss`).toBe('mainframe_defeated');
      }
    }
  });
});

describe('Clicker field machines and the real Freeze crossing', () => {
  it('publishes exactly the two stable machine ids with bounded van controls and action signs', () => {
    const machines = CH3_MAP_IDS.flatMap((id) =>
      raw(id).props.flatMap((prop) => (prop.machine ? [{ map: id, machine: prop.machine }] : [])),
    );
    expect(machines.map(({ machine }) => machine.id).sort()).toEqual([
      'wm_clicker_practice_cart',
      'wm_fogworks_tug',
    ]);
    for (const { map, machine } of machines) {
      expect(machine.vehicleType).toBe('van');
      expect(machine.occupied).toBe(false);
      expect(machine.controlRect).toBeDefined();
      expect(machine.controlRect!.x + machine.controlRect!.w).toBeLessThanOrEqual(raw(map).grid[0].length);
      expect(machine.controlRect!.y + machine.controlRect!.h).toBeLessThanOrEqual(raw(map).grid.length);
    }
    expect(raw('wintermoor_grounds').signs.some((sign) => sign.machineAction === 'wm_clicker_training')).toBe(true);
    expect(raw('wintermoor_boiler').signs.some((sign) => sign.machineAction === 'wm_fogworks_valve')).toBe(true);
  });

  it('owns a visible 5x3 K coolant gate whose runtime-open character is T', () => {
    const boiler = raw('wintermoor_boiler');
    const gate = WINTERMOOR_COOLANT_CROSSING;
    expect(gate.open).toBe('T');
    for (let y = gate.y; y < gate.y + gate.h; y++) {
      expect(boiler.grid[y].slice(gate.x, gate.x + gate.w)).toBe(gate.closed.repeat(gate.w));
    }
    const trigger = boiler.triggers.find((candidate) => candidate.id === 'wintermoor_coolant')!;
    expect(trigger.rect.x).toBeLessThanOrEqual(gate.x);
    expect(trigger.rect.y).toBeLessThanOrEqual(gate.y);
    expect(trigger.rect.x + trigger.rect.w).toBeGreaterThanOrEqual(gate.x + gate.w);
    expect(trigger.rect.y + trigger.rect.h).toBeGreaterThanOrEqual(gate.y + gate.h);
  });

  it('couples the coolant blocker and Fogworks tug art to their persistent phase flags', () => {
    const props = raw('wintermoor_boiler').props;
    const closed = props.find(
      (prop) => prop.x === WINTERMOOR_COOLANT_CROSSING.x && prop.unlessFlag === 'wm_coolant_frozen',
    );
    const open = props.find(
      (prop) => prop.x === WINTERMOOR_COOLANT_CROSSING.x && prop.ifFlag === 'wm_coolant_frozen',
    );
    expect(closed?.solid).toBeDefined();
    expect(open?.solid).toBeUndefined();
    expect(props.some((prop) => prop.machine?.id === 'wm_fogworks_tug' && prop.unlessFlag === 'wm_fogworks_solved')).toBe(true);
    expect(props.some((prop) => prop.sprite === 'work_van' && prop.ifFlag === 'wm_fogworks_solved' && !prop.machine)).toBe(true);
  });
});
