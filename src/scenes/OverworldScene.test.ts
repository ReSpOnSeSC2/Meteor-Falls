import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DIALOGUE } from '../data/dialogue';
import { MAPS } from '../data/maps';
import { QUESTS } from '../data/quests';

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

let runtime: typeof import('./OverworldScene');

beforeAll(async () => {
  runtime = await import('./OverworldScene');
});

describe('Mail Must Move instance identity', () => {
  it('resolves exactly the five authored door destinations, never a reused facade sprite', () => {
    const resolved = MAPS.otterbrook.props.flatMap((prop) => {
      const stop = runtime.chapter1MailStopForProp('otterbrook', prop);
      return stop ? [stop] : [];
    });
    expect(resolved.map((stop) => stop.id).sort()).toEqual(['arcade', 'birch', 'chapel', 'pickles', 'sodd']);
    expect(new Set(resolved.map((stop) => stop.doorTo)).size).toBe(5);

    const reused = MAPS.otterbrook.props.filter((prop) =>
      ['house_a', 'house_b', 'arcade'].includes(prop.sprite) && !prop.door,
    );
    expect(reused.length).toBeGreaterThan(5);
    expect(reused.every((prop) => runtime.chapter1MailStopForProp('otterbrook', prop) === null)).toBe(true);
    expect(runtime.chapter1MailStopForProp('brickton', { door: { ox: 0, oy: 0, w: 1, h: 1, to: 'arcade_int', tx: 0, ty: 0 } })).toBeNull();
  });

  it('matches the quest objective flags exactly', () => {
    const objectiveFlags = QUESTS.mail_must_move.objectives
      .map((objective) => objective.flag)
      .filter((flag) => flag !== 'q_mail_reported')
      .sort();
    expect(runtime.CH1_MAIL_STOPS.map((stop) => stop.flag).sort()).toEqual(objectiveFlags);
    const objectives = QUESTS.mail_must_move.objectives;
    expect(objectives[objectives.length - 1]?.flag).toBe('q_mail_reported');
  });
});

describe('door-marker presentation', () => {
  it('never paints generic welcome mats outside', () => {
    expect(runtime.visibleDoorIndicator(undefined, false)).toBe('none');
    expect(runtime.visibleDoorIndicator('mat', false)).toBe('none');
    expect(runtime.showFacadeDoorMat(false)).toBe(false);
  });

  it('preserves purposeful exterior markers and interior mats', () => {
    for (const kind of ['stairs', 'elevator', 'door', 'hole'] as const) {
      expect(runtime.visibleDoorIndicator(kind, false)).toBe(kind);
    }
    expect(runtime.visibleDoorIndicator(undefined, true)).toBe('mat');
    expect(runtime.visibleDoorIndicator('mat', true)).toBe('mat');
    expect(runtime.showFacadeDoorMat(true)).toBe(true);
  });
});

describe('Glint story staging', () => {
  it('keeps the crater apparition inside the followed camera instead of at stale map tiles', () => {
    const player = { x: 62 * 64, y: 8 * 64 };
    const glint = runtime.glintCraterStagePosition(player.x, player.y);

    expect(glint).toEqual({ x: player.x + 128, y: player.y - 104 });
    expect(Math.abs(glint.x - player.x) + 48).toBeLessThan(800);
    expect(glint.y).toBeLessThan(player.y);
  });

  it('stages Glint above elevated world art but below dialogue', () => {
    expect(runtime.STORY_STAGE_DEPTH.threat).toBeGreaterThan(80_000);
    expect(runtime.STORY_STAGE_DEPTH.threat).toBeLessThan(runtime.STORY_STAGE_DEPTH.glow);
    expect(runtime.STORY_STAGE_DEPTH.glow).toBeLessThan(runtime.STORY_STAGE_DEPTH.actor);
    expect(runtime.STORY_STAGE_DEPTH.actor).toBeLessThan(90_000);
  });

  it('lets a long car nose enter an outdoor edge route without requiring its centre in the one-tile portal', () => {
    const door = { x: 0, y: 4, w: 1, h: 2 };
    const zone = { x: 0, y: 256, w: 64, h: 128 };
    const longCar = { x: 0, y: 278, w: 142, h: 58 };
    expect(runtime.vehicleBodyTriggersEdgeDoor(door, 40, 24, { x: -1, y: 0 }, longCar, zone, false)).toBe(true);
    expect(runtime.vehicleBodyTriggersEdgeDoor(door, 40, 24, { x: 1, y: 0 }, longCar, zone, false)).toBe(false);
    expect(runtime.vehicleBodyTriggersEdgeDoor(door, 40, 24, { x: -1, y: 0 }, longCar, zone, true)).toBe(false);
  });
});

describe('walkable overworld spawner cells', () => {
  it('clips to the map and excludes solid tiles and static-body cells', () => {
    const solids = [
      [false, false, false, false],
      [false, true, false, false],
      [true, false, false, false],
      [false, false, false, false],
    ];
    const cells = runtime.walkableSpawnerCells(
      { x: -1, y: 1, w: 4, h: 2 },
      solids,
      (tx, ty) => tx === 2 && ty === 2,
    );
    expect(cells).toEqual([{ tx: 0, ty: 1 }, { tx: 2, ty: 1 }, { tx: 1, ty: 2 }]);
  });

  it('returns an empty pool when a rectangle has no safe cell', () => {
    expect(runtime.walkableSpawnerCells({ x: 0, y: 0, w: 2, h: 1 }, [[true, true]], () => false)).toEqual([]);
  });
});

describe('story trigger ownership and persistence', () => {
  it('finds the story payphone by its trigger zone even when fixtures are reordered', () => {
    const map: Parameters<typeof runtime.phoneForTrigger>[0] = {
      phones: [{ x: 40, y: 40 }, { x: 58, y: 19 }],
      triggers: [
        { id: 'payphone_ring', rect: { x: 56, y: 17, w: 6, h: 5 }, once: false },
        { id: 'brickton_dial_goal', rect: { x: 56, y: 18, w: 5, h: 4 }, once: false },
      ],
    };

    expect(runtime.phoneForTrigger(map, 'payphone_ring')).toEqual({ x: 58, y: 19 });
    expect(runtime.phoneForTrigger(map, 'brickton_dial_goal')).toEqual({ x: 58, y: 19 });
    expect(runtime.phoneForTrigger(map, 'missing')).toBeUndefined();
    expect(map.phones[0]).toEqual({ x: 40, y: 40 }); // market phone remains a normal phone
  });

  it('orders Puerto arrival before return travel and persists one-time approach beats', () => {
    const initial = {
      puertoArrived: false,
      pyramidApproachSeen: false,
      grinDefeated: false,
      valleArrived: false,
      ch2Complete: false,
    };
    expect(runtime.chapter2TriggerAction('board_boat_return', initial)).toBeNull();
    expect(runtime.chapter2TriggerAction('puerto_arrival', initial)).toBe('puerto-arrival');
    expect(runtime.chapter2TriggerAction('pyramid_approach', initial)).toBe('pyramid-approach');
    expect(runtime.chapter2TriggerAction('valle_arrival', initial)).toBe('valle-arrival');

    expect(runtime.chapter2TriggerAction('board_boat_return', { ...initial, puertoArrived: true })).toBe('puerto-return');
    expect(runtime.chapter2TriggerAction('puerto_arrival', { ...initial, puertoArrived: true })).toBeNull();
    expect(runtime.chapter2TriggerAction('pyramid_approach', { ...initial, pyramidApproachSeen: true })).toBeNull();
    expect(runtime.chapter2TriggerAction('valle_arrival', { ...initial, valleArrived: true })).toBeNull();
  });

  it('keeps Valle arrival reusable for the post-Grin recovery phase only', () => {
    const base = {
      puertoArrived: true,
      pyramidApproachSeen: true,
      grinDefeated: true,
      valleArrived: true,
      ch2Complete: false,
    };
    expect(runtime.chapter2TriggerAction('valle_arrival', base)).toBe('valle-recovery');
    expect(runtime.chapter2TriggerAction('valle_arrival', { ...base, ch2Complete: true })).toBeNull();
  });
});

describe('Chapter 3 machine-fog aftermath', () => {
  it('keeps the four-terrace pre-boss gradient and clears most of it after the Mainframe', () => {
    expect(runtime.chapter3FogAlpha(3, 3, false)).toBeCloseTo(0.14);
    expect(runtime.chapter3FogAlpha(3, 0, false)).toBeCloseTo(0.62);
    expect(runtime.chapter3FogAlpha(3, 0, true)).toBeCloseTo(0.1488);
    expect(runtime.chapter3FogAlpha(0, 0, true)).toBeCloseTo(0.0816);
  });
});

describe('Chapter 7 edge-biome boundaries', () => {
  it('keeps the outdoor route tropical and the enclosed palace borderless', () => {
    expect(runtime.resolveEdgeBiome('chandrapore')).toBe('tropical');
    expect(runtime.resolveEdgeBiome('monsoon_road')).toBe('tropical');
    expect(runtime.resolveEdgeBiome('night_train')).toBe('tropical');
    expect(runtime.resolveEdgeBiome('palace_throne')).toBe('none');
  });

  it('keeps the complete Chapter 7 gallery out of every runtime cutscene call', () => {
    const source = readFileSync(fileURLToPath(new URL('./OverworldScene.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/playCutscene\(this,\s*['"]ch7_journey['"]/);
    expect(source).toContain('await this.ch7TrainInScene()');
    expect(source).toContain("await this.ch7ContextBeat('ch7_bazaar_seen', 'ch7_bazaar', 'ch7_bazaar_beat')");
    expect(source).toContain('GS.data.embers = 7');
    expect(source).not.toContain('Math.max(7, GS.data.embers)');
  });

  it('keeps restored-king reactions available without replacing regional quest routing', () => {
    for (const npcId of ['cp_spice_merchant', 'cp_dabbawala', 'cp_stationmaster', 'cp_usher', 'cp_ghat_elder']) {
      expect(DIALOGUE[`npc_${npcId}_restored`], npcId).toBeDefined();
    }
    const source = readFileSync(fileURLToPath(new URL('./OverworldScene.ts', import.meta.url)), 'utf8');
    expect(source).toContain('await this.ch7RestoredNpcBeat(n.def.id)');
    expect(source).toContain('await this.spicesBeat()');
    expect(source).toContain('await this.monkeyBeat()');
    expect(source).toContain('await this.thirdClassBeat()');
    expect(source).toContain('await this.lastShowingBeat()');
    expect(source).toContain('await this.riverBeat()');
  });
});

describe('Hickory Hill cave presentation', () => {
  it('keeps every cave floor inside the cave biome instead of a forest void', () => {
    for (const id of ['oak_roots', 'oak_hollow', 'oak_heart']) {
      expect(runtime.resolveEdgeBiome(id)).toBe('cave');
    }
  });

  it('maps the whole elevation material family to rooted stone', () => {
    expect(runtime.UNDEROAK_TILE_SKIN).toMatchObject({
      cliff_face: 'oak_cave_wall',
      cliff_lip: 'oak_cave_floor',
      stairs: 'oak_cave_floor',
      scorch: 'oak_cave_floor',
      scorch_ember: 'oak_cave_floor',
    });
  });
});

describe('Chapter 3 field-control scene contract', () => {
  it('spends Puppet PP only after a successful borrow', () => {
    expect(runtime.spendFieldPuppetPp(20, 14, true)).toBe(6);
    expect(runtime.spendFieldPuppetPp(20, 14, false)).toBe(20);
    expect(runtime.spendFieldPuppetPp(8, 14, true)).toBe(0);
  });

  it('excludes dogs, clamps the eight-second timer, and accepts B or Y release', () => {
    expect(runtime.fieldPuppetNpcEligible({ dog: true })).toBe(false);
    expect(runtime.fieldPuppetNpcEligible({})).toBe(true);
    expect(runtime.fieldPuppetTimeRemaining(8, 0.5)).toBe(7.5);
    expect(runtime.fieldPuppetTimeRemaining(0.1, 1)).toBe(0);
    expect(runtime.fieldControlReleaseRequested(true, false)).toBe(true);
    expect(runtime.fieldControlReleaseRequested(false, true)).toBe(true);
    expect(runtime.fieldControlReleaseRequested(false, false)).toBe(false);
  });

  it('restores only a still-live pinned target body on release', () => {
    expect(runtime.shouldRestorePinnedPuppetBody(false, true, true)).toBe(true);
    expect(runtime.shouldRestorePinnedPuppetBody(true, true, true)).toBe(false);
    expect(runtime.shouldRestorePinnedPuppetBody(false, false, true)).toBe(false);
    expect(runtime.shouldRestorePinnedPuppetBody(false, true, false)).toBe(false);
  });

  it('gates the training and fogworks Clicker actions in story order', () => {
    const base = { trained: false, coolantFrozen: false, fogworksSolved: false };
    expect(runtime.chapter3MachineActionResult('wm_clicker_training', base)).toBe('training_complete');
    expect(runtime.chapter3MachineActionResult('wm_clicker_training', { ...base, trained: true })).toBe('training_already');
    expect(runtime.chapter3MachineActionResult('wm_fogworks_valve', base)).toBe('coolant_required');
    expect(runtime.chapter3MachineActionResult('wm_fogworks_valve', { ...base, coolantFrozen: true })).toBe('fogworks_complete');
    expect(runtime.chapter3MachineActionResult('wm_fogworks_valve', { ...base, coolantFrozen: true, fogworksSolved: true })).toBe('fogworks_already');
    expect(runtime.chapter3MachineActionResult('not_real', base)).toBe('unknown');
  });

  it('projects a Clicker machine body into cardinal and diagonal headings', () => {
    expect(runtime.fieldMachineBodyDimensions(120, 32, 'right')).toEqual({ w: 120, h: 32 });
    expect(runtime.fieldMachineBodyDimensions(120, 32, 'down')).toEqual({ w: 32, h: 120 });
    const diagonal = runtime.fieldMachineBodyDimensions(120, 32, 'downright');
    expect(diagonal.w).toBeCloseTo(76 * Math.SQRT2);
    expect(diagonal.h).toBeCloseTo(76 * Math.SQRT2);
  });
});

describe('Otterbrooke Chapter 1 population policy', () => {
  it('recognizes only the retired sequential Twoton tenancy namespace', () => {
    expect(runtime.isLegacyTwotonUnitId('brickton_unit_0')).toBe(true);
    expect(runtime.isLegacyTwotonUnitId('brickton_unit_13')).toBe(true);
    expect(runtime.isLegacyTwotonUnitId('brickton_lot_5900_5025')).toBe(false);
    expect(runtime.isLegacyTwotonUnitId('puerto_sol_unit_0')).toBe(false);
  });

  it('uses authored front/back frames for vertically parked directional cars', () => {
    expect(runtime.staticDirectionalVehicleFrame(undefined)).toBe(0);
    expect(runtime.staticDirectionalVehicleFrame(90)).toBe(1);
    expect(runtime.staticDirectionalVehicleFrame(270)).toBe(2);
  });

  it('clears meteor wildlife for Glint\'s walk home and after the Tick', () => {
    const flags = (set: ReadonlySet<string>) => (id: string): boolean => set.has(id);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('otterbrook', 'meteor_fell', flags(new Set()))).toBe(false);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('otterbrook', 'meteor_fell', flags(new Set(['glint_walk_home'])))).toBe(true);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('otterbrook', 'meteor_fell', flags(new Set(['tick_defeated'])))).toBe(true);
    expect(runtime.shouldSuppressOtterbrookMeteorSpawner('brickton', 'meteor_fell', flags(new Set(['tick_defeated'])))).toBe(false);
  });

  it('destroys meteor roamers that were already alive when the quiet walk begins', () => {
    const destroyA = vi.fn();
    const destroyB = vi.fn();
    runtime.destroyRoamerSprites([{ spr: { destroy: destroyA } }, { spr: { destroy: destroyB } }]);
    expect(destroyA).toHaveBeenCalledOnce();
    expect(destroyB).toHaveBeenCalledOnce();
  });

  it('runs sparse humble traffic at 2 A.M., none in Hush morning, and normal traffic after restoration', () => {
    const fleet = ['commuter', 'bus', 'vehicle_clunker', 'grand_tourer'];
    expect(runtime.otterbrookTrafficPolicy('otterbrook', 'meteor-night', fleet, 9)).toEqual({
      types: ['bus', 'vehicle_clunker'],
      max: 2,
    });
    expect(runtime.otterbrookTrafficPolicy('otterbrook', 'hush-morning', fleet, 9)).toBeNull();
    expect(runtime.otterbrookTrafficPolicy('downtown_otterbrook', 'hush-morning', fleet, 4)).toBeNull();
    expect(runtime.otterbrookTrafficPolicy('otterbrook', 'restored-day', fleet, 9)).toEqual({ types: fleet, max: 9 });
    expect(runtime.otterbrookTrafficPolicy('brickton', undefined, fleet, 7)).toEqual({ types: fleet, max: 7 });
  });
});

describe('Chapter 8 production runtime integration', () => {
  const source = readFileSync(fileURLToPath(new URL('./OverworldScene.ts', import.meta.url)), 'utf8');

  it('handles every authored Chapter 8 story, hazard, quest, encounter, boss, and bell trigger', () => {
    const ids = [
      'ch8_arrival', 'ch8_orientation', 'ch8_trust_setup', 'ch8_clicker_setup',
      'ch8_barge_crisis', 'ch8_clicker_clearing', 'ch8_trust_escalation',
      'spore_forest_scramble', 'ch8_spore_trust', 'ch8_pippa_creases',
      'mushroomize_0', 'mushroomize_1', 'mushroomize_2',
      'q_brush_river', 'q_brush_kiln', 'q_brush_cloud',
      'q_false_fold_lantern_1', 'q_false_fold_lantern_2', 'q_false_fold_lantern_3',
      'q_harbor_balance_weight_1', 'q_harbor_balance_weight_2',
      'q_yak_waits_feed', 'q_yak_waits_route', 'q_empty_chair',
      'porcelain_warlord_encounter', 'ch8_false_folds', 'ch8_trust_climax',
      'ch8_elder_beta', 'paper_dragon_boss', 'mt_shu_temple_resonance',
    ];
    for (const id of ids) expect(source, id).toContain(`case '${id}':`);
  });

  it('keeps the seven contextual panels spoiler-safe and the full journey gallery-only', () => {
    for (const id of ['ch8_riverboat', 'ch8_arrival', 'ch8_spore', 'ch8_yak', 'ch8_false_folds']) {
      expect(source, id).toContain(`playCutscene(this, '${id}')`);
    }
    expect(source).toContain("ch8PartyCutsceneId('dragon', isPresent('pippa'))");
    expect(source).toContain("ch8PartyCutsceneId('heartlight', isPresent('pippa'))");
    expect(source).not.toContain("playCutscene(this, 'ch8_journey')");
  });

  it('commits the boss reward and Heartlight in the frozen retry-safe order', () => {
    const defeated = source.indexOf("GS.setFlag('paper_dragon_defeated')");
    const fan = source.indexOf("GS.setFlag('paper_fan_claimed')");
    const restart = source.indexOf('this.restartAtCh8BossSafePoint()');
    const heartlight = source.indexOf("GS.setFlag('ch8_heartlight_seen')");
    const panel = source.indexOf("ch8PartyCutsceneId('heartlight', isPresent('pippa'))");
    const emberFlag = source.indexOf("GS.setFlag('ember8')");
    const emberCount = source.indexOf('GS.data.embers = 8');
    const complete = source.indexOf("GS.setFlag('ch8_complete')");
    expect([defeated, fan, restart, heartlight, panel, emberFlag, emberCount, complete].every((i) => i >= 0)).toBe(true);
    expect(defeated).toBeLessThan(fan);
    expect(fan).toBeLessThan(restart);
    expect(heartlight).toBeLessThan(panel);
    expect(panel).toBeLessThan(emberFlag);
    expect(emberFlag).toBeLessThan(emberCount);
    expect(emberCount).toBeLessThan(complete);
  });

  it('serializes frozen overlapping triggers and resumes Heartlight without replay', () => {
    const triggerQueue = source.slice(
      source.indexOf('private queueCh8Trigger'),
      source.indexOf('/* ---------------- cutscenes'),
    );
    expect(triggerQueue).toContain('await this.runTrigger(id)');
    expect(triggerQueue).toContain('this.ch8TriggerRunnerActive');

    const heartlight = source.slice(
      source.indexOf('private async mtShuTempleScene'),
      source.indexOf('/* ──────────── CHAPTER 9'),
    );
    expect(heartlight).toContain("if (GS.flag('ch8_complete')) return");
    expect(source).toContain("if (GS.flag('ch8_yak_arrival_pending')) return");
    expect(source).toContain("if (GS.flag('ch8_yak_departed')) {");
    expect(heartlight).toContain("if (!GS.flag('ch8_heartlight_seen'))");
    expect(heartlight).toContain("if (!GS.flag('ember8'))");
    expect(heartlight).toContain('GS.data.embers = 8');
  });

  it('stages the pending Yak transfer at the distinct CH8_WORLD arrival anchor', () => {
    const onEnter = source.slice(
      source.indexOf('private async onEnterCutscenes'),
      source.indexOf('private async runTrigger'),
    );
    const anchor = onEnter.indexOf('const arrival = CH8_WORLD.mtShuTemple.yakArrival');
    const arrived = onEnter.indexOf("GS.setFlag('ch8_yak_arrived')");
    expect(anchor).toBeGreaterThanOrEqual(0);
    expect(anchor).toBeLessThan(arrived);
    expect(onEnter).toContain('this.followers.forEach((follower) => follower.spr.setPosition(x, y))');
  });

  it('uses a distinct forest crease beat before the temple false-fold reveal', () => {
    const forest = source.slice(
      source.indexOf('private async ch8PippaCreasesScene'),
      source.indexOf('private async ch8MushroomizeHazard'),
    );
    const temple = source.slice(
      source.indexOf('private async ch8FalseFoldsScene'),
      source.indexOf('private async ch8ElderBetaScene'),
    );
    expect(forest).toContain('DIALOGUE.ch8_pippa_creases');
    expect(forest).not.toContain('DIALOGUE.ch8_false_folds_pippa');
    expect(temple).toContain('DIALOGUE.ch8_false_folds_pippa');
  });

  it('runs both field systems through common input and canonical pure-domain seams', () => {
    const teleport = source.slice(source.indexOf('private async executeTeleportRequest'), source.indexOf('/* ---------------- §A4.5'));
    expect(teleport).toContain('const direction = INPUT.dir()');
    expect(teleport).toContain('resolveTeleportAttempt({');
    expect(teleport).toContain('caster.pp = result.ppAfter');
    expect(source).toContain('transformDirection(rawDirection, GS.data.mushroomize)');
    expect(source).toContain('phase: hazard.phase');
  });
});
