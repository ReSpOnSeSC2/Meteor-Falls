/**
 * AUTHOR VALLE-FOURSIDE — canonical structural source that writes both
 * tools/mapeditor/valle_dorado.json and src/data/maps_valle_dorado.ts for the
 * Valle Dorado village->city PROMOTION (EarthBound Fourside grammar).
 * Keep durable edits here so runtime and editor output cannot drift.
 *
 * Fourside grammar: diagonal boulevards forming diamond blocks, a green
 * park diamond at the center, a museum-class landmark, water framing the
 * west edge, brick-ish walls at the city limits, aprons+lampposts at tower
 * bases. Ours is El Dorado: the gilded city the jungle village grew into.
 * Every fixed point of old Valle Dorado (buildValleDorado, maps_ch2.ts) is
 * re-homed with identical ids/dialogues/flags/relative geometry.
 */
import { writeFileSync } from 'node:fs';
import type { MapDef } from '../../src/schemas';

const W = 96;
const H = 88;

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

/* ---------------- THE PARK DIAMOND mask (a Manhattan diamond — the road
 * painters route AROUND it, so the shrine cluster is guaranteed clear) ---------------- */
const PARK = { cx: 49, cy: 45, r: 9 };
const inPark = (x: number, y: number): boolean =>
  Math.abs(x - PARK.cx) / PARK.r + Math.abs(y - PARK.cy) / PARK.r <= 1;

/* grass fuzz (sparse, flat interiors per the EB organic law) */
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const h = hash2(x, y);
    if (h % 20 === 0) set(x, y, ',~,~ff F'[Math.floor((h >>> 8) % 8)]);
  }

/* ---------------- CITY LIMITS — brick-wall ring. The tile legend has no
 * dedicated brick-wall glyph; 'b' (bush wall, SOLID) doubles as both the
 * wall AND the tree-ring the spec asks for (documented deviation — see
 * report). N/E/S edges only; W is the river. Organic wobble, not a ruler. */
for (let y = 0; y < H; y++) {
  const wob = hash2(90, y) % 2;
  for (let x = W - 4 - wob; x < W; x++) set(x, y, 'b');
}
for (let x = 8; x < W; x++) {
  const wobN = hash2(x, 3) % 2;
  for (let y = 0; y < 3 + wobN; y++) set(x, y, 'b');
  const wobS = hash2(x, 4) % 2;
  for (let y = H - 3 - wobS; y < H; y++) set(x, y, 'b');
}
/* the south gate — a gap in the south wall for the pyramid road */
rect(43, H - 4, 5, 4, '.');

/* ---------------- THE RIVER — west edge, full height, the crossing from
 * DEEP DUNAS / jungle_2 — + a 3-wide seawall promenade ---------------- */
rect(0, 0, 6, H, 'e');
rect(6, 0, 3, H, '=');
/* the footbridge — mid-west, a gap punched through the water for the door */
rect(0, 42, 8, 4, 'R');

/* ---------------- ROADS — two straight streets + the connector avenue +
 * three diagonals (the Fourside diamond lattice) ---------------- */
interface HSpec { c: number; x0: number; x1: number }
const hRoads: HSpec[] = [];
const roadH = (c: number, x0: number, x1: number): void => {
  for (let x = x0; x <= x1; x++) {
    for (let y = c - 2; y <= c + 1; y++) if (!inPark(x, y)) set(x, y, 'R');
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
    for (let x = lo; x <= hi; x++) if (!'eE'.includes(at(x, y)) && !inPark(x, y)) set(x, y, 'R');
    if (grassLike(lo - 1, y)) set(lo - 1, y, '=');
    if (grassLike(hi + 1, y)) set(hi + 1, y, '=');
  }
  vRoads.push({ xcOf, y0, y1 });
};

/* NORTH ST + SOUTH ST — the two straight E-W streets */
roadH(16, 8, 90);
roadH(72, 8, 90);
/* THE AVENUE — the N-S connector (gapped through the park diamond by inPark) */
roadV(() => 49, 12, 76);
/* THE DIAGONALS — NE1 + NW1 (full span) + NE2 (truncated — stops at the
 * park's NE flank instead of reaching south st, so the whole southern half
 * stays open for THE OLD QUARTER; deviation noted in the report). */
const ne1 = (y: number): number => 86 - y;
const nw1 = (y: number): number => y + 10;
const ne2 = (y: number): number => 106 - y;
roadV(ne1, 16, 70);
roadV(nw1, 16, 70);
roadV(ne2, 16, 45);

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

/* ---------------- lane markings + a couple of small crosswalks ---------------- */
for (const { c, x0, x1 } of hRoads) {
  for (let x = x0; x <= x1; x++) if (x % 6 < 3 && at(x, c) === 'R') set(x, c, '_');
}
for (const { xcOf, y0, y1 } of vRoads) {
  for (let y = y0; y <= y1; y++) {
    const xc = xcOf(y);
    if (y % 4 < 2 && at(xc, y) === 'R') set(xc, y, 'D');
  }
}
/* crosswalks (small — never span a road's full height) at the avenue x north/south st */
for (const [x, y] of [[48, 15], [48, 71]] as const) {
  for (let yy = y; yy < y + 2; yy++)
    for (let xx = x; xx < x + 2; xx++) if ('RD_'.includes(at(xx, yy))) set(xx, yy, 'X');
}

/* ---------------- THE PARK DIAMOND — grass with rounded ':' cross-paths ---------------- */
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
/* four spokes in from the diamond's N/E/S/W points to the shrine plaza */
path([[49, 36], [49, 41]]);
path([[58, 45], [53, 45]]);
path([[49, 54], [49, 49]]);
path([[40, 45], [45, 45]]);

/* ---------------- THE CLOCK PLAZA — the park's NE flank, clear of NE1 ---------------- */
rect(58, 28, 10, 8, '=');
rect(60, 30, 6, 5, 'p');

/* ---------------- THE SOUTH GATE approach — a paved lane from South St down
 * to the wall gap (the pyramid road) ---------------- */
rect(44, 74, 3, 13, ':');

/* ---------------- THE LLAMA PEN (old quarter, south of South St — clear of
 * both the avenue and the diagonals, which stop at y70) — fences with a gate ---------------- */
rect(20, 75, 11, 1, '-');
rect(20, 80, 11, 1, '-');
rect(20, 76, 1, 4, '|');
rect(30, 76, 1, 4, '|');
set(25, 80, '.'); // the gate gap

/* ---------------- props / npcs / objects ---------------- */
type Solid = { ox: number; oy: number; w: number; h: number };
interface Prop {
  sprite: string; x: number; y: number; solid?: Solid;
  ifFlag?: string; unlessFlag?: string; scale?: number;
}
const props: Prop[] = [];
const HGT = (u: number): number => 44 + u * 16; // cityBuildingHeight (spritegen/tiles.ts)
const FSOLID = (w: number, u: number): Solid => ({ ox: 0, oy: 10, w: w * 16 + 2, h: HGT(u) - 22 });
/** every forge-eligible facade this map places, mirrored from levelkit/kit.ts BUILDING_DIMS */
const DIMS: Record<string, { w: number; u: number }> = {
  bldg_gen_bank_paper_3: { w: 7, u: 3 },
  bldg_gen_market_gold_1: { w: 6, u: 1 },
  bldg_gen_shop_gold_2: { w: 4, u: 2 },
  bldg_gen_civic_paper_3: { w: 6, u: 3 },
  bldg_gen_market_orange_2: { w: 6, u: 2 },
  bldg_gen_cafe_orange_1: { w: 4, u: 1 },
  bldg_gen_brownstone_earth_3: { w: 4, u: 3 },
  bldg_gen_brownstone_earth_4: { w: 4, u: 4 },
  bldg_tower_arms: { w: 6, u: 12 },
  bldg_tower_glass: { w: 6, u: 12 },
  bldg_tower_corp: { w: 7, u: 13 },
  bldg_colossus_spire: { w: 14, u: 30 },
};
const occupied: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
/** DEBUG GUARD: warn (don't throw) if a facade's footprint lands on paved/water
 * ground — the "roads punching through building footprints" check the brief
 * asks for. Printed at the end of the run, read + fixed by hand before ship. */
const warnings: string[] = [];
const checkClear = (label: string, x0: number, y0: number, x1: number, y1: number): void => {
  for (let yy = Math.max(0, Math.floor(y0)); yy <= Math.min(H - 1, Math.ceil(y1)); yy++)
    for (let xx = Math.max(0, Math.floor(x0)); xx <= Math.min(W - 1, Math.ceil(x1)); xx++) {
      const c = at(xx, yy);
      if ('RDX_Pe E-|'.includes(c) && c !== ' ') warnings.push(`${label}: blocked tile '${c}' at (${xx},${yy})`);
    }
};
/** place a legacy/generated city facade with its base (art bottom) ON `baseRow`. */
const facade = (sprite: string, x: number, baseRow: number): Prop => {
  const { w, u } = DIMS[sprite];
  const p: Prop = { sprite, x, y: baseRow - HGT(u) / 16, solid: FSOLID(w, u) };
  props.push(p);
  const bodyRows = Math.ceil(HGT(u) / 16);
  occupied.push({ x0: x - 1, y0: baseRow - Math.min(9, bodyRows) - 1, x1: x + w + 1, y1: baseRow + 1 });
  checkClear(sprite, x - 0.5, baseRow - bodyRows, x + w + 0.5, baseRow);
  return p;
};
const tree = (x: number, y: number): void => {
  props.push({ sprite: ['tree', 'tree_b', 'tree_c'][hash2(x, y) % 3], x, y });
};
const SIGN_SOLID: Solid = { ox: 3, oy: 10, w: 10, h: 7 };
const BENCH: Solid = { ox: 1, oy: 6, w: 20, h: 6 };
const GIFT_SOLID: Solid = { ox: 1, oy: 7, w: 12, h: 6 };
function giftBox(
  flag: string,
  x: number,
  y: number,
  extra: { ifFlag?: string } = {},
): { props: Prop[]; signs: Array<{ x: number; y: number; dialogue: string; ifFlag?: string; unlessFlag?: string }> } {
  return {
    props: [
      { sprite: 'gift_box', x, y, solid: GIFT_SOLID, ...extra, unlessFlag: flag },
      { sprite: 'gift_box_open', x, y, solid: GIFT_SOLID, ifFlag: flag },
    ],
    signs: [
      { x, y: y + 1, dialogue: flag, ...extra, unlessFlag: flag },
      { x, y: y + 1, dialogue: `${flag}_done`, ifFlag: flag },
    ],
  };
}

/* ===== THE SKYLINE — spire + 3 towers, each hugging a FIXED boundary (the
 * river wall or the east wall) so a diagonal never clips a mega-body ===== */
facade('bldg_colossus_spire', 9, 53); // THE SPIRE — the mogul tower, river boulevard north
facade('bldg_tower_arms', 7, 68); // river boulevard south, close to South St
facade('bldg_tower_glass', 82, 50); // east-wall boulevard, north-mid
facade('bldg_tower_corp', 83, 68); // east-wall boulevard, south-mid, close to South St
props.push({ sprite: 'planter', x: 7, y: 51.4, solid: { ox: 1, oy: 6, w: 20, h: 9 } });
props.push({ sprite: 'bench', x: 12, y: 55.4, solid: BENCH });
props.push({ sprite: 'bench', x: 80, y: 66.4, solid: BENCH });
props.push({ sprite: 'planter', x: 90, y: 49.4, solid: { ox: 1, oy: 6, w: 20, h: 9 } });

/* ===== GOLD-DECO frontages along NORTH ST (base row13; wholly north of the
 * street, so the diagonals — which only begin at y16 — can never reach them) ===== */
facade('bldg_gen_bank_paper_3', 10, 13);
facade('bldg_gen_market_gold_1', 19, 13);
facade('bldg_gen_shop_gold_2', 28, 13);
facade('bldg_gen_civic_paper_3', 35, 13);
/* (avenue junction x48-51 stays clear) */
facade('bldg_gen_market_orange_2', 53, 13);
facade('bldg_gen_cafe_orange_1', 62, 13);
facade('bldg_gen_brownstone_earth_3', 69, 13);
facade('bldg_gen_brownstone_earth_4', 76, 13);
facade('bldg_gen_civic_paper_3', 83, 13);
facade('bldg_gen_shop_gold_2', 83, 69); // South St's one open frontage, east of the towers' shadow

/* ===== THE CLOCK PLAZA dressing ===== */
props.push({ sprite: 'town_clock', x: 62.2, y: 31.9, solid: { ox: 5, oy: 26, w: 9, h: 6 } });
props.push({ sprite: 'bench', x: 59.5, y: 34.4, solid: BENCH });
props.push({ sprite: 'bench', x: 65, y: 34.4, solid: BENCH });
props.push({ sprite: 'news_box', x: 67, y: 33.2, solid: { ox: 2, oy: 12, w: 12, h: 7 } });

/* ===== THE PARK DIAMOND — the shrine cluster, translated intact (+25,+28)
 * from buildValleDorado's plaza (old center ~24.5,17 -> new 49,45). Every
 * relative offset — pavers, plinth, pedestals, benches, planters, the
 * wishers/woke trio, the gift, the sign pair — is a pure translate, so the
 * working layout can never self-collide. ===== */
rect(45, 42, 9, 6, 'p');
props.push({ sprite: 'idol_shrine', x: 48.5, y: 40.2, solid: { ox: 6, oy: 28, w: 28, h: 14 } });
props.push({ sprite: 'pedestal_0', x: 47, y: 41, solid: { ox: 3, oy: 18, w: 16, h: 10 } });
props.push({ sprite: 'pedestal_1', x: 51, y: 41, solid: { ox: 3, oy: 18, w: 16, h: 10 } });
props.push({ sprite: 'pedestal_2', x: 47, y: 48, solid: { ox: 3, oy: 18, w: 16, h: 10 } });
props.push({ sprite: 'pedestal_3', x: 51, y: 48, solid: { ox: 3, oy: 18, w: 16, h: 10 } });
props.push({ sprite: 'bench', x: 46, y: 43, solid: { ox: 1, oy: 6, w: 20, h: 6 } });
props.push({ sprite: 'bench', x: 51, y: 46, solid: { ox: 1, oy: 6, w: 20, h: 6 } });
props.push({ sprite: 'planter', x: 45, y: 43, solid: { ox: 1, oy: 6, w: 20, h: 9 } });
props.push({ sprite: 'planter', x: 53, y: 43, solid: { ox: 1, oy: 6, w: 20, h: 9 } });
set(45, 42, 'F');
set(53, 42, 'F');
set(45, 47, 'F');
const giftWishToken = giftBox('gift_wish_token', 49, 44, { ifFlag: 'grin_defeated' });
props.push(...giftWishToken.props);

/* ===== FREE LLAMAS — scattered across six city spots (park/aprons/quay) ===== */
const LLAMA_SPOTS: Array<[number, number]> = [
  [46, 48], // the park
  [61, 32], // the clock plaza apron
  [26, 45], // the river/spire boulevard
  [76, 58], // between the old quarter and the east towers
  [7, 25], // the seawall quay
  [55, 80], // the south gate approach
];
const PEN_SPOTS: Array<[number, number]> = [
  [22, 77], [25, 77], [28, 77],
  [22, 78], [25, 79], [28, 78],
];

/* ===== THE OLD QUARTER (south-center, between the two open diagonals — see
 * report for the SE->south-center deviation) — the golden village the city
 * grew around: shop/clinic/chapel/houses fronting South St (base row 69,
 * shifted +4 off the original translate to clear the avenue at x48-51), the
 * pen (south of South St), the well, the market, tomas/senora/valle_kid/
 * doc_valle_out ===== */
props.push({ sprite: 'valle_shop', x: 30, y: 64.875, solid: { ox: 0, oy: 20, w: 82, h: 46 } });
props.push({ sprite: 'valle_clinic', x: 38, y: 64.875, solid: { ox: 0, oy: 20, w: 66, h: 46 } });
props.push({ sprite: 'valle_chapel', x: 53, y: 63.625, solid: { ox: 0, oy: 30, w: 50, h: 56 } });
props.push({ sprite: 'valle_house', x: 60, y: 64.875, solid: { ox: 0, oy: 20, w: 50, h: 46 } });
props.push({ sprite: 'valle_house_b', x: 67, y: 64.875, solid: { ox: 0, oy: 20, w: 50, h: 46 } });
checkClear('valle_shop', 30, 66.1, 35.2, 69);
checkClear('valle_clinic', 38, 66.1, 42.2, 69);
checkClear('valle_chapel', 53, 65.5, 56.2, 69);
checkClear('valle_house', 60, 66.1, 63.2, 69);
checkClear('valle_house_b', 67, 66.1, 70.2, 69);

props.push({ sprite: 'crate', x: 31, y: 60.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'market_stall_a', x: 34, y: 60.4, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'market_stall_b', x: 39, y: 60.7, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'crate_bananas', x: 42, y: 60.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'trash_can', x: 44, y: 61.45, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
/* (avenue band x47-50 stays clear) */
props.push({ sprite: 'picnic', x: 52, y: 59.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } });
props.push({ sprite: 'phone_table', x: 58, y: 60, solid: { ox: 1, oy: 8, w: 14, h: 9 } });
props.push({ sprite: 'well', x: 64, y: 59.1, solid: { ox: 4, oy: 20, w: 16, h: 10 } });
props.push({ sprite: 'bench', x: 57.5, y: 66.4, solid: BENCH });
props.push({ sprite: 'picnic_blanket', x: 57, y: 67.6, solid: { ox: 1, oy: 10, w: 20, h: 12 } });
props.push({ sprite: 'plant_pot', x: 57, y: 65.3, solid: { ox: 3, oy: 14, w: 8, h: 7 } });
props.push({ sprite: 'plant_pot', x: 58.5, y: 65.3, solid: { ox: 3, oy: 14, w: 8, h: 7 } });

/* ================= AUTHORED CITY MICRO-DISTRICTS =================
 * The boulevard lattice already works; these scenes give the diamonds civic
 * purpose. No new bldg_* props are introduced, so generated tenancy order and
 * every named-door graft remain save-stable. */
const scenePaint = (x: number, y: number, w: number, h: number, ch: string): void => {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) if (grassLike(xx, yy)) set(xx, yy, ch);
};

// RIVER PROMENADES — two working decks interrupt the ruler-straight seawall.
rect(3, 22, 6, 6, 'd');
rect(3, 56, 6, 6, 'd');
props.push({ sprite: 'puerto_mooring_bollards', x: 3.2, y: 24.8, solid: { ox: 3, oy: 10, w: 26, h: 7 } });
props.push({ sprite: 'bench', x: 6.1, y: 25.2, solid: BENCH });
props.push({ sprite: 'fb_crab_pot', x: 3.2, y: 26.2, solid: { ox: 2, oy: 19, w: 14, h: 7 } });
props.push({ sprite: 'fb_rope_coil', x: 7.2, y: 26.1 });
props.push({ sprite: 'puerto_cargo_crane', x: 3, y: 54.5, solid: { ox: 5, oy: 50, w: 48, h: 12 } });
props.push({ sprite: 'puerto_luggage_cart', x: 6, y: 59, solid: { ox: 3, oy: 25, w: 37, h: 8 } });
props.push({ sprite: 'puerto_mooring_bollards', x: 3.2, y: 60.3, solid: { ox: 3, oy: 10, w: 26, h: 7 } });
props.push({ sprite: 'fb_barrel', x: 7.1, y: 57.4, solid: { ox: 2, oy: 18, w: 14, h: 7 } });
props.push({ sprite: 'footbridge_rail', x: 3.2, y: 21.6 });
props.push({ sprite: 'footbridge_rail', x: 3.2, y: 55.6 });

// SUN-PRINT BAZAAR — the northwest diamond is an artisan market, not a tree field.
scenePaint(25, 30, 11, 12, 'p');
props.push({ sprite: 'valle_sun_press', x: 28, y: 31.2, solid: { ox: 5, oy: 45, w: 50, h: 10 } });
props.push({ sprite: 'market_stall_a', x: 25.5, y: 36.2, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'market_stall_b', x: 32, y: 38, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'puerto_candle_cart', x: 32.2, y: 30.5, solid: { ox: 5, oy: 35, w: 46, h: 9 } });
props.push({ sprite: 'crate', x: 26, y: 39, solid: { ox: 1, oy: 8, w: 18, h: 9 } });

// STARFALL CIVIC APRON — a ceremonial foreground for the colossus spire.
scenePaint(14, 53, 10, 6, 'p');
props.push({ sprite: 'flagpole', x: 20, y: 52.2 });
props.push({ sprite: 'valle_sundial', x: 21, y: 53.1, solid: { ox: 7, oy: 36, w: 34, h: 8 } });
props.push({ sprite: 'planter', x: 20.2, y: 56.4, solid: { ox: 1, oy: 6, w: 20, h: 9 } });
props.push({ sprite: 'news_box', x: 23, y: 57, solid: { ox: 2, oy: 12, w: 12, h: 7 } });

// TAXI + NIGHT-CAFÉ COURT — practical downtown life under the east towers.
// A dark asphalt court with deliberate bay markers reads as a real lot; filling
// every cell with the parking tile created a distracting checkerboard of Ls.
scenePaint(69, 45, 11, 13, 'q');
for (const [x, y] of [[70, 46], [74, 46], [78, 46], [70, 54], [74, 54], [78, 54]] as const)
  set(x, y, 'P');
props.push({ sprite: 'valle_taxi_dispatch', x: 74.5, y: 49.2, solid: { ox: 6, oy: 42, w: 38, h: 9 } });
// `cab_a`/`cab_b` are arcade CABINETS; the city motor pool uses actual world
// vehicle sprites, parked nose-to-tail as quirky Valle taxis.
props.push({ sprite: 'grand_tourer', x: 69.8, y: 46.2, scale: 0.5, solid: { ox: 3, oy: 9, w: 38, h: 8 } });
props.push({ sprite: 'vehicle_clunker', x: 75, y: 47.6, scale: 0.9, solid: { ox: 2, oy: 7, w: 34, h: 8 } });
props.push({ sprite: 'parking_meter', x: 70, y: 52, solid: { ox: 2, oy: 15, w: 5, h: 6 } });
props.push({ sprite: 'market_stall_c', x: 76, y: 52.2, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'bench', x: 71.2, y: 55.2, solid: { ox: 1, oy: 6, w: 20, h: 6 } });
props.push({ sprite: 'trash_can', x: 78.2, y: 55, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
props.push({ sprite: 'festival_lantern_span', x: 70.5, y: 42.1 });

// PYRAMID PILGRIM MARKET — paired courts flank, but never touch, x44–46 gate axis.
scenePaint(36, 75, 8, 10, 'p');
scenePaint(48, 75, 8, 10, 'p');
props.push({ sprite: 'market_stall_a', x: 37, y: 76.2, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'market_stall_b', x: 50, y: 76.2, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'puerto_candle_cart', x: 36.4, y: 81.3, solid: { ox: 5, oy: 35, w: 46, h: 9 } });
props.push({ sprite: 'market_stall_c', x: 51.5, y: 81.1, solid: { ox: 1, oy: 14, w: 38, h: 14 } });
props.push({ sprite: 'crate', x: 40.5, y: 80.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'fb_barrel', x: 49, y: 82.5, solid: { ox: 2, oy: 18, w: 14, h: 7 } });
props.push({ sprite: 'costa_flower_urns', x: 52.2, y: 78.7, solid: { ox: 5, oy: 27, w: 35, h: 8 } });
for (const [x, y] of [[42, 79], [49, 79], [42, 84], [49, 84]] as const)
  props.push({ sprite: 'costa_sun_marker', x, y, solid: { ox: 7, oy: 27, w: 26, h: 8 } });
props.push({ sprite: 'festival_lantern_span', x: 42.5, y: 72.2 });

// OLD-QUARTER ARTISAN YARD + LLAMA PEN CARE.
scenePaint(58, 75, 17, 9, ':');
props.push({ sprite: 'valle_pottery_kiln', x: 60, y: 75.2, solid: { ox: 6, oy: 35, w: 46, h: 10 } });
props.push({ sprite: 'clothesline', x: 65, y: 75.8, solid: { ox: 3, oy: 24, w: 40, h: 7 } });
props.push({ sprite: 'desk', x: 61, y: 80, solid: { ox: 1, oy: 10, w: 18, h: 7 } });
props.push({ sprite: 'desk', x: 68, y: 80, solid: { ox: 1, oy: 10, w: 18, h: 7 } });
props.push({ sprite: 'fb_barrel', x: 59.2, y: 78.2, solid: { ox: 2, oy: 18, w: 14, h: 7 } });
props.push({ sprite: 'crate', x: 70.2, y: 81, solid: { ox: 1, oy: 8, w: 18, h: 9 } });
props.push({ sprite: 'puerto_candle_cart', x: 71, y: 76.3, solid: { ox: 5, oy: 35, w: 46, h: 9 } });
props.push({ sprite: 'valle_llama_trough', x: 20.2, y: 79.2, solid: { ox: 5, oy: 25, w: 46, h: 8 } });

// CLOCK PLAZA reads across the full boulevard with festival lights; the old
// functional clock remains untouched because the story camera locates its key.
props.push({ sprite: 'festival_lantern_span', x: 58.1, y: 27.1 });
props.push({ sprite: 'valle_sundial', x: 68.2, y: 29.4, solid: { ox: 7, oy: 36, w: 34, h: 8 } });

/* ---------------- street trees + wear (deterministic, sparse) ---------------- */
const inOccupied = (x: number, y: number): boolean =>
  occupied.some((o) => x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1);
const sceneReserved = [
  { x: 2, y: 21, w: 8, h: 8 }, { x: 2, y: 54, w: 8, h: 9 },
  { x: 24, y: 29, w: 13, h: 14 }, { x: 14, y: 52, w: 11, h: 8 },
  { x: 68, y: 44, w: 13, h: 15 }, { x: 35, y: 74, w: 22, h: 12 },
  { x: 58, y: 74, w: 18, h: 11 },
];
const inScene = (x: number, y: number): boolean =>
  sceneReserved.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
for (let y = 6; y < H - 5; y++)
  for (let x = 5; x < W - 5; x++) {
    if (at(x, y) !== '.') continue;
    if (inOccupied(x, y)) continue;
    if (inScene(x, y)) continue;
    let nearWalk = false;
    for (let dy = -2; dy <= 2 && !nearWalk; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if ('=RD_:Xp'.includes(at(x + dx, y + dy))) { nearWalk = true; break; }
    const h = hash2(x, y);
    if (nearWalk ? h % 9 === 0 : h % 23 === 0) tree(x, y);
  }
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

/* ---------------- drag furniture: hydrants, cans, poles, clunkers ---------------- */
props.push({ sprite: 'hydrant', x: 25, y: 12.4, solid: { ox: 2, oy: 6, w: 6, h: 6 } });
props.push({ sprite: 'hydrant', x: 60, y: 12.4, solid: { ox: 2, oy: 6, w: 6, h: 6 } });
props.push({ sprite: 'trash_can', x: 44, y: 12.5, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
props.push({ sprite: 'phone_pole', x: 15, y: 12.1 });
props.push({ sprite: 'phone_pole', x: 90, y: 12.1 });
props.push({ sprite: 'vehicle_clunker', x: 41, y: 14.4 });
props.push({ sprite: 'vehicle_clunker', x: 58, y: 71.4 });
props.push({ sprite: 'news_box', x: 22, y: 12.2, solid: { ox: 2, oy: 12, w: 12, h: 7 } });

/* ---------------- signposts (each backed by a SignDef below) ---------------- */
const signPosts: Array<[number, number]> = [
  [2, 43], // the city line, west bridgehead
  [63, 35], // the civic clock
  [16, 55], // the spire's forecourt
  [84, 51], // downtown high (between the two east towers)
  [41, 82], // the south gate
  [25, 81], // the pen gate
  [7, 25], // river promenade
  [29, 39], // sun-print bazaar
  [75, 54], // taxi court
  [38, 82], // pilgrim market
  [63, 82], // artisan yard
];
for (const [sx, sy] of signPosts) props.push({ sprite: 'sign', x: sx, y: sy, solid: SIGN_SOLID });

/* ---------------- water foam — LAST, so bridges/cuts get a clean rim ---------------- */
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (at(x, y) !== 'e') continue;
    const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(
      (c) => c !== 'e' && c !== 'E',
    );
    if (edge) set(x, y, 'E');
  }

/* ---------------- npcs ---------------- */
const npcs = [
  { id: 'tomas', sprite: 'tomas', x: 32, y: 62, facing: 'down', dialogue: 'npc_tomas' },
  { id: 'senora', sprite: 'senora', x: 64, y: 61, facing: 'down', dialogue: 'npc_senora', wander: true },
  { id: 'valle_kid', sprite: 'wokeB', x: 52, y: 58, facing: 'left', dialogue: 'npc_valle_kid', wander: true },
  { id: 'doc_valle_out', sprite: 'docValle', x: 39, y: 62, facing: 'down', dialogue: 'npc_doc_valle_out', ifFlag: 'grin_defeated' },
  // THE WISHERS / WOKE — the shrine cluster, translated with everything else
  { id: 'wisher_a', sprite: 'wisherA', x: 47, y: 44, facing: 'up', dialogue: 'npc_wisher_a', unlessFlag: 'grin_defeated' },
  { id: 'wisher_b', sprite: 'wisherB', x: 50, y: 45, facing: 'up', dialogue: 'npc_wisher_b', unlessFlag: 'grin_defeated' },
  { id: 'wisher_c', sprite: 'wisherC', x: 52, y: 43, facing: 'up', dialogue: 'npc_wisher_c', unlessFlag: 'grin_defeated' },
  { id: 'woke_a', sprite: 'wokeA', x: 47, y: 44, facing: 'down', dialogue: 'npc_woke_a', ifFlag: 'grin_defeated' },
  { id: 'woke_b', sprite: 'wokeB', x: 50, y: 45, facing: 'down', dialogue: 'npc_woke_b', ifFlag: 'grin_defeated' },
  { id: 'woke_c', sprite: 'wokeC', x: 52, y: 43, facing: 'down', dialogue: 'npc_woke_c', ifFlag: 'grin_defeated' },
  { id: 'clock_lady', sprite: 'oldTimer', x: 62, y: 34, facing: 'up', dialogue: 'npc_clock_lady' },
  { id: 'spire_gazer', sprite: 'sidewalkCritic', x: 16, y: 56, facing: 'up', dialogue: 'npc_spire_gazer' },
  { id: 'downtown_suit', sprite: 'grayCommuter', x: 82, y: 51, facing: 'up', dialogue: 'npc_downtown_suit', wander: true },
  { id: 'valle_river_vendor', sprite: 'tomas', x: 7, y: 26, facing: 'left', dialogue: 'npc_valle_river_vendor', idle: true },
  { id: 'valle_printmaker', sprite: 'mercadoKeeper', x: 29, y: 38, facing: 'up', dialogue: 'npc_valle_printmaker', idle: true, emote: 'happy' },
  { id: 'valle_dispatcher', sprite: 'grayCommuter', x: 75, y: 54, facing: 'up', dialogue: 'npc_valle_dispatcher', wander: true },
  { id: 'valle_pilgrim', sprite: 'senora', x: 38, y: 81, facing: 'down', dialogue: 'npc_valle_pilgrim', idle: true, emote: 'think' },
  { id: 'valle_relic_vendor', sprite: 'mercadoKeeper', x: 53, y: 82, facing: 'left', dialogue: 'npc_valle_relic_vendor', idle: true },
  { id: 'valle_potter', sprite: 'oldTimer', x: 63, y: 81, facing: 'up', dialogue: 'npc_valle_potter', idle: true },
];
LLAMA_SPOTS.forEach(([x, y], i) => {
  const n = i + 1;
  npcs.push({
    id: `llama_${n}`,
    sprite: 'llama',
    x, y,
    facing: x > 49 ? 'left' : 'right',
    dialogue: `npc_llama_${n}`,
    dog: true,
    ifFlag: 'q_llama',
    unlessFlag: `q_llama_${n}`,
  } as any);
  npcs.push({
    id: `llama_pen_${n}`,
    sprite: 'llama',
    x: PEN_SPOTS[i][0],
    y: PEN_SPOTS[i][1],
    facing: 'left',
    dialogue: 'npc_llama_penned',
    dog: true,
    ifFlag: `q_llama_${n}`,
  } as any);
});

/* ---------------- signs (script ids unchanged) ---------------- */
const signs = [
  { x: 2, y: 44, dialogue: 'sign_valle' },
  { x: 49, y: 47, dialogue: 'sign_shrine', unlessFlag: 'grin_defeated' },
  { x: 49, y: 47, dialogue: 'sign_shrine_after', ifFlag: 'grin_defeated' },
  { x: 25, y: 81, dialogue: 'sign_pen' },
  { x: 63, y: 35, dialogue: 'sign_brickton_clock' },
  { x: 16, y: 55, dialogue: 'sign_spire' },
  { x: 84, y: 51, dialogue: 'sign_downtown_high' },
  { x: 41, y: 82, dialogue: 'sign_valle_gate' },
  { x: 7, y: 25, dialogue: 'sign_valle_river_decks' },
  { x: 29, y: 39, dialogue: 'sign_valle_sun_prints' },
  { x: 75, y: 54, dialogue: 'sign_valle_taxi_court' },
  { x: 38, y: 82, dialogue: 'sign_valle_pilgrim_market' },
  { x: 63, y: 82, dialogue: 'sign_valle_artisan_yard' },
  ...giftWishToken.signs,
];

/* ---------------- doors / phones / atms / triggers / spawners / reflect ---------------- */
const doors = [
  /* west mouth, over the footbridge -> jungle_2 (PLACEHOLDER — being rebuilt now; orchestrator re-aims tx/ty) */
  { x: 0, y: 42, w: 1, h: 4, to: 'jungle_2', tx: 576, ty: 312, facing: 'right' },
  /* south gate, the pyramid road -> KEEP tx/ty exactly (pyramid_ante is not being rebuilt) */
  { x: 44, y: 87, w: 3, h: 1, to: 'pyramid_ante', tx: 168, ty: 232, facing: 'up' },
];
const phones = [{ x: 58, y: 60 }];
const atms: Array<{ x: number; y: number }> = [];
const triggers = [
  { id: 'valle_arrival', rect: { x: 1, y: 42, w: 3, h: 4 }, once: false },
  { id: 'brickton_clock_goal', rect: { x: 59, y: 29, w: 9, h: 6 }, once: false },
];
const spawners = [
  { enemies: ['pickpocket_parrot', 'gilded_beetle'], count: 1, rect: { x: 14, y: 16, w: 10, h: 2 } },
  { enemies: ['pickpocket_parrot', 'gilded_beetle'], count: 1, rect: { x: 76, y: 71, w: 10, h: 2 } },
];
const reflect: Array<{ x: number; y: number; w: number; h: number; within: number }> = [
  { x: 0, y: 0, w: 3, h: 42, within: 4 },
  { x: 0, y: 46, w: 3, h: H - 46, within: 4 },
];

/* ---------------- footbridge rails ---------------- */
props.push({ sprite: 'footbridge_rail', x: 2, y: 41.6 });
props.push({ sprite: 'footbridge_rail', x: 2, y: 45.7 });
props.push({ sprite: 'footbridge_rail', x: 5, y: 41.6 });
props.push({ sprite: 'footbridge_rail', x: 5, y: 45.7 });

/* ---------------- emit the editor document ---------------- */
const runtimeMap = {
  id: 'valle_dorado',
  name: 'VALLE DORADO',
  music: 'valle',
  ambience: 'crowd',
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
} as unknown as MapDef;
const doc = { ...runtimeMap, w: W, h: H };
writeFileSync('tools/mapeditor/valle_dorado.json', JSON.stringify(doc));
const source = `/**
 * VALLE DORADO — editor-authored fourth-stage city using EarthBound Fourside
 * grammar: diagonal boulevards, diamond blocks, a river wall, old quarter,
 * civic park, working promenades, artisan courts, and the Starfall skyline.
 *
 * Generated from tools/mapeditor/author-valle-fourside.ts into the visual
 * editor document tools/mapeditor/valle_dorado.json. Fold durable structural
 * edits back into that authoring source so runtime and editor stay aligned.
 * Dynamic named-interior and reciprocal landing wiring stays in maps_ch2.ts.
 */
import type { MapDef } from '../schemas';

export const valleDoradoMap: MapDef = ${JSON.stringify(runtimeMap, null, 2)};
`;
writeFileSync('src/data/maps_valle_dorado.ts', source);
console.log(`valle_dorado.json written: ${W}x${H}, ${props.length} props, ${npcs.length} npcs, ${signs.length} signs`);
if (warnings.length) {
  console.log(`\n--- ${warnings.length} COLLISION WARNINGS ---`);
  for (const w of warnings) console.log(w);
} else {
  console.log('\n--- no collision warnings ---');
}

for (let y = 0; y < H; y += 1) console.log(String(y).padStart(3) + ' ' + g[y].join(''));
