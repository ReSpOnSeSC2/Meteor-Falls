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

describe('Chapter 5 dev-map boots', () => {
  it('covers the exact four stable map ids', () => {
    expect(title.CH5_DEV_MAP_IDS).toEqual([
      'minimus_major', 'procession_way', 'the_hedgerow', 'ducal_crown',
    ]);
  });

  it.each([
    'arrival', 'city', 'procession', 'hedgerow', 'boss', 'postBoss', 'complete',
  ] as const)('builds a representative %s profile', (state) => {
    const profile = title.chapter5DevProfile(state);
    expect(profile.state).toBe(state);
    expect(profile.flags).toEqual(expect.arrayContaining([
      'ember1', 'ember2', 'ember3', 'ember4', 'ch4_complete',
      'milo_joined', 'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a',
    ]));
    expect(profile.flags.includes('big_little_lens_built')).toBe(
      ['procession', 'hedgerow', 'boss', 'postBoss', 'complete'].includes(state),
    );
    expect(profile.flags.includes('whiskerzilla_defeated')).toBe(state === 'postBoss' || state === 'complete');
    expect(profile.party).toEqual(state === 'complete'
      ? ['rex', 'faye', 'milo', 'pippa', 'dorin']
      : ['rex', 'faye', 'milo']);
  });

  it('keeps the two Chapter 5 key items in the non-capacity key ledger', () => {
    expect(title.chapter5DevProfile('arrival').keyItems).toEqual([]);
    expect(title.chapter5DevProfile('procession').keyItems).toEqual(['big_little_lens']);
    expect(title.chapter5DevProfile('complete').keyItems).toEqual(['big_little_lens', 'royal_thimble']);
  });

  it.each([
    'minimus_major', 'procession_way', 'the_hedgerow', 'ducal_crown',
  ])('%s resolves an in-bounds spawn', (id) => {
    const spawn = title.chapter5DevSpawn(id, 'boss');
    const map = maps.MAPS[id];
    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(map.grid[0].length * 64);
    expect(spawn.y).toBeLessThan(map.grid.length * 64);
  });
});

describe('Chapter 6 dev-map boots', () => {
  it('covers the exact four stable map ids', () => {
    expect(title.CH6_DEV_MAP_IDS).toEqual([
      'zanzibel', 'savanna_run', 'laughing_ruins', 'sphinx_chin',
    ]);
  });

  it.each([
    'arrival', 'city', 'savanna', 'ruins', 'choice', 'boss', 'postBoss', 'complete',
  ] as const)('builds a representative %s profile with the normal pre-Chapter 6 party', (state) => {
    const profile = title.chapter6DevProfile(state);
    expect(profile.state).toBe(state);
    expect(profile.party).toEqual(['rex', 'faye', 'milo', 'pippa', 'dorin']);
    expect(profile.level).toBe(30);
    expect(profile.keyItems).toEqual(['big_little_lens', 'royal_thimble']);
    expect(profile.flags).toEqual(expect.arrayContaining([
      'ember1', 'ember2', 'ember3', 'ember4', 'ember5',
      'ch5_complete', 'pippa_joined', 'dorin_joined',
      'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a',
    ]));
    expect(profile.flags.some((flag) => flag.startsWith('ch6_string_'))).toBe(false);
  });

  it('orders arrival, Held Breath, boss, and completion flags without preselecting Trust', () => {
    expect(title.chapter6DevProfile('arrival').flags).not.toContain('ch6_arrived');
    expect(title.chapter6DevProfile('ruins').flags).not.toContain('held_breath_unlocked');
    expect(title.chapter6DevProfile('choice').flags).toContain('held_breath_unlocked');
    expect(title.chapter6DevProfile('boss').flags).not.toContain('laughing_sphinx_defeated');
    expect(title.chapter6DevProfile('postBoss').flags).toContain('laughing_sphinx_defeated');
    expect(title.chapter6DevProfile('complete')).toMatchObject({ embers: 6 });
    expect(title.chapter6DevProfile('complete').flags).toEqual(expect.arrayContaining(['ember6', 'ch6_complete']));
  });

  it.each([
    'zanzibel', 'savanna_run', 'laughing_ruins', 'sphinx_chin',
  ])('%s resolves an in-bounds production spawn', (id) => {
    const spawn = title.chapter6DevSpawn(id, 'boss');
    const map = maps.MAPS[id];
    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(map.grid[0].length * 64);
    expect(spawn.y).toBeLessThan(map.grid.length * 64);
  });
});
