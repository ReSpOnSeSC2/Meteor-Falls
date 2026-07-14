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
let chapter9Maps: typeof import('../data/maps_ch9');
let itemData: typeof import('../data/items');
let state: typeof import('../engine/state');
let tiles: typeof import('../spritegen/tiles');

beforeAll(async () => {
  [title, maps, chapter8Maps, chapter9Maps, itemData, state, tiles] = await Promise.all([
    import('./TitleScene'), import('../data/maps'), import('../data/maps_ch8'), import('../data/maps_ch9'),
    import('../data/items'), import('../engine/state'), import('../spritegen/tiles'),
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

describe('Chapter 9 dev-map boots', () => {
  const states = [
    'arrival', 'arrivalDeparted', 'village', 'buniActive', 'buniFull',
    'buniFullDeparted', 'oldRoad', 'castleEntry', 'preBoss', 'preBossDeparted',
    'theatrical', 'postUnmask', 'postUnmaskDeparted', 'postBoss',
    'postBossDeparted', 'iron', 'ironDeparted', 'openHand', 'openHandDeparted',
    'monastery', 'monasteryDeparted', 'awakening', 'awakeningDeparted',
    'complete', 'completeDeparted',
  ] as const;
  const departedPairs = [
    ['arrival', 'arrivalDeparted'],
    ['buniFull', 'buniFullDeparted'],
    ['preBoss', 'preBossDeparted'],
    ['postUnmask', 'postUnmaskDeparted'],
    ['postBoss', 'postBossDeparted'],
    ['iron', 'ironDeparted'],
    ['openHand', 'openHandDeparted'],
    ['monastery', 'monasteryDeparted'],
    ['awakening', 'awakeningDeparted'],
    ['complete', 'completeDeparted'],
  ] as const;
  const departedStates = new Set<string>(departedPairs.map(([, departed]) => departed));
  const ingredientFlags = [
    'q_buni_smantana', 'q_buni_branza', 'q_buni_mushrooms',
    'q_buni_cabbage', 'q_buni_plums',
  ] as const;

  it('exports the exact four-map roster and exact twenty-five-state profile vocabulary', () => {
    expect(title.CH9_DEV_MAP_IDS).toEqual([
      'valea_stelelor', 'old_road', 'castle_hoaxula', 'stone_brow_monastery',
    ]);
    expect(title.CH9_DEV_STATES).toEqual(states);
    expect(title.chapter9DevProfile(null).state).toBe('village');
    expect(title.chapter9DevProfile('not-a-state').state).toBe('village');
  });

  it.each(states)('builds a coherent level-46 %s profile with eight prior Embers', (profileState) => {
    const profile = title.chapter9DevProfile(profileState);
    expect(profile.state).toBe(profileState);
    expect(profile.level).toBe(46);
    expect(profile.embers).toBe(profileState === 'complete' || profileState === 'completeDeparted' ? 9 : 8);
    expect(profile.flags).toEqual(expect.arrayContaining([
      'ember1', 'ember2', 'ember3', 'ember4', 'ember5', 'ember6', 'ember7', 'ember8',
      'ch8_complete', 'paper_dragon_defeated', 'held_breath_unlocked',
      'awake_surge_a', 'awake_lifeup_a', 'awake_fire_a', 'awake_freeze_a',
      'awake_mindwarp_a', 'awake_volt_a', 'awake_starsong_a', 'awake_teleport_b',
      'thread_trust_resolve', 'thread_clicker_clearing', 'army_clearing',
      'ch6_string_decided', 'ch9_train_committed', 'ch9_train_seen',
    ]));
    expect(profile.keyItems).toEqual(expect.arrayContaining([
      'star_locket', 'big_little_lens', 'royal_thimble', 'riverboat_pass',
      'lotus_seal', 'orient_express_ticket',
    ]));
    expect(new Set(profile.flags).size).toBe(profile.flags.length);
    expect(new Set(profile.keyItems).size).toBe(profile.keyItems.length);
    expect(new Set(profile.callers.map((caller) => caller.quest)).size).toBe(profile.callers.length);
    expect(profile.callers).toEqual(expect.arrayContaining([
      expect.objectContaining({ quest: 'thread:army', name: 'General Buckle' }),
      expect.objectContaining({ quest: 'thread:clicker', name: 'The Lotus Bargeman' }),
    ]));
    expect(profile.flags).not.toContain('ch10_arrived');
    expect(profile.flags).not.toContain('ch10_complete');

    const departed = departedStates.has(profileState);
    expect(profile.party).toEqual(departed
      ? ['rex', 'faye', 'milo', 'dorin']
      : ['rex', 'faye', 'milo', 'pippa', 'dorin']);
    expect(profile.departed).toEqual(departed ? ['pippa'] : []);
    expect(profile.flags).toContain(departed ? 'axis_trust_strings' : 'axis_trust_free');
    expect(profile.flags).not.toContain(departed ? 'axis_trust_free' : 'axis_trust_strings');
    expect(profile.flags.includes('pippa_left')).toBe(departed);

    for (const [heroId, loadout] of Object.entries(profile.loadouts)) {
      expect(loadout.bag.length, `${profileState}/${heroId} capacity`).toBeLessThanOrEqual(itemData.BAG_MAX);
      for (const [slot, itemId] of Object.entries(loadout.equip)) {
        const item = itemData.ITEMS[itemId];
        expect(item, `${profileState}/${heroId}/${itemId} exists`).toBeDefined();
        expect(loadout.bag, `${profileState}/${heroId}/${itemId} stays in owner bag`).toContain(itemId);
        if (item) expect(itemData.slotOf(item), `${profileState}/${heroId}/${itemId} slot`).toBe(slot);
        if (item?.wielder) expect(item.wielder, `${profileState}/${heroId}/${itemId} wielder`).toBe(heroId);
      }
    }
  });

  it.each(departedPairs)(
    'keeps %s and %s story-identical apart from the serialized STRINGS departure',
    (presentState, departedState) => {
      const present = title.chapter9DevProfile(presentState);
      const departed = title.chapter9DevProfile(departedState);
      const withoutTrust = (flags: readonly string[]) => flags.filter((flag) => ![
        'axis_trust_free', 'axis_trust_strings', 'pippa_left',
      ].includes(flag));

      expect(withoutTrust(departed.flags)).toEqual(withoutTrust(present.flags));
      expect(departed).toMatchObject({
        embers: present.embers,
        keyItems: present.keyItems,
        level: present.level,
        callers: present.callers,
        loadouts: present.loadouts,
        fullBag: present.fullBag,
        choice: present.choice,
        echoAnchor: present.echoAnchor,
        battleContext: present.battleContext,
        party: ['rex', 'faye', 'milo', 'dorin'],
        departed: ['pippa'],
        rewindCount: 3,
      });
      expect(present.party).toEqual(['rex', 'faye', 'milo', 'pippa', 'dorin']);
      expect(present.departed).toEqual([]);
      expect(present.rewindCount).toBe(0);
    },
  );

  it('serializes the partial and all-collected Buni states without temporary ingredient items', () => {
    const active = title.chapter9DevProfile('buniActive');
    expect(active.flags).toEqual(expect.arrayContaining([
      'q_bunis', 'q_buni_smantana', 'q_buni_cabbage', 'q_buni_plums',
    ]));
    expect(active.flags).not.toContain('ch9_buni_panel_seen');
    expect(active.flags).not.toContain('q_buni_branza');
    expect(active.flags).not.toContain('q_buni_mushrooms');
    expect(active.flags).not.toContain('q_bunis_gather');

    const full = title.chapter9DevProfile('buniFull');
    expect(full.flags).toEqual(expect.arrayContaining([
      'q_bunis', ...ingredientFlags, 'q_bunis_gather', 'q_bunis_cook',
    ]));
    expect(full.flags).not.toContain('q_bunis_done');
    expect(full.flags).not.toContain('feast_recipe');
    expect(full.callers.some((caller) => caller.quest === 'bunis_table')).toBe(false);
    expect(Object.values(full.loadouts).flatMap((loadout) => loadout.bag)).not.toContain('basket_feast');
    for (const ingredient of ['smantana', 'branza_burduf', 'valley_mushrooms', 'pickled_cabbage', 'grandfather_plums']) {
      expect(Object.values(active.loadouts).flatMap((loadout) => loadout.bag), ingredient).not.toContain(ingredient);
      expect(Object.values(full.loadouts).flatMap((loadout) => loadout.bag), ingredient).not.toContain(ingredient);
    }

    const road = title.chapter9DevProfile('oldRoad');
    expect(road.flags).toEqual(expect.arrayContaining([
      'q_bunis', 'q_buni_smantana', 'q_buni_cabbage', 'q_buni_plums',
    ]));
    expect(road.flags).not.toContain('q_buni_branza');
    expect(road.flags).not.toContain('q_buni_mushrooms');
    expect(road.flags).not.toContain('q_bunis_done');

    const completed = title.chapter9DevProfile('castleEntry');
    expect(completed.flags).toEqual(expect.arrayContaining(['q_bunis_done', 'feast_recipe']));
    expect(completed.callers.filter((caller) => caller.quest === 'bunis_table')).toHaveLength(1);
    expect(Object.values(completed.loadouts).flatMap((loadout) => loadout.bag).filter((item) => item === 'basket_feast')).toHaveLength(1);
  });

  it.each(['buniFull', 'buniFullDeparted'] as const)(
    'installs the hazardous %s retry with every available bag exactly full and reward still pending',
    (profileState) => {
      state.GS.reset();
      const profile = title.chapter9DevProfile(profileState);
      title.installChapter9DevProfile(profile);
      expect(profile.fullBag).toBe(true);
      expect(state.GS.data.party).toHaveLength(profileState === 'buniFullDeparted' ? 4 : 5);
      for (const hero of state.GS.data.party) {
        expect(hero.bag, hero.id).toHaveLength(itemData.BAG_MAX);
        for (const itemId of Object.values(hero.equip)) expect(hero.bag, `${hero.id}/${itemId}`).toContain(itemId);
      }
      if (profileState === 'buniFullDeparted') {
        expect(state.GS.data.departedHeroes.pippa?.bag).toHaveLength(itemData.BAG_MAX);
      }
      expect(state.GS.flag('q_bunis_cook')).toBe(true);
      expect(state.GS.flag('q_bunis_done')).toBe(false);
      expect(state.GS.flag('feast_recipe')).toBe(false);
      expect(state.GS.data.callers.some((caller) => caller.quest === 'bunis_table')).toBe(false);
    },
  );

  it('keeps signature rewards in their real owner bags without silently equipping them', () => {
    const postBoss = title.chapter9DevProfile('postBoss');
    expect(postBoss.loadouts.rex.equip.weapon).toBe('hall_of_famer_bat');
    expect(postBoss.loadouts.rex.bag).toEqual(expect.arrayContaining(['hall_of_famer_bat', 'candelabra']));

    const complete = title.chapter9DevProfile('complete');
    expect(complete.loadouts.faye.equip.weapon).toBe('chefs_pan');
    expect(complete.loadouts.faye.bag).toEqual(expect.arrayContaining(['chefs_pan', 'holy_pan']));
  });

  it.each(departedPairs.map(([, departed]) => departed))(
    'installs %s by cloning one exact Pippa hero record into departedHeroes',
    (profileState) => {
      state.GS.reset();
      const profile = title.chapter9DevProfile(profileState);
      const expected = state.makeHeroState('pippa', 46, state.GS.data.heroNames.pippa);
      expected.bag = [...profile.loadouts.pippa.bag];
      expected.equip = { ...profile.loadouts.pippa.equip };
      title.installChapter9DevProfile(profile);

      expect(state.GS.data.party.map((hero) => hero.id)).toEqual(['rex', 'faye', 'milo', 'dorin']);
      expect(state.GS.data.departedHeroes).toEqual({ pippa: expected });
      expect(state.GS.flag('pippa_left')).toBe(true);
      expect(state.GS.flag('axis_trust_strings')).toBe(true);
      expect(state.GS.flag('axis_trust_free')).toBe(false);
      expect(state.GS.data.echoes.rewindCount).toBe(3);
    },
  );

  it('models post-boss, IRON, and OPEN HAND as three exact choice transactions', () => {
    for (const profileState of ['postBoss', 'postBossDeparted'] as const) {
      const postBoss = title.chapter9DevProfile(profileState);
      expect(postBoss.flags).toContain('count_hoaxula_defeated');
      expect(postBoss.flags).not.toContain('ch9_count_decided');
      expect(postBoss.flags).not.toContain('axis_compassion_iron');
      expect(postBoss.flags).not.toContain('axis_compassion_openhand');
      expect(postBoss.echoAnchor).toBe('ch9_count');
    }

    for (const profileState of ['iron', 'ironDeparted'] as const) {
      const iron = title.chapter9DevProfile(profileState);
      expect(iron.choice).toBe('iron');
      expect(iron.flags).toEqual(expect.arrayContaining([
        'count_hoaxula_defeated', 'ch9_count_decided', 'axis_compassion_iron',
        'stolen_light_banked', 'dorin_withholds',
      ]));
      expect(iron.flags).not.toContain('axis_compassion_openhand');
      expect(iron.callers.some((caller) => caller.quest === 'choice:ch9_count')).toBe(false);
    }

    for (const profileState of ['openHand', 'openHandDeparted'] as const) {
      const open = title.chapter9DevProfile(profileState);
      expect(open.choice).toBe('mercy');
      expect(open.flags).toEqual(expect.arrayContaining([
        'count_hoaxula_defeated', 'ch9_count_decided', 'axis_compassion_openhand',
      ]));
      expect(open.flags).not.toContain('axis_compassion_iron');
      expect(open.flags).not.toContain('stolen_light_banked');
      expect(open.flags).not.toContain('dorin_withholds');
      expect(open.callers.filter((caller) => caller.quest === 'choice:ch9_count')).toEqual([
        expect.objectContaining({ name: 'Vlad, the Actor' }),
      ]);
    }
  });

  it.each([
    'postBoss', 'postBossDeparted', 'iron', 'ironDeparted',
    'openHand', 'openHandDeparted',
  ] as const)(
    'captures a real pre-choice Held Breath snapshot for %s without losing the selected final branch',
    (profileState) => {
      state.GS.reset();
      const profile = title.chapter9DevProfile(profileState);
      title.installChapter9DevProfile(profile);
      state.GS.data.map = 'castle_hoaxula';
      state.GS.data.x = 36 * 64 + 32;
      state.GS.data.y = 16 * 64 + 48;
      state.GS.data.facing = 'up';
      title.primeChapter9DevEcho(profile);

      const anchor = state.GS.data.echoes.stack.find((entry) => entry.choice === 'ch9_count');
      expect(anchor).toBeDefined();
      const snapshot = JSON.parse(anchor!.json) as {
        map: string;
        x: number;
        y: number;
        flags: Record<string, boolean>;
        callers: Array<{ quest: string }>;
      };
      expect(snapshot).toMatchObject({ map: 'castle_hoaxula', x: 36 * 64 + 32, y: 16 * 64 + 48 });
      expect(snapshot.flags.count_hoaxula_defeated).toBe(true);
      expect(snapshot.flags.ch9_count_decided).not.toBe(true);
      expect(snapshot.flags.axis_compassion_iron).not.toBe(true);
      expect(snapshot.flags.axis_compassion_openhand).not.toBe(true);
      expect(snapshot.flags.stolen_light_banked).not.toBe(true);
      expect(snapshot.flags.dorin_withholds).not.toBe(true);
      expect(snapshot.callers.some((caller) => caller.quest === 'choice:ch9_count')).toBe(false);

      expect(state.GS.flag('axis_compassion_iron')).toBe(profile.choice === 'iron');
      expect(state.GS.flag('axis_compassion_openhand')).toBe(profile.choice === 'mercy');
      expect(state.GS.data.callers.filter((caller) => caller.quest === 'choice:ch9_count')).toHaveLength(
        profile.choice === 'mercy' ? 1 : 0,
      );
    },
  );

  it('stages the monastery resume cases and records Ember 9 exactly only at completion', () => {
    for (const profileState of ['monastery', 'monasteryDeparted'] as const) {
      const monastery = title.chapter9DevProfile(profileState);
      expect(monastery.flags).toEqual(expect.arrayContaining([
        'count_hoaxula_defeated', 'ch9_count_decided', 'axis_compassion_openhand',
      ]));
      expect(monastery.flags).not.toContain('ch9_trial_seen');
    }

    for (const profileState of ['awakening', 'awakeningDeparted'] as const) {
      const awakening = title.chapter9DevProfile(profileState);
      expect(awakening.flags).toEqual(expect.arrayContaining(['ch9_trial_seen', 'ch9_dorin_name_spoken']));
      expect(awakening.flags).not.toContain('awake_comet_o');
      expect(awakening.embers).toBe(8);
    }

    for (const profileState of ['complete', 'completeDeparted'] as const) {
      const complete = title.chapter9DevProfile(profileState);
      expect(complete.embers).toBe(9);
      expect(complete.flags).toEqual(expect.arrayContaining([
        'ch9_trial_seen', 'ch9_dorin_name_spoken', 'awake_comet_o',
        'ch9_heartlight_seen', 'ember9', 'ch9_complete', 'ch9_card_seen',
      ]));
      expect(complete.flags).not.toContain('ch10_arrived');
      expect(complete.flags.filter((flag) => flag === 'ember9')).toHaveLength(1);
    }
  });

  it('builds real BattleScene launch configs for every named battle-phase profile', () => {
    expect(title.chapter9DevBattleConfig('theatrical')).toEqual({
      enemyIds: ['count_hoaxula'],
      advantage: 'none',
      guestChad: false,
      glintAssist: false,
      glintSupernova: false,
      boss: true,
      backdrop: 'castle_hoaxula',
      prayTutorial: false,
      devContext: { form: 'theatrical', hp: 95000, bossTurns: 0, introSeen: false },
    });
    expect(title.chapter9DevBattleConfig('postUnmask')).toEqual({
      enemyIds: ['count_hoaxula'],
      advantage: 'none',
      guestChad: false,
      glintAssist: false,
      glintSupernova: false,
      boss: true,
      backdrop: 'castle_hoaxula',
      prayTutorial: false,
      devContext: {
        form: 'unmasked', hp: 47500, bossTurns: 2, introSeen: true,
        stolen: { heroId: 'rex', slot: 'weapon' },
      },
    });
    expect(title.chapter9DevBattleConfig('postUnmaskDeparted')).toEqual(
      title.chapter9DevBattleConfig('postUnmask'),
    );
    expect(title.chapter9DevProfile('theatrical').battleContext).toEqual({
      form: 'theatrical', hp: 95000, bossTurns: 0, introSeen: false,
    });
    expect(title.chapter9DevProfile('postUnmask').battleContext).toEqual({
      form: 'unmasked', hp: 47500, bossTurns: 2, introSeen: true,
      stolen: { heroId: 'rex', slot: 'weapon' },
    });
    expect(title.chapter9DevProfile('postUnmask').flags).toContain('ch9_unmasked_panel_seen');
    expect(title.chapter9DevProfile('postUnmaskDeparted').battleContext).toEqual(
      title.chapter9DevProfile('postUnmask').battleContext,
    );
    expect(title.chapter9DevProfile('postUnmaskDeparted').flags).toContain('ch9_unmasked_panel_seen');
    for (const profileState of states.filter((candidate) => ![
      'theatrical', 'postUnmask', 'postUnmaskDeparted',
    ].includes(candidate))) {
      expect(title.chapter9DevBattleConfig(profileState), profileState).toBeNull();
      expect(title.chapter9DevProfile(profileState).battleContext, profileState).toBeNull();
    }
  });

  it.each(['valea_stelelor', 'old_road', 'castle_hoaxula', 'stone_brow_monastery'] as const)(
    '%s resolves a walkable in-bounds CH9_WORLD spawn for all twenty-five profiles',
    (mapId) => {
      for (const profileState of states) {
        const spawn = title.chapter9DevSpawn(mapId, profileState);
        const map = maps.MAPS[mapId];
        expect(spawn.x, `${mapId}/${profileState} x`).toBeGreaterThanOrEqual(0);
        expect(spawn.y, `${mapId}/${profileState} y`).toBeGreaterThanOrEqual(0);
        expect(spawn.x, `${mapId}/${profileState} x`).toBeLessThan(map.grid[0].length * 64);
        expect(spawn.y, `${mapId}/${profileState} y`).toBeLessThan(map.grid.length * 64);
        const tx = Math.floor(spawn.x / 64);
        const ty = Math.floor(spawn.y / 64);
        const tile = map.grid[ty][tx];
        const tileName = maps.CHAR_LEGEND[tile] ?? 'grass_a';
        const solid = tiles.TILESET.find((definition) => definition.name === tileName)?.solid === true;
        expect(tile === ':' || tile === 'r' || !solid, `${mapId}/${profileState} tile '${tile}' walkable`).toBe(true);
      }
    },
  );

  it('derives every named Chapter 9 profile spawn from CH9_WORLD, including safe full-bag feet', () => {
    const feet = (point: Readonly<{ x: number; y: number; facing: string }>) => ({
      x: point.x * 64 + 32,
      y: point.y * 64 + 48,
      facing: point.facing,
    });
    expect(title.chapter9DevSpawn('valea_stelelor', 'arrival')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.arrival));
    expect(title.chapter9DevSpawn('valea_stelelor', 'arrivalDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.arrival));
    expect(title.chapter9DevSpawn('valea_stelelor', 'village')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.village));
    expect(title.chapter9DevSpawn('valea_stelelor', 'buniActive')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.buni));
    expect(title.chapter9DevSpawn('valea_stelelor', 'buniFull')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.fullBag));
    expect(title.chapter9DevSpawn('valea_stelelor', 'buniFullDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.fullBag));
    expect(title.chapter9DevSpawn('valea_stelelor', 'complete')).toEqual(feet(chapter9Maps.CH9_WORLD.valea.profiles.complete));
    expect(title.chapter9DevSpawn('old_road', 'oldRoad')).toEqual(feet(chapter9Maps.CH9_WORLD.oldRoad.profiles.road));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'castleEntry')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.entry));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'preBoss')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.preBoss));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'preBossDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.preBoss));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'theatrical')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.theatrical));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'postUnmask')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.postUnmask));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'postUnmaskDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.postUnmask));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'postBoss')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.postBoss));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'postBossDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.postBoss));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'iron')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.choice));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'ironDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.choice));
    expect(title.chapter9DevSpawn('castle_hoaxula', 'openHandDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.castle.profiles.choice));
    expect(title.chapter9DevSpawn('stone_brow_monastery', 'monastery')).toEqual(feet(chapter9Maps.CH9_WORLD.monastery.profiles.monastery));
    expect(title.chapter9DevSpawn('stone_brow_monastery', 'monasteryDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.monastery.profiles.monastery));
    expect(title.chapter9DevSpawn('stone_brow_monastery', 'awakening')).toEqual(feet(chapter9Maps.CH9_WORLD.monastery.profiles.awakening));
    expect(title.chapter9DevSpawn('stone_brow_monastery', 'awakeningDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.monastery.profiles.awakening));
    expect(title.chapter9DevSpawn('stone_brow_monastery', 'complete')).toEqual(feet(chapter9Maps.CH9_WORLD.monastery.profiles.complete));
    expect(title.chapter9DevSpawn('stone_brow_monastery', 'completeDeparted')).toEqual(feet(chapter9Maps.CH9_WORLD.monastery.profiles.complete));
  });
});
