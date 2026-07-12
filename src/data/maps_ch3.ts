/**
 * CHAPTER 3 — "A Very Foggy Term" (England), production map set.
 *
 * Lucille lands at the drowned quay of FOGGYBOTTOM-ON-TYNE. The climb through
 * its four fog terraces reaches the long Fog Road, WINTERMOOR ACADEMY, and the
 * OLD STONES Resonance Site. All twelve stable map ids, story/quest triggers,
 * reciprocal routes, and the four living-city Foggybottom units are save-facing
 * contracts. Geometry may grow; those semantic anchors must not drift.
 *
 * Tile reachability is only the first gate. Props use texture-true runtime
 * collision, so every authored landmark is based at the edge of a generous
 * three-tile-or-wider circulation route. Three picnic tables (§A4.5) sit before
 * dungeon pressure, and Wintermoor's boiler contains the real Freeze crossing.
 */
import { Grid, treeSprite } from './mapkit';
import { Streams } from '../levelkit';
import { placeFacade } from '../levelkit/kit';
import type { MapDef, PropDef } from '../schemas';

const PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const TREE_SOLID = { ox: 7, oy: 22, w: 12, h: 10 } as const;
// generic street-furniture solids (canon boxes, matching maps.ts/maps_ch2.ts/kit.ts SOLID)
const CRATE_SOLID = { ox: 1, oy: 8, w: 18, h: 9 } as const;
const BENCH_SOLID = { ox: 1, oy: 6, w: 20, h: 6 } as const;
const STALL_SOLID = { ox: 1, oy: 14, w: 38, h: 14 } as const;
const NEWS_BOX_SOLID = { ox: 2, oy: 10, w: 10, h: 7 } as const;
const TRASH_CAN_SOLID = { ox: 2, oy: 10, w: 10, h: 7 } as const;
const PLANTER_SOLID = { ox: 1, oy: 6, w: 20, h: 9 } as const;
const PLANT_POT_SOLID = { ox: 3, oy: 14, w: 8, h: 7 } as const;
// Foggybottom prop-strip solids (base-anchored: the tall/thin sheet keeps its full
// AUTHORED_WORLD_PROP_DISPLAY_SIZE sprite, but only the base footprint collides —
// same convention as sign/phone_pole/well, so a post/lamp never blocks more than
// its foot). fb_pub_sign / fb_window_box / fb_rope_coil are flat/wall-mounted
// dressing (no solid), matching gangplank/doormat/poster_* precedent.
const FB_POSTBOX_SOLID = { ox: 1, oy: 20, w: 10, h: 7 } as const;
const FB_MARKET_CROSS_SOLID = { ox: 6, oy: 34, w: 17, h: 14 } as const;
const FB_GAS_LAMP_SOLID = { ox: 6, oy: 52, w: 4, h: 7 } as const;
const FB_BARREL_SOLID = { ox: 1, oy: 17, w: 16, h: 8 } as const;
const FB_CRAB_POT_SOLID = { ox: 1, oy: 19, w: 16, h: 8 } as const;

const VEHICLE_SOLID = { ox: 3, oy: 8, w: 30, h: 8 } as const;
const LUCILLE_COCKPIT_SOLID = { ox: 5, oy: 88, w: 74, h: 22 } as const;
const CARGO_NET_SOLID = { ox: 4, oy: 72, w: 62, h: 18 } as const;
const VIADUCT_SOLIDS: NonNullable<PropDef['solidParts']> = [
  { ox: 4, oy: 96, w: 15, h: 34 },
  { ox: 53, oy: 96, w: 15, h: 34 },
];
const CULVERT_SOLID = { ox: 4, oy: 38, w: 46, h: 12 } as const;
const SCHOOL_GATE_SOLID = { ox: 5, oy: 112, w: 100, h: 24 } as const;
const LODGE_SOLID = { ox: 4, oy: 80, w: 62, h: 22 } as const;
const GREENHOUSE_SOLID = { ox: 6, oy: 108, w: 80, h: 24 } as const;
const PAVILION_SOLID = { ox: 6, oy: 99, w: 80, h: 24 } as const;
const TELEGRAPH_SOLID = { ox: 15, oy: 114, w: 8, h: 12 } as const;
const MENHIR_SOLID = { ox: 5, oy: 89, w: 30, h: 18 } as const;
const TRILITHON_SOLIDS: NonNullable<PropDef['solidParts']> = [
  { ox: 5, oy: 75, w: 19, h: 37 },
  { ox: 48, oy: 75, w: 19, h: 37 },
];
const SPRING_SOLID = { ox: 5, oy: 45, w: 38, h: 12 } as const;
const FOG_ENGINE_SOLID = { ox: 8, oy: 113, w: 76, h: 28 } as const;
const VALVE_SOLID = { ox: 6, oy: 60, w: 68, h: 18 } as const;
const COOLANT_BLOCKER_SOLID = { ox: 0, oy: 46, w: 80, h: 34 } as const;

const KETTLE_FACADE_X = 25;
const KETTLE_STREET_Y = 15;
const KETTLE_DOORSTEP = {
  x: KETTLE_FACADE_X * 16 + 24 + 8,
  y: KETTLE_STREET_Y * 16 + 62 + 23,
} as const;

type Point = readonly [number, number];

/** Paint a deterministic, fully joined polyline. Each step stamps a square, so
 * diagonal bends never pinch below the requested corridor width. */
function paintRoute(g: Grid, points: readonly Point[], width: number, ch: string): void {
  const half = Math.floor(width / 2);
  for (let p = 0; p < points.length - 1; p++) {
    const [ax, ay] = points[p];
    const [bx, by] = points[p + 1];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(ax + ((bx - ax) * i) / steps);
      const y = Math.round(ay + ((by - ay) * i) / steps);
      g.rect(x - half, y - half, width, width, ch);
    }
  }
}

function frame(g: Grid, wall: string, openings: readonly { x: number; y: number; w: number; h: number; floor: string }[] = []): void {
  g.rect(0, 0, g.w, 1, wall);
  g.rect(0, g.h - 1, g.w, 1, wall);
  g.rect(0, 0, 1, g.h, wall);
  g.rect(g.w - 1, 0, 1, g.h, wall);
  for (const o of openings) g.rect(o.x, o.y, o.w, o.h, o.floor);
}

function wallH(g: Grid, x: number, y: number, w: number, gaps: readonly [number, number][]): void {
  g.rect(x, y, w, 1, 'O');
  for (const [gx, gw] of gaps) g.rect(gx, y, gw, 1, 'o');
}

function wallV(g: Grid, x: number, y: number, h: number, gaps: readonly [number, number][]): void {
  g.rect(x, y, 1, h, 'O');
  for (const [gy, gh] of gaps) g.rect(x, gy, 1, gh, 'o');
}

/** the open tile FOGGYBOTTOM sets you down on when Lucille lands (the DROWNED QUAY,
 *  L0, the fog-soup bottom of the terraced hollow — S5 rebuild). Kept in sync with the
 *  biplane_interior hatch door, which reads FOGGYBOTTOM_LANDING.x/y (maps_ch3.test.ts). */
export const FOGGYBOTTOM_LANDING = { x: 20, y: 44 } as const;

/** Boiler crossing owned by the `wintermoor_coolant` PSI gate. Runtime may
 * replace the closed K cells with the open T cells after wm_coolant_frozen. */
export const WINTERMOOR_COOLANT_CROSSING = { x: 31, y: 19, w: 5, h: 3, closed: 'K', open: 'T' } as const;

/* ───────────────────────────── THE FLIGHT IN ─────────────────────────────── *
 * Lucille is a narrow working aeroplane, not an empty cutscene box: cockpit and
 * map table forward, passenger benches through the centre, cargo/tools aft, and
 * a dog-legged hatch approach that leaves room for the arrival scene. */
function buildBiplaneInterior(): MapDef {
  const W = 38;
  const H = 22;
  const g = new Grid(W, H, 'w'); // wooden cabin floor
  frame(g, 'W', [{ x: 18, y: H - 1, w: 3, h: 1, floor: 'w' }]);
  // cockpit bulkhead and the offset aft cargo bay; all passages stay ≥3 wide.
  wallH(g, 1, 6, W - 2, [[17, 4]]);
  wallV(g, 9, 7, 10, [[11, 4]]);
  wallV(g, 28, 7, 10, [[9, 4]]);
  g.rect(14, 8, 10, 2, 'r');
  g.rect(17, 9, 4, 11, 'r');
  g.rect(16, 18, 6, 3, 'w'); // hatch vestibule
  return {
    id: 'biplane_interior',
    name: 'LUCILLE',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'ch3_lucille_cockpit', x: 16, y: 0.2, solid: LUCILLE_COCKPIT_SOLID },
      { sprite: 'ch3_lucille_window', x: 3, y: 1.1 },
      { sprite: 'ch3_lucille_window', x: 29, y: 1.1 },
      { sprite: 'ch3_cargo_net', x: 29, y: 8.2, solid: CARGO_NET_SOLID },
      { sprite: 'ch3_cargo_net', x: 1.4, y: 12.2, solid: CARGO_NET_SOLID },
      { sprite: 'desk', x: 4, y: 8.5, solid: { ox: 0, oy: 8, w: 30, h: 10 } }, // Bert's charts/tools
      { sprite: 'bench', x: 12, y: 10.8, solid: BENCH_SOLID },
      { sprite: 'bench', x: 22, y: 13.2, solid: BENCH_SOLID },
      { sprite: 'crate', x: 31, y: 16, solid: CRATE_SOLID },
      { sprite: 'crate', x: 33, y: 17, solid: CRATE_SOLID },
      { sprite: 'fb_rope_coil', x: 30, y: 18.5 },
      { sprite: 'floor_lamp', x: 11, y: 17.2 },
    ],
    npcs: [
      { id: 'uncle_bert_air', sprite: 'uncleBert', x: 18, y: 8, facing: 'down', dialogue: 'npc_bert_air' },
    ],
    signs: [{ x: 23, y: 5, dialogue: 'sign_lucille_placard' }],
    phones: [],
    doors: [
      { x: 18, y: H - 1, w: 3, h: 1, to: 'foggybottom', tx: FOGGYBOTTOM_LANDING.x * 16, ty: FOGGYBOTTOM_LANDING.y * 16, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [{ id: 'ch3_arrival', rect: { x: 15, y: 10, w: 9, h: 5 }, once: true }],
  };
}

/* ───────────────────────── FOGGYBOTTOM-ON-TYNE ───────────────────────────── *
 * WORLD-OVERHAUL S5 PILOT — the first map rebuilt to the anti-formula bar AND the
 * first shipped ELEVATED map (opt-in true-elevation engine, P0–P4).
 *
 * SIGNATURE: a FOUR-TERRACE SEA-CLIFF you descend into a SINKING FOG-CEILING. The
 * town drops in stone shelves from the sunlit moor RIM (L3) down through the grey
 * HIGH STREET (L2) and the tilted MARKET shelf (L1) to the DROWNED QUAY (L0) where
 * Lucille moors on the Tyne. The machine-fog is a physical ceiling keyed to your
 * terrace (atmosphere:'fog', buildFog): a thin blue veil on the rim, a grey soup on
 * the quay — you navigate by which landmark pokes UP out of it. Three stairs are
 * STAGGERED west→center→east so the descent doglegs and can never be seen end-to-end.
 * The reversible fog-well VISTA bookends it (look down from the rim = your whole route
 * previewed; look up from the quay = the town climbing back into light). Every stair
 * DOWN visibly thickens the fog — the descent is the drama.
 *
 * The story arrival (Lucille → biplane_interior) drops you LOW on the quay in the soup;
 * you ASCEND toward the light to leave by the fog road (rim, east gate → foggy_moor +
 * the academy that MAKES the fog). Fixed points (maps_ch3.test.ts): settlement:'town',
 * area/ambience/reflect (post-assembly by id), one picnic, the 3 q_sender triggers, the
 * Lucille landing sync, the chemist shop, the reflective Tyne. NPCs are idle (per-mover
 * terrace collision lands with a later elevated map that needs cross-terrace roamers —
 * the spawner is pinned to the flat L1 shelf interior, clear of every K seam). */
const FB_W = 60;
const FB_H = 52;
// terrace row bands (north→south descent; the level plane DECREASES with +y). Each
// terrace is a walkable band; between two bands sits a 2–3-row 'K' cliff-face seam cut
// by exactly ONE 3-wide 'T' stair (staggered). Lips ('^') are the walkable upper rim.
//   RIM   L3: rows 1–9   · lip 10 · K seam 11–13 (stair W cols 8–10)
//   HIGH  L2: rows 14–22 · lip 23 · K seam 24–26 (stair C cols 28–30)
//   MKT   L1: rows 27–35 · lip 36 · K seam 37–39 (stair E cols 46–48)
//   QUAY  L0: rows 40–47 · foam 48 · sea/Tyne 49–51
function buildFoggybottom(): MapDef {
  const W = FB_W;
  const H = FB_H;
  const g = new Grid(W, H, '.');
  g.rect(0, 0, W, 1, 'B');

  // ═══ L3 RIM GARDENS (rows 1-9) — allotments, homes, service road, vista ═══
  g.rect(1, 4, W - 2, 3, 'R');
  g.rect(1, 5, W - 2, 1, '_');
  g.rect(7, 1, 1, 9, 'R');
  g.rect(8, 1, 1, 9, 'D');
  g.rect(9, 1, 1, 9, 'R'); // explicit R/D/R driveable service spur
  g.rect(2, 2, 4, 1, 'H');
  g.rect(2, 2, 1, 2, 'H');
  g.rect(14, 2, 9, 1, 'H');
  g.rect(22, 2, 1, 2, 'H');
  g.rect(42, 2, 9, 1, 'H');
  g.rect(50, 2, 1, 2, 'H');
  g.rect(3, 3, 2, 1, 'f');
  g.rect(16, 3, 5, 1, 'F');
  g.rect(44, 3, 5, 1, 'f');
  g.rect(27, 7, 8, 2, '='); // the fog-well overlook terrace

  // ═══ SEAM L3→L2 (lip 10 · K 11-13 · WEST stair cols 8-10) ═══
  g.rect(0, 10, W, 1, '^'); // the rim's south LIP — the fog-well vista rail (walkable)
  g.rect(0, 11, W, 3, 'K'); // the 3-row cliff face (P4 top/mid/base bands)
  g.rect(8, 10, 3, 4, 'T'); // the WEST stair (lip + face)

  // ═══ L2 HIGH STREET (rows 14-22) — workshops, civic row, service lane ═══
  g.rect(1, 14, W - 2, 9, '.');
  g.rect(1, 19, W - 2, 3, 'R');
  g.rect(1, 20, W - 2, 1, '_');
  g.rect(7, 14, 1, 9, 'R');
  g.rect(8, 14, 1, 9, 'D');
  g.rect(9, 14, 1, 9, 'R');
  g.rect(3, 21, 10, 2, 'P'); // motor-works apron, open to the R/D/R spur
  g.set(24, 19, '3');
  g.set(44, 21, '3');
  g.set(54, 20, '4');

  // ═══ SEAM L2→L1 (lip 23 · K 24-26 · CENTER stair cols 28-30) ═══
  g.rect(0, 23, W, 1, '^');
  g.rect(0, 24, W, 3, 'K');
  g.rect(28, 23, 3, 4, 'T'); // the CENTER stair (staggered east of the west stair)

  // ═══ L1 MARKET SHELF (rows 27-35) — circulating square + overlook green ═══
  g.rect(1, 27, W - 2, 8, '=');
  g.rect(14, 28, 31, 1, 'p');
  g.rect(14, 34, 31, 1, 'p');
  g.rect(14, 28, 1, 7, 'p');
  g.rect(44, 28, 1, 7, 'p');
  g.rect(27, 29, 5, 5, 'p');
  g.set(19, 31, '3');
  g.set(38, 32, '3');
  g.rect(2, 32, 9, 3, '.');
  g.rect(2, 34, 8, 1, 'b');

  // ═══ SEAM L1→L0 (lip 36 · K 37-39 · EAST stair cols 46-48) ═══
  g.rect(0, 36, W, 1, '^');
  g.rect(0, 37, W, 3, 'K');
  g.rect(46, 36, 3, 4, 'T'); // the EAST stair (staggered east again → the descent doglegs)

  // ═══ L0 DROWNED QUAY (rows 40-47) + the Tyne ═══
  g.rect(1, 40, W - 2, 4, '.');
  g.rect(1, 44, W - 2, 4, 'd');
  g.rect(8, 42, 12, 1, '=');
  g.rect(40, 42, 14, 1, '=');
  g.rect(18, 44, 12, 4, 'd'); // Lucille landing stage
  g.rect(0, 48, W, 1, 'E'); // foam at the river's lip
  g.rect(0, 49, W, 3, 'e'); // the river Tyne (the reflect zone, rows 49-51)

  // ─── NATURE/WEAR PASS — seeded off the frozen 310301 stream, run LAST so it
  // reads the resolved grid. Only wears WALKABLE ground ('.'/'='); never a seam
  // ('K'/'^'/'T'), water, dock, or foam (which would corrupt the level plane).
  const S = new Streams(310301);
  const wear = S.use('wearPass');
  for (let y = 1; y < H - 3; y++) {
    for (let x = 1; x < W - 1; x++) {
      const ch = g.rows[y][x];
      if (ch === '=' && wear() < 0.05) g.set(x, y, '3');
      else if (ch === '.' && wear() < 0.07) g.set(x, y, wear() < 0.5 ? ',' : '~');
    }
  }

  const grid = g.out();
  // the parallel LEVEL plane, GENERATED from the grid so dimensions match exactly
  // (elevation.test.ts + maps_foggybottom.test.ts assert row-for-row). North→south
  // descent: level DECREASES with +y (rim L3 → quay L0). Each seam's face rows stay
  // the UPPER level (so the overlay lifts the 'K' face) EXCEPT its 'T' stair cells,
  // which drop to the LOWER level so stepping DOWN the stair lowers you — the exact
  // buildElevSpike pattern, generalised to three seams. Every 0/1/2/3 seam is thus
  // K-walled or T-staired (no invisible ledge) and never jumps >1 level.
  const level = grid.map((rowStr, y) =>
    rowStr
      .split('')
      .map((ch) => {
        if (y <= 10) return '3'; // rim + its south lip
        if (y <= 13) return ch === 'T' ? '2' : '3'; // K seam L3→L2
        if (y <= 23) return '2'; // high street + its lip
        if (y <= 26) return ch === 'T' ? '1' : '2'; // K seam L2→L1
        if (y <= 36) return '1'; // market shelf + its lip
        if (y <= 39) return ch === 'T' ? '0' : '1'; // K seam L1→L0
        return '0'; // quay + foam + river
      })
      .join(''),
  );

  // The first five entries are a save-facing tenancy contract. occupyCity sees
  // four eligible facades in this order; The Kettle is hand-doored and skipped.
  const bottomHS = 20 * 16 - 4; // facade base fronts the L2 street at row 20

  const props: PropDef[] = [
    placeFacade('bldg_gen_civic_cyan_3', 3, bottomHS, 6, 3), // unit_0: motor works
    placeFacade('bldg_gen_brownstone_earth_3', 14, bottomHS, 4, 2), // unit_1: open-house flat
    placeFacade('bldg_gen_brownstone_earth_4', KETTLE_FACADE_X, bottomHS, 4, 2, {
      to: 'kettle_taproom',
      tx: 12 * 16,
      ty: 14 * 16 + 12,
    }),
    placeFacade('bldg_gen_civic_paper_3', 36, bottomHS, 6, 3), // unit_2: agency/post office
    placeFacade('bldg_gen_bank_paper_2', 48, bottomHS, 5, 2), // unit_3: bank/service counter

    // ── L3 rim residential gardens + fog-well overlook ──
    { sprite: treeSprite(3, 7, true), x: 3, y: 7, solid: TREE_SOLID },
    { sprite: treeSprite(54, 7, true), x: 54, y: 7, solid: TREE_SOLID },
    { sprite: 'bench', x: 29, y: 8.4, solid: BENCH_SOLID },
    { sprite: 'bench', x: 33, y: 8.4, solid: BENCH_SOLID },
    { sprite: 'fb_gas_lamp', x: 25, y: 8.4, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_gas_lamp', x: 37, y: 8.4, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'planter', x: 17, y: 7.7, solid: PLANTER_SOLID },
    { sprite: 'planter', x: 47, y: 7.7, solid: PLANTER_SOLID },
    { sprite: 'ch3_telegraph_pole', x: 11, y: 4.3, solid: TELEGRAPH_SOLID },
    { sprite: 'ch3_telegraph_pole', x: 51, y: 4.3, solid: TELEGRAPH_SOLID },
    // Cold, distant back-rank silhouette: the destination briefly appears
    // above the rim before the Fog Road hides it again.
    { sprite: 'ch3_academy_main', x: 43, y: -2, scale: 0.35 },

    // ── L2 high street + motor-works apron ──
    { sprite: 'vehicle_clunker', x: 4.2, y: 21.1, solid: VEHICLE_SOLID },
    { sprite: 'work_van', x: 9.2, y: 21.1, solid: VEHICLE_SOLID },
    { sprite: 'fb_gas_lamp', x: 2, y: 18.5, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_gas_lamp', x: 20, y: 18.5, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_gas_lamp', x: 34, y: 18.5, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_gas_lamp', x: 46, y: 18.5, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_postbox', x: 43, y: 21.4, solid: FB_POSTBOX_SOLID },
    { sprite: 'fb_pub_sign', x: 24.3, y: 18.6 },
    { sprite: 'fb_window_box', x: 15.2, y: 16.4 },
    { sprite: 'fb_window_box', x: 38.2, y: 15.8 },
    { sprite: 'news_box', x: 32, y: 21.5, solid: NEWS_BOX_SOLID },
    { sprite: 'trash_can', x: 55, y: 21.5, solid: TRASH_CAN_SOLID },

    // ── L1 market circuit + the one picnic overlook ──
    { sprite: 'fb_market_cross', x: 28, y: 30.4, solid: FB_MARKET_CROSS_SOLID },
    { sprite: 'market_stall_a', x: 16, y: 29, solid: STALL_SOLID },
    { sprite: 'market_stall_b', x: 36, y: 29, solid: STALL_SOLID },
    { sprite: 'market_stall_c', x: 17, y: 33, solid: STALL_SOLID },
    { sprite: 'picnic', x: 5, y: 32.4, solid: PICNIC_SOLID },
    { sprite: 'bench', x: 9, y: 33, solid: BENCH_SOLID },
    { sprite: 'fb_gas_lamp', x: 13, y: 28, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_gas_lamp', x: 45, y: 28, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'crate', x: 40, y: 33, solid: CRATE_SOLID },
    { sprite: 'fb_barrel', x: 42, y: 33, solid: FB_BARREL_SOLID },

    // ── L0 drowned quay — wet cargo, fishing gear, Lucille's clear landing ──
    { sprite: 'market_stall_c', x: 34, y: 40.8, solid: STALL_SOLID },
    { sprite: 'fb_crab_pot', x: 37, y: 42.5, solid: FB_CRAB_POT_SOLID },
    { sprite: 'fb_crab_pot', x: 39, y: 43, solid: FB_CRAB_POT_SOLID },
    { sprite: 'fb_rope_coil', x: 29, y: 45.5 },
    { sprite: 'fb_barrel', x: 42, y: 42, solid: FB_BARREL_SOLID },
    { sprite: 'fb_gas_lamp', x: 13, y: 42, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'fb_gas_lamp', x: 48, y: 42, solid: FB_GAS_LAMP_SOLID },
    { sprite: 'crate', x: 3, y: 44, solid: CRATE_SOLID },
    { sprite: 'crate', x: 5, y: 45, solid: CRATE_SOLID },
    { sprite: 'fb_barrel', x: 7, y: 45, solid: FB_BARREL_SOLID },
    { sprite: 'fb_rope_coil', x: 3, y: 46.3 },
    { sprite: 'fb_crab_pot', x: 53, y: 45, solid: FB_CRAB_POT_SOLID },
  ];

  return {
    id: 'foggybottom',
    name: 'FOGGYBOTTOM-ON-TYNE',
    music: null,
    settlement: 'town',
    grid,
    elevation: { level },
    props,
    npcs: [
      // the chemist — the shopkeeper (one obsession: the correct brewing of tea), on
      // the L2 high street in front of his facade. Idle (per-mover terrace collision
      // is deferred; see the header) — a fitting stillness for a fog-hushed town.
      { id: 'fb_chemist', sprite: 'smilerB', x: 16, y: 22, facing: 'down', dialogue: 'npc_fb_chemist', shop: 'foggybottom_chemist' },
      // a fishmonger down on the L0 quay (one obsession: the Tyne's moods — which he
      // can't even see through the soup)
      { id: 'fb_fishmonger', sprite: 'dockworker', x: 31, y: 42, facing: 'down', dialogue: 'npc_fb_fishmonger', idle: true },
      // the postmistress at the pillar box on the L2 high street (the pillar box has opinions)
      { id: 'fb_postmistress', sprite: 'senora', x: 43, y: 22, facing: 'down', dialogue: 'npc_fb_post', idle: true, emote: 'think' },
      // a damp small boy up on the bright L3 rim where the air is clean — 'the fog
      // tastes of pennies' lands hardest said ABOVE the fog
      { id: 'fb_boy', sprite: 'pajamaKid', x: 18, y: 7, facing: 'down', dialogue: 'npc_fb_boy', idle: true, emote: 'surprise' },
    ],
    signs: [
      { x: 12, y: 7, dialogue: 'sign_foggybottom' },
      { x: 56, y: 4, dialogue: 'sign_fog_road' },
      { x: 28, y: 43, dialogue: 'sign_quay' }, // down on the drowned quay
    ],
    phones: [{ x: 46, y: 22 }],
    atms: [{ x: 51, y: 22 }],
    doors: [
      // board Lucille at the water steps (L0 quay) — lands on the biplane's frozen hatch
      { x: 26, y: 45, w: 2, h: 1, to: 'biplane_interior', tx: 19 * 16 + 8, ty: 19 * 16 + 12, facing: 'down', indicator: 'none' },
      // the fog road UP to the moor + the academy (L3 rim, east gate) — lands at
      // foggy_moor's unchanged west mouth
      { x: W - 1, y: 4, w: 1, h: 3, to: 'foggy_moor', tx: 2 * 16 + 8, ty: 73 * 16 + 12, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      // §A7 town oddities — PINNED to the flat L1 shelf interior, clear of every K seam
      // and both L1 stairs (center cols 28-30, east cols 46-48), so the roamers cannot
      // path across a terrace edge (per-mover terrace collision is deferred).
      { enemies: ['pillar_box', 'brolly_bat'], count: 1, rect: { x: 12, y: 30, w: 6, h: 2 }, unlessFlag: 'mainframe_defeated' },
    ],
    // "Return to Sender" (ADR-099) — the three letters the pillar box spat out, now one
    // per terrace for the descent (rim allotment, high-street cobbles, market stalls).
    triggers: [
      { id: 'q_sender_l1', rect: { x: 20, y: 32, w: 5, h: 2 }, once: false }, // L1 market
      { id: 'q_sender_l2', rect: { x: 15, y: 20, w: 3, h: 2 }, once: false }, // L2 high street
      { id: 'q_sender_l3', rect: { x: 32, y: 5, w: 4, h: 2 }, once: false }, // L3 rim allotment
    ],
  };
}

/* ──────────────────────────── THE KETTLE (pub) ───────────────────────────── *
 * A full working taproom leads into the old snug. The snug map also contains a
 * separated, quiet guest room so the two-map contract can support paid lodging
 * without introducing a save-facing thirteenth map id. */
function buildKettleTaproom(): MapDef {
  const W = 24;
  const H = 16;
  const g = new Grid(W, H, 'w'); // wooden pub floor
  frame(g, 'W', [
    { x: 11, y: H - 1, w: 3, h: 1, floor: 'w' },
    { x: 17, y: 0, w: 3, h: 1, floor: 'w' },
  ]);
  g.rect(2, 8, 7, 1, 'W');
  g.rect(6, 8, 3, 1, 'w');
  g.rect(10, 4, 1, 6, 'W');
  g.rect(10, 6, 1, 3, 'w');
  g.rect(3, 10, 6, 3, 'r');
  g.rect(13, 8, 8, 4, 'r');
  g.rect(10, 11, 5, 4, 'w');
  return {
    id: 'kettle_taproom',
    name: 'THE KETTLE',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 2, y: 3, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'counter', x: 8, y: 3, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'fb_barrel', x: 2, y: 6, solid: FB_BARREL_SOLID },
      { sprite: 'fb_barrel', x: 4, y: 6, solid: FB_BARREL_SOLID },
      { sprite: 'fb_barrel', x: 6, y: 6, solid: FB_BARREL_SOLID },
      { sprite: 'bench', x: 3, y: 11, solid: BENCH_SOLID },
      { sprite: 'bench', x: 7, y: 11, solid: BENCH_SOLID },
      { sprite: 'bench', x: 14, y: 9, solid: BENCH_SOLID },
      { sprite: 'bench', x: 18, y: 9, solid: BENCH_SOLID },
      { sprite: 'stove', x: 20.5, y: 3.2, solid: { ox: 2, oy: 14, w: 14, h: 12 } },
      { sprite: 'floor_lamp', x: 20, y: 12 },
      { sprite: 'fb_pub_sign', x: 11.2, y: 1.1 },
      { sprite: 'fb_rope_coil', x: 15, y: 13 }, // umbrella basket/oddments by the mat
      { sprite: 'fb_rope_coil', x: 17, y: 13 },
      { sprite: 'crate', x: 21, y: 6, solid: CRATE_SOLID },
      { sprite: 'bookshelf', x: 11.5, y: 1.5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
    ],
    npcs: [
      { id: 'kettle_keeper', sprite: 'dockworker', x: 6, y: 5, facing: 'down', dialogue: 'npc_kettle_keeper' },
    ],
    signs: [{ x: 12, y: 2, dialogue: 'sign_kettle' }],
    phones: [],
    doors: [
      { x: 11, y: H - 1, w: 3, h: 1, to: 'foggybottom', tx: KETTLE_DOORSTEP.x, ty: KETTLE_DOORSTEP.y, facing: 'down', indicator: 'mat' },
      { x: 17, y: 0, w: 3, h: 1, to: 'kettle_snug', tx: 14 * 16 + 8, ty: 17 * 16 + 12, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildKettleSnug(): MapDef {
  const W = 28;
  const H = 20;
  const g = new Grid(W, H, 'w');
  frame(g, 'W', [{ x: 13, y: H - 1, w: 3, h: 1, floor: 'w' }]);
  // Guest room on the east: a proper wall and three-wide connecting doorway.
  g.rect(18, 1, 1, H - 2, 'W');
  g.rect(18, 9, 1, 3, 'w');
  g.rect(20, 3, 6, 9, 'r');
  g.rect(3, 5, 12, 7, 'r');
  g.rect(2, 14, 14, 1, 'W');
  g.rect(8, 14, 4, 1, 'w');
  return {
    id: 'kettle_snug',
    name: 'THE KETTLE — SNUG',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'stove', x: 3, y: 2.2, solid: { ox: 2, oy: 14, w: 14, h: 12 } },
      { sprite: 'bench', x: 5, y: 6, solid: BENCH_SOLID },
      { sprite: 'bench', x: 11, y: 6, solid: BENCH_SOLID },
      { sprite: 'bench', x: 5, y: 10, solid: BENCH_SOLID },
      { sprite: 'bench', x: 11, y: 10, solid: BENCH_SOLID },
      { sprite: 'fb_barrel', x: 15, y: 3, solid: FB_BARREL_SOLID },
      { sprite: 'fb_barrel', x: 15, y: 12, solid: FB_BARREL_SOLID },
      { sprite: 'bookshelf', x: 8, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'floor_lamp', x: 15, y: 8 },
      { sprite: 'fb_rope_coil', x: 3, y: 12 },
      { sprite: 'fb_crab_pot', x: 2, y: 16, solid: FB_CRAB_POT_SOLID },
      // The paid guest room: bed, wardrobe, lamp, writing desk, and its own rug.
      { sprite: 'bed', x: 21, y: 4, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'dresser', x: 24, y: 3, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
      { sprite: 'desk', x: 21, y: 12, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'floor_lamp', x: 25, y: 13 },
      { sprite: 'poster_chart', x: 20, y: 1.1 },
    ],
    npcs: [
      // the town's oldest regular — the fog's living memory (lore anchor, §I5)
      { id: 'kettle_regular', sprite: 'senora', x: 9, y: 8, facing: 'down', dialogue: 'npc_kettle_regular' },
    ],
    signs: [{ x: 3, y: 3, dialogue: 'sign_kettle_hearth' }],
    phones: [],
    doors: [
      { x: 13, y: H - 1, w: 3, h: 1, to: 'kettle_taproom', tx: 18 * 16 + 8, ty: 2 * 16 + 12, facing: 'down', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ───────────────────────────── THE FOG ROAD ──────────────────────────────── *
 * A full regional crossing: the road leaves town in the west, threads bog and
 * viaduct country, then climbs north-east into Wintermoor's sightline. The Old
 * Stones branch falls south; a Roman culvert pocket, overlook, and cross-moor
 * shortcut reward stepping off the main spine. All authored corridors are at
 * least three tiles wide. */
function buildFoggyMoor(): MapDef {
  const W = 126;
  const H = 96;
  const g = new Grid(W, H, '.');
  g.sprinkle(310302, '~~,,fF', 0.16);

  // Peat cuts and bog pools establish broad negative spaces before paths carve.
  g.rect(16, 14, 25, 9, 'e');
  g.rect(17, 13, 23, 1, 'E');
  g.rect(65, 18, 18, 12, 'e');
  g.rect(66, 17, 16, 1, 'E');
  g.rect(90, 68, 24, 12, 'e');
  g.rect(91, 67, 22, 1, 'E');
  g.rect(7, 82, 18, 7, 'e');
  g.rect(8, 81, 16, 1, 'E');

  // Dry-stone field divisions and windbreaks. Routes are carved afterward, so
  // every crossing has a deliberate gate rather than a diagonal pinch.
  g.rect(3, 57, 31, 1, 'B');
  g.rect(4, 67, 25, 1, 'B');
  g.rect(47, 75, 31, 1, 'B');
  g.rect(58, 44, 28, 1, 'B');
  g.rect(87, 34, 28, 1, 'B');
  g.rect(98, 14, 19, 1, 'B');
  g.rect(32, 28, 1, 20, 'B');
  g.rect(52, 7, 1, 20, 'B');
  g.rect(87, 79, 1, 13, 'B');

  // Allotments at the townward edge.
  g.rect(6, 59, 18, 1, 'H');
  g.rect(6, 59, 1, 7, 'H');
  g.rect(23, 59, 1, 7, 'H');
  g.rect(8, 61, 5, 3, 'f');
  g.rect(16, 61, 5, 3, 'F');

  const spine: Point[] = [[1, 73], [17, 73], [29, 65], [45, 68], [59, 56], [73, 51], [87, 39], [100, 25], [109, 2]];
  paintRoute(g, spine, 5, ':');
  paintRoute(g, [[51, 64], [46, 75], [38, 84], [36, 94]], 4, ':'); // Old Stones branch
  paintRoute(g, [[39, 68], [55, 73], [69, 68], [80, 57]], 3, ':'); // progression shortcut loop
  paintRoute(g, [[77, 48], [91, 55], [106, 59]], 3, ':'); // overlook / picnic dead end
  paintRoute(g, [[58, 69], [70, 77], [86, 78]], 3, ':'); // Roman culvert secret
  paintRoute(g, [[93, 31], [107, 36], [118, 33]], 3, ':'); // viaduct reveal breathing space

  frame(g, 'B', [
    { x: 0, y: 72, w: 1, h: 3, floor: ':' },
    { x: 108, y: 0, w: 4, h: 1, floor: ':' },
    { x: 34, y: H - 1, w: 4, h: 1, floor: ':' },
  ]);
  return {
    id: 'foggy_moor',
    name: 'THE FOG ROAD',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'ch3_viaduct_arch', x: 91, y: 24, solidParts: VIADUCT_SOLIDS },
      { sprite: 'ch3_roman_culvert', x: 82, y: 75, solid: CULVERT_SOLID },
      { sprite: 'ch3_academy_main', x: 105, y: 1.5, scale: 0.5 }, // far campus sightline
      { sprite: 'ch3_telegraph_pole', x: 20, y: 67, solid: TELEGRAPH_SOLID },
      { sprite: 'ch3_telegraph_pole', x: 44, y: 61, solid: TELEGRAPH_SOLID },
      { sprite: 'ch3_telegraph_pole', x: 68, y: 48, solid: TELEGRAPH_SOLID },
      { sprite: 'ch3_telegraph_pole', x: 88, y: 34, solid: TELEGRAPH_SOLID },
      { sprite: 'ch3_telegraph_pole', x: 102, y: 20, solid: TELEGRAPH_SOLID },
      { sprite: treeSprite(28, 45, true), x: 28, y: 45, solid: TREE_SOLID },
      { sprite: treeSprite(31, 42, true), x: 31, y: 42, solid: TREE_SOLID },
      { sprite: treeSprite(35, 44, true), x: 35, y: 44, solid: TREE_SOLID },
      { sprite: treeSprite(84, 61, true), x: 84, y: 61, solid: TREE_SOLID },
      { sprite: treeSprite(87, 63, true), x: 87, y: 63, solid: TREE_SOLID },
      { sprite: treeSprite(116, 49, true), x: 116, y: 49, solid: TREE_SOLID },
      { sprite: 'moor_sheep', x: 49, y: 82, solid: { ox: 4, oy: 18, w: 18, h: 8 } },
      { sprite: 'moor_sheep', x: 57, y: 86, solid: { ox: 4, oy: 18, w: 18, h: 8 } },
      { sprite: 'bench', x: 104, y: 58, solid: BENCH_SOLID },
      { sprite: 'picnic', x: 108, y: 58, solid: PICNIC_SOLID },
      { sprite: 'fb_gas_lamp', x: 5, y: 71, solid: FB_GAS_LAMP_SOLID },
    ],
    npcs: [
      { id: 'moor_rambler', sprite: 'tomas', x: 61, y: 54, facing: 'down', dialogue: 'npc_moor_rambler', wander: true },
    ],
    signs: [{ x: 14, y: 71, dialogue: 'sign_moor' }],
    phones: [],
    doors: [
      { x: 0, y: 72, w: 1, h: 3, to: 'foggybottom', tx: 57 * 16 + 8, ty: 5 * 16 + 12, facing: 'left', indicator: 'none' },
      { x: 108, y: 0, w: 4, h: 1, to: 'wintermoor_grounds', tx: 36 * 16 + 8, ty: 55 * 16 + 12, facing: 'up', indicator: 'none' },
      { x: 34, y: H - 1, w: 4, h: 1, to: 'the_old_stones', tx: 31 * 16 + 8, ty: 2 * 16 + 12, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['fog_hound', 'moor_sheep'], count: 2, rect: { x: 26, y: 54, w: 14, h: 8 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['brolly_bat', 'fog_hound'], count: 2, rect: { x: 72, y: 34, w: 12, h: 10 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['roman_sentry'], count: 1, rect: { x: 78, y: 73, w: 10, h: 8 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [{ id: 'q_penny_found', rect: { x: 80, y: 76, w: 8, h: 5 }, once: false }],
  };
}

/* ───────────────────────── WINTERMOOR ACADEMY (grounds) ──────────────────── *
 * A monumental, lived-in campus: gate and porter lodge, long reveal drive,
 * academy main, quadrangle/cloister, teaching and dormitory masses, ruined
 * greenhouse, cricket pavilion/nets, groundskeeper gardens, and the service
 * yard where Milo's first Clicker machine waits. */
function buildWintermoorGrounds(): MapDef {
  const W = 72;
  const H = 58;
  const g = new Grid(W, H, '.');
  g.sprinkle(310311, '~~,,fF', 0.08);

  // Main block base and flanking teaching/dormitory/chapel masses. Their doors
  // are broad tile openings; the towering authored facade supplies the identity.
  g.rect(21, 12, 30, 5, 'B');
  g.rect(34, 12, 5, 5, ':');
  g.rect(4, 16, 13, 12, 'B');
  g.rect(9, 25, 4, 3, ':');
  g.rect(55, 15, 12, 14, 'B');
  g.rect(59, 26, 4, 3, ':');
  g.rect(4, 29, 14, 7, 'B');
  g.rect(9, 33, 4, 3, ':');

  // Quadrangle and cloister: a visible stone ring with four generous entries.
  g.rect(22, 19, 29, 1, 'B');
  g.rect(22, 34, 29, 1, 'B');
  g.rect(22, 19, 1, 16, 'B');
  g.rect(50, 19, 1, 16, 'B');
  g.rect(34, 19, 5, 1, ':');
  g.rect(34, 34, 5, 1, ':');
  g.rect(22, 25, 1, 5, ':');
  g.rect(50, 25, 1, 5, ':');
  g.rect(25, 22, 23, 10, 'p');
  g.rect(31, 24, 11, 6, '.');
  g.rect(35, 25, 3, 4, 'f');

  // Monumental approach and cross-campus paths.
  paintRoute(g, [[36, 56], [36, 47], [32, 41], [36, 34], [36, 18], [36, 14]], 5, ':');
  paintRoute(g, [[10, 39], [22, 38], [36, 38], [50, 37], [61, 36]], 4, ':');

  // Cricket pitch, nets, gardens, and a real R/D/R delivery lane.
  g.rect(49, 37, 18, 14, 'm');
  g.rect(50, 43, 16, 1, 'h');
  g.rect(57, 38, 1, 12, 'v');
  g.rect(62, 18, 1, 37, 'R');
  g.rect(63, 18, 1, 37, 'D');
  g.rect(64, 18, 1, 37, 'R');
  g.rect(58, 20, 9, 10, 'P');
  g.rect(5, 38, 14, 12, '.');
  g.rect(6, 39, 12, 1, 'H');
  g.rect(6, 39, 1, 10, 'H');
  g.rect(17, 39, 1, 10, 'H');
  g.rect(8, 41, 3, 3, 'f');
  g.rect(13, 45, 3, 3, 'F');

  frame(g, 'B', [{ x: 34, y: H - 1, w: 5, h: 1, floor: ':' }]);
  return {
    id: 'wintermoor_grounds',
    name: 'WINTERMOOR ACADEMY',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'ch3_academy_main', x: 29, y: -4 },
      { sprite: 'ch3_school_gate', x: 30.5, y: 41.5, solid: SCHOOL_GATE_SOLID, unlessFlag: 'wm_gate_open' },
      { sprite: 'ch3_porter_lodge', x: 22, y: 43, solid: LODGE_SOLID },
      { sprite: 'ch3_greenhouse_wreck', x: 5, y: 27, solid: GREENHOUSE_SOLID },
      { sprite: 'ch3_cricket_pavilion', x: 53, y: 30, solid: PAVILION_SOLID },
      { sprite: 'ch3_valve_manifold', x: 58, y: 16.5, solid: VALVE_SOLID },
      { sprite: 'ch3_telegraph_pole', x: 42, y: 41, solid: TELEGRAPH_SOLID },
      { sprite: 'ch3_telegraph_pole', x: 43, y: 27, solid: TELEGRAPH_SOLID },
      { sprite: treeSprite(5, 51), x: 5, y: 51, solid: TREE_SOLID },
      { sprite: treeSprite(20, 49), x: 20, y: 49, solid: TREE_SOLID },
      { sprite: treeSprite(47, 53), x: 47, y: 53, solid: TREE_SOLID },
      { sprite: treeSprite(68, 32), x: 68, y: 32, solid: TREE_SOLID },
      { sprite: 'bench', x: 27, y: 31.7, solid: BENCH_SOLID },
      { sprite: 'bench', x: 43, y: 31.7, solid: BENCH_SOLID },
      { sprite: 'planter', x: 30, y: 17, solid: PLANTER_SOLID },
      { sprite: 'planter', x: 42, y: 17, solid: PLANTER_SOLID },
      { sprite: 'floor_lamp', x: 27, y: 17 },
      { sprite: 'floor_lamp', x: 45, y: 17 },
      { sprite: 'picnic', x: 11, y: 46, solid: PICNIC_SOLID },
      {
        sprite: 'work_van',
        x: 60,
        y: 24,
        solid: VEHICLE_SOLID,
        machine: {
          id: 'wm_clicker_practice_cart',
          name: 'Grounds Practice Cart',
          vehicleType: 'van',
          occupied: false,
          controlRect: { x: 57, y: 20, w: 10, h: 12 },
        },
      },
    ],
    npcs: [
      { id: 'wm_porter', sprite: 'smilerB', x: 34, y: 46, facing: 'down', dialogue: 'npc_wm_porter', unlessFlag: 'wm_gate_open', stationary: true },
      { id: 'wm_groundskeeper', sprite: 'dockworker', x: 11, y: 43, facing: 'down', dialogue: 'npc_wm_groundskeeper', wander: true },
      { id: 'wm_student', sprite: 'pajamaKid', x: 45, y: 26, facing: 'down', dialogue: 'npc_wm_student', wander: true },
      { id: 'cricket_captain', sprite: 'pajamaKid', x: 55, y: 45, facing: 'down', dialogue: 'npc_cricket_captain', stationary: true },
    ],
    signs: [
      { x: 39, y: 45, dialogue: 'sign_wintermoor_gate' },
      { x: 51, y: 42, dialogue: 'sign_cricket_pitch' },
      { x: 59, y: 29, dialogue: 'sign_cricket_pitch', machineAction: 'wm_clicker_training' },
    ],
    phones: [],
    doors: [
      { x: 34, y: H - 1, w: 5, h: 1, to: 'foggy_moor', tx: 109 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'none' },
      { x: 35, y: 14, w: 3, h: 2, to: 'wintermoor_f1', tx: 32 * 16 + 8, ty: 39 * 16 + 12, facing: 'up', indicator: 'door' },
    ],
    spawners: [
      { enemies: ['prefect_drone', 'schedule_bell'], count: 2, rect: { x: 24, y: 35, w: 13, h: 6 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['cricket_eleven'], count: 3, rect: { x: 51, y: 40, w: 15, h: 10 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [
      { id: 'wm_arrival', rect: { x: 31, y: 44, w: 11, h: 6 }, once: true },
      { id: 'q_cuppa_milk', rect: { x: 54, y: 32, w: 11, h: 5 }, once: false },
    ],
  };
}

/* ───────────────────────────── THE OLD STONES ────────────────────────────── *
 * A broad ceremonial landscape rather than a five-rock clearing: outer banks,
 * aligned approach, a readable ring of menhirs/trilithons, the clean spring,
 * and side pockets that frame the Resonance Site before and after the fog lifts. */
function buildOldStones(): MapDef {
  const W = 64;
  const H = 48;
  const g = new Grid(W, H, '.');
  g.sprinkle(310321, '~~,,f', 0.1);
  g.rect(5, 8, 16, 1, 'B');
  g.rect(43, 8, 16, 1, 'B');
  g.rect(5, 39, 18, 1, 'B');
  g.rect(41, 39, 18, 1, 'B');
  g.rect(8, 12, 1, 13, 'B');
  g.rect(55, 12, 1, 13, 'B');
  g.rect(10, 31, 1, 7, 'B');
  g.rect(53, 31, 1, 7, 'B');
  paintRoute(g, [[32, 1], [32, 11], [31, 20], [32, 29], [32, 45]], 5, ':');
  paintRoute(g, [[31, 20], [22, 24], [18, 31]], 3, ':');
  paintRoute(g, [[33, 20], [42, 24], [47, 31]], 3, ':');
  paintRoute(g, [[20, 31], [32, 35], [45, 31]], 3, ':');
  g.rect(24, 17, 17, 17, 'p');
  g.rect(27, 20, 11, 11, '.');
  g.rect(30, 22, 5, 7, ':'); // central north-south alignment
  frame(g, 'B', [{ x: 30, y: 0, w: 5, h: 1, floor: ':' }]);
  return {
    id: 'the_old_stones',
    name: 'THE OLD STONES',
    music: null,
    grid: g.out(),
    props: [
      { sprite: 'ch3_trilithon', x: 28, y: 12, solidParts: TRILITHON_SOLIDS },
      { sprite: 'ch3_trilithon', x: 28, y: 30, rot: 180, solidParts: TRILITHON_SOLIDS },
      { sprite: 'ch3_menhir', x: 20, y: 16, solid: MENHIR_SOLID },
      { sprite: 'ch3_menhir', x: 42, y: 16, solid: MENHIR_SOLID },
      { sprite: 'ch3_menhir', x: 17, y: 25, solid: MENHIR_SOLID },
      { sprite: 'ch3_menhir', x: 45, y: 25, solid: MENHIR_SOLID },
      { sprite: 'ch3_menhir', x: 22, y: 33, solid: MENHIR_SOLID },
      { sprite: 'ch3_menhir', x: 40, y: 33, solid: MENHIR_SOLID },
      { sprite: 'ch3_trilithon', x: 12, y: 27, rot: 90, solidParts: TRILITHON_SOLIDS },
      { sprite: 'ch3_trilithon', x: 48, y: 27, rot: 270, solidParts: TRILITHON_SOLIDS },
      // Same spring footprint, two save phases: quiet under the machine fog,
      // bright once the Mainframe stops. The post-Ember light remains wordless.
      { sprite: 'ch3_spring', x: 29, y: 37, solid: SPRING_SOLID, unlessFlag: 'mainframe_defeated' },
      { sprite: 'ch3_spring', x: 29, y: 37, solid: SPRING_SOLID, ifFlag: 'mainframe_defeated' },
      { sprite: 'ember', x: 31, y: 24, ifFlag: 'ember3' },
      { sprite: treeSprite(5, 30, true), x: 5, y: 30, solid: TREE_SOLID },
      { sprite: treeSprite(56, 30, true), x: 56, y: 30, solid: TREE_SOLID },
      { sprite: 'bench', x: 27, y: 43, solid: BENCH_SOLID },
    ],
    npcs: [],
    signs: [{ x: 36, y: 42, dialogue: 'sign_old_stones' }],
    phones: [],
    doors: [
      { x: 30, y: 0, w: 5, h: 1, to: 'foggy_moor', tx: 36 * 16 + 8, ty: 92 * 16 + 12, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['roman_sentry', 'fog_hound'], count: 1, rect: { x: 6, y: 26, w: 11, h: 9 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['roman_sentry'], count: 1, rect: { x: 47, y: 13, w: 10, h: 9 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [
      { id: 'old_stones_resonance', rect: { x: 28, y: 21, w: 9, h: 9 }, once: true },
      { id: 'q_cuppa_water', rect: { x: 27, y: 36, w: 9, h: 5 }, once: false },
    ],
  };
}

/* ════════════════════ WINTERMOOR ACADEMY — the dungeon ════════════════════ *
 * The live dungeon is a school consumed by its timetable: broad public halls,
 * looping classroom wings, a fair stealth dorm, the raised Headmaster arena,
 * and the pipe/catwalk boiler works where the machine fog is physically made.
 */

function buildWintermoorF1(): MapDef {
  const W = 64;
  const H = 42;
  const g = new Grid(W, H, 'o');
  frame(g, 'O', [
    { x: 30, y: H - 1, w: 5, h: 1, floor: 'o' },
    { x: 58, y: 0, w: 3, h: 1, floor: 'o' },
    { x: 3, y: 0, w: 3, h: 1, floor: 'o' },
  ]);

  // Faculty/trophy rooms west, library east, great hall through the centre.
  wallH(g, 1, 11, 28, [[8, 4], [20, 4]]);
  wallV(g, 28, 1, 20, [[6, 4], [16, 4]]);
  wallV(g, 38, 1, 24, [[9, 4], [19, 4]]);
  wallH(g, 38, 23, 25, [[48, 5]]);
  g.rect(40, 3, 1, 17, 'O');
  g.rect(45, 3, 1, 17, 'O');
  g.rect(50, 3, 1, 17, 'O');
  g.rect(55, 3, 1, 17, 'O');
  g.rect(60, 3, 1, 17, 'O');
  for (const x of [40, 45, 50, 55, 60]) {
    g.rect(x, 8, 1, 3, 'o');
    g.rect(x, 16, 1, 3, 'o');
  }
  // Tuck shop and service rooms flank the lower great hall; two arms remain.
  wallV(g, 18, 24, 17, [[28, 4], [36, 4]]);
  wallV(g, 46, 24, 17, [[28, 4], [36, 4]]);
  wallH(g, 1, 32, 17, [[7, 4]]);
  wallH(g, 47, 32, 16, [[53, 4]]);
  g.rect(23, 24, 18, 13, 'r');
  g.rect(29, 35, 6, 6, 'r');
  return {
    id: 'wintermoor_f1',
    name: 'WINTERMOOR — GREAT HALL',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 27, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'counter', x: 6, y: 27, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'counter', x: 9, y: 27, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'bookshelf', x: 41, y: 4, solid: { ox: 0, oy: 8, w: 52, h: 10 } },
      { sprite: 'bookshelf', x: 46, y: 12, solid: { ox: 0, oy: 8, w: 52, h: 10 } },
      { sprite: 'bookshelf', x: 51, y: 4, solid: { ox: 0, oy: 8, w: 52, h: 10 } },
      { sprite: 'bookshelf', x: 56, y: 12, solid: { ox: 0, oy: 8, w: 52, h: 10 } },
      { sprite: 'payphone', x: 58, y: 38, solid: PHONE_SOLID },
      { sprite: 'banner_productive', x: 31, y: 1 },
      { sprite: 'banner_productive', x: 31, y: 10 },
      { sprite: 'desk', x: 5, y: 5, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'desk', x: 18, y: 5, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'poster_chart', x: 4, y: 1 },
      { sprite: 'poster_smile', x: 22, y: 1 },
      { sprite: 'bench', x: 25, y: 29, solid: BENCH_SOLID },
      { sprite: 'bench', x: 37, y: 29, solid: BENCH_SOLID },
      { sprite: 'plant_pot', x: 21, y: 38, solid: PLANT_POT_SOLID },
      { sprite: 'plant_pot', x: 42, y: 38, solid: PLANT_POT_SOLID },
    ],
    npcs: [
      { id: 'wm_tuck_keeper', sprite: 'smilerB', x: 8, y: 30, facing: 'down', dialogue: 'npc_wm_tuck', shop: 'wintermoor_tuck' },
      { id: 'wm_librarian', sprite: 'senora', x: 53, y: 20, facing: 'down', dialogue: 'npc_wm_librarian', stationary: true },
    ],
    signs: [
      { x: 31, y: 12, dialogue: 'sign_wm_hall' },
      { x: 39, y: 21, dialogue: 'sign_wm_library' },
    ],
    phones: [{ x: 58, y: 38 }],
    doors: [
      { x: 30, y: H - 1, w: 5, h: 1, to: 'wintermoor_grounds', tx: 36 * 16 + 8, ty: 17 * 16 + 12, facing: 'down', indicator: 'door' },
      { x: 58, y: 0, w: 3, h: 1, to: 'wintermoor_f2', tx: 63 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'stairs' },
      { x: 3, y: 0, w: 3, h: 1, to: 'wintermoor_boiler', tx: 34 * 16 + 8, ty: 39 * 16 + 12, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['possessed_textbook', 'schedule_bell'], count: 2, rect: { x: 22, y: 17, w: 13, h: 6 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['telephone_box', 'tea_poltergeist'], count: 1, rect: { x: 48, y: 27, w: 12, h: 5 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['overdue_tome'], count: 1, rect: { x: 52, y: 12, w: 8, h: 6 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [{ id: 'q_overdue_b1', rect: { x: 42, y: 18, w: 7, h: 5 }, once: false }],
  };
}

function buildWintermoorF2(): MapDef {
  const W = 68;
  const H = 44;
  const g = new Grid(W, H, 'o');
  frame(g, 'O', [
    { x: 62, y: 0, w: 3, h: 1, floor: 'o' },
    { x: 3, y: 0, w: 3, h: 1, floor: 'o' },
    { x: 32, y: H - 1, w: 5, h: 1, floor: 'o' },
  ]);

  // Three east-west classroom bands linked by four north-south corridors.
  wallH(g, 1, 10, W - 2, [[6, 4], [21, 4], [37, 4], [54, 4], [62, 3]]);
  wallH(g, 1, 22, W - 2, [[8, 4], [25, 4], [41, 4], [57, 4]]);
  wallH(g, 1, 34, W - 2, [[6, 4], [20, 4], [34, 5], [51, 4], [62, 3]]);
  wallV(g, 17, 1, 42, [[5, 4], [15, 4], [27, 4], [38, 4]]);
  wallV(g, 33, 1, 42, [[4, 4], [14, 5], [27, 5], [37, 4]]);
  wallV(g, 49, 1, 42, [[6, 4], [16, 4], [26, 4], [38, 4]]);
  g.rect(52, 2, 13, 7, 'r'); // science room / fog-pipe lab
  g.rect(20, 13, 11, 7, 'r');
  g.rect(35, 25, 12, 7, 'r');
  g.rect(20, 36, 11, 6, 'r');
  return {
    id: 'wintermoor_f2',
    name: 'WINTERMOOR — FLOOR 2',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'desk', x: 4, y: 5, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'desk', x: 20, y: 5, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'desk', x: 36, y: 5, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'desk', x: 4, y: 16, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'desk', x: 21, y: 16, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'desk', x: 37, y: 28, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
      { sprite: 'dresser', x: 51, y: 14, solid: { ox: 0, oy: 8, w: 28, h: 10 } },
      { sprite: 'dresser', x: 55, y: 14, solid: { ox: 0, oy: 8, w: 28, h: 10 } },
      { sprite: 'dresser', x: 59, y: 14, solid: { ox: 0, oy: 8, w: 28, h: 10 } },
      { sprite: 'ch3_valve_manifold', x: 54, y: 3.5, solid: VALVE_SOLID },
      { sprite: 'ch3_cargo_net', x: 60, y: 3, solid: CARGO_NET_SOLID }, // pipe-rack safety mesh
      { sprite: 'poster_chart', x: 34, y: 1 },
      { sprite: 'poster_smile', x: 2, y: 12 },
      { sprite: 'poster_chart', x: 50, y: 24 },
      { sprite: 'bookshelf', x: 3, y: 25, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'plant_pot', x: 31, y: 40, solid: PLANT_POT_SOLID },
    ],
    npcs: [
      // Mr. Stumps, the umpire the Mainframe filed ABSENT — "The Last Over" step (ADR-099)
      { id: 'wm_umpire', sprite: 'dockworker', x: 10, y: 16, facing: 'down', dialogue: 'npc_wm_umpire', stationary: true },
    ],
    signs: [{ x: 34, y: 3, dialogue: 'sign_wm_f2' }],
    phones: [],
    doors: [
      { x: 62, y: 0, w: 3, h: 1, to: 'wintermoor_f1', tx: 59 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'stairs' },
      { x: 3, y: 0, w: 3, h: 1, to: 'wintermoor_f3', tx: 5 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'stairs' },
      { x: 32, y: H - 1, w: 5, h: 1, to: 'wintermoor_dorm', tx: 36 * 16 + 8, ty: 2 * 16 + 12, facing: 'up', indicator: 'door' },
    ],
    spawners: [
      { enemies: ['detention_desk', 'foggy_locker'], count: 2, rect: { x: 20, y: 24, w: 12, h: 8 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['tea_trolley', 'schedule_bell'], count: 2, rect: { x: 51, y: 35, w: 13, h: 6 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [{ id: 'q_overdue_b2', rect: { x: 52, y: 12, w: 11, h: 6 }, once: false }],
  };
}

function buildWintermoorF3(): MapDef {
  const W = 64;
  const H = 42;
  const g = new Grid(W, H, 'o');
  frame(g, 'O', [{ x: 3, y: 0, w: 3, h: 1, floor: 'o' }]);

  // West exam hall + invigilation loop.
  wallH(g, 1, 12, 35, [[8, 4], [25, 5]]);
  wallH(g, 1, 27, 35, [[6, 4], [20, 5], [31, 4]]);
  wallV(g, 18, 1, 40, [[7, 4], [18, 5], [33, 4]]);
  wallV(g, 36, 1, 40, [[8, 5], [20, 6], [34, 4]]);
  g.rect(3, 15, 12, 9, 'r');
  g.rect(21, 15, 12, 9, 'r');
  g.rect(7, 30, 23, 8, 'r');

  // The Headmaster's office is a visibly raised, self-contained boss arena.
  g.rect(39, 2, 24, 1, 'O');
  g.rect(39, 2, 1, 18, 'O');
  g.rect(62, 2, 1, 18, 'O');
  g.rect(40, 3, 22, 15, 'r');
  g.rect(39, 18, 24, 2, 'K');
  g.rect(49, 18, 5, 2, 'T');
  g.rect(44, 6, 14, 8, 'M');
  return {
    id: 'wintermoor_f3',
    name: 'WINTERMOOR — THE EXAM HALL',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'office_door', x: 50, y: 17, solid: { ox: 0, oy: 12, w: 16, h: 14 } },
      { sprite: 'ch3_fog_engine', x: 47, y: 3, solid: FOG_ENGINE_SOLID, unlessFlag: 'mainframe_defeated' },
      { sprite: 'ch3_valve_manifold', x: 48, y: 6, solid: VALVE_SOLID, ifFlag: 'mainframe_defeated' },
      { sprite: 'desk', x: 4, y: 16, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'desk', x: 10, y: 20, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'desk', x: 22, y: 16, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'desk', x: 28, y: 20, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'desk', x: 9, y: 32, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'desk', x: 18, y: 35, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
      { sprite: 'poster_smile', x: 20, y: 1 },
      { sprite: 'banner_productive', x: 32, y: 1 },
      { sprite: 'poster_chart', x: 2, y: 29 },
      { sprite: 'bench', x: 40, y: 22, solid: BENCH_SOLID },
      { sprite: 'bench', x: 56, y: 22, solid: BENCH_SOLID },
    ],
    npcs: [],
    signs: [
      { x: 51, y: 21, dialogue: 'sign_wm_office' },
      { x: 20, y: 39, dialogue: 'sign_wm_exam' },
    ],
    phones: [],
    doors: [
      { x: 3, y: 0, w: 3, h: 1, to: 'wintermoor_f2', tx: 5 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['head_prefect'], count: 1, rect: { x: 4, y: 29, w: 12, h: 9 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['the_invigilator'], count: 1, rect: { x: 22, y: 29, w: 12, h: 9 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [{ id: 'mainframe_boss', rect: { x: 43, y: 7, w: 17, h: 10 }, once: false }],
  };
}

function buildWintermoorDorm(): MapDef {
  const W = 72;
  const H = 44;
  const g = new Grid(W, H, 'o');
  frame(g, 'O', [{ x: 34, y: 0, w: 5, h: 1, floor: 'o' }]);

  // North and south bedroom rows open onto broad patrol galleries.
  wallH(g, 1, 9, W - 2, [[5, 4], [17, 4], [29, 4], [41, 4], [53, 4], [64, 4]]);
  wallH(g, 1, 34, W - 2, [[5, 4], [17, 4], [29, 4], [41, 4], [53, 4], [64, 4]]);
  for (const x of [12, 24, 36, 48, 60]) {
    g.rect(x, 1, 1, 8, 'O');
    g.rect(x, 35, 1, 8, 'O');
  }
  // The F2 landing owns this five-wide centre lane. Carve it after the room
  // partitions so the reciprocal target (36,2) can never land in the x=36 wall.
  g.rect(34, 1, 5, 9, 'o');

  // Common room, washroom, and laundry sit inside a cover-rich inner loop.
  wallV(g, 24, 14, 17, [[19, 4], [27, 4]]);
  wallV(g, 49, 14, 17, [[18, 4], [26, 4]]);
  wallH(g, 24, 14, 26, [[34, 5]]);
  wallH(g, 24, 30, 26, [[34, 5]]);
  wallH(g, 50, 21, 20, [[58, 4]]);
  g.rect(28, 17, 18, 11, 'r');
  g.rect(52, 15, 16, 5, 'r');
  g.rect(52, 24, 16, 5, 'r');
  return {
    id: 'wintermoor_dorm',
    name: 'WINTERMOOR — DORM WING',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 3, y: 3, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 15, y: 3, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 27, y: 3, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 43, y: 3, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 55, y: 3, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 65, y: 3, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 4, y: 37, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'cot', x: 16, y: 37, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'bed', x: 28, y: 37, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 42, y: 37, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 54, y: 37, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'bed', x: 65, y: 37, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
      { sprite: 'sofa', x: 31, y: 20, solid: { ox: 1, oy: 12, w: 36, h: 12 } },
      { sprite: 'bench', x: 40, y: 25, solid: BENCH_SOLID },
      { sprite: 'bookshelf', x: 29, y: 16, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'dresser', x: 53, y: 16, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
      { sprite: 'dresser', x: 60, y: 16, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
      { sprite: 'water_cooler', x: 54, y: 25, solid: { ox: 0, oy: 6, w: 40, h: 14 } },
      { sprite: 'counter', x: 61, y: 25, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'poster_smile', x: 35, y: 1 },
      { sprite: 'poster_chart', x: 51, y: 22 },
      { sprite: 'floor_lamp', x: 46, y: 27 },
    ],
    npcs: [
      { id: 'dorm_student', sprite: 'pajamaKid', x: 37, y: 24, facing: 'down', dialogue: 'npc_dorm_student', stationary: true },
    ],
    signs: [{ x: 39, y: 2, dialogue: 'sign_wm_dorm' }],
    phones: [],
    doors: [
      { x: 34, y: 0, w: 5, h: 1, to: 'wintermoor_f2', tx: 34 * 16 + 8, ty: 41 * 16 + 12, facing: 'up', indicator: 'stairs' },
    ],
    spawners: [],
    patrols: [
      // The east leg uses the four-tile opening in the row-21 partition and
      // stays west of the laundry furniture; a leg at x=66 deadlocks on K.
      { id: 'dorm_a', enemy: 'prefect_drone', route: [[5, 12], [58, 12], [58, 32], [5, 32]], sight: 5 },
      { id: 'dorm_b', enemy: 'prefect_drone', route: [[28, 19], [45, 19], [45, 28], [28, 28]], sight: 4 },
    ],
    triggers: [{ id: 'q_overdue_b3', rect: { x: 14, y: 36, w: 8, h: 6 }, once: false }],
  };
}

function buildWintermoorBoiler(): MapDef {
  const W = 68;
  const H = 42;
  const g = new Grid(W, H, 'o');
  frame(g, 'O', [{ x: 32, y: H - 1, w: 5, h: 1, floor: 'o' }]);

  // The coolant main physically divides the fog plant. It is deliberately a
  // map-wide solid K band: Freeze replaces only the five marked centre cells
  // with T, creating the single fair crossing into the production half.
  g.rect(1, WINTERMOOR_COOLANT_CROSSING.y, W - 2, WINTERMOOR_COOLANT_CROSSING.h, 'K');
  g.rect(
    WINTERMOOR_COOLANT_CROSSING.x,
    WINTERMOOR_COOLANT_CROSSING.y,
    WINTERMOOR_COOLANT_CROSSING.w,
    WINTERMOOR_COOLANT_CROSSING.h,
    WINTERMOOR_COOLANT_CROSSING.closed,
  );

  // North: boiler bays, fog compressor, and inspection loops.
  wallV(g, 20, 1, 18, [[5, 4], [13, 4]]);
  wallV(g, 47, 1, 18, [[6, 4], [14, 3]]);
  wallH(g, 1, 10, 19, [[7, 4], [14, 3]]);
  wallH(g, 21, 13, 26, [[30, 6], [40, 4]]);
  wallH(g, 48, 10, 19, [[54, 4], [62, 3]]);
  g.rect(23, 2, 22, 9, 'r');
  g.rect(3, 3, 14, 5, 'P');
  g.rect(51, 3, 13, 5, 'P');
  g.rect(3, 13, 14, 4, 'P');
  g.rect(51, 13, 13, 4, 'P');

  // South: the valve yard and Fogworks tug form two generous loops around the
  // central approach, so the interaction areas never become a furniture maze.
  wallV(g, 18, 22, 19, [[26, 4], [35, 4]]);
  wallV(g, 49, 22, 19, [[26, 4], [35, 4]]);
  wallH(g, 1, 31, 17, [[7, 5]]);
  wallH(g, 19, 34, 30, [[31, 7], [43, 4]]);
  wallH(g, 50, 31, 17, [[56, 5]]);
  g.rect(22, 24, 23, 7, 'r');
  g.rect(25, 36, 19, 5, 'r');
  g.rect(3, 24, 12, 5, 'P');
  g.rect(53, 24, 12, 5, 'P');
  return {
    id: 'wintermoor_boiler',
    name: 'WINTERMOOR — BOILER ROOM',
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      // The real fog engine is visible beyond the Freeze crossing, then stands
      // down into a quiet valve bank after the Mainframe fight.
      { sprite: 'ch3_fog_engine', x: 27, y: 1.5, solid: FOG_ENGINE_SOLID, unlessFlag: 'mainframe_defeated' },
      { sprite: 'ch3_valve_manifold', x: 28, y: 5, solid: VALVE_SOLID, ifFlag: 'mainframe_defeated' },
      { sprite: 'ch3_valve_manifold', x: 5, y: 2.5, solid: VALVE_SOLID },
      { sprite: 'ch3_valve_manifold', x: 53, y: 2.5, solid: VALVE_SOLID },
      { sprite: 'ch3_valve_manifold', x: 5, y: 12.5, solid: VALVE_SOLID },
      { sprite: 'ch3_valve_manifold', x: 53, y: 12.5, solid: VALVE_SOLID },
      { sprite: 'ch3_cargo_net', x: 13, y: 3, solid: CARGO_NET_SOLID },
      { sprite: 'ch3_cargo_net', x: 48, y: 13, solid: CARGO_NET_SOLID },

      // Same footprint, two coolant phases. Runtime changes the matching K
      // cells to T under wm_coolant_frozen; this prop pair changes the art and
      // removes the texture-true blocker in the same save phase.
      {
        sprite: 'ch3_valve_manifold',
        x: WINTERMOOR_COOLANT_CROSSING.x,
        y: 16,
        solid: COOLANT_BLOCKER_SOLID,
        unlessFlag: 'wm_coolant_frozen',
      },
      {
        sprite: 'ch3_valve_manifold',
        x: WINTERMOOR_COOLANT_CROSSING.x,
        y: 16,
        rot: 90,
        ifFlag: 'wm_coolant_frozen',
      },

      { sprite: 'counter', x: 3, y: 26, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'counter', x: 11, y: 26, solid: { ox: 0, oy: 4, w: 40, h: 14 } },
      { sprite: 'crate', x: 4, y: 35, solid: CRATE_SOLID },
      { sprite: 'crate', x: 7, y: 36, solid: CRATE_SOLID },
      { sprite: 'fb_barrel', x: 13, y: 36, solid: FB_BARREL_SOLID },
      { sprite: 'bench', x: 24, y: 29, solid: BENCH_SOLID },
      { sprite: 'bench', x: 41, y: 29, solid: BENCH_SOLID },
      {
        sprite: 'work_van',
        x: 55,
        y: 27,
        solid: VEHICLE_SOLID,
        unlessFlag: 'wm_fogworks_solved',
        machine: {
          id: 'wm_fogworks_tug',
          name: 'Fogworks Valve Tug',
          vehicleType: 'van',
          occupied: false,
          controlRect: { x: 51, y: 24, w: 15, h: 13 },
        },
      },
      // A parked, harmless tug is the visible result of solving its machine
      // interaction; it intentionally has no machine contract a second time.
      { sprite: 'work_van', x: 58, y: 34, rot: 90, solid: VEHICLE_SOLID, ifFlag: 'wm_fogworks_solved' },
    ],
    npcs: [],
    signs: [
      { x: 28, y: 24, dialogue: 'sign_wm_coolant' },
      { x: 60, y: 32, dialogue: 'sign_wm_coolant', machineAction: 'wm_fogworks_valve' },
    ],
    phones: [],
    doors: [
      { x: 32, y: H - 1, w: 5, h: 1, to: 'wintermoor_f1', tx: 4 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['boiler_golem', 'soot_imp'], count: 2, rect: { x: 22, y: 14, w: 13, h: 5 }, unlessFlag: 'mainframe_defeated' },
      { enemies: ['greenhouse_creeper'], count: 1, rect: { x: 51, y: 12, w: 13, h: 5 }, unlessFlag: 'mainframe_defeated' },
    ],
    triggers: [{ id: 'wintermoor_coolant', rect: { x: 27, y: 17, w: 13, h: 8 }, once: false }], // §A4.11 PSI gate
  };
}

/**
 * THE CHAPTER 3 MAP SET — the arrival, England overworld, two-room Kettle, Old
 * Stones, and the complete Wintermoor Academy dungeon through its Mainframe
 * arena. This exact twelve-id record is save-facing and assembled into MAPS.
 */
export function buildChapter3Maps(): Record<string, MapDef> {
  return {
    biplane_interior: buildBiplaneInterior(),
    foggybottom: buildFoggybottom(),
    foggy_moor: buildFoggyMoor(),
    kettle_taproom: buildKettleTaproom(),
    kettle_snug: buildKettleSnug(),
    wintermoor_grounds: buildWintermoorGrounds(),
    the_old_stones: buildOldStones(),
    wintermoor_f1: buildWintermoorF1(),
    wintermoor_f2: buildWintermoorF2(),
    wintermoor_f3: buildWintermoorF3(),
    wintermoor_dorm: buildWintermoorDorm(),
    wintermoor_boiler: buildWintermoorBoiler(),
  };
}
