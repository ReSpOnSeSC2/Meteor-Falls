import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { GS, makeHeroState } from '../engine/state';
import type { PhaseRunner } from '../battle/phases';

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

type SentinelRuntime = {
  buildPhaseMachine(this: unknown): void;
  damageEnemy(this: unknown, enemy: unknown, damage: number): Promise<void>;
  glintPhase(this: unknown): Promise<void>;
};

function methods(): SentinelRuntime {
  return runtime.BattleScene.prototype as unknown as SentinelRuntime;
}

function sentinelUnit(): Record<string, unknown> {
  const def = ENEMIES.hush_sentinel;
  return {
    def,
    hp: def.hp,
    letter: '',
    spr: {
      x: 400, y: 170, displayHeight: 160,
      setTexture: vi.fn().mockReturnThis(),
    },
    alive: true,
    wear: 0,
    asleep: 0,
    crying: 0,
    hushed: 0,
    frozen: 0,
    paralyzed: 0,
    rattled: 0,
    puppet: 0,
    broken: 0,
    composure: 100,
    composureMax: 100,
    exposed: 0,
    marked: 0,
    gilded: 0,
    shield: 0,
    stolenCash: 0,
    summoned: false,
  };
}

function heroUnit(): Record<string, unknown> {
  const hero = makeHeroState('rex', 7);
  GS.data.party = [hero];
  return {
    hero,
    latched: false,
    defending: false,
    odoHp: {
      dead: false,
      target: hero.hp,
      value: hero.hp,
      freeze: vi.fn(),
      heal: vi.fn(),
    },
    odoPp: { value: hero.pp, freeze: vi.fn() },
    status: {
      crying: 0, asleep: 0, paralyzed: 0, sunburn: 0, hushed: 0,
      shield: 0, ward: 0, reflect: 0, mirror: 0, steeled: 0,
    },
    bust: { point: () => ({ x: 100, y: 200 }) },
  };
}

function harness(devTurn?: number): {
  scene: Record<string, unknown>;
  boss: Record<string, unknown>;
  hero: Record<string, unknown>;
  awakening: ReturnType<typeof vi.fn>;
  print: ReturnType<typeof vi.fn>;
} {
  const boss = sentinelUnit();
  const hero = heroUnit();
  const print = vi.fn(async (): Promise<void> => undefined);
  const awakening = vi.fn(async (id: string): Promise<void> => {
    if (id === 'old_light') GS.setFlag('awake_surge_a');
  });
  const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
    enemies: [boss],
    heroes: [hero],
    phase: null,
    ended: false,
    won: false,
    cfg: {
      enemyIds: ['hush_sentinel'], advantage: 'none', guestChad: false,
      glintAssist: true, glintSupernova: true, boss: true,
      ...(devTurn === undefined ? {} : {
        devContext: { encounter: 'hush_sentinel', bossTurns: devTurn, introSeen: true, hp: 120 },
      }),
    },
    aliveHeroes: () => [hero],
    foeTarget: () => ({ x: 400, y: 170, spr: boss.spr }),
    cardTarget: () => ({ x: 100, y: 200 }),
    fx: {
      play: vi.fn(async (): Promise<void> => undefined),
      popup: vi.fn(),
      tethered: false,
    },
    print,
    printWait: print,
    battleAwakening: awakening,
    summonUnits: vi.fn(async (): Promise<void> => undefined),
    callingPulse: vi.fn(async (): Promise<void> => undefined),
    healHero: vi.fn(),
    victory: vi.fn(async (): Promise<void> => undefined),
  });
  methods().buildPhaseMachine.call(scene);
  return { scene, boss, hero, awakening, print };
}

beforeEach(() => {
  GS.reset();
  vi.restoreAllMocks();
});

describe('Chapter 1 Hush Sentinel actual BattleScene seams', () => {
  it('fires the opening, Surge awakening, Hushed cadence, and fixed turn-five repel in order', async () => {
    const { scene, hero, awakening, print } = harness();
    const phase = scene.phase as PhaseRunner;

    await phase.onBossTurnStart();
    expect(print).toHaveBeenCalled();
    expect(awakening).not.toHaveBeenCalled();

    await phase.onBossTurnStart();
    expect(awakening).toHaveBeenCalledTimes(1);
    expect(awakening).toHaveBeenCalledWith('old_light');
    expect(GS.flag('awake_surge_a')).toBe(true);

    await phase.onBossTurnStart();
    expect((hero.status as Record<string, number>).hushed).toBe(2);
    await phase.onBossTurnStart();
    expect(scene.ended).toBe(false);
    await phase.onBossTurnStart();

    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(true);
    expect(scene.victory).toHaveBeenCalledTimes(1);
    expect(scene.victory).toHaveBeenCalledWith(true);
    expect((hero.odoHp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledOnce();
    expect((hero.odoPp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledOnce();
  });

  it('restores a named turn-five profile into the real script frontier', async () => {
    const { scene, boss } = harness(4);
    const phase = scene.phase as PhaseRunner;
    expect(boss.hp).toBe(120);

    await phase.onBossTurnStart();

    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(true);
    expect(scene.victory).toHaveBeenCalledTimes(1);
    expect(scene.victory).toHaveBeenCalledWith(true);
  });

  it('cannot be killed before the scripted resolution while Glint is supernova', async () => {
    const { scene, boss } = harness();
    boss.hp = 1;

    await methods().damageEnemy.call(scene, boss, 999);

    expect(boss.hp).toBe(1);
    expect(boss.alive).toBe(true);
    expect(scene.ended).toBe(false);
    expect(scene.victory).not.toHaveBeenCalled();
  });

  it('routes Glint through a boss-scale hit and a party-wide protective heal', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, boss } = harness();
    const before = boss.hp as number;

    await methods().glintPhase.call(scene);

    expect(boss.hp).toBe(before - 34);
    expect(scene.healHero).toHaveBeenCalledOnce();
    expect((scene.fx as { play: ReturnType<typeof vi.fn> }).play).toHaveBeenCalledTimes(2);
  });
});
