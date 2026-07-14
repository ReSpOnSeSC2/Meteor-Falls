import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ENEMIES, ORIGAMI_REFOLD_TURNS, enemyElementProfile, type EnemyMove } from '../data/enemies';

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

type RefoldEnemy = {
  def: typeof ENEMIES.origami_warrior;
  hp: number;
  letter: string;
  spr: { x: number; y: number; clearTint: ReturnType<typeof vi.fn> };
  alive: boolean;
  crying: number;
  hushed: number;
  shield: number;
  refolded: number;
  paralyzed: number;
  burn: number;
  exposed: number;
  marked: number;
  rattled: number;
  puppet: number;
  gilded: number;
  scouted: boolean;
};

type PrivateRefoldRuntime = {
  enemyAct(this: unknown, enemy: RefoldEnemy): Promise<void>;
  revealColor(this: unknown, name: string, enemy: RefoldEnemy): Promise<void>;
  statusPhase(this: unknown): Promise<void>;
};

function battleRuntime(): PrivateRefoldRuntime {
  return runtime.BattleScene.prototype as unknown as PrivateRefoldRuntime;
}

function refoldEnemy(): RefoldEnemy {
  const def = ENEMIES.origami_warrior;
  return {
    def,
    hp: def.hp,
    letter: '',
    spr: { x: 400, y: 200, clearTint: vi.fn() },
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

describe('Chapter 8 Origami Warrior runtime', () => {
  it('executes Refold, exposes the live profile, and relaxes on the fourth status phase', async () => {
    const enemy = refoldEnemy();
    const target = { hero: { name: 'Rex' }, latched: false, odoHp: { dead: false } };
    const refold = enemy.def.moves.find((move) => move.kind === 'refold') as EnemyMove;
    const print = vi.fn(async (_line: string): Promise<void> => undefined);
    const fxPlay = vi.fn(async (): Promise<void> => undefined);
    const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
      heroes: [target],
      enemies: [enemy],
      aliveHeroes: () => [target],
      pickMove: () => refold,
      tweens: { add: vi.fn() },
      fx: { play: fxPlay },
      print,
      settleDeaths: vi.fn(async (): Promise<void> => undefined),
      ended: false,
      chad: null,
    });

    await battleRuntime().enemyAct.call(scene, enemy);

    expect([enemy.shield, enemy.refolded]).toEqual([
      ORIGAMI_REFOLD_TURNS,
      ORIGAMI_REFOLD_TURNS,
    ]);
    expect(fxPlay).toHaveBeenCalledWith('shield_snap', expect.any(Object));
    expect(enemyElementProfile(enemy.def, enemy.refolded > 0)).toEqual({
      weakness: ['volt', 'freeze'],
      resists: ['fire'],
    });

    print.mockClear();
    await battleRuntime().revealColor.call(scene, 'Milo', enemy);
    expect(print.mock.calls.flat().join('\n')).toContain('volt, freeze');
    expect(print.mock.calls.flat().join('\n')).toContain('fire');

    print.mockClear();
    scene.heroes = [];
    const remaining: Array<[number, number]> = [];
    for (let phase = 0; phase < ORIGAMI_REFOLD_TURNS; phase++) {
      await battleRuntime().statusPhase.call(scene);
      remaining.push([enemy.shield, enemy.refolded]);
    }
    // Existing battle convention: the cast round's end phase is tick one.
    expect(remaining).toEqual([[3, 3], [2, 2], [1, 1], [0, 0]]);
    expect(print).toHaveBeenCalledWith(
      "Origami Warrior's creases relaxed. Its FIRE fold showed again.",
    );
    expect(enemyElementProfile(enemy.def, enemy.refolded > 0)).toEqual({
      weakness: ['fire', 'volt'],
      resists: ['freeze'],
    });

    print.mockClear();
    await battleRuntime().revealColor.call(scene, 'Milo', enemy);
    expect(print.mock.calls.flat().join('\n')).toContain('fire, volt');
    expect(print.mock.calls.flat().join('\n')).toContain('freeze');
  });
});
