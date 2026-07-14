import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BAG_MAX } from '../data/items';
import { GS, freshMushroomize } from '../engine/state';
import { INPUT } from '../engine/input';
import {
  TELEPORT_TOWN_DESTINATIONS,
  type TeleportMenuRequest,
} from '../engine/teleport-menu';

const mocks = vi.hoisted(() => ({
  playCutscene: vi.fn(async (): Promise<void> => undefined),
  toast: vi.fn(),
  audio: {
    sfx: vi.fn(),
    jingle: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
  },
}));

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

vi.mock('../engine/cutscene', () => ({ playCutscene: mocks.playCutscene }));
vi.mock('../engine/audio', () => ({ AUDIO: mocks.audio }));
vi.mock('../ui/windows', () => ({
  Dialogue: class DialogueStub {},
  makeWindow: vi.fn(),
  toast: mocks.toast,
  vars: (text: string): string => text,
  everyFrame: vi.fn(() => vi.fn()),
  DEPTH_UI: 90_000,
  overscanRect: vi.fn(() => ({ x: 0, y: 0, w: 0, h: 0 })),
}));

let runtime: typeof import('./OverworldScene');

beforeAll(async () => {
  runtime = await import('./OverworldScene');
});

beforeEach(() => {
  GS.reset();
  vi.clearAllMocks();
});

type PrivateCh8Runtime = {
  givePaperFanAndRestart(this: unknown): Promise<void>;
  mtShuTempleScene(this: unknown): Promise<void>;
  handleDefeat(this: unknown): void;
  executeTeleportRequest(this: unknown, request: TeleportMenuRequest): Promise<void>;
  signBeat(this: unknown, dialogueId: string): Promise<boolean>;
};

function ch8Runtime(): PrivateCh8Runtime {
  return runtime.OverworldScene.prototype as unknown as PrivateCh8Runtime;
}

function fluentImage(): Record<string, unknown> {
  const image: Record<string, unknown> = { x: 0, y: 0, destroy: vi.fn() };
  for (const method of ['setDepth', 'setOrigin', 'setDisplaySize', 'setScrollFactor']) {
    image[method] = vi.fn(() => image);
  }
  return image;
}

describe('Chapter 8 post-boss transactions', () => {
  it('keeps a full-bag Paper Fan pending, then grants and claims it exactly once', async () => {
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    const restartAtCh8BossSafePoint = vi.fn();
    const dlg = { say: vi.fn(async (): Promise<void> => undefined) };
    const scene = { cut: false, dlg, mapDef: { music: null }, restartAtCh8BossSafePoint };

    await ch8Runtime().givePaperFanAndRestart.call(scene);
    expect(GS.flag('paper_fan_claimed')).toBe(false);
    expect(GS.hasItem('paper_fan')).toBe(false);
    expect(restartAtCh8BossSafePoint).not.toHaveBeenCalled();

    GS.deserialize(GS.serialize());
    GS.data.party[0].bag.pop();
    await ch8Runtime().givePaperFanAndRestart.call(scene);
    expect(GS.flag('paper_fan_claimed')).toBe(true);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === 'paper_fan')).toHaveLength(1);
    expect(restartAtCh8BossSafePoint).toHaveBeenCalledOnce();

    await ch8Runtime().givePaperFanAndRestart.call(scene);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === 'paper_fan')).toHaveLength(1);
    expect(restartAtCh8BossSafePoint).toHaveBeenCalledOnce();
  });

  it('resumes each durable Heartlight stage without replaying an earlier stage', async () => {
    GS.setFlag('paper_dragon_defeated');
    GS.setFlag('paper_fan_claimed');
    const ember = fluentImage();
    const scene = {
      cut: false,
      mapDef: { music: 'mt_shu' },
      player: { x: 400, y: 500 },
      add: { image: vi.fn(() => ember) },
      tweens: { add: vi.fn() },
      cameras: { main: { flash: vi.fn() } },
      sparkleBurst: vi.fn(),
      wait: vi.fn(async (): Promise<void> => undefined),
      dlg: { say: vi.fn(async (): Promise<void> => undefined) },
    };

    await ch8Runtime().mtShuTempleScene.call(scene);
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
    expect(GS.flag('ch8_heartlight_seen')).toBe(true);
    expect(GS.flag('ember8')).toBe(true);
    expect(GS.data.embers).toBe(8);
    expect(GS.flag('ch8_complete')).toBe(true);

    // Simulate a save committed after the panel but before Ember presentation.
    GS.setFlag('ch8_complete', false);
    GS.setFlag('ember8', false);
    GS.data.embers = 7;
    GS.deserialize(GS.serialize());
    mocks.playCutscene.mockClear();
    scene.add.image.mockClear();
    await ch8Runtime().mtShuTempleScene.call(scene);
    expect(mocks.playCutscene).not.toHaveBeenCalled();
    expect(scene.add.image).toHaveBeenCalledOnce();
    expect(GS.flag('ember8')).toBe(true);
    expect(GS.data.embers).toBe(8);
    expect(GS.flag('ch8_complete')).toBe(true);

    // An Ember-flagged interrupted save repairs only the scalar and card stage.
    GS.setFlag('ch8_complete', false);
    GS.data.embers = 7;
    GS.deserialize(GS.serialize());
    scene.add.image.mockClear();
    await ch8Runtime().mtShuTempleScene.call(scene);
    expect(mocks.playCutscene).not.toHaveBeenCalled();
    expect(scene.add.image).not.toHaveBeenCalled();
    expect(GS.data.embers).toBe(8);
    expect(GS.flag('ch8_complete')).toBe(true);

    // A fully committed chapter is terminal, even if its trigger fires again.
    scene.add.image.mockClear();
    await ch8Runtime().mtShuTempleScene.call(scene);
    expect(mocks.playCutscene).not.toHaveBeenCalled();
    expect(scene.add.image).not.toHaveBeenCalled();
    expect(GS.data.embers).toBe(8);
  });
});

describe('Chapter 8 defeat and Teleport runtime seams', () => {
  it('atomically clears Mushroomized and respawns at its recorded clean pocket on defeat', () => {
    const recovery = {
      map: 'spore_forest', x: 17 * 64 + 32, y: 70 * 64 + 48, facing: 'up' as const,
    };
    GS.data.cashOnHand = 101;
    GS.data.party[0].down = true;
    GS.data.party[0].hp = 0;
    GS.data.mushroomize = {
      active: true, phase: 0, source: 'spore_puffer', recovery,
    };
    const restart = vi.fn();
    const scene = {
      cut: false,
      registry: { set: vi.fn() },
      add: { image: vi.fn(() => fluentImage()) },
      scale: { width: 1600, height: 900 },
      time: { delayedCall: vi.fn((_ms: number, callback: () => void) => callback()) },
      scene: { restart },
    };

    ch8Runtime().handleDefeat.call(scene);
    expect(GS.data.cashOnHand).toBe(50);
    expect(GS.data.party[0]).toMatchObject({ down: false, hp: GS.data.party[0].maxHp });
    expect(GS.data.mushroomize).toEqual(freshMushroomize());
    expect(restart).toHaveBeenCalledWith({
      mapId: recovery.map, x: recovery.x, y: recovery.y, facing: recovery.facing,
    });
  });

  it('charges successful Beta once, reforms followers, and leaves parked vehicle state byte-identical', async () => {
    const rex = GS.data.party[0];
    rex.level = 40;
    rex.pp = 20;
    GS.data.keyItems.push('star_locket');
    GS.setFlag('awake_teleport_b');
    GS.setFlag('ch8_arrived');
    GS.data.carLocation.the_stretch = 'asia';
    GS.data.vehicleParking.the_stretch = {
      area: 'lotus_harbor', x: 5_600, y: 4_100, facing: 'left',
    };
    const vehicleSnapshot = JSON.stringify({
      activeVehicle: GS.data.activeVehicle,
      garage: GS.data.garage,
      carLocation: GS.data.carLocation,
      vehicleParking: GS.data.vehicleParking,
      drivingVehicle: GS.data.drivingVehicle,
    });
    const destination = TELEPORT_TOWN_DESTINATIONS.find((entry) => entry.id === 'lotus_harbor')!;
    const request: TeleportMenuRequest = {
      version: 1,
      ability: 'teleport_b',
      casterId: 'rex',
      destination: { ...destination, arrival: { ...destination.arrival } },
      origin: { map: 'bamboo_road', x: 400, y: 600, facing: 'right' },
      runUpNativePx: 32,
      ppCost: 4,
      ppAlreadyCharged: false,
    };
    const followerA = { spr: { setPosition: vi.fn() } };
    const followerB = { spr: { setPosition: vi.fn() } };
    const goThroughDoor = vi.fn();
    const player = {
      x: request.origin.x,
      y: request.origin.y,
      anims: { currentAnim: null, stop: vi.fn(), play: vi.fn() },
      setPosition: vi.fn((x: number, y: number) => { player.x = x; player.y = y; }),
      setDepth: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
    };
    const scene = {
      mapDef: { id: request.origin.map },
      player,
      transitioning: false,
      dlg: { busy: false },
      cut: false,
      facing: 'right',
      followers: [followerA, followerB],
      trail: [],
      cameras: { main: { flash: vi.fn(), shake: vi.fn() } },
      isRidingBmx: vi.fn(() => false),
      tryMove: vi.fn((x: number, y: number, dx: number, dy: number, vertical?: boolean) =>
        vertical ? y + dy : x + dx),
      levelLift: vi.fn(() => 0),
      wait: vi.fn(async (): Promise<void> => undefined),
      dustPuff: vi.fn(),
      goThroughDoor,
    };
    vi.spyOn(INPUT, 'dir').mockReturnValue({ x: 1, y: 0 });

    await ch8Runtime().executeTeleportRequest.call(scene, request);
    expect(rex.pp).toBe(16);
    expect(followerA.spr.setPosition).toHaveBeenCalledOnce();
    expect(followerB.spr.setPosition).toHaveBeenCalledOnce();
    expect(goThroughDoor).toHaveBeenCalledWith(
      destination.arrival.map,
      destination.arrival.x,
      destination.arrival.y,
      destination.arrival.facing,
    );
    expect(JSON.stringify({
      activeVehicle: GS.data.activeVehicle,
      garage: GS.data.garage,
      carLocation: GS.data.carLocation,
      vehicleParking: GS.data.vehicleParking,
      drivingVehicle: GS.data.drivingVehicle,
    })).toBe(vehicleSnapshot);
  });

  it('charges a wall failure once without travel, follower movement, or vehicle mutation', async () => {
    const rex = GS.data.party[0];
    rex.level = 40;
    rex.pp = 20;
    GS.data.keyItems.push('star_locket');
    GS.setFlag('awake_teleport_b');
    GS.setFlag('ch8_arrived');
    GS.data.carLocation.the_stretch = 'asia';
    GS.data.vehicleParking.the_stretch = {
      area: 'lotus_harbor', x: 5_600, y: 4_100, facing: 'left',
    };
    const vehicleSnapshot = JSON.stringify({
      activeVehicle: GS.data.activeVehicle,
      garage: GS.data.garage,
      carLocation: GS.data.carLocation,
      vehicleParking: GS.data.vehicleParking,
      drivingVehicle: GS.data.drivingVehicle,
    });
    const destination = TELEPORT_TOWN_DESTINATIONS.find((entry) => entry.id === 'lotus_harbor')!;
    const request: TeleportMenuRequest = {
      version: 1, ability: 'teleport_b', casterId: 'rex',
      destination: { ...destination, arrival: { ...destination.arrival } },
      origin: { map: 'bamboo_road', x: 400, y: 600, facing: 'right' },
      runUpNativePx: 32, ppCost: 4, ppAlreadyCharged: false,
    };
    const follower = { spr: { setPosition: vi.fn() } };
    const goThroughDoor = vi.fn();
    const player = {
      x: 400, y: 600,
      anims: { currentAnim: null, stop: vi.fn(), play: vi.fn() },
      setPosition: vi.fn(), setDepth: vi.fn(), setTint: vi.fn(), clearTint: vi.fn(),
    };
    const scene = {
      mapDef: { id: 'bamboo_road' }, player, transitioning: false,
      dlg: { busy: false }, cut: false, facing: 'right', followers: [follower], trail: [],
      cameras: { main: { flash: vi.fn(), shake: vi.fn() } },
      isRidingBmx: vi.fn(() => false),
      tryMove: vi.fn((x: number, y: number, _dx: number, _dy: number, vertical?: boolean) => vertical ? y : x),
      levelLift: vi.fn(() => 0), wait: vi.fn(async (): Promise<void> => undefined),
      dustPuff: vi.fn(), goThroughDoor,
    };
    vi.spyOn(INPUT, 'dir').mockReturnValue({ x: 1, y: 0 });

    await ch8Runtime().executeTeleportRequest.call(scene, request);
    expect(rex.pp).toBe(16);
    expect(follower.spr.setPosition).not.toHaveBeenCalled();
    expect(goThroughDoor).not.toHaveBeenCalled();
    expect(player.setTint).toHaveBeenCalled();
    expect(JSON.stringify({
      activeVehicle: GS.data.activeVehicle,
      garage: GS.data.garage,
      carLocation: GS.data.carLocation,
      vehicleParking: GS.data.vehicleParking,
      drivingVehicle: GS.data.drivingVehicle,
    })).toBe(vehicleSnapshot);
  });
});

describe('Chapter 8 optional cache transactions', () => {
  const caches = [
    ['q_lotus_jade_cache', 'jade_bi_disc'],
    ['q_bamboo_islet_cache', 'harbor_lantern'],
    ['q_spore_kiln_cache', 'ming_vase'],
    ['q_mt_shu_jade_cache', 'terracotta_soldier'],
  ] as const;

  it.each(caches)('%s retries on full hands and rejects direct re-entry after its one grant', async (flag, item) => {
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    const fadeRestart = vi.fn();
    const scene = {
      dlg: { say: vi.fn(async (): Promise<void> => undefined) },
      mapDef: { music: null },
      fadeRestart,
    };

    expect(await ch8Runtime().signBeat.call(scene, flag)).toBe(true);
    expect(GS.flag(flag)).toBe(false);
    expect(GS.hasItem(item)).toBe(false);
    expect(fadeRestart).not.toHaveBeenCalled();

    GS.deserialize(GS.serialize());
    GS.data.party[0].bag.pop();
    expect(await ch8Runtime().signBeat.call(scene, flag)).toBe(true);
    expect(GS.flag(flag)).toBe(true);
    expect(GS.data.party[0].bag.filter((id) => id === item)).toHaveLength(1);
    expect(fadeRestart).toHaveBeenCalledOnce();

    expect(await ch8Runtime().signBeat.call(scene, flag)).toBe(true);
    expect(GS.data.party[0].bag.filter((id) => id === item)).toHaveLength(1);
    expect(fadeRestart).toHaveBeenCalledOnce();
  });
});
