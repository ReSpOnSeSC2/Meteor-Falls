/**
 * tools/apply-eb-tile-kit.ts — install the EB GROUND KIT (2026-07-02 baseline
 * overhaul) into the live authored tile strip, SURGICALLY (never re-pack; every
 * untouched column preserved byte-for-byte, per the tile-strip law).
 *
 * Sources: two ChatGPT 4×4 magenta-gridded sheets in assets/art/masters/world/
 *   eb-ground-kit-a-source.png  (ground: asphalt/sidewalk/curbs/grass/dirt/wear)
 *   eb-ground-kit-b-source.png  (terrain: cliffs/stairs/scorch/meadow/fairway)
 *
 * What it does:
 *   1. Detects the 16 cell rects per sheet (magenta gridline scan), area-average
 *      downscales each to 64×64.
 *   2. Writes cells into otterbrook_tiles_16.png at each tile's TILESET index
 *      (imported — indices never hardcoded).
 *   3. Bakes the 32 path_<v>_<mask> columns: dirt base (v0=A12, v1=B10) + the
 *      A13 grass fringe composited on each masked edge (mask bits: 1=N 2=E 4=S 8=W,
 *      matching OverworldScene.buildTiles).
 *   4. Grows the strip to TILESET.length×64 (the authored_assets pin) so the new
 *      tail tiles (cliff_face / cliff_lip / stairs) get their columns.
 *   5. sidewalk_crack = the new sidewalk cell with a darkened hairline meander
 *      (a tint of authored pixels, not generated art).
 * A .pre-eb-kit.bak.png of the strip is written beside it first.
 *
 *   npx tsx tools/apply-eb-tile-kit.ts
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET, PATH_VARIANTS } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const SHEET_A = `${ROOT}assets/art/masters/world/eb-ground-kit-a-source.png`;
const SHEET_B = `${ROOT}assets/art/masters/world/eb-ground-kit-b-source.png`;
const CELL = 64;

const read = (p: string): Img => decodePng(fs.readFileSync(p));
const isMag = (d: Uint8Array, i: number): boolean => d[i] > 190 && d[i + 2] > 190 && d[i + 1] < 130;

/** find the 4 cell spans on one axis by scanning magenta gridline coverage */
function spans(img: Img, axis: 'x' | 'y'): Array<[number, number]> {
  const N = axis === 'x' ? img.w : img.h;
  const M = axis === 'x' ? img.h : img.w;
  const magenta: boolean[] = [];
  for (let a = 0; a < N; a++) {
    let m = 0;
    for (let b = 0; b < M; b += 4) {
      const x = axis === 'x' ? a : b;
      const y = axis === 'x' ? b : a;
      if (isMag(img.data, (y * img.w + x) * 4)) m++;
    }
    magenta.push(m / Math.ceil(M / 4) > 0.85);
  }
  const out: Array<[number, number]> = [];
  let s = -1;
  for (let a = 0; a < N; a++) {
    if (!magenta[a]) { if (s < 0) s = a; }
    else if (s >= 0) { if (a - s > 40) out.push([s, a - 1]); s = -1; }
  }
  if (s >= 0 && N - s > 40) out.push([s, N - 1]);
  return out;
}

/** area-average downscale a cell rect to CELL×CELL RGBA */
function scaleCell(img: Img, rx: [number, number], ry: [number, number]): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const w = rx[1] - rx[0] + 1, h = ry[1] - ry[0] + 1;
  for (let oy = 0; oy < CELL; oy++) {
    for (let ox = 0; ox < CELL; ox++) {
      const x0 = rx[0] + Math.floor((ox * w) / CELL), x1 = rx[0] + Math.ceil(((ox + 1) * w) / CELL);
      const y0 = ry[0] + Math.floor((oy * h) / CELL), y1 = ry[0] + Math.ceil(((oy + 1) * h) / CELL);
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * img.w + x) * 4;
        if (isMag(img.data, i)) continue; // never average gridline bleed
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
      }
      const o = (oy * CELL + ox) * 4;
      if (n) { out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; }
      out[o + 3] = 255;
    }
  }
  return out;
}

function cells(path: string): Uint8Array[] {
  const img = read(path);
  const xs = spans(img, 'x'), ys = spans(img, 'y');
  if (xs.length !== 4 || ys.length !== 4) throw new Error(`${path}: grid ${xs.length}x${ys.length}, want 4x4`);
  const out: Uint8Array[] = [];
  for (const ry of ys) for (const rx of xs) out.push(scaleCell(img, rx, ry));
  return out;
}

/** like scaleCell, but magenta becomes TRANSPARENT (alpha = share of
 *  non-magenta source samples) — for foreground cells meant to composite */
function scaleCellAlpha(img: Img, rx: [number, number], ry: [number, number]): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const w = rx[1] - rx[0] + 1, h = ry[1] - ry[0] + 1;
  for (let oy = 0; oy < CELL; oy++) {
    for (let ox = 0; ox < CELL; ox++) {
      const x0 = rx[0] + Math.floor((ox * w) / CELL), x1 = rx[0] + Math.ceil(((ox + 1) * w) / CELL);
      const y0 = ry[0] + Math.floor((oy * h) / CELL), y1 = ry[0] + Math.ceil(((oy + 1) * h) / CELL);
      let r = 0, g = 0, b = 0, n = 0, tot = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * img.w + x) * 4;
        tot++;
        if (isMag(img.data, i)) continue;
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
      }
      const o = (oy * CELL + ox) * 4;
      if (n) { out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; }
      out[o + 3] = tot ? Math.round((n / tot) * 255) : 0;
    }
  }
  return out;
}

function cellsAlpha(path: string): Uint8Array[] {
  const img = read(path);
  const xs = spans(img, 'x'), ys = spans(img, 'y');
  if (xs.length !== 4 || ys.length !== 4) throw new Error(`${path}: grid ${xs.length}x${ys.length}, want 4x4`);
  const out: Uint8Array[] = [];
  for (const ry of ys) for (const rx of xs) out.push(scaleCellAlpha(img, rx, ry));
  return out;
}

/** alpha-composite fg over base (both CELL×CELL RGBA) */
function over(base: Uint8Array, fg: Uint8Array): Uint8Array {
  const out = new Uint8Array(base);
  for (let i = 0; i < out.length; i += 4) {
    const a = fg[i + 3] / 255;
    out[i] = Math.round(fg[i] * a + base[i] * (1 - a));
    out[i + 1] = Math.round(fg[i + 1] * a + base[i + 1] * (1 - a));
    out[i + 2] = Math.round(fg[i + 2] * a + base[i + 2] * (1 - a));
  }
  return out;
}

const rot = (c: Uint8Array, quarter: number): Uint8Array => {
  let cur = c;
  for (let q = 0; q < quarter; q++) {
    const n = new Uint8Array(CELL * CELL * 4);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const s = (y * CELL + x) * 4, d = (x * CELL + (CELL - 1 - y)) * 4; // 90° cw
      n[d] = cur[s]; n[d + 1] = cur[s + 1]; n[d + 2] = cur[s + 2]; n[d + 3] = 255;
    }
    cur = n;
  }
  return cur;
};
const flipV = (c: Uint8Array): Uint8Array => {
  const n = new Uint8Array(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = ((CELL - 1 - y) * CELL + x) * 4;
    n[d] = c[s]; n[d + 1] = c[s + 1]; n[d + 2] = c[s + 2]; n[d + 3] = 255;
  }
  return n;
};

/** overlay the fringe cell's grass band onto base's edge on the given side */
function fringeEdge(base: Uint8Array, fringeN: Uint8Array, side: 'N' | 'E' | 'S' | 'W'): Uint8Array {
  const f = side === 'N' ? fringeN : side === 'S' ? flipV(fringeN) : side === 'E' ? rot(fringeN, 1) : rot(fringeN, 3);
  const out = new Uint8Array(base);
  const BAND = Math.floor(CELL * 0.45);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const depth = side === 'N' ? y : side === 'S' ? CELL - 1 - y : side === 'E' ? CELL - 1 - x : x;
    if (depth >= BAND) continue;
    const i = (y * CELL + x) * 4;
    // full fringe for the outer 60% of the band, then a quick fade into base
    const t = depth < BAND * 0.6 ? 1 : 1 - (depth - BAND * 0.6) / (BAND * 0.4);
    out[i] = f[i] * t + base[i] * (1 - t);
    out[i + 1] = f[i + 1] * t + base[i + 1] * (1 - t);
    out[i + 2] = f[i + 2] * t + base[i + 2] * (1 - t);
  }
  return out;
}

function crackOn(base: Uint8Array): Uint8Array {
  const out = new Uint8Array(base);
  let x = 8; // deterministic hand-coded meander, darkening authored pixels only
  for (let y = 10; y < 58; y++) {
    x += [0, 1, 0, -1, 1, 0, -1, 0][y % 8];
    for (const dx of [0, 1]) {
      const i = (y * CELL + Math.max(1, Math.min(62, x + dx + Math.floor((y - 10) / 3)))) * 4;
      out[i] = Math.round(out[i] * 0.62);
      out[i + 1] = Math.round(out[i + 1] * 0.62);
      out[i + 2] = Math.round(out[i + 2] * 0.62);
    }
  }
  return out;
}

// ---- load everything
const A = cells(SHEET_A);
const B = cells(SHEET_B);
const strip = read(STRIP);
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != 64`);
const BAK = STRIP.replace(/\.png$/, `.pre-eb-kit.bak.png`);
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK); // first run only — keep the true pre-kit strip

// grow to TILESET.length columns (the authored_assets pin) — new tail tiles included
const grown = makeImg(Math.max(TILESET.length * CELL, strip.w), CELL);
for (let y = 0; y < CELL; y++) {
  grown.data.set(strip.data.subarray(y * strip.w * 4, (y + 1) * strip.w * 4), y * grown.w * 4);
}

const idxOf = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`tile not in TILESET: ${name}`);
  return i;
};
const put = (name: string, cell: Uint8Array): void => {
  const x0 = idxOf(name) * CELL;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = (y * grown.w + x0 + x) * 4;
    grown.data[d] = cell[s]; grown.data[d + 1] = cell[s + 1]; grown.data[d + 2] = cell[s + 2]; grown.data[d + 3] = 255;
  }
  console.log(`  ${name} <- column ${idxOf(name)}`);
};

// ---- sheet A (row-major 0..15)
put('road', A[0]); put('road_dash', A[1]); put('crosswalk', A[2]); put('parking', A[3]);
put('sidewalk', A[4]); put('sidewalk_curb', A[5]); put('sidewalk_curb_e', A[6]); put('sidewalk_curb_w', A[7]);
put('grass_a', A[8]); put('grass_b', A[9]); put('grass_tuft', A[10]); put('plaza', A[11]);
/* A[12] dirt base, A[13] fringe — consumed by the path bake below */
put('storm_drain', A[14]); put('road_patch', A[15]);
put('sidewalk_crack', crackOn(A[4]));

// ---- sheet B
put('cliff_face', B[0]); /* B[1] cracked variant kept as master-only spare */
put('cliff_lip', B[2]); put('stairs', B[3]);
put('scorch', B[4]); put('scorch_ember', B[5]);
/* B[6] rubble, B[7] gravel, B[12] mud, B[14] pebble bed, B[15] paver: spares */
/* B[8] creek water, B[9] foam: deliberately NOT applied — sea tiles stay as shipped */
put('fairway', B[13]);

// ---- path masks: PATH_VARIANTS × 16, bits 1=N 2=E 4=S 8=W (buildTiles contract)
// v1 = the SAME clean dirt cell, darkened ~7% — sheet B's "dirt variation" cell has
// heavy diagonal striations that read as smeared strips when tiled (live-proven bad).
const darken = (c: Uint8Array, f: number): Uint8Array => {
  const o = new Uint8Array(c);
  for (let i = 0; i < o.length; i += 4) { o[i] *= f; o[i + 1] *= f; o[i + 2] *= f; }
  return o;
};
const bases = [A[12], darken(A[12], 0.93)];
for (let v = 0; v < PATH_VARIANTS; v++) {
  for (let mask = 0; mask < 16; mask++) {
    let cell: Uint8Array = new Uint8Array(bases[v]);
    if (mask & 1) cell = fringeEdge(cell, A[13], 'N');
    if (mask & 2) cell = fringeEdge(cell, A[13], 'E');
    if (mask & 4) cell = fringeEdge(cell, A[13], 'S');
    if (mask & 8) cell = fringeEdge(cell, A[13], 'W');
    put(`path_${v}_${mask}`, cell);
  }
}

// ---- SHEET C (2026-07-02 grounds fix, optional until authored): fences +
// flowers composited OVER the new grass base (kills the mismatched square
// backgrounds), bush masses as full-bleed seamless cells.
const SHEET_C = `${ROOT}assets/art/masters/world/eb-grounds-fix-source.png`;
if (fs.existsSync(SHEET_C)) {
  const C = cellsAlpha(SHEET_C);
  const grass = A[8]; // the live grass_a cell
  put('fence_h', over(grass, C[0]));
  put('fence_v', over(grass, C[1]));
  put('flowers_red', over(grass, C[2]));
  put('flowers_gold', over(grass, C[3]));
  put('bush', C[4]); // full-bleed cells carry ~255 alpha everywhere already
  put('root_wall', C[6]); // the Under-Oak's reskin wall (UNDEROAK_TILE_SKIN)
} else {
  console.log('  (sheet C not present — fence/flower/bush columns untouched)');
}

fs.writeFileSync(STRIP, encodePng(grown));
console.log(`strip written: ${grown.w / CELL} columns (TILESET.length=${TILESET.length})`);
