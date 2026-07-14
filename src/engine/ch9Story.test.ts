import { describe, expect, it } from 'vitest';
import {
  CH9_AWAKENING_ID,
  CH9_BELL_CLAPPER_ID,
  CH9_HOLY_PAN_ID,
  CH9_STORY_FLAGS,
  CH9_TRAIN_TICKET_ID,
  CH9_TRIAL_STONE_ID,
  canEnterCh9Monastery,
  planCh9ArrivalStory,
  planCh9MonasteryStory,
  planCh9TrainStory,
  type Ch9MonasteryPlan,
  type Ch9TrainPlan,
} from './ch9Story';

function applyTrain(plan: Ch9TrainPlan, flags: Set<string>, keys: Set<string>): void {
  for (const flag of plan.stage?.setFlags ?? []) flags.add(flag);
  if (plan.stage?.grantKeyItem) keys.add(plan.stage.grantKeyItem);
}

function finishTrainPresentation(plan: Ch9TrainPlan, flags: Set<string>): void {
  for (const flag of plan.stage?.setFlagsAfterPresentation ?? []) flags.add(flag);
}

function applyMonastery(plan: Ch9MonasteryPlan, flags: Set<string>, keys: Set<string>): void {
  for (const flag of plan.stage?.setFlags ?? []) flags.add(flag);
  if (plan.stage?.grantKeyItem) keys.add(plan.stage.grantKeyItem);
  if (plan.stage?.grantItem === CH9_HOLY_PAN_ID) flags.add(CH9_STORY_FLAGS.holyPanClaimed);
}

describe('Chapter 9 train and arrival planning', () => {
  it('blocks before Chapter 8, offers once, and commits before the train panel', () => {
    const flags = new Set<string>();
    const keys = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);

    expect(planCh9TrainStory(false, isSet, hasKey)).toEqual({ status: 'blocked', stage: null });
    flags.add(CH9_STORY_FLAGS.priorChapterComplete);
    expect(planCh9TrainStory(false, isSet, hasKey)).toEqual({ status: 'offer', stage: null });

    const committed = planCh9TrainStory(true, isSet, hasKey);
    expect(committed).toEqual({
      status: 'ready',
      stage: {
        id: 'commit',
        setFlags: [CH9_STORY_FLAGS.trainCommitted],
        setFlagsAfterPresentation: [],
        grantKeyItem: CH9_TRAIN_TICKET_ID,
      },
    });
    applyTrain(committed, flags, keys);
    expect(flags.has(CH9_STORY_FLAGS.trainSeen)).toBe(false);

    const panel = planCh9TrainStory(false, isSet, hasKey);
    expect(panel.stage).toMatchObject({
      id: 'train_panel', setFlags: [],
      setFlagsAfterPresentation: [CH9_STORY_FLAGS.trainSeen],
    });
    applyTrain(panel, flags, keys);
    expect(flags.has(CH9_STORY_FLAGS.trainSeen)).toBe(false);
    expect(planCh9TrainStory(false, isSet, hasKey).stage?.id).toBe('train_panel');
    finishTrainPresentation(panel, flags);
    expect(planCh9TrainStory(false, isSet, hasKey).stage?.id).toBe('teleport');
  });

  it('repairs a committed missing ticket without asking again or replaying a seen panel', () => {
    const flags = new Set<string>([
      CH9_STORY_FLAGS.priorChapterComplete,
      CH9_STORY_FLAGS.trainCommitted,
      CH9_STORY_FLAGS.trainSeen,
    ]);
    const keys = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);
    const ticket = planCh9TrainStory(false, isSet, hasKey);
    expect(ticket).toEqual({
      status: 'ready',
      stage: {
        id: 'ticket', setFlags: [], setFlagsAfterPresentation: [],
        grantKeyItem: CH9_TRAIN_TICKET_ID,
      },
    });
    applyTrain(ticket, flags, keys);
    expect(planCh9TrainStory(false, isSet, hasKey).stage?.id).toBe('teleport');
  });

  it('grants no duplicate ticket and makes arrival independently once-only', () => {
    const flags = new Set<string>([CH9_STORY_FLAGS.priorChapterComplete]);
    const keys = new Set<string>([CH9_TRAIN_TICKET_ID]);
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);
    expect(planCh9TrainStory(true, isSet, hasKey).stage?.grantKeyItem).toBeNull();

    const arrival = planCh9ArrivalStory(isSet);
    expect(arrival).toEqual({ status: 'ready', setFlags: [CH9_STORY_FLAGS.arrived] });
    for (const flag of arrival.setFlags) flags.add(flag);
    expect(planCh9ArrivalStory(isSet)).toEqual({ status: 'done', setFlags: [] });
    expect(planCh9TrainStory(false, isSet, hasKey)).toEqual({ status: 'done', stage: null });
    expect([...keys]).toEqual([CH9_TRAIN_TICKET_ID]);
  });
});

describe('Chapter 9 monastery planning', () => {
  it('requires both Count defeat and a durable moral decision at every court', () => {
    const flags = new Set<string>();
    const keys = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);
    expect(canEnterCh9Monastery(isSet)).toBe(false);
    expect(planCh9MonasteryStory('trial', isSet, hasKey, 8)).toMatchObject({
      status: 'blocked',
      missingPrerequisites: [CH9_STORY_FLAGS.bossDefeated, CH9_STORY_FLAGS.choiceDecided],
    });
    flags.add(CH9_STORY_FLAGS.bossDefeated);
    expect(canEnterCh9Monastery(isSet)).toBe(false);
    flags.add(CH9_STORY_FLAGS.choiceDecided);
    expect(canEnterCh9Monastery(isSet)).toBe(true);
    expect(planCh9MonasteryStory('trial', isSet, hasKey, 8).stage?.id).toBe('trial');
  });

  it('keeps trial and awakening in their physical courts and commits the name first', () => {
    const flags = new Set<string>([
      CH9_STORY_FLAGS.bossDefeated,
      CH9_STORY_FLAGS.choiceDecided,
    ]);
    const keys = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);
    expect(planCh9MonasteryStory('awakening', isSet, hasKey, 8)).toMatchObject({
      status: 'blocked', missingPrerequisites: [CH9_STORY_FLAGS.trialSeen],
    });

    const trial = planCh9MonasteryStory('trial', isSet, hasKey, 8);
    expect(trial.stage).toEqual({
      id: 'trial', setFlags: [CH9_STORY_FLAGS.trialSeen], awakeningId: null, minEmbers: null,
      grantKeyItem: null, grantItem: null,
    });
    applyMonastery(trial, flags, keys);
    const keepsake = planCh9MonasteryStory('trial', isSet, hasKey, 8);
    expect(keepsake.stage).toMatchObject({ id: 'trial_stone', grantKeyItem: CH9_TRIAL_STONE_ID });
    applyMonastery(keepsake, flags, keys);
    expect(planCh9MonasteryStory('trial', isSet, hasKey, 8).status).toBe('done');

    const name = planCh9MonasteryStory('awakening', isSet, hasKey, 8);
    expect(name.stage).toMatchObject({ id: 'name', setFlags: [CH9_STORY_FLAGS.dorinNameSpoken] });
    applyMonastery(name, flags, keys);
    const awakening = planCh9MonasteryStory('awakening', isSet, hasKey, 8);
    expect(awakening.stage).toEqual({
      id: 'awakening', setFlags: [], awakeningId: CH9_AWAKENING_ID, minEmbers: null,
      grantKeyItem: null, grantItem: null,
    });
    expect(flags.has(CH9_STORY_FLAGS.dorinAwake)).toBe(false);
    flags.add(CH9_STORY_FLAGS.dorinAwake); // awakeningBeat's durable result
    expect(planCh9MonasteryStory('awakening', isSet, hasKey, 8).status).toBe('done');
  });

  it('blocks the bell until name and awakening, then resumes every durable stage in order', () => {
    const flags = new Set<string>([
      CH9_STORY_FLAGS.bossDefeated,
      CH9_STORY_FLAGS.choiceDecided,
      CH9_STORY_FLAGS.trialSeen,
    ]);
    const keys = new Set<string>([CH9_TRIAL_STONE_ID]);
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);
    expect(planCh9MonasteryStory('bell', isSet, hasKey, 8)).toMatchObject({
      status: 'blocked',
      missingPrerequisites: [CH9_STORY_FLAGS.dorinNameSpoken, CH9_STORY_FLAGS.dorinAwake],
    });
    flags.add(CH9_STORY_FLAGS.dorinNameSpoken);
    flags.add(CH9_STORY_FLAGS.dorinAwake);

    const clapper = planCh9MonasteryStory('bell', isSet, hasKey, 8);
    expect(clapper.stage).toMatchObject({ id: 'clapper', grantKeyItem: CH9_BELL_CLAPPER_ID });
    applyMonastery(clapper, flags, keys);

    const expected = [
      ['heartlight', CH9_STORY_FLAGS.heartlightSeen],
      ['ember', CH9_STORY_FLAGS.ember],
    ] as const;
    for (const [id, flag] of expected) {
      const plan = planCh9MonasteryStory('bell', isSet, hasKey, 8);
      expect(plan.stage?.id).toBe(id);
      expect(plan.stage?.setFlags).toEqual([flag]);
      applyMonastery(plan, flags, keys);
    }

    const repair = planCh9MonasteryStory('bell', isSet, hasKey, 8);
    expect(repair.stage).toEqual({
      id: 'repair_embers', setFlags: [], awakeningId: null, minEmbers: 9,
      grantKeyItem: null, grantItem: null,
    });
    const holyPan = planCh9MonasteryStory('bell', isSet, hasKey, 9);
    expect(holyPan.stage).toMatchObject({ id: 'holy_pan', grantItem: CH9_HOLY_PAN_ID });
    applyMonastery(holyPan, flags, keys);
    const complete = planCh9MonasteryStory('bell', isSet, hasKey, 9);
    expect(complete.stage?.id).toBe('complete');
    applyMonastery(complete, flags, keys);
    const card = planCh9MonasteryStory('bell', isSet, hasKey, 9);
    expect(card.stage).toEqual({
      id: 'chapter_card', setFlags: [CH9_STORY_FLAGS.cardSeen], awakeningId: null, minEmbers: null,
      grantKeyItem: null, grantItem: null,
    });
    applyMonastery(card, flags, keys);
    expect(planCh9MonasteryStory('bell', isSet, hasKey, 9).status).toBe('done');
  });

  it('uses Math.max semantics and never treats completion as proof of missing prerequisites', () => {
    const flags = new Set<string>([
      CH9_STORY_FLAGS.bossDefeated,
      CH9_STORY_FLAGS.choiceDecided,
      CH9_STORY_FLAGS.trialSeen,
      CH9_STORY_FLAGS.dorinNameSpoken,
      CH9_STORY_FLAGS.dorinAwake,
      CH9_STORY_FLAGS.heartlightSeen,
      CH9_STORY_FLAGS.ember,
      CH9_STORY_FLAGS.holyPanClaimed,
      CH9_STORY_FLAGS.complete,
    ]);
    const keys = new Set<string>([CH9_TRIAL_STONE_ID, CH9_BELL_CLAPPER_ID]);
    const isSet = (flag: string): boolean => flags.has(flag);
    const hasKey = (itemId: string): boolean => keys.has(itemId);
    expect(planCh9MonasteryStory('bell', isSet, hasKey, 12).stage?.id).toBe('chapter_card');
    expect(planCh9MonasteryStory('bell', isSet, hasKey, Number.NaN).stage?.id).toBe('repair_embers');

    flags.delete(CH9_STORY_FLAGS.dorinNameSpoken);
    expect(planCh9MonasteryStory('bell', isSet, hasKey, 12)).toMatchObject({
      status: 'blocked', missingPrerequisites: [CH9_STORY_FLAGS.dorinNameSpoken],
    });
  });
});
