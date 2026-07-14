/**
 * Chapter 8 — THE PAPER DRAGON.
 *
 * The map roster and every save-facing point live in CH8_WORLD. Builders,
 * migrations, developer profiles, and tests consume this registry instead of
 * repeating native-tile literals. All four builders are deterministic.
 */
import { Grid, treeSprite } from './mapkit';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;
const CRATE_SOLID = { ox: 3, oy: 8, w: 14, h: 9 } as const;
const BENCH_SOLID = { ox: 1, oy: 11, w: 22, h: 8 } as const;
// Every Lotus source master is a historical w4/u0 facade. occupyCity consumes
// this source geometry before formal-city promotion grows the art northward.
const LOTUS_FACADE_SOLID = { ox: 0, oy: 10, w: 66, h: 6 } as const;

export const CH8_MAP_IDS = [
  'lotus_harbor', 'bamboo_road', 'spore_forest', 'mt_shu_temple',
] as const;

/** Save-facing interiors produced by the 24-facade Lotus occupancy walk. Four
 * pinned historical units lead eighteen appended units; two suffix lots lock. */
export const LOTUS_HARBOR_UNIT_IDS = [
  'lotus_harbor_unit_0', 'lotus_harbor_unit_1', 'lotus_harbor_unit_2', 'lotus_harbor_unit_3',
  'lotus_harbor_unit_4', 'lotus_harbor_unit_5', 'lotus_harbor_unit_6', 'lotus_harbor_unit_7',
  'lotus_harbor_unit_8', 'lotus_harbor_unit_9', 'lotus_harbor_unit_10', 'lotus_harbor_unit_11',
  'lotus_harbor_unit_12', 'lotus_harbor_unit_13', 'lotus_harbor_unit_14', 'lotus_harbor_unit_15',
  'lotus_harbor_unit_16', 'lotus_harbor_unit_17', 'lotus_harbor_unit_18', 'lotus_harbor_unit_19',
  'lotus_harbor_unit_20', 'lotus_harbor_unit_21',
] as const;

export const CH8_WORLD = {
  lotusHarbor: {
    size: { w: 112, h: 80 },
    arrival: {
      riverboat: { x: 14, y: 68, facing: 'up' },
      city: { x: 50, y: 56, facing: 'up' },
    },
    transition: {
      bamboo: {
        mouth: { x: 109, y: 44, w: 3, h: 4 },
        landing: { x: 3, y: 51, facing: 'right' },
      },
    },
    story: {
      arrival: { x: 10, y: 64, w: 12, h: 8 },
      orientation: { x: 39, y: 52, w: 18, h: 10 },
      trustSetup: { x: 61, y: 43, w: 12, h: 8 },
      clickerSetup: { x: 78, y: 55, w: 10, h: 8 },
    },
    quest: {
      calligrapher: { x: 47, y: 45 },
      lanternGirl: { x: 37, y: 55 },
      teaMonk: { x: 55, y: 50 },
      harborMaster: { x: 29, y: 62 },
      yakHandler: { x: 91, y: 45 },
      lanternFolds: [{ x: 26, y: 66 }, { x: 39, y: 55 }, { x: 70, y: 39 }],
      harborWeights: [{ x: 23, y: 65 }, { x: 57, y: 63 }],
    },
    recovery: { x: 53, y: 57, facing: 'down' },
    vehicleBay: { x: 87, y: 65, w: 10, h: 7 },
    riverboat: { x: 8, y: 70 },
    dock: { x: 19, y: 68 },
    migration: { x: 50, y: 58, facing: 'down' },
    // One shared landing verified clear across every deterministic unit 0-21.
    unitMigration: { x: 5, y: 7, facing: 'up' },
    hotelRoom: {
      id: 'citysvc_lotus_harbor_hotel_room',
      migration: { x: 5, y: 7, facing: 'up' },
    },
    profiles: {
      arrival: { x: 14, y: 68, facing: 'up' },
      city: { x: 50, y: 56, facing: 'up' },
    },
  },
  bambooRoad: {
    size: { w: 104, h: 64 },
    transition: {
      lotus: {
        mouth: { x: 0, y: 49, w: 3, h: 4 },
        landing: { x: 108, y: 46, facing: 'left' },
      },
      spore: {
        mouth: { x: 91, y: 0, w: 6, h: 3 },
        landing: { x: 44, y: 100, facing: 'up' },
      },
    },
    story: {
      bargeCrisis: { x: 24, y: 40, w: 18, h: 12 },
      clickerClearing: { x: 28, y: 43, w: 11, h: 7 },
      trustEscalation: { x: 48, y: 31, w: 10, h: 8 },
    },
    quest: {
      yakFeed: { x: 88, y: 12 },
      yakWater: { x: 72, y: 25 },
    },
    recovery: { x: 62, y: 34, facing: 'up' },
    yakDepot: { x: 89, y: 10 },
    barge: { x: 33, y: 46 },
    migration: { x: 8, y: 51, facing: 'right' },
    profiles: {
      barge: { x: 21, y: 47, facing: 'right' },
    },
  },
  sporeForest: {
    size: { w: 88, h: 104 },
    transition: {
      bamboo: {
        mouth: { x: 40, y: 101, w: 8, h: 3 },
        landing: { x: 94, y: 4, facing: 'down' },
      },
      temple: {
        mouth: { x: 40, y: 0, w: 8, h: 3 },
        landing: { x: 48, y: 98, facing: 'up' },
      },
    },
    story: {
      scramble: { x: 38, y: 87, w: 12, h: 7 },
      trustEscalation: { x: 35, y: 47, w: 12, h: 8 },
      pippaCreases: { x: 35, y: 30, w: 12, h: 8 },
    },
    hazards: [
      { id: 'mushroomize_0', rect: { x: 29, y: 80, w: 17, h: 9 }, phase: 0 },
      { id: 'mushroomize_1', rect: { x: 47, y: 49, w: 16, h: 12 }, phase: 1 },
      { id: 'mushroomize_2', rect: { x: 23, y: 22, w: 18, h: 11 }, phase: 2 },
    ],
    safePockets: [{ x: 17, y: 87 }, { x: 17, y: 69 }, { x: 58, y: 65 }, { x: 27, y: 42 }, { x: 57, y: 17 }],
    safeExits: [{ x: 44, y: 97 }, { x: 17, y: 76 }, { x: 58, y: 68 }, { x: 27, y: 37 }],
    quest: {
      brushes: [
        { id: 'river', x: 61, y: 85, flag: 'q_brush_river' },
        { id: 'kiln', x: 19, y: 55, flag: 'q_brush_kiln' },
        { id: 'cloud', x: 58, y: 25, flag: 'q_brush_cloud' },
      ],
    },
    kiln: { x: 67, y: 42 },
    recovery: { x: 17, y: 70, facing: 'up' },
    yakPickup: { x: 44, y: 7 },
    migration: { x: 44, y: 96, facing: 'up' },
    profiles: {
      mushroomized: { x: 34, y: 84, facing: 'right' },
      forestCured: { x: 17, y: 70, facing: 'up' },
      brushes: { x: 54, y: 28, facing: 'right' },
      yak: { x: 44, y: 8, facing: 'up' },
    },
  },
  mtShuTemple: {
    size: { w: 96, h: 104 },
    transition: {
      spore: {
        mouth: { x: 44, y: 101, w: 8, h: 3 },
        landing: { x: 44, y: 4, facing: 'down' },
      },
    },
    yakArrival: { x: 48, y: 94, facing: 'up' },
    story: {
      falseFolds: { x: 31, y: 64, w: 34, h: 11 },
      trustClimax: { x: 35, y: 55, w: 26, h: 8 },
      elderBeta: { x: 41, y: 45, w: 14, h: 7 },
      paperDragon: { x: 39, y: 27, w: 18, h: 7 },
    },
    bossArena: { x: 29, y: 19, w: 38, h: 17 },
    bossRestart: { x: 48, y: 39, facing: 'up' },
    earlyBell: { x: 40, y: 12, w: 16, h: 5 },
    resonanceApproach: { x: 48, y: 9, facing: 'up' },
    resonance: { x: 41, y: 4, w: 14, h: 6 },
    quest: {
      emptyChair: { x: 70, y: 54 },
    },
    recovery: { x: 48, y: 40, facing: 'up' },
    migration: { x: 48, y: 96, facing: 'up' },
    profiles: {
      temple: { x: 48, y: 72, facing: 'up' },
      boss: { x: 48, y: 39, facing: 'up' },
      postBoss: { x: 48, y: 39, facing: 'up' },
      complete: { x: 48, y: 9, facing: 'up' },
    },
  },
} as const;

/** Backward-compatible arrival used by flight/recovery callers. */
export const LOTUS_HARBOR_LANDING = CH8_WORLD.lotusHarbor.arrival.riverboat;

interface Point { x: number; y: number }

/** Convert a native tile to the player's native-pixel feet. */
export function nativeFeet(point: Point): { tx: number; ty: number } {
  return { tx: point.x * 16 + 8, ty: point.y * 16 + 12 };
}

function paintDisk(g: Grid, cx: number, cy: number, radius: number, tile: string): void {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius + 1) g.set(cx + x, cy + y, tile);
    }
  }
}

/** Connect fixed centers with a rounded, follower-safe route. */
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
  return { sprite, x, y, solid: LOTUS_FACADE_SOLID };
}

/* -------------------------------------------------------------------------- */
/* LOTUS HARBOR — a crescent working river city in three terraces              */

function buildLotusHarbor(): MapDef {
  const { w: W, h: H } = CH8_WORLD.lotusHarbor.size;
  const g = new Grid(W, H, 'n');

  // The river occupies the whole south edge; three stone tongues keep it visible
  // from arrival, the market bridge, and the civic approach.
  g.rect(0, 70, W, 10, 'e');
  g.rect(5, 66, 22, 14, 'd');
  g.rect(44, 67, 14, 13, 'd');
  g.rect(82, 67, 18, 13, 'd');
  g.rect(8, 68, 15, 5, 'p');

  // Three broad curved terraces and two cross-lanes form the fan. Long R bands
  // retain the formal-city street grammar while rounded p mouths break the grid.
  g.rect(4, 28, 101, 5, 'R');
  g.rect(4, 42, 108, 5, 'R');
  g.rect(4, 54, 100, 5, 'R');
  g.rect(4, 63, 101, 5, 'R');
  g.rect(48, 28, 5, 40, 'R');
  g.rect(84, 42, 5, 27, 'R');
  paintRibbon(g, [{ x: 14, y: 68 }, { x: 28, y: 62 }, { x: 43, y: 56 }, { x: 61, y: 46 }, { x: 85, y: 45 }, { x: 111, y: 46 }], 3, 'p');
  paintRibbon(g, [{ x: 19, y: 68 }, { x: 31, y: 54 }, { x: 48, y: 45 }, { x: 68, y: 39 }, { x: 92, y: 45 }], 2, 'p');
  paintRibbon(g, [{ x: 49, y: 67 }, { x: 55, y: 57 }, { x: 72, y: 46 }, { x: 93, y: 31 }], 2, 'p');
  carveEllipse(g, 52, 56, 10, 7, 'p');
  carveEllipse(g, 74, 45, 9, 6, 'p');
  g.rect(CH8_WORLD.lotusHarbor.vehicleBay.x, CH8_WORLD.lotusHarbor.vehicleBay.y, CH8_WORLD.lotusHarbor.vehicleBay.w, CH8_WORLD.lotusHarbor.vehicleBay.h, 'P');
  g.rect(CH8_WORLD.lotusHarbor.transition.bamboo.mouth.x, CH8_WORLD.lotusHarbor.transition.bamboo.mouth.y, CH8_WORLD.lotusHarbor.transition.bamboo.mouth.w, CH8_WORLD.lotusHarbor.transition.bamboo.mouth.h, 'R');

  // Close every non-river edge after carving the body-clear road mouth.
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, 0, 1, 70, 'B');
  g.rect(W - 1, 0, 1, 44, 'B');
  g.rect(W - 1, 48, 1, 22, 'B');

  // SAVE-FACING TENANCY PREFIX. The first four occupancy candidates must stay
  // lantern, tea, temple, tea. maps.ts pins them unlocked; all later lots append
  // at unit_4 without changing these IDs or service assignments.
  const props: PropDef[] = [
    facade('bldg_lotus_harbor_lantern_shop', 22, 51),
    facade('bldg_lotus_harbor_tea_house', 34, 51),
    facade('bldg_lotus_harbor_temple', 66, 39),
    facade('bldg_lotus_harbor_tea_house', 46, 51),

    facade('bldg_lotus_harbor_grand_market', 10, 39),
    facade('bldg_lotus_harbor_harbor_office', 22, 39),
    facade('bldg_lotus_harbor_pagoda', 34, 39),
    facade('bldg_lotus_harbor_row_house', 46, 39),
    facade('bldg_lotus_harbor_theater', 78, 39),
    facade('bldg_lotus_harbor_lantern_shop', 90, 39),
    facade('bldg_lotus_harbor_row_house', 10, 60),
    facade('bldg_lotus_harbor_tea_house', 34, 60),
    facade('bldg_lotus_harbor_lantern_shop', 46, 60),
    facade('bldg_lotus_harbor_row_house', 58, 60),
    facade('bldg_lotus_harbor_harbor_office', 70, 60),
    facade('bldg_lotus_harbor_row_house', 82, 60),
    facade('bldg_lotus_harbor_tea_house', 94, 60),
    facade('bldg_lotus_harbor_grand_market', 8, 25),
    facade('bldg_lotus_harbor_row_house', 20, 25),
    facade('bldg_lotus_harbor_lantern_shop', 32, 25),
    facade('bldg_lotus_harbor_pagoda', 44, 25),
    facade('bldg_lotus_harbor_theater', 70, 25),
    facade('bldg_lotus_harbor_harbor_office', 82, 25),
    facade('bldg_lotus_harbor_row_house', 94, 25),

    { sprite: 'riverboat', x: CH8_WORLD.lotusHarbor.riverboat.x, y: CH8_WORLD.lotusHarbor.riverboat.y, scale: 0.72 },
    { sprite: 'puerto_mooring_bollards', x: CH8_WORLD.lotusHarbor.dock.x, y: CH8_WORLD.lotusHarbor.dock.y },
    { sprite: 'market_stall_a', x: 31, y: 48, solid: { ox: 6, oy: 20, w: 28, h: 12 } },
    { sprite: 'market_stall_b', x: 59, y: 48, solid: { ox: 6, oy: 20, w: 28, h: 12 } },
    { sprite: 'market_stall_c', x: 75, y: 51, solid: { ox: 6, oy: 20, w: 28, h: 12 } },
    { sprite: 'crate', x: 24, y: 69, solid: CRATE_SOLID, unlessFlag: 'q_harbor_balance_done' },
    { sprite: 'crate_bananas', x: 57, y: 66, solid: CRATE_SOLID, unlessFlag: 'q_harbor_balance_done' },
    { sprite: 'puerto_mooring_bollards', x: 46, y: 69 },
    { sprite: 'payphone', x: 51, y: 57, solid: PHONE_SOLID },
    // Keep the blanket beside, not on top of, the frozen recovery feet point.
    { sprite: 'picnic', x: CH8_WORLD.lotusHarbor.recovery.x + 1, y: CH8_WORLD.lotusHarbor.recovery.y, solid: PICNIC_SOLID },
    { sprite: treeSprite(5, 61), x: 5, y: 61, solid: TREE_SOLID },
    { sprite: treeSprite(105, 36), x: 105, y: 36, solid: TREE_SOLID },
    { sprite: 'well', x: 63, y: 48 },
    { sprite: 'prop_trail_marker', x: 106, y: 43 },
    // Persistent local quest footprints: completed work changes the harbor,
    // rather than living only as a journal flag.
    { sprite: 'minimus_banner', x: 47, y: 43, ifFlag: 'q_brushes_done' },
    { sprite: 'prop_tool_shelf', x: 44, y: 44, ifFlag: 'q_brushes_done' },
    ...CH8_WORLD.lotusHarbor.quest.lanternFolds.map((point) => ({
      sprite: 'festival_lantern_span', x: point.x - 2, y: point.y - 3,
      // The inverted, slightly pinched span is the readable tooth-fold state;
      // completion replaces it with the upright full-scale crane arrangement.
      rot: 180, scale: 0.86, unlessFlag: 'q_false_fold_lanterns_done',
    } as PropDef)),
    ...CH8_WORLD.lotusHarbor.quest.lanternFolds.map((point) => ({
      sprite: 'festival_lantern_span', x: point.x - 2, y: point.y - 3,
      ifFlag: 'q_false_fold_lanterns_done',
    } as PropDef)),
    ...CH8_WORLD.lotusHarbor.quest.harborWeights.map((point, index) => ({
      // Cast-iron tide weights read as small mooring weights until recovered.
      sprite: 'puerto_mooring_bollards', x: point.x - 0.5, y: point.y - 1,
      scale: 0.45, unlessFlag: `q_harbor_balance_weight_${index + 1}`,
    } as PropDef)),
    { sprite: 'prop_rate_board', x: 29, y: 59, ifFlag: 'q_harbor_balance_done' },
    { sprite: 'shelf_b', x: 59, y: 47, ifFlag: 'q_harbor_balance_done' },
    { sprite: 'gift_box', x: 14, y: 61, solid: CRATE_SOLID, unlessFlag: 'q_lotus_jade_cache' },
    { sprite: 'gift_box_open', x: 14, y: 61, ifFlag: 'q_lotus_jade_cache' },
  ];

  const lanternTriggers = CH8_WORLD.lotusHarbor.quest.lanternFolds.map((point, index) => ({
    id: `q_false_fold_lantern_${index + 1}`,
    rect: { x: point.x, y: point.y, w: 1, h: 1 },
    once: false,
  }));
  const weightTriggers = CH8_WORLD.lotusHarbor.quest.harborWeights.map((point, index) => ({
    id: `q_harbor_balance_weight_${index + 1}`,
    rect: { x: point.x, y: point.y, w: 1, h: 1 },
    once: false,
  }));

  return {
    id: 'lotus_harbor',
    name: 'LOTUS HARBOR',
    music: null,
    ambience: 'waves',
    settlement: 'city',
    reflect: [{ x: 0, y: 70, w: 112, h: 10, within: 5 }],
    grid: g.out(),
    props,
    npcs: [
      { id: 'lh_harbor_master', sprite: 'lh_harbor_master', x: CH8_WORLD.lotusHarbor.quest.harborMaster.x, y: CH8_WORLD.lotusHarbor.quest.harborMaster.y, facing: 'down', dialogue: 'npc_lh_harbor_master', shop: 'lotus_harbor_market', stationary: true, idle: true },
      { id: 'lh_calligrapher', sprite: 'lh_calligrapher', x: CH8_WORLD.lotusHarbor.quest.calligrapher.x, y: CH8_WORLD.lotusHarbor.quest.calligrapher.y, facing: 'down', dialogue: 'npc_lh_calligrapher', stationary: true, idle: true },
      { id: 'lh_lantern_girl', sprite: 'lh_lantern_girl', x: CH8_WORLD.lotusHarbor.quest.lanternGirl.x, y: CH8_WORLD.lotusHarbor.quest.lanternGirl.y, facing: 'down', dialogue: 'npc_lh_lantern_girl', stationary: true, idle: true, emote: 'happy' },
      { id: 'lh_tea_monk', sprite: 'lh_tea_monk', x: CH8_WORLD.lotusHarbor.quest.teaMonk.x, y: CH8_WORLD.lotusHarbor.quest.teaMonk.y, facing: 'down', dialogue: 'npc_lh_tea_monk', stationary: true, idle: true },
      { id: 'lh_yak_handler', sprite: 'lh_yak_handler', x: CH8_WORLD.lotusHarbor.quest.yakHandler.x, y: CH8_WORLD.lotusHarbor.quest.yakHandler.y, facing: 'down', dialogue: 'npc_lh_yak_handler', stationary: true, idle: true },
    ],
    signs: [
      { x: 12, y: 64, dialogue: 'sign_lotus_harbor' },
      { x: 106, y: 43, dialogue: 'sign_bamboo_gate' },
      { x: 55, y: 49, dialogue: 'sign_lotus_harbor_court' },
      { x: 47, y: 44, dialogue: 'q_brushes_footprint_rack', ifFlag: 'q_brushes_done' },
      { x: 37, y: 55, dialogue: 'q_false_fold_footprint', ifFlag: 'q_false_fold_lanterns_done' },
      { x: 29, y: 59, dialogue: 'q_harbor_balance_footprint', ifFlag: 'q_harbor_balance_done' },
      { x: 13, y: 61, dialogue: 'q_lotus_jade_cache', unlessFlag: 'q_lotus_jade_cache' },
    ],
    phones: [{ x: 51, y: 57 }],
    atms: [{ x: 31, y: 62 }],
    doors: [
      { ...CH8_WORLD.lotusHarbor.transition.bamboo.mouth, to: 'bamboo_road', ...nativeFeet(CH8_WORLD.lotusHarbor.transition.bamboo.landing), facing: 'right', indicator: 'none' },
      { x: 10, y: 69, w: 8, h: 3, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      { id: 'ch8_arrival', rect: CH8_WORLD.lotusHarbor.story.arrival, once: true },
      { id: 'ch8_orientation', rect: CH8_WORLD.lotusHarbor.story.orientation, once: true },
      { id: 'ch8_trust_setup', rect: CH8_WORLD.lotusHarbor.story.trustSetup, once: true },
      { id: 'ch8_clicker_setup', rect: CH8_WORLD.lotusHarbor.story.clickerSetup, once: true },
      ...lanternTriggers,
      ...weightTriggers,
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* BAMBOO ROAD — river braids, public lock, and switchback ascent               */

function buildBambooRoad(): MapDef {
  const { w: W, h: H } = CH8_WORLD.bambooRoad.size;
  const g = new Grid(W, H, 'J');

  // Pools are cut first; two broad braids and three mountain switchbacks are
  // then painted over them, guaranteeing follower-safe bridges and bends.
  carveEllipse(g, 30, 48, 15, 9, 'e');
  carveEllipse(g, 57, 34, 13, 8, 'e');
  carveEllipse(g, 78, 20, 11, 7, 'e');
  const lower = [{ x: 0, y: 51 }, { x: 12, y: 51 }, { x: 21, y: 47 }, { x: 33, y: 46 }, { x: 46, y: 39 }, { x: 62, y: 34 }] as const;
  const lowerTwin = [{ x: 5, y: 51 }, { x: 14, y: 43 }, { x: 27, y: 38 }, { x: 40, y: 42 }, { x: 51, y: 37 }, { x: 62, y: 34 }] as const;
  const upper = [{ x: 62, y: 34 }, { x: 76, y: 31 }, { x: 88, y: 25 }, { x: 69, y: 20 }, { x: 86, y: 14 }, { x: 94, y: 4 }, { x: 94, y: 0 }] as const;
  paintRibbon(g, lower, 3, 'j');
  paintRibbon(g, lowerTwin, 2, 'j');
  paintRibbon(g, upper, 3, 'j');
  paintRibbon(g, [{ x: 27, y: 38 }, { x: 34, y: 52 }, { x: 47, y: 48 }, { x: 46, y: 39 }], 2, 'j');
  paintRibbon(g, [{ x: 69, y: 20 }, { x: 72, y: 25 }, { x: 88, y: 25 }], 2, 'j');
  carveEllipse(g, CH8_WORLD.bambooRoad.recovery.x, CH8_WORLD.bambooRoad.recovery.y, 7, 5, 'p');
  g.rect(CH8_WORLD.bambooRoad.transition.lotus.mouth.x, CH8_WORLD.bambooRoad.transition.lotus.mouth.y, CH8_WORLD.bambooRoad.transition.lotus.mouth.w, CH8_WORLD.bambooRoad.transition.lotus.mouth.h, 'j');
  g.rect(CH8_WORLD.bambooRoad.transition.spore.mouth.x, CH8_WORLD.bambooRoad.transition.spore.mouth.y, CH8_WORLD.bambooRoad.transition.spore.mouth.w, CH8_WORLD.bambooRoad.transition.spore.mouth.h, 'j');

  return {
    id: 'bamboo_road',
    name: 'THE BAMBOO ROAD',
    music: null,
    ambience: 'wind',
    grid: g.out(),
    props: [
      { sprite: 'riverboat', x: CH8_WORLD.bambooRoad.barge.x, y: CH8_WORLD.bambooRoad.barge.y, scale: 0.55, unlessFlag: 'thread_clicker_clearing' },
      { sprite: 'riverboat', x: 39, y: 50, scale: 0.55, ifFlag: 'thread_clicker_clearing' },
      // The recovered public lock remains visible after the Clicker scene: its
      // crane is reset over the safe sluice and freshly painted signal-red.
      { sprite: 'puerto_cargo_crane', x: 35, y: 42, scale: 0.68, ifFlag: 'thread_clicker_clearing' },
      { sprite: 'yak_express', x: CH8_WORLD.bambooRoad.yakDepot.x, y: CH8_WORLD.bambooRoad.yakDepot.y, scale: 0.58, unlessFlag: 'q_yak_waits_done' },
      { sprite: 'yak_express', x: CH8_WORLD.bambooRoad.quest.yakWater.x, y: CH8_WORLD.bambooRoad.quest.yakWater.y, scale: 0.58, ifFlag: 'q_yak_waits_done' },
      { sprite: 'puerto_harbor_bell', x: CH8_WORLD.bambooRoad.yakDepot.x - 2, y: CH8_WORLD.bambooRoad.yakDepot.y, ifFlag: 'q_yak_waits_done' },
      // Before the route objective is repaired, the dry dish and broken-route
      // marker make both halves of the interaction visible in the world.
      { sprite: 'well', x: CH8_WORLD.bambooRoad.quest.yakWater.x, y: CH8_WORLD.bambooRoad.quest.yakWater.y, unlessFlag: 'q_yak_waits_route' },
      { sprite: 'prop_trail_marker', x: CH8_WORLD.bambooRoad.quest.yakWater.x + 3, y: CH8_WORLD.bambooRoad.quest.yakWater.y - 1, unlessFlag: 'q_yak_waits_route' },
      { sprite: 'puerto_mooring_bollards', x: 29, y: 48 },
      { sprite: 'prop_guardrail', x: 38, y: 43 },
      { sprite: 'prop_guardrail', x: 70, y: 22 },
      { sprite: 'bench', x: 60, y: 32, solid: BENCH_SOLID },
      { sprite: 'crate', x: 86, y: 12, solid: CRATE_SOLID },
      { sprite: 'crate_bananas', x: 91, y: 12, solid: CRATE_SOLID },
      { sprite: 'prop_trail_marker', x: 4, y: 48 },
      { sprite: 'prop_trail_marker', x: 94, y: 5 },
      { sprite: 'edge_bamboo_a', x: 18, y: 39 },
      { sprite: 'edge_bamboo_b', x: 53, y: 28 },
      { sprite: 'edge_bamboo_c', x: 81, y: 11 },
      { sprite: 'gift_box', x: 35, y: 54, solid: CRATE_SOLID, ifFlag: 'thread_clicker_clearing', unlessFlag: 'q_bamboo_islet_cache' },
      { sprite: 'gift_box_open', x: 35, y: 54, ifFlag: 'q_bamboo_islet_cache' },
    ],
    npcs: [
      { id: 'lotus_bargeman', sprite: 'lotus_bargeman', x: 39, y: 43, facing: 'left', dialogue: 'npc_lotus_bargeman', ifFlag: 'thread_clicker_clearing', stationary: true, idle: true },
    ],
    signs: [
      { x: 5, y: 49, dialogue: 'sign_bamboo_road' },
      { x: 94, y: 5, dialogue: 'sign_spore_forest_mouth' },
      { x: 40, y: 42, dialogue: 'ch8_lock_footprint', ifFlag: 'thread_clicker_clearing' },
      { x: 89, y: 10, dialogue: 'q_yak_waits_footprint', ifFlag: 'q_yak_waits_done' },
      { x: 34, y: 54, dialogue: 'q_bamboo_islet_cache', ifFlag: 'thread_clicker_clearing', unlessFlag: 'q_bamboo_islet_cache' },
    ],
    phones: [],
    doors: [
      { ...CH8_WORLD.bambooRoad.transition.lotus.mouth, to: 'lotus_harbor', ...nativeFeet(CH8_WORLD.bambooRoad.transition.lotus.landing), facing: 'left', indicator: 'none' },
      { ...CH8_WORLD.bambooRoad.transition.spore.mouth, to: 'spore_forest', ...nativeFeet(CH8_WORLD.bambooRoad.transition.spore.landing), facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['paper_lantern_wisp', 'origami_warrior'], count: 2, rect: { x: 10, y: 43, w: 12, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['spore_puffer', 'origami_warrior'], count: 2, rect: { x: 43, y: 29, w: 12, h: 9 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['paper_lantern_wisp', 'spore_puffer'], count: 3, rect: { x: 74, y: 14, w: 11, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
    ],
    triggers: [
      { id: 'ch8_barge_crisis', rect: CH8_WORLD.bambooRoad.story.bargeCrisis, once: true },
      { id: 'ch8_clicker_clearing', rect: CH8_WORLD.bambooRoad.story.clickerClearing, once: true },
      { id: 'ch8_trust_escalation', rect: CH8_WORLD.bambooRoad.story.trustEscalation, once: true },
      { id: 'q_yak_waits_feed', rect: { ...CH8_WORLD.bambooRoad.quest.yakFeed, w: 1, h: 1 }, once: false },
      { id: 'q_yak_waits_route', rect: { ...CH8_WORLD.bambooRoad.quest.yakWater, w: 1, h: 1 }, once: false },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* SPORE FOREST — organic loops with explicit clean-margin retreats             */

function buildSporeForest(): MapDef {
  const { w: W, h: H } = CH8_WORLD.sporeForest.size;
  const g = new Grid(W, H, 'J');

  // A clean trunk reaches every region. Three asymmetric loops reconnect to it;
  // safe pockets and exits are carved after hazards so each retreat remains open.
  const trunk = [{ x: 44, y: 104 }, { x: 44, y: 97 }, { x: 38, y: 88 }, { x: 29, y: 76 }, { x: 31, y: 64 }, { x: 45, y: 54 }, { x: 36, y: 44 }, { x: 28, y: 34 }, { x: 43, y: 22 }, { x: 57, y: 17 }, { x: 44, y: 4 }, { x: 44, y: 0 }] as const;
  paintRibbon(g, trunk, 2, 'j');
  paintRibbon(g, [{ x: 38, y: 88 }, { x: 17, y: 87 }, { x: 17, y: 69 }, { x: 29, y: 76 }], 2, 'j');
  // A clean outer return skirts the first spore belt entirely; a scrambled
  // player can retreat from the low loop without crossing the hazard again.
  paintRibbon(g, [{ x: 44, y: 97 }, { x: 31, y: 95 }, { x: 17, y: 87 }], 2, 'j');
  paintRibbon(g, [{ x: 31, y: 64 }, { x: 19, y: 55 }, { x: 27, y: 42 }, { x: 36, y: 44 }], 2, 'j');
  paintRibbon(g, [{ x: 45, y: 54 }, { x: 58, y: 65 }, { x: 69, y: 55 }, { x: 67, y: 42 }, { x: 58, y: 25 }, { x: 43, y: 22 }], 2, 'j');
  paintRibbon(g, [{ x: 17, y: 69 }, { x: 27, y: 58 }, { x: 31, y: 64 }], 2, 'j');
  paintRibbon(g, [{ x: 27, y: 42 }, { x: 42, y: 36 }, { x: 58, y: 25 }], 2, 'j');
  for (const hazard of CH8_WORLD.sporeForest.hazards) g.rect(hazard.rect.x, hazard.rect.y, hazard.rect.w, hazard.rect.h, 'j');
  for (const pocket of CH8_WORLD.sporeForest.safePockets) paintDisk(g, pocket.x, pocket.y, 4, 'p');
  for (const exit of CH8_WORLD.sporeForest.safeExits) paintDisk(g, exit.x, exit.y, 2, 'p');
  paintRibbon(g, [{ x: 48, y: 84 }, { x: 61, y: 85 }], 2, 'j');
  g.rect(CH8_WORLD.sporeForest.transition.bamboo.mouth.x, CH8_WORLD.sporeForest.transition.bamboo.mouth.y, CH8_WORLD.sporeForest.transition.bamboo.mouth.w, CH8_WORLD.sporeForest.transition.bamboo.mouth.h, 'j');
  g.rect(CH8_WORLD.sporeForest.transition.temple.mouth.x, CH8_WORLD.sporeForest.transition.temple.mouth.y, CH8_WORLD.sporeForest.transition.temple.mouth.w, CH8_WORLD.sporeForest.transition.temple.mouth.h, 'j');
  paintDisk(g, CH8_WORLD.sporeForest.kiln.x, CH8_WORLD.sporeForest.kiln.y, 5, 'p');
  paintDisk(g, CH8_WORLD.sporeForest.yakPickup.x, CH8_WORLD.sporeForest.yakPickup.y, 5, 'p');

  const brushTriggers = CH8_WORLD.sporeForest.quest.brushes.map((brush) => ({
    id: brush.flag,
    rect: { x: brush.x, y: brush.y, w: 1, h: 1 },
    once: false,
  }));
  const brushProps: PropDef[] = CH8_WORLD.sporeForest.quest.brushes.flatMap((brush) => [
    { sprite: 'poster_stand', x: brush.x, y: brush.y, unlessFlag: brush.flag },
    { sprite: 'prop_rate_board', x: brush.x, y: brush.y, ifFlag: brush.flag },
  ]);

  return {
    id: 'spore_forest',
    name: 'THE SPORE FOREST',
    music: null,
    ambience: 'wind',
    grid: g.out(),
    props: [
      ...brushProps,
      { sprite: 'valle_pottery_kiln', x: CH8_WORLD.sporeForest.kiln.x, y: CH8_WORLD.sporeForest.kiln.y },
      { sprite: 'yak_express', x: CH8_WORLD.sporeForest.yakPickup.x, y: CH8_WORLD.sporeForest.yakPickup.y, scale: 0.58 },
      { sprite: 'picnic', x: CH8_WORLD.sporeForest.recovery.x - 2, y: CH8_WORLD.sporeForest.recovery.y, solid: PICNIC_SOLID },
      { sprite: 'payphone', x: 20, y: 70, solid: PHONE_SOLID },
      { sprite: 'glow_shroom', x: 30, y: 84 },
      { sprite: 'glow_shroom_b', x: 52, y: 55 },
      { sprite: 'edge_spore_a', x: 13, y: 83 },
      { sprite: 'edge_spore_b', x: 62, y: 61 },
      { sprite: 'edge_spore_a', x: 25, y: 28 },
      { sprite: 'edge_spore_b', x: 54, y: 13 },
      { sprite: 'gift_box', x: 72, y: 43, solid: CRATE_SOLID, ifFlag: 'porcelain_warlord_defeated', unlessFlag: 'q_spore_kiln_cache' },
      { sprite: 'gift_box_open', x: 72, y: 43, ifFlag: 'q_spore_kiln_cache' },
      { sprite: 'prop_trail_marker', x: 43, y: 98 },
      { sprite: 'prop_trail_marker', x: 45, y: 6 },
    ],
    npcs: [],
    signs: [
      { x: 42, y: 97, dialogue: 'sign_spore_forest' },
      { x: 71, y: 43, dialogue: 'q_spore_kiln_cache', ifFlag: 'porcelain_warlord_defeated', unlessFlag: 'q_spore_kiln_cache' },
    ],
    phones: [{ x: 20, y: 70 }],
    doors: [
      { ...CH8_WORLD.sporeForest.transition.bamboo.mouth, to: 'bamboo_road', ...nativeFeet(CH8_WORLD.sporeForest.transition.bamboo.landing), facing: 'down', indicator: 'none' },
      // The Yak ledge is a vertical mountain transfer: its fixed Mt. Shu
      // transition landing remains the reciprocal route seam. The pending Yak
      // arrival beat stages the party at mtShuTemple.yakArrival on map entry.
      { ...CH8_WORLD.sporeForest.transition.temple.mouth, to: 'mt_shu_temple', ...nativeFeet(CH8_WORLD.sporeForest.transition.temple.landing), facing: CH8_WORLD.sporeForest.transition.temple.landing.facing, indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['paper_lantern_wisp', 'spore_puffer'], count: 2, rect: { x: 49, y: 80, w: 11, h: 9 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['spore_puffer', 'origami_warrior'], count: 2, rect: { x: 15, y: 45, w: 8, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['origami_warrior', 'porcelain_warlord'], count: 2, rect: { x: 59, y: 44, w: 13, h: 9 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['paper_lantern_wisp', 'porcelain_warlord'], count: 3, rect: { x: 47, y: 10, w: 10, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
    ],
    triggers: [
      { id: 'spore_forest_scramble', rect: CH8_WORLD.sporeForest.story.scramble, once: true },
      { id: 'ch8_spore_trust', rect: CH8_WORLD.sporeForest.story.trustEscalation, once: true },
      { id: 'ch8_pippa_creases', rect: CH8_WORLD.sporeForest.story.pippaCreases, once: true },
      ...CH8_WORLD.sporeForest.hazards.map((hazard) => ({ id: hazard.id, rect: hazard.rect, once: false })),
      ...brushTriggers,
      { id: 'porcelain_warlord_encounter', rect: { x: 64, y: 39, w: 8, h: 8 }, once: false },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* MT. SHU TEMPLE — folded processional courts, boss, then gated bell           */

function buildMtShuTemple(): MapDef {
  const { w: W, h: H } = CH8_WORLD.mtShuTemple.size;
  const g = new Grid(W, H, 'B');

  // Alternating stairs read like an opened fold. Broad courts hold the authored
  // story rectangles; the boss arena and resonance court are separate rooms.
  g.rect(36, 90, 25, 14, 'p');
  paintRibbon(g, [{ x: 48, y: 102 }, { x: 48, y: 94 }, { x: 24, y: 84 }, { x: 24, y: 72 }, { x: 72, y: 70 }, { x: 72, y: 59 }, { x: 48, y: 58 }, { x: 24, y: 50 }, { x: 24, y: 42 }, { x: 48, y: 40 }], 3, 'p');
  g.rect(CH8_WORLD.mtShuTemple.story.falseFolds.x, CH8_WORLD.mtShuTemple.story.falseFolds.y, CH8_WORLD.mtShuTemple.story.falseFolds.w, CH8_WORLD.mtShuTemple.story.falseFolds.h, 'p');
  g.rect(CH8_WORLD.mtShuTemple.story.trustClimax.x, CH8_WORLD.mtShuTemple.story.trustClimax.y, CH8_WORLD.mtShuTemple.story.trustClimax.w, CH8_WORLD.mtShuTemple.story.trustClimax.h, 'p');
  g.rect(CH8_WORLD.mtShuTemple.story.elderBeta.x, CH8_WORLD.mtShuTemple.story.elderBeta.y, CH8_WORLD.mtShuTemple.story.elderBeta.w, CH8_WORLD.mtShuTemple.story.elderBeta.h, 'p');
  g.rect(36, 36, 25, 12, 'p');
  paintRibbon(g, [{ x: 60, y: 59 }, { x: 70, y: 54 }], 2, 'p');
  g.rect(CH8_WORLD.mtShuTemple.bossArena.x, CH8_WORLD.mtShuTemple.bossArena.y, CH8_WORLD.mtShuTemple.bossArena.w, CH8_WORLD.mtShuTemple.bossArena.h, 'p');
  g.rect(44, 14, 8, 6, 'p');
  g.rect(CH8_WORLD.mtShuTemple.earlyBell.x, CH8_WORLD.mtShuTemple.earlyBell.y, CH8_WORLD.mtShuTemple.earlyBell.w, CH8_WORLD.mtShuTemple.earlyBell.h, 'p');
  g.rect(44, 9, 8, 5, 'p');
  g.rect(CH8_WORLD.mtShuTemple.resonance.x, CH8_WORLD.mtShuTemple.resonance.y, CH8_WORLD.mtShuTemple.resonance.w, CH8_WORLD.mtShuTemple.resonance.h, 'p');
  g.rect(CH8_WORLD.mtShuTemple.transition.spore.mouth.x, CH8_WORLD.mtShuTemple.transition.spore.mouth.y, CH8_WORLD.mtShuTemple.transition.spore.mouth.w, CH8_WORLD.mtShuTemple.transition.spore.mouth.h, 'p');

  return {
    id: 'mt_shu_temple',
    name: 'MT. SHU TEMPLE',
    music: null,
    ambience: 'wind',
    grid: g.out(),
    props: [
      { sprite: 'yak_express', x: 43, y: 94, scale: 0.58 },
      { sprite: 'picnic', x: CH8_WORLD.mtShuTemple.recovery.x + 1, y: CH8_WORLD.mtShuTemple.recovery.y, solid: PICNIC_SOLID },
      { sprite: 'payphone', x: 52, y: 40, solid: PHONE_SOLID },
      // Keep the bell physically sealed until the unique Fan transaction has
      // committed; a full bag can never turn victory into a reward bypass.
      { sprite: 'pyramid_gate', x: 44, y: 17, solid: { ox: 0, oy: 0, w: 128, h: 16 }, unlessFlag: 'paper_fan_claimed' },
      { sprite: 'puerto_harbor_bell', x: 46, y: 10 },
      { sprite: 'idol_shrine', x: 46, y: 5 },
      { sprite: 'poster_stand', x: 36, y: 68 },
      { sprite: 'poster_stand', x: 44, y: 68 },
      { sprite: 'poster_stand', x: 52, y: 68 },
      { sprite: 'poster_stand', x: 60, y: 68 },
      { sprite: 'minimus_banner', x: 36, y: 67, ifFlag: 'q_brushes_done' },
      { sprite: 'well', x: 48, y: 46 },
      { sprite: 'bench', x: CH8_WORLD.mtShuTemple.quest.emptyChair.x, y: CH8_WORLD.mtShuTemple.quest.emptyChair.y - 1, solid: BENCH_SOLID },
      { sprite: 'minimus_teacup', x: CH8_WORLD.mtShuTemple.quest.emptyChair.x + 1, y: CH8_WORLD.mtShuTemple.quest.emptyChair.y - 1, ifFlag: 'q_empty_chair_done' },
      { sprite: 'gift_box', x: 23, y: 47, solid: CRATE_SOLID, unlessFlag: 'q_mt_shu_jade_cache' },
      { sprite: 'gift_box_open', x: 23, y: 47, ifFlag: 'q_mt_shu_jade_cache' },
      { sprite: 'meteor_rock', x: 37, y: 23, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 57, y: 23, solid: ROCK_SOLID },
    ],
    npcs: [
      { id: 'mt_shu_elder', sprite: 'mt_shu_elder', x: 48, y: 47, facing: 'down', dialogue: 'npc_mt_shu_elder', stationary: true, idle: true },
    ],
    signs: [
      { x: 48, y: 92, dialogue: 'sign_mt_shu_temple' },
      { x: 48, y: 15, dialogue: 'mt_shu_temple_early', unlessFlag: 'paper_dragon_defeated' },
      { x: 48, y: 15, dialogue: 'sign_mt_shu_temple', ifFlag: 'paper_dragon_defeated' },
      { x: 36, y: 67, dialogue: 'q_brushes_footprint_banner', ifFlag: 'q_brushes_done' },
      { x: 70, y: 54, dialogue: 'q_empty_chair_footprint', ifFlag: 'q_empty_chair_done' },
      { x: 22, y: 47, dialogue: 'q_mt_shu_jade_cache', unlessFlag: 'q_mt_shu_jade_cache' },
    ],
    phones: [{ x: 52, y: 40 }],
    doors: [
      { ...CH8_WORLD.mtShuTemple.transition.spore.mouth, to: 'spore_forest', ...nativeFeet(CH8_WORLD.mtShuTemple.transition.spore.landing), facing: 'down', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['paper_lantern_wisp', 'origami_warrior'], count: 2, rect: { x: 30, y: 77, w: 12, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['spore_puffer', 'origami_warrior'], count: 2, rect: { x: 53, y: 64, w: 10, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
      { enemies: ['origami_warrior', 'porcelain_warlord'], count: 3, rect: { x: 18, y: 48, w: 11, h: 8 }, unlessFlag: 'paper_dragon_defeated' },
    ],
    triggers: [
      { id: 'ch8_false_folds', rect: CH8_WORLD.mtShuTemple.story.falseFolds, once: true },
      { id: 'ch8_trust_climax', rect: CH8_WORLD.mtShuTemple.story.trustClimax, once: true },
      { id: 'ch8_elder_beta', rect: CH8_WORLD.mtShuTemple.story.elderBeta, once: true },
      { id: 'q_empty_chair', rect: { ...CH8_WORLD.mtShuTemple.quest.emptyChair, w: 1, h: 1 }, once: false },
      { id: 'paper_dragon_boss', rect: CH8_WORLD.mtShuTemple.story.paperDragon, once: false },
      { id: 'mt_shu_temple_resonance', rect: CH8_WORLD.mtShuTemple.resonance, once: false },
    ],
  };
}

export function buildChapter8Maps(): Record<(typeof CH8_MAP_IDS)[number], MapDef> {
  return {
    lotus_harbor: buildLotusHarbor(),
    bamboo_road: buildBambooRoad(),
    spore_forest: buildSporeForest(),
    mt_shu_temple: buildMtShuTemple(),
  };
}
