/**
 * tools/apply-cliff-kit.ts — install the WORLD-OVERHAUL P4 LAYERED CLIFF KIT into the
 * live authored tile strip, SURGICALLY (never re-pack; every untouched column preserved
 * byte-for-byte, per the tile-strip law). Clone of tools/apply-hedge-kit.ts.
 *
 * Source: one ChatGPT 2×2 magenta-gridded sheet of cliff-face bands:
 *   assets/art/masters/world/cliff-kit-source.png
 *     top-left  = cliff_top    (grassy overhang + rock, the band under the lip)
 *     top-right = cliff_mid_a   (rock strata, mid band variant A)
 *     bot-left  = cliff_base    (rock + scree + ground shadow, the band on the ground)
 *     bot-right = cliff_mid_b   (rock strata, mid band variant B)
 *
 * What it does:
 *   1. Slices the 2×2 grid (magenta gridline scan, same spans() as the hedge kit —
 *      the ~570px cells clear the >60px cell-width floor; the ~22px gutters separate).
 *   2. Area-average downscales each cell to 64×64. The bands are OPAQUE rock occluders,
 *      so (unlike the hedge autotile) magenta → forced OPAQUE, not transparent: magenta
 *      is EXCLUDED from the colour average (no pink bleed) and every output pixel is set
 *      alpha 255. A small inset skips the gutter transition pixels.
 *   3. Grows the strip to TILESET.length×64 and writes each band at its imported TILESET
 *      index (never hardcoded). A .pre-cliff.bak.png of the strip is written first.
 *   Also dumps output/cliff_proof.png — a 3-band cliff (top/mid/base) + the mid variant,
 *   the banding proof.
 *
 *   npx tsx tools/apply-cliff-kit.ts
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const SRC = `${ROOT}assets/art/masters/world/cliff-kit-source.png`;
const PROOF = `${ROOT}output/cliff_proof.png`;
const CELL = 64;
const INSET = 8; // px trimmed off each cell edge to skip gutter-transition pixels

const read = (p: string): Img => decodePng(fs.readFileSync(p));
const isMag = (d: Uint8Array, i: number): boolean => d[i] > 180 && d[i + 2] > 180 && d[i + 1] < 130;

/** the hedge kit's span detector: runs of NON-magenta columns/rows wider than 60px are
 *  cells (the ~570px cliff cells clear it; the magenta gutters/borders break the runs). */
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

/** area-average downscale a cell rect to CELL×CELL, OPAQUE (magenta excluded from the
 *  colour average so no pink bleed; alpha forced 255 — these bands are solid occluders). */
function scaleCellOpaque(img: Img, rx: [number, number], ry: [number, number]): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const x0i = rx[0] + INSET, x1i = rx[1] - INSET, y0i = ry[0] + INSET, y1i = ry[1] - INSET;
  const w = x1i - x0i + 1, h = y1i - y0i + 1;
  // a neutral rock grey for the (vanishingly rare) all-magenta output pixel
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
      out[o + 3] = 255; // opaque occluder
    }
  }
  return out;
}

// ---- slice the source into the 2×2 grid, row-major (top-left, top-right, bot-left, bot-right)
const src = read(SRC);
const xs = spans(src, 'x'), ys = spans(src, 'y');
if (xs.length !== 2 || ys.length !== 2) throw new Error(`cliff source grid ${xs.length}×${ys.length}, want 2×2`);
const cells: Uint8Array[] = [];
for (const ry of ys) for (const rx of xs) cells.push(scaleCellOpaque(src, rx, ry));
// row-major cell order → band names
const NAMES = ['cliff_top', 'cliff_mid_a', 'cliff_base', 'cliff_mid_b'];

// ---- the live strip
const strip = read(STRIP);
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != 64`);
const idxOf = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`tile not in TILESET: ${name}`);
  return i;
};

// ---- grow + write (BAK first)
const BAK = STRIP.replace(/\.png$/, '.pre-cliff.bak.png');
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

// ---- PROOF: a 3-band cliff (top/mid_a/base) stacked, plus mid_b beside it (banding proof)
const byName: Record<string, Uint8Array> = {};
NAMES.forEach((n, i) => (byName[n] = cells[i]));
const STACK = [['cliff_top', 'cliff_mid_b'], ['cliff_mid_a', 'cliff_mid_a'], ['cliff_base', 'cliff_base']];
const proof = makeImg(2 * CELL, STACK.length * CELL);
for (let ty = 0; ty < STACK.length; ty++) for (let tx = 0; tx < 2; tx++) {
  const cell = byName[STACK[ty][tx]];
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const s = (y * CELL + x) * 4, d = ((ty * CELL + y) * proof.w + tx * CELL + x) * 4;
    proof.data[d] = cell[s]; proof.data[d + 1] = cell[s + 1]; proof.data[d + 2] = cell[s + 2]; proof.data[d + 3] = 255;
  }
}
fs.writeFileSync(PROOF, encodePng(proof));
console.log(`proof written: ${PROOF} (${proof.w}×${proof.h})`);
