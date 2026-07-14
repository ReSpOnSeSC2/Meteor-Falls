/**
 * Pure, one-stage-at-a-time Chapter 9 chronology planners.
 *
 * Runtime commits each returned stage before its presentation and then plans
 * again. This keeps train, trial, awakening, Heartlight, Ember, and chapter-card
 * recovery deterministic without deriving story truth from player location.
 */

export const CH9_TRAIN_TICKET_ID = 'orient_express_ticket' as const;
export const CH9_AWAKENING_ID = 'trial_of_the_mute_mountain' as const;

export const CH9_STORY_FLAGS = {
  priorChapterComplete: 'ch8_complete',
  trainCommitted: 'ch9_train_committed',
  trainSeen: 'ch9_train_seen',
  arrived: 'ch9_arrived',
  bossDefeated: 'count_hoaxula_defeated',
  candelabraClaimed: 'ch9_candelabra_claimed',
  choiceDecided: 'ch9_count_decided',
  trialSeen: 'ch9_trial_seen',
  dorinNameSpoken: 'ch9_dorin_name_spoken',
  dorinAwake: 'awake_comet_o',
  heartlightSeen: 'ch9_heartlight_seen',
  ember: 'ember9',
  holyPanClaimed: 'ch9_holy_pan_claimed',
  complete: 'ch9_complete',
  cardSeen: 'ch9_card_seen',
} as const;

export const CH9_TRIAL_STONE_ID = 'trial_stone' as const;
export const CH9_BELL_CLAPPER_ID = 'monastery_bell_clapper' as const;
export const CH9_HOLY_PAN_ID = 'holy_pan' as const;

export type Ch9TrainStageId = 'commit' | 'ticket' | 'train_panel' | 'teleport';

export interface Ch9TrainStage {
  readonly id: Ch9TrainStageId;
  /** Commit before any presentation or travel. */
  readonly setFlags: readonly string[];
  /** Only the train panel commits its seen flag after successful playback. */
  readonly setFlagsAfterPresentation: readonly string[];
  readonly grantKeyItem: typeof CH9_TRAIN_TICKET_ID | null;
}

export type Ch9TrainPlanStatus = 'blocked' | 'offer' | 'ready' | 'done';

export interface Ch9TrainPlan {
  readonly status: Ch9TrainPlanStatus;
  readonly stage: Ch9TrainStage | null;
}

/**
 * Plan the next frontier action. Passing accepted=true represents the one
 * positive answer to the offer. A committed save never returns `offer` again.
 */
export function planCh9TrainStory(
  accepted: boolean,
  isSet: (flag: string) => boolean,
  hasKeyItem: (itemId: string) => boolean,
): Ch9TrainPlan {
  if (isSet(CH9_STORY_FLAGS.arrived)) return { status: 'done', stage: null };
  if (!isSet(CH9_STORY_FLAGS.priorChapterComplete)) return { status: 'blocked', stage: null };

  if (!isSet(CH9_STORY_FLAGS.trainCommitted)) {
    if (!accepted) return { status: 'offer', stage: null };
    return {
      status: 'ready',
      stage: {
        id: 'commit',
        setFlags: [CH9_STORY_FLAGS.trainCommitted],
        setFlagsAfterPresentation: [],
        grantKeyItem: hasKeyItem(CH9_TRAIN_TICKET_ID) ? null : CH9_TRAIN_TICKET_ID,
      },
    };
  }

  if (!hasKeyItem(CH9_TRAIN_TICKET_ID)) {
    return {
      status: 'ready',
      stage: {
        id: 'ticket', setFlags: [], setFlagsAfterPresentation: [],
        grantKeyItem: CH9_TRAIN_TICKET_ID,
      },
    };
  }

  if (!isSet(CH9_STORY_FLAGS.trainSeen)) {
    return {
      status: 'ready',
      stage: {
        id: 'train_panel',
        setFlags: [],
        setFlagsAfterPresentation: [CH9_STORY_FLAGS.trainSeen],
        grantKeyItem: null,
      },
    };
  }

  return {
    status: 'ready',
    stage: {
      id: 'teleport', setFlags: [], setFlagsAfterPresentation: [], grantKeyItem: null,
    },
  };
}

export interface Ch9ArrivalPlan {
  readonly status: 'ready' | 'done';
  readonly setFlags: readonly string[];
}

/** Entering the authored arrival rectangle commits before its contextual panel. */
export function planCh9ArrivalStory(isSet: (flag: string) => boolean): Ch9ArrivalPlan {
  return isSet(CH9_STORY_FLAGS.arrived)
    ? { status: 'done', setFlags: [] }
    : { status: 'ready', setFlags: [CH9_STORY_FLAGS.arrived] };
}

export const CH9_MONASTERY_FRONTIERS = ['trial', 'awakening', 'bell'] as const;
export type Ch9MonasteryFrontier = (typeof CH9_MONASTERY_FRONTIERS)[number];

export type Ch9MonasteryStageId =
  | 'trial'
  | 'trial_stone'
  | 'name'
  | 'awakening'
  | 'clapper'
  | 'heartlight'
  | 'ember'
  | 'repair_embers'
  | 'holy_pan'
  | 'complete'
  | 'chapter_card';

export interface Ch9MonasteryStage {
  readonly id: Ch9MonasteryStageId;
  /** Apply before presentation; awakeningBeat owns its own awake flag. */
  readonly setFlags: readonly string[];
  readonly awakeningId: typeof CH9_AWAKENING_ID | null;
  /** Runtime applies Math.max(current, minEmbers) when non-null. */
  readonly minEmbers: 9 | null;
  readonly grantKeyItem: typeof CH9_TRIAL_STONE_ID | typeof CH9_BELL_CLAPPER_ID | null;
  readonly grantItem: typeof CH9_HOLY_PAN_ID | null;
}

export interface Ch9MonasteryPlan {
  readonly status: 'blocked' | 'ready' | 'done';
  readonly missingPrerequisites: readonly string[];
  readonly stage: Ch9MonasteryStage | null;
}

const routeRequirements = [
  CH9_STORY_FLAGS.bossDefeated,
  CH9_STORY_FLAGS.choiceDecided,
] as const;

/** The Castle's north door and every monastery court share this exact gate. */
export function canEnterCh9Monastery(isSet: (flag: string) => boolean): boolean {
  return routeRequirements.every(isSet);
}

function readyStage(
  id: Ch9MonasteryStageId,
  setFlags: readonly string[] = [],
  awakeningId: typeof CH9_AWAKENING_ID | null = null,
  minEmbers: 9 | null = null,
  grantKeyItem: typeof CH9_TRIAL_STONE_ID | typeof CH9_BELL_CLAPPER_ID | null = null,
  grantItem: typeof CH9_HOLY_PAN_ID | null = null,
): Ch9MonasteryPlan {
  return {
    status: 'ready',
    missingPrerequisites: [],
    stage: { id, setFlags, awakeningId, minEmbers, grantKeyItem, grantItem },
  };
}

/**
 * Return one next durable stage for the specified physical court.
 * Missing earlier-court prerequisites block instead of replaying them at the
 * wrong location. Re-plan after every applied/presented stage.
 */
export function planCh9MonasteryStory(
  frontier: Ch9MonasteryFrontier,
  isSet: (flag: string) => boolean,
  hasKeyItem: (itemId: string) => boolean,
  embers: number,
): Ch9MonasteryPlan {
  const prerequisites: string[] = [...routeRequirements];
  if (frontier === 'awakening' || frontier === 'bell') {
    prerequisites.push(CH9_STORY_FLAGS.trialSeen);
  }
  if (frontier === 'bell') {
    prerequisites.push(CH9_STORY_FLAGS.dorinNameSpoken, CH9_STORY_FLAGS.dorinAwake);
  }
  const missingPrerequisites = prerequisites.filter((flag) => !isSet(flag));
  if (missingPrerequisites.length > 0) {
    return { status: 'blocked', missingPrerequisites, stage: null };
  }

  if (frontier === 'trial') {
    if (!isSet(CH9_STORY_FLAGS.trialSeen)) {
      return readyStage('trial', [CH9_STORY_FLAGS.trialSeen]);
    }
    return hasKeyItem(CH9_TRIAL_STONE_ID)
      ? { status: 'done', missingPrerequisites: [], stage: null }
      : readyStage('trial_stone', [], null, null, CH9_TRIAL_STONE_ID);
  }

  if (frontier === 'awakening') {
    if (!hasKeyItem(CH9_TRIAL_STONE_ID)) {
      return { status: 'blocked', missingPrerequisites: [CH9_TRIAL_STONE_ID], stage: null };
    }
    if (!isSet(CH9_STORY_FLAGS.dorinNameSpoken)) {
      return readyStage('name', [CH9_STORY_FLAGS.dorinNameSpoken]);
    }
    if (!isSet(CH9_STORY_FLAGS.dorinAwake)) {
      return readyStage('awakening', [], CH9_AWAKENING_ID);
    }
    return { status: 'done', missingPrerequisites: [], stage: null };
  }

  if (!hasKeyItem(CH9_BELL_CLAPPER_ID)) {
    return readyStage('clapper', [], null, null, CH9_BELL_CLAPPER_ID);
  }
  if (!isSet(CH9_STORY_FLAGS.heartlightSeen)) {
    return readyStage('heartlight', [CH9_STORY_FLAGS.heartlightSeen]);
  }
  if (!isSet(CH9_STORY_FLAGS.ember)) {
    return readyStage('ember', [CH9_STORY_FLAGS.ember], null, 9);
  }
  if (!Number.isFinite(embers) || embers < 9) {
    return readyStage('repair_embers', [], null, 9);
  }
  if (!isSet(CH9_STORY_FLAGS.holyPanClaimed)) {
    return readyStage('holy_pan', [], null, null, null, CH9_HOLY_PAN_ID);
  }
  if (!isSet(CH9_STORY_FLAGS.complete)) {
    return readyStage('complete', [CH9_STORY_FLAGS.complete]);
  }
  if (!isSet(CH9_STORY_FLAGS.cardSeen)) {
    return readyStage('chapter_card', [CH9_STORY_FLAGS.cardSeen]);
  }
  return { status: 'done', missingPrerequisites: [], stage: null };
}
