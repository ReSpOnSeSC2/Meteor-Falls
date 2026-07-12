/**
 * AUTHOR DUNAS — canonical structural source for the two editor documents and
 * src/data/maps_dunas.ts, covering THE CROSSING:
 * the Ch.2 jungle-between-port-and-golden-city becomes a Dusty Dunes Desert
 * crossing (EarthBound grammar). ids stay jungle_1/jungle_2 for save-compat.
 * Runtime ids stay jungle_1/jungle_2 for save compatibility.
 */
import { writeFileSync } from 'node:fs';
import type { MapDef } from '../../src/schemas';

/* ---------------- deterministic hash (no RNG — stable forever) ---------------- */
const hash2 = (x: number, y: number): number => {
  let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y + 0x95, 0x85ebca6b);
  h = (Math.imul(h ^ (h >>> 13), 0xc2b2ae35) ^ (h >>> 16)) >>> 0;
  return h;
};

type Solid = { ox: number; oy: number; w: number; h: number };
interface Prop {
  sprite: string; x: number; y: number; solid?: Solid;
  ifFlag?: string; unlessFlag?: string; scale?: number;
  door?: { ox: number; oy: number; w: number; h: number; to: string; tx: number; ty: number };
}
interface Rect { x: number; y: number; w: number; h: number }

/** Interpolate a hand-authored horizontal route from sparse composition knots. */
const centerTable = (length: number, knots: ReadonlyArray<readonly [number, number]>): number[] => {
  const out = Array.from({ length }, () => knots[0][1]);
  for (let k = 0; k < knots.length - 1; k++) {
    const [x0, y0] = knots[k];
    const [x1, y1] = knots[k + 1];
    for (let x = x0; x <= x1; x++) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      out[x] = Math.round(y0 + (y1 - y0) * t);
    }
  }
  return out;
};

/** Paint the union of adjacent four-wide spans so every bend stays connected. */
const paintWindH = (
  set: (x: number, y: number, ch: string) => void,
  centers: readonly number[],
  width: number,
  ch: string,
): void => {
  const half = Math.floor(width / 2);
  for (let x = 0; x < centers.length; x++) {
    const next = centers[Math.min(x + 1, centers.length - 1)];
    const lo = Math.min(centers[x], next) - half;
    const hi = Math.max(centers[x], next) + (width - 1 - half);
    for (let y = lo; y <= hi; y++) set(x, y, ch);
  }
};

const SIGN_SOLID: Solid = { ox: 3, oy: 10, w: 10, h: 7 };
const GIFT_SOLID: Solid = { ox: 1, oy: 7, w: 12, h: 6 };
const PICNIC_SOLID: Solid = { ox: 2, oy: 8, w: 32, h: 14 };
const PAYPHONE_SOLID: Solid = { ox: 1, oy: 10, w: 14, h: 16 };
/** legacy gen-catalog facade: coarse footprint w (tiles) + stories u — matches kit.ts */
const HGT = (u: number): number => 44 + u * 16;
const FSOLID = (w: number, u: number): Solid => ({ ox: 0, oy: 10, w: w * 16 + 2, h: HGT(u) - 22 });
const CAFE_DIMS = { w: 4, u: 1 }; // bldg_gen_cafe_orange_1 (facadeDims check)

/** native px (manifest w/h) for the desert edge props — solids scaled off these. */
const NATIVE: Record<string, [number, number]> = {
  edge_desert_dune: [44, 22],
  edge_desert_cactus: [23, 40],
  edge_desert_rock: [26, 40],
  edge_rock_a: [34, 30],
  edge_rock_b: [31, 34],
  palm_a: [18, 24],
  palm_b: [18, 24],
  palm_c: [18, 24],
};
/** rock/mound/cactus: a base-anchored hitbox ~69% width, ~25% height, ~15% margin
 *  off the sprite's bottom (the {ox:4,oy:24,w:18,h:10} example on edge_desert_rock
 *  26×40 checks out: w=round(26*.69)=18, margin=round(40*.15)=6, oy=40-10-6=24). */
const rockSolid = (key: string): Solid => {
  const [nw, nh] = NATIVE[key];
  const w = Math.round(nw * 0.69);
  const ox = Math.round((nw - w) / 2);
  const h = Math.round(nh * 0.25);
  const margin = Math.round(nh * 0.15);
  const oy = Math.max(0, nh - h - margin);
  return { ox, oy, w, h };
};
/** palm: trunk-based hitbox near the base (mirrors the game's tree {ox7,oy22,w12,h10}
 *  on a 22×34 tree — trunk ratio ~0.55w/0.29h anchored ~6% margin off the bottom). */
const palmSolid = (key: string): Solid => {
  const [nw, nh] = NATIVE[key];
  const w = Math.round(nw * 0.55);
  const ox = Math.round((nw - w) / 2);
  const h = Math.round(nh * 0.29);
  const margin = Math.round(nh * 0.06);
  const oy = Math.max(0, nh - h - margin);
  return { ox, oy, w, h };
};
/** Programmatic collision check — the ASCII preview only shows GRID tiles, but
 *  rocks/cacti/dunes/palms are PROPS (never touch the grid), so overlaps with
 *  water or the ≥1.5-tile spawner clearance law need arithmetic, not eyeballing. */
function validateMap(m: {
  id: string; W: number; H: number; grid: string[][]; at: (x: number, y: number) => string;
  props: Prop[]; doors: Array<{ x: number; y: number; w: number; h: number }>;
  spawners: Array<{ rect: Rect }>; signs: Array<{ x: number; y: number }>; phones: Array<{ x: number; y: number }>;
  atms: Array<{ x: number; y: number }>;
}): void {
  const problems: string[] = [];
  const solidTile = (ch: string): boolean => 'bWOACeEUJZKB-|'.includes(ch);
  // 1) doors must open onto a NON-solid tile
  for (const d of m.doors) {
    for (let dy = 0; dy < d.h; dy++)
      for (let dx = 0; dx < d.w; dx++) {
        const ch = m.at(d.x + dx, d.y + dy);
        if (solidTile(ch)) problems.push(`door(${d.x},${d.y}) tile(${d.x + dx},${d.y + dy})='${ch}' is SOLID`);
      }
  }
  // 2) props with a solid must not sit on a water tile (rock/cactus/dune afloat)
  for (const p of m.props) {
    if (!p.solid) continue;
    const tx = Math.round(p.x);
    const ty = Math.round(p.y);
    const ch = m.at(tx, ty);
    if (ch === 'e' || ch === 'E') problems.push(`prop ${p.sprite}@(${p.x},${p.y}) sits on WATER tile '${ch}'`);
  }
  // 3) spawner rects must stay >=1.5 tiles clear of every door/phone/atm/sign
  const points: Array<{ x: number; y: number; kind: string }> = [
    ...m.signs.map((s) => ({ x: s.x, y: s.y, kind: 'sign' })),
    ...m.phones.map((s) => ({ x: s.x, y: s.y, kind: 'phone' })),
    ...m.atms.map((s) => ({ x: s.x, y: s.y, kind: 'atm' })),
  ];
  const doorRects = m.doors.map((d) => ({ x: d.x, y: d.y, w: d.w, h: d.h, kind: 'door' }));
  const distPointToRect = (px: number, py: number, r: Rect): number => {
    const cx = Math.max(r.x, Math.min(px, r.x + r.w));
    const cy = Math.max(r.y, Math.min(py, r.y + r.h));
    return Math.hypot(px - cx, py - cy);
  };
  for (const sp of m.spawners) {
    for (const pt of points) {
      const dist = distPointToRect(pt.x, pt.y, sp.rect);
      if (dist < 1.5) problems.push(`spawner${JSON.stringify(sp.rect)} only ${dist.toFixed(2)} tiles from ${pt.kind}(${pt.x},${pt.y})`);
    }
    for (const dr of doorRects) {
      // rect-to-rect min distance (0 if overlapping)
      const dx = Math.max(dr.x - (sp.rect.x + sp.rect.w), sp.rect.x - (dr.x + dr.w), 0);
      const dy = Math.max(dr.y - (sp.rect.y + sp.rect.h), sp.rect.y - (dr.y + dr.h), 0);
      const dist = Math.hypot(dx, dy);
      if (dist < 1.5) problems.push(`spawner${JSON.stringify(sp.rect)} only ${dist.toFixed(2)} tiles from door(${dr.x},${dr.y})`);
    }
  }
  if (problems.length === 0) console.log(`[validate ${m.id}] clean — no collisions found`);
  else {
    console.log(`[validate ${m.id}] ${problems.length} issue(s):`);
    for (const p of problems) console.log('  ! ' + p);
  }
}

/* ============================================================================
 * MAP 1 — 'jungle_1' → LAS DUNAS DESERT (44×30)
 * ============================================================================ */
function buildMap1(): MapDef {
  const W = 44;
  const H = 30;
  const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => 'n'));
  const inB = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
  const at = (x: number, y: number): string => (inB(x, y) ? g[y][x] : '#');
  const set = (x: number, y: number, ch: string): void => { if (inB(x, y)) g[y][x] = ch; };

  /* sparse sand texture-variance patches (hash-gated, rare) */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (hash2(x, y) % 23 === 0) set(x, y, '.');

  /* OASIS pool (small kidney), center (20,10) */
  const OASIS = { cx: 20, cy: 10, rx: 3.2, ry: 2.1 };
  for (let y = Math.floor(OASIS.cy - OASIS.ry - 1); y <= OASIS.cy + OASIS.ry + 1; y++)
    for (let x = Math.floor(OASIS.cx - OASIS.rx - 1); x <= OASIS.cx + OASIS.rx + 1; x++) {
      const wob = ((hash2(x, y) % 100) / 100 - 0.5) * 0.3;
      const d = ((x - OASIS.cx) / OASIS.rx) ** 2 + ((y - OASIS.cy) / OASIS.ry) ** 2;
      if (d < 1 + wob) set(x, y, 'e');
    }

  /* THE SUNKEN COMPASS — a four-wide crescent road bends north toward the
   * oasis, holds beside the half-buried bus, then releases back to both edge
   * mouths. A knot table keeps the silhouette intentional and deterministic. */
  const roadCenters = centerTable(W, [
    [0, 24], [5, 24], [18, 17], [23, 17], [34, 24], [43, 24],
  ]);
  paintWindH(set, roadCenters, 4, ':');

  /* ---------------- occupied zones (block decor scatter) ---------------- */
  const occupied: Rect[] = [
    { x: 15, y: 6, w: 11, h: 8 }, // oasis clearance
  ];
  const WAYSTATION_X = 28;
  const WAYSTATION_BASE_ROW = 17;
  const wsY = WAYSTATION_BASE_ROW - HGT(CAFE_DIMS.u) / 16;
  occupied.push({ x: WAYSTATION_X - 2, y: Math.floor(wsY) - 1, w: CAFE_DIMS.w + 4, h: 20 - Math.floor(wsY) + 1 });

  const props: Prop[] = [];
  const npcs = [
    { id: 'dunas_west_surveyor', sprite: 'tomas', x: 12, y: 18, facing: 'right', dialogue: 'npc_dunas_west_surveyor', idle: true, emote: 'think' },
    { id: 'dunas_west_parasol', sprite: 'fernLady', x: 22, y: 14, facing: 'down', dialogue: 'npc_dunas_west_parasol', wander: true },
  ];
  const signs: Array<{ x: number; y: number; dialogue: string }> = [];
  const phones: Array<{ x: number; y: number }> = [];

  /* ---------------- crescent rock shoulders, with deliberate breathing gaps ---------------- */
  const gapsNorth: Array<[number, number]> = [[3, 5], [16, 18], [37, 39]];
  const inGap = (x: number, ranges: Array<[number, number]>): boolean =>
    ranges.some(([a, b]) => x >= a && x <= b);
  const inOccupiedX = (x: number, y: number): boolean =>
    occupied.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
  const ROCK_KEYS = ['edge_desert_rock', 'edge_rock_a', 'edge_rock_b'];
  for (let x = 1; x < W - 1; x++) {
    if (inGap(x, gapsNorth)) continue;
    const y = roadCenters[x] - 3;
    if (inOccupiedX(x, y)) continue;
    const h = hash2(x, y);
    if (h % 5 === 0) continue; // natural sparseness inside the "dense" band
    const key = ROCK_KEYS[h % ROCK_KEYS.length];
    props.push({ sprite: key, x, y, solid: rockSolid(key) });
  }
  /* ---------------- south shoulder, lighter and visibly wind-eroded ---------------- */
  const gapsSouth: Array<[number, number]> = [[10, 13], [30, 33]];
  for (let x = 1; x < W - 1; x++) {
    if (inGap(x, gapsSouth)) continue;
    const y = roadCenters[x] + 2;
    const h = hash2(x + 11, y);
    if (h % 3 !== 0) continue; // lighter than the north fringe
    const key = ROCK_KEYS[h % ROCK_KEYS.length];
    props.push({ sprite: key, x, y, solid: rockSolid(key) });
  }

  /* ---------------- dune mounds (3–5) ---------------- */
  const mounds: Array<[number, number]> = [[6, 6], [35, 6], [11, 17], [40, 16]];
  for (const [x, y] of mounds) props.push({ sprite: 'edge_desert_dune', x, y, solid: rockSolid('edge_desert_dune') });

  /* ---------------- cactus scatter (~8, hash-gated, clear of oasis/waystation) ---------------- */
  let cactusCount = 0;
  for (let y = 4; y <= 20 && cactusCount < 8; y++)
    for (let x = 1; x < W - 1 && cactusCount < 8; x++) {
      if (inOccupiedX(x, y)) continue;
      if (at(x, y) === ':') continue;
      if (mounds.some(([mx, my]) => Math.abs(mx - x) < 2 && Math.abs(my - y) < 2)) continue;
      const h = hash2(x + 3, y + 5);
      if (h % 31 === 7) {
        props.push({ sprite: 'edge_desert_cactus', x, y, solid: rockSolid('edge_desert_cactus') });
        cactusCount++;
      }
    }

  /* ---------------- a couple of edge_rock_a/b landmarks in the dune field ---------------- */
  const rockLandmarks: Array<[number, number, string]> = [[9, 12, 'edge_rock_a'], [33, 14, 'edge_rock_b']];
  for (const [x, y, key] of rockLandmarks) props.push({ sprite: key, x, y, solid: rockSolid(key) });

  /* ---------------- OASIS dressing: 3 palms ---------------- */
  props.push({ sprite: 'palm_a', x: 16, y: 8.4, solid: palmSolid('palm_a') });
  props.push({ sprite: 'palm_b', x: 24, y: 7.8, solid: palmSolid('palm_b') });
  props.push({ sprite: 'palm_c', x: 20, y: 13.2, solid: palmSolid('palm_c') });

  /* A real directional vehicle sheet, planted as a static roadside relic. The
   * foreground dune hides its wheels so it reads half-buried, not parked. */
  props.push({ sprite: 'bus', x: 8.5, y: 13.8, scale: 0.72, solid: { ox: 8, oy: 44, w: 112, h: 16 } });
  props.push({ sprite: 'edge_desert_dune', x: 11.5, y: 17.2, solid: rockSolid('edge_desert_dune') });

  /* ---------------- roadside sign (single) ---------------- */
  props.push({ sprite: 'sign', x: 3, y: 21.4, solid: SIGN_SOLID });
  signs.push({ x: 3, y: 21.4, dialogue: 'sign_jungle1' });

  /* ---------------- WAYSTATION facade (occupy doors it) + payphone beside it ---------------- */
  props.push({
    sprite: 'bldg_gen_cafe_orange_1',
    x: WAYSTATION_X,
    y: wsY,
    solid: FSOLID(CAFE_DIMS.w, CAFE_DIMS.u),
    // A real room + shop, not a scenery facade. The offset follows this cafe
    // drawing's right-of-center door; runtime rebuilds collision around it.
    door: { ox: 33, oy: HGT(CAFE_DIMS.u) - 14, w: 16, h: 18, to: 'dunas_waystation', tx: 104, ty: 118 },
  });
  props.push({ sprite: 'payphone', x: WAYSTATION_X + CAFE_DIMS.w + 1.5, y: 17.1, solid: PAYPHONE_SOLID });
  phones.push({ x: WAYSTATION_X + CAFE_DIMS.w + 1.5, y: 17.1 });

  /* ---------------- foam rim (LAST, so the pool gets a clean rim) ---------------- */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== 'e') continue;
      const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((c) => c !== 'e' && c !== 'E');
      if (edge) set(x, y, 'E');
    }

  const doors = [
    // west mouth → Puerto Sol (placeholder — Puerto Sol is ALSO being rebuilt now; re-aim off its live east gate)
    { x: 0, y: 22, w: 1, h: 4, to: 'puerto_sol', tx: 2016, ty: 400, facing: 'left' },
    // east mouth → jungle_2 (placeholder — jungle_2 is ALSO being rebuilt now; re-aim off its live west mouth)
    { x: 43, y: 22, w: 1, h: 4, to: 'jungle_2', tx: 40, ty: 200, facing: 'right' },
  ];
  const spawners = [
    { enemies: ['pickpocket_parrot', 'banana_bunch', 'postage_stampede'], count: 3, rect: { x: 3, y: 5, w: 13, h: 8 } },
    { enemies: ['jungle_jitterbug', 'pickpocket_parrot', 'confetti_cannon'], count: 2, rect: { x: 35, y: 5, w: 6, h: 9 } },
    { enemies: ['banana_bunch'], count: 2, rect: { x: 35, y: 22, w: 6, h: 4 } },
  ];

  validateMap({ id: 'jungle_1', W, H, grid: g, at, props, doors, spawners, signs, phones, atms: [] });

  const doc = {
    id: 'jungle_1',
    name: 'LAS DUNAS DESERT',
    w: W,
    h: H,
    music: 'dunas',
    ambience: 'wind',
    grid: g.map((r) => r.join('')),
    props,
    npcs,
    signs,
    phones,
    atms: [],
    doors,
    spawners,
    triggers: [],
    patrols: [],
    reflect: [{ x: 16, y: 7, w: 9, h: 7, within: 2 }],
  };
  writeFileSync('tools/mapeditor/jungle_1.json', JSON.stringify(doc));
  console.log(`\n=== jungle_1.json written: ${W}x${H}, ${props.length} props, ${signs.length} signs, ${doors.length} doors, ${spawners.length} spawners ===`);
  for (let y = 0; y < H; y++) console.log(String(y).padStart(3) + ' ' + g[y].join(''));
  const { w: _w, h: _h, ...runtimeMap } = doc;
  return runtimeMap as unknown as MapDef;
}

/* ============================================================================
 * MAP 2 — 'jungle_2' → DEEP DUNAS (46×28)
 * ============================================================================ */
function buildMap2(): MapDef {
  const W = 46;
  const H = 28;
  const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => 'n'));
  const inB = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
  const at = (x: number, y: number): string => (inB(x, y) ? g[y][x] : '#');
  const set = (x: number, y: number, ch: string): void => { if (inB(x, y)) g[y][x] = ch; };
  const rect = (x: number, y: number, w: number, h: number, ch: string): void => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, ch);
  };
  const groundLike = (x: number, y: number): boolean => 'n.'.includes(at(x, y));
  const path = (pts: Array<[number, number]>, wpx = 2): void => {
    for (let i = 0; i < pts.length - 1; i++) {
      let [x, y] = pts[i];
      const [tx, ty] = pts[i + 1];
      for (;;) {
        for (let dy = 0; dy < wpx; dy++)
          for (let dx = 0; dx < wpx; dx++) if (groundLike(x + dx, y + dy)) set(x + dx, y + dy, ':');
        if (x === tx && y === ty) break;
        if (x !== tx) x += Math.sign(tx - x);
        if (y !== ty) y += Math.sign(ty - y);
      }
    }
  };

  /* sparse sand texture-variance patches */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (hash2(x, y) % 23 === 0) set(x, y, '.');

  /* THE GROTTO mouth ring area is carved BEFORE the winding path so the path
   * terminates cleanly at the door tile. */
  const GROTTO_DOOR: Rect = { x: 11, y: 1, w: 2, h: 1 };

  /* rounded dirt path: road (mid) winding up to the grotto mouth */
  path([[22, 21], [20, 18], [17, 14], [14, 10], [12, 6], [12, 2]]);

  // THE SPLIT HORIZON: unlike the oasis leg, this screen opens on a dry ridge.
  // The river cuts the right end of the silhouette in two a few lines below.
  rect(17, 0, 23, 1, '5');

  /* EAST BRIDGE — N-S water strip x40-43, full height */
  rect(40, 0, 4, H, 'e');

  /* A four-wide sawtooth canyon road. It deliberately kinks three times before
   * becoming the straight bridge deck at the east mouth. */
  const roadCenters = centerTable(W, [
    [0, 20], [6, 20], [11, 17], [18, 21], [25, 21], [31, 18], [37, 21], [45, 20],
  ]);
  paintWindH(set, roadCenters, 4, ':');

  const props: Prop[] = [];
  const npcs = [
    { id: 'dunas_east_cartographer', sprite: 'tomas', x: 19, y: 16, facing: 'down', dialogue: 'npc_dunas_east_cartographer', idle: true, emote: 'think' },
    { id: 'dunas_east_pilgrim', sprite: 'wokeB', x: 32, y: 22.5, facing: 'right', dialogue: 'npc_dunas_east_pilgrim', wander: true },
  ];
  const signs: Array<{ x: number; y: number; dialogue: string }> = [];
  const phones: Array<{ x: number; y: number }> = [];

  /* ---------------- occupied zones ---------------- */
  const occupied: Rect[] = [
    { x: 7, y: 0, w: 10, h: 6 }, // grotto ring + path terminus
    { x: 33, y: 21, w: 7, h: 4 }, // picnic + gift clearance
    { x: 39, y: 0, w: 7, h: H }, // bridge water + shoreline
  ];
  const inOccupied = (x: number, y: number): boolean =>
    occupied.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);

  /* ---------------- sawtooth canyon shoulders ---------------- */
  const gapsNorth: Array<[number, number]> = [[16, 19], [27, 30]];
  const inGap = (x: number, ranges: Array<[number, number]>): boolean => ranges.some(([a, b]) => x >= a && x <= b);
  const ROCK_KEYS = ['edge_desert_rock', 'edge_rock_a', 'edge_rock_b'];
  for (let x = 1; x < W - 1; x++) {
    if (inGap(x, gapsNorth)) continue;
    const y = roadCenters[x] - 3;
    if (inOccupied(x, y)) continue;
    const h = hash2(x, y);
    if (h % 5 === 0) continue;
    const key = ROCK_KEYS[h % ROCK_KEYS.length];
    props.push({ sprite: key, x, y, solid: rockSolid(key) });
  }
  /* ---------------- light ROCK FRINGE south of the road (y23), 2 gaps, clear of the rest ---------------- */
  const gapsSouth: Array<[number, number]> = [[32, 39], [3, 6]];
  for (let x = 1; x < W - 1; x++) {
    if (inGap(x, gapsSouth)) continue;
    const y = roadCenters[x] + 2;
    if (inOccupied(x, y)) continue;
    const h = hash2(x + 11, y);
    if (h % 3 !== 0) continue;
    const key = ROCK_KEYS[h % ROCK_KEYS.length];
    props.push({ sprite: key, x, y, solid: rockSolid(key) });
  }

  /* ---------------- ROCK CANYON pinch mid-road (x22-25): blocks rows18-19, leaves 20-21 clear ---------------- */
  const CANYON_SOLID: Solid = { ox: 4, oy: 4, w: 18, h: 28 };
  for (let i = 0; i < 4; i++) {
    const x = 22 + i;
    const key = ROCK_KEYS[hash2(x, 100) % 2]; // desert_rock or rock_a (tallest two)
    props.push({ sprite: key, x, y: 18, solid: CANYON_SOLID });
  }

  /* ---------------- dune mounds (3–5) ---------------- */
  const moundCandidates: Array<[number, number]> = [[4, 12], [35, 4], [30, 14], [14, 10]];
  const mounds: Array<[number, number]> = moundCandidates.filter(
    ([x, y]) => !inOccupied(x, y),
  );
  for (const [x, y] of mounds) props.push({ sprite: 'edge_desert_dune', x, y, solid: rockSolid('edge_desert_dune') });

  /* ---------------- cactus scatter (~8) ---------------- */
  let cactusCount = 0;
  for (let y = 1; y <= 16 && cactusCount < 8; y++)
    for (let x = 1; x < W - 1 && cactusCount < 8; x++) {
      if (inOccupied(x, y)) continue;
      if (at(x, y) === ':' || at(x, y) === '5') continue;
      if (mounds.some(([mx, my]) => Math.abs(mx - x) < 2 && Math.abs(my - y) < 2)) continue;
      const h = hash2(x + 3, y + 5);
      if (h % 31 === 7) {
        props.push({ sprite: 'edge_desert_cactus', x, y, solid: rockSolid('edge_desert_cactus') });
        cactusCount++;
      }
    }

  /* ---------------- a couple of edge_rock_a/b landmarks ---------------- */
  const rockLandmarks: Array<[number, number, string]> = [[6, 6, 'edge_rock_a'], [37, 12, 'edge_rock_b']];
  for (const [x, y, key] of rockLandmarks) props.push({ sprite: key, x, y, solid: rockSolid(key) });

  /* ---------------- THE GROTTO mouth ring (rocks flank the 2-wide door; sign beside it) ---------------- */
  props.push({ sprite: 'edge_rock_a', x: 8, y: 1, solid: rockSolid('edge_rock_a') });
  props.push({ sprite: 'edge_rock_b', x: 14, y: 1, solid: rockSolid('edge_rock_b') });
  props.push({ sprite: 'edge_desert_rock', x: 9, y: 3, solid: rockSolid('edge_desert_rock') });
  props.push({ sprite: 'edge_desert_rock', x: 13, y: 3, solid: rockSolid('edge_desert_rock') });
  props.push({ sprite: 'sign', x: 15, y: 2, solid: SIGN_SOLID });
  signs.push({ x: 15, y: 2, dialogue: 'sign_grotto' });

  /* ---------------- sign mid-road ---------------- */
  props.push({ sprite: 'sign', x: 20, y: 17.4, solid: SIGN_SOLID });
  signs.push({ x: 20, y: 17.4, dialogue: 'sign_jungle2' });

  /* ---------------- REST + CACHE: picnic + gift_emerald pair (flags copied exactly) ---------------- */
  props.push({ sprite: 'picnic', x: 35, y: 22.5, solid: PICNIC_SOLID });
  props.push({ sprite: 'gift_box', x: 37, y: 22.5, solid: GIFT_SOLID, unlessFlag: 'gift_emerald' });
  props.push({ sprite: 'gift_box_open', x: 37, y: 22.5, solid: GIFT_SOLID, ifFlag: 'gift_emerald' });
  signs.push({ x: 37, y: 23.5, dialogue: 'gift_emerald', unlessFlag: 'gift_emerald' } as unknown as { x: number; y: number; dialogue: string });
  signs.push({ x: 37, y: 23.5, dialogue: 'gift_emerald_done', ifFlag: 'gift_emerald' } as unknown as { x: number; y: number; dialogue: string });

  /* ---------------- bridge rails ---------------- */
  props.push({ sprite: 'footbridge_rail', x: 40.5, y: 17.6 });
  props.push({ sprite: 'footbridge_rail', x: 42.5, y: 17.6 });
  props.push({ sprite: 'footbridge_rail', x: 40.5, y: 21.7 });
  props.push({ sprite: 'footbridge_rail', x: 42.5, y: 21.7 });

  /* ---------------- foam rim (LAST) ---------------- */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== 'e') continue;
      const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((c) => c !== 'e' && c !== 'E');
      if (edge) set(x, y, 'E');
    }

  const doors = [
    // west mouth → jungle_1 (placeholder — jungle_1 is ALSO being rebuilt now)
    { x: 0, y: 18, w: 1, h: 4, to: 'jungle_1', tx: 440, ty: 120, facing: 'left' },
    // the production grotto now opens into its four-tile south mouth. Land one
    // row inside it, centered and clear of the entry rotunda's set dressing.
    { x: GROTTO_DOOR.x, y: GROTTO_DOOR.y, w: GROTTO_DOOR.w, h: GROTTO_DOOR.h, to: 'grotto', tx: 224, ty: 296, facing: 'up' },
    // east mouth, past the bridge → Valle Dorado (placeholder — Valle is ALSO being rebuilt now)
    { x: 45, y: 18, w: 1, h: 4, to: 'valle_dorado', tx: 616, ty: 312, facing: 'left' },
  ];
  const spawners = [
    { enemies: ['cursed_souvenir', 'jungle_jitterbug'], count: 3, rect: { x: 2, y: 8, w: 12, h: 7 } },
    { enemies: ['gilded_beetle', 'banana_bunch'], count: 3, rect: { x: 17, y: 1, w: 14, h: 4 } },
    { enemies: ['jungle_jitterbug'], count: 1, rect: { x: 33, y: 16, w: 6, h: 2 } },
  ];

  validateMap({ id: 'jungle_2', W, H, grid: g, at, props, doors, spawners, signs, phones, atms: [] });

  const doc = {
    id: 'jungle_2',
    name: 'DEEP DUNAS',
    w: W,
    h: H,
    music: 'dunas',
    ambience: 'wind',
    grid: g.map((r) => r.join('')),
    props,
    npcs,
    signs,
    phones,
    atms: [],
    doors,
    spawners,
    triggers: [],
    patrols: [],
    reflect: [{ x: 40, y: 0, w: 4, h: H, within: 3 }],
  };
  writeFileSync('tools/mapeditor/jungle_2.json', JSON.stringify(doc));
  console.log(`\n=== jungle_2.json written: ${W}x${H}, ${props.length} props, ${signs.length} signs, ${doors.length} doors, ${spawners.length} spawners ===`);
  for (let y = 0; y < H; y++) console.log(String(y).padStart(3) + ' ' + g[y].join(''));
  const { w: _w, h: _h, ...runtimeMap } = doc;
  return runtimeMap as unknown as MapDef;
}

const dunasWestMap = buildMap1();
const dunasEastMap = buildMap2();
const source = `/**
 * LAS DUNAS — the Chapter-2 crossing rebuilt to Dusty Dunes grammar.
 *
 * Generated from tools/mapeditor/author-dunas.ts into jungle_1.json and
 * jungle_2.json. Keep those editor documents and this runtime export aligned;
 * dynamic reciprocal landings remain in maps_ch2.ts.
 */
import type { MapDef } from '../schemas';

export const dunasWestMap: MapDef = ${JSON.stringify(dunasWestMap, null, 2)};

export const dunasEastMap: MapDef = ${JSON.stringify(dunasEastMap, null, 2)};
`;
writeFileSync('src/data/maps_dunas.ts', source);
