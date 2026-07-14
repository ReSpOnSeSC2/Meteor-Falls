/**
 * Chapter 8 quest interaction planner.
 *
 * Map/runtime code owns presentation and applies the returned flag patch. This
 * module is deliberately pure: repeated interactions return no duplicate flag
 * writes, and giver returns keep requesting the existing completeQuest()
 * transaction until its reward fits in a bag.
 */

export const CH8_QUEST_IDS = [
  'brushes_of_mt_shu',
  'lanterns_of_the_false_fold',
  'the_yak_who_waits',
  'the_harbors_balance',
  'tea_for_the_empty_chair',
] as const;

export type Ch8QuestId = (typeof CH8_QUEST_IDS)[number];

/** The Yak quest is the one Chapter 8 flow with an existing carried quest item. */
export const CH8_QUEST_ITEM_FLOW = {
  the_yak_who_waits: { grantOnStart: 'yak_treats', consumeOn: 'yak_feed' },
} as const;

export type Ch8QuestInteraction =
  | 'start'
  | 'brush_river'
  | 'brush_kiln'
  | 'brush_cloud'
  | 'lantern_1'
  | 'lantern_2'
  | 'lantern_3'
  | 'lantern_refold'
  | 'yak_feed'
  | 'yak_route'
  | 'harbor_weight_1'
  | 'harbor_weight_2'
  | 'harbor_deliver'
  | 'tea_brew'
  | 'tea_offer'
  | 'return';

/** Direct map-trigger routing, kept beside the pure flows to prevent switch drift. */
export const CH8_QUEST_TRIGGER_INTERACTIONS = {
  q_brush_river: { questId: 'brushes_of_mt_shu', interaction: 'brush_river' },
  q_brush_kiln: { questId: 'brushes_of_mt_shu', interaction: 'brush_kiln' },
  q_brush_cloud: { questId: 'brushes_of_mt_shu', interaction: 'brush_cloud' },
  q_false_fold_lantern_1: { questId: 'lanterns_of_the_false_fold', interaction: 'lantern_1' },
  q_false_fold_lantern_2: { questId: 'lanterns_of_the_false_fold', interaction: 'lantern_2' },
  q_false_fold_lantern_3: { questId: 'lanterns_of_the_false_fold', interaction: 'lantern_3' },
  q_harbor_balance_weight_1: { questId: 'the_harbors_balance', interaction: 'harbor_weight_1' },
  q_harbor_balance_weight_2: { questId: 'the_harbors_balance', interaction: 'harbor_weight_2' },
  q_yak_waits_feed: { questId: 'the_yak_who_waits', interaction: 'yak_feed' },
  q_yak_waits_route: { questId: 'the_yak_who_waits', interaction: 'yak_route' },
  q_empty_chair: { questId: 'tea_for_the_empty_chair', interaction: 'tea_offer' },
} as const satisfies Record<string, { questId: Ch8QuestId; interaction: Ch8QuestInteraction }>;

export type Ch8QuestPlanStatus = 'ready' | 'blocked' | 'done';

export interface Ch8QuestPlan {
  readonly status: Ch8QuestPlanStatus;
  /** Flags to set, in order, before attempting completion. */
  readonly setFlags: readonly string[];
  /** Route this through engine/quests.completeQuest when non-null. */
  readonly completeQuest: Ch8QuestId | null;
}

interface QuestStep {
  requires: readonly string[];
  sets: readonly string[];
  completes?: boolean;
}

interface QuestFlow {
  startFlag: string;
  doneFlag: string;
  steps: Readonly<Partial<Record<Ch8QuestInteraction, QuestStep>>>;
  collectionFlags?: readonly string[];
  collectionDoneFlag?: string;
}

export const CH8_QUEST_FLOWS: Readonly<Record<Ch8QuestId, QuestFlow>> = {
  brushes_of_mt_shu: {
    startFlag: 'q_brushes',
    doneFlag: 'q_brushes_done',
    collectionFlags: ['q_brush_river', 'q_brush_kiln', 'q_brush_cloud'],
    collectionDoneFlag: 'q_brushes_gather',
    steps: {
      brush_river: { requires: [], sets: ['q_brush_river'] },
      brush_kiln: { requires: [], sets: ['q_brush_kiln'] },
      brush_cloud: { requires: [], sets: ['q_brush_cloud'] },
      return: { requires: ['q_brushes_gather'], sets: ['q_brushes_return'], completes: true },
    },
  },
  lanterns_of_the_false_fold: {
    startFlag: 'q_false_fold_lanterns',
    doneFlag: 'q_false_fold_lanterns_done',
    collectionFlags: [
      'q_false_fold_lantern_1',
      'q_false_fold_lantern_2',
      'q_false_fold_lantern_3',
    ],
    collectionDoneFlag: 'q_false_fold_lanterns_read',
    steps: {
      lantern_1: { requires: [], sets: ['q_false_fold_lantern_1'] },
      lantern_2: { requires: [], sets: ['q_false_fold_lantern_2'] },
      lantern_3: { requires: [], sets: ['q_false_fold_lantern_3'] },
      lantern_refold: {
        requires: ['q_false_fold_lanterns_read'],
        sets: ['q_false_fold_lanterns_refolded'],
      },
      return: { requires: ['q_false_fold_lanterns_refolded'], sets: [], completes: true },
    },
  },
  the_yak_who_waits: {
    startFlag: 'q_yak_waits',
    doneFlag: 'q_yak_waits_done',
    steps: {
      yak_feed: { requires: [], sets: ['q_yak_waits_feed'] },
      yak_route: { requires: ['q_yak_waits_feed'], sets: ['q_yak_waits_route'] },
      return: { requires: ['q_yak_waits_route'], sets: [], completes: true },
    },
  },
  the_harbors_balance: {
    startFlag: 'q_harbor_balance',
    doneFlag: 'q_harbor_balance_done',
    collectionFlags: ['q_harbor_balance_weight_1', 'q_harbor_balance_weight_2'],
    collectionDoneFlag: 'q_harbor_balance_weights',
    steps: {
      harbor_weight_1: { requires: [], sets: ['q_harbor_balance_weight_1'] },
      harbor_weight_2: { requires: [], sets: ['q_harbor_balance_weight_2'] },
      harbor_deliver: {
        requires: ['q_harbor_balance_weights'],
        sets: ['q_harbor_balance_delivered'],
      },
      return: { requires: ['q_harbor_balance_delivered'], sets: [], completes: true },
    },
  },
  tea_for_the_empty_chair: {
    startFlag: 'q_empty_chair',
    doneFlag: 'q_empty_chair_done',
    steps: {
      tea_brew: { requires: [], sets: ['q_empty_chair_brewed'] },
      tea_offer: { requires: ['q_empty_chair_brewed'], sets: ['q_empty_chair_offered'] },
      return: { requires: ['q_empty_chair_offered'], sets: [], completes: true },
    },
  },
};

const BLOCKED: Ch8QuestPlan = { status: 'blocked', setFlags: [], completeQuest: null };
const DONE: Ch8QuestPlan = { status: 'done', setFlags: [], completeQuest: null };

/**
 * Plan one persistent interaction. The caller applies setFlags first, then
 * passes completeQuest to the existing quest machine when present.
 */
export function planCh8QuestInteraction(
  questId: Ch8QuestId,
  interaction: Ch8QuestInteraction,
  isSet: (flag: string) => boolean,
): Ch8QuestPlan {
  const flow = CH8_QUEST_FLOWS[questId];
  if (isSet(flow.doneFlag)) return DONE;

  if (interaction === 'start') {
    return {
      status: 'ready',
      setFlags: isSet(flow.startFlag) ? [] : [flow.startFlag],
      completeQuest: null,
    };
  }

  if (!isSet(flow.startFlag)) return BLOCKED;
  const step = flow.steps[interaction];
  if (!step || step.requires.some((flag) => !isSet(flag))) return BLOCKED;

  const setFlags = step.sets.filter((flag) => !isSet(flag));
  if (flow.collectionFlags && flow.collectionDoneFlag) {
    const prospective = (flag: string): boolean => isSet(flag) || setFlags.includes(flag);
    if (flow.collectionFlags.every(prospective) && !isSet(flow.collectionDoneFlag)) {
      setFlags.push(flow.collectionDoneFlag);
    }
  }

  return {
    status: 'ready',
    setFlags,
    // Keep returning this request after a hands-full result. completeQuest()
    // becomes inert only once its doneFlag has committed.
    completeQuest: step.completes ? questId : null,
  };
}
