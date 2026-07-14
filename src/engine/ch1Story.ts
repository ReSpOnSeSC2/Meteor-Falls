/** Save-compatible Chapter 1 world phase. Lighting, dialogue, crowds, and travel
 * all derive from this one state instead of treating the sickly morning as night. */
export type Chapter1Phase = 'meteor-night' | 'hush-morning' | 'restored-day' | 'chapter-complete';

export function chapter1Phase(flag: (id: string) => boolean): Chapter1Phase {
  if (flag('ch1_complete')) return 'chapter-complete';
  if (flag('tick_defeated')) return 'restored-day';
  if (flag('zapper_done')) return 'hush-morning';
  return 'meteor-night';
}

export function chapter1BannerTag(phase: Chapter1Phase): string | undefined {
  if (phase === 'meteor-night') return '2 A.M.';
  if (phase === 'hush-morning') return 'HUSH MORNING';
  return undefined;
}

/** Durable Chapter 1 transaction flags. Presentation flags deliberately stay
 * separate from the world-state flags that unlock later gameplay. */
export const CH1_STORY_FLAGS = {
  metGlint: 'met_glint',
  sentinelRepelled: 'sentinel_repelled',
  sentinelHusk: 'sentinel_husk_left',
  sentinelAfterSeen: 'ch1_sentinel_after_seen',
  glintWalkHome: 'glint_walk_home',
  zapperHit: 'zapper_hit',
  sparkClaimed: 'ch1_glints_spark_claimed',
  sparkSeen: 'ch1_glints_spark_seen',
  lifeupAwake: 'awake_lifeup_a',
  porchAfterSeen: 'ch1_porch_after_seen',
  zapperDone: 'zapper_done',
  tickDefeated: 'tick_defeated',
  ember: 'ember1',
  emberSeen: 'ch1_ember1_seen',
  tickAfterSeen: 'ch1_tick_after_seen',
  holdingOpen: 'holding_open',
  fayeMetSeen: 'ch1_faye_met_seen',
  fayeListenAwake: 'awake_fire_a',
  fayeJoinCopySeen: 'ch1_faye_join_copy_seen',
  fayePanSeen: 'ch1_faye_pan_seen',
  fayeJoined: 'faye_joined',
  managerDefeated: 'manager_defeated',
  managerWinSeen: 'ch1_manager_win_seen',
  momCallSeen: 'ch1_mom_call_seen',
  firstHeartlightSeen: 'ch1_first_heartlight_seen',
  starsongAwake: 'awake_starsong_a',
  fayeAfterCallSeen: 'ch1_faye_after_call_seen',
  complete: 'ch1_complete',
  cardSeen: 'ch1_card_seen',
} as const;

export const CH1_STAR_LOCKET_ID = 'star_locket' as const;
export const CH1_GLINT_SPARK_ID = 'glints_spark' as const;
export const CH1_FAYE_PAN_ID = 'hand_me_down_pan' as const;

export interface Chapter1StagePlan<Stage extends string> {
  readonly status: 'blocked' | 'ready' | 'done';
  readonly missingPrerequisites: readonly string[];
  readonly stage: { readonly id: Stage } | null;
}

function ready<Stage extends string>(id: Stage): Chapter1StagePlan<Stage> {
  return { status: 'ready', missingPrerequisites: [], stage: { id } };
}

function done<Stage extends string>(): Chapter1StagePlan<Stage> {
  return { status: 'done', missingPrerequisites: [], stage: null };
}

function blocked<Stage extends string>(...missingPrerequisites: string[]): Chapter1StagePlan<Stage> {
  return { status: 'blocked', missingPrerequisites, stage: null };
}

export type Ch1CraterStageId =
  | 'meet_glint'
  | 'locket'
  | 'sentinel_battle'
  | 'sentinel_victory_repair'
  | 'sentinel_after';

export function planCh1CraterStory(
  isSet: (flag: string) => boolean,
  locketCount: number,
): Chapter1StagePlan<Ch1CraterStageId> {
  if (!isSet(CH1_STORY_FLAGS.metGlint)) return ready('meet_glint');
  if (locketCount !== 1) return ready('locket');
  if (!isSet(CH1_STORY_FLAGS.sentinelRepelled)) return ready('sentinel_battle');

  const zapperHasClaimedGlint = isSet(CH1_STORY_FLAGS.zapperHit) || isSet(CH1_STORY_FLAGS.zapperDone);
  const walkFlagWrong = zapperHasClaimedGlint
    ? isSet(CH1_STORY_FLAGS.glintWalkHome)
    : !isSet(CH1_STORY_FLAGS.glintWalkHome);
  if (!isSet(CH1_STORY_FLAGS.sentinelHusk) || walkFlagWrong) return ready('sentinel_victory_repair');
  if (!isSet(CH1_STORY_FLAGS.sentinelAfterSeen)) return ready('sentinel_after');
  return done();
}

export type Ch1PorchStageId = 'zapper' | 'spark' | 'spark_copy' | 'awakening' | 'porch_after';

export function planCh1PorchStory(
  isSet: (flag: string) => boolean,
  sparkCount: number,
): Chapter1StagePlan<Ch1PorchStageId> {
  if (!isSet(CH1_STORY_FLAGS.sentinelRepelled)) return blocked(CH1_STORY_FLAGS.sentinelRepelled);
  if (!isSet(CH1_STORY_FLAGS.zapperHit)) return ready('zapper');
  if (!isSet(CH1_STORY_FLAGS.sparkClaimed) || sparkCount > 1) return ready('spark');
  if (!isSet(CH1_STORY_FLAGS.sparkSeen)) return ready('spark_copy');
  if (!isSet(CH1_STORY_FLAGS.lifeupAwake)) return ready('awakening');
  if (!isSet(CH1_STORY_FLAGS.porchAfterSeen)) return ready('porch_after');
  return done();
}

export type Ch1TickStageId =
  | 'tick_battle'
  | 'ember_commit'
  | 'repair_embers'
  | 'ember_presentation'
  | 'tick_after';

export function planCh1TickStory(
  isSet: (flag: string) => boolean,
  embers: number,
): Chapter1StagePlan<Ch1TickStageId> {
  if (!isSet(CH1_STORY_FLAGS.zapperDone)) return blocked(CH1_STORY_FLAGS.zapperDone);
  if (!isSet(CH1_STORY_FLAGS.tickDefeated)) return ready('tick_battle');
  if (!isSet(CH1_STORY_FLAGS.ember)) return ready('ember_commit');
  if (!Number.isFinite(embers) || embers < 1) return ready('repair_embers');
  if (!isSet(CH1_STORY_FLAGS.emberSeen)) return ready('ember_presentation');
  if (!isSet(CH1_STORY_FLAGS.tickAfterSeen)) return ready('tick_after');
  return done();
}

export interface Ch1FayeFacts {
  readonly fayeCount: number;
  readonly panCount: number;
  readonly panOnFaye: boolean;
  readonly panEquipped: boolean;
}

export type Ch1FayeStageId =
  | 'meet'
  | 'first_listen'
  | 'join_copy'
  | 'party'
  | 'pan'
  | 'pan_presentation'
  | 'complete';

export function planCh1FayeStory(
  isSet: (flag: string) => boolean,
  facts: Ch1FayeFacts,
): Chapter1StagePlan<Ch1FayeStageId> {
  if (!isSet(CH1_STORY_FLAGS.holdingOpen)) return blocked(CH1_STORY_FLAGS.holdingOpen);
  const alreadyJoined = isSet(CH1_STORY_FLAGS.fayeJoined);
  if (!alreadyJoined && !isSet(CH1_STORY_FLAGS.fayeMetSeen)) return ready('meet');
  if (!alreadyJoined && !isSet(CH1_STORY_FLAGS.fayeListenAwake)) return ready('first_listen');
  if (!alreadyJoined && !isSet(CH1_STORY_FLAGS.fayeJoinCopySeen)) return ready('join_copy');
  if (facts.fayeCount !== 1) return ready('party');
  if (facts.panCount !== 1 || !facts.panOnFaye || !facts.panEquipped) return ready('pan');
  if (!alreadyJoined && !isSet(CH1_STORY_FLAGS.fayePanSeen)) return ready('pan_presentation');
  if (!alreadyJoined) return ready('complete');
  return done();
}

export type Ch1ManagerStageId = 'manager_battle' | 'manager_after';

export function planCh1ManagerStory(isSet: (flag: string) => boolean): Chapter1StagePlan<Ch1ManagerStageId> {
  if (!isSet(CH1_STORY_FLAGS.fayeJoined)) return blocked(CH1_STORY_FLAGS.fayeJoined);
  if (!isSet(CH1_STORY_FLAGS.managerDefeated)) return ready('manager_battle');
  if (!isSet(CH1_STORY_FLAGS.managerWinSeen)) return ready('manager_after');
  return done();
}

export type Ch1MomStageId =
  | 'mom_call'
  | 'homesick_cure'
  | 'first_heartlight'
  | 'starsong_awakening'
  | 'complete'
  | 'faye_after_call'
  | 'chapter_card';

export function planCh1MomStory(
  isSet: (flag: string) => boolean,
  homesick: boolean,
): Chapter1StagePlan<Ch1MomStageId> {
  const missing = [CH1_STORY_FLAGS.managerDefeated, CH1_STORY_FLAGS.managerWinSeen].filter((flag) => !isSet(flag));
  if (missing.length > 0) return blocked(...missing);
  if (!isSet(CH1_STORY_FLAGS.momCallSeen)) return ready('mom_call');
  if (homesick) return ready('homesick_cure');
  if (!isSet(CH1_STORY_FLAGS.firstHeartlightSeen)) return ready('first_heartlight');
  if (!isSet(CH1_STORY_FLAGS.starsongAwake)) return ready('starsong_awakening');
  if (!isSet(CH1_STORY_FLAGS.complete)) return ready('complete');
  if (!isSet(CH1_STORY_FLAGS.fayeAfterCallSeen)) return ready('faye_after_call');
  if (!isSet(CH1_STORY_FLAGS.cardSeen)) return ready('chapter_card');
  return done();
}
