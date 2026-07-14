import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIALOGUE } from '../data/dialogue';
import { BAG_MAX } from '../data/items';
import {
  CH1_FAYE_PAN_ID,
  CH1_GLINT_SPARK_ID,
  CH1_STAR_LOCKET_ID,
  CH1_STORY_FLAGS,
} from '../engine/ch1Story';
import { CH1_TRAIL_FLAGS, CH1_TRAIL_KEY_ITEM_ID } from '../engine/ch1TrailRoute';
import { GS, makeHeroState } from '../engine/state';
import { TILE_PX } from '../spritegen/scale';

const mocks = vi.hoisted(() => ({
  playCutscene: vi.fn(async (): Promise<void> => undefined),
  playStagedScene: vi.fn(async (): Promise<void> => undefined),
  showCard: vi.fn(async (): Promise<void> => undefined),
  showCaption: vi.fn(async (): Promise<void> => undefined),
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

vi.mock('../engine/audio', () => ({ AUDIO: mocks.audio }));
vi.mock('../engine/cutscene', () => ({ playCutscene: mocks.playCutscene }));
vi.mock('../engine/cutsceneStage', () => ({
  playStagedScene: mocks.playStagedScene,
  showCard: mocks.showCard,
  showCaption: mocks.showCaption,
}));
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

type PrivateCh1Runtime = {
  introScene(this: unknown): Promise<void>;
  runOtterbrookOpening(this: unknown): Promise<void>;
  sleepToMorning(this: unknown): Promise<void>;
  restorePartyForRest(this: unknown): void;
  otterHotelBeat(this: unknown): Promise<void>;
  twotonHotelBeat(this: unknown): Promise<void>;
  craterScene(this: unknown): Promise<void>;
  porchScene(this: unknown): Promise<void>;
  tickCaveScene(this: unknown): Promise<void>;
  runTrigger(this: unknown, id: string): Promise<void>;
  hardwareBeat(this: unknown): Promise<void>;
  pembertonBeat(this: unknown): Promise<void>;
  signBeat(this: unknown, dialogueId: string): Promise<boolean>;
  picnicFlow(this: unknown, table: unknown): Promise<void>;
  oakHollowRest(this: unknown): Promise<void>;
  reconcileChapter1TrailKey(this: unknown): boolean;
  goThroughDoor(this: unknown, to: string, tx: number, ty: number, facing: 'up' | 'down' | 'left' | 'right'): void;
  presentEmberOne(this: unknown): Promise<void>;
  fayeJoinScene(this: unknown): Promise<void>;
  managerScene(this: unknown): Promise<void>;
  momPayphoneScene(this: unknown): Promise<void>;
  playFirstHeartlightStaged(this: unknown): Promise<void>;
  awakeningBeat(this: unknown, id: string, commitBeforePresentation?: boolean, presentDialogue?: boolean): Promise<void>;
  checkTriggers(this: unknown): void;
  queueCh8Trigger(this: unknown, id: string): void;
  drainCh8TriggerQueue(this: unknown): Promise<void>;
  chapter1ItemCount(this: unknown, itemId: string): number;
  normalizeChapter1KeyItem(this: unknown, itemId: string): void;
  commitSentinelVictory(this: unknown): void;
  dedupeChapter1PartyItem(this: unknown, itemId: string): void;
  chapter1FayeFacts(this: unknown): {
    fayeCount: number;
    panCount: number;
    panOnFaye: boolean;
    panEquipped: boolean;
  };
  reconcileFayeParty(this: unknown): void;
  reconcileFayePan(this: unknown): boolean;
};

function ch1Runtime(): PrivateCh1Runtime {
  return runtime.OverworldScene.prototype as unknown as PrivateCh1Runtime;
}

function fluentObject(x = 0, y = 0): Record<string, any> {
  const object: Record<string, any> = {
    x,
    y,
    active: true,
    anims: { currentAnim: undefined, isPlaying: false },
  };
  object.destroy = vi.fn(() => { object.active = false; });
  for (const method of [
    'setAlpha', 'setDepth', 'setOrigin', 'setScale', 'setScrollFactor', 'setTint', 'setVisible', 'play',
  ]) object[method] = vi.fn(() => object);
  return object;
}

function sayStub(): ReturnType<typeof vi.fn> {
  return vi.fn(async (): Promise<void> => undefined);
}

describe('Chapter 1 opening runtime recovery', () => {
  it('wakes from the real home sleep with the whole standing party at full HP and PP', async () => {
    const faye = makeHeroState('faye', 6);
    GS.data.party.push(faye);
    for (const hero of GS.data.party) {
      hero.hp = 1;
      hero.pp = 0;
    }
    const start = vi.fn();
    const scene = {
      cut: false,
      cameras: { main: { fadeOut: vi.fn() } },
      wait: vi.fn(async (): Promise<void> => undefined),
      scene: { start },
      restorePartyForRest: ch1Runtime().restorePartyForRest,
    };

    await ch1Runtime().sleepToMorning.call(scene);

    expect(GS.flag('zapper_done')).toBe(true);
    expect(GS.data.party).toHaveLength(2);
    for (const hero of GS.data.party) {
      expect(hero.hp).toBe(hero.maxHp);
      expect(hero.pp).toBe(hero.maxPp);
    }
    expect(start).toHaveBeenCalledWith('overworld', {
      mapId: 'rex_bedroom',
      x: 3 * TILE_PX + 8,
      y: 5 * TILE_PX,
    });
  });

  it('routes both authored hotel stays through the same full HP-and-PP restore', async () => {
    GS.data.party.push(makeHeroState('faye', 6));
    GS.data.cashOnHand = 1_000;
    GS.setFlag('zapper_done');
    GS.setFlag('tick_defeated');
    const scene = {
      cut: false,
      cameras: { main: { fadeOut: vi.fn() } },
      wait: vi.fn(async (): Promise<void> => undefined),
      scene: { start: vi.fn() },
      dlg: {
        say: vi.fn(async (): Promise<void> => undefined),
        ask: vi.fn(async (): Promise<number> => 0),
      },
      restorePartyForRest: ch1Runtime().restorePartyForRest,
    };
    const drainParty = (): void => {
      for (const hero of GS.data.party) {
        hero.hp = 1;
        hero.pp = 0;
      }
    };
    const expectFullParty = (): void => {
      for (const hero of GS.data.party) {
        expect(hero.hp).toBe(hero.maxHp);
        expect(hero.pp).toBe(hero.maxPp);
      }
    };

    drainParty();
    await ch1Runtime().otterHotelBeat.call(scene);
    expectFullParty();

    drainParty();
    await ch1Runtime().twotonHotelBeat.call(scene);
    expectFullParty();
  });

  it('commits the bedroom wake only after its dialogue and retries an interrupted wake', async () => {
    let failWake = true;
    const say = vi.fn(async (): Promise<void> => {
      if (failWake) throw new Error('wake interrupted');
    });
    const emit = vi.fn();
    const scene = {
      cut: false,
      entryBlackout: undefined,
      add: { rectangle: vi.fn(() => fluentObject()) },
      scale: { width: 400, height: 225 },
      cameras: { main: { shake: vi.fn() } },
      tweens: { add: vi.fn() },
      wait: vi.fn(async (): Promise<void> => undefined),
      dlg: { say },
      mapDef: { music: 'home' },
      game: { events: { emit } },
    };

    await expect(ch1Runtime().introScene.call(scene)).rejects.toThrow('wake interrupted');
    expect(GS.flag('meteor_fell')).toBe(false);
    expect(GS.flag('intro_done')).toBe(false);
    expect(scene.cut).toBe(false);

    failWake = false;
    await ch1Runtime().introScene.call(scene);
    expect(GS.flag('meteor_fell')).toBe(true);
    expect(GS.flag('intro_done')).toBe(true);
    expect(scene.cut).toBe(false);
    expect(emit).toHaveBeenLastCalledWith('mf-cinematic-closed');
  });

  it('drains every recoverable Otterbrook opening substage in order', async () => {
    const order: string[] = [];
    const scene = {
      cut: false,
      transitioning: false,
      player: { setVisible: vi.fn() },
      cameras: { main: { startFollow: vi.fn() } },
      game: { events: { emit: vi.fn() } },
      opPhase: vi.fn(() => {
        if (!GS.flag('op_fell')) return 1;
        if (!GS.flag('op_house')) return 2;
        return 3;
      }),
      playOpeningCinema: vi.fn(async () => {
        order.push('fall');
        GS.setFlag('op_fell');
      }),
      openingHouseOverview: vi.fn(async () => {
        order.push('house');
        GS.setFlag('op_house');
      }),
      openingHillClimb: vi.fn(async () => {
        order.push('hill');
        scene.transitioning = true;
      }),
    };

    await ch1Runtime().runOtterbrookOpening.call(scene);
    expect(order).toEqual(['fall', 'house', 'hill']);
    expect(GS.flag('op_fell')).toBe(true);
    expect(GS.flag('op_house')).toBe(true);
    expect(scene.game.events.emit).toHaveBeenCalledWith('mf-cinematic-open');
    expect(scene.player.setVisible).not.toHaveBeenCalledWith(true);
  });
});

describe('Chapter 1 Hush trail route transactions', () => {
  it('starts Hodgkin\'s mower request only in Hush morning and commits it after dialogue', async () => {
    let interrupt = false;
    const say = vi.fn(async (...lines: string[]): Promise<void> => {
      if (interrupt && lines[0] === DIALOGUE.npc_hodgkin_ask[0]) throw new Error('request interrupted');
    });
    const scene = {
      mapDef: { id: 'hardware_int' },
      dlg: { say },
      reconcileChapter1TrailKey: ch1Runtime().reconcileChapter1TrailKey,
    };

    await ch1Runtime().hardwareBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_hodgkin);
    expect(GS.flag(CH1_TRAIL_FLAGS.keyAsked)).toBe(false);

    GS.setFlag('zapper_done');
    await ch1Runtime().hardwareBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_hodgkin_pemberton);
    expect(GS.flag(CH1_TRAIL_FLAGS.keyAsked)).toBe(false);

    GS.setFlag(CH1_TRAIL_FLAGS.metPemberton);
    interrupt = true;
    await expect(ch1Runtime().hardwareBeat.call(scene)).rejects.toThrow('request interrupted');
    expect(GS.flag(CH1_TRAIL_FLAGS.keyAsked)).toBe(false);

    interrupt = false;
    await ch1Runtime().hardwareBeat.call(scene);
    expect(GS.flag(CH1_TRAIL_FLAGS.keyAsked)).toBe(true);
    await ch1Runtime().hardwareBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_hodgkin_active);
  });

  it('awards one shared Trail Key through a full bag and survives reload', async () => {
    GS.setFlag('zapper_done');
    GS.setFlag(CH1_TRAIL_FLAGS.mowerCaught);
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    const fullBag = [...rex.bag];
    let interruptReward = true;
    const say = vi.fn(async (...lines: string[]): Promise<void> => {
      if (interruptReward && lines[0] === DIALOGUE.npc_hodgkin_reward[0]) throw new Error('reward interrupted');
    });
    const scene = {
      mapDef: { id: 'hardware_int' },
      dlg: { say },
      reconcileChapter1TrailKey: ch1Runtime().reconcileChapter1TrailKey,
    };

    await expect(ch1Runtime().hardwareBeat.call(scene)).rejects.toThrow('reward interrupted');
    expect(GS.flag(CH1_TRAIL_FLAGS.hasKey)).toBe(false);
    expect(GS.data.keyItems).not.toContain(CH1_TRAIL_KEY_ITEM_ID);
    expect(rex.bag).toEqual(fullBag);

    interruptReward = false;
    await ch1Runtime().hardwareBeat.call(scene);
    expect(rex.bag).toEqual(fullBag);
    expect(GS.flag(CH1_TRAIL_FLAGS.hasKey)).toBe(true);
    expect(GS.data.keyItems.filter((item) => item === CH1_TRAIL_KEY_ITEM_ID)).toHaveLength(1);

    await ch1Runtime().hardwareBeat.call(scene);
    expect(GS.data.keyItems.filter((item) => item === CH1_TRAIL_KEY_ITEM_ID)).toHaveLength(1);

    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(GS.flag(CH1_TRAIL_FLAGS.hasKey)).toBe(true);
    expect(GS.data.keyItems.filter((item) => item === CH1_TRAIL_KEY_ITEM_ID)).toHaveLength(1);
    expect(GS.data.party[0].bag).toEqual(fullBag);
  });

  it('repairs flag-only, item-only, duplicate, and cave-resident legacy saves before map build', () => {
    const scene = { mapDef: { id: 'otterbrook' } };
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    const fullBag = [...rex.bag];
    GS.setFlag(CH1_TRAIL_FLAGS.hasKey);
    GS.deserialize(GS.serialize());
    expect(ch1Runtime().reconcileChapter1TrailKey.call(scene)).toBe(true);
    expect(GS.data.keyItems.filter((item) => item === CH1_TRAIL_KEY_ITEM_ID)).toHaveLength(1);
    expect(GS.data.party[0].bag).toEqual(fullBag);

    GS.reset();
    GS.data.keyItems.push(CH1_TRAIL_KEY_ITEM_ID, CH1_TRAIL_KEY_ITEM_ID);
    GS.deserialize(GS.serialize());
    expect(ch1Runtime().reconcileChapter1TrailKey.call(scene)).toBe(true);
    expect(GS.flag(CH1_TRAIL_FLAGS.hasKey)).toBe(true);
    expect(GS.data.keyItems.filter((item) => item === CH1_TRAIL_KEY_ITEM_ID)).toHaveLength(1);

    GS.reset();
    const caveScene = { mapDef: { id: 'oak_hollow' } };
    expect(ch1Runtime().reconcileChapter1TrailKey.call(caveScene)).toBe(true);
    expect(GS.flag(CH1_TRAIL_FLAGS.hasKey)).toBe(true);
    expect(GS.flag(CH1_TRAIL_FLAGS.shedCrossed)).toBe(true);
  });

  it('makes Pemberton point to the exact next landmark at every route stage', async () => {
    GS.setFlag('zapper_done');
    const say = sayStub();
    const scene = { dlg: { say } };

    await ch1Runtime().pembertonBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_pemberton_hush);
    GS.setFlag(CH1_TRAIL_FLAGS.keyAsked);
    await ch1Runtime().pembertonBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_pemberton_mower);
    GS.setFlag(CH1_TRAIL_FLAGS.mowerCaught);
    await ch1Runtime().pembertonBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_pemberton_hodgkin);
    GS.data.keyItems.push(CH1_TRAIL_KEY_ITEM_ID);
    await ch1Runtime().pembertonBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_pemberton_key);
    GS.setFlag(CH1_TRAIL_FLAGS.shedCrossed);
    await ch1Runtime().pembertonBeat.call(scene);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.npc_pemberton_cave);
  });

  it('keeps the shed cache pending with full hands, then grants food and cash exactly once', async () => {
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    const cash = GS.data.cashOnHand;
    const scene = {
      dlg: { say: sayStub() },
      reconcileChapter1TrailKey: vi.fn(() => true),
    };

    await ch1Runtime().signBeat.call(scene, 'trail_shed');
    expect(GS.flag('shed_looted')).toBe(false);
    expect(GS.data.cashOnHand).toBe(cash);
    expect(GS.hasItem('choco_comet_bar')).toBe(false);
    expect(scene.dlg.say).toHaveBeenLastCalledWith(...DIALOGUE.trail_shed_full);

    rex.bag.pop();
    await ch1Runtime().signBeat.call(scene, 'trail_shed');
    expect(GS.flag('shed_looted')).toBe(true);
    expect(GS.data.cashOnHand).toBe(cash + 60);
    expect(rex.bag.filter((item) => item === 'choco_comet_bar')).toHaveLength(1);

    await ch1Runtime().signBeat.call(scene, 'trail_shed');
    expect(GS.data.cashOnHand).toBe(cash + 60);
    expect(rex.bag.filter((item) => item === 'choco_comet_bar')).toHaveLength(1);
    expect(scene.dlg.say).toHaveBeenLastCalledWith(...DIALOGUE.trail_shed_empty);
  });

  it('commits the route crossing only through the shed rear breach', () => {
    const scene = {
      transitioning: false,
      mapDef: { id: 'trail_shed_int' },
      reconcileChapter1TrailKey: vi.fn(() => true),
      cameras: { main: { zoomTo: vi.fn(), fadeOut: vi.fn(), once: vi.fn(), setZoom: vi.fn() } },
      scene: { restart: vi.fn() },
    };

    ch1Runtime().goThroughDoor.call(scene, 'otterbrook', 12 * 16 + 8, 32 * 16 + 12, 'down');
    expect(GS.flag(CH1_TRAIL_FLAGS.shedCrossed)).toBe(false);

    scene.transitioning = false;
    ch1Runtime().goThroughDoor.call(scene, 'otterbrook', 12 * 16 + 8, 24 * 16 + 12, 'up');
    expect(GS.flag(CH1_TRAIL_FLAGS.shedCrossed)).toBe(true);
  });

  it('turns the hollow table into a real basket-free pre-boss recovery point', async () => {
    const rex = GS.data.party[0];
    rex.hp = 1;
    rex.pp = 0;
    const downed = makeHeroState('faye', 6, GS.data.heroNames.faye);
    downed.down = true;
    downed.hp = 0;
    downed.pp = 0;
    GS.data.party.push(downed);
    const scene = {
      cut: false,
      dlg: { say: sayStub() },
      player: { x: 100, y: 120 },
      sparkleBurst: vi.fn(),
    };

    await ch1Runtime().oakHollowRest.call(scene);
    expect(rex.hp).toBe(rex.maxHp);
    expect(rex.pp).toBe(rex.maxPp);
    expect(downed.down).toBe(true);
    expect(downed.hp).toBe(0);
    expect(GS.flag('ch1_oak_hollow_rest_seen')).toBe(true);
    expect(scene.dlg.say).toHaveBeenLastCalledWith(...DIALOGUE.oak_hollow_rest);

    rex.hp = 1;
    await ch1Runtime().oakHollowRest.call(scene);
    expect(rex.hp).toBe(rex.maxHp);
    expect(scene.dlg.say).toHaveBeenLastCalledWith(...DIALOGUE.oak_hollow_rest_again);

    const integration = {
      mapDef: { id: 'oak_hollow' },
      oakHollowRest: vi.fn(async (): Promise<void> => undefined),
      bestBasket: vi.fn(() => null),
    };
    await ch1Runtime().picnicFlow.call(integration, {});
    expect(integration.oakHollowRest).toHaveBeenCalledOnce();
    expect(integration.bestBasket).not.toHaveBeenCalled();
  });
});

describe('Chapter 1 crater, porch, and Tick transactions', () => {
  it('allows the stable Tick trigger only on the final Hickory Hill cave map', async () => {
    const scene = {
      mapDef: { id: 'otterbrook' },
      chapter1TickPending: vi.fn(() => true),
      tickCaveScene: vi.fn(async (): Promise<void> => undefined),
      reconcileChapter1TrailKey: vi.fn(() => false),
    };

    await ch1Runtime().runTrigger.call(scene, 'heart_oak');
    expect(scene.tickCaveScene).not.toHaveBeenCalled();

    scene.mapDef.id = 'oak_heart';
    await ch1Runtime().runTrigger.call(scene, 'heart_oak');
    expect(scene.tickCaveScene).not.toHaveBeenCalled();

    scene.reconcileChapter1TrailKey.mockReturnValue(true);
    GS.setFlag(CH1_TRAIL_FLAGS.shedCrossed);
    await ch1Runtime().runTrigger.call(scene, 'heart_oak');
    expect(scene.tickCaveScene).toHaveBeenCalledOnce();
  });

  it('requires the completed shed passage at the cave threshold and commits copy after dialogue', async () => {
    GS.setFlag('zapper_done');
    let interrupt = true;
    const say = vi.fn(async (): Promise<void> => {
      if (interrupt) throw new Error('threshold interrupted');
    });
    const scene = {
      dlg: { say },
      reconcileChapter1TrailKey: vi.fn(() => true),
    };

    await ch1Runtime().runTrigger.call(scene, 'ch1_cave_threshold');
    expect(say).not.toHaveBeenCalled();
    expect(GS.flag('ch1_cave_threshold_seen')).toBe(false);

    GS.setFlag(CH1_TRAIL_FLAGS.shedCrossed);
    await expect(ch1Runtime().runTrigger.call(scene, 'ch1_cave_threshold')).rejects.toThrow('threshold interrupted');
    expect(GS.flag('ch1_cave_threshold_seen')).toBe(false);

    interrupt = false;
    await ch1Runtime().runTrigger.call(scene, 'ch1_cave_threshold');
    expect(GS.flag('ch1_cave_threshold_seen')).toBe(true);
    expect(say).toHaveBeenLastCalledWith(...DIALOGUE.ch1_cave_threshold);
  });

  it('lets an old post-victory save repair Tick aftermath without new route flags', async () => {
    GS.setFlag(CH1_STORY_FLAGS.tickDefeated);
    const scene = {
      mapDef: { id: 'oak_heart' },
      chapter1TickPending: vi.fn(() => true),
      tickCaveScene: vi.fn(async (): Promise<void> => undefined),
      reconcileChapter1TrailKey: vi.fn(() => false),
    };

    await ch1Runtime().runTrigger.call(scene, 'heart_oak');
    expect(scene.tickCaveScene).toHaveBeenCalledOnce();
    expect(scene.reconcileChapter1TrailKey).not.toHaveBeenCalled();
  });

  it('grounds the Tick encounter and recovery copy in cave stone and roots', () => {
    const copy = [
      ...DIALOGUE.tick_cave_approach,
      ...DIALOGUE.ember_get,
      ...DIALOGUE.tick_after,
    ].join(' ');
    expect(copy).toMatch(/cave/i);
    expect(copy).toMatch(/stone/i);
    expect(copy).toMatch(/roots/i);
    expect(copy).not.toMatch(/Heart Oak|Pond Park|rises from the crater/i);
  });

  it('normalizes the Locket, commits a Sentinel victory exactly, and retries only its aftermath', async () => {
    GS.setFlag(CH1_STORY_FLAGS.metGlint);
    GS.data.keyItems.push(CH1_STAR_LOCKET_ID, CH1_STAR_LOCKET_ID);
    let interruptAftermath = true;
    const say = vi.fn(async (...lines: string[]): Promise<void> => {
      if (interruptAftermath && lines[0] === DIALOGUE.sentinel_after[0]) throw new Error('aftermath interrupted');
    });
    const startBattle = vi.fn(async (): Promise<'victory'> => 'victory');
    const scene = {
      cut: false,
      dlg: { say },
      startBattle,
      removeFollower: vi.fn(),
      clearRoamersForQuietWalk: vi.fn(),
      addFollower: vi.fn(),
      mapDef: { music: 'meteor_night' },
      normalizeChapter1KeyItem: ch1Runtime().normalizeChapter1KeyItem,
      commitSentinelVictory: ch1Runtime().commitSentinelVictory,
    };

    await expect(ch1Runtime().craterScene.call(scene)).rejects.toThrow('aftermath interrupted');
    expect(GS.data.keyItems.filter((id) => id === CH1_STAR_LOCKET_ID)).toHaveLength(1);
    expect(GS.flag(CH1_STORY_FLAGS.sentinelRepelled)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.sentinelHusk)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.glintWalkHome)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.sentinelAfterSeen)).toBe(false);
    expect(scene.cut).toBe(false);

    interruptAftermath = false;
    await ch1Runtime().craterScene.call(scene);
    expect(startBattle).toHaveBeenCalledOnce();
    expect(GS.flag(CH1_STORY_FLAGS.sentinelAfterSeen)).toBe(true);
    expect(scene.addFollower).toHaveBeenCalledWith('glint', false, true);
  });

  it("leaves Glint's Spark retryable with full hands, then grants and awakens exactly once", async () => {
    GS.setFlag(CH1_STORY_FLAGS.sentinelRepelled);
    GS.setFlag(CH1_STORY_FLAGS.zapperHit);
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    const scene = {
      cut: false,
      dlg: { say: sayStub() },
      chapter1ItemCount: ch1Runtime().chapter1ItemCount,
      dedupeChapter1PartyItem: ch1Runtime().dedupeChapter1PartyItem,
      awakeningBeat: vi.fn(async (): Promise<void> => {
        GS.setFlag(CH1_STORY_FLAGS.lifeupAwake);
      }),
    };

    await ch1Runtime().porchScene.call(scene);
    expect(GS.flag(CH1_STORY_FLAGS.sparkClaimed)).toBe(false);
    expect(GS.hasItem(CH1_GLINT_SPARK_ID)).toBe(false);
    expect(scene.dlg.say).toHaveBeenCalledWith(expect.stringContaining('bag is full'));

    rex.bag.pop();
    await ch1Runtime().porchScene.call(scene);
    expect(rex.bag.filter((id) => id === CH1_GLINT_SPARK_ID)).toHaveLength(1);
    expect(GS.flag(CH1_STORY_FLAGS.sparkClaimed)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.sparkSeen)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.lifeupAwake)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.porchAfterSeen)).toBe(true);

    await ch1Runtime().porchScene.call(scene);
    expect(rex.bag.filter((id) => id === CH1_GLINT_SPARK_ID)).toHaveLength(1);
    expect(scene.awakeningBeat).toHaveBeenCalledOnce();
  });

  it('keeps the Tick dead and Ember scalar monotonic when Ember presentation is interrupted', async () => {
    GS.setFlag(CH1_STORY_FLAGS.zapperDone);
    GS.data.embers = 12;
    let interruptEmber = true;
    const say = vi.fn(async (...lines: string[]): Promise<void> => {
      if (interruptEmber && lines[0] === DIALOGUE.ember_get[0]) throw new Error('ember interrupted');
    });
    const startBattle = vi.fn(async (): Promise<'victory'> => 'victory');
    const scene = {
      cut: false,
      player: { x: 400, y: 500 },
      dlg: { say },
      cameras: { main: { shake: vi.fn(), flash: vi.fn() } },
      add: { image: vi.fn((x: number, y: number) => fluentObject(x, y)) },
      tweens: { add: vi.fn() },
      sparkleBurst: vi.fn(),
      wait: vi.fn(async (): Promise<void> => undefined),
      startBattle,
      presentEmberOne: ch1Runtime().presentEmberOne,
      fadeRestart: vi.fn(),
    };

    await expect(ch1Runtime().tickCaveScene.call(scene)).rejects.toThrow('ember interrupted');
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, 'ch1_tick');
    expect(GS.flag(CH1_STORY_FLAGS.tickDefeated)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.ember)).toBe(true);
    expect(GS.data.embers).toBe(12);
    expect(GS.flag(CH1_STORY_FLAGS.emberSeen)).toBe(false);

    interruptEmber = false;
    await ch1Runtime().tickCaveScene.call(scene);
    expect(startBattle).toHaveBeenCalledOnce();
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
    expect(GS.data.embers).toBe(12);
    expect(GS.flag(CH1_STORY_FLAGS.emberSeen)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.tickAfterSeen)).toBe(true);
    expect(scene.fadeRestart).toHaveBeenCalledOnce();
  });

  it('keeps movement frozen under a Tick defeat restart, while a getaway re-arms retry', async () => {
    GS.setFlag(CH1_STORY_FLAGS.zapperDone);
    const startBattle = vi.fn<() => Promise<'defeat' | 'ran'>>(async () => 'defeat');
    const scene = {
      cut: false,
      dlg: { say: sayStub() },
      cameras: { main: { shake: vi.fn() } },
      wait: vi.fn(async (): Promise<void> => undefined),
      startBattle,
      fadeRestart: vi.fn(),
    };

    await ch1Runtime().tickCaveScene.call(scene);
    expect(scene.cut).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.tickDefeated)).toBe(false);

    startBattle.mockResolvedValue('ran');
    await ch1Runtime().tickCaveScene.call(scene);
    expect(scene.cut).toBe(false);
    expect(GS.flag(CH1_STORY_FLAGS.tickDefeated)).toBe(false);
    expect(startBattle).toHaveBeenCalledTimes(2);
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
    expect(scene.dlg.say).toHaveBeenLastCalledWith(...DIALOGUE.tick_cave_retry);
  });
});

describe('Chapter 1 Mia, Manager, and Mom transactions', () => {
  it('repairs duplicate Mias before retrying a full-bag Pan and setting the join flag last', async () => {
    for (const flag of [
      CH1_STORY_FLAGS.holdingOpen,
      CH1_STORY_FLAGS.fayeMetSeen,
      CH1_STORY_FLAGS.fayeListenAwake,
      CH1_STORY_FLAGS.fayeJoinCopySeen,
    ]) GS.setFlag(flag);
    const keeper = makeHeroState('faye', 6, GS.data.heroNames.faye);
    const duplicate = makeHeroState('faye', 6, GS.data.heroNames.faye);
    while (keeper.bag.length < BAG_MAX) keeper.bag.push('pbj');
    GS.data.party.push(keeper, duplicate);
    const scene = {
      cut: false,
      dlg: { say: sayStub() },
      fadeRestart: vi.fn(),
      chapter1ItemCount: ch1Runtime().chapter1ItemCount,
      chapter1FayeFacts: ch1Runtime().chapter1FayeFacts,
      reconcileFayeParty: ch1Runtime().reconcileFayeParty,
      reconcileFayePan: ch1Runtime().reconcileFayePan,
    };

    await ch1Runtime().fayeJoinScene.call(scene);
    expect(GS.data.party.filter((hero) => hero.id === 'faye')).toEqual([keeper]);
    expect(GS.flag(CH1_STORY_FLAGS.fayeJoined)).toBe(false);
    expect(GS.hasItem(CH1_FAYE_PAN_ID)).toBe(false);
    expect(scene.dlg.say).toHaveBeenCalledWith(expect.stringContaining('no room'));

    keeper.bag.pop();
    await ch1Runtime().fayeJoinScene.call(scene);
    expect(GS.data.party.filter((hero) => hero.id === 'faye')).toHaveLength(1);
    expect(keeper.bag.filter((id) => id === CH1_FAYE_PAN_ID)).toHaveLength(1);
    expect(keeper.equip.weapon).toBe(CH1_FAYE_PAN_ID);
    expect(GS.flag(CH1_STORY_FLAGS.fayePanSeen)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.fayeJoined)).toBe(true);
    expect(scene.fadeRestart).toHaveBeenCalledOnce();

    await ch1Runtime().fayeJoinScene.call(scene);
    expect(keeper.bag.filter((id) => id === CH1_FAYE_PAN_ID)).toHaveLength(1);
    expect(scene.fadeRestart).toHaveBeenCalledOnce();
  });

  it('commits the Manager victory, then resumes its interrupted walk-off without replaying the boss', async () => {
    GS.setFlag(CH1_STORY_FLAGS.fayeJoined);
    let interruptWin = true;
    const say = vi.fn(async (...lines: string[]): Promise<void> => {
      if (interruptWin && lines[0] === DIALOGUE.manager_win[0]) throw new Error('manager outro interrupted');
    });
    const startBattle = vi.fn(async (): Promise<'victory'> => 'victory');
    const scene = {
      cut: false,
      mapDef: { props: [{ sprite: 'office_door', x: 10, y: 1 }] },
      player: { x: 300, y: 400 },
      add: { sprite: vi.fn((x: number, y: number) => fluentObject(x, y)) },
      tweenTo: vi.fn(async (): Promise<void> => undefined),
      dlg: { say },
      startBattle,
      fadeRestart: vi.fn(),
    };

    await expect(ch1Runtime().managerScene.call(scene)).rejects.toThrow('manager outro interrupted');
    expect(GS.flag(CH1_STORY_FLAGS.managerDefeated)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.managerWinSeen)).toBe(false);
    expect(startBattle).toHaveBeenCalledOnce();
    expect(scene.cut).toBe(false);

    interruptWin = false;
    await ch1Runtime().managerScene.call(scene);
    expect(GS.flag(CH1_STORY_FLAGS.managerWinSeen)).toBe(true);
    expect(startBattle).toHaveBeenCalledOnce();
    expect(scene.fadeRestart).toHaveBeenCalledOnce();
  });

  it('resumes Mom at staged Heartlight, then commits awakening, completion, response, and card', async () => {
    GS.setFlag(CH1_STORY_FLAGS.managerDefeated);
    GS.setFlag(CH1_STORY_FLAGS.managerWinSeen);
    GS.setFlag('rex_homesick');
    const say = sayStub();
    const scene = {
      cut: false,
      dlg: { say },
      player: { x: 400, y: 500 },
      mapDef: { music: 'brickton' },
      cameras: { main: { flash: vi.fn() } },
      sparkleBurst: vi.fn(),
      playFirstHeartlightStaged: ch1Runtime().playFirstHeartlightStaged,
      awakeningBeat: ch1Runtime().awakeningBeat,
    };
    mocks.playStagedScene.mockRejectedValueOnce(new Error('staged interruption'));

    await expect(ch1Runtime().momPayphoneScene.call(scene)).rejects.toThrow('staged interruption');
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
    expect(mocks.playCutscene).toHaveBeenCalledWith(scene, 'ch1_mom');
    expect(GS.flag(CH1_STORY_FLAGS.momCallSeen)).toBe(true);
    expect(GS.flag('rex_homesick')).toBe(false);
    expect(GS.flag(CH1_STORY_FLAGS.firstHeartlightSeen)).toBe(false);
    expect(GS.flag(CH1_STORY_FLAGS.complete)).toBe(false);
    expect(scene.cut).toBe(false);

    await ch1Runtime().momPayphoneScene.call(scene);
    expect(GS.flag(CH1_STORY_FLAGS.firstHeartlightSeen)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.starsongAwake)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.complete)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.fayeAfterCallSeen)).toBe(true);
    expect(GS.flag(CH1_STORY_FLAGS.cardSeen)).toBe(true);
    expect(mocks.playStagedScene).toHaveBeenCalledTimes(2);
    expect(mocks.playCutscene).toHaveBeenCalledOnce();
    expect(say.mock.calls.filter((call) => call[0] === DIALOGUE.mom_payphone[0])).toHaveLength(1);

    const presentationCount = say.mock.calls.length;
    await ch1Runtime().momPayphoneScene.call(scene);
    expect(say).toHaveBeenCalledTimes(presentationCount);
    expect(mocks.playStagedScene).toHaveBeenCalledTimes(2);
  });
});

describe('Chapter 1 trigger serialization', () => {
  it('queues overlapping entry rectangles instead of launching either directly', () => {
    const queueCh8Trigger = vi.fn();
    const scene = {
      player: { x: 2 * TILE_PX + TILE_PX / 2, y: 2 * TILE_PX + TILE_PX / 2 },
      mapDef: {
        triggers: [
          { id: 'first', rect: { x: 2, y: 2, w: 1, h: 1 } },
          { id: 'second', rect: { x: 2, y: 2, w: 1, h: 1 } },
        ],
      },
      insideTriggers: new Set<string>(),
      queueCh8Trigger,
    };

    ch1Runtime().checkTriggers.call(scene);
    expect(queueCh8Trigger.mock.calls.map((call) => call[0])).toEqual(['first', 'second']);
  });

  it('does not begin the second queued story beat until the first settles', async () => {
    let releaseFirst: () => void = () => undefined;
    const first = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const order: string[] = [];
    const runTrigger = vi.fn(async (id: string): Promise<void> => {
      order.push(`start:${id}`);
      if (id === 'first') await first;
      order.push(`end:${id}`);
    });
    const scene = {
      transitioning: false,
      ch8TriggerQueue: [] as string[],
      ch8TriggerRunnerActive: false,
      runTrigger,
      drainCh8TriggerQueue: ch1Runtime().drainCh8TriggerQueue,
    };

    ch1Runtime().queueCh8Trigger.call(scene, 'first');
    ch1Runtime().queueCh8Trigger.call(scene, 'second');
    expect(order).toEqual(['start:first']);

    releaseFirst();
    await vi.waitFor(() => expect(order).toEqual([
      'start:first', 'end:first', 'start:second', 'end:second',
    ]));
  });
});
