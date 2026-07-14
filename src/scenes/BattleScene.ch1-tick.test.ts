import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENEMIES, type EnemyMove } from '../data/enemies';
import { GS, makeHeroState } from '../engine/state';

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

let runtime: typeof import('./BattleScene');

beforeAll(async () => {
  runtime = await import('./BattleScene');
});

type TickRuntime = {
  pickMove(this: unknown, enemy: unknown): EnemyMove;
  enemyAct(this: unknown, enemy: unknown): Promise<void>;
  breakLatch(this: unknown): void;
  damageEnemy(this: unknown, enemy: unknown, damage: number): Promise<void>;
  shutdownBattle(this: unknown): void;
};

function methods(): TickRuntime {
  return runtime.BattleScene.prototype as unknown as TickRuntime;
}

function move(kind: EnemyMove['kind']): EnemyMove {
  const found = ENEMIES.titanic_tick.moves.find((candidate) => candidate.kind === kind);
  if (!found) throw new Error(`Titanic Tick is missing ${kind}`);
  return found;
}

function harness(): {
  scene: Record<string, unknown>;
  tick: Record<string, unknown>;
  hero: Record<string, unknown>;
  emit: ReturnType<typeof vi.fn>;
} {
  const heroState = makeHeroState('rex', 7);
  GS.data.party = [heroState];
  const hp = {
    dead: false,
    target: heroState.hp,
    value: heroState.hp,
    freeze: vi.fn(),
  };
  const hero = {
    hero: heroState,
    latched: false,
    defending: false,
    odoHp: hp,
    odoPp: { value: heroState.pp, freeze: vi.fn() },
    status: {
      crying: 0, asleep: 0, paralyzed: 0, sunburn: 0, hushed: 0,
      shield: 0, ward: 0, reflect: 0, mirror: 0, steeled: 0,
      guarded: 0, decoy: 0, evasion: 0, flowing: 0, braced: 0,
    },
    bust: { point: () => ({ x: 100, y: 200 }) },
  };
  const tick = {
    def: ENEMIES.titanic_tick,
    hp: 120,
    letter: '',
    spr: { x: 400, y: 170, displayHeight: 160 },
    alive: true,
    crying: 0,
    hushed: 0,
    asleep: 0,
    shield: 0,
    exposed: 0,
    marked: 0,
    broken: 0,
    composure: 100,
    composureMax: 100,
    stolenCash: 0,
    summoned: false,
  };
  const emit = vi.fn();
  const fx = {
    tethered: false,
    attachTether: vi.fn(function attach(this: { tethered: boolean }): void { this.tethered = true; }),
    severTether: vi.fn(function sever(this: { tethered: boolean }): void { this.tethered = false; }),
    play: vi.fn(async (): Promise<void> => undefined),
    popup: vi.fn(),
  };
  const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
    enemies: [tick],
    heroes: [hero],
    phase: null,
    ended: false,
    won: false,
    endEventEmitted: false,
    terminalOutcome: null,
    cfg: {
      enemyIds: ['titanic_tick'], advantage: 'none', guestChad: false,
      glintAssist: false, glintSupernova: false, boss: true,
    },
    fx,
    tweens: { add: vi.fn(), killAll: vi.fn() },
    time: { removeAllEvents: vi.fn() },
    cameras: { main: { shake: vi.fn(), flash: vi.fn() } },
    game: { events: { emit } },
    aliveHeroes: () => [hero],
    cardTarget: () => ({ x: 100, y: 200 }),
    foeTarget: () => ({ x: 400, y: 170, spr: tick.spr }),
    fill: (line: string) => line,
    print: vi.fn(async (): Promise<void> => undefined),
    heroDefenseS: () => 1,
    applyHeroDamage: (_unit: unknown, damage: number) => { hp.target -= damage; hp.value = hp.target; },
    settleDeaths: vi.fn(async (): Promise<void> => undefined),
    syncHeroMeters: vi.fn(),
    victory: vi.fn(async (): Promise<void> => undefined),
  });
  return { scene, tick, hero, emit };
}

beforeEach(() => {
  GS.reset();
  vi.restoreAllMocks();
});

describe('Chapter 1 Titanic Tick actual BattleScene seams', () => {
  it('never selects drain before latch and suppresses re-latch while attached', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, tick, hero } = harness();

    expect(methods().pickMove.call(scene, tick).kind).toBe('latch');
    hero.latched = true;
    expect(methods().pickMove.call(scene, tick).kind).toBe('drain');
  });

  it('attaches visibly, then drains only the attached living hero', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, tick, hero } = harness();
    const hp = hero.odoHp as { target: number };
    const beforeHp = hp.target;
    const beforeTick = tick.hp as number;

    scene.pickMove = () => move('latch');
    await methods().enemyAct.call(scene, tick);
    expect(hero.latched).toBe(true);
    expect((scene.fx as { attachTether: ReturnType<typeof vi.fn> }).attachTether).toHaveBeenCalledOnce();

    scene.pickMove = () => move('drain');
    await methods().enemyAct.call(scene, tick);
    expect(hp.target).toBe(beforeHp - 10);
    expect(tick.hp).toBeGreaterThan(beforeTick);
  });

  it('uses the shared Fire/Salt release seam to clear state and sever the tether', () => {
    const { scene, hero } = harness();
    hero.latched = true;
    (scene.fx as { tethered: boolean }).tethered = true;

    methods().breakLatch.call(scene);

    expect(hero.latched).toBe(false);
    expect((scene.fx as { severTether: ReturnType<typeof vi.fn> }).severTether).toHaveBeenCalledOnce();
    expect((scene.fx as { tethered: boolean }).tethered).toBe(false);
  });

  it('clears latch/tether before the zero-HP victory presentation', async () => {
    const { scene, tick, hero } = harness();
    tick.hp = 1;
    hero.latched = true;
    (scene.fx as { tethered: boolean }).tethered = true;

    await methods().damageEnemy.call(scene, tick, 1);

    expect(hero.latched).toBe(false);
    expect((scene.fx as { tethered: boolean }).tethered).toBe(false);
    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(true);
    expect(scene.victory).toHaveBeenCalledTimes(1);
    expect(scene.victory).toHaveBeenCalledWith(true);
  });

  it('turns an unsolicited scene stop into one defeat event and releases battle-local state', () => {
    const { scene, hero, emit } = harness();
    hero.latched = true;
    (scene.fx as { tethered: boolean }).tethered = true;
    vi.stubGlobal('window', { mfBattle: scene });

    methods().shutdownBattle.call(scene);
    methods().shutdownBattle.call(scene);

    expect(hero.latched).toBe(false);
    expect((scene.fx as { tethered: boolean }).tethered).toBe(false);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('mf-battle-end', 'defeat');
    expect((window as unknown as { mfBattle?: unknown }).mfBattle).toBeUndefined();
  });
});
