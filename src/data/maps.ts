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
import { Grid, treeSolid, treeSprite, doorstepOf } from './mapkit';
import { twotonMap } from './maps_twoton';
import { buildTwotonServiceMaps } from './maps_twoton_interiors';
import { oakRootsMap, oakHollowMap, oakHeartMap } from './maps_oakcave';
import { buildChapter2Maps, valleDorado, PUERTO_SOL_NORTH_GATE } from './maps_ch2';
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
import { buildRoute, buildWoods, Streams } from '../levelkit';
import { placeFacade, facadeDims } from '../levelkit/kit';
import { occupyCity } from './citylife';
import { SETTLEMENT_AMENITIES, cityServiceNpcId } from './city_amenities';
import { promoteFormalCityScale } from './formal_city_scale';
import { AREA_SKINS } from '../spritegen/buildings';
import { CH1_GENERATED_OTTERBROOK_UNIT_IDS, CH1_WORLD } from './maps_ch1';
import { STATIC_CLUNKER_SOLID } from '../engine/vehicle-presentation';

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
  D: 'road_dash', // vertical yellow centre line (N–S roads)
  '_': 'road_dash_h', // horizontal yellow centre line (E–W roads; roadH places it)
  X: 'crosswalk',
  P: 'parking',
  B: 'brick',
  o: 'office_floor',
  O: 'office_wall',
  c: 'cubicle',
  k: 'cubicle_desk',
  Q: 'smile_floor',
  L: 'smile_wall',
  M: 'smile_carpet',
  y: 'sky_day',
  u: 'bus_floor',
  U: 'bus_wall',
  // S7 street wear (ADR-019) — builder-scattered, all walkable
  '1': 'sidewalk_crack',
  '2': 'road_patch',
  '3': 'storm_drain',
  '4': 'manhole', // EB intersection kit: walk-over cover in the carriageway near junctions
  '5': 'horizon_ridge', // EB horizon band: dithered sky over a ridge silhouette (solid vista edge)
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
    if (i % 6 < 3) g.set(x, Math.round((lo + hi) / 2), '_'); // E–W lane → horizontal dash
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
/** the L0 town's height in tiles — grown SOUTHWARD (from the old 102) so there's a real walk
 *  down through town to the chapter road at the very bottom, EarthBound-Onett style. */
export const OTTERBROOK_TOWN_HEIGHT = 132;

/** the grown town's CHAPTER gateway tile — MEADOW MILE (Movement 2) now leaves off the town's
 *  SOUTH edge (matching Onett's south road to Twoson), not the right side. Its x is the south
 *  spine's centre; its y is two rows up from the very bottom (a walkable road tile the return
 *  door lands on). MEADOW MILE's return door + the world/long-walk tests read this const, so the
 *  two sides never drift (ADR-012). (Name kept as *_EAST_GATE to avoid churn across those tests.) */
export const OTTERBROOK_SOUTH_GATE = { x: 55, y: OTTERBROOK_TOWN_BASE + OTTERBROOK_TOWN_HEIGHT - 2 } as const;
/** Compatibility alias for saves/tests and older callers written before the
 *  gate moved from the east edge to the south edge. */
export const OTTERBROOK_EAST_GATE = OTTERBROOK_SOUTH_GATE;
export const OTTERBROOK_TOWN_PREVIEW_SPAWN = { x: 56, y: OTTERBROOK_TOWN_BASE + 34 } as const;
export const OTTERBROOK_DEV_PREVIEW_SPAWN = { x: 54, y: OTTERBROOK_TOWN_BASE + 20 } as const;

const PICNIC_SOLID: { ox: number; oy: number; w: number; h: number } = { ox: 2, oy: 8, w: 32, h: 14 };
const SIGN_SOLID: { ox: number; oy: number; w: number; h: number } = { ox: 3, oy: 10, w: 10, h: 7 };

export const OTTERBROOK_LANDMARK_DIMS: Readonly<Record<string, readonly [number, number]>> = {
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
  // AuthoredWorldPropDisplaySize is 96×99 native px; record its equivalent
  // runtime dimensions here so the unified Otterbrooke scale audit includes
  // the key-gated shed alongside the hi-res facade textures.
  bldg_ob_trail_shed: [384, 396],
  bldg_ob_trail_shed_open: [384, 396],
  bldg_ob_hotel: [269, 384], // OBLIQUE — OTTERBROOKE HOTEL
  // EB SCALE PASS (2026-07-11) — storey-band-cloned tall derivations
  // (tools/derive-tall-facades.ts): the downtown skyline anchors. EB downtown
  // runs 3-6.5 character-heights; 384px was 3 units, these are 4.25-4.5.
  facade_hotel_tall: [269, 576], // OBLIQUE — the 7-storey hotel tower
  facade_apartments_tall: [285, 544], // OBLIQUE — 5-storey brownstone block
  // 27 MAPLE — the FOR-SALE house (ADR-115 made real). A duplicate of the
  // bldg_ob_house_c art under a NON-'bldg_' key: its drawn door sits on the LEFT
  // third (frac ≈ .33), and the prefix keeps occupyCity from grafting a generated
  // unit onto the pre-purchase, doorless lot.
  house_maple: [348, 384], // OBLIQUE (house_c art, left-hand door)
  // The tycoon-teaser storefronts (authored citygen art, scaled up beside the
  // 384px drag): the agency office + Bert's used-car lot.
  facade_realty: [300, 227], // OTTERBROOK REAL ESTATE (door frac ≈ .72)
  facade_autolot: [330, 235], // OTTERBROOK USED CARS (Bert's lot)
};

/**
 * Otterbrooke's exterior scale contract, expressed as per-instance multipliers
 * over the authored facade textures. Jay's runtime frame is 128 px tall; most
 * of the original 384 px facades therefore read as exactly 3.0 Jays, and the
 * short realty/car-lot art read as only 2.2-2.7. This pass moves ordinary homes
 * to 3.75 Jays and gives the civic/downtown anchors a 3.6-5.3 Jay silhouette,
 * while retaining a couple of deliberately low, wide storefronts for rhythm.
 *
 * Keep these named bands centralized: placement, footprint clearing, doors,
 * generated-unit returns, and the scale audit tests all consume the same
 * PropDef.scale rather than maintaining a second visual-only enlargement.
 */
export const OTTERBROOK_BUILDING_SCALE = {
  hillHome: 1.25,
  home: 1.25,
  cottage: 1.20,
  apartment: 1.30,
  civicDepot: 1.16,
  civicTower: 1.18,
  civicInstitution: 1.32,
  civicStation: 1.22,
  civicBrick: 1.25,
  downtownLow: 1.16,
  downtownStore: 1.28,
  downtownBank: 1.40,
  downtownTall: 1.16,
  chapel: 1.35,
  realty: 1.75,
  autoLot: 1.80,
} as const;

function otterbrookResidentialScale(sprite: string): number {
  if (sprite === 'bldg_ob_cottage') return OTTERBROOK_BUILDING_SCALE.cottage;
  if (sprite === 'bldg_apartments' || sprite === 'bldg_ob_apt_green') return OTTERBROOK_BUILDING_SCALE.apartment;
  return OTTERBROOK_BUILDING_SCALE.home;
}

// x = CENTRE col, y = BOTTOM row (the homes front the SOUTH-RES street; doors open south)
const OTTERBROOK_HOME_SPECS = [
  { id: 'otter_home_sodd', name: 'SODD HOUSE', sprite: 'house_a', x: 48, y: 85 },
  { id: 'otter_home_birch', name: 'BIRCH HOUSE', sprite: 'house_b', x: 64, y: 85 },
  { id: 'otter_home_pond', name: 'POND HOUSE', sprite: 'bldg_ob_cottage', x: 30, y: 85 },
] as const;

function otterLandmark(
  sprite: string,
  x: number,
  y: number,
  door?: { to: string; tx: number; ty: number },
  scale = 1,
): PropDef {
  const [tw, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  const p: PropDef = {
    sprite,
    x,
    y,
    solid: { ox: 0, oy: 10, w: Math.max(48, Math.round((tw * scale) / 4)), h: Math.max(48, Math.round((th * scale) / 4) - 10) },
  };
  // EB SCALE PASS (2026-07-11): per-instance scale, the realty/autolot
  // precedent — the runtime multiplies door offsets and rebuilds facade
  // collision from displayWidth/Height, so door metrics stay NATIVE here.
  if (scale !== 1) p.scale = scale;
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
  scale = 1,
): PropDef {
  const [, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  return otterLandmark(sprite, x, bottomTile - (th * scale) / 64, door, scale);
}

/** Enlarge a legacy top-left placement without moving its ground contact or
 * horizontal centre. The hill homes predate otterCentered(), so simply adding
 * PropDef.scale would otherwise grow their walls down across the porch beat. */
function otterLandmarkAtSameFoot(
  sprite: string,
  x: number,
  y: number,
  door: { to: string; tx: number; ty: number } | undefined,
  scale: number,
): PropDef {
  const [tw, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  return otterLandmark(
    sprite,
    x - (tw * (scale - 1)) / 128,
    y - (th * (scale - 1)) / 64,
    door,
    scale,
  );
}

/** place a facade CENTERED horizontally on tile `cx`, its base at row `bottomTile`.
 *  (Facades render at texW·scale/64 tiles wide, so top-left x = cx − halfWidthTiles.)
 *  Used by the concept-faithful layout, where each building's *centre* is read off
 *  the grid. */
function otterCentered(
  sprite: string,
  cx: number,
  bottomTile: number,
  door?: { to: string; tx: number; ty: number },
  scale = 1,
): PropDef {
  const [tw] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
  return otterLandmarkBottom(sprite, cx - (tw * scale) / 128, bottomTile, door, scale);
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
  /** Single tree: canopy is walk-behind; the visible trunk is solid. */
  const dtree = (x: number, y: number): void => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return;
    const sprite = treeSprite(Math.round(x), Math.round(y));
    props.push({ sprite, x, y, solid: treeSolid(sprite) });
  };
  const markFootprint = (sprite: string, cx: number, bottom: number): void => {
    const [tw, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
    const wT = Math.ceil(tw / 64), hT = Math.ceil(th / 64);
    for (let yy = bottom - hT; yy <= bottom; yy++)
      for (let xx = Math.floor(cx - wT / 2) - 1; xx <= Math.ceil(cx + wT / 2) + 1; xx++) occupied.add(idx(xx, yy));
  };
  const wOf = (s: string, scale = 1): number => Math.ceil(((OTTERBROOK_LANDMARK_DIMS[s]?.[0] ?? 320) * scale) / 64);
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
    { s: 'bldg_brickmore' },
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
    { sprite: 'tree_c', x: 11, y: 74, solid: treeSolid('tree_c') }, // the big pond oak
    { sprite: 'hydrant', x: 33.5, y: 54.5, solid: { ox: 2, oy: 6, w: 6, h: 6 } },
    { sprite: 'hydrant', x: 66.5, y: 54.5, solid: { ox: 2, oy: 6, w: 6, h: 6 } },
  );

  // ---- STREET TREES: a tidy, sparse verge along the sidewalks (NOT a forest). ----
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
  ];

  return {
    id: 'otterbrook',
    name: 'OTTERBROOKE, OH',
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
 * band (L0); the wooded hill is authored ABOVE it, joined by K-cliff / T-stair
 * seams (the foggybottom elevation engine). 2026-07-08 (top-right quarter detail
 * pass): the RIGHT climb is a true WINDING UPHILL — four stacked terraces, one
 * switchback leg each, descending L5→L2; the LEFT (cave) corridor stays on the
 * L2 base:
 *
 *   L5 CREST (rows 0-15)   — the meteor CRATER (meteor_rock + the dormant
 *                            Hush-Sentinel husk + the craterScene set-piece),
 *                            reached by the scree zig-zag off flight D.
 *   L4 POLICE BENCH (19-23)— Leg 3 + the muster cordoning flight D's foot.
 *   L3 FIBBINS BENCH (27-33)— Leg 2 past Old Man Fibbins' cottage + dig pen,
 *                            with the HAIRPIN REST (picnic + present, on the
 *                            road at the cliff base) at flight C's bend.
 *   L2 BASE (rows 37-44)   — Leg 1 along the low treeline. The CAVE corridor
 *                            (mower lane, key-gated shed, top-left-corner cave
 *                            shelf, all L2) is a SEPARATE far-west section —
 *                            the x28-39 band stays solid woods the full hill
 *                            height, detaching it from the climb (2026-07-09).
 *   L1 TERRACE (rows 49-60)— Jay's (house_rex, the opening) + Chad's houses, the
 *                            porch beat, the lemonade twins, the sniff-trail head.
 *   L0 TOWN (rows 66+)     — the town (buildOtterbrookTown), offset down.
 *
 * The 4 old climb maps (hill_road/hickory_trail/whisperwood_rise/hickory_hill) are
 * RETIRED, their content re-homed here. The Under-Oak has a lower-town return
 * beside the rebuilt streets so cave saves do not strand the camera on the crest.
 * ELEVATED_ALLOWLIST + maps_otterbrook.test.ts guard the elevation plane.
 */
function buildOtterbrookTownReplica(): MapDef {
  const W = 112;
  const H = OTTERBROOK_TOWN_HEIGHT; // grown southward for the long approach to the south chapter gate
  const g = new Grid(W, H, '.');
  const props: PropDef[] = [];
  const generatedTrees: PropDef[] = [];
  const occupied = new Set<number>();
  const idx = (x: number, y: number): number => y * W + x;
  const grassLike = (x: number, y: number): boolean => ' .,~fF'.includes(g.rows[y]?.[x] ?? '#');

  g.sprinkle(7, ',~,~ff F', 0.05);
  g.rect(0, 0, 6, H, 'b');
  g.rect(W - 6, 0, 6, H, 'b');
  g.rect(0, H - 3, W, 3, 'b');

  const dtree = (x: number, y: number): void => {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return;
    const sprite = treeSprite(Math.round(x), Math.round(y));
    const solid = treeSolid(sprite);
    // Tree coordinates anchor the canopy's top-left, but the trunk lands one to
    // two cells farther south. Validate the actual trunk cells so a decorative
    // verge tree cannot put invisible collision on a road, path, pond, or facade.
    const left = x * 16 + solid.ox;
    const top = y * 16 + solid.oy;
    const right = left + solid.w;
    const bottom = top + solid.h;
    for (let ty = Math.floor(top / 16); ty <= Math.floor((bottom - 0.001) / 16); ty++) {
      for (let tx = Math.floor(left / 16); tx <= Math.floor((right - 0.001) / 16); tx++) {
        if (!grassLike(tx, ty) || occupied.has(idx(tx, ty))) return;
      }
    }
    generatedTrees.push({ sprite, x, y, solid });
  };
  const markFootprint = (sprite: string, cx: number, bottom: number, scale = 1): void => {
    const [tw, th] = OTTERBROOK_LANDMARK_DIMS[sprite] ?? [320, 320];
    const wT = Math.ceil((tw * scale) / 64);
    const hT = Math.ceil((th * scale) / 64);
    const x0 = Math.max(0, Math.floor(cx - wT / 2) - 1);
    const x1 = Math.min(W - 1, Math.ceil(cx + wT / 2) + 1);
    const y0 = Math.max(0, bottom - hT - 1);
    const y1 = Math.min(H - 1, bottom + 1);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) occupied.add(idx(xx, yy));
  };
  const wOf = (s: string, scale = 1): number => Math.ceil(((OTTERBROOK_LANDMARK_DIMS[s]?.[0] ?? 320) * scale) / 64);
  const yarded: Array<{ cx: number; bottom: number; w: number }> = [];
  const build = (
    s: string,
    cx: number,
    bottom: number,
    door?: { to: string; tx: number; ty: number },
    openFlag?: string,
    scale = 1,
  ): void => {
    const facade = otterCentered(s, cx, bottom, door, scale);
    if (door && openFlag) {
      props.push({ ...otterCentered(s, cx, bottom, undefined, scale), unlessFlag: openFlag });
      props.push({ ...facade, ifFlag: openFlag });
    } else {
      props.push(facade);
    }
    markFootprint(s, cx, bottom, scale);
    if (/^(house_|bldg_ob_house|bldg_ob_cottage)/.test(s)) yarded.push({ cx, bottom, w: wOf(s, scale) + 7 });
  };
  const line = (n: number, v: number): number[] => Array.from({ length: n }, () => v);
  const gentleCurve = (n: number, base: number, arc: number): number[] =>
    Array.from({ length: n }, (_, i) => Math.round(base + Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc));
  // capture each primary lane's spine so lane markings (dashed centerline + edge sidewalks) can be
  // RE-ASSERTED after the occupied-clearing + connect + door-walk passes strip them (the cause of the
  // "roads have no proper lines" — only ~11% of carriageway kept a centerline before this).
  // 2026-07-09 polish: formal Civic/Main/the story spine stay straight for navigation;
  // residential lanes use one-tile deliberate bows. This breaks the subdivision-grid
  // silhouette without the old every-cell wiggle that read as surveyor error.
  const hRoadSpecs: Array<{ ys: number[]; xLeft: number }> = [];
  const vRoadSpecs: Array<{ xs: number[]; yTop: number }> = [];
  const hRoad = (center: number | number[], x: number, len: number): void => {
    const ys = typeof center === 'number' ? line(len, center) : center;
    roadH(g, ys, x, 4);
    hRoadSpecs.push({ ys, xLeft: x });
  };
  const vRoad = (center: number | number[], y: number, len: number): void => {
    const xs = typeof center === 'number' ? line(len, center) : center;
    roadV(g, xs, y, 4);
    vRoadSpecs.push({ xs, yTop: y });
  };
  // re-draw the dashed yellow centerlines (D/_) + the flanking sidewalks (=) on every primary lane —
  // replicates roadH/roadV's own centre/edge math EXACTLY, only overwriting cells that are still road
  // (so a building that occludes a lane keeps its clean break, but the open carriageway reads as a
  // proper marked street instead of blank asphalt).
  const paintLaneMarkings = (): void => {
    const HALF = 2;
    for (const { ys, xLeft } of hRoadSpecs) {
      for (let i = 0; i < ys.length; i++) {
        const x = xLeft + i;
        const next = ys[Math.min(i + 1, ys.length - 1)];
        const lo = Math.min(ys[i], next) - HALF;
        const hi = Math.max(ys[i], next) + (4 - 1 - HALF);
        if (i % 6 < 3) { const cy = Math.round((lo + hi) / 2); if (at(x, cy) === 'R') g.set(x, cy, '_'); }
        if (grassLike(x, lo - 1)) g.set(x, lo - 1, '=');
        if (grassLike(x, hi + 1)) g.set(x, hi + 1, '=');
      }
    }
    for (const { xs, yTop } of vRoadSpecs) {
      for (let i = 0; i < xs.length; i++) {
        const y = yTop + i;
        const next = xs[Math.min(i + 1, xs.length - 1)];
        const lo = Math.min(xs[i], next) - HALF;
        const hi = Math.max(xs[i], next) + (4 - 1 - HALF);
        if (i % 4 < 2) { const cx = Math.round((lo + hi) / 2); if (at(cx, y) === 'R') g.set(cx, y, 'D'); }
        if (grassLike(lo - 1, y)) g.set(lo - 1, y, '=');
        if (grassLike(hi + 1, y)) g.set(hi + 1, y, '=');
      }
    }
  };
  const yardFence = ({ cx, bottom, w }: { cx: number; bottom: number; w: number }): void => {
    const y = bottom + 1;
    const left = Math.max(1, Math.round(cx - w / 2));
    const right = Math.min(W - 2, Math.round(cx + w / 2));
    const gateL = Math.round(cx - 1);
    const gateR = Math.round(cx + 1);
    for (let x = left; x <= right; x++) {
      if (x >= gateL && x <= gateR) continue;
      if (grassLike(x, y)) g.set(x, y, '-');
    }
    const sideBottom = Math.min(H - 4, y + 5);
    for (const x of [left, right]) for (let yy = y + 1; yy <= sideBottom; yy++) if (grassLike(x, yy)) g.set(x, yy, '|');
    const backY = Math.max(1, bottom - 7);
    for (let x = left + 1; x <= right - 1; x++) if (grassLike(x, backY)) g.set(x, backY, '-');
  };
  const at = (x: number, y: number): string => g.rows[y]?.[x] ?? '#';
  const keyOf = (x: number, y: number): number => y * W + x;
  const xyOf = (key: number): [number, number] => [key % W, Math.floor(key / W)];
  const inBounds = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
  const roadChar = (c: string): boolean => c === 'R' || c === 'D' || c === '_';
  const streetChar = (c: string): boolean => roadChar(c) || c === '=' || c === ':' || c === 'X' || c === 'P';
  const pathBlocker = (x: number, y: number): boolean => {
    if (!inBounds(x, y)) return true;
    if (occupied.has(idx(x, y))) return true;
    return 'beE|-KHBJVZCY'.includes(at(x, y));
  };
  const roadComponents = (): number[][] => {
    const seen = new Set<number>();
    const comps: number[][] = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const start = keyOf(x, y);
        if (!roadChar(at(x, y)) || seen.has(start)) continue;
        const q = [start];
        const comp: number[] = [];
        seen.add(start);
        for (let i = 0; i < q.length; i++) {
          const key = q[i];
          comp.push(key);
          const [cx, cy] = xyOf(key);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = cx + dx;
            const ny = cy + dy;
            const nk = keyOf(nx, ny);
            if (!inBounds(nx, ny) || seen.has(nk) || !roadChar(at(nx, ny))) continue;
            seen.add(nk);
            q.push(nk);
          }
        }
        comps.push(comp);
      }
    }
    return comps.sort((a, b) => b.length - a.length);
  };
  const findPath = (starts: number[], goal: (key: number) => boolean, allow: (x: number, y: number, key: number) => boolean): number[] => {
    const q = starts.filter((key) => {
      const [x, y] = xyOf(key);
      return inBounds(x, y);
    });
    const prev = new Map<number, number>();
    for (const key of q) prev.set(key, -1);
    for (let i = 0; i < q.length; i++) {
      const key = q[i];
      if (goal(key)) {
        const out: number[] = [];
        for (let k = key; k >= 0; k = prev.get(k) ?? -1) out.push(k);
        return out.reverse();
      }
      const [cx, cy] = xyOf(key);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = cx + dx;
        const ny = cy + dy;
        const nk = keyOf(nx, ny);
        if (prev.has(nk) || !allow(nx, ny, nk)) continue;
        prev.set(nk, key);
        q.push(nk);
      }
    }
    return [];
  };
  const paintRoadCell = (x: number, y: number): void => {
    if (pathBlocker(x, y)) return;
    g.set(x, y, 'R');
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (!pathBlocker(nx, ny) && grassLike(nx, ny)) g.set(nx, ny, '=');
    }
  };
  const connectRoadFragments = (): void => {
    let comps = roadComponents();
    if (comps.length <= 1) return;
    const connected = new Set(comps[0]);
    for (const comp of comps.slice(1)) {
      if (comp.length < 4) continue;
      const path = findPath(
        comp,
        (key) => connected.has(key),
        (x, y, key) => connected.has(key) || roadChar(at(x, y)) || !pathBlocker(x, y),
      );
      for (const key of path) {
        const [x, y] = xyOf(key);
        paintRoadCell(x, y);
        connected.add(key);
      }
      for (const key of comp) connected.add(key);
    }
    comps = roadComponents();
    if (comps.length > 1) {
      // One more pass catches any fragments whose shortest route used road painted earlier.
      const merged = new Set(comps[0]);
      for (const comp of comps.slice(1)) {
        const path = findPath(comp, (key) => merged.has(key), (x, y, key) => merged.has(key) || roadChar(at(x, y)) || !pathBlocker(x, y));
        for (const key of path) {
          const [x, y] = xyOf(key);
          paintRoadCell(x, y);
          merged.add(key);
        }
        for (const key of comp) merged.add(key);
      }
    }
  };
  // ── DOORSTEP WALKS + DRIVEWAYS (2026-07-08 polish) ───────────────────────────
  // Every building gets a paved approach: a 3-wide cement walk dropping straight
  // from its door to the street it fronts, and select homes a two-cell asphalt spur
  // for one parked car. Driveways deliberately cut through the curb cell so they
  // join the carriageway instead of reading as detached, bright sidewalk slabs.
  // Both are painted AFTER the occupied-clearing pass (which would erase them).
  const doorWalks: Array<{ col: number; from: number }> = [];
  const driveways: Array<{ x: number; from: number; dir: 1 | -1 }> = [];
  const paveDown = (x0: number, w: number, from: number): void => {
    for (let y = from; y < H - 1; y++) {
      let hitStreet = false;
      for (let x = x0; x < x0 + w; x++) {
        if (streetChar(at(x, y))) hitStreet = true;
        else if (grassLike(x, y)) g.set(x, y, '=');
      }
      if (hitStreet) return; // merged into the fronting street
    }
  };
  const paveDriveway = ({ x, from, dir }: { x: number; from: number; dir: 1 | -1 }): void => {
    // Eight cells is a hard guard against a missing/fronted-on-the-wrong-side
    // street turning a domestic driveway into a stripe across the whole map.
    for (let y = from, steps = 0; y > 0 && y < H - 1 && steps < 8; y += dir, steps++) {
      let hitStreet = false;
      for (let xx = x; xx < x + 2; xx++) {
        const c = at(xx, y);
        if (roadChar(c) || c === 'X' || c === 'P' || c === ':') {
          hitStreet = true;
          continue;
        }
        if (c === '=' || grassLike(xx, y)) g.set(xx, y, 'R');
        else return;
      }
      if (hitStreet) return;
    }
  };
  const paintApproaches = (): void => {
    for (const wk of doorWalks) paveDown(wk.col - 1, 3, wk.from);
    for (const dv of driveways) paveDriveway(dv);
  };
  // Intersection cleanup: roadV/roadH stamp their edge sidewalks straight through
  // each other's asphalt. A crossing sidewalk often has only TWO adjacent road
  // cells (one on each side), so the old 3-neighbour heuristic left bright white
  // stripes through the carriageway. Fold any sidewalk that bridges road on both
  // sides back into asphalt, then retain the 3-neighbour corner catch-all.
  const fixJunctions = (): void => {
    const paved = (x: number, y: number): boolean => 'RD_XP2'.includes(at(x, y));
    // Conversion can expose the bridge relationship for the next sidewalk cell
    // in a two-cell band, so settle to a fixed point instead of depending on scan order.
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          if (at(x, y) !== '=') continue;
          const bridgesHorizontal =
            [1, 2].some((d) => paved(x - d, y)) && [1, 2].some((d) => paved(x + d, y));
          const bridgesVertical =
            [1, 2].some((d) => paved(x, y - d)) && [1, 2].some((d) => paved(x, y + d));
          let n = 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (paved(x + dx, y + dy)) n++;
          if (bridgesHorizontal || bridgesVertical || n >= 3) {
            g.set(x, y, 'R');
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
  };
  // Planned street details only. The former hash-scatter changed otherwise
  // identical sidewalk/road cells into seemingly random tiles; these storm drains
  // are deliberate landmarks at major junction curbs instead.
  const weatherStreets = (): void => {
    // Storm drains where the big junction curbs meet.
    for (const [x, y] of [[51, 58], [59, 63], [21, 33], [91, 63], [51, 93], [58, 88]] as const) {
      if (at(x, y) === '=') g.set(x, y, '3');
    }
  };

  // a home = a fenced yard two lawn rows off its street + a cement walk to the door
  const walk = (col: number, from: number): void => { doorWalks.push({ col: Math.round(col), from }); };
  const drive = (x: number, from: number, dir: 1 | -1 = 1): void => { driveways.push({ x, from, dir }); };
  const home = (s: string, cx: number, bottom: number, door?: { to: string; tx: number; ty: number }): void => {
    build(s, cx, bottom, door, undefined, otterbrookResidentialScale(s));
    walk(cx, bottom + 1);
  };
  const markRect = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let yy = Math.max(0, y0); yy <= Math.min(H - 1, y1); yy++)
      for (let xx = Math.max(0, x0); xx <= Math.min(W - 1, x1); xx++) occupied.add(idx(xx, yy));
  };

  // ===== BUILDINGS (2026-07-08 street redesign) — every lot fronts the street to
  // its SOUTH: shops/civic sit FLUSH on the sidewalk, homes sit two lawn rows back
  // behind a fenced yard. The column plan keeps every footprint clear of every
  // carriageway (verticals x20/x55/x92 north of Main, x38/x55/x74 south of it), so
  // the erase pass never punches a hole in a street again. =====
  // NORTH RES ST (row 16) — the hill trails drop in between the lots
  home('house_a', 12, 10);
  home('house_b', 34, 10);
  drive(39, 12);
  home('bldg_ob_house_c', 66, 10);
  drive(71, 12);
  home('bldg_ob_house_green', 80, 10);
  build('bldg_apartments', 100, 12, undefined, undefined, OTTERBROOK_BUILDING_SCALE.apartment);
  // CIVIC ST (row 31) — depot, city hall (plaza on the corner), police, hospital
  build('facade_busdepot', 29, 27, { to: 'bus_depot_int', tx: 120, ty: 128 }, undefined, OTTERBROOK_BUILDING_SCALE.civicDepot);
  // The hotel belongs to the CITY: its narrow landmark facade fills the central
  // Civic Street gap between the depot and City Hall, not the remote east fringe
  // (and never the hill/cave band). doorstepOf() derives the reciprocal lobby exit
  // from this door, so moving the facade keeps the interior round-trip exact.
  // EB SCALE PASS (2026-07-11): the hotel is now the 7-STOREY TOWER
  // (facade_hotel_tall, 4.5 character-units) — Onett's hotel looms over its
  // town, ours finally does too. Its 9-row image reaches past North Res St,
  // so the footprint is marked BY HAND from row 20 down (a full markFootprint
  // would put North Res's carriageway inside the occupied-clear and punch
  // permanent holes in the asphalt — the G1 trap). The image overlapping the
  // street above is the normal EB walk-behind read.
  props.push(otterCentered('facade_hotel_tall', 39, 27, { to: 'otter_hotel_lobby', tx: 9 * 16 + 8, ty: 10 * 16 + 12 }, OTTERBROOK_BUILDING_SCALE.civicTower));
  for (let yy = 20; yy <= 28; yy++) for (let xx = 35; xx <= 43; xx++) occupied.add(idx(xx, yy));
  // City Hall + clinic are the broad four-Jay civic anchors. Their 1.32× crowns
  // can overlap the distant residential lane visually, while markFootprint still
  // stops at the Civic lot and preserves the road as a walk-behind strip.
  build('bldg_ob_city_hall', 46, 27, { to: 'otterbrook_cityhall', tx: 120, ty: 128 }, undefined, OTTERBROOK_BUILDING_SCALE.civicInstitution);
  build('facade_otter_station', 64, 27, { to: 'otter_station', tx: 120, ty: 128 }, undefined, OTTERBROOK_BUILDING_SCALE.civicStation);
  build('bldg_ob_clinic', 76, 27, { to: 'otter_clinic_int', tx: 120, ty: 128 }, undefined, OTTERBROOK_BUILDING_SCALE.civicInstitution);
  build('bldg_brickmore', 88, 27, undefined, undefined, OTTERBROOK_BUILDING_SCALE.civicBrick);
  // ORCHARD ST (row 46) — residential
  home('bldg_ob_house_green', 12, 40);
  home('house_a', 27, 40);
  drive(32, 40);
  home('bldg_ob_cottage', 44, 40);
  drive(50, 40);
  home('house_b', 66, 40);
  drive(71, 40);
  home('bldg_ob_house_c', 80, 40);
  home('house_a', 99, 40);
  // MAIN ST (row 61) — the downtown drag, gas pump to used-car lot, shops flush on
  // the pavement with a metered parking lane out front. EB STREET-WALL massing
  // (2026-07-11): the core storefronts butt into two CONTINUOUS blocks flanking
  // the spine (gaps ≤ ~1 tile, party-wall style, like Onett's drag) instead of
  // detached lots — only the gas station keeps its forecourt air at the west end.
  // EB SCALE PASS (2026-07-11): the ON-STREET buildings themselves grow to
  // EB's building-to-character ratios (Onett's smallest storefront is ~3.1
  // character-units, its anchors 4-6.5). Per-instance scale, the realty/
  // autolot precedent — doors/collision are texture-true at runtime. The
  // hardware store and the gas station deliberately stay low (EB's rhythm
  // keeps one wide low unit per block).
  build('facade_fillshop', 12, 57, { to: 'diner_int', tx: 120, ty: 128 }, 'tick_defeated', OTTERBROOK_BUILDING_SCALE.downtownLow);
  build('bldg_ob_burger', 31.5, 57, { to: 'burger_int', tx: 96, ty: 118 }, 'tick_defeated', OTTERBROOK_BUILDING_SCALE.downtownStore);
  build('bldg_bank', 38.8, 57, { to: 'bank_int', tx: 96, ty: 118 }, 'tick_defeated', OTTERBROOK_BUILDING_SCALE.downtownBank);
  build('facade_hardware', 48.4, 57, { to: 'hardware_int', tx: 120, ty: 128 }, undefined, OTTERBROOK_BUILDING_SCALE.downtownLow);
  // Bakery steps ONE ROW FORWARD (foot 58, on the promenade): its parapet and
  // party wall y-sort OVER the drugstore's corner — EB's stepped-storefront
  // stacking, not a flat row of shops sharing one baseline.
  build('bldg_ob_bakery', 61, 58, { to: 'bakery_int', tx: 96, ty: 118 }, 'tick_defeated', OTTERBROOK_BUILDING_SCALE.downtownStore);
  build('drugstore', 67.5, 57, { to: 'drugstore_int', tx: 112, ty: 118 }, undefined, OTTERBROOK_BUILDING_SCALE.downtownStore);
  build('arcade', 74.5, 57, { to: 'arcade_int', tx: 80, ty: 102 }, 'tick_defeated', OTTERBROOK_BUILDING_SCALE.downtownStore);
  // EB SCALE + STACKING PASS (2026-07-11): the BACK RANK — tall doorless masses
  // on the block interior between Orchard and Main, their lower storeys hidden
  // behind the storefront row (true y-sort layering) and their towers breaking
  // the skyline above it, the way Onett's hotel looms over the drag. Deliberate
  // NO markFootprint: the occupied-clear would punch holes in Orchard St's
  // carriageway; instead the towers simply rise in front of its south edge and
  // the walk-behind read (player occluded on that short stretch) is the
  // EarthBound norm. Collision comes from facadeSolids (texture-true), which
  // narrows but never severs Orchard.
  props.push(otterCentered('facade_apartments_tall', 36, 53, undefined, OTTERBROOK_BUILDING_SCALE.downtownTall)); // over the burger/bank party line
  props.push(otterCentered('facade_hotel_tall', 70, 53, undefined, OTTERBROOK_BUILDING_SCALE.downtownTall)); // the tower over drugstore/arcade
  props.push(otterCentered('facade_apartments_tall', 83.5, 53, undefined, OTTERBROOK_BUILDING_SCALE.downtownTall)); // brownstone above the realty row
  // POND ST (row 76) — residential east of the park
  home('house_b', 48, 70);
  home('bldg_ob_house_green', 63, 70);
  drive(68, 71);
  home('house_a', 82, 70);
  drive(87, 71);
  home('bldg_ob_house_c', 100, 70);
  // SOUTH RES ST (row 91) — the named/visitable homes + the chapel
  for (const h of OTTERBROOK_HOME_SPECS) home(h.sprite, h.x, h.y, { to: h.id, tx: 7 * 16 + 8, ty: 8 * 16 });
  drive(69, 85);
  build('chapel', 86, 85, { to: 'chapel_int', tx: 88, ty: 150 }, undefined, OTTERBROOK_BUILDING_SCALE.chapel);
  walk(86, 86);
  // MAPLE ST (row 106) — the FOR-SALE block on the quiet west cul-de-sac
  home('house_b', 35, 100);
  home('house_a', 66, 100);
  home('bldg_ob_house_green', 87, 100);
  // This east-facing lot meets Eastbrook Ave to its NORTH. The old southbound
  // painter never found a street and laid a two-wide sidewalk to the map border.
  drive(92, 96, -1);
  // SOUTH APPROACH — one memorable final block, then the chapter road. The old
  // second cross-street added twenty empty rows and made the first town feel like
  // a planning grid rather than a compact SNES caricature.
  home('bldg_ob_house_green', 66, 122);

  // ── 27 MAPLE (ADR-115 made real) — the Onett for-sale house. The lot is real
  // from hour one: FOR-SALE sign, fenced yard, the art's LEFT-hand door. The DOOR
  // ZONE exists only once the deed is yours (owned_27_maple) — before that the
  // house is locked up tight and the agent's pitch stays honest; after, it's the
  // first thing the player has ever owned with a roof.
  const M27 = { cx: 17, bottom: 100 };
  const mapleScale = OTTERBROOK_BUILDING_SCALE.home;
  const m27 = otterCentered('house_maple', M27.cx, M27.bottom, undefined, mapleScale);
  props.push({ ...m27, unlessFlag: 'owned_27_maple' });
  props.push({
    ...m27,
    door: { ox: Math.round((348 / 4) * 0.33) - 8, oy: 96 - 22, w: 16, h: 20, to: 'maple27_int', tx: 7 * 16 + 8, ty: 8 * 16 },
    ifFlag: 'owned_27_maple',
  });
  markFootprint('house_maple', M27.cx, M27.bottom, mapleScale);
  yarded.push({ cx: M27.cx, bottom: M27.bottom, w: wOf('house_maple', mapleScale) + 7 });
  walk(M27.cx - 1, M27.bottom + 1); // the walk meets the drawn door (left third)
  drive(20, 101);
  // 29 MAPLE (the Fixer) — the flip listing next door is an honest MESS: a fenced
  // empty lot, waist-high weeds, a sawhorse, and a sign doing a lot of work.
  markRect(23, 95, 31, 102);
  g.rect(23, 96, 9, 1, '-');
  g.rect(23, 102, 3, 1, '-');
  g.rect(29, 102, 3, 1, '-');
  for (const yy of [97, 98, 99, 100, 101]) { g.set(23, yy, '|'); g.set(31, yy, '|'); }
  for (const [wx, wy, wc] of [[25, 98, '~'], [27, 97, 'f'], [29, 99, '~'], [26, 100, ','], [28, 101, '~'], [30, 97, ',']] as const) g.set(wx, wy, wc);

  // ── OTTERBROOK REALTY + BERT'S USED CARS — the ADR-115 tycoon-teaser pair get
  // real street addresses (authored citygen facades, now raised to full
  // three-Jay storefront height beside the 384px drag). The agency door opens into the office where the agent
  // now works; Bert holds court on his lot out front of the bunting.
  // EB street-wall massing: the pair slides west to butt against the arcade so
  // the east block reads as one continuous storefront row (Bert's lot keeps a
  // touch of air for the bunting/stock out front).
  const realtyFacade: PropDef = {
    sprite: 'facade_realty',
    x: 81 - ((300 / 64) * OTTERBROOK_BUILDING_SCALE.realty) / 2,
    y: 57 - (227 / 64) * OTTERBROOK_BUILDING_SCALE.realty,
    scale: OTTERBROOK_BUILDING_SCALE.realty,
    solid: {
      ox: 0,
      oy: 10,
      w: Math.round((300 / 4) * OTTERBROOK_BUILDING_SCALE.realty),
      h: Math.round((227 / 4) * OTTERBROOK_BUILDING_SCALE.realty) - 10,
    },
    door: { ox: Math.round(75 * 0.72) - 8, oy: Math.round(227 / 4) - 22, w: 16, h: 22, to: 'realty_int', tx: 6 * 16 + 8, ty: 7 * 16 },
  };
  const { door: _realtyDoor, ...closedRealtyFacade } = realtyFacade;
  props.push({ ...closedRealtyFacade, unlessFlag: 'tick_defeated' });
  props.push({ ...realtyFacade, ifFlag: 'tick_defeated' });
  markRect(76, 50, 86, 58);
  props.push({
    sprite: 'facade_autolot',
    x: 91 - ((330 / 64) * OTTERBROOK_BUILDING_SCALE.autoLot) / 2,
    y: 57 - (235 / 64) * OTTERBROOK_BUILDING_SCALE.autoLot,
    scale: OTTERBROOK_BUILDING_SCALE.autoLot,
    solid: {
      ox: 0,
      oy: 10,
      w: Math.round((330 / 4) * OTTERBROOK_BUILDING_SCALE.autoLot),
      h: Math.round((235 / 4) * OTTERBROOK_BUILDING_SCALE.autoLot) - 10,
    },
  });
  markRect(86, 50, 96, 58);

  // ===== THE STREET NETWORK — readable but not ruler-flat. Every lane ends AT
  // another street (a T-junction), the map gate, or a destination lot — no more
  // stubs wandering into the treeline. The MAIN AVENUE (x55) is the meteorite
  // trail itself continuing down through town to the chapter gate: one readable
  // spine from the crater to Meadow Mile. =====
  g.rect(25, 0, 4, 17, ':'); // W hill trail → North Res St
  g.rect(54, 0, 4, 17, ':'); // E hill trail → the spine's north end
  hRoad(gentleCurve(77, 16, 1), 18, 77); // NORTH RES ST — shallow south bow
  hRoad(31, 18, 77); // CIVIC ST
  hRoad(gentleCurve(77, 46, -1), 18, 77); // ORCHARD ST — opposing garden bend
  hRoad(61, 8, 96); // MAIN ST — full drag, gas pump (W) to used-car lot (E)
  hRoad(gentleCurve(52, 76, 1), 43, 52); // POND ST curls around the park lawn
  hRoad(gentleCurve(77, 91, -1), 18, 77); // SOUTH RES ST (hammerhead turnaround under the pond, W)
  hRoad(gentleCurve(68, 106, 1), 12, 68); // MAPLE ST (west cul-de-sac → School Ave)
  hRoad(128, 50, 27); // SOUTH CROSS — east lane off the spine
  vRoad(gentleCurve(50, 20, 1), 13, 50); // WEST END AVE (North Res → Main)
  vRoad(gentleCurve(81, 92, -1), 13, 81); // EASTBROOK AVE (North Res → South Res)
  vRoad(gentleCurve(51, 42, -1), 58, 51); // MILL AVE arcs away from Pond Park
  vRoad(gentleCurve(51, 74, 1), 58, 51); // SCHOOL AVE mirrors Mill
  vRoad(55, 12, H - 12); // THE SPINE — hill trail → Main → chapter gate
  // Maple St's west cul-de-sac bulb (the quiet end by the park — 27 Maple's kerb)
  g.rect(8, 102, 1, 6, '=');
  g.rect(9, 102, 3, 1, '=');
  g.rect(9, 108, 3, 1, '=');
  g.rect(9, 103, 3, 5, 'R');
  // South Res St's western hammerhead turnaround (the park-side dead end done right)
  g.rect(14, 88, 1, 5, '=');
  g.rect(15, 87, 3, 1, '=');
  g.rect(15, 93, 3, 1, '=');
  g.rect(15, 88, 3, 5, 'R');
  // matching turnaround where the south cross-lane ends past its last home. Keep
  // its bottom curb one row INSIDE the map so it cannot punch a second exit through
  // the forest border beside the chapter gate.
  g.rect(80, 125, 1, 5, '=');
  g.rect(77, 124, 3, 1, '=');
  g.rect(77, 130, 3, 1, '=');
  g.rect(77, 125, 3, 5, 'R');

  for (const key of occupied) {
    const x = key % W;
    const y = (key - x) / W;
    const c = g.rows[y]?.[x];
    if (c === 'R' || c === '=' || c === 'D' || c === '_' || c === 'P' || c === 'X') g.set(x, y, '.');
  }

  // POND PARK (unchanged footprint — the reflect pin reads these rows)
  g.rect(2, 66, 18, 16, 'e');
  g.rect(2, 65, 18, 1, 'E');
  g.rect(2, 82, 18, 1, 'E');
  g.rect(1, 66, 1, 16, 'E');
  g.rect(20, 66, 1, 16, 'E');
  g.rect(22, 64, 16, 22, '.');
  // CITY HALL POCKET PLAZA (spine × Civic St corner): paved apron, fountain, benches
  g.rect(59, 34, 10, 6, '=');
  g.rect(61, 36, 6, 3, '.');
  // metered PARKING LANE along Main St's north kerb, in front of both shop blocks
  for (let x = 29; x <= 51; x++) if (g.rows[59][x] === 'R') g.set(x, 59, 'P');
  for (let x = 58; x <= 93; x++) if (g.rows[59][x] === 'R') g.set(x, 59, 'P');
  // CROSSWALKS at the spine's big junctions (centre rows/cols only, so the road
  // graph — and the one-component law — stays contiguous through the paint)
  for (const [x, y, w, h] of [
    [49, 60, 3, 2], [59, 60, 2, 2], [54, 56, 3, 2], [54, 64, 3, 2], // Main × spine
    [50, 30, 2, 2], [59, 30, 2, 2], // Civic × spine
    [50, 90, 2, 2], [59, 90, 2, 2], // South Res × spine
  ] as const) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (roadChar(at(xx, yy))) g.set(xx, yy, 'X');
  }
  paintApproaches(); // door walks + driveways (after the clear pass, before fences)
  connectRoadFragments(); // safety net — the plan above is already one component
  for (const y of yarded) yardFence(y);
  paintLaneMarkings(); // restore centerlines + sidewalks stripped by the clear/connect passes
  // re-assert the park LAWN: fence/marking passes may not paint over water, but the
  // pond-house back fence + stray sidewalk re-adds CAN land on the lawn — the park
  // interior stays pure grass (props carry the gazebo/swings/picnic)
  g.rect(22, 64, 16, 22, '.');
  g.rect(21, 64, 2, 2, ':'); // the park entrance footpath off Main's south walk
  // Restore the north curb as a compact HOTEL FORECOURT after the occupied-lot
  // clear pass. It stays a single sidewalk row, so Civic Street's carriageway and
  // the map's road/elevation topology are unchanged.
  g.rect(35, 28, 8, 1, '=');
  // ===== DOWNTOWN PROMENADE (EB Onett main-street read): the shop drag gets a
  // TWO-TILE sidewalk. EarthBound's downtown pavement is a broad walkable plane
  // the storefronts stand ON — a 1-tile ribbon reads as trim, not a sidewalk.
  // North: the shop FOOT row (57) becomes pavement, so buildings front the walk
  // and the gaps between facades show paving instead of lawn moats. South: a
  // second row (64) along the drag — skipping the Pond Park lawn frontage
  // (x<39), which stays grass like Onett's park side. grassLike-guarded, so the
  // carriageway/junction topology and the one-component road law are untouched.
  for (let x = 8; x <= 96; x++) if (grassLike(x, 57)) g.set(x, 57, '=');
  for (let x = 39; x <= 96; x++) if (grassLike(x, 64)) g.set(x, 64, '=');
  fixJunctions();
  weatherStreets();
  // EB INTERSECTION KIT — manhole covers ('4') just off the big junctions, the
  // way EarthBound dresses every crossing. Walk-over street decals; guarded to
  // plain 'R' cells so no dash/crosswalk/parking cell (or the lane graph) is
  // touched, and mid-lane on 4-wide roads so the one-component law holds.
  for (const [mx, my] of [
    [48, 60], // Main St, west of the spine junction
    [63, 62], // Main St, east of the spine junction
    [54, 45], // the spine between Civic and Main
    [54, 78], // the spine below Pond St
  ] as const) {
    if (at(mx, my) === 'R') g.set(mx, my, '4');
  }

  // ===== EB DOWNTOWN TERRACE (Batch D, 2026-07-11): the block interiors
  // between Orchard and Main rise ONE level — the back-rank towers stand on a
  // bluff overlooking the drag, its tan cliff face showing between the
  // storefronts, with one stair flight down per block (Onett's terraced
  // downtown). Seam grammar mirrors the hill: '^' lip row (upper, walkable) →
  // 'K' face row (solid) → town; every walkable E/W/N seam is buffered with
  // solid treeline 'b' so no invisible ledge exists. growOtterbrook's level
  // plane raises the same rectangles (rows 49-53 → L1; face row 54: K upper,
  // 'T' lower — the seam-B stair convention).
  const walkable = (x: number, y: number): boolean => ' .,~fF:'.includes(at(x, y));
  for (const t of [
    // block-interior spans only — clear of West End Ave (~x20), the spine
    // (x52-57) and Eastbrook Ave (~x91), which all cross these rows
    { x0: 26, x1: 49 }, // west block interior (behind burger/bank/hardware)
    { x0: 60, x1: 86 }, // east block interior (behind bakery→the arcade row)
  ]) {
    // buffers FIRST (columns + north row), then the lip strictly inside them —
    // a '^' landing on a buffer cell would leave a walkable L1 edge cell
    // side-by-side with L0 grass (the invisible-ledge law).
    for (const y of [49, 50, 51, 52, 53]) {
      if (walkable(t.x0, y)) g.set(t.x0, y, 'b'); // west buffer column
      if (walkable(t.x1, y)) g.set(t.x1, y, 'b'); // east buffer column
    }
    for (let x = t.x0; x <= t.x1; x++) {
      if (walkable(x, 49)) g.set(x, 49, 'b'); // north buffer treeline
      if (x > t.x0 && x < t.x1 && walkable(x, 53)) g.set(x, 53, '^'); // the bluff lip
      if (walkable(x, 54)) g.set(x, 54, 'K'); // the cliff face
    }
  }
  for (const sx of [28, 77]) for (const sy of [53, 54, 55]) g.set(sx, sy, 'T'); // the flights

  props.push(
    // OTTERBROOKE HOTEL FORECOURT — a planted stoop on central Civic Street.
    // The facade's own HOTEL marquee does the labeling; extra generic WELCOME
    // boards/mats were removed so the entrance has one clear visual read.
    { sprite: 'planter', x: 36.2, y: 27.35, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'planter', x: 41.15, y: 27.35, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    // CITY HALL POCKET PLAZA (spine × Civic corner): fountain, benches, the phone
    { sprite: 'otter_statue', x: 63, y: 34.5, solid: { ox: 35, oy: 60, w: 20, h: 10 } },
    { sprite: 'bench', x: 60, y: 37.2, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: 65.5, y: 37.2, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'phone_table', x: 63, y: 38.2, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
    // signposts (each backed by a SignDef below)
    { sprite: 'sign', x: 52, y: H - 8, solid: SIGN_SOLID }, // the chapter-road marker on the south approach
    { sprite: 'sign', x: 60, y: 33.6, solid: SIGN_SOLID }, // City Hall / welcome, on the plaza
    { sprite: 'sign', x: 10, y: 57.5, solid: SIGN_SOLID }, // Main St west marker
    { sprite: 'sign', x: 12, y: 102.5, solid: SIGN_SOLID }, // MAPLE ST
    { sprite: 'sign', x: 13.4, y: 99.6, solid: SIGN_SOLID, unlessFlag: 'owned_27_maple' }, // FOR SALE — 27 Maple (beside the walk, not on it)
    { sprite: 'sign', x: 13.4, y: 99.6, solid: SIGN_SOLID, ifFlag: 'owned_27_maple' }, // SOLD — 27 Maple
    { sprite: 'sign', x: 27, y: 100.6, solid: SIGN_SOLID }, // 29 Maple, just inside the open front gate
    { sprite: 'sawhorse', x: 27.5, y: 97.6, solid: { ox: 0, oy: 6, w: 64, h: 22 } }, // the Fixer's renovation never started
    { sprite: 'sign', x: 52.4, y: 12.4, solid: SIGN_SOLID }, // WELCOME — where the trail becomes Main Ave
    { sprite: 'sign', x: 88.2, y: 85.4, solid: SIGN_SOLID }, // chapel marker
    { sprite: 'sign', x: 56.2, y: H - 6.6, solid: SIGN_SOLID, unlessFlag: 'tick_defeated' }, // the closed-gate notice
    // POND PARK (footprint unchanged)
    { sprite: 'picnic', x: 30, y: 78, solid: PICNIC_SOLID },
    { sprite: 'gazebo', x: 30, y: 72, solid: { ox: 4, oy: 34, w: 48, h: 18 } },
    { sprite: 'swing_set', x: 26, y: 66, solid: { ox: 2, oy: 20, w: 60, h: 8 } },
    { sprite: 'seesaw', x: 34, y: 67.5, solid: { ox: 2, oy: 12, w: 34, h: 7 } },
    { sprite: 'picnic_blanket', x: 33, y: 81 },
    { sprite: 'cattails', x: 3, y: 68 },
    { sprite: 'cattails', x: 4, y: 79 },
    { sprite: 'cattails', x: 18, y: 68 },
    { sprite: 'cattails', x: 18, y: 80 },
    // Shore oak: plant the roots on the north bank rather than in open water.
    { sprite: 'tree_c', x: 11, y: 62.5, solid: treeSolid('tree_c') },
    { sprite: 'footbridge_rail', x: 17, y: 77 },
    { sprite: 'flagpole', x: 68, y: 34, solid: { ox: 5, oy: 28, w: 6, h: 7 } },
    // MAIN ST street furniture: hydrants and meters punctuate the parking lane,
    // with breathing room kept around each storefront entrance.
    { sprite: 'hydrant', x: 33.5, y: 57.4, solid: { ox: 2, oy: 6, w: 6, h: 6 } },
    { sprite: 'hydrant', x: 66.5, y: 57.4, solid: { ox: 2, oy: 6, w: 6, h: 6 } },
    ...[31, 40, 50, 73, 87].map((mx) => ({ sprite: 'parking_meter', x: mx + 0.2, y: 57.45 })),
    // EB INTERSECTION KIT (2026-07-11) — the Onett gooseneck at the two big
    // spine junctions (Main + Civic) and stop signs on the south approaches.
    { sprite: 'traffic_light', x: 51.55, y: 54.9, solid: { ox: 4, oy: 44, w: 6, h: 4 } },
    { sprite: 'traffic_light', x: 51.55, y: 25.4, solid: { ox: 4, oy: 44, w: 6, h: 4 } },
    { sprite: 'stop_sign', x: 57.35, y: 61.4, solid: { ox: 4, oy: 24, w: 5, h: 4 } },
    { sprite: 'stop_sign', x: 57.35, y: 91.4, solid: { ox: 4, oy: 24, w: 5, h: 4 } },
    { sprite: 'trash_can', x: 36.2, y: 57.45, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
    { sprite: 'news_box', x: 70.5, y: 57.45, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
    { sprite: 'planter', x: 57.8, y: 57.4, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    // HUSH MORNING: the five story-closed storefronts wear visible red-ring
    // placards at their doors. They retire with the Tick, instead of the state
    // change being communicated only by invisible enter zones.
    { sprite: 'sign_do_not_enter', x: 11.65, y: 56.35, solid: { ox: 2, oy: 14, w: 7, h: 8 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    { sprite: 'sign_do_not_enter', x: 24.65, y: 56.35, solid: { ox: 2, oy: 14, w: 7, h: 8 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    { sprite: 'sign_do_not_enter', x: 31.65, y: 56.35, solid: { ox: 2, oy: 14, w: 7, h: 8 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    { sprite: 'sign_do_not_enter', x: 60.65, y: 56.35, solid: { ox: 2, oy: 14, w: 7, h: 8 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    { sprite: 'sign_do_not_enter', x: 79.65, y: 56.35, solid: { ox: 2, oy: 14, w: 7, h: 8 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    // RESTORED DAY: buildDoorMarkers() already supplies one correctly aligned mat
    // per reopened door. Compact wooden notices replace the blurry menu-board art
    // and leave the bakery/drugstore curb readable instead of forming a prop wall.
    { sprite: 'sign', x: 14.1, y: 57.15, scale: 0.64, solid: SIGN_SOLID, ifFlag: 'tick_defeated' },
    { sprite: 'sign', x: 27.1, y: 57.15, scale: 0.64, solid: SIGN_SOLID, ifFlag: 'tick_defeated' },
    { sprite: 'sign', x: 63.1, y: 57.15, scale: 0.64, solid: SIGN_SOLID, ifFlag: 'tick_defeated' },
    { sprite: 'poster_stand', x: 82.1, y: 57.2, ifFlag: 'tick_defeated' },
    { sprite: 'bench', x: 25.5, y: 27.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } }, // the bus-stop benches
    { sprite: 'bench', x: 31, y: 27.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    // residential mailboxes on the kerb
    { sprite: 'mailbox', x: 43.5, y: 86.4, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'mailbox', x: 65.5, y: 86.4, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'mailbox', x: 41.5, y: 101.4, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'mailbox', x: 78.5, y: 71.4, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    // Small domestic stories make each block readable at a glance: laundry,
    // a dog run, a pool, and the swing that belongs to the same family every day.
    { sprite: 'clothesline', x: 94, y: 39.2 },
    { sprite: 'doghouse', x: 35, y: 83.2, solid: { ox: 2, oy: 14, w: 18, h: 9 } },
    { sprite: 'kiddie_pool', x: 84, y: 68.2 },
    { sprite: 'tree_swing', x: 46, y: 68.5 },
    { sprite: 'phone_pole', x: 18, y: 29.2 },
    { sprite: 'phone_pole', x: 94, y: 44.2 },
    { sprite: 'phone_pole', x: 40, y: 89.2 },
    // Cars turn into two-cell residential spurs and carry a real lower-body
    // footprint, so neither Jay nor a wandering neighbour can walk through one.
    { sprite: 'vehicle_clunker', x: 39, y: 12, rot: 90, solid: STATIC_CLUNKER_SOLID },
    { sprite: 'vehicle_clunker', x: 50, y: 40, rot: 90, solid: STATIC_CLUNKER_SOLID },
    { sprite: 'vehicle_clunker', x: 68, y: 71, rot: 90, solid: STATIC_CLUNKER_SOLID },
    { sprite: 'vehicle_clunker', x: 69, y: 85, rot: 90, solid: STATIC_CLUNKER_SOLID },
    { sprite: 'vehicle_clunker', x: 92, y: 94, rot: 90, solid: STATIC_CLUNKER_SOLID },
  );

  for (let y = 3; y < H - 4; y++) {
    for (let x = 7; x < W - 6; x++) {
      if (g.rows[y][x] !== '.') continue;
      if (occupied.has(idx(x, y))) continue;
      let nearWalk = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          if ('=RD_:'.includes(g.rows[y + dy]?.[x + dx] ?? '#')) nearWalk = true;
        }
      }
      // avalanche-mixed hash — the old (x*K)^(y*K') form aliased into visible
      // COLUMNS of back-lot trees on the wide south blocks
      let hsh = Math.imul(x, 0x9e3779b1) ^ Math.imul(y + 0x95, 0x85ebca6b);
      hsh = (Math.imul(hsh ^ (hsh >>> 13), 0xc2b2ae35) ^ (hsh >>> 16)) >>> 0;
      if (nearWalk) {
        if (hsh % 7 === 0) dtree(x, y);
      } else if (hsh % 19 === 0) {
        dtree(x, y);
      }
    }
  }

  const npcs: NpcDef[] = [
    { id: 'mrs_pemmel', sprite: 'mrsPemmel', x: 66, y: 58, facing: 'down', dialogue: 'npc_pemmel' }, // outside the drugstore
    { id: 'biscuit', sprite: 'dog', x: 26, y: 76, facing: 'left', dialogue: 'npc_biscuit', dog: true, unlessFlag: 'zapper_done' },
    { id: 'biscuit_home', sprite: 'dog', x: 26, y: 76, facing: 'left', dialogue: 'npc_biscuit_collar', dog: true, ifFlag: 'q_biscuit_done' },
    { id: 'mr_plummer', sprite: 'mrPlummer', x: 61, y: 38, facing: 'down', dialogue: 'npc_plummer', wander: true }, // the plaza
    { id: 'old_timer', sprite: 'oldTimer', x: 32, y: 76, facing: 'down', dialogue: 'npc_oldtimer', dialogueDay: 'npc_oldtimer_day', wander: true },
    {
      id: 'pajama_kid', sprite: 'pajamaKid',
      x: CH1_WORLD.quest.pajamaKid.x,
      y: CH1_WORLD.quest.pajamaKid.y - OTTERBROOK_TOWN_BASE,
      facing: 'left', dialogue: 'npc_pajama', dialogueDay: 'npc_pajama_day', wander: true,
    },
    { id: 'green_keeper', sprite: 'fernLady', x: 28, y: 73, facing: 'down', dialogue: 'npc_green_keeper', wander: true },
    { id: 'pond_angler', sprite: 'quarterMan', x: 21, y: 76, facing: 'left', dialogue: 'npc_pond_angler', idle: true, emote: 'think' },
    // The enlarged Birch house reaches two tiles farther west; keep its neighbor
    // on the open lawn instead of spawning under the facade's left wall.
    { id: 'south_neighbor', sprite: 'senora', x: 58, y: 82, facing: 'down', dialogue: 'npc_south_neighbor', wander: true },
    { id: 'gate_walker', sprite: 'grayCommuter', x: 54, y: H - 7, facing: 'down', dialogue: 'npc_gate_walker', dialogueDay: 'npc_gate_walker_day', wander: true },
    { id: 'bus_waiter1', sprite: 'grayCommuter', x: 26, y: 28, facing: 'right', dialogue: 'npc_bus_waiter1', idle: true, emote: 'think', ifFlag: 'tick_defeated' }, // depot benches
    { id: 'bus_waiter2', sprite: 'senora', x: 30, y: 28, facing: 'up', dialogue: 'npc_bus_waiter2', idle: true, emote: 'idle', ifFlag: 'tick_defeated' },
    // the AGENT now works inside OTTERBROOK REALTY (realty_int) — see buildRealtyInt
    { id: 'car_dealer_otter', sprite: 'quarterMan', x: 90, y: 58, facing: 'down', dialogue: 'npc_car_dealer', idle: true, emote: 'happy', ifFlag: 'tick_defeated' }, // Bert, on his lot
    { id: 'maple_gawker', sprite: 'senora', x: 18, y: 103, facing: 'up', dialogue: 'npc_maple_gawker', idle: true, emote: 'think', ifFlag: 'tick_defeated', unlessFlag: 'owned_27_maple' },
    { id: 'constable_borden', sprite: 'npc_borden', x: 66, y: 28, facing: 'up', dialogue: 'npc_borden_accuse', idle: true, emote: 'surprise', ifFlag: 'tick_defeated', unlessFlag: 'borden_marching' }, // the station house
    // Restored-day bustle: these people are the reward for giving the town its
    // color back, not background noise during the Hush crisis.
    { id: 'civic_secretary', sprite: 'grayCommuter', x: 58, y: 37, facing: 'right', dialogue: 'npc_civic_secretary', wander: true, ifFlag: 'tick_defeated' },
    { id: 'bakery_regular', sprite: 'senora', x: 61, y: 59, facing: 'up', dialogue: 'npc_bakery_regular', idle: true, emote: 'happy', ifFlag: 'tick_defeated' },
    { id: 'arcade_regular', sprite: 'pigeonKid', x: 74, y: 59, facing: 'up', dialogue: 'npc_arcade_regular', idle: true, emote: 'happy', ifFlag: 'tick_defeated' },
    // The Pond house's wider cottage silhouette owns its old x35 corner now.
    { id: 'pond_grandma', sprite: 'fernLady', x: 37, y: 80, facing: 'left', dialogue: 'npc_pond_grandma', wander: true, ifFlag: 'tick_defeated' },
    { id: 'maple_biker', sprite: 'pajamaKid', x: 37, y: 103, facing: 'right', dialogue: 'npc_maple_biker', wander: true, ifFlag: 'tick_defeated' },
    { id: 'south_gardener', sprite: 'mrPlummer', x: 69, y: 124, facing: 'left', dialogue: 'npc_south_gardener', wander: true, ifFlag: 'tick_defeated' },
  ];

  type NativeRect = { x: number; y: number; w: number; h: number };
  const overlaps = (a: NativeRect, b: NativeRect): boolean =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const scaleOf = (value: PropDef['scale']): { x: number; y: number } =>
    typeof value === 'number'
      ? { x: value, y: value }
      : { x: value?.x ?? 1, y: value?.y ?? 1 };
  const authoredPropSolids: NativeRect[] = props.flatMap((prop) => {
    const scale = scaleOf(prop.scale);
    const parts = prop.solidParts ?? (prop.solid ? [prop.solid] : []);
    return parts.map((part) => ({
      x: prop.x * 16 + part.ox * scale.x,
      y: prop.y * 16 + part.oy * scale.y,
      w: part.w * scale.x,
      h: part.h * scale.y,
    }));
  });
  const npcSpawnBodies: NativeRect[] = npcs.map((npc) => {
    const instance = typeof npc.scale === 'number'
      ? { x: npc.scale, y: npc.scale }
      : { x: npc.scale?.x ?? 1, y: npc.scale?.y ?? 1 };
    const base = npc.dog ? 1.5 : 1;
    const sx = base * instance.x;
    const sy = base * instance.y;
    const feet = { x: npc.x * 16 + 8, y: npc.y * 16 + 22 };
    return { x: feet.x - 6 * sx, y: feet.y - 10 * sy, w: 12 * sx, h: 10 * sy };
  });
  const acceptedTreeTrunks: NativeRect[] = [];
  for (const tree of generatedTrees) {
    if (!tree.solid) continue;
    const trunk = {
      x: tree.x * 16 + tree.solid.ox,
      y: tree.y * 16 + tree.solid.oy,
      w: tree.solid.w,
      h: tree.solid.h,
    };
    if (
      authoredPropSolids.some((solid) => overlaps(trunk, solid)) ||
      npcSpawnBodies.some((body) => overlaps(trunk, body)) ||
      acceptedTreeTrunks.some((solid) => overlaps(trunk, solid))
    ) continue;
    props.push(tree);
    acceptedTreeTrunks.push(trunk);
  }

  const signs: SignDef[] = [
    { x: 53, y: 13, dialogue: 'sign_welcome' }, // where the hill trail becomes Main Ave
    { x: 39, y: 28, dialogue: 'sign_otter_hotel' },
    { x: 88, y: 86, dialogue: 'sign_chapel' },
    { x: 60, y: 34, dialogue: 'sign_otter_hall' },
    { x: 30, y: 73, dialogue: 'sign_civic_green' },
    { x: 24, y: 74, dialogue: 'sign_pond_park' },
    { x: 52, y: H - 8, dialogue: 'sign_meadow_gate' },
    { x: 56, y: H - 6, dialogue: 'sign_meadow_gate_closed', unlessFlag: 'tick_defeated' },
    { x: 12, y: 103, dialogue: 'sign_maple_st' },
    { x: 13, y: 100, dialogue: 'sign_27_maple', unlessFlag: 'owned_27_maple' },
    { x: 13, y: 100, dialogue: 'sign_27_maple_sold', ifFlag: 'owned_27_maple' },
    { x: 27, y: 101, dialogue: 'sign_29_maple' },
    { x: 84, y: 58, dialogue: 'sign_realty' }, // the agency's window listings
    ...[12, 25, 32, 61, 80].map((x) => ({ x, y: 57, dialogue: 'shop_closed_hush', ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' })),
    ...[14, 27, 63, 82].map((x) => ({ x, y: 58, dialogue: 'shop_reopened_board', ifFlag: 'tick_defeated' })),
  ];

  return {
    id: 'otterbrook',
    name: 'OTTERBROOKE, OH',
    music: 'otterbrook',
    settlement: 'town',
    grid: g.out(),
    props,
    npcs,
    signs,
    phones: [{ x: 63, y: 39 }],
    doors: [],
    spawners: [
      { enemies: ['cranky_mailbox', 'sprinkler_sentry'], count: 1, rect: { x: 60, y: 44, w: 8, h: 4 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' },
      { enemies: ['runaway_lawnmower', 'recycling_raccoon', 'unionized_gnome'], count: 1, rect: { x: 30, y: 60, w: 8, h: 4 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' },
      { enemies: ['pigeon_gang', 'good_investment'], count: 1, rect: { x: 70, y: 60, w: 6, h: 2 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' },
      { enemies: ['cranky_mailbox', 'skeeter_swarm'], count: 1, rect: { x: 60, y: 84, w: 8, h: 4 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' },
    ],
    triggers: [],
  };
}

/** Fences are PROPS, not tiles (2026-07-09 playtest fix). The tilemap is single-layer, so a
 *  fence TILE carries a baked ground square that boxes every run in flat green; the authored
 *  picket KIT renders transparent over the real ground and depth-sorts (the player's feet
 *  disappear behind a run they stand north of, like EarthBound).
 *
 *  Scans the finished grid for the legacy '-'/'|' paints, returns those cells to grass, and
 *  lays sectional props: 2-tile + 1-tile sections along horizontal runs (their end posts are
 *  baked flush, so abutting sections read as one continuous fence) and a post wherever a run
 *  branches or stands alone.
 *
 *  N-S FENCES ARE DIAGONAL (user-locked 2026-07-09, per the EB Onett reference: EarthBound
 *  never draws a straight vertical fence — its north-south lines are angled staircases, and
 *  EVERY staircase leans the SAME way: '/', matching the buildings' up-right depth axis).
 *
 *  The connected grammar (user 2026-07-09: front and side must ATTACH):
 *    · where a horizontal run turns into a diagonal, the turn cell renders the authored
 *      CORNER piece (picket_corner_w / _e: post + H rails one side + '/' rails behind),
 *      so the front and the rising side read as one continuous fence;
 *    · '/' chain cells may sit directly above row cells — that IS the parallelogram look
 *      (the side rises behind the front row, exactly like EB's leaning yards);
 *    · straight '|' columns are RE-SHAPED, not rendered: each fenced end becomes corner →
 *      one '/' step → terminal post (rising NE), and the column's middle returns to grass —
 *      EB yards read as leaning open frames, not sealed boxes;
 *    · a '/' chain's unanchored END cell (one diagonal neighbour) terminates in a post.
 *  Piece geometry mirrors the AUTHORED_WORLD_PROP_DISPLAY_SIZE entries (picket_h 32×13,
 *  picket_diag_ne 16-wide steps, post 7×15). Deterministic: the byte-identical build test
 *  covers it. */
function propifyFences(g: Grid): PropDef[] {
  const H = g.rows.length;
  const W = g.rows[0].length;
  const key = (x: number, y: number): number => y * W + x;
  const raw = (x: number, y: number): boolean => {
    const c = g.rows[y]?.[x];
    return c === '-' || c === '|';
  };
  // Overlapping yard paints stack fence cells two rows deep in places (as TILES the pile
  // read as one chunky fence; as props it becomes a post swarm). Collapse every pile onto
  // its SOUTHERNMOST row: drop a cell whose south neighbour is fence AND itself runs
  // horizontally. A pure vertical column has no horizontal neighbours, so real columns —
  // and the corner cells above them — survive untouched.
  const rawH = (x: number, y: number): boolean => raw(x, y) && (raw(x - 1, y) || raw(x + 1, y));
  const eff = new Set<number>();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (raw(x, y) && !(rawH(x, y + 1) && (raw(x - 1, y) || raw(x + 1, y))))
        eff.add(key(x, y)); // piles run sideways — a '|' column bottom above a row survives
  const inEff = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H && eff.has(key(x, y));

  // ---- straight '|' columns mark WHERE A SIDE RISES: each fenced end (the H cell the
  // column touches) becomes the 2-cell CORNER JOINT + its whole rising '/' SIDE piece —
  // both cut from the same master drawing, so the turn is literally the drawn connection.
  // The column's own cells return to grass (EB yards are leaning open frames). ----
  const cornerW = new Set<number>(); // joint at a run's WEST end (H continues east)
  const cornerE = new Set<number>(); // joint at a run's EAST end (H continues west)
  const consumed = new Set<number>(); // run cells covered by a 2-cell corner piece
  const columns: Array<{ x: number; y0: number; y1: number }> = [];
  const pureV = (x: number, y: number): boolean =>
    inEff(x, y) && !inEff(x - 1, y) && !inEff(x + 1, y) && (inEff(x, y - 1) || inEff(x, y + 1));
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      if (!pureV(x, y) || pureV(x, y - 1)) continue;
      let y1 = y;
      while (pureV(x, y1 + 1)) y1++;
      columns.push({ x, y0: y, y1 });
      y = y1;
    }
  }
  const strays: Array<[number, number]> = [];
  for (const { x, y0, y1 } of columns) {
    const anchors: number[] = [];
    if (inEff(x, y0 - 1)) anchors.push(y0 - 1);
    if (inEff(x, y1 + 1)) anchors.push(y1 + 1);
    for (let yy = y0; yy <= y1; yy++) eff.delete(key(x, yy));
    if (!anchors.length) strays.push([x, y0]);
    for (const ay of anchors) {
      if (inEff(x + 1, ay)) {
        // WEST turn: the drawn 2-cell joint piece (post + run + climb base behind)
        cornerW.add(key(x, ay));
        consumed.add(key(x + 1, ay)); // the joint art spans this run cell too
      } else {
        // EAST turn: no special piece — the run ends in its normal cap_e post and the
        // climb tucks behind it (its left rail stubs hide inside the post's body)
        cornerE.add(key(x, ay));
      }
    }
  }
  // east-turn anchors stay ORDINARY run cells (they take the natural cap_e post);
  // only the drawn west joints leave the run grammar
  const isCorner = (x: number, y: number): boolean => cornerW.has(key(x, y));

  // ---- classify what remains: H runs (minus west joints + their consumed cells) + posts ----
  const axisH = new Set<number>();
  const posts: Array<[number, number]> = [...strays];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!inEff(x, y) || isCorner(x, y) || consumed.has(key(x, y))) continue;
      if (inEff(x - 1, y) || inEff(x + 1, y)) axisH.add(key(x, y));
      else posts.push([x, y]);
    }
  }
  // every original fence cell returns to grass (props render over the real ground)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (raw(x, y)) g.set(x, y, '.');

  const props: PropDef[] = [];
  // posts: 7×15 art centred in its cell, base on the cell floor; solid = the lower square
  for (const [x, y] of posts)
    props.push({ sprite: 'picket_post', x: x + 0.28, y: y + 0.0625, solid: { ox: 0.5, oy: 7, w: 6, h: 8 } });
  // corner joints + their rising sides. All pieces share the master drawing's scale
  // (s = 16/138): the run base sits ~1.4 native below the cell floor, the corner art is
  // 46.4 tall, and each side piece is placed at the drawing's own offset from its corner
  // (art +269/-170 and +276/-170 → native +31.2/-19.7 and +32/-19.7), so the climb
  // continues the joint pixel-for-pixel. Side solids over-cover their diagonal band a
  // little (the wedge they block is yard interior / pen wall — EB collision is chunky too).
  // every piece is cut to the SAME art base line (fence base + 2px), so one placement rule
  // aligns all rails: prop.y = cell + (18 - dispH)/16. Corners: dispH 45.2 → -1.7; sides sit
  // at the drawing-true offset (-19.7 native) above their corner.
  for (const k of cornerW) {
    const x = k % W, y = Math.floor(k / W);
    props.push({ sprite: 'picket_corner_w', x: x - 0.269, y: y - 1.7, solid: { ox: 4.3, oy: 32, w: 30, h: 9 } });
    props.push({ sprite: 'picket_side_ne', x: x + 1.68, y: y - 2.931, solid: { ox: 2, oy: 16, w: 32, h: 22 } });
  }
  // east turns: the climb tucks behind the run's own cap_e post — its left rail stubs land
  // inside the post's body, and its first picket plants just NE of it
  for (const k of cornerE) {
    const x = k % W, y = Math.floor(k / W);
    props.push({ sprite: 'picket_side_ne2', x: x + 0.75, y: y - 1.825, solid: { ox: 3, oy: 14, w: 32, h: 22 } });
  }
  // horizontal runs: continuous gap-phase windows — caps (with the terminal post) at any
  // end that faces open ground (gate edges); plain windows beside corner joints, whose art
  // already covers the adjacent cell. The run base sits ~1.4 native below the cell floor.
  const RUN_Y = 2 - 23.2 + 16; // prop y-offset in native: base at cell bottom + 2
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!axisH.has(key(x, y)) || axisH.has(key(x - 1, y))) continue;
      let len = 1;
      while (axisH.has(key(x + len, y))) len++;
      const westJoined = isCorner(x - 1, y) || consumed.has(key(x - 1, y));
      const eastJoined = isCorner(x + len, y) || consumed.has(key(x + len, y));
      let cx = x;
      let rem = len;
      if (!westJoined && rem >= 2) {
        props.push({ sprite: 'picket_cap_w', x: cx, y: y + RUN_Y / 16, solid: { ox: 0, oy: 12, w: 16, h: 8 } });
        cx += 1;
        rem -= 1;
      }
      const capEast = !eastJoined && rem >= 2;
      const fillEnd = capEast ? rem - 1 : rem;
      for (let f = fillEnd; f > 0; ) {
        if (f >= 2) {
          props.push({ sprite: 'picket_h', x: cx, y: y + RUN_Y / 16, solid: { ox: 0, oy: 12, w: 32, h: 8 } });
          cx += 2;
          f -= 2;
        } else {
          props.push({ sprite: 'picket_h1', x: cx, y: y + RUN_Y / 16, solid: { ox: 0, oy: 12, w: 16, h: 8 } });
          cx += 1;
          f -= 1;
        }
      }
      if (capEast)
        props.push({ sprite: 'picket_cap_e', x: cx, y: y + RUN_Y / 16, solid: { ox: 0, oy: 12, w: 16, h: 8 } });
      x += len - 1;
    }
  }
  return props;
}

export function growOtterbrook(): MapDef {
  const town = buildOtterbrookTownReplica();
  const TB = OTTERBROOK_TOWN_BASE;
  const TW = town.grid[0].length;
  const TH = town.grid.length;
  const W = TW;
  const H = TB + TH;
  const g = new Grid(W, H, 'b');

  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) g.set(x, TB + y, town.grid[y][x]);

  // The wooded PLATEAU fills rows 0..TB with dense woods ('b'); the only clearings
  // are CARVED — the crater bowl, the cave nook, the cottage/shed pockets, the
  // Jay/Chad TERRACE on the mid shelf, and the dirt trails threading to town.
  // 2026-07-08 (top-right quarter detail pass): the RIGHT climb is a real WINDING
  // UPHILL now — four terraces stacked inside the plateau (L2 base → L3 Fibbins
  // bench → L4 police bench → L5 crater crest), each switchback leg one cliff-and-
  // stair flight above the last, EarthBound-Onett style. 2026-07-09 (user, per the
  // EB reference): the CAVE/SHED corridor is its OWN far-west section, hugging the
  // top-left corner, DETACHED from the meteorite hike — the x28-39 band stays
  // solid dense woods the full hill height, so the corridor is neither visible nor
  // walkable from Jay's terrace or the climb. Its only mouth is the west town
  // stairs, and the SHED (key-gated flanks) blocks its path to the cave.
  g.rect(0, 0, W, TB, 'b');

  // --- carved clearings ---
  g.rect(4, 2, 8, 9, '.');    // cave-mouth shelf — hard against the TOP-LEFT corner (the Giant-Step pocket)
  // Far-west gate corridor: exactly six tiles wide, matching the trail shed's
  // full collision width. Woods touch both side walls, so there is no route around
  // it; the locked front door and walk-through rear hole are the cave route.
  g.rect(9, 23, 6, 19, '.');
  g.rect(18, 34, 10, 9, '.'); // Pemberton's separate workshop pocket off the mower lane
  // key-gates seal the walk-arounds on both flanks until has_trail_key
  g.rect(42, 48, 30, 13, '.'); // MID SHELF: the Jay/Chad terrace clearing (rows 49-60)
  g.rect(64, 27, 26, 7, '.');  // L3 — FIBBINS' BENCH: cottage + dig pen + flight B's top landing
  g.rect(46, 27, 6, 3, '.');   // L3 — the HAIRPIN REST at flight C's bend: picnic + the present sit
  // against the cliff base ON the road (EB's hill gift box), passed as the road turns upstairs
  g.rect(42, 19, 19, 5, '.');  // L4 — the POLICE BENCH: the muster at the last flight's foot
  g.rect(84, 37, 7, 4, '.');   // L2 — the stair-foot landing where Leg 1 meets the first flight

  // top-RIGHT: the round scorched CRATER bowl set into the crest, thin grass rim.
  // Rows clamp at 15 so the bowl never bleeds into the crest's lip/face band below.
  const crater = { x: 72, y: 9, rx: 22, ry: 7 };
  for (let yy = 1; yy <= 15; yy++) {
    for (let xx = crater.x - crater.rx - 2; xx <= crater.x + crater.rx + 2; xx++) {
      const dx = (xx - crater.x) / crater.rx;
      const dy = (yy - crater.y) / crater.ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) g.set(xx, yy, 's');
      else if (d <= 1.4 && g.rows[yy]?.[xx] === 'b') g.set(xx, yy, '.');
    }
  }
  for (const [ex, ey] of [[56, 6], [88, 6], [64, 3], [92, 10], [58, 15], [86, 15]] as const) g.set(ex, ey, 'S');
  // WOODS PLUG — the bowl's WEST flank (ring + a bite of scorch) goes back to
  // forest, so the scree zig-zag (painted over it below) is the ONLY way from the
  // flight-D landing into the bowl — no strolling the rim ring around the climb.
  g.rect(44, 8, 14, 8, 'b');
  g.rect(44, 13, 6, 3, '.'); // L5 — the stair-top landing (carved after the plug)

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

  // THE WINDING CLIMB (2026-07-08): the S9 LONG CLIMB, terraced. Every switchback
  // leg now lives one level up from the last; trails are painted FIRST and the
  // lip/face bands + stair flights stamp over any spill, so every seam stays
  // law-clean (elevationLawViolations). Leg 1 weaves along the low treeline east
  // to flight B; Leg 2 crosses back west past Old Man Fibbins' door to flight C;
  // Leg 3 runs east into the police muster below flight D; the scree zig-zag
  // takes the crest into the bowl's west apron.
  paintTrail([[56, 45], [56, 42]]); // off the terrace stairs
  paintTrail([[58, 42], [64, 41], [70, 43], [76, 41], [82, 43], [86, 41], [87, 39]]); // LEG 1 (L2) — weaves east to flight B's foot
  paintTrail([[87, 32], [80, 32], [74, 31], [68, 32], [62, 30], [54, 31], [48, 30], [44, 29]]); // LEG 2 (L3) — west, PAST THE OLD MAN'S DOOR
  paintTrail([[44, 22], [50, 20], [56, 22], [59, 21]], 3); // LEG 3 (L4) — east into the muster
  paintTrail([[46, 14], [43, 12], [48, 10], [43, 8], [49, 6], [53, 6]], 3); // the SCREE ZIG-ZAG (L5) — punches through the plug into the bowl's west apron
  // the terrace approaches (Jay & Chad's porches join the trail between the houses)
  paintTrail([[49, 56], [52, 56], [55, 55]], 3);
  paintTrail([[61, 56], [58, 56], [55, 55]], 3);
  paintTrail([[56, 49], [55, 51], [56, 57], [56, 64], [56, 67]]); // stair foot → terrace → town stairs
  // LEFT (cave) corridor — fully west of the x28-39 treeline, DETACHED from the
  // climb. Town's west stairs → the mower lane (dead-ends at x27; 26 columns of
  // solid woods to the climb's stub) → the shed pocket (the shed blocks the path;
  // key-gated flanks) → the top-left cave shelf.
  paintTrail([[14, 42], [26, 42]], 3); // the WEST LANE — Hodgkin's mower runway
  paintTrail([[11, 33], [13, 38], [14, 41]]); // pocket → lane
  paintTrail([[7, 10], [7, 15], [8, 19], [10, 23]]); // cave shelf → pocket (past the gates)
  paintTrail([[26, 42], [26, 44], [27, 52], [26, 60], [26, 67]]); // lane → W stairs → town

  // Re-seal after trail stamping: dense shoulders funnel the final approach into
  // the three-cell painted mouth. The old open shelf let the player walk behind
  // or around the cave art without taking its visible transition.
  g.rect(4, 2, 3, 8, 'b');
  g.rect(10, 2, 2, 8, 'b');

  // Re-seal both flanks after trail stamping. The shed fills x9..14; these
  // woods columns touch its side walls from the rear approach to the front
  // threshold, guaranteeing that unlocking and crossing the shed is mandatory.
  g.rect(6, 23, 3, 11, 'b');
  g.rect(15, 23, 3, 11, 'b');

  // ── OLD MAN FIBBINS' DIG (the "old man section", à la Onett's hillside liar):
  // a fenced pen east of his cottage with the hole he's been widening since the
  // night the meteor "called his name". Pit + dirt apron carved into the bench;
  // the pen gate opens south onto his front trail (painted AFTER the trails so
  // the fence seals any spill). ──
  g.rect(81, 28, 4, 3, ':'); // the dirt apron
  g.rect(82, 28, 2, 2, 's'); // the hole itself (scorched-bare earth)
  // the pen is a leaning PARALLELOGRAM (EB grammar, user 2026-07-09 — EarthBound never
  // runs a fence straight north-south, every climb leans the same '/' as the buildings'
  // oblique, and the front ATTACHES to the sides through the authored corner joints): the
  // south row carries the gate; the '|' markers above each row end tell propifyFences to
  // raise the corner joint + whole rising side there — the west side climbing BEHIND the
  // row (the parallelogram read), the east past the woods corner; the woods close the back.
  for (const fx of [78, 79, 80, 81, 84, 85, 86, 87] as const) g.set(fx, 30, '-'); // south row — gate at x82-83
  for (const fy of [28, 29] as const) { g.set(78, fy, '|'); g.set(87, fy, '|'); } // side markers
  // little sign nooks so the trail markers never sit under canopy or on the path
  for (const [nx, ny] of [[59, 43], [41, 28], [24, 40]] as const) g.set(nx, ny, '.');
  // meadow dressing — flowers + tufts in the carved pockets (hand-set, deterministic)
  for (const [fx, fy] of [[52, 27], [51, 29], [78, 27], [66, 28], [87, 27]] as const) g.set(fx, fy, 'f');
  for (const [ux, uy] of [[53, 28], [65, 32], [44, 19], [58, 19], [44, 13]] as const) g.set(ux, uy, '~');

  // --- ELEVATION seams. HILL FLIGHTS (the RIGHT climb zone, x 40-99): each seam
  // is a walkable '^' lip row over a 2-row solid 'K' face, crossed by ONE 4-wide
  // 'T' flight where the trail climbs — painted LAST so the bands seal any trail
  // spill (the flights then re-open their columns). The bands are STAGGERED —
  // one jog each, in fixture-free x-ranges — so the cliff lines STEP like Onett's
  // hillside (the EB reference) instead of ruling straight across the zone. The
  // level plane below reads the SAME row functions, so the plane can never drift
  // from the paint. TOWN seams (full width, both paths staired) are unchanged. ---
  const crestSeamRow = (x: number): number => (x >= 61 ? 18 : 16); // L5 → L4 (steps DOWN east of the muster)
  const musterSeamRow = (x: number): number => (x >= 61 ? 22 : 24); // L4 → L3 (steps UP behind the cottage)
  const benchSeamRow = (x: number): number => (x >= 53 && x <= 66 ? 36 : 34); // L3 → L2 (dips between rest + cottage)
  for (let sx = 40; sx <= 99; sx++) {
    for (const sr of [crestSeamRow(sx), musterSeamRow(sx), benchSeamRow(sx)]) {
      g.set(sx, sr, '^');
      g.set(sx, sr + 1, 'K');
      g.set(sx, sr + 2, 'K');
    }
  }
  g.rect(46, 16, 4, 3, 'T'); // flight D — the last stairs (the police watch its foot)
  g.rect(42, 24, 4, 3, 'T'); // flight C — the west elbow's stairs (the hairpin rest at its bend)
  g.rect(86, 34, 4, 3, 'T'); // flight B — the east elbow's stairs
  g.rect(68, 34, 6, 1, ':'); // Fibbins' worn DOOR APRON — bares the lip trim at his stoop (the
  // cottage sits flush on the bench's edge, so its frontage walk is the cliff lip itself)
  g.rect(0, 45, W, 1, '^'); g.rect(0, 46, W, 3, 'K'); // seam A: plateau base → mid shelf
  g.rect(24, 45, 6, 4, 'T'); g.rect(53, 45, 6, 4, 'T');
  g.rect(0, 61, W, 1, '^'); g.rect(0, 62, W, 4, 'K'); // seam B: mid shelf → town
  g.rect(23, 61, 6, 5, 'T'); g.rect(53, 61, 6, 5, 'T');

  const treeAt = (xy: ReadonlyArray<readonly [number, number]>): PropDef[] =>
    xy.map(([x, y]) => {
      const sprite = treeSprite(x, y);
      return { sprite, x, y, solid: treeSolid(sprite) };
    });
  // FOREST MASS + FRONT WALLS. Every `b` cell remains the sole collision/BFS source;
  // art here is decorative. Deep-woods singles break up the canopy tile, while wide
  // strips compress each exposed SOUTH edge into 8/4-cell props. Their transparent
  // image bottoms are BASE-ALIGNED to the forest/path seam, so the crowns rise back
  // into the solid woods and never blanket the walking lane. This restores the large,
  // continuous EarthBound treelines without reviving the old 3,214-image map.
  const WALKABLE_HILL = new Set(['.', ',', '~', 'f', 'F', ':', 's', 'S', 'T', '^']);
  const crownTouchesWalk = (x: number, y: number): boolean => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((dx !== 0 || dy !== 0) && WALKABLE_HILL.has(g.rows[y + dy]?.[x + dx] ?? '')) return true;
    }
    return false;
  };
  const canopyTrees: PropDef[] = [];
  for (let cy = 1; cy < TB; cy++) {
    for (let cx = 5; cx < W - 5; cx++) {
      if (g.rows[cy]?.[cx] !== 'b') continue;
      if (crownTouchesWalk(cx, cy)) continue;
      const h = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
      if (h % 17 !== 0) continue; // ~6% accents; the canopy tile supplies the mass
      const jx = (((h >> 3) % 5) - 2) * 0.18;
      const jy = (((h >> 6) % 5) - 2) * 0.18;
      const sprite = treeSprite(cx, cy);
      const x = cx + jx;
      const y = cy + jy;
      const trunk = treeSolid(sprite);
      const left = x * 16 + trunk.ox;
      const top = y * 16 + trunk.oy;
      const right = left + trunk.w;
      const bottom = top + trunk.h;
      let backedByForest = true;
      for (let ty = Math.floor(top / 16); ty <= Math.floor((bottom - 0.001) / 16); ty++) {
        for (let tx = Math.floor(left / 16); tx <= Math.floor((right - 0.001) / 16); tx++) {
          if (g.rows[ty]?.[tx] !== 'b') backedByForest = false;
        }
      }
      if (backedByForest) canopyTrees.push({ sprite, x, y });
    }
  }

  const forestFronts: PropDef[] = [];
  const singleTreeSize = {
    tree: { w: 22, h: 34 }, tree_b: { w: 31, h: 34 }, tree_c: { w: 29, h: 34 },
  } as const;
  const addFrontSingle = (x: number, y: number): void => {
    const sprite = treeSprite(x, y) as keyof typeof singleTreeSize;
    const size = singleTreeSize[sprite];
    forestFronts.push({
      sprite,
      x: x + 0.5 - size.w / 32, // centre the top-left-anchored art on its forest cell
      y: y + 1 - size.h / 16, // tree base ends exactly at the forest/path seam
    });
  };
  for (let fy = 0; fy < TB; fy++) {
    let fx = 0;
    while (fx < W) {
      if (g.rows[fy]?.[fx] !== 'b' || !WALKABLE_HILL.has(g.rows[fy + 1]?.[fx] ?? '')) {
        fx++;
        continue;
      }
      const start = fx;
      while (fx < W && g.rows[fy]?.[fx] === 'b' && WALKABLE_HILL.has(g.rows[fy + 1]?.[fx] ?? '')) fx++;
      let cursor = start;
      let remaining = fx - start;
      while (remaining >= 8) {
        forestFronts.push({ sprite: ((cursor + fy) & 1) ? 'treeline_8_b' : 'treeline_8', x: cursor, y: fy - 1.5 });
        cursor += 8;
        remaining -= 8;
      }
      if (remaining >= 4) {
        forestFronts.push({ sprite: ((cursor + fy) & 1) ? 'treeline_4_b' : 'treeline_4', x: cursor, y: fy - 1.5 });
        cursor += 4;
        remaining -= 4;
      }
      if (remaining >= 2) {
        forestFronts.push({ sprite: ((cursor + fy) & 1) ? 'treeline_2_b' : 'treeline_2', x: cursor, y: fy - 1.5 });
        cursor += 2;
        remaining -= 2;
      }
      while (remaining-- > 0) addFrontSingle(cursor++, fy);
    }
  }

  // the walked-past PRESENT — `otter_woods_gift` (the cold Star Cola by the picnic
  // table; OverworldScene's loot table + dialogue already exist) re-homed to the
  // HAIRPIN REST at flight C's bend, sitting against the cliff base right ON the
  // road (the EB Onett reference: the hill's gift box at a cliff-foot bend) — the
  // S9 rebuild had orphaned its old glade spot.
  const overlookGift = walkPresent('otter_woods_gift', 50, 27);

  const hillProps: PropDef[] = [
    ...forestFronts,
    ...canopyTrees,
    { sprite: 'meteor_rock_hickory_hill', x: 66, y: 3, solid: { ox: 16, oy: 46, w: 64, h: 38 } }, // pushed farther UP the hill
    { sprite: 'sentinel_husk', x: 62, y: 2, solid: { ox: 4, oy: 60, w: 152, h: 40 }, ifFlag: 'sentinel_repelled' },
    { sprite: 'burrow_mouth', x: 7, y: 1 }, // the CAVE mouth (top-left CORNER) → Titanic Tick
    // HODGKIN'S TRAIL SHED is the route gate: full-width solid side walls touch
    // woods, the locked version has no entrance cut, and the keyed version opens
    // into a real walk-through interior whose rear hole exits above the building.
    {
      sprite: 'bldg_ob_trail_shed', x: 8.4, y: 25, scale: 1.2,
      solid: { ox: 0, oy: 0, w: 96, h: 99 },
      unlessFlag: 'has_trail_key',
    },
    {
      sprite: 'bldg_ob_trail_shed_open', x: 8.4, y: 25, scale: 1.2,
      solid: { ox: 0, oy: 0, w: 96, h: 99 },
      door: { ox: 40, oy: 77, w: 16, h: 22, to: 'trail_shed_int', tx: 7 * 16 + 8, ty: 9 * 16 + 12 },
      ifFlag: 'has_trail_key',
    },
    // Pemberton is a separate destination in the east service pocket, safely
    // below the route gate rather than sharing Hodgkin's shed identity.
    otterCentered('bldg_ob_workshop', 22, 40, { to: 'workshop_int', tx: 8 * 16 + 8, ty: 8 * 16 }, 1.2),
    // A pre-dawn works barrier prevents the empty dungeon from being entered early;
    // it retires after Mom sends Jay to sleep.
    { sprite: 'sawhorse', x: 5.2, y: 10.2, solid: { ox: 0, oy: 6, w: 64, h: 22 }, unlessFlag: 'zapper_done' },
    // OLD MAN FIBBINS' cottage — on his own bench now (L3); the crater trail runs
    // right past his LEFT-hand front door (the art's drawn door, frac ≈ .21),
    // Lier-X-Agerate style, along the row-33 front walk under the facade.
    {
      ...otterCentered('bldg_ob_cottage', 72, 33, undefined, OTTERBROOK_BUILDING_SCALE.cottage),
      door: { ox: Math.round((618 / 4) * 0.21) - 8, oy: 96 - 22, w: 16, h: 20, to: 'oldman_int', tx: 7 * 16 + 8, ty: 8 * 16 },
    },
    { sprite: 'sign', x: 76, y: 30.4, solid: SIGN_SOLID }, // the dig-pen notice (west of the pen's flank)
    // the HAIRPIN REST — picnic + present at flight C's bend, under the muster cliff (§A4.5/§B4)
    { sprite: 'picnic', x: 46, y: 27, solid: PICNIC_SOLID },
    ...overlookGift.props,
    { sprite: 'sign', x: 59, y: 42.4, solid: SIGN_SOLID }, // trail marker (Leg 1)
    { sprite: 'sign', x: 41, y: 27.4, solid: SIGN_SOLID }, // trail marker (flight C's foot)
    otterLandmarkAtSameFoot('house_rex', 46, 49, { to: 'rex_home', tx: 104, ty: 124 }, OTTERBROOK_BUILDING_SCALE.hillHome), // JAY's house (purple)
    otterLandmarkAtSameFoot('house_chad', 58, 49, { to: 'chad_home', tx: 7 * 16 + 8, ty: 8 * 16 }, OTTERBROOK_BUILDING_SCALE.hillHome), // CHAD's house (blue)
    { sprite: 'bug_zapper', x: 53, y: 51, solid: { ox: 4, oy: 18, w: 6, h: 8 } },
    {
      sprite: 'lemonade',
      x: CH1_WORLD.quest.lemonadeStand.x,
      y: CH1_WORLD.quest.lemonadeStand.y,
      solid: { ox: 0, oy: 10, w: 36, h: 18 },
      ifFlag: 'zapper_done',
    },
    {
      sprite: 'paw_prints',
      x: CH1_WORLD.quest.biscuitClue1.x,
      y: CH1_WORLD.quest.biscuitClue1.y,
      ifFlag: 'q_biscuit',
      unlessFlag: 'q_biscuit_c1',
    },
    {
      sprite: 'paw_prints',
      x: CH1_WORLD.quest.biscuitClue2.x,
      y: CH1_WORLD.quest.biscuitClue2.y,
      ifFlag: 'q_biscuit_c1',
      unlessFlag: 'q_biscuit_c2',
    },
    {
      sprite: 'well',
      x: CH1_WORLD.quest.hillSpring.x,
      y: CH1_WORLD.quest.hillSpring.y,
      solid: { ox: 2, oy: 20, w: 20, h: 10 },
    },
    { sprite: 'sign', x: 53, y: 20, solid: SIGN_SOLID, ifFlag: 'meteor_fell' }, // crater guard marker (flight D's foot)
    // Keep the keyed entrance visually obvious and physically generous: the
    // notice sits beside the door, never in the mandatory walk-through lane.
    { sprite: 'sign', x: 9.4, y: 33.2, solid: SIGN_SOLID },
    { sprite: 'sign', x: 27, y: 40.4, solid: SIGN_SOLID },
    { sprite: 'sign', x: 64, y: 44, solid: SIGN_SOLID }, // woods marker
    { sprite: 'picnic', x: 64, y: 53, solid: PICNIC_SOLID },
    { sprite: 'bench', x: 68, y: 55, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ...treeAt([[32, 8], [34, 24], [100, 8], [102, 24], [32, 40], [100, 40]]),
  ];

  const hillNpcs: NpcDef[] = [
    {
      id: 'ana', sprite: 'ana',
      x: CH1_WORLD.quest.ana.x, y: CH1_WORLD.quest.ana.y,
      facing: 'down', dialogue: 'npc_ana', ifFlag: 'zapper_done',
    },
    {
      id: 'vivi', sprite: 'vivi',
      x: CH1_WORLD.quest.vivi.x, y: CH1_WORLD.quest.vivi.y,
      facing: 'down', dialogue: 'npc_vivi', ifFlag: 'zapper_done',
    },
    { id: 'treeline_gawker', sprite: 'pigeonKid', x: 66, y: 51, facing: 'up', dialogue: 'npc_treeline_gawker', dialogueDay: 'npc_treeline_gawker_day', idle: true, emote: 'surprise' },
    // the birder wears the CRITIC's art, not oldTimer's — Fibbins is THE old man of
    // this hill (two identical gramps 18 tiles apart read as a copy-paste bug)
    { id: 'woods_birder', sprite: 'sidewalkCritic', x: 65, y: 28, facing: 'down', dialogue: 'npc_woods_birder', idle: true, emote: 'happy' }, // on the Fibbins bench, above Leg 2
    // OLD MAN FIBBINS — at his pen gate, staring into the hole
    { id: 'old_fibbins', sprite: 'oldTimer', x: 83, y: 32, facing: 'up', dialogue: 'npc_fibbins', dialogueDay: 'npc_fibbins_day', idle: true, emote: 'think' },
    { id: 'biscuit_road', sprite: 'dog', x: 14, y: 39, facing: 'up', dialogue: 'npc_biscuit_road', dog: true, unlessFlag: 'tick_defeated' },
    { id: 'biscuit_road_after', sprite: 'dog', x: 14, y: 39, facing: 'down', dialogue: 'npc_biscuit_road_after', dog: true, ifFlag: 'tick_defeated' },
    // THE CRATER GUARD — three cops cordon flight D's foot once the meteor is down;
    // the gaps between them let the crater beat still fire.
    { id: 'crater_cop_a', sprite: 'npc_borden', x: 45, y: 19, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
    { id: 'crater_cop_b', sprite: 'npc_borden', x: 48, y: 20, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
    { id: 'crater_cop_c', sprite: 'npc_borden', x: 51, y: 19, facing: 'up', dialogue: 'npc_crater_police', idle: true, ifFlag: 'meteor_fell' },
  ];

  const hillSigns: SignDef[] = [
    { x: 27, y: 41, dialogue: 'sign_pemberton_workshop' },
    { x: 10, y: 33, dialogue: 'trail_shed_gate_locked', unlessFlag: 'has_trail_key' },
    { x: 10, y: 33, dialogue: 'trail_shed_gate_open', ifFlag: 'has_trail_key' },
    { x: 5, y: 13, dialogue: 'cave_closed_before_dawn', unlessFlag: 'zapper_done' },
    { x: 24, y: 40, dialogue: 'sign_whisperwood_rise' },
    {
      x: CH1_WORLD.quest.biscuitClue1.x,
      y: CH1_WORLD.quest.biscuitClue1.y,
      dialogue: 'q_biscuit_clue1', ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1',
    },
    {
      x: CH1_WORLD.quest.biscuitClue2.x,
      y: CH1_WORLD.quest.biscuitClue2.y,
      dialogue: 'q_biscuit_clue2', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2',
    },
    {
      x: CH1_WORLD.quest.hillSpring.x,
      y: CH1_WORLD.quest.hillSpring.y,
      dialogue: 'hill_spring',
    },
    { x: 64, y: 44, dialogue: 'sign_otter_woods' },
    { x: 5, y: 13, dialogue: 'sign_hill' },
    { x: 53, y: 20, dialogue: 'sign_crater_guard', ifFlag: 'meteor_fell' },
    { x: 64, y: 12, dialogue: 'sign_sentinel_husk', ifFlag: 'sentinel_repelled' },
    { x: 59, y: 43, dialogue: 'sign_crater_trail' },
    { x: 41, y: 28, dialogue: 'sign_crater_trail_2' },
    { x: 76, y: 31, dialogue: 'sign_fibbins_dig' },
    ...overlookGift.signs,
  ];

  // the fence-tile → picket-prop conversion runs LAST, after every paint (town copy,
  // yards, the dig pen) and after the canopy pass read the grid — so the woods keep
  // today's crowns and the fence lines become transparent sectional props.
  const fenceProps = propifyFences(g);

  // EB HORIZON BAND (2026-07-11): the plateau's rim row reads as a vista —
  // checker-dithered sky over a distant treeline ridge ('5', solid like the
  // forest border it replaces) above the crater hilltop, the EarthBound
  // coastal-cliff horizon read. Only the outermost pure-forest row changes;
  // collision and reachability are identical (solid → solid).
  for (let x = 0; x < g.rows[0].length; x++) if (g.rows[0][x] === 'b') g.set(x, 0, '5');

  const grid = g.out();
  // Elevation plane: the RIGHT climb zone (x 40-99) stacks L5 crest → L4 police
  // bench → L3 Fibbins bench → L2 base, reading the SAME staggered seam-row
  // functions the paint used; everywhere else keeps the original three levels
  // (L2 plateau → L1 shelf → L0 town). Convention (mirrors seam A): the lip row
  // + a flight's TOP 'T' row take the UPPER level; the face-row 'T's take the
  // LOWER — levelAfterStep flips a mover exactly one terrace per flight
  // (collidesStatic P3/P5).
  const level = grid.map((rowStr, y) =>
    rowStr
      .split('')
      .map((ch, x) => {
        if (y <= 45) {
          if (x >= 40 && x <= 99) {
            const d = crestSeamRow(x);
            const c = musterSeamRow(x);
            const b = benchSeamRow(x);
            if (y <= d) return '5'; // crest + its lip (and flight D's top step)
            if (y <= d + 2) return ch === 'T' ? '4' : '5'; // crest seam face
            if (y <= c) return '4'; // police bench + lip (and flight C's top step)
            if (y <= c + 2) return ch === 'T' ? '3' : '4'; // muster seam face
            if (y <= b) return '3'; // Fibbins bench + lip (and flight B's top step)
            if (y <= b + 2) return ch === 'T' ? '2' : '3'; // bench seam face
            return '2'; // the base (Leg 1 + the connector lane)
          }
          return '2'; // LEFT zone: cave corridor/shed/cave shelf stay on the base
        }
        if (y <= 48) return ch === 'T' ? '1' : '2'; // seam A face: stairs drop to the shelf
        if (y <= 61) return '1'; // mid shelf (Jay/Chad terrace) + its lip
        if (y <= 65) return ch === 'T' ? '0' : '1'; // seam B face: stairs drop to town
        // EB DOWNTOWN TERRACE (2026-07-11): the two block interiors between
        // Orchard and Main (town rows 49-53, abs 115-119) sit one level up,
        // their K face row (town 54, abs 120) following the seam-B convention
        // (K keeps the upper level, 'T' flight cells take the lower).
        const onTerraceX = (x >= 26 && x <= 49) || (x >= 60 && x <= 86);
        if (y >= 115 && y <= 119 && onTerraceX) return '1';
        if (y === 120 && onTerraceX) return ch === 'T' ? '0' : '1';
        return '0'; // the town
      })
      .join(''),
  );

  const offY = <T extends { y: number }>(o: T): T => ({ ...o, y: o.y + TB });
  const offRect = <T extends { rect: { x: number; y: number; w: number; h: number } }>(o: T): T =>
    ({ ...o, rect: { ...o.rect, y: o.rect.y + TB } });

  return {
    id: 'otterbrook',
    name: 'OTTERBROOKE, OH',
    music: 'otterbrook',
    settlement: 'town',
    grid,
    elevation: { level },
    props: [...hillProps, ...fenceProps, ...town.props.map(offY)],
    npcs: [...hillNpcs, ...town.npcs.map(offY)],
    signs: [...hillSigns, ...town.signs.map(offY)],
    phones: town.phones.map(offY),
    doors: [
      // CHAPTER GATE — the south road off the BOTTOM edge → Meadow Mile (Onett's road to Twoson).
      { x: OTTERBROOK_SOUTH_GATE.x, y: OTTERBROOK_SOUTH_GATE.y, w: 2, h: 2, to: 'meadow_mile', tx: 24, ty: 128, facing: 'down', indicator: 'none' },
      // the hilltop CAVE mouth (the top-left CORNER) → the Titanic Tick dungeon (reached ONLY past the shed
      // gate). Lands in the mouth chamber two rows ABOVE the exit pad (row 48), never ON the way out.
      // The zone sits directly under the painted mouth (x7..9, base y≈3), not
      // eight tiles down the shelf where an invisible doorway used to fire.
      { x: 7, y: 3, w: 3, h: 1, to: 'oak_roots', tx: 16 * 16 + 8, ty: 46 * 16, facing: 'up', indicator: 'none', ifFlag: 'has_trail_key' },
      // The shed's rear-wall hole. The surrounding woods make this upper zone
      // unreachable until the player unlocks the front and crosses the interior.
      { x: 10, y: 23, w: 4, h: 2, to: 'trail_shed_int', tx: 7 * 16 + 8, ty: 3 * 16, facing: 'down', indicator: 'none' },
      // Audit/runtime counterpart to the keyed facade entrance. The embedded
      // prop door cuts the shed collision; this gated zone makes the reciprocal
      // front landing explicit and remains inactive until Hodgkin awards the key.
      { x: 11, y: 30, w: 2, h: 2, to: 'trail_shed_int', tx: 7 * 16 + 8, ty: 9 * 16 + 12, facing: 'up', indicator: 'none', ifFlag: 'has_trail_key' },
      ...town.doors.map(offY),
    ],
    spawners: [
      ...town.spawners.map(offRect),
      { enemies: ['runaway_lawnmower'], count: 1, rect: { x: 52, y: 51, w: 4, h: 1 }, ifFlag: 'q_mail', unlessFlag: 'q_mail_sodd' },
      // the WINDING CLIMB's encounter bands, one per terrace leg
      { enemies: ['coily_cicada', 'hill_slug_deluxe'], count: 2, rect: { x: 58, y: 38, w: 26, h: 6 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' }, // Leg 1 (L2)
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 54, y: 29, w: 22, h: 4 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' }, // Leg 2 (L3), clear of the hairpin picnic
      { enemies: ['coily_cicada', 'skeeter_swarm'], count: 2, rect: { x: 42, y: 19, w: 16, h: 4 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' }, // Leg 3 (L4)
      { enemies: ['tick_nymph', 'skeeter_swarm'], count: 2, rect: { x: 41, y: 5, w: 12, h: 10 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' }, // the scree zig-zag (L5)
      { enemies: ['tick_nymph', 'coily_cicada'], count: 2, rect: { x: 5, y: 12, w: 7, h: 12 }, ifFlag: 'meteor_fell', unlessFlag: 'tick_defeated' }, // the west (cave) corridor
    ],
    triggers: [
      { id: 'porch', rect: { x: 46, y: 56, w: 6, h: 2 }, once: true },
      // the crater set-piece — the scree apron now hands over to the bowl from the
      // WEST; x62 keeps the beat from firing way out on the rim ring
      { id: 'crater', rect: { x: 62, y: 1, w: 20, h: 12 }, once: false },
      // Microbeats are replayable rectangles because their runtime phase checks
      // can legitimately no-op on an early crossing. Each handler owns the named
      // persistent *_seen flag and matching DIALOGUE key.
      { id: 'ch1_hill_entry_warning', rect: { x: 52, y: 61, w: 8, h: 5 }, once: false },
      // Fires on the first step out of the shed's rear breach. Runtime keeps
      // presentation separate from the crossing fact committed by the door.
      { id: 'ch1_trail_shed_crossed', rect: { x: 9, y: 23, w: 7, h: 3 }, once: false },
      { id: 'ch1_cave_threshold', rect: { x: 4, y: 7, w: 8, h: 5 }, once: false },
      { id: 'ch1_hush_main_street', rect: { x: 50, y: 123, w: 12, h: 9 }, once: false },
      { id: 'ch1_restored_town_reveal', rect: { x: 23, y: 59, w: 7, h: 7 }, once: false },
    ],
    patrols: [{
      id: 'hodgkin_mower', enemy: 'runaway_lawnmower', route: [[15, 42], [25, 42]],
      ifFlag: 'ch1_trail_key_asked', unlessFlag: 'tick_defeated', countFlag: 'q_mower_caught',
    }],
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
    xy.map(([x, y]) => {
      const sprite = treeSprite(x, y);
      return { sprite, x, y, solid: treeSolid(sprite) };
    });

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
      const sprite = treeSprite(cx, cy);
      canopyTrees.push({ sprite, x: cx, y: cy, solid: treeSolid(sprite) });
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
    name: 'OTTERBROOKE, OH',
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
      { id: 'crater', rect: { x: 66, y: 9, w: 8, h: 3 }, once: false },
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
    name: 'OTTERBROOKE CITY HALL',
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
    name: 'OTTERBROOKE STATION',
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
      { sprite: 'payphone', x: 1, y: 14, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      // Borden books you in the cell — present only while he's marched you in
      { id: 'borden_cell', sprite: 'npc_borden', x: 14, y: 3, facing: 'down', dialogue: 'npc_borden_holding', ifFlag: 'borden_marching', unlessFlag: 'borden_cleared' },
    ],
    signs: [{ x: 4, y: 1, dialogue: 'sign_station_wall' }],
    phones: [{ x: 1, y: 14 }],
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
 * NORTH mouth, BEFORE its hot middle (§B4). Two cutscene beats are flag-gated (a
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

/** The long walk was originally authored west-to-east, even after Otterbrooke's
 * chapter road moved to its SOUTH edge. Rotate those finished route drafts once,
 * at assembly, so every hand-placed rest, encounter, present, NPC, and story zone
 * keeps its relationship to the path while the world now reads NORTH-to-SOUTH.
 *
 * Props stay upright (trees, phones, tables, signs); only the sawhorse is truly
 * directional. Grid glyphs whose art has an axis swap to their perpendicular
 * counterpart. Embedded facade doors are deliberately unsupported here: this
 * helper is scoped to the four facade-free Long Walk drafts below. */
function rotateLongWalkClockwise(map: MapDef): MapDef {
  const oldH = map.grid.length;
  const oldW = map.grid[0].length;
  const rotateChar = (ch: string): string => {
    if (ch === '-') return '|';
    if (ch === '|') return '-';
    if (ch === '_') return 'D';
    if (ch === 'D') return '_';
    return ch;
  };
  const rotateRows = (rows: string[], chars = false): string[] =>
    Array.from({ length: oldW }, (_row, newY) =>
      Array.from({ length: oldH }, (_col, newX) => {
        const ch = rows[oldH - 1 - newX][newY];
        return chars ? rotateChar(ch) : ch;
      }).join(''),
    );
  const point = <T extends { x: number; y: number }>(p: T): T => ({
    ...p,
    x: oldH - 1 - p.y,
    y: p.x,
  });
  const rect = <T extends { x: number; y: number; w: number; h: number }>(r: T): T => ({
    ...r,
    x: oldH - r.y - r.h,
    y: r.x,
    w: r.h,
    h: r.w,
  });
  const facing = (f: NpcDef['facing']): NpcDef['facing'] => ({
    up: 'right',
    right: 'down',
    down: 'left',
    left: 'up',
  })[f] as NpcDef['facing'];

  return {
    ...map,
    grid: rotateRows(map.grid, true),
    elevation: map.elevation ? { level: rotateRows(map.elevation.level) } : undefined,
    props: map.props.map((p) => {
      const moved = point(p);
      // The meteor is shape-neutral; the barrier across its lane is not.
      return p.sprite === 'sawhorse' ? { ...moved, rot: 90 as const } : moved;
    }),
    npcs: map.npcs.map((n) => ({ ...point(n), facing: facing(n.facing) })),
    signs: map.signs.map(point),
    phones: map.phones.map(point),
    atms: map.atms?.map(point),
    doors: map.doors.map((d) => ({ ...rect(d), facing: facing(d.facing) })),
    spawners: map.spawners.map((s) => ({ ...s, rect: rect(s.rect) })),
    triggers: map.triggers.map((t) => ({ ...t, rect: rect(t.rect) })),
    patrols: map.patrols?.map((p) => ({
      ...p,
      route: p.route.map(([x, y]) => [oldH - 1 - y, x] as [number, number]),
    })),
    reflect: map.reflect?.map(rect),
  };
}

/** Pixel landing one tile INSIDE an edge door. Read the trail itself rather
 * than the rectangular door center: a two-tile mouth can straddle the curved
 * route, while the visible ':' tile is the safe player-feet coordinate. */
function edgeDoorLanding(map: MapDef, to: string): { tx: number; ty: number } {
  const d = map.doors.find((door) => door.to === to);
  if (!d) return { tx: 40, ty: 40 };
  const W = map.grid[0].length;
  const H = map.grid.length;
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  if (d.y === 0) return { tx: trailColAt(map.grid, 0) * 16 + 8, ty: 16 };
  if (d.y + d.h >= H) return { tx: trailColAt(map.grid, H - 1) * 16 + 8, ty: (H - 2) * 16 };
  if (d.x === 0) return { tx: 16, ty: trailRowAt(map.grid, 0) * 16 + 8 };
  if (d.x + d.w >= W) return { tx: (W - 2) * 16, ty: trailRowAt(map.grid, W - 1) * 16 + 8 };
  return { tx: cx * 16, ty: cy * 16 };
}

/** Trail column on a rotated route row (the north/south analogue of trailRowAt). */
function trailColAt(grid: string[], row: number): number {
  const line = grid[row] ?? '';
  for (let x = 0; x < line.length; x++) if (line[x] === ':') return x;
  return Math.round(line.length / 2);
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
      // the interaction lives on the BOX TILE **and** the tile below it: facing the
      // box from any side opens it (EB behaviour). With only the y+1 entry, pressing
      // A while facing the box itself did nothing — the "present doesn't open"
      // 2026-07-09 playtest report.
      { x, y, dialogue: flag, unlessFlag: flag },
      { x, y, dialogue: `${flag}_done`, ifFlag: flag },
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

/** LEG 1 — MEADOW MILE: authored left-to-right, then quarter-turned at assembly
 *  into the meadow south of town. It carries the Task-0 meteor roadblock; its
 *  live south edge continues into the woods. The gentlest §A7 band (near town). */
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
      { x: 0, y: westY, w: 1, h: 2, to: 'otterbrook', tx: OTTERBROOK_SOUTH_GATE.x * 16, ty: OTTERBROOK_SOUTH_GATE.y * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_woods', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: draft.spawners,
    // S15i Task 3 (ADR-058): THE WALKERS' REGISTER token — a strip just past Hal
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
 *  the live south-edge trigger, grandfather clause intact) and the "you can see the city
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
      // the "you can see the city now" reveal — at the authored west entry;
      // rotation makes this the live NORTH entry from the far meadow
      { id: 'city_reveal', rect: { x: 1, y: 0, w: 3, h: H }, once: false },
      // THE ORIENTATION GATE — the authored east edge becomes the live SOUTH city
      // line; the gate runs the proctor exercises → visitor_badge, or walks you
      // straight in on badge/bus
      { id: 'orientation_gate', rect: { x: W - 3, y: 0, w: 3, h: H }, once: false },
    ],
  };
}

/** THE LONG WALK — build all four legs and wire their COMPUTED inter-leg doors:
 *  every door's tx/ty is overwritten to land on the neighbour's REAL trail entry
 *  (read off the draft), never a hardcoded coordinate (the ADR-012 discipline). */
function buildLongWalk(): { meadow_mile: MapDef; meadow_woods: MapDef; meadow_far: MapDef; meadow_overpass: MapDef } {
  // Preserve the shipped authored content, but correct its world axis: each old
  // west mouth becomes NORTH and each old east mouth becomes SOUTH.
  const meadow_mile = rotateLongWalkClockwise(buildMeadowMile());
  const meadow_woods = rotateLongWalkClockwise(buildMeadowWoods());
  const meadow_far = rotateLongWalkClockwise(buildMeadowFar());
  const meadow_overpass = rotateLongWalkClockwise(buildMeadowOverpass());
  // Cross-aim each SOUTH door at its neighbour's NORTH landing and vice versa.
  const aim = (m: MapDef, to: string, tx: number, ty: number): void => {
    const d = m.doors.find((x) => x.to === to);
    if (d) { d.tx = tx; d.ty = ty; }
  };
  const wire = (north: MapDef, south: MapDef): void => {
    const intoSouth = edgeDoorLanding(south, north.id);
    const intoNorth = edgeDoorLanding(north, south.id);
    aim(north, south.id, intoSouth.tx, intoSouth.ty);
    aim(south, north.id, intoNorth.tx, intoNorth.ty);
  };
  wire(meadow_mile, meadow_woods);
  wire(meadow_woods, meadow_far);
  wire(meadow_far, meadow_overpass);
  return { meadow_mile, meadow_woods, meadow_far, meadow_overpass };
}

/* ------------------- THE HICKORY HILL CAVE (ADR-145 canon) -------------------
 * The meteor opened a cave in Hickory Hill. BOSS 1 waits on the raised mound
 * at the end of the directed three-map chain: oak_roots combat descent,
 * oak_hollow breather/cache, then the oak_heart arena. The set rides
 * CH1_STORY_NIGHT_MAPS' Hush clock until the Tick falls and real morning
 * reaches the stone. Direction is given in dawn_hush_dark, sign_oak_burrow at
 * the hilltop mouth, and tick_cave_approach in the arena. Internal oak_* map
 * and heart_oak trigger ids remain stable; they do not place the fight at the
 * outdoor Heart Oak or in Pond Park. */

/** the root tunnel — enter from the burrow (bottom), wind and climb-down north */
/* THE HICKORY HILL CAVE (oak_roots / oak_hollow / oak_heart) — rebuilt 2026-07-09
 * to the EarthBound GIANT STEP grammar via the MAP EDITOR PIPELINE: the literals
 * live in src/data/maps_oakcave.ts (generated from tools/mapeditor/oak_*.json —
 * edit THERE, not here). Three elevated floors: the DESCENT (great shelf + the
 * L2 present ledge), the BREATHER (pool + picnic + save payphone + the cache
 * overlook), and the ARENA (the Tick's raised root dais, heart_oak trigger). */

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
      { sprite: 'prop_rocket_fuselage', x: 13.2, y: 1.7, solid: { ox: 4, oy: 24, w: 26, h: 14 } },
      { sprite: 'prop_workbench', x: 2, y: 2.6, solid: { ox: 1, oy: 12, w: 26, h: 10 } },
      { sprite: 'prop_blueprint_table', x: 7.2, y: 5.4, solid: { ox: 1, oy: 12, w: 24, h: 10 } },
      { sprite: 'prop_parts_bin', x: 1.4, y: 7.1, solid: { ox: 1, oy: 10, w: 18, h: 9 } },
      { sprite: 'shelf_b', x: 5, y: 1.8, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'floor_lamp', x: 15, y: 7.4, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'payphone', x: 1, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'pemberton', sprite: 'ml_pemberton', x: 10, y: 4, facing: 'down', dialogue: 'npc_pemberton_ch1', idle: true, emote: 'think' },
    ],
    signs: [
      { x: 8, y: 6, dialogue: 'pemberton_blueprints' },
      { x: 14, y: 3, dialogue: 'pemberton_rocket' },
    ],
    phones: [{ x: 1, y: 9 }],
    doors: [{ x: 8, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/** Hodgkin's route-gate shed: the key opens the exterior front door, this room
 * carries the optional supplies, and a visibly broken rear wall is the only way
 * through to the upper cave approach. The two exterior landings sit on opposite
 * sides of the full-width shed collision, so the map cannot be bypassed. */
function buildTrailShedInt(): MapDef {
  const g = new Grid(14, 12, 'w');
  g.rect(0, 0, 14, 2, 'W');
  g.rect(6, 6, 2, 4, 'r');
  return {
    id: 'trail_shed_int',
    name: "HODGKIN'S TRAIL SHED",
    music: 'hill',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf_b', x: 1, y: 1.7, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'crate', x: 2.2, y: 5.2, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      { sprite: 'crate', x: 3.8, y: 5.7, solid: { ox: 1, oy: 8, w: 18, h: 10 }, unlessFlag: 'shed_looted' },
      { sprite: 'fb_barrel', x: 10.5, y: 4.8, solid: { ox: 1, oy: 12, w: 16, h: 10 }, unlessFlag: 'shed_looted' },
      { sprite: 'fb_rope_coil', x: 10.7, y: 7.3 },
      { sprite: 'floor_lamp', x: 1.2, y: 8.1, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
    ],
    npcs: [],
    signs: [
      { x: 3, y: 6, dialogue: 'trail_shed' },
      { x: 7, y: 2, dialogue: 'trail_shed_back_hole' },
    ],
    phones: [],
    atms: [],
    doors: [
      { x: 6, y: 11, w: 2, h: 1, to: 'otterbrook', tx: 12 * 16 + 8, ty: 32 * 16 + 12, facing: 'down', indicator: 'door' },
      // Trigger from the first walkable row below the north wall. Row 1 is solid;
      // placing the zone there made collision win before the rear breach could fire.
      { x: 6, y: 2, w: 2, h: 1, to: 'otterbrook', tx: 12 * 16 + 8, ty: 24 * 16 + 12, facing: 'up', indicator: 'hole' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** 27 MAPLE, post-purchase (ADR-115 made real): gloriously EMPTY. The previous
 *  owner took the doorknobs; the beagle stayed. A save phone, a floor note, and
 *  all the room in the world — the first thing the player has ever owned. */
function buildMaple27Int(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(7, 6, 3, 2, 'r');
  return {
    id: 'maple27_int',
    name: '27 MAPLE',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'plant_pot', x: 14, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } }, // the agent's closing gift
    ],
    npcs: [
      { id: 'maple_beagle', sprite: 'dog', x: 10, y: 5, facing: 'left', dialogue: 'npc_maple_beagle', dog: true },
    ],
    signs: [{ x: 8, y: 4, dialogue: 'maple27_note' }],
    phones: [{ x: 1, y: 2 }],
    doors: [{ x: 7, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/** OTTERBROOK REALTY — the agency office (S22/ADR-115's agent finally has a desk):
 *  one fern, one waiting bench, one wall of dream listings. The agencyBeat rides
 *  the realtor_otter NPC id, so the buy flow works unchanged from in here. */
function buildRealtyInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'o');
  g.rect(0, 0, 13, 2, 'O');
  g.rect(6, 5, 2, 2, 'r');
  return {
    id: 'realty_int',
    name: 'OTTERBROOKE REALTY',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'desk', x: 5.5, y: 2.2, solid: { ox: 0, oy: 8, w: 20, h: 12 } },
      { sprite: 'prop_rate_board', x: 9.5, y: 0.4 }, // the listings board
      { sprite: 'bookshelf', x: 1, y: 0.5 },
      { sprite: 'plant_pot', x: 11.5, y: 6.2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'bench', x: 1.5, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } }, // the waiting bench
    ],
    npcs: [
      { id: 'realtor_otter', sprite: 'npc_realtor', x: 6, y: 3, facing: 'down', dialogue: 'npc_realtor', idle: true },
    ],
    signs: [{ x: 9, y: 2, dialogue: 'realty_listings' }],
    phones: [],
    doors: [{ x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/** OLD MAN FIBBINS' cottage — one room, one bed, and a WALL of gravel jars,
 *  each labeled with what the meteor allegedly whispered that day. */
function buildOldmanInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(14, 10, 'w');
  g.rect(0, 0, 14, 2, 'W');
  g.rect(3, 6, 3, 2, 'r');
  return {
    id: 'oldman_int',
    name: "FIBBINS' COTTAGE",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'shelf_b', x: 5, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 8, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 11, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 9, y: 5, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'floor_lamp', x: 12, y: 6.4, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
    ],
    npcs: [],
    signs: [
      { x: 6, y: 3, dialogue: 'fibbins_jars' },
      { x: 9, y: 6, dialogue: 'fibbins_map' },
    ],
    phones: [],
    doors: [{ x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
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

/* ------------------- TWOTON (map id 'brickton') — the Twoson rebuild ------------------- */

/** Where the bus drops you — on the Civic Street curb beside the depot, outside
 * both the carriageway and the exterior return-bus trigger. */
export const BRICKTON_BUS_SPAWN = { x: 48 * 16 + 8, y: 18 * 16 + 8 } as const;

/** where the LONG WALK drops you on foot — just inside Twoton's north road */
// This geometry belongs to the editor-authored Twoton document. Keep the
// runtime spawn paired with that doorway, but do not cut or reshape the city
// during map assembly.
const TWOTON_NORTH_GATE = { x: 72, y: 0, w: 5, h: 1 } as const;
/** The long walk now runs south from Otterbrooke and enters Twoton from its
 * northern road. Keep this independently exported name for save/runtime callers. */
export const BRICKTON_FOOT_SPAWN = {
  x: (TWOTON_NORTH_GATE.x + TWOTON_NORTH_GATE.w / 2) * 16,
  y: 3 * 16 + 8,
} as const;

/** where the docks' return door lands — just inside the east gate, on the bridge road
 *  (maps_ch2's buildBricktonDocks bakes these px; world_block.test asserts they stay walkable) */
export const BRICKTON_DOCKS_RETURN = { tx: 101 * 16 + 8, ty: 56 * 16 + 8 } as const;

/** Department lobby landing, kept in one place so the Twoton facade and the
 * expanded interior cannot drift apart when either map is edited. */
export const DOS_F1_STREET_LANDING = { tx: 20 * 16, ty: 24 * 16 + 10 } as const;

/**
 * TWOTON — the Ch.1 city, rebuilt 2026-07-08 to the EarthBound TWOSON grammar
 * (towns 1–4 = Onett/Twoson/Threed/Fourside; docs/EARTHBOUND_STYLIZATION_OVERHAUL.md §3).
 * The MAP ITSELF is the EDITOR-AUTHORED document — src/data/maps_twoton.ts is the
 * editor's TS export of tools/mapeditor/twoton.json; edit it IN THE MAP EDITOR
 * (npm run dev → /tools/mapeditor/), not by regenerating code. The old frozen-core
 * pair (buildBrickton 1995 / growBrickton 2077 sprawl) is RETIRED — the Otterbrook
 * S3 precedent, applied to town #2.
 *
 * This wrapper grafts only what the editor cannot express, so a re-export can
 * never drop it: the ten NAMED interior doors, art-anchored px rects per facade
 * (ox measured off the drawn door; oy derived from the storefront's APRON row).
 * Everything else is registry-standard: occupyCity grafts the tenancy units +
 * knock signs onto the doorless catalog facades, and the meadow_overpass landing
 * is re-aimed off the live overpass trail below (the computed-coords law, ADR-012).
 */
function makeTwoton(): MapDef {
  const m = twotonMap;
  // Each named facade fronts a sidewalk APRON row (13 = Civic St, 54 = Main St).
  // oy is derived so doorstepOf lands mid-apron (apron·16 + 9) at ANY per-instance
  // scale: doorstep = y·16 + (oy + h)·scale + 5, so oy = (apron·16 + 4 − y·16)/scale
  // − h. The EB scale pass (2026-07-11) grows these facades with PropDef.scale —
  // the old cityBuildingHeight(u)−14 oys were tuned to land on exactly this target
  // at ×1, but overshoot into the carriageway once scaled (G11).
  const NAMED_DOORS: Record<string, { ox: number; w: number; apron: number; to: string; tx: number; ty: number }> = {
    bldg_dept: { ox: 26.25, w: 26, apron: 13, to: 'dos_f1', ...DOS_F1_STREET_LANDING }, // THE DEPARTMENT OF SMILES
    bldg_starmart: { ox: 33, w: 16, apron: 54, to: 'starmart_int', tx: 152, ty: 156 },
    bldg_hospital: { ox: 28.25, w: 26, apron: 13, to: 'hospital_int', tx: 152, ty: 166 }, // TWOTON GENERAL
    bldg_arcade2: { ox: 29.5, w: 16, apron: 54, to: 'arcade2_int', tx: 136, ty: 156 }, // STARPORT II
    bldg_ob_hotel: { ox: 22, w: 16, apron: 13, to: 'twoton_hotel_lobby', tx: 168, ty: 172 },
    bldg_warehouse: { ox: 50.5, w: 26, apron: 13, to: 'twoton_bus_station', tx: 184, ty: 188 },
    bldg_theater: { ox: 20, w: 40, apron: 54, to: 'twoton_theater', tx: 200, ty: 236 },
    bldg_civic: { ox: 27, w: 26, apron: 13, to: 'twoton_community_center', tx: 184, ty: 204 },
    bldg_gen_shop_grass_1: { ox: 37.5, w: 16, apron: 54, to: 'twoton_bike_shop', tx: 152, ty: 172 },
    bldg_diner: { ox: 36.5, w: 16, apron: 54, to: 'twoton_pizza', tx: 168, ty: 204 },
  };
  for (const p of m.props) {
    const d = NAMED_DOORS[p.sprite];
    if (d && !p.door) {
      const sy = typeof p.scale === 'number' ? p.scale : p.scale?.y ?? 1;
      const oy = (d.apron * 16 + 4 - p.y * 16) / sy - 18;
      p.door = { ox: d.ox, oy, w: d.w, h: 18, to: d.to, tx: d.tx, ty: d.ty };
    }
  }
  return m;
}

/* ------------------- THE DEPARTMENT OF SMILES ------------------- */

function buildDosF1(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(40, 26, 'Q');
  g.rect(0, 0, 40, 2, 'L');
  g.rect(0, 0, 1, 26, 'L');
  g.rect(39, 0, 1, 26, 'L');
  g.rect(0, 25, 40, 1, 'L');
  g.rect(19, 25, 2, 1, 'M'); // real street threshold; no exterior welcome mat

  // Opposing full-width banks turn the lobby into a ceremonial procession:
  // enter in the middle, pass east, then cross the upper chamber to the west.
  g.rect(1, 19, 31, 1, 'c');
  g.rect(1, 20, 31, 1, 'k');
  g.rect(8, 12, 31, 1, 'c');
  g.rect(8, 13, 31, 1, 'k');
  g.rect(19, 21, 2, 4, 'M');
  g.rect(33, 15, 2, 4, 'M');
  g.rect(3, 2, 2, 5, 'M');

  return {
    id: 'dos_f1',
    name: 'DEPT. OF SMILES — WELCOME HALL',
    music: 'department',
    interior: true,
    ambience: 'machine',
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 23, y: 21, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'plant_pot', x: 2, y: 22, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 36, y: 22, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 2, y: 4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 36, y: 4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'water_cooler', x: 37, y: 16, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'banner_productive', x: 15, y: 0.55 },
      { sprite: 'poster_smile', x: 6, y: 0.55 },
      { sprite: 'poster_chart', x: 31, y: 0.55 },
    ],
    npcs: [
      { id: 'receptionist', sprite: 'smilerB', x: 24, y: 23, facing: 'down', dialogue: 'npc_receptionist', stationary: true },
      { id: 'dos_f1_staff_a', sprite: 'smiler', x: 6, y: 15, facing: 'right', dialogue: 'npc_dos_welcome', stationary: true },
      { id: 'dos_f1_staff_b', sprite: 'smilerB', x: 13, y: 15, facing: 'down', dialogue: 'npc_dos_doctrine', stationary: true },
      { id: 'dos_f1_staff_c', sprite: 'smiler', x: 22, y: 15, facing: 'left', dialogue: 'npc_dos_painter', stationary: true },
      { id: 'dos_f1_staff_d', sprite: 'smilerB', x: 30, y: 15, facing: 'up', dialogue: 'npc_dos_doubter', stationary: true },
      { id: 'dos_f1_staff_e', sprite: 'smiler', x: 9, y: 6, facing: 'down', dialogue: 'npc_dos_doctrine', stationary: true },
      { id: 'dos_f1_staff_f', sprite: 'smilerB', x: 27, y: 6, facing: 'left', dialogue: 'npc_dos_welcome', stationary: true },
    ],
    signs: [
      { x: 6, y: 1, dialogue: 'dos_lobby' },
      { x: 31, y: 1, dialogue: 'dos_cert' },
    ],
    phones: [],
    doors: [
      { x: 19, y: 25, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'none' },
      { x: 3, y: 2, w: 2, h: 1, to: 'dos_f2', tx: 64, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 35, y: 2, w: 2, h: 1, to: 'dos_f3', tx: 400, ty: 60, facing: 'down', indicator: 'elevator', ifFlag: 'manager_defeated' },
    ],
    spawners: [],
    triggers: [],
    // Route stays clear of the entrance — nobody gets jumped at the street door.
    patrols: [{ id: 'f1a', enemy: 'blazer_smiler', route: [[4, 17], [35, 17]] }],
  };
}

function buildDosF2(): MapDef {
  const g = new Grid(48, 32, 'Q');
  g.rect(0, 0, 48, 2, 'L');
  g.rect(0, 0, 1, 32, 'L');
  g.rect(47, 0, 1, 32, 'L');
  g.rect(0, 31, 48, 1, 'L');

  // The blue congregation maze uses a central spine and opposing banks. The
  // only cross-floor opening is near the bottom, so the two top-side doors can
  // no longer be used five steps apart to skip the dungeon.
  g.rect(23, 2, 2, 27, 'L');
  g.rect(23, 27, 2, 2, 'Q');
  g.rect(1, 8, 17, 1, 'c');
  g.rect(1, 9, 17, 1, 'k');
  g.rect(7, 15, 16, 1, 'c');
  g.rect(7, 16, 16, 1, 'k');
  g.rect(1, 22, 17, 1, 'c');
  g.rect(1, 23, 17, 1, 'k');
  g.rect(31, 8, 16, 1, 'c');
  g.rect(31, 9, 16, 1, 'k');
  g.rect(25, 15, 16, 1, 'c');
  g.rect(25, 16, 16, 1, 'k');
  g.rect(30, 22, 17, 1, 'c');
  g.rect(30, 23, 17, 1, 'k');
  g.rect(3, 2, 2, 5, 'M');
  g.rect(43, 2, 2, 5, 'M');
  g.rect(23, 27, 2, 2, 'M');

  return {
    id: 'dos_f2',
    name: 'DEPT. OF SMILES — BLUE FLOOR',
    music: 'department',
    interior: true,
    ambience: 'machine',
    grid: g.out(),
    props: [
      { sprite: 'picnic', x: 6, y: 3, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'copier', x: 18, y: 4, solid: { ox: 1, oy: 6, w: 22, h: 11 } },
      { sprite: 'plant_pot', x: 21, y: 5, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 26, y: 27, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'water_cooler', x: 45, y: 27, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'banner_productive', x: 18, y: 0.55 },
      { sprite: 'poster_smile', x: 7, y: 0.55 },
      { sprite: 'poster_smile', x: 37, y: 0.55 },
      { sprite: 'poster_chart', x: 29, y: 0.55 },
      { sprite: 'gift_box', x: 3, y: 10.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'dos_gift_cola' },
      { sprite: 'gift_box_open', x: 3, y: 10.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'dos_gift_cola' },
      { sprite: 'gift_box', x: 43, y: 25.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'dos_gift_lunch' },
      { sprite: 'gift_box_open', x: 43, y: 25.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'dos_gift_lunch' },
    ],
    npcs: [
      { id: 'dos_f2_staff_a', sprite: 'smiler', x: 10, y: 5, facing: 'right', dialogue: 'npc_dos_welcome', stationary: true },
      { id: 'dos_f2_staff_b', sprite: 'smilerB', x: 19, y: 6, facing: 'down', dialogue: 'npc_dos_doctrine', stationary: true },
      { id: 'dos_f2_staff_c', sprite: 'smiler', x: 5, y: 11, facing: 'left', dialogue: 'npc_dos_painter', stationary: true },
      { id: 'dos_f2_staff_d', sprite: 'smilerB', x: 18, y: 18, facing: 'up', dialogue: 'npc_dos_doubter', stationary: true },
      { id: 'dos_f2_staff_e', sprite: 'smiler', x: 35, y: 5, facing: 'down', dialogue: 'npc_dos_doctrine', stationary: true },
      { id: 'dos_f2_staff_f', sprite: 'smilerB', x: 43, y: 6, facing: 'left', dialogue: 'npc_dos_welcome', stationary: true },
      { id: 'dos_f2_staff_g', sprite: 'smiler', x: 34, y: 27, facing: 'right', dialogue: 'npc_dos_painter', stationary: true },
      { id: 'dos_f2_staff_h', sprite: 'smilerB', x: 43, y: 28, facing: 'up', dialogue: 'npc_dos_doubter', stationary: true },
    ],
    signs: [
      { x: 7, y: 1, dialogue: 'dos_breakroom' },
      { x: 18, y: 1, dialogue: 'dos_memo1' },
      { x: 29, y: 1, dialogue: 'dos_memo2' },
      { x: 3, y: 10, dialogue: 'dos_gift_cola' },
      { x: 43, y: 25, dialogue: 'dos_gift_lunch' },
    ],
    phones: [],
    doors: [
      { x: 3, y: 2, w: 2, h: 1, to: 'dos_f1', tx: 64, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 44, y: 2, w: 1, h: 1, to: 'dos_f3', tx: 632, ty: 60, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [
      { enemies: ['blazer_smiler', 'mandatory_memo', 'motivational_poster', 'quota_clock'], count: 1, rect: { x: 3, y: 25, w: 17, h: 3 } },
      { enemies: ['blazer_smiler', 'mandatory_memo', 'motivational_poster', 'quota_clock'], count: 1, rect: { x: 27, y: 19, w: 16, h: 3 } },
    ],
    triggers: [],
    patrols: [
      { id: 'f2a', enemy: 'blazer_smiler', route: [[3, 12], [20, 12]] },
      { id: 'f2b', enemy: 'blazer_smiler', route: [[3, 19], [20, 19]] },
      { id: 'f2c', enemy: 'blazer_smiler', route: [[27, 13], [44, 13]] },
    ],
  };
}

/** The sealed HOLDING ROOM block on floor 3. Its deliberately gray interior
 * is only carved into the blue campus after the three quota patrols fall. */
export const HOLDING_ROOM = { x: 3, y: 2, w: 10, h: 8 } as const;
/** doorway cells in the room's bottom rim, under the holding_door prop */
export const HOLDING_DOOR_GAP = { x: 7, w: 2 } as const;

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
  const g = new Grid(42, 28, 'Q');
  g.rect(0, 0, 42, 2, 'L');
  g.rect(0, 0, 1, 28, 'L');
  g.rect(41, 0, 1, 28, 'L');
  g.rect(0, 27, 42, 1, 'L');
  // Two blue wings joined only at two cross-corridors. The player clears the
  // right patrols, crosses low for the third quota, then returns to the cell.
  g.rect(20, 2, 2, 23, 'L');
  g.rect(20, 7, 2, 2, 'Q');
  g.rect(20, 20, 2, 2, 'Q');
  g.rect(HOLDING_ROOM.x, HOLDING_ROOM.y, HOLDING_ROOM.w, HOLDING_ROOM.h, 'L');
  g.rect(27, 10, 14, 1, 'c');
  g.rect(27, 11, 14, 1, 'k');
  g.rect(22, 17, 14, 1, 'c');
  g.rect(22, 18, 14, 1, 'k');
  g.rect(10, 11, 10, 1, 'c');
  g.rect(10, 12, 10, 1, 'k');
  g.rect(1, 17, 14, 1, 'c');
  g.rect(1, 18, 14, 1, 'k');
  g.rect(38, 2, 2, 5, 'M');
  g.rect(24, 2, 2, 5, 'M');
  g.rect(20, 7, 2, 2, 'M');
  g.rect(20, 20, 2, 2, 'M');

  return {
    id: 'dos_f3',
    name: 'DEPT. OF SMILES — COMPLIANCE CHAPEL',
    music: 'department',
    interior: true,
    ambience: 'machine',
    grid: g.out(),
    props: [
      // scene-interpreted (ADR-014): pips light per quota flag; opens into the panel
      { sprite: 'holding_door', x: 7.375, y: 8.25, solid: { ox: 0, oy: 14, w: 20, h: 14 } },
      { sprite: 'office_door', x: 30.5, y: 0.375, solid: { ox: 0, oy: 12, w: 16, h: 14 } },
      { sprite: 'plant_pot', x: 18, y: 3, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 38, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 2, y: 23, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'banner_productive', x: 13, y: 0.55 },
      { sprite: 'poster_smile', x: 27, y: 0.55 },
      { sprite: 'poster_chart', x: 35, y: 0.55 },
      // inside the holding room, visible once it opens
      { sprite: 'cot', x: 4, y: 3.4, solid: { ox: 1, oy: 12, w: 18, h: 10 }, ifFlag: 'holding_open' },
    ],
    npcs: [
      // §A6: MIA waits in the holding room until she joins (S2)
      {
        id: 'faye',
        sprite: 'faye',
        x: 8,
        y: 5,
        facing: 'down',
        dialogue: 'npc_faye_wait',
        ifFlag: 'holding_open',
        unlessFlag: 'faye_joined',
      },
      { id: 'dos_f3_acolyte_a', sprite: 'smiler', x: 4, y: 14, facing: 'right', dialogue: 'npc_dos_doctrine', stationary: true, unlessFlag: 'manager_defeated' },
      { id: 'dos_f3_acolyte_b', sprite: 'smilerB', x: 8, y: 14, facing: 'left', dialogue: 'npc_dos_doubter', stationary: true, unlessFlag: 'manager_defeated' },
      { id: 'dos_f3_acolyte_c', sprite: 'smiler', x: 26, y: 24, facing: 'up', dialogue: 'npc_dos_painter', stationary: true, unlessFlag: 'manager_defeated' },
      { id: 'dos_f3_acolyte_d', sprite: 'smilerB', x: 31, y: 24, facing: 'up', dialogue: 'npc_dos_doctrine', stationary: true, unlessFlag: 'manager_defeated' },
      { id: 'dos_f3_acolyte_e', sprite: 'smiler', x: 36, y: 24, facing: 'up', dialogue: 'npc_dos_welcome', stationary: true, unlessFlag: 'manager_defeated' },
    ],
    signs: [
      { x: 16, y: 1, dialogue: 'dos_quiet' },
      { x: 26, y: 1, dialogue: 'dos_memo3' },
      { x: 31, y: 1, dialogue: 'manager_door' },
      // the intake clipboard hangs off the cot
      { x: 5, y: 5, dialogue: 'holding_log' },
    ],
    phones: [],
    doors: [
      { x: 39, y: 2, w: 1, h: 1, to: 'dos_f2', tx: 712, ty: 60, facing: 'down', indicator: 'stairs' },
      { x: 24, y: 2, w: 2, h: 1, to: 'dos_f1', tx: 576, ty: 60, facing: 'down', indicator: 'elevator', ifFlag: 'manager_defeated' },
    ],
    spawners: [],
    triggers: [
      // inside the opened room — Mia's join scene
      { id: 'faye_meet', rect: { x: 5, y: 4, w: 7, h: 4 }, once: false },
      // After Mia joins, every return to the stairs crosses the exit interview.
      { id: 'manager_block', rect: { x: 22, y: 3, w: 19, h: 3 }, once: false },
    ],
    patrols: [
      { id: 'f3a', enemy: 'blazer_smiler', support: ['mandatory_memo'], route: [[24, 6], [38, 6]], countFlag: 'dos_quota_f3a' },
      { id: 'f3b', enemy: 'blazer_smiler', support: ['motivational_poster'], route: [[38, 14], [24, 14]], countFlag: 'dos_quota_f3b' },
      { id: 'f3c', enemy: 'blazer_smiler', support: ['quota_clock'], route: [[3, 23], [18, 23]], sight: 6, countFlag: 'dos_quota_f3c' },
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
    music: 'valle', // the Spire stands in Valle Dorado now (stage 4, 2026-07-08)
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
      // the Spire stands in VALLE DORADO now (stage 4, 2026-07-08) — the lobby
      // doors open back onto the golden city's High St, at the grafted doorstep
      { x: 8, y: 10, w: 2, h: 1, to: 'valle_dorado', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
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
    name: 'OTTERBROOKE DRUG',
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
      { x: 8, y: 2, w: 1, h: 1, to: 'drugstore_pharmacy', tx: 8 * 16 + 8, ty: 9 * 16 + 12, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** Purpose-built Ch.1 venues. These use the authored Otterbrooke fixture kit
 * that previously shipped unused while all three businesses shared one stub. */
function buildBankInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'o');
  g.rect(0, 0, 16, 2, 'O');
  g.rect(7, 7, 2, 2, 'r');
  return {
    id: 'bank_int', name: 'OTTERBROOKE SAVINGS & LOAN', music: 'otterbrook', interior: true, grid: g.out(),
    props: [
      { sprite: 'prop_teller_grille', x: 4, y: 2.2, solid: { ox: 1, oy: 12, w: 20, h: 12 } },
      { sprite: 'prop_teller_grille', x: 7, y: 2.2, solid: { ox: 1, oy: 12, w: 20, h: 12 } },
      { sprite: 'prop_rate_board', x: 1.2, y: 0.4 },
      { sprite: 'prop_deposit_boxes', x: 11.5, y: 1.4, solid: { ox: 2, oy: 16, w: 24, h: 10 } },
      { sprite: 'prop_velvet_rope', x: 4, y: 6, solid: { ox: 2, oy: 12, w: 10, h: 6 } },
      { sprite: 'prop_velvet_rope', x: 10, y: 6, solid: { ox: 2, oy: 12, w: 10, h: 6 } },
      { sprite: 'atm', x: 1, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
      { sprite: 'payphone', x: 14, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [{ id: 'bank_teller', sprite: 'quarterMan', x: 7, y: 3, facing: 'down', dialogue: 'npc_bank_teller', idle: true }],
    signs: [{ x: 1, y: 2, dialogue: 'bank_rate_board' }, { x: 12, y: 3, dialogue: 'bank_boxes' }],
    phones: [{ x: 14, y: 9 }], atms: [{ x: 1, y: 9 }],
    doors: [
      { x: 7, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 13, y: 2, w: 1, h: 1, to: 'bank_vault', tx: 7 * 16 + 8, ty: 8 * 16 + 12, facing: 'up', indicator: 'door' },
    ],
    spawners: [], triggers: [],
  };
}

function buildBakeryInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(7, 7, 2, 2, 'r');
  return {
    id: 'bakery_int', name: 'OTTERBROOKE BAKERY', music: 'home', interior: true, grid: g.out(),
    props: [
      { sprite: 'prop_pastry_case', x: 3, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_pastry_case', x: 6, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_brick_oven', x: 12.4, y: 1.4, solid: { ox: 2, oy: 16, w: 16, h: 10 } },
      { sprite: 'prop_flour_bins', x: 1.2, y: 6.2, solid: { ox: 1, oy: 10, w: 22, h: 8 } },
      { sprite: 'prop_mixing_station', x: 11, y: 6.2, solid: { ox: 1, oy: 10, w: 18, h: 8 } },
      { sprite: 'payphone', x: 14, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [{ id: 'bakery_keeper', sprite: 'fernLady', x: 5, y: 2, facing: 'down', dialogue: 'npc_bakery_keeper', shop: 'bakery', idle: true }],
    signs: [{ x: 4, y: 4, dialogue: 'bakery_case' }, { x: 12, y: 3, dialogue: 'bakery_oven' }],
    phones: [{ x: 14, y: 9 }], atms: [],
    doors: [{ x: 7, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [], triggers: [],
  };
}

function buildBurgerInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'o');
  g.rect(0, 0, 16, 2, 'O');
  g.rect(7, 7, 2, 2, 'r');
  return {
    id: 'burger_int', name: 'THE OTTER BURGER', music: 'otterbrook', interior: true, grid: g.out(),
    props: [
      { sprite: 'prop_burger_counter', x: 3, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_burger_counter', x: 6, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_flat_grill', x: 11.5, y: 2.2, solid: { ox: 1, oy: 10, w: 20, h: 8 } },
      { sprite: 'prop_deep_fryer', x: 13.5, y: 2.2, solid: { ox: 1, oy: 12, w: 16, h: 9 } },
      { sprite: 'prop_range_hood', x: 12.2, y: 0.3 },
      { sprite: 'prop_booth', x: 2, y: 6.2, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 10, y: 6.2, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'payphone', x: 14, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [{ id: 'burger_keeper', sprite: 'deliKeeper', x: 5, y: 2, facing: 'down', dialogue: 'npc_burger_keeper', shop: 'burger', idle: true }],
    signs: [{ x: 12, y: 3, dialogue: 'burger_grill' }, { x: 3, y: 7, dialogue: 'burger_booth' }],
    phones: [{ x: 14, y: 9 }], atms: [],
    doors: [{ x: 7, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' }],
    spawners: [], triggers: [],
  };
}

/* ----------------------- THE OTTERBROOKE HOTEL -----------------------
 * A compact Mother-style lodging stack: street -> staffed lobby -> one real
 * guest-floor corridor -> three enterable rooms. The first room is the party's
 * paid wake-up destination; the other two turn the building into a small piece
 * of town storytelling instead of a heal menu wearing a facade. */

function buildOtterHotelLobby(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(18, 12, 'w');
  g.rect(0, 0, 18, 2, 'W');
  g.rect(8, 4, 2, 7, 'r');
  return {
    id: 'otter_hotel_lobby',
    name: 'OTTERBROOKE HOTEL',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      // CHECK-IN DESK + old brass key cubbies
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'mailboxes', x: 1.2, y: 0.7 },
      // A small-town lobby: mismatched seating, plant, lamp, local trophy case.
      { sprite: 'bench', x: 12, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'rocking_chair', x: 15, y: 6.2, solid: { ox: 2, oy: 12, w: 14, h: 10 } },
      { sprite: 'floor_lamp', x: 11.2, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'plant_pot', x: 16, y: 8.5, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'trophy_shelf', x: 10.5, y: 0.6 },
      { sprite: 'payphone', x: 16, y: 10, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'otter_hotel_clerk', sprite: 'npc_clerk', x: 4, y: 2, facing: 'down', dialogue: 'npc_otter_hotel_clerk', idle: true },
      { id: 'hotel_lobby_sleeper', sprite: 'grayCommuter', x: 12, y: 7, facing: 'up', dialogue: 'npc_hotel_lobby_sleeper', idle: true, emote: 'sleep', ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
      { id: 'hotel_lobby_guest', sprite: 'oldTimer', x: 13, y: 7, facing: 'left', dialogue: 'npc_hotel_lobby_guest', idle: true, ifFlag: 'tick_defeated' },
    ],
    signs: [
      { x: 1, y: 1, dialogue: 'hotel_key_cubbies' },
      { x: 10, y: 1, dialogue: 'hotel_trophy_case' },
      { x: 8, y: 3, dialogue: 'hotel_registry' },
    ],
    phones: [{ x: 16, y: 10 }],
    atms: [],
    doors: [
      { x: 8, y: 11, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 14, y: 2, w: 2, h: 1, to: 'otter_hotel_hall', tx: 11 * 16 + 8, ty: 8 * 16 + 12, facing: 'up', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildOtterHotelHall(): MapDef {
  const g = new Grid(22, 10, 'w');
  g.rect(0, 0, 22, 2, 'W');
  g.rect(2, 4, 18, 2, 'r');
  return {
    id: 'otter_hotel_hall',
    name: 'OTTERBROOKE HOTEL — FLOOR 2',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      // Room-door markers already add one mat apiece; do not double-stamp them.
      { sprite: 'floor_lamp', x: 6.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 12.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 18.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'water_cooler', x: 20, y: 2.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'plant_pot', x: 1, y: 6.5, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'bench', x: 5.3, y: 6.35, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'trophy_shelf', x: 8.2, y: 0.6 },
    ],
    npcs: [
      { id: 'hotel_housekeeper', sprite: 'fernLady', x: 13, y: 7, facing: 'left', dialogue: 'npc_hotel_housekeeper', idle: true, ifFlag: 'tick_defeated' },
      { id: 'hotel_hall_sleeper', sprite: 'pajamaKid', x: 18, y: 7, facing: 'down', dialogue: 'npc_hotel_hall_sleeper', idle: true, emote: 'sleep', ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    ],
    signs: [
      { x: 1, y: 1, dialogue: 'hotel_floor_directory' },
      { x: 20, y: 2, dialogue: 'hotel_ice_machine' },
    ],
    phones: [],
    atms: [],
    doors: [
      { x: 10, y: 9, w: 2, h: 1, to: 'otter_hotel_lobby', tx: 15 * 16 + 8, ty: 3 * 16 + 12, facing: 'down', indicator: 'elevator' },
      { x: 3, y: 2, w: 2, h: 1, to: 'otter_hotel_room_201', tx: 6 * 16 + 8, ty: 7 * 16 + 12, facing: 'up', indicator: 'door' },
      { x: 9, y: 2, w: 2, h: 1, to: 'otter_hotel_room_202', tx: 6 * 16 + 8, ty: 7 * 16 + 12, facing: 'up', indicator: 'door' },
      { x: 15, y: 2, w: 2, h: 1, to: 'otter_hotel_room_203', tx: 6 * 16 + 8, ty: 7 * 16 + 12, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

function hotelRoomBase(id: string, name: string, hallTx: number, props: PropDef[], npcs: NpcDef[], signs: SignDef[]): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  return {
    id,
    name,
    music: 'home',
    interior: true,
    grid: g.out(),
    props,
    npcs,
    signs,
    phones: [],
    atms: [],
    doors: [{ x: 5, y: 8, w: 2, h: 1, to: 'otter_hotel_hall', tx: hallTx, ty: 3 * 16 + 12, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

function buildOtterHotelRoom201(): MapDef {
  return hotelRoomBase(
    'otter_hotel_room_201',
    'OTTERBROOKE HOTEL — ROOM 201',
    4 * 16 + 8,
    [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'bed', x: 8, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'dresser', x: 4.6, y: 1.1, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
      { sprite: 'tv', x: 5.2, y: 0.5 },
      { sprite: 'floor_lamp', x: 10.3, y: 5.2, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
    ],
    [],
    [
      { x: 2, y: 3, dialogue: 'hotel_room_201_bed' },
      { x: 6, y: 1, dialogue: 'hotel_room_201_tv' },
    ],
  );
}

function buildOtterHotelRoom202(): MapDef {
  return hotelRoomBase(
    'otter_hotel_room_202',
    'OTTERBROOKE HOTEL — ROOM 202',
    10 * 16 + 8,
    [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'bed', x: 8, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'dresser', x: 4.8, y: 1.1, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
      { sprite: 'crate', x: 9, y: 5.5, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'rocking_chair', x: 1.5, y: 5.4, solid: { ox: 2, oy: 12, w: 14, h: 10 } },
    ],
    [{ id: 'hotel_room_202_guest', sprite: 'senora', x: 6, y: 5, facing: 'down', dialogue: 'npc_hotel_room_202_guest', idle: true }],
    [{ x: 9, y: 6, dialogue: 'hotel_room_202_luggage' }],
  );
}

function buildOtterHotelRoom203(): MapDef {
  return hotelRoomBase(
    'otter_hotel_room_203',
    'OTTERBROOKE HOTEL — ROOM 203',
    16 * 16 + 8,
    [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 6, y: 1.6, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'bookshelf', x: 9, y: 0 },
      { sprite: 'crate', x: 8.5, y: 5.3, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'floor_lamp', x: 4.2, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
    ],
    [{ id: 'hotel_room_203_guest', sprite: 'grayCommuter', x: 5, y: 5, facing: 'right', dialogue: 'npc_hotel_room_203_guest', idle: true, emote: 'think' }],
    [
      { x: 7, y: 2, dialogue: 'hotel_room_203_notes' },
      { x: 9, y: 6, dialogue: 'hotel_room_203_case' },
    ],
  );
}

/** Small public buildings get a real staff-side room rather than ending at a
 * painted counter. Each room keeps a clear center aisle and returns through the
 * exact front-room door that led into it. */
function otterServiceRoom(
  id: string,
  name: string,
  music: string,
  frontId: string,
  frontTx: number,
  frontTy: number,
  props: PropDef[],
  npcs: NpcDef[],
  signs: SignDef[],
  floor = 'w',
  wall = 'W',
  W = 16,
  H = 11,
): MapDef {
  const g = new Grid(W, H, floor);
  g.rect(0, 0, W, 2, wall);
  const gap = Math.round(W / 2) - 1;
  g.rect(gap, H - 4, 2, 2, floor === 'a' ? '*' : 'r');
  return {
    id,
    name,
    music,
    interior: true,
    grid: g.out(),
    props,
    npcs,
    signs,
    phones: [],
    atms: [],
    doors: [{ x: gap, y: H - 1, w: 2, h: 1, to: frontId, tx: frontTx, ty: frontTy, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

function buildBankVault(): MapDef {
  return otterServiceRoom(
    'bank_vault',
    'OTTERBROOKE S&L — VAULT',
    'otterbrook',
    'bank_int',
    13 * 16 + 8,
    3 * 16 + 12,
    [
      { sprite: 'prop_vault_door', x: 5.4, y: 0.5, solid: { ox: 2, oy: 18, w: 24, h: 10 } },
      { sprite: 'prop_deposit_boxes', x: 1.2, y: 2.2, solid: { ox: 2, oy: 16, w: 24, h: 10 } },
      { sprite: 'prop_deposit_boxes', x: 10, y: 2.2, solid: { ox: 2, oy: 16, w: 24, h: 10 } },
      { sprite: 'prop_gold_stack', x: 6, y: 5, solid: { ox: 2, oy: 12, w: 24, h: 10 } },
      { sprite: 'prop_velvet_rope', x: 4, y: 7, solid: { ox: 2, oy: 12, w: 10, h: 6 } },
      { sprite: 'prop_velvet_rope', x: 9, y: 7, solid: { ox: 2, oy: 12, w: 10, h: 6 } },
    ],
    [{ id: 'bank_vault_guard', sprite: 'oldTimer', x: 11, y: 6, facing: 'left', dialogue: 'npc_bank_vault_guard', idle: true }],
    [
      { x: 2, y: 3, dialogue: 'bank_vault_boxes' },
      { x: 7, y: 6, dialogue: 'bank_vault_gold' },
    ],
    'o',
    'O',
    14,
    10,
  );
}

function buildHardwareStockroom(): MapDef {
  return otterServiceRoom(
    'hardware_stockroom',
    "HODGKIN'S — STOCKROOM",
    'otterbrook',
    'hardware_int',
    8 * 16 + 8,
    3 * 16 + 12,
    [
      { sprite: 'prop_workbench', x: 5, y: 2.2, solid: { ox: 1, oy: 12, w: 30, h: 12 } },
      { sprite: 'prop_parts_bin', x: 10, y: 2, solid: { ox: 1, oy: 14, w: 24, h: 10 } },
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 13, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'crate', x: 2, y: 6.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate', x: 12, y: 6.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'sawhorse', x: 7, y: 6.4, solid: { ox: 0, oy: 6, w: 64, h: 22 } },
    ],
    [{ id: 'hardware_apprentice', sprite: 'pajamaKid', x: 5, y: 7, facing: 'right', dialogue: 'npc_hardware_apprentice', idle: true }],
    [
      { x: 10, y: 3, dialogue: 'hardware_parts_bins' },
      { x: 7, y: 7, dialogue: 'hardware_sawhorse' },
    ],
  );
}

function buildDinerKitchen(): MapDef {
  return otterServiceRoom(
    'diner_kitchen',
    'THE SUNNY SIDE — KITCHEN',
    'otterbrook',
    'diner_int',
    9 * 16 + 8,
    3 * 16 + 12,
    [
      { sprite: 'fridge', x: 1.2, y: 2, solid: { ox: 2, oy: 14, w: 14, h: 18 } },
      { sprite: 'prop_flat_grill', x: 4, y: 2.4, solid: { ox: 1, oy: 10, w: 20, h: 8 } },
      { sprite: 'prop_deep_fryer', x: 7, y: 2.4, solid: { ox: 1, oy: 12, w: 16, h: 9 } },
      { sprite: 'prop_range_hood', x: 5.2, y: 0.3 },
      { sprite: 'prop_mixing_station', x: 11, y: 2.2, solid: { ox: 1, oy: 10, w: 18, h: 8 } },
      { sprite: 'prop_flour_bins', x: 13.2, y: 6.2, solid: { ox: 1, oy: 10, w: 22, h: 8 } },
      { sprite: 'counter', x: 4, y: 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    ],
    [{ id: 'diner_cook', sprite: 'deliKeeper', x: 8, y: 5, facing: 'left', dialogue: 'npc_diner_cook', idle: true }],
    [
      { x: 5, y: 3, dialogue: 'diner_order_rail' },
      { x: 13, y: 7, dialogue: 'diner_pie_corner' },
    ],
  );
}

function buildDrugstorePharmacy(): MapDef {
  return otterServiceRoom(
    'drugstore_pharmacy',
    'OTTERBROOKE DRUG — PHARMACY',
    'otterbrook',
    'drugstore_int',
    9 * 16 + 8,
    3 * 16 + 12,
    [
      { sprite: 'prop_pharmacy_rack', x: 1.5, y: 2, solid: { ox: 1, oy: 14, w: 26, h: 10 } },
      { sprite: 'prop_pharmacy_rack', x: 10.5, y: 2, solid: { ox: 1, oy: 14, w: 26, h: 10 } },
      { sprite: 'shelf_b', x: 13, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'fridge', x: 1.2, y: 6, solid: { ox: 2, oy: 14, w: 14, h: 18 } },
      { sprite: 'prop_workbench', x: 5, y: 5.5, solid: { ox: 1, oy: 12, w: 30, h: 12 } },
      { sprite: 'privacy_curtain', x: 10, y: 6, solid: { ox: 1, oy: 14, w: 24, h: 8 } },
      { sprite: 'poster_chart', x: 7, y: 0.5 },
    ],
    [{ id: 'pharmacy_tech', sprite: 'nurse', x: 8, y: 4, facing: 'down', dialogue: 'npc_pharmacy_tech', idle: true }],
    [
      { x: 2, y: 3, dialogue: 'pharmacy_rack' },
      { x: 6, y: 6, dialogue: 'pharmacy_ledger' },
    ],
  );
}

function buildArcadeService(): MapDef {
  return otterServiceRoom(
    'arcade_service',
    'STARPORT — SERVICE ROOM',
    'arcade',
    'arcade_int',
    6 * 16 + 8,
    3 * 16 + 12,
    [
      { sprite: 'cab_a', x: 1, y: 2, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_b', x: 3, y: 2, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'tv_stack', x: 12, y: 2, solid: { ox: 1, oy: 14, w: 22, h: 10 } },
      { sprite: 'desk', x: 6, y: 2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'prop_parts_bin', x: 10, y: 5.5, solid: { ox: 1, oy: 14, w: 24, h: 10 } },
      { sprite: 'crate', x: 2, y: 6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate', x: 12, y: 7, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    ],
    [{ id: 'starport_tech', sprite: 'sidewalkCritic', x: 7, y: 6, facing: 'right', dialogue: 'npc_starport_tech', idle: true, emote: 'think' }],
    [
      { x: 2, y: 3, dialogue: 'arcade_service_cabinets' },
      { x: 10, y: 6, dialogue: 'arcade_service_log' },
    ],
    'a',
    'A',
  );
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
    name: 'OTTERBROOKE TRANSIT',
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
      { id: 'depot_board_reader', sprite: 'quarterMan', x: 9, y: 3, facing: 'up', dialogue: 'npc_depot_board', idle: true, emote: 'think', ifFlag: 'tick_defeated' },
      { id: 'depot_commuter_a', sprite: 'grayCommuter', x: 7, y: 7, facing: 'up', dialogue: 'npc_depot_commuter_a', idle: true, emote: 'think', ifFlag: 'tick_defeated' },
      { id: 'depot_traveler', sprite: 'senora', x: 11, y: 7, facing: 'left', dialogue: 'npc_depot_traveler', idle: true, ifFlag: 'tick_defeated' },
      { id: 'depot_napper', sprite: 'oldTimer', x: 7, y: 9, facing: 'up', dialogue: 'npc_depot_napper', idle: true, ifFlag: 'tick_defeated' },
      { id: 'depot_commuter_b', sprite: 'grayCommuter', x: 11, y: 9, facing: 'up', dialogue: 'npc_depot_commuter_b', wander: true, ifFlag: 'tick_defeated' },
      { id: 'depot_kid', sprite: 'pigeonKid', x: 16, y: 6, facing: 'up', dialogue: 'npc_depot_kid', wander: true, ifFlag: 'tick_defeated' },
      { id: 'depot_vendor', sprite: 'fernLady', x: 15, y: 2, facing: 'down', dialogue: 'npc_depot_vendor', idle: true, ifFlag: 'tick_defeated' },
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
      { x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 8, y: 2, w: 1, h: 1, to: 'hardware_stockroom', tx: 8 * 16 + 8, ty: 9 * 16 + 12, facing: 'up', indicator: 'door' },
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
      { x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 9, y: 2, w: 1, h: 1, to: 'diner_kitchen', tx: 8 * 16 + 8, ty: 9 * 16 + 12, facing: 'up', indicator: 'door' },
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
    name: 'OTTERBROOKE CLINIC',
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
      { x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
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
    name: 'OTTERBROOKE CLINIC — EXAM',
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
      { sprite: 'payphone', x: 9, y: 6, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
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
    phones: [{ x: 9, y: 6 }],
    doors: [
      { x: 4, y: 7, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 6, y: 2, w: 1, h: 1, to: 'arcade_service', tx: 8 * 16 + 8, ty: 9 * 16 + 12, facing: 'up', indicator: 'door' },
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
      // Twoton rebuild 2026-07-08: land on the gate's doorstep (just above it, facing down)
      { x: 11, y: H - 1, w: 3, h: 1, to: 'brickton', tx: 88 * 16, ty: 69 * 16 + 8, facing: 'down' },
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

/** Post-build decorative pass — EarthBound-style oblique BRICK RETAINING WALLS (the
 *  risers authored 2026-07-07: top surface + visible front face) framing the Pond Park's
 *  north shore. PROPS ONLY, no `solid` field, so collision/reachability is byte-unchanged
 *  (mirrors the living-city pass; growOtterbrook() itself stays pinned for the byte-identical
 *  build test). Each piece is gated on a grass tile so it can never cover water/paths. */
function addOtterbrookRisers(map: MapDef): MapDef {
  const grid = map.grid;
  const at = (x: number, y: number): string =>
    y >= 0 && y < grid.length && x >= 0 && x < grid[0].length ? grid[y][x] : '#';
  const onGrass = (x: number, y: number): boolean => ' .,~fF'.includes(at(Math.round(x), Math.round(y)));
  const risers: MapDef['props'] = [];
  const put = (sprite: string, x: number, y: number): void => {
    if (onGrass(x, y)) risers.push({ sprite, x, y });
  };
  // brick retaining wall along the Pond Park's north shore (pond foam begins at y131)
  put('riser_brick_corner', 6, 130);
  for (const x of [8, 10.5, 13, 15.5]) put('riser_brick', x, 130.6);
  put('riser_brick_corner', 17.5, 130);
  return { ...map, props: [...map.props, ...risers] };
}

const otterbrookMap = addOtterbrookRisers(growOtterbrook());
const bricktonMap = makeTwoton();
const pigeonKid = bricktonMap.npcs.find((npc) => npc.id === 'pigeon_kid');
if (!pigeonKid) throw new Error('Brickton must retain the save-facing pigeon_kid');
pigeonKid.x = CH1_WORLD.quest.pigeonKid.x;
pigeonKid.y = CH1_WORLD.quest.pigeonKid.y;
const rexDoorstep = doorstepOf(otterbrookMap, 'rex_home') ?? { tx: 46 * 16, ty: 41 * 16 };
const chadDoorstep = doorstepOf(otterbrookMap, 'chad_home') ?? { tx: 60 * 16, ty: 41 * 16 };
const workshopDoorstep = doorstepOf(otterbrookMap, 'workshop_int') ?? { tx: 24 * 16, ty: 31 * 16 };
const maple27Step = doorstepOf(otterbrookMap, 'maple27_int') ?? { tx: 16 * 16, ty: (102 + OTTERBROOK_TOWN_BASE) * 16 };
const realtyStep = doorstepOf(otterbrookMap, 'realty_int') ?? { tx: 87 * 16, ty: (58 + OTTERBROOK_TOWN_BASE) * 16 };
const oldmanStep = doorstepOf(otterbrookMap, 'oldman_int') ?? { tx: 73 * 16, ty: 39 * 16 };
const otterHomeSteps = Object.fromEntries(
  OTTERBROOK_HOME_SPECS.map((h) => [h.id, doorstepOf(otterbrookMap, h.id) ?? { tx: h.x * 16 + 32, ty: (h.y + OTTERBROOK_TOWN_BASE + 6) * 16 }]),
) as Record<(typeof OTTERBROOK_HOME_SPECS)[number]['id'], { tx: number; ty: number }>;
const otterHomeMaps = Object.fromEntries(
  OTTERBROOK_HOME_SPECS.map((h, i) => [h.id, buildOtterHome(h.id, h.name, otterHomeSteps[h.id], i)]),
) as Record<(typeof OTTERBROOK_HOME_SPECS)[number]['id'], MapDef>;
// THE LONG WALK (ADR-056) — the four foot legs, with computed inter-leg doors.
const longWalk = buildLongWalk();
// Twoton's north foot exit lands on the OVERPASS a few tiles NORTH of the
// orientation gate, so returning home never bounces straight back through it.
// The editor document carries a placeholder landing; only the live map is aimed.
{
  const op = longWalk.meadow_overpass;
  const mile = longWalk.meadow_mile;
  const otterGate = otterbrookMap.doors.find((d) => d.to === 'meadow_mile');
  const mileGate = mile.doors.find((d) => d.to === 'otterbrook');
  if (otterGate && mileGate) {
    const intoMile = edgeDoorLanding(mile, 'otterbrook');
    otterGate.tx = intoMile.tx;
    otterGate.ty = intoMile.ty;
    otterGate.facing = 'down';
    mileGate.tx = OTTERBROOK_SOUTH_GATE.x * 16;
    mileGate.ty = OTTERBROOK_SOUTH_GATE.y * 16;
    mileGate.facing = 'up';
  }

  // Returning from town lands just north of the orientation strip, never in it.
  // Twoton's editor-authored north door owns its geometry; assembly only aims
  // that door at the rotated overpass return point.
  const opY = op.grid.length - 5;
  const opX = trailColAt(op.grid, opY);
  const foot = bricktonMap.doors.find((d) => d.to === 'meadow_overpass');
  if (foot) {
    foot.tx = opX * 16 + 8;
    foot.ty = opY * 16;
    foot.facing = 'up';
  }
}
const cityHallDoorstep = doorstepOf(otterbrookMap, 'otterbrook_cityhall') ?? { tx: 104, ty: 672 };
const otterStationDoorstep = doorstepOf(otterbrookMap, 'otter_station') ?? { tx: 248, ty: 680 };
const busDepotDoorstep = doorstepOf(otterbrookMap, 'bus_depot_int') ?? { tx: 760, ty: 392 };
// Named venue returns derive from their facades on the unified Main Street map.
const hardwareStep = doorstepOf(otterbrookMap, 'hardware_int') ?? { tx: 45 * 16, ty: (58 + OTTERBROOK_TOWN_BASE) * 16 };
const dinerStep = doorstepOf(otterbrookMap, 'diner_int') ?? { tx: 12 * 16, ty: (58 + OTTERBROOK_TOWN_BASE) * 16 };
const otterClinicStep = doorstepOf(otterbrookMap, 'otter_clinic_int') ?? { tx: 76 * 16, ty: (28 + OTTERBROOK_TOWN_BASE) * 16 };
const deptDoorstep = doorstepOf(bricktonMap, 'dos_f1') ?? { tx: 489, ty: 121 };
const martDoorstep = doorstepOf(bricktonMap, 'starmart_int') ?? { tx: 80, ty: 121 };
// The editor document owns the facades; makeTwoton grafts their stable service
// doors. Until a facade is present, the fallbacks stay on the known-open bus
// corner so a partial editor export cannot strand an interior return in woods.
const twotonServiceFallback = { tx: BRICKTON_BUS_SPAWN.x, ty: BRICKTON_BUS_SPAWN.y };
const twotonServiceMaps = buildTwotonServiceMaps({
  hotel: doorstepOf(bricktonMap, 'twoton_hotel_lobby') ?? twotonServiceFallback,
  bus: doorstepOf(bricktonMap, 'twoton_bus_station') ?? twotonServiceFallback,
  theater: doorstepOf(bricktonMap, 'twoton_theater') ?? twotonServiceFallback,
  community: doorstepOf(bricktonMap, 'twoton_community_center') ?? twotonServiceFallback,
  bike: doorstepOf(bricktonMap, 'twoton_bike_shop') ?? twotonServiceFallback,
  pizza: doorstepOf(bricktonMap, 'twoton_pizza') ?? twotonServiceFallback,
});
// THE STARFALL SPIRE moved to VALLE DORADO (stage 4, the big city — 2026-07-08);
// its lobby doorstep now derives from the golden city's grafted facade door.
const spireStep = doorstepOf(valleDorado, 'spire_lobby') ?? { tx: 264, ty: 856 };
const drugDoorstep = doorstepOf(otterbrookMap, 'drugstore_int') ?? { tx: 425, ty: 225 };
const arcadeDoorstep = doorstepOf(otterbrookMap, 'arcade_int') ?? { tx: 121, ty: 369 };
const arcade2Doorstep = doorstepOf(bricktonMap, 'arcade2_int') ?? { tx: 345, ty: 313 };
// World Overhaul S5 — the three new authored Otterbrooke storefront stubs
const bankStep = doorstepOf(otterbrookMap, 'bank_int') ?? { tx: 96, ty: 150 };
const bakeryStep = doorstepOf(otterbrookMap, 'bakery_int') ?? { tx: 96, ty: 150 };
const burgerStep = doorstepOf(otterbrookMap, 'burger_int') ?? { tx: 96, ty: 150 };
const otterHotelStep = doorstepOf(otterbrookMap, 'otter_hotel_lobby') ?? {
  tx: 100 * 16,
  ty: (OTTERBROOK_TOWN_BASE + 28) * 16,
};

/* ------------- COSTA ESTRELLA (S13 — the clifftop resort) ------------- */

/**
 * THE WORLD DOOR, AUTHORED FOR PUERTO SOL (ADR-037): when Prompt 28 builds
 * §A5 Ch.2's port, wiring the resort in is ONE LINE — push this onto
 * costa_estrella's doors (and aim a Puerto Sol door back at the resort's
 * south path, tile ~13,15). It is NOT placed today: door targets must
 * exist (the validator's law), and Puerto Sol doesn't yet.
 */
export const COSTA_DOOR_FOR_PUERTO_SOL = {
  x: 12, y: 15, w: 3, h: 1, to: 'puerto_sol',
  // land at the port's NORTH GATE — the one exported const both sides read (ADR-012)
  tx: PUERTO_SOL_NORTH_GATE.tx, ty: PUERTO_SOL_NORTH_GATE.ty,
  facing: 'down',
} as const;

/** the resort grounds: clubhouse, the caddy at the first tee, the plaque.
 *  Dev-reachable standalone (the Sprite Lab precedent) until Prompt 28. */
function buildCostaEstrella(): MapDef {
  const g = new Grid(27, 16, '.');
  g.sprinkle(20, ',~,~fF', 0.09);

  // A moonlit CLIFF THRESHOLD instead of a bare lawn: real surf at north,
  // a scenic lip, two playable golf pockets, and one winding cart path linking
  // Puerto's south gate to the Links Estates' west gate.
  g.rect(0, 0, 27, 3, 'e');
  g.rect(0, 3, 27, 1, 'E');
  g.rect(0, 4, 27, 1, '^');
  // First tee + bunker at west; practice green + authored water garden at east.
  g.rect(2, 5, 8, 6, 'm');
  g.rect(5, 6, 3, 2, 'n');
  g.rect(17, 6, 8, 7, 'm');
  // The overlook plaza breaks the cliff lip with a broad, readable balcony.
  g.rect(10, 4, 7, 3, 'p');

  const cartPath = (points: Array<[number, number]>, width = 3): void => {
    const half = Math.floor(width / 2);
    for (let i = 0; i < points.length - 1; i++) {
      let [x, y] = points[i];
      const [tx, ty] = points[i + 1];
      for (;;) {
        g.rect(x - half, y - half, width, width, ':');
        if (x === tx && y === ty) break;
        if (x !== tx) x += Math.sign(tx - x);
        if (y !== ty) y += Math.sign(ty - y);
      }
    }
  };
  cartPath([[0, 8], [4, 8], [7, 9], [10, 11], [13, 14], [13, 15]]);
  cartPath([[8, 10], [10, 8], [12, 6], [13, 5]], 2);
  cartPath([[12, 11], [15, 10], [18, 10]], 2);

  // Curved hedge pockets frame, rather than square off, the course. The live
  // west/south transition mouths are repainted after the border so neither seals.
  g.rect(0, 4, 1, 12, 'b');
  g.rect(26, 4, 1, 12, 'b');
  g.rect(1, 12, 7, 1, 'b');
  g.rect(17, 5, 8, 1, 'b');
  g.rect(24, 6, 1, 7, 'b');
  g.rect(0, 8, 3, 2, ':');
  g.rect(12, 14, 3, 2, ':');
  for (const [x, y, ch] of [[3, 5, 'F'], [9, 12, 'f'], [18, 13, 'F'], [25, 13, 'f']] as const) g.set(x, y, ch);

  return {
    id: 'costa_estrella',
    name: 'COSTA ESTRELLA LINKS',
    music: 'cage',
    settlement: 'village',
    night: true,
    ambience: 'waves',
    grid: g.out(),
    props: [
      // Four authored micro-scenes: first tee, moonlit overlook, caddie shelter,
      // and practice-water garden. The real clubhouse remains on golf_resort.
      { sprite: 'sign', x: 5, y: 7, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 2, y: 10, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'costa_sun_marker', x: 3.8, y: 4.5, solid: { ox: 7, oy: 27, w: 26, h: 8 } },
      { sprite: 'flagpole', x: 8.2, y: 5.2 },
      { sprite: 'costa_telescope', x: 12.2, y: 3.9, solid: { ox: 7, oy: 29, w: 14, h: 7 } },
      { sprite: 'bench', x: 14.3, y: 5.2, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'footbridge_rail', x: 9.6, y: 3.4 },
      { sprite: 'footbridge_rail', x: 14.4, y: 3.4 },
      { sprite: 'gazebo', x: 17.2, y: 3.2, solid: { ox: 4, oy: 42, w: 31, h: 10 } },
      { sprite: 'costa_windsock', x: 22.3, y: 3.7, solid: { ox: 7, oy: 33, w: 18, h: 7 } },
      { sprite: 'costa_flower_urns', x: 16.8, y: 11.2, solid: { ox: 5, oy: 27, w: 35, h: 8 } },
      { sprite: 'grotto_spring', x: 20.1, y: 8.5, solid: { ox: 5, oy: 25, w: 38, h: 7 } },
      { sprite: 'cattails', x: 19.3, y: 10.4 },
      { sprite: 'cattails', x: 23.1, y: 10.6 },
      { sprite: 'bench', x: 19, y: 13.1, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'palm_a', x: 1.2, y: 4.5 },
      { sprite: 'palm_b', x: 8.8, y: 12.2 },
      { sprite: 'palm_c', x: 16, y: 7.2 },
      { sprite: 'palm_d', x: 24.5, y: 12.1 },
    ],
    npcs: [
      // S15i Task 6 (ADR-059): FITO the caddy moved INTO the new clubhouse (the
      // round-start is indoors now); a starter greets you at the clifftop gate
      { id: 'links_starter', sprite: 'caddy', x: 4, y: 9, facing: 'left', dialogue: 'npc_links_starter', wander: true },
      { id: 'costa_greenkeeper', sprite: 'oldTimer', x: 18, y: 12.5, facing: 'up', dialogue: 'npc_costa_greenkeeper', wander: true },
      { id: 'costa_honeymooner', sprite: 'senora', x: 14, y: 7, facing: 'up', dialogue: 'npc_costa_honeymooner', idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 5, y: 8, dialogue: 'sign_costa' },
      { x: 2, y: 10, dialogue: 'sign_links_gate' },
      { x: 13, y: 5, dialogue: 'sign_costa_overlook' },
      { x: 22, y: 5, dialogue: 'sign_costa_windsock' },
      { x: 20, y: 13, dialogue: 'sign_costa_practice_green' },
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
    reflect: [
      { x: 0, y: 0, w: 27, h: 3, within: 4 },
    ],
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
  // S18 (ADR-095/099) — shipped CHAPTER 3 England: all twelve route, Kettle,
  // academy, boiler, and resonance maps assemble here with the live story/boss.
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
  oak_roots: oakRootsMap,
  oak_hollow: oakHollowMap,
  oak_heart: oakHeartMap,
  rex_home: buildRexHome(rexDoorstep),
  rex_bedroom: buildBedroom(),
  rex_hall: buildRexHall(),
  ana_room: buildAnaRoom(),
  vivi_room: buildViviRoom(),
  chad_home: buildOtterHome('chad_home', 'PICKLE HOUSE', chadDoorstep, 4),
  workshop_int: buildWorkshopInt(workshopDoorstep),
  trail_shed_int: buildTrailShedInt(),
  maple27_int: buildMaple27Int(maple27Step),
  realty_int: buildRealtyInt(realtyStep),
  oldman_int: buildOldmanInt(oldmanStep),
  ...otterHomeMaps,
  brickton: bricktonMap,
  ...twotonServiceMaps,
  dos_f1: buildDosF1(deptDoorstep),
  dos_f2: buildDosF2(),
  dos_f3: buildDosF3(),
  spire_lobby: buildSpireLobby(spireStep), // THE SPIRE's gilt doors — lobby access only

  otterbrook_cityhall: buildOtterbrookCityHallInt(cityHallDoorstep),
  otter_station: buildOtterStationInt(otterStationDoorstep),
  bus_depot_int: buildBusDepotInt(busDepotDoorstep),
  hardware_int: buildHardwareInt(hardwareStep),
  hardware_stockroom: buildHardwareStockroom(),
  diner_int: buildDinerInt(dinerStep),
  diner_kitchen: buildDinerKitchen(),
  otter_clinic_int: buildOtterClinicInt(otterClinicStep),
  otter_clinic_exam: buildOtterClinicExam(),
  drugstore_int: buildDrugstoreInt(drugDoorstep),
  drugstore_pharmacy: buildDrugstorePharmacy(),
  bank_int: buildBankInt(bankStep),
  bank_vault: buildBankVault(),
  bakery_int: buildBakeryInt(bakeryStep),
  burger_int: buildBurgerInt(burgerStep),
  otter_hotel_lobby: buildOtterHotelLobby(otterHotelStep),
  otter_hotel_hall: buildOtterHotelHall(),
  otter_hotel_room_201: buildOtterHotelRoom201(),
  otter_hotel_room_202: buildOtterHotelRoom202(),
  otter_hotel_room_203: buildOtterHotelRoom203(),
  starmart_int: buildStarmartInt(martDoorstep),
  arcade_int: buildArcadeInt(arcadeDoorstep),
  arcade_service: buildArcadeService(),
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
  'realty_int', 'maple27_int', 'oldman_int',
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
    // A target can be tile-clear yet overlap a pinned character's live foot
    // body (the pharmacy return used to land inside its deli keeper). Prefer
    // the centerline, then the two lateral cells beside it, using the runtime
    // 10×9 player and scaled 12×10 NPC footprints in native map pixels.
    const overlapsNpc = (cx: number, cy: number): boolean => {
      const player = { x: cx * 16 + 3, y: cy * 16 + 3, w: 10, h: 9 };
      return room.npcs.some((n) => {
        const raw = n.scale;
        const instanceX = typeof raw === 'number' ? raw : raw?.x ?? 1;
        const instanceY = typeof raw === 'number' ? raw : raw?.y ?? 1;
        const native = n.dog ? 1.5 : 1;
        const sx = native * instanceX;
        const sy = native * instanceY;
        const npc = {
          x: n.x * 16 + 8 - 6 * sx,
          y: n.y * 16 + 22 - 10 * sy,
          w: 12 * sx,
          h: 10 * sy,
        };
        return player.x < npc.x + npc.w && player.x + player.w > npc.x &&
          player.y < npc.y + npc.h && player.y + player.h > npc.y;
      });
    };
    const candidates: Array<[number, number]> = [
      [ix, iy],
      [ix + dy, iy - dx],
      [ix - dy, iy + dx],
    ];
    const landing = candidates.find(([cx, cy]) =>
      cy >= 0 && cx >= 0 && cy < room.grid.length && cx < room.grid[0].length &&
      room.grid[cy][cx] !== wall && !overlapsNpc(cx, cy));
    if (!landing) return;
    d.tx = landing[0] * 16 + 8; // tile interior (ADR-136): the body box fits the one cell
    d.ty = landing[1] * 16 + 12;
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
  meadow_mile: 'otterbrook',
  meadow_woods: 'otterbrook',
  meadow_far: 'otterbrook',
  meadow_overpass: 'otterbrook',
  brickton: 'brickton',
  brickton_docks: 'brickton',
  cage_park: 'cage_park',
  puerto_sol: 'puerto_sol',
  // S18 (ADR-095) — CHAPTER 3 England: the stone town wears its M22 `fraktur`
  // glyph banner (§A11.8) over the M25 fog-stone skin. Academy and moor maps
  // are pinned to their live `wintermoor` rows below.
  biplane_interior: 'foggybottom',
  foggybottom: 'foggybottom',
  kettle_taproom: 'foggybottom',
  kettle_snug: 'foggybottom',
  foggy_moor: 'wintermoor',
  wintermoor_grounds: 'wintermoor',
  the_old_stones: 'wintermoor',
  wintermoor_f1: 'wintermoor',
  wintermoor_f2: 'wintermoor',
  wintermoor_f3: 'wintermoor',
  wintermoor_dorm: 'wintermoor',
  wintermoor_boiler: 'wintermoor',
  // CH.4 Norway — the two settlements wear their own M25 skins + glyph banners
  kvisthavn: 'kvisthavn',
  lilleby: 'lilleby',
  // CH.5 Minimus — the capital wears the heraldic duchy hand (§A11; banner reads
  // MINIMUS MAJOR). The road/maze/crown carry no settlement glyph (like the moor/spine).
  minimus_major: 'minimus',
  // CH.6 Zanzibel — only the bazaar capital carries the cursive settlement glyph;
  // the savanna and ruin approach retain plain place banners.
  zanzibel: 'zanzibel',
  // CH.7 Chandrapore — the capital carries its barscript settlement glyph;
  // the road, train, and palace retain plain place banners.
  chandrapore: 'chandrapore',
  // CH.8 Lotus Harbor — only the formal river city receives the authored China
  // tile/glyph skin; Bamboo Road, Spore Forest, and Mt. Shu keep route banners.
  lotus_harbor: 'lotus_harbor',
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

/** Sequential generated-unit ids renumber whenever a named venue claims a
 * facade. Twoton is under active art-direction, so its generated tenancy uses
 * a coordinate-stable lot id instead; every other city retains its old ids. */
export function stableTwotonLotId(p: Pick<PropDef, 'x' | 'y'>): string {
  return `brickton_lot_${Math.round(p.x * 100)}_${Math.round(p.y * 100)}`;
}
// EVERY settlement runs the pass (not a hardcoded list) — so any city, present or
// future, is alive by default. occupyCity only fills DOORLESS 'bldg_' facades, so
// hand-authored doors/interiors are untouched; a settlement with no catalog
// facades is a harmless no-op. Object.values() is a snapshot, so the interiors we
// merge in aren't re-scanned.
for (const m of Object.values(MAPS)) {
  if (!m.settlement) continue;
  Object.assign(MAPS, occupyCity(m, {
    area: m.area ?? m.id,
    seed: cityLifeSeed(m.id),
    ...(m.id === 'brickton' ? { unitId: stableTwotonLotId } : {}),
    ...(m.id === 'lotus_harbor' ? { pinnedUnlockedPrefix: 4 } : {}),
  }));
}

// Otterbrook's generated unit ids are save-facing map identities. A facade
// insertion must fail assembly instead of silently renumbering an existing save.
const assembledOtterbrookUnits = Object.keys(MAPS)
  .filter((id) => /^otterbrook_unit_\d+$/.test(id))
  .sort((a, b) => Number(a.slice(a.lastIndexOf('_') + 1)) - Number(b.slice(b.lastIndexOf('_') + 1)));
if (JSON.stringify(assembledOtterbrookUnits) !== JSON.stringify(CH1_GENERATED_OTTERBROOK_UNIT_IDS)) {
  throw new Error(
    `Otterbrook generated-unit identities drifted: expected ${CH1_GENERATED_OTTERBROOK_UNIT_IDS.join(', ')}, got ${assembledOtterbrookUnits.join(', ')}`,
  );
}

// Chapter 8 appends a production city behind four save-facing service units.
// Fail assembly immediately if a facade/lock edit ever renumbers the prefix.
for (let unit = 0; unit < 4; unit++) {
  const id = `lotus_harbor_unit_${unit}`;
  if (!MAPS[id]) throw new Error(`Lotus Harbor historical unit ${unit} must survive occupancy`);
}

// CH.6 production expansion changes the occupancy RNG horizon from six source
// facades to sixteen. Keep the one non-service historical storefront identity
// byte-stable; unit id/NPC/return-door already remain stable by construction.
if (!MAPS.zanzibel_unit_3) throw new Error('Zanzibel historical unit 3 must survive occupancy');
MAPS.zanzibel_unit_3.name = 'ODDS & ENDS';

/** Foggybottom is intentionally still a town, so it does not participate in
 * formal-city facade claiming. Its four already-generated high-street units are
 * instead dressed in place after occupancy: no map is added, renamed, or
 * reordered and every exterior facade retains its original door target. */
function customizeFoggybottomAmenities(): void {
  const amenity = SETTLEMENT_AMENITIES.foggybottom;
  const dealer = MAPS[amenity.serviceUnits?.dealership ?? ''];
  const home = MAPS[amenity.serviceUnits?.home ?? ''];
  const agency = MAPS[amenity.serviceUnits?.agency ?? ''];
  const bank = MAPS.foggybottom_unit_3;
  const lobby = MAPS[amenity.hotel.existing?.lobbyId ?? ''];
  const room = MAPS[amenity.hotel.existing?.roomId ?? ''];
  if (!dealer || !home || !agency || !bank || !lobby || !room) {
    throw new Error('Foggybottom amenity roster must reuse units 0-3 and the two existing Kettle maps');
  }

  const dealerW = dealer.grid[0].length;
  const dealerH = dealer.grid.length;
  const paved = dealer.grid.map((row, y) => row.split('').map((tile, x) =>
    x > 0 && x < dealerW - 1 && y > 0 && y < dealerH - 1 ? 'p' : tile,
  ));
  const stripeY = Math.max(2, Math.min(dealerH - 3, Math.round(dealerH / 2)));
  for (let x = 1; x < dealerW - 1; x++) paved[stripeY][x] = x % 2 === 0 ? '=' : 'p';
  dealer.grid = paved.map((row) => row.join(''));
  dealer.name = amenity.dealership.name.toUpperCase();
  dealer.props = [
    { sprite: 'city_ev', x: 1.5, y: 2.2, scale: 0.62, solid: { ox: 3, oy: 8, w: 30, h: 8 } },
    { sprite: 'work_van', x: Math.max(5.5, dealerW - 4.8), y: Math.max(3.8, dealerH - 4.6), scale: 0.62, rot: 90, solid: { ox: 3, oy: 8, w: 30, h: 8 } },
    { sprite: 'prop_rate_board', x: dealerW - 3.3, y: 1.2 },
    { sprite: 'desk', x: Math.max(2, Math.round(dealerW / 2) - 2), y: 1.5, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
    { sprite: 'parking_meter', x: 1.5, y: dealerH - 3.8 },
    { sprite: 'parking_meter', x: Math.max(2, Math.round(dealerW / 2) - 3), y: dealerH - 3.5 },
    { sprite: 'parking_meter', x: Math.min(dealerW - 3, Math.round(dealerW / 2) + 3), y: dealerH - 3.5 },
  ];
  dealer.npcs = [{
    id: cityServiceNpcId('foggybottom', 'dealer'),
    sprite: 'quarterMan',
    x: Math.max(2, dealerW - 3),
    y: Math.max(3, dealerH - 4),
    facing: 'down',
    dialogue: 'citysvc_dealer',
  }];
  dealer.signs = [];

  const homeW = home.grid[0].length;
  const homeH = home.grid.length;
  home.name = `OPEN HOUSE — ${amenity.residential.listingName.toUpperCase()}`;
  home.props = [
    { sprite: 'bed', x: 1.2, y: 1.8, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
    { sprite: 'dresser', x: 4.1, y: 1.2, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
    { sprite: 'bookshelf', x: homeW - 3.2, y: 1.5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
    { sprite: 'dining_table', x: Math.max(3, Math.round(homeW / 2) - 3), y: Math.max(4.2, homeH / 2 - 1), solid: { ox: 2, oy: 12, w: 30, h: 18 } },
    { sprite: 'rocking_chair', x: 1.8, y: homeH - 4.3, solid: { ox: 2, oy: 12, w: 14, h: 10 } },
    { sprite: 'fridge', x: homeW - 2.5, y: homeH - 4.5, solid: { ox: 2, oy: 14, w: 14, h: 18 } },
    { sprite: 'floor_lamp', x: homeW - 4.5, y: homeH - 4.3, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
  ];
  home.npcs = [{
    id: cityServiceNpcId('foggybottom', 'home_host'),
    sprite: 'fernLady',
    x: homeW - 3,
    y: Math.max(3, homeH - 4),
    facing: 'down',
    dialogue: 'citysvc_home_host',
  }];
  home.signs = [];

  const agencyW = agency.grid[0].length;
  const agencyH = agency.grid.length;
  agency.name = amenity.agency.name.toUpperCase();
  agency.props = [
    { sprite: 'desk', x: Math.max(2, Math.round(agencyW / 2) - 3), y: 3, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
    { sprite: 'prop_rate_board', x: agencyW - 4, y: 1.5 },
    { sprite: 'bookshelf', x: 1.3, y: 1.5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
    { sprite: 'bench', x: 2, y: agencyH - 4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: agencyW - 5, y: agencyH - 4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'potted_palm', x: agencyW - 2.2, y: agencyH - 4.3, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
    { sprite: 'poster_chart', x: Math.max(2, Math.round(agencyW / 2)), y: 0.6 },
  ];
  agency.npcs = [{
    id: cityServiceNpcId('foggybottom', 'realtor'),
    sprite: 'npc_realtor',
    x: Math.round(agencyW / 2) - 1,
    y: 4,
    facing: 'down',
    dialogue: 'citysvc_realtor',
  }];
  agency.signs = [];

  const bankW = bank.grid[0].length;
  const bankH = bank.grid.length;
  bank.name = 'TYNE & DISTRICT BANK';
  bank.props = [
    { sprite: 'counter', x: 2, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    { sprite: 'prop_rate_board', x: 2.2, y: 1.3 },
    { sprite: 'mailboxes', x: bankW - 4, y: 1.4 },
    { sprite: 'bookshelf', x: bankW - 3.2, y: bankH - 4.5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
    { sprite: 'potted_palm', x: bankW - 2.2, y: 2.2, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
  ];
  bank.npcs = [{
    id: 'foggybottom_bank_teller',
    sprite: 'npc_clerk',
    x: 3,
    y: 4,
    facing: 'down',
    dialogue: 'npc_bank_teller',
  }];
  bank.signs = [{ x: 2, y: 2, dialogue: 'bank_rate_board' }];

  // The pub front doubles as the hotel lobby. Its lore regular moves out of the
  // snug so the linked room is a genuinely empty, walkable guest room.
  const regular = room.npcs.find((npc) => npc.id === 'kettle_regular');
  lobby.name = `${amenity.hotel.name.toUpperCase()} — LOBBY`;
  lobby.props = [
    ...lobby.props,
    { sprite: 'prop_rate_board', x: 7.8, y: 1.2 },
    { sprite: 'mailboxes', x: 9.3, y: 1.2 },
  ];
  if (regular && !lobby.npcs.some((npc) => npc.id === regular.id)) {
    lobby.npcs.push({ ...regular, x: 14, y: 6, facing: 'left' });
  }
  room.name = `${amenity.hotel.name.toUpperCase()} — SNUG & GUEST ROOM`;
  // Preserve the authored hearth/snug and its east-room partition. Lodging
  // augments the vacant room instead of replacing the whole shared map.
  room.props = [
    ...room.props,
    { sprite: 'bed', x: 24, y: 8, solid: { ox: 1, oy: 8, w: 20, h: 22 } },
  ];
  room.npcs = [];
}

customizeFoggybottomAmenities();

/** Kvisthavn's first four generated units are save-facing. Re-dress those
 * exact rooms as the live cabin, supply store, agency and motor/fuel desk;
 * exterior facade order and door targets remain unchanged. */
function customizeKvisthavnAmenities(): void {
  const amenity = SETTLEMENT_AMENITIES.kvisthavn;
  const home = MAPS[amenity.serviceUnits?.home ?? ''];
  const supply = MAPS.kvisthavn_unit_1;
  const agency = MAPS[amenity.serviceUnits?.agency ?? ''];
  const dealer = MAPS[amenity.serviceUnits?.dealership ?? ''];
  if (!home || !supply || !agency || !dealer) {
    throw new Error(`Kvisthavn amenity roster requires stable generated units 0-3; found ${Object.keys(MAPS).filter((id) => id.startsWith('kvisthavn_unit_')).join(', ')}`);
  }

  const furnish = (map: MapDef, name: string, props: PropDef[], npcs: NpcDef[]): void => {
    map.name = name;
    map.props = props;
    map.npcs = npcs;
    map.signs = [];
  };

  furnish(home, 'OPEN HOUSE — THE KVISTHAVN CABIN', [
    { sprite: 'bed', x: 1.2, y: 1.8, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
    { sprite: 'dresser', x: 4.1, y: 1.2, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
    { sprite: 'dining_table', x: 3, y: 4.2, solid: { ox: 2, oy: 12, w: 30, h: 18 } },
    { sprite: 'bookshelf', x: 7.5, y: 1.4, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
    { sprite: 'floor_lamp', x: 7, y: 4, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
  ], [{ id: cityServiceNpcId('kvisthavn', 'home_host'), sprite: 'fjord_nurse', x: 8, y: 4, facing: 'down', dialogue: 'citysvc_home_host' }]);

  furnish(supply, 'KVISTHAVN KOLONIAL', [
    { sprite: 'checkout_lane', x: 2, y: 4, solid: { ox: 1, oy: 10, w: 40, h: 12 } },
    { sprite: 'mart_aisle', x: 5, y: 2.3, solid: { ox: 0, oy: 12, w: 52, h: 12 } },
    { sprite: 'freezer_case', x: 6.8, y: 4.5, solid: { ox: 1, oy: 12, w: 34, h: 12 } },
  ], [{ id: 'kv_shopkeeper', sprite: 'kvisthavn_shopkeeper', x: 3, y: 3, facing: 'down', dialogue: 'npc_kv_shopkeeper', shop: 'kvisthavn_supply', stationary: true }]);

  furnish(agency, amenity.agency.name.toUpperCase(), [
    { sprite: 'desk', x: 3, y: 3, solid: { ox: 0, oy: 8, w: 40, h: 10 } },
    { sprite: 'prop_rate_board', x: 7, y: 1.4 },
    { sprite: 'bookshelf', x: 1.3, y: 1.5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
    { sprite: 'bench', x: 6, y: 4.5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
  ], [{ id: cityServiceNpcId('kvisthavn', 'realtor'), sprite: 'npc_realtor', x: 5, y: 4, facing: 'down', dialogue: 'citysvc_realtor' }]);

  furnish(dealer, amenity.dealership.name.toUpperCase(), [
    { sprite: 'city_ev', x: 1.5, y: 2.2, scale: 0.62, solid: { ox: 3, oy: 8, w: 30, h: 8 } },
    { sprite: 'work_van', x: 6, y: 4, scale: 0.62, rot: 90, solid: { ox: 3, oy: 8, w: 30, h: 8 } },
    { sprite: 'prop_rate_board', x: 7.5, y: 1.2 },
    { sprite: 'desk', x: 4, y: 1.5, solid: { ox: 0, oy: 8, w: 30, h: 10 } },
    { sprite: 'parking_meter', x: 2, y: 4.5 },
  ], [{ id: cityServiceNpcId('kvisthavn', 'dealer'), sprite: 'quarterMan', x: 8, y: 4, facing: 'down', dialogue: 'citysvc_dealer' }]);
}

customizeKvisthavnAmenities();

// Production-scale exterior pass runs AFTER tenancy so generated unit ids,
// lock rolls, interiors, and save targets are frozen before facade art grows.
// It mutates props in place and never reorders Puerto/Valle's authored arrays.
for (const m of Object.values(MAPS)) promoteFormalCityScale(m);

// ─── Wave 2 (ADR-108) — MAP AMBIENT AUDIO (#16) ─────────────────────────────
// A per-map ambient BED (engine/ambience.ts) layered under the music, plus an
// OPTIONAL explicit muffle override (absent → OverworldScene derives the veil from
// `interior`). Central like MAP_AREA so the whole soundscape reads in one place;
// applied LAST (after the living-city pass) so the fields can't be clobbered, across
// every chapter's maps by id. OverworldScene reads both on map load (Wave 3, #2).
const MAP_AUDIO: Record<string, { ambience?: AmbienceId; muffle?: 0 | 1 | 2 }> = {
  // CH.3 England — machine-made fog hangs wet over the stone town + the open moor
  biplane_interior: { ambience: 'machine', muffle: 1 }, // Lucille's engine/propeller through patched cabin panels
  foggybottom: { ambience: 'rain' }, // the damp town on the Tyne
  kettle_taproom: { ambience: 'rain', muffle: 2 },
  kettle_snug: { ambience: 'rain', muffle: 2 },
  foggy_moor: { ambience: 'wind' }, // the exposed fog road
  the_old_stones: { ambience: 'wind' }, // the Resonance Site, bare to the weather
  wintermoor_grounds: { ambience: 'wind' }, // the academy's windswept grounds
  wintermoor_f1: { ambience: 'rain', muffle: 2 },
  wintermoor_f2: { ambience: 'machine', muffle: 1 },
  wintermoor_f3: { ambience: 'machine', muffle: 2 },
  wintermoor_dorm: { ambience: 'wind', muffle: 2 },
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
// so the fog stays opt-in. Chapter 3's four outdoor maps share the machine-fog;
// OverworldScene reduces it to natural haze after `mainframe_defeated`.
const MAP_ATMOSPHERE: Record<string, 'fog'> = {
  foggybottom: 'fog', // the machine-fog ceiling that sinks with you as you descend the terraces
  foggy_moor: 'fog',
  wintermoor_grounds: 'fog',
  the_old_stones: 'fog',
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
  otterbrook: [{ x: 2, y: 132, w: 18, h: 16, within: 3 }], // Pond Park (SW), concept rows 132-148
  oak_hollow: [{ x: 8, y: 9, w: 7, h: 5, within: 3 }], // the cave's still pool (Giant-Step rebuild)
  golf_resort: [{ x: 23, y: 10, w: 3, h: 3, within: 2 }], // the course's water hazard
  puerto_sol: [{ x: 0, y: 66, w: 100, h: 5, within: 6 }], // working seafront; row 71 is the solid night-horizon ridge
  // CH.4 Norway — the fjord, the moor gorge, and the Sleeper's meltwater fall
  kvisthavn: [{ x: 0, y: 42, w: 64, h: 6, within: 5 }], // the irregular working fjord edge
  bootstep_moor: [{ x: 60, y: 1, w: 4, h: 78, within: 4 }], // the continuous gorge
  spine_shoulder: [{ x: 1, y: 18, w: 54, h: 4, within: 4 }], // the meltwater off the shoulder
};
for (const [id, zones] of Object.entries(MAP_REFLECT)) {
  const m = MAPS[id];
  if (m) m.reflect = zones;
}
