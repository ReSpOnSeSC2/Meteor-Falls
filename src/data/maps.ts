/**
 * Chapter 1 maps (ADR-004: code-authored grids behind the same MapDef the
 * future Tiled loader will emit). Legend:
 *   . , ~ grass variants   f F flowers   : path (auto-edged)   b bush
 *   - | fences   s S scorch / ember-flecked scorch
 *   w floor   W wall   r rug
 *   = sidewalk   R D road / dashed centerline   X crosswalk   B brick wall
 *   o office floor   O office wall   c cubicle partition   k cubicle desk
 *   y day sky   u bus floor   U bus wall
 */
import { cityBuildingHeight } from '../spritegen/tiles';
import { Grid, seededRng, treeSprite, doorstepOf } from './mapkit';
import { buildChapter2Maps } from './maps_ch2';
import { buildChapter3Maps } from './maps_ch3';
import { buildChapter4Maps } from './maps_ch4';
import { buildChapter5Maps } from './maps_ch5';
import { buildChapter6Maps } from './maps_ch6';
import { buildChapter7Maps } from './maps_ch7';
import { buildChapter8Maps } from './maps_ch8';
import { buildChapter9Maps } from './maps_ch9';
import { buildChapter10Maps } from './maps_ch10';
// S15h (ADR-049) — THE WORLD BLOCK: the forge lays the new growth as a DISTRICT
// stitched onto each frozen core (the bones); the soul stays hand-authored.
import { buildDistrict, buildRoute, buildWoods, Streams } from '../levelkit';
import { placeFacade, facadeDims } from '../levelkit/kit';
import { occupyCity } from './citylife';
import { AREA_SKINS } from '../spritegen/buildings';

export { Grid, seededRng, treeSprite, doorstepOf } from './mapkit';
import type { MapDef, PropDef, NpcDef, SignDef, AmbienceId, ReflectZone } from '../schemas';

// S5: shapes are z.infer'd from src/schemas — compile shape ≡ runtime schema
export type {
  DoorZone,
  MapDef,
  NpcDef,
  PatrolDef,
  PropDef,
  SignDef,
  SpawnerDef,
  TriggerDef,
} from '../schemas';

/** grid char -> tile name (the scene renders from this; tests validate it) */
export const CHAR_LEGEND: Record<string, string> = {
  '.': 'grass_a',
  ' ': 'grass_a', // sprinkle charsets use a space as "plain grass"
  ',': 'grass_b',
  '~': 'grass_tuft',
  f: 'flowers_red',
  F: 'flowers_gold',
  b: 'bush',
  '-': 'fence_h',
  '|': 'fence_v',
  s: 'scorch',
  S: 'scorch_ember',
  w: 'floor_wood',
  W: 'wall_int',
  r: 'rug',
  '=': 'sidewalk',
  R: 'road',
  D: 'road_dash',
  X: 'crosswalk',
  P: 'parking',
  B: 'brick',
  o: 'office_floor',
  O: 'office_wall',
  c: 'cubicle',
  k: 'cubicle_desk',
  y: 'sky_day',
  u: 'bus_floor',
  U: 'bus_wall',
  // S7 street wear (ADR-019) — builder-scattered, all walkable
  '1': 'sidewalk_crack',
  '2': 'road_patch',
  '3': 'storm_drain',
  // S10 STARPORT arcades
  a: 'arcade_floor',
  '*': 'arcade_floor_star',
  A: 'arcade_wall',
  // S12 THE CAGE
  q: 'asphalt',
  z: 'asphalt_crack',
  h: 'asphalt_line_h',
  v: 'asphalt_line_v',
  C: 'cage_mesh',
  // S14 Chapter 2 — the crossing, the port, the jungle, the pyramid
  e: 'sea_a',
  E: 'sea_foam',
  d: 'dock',
  p: 'plaza',
  n: 'sand_a',
  j: 'jungle_floor',
  J: 'jungle_wall',
  Y: 'pyramid_floor',
  Z: 'pyramid_wall',
  G: 'pyramid_glyph',
  g: 'pyramid_rotor',
  // S15i Task 6 (ADR-059) — the golf resort's manicured course
  m: 'fairway',
  // EB GROUND KIT (2026-07-02 baseline overhaul) — Onett-style terracing. Scanned
  // FREE across every shipped grid before adoption (no stray K/^/T cells existed).
  K: 'cliff_face', // solid terrace wall — paint 1-2 rows tall below the upper level
  '^': 'cliff_lip', // walkable grass-over-rock trim on the upper terrace's edge row
  T: 'stairs', // walkable concrete steps connecting terrace levels
  // WORLD-OVERHAUL (Ch3+) — the HEDGE-WALL autotile belt (solid). buildTiles special-
  // cases 'H' to pick hedge_<mask> by 4-neighbour connectivity; this legend entry is the
  // solidity + boot fallback (isSolidChar('H') = hedge_15 is solid). See tiles.ts HEDGE_BASE.
  H: 'hedge_15', // solid winding-corridor hedge wall (16-mask; rendered per-neighbour)
  V: 'bramble_15', // solid winding-corridor bramble wall (16-mask; the hedge's thornier sibling)
};

// treeSprite lives in mapkit.ts (S14 extraction — byte-identical)

/* ---- EB winding-path painters (2026-07-02 de-blockify pass) ----
 * Roads and trails are painted from hand-authored CENTER TABLES instead of
 * straight rects: one center per row (windV) or per column (windH), each row
 * painting the UNION of its own span and the next row's span so every bend
 * stays ≥w connected (no diagonal pinches). Deterministic — the tables are
 * literals, never RNG. */
function windV(g: Grid, x0Centers: number[], yTop: number, w: number, ch: string): void {
  const half = Math.floor(w / 2);
  for (let i = 0; i < x0Centers.length; i++) {
    const next = x0Centers[Math.min(i + 1, x0Centers.length - 1)];
    const lo = Math.min(x0Centers[i], next) - half;
    const hi = Math.max(x0Centers[i], next) + (w - 1 - half);
    g.rect(lo, yTop + i, hi - lo + 1, 1, ch);
  }
}

function roadV(g: Grid, xCenters: number[], yTop: number, w = 4): void {
  const half = Math.floor(w / 2);
  for (let i = 0; i < xCenters.length; i++) {
    const y = yTop + i;
    const next = xCenters[Math.min(i + 1, xCenters.length - 1)];
    const lo = Math.min(xCenters[i], next) - half;
    const hi = Math.max(xCenters[i], next) + (w - 1 - half);
    g.rect(lo - 1, y, 1, 1, '=');
    g.rect(hi + 1, y, 1, 1, '=');
    g.rect(lo, y, hi - lo + 1, 1, 'R');
    if (i % 4 < 2) g.set(Math.round((lo + hi) / 2), y, 'D');
  }
}

function roadH(g: Grid, yCenters: number[], xLeft: number, h = 4): void {
  const half = Math.floor(h / 2);
  for (let i = 0; i < yCenters.length; i++) {
    const x = xLeft + i;
    const next = yCenters[Math.min(i + 1, yCenters.length - 1)];
    const lo = Math.min(yCenters[i], next) - half;
    const hi = Math.max(yCenters[i], next) + (h - 1 - half);
    g.rect(x, lo - 1, 1, 1, '=');
    g.rect(x, hi + 1, 1, 1, '=');
    g.rect(x, lo, 1, hi - lo + 1, 'R');
    if (i % 6 < 3) g.set(x, Math.round((lo + hi) / 2), 'D');
  }
}

/* ------------------------------------------------------------------ */

/* ------------------- OTTERBROOK ------------------- */

/** the town's base row within the tall elevated map: the L0 town occupies rows
 *  [TB, TB+townH); the wooded plateau (crater + cave + Jay/Chad shelf) sits above
 *  it (rows 0..TB). Concept-locked proportion: hill ~40% / city ~60% (the town base
 *  sits at concept row 66 of the 112×168 map — the image's cliff/town boundary, with
 *  the city a touch bigger than the top per the user's direction). */
export const OTTERBROOK_TOWN_BASE = 66;

/** the grown town's east gateway tile — MEADOW MILE (Movement 2) leaves from here.
 *  Its y is the town's east-road row PLUS the town base offset (the town sits BELOW
 *  the plateau). MEADOW MILE's return door + the LONG WALK test both read this const,
 *  so the two sides never drift (ADR-012). Row 46 = the OTTERBROOKE-sign highway exit. */
export const OTTERBROOK_EAST_GATE = { x: 111, y: 46 + OTTERBROOK_TOWN_BASE } as const;
export const OTTERBROOK_TOWN_PREVIEW_SPAWN = { x: 56, y: OTTERBROOK_TOWN_BASE + 34 } as const;
export const OTTERBROOK_DEV_PREVIEW_SPAWN = { x: 54, y: OTTERBROOK_TOWN_BASE + 20 } as const;

/** the solid for the standard tree */
const OAK: { ox: number; oy: number; w: number; h: number } = { ox: 7, oy: 22, w: 12, h: 10 };
const PICNIC_SOLID: { ox: number; oy: number; w: number; h: number } = { ox: 2, oy: 8, w: 32, h: 14 };
const SIGN_SOLID: { ox: number; oy: number; w: number; h: number } = { ox: 3, oy: 10, w: 10, h: 7 };

const OTTERBROOK_LANDMARK_DIMS: Record<string, readonly [number, number]> = {
  house_rex: [375, 384], // OBLIQUE
  house_chad: [386, 384], // OBLIQUE
  house_a: [457, 384], // OBLIQUE
  house_b: [396, 384], // OBLIQUE
  drugstore: [389, 384], // OBLIQUE (3/4) facade — front + right side (EarthBound-style)
  arcade: [399, 384], // OBLIQUE facade
  chapel: [258, 384], // OBLIQUE facade
  facade_busdepot: [717, 384], // OBLIQUE
  facade_otter_station: [372, 384], // OBLIQUE
  facade_hardware: [576, 384], // OBLIQUE
  facade_fillshop: [488, 384], // OBLIQUE
  bldg_brickmore: [271, 384], // OBLIQUE
  bldg_bank: [391, 384], // OBLIQUE
  bldg_apartments: [285, 384], // OBLIQUE
  bldg_ob_apt_green: [270, 384], // OBLIQUE
  bldg_ob_bakery: [369, 384], // OBLIQUE
  bldg_ob_burger: [347, 384], // OBLIQUE
  bldg_ob_city_hall: [395, 384], // OBLIQUE
  bldg_ob_clinic: [420, 384], // OBLIQUE
  bldg_ob_cottage: [618, 384], // OBLIQUE
  bldg_ob_house_c: [348, 384], // OBLIQUE
  bldg_ob_house_green: [400, 384], // OBLIQUE
  bldg_ob_workshop: [386, 384], // OBLIQUE
};

// x = CENTRE col, y = BOTTOM row (the homes front the SOUTH-RES street; doors open south)
const OTTERBROOK_HOME_SPECS = [
  { id: 'otter_home_sodd', name: 'SODD HOUSE', sprite: 'house_a', x: 46, y: 74 },
  { id: 'otter_home_birch', name: 'BIRCH HOUSE', sprite: 'house_b', x: 64, y: 74 },
  { id: 'otter_home_pond', name: 'POND HOUSE', sprite: 'bldg_ob_cottage', x: 32, y: 74 },
] as const;

function otterLandmark(
  sprite: string,
  x: number,
  y: number,
  door?: { to: string; tx: number; ty: number },
): PropDef {
  const [tw, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  const p: PropDef = {
    sprite,
    x,
    y,
    solid: { ox: 0, oy: 10, w: Math.max(48, Math.round(tw / 4)), h: Math.max(48, Math.round(th / 4) - 10) },
  };
  if (door) {
    const w = 16;
    p.door = { ox: Math.round(tw / 8 - w / 2), oy: Math.round(th / 4) - 22, w, h: 20, to: door.to, tx: door.tx, ty: door.ty };
  }
  return p;
}

function otterLandmarkBottom(
  sprite: string,
  x: number,
  bottomTile: number,
  door?: { to: string; tx: number; ty: number },
): PropDef {
  const [, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  return otterLandmark(sprite, x, bottomTile - th / 64, door);
}

/** place a facade CENTERED horizontally on tile `cx`, its base at row `bottomTile`.
 *  (Facades render at texW/64 tiles wide, so top-left x = cx − halfWidthTiles.) Used
 *  by the concept-faithful layout, where each building's *centre* is read off the grid. */
function otterCentered(
  sprite: string,
  cx: number,
  bottomTile: number,
  door?: { to: string; tx: number; ty: number },
): PropDef {
  const [tw] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  return otterLandmarkBottom(sprite, cx - tw / 128, bottomTile, door);
}

/**
 * OTTERBROOKE TOWN (L0) — the downtown at the BASE of the elevated map, authored at
 * y0 here (town-relative rows); growOtterbrook copies it into the lower band of the
 * tall 112×168 map at offset OTTERBROOK_TOWN_BASE (=66) and builds the wooded plateau
 * above. LAYOUT IS CONCEPT-FAITHFUL (2026-07-04, user directive "match the image
 * precisely"): every element sits at (concept-col, concept-row − 66) read off the
 * tile-gridded reference — civic core (City Hall + fountain + Hospital + Drugstore),
 * the shop drag (BURGER/store/BANK/BAKERY/ARCADE/clinic/POLICE), residential blocks,
 * Pond Park (SW), the two FOR-SALE lots, and the OTTERBROOKE-OH highway sign (E).
 */
function buildOtterbrookTown(): MapDef {
  const W = 112;
  const H = 102; // concept rows 66..168
  const g = new Grid(W, H, '.');
  g.sprinkle(7, ',~,~ff F', 0.05);

  // wooded frame (edges); the plateau's front cliff joins along the top in growOtterbrook
  g.rect(0, 0, 6, H, 'b');
  g.rect(W - 6, 0, 6, H, 'b');
  g.rect(0, H - 3, W, 3, 'b'); // thin bottom border — the concept has houses almost to the edge

  // ---- POND PARK (SW): duck pond + foam lip, a grassy clearing around it (terrain) ----
  g.rect(2, 70, 18, 14, 'e');
  g.rect(2, 69, 18, 1, 'E');
  g.rect(2, 84, 18, 1, 'E');
  g.rect(1, 70, 1, 14, 'E');
  g.rect(20, 70, 1, 14, 'E');
  g.rect(22, 64, 16, 22, '.'); // the lawn beside the pond (playground/gazebo)

  const props: PropDef[] = [];
  const occupied = new Set<number>();
  const idx = (x: number, y: number): number => y * W + x;
  /** decorative tree (NO solid — reachability is read off the grid, so these never block). */
  const dtree = (x: number, y: number): void => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return;
    props.push({ sprite: treeSprite(Math.round(x), Math.round(y)), x, y });
  };
  const markFootprint = (sprite: string, cx: number, bottom: number): void => {
    const [tw, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
    const wT = Math.ceil(tw / 64), hT = Math.ceil(th / 64);
    for (let yy = bottom - hT; yy <= bottom; yy++)
      for (let xx = Math.floor(cx - wT / 2) - 1; xx <= Math.ceil(cx + wT / 2) + 1; xx++) occupied.add(idx(xx, yy));
  };
  const wOf = (s: string): number => Math.ceil((OTTERBROOK_LANDMARK_DIMS[s]?.[0] ?? 320) / 64);
  /** place ONE building fronting the street to its south (its door opens onto the sidewalk). */
  const build = (s: string, cx: number, bottom: number, door?: { to: string; tx: number; ty: number }): void => {
    props.push(otterCentered(s, cx, bottom, door));
    markFootprint(s, cx, bottom);
  };
  /** a shoulder-to-shoulder ROW of storefronts, auto-spaced left→right by facade width. */
  const row = (
    bottom: number,
    startCol: number,
    gap: number,
    items: Array<{ s: string; door?: { to: string; tx: number; ty: number } }>,
  ): void => {
    let cx = startCol;
    for (const it of items) {
      const w = wOf(it.s);
      build(it.s, Math.round(cx + w / 2), bottom, it.door);
      cx += w + gap;
    }
  };

  // ===== STRAIGHT STREET GRID (Onett-style) — E-W "streets" + a central N-S avenue.
  // roadH/roadV lay light '=' curb-sidewalks flanking the 'R' asphalt with a 'D' centre
  // dash. Buildings then sit FLUSH one tile above a street's north sidewalk, so every
  // front door opens straight onto the pavement (no more marooned-in-lawn islands). =====
  const line = (n: number, v: number): number[] => Array.from({ length: n }, () => v);
  roadH(g, line(96, 20), 8, 4); // NORTH-RES street
  roadH(g, line(96, 38), 8, 4); // CIVIC street
  roadH(g, line(96, 56), 8, 4); // MAIN street (downtown)
  roadH(g, line(82, 78), 22, 4); // SOUTH-RES street (starts east of Pond Park)
  roadV(g, line(60, 56), 16, 4); // central avenue (N-RES → S-RES)
  g.rect(101, 38, 3, 10, 'R'); // east link: CIVIC street → the highway gate
  g.rect(96, 45, W - 96, 3, 'R'); g.rect(96, 44, W - 96, 1, '='); g.rect(96, 48, W - 96, 1, '='); // east highway exit
  g.rect(25, 0, 3, 17, ':'); g.rect(55, 0, 3, 17, ':'); // the hill trails drop in and meet the N-RES street

  // ===== BUILDINGS — each zone fronts the street to its south (base one tile above the
  // north sidewalk), so every door opens onto the pavement. =====
  // DOWNTOWN — the shop strip on MAIN ST, in two blocks split by the central avenue
  row(52, 8, 1, [
    { s: 'facade_busdepot', door: { to: 'bus_depot_int', tx: 120, ty: 128 } },
    { s: 'bldg_brickmore', door: { to: 'downtown_otterbrook', tx: 208, ty: 224 } },
    { s: 'bldg_ob_burger', door: { to: 'burger_int', tx: 96, ty: 118 } },
    { s: 'facade_hardware' },
    { s: 'bldg_bank', door: { to: 'bank_int', tx: 96, ty: 118 } },
  ]);
  row(52, 60, 1, [
    { s: 'bldg_ob_bakery', door: { to: 'bakery_int', tx: 96, ty: 118 } },
    { s: 'drugstore', door: { to: 'drugstore_int', tx: 112, ty: 118 } },
    { s: 'arcade', door: { to: 'arcade_int', tx: 80, ty: 102 } },
    { s: 'facade_fillshop' },
  ]);
  // CIVIC ROW — City Hall (centre, fountain plaza in front), apartments, hospital, police
  build('bldg_apartments', 14, 34); // apartment block
  build('bldg_ob_city_hall', 44, 34, { to: 'otterbrook_cityhall', tx: 120, ty: 128 });
  build('bldg_ob_clinic', 70, 34); // HOSPITAL (red cross)
  build('bldg_ob_apt_green', 84, 34);
  build('facade_otter_station', 98, 34, { to: 'otter_station', tx: 120, ty: 128 }); // POLICE
  // NORTH-RES ROW — the generic houses (cols 26 & 56 stay clear for the hill trails)
  build('house_a', 14, 16);
  build('house_b', 40, 16);
  build('bldg_ob_house_c', 68, 16);
  build('bldg_ob_house_green', 84, 16);
  // SOUTH-RES ROW — the named/visitable homes (interiors) + the chapel landmark (east)
  for (const h of OTTERBROOK_HOME_SPECS) {
    build(h.sprite, h.x, h.y, { to: h.id, tx: 7 * 16 + 8, ty: 8 * 16 });
  }
  build('chapel', 88, 74, { to: 'chapel_int', tx: 88, ty: 150 });

  // roads/sidewalks yield to buildings: erase any paved tile that fell under a footprint
  for (const key of occupied) {
    const x = key % W, y = (key - x) / W;
    const c = g.rows[y]?.[x];
    if (c === 'R' || c === '=' || c === 'D') g.set(x, y, '.');
  }

  // fountain plaza apron in front of City Hall (paved, after the streets)
  g.rect(38, 35, 14, 3, '=');
  g.rect(41, 36, 8, 2, '.');

  props.push(
    // ---- PLAZA / PARK / SIGN DRESSING ----
    { sprite: 'otter_statue', x: 44, y: 36.5, solid: { ox: 35, oy: 60, w: 20, h: 10 } }, // fountain (City Hall plaza)
    { sprite: 'bench', x: 40, y: 37, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: 47, y: 37, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'phone_table', x: 44, y: 38, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
    { sprite: 'sign', x: 103, y: 44, solid: SIGN_SOLID }, // OTTERBROOKE, OH highway sign (E)
    { sprite: 'sign', x: 44, y: 32, solid: SIGN_SOLID }, // City Hall marker
    { sprite: 'sign', x: 9, y: 50, solid: SIGN_SOLID }, // to-downtown marker (west)
    { sprite: 'picnic', x: 30, y: 78, solid: PICNIC_SOLID },
    { sprite: 'gazebo', x: 30, y: 72, solid: { ox: 4, oy: 34, w: 48, h: 18 } },
    { sprite: 'swing_set', x: 26, y: 66, solid: { ox: 2, oy: 20, w: 60, h: 8 } },
    { sprite: 'tree_c', x: 11, y: 74, solid: OAK }, // the big pond oak
    { sprite: 'hydrant', x: 33.5, y: 54.5, solid: { ox: 2, oy: 6, w: 6, h: 6 } },
    { sprite: 'hydrant', x: 66.5, y: 54.5, solid: { ox: 2, oy: 6, w: 6, h: 6 } },
  );

  // ---- STREET TREES: a tidy, sparse verge along the sidewalks (NOT a forest). Decorative
  // (no solid) so they never strand a door — walkability is the grid alone. ----
  for (let y = 3; y < H - 4; y++) {
    for (let x = 7; x < W - 6; x++) {
      if (g.rows[y][x] !== '.') continue;
      if (occupied.has(idx(x, y))) continue; // don't bury a facade
      let nearWalk = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        if (g.rows[y + dy]?.[x + dx] === '=') { nearWalk = true; break; }
      }
      const hsh = ((x * 2654435761) ^ (y * 40503)) >>> 0;
      if (nearWalk) {
        if (hsh % 8 === 0) dtree(x, y); // verge trees along the curb
      } else if (hsh % 19 === 0) {
        dtree(x, y); // very sparse back-lot greenery
      }
    }
  }

  const npcs: NpcDef[] = [
    { id: 'mrs_pemmel', sprite: 'mrsPemmel', x: 68, y: 53, facing: 'down', dialogue: 'npc_pemmel' }, // by the drugstore
    { id: 'biscuit', sprite: 'dog', x: 26, y: 76, facing: 'left', dialogue: 'npc_biscuit', dog: true, unlessFlag: 'zapper_done' },
    { id: 'biscuit_home', sprite: 'dog', x: 26, y: 76, facing: 'left', dialogue: 'npc_biscuit_collar', dog: true, ifFlag: 'q_biscuit_done' },
    { id: 'mr_plummer', sprite: 'mrPlummer', x: 44, y: 40, facing: 'down', dialogue: 'npc_plummer', wander: true }, // City Hall plaza
    { id: 'old_timer', sprite: 'oldTimer', x: 32, y: 76, facing: 'down', dialogue: 'npc_oldtimer', dialogueDay: 'npc_oldtimer_day', wander: true },
    { id: 'pajama_kid', sprite: 'pajamaKid', x: 40, y: 22, facing: 'left', dialogue: 'npc_pajama', dialogueDay: 'npc_pajama_day', wander: true },
    { id: 'green_keeper', sprite: 'fernLady', x: 28, y: 73, facing: 'down', dialogue: 'npc_green_keeper', wander: true },
    { id: 'pond_angler', sprite: 'quarterMan', x: 22, y: 76, facing: 'left', dialogue: 'npc_pond_angler', idle: true, emote: 'think' },
    { id: 'south_neighbor', sprite: 'senora', x: 60, y: 76, facing: 'down', dialogue: 'npc_south_neighbor', wander: true },
    { id: 'gate_walker', sprite: 'grayCommuter', x: 100, y: 46, facing: 'right', dialogue: 'npc_gate_walker', dialogueDay: 'npc_gate_walker_day', wander: true },
    { id: 'bus_waiter1', sprite: 'grayCommuter', x: 12, y: 53, facing: 'right', dialogue: 'npc_bus_waiter1', idle: true, emote: 'think', ifFlag: 'zapper_done' }, // bus depot
    { id: 'bus_waiter2', sprite: 'senora', x: 16, y: 53, facing: 'up', dialogue: 'npc_bus_waiter2', idle: true, emote: 'idle', ifFlag: 'zapper_done' },
    { id: 'realtor_otter', sprite: 'npc_realtor', x: 46, y: 76, facing: 'down', dialogue: 'npc_realtor', idle: true, ifFlag: 'zapper_done' },
    { id: 'car_dealer_otter', sprite: 'quarterMan', x: 48, y: 40, facing: 'up', dialogue: 'npc_car_dealer', idle: true, emote: 'happy', ifFlag: 'zapper_done' },
    { id: 'constable_borden', sprite: 'npc_borden', x: 98, y: 35, facing: 'up', dialogue: 'npc_borden_accuse', idle: true, emote: 'surprise', ifFlag: 'zapper_done', unlessFlag: 'borden_marching' }, // police
  ];

  const signs: SignDef[] = [
    { x: 44, y: 39, dialogue: 'sign_welcome' },
    { x: 88, y: 76, dialogue: 'sign_chapel' },
    { x: 44, y: 32, dialogue: 'sign_otter_hall' },
    { x: 30, y: 73, dialogue: 'sign_civic_green' },
    { x: 24, y: 74, dialogue: 'sign_pond_park' },
    { x: 103, y: 44, dialogue: 'sign_meadow_gate' },
    { x: 102, y: 47, dialogue: 'sign_meadow_gate_closed', unlessFlag: 'zapper_done' },
    { x: 9, y: 50, dialogue: 'sign_to_downtown' },
  ];

  return {
    id: 'otterbrook',
    name: 'OTTERBROOK, OHIO',
    music: 'otterbrook',
    settlement: 'town',
    grid: g.out(),
    props,
    npcs,
    signs,
    phones: [{ x: 44, y: 38 }],
    doors: [],
    spawners: [
      { enemies: ['cranky_mailbox', 'sprinkler_sentry'], count: 1, rect: { x: 60, y: 44, w: 8, h: 4 }, ifFlag: 'meteor_fell' },
      { enemies: ['runaway_lawnmower', 'recycling_raccoon', 'unionized_gnome'], count: 1, rect: { x: 30, y: 60, w: 8, h: 4 }, ifFlag: 'meteor_fell' },
      { enemies: ['pigeon_gang', 'good_investment'], count: 1, rect: { x: 70, y: 60, w: 6, h: 2 }, ifFlag: 'meteor_fell' },
      { enemies: ['cranky_mailbox', 'skeeter_swarm'], count: 1, rect: { x: 60, y: 84, w: 8, h: 4 }, ifFlag: 'meteor_fell' },
    ],
    triggers: [],
  };
}

/**
 * OTTERBROOKE, OHIO — the ELEVATED Onett map (World Overhaul S5, Ch.1 pilot; user
 * directive 2026-07-04: the whole concept is ONE continuous map — walk from the
 * town UP through terraces to the crater with NO map transition; keep NOTHING of
 * the old layout). The flat town (buildOtterbrookTown) is copied into the LOWER
 * band (L0); the wooded hill is authored ABOVE it as three terraces joined by
 * K-cliff / T-stair seams (the foggybottom elevation engine, descending L3→L0):
 *
 *   L3 CREST (rows 0-20)  — the meteor CRATER (right: meteor_rock + the dormant
 *                           Hush-Sentinel husk + the craterScene set-piece) and
 *                           the CAVE mouth (left → the Titanic Tick's dungeon).
 *   L2 CLIMB (rows 23-42) — the winding wooded trail, PEMBERTON's fenced
 *                           "DON'T ENTER" workshop, healing presents, the Biscuit
 *                           breadcrumbs, Hodgkin's mower + shed, the climb fights.
 *   L1 TERRACE (rows 45-62)— Jay's (house_rex, the opening) + Chad's houses, the
 *                           porch beat, the lemonade twins, the sniff-trail head.
 *   L0 TOWN (rows 65+)    — the town (buildOtterbrookTown), offset down.
 *
 * The 4 old climb maps (hill_road/hickory_trail/whisperwood_rise/hickory_hill) are
 * RETIRED, their content re-homed here. The Under-Oak has a lower-town return
 * beside the rebuilt streets so cave saves do not strand the camera on the crest.
 * ELEVATED_ALLOWLIST + maps_otterbrook.test.ts guard the elevation plane.
 */
export function growOtterbrook(): MapDef {
  const town = buildOtterbrookTown();
  const TB = OTTERBROOK_TOWN_BASE;
  const TW = town.grid[0].length;
  const TH = town.grid.length;
  const W = TW;
  const H = TB + TH;
  const g = new Grid(W, H, 'b');

  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) g.set(x, TB + y, town.grid[y][x]);

  // The wooded PLATEAU fills rows 0..TB with dense woods ('b'); the only clearings are
  // CARVED — the crater bowl + cave nook + cottage/shed pockets on the UPPER plateau, the
  // Jay/Chad TERRACE on the mid shelf, and the two winding dirt paths threading to town.
  // Concept-faithful positions (read off the tile-gridded reference).
  g.rect(0, 0, W, TB, 'b');

  // --- UPPER-PLATEAU clearings ---
  g.rect(28, 3, 6, 10, '.');   // cave-mouth shelf (top-LEFT) — NARROW, so the shed gate can't be bypassed
  g.rect(69, 30, 15, 10, '.'); // green-cottage clearing (upper-RIGHT) — moved DOWN (more climb to the crater)
  g.rect(27, 26, 8, 14, '.');  // shed clearing (LEFT) — the choke the shed + locked gate guard
  // --- MID SHELF: the Jay/Chad terrace clearing (rows 49-60, between the two paths) ---
  g.rect(42, 48, 30, 13, '.');

  // top-RIGHT: the round scorched CRATER bowl set into the woods, with a thin grass rim
  const crater = { x: 72, y: 11, rx: 22, ry: 9 };
  for (let yy = crater.y - crater.ry - 1; yy <= crater.y + crater.ry + 1; yy++) {
    for (let xx = crater.x - crater.rx - 1; xx <= crater.x + crater.rx + 1; xx++) {
      const dx = (xx - crater.x) / crater.rx;
      const dy = (yy - crater.y) / crater.ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) g.set(xx, yy, 's');
      else if (d <= 1.4 && g.rows[yy]?.[xx] === 'b') g.set(xx, yy, '.');
    }
  }
  for (const [ex, ey] of [[56, 6], [88, 6], [58, 16], [90, 15], [64, 3], [92, 10]] as const) g.set(ex, ey, 'S');
  g.rect(52, 19, 14, 5, '.'); // the police muster clearing on the crater's lower rim (right path)
  g.rect(57, 33, 15, 4, ':'); // spur linking the right path to the (lowered) green-cottage clearing

  const paintTrail = (points: ReadonlyArray<readonly [number, number]>, width = 4): void => {
    const half = Math.floor(width / 2);
    const stamp = (cx: number, cy: number): void => {
      g.rect(Math.round(cx) - half, Math.round(cy) - half, width, width, ':');
    };
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        stamp(ax + (bx - ax) * t, ay + (by - ay) * t);
      }
    }
  };

  // RIGHT path: the crater/police watch → down BETWEEN Jay & Chad → town (via the E stairs)
  paintTrail([
    [58, 21], [57, 29], [59, 37], [56, 44], [55, 51], [56, 57], [56, 64], [56, 67],
  ]);
  // the WINDING CLIMB from the police watch UP through the crater rim to the meteor (a
  // longer, more serpentine walk — the meteor sits farther up the hill than the cottage)
  paintTrail([
    [58, 20], [62, 17], [56, 14], [61, 11], [66, 9], [69, 6],
  ], 3);
  // LEFT path: the cave mouth → down past the shed → town (via the W stairs)
  paintTrail([
    [30, 11], [30, 18], [30, 26], [30, 34], [28, 40], [26, 44], [27, 52], [26, 60], [26, 67],
  ]);

  // --- ELEVATION seams (foggybottom engine): plateau (L2) → shelf (L1) → town (L0);
  // T-stairs sit on BOTH paths so the descent stays walkable. ---
  g.rect(0, 45, W, 1, '^'); g.rect(0, 46, W, 3, 'K'); // seam A: upper plateau → mid shelf
  g.rect(24, 45, 6, 4, 'T'); g.rect(53, 45, 6, 4, 'T');
  g.rect(0, 61, W, 1, '^'); g.rect(0, 62, W, 4, 'K'); // seam B: mid shelf → town
  g.rect(23, 61, 6, 5, 'T'); g.rect(53, 61, 6, 5, 'T');

  const treeAt = (xy: ReadonlyArray<readonly [number, number]>): PropDef[] =>
    xy.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK }));
  // DENSE canopy: the wooded slope is a SEA of overlapping tree crowns (the concept's
  // read). Every wooded 'b' cell is already SOLID, so these crowns are DECORATIVE (no
  // added body) — collision + BFS come from the grid. Sub-tile jitter + the 3-way
  // treeSprite variety keep the mass organic; ~80% coverage with ~2-tile crowns closes
  // the gaps. Paths/clearings ('.'/':'/'s') are skipped, so the dirt trails read clean.
  const canopyTrees: PropDef[] = [];
  for (let cy = 1; cy < TB; cy++) {
    for (let cx = 5; cx < W - 5; cx++) {
      if (g.rows[cy]?.[cx] !== 'b') continue;
      const h = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
      if (h % 5 === 0) continue; // ~20% gaps → dense but not a solid wall of green
      const jx = (((h >> 3) % 5) - 2) * 0.18;
      const jy = (((h >> 6) % 5) - 2) * 0.18;
      canopyTrees.push({ sprite: treeSprite(cx, cy), x: cx + jx, y: cy + jy });
    }
  }

  const hillProps: PropDef[] = [
    ...canopyTrees,
    { sprite: 'meteor_rock_hickory_hill', x: 66, y: 3, solid: { ox: 16, oy: 46, w: 64, h: 38 } }, // pushed farther UP the hill
    { sprite: 'sentinel_husk', x: 62, y: 2, solid: { ox: 4, oy: 60, w: 152, h: 40 }, ifFlag: 'sentinel_repelled' },
    { sprite: 'burrow_mouth', x: 29, y: 1 }, // the CAVE mouth (top-LEFT) → Titanic Tick
    otterCentered('bldg_ob_workshop', 31, 39, { to: 'workshop_int', tx: 8 * 16 + 8, ty: 8 * 16 }), // the SHED — guards the cave
    // the LOCKED SHED GATE: the cave is reachable ONLY past the shed (needs the trail key
    // from the hodgkin_mower chain). It walls the narrow cave choke until has_trail_key.
    { sprite: 'sawhorse', x: 28, y: 24, solid: { ox: 0, oy: 6, w: 64, h: 22 }, unlessFlag: 'has_trail_key' },
    { sprite: 'sawhorse', x: 30, y: 24, solid: { ox: 0, oy: 6, w: 64, h: 22 }, unlessFlag: 'has_trail_key' },
    otterCentered('bldg_ob_cottage', 76, 37), // the green cottage (upper-RIGHT) — the old man's house, moved DOWN
    otterLandmark('house_rex', 46, 49, { to: 'rex_home', tx: 104, ty: 124 }), // JAY's house (purple)
    otterLandmark('house_chad', 58, 49, { to: 'chad_home', tx: 7 * 16 + 8, ty: 8 * 16 }), // CHAD's house (blue)
    { sprite: 'bug_zapper', x: 53, y: 51, solid: { ox: 4, oy: 18, w: 6, h: 8 } },
    { sprite: 'sign', x: 60, y: 23, solid: SIGN_SOLID, ifFlag: 'meteor_fell' }, // crater guard marker
    { sprite: 'sign', x: 34, y: 33, solid: SIGN_SOLID }, // shed marker
    { sprite: 'sign', x: 64, y: 44, solid: SIGN_SOLID }, // woods marker
    { sprite: 'picnic', x: 64, y: 53, solid: PICNIC_SOLID },
    { sprite: 'bench', x: 68, y: 55, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ...treeAt([[8, 8], [10, 24], [100, 8], [102, 24], [8, 40], [100, 40]]),
  ];

  const hillNpcs: NpcDef[] = [
    { id: 'ana', sprite: 'ana', x: 46, y: 51, facing: 'down', dialogue: 'npc_ana', ifFlag: 'zapper_done' },
    { id: 'vivi', sprite: 'vivi', x: 49, y: 51, facing: 'down', dialogue: 'npc_vivi', ifFlag: 'zapper_done' },
    { id: 'treeline_gawker', sprite: 'pigeonKid', x: 66, y: 51, facing: 'up', dialogue: 'npc_treeline_gawker', dialogueDay: 'npc_treeline_gawker_day', idle: true, emote: 'surprise' },
    { id: 'woods_birder', sprite: 'oldTimer', x: 72, y: 36, facing: 'down', dialogue: 'npc_woods_birder', idle: true, emote: 'happy' },
    { id: 'biscuit_road', sprite: 'dog', x: 29, y: 40, facing: 'up', dialogue: 'npc_biscuit_road', dog: true, unlessFlag: 'tick_defeated' },
    { id: 'biscuit_road_after', sprite: 'dog', x: 29, y: 40, facing: 'down', dialogue: 'npc_biscuit_road_after', dog: true, ifFlag: 'tick_defeated', unlessFlag: 'zapper_done' },
    { id: 'crater_cop_a', sprite: 'npc_borden', x: 55, y: 21, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
    { id: 'crater_cop_b', sprite: 'npc_borden', x: 58, y: 21, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
    { id: 'crater_cop_c', sprite: 'npc_borden', x: 61, y: 21, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
  ];

  const hillSigns: SignDef[] = [
    { x: 34, y: 33, dialogue: 'locked_house' },
    { x: 32, y: 31, dialogue: 'trail_shed' },
    { x: 40, y: 44, dialogue: 'sign_whisperwood_rise' },
    { x: 36, y: 44, dialogue: 'q_biscuit_clue1', ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' },
    { x: 29, y: 40, dialogue: 'q_biscuit_clue2', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
    { x: 64, y: 44, dialogue: 'sign_otter_woods' },
    { x: 30, y: 13, dialogue: 'sign_hill' },
    { x: 60, y: 23, dialogue: 'sign_crater_guard', ifFlag: 'meteor_fell' },
    { x: 64, y: 12, dialogue: 'sign_sentinel_husk', ifFlag: 'sentinel_repelled' },
  ];

  const grid = g.out();
  // Elevation plane: L2 upper plateau (rows 0-45) → L1 mid shelf (rows 49-60) → L0 town
  // (rows 66+); the K-face seams at rows 46-48 and 62-65 with T-stairs stepping one level.
  const level = grid.map((rowStr, y) =>
    rowStr
      .split('')
      .map((ch) => {
        if (y <= 45) return '2'; // upper plateau (crater/cave/cottage/shed) + its lip
        if (y <= 48) return ch === 'T' ? '1' : '2'; // seam A face: stairs drop to the shelf
        if (y <= 61) return '1'; // mid shelf (Jay/Chad terrace) + its lip
        if (y <= 65) return ch === 'T' ? '0' : '1'; // seam B face: stairs drop to town
        return '0'; // the town
      })
      .join(''),
  );

  const offY = <T extends { y: number }>(o: T): T => ({ ...o, y: o.y + TB });
  const offRect = <T extends { rect: { x: number; y: number; w: number; h: number } }>(o: T): T =>
    ({ ...o, rect: { ...o.rect, y: o.rect.y + TB } });

  return {
    id: 'otterbrook',
    name: 'OTTERBROOK, OHIO',
    music: 'otterbrook',
    settlement: 'town',
    grid,
    elevation: { level },
    props: [...hillProps, ...town.props.map(offY)],
    npcs: [...hillNpcs, ...town.npcs.map(offY)],
    signs: [...hillSigns, ...town.signs.map(offY)],
    phones: town.phones.map(offY),
    doors: [
      { x: W - 1, y: OTTERBROOK_EAST_GATE.y, w: 1, h: 2, to: 'meadow_mile', tx: 24, ty: 128, facing: 'right', indicator: 'none' },
      // the hilltop CAVE mouth (top-left) → the Titanic Tick dungeon (reached ONLY past the shed gate)
      { x: 28, y: 9, w: 3, h: 1, to: 'oak_roots', tx: 14 * 16 + 8, ty: 38 * 16, facing: 'up', indicator: 'none' },
      ...town.doors.map(offY),
    ],
    spawners: [
      ...town.spawners.map(offRect),
      { enemies: ['runaway_lawnmower'], count: 1, rect: { x: 52, y: 51, w: 4, h: 1 }, ifFlag: 'q_mail', unlessFlag: 'q_mail_sodd' },
      { enemies: ['coily_cicada', 'skeeter_swarm'], count: 2, rect: { x: 58, y: 24, w: 8, h: 14 }, ifFlag: 'meteor_fell' },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 26, y: 30, w: 34, h: 4 }, ifFlag: 'meteor_fell' },
      { enemies: ['tick_nymph', 'coily_cicada'], count: 2, rect: { x: 26, y: 14, w: 10, h: 12 }, ifFlag: 'meteor_fell' },
    ],
    triggers: [
      { id: 'porch', rect: { x: 46, y: 56, w: 6, h: 2 }, once: true },
      { id: 'crater', rect: { x: 58, y: 1, w: 24, h: 12 }, once: true },
    ],
    patrols: [{ id: 'hodgkin_mower', enemy: 'runaway_lawnmower', route: [[30, 42], [60, 42]], countFlag: 'q_mower_caught' }],
  };
}

export function growOtterbrookLegacy(): MapDef {
  const town = buildOtterbrookTown();
  const TB = OTTERBROOK_TOWN_BASE; // 65
  const TW = town.grid[0].length; // 126
  const TH = town.grid.length; // 112
  const W = TW;
  const H = TB + TH; // 177
  const g = new Grid(W, H, '.');
  g.sprinkle(11, ',~,~ff', 0.05); // the hill's ground scatter (town rows overwritten by the copy)

  // 1) copy the flat town into the LOWER band (rows TB..)
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) g.set(x, TB + y, town.grid[y][x]);

  // 2) THE WOODED HILL (rows 0..TB) — TWO WIDE, STRAIGHT trails climb to the crest,
  //    each aligned to a town avenue so the route reads at a glance: the LEFT trail
  //    (x22 / WEST_AVE) up to the CAVE, the RIGHT trail (x54 / CENTER_AVE) up past the
  //    houses to the CRATER, with the meteor as the beacon. Deep woods (b) wall the
  //    rest; the aligned T-stairs are the only way up, so "up the trail" always reads
  //    as "toward the crash". (Concept-locked rebuild 2026-07-04: the old thin, winding
  //    trails + the 50-tile left-to-right crest traverse are gone.)
  const LT = 22, RT = 54; // the two trail spines (left→cave, right→crater), each on a town avenue
  g.rect(0, 0, W, 3, 'b'); // the crest's north tree-wall
  g.rect(0, 0, 8, TB, 'b'); g.rect(118, 0, 8, TB, 'b'); // west + east woods edges

  // ─── L3 CREST (rows 3-19): the round CRATER bowl (right) + the CAVE shelf (left) ───
  g.rect(8, 3, 108, 17, '.'); // clear the crest turf
  const CBX = 72, CBY = 11, CBRX = 18, CBRY = 8; // the crater bowl, centered on the meteor
  for (let yy = CBY - CBRY; yy <= CBY + CBRY; yy++)
    for (let xx = CBX - CBRX; xx <= CBX + CBRX; xx++) {
      const ndx = (xx - CBX) / CBRX, ndy = (yy - CBY) / CBRY;
      if (ndx * ndx + ndy * ndy <= 1) g.set(xx, yy, 's'); // one filled, round scorched bowl
    }
  for (const [ex, ey] of [[64, 7], [80, 8], [70, 15], [62, 12], [82, 13], [76, 6], [66, 16]] as const) g.set(ex, ey, 'S'); // ember flecks
  g.rect(10, 3, 12, 9, '.'); // the CAVE shelf (left) around the mouth at (14,3)
  // crest approaches: LEFT stair-top → up + left to the cave; RIGHT stair-top → up into the bowl
  g.rect(LT - 1, 8, 4, 12, ':'); g.rect(14, 8, 11, 2, ':'); g.rect(14, 4, 3, 6, ':');
  g.rect(RT - 1, 12, 4, 8, ':');

  // ─── SEAM L3→L2 (lip 20 · K 21-22 · stairs LEFT x22 / RIGHT x54) ───
  // stairs are 4 WIDE and bracket the trail spine (LT-1..LT+2) so a player hugging
  // an edge can't clip the K wall — forgiving climbs (ADR: ~40px box vs openings).
  g.rect(0, 20, W, 1, '^'); g.rect(0, 21, W, 2, 'K');
  g.rect(LT - 1, 20, 4, 3, 'T'); g.rect(RT - 1, 20, 4, 3, 'T');

  // ─── L2 CLIMB (rows 23-41): the two wide trails; deep woods wall the rest ───
  g.rect(8, 23, 110, 19, 'b'); // the L2 band = deep woods...
  // ...cut by TWO WINDING paths (reference-faithful): LEFT winds up toward the cave, RIGHT toward
  // the crater; each starts + ends near its stair column (x22 / x54) but bulges through the woods.
  windV(g, [20, 19, 17, 16, 15, 15, 16, 18, 20, 21, 20, 18, 16, 15, 16, 18, 20, 21, 21], 23, 5, ':');
  windV(g, [52, 53, 55, 56, 57, 57, 56, 54, 52, 51, 52, 54, 56, 57, 56, 54, 52, 52, 53], 23, 5, ':');
  g.rect(12, 24, 8, 6, '.'); // Pemberton's fenced yard pocket (west, off the left trail)
  g.rect(57, 24, 10, 6, '.'); // the present + overlook pocket (east, off the right trail)
  g.rect(LT + 3, 30, RT - LT - 3, 2, ':'); // ONE mid-climb cross-link (the Biscuit breadcrumbs)

  // ─── SEAM L2→L1 (lip 42 · K 43-44 · stairs LEFT x22 / RIGHT x54) ───
  g.rect(0, 42, W, 1, '^'); g.rect(0, 43, W, 2, 'K');
  g.rect(LT - 1, 42, 4, 3, 'T'); g.rect(RT - 1, 42, 4, 3, 'T');

  // ─── L1 TERRACE (rows 45-61): Jay's + Chad's houses + a wide lane to both trails ───
  g.rect(6, 45, 112, 17, '.'); // clear the terrace turf
  g.rect(8, 54, 48, 3, ':'); // the neighbourhood LANE (wide) — the houses out to the crater-trail spur
  g.rect(LT, 45, 2, 17, ':'); g.rect(RT, 45, 2, 17, ':'); // the two spurs (stair → lane → stair)
  g.rect(11, 52, 6, 1, '-'); g.rect(25, 52, 6, 1, '-'); // fenced front yards (gap at each drive)

  // ─── SEAM L1→L0 (lip 62 · K 63-64 · stairs LEFT x22 / RIGHT x54) — down into town ───
  g.rect(0, 62, W, 1, '^'); g.rect(0, 63, W, 2, 'K');
  g.rect(LT - 1, 62, 4, 3, 'T'); g.rect(RT - 1, 62, 4, 3, 'T');
  // connect the L0 stairs down to the town avenues (WEST_AVE x22 / CENTER_AVE x54 start at map-y TB+24)
  g.rect(LT - 1, 65, 4, TB + 24 - 65, ':'); g.rect(RT - 1, 65, 4, TB + 24 - 65, ':');

  // ═══ HILL PROPS ═══
  const treeAt = (xy: ReadonlyArray<readonly [number, number]>): PropDef[] =>
    xy.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK }));

  // presents re-homed to the hill (the woods glade + the porch coffee-can)
  const woodsGift = walkPresent('otter_woods_gift', 64, 25); // an L2 east pocket by the overlook
  const porchCan = walkPresent('porch_can', 40, 50); // the L1 terrace, by Jay's

  // DENSE WOODS CANOPY — tall tree props rising from the 'b' bush understory so the climb
  // reads as the reference's WOODED slope, not sparse grass. Deterministic hash-scatter
  // over the deep-woods tiles ONLY (the trail/pocket ':' cells carry no 'b', so the paths
  // stay clear); the trees are already-solid woods, so this is purely a visual canopy.
  // (A truly SOLID canopy needs an authored 'b' tree-canopy TILE — Track-B follow-up.)
  const canopyTrees: PropDef[] = [];
  const nearXY = (x: number, y: number, cx: number, cy: number, r: number): boolean =>
    (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
  for (let cy = 3; cy < TB; cy++) {
    for (let cx = 8; cx < W - 8; cx++) {
      const t = g.rows[cy]?.[cx];
      const woods = t === 'b'; // deep woods → DENSE canopy
      const turf = t === '.'; // open turf → SPARSE trees that FRAME the clearings
      if (!woods && !turf) continue; // never on the ':' trails, the 's' crater, houses, etc.
      if (nearXY(cx, cy, 72, 11, 21)) continue; // keep the CRATER bowl a clearing
      if (nearXY(cx, cy, 14, 5, 10)) continue; // keep the CAVE shelf a clearing
      if (cy >= 44 && cy <= 60 && cx >= 8 && cx <= 42) continue; // keep the Jay/Chad house yards a clearing
      const h = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
      if (!(woods ? h % 7 === 0 : h % 20 === 0)) continue; // ~1/7 of woods, ~1/20 of turf
      canopyTrees.push({ sprite: treeSprite(cx, cy), x: cx, y: cy, solid: OAK });
    }
  }

  const hillProps: PropDef[] = [
    ...canopyTrees,
    // ── L3 CRATER — the meteor + the dormant Hush-Sentinel husk + the cave mouth ──
    // (the ROUND scorched bowl is painted into the grid; the ugly gray 'crate' ejecta
    // are gone — the bowl + ember ring read as the crash now, and the Track-B crater
    // art — round bowl + segmented meteor sphere — swaps in over these keys.)
    { sprite: 'meteor_rock_hickory_hill', x: 72, y: 7, solid: { ox: 16, oy: 46, w: 64, h: 38 } }, // authored segmented sphere (~6 tiles) — solid covers its lower half (walk behind the top)
    { sprite: 'sentinel_husk', x: 69.5, y: 6, solid: { ox: 4, oy: 60, w: 152, h: 40 }, ifFlag: 'sentinel_repelled' },
    { sprite: 'burrow_mouth', x: 14.3, y: 2.3 }, // the CAVE mouth (gray-box; fresh cave art later)
    ...treeAt([[10, 5], [11, 12], [56, 6], [88, 6], [57, 16], [89, 15]]), // trees framing the bowl rim + cave shelf
    { sprite: 'sign', x: 57, y: 19, solid: { ox: 3, oy: 10, w: 10, h: 7 }, ifFlag: 'meteor_fell' }, // DO NOT ENTER — below the crater, by the police
    { sprite: 'bldg_ob_house_green', x: 60, y: 23 }, // the green cottage ~3/4 up the right (crater) path (reference: a fenced house near the crash)
    // ── L2 CLIMB — Pemberton (west pocket), rest+overlook+present (east pocket), breadcrumbs ──
    // PEMBERTON's fenced DON'T ENTER house — decorative shell (blocked; the enterable
    // workshop_int + the full Pemberton beat are a later slice, §5).
    { sprite: 'bldg_ob_workshop', x: 12, y: 24 },
    { sprite: 'sawhorse', x: 17, y: 28, solid: { ox: 0, oy: 2, w: 36, h: 26 } }, // the DON'T-ENTER block, facing the left trail
    { sprite: 'sign', x: 18, y: 29, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // "DON'T ENTER"
    { sprite: 'sign', x: 16, y: 26, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // Hodgkin's trail shed (Pemberton pocket, off the winding left path)
    { sprite: 'sign', x: 58, y: 25, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // whisperwood threshold (east pocket)
    { sprite: 'picnic', x: 60, y: 26, solid: { ox: 2, oy: 8, w: 32, h: 14 } }, // §A4.5 rest before the crater push
    { sprite: 'bench', x: 63, y: 28, solid: { ox: 1, oy: 6, w: 20, h: 6 } }, // the overlook (look back at town)
    ...treeAt([[30, 26], [46, 26], [16, 37], [50, 38], [64, 38]]),
    { sprite: 'paw_prints', x: 22, y: 32, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' }, // breadcrumb (left trail)
    { sprite: 'paw_prints', x: 40, y: 30, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' }, // breadcrumb (cross-link)
    ...woodsGift.props,
    // ── L1 TERRACE — Jay + Chad + the yards + the sniff-trail head ──
    {
      sprite: 'house_rex', x: 12, y: 46,
      solid: { ox: 0, oy: 20, w: 79, h: 34 },
      // ox 44 centers the enter-zone on the PAINTED door (texW 464 → door ≈ tile 15.2),
      // matching the reciprocal rex_home exit (tx 243); ox 22 sat ~1.4 tiles left of it.
      door: { ox: 44, oy: 52, w: 14, h: 28, to: 'rex_home', tx: 104, ty: 124 },
    },
    { sprite: 'house_chad', x: 24, y: 46 },
    { sprite: 'doghouse', x: 19, y: 53.5, solid: { ox: 2, oy: 14, w: 20, h: 10 } },
    { sprite: 'mailbox', x: 11, y: 53.5, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'mailbox', x: 23.6, y: 53.5, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'kiddie_pool', x: 28.4, y: 51.2, solid: { ox: 2, oy: 10, w: 28, h: 12 } },
    { sprite: 'clothesline', x: 25.2, y: 50.6 },
    { sprite: 'bug_zapper', x: 30, y: 52, solid: { ox: 4, oy: 18, w: 6, h: 8 } }, // Chad's porch (the Glint beat)
    { sprite: 'lemonade', x: 36, y: 57.2, solid: { ox: 0, oy: 10, w: 36, h: 18 }, ifFlag: 'zapper_done' },
    { sprite: 'paw_prints', x: 22, y: 58, ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' }, // the sniff-trail HEAD
    { sprite: 'doormat', x: 13.6, y: 53.5, ifFlag: 'q_mail', unlessFlag: 'q_mail_pickles' },
    { sprite: 'doormat', x: 25.6, y: 53.5, ifFlag: 'q_mail', unlessFlag: 'q_mail_sodd' },
    ...porchCan.props,
    ...treeAt([[42, 48], [8, 58], [100, 50]]),
  ];

  // ═══ HILL NPCs ═══
  const hillNpcs: NpcDef[] = [
    // the twins set the stand up by morning; the night versions sleep in ana/vivi_room
    { id: 'ana', sprite: 'ana', x: 35, y: 58, facing: 'down', dialogue: 'npc_ana', ifFlag: 'zapper_done' },
    { id: 'vivi', sprite: 'vivi', x: 37, y: 58, facing: 'down', dialogue: 'npc_vivi', ifFlag: 'zapper_done' },
    // the treeline gawker — at 2 AM he points up the hill toward the crater trail
    { id: 'treeline_gawker', sprite: 'pigeonKid', x: 44, y: 48, facing: 'up', dialogue: 'npc_treeline_gawker', dialogueDay: 'npc_treeline_gawker_day', idle: true, emote: 'surprise' },
    // the birdwatcher at the L2 east-pocket overlook
    { id: 'woods_birder', sprite: 'oldTimer', x: 64, y: 28, facing: 'down', dialogue: 'npc_woods_birder', idle: true, emote: 'happy' },
    // Biscuit points up the hill (pre-Tick) / at you (post-Tick) — on the L2 cross-link
    { id: 'biscuit_road', sprite: 'dog', x: 40, y: 30, facing: 'up', dialogue: 'npc_biscuit_road', dog: true, unlessFlag: 'tick_defeated' },
    { id: 'biscuit_road_after', sprite: 'dog', x: 40, y: 30, facing: 'down', dialogue: 'npc_biscuit_road_after', dog: true, ifFlag: 'tick_defeated', unlessFlag: 'zapper_done' },
    // THE CRATER GUARD (reference: 3 police below the meteor + a DO NOT ENTER sign) — they
    // arrive to cordon the crash once the meteor has fallen; gaps let the crater beat still fire.
    { id: 'crater_cop_a', sprite: 'npc_borden', x: 54, y: 18, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
    { id: 'crater_cop_b', sprite: 'npc_borden', x: 57, y: 18, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
    { id: 'crater_cop_c', sprite: 'npc_borden', x: 60, y: 18, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
  ];

  // ═══ HILL SIGNS ═══
  const hillSigns: SignDef[] = [
    { x: 18, y: 29, dialogue: 'locked_house' }, // Pemberton's DON'T ENTER (reuse the locked-house gag; bespoke npc_pemberton = §5)
    { x: 16, y: 26, dialogue: 'trail_shed' }, // Hodgkin's locked supply shed (by the shed, off the winding left path)
    { x: 58, y: 25, dialogue: 'sign_whisperwood_rise' }, // the last of the trees before the crown
    { x: 22, y: 58, dialogue: 'q_biscuit_clue1', ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' }, // sniff-trail head
    { x: 40, y: 30, dialogue: 'q_biscuit_clue2', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' }, // "doubled back toward the drugstore"
    { x: 63, y: 28, dialogue: 'sign_otter_woods' }, // the look-back overlook (reuse the woods sign)
    { x: 13, y: 6, dialogue: 'sign_hill' }, // the crest marker
    { x: 57, y: 19, dialogue: 'sign_crater_guard', ifFlag: 'meteor_fell' }, // DO NOT ENTER (the crater police line)
    { x: 71, y: 8, dialogue: 'sign_sentinel_husk', ifFlag: 'sentinel_repelled' },
    ...woodsGift.signs,
    ...porchCan.signs,
  ];

  // 3) the LEVEL plane — generated per-row (foggybottom pattern; descends L3→L0).
  const grid = g.out();
  const level = grid.map((rowStr, y) =>
    rowStr
      .split('')
      .map((ch) => {
        if (y <= 20) return '3'; // L3 crest + its lip
        if (y <= 22) return ch === 'T' ? '2' : '3'; // K seam L3→L2
        if (y <= 42) return '2'; // L2 climb + its lip
        if (y <= 44) return ch === 'T' ? '1' : '2'; // K seam L2→L1
        if (y <= 62) return '1'; // L1 terrace + its lip
        if (y <= 64) return ch === 'T' ? '0' : '1'; // K seam L1→L0
        return '0'; // L0 town
      })
      .join(''),
  );

  // 4) assemble: town content shifted DOWN by TB; hill content authored in place.
  const offY = <T extends { y: number }>(o: T): T => ({ ...o, y: o.y + TB });
  const offRect = <T extends { rect: { x: number; y: number; w: number; h: number } }>(o: T): T =>
    ({ ...o, rect: { ...o.rect, y: o.rect.y + TB } });
  const TREE_SPRITE = /^(tree|tree_b|tree_c|pine|bush)$/;
  const ON_PATH = new Set([':', 'R', 'D', 'X', '=', 'p', 'P', '3', 'e', 'E', 'T', '^', 'K']);
  const hillPropsClean = hillProps.filter(
    (p) => !(TREE_SPRITE.test(p.sprite) && ON_PATH.has(grid[Math.round(p.y)]?.[Math.round(p.x)] ?? '.')),
  );

  return {
    id: 'otterbrook',
    name: 'OTTERBROOK, OHIO',
    music: 'otterbrook',
    settlement: 'town',
    grid,
    elevation: { level },
    props: [...hillPropsClean, ...town.props.map(offY)],
    npcs: [...hillNpcs, ...town.npcs.map(offY)],
    signs: [...hillSigns, ...town.signs.map(offY)],
    phones: town.phones.map(offY),
    doors: [
      // EAST — MEADOW MILE (Movement 2), gated behind the daybreak barricade (town, offset)
      { x: W - 1, y: OTTERBROOK_EAST_GATE.y, w: 1, h: 2, to: 'meadow_mile', tx: 24, ty: 128, facing: 'right', indicator: 'none' },
      // THE HILLTOP CAVE — the directed descent to the Titanic Tick (was the Pond-Park burrow)
      { x: 14, y: 4, w: 2, h: 1, to: 'oak_roots', tx: 14 * 16 + 8, ty: 38 * 16, facing: 'up', indicator: 'none' },
      // NO north door — the crater is on THIS map now (walk up the terraces).
    ],
    spawners: [
      ...town.spawners.map(offRect),
      // Mr. Sodd's Runaway Lawnmower guards his letter (a mail stop, now on the L1 terrace)
      { enemies: ['runaway_lawnmower'], count: 1, rect: { x: 25, y: 54, w: 3, h: 1 }, ifFlag: 'q_mail', unlessFlag: 'q_mail_sodd' },
      // the wooded-climb fights (gated on the meteor night) — spread along the two trails + the cross-link
      { enemies: ['coily_cicada', 'skeeter_swarm'], count: 2, rect: { x: 52, y: 24, w: 5, h: 14 }, ifFlag: 'meteor_fell' }, // right trail
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 26, y: 30, w: 22, h: 2 }, ifFlag: 'meteor_fell' }, // cross-link
      { enemies: ['tick_nymph', 'coily_cicada'], count: 2, rect: { x: 20, y: 24, w: 5, h: 14 }, ifFlag: 'meteor_fell' }, // left trail
    ],
    triggers: [
      // the opening porch beat (L1)
      { id: 'porch', rect: { x: 13, y: 54, w: 4, h: 2 }, once: true },
      // the CRATER — the Hush-Sentinel set-piece (L3)
      { id: 'crater', rect: { x: 66, y: 9, w: 8, h: 3 }, once: true },
    ],
    patrols: [
      // Hodgkin's runaway mower on the L2 cross-link (catching it sets q_mower_caught → has_trail_key)
      { id: 'hodgkin_mower', enemy: 'runaway_lawnmower', route: [[26, 31], [50, 31]], countFlag: 'q_mower_caught' },
    ],
  };
}

/**
 * OTTERBROOK CITY HALL — the civic interior the human authors (Prime Law 1).
 * A warm wood lobby: the clerk's counter, the Mayor at her desk, a notice
 * board, and a payphone to save. The bottom door rides back to the jittered
 * facade's doorstep (computed, never hardcoded — the dos_f1 / S4 pattern).
 */
function buildOtterbrookCityHallInt(streetExit: { tx: number; ty: number }): MapDef {
  // 2026-07-02 (user direction): a REAL municipal building — three rooms off
  // one lobby. WEST: the records room (shelves, the town's one photocopier,
  // boxes of zoning). CENTER: the lobby, a civic rug running to the clerk's
  // counter, the save payphone. EAST: the Mayor's office (her desk, the town
  // flag, a window planter, a visitor chair she never lets anyone move).
  const g = new Grid(26, 16, 'w');
  g.rect(0, 0, 26, 2, 'W'); // back wall
  g.rect(8, 2, 1, 9, 'W'); g.set(8, 7, 'w'); // west partition, doorway mid-wall
  g.rect(17, 2, 1, 9, 'W'); g.set(17, 7, 'w'); // east partition, doorway mid-wall
  g.rect(11, 4, 4, 1, 'r'); // the civic rug runs to the counter
  g.rect(11, 5, 4, 1, 'r');
  return {
    id: 'otterbrook_cityhall',
    name: 'OTTERBROOK CITY HALL',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // THE LOBBY — clerk's counter + the notice board + the save phone
      { sprite: 'counter', x: 11, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 13, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'payphone', x: 9.5, y: 12, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'prop_waiting_bench', x: 14.5, y: 12.4, solid: { ox: 1, oy: 8, w: 30, h: 8 } },
      { sprite: 'planter', x: 12.5, y: 9.6, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      // THE RECORDS ROOM (west) — the town's paper memory + its one copier
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 4, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 1, y: 5.4, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'copier', x: 5.5, y: 8.6, solid: { ox: 1, oy: 8, w: 22, h: 12 } },
      { sprite: 'crate', x: 1.4, y: 9.4, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      { sprite: 'crate', x: 2.8, y: 9.7, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      // THE MAYOR'S OFFICE (east) — desk, flag, and the immovable chair
      { sprite: 'desk', x: 20, y: 4, solid: { ox: 0, oy: 8, w: 20, h: 12 } },
      { sprite: 'flagpole', x: 24, y: 2.4, solid: { ox: 6, oy: 6, w: 6, h: 6 } },
      { sprite: 'shelf_b', x: 18.5, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'planter', x: 23.5, y: 9.4, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      { sprite: 'floor_lamp', x: 18.6, y: 9.4, solid: { ox: 3, oy: 12, w: 8, h: 8 } },
    ],
    npcs: [
      { id: 'hall_clerk', sprite: 'fernLady', x: 12, y: 2, facing: 'down', dialogue: 'npc_hall_clerk' },
      { id: 'mayor_otter', sprite: 'oldTimer', x: 21, y: 6, facing: 'left', dialogue: 'npc_mayor_otter' },
    ],
    signs: [{ x: 10, y: 1, dialogue: 'sign_hall_wall' }],
    phones: [{ x: 10, y: 12 }],
    doors: [
      { x: 12, y: 15, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * THE OTTERBROOK STATION HOUSE — the little brick P.D.'s one room: a booking
 * desk, the case files, and a single holding CELL in the back-right corner (a
 * cot, a walled-off front with a barred doorway). Walked in off the civic lane
 * it's a quiet station; but when Constable Borden MARCHES you in (flag
 * `borden_marching`) you spawn INSIDE the cell and he books you — the cop fight
 * fires here (OverworldScene.bordenCellBeat). The bottom door rides back to the
 * jittered facade's doorstep (computed via doorstepOf — the dos_f1 pattern).
 */
function buildOtterStationInt(streetExit: { tx: number; ty: number }): MapDef {
  // 2026-07-02 (user direction): the P.D. grows into a real little station —
  // the BOOKING HALL (desk, case files, a bench nobody enjoys), the HOLDING
  // CELL kept byte-stable at its original tiles (OTTER_CELL still lands at
  // native 200,56 — the Borden march spawn), and an EAST WING: Borden's
  // office up top, the EVIDENCE/RECORDS room below it.
  const g = new Grid(24, 16, 'w');
  g.rect(0, 0, 24, 2, 'W'); // back wall
  // the HOLDING CELL — unchanged geometry (west wall col 10 rows 2-6, front
  // rail row 6 cols 11-15, barred gap at 13,6) + an east wall so the cell
  // stays a cell now that the building continues past it.
  g.rect(10, 2, 1, 5, 'W');
  g.rect(11, 6, 5, 1, 'W');
  g.set(13, 6, 'w');
  g.rect(16, 2, 1, 5, 'W'); // the cell's east wall
  // the EAST WING partition + its two rooms
  g.rect(16, 7, 1, 7, 'W'); g.set(16, 10, 'w'); // wing wall, doorway at 16,10
  g.rect(17, 8, 7, 1, 'W'); g.set(20, 8, 'w'); // office/records split, doorway at 20,8
  return {
    id: 'otter_station',
    name: 'OTTERBROOK STATION',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // THE BOOKING HALL
      { sprite: 'counter', x: 3, y: 4, solid: { ox: 0, oy: 4, w: 30, h: 14 } }, // the booking desk
      { sprite: 'counter', x: 5, y: 4, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } }, // case files
      { sprite: 'prop_waiting_bench', x: 2.5, y: 10.4, solid: { ox: 1, oy: 8, w: 30, h: 8 } },
      { sprite: 'water_cooler', x: 8.6, y: 8.2, solid: { ox: 2, oy: 10, w: 8, h: 8 } },
      { sprite: 'planter', x: 7, y: 12.6, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      { sprite: 'cot', x: 11, y: 2, solid: { ox: 1, oy: 12, w: 18, h: 10 } }, // the cell bunk
      // BORDEN'S OFFICE (wing, top) — the desk where the book lives
      { sprite: 'desk', x: 18, y: 3.6, solid: { ox: 0, oy: 8, w: 20, h: 12 } },
      { sprite: 'chalk_board', x: 21.5, y: 2, solid: { ox: 0, oy: 10, w: 26, h: 10 } }, // the "case" board
      { sprite: 'floor_lamp', x: 17.4, y: 2.2, solid: { ox: 3, oy: 12, w: 8, h: 8 } },
      // EVIDENCE / RECORDS (wing, bottom)
      { sprite: 'prop_lockbox_counter', x: 17.5, y: 9.6, solid: { ox: 1, oy: 10, w: 34, h: 12 } },
      { sprite: 'shelf_b', x: 21, y: 9.4, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'crate', x: 18, y: 13.2, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      { sprite: 'crate', x: 19.6, y: 13.5, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
    ],
    npcs: [
      // Borden books you in the cell — present only while he's marched you in
      { id: 'borden_cell', sprite: 'npc_borden', x: 14, y: 3, facing: 'down', dialogue: 'npc_borden_holding', ifFlag: 'borden_marching', unlessFlag: 'borden_cleared' },
    ],
    signs: [{ x: 4, y: 1, dialogue: 'sign_station_wall' }],
    phones: [],
    doors: [
      { x: 11, y: 15, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------- THE LONG WALK — Otterbrook → Brickton on foot (S15i M3, ADR-056) ------------- *
 * The single MEADOW MILE screen grows into a real multi-screen journey (the user's
 * "deepen the world" decree): town park → woods → second meadow → overpass → the
 * city. Four legs, each its own feel, wired with COMPUTED leg doors — every door
 * lands on its neighbour's ACTUAL trail entry, read off the draft grid (never a
 * hardcoded jittered coord; the ADR-012 route discipline). The §A7 band escalates
 * Ch.1 → Ch.1.5 as you near Brickton; a rest (payphone + picnic) sits at each leg's
 * WEST mouth, BEFORE its hot middle (§B4). Two cutscene beats are flag-gated (a
 * roadside vignette in the woods, the "you can see the city now" reveal on the
 * overpass). The METEOR ROADBLOCK stays on its leg (meadow_mile, the Hickory-Hill-
 * adjacent meadow). THE ORIENTATION GATE + the grandfather clause (badge OR bus)
 * move to the overpass — the city line. Hidden presents hide along the way (the
 * S9b gift-box pattern). The "town park" the journey opens at is grown Otterbrook's
 * POND PARK (already shipped, §A4.5 rests on the bank).
 */

const WALK_PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const WALK_PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const WALK_SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 } as const;
const WALK_GIFT_SOLID = { ox: 1, oy: 7, w: 12, h: 6 } as const;

/** the trail row (':') at a column — the entry a neighbour's door must land on,
 *  computed off the draft grid (ADR-012: jittered cross-map coords are derived) */
function trailRowAt(grid: string[], col: number): number {
  for (let y = 0; y < grid.length - 1; y++) if (grid[y][col] === ':') return y;
  return Math.round(grid.length / 2);
}

/** a hidden present: the closed box + its sign while sealed, the opened box + a
 *  flavor line after. `flag` is the open-state flag; OverworldScene.signBeat maps
 *  `flag` → the granted item (the S9b gift-box pattern, gated props). */
function walkPresent(flag: string, x: number, y: number): { props: PropDef[]; signs: SignDef[] } {
  return {
    props: [
      { sprite: 'gift_box', x, y, solid: WALK_GIFT_SOLID, unlessFlag: flag },
      { sprite: 'gift_box_open', x, y, solid: WALK_GIFT_SOLID, ifFlag: flag },
    ],
    signs: [
      { x, y: y + 1, dialogue: flag, unlessFlag: flag },
      { x, y: y + 1, dialogue: `${flag}_done`, ifFlag: flag },
    ],
  };
}

/** drop any TREE prop whose tile falls inside `box` — so a fixture (rest, present,
 *  door mouth) placed there stays reachable in-game (the grid BFS ignores prop
 *  solids, but trees DO collide; clear them or the reward is walled off) */
function clearTreesIn(props: PropDef[], box: { x: number; y: number; w: number; h: number }): PropDef[] {
  const isTree = (s: string): boolean => s === 'tree' || s === 'tree_b' || s === 'tree_c' || s === 'pine';
  return props.filter((p) => {
    const px = Math.round(p.x);
    const py = Math.round(p.y);
    return !(isTree(p.sprite) && px >= box.x && px < box.x + box.w && py >= box.y && py < box.y + box.h);
  });
}

/** LEG 1 — MEADOW MILE: the meadow just east of town, carrying the Task-0 meteor
 *  roadblock (a Hickory Hill chunk). Otterbrook's east gate lands here; the east
 *  edge is now a plain door onward to the woods. The gentlest §A7 band (near town). */
function buildMeadowMile(): MapDef {
  const draft = buildRoute({
    kind: 'route', id: 'meadow_mile', seed: 1500, size: [40, 16],
    style: 'treeline', encounterBand: 'ch1', signSlots: 2, ends: ['otterbrook', 'meadow_woods'],
  });
  const W = draft.grid[0].length;
  const H = draft.grid.length;
  const westY = draft.doors[0]?.y ?? Math.round(H / 2);
  const eastY = draft.doors[1]?.y ?? Math.round(H / 2);
  const traveler: NpcDef = { id: 'road_traveler', sprite: 'grayCommuter', x: 6, y: westY, facing: 'right', dialogue: 'npc_road_traveler', wander: true };

  // Task 0 — THE METEOR-DROP ROADBLOCK, kept on its leg: a chunk in the UPPER lane,
  // sawhorsed off; the lower lane stays walkable (you squeeze past — sweep-proven).
  const blockX = Math.round(W * 0.5);
  const tBlock = trailRowAt(draft.grid, blockX);
  const workerX = Math.max(2, blockX - 3);
  const tWorker = trailRowAt(draft.grid, workerX);
  const roadblock: PropDef[] = [
    { sprite: 'meteor_rock', x: blockX - 1, y: tBlock - 1, solid: { ox: 2, oy: 16, w: 30, h: 16 } },
    { sprite: 'sawhorse', x: blockX + 1, y: tBlock - 1, solid: { ox: 0, oy: 14, w: 30, h: 14 } },
  ];
  const worker: NpcDef = { id: 'roadblock_worker', sprite: 'quarterMan', x: workerX, y: tWorker, facing: 'right', dialogue: 'npc_roadblock_worker' };

  return {
    id: 'meadow_mile',
    name: 'MEADOW MILE',
    music: 'otterbrook',
    grid: draft.grid,
    props: [
      ...draft.props,
      { sprite: 'sign', x: W - 6, y: Math.max(1, eastY - 2), solid: WALK_SIGN_SOLID }, // → the woods
      ...roadblock,
      { sprite: 'sign', x: workerX, y: Math.max(1, tWorker - 1), solid: WALK_SIGN_SOLID }, // the ROAD WORK notice
    ],
    npcs: [traveler, worker],
    signs: [
      ...draft.signs,
      { x: W - 6, y: Math.max(1, eastY - 2), dialogue: 'sign_to_whisperwood' },
      { x: workerX, y: Math.max(1, tWorker - 1), dialogue: 'sign_roadblock' },
    ],
    phones: draft.phones,
    doors: [
      // west → Otterbrook's exported east gate (computed); east → the woods (the
      // coordinator rewrites tx/ty to the woods' real west entry below)
      { x: 0, y: westY, w: 1, h: 2, to: 'otterbrook', tx: OTTERBROOK_EAST_GATE.x * 16, ty: OTTERBROOK_EAST_GATE.y * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_woods', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: draft.spawners,
    // S15i Task 3 (ADR-058): THE WALKERS' REGISTER token — a strip just east of Hal
    // (you cross it walking on into the city; fires only while the quest is live)
    triggers: [{ id: 'walk_token', rect: { x: Math.round(W * 0.32), y: 0, w: 2, h: H }, once: false }],
  };
}

/** LEG 2 — WHISPERWOOD: buildWoods fills a forest around a winding clearing path;
 *  the rests, the glade present, the doors, the spawner + the roadside-vignette
 *  trigger are grafted on. Trees are FILTERED out of every fixture's tile so the
 *  whole leg stays reachable in-game. A slightly tougher §A7 band. */
function buildMeadowWoods(): MapDef {
  const W = 36;
  const H = 16;
  const S = new Streams(1510);
  const g = new Grid(W, H, '.');
  g.sprinkle(151001, ',~bb~ f', 0.16);
  const woods = buildWoods(g, { x: 0, y: 0, w: W, h: H }, S, { pines: true, density: 0.34 });
  const grid = g.out();
  const westY = trailRowAt(grid, 0);
  const eastY = trailRowAt(grid, W - 1);
  const gladeX = Math.round(W / 2);
  const gladeY = trailRowAt(grid, gladeX);

  // clear the rest mouth, the glade present, and both door mouths of trees so
  // every fixture is reachable from the cleared path corridor
  let trees = woods.props;
  for (const box of [
    { x: 0, y: westY - 2, w: 5, h: 5 }, // the west rest clearing
    { x: gladeX - 2, y: gladeY - 1, w: 4, h: 4 }, // the glade present
    { x: W - 3, y: eastY - 2, w: 3, h: 5 }, // the east mouth
  ]) {
    trees = clearTreesIn(trees, box);
  }

  // clearTreesIn only removes tree PROPS — but g.sprinkle can paint a SOLID bush
  // ('b') onto the WEST door-mouth GRID, wedging the player who arrives here from
  // meadow_mile (the landing is tile (1, westY), tx:16). Strip any solid bush from
  // the mouth so the entry is always walkable, never seed-luck (the trail ':' and
  // grass decor are left intact).
  for (let yy = Math.max(0, westY - 1); yy <= Math.min(H - 1, westY + 2); yy++) {
    const row = grid[yy].split('');
    for (let xx = 0; xx <= 2; xx++) if (row[xx] === 'b') row[xx] = '.';
    grid[yy] = row.join('');
  }

  const gift = walkPresent('meadow_gift_woods', gladeX - 1, gladeY);
  return {
    id: 'meadow_woods',
    name: 'WHISPERWOOD',
    music: 'otterbrook',
    grid,
    props: [
      ...trees,
      { sprite: 'payphone', x: 2, y: westY + 2, solid: WALK_PHONE_SOLID },
      { sprite: 'picnic', x: 3, y: Math.max(1, westY - 2), solid: WALK_PICNIC_SOLID },
      { sprite: 'sign', x: 5, y: Math.max(1, westY - 2), solid: WALK_SIGN_SOLID },
      ...gift.props,
    ],
    npcs: [],
    signs: [{ x: 5, y: Math.max(1, westY - 2), dialogue: 'sign_whisperwood' }, ...gift.signs],
    phones: [{ x: 2, y: westY + 2 }],
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_mile', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_far', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['hill_slug_deluxe', 'coily_cicada', 'recycling_raccoon'], count: 2, rect: { x: Math.round(W / 3), y: 2, w: Math.round(W / 3), h: H - 4 } },
    ],
    triggers: [
      { id: 'woods_vignette', rect: { x: 1, y: 0, w: 3, h: H }, once: false },
      // Task 3 (ADR-058): the WALKERS' REGISTER token, at the glade (what the quiet leaves)
      { id: 'walk_token', rect: { x: gladeX - 1, y: 0, w: 2, h: H }, once: false },
    ],
  };
}

/** LEG 3 — THE FAR MEADOW: the open stretch before the city edge, an off-trail
 *  present (the salt-shaker callback) and a tougher §A7 band (mower + pigeons). */
function buildMeadowFar(): MapDef {
  const draft = buildRoute({
    kind: 'route', id: 'meadow_far', seed: 1520, size: [38, 16],
    style: 'treeline', encounterBand: 'ch1', signSlots: 1, ends: ['meadow_woods', 'meadow_overpass'],
  });
  const W = draft.grid[0].length;
  const H = draft.grid.length;
  const westY = draft.doors[0]?.y ?? Math.round(H / 2);
  const eastY = draft.doors[1]?.y ?? Math.round(H / 2);
  const giftX = Math.round(W * 0.62);
  const giftY = Math.max(2, trailRowAt(draft.grid, giftX) - 3);
  const gift = walkPresent('meadow_gift_far', giftX, giftY);
  const props = clearTreesIn(draft.props, { x: giftX - 1, y: giftY - 1, w: 3, h: 3 });

  return {
    id: 'meadow_far',
    name: 'THE FAR MEADOW',
    music: 'otterbrook',
    grid: draft.grid,
    props: [...props, ...gift.props],
    npcs: [{ id: 'far_walker', sprite: 'pajamaKid', x: 5, y: westY, facing: 'right', dialogue: 'npc_far_walker', wander: true }],
    signs: [...draft.signs, ...gift.signs],
    phones: draft.phones,
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_woods', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_overpass', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: draft.spawners.map((s) => ({ ...s, enemies: ['runaway_lawnmower', 'pigeon_gang', 'skeeter_swarm'] })),
    // Task 3 (ADR-058): the WALKERS' REGISTER token (where the air goes electric)
    triggers: [{ id: 'walk_token', rect: { x: Math.round(W * 0.4), y: 0, w: 2, h: H }, once: false }],
  };
}

/** LEG 4 — THE OVERPASS: the city line. THE ORIENTATION GATE (three proctors +
 *  the east-edge trigger, grandfather clause intact) and the "you can see the city
 *  now" reveal live here. The toughest pre-city §A7 band (pigeons + smilers). */
function buildMeadowOverpass(): MapDef {
  const draft = buildRoute({
    kind: 'route', id: 'meadow_overpass', seed: 1530, size: [34, 16],
    style: 'fenced', encounterBand: 'ch1', signSlots: 1, ends: ['meadow_far', 'brickton'],
  });
  const W = draft.grid[0].length;
  const H = draft.grid.length;
  const westY = draft.doors[0]?.y ?? Math.round(H / 2);
  const eastY = draft.doors[1]?.y ?? Math.round(H / 2);
  const proctors: NpcDef[] = [
    { id: 'proctor_a', sprite: 'smilerB', x: W - 5, y: Math.max(2, eastY - 1), facing: 'left', dialogue: 'npc_proctor', unlessFlag: 'visitor_badge' },
    { id: 'proctor_b', sprite: 'smilerB', x: W - 4, y: eastY + 1, facing: 'left', dialogue: 'npc_proctor', unlessFlag: 'visitor_badge' },
    { id: 'proctor_c', sprite: 'smilerB', x: W - 6, y: eastY + 2, facing: 'left', dialogue: 'npc_proctor', unlessFlag: 'visitor_badge' },
  ];
  // S15i Task 3 (ADR-058): THE WALKERS' REGISTER post — Old Pell's ledger on a
  // post, mid-overpass and OFF the trail (computed so it never blocks the lane);
  // signing it completes Ch.1 #5 (handled in OverworldScene.signBeat).
  const regX = Math.round(W * 0.45);
  const regTrail = trailRowAt(draft.grid, regX);
  const regY = regTrail + 2 <= H - 2 ? regTrail + 2 : Math.max(1, regTrail - 2);

  return {
    id: 'meadow_overpass',
    name: 'THE OVERPASS',
    music: 'otterbrook',
    grid: draft.grid,
    props: [
      ...draft.props,
      { sprite: 'sign', x: W - 6, y: Math.max(1, eastY - 2), solid: WALK_SIGN_SOLID }, // BRICKTON CITY LIMITS
      { sprite: 'sign', x: regX, y: regY, solid: WALK_SIGN_SOLID }, // the Walkers' Register post
    ],
    npcs: [...proctors],
    signs: [
      ...draft.signs,
      { x: W - 6, y: Math.max(1, eastY - 2), dialogue: 'sign_overpass_gate' },
      { x: regX, y: regY, dialogue: 'walkers_register_book' },
    ],
    phones: draft.phones,
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_far', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
    ],
    spawners: draft.spawners.map((s) => ({ ...s, enemies: ['pigeon_gang', 'blazer_smiler', 'good_investment'] })),
    triggers: [
      // the "you can see the city now" reveal — on entry from the far meadow (west)
      { id: 'city_reveal', rect: { x: 1, y: 0, w: 3, h: H }, once: false },
      // THE ORIENTATION GATE — the east edge IS the city line; the gate runs the
      // proctor exercises → visitor_badge, or walks you straight in on badge/bus
      { id: 'orientation_gate', rect: { x: W - 3, y: 0, w: 3, h: H }, once: false },
    ],
  };
}

/** THE LONG WALK — build all four legs and wire their COMPUTED inter-leg doors:
 *  every door's tx/ty is overwritten to land on the neighbour's REAL trail entry
 *  (read off the draft), never a hardcoded coordinate (the ADR-012 discipline). */
function buildLongWalk(): { meadow_mile: MapDef; meadow_woods: MapDef; meadow_far: MapDef; meadow_overpass: MapDef } {
  const meadow_mile = buildMeadowMile();
  const meadow_woods = buildMeadowWoods();
  const meadow_far = buildMeadowFar();
  const meadow_overpass = buildMeadowOverpass();

  // each leg's real west/east entry (the trail row at its first/last column)
  const entry = (m: MapDef): { W: number; westY: number; eastY: number } => {
    const W = m.grid[0].length;
    return { W, westY: trailRowAt(m.grid, 0), eastY: trailRowAt(m.grid, W - 1) };
  };
  const e = { mile: entry(meadow_mile), woods: entry(meadow_woods), far: entry(meadow_far), op: entry(meadow_overpass) };
  // land an EAST→neighbour door at the neighbour's WEST mouth (tile 1); a
  // WEST→neighbour door at the neighbour's EAST mouth (tile W-2)
  const aim = (m: MapDef, to: string, tx: number, ty: number): void => {
    const d = m.doors.find((x) => x.to === to);
    if (d) { d.tx = tx; d.ty = ty; }
  };
  aim(meadow_mile, 'meadow_woods', 16, e.woods.westY * 16);
  aim(meadow_woods, 'meadow_mile', (e.mile.W - 2) * 16, e.mile.eastY * 16);
  aim(meadow_woods, 'meadow_far', 16, e.far.westY * 16);
  aim(meadow_far, 'meadow_woods', (e.woods.W - 2) * 16, e.woods.eastY * 16);
  aim(meadow_far, 'meadow_overpass', 16, e.op.westY * 16);
  aim(meadow_overpass, 'meadow_far', (e.far.W - 2) * 16, e.far.eastY * 16);
  return { meadow_mile, meadow_woods, meadow_far, meadow_overpass };
}

/* ------------------- THE UNDER-OAK (ADR-121 rework, 2026-07-02) -------------------
 * The Titanic Tick is no longer fought by touching a tree. The Heart Oak's
 * roots have torn open into a BURROW in Pond Park, and BOSS 1 waits at the
 * bottom of a directed three-map descent — EarthBound's Giant-Step grammar:
 * a winding root-tunnel with fights, a breather hollow with a rest + a cache,
 * then the heart chamber and the Tick. The set rides CH1_STORY_NIGHT_MAPS'
 * hush clock, so the whole descent is pitch-dark until the boss dies and the
 * post-victory rebuild lets the morning down the roots. Direction is given in
 * dawn_hush_dark (the wake-up note points at Pond Park), sign_oak_burrow at
 * the mouth, and heart_oak_approach at the bottom. */

/** the root tunnel — enter from the burrow (bottom), wind and climb-down north */
function buildOakRoots(): MapDef {
  const g = new Grid(28, 40, 'K');
  // the entry throat — a scorched mouth chamber where the surface light dies
  for (const [y, x0, x1] of [[33, 10, 16], [34, 9, 17], [35, 9, 18], [36, 10, 17], [37, 11, 16], [38, 12, 15]] as const) {
    g.rect(x0, y, x1 - x0 + 1, 1, 's');
  }
  // the winding descent (center-table, never a ruler) up-map toward the hollow
  windV(g, [13, 13, 12, 11, 10, 10, 11, 13, 15, 17, 18, 18, 17, 15, 13, 11, 9, 8, 8, 9, 11, 13, 14, 14, 13, 12, 11, 11, 12, 13, 13], 2, 3, ':');
  // two side galleries the tunnel brushes past (fights live here)
  for (const [y, x0, x1] of [[19, 4, 9], [20, 3, 10], [21, 3, 10], [22, 4, 9], [23, 5, 8]] as const) g.rect(x0, y, x1 - x0 + 1, 1, 's');
  g.rect(9, 21, 3, 1, 's'); // gallery throat west
  for (const [y, x0, x1] of [[9, 18, 23], [10, 17, 24], [11, 17, 24], [12, 18, 23]] as const) g.rect(x0, y, x1 - x0 + 1, 1, 's');
  g.rect(16, 10, 3, 1, 's'); // gallery throat east
  // ember veins glowing in the cut walls
  for (const [ex, ey] of [[12, 30], [15, 26], [17, 21], [10, 16], [8, 12], [14, 7], [12, 4], [6, 21], [21, 10]] as const) g.set(ex, ey, 'S');
  g.rect(12, 0, 3, 3, ':'); // the north throat up to the hollow

  return {
    id: 'oak_roots',
    name: 'HICKORY HILL CAVE',
    music: 'hill',
    grid: g.out(),
    props: [
      { sprite: 'root_curtain', x: 12.5, y: 1.2 }, // rootlets over the north throat
      { sprite: 'root_curtain', x: 12.6, y: 33.2 }, // ...and the entry throat
      // guide-lights flanking the ONWARD (north) throat — so the dark descent reads as
      // a route, not a dead-end (the player's eye follows the glow deeper into the hill)
      { sprite: 'glow_shroom_b', x: 10.6, y: 3.4 },
      { sprite: 'glow_shroom_b', x: 14.4, y: 3.4 },
      { sprite: 'ember', x: 12.4, y: 2.4 },
      { sprite: 'root_knot', x: 6.5, y: 20.3, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'root_knot', x: 19.4, y: 10.6, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'glow_shroom', x: 10.6, y: 27.6 },
      { sprite: 'glow_shroom', x: 9.3, y: 9.6 },
      { sprite: 'glow_shroom_b', x: 16.4, y: 16.5 },
      { sprite: 'ember', x: 12.4, y: 31.4 },
      { sprite: 'ember', x: 17.6, y: 22.4 },
      { sprite: 'ember', x: 8.4, y: 13.5 },
      { sprite: 'ember', x: 14.5, y: 5.5 },
      { sprite: 'ember', x: 6.5, y: 22.3 },
      { sprite: 'ember', x: 21.4, y: 11.3 },
    ],
    npcs: [],
    signs: [{ x: 12, y: 35, dialogue: 'oak_roots_enter' }],
    phones: [],
    doors: [
      // Surface return lands just below the hilltop CAVE mouth (top-left of the plateau),
      // on the left path — the cave is the top-left set-piece in the concept layout.
      {
        x: 12,
        y: 39,
        w: 4,
        h: 1,
        to: 'otterbrook',
        tx: 29 * 16 + 8,
        ty: 11 * 16,
        facing: 'down',
        indicator: 'none',
      },
      { x: 12, y: 0, w: 3, h: 1, to: 'oak_hollow', tx: 11 * 16 + 8, ty: 19 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['tick_nymph', 'coily_cicada'], count: 2, rect: { x: 4, y: 19, w: 6, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
      { enemies: ['skeeter_swarm', 'tick_nymph'], count: 2, rect: { x: 17, y: 9, w: 7, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 1, rect: { x: 10, y: 24, w: 6, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    ],
    triggers: [],
  };
}

/** the breather hollow — an underground pool, a rest, and somebody's old cooler */
function buildOakHollow(): MapDef {
  const g = new Grid(26, 22, 'K');
  // the hall — a rounded root-vault
  for (const [y, x0, x1] of [[4, 8, 17], [5, 6, 19], [6, 5, 20], [7, 4, 21], [8, 4, 21], [9, 4, 21], [10, 4, 21], [11, 4, 21], [12, 5, 20], [13, 5, 20], [14, 6, 19], [15, 7, 18], [16, 9, 16]] as const) {
    g.rect(x0, y, x1 - x0 + 1, 1, 's');
  }
  // the still pool (solid water, foam lip) the roots drink from
  g.rect(9, 8, 5, 3, 'e');
  g.rect(9, 7, 5, 1, 'E'); g.rect(9, 11, 5, 1, 'E');
  g.set(8, 8, 'E'); g.set(8, 10, 'E'); g.set(14, 8, 'E'); g.set(14, 10, 'E');
  for (const [ex, ey] of [[6, 6], [19, 7], [5, 13], [18, 14]] as const) g.set(ex, ey, 'S');
  g.rect(11, 17, 3, 5, ':'); // south throat, down to the roots
  g.rect(11, 0, 3, 4, ':'); // north throat, up to the heart

  const cache = walkPresent('oak_cache', 18, 6);
  return {
    id: 'oak_hollow',
    name: 'THE CAVE — HOLLOW',
    music: 'hill',
    grid: g.out(),
    props: [
      ...cache.props,
      // a rest before the heart (§A4.5 — placed BEFORE the pressure)
      { sprite: 'picnic', x: 5.6, y: 12.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'root_curtain', x: 11.6, y: 0.4 },
      { sprite: 'root_knot', x: 16.6, y: 12.2, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'glow_shroom', x: 6.2, y: 7.2 },
      { sprite: 'glow_shroom_b', x: 16.5, y: 15 },
      { sprite: 'glow_shroom', x: 12.4, y: 13.8 },
      { sprite: 'ember', x: 6.4, y: 6.4 },
      { sprite: 'ember', x: 18.5, y: 13.5 },
      { sprite: 'ember', x: 12.3, y: 4.6 },
    ],
    npcs: [],
    signs: [...cache.signs],
    phones: [],
    doors: [
      { x: 11, y: 21, w: 3, h: 1, to: 'oak_roots', tx: 12 * 16 + 8, ty: 2 * 16, facing: 'down', indicator: 'none' },
      { x: 11, y: 0, w: 3, h: 1, to: 'oak_heart', tx: 10 * 16 + 8, ty: 20 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['skeeter_swarm', 'coily_cicada'], count: 1, rect: { x: 15, y: 9, w: 5, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    ],
    triggers: [],
  };
}

/** the heart chamber — the Tick's feeding mound and the heart_oak trigger */
function buildOakHeart(): MapDef {
  const g = new Grid(22, 24, 'K');
  // the chamber — widest at its middle, narrowing toward the throat
  for (const [y, x0, x1] of [[3, 8, 13], [4, 6, 15], [5, 4, 17], [6, 3, 18], [7, 3, 18], [8, 3, 18], [9, 3, 18], [10, 3, 18], [11, 4, 17], [12, 4, 17], [13, 5, 16], [14, 6, 15], [15, 7, 14], [16, 8, 13]] as const) {
    g.rect(x0, y, x1 - x0 + 1, 1, 's');
  }
  // the ember ring around the mound — the Tick's heat signature
  for (const [ex, ey] of [[8, 5], [13, 5], [6, 8], [15, 8], [7, 11], [14, 11], [10, 13], [11, 13]] as const) g.set(ex, ey, 'S');
  windV(g, [10, 10, 11, 11, 10, 10, 10], 17, 3, ':'); // the approach throat

  return {
    id: 'oak_heart',
    name: 'THE CAVE — THE HEART',
    music: 'hill',
    grid: g.out(),
    props: [
      // the feeding mound the Tick is buried under (the boss fires from the
      // heart_oak trigger in front of it — same scene, same re-arm rules)
      { sprite: 'meteor_rock', x: 9, y: 6, solid: { ox: 1, oy: 8, w: 28, h: 14 } },
      { sprite: 'tree_c', x: 5, y: 3.6, solid: OAK }, // great root columns
      { sprite: 'tree_c', x: 14.5, y: 3.4, solid: OAK },
      { sprite: 'root_curtain', x: 9.8, y: 2.2 }, // the heartwood hangs over the mound
      { sprite: 'root_knot', x: 4.4, y: 12.6, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'root_knot', x: 15.6, y: 12.8, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'glow_shroom', x: 4.6, y: 8.6 },
      { sprite: 'glow_shroom_b', x: 16.4, y: 8.4 },
      { sprite: 'ember', x: 8.5, y: 5.6 },
      { sprite: 'ember', x: 13.4, y: 5.4 },
      { sprite: 'ember', x: 6.6, y: 11.4 },
      { sprite: 'ember', x: 14.6, y: 11.6 },
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [{ x: 9, y: 23, w: 3, h: 1, to: 'oak_hollow', tx: 12 * 16, ty: 2 * 16, facing: 'down', indicator: 'none' }],
    spawners: [],
    triggers: [
      // ADR-121: BOSS 1 — the same heartOakScene, now at the bottom of a real
      // route instead of on a surface tree. Gated in OverworldScene.runTrigger
      // (zapper_done && !tick_defeated); re-arms on re-entry after a flee/loss.
      { id: 'heart_oak', rect: { x: 8, y: 8, w: 6, h: 3 }, once: false },
    ],
  };
}

/* (the 4 old climb maps — hill_road/hickory_trail/whisperwood_rise/hickory_hill —
 * were dissolved into the elevated Otterbrook map; World Overhaul S5, 2026-07-04.) */

/* ------------------- INTERIORS ------------------- */

function buildRexHome(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(14, 10, 'w');
  g.rect(0, 0, 14, 2, 'W');
  g.rect(4, 4, 3, 2, 'r');
  return {
    id: 'rex_home',
    name: "{rex}'S HOUSE",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'sofa', x: 2, y: 4, solid: { ox: 0, oy: 4, w: 34, h: 14 } },
      { sprite: 'counter', x: 9, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'phone_table', x: 1, y: 2, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      // S7 furnishings, mounted into the wall band so no walkable ground is
      // lost (the wall tiles already collide; the lamp's small solid sits
      // clear of the phone-save spot — S6 rule)
      { sprite: 'tv', x: 2.8, y: 0.6 },
      { sprite: 'floor_lamp', x: 5.5, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bookshelf', x: 7.5, y: 0 },
      { sprite: 'stove', x: 11, y: 0.5 },
    ],
    npcs: [{ id: 'mom', sprite: 'mom', x: 9, y: 5, facing: 'down', dialogue: 'npc_mom' }],
    signs: [],
    phones: [{ x: 1, y: 2 }],
    doors: [
      { x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // S9b: the stairs land on the upstairs hall (three bedrooms up there now)
      { x: 12, y: 9, w: 2, h: 1, to: 'rex_hall', tx: 228, ty: 80, facing: 'left', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildOtterHome(id: string, name: string, streetExit: { tx: number; ty: number }, seed: number): MapDef {
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(6, 7, 3, 2, 'r');
  const leftBed = seed % 2 === 0;
  return {
    id,
    name,
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'sofa', x: 3, y: 5, solid: { ox: 0, oy: 4, w: 34, h: 14 } },
      { sprite: 'bookshelf', x: 11.5, y: 0 },
      { sprite: 'counter', x: 9, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'stove', x: 12, y: 0.5 },
      { sprite: 'tv', x: 2.4, y: 0.6 },
      { sprite: 'plant_pot', x: 13, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'bed', x: leftBed ? 1 : 12, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
    ],
    npcs: [
      {
        id: `${id}_resident`,
        sprite: ['grayCommuter', 'pajamaKid', 'fernLady', 'oldTimer'][seed % 4],
        x: 7,
        y: 5,
        facing: 'down',
        dialogue: `cl_resident_${seed % 14}`,
      },
    ],
    signs: [],
    phones: seed === 0 ? [{ x: 1, y: 2 }] : [],
    doors: [{ x: 7, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

function buildWorkshopInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(18, 11, 'o');
  g.rect(0, 0, 18, 2, 'O');
  g.rect(2, 7, 4, 2, 'r');
  return {
    id: 'workshop_int',
    name: "PEMBERTON'S WORKSHOP",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'desk', x: 8, y: 3, solid: { ox: 0, oy: 8, w: 20, h: 12 } },
      { sprite: 'shelf_b', x: 2, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 13, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 10, y: 7, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'floor_lamp', x: 15, y: 7.4, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
    ],
    npcs: [],
    signs: [{ x: 8, y: 3, dialogue: 'trail_shed' }],
    phones: [],
    doors: [{ x: 8, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

function buildBedroom(): MapDef {
  const g = new Grid(10, 8, 'w');
  g.rect(0, 0, 10, 2, 'W');
  g.rect(4, 4, 2, 2, 'r');
  return {
    id: 'rex_bedroom',
    name: "{rex}'S ROOM",
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 6, y: 1.55, solid: { ox: 1, oy: 4, w: 24, h: 13 } }, // backed up against the top wall
      { sprite: 'dresser', x: 8, y: 2.4, solid: { ox: 2, oy: 8, w: 26, h: 14 } }, // on the floor, right of the desk
    ],
    npcs: [],
    signs: [],
    phones: [],
    // S9b: the bedroom opens onto the upstairs hall — the house grew a wing
    doors: [{ x: 3, y: 7, w: 2, h: 1, to: 'rex_hall', tx: 44, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [{ id: 'wake_up', rect: { x: 0, y: 0, w: 10, h: 8 }, once: true }],
  };
}

/* ---------- S9b: the upstairs wing — hall + the twins' HQ (§A10 #3 amend:
 * Ana & Vivi are Jay's little sisters; the stand is the branch office) ---- */

function buildRexHall(): MapDef {
  const g = new Grid(16, 7, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(2, 3, 12, 2, 'r'); // the runner rug, worn down the middle
  return {
    id: 'rex_hall',
    name: 'UPSTAIRS',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bookshelf', x: 4.6, y: 0 },
      { sprite: 'floor_lamp', x: 10.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'plant_pot', x: 0.4, y: 4.6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [],
    signs: [
      { x: 6, y: 1, dialogue: 'hall_photos' },
      { x: 9, y: 1, dialogue: 'hall_window' },
    ],
    phones: [],
    doors: [
      // S11b: doorways through the wall are DOORS (user law) — they swing
      // open before they admit you; mats stay legal only at bottom edges
      // NB: these tx/ty are the PRE-GROW rooms' numbers — the rooms are in
      // ROOMY_INTERIORS, so the assembly re-aim pass (below the growInterior
      // loop) rewrites each landing to one tile inside the grown room's mat.
      { x: 2, y: 2, w: 2, h: 1, to: 'rex_bedroom', tx: 56, ty: 96, facing: 'up', indicator: 'door' },
      { x: 7, y: 2, w: 2, h: 1, to: 'ana_room', tx: 72, ty: 112, facing: 'up', indicator: 'door' },
      { x: 12, y: 2, w: 2, h: 1, to: 'vivi_room', tx: 72, ty: 112, facing: 'up', indicator: 'door' },
      { x: 15, y: 4, w: 1, h: 2, to: 'rex_home', tx: 200, ty: 132, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildAnaRoom(): MapDef {
  const g = new Grid(9, 8, 'w');
  g.rect(0, 0, 9, 2, 'W');
  g.rect(3, 4, 2, 2, 'r');
  return {
    id: 'ana_room',
    name: "ANA'S ROOM",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 5, y: 2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'dresser', x: 7.2, y: 0.3 },
      // her present for Jay — opened, the box stays (EB keeps its trash)
      { sprite: 'gift_box', x: 6, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'ana_gift_open' },
      { sprite: 'gift_box_open', x: 6, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'ana_gift_open' },
    ],
    npcs: [
      // ADR-121: Ana is home through the meteor night; gone to the stand by morning.
      { id: 'ana', sprite: 'ana', x: 3, y: 5, facing: 'down', dialogue: 'ana_room_night', unlessFlag: 'zapper_done' },
    ],
    signs: [
      { x: 6, y: 1, dialogue: 'ana_chart' },
      { x: 1, y: 2, dialogue: 'ana_bed' },
      { x: 6, y: 5, dialogue: 'gift_ana', unlessFlag: 'ana_gift_open' },
      { x: 6, y: 5, dialogue: 'gift_ana_done', ifFlag: 'ana_gift_open' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'rex_hall', tx: 124, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

function buildViviRoom(): MapDef {
  const g = new Grid(9, 8, 'w');
  g.rect(0, 0, 9, 2, 'W');
  g.rect(4, 4, 2, 2, 'r');
  return {
    id: 'vivi_room',
    name: "VIVI'S ROOM",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 6, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'bookshelf', x: 1.2, y: 0 }, // the ledgers. all of them.
      { sprite: 'tv', x: 6.6, y: 0.6 },
      { sprite: 'gift_box', x: 2, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'vivi_gift_open' },
      { sprite: 'gift_box_open', x: 2, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'vivi_gift_open' },
    ],
    npcs: [
      // ADR-121: Vivi is home through the meteor night; gone to the stand by morning.
      { id: 'vivi', sprite: 'vivi', x: 6, y: 5, facing: 'down', dialogue: 'vivi_room_night', unlessFlag: 'zapper_done' },
    ],
    signs: [
      { x: 2, y: 1, dialogue: 'vivi_jar' },
      { x: 6, y: 2, dialogue: 'vivi_bed' },
      { x: 2, y: 5, dialogue: 'gift_vivi', unlessFlag: 'vivi_gift_open' },
      { x: 2, y: 5, dialogue: 'gift_vivi_done', ifFlag: 'vivi_gift_open' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'rex_hall', tx: 204, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- BRICKTON CITY (S1, organic layout per ADR-012) ------------------- */

/** where the bus drops you — OverworldScene's bus flow reads this */
export const BRICKTON_BUS_SPAWN = { x: 88, y: 476 } as const;

/** where MEADOW MILE drops you on foot (S15h) — the grown city's SOUTH GATEWAY,
 *  in the new district (the orientation gate reads this). Computed for the 144×76
 *  grown grid; the bus still lands inside the old downtown (BRICKTON_BUS_SPAWN). */
export const BRICKTON_FOOT_SPAWN = { x: 30 * 16 + 8, y: 71 * 16 } as const;

/**
 * BRICKTON CITY — "Break the stripes" re-layout (docs/CITY_DESIGN_LANGUAGE.md).
 * Skeleton unchanged (streets A/B/Market, the two avenues) — every FIXED
 * POINT (bus corner, payphone cluster, clock plaza trigger, the cage lot)
 * sits at its exact tile, still walkable. What changes is the TEXTURE inside
 * the blocks: curb parking lanes read as real streets, two formal alleys
 * break the north row's unbroken baseline, the midtown reads as three
 * quarters (transit/lots, row-house strip, park-as-a-room), the clock plaza
 * gets benches that face the clock, and the south market lot becomes an
 * actual market. All irregularity still comes from one fixed seed (1995 —
 * the summer it fell) so the city is sporadic to the eye but identical on
 * every boot.
 */
/** THE FROZEN 2077 CORE — byte-identical forever (the byte-identical test
 *  proves growBrickton copies its grid + props unchanged into the top-left;
 *  only the docks EXIT door relocates to the grown city's new edge). */
export function buildBrickton(): MapDef {
  const rng = seededRng(1995);
  const jit = (n: number): number => Math.floor(rng() * n);

  const g = new Grid(72, 38, '=');
  // bounds + the brick spine the north row backs onto
  g.rect(0, 0, 72, 1, 'B');
  g.rect(0, 0, 1, 38, 'B');
  g.rect(71, 0, 1, 38, 'B');
  g.rect(0, 37, 72, 1, 'B');
  g.rect(1, 1, 70, 5, 'B');
  // three streets + two avenues: Brickton is a real city block now, not a strip
  g.rect(1, 8, 70, 3, 'R');
  g.rect(1, 21, 70, 3, 'R');
  g.rect(25, 31, 46, 3, 'R');
  g.rect(25, 8, 3, 26, 'R');
  g.rect(58, 21, 3, 13, 'R');
  // dashed centerlines, phase-shifted per street, broken at the avenue + crossings
  const skipA = new Set([17, 18, 23, 24, 25, 26, 27]);
  const skipB = new Set([25, 26, 27, 28, 29]);
  for (let x = 1; x < 71; x++) {
    if (x % 4 < 2 && !skipA.has(x)) g.set(x, 9, 'D');
    if ((x + 2) % 4 < 2 && !skipB.has(x)) g.set(x, 22, 'D');
    if ((x + 1) % 4 < 2 && x >= 25 && x < 71 && ![58, 59, 60].includes(x)) g.set(x, 32, 'D');
  }
  // crosswalks: by the hospital, and flanking the avenue at each street
  g.rect(17, 8, 2, 3, 'X');
  g.rect(23, 8, 2, 3, 'X');
  g.rect(28, 21, 2, 3, 'X');
  g.rect(57, 21, 2, 3, 'X');
  g.rect(25, 30, 3, 2, 'X');
  g.rect(58, 30, 3, 2, 'X');

  // M1 — PARKED LANES: 1-wide curb segments on the outer lane of streets A/B
  // (never the centerline row, never a crosswalk/avenue-mouth/alley-mouth
  // column), so the avenue reads as "cars actually park here" without
  // touching traffic width. Plain g.set calls — consumes NO rng (ADR-016),
  // so the 1995 stream below stays exactly the sequence it always drew.
  const paveSkipA = (x: number): boolean => (x >= 16 && x <= 28) || (x >= 55 && x <= 61);
  for (const [x0, len] of [[3, 10], [30, 6], [43, 10], [62, 6]] as const) {
    for (let x = x0; x < x0 + len; x++) if (!paveSkipA(x)) g.set(x, 8, 'P'); // street A north curb
  }
  const paveSkipB = (x: number): boolean => (x >= 25 && x <= 30) || (x >= 55 && x <= 61);
  for (const [x0, len] of [[3, 10], [31, 8], [46, 6], [62, 6]] as const) {
    for (let x = x0; x < x0 + len; x++) if (!paveSkipB(x)) g.set(x, 23, 'P'); // street B south curb
  }

  // west mid-block: the parking lot (always emptier than it should be)
  g.rect(2, 13, 8, 5, 'P');
  // M3 midtown CENTER — a service pocket behind the row-house strip (x11-24):
  // a 1-tall dressing strip just off street B's sidewalk, north of the curb
  g.rect(11, 19, 13, 1, '=');
  // east mid-block: THE PARK becomes a ROOM (M3 park/green quarter) — an
  // inner ':' loop around the fountain-picnic, corners nibbled so the plaza
  // never reads as a rectangle
  g.rect(41, 13, 13, 6, '.');
  g.rect(41, 13, 1 + jit(3), 1, '=');
  g.rect(53 - jit(3), 13, 3, 1, '=');
  g.rect(41, 18, 2 + jit(3), 1, '=');
  g.rect(52 - jit(2), 18, 3, 1, '=');
  g.rect(43, 14, 9, 1, ':'); g.rect(43, 17, 9, 1, ':'); // the loop's N/S legs
  g.rect(43, 14, 1, 4, ':'); g.rect(51, 14, 1, 4, ':'); // the loop's E/W legs
  // east plaza: THE CLOCK PLAZA — a coherent '=' room (M3 civic quarter);
  // public notices, too much sidewalk, and now a bench-lined court
  g.rect(58, 12, 11, 7, '.');
  g.rect(61, 14, 5, 3, '=');
  g.rect(66, 16, 3, 2, '=');
  g.rect(60, 15, 8, 1, '='); // the court apron the benches sit on
  // south market lot: buses, deliveries, and pigeons with committees — now
  // THE MARKET ROW (M3 market quarter): stalls crowd the walkway
  g.rect(3, 28, 9, 5, 'P');
  g.rect(34, 25, 11, 4, '=');
  // S14: the EAST GAP — street B runs out the wall to the DOCKS (a plain
  // g.set pair consumes NO rng; every seeded stream stays byte-identical)
  g.rect(71, 21, 1, 3, 'R');
  // SE vacant lot behind its fence — S12: the fence gains a GATE (one tile
  // swapped walkable; a plain g.set consumes NO rng, so the 1995 stream and
  // the whole jittered layout stay byte-identical, ADR-016's rule). The
  // FUTURE SITE finally arrived, and it's a basketball cage.
  g.rect(47, 26, 7, 1, '-');
  g.set(50, 26, '=');
  g.rect(47, 27, 1, 3, '|');
  g.rect(53, 27, 1, 3, '|');
  g.rect(48, 27, 5, 3, '.');
  // M2 — two formal ALLEYS in the north row (hospital→dept, video→diner):
  // rows 6-7 are already plain sidewalk (the default '=' fill, untouched by
  // any street/plaza paint above), so the alley reads through its WIDENED
  // gap + dumpster/crate dressing (below) — the same "bare" alley precedent
  // as the original starmart-brickmore gap. Neither avenue reaches this far
  // north (avenue-1/2 both start at row 8, the street itself), so the only
  // clearance that matters here is each alley's own building footprint —
  // guaranteed by the north-row spacing loop above (alley2X/alley3X, below).
  // hedge fragments along the south edge — broken, like real municipal hedges
  let hx = 18;
  while (hx < 68) {
    const len = 2 + jit(3);
    if (rng() < 0.75) g.rect(hx, 35, len, 1, 'b');
    hx += len + 1 + jit(3);
  }
  // M3 park quarter — hedge fragments at the room's corners (gaps ≥3-wide,
  // so the loop's own entrances at N/S/E/W stay clear)
  g.set(41, 13, 'b'); g.set(53, 13, 'b');
  g.set(41, 18, 'b'); g.set(53, 18, 'b');
  g.sprinkle(95, ',~ff F', 0.16); // grass fuzz in the park + the lot

  /* ---- buildings: three clusters, jittered, height-varied, staggered ---- */
  interface Bldg {
    sprite: string;
    w: number;
    u: 1 | 2 | 3;
    x: number;
    /** M2 setback stagger — a small ± tile nudge to the row's shared baseline */
    setback?: number;
  }
  const north: Bldg[] = [
    { sprite: 'bldg_starmart', w: 5, u: 1, x: 2 + jit(2) },
    { sprite: 'bldg_brickmore', w: 5, u: 3, x: 9 + jit(2), setback: -1 },
    { sprite: 'bldg_hospital', w: 7, u: 2, x: 16 + jit(2) },
    { sprite: 'bldg_dept', w: 8, u: 2, x: 29 + jit(2), setback: 1 },
    { sprite: 'bldg_bank', w: 6, u: 2, x: 41 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 51 + jit(2), setback: -1 },
    { sprite: 'bldg_diner', w: 4, u: 1, x: 58 + jit(2) },
  ];
  for (let i = 1; i < north.length; i++) {
    // M2: the hospital→dept and video→diner junctions (i===3, i===6) each
    // reserve a 2-wide ALLEY on top of the usual 1-tile min gap, so the carved
    // slot below (rows 6-7) never clips either building's true solid footprint
    const alleySlot = i === 3 || i === 6 ? 2 : 0;
    const min = north[i - 1].x + north[i - 1].w + 1 + alleySlot;
    if (north[i].x < min) north[i].x = min;
  }
  // the true right edge of a placed facade, in TILE units — matches
  // facadeSolid's own w*16+2 formula (kit.ts), so the alley slot below is
  // derived from where the building's collision ACTUALLY ends, never a guess
  const rightEdge = (b: Bldg): number => b.x + b.w + 2 / 16;
  const alley2X = Math.ceil(rightEdge(north[2])); // hospital's true edge → alley starts clear of it
  const alley3X = Math.ceil(rightEdge(north[5])); // video's true edge → alley starts clear of it
  const midWest: Bldg[] = [
    { sprite: 'bldg_bagels', w: 4, u: 1, x: 11 + jit(2) },
    { sprite: 'bldg_arcade2', w: 5, u: 1, x: 16 + jit(3) },
  ];
  if (midWest[1].x < midWest[0].x + midWest[0].w) midWest[1].x = midWest[0].x + midWest[0].w; // touching = rowhouse
  if (midWest[1].x + midWest[1].w > 24) midWest[1].x = 24 - midWest[1].w; // stay west of the avenue
  const midEast: Bldg[] = [
    { sprite: 'bldg_diner', w: 4, u: 1, x: 29 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 35 + jit(2) },
  ];
  if (midEast[1].x < midEast[0].x + midEast[0].w) midEast[1].x = midEast[0].x + midEast[0].w;
  const south: Bldg[] = [
    { sprite: 'bldg_bagels', w: 4, u: 1, x: 30 + jit(2) },
    { sprite: 'bldg_brickmore', w: 5, u: 2, x: 37 + jit(2), setback: -1 },
    { sprite: 'bldg_diner', w: 4, u: 1, x: 46 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 53 + jit(2), setback: 1 },
    { sprite: 'bldg_bank', w: 6, u: 2, x: 61 + jit(2) },
  ];
  for (let i = 1; i < south.length; i++) {
    const min = south[i - 1].x + south[i - 1].w + 1;
    if (south[i].x < min) south[i].x = min;
  }

  const bldgProps: PropDef[] = [];
  const place = (b: Bldg, bottomPx: number): PropDef => {
    const H = cityBuildingHeight(b.u);
    const bpx = bottomPx + (b.setback ?? 0) * 16;
    const prop: PropDef = {
      sprite: b.sprite,
      x: b.x,
      y: (bpx - H) / 16,
      // the solid covers the FACADE down to the doorstep — oy:10 (was 26) so a
      // player can't walk horizontally ACROSS the upper floors (the "walk
      // through buildings at some angles" bug); the bottom stays at H-12 so the
      // door zone below it is still reachable, and depth-sort occludes a hero
      // pressed against the back, so there's no head-above-roof to see.
      solid: { ox: 0, oy: 10, w: b.w * 16 + 2, h: H - 22 },
    };
    if (b.sprite === 'bldg_dept') {
      prop.door = { ox: 44, oy: H - 14, w: 26, h: 18, to: 'dos_f1', tx: 208, ty: 234 };
    }
    // S4: STARMART opens for business (the zone reaches below the collision
    // floor, ADR-011; the return doorstep is derived from this jittered prop)
    if (b.sprite === 'bldg_starmart') {
      prop.door = { ox: 33, oy: H - 14, w: 16, h: 18, to: 'starmart_int', tx: 144, ty: 150 };
    }
    // S10: STARPORT II opens (§A10 #4's venue) — same doorAt-2 facade rect as
    // STARMART; assigning a door consumes NO rng, so the 1995 stream and the
    // whole jittered layout stay byte-identical (ADR-016's rule)
    if (b.sprite === 'bldg_arcade2') {
      prop.door = { ox: 33, oy: H - 14, w: 16, h: 18, to: 'arcade2_int', tx: 128, ty: 134 };
    }
    // S14 (Prompt 25): BRICKTON GENERAL opens — the dept's doubleDoor rect
    if (b.sprite === 'bldg_hospital') {
      prop.door = { ox: 44, oy: H - 14, w: 26, h: 18, to: 'hospital_int', tx: 152, ty: 166 };
    }
    bldgProps.push(prop);
    return prop;
  };
  north.forEach((b) => place(b, 112)); // doors open onto street A's sidewalk
  [...midWest, ...midEast].forEach((b) => place(b, 304)); // doors face street B
  south.forEach((b) => place(b, 464)); // doors face the new market street

  /* ---- scattered street life ---- */
  const trees: Array<[number, number]> = [[33, 13]]; // lone back-alley tree
  for (const [tx, ty] of [[42, 13], [49, 14], [43, 17], [51, 16], [46, 13]] as const) {
    if (rng() < 0.75) trees.push([tx, ty]);
  }
  for (const [tx, ty] of [[19, 27], [31, 28], [39, 27], [44, 28], [12, 28]] as const) {
    if (rng() < 0.6) trees.push([tx, ty]);
  }
  for (const [tx, ty] of [[63, 14], [67, 17], [36, 26], [41, 27], [8, 30], [65, 35]] as const) {
    if (rng() < 0.68) trees.push([tx, ty]);
  }

  const FURN_SOLID: Record<string, { ox: number; oy: number; w: number; h: number }> = {
    bench: { ox: 1, oy: 6, w: 20, h: 6 },
    hydrant: { ox: 2, oy: 8, w: 6, h: 5 },
    planter: { ox: 1, oy: 6, w: 20, h: 9 },
  };
  const furniture: PropDef[] = [];
  for (let fx = 18; fx <= 44; fx += 4 + jit(3)) {
    if (rng() < 0.45) continue;
    const sprite = (['bench', 'hydrant', 'planter'] as const)[jit(3)];
    furniture.push({ sprite, x: fx, y: 26, solid: FURN_SOLID[sprite] });
  }
  // the CENTER quarter's clutter, purposeful now (the service-pocket strip
  // at row 19) — but never in front of a door
  const doorCols = new Set(
    [...midWest, ...midEast].flatMap((b) => {
      const d = b.x + (b.sprite === 'bldg_arcade2' || b.sprite === 'bldg_video' ? 2 : 1);
      return [d - 1, d, d + 1];
    }),
  );
  for (const fx of [13, 22, 31, 40]) {
    if (rng() < 0.55 || doorCols.has(fx)) continue;
    const sprite = (['hydrant', 'planter'] as const)[jit(2)];
    furniture.push({ sprite, x: fx, y: 19, solid: FURN_SOLID[sprite] });
  }
  for (const fx of [30, 35, 44, 51, 57, 66]) {
    if (rng() < 0.35) continue;
    const sprite = (['bench', 'hydrant', 'planter'] as const)[jit(3)];
    furniture.push({ sprite, x: fx, y: 29, solid: FURN_SOLID[sprite] });
  }

  // alley dumpsters: the original starmart-brickmore gap + the two NEW
  // formal alleys (hospital-dept, video-diner; alley2X/alley3X computed
  // above, right after the north row's spacing) — a crate keeps each company
  const alleyX = north[0].x + north[0].w + 0.1;
  const picnicX = 44 + jit(2);

  /* ---- S7 street wear + 90s furniture (ADR-019) ----
   * A SEPARATE seeded stream: the 1995 rng above is fully consumed before
   * this point, so the original jittered layout stays byte-identical
   * (ADR-016's rule). Everything here is either walkable tile wear or a
   * prop placed with clearance checks against doors/phones/triggers. */
  const rng2 = seededRng(2077);
  const jit2 = (n: number): number => Math.floor(rng2() * n);
  // sidewalk cracks — pure tile swaps, nothing moves
  for (let y = 6; y < 37; y++) {
    for (let x = 1; x < 71; x++) {
      if (g.rows[y][x] === '=' && rng2() < 0.045) g.set(x, y, '1');
    }
  }
  // tar patches on plain road cells
  for (const [py, x0] of [
    [9, 4],
    [10, 30],
    [22, 12],
    [23, 44],
    [32, 34],
    [32, 62],
  ] as const) {
    const x = x0 + jit2(8);
    if (g.rows[py][x] === 'R') g.set(x, py, '2');
  }
  // storm drains against each curb, clear of crosswalks
  for (const x of [5 + jit2(3), 20, 33 + jit2(3), 47]) {
    if (g.rows[8][x] === 'R') g.set(x, 8, '3');
  }
  for (const x of [9 + jit2(3), 36 + jit2(3), 51]) {
    if (g.rows[21][x] === 'R') g.set(x, 21, '3');
  }
  for (const x of [31 + jit2(3), 49 + jit2(3), 64]) {
    if (g.rows[31][x] === 'R') g.set(x, 31, '3');
  }
  // M6 — a '3' storm drain at each new P-lane's curb corner (both ends)
  for (const x of [3, 12, 30, 35, 43, 52, 62, 67]) {
    if (g.rows[8][x] === 'P') g.set(x, 8, '3');
  }
  for (const x of [3, 12, 31, 38, 46, 51, 62, 67]) {
    if (g.rows[23][x] === 'P') g.set(x, 23, '3');
  }

  // telephone poles: bases on the mid-block strip and the south sidewalk so
  // the sagging spans cross each street. Visual only — no solid (S6 rule).
  const poles: PropDef[] = [];
  for (const cx of [6, 14, 22, 30, 38, 46]) {
    if (cx === 22 || cx === 30) continue; // keep the avenue mouth clear
    poles.push({ sprite: 'phone_pole', x: cx - 4.125, y: 9.125 });
  }
  for (const cx of [10, 18, 34, 42, 50]) {
    poles.push({ sprite: 'phone_pole', x: cx - 4.125, y: 22.125 });
  }
  for (const cx of [32, 44, 56, 68]) {
    poles.push({ sprite: 'phone_pole', x: cx - 4.125, y: 32.125 });
  }

  // parking meters + newspaper boxes on sidewalk B, never at a door column
  // and never on a column the S1 furniture already took
  const occupied = new Set(furniture.map((f) => `${f.x},${f.y}`));
  const meters: PropDef[] = [];
  for (const mx of [12, 21, 30, 39, 48, 57, 66]) {
    if (doorCols.has(mx) || occupied.has(`${mx},19`)) continue;
    if (rng2() < 0.3) continue;
    meters.push({ sprite: 'parking_meter', x: mx + 0.3, y: 18.6, solid: { ox: 3, oy: 14, w: 4, h: 6 } });
  }
  meters.push({ sprite: 'news_box', x: 2.5, y: 25.4, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
  const nbx = midEast[1].x + 5;
  if (!doorCols.has(nbx)) {
    meters.push({ sprite: 'news_box', x: nbx, y: 18.7, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
  }
  meters.push({ sprite: 'news_box', x: 61.5, y: 28.8, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
  // trash cans in the north alley gaps (between building solids, row 6) — the
  // two FORMAL alleys (≥1.9 wide) always dress; the smaller incidental gaps roll
  for (let i = 1; i < north.length; i++) {
    const gapStart = north[i - 1].x + north[i - 1].w + 0.2;
    const gapEnd = north[i].x;
    if (gapEnd - gapStart < 1.2) continue;
    if (gapEnd - gapStart < 1.9 && rng2() < 0.4) continue;
    meters.push({ sprite: 'trash_can', x: gapStart, y: 5.9, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
  }

  /* ---- street trees (S7e, user direction: "more trees in the cities") ----
   * EB's Twoson lines its blocks with trees. Same discipline as everything
   * above: rng2 stream (1995 layout untouched), standard tree solid, and
   * clearance from the avenue mouth, poles, doors, the payphone/bus corner,
   * and whatever the jittered furniture already claimed. */
  const streetTrees: Array<[number, number]> = [];
  const usedCols = new Set<number>();
  for (const f of [...furniture, ...meters]) {
    const fx = Math.round(f.x);
    usedCols.add(fx - 1).add(fx).add(fx + 1);
  }
  // mid-block strip between the parking lot and street B (bases on row ~12)
  for (const tx of [10, 18, 22, 30, 34, 42, 50, 62, 68]) {
    if (tx >= 24 && tx <= 28) continue; // avenue mouth
    if (rng2() < 0.2) continue;
    streetTrees.push([tx, 11]);
  }
  // south sidewalk, east of the bus/payphone corner (bases on row ~26)
  for (const tx of [20, 23, 29, 33, 37, 41, 45, 52, 63, 68]) {
    if (tx >= 24 && tx <= 28) continue; // avenue
    if (usedCols.has(tx)) continue; // S1 furniture got there first
    if (Math.abs(tx - 49) <= 1) continue; // the realtor's sign
    if (rng2() < 0.3) continue;
    streetTrees.push([tx, 24.4]);
  }
  // a couple more for the park, clear of the picnic table
  for (const [tx, ty] of [
    [47, 15],
    [41, 16],
    [52, 13],
    [63, 15],
    [67, 13],
  ] as const) {
    if (ty >= 14 && ty <= 16 && Math.abs(tx - picnicX) < 3) continue;
    if (rng2() < 0.4) continue;
    streetTrees.push([tx, ty]);
  }

  const hospital = north[2];
  const dept = north[3];
  // S4: the SAVINGS & LOAN stays locked, but its facade gains the ATM —
  // placed off the jittered bank, never hardcoded (ADR-012). Two tiles right
  // of its (locked) door, base on the sidewalk, screen against the wall.
  const bank = north[4];
  const atmX = bank.x + 4;

  // S13: the COSTA ESTRELLA travel poster — the tease (ADR-037). A FRESH rng
  // stream opened after every standing one (the ADR-016 rule, third
  // application: 1995 + 2077 stay byte-identical), jittering the poster
  // board into the bus-stop corner where travel ads live. Visual-only —
  // no solid near the payphone (the S7 discipline).
  const rng3 = seededRng(2095);
  const posterX = 11 + Math.floor(rng3() * 2);

  // THE MARKET (south lot, x34-45): three stalls crowding the walkway + a
  // couple of crates, replacing the empty grass lot the sign already pointed
  // at. Continues the SAME third stream (2095) — fully consumed above by one
  // draw, so this is just its next bytes, same discipline as every cluster.
  const marketStalls: PropDef[] = (['a', 'b', 'c'] as const).map((letter, i) => ({
    sprite: `market_stall_${letter}`,
    x: 35 + i * 3 + Math.floor(rng3() * 2),
    y: 26.4,
    solid: { ox: 1, oy: 14, w: 38, h: 14 },
  }));
  const marketCrates: PropDef[] = [
    { sprite: 'crate', x: 34.4, y: 27.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    { sprite: 'crate', x: 43.6, y: 27.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
  ];

  return {
    id: 'brickton',
    name: 'BRICKTON CITY',
    music: 'brickton',
    settlement: 'city',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      ...streetTrees.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      ...poles,
      ...bldgProps,
      { sprite: 'dumpster', x: alleyX, y: 5.4, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: alley2X, y: 5.4, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'crate', x: alley2X + 0.1, y: 6.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'dumpster', x: alley3X, y: 5.4, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'crate', x: alley3X + 0.1, y: 6.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'dumpster', x: 2, y: 11.9, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 6, y: 27.2, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 63, y: 24.6, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'atm', x: atmX, y: 5.5, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
      // bus stop corner
      { sprite: 'bus_sign', x: 7, y: 26, solid: { ox: 4, oy: 18, w: 6, h: 6 } },
      { sprite: 'bench', x: 4, y: 27, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 10, y: 27, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'payphone', x: 14, y: 26, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      // THE PARK-AS-A-ROOM: the fountain-picnic centerpiece + 2 benches facing it
      { sprite: 'picnic', x: picnicX, y: 15, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'bench', x: picnicX - 2, y: 16.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: picnicX + 3, y: 16.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      // THE CLOCK PLAZA: 2 benches facing the clock cluster + a news box
      { sprite: 'bench', x: 61, y: 16, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 64, y: 16, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'news_box', x: 67, y: 15.4, solid: { ox: 2, oy: 12, w: 12, h: 7 } },
      // THE MARKET: stalls + crates crowding the walkway
      ...marketStalls,
      ...marketCrates,
      // the lot's realtor sign, on the sidewalk where you can actually read it
      { sprite: 'sign', x: 49, y: 25, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // S14: the docks sign by the east gap (static placement, no rng)
      { sprite: 'sign', x: 68, y: 24, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 62, y: 14, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 35, y: 25, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 61, y: 28, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: dept.x + 2, y: 5.6, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // S12: the gate in the lot's fence — THE CAGE is open (no solid; the
      // door zone under it carries you through, chain hanging unlatched)
      { sprite: 'cage_gate', x: 50, y: 25.1 },
      // 2026-07-02 (user: "can't find the basketball section"): the CLOCK the
      // plaza always talked about, plus a BOUNCE-TRAIL to The Cage — a
      // backboard teaser at the gate + signs that literally point the way.
      { sprite: 'town_clock', x: 62.2, y: 12.85, solid: { ox: 5, oy: 26, w: 9, h: 6 } },
      { sprite: 'backboard', x: 48.4, y: 24.2, solid: { ox: 2, oy: 20, w: 10, h: 6 } },
      // S13: the Costa Estrella travel poster (the tease — visual-only)
      { sprite: 'poster_links', x: posterX, y: 25.4 },
      ...furniture,
      ...meters,
    ],
    npcs: [
      { id: 'nurse', sprite: 'nurse', x: hospital.x + 3, y: 6, facing: 'down', dialogue: 'npc_nurse' },
      { id: 'gray_commuter', sprite: 'grayCommuter', x: dept.x + 5, y: 6, facing: 'up', dialogue: 'npc_commuter' },
      { id: 'quarter_man', sprite: 'quarterMan', x: 15, y: 27, facing: 'left', dialogue: 'npc_quarter' },
      { id: 'pigeon_kid', sprite: 'pigeonKid', x: 44, y: 17, facing: 'down', dialogue: 'npc_pigeonkid' },
      { id: 'sidewalk_critic', sprite: 'sidewalkCritic', x: 20, y: 19, facing: 'down', dialogue: 'npc_critic', wander: true },
      { id: 'clock_lady', sprite: 'oldTimer', x: 63, y: 15, facing: 'down', dialogue: 'npc_clock_lady' },
      // the hoops kid dribbling at the gate — a walking arrow to The Cage
      { id: 'hoops_kid', sprite: 'pajamaKid', x: 49, y: 27, facing: 'up', dialogue: 'npc_hoops_kid', wander: true },
      { id: 'bagel_scout', sprite: 'pajamaKid', x: 34, y: 29, facing: 'up', dialogue: 'npc_bagel_scout', wander: true },
      { id: 'blue_watcher', sprite: 'grayCommuter', x: dept.x + 9, y: 7, facing: 'left', dialogue: 'npc_blue_watcher' },
      { id: 'bus_boy', sprite: 'pigeonKid', x: 7, y: 30, facing: 'right', dialogue: 'npc_bus_boy', wander: true },
      { id: 'plaza_mime', sprite: 'smilerB', x: 67, y: 17, facing: 'left', dialogue: 'npc_plaza_mime' },
    ],
    signs: [
      { x: 10, y: 27, dialogue: 'sign_brickton' },
      { x: 49, y: 25, dialogue: 'sign_lot' },
      // S14: the docks pointer at the east gap
      { x: 68, y: 24, dialogue: 'sign_to_docks' },
      { x: 62, y: 14, dialogue: 'sign_brickton_clock' },
      // the bounce-trail: plaza → the north gate → THE CAGE
      { x: 60, y: 14, dialogue: 'sign_to_cage_plaza' },
      { x: 48, y: 26, dialogue: 'sign_to_cage_gate' },
      { x: 35, y: 25, dialogue: 'sign_market_row' },
      { x: 61, y: 28, dialogue: 'sign_overpass' },
      { x: dept.x + 2, y: 6, dialogue: 'sign_blue_notice' },
      // S13: the travel poster reads (coords follow the jittered board)
      { x: posterX, y: 26, dialogue: 'sign_links_poster' },
    ],
    phones: [{ x: 14, y: 26 }],
    atms: [{ x: atmX, y: 5.5 }],
    doors: [
      // S12: through the gate into THE CAGE (the lot's grid coords are
      // fixed — the gate tile was carved without touching the rng streams)
      { x: 50, y: 26, w: 1, h: 1, to: 'the_cage', tx: 320, ty: 60, facing: 'down' },
      // S14: east along street B to the BRICKTON DOCKS (§A5 Ch.2's gate)
      { x: 71, y: 21, w: 1, h: 3, to: 'brickton_docks', tx: 28, ty: 120, facing: 'right' },
    ],
    spawners: [
      { enemies: ['blazer_smiler', 'showroom_mannequin'], count: 1, rect: { x: 28, y: 6, w: 12, h: 2 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 11, y: 19, w: 13, h: 2 } },
      { enemies: ['pigeon_gang', 'rogue_icecream_truck'], count: 1, rect: { x: 2, y: 13, w: 8, h: 5 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 41, y: 13, w: 12, h: 6 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 56, y: 12, w: 13, h: 7 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 3, y: 28, w: 9, h: 5 } },
      { enemies: ['cranky_mailbox', 'expired_meter'], count: 1, rect: { x: 30, y: 25, w: 16, h: 4 } },
    ],
    triggers: [
      { id: 'bus_stop_brickton', rect: { x: 4, y: 26, w: 4, h: 3 }, once: false },
      { id: 'brickton_clock_goal', rect: { x: 60, y: 13, w: 8, h: 5 }, once: false },
      { id: 'brickton_dial_goal', rect: { x: 13, y: 28, w: 5, h: 2 }, once: false },
      // S2: Mom calls the payphone (14,26) once the Department falls
      { id: 'payphone_ring', rect: { x: 12, y: 25, w: 6, h: 4 }, once: false },
    ],
  };
}

/* ------------- BRICKTON SPRAWLS (S15h, ADR-049) ------------- */

/**
 * BRICKTON ~4× (2736 → 10944 tiles, 144×76). The frozen 2077 core is COPIED
 * byte-for-byte into the top-left — every tile, every prop, the Cage, the dept,
 * the bus stop, the clock + dial flags, UNCHANGED. The forge's CITY grammar lays
 * new walled districts in the L around it (an east band + the south band), all
 * connected to downtown through the core's ONE existing opening: street B's east
 * gap (col 71, rows 21-23, already road). The single deliberate exception to
 * "byte-for-byte": the docks EXIT door relocates from that gap to the grown
 * city's NEW east edge — the port moved out with the city — so street B can flow
 * east into the sprawl instead of dead-ending at the old wall. Brickton stays a
 * `city` and clears the ADR-012 sweep AT 144×76 (the maps.test sweep runs on it).
 */
export function growBrickton(): MapDef {
  const core = buildBrickton();
  const CW = core.grid[0].length; // 72
  const CH = core.grid.length; // 38
  const W = 144;
  const H = 76;
  const g = new Grid(W, H, '=');
  // 1) the frozen 2077 core, verbatim, in the top-left (grid byte-identical)
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) g.set(x, y, core.grid[y][x]);

  // 2) the GROWN city's outer brick walls (only in the new region — never over
  //    the core). The old downtown's east + south walls become interior walls.
  g.rect(CW, 0, W - CW, 1, 'B'); // north edge, east of the core
  g.rect(W - 1, 0, 1, H, 'B'); // new east edge
  g.rect(0, CH, 1, H - CH, 'B'); // west edge, below the core
  g.rect(0, H - 1, W, 1, 'B'); // new south edge

  // 3) STREET B runs EAST out the old gap (col 71, rows 21-23 = 'R' in the core)
  //    across the new east band to the relocated docks at the far edge. A south
  //    AVENUE drops from it; two E-W streets cross the new districts (the grid
  //    law extended — the core already clears the sweep, this only adds to it).
  g.rect(CW, 21, W - CW, 3, 'R'); // street B east extension (reopens the far-edge docks gap)
  g.rect(100, 24, 3, H - 25, 'R'); // the south connector avenue (drops off street B)
  g.rect(1, 50, W - 2, 3, 'R'); // SOUTH STREET — spans the sprawl
  g.rect(1, 63, W - 2, 3, 'R'); // MAPLE STREET — the brick rows back onto it
  g.rect(29, 53, 3, H - 53, 'R'); // the SOUTH GATEWAY road, down to the city line

  // 4) crosswalks where the avenue meets the new streets, dashed centerlines
  for (const sy of [50, 63]) {
    g.rect(98, sy, 2, 3, 'X');
    g.rect(103, sy, 2, 3, 'X');
    for (let x = 2; x < W - 2; x++) if (x % 4 < 2 && (x < 98 || x > 104)) g.set(x, sy + 1, 'D');
  }

  // 5) NEGATIVE SPACE (§B4): an irregular plaza-park east of the avenue, corners
  //    nibbled so it never reads as a rectangle; a parking lot west of it.
  g.rect(108, 30, 16, 10, '.');
  g.rect(108, 30, 3 + (CW % 4), 1, '=');
  g.rect(120, 39, 4, 1, '=');
  // the plaza-park becomes a ROOM too (M3/M4): a ':' inner loop around its
  // centerpiece, so it reads the same "park you walk a lap of" language as
  // the core's own park quarter
  g.rect(111, 32, 10, 1, ':'); g.rect(111, 37, 10, 1, ':'); // loop N/S legs
  g.rect(111, 32, 1, 6, ':'); g.rect(120, 32, 1, 6, ':'); // loop E/W legs
  g.rect(74, 56, 9, 6, 'P');
  // grass fuzz on the new park cells ONLY — a region-bounded sprinkle that skips
  // the frozen core (the core HAS '.' park cells; the global Grid.sprinkle would
  // corrupt them, so we guard x≥CW || y≥CH explicitly)
  const fuzz = seededRng(2077144);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < CW && y < CH) continue; // never touch the 2077 core
      if (g.rows[y][x] === '.' && fuzz() < 0.08) g.set(x, y, ',~ff F'[Math.floor(fuzz() * 6)]);
    }
  }
  // M6 — the wear pass extended into the grown streets/sidewalks: a FRESH
  // named stream (2077145, adjacent to the fuzz seed above but isolated), so
  // it can never disturb the fuzz sequence or anything upstream. Region-
  // guarded exactly like the fuzz pass — the frozen core never sees it.
  const wear = seededRng(2077145);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < CW && y < CH) continue; // never touch the 2077 core
      const ch = g.rows[y][x];
      if (ch === '=' && wear() < 0.04) g.set(x, y, '1');
      else if (ch === 'R' && wear() < 0.02) g.set(x, y, '2');
    }
  }

  // 6) THE FORGE lays the blocks — now in BRICKTON's OWN cool skins (ADR-050):
  //    glass offices / hotels / neon / theaters + the COMMON mega-towers (their
  //    tops run off the screen). Drawn art stays a hand job (ADR-020); the skins
  //    are the deterministic catalog, sliced per-area so Brickton ≠ Otterbrook.
  // ADR-053: shared footprint list so the spacing law spans every district.
  const bkOccupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const skin = AREA_SKINS.brickton;
  const eastNorth = buildDistrict(g, { x: 74, y: 2, w: 66, h: 17 }, new Streams(207701), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [9], avenueCols: [120], maxStories: 3, occupied: bkOccupied,
  });
  // THE HIGH-RISE DOWNTOWN (ADR-054): a tall open block west of the avenue where
  // the MEGA PASS stands the u12–13 towers — mega-buildings are COMMON here, their
  // tops climbing off the top of the screen, shorter glass storefronts in the gaps.
  const downtownHigh = buildDistrict(g, { x: 74, y: 24, w: 26, h: 25 }, new Streams(207704), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [47], maxStories: 9, mega: true, occupied: bkOccupied,
  });
  // eastSouth narrowed to col 124 so the far-east blocks clear for the colossus
  const eastSouth = buildDistrict(g, { x: 104, y: 41, w: 21, h: 8 }, new Streams(207702), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [44], maxStories: 3, occupied: bkOccupied,
  });
  const southWest = buildDistrict(g, { x: 2, y: 38, w: 70, h: 10 }, new Streams(207703), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [44], avenueCols: [40], maxStories: 3, occupied: bkOccupied,
  });

  // 7) MAPLE HEIGHTS — a hand-built brick row backing onto Maple Street (the
  //    named residential block the growth advertises), + the catalog storefronts.
  // M2: the 5 houses restagger to an uneven rhythm (was a flat +7 baseline) —
  // same count, same sprite, just less of a ruler-straight row. Each front
  // yard gets a fence run with a gate gap (the door's own column stays clear)
  // and a tree fills the wider gaps between houses (M2's "one tree per lot pair").
  const mapleXs = [6, 14, 21, 29, 36];
  const mapleProps: PropDef[] = [];
  const mapleTrees: PropDef[] = [];
  for (let i = 0; i < mapleXs.length; i++) {
    const mx = mapleXs[i];
    mapleProps.push(placeFacade('bldg_brickmore', mx, 62 * 16 - 4, 5, 2));
    // yard fence along the house's own frontage — row 62 (the doorstep's
    // landing sits at ~y60.4-61.75, so row 62 is the first fully-clear row
    // south of it, one row shy of Maple Street at row 63), gapped at the
    // door's center column (a 5-wide facade's door sits mid-span, mx+2..+3)
    g.rect(mx, 62, 2, 1, '-');
    g.rect(mx + 3, 62, 2, 1, '-');
    if (i < mapleXs.length - 1) {
      const gapStart = mx + 5;
      const gapEnd = mapleXs[i + 1];
      if (gapEnd - gapStart >= 2) {
        const tx = gapStart + Math.floor((gapEnd - gapStart) / 2);
        mapleTrees.push({ sprite: treeSprite(tx, 60), x: tx, y: 60, solid: { ox: 7, oy: 22, w: 12, h: 10 } });
      }
    }
  }

  // THE COLOSSUS LANDMARK (§B4): STARFALL SPIRE — a sky-tower whose footprint
  // spans a slice of the far-east blocks; you ROUND it on foot (lanes at col 125
  // west + cols 141–142 east). It backs onto Maple Street and climbs off-screen.
  // Hand-placed beyond the narrowed eastSouth so nothing it shadows is required.
  // Its centered gilt doors open into the bespoke LOBBY (lobby access ONLY — the
  // sign-canon holds: nobody goes up). Grafted here, pre-occupy, so occupyCity's
  // `!p.door` filter never hands the landmark a generic unit room.
  const spire = placeFacade('bldg_colossus_spire', 126, 63 * 16 - 4, 14, 30, { to: 'spire_lobby', tx: 152, ty: 156 });
  // the spire's own FORECOURT (M4 anchor): a paved apron at its base, west of
  // its footprint (clear of the lanes at col125/141-142), 2 planters + a
  // bench for spire_gazer to actually stand on
  const spireForecourt: PropDef[] = [
    { sprite: 'planter', x: 120.5, y: 57, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'planter', x: 120.5, y: 59, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'bench', x: 122.5, y: 58, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
  ];
  g.rect(120, 56, 5, 5, '='); // the apron itself, in front of the spire

  // THE PLAZA-PARK (§5 above) gets its centerpiece: 3 trees + 2 benches
  // facing inward, on the ':' loop's inner grass — the same "room with a
  // reason to enter" language as the core's park quarter
  const plazaTrees: PropDef[] = [[113, 34], [118, 35], [115, 36]].map(([x, y]) => ({
    sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 },
  }));
  const plazaBenches: PropDef[] = [
    { sprite: 'bench', x: 114, y: 33.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: 117, y: 36.5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
  ];

  // THE PARKING LOT (§5 above, x74-82/y56-61) gets a meter row along its
  // north curb, same canon parking_meter solid the core uses
  const lotMeters: PropDef[] = [76, 78, 80].map((x) => ({
    sprite: 'parking_meter', x: x + 0.3, y: 55.6, solid: { ox: 3, oy: 14, w: 4, h: 6 },
  }));

  // HYDRANTS at the south-street corners (M5 cadence: "hydrant near each
  // downtown corner") — South Street × the avenue, and × the gateway road
  const hydrants: PropDef[] = [
    { sprite: 'hydrant', x: 97, y: 49, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
    { sprite: 'hydrant', x: 105, y: 49, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
    { sprite: 'hydrant', x: 28, y: 52, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
    { sprite: 'hydrant', x: 32, y: 52, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
  ];

  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  const props: PropDef[] = [
    ...core.props,
    ...eastNorth.props,
    ...downtownHigh.props,
    ...eastSouth.props,
    ...southWest.props,
    ...mapleProps,
    ...mapleTrees,
    spire,
    ...spireForecourt,
    ...plazaTrees,
    ...plazaBenches,
    ...lotMeters,
    ...hydrants,
    { sprite: 'sign', x: 8, y: 60, solid: SIGN_SOLID }, // MAPLE HEIGHTS marker
    { sprite: 'sign', x: 47, y: 48, solid: SIGN_SOLID }, // the Cage block, read from the new street
    { sprite: 'sign', x: 31, y: 70, solid: SIGN_SOLID }, // the south gateway / city line
    { sprite: 'sign', x: 138, y: 24, solid: SIGN_SOLID }, // to the relocated docks
    { sprite: 'sign', x: 124, y: 56, solid: SIGN_SOLID }, // the Starfall Spire plaza
    { sprite: 'sign', x: 86, y: 49, solid: SIGN_SOLID }, // the high-rise downtown
    // a rest point before the new south field's pressure (§A4.5) — a payphone,
    // NOT a picnic (the picnic-count pin holds: Brickton keeps exactly one)
    { sprite: 'payphone', x: 33, y: 67, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
  ];

  const npcs = [
    ...core.npcs,
    { id: 'maple_resident', sprite: 'fernLady', x: 12, y: 60, facing: 'down' as const, dialogue: 'npc_maple_resident', wander: true },
    { id: 'south_vendor', sprite: 'quarterMan', x: 60, y: 49, facing: 'down' as const, dialogue: 'npc_south_vendor' },
    { id: 'new_commuter', sprite: 'grayCommuter', x: 110, y: 22, facing: 'right' as const, dialogue: 'npc_new_commuter', wander: true },
    { id: 'dockward', sprite: 'sidewalkCritic', x: 132, y: 22, facing: 'right' as const, dialogue: 'npc_dockward' },
    // S15i (ADR-054): the high-rise downtown + the colossus each get a voice (§A11)
    { id: 'spire_gazer', sprite: 'sidewalkCritic', x: 123, y: 57, facing: 'right' as const, dialogue: 'npc_spire_gazer' },
    { id: 'downtown_suit', sprite: 'grayCommuter', x: 86, y: 48, facing: 'up' as const, dialogue: 'npc_downtown_suit', wander: true },
  ];

  const keptDoors = core.doors.filter((d) => d.to !== 'brickton_docks');
  return {
    ...core,
    grid: g.out(),
    props,
    npcs,
    signs: [
      ...core.signs,
      { x: 8, y: 60, dialogue: 'sign_maple_heights' },
      { x: 47, y: 48, dialogue: 'sign_cage_block' },
      { x: 31, y: 70, dialogue: 'sign_south_gate' },
      { x: 138, y: 24, dialogue: 'sign_new_docks' },
      { x: 124, y: 56, dialogue: 'sign_spire' },
      { x: 86, y: 49, dialogue: 'sign_downtown_high' },
      ...eastNorth.signs,
      ...downtownHigh.signs,
      ...eastSouth.signs,
      ...southWest.signs,
    ],
    phones: [...core.phones, { x: 33, y: 67 }],
    doors: [
      ...keptDoors, // the_cage gate stays byte-identical; the old docks-gap door is relocated ↓
      { x: W - 1, y: 21, w: 1, h: 3, to: 'brickton_docks', tx: 28, ty: 120, facing: 'right' },
      { x: 29, y: H - 1, w: 3, h: 1, to: 'meadow_mile', tx: 544, ty: 128, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      ...core.spawners,
      // the new districts run a city band too (clear of the gateway + fixtures)
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 108, y: 32, w: 14, h: 6 } },
      { enemies: ['pigeon_gang', 'expired_meter'], count: 1, rect: { x: 10, y: 40, w: 20, h: 6 } },
    ],
  };
}

/* ------------------- THE DEPARTMENT OF SMILES ------------------- */

function buildDosF1(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(26, 16, 'o');
  g.rect(0, 0, 26, 2, 'O');
  g.rect(0, 0, 1, 16, 'O');
  g.rect(25, 0, 1, 16, 'O');
  g.rect(0, 15, 26, 1, 'O');
  g.set(12, 15, 'o'); // street door gap
  g.set(13, 15, 'o');
  // two welcome pods of cubicles
  g.rect(3, 5, 6, 1, 'c');
  g.rect(3, 6, 6, 1, 'k');
  g.rect(3, 9, 6, 1, 'c');
  g.rect(3, 10, 6, 1, 'k');
  g.rect(17, 8, 5, 1, 'c');
  g.rect(17, 9, 5, 1, 'k');

  return {
    id: 'dos_f1',
    name: 'DEPT. OF SMILES — LOBBY',
    music: 'department',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 10, y: 4, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'plant_pot', x: 2, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 19, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7: the lobby sets the tone (§A11) — wall-mounted, no new solids
      { sprite: 'banner_productive', x: 7, y: 0.55 },
      { sprite: 'poster_smile', x: 17, y: 0.55 },
    ],
    npcs: [
      { id: 'receptionist', sprite: 'smilerB', x: 14, y: 5, facing: 'down', dialogue: 'npc_receptionist' },
    ],
    signs: [
      { x: 8, y: 1, dialogue: 'dos_lobby' },
      { x: 20, y: 1, dialogue: 'dos_cert' },
    ],
    phones: [],
    doors: [
      { x: 12, y: 15, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 22, y: 2, w: 2, h: 1, to: 'dos_f2', tx: 368, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
    // route stays clear of the entrance — nobody gets jumped on the doormat
    patrols: [{ id: 'f1a', enemy: 'blazer_smiler', route: [[4, 10.5], [21, 10.5]] }],
  };
}

function buildDosF2(): MapDef {
  const g = new Grid(30, 22, 'o');
  g.rect(0, 0, 30, 2, 'O');
  g.rect(0, 0, 1, 22, 'O');
  g.rect(29, 0, 1, 22, 'O');
  g.rect(0, 21, 30, 1, 'O');
  // break room (picnic table inside, per §A4.5 — the table before the climb)
  g.rect(1, 5, 8, 1, 'O');
  g.set(4, 5, 'o');
  g.set(5, 5, 'o');
  g.rect(8, 2, 1, 4, 'O');
  // the cubicle maze: three offset bank rows
  g.rect(3, 8, 11, 1, 'c');
  g.rect(3, 9, 11, 1, 'k');
  g.rect(16, 8, 11, 1, 'c');
  g.rect(16, 9, 11, 1, 'k');
  g.rect(3, 12, 7, 1, 'c');
  g.rect(3, 13, 7, 1, 'k');
  g.rect(12, 12, 15, 1, 'c');
  g.rect(12, 13, 15, 1, 'k');
  g.rect(3, 16, 17, 1, 'c');
  g.rect(3, 17, 17, 1, 'k');
  g.rect(22, 16, 5, 1, 'c');
  g.rect(22, 17, 5, 1, 'k');

  return {
    id: 'dos_f2',
    name: 'DEPT. OF SMILES — FLOOR 2',
    music: 'department',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'picnic', x: 2, y: 2, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'copier', x: 10, y: 2, solid: { ox: 1, oy: 6, w: 22, h: 11 } },
      { sprite: 'plant_pot', x: 25, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'water_cooler', x: 27, y: 17, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'plant_pot', x: 1, y: 18, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7 wall decor over the memo spots (§A11 voice lives in the signs)
      { sprite: 'poster_smile', x: 12, y: 0.55 },
      { sprite: 'poster_chart', x: 18, y: 0.55 },
    ],
    npcs: [],
    signs: [
      { x: 3, y: 1, dialogue: 'dos_breakroom' },
      { x: 12, y: 1, dialogue: 'dos_memo1' },
      { x: 18, y: 1, dialogue: 'dos_memo2' },
    ],
    phones: [],
    doors: [
      { x: 22, y: 2, w: 2, h: 1, to: 'dos_f1', tx: 368, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 27, y: 2, w: 1, h: 1, to: 'dos_f3', tx: 392, ty: 60, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [{ enemies: ['blazer_smiler', 'mandatory_memo', 'motivational_poster', 'quota_clock', 'the_suit'], count: 1, rect: { x: 3, y: 18, w: 24, h: 3 } }],
    triggers: [],
    patrols: [
      { id: 'f2a', enemy: 'blazer_smiler', route: [[4, 10], [25, 10]] },
      { id: 'f2b', enemy: 'blazer_smiler', route: [[25, 14], [4, 14]] },
    ],
  };
}

/** the sealed HOLDING ROOM block on floor 3 (S2: x18-23, y2-6) */
export const HOLDING_ROOM = { x: 18, y: 2, w: 6, h: 5 } as const;
/** doorway cells in the room's bottom rim, under the holding_door prop */
export const HOLDING_DOOR_GAP = { x: 20, w: 2 } as const;

/**
 * S2: once the PRODUCTIVITY LOCK's quota is met (flag `holding_open`), the
 * scene un-walls the room at build time — interior floor plus the doorway
 * gap — without ever mutating the shared MapDef grid (ADR-012 determinism).
 */
export function carveHoldingRoom(grid: string[]): string[] {
  const rows = grid.map((r) => r.split(''));
  const { x, y, w, h } = HOLDING_ROOM;
  for (let j = y + 1; j < y + h - 1; j++) {
    for (let i = x + 1; i < x + w - 1; i++) rows[j][i] = 'o';
  }
  for (let i = HOLDING_DOOR_GAP.x; i < HOLDING_DOOR_GAP.x + HOLDING_DOOR_GAP.w; i++) {
    rows[y + h - 1][i] = 'o';
  }
  return rows.map((r) => r.join(''));
}

function buildDosF3(): MapDef {
  const g = new Grid(26, 14, 'o');
  g.rect(0, 0, 26, 2, 'O');
  g.rect(0, 0, 1, 14, 'O');
  g.rect(25, 0, 1, 14, 'O');
  g.rect(0, 13, 26, 1, 'O');
  // the sealed HOLDING ROOM (S2 opens it: three Smilers' worth of quota)
  g.rect(HOLDING_ROOM.x, HOLDING_ROOM.y, HOLDING_ROOM.w, HOLDING_ROOM.h, 'O');
  // management cubicles (fewer, somehow worse)
  g.rect(3, 3, 6, 1, 'c');
  g.rect(3, 4, 6, 1, 'k');
  g.rect(11, 3, 5, 1, 'c');
  g.rect(11, 4, 5, 1, 'k');
  // executive runner
  g.rect(2, 8, 21, 1, 'r');
  g.rect(6, 10, 14, 1, 'c');
  g.rect(6, 11, 14, 1, 'k');

  return {
    id: 'dos_f3',
    name: 'DEPT. OF SMILES — FLOOR 3',
    music: 'department',
    interior: true,
    grid: g.out(),
    props: [
      // scene-interpreted (ADR-014): pips light per quota flag; opens into the panel
      { sprite: 'holding_door', x: 20.375, y: 5.25, solid: { ox: 0, oy: 14, w: 20, h: 14 } },
      { sprite: 'office_door', x: 10.5, y: 0.375, solid: { ox: 0, oy: 12, w: 16, h: 14 } },
      { sprite: 'plant_pot', x: 2, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 23, y: 7, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7 wall decor — management believes in you
      { sprite: 'poster_chart', x: 14, y: 0.55 },
      { sprite: 'poster_smile', x: 7, y: 0.55 },
      // inside the holding room, visible once it opens
      { sprite: 'cot', x: 19, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 }, ifFlag: 'holding_open' },
    ],
    npcs: [
      // §A6: MIA waits in the holding room until she joins (S2)
      {
        id: 'faye',
        sprite: 'faye',
        x: 21,
        y: 3,
        facing: 'down',
        dialogue: 'npc_faye_wait',
        ifFlag: 'holding_open',
        unlessFlag: 'faye_joined',
      },
    ],
    signs: [
      { x: 7, y: 1, dialogue: 'dos_quiet' },
      { x: 14, y: 1, dialogue: 'dos_memo3' },
      // the intake clipboard hangs off the cot
      { x: 19, y: 3, dialogue: 'holding_log' },
    ],
    phones: [],
    doors: [
      { x: 24, y: 2, w: 1, h: 1, to: 'dos_f2', tx: 440, ty: 60, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [
      // inside the opened room — Mia's join scene
      { id: 'faye_meet', rect: { x: 19, y: 3, w: 4, h: 3 }, once: false },
      // the column below the stairs: the Manager's exit interview
      { id: 'manager_block', rect: { x: 24, y: 3, w: 1, h: 2 }, once: false },
    ],
    patrols: [
      { id: 'f3a', enemy: 'blazer_smiler', route: [[3, 6], [16, 6]], countFlag: 'dos_quota_f3a' },
      { id: 'f3b', enemy: 'blazer_smiler', route: [[23, 8], [2, 8]], countFlag: 'dos_quota_f3b' },
      { id: 'f3c', enemy: 'blazer_smiler', route: [[2, 11.5], [23, 11.5]], sight: 6, countFlag: 'dos_quota_f3c' },
    ],
  };
}

/** THE SPIRE — LOBBY. The colossus finally opens… eighteen tiles of it. Marble
 *  desk, palms, a runner, and a sealed elevator: the §A11 gag is that Brickton's
 *  tallest building has the city's smallest public interior. Canon stays intact
 *  (sign_spire: deck closed forever; the gazer: nobody goes through) — you can
 *  come IN, you just can't go UP. */
function buildSpireLobby(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(18, 11, 'o');
  g.rect(0, 0, 18, 2, 'O');
  g.rect(8, 4, 2, 7, 'r'); // the runner, desk to doors (the Gran Hotel idiom)
  return {
    id: 'spire_lobby',
    name: 'THE SPIRE — LOBBY',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      // the marble front desk, centered under the tower's axis
      { sprite: 'lobby_desk', x: 8, y: 2.6, solid: { ox: 0, oy: 12, w: 34, h: 12 } },
      { sprite: 'potted_palm', x: 6, y: 2.2, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'potted_palm', x: 11.2, y: 2.2, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'potted_palm', x: 1.4, y: 8.4, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'potted_palm', x: 15.6, y: 8.4, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'floor_lamp', x: 3.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 14.2, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      // the waiting lounge nobody is ever called from
      { sprite: 'bench', x: 2.5, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 2.5, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [
      { id: 'spire_concierge', sprite: 'grayCommuter', x: 9, y: 2, facing: 'down', dialogue: 'npc_spire_concierge', idle: true },
      { id: 'spire_lounger', sprite: 'oldTimer', x: 3, y: 6, facing: 'right', dialogue: 'npc_spire_lounger', idle: true },
    ],
    signs: [
      { x: 4, y: 1, dialogue: 'spire_directory' },
      { x: 13, y: 1, dialogue: 'spire_elevator' }, // the sealed car (no zone — it does not open)
    ],
    phones: [],
    doors: [
      { x: 8, y: 10, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- SHOP INTERIORS (S4, Bible Prompt 20) ------------------- */

/**
 * OTTERBROOK DRUG — the town drugstore, open now that the sky calmed down.
 * ADR-004 grid interior floating in void; the keeper knows every expiration
 * date by heart (§A11). Talking to him opens the buy/sell flow (NpcDef.shop).
 */
function buildDrugstoreInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'drugstore_int',
    name: 'OTTERBROOK DRUG',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf', x: 1, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      // S7: the Star Cola case hums against the back wall
      { sprite: 'cola_fridge', x: 7.4, y: 0.25 },
      // the user's decree: every shop carries an ATM (cash) + a payphone (save)
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      {
        id: 'drug_clerk',
        sprite: 'drugClerk',
        x: 5,
        y: 2,
        facing: 'down',
        dialogue: 'shop_drug_greet',
        shop: 'drugstore',
      },
      // S9 §A10 #1: the trail's end — Biscuit, parked at the corn dog shelf
      // (3rd screen of the sniff trail; talking to him sends him zooming home)
      {
        id: 'biscuit_drug',
        sprite: 'dog',
        x: 8,
        y: 5,
        facing: 'right',
        dialogue: 'npc_biscuit_drug',
        dog: true,
        ifFlag: 'q_biscuit_c2',
        unlessFlag: 'q_biscuit_c3',
      },
      // S17 M18 Part B (§A4.5, ADR-063): Ch.1's deli — the drugstore's
      // soda-fountain lunch counter. Crafts a FAMILY BASKET from three foods,
      // so the Americas' Ch.1 foods have a counter that packs them (Ch.2's
      // Mercado deli was the only one before). Stands at the back fountain.
      {
        id: 'deli_otter',
        sprite: 'deliKeeper',
        x: 8,
        y: 2,
        facing: 'down',
        dialogue: 'npc_deli_otter',
      },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_drug_wall' }],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * SHOP STUB (World Overhaul S5, Ch.1) — a minimal enterable shell for the newly
 * authored Otterbrooke storefronts (BANK / BAKERY / BURGER). Furniture + a SAVE
 * payphone + an ATM + the street exit, so the facade doors have real, savable
 * targets in the town-assembly slice. The bespoke multi-room dress + keepers +
 * the bank's fortune-arc / bakery / burger mechanics land in the interiors slice
 * (docs/OTTERBROOK_INTERIOR_MANIFEST.md §2.2-2.4). Grows to 16×11 via ROOMY_INTERIORS.
 */
function buildShopStub(id: string, name: string, streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id,
    name,
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf', x: 1, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'cola_fridge', x: 7.4, y: 0.25 },
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [],
    signs: [],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * THE TRANSIT DEPOT (S22, ADR-114; expanded 2026-07-02) — the bus stop is a real,
 * BUSTLING building now. Three zones off an open concourse: a TICKET OFFICE alcove
 * (left, the clerk's window), the WAITING HALL (centre — the big departure board +
 * two bench rows), and a NEWSSTAND (right — cola case, papers, a vendor), worked by
 * a small crowd of travellers. Boarding still fires at the ticket window (the
 * depot_board trigger → busAsk), so the §A6 flow is untouched.
 *
 * ENTRY: the player still arrives at the NW corner (the town map's unchanged
 * busDepot door tx/ty = 120,128 → tile ~1.9,2), kept clear as an open vestibule
 * with the ticket window just to its right; the south door (tile 8,12) leads back
 * to the street. Enter NW / exit S mirrors the original depot's layout.
 */
function buildBusDepotInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(19, 13, 'w');
  g.rect(0, 0, 19, 2, 'W'); // back wall band
  g.rect(6, 2, 1, 4, 'W'); // vestibule+ticket / hall partition (open below y6)
  g.rect(13, 2, 1, 4, 'W'); // hall / newsstand partition (open below y6)
  return {
    id: 'bus_depot_int',
    name: 'OTTERBROOK TRANSIT',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // TICKET OFFICE (left; the NW corner x0-2 stays clear as the arrival vestibule)
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      // WAITING HALL (centre): the departure board + two bench rows + greenery
      { sprite: 'departure_board', x: 9, y: 2 },
      { sprite: 'bench', x: 7, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 9, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 11, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 11, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'plant_pot', x: 12, y: 3 },
      { sprite: 'trash_can', x: 12, y: 10, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      // NEWSSTAND (right alcove): cola case, counter, papers, a little greenery
      { sprite: 'cola_fridge', x: 14, y: 0.25 },
      { sprite: 'counter', x: 15, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 16, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'news_box', x: 18, y: 4, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'plant_pot', x: 18, y: 7 },
      // CONCOURSE: a payphone to save (Call Dad) + an ATM for fare money
      { sprite: 'payphone', x: 1, y: 11, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 17, y: 11, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      // the clerk keeps her window (existing dialogue); the crowd is new
      { id: 'depot_clerk', sprite: 'npc_depot_clerk', x: 4, y: 2, facing: 'down', dialogue: 'npc_depot_clerk', dialogueDay: 'npc_depot_clerk_day', idle: true },
      { id: 'depot_board_reader', sprite: 'quarterMan', x: 9, y: 3, facing: 'up', dialogue: 'npc_depot_board', idle: true, emote: 'think' },
      { id: 'depot_commuter_a', sprite: 'grayCommuter', x: 7, y: 7, facing: 'up', dialogue: 'npc_depot_commuter_a', idle: true, emote: 'think' },
      { id: 'depot_traveler', sprite: 'senora', x: 11, y: 7, facing: 'left', dialogue: 'npc_depot_traveler', idle: true },
      { id: 'depot_napper', sprite: 'oldTimer', x: 7, y: 9, facing: 'up', dialogue: 'npc_depot_napper', idle: true },
      { id: 'depot_commuter_b', sprite: 'grayCommuter', x: 11, y: 9, facing: 'up', dialogue: 'npc_depot_commuter_b', wander: true },
      { id: 'depot_kid', sprite: 'pigeonKid', x: 16, y: 6, facing: 'up', dialogue: 'npc_depot_kid', wander: true },
      { id: 'depot_vendor', sprite: 'fernLady', x: 15, y: 2, facing: 'down', dialogue: 'npc_depot_vendor', idle: true },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_bus_depot' }],
    phones: [{ x: 1, y: 11 }],
    atms: [{ x: 17, y: 11 }],
    doors: [
      { x: 8, y: 12, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    // boarding lives at the ticket window (depot_board → busAsk, same §A6 gating)
    triggers: [{ id: 'depot_board', rect: { x: 3, y: 4, w: 3, h: 1 }, once: false }],
  };
}

/* ------------------- DOWNTOWN OTTERBROOK (S22, ADR-116) -------------------
 * "Main & Vine" — a small commercial screen reached from the open pocket by the
 * Transit Depot. Two enterable shops (Hodgkin's Hardware + the Sunny Side Diner)
 * plus a flavor barbershop. Full new screen, so no frozen-core conflict; the
 * entrance façade is APPENDED to the grown town (below). Gray-boxed on shipped
 * facade/interior sprites — see docs/CH1_ART_PROMPTS.md (§2/§3) for the art pass.
 */
function buildDowntownOtterbrook(entryStreetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(28, 16);
  g.sprinkle(229, ',~ f', 0.05);
  g.rect(2, 9, 24, 2, '='); // the shopfront sidewalk
  g.rect(12, 10, 3, 6, '='); // the walk down to the way home (south edge)

  const hardware = placeFacade('bldg_brickmore', 3, 8 * 16, 5, 2, { to: 'hardware_int', tx: 120, ty: 128 });
  const diner = placeFacade('bldg_brickmore', 11, 8 * 16, 5, 2, { to: 'diner_int', tx: 120, ty: 128 });
  // S22 (ADR-120): the third shopfront is the OTTERBROOK CLINIC — the starting
  // town finally has a front-desk revive (and a back exam room), small-town scale.
  const clinic = placeFacade('bldg_brickmore', 19, 8 * 16, 5, 2, { to: 'otter_clinic_int', tx: 120, ty: 128 });

  const treeLine: Array<[number, number]> = [];
  for (let x = 0; x < 28; x += 2) treeLine.push([x, 15]);
  for (let y = 1; y < 15; y += 2) {
    treeLine.push([0, y]);
    treeLine.push([26, y]);
  }

  return {
    id: 'downtown_otterbrook',
    name: 'DOWNTOWN OTTERBROOK',
    music: 'otterbrook',
    grid: g.out(),
    props: [
      ...treeLine.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK })),
      hardware,
      diner,
      clinic,
      { sprite: 'bench', x: 16, y: 11, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 9, y: 8, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // the district plaque
      { sprite: 'sign', x: 24, y: 8, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // the clinic shingle
    ],
    npcs: [
      { id: 'downtown_loiterer', sprite: 'oldTimer', x: 18, y: 11, facing: 'down', dialogue: 'npc_pajama_day', wander: true, ifFlag: 'zapper_done' },
    ],
    signs: [
      { x: 9, y: 8, dialogue: 'sign_downtown' },
      { x: 24, y: 8, dialogue: 'sign_clinic' },
    ],
    phones: [],
    doors: [
      { x: 12, y: 15, w: 3, h: 1, to: 'otterbrook', tx: entryStreetExit.tx, ty: entryStreetExit.ty, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** HODGKIN'S HARDWARE interior (S22, ADR-116) — pegboard walls, a lockbox
 *  counter, and Hodgkin himself. The night-chain's key shop (Trail Key) lands
 *  here in a later movement; for now it's a warm, browsable room. */
function buildHardwareInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'hardware_int',
    name: "HODGKIN'S HARDWARE",
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 1, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 7, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      { id: 'hodgkin', sprite: 'npc_hodgkin', x: 6, y: 2, facing: 'down', dialogue: 'npc_hodgkin', idle: true },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_hardware' }],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'downtown_otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE SUNNY SIDE DINER interior (S22, ADR-116) — counter stools, a booth, a
 *  pie case, and a waitress who feeds tired kids. (The §A4.5 Family Basket deli
 *  stays at the drugstore fountain; this is heart, not a counter.) */
function buildDinerInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'diner_int',
    name: 'THE SUNNY SIDE',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // the authored SUNNY SIDE set (booth/jukebox strip): counter-with-stools +
      // pie case run the north line; window booths take the walls; the jukebox
      // holds the NE corner. Coords use the GROWN 16×11 room (ROOMY_INTERIORS).
      { sprite: 'prop_counter_stools', x: 2.6, y: 2.8, solid: { ox: 0, oy: 8, w: 50, h: 12 } },
      { sprite: 'prop_pie_case', x: 6.2, y: 2.8, solid: { ox: 1, oy: 8, w: 28, h: 12 } },
      { sprite: 'cola_fridge', x: 10.4, y: 0.25 },
      { sprite: 'prop_jukebox', x: 12.6, y: 1.7, solid: { ox: 2, oy: 24, w: 18, h: 10 } },
      { sprite: 'prop_booth', x: 1, y: 4.8, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 12.8, y: 4.8, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 12.8, y: 7.2, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'diner_waitress', sprite: 'npc_waitress', x: 6, y: 2, facing: 'down', dialogue: 'npc_waitress', idle: true },
    ],
    signs: [
      { x: 9, y: 1, dialogue: 'sign_diner' },
      { x: 13, y: 3, dialogue: 'diner_jukebox' }, // read the jukebox front
    ],
    phones: [{ x: 2, y: 7 }],
    atms: [],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'downtown_otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE OTTERBROOK CLINIC — front desk (S22, ADR-120). Small-town scale: a
 *  reception counter with the doc (front-desk revive, the §A4.7 pay-to-wake
 *  flow), a couple of waiting chairs, a save payphone, and a back door to the
 *  EXAM ROOM — the "multiple rooms / multiple doors" shape, town-sized. */
function buildOtterClinicInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(14, 10, 'w');
  g.rect(0, 0, 14, 2, 'W');
  return {
    id: 'otter_clinic_int',
    name: 'OTTERBROOK CLINIC',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'bench', x: 2, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'plant_pot', x: 9, y: 6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'payphone', x: 12, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'doc_otter', sprite: 'docBrickton', x: 4, y: 2, facing: 'down', dialogue: 'npc_doc_otter', idle: true },
    ],
    signs: [{ x: 8, y: 1, dialogue: 'clinic_wall' }],
    phones: [{ x: 12, y: 7 }],
    doors: [
      { x: 6, y: 9, w: 2, h: 1, to: 'downtown_otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // the back door to the EXAM ROOM (a second enterable room)
      { x: 11, y: 2, w: 1, h: 1, to: 'otter_clinic_exam', tx: 48, ty: 64, facing: 'down', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE OTTERBROOK CLINIC — exam room (S22, ADR-120). A cot, a privacy curtain,
 *  one nervous patient, and the door back to the front desk. */
function buildOtterClinicExam(): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  return {
    id: 'otter_clinic_exam',
    name: 'OTTERBROOK CLINIC — EXAM',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'cot', x: 6, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 9, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'water_cooler', x: 1, y: 5.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'poster_chart', x: 4, y: 0.55 },
    ],
    npcs: [
      { id: 'clinic_patient', sprite: 'pajamaKid', x: 7, y: 4, facing: 'down', dialogue: 'npc_clinic_patient', idle: true, emote: 'think' },
    ],
    signs: [{ x: 3, y: 1, dialogue: 'clinic_exam_sign' }],
    phones: [],
    doors: [
      { x: 2, y: 2, w: 1, h: 1, to: 'otter_clinic_int', tx: 184, ty: 64, facing: 'down', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * STARMART — Brickton's 24-nonconsecutive-hour mart. Staggered aisles, a
 * keeper who counts the carts, and the §A8 Ch.1 stock incl. Star Cola.
 */
function buildStarmartInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(17, 11, 'o');
  g.rect(0, 0, 17, 2, 'O');
  return {
    id: 'starmart_int',
    name: 'STARMART',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      // 2026-07-02 venue pass: REAL supermarket furniture — packed aisle runs,
      // a freezer wall, a checkout lane (the generic shelves read as a library)
      { sprite: 'mart_aisle', x: 5, y: 4.6, solid: { ox: 0, oy: 12, w: 52, h: 12 } },
      { sprite: 'mart_aisle', x: 9.6, y: 6.6, solid: { ox: 0, oy: 12, w: 52, h: 12 } },
      { sprite: 'freezer_case', x: 8.6, y: 1.7, solid: { ox: 1, oy: 12, w: 34, h: 12 } },
      { sprite: 'checkout_lane', x: 4.4, y: 7.9, solid: { ox: 1, oy: 10, w: 40, h: 12 } },
      { sprite: 'plant_pot', x: 1, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7: the Star Cola case — STARMART's pride
      { sprite: 'cola_fridge', x: 12.2, y: 0.3 },
      // every shop carries an ATM (cash) + a payphone (save) — the user's decree
      { sprite: 'payphone', x: 2, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 14, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      {
        id: 'mart_clerk',
        sprite: 'martClerk',
        x: 4,
        y: 2,
        facing: 'down',
        dialogue: 'shop_mart_greet',
        shop: 'starmart',
      },
    ],
    signs: [{ x: 12, y: 1, dialogue: 'sign_mart_wall' }],
    phones: [{ x: 2, y: 9 }],
    atms: [{ x: 14, y: 9 }],
    doors: [
      { x: 8, y: 10, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- STARPORT ARCADES (S10, §A10 #4) ------------------- */

/**
 * STARPORT — the Otterbrook original. Small, dark, open 24 hours because the
 * machines refuse to sleep. The ARCADE LEGEND machine's old spot is a
 * cabinet-shaped patch of clean carpet: the big game moved to the sequel in
 * Brickton (which is where §A10 #4 lives). ADR-004 grid floating in void;
 * the street exit derives its doorstep from the facade via doorstepOf().
 */
function buildArcadeInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(11, 8, 'a');
  g.rect(0, 0, 11, 2, 'A');
  // carpet sparkles — deliberate, asymmetric, never sprinkled (ADR-020)
  g.set(2, 3, '*');
  g.set(7, 4, '*');
  g.set(5, 6, '*');
  g.set(9, 2, '*');
  return {
    id: 'arcade_int',
    name: 'STARPORT',
    music: 'arcade',
    interior: true,
    grid: g.out(),
    props: [
      // the wall bank: three survivors and one famous gap
      { sprite: 'cab_a', x: 1, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_b', x: 2.6, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_c', x: 4.2, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      // (x 6.2 is the LEGEND machine's old spot — clean carpet, sign below)
      { sprite: 'cab_a', x: 8, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cola_fridge', x: 9.4, y: 0.25 },
      { sprite: 'counter', x: 1, y: 5, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    ],
    npcs: [],
    signs: [
      { x: 1, y: 1, dialogue: 'cab_slug_hunter' },
      { x: 2, y: 1, dialogue: 'cab_lawn_lord' },
      { x: 4, y: 1, dialogue: 'cab_tax_kid' },
      { x: 6, y: 1, dialogue: 'arcade_gap' },
      { x: 8, y: 1, dialogue: 'cab_retired' },
      { x: 2, y: 5, dialogue: 'arcade_counter_note' },
    ],
    phones: [],
    doors: [
      { x: 4, y: 7, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * STARPORT II — "The Sequel to the Arcade." Brickton, §A10 #4's venue: the
 * ARCADE LEGEND cabinet (its sign launches the playable shmup, ArcadeScene),
 * MGR's attract-mode reign, and SAL at the counter keeping score of
 * everything. Same ADR-004/ADR-011/doorstepOf discipline as every interior.
 */
function buildArcade2Int(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(15, 10, 'a');
  g.rect(0, 0, 15, 2, 'A');
  g.set(3, 4, '*');
  g.set(11, 3, '*');
  g.set(6, 7, '*');
  g.set(12, 6, '*');
  g.set(1, 8, '*');
  return {
    id: 'arcade2_int',
    name: 'STARPORT II',
    music: 'arcade',
    interior: true,
    grid: g.out(),
    props: [
      // the wall banks flank THE machine
      { sprite: 'cab_b', x: 1, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_a', x: 2.6, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_c', x: 4.2, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      // ARCADE LEGEND, a head taller than its court
      { sprite: 'cab_legend', x: 6.6, y: 0.45, solid: { ox: 0, oy: 22, w: 22, h: 10 } },
      { sprite: 'cab_a', x: 9, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_c', x: 10.6, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cola_fridge', x: 13, y: 0.25 },
      // the mid-floor island bank (faces you; real arcades double back)
      { sprite: 'cab_c', x: 4, y: 3.4, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_b', x: 5.6, y: 3.4, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_a', x: 9.2, y: 3.4, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      // Sal's counter, where the scores are kept
      { sprite: 'counter', x: 1, y: 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 3, y: 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    ],
    npcs: [
      {
        id: 'arcade_owner',
        sprite: 'arcadeOwner',
        x: 2,
        y: 5,
        facing: 'down',
        dialogue: 'npc_arcade_owner',
      },
    ],
    signs: [
      // THE machine — OverworldScene's signBeat launches the cabinet here
      { x: 7, y: 1, dialogue: 'cab_legend' },
      { x: 1, y: 1, dialogue: 'cab_grandma' },
      { x: 4, y: 1, dialogue: 'cab_fish_boss' },
      { x: 10, y: 1, dialogue: 'cab_smile_sim' },
      { x: 4, y: 5, dialogue: 'cab_island_a' },
      { x: 9, y: 5, dialogue: 'cab_island_b' },
      { x: 13, y: 1, dialogue: 'arcade2_fridge_note' },
    ],
    phones: [],
    doors: [
      { x: 7, y: 9, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- THE CAGE (S12 — the SE lot, up close) ------------------- */

/**
 * The vacant lot's FUTURE finally arrived: a full court in a chain-link
 * cage (ADR-004 grid floating in the lot's weeds — the lot's own wooden
 * fence rings the map edge). Fixtures: two bent-rim backboards, bleacher
 * planks with their bench crowd, the hand-chalked bracket board, PERMIT.
 * The MATCH plays in HoopsScene (the S10 cabinet law: its own scene on the
 * existing input layer) — this map is the venue you walk.
 */
function buildTheCage(): MapDef {
  const g = new Grid(40, 30, '.');
  // the lot's wooden fence at the map edge
  g.rect(0, 0, 40, 1, '-');
  g.rect(0, 29, 40, 1, '-');
  g.rect(0, 1, 1, 28, '|');
  g.rect(39, 1, 1, 28, '|');
  // the weeds stay confident
  g.sprinkle(2012, ',~ f', 0.07);
  // the chain-link ring, gate gap at the top (x19–20 — the Brickton door)
  g.rect(3, 2, 34, 1, 'C');
  g.rect(3, 27, 34, 1, 'C');
  g.rect(3, 3, 1, 24, 'C');
  g.rect(36, 3, 1, 24, 'C');
  g.rect(19, 2, 2, 1, 'q'); // the gap the gate swings over
  // the floor
  g.rect(4, 3, 32, 24, 'q');
  // hand-painted court: sidelines, baselines, the center line
  g.rect(7, 6, 26, 1, 'h');
  g.rect(7, 23, 26, 1, 'h');
  g.rect(7, 7, 1, 16, 'v');
  g.rect(32, 7, 1, 16, 'v');
  g.rect(19, 7, 1, 16, 'v');
  // keys: short rails off each baseline
  g.rect(8, 11, 3, 1, 'h');
  g.rect(8, 18, 3, 1, 'h');
  g.rect(29, 11, 3, 1, 'h');
  g.rect(29, 18, 3, 1, 'h');
  // two crack clusters where the summers landed (deliberate, ADR-020)
  g.set(13, 20, 'z');
  g.set(27, 9, 'z');

  return {
    id: 'the_cage',
    name: 'THE CAGE',
    music: 'cage',
    grid: g.out(),
    props: [
      // bleachers flank the gate, inside the fence — the bench crowd is
      // baked per-seed (no two planks cheer alike)
      { sprite: 'bleachers_a', x: 6, y: 2.4, solid: { ox: 2, oy: 10, w: 60, h: 14 } },
      { sprite: 'bleachers_b', x: 26.5, y: 2.4, solid: { ox: 2, oy: 10, w: 60, h: 14 } },
      // the bracket board by the gate (PERMIT chalks it himself)
      { sprite: 'chalk_board', x: 21.6, y: 3.1, solid: { ox: 1, oy: 22, w: 31, h: 7 } },
      // the rules, such as they are
      { sprite: 'sign', x: 16, y: 3.4, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // two backboards, rims bent the honest way
      { sprite: 'backboard', x: 5, y: 11.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
      { sprite: 'backboard', x: 33.4, y: 11.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
    ],
    npcs: [
      { id: 'permit', sprite: 'permit', x: 23, y: 6, facing: 'down', dialogue: 'npc_permit' },
    ],
    signs: [
      { x: 16, y: 4, dialogue: 'cage_rules' },
      { x: 22, y: 5, dialogue: 'cage_board' },
    ],
    phones: [],
    doors: [
      // S15i Task 6 (ADR-059): the gate now returns to THE CAGE PARK (you walked in
      // through it); the park carries you back to Brickton (symmetric approach)
      { x: 19, y: 1, w: 2, h: 1, to: 'cage_park', tx: 192, ty: 32, facing: 'up' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------- THE CAGE PARK — the walk-through approach (S15i Task 6, ADR-059) ------------- *
 * The user's decree: THE CAGE shouldn't open straight off a Brickton door — it should
 * have a real neighbourhood PARK in front of it. Brickton's frozen cage gate re-routes
 * (at the GROWN level, like the docks) THROUGH this park; you cross courts, benches, a
 * community MURAL and "THE CAGE →" signage, then WALK INTO buildTheCage. Its OWN skin
 * roster (AREA_SKINS.cage_park — gritty rec-block faces). A present + a cutscene earn it.
 */
function buildCagePark(): MapDef {
  const W = 26;
  const H = 22;
  const g = new Grid(W, H, '.');
  g.sprinkle(2059, ',~ f', 0.07);
  // the cage's outer chain-link rings the NORTH; a gate gap at the path's head
  g.rect(0, 0, W, 1, 'C');
  g.rect(11, 0, 3, 1, 'q'); // the gate gap (asphalt threshold → the_cage)
  g.rect(0, 1, 1, H - 3, '|'); // west park fence
  g.rect(W - 1, 1, 1, H - 3, '|'); // east park fence
  // the central path: the gate down to the city sidewalk
  g.rect(11, 1, 3, 18, ':');
  // the city edge — sidewalk the rec-block backs onto + the Brickton return
  g.rect(0, 19, W, 3, '=');
  // THE PRACTICE HALF-COURT (east) — a taste of what's ahead
  g.rect(16, 4, 8, 9, 'q');
  g.rect(17, 4, 6, 1, 'h'); // baseline
  g.rect(17, 12, 6, 1, 'h'); // baseline
  g.rect(20, 5, 1, 7, 'v'); // the lone center stripe
  g.set(18, 9, 'z'); // a crack the summers left

  // the rec-block on the city edge — TWO faces from THE CAGE PARK's OWN roster,
  // hand-placed at their true size (ADR-053 spacing) in the SOUTH corners, framing
  // the entrance (clear of the path + the courts + the present)
  const recA = AREA_SKINS.cage_park[0];
  const recB = AREA_SKINS.cage_park[3 % AREA_SKINS.cage_park.length];
  const dimA = facadeDims(recA);
  const dimB = facadeDims(recB);
  const recCenter = placeFacade(recA, 1, 19 * 16 - 4, dimA.w, dimA.u);
  const recStore = placeFacade(recB, W - 1 - dimB.w, 19 * 16 - 4, dimB.w, dimB.u);

  const OAK_S = { ox: 7, oy: 22, w: 12, h: 10 };
  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  // a hidden PRESENT — a basket left on the grass, north-west of the path where the
  // benches end (open grass, clear of every building + the courts)
  const gift: PropDef[] = [
    { sprite: 'gift_box', x: 8, y: 7, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'cage_park_gift' },
    { sprite: 'gift_box_open', x: 8, y: 7, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'cage_park_gift' },
  ];

  return {
    id: 'cage_park',
    name: 'CAGE PARK',
    music: 'cage',
    grid: g.out(),
    props: [
      recCenter,
      recStore,
      // THE MURAL — a free-standing handball wall on the west, the park's heart
      { sprite: 'cage_mural', x: 2, y: 6, solid: { ox: 0, oy: 6, w: 46, h: 24 } },
      // a practice backboard at the court's head
      { sprite: 'backboard', x: 19, y: 3.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
      // benches to watch from, a fountain, a couple of trees
      { sprite: 'bench', x: 7, y: 10, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 12, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'trash_can', x: 15, y: 16, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: treeSprite(4, 4), x: 4, y: 4, solid: OAK_S },
      { sprite: treeSprite(22, 17), x: 22, y: 17, solid: OAK_S },
      ...gift,
      // signage: the cage is THIS way (north), and the park's plaque
      { sprite: 'sign', x: 9, y: 2, solid: SIGN_SOLID }, // THE CAGE →
      { sprite: 'sign', x: 8, y: 8, solid: SIGN_SOLID }, // the mural plaque
      { sprite: 'sign', x: 14, y: 18, solid: SIGN_SOLID }, // welcome to the park
    ],
    npcs: [
      { id: 'park_old_head', sprite: 'quarterMan', x: 9, y: 10, facing: 'right', dialogue: 'npc_park_old_head', wander: true },
      { id: 'park_kid', sprite: 'pigeonKid', x: 18, y: 7, facing: 'down', dialogue: 'npc_park_kid', wander: true },
    ],
    signs: [
      { x: 9, y: 2, dialogue: 'sign_cage_this_way' },
      { x: 8, y: 8, dialogue: 'sign_cage_mural' },
      { x: 14, y: 18, dialogue: 'sign_cage_park' },
      // the present (gift-box pattern, gated)
      { x: 8, y: 8, dialogue: 'cage_park_gift', unlessFlag: 'cage_park_gift' },
      { x: 8, y: 8, dialogue: 'cage_park_gift_done', ifFlag: 'cage_park_gift' },
    ],
    phones: [],
    doors: [
      // north through the chain-link gate INTO THE CAGE
      { x: 11, y: 0, w: 3, h: 1, to: 'the_cage', tx: 320, ty: 60, facing: 'up' },
      // south back onto the Brickton sidewalk (the cage-gate area)
      { x: 11, y: H - 1, w: 3, h: 1, to: 'brickton', tx: 808, ty: 402, facing: 'down' },
    ],
    spawners: [],
    triggers: [
      // the first-arrival beat — the park, the mural, a ball bouncing somewhere ahead
      { id: 'cage_park_reveal', rect: { x: 10, y: 16, w: 5, h: 3 }, once: true },
    ],
  };
}

/* ------------------- THE 6:15 (bus interior cutscene) ------------------- */

function buildBusInterior(): MapDef {
  const g = new Grid(22, 9, 'u');
  g.rect(0, 0, 22, 3, 'y');
  g.rect(0, 3, 22, 1, 'U');
  g.rect(0, 8, 22, 1, 'U');
  g.rect(0, 4, 1, 4, 'U');
  g.rect(21, 4, 1, 4, 'U');

  return {
    id: 'bus_interior',
    name: 'THE 6:15',
    music: 'bus',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bus_windows', x: 0, y: 0 },
      ...[3, 6, 9, 12, 15, 18].map((x) => ({
        sprite: 'bus_seat',
        x,
        y: 4,
        solid: { ox: 1, oy: 10, w: 14, h: 12 },
      })),
    ],
    npcs: [
      { id: 'bus_driver', sprite: 'busDriver', x: 20, y: 5, facing: 'right', dialogue: 'npc_busdriver' },
      { id: 'fern_lady', sprite: 'fernLady', x: 9, y: 5, facing: 'up', dialogue: 'npc_fernlady' },
    ],
    signs: [],
    phones: [],
    doors: [],
    spawners: [],
    triggers: [],
  };
}

// doorstepOf lives in mapkit.ts (S14 extraction — byte-identical)

const otterbrookMap = growOtterbrook();
const bricktonMap = growBrickton();
const rexDoorstep = doorstepOf(otterbrookMap, 'rex_home') ?? { tx: 46 * 16, ty: 41 * 16 };
const chadDoorstep = doorstepOf(otterbrookMap, 'chad_home') ?? { tx: 60 * 16, ty: 41 * 16 };
const workshopDoorstep = doorstepOf(otterbrookMap, 'workshop_int') ?? { tx: 24 * 16, ty: 31 * 16 };
const otterHomeSteps = Object.fromEntries(
  OTTERBROOK_HOME_SPECS.map((h) => [h.id, doorstepOf(otterbrookMap, h.id) ?? { tx: h.x * 16 + 32, ty: (h.y + OTTERBROOK_TOWN_BASE + 6) * 16 }]),
) as Record<(typeof OTTERBROOK_HOME_SPECS)[number]['id'], { tx: number; ty: number }>;
const otterHomeMaps = Object.fromEntries(
  OTTERBROOK_HOME_SPECS.map((h, i) => [h.id, buildOtterHome(h.id, h.name, otterHomeSteps[h.id], i)]),
) as Record<(typeof OTTERBROOK_HOME_SPECS)[number]['id'], MapDef>;
// THE LONG WALK (ADR-056) — the four foot legs, with computed inter-leg doors.
const longWalk = buildLongWalk();
// Brickton's foot exit now lands on the OVERPASS (its city-adjacent leg), a few
// tiles WEST of the orientation gate so arriving never bounces you back through
// it — computed off the overpass's real trail (ADR-012), facing home (west). The
// frozen 2077 core is untouched: only this one appended door's target is rewritten.
{
  const op = longWalk.meadow_overpass;
  const opX = op.grid[0].length - 5;
  const opY = trailRowAt(op.grid, opX);
  const foot = bricktonMap.doors.find((d) => d.to === 'meadow_mile');
  if (foot) {
    foot.to = 'meadow_overpass';
    foot.tx = opX * 16 + 8;
    foot.ty = opY * 16;
    foot.facing = 'left';
  }
}
// S15i Task 6 (ADR-059): THE CAGE gate now opens THROUGH the new CAGE PARK (the
// user's "give the cage a real park in front" decree). A post-build fixup on the
// live map — exactly like the foot door above — so the frozen 2077 core's literal
// door stays byte-identical (it still reads → the_cage); only MAPS.brickton's door
// target is rewritten, landing you on the park's south path before the courts.
{
  const cage = bricktonMap.doors.find((d) => d.to === 'the_cage');
  if (cage) {
    cage.to = 'cage_park';
    cage.tx = 200; // tile 12 — one tile inside the park's south gate (its brickton
    cage.ty = 332; // door at y:21); the welcome rect (y:16-18) still fires on the walk north
  }
}
const cityHallDoorstep = doorstepOf(otterbrookMap, 'otterbrook_cityhall') ?? { tx: 104, ty: 672 };
const otterStationDoorstep = doorstepOf(otterbrookMap, 'otter_station') ?? { tx: 248, ty: 680 };
const busDepotDoorstep = doorstepOf(otterbrookMap, 'bus_depot_int') ?? { tx: 760, ty: 392 };
// S22 (ADR-116) — DOWNTOWN: the entry doorstep on the grown town, then the street
// screen, then its two shop interiors (doorsteps computed off the street map).
const downtownStep = doorstepOf(otterbrookMap, 'downtown_otterbrook') ?? { tx: 728, ty: 544 };
const downtownMap = buildDowntownOtterbrook(downtownStep);
const hardwareStep = doorstepOf(downtownMap, 'hardware_int') ?? { tx: 96, ty: 150 };
const dinerStep = doorstepOf(downtownMap, 'diner_int') ?? { tx: 224, ty: 150 };
const otterClinicStep = doorstepOf(downtownMap, 'otter_clinic_int') ?? { tx: 352, ty: 150 };
const deptDoorstep = doorstepOf(bricktonMap, 'dos_f1') ?? { tx: 489, ty: 121 };
const martDoorstep = doorstepOf(bricktonMap, 'starmart_int') ?? { tx: 80, ty: 121 };
const spireStep = doorstepOf(bricktonMap, 'spire_lobby') ?? { tx: 2128, ty: 1013 };
const drugDoorstep = doorstepOf(otterbrookMap, 'drugstore_int') ?? { tx: 425, ty: 225 };
const arcadeDoorstep = doorstepOf(otterbrookMap, 'arcade_int') ?? { tx: 121, ty: 369 };
const arcade2Doorstep = doorstepOf(bricktonMap, 'arcade2_int') ?? { tx: 345, ty: 313 };
// World Overhaul S5 — the three new authored Otterbrooke storefront stubs
const bankStep = doorstepOf(otterbrookMap, 'bank_int') ?? { tx: 96, ty: 150 };
const bakeryStep = doorstepOf(otterbrookMap, 'bakery_int') ?? { tx: 96, ty: 150 };
const burgerStep = doorstepOf(otterbrookMap, 'burger_int') ?? { tx: 96, ty: 150 };

/* ------------- COSTA ESTRELLA (S13 — the clifftop resort) ------------- */

/**
 * THE WORLD DOOR, AUTHORED FOR PUERTO SOL (ADR-037): when Prompt 28 builds
 * §A5 Ch.2's port, wiring the resort in is ONE LINE — push this onto
 * costa_estrella's doors (and aim a Puerto Sol door back at the resort's
 * south path, tile ~13,15). It is NOT placed today: door targets must
 * exist (the validator's law), and Puerto Sol doesn't yet.
 */
export const COSTA_DOOR_FOR_PUERTO_SOL = { x: 12, y: 15, w: 3, h: 1, to: 'puerto_sol', tx: 104, ty: 30, facing: 'down' } as const;

/** the resort grounds: clubhouse, the caddy at the first tee, the plaque.
 *  Dev-reachable standalone (the Sprite Lab precedent) until Prompt 28. */
function buildCostaEstrella(): MapDef {
  const g = new Grid(27, 16, '.');
  // the cliff edge runs the north rim (fences — the surf is past them)
  g.rect(0, 0, 27, 1, '-');
  g.rect(0, 1, 1, 14, '|');
  g.rect(26, 1, 1, 14, '|');
  // the resort path: gate (south) up to the clubhouse, then west to the tee
  g.rect(12, 8, 3, 8, ':');
  g.rect(5, 8, 10, 2, ':');
  // S15i Task 6 (ADR-059): the tee path runs ON west to a gate in the cliff wall —
  // the road to THE LINKS proper (the subdivision + course + the real clubhouse)
  g.rect(1, 8, 5, 2, ':');
  g.set(0, 8, ':');
  g.set(0, 9, ':');
  // hedges square the clubhouse lawn; flowers where the staff insist
  g.rect(17, 6, 6, 1, 'b');
  g.rect(17, 12, 6, 1, 'b');
  g.set(4, 4, 'f');
  g.set(6, 12, 'F');
  g.set(21, 4, 'f');
  g.set(9, 5, 'F');
  g.sprinkle(20, ',~', 0.12);

  return {
    id: 'costa_estrella',
    name: 'COSTA ESTRELLA LINKS',
    music: 'cage',
    settlement: 'village',
    grid: g.out(),
    props: [
      // (removed) the clifftop 'LINKS' clubhouse — it duplicated THE LINKS
      // building on the very next screen (golf_resort / THE LINKS ESTATES), so
      // it's gone; the clifftop is just the gate now (ADR-059, the gate door
      // west to golf_resort still stands in doors[] below)
      // the first tee's plaque
      { sprite: 'sign', x: 5, y: 7, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // the gate marker — to the subdivision + the clubhouse
      { sprite: 'sign', x: 2, y: 10, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // palms read as the coast's trees (the standard canvas, ADR-019)
      { sprite: 'tree_b', x: 2, y: 2 },
      { sprite: 'tree_b', x: 23, y: 13 },
      { sprite: 'tree', x: 8, y: 13 },
    ],
    npcs: [
      // S15i Task 6 (ADR-059): FITO the caddy moved INTO the new clubhouse (the
      // round-start is indoors now); a starter greets you at the clifftop gate
      { id: 'links_starter', sprite: 'caddy', x: 4, y: 9, facing: 'left', dialogue: 'npc_links_starter', wander: true },
    ],
    signs: [
      { x: 5, y: 8, dialogue: 'sign_costa' },
      { x: 2, y: 10, dialogue: 'sign_links_gate' },
    ],
    phones: [],
    atms: [],
    doors: [
      // S14 (Prompt 28): THE ONE-LINE WIRE — the resort joins the world
      COSTA_DOOR_FOR_PUERTO_SOL,
      // S15i Task 6 (ADR-059): west through the cliff gate to THE LINKS proper
      { x: 0, y: 8, w: 1, h: 2, to: 'golf_resort', tx: 224, ty: 320, facing: 'left' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------- THE GOLF RESORT — the subdivision approach (S15i Task 6, ADR-059) ------------- *
 * The user's decree: golf shouldn't START by talking to a caddy on a bare lawn — it should
 * be an EXPENSIVE place you walk through. Off costa_estrella's clifftop gate, a manicured
 * SUBDIVISION: pastel MANSIONS lining a cart path, fairway + bunkers + a water hazard, a
 * gatehouse, "THE LINKS →" signage, a present, a cutscene — then you WALK INTO the grand
 * CLUBHOUSE interior, where FITO starts your round (moved indoors from costa). Its OWN skin
 * roster (AREA_SKINS.golf_resort — the new mansion sprites). The course tile is 'm' (fairway).
 */
function buildGolfResort(costaStep: { tx: number; ty: number }): MapDef {
  const W = 30;
  const H = 22;
  const g = new Grid(W, H, '.');
  g.sprinkle(2061, ',~,~ f', 0.05);
  // the manicured FAIRWAY runs the WEST, a putting GREEN at the NE, a water hazard
  g.rect(1, 2, 8, 15, 'm');
  g.rect(2, 17, 5, 3, 'n'); // a sand bunker
  g.rect(21, 3, 7, 6, 'm'); // the practice green
  g.rect(23, 10, 3, 3, 'e'); // a water hazard (you walk around)
  g.rect(22, 9, 5, 1, 'E'); // its foam lip
  g.rect(22, 13, 5, 1, 'E');
  // the cart path: the clifftop gate (south) up to the clubhouse forecourt (north)
  g.rect(13, 1, 3, 20, ':');
  // clipped hedges line the manicured edges (geometric, the resort look)
  g.rect(10, 4, 1, 12, 'b');
  g.rect(18, 4, 1, 12, 'b');
  g.rect(11, 19, 8, 1, 'b'); // a low hedge by the entrance
  g.rect(13, 19, 3, 1, ':'); // ...with the cart path passing THROUGH it (the gate gap, ADR-059) — the hedge must never seal the entrance plaza off from the course
  // the clubhouse forecourt (north) + the entrance plaza (south)
  g.rect(10, 1, 9, 1, '=');
  g.rect(11, 20, 7, 2, '=');
  // flower beds where the gardeners insist
  g.set(20, 5, 'f'); g.set(26, 7, 'F'); g.set(9, 12, 'f'); g.set(4, 6, 'F');

  // THE GRAND CLUBHOUSE (north) — opens into the pro-shop interior; + the gatehouse
  // (south) by the entrance. Both from the resort's OWN roster (drawHouse mansions
  // are houses, so these are hand-placed, not buildDistrict'd).
  const clubhouse: PropDef = {
    sprite: 'clubhouse_grand', x: 11, y: 0.4, solid: { ox: 0, oy: 28, w: 128, h: 30 },
    door: { ox: 56, oy: 58, w: 16, h: 18, to: 'golf_clubhouse', tx: 128, ty: 150 },
  };
  const gatehouse: PropDef = { sprite: 'golf_gatehouse', x: 19, y: 17, solid: { ox: 0, oy: 20, w: 80, h: 28 } };
  // THE MANSIONS — three, lining the cart path's east side, set back behind the hedge
  const mansions: PropDef[] = [
    { sprite: 'mansion_c', x: 20, y: 2.4, solid: { ox: 0, oy: 30, w: 112, h: 40 } },
    { sprite: 'mansion_a', x: 2, y: 8.4, solid: { ox: 0, oy: 34, w: 112, h: 44 } },
    { sprite: 'mansion_b', x: 21, y: 12.4, solid: { ox: 0, oy: 34, w: 96, h: 40 } },
  ];

  const PALM_S = { ox: 7, oy: 22, w: 12, h: 10 };
  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  // a hidden PRESENT — a cooler left at the turn (open grass by the green)
  const gift: PropDef[] = [
    { sprite: 'gift_box', x: 26, y: 6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'golf_resort_gift' },
    { sprite: 'gift_box_open', x: 26, y: 6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'golf_resort_gift' },
  ];

  return {
    id: 'golf_resort',
    name: 'THE LINKS ESTATES',
    music: 'cage',
    settlement: 'village',
    grid: g.out(),
    props: [
      clubhouse,
      gatehouse,
      ...mansions,
      ...gift,
      { sprite: 'tree_b', x: 8, y: 3, solid: PALM_S },
      { sprite: 'tree', x: 27, y: 16, solid: PALM_S },
      // signage
      { sprite: 'sign', x: 12, y: 18, solid: SIGN_SOLID }, // THE LINKS / welcome
      { sprite: 'sign', x: 16, y: 2, solid: SIGN_SOLID }, // CLUBHOUSE / pro shop →
    ],
    npcs: [
      { id: 'estate_gardener', sprite: 'fernLady', x: 9, y: 8, facing: 'right', dialogue: 'npc_estate_gardener', wander: true },
      { id: 'estate_member', sprite: 'oldTimer', x: 17, y: 14, facing: 'left', dialogue: 'npc_estate_member' },
    ],
    signs: [
      { x: 12, y: 18, dialogue: 'sign_links_welcome' },
      { x: 16, y: 2, dialogue: 'sign_links_clubhouse' },
      { x: 26, y: 7, dialogue: 'golf_resort_gift', unlessFlag: 'golf_resort_gift' },
      { x: 26, y: 7, dialogue: 'golf_resort_gift_done', ifFlag: 'golf_resort_gift' },
    ],
    phones: [],
    doors: [
      // south back to costa_estrella's clifftop gate (just inside it)
      { x: 13, y: H - 1, w: 3, h: 1, to: 'costa_estrella', tx: costaStep.tx, ty: costaStep.ty, facing: 'down' },
    ],
    spawners: [],
    triggers: [
      // the first-arrival beat — the manicured course, the mansions, the clubhouse ahead
      { id: 'golf_resort_reveal', rect: { x: 12, y: 17, w: 5, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CLUBHOUSE — the expensive pro-shop interior where the round now starts (the
 * caddy FITO moved indoors). A warm room: the counter, club racks, a trophy case,
 * the leaderboard. The bottom door rides back to the resort's clubhouse doorstep.
 */
function buildGolfClubhouse(resortExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(5, 4, 6, 2, 'r'); // a green runner to the counter
  return {
    id: 'golf_clubhouse',
    name: 'THE LINKS — CLUBHOUSE',
    music: 'cage',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 7, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } }, // club racks
      { sprite: 'shelf_b', x: 13, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'chalk_board', x: 2, y: 7, solid: { ox: 1, oy: 14, w: 31, h: 7 } }, // the leaderboard
      { sprite: 'planter', x: 13, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    ],
    npcs: [
      // FITO runs both formats from behind the counter now (the round-start, indoors)
      { id: 'caddy', sprite: 'caddy', x: 8, y: 2, facing: 'down', dialogue: 'npc_caddy' },
    ],
    signs: [{ x: 4, y: 1, dialogue: 'sign_clubhouse_wall' }],
    phones: [],
    doors: [
      { x: 7, y: 10, w: 2, h: 1, to: 'golf_resort', tx: resortExit.tx, ty: resortExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

const chapelDoorstep = doorstepOf(otterbrookMap, 'chapel_int') ?? { tx: 521, ty: 372 };
const hospitalDoorstep = doorstepOf(bricktonMap, 'hospital_int') ?? { tx: 320, ty: 121 };

/**
 * THE USER'S "BIGGER ROOMS" DECREE — a small interior used to FLOAT tiny in the
 * void (a 9×8 room filled ~⅓ of the screen, the hero lost in a sea of black).
 * Grow it to a comfortable minimum: pad FLOOR on the right + bottom so existing
 * content stays put (top-left anchored — the entry spawn still lands inside),
 * keep the top WALL band across the new width, and ride the bottom EXIT door
 * down to the new floor edge. Standard single-room interiors only; the validator
 * re-checks door-landing + reachability on the grown grid (its safety net).
 */
function growInterior(map: MapDef, minW: number, minH: number): MapDef {
  const grid = map.grid;
  const H = grid.length;
  const W = grid[0].length;
  const newW = Math.max(W, minW);
  const newH = Math.max(H, minH);
  if (newW === W && newH === H) return map;
  const wall = grid[0][0];
  // the top WALL band = the leading rows that are entirely the wall char
  let wallRows = 0;
  while (wallRows < H && [...grid[wallRows]].every((c) => c === wall)) wallRows += 1;
  // FLOOR = the most common char below the wall (handles 'w'/'a'/'o' + rugs)
  const counts = new Map<string, number>();
  for (let y = wallRows; y < H; y++) for (const ch of grid[y]) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let floor = grid[H - 1][0];
  let best = -1;
  for (const [ch, n] of counts) if (n > best) { best = n; floor = ch; }
  const padR = newW - W;
  const rows = grid.map((row, y) => (y < wallRows ? wall.repeat(newW) : row + floor.repeat(padR)));
  for (let y = H; y < newH; y++) rows.push(floor.repeat(newW));
  // the bottom exit door rides to the new floor edge (interiors exit downward)
  const doors = map.doors.map((d) => (d.y >= H - 1 ? { ...d, y: newH - 1 } : d));
  return { ...map, grid: rows, doors };
}

// S15i Task 6 (ADR-059): the golf resort + clubhouse, with computed doorsteps —
// the resort returns you just inside costa's west gate; the clubhouse rides back to
// the resort's grand-clubhouse doorstep (the doorstepOf pattern).
const golfResortMap = buildGolfResort({ tx: 24, ty: 128 });
const golfClubhouseStep = doorstepOf(golfResortMap, 'golf_clubhouse') ?? { tx: 224, ty: 32 };
const golfMaps = {
  golf_resort: golfResortMap,
  golf_clubhouse: buildGolfClubhouse(golfClubhouseStep),
};

/* ─────────────────────────────────────────────────────────────────────────
 * elev_spike — WORLD-OVERHAUL ELEVATION SPIKE (dev-only; window.mfWarp('elev_spike'))
 *
 * The FIRST map to opt into the true multi-level engine (World Overhaul P2). A
 * 3-row cliff separates a LOWER ground (level 0, south) from an UPPER terrace
 * (level 1, north), joined by ONE 3-wide stair. Purpose: prove the walk-behind
 * overlay (a level-0 player who walks up to the cliff passes BEHIND its face) +
 * the player-level scalar (climbing the stair lifts you onto the terrace) + (P4)
 * the LAYERED CLIFF KIT — the 3-row face exercises all three bands (cliff_top /
 * cliff_mid / cliff_base). Reached ONLY by the dev warp — NOT wired into any
 * shipped map — and allowlisted in src/data/elevation.test.ts. The grid still
 * uses 'K'/'^'/'T'; the authored layered art is applied by buildElevationOverlay.
 * See docs/WILDERNESS_DESIGN_LANGUAGE.md § Elevation.
 * ──────────────────────────────────────────────────────────────────────── */
const ELEV_SPIKE_W = 24;
const ELEV_SPIKE_H = 18;
function buildElevSpike(): MapDef {
  const g = new Grid(ELEV_SPIKE_W, ELEV_SPIKE_H); // fill '.' grass
  // the cliff band: '^' lip (row 6) over a 3-row 'K' face (rows 7-9) — three rows so the
  // P4 LAYERED CLIFF KIT shows all three bands (top row = grassy overhang, row 8 = MID
  // strata, base row = scree). One 3-wide 'T' stair cut through it (cols 10-12) joins
  // terrace ↔ ground.
  g.rect(0, 6, ELEV_SPIKE_W, 1, '^');
  g.rect(0, 7, ELEV_SPIKE_W, 3, 'K');
  g.rect(10, 6, 3, 4, 'T'); // stair: row 6 (top, on the terrace) + rows 7-9 (through the face)
  const grid = g.out();
  // the parallel LEVEL plane, GENERATED from the grid so dimensions match exactly
  // (elevation.test.ts asserts this). Rows 0-6 = terrace + lip (level 1); the K
  // face rows 7-9 stay level 1 (they ARE the upper terrace's front wall, so the
  // overlay lifts them); the stair cells below the lip drop to level 0 so stepping
  // DOWN the stair lowers you; rows 10+ = ground (level 0).
  const level = grid.map((rowStr, y) =>
    rowStr
      .split('')
      .map((ch) => {
        if (y <= 6) return '1';
        if (y <= 9) return ch === 'T' ? '0' : '1';
        return '0';
      })
      .join(''),
  );
  return {
    id: 'elev_spike',
    name: 'ELEVATION SPIKE',
    music: 'hill',
    grid,
    elevation: { level },
    props: [
      // depth cues: trees on the upper terrace (north) + on the ground (south)
      { sprite: treeSprite(3, 2, true), x: 3, y: 2, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(20, 2, true), x: 20, y: 2, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(4, 15, true), x: 4, y: 15, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(19, 15, true), x: 19, y: 15, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [],
    spawners: [],
    triggers: [],
  };
}

export const MAPS: Record<string, MapDef> = {
  ...buildChapter2Maps({ chapelStep: chapelDoorstep, hospitalStep: hospitalDoorstep }),
  // S18 (ADR-095) — CHAPTER 3 England (Half 1: maps + encounters + shops; the
  // manifest stays 'unlanded' until the story/boss half flips it)
  ...buildChapter3Maps(),
  // CHAPTER 4 Norway — "The Fjord That Sleeps" (Kvisthavn / Bootstep Moor /
  // Lilleby / the Sleeper's Spine). Lands SHIPPED with its story/boss wiring.
  ...buildChapter4Maps(),
  // CHAPTER 5 Minimus — "The Grand Duchy of Minimus" (Minimus Major / the
  // Procession Way / the Hedgerow / the Ducal Crown). Lands SHIPPED at the flip.
  ...buildChapter5Maps(),
  // CHAPTER 6 Africa — "The Ruins That Laugh" (Zanzibel / the Savanna Run / the
  // Laughing Ruins / the Sphinx's chin). The BRANCH's home (Held Breath + Choice 1).
  ...buildChapter6Maps(),
  // CHAPTER 7 India — "The Cobra's Palace" (Chandrapore / the Monsoon Road / the
  // night train / the palace throne). A straight chapter (no branch beat).
  ...buildChapter7Maps(),
  // CHAPTER 8 China — "The Paper Dragon" (Lotus Harbor / the Bamboo Road / the
  // Spore Forest / the Mt. Shu temple). A straight chapter (no branch beat).
  ...buildChapter8Maps(),
  // CHAPTER 9 Romania — "The Count of Valea Stelelor" (Valea Stelelor / the Old Road /
  // Castle Hoaxula / Stone Brow Monastery). Carries the COMPASSION axis (CHOICE 2).
  ...buildChapter9Maps(),
  // CHAPTER 10 — "The Long Shot" (Aurora Station / the Aurora Ice Field / Mauna Lani /
  // the Lani Magma Flats / the Sea of Silence). THE FINALE — carries the FINALE axis
  // (CHOICE 3) and the bespoke Hush fight; the composed ending plays over the walk home.
  ...buildChapter10Maps(),
  otterbrook: otterbrookMap,
  // THE LONG WALK — the four foot legs (Otterbrook → woods → far meadow → overpass)
  ...longWalk,
  // THE UNDER-OAK (ADR-121 rework) — the directed BOSS 1 descent
  oak_roots: buildOakRoots(),
  oak_hollow: buildOakHollow(),
  oak_heart: buildOakHeart(),
  rex_home: buildRexHome(rexDoorstep),
  rex_bedroom: buildBedroom(),
  rex_hall: buildRexHall(),
  ana_room: buildAnaRoom(),
  vivi_room: buildViviRoom(),
  chad_home: buildOtterHome('chad_home', 'PICKLE HOUSE', chadDoorstep, 4),
  workshop_int: buildWorkshopInt(workshopDoorstep),
  ...otterHomeMaps,
  brickton: bricktonMap,
  dos_f1: buildDosF1(deptDoorstep),
  dos_f2: buildDosF2(),
  dos_f3: buildDosF3(),
  spire_lobby: buildSpireLobby(spireStep), // THE SPIRE's gilt doors — lobby access only

  otterbrook_cityhall: buildOtterbrookCityHallInt(cityHallDoorstep),
  otter_station: buildOtterStationInt(otterStationDoorstep),
  bus_depot_int: buildBusDepotInt(busDepotDoorstep),
  downtown_otterbrook: downtownMap,
  hardware_int: buildHardwareInt(hardwareStep),
  diner_int: buildDinerInt(dinerStep),
  otter_clinic_int: buildOtterClinicInt(otterClinicStep),
  otter_clinic_exam: buildOtterClinicExam(),
  drugstore_int: buildDrugstoreInt(drugDoorstep),
  bank_int: buildShopStub('bank_int', 'OTTERBROOK SAVINGS & LOAN', bankStep),
  bakery_int: buildShopStub('bakery_int', 'OTTERBROOK BAKERY', bakeryStep),
  burger_int: buildShopStub('burger_int', 'THE OTTER BURGER', burgerStep),
  starmart_int: buildStarmartInt(martDoorstep),
  arcade_int: buildArcadeInt(arcadeDoorstep),
  arcade2_int: buildArcade2Int(arcade2Doorstep),
  the_cage: buildTheCage(),
  cage_park: buildCagePark(), // S15i Task 6 (ADR-059) — the walk-through approach
  costa_estrella: buildCostaEstrella(),
  ...golfMaps, // S15i Task 6 (ADR-059) — the golf resort + clubhouse (computed doorsteps)
  bus_interior: buildBusInterior(),
  // WORLD-OVERHAUL P2 — the opt-in elevation spike (dev-only, window.mfWarp)
  elev_spike: buildElevSpike(),
};

// the user's decree — the cramped single-room interiors fill the screen now
// (no camera zoom, which would scale the HUD; the rooms themselves grow). Multi-
// room houses, vehicles, and the already-roomy halls (museum/hospital/dos) keep
// their hand-built size.
const ROOMY_INTERIORS: readonly string[] = [
  'drugstore_int', 'bank_int', 'bakery_int', 'burger_int', 'starmart_int', 'arcade_int', 'arcade2_int',
  'rex_bedroom', 'ana_room', 'vivi_room', 'otterbrook_cityhall', 'otter_station', 'bus_depot_int',
  'hardware_int', 'diner_int', 'otter_clinic_int',
  'mercado_int', 'clinic_ps_int', 'deli_int', 'chapel_int',
  'valle_shop_int', 'clinic_valle_int', 'chapel_valle_int',
];
for (const id of ROOMY_INTERIORS) if (MAPS[id]) MAPS[id] = growInterior(MAPS[id], 16, 11);

/* THE OTHER HALF OF THE DECREE — growInterior rides a room's bottom exit mat
 * down to the grown floor edge, but every INBOUND landing was authored against
 * the SMALL room, so it still aims at the old threshold row — dropping the
 * player mid-floor ("I enter my sister's room and appear in the middle of it").
 * Re-aim every door/prop-door landing that targets a grown room at the room's
 * OWN return door: mouth center-x, feet ONE TILE INSIDE the threshold — the
 * same interior cell the door-audit measures snugness against (mapcheck
 * doorCell). The inline tx/ty literals on source maps remain as the pre-grow
 * numbers; this pass is the single authority for grown-room entries. */
{
  const roomy = new Set<string>(ROOMY_INTERIORS);
  const reAim = (d: { to: string; tx: number; ty: number }, from: string): void => {
    const room = MAPS[d.to];
    const back = room?.doors.find((rd) => rd.to === from);
    if (!room || !back || back.indicator === 'stairs' || back.indicator === 'elevator') return;
    const cx = Math.floor(back.x + back.w / 2);
    const cy = Math.floor(back.y + back.h / 2);
    const dir: Record<string, [number, number]> = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };
    const [dx, dy] = dir[back.facing] ?? [0, 0];
    if (dx === 0 && dy === 0) return;
    // step off the zone, then past the wall BAND if the zone sits IN it (an
    // 'up' door hangs in the 2-row top wall; its mouth is the first floor row
    // below) — the same grid[0][0] wall-char read growInterior itself uses.
    const wall = room.grid[0][0];
    let ix = cx + dx;
    let iy = cy + dy;
    for (let hops = 0; hops < 3 && iy >= 0 && ix >= 0 && iy < room.grid.length && ix < room.grid[0].length && room.grid[iy][ix] === wall; hops++) {
      ix += dx;
      iy += dy;
    }
    if (iy < 0 || ix < 0 || iy >= room.grid.length || ix >= room.grid[0].length || room.grid[iy][ix] === wall) return; // keep the authored landing
    d.tx = ix * 16 + 8; // tile interior (ADR-136): the body box fits the one cell
    d.ty = iy * 16 + 12;
  };
  for (const [id, m] of Object.entries(MAPS)) {
    for (const d of m.doors) if (roomy.has(d.to)) reAim(d, id);
    for (const p of m.props) if (p.door && roomy.has(p.door.to)) reAim(p.door, id);
  }
}

// S18 M22 (ADR-092) — THE GLYPH LAW wired into the LIVE Americas settlement
// overworlds: each declares its canon §A5/§A6 area so the entry banner wears that
// region's decorative GLYPH script under the place name (§A11.8, §A11.6-safe). The
// unlanded regions inherit the same hook when their maps land — the GLYPH_SCRIPT
// registry already pins every canon area both directions. (validator: map.area
// must be a real GLYPH_SCRIPT key.)
const MAP_AREA: Record<string, string> = {
  otterbrook: 'otterbrook',
  oak_roots: 'otterbrook',
  oak_hollow: 'otterbrook',
  oak_heart: 'otterbrook',
  brickton: 'brickton',
  cage_park: 'cage_park',
  puerto_sol: 'puerto_sol',
  // S18 (ADR-095) — CHAPTER 3 England: the stone town wears its M22 `fraktur`
  // glyph banner (§A11.8) over the M25 fog-stone skin. The academy + the moor
  // maps add their 'wintermoor' rows when they land.
  foggybottom: 'foggybottom',
  wintermoor_grounds: 'wintermoor',
  // CH.4 Norway — the two settlements wear their own M25 skins + glyph banners
  kvisthavn: 'kvisthavn',
  lilleby: 'lilleby',
  // CH.5 Minimus — the capital wears the heraldic duchy hand (§A11; banner reads
  // MINIMUS MAJOR). The road/maze/crown carry no settlement glyph (like the moor/spine).
  minimus_major: 'minimus',
  // CH.10 The Long Shot — the two settlements wear their region glyph banners (AURORA STATION
  // in the frost script, MAUNA LANI in the tiki script). The ice field / magma flats / Sea of
  // Silence carry no settlement glyph (like the moor/spine), matching the tile-skin precedent.
  aurora_station: 'aurora',
  mauna_lani: 'mauna_lani',
};
for (const [id, area] of Object.entries(MAP_AREA)) if (MAPS[id]) MAPS[id].area = area;

// ─── THE LIVING-CITY PASS (S18) — alive by DEFAULT ──────────────────────────
// Every grown settlement runs through occupyCity: ~90% of its catalog facades get
// a door into a footprint-sized interior (homes / shops / cafes / offices /
// clinics), and the locked ~10% answer a knock with EarthBound-weird refusals.
// The pass mutates the live map and merges its generated interiors into MAPS. A
// NEW city becomes alive the moment it's added to this list — never dead by default.
function cityLifeSeed(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// EVERY settlement runs the pass (not a hardcoded list) — so any city, present or
// future, is alive by default. occupyCity only fills DOORLESS 'bldg_' facades, so
// hand-authored doors/interiors are untouched; a settlement with no catalog
// facades is a harmless no-op. Object.values() is a snapshot, so the interiors we
// merge in aren't re-scanned.
for (const m of Object.values(MAPS)) {
  if (!m.settlement) continue;
  Object.assign(MAPS, occupyCity(m, { area: m.area ?? m.id, seed: cityLifeSeed(m.id) }));
}

// ─── Wave 2 (ADR-108) — MAP AMBIENT AUDIO (#16) ─────────────────────────────
// A per-map ambient BED (engine/ambience.ts) layered under the music, plus an
// OPTIONAL explicit muffle override (absent → OverworldScene derives the veil from
// `interior`). Central like MAP_AREA so the whole soundscape reads in one place;
// applied LAST (after the living-city pass) so the fields can't be clobbered, across
// every chapter's maps by id. OverworldScene reads both on map load (Wave 3, #2).
const MAP_AUDIO: Record<string, { ambience?: AmbienceId; muffle?: 0 | 1 | 2 }> = {
  // CH.3 England — machine-made fog hangs wet over the stone town + the open moor
  foggybottom: { ambience: 'rain' }, // the damp town on the Tyne
  foggy_moor: { ambience: 'wind' }, // the exposed fog road
  the_old_stones: { ambience: 'wind' }, // the Resonance Site, bare to the weather
  wintermoor_grounds: { ambience: 'wind' }, // the academy's windswept grounds
  wintermoor_boiler: { ambience: 'machine', muffle: 2 }, // the Hushed mainframe's room — deep + humming
  // CH.2 South America — the working seafront + the §A6 pyramid depths
  puerto_sol: { ambience: 'waves' },
  pyramid_ante: { ambience: 'cave' },
  // CH.1 USA — the home town park + the busy second city
  otterbrook: { ambience: 'birds' }, // the pond park + civic green + woods nook
  brickton: { ambience: 'crowd' }, // the bigger city's street murmur
  // CH.4 Norway — the fjord hamlet, the exposed moor, the giants' high town, and
  // the deep warm dark inside the Sleeper (the ear sits at DEEP muffle for the boss)
  kvisthavn: { ambience: 'waves' }, // the quay under the cliffs
  bootstep_moor: { ambience: 'wind' }, // the open 10× moor
  lilleby: { ambience: 'wind' }, // the high giants' town
  spine_hand: { ambience: 'cave' },
  spine_shoulder: { ambience: 'cave' },
  spine_ear: { ambience: 'cave', muffle: 2 }, // the Resonance Site, deep in the canal
};
for (const [id, a] of Object.entries(MAP_AUDIO)) {
  const m = MAPS[id];
  if (!m) continue;
  if (a.ambience) m.ambience = a.ambience;
  if (a.muffle !== undefined) m.muffle = a.muffle;
}

// ─── WORLD-OVERHAUL S5 — MAP ATMOSPHERE (opt-in fog veil, #P5) ───────────────
// A per-map atmospheric render layer (OverworldScene.buildFog): a pale veil whose
// density scales with the player's terrace. Central + post-assembly like MAP_AUDIO
// so the fog stays OPT-IN and every OTHER map is byte-identical (only the elevated
// foggybottom sets it). See schemas/index.ts MapDefSchema.atmosphere + elevation.test.
const MAP_ATMOSPHERE: Record<string, 'fog'> = {
  foggybottom: 'fog', // the machine-fog ceiling that sinks with you as you descend the terraces
};
for (const [id, atmosphere] of Object.entries(MAP_ATMOSPHERE)) {
  const m = MAPS[id];
  if (m) m.atmosphere = atmosphere;
}

// ─── Wave 2 (ADR-108) — REFLECTIVE SURFACES (#6) ────────────────────────────
// Tile rects (in tiles) over the maps' water; OverworldScene mirrors nearby actors
// below each surface line (Wave 3). Central + post-assembly like MAP_AUDIO; the
// content-validate `reflect` gate proves every rect is in-bounds AND overlaps a
// reflective (sea) tile, so a grid edit that moves the water fails the build here.
const MAP_REFLECT: Record<string, ReflectZone[]> = {
  foggybottom: [{ x: 0, y: 49, w: 60, h: 3, within: 4 }], // the river Tyne along the S lip (S5 rebuild: 60×52, sea rows 49-51)
  otterbrook: [{ x: 2, y: 136, w: 18, h: 14, within: 3 }], // Pond Park (SW), concept rows 136-150
  golf_resort: [{ x: 23, y: 10, w: 3, h: 3, within: 2 }], // the course's water hazard
  puerto_sol: [{ x: 0, y: 30, w: 52, h: 4, within: 4 }], // the working seafront
  // CH.4 Norway — the fjord, the moor gorge, and the Sleeper's meltwater fall
  kvisthavn: [{ x: 0, y: 22, w: 36, h: 2, within: 4 }], // the fjord along the south lip
  bootstep_moor: [{ x: 22, y: 1, w: 2, h: 7, within: 3 }], // the gorge water
  spine_shoulder: [{ x: 1, y: 5, w: 22, h: 2, within: 3 }], // the meltwater off the shoulder
};
for (const [id, zones] of Object.entries(MAP_REFLECT)) {
  const m = MAPS[id];
  if (m) m.reflect = zones;
}
