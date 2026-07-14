import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BAG_MAX } from '../data/items';
import { CH9_WORLD, nativeFeet as ch9NativeFeet } from '../data/maps_ch9';
import { DIALOGUE } from '../data/dialogue';
import { CH9_BUNI_FLAGS, CH9_BUNI_INGREDIENTS, CH9_BUNI_PICKUP_INTERACTIONS } from '../engine/ch9Quests';
import { CH9_STORY_FLAGS, CH9_TRAIN_TICKET_ID } from '../engine/ch9Story';
import { GS, makeHeroState } from '../engine/state';
import { s } from '../spritegen/scale';

const mocks = vi.hoisted(() => ({
  playCutscene: vi.fn(async (_scene?: unknown, _id?: string): Promise<void> => undefined),
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

type BuniPickupId = keyof typeof CH9_BUNI_PICKUP_INTERACTIONS;

type PrivateCh9Runtime = {
  bertAirBeat(this: unknown): Promise<void>;
  ch9ArrivalScene(this: unknown): Promise<void>;
  applyCh9BuniInteraction(this: unknown, interaction: 'start' | 'smantana' | 'branza' | 'mushrooms' | 'cabbage' | 'plums' | 'return'): unknown;
  ch9BuniBeat(this: unknown): Promise<void>;
  ch9BuniPickup(this: unknown, id: BuniPickupId): Promise<void>;
  countHoaxulaBossScene(this: unknown): Promise<void>;
  giveCountCandelabraAndRestart(this: unknown): Promise<void>;
  restartAtCh9PostBossPoint(this: unknown): void;
  runChoice(this: unknown, id: 'ch9_count'): Promise<void>;
  ch9MonasteryScene(this: unknown, frontier: 'trial' | 'awakening' | 'bell'): Promise<void>;
  awakeningBeat(this: unknown, id: string, commitBeforePresentation?: boolean): Promise<void>;
};

function ch9Runtime(): PrivateCh9Runtime {
  return runtime.OverworldScene.prototype as unknown as PrivateCh9Runtime;
}

function fluentImage(): Record<string, unknown> {
  const image: Record<string, unknown> = { x: 0, y: 0, destroy: vi.fn() };
  for (const method of ['setDepth', 'setOrigin', 'setDisplaySize', 'setScrollFactor']) {
    image[method] = vi.fn(() => image);
  }
  return image;
}

function markPippa(present: boolean): void {
  for (const id of ['faye', 'milo', 'dorin'] as const) {
    if (!GS.data.party.some((hero) => hero.id === id)) {
      GS.data.party.push(makeHeroState(id, 46, GS.data.heroNames[id]));
    }
  }
  const pippa = makeHeroState('pippa', 46, GS.data.heroNames.pippa);
  if (present) {
    GS.data.party.push(pippa);
    GS.setFlag('pippa_left', false);
  } else {
    GS.data.departedHeroes.pippa = pippa;
    GS.setFlag('pippa_left');
  }
}

function trainScene(pick = 0): {
  cut: boolean;
  dlg: { say: ReturnType<typeof vi.fn>; ask: ReturnType<typeof vi.fn> };
  goThroughDoor: ReturnType<typeof vi.fn>;
} {
  return {
    cut: false,
    dlg: {
      say: vi.fn(async (): Promise<void> => undefined),
      ask: vi.fn(async (): Promise<number> => pick),
    },
    goThroughDoor: vi.fn(),
  };
}

function buniScene(): {
  cut: boolean;
  dlg: { say: ReturnType<typeof vi.fn> };
  applyCh9BuniInteraction: PrivateCh9Runtime['applyCh9BuniInteraction'];
} {
  return {
    cut: false,
    dlg: { say: vi.fn(async (): Promise<void> => undefined) },
    applyCh9BuniInteraction: ch9Runtime().applyCh9BuniInteraction,
  };
}

function monasteryScene(): {
  cut: boolean;
  mapDef: { music: string };
  player: { x: number; y: number };
  dlg: { say: ReturnType<typeof vi.fn> };
  cameras: { main: { flash: ReturnType<typeof vi.fn> } };
  add: { image: ReturnType<typeof vi.fn> };
  tweens: { add: ReturnType<typeof vi.fn> };
  sparkleBurst: ReturnType<typeof vi.fn>;
  wait: ReturnType<typeof vi.fn>;
  awakeningBeat: PrivateCh9Runtime['awakeningBeat'];
} {
  return {
    cut: false,
    mapDef: { music: 'stone_brow' },
    player: { x: 400, y: 500 },
    dlg: { say: vi.fn(async (): Promise<void> => undefined) },
    cameras: { main: { flash: vi.fn() } },
    add: { image: vi.fn(() => fluentImage()) },
    tweens: { add: vi.fn() },
    sparkleBurst: vi.fn(),
    wait: vi.fn(async (): Promise<void> => undefined),
    awakeningBeat: ch9Runtime().awakeningBeat,
  };
}

describe('Chapter 9 train and arrival runtime', () => {
  it.each([
    [true, 'ch9_train_pippa'],
    [false, 'ch9_train_departed'],
  ] as const)('commits the accepted Less-Express and selects the serialized party panel (Pippa=%s)', async (present, panel) => {
    GS.setFlag('ch8_complete');
    markPippa(present);
    const scene = trainScene();
    const landing = ch9NativeFeet(CH9_WORLD.valea.arrival);

    await ch9Runtime().bertAirBeat.call(scene);

    expect(GS.flag(CH9_STORY_FLAGS.trainCommitted)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.trainSeen)).toBe(true);
    expect(GS.data.keyItems.filter((id) => id === CH9_TRAIN_TICKET_ID)).toHaveLength(1);
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, panel);
    expect(scene.goThroughDoor).toHaveBeenCalledWith(
      'valea_stelelor', landing.tx, landing.ty, CH9_WORLD.valea.arrival.facing,
    );
    expect(GS.flag('ch9_arrived')).toBe(false);
  });

  it('resumes after interrupted train playback without asking or granting the ticket again', async () => {
    GS.setFlag('ch8_complete');
    markPippa(false);
    const scene = trainScene();
    mocks.playCutscene.mockRejectedValueOnce(new Error('interrupted panel'));

    await expect(ch9Runtime().bertAirBeat.call(scene)).rejects.toThrow('interrupted panel');
    expect(GS.flag(CH9_STORY_FLAGS.trainCommitted)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.trainSeen)).toBe(false);
    expect(GS.data.keyItems.filter((id) => id === CH9_TRAIN_TICKET_ID)).toHaveLength(1);
    expect(scene.goThroughDoor).not.toHaveBeenCalled();

    await ch9Runtime().bertAirBeat.call(scene);
    expect(scene.dlg.ask).toHaveBeenCalledOnce();
    expect(mocks.playCutscene).toHaveBeenCalledTimes(2);
    expect(mocks.playCutscene).toHaveBeenLastCalledWith(scene, 'ch9_train_departed');
    expect(GS.flag(CH9_STORY_FLAGS.trainSeen)).toBe(true);
    expect(GS.data.keyItems.filter((id) => id === CH9_TRAIN_TICKET_ID)).toHaveLength(1);
    expect(scene.goThroughDoor).toHaveBeenCalledOnce();
  });

  it('commits arrival before its contextual panel and never replays it', async () => {
    markPippa(true);
    const scene = {
      cut: false,
      mapDef: { music: 'valea' },
      dlg: { say: vi.fn(async (): Promise<void> => undefined) },
      cameras: { main: { shake: vi.fn() } },
    };

    await ch9Runtime().ch9ArrivalScene.call(scene);
    expect(GS.flag(CH9_STORY_FLAGS.arrived)).toBe(true);
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, 'ch9_arrival_pippa');
    await ch9Runtime().ch9ArrivalScene.call(scene);
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
  });
});

describe("Chapter 9 Buni's Table runtime", () => {
  it('persists five flag pickups and retries the exact reward transaction after full hands', async () => {
    const scene = buniScene();
    await ch9Runtime().ch9BuniBeat.call(scene);
    expect(GS.flag(CH9_BUNI_FLAGS.start)).toBe(true);

    for (const id of Object.keys(CH9_BUNI_PICKUP_INTERACTIONS) as BuniPickupId[]) {
      await ch9Runtime().ch9BuniPickup.call(scene, id);
      GS.deserialize(GS.serialize());
    }
    for (const ingredient of CH9_BUNI_INGREDIENTS) {
      expect(GS.flag(ingredient.flag), ingredient.id).toBe(true);
      expect(GS.data.party.flatMap((hero) => hero.bag), ingredient.itemId).not.toContain(ingredient.itemId);
    }

    while (GS.data.party[0].bag.length < BAG_MAX) GS.data.party[0].bag.push('pbj');
    await ch9Runtime().ch9BuniBeat.call(scene);
    expect(GS.flag(CH9_BUNI_FLAGS.gather)).toBe(true);
    expect(GS.flag(CH9_BUNI_FLAGS.cook)).toBe(true);
    expect(GS.flag(CH9_BUNI_FLAGS.done)).toBe(false);
    expect(GS.flag(CH9_BUNI_FLAGS.recipe)).toBe(false);
    expect(GS.hasItem('basket_feast')).toBe(false);
    expect(GS.data.callers.some((caller) => caller.quest === 'bunis_table')).toBe(false);
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, 'ch9_buni_departed');

    GS.deserialize(GS.serialize());
    GS.data.party[0].bag.pop();
    await ch9Runtime().ch9BuniBeat.call(scene);
    expect(GS.flag(CH9_BUNI_FLAGS.done)).toBe(true);
    expect(GS.flag(CH9_BUNI_FLAGS.recipe)).toBe(true);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === 'basket_feast')).toHaveLength(1);
    expect(GS.data.callers.filter((caller) => caller.quest === 'bunis_table')).toHaveLength(1);

    await ch9Runtime().ch9BuniBeat.call(scene);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === 'basket_feast')).toHaveLength(1);
    expect(GS.data.callers.filter((caller) => caller.quest === 'bunis_table')).toHaveLength(1);
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
  });
});

describe('Chapter 9 Count victory and Compassion runtime', () => {
  it('lands a victory at the separate postBoss point without deciding Compassion', async () => {
    const restart = vi.fn();
    const clearRoamersForQuietWalk = vi.fn();
    const scene = {
      cut: false,
      transitioning: false,
      mapDef: { music: 'castle' },
      dlg: { say: vi.fn(async (): Promise<void> => undefined) },
      cameras: {
        main: {
          shake: vi.fn(),
          flash: vi.fn(),
          fadeOut: vi.fn(),
          once: vi.fn((_event: unknown, callback: () => void) => callback()),
        },
      },
      scene: { restart },
      wait: vi.fn(async (): Promise<void> => undefined),
      startBattle: vi.fn(async (): Promise<'victory'> => 'victory'),
      clearRoamersForQuietWalk,
      giveCountCandelabraAndRestart: ch9Runtime().giveCountCandelabraAndRestart,
      restartAtCh9PostBossPoint: ch9Runtime().restartAtCh9PostBossPoint,
    };
    const postBoss = ch9NativeFeet(CH9_WORLD.castle.profiles.postBoss);
    const bossRestart = ch9NativeFeet(CH9_WORLD.castle.bossRestart);

    await ch9Runtime().countHoaxulaBossScene.call(scene);

    expect(GS.flag('count_hoaxula_defeated')).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.candelabraClaimed)).toBe(true);
    expect(GS.data.party[0].bag.filter((id) => id === 'candelabra')).toHaveLength(1);
    expect(GS.flag('ch9_count_decided')).toBe(false);
    expect(GS.flag('axis_compassion_openhand')).toBe(false);
    expect(GS.flag('axis_compassion_iron')).toBe(false);
    expect(clearRoamersForQuietWalk).toHaveBeenCalledOnce();
    expect(restart).toHaveBeenCalledWith({
      mapId: 'castle_hoaxula', x: s(postBoss.tx), y: s(postBoss.ty),
      facing: CH9_WORLD.castle.profiles.postBoss.facing,
    });
    expect({ x: postBoss.tx, y: postBoss.ty }).not.toEqual({ x: bossRestart.tx, y: bossRestart.ty });
  });

  it('leaves the Candelabra on the throne when Jay is full, then commits it exactly once', async () => {
    GS.setFlag(CH9_STORY_FLAGS.bossDefeated);
    while (GS.data.party[0].bag.length < BAG_MAX) GS.data.party[0].bag.push('pbj');
    const restart = vi.fn();
    const scene = {
      cut: false,
      transitioning: false,
      mapDef: { music: 'castle' },
      dlg: { say: vi.fn(async (): Promise<void> => undefined) },
      cameras: {
        main: {
          fadeOut: vi.fn(),
          once: vi.fn((_event: unknown, callback: () => void) => callback()),
        },
      },
      scene: { restart },
      restartAtCh9PostBossPoint: ch9Runtime().restartAtCh9PostBossPoint,
    };

    await ch9Runtime().giveCountCandelabraAndRestart.call(scene);
    expect(GS.flag(CH9_STORY_FLAGS.candelabraClaimed)).toBe(false);
    expect(GS.hasItem('candelabra')).toBe(false);
    expect(scene.dlg.say).toHaveBeenCalledWith(...DIALOGUE.count_candelabra_full);
    expect(restart).not.toHaveBeenCalled();

    GS.data.party[0].bag.pop();
    await ch9Runtime().giveCountCandelabraAndRestart.call(scene);
    expect(GS.flag(CH9_STORY_FLAGS.candelabraClaimed)).toBe(true);
    expect(GS.data.party[0].bag.filter((id) => id === 'candelabra')).toHaveLength(1);
    expect(restart).toHaveBeenCalledOnce();

    await ch9Runtime().giveCountCandelabraAndRestart.call(scene);
    expect(GS.data.party[0].bag.filter((id) => id === 'candelabra')).toHaveLength(1);
    expect(restart).toHaveBeenCalledOnce();
  });

  it.each([
    ['open', 0, true, 'ch9_choice_pippa'],
    ['iron', 1, false, 'ch9_choice_departed'],
  ] as const)('commits the %s handoff before its awaited outro', async (branch, pick, pippaPresent, panel) => {
    markPippa(pippaPresent);
    let sayCount = 0;
    let releaseOutro: () => void = () => undefined;
    const blockedOutro = new Promise<void>((resolve) => { releaseOutro = resolve; });
    const say = vi.fn((): Promise<void> => {
      sayCount += 1;
      return sayCount === 4 ? blockedOutro : Promise.resolve();
    });
    const scene = {
      cut: false,
      dlg: {
        say,
        ask: vi.fn(async (): Promise<number> => pick),
      },
    };

    const pending = ch9Runtime().runChoice.call(scene, 'ch9_count');
    for (let turn = 0; turn < 12 && sayCount < 4; turn++) await Promise.resolve();
    expect(sayCount).toBe(4);
    expect(GS.flag('ch9_count_decided')).toBe(true);
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, panel);

    if (branch === 'open') {
      expect(GS.flag('axis_compassion_openhand')).toBe(true);
      expect(GS.flag('axis_compassion_iron')).toBe(false);
      expect(GS.flag('stolen_light_banked')).toBe(false);
      expect(GS.flag('dorin_withholds')).toBe(false);
      expect(GS.data.callers.filter((caller) => caller.quest === 'choice:ch9_count')).toHaveLength(1);
    } else {
      expect(GS.flag('axis_compassion_openhand')).toBe(false);
      expect(GS.flag('axis_compassion_iron')).toBe(true);
      expect(GS.flag('stolen_light_banked')).toBe(true);
      expect(GS.flag('dorin_withholds')).toBe(true);
      expect(GS.data.callers.some((caller) => caller.quest === 'choice:ch9_count')).toBe(false);
    }

    releaseOutro();
    await pending;
    expect(scene.cut).toBe(false);
  });
});

describe('Chapter 9 monastery runtime', () => {
  it('runs all three physical frontiers once and completes Ember 9 without replay', async () => {
    GS.setFlag(CH9_STORY_FLAGS.bossDefeated);
    GS.setFlag(CH9_STORY_FLAGS.choiceDecided);
    GS.data.embers = 8;
    markPippa(true);
    const scene = monasteryScene();

    await ch9Runtime().ch9MonasteryScene.call(scene, 'trial');
    expect(GS.flag(CH9_STORY_FLAGS.trialSeen)).toBe(true);
    expect(GS.data.keyItems.filter((id) => id === 'trial_stone')).toHaveLength(1);
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, 'ch9_trial');

    await ch9Runtime().ch9MonasteryScene.call(scene, 'awakening');
    expect(GS.flag(CH9_STORY_FLAGS.dorinNameSpoken)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.dorinAwake)).toBe(true);

    await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');
    expect(GS.data.keyItems.filter((id) => id === 'monastery_bell_clapper')).toHaveLength(1);
    expect(GS.flag(CH9_STORY_FLAGS.heartlightSeen)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.ember)).toBe(true);
    expect(GS.data.embers).toBe(9);
    expect(GS.flag(CH9_STORY_FLAGS.complete)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.cardSeen)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.holyPanClaimed)).toBe(true);
    expect(GS.data.party.find((hero) => hero.id === 'faye')?.bag.filter((id) => id === 'holy_pan')).toHaveLength(1);
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, 'ch9_heartlight_pippa');
    expect(scene.add.image).toHaveBeenCalledOnce();

    const presentations = {
      cutscenes: mocks.playCutscene.mock.calls.length,
      dialogue: scene.dlg.say.mock.calls.length,
      ember: scene.add.image.mock.calls.length,
      jingles: mocks.audio.jingle.mock.calls.length,
    };
    await ch9Runtime().ch9MonasteryScene.call(scene, 'trial');
    await ch9Runtime().ch9MonasteryScene.call(scene, 'awakening');
    await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');
    expect(mocks.playCutscene).toHaveBeenCalledTimes(presentations.cutscenes);
    expect(scene.dlg.say).toHaveBeenCalledTimes(presentations.dialogue);
    expect(scene.add.image).toHaveBeenCalledTimes(presentations.ember);
    expect(mocks.audio.jingle).toHaveBeenCalledTimes(presentations.jingles);
  });

  it('resumes partial court commits at the next missing stage and never lowers later Embers', async () => {
    for (const flag of [
      CH9_STORY_FLAGS.bossDefeated,
      CH9_STORY_FLAGS.choiceDecided,
      CH9_STORY_FLAGS.trialSeen,
      CH9_STORY_FLAGS.dorinNameSpoken,
    ]) GS.setFlag(flag);
    GS.data.embers = 12;
    markPippa(false);
    const scene = monasteryScene();

    await ch9Runtime().ch9MonasteryScene.call(scene, 'trial');
    expect(mocks.playCutscene).not.toHaveBeenCalled();

    await ch9Runtime().ch9MonasteryScene.call(scene, 'awakening');
    expect(GS.flag(CH9_STORY_FLAGS.dorinAwake)).toBe(true);
    expect(scene.dlg.say).not.toHaveBeenCalledWith(...DIALOGUE.ch9_dorin_birth_name);

    GS.setFlag(CH9_STORY_FLAGS.heartlightSeen);
    await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');
    expect(mocks.playCutscene).not.toHaveBeenCalledWith(scene, 'ch9_heartlight_departed');
    expect(scene.add.image).toHaveBeenCalledOnce();
    expect(GS.data.embers).toBe(12);
    expect(GS.flag(CH9_STORY_FLAGS.ember)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.complete)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.cardSeen)).toBe(true);
  });

  it('keeps the Holy Pan blessing retryable when Mia is full and completes only after acceptance', async () => {
    for (const flag of [
      CH9_STORY_FLAGS.bossDefeated,
      CH9_STORY_FLAGS.choiceDecided,
      CH9_STORY_FLAGS.trialSeen,
      CH9_STORY_FLAGS.dorinNameSpoken,
      CH9_STORY_FLAGS.dorinAwake,
      CH9_STORY_FLAGS.heartlightSeen,
      CH9_STORY_FLAGS.ember,
    ]) GS.setFlag(flag);
    GS.data.keyItems.push('trial_stone', 'monastery_bell_clapper');
    GS.data.embers = 9;
    markPippa(false);
    const mia = GS.data.party.find((hero) => hero.id === 'faye');
    if (!mia) throw new Error('Mia missing from Chapter 9 party');
    while (mia.bag.length < BAG_MAX) mia.bag.push('pbj');
    const scene = monasteryScene();

    await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');
    expect(GS.flag(CH9_STORY_FLAGS.holyPanClaimed)).toBe(false);
    expect(GS.flag(CH9_STORY_FLAGS.complete)).toBe(false);
    expect(scene.dlg.say).toHaveBeenCalledWith(...DIALOGUE.ch9_holy_pan_full);

    mia.bag.pop();
    await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');
    expect(GS.flag(CH9_STORY_FLAGS.holyPanClaimed)).toBe(true);
    expect(GS.flag(CH9_STORY_FLAGS.complete)).toBe(true);
    expect(mia.bag.filter((id) => id === 'holy_pan')).toHaveLength(1);

    await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');
    expect(mia.bag.filter((id) => id === 'holy_pan')).toHaveLength(1);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'repairs a non-finite Ember scalar (%s) without looping the bell frontier',
    async (brokenEmbers) => {
      for (const flag of [
        CH9_STORY_FLAGS.bossDefeated,
        CH9_STORY_FLAGS.choiceDecided,
        CH9_STORY_FLAGS.trialSeen,
        CH9_STORY_FLAGS.dorinNameSpoken,
        CH9_STORY_FLAGS.dorinAwake,
        CH9_STORY_FLAGS.heartlightSeen,
        CH9_STORY_FLAGS.ember,
        CH9_STORY_FLAGS.holyPanClaimed,
      ]) GS.setFlag(flag);
      GS.data.keyItems.push('trial_stone', 'monastery_bell_clapper');
      GS.data.embers = brokenEmbers;
      markPippa(true);
      const scene = monasteryScene();

      await ch9Runtime().ch9MonasteryScene.call(scene, 'bell');

      expect(GS.data.embers).toBe(9);
      expect(GS.flag(CH9_STORY_FLAGS.complete)).toBe(true);
      expect(GS.flag(CH9_STORY_FLAGS.cardSeen)).toBe(true);
    },
  );
});
