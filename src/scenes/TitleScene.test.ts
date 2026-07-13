import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class SceneStub {}
  const makeNamespace = (): unknown => {
    const fn = function Stub() {};
    return new Proxy(fn, {
      get: (_target, key) => key === 'Scene' ? SceneStub : makeNamespace(),
      apply: () => makeNamespace(),
      construct: () => ({}),
    });
  };
  return { default: makeNamespace() };
});

let title: typeof import('./TitleScene');
let maps: typeof import('../data/maps');

beforeAll(async () => {
  [title, maps] = await Promise.all([import('./TitleScene'), import('../data/maps')]);
});

describe('Chapter 3 dev-map boots', () => {
  it('does not turn absent coordinate overrides into a false 0,0 spawn', () => {
    expect(Number.isNaN(title.optionalDevCoordinate(null))).toBe(true);
    expect(title.optionalDevCoordinate('0')).toBe(0);
    expect(title.optionalDevCoordinate('12.5')).toBe(12.5);
  });

  it('covers the exact twelve-map production roster', () => {
    expect(title.CH3_DEV_MAP_IDS).toEqual([
      'biplane_interior', 'foggybottom', 'kettle_taproom', 'kettle_snug',
      'foggy_moor', 'wintermoor_grounds', 'the_old_stones',
      'wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3',
      'wintermoor_dorm', 'wintermoor_boiler',
    ]);
  });

  it('builds representative arrival, joined, coolant, and complete survey states', () => {
    const arrival = title.chapter3DevProfile('arrival');
    expect(arrival.embers).toBe(2);
    expect(arrival.flags).toEqual(expect.arrayContaining(['ember1', 'ember2', 'awake_freeze_a']));
    expect(arrival.partyLevels).toEqual({ rex: 16, faye: 14, milo: null });

    const joined = title.chapter3DevProfile(null);
    expect(joined.state).toBe('joined');
    expect(joined.flags).toEqual(expect.arrayContaining(['milo_joined', 'awake_mindwarp_a', 'wm_gate_open']));
    expect(joined.partyLevels.rex).toBe(16);

    expect(title.chapter3DevProfile('coolant').flags).toContain('wm_coolant_frozen');
    expect(title.chapter3DevProfile('complete')).toMatchObject({ embers: 3 });
    expect(title.chapter3DevProfile('complete').flags).toEqual(expect.arrayContaining(['mainframe_defeated', 'ember3', 'ch3_complete']));
  });

  it.each([
    'biplane_interior', 'foggybottom', 'kettle_taproom', 'kettle_snug',
    'foggy_moor', 'wintermoor_grounds', 'the_old_stones',
    'wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3',
    'wintermoor_dorm', 'wintermoor_boiler',
  ])('%s resolves an in-bounds production spawn', (id) => {
    const spawn = title.chapter3DevSpawn(id);
    const map = maps.MAPS[id];
    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(map.grid[0].length * 64);
    expect(spawn.y).toBeLessThan(map.grid.length * 64);
  });
});

describe('Chapter 4 dev-map boots', () => {
  it('covers the exact six stable map ids', () => {
    expect(title.CH4_DEV_MAP_IDS).toEqual([
      'kvisthavn', 'bootstep_moor', 'lilleby', 'spine_hand', 'spine_shoulder', 'spine_ear',
    ]);
  });

  it.each([
    'arrival', 'bridge', 'bridgeCleared', 'lilleby', 'meltfallClosed',
    'meltfallOpen', 'boss', 'postBoss', 'complete',
  ] as const)('builds a representative %s profile', (state) => {
    const profile = title.chapter4DevProfile(state);
    expect(profile.state).toBe(state);
    expect(profile.flags).toEqual(expect.arrayContaining([
      'ember1', 'ember2', 'ember3', 'ch3_complete', 'milo_joined',
      'awake_freeze_a', 'awake_mindwarp_a', 'thread_trust_open',
    ]));
    expect(profile.flags.includes('awake_volt_a')).toBe(state === 'postBoss' || state === 'complete');
    expect(profile.flags.includes('spine_meltfall_frozen')).toBe(['meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state));
  });

  it.each([
    'kvisthavn', 'bootstep_moor', 'lilleby', 'spine_hand', 'spine_shoulder', 'spine_ear',
  ])('%s resolves an in-bounds spawn', (id) => {
    const spawn = title.chapter4DevSpawn(id, 'bridge');
    const map = maps.MAPS[id];
    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(map.grid[0].length * 64);
    expect(spawn.y).toBeLessThan(map.grid.length * 64);
  });
});
