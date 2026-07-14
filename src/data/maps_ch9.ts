/**
 * Chapter 9 production world: Valea Stelelor -> the Old Road -> Castle
 * Hoaxula -> Stone Brow Monastery. All save-facing geometry is owned by
 * CH9_WORLD; builders convert tile feet to native pixels exactly once.
 */
import { Grid, treeSprite } from './mapkit';
import type { MapDef, PropDef } from '../schemas';

interface Point { x: number; y: number }

const VALEA_ARRIVAL = { x: 14, y: 53, facing: 'up' } as const;
const VALEA_VILLAGE_PROFILE = { x: 22, y: 40, facing: 'up' } as const;
const VALEA_BUNI_PROFILE = { x: 20, y: 38, facing: 'right' } as const;
const VALEA_FULL_BAG_PROFILE = VALEA_BUNI_PROFILE;
const VALEA_COMPLETE_PROFILE = { x: 40, y: 41, facing: 'down' } as const;
const OLD_ROAD_PROFILE = { x: 18, y: 56, facing: 'right' } as const;
const CASTLE_RESTART = { x: 36, y: 39, facing: 'up' } as const;
const CASTLE_POST_BOSS = { x: 36, y: 16, facing: 'up' } as const;
// Direct story profiles use the safe southern edge of each durable frontier,
// matching the arrival profile's contract: boot the ordinary overworld scene
// and let its real trigger own the beat instead of duplicating scene logic.
const MONASTERY_PROFILE = { x: 32, y: 57, facing: 'up' } as const;
const MONASTERY_AWAKENING_PROFILE = { x: 32, y: 36, facing: 'up' } as const;
const MONASTERY_COMPLETE_PROFILE = { x: 32, y: 16, facing: 'up' } as const;

export const CH9_MAP_IDS = [
  'valea_stelelor', 'old_road', 'castle_hoaxula', 'stone_brow_monastery',
] as const;

export const CH9_WORLD = {
  valea: {
    size: { w: 80, h: 64 },
    train: { x: 3, y: 52, w: 20, h: 11 },
    arrival: VALEA_ARRIVAL,
    story: {
      arrival: { x: 8, y: 49, w: 16, h: 10 },
    },
    districts: {
      buni: { x: 9, y: 28, w: 24, h: 17 },
      green: { x: 31, y: 31, w: 17, h: 16 },
      homes: { x: 9, y: 10, w: 25, h: 16 },
      civic: { x: 35, y: 12, w: 21, h: 16 },
      church: { x: 58, y: 9, w: 15, h: 19 },
      workLane: { x: 54, y: 37, w: 19, h: 17 },
      oldRoadApproach: { x: 69, y: 27, w: 11, h: 10 },
    },
    transition: {
      oldRoad: {
        mouth: { x: 77, y: 28, w: 3, h: 6 },
        landing: { x: 4, y: 62, facing: 'right' },
      },
    },
    quest: {
      buni: { x: 20, y: 36 },
      ingredients: [
        { item: 'smantana', flag: 'q_buni_smantana', x: 64, y: 47 },
        { item: 'pickled_cabbage', flag: 'q_buni_cabbage', x: 13, y: 29 },
        { item: 'grandfather_plums', flag: 'q_buni_plums', x: 29, y: 18 },
      ],
    },
    recovery: { x: 38, y: 41, facing: 'down' },
    migration: VALEA_ARRIVAL,
    vehicleApron: { x: 5, y: 53, w: 16, h: 9 },
    profiles: {
      arrival: VALEA_ARRIVAL,
      village: VALEA_VILLAGE_PROFILE,
      buni: VALEA_BUNI_PROFILE,
      fullBag: VALEA_FULL_BAG_PROFILE,
      complete: VALEA_COMPLETE_PROFILE,
    },
  },
  oldRoad: {
    size: { w: 96, h: 72 },
    route: [
      { x: 2, y: 63 }, { x: 19, y: 56 }, { x: 40, y: 59 },
      { x: 57, y: 45 }, { x: 39, y: 31 }, { x: 61, y: 20 },
      { x: 76, y: 5 },
    ],
    transition: {
      valea: {
        mouth: { x: 0, y: 59, w: 3, h: 8 },
        landing: { x: 75, y: 31, facing: 'left' },
      },
      castle: {
        mouth: { x: 72, y: 0, w: 9, h: 3 },
        landing: { x: 36, y: 91, facing: 'up' },
      },
    },
    safePockets: [{ x: 18, y: 56 }, { x: 55, y: 47 }, { x: 42, y: 30 }],
    recovery: { x: 55, y: 47, facing: 'up' },
    quest: {
      ingredients: [
        { item: 'branza_burduf', flag: 'q_buni_branza', x: 22, y: 54 },
        { item: 'valley_mushrooms', flag: 'q_buni_mushrooms', x: 43, y: 32 },
      ],
    },
    migration: { x: 7, y: 62, facing: 'right' },
    profiles: { road: OLD_ROAD_PROFILE },
  },
  castle: {
    size: { w: 72, h: 96 },
    transition: {
      oldRoad: {
        mouth: { x: 32, y: 93, w: 9, h: 3 },
        landing: { x: 76, y: 4, facing: 'down' },
      },
      monastery: {
        mouth: { x: 32, y: 0, w: 9, h: 3 },
        landing: { x: 32, y: 83, facing: 'up' },
      },
    },
    regions: {
      ticketCourt: { x: 24, y: 78, w: 24, h: 15 },
      fakeCrypt: { x: 8, y: 58, w: 26, h: 18 },
      batShowroom: { x: 38, y: 58, w: 26, h: 18 },
      backstage: { x: 12, y: 39, w: 48, h: 18 },
      bossArena: { x: 18, y: 20, w: 36, h: 15 },
      choiceChamber: { x: 27, y: 8, w: 18, h: 7 },
    },
    story: {
      boss: { x: 18, y: 22, w: 36, h: 11 },
      choice: { x: 28, y: 10, w: 16, h: 5 },
    },
    recovery: { x: 36, y: 40, facing: 'up' },
    bossRestart: CASTLE_RESTART,
    migration: { x: 36, y: 88, facing: 'up' },
    profiles: {
      // The ticket-court center is clear of both encounter pens. The former
      // y=86 foot could be intercepted by a roaming armor before QA settled.
      entry: { x: 36, y: 78, facing: 'up' },
      preBoss: CASTLE_RESTART,
      theatrical: CASTLE_RESTART,
      postUnmask: CASTLE_RESTART,
      postBoss: CASTLE_POST_BOSS,
      choice: CASTLE_POST_BOSS,
    },
  },
  monastery: {
    size: { w: 64, h: 88 },
    transition: {
      castle: {
        mouth: { x: 28, y: 85, w: 9, h: 3 },
        landing: { x: 36, y: 4, facing: 'down' },
      },
    },
    story: {
      trial: { x: 18, y: 49, w: 28, h: 9 },
      awakening: { x: 20, y: 29, w: 24, h: 8 },
      resonance: { x: 23, y: 7, w: 18, h: 8 },
    },
    recovery: { x: 32, y: 68, facing: 'up' },
    migration: { x: 32, y: 81, facing: 'up' },
    profiles: {
      monastery: MONASTERY_PROFILE,
      awakening: MONASTERY_AWAKENING_PROFILE,
      complete: MONASTERY_COMPLETE_PROFILE,
    },
  },
} as const;

/** Backward-compatible arrival alias for existing travel callers. */
export const VALEA_STELELOR_LANDING = CH9_WORLD.valea.arrival;

/** Convert a native tile to the player's native-pixel feet. */
export function nativeFeet(point: Point): { tx: number; ty: number } {
  return { tx: point.x * 16 + 8, ty: point.y * 16 + 12 };
}

// Native-pixel bodies mirror each committed facade texture (runtime art is 4×).
// OverworldScene still rebuilds facade collision from the loaded texture, but
// keeping data honest makes static reachability/editor checks see the same town.
const VALEA_FACADE_SOLIDS = {
  bldg_valea_painted_house: { ox: 0, oy: 10, w: 80, h: 61 },
  bldg_valea_cottage: { ox: 0, oy: 10, w: 80, h: 60 },
  bldg_valea_inn: { ox: 0, oy: 10, w: 80, h: 61 },
  bldg_valea_shop: { ox: 0, oy: 10, w: 80, h: 45 },
  bldg_valea_hall: { ox: 0, oy: 10, w: 80, h: 53 },
  bldg_valea_church: { ox: 0, oy: 10, w: 53, h: 80 },
  bldg_valea_mill: { ox: 0, oy: 10, w: 71, h: 70 },
  bldg_valea_barn: { ox: 0, oy: 10, w: 80, h: 57 },
} as const;
const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;
const COUNTER_SOLID = { ox: 0, oy: 4, w: 30, h: 14 } as const;
const BENCH_SOLID = { ox: 1, oy: 10, w: 30, h: 8 } as const;
const ROPE_SOLID = { ox: 2, oy: 12, w: 10, h: 6 } as const;
const CRATE_SOLID = { ox: 2, oy: 8, w: 16, h: 10 } as const;
const CURTAIN_SOLID = { ox: 2, oy: 13, w: 16, h: 9 } as const;
const TRAIN_SOLID = { ox: 8, oy: 50, w: 288, h: 18 } as const;
const BELL_SOLID = { ox: 8, oy: 30, w: 36, h: 14 } as const;
const FB_BARREL_SOLID = { ox: 1, oy: 17, w: 16, h: 8 } as const;

/**
 * Visible pantry landmarks sit beside (never on) Buni's walk-over pickup tiles.
 * They retire with the same durable flag, so a collected ingredient leaves an
 * honest empty place instead of a permanently tempting prop.
 */
export const CH9_BUNI_PICKUP_CUES = [
  { map: 'valea_stelelor', flag: 'q_buni_smantana', sprite: 'fb_barrel', x: 65, y: 46, solid: FB_BARREL_SOLID },
  { map: 'valea_stelelor', flag: 'q_buni_cabbage', sprite: 'fb_barrel', x: 14, y: 28, solid: FB_BARREL_SOLID },
  { map: 'valea_stelelor', flag: 'q_buni_plums', sprite: 'crate', x: 30, y: 18, solid: CRATE_SOLID },
  { map: 'old_road', flag: 'q_buni_branza', sprite: 'crate', x: 23, y: 53, solid: CRATE_SOLID },
  { map: 'old_road', flag: 'q_buni_mushrooms', sprite: 'prop_trail_marker', x: 44, y: 32 },
] as const;

function buniPickupCueProps(map: (typeof CH9_MAP_IDS)[number]): PropDef[] {
  return CH9_BUNI_PICKUP_CUES
    .filter((cue) => cue.map === map)
    .map(({ map: _map, flag, ...cue }) => ({ ...cue, unlessFlag: flag }));
}

function paintDisk(g: Grid, cx: number, cy: number, radius: number, tile: string): void {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius + 1) g.set(cx + x, cy + y, tile);
    }
  }
}

function paintRibbon(g: Grid, points: readonly Point[], radius: number, tile: string): void {
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * 2;
    for (let step = 0; step <= steps; step++) {
      const t = steps === 0 ? 0 : step / steps;
      paintDisk(g, Math.round(from.x + (to.x - from.x) * t), Math.round(from.y + (to.y - from.y) * t), radius, tile);
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

function facade(sprite: keyof typeof VALEA_FACADE_SOLIDS, x: number, y: number): PropDef {
  return { sprite, x, y, solid: VALEA_FACADE_SOLIDS[sprite], facadeUse: 'outdoor-court' };
}

function buildValeaStelelor(): MapDef {
  const { w: W, h: H } = CH9_WORLD.valea.size;
  const g = new Grid(W, H, '.');
  g.rect(0, 0, W, 2, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');
  g.rect(0, H - 1, W, 1, 'B');

  // The crescent lane joins every civic court, the train apron, and the road gate.
  paintRibbon(g, [
    { x: 13, y: 52 }, { x: 20, y: 40 }, { x: 39, y: 38 },
    { x: 54, y: 32 }, { x: 78, y: 31 },
  ], 2, '=');
  paintRibbon(g, [{ x: 20, y: 40 }, { x: 20, y: 23 }, { x: 31, y: 18 }], 2, '=');
  paintRibbon(g, [{ x: 39, y: 38 }, { x: 44, y: 23 }, { x: 65, y: 20 }], 2, '=');
  paintRibbon(g, [{ x: 39, y: 38 }, { x: 61, y: 45 }, { x: 70, y: 48 }], 2, '=');
  carveEllipse(g, 20, 36, 9, 7, '.');
  carveEllipse(g, 39, 38, 10, 8, '.');
  g.rect(CH9_WORLD.valea.train.x, CH9_WORLD.valea.train.y, CH9_WORLD.valea.train.w, CH9_WORLD.valea.train.h, '=');
  const mouth = CH9_WORLD.valea.transition.oldRoad.mouth;
  g.rect(mouth.x, mouth.y, mouth.w, mouth.h, '=');

  const props: PropDef[] = [
    // Eight committed facade identities, deliberately placed by village use.
    facade('bldg_valea_painted_house', 9, 12),
    facade('bldg_valea_cottage', 24, 20),
    facade('bldg_valea_inn', 35, 16),
    facade('bldg_valea_shop', 44, 20),
    facade('bldg_valea_hall', 51, 14),
    facade('bldg_valea_church', 63, 13),
    facade('bldg_valea_mill', 58, 41),
    facade('bldg_valea_barn', 68, 44),
    { sprite: 'picnic', x: 18, y: 34, solid: PICNIC_SOLID },
    { sprite: 'picnic', x: 36, y: 39, solid: PICNIC_SOLID },
    { sprite: 'well', x: 39, y: 38 },
    { sprite: 'payphone', x: 51, y: 29, solid: PHONE_SOLID },
    { sprite: 'counter', x: 46, y: 21, solid: COUNTER_SOLID },
    { sprite: 'orient_less_express', x: 3, y: 56, solid: TRAIN_SOLID },
    { sprite: treeSprite(27, 15), x: 27, y: 15, solid: TREE_SOLID },
    { sprite: treeSprite(32, 16), x: 32, y: 16, solid: TREE_SOLID },
    { sprite: treeSprite(74, 40, true), x: 74, y: 40, solid: TREE_SOLID },
    { sprite: 'prop_trail_marker', x: 73, y: 29 },
    { sprite: 'poster_stand', x: 26, y: 25 },
    ...buniPickupCueProps('valea_stelelor'),
  ];

  return {
    id: 'valea_stelelor',
    name: 'VALEA STELELOR',
    music: null,
    area: 'valea',
    settlement: 'village',
    grid: g.out(),
    props,
    npcs: [
      { id: 'vs_buni', sprite: 'vs_buni', x: 21, y: 38, facing: 'down', dialogue: 'npc_vs_buni', stationary: true, idle: true, emote: 'happy' },
      { id: 'vs_provisioner', sprite: 'vs_provisioner', x: 47, y: 24, facing: 'down', dialogue: 'npc_vs_provisioner', shop: 'valea_provisioner' },
      { id: 'vs_shepherd', sprite: 'vs_shepherd', x: 60, y: 47, facing: 'left', dialogue: 'npc_vs_shepherd', stationary: true },
      { id: 'vs_kid', sprite: 'vs_kid', x: 41, y: 36, facing: 'down', dialogue: 'npc_vs_kid', wander: true, emote: 'happy' },
      { id: 'vs_orchard_keeper', sprite: 'vs_shepherd', x: 24, y: 17, facing: 'right', dialogue: 'npc_vs_orchard_keeper', wander: true, idle: true, emote: 'think' },
      { id: 'vs_miller', sprite: 'vs_provisioner', x: 55, y: 43, facing: 'down', dialogue: 'npc_vs_miller', wander: true, idle: true },
      { id: 'vs_church_neighbor', sprite: 'vs_provisioner', x: 59, y: 24, facing: 'up', dialogue: 'npc_vs_church_neighbor', wander: true, emote: 'happy' },
      { id: 'vs_green_dancer', sprite: 'vs_kid', x: 35, y: 36, facing: 'right', dialogue: 'npc_vs_green_dancer', wander: true, idle: true, emote: 'happy' },
      { id: 'vs_station_cousin', sprite: 'vs_shepherd', x: 24, y: 50, facing: 'left', dialogue: 'npc_vs_station_cousin', wander: true, idle: true },
    ],
    signs: [
      { x: 8, y: 48, dialogue: 'sign_valea_stelelor' },
      { x: 73, y: 30, dialogue: 'sign_old_road_gate' },
      { x: 39, y: 35, dialogue: 'sign_valea_green' },
      { x: 25, y: 25, dialogue: 'sign_valea_cottage' },
    ],
    phones: [{ x: 51, y: 29 }],
    atms: [{ x: 53, y: 29 }],
    doors: [{
      ...mouth,
      to: 'old_road',
      ...nativeFeet(CH9_WORLD.valea.transition.oldRoad.landing),
      facing: CH9_WORLD.valea.transition.oldRoad.landing.facing,
      indicator: 'none',
    }],
    spawners: [{
      enemies: ['haystack_mimic'], count: 2,
      rect: { x: 62, y: 49, w: 8, h: 6 },
      unlessFlag: 'count_hoaxula_defeated',
    }],
    triggers: [
      { id: 'ch9_arrival', rect: CH9_WORLD.valea.story.arrival, once: true },
      ...CH9_WORLD.valea.quest.ingredients.map((ingredient) => ({
        id: ingredient.flag,
        rect: { x: ingredient.x, y: ingredient.y, w: 1, h: 1 },
        once: false,
      })),
    ],
  };
}

function buildOldRoad(): MapDef {
  const { w: W, h: H } = CH9_WORLD.oldRoad.size;
  const g = new Grid(W, H, 'B');
  paintRibbon(g, CH9_WORLD.oldRoad.route, 4, '=');
  for (const pocket of CH9_WORLD.oldRoad.safePockets) paintDisk(g, pocket.x, pocket.y, 5, '.');
  const valeaMouth = CH9_WORLD.oldRoad.transition.valea.mouth;
  const castleMouth = CH9_WORLD.oldRoad.transition.castle.mouth;
  g.rect(valeaMouth.x, valeaMouth.y, valeaMouth.w, valeaMouth.h, '=');
  g.rect(castleMouth.x, castleMouth.y, castleMouth.w, castleMouth.h, '=');

  return {
    id: 'old_road',
    name: 'THE OLD ROAD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: treeSprite(14, 48, true), x: 14, y: 48, solid: TREE_SOLID },
      { sprite: treeSprite(31, 47), x: 31, y: 47, solid: TREE_SOLID },
      { sprite: treeSprite(49, 27, true), x: 49, y: 27, solid: TREE_SOLID },
      { sprite: treeSprite(68, 13, true), x: 68, y: 13, solid: TREE_SOLID },
      { sprite: 'meteor_rock', x: 34, y: 51, solid: ROCK_SOLID },
      { sprite: 'picnic', x: 52, y: 44, solid: PICNIC_SOLID },
      { sprite: 'prop_trail_marker', x: 8, y: 61 },
      { sprite: 'prop_trail_marker', x: 74, y: 8 },
      ...buniPickupCueProps('old_road'),
    ],
    npcs: [],
    signs: [
      { x: 7, y: 61, dialogue: 'sign_old_road' },
      { x: 73, y: 8, dialogue: 'sign_castle_gate' },
    ],
    phones: [],
    doors: [
      {
        ...valeaMouth,
        to: 'valea_stelelor',
        ...nativeFeet(CH9_WORLD.oldRoad.transition.valea.landing),
        facing: CH9_WORLD.oldRoad.transition.valea.landing.facing,
        indicator: 'none',
      },
      {
        ...castleMouth,
        to: 'castle_hoaxula',
        ...nativeFeet(CH9_WORLD.oldRoad.transition.castle.landing),
        facing: CH9_WORLD.oldRoad.transition.castle.landing.facing,
        indicator: 'none',
      },
    ],
    spawners: [
      { enemies: ['haystack_mimic'], count: 2, rect: { x: 12, y: 62, w: 4, h: 3 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['haystack_mimic', 'moss_strigoi'], count: 2, rect: { x: 28, y: 54, w: 11, h: 8 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['moss_strigoi', 'wolf_of_the_old_road'], count: 2, rect: { x: 48, y: 35, w: 11, h: 8 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['moss_strigoi', 'wolf_of_the_old_road'], count: 3, rect: { x: 52, y: 18, w: 13, h: 8 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['wolf_of_the_old_road'], count: 2, rect: { x: 61, y: 13, w: 7, h: 5 }, unlessFlag: 'count_hoaxula_defeated' },
    ],
    triggers: CH9_WORLD.oldRoad.quest.ingredients.map((ingredient) => ({
      id: ingredient.flag,
      rect: { x: ingredient.x, y: ingredient.y, w: 1, h: 1 },
      once: false,
    })),
  };
}

function buildCastleHoaxula(): MapDef {
  const { w: W, h: H } = CH9_WORLD.castle.size;
  const g = new Grid(W, H, 'O');
  const floor = 'o';
  const oldRoadMouth = CH9_WORLD.castle.transition.oldRoad.mouth;
  const monasteryMouth = CH9_WORLD.castle.transition.monastery.mouth;

  g.rect(oldRoadMouth.x, oldRoadMouth.y, oldRoadMouth.w, oldRoadMouth.h, floor);
  g.rect(CH9_WORLD.castle.regions.ticketCourt.x, CH9_WORLD.castle.regions.ticketCourt.y,
    CH9_WORLD.castle.regions.ticketCourt.w, CH9_WORLD.castle.regions.ticketCourt.h + 1, floor);
  g.rect(32, 72, 9, 7, floor);
  g.rect(CH9_WORLD.castle.regions.fakeCrypt.x, CH9_WORLD.castle.regions.fakeCrypt.y,
    CH9_WORLD.castle.regions.fakeCrypt.w, CH9_WORLD.castle.regions.fakeCrypt.h, floor);
  g.rect(CH9_WORLD.castle.regions.batShowroom.x, CH9_WORLD.castle.regions.batShowroom.y,
    CH9_WORLD.castle.regions.batShowroom.w, CH9_WORLD.castle.regions.batShowroom.h, floor);
  g.rect(20, 70, 32, 5, floor);
  g.rect(14, 53, 9, 8, floor);
  g.rect(49, 53, 9, 8, floor);
  g.rect(CH9_WORLD.castle.regions.backstage.x, CH9_WORLD.castle.regions.backstage.y,
    CH9_WORLD.castle.regions.backstage.w, CH9_WORLD.castle.regions.backstage.h, floor);
  g.rect(32, 33, 9, 8, floor);
  g.rect(CH9_WORLD.castle.regions.bossArena.x, CH9_WORLD.castle.regions.bossArena.y,
    CH9_WORLD.castle.regions.bossArena.w, CH9_WORLD.castle.regions.bossArena.h, floor);
  g.rect(32, 14, 9, 7, floor);
  g.rect(CH9_WORLD.castle.regions.choiceChamber.x, CH9_WORLD.castle.regions.choiceChamber.y,
    CH9_WORLD.castle.regions.choiceChamber.w, CH9_WORLD.castle.regions.choiceChamber.h, floor);
  g.rect(32, 0, 9, 9, floor);
  g.rect(monasteryMouth.x, monasteryMouth.y, monasteryMouth.w, monasteryMouth.h, floor);

  return {
    id: 'castle_hoaxula',
    name: 'CASTLE HOAXULA',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'prop_ticket_window', x: 25, y: 80, solid: COUNTER_SOLID },
      { sprite: 'prop_velvet_rope', x: 29, y: 86, solid: ROPE_SOLID },
      { sprite: 'prop_velvet_rope', x: 34, y: 83, solid: ROPE_SOLID },
      { sprite: 'prop_velvet_rope', x: 42, y: 86, solid: ROPE_SOLID },
      { sprite: 'poster_stand', x: 46, y: 81 },
      { sprite: 'prop_waiting_bench', x: 27, y: 78, solid: BENCH_SOLID },
      { sprite: 'crate', x: 12, y: 63, solid: CRATE_SOLID },
      { sprite: 'privacy_curtain', x: 29, y: 61, solid: CURTAIN_SOLID },
      { sprite: 'gift_box', x: 44, y: 63, solid: CRATE_SOLID },
      { sprite: 'gift_box', x: 47, y: 66, solid: CRATE_SOLID },
      { sprite: 'counter', x: 15, y: 43, solid: COUNTER_SOLID },
      { sprite: 'prop_rate_board', x: 20, y: 41 },
      { sprite: 'picnic', x: 37, y: 39, solid: PICNIC_SOLID },
      { sprite: 'crate', x: 54, y: 48, solid: CRATE_SOLID },
      { sprite: 'privacy_curtain', x: 56, y: 41, solid: CURTAIN_SOLID },
      { sprite: 'sofa', x: 34, y: 17, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'privacy_curtain', x: 25, y: 18, solid: CURTAIN_SOLID },
      { sprite: 'privacy_curtain', x: 46, y: 18, solid: CURTAIN_SOLID },
      { sprite: 'bench', x: 28, y: 8, solid: BENCH_SOLID },
    ],
    npcs: [],
    signs: [
      { x: 36, y: 88, dialogue: 'sign_castle_hoaxula' },
      { x: 52, y: 47, dialogue: 'sign_hoaxula_park' },
    ],
    phones: [],
    doors: [
      {
        ...oldRoadMouth,
        to: 'old_road',
        ...nativeFeet(CH9_WORLD.castle.transition.oldRoad.landing),
        facing: CH9_WORLD.castle.transition.oldRoad.landing.facing,
        indicator: 'none',
      },
      {
        ...monasteryMouth,
        to: 'stone_brow_monastery',
        ...nativeFeet(CH9_WORLD.castle.transition.monastery.landing),
        facing: CH9_WORLD.castle.transition.monastery.landing.facing,
        indicator: 'none',
        ifFlag: 'ch9_count_decided',
      },
    ],
    spawners: [
      { enemies: ['animated_armor'], count: 2, rect: { x: 25, y: 82, w: 5, h: 4 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['animated_armor'], count: 2, rect: { x: 43, y: 82, w: 4, h: 4 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['ribcage_rattler', 'moss_strigoi'], count: 2, rect: { x: 14, y: 65, w: 8, h: 6 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['animated_armor', 'ribcage_rattler'], count: 2, rect: { x: 49, y: 65, w: 8, h: 6 }, unlessFlag: 'count_hoaxula_defeated' },
      { enemies: ['ribcage_rattler', 'moss_strigoi'], count: 2, rect: { x: 17, y: 45, w: 9, h: 8 }, unlessFlag: 'count_hoaxula_defeated' },
    ],
    triggers: [
      { id: 'count_hoaxula_boss', rect: CH9_WORLD.castle.story.boss, once: false },
      { id: 'choice_compassion', rect: CH9_WORLD.castle.story.choice, once: false },
    ],
  };
}

function buildStoneBrowMonastery(): MapDef {
  const { w: W, h: H } = CH9_WORLD.monastery.size;
  const g = new Grid(W, H, 'B');
  const floor = 'o';
  const mouth = CH9_WORLD.monastery.transition.castle.mouth;
  g.rect(mouth.x, mouth.y, mouth.w, mouth.h, floor);
  carveEllipse(g, 32, 78, 12, 8, floor);
  paintRibbon(g, [{ x: 32, y: 84 }, { x: 18, y: 70 }, { x: 32, y: 68 }, { x: 32, y: 58 }], 3, floor);
  g.rect(CH9_WORLD.monastery.story.trial.x, CH9_WORLD.monastery.story.trial.y,
    CH9_WORLD.monastery.story.trial.w, CH9_WORLD.monastery.story.trial.h, floor);
  paintRibbon(g, [{ x: 32, y: 49 }, { x: 48, y: 43 }, { x: 32, y: 37 }], 3, floor);
  paintDisk(g, MONASTERY_AWAKENING_PROFILE.x, MONASTERY_AWAKENING_PROFILE.y, 4, floor);
  g.rect(CH9_WORLD.monastery.story.awakening.x, CH9_WORLD.monastery.story.awakening.y,
    CH9_WORLD.monastery.story.awakening.w, CH9_WORLD.monastery.story.awakening.h, floor);
  paintRibbon(g, [{ x: 32, y: 29 }, { x: 16, y: 23 }, { x: 32, y: 15 }], 3, floor);
  g.rect(CH9_WORLD.monastery.story.resonance.x, CH9_WORLD.monastery.story.resonance.y,
    CH9_WORLD.monastery.story.resonance.w, CH9_WORLD.monastery.story.resonance.h, floor);
  paintDisk(g, MONASTERY_COMPLETE_PROFILE.x, MONASTERY_COMPLETE_PROFILE.y, 4, floor);

  return {
    id: 'stone_brow_monastery',
    name: 'STONE BROW MONASTERY',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'picnic', x: 29, y: 66, solid: PICNIC_SOLID },
      { sprite: 'meteor_rock', x: 12, y: 65, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 46, y: 53, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 29, y: 58 },
      { sprite: 'prop_trail_marker', x: 32, y: 37 },
      { sprite: 'prop_resonance_stones', x: 30, y: 17 },
      { sprite: 'puerto_harbor_bell', x: 29, y: 3, solid: BELL_SOLID },
    ],
    npcs: [],
    signs: [{ x: 32, y: 75, dialogue: 'sign_stone_brow_monastery' }],
    phones: [],
    doors: [{
      ...mouth,
      to: 'castle_hoaxula',
      ...nativeFeet(CH9_WORLD.monastery.transition.castle.landing),
      facing: CH9_WORLD.monastery.transition.castle.landing.facing,
      indicator: 'none',
    }],
    spawners: [],
    triggers: [
      { id: 'ch9_trial_mute_mountain', rect: CH9_WORLD.monastery.story.trial, once: true },
      { id: 'ch9_dorin_awakening', rect: CH9_WORLD.monastery.story.awakening, once: true },
      { id: 'stone_brow_monastery_resonance', rect: CH9_WORLD.monastery.story.resonance, once: true },
    ],
  };
}

export function buildChapter9Maps(): Record<(typeof CH9_MAP_IDS)[number], MapDef> {
  return {
    valea_stelelor: buildValeaStelelor(),
    old_road: buildOldRoad(),
    castle_hoaxula: buildCastleHoaxula(),
    stone_brow_monastery: buildStoneBrowMonastery(),
  };
}
