/**
 * Named Chapter 1 production-QA saves.
 *
 * These are durable frontiers, not loose flag bundles. Each profile owns an
 * exact party, inventory, economy, map feet, phase, audio expectation, and
 * optional real BattleScene launch. That makes a URL such as
 * `?devMap=otterbrook&devState=sentinelTurn5` reproducible after reload instead
 * of inheriting the old blanket "post Tick" developer state.
 */
import { BAG_MAX, type EquipSlot } from '../data/items';
import { CH1_WORLD, type Ch1WorldFeet } from '../data/maps_ch1';
import type { HeroId } from '../data/heroes';
import { s } from '../spritegen/scale';
import { GS, makeHeroState, type HeroState } from './state';
import {
  CH1_STORY_FLAGS,
  chapter1Phase,
  type Chapter1Phase,
} from './ch1Story';
import {
  CH1_TRAIL_FLAGS,
  CH1_TRAIL_KEY_ITEM_ID,
  type Chapter1TrailStage,
} from './ch1TrailRoute';
import type { BattleConfig } from '../scenes/BattleScene';

export const CH1_DEV_STATES = [
  'openingStart',
  'openingAfterFall',
  'houseOverview',
  'hillClimb',
  'bedroomWake',
  'preSentinel',
  'sentinelTurn2',
  'sentinelTurn5',
  'postSentinel',
  'walkHome',
  'porchPending',
  'porchRewardPending',
  'porchComplete',
  'hushMorning',
  'preTick',
  'tickBattle',
  'postTick',
  'restoredOtterbrook',
  'meadowLeg1',
  'meadowLeg2',
  'meadowLeg3',
  'meadowLeg4',
  'orientation0',
  'orientation1',
  'orientation2',
  'orientation3',
  'orientationComplete',
  'busGrandfather',
  'bricktonArrival',
  'dosF1',
  'dosF1Quota',
  'dosF2',
  'dosF2Quota',
  'dosF3',
  'dosF3BossPending',
  'dosComplete',
  'preFaye',
  'fayeFullBag',
  'postFaye',
  'preManager',
  'managerBattle',
  'postManager',
  'momCallPending',
  'heartlightPending',
  'chapterComplete',
  // Deliberately hostile recovery fixtures.
  'porchFullBag',
  'leaderDown',
  'partialParty',
  'defeatRetry',
  'staleLegacyFlags',
  'retiredLegacyMap',
  'touchMode',
  // The five Chapter 1 quest routes at useful, unfinished frontiers.
  'questBiscuit',
  'questMail',
  'questLemonade',
  'questArcade',
  'questWalkers',
] as const;

export type Chapter1DevState = (typeof CH1_DEV_STATES)[number];
export type Chapter1ExpectedFrontier =
  | `opening:${1 | 2 | 3 | 4}`
  | `crater:${'meet_glint' | 'locket' | 'sentinel_battle' | 'sentinel_after' | 'done'}`
  | `porch:${'zapper' | 'spark' | 'spark_copy' | 'awakening' | 'porch_after' | 'done'}`
  | `trail:${Chapter1TrailStage}`
  | `tick:${'tick_battle' | 'ember_commit' | 'repair_embers' | 'ember_presentation' | 'tick_after' | 'done'}`
  | `faye:${'meet' | 'first_listen' | 'join_copy' | 'party' | 'pan' | 'pan_presentation' | 'complete' | 'done'}`
  | `manager:${'manager_battle' | 'manager_after' | 'done'}`
  | `mom:${'mom_call' | 'homesick_cure' | 'first_heartlight' | 'starsong_awakening' | 'complete' | 'faye_after_call' | 'chapter_card' | 'done'}`
  | 'none';

export interface Chapter1ProfileHero {
  readonly id: Extract<HeroId, 'rex' | 'faye'>;
  readonly level: number;
  readonly bag: readonly string[];
  readonly equip: Readonly<Partial<Record<EquipSlot, string>>>;
  readonly down?: boolean;
  readonly hp?: number;
}

export interface Chapter1DevProfile {
  readonly state: Chapter1DevState;
  readonly flags: readonly string[];
  readonly party: readonly Chapter1ProfileHero[];
  readonly guest: 'chad' | null;
  readonly keyItems: readonly string[];
  readonly embers: 0 | 1;
  readonly cashOnHand: number;
  readonly banked: number;
  readonly spawn: Readonly<{ mapId: string; x: number; y: number; facing: Ch1WorldFeet['facing'] }>;
  readonly phase: Chapter1Phase;
  readonly expectedMusic: string | null;
  readonly expectedAmbience: string | null;
  readonly frontier: Chapter1ExpectedFrontier;
  readonly battle: Readonly<BattleConfig> | null;
  readonly devTouch: boolean;
  /** A retired save id fed to migration before this already-recovered profile. */
  readonly migrationSourceMap: string | null;
  readonly hazard: string | null;
}

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const without = (values: readonly string[], ...removed: readonly string[]): string[] =>
  values.filter((value) => !removed.includes(value));

const WAKE = ['op_fell', 'op_house', 'meteor_fell', 'intro_done'] as const;
const CRATER_READY = [...WAKE, 'chad_joined', 'ch1_hill_entry_warning_seen', CH1_STORY_FLAGS.metGlint] as const;
const SENTINEL_WON = [
  ...CRATER_READY,
  CH1_STORY_FLAGS.sentinelRepelled,
  CH1_STORY_FLAGS.sentinelHusk,
  CH1_STORY_FLAGS.glintWalkHome,
] as const;
const WALK_HOME = [...SENTINEL_WON, CH1_STORY_FLAGS.sentinelAfterSeen] as const;
const PORCH_REWARD = [
  ...without(WALK_HOME, CH1_STORY_FLAGS.glintWalkHome),
  CH1_STORY_FLAGS.zapperHit,
] as const;
const PORCH_DONE = [
  ...PORCH_REWARD,
  CH1_STORY_FLAGS.sparkClaimed,
  CH1_STORY_FLAGS.sparkSeen,
  CH1_STORY_FLAGS.lifeupAwake,
  CH1_STORY_FLAGS.porchAfterSeen,
] as const;
const HUSH = [...PORCH_DONE, CH1_STORY_FLAGS.zapperDone] as const;
const TRAIL_READY = [
  ...HUSH,
  'hush_dark_noticed',
  CH1_TRAIL_FLAGS.metPemberton,
  CH1_TRAIL_FLAGS.keyAsked,
  CH1_TRAIL_FLAGS.mowerCaught,
  CH1_TRAIL_FLAGS.hasKey,
  CH1_TRAIL_FLAGS.shedCrossed,
  'ch1_trail_shed_crossed_seen',
  'ch1_cave_threshold_seen',
  'ch1_oak_roots_enter_seen',
] as const;
const TICK_ENGAGED = [...TRAIL_READY, 'ch1_tick_intro_seen'] as const;
const RESTORED = [
  ...TICK_ENGAGED,
  CH1_STORY_FLAGS.tickDefeated,
  CH1_STORY_FLAGS.ember,
  CH1_STORY_FLAGS.emberSeen,
  CH1_STORY_FLAGS.tickAfterSeen,
] as const;
const BRICKTON = [...RESTORED, 'bus_ride_done', 'brickton_arrival_done', 'brickton_dial_goal'] as const;
const QUOTA = [...BRICKTON, 'dos_quota_f3a', 'dos_quota_f3b', 'dos_quota_f3c', CH1_STORY_FLAGS.holdingOpen] as const;
const FAYE = [
  ...QUOTA,
  CH1_STORY_FLAGS.fayeMetSeen,
  CH1_STORY_FLAGS.fayeListenAwake,
  CH1_STORY_FLAGS.fayeJoinCopySeen,
  CH1_STORY_FLAGS.fayePanSeen,
  CH1_STORY_FLAGS.fayeJoined,
] as const;
const MANAGER_WON = [...FAYE, CH1_STORY_FLAGS.managerDefeated] as const;
const MANAGER_DONE = [...MANAGER_WON, CH1_STORY_FLAGS.managerWinSeen] as const;
const COMPLETE = [
  ...MANAGER_DONE,
  CH1_STORY_FLAGS.momCallSeen,
  CH1_STORY_FLAGS.firstHeartlightSeen,
  CH1_STORY_FLAGS.starsongAwake,
  CH1_STORY_FLAGS.complete,
  CH1_STORY_FLAGS.fayeAfterCallSeen,
  CH1_STORY_FLAGS.cardSeen,
] as const;

const REX_START = ['cracked_bat', 'corn_dog', 'corn_dog'] as const;
const REX_SPARK = ['cracked_bat', 'corn_dog', 'corn_dog', 'glints_spark'] as const;
const REX_ROAD = ['tball_bat', 'corn_dog', 'pbj', 'salt_shaker', 'glints_spark'] as const;
const FULL_REX_BAG = [
  'cracked_bat', 'corn_dog', 'corn_dog', 'pbj', 'pbj', 'lemonade', 'lemonade',
  'salt_shaker', 'star_cola', 'star_cola', 'basket_basic', 'sugar_bag', 'fresh_stamps', 'lucky_collar',
] as const;
const FULL_REX_SPARK_BAG = [...FULL_REX_BAG.slice(0, -1), 'glints_spark'] as const;

function rex(level: number, bag: readonly string[] = REX_START, overrides: Partial<Chapter1ProfileHero> = {}): Chapter1ProfileHero {
  const weapon = bag.includes('tball_bat') ? 'tball_bat' : 'cracked_bat';
  return { id: 'rex', level, bag: [...bag], equip: { weapon }, ...overrides };
}

function faye(level = 6): Chapter1ProfileHero {
  return { id: 'faye', level, bag: ['hand_me_down_pan', 'corn_dog'], equip: { weapon: 'hand_me_down_pan' } };
}

function runtimeFeet(point: Ch1WorldFeet): Chapter1DevProfile['spawn'] {
  return Object.freeze({ mapId: point.mapId, x: s(point.x), y: s(point.y), facing: point.facing });
}

const audioFor = (point: Ch1WorldFeet): Pick<Chapter1DevProfile, 'expectedMusic' | 'expectedAmbience'> => {
  if (point.mapId === 'rex_bedroom') return { expectedMusic: null, expectedAmbience: null };
  if (point.mapId === 'oak_heart') return { expectedMusic: 'hill', expectedAmbience: 'cave' };
  if (point.mapId.startsWith('meadow_')) return { expectedMusic: 'otterbrook', expectedAmbience: null };
  if (point.mapId === 'bus_interior') return { expectedMusic: 'bus', expectedAmbience: null };
  if (point.mapId === 'brickton') return { expectedMusic: 'brickton', expectedAmbience: 'crowd' };
  if (point.mapId.startsWith('dos_f')) return { expectedMusic: 'department', expectedAmbience: 'machine' };
  return { expectedMusic: 'otterbrook', expectedAmbience: 'birds' };
};

function sentinelBattle(bossTurns: 1 | 4): BattleConfig {
  return {
    enemyIds: ['hush_sentinel'], advantage: 'none', guestChad: true,
    glintAssist: true, glintSupernova: true, boss: true, backdrop: 'crater',
    prayTutorial: false,
    devContext: { encounter: 'hush_sentinel', bossTurns, introSeen: bossTurns > 1 },
  };
}

const tickBattle = (): BattleConfig => ({
  enemyIds: ['titanic_tick'], advantage: 'none', guestChad: false,
  glintAssist: false, glintSupernova: false, boss: true, backdrop: 'oak_heart',
  prayTutorial: false,
});

const managerBattle = (): BattleConfig => ({
  enemyIds: ['the_suit', 'blazer_smiler'], advantage: 'none', guestChad: false,
  glintAssist: false, glintSupernova: false, boss: true, backdrop: 'department',
  prayTutorial: true,
});

interface ProfileSpec {
  flags: readonly string[];
  point: Ch1WorldFeet;
  party?: readonly Chapter1ProfileHero[];
  guest?: 'chad' | null;
  keyItems?: readonly string[];
  embers?: 0 | 1;
  cash?: number;
  banked?: number;
  frontier?: Chapter1ExpectedFrontier;
  battle?: BattleConfig | null;
  devTouch?: boolean;
  migrationSourceMap?: string | null;
  hazard?: string | null;
  music?: string | null;
}

function makeProfile(state: Chapter1DevState, spec: ProfileSpec): Chapter1DevProfile {
  const flags = unique(spec.flags);
  const keyItems = unique([
    ...(spec.keyItems ?? []),
    ...(flags.includes(CH1_TRAIL_FLAGS.hasKey) ? [CH1_TRAIL_KEY_ITEM_ID] : []),
  ]);
  const audio = audioFor(spec.point);
  const battle = spec.battle ?? null;
  const phase = chapter1Phase((flag) => flags.includes(flag));
  return Object.freeze({
    state,
    flags: Object.freeze(flags),
    party: Object.freeze((spec.party ?? [rex(1)]).map((hero) => Object.freeze({
      ...hero,
      bag: Object.freeze([...hero.bag]),
      equip: Object.freeze({ ...hero.equip }),
    }))),
    guest: spec.guest ?? null,
    keyItems: Object.freeze(keyItems),
    embers: spec.embers ?? 0,
    cashOnHand: spec.cash ?? 12,
    banked: spec.banked ?? 0,
    spawn: runtimeFeet(spec.point),
    phase,
    expectedMusic: battle ? 'boss' : spec.music !== undefined ? spec.music : audio.expectedMusic,
    expectedAmbience: audio.expectedAmbience,
    frontier: spec.frontier ?? 'none',
    battle: battle ? Object.freeze({ ...battle, enemyIds: Object.freeze([...battle.enemyIds]) as unknown as string[] }) : null,
    devTouch: spec.devTouch ?? false,
    migrationSourceMap: spec.migrationSourceMap ?? null,
    hazard: spec.hazard ?? null,
  });
}

function storyProfile(state: Chapter1DevState): Chapter1DevProfile {
  const P = CH1_WORLD.profiles;
  switch (state) {
    case 'openingStart':
      return makeProfile(state, { flags: [], point: P.opening, frontier: 'opening:1', music: 'starfall' });
    case 'openingAfterFall':
      return makeProfile(state, { flags: ['op_fell'], point: P.opening, frontier: 'opening:2', music: null });
    case 'houseOverview':
      return makeProfile(state, { flags: ['op_fell'], point: P.porch, frontier: 'opening:2', music: null });
    case 'hillClimb':
      return makeProfile(state, { flags: ['op_fell', 'op_house'], point: P.opening, frontier: 'opening:3', music: null });
    case 'bedroomWake':
      return makeProfile(state, { flags: ['op_fell', 'op_house'], point: P.bedroom, frontier: 'opening:4', music: null });
    case 'preSentinel':
      return makeProfile(state, { flags: CRATER_READY, point: P.crater, party: [rex(2)], guest: 'chad', keyItems: ['star_locket'], cash: 24, frontier: 'crater:sentinel_battle' });
    case 'sentinelTurn2':
      return makeProfile(state, { flags: CRATER_READY, point: P.crater, party: [rex(2)], guest: 'chad', keyItems: ['star_locket'], cash: 24, frontier: 'crater:sentinel_battle', battle: sentinelBattle(1) });
    case 'sentinelTurn5':
      return makeProfile(state, { flags: CRATER_READY, point: P.crater, party: [rex(2)], guest: 'chad', keyItems: ['star_locket'], cash: 24, frontier: 'crater:sentinel_battle', battle: sentinelBattle(4) });
    case 'postSentinel':
      return makeProfile(state, { flags: SENTINEL_WON, point: P.crater, party: [rex(3)], keyItems: ['star_locket'], cash: 36, frontier: 'crater:sentinel_after' });
    case 'walkHome':
    case 'porchPending':
      return makeProfile(state, { flags: WALK_HOME, point: P.porch, party: [rex(3)], keyItems: ['star_locket'], cash: 36, frontier: 'porch:zapper' });
    case 'porchRewardPending':
      return makeProfile(state, { flags: PORCH_REWARD, point: P.porch, party: [rex(3)], keyItems: ['star_locket'], cash: 42, frontier: 'porch:spark' });
    case 'porchFullBag':
      return makeProfile(state, { flags: PORCH_REWARD, point: P.porch, party: [rex(3, FULL_REX_BAG)], keyItems: ['star_locket'], cash: 42, frontier: 'porch:spark', hazard: 'full 14-slot bag blocks a unique pending reward without losing it' });
    case 'porchComplete':
      return makeProfile(state, { flags: PORCH_DONE, point: P.porch, party: [rex(3, REX_SPARK)], keyItems: ['star_locket'], cash: 48, frontier: 'porch:done' });
    case 'hushMorning':
      return makeProfile(state, { flags: HUSH, point: P.bedroom, party: [rex(4, REX_SPARK)], keyItems: ['star_locket'], cash: 54, frontier: 'trail:pemberton' });
    case 'preTick':
      return makeProfile(state, { flags: TRAIL_READY, point: P.tickCave, party: [rex(5, REX_ROAD)], keyItems: ['star_locket'], cash: 62, frontier: 'tick:tick_battle' });
    case 'tickBattle':
      return makeProfile(state, { flags: TICK_ENGAGED, point: P.tickCave, party: [rex(5, REX_ROAD)], keyItems: ['star_locket'], cash: 62, frontier: 'tick:tick_battle', battle: tickBattle() });
    case 'postTick':
      return makeProfile(state, { flags: [...TICK_ENGAGED, CH1_STORY_FLAGS.tickDefeated], point: P.tickCave, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], cash: 86, frontier: 'tick:ember_commit' });
    case 'restoredOtterbrook':
      return makeProfile(state, { flags: RESTORED, point: P.porch, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 96, frontier: 'tick:done' });
    case 'meadowLeg1':
      return makeProfile(state, { flags: RESTORED, point: P.meadowMile, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 110 });
    case 'meadowLeg2':
      return makeProfile(state, { flags: RESTORED, point: P.meadowWoods, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 118 });
    case 'meadowLeg3':
      return makeProfile(state, { flags: [...RESTORED, 'woods_vignette_done'], point: P.meadowFar, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 126 });
    case 'meadowLeg4':
      return makeProfile(state, { flags: [...RESTORED, 'woods_vignette_done'], point: P.meadowOverpass, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 134 });
    case 'orientation0':
    case 'orientation1':
    case 'orientation2':
    case 'orientation3': {
      const won = Number(state.slice(-1));
      const flags = [...RESTORED, 'woods_vignette_done', 'city_reveal_done'];
      for (let round = 1; round <= won; round++) flags.push(`orient_${round}`);
      return makeProfile(state, { flags, point: P.orientation, party: [rex(7, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 142 + won * 8 });
    }
    case 'orientationComplete':
      return makeProfile(state, { flags: [...RESTORED, 'woods_vignette_done', 'city_reveal_done', 'orient_1', 'orient_2', 'orient_3', 'visitor_badge', 'brickton_arrival_done', 'brickton_foot_first'], point: P.bricktonArrival, party: [rex(7, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 174 });
    case 'busGrandfather':
      return makeProfile(state, { flags: [...RESTORED, 'bus_ride_done', 'city_reveal_done'], point: P.orientation, party: [rex(7, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 174 });
    case 'bricktonArrival':
      return makeProfile(state, { flags: [...RESTORED, 'bus_ride_done'], point: P.bricktonArrival, party: [rex(7, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 180 });
    case 'dosF1':
    case 'dosF1Quota':
      return makeProfile(state, { flags: BRICKTON, point: P.dosF1, party: [rex(8, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 220, hazard: state === 'dosF1Quota' ? 'floor-one patrol retry survey' : null });
    case 'dosF2':
    case 'dosF2Quota':
      return makeProfile(state, { flags: BRICKTON, point: P.dosF2, party: [rex(8, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 236, hazard: state === 'dosF2Quota' ? 'floor-two pack retry survey' : null });
    case 'dosF3':
      return makeProfile(state, { flags: BRICKTON, point: P.dosF3, party: [rex(8, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 248 });
    case 'preFaye':
      return makeProfile(state, { flags: QUOTA, point: P.faye, party: [rex(8, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 272, frontier: 'faye:meet' });
    case 'fayeFullBag':
      return makeProfile(state, { flags: QUOTA, point: P.faye, party: [rex(8, FULL_REX_SPARK_BAG)], keyItems: ['star_locket'], embers: 1, cash: 272, frontier: 'faye:meet', hazard: 'full 14-slot leader bag during the exact party/pan transaction' });
    case 'postFaye':
    case 'preManager':
    case 'dosF3BossPending':
      return makeProfile(state, { flags: FAYE, point: state === 'postFaye' ? P.faye : P.manager, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 286, frontier: 'manager:manager_battle' });
    case 'managerBattle':
      return makeProfile(state, { flags: FAYE, point: P.manager, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 286, frontier: 'manager:manager_battle', battle: managerBattle() });
    case 'postManager':
      return makeProfile(state, { flags: MANAGER_WON, point: P.manager, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 330, frontier: 'manager:manager_after' });
    case 'dosComplete':
      return makeProfile(state, { flags: MANAGER_DONE, point: P.dosF1, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 330, frontier: 'manager:done' });
    case 'momCallPending':
      return makeProfile(state, { flags: [...MANAGER_DONE, 'rex_homesick'], point: P.payphone, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 330, frontier: 'mom:mom_call' });
    case 'heartlightPending':
      return makeProfile(state, { flags: [...MANAGER_DONE, CH1_STORY_FLAGS.momCallSeen], point: P.payphone, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 330, frontier: 'mom:first_heartlight' });
    case 'chapterComplete':
      return makeProfile(state, { flags: COMPLETE, point: P.payphone, party: [rex(8, REX_ROAD), faye()], keyItems: ['star_locket'], embers: 1, cash: 360, frontier: 'mom:done' });
    case 'leaderDown':
      return makeProfile(state, { flags: FAYE, point: P.manager, party: [rex(8, REX_ROAD, { down: true, hp: 0 }), faye()], keyItems: ['star_locket'], embers: 1, cash: 286, frontier: 'manager:manager_battle', hazard: 'leader down with a healthy second hero' });
    case 'partialParty':
      return makeProfile(state, { flags: [...QUOTA, CH1_STORY_FLAGS.fayeMetSeen, CH1_STORY_FLAGS.fayeListenAwake, CH1_STORY_FLAGS.fayeJoinCopySeen], point: P.faye, party: [rex(8, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 272, frontier: 'faye:party', hazard: 'interrupted join with a partial party' });
    case 'defeatRetry':
      return makeProfile(state, { flags: TICK_ENGAGED, point: P.tickCave, party: [rex(5, REX_ROAD, { hp: 1 })], keyItems: ['star_locket'], embers: 0, cash: 62, frontier: 'tick:tick_battle', hazard: 'one-HP retry on the Hickory Hill cave arena trigger' });
    case 'staleLegacyFlags':
      return makeProfile(state, { flags: [...TRAIL_READY, 'glint_dead', 'meteor_seen', 'tick_done'], point: P.tickCave, party: [rex(5, ['cracked_bat', 'glints_spark'])], keyItems: ['star_locket', 'star_locket'], embers: 0, cash: 62, frontier: 'tick:tick_battle', hazard: 'pre-overhaul aliases normalized at the Hickory Hill cave arena' });
    case 'retiredLegacyMap':
      return makeProfile(state, { flags: RESTORED, point: CH1_WORLD.recovery, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 96, frontier: 'tick:done', migrationSourceMap: 'downtown_otterbrook', hazard: 'v27 retired-map recovery fixture' });
    case 'touchMode':
      return makeProfile(state, { flags: RESTORED, point: P.porch, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 96, frontier: 'tick:done', devTouch: true, hazard: 'force the real touch overlay with devTouch=1' });
    case 'questBiscuit':
      return makeProfile(state, { flags: [...RESTORED, 'q_biscuit', 'q_biscuit_c1'], point: P.porch, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 96 });
    case 'questMail':
      return makeProfile(state, { flags: [...RESTORED, 'q_mail', 'q_mail_pickles', 'q_mail_sodd'], point: P.porch, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 96 });
    case 'questLemonade':
      return makeProfile(state, { flags: [...RESTORED, 'q_lemonade', 'q_lem_sugar', 'q_lem_water'], point: P.porch, party: [rex(6, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 96 });
    case 'questArcade':
      return makeProfile(state, { flags: [...BRICKTON, 'q_arcade'], point: P.brickton, party: [rex(8, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 220 });
    case 'questWalkers':
      return makeProfile(state, { flags: [...RESTORED, 'q_walkreg', 'q_walkreg_mile', 'q_walkreg_woods'], point: P.meadowFar, party: [rex(7, REX_ROAD)], keyItems: ['star_locket'], embers: 1, cash: 142 });
  }
}

/** Unknown names deliberately resolve to a useful restored-town survey state. */
export function chapter1DevProfile(value: string | null): Chapter1DevProfile {
  const state = CH1_DEV_STATES.includes(value as Chapter1DevState)
    ? value as Chapter1DevState
    : 'restoredOtterbrook';
  return storyProfile(state);
}

/** Install exact serializable records. No state from a previous dev boot leaks in. */
export function installChapter1DevProfile(profile: Chapter1DevProfile): void {
  GS.reset();
  GS.data.flags = Object.fromEntries(profile.flags.map((flag) => [flag, true]));
  GS.data.party = profile.party.map((spec) => {
    const hero: HeroState = makeHeroState(spec.id, spec.level, GS.data.heroNames[spec.id]);
    hero.bag = [...spec.bag];
    hero.equip = { ...spec.equip };
    if (spec.hp !== undefined) hero.hp = Math.max(0, Math.min(spec.hp, hero.maxHp));
    hero.down = spec.down ?? hero.hp <= 0;
    if (hero.down) hero.hp = 0;
    return hero;
  });
  GS.data.guest = profile.guest;
  GS.data.keyItems = [...profile.keyItems];
  GS.data.embers = profile.embers;
  GS.data.cashOnHand = profile.cashOnHand;
  GS.data.banked = profile.banked;
  GS.data.pendingDeposit = 0;
  GS.data.map = profile.spawn.mapId;
  GS.data.x = profile.spawn.x;
  GS.data.y = profile.spawn.y;
  GS.data.facing = profile.spawn.facing;
  if (profile.migrationSourceMap) {
    // Exercise the published-save path rather than merely imitating its result.
    // v26 may contain a removed map and arbitrary obsolete coordinates; v27 must
    // preserve every other exact record while replacing all four world fields.
    const legacy = JSON.parse(GS.serialize()) as Record<string, unknown>;
    legacy.version = 26;
    legacy.map = profile.migrationSourceMap;
    legacy.x = -999_999;
    legacy.y = 999_999;
    legacy.facing = 'left';
    GS.deserialize(JSON.stringify(legacy));
  }
}

export function chapter1DevBattleConfig(profile: Chapter1DevProfile): BattleConfig | null {
  if (!profile.battle) return null;
  return {
    ...profile.battle,
    enemyIds: [...profile.battle.enemyIds],
    devContext: profile.battle.devContext ? { ...profile.battle.devContext } : undefined,
  };
}

export const CH1_REQUIRED_DEV_PROFILE_COUNT = 45;
export const CH1_PROFILE_BAG_LIMIT = BAG_MAX;
