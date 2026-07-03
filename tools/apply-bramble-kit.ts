/**
 * tools/apply-bramble-kit.ts — install the WORLD-OVERHAUL BRAMBLE-WALL autotile
 * (16-mask) into the live authored tile strip, SURGICALLY (never re-pack; every
 * untouched column preserved byte-for-byte, per the tile-strip law). Sibling of
 * tools/apply-hedge-kit.ts.
 *
 * Source: one ChatGPT 4×4 magenta-gridded sheet of bramble connectivity pieces:
 *   assets/art/masters/world/bramble-wall-source.png
 *
 * What it does:
 *   1. Slices the 4×4 grid (magenta gridline scan), area-average downscales each
 *      cell to 64×64 with magenta → transparent.
 *   2. Composes the 16 mask tiles the mask-correct way (like the path pipeline):
 *        base   = the dense INTERIOR cell (over grass, so gaps read as ground)
 *        rim    = the round POST cell, filled to opaque — a lit thorny rim on every edge
 *        bramble_<mask> = base with the rim composited onto each OPEN edge (bit CLEAR).
 *        bramble_0 (isolated) = the round post over grass (a lone thorny clump).
 *      bits: 1=N 2=E 4=S 8=W (a SET bit = neighbour is bramble = no rim there).
 *   3. Grows the strip to TILESET.length×64 and writes each bramble_<mask> column at
 *      its imported TILESET index (never hardcoded).
 *   A .pre-bramble.bak.png of the strip is written beside it first.
 *   Also dumps output/bramble_proof.png — a little maze assembled from the 16 tiles.
 *
 *   npx tsx tools/apply-bramble-kit.ts
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const SRC = `${ROOT}assets/art/masters/world/bramble-wall-source.png`;
const PROOF = `${ROOT}output/bramble_proof.png`;
const CELL = 64;

const read = (p: string): Img => decodePng(fs.readFileSync(p));
const isMag = (d: Uint8Array, i: number): boolean => d[i] > 180 && d[i + 2] > 180 && d[i + 1] < 130;

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
    magenta.push(m / Math.ceil(M / 4) > 0.8);
  }
  const out: Array<[number, number]> = [];
  let s = -1;
  for (let a = 0; a < N; a++) {
    if (!magenta[a]) { if (s < 0) s = a; }
    else if (s >= 0) { if (a - s > 60) out.push([s, a - 1]); s = -1; }
  }
  if (s >= 0 && N - s > 60) out.push([s, N - 1]);
  return out;
}

/** downscale a cell rect to CELL×CELL; magenta → transparent (alpha = non-mag share) */
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

/** alpha-composite fg over an OPAQUE base (both CELL×CELL RGBA); result opaque */
function over(base: Uint8Array, fg: Uint8Array): Uint8Array {
  const out = new Uint8Array(base);
  for (let i = 0; i < out.length; i += 4) {
    const a = fg[i + 3] / 255;
    out[i] = Math.round(fg[i] * a + base[i] * (1 - a));
    out[i + 1] = Math.round(fg[i + 1] * a + base[i + 1] * (1 - a));
    out[i + 2] = Math.round(fg[i + 2] * a + base[i + 2] * (1 - a));
    out[i + 3] = 255;
  }
  return out;
}

const rot = (c: Uint8Array, quarter: number): Uint8Array => {
  let cur = c;
  for (let q = 0; q < quarter; q++) {
    const n = new Uint8Array(CELL * CELL * 4);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const s = (y * CELL + x) * 4, d = (x * CELL + (CELL - 1 - y)) * 4; // 90° cw
      n[d] = cur[s]; n[d + 1] = cur[s + 1]; n[d + 2] = cur[s + 2]; n[d + 3] = cur[s + 3];
    }
    cur = n;
  }
  return cur;
};
const flipV = (c: Uint8Array): Uint8Array => {
  const n = new Uint8Array(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = ((CELL - 1 - y) * CELL + x) * 4;
    n[d] = c[s]; n[d + 1] = c[s + 1]; n[d + 2] = c[s + 2]; n[d + 3] = c[s + 3];
  }
  return n;
};

/** overlay the rim source's thorny rim onto base's edge on the given side (opaque in/out) */
function rimEdge(base: Uint8Array, rimN: Uint8Array, side: 'N' | 'E' | 'S' | 'W'): Uint8Array {
  const f = side === 'N' ? rimN : side === 'S' ? flipV(rimN) : side === 'E' ? rot(rimN, 1) : rot(rimN, 3);
  const out = new Uint8Array(base);
  const BAND = Math.floor(CELL * 0.42);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const depth = side === 'N' ? y : side === 'S' ? CELL - 1 - y : side === 'E' ? CELL - 1 - x : x;
    if (depth >= BAND) continue;
    const i = (y * CELL + x) * 4;
    const t = depth < BAND * 0.62 ? 1 : 1 - (depth - BAND * 0.62) / (BAND * 0.38);
    out[i] = Math.round(f[i] * t + base[i] * (1 - t));
    out[i + 1] = Math.round(f[i + 1] * t + base[i + 1] * (1 - t));
    out[i + 2] = Math.round(f[i + 2] * t + base[i + 2] * (1 - t));
    out[i + 3] = 255;
  }
  return out;
}

const solidFill = (rgb: [number, number, number]): Uint8Array => {
  const c = new Uint8Array(CELL * CELL * 4);
  for (let i = 0; i < c.length; i += 4) { c[i] = rgb[0]; c[i + 1] = rgb[1]; c[i + 2] = rgb[2]; c[i + 3] = 255; }
  return c;
};
/** mean opaque colour of a cell (its dominant bramble green) */
function meanColor(cell: Uint8Array): [number, number, number] {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < cell.length; i += 4) if (cell[i + 3] > 200) { r += cell[i]; g += cell[i + 1]; b += cell[i + 2]; n++; }
  n = Math.max(1, n);
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

// ---- slice the source
const src = read(SRC);
const xs = spans(src, 'x'), ys = spans(src, 'y');
if (xs.length !== 4 || ys.length !== 4) throw new Error(`bramble source grid ${xs.length}×${ys.length}, want 4×4`);
const cells: Uint8Array[] = [];
for (const ry of ys) for (const rx of xs) cells.push(scaleCellAlpha(src, rx, ry));

// ---- the live strip + the grass_a base cell (so bramble gaps read as ground)
const strip = read(STRIP);
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != 64`);
const idxOf = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`tile not in TILESET: ${name}`);
  return i;
};
function stripCell(name: string): Uint8Array {
  const x0 = idxOf(name) * CELL, out = new Uint8Array(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * strip.w + x0 + x) * 4, d = (y * CELL + x) * 4;
    out[d] = strip.data[s]; out[d + 1] = strip.data[s + 1]; out[d + 2] = strip.data[s + 2]; out[d + 3] = 255;
  }
  return out;
}
const grass = stripCell('grass_a');

// ---- compose the 16 masks. INTERIOR = the densest cell (cell 15); POST = cell 0.
const INTERIOR = 15, POST = 0;
const brambleGreen = meanColor(cells[INTERIOR]);
const base = over(grass, cells[INTERIOR]); // opaque dense bramble, gaps → grass
const rimSrc = over(solidFill(brambleGreen), cells[POST]); // lit thorny rim on all edges, opaque
const post = over(grass, cells[POST]); // a lone thorny clump (grass in the corners)

const tiles: Uint8Array[] = [];
for (let m = 0; m < 16; m++) {
  if (m === 0) { tiles.push(post); continue; }
  let t: Uint8Array = new Uint8Array(base);
  if (!(m & 1)) t = rimEdge(t, rimSrc, 'N');
  if (!(m & 2)) t = rimEdge(t, rimSrc, 'E');
  if (!(m & 4)) t = rimEdge(t, rimSrc, 'S');
  if (!(m & 8)) t = rimEdge(t, rimSrc, 'W');
  tiles.push(t);
}

// ---- grow + write (BAK first)
const BAK = STRIP.replace(/\.png$/, '.pre-bramble.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);
const grown = makeImg(Math.max(TILESET.length * CELL, strip.w), CELL);
for (let y = 0; y < CELL; y++) grown.data.set(strip.data.subarray(y * strip.w * 4, (y + 1) * strip.w * 4), y * grown.w * 4);
for (let m = 0; m < 16; m++) {
  const x0 = idxOf(`bramble_${m}`) * CELL, cell = tiles[m];
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = (y * grown.w + x0 + x) * 4;
    grown.data[d] = cell[s]; grown.data[d + 1] = cell[s + 1]; grown.data[d + 2] = cell[s + 2]; grown.data[d + 3] = 255;
  }
  console.log(`  bramble_${m} <- column ${idxOf(`bramble_${m}`)}`);
}
fs.writeFileSync(STRIP, encodePng(grown));
console.log(`strip written: ${grown.w / CELL} columns (TILESET.length=${TILESET.length})`);

// ---- PROOF: assemble a little bramble maze from the composed tiles (same mask rule
// as OverworldScene.buildTiles) over a grass field, to show the autotiling.
const MAZE = [
  '..............',
  '.VVVVV..VVVV..',
  '.V...V..V..V..',
  '.V.V.V..V..V..',
  '.V.V.VVVV..V..',
  '.V.V.......V..',
  '.V.VVVVVVVVV..',
  '.V...........',
  '.VVVVVV.VVVVV.',
  '..............',
];
const MH = MAZE.length, MW = MAZE[0].length;
const proof = makeImg(MW * CELL, MH * CELL);
for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
  const isV = (x: number, y: number): boolean => y >= 0 && y < MH && x >= 0 && x < MW && MAZE[y][x] === 'V';
  const cell = MAZE[ty][tx] === 'V'
    ? tiles[(isV(tx, ty - 1) ? 1 : 0) | (isV(tx + 1, ty) ? 2 : 0) | (isV(tx, ty + 1) ? 4 : 0) | (isV(tx - 1, ty) ? 8 : 0)]
    : grass;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = ((ty * CELL + y) * proof.w + tx * CELL + x) * 4;
    proof.data[d] = cell[s]; proof.data[d + 1] = cell[s + 1]; proof.data[d + 2] = cell[s + 2]; proof.data[d + 3] = 255;
  }
}
fs.writeFileSync(PROOF, encodePng(proof));
console.log(`proof maze written: ${PROOF} (${proof.w}×${proof.h})`);
