/**
 * tools/apply-biome-kit.ts — GENERIC biome-tileset installer for the oblique overhaul.
 * Slices a magenta-gridded NxN sheet and OVERWRITES the named existing TILESET tiles in the
 * strip (row-major cell order; use "-" to skip a cell). Reusable for every per-biome kit.
 *
 *   npx tsx tools/apply-biome-kit.ts <src.png> <tileForCell0> <tileForCell1> ...
 *   e.g. npx tsx tools/apply-biome-kit.ts norway.png norway_ground norway_path norway_wall norway_water
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const SRC = process.argv[2];
const NAMES = process.argv.slice(3);
if (!SRC || NAMES.length === 0) throw new Error('usage: apply-biome-kit <src.png> <tile0> <tile1> ...');

const read = (p: string): Img => decodePng(fs.readFileSync(p));
const isMag = (d: Uint8Array, i: number): boolean => d[i] > 190 && d[i + 2] > 190 && d[i + 1] < 130;
function spans(img: Img, axis: 'x' | 'y'): Array<[number, number]> {
  const N = axis === 'x' ? img.w : img.h, M = axis === 'x' ? img.h : img.w;
  const mag: boolean[] = [];
  for (let a = 0; a < N; a++) { let m = 0; for (let b = 0; b < M; b += 4) { const x = axis === 'x' ? a : b, y = axis === 'x' ? b : a; if (isMag(img.data, (y * img.w + x) * 4)) m++; } mag.push(m / Math.ceil(M / 4) > 0.8); }
  const out: Array<[number, number]> = []; let s = -1;
  for (let a = 0; a < N; a++) { if (!mag[a] && s < 0) s = a; else if (mag[a] && s >= 0) { if (a - s > CELL) out.push([s, a]); s = -1; } }
  if (s >= 0 && N - s > CELL) out.push([s, N]);
  return out;
}
function cellTo64(img: Img, x0: number, x1: number, y0: number, y1: number): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4); const cw = x1 - x0, ch = y1 - y0, inset = Math.round(Math.min(cw, ch) * 0.04);
  for (let oy = 0; oy < CELL; oy++) for (let ox = 0; ox < CELL; ox++) {
    const sx0 = x0 + inset + Math.floor((ox / CELL) * (cw - 2 * inset)), sx1 = x0 + inset + Math.max(Math.floor(((ox + 1) / CELL) * (cw - 2 * inset)), Math.floor((ox / CELL) * (cw - 2 * inset)) + 1);
    const sy0 = y0 + inset + Math.floor((oy / CELL) * (ch - 2 * inset)), sy1 = y0 + inset + Math.max(Math.floor(((oy + 1) / CELL) * (ch - 2 * inset)), Math.floor((oy / CELL) * (ch - 2 * inset)) + 1);
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { const i = (y * img.w + x) * 4; if (isMag(img.data, i)) continue; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; }
    const o = (oy * CELL + ox) * 4; if (n > 0) { out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n); } out[o + 3] = 255;
  }
  return out;
}

const src = read(SRC);
const xs = spans(src, 'x'), ys = spans(src, 'y');
const cells: Uint8Array[] = [];
for (const [y0, y1] of ys) for (const [x0, x1] of xs) cells.push(cellTo64(src, x0, x1, y0, y1));
if (cells.length < NAMES.length) throw new Error(`sheet has ${cells.length} cells (${xs.length}x${ys.length}) < ${NAMES.length} names`);

const idxOf = (name: string): number => { const i = TILESET.findIndex((t) => t.name === name); if (i < 0) throw new Error(`tile ${name} not in TILESET`); return i; };
const strip = read(STRIP);
const BAK = STRIP.replace(/\.png$/, '.pre-biome.bak.png'); if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);
const grown = makeImg(Math.max(TILESET.length * CELL, strip.w), CELL);
for (let y = 0; y < CELL; y++) grown.data.set(strip.data.subarray(y * strip.w * 4, (y + 1) * strip.w * 4), y * grown.w * 4);
const writeCol = (idx: number, cell: Uint8Array): void => { const x0 = idx * CELL; for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const s = (y * CELL + x) * 4, d = (y * grown.w + x0 + x) * 4; grown.data[d] = cell[s]; grown.data[d + 1] = cell[s + 1]; grown.data[d + 2] = cell[s + 2]; grown.data[d + 3] = 255; } };
const done: string[] = [];
NAMES.forEach((name, i) => { if (name && name !== '-') { writeCol(idxOf(name), cells[i]); done.push(name); } });
fs.writeFileSync(STRIP, encodePng(grown));
console.log(`biome kit installed from ${xs.length}x${ys.length} sheet: overwrote ${done.join(', ')}`);
