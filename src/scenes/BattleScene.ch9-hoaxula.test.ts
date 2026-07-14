import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { GS, makeHeroState } from '../engine/state';
import type { PhaseRunner, WindupSpec } from '../battle/phases';

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

const { playCutscene } = vi.hoisted(() => ({
  playCutscene: vi.fn(async (): Promise<void> => undefined),
}));
vi.mock('../engine/cutscene', () => ({ playCutscene }));

let runtime: typeof import('./BattleScene');

beforeAll(async () => {
  runtime = await import('./BattleScene');
});

type PrivateHoaxulaRuntime = {
  buildPhaseMachine(this: unknown): void;
  damageEnemy(this: unknown, enemy: unknown, damage: number, weak?: boolean, line?: string): Promise<void>;
  returnStolenGear(this: unknown): Promise<void>;
  enemyPhase(this: unknown, units?: readonly unknown[]): Promise<void>;
  windupLand(this: unknown, enemy: unknown, wind: WindupSpec): Promise<void>;
  victory(this: unknown): Promise<void>;
  defeat(this: unknown): Promise<void>;
};

function battleRuntime(): PrivateHoaxulaRuntime {
  return runtime.BattleScene.prototype as unknown as PrivateHoaxulaRuntime;
}

function bossUnit(): Record<string, unknown> {
  const def = ENEMIES.count_hoaxula;
  return {
    def,
    hp: def.hp,
    letter: '',
    spr: {
      x: 400,
      y: 180,
      displayHeight: 160,
      setTexture: vi.fn().mockReturnThis(),
    },
    alive: true,
    wear: 0,
    asleep: 0,
    frozen: 0,
    paralyzed: 0,
    rattled: 0,
    puppet: 0,
    broken: 0,
    composure: 100,
    composureMax: 100,
  };
}

function equippedParty(): { hero: ReturnType<typeof makeHeroState>; unit: Record<string, unknown> } {
  const hero = makeHeroState('rex', 46);
  hero.bag = ['cracked_bat', 'corn_dog'];
  hero.equip = { weapon: 'cracked_bat' };
  GS.data.party = [hero];
  const unit = {
    hero,
    latched: false,
    odoHp: { dead: false, value: hero.hp, freeze: vi.fn() },
    odoPp: { value: hero.pp, freeze: vi.fn() },
    status: {
      crying: 0,
      asleep: 0,
      paralyzed: 0,
      sunburn: 0,
      hushed: 0,
      shield: 0,
      ward: 0,
      reflect: 0,
      mirror: 0,
      steeled: 0,
    },
  };
  return { hero, unit };
}

function sceneHarness(): {
  scene: Record<string, unknown>;
  boss: Record<string, unknown>;
  hero: ReturnType<typeof makeHeroState>;
  heroUnit: Record<string, unknown>;
  textures: ReturnType<typeof vi.fn>;
  print: ReturnType<typeof vi.fn>;
} {
  const boss = bossUnit();
  const { hero, unit: heroUnit } = equippedParty();
  const textures = (boss.spr as { setTexture: ReturnType<typeof vi.fn> }).setTexture;
  const print = vi.fn(async (_line: string): Promise<void> => undefined);
  const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
    enemies: [boss],
    heroes: [heroUnit],
    phase: null,
    ended: false,
    aliveHeroes: () => [heroUnit],
    foeTarget: () => ({ x: 400, y: 180, spr: boss.spr }),
    cardTarget: () => ({ x: 100, y: 200 }),
    fx: {
      play: vi.fn(async (): Promise<void> => undefined),
      popup: vi.fn(),
      tethered: false,
    },
    print,
    printWait: print,
    summonUnits: vi.fn(async (): Promise<void> => undefined),
    battleAwakening: vi.fn(async (): Promise<void> => undefined),
    callingPulse: vi.fn(async (): Promise<void> => undefined),
    victory: vi.fn(async (): Promise<void> => undefined),
    cfg: {
      enemyIds: ['count_hoaxula'],
      advantage: 'none',
      guestChad: false,
      glintAssist: false,
      boss: true,
    },
  });
  battleRuntime().buildPhaseMachine.call(scene);
  return { scene, boss, hero, heroUnit, textures, print };
}

function phaseOf(scene: Record<string, unknown>): PhaseRunner {
  return scene.phase as PhaseRunner;
}

beforeEach(() => {
  GS.reset();
  vi.restoreAllMocks();
  vi.stubGlobal('window', { setTimeout: vi.fn() });
});

describe('Chapter 9 Count Hoaxula actual BattleScene seams', () => {
  it('starts theatrical, steals one exact valid slot on turn two, and mercy restores it once', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, hero, textures } = sceneHarness();
    const phase = phaseOf(scene);

    expect(phase.form?.id).toBe('theatrical');
    expect(textures).toHaveBeenLastCalledWith('battle_count_hoaxula');
    await phase.onPrayTier('miraculous');
    expect(scene.victory).not.toHaveBeenCalled();

    await phase.onBossTurnStart();
    expect(hero.equip.weapon).toBe('cracked_bat');
    await phase.onBossTurnStart();
    expect(hero.equip.weapon).toBeUndefined();
    expect(hero.bag.filter((id) => id === 'cracked_bat')).toHaveLength(1);
    expect(phase.stolen).toEqual([{ heroId: 'rex', slot: 'weapon', itemId: 'cracked_bat' }]);

    await phase.onHpFrac(0.5);
    expect(phase.form?.id).toBe('unmasked');
    expect(textures).toHaveBeenLastCalledWith('battle_count_hoaxula_unmasked');
    expect(GS.flag('ch9_unmasked_panel_seen')).toBe(true);
    expect(playCutscene).toHaveBeenCalledWith(scene, 'ch9_unmasked_departed');
    await phase.onPrayTier('good');

    expect(hero.equip.weapon).toBe('cracked_bat');
    expect(hero.bag.filter((id) => id === 'cracked_bat')).toHaveLength(1);
    expect(phase.stolen).toEqual([]);
    expect(scene.victory).toHaveBeenCalledTimes(1);
  });

  it('restores a post-unmask title profile at exact HP/form/turn context', () => {
    const boss = bossUnit();
    const { unit: heroUnit } = equippedParty();
    const scene = Object.assign(Object.create(runtime.BattleScene.prototype) as Record<string, unknown>, {
      enemies: [boss],
      heroes: [heroUnit],
      phase: null,
      cfg: {
        enemyIds: ['count_hoaxula'],
        advantage: 'none',
        guestChad: false,
        glintAssist: false,
        boss: true,
        devContext: {
          form: 'unmasked', hp: 47500, bossTurns: 2, introSeen: true,
          stolen: { heroId: 'rex', slot: 'weapon' },
        },
      },
      foeTarget: () => ({ x: 400, y: 180, spr: boss.spr }),
      fx: { play: vi.fn(async (): Promise<void> => undefined), popup: vi.fn() },
      print: vi.fn(async (): Promise<void> => undefined),
      printWait: vi.fn(async (): Promise<void> => undefined),
      summonUnits: vi.fn(async (): Promise<void> => undefined),
      battleAwakening: vi.fn(async (): Promise<void> => undefined),
      aliveHeroes: () => [heroUnit],
    });

    battleRuntime().buildPhaseMachine.call(scene);

    expect(phaseOf(scene).form?.id).toBe('unmasked');
    expect(boss.hp).toBe(47500);
    expect((heroUnit as { hero: ReturnType<typeof makeHeroState> }).hero.equip.weapon).toBeUndefined();
    expect(phaseOf(scene).stolen).toEqual([{ heroId: 'rex', slot: 'weapon', itemId: 'cracked_bat' }]);
    expect((boss.spr as { setTexture: ReturnType<typeof vi.fn> }).setTexture)
      .toHaveBeenLastCalledWith('battle_count_hoaxula_unmasked_w1');
  });

  it('refuses empty, unknown, missing-bag, and wrong-slot equipment references', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    for (const equip of [
      {},
      { weapon: 'not_an_item' },
      { weapon: 'tball_bat' },
      { body: 'cracked_bat' },
    ]) {
      const { scene, hero } = sceneHarness();
      hero.equip = { ...equip };
      await phaseOf(scene).onBossTurnStart();
      await phaseOf(scene).onBossTurnStart();
      expect(phaseOf(scene).stolen).toEqual([]);
      expect(hero.equip).toEqual(equip);
      expect(hero.bag).toEqual(['cracked_bat', 'corn_dog']);
    }
  });

  it('restores exact equipment before the actual defeat handler returns to overworld', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, hero } = sceneHarness();
    const phase = phaseOf(scene);
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();
    expect(hero.equip.weapon).toBeUndefined();

    GS.setFlag('feast_armed', false);
    scene.syncHeroMeters = vi.fn();
    scene.finish = vi.fn();
    await battleRuntime().defeat.call(scene);

    expect(hero.equip.weapon).toBe('cracked_bat');
    expect(hero.bag.filter((id) => id === 'cracked_bat')).toHaveLength(1);
    expect(phase.stolen).toEqual([]);
    expect(scene.finish).toHaveBeenCalledWith('defeat');
  });

  it('restores the exact slot on the standard zero-HP victory path too', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { scene, boss, hero, heroUnit } = sceneHarness();
    const phase = phaseOf(scene);
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();
    expect(hero.equip.weapon).toBeUndefined();

    (boss as { def: typeof ENEMIES.count_hoaxula }).def = {
      ...ENEMIES.count_hoaxula,
      exp: 0,
      cash: 0,
      drops: [],
    };
    Object.assign(heroUnit, {
      latched: false,
      odoHp: { dead: false, value: hero.hp, freeze: vi.fn() },
      odoPp: { value: hero.pp, freeze: vi.fn() },
    });
    scene.finish = vi.fn();
    scene.syncHeroMeters = vi.fn();
    delete scene.victory;

    await battleRuntime().victory.call(scene);

    expect(hero.equip.weapon).toBe('cracked_bat');
    expect(hero.bag.filter((id) => id === 'cracked_bat')).toHaveLength(1);
    expect(phase.stolen).toEqual([]);
    expect(scene.finish).toHaveBeenCalledWith('victory');
  });

  it('latches and freezes victory before awaiting the stolen-gear caption', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, boss, hero, heroUnit } = sceneHarness();
    const phase = phaseOf(scene);
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();

    (boss as { def: typeof ENEMIES.count_hoaxula }).def = {
      ...ENEMIES.count_hoaxula,
      exp: 0,
      cash: 0,
      drops: [],
    };
    let release!: () => void;
    const caption = new Promise<void>((resolve) => { release = resolve; });
    scene.print = vi.fn((line: string) => line.includes('came back') ? caption : Promise.resolve());
    scene.finish = vi.fn();
    delete scene.victory;

    const pending = battleRuntime().victory.call(scene);
    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(true);
    expect((heroUnit.odoHp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect((heroUnit.odoPp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect(hero.equip.weapon).toBe('cracked_bat');
    expect(phase.stolen).toEqual([{ heroId: 'rex', slot: 'weapon', itemId: 'cracked_bat' }]);
    expect(scene.finish).not.toHaveBeenCalled();

    release();
    await pending;
    expect(phase.stolen).toEqual([]);
    expect(scene.finish).toHaveBeenCalledWith('victory');
  });

  it('latches and freezes mercy before a blocked stolen-gear caption can race defeat', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, hero, heroUnit } = sceneHarness();
    const phase = phaseOf(scene);
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();
    await phase.onHpFrac(0.5);

    let release!: () => void;
    const caption = new Promise<void>((resolve) => { release = resolve; });
    scene.print = vi.fn((line: string) => line.includes('came back') ? caption : Promise.resolve());

    const pending = phase.onPrayTier('good');
    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(true);
    expect((heroUnit.odoHp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect((heroUnit.odoPp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect(hero.equip.weapon).toBe('cracked_bat');
    expect(phase.stolen).toEqual([{ heroId: 'rex', slot: 'weapon', itemId: 'cracked_bat' }]);
    expect(scene.victory).not.toHaveBeenCalled();

    release();
    await pending;
    expect(phase.stolen).toEqual([]);
    expect(scene.victory).toHaveBeenCalledWith(true);
  });

  it('latches and freezes defeat before a blocked stolen-gear caption can race victory', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { scene, hero, heroUnit } = sceneHarness();
    const phase = phaseOf(scene);
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();

    let release!: () => void;
    const caption = new Promise<void>((resolve) => { release = resolve; });
    scene.print = vi.fn((line: string) => line.includes('came back') ? caption : Promise.resolve());
    scene.syncHeroMeters = vi.fn();
    scene.finish = vi.fn();

    const pending = battleRuntime().defeat.call(scene);
    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(false);
    expect((heroUnit.odoHp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect((heroUnit.odoPp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect(hero.equip.weapon).toBe('cracked_bat');
    expect(phase.stolen).toEqual([{ heroId: 'rex', slot: 'weapon', itemId: 'cracked_bat' }]);
    expect(scene.finish).not.toHaveBeenCalled();

    release();
    await pending;
    expect(phase.stolen).toEqual([]);
    expect(scene.finish).toHaveBeenCalledWith('defeat');
  });

  it.each(['mercy', 'victory', 'defeat'] as const)(
    'round-trips the exact restored equipment and bag after the %s terminal path',
    async (outcome) => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const { scene, boss, hero } = sceneHarness();
      const phase = phaseOf(scene);
      await phase.onBossTurnStart();
      await phase.onBossTurnStart();
      expect(hero.equip.weapon).toBeUndefined();

      scene.syncHeroMeters = vi.fn();
      scene.finish = vi.fn();
      if (outcome === 'mercy') {
        await phase.onHpFrac(0.5);
        await phase.onPrayTier('good');
      } else if (outcome === 'victory') {
        (boss as { def: typeof ENEMIES.count_hoaxula }).def = {
          ...ENEMIES.count_hoaxula,
          exp: 0,
          cash: 0,
          drops: [],
        };
        delete scene.victory;
        await battleRuntime().victory.call(scene);
      } else {
        GS.setFlag('feast_armed', false);
        await battleRuntime().defeat.call(scene);
      }

      const exactBag = [...hero.bag];
      const exactEquip = { ...hero.equip };
      const serialized = GS.serialize();
      GS.reset();
      GS.deserialize(serialized);
      const restored = GS.data.party.find((candidate) => candidate.id === 'rex');

      expect(restored?.bag).toEqual(exactBag);
      expect(restored?.equip).toEqual(exactEquip);
      expect(restored?.bag.filter((id) => id === 'cracked_bat')).toHaveLength(1);
      expect(restored?.equip.weapon).toBe('cracked_bat');
    },
  );

  it('latches the last-hit victory before damage and dissolve copy can yield', async () => {
    const { scene, boss, heroUnit } = sceneHarness();
    boss.hp = 1;
    let release!: () => void;
    const caption = new Promise<void>((resolve) => { release = resolve; });
    scene.print = vi.fn(() => caption);

    const pending = battleRuntime().damageEnemy.call(scene, boss, 1, false, 'final hit');
    expect(scene.ended).toBe(true);
    expect(scene.won).toBe(true);
    expect((heroUnit.odoHp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect((heroUnit.odoPp as { freeze: ReturnType<typeof vi.fn> }).freeze).toHaveBeenCalledTimes(1);
    expect(scene.victory).not.toHaveBeenCalled();

    release();
    await pending;
    expect(scene.victory).toHaveBeenCalledWith(true);
  });

  it('FREEZE cancels a pending Command the Night instead of postponing it', async () => {
    const { scene, boss } = sceneHarness();
    const phase = phaseOf(scene);
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();
    await phase.onBossTurnStart();
    expect(phase.pendingWindup?.amount).toBe(800);

    boss.frozen = 1;
    await battleRuntime().enemyPhase.call(scene, [boss]);
    expect(phase.pendingWindup).toBeNull();
    expect((scene.fx as { popup: ReturnType<typeof vi.fn> }).popup).toHaveBeenCalledWith(
      400,
      expect.any(Number),
      'FIZZLE',
      expect.anything(),
    );
  });

  it('BREAK and retained Sleep each collapse the telegraph through enemyPhase', async () => {
    for (const answer of ['break', 'sleep'] as const) {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const { scene, boss } = sceneHarness();
      const phase = phaseOf(scene);
      await phase.onBossTurnStart();
      await phase.onBossTurnStart();
      await phase.onBossTurnStart();
      expect(phase.pendingWindup).not.toBeNull();

      if (answer === 'break') boss.broken = 1;
      else boss.asleep = 2;
      await battleRuntime().enemyPhase.call(scene, [boss]);

      expect(phase.pendingWindup).toBeNull();
      expect((scene.fx as { popup: ReturnType<typeof vi.fn> }).popup).toHaveBeenCalled();
      vi.restoreAllMocks();
    }
  });

  it('routes the windup through physical mitigation so ward is a real answer', async () => {
    const { scene, boss, heroUnit } = sceneHarness();
    (heroUnit.status as Record<string, number>).ward = 2;
    const applyHeroDamage = vi.fn();
    scene.applyHeroDamage = applyHeroDamage;

    await battleRuntime().windupLand.call(scene, boss, {
      line: 'hoaxula_command',
      amount: 800,
      element: 'volt',
      status: 'crying',
      turns: 1,
    });

    expect(applyHeroDamage).toHaveBeenCalledTimes(1);
    expect(applyHeroDamage.mock.calls[0][1]).toBeLessThan(800);
    expect((heroUnit.status as Record<string, number>).crying).toBe(1);
  });
});
