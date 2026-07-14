import { describe, expect, it } from 'vitest';
import {
  CH1_STORY_FLAGS,
  chapter1BannerTag,
  chapter1Phase,
  planCh1CraterStory,
  planCh1FayeStory,
  planCh1ManagerStory,
  planCh1MomStory,
  planCh1PorchStory,
  planCh1TickStory,
} from './ch1Story';

const flags = (...on: string[]) => (id: string): boolean => on.includes(id);

describe('Chapter 1 story phase', () => {
  it('distinguishes the meteor night from the wrong-colored morning', () => {
    expect(chapter1Phase(flags())).toBe('meteor-night');
    expect(chapter1BannerTag(chapter1Phase(flags()))).toBe('2 A.M.');
    expect(chapter1Phase(flags('zapper_done'))).toBe('hush-morning');
    expect(chapter1BannerTag(chapter1Phase(flags('zapper_done')))).toBe('HUSH MORNING');
  });

  it('restores daylight after the Tick and closes the chapter only afterward', () => {
    expect(chapter1Phase(flags('zapper_done', 'tick_defeated'))).toBe('restored-day');
    expect(chapter1Phase(flags('zapper_done', 'tick_defeated', 'ch1_complete'))).toBe('chapter-complete');
  });
});

describe('Chapter 1 one-stage recovery planning', () => {
  it('repairs the crater in meet, unique Locket, battle, exact victory, and aftermath order', () => {
    const on = new Set<string>();
    const isSet = (flag: string): boolean => on.has(flag);
    expect(planCh1CraterStory(isSet, 0).stage?.id).toBe('meet_glint');
    on.add(CH1_STORY_FLAGS.metGlint);
    expect(planCh1CraterStory(isSet, 0).stage?.id).toBe('locket');
    expect(planCh1CraterStory(isSet, 2).stage?.id).toBe('locket');
    expect(planCh1CraterStory(isSet, 1).stage?.id).toBe('sentinel_battle');

    on.add(CH1_STORY_FLAGS.sentinelRepelled);
    expect(planCh1CraterStory(isSet, 1).stage?.id).toBe('sentinel_victory_repair');
    on.add(CH1_STORY_FLAGS.sentinelHusk);
    on.add(CH1_STORY_FLAGS.glintWalkHome);
    expect(planCh1CraterStory(isSet, 1).stage?.id).toBe('sentinel_after');
    on.add(CH1_STORY_FLAGS.sentinelAfterSeen);
    expect(planCh1CraterStory(isSet, 1).status).toBe('done');

    on.add(CH1_STORY_FLAGS.zapperHit);
    expect(planCh1CraterStory(isSet, 1).stage?.id).toBe('sentinel_victory_repair');
    on.delete(CH1_STORY_FLAGS.glintWalkHome);
    expect(planCh1CraterStory(isSet, 1).status).toBe('done');
  });

  it('keeps the Spark claim, copy, awakening, and porch aftermath independently retryable', () => {
    const on = new Set<string>([CH1_STORY_FLAGS.sentinelRepelled]);
    const isSet = (flag: string): boolean => on.has(flag);
    expect(planCh1PorchStory(isSet, 0).stage?.id).toBe('zapper');
    on.add(CH1_STORY_FLAGS.zapperHit);
    expect(planCh1PorchStory(isSet, 0).stage?.id).toBe('spark');
    on.add(CH1_STORY_FLAGS.sparkClaimed);
    expect(planCh1PorchStory(isSet, 0).stage?.id).toBe('spark_copy'); // claimed Spark may later be consumed
    expect(planCh1PorchStory(isSet, 2).stage?.id).toBe('spark'); // duplicate repair wins first
    on.add(CH1_STORY_FLAGS.sparkSeen);
    expect(planCh1PorchStory(isSet, 0).stage?.id).toBe('awakening');
    on.add(CH1_STORY_FLAGS.lifeupAwake);
    expect(planCh1PorchStory(isSet, 0).stage?.id).toBe('porch_after');
    on.add(CH1_STORY_FLAGS.porchAfterSeen);
    expect(planCh1PorchStory(isSet, 0).status).toBe('done');
  });

  it('commits and repairs Ember 1 monotonically before either presentation', () => {
    const on = new Set<string>([CH1_STORY_FLAGS.zapperDone]);
    const isSet = (flag: string): boolean => on.has(flag);
    expect(planCh1TickStory(isSet, 0).stage?.id).toBe('tick_battle');
    on.add(CH1_STORY_FLAGS.tickDefeated);
    expect(planCh1TickStory(isSet, 12).stage?.id).toBe('ember_commit');
    on.add(CH1_STORY_FLAGS.ember);
    expect(planCh1TickStory(isSet, Number.NaN).stage?.id).toBe('repair_embers');
    expect(planCh1TickStory(isSet, 12).stage?.id).toBe('ember_presentation');
    on.add(CH1_STORY_FLAGS.emberSeen);
    expect(planCh1TickStory(isSet, 12).stage?.id).toBe('tick_after');
    on.add(CH1_STORY_FLAGS.tickAfterSeen);
    expect(planCh1TickStory(isSet, 12).status).toBe('done');
  });

  it('makes Mia unique and pan-equipped before the join flag can become terminal', () => {
    const on = new Set<string>([CH1_STORY_FLAGS.holdingOpen]);
    const isSet = (flag: string): boolean => on.has(flag);
    const facts = { fayeCount: 0, panCount: 0, panOnFaye: false, panEquipped: false };
    expect(planCh1FayeStory(isSet, facts).stage?.id).toBe('meet');
    on.add(CH1_STORY_FLAGS.fayeMetSeen);
    expect(planCh1FayeStory(isSet, facts).stage?.id).toBe('first_listen');
    on.add(CH1_STORY_FLAGS.fayeListenAwake);
    expect(planCh1FayeStory(isSet, facts).stage?.id).toBe('join_copy');
    on.add(CH1_STORY_FLAGS.fayeJoinCopySeen);
    expect(planCh1FayeStory(isSet, facts).stage?.id).toBe('party');
    expect(planCh1FayeStory(isSet, { ...facts, fayeCount: 2 }).stage?.id).toBe('party');
    expect(planCh1FayeStory(isSet, { ...facts, fayeCount: 1 }).stage?.id).toBe('pan');
    const ready = { fayeCount: 1, panCount: 1, panOnFaye: true, panEquipped: true };
    expect(planCh1FayeStory(isSet, ready).stage?.id).toBe('pan_presentation');
    on.add(CH1_STORY_FLAGS.fayePanSeen);
    expect(planCh1FayeStory(isSet, ready).stage?.id).toBe('complete');
    on.add(CH1_STORY_FLAGS.fayeJoined);
    expect(planCh1FayeStory(isSet, ready).status).toBe('done');
  });

  it('keeps Manager aftermath and every Mom/Heartlight/card frontier separate', () => {
    const on = new Set<string>([CH1_STORY_FLAGS.fayeJoined]);
    const isSet = (flag: string): boolean => on.has(flag);
    expect(planCh1ManagerStory(isSet).stage?.id).toBe('manager_battle');
    on.add(CH1_STORY_FLAGS.managerDefeated);
    expect(planCh1ManagerStory(isSet).stage?.id).toBe('manager_after');
    expect(planCh1MomStory(isSet, true).status).toBe('blocked');
    on.add(CH1_STORY_FLAGS.managerWinSeen);

    const expected = [
      ['mom_call', CH1_STORY_FLAGS.momCallSeen],
      ['homesick_cure', null],
      ['first_heartlight', CH1_STORY_FLAGS.firstHeartlightSeen],
      ['starsong_awakening', CH1_STORY_FLAGS.starsongAwake],
      ['complete', CH1_STORY_FLAGS.complete],
      ['faye_after_call', CH1_STORY_FLAGS.fayeAfterCallSeen],
      ['chapter_card', CH1_STORY_FLAGS.cardSeen],
    ] as const;
    let homesick = true;
    for (const [stage, flag] of expected) {
      expect(planCh1MomStory(isSet, homesick).stage?.id).toBe(stage);
      if (stage === 'homesick_cure') homesick = false;
      else if (flag) on.add(flag);
    }
    expect(planCh1MomStory(isSet, false).status).toBe('done');
  });
});
