import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS, makeHeroState, type MushroomizeState } from '../engine/state';
import type { CallerRecord, EquipSlot } from '../schemas';
import { departHero } from '../engine/party';
import { captureEcho } from '../engine/echo';
import { clearDownstreamChoiceFlags, recordChoice } from '../engine/choice';
import { Dialogue } from '../ui/windows';
import { colorOf } from '../palette';
import { RAMP, px } from '../palette';
import { s, TILE_PX } from '../spritegen/scale';
import type { Facing } from '../spritegen';
import { MAPS, BRICKTON_BUS_SPAWN, OTTERBROOK_DEV_PREVIEW_SPAWN } from '../data/maps';
import {
  DUNAS_EAST_DEV_PREVIEW_SPAWN,
  DUNAS_WEST_DEV_PREVIEW_SPAWN,
  PUERTO_SOL_DEV_PREVIEW_SPAWN,
} from '../data/maps_ch2';
import { CH4_MAP_IDS, CH4_WORLD } from '../data/maps_ch4';
import { CH5_MAP_IDS, CH5_WORLD } from '../data/maps_ch5';
import { CH6_MAP_IDS, CH6_WORLD } from '../data/maps_ch6';
import { CH7_MAP_IDS, CH7_WORLD } from '../data/maps_ch7';
import { CH8_MAP_IDS, CH8_WORLD } from '../data/maps_ch8';
import { CH9_MAP_IDS, CH9_WORLD } from '../data/maps_ch9';
import { CH1_OWNED_MAP_IDS } from '../data/maps_ch1';
import { BAG_MAX } from '../data/items';
import { QUESTS } from '../data/quests';
import { CHOICES } from '../data/choices';
import { CH8_CLICKER_CALLER } from '../engine/ch8Story';
import {
  CH1_DEV_STATES,
  chapter1DevBattleConfig,
  chapter1DevProfile,
  installChapter1DevProfile,
} from '../engine/ch1Profiles';

export const CH3_DEV_MAP_IDS = [
  'biplane_interior', 'foggybottom', 'kettle_taproom', 'kettle_snug',
  'foggy_moor', 'wintermoor_grounds', 'the_old_stones',
  'wintermoor_f1', 'wintermoor_f2', 'wintermoor_f3',
  'wintermoor_dorm', 'wintermoor_boiler',
] as const;

const CH3_DEV_MAP_SET: ReadonlySet<string> = new Set(CH3_DEV_MAP_IDS);
const CH1_DEV_MAP_SET: ReadonlySet<string> = new Set(CH1_OWNED_MAP_IDS);
export type Chapter3DevState = 'arrival' | 'joined' | 'coolant' | 'postBoss' | 'complete';

export interface Chapter3DevProfile {
  state: Chapter3DevState;
  flags: readonly string[];
  embers: number;
  partyLevels: Readonly<Record<'rex' | 'faye' | 'milo', number | null>>;
}

export const CH4_DEV_MAP_IDS = CH4_MAP_IDS;
const CH4_DEV_MAP_SET: ReadonlySet<string> = new Set(CH4_DEV_MAP_IDS);
export type Chapter4DevState = 'arrival' | 'bridge' | 'bridgeCleared' | 'lilleby' | 'meltfallClosed' | 'meltfallOpen' | 'boss' | 'postBoss' | 'complete';

export interface Chapter4DevProfile {
  state: Chapter4DevState;
  flags: readonly string[];
  embers: number;
  items: readonly string[];
}

export function chapter4DevProfile(value: string | null): Chapter4DevProfile {
  const valid: readonly Chapter4DevState[] = ['arrival', 'bridge', 'bridgeCleared', 'lilleby', 'meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'];
  const state: Chapter4DevState = valid.includes(value as Chapter4DevState) ? value as Chapter4DevState : 'bridge';
  const flags = [
    'ember1', 'ember2', 'ember3', 'ch2_complete', 'ch3_arrived', 'ch3_complete',
    'milo_joined', 'repair_taught', 'milo_clicker', 'fleet_road',
    'awake_freeze_a', 'awake_mindwarp_a', 'thread_trust_open', 'mainframe_defeated', 'ch4_arrived',
  ];
  if (['bridgeCleared', 'lilleby', 'meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('moor_berry_cleared', 'ch4_moor_seen');
  if (['lilleby', 'meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch4_lilleby_seen');
  if (['meltfallClosed', 'meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch4_spine_seen');
  if (['meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('spine_meltfall_frozen', 'spine_firecracker_claimed');
  if (['postBoss', 'complete'].includes(state)) flags.push('whisperwig_defeated', 'awake_volt_a', 'ch4_whisperwig_seen');
  if (state === 'complete') flags.push('ember4', 'ch4_heartlight_seen', 'ch4_complete');
  return { state, flags, embers: state === 'complete' ? 4 : 3, items: ['meltfallOpen', 'boss', 'postBoss', 'complete'].includes(state) ? ['firecracker_string'] : [] };
}

export function chapter4DevSpawn(mapId: string, state: Chapter4DevState): { x: number; y: number; facing: Facing } {
  const tile = mapId === 'bootstep_moor' && (state === 'bridge' || state === 'bridgeCleared')
    ? { x: 57, y: 38, facing: 'right' as const }
    : mapId === 'lilleby'
      ? { x: 4, y: 29, facing: 'right' as const }
      : mapId === 'spine_shoulder'
        ? { x: 28, y: 25, facing: 'up' as const }
        : mapId === 'spine_ear'
          ? { x: 26, y: 28, facing: 'up' as const }
          : mapId === 'kvisthavn'
            ? { ...CH4_WORLD.kvisthavn.landing, facing: 'down' as const }
            : null;
  if (tile) {
    return { x: tile.x * TILE_PX + TILE_PX / 2, y: tile.y * TILE_PX + TILE_PX * 0.75, facing: tile.facing };
  }
  return chapter3DevSpawn(mapId);
}

export const CH5_DEV_MAP_IDS = CH5_MAP_IDS;
const CH5_DEV_MAP_SET: ReadonlySet<string> = new Set(CH5_DEV_MAP_IDS);
export type Chapter5DevState = 'arrival' | 'city' | 'procession' | 'hedgerow' | 'boss' | 'postBoss' | 'complete';

export interface Chapter5DevProfile {
  state: Chapter5DevState;
  flags: readonly string[];
  embers: number;
  keyItems: readonly string[];
  party: readonly ('rex' | 'faye' | 'milo' | 'pippa' | 'dorin')[];
}

export function chapter5DevProfile(value: string | null): Chapter5DevProfile {
  const valid: readonly Chapter5DevState[] = ['arrival', 'city', 'procession', 'hedgerow', 'boss', 'postBoss', 'complete'];
  const state: Chapter5DevState = valid.includes(value as Chapter5DevState) ? value as Chapter5DevState : 'city';
  const flags = [
    'ember1', 'ember2', 'ember3', 'ember4', 'ch2_complete', 'ch3_arrived', 'ch3_complete',
    'ch4_arrived', 'ch4_complete', 'milo_joined', 'repair_taught', 'milo_clicker', 'fleet_road',
    'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a', 'thread_trust_open',
    'mainframe_defeated', 'whisperwig_defeated',
  ];
  if (state !== 'arrival') flags.push('ch5_arrived');
  if (['procession', 'hedgerow', 'boss', 'postBoss', 'complete'].includes(state)) {
    flags.push('big_little_lens_built');
  }
  if (['boss', 'postBoss', 'complete'].includes(state)) flags.push('hedgerow_lens_seen');
  if (state === 'postBoss' || state === 'complete') flags.push('whiskerzilla_defeated');
  if (state === 'complete') flags.push('ember5', 'pippa_joined', 'dorin_joined', 'ch5_complete');
  return {
    state,
    flags,
    embers: state === 'complete' ? 5 : 4,
    keyItems: [
      ...(['procession', 'hedgerow', 'boss', 'postBoss', 'complete'].includes(state) ? ['big_little_lens'] : []),
      ...(state === 'complete' ? ['royal_thimble'] : []),
    ],
    party: state === 'complete' ? ['rex', 'faye', 'milo', 'pippa', 'dorin'] : ['rex', 'faye', 'milo'],
  };
}

export function chapter5DevSpawn(mapId: string, state: Chapter5DevState): { x: number; y: number; facing: Facing } {
  const tile = mapId === 'minimus_major'
    ? { ...CH5_WORLD.minimusMajor.landing, facing: 'down' as const }
    : mapId === 'procession_way'
      ? { x: 7, y: 32, facing: 'right' as const }
      : mapId === 'the_hedgerow'
        ? { x: 44, y: 69, facing: 'up' as const }
        : mapId === 'ducal_crown'
          ? state === 'postBoss' || state === 'complete'
            ? { x: 26, y: 20, facing: 'up' as const }
            : { x: 26, y: 37, facing: 'up' as const }
          : null;
  if (!tile) return chapter3DevSpawn(mapId);
  return { x: tile.x * TILE_PX + TILE_PX / 2, y: tile.y * TILE_PX + TILE_PX * 0.75, facing: tile.facing };
}

export const CH6_DEV_MAP_IDS = CH6_MAP_IDS;
const CH6_DEV_MAP_SET: ReadonlySet<string> = new Set(CH6_DEV_MAP_IDS);
export type Chapter6DevState = 'arrival' | 'city' | 'savanna' | 'ruins' | 'choice' | 'boss' | 'postBoss' | 'complete';

export interface Chapter6DevProfile {
  state: Chapter6DevState;
  flags: readonly string[];
  embers: number;
  keyItems: readonly ['big_little_lens', 'royal_thimble'];
  party: readonly ['rex', 'faye', 'milo', 'pippa', 'dorin'];
  level: 30;
}

export function chapter6DevProfile(value: string | null): Chapter6DevProfile {
  const valid: readonly Chapter6DevState[] = ['arrival', 'city', 'savanna', 'ruins', 'choice', 'boss', 'postBoss', 'complete'];
  const state: Chapter6DevState = valid.includes(value as Chapter6DevState) ? value as Chapter6DevState : 'city';
  const flags = [
    'ember1', 'ember2', 'ember3', 'ember4', 'ember5',
    'ch2_complete', 'ch3_arrived', 'ch3_complete', 'ch4_arrived', 'ch4_complete',
    'ch5_arrived', 'ch5_complete', 'milo_joined', 'pippa_joined', 'dorin_joined',
    'repair_taught', 'milo_clicker', 'fleet_road', 'big_little_lens_built',
    'mainframe_defeated', 'whisperwig_defeated', 'whiskerzilla_defeated',
    'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a', 'thread_trust_open',
  ];
  if (state !== 'arrival') flags.push('ch6_arrived');
  if (['savanna', 'ruins', 'choice', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch6_courier_seen');
  if (['ruins', 'choice', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch6_ruins_seen');
  if (['choice', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('held_breath_unlocked');
  if (['postBoss', 'complete'].includes(state)) flags.push('ch6_sphinx_seen', 'laughing_sphinx_defeated');
  if (state === 'complete') flags.push('ch6_heartlight_seen', 'ember6', 'ch6_complete');
  return {
    state,
    flags,
    embers: state === 'complete' ? 6 : 5,
    keyItems: ['big_little_lens', 'royal_thimble'],
    party: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
    level: 30,
  };
}

export function chapter6DevSpawn(mapId: string, state: Chapter6DevState): { x: number; y: number; facing: Facing } {
  const tile = mapId === 'zanzibel'
    ? state === 'arrival'
      ? { ...CH6_WORLD.zanzibel.landing, facing: 'down' as const }
      : { x: 34, y: 31, facing: 'right' as const }
    : mapId === 'savanna_run'
      ? { x: 2, y: 50, facing: 'right' as const }
      : mapId === 'laughing_ruins'
        ? state === 'choice' || state === 'boss' || state === 'postBoss' || state === 'complete'
          ? { x: 50, y: 38, facing: 'up' as const }
          : { x: 40, y: 78, facing: 'up' as const }
        : mapId === 'sphinx_chin'
          ? state === 'postBoss' || state === 'complete'
            ? { x: 28, y: 16, facing: 'up' as const }
            : { x: 28, y: 38, facing: 'up' as const }
          : null;
  if (!tile) return chapter3DevSpawn(mapId);
  return { x: tile.x * TILE_PX + TILE_PX / 2, y: tile.y * TILE_PX + TILE_PX * 0.75, facing: tile.facing };
}

export const CH7_DEV_MAP_IDS = CH7_MAP_IDS;
const CH7_DEV_MAP_SET: ReadonlySet<string> = new Set(CH7_DEV_MAP_IDS);
export type Chapter7DevState = 'arrival' | 'city' | 'theft' | 'train' | 'recovered' | 'palace' | 'boss' | 'postBoss' | 'complete';

export interface Chapter7DevProfile {
  state: Chapter7DevState;
  flags: readonly string[];
  embers: 6 | 7;
  keyItems: readonly ['star_locket', 'big_little_lens', 'royal_thimble', 'train_ticket'];
  party: readonly ['rex', 'faye', 'milo', 'pippa', 'dorin'];
  level: 35;
}

/** A coherent Chapter 7 survey save for every production beat. Theft is flag
 * state, never physical key-item deletion, so save/load and rewind retain the
 * same Locket object while availability follows the story. */
export function chapter7DevProfile(value: string | null): Chapter7DevProfile {
  const valid: readonly Chapter7DevState[] = [
    'arrival', 'city', 'theft', 'train', 'recovered', 'palace', 'boss', 'postBoss', 'complete',
  ];
  const state: Chapter7DevState = valid.includes(value as Chapter7DevState)
    ? value as Chapter7DevState
    : 'city';
  const flags = [
    'ember1', 'ember2', 'ember3', 'ember4', 'ember5', 'ember6',
    'ch2_complete', 'ch3_arrived', 'ch3_complete', 'ch4_arrived', 'ch4_complete',
    'ch5_arrived', 'ch5_complete', 'ch6_arrived', 'ch6_complete',
    'milo_joined', 'pippa_joined', 'dorin_joined',
    'repair_taught', 'milo_clicker', 'fleet_road', 'big_little_lens_built',
    'mainframe_defeated', 'whisperwig_defeated', 'whiskerzilla_defeated',
    'laughing_sphinx_defeated', 'held_breath_unlocked',
    'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a', 'thread_trust_open',
  ];
  // Every Chapter 7 map profile begins after Bert's rail handoff, which grants
  // the ticket and plays the non-spoiling travel-in panel. `arrival` alone
  // leaves the city-arrival flag unset so its ghat trigger remains testable.
  flags.push('ch7_train_seen');
  if (state !== 'arrival') flags.push('ch7_arrived');
  if (['theft', 'train', 'recovered', 'palace', 'boss', 'postBoss', 'complete'].includes(state)) {
    flags.push('ch7_bazaar_seen', 'ch7_heist_seen');
  }
  if (state === 'theft' || state === 'train') flags.push('ch7_locket_stolen');
  if (['recovered', 'palace', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch7_locket_recovered');
  if (['palace', 'boss', 'postBoss', 'complete'].includes(state)) flags.push('ch7_palace_seen');
  if (['boss', 'postBoss', 'complete'].includes(state)) flags.push('ch7_raja_seen');
  if (state === 'postBoss' || state === 'complete') flags.push('cobra_raja_defeated');
  if (state === 'complete') flags.push('ch7_heartlight_seen', 'ember7', 'ch7_complete');
  return {
    state,
    flags,
    embers: state === 'complete' ? 7 : 6,
    keyItems: ['star_locket', 'big_little_lens', 'royal_thimble', 'train_ticket'],
    party: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
    level: 35,
  };
}

export function chapter7DevSpawn(mapId: string, state: Chapter7DevState): { x: number; y: number; facing: Facing } {
  const rectCenter = (rect: Readonly<{ x: number; y: number; w: number; h: number }>) => ({
    x: Math.floor(rect.x + rect.w / 2),
    y: Math.floor(rect.y + rect.h / 2),
  });
  const point = mapId === 'chandrapore'
    ? state === 'arrival' ? CH7_WORLD.chandrapore.landing : CH7_WORLD.chandrapore.bazaarCenter
    : mapId === 'monsoon_road'
      ? ['recovered', 'palace', 'boss', 'postBoss', 'complete'].includes(state)
        ? CH7_WORLD.monsoonRoad.trainLanding
        : CH7_WORLD.monsoonRoad.cityLanding
      : mapId === 'night_train'
        ? state === 'theft'
          ? rectCenter(CH7_WORLD.nightTrain.theft)
          : state === 'train'
            ? rectCenter(CH7_WORLD.nightTrain.chase)
            : ['recovered', 'palace', 'boss', 'postBoss', 'complete'].includes(state)
              ? rectCenter(CH7_WORLD.nightTrain.recovery)
              : CH7_WORLD.nightTrain.roadLanding
        : mapId === 'palace_throne'
          ? state === 'postBoss'
            ? CH7_WORLD.palaceThrone.postBoss
            : state === 'complete'
              ? rectCenter(CH7_WORLD.palaceThrone.resonance)
              : ['palace', 'boss'].includes(state)
                ? rectCenter(CH7_WORLD.palaceThrone.bossApproach)
                : CH7_WORLD.palaceThrone.entry
          : null;
  if (!point) return chapter3DevSpawn(mapId);
  return {
    x: point.x * TILE_PX + TILE_PX / 2,
    y: point.y * TILE_PX + TILE_PX * 0.75,
    facing: mapId === 'monsoon_road'
      ? 'right'
      : mapId === 'chandrapore' && state === 'arrival'
        ? 'down'
        : 'up',
  };
}

export const CH8_DEV_MAP_IDS = CH8_MAP_IDS;
const CH8_DEV_MAP_SET: ReadonlySet<string> = new Set(CH8_DEV_MAP_IDS);

export const CH8_DEV_STATES = [
  'arrival', 'city', 'barge', 'trustFree', 'trustStrings', 'mushroomized',
  'forestCured', 'brushes', 'yak', 'temple', 'boss', 'postBoss', 'complete',
] as const;
export type Chapter8DevState = (typeof CH8_DEV_STATES)[number];
type Chapter8HeroId = 'rex' | 'faye' | 'milo' | 'pippa' | 'dorin';

export interface Chapter8DevProfile {
  state: Chapter8DevState;
  flags: readonly string[];
  embers: 7 | 8;
  keyItems: readonly string[];
  items: readonly string[];
  party: readonly Chapter8HeroId[];
  departed: readonly Chapter8HeroId[];
  level: 40;
  rewindCount: number;
  mushroomize: MushroomizeState;
  callers: readonly CallerRecord[];
}

const CH8_BASE_FLAGS = [
  'ember1', 'ember2', 'ember3', 'ember4', 'ember5', 'ember6', 'ember7',
  'ch2_complete', 'ch3_arrived', 'ch3_complete', 'ch4_arrived', 'ch4_complete',
  'ch5_arrived', 'ch5_complete', 'ch6_arrived', 'ch6_complete',
  'ch7_arrived', 'ch7_complete', 'ch7_locket_recovered',
  'milo_joined', 'pippa_joined', 'dorin_joined',
  'repair_taught', 'milo_clicker', 'fleet_road', 'big_little_lens_built',
  'mainframe_defeated', 'whisperwig_defeated', 'whiskerzilla_defeated',
  'laughing_sphinx_defeated', 'cobra_raja_defeated', 'held_breath_unlocked',
  'awake_freeze_a', 'awake_mindwarp_a', 'awake_volt_a', 'thread_trust_open',
] as const;

const CH8_FULL_PARTY = ['rex', 'faye', 'milo', 'pippa', 'dorin'] as const;

const profileFeet = (
  map: string,
  point: Readonly<{ x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' }>,
) => ({
  map,
  x: point.x * TILE_PX + TILE_PX / 2,
  y: point.y * TILE_PX + TILE_PX * 0.75,
  facing: point.facing,
});

/** Exact Chapter 8 survey state. Ordinary profiles preserve an undecided Trust
 * axis; the two named branch profiles are the only ones that choose FREE or
 * STRINGS. Pippa remains present until the live Mt. Shu resolution applies the
 * selected outcome, so the STRINGS profile cannot begin in an impossible seam. */
export function chapter8DevProfile(value: string | null): Chapter8DevProfile {
  const state: Chapter8DevState = CH8_DEV_STATES.includes(value as Chapter8DevState)
    ? value as Chapter8DevState
    : 'city';
  const flags: string[] = [...CH8_BASE_FLAGS];
  const atOrAfter = (milestone: Chapter8DevState): boolean =>
    CH8_DEV_STATES.indexOf(state) >= CH8_DEV_STATES.indexOf(milestone);

  if (state !== 'arrival') flags.push('ch8_arrived');
  if (atOrAfter('barge')) {
    flags.push('thread_trust_esc1', 'thread_trust_esc2', 'thread_clicker_seed');
  }
  if (atOrAfter('trustFree')) flags.push('thread_trust_esc3');
  if (atOrAfter('mushroomized')) {
    flags.push('thread_clicker_crisis', 'thread_clicker_clearing');
  }
  if (atOrAfter('forestCured')) flags.push('spore_forest_scramble');
  if (atOrAfter('brushes')) flags.push('thread_trust_esc4', 'q_brushes', 'q_brush_river', 'q_brush_kiln');
  if (atOrAfter('yak')) flags.push('q_brush_cloud', 'q_brushes_gather', 'q_yak_waits', 'q_yak_waits_feed', 'q_yak_waits_route');
  if (atOrAfter('temple')) flags.push('ch8_yak_departed', 'ch8_yak_arrived', 'ch8_false_folds_seen');
  if (atOrAfter('boss')) {
    flags.push('thread_trust_climax', 'thread_trust_resolve', 'awake_teleport_b', 'ch8_elder_beta_seen');
  }
  if (state === 'postBoss' || state === 'complete') {
    flags.push('ch8_dragon_seen', 'paper_dragon_defeated', 'paper_fan_claimed');
  }
  if (state === 'complete') flags.push('ch8_heartlight_seen', 'ember8', 'ch8_complete');

  let party: readonly Chapter8HeroId[] = CH8_FULL_PARTY;
  let departed: readonly Chapter8HeroId[] = [];
  let rewindCount = 0;
  if (state === 'trustFree') flags.push('ch6_string_decided', 'axis_trust_free');
  if (state === 'trustStrings') {
    flags.push('ch6_string_decided', 'axis_trust_strings');
    rewindCount = 3;
  }

  const recovery = profileFeet('spore_forest', CH8_WORLD.sporeForest.recovery);
  const mushroomize: MushroomizeState = state === 'mushroomized'
    ? { active: true, phase: 0, source: CH8_WORLD.sporeForest.hazards[0].id, recovery }
    : { active: false, phase: 0, source: null, recovery: null };

  const keyItems = [
    'star_locket', 'big_little_lens', 'royal_thimble', 'train_ticket', 'riverboat_pass',
    ...(atOrAfter('temple') ? ['lotus_seal'] : []),
  ];
  return {
    state,
    flags: [...new Set(flags)],
    embers: state === 'complete' ? 8 : 7,
    keyItems: [...new Set(keyItems)],
    items: state === 'postBoss' || state === 'complete' ? ['paper_fan'] : [],
    party,
    departed,
    level: 40,
    rewindCount,
    mushroomize,
    callers: atOrAfter('mushroomized')
      ? [{ ...CH8_CLICKER_CALLER, effect: { ...CH8_CLICKER_CALLER.effect } }]
      : [],
  };
}

/** Every state/map pair lands at a fixed CH8_WORLD point. State-specific
 * positions win on their authored map; other combinations use that map's
 * nearest harmless profile point so query-string surveying cannot hit a wall. */
export function chapter8DevSpawn(mapId: string, state: Chapter8DevState): { x: number; y: number; facing: Facing } {
  const point = mapId === CH8_MAP_IDS[0]
    ? state === 'arrival' ? CH8_WORLD.lotusHarbor.profiles.arrival : CH8_WORLD.lotusHarbor.profiles.city
    : mapId === CH8_MAP_IDS[1]
      ? CH8_WORLD.bambooRoad.profiles.barge
      : mapId === CH8_MAP_IDS[2]
        ? state === 'mushroomized' ? CH8_WORLD.sporeForest.profiles.mushroomized
          : state === 'brushes' ? CH8_WORLD.sporeForest.profiles.brushes
            : state === 'yak' ? CH8_WORLD.sporeForest.profiles.yak
              : CH8_WORLD.sporeForest.profiles.forestCured
        : mapId === CH8_MAP_IDS[3]
          ? state === 'boss' ? CH8_WORLD.mtShuTemple.profiles.boss
            : state === 'postBoss' ? CH8_WORLD.mtShuTemple.profiles.postBoss
              : state === 'complete' ? CH8_WORLD.mtShuTemple.profiles.complete
                : CH8_WORLD.mtShuTemple.profiles.temple
          : null;
  if (!point) return chapter3DevSpawn(mapId);
  return {
    x: point.x * TILE_PX + TILE_PX / 2,
    y: point.y * TILE_PX + TILE_PX * 0.75,
    facing: point.facing,
  };
}

export const CH9_DEV_MAP_IDS = CH9_MAP_IDS;
const CH9_DEV_MAP_SET: ReadonlySet<string> = new Set(CH9_DEV_MAP_IDS);

export const CH9_DEV_STATES = [
  'arrival', 'arrivalDeparted', 'village', 'buniActive', 'buniFull',
  'buniFullDeparted', 'oldRoad', 'castleEntry', 'preBoss', 'preBossDeparted',
  'theatrical', 'postUnmask', 'postUnmaskDeparted', 'postBoss',
  'postBossDeparted', 'iron', 'ironDeparted', 'openHand', 'openHandDeparted',
  'monastery', 'monasteryDeparted', 'awakening', 'awakeningDeparted',
  'complete', 'completeDeparted',
] as const;
export type Chapter9DevState = (typeof CH9_DEV_STATES)[number];
export type Chapter9HeroId = 'rex' | 'faye' | 'milo' | 'pippa' | 'dorin';
export type Chapter9DevChoice = 'iron' | 'mercy' | null;

/** Each named STRINGS-path profile is the exact story twin of its present-Pippa
 * state. Keeping that relation in one table prevents battle, spawn, and flag
 * staging from drifting as the developer survey matrix grows. */
const CH9_DEPARTED_BASE_STATE = {
  arrivalDeparted: 'arrival',
  buniFullDeparted: 'buniFull',
  preBossDeparted: 'preBoss',
  postUnmaskDeparted: 'postUnmask',
  postBossDeparted: 'postBoss',
  ironDeparted: 'iron',
  openHandDeparted: 'openHand',
  monasteryDeparted: 'monastery',
  awakeningDeparted: 'awakening',
  completeDeparted: 'complete',
} as const satisfies Readonly<Partial<Record<Chapter9DevState, Chapter9DevState>>>;

function chapter9BaseState(state: Chapter9DevState): Chapter9DevState {
  return CH9_DEPARTED_BASE_STATE[state as keyof typeof CH9_DEPARTED_BASE_STATE] ?? state;
}

export interface Chapter9HeroLoadout {
  readonly bag: readonly string[];
  readonly equip: Readonly<Partial<Record<EquipSlot, string>>>;
}

/** BattleScene consumes this optional developer-only phase seam. Keeping it on
 * the ordinary launch object means the named phase labels run the real battle scene,
 * including theft, windups, mercy, teardown, and equipment restoration. */
export interface Chapter9DevBattleContext {
  readonly form: 'theatrical' | 'unmasked';
  readonly hp: 95000 | 47500;
  readonly bossTurns: 0 | 2;
  readonly introSeen: boolean;
  readonly stolen?: Readonly<{ heroId: 'rex'; slot: 'weapon' }>;
}

export interface Chapter9DevBattleLaunchConfig {
  enemyIds: ['count_hoaxula'];
  advantage: 'none';
  guestChad: false;
  glintAssist: false;
  glintSupernova: false;
  boss: true;
  backdrop: 'castle_hoaxula';
  prayTutorial: false;
  devContext: Chapter9DevBattleContext;
}

export interface Chapter9DevProfile {
  readonly state: Chapter9DevState;
  readonly flags: readonly string[];
  readonly embers: 8 | 9;
  readonly keyItems: readonly string[];
  readonly party: readonly Chapter9HeroId[];
  readonly departed: readonly Chapter9HeroId[];
  readonly level: 46;
  readonly rewindCount: number;
  readonly callers: readonly CallerRecord[];
  readonly loadouts: Readonly<Record<Chapter9HeroId, Chapter9HeroLoadout>>;
  readonly fullBag: boolean;
  readonly choice: Chapter9DevChoice;
  readonly echoAnchor: 'ch9_count' | null;
  readonly battleContext: Chapter9DevBattleContext | null;
}

const CH9_FULL_PARTY = ['rex', 'faye', 'milo', 'pippa', 'dorin'] as const;
const CH9_DEPARTED_PARTY = ['rex', 'faye', 'milo', 'dorin'] as const;
const CH9_BUNI_INGREDIENT_FLAGS = [
  'q_buni_smantana', 'q_buni_branza', 'q_buni_mushrooms',
  'q_buni_cabbage', 'q_buni_plums',
] as const;

const CH9_PRIOR_FLAGS = [
  ...CH8_BASE_FLAGS,
  'ch8_arrived', 'ch8_yak_departed', 'ch8_yak_arrived', 'ch8_false_folds_seen',
  'thread_trust_esc1', 'thread_trust_esc2', 'thread_trust_esc3', 'thread_trust_esc4',
  'thread_trust_climax', 'thread_trust_resolve',
  'thread_clicker_seed', 'thread_clicker_crisis', 'thread_clicker_clearing',
  'awake_surge_a', 'awake_lifeup_a', 'awake_fire_a', 'awake_starsong_a', 'awake_teleport_b',
  'ch8_dragon_seen', 'paper_dragon_defeated', 'paper_fan_claimed',
  'ch8_heartlight_seen', 'ember8', 'ch8_complete',
  'army_misread', 'army_checkpoint', 'army_tank', 'army_flyover', 'army_clearing',
] as const;

export const CH9_ARMY_CALLER = {
  quest: 'thread:army',
  name: 'General Buckle',
  quote: 'Rule Twelve says that when the dark comes for the kids you wronged, you send the whole friendly army. We are standing by.',
  effect: { kind: 'damage', power: 1200 },
} as const satisfies CallerRecord;

const buniCaller = QUESTS.bunis_table?.caller;
if (!buniCaller) throw new Error("Buni's Table must define its finale Caller");
export const CH9_BUNI_CALLER = {
  quest: 'bunis_table',
  name: buniCaller.name,
  quote: buniCaller.quote,
  effect: { ...buniCaller.effect },
} satisfies CallerRecord;

const vladCaller = CHOICES.ch9_count.options.find((option) => option.id === 'mercy')?.caller;
if (!vladCaller) throw new Error('The Chapter 9 OPEN HAND must define Vlad as a Caller');
export const CH9_VLAD_CALLER = {
  quest: 'choice:ch9_count',
  name: vladCaller.name,
  quote: vladCaller.quote,
  effect: { ...vladCaller.effect },
} satisfies CallerRecord;

const copyCaller = (caller: Readonly<CallerRecord>): CallerRecord => ({
  ...caller,
  effect: { ...caller.effect },
});

function chapter9Loadouts(
  fullBag: boolean,
  buniDone: boolean,
  countDefeated: boolean,
  chapterComplete: boolean,
): Readonly<Record<Chapter9HeroId, Chapter9HeroLoadout>> {
  const loadout = (
    weapon: string,
    body: string,
    arms: string,
    other: string,
    extras: readonly string[] = [],
  ): Chapter9HeroLoadout => {
    const bag = [weapon, body, arms, other, 'baozi', 'peking_pancake', 'scroll_of_calm', ...extras];
    while (fullBag && bag.length < BAG_MAX) bag.push('baozi');
    return {
      bag,
      equip: { weapon, body, arms, other },
    };
  };
  return {
    rex: loadout(
      'hall_of_famer_bat',
      'lacquer_robe',
      'prayer_wraps',
      'star_pendant',
      [
        ...(buniDone ? ['basket_feast'] : []),
        ...(countDefeated ? ['candelabra'] : []),
      ],
    ),
    faye: loadout(
      'chefs_pan', 'silk_changshan', 'glass_bangles', 'jade_pendant',
      chapterComplete ? ['holy_pan'] : [],
    ),
    milo: loadout('gauss_lobber', 'lacquer_robe', 'silk_armguards', 'cash_coin_charm'),
    pippa: loadout('paper_fan', 'silk_changshan', 'silk_armguards', 'paper_crane_charm'),
    dorin: loadout('river_beads', 'monks_robe', 'prayer_wraps', 'lucky_knot'),
  };
}

function chapter9BattleContext(state: Chapter9DevState): Chapter9DevBattleContext | null {
  const baseState = chapter9BaseState(state);
  if (baseState === 'theatrical') {
    return { form: 'theatrical', hp: 95000, bossTurns: 0, introSeen: false };
  }
  if (baseState === 'postUnmask') {
    return {
      form: 'unmasked', hp: 47500, bossTurns: 2, introSeen: true,
      stolen: { heroId: 'rex', slot: 'weapon' },
    };
  }
  return null;
}

export function chapter9DevBattleConfig(state: Chapter9DevState): Chapter9DevBattleLaunchConfig | null {
  const devContext = chapter9BattleContext(state);
  if (!devContext) return null;
  return {
    enemyIds: ['count_hoaxula'],
    advantage: 'none',
    guestChad: false,
    glintAssist: false,
    glintSupernova: false,
    boss: true,
    backdrop: 'castle_hoaxula',
    prayTutorial: false,
    devContext: { ...devContext },
  };
}

/** Deterministic Chapter 9 survey save. Present profiles use the completed FREE
 * Trust leaf; every named departed twin uses STRINGS and serializes the exact
 * Pippa record through departHero instead of leaving an impossible shell. */
export function chapter9DevProfile(value: string | null): Chapter9DevProfile {
  const state: Chapter9DevState = CH9_DEV_STATES.includes(value as Chapter9DevState)
    ? value as Chapter9DevState
    : 'village';
  const baseState = chapter9BaseState(state);
  const isDeparted = baseState !== state;
  const isArrival = baseState === 'arrival';
  const isComplete = baseState === 'complete';
  const buniDone = [
    'castleEntry', 'preBoss', 'theatrical', 'postUnmask', 'postBoss', 'iron',
    'openHand', 'monastery', 'awakening', 'complete',
  ].includes(baseState);
  const countDefeated = [
    'postBoss', 'iron', 'openHand', 'monastery', 'awakening', 'complete',
  ].includes(baseState);
  const openHand = ['openHand', 'monastery', 'awakening', 'complete'].includes(baseState);
  const choice: Chapter9DevChoice = baseState === 'iron' ? 'iron' : openHand ? 'mercy' : null;
  const flags: string[] = [
    ...CH9_PRIOR_FLAGS,
    'ch6_string_decided',
    isDeparted ? 'axis_trust_strings' : 'axis_trust_free',
    'ch9_train_committed', 'ch9_train_seen',
  ];

  if (isDeparted) flags.push('pippa_left');
  if (!isArrival) flags.push('ch9_arrived');
  if (baseState === 'buniActive' || baseState === 'oldRoad') {
    flags.push('q_bunis', 'q_buni_smantana', 'q_buni_cabbage', 'q_buni_plums');
  }
  if (baseState === 'buniFull') {
    flags.push('q_bunis', 'ch9_buni_panel_seen', ...CH9_BUNI_INGREDIENT_FLAGS, 'q_bunis_gather', 'q_bunis_cook');
  }
  if (buniDone) {
    flags.push(
      'q_bunis', 'ch9_buni_panel_seen', ...CH9_BUNI_INGREDIENT_FLAGS,
      'q_bunis_gather', 'q_bunis_cook', 'q_bunis_done', 'feast_recipe',
    );
  }
  if (countDefeated) flags.push('count_hoaxula_defeated', 'ch9_candelabra_claimed');
  if (baseState === 'postUnmask' || countDefeated) flags.push('ch9_unmasked_panel_seen');
  if (choice === 'iron') {
    flags.push('ch9_count_decided', 'axis_compassion_iron', 'stolen_light_banked', 'dorin_withholds');
  } else if (choice === 'mercy') {
    flags.push('ch9_count_decided', 'axis_compassion_openhand');
  }
  if (baseState === 'awakening' || isComplete) flags.push('ch9_trial_seen', 'ch9_dorin_name_spoken');
  if (isComplete) {
    flags.push(
      'awake_comet_o', 'ch9_heartlight_seen', 'ember9', 'ch9_holy_pan_claimed',
      'ch9_complete', 'ch9_card_seen',
    );
  }

  const keyItems = [
    'star_locket', 'big_little_lens', 'royal_thimble', 'train_ticket',
    'riverboat_pass', 'lotus_seal', 'orient_express_ticket',
    ...((baseState === 'awakening' || isComplete) ? ['trial_stone'] : []),
    ...(isComplete ? ['monastery_bell_clapper'] : []),
  ];
  const callers = [copyCaller(CH9_ARMY_CALLER), copyCaller(CH8_CLICKER_CALLER)];
  if (buniDone) callers.push(copyCaller(CH9_BUNI_CALLER));
  if (choice === 'mercy') callers.push(copyCaller(CH9_VLAD_CALLER));

  return {
    state,
    flags: [...new Set(flags)],
    embers: isComplete ? 9 : 8,
    keyItems: [...new Set(keyItems)],
    party: isDeparted ? CH9_DEPARTED_PARTY : CH9_FULL_PARTY,
    departed: isDeparted ? ['pippa'] : [],
    level: 46,
    rewindCount: isDeparted ? 3 : 0,
    callers,
    loadouts: chapter9Loadouts(baseState === 'buniFull', buniDone, countDefeated, isComplete),
    fullBag: baseState === 'buniFull',
    choice,
    echoAnchor: baseState === 'postBoss' || baseState === 'iron' || baseState === 'openHand' ? 'ch9_count' : null,
    battleContext: chapter9BattleContext(state),
  };
}

/** Install the profile through the same serializable records used by ordinary
 * saves. This is exported so the exact departed record and full-bag state can be
 * verified headlessly rather than inferred from profile labels. */
export function installChapter9DevProfile(profile: Chapter9DevProfile): void {
  profile.flags.forEach((flag) => GS.setFlag(flag));
  GS.data.embers = profile.embers;
  GS.data.departedHeroes = {};
  const roster = CH9_FULL_PARTY.filter((id) => profile.party.includes(id) || profile.departed.includes(id));
  GS.data.party = roster.map((id) => {
    const hero = makeHeroState(id, profile.level, GS.data.heroNames[id]);
    hero.bag = [...profile.loadouts[id].bag];
    hero.equip = { ...profile.loadouts[id].equip };
    return hero;
  });
  GS.data.keyItems = [...new Set([...GS.data.keyItems, ...profile.keyItems])];
  GS.data.callers = profile.callers.map(copyCaller);
  GS.data.echoes.rewindCount = profile.rewindCount;
  profile.departed.forEach((id) => departHero(id));
  if (profile.choice) recordChoice('ch9_count', profile.choice);
}

/** Refresh the real pre-choice Held Breath snapshot after TitleScene has placed
 * the player at the requested dev map feet. Branch profiles are temporarily
 * normalized to pre-choice, captured, then restored through recordChoice. */
export function primeChapter9DevEcho(profile: Chapter9DevProfile): void {
  if (!profile.echoAnchor) return;
  clearDownstreamChoiceFlags(9);
  captureEcho(profile.echoAnchor);
  if (profile.choice) recordChoice('ch9_count', profile.choice);
}

/** Every Chapter 9 state/map pair resolves through CH9_WORLD. The named state's
 * authored feet win on its home map; all cross-map combinations use the closest
 * harmless survey point so exhaustive query-string QA remains safe. */
export function chapter9DevSpawn(mapId: string, state: Chapter9DevState): { x: number; y: number; facing: Facing } {
  const baseState = chapter9BaseState(state);
  const point = mapId === CH9_MAP_IDS[0]
    ? baseState === 'arrival' ? CH9_WORLD.valea.profiles.arrival
      : baseState === 'buniActive' ? CH9_WORLD.valea.profiles.buni
        : baseState === 'buniFull' ? CH9_WORLD.valea.profiles.fullBag
          : baseState === 'complete' ? CH9_WORLD.valea.profiles.complete
            : CH9_WORLD.valea.profiles.village
    : mapId === CH9_MAP_IDS[1]
      ? CH9_WORLD.oldRoad.profiles.road
      : mapId === CH9_MAP_IDS[2]
        ? baseState === 'castleEntry' ? CH9_WORLD.castle.profiles.entry
          : baseState === 'preBoss' ? CH9_WORLD.castle.profiles.preBoss
            : baseState === 'theatrical' ? CH9_WORLD.castle.profiles.theatrical
              : baseState === 'postUnmask' ? CH9_WORLD.castle.profiles.postUnmask
                : baseState === 'postBoss' ? CH9_WORLD.castle.profiles.postBoss
                  : baseState === 'iron' || baseState === 'openHand' ? CH9_WORLD.castle.profiles.choice
                    : CH9_WORLD.castle.profiles.entry
        : mapId === CH9_MAP_IDS[3]
          ? baseState === 'awakening' ? CH9_WORLD.monastery.profiles.awakening
            : baseState === 'complete' ? CH9_WORLD.monastery.profiles.complete
              : CH9_WORLD.monastery.profiles.monastery
          : null;
  if (!point) return chapter3DevSpawn(mapId);
  return {
    x: point.x * TILE_PX + TILE_PX / 2,
    y: point.y * TILE_PX + TILE_PX * 0.75,
    facing: point.facing,
  };
}

/** A representative, deterministic Chapter 3 survey save. It includes the
 * two prior Heartlights and Mia's Freeze; post-join states also carry Jay's
 * First Borrow and enough real stats/PP to exercise PUPPET. */
export function chapter3DevProfile(value: string | null): Chapter3DevProfile {
  const state: Chapter3DevState = value === 'arrival' || value === 'coolant' || value === 'postBoss' || value === 'complete'
    ? value
    : 'joined';
  const flags = [
    'grin_defeated', 'ch2_complete', 'ch3_arrived',
    'ember1', 'ember2', 'awake_freeze_a',
  ];
  if (state !== 'arrival') {
    flags.push(
      'milo_joined', 'repair_taught', 'milo_clicker', 'fleet_road',
      'awake_mindwarp_a', 'thread_trust_open', 'wm_gate_open',
    );
  }
  if (state === 'coolant' || state === 'postBoss' || state === 'complete') flags.push('wm_coolant_frozen');
  if (state === 'postBoss' || state === 'complete') flags.push('wm_fogworks_solved', 'mainframe_defeated');
  if (state === 'complete') flags.push('ember3', 'ch3_complete');
  return {
    state,
    flags,
    embers: state === 'complete' ? 3 : 2,
    partyLevels: { rex: 16, faye: 14, milo: state === 'arrival' ? null : 16 },
  };
}

const LEGACY_DEV_MAPS: ReadonlySet<string> = new Set([
  'otterbrook', 'brickton', 'puerto_sol', 'jungle_1', 'jungle_2',
  'brickton_docks', 'boat_interior', 'grotto', 'valle_dorado', 'costa_estrella',
]);

export function optionalDevCoordinate(value: string | null): number {
  return value === null ? Number.NaN : Number(value);
}

/** Prefer a real inbound door destination, so dev boots stay valid when a map's
 * dimensions move. Falls back to the map centre; OverworldScene's body-safe
 * arrival clamp handles any authored prop that occupies that tile. */
export function chapter3DevSpawn(mapId: string): { x: number; y: number; facing: Facing } {
  const target = MAPS[mapId];
  const inBounds = (x: number, y: number): boolean =>
    !!target && x >= 0 && y >= 0 && x < target.grid[0].length * 16 && y < target.grid.length * 16;
  for (const map of Object.values(MAPS)) {
    for (const door of map.doors) {
      if (door.to === mapId && inBounds(door.tx, door.ty)) {
        return { x: s(door.tx), y: s(door.ty), facing: door.facing };
      }
    }
    for (const prop of map.props) {
      if (prop.door?.to === mapId && inBounds(prop.door.tx, prop.door.ty)) {
        return { x: s(prop.door.tx), y: s(prop.door.ty), facing: 'down' };
      }
    }
  }
  const map = target;
  const w = map?.grid[0]?.length ?? 2;
  const h = map?.grid.length ?? 2;
  return { x: Math.floor(w / 2) * TILE_PX + TILE_PX / 2, y: Math.floor(h / 2) * TILE_PX + TILE_PX * 0.75, facing: 'down' };
}

export class TitleScene extends Phaser.Scene {
  private pressText: Phaser.GameObjects.BitmapText | null = null;
  private menuOpen = false;
  private started = false;

  constructor() {
    super('title');
  }

  create(): void {
    this.menuOpen = false;
    this.started = false;
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const devMap = params.get('devMap');
      if (devMap && (CH1_DEV_MAP_SET.has(devMap) || LEGACY_DEV_MAPS.has(devMap) || CH3_DEV_MAP_SET.has(devMap) || CH4_DEV_MAP_SET.has(devMap) || CH5_DEV_MAP_SET.has(devMap) || CH6_DEV_MAP_SET.has(devMap) || CH7_DEV_MAP_SET.has(devMap) || CH8_DEV_MAP_SET.has(devMap) || CH9_DEV_MAP_SET.has(devMap))) {
        const devState = params.get('devState');
        const namedChapter1State = CH1_DEV_STATES.includes(devState as (typeof CH1_DEV_STATES)[number]);
        const isChapter1 = CH1_DEV_MAP_SET.has(devMap);
        const isChapter3 = CH3_DEV_MAP_SET.has(devMap);
        const isChapter4 = CH4_DEV_MAP_SET.has(devMap);
        const isChapter5 = CH5_DEV_MAP_SET.has(devMap);
        const isChapter6 = CH6_DEV_MAP_SET.has(devMap);
        const isChapter7 = CH7_DEV_MAP_SET.has(devMap);
        const isChapter8 = CH8_DEV_MAP_SET.has(devMap);
        const isChapter9 = CH9_DEV_MAP_SET.has(devMap);
        const ch1Profile = isChapter1 ? chapter1DevProfile(devState) : null;
        if (ch1Profile) {
          installChapter1DevProfile(ch1Profile);
        } else {
          // The historical map-preview boots stay post-opening. Chapter 1 must
          // never receive this blanket because it can replay already-earned beats.
          GS.reset();
          GS.setFlag('intro_done');
          GS.setFlag('op_fell');
          GS.setFlag('op_house');
          GS.setFlag('zapper_done');
          GS.setFlag('tick_defeated');
          GS.setFlag('chad_joined');
        }
        if (isChapter3) {
          // Default to a clean post-join/pre-boss survey state. `devState`
          // exposes the production before/after beats without console surgery:
          // arrival | joined (default) | coolant | postBoss | complete.
          const profile = chapter3DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = Math.max(profile.embers, GS.data.embers);
          GS.data.party = [
            makeHeroState('rex', profile.partyLevels.rex!, GS.data.heroNames.rex),
            makeHeroState('faye', profile.partyLevels.faye!, GS.data.heroNames.faye),
          ];
          if (profile.partyLevels.milo !== null) {
            GS.data.party.push(makeHeroState('milo', profile.partyLevels.milo, GS.data.heroNames.milo));
          }
        } else if (isChapter4) {
          const profile = chapter4DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          GS.data.party = [
            makeHeroState('rex', 22, GS.data.heroNames.rex),
            makeHeroState('faye', 22, GS.data.heroNames.faye),
            makeHeroState('milo', 22, GS.data.heroNames.milo),
          ];
          for (const item of profile.items) GS.addItem(item, 'milo');
        } else if (isChapter5) {
          const profile = chapter5DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          GS.data.party = profile.party.map((id) => makeHeroState(id, 26, GS.data.heroNames[id]));
          GS.data.keyItems.push(...profile.keyItems);
        } else if (isChapter6) {
          const profile = chapter6DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          GS.data.party = profile.party.map((id) => makeHeroState(id, profile.level, GS.data.heroNames[id]));
          GS.data.keyItems.push(...profile.keyItems);
        } else if (isChapter7) {
          const profile = chapter7DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          GS.data.party = profile.party.map((id) => makeHeroState(id, profile.level, GS.data.heroNames[id]));
          GS.data.keyItems = [...new Set([...GS.data.keyItems, ...profile.keyItems])];
        } else if (isChapter8) {
          const profile = chapter8DevProfile(params.get('devState'));
          profile.flags.forEach((flag) => GS.setFlag(flag));
          GS.data.embers = profile.embers;
          const roster = [...profile.party, ...profile.departed];
          GS.data.party = roster.map((id) => makeHeroState(id, profile.level, GS.data.heroNames[id]));
          GS.data.keyItems = [...new Set([...GS.data.keyItems, ...profile.keyItems])];
          GS.data.echoes.rewindCount = profile.rewindCount;
          GS.data.mushroomize = {
            ...profile.mushroomize,
            recovery: profile.mushroomize.recovery ? { ...profile.mushroomize.recovery } : null,
          };
          GS.data.callers = profile.callers.map((caller) => ({
            ...caller,
            effect: { ...caller.effect },
          }));
          profile.departed.forEach((id) => departHero(id));
          for (const item of profile.items) {
            const carrier = GS.hero('pippa') ?? GS.data.party[0];
            if (carrier && !GS.hasItem(item)) GS.addItem(item, carrier.id);
          }
        } else if (isChapter9) {
          installChapter9DevProfile(chapter9DevProfile(params.get('devState')));
        }
        this.started = true;
        AUDIO.stopMusic();
        // EB polish rollout — per-map dev-boot spawns (handoff §5): each entry
        // lands mid-town with no pending story beat so screenshots are clean.
        let spawn =
          devMap === 'brickton'
            ? { x: BRICKTON_BUS_SPAWN.x / 16, y: BRICKTON_BUS_SPAWN.y / 16 }
            : devMap === 'puerto_sol'
              ? PUERTO_SOL_DEV_PREVIEW_SPAWN
              : devMap === 'jungle_1'
                ? DUNAS_WEST_DEV_PREVIEW_SPAWN
                : devMap === 'jungle_2'
                  ? DUNAS_EAST_DEV_PREVIEW_SPAWN
                  : devMap === 'brickton_docks'
                    ? { x: 20, y: 8 }
                    : devMap === 'boat_interior'
                      ? { x: 11, y: 7 }
                      : devMap === 'grotto'
                        ? { x: 14, y: 18 }
                        : devMap === 'valle_dorado'
                          ? { x: 49, y: 45 }
                          : devMap === 'costa_estrella'
                            ? { x: 13, y: 14 }
                  : OTTERBROOK_DEV_PREVIEW_SPAWN;
        const ch3Spawn = isChapter3 ? chapter3DevSpawn(devMap) : null;
        const ch4Profile = isChapter4 ? chapter4DevProfile(params.get('devState')) : null;
        const ch4Spawn = ch4Profile ? chapter4DevSpawn(devMap, ch4Profile.state) : null;
        const ch5Profile = isChapter5 ? chapter5DevProfile(params.get('devState')) : null;
        const ch5Spawn = ch5Profile ? chapter5DevSpawn(devMap, ch5Profile.state) : null;
        const ch6Profile = isChapter6 ? chapter6DevProfile(params.get('devState')) : null;
        const ch6Spawn = ch6Profile ? chapter6DevSpawn(devMap, ch6Profile.state) : null;
        const ch7Profile = isChapter7 ? chapter7DevProfile(params.get('devState')) : null;
        const ch7Spawn = ch7Profile ? chapter7DevSpawn(devMap, ch7Profile.state) : null;
        const ch8Profile = isChapter8 ? chapter8DevProfile(params.get('devState')) : null;
        const ch8Spawn = ch8Profile ? chapter8DevSpawn(devMap, ch8Profile.state) : null;
        const ch9Profile = isChapter9 ? chapter9DevProfile(params.get('devState')) : null;
        const ch9Spawn = ch9Profile ? chapter9DevSpawn(devMap, ch9Profile.state) : null;
        const ch1Spawn = ch1Profile
          ? namedChapter1State
            ? ch1Profile.spawn
            : chapter3DevSpawn(devMap)
          : null;
        let spawnPx = ch1Spawn ?? ch9Spawn ?? ch8Spawn ?? ch7Spawn ?? ch6Spawn ?? ch5Spawn ?? ch4Spawn ?? (ch3Spawn
          ? { x: ch3Spawn.x, y: ch3Spawn.y, facing: ch3Spawn.facing }
          : { x: spawn.x * TILE_PX + TILE_PX / 2, y: spawn.y * TILE_PX, facing: 'down' as Facing });
        const resolvedMapId = ch1Profile && namedChapter1State ? ch1Profile.spawn.mapId : devMap;
        // Any rollout map can opt into an exact authored micro-scene without
        // adding another permanent title-menu entry. Values are tile coords;
        // invalid/missing values keep the clean map-specific default above.
        const devXRaw = params.get('devX');
        const devYRaw = params.get('devY');
        const devX = optionalDevCoordinate(devXRaw);
        const devY = optionalDevCoordinate(devYRaw);
        if (Number.isFinite(devX) && Number.isFinite(devY)) {
          spawn = { x: devX, y: devY };
          spawnPx = { x: devX * TILE_PX + TILE_PX / 2, y: devY * TILE_PX, facing: 'down' };
        }
        const overworldStart = {
          mapId: resolvedMapId,
          x: spawnPx.x,
          y: spawnPx.y,
          facing: spawnPx.facing,
          devFullMap: params.get('devFullMap') === '1',
        };
        if (ch1Profile) {
          GS.data.map = resolvedMapId;
          GS.data.x = spawnPx.x;
          GS.data.y = spawnPx.y;
          GS.data.facing = spawnPx.facing;
          const battleConfig = chapter1DevBattleConfig(ch1Profile);
          if (battleConfig) {
            // These are real phase-resumed battles, not overworld approximations.
            this.game.events.once('mf-battle-end', () => this.game.scene.start('overworld', overworldStart));
            this.scene.start('battle', battleConfig);
            return;
          }
        }
        if (ch9Profile) {
          GS.data.map = devMap;
          GS.data.x = spawnPx.x;
          GS.data.y = spawnPx.y;
          GS.data.facing = spawnPx.facing;
          primeChapter9DevEcho(ch9Profile);
          const battleConfig = chapter9DevBattleConfig(ch9Profile.state);
          if (battleConfig) {
            // Direct battle profiles are real BattleScene runs. When the battle
            // tears down, return to the authored safe restart feet for inspection.
            this.game.events.once('mf-battle-end', () => this.game.scene.start('overworld', overworldStart));
            this.scene.start('battle', battleConfig);
            return;
          }
        }
        this.scene.start('overworld', overworldStart);
        return;
      }
    }
    const W = this.scale.width;
    this.add.image(0, 0, 'title_art').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    const logo = this.add.image(W / 2, s(58), 'logo').setScale(0.78);
    this.tweens.add({ targets: logo, y: s(60), duration: 1800, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.titleText(W / 2, s(112), 'A small-town cosmic RPG', colorOf(px(RAMP.CYAN, 3)), 0.85);
    this.pressText = this.add
      .bitmapText(W / 2, s(151), 'retro', 'PRESS A / TAP TO BEGIN', s(6))
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => this.pressText?.setVisible(this.menuOpen ? true : !this.pressText.visible),
    });
    this.titleText(W / 2, s(212), 'v0.1 FUZZY PICKLES', colorOf(px(RAMP.CYAN, 2)), 0.7);

    // tap anywhere also works as A on the title
    this.input.on('pointerdown', () => {
      if (!this.menuOpen && !this.started) void this.openMenu();
    });
  }

  override update(): void {
    AUDIO.playMusic('title');
    if (!this.menuOpen && !this.started && INPUT.justPressed('A')) {
      void this.openMenu();
    }
  }

  private titleText(x: number, y: number, text: string, tint: number, alpha = 1): Phaser.GameObjects.BitmapText {
    // x/y already arrive runtime-scaled from create(); the +1 drop-shadow is a
    // native-px offset, so it scales here.
    this.add
      .bitmapText(x + s(1), y + s(1), 'retro', text, s(6))
      .setOrigin(0.5, 0)
      .setTint(colorOf(px(RAMP.NIGHT, 0)))
      .setAlpha(alpha);
    return this.add
      .bitmapText(x, y, 'retro', text, s(6))
      .setOrigin(0.5, 0)
      .setTint(tint)
      .setAlpha(alpha);
  }

  private async openMenu(): Promise<void> {
    if (this.menuOpen) return;
    this.menuOpen = true;
    AUDIO.unlock();
    AUDIO.sfx('confirm');
    const dlg = new Dialogue(this);
    const options = GS.anySave()
      ? ['Continue', 'New Game', 'Sprite Lab']
      : ['New Game', 'Sprite Lab'];
    // S13: the resort is COMPLETE AND STANDALONE ahead of Prompt 28 (the
    // Sprite Lab precedent) — dev builds reach it from the title
    if (import.meta.env.DEV) options.push('Otterbrooke (dev)');
    if (import.meta.env.DEV) options.push('Costa Estrella (dev)');
    // S15g: the LEVELKIT LAB walks generated drafts live (dev-only, the
    // Sprite Lab precedent — never a player flow)
    if (import.meta.env.DEV) options.push('Levelkit Lab (dev)');
    const pick = await dlg.ask(options);
    const choice = options[pick];
    if (choice === 'New Game') {
      GS.reset();
      this.startGame('nameentry'); // Prompt 21: name entry, then the 2AM intro
    } else if (choice === 'Continue') {
      // S6: the slot scene owns loading now (title theme keeps playing under it)
      this.started = true;
      this.scene.start('saveslots');
    } else if (choice === 'Otterbrooke (dev)') {
      GS.reset();
      GS.setFlag('intro_done');
      GS.setFlag('op_fell');
      GS.setFlag('op_house');
      GS.setFlag('zapper_done');
      GS.setFlag('tick_defeated');
      GS.setFlag('chad_joined');
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('overworld', {
        mapId: 'otterbrook',
        x: OTTERBROOK_DEV_PREVIEW_SPAWN.x * TILE_PX + TILE_PX / 2,
        y: OTTERBROOK_DEV_PREVIEW_SPAWN.y * TILE_PX,
        facing: 'down',
      });
    } else if (choice === 'Costa Estrella (dev)') {
      // a fresh dev party at the resort gate (never a saved game's state)
      GS.reset();
      this.started = true;
      AUDIO.stopMusic();
      // tile→pixel spawn (col 13 + half-tile, row 14) in runtime px
      this.scene.start('overworld', { mapId: 'costa_estrella', x: 13 * TILE_PX + TILE_PX / 2, y: 14 * TILE_PX, facing: 'up' });
    } else if (choice === 'Levelkit Lab (dev)') {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('levelkitlab');
    } else {
      this.started = true;
      AUDIO.stopMusic();
      this.scene.start('spritelab');
    }
  }

  private startGame(target: 'nameentry'): void {
    this.started = true;
    // the title theme keeps playing under name entry; NameEntryScene stops it
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(target);
    });
  }
}
