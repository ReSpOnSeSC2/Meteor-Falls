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

let runtime: typeof import('./OverworldScene');

beforeAll(async () => {
  runtime = await import('./OverworldScene');
});

describe('door-marker presentation', () => {
  it('never paints generic welcome mats outside', () => {
    expect(runtime.visibleDoorIndicator(undefined, false)).toBe('none');
    expect(runtime.visibleDoorIndicator('mat', false)).toBe('none');
    expect(runtime.showFacadeDoorMat(false)).toBe(false);
  });

  it('preserves purposeful exterior markers and interior mats', () => {
    for (const kind of ['stairs', 'elevator', 'door', 'hole'] as const) {
      expect(runtime.visibleDoorIndicator(kind, false)).toBe(kind);
    }
    expect(runtime.visibleDoorIndicator(undefined, true)).toBe('mat');
    expect(runtime.visibleDoorIndicator('mat', true)).toBe('mat');
    expect(runtime.showFacadeDoorMat(true)).toBe(true);
  });
});

describe('Glint story staging', () => {
  it('keeps the crater apparition inside the followed camera instead of at stale map tiles', () => {
    const player = { x: 62 * 64, y: 8 * 64 };
    const glint = runtime.glintCraterStagePosition(player.x, player.y);

    expect(glint).toEqual({ x: player.x + 128, y: player.y - 104 });
    expect(Math.abs(glint.x - player.x) + 48).toBeLessThan(800);
    expect(glint.y).toBeLessThan(player.y);
  });

  it('stages Glint above elevated world art but below dialogue', () => {
    expect(runtime.STORY_STAGE_DEPTH.threat).toBeGreaterThan(80_000);
    expect(runtime.STORY_STAGE_DEPTH.threat).toBeLessThan(runtime.STORY_STAGE_DEPTH.glow);
    expect(runtime.STORY_STAGE_DEPTH.glow).toBeLessThan(runtime.STORY_STAGE_DEPTH.actor);
    expect(runtime.STORY_STAGE_DEPTH.actor).toBeLessThan(90_000);
  });

  it('lets a long car nose enter an outdoor edge route without requiring its centre in the one-tile portal', () => {
    const door = { x: 0, y: 4, w: 1, h: 2 };
    const zone = { x: 0, y: 256, w: 64, h: 128 };
    const longCar = { x: 0, y: 278, w: 142, h: 58 };
    expect(runtime.vehicleBodyTriggersEdgeDoor(door, 40, 24, { x: -1, y: 0 }, longCar, zone, false)).toBe(true);
    expect(runtime.vehicleBodyTriggersEdgeDoor(door, 40, 24, { x: 1, y: 0 }, longCar, zone, false)).toBe(false);
    expect(runtime.vehicleBodyTriggersEdgeDoor(door, 40, 24, { x: -1, y: 0 }, longCar, zone, true)).toBe(false);
  });
});

describe('walkable overworld spawner cells', () => {
  it('clips to the map and excludes solid tiles and static-body cells', () => {
    const solids = [
      [false, false, false, false],
      [false, true, false, false],
      [true, false, false, false],
      [false, false, false, false],
    ];
    const cells = runtime.walkableSpawnerCells(
      { x: -1, y: 1, w: 4, h: 2 },
      solids,
      (tx, ty) => tx === 2 && ty === 2,
    );
    expect(cells).toEqual([{ tx: 0, ty: 1 }, { tx: 2, ty: 1 }, { tx: 1, ty: 2 }]);
  });

  it('returns an empty pool when a rectangle has no safe cell', () => {
    expect(runtime.walkableSpawnerCells({ x: 0, y: 0, w: 2, h: 1 }, [[true, true]], () => false)).toEqual([]);
  });
});

describe('story trigger ownership and persistence', () => {
  it('finds the story payphone by its trigger zone even when fixtures are reordered', () => {
    const map: Parameters<typeof runtime.phoneForTrigger>[0] = {
      phones: [{ x: 40, y: 40 }, { x: 58, y: 19 }],
      triggers: [
        { id: 'payphone_ring', rect: { x: 56, y: 17, w: 6, h: 5 }, once: false },
        { id: 'brickton_dial_goal', rect: { x: 56, y: 18, w: 5, h: 4 }, once: false },
      ],
    };

    expect(runtime.phoneForTrigger(map, 'payphone_ring')).toEqual({ x: 58, y: 19 });
    expect(runtime.phoneForTrigger(map, 'brickton_dial_goal')).toEqual({ x: 58, y: 19 });
    expect(runtime.phoneForTrigger(map, 'missing')).toBeUndefined();
    expect(map.phones[0]).toEqual({ x: 40, y: 40 }); // market phone remains a normal phone
  });

  it('orders Puerto arrival before return travel and persists one-time approach beats', () => {
    const initial = {
      puertoArrived: false,
      pyramidApproachSeen: false,
      grinDefeated: false,
      valleArrived: false,
      ch2Complete: false,
    };
    expect(runtime.chapter2TriggerAction('board_boat_return', initial)).toBeNull();
    expect(runtime.chapter2TriggerAction('puerto_arrival', initial)).toBe('puerto-arrival');
    expect(runtime.chapter2TriggerAction('pyramid_approach', initial)).toBe('pyramid-approach');
    expect(runtime.chapter2TriggerAction('valle_arrival', initial)).toBe('valle-arrival');

    expect(runtime.chapter2TriggerAction('board_boat_return', { ...initial, puertoArrived: true })).toBe('puerto-return');
    expect(runtime.chapter2TriggerAction('puerto_arrival', { ...initial, puertoArrived: true })).toBeNull();
    expect(runtime.chapter2TriggerAction('pyramid_approach', { ...initial, pyramidApproachSeen: true })).toBeNull();
    expect(runtime.chapter2TriggerAction('valle_arrival', { ...initial, valleArrived: true })).toBeNull();
  });

  it('keeps Valle arrival reusable for the post-Grin recovery phase only', () => {
    const base = {
      puertoArrived: true,
      pyramidApproachSeen: true,
      grinDefeated: true,
      valleArrived: true,
      ch2Complete: false,
    };
    expect(runtime.chapter2TriggerAction('valle_arrival', base)).toBe('valle-recovery');
    expect(runtime.chapter2TriggerAction('valle_arrival', { ...base, ch2Complete: true })).toBeNull();
  });
});

describe('Otterbrooke Chapter 1 population policy', () => {
  it('recognizes only the retired sequential Twoton tenancy namespace', () => {
    expect(runtime.isLegacyTwotonUnitId('brickton_unit_0')).toBe(true);
    expect(runtime.isLegacyTwotonUnitId('brickton_unit_13')).toBe(true);
    expect(runtime.isLegacyTwotonUnitId('brickton_lot_5900_5025')).toBe(false);
    expect(runtime.isLegacyTwotonUnitId('puerto_sol_unit_0')).toBe(false);
  });

  it('uses authored front/back frames for vertically parked directional cars', () => {
    expect(runtime.staticDirectionalVehicleFrame(undefined)).toBe(0);
    expect(runtime.staticDirectionalVehicleFrame(90)).toBe(1);
    expect(runtime.staticDirectionalVehicleFrame(270)).toBe(2);
  });

  it('clears meteor wildlife for Glint\'s walk home and after the Tick', () => {
    const flags = (set: ReadonlySet<string>) => (id: string): boolean => set.has(id);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('otterbrook', 'meteor_fell', flags(new Set()))).toBe(false);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('otterbrook', 'meteor_fell', flags(new Set(['glint_walk_home'])))).toBe(true);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('otterbrook', 'meteor_fell', flags(new Set(['tick_defeated'])))).toBe(true);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('brickton', 'meteor_fell', flags(new Set(['tick_defeated'])))).toBe(false);
  });

  it('destroys meteor roamers that were already alive when the quiet walk begins', () => {
    const destroyA = vi.fn();
    const destroyB = vi.fn();
    runtime.destroyRoamerSprites([{ spr: { destroy: destroyA } }, { spr: { destroy: destroyB } }]);
    expect(destroyA).toHaveBeenCalledOnce();
    expect(destroyB).toHaveBeenCalledOnce();
  });

  it('runs sparse humble traffic at 2 A.M., none in Hush morning, and normal traffic after restoration', () => {
    const fleet = ['commuter', 'bus', 'vehicle_clunker', 'grand_tourer'];
    expect(runtime.otterbrookTrafficPolicy('otterbrook', 'meteor-night', fleet, 9)).toEqual({
      types: ['bus', 'vehicle_clunker'],
      max: 2,
    });
    expect(runtime.otterbrookTrafficPolicy('otterbrook', 'hush-morning', fleet, 9)).toBeNull();
    expect(runtime.otterbrookTrafficPolicy('downtown_otterbrook', 'hush-morning', fleet, 4)).toBeNull();
    expect(runtime.otterbrookTrafficPolicy('otterbrook', 'restored-day', fleet, 9)).toEqual({ types: fleet, max: 9 });
    expect(runtime.otterbrookTrafficPolicy('brickton', undefined, fleet, 7)).toEqual({ types: fleet, max: 7 });
  });
});
