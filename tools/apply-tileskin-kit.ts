/**
 * tools/apply-tileskin-kit.ts — install the Otterbrooke INTERIOR TILE SKINS into the live
 * authored tile strip, SURGICALLY (never re-pack; every untouched column byte-preserved).
 * Clone of tools/apply-cliff-kit.ts, adapted for a 1×8 magenta-gridded strip of OPAQUE
 * floor/wall fills.
 *
 * Source: one ChatGPT 1×8 magenta-gridded sheet
 *   assets/art/masters/world/otterbrook-tileskins-source.png
 *   cells left→right: pharmacy_floor, pharmacy_wall, civic_floor, civic_wall,
 *                     kitchen_floor, kitchen_wall, concrete_floor, concrete_wall
 *
 * Slices the 8 cells (magenta gridline scan), area-average downscales each to 64×64 OPAQUE
 * (magenta excluded from the colour average, alpha forced 255 — interior fills are solid),
 * grows the strip to TILESET.length×64, and writes each cell at its imported TILESET index.
 * A .pre-tileskins.bak.png of the strip is written first. Dumps output/tileskins_proof.png.
 *
 *   npx tsx tools/apply-tileskin-kit.ts
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const SRC = `${ROOT}assets/art/masters/world/otterbrook-tileskins-source.png`;
const PROOF = `${ROOT}output/tileskins_proof.png`;
const CELL = 64;
const INSET = 6; // px trimmed off each cell edge to skip gutter-transition pixels

const NAMES = [
  'tile_pharmacy_floor', 'tile_pharmacy_wall', 'tile_civic_floor', 'tile_civic_wall',
  'tile_kitchen_floor', 'tile_kitchen_wall', 'tile_concrete_floor', 'tile_concrete_wall',
];

const read = (p: string): Img => decodePng(fs.readFileSync(p));
const isMag = (d: Uint8Array, i: number): boolean => d[i] > 180 && d[i + 2] > 180 && d[i + 1] < 130;

/** runs of NON-magenta columns/rows wider than 60px are cells (the ~270px skin cells clear
 *  it; the magenta gutters/borders break the runs). */
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

/** area-average downscale a cell rect to CELL×CELL, OPAQUE (magenta excluded, alpha 255). */
function scaleCellOpaque(img: Img, rx: [number, number], ry: [number, number]): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const x0i = rx[0] + INSET, x1i = rx[1] - INSET, y0i = ry[0] + INSET, y1i = ry[1] - INSET;
  const w = x1i - x0i + 1, h = y1i - y0i + 1;
  let fr = 0, fg = 0, fb = 0, fn = 0;
  for (let y = y0i; y <= y1i; y += 8) for (let x = x0i; x <= x1i; x += 8) {
    const i = (y * img.w + x) * 4;
    if (isMag(img.data, i)) continue;
    fr += img.data[i]; fg += img.data[i + 1]; fb += img.data[i + 2]; fn++;
  }
  fn = Math.max(1, fn);
  const fallback = [Math.round(fr / fn), Math.round(fg / fn), Math.round(fb / fn)];
  for (let oy = 0; oy < CELL; oy++) {
    for (let ox = 0; ox < CELL; ox++) {
      const sx0 = x0i + Math.floor((ox * w) / CELL), sx1 = x0i + Math.ceil(((ox + 1) * w) / CELL);
      const sy0 = y0i + Math.floor((oy * h) / CELL), sy1 = y0i + Math.ceil(((oy + 1) * h) / CELL);
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) {
        const i = (y * img.w + x) * 4;
        if (isMag(img.data, i)) continue;
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
      }
      const o = (oy * CELL + ox) * 4;
      if (n) { out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n); }
      else { out[o] = fallback[0]; out[o + 1] = fallback[1]; out[o + 2] = fallback[2]; }
      out[o + 3] = 255;
    }
  }
  return out;
}

// ---- slice the source into 8 cells, left→right (1 row × 8 cols)
const src = read(SRC);
const xs = spans(src, 'x'), ys = spans(src, 'y');
if (xs.length !== 8 || ys.length !== 1) throw new Error(`tileskin source grid ${xs.length}×${ys.length}, want 8×1`);
const ry = ys[0];
const cells: Uint8Array[] = xs.map((rx) => scaleCellOpaque(src, rx, ry));

// ---- the live strip
const strip = read(STRIP);
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != 64`);
const idxOf = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`tile not in TILESET: ${name}`);
  return i;
};

// ---- grow + write (BAK first)
const BAK = STRIP.replace(/\.png$/, '.pre-tileskins.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);
const grown = makeImg(Math.max(TILESET.length * CELL, strip.w), CELL);
for (let y = 0; y < CELL; y++) grown.data.set(strip.data.subarray(y * strip.w * 4, (y + 1) * strip.w * 4), y * grown.w * 4);
for (let c = 0; c < NAMES.length; c++) {
  const x0 = idxOf(NAMES[c]) * CELL, cell = cells[c];
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = (y * grown.w + x0 + x) * 4;
    grown.data[d] = cell[s]; grown.data[d + 1] = cell[s + 1]; grown.data[d + 2] = cell[s + 2]; grown.data[d + 3] = 255;
  }
  console.log(`  ${NAMES[c]} <- column ${idxOf(NAMES[c])}`);
}
fs.writeFileSync(STRIP, encodePng(grown));
console.log(`strip written: ${grown.w / CELL} columns (TILESET.length=${TILESET.length})`);

// ---- PROOF: the 8 tiles in a 4×2 grid
const proof = makeImg(4 * CELL, 2 * CELL);
for (let c = 0; c < cells.length; c++) {
  const px = (c % 4) * CELL, py = Math.floor(c / 4) * CELL, cell = cells[c];
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = ((py + y) * proof.w + px + x) * 4;
    proof.data[d] = cell[s]; proof.data[d + 1] = cell[s + 1]; proof.data[d + 2] = cell[s + 2]; proof.data[d + 3] = 255;
  }
}
fs.writeFileSync(PROOF, encodePng(proof));
console.log(`proof written: ${PROOF} (${proof.w}×${proof.h})`);
