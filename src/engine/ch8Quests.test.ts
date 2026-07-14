import { beforeEach, describe, expect, it } from 'vitest';
import { BAG_MAX } from '../data/items';
import { CHAPTER_MANIFESTS } from '../data/chapters';
import { QUESTS } from '../data/quests';
import { GS } from './state';
import { callerEarned, completeQuest } from './quests';
import {
  CH8_QUEST_FLOWS,
  CH8_QUEST_IDS,
  CH8_QUEST_ITEM_FLOW,
  CH8_QUEST_TRIGGER_INTERACTIONS,
  planCh8QuestInteraction,
  type Ch8QuestPlan,
} from './ch8Quests';

function applyToSet(plan: Ch8QuestPlan, flags: Set<string>): void {
  for (const flag of plan.setFlags) flags.add(flag);
}

beforeEach(() => GS.reset());

describe('Chapter 8 pure quest transitions', () => {
  it('pins the manifest order and every frozen start/objective/done flag', () => {
    expect(CHAPTER_MANIFESTS['8'].quests).toEqual(CH8_QUEST_IDS);
    expect(CH8_QUEST_FLOWS).toMatchObject({
      brushes_of_mt_shu: { startFlag: 'q_brushes', doneFlag: 'q_brushes_done' },
      lanterns_of_the_false_fold: {
        startFlag: 'q_false_fold_lanterns', doneFlag: 'q_false_fold_lanterns_done',
      },
      the_yak_who_waits: { startFlag: 'q_yak_waits', doneFlag: 'q_yak_waits_done' },
      the_harbors_balance: {
        startFlag: 'q_harbor_balance', doneFlag: 'q_harbor_balance_done',
      },
      tea_for_the_empty_chair: { startFlag: 'q_empty_chair', doneFlag: 'q_empty_chair_done' },
    });
    expect(CH8_QUEST_IDS.map((id) => QUESTS[id].objectives.map((objective) => objective.flag))).toEqual([
      ['q_brushes_gather', 'q_brushes_return'],
      ['q_false_fold_lanterns_read', 'q_false_fold_lanterns_refolded'],
      ['q_yak_waits_feed', 'q_yak_waits_route'],
      ['q_harbor_balance_weights', 'q_harbor_balance_delivered'],
      ['q_empty_chair_brewed', 'q_empty_chair_offered'],
    ]);
    expect(CH8_QUEST_ITEM_FLOW.the_yak_who_waits).toEqual({
      grantOnStart: 'yak_treats', consumeOn: 'yak_feed',
    });
    expect(Object.keys(CH8_QUEST_TRIGGER_INTERACTIONS)).toEqual([
      'q_brush_river', 'q_brush_kiln', 'q_brush_cloud',
      'q_false_fold_lantern_1', 'q_false_fold_lantern_2', 'q_false_fold_lantern_3',
      'q_harbor_balance_weight_1', 'q_harbor_balance_weight_2',
      'q_yak_waits_feed', 'q_yak_waits_route', 'q_empty_chair',
    ]);
  });

  it('collects the three brushes in any order and marks gather only on the third', () => {
    const flags = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    applyToSet(planCh8QuestInteraction('brushes_of_mt_shu', 'start', isSet), flags);

    applyToSet(planCh8QuestInteraction('brushes_of_mt_shu', 'brush_cloud', isSet), flags);
    applyToSet(planCh8QuestInteraction('brushes_of_mt_shu', 'brush_river', isSet), flags);
    expect(flags.has('q_brushes_gather')).toBe(false);

    const duplicate = planCh8QuestInteraction('brushes_of_mt_shu', 'brush_river', isSet);
    expect(duplicate.setFlags).toEqual([]);
    applyToSet(planCh8QuestInteraction('brushes_of_mt_shu', 'brush_kiln', isSet), flags);
    expect(flags).toEqual(new Set([
      'q_brushes',
      'q_brush_cloud',
      'q_brush_river',
      'q_brush_kiln',
      'q_brushes_gather',
    ]));
  });

  it('blocks out-of-order steps and resumes from a save-compatible flag snapshot', () => {
    const flags = new Set<string>();
    const isSet = (flag: string): boolean => flags.has(flag);
    expect(planCh8QuestInteraction('tea_for_the_empty_chair', 'tea_offer', isSet).status).toBe('blocked');
    applyToSet(planCh8QuestInteraction('tea_for_the_empty_chair', 'start', isSet), flags);
    expect(planCh8QuestInteraction('tea_for_the_empty_chair', 'tea_offer', isSet).status).toBe('blocked');
    applyToSet(planCh8QuestInteraction('tea_for_the_empty_chair', 'tea_brew', isSet), flags);

    const restored = new Set(JSON.parse(JSON.stringify([...flags])) as string[]);
    const restoredIsSet = (flag: string): boolean => restored.has(flag);
    applyToSet(planCh8QuestInteraction('tea_for_the_empty_chair', 'tea_offer', restoredIsSet), restored);
    const returned = planCh8QuestInteraction('tea_for_the_empty_chair', 'return', restoredIsSet);
    expect(returned).toMatchObject({ status: 'ready', setFlags: [], completeQuest: 'tea_for_the_empty_chair' });
  });

  it('keeps every non-brush flow ordered, idempotent, and available after the boss', () => {
    const cases = [
      ['lanterns_of_the_false_fold', ['lantern_1', 'lantern_2', 'lantern_3'], 'q_false_fold_lanterns_read', 'lantern_refold', 'q_false_fold_lanterns_refolded'],
      ['the_yak_who_waits', ['yak_feed'], 'q_yak_waits_feed', 'yak_route', 'q_yak_waits_route'],
      ['the_harbors_balance', ['harbor_weight_1', 'harbor_weight_2'], 'q_harbor_balance_weights', 'harbor_deliver', 'q_harbor_balance_delivered'],
      ['tea_for_the_empty_chair', ['tea_brew'], 'q_empty_chair_brewed', 'tea_offer', 'q_empty_chair_offered'],
    ] as const;

    for (const [questId, firstSteps, firstFlag, second, secondFlag] of cases) {
      const flags = new Set(['paper_dragon_defeated', 'ch8_complete']);
      const isSet = (flag: string): boolean => flags.has(flag);
      applyToSet(planCh8QuestInteraction(questId, 'start', isSet), flags);
      expect(planCh8QuestInteraction(questId, second, isSet).status).toBe('blocked');
      for (const first of firstSteps) applyToSet(planCh8QuestInteraction(questId, first, isSet), flags);
      expect(flags.has(firstFlag)).toBe(true);
      expect(planCh8QuestInteraction(questId, firstSteps[0], isSet).setFlags).toEqual([]);
      applyToSet(planCh8QuestInteraction(questId, second, isSet), flags);
      expect(flags.has(secondFlag)).toBe(true);
      expect(planCh8QuestInteraction(questId, 'return', isSet).completeQuest).toBe(questId);
    }
  });

  it('keeps a completed world interaction retryable through the existing hands-full machine', () => {
    const isSet = (flag: string): boolean => GS.flag(flag) === true;
    const apply = (plan: Ch8QuestPlan): void => {
      for (const flag of plan.setFlags) GS.setFlag(flag);
    };
    apply(planCh8QuestInteraction('brushes_of_mt_shu', 'start', isSet));
    apply(planCh8QuestInteraction('brushes_of_mt_shu', 'brush_river', isSet));
    apply(planCh8QuestInteraction('brushes_of_mt_shu', 'brush_kiln', isSet));
    apply(planCh8QuestInteraction('brushes_of_mt_shu', 'brush_cloud', isSet));
    const returned = planCh8QuestInteraction('brushes_of_mt_shu', 'return', isSet);
    apply(returned);
    expect(returned.completeQuest).toBe('brushes_of_mt_shu');

    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');
    expect(completeQuest(returned.completeQuest!)).toBe('hands-full');
    expect(GS.flag('q_brushes_return')).toBe(true);
    expect(GS.flag('q_brushes_done')).toBe(false);
    expect(callerEarned('brushes_of_mt_shu')).toBe(false);

    const retry = planCh8QuestInteraction('brushes_of_mt_shu', 'return', isSet);
    expect(retry).toMatchObject({ setFlags: [], completeQuest: 'brushes_of_mt_shu' });
    rex.bag.pop();
    expect(completeQuest(retry.completeQuest!)).toBe('ok');
    expect(callerEarned('brushes_of_mt_shu')).toBe(true);
    expect(planCh8QuestInteraction('brushes_of_mt_shu', 'return', isSet).status).toBe('done');
  });

  it.each(CH8_QUEST_IDS)('%s survives a full-bag save/retry and commits one reward plus one Caller', (questId) => {
    const quest = QUESTS[questId];
    GS.setFlag(quest.startFlag);
    for (const objective of quest.objectives) GS.setFlag(objective.flag);
    const rex = GS.data.party[0];
    while (rex.bag.length < BAG_MAX) rex.bag.push('pbj');

    expect(completeQuest(questId)).toBe('hands-full');
    expect(GS.flag(quest.doneFlag)).toBe(false);
    expect(callerEarned(questId)).toBe(false);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === quest.rewardItem)).toHaveLength(0);

    // The pending objective snapshot is real save data, not an in-memory retry token.
    GS.deserialize(GS.serialize());
    GS.data.party[0].bag.pop();
    expect(completeQuest(questId)).toBe('ok');
    expect(GS.flag(quest.doneFlag)).toBe(true);
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === quest.rewardItem)).toHaveLength(1);
    expect(GS.data.callers.filter((caller) => caller.quest === questId)).toEqual([
      expect.objectContaining({
        quest: questId,
        name: quest.caller.name,
        effect: quest.caller.effect,
      }),
    ]);

    expect(completeQuest(questId)).toBe('already');
    expect(GS.data.party.flatMap((hero) => hero.bag).filter((id) => id === quest.rewardItem)).toHaveLength(1);
    expect(GS.data.callers.filter((caller) => caller.quest === questId)).toHaveLength(1);
  });
});
