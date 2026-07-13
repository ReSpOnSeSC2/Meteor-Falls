/**
 * CHAPTER 5 — THE GRAND DUCHY OF MINIMUS.
 *
 * These four ids are save-facing. The 2026-07 production pass replaces the
 * compact promotion layouts with a real tabletop capital, a clearing-chain
 * Procession Way, a belt-hidden Hedgerow, and a staged Crown approach. Fixed
 * points below are shared by doors, dev profiles, migrations, and tests.
 */
import { Grid } from './mapkit';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const ROCK_SOLID = { ox: 2, oy: 12, w: 24, h: 12 } as const;
const CRATE_SOLID = { ox: 3, oy: 8, w: 14, h: 9 } as const;
const STALL_SOLID = { ox: 6, oy: 20, w: 28, h: 12 } as const;
const BENCH_SOLID = { ox: 1, oy: 11, w: 22, h: 8 } as const;
const WELL_SOLID = { ox: 4, oy: 20, w: 16, h: 10 } as const;
// All four promoted Minimus facade sources are historical w4/u0 footprints.
// occupyCity consumes this source geometry before formal-city promotion swaps
// in the tall visual/collider while preserving generated unit ids and doors.
const MINIMUS_FACADE_SOLID = { ox: 0, oy: 10, w: 66, h: 6 } as const;

export const CH5_MAP_IDS = [
  'minimus_major', 'procession_way', 'the_hedgerow', 'ducal_crown',
] as const;

export const CH5_WORLD = {
  minimusMajor: {
    size: { w: 72, h: 56 },
    landing: { x: 12, y: 49 },
    lucille: { x: 11, y: 55, w: 3, h: 1 },
    wayMouth: { x: 71, y: 28, w: 1, h: 4 },
    lens: { x: 49, y: 33, w: 7, h: 6 },
  },
  processionWay: {
    size: { w: 104, h: 64 },
    cityMouth: { x: 0, y: 30, w: 1, h: 5 },
    hedgerowMouth: { x: 103, y: 20, w: 1, h: 5 },
    portrait: { x: 51, y: 35, w: 9, h: 7 },
  },
  hedgerow: {
    size: { w: 88, h: 72 },
    wayMouth: { x: 42, y: 71, w: 4, h: 1 },
    crownMouth: { x: 43, y: 0, w: 4, h: 1 },
    lens: { x: 39, y: 33, w: 9, h: 7 },
  },
  ducalCrown: {
    size: { w: 52, h: 40 },
    hedgerowMouth: { x: 24, y: 39, w: 4, h: 1 },
    boss: { x: 19, y: 23, w: 14, h: 7 },
    resonance: { x: 22, y: 11, w: 8, h: 7 },
  },
} as const;

/** Backward-compatible arrival export used by the flight scene. */
export const MINIMUS_LANDING = CH5_WORLD.minimusMajor.landing;

interface Point { x: number; y: number }

function paintDisk(g: Grid, cx: number, cy: number, radius: number, tile: string): void {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius + 1) g.set(cx + x, cy + y, tile);
    }
  }
}

/** Rounded, hand-authored centerline ribbon. The points are the design; this
 * helper only joins them without ruler-straight rectangle corners. */
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

function carveEllipse(g: Grid, cx: number, cy: number, rx: number, ry: number, tile = '.'): void {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) g.set(cx + x, cy + y, tile);
    }
  }
}

function facade(sprite: string, x: number, y: number): PropDef {
  return { sprite, x, y, solid: MINIMUS_FACADE_SOLID };
}

function buildMinimusMajor(): MapDef {
  const { w: W, h: H } = CH5_WORLD.minimusMajor.size;
  const g = new Grid(W, H, '.');
  g.sprinkle(510501, '.,,~~fF', 0.08);
  g.rect(0, 0, W, 1, 'O');
  g.rect(0, H - 1, W, 1, 'O');
  g.rect(0, 0, 1, H, 'O');
  g.rect(W - 1, 0, 1, H, 'O');

  // THE PROCESSION GRID — three distinct face bands and two connected loops.
  // The main avenue is the sanctioned colossus spine; side streets remain
  // dainty but body-safe. R/D/X all render as Minimus cobble through the skin.
  g.rect(2, 28, W - 2, 4, 'R');
  g.rect(4, 42, 58, 4, 'R');
  g.rect(36, 13, 4, 33, 'R');
  g.rect(4, 15, 32, 3, 'R');
  g.rect(50, 15, 16, 3, 'R');
  g.rect(62, 15, 4, 31, 'R');
  g.rect(12, 17, 3, 11, 'R');
  for (let x = 3; x < W; x += 2) g.set(x, 29, 'D');
  for (let x = 5; x < 62; x += 2) g.set(x, 43, 'D');
  for (let y = 14; y < 46; y += 2) g.set(37, y, 'D');
  g.rect(35, 27, 6, 6, 'X');
  g.rect(60, 27, 7, 6, 'X');
  g.rect(35, 41, 6, 6, 'X');
  g.rect(60, 41, 7, 6, 'X');

  // Furnished rooms: Crown Canton (north), Petit Market (west), Hundred Works
  // (east), Thimble Row (south), and Lucille's landing green (south-west).
  g.rect(29, 4, 18, 8, 'p');
  g.rect(3, 20, 27, 7, '=');
  g.rect(43, 20, 27, 7, '=');
  g.rect(3, 34, 28, 7, '=');
  g.rect(43, 34, 27, 7, '=');
  g.rect(4, 47, 23, 8, '.');
  paintRibbon(g, [{ x: 12, y: 55 }, { x: 12, y: 50 }, { x: 18, y: 46 }, { x: 19, y: 44 }], 1, '=');
  g.rect(CH5_WORLD.minimusMajor.wayMouth.x, CH5_WORLD.minimusMajor.wayMouth.y, 1, 4, 'R');
  g.rect(CH5_WORLD.minimusMajor.lucille.x, CH5_WORLD.minimusMajor.lucille.y, 3, 1, '=');

  // SAVE-FACING TENANCY CONTRACT. The first seven source facades preserve the
  // historical order; with exactly sixteen facades occupyCity's deterministic
  // lock roll remains index 1 plus new index 7. Thus units 0..5 keep their old
  // source roles while the production city gains nine more live front doors.
  const props: PropDef[] = [
    facade('bldg_minimus_cathedral', 34, 10),
    facade('bldg_minimus_cathedral', 6, 10),
    facade('bldg_minimus_petit_market', 6, 22),
    facade('bldg_minimus_manor', 14, 36),
    facade('bldg_minimus_thimble_inn', 44, 36),
    facade('bldg_minimus_thimble_inn', 52, 36),
    facade('bldg_minimus_cathedral', 58, 10),
    facade('bldg_minimus_petit_market', 22, 22),
    facade('bldg_minimus_manor', 6, 36),
    facade('bldg_minimus_cathedral', 46, 10),
    facade('bldg_minimus_petit_market', 14, 22),
    facade('bldg_minimus_thimble_inn', 52, 22),
    facade('bldg_minimus_manor', 22, 36),
    facade('bldg_minimus_petit_market', 60, 22),
    facade('bldg_minimus_cathedral', 22, 10),
    facade('bldg_minimus_thimble_inn', 60, 36),

    // Crown Canton and the matchbox briefing axis.
    { sprite: 'minimus_crown', x: 37, y: 7 },
    { sprite: 'minimus_banner', x: 30, y: 7 },
    { sprite: 'minimus_banner', x: 44, y: 7 },
    { sprite: 'matchbox_podium', x: 33, y: 34 },
    { sprite: 'costa_telescope', x: 40, y: 35 },
    // Petit Market: clustered commerce, not confetti.
    { sprite: 'market_stall_a', x: 4, y: 25, solid: STALL_SOLID },
    { sprite: 'market_stall_b', x: 10, y: 25, solid: STALL_SOLID },
    { sprite: 'market_stall_a', x: 18, y: 25, solid: STALL_SOLID },
    { sprite: 'crate', x: 25, y: 26, solid: CRATE_SOLID },
    { sprite: 'crate_bananas', x: 28, y: 26, solid: CRATE_SOLID },
    { sprite: 'news_box', x: 4, y: 32 },
    { sprite: 'trash_can', x: 27, y: 32 },
    // Hundred Works: lens bench, thimble-well, and repair staging.
    { sprite: 'prop_workbench', x: 51, y: 36, solid: { ox: 1, oy: 12, w: 28, h: 10 } },
    { sprite: 'well', x: 46, y: 34, solid: WELL_SOLID },
    { sprite: 'minimus_teacup', x: 57, y: 35 },
    { sprite: 'minimus_thimble', x: 60, y: 35 },
    { sprite: 'crate', x: 67, y: 38, solid: CRATE_SOLID },
    // Thimble Row and court green.
    { sprite: 'bench', x: 8, y: 39, solid: BENCH_SOLID },
    { sprite: 'bench', x: 27, y: 39, solid: BENCH_SOLID },
    { sprite: 'planter', x: 32, y: 39 },
    { sprite: 'planter', x: 42, y: 39 },
    { sprite: 'picnic', x: 24, y: 50, solid: PICNIC_SOLID },
    { sprite: 'payphone', x: 30, y: 33, solid: PHONE_SOLID },
    { sprite: 'parking_meter', x: 5, y: 33 },
    { sprite: 'parking_meter', x: 67, y: 33 },
    { sprite: 'stop_sign', x: 33, y: 32 },
    { sprite: 'stop_sign', x: 67, y: 46 },
    { sprite: 'prop_trail_marker', x: 69, y: 27 },
    // Landing green: the biplane reads as an event cluster even when offscreen.
    { sprite: 'minimus_banner', x: 6, y: 50 },
    { sprite: 'minimus_banner', x: 18, y: 50 },
    { sprite: 'bench', x: 5, y: 53, solid: BENCH_SOLID },
    { sprite: 'bench', x: 19, y: 53, solid: BENCH_SOLID },
  ];

  return {
    id: 'minimus_major', name: 'MINIMUS MAJOR', music: null, settlement: 'city',
    grid: g.out(), props,
    npcs: [
      { id: 'mn_pippa', sprite: 'pippa', x: 33, y: 33, facing: 'down', dialogue: 'npc_mn_pippa', stationary: true, idle: true, emote: 'think', unlessFlag: 'pippa_joined' },
      { id: 'mn_duchess', sprite: 'grand_duchess_millimetta', x: 37, y: 9, facing: 'down', dialogue: 'npc_mn_duchess', stationary: true, emote: 'happy' },
      { id: 'mn_engineer', sprite: 'spool_engineer', x: 52, y: 35, facing: 'down', dialogue: 'npc_mn_engineer', stationary: true },
      { id: 'mn_census', sprite: 'royal_census_taker', x: 27, y: 33, facing: 'right', dialogue: 'npc_mn_census', stationary: true, idle: true },
      { id: 'mn_provisioner', sprite: 'teacup_innkeeper', x: 17, y: 26, facing: 'down', dialogue: 'npc_mn_provisioner', shop: 'minimus_provisioner' },
      { id: 'mn_lostfound', sprite: 'tiny_postmaster', x: 57, y: 26, facing: 'down', dialogue: 'npc_mn_lostfound', stationary: true },
      { id: 'mn_bellkeeper', sprite: 'matchbox_herald', x: 42, y: 9, facing: 'left', dialogue: 'npc_mn_bellkeeper', stationary: true },
    ],
    signs: [
      { x: 6, y: 47, dialogue: 'sign_minimus_major' },
      { x: 69, y: 28, dialogue: 'sign_procession_gate' },
      { x: 37, y: 12, dialogue: 'sign_ducal_court' },
      { x: 40, y: 35, dialogue: 'sign_minimus_long_view' },
    ],
    phones: [{ x: 30, y: 33 }], atms: [{ x: 33, y: 33 }],
    doors: [
      { ...CH5_WORLD.minimusMajor.wayMouth, to: 'procession_way', tx: 2 * 16 + 8, ty: 32 * 16 + 12, facing: 'right', indicator: 'none' },
      { ...CH5_WORLD.minimusMajor.lucille, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [{ enemies: ['lapel_pin_mob', 'town_crier'], count: 1, rect: { x: 43, y: 47, w: 17, h: 7 } }],
    triggers: [
      { id: 'ch5_arrival', rect: { x: 8, y: 46, w: 10, h: 8 }, once: true },
      { id: 'big_little_lens', rect: CH5_WORLD.minimusMajor.lens, once: true },
      { id: 'q_census_market', rect: { x: 3, y: 24, w: 27, h: 9 }, once: false },
      { id: 'q_census_stamps', rect: { x: 49, y: 23, w: 18, h: 8 }, once: false },
      { id: 'q_repairs_well', rect: { x: 44, y: 32, w: 6, h: 6 }, once: false },
      { id: 'q_repairs_scaffold', rect: { x: 31, y: 6, w: 7, h: 7 }, once: false },
    ],
  };
}

function buildProcessionWay(): MapDef {
  const { w: W, h: H } = CH5_WORLD.processionWay.size;
  const g = new Grid(W, H, 'O');

  // Five hidden pageant clearings, joined by one winding, five-tile sanctioned
  // ribbon. North/south pockets pay exploration without bypassing the spine.
  carveEllipse(g, 10, 32, 11, 12);
  carveEllipse(g, 29, 24, 13, 10);
  carveEllipse(g, 55, 38, 16, 13);
  carveEllipse(g, 79, 22, 14, 11);
  carveEllipse(g, 97, 22, 8, 10);
  carveEllipse(g, 54, 9, 9, 6);
  carveEllipse(g, 30, 53, 10, 7);
  paintRibbon(g, [
    { x: 0, y: 32 }, { x: 12, y: 32 }, { x: 21, y: 29 }, { x: 29, y: 24 },
    { x: 39, y: 27 }, { x: 49, y: 36 }, { x: 58, y: 39 }, { x: 68, y: 34 },
    { x: 77, y: 23 }, { x: 89, y: 21 }, { x: 103, y: 22 },
  ], 2, '=');
  paintRibbon(g, [{ x: 54, y: 32 }, { x: 52, y: 23 }, { x: 54, y: 9 }], 2, '=');
  paintRibbon(g, [{ x: 36, y: 31 }, { x: 33, y: 42 }, { x: 30, y: 53 }], 2, '=');
  g.rect(0, 30, 1, 5, '=');
  g.rect(W - 1, 20, 1, 5, '=');
  g.sprinkle(510502, '.,,~~fF', 0.08);

  return {
    id: 'procession_way', name: 'THE PROCESSION WAY', music: null, grid: g.out(),
    props: [
      { sprite: 'minimus_banner', x: 6, y: 25 },
      { sprite: 'minimus_banner', x: 14, y: 37 },
      { sprite: 'hedgerow_leaf_wall', x: 22, y: 17 },
      { sprite: 'hedgerow_leaf_wall', x: 36, y: 24 },
      { sprite: 'meteor_rock', x: 24, y: 22, solid: ROCK_SOLID },
      { sprite: 'well', x: 31, y: 53, solid: WELL_SOLID },
      { sprite: 'minimus_thimble', x: 54, y: 9 },
      { sprite: 'market_stall_a', x: 49, y: 44, solid: STALL_SOLID },
      { sprite: 'market_stall_b', x: 58, y: 44, solid: STALL_SOLID },
      { sprite: 'bench', x: 51, y: 34, solid: BENCH_SOLID },
      { sprite: 'bench', x: 60, y: 37, solid: BENCH_SOLID },
      { sprite: 'picnic', x: 79, y: 17, solid: PICNIC_SOLID },
      { sprite: 'minimus_teacup', x: 83, y: 20 },
      { sprite: 'prop_trail_marker', x: 93, y: 18 },
      { sprite: 'hedgerow_thorn_arch', x: 100, y: 21 },
    ],
    npcs: [
      { id: 'pw_click', sprite: 'mr_click', x: 56, y: 42, facing: 'up', dialogue: 'npc_pw_click', stationary: true, idle: true, emote: 'happy' },
      { id: 'pw_guard', sprite: 'whistle_guard_npc', x: 24, y: 29, facing: 'right', dialogue: 'npc_pw_guard', stationary: true, mindImmune: true },
    ],
    signs: [
      { x: 5, y: 29, dialogue: 'sign_procession_way' },
      { x: 96, y: 18, dialogue: 'sign_hedgerow_mouth' },
    ],
    phones: [],
    doors: [
      { ...CH5_WORLD.processionWay.cityMouth, to: 'minimus_major', tx: 69 * 16 + 8, ty: 30 * 16 + 12, facing: 'left', indicator: 'none' },
      { ...CH5_WORLD.processionWay.hedgerowMouth, to: 'the_hedgerow', tx: 44 * 16 + 8, ty: 69 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['whistle_guard', 'cobble_mite', 'census_pigeon'], count: 2, rect: { x: 17, y: 20, w: 17, h: 7 } },
      { enemies: ['toll_clerk', 'tin_parade', 'duelist_pip'], count: 2, rect: { x: 40, y: 31, w: 15, h: 8 } },
      { enemies: ['crumb_cannoneer', 'windup_wyrmlet', 'powderwig_wasp', 'dust_bunny'], count: 2, rect: { x: 69, y: 20, w: 15, h: 7 } },
      { enemies: ['grand_parade'], count: 1, rect: { x: 52, y: 42, w: 13, h: 6 } },
      { enemies: ['snuffbox_beetle', 'tax_assessor'], count: 1, rect: { x: 48, y: 6, w: 12, h: 6 } },
    ],
    triggers: [
      { id: 'q_say_cheese', rect: CH5_WORLD.processionWay.portrait, once: false },
      { id: 'q_repairs_bridge', rect: { x: 26, y: 49, w: 9, h: 8 }, once: false },
      { id: 'q_lostfound_button', rect: { x: 50, y: 6, w: 9, h: 7 }, once: false },
    ],
  };
}

function buildTheHedgerow(): MapDef {
  const { w: W, h: H } = CH5_WORLD.hedgerow.size;
  const g = new Grid(W, H, 'O');

  // Six forest-scale privet rooms. The belts remain genuinely solid; each
  // connection is one winding, body-safe cut and the two branches terminate in
  // reward pockets instead of becoming accidental shortcuts.
  carveEllipse(g, 44, 64, 15, 7);
  carveEllipse(g, 24, 53, 13, 9);
  carveEllipse(g, 19, 31, 12, 10);
  carveEllipse(g, 43, 36, 15, 10);
  carveEllipse(g, 67, 49, 13, 10);
  carveEllipse(g, 72, 64, 9, 6);
  carveEllipse(g, 66, 22, 10, 7);
  carveEllipse(g, 45, 10, 16, 8);
  paintRibbon(g, [{ x: 44, y: 71 }, { x: 44, y: 64 }, { x: 36, y: 61 }, { x: 28, y: 56 }, { x: 24, y: 53 }], 2, '=');
  paintRibbon(g, [{ x: 24, y: 53 }, { x: 17, y: 45 }, { x: 18, y: 35 }, { x: 19, y: 31 }], 2, '=');
  paintRibbon(g, [{ x: 19, y: 31 }, { x: 29, y: 32 }, { x: 38, y: 36 }, { x: 43, y: 36 }], 2, '=');
  paintRibbon(g, [{ x: 43, y: 36 }, { x: 51, y: 30 }, { x: 45, y: 24 }, { x: 47, y: 16 }, { x: 45, y: 0 }], 2, '=');
  paintRibbon(g, [{ x: 43, y: 36 }, { x: 55, y: 43 }, { x: 67, y: 49 }, { x: 70, y: 59 }, { x: 72, y: 64 }], 2, '=');
  paintRibbon(g, [{ x: 51, y: 30 }, { x: 59, y: 24 }, { x: 66, y: 22 }], 2, '=');
  g.rect(42, H - 1, 4, 1, '=');
  g.rect(43, 0, 4, 1, '=');
  g.sprinkle(510503, '.,,~~fF', 0.1);

  return {
    id: 'the_hedgerow', name: 'THE HEDGEROW', music: null, grid: g.out(),
    props: [
      { sprite: 'hedgerow_thorn_arch', x: 45, y: 2 },
      { sprite: 'hedgerow_leaf_wall', x: 33, y: 60 },
      { sprite: 'hedgerow_leaf_wall', x: 13, y: 48 },
      { sprite: 'hedgerow_leaf_wall', x: 27, y: 28 },
      { sprite: 'hedgerow_leaf_wall', x: 52, y: 34 },
      { sprite: 'hedgerow_leaf_wall', x: 62, y: 45 },
      { sprite: 'hedgerow_leaf_wall', x: 77, y: 58 },
      { sprite: 'meteor_rock', x: 16, y: 30, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 68, y: 21, solid: ROCK_SOLID },
      { sprite: 'minimus_thimble', x: 64, y: 24 },
      { sprite: 'minimus_teacup', x: 72, y: 64 },
      { sprite: 'picnic', x: 21, y: 55, solid: PICNIC_SOLID },
      { sprite: 'prop_trail_marker', x: 43, y: 61 },
      { sprite: 'prop_trail_marker', x: 42, y: 38 },
      { sprite: 'prop_trail_marker', x: 45, y: 13 },
    ],
    npcs: [],
    signs: [{ x: 43, y: 65, dialogue: 'sign_the_hedgerow' }], phones: [],
    doors: [
      { ...CH5_WORLD.hedgerow.wayMouth, to: 'procession_way', tx: 101 * 16 + 8, ty: 22 * 16 + 12, facing: 'left', indicator: 'none' },
      { ...CH5_WORLD.hedgerow.crownMouth, to: 'ducal_crown', tx: 26 * 16 + 8, ty: 37 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['hedge_sprite', 'bramble_tangle'], count: 2, rect: { x: 13, y: 28, w: 12, h: 8 }, unlessFlag: 'whiskerzilla_defeated' },
      { enemies: ['topiary_knight', 'powderwig_wasp'], count: 1, rect: { x: 35, y: 34, w: 14, h: 7 }, unlessFlag: 'whiskerzilla_defeated' },
      { enemies: ['bell_ringer_acolyte', 'dust_bunny'], count: 2, rect: { x: 59, y: 46, w: 14, h: 7 }, unlessFlag: 'whiskerzilla_defeated' },
      { enemies: ['halberd_column', 'hedge_sprite'], count: 1, rect: { x: 38, y: 8, w: 14, h: 6 }, unlessFlag: 'whiskerzilla_defeated' },
    ],
    triggers: [
      { id: 'the_hedgerow_lens', rect: CH5_WORLD.hedgerow.lens, once: true },
      { id: 'q_lostfound_spoon', rect: { x: 62, y: 19, w: 9, h: 7 }, once: false },
      { id: 'q_belfry_clappers', rect: { x: 68, y: 60, w: 9, h: 7 }, once: false },
    ],
  };
}

function buildDucalCrown(): MapDef {
  const { w: W, h: H } = CH5_WORLD.ducalCrown.size;
  const g = new Grid(W, H, 'O');
  carveEllipse(g, 26, 27, 19, 10);
  carveEllipse(g, 26, 12, 14, 9);
  paintRibbon(g, [{ x: 26, y: 39 }, { x: 26, y: 31 }, { x: 24, y: 26 }, { x: 26, y: 20 }, { x: 26, y: 10 }], 3, '=');
  g.rect(18, 19, 17, 5, 'p');
  g.rect(20, 9, 13, 8, 'p');
  g.rect(24, H - 1, 4, 1, '=');
  g.sprinkle(510504, '.,,fF', 0.05);

  return {
    id: 'ducal_crown', name: 'THE DUCAL CROWN', music: null, grid: g.out(),
    props: [
      { sprite: 'ducal_crown_gate', x: 25, y: 30 },
      { sprite: 'minimus_banner', x: 18, y: 25 },
      { sprite: 'minimus_banner', x: 33, y: 25 },
      { sprite: 'minimus_banner', x: 19, y: 11 },
      { sprite: 'minimus_banner', x: 32, y: 11 },
      { sprite: 'meteor_rock', x: 25, y: 20, solid: ROCK_SOLID },
      { sprite: 'minimus_crown', x: 25, y: 17 },
      { sprite: 'prop_resonance_stones', x: 25, y: 12 },
      { sprite: 'bench', x: 15, y: 31, solid: BENCH_SOLID },
      { sprite: 'bench', x: 35, y: 31, solid: BENCH_SOLID },
      { sprite: 'prop_trail_marker', x: 25, y: 35 },
    ],
    npcs: [], signs: [{ x: 25, y: 34, dialogue: 'sign_ducal_crown' }], phones: [],
    doors: [
      { ...CH5_WORLD.ducalCrown.hedgerowMouth, to: 'the_hedgerow', tx: 45 * 16 + 8, ty: 2 * 16 + 12, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      // Approaching from the south necessarily meets the boss before the
      // northern resonance; no early one-shot can consume the chapter close.
      { id: 'whiskerzilla_boss', rect: CH5_WORLD.ducalCrown.boss, once: false },
      { id: 'ducal_crown_resonance', rect: CH5_WORLD.ducalCrown.resonance, once: true },
    ],
  };
}

export function buildChapter5Maps(): Record<string, MapDef> {
  return {
    minimus_major: buildMinimusMajor(),
    procession_way: buildProcessionWay(),
    the_hedgerow: buildTheHedgerow(),
    ducal_crown: buildDucalCrown(),
  };
}
