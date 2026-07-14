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
let chapter8Maps: typeof import('../data/maps_ch8');
let tiles: typeof import('../spritegen/tiles');

beforeAll(async () => {
  [title, maps, chapter8Maps, tiles] = await Promise.all([
    import('./TitleScene'), import('../data/maps'), import('../data/maps_ch8'), import('../spritegen/tiles'),
  ]);
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

describe('Chapter 7 dev-map boots', () => {
  it('covers the exact four stable production map ids', () => {
    expect(title.CH7_DEV_MAP_IDS).toEqual([
      'chandrapore', 'monsoon_road', 'night_train', 'palace_throne',
    ]);
  });

  it.each([
    'arrival', 'city', 'theft', 'train', 'recovered', 'palace', 'boss', 'postBoss', 'complete',
  ] as const)('builds a coherent five-hero %s profile at the Chapter 7 level band', (state) => {
    const profile = title.chapter7DevProfile(state);
    expect(profile.state).toBe(state);
    expect(profile.party).toEqual(['rex', 'faye', 'milo', 'pippa', 'dorin']);
    expect(profile.level).toBe(35);
    expect(profile.keyItems).toEqual(['star_locket', 'big_little_lens', 'royal_thimble', 'train_ticket']);
    expect(profile.flags).toEqual(expect.arrayContaining([
      'ember1', 'ember2', 'ember3', 'ember4', 'ember5', 'ember6',
      'ch6_complete', 'laughing_sphinx_defeated', 'held_breath_unlocked',
    ]));
    expect(profile.flags).not.toContain('ch8_arrived');
  });

  it('models theft as temporary availability flags without deleting the Locket', () => {
    const theft = title.chapter7DevProfile('theft');
    expect(theft.keyItems.filter((item) => item === 'star_locket')).toHaveLength(1);
    expect(theft.flags).toContain('ch7_locket_stolen');
    expect(theft.flags).not.toContain('ch7_locket_recovered');

    const recovered = title.chapter7DevProfile('recovered');
    expect(recovered.flags).not.toContain('ch7_locket_stolen');
    expect(recovered.flags).toContain('ch7_locket_recovered');
  });

  it('orders city, heist, palace, Raja, post-boss, and completion flags', () => {
    expect(title.chapter7DevProfile('arrival').flags).toContain('ch7_train_seen');
    expect(title.chapter7DevProfile('arrival').flags).not.toContain('ch7_arrived');
    expect(title.chapter7DevProfile('city').flags).toEqual(expect.arrayContaining(['ch7_train_seen', 'ch7_arrived']));
    expect(title.chapter7DevProfile('train').flags).toEqual(expect.arrayContaining(['ch7_heist_seen', 'ch7_locket_stolen']));
    expect(title.chapter7DevProfile('palace').flags).toEqual(expect.arrayContaining(['ch7_locket_recovered', 'ch7_palace_seen']));
    expect(title.chapter7DevProfile('boss').flags).toContain('ch7_raja_seen');
    expect(title.chapter7DevProfile('boss').flags).not.toContain('cobra_raja_defeated');
    expect(title.chapter7DevProfile('postBoss').flags).toContain('cobra_raja_defeated');
    const complete = title.chapter7DevProfile('complete');
    expect(complete).toMatchObject({ embers: 7 });
    expect(complete.flags).toEqual(expect.arrayContaining([
      'cobra_raja_defeated', 'ch7_heartlight_seen', 'ember7', 'ch7_complete',
    ]));
  });

  it.each([
    'chandrapore', 'monsoon_road', 'night_train', 'palace_throne',
  ])('%s resolves an in-bounds production spawn in every representative phase', (id) => {
    for (const state of ['arrival', 'theft', 'train', 'recovered', 'boss', 'postBoss', 'complete'] as const) {
      const spawn = title.chapter7DevSpawn(id, state);
      const map = maps.MAPS[id];
      expect(spawn.x, `${id}/${state} x`).toBeGreaterThanOrEqual(0);
      expect(spawn.y, `${id}/${state} y`).toBeGreaterThanOrEqual(0);
      expect(spawn.x, `${id}/${state} x`).toBeLessThan(map.grid[0].length * 64);
      expect(spawn.y, `${id}/${state} y`).toBeLessThan(map.grid.length * 64);
    }
  });

  it('pins canonical arrival, heist, recovery, and palace profile spawns and facings', () => {
    const feet = (x: number, y: number, facing: 'up' | 'down' | 'left' | 'right') => ({
      x: x * 64 + 32,
      y: y * 64 + 48,
      facing,
    });
    expect(title.chapter7DevSpawn('chandrapore', 'arrival')).toEqual(feet(16, 75, 'down'));
    expect(title.chapter7DevSpawn('monsoon_road', 'train')).toEqual(feet(3, 54, 'right'));
    expect(title.chapter7DevSpawn('night_train', 'train')).toEqual(feet(24, 78, 'up'));
    expect(title.chapter7DevSpawn('night_train', 'recovered')).toEqual(feet(24, 21, 'up'));
    expect(title.chapter7DevSpawn('palace_throne', 'boss')).toEqual(feet(44, 41, 'up'));
    expect(title.chapter7DevSpawn('palace_throne', 'postBoss')).toEqual(feet(44, 37, 'up'));
    expect(title.chapter7DevSpawn('palace_throne', 'complete')).toEqual(feet(44, 9, 'up'));
  });
});

describe('Chapter 8 dev-map boots', () => {
  const states = [
    'arrival', 'city', 'barge', 'trustFree', 'trustStrings', 'mushroomized',
    'forestCured', 'brushes', 'yak', 'temple', 'boss', 'postBoss', 'complete',
  ] as const;

  it('exports the exact four-map roster and exact thirteen-state profile vocabulary', () => {
    expect(title.CH8_DEV_MAP_IDS).toEqual([
      'lotus_harbor', 'bamboo_road', 'spore_forest', 'mt_shu_temple',
    ]);
    expect(title.CH8_DEV_STATES).toEqual(states);
    expect(title.chapter8DevProfile(null).state).toBe('city');
    expect(title.chapter8DevProfile('not-a-state').state).toBe('city');
  });

  it.each(states)('builds a coherent level-40 %s profile with seven Embers until completion', (state) => {
    const profile = title.chapter8DevProfile(state);
    expect(profile.state).toBe(state);
    expect(profile.level).toBe(40);
    expect(profile.embers).toBe(state === 'complete' ? 8 : 7);
    expect(profile.flags).toEqual(expect.arrayContaining([
      'ember1', 'ember2', 'ember3', 'ember4', 'ember5', 'ember6', 'ember7',
      'ch7_complete', 'cobra_raja_defeated', 'pippa_joined', 'held_breath_unlocked',
    ]));
    expect(new Set(profile.flags).size).toBe(profile.flags.length);
    expect(new Set(profile.keyItems).size).toBe(profile.keyItems.length);
    expect(new Set(profile.items).size).toBe(profile.items.length);
    expect(profile.flags).not.toContain('ch9_arrived');
    expect(profile.flags).not.toContain('ch9_complete');
    expect(profile.callers.filter((caller) => caller.quest === 'thread:clicker')).toHaveLength(
      profile.flags.includes('thread_clicker_clearing') ? 1 : 0,
    );
  });

  it('models only the two named Trust profiles as choices and keeps Pippa until live resolution', () => {
    const free = title.chapter8DevProfile('trustFree');
    expect(free.flags).toEqual(expect.arrayContaining(['ch6_string_decided', 'axis_trust_free']));
    expect(free.flags).not.toContain('axis_trust_strings');
    expect(free.party).toContain('pippa');
    expect(free.departed).toEqual([]);

    const strings = title.chapter8DevProfile('trustStrings');
    expect(strings.flags).toEqual(expect.arrayContaining(['ch6_string_decided', 'axis_trust_strings']));
    expect(strings.flags).not.toContain('axis_trust_free');
    expect(strings.flags).not.toContain('pippa_reconciled');
    expect(strings.flags).not.toContain('pippa_left');
    expect(strings.flags).not.toContain('thread_trust_resolve');
    expect(strings.party).toContain('pippa');
    expect(strings.departed).toEqual([]);
    expect(strings.rewindCount).toBeGreaterThan(2);

    for (const state of states.filter((candidate) => candidate !== 'trustFree' && candidate !== 'trustStrings')) {
      const profile = title.chapter8DevProfile(state);
      expect(profile.flags, state).not.toContain('ch6_string_decided');
      expect(profile.flags, state).not.toContain('axis_trust_free');
      expect(profile.flags, state).not.toContain('axis_trust_strings');
      expect(profile.party, state).toContain('pippa');
    }
  });

  it('pins the Mushroomized profile to hazard phase 0 and the shared clean recovery', () => {
    const profile = title.chapter8DevProfile('mushroomized');
    const point = chapter8Maps.CH8_WORLD.sporeForest.recovery;
    expect(profile.mushroomize).toEqual({
      active: true,
      phase: 0,
      source: chapter8Maps.CH8_WORLD.sporeForest.hazards[0].id,
      recovery: {
        map: 'spore_forest',
        x: point.x * 64 + 32,
        y: point.y * 64 + 48,
        facing: point.facing,
      },
    });
    expect(title.chapter8DevProfile('forestCured').mushroomize).toEqual({
      active: false, phase: 0, source: null, recovery: null,
    });
  });

  it('stages Clicker, forest, elder, boss, and completion in order', () => {
    expect(title.chapter8DevProfile('barge').flags).toContain('thread_clicker_seed');
    expect(title.chapter8DevProfile('barge').flags).not.toContain('thread_clicker_crisis');
    expect(title.chapter8DevProfile('mushroomized').flags).toEqual(expect.arrayContaining([
      'thread_clicker_seed', 'thread_clicker_crisis', 'thread_clicker_clearing',
    ]));
    expect(title.chapter8DevProfile('mushroomized').callers).toEqual([
      expect.objectContaining({ quest: 'thread:clicker', name: 'The Lotus Bargeman' }),
    ]);
    expect(title.chapter8DevProfile('temple').flags).toEqual(expect.arrayContaining([
      'ch8_yak_departed', 'ch8_yak_arrived',
    ]));
    expect(title.chapter8DevProfile('temple').flags).not.toContain('awake_teleport_b');
    expect(title.chapter8DevProfile('boss').flags).toEqual(expect.arrayContaining([
      'thread_trust_climax', 'thread_trust_resolve', 'awake_teleport_b',
    ]));
    expect(title.chapter8DevProfile('boss').flags).not.toContain('paper_dragon_defeated');
    const postBoss = title.chapter8DevProfile('postBoss');
    expect(postBoss.flags).toEqual(expect.arrayContaining([
      'ch8_dragon_seen', 'paper_dragon_defeated', 'paper_fan_claimed',
    ]));
    expect(postBoss.items).toEqual(['paper_fan']);
    expect(title.chapter8DevProfile('boss').flags).not.toContain('ch8_dragon_seen');

    const complete = title.chapter8DevProfile('complete');
    expect(complete.flags).toEqual(expect.arrayContaining([
      'ch8_dragon_seen', 'paper_dragon_defeated', 'paper_fan_claimed',
      'ch8_heartlight_seen', 'ember8', 'ch8_complete',
    ]));
    expect(complete.items.filter((item) => item === 'paper_fan')).toHaveLength(1);
    expect(complete.embers).toBe(8);
  });

  it('does not retain Yak Treats after the feed objective has consumed them', () => {
    for (const state of ['yak', 'temple', 'boss', 'postBoss', 'complete'] as const) {
      const profile = title.chapter8DevProfile(state);
      expect(profile.flags, state).toContain('q_yak_waits_feed');
      expect(profile.keyItems, state).not.toContain('yak_treats');
    }
  });

  it.each(['lotus_harbor', 'bamboo_road', 'spore_forest', 'mt_shu_temple'] as const)(
    '%s resolves an in-bounds production spawn for every profile',
    (mapId) => {
      for (const state of states) {
        const spawn = title.chapter8DevSpawn(mapId, state);
        const map = maps.MAPS[mapId];
        expect(spawn.x, `${mapId}/${state} x`).toBeGreaterThanOrEqual(0);
        expect(spawn.y, `${mapId}/${state} y`).toBeGreaterThanOrEqual(0);
        expect(spawn.x, `${mapId}/${state} x`).toBeLessThan(map.grid[0].length * 64);
        expect(spawn.y, `${mapId}/${state} y`).toBeLessThan(map.grid.length * 64);
        const tx = Math.floor(spawn.x / 64);
        const ty = Math.floor(spawn.y / 64);
        const tile = map.grid[ty][tx];
        const tileName = maps.CHAR_LEGEND[tile] ?? 'grass_a';
        const solid = tiles.TILESET.find((definition) => definition.name === tileName)?.solid === true;
        expect(tile === ':' || tile === 'r' || !solid, `${mapId}/${state} tile '${tile}' walkable`).toBe(true);
      }
    },
  );

  it('derives every exact named spawn from CH8_WORLD', () => {
    const feet = (point: Readonly<{ x: number; y: number; facing: string }>) => ({
      x: point.x * 64 + 32,
      y: point.y * 64 + 48,
      facing: point.facing,
    });
    expect(title.chapter8DevSpawn('lotus_harbor', 'arrival')).toEqual(feet(chapter8Maps.CH8_WORLD.lotusHarbor.profiles.arrival));
    expect(title.chapter8DevSpawn('lotus_harbor', 'city')).toEqual(feet(chapter8Maps.CH8_WORLD.lotusHarbor.profiles.city));
    expect(title.chapter8DevSpawn('bamboo_road', 'barge')).toEqual(feet(chapter8Maps.CH8_WORLD.bambooRoad.profiles.barge));
    expect(title.chapter8DevSpawn('spore_forest', 'mushroomized')).toEqual(feet(chapter8Maps.CH8_WORLD.sporeForest.profiles.mushroomized));
    expect(title.chapter8DevSpawn('spore_forest', 'forestCured')).toEqual(feet(chapter8Maps.CH8_WORLD.sporeForest.profiles.forestCured));
    expect(title.chapter8DevSpawn('spore_forest', 'brushes')).toEqual(feet(chapter8Maps.CH8_WORLD.sporeForest.profiles.brushes));
    expect(title.chapter8DevSpawn('spore_forest', 'yak')).toEqual(feet(chapter8Maps.CH8_WORLD.sporeForest.profiles.yak));
    expect(title.chapter8DevSpawn('mt_shu_temple', 'temple')).toEqual(feet(chapter8Maps.CH8_WORLD.mtShuTemple.profiles.temple));
    expect(title.chapter8DevSpawn('mt_shu_temple', 'boss')).toEqual(feet(chapter8Maps.CH8_WORLD.mtShuTemple.profiles.boss));
    expect(title.chapter8DevSpawn('mt_shu_temple', 'postBoss')).toEqual(feet(chapter8Maps.CH8_WORLD.mtShuTemple.profiles.postBoss));
    expect(title.chapter8DevSpawn('mt_shu_temple', 'complete')).toEqual(feet(chapter8Maps.CH8_WORLD.mtShuTemple.profiles.complete));
  });
});
