import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GS } from '../engine/state';

class Vector2Stub {
  constructor(public x = 0, public y = 0) {}
  normalize(): this {
    const length = this.length();
    if (length > 0) {
      this.x /= length;
      this.y /= length;
    }
    return this;
  }
  length(): number { return Math.hypot(this.x, this.y); }
  dot(other: { x: number; y: number }): number { return this.x * other.x + this.y * other.y; }
}

vi.mock('phaser', () => {
  class SceneStub {}
  const makeNamespace = (): unknown => {
    const fn = function Stub() {};
    return new Proxy(fn, {
      get: (_target, key) => key === 'Scene'
        ? SceneStub
        : key === 'Math'
          ? new Proxy({ Vector2: Vector2Stub }, { get: (target, child) => Reflect.get(target, child) ?? makeNamespace() })
          : makeNamespace(),
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

beforeEach(() => {
  GS.reset();
  vi.clearAllMocks();
});

type PrivateEncounterRuntime = {
  encounterLineClear(this: unknown, x0: number, y0: number, x1: number, y1: number, level: number): boolean;
  roamerCanEngagePlayer(this: unknown, roamer: any): boolean;
  patrolContactReady(this: unknown, patrol: any, now: number): boolean;
  updatePatrols(this: unknown, dt: number): void;
  patrolBattle(this: unknown, patrol: any): Promise<void>;
  contactBattle(this: unknown, roamer: any): Promise<void>;
  updateRoamers(this: unknown, dt: number): void;
  movingActorMove(
    this: unknown,
    kind: 'npc' | 'roamer' | 'patrol',
    actor: any,
    x: number,
    y: number,
    dx: number,
    dy: number,
    second: boolean,
    level: number,
  ): number;
  advanceJoiner(this: unknown, roamer: any, x: number, y: number, dtMs: number): number;
  facingVectorOf(this: unknown, facing: string): { x: number; y: number };
};

function encounters(): PrivateEncounterRuntime {
  return runtime.OverworldScene.prototype as unknown as PrivateEncounterRuntime;
}

function sprite(x: number, y: number): Record<string, any> {
  const spr: Record<string, any> = {
    x,
    y,
    height: 128,
    anims: {
      currentAnim: undefined,
      isPlaying: false,
      play: vi.fn(),
      stop: vi.fn(),
    },
    destroy: vi.fn(),
  };
  spr.setDepth = vi.fn(() => spr);
  spr.setFrame = vi.fn(() => spr);
  return spr;
}

function roamer(enemyId: string, x: number, y: number, level: number): Record<string, any> {
  return {
    spr: sprite(x, y),
    enemyId,
    facing: 'down',
    vx: 0,
    vy: 0,
    think: 1000,
    home: { x: -1000, y: -1000, w: 2000, h: 2000 },
    dead: false,
    level,
  };
}

describe('overworld encounter geometry', () => {
  it('blocks encounter sight on tile walls, terrace seams, and authored solids', () => {
    const scene = {
      maxLevel: 1,
      solidTiles: [[false, false, false]],
      levelGrid: [[0, 0, 0]],
      mapDef: { grid: ['sss'] },
      solids: [] as Array<{ x: number; y: number; w: number; h: number }>,
    };

    expect(encounters().encounterLineClear.call(scene, 32, 32, 160, 32, 0)).toBe(true);
    scene.solidTiles[0][1] = true;
    expect(encounters().encounterLineClear.call(scene, 32, 32, 160, 32, 0)).toBe(false);
    scene.solidTiles[0][1] = false;
    scene.levelGrid[0][1] = 1;
    expect(encounters().encounterLineClear.call(scene, 32, 32, 160, 32, 0)).toBe(false);
    scene.levelGrid[0][1] = 0;
    scene.solids.push({ x: 92, y: 20, w: 8, h: 24 });
    expect(encounters().encounterLineClear.call(scene, 32, 32, 160, 32, 0)).toBe(false);

    expect(runtime.segmentHitsRect(0, 0, 10, 0, { x: 4, y: -1, w: 2, h: 2 })).toBe(true);
    expect(runtime.segmentHitsRect(0, 0, 10, 0, { x: 4, y: 2, w: 2, h: 2 })).toBe(false);
  });

  it('starts roots_sentry contact in patrol state and preserves the green back-contact advantage', async () => {
    const patrol = {
      spr: sprite(100, 100),
      def: { enemy: 'coily_cicada', route: [[0, 0]] },
      state: 'patrol',
      facing: 'right',
      level: 0,
      dead: false,
      bang: null,
      wp: 0,
      alertT: 0,
      lose: 0,
    };
    const patrolBattle = vi.fn();
    const contactScene = {
      patrols: [patrol],
      player: { x: 60, y: 100 },
      playerLevel: 0,
      time: { now: 2000 },
      battleCooldown: 0,
      patrolContactReady: encounters().patrolContactReady,
      patrolBattle,
    };
    encounters().updatePatrols.call(contactScene, 0.016);
    expect(patrolBattle).toHaveBeenCalledWith(patrol);

    const startBattle = vi.fn(async () => 'victory' as const);
    const battleScene = {
      time: { now: 2000 },
      battleCooldown: 0,
      player: contactScene.player,
      facingVectorOf: encounters().facingVectorOf,
      startBattle,
    };
    await encounters().patrolBattle.call(battleScene, patrol);
    expect(startBattle).toHaveBeenCalledWith(['coily_cicada'], 'player', []);
  });

  it('does not start patrol contact across elevation planes', () => {
    const patrol = {
      spr: sprite(100, 100),
      def: { enemy: 'coily_cicada', route: [[0, 0]] },
      state: 'alert',
      facing: 'right',
      level: 1,
      dead: false,
      bang: null,
      wp: 0,
      alertT: 1000,
      lose: 0,
    };
    const patrolBattle = vi.fn();
    const scene = {
      patrols: [patrol],
      player: { x: 100, y: 100 },
      playerLevel: 0,
      time: { now: 2000 },
      battleCooldown: 0,
      patrolContactReady: encounters().patrolContactReady,
      patrolBattle,
      levelAfterStep: vi.fn(() => 1),
      levelLift: vi.fn(() => 0),
    };
    encounters().updatePatrols.call(scene, 0.016);
    expect(patrolBattle).not.toHaveBeenCalled();
  });

  it('gates roamer contact on both elevation and line of sight', () => {
    const player = { x: 100, y: 100 };
    const contactBattle = vi.fn();
    const candidate = roamer('tick_nymph', 100, 100, 1);
    const scene: Record<string, any> = {
      roamers: [candidate],
      player,
      playerLevel: 0,
      time: { now: 2000 },
      battleCooldown: 0,
      avgPartyLevel: vi.fn(() => 1),
      roamerCanEngagePlayer: encounters().roamerCanEngagePlayer,
      encounterLineClear: vi.fn(() => true),
      contactBattle,
      roamerBodyAt: (actor: any, x = actor.spr.x, y = actor.spr.y) => ({ x: x - 20, y: y - 32, w: 40, h: 32 }),
      collidesActor: vi.fn(() => false),
      levelAfterStep: vi.fn((level: number) => level),
      levelLift: vi.fn(() => 0),
    };

    encounters().updateRoamers.call(scene, 0.016);
    expect(contactBattle).not.toHaveBeenCalled();

    candidate.level = 0;
    scene.encounterLineClear.mockReturnValue(false);
    encounters().updateRoamers.call(scene, 0.016);
    expect(contactBattle).not.toHaveBeenCalled();

    scene.encounterLineClear.mockReturnValue(true);
    encounters().updateRoamers.call(scene, 0.016);
    expect(contactBattle).toHaveBeenCalledWith(candidate);
  });

  it('packs and alerts only visible roamers on the initiating terrace', async () => {
    const lead = roamer('tick_nymph', 0, 0, 1);
    const packed = roamer('coily_cicada', 80, 0, 1);
    const otherLevel = roamer('hill_slug_deluxe', 40, 0, 0);
    const behindWall = roamer('tick_nymph', 100, 0, 1);
    const joiner = roamer('skeeter_swarm', 200, 0, 1);
    const startBattle = vi.fn(async () => 'victory' as const);
    const scene = {
      time: { now: 2000 },
      battleCooldown: 0,
      player: { x: 0, y: 0 },
      playerLevel: 1,
      roamers: [lead, packed, otherLevel, behindWall, joiner],
      avgPartyLevel: vi.fn(() => 1),
      roamerCanEngagePlayer: encounters().roamerCanEngagePlayer,
      encounterLineClear: vi.fn((x0: number) => x0 !== behindWall.spr.x),
      facingVector: vi.fn(() => new Vector2Stub(1, 0)),
      startBattle,
    };

    await encounters().contactBattle.call(scene, lead);
    expect(startBattle).toHaveBeenCalledOnce();
    const [enemyIds, , pack, options] = startBattle.mock.calls[0] as unknown as [
      string[],
      string,
      Array<Record<string, any>>,
      { joiners: Array<Record<string, any>> },
    ];
    expect(enemyIds).toEqual(['tick_nymph', 'coily_cicada']);
    expect(pack).toEqual([lead, packed]);
    expect(options.joiners).toEqual([joiner]);
  });

  it('bounds the join dash, uses actor collision, and recomputes distance after movement', () => {
    const blocked = roamer('coily_cicada', 0, 0, 0);
    const blockedScene = {
      movingActorMove: encounters().movingActorMove,
      roamerBodyAt: (actor: any, x = actor.spr.x, y = actor.spr.y) => ({ x: x - 20, y: y - 32, w: 40, h: 32 }),
      collidesActor: vi.fn(() => true),
      levelAfterStep: vi.fn((level: number) => level),
      levelLift: vi.fn(() => 0),
    };
    expect(encounters().advanceJoiner.call(blockedScene, blocked, 200, 0, 1000)).toBe(200);
    expect(blocked.spr.x).toBe(0);
    expect(blockedScene.collidesActor).toHaveBeenCalled();

    const open = roamer('coily_cicada', 0, 0, 0);
    const openScene = {
      ...blockedScene,
      collidesActor: vi.fn(() => false),
      levelAfterStep: vi.fn(() => 1),
      levelLift: vi.fn(() => 500),
    };
    expect(encounters().advanceJoiner.call(openScene, open, 10, 10, 1000)).toBe(0);
    expect([open.spr.x, open.spr.y, open.level]).toEqual([10, 10, 1]);
    expect(open.spr.setDepth).toHaveBeenLastCalledWith(510);
  });
});
