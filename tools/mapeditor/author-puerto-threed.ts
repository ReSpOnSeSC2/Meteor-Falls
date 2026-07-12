/**
 * AUTHOR PUERTO SOL (THREED GRAMMAR) — canonical structural source for both
 * tools/mapeditor/puerto_sol.json and src/data/maps_puerto_sol.ts. Mirrors the
 * production-safe Twoton dual-output workflow.
 *
 * Threed grammar (user ref): a dark tree-bowl town; ONE E-W spine road with
 * gate-arches at both ends; TWO parallel NE-slanting diagonal streets rising
 * off the spine to a top street (parallelogram blocks); a central plaza with
 * a big anchor; a graveyard field NW; boarded shops along the slants.
 * Adapted to a colonial PORT: sea + working docks form the SOUTH band.
 */
import { writeFileSync } from 'node:fs';
import type { MapDef } from '../../src/schemas';

const W = 100;
const H = 72;

/* ---------------- deterministic hash (no RNG — stable forever) ---------------- */
const hash2 = (x: number, y: number): number => {
  let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y + 0x95, 0x85ebca6b);
  h = (Math.imul(h ^ (h >>> 13), 0xc2b2ae35) ^ (h >>> 16)) >>> 0;
  return h;
};

/* ---------------- grid ---------------- */
const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));
const inB = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
const at = (x: number, y: number): string => (inB(x, y) ? g[y][x] : '#');
const set = (x: number, y: number, ch: string): void => {
  if (inB(x, y)) g[y][x] = ch;
};
const rect = (x: number, y: number, w: number, h: number, ch: string): void => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, ch);
};
const grassLike = (x: number, y: number): boolean => ' .,~fF'.includes(at(x, y));

/* grass fuzz (sparse, flat interiors per the EB organic law) */
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const h = hash2(x, y);
    if (h % 20 === 0) set(x, y, ',~,~ff F'[Math.floor((h >>> 8) % 8)]);
  }

/* ---------------- THE TREE BOWL — organic wobble ring, no ruler; south stays
 * open (the malecón/sea take the south band, so the bowl only walls N/W/E) --- */
for (let y = 0; y < 60; y++) {
  const wob = (hash2(1, y) % 3) - 1;
  for (let x = 0; x < 4 + wob; x++) set(x, y, 'b');
  const wob2 = (hash2(2, y) % 3) - 1;
  for (let x = W - 4 - wob2; x < W; x++) set(x, y, 'b');
}
for (let x = 0; x < W; x++) {
  const wob = (hash2(x, 3) % 3) - 1;
  for (let y = 0; y < 5 + wob; y++) set(x, y, 'b');
}

/* ---------------- THE SEA + MALECÓN (south band) ---------------- */
rect(0, 60, W, 6, 'd'); // THE QUAY (rows 60-65), full width
rect(0, 66, W, H - 66, 'e'); // the sea (rows 66-71); foam recomputed LAST
rect(0, H - 1, W, 1, '5'); // the night horizon: a solid, dithered ridge beyond the black water

/* ---------------- ROADS — the spine + north gate + two NE diagonals + top street ---------------- */
interface HSpec { c: number; x0: number; x1: number }
const hRoads: HSpec[] = [];
const roadH = (c: number, x0: number, x1: number): void => {
  for (let x = x0; x <= x1; x++) {
    for (let y = c - 2; y <= c + 1; y++) set(x, y, 'R');
    if (grassLike(x, c - 3)) set(x, c - 3, '=');
    if (grassLike(x, c + 2)) set(x, c + 2, '=');
  }
  hRoads.push({ c, x0, x1 });
};
interface VSpec { xcOf: (y: number) => number; y0: number; y1: number }
const vRoads: VSpec[] = [];
const roadV = (xcOf: (y: number) => number, y0: number, y1: number): void => {
  for (let y = y0; y <= y1; y++) {
    const xc = xcOf(y);
    const next = xcOf(Math.min(y + 1, y1));
    const lo = Math.min(xc, next) - 2;
    const hi = Math.max(xc, next) + 1;
    for (let x = lo; x <= hi; x++) if (!'eEd'.includes(at(x, y))) set(x, y, 'R');
    if (grassLike(lo - 1, y)) set(lo - 1, y, '=');
    if (grassLike(hi + 1, y)) set(hi + 1, y, '=');
  }
  vRoads.push({ xcOf, y0, y1 });
};

/* THE SPINE — one E-W road, gate-arches at both ends. c=54 → rows 52-55 road,
 * walks 51/56 (exactly the task's spec). */
const SPINE_C = 54;
roadH(SPINE_C, 2, 99);
/* west hammerhead turnaround (the west gate-arch mouth) */
rect(2, SPINE_C - 2, 3, 4, 'R');
rect(2, SPINE_C - 3, 3, 1, '=');
rect(2, SPINE_C + 2, 3, 1, '=');

/* NORTH GATE — a N-S road x6-9, from the top edge down to the spine */
roadV(() => 7, 0, SPINE_C - 2);
rect(6, 0, 4, 1, 'R'); // square off the very top edge under the door zone

/* THE TWO DIAGONALS — Threed's slant. diagA: (34,52)→(66,20), full run (it lands
 * on the spine, matching the west gate's turn). diagB: (62,52)→(94,20) — TRUNCATED
 * to y 20-34 (ADAPTED: a full-length diagB would sweep straight through the
 * mega pocket the spec wants on the spine's east-north side; Threed's own
 * diagonal doesn't reach every band either — it tapers into the open block
 * north of the megas instead of driving all the way to the spine). */
const diagAXc = (y: number): number => 34 + (SPINE_C - 2 - y);
const diagBXc = (y: number): number => 62 + (SPINE_C - 2 - y);
roadV(diagAXc, 20, SPINE_C - 2);
roadV(diagBXc, 20, 34);

/* TOP STREET — c=18 → rows 16-19 road, walks 15/20; connects the diagonals' tops */
const TOP_C = 18;
roadH(TOP_C, 30, 96);

/* ---------------- junction cleanup (sidewalk crumbs inside crossings) ---------------- */
const paved = (x: number, y: number): boolean => 'RD_XP2'.includes(at(x, y));
for (let pass = 0; pass < 2; pass++)
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (at(x, y) !== '=') continue;
      let n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (paved(x + dx, y + dy)) n++;
      if (n >= 3) set(x, y, 'R');
    }

/* ---------------- lane markings + crosswalks ---------------- */
for (const { c, x0, x1 } of hRoads) {
  for (let x = x0; x <= x1; x++) if (x % 6 < 3 && at(x, c) === 'R') set(x, c, '_');
}
for (const { xcOf, y0, y1 } of vRoads) {
  for (let y = y0; y <= y1; y++) {
    const xc = xcOf(y);
    if (y % 4 < 2 && at(xc, y) === 'R') set(xc, y, 'D');
  }
}
/* crosswalks — small, never spanning a road's full height */
for (const [x, y] of [[6, 50], [34, 51], [62, 51], [30, 16], [66, 16]] as const) {
  for (let yy = y; yy < y + 2; yy++)
    for (let xx = x; xx < x + 2; xx++) if ('RD_'.includes(at(xx, yy))) set(xx, yy, 'X');
}

/* ---------------- THE PLAZA — Threed's circus, at the heart between the diagonals.
 * Painted AFTER the roads (overwrites whatever road/grass sat there — the plaza
 * absorbs the street the way Threed's circus does; both are equally walkable). ---- */
const PLAZA = { x: 44, y: 34, w: 14, h: 9 };
rect(PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h, 'p');
rect(PLAZA.x, PLAZA.y, 2, PLAZA.h, '=');
rect(PLAZA.x + PLAZA.w - 2, PLAZA.y, 2, PLAZA.h, '=');

/* ---------------- EL CAMPO VIEJO — the graveyard field, NW (fence-walled, a gate
 * gap, rounded ':' paths). Shifted 2 east of the north-gate road (x10-29) so the
 * fence never pinches the road. ---------------- */
const GY = { x: 10, y: 10, w: 19, h: 22 };
rect(GY.x, GY.y, GY.w, 1, '-');
rect(GY.x, GY.y, 1, GY.h, '|');
rect(GY.x + GY.w - 1, GY.y, 1, GY.h, '|');
rect(GY.x, GY.y + GY.h - 1, GY.w, 1, '-');
// the gate gap — south wall, centered
rect(GY.x + Math.floor(GY.w / 2) - 1, GY.y + GY.h - 1, 2, 1, ':');

/* ---------------- dirt paths (autotiled ':', rounded — no boxy corners) ---------------- */
const path = (pts: Array<[number, number]>, wpx = 2): void => {
  for (let i = 0; i < pts.length - 1; i++) {
    let [x, y] = pts[i];
    const [tx, ty] = pts[i + 1];
    for (;;) {
      for (let dy = 0; dy < wpx; dy++)
        for (let dx = 0; dx < wpx; dx++) if (grassLike(x + dx, y + dy)) set(x + dx, y + dy, ':');
      if (x === tx && y === ty) break;
      if (x !== tx) x += Math.sign(tx - x);
      if (y !== ty) y += Math.sign(ty - y);
    }
  }
};
/* graveyard interior — a rounded loop, diagonal steps (no boxy corners) */
path([[GY.x + 2, GY.y + 2], [GY.x + 6, GY.y + 6], [GY.x + 6, GY.y + 14], [GY.x + 10, GY.y + 18], [GY.x + Math.floor(GY.w / 2), GY.y + GY.h - 1]]);
path([[GY.x + 2, GY.y + 2], [GY.x + 14, GY.y + 2], [GY.x + 16, GY.y + 6], [GY.x + 16, GY.y + 16]]);
// The processional center aisle turns the loop into a readable cemetery plan:
// gate → memorial rows → crypt. It is also the player's clean north/south sightline.
path([[GY.x + 8, GY.y + 7], [GY.x + 8, GY.y + 19]], 2);

/* ---------------- props / npcs / objects ---------------- */
type Solid = { ox: number; oy: number; w: number; h: number };
interface Prop {
  sprite: string; x: number; y: number; solid?: Solid;
  ifFlag?: string; unlessFlag?: string; scale?: number;
}
const props: Prop[] = [];
const HGT = (u: number): number => 44 + u * 16; // cityBuildingHeight (spritegen/tiles.ts)
const FSOLID = (w: number, u: number): Solid => ({ ox: 0, oy: 10, w: w * 16 + 2, h: HGT(u) - 22 });
/** legacy city facades: coarse footprint w (tiles) + stories u — matches kit.ts BUILDING_DIMS */
const DIMS: Record<string, { w: number; u: number }> = {
  bldg_ps_mercado: { w: 5, u: 1 },
  bldg_ps_clinic: { w: 5, u: 1 },
  bldg_ps_pension: { w: 5, u: 2 },
  bldg_ps_museum: { w: 6, u: 2 },
  bldg_ps_casa: { w: 4, u: 2 },
  bldg_ps_casa_b: { w: 4, u: 1 },
  bldg_ps_deli: { w: 4, u: 1 },
  bldg_ps_cantina: { w: 5, u: 1 },
  bldg_ps_casa_c: { w: 4, u: 1 },
  bldg_ps_pension_b: { w: 5, u: 2 },
  bldg_ps_catedral: { w: 6, u: 11 },
  bldg_ps_gran_hotel: { w: 6, u: 12 },
  bldg_ps_aduana: { w: 7, u: 11 },
  bldg_gen_market_gold_1: { w: 6, u: 1 },
  bldg_gen_market_orange_2: { w: 6, u: 2 },
  bldg_gen_civic_paper_2: { w: 6, u: 2 },
};
const occupied: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
const doorsteps: Array<{ sprite: string; x: number; y: number }> = [];
/** place a legacy city facade with its base (art bottom) ON `baseRow` (a sidewalk row). */
const facade = (sprite: string, x: number, baseRow: number): Prop => {
  const { w, u } = DIMS[sprite];
  const p: Prop = { sprite, x, y: baseRow - HGT(u) / 16, solid: FSOLID(w, u) };
  props.push(p);
  occupied.push({ x0: x - 1, y0: baseRow - Math.min(9, Math.ceil(HGT(u) / 16)) - 1, x1: x + w + 1, y1: baseRow + 1 });
  doorsteps.push({ sprite, x: +(x + w / 2).toFixed(2), y: baseRow });
  return p;
};
const treeSprite = (x: number, y: number, pines = false): string => {
  const h = (x * 73 + y * 151) % 12;
  if (pines && h >= 9) return 'pine';
  if (h % 3 === 1) return 'tree_b';
  if (h % 3 === 2) return 'tree_c';
  return 'tree';
};
const SIGN_SOLID: Solid = { ox: 3, oy: 10, w: 10, h: 7 };
const BENCH: Solid = { ox: 1, oy: 6, w: 20, h: 6 };
const GIFT_SOLID: Solid = { ox: 1, oy: 7, w: 12, h: 6 };

/* ---- collision-checked placement: a facade may not land on a road/water tile,
 * nor overlap another building's footprint. `place()` tries `xWant` first, then
 * walks east/west (per `dir`) in 1-tile steps until clear — deterministic (no
 * randomness), and prints where it actually lands so the ASCII pass can be
 * eyeballed against real coordinates. ---- */
const BLOCKED = 'RD_XeEb-|';
const footprintClear = (sprite: string, x: number, baseRow: number): boolean => {
  const { w, u } = DIMS[sprite];
  const y0 = baseRow - Math.min(9, Math.ceil(HGT(u) / 16)) - 1;
  // NOTE: baseRow itself is the doorstep — checked (must be walkable, not a
  // road/water tile). baseRow+1 is deliberately EXCLUDED: that's the road/plaza
  // tile the building fronts onto (the template's own convention — TOP BAR
  // buildings sit on the c-3 walk row, one tile off the c-2 road, and the
  // coarse `occupied` tree-exclusion rect below still pads baseRow+1).
  const y1 = baseRow;
  for (let yy = y0; yy <= y1; yy++)
    for (let xx = x - 1; xx <= x + w + 1; xx++) {
      if (BLOCKED.includes(at(xx, yy))) return false;
      for (const o of occupied) if (xx >= o.x0 && xx <= o.x1 && yy >= o.y0 && yy <= o.y1) return false;
    }
  return true;
};
const place = (sprite: string, xWant: number, baseRow: number, dir: 1 | -1 = 1): Prop => {
  let x = xWant;
  // a SHORT search radius (6) on purpose: a building that has to wander far from
  // its intended spot to find clear ground is a sign the spot is wrong, not that
  // it should silently drift into some other district — surface it as a WARNING
  // and fix the hand-picked coordinate instead of letting it wander.
  for (let tries = 0; tries < 6 && !footprintClear(sprite, x, baseRow); tries++) x += dir;
  if (!footprintClear(sprite, x, baseRow)) console.log(`WARNING: ${sprite}@${baseRow} could not find a clear spot from ${xWant} (searched to ${x})`);
  return facade(sprite, x, baseRow);
};

/* ===== TOP STREET (bases on walk row 15) — mercado/clinic/pension/museum/casa/casa_b ===== */
place('bldg_ps_mercado', 32, TOP_C - 3);
place('bldg_ps_clinic', 39, TOP_C - 3);
place('bldg_ps_pension', 46, TOP_C - 3);
place('bldg_ps_museum', 53, TOP_C - 3);
place('bldg_ps_casa', 61, TOP_C - 3);
place('bldg_ps_casa_b', 67, TOP_C - 3);

/* ===== DIAGONAL A shopfronts (deli/pension_b x2/casa_c) — stepping down the
 * slant's EAST side, hand-placed against the diagonal's actual per-row walk
 * band (printed + verified) rather than a guessed inset — diagA runs its full
 * length (20-52) so it has room for 4 stepping shops; diagB got truncated (see
 * above) and only has room for 2, so both bldg_ps_pension_b copies land here
 * instead of split 1/1 (ADAPTED from the spec's suggested 1-diagA/2-diagB split —
 * noted in the report). Each is clear of diagA's band AND the plaza. ===== */
place('bldg_ps_deli', 70, 26);
place('bldg_ps_pension_b', 62, 35);
place('bldg_ps_pension_b', 59, 44);
place('bldg_ps_casa_c', 45, 51);

/* ===== DIAGONAL B shopfronts (cantina x2) — stepping down the slant's WEST
 * side, in the truncated 20-34 run (both fit cleanly; see note above). ===== */
place('bldg_ps_cantina', 76, 25);
place('bldg_ps_cantina', 71, 33);

/* ===== THE MEGAS — cathedral on the plaza's north edge (west of diagA, clear of
 * its band at every row in its 9-row cap); gran hotel + aduana x2 east of the
 * diagA-side shops, on the spine's north walk (row 51). ADAPTED from the spec's
 * 3 aduanas to 2: with diagB truncated the megas sit in open ground (no road
 * conflict), but the map's east wall only leaves ~29 clear tiles east of the
 * diagA shops — gran_hotel(6) + aduana(7) + aduana(7) + 2 gaps fits exactly;
 * a 3rd aduana would run past the east wall/gate. Noted in the report. ===== */
place('bldg_ps_catedral', 40, PLAZA.y, -1);
place('bldg_ps_gran_hotel', 67, SPINE_C - 3);
place('bldg_ps_aduana', 76, SPINE_C - 3);
place('bldg_ps_aduana', 86, SPINE_C - 3);

/* ===== fill-in generated facades (2 of the suggested 2-3) — RELOCATED off the
 * top street (its east end is already edge-to-edge with the 6 named facades +
 * the megas beyond it, zero slack) to the open SW ground below the graveyard,
 * north of the west hammerhead. Noted as a deviation in the report. ===== */
place('bldg_gen_market_gold_1', 10, 49);
place('bldg_gen_civic_paper_2', 19, 49);

/* ===== AUTHORED MICRO-DISTRICTS — the road grammar now opens into places,
 * not anonymous grass. These paths are painted only onto grass-like cells, so
 * the fixed roads, cemetery fence, building sequence, and doorstep contracts
 * remain byte-stable. ===== */
// Moonwake Garden: Campo Viejo's south gate spills into a public memorial grove.
path([[18, 31], [18, 34], [20, 36], [24, 39], [26, 39]], 2);
// Candleworks Court: a crooked residential workyard off the top street.
path([[37, 20], [36, 23], [35, 27], [35, 31]], 2);
// Midnight Radio Lot: an eccentric high silhouette visible across the top road.
rect(80, 6, 12, 8, 'q');
for (const [x, y] of [[80, 6], [91, 6], [80, 13], [91, 13], [80, 7], [91, 12]] as const) set(x, y, '.');
set(83, 8, 'z');
set(88, 12, 'z');
path([[88, 15], [88, 12], [85, 10]], 2);

/* ---- final collision report: every occupied rect vs every road/water tile,
 * and every pair of occupied rects vs each other (printed, not silent) ---- */
for (const o of occupied) {
  // o.y1 is the doorstep's padded row (baseRow+1, the road/plaza the building
  // fronts onto by design — see footprintClear's note); only the body+doorstep
  // rows above it must be clear.
  for (let yy = o.y0; yy < o.y1; yy++)
    for (let xx = o.x0; xx <= o.x1; xx++)
      if (BLOCKED.includes(at(xx, yy))) console.log(`COLLISION: building footprint (${o.x0},${o.y0})-(${o.x1},${o.y1}) sits on '${at(xx, yy)}' at (${xx},${yy})`);
}
for (let i = 0; i < occupied.length; i++)
  for (let j = i + 1; j < occupied.length; j++) {
    const a = occupied[i], b = occupied[j];
    if (a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1)
      console.log(`COLLISION: building ${i} (${a.x0},${a.y0})-(${a.x1},${a.y1}) overlaps building ${j} (${b.x0},${b.y0})-(${b.x1},${b.y1})`);
  }

/* ---------------- EL CAMPO VIEJO — authored memorial kit ----------------
 * The old edge-rock scatter read as a quarry. These fixed rows use the original
 * Puerto cemetery drawings and deliberately leave the loop + center aisle clear. */
const STONE: Solid = { ox: 8, oy: 20, w: 16, h: 8 };
const HEADSTONE_SUN: Solid = { ox: 5, oy: 30, w: 24, h: 8 };
const HEADSTONE_ANCHOR: Solid = { ox: 5, oy: 33, w: 23, h: 8 };
const OBELISK: Solid = { ox: 4, oy: 34, w: 17, h: 8 };
const CRYPT: Solid = { ox: 6, oy: 39, w: 36, h: 12 };
const LAMP: Solid = { ox: 5, oy: 36, w: 10, h: 8 };
const memorials: Array<[string, number, number, Solid]> = [
  ['puerto_headstone_sun', 12, 16, HEADSTONE_SUN],
  ['puerto_headstone_anchor', 14, 19, HEADSTONE_ANCHOR],
  ['puerto_headstone_sun', 13, 23, HEADSTONE_SUN],
  ['puerto_headstone_anchor', 15, 25, HEADSTONE_ANCHOR],
  ['puerto_obelisk', 14, 27, OBELISK],
  ['puerto_headstone_anchor', 22, 14, HEADSTONE_ANCHOR],
  ['puerto_headstone_sun', 25, 15, HEADSTONE_SUN],
  ['puerto_headstone_sun', 22, 19, HEADSTONE_SUN],
  ['puerto_headstone_anchor', 25, 20, HEADSTONE_ANCHOR],
  ['puerto_obelisk', 22, 23, OBELISK],
  ['puerto_headstone_sun', 25, 27, HEADSTONE_SUN],
];
for (const [sprite, x, y, solid] of memorials) {
  if (!grassLike(x, y)) console.log(`CEMETERY WARN: ${sprite}@(${x},${y}) is on '${at(x, y)}'`);
  props.push({ sprite, x, y, solid });
}
props.push({ sprite: 'puerto_crypt', x: 17, y: 13.8, solid: CRYPT });
// The gate has no full-width solid: the fence grid owns its two posts and the
// two-tile opening must remain genuinely walkable.
props.push({ sprite: 'puerto_cemetery_gate', x: 16.4, y: 28.35 });
props.push({ sprite: 'puerto_cemetery_lamp', x: 10.8, y: 27.5, solid: LAMP });
props.push({ sprite: 'puerto_cemetery_lamp', x: 26.5, y: 27.5, solid: LAMP });
/* a few pines in the graveyard (quiet, no spawner inside) */
for (const [px, py] of [[GY.x + 2, GY.y + 1], [GY.x + GY.w - 2, GY.y + 1], [GY.x + 2, GY.y + GY.h - 3]] as const) {
  props.push({ sprite: 'pine', x: px, y: py, solid: { ox: 7, oy: 22, w: 12, h: 10 } });
}

/* ---------------- THREE NEIGHBORHOOD MICRO-SCENES ---------------- */
// MOONWAKE GARDEN — a civic memorial grove outside the cemetery fence.
props.push({ sprite: 'gazebo', x: 15.8, y: 33.6, solid: { ox: 4, oy: 42, w: 31, h: 10 } });
props.push({ sprite: 'bench', x: 14, y: 40.2, solid: BENCH });
props.push({ sprite: 'bench', x: 22.5, y: 40.2, solid: BENCH });
props.push({ sprite: 'puerto_cemetery_lamp', x: 13, y: 35.4, solid: LAMP });
props.push({ sprite: 'puerto_cemetery_lamp', x: 25.5, y: 36.4, solid: LAMP });
props.push({ sprite: 'costa_flower_urns', x: 20.7, y: 36.1, solid: { ox: 5, oy: 27, w: 35, h: 8 } });

// CANDLEWORKS COURT — paper flowers, wash, and a well packed into one crooked lot.
props.push({ sprite: 'clothesline', x: 30.5, y: 23.5, solid: { ox: 3, oy: 24, w: 40, h: 7 } });
props.push({ sprite: 'puerto_candle_cart', x: 32.3, y: 25.2, solid: { ox: 5, oy: 35, w: 46, h: 9 } });
props.push({ sprite: 'well', x: 36, y: 28.2, solid: { ox: 4, oy: 20, w: 16, h: 10 } });
props.push({ sprite: 'crate', x: 31, y: 29, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'puerto_cemetery_lamp', x: 38, y: 28, solid: LAMP });

// MIDNIGHT RADIO LOT — a wonderfully unnecessary municipal receiver station.
props.push({ sprite: 'puerto_radio_mast', x: 82, y: 5.4, solid: { ox: 5, oy: 50, w: 45, h: 11 } });
props.push({ sprite: 'puerto_luggage_cart', x: 88, y: 11.1, solid: { ox: 3, oy: 25, w: 37, h: 8 } });
props.push({ sprite: 'crate', x: 90.7, y: 12.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'trash_can', x: 84, y: 12.8, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
props.push({ sprite: 'fb_barrel', x: 89.2, y: 7.2, solid: { ox: 2, oy: 18, w: 14, h: 7 } });
props.push({ sprite: 'puerto_cemetery_lamp', x: 80.4, y: 11, solid: LAMP });
props.push({ sprite: 'puerto_cemetery_lamp', x: 91, y: 10, solid: LAMP });

/* ---------------- THE PLAZA dressing — fountain re-centered, market_stall_c + sign ---------------- */
props.push({ sprite: 'fountain', x: PLAZA.x + 3, y: PLAZA.y + 2.4, solid: { ox: 3, oy: 22, w: 34, h: 14 } });
props.push({ sprite: 'puerto_candle_cart', x: PLAZA.x + 0.5, y: PLAZA.y + 4, solid: { ox: 5, oy: 35, w: 46, h: 9 } });
props.push({ sprite: 'bench', x: PLAZA.x + 9, y: PLAZA.y + 6.4, solid: BENCH });
props.push({ sprite: 'market_stall_c', x: PLAZA.x + PLAZA.w - 3, y: PLAZA.y + PLAZA.h - 5, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'sign', x: PLAZA.x + 6, y: PLAZA.y + PLAZA.h + 0.4, solid: SIGN_SOLID }); // sign_plaza
props.push({ sprite: 'festival_lantern_span', x: PLAZA.x + 0.5, y: PLAZA.y - 3.2 });
props.push({ sprite: 'festival_lantern_span', x: PLAZA.x + 7, y: PLAZA.y - 3.2 });
props.push({ sprite: 'gazebo', x: PLAZA.x + 8.2, y: PLAZA.y - 0.4, solid: { ox: 4, oy: 42, w: 31, h: 10 } });

/* ---------------- THE BOAT cluster on the quay, west-center ---------------- */
props.push({ sprite: 'banana_boat', x: 20, y: 55.7, solid: { ox: 4, oy: 22, w: 120, h: 20 } });
props.push({ sprite: 'gangplank', x: 25, y: 59.6 });
props.push({ sprite: 'departure_board', x: 29, y: 55.4, solid: { ox: 2, oy: 20, w: 22, h: 8 } });
props.push({ sprite: 'crate_bananas', x: 4, y: 61.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'crate', x: 6.4, y: 62.1, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'crate_bananas', x: 32, y: 62.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'crate', x: 40, y: 62.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'market_stall_a', x: 56, y: 61, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'market_stall_b', x: 62, y: 61, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'picnic', x: 44, y: 60.2, solid: { ox: 2, oy: 8, w: 32, h: 14 } }); // picnic #1 (quay)
props.push({ sprite: 'picnic', x: 96, y: 60.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } }); // picnic #2 (quay east)
props.push({ sprite: 'payphone', x: 28, y: 57, solid: { ox: 1, oy: 10, w: 14, h: 16 } });
props.push({ sprite: 'payphone', x: 92, y: 59, solid: { ox: 1, oy: 10, w: 14, h: 16 } });
props.push({ sprite: 'departure_board', x: 82, y: 59, solid: { ox: 2, oy: 20, w: 22, h: 8 } }); // 2nd board, east
// The quay is a chain of working scenes now: bell → ferry office → mooring
// lane → cargo crane → fish auction → passenger luggage. Functional trigger,
// phone, picnic, and gift cells stay untouched between them.
props.push({ sprite: 'puerto_harbor_bell', x: 13, y: 56.4, solid: { ox: 7, oy: 37, w: 37, h: 10 } });
props.push({ sprite: 'puerto_ticket_kiosk', x: 34, y: 56.2, solid: { ox: 4, oy: 44, w: 40, h: 10 } });
props.push({ sprite: 'puerto_mooring_bollards', x: 18, y: 63, solid: { ox: 3, oy: 10, w: 26, h: 7 } });
props.push({ sprite: 'puerto_mooring_bollards', x: 35, y: 63, solid: { ox: 3, oy: 10, w: 26, h: 7 } });
props.push({ sprite: 'puerto_cargo_crane', x: 69, y: 55.9, solid: { ox: 5, oy: 50, w: 48, h: 12 } });
props.push({ sprite: 'puerto_fish_stall', x: 75, y: 59.9, solid: { ox: 2, oy: 30, w: 40, h: 11 } });
props.push({ sprite: 'fb_rope_coil', x: 79.2, y: 62.6 });
props.push({ sprite: 'fb_crab_pot', x: 80.8, y: 61.5, solid: { ox: 2, oy: 19, w: 14, h: 7 } });
props.push({ sprite: 'puerto_luggage_cart', x: 84.8, y: 60.2, solid: { ox: 3, oy: 25, w: 37, h: 8 } });

/* ---------------- THE LANTERN PROCESSION — fixed night wayfinding ----------------
 * Four repeated amber posts stitch Campo Viejo → plaza → quay. They are static
 * authored landmarks, not random screen-space glow, so the route reads in play. */
for (const [lx, ly] of [[8, 57], [42, 57], [72, 57], [88, 57]] as const) {
  props.push({ sprite: 'puerto_cemetery_lamp', x: lx, y: ly, solid: LAMP });
}

/* EB street punctuation: tall silhouettes at the major turns, small signs at
 * the two gate approaches. Every base sits off the live carriageway. */
const TRAFFIC_LIGHT: Solid = { ox: 4, oy: 38, w: 6, h: 8 };
const STOP_SIGN: Solid = { ox: 4, oy: 21, w: 5, h: 6 };
props.push({ sprite: 'traffic_light', x: 11, y: 49, solid: TRAFFIC_LIGHT });
props.push({ sprite: 'traffic_light', x: 31, y: 49, solid: TRAFFIC_LIGHT });
props.push({ sprite: 'traffic_light', x: 63, y: 15, solid: TRAFFIC_LIGHT });
props.push({ sprite: 'stop_sign', x: 4, y: 50, solid: STOP_SIGN });
props.push({ sprite: 'stop_sign', x: 94, y: 56, solid: STOP_SIGN });

/* ---------------- gift caches (flag pairs, EXACT flags from maps_ch2.ts) ---------------- */
props.push({ sprite: 'gift_box', x: 22, y: 61, solid: GIFT_SOLID, unlessFlag: 'ps_dock_gift' });
props.push({ sprite: 'gift_box_open', x: 22, y: 61, solid: GIFT_SOLID, ifFlag: 'ps_dock_gift' });
props.push({ sprite: 'gift_box', x: 59, y: 62.6, solid: GIFT_SOLID, unlessFlag: 'mercado_stall' });
props.push({ sprite: 'gift_box_open', x: 59, y: 62.6, solid: GIFT_SOLID, ifFlag: 'mercado_stall' });
props.push({ sprite: 'gift_box', x: 90, y: 61.6, solid: GIFT_SOLID, unlessFlag: 'gift_doubloon' });
props.push({ sprite: 'gift_box_open', x: 90, y: 61.6, solid: GIFT_SOLID, ifFlag: 'gift_doubloon' });

/* ---------------- east gate arch dressing — edge_rock flanking the mouth ---------------- */
props.push({ sprite: 'edge_rock_a', x: 96, y: SPINE_C - 4.5, solid: STONE });
props.push({ sprite: 'edge_rock_b', x: 96, y: SPINE_C + 3.5, solid: STONE });

/* ---------------- signposts (each backed by a SignDef below) ---------------- */
const signPosts: Array<[number, number]> = [
  [6, 1], // sign_costa_road, at the north gate
  [30, 60.4], // sign_departures_home, the quay
  [52, 60.4], // sign_ps_malecon, the quay mid
  [56, 60.4], // sign_ps_market, the quay stalls
  [12, 29.4], // sign_ps_campo_viejo, inside the cemetery gate
  [25, 39.4], // sign_ps_moonwake, the memorial garden
  [35, 30.4], // sign_ps_candleworks, the courtyard well
  [85, 12.4], // sign_ps_radio, beneath the receiver mast
  [13, 60.4], // sign_ps_harbor_bell, west quay
  [76, 63.4], // sign_ps_fish_auction, east quay
  [97, 52.4], // sign_jungle_gate, the east gate mouth (on the road, clear of aduana2 + the bowl edge)
  [95, 54.4], // sign_ps_jungle_east, the east gate mouth
];
for (const [sx, sy] of signPosts) props.push({ sprite: 'sign', x: sx, y: sy, solid: SIGN_SOLID });

/* ---------------- palms on the quay, pines in the bowl ---------------- */
for (const [px, py] of [[12, 59], [48, 58.8], [70, 59], [86, 58.8], [98, 59]] as const) {
  props.push({ sprite: treeSprite(px, py), x: px, y: py, solid: { ox: 7, oy: 22, w: 12, h: 10 } });
}

/* ---------------- street trees (decorative; skip occupied footprints) ---------------- */
const inOccupied = (x: number, y: number): boolean =>
  occupied.some((o) => x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1);
const sceneReserved = [
  { x: 12, y: 33, w: 15, h: 10 }, // Moonwake Garden
  { x: 30, y: 22, w: 10, h: 10 }, // Candleworks Court
  { x: 80, y: 5, w: 13, h: 10 },  // Midnight Radio Lot
];
const inScene = (x: number, y: number): boolean =>
  sceneReserved.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
for (let y = 6; y < 58; y++)
  for (let x = 5; x < W - 5; x++) {
    if (at(x, y) !== '.') continue;
    if (inOccupied(x, y)) continue;
    if (inScene(x, y)) continue;
    if (x >= GY.x - 1 && x <= GY.x + GY.w && y >= GY.y - 1 && y <= GY.y + GY.h) continue; // graveyard stays quiet
    let nearWalk = false;
    for (let dy = -2; dy <= 2 && !nearWalk; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if ('=RD_:X'.includes(at(x + dx, y + dy))) { nearWalk = true; break; }
    const h = hash2(x, y);
    const pines = y < 12 || x < 8 || x > W - 8;
    if (nearWalk ? h % 9 === 0 : h % 23 === 0) {
      props.push({ sprite: treeSprite(x, y, pines), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } });
    }
  }

/* ---------------- street wear (deterministic, sparse) ---------------- */
for (let y = 1; y < H - 1; y++)
  for (let x = 1; x < W - 1; x++) {
    const h = hash2(x + 7, y + 3);
    const c = at(x, y);
    if (c === 'R' && h % 53 === 0) {
      let pv = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (paved(x + dx, y + dy)) pv++;
      if (pv >= 3) set(x, y, '2');
    } else if (c === '=' && h % 61 === 0) set(x, y, '1');
  }

// Four walk-over covers mark the high-value junctions. Guard the swap so a
// future road edit cannot silently strand a manhole on grass or water.
for (const [mx, my] of [[7, 54], [34, 53], [66, 18], [94, 18]] as const) {
  if ('RD_X2_'.includes(at(mx, my))) set(mx, my, '4');
  else console.log(`MANHOLE WARN: (${mx},${my}) is '${at(mx, my)}', left unchanged`);
}

/* ---------------- water foam — LAST, so the quay/gate cuts get a clean rim ---------------- */
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (at(x, y) !== 'e') continue;
    const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(
      (c) => c !== 'e' && c !== 'E',
    );
    if (edge) set(x, y, 'E');
  }

/* ---------------- npcs (every fixed point re-homed; ids/dialogue unchanged) ---------------- */
const npcs: MapDef['npcs'] = [
  { id: 'ps_fisher', sprite: 'dockworker', x: 10, y: 58, facing: 'down', dialogue: 'npc_ps_fisher', wander: true, emote: 'think' },
  { id: 'ps_crane', sprite: 'dockworker', x: 46, y: 58, facing: 'down', dialogue: 'npc_ps_crane', wander: true },
  { id: 'ps_tally', sprite: 'captain', x: 76, y: 58, facing: 'down', dialogue: 'npc_ps_tally' },
  { id: 'ps_board', sprite: 'tomas', x: 82, y: 57, facing: 'down', dialogue: 'npc_ps_board' },
  { id: 'ps_porter', sprite: 'captain', x: 65, y: 50, facing: 'down', dialogue: 'npc_ps_porter' }, // the hotel front
  { id: 'ps_nina', sprite: 'wokeB', x: 50, y: 37, facing: 'down', dialogue: 'npc_ps_nina', wander: true }, // the plaza, by the fountain
  { id: 'ps_plaza_musician', sprite: 'pigeonKid', x: 53, y: 37, facing: 'down', dialogue: 'npc_ps_plaza_musician', idle: true, emote: 'happy' },
  { id: 'ps_stallman', sprite: 'tomas', x: 63, y: 62, facing: 'down', dialogue: 'npc_ps_stall', unlessFlag: 'q_llama', idle: true, emote: 'happy' }, // quay market stall
  { id: 'ps_market', sprite: 'mercadoKeeper', x: 55, y: 39, facing: 'down', dialogue: 'npc_ps_market', wander: true }, // plaza market corner
  { id: 'ps_gravedigger', sprite: 'quarterMan', x: 23, y: 29, facing: 'left', dialogue: 'npc_ps_gravedigger', idle: true, emote: 'think' },
  { id: 'ps_mourner', sprite: 'senora', x: 18, y: 39, facing: 'up', dialogue: 'npc_ps_mourner', idle: true },
  { id: 'ps_candle_vendor', sprite: 'mercadoKeeper', x: 34, y: 27, facing: 'down', dialogue: 'npc_ps_candle_vendor', idle: true, emote: 'happy' },
  { id: 'ps_radio_watcher', sprite: 'oldTimer', x: 85, y: 12, facing: 'up', dialogue: 'npc_ps_radio_watcher', idle: true, emote: 'think' },
  { id: 'ps_fishmonger', sprite: 'tomas', x: 78, y: 62, facing: 'down', dialogue: 'npc_ps_fishmonger', wander: true },
];

/* ---------------- signs (script ids unchanged) ---------------- */
const signs = [
  { x: 6, y: 1, dialogue: 'sign_costa_road' },
  { x: 30, y: 60, dialogue: 'sign_departures_home' },
  { x: 52, y: 60, dialogue: 'sign_ps_malecon' },
  { x: 56, y: 60, dialogue: 'sign_ps_market' },
  { x: 12, y: 29, dialogue: 'sign_ps_campo_viejo' },
  { x: 25, y: 39, dialogue: 'sign_ps_moonwake' },
  { x: 35, y: 30, dialogue: 'sign_ps_candleworks' },
  { x: 85, y: 12, dialogue: 'sign_ps_radio' },
  { x: 13, y: 60, dialogue: 'sign_ps_harbor_bell' },
  { x: 76, y: 63, dialogue: 'sign_ps_fish_auction' },
  { x: 97, y: 52, dialogue: 'sign_jungle_gate' },
  { x: 95, y: 54, dialogue: 'sign_ps_jungle_east' },
  { x: PLAZA.x + 6, y: PLAZA.y + PLAZA.h, dialogue: 'sign_plaza' },
  { x: 22, y: 62, dialogue: 'ps_dock_gift', unlessFlag: 'ps_dock_gift' },
  { x: 22, y: 62, dialogue: 'ps_dock_gift_done', ifFlag: 'ps_dock_gift' },
  { x: 59, y: 63.6, dialogue: 'mercado_stall', unlessFlag: 'mercado_stall' },
  { x: 59, y: 63.6, dialogue: 'mercado_stall_done', ifFlag: 'mercado_stall' },
  { x: 90, y: 62.6, dialogue: 'gift_doubloon', unlessFlag: 'gift_doubloon' },
  { x: 90, y: 62.6, dialogue: 'gift_doubloon_done', ifFlag: 'gift_doubloon' },
];

/* ---------------- doors / phones / atms / triggers / spawners / reflect ---------------- */
const doors: MapDef['doors'] = [
  // north gate — COSTA ESTRELLA (NOT being rebuilt right now — KEEP the exact tx/ty)
  { x: 6, y: 0, w: 3, h: 1, to: 'costa_estrella', tx: 216, ty: 232, facing: 'up' },
  // east gate — jungle_1 IS being rebuilt right now: placeholder tx/ty, flagged in the report
  { x: 99, y: SPINE_C - 2, w: 1, h: 4, to: 'jungle_1', tx: 24, ty: 264, facing: 'right' },
];
const phones = [
  { x: 28, y: 57 },
  { x: 92, y: 59 },
];
const atms: Array<{ x: number; y: number }> = [];
const triggers = [
  { id: 'board_boat_return', rect: { x: 25, y: 60, w: 2, h: 2 }, once: false },
  { id: 'puerto_arrival', rect: { x: 23, y: 58, w: 6, h: 2 }, once: true },
  { id: 'puerto_malecon', rect: { x: 50, y: 61, w: 3, h: 4 }, once: true },
];
const spawners = [
  // the open field between the graveyard and the diagA shopfronts, clear of
  // every door/phone/atm/trigger/sign by ≥1.5 tiles
  { enemies: ['pickpocket_parrot', 'brass_market_mimic'], count: 1, rect: { x: 31, y: 38, w: 10, h: 6 } },
];
const reflect = [{ x: 0, y: 66, w: 100, h: 5, within: 6 }];

/* ---------------- fixture-walkability report (npcs/signs/phones vs blocked
 * tiles + building footprints; spawners vs a 1.5-tile clearance from every
 * door/phone/atm/trigger/sign) — printed, not silent ---- */
const FIX_BLOCKED = 'beE-|';
for (const n of npcs as Array<{ id: string; x: number; y: number }>) {
  if (FIX_BLOCKED.includes(at(Math.round(n.x), Math.round(n.y)))) console.log(`FIXTURE WARN: npc ${n.id} at (${n.x},${n.y}) sits on '${at(Math.round(n.x), Math.round(n.y))}'`);
  if (inOccupied(Math.round(n.x), Math.round(n.y))) console.log(`FIXTURE WARN: npc ${n.id} at (${n.x},${n.y}) sits inside a building footprint`);
}
for (const s of signs as Array<{ dialogue: string; x: number; y: number }>) {
  if (FIX_BLOCKED.includes(at(Math.round(s.x), Math.round(s.y)))) console.log(`FIXTURE WARN: sign ${s.dialogue} at (${s.x},${s.y}) sits on '${at(Math.round(s.x), Math.round(s.y))}'`);
  if (inOccupied(Math.round(s.x), Math.round(s.y))) console.log(`FIXTURE WARN: sign ${s.dialogue} at (${s.x},${s.y}) sits inside a building footprint`);
}
for (const p of [...phones, ...atms]) {
  if (inOccupied(Math.round(p.x), Math.round(p.y))) console.log(`FIXTURE WARN: phone/atm at (${p.x},${p.y}) sits inside a building footprint`);
}
const clearance = (rect: { x: number; y: number; w: number; h: number }, px: number, py: number): boolean =>
  px < rect.x - 1.5 || px > rect.x + rect.w + 1.5 || py < rect.y - 1.5 || py > rect.y + rect.h + 1.5;
for (const sp of spawners) {
  for (const d of doors) if (!clearance(sp.rect, d.x, d.y)) console.log(`FIXTURE WARN: spawner ${JSON.stringify(sp.rect)} within 1.5 tiles of door to ${d.to}`);
  for (const p of [...phones, ...atms]) if (!clearance(sp.rect, p.x, p.y)) console.log(`FIXTURE WARN: spawner ${JSON.stringify(sp.rect)} within 1.5 tiles of a phone/atm`);
  for (const t of triggers) if (!clearance(sp.rect, t.rect.x, t.rect.y)) console.log(`FIXTURE WARN: spawner ${JSON.stringify(sp.rect)} within 1.5 tiles of trigger ${t.id}`);
  for (const [sx, sy] of signPosts) if (!clearance(sp.rect, sx, sy)) console.log(`FIXTURE WARN: spawner ${JSON.stringify(sp.rect)} within 1.5 tiles of a sign`);
}

/* ---------------- emit the editor document ---------------- */
const runtimeMap: MapDef = {
  id: 'puerto_sol',
  name: 'PUERTO SOL',
  music: 'puerto',
  night: true,
  ambience: 'waves',
  settlement: 'city',
  grid: g.map((r) => r.join('')),
  props,
  npcs,
  signs,
  phones,
  atms,
  doors,
  spawners,
  triggers,
  patrols: [],
  reflect,
};
const editorDocument = { ...runtimeMap, w: W, h: H };
writeFileSync('tools/mapeditor/puerto_sol.json', JSON.stringify(editorDocument));

const source = `/**
 * PUERTO SOL — editor-authored third-town map using EarthBound Threed grammar.
 *
 * Generated from tools/mapeditor/author-puerto-threed.ts into the visual editor
 * document tools/mapeditor/puerto_sol.json. Fold durable structural edits back
 * into that authoring source so runtime and editor artifacts remain aligned.
 * Dynamic named-interior and reciprocal landing wiring stays in maps_ch2.ts.
 */
import type { MapDef } from '../schemas';

export const puertoSolMap: MapDef = ${JSON.stringify(runtimeMap, null, 2)};
`;
writeFileSync('src/data/maps_puerto_sol.ts', source);
console.log(`puerto_sol.json written: ${W}x${H}, ${props.length} props, ${npcs.length} npcs, ${signs.length} signs`);
console.log('doorsteps:', JSON.stringify(doorsteps));

for (let y = 0; y < H; y += 1) console.log(String(y).padStart(3) + ' ' + g[y].join(''));
