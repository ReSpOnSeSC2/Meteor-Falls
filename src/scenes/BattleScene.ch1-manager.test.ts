import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BATTLE_TEXT } from '../data/dialogue';
import { ENEMIES } from '../data/enemies';
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

type ManagerRuntime = {
  heroCommand(this: unknown, hero: unknown): Promise<boolean>;
};

function methods(): ManagerRuntime {
  return runtime.BattleScene.prototype as unknown as ManagerRuntime;
}

beforeEach(() => {
  GS.reset();
  vi.restoreAllMocks();
});

describe('Chapter 1 Manager encounter actual BattleScene seam', () => {
  it('surfaces Mia\'s PRAY tutorial exactly once on the real boss command row', async () => {
    const mia = makeHeroState('faye', 6);
    const unit = {
      hero: mia,
      defending: false,
      odoHp: { dead: false },
      status: {},
      bust: { point: () => ({ x: 100, y: 200 }) },
    };
    const ask = vi.fn(async (options: string[]): Promise<number> => options.indexOf('Defend'));
    const print = vi.fn(async (_line: string): Promise<void> => undefined);
    const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
      cfg: {
        enemyIds: ['the_suit', 'blazer_smiler'], advantage: 'none',
        guestChad: false, glintAssist: false, boss: true, prayTutorial: true,
      },
      enemies: [
        { def: ENEMIES.the_suit, alive: true },
        { def: ENEMIES.blazer_smiler, alive: true },
      ],
      prayHintShown: false,
      dlg: { ask },
      fx: { play: vi.fn(async (): Promise<void> => undefined) },
      cardTarget: () => ({ x: 100, y: 200 }),
      print,
      fill: (line: string) => line,
    });

    await methods().heroCommand.call(scene, unit);
    await methods().heroCommand.call(scene, unit);

    const rows = ask.mock.calls.map(([options]) => options as string[]);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toContain('Pray');
      expect(row).not.toContain('Run');
    }
    expect(print.mock.calls.filter(([line]) => line === BATTLE_TEXT.pray_hint)).toHaveLength(1);
    expect(scene.prayHintShown).toBe(true);
  });
});
