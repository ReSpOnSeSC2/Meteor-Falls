/**
 * CHAPTER 4 — THE FJORD THAT SLEEPS.
 *
 * These six ids are save-facing. Geometry may evolve only with a migration;
 * every fixed point below is shared by maps, runtime gates, dev profiles and
 * migration tests. Builders are deliberately deterministic and use no global
 * generation state.
 */
import { Grid, treeSprite } from './mapkit';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const PINE_SOLID = { ox: 8, oy: 30, w: 16, h: 12 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;
const CRATE_SOLID = { ox: 3, oy: 8, w: 14, h: 9 } as const;
const STALL_SOLID = { ox: 6, oy: 20, w: 28, h: 12 } as const;

export const CH4_MAP_IDS = [
  'kvisthavn', 'bootstep_moor', 'lilleby',
  'spine_hand', 'spine_shoulder', 'spine_ear',
] as const;

export const CH4_WORLD = {
  kvisthavn: {
    size: { w: 64, h: 48 },
    landing: { x: 18, y: 38 },
    lucille: { x: 18, y: 43, w: 3, h: 1 },
    moorMouth: { x: 63, y: 22, w: 1, h: 4 },
  },
  bootstepMoor: {
    size: { w: 112, h: 80 },
    kvisthavnMouth: { x: 0, y: 38, w: 1, h: 4 },
    lillebyMouth: { x: 111, y: 28, w: 1, h: 4 },
    handMouth: { x: 83, y: 79, w: 4, h: 1 },
    bridge: { x: 60, y: 36, w: 4, h: 4 },
  },
  lilleby: {
    size: { w: 72, h: 56 },
    scale: 2.3,
    moorMouth: { x: 0, y: 28, w: 1, h: 4 },
  },
  spineHand: {
    size: { w: 48, h: 36 },
    moorMouth: { x: 22, y: 35, w: 4, h: 1 },
    shoulderMouth: { x: 22, y: 0, w: 4, h: 1 },
  },
  spineShoulder: {
    size: { w: 56, h: 40 },
    handMouth: { x: 26, y: 39, w: 4, h: 1 },
    earMouth: { x: 26, y: 0, w: 4, h: 1 },
    meltfall: { x: 25, y: 18, w: 6, h: 4 },
  },
  spineEar: {
    size: { w: 52, h: 40 },
    shoulderMouth: { x: 24, y: 39, w: 4, h: 1 },
    boss: { x: 20, y: 9, w: 12, h: 7 },
    resonance: { x: 22, y: 18, w: 8, h: 6 },
  },
} as const;

/** Backward-compatible name used by arrival code and tests. */
export const KVISTHAVN_LANDING = CH4_WORLD.kvisthavn.landing;
export const SPINE_MELTFALL_CROSSING = CH4_WORLD.spineShoulder.meltfall;
export const BRIDGE_BERRY_CROSSING = CH4_WORLD.bootstepMoor.bridge;

function border(g: Grid, w: number, h: number, tile: string, openings: readonly { x: number; y: number; w: number; h: number }[]): void {
  g.rect(0, 0, w, 1, tile);
  g.rect(0, h - 1, w, 1, tile);
  g.rect(0, 0, 1, h, tile);
  g.rect(w - 1, 0, 1, h, tile);
  for (const opening of openings) g.rect(opening.x, opening.y, opening.w, opening.h, opening.y === 0 || opening.y === h - 1 ? ':' : '=');
}

function buildKvisthavn(): MapDef {
  const { w: W, h: H } = CH4_WORLD.kvisthavn.size;
  const g = new Grid(W, H, '.');
  g.sprinkle(410401, '.,,,~~', 0.08);
  border(g, W, H, 'B', [CH4_WORLD.kvisthavn.moorMouth]);

  // Black-cliff terraces: each ledge has two staggered stair cuts, not one ruler line.
  g.rect(1, 7, 62, 3, 'B'); g.rect(8, 7, 5, 3, ':'); g.rect(47, 7, 6, 3, ':');
  g.rect(1, 18, 62, 2, 'B'); g.rect(17, 18, 5, 2, ':'); g.rect(50, 18, 5, 2, ':');
  g.rect(3, 10, 56, 5, ':');
  g.rect(6, 21, 53, 5, '=');
  g.rect(3, 29, 56, 5, '=');
  g.rect(7, 35, 45, 6, 'd');
  g.rect(50, 22, 14, 4, '=');

  // Irregular foam bites and quay fingers make the fjord a working edge.
  g.rect(0, 42, W, 6, 'e');
  g.rect(5, 41, 13, 1, 'E'); g.rect(23, 41, 9, 1, 'E'); g.rect(38, 40, 19, 2, 'E');
  g.rect(9, 40, 3, 5, 'd'); g.rect(18, 39, 4, 6, 'd'); g.rect(29, 40, 3, 5, 'd');
  g.rect(45, 39, 5, 6, 'd');

  // First four facades are a stable generated-unit contract. maps.ts turns
  // units 0..3 into the cabin, supply store, agency and motor/fuel desk.
  const props: PropDef[] = [
    { sprite: 'bldg_kvisthavn_fjord_cabin', x: 5, y: 11, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
    { sprite: 'bldg_kvisthavn_supply_shop', x: 25, y: 21, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
    { sprite: 'bldg_kvisthavn_harbor_cafe', x: 42, y: 21, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
    { sprite: 'bldg_kvisthavn_boathouse', x: 9, y: 29, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
    { sprite: 'bldg_kvisthavn_chapel', x: 49, y: 10, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
    { sprite: 'picnic', x: 37, y: 15, solid: PICNIC_SOLID },
    { sprite: 'payphone', x: 34, y: 27, solid: PHONE_SOLID },
    { sprite: treeSprite(3, 10), x: 3, y: 15, solid: TREE_SOLID },
    { sprite: 'prop_pine_whisperwood', x: 59, y: 15, solid: PINE_SOLID },
    { sprite: 'meteor_rock', x: 55, y: 36, solid: ROCK_SOLID },
    // Net racks, loading pockets and smokehouse clutter use the authored harbor kit.
    { sprite: 'crate', x: 13, y: 36, solid: CRATE_SOLID },
    { sprite: 'crate', x: 16, y: 36, solid: CRATE_SOLID },
    { sprite: 'crate_bananas', x: 25, y: 38, solid: CRATE_SOLID },
    { sprite: 'footbridge_rail', x: 8, y: 39 },
    { sprite: 'footbridge_rail', x: 39, y: 38 },
    { sprite: 'prop_trail_marker', x: 57, y: 24 },
  ];

  return {
    id: 'kvisthavn', name: 'KVISTHAVN', music: null, settlement: 'village',
    grid: g.out(), props,
    npcs: [
      { id: 'kv_sigrid', sprite: 'sigrid_spectacles', x: 35, y: 31, facing: 'down', dialogue: 'npc_kv_sigrid', stationary: true, idle: true, emote: 'think' },
      { id: 'kv_halvor', sprite: 'kvisthavn_fisher', x: 23, y: 38, facing: 'down', dialogue: 'npc_kv_halvor', stationary: true },
      { id: 'kv_bellkeeper', sprite: 'aurora_busker', x: 51, y: 30, facing: 'down', dialogue: 'npc_kv_bellkeeper', stationary: true },
      { id: 'kv_kid', sprite: 'bell_choir_child', x: 31, y: 38, facing: 'down', dialogue: 'npc_kv_kid', stationary: true, idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 8, y: 34, dialogue: 'sign_kvisthavn' },
      { x: 58, y: 25, dialogue: 'sign_fjord_road' },
      { x: 52, y: 31, dialogue: 'sign_quay_bell' },
    ],
    phones: [{ x: 34, y: 27 }], atms: [{ x: 37, y: 27 }],
    doors: [
      { ...CH4_WORLD.kvisthavn.moorMouth, to: 'bootstep_moor', tx: 2 * 16 + 8, ty: 39 * 16 + 12, facing: 'right', indicator: 'none' },
      { ...CH4_WORLD.kvisthavn.lucille, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [{ enemies: ['hushed_gull'], count: 1, rect: { x: 35, y: 36, w: 14, h: 4 } }],
    triggers: [
      { id: 'ch4_arrival', rect: { x: 15, y: 35, w: 9, h: 5 }, once: true },
      { id: 'q_bell_clapper', rect: { x: 45, y: 39, w: 5, h: 2 }, once: false },
    ],
    reflect: [{ x: 0, y: 42, w: W, h: 6, within: 5 }],
  };
}

function buildBootstepMoor(): MapDef {
  const { w: W, h: H } = CH4_WORLD.bootstepMoor.size;
  const g = new Grid(W, H, '.');
  g.sprinkle(410402, '.,,~~f', 0.12);
  border(g, W, H, 'B', [CH4_WORLD.bootstepMoor.kvisthavnMouth, CH4_WORLD.bootstepMoor.lillebyMouth, CH4_WORLD.bootstepMoor.handMouth]);

  // Wind-shaped story spine. Compression at the wall lane releases into a broad bog.
  g.rect(1, 39, 18, 1, ':'); g.rect(17, 37, 22, 1, ':'); g.rect(36, 34, 24, 1, ':');
  g.rect(60, 36, 4, 4, '='); g.rect(64, 35, 20, 1, ':'); g.rect(81, 30, 31, 1, ':');
  g.rect(84, 30, 1, 50, ':');
  // Optional lens loops, rare pocket, overlook, picnic and a return shortcut.
  g.rect(12, 19, 1, 20, ':'); g.rect(12, 20, 24, 1, ':'); g.rect(36, 20, 1, 15, ':');
  g.rect(22, 50, 1, 20, ':'); g.rect(22, 68, 27, 1, ':'); g.rect(49, 49, 1, 20, ':');
  g.rect(72, 12, 1, 23, ':'); g.rect(72, 12, 21, 1, ':'); g.rect(92, 12, 1, 19, ':');

  // Gorge: continuous, uncrossable water except the one berry-blocked plank span.
  g.rect(60, 1, 4, 35, 'e'); g.rect(60, 40, 4, 39, 'e');
  g.rect(59, 1, 1, 34, 'E'); g.rect(64, 1, 1, 34, 'E');
  g.rect(59, 41, 1, 38, 'E'); g.rect(64, 41, 1, 38, 'E');
  // Dry-stone courses form rooms and intentional openings instead of a border-only fence.
  g.rect(3, 27, 31, 2, 'B'); g.rect(12, 27, 5, 2, ':'); g.rect(27, 27, 5, 2, ':');
  g.rect(5, 54, 42, 2, 'B'); g.rect(19, 54, 7, 2, ':'); g.rect(42, 54, 6, 2, ':');
  g.rect(69, 21, 34, 2, 'B'); g.rect(72, 21, 5, 2, ':'); g.rect(90, 21, 6, 2, ':');

  const bridge = BRIDGE_BERRY_CROSSING;
  return {
    id: 'bootstep_moor', name: 'BOOTSTEP MOOR', music: null, grid: g.out(),
    props: [
      { sprite: 'mini_giant_berry_blocker', x: bridge.x, y: bridge.y, scale: 4, solid: { ox: 0, oy: 0, w: 16, h: 15 }, unlessFlag: 'moor_berry_cleared' },
      { sprite: 'giant_bootprint_snow', x: 13, y: 20 },
      { sprite: 'giant_bootprint_snow', x: 44, y: 64, rot: 90 },
      { sprite: 'giant_bootprint_snow', x: 89, y: 11, rot: 180 },
      { sprite: 'giant_bootprint_snow', x: 77, y: 48, rot: 270 },
      { sprite: 'picnic', x: 28, y: 65, solid: PICNIC_SOLID },
      { sprite: 'meteor_rock', x: 5, y: 17, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 40, y: 44, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 99, y: 16, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 47, y: 49, scale: 2, solid: { ox: 0, oy: 0, w: 32, h: 32 }, unlessFlag: 'q_footprints_done' },
      { sprite: 'prop_pine_whisperwood', x: 6, y: 32, solid: PINE_SOLID },
      { sprite: 'prop_pine_whisperwood_b', x: 52, y: 25, solid: PINE_SOLID },
      { sprite: 'prop_pine_whisperwood_c', x: 102, y: 45, solid: PINE_SOLID },
      { sprite: 'prop_trail_marker', x: 80, y: 35 },
    ],
    npcs: [{ id: 'moor_walker', sprite: 'bootstep_shepherd', x: 18, y: 37, facing: 'down', dialogue: 'npc_moor_walker', stationary: true, idle: true }],
    signs: [{ x: 7, y: 40, dialogue: 'sign_bootstep_moor' }, { x: 56, y: 37, dialogue: 'sign_gorge' }],
    phones: [],
    doors: [
      { ...CH4_WORLD.bootstepMoor.kvisthavnMouth, to: 'kvisthavn', tx: 61 * 16 + 8, ty: 23 * 16 + 12, facing: 'left', indicator: 'none' },
      { ...CH4_WORLD.bootstepMoor.lillebyMouth, to: 'lilleby', tx: 2 * 16 + 8, ty: 29 * 16 + 12, facing: 'right', indicator: 'none' },
      { ...CH4_WORLD.bootstepMoor.handMouth, to: 'spine_hand', tx: 24 * 16, ty: 33 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['colossal_gnat', 'moor_midge_cloud', 'bog_cotton_wisp'], count: 2, rect: { x: 23, y: 29, w: 18, h: 8 } },
      { enemies: ['junior_jotun', 'amber_hoard_troll', 'aurora_moth'], count: 1, rect: { x: 31, y: 57, w: 16, h: 7 } },
      { enemies: ['thunder_snail', 'boulder_lichen', 'hushed_skua'], count: 2, rect: { x: 70, y: 23, w: 18, h: 8 } },
      { enemies: ['frost_hare', 'dog_sized_berry'], count: 2, rect: { x: 91, y: 34, w: 15, h: 10 } },
    ],
    triggers: [
      { id: 'ch4_moor_reveal', rect: { x: 18, y: 34, w: 12, h: 8 }, once: true },
      { id: 'q_sigrid_lens1', rect: { x: 9, y: 17, w: 8, h: 6 }, once: false },
      { id: 'q_sigrid_lens2', rect: { x: 87, y: 9, w: 9, h: 7 }, once: false },
      { id: 'q_picnic_berry', rect: { x: 45, y: 47, w: 7, h: 6 }, once: false },
      { id: 'q_footprint_1', rect: { x: 11, y: 18, w: 7, h: 6 }, once: false },
      { id: 'q_footprint_2', rect: { x: 42, y: 62, w: 8, h: 7 }, once: false },
      { id: 'q_footprint_3', rect: { x: 86, y: 9, w: 10, h: 7 }, once: false },
      { id: 'moor_bridge_berry', rect: bridge, once: false },
    ],
    reflect: [{ x: 60, y: 1, w: 4, h: 78, within: 4 }],
  };
}

function buildLilleby(): MapDef {
  const { w: W, h: H } = CH4_WORLD.lilleby.size;
  const g = new Grid(W, H, '.');
  g.sprinkle(410404, '.,,~fF', 0.08);
  border(g, W, H, 'B', [CH4_WORLD.lilleby.moorMouth]);
  // West gate → Great Square → market/warehouse, with residential and garden loops.
  g.rect(1, 28, 20, 4, '=');
  g.rect(15, 20, 37, 22, 'p');
  g.rect(46, 24, 25, 6, '=');
  g.rect(47, 28, 6, 20, '=');
  g.rect(21, 40, 31, 6, 'p');
  g.rect(8, 16, 7, 31, ':'); g.rect(8, 14, 24, 6, ':'); g.rect(28, 16, 6, 7, ':');
  g.rect(55, 12, 6, 13, ':'); g.rect(51, 10, 15, 5, ':');
  // Immense garden islands keep negative space authored, not empty.
  g.rect(24, 25, 9, 8, '.'); g.rect(35, 34, 8, 6, '.'); g.rect(55, 34, 11, 12, '.');
  g.rect(23, 24, 11, 1, 'F'); g.rect(54, 33, 13, 1, 'F');

  return {
    id: 'lilleby', name: 'LILLEBY', music: null, settlement: 'village', grid: g.out(),
    props: [
      // Doorless facades are intentional: occupancy creates genuine interiors;
      // facade collision automatically leaves their visible openings walkable.
      { sprite: 'bldg_lilleby_giant_inn', x: 7, y: 9, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
      { sprite: 'bldg_lilleby_runic_bank', x: 25, y: 14, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
      { sprite: 'bldg_lilleby_warehouse', x: 48, y: 18, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
      { sprite: 'bldg_lilleby_tiny_house', x: 56, y: 5, solid: { ox: 0, oy: 10, w: 80, h: 90 } },
      { sprite: 'bldg_tower_arms', x: 35, y: 3, solid: { ox: 0, oy: 10, w: 80, h: 120 } },
      { sprite: 'fountain', x: 27, y: 25, solid: { ox: 6, oy: 24, w: 28, h: 12 } },
      { sprite: 'market_stall_a', x: 18, y: 34, solid: STALL_SOLID },
      { sprite: 'market_stall_b', x: 23, y: 38, solid: STALL_SOLID },
      { sprite: 'well', x: 31, y: 36, solid: { ox: 4, oy: 20, w: 16, h: 10 } },
      { sprite: 'desk', x: 57, y: 37, solid: { ox: 0, oy: 8, w: 30, h: 10 }, unlessFlag: 'q_picnic_done' },
      { sprite: 'dining_table', x: 57, y: 37, solid: { ox: 2, oy: 12, w: 30, h: 18 }, ifFlag: 'q_picnic_done' },
      { sprite: 'picnic', x: 63, y: 43, solid: PICNIC_SOLID },
      { sprite: 'payphone', x: 21, y: 24, solid: PHONE_SOLID },
      { sprite: 'parking_meter', x: 49, y: 32 },
      { sprite: 'prop_rate_board', x: 51, y: 32 },
      { sprite: 'crate', x: 45, y: 35, solid: CRATE_SOLID },
      { sprite: 'crate_bananas', x: 49, y: 37, solid: CRATE_SOLID },
      { sprite: 'meteor_rock', x: 4, y: 33, solid: ROCK_SOLID },
      { sprite: 'prop_pine_whisperwood', x: 4, y: 19, solid: PINE_SOLID },
      { sprite: 'prop_pine_whisperwood_b', x: 67, y: 48, solid: PINE_SOLID },
    ],
    npcs: [
      { id: 'll_mayor', sprite: 'mayor_of_lilleby', x: 30, y: 35, facing: 'down', dialogue: 'npc_ll_mayor', stationary: true, emote: 'happy' },
      { id: 'll_keeper', sprite: 'canteen_keeper', x: 48, y: 33, facing: 'down', dialogue: 'npc_ll_keeper', shop: 'lilleby_warehouse', stationary: true },
      { id: 'll_sweetheart', sprite: 'fjord_nurse', x: 59, y: 28, facing: 'down', dialogue: 'npc_ll_sweetheart', stationary: true, idle: true },
      { id: 'll_child', sprite: 'lilleby_giant_child', x: 22, y: 29, facing: 'down', dialogue: 'npc_ll_child', stationary: true, idle: true },
      { id: 'll_undertaker', sprite: 'lilleby_undertaker', x: 13, y: 43, facing: 'down', dialogue: 'npc_ll_undertaker', stationary: true, idle: true, emote: 'sleep' },
      { id: 'll_pump_attendant', sprite: 'canteen_keeper', x: 52, y: 33, facing: 'down', dialogue: 'npc_ll_pump', stationary: true },
    ],
    signs: [{ x: 4, y: 31, dialogue: 'sign_lilleby' }, { x: 56, y: 40, dialogue: 'sign_great_table' }],
    phones: [{ x: 21, y: 24 }], atms: [{ x: 23, y: 24 }],
    doors: [{ ...CH4_WORLD.lilleby.moorMouth, to: 'bootstep_moor', tx: 109 * 16 + 8, ty: 29 * 16 + 12, facing: 'left', indicator: 'none' }],
    spawners: [{ enemies: ['giant_house_cat', 'lost_mitten', 'knitting_needles'], count: 1, rect: { x: 57, y: 47, w: 10, h: 5 } }],
    triggers: [
      { id: 'ch4_lilleby_reveal', rect: { x: 2, y: 27, w: 12, h: 7 }, once: true },
      { id: 'q_picnic_brunost', rect: { x: 43, y: 33, w: 8, h: 6 }, once: false },
      { id: 'q_picnic_set', rect: { x: 55, y: 36, w: 8, h: 6 }, once: false },
    ],
  };
}

function buildSpineHand(): MapDef {
  const { w: W, h: H } = CH4_WORLD.spineHand.size;
  const g = new Grid(W, H, 'o');
  border(g, W, H, 'O', [CH4_WORLD.spineHand.moorMouth, CH4_WORLD.spineHand.shoulderMouth]);
  // Five finger/knuckle terraces; palm creases create a loose loop and shortcut.
  g.rect(4, 5, 5, 18, 'O'); g.rect(12, 3, 5, 15, 'O'); g.rect(20, 2, 5, 13, 'O');
  g.rect(28, 4, 5, 15, 'O'); g.rect(36, 7, 5, 17, 'O');
  g.rect(7, 24, 34, 3, 'O'); g.rect(13, 24, 5, 3, 'o'); g.rect(31, 24, 5, 3, 'o');
  g.rect(21, 15, 4, 21, 'o'); g.rect(14, 28, 20, 5, 'o');
  g.rect(22, 0, 4, 7, 'o'); // shoulder landing clears the middle-knuckle wall
  g.rect(22, 35, 4, 1, 'o');
  return {
    id: 'spine_hand', name: "THE SLEEPER'S HAND", music: null, interior: true, grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 5, y: 3, solid: ROCK_SOLID }, { sprite: 'meteor_rock', x: 37, y: 6, solid: ROCK_SOLID },
      { sprite: 'prop_giant_hair', x: 9, y: 27 }, { sprite: 'prop_giant_hair', x: 38, y: 27 },
      { sprite: 'prop_giant_hair', x: 3, y: 30 }, { sprite: 'prop_amber_wax', x: 28, y: 29 },
    ],
    npcs: [{ id: 'spine_walker', sprite: 'sleepwalker_miner', x: 34, y: 29, facing: 'left', dialogue: 'npc_spine_walker', stationary: true, idle: true, emote: 'sleep' }],
    signs: [{ x: 23, y: 31, dialogue: 'sign_spine_hand' }], phones: [],
    doors: [
      { ...CH4_WORLD.spineHand.moorMouth, to: 'bootstep_moor', tx: 85 * 16, ty: 77 * 16 + 12, facing: 'down', indicator: 'none' },
      { ...CH4_WORLD.spineHand.shoulderMouth, to: 'spine_shoulder', tx: 28 * 16, ty: 37 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [{ enemies: ['dream_leech', 'snore_gust'], count: 2, rect: { x: 18, y: 18, w: 16, h: 6 } }],
    triggers: [{ id: 'ch4_spine_reveal', rect: { x: 19, y: 27, w: 10, h: 7 }, once: true }],
  };
}

function buildSpineShoulder(): MapDef {
  const { w: W, h: H } = CH4_WORLD.spineShoulder.size;
  const g = new Grid(W, H, 'o');
  border(g, W, H, 'O', [CH4_WORLD.spineShoulder.handMouth, CH4_WORLD.spineShoulder.earMouth]);
  // Rolling shoulder switchbacks below/above the only meltwater crossing.
  g.rect(9, 30, 38, 4, 'o'); g.rect(8, 25, 6, 8, 'o'); g.rect(8, 23, 21, 5, 'o');
  g.rect(27, 21, 4, 6, 'o'); g.rect(27, 14, 20, 5, 'o'); g.rect(43, 8, 5, 10, 'o');
  g.rect(27, 5, 21, 5, 'o'); g.rect(26, 0, 4, 9, 'o');
  g.rect(1, 18, W - 2, 4, 'e');
  g.rect(SPINE_MELTFALL_CROSSING.x, SPINE_MELTFALL_CROSSING.y, SPINE_MELTFALL_CROSSING.w, SPINE_MELTFALL_CROSSING.h, 'E');
  g.rect(23, 22, 10, 18, 'o'); // casting apron and body-box-safe approach from the hand
  g.rect(26, 39, 4, 1, 'o');
  return {
    id: 'spine_shoulder', name: "THE SLEEPER'S SHOULDER", music: null, interior: true, grid: g.out(),
    props: [
      { sprite: 'giant_bootprint_snow', x: 38, y: 6 },
      { sprite: 'meteor_rock', x: 13, y: 25, solid: ROCK_SOLID }, { sprite: 'meteor_rock', x: 42, y: 13, solid: ROCK_SOLID },
      { sprite: 'prop_giant_hair', x: 5, y: 15 }, { sprite: 'prop_giant_hair', x: 50, y: 23 },
      { sprite: 'prop_amber_wax', x: 16, y: 32 },
    ],
    npcs: [], signs: [{ x: 23, y: 24, dialogue: 'sign_spine_meltfall' }], phones: [],
    doors: [
      { ...CH4_WORLD.spineShoulder.handMouth, to: 'spine_hand', tx: 24 * 16, ty: 2 * 16 + 12, facing: 'down', indicator: 'none' },
      { ...CH4_WORLD.spineShoulder.earMouth, to: 'spine_ear', tx: 26 * 16, ty: 37 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [{ enemies: ['earwax_golem', 'snore_gust', 'frost_jotun_elder'], count: 2, rect: { x: 14, y: 27, w: 25, h: 6 } }],
    triggers: [{ id: 'spine_meltfall', rect: { x: 23, y: 23, w: 10, h: 4 }, once: false }],
    reflect: [{ x: 1, y: 18, w: W - 2, h: 4, within: 4 }],
  };
}

function buildSpineEar(): MapDef {
  const { w: W, h: H } = CH4_WORLD.spineEar.size;
  const g = new Grid(W, H, 'o');
  border(g, W, H, 'O', [CH4_WORLD.spineEar.shoulderMouth]);
  // Organic square-spiral: broad enough for body boxes, steadily compressed.
  g.rect(6, 6, 40, 3, 'O'); g.rect(6, 6, 3, 27, 'O'); g.rect(6, 30, 34, 3, 'O');
  g.rect(37, 13, 3, 20, 'O'); g.rect(14, 13, 26, 3, 'O'); g.rect(14, 13, 3, 12, 'O');
  g.rect(14, 22, 18, 3, 'O');
  g.rect(24, 31, 4, 9, 'o');
  g.rect(23, 6, 6, 3, 'o'); g.rect(37, 20, 3, 6, 'o'); g.rect(25, 22, 7, 3, 'o');
  return {
    id: 'spine_ear', name: "THE SLEEPER'S EAR", music: null, interior: true, grid: g.out(),
    props: [
      { sprite: 'prop_resonance_stones', x: 22, y: 17, ifFlag: 'whisperwig_defeated' },
      { sprite: 'prop_amber_wax', x: 10, y: 26 }, { sprite: 'prop_amber_wax', x: 40, y: 10 },
      { sprite: 'prop_giant_hair', x: 19, y: 34 }, { sprite: 'prop_giant_hair', x: 32, y: 28 },
    ],
    npcs: [], signs: [{ x: 25, y: 27, dialogue: 'sign_sleepers_ear' }], phones: [],
    doors: [{ ...CH4_WORLD.spineEar.shoulderMouth, to: 'spine_shoulder', tx: 28 * 16, ty: 2 * 16 + 12, facing: 'down', indicator: 'none' }],
    spawners: [{ enemies: ['earwax_golem', 'dream_leech'], count: 2, rect: { x: 18, y: 27, w: 15, h: 5 }, unlessFlag: 'whisperwig_defeated' }],
    triggers: [
      { id: 'whisperwig_boss', rect: CH4_WORLD.spineEar.boss, once: false },
      { id: 'sleepers_ear_resonance', rect: CH4_WORLD.spineEar.resonance, once: true },
    ],
  };
}

export function buildChapter4Maps(): Record<string, MapDef> {
  return {
    kvisthavn: buildKvisthavn(), bootstep_moor: buildBootstepMoor(), lilleby: buildLilleby(),
    spine_hand: buildSpineHand(), spine_shoulder: buildSpineShoulder(), spine_ear: buildSpineEar(),
  };
}
