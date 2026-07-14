/**
 * Pure Chapter 9 planning for Buni's Table.
 *
 * The five pantry pickups are save flags, not carried items. Runtime applies
 * each returned flag patch before presentation, then routes completeQuest
 * through the existing quest engine. No function in this module mutates GS.
 */
import type { CompleteResult } from './quests';

export const CH9_BUNI_QUEST_ID = 'bunis_table' as const;

export const CH9_BUNI_FLAGS = {
  start: 'q_bunis',
  gather: 'q_bunis_gather',
  cook: 'q_bunis_cook',
  done: 'q_bunis_done',
  recipe: 'feast_recipe',
  panelSeen: 'ch9_buni_panel_seen',
} as const;

/** Canonical pantry order. The former smoked-meat prose is not a sixth item. */
export const CH9_BUNI_INGREDIENTS = [
  { id: 'smantana', itemId: 'smantana', flag: 'q_buni_smantana' },
  { id: 'branza', itemId: 'branza_burduf', flag: 'q_buni_branza' },
  { id: 'mushrooms', itemId: 'valley_mushrooms', flag: 'q_buni_mushrooms' },
  { id: 'cabbage', itemId: 'pickled_cabbage', flag: 'q_buni_cabbage' },
  { id: 'plums', itemId: 'grandfather_plums', flag: 'q_buni_plums' },
] as const;

export type Ch9BuniIngredientId = (typeof CH9_BUNI_INGREDIENTS)[number]['id'];
export type Ch9BuniInteraction = 'start' | Ch9BuniIngredientId | 'return';

/** Direct map-trigger routing, kept beside the planner to prevent ID drift. */
export const CH9_BUNI_PICKUP_INTERACTIONS = {
  q_buni_smantana: 'smantana',
  q_buni_branza: 'branza',
  q_buni_mushrooms: 'mushrooms',
  q_buni_cabbage: 'cabbage',
  q_buni_plums: 'plums',
} as const satisfies Record<string, Ch9BuniIngredientId>;

export interface Ch9BuniProgress {
  readonly collected: readonly Ch9BuniIngredientId[];
  readonly missing: readonly Ch9BuniIngredientId[];
  readonly count: number;
  readonly total: number;
  readonly allCollected: boolean;
}

export type Ch9BuniPlanStatus = 'ready' | 'blocked' | 'done';

export interface Ch9BuniPlan {
  readonly status: Ch9BuniPlanStatus;
  /** Apply in this order before any presentation. */
  readonly setFlags: readonly string[];
  /** Route through completeQuest(), then immediately plan its reward commit. */
  readonly completeQuest: typeof CH9_BUNI_QUEST_ID | null;
  /** Progress after applying setFlags, so dialogue can report the exact count. */
  readonly progress: Ch9BuniProgress;
}

function progressWith(
  isSet: (flag: string) => boolean,
  prospectiveFlags: readonly string[],
): Ch9BuniProgress {
  const prospective = new Set(prospectiveFlags);
  const collected = CH9_BUNI_INGREDIENTS
    .filter((ingredient) => isSet(ingredient.flag) || prospective.has(ingredient.flag))
    .map((ingredient) => ingredient.id);
  const collectedSet = new Set<Ch9BuniIngredientId>(collected);
  const missing = CH9_BUNI_INGREDIENTS
    .map((ingredient) => ingredient.id)
    .filter((id) => !collectedSet.has(id));
  return {
    collected,
    missing,
    count: collected.length,
    total: CH9_BUNI_INGREDIENTS.length,
    allCollected: collected.length === CH9_BUNI_INGREDIENTS.length,
  };
}

/** Current pantry progress in canonical order. */
export function buniProgress(isSet: (flag: string) => boolean): Ch9BuniProgress {
  return progressWith(isSet, []);
}

/**
 * Plan one persistent Buni interaction.
 *
 * The fifth pickup records only its independent pickup flag. The first return
 * with all five commits gather, then cook, before presentation. A hands-full
 * reward leaves cook set and completeQuest requested on every later return.
 */
export function planCh9BuniInteraction(
  interaction: Ch9BuniInteraction,
  isSet: (flag: string) => boolean,
): Ch9BuniPlan {
  const current = buniProgress(isSet);
  if (isSet(CH9_BUNI_FLAGS.done)) {
    return { status: 'done', setFlags: [], completeQuest: null, progress: current };
  }

  if (interaction === 'start') {
    const setFlags = isSet(CH9_BUNI_FLAGS.start) ? [] : [CH9_BUNI_FLAGS.start];
    return {
      status: 'ready',
      setFlags,
      completeQuest: null,
      progress: progressWith(isSet, setFlags),
    };
  }

  if (!isSet(CH9_BUNI_FLAGS.start)) {
    return { status: 'blocked', setFlags: [], completeQuest: null, progress: current };
  }

  if (interaction === 'return') {
    if (!current.allCollected) {
      return { status: 'blocked', setFlags: [], completeQuest: null, progress: current };
    }
    const setFlags: string[] = [];
    if (!isSet(CH9_BUNI_FLAGS.gather)) setFlags.push(CH9_BUNI_FLAGS.gather);
    if (!isSet(CH9_BUNI_FLAGS.cook)) setFlags.push(CH9_BUNI_FLAGS.cook);
    return {
      status: 'ready',
      setFlags,
      completeQuest: CH9_BUNI_QUEST_ID,
      progress: progressWith(isSet, setFlags),
    };
  }

  const ingredient = CH9_BUNI_INGREDIENTS.find((entry) => entry.id === interaction);
  if (!ingredient) {
    return { status: 'blocked', setFlags: [], completeQuest: null, progress: current };
  }
  const setFlags = isSet(ingredient.flag) ? [] : [ingredient.flag];
  return {
    status: 'ready',
    setFlags,
    completeQuest: null,
    progress: progressWith(isSet, setFlags),
  };
}

/** Flag patch to commit before Buni's contextual family panel. */
export function planCh9BuniPanel(isSet: (flag: string) => boolean): readonly string[] {
  return isSet(CH9_BUNI_FLAGS.panelSeen) ? [] : [CH9_BUNI_FLAGS.panelSeen];
}

/**
 * Recipe half of the reward transaction.
 *
 * Call synchronously immediately after completeQuest(). `q_bunis_done` is the
 * durable proof that the Basket and Caller committed. A hands-full result can
 * never unlock the recipe; an older done-without-recipe seam repairs safely.
 */
export function planCh9BuniRewardCommit(
  result: CompleteResult,
  isSet: (flag: string) => boolean,
): readonly string[] {
  if (result === 'hands-full' || !isSet(CH9_BUNI_FLAGS.done) || isSet(CH9_BUNI_FLAGS.recipe)) {
    return [];
  }
  return [CH9_BUNI_FLAGS.recipe];
}
