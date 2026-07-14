import { beforeEach, describe, expect, it } from 'vitest';
import { BAG_MAX } from '../data/items';
import { QUESTS } from '../data/quests';
import { callerEarned, completeQuest } from './quests';
import { GS } from './state';
import {
  CH9_BUNI_FLAGS,
  CH9_BUNI_INGREDIENTS,
  CH9_BUNI_PICKUP_INTERACTIONS,
  CH9_BUNI_QUEST_ID,
  buniProgress,
  planCh9BuniInteraction,
  planCh9BuniPanel,
  planCh9BuniRewardCommit,
  type Ch9BuniPlan,
} from './ch9Quests';

function applyToSet(plan: Ch9BuniPlan, flags: Set<string>): void {
  for (const flag of plan.setFlags) flags.add(flag);
}

function applyToGame(plan: Ch9BuniPlan): void {
  for (const flag of plan.setFlags) GS.setFlag(flag);
}

beforeEach(() => GS.reset());

describe("Chapter 9 Buni's Table planner", () => {
  it('pins the five flag-only pantry pickups and rejects the obsolete smoked-meat item', () => {
    expect(CH9_BUNI_INGREDIENTS).toEqual([
      { id: 'smantana', itemId: 'smantana', flag: 'q_buni_smantana' },
      { id: 'branza', itemId: 'branza_burduf', flag: 'q_buni_branza' },
      { id: 'mushrooms', itemId: 'valley_mushrooms', flag: 'q_buni_mushrooms' },
      { id: 'cabbage', itemId: 'pickled_cabbage', flag: 'q_buni_cabbage' },
      { id: 'plums', itemId: 'grandfather_plums', flag: 'q_buni_plums' },
    ]);
    expect(CH9_BUNI_INGREDIENTS.map((ingredient) => ingredient.itemId)).not.toContain('smoked_meat');
    expect(CH9_BUNI_PICKUP_INTERACTIONS).toEqual({
      q_buni_smantana: 'smantana',
      q_buni_branza: 'branza',
      q_buni_mushrooms: 'mushrooms',
      q_buni_cabbage: 'cabbage',
      q_buni_plums: 'plums',
    });
    expect(QUESTS[CH9_BUNI_QUEST_ID]).toMatchObject({
      startFlag: CH9_BUNI_FLAGS.start,
      doneFlag: CH9_BUNI_FLAGS.done,
      rewardItem: 'basket_feast',
    });
  });

  it('blocks pre-acceptance pickups and makes start plus each pickup idempotent', () => {
    const flags = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    expect(planCh9BuniInteraction('smantana', isSet)).toMatchObject({
      status: 'blocked', setFlags: [], completeQuest: null,
    });

    const start = planCh9BuniInteraction('start', isSet);
    applyToSet(start, flags);
    expect(flags).toEqual(new Set([CH9_BUNI_FLAGS.start]));
    expect(planCh9BuniInteraction('start', isSet).setFlags).toEqual([]);

    const pickup = planCh9BuniInteraction('smantana', isSet);
    expect(pickup.progress).toMatchObject({ count: 1, total: 5, allCollected: false });
    applyToSet(pickup, flags);
    expect(planCh9BuniInteraction('smantana', isSet).setFlags).toEqual([]);
  });

  it('reports exact canonical progress and waits until return to commit gather then cook', () => {
    const flags = new Set<string>([CH9_BUNI_FLAGS.start]);
    const isSet = (flag: string): boolean => flags.has(flag);
    for (const interaction of ['plums', 'branza', 'cabbage', 'smantana'] as const) {
      applyToSet(planCh9BuniInteraction(interaction, isSet), flags);
    }
    expect(buniProgress(isSet)).toEqual({
      collected: ['smantana', 'branza', 'cabbage', 'plums'],
      missing: ['mushrooms'],
      count: 4,
      total: 5,
      allCollected: false,
    });
    expect(planCh9BuniInteraction('return', isSet).status).toBe('blocked');

    const fifth = planCh9BuniInteraction('mushrooms', isSet);
    applyToSet(fifth, flags);
    expect(fifth.progress.allCollected).toBe(true);
    expect(flags.has(CH9_BUNI_FLAGS.gather)).toBe(false);
    expect(flags.has(CH9_BUNI_FLAGS.cook)).toBe(false);

    const returned = planCh9BuniInteraction('return', isSet);
    expect(returned).toMatchObject({
      status: 'ready',
      setFlags: [CH9_BUNI_FLAGS.gather, CH9_BUNI_FLAGS.cook],
      completeQuest: CH9_BUNI_QUEST_ID,
    });
    applyToSet(returned, flags);
    expect(planCh9BuniInteraction('return', isSet)).toMatchObject({
      status: 'ready', setFlags: [], completeQuest: CH9_BUNI_QUEST_ID,
    });
  });

  it('survives serialization at every pickup without temporary bag entries', () => {
    const isSet = (flag: string): boolean => GS.flag(flag) === true;
    applyToGame(planCh9BuniInteraction('start', isSet));
    for (const ingredient of CH9_BUNI_INGREDIENTS) {
      applyToGame(planCh9BuniInteraction(ingredient.id, isSet));
      GS.deserialize(GS.serialize());
      expect(GS.data.party.flatMap((hero) => hero.bag)).not.toContain(ingredient.itemId);
      expect(GS.flag(ingredient.flag)).toBe(true);
    }
    expect(buniProgress(isSet).allCollected).toBe(true);
  });

  it('keeps a full-bag reward pending, then commits one Basket, recipe, and Caller', () => {
    const isSet = (flag: string): boolean => GS.flag(flag) === true;
    applyToGame(planCh9BuniInteraction('start', isSet));
    for (const ingredient of CH9_BUNI_INGREDIENTS) {
      applyToGame(planCh9BuniInteraction(ingredient.id, isSet));
    }
    const returned = planCh9BuniInteraction('return', isSet);
    applyToGame(returned);
    expect(GS.flag(CH9_BUNI_FLAGS.cook)).toBe(true);

    while (GS.data.party[0].bag.length < BAG_MAX) GS.data.party[0].bag.push('pbj');
    const fullResult = completeQuest(returned.completeQuest!);
    expect(fullResult).toBe('hands-full');
    expect(planCh9BuniRewardCommit(fullResult, isSet)).toEqual([]);
    expect(GS.flag(CH9_BUNI_FLAGS.done)).toBe(false);
    expect(GS.flag(CH9_BUNI_FLAGS.recipe)).toBe(false);
    expect(callerEarned(CH9_BUNI_QUEST_ID)).toBe(false);

    GS.deserialize(GS.serialize());
    GS.data.party[0].bag.pop();
    const retry = planCh9BuniInteraction('return', isSet);
    expect(retry).toMatchObject({ setFlags: [], completeQuest: CH9_BUNI_QUEST_ID });
    const result = completeQuest(retry.completeQuest!);
    expect(result).toBe('ok');
    for (const flag of planCh9BuniRewardCommit(result, isSet)) GS.setFlag(flag);

    expect(GS.flag(CH9_BUNI_FLAGS.done)).toBe(true);
    expect(GS.flag(CH9_BUNI_FLAGS.recipe)).toBe(true);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((item) => item === 'basket_feast')).toHaveLength(1);
    expect(GS.data.callers.filter((caller) => caller.quest === CH9_BUNI_QUEST_ID)).toHaveLength(1);
    expect(planCh9BuniInteraction('return', isSet).status).toBe('done');
    expect(completeQuest(CH9_BUNI_QUEST_ID)).toBe('already');
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((item) => item === 'basket_feast')).toHaveLength(1);
    expect(GS.data.callers.filter((caller) => caller.quest === CH9_BUNI_QUEST_ID)).toHaveLength(1);
  });

  it('repairs only a durable done-without-recipe seam and never unlocks on failure', () => {
    const flags = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    expect(planCh9BuniRewardCommit('ok', isSet)).toEqual([]);
    flags.add(CH9_BUNI_FLAGS.done);
    expect(planCh9BuniRewardCommit('hands-full', isSet)).toEqual([]);
    expect(planCh9BuniRewardCommit('already', isSet)).toEqual([CH9_BUNI_FLAGS.recipe]);
    flags.add(CH9_BUNI_FLAGS.recipe);
    expect(planCh9BuniRewardCommit('already', isSet)).toEqual([]);
  });

  it('keeps the contextual panel once-only and ignores post-boss state', () => {
    const flags = new Set<string>(['count_hoaxula_defeated']);
    const isSet = (flag: string): boolean => flags.has(flag);
    expect(planCh9BuniPanel(isSet)).toEqual([CH9_BUNI_FLAGS.panelSeen]);
    flags.add(CH9_BUNI_FLAGS.panelSeen);
    expect(planCh9BuniPanel(isSet)).toEqual([]);
    expect(planCh9BuniInteraction('start', isSet).status).toBe('ready');
  });
});
