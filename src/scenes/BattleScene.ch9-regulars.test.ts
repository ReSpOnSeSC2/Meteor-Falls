import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENEMIES, type EnemyDef, type EnemyMove } from '../data/enemies';

const mocks = vi.hoisted(() => ({
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

vi.mock('../engine/audio', () => ({ AUDIO: mocks.audio }));

let runtime: typeof import('./BattleScene');

beforeAll(async () => {
  runtime = await import('./BattleScene');
});

type PrivateChapter9Runtime = {
  enemyAct(this: unknown, enemy: unknown): Promise<void>;
};

function battleRuntime(): PrivateChapter9Runtime {
  return runtime.BattleScene.prototype as unknown as PrivateChapter9Runtime;
}

function enemyUnit(def: EnemyDef, hp = def.hp): Record<string, unknown> {
  return {
    def,
    hp,
    letter: '',
    spr: { x: 400, y: 190, displayHeight: 128 },
    alive: true,
    crying: 0,
    hushed: 0,
    shield: 0,
    refolded: 0,
    paralyzed: 0,
    burn: 0,
    exposed: 0,
    marked: 0,
    rattled: 0,
    puppet: 0,
    gilded: 0,
    scouted: false,
  };
}

function heroTarget(): Record<string, unknown> {
  return {
    hero: { name: 'Rex' },
    latched: false,
    odoHp: { dead: false },
    status: { paralyzed: 0 },
  };
}

function sceneHarness(
  enemies: Array<Record<string, unknown>>,
  move: EnemyMove,
): { scene: Record<string, unknown>; target: Record<string, unknown>; popup: ReturnType<typeof vi.fn> } {
  const target = heroTarget();
  const popup = vi.fn();
  const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
    heroes: [target],
    enemies,
    aliveHeroes: () => [target],
    pickMove: () => move,
    tweens: { add: vi.fn() },
    fx: { popup, play: vi.fn(async (): Promise<void> => undefined) },
    print: vi.fn(async (_line: string): Promise<void> => undefined),
    settleDeaths: vi.fn(async (): Promise<void> => undefined),
    ended: false,
    chad: null,
  });
  return { scene, target, popup };
}

function moveByName(def: EnemyDef, name: string): EnemyMove {
  const move = def.moves.find((candidate) => candidate.name === name);
  if (!move) throw new Error(`${def.id} is missing ${name}`);
  return move;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Chapter 9 regular enemy runtime mechanics', () => {
  it('makes the Haystack Mimic feint impose a real three-turn action risk', async () => {
    const def = ENEMIES.haystack_mimic;
    const enemy = enemyUnit(def);
    const move = moveByName(def, 'play dead');
    const { scene, target } = sceneHarness([enemy], move);

    await battleRuntime().enemyAct.call(scene, enemy);

    expect(move).toMatchObject({ kind: 'status', status: 'paralyzed' });
    expect((target.status as Record<string, number>).paralyzed).toBe(3);
    expect(mocks.audio.sfx).toHaveBeenCalledWith('cancel');
  });

  it('lets the Ribcage Rattler reassemble 12% of its own chapter-scale HP', async () => {
    const def = ENEMIES.ribcage_rattler;
    const enemy = enemyUnit(def, 8_000);
    const move = moveByName(def, 'clatter apart');
    const { scene, popup } = sceneHarness([enemy], move);

    await battleRuntime().enemyAct.call(scene, enemy);

    expect(enemy.hp).toBe(9_800);
    expect(popup).toHaveBeenCalledWith(400, expect.any(Number), '+1800', expect.anything());
    expect(mocks.audio.sfx).toHaveBeenCalledWith('heal');
  });

  it('keeps legacy mend users on their existing ally-only flat heal', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const def = ENEMIES.tea_poltergeist;
    const caster = enemyUnit(def, 40);
    const ally = enemyUnit(ENEMIES.fog_hound, 10);
    const move = moveByName(def, 'one more cup?');
    const { scene } = sceneHarness([caster, ally], move);

    await battleRuntime().enemyAct.call(scene, caster);

    expect(caster.hp).toBe(40);
    expect(ally.hp).toBe(28);
  });
});
