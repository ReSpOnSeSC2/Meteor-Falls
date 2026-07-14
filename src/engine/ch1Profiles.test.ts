import { afterEach, describe, expect, it } from 'vitest';
import {
  NPC_FOOTPRINT,
  PLAYER_FOOTPRINT,
  characterFeet,
  footRect,
  npcEffectiveScale,
  type Rect,
} from './actor-collision';
import { aabbOverlap } from './movecollide';
import { CHAR_LEGEND, MAPS, carveHoldingRoom, type PropDef } from '../data/maps';
import { TILESET } from '../spritegen/tiles';
import { ART_SCALE, s } from '../spritegen/scale';
import { BAG_MAX } from '../data/items';
import { CH1_RETIRED_MAP_IDS, CH1_WORLD } from '../data/maps_ch1';
import { chapter1Phase, planCh1CraterStory, planCh1FayeStory, planCh1ManagerStory, planCh1MomStory, planCh1PorchStory, planCh1TickStory } from './ch1Story';
import { CH1_TRAIL_FLAGS, CH1_TRAIL_KEY_ITEM_ID, chapter1TrailStage } from './ch1TrailRoute';
import { openingPhase } from './opening';
import { CURRENT_SAVE_VERSION } from './migrations';
import { GS } from './state';
import {
  CH1_DEV_STATES,
  CH1_PROFILE_BAG_LIMIT,
  CH1_REQUIRED_DEV_PROFILE_COUNT,
  chapter1DevBattleConfig,
  chapter1DevProfile,
  installChapter1DevProfile,
  type Chapter1DevProfile,
  type Chapter1DevState,
  type Chapter1ExpectedFrontier,
} from './ch1Profiles';

const WAKE = ['op_fell', 'op_house', 'meteor_fell', 'intro_done'] as const;
const CRATER_READY = [...WAKE, 'chad_joined', 'ch1_hill_entry_warning_seen', 'met_glint'] as const;
const SENTINEL_WON = [...CRATER_READY, 'sentinel_repelled', 'sentinel_husk_left', 'glint_walk_home'] as const;
const WALK_HOME = [...SENTINEL_WON, 'ch1_sentinel_after_seen'] as const;
const PORCH_REWARD = [
  ...SENTINEL_WON.filter((flag) => flag !== 'glint_walk_home'),
  'ch1_sentinel_after_seen',
  'zapper_hit',
] as const;
const PORCH_DONE = [
  ...PORCH_REWARD,
  'ch1_glints_spark_claimed',
  'ch1_glints_spark_seen',
  'awake_lifeup_a',
  'ch1_porch_after_seen',
] as const;
const HUSH = [...PORCH_DONE, 'zapper_done'] as const;
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
const RESTORED = [...TICK_ENGAGED, 'tick_defeated', 'ember1', 'ch1_ember1_seen', 'ch1_tick_after_seen'] as const;
const BRICKTON = [...RESTORED, 'bus_ride_done', 'brickton_arrival_done', 'brickton_dial_goal'] as const;
const QUOTA = [...BRICKTON, 'dos_quota_f3a', 'dos_quota_f3b', 'dos_quota_f3c', 'holding_open'] as const;
const FAYE = [
  ...QUOTA,
  'ch1_faye_met_seen',
  'awake_fire_a',
  'ch1_faye_join_copy_seen',
  'ch1_faye_pan_seen',
  'faye_joined',
] as const;
const MANAGER_WON = [...FAYE, 'manager_defeated'] as const;
const MANAGER_DONE = [...MANAGER_WON, 'ch1_manager_win_seen'] as const;
const COMPLETE = [
  ...MANAGER_DONE,
  'ch1_mom_call_seen',
  'ch1_first_heartlight_seen',
  'awake_starsong_a',
  'ch1_complete',
  'ch1_faye_after_call_seen',
  'ch1_card_seen',
] as const;

const REX_START = ['cracked_bat', 'corn_dog', 'corn_dog'] as const;
const REX_SPARK = [...REX_START, 'glints_spark'] as const;
const REX_ROAD = ['tball_bat', 'corn_dog', 'pbj', 'salt_shaker', 'glints_spark'] as const;
const FULL_REX_BAG = [
  'cracked_bat',
  'corn_dog',
  'corn_dog',
  'pbj',
  'pbj',
  'lemonade',
  'lemonade',
  'salt_shaker',
  'star_cola',
  'star_cola',
  'basket_basic',
  'sugar_bag',
  'fresh_stamps',
  'lucky_collar',
] as const;
const FULL_POST_SPARK_BAG = [...FULL_REX_BAG.slice(0, -1), 'glints_spark'] as const;
const FAYE_BAG = ['hand_me_down_pan', 'corn_dog'] as const;

type PointId =
  | 'bedroom'
  | 'opening'
  | 'crater'
  | 'porch'
  | 'tickCave'
  | 'meadowMile'
  | 'meadowWoods'
  | 'meadowFar'
  | 'meadowOverpass'
  | 'orientation'
  | 'brickton'
  | 'bricktonArrival'
  | 'dosF1'
  | 'dosF2'
  | 'dosF3'
  | 'faye'
  | 'manager'
  | 'payphone'
  | 'recovery';

type Facing = 'down' | 'left' | 'right' | 'up';
interface NativePoint {
  readonly mapId: string;
  readonly tileX: number;
  readonly tileY: number;
  readonly facing: Facing;
}

/** Literal authoring coordinates: do not derive profile expectations from CH1_WORLD. */
const POINTS: Readonly<Record<PointId, NativePoint>> = {
  bedroom: { mapId: 'rex_bedroom', tileX: 4, tileY: 5, facing: 'down' },
  opening: { mapId: 'otterbrook', tileX: 75, tileY: 13, facing: 'down' },
  crater: { mapId: 'otterbrook', tileX: 68, tileY: 10, facing: 'right' },
  porch: { mapId: 'otterbrook', tileX: 49, tileY: 57, facing: 'up' },
  tickCave: { mapId: 'oak_heart', tileX: 14, tileY: 10, facing: 'up' },
  meadowMile: { mapId: 'meadow_mile', tileX: 7, tileY: 3, facing: 'down' },
  meadowWoods: { mapId: 'meadow_woods', tileX: 7, tileY: 3, facing: 'down' },
  meadowFar: { mapId: 'meadow_far', tileX: 6, tileY: 3, facing: 'down' },
  meadowOverpass: { mapId: 'meadow_overpass', tileX: 8, tileY: 3, facing: 'down' },
  orientation: { mapId: 'meadow_overpass', tileX: 8, tileY: 30, facing: 'down' },
  brickton: { mapId: 'brickton', tileX: 48, tileY: 18, facing: 'down' },
  bricktonArrival: { mapId: 'brickton', tileX: 74, tileY: 3, facing: 'down' },
  dosF1: { mapId: 'dos_f1', tileX: 20, tileY: 24, facing: 'up' },
  dosF2: { mapId: 'dos_f2', tileX: 4, tileY: 3, facing: 'down' },
  dosF3: { mapId: 'dos_f3', tileX: 39, tileY: 3, facing: 'down' },
  faye: { mapId: 'dos_f3', tileX: 10, tileY: 6, facing: 'left' },
  manager: { mapId: 'dos_f3', tileX: 28, tileY: 4, facing: 'right' },
  payphone: { mapId: 'brickton', tileX: 57, tileY: 20, facing: 'right' },
  recovery: { mapId: 'otterbrook', tileX: 56, tileY: 100, facing: 'down' },
};

type BagId = 'start' | 'spark' | 'road' | 'fullPending' | 'fullSpark' | 'stale';
const BAGS: Readonly<Record<BagId, readonly string[]>> = {
  start: REX_START,
  spark: REX_SPARK,
  road: REX_ROAD,
  fullPending: FULL_REX_BAG,
  fullSpark: FULL_POST_SPARK_BAG,
  // Stale aliases are the hazard. Unique physical rewards still remain unique.
  stale: ['cracked_bat', 'glints_spark'],
};

interface ExpectedProfile {
  readonly state: Chapter1DevState;
  readonly flags: readonly string[];
  readonly point: PointId;
  readonly rexLevel: number;
  readonly rexBag: BagId;
  readonly cash: number;
  readonly embers: 0 | 1;
  readonly frontier: Chapter1ExpectedFrontier;
  readonly faye?: true;
  readonly guest?: 'chad';
  readonly noLocket?: true;
  readonly down?: true;
  readonly hp?: number;
}

const row = (
  state: Chapter1DevState,
  flags: readonly string[],
  point: PointId,
  rexLevel: number,
  rexBag: BagId,
  cash: number,
  embers: 0 | 1,
  frontier: Chapter1ExpectedFrontier = 'none',
  extra: Omit<ExpectedProfile, 'state' | 'flags' | 'point' | 'rexLevel' | 'rexBag' | 'cash' | 'embers' | 'frontier'> = {},
): ExpectedProfile => ({ state, flags, point, rexLevel, rexBag, cash, embers, frontier, ...extra });

/**
 * Every exported profile is pinned here. Shared arrays express durable story
 * transactions, while each row independently owns its exact frontier and data.
 */
const EXPECTED: readonly ExpectedProfile[] = [
  row('openingStart', [], 'opening', 1, 'start', 12, 0, 'opening:1', { noLocket: true }),
  row('openingAfterFall', ['op_fell'], 'opening', 1, 'start', 12, 0, 'opening:2', { noLocket: true }),
  row('houseOverview', ['op_fell'], 'porch', 1, 'start', 12, 0, 'opening:2', { noLocket: true }),
  row('hillClimb', ['op_fell', 'op_house'], 'opening', 1, 'start', 12, 0, 'opening:3', { noLocket: true }),
  row('bedroomWake', ['op_fell', 'op_house'], 'bedroom', 1, 'start', 12, 0, 'opening:4', { noLocket: true }),
  row('preSentinel', CRATER_READY, 'crater', 2, 'start', 24, 0, 'crater:sentinel_battle', { guest: 'chad' }),
  row('sentinelTurn2', CRATER_READY, 'crater', 2, 'start', 24, 0, 'crater:sentinel_battle', { guest: 'chad' }),
  row('sentinelTurn5', CRATER_READY, 'crater', 2, 'start', 24, 0, 'crater:sentinel_battle', { guest: 'chad' }),
  row('postSentinel', SENTINEL_WON, 'crater', 3, 'start', 36, 0, 'crater:sentinel_after'),
  row('walkHome', WALK_HOME, 'porch', 3, 'start', 36, 0, 'porch:zapper'),
  row('porchPending', WALK_HOME, 'porch', 3, 'start', 36, 0, 'porch:zapper'),
  row('porchRewardPending', PORCH_REWARD, 'porch', 3, 'start', 42, 0, 'porch:spark'),
  row('porchComplete', PORCH_DONE, 'porch', 3, 'spark', 48, 0, 'porch:done'),
  row('hushMorning', HUSH, 'bedroom', 4, 'spark', 54, 0, 'trail:pemberton'),
  row('preTick', TRAIL_READY, 'tickCave', 5, 'road', 62, 0, 'tick:tick_battle'),
  row('tickBattle', TICK_ENGAGED, 'tickCave', 5, 'road', 62, 0, 'tick:tick_battle'),
  row('postTick', [...TICK_ENGAGED, 'tick_defeated'], 'tickCave', 6, 'road', 86, 0, 'tick:ember_commit'),
  row('restoredOtterbrook', RESTORED, 'porch', 6, 'road', 96, 1, 'tick:done'),
  row('meadowLeg1', RESTORED, 'meadowMile', 6, 'road', 110, 1),
  row('meadowLeg2', RESTORED, 'meadowWoods', 6, 'road', 118, 1),
  row('meadowLeg3', [...RESTORED, 'woods_vignette_done'], 'meadowFar', 6, 'road', 126, 1),
  row('meadowLeg4', [...RESTORED, 'woods_vignette_done'], 'meadowOverpass', 6, 'road', 134, 1),
  row('orientation0', [...RESTORED, 'woods_vignette_done', 'city_reveal_done'], 'orientation', 7, 'road', 142, 1),
  row('orientation1', [...RESTORED, 'woods_vignette_done', 'city_reveal_done', 'orient_1'], 'orientation', 7, 'road', 150, 1),
  row('orientation2', [...RESTORED, 'woods_vignette_done', 'city_reveal_done', 'orient_1', 'orient_2'], 'orientation', 7, 'road', 158, 1),
  row('orientation3', [...RESTORED, 'woods_vignette_done', 'city_reveal_done', 'orient_1', 'orient_2', 'orient_3'], 'orientation', 7, 'road', 166, 1),
  row('orientationComplete', [...RESTORED, 'woods_vignette_done', 'city_reveal_done', 'orient_1', 'orient_2', 'orient_3', 'visitor_badge', 'brickton_arrival_done', 'brickton_foot_first'], 'bricktonArrival', 7, 'road', 174, 1),
  row('busGrandfather', [...RESTORED, 'bus_ride_done', 'city_reveal_done'], 'orientation', 7, 'road', 174, 1),
  row('bricktonArrival', [...RESTORED, 'bus_ride_done'], 'bricktonArrival', 7, 'road', 180, 1),
  row('dosF1', BRICKTON, 'dosF1', 8, 'road', 220, 1),
  row('dosF1Quota', BRICKTON, 'dosF1', 8, 'road', 220, 1),
  row('dosF2', BRICKTON, 'dosF2', 8, 'road', 236, 1),
  row('dosF2Quota', BRICKTON, 'dosF2', 8, 'road', 236, 1),
  row('dosF3', BRICKTON, 'dosF3', 8, 'road', 248, 1),
  row('dosF3BossPending', FAYE, 'manager', 8, 'road', 286, 1, 'manager:manager_battle', { faye: true }),
  row('dosComplete', MANAGER_DONE, 'dosF1', 8, 'road', 330, 1, 'manager:done', { faye: true }),
  row('preFaye', QUOTA, 'faye', 8, 'road', 272, 1, 'faye:meet'),
  row('fayeFullBag', QUOTA, 'faye', 8, 'fullSpark', 272, 1, 'faye:meet'),
  row('postFaye', FAYE, 'faye', 8, 'road', 286, 1, 'manager:manager_battle', { faye: true }),
  row('preManager', FAYE, 'manager', 8, 'road', 286, 1, 'manager:manager_battle', { faye: true }),
  row('managerBattle', FAYE, 'manager', 8, 'road', 286, 1, 'manager:manager_battle', { faye: true }),
  row('postManager', MANAGER_WON, 'manager', 8, 'road', 330, 1, 'manager:manager_after', { faye: true }),
  row('momCallPending', [...MANAGER_DONE, 'rex_homesick'], 'payphone', 8, 'road', 330, 1, 'mom:mom_call', { faye: true }),
  row('heartlightPending', [...MANAGER_DONE, 'ch1_mom_call_seen'], 'payphone', 8, 'road', 330, 1, 'mom:first_heartlight', { faye: true }),
  row('chapterComplete', COMPLETE, 'payphone', 8, 'road', 360, 1, 'mom:done', { faye: true }),
  row('porchFullBag', PORCH_REWARD, 'porch', 3, 'fullPending', 42, 0, 'porch:spark'),
  row('leaderDown', FAYE, 'manager', 8, 'road', 286, 1, 'manager:manager_battle', { faye: true, down: true, hp: 0 }),
  row('partialParty', [...QUOTA, 'ch1_faye_met_seen', 'awake_fire_a', 'ch1_faye_join_copy_seen'], 'faye', 8, 'road', 272, 1, 'faye:party'),
  row('defeatRetry', TICK_ENGAGED, 'tickCave', 5, 'road', 62, 0, 'tick:tick_battle', { hp: 1 }),
  row('staleLegacyFlags', [...TRAIL_READY, 'glint_dead', 'meteor_seen', 'tick_done'], 'tickCave', 5, 'stale', 62, 0, 'tick:tick_battle'),
  row('retiredLegacyMap', RESTORED, 'recovery', 6, 'road', 96, 1, 'tick:done'),
  row('touchMode', RESTORED, 'porch', 6, 'road', 96, 1, 'tick:done'),
  row('questBiscuit', [...RESTORED, 'q_biscuit', 'q_biscuit_c1'], 'porch', 6, 'road', 96, 1),
  row('questMail', [...RESTORED, 'q_mail', 'q_mail_pickles', 'q_mail_sodd'], 'porch', 6, 'road', 96, 1),
  row('questLemonade', [...RESTORED, 'q_lemonade', 'q_lem_sugar', 'q_lem_water'], 'porch', 6, 'road', 96, 1),
  row('questArcade', [...BRICKTON, 'q_arcade'], 'brickton', 8, 'road', 220, 1),
  row('questWalkers', [...RESTORED, 'q_walkreg', 'q_walkreg_mile', 'q_walkreg_woods'], 'meadowFar', 7, 'road', 142, 1),
] as const;

const METEOR_NIGHT = new Set<Chapter1DevState>([
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
  'porchFullBag',
]);
const HUSH_MORNING = new Set<Chapter1DevState>([
  'hushMorning',
  'preTick',
  'tickBattle',
  'defeatRetry',
  'staleLegacyFlags',
]);

function expectedPhase(state: Chapter1DevState): Chapter1DevProfile['phase'] {
  if (state === 'chapterComplete') return 'chapter-complete';
  if (METEOR_NIGHT.has(state)) return 'meteor-night';
  if (HUSH_MORNING.has(state)) return 'hush-morning';
  return 'restored-day';
}

function expectedMusic(state: Chapter1DevState, mapId: string, battle: boolean): string | null {
  if (battle) return 'boss';
  if (state === 'openingStart') return 'starfall';
  if (['openingAfterFall', 'houseOverview', 'hillClimb'].includes(state)) return null;
  return MAPS[mapId].music;
}

function runtimePoint(point: NativePoint): Chapter1DevProfile['spawn'] {
  return {
    mapId: point.mapId,
    x: s(point.tileX * 16 + 8),
    y: s(point.tileY * 16 + 12),
    facing: point.facing,
  };
}

function itemCount(profile: Chapter1DevProfile, itemId: string): number {
  return profile.party.reduce((sum, hero) => sum + hero.bag.filter((id) => id === itemId).length, 0)
    + profile.keyItems.filter((id) => id === itemId).length;
}

function fayeFacts(profile: Chapter1DevProfile) {
  const fayes = profile.party.filter((hero) => hero.id === 'faye');
  const panCount = profile.party.reduce(
    (sum, hero) => sum + hero.bag.filter((item) => item === 'hand_me_down_pan').length,
    0,
  );
  return {
    fayeCount: fayes.length,
    panCount,
    panOnFaye: fayes.some((hero) => hero.bag.includes('hand_me_down_pan')),
    panEquipped: fayes.some((hero) => hero.equip.weapon === 'hand_me_down_pan'),
  };
}

function plannerStage(profile: Chapter1DevProfile, domain: string): string {
  const flags = new Set(profile.flags);
  const isSet = (flag: string): boolean => flags.has(flag);
  if (domain === 'crater') {
    const plan = planCh1CraterStory(isSet, profile.keyItems.filter((item) => item === 'star_locket').length);
    return plan.status === 'done' ? 'done' : plan.stage?.id ?? 'blocked';
  }
  if (domain === 'porch') {
    const plan = planCh1PorchStory(isSet, itemCount(profile, 'glints_spark'));
    return plan.status === 'done' ? 'done' : plan.stage?.id ?? 'blocked';
  }
  if (domain === 'trail') return chapter1TrailStage(isSet, profile.keyItems);
  if (domain === 'tick') {
    const plan = planCh1TickStory(isSet, profile.embers);
    return plan.status === 'done' ? 'done' : plan.stage?.id ?? 'blocked';
  }
  if (domain === 'faye') {
    const plan = planCh1FayeStory(isSet, fayeFacts(profile));
    return plan.status === 'done' ? 'done' : plan.stage?.id ?? 'blocked';
  }
  if (domain === 'manager') {
    const plan = planCh1ManagerStory(isSet);
    return plan.status === 'done' ? 'done' : plan.stage?.id ?? 'blocked';
  }
  if (domain === 'mom') {
    const plan = planCh1MomStory(isSet, flags.has('rex_homesick'));
    return plan.status === 'done' ? 'done' : plan.stage?.id ?? 'blocked';
  }
  throw new Error(`unknown Chapter 1 planner domain ${domain}`);
}

const solidByTileName = new Map(TILESET.map((tile) => [tile.name, tile.solid]));
const isSolidChar = (ch: string): boolean =>
  ch !== ':' && ch !== 'r' && solidByTileName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

function visibleInPhase(def: { ifFlag?: string; unlessFlag?: string }, flags: ReadonlySet<string>): boolean {
  return (!def.ifFlag || flags.has(def.ifFlag)) && (!def.unlessFlag || !flags.has(def.unlessFlag));
}

function propSolids(prop: PropDef): Rect[] {
  const sx = typeof prop.scale === 'number' ? prop.scale : prop.scale?.x ?? 1;
  const sy = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
  return (prop.solidParts ?? (prop.solid ? [prop.solid] : [])).map((part) => ({
    x: prop.x * 16 + part.ox * sx,
    y: prop.y * 16 + part.oy * sy,
    w: part.w * sx,
    h: part.h * sy,
  }));
}

function playerBodyIsClear(profile: Chapter1DevProfile): boolean {
  const map = MAPS[profile.spawn.mapId];
  if (!map) return false;
  const flags = new Set(profile.flags);
  const grid = map.id === 'dos_f3' && flags.has('holding_open') ? carveHoldingRoom(map.grid) : map.grid;
  const feet = { x: profile.spawn.x / ART_SCALE, y: profile.spawn.y / ART_SCALE };
  const body = footRect(feet, PLAYER_FOOTPRINT);
  const x0 = Math.floor(body.x / 16);
  const y0 = Math.floor(body.y / 16);
  const x1 = Math.floor((body.x + body.w) / 16);
  const y1 = Math.floor((body.y + body.h) / 16);
  const levelGrid = map.elevation?.level;
  const feetX = Math.floor(feet.x / 16);
  const feetY = Math.floor(feet.y / 16);
  const playerLevel = Number(levelGrid?.[feetY]?.[feetX] ?? '0') || 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (y < 0 || x < 0 || y >= grid.length || x >= grid[0].length || isSolidChar(grid[y][x])) return false;
      const level = Number(levelGrid?.[y]?.[x] ?? '0') || 0;
      if (levelGrid && level !== playerLevel && grid[y][x] !== 'T') return false;
    }
  }
  const activeProps = map.props
    .filter((prop) => visibleInPhase(prop, flags))
    .filter((prop) => !(prop.sprite === 'holding_door' && flags.has('holding_open')))
    .flatMap(propSolids);
  if (activeProps.some((solid) => aabbOverlap(body, solid))) return false;
  const activeNpcBodies = map.npcs
    .filter((npc) => visibleInPhase(npc, flags))
    .map((npc) => footRect(
      characterFeet(npc.x, npc.y),
      NPC_FOOTPRINT,
      npcEffectiveScale(map.id, npc.dog === true, npc.scale),
    ));
  return !activeNpcBodies.some((npcBody) => aabbOverlap(body, npcBody));
}

function exactCoreState(profile: Chapter1DevProfile): object {
  return {
    flags: GS.data.flags,
    party: GS.data.party.map((hero) => ({
      id: hero.id,
      level: hero.level,
      hp: hero.hp,
      maxHp: hero.maxHp,
      pp: hero.pp,
      maxPp: hero.maxPp,
      down: hero.down,
      bag: hero.bag,
      equip: hero.equip,
    })),
    guest: GS.data.guest,
    keyItems: GS.data.keyItems,
    embers: GS.data.embers,
    cashOnHand: GS.data.cashOnHand,
    banked: GS.data.banked,
    pendingDeposit: GS.data.pendingDeposit,
    map: GS.data.map,
    x: GS.data.x,
    y: GS.data.y,
    facing: GS.data.facing,
    profile: profile.state,
  };
}

afterEach(() => GS.reset());

describe('Chapter 1 developer profile roster', () => {
  it('covers all 45 required states plus seven hazards and five quest frontiers exactly once', () => {
    expect(CH1_REQUIRED_DEV_PROFILE_COUNT).toBe(45);
    expect(CH1_DEV_STATES).toHaveLength(57);
    expect(new Set(CH1_DEV_STATES).size).toBe(57);
    expect(EXPECTED.map((entry) => entry.state)).toEqual([...CH1_DEV_STATES]);
    expect(CH1_PROFILE_BAG_LIMIT).toBe(BAG_MAX);
  });

  it('falls back deterministically without inventing a loose profile', () => {
    expect(chapter1DevProfile(null).state).toBe('restoredOtterbrook');
    expect(chapter1DevProfile('not-a-real-frontier').state).toBe('restoredOtterbrook');
  });

  it('presents the Hush briefing only at the real morning frontier', () => {
    expect(chapter1DevProfile('hushMorning').flags).not.toContain('hush_dark_noticed');
    for (const state of ['preTick', 'tickBattle', 'postTick', 'restoredOtterbrook'] as const) {
      expect(chapter1DevProfile(state).flags, state).toContain('hush_dark_noticed');
    }
  });
});

describe.each(EXPECTED)('Chapter 1 profile $state', (expected) => {
  const profile = (): Chapter1DevProfile => chapter1DevProfile(expected.state);

  it('pins exact flags, party records, inventory, equipment, level, economy, Ember, and feet', () => {
    const actual = profile();
    const rexWeapon = BAGS[expected.rexBag].includes('tball_bat') ? 'tball_bat' : 'cracked_bat';
    expect(actual.state).toBe(expected.state);
    expect(actual.flags).toEqual(expected.flags);
    expect(new Set(actual.flags).size).toBe(actual.flags.length);
    expect(actual.party.map((hero) => hero.id)).toEqual(expected.faye ? ['rex', 'faye'] : ['rex']);
    expect(actual.party[0]).toEqual({
      id: 'rex',
      level: expected.rexLevel,
      bag: [...BAGS[expected.rexBag]],
      equip: { weapon: rexWeapon },
      ...(expected.down ? { down: true } : {}),
      ...(expected.hp !== undefined ? { hp: expected.hp } : {}),
    });
    if (expected.faye) {
      expect(actual.party[1]).toEqual({
        id: 'faye',
        level: 6,
        bag: [...FAYE_BAG],
        equip: { weapon: 'hand_me_down_pan' },
      });
    }
    expect(actual.guest).toBe(expected.guest ?? null);
    expect(actual.keyItems).toEqual([
      ...(expected.noLocket ? [] : ['star_locket']),
      ...(expected.flags.includes(CH1_TRAIL_FLAGS.hasKey) ? [CH1_TRAIL_KEY_ITEM_ID] : []),
    ]);
    expect(actual.cashOnHand).toBe(expected.cash);
    expect(actual.banked).toBe(0);
    expect(actual.embers).toBe(expected.embers);
    expect(actual.spawn).toEqual(runtimePoint(POINTS[expected.point]));
  });

  it('keeps all bags bounded and every unique Chapter 1 reward singular', () => {
    const actual = profile();
    for (const hero of actual.party) expect(hero.bag.length, `${hero.id} bag`).toBeLessThanOrEqual(BAG_MAX);
    expect(new Set(actual.keyItems).size).toBe(actual.keyItems.length);
    for (const uniqueItem of ['star_locket', CH1_TRAIL_KEY_ITEM_ID, 'glints_spark', 'hand_me_down_pan', 'fresh_stamps', 'lucky_collar']) {
      expect(itemCount(actual, uniqueItem), uniqueItem).toBeLessThanOrEqual(1);
    }
    if (actual.flags.includes('ch1_glints_spark_claimed')) expect(itemCount(actual, 'glints_spark')).toBe(1);
    if (actual.flags.includes('faye_joined')) {
      expect(itemCount(actual, 'hand_me_down_pan')).toBe(1);
      expect(fayeFacts(actual)).toEqual({ fayeCount: 1, panCount: 1, panOnFaye: true, panEquipped: true });
    }
  });

  it('matches the world phase and authored music/ambience contract', () => {
    const actual = profile();
    const map = MAPS[actual.spawn.mapId];
    expect(actual.phase).toBe(expectedPhase(expected.state));
    expect(actual.phase).toBe(chapter1Phase((flag) => actual.flags.includes(flag)));
    expect(actual.expectedMusic).toBe(expectedMusic(expected.state, actual.spawn.mapId, actual.battle !== null));
    expect(actual.expectedAmbience).toBe(map.ambience ?? null);
  });

  it('plants the complete player body on live, phase-aware MAPS collision', () => {
    expect(playerBodyIsClear(profile())).toBe(true);
  });

  it('installs exact state and survives current-schema serialize/migrate/reload byte-for-byte', () => {
    const actual = profile();
    installChapter1DevProfile(actual);
    const installed = exactCoreState(actual);
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(GS.data.flags).toEqual(Object.fromEntries(expected.flags.map((flag) => [flag, true])));
    expect(GS.data.map).toBe(actual.spawn.mapId);
    expect(GS.data.x).toBe(actual.spawn.x);
    expect(GS.data.y).toBe(actual.spawn.y);
    expect(GS.data.facing).toBe(actual.spawn.facing);
    expect(GS.data.pendingDeposit).toBe(0);
    const json = GS.serialize();
    GS.reset();
    GS.deserialize(json);
    expect(exactCoreState(actual)).toEqual(installed);
    expect(GS.serialize()).toBe(json);
  });
});

describe('Chapter 1 profile progression frontiers', () => {
  it.each(['preTick', 'tickBattle', 'postTick', 'defeatRetry', 'staleLegacyFlags'] as const)(
    '%s starts on the raised trigger dais in the final Hickory Hill cave map',
    (state) => {
      const profile = chapter1DevProfile(state);
      const arena = MAPS.oak_heart;
      const trigger = arena.triggers.find((candidate) => candidate.id === 'heart_oak');
      expect(trigger, 'stable cave-arena trigger').toBeDefined();
      expect(profile.spawn).toEqual(runtimePoint(POINTS.tickCave));
      expect(profile.spawn.mapId).toBe('oak_heart');
      expect(profile.frontier.startsWith('tick:')).toBe(true);
      expect(CH1_WORLD.profiles.tickCave.mapId).toBe('oak_heart');

      const tileX = Math.floor(profile.spawn.x / ART_SCALE / 16);
      const tileY = Math.floor(profile.spawn.y / ART_SCALE / 16);
      const { x, y, w, h } = trigger!.rect;
      expect(tileX).toBeGreaterThanOrEqual(x);
      expect(tileX).toBeLessThan(x + w);
      expect(tileY).toBeGreaterThanOrEqual(y);
      expect(tileY).toBeLessThan(y + h);
      expect(arena.elevation!.level[tileY][tileX]).toBe('1');
    },
  );

  it.each(EXPECTED)('$state exposes its exact next planner frontier with no impossible earlier trigger', (expected) => {
    const profile = chapter1DevProfile(expected.state);
    expect(profile.frontier).toBe(expected.frontier);
    if (profile.frontier.startsWith('opening:')) {
      const flags = new Set(profile.flags);
      expect(openingPhase(profile.spawn.mapId, {
        intro_done: flags.has('intro_done'),
        op_fell: flags.has('op_fell'),
        op_house: flags.has('op_house'),
      })).toBe(Number(profile.frontier.split(':')[1]));
      return;
    }

    // Every post-opening frontier must have permanently retired the opening.
    const openingFlags = new Set(profile.flags);
    expect(openingPhase(profile.spawn.mapId, {
      intro_done: openingFlags.has('intro_done'),
      op_fell: openingFlags.has('op_fell'),
      op_house: openingFlags.has('op_house'),
    })).toBe(0);

    if (profile.frontier !== 'none') {
      const [domain, wanted] = profile.frontier.split(':');
      expect(plannerStage(profile, domain)).toBe(wanted);
    }

    const domain = profile.frontier === 'none' ? 'travel' : profile.frontier.split(':')[0];
    const rank = ['crater', 'porch', 'trail', 'tick', 'travel', 'faye', 'manager', 'mom'].indexOf(domain);
    if (rank > 0) expect(plannerStage(profile, 'crater')).toBe('done');
    if (rank > 1) expect(plannerStage(profile, 'porch')).toBe('done');
    if (rank > 2) expect(['cave', 'complete']).toContain(plannerStage(profile, 'trail'));
    if (rank > 3) expect(plannerStage(profile, 'tick')).toBe('done');
    if (rank > 5) expect(plannerStage(profile, 'faye')).toBe('done');
    if (rank > 6) expect(plannerStage(profile, 'manager')).toBe('done');
  });
});

describe('Chapter 1 direct battle profiles', () => {
  it('launches only the four named real battle phases', () => {
    const directStates = CH1_DEV_STATES.filter((state) => chapter1DevBattleConfig(chapter1DevProfile(state)) !== null);
    expect(directStates).toEqual(['sentinelTurn2', 'sentinelTurn5', 'tickBattle', 'managerBattle']);
  });

  it('resumes the Sentinel at the exact real turn counters', () => {
    for (const [state, bossTurns, introSeen] of [
      ['sentinelTurn2', 1, false],
      ['sentinelTurn5', 4, true],
    ] as const) {
      const battle = chapter1DevBattleConfig(chapter1DevProfile(state));
      expect(battle).toEqual({
        enemyIds: ['hush_sentinel'],
        advantage: 'none',
        guestChad: true,
        glintAssist: true,
        glintSupernova: true,
        boss: true,
        backdrop: 'crater',
        prayTutorial: false,
        devContext: { encounter: 'hush_sentinel', bossTurns, introSeen },
      });
    }
  });

  it('launches the real Titanic Tick and Manager formations', () => {
    expect(chapter1DevBattleConfig(chapter1DevProfile('tickBattle'))).toEqual({
      enemyIds: ['titanic_tick'],
      advantage: 'none',
      guestChad: false,
      glintAssist: false,
      glintSupernova: false,
      boss: true,
      backdrop: 'oak_heart',
      prayTutorial: false,
    });
    expect(chapter1DevBattleConfig(chapter1DevProfile('managerBattle'))).toEqual({
      enemyIds: ['the_suit', 'blazer_smiler'],
      advantage: 'none',
      guestChad: false,
      glintAssist: false,
      glintSupernova: false,
      boss: true,
      backdrop: 'department',
      prayTutorial: true,
    });
  });

  it('returns a defensive BattleScene config copy', () => {
    const profile = chapter1DevProfile('sentinelTurn5');
    const first = chapter1DevBattleConfig(profile)!;
    first.enemyIds.push('not_real');
    if (first.devContext) first.devContext.bossTurns = 99;
    expect(chapter1DevBattleConfig(profile)).toMatchObject({
      enemyIds: ['hush_sentinel'],
      devContext: { bossTurns: 4 },
    });
  });
});

describe('Chapter 1 hazardous profile invariants', () => {
  it('owns the exact full-bag, leader-down, partial-party, retry, stale, retired, and touch fixtures', () => {
    expect(chapter1DevProfile('porchFullBag').party[0].bag).toHaveLength(BAG_MAX);
    expect(chapter1DevProfile('fayeFullBag').party[0].bag).toHaveLength(BAG_MAX);
    expect(chapter1DevProfile('leaderDown').party).toMatchObject([{ id: 'rex', down: true, hp: 0 }, { id: 'faye' }]);
    expect(chapter1DevProfile('partialParty')).toMatchObject({ frontier: 'faye:party', party: [{ id: 'rex' }] });
    expect(chapter1DevProfile('defeatRetry').party[0]).toMatchObject({ hp: 1 });
    expect(chapter1DevProfile('staleLegacyFlags').flags).toEqual(expect.arrayContaining(['glint_dead', 'meteor_seen', 'tick_done']));
    expect(chapter1DevProfile('retiredLegacyMap').migrationSourceMap).toBe('downtown_otterbrook');
    expect(chapter1DevProfile('touchMode').devTouch).toBe(true);
    for (const state of ['porchFullBag', 'leaderDown', 'partialParty', 'defeatRetry', 'staleLegacyFlags', 'retiredLegacyMap', 'touchMode'] as const) {
      expect(chapter1DevProfile(state).hazard, state).not.toBeNull();
    }
  });

  it.each(CH1_RETIRED_MAP_IDS)('migrates retired v26 source %s to the exact body-safe recovery anchor', (sourceMap) => {
    const profile = chapter1DevProfile('retiredLegacyMap');
    installChapter1DevProfile(profile);
    const raw = JSON.parse(GS.serialize()) as Record<string, unknown>;
    raw.version = 26;
    raw.map = sourceMap;
    raw.x = -444;
    raw.y = 999_999;
    raw.facing = 'left';
    GS.deserialize(JSON.stringify(raw));
    expect({ mapId: GS.data.map, x: GS.data.x, y: GS.data.y, facing: GS.data.facing }).toEqual(runtimePoint(POINTS.recovery));
    expect({
      mapId: CH1_WORLD.recovery.mapId,
      x: s(CH1_WORLD.recovery.x),
      y: s(CH1_WORLD.recovery.y),
      facing: CH1_WORLD.recovery.facing,
    }).toEqual(runtimePoint(POINTS.recovery));
    expect(GS.data.flags).toEqual(Object.fromEntries(profile.flags.map((flag) => [flag, true])));
    expect(GS.data.party.map((hero) => hero.id)).toEqual(['rex']);
    expect(GS.data.embers).toBe(1);
    expect(GS.data.version).toBe(CURRENT_SAVE_VERSION);
    expect(playerBodyIsClear({
      ...profile,
      spawn: { mapId: GS.data.map, x: GS.data.x, y: GS.data.y, facing: GS.data.facing as Facing },
    })).toBe(true);
  });
});
