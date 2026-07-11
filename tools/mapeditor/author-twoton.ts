/**
 * Reproducible authoring source for the Map Editor's Twoton document.
 *
 * The visual editor remains the place for hand-tuning and QA; this script owns the
 * large structural pass so the JSON document and its runtime TypeScript export can
 * never drift apart. Run with:
 *
 *   npx vite-node tools/mapeditor/author-twoton.ts
 *
 * Design grammar: a compact EarthBound-like town framed by continuous woods, a
 * north-to-south arrival boulevard, a canal-ringed open market, two legible civic
 * blocks, a working bus/hotel/theater cluster, and the east bridge to the docks.
 * The internal id remains `brickton` for save and story compatibility.
 */
import { writeFileSync } from 'node:fs';
import { facadeDims, facadeSolid } from '../../src/levelkit/kit';
import type { MapDef, NpcDef, PropDef, SignDef } from '../../src/schemas';

const W = 104;
const H = 84;

const hash2 = (x: number, y: number): number => {
  let h = Math.imul(x + 0x51, 0x9e3779b1) ^ Math.imul(y + 0x95, 0x85ebca6b);
  h = (Math.imul(h ^ (h >>> 13), 0xc2b2ae35) ^ (h >>> 16)) >>> 0;
  return h;
};

const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));
const road: boolean[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => false));
const inBounds = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
const at = (x: number, y: number): string => (inBounds(x, y) ? g[y][x] : '#');
const set = (x: number, y: number, ch: string): void => {
  if (inBounds(x, y)) g[y][x] = ch;
};
const rect = (x: number, y: number, w: number, h: number, ch: string): void => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, ch);
};
const markRoad = (x: number, y: number): void => {
  if (inBounds(x, y)) road[y][x] = true;
};
const markRoadRect = (x: number, y: number, w: number, h: number): void => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) markRoad(xx, yy);
};

// Quiet, deterministic lawn texture. Structural tiles are painted after this, so
// roads/sidewalks/water never acquire random tile-family changes.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const h = hash2(x, y);
    if (h % 31 === 0) set(x, y, ',');
    else if (h % 47 === 0) set(x, y, '~');
    else if (h % 79 === 0) set(x, y, (h & 1) === 0 ? 'f' : 'F');
  }
}

// A thick, irregular forest frame. These are real solid canopy tiles, not a thin
// decorative fence; roads only punch through at the intended north and east gates.
for (let y = 0; y < H; y++) {
  const left = 5 + (hash2(3, y >> 1) % 3);
  const right = 3 + (hash2(5, y >> 1) % 2);
  for (let x = 0; x < left; x++) set(x, y, 'b');
  for (let x = W - right; x < W; x++) set(x, y, 'b');
}
for (let x = 0; x < W; x++) {
  const top = 5 + (hash2(x >> 1, 7) % 3);
  const bottom = 6 + (hash2(x >> 1, 11) % 3);
  for (let y = 0; y < top; y++) set(x, y, 'b');
  for (let y = H - bottom; y < H; y++) set(x, y, 'b');
}
// Wooded masses divide sightlines like EarthBound's treelines: the player sees
// districts as composed rooms rather than one giant lawn.
for (let y = 8; y < 54; y++) {
  const edge = 9 + (hash2(13, y) % 3);
  for (let x = 5; x <= edge; x++) set(x, y, 'b');
}
for (let y = 20; y < 48; y++) {
  const west = 87 + (hash2(17, y) % 3);
  for (let x = west; x <= 92; x++) set(x, y, 'b');
}
// A central wedge closes the oversized sightline between the market and the
// diagonal. The boulevard cuts its east edge later, producing a natural forest
// wall instead of another empty triangular lawn.
for (let y = 33; y < 47; y++) {
  const east = Math.max(53, 64 - Math.floor((y - 33) * 0.45));
  for (let x = 51; x <= east; x++) set(x, y, 'b');
}
for (let y = 62; y < 78; y++) {
  const east = 41 + (hash2(19, y) % 4);
  for (let x = 5; x <= east; x++) if (at(x, y) !== 'e') set(x, y, 'b');
}

// East river and the small south pond. The main street becomes the only river
// bridge, making the docks direction readable at a glance.
const riverWest = (y: number): number => 94 + ((hash2(23, y >> 2) % 3) - 1);
for (let y = 19; y < H - 2; y++) {
  const wx = riverWest(y);
  for (let x = wx; x <= 99; x++) set(x, y, 'e');
}
for (let y = 62; y <= 75; y++) {
  for (let x = 14; x <= 38; x++) {
    const nx = (x - 26) / 11.5;
    const ny = (y - 68.5) / 5.7;
    if (nx * nx + ny * ny < 1 + (((hash2(x, y) % 9) - 4) / 32)) set(x, y, 'e');
  }
}

// Canal ring around the market. Two deliberate footbridges connect it to the
// boulevard and Main Street; everything else remains a visible boundary.
rect(15, 25, 30, 3, 'e');
rect(15, 45, 30, 3, 'e');
rect(15, 25, 3, 23, 'e');
rect(42, 25, 3, 23, 'e');

// Road network. A northern arrival feeds a diagonal arterial, while two separated
// cross streets and the east avenue create a compact Twoson-like town skeleton.
markRoadRect(72, 0, 5, 15);          // north gate from the Long Walk
markRoadRect(10, 14, 78, 4);        // Civic Street
for (let y = 17; y <= 55; y++) {     // the diagonal town boulevard
  const cx = 74 - Math.floor((y - 17) * 0.56);
  for (let x = cx - 2; x <= cx + 2; x++) markRoad(x, y);
}
markRoadRect(84, 14, 4, 45);        // River Avenue
markRoadRect(8, 55, W - 8, 4);      // Main Street and east bridge
markRoadRect(70, 58, 4, 16);        // Cage Lane
markRoadRect(50, 70, 41, 4);        // Maple Row

// Roads overwrite every earlier terrain family, including the intended bridge and
// the two gates. Sidewalks are derived from the finished road mask, so they can
// never pass through a carriageway or switch tile families at random.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (road[y][x]) set(x, y, 'R');
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (road[y][x] || at(x, y) === 'e') continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) {
      for (let dx = -1; dx <= 1; dx++) if (road[y + dy]?.[x + dx]) { near = true; break; }
    }
    if (near && (at(x, y) !== 'b' || (x >= 68 && x <= 80))) set(x, y, '=');
  }
}

// Lane marks are restrained and consistent. Crosswalks occupy road cells only.
for (let x = 12; x < 86; x++) if (x % 7 < 3 && at(x, 16) === 'R') set(x, 16, '_');
for (let x = 10; x < W; x++) if (x % 7 < 3 && at(x, 57) === 'R') set(x, 57, '_');
for (let x = 51; x < 89; x++) if (x % 7 < 3 && at(x, 72) === 'R') set(x, 72, '_');
for (let y = 1; y < 14; y++) if (y % 4 < 2) set(74, y, 'D');
for (let y = 18; y < 55; y++) {
  const cx = 74 - Math.floor((y - 17) * 0.56);
  if (y % 4 < 2 && at(cx, y) === 'R') set(cx, y, 'D');
}
for (let y = 19; y < 54; y++) if (y % 4 < 2 && at(85, y) === 'R') set(85, y, 'D');
for (let y = 60; y < 70; y++) if (y % 4 < 2 && at(71, y) === 'R') set(71, y, 'D');
const crosswalk = (cx: number, cy: number): void => {
  for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
    if (road[y]?.[x] && ((x + y) & 1) === 0) set(x, y, 'X');
  }
};
crosswalk(74, 16);
crosswalk(85, 16);
crosswalk(52, 56);
crosswalk(71, 56);
crosswalk(85, 56);
crosswalk(71, 71);

// EB POLISH (2026-07-11) — the downtown promenade: every storefront row gets a
// TWO-tile walk (the shop foot row is already the derived sidewalk; this adds
// the second row along each drag). Grass-guarded so carriageways, canals, the
// park paths, and the Cage fence are untouched; the dirt paths painted later
// deliberately cut across it like EarthBound's park crossings.
const grassLike = (x: number, y: number): boolean => ' .,~fF'.includes(at(x, y));
for (let x = 11; x <= 71; x++) if (grassLike(x, 12)) set(x, 12, '='); // Civic Street
for (let x = 8; x <= 49; x++) if (grassLike(x, 53)) set(x, 53, '='); // Main Street, west block
for (let x = 57; x <= 83; x++) if (grassLike(x, 53)) set(x, 53, '='); // Main Street, east block
for (let x = 50; x <= 82; x++) if (grassLike(x, 68)) set(x, 68, '='); // Maple Row

// EB intersection kit — manhole covers ('4') mid-lane just off the junctions,
// guarded to plain 'R' so dashes/crosswalks/junction topology never change.
for (const [mx, my] of [
  [69, 15], [81, 15], // Civic Street, flanking the boulevard + River Ave crossings
  [76, 8], // the arrival boulevard
  [48, 56], [64, 56], [78, 56], // Main Street, between its three crossings (64 not 60 — a clunker parks at 60)
  [77, 71], // Maple Row
] as const) {
  if (at(mx, my) === 'R') set(mx, my, '4');
}

const groundLike = (x: number, y: number): boolean => ' .,~fF='.includes(at(x, y));
const path = (points: ReadonlyArray<readonly [number, number]>, width = 2, carveForest = false): void => {
  for (let i = 0; i < points.length - 1; i++) {
    let [x, y] = points[i];
    const [tx, ty] = points[i + 1];
    for (;;) {
      for (let yy = 0; yy < width; yy++) for (let xx = 0; xx < width; xx++) {
        if (groundLike(x + xx, y + yy) || (carveForest && at(x + xx, y + yy) === 'b')) set(x + xx, y + yy, ':');
      }
      if (x === tx && y === ty) break;
      if (x !== tx) x += Math.sign(tx - x);
      if (y !== ty) y += Math.sign(ty - y);
    }
  }
};

// Market bridges and its rounded footpath loop.
rect(42, 35, 7, 3, ':');
rect(42, 43, 3, 6, ':');
path([[48, 36], [54, 31], [62, 27], [67, 25]], 2, true);
path([[43, 47], [46, 51], [47, 54]]);
path([[20, 31], [20, 40], [24, 43], [37, 43], [40, 40], [40, 31], [36, 29], [23, 29], [20, 31]]);
path([[30, 29], [30, 42]], 1);
// Pond promenade and two residential walks.
path([[39, 60], [39, 64], [37, 68], [38, 73]], 2);
path([[51, 75], [55, 77]], 2);
path([[79, 75], [80, 77]], 2);
// EB POLISH (2026-07-11) — house_a's porch walk: a dirt apron from the porch
// interaction to the River Avenue sidewalk, so no building sits pathless.
// (Ends at x82 — x83 is already the avenue's paved verge.)
path([[80, 35], [82, 35]], 1);

// Fence the Cage lot on Maple Row; the only gap is its actual gate/door.
rect(82, 64, 11, 1, '-');
rect(82, 64, 1, 5, '-');
rect(92, 64, 1, 5, '-');
rect(82, 68, 5, 1, '-');
rect(89, 68, 4, 1, '-');

// Water foam is computed last so canal bridges and the road bridge have clean rims.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (at(x, y) !== 'e') continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !'eE'.includes(at(x + dx, y + dy)));
    if (edge) set(x, y, 'E');
  }
}

type Box = { x0: number; y0: number; x1: number; y1: number };
const occupied: Box[] = [];
const props: PropDef[] = [];
const addProp = (p: PropDef): void => { props.push(p); };
const facade = (sprite: string, x: number, baseRow: number): void => {
  const { w, u } = facadeDims(sprite);
  const solid = facadeSolid(w, u);
  const hpx = solid.h + 22;
  const y = +(baseRow - hpx / 16).toFixed(3);
  props.push({ sprite, x, y, solid });
  occupied.push({ x0: x - 1, y0: Math.floor(y) - 1, x1: x + w + 1, y1: baseRow + 1 });
};
// EB POLISH (2026-07-11) — natural PNG dimensions of the hand-authored facades
// (they render 1:1 at runtime, worldSpriteScale). The scale pass positions off
// TRUE drawn size, not the legacy catalog dims, so grown buildings stay centered
// on their lots with their feet planted on the storefront row.
const PNG_DIMS: Record<string, readonly [number, number]> = {
  bldg_ob_hotel: [269, 384],
  bldg_hospital: [333, 280],
  bldg_dept: [306, 278],
  bldg_civic: [313, 361],
  bldg_starmart: [327, 248],
  bldg_arcade2: [290, 227],
  bldg_theater: [331, 306],
  bldg_gen_shop_grass_1: [368, 335],
  bldg_diner: [353, 224],
  facade_brickmore_tall: [271, 537],
  facade_apartments_tall: [285, 544],
  facade_brownstone_tall: [291, 485],
};
/** an EB-ratio storefront: centered on `cx`, image foot planted on `footRow`,
 *  grown by per-instance `scale` (runtime is TOP-LEFT anchored, so x/y pre-shift
 *  here; door offsets stay NATIVE — makeTwoton + the runtime multiply them). The
 *  data solid is pre-scaled for the editor's WYSIWYG box and the dev facade
 *  audit; live collision is rebuilt texture-true (ADR-051). */
const storefront = (sprite: string, cx: number, footRow: number, scale = 1): void => {
  const [tw, th] = PNG_DIMS[sprite];
  const x = +(cx - (tw * scale) / 128).toFixed(3);
  const y = +(footRow - (th * scale) / 64).toFixed(3);
  const p: PropDef = {
    sprite, x, y,
    solid: { ox: 0, oy: 10, w: Math.round((tw * scale) / 4), h: Math.round((th * scale) / 4) - 10 },
  };
  if (scale !== 1) p.scale = scale;
  props.push(p);
  occupied.push({ x0: Math.floor(x) - 1, y0: Math.floor(y) - 1, x1: Math.ceil(cx + (tw * scale) / 128) + 1, y1: Math.ceil(footRow) + 1 });
};
/** a doorless BACK-RANK skyline mass (non-'bldg_' key, LANDMARK_FACADE_SPRITES):
 *  its base hides behind the storefront row; collision is texture-derived, so no
 *  data solid — exactly the house_a/house_b landmark pattern. */
const mass = (sprite: string, cx: number, footRow: number): void => {
  const [tw, th] = PNG_DIMS[sprite];
  props.push({ sprite, x: +(cx - tw / 128).toFixed(3), y: +(footRow - th / 64).toFixed(3) });
};
const house = (sprite: 'house_a' | 'house_b', cx: number, baseRow: number): void => {
  const width = sprite === 'house_a' ? 7.15 : 6.2;
  props.push({ sprite, x: +(cx - width / 2).toFixed(2), y: +(baseRow - 6).toFixed(2) });
  occupied.push({ x0: Math.floor(cx - width / 2) - 1, y0: baseRow - 7, x1: Math.ceil(cx + width / 2) + 1, y1: baseRow + 1 });
};
const inOccupied = (x: number, y: number): boolean => occupied.some((o) => x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1);

// Civic Street: all essential services are visible within seconds of arriving.
// EB SCALE PASS (2026-07-11): the enterable buildings grow to EarthBound's
// building-to-character ratios (EB smallest storefront ≈ 3.1 character-units,
// anchors 4-6.5; scale cap ×1.45 — above it the art softens). The hotel is the
// 4.0-unit west anchor; hospital/dept/civic pack into a party-wall civic block;
// the warehouse deliberately stays ×1.0 (EB's one-wide-low-unit-per-block
// rhythm, and the bus-corner pins live at its door). The doorless tenancy
// facades (brickmore/bagels/bank/market/apartments/brownstone) are NOT moved or
// scaled — their occupyCity lot ids are save-stable keys on x/y.
storefront('bldg_ob_hotel', 12, 13, 1.33);
storefront('bldg_hospital', 20.4, 12.7, 1.4);
storefront('bldg_dept', 27.7, 12.6, 1.42);
storefront('bldg_civic', 34.2, 13.6, 1.15);
facade('bldg_warehouse', 47, 13);
facade('bldg_brickmore', 57, 13);
house('house_b', 68, 13);
// North skyline: Twoton's own brick vernacular cloned tall rises behind the
// hospital/dept party line — its base fully occluded, upper storeys breaking
// the treeline. Foot row 11 keeps the row-12 promenade walkable.
mass('facade_brickmore_tall', 25.1, 11);

// Main Street: functional storefront rhythm, a story theater corner, and gaps at
// every connector. No facade spans or visually buries an intersection. Feet are
// staggered ±0.5 row for EarthBound's parapet rhythm; each named shop keeps its
// door centered on the drag while growing to EB ratios.
storefront('bldg_starmart', 11.7, 54.3, 1.45);
facade('bldg_bagels', 15, 54);
facade('bldg_bank', 21, 54);
storefront('bldg_arcade2', 31.3, 54, 1.45);
storefront('bldg_theater', 38.6, 54.5, 1.3);
storefront('bldg_gen_shop_grass_1', 61.9, 54.8, 1.18);
storefront('bldg_diner', 67.8, 54.1, 1.35);
facade('bldg_market', 71, 54);
// Main Street back rank: three derived talls on the block interiors, feet one
// row behind the promenade (row 53 stays walkable), bases hidden behind the
// storefront wall except the deliberate one-tile alley slivers.
mass('facade_brickmore_tall', 21, 52);
mass('facade_apartments_tall', 32.3, 52);
mass('facade_brownstone_tall', 63.5, 51.8);

// Maple Row: a short residential coda that points directly toward the Cage.
facade('bldg_brickmore', 51, 69);
facade('bldg_apartments', 59, 69);
facade('bldg_brownstone', 67, 69);

// A small eastern neighborhood makes the loop useful without creating another
// empty suburb. The tree wall behind it hides the river until the overlook.
house('house_a', 80, 35);

const SOLID = {
  sign: { ox: 3, oy: 10, w: 10, h: 7 },
  bench: { ox: 1, oy: 6, w: 20, h: 6 },
  phone: { ox: 1, oy: 10, w: 14, h: 16 },
  stall: { ox: 1, oy: 14, w: 38, h: 14 },
} as const;

// Market: dense enough to feel active, but with an unobstructed loop and two exits.
for (const p of [
  { sprite: 'market_stall_a', x: 20, y: 31.1 },
  { sprite: 'market_stall_b', x: 25, y: 31.4 },
  { sprite: 'market_stall_c', x: 34, y: 31.2 },
  { sprite: 'market_stall_b', x: 20, y: 38.2 },
  { sprite: 'market_stall_a', x: 34, y: 38.1 },
] as const) addProp({ ...p, solid: SOLID.stall });
addProp({ sprite: 'crate', x: 19, y: 34.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
addProp({ sprite: 'crate_bananas', x: 38.5, y: 34.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
addProp({ sprite: 'picnic', x: 27.7, y: 39.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } });
addProp({ sprite: 'payphone', x: 39.5, y: 40.2, solid: SOLID.phone });
addProp({ sprite: 'bench', x: 24, y: 28.5, solid: SOLID.bench });
addProp({ sprite: 'bench', x: 35, y: 43.3, solid: SOLID.bench });

// Bus corner and Main Street furniture are deliberate landmarks, not scatter.
addProp({ sprite: 'bus_sign', x: 50.4, y: 18.4, solid: { ox: 4, oy: 18, w: 6, h: 6 } });
addProp({ sprite: 'bench', x: 52, y: 19.2, solid: SOLID.bench });
addProp({ sprite: 'payphone', x: 58, y: 18.5, solid: SOLID.phone });
addProp({ sprite: 'poster_links', x: 55, y: 18.4 });
addProp({ sprite: 'atm', x: 25, y: 53.4, solid: { ox: 1, oy: 10, w: 14, h: 12 } });
for (const x of [31, 35, 39, 61, 68, 75]) addProp({ sprite: 'parking_meter', x: x + 0.2, y: 59.2 });
addProp({ sprite: 'trash_can', x: 43.5, y: 53.5, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
addProp({ sprite: 'hydrant', x: 18.5, y: 59.1, solid: { ox: 2, oy: 6, w: 6, h: 6 } });
addProp({ sprite: 'hydrant', x: 77.5, y: 18.4, solid: { ox: 2, oy: 6, w: 6, h: 6 } });
addProp({ sprite: 'vehicle_clunker', x: 60.5, y: 56.2, solid: { ox: 2, oy: 7, w: 34, h: 8 } });
addProp({ sprite: 'vehicle_clunker', x: 76.5, y: 56.2, solid: { ox: 2, oy: 7, w: 34, h: 8 } });
// EB intersection kit — gooseneck lights at the two busiest crossings (Main ×
// the diagonal boulevard; Civic × the arrival boulevard) and stop signs on the
// avenue approaches, feet planted on the sidewalk corners (the Otterbrooke
// PropDef pattern: tall pole, small foot-only solid).
addProp({ sprite: 'traffic_light', x: 50.05, y: 51.4, solid: { ox: 4, oy: 44, w: 6, h: 4 } });
addProp({ sprite: 'traffic_light', x: 71.3, y: 10.45, solid: { ox: 4, oy: 44, w: 6, h: 4 } });
addProp({ sprite: 'stop_sign', x: 83.1, y: 52.65, solid: { ox: 4, oy: 24, w: 5, h: 4 } });
addProp({ sprite: 'stop_sign', x: 75.1, y: 67.65, solid: { ox: 4, oy: 24, w: 5, h: 4 } });

// Pond promenade, overlook, and Cage threshold.
addProp({ sprite: 'bench', x: 38.7, y: 64.2, solid: SOLID.bench });
addProp({ sprite: 'bench', x: 39.3, y: 72.2, solid: SOLID.bench });
addProp({ sprite: 'news_box', x: 89.5, y: 44.2, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
addProp({ sprite: 'bench', x: 90, y: 46.2, solid: SOLID.bench });
addProp({ sprite: 'cage_gate', x: 86.7, y: 67.1 });
addProp({ sprite: 'backboard', x: 87.4, y: 64.5, solid: { ox: 2, oy: 20, w: 10, h: 6 } });
for (const x of [94, 98]) {
  addProp({ sprite: 'footbridge_rail', x, y: 54.5 });
  addProp({ sprite: 'footbridge_rail', x, y: 59.2 });
}

// Large treeline fronts are generated from solid forest south edges. This makes
// the forest read as continuous masses while keeping prop count modest.
const WALKABLE = new Set(['.', ',', '~', 'f', 'F', ':', '=', 'R', 'D', '_', 'X', '1', '2', '3']);
const addTreelineRun = (x0: number, width: number, y: number, salt: number): void => {
  let x = x0;
  let left = width;
  for (const n of [8, 4, 2]) {
    while (left >= n) {
      const alt = ((x + salt) & 1) === 0 ? '' : '_b';
      props.push({ sprite: `treeline_${n}${alt}`, x, y });
      x += n;
      left -= n;
    }
  }
  while (left-- > 0) props.push({ sprite: 'tree_c', x: x++, y: y - 0.4 });
};
for (let y = 1; y < H - 1; y++) {
  let x = 0;
  while (x < W) {
    if (at(x, y) !== 'b' || !WALKABLE.has(at(x, y + 1))) { x++; continue; }
    const start = x;
    while (x < W && at(x, y) === 'b' && WALKABLE.has(at(x, y + 1))) x++;
    addTreelineRun(start, x - start, y - 1.5, y);
  }
}
// The southern forest faces north. Derive its front from actual forest cells,
// exactly as above, so the river outlet can never be painted over by a blind
// full-width strip.
for (let y = 1; y < H; y++) {
  let x = 0;
  while (x < W) {
    if (at(x, y) !== 'b' || !WALKABLE.has(at(x, y - 1))) { x++; continue; }
    const start = x;
    while (x < W && at(x, y) === 'b' && WALKABLE.has(at(x, y - 1))) x++;
    addTreelineRun(start, x - start, y - 1.5, y + 97);
  }
}

// Sparse canopy accents only inside solid forest; no isolated random trees litter
// the city lawns. Planned street-tree pairs provide the readable town rhythm.
for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
  if (at(x, y) === 'b' && hash2(x, y) % 23 === 0) props.push({ sprite: ['tree', 'tree_b', 'tree_c'][hash2(x + 1, y) % 3], x, y });
}
for (const [x, y] of [
  [12, 20], [18, 20], [26, 20], [35, 20], [43, 20], [63, 20], [80, 20],
  [49, 29], [57, 34], [48, 45], [57, 47], [81, 47], [90, 49],
  [13, 61], [44, 61], [52, 62], [66, 62], [78, 62], [89, 62],
] as const) {
  if (!inOccupied(x, y) && groundLike(x, y)) props.push({ sprite: ((x + y) & 1) ? 'tree_b' : 'tree_c', x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } });
}

const signLocations: ReadonlyArray<readonly [number, number, string]> = [
  [69, 8, 'sign_overpass'],
  [79, 9, 'sign_brickton'],
  [69, 11, 'sign_south_gate'],
  [46, 60, 'sign_to_cage_plaza'],
  [90, 69, 'sign_to_cage_gate'],
  [79, 65, 'sign_lot'],
  [41, 36, 'sign_market_row'],
  // EB scale pass: moved out of the grown civic block's span (was 34,13) into
  // the civic→warehouse gap so it stays reachable on the promenade.
  [38, 13, 'sign_blue_notice'],
  [62, 69, 'sign_maple_heights'],
  [76, 60, 'sign_cage_block'],
  [90, 53, 'sign_to_docks'],
  [101, 60, 'sign_new_docks'],
  [55, 19, 'sign_links_poster'],
];
for (const [x, y, dialogue] of signLocations) {
  // COSTA ESTRELLA already has a dedicated poster prop at this interaction
  // point; adding a generic sign on top recreates the doubled-marker bug.
  if (dialogue !== 'sign_links_poster') props.push({ sprite: 'sign', x, y, solid: SOLID.sign });
}
const signs: SignDef[] = [
  ...signLocations.map(([x, y, dialogue]) => ({ x, y: Math.floor(y), dialogue })),
  // The two hand-drawn landmark houses are not catalog tenancy facades. Their
  // porch interactions still answer the player, so they never become dead art.
  { x: 68, y: 13, dialogue: 'cl_knock_8' },
  { x: 80, y: 35, dialogue: 'cl_knock_3' },
];

const npcs: NpcDef[] = [
  { id: 'nurse', sprite: 'nurse', x: 22, y: 19, facing: 'up', dialogue: 'npc_nurse', idle: true },
  { id: 'gray_commuter', sprite: 'grayCommuter', x: 49, y: 19, facing: 'up', dialogue: 'npc_commuter' },
  { id: 'quarter_man', sprite: 'quarterMan', x: 61, y: 20, facing: 'left', dialogue: 'npc_quarter' },
  // (30,40): three cells up the park path — at (31,43) he stood exactly on the
  // new back-rank mass's parapet line and read as a roof-walker.
  { id: 'pigeon_kid', sprite: 'pigeonKid', x: 30, y: 40, facing: 'up', dialogue: 'npc_pigeonkid' },
  { id: 'sidewalk_critic', sprite: 'sidewalkCritic', x: 48, y: 50, facing: 'right', dialogue: 'npc_critic', wander: true },
  { id: 'hoops_kid', sprite: 'pajamaKid', x: 88, y: 70, facing: 'up', dialogue: 'npc_hoops_kid', wander: true },
  { id: 'bagel_scout', sprite: 'pajamaKid', x: 17, y: 54, facing: 'up', dialogue: 'npc_bagel_scout', idle: true },
  { id: 'blue_watcher', sprite: 'grayCommuter', x: 35, y: 19, facing: 'up', dialogue: 'npc_blue_watcher' },
  { id: 'bus_boy', sprite: 'pigeonKid', x: 54, y: 20, facing: 'left', dialogue: 'npc_bus_boy', wander: true },
  // y:60 — reconciled to the shipped map + the character_collision.test pin
  // (the doc had drifted one cell to 61).
  { id: 'plaza_mime', sprite: 'smilerB', x: 42, y: 60, facing: 'left', dialogue: 'npc_plaza_mime' },
  { id: 'maple_resident', sprite: 'fernLady', x: 64, y: 75, facing: 'up', dialogue: 'npc_maple_resident', wander: true },
  { id: 'south_vendor', sprite: 'quarterMan', x: 26, y: 35, facing: 'down', dialogue: 'npc_south_vendor', shop: 'bakery', stationary: true },
  { id: 'market_vendor_b', sprite: 'martClerk', x: 35, y: 35, facing: 'down', dialogue: 'npc_south_vendor', shop: 'starmart', stationary: true },
  { id: 'new_commuter', sprite: 'grayCommuter', x: 80, y: 51, facing: 'right', dialogue: 'npc_new_commuter', wander: true },
  { id: 'dockward', sprite: 'sidewalkCritic', x: 91, y: 61, facing: 'right', dialogue: 'npc_dockward', idle: true },
];

const map: MapDef = {
  id: 'brickton',
  name: 'TWOTON',
  music: 'brickton',
  settlement: 'city',
  ambience: 'birds',
  grid: g.map((row) => row.join('')),
  props,
  npcs,
  signs,
  phones: [{ x: 58, y: 19 }, { x: 40, y: 40 }],
  atms: [{ x: 25, y: 53 }],
  doors: [
    { x: 72, y: 0, w: 5, h: 1, to: 'meadow_overpass', tx: 120, ty: 480, facing: 'up', indicator: 'none' },
    { x: W - 1, y: 55, w: 1, h: 4, to: 'brickton_docks', tx: 28, ty: 120, facing: 'right', indicator: 'none' },
    { x: 87, y: 68, w: 2, h: 1, to: 'cage_park', tx: 200, ty: 332, facing: 'up', indicator: 'none' },
  ],
  spawners: [
    { enemies: ['blazer_smiler', 'showroom_mannequin'], count: 1, rect: { x: 28, y: 18, w: 10, h: 5 } },
    { enemies: ['pigeon_gang'], count: 2, rect: { x: 19, y: 35, w: 20, h: 9 } },
    { enemies: ['pigeon_gang', 'rogue_icecream_truck'], count: 1, rect: { x: 76, y: 24, w: 10, h: 8 } },
    { enemies: ['cranky_mailbox', 'expired_meter'], count: 1, rect: { x: 54, y: 74, w: 20, h: 3 } },
  ],
  triggers: [
    { id: 'brickton_dial_goal', rect: { x: 56, y: 18, w: 5, h: 4 }, once: false },
    { id: 'payphone_ring', rect: { x: 56, y: 17, w: 6, h: 5 }, once: false },
  ],
  patrols: [],
  reflect: [
    { x: 94, y: 20, w: 6, h: 33, within: 3 },
    { x: 15, y: 63, w: 23, h: 11, within: 3 },
  ],
};

const editorDocument = { ...map, w: W, h: H };
writeFileSync('tools/mapeditor/twoton.json', JSON.stringify(editorDocument));

const source = `/**
 * TWOTON (runtime id \`brickton\`) — editor-authored second-town map.
 *
 * Generated from tools/mapeditor/author-twoton.ts into the visual editor document
 * tools/mapeditor/twoton.json. Hand-tune in /tools/mapeditor/, then fold durable
 * structural changes back into the authoring source so both artifacts stay aligned.
 * Dynamic named-interior and cross-map landing wiring remains in maps.ts.
 */
import type { MapDef } from '../schemas';

export const twotonMap: MapDef = ${JSON.stringify(map, null, 2)};
`;
writeFileSync('src/data/maps_twoton.ts', source);

console.log(`Twoton authored: ${W}x${H}, ${props.length} props, ${npcs.length} NPCs, ${map.doors.length} route doors.`);
