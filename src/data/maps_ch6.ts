/**
 * CHAPTER 6 — THE RUINS THAT LAUGH.
 *
 * These four ids are save-facing. The production pass replaces the promotion
 * placeholders with a three-band bazaar capital, a winding clearing-chain
 * savanna, a nonlinear ruin climb, and a two-stage Sphinx approach. Fixed
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
// The three supported formal-scale Zanzibel sources are historical w4/u0
// footprints. occupyCity consumes this source geometry before promotion.
const ZANZIBEL_FACADE_SOLID = { ox: 0, oy: 10, w: 66, h: 6 } as const;

export const CH6_MAP_IDS = [
  'zanzibel', 'savanna_run', 'laughing_ruins', 'sphinx_chin',
] as const;

export const CH6_WORLD = {
  zanzibel: {
    size: { w: 72, h: 56 },
    landing: { x: 12, y: 52 },
    lucille: { x: 11, y: 55, w: 3, h: 1 },
    savannaMouth: { x: 71, y: 29, w: 1, h: 5 },
    arrival: { x: 7, y: 48, w: 11, h: 7 },
    courier: { x: 62, y: 29, w: 9, h: 5 },
  },
  savannaRun: {
    size: { w: 104, h: 64 },
    cityMouth: { x: 0, y: 48, w: 1, h: 5 },
    ruinsMouth: { x: 103, y: 14, w: 1, h: 5 },
    wateringHole: { x: 36, y: 19, w: 14, h: 12 },
    escort: { x: 61, y: 28, w: 13, h: 11 },
  },
  laughingRuins: {
    size: { w: 80, h: 88 },
    savannaMouth: { x: 38, y: 87, w: 5, h: 1 },
    chinMouth: { x: 62, y: 0, w: 5, h: 1 },
    reveal: { x: 31, y: 73, w: 18, h: 12 },
    stones: { x: 11, y: 40, w: 18, h: 16 },
    heldBreath: { x: 34, y: 43, w: 17, h: 13 },
    choice: { x: 42, y: 25, w: 17, h: 11 },
  },
  sphinxChin: {
    size: { w: 56, h: 44 },
    ruinsMouth: { x: 26, y: 43, w: 5, h: 1 },
    boss: { x: 16, y: 21, w: 24, h: 11 },
    resonance: { x: 21, y: 4, w: 14, h: 10 },
  },
} as const;

/** Backward-compatible arrival export used by the flight scene. */
export const ZANZIBEL_LANDING = CH6_WORLD.zanzibel.landing;

interface Point { x: number; y: number }

function paintDisk(g: Grid, cx: number, cy: number, radius: number, tile: string): void {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius + 1) g.set(cx + x, cy + y, tile);
    }
  }
}

/** Rounded, authored centerline ribbon. The points own the route; the helper
 * only joins them without ruler-straight rectangle corners. */
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
  return { sprite, x, y, solid: ZANZIBEL_FACADE_SOLID };
}

function buildZanzibel(): MapDef {
  const { w: W, h: H } = CH6_WORLD.zanzibel.size;
  const g = new Grid(W, H, '.');
  g.sprinkle(610601, '.,,~~fF', 0.07);
  g.rect(0, 0, W, 1, 'B');
  g.rect(0, H - 1, W, 1, 'B');
  g.rect(0, 0, 1, H, 'B');
  g.rect(W - 1, 0, 1, H, 'B');

  // INDIGO ROW, BAOBAB COURT, and CARAVAN WAY: three distinct E–W faces,
  // joined into two loops by the Market and Customs avenues.
  g.rect(2, 15, 66, 5, 'R');
  g.rect(2, 29, W - 2, 5, 'R');
  g.rect(2, 43, 66, 5, 'R');
  g.rect(17, 15, 5, 33, 'R');
  g.rect(49, 15, 5, 33, 'R');
  for (let x = 3; x < 68; x += 2) {
    g.set(x, 17, 'D'); g.set(x, 31, 'D'); g.set(x, 45, 'D');
  }
  for (let y = 16; y < 48; y += 2) {
    g.set(19, y, 'D'); g.set(51, y, 'D');
  }
  g.rect(15, 27, 9, 9, 'p');
  g.rect(47, 27, 9, 9, 'p');
  g.rect(CH6_WORLD.zanzibel.savannaMouth.x, CH6_WORLD.zanzibel.savannaMouth.y, 1, 5, 'R');

  // The quayside is a real arrival room, with a paved climb into Caravan Way.
  g.rect(4, 49, 26, 6, '=');
  paintRibbon(g, [{ x: 12, y: 55 }, { x: 12, y: 52 }, { x: 18, y: 47 }, { x: 19, y: 45 }], 1, '=');
  g.rect(CH6_WORLD.zanzibel.lucille.x, CH6_WORLD.zanzibel.lucille.y, 3, 1, '=');

  // SAVE-FACING TENANCY CONTRACT. The first six source facades preserve the
  // historical sprite order. With exactly sixteen facades, occupyCity keeps
  // historical index 4 locked and adds index 12; old units 0..4 stay stable.
  const props: PropDef[] = [
    facade('bldg_zanzibel_home', 4, 11),
    facade('bldg_zanzibel_indigo_dyer', 12, 11),
    facade('bldg_zanzibel_home', 22, 11),
    facade('bldg_zanzibel_home', 38, 11),
    facade('bldg_zanzibel_indigo_dyer', 46, 11),
    facade('bldg_zanzibel_caravanserai', 4, 25),
    facade('bldg_zanzibel_home', 12, 25),
    facade('bldg_zanzibel_indigo_dyer', 22, 25),
    facade('bldg_zanzibel_caravanserai', 38, 25),
    facade('bldg_zanzibel_home', 46, 25),
    facade('bldg_zanzibel_indigo_dyer', 54, 25),
    facade('bldg_zanzibel_home', 62, 25),
    facade('bldg_zanzibel_caravanserai', 4, 39),
    facade('bldg_zanzibel_home', 20, 39),
    facade('bldg_zanzibel_indigo_dyer', 36, 39),
    facade('bldg_zanzibel_caravanserai', 52, 39),

    // Clustered bazaar rooms, civic courts, and quayside working detail.
    { sprite: 'market_stall_a', x: 27, y: 22, solid: STALL_SOLID },
    { sprite: 'market_stall_b', x: 32, y: 22, solid: STALL_SOLID },
    { sprite: 'market_stall_a', x: 57, y: 8, solid: STALL_SOLID },
    { sprite: 'crate', x: 36, y: 23, solid: CRATE_SOLID },
    { sprite: 'crate_bananas', x: 40, y: 23, solid: CRATE_SOLID },
    { sprite: 'well', x: 27, y: 38, solid: WELL_SOLID },
    { sprite: 'bench', x: 31, y: 36, solid: BENCH_SOLID },
    { sprite: 'bench', x: 45, y: 36, solid: BENCH_SOLID },
    { sprite: 'payphone', x: 60, y: 14, solid: PHONE_SOLID },
    { sprite: 'picnic', x: 25, y: 50, solid: PICNIC_SOLID },
    { sprite: 'palm_a', x: 3, y: 49 },
    { sprite: 'palm_b', x: 30, y: 49 },
    { sprite: 'meteor_rock', x: 66, y: 48, solid: ROCK_SOLID },
    { sprite: 'prop_trail_marker', x: 68, y: 35 },
  ];

  return {
    id: 'zanzibel',
    name: 'ZANZIBEL',
    music: null,
    ambience: 'crowd',
    settlement: 'city',
    grid: g.out(),
    props,
    npcs: [
      { id: 'zn_queen', sprite: 'zanzibel_market_queen', x: 33, y: 18, facing: 'down', dialogue: 'npc_zn_queen', shop: 'zanzibel_bazaar' },
      { id: 'zn_dockmaster', sprite: 'zanzibel_dockmaster', x: 9, y: 51, facing: 'down', dialogue: 'npc_zn_dockmaster', stationary: true, idle: true },
      { id: 'zn_guide', sprite: 'laughing_ruins_guide', x: 57, y: 46, facing: 'down', dialogue: 'npc_zn_guide', stationary: true, idle: true },
      { id: 'zn_healer', sprite: 'baobab_healer', x: 28, y: 46, facing: 'down', dialogue: 'npc_zn_healer', stationary: true, idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 3, y: 18, dialogue: 'sign_zanzibel' },
      { x: 68, y: 28, dialogue: 'sign_savanna_gate' },
      { x: 34, y: 34, dialogue: 'sign_zanzibel_court' },
    ],
    phones: [{ x: 60, y: 14 }],
    atms: [{ x: 63, y: 14 }],
    doors: [
      { ...CH6_WORLD.zanzibel.savannaMouth, to: 'savanna_run', tx: 2 * 16 + 8, ty: 50 * 16 + 12, facing: 'right', indicator: 'none' },
      { ...CH6_WORLD.zanzibel.lucille, to: 'biplane_interior', tx: 11 * 16, ty: 8 * 16, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      { id: 'ch6_arrival', rect: CH6_WORLD.zanzibel.arrival, once: true },
      // Unavoidable on the only outbound street: the courier contextualises Jay's
      // existing level-26 Teleport Alpha without changing its balance/unlock path.
      { id: 'ch6_courier', rect: CH6_WORLD.zanzibel.courier, once: true },
    ],
  };
}

function buildSavannaRun(): MapDef {
  const { w: W, h: H } = CH6_WORLD.savannaRun.size;
  const g = new Grid(W, H, 'b');

  // A clearing chain, never a rectangle: broad staging rooms linked by the
  // caravan's hand-worn, diagonally wandering ochre track.
  const clearings = [
    [8, 50, 10, 8], [25, 44, 11, 8], [44, 38, 10, 8],
    [58, 32, 11, 8], [73, 30, 10, 8], [89, 20, 11, 8], [101, 16, 7, 6],
  ] as const;
  for (const [x, y, rx, ry] of clearings) carveEllipse(g, x, y, rx, ry);
  paintRibbon(g, [
    { x: -1, y: 50 }, { x: 9, y: 50 }, { x: 24, y: 45 }, { x: 36, y: 47 },
    { x: 45, y: 38 }, { x: 57, y: 31 }, { x: 68, y: 34 }, { x: 78, y: 27 },
    { x: 89, y: 21 }, { x: 104, y: 16 },
  ], 2, '=');

  // The watering-hole branch and a separate baobab shade pocket create an
  // optional rest loop instead of placing recovery directly on the critical path.
  carveEllipse(g, 42, 21, 11, 9);
  paintRibbon(g, [{ x: 45, y: 38 }, { x: 42, y: 29 }, { x: 42, y: 23 }], 2, '=');
  paintDisk(g, 43, 21, 4, 'e');
  paintDisk(g, 43, 21, 2, 'E');
  carveEllipse(g, 27, 18, 10, 7);
  paintRibbon(g, [{ x: 36, y: 47 }, { x: 31, y: 33 }, { x: 27, y: 20 }], 2, '=');

  g.rect(CH6_WORLD.savannaRun.cityMouth.x, CH6_WORLD.savannaRun.cityMouth.y, 1, 5, '=');
  g.rect(CH6_WORLD.savannaRun.ruinsMouth.x, CH6_WORLD.savannaRun.ruinsMouth.y, 1, 5, '=');

  return {
    id: 'savanna_run',
    name: 'THE SAVANNA RUN',
    music: null,
    ambience: 'wind',
    grid: g.out(),
    props: [
      { sprite: 'baobab_shade', x: 28, y: 17 },
      { sprite: 'baobab_shade', x: 52, y: 25 },
      { sprite: 'baobab_shade', x: 83, y: 15 },
      { sprite: 'meteor_rock', x: 16, y: 44, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 77, y: 34, solid: ROCK_SOLID },
      { sprite: 'prop_trail_marker', x: 12, y: 47 },
      { sprite: 'prop_trail_marker', x: 64, y: 29 },
      { sprite: 'picnic', x: 23, y: 17, solid: PICNIC_SOLID },
    ],
    npcs: [],
    signs: [
      { x: 7, y: 47, dialogue: 'sign_savanna_run' },
      { x: 96, y: 17, dialogue: 'sign_ruins_mouth' },
    ],
    phones: [],
    doors: [
      { ...CH6_WORLD.savannaRun.cityMouth, to: 'zanzibel', tx: 69 * 16 + 8, ty: 31 * 16 + 12, facing: 'left', indicator: 'none' },
      { ...CH6_WORLD.savannaRun.ruinsMouth, to: 'laughing_ruins', tx: 40 * 16 + 8, ty: 85 * 16 + 12, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['caravan_hyena_pack', 'hollow_jackal', 'dust_devil_charm', 'ribbon_serpent'], count: 2, rect: { x: 17, y: 39, w: 18, h: 13 } },
      { enemies: ['baobab_root_snare', 'thornbush_bomber', 'salt_flat_lurker', 'canteen_mirage'], count: 2, rect: { x: 48, y: 25, w: 20, h: 15 } },
      { enemies: ['caravan_hyena_pack', 'mirage_vendor', 'griot_string_snare', 'town_gossip_troll', 'trade_salt_heap'], count: 2, rect: { x: 81, y: 14, w: 18, h: 13 } },
    ],
    triggers: [
      { id: 'q_convoy_reach', rect: CH6_WORLD.savannaRun.wateringHole, once: false },
      { id: 'q_convoy_escort', rect: CH6_WORLD.savannaRun.escort, once: false },
    ],
  };
}

function buildLaughingRuins(): MapDef {
  const { w: W, h: H } = CH6_WORLD.laughingRuins.size;
  const g = new Grid(W, H, 'O');

  // Chamber progression: entry court → western echo archive → looping heart →
  // optional east pocket → Trust stair → northern ascent. The main route folds
  // back on itself, but never provides a bypass around Held Breath or the choice.
  const chambers = [
    [40, 78, 13, 8], [23, 67, 11, 8], [20, 48, 13, 10],
    [42, 49, 13, 9], [61, 63, 11, 9], [50, 30, 12, 8], [63, 13, 12, 9],
  ] as const;
  for (const [x, y, rx, ry] of chambers) carveEllipse(g, x, y, rx, ry);
  paintRibbon(g, [{ x: 40, y: 89 }, { x: 40, y: 78 }, { x: 31, y: 72 }, { x: 23, y: 67 }], 2, '.');
  paintRibbon(g, [{ x: 23, y: 67 }, { x: 16, y: 59 }, { x: 20, y: 48 }], 2, '.');
  paintRibbon(g, [{ x: 20, y: 48 }, { x: 31, y: 44 }, { x: 42, y: 49 }], 2, '.');
  paintRibbon(g, [{ x: 42, y: 49 }, { x: 53, y: 56 }, { x: 61, y: 63 }], 2, '.');
  paintRibbon(g, [{ x: 42, y: 49 }, { x: 46, y: 40 }, { x: 50, y: 30 }], 2, '.');
  paintRibbon(g, [{ x: 50, y: 30 }, { x: 57, y: 23 }, { x: 63, y: 13 }, { x: 64, y: -1 }], 2, '.');
  g.rect(CH6_WORLD.laughingRuins.savannaMouth.x, CH6_WORLD.laughingRuins.savannaMouth.y, 5, 1, 'o');
  g.rect(CH6_WORLD.laughingRuins.chinMouth.x, CH6_WORLD.laughingRuins.chinMouth.y, 5, 1, 'o');

  return {
    id: 'laughing_ruins',
    name: 'THE LAUGHING RUINS',
    music: null,
    ambience: 'cave',
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 13, y: 45, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 62, y: 61, solid: ROCK_SOLID },
      { sprite: 'meteor_rock', x: 56, y: 27, solid: ROCK_SOLID },
      { sprite: 'prop_resonance_stones', x: 20, y: 49 },
      { sprite: 'prop_resonance_stones', x: 42, y: 48 },
      { sprite: 'prop_trail_marker', x: 39, y: 80 },
      { sprite: 'prop_trail_marker', x: 52, y: 32 },
      { sprite: 'picnic', x: 57, y: 61, solid: PICNIC_SOLID },
    ],
    npcs: [],
    signs: [{ x: 39, y: 82, dialogue: 'sign_laughing_ruins' }],
    phones: [],
    doors: [
      { ...CH6_WORLD.laughingRuins.savannaMouth, to: 'savanna_run', tx: 101 * 16 + 8, ty: 16 * 16 + 12, facing: 'down', indicator: 'none' },
      { ...CH6_WORLD.laughingRuins.chinMouth, to: 'sphinx_chin', tx: 28 * 16 + 8, ty: 41 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['laughing_dust_pot', 'punchline_head', 'echoing_riddle'], count: 2, rect: { x: 13, y: 43, w: 16, h: 14 }, unlessFlag: 'laughing_sphinx_defeated' },
      { enemies: ['sphinx_paw_shadow', 'sunbaked_idol', 'laughing_sphinx_riddle'], count: 2, rect: { x: 53, y: 56, w: 17, h: 14 }, unlessFlag: 'laughing_sphinx_defeated' },
      { enemies: ['laughing_dust_pot', 'echoing_riddle', 'rare_riddle_ring', 'fastest_man_echo'], count: 2, rect: { x: 43, y: 24, w: 17, h: 13 }, unlessFlag: 'laughing_sphinx_defeated' },
    ],
    triggers: [
      { id: 'ch6_ruins_reveal', rect: CH6_WORLD.laughingRuins.reveal, once: true },
      { id: 'q_stones_listen', rect: CH6_WORLD.laughingRuins.stones, once: false },
      { id: 'held_breath_unlock', rect: CH6_WORLD.laughingRuins.heldBreath, once: false },
      { id: 'choice_trust', rect: CH6_WORLD.laughingRuins.choice, once: false },
    ],
  };
}

function buildSphinxChin(): MapDef {
  const { w: W, h: H } = CH6_WORLD.sphinxChin.size;
  const g = new Grid(W, H, 'O');
  carveEllipse(g, 28, 38, 11, 6);
  carveEllipse(g, 28, 25, 15, 10);
  carveEllipse(g, 28, 8, 12, 7);
  paintRibbon(g, [{ x: 28, y: 45 }, { x: 28, y: 38 }, { x: 28, y: 25 }], 3, '.');
  paintRibbon(g, [{ x: 28, y: 25 }, { x: 25, y: 18 }, { x: 28, y: 8 }], 3, '.');
  g.rect(CH6_WORLD.sphinxChin.ruinsMouth.x, CH6_WORLD.sphinxChin.ruinsMouth.y, 5, 1, 'o');

  return {
    id: 'sphinx_chin',
    name: "THE SPHINX'S CHIN",
    music: null,
    ambience: 'cave',
    grid: g.out(),
    props: [
      { sprite: 'meteor_rock', x: 27, y: 21, solid: ROCK_SOLID },
      { sprite: 'prop_resonance_stones', x: 27, y: 8 },
      { sprite: 'prop_trail_marker', x: 21, y: 36 },
      { sprite: 'prop_trail_marker', x: 34, y: 36 },
    ],
    npcs: [],
    signs: [{ x: 27, y: 35, dialogue: 'sign_sphinx_chin' }],
    phones: [],
    doors: [
      { ...CH6_WORLD.sphinxChin.ruinsMouth, to: 'laughing_ruins', tx: 64 * 16 + 8, ty: 2 * 16 + 12, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [
      { id: 'laughing_sphinx_boss', rect: CH6_WORLD.sphinxChin.boss, once: false },
      { id: 'sphinx_chin_resonance', rect: CH6_WORLD.sphinxChin.resonance, once: true },
    ],
  };
}

export function buildChapter6Maps(): Record<string, MapDef> {
  return {
    zanzibel: buildZanzibel(),
    savanna_run: buildSavannaRun(),
    laughing_ruins: buildLaughingRuins(),
    sphinx_chin: buildSphinxChin(),
  };
}
