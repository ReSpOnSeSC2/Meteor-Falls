/**
 * Chapter 7 — THE COBRA'S PALACE.
 *
 * These four map ids and every point below are save-facing.  The builders are
 * deliberately deterministic: doors, story triggers, title profiles, and the
 * v24 recovery migration all consume the same fixed-point registry.
 */
import { Grid, treeSprite } from './mapkit';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;
const CRATE_SOLID = { ox: 3, oy: 8, w: 14, h: 9 } as const;
const BENCH_SOLID = { ox: 1, oy: 11, w: 22, h: 8 } as const;
const STALL_SOLID = { ox: 6, oy: 20, w: 28, h: 12 } as const;
// Chandrapore's authored source facades are all historical w4/u0 footprints.
// occupyCity consumes this geometry before the tall-city promotion pass.
const CHANDRAPORE_FACADE_SOLID = { ox: 0, oy: 10, w: 66, h: 6 } as const;

export const CH7_MAP_IDS = [
  'chandrapore', 'monsoon_road', 'night_train', 'palace_throne',
] as const;

export const CH7_WORLD = {
  chandrapore: {
    size: { w: 120, h: 88 },
    landing: { x: 16, y: 75 },
    lucille: { x: 14, y: 87, w: 4, h: 1 },
    arrival: { x: 10, y: 70, w: 14, h: 9 },
    monsoonMouth: { x: 119, y: 48, w: 1, h: 5 },
    monsoonLanding: { x: 116, y: 50 },
    bazaarCenter: { x: 44, y: 45 },
    // The southern bazaar threshold spans the only body-safe route from the
    // ghats into the east-west city street, so the city introduction cannot be
    // bypassed on the way to the station/heist.
    bazaarApproach: { x: 12, y: 59, w: 42, h: 8 },
    ghats: { x: 18, y: 72 },
    cinema: { x: 84, y: 43 },
    station: { x: 104, y: 51 },
    merchant: { x: 38, y: 40 },
    dabbawala: { x: 61, y: 58 },
    stationmaster: { x: 105, y: 54 },
    usher: { x: 84, y: 47 },
    ghatElder: { x: 27, y: 71 },
    spicePoints: [
      { x: 18, y: 42 }, { x: 18, y: 72 }, { x: 95, y: 46 },
      { x: 34, y: 35 }, { x: 50, y: 49 }, { x: 74, y: 59 },
      { x: 44, y: 45 },
    ],
    monkeyChase: { x: 58, y: 51, w: 10, h: 7 },
    monkeyCorner: { x: 80, y: 31, w: 10, h: 7 },
    cinemaBeat: { x: 82, y: 40, w: 8, h: 8 },
    heist: { x: 96, y: 48, w: 8, h: 8 },
    riverClues: [{ x: 10, y: 68 }, { x: 31, y: 77 }, { x: 47, y: 69 }],
    recovery: { x: 26, y: 74 },
    vehicleBay: { x: 30, y: 76 },
  },
  monsoonRoad: {
    size: { w: 108, h: 68 },
    cityMouth: { x: 0, y: 52, w: 1, h: 5 },
    cityLanding: { x: 3, y: 54 },
    rest: { x: 26, y: 39, w: 14, h: 10 },
    shrine: { x: 48, y: 53, w: 16, h: 9 },
    railYard: { x: 84, y: 10, w: 21, h: 19 },
    trainMouth: { x: 107, y: 13, w: 1, h: 5 },
    trainLanding: { x: 104, y: 15 },
    recovery: { x: 32, y: 44 },
  },
  nightTrain: {
    size: { w: 48, h: 128 },
    roadMouth: { x: 22, y: 127, w: 4, h: 1 },
    roadLanding: { x: 24, y: 124 },
    boarding: { x: 10, y: 112, w: 28, h: 12 },
    inspectionPoints: [{ x: 14, y: 117 }, { x: 24, y: 108 }, { x: 34, y: 116 }],
    theft: { x: 8, y: 92, w: 32, h: 10 },
    chase: { x: 8, y: 71, w: 32, h: 14 },
    couplingClimax: { x: 14, y: 35, w: 20, h: 10 },
    recovery: { x: 12, y: 17, w: 24, h: 9 },
    palaceMouth: { x: 22, y: 0, w: 4, h: 1 },
    palaceLanding: { x: 24, y: 2 },
  },
  palaceThrone: {
    size: { w: 88, h: 104 },
    trainMouth: { x: 42, y: 103, w: 4, h: 1 },
    entry: { x: 44, y: 100 },
    vivariumReveal: { x: 28, y: 76, w: 32, h: 10 },
    habitatLoop: { x: 14, y: 45, w: 60, h: 31 },
    bossApproach: { x: 34, y: 36, w: 20, h: 10 },
    boss: { x: 27, y: 20, w: 34, h: 14 },
    postBoss: { x: 44, y: 37 },
    resonance: { x: 36, y: 4, w: 16, h: 10 },
  },
} as const;

/** Backward-compatible arrival export used by flight and recovery callers. */
export const CHANDRAPORE_LANDING = CH7_WORLD.chandrapore.landing;

interface Point { x: number; y: number }

/** Native-pixel player-foot target shared by every reciprocal Chapter 7 door. */
function nativeFeet(point: Point): { tx: number; ty: number } {
  return { tx: point.x * 16 + 8, ty: point.y * 16 + 12 };
}

function paintDisk(g: Grid, cx: number, cy: number, radius: number, tile: string): void {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius + 1) g.set(cx + x, cy + y, tile);
    }
  }
}

/** Joins authored center points as a body-safe, rounded route. */
function paintRibbon(g: Grid, points: readonly Point[], radius: number, tile: string): void {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 2;
    for (let step = 0; step <= steps; step++) {
      const t = steps === 0 ? 0 : step / steps;
      paintDisk(g, Math.round(a.x + (b.x - a.x) * t), Math.round(a.y + (b.y - a.y) * t), radius, tile);
    }
  }
}

function carveEllipse(g: Grid, cx: number, cy: number, rx: number, ry: number, tile: string): void {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) g.set(cx + x, cy + y, tile);
    }
  }
}

function facade(sprite: string, x: number, y: number): PropDef {
  return { sprite, x, y, solid: CHANDRAPORE_FACADE_SOLID };
}

/* -------------------------------------------------------------------------- */
/* CHANDRAPORE — bazaar knot, river stairs, cinema/station skyline            */

function buildChandrapore(): MapDef {
  const { w: W, h: H } = CH7_WORLD.chandrapore.size;
  const g = new Grid(W, H, 'n');

  // The river is a real southern edge. Three stepped ghat tongues and Lucille's
  // dock climb into the city rather than ending at decorative blue wallpaper.
  g.rect(0, 79, W, 9, 'e');
  g.rect(5, 67, 52, 12, 'p');
  for (let i = 0; i < 5; i++) g.rect(7 + i * 2, 73 + i, 45 - i * 5, 1, 'd');
  g.rect(12, 74, 8, 14, 'd');
  g.rect(CH7_WORLD.chandrapore.lucille.x, CH7_WORLD.chandrapore.lucille.y, 4, 1, 'd');
  g.rect(27, 74, 8, 5, 'P');

  // Three broad east-west faces and two cross-city axes make a dense learned
  // network. Narrow plaza alleys inside the blocks provide loops and shortcuts.
  g.rect(2, 20, 114, 5, 'R');
  g.rect(2, 33, 118, 5, 'R');
  g.rect(2, 48, 118, 5, 'R');
  g.rect(2, 62, 112, 5, 'R');
  g.rect(42, 20, 5, 47, 'R');
  g.rect(98, 20, 5, 47, 'R');
  for (let x = 3; x < 116; x += 3) {
    g.set(x, 22, '_'); g.set(x, 35, '_'); g.set(x, 50, '_'); g.set(x, 64, '_');
  }
  for (let y = 21; y < 67; y += 3) {
    g.set(44, y, 'D'); g.set(100, y, 'D');
  }

  // Bazaar Maze: three linked courtyards with side alleys, no ruler-grid dead
  // ends. The exact spice/chase anchors are paved as navigational teaching beats.
  g.rect(10, 39, 73, 10, 'p');
  g.rect(14, 26, 4, 23, 'p');
  g.rect(30, 25, 4, 24, 'p');
  g.rect(62, 25, 5, 24, 'p');
  g.rect(76, 25, 4, 24, 'p');
  g.rect(16, 27, 66, 4, 'p');
  g.rect(18, 41, 62, 4, 'p');
  g.rect(34, 37, 30, 4, 'p');
  g.rect(58, 51, 10, 7, 'p');
  g.rect(80, 31, 10, 7, 'p');

  // The Majestic and railway station share a crowded eastern block. The west
  // projection booth is encountered before the screening zone.
  g.rect(78, 39, 18, 10, 'p');
  g.rect(94, 43, 24, 12, 'p');
  g.rect(CH7_WORLD.chandrapore.monsoonMouth.x, CH7_WORLD.chandrapore.monsoonMouth.y, 1, 5, 'R');
  paintRibbon(g, [{ x: 44, y: 65 }, { x: 43, y: 69 }, { x: 36, y: 72 }, { x: 18, y: 72 }], 2, 'p');

  // Walls close the non-river edges after every route has been painted.
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, 0, 1, 79, 'B');
  g.rect(W - 1, 0, 1, 48, 'B');
  g.rect(W - 1, 53, 1, 26, 'B');

  // SAVE-FACING TENANCY CONTRACT. The first five sources are immutable. The
  // civic hall is always sealed; seeded occupancy locks candidate index 19.
  // Cinema/station are explicit exterior-only landmarks, leaving 20 candidates
  // and exactly 18 generated units.
  const props: PropDef[] = [
    facade('bldg_chandrapore_hillcrest_manor', 8, 28),
    facade('bldg_chandrapore_moon_gate_realty', 20, 28),
    facade('bldg_chandrapore_civic_hall', 48, 28),
    facade('bldg_chandrapore_motor_gallery', 92, 28),
    facade('bldg_chandrapore_silver_parasol', 106, 28),
    facade('bldg_chandrapore_bazaar_shop_a', 6, 43),
    facade('bldg_chandrapore_bazaar_shop_b', 18, 43),
    facade('bldg_chandrapore_market_arcade_a', 28, 43),
    facade('bldg_chandrapore_apartments_a', 54, 43),
    facade('bldg_chandrapore_market_arcade_b', 66, 43),
    facade('bldg_chandrapore_apartments_b', 102, 43),
    facade('bldg_chandrapore_bazaar_shop_a', 6, 57),
    facade('bldg_chandrapore_apartments_c', 38, 57),
    facade('bldg_chandrapore_bazaar_shop_b', 50, 57),
    facade('bldg_chandrapore_market_arcade_a', 68, 57),
    facade('bldg_chandrapore_apartments_a', 80, 57),
    facade('bldg_chandrapore_apartments_b', 92, 57),
    facade('bldg_chandrapore_bazaar_shop_a', 106, 57),
    facade('bldg_chandrapore_apartments_c', 6, 15),
    facade('bldg_chandrapore_market_arcade_b', 68, 15),
    facade('bldg_chandrapore_majestic_cinema', 82, 36),
    facade('bldg_chandrapore_station', 102, 44),

    { sprite: 'prop_chandrapore_palace_spire', x: 57, y: 2 },
    { sprite: 'market_stall_a', x: 24, y: 39, solid: STALL_SOLID },
    { sprite: 'market_stall_b', x: 52, y: 39, solid: STALL_SOLID },
    { sprite: 'market_stall_a', x: 70, y: 54, solid: STALL_SOLID },
    { sprite: 'crate', x: 57, y: 46, solid: CRATE_SOLID },
    { sprite: 'crate_bananas', x: 72, y: 45, solid: CRATE_SOLID },
    { sprite: 'bench', x: 8, y: 69, solid: BENCH_SOLID },
    { sprite: 'bench', x: 43, y: 68, solid: BENCH_SOLID },
    { sprite: 'well', x: 40, y: 42 },
    { sprite: 'payphone', x: 112, y: 54, solid: PHONE_SOLID },
    { sprite: 'picnic', x: CH7_WORLD.chandrapore.recovery.x, y: CH7_WORLD.chandrapore.recovery.y, solid: PICNIC_SOLID },
    // Permanent local footprints for the three new regional quests.
    { sprite: 'poster_stand', x: 89, y: 47, ifFlag: 'q_showing_done' },
    { sprite: 'prop_rate_board', x: 103, y: 55, ifFlag: 'q_third_class_done' },
    { sprite: 'puerto_cemetery_lamp', x: 29, y: 72, ifFlag: 'q_river_done' },
    { sprite: treeSprite(5, 68), x: 5, y: 68, solid: TREE_SOLID },
    { sprite: treeSprite(52, 69), x: 52, y: 69, solid: TREE_SOLID },
    { sprite: 'prop_trail_marker', x: 116, y: 54 },
  ];

  const spiceTriggers = CH7_WORLD.chandrapore.spicePoints.map((point, index) => ({
    id: `q_spice_find_${index + 1}`,
    rect: { x: point.x, y: point.y, w: 1, h: 1 },
    once: false,
  }));
  const riverTriggers = CH7_WORLD.chandrapore.riverClues.map((point, index) => ({
    id: `q_river_clue_${index + 1}`,
    rect: { x: point.x, y: point.y, w: 1, h: 1 },
    once: false,
  }));

  return {
    id: 'chandrapore',
    name: 'CHANDRAPORE',
    music: null,
    ambience: 'crowd',
    settlement: 'city',
    reflect: [{ x: 58, y: 79, w: 58, h: 8, within: 4 }],
    grid: g.out(),
    props,
    npcs: [
      { id: 'cp_spice_merchant', sprite: 'cp_spice_merchant', x: CH7_WORLD.chandrapore.merchant.x, y: CH7_WORLD.chandrapore.merchant.y, facing: 'down', dialogue: 'npc_cp_spice_merchant', shop: 'chandrapore_bazaar', stationary: true, idle: true, emote: 'happy' },
      { id: 'cp_dabbawala', sprite: 'cp_dabbawala', x: CH7_WORLD.chandrapore.dabbawala.x, y: CH7_WORLD.chandrapore.dabbawala.y, facing: 'down', dialogue: 'npc_cp_dabbawala', stationary: true, idle: true },
      { id: 'cp_stationmaster', sprite: 'cp_stationmaster', x: CH7_WORLD.chandrapore.stationmaster.x, y: CH7_WORLD.chandrapore.stationmaster.y, facing: 'down', dialogue: 'npc_cp_stationmaster', stationary: true, idle: true },
      { id: 'cp_usher', sprite: 'cp_usher', x: CH7_WORLD.chandrapore.usher.x, y: CH7_WORLD.chandrapore.usher.y, facing: 'down', dialogue: 'npc_cp_usher', stationary: true, idle: true, emote: 'happy' },
      { id: 'cp_ghat_elder', sprite: 'oldTimer', x: CH7_WORLD.chandrapore.ghatElder.x, y: CH7_WORLD.chandrapore.ghatElder.y, facing: 'down', dialogue: 'npc_cp_ghat_elder', stationary: true, idle: true, emote: 'think' },
    ],
    signs: [
      { x: 12, y: 68, dialogue: 'sign_chandrapore' },
      { x: 116, y: 47, dialogue: 'sign_monsoon_gate_locked', unlessFlag: 'ch7_heist_seen' },
      { x: 116, y: 47, dialogue: 'sign_monsoon_gate', ifFlag: 'ch7_heist_seen' },
      { x: 45, y: 45, dialogue: 'sign_chandrapore_court' },
      // The two exterior-only landmarks still answer a knock, satisfying the
      // Living-City contract without inventing non-canon interior map ids.
      { x: 84, y: 39, dialogue: 'cl_knock_9' },
      { x: 104, y: 48, dialogue: 'cl_knock_4' },
    ],
    phones: [{ x: 112, y: 54 }],
    atms: [{ x: 115, y: 54 }],
    doors: [
      { ...CH7_WORLD.chandrapore.monsoonMouth, to: 'monsoon_road', ...nativeFeet(CH7_WORLD.monsoonRoad.cityLanding), facing: 'right', indicator: 'none', ifFlag: 'ch7_heist_seen' },
      { ...CH7_WORLD.chandrapore.lucille, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      { id: 'ch7_arrival', rect: CH7_WORLD.chandrapore.arrival, once: true },
      { id: 'ch7_bazaar', rect: CH7_WORLD.chandrapore.bazaarApproach, once: true },
      ...spiceTriggers,
      { id: 'q_monkey_chase', rect: CH7_WORLD.chandrapore.monkeyChase, once: false },
      { id: 'q_monkey_corner', rect: CH7_WORLD.chandrapore.monkeyCorner, once: false },
      { id: 'q_last_showing_projector', rect: { x: 78, y: 43, w: 3, h: 3 }, once: false },
      { id: 'ch7_cinema', rect: CH7_WORLD.chandrapore.cinemaBeat, once: false },
      { id: 'ch7_heist', rect: CH7_WORLD.chandrapore.heist, once: false },
      ...riverTriggers,
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* MONSOON ROAD — a flooded causeway changing its relationship to water       */

function buildMonsoonRoad(): MapDef {
  const { w: W, h: H } = CH7_WORLD.monsoonRoad.size;
  const g = new Grid(W, H, 'e');

  // Causeway: below the waterline at the city, briefly broad and sheltered,
  // then raised beside drainage channels before opening into the rail yard.
  const route = [
    { x: -1, y: 54 }, { x: 10, y: 54 }, { x: 21, y: 49 },
    { x: 34, y: 44 }, { x: 48, y: 41 }, { x: 62, y: 35 },
    { x: 76, y: 27 }, { x: 89, y: 19 }, { x: 108, y: 15 },
  ] as const;
  paintRibbon(g, route, 4, 'n');
  paintRibbon(g, route, 2, 'd');

  // The chai shelter is a dry lateral pocket. The shrine is a respectful,
  // optional rain garden reached by a loop, not a loot plinth.
  carveEllipse(g, 33, 44, 11, 8, 'n');
  g.rect(26, 39, 14, 10, 'p');
  carveEllipse(g, 56, 57, 10, 6, 'n');
  paintRibbon(g, [{ x: 48, y: 41 }, { x: 50, y: 51 }, { x: 56, y: 57 }, { x: 64, y: 55 }, { x: 65, y: 34 }], 2, 'p');
  g.rect(50, 54, 13, 6, 'p');

  // A broad, striped rail apron makes the train threshold readable from afar.
  g.rect(84, 10, 21, 19, 'P');
  for (let y = 12; y < 29; y += 4) g.rect(86, y, 17, 1, '=');
  paintRibbon(g, [{ x: 76, y: 27 }, { x: 86, y: 23 }, { x: 96, y: 18 }, { x: 108, y: 15 }], 2, '=');
  g.rect(CH7_WORLD.monsoonRoad.cityMouth.x, CH7_WORLD.monsoonRoad.cityMouth.y, 1, 5, 'd');
  g.rect(CH7_WORLD.monsoonRoad.trainMouth.x, CH7_WORLD.monsoonRoad.trainMouth.y, 1, 5, '=');

  return {
    id: 'monsoon_road',
    name: 'THE MONSOON ROAD',
    music: null,
    ambience: 'rain',
    reflect: [
      { x: 2, y: 2, w: 22, h: 18, within: 4 },
      { x: 68, y: 45, w: 35, h: 18, within: 4 },
    ],
    grid: g.out(),
    props: [
      { sprite: treeSprite(15, 47), x: 15, y: 47, solid: TREE_SOLID },
      { sprite: treeSprite(44, 36), x: 44, y: 36, solid: TREE_SOLID },
      { sprite: treeSprite(67, 29), x: 67, y: 29, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 54, y: 51, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 73, y: 31, solid: ROCK_SOLID },
      { sprite: 'bench', x: 29, y: 42, solid: BENCH_SOLID },
      { sprite: 'picnic', x: CH7_WORLD.monsoonRoad.recovery.x, y: CH7_WORLD.monsoonRoad.recovery.y, solid: PICNIC_SOLID },
      { sprite: 'prop_trail_marker', x: 8, y: 50 },
      { sprite: 'prop_trail_marker', x: 79, y: 24 },
    ],
    npcs: [],
    signs: [
      { x: 7, y: 51, dialogue: 'sign_monsoon_road' },
      { x: 56, y: 56, dialogue: 'sign_chandrapore_court' },
      { x: 99, y: 20, dialogue: 'sign_palace_mouth' },
    ],
    phones: [],
    doors: [
      { ...CH7_WORLD.monsoonRoad.cityMouth, to: 'chandrapore', ...nativeFeet(CH7_WORLD.chandrapore.monsoonLanding), facing: 'left', indicator: 'none' },
      { ...CH7_WORLD.monsoonRoad.trainMouth, to: 'night_train', ...nativeFeet(CH7_WORLD.nightTrain.roadLanding), facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['rickshaw_swarm', 'spice_djinn'], count: 2, rect: { x: 13, y: 47, w: 10, h: 8 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['spice_djinn', 'temple_macaque'], count: 2, rect: { x: 42, y: 34, w: 12, h: 8 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['temple_macaque', 'naga_sentry'], count: 2, rect: { x: 68, y: 25, w: 11, h: 8 }, unlessFlag: 'cobra_raja_defeated' },
    ],
    triggers: [
      { id: 'q_third_class_inspection_1', rect: { x: 55, y: 56, w: 2, h: 2 }, once: false },
      { id: 'ch7_train_in', rect: CH7_WORLD.monsoonRoad.railYard, once: true },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* NIGHT TRAIN — nine distinct cars, couplings, theft, chase, recovery         */

function buildNightTrain(): MapDef {
  const { w: W, h: H } = CH7_WORLD.nightTrain.size;
  const g = new Grid(W, H, 'O');

  // Broad carriage floor, then transverse bulkheads with alternating doors.
  // The mandatory path repeatedly changes side instead of becoming one corridor.
  g.rect(4, 1, 40, 126, 'w');
  const bulkheads = [
    { y: 109, gap: 22 }, { y: 91, gap: 10 }, { y: 70, gap: 32 },
    { y: 45, gap: 16 }, { y: 34, gap: 24 }, { y: 16, gap: 22 },
  ] as const;
  for (const { y, gap } of bulkheads) {
    g.rect(4, y, 40, 2, 'O');
    g.rect(gap, y, 4, 2, 'w');
  }
  g.rect(22, 0, 4, 5, 'w');
  g.rect(22, 123, 4, 5, 'w');

  // Car identities: crowd benches, luggage zig-zag, dining tables, a dark
  // coupling, guarded freight, rooftop-like exposed aisle, and a quiet sleeper.
  for (let x = 7; x <= 37; x += 6) {
    g.rect(x, 119, 3, 2, 'O');
    g.rect(x, 113, 3, 2, 'O');
  }
  g.rect(7, 103, 15, 2, 'O'); g.rect(28, 98, 13, 2, 'O');
  g.rect(15, 94, 18, 2, 'O');
  for (let y = 75; y < 87; y += 5) {
    g.rect(7, y, 14, 2, 'O'); g.rect(27, y + 2, 14, 2, 'O');
  }
  g.rect(4, 64, 18, 5, 'O'); g.rect(26, 64, 18, 5, 'O');
  g.rect(8, 53, 8, 6, 'O'); g.rect(32, 50, 8, 8, 'O');
  g.rect(8, 39, 8, 3, 'O'); g.rect(34, 37, 7, 4, 'O');
  g.rect(7, 22, 10, 2, 'O'); g.rect(31, 20, 10, 2, 'O');
  g.rect(6, 7, 15, 2, 'O'); g.rect(27, 7, 15, 2, 'O');

  return {
    id: 'night_train',
    name: 'THE NIGHT TRAIN',
    music: null,
    interior: true,
    ambience: 'machine',
    muffle: 2,
    grid: g.out(),
    props: [
      { sprite: 'night_train', x: 5, y: 119 },
      { sprite: 'bench', x: 12, y: 114, solid: BENCH_SOLID },
      { sprite: 'bench', x: 31, y: 114, solid: BENCH_SOLID },
      { sprite: 'crate', x: 8, y: 103, solid: CRATE_SOLID },
      { sprite: 'crate_bananas', x: 35, y: 98, solid: CRATE_SOLID },
      { sprite: 'dining_table', x: 9, y: 82 },
      { sprite: 'dining_table', x: 34, y: 77 },
      { sprite: 'meteor_rock', x: 10, y: 55, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 35, y: 52, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 23, y: 67 },
      { sprite: 'prop_trail_marker', x: 33, y: 38 },
      { sprite: 'picnic', x: 14, y: 23, solid: PICNIC_SOLID },
    ],
    npcs: [],
    signs: [
      { x: 24, y: 124, dialogue: 'sign_night_train' },
      { x: 24, y: 5, dialogue: 'sign_palace_mouth' },
    ],
    phones: [],
    doors: [
      { ...CH7_WORLD.nightTrain.roadMouth, to: 'monsoon_road', ...nativeFeet(CH7_WORLD.monsoonRoad.trainLanding), facing: 'down', indicator: 'none' },
      { ...CH7_WORLD.nightTrain.palaceMouth, to: 'palace_throne', ...nativeFeet(CH7_WORLD.palaceThrone.entry), facing: 'up', indicator: 'none', ifFlag: 'ch7_locket_recovered' },
    ],
    spawners: [
      { enemies: ['rickshaw_swarm', 'temple_macaque'], count: 2, rect: { x: 5, y: 103, w: 8, h: 5 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['spice_djinn', 'temple_macaque'], count: 2, rect: { x: 37, y: 84, w: 6, h: 6 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['naga_sentry', 'spice_djinn'], count: 2, rect: { x: 35, y: 53, w: 7, h: 7 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['naga_sentry', 'temple_macaque'], count: 2, rect: { x: 5, y: 27, w: 7, h: 5 }, unlessFlag: 'cobra_raja_defeated' },
    ],
    triggers: [
      { id: 'q_third_class_inspection_2', rect: { x: 23, y: 107, w: 2, h: 2 }, once: false },
      { id: 'q_third_class_inspection_3', rect: { x: 33, y: 115, w: 2, h: 2 }, once: false },
      { id: 'ch7_train_chase', rect: CH7_WORLD.nightTrain.chase, once: false },
      { id: 'ch7_train_climax', rect: CH7_WORLD.nightTrain.couplingClimax, once: false },
      { id: 'ch7_locket_recovery', rect: CH7_WORLD.nightTrain.recovery, once: false },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* PALACE THRONE — royal receiving hall overtaken by a vivarium loop           */

function buildPalaceThrone(): MapDef {
  const { w: W, h: H } = CH7_WORLD.palaceThrone.size;
  const g = new Grid(W, H, 'O');

  // Receiving hall and southern entry procession.
  g.rect(28, 82, 32, 19, 'o');
  g.rect(39, 76, 10, 28, 'o');
  g.rect(42, 98, 4, 6, 'o');

  // Royal vivarium loop: a broad habitat ring around a sealed central garden.
  // Both flanks reconnect at north and south, so exploration teaches the route
  // while never creating a follower-width pinch.
  g.rect(12, 43, 64, 35, 'j');
  g.rect(30, 52, 28, 17, 'J');
  g.rect(12, 43, 64, 4, 'o');
  g.rect(12, 74, 64, 4, 'o');
  g.rect(12, 43, 5, 35, 'o');
  g.rect(71, 43, 5, 35, 'o');
  g.rect(39, 68, 10, 15, 'o');
  g.rect(39, 38, 10, 15, 'o');

  // Serpent approach admits the arena from the south only. The throne room and
  // resonance chamber are separate rooms joined after the boss line.
  g.rect(32, 34, 24, 12, 'o');
  g.rect(27, 17, 34, 18, 'o');
  g.rect(41, 13, 7, 8, 'o');
  g.rect(30, 2, 28, 13, 'o');

  return {
    id: 'palace_throne',
    name: 'THE ROYAL VIVARIUM',
    music: null,
    interior: true,
    ambience: 'birds',
    muffle: 1,
    grid: g.out(),
    props: [
      { sprite: treeSprite(20, 51), x: 20, y: 51, solid: TREE_SOLID },
      { sprite: treeSprite(65, 63), x: 65, y: 63, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 26, y: 62, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 59, y: 52, solid: ROCK_SOLID },
      { sprite: 'bench', x: 34, y: 88, solid: BENCH_SOLID },
      { sprite: 'bench', x: 51, y: 88, solid: BENCH_SOLID },
      { sprite: 'prop_trail_marker', x: 43, y: 79 },
      { sprite: 'prop_trail_marker', x: 43, y: 39 },
      { sprite: 'meteor_rock', x: 43, y: 24, solid: ROCK_SOLID },
      { sprite: 'prop_resonance_stones', x: 43, y: 7, ifFlag: 'cobra_raja_defeated' },
    ],
    npcs: [],
    signs: [
      { x: 44, y: 96, dialogue: 'sign_palace_throne', unlessFlag: 'cobra_raja_defeated' },
      { x: 44, y: 11, dialogue: 'sign_palace_throne', unlessFlag: 'cobra_raja_defeated' },
      { x: 44, y: 96, dialogue: 'sign_palace_restored', ifFlag: 'cobra_raja_defeated' },
      { x: 44, y: 11, dialogue: 'sign_palace_restored', ifFlag: 'cobra_raja_defeated' },
    ],
    phones: [],
    doors: [
      { ...CH7_WORLD.palaceThrone.trainMouth, to: 'night_train', ...nativeFeet(CH7_WORLD.nightTrain.palaceLanding), facing: 'down', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['temple_macaque', 'spice_djinn'], count: 2, rect: { x: 18, y: 48, w: 9, h: 8 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['naga_sentry', 'spice_djinn'], count: 2, rect: { x: 61, y: 62, w: 9, h: 8 }, unlessFlag: 'cobra_raja_defeated' },
      { enemies: ['naga_sentry', 'temple_macaque'], count: 2, rect: { x: 18, y: 68, w: 9, h: 6 }, unlessFlag: 'cobra_raja_defeated' },
    ],
    triggers: [
      { id: 'ch7_palace', rect: CH7_WORLD.palaceThrone.vivariumReveal, once: true },
      { id: 'ch7_raja', rect: CH7_WORLD.palaceThrone.bossApproach, once: true },
      { id: 'cobra_raja_boss', rect: CH7_WORLD.palaceThrone.boss, once: false },
      { id: 'palace_throne_resonance', rect: CH7_WORLD.palaceThrone.resonance, once: false },
    ],
  };
}

/** Build the exact Chapter 7 roster in save-stable order. */
export function buildChapter7Maps(): Record<(typeof CH7_MAP_IDS)[number], MapDef> {
  return {
    chandrapore: buildChandrapore(),
    monsoon_road: buildMonsoonRoad(),
    night_train: buildNightTrain(),
    palace_throne: buildPalaceThrone(),
  };
}
