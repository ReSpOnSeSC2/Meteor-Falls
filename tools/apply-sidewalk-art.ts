/**
 * tools/apply-sidewalk-art.ts — take a ChatGPT magenta-bg strip of 4 sidewalk tiles
 * (plain · curb-S · curb-E · curb-W) and bake them into the otterbrook_tiles_16 atlas
 * cells (sidewalk=13, sidewalk_curb=27, sidewalk_curb_e=28, sidewalk_curb_w=29).
 *
 * Magenta key (spill = min(R,B)-G) locates the 4 figures by column gaps; each figure is
 * cropped to its content bbox and area-average-resized to a 64x64 OPAQUE tile cell.
 *
 *   npx tsx tools/apply-sidewalk-art.ts <src.png> [--order=13,27,28,29]
 */
import * as fs from 'fs';
import { decodePng, encodePng, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const src = process.argv[2];
if (!src) { console.error('usage: apply-sidewalk-art.ts <src.png> [--order=13,27,28,29]'); process.exit(1); }
const orderArg = process.argv.find((a) => a.startsWith('--order='));
const cells = orderArg ? orderArg.split('=')[1].split(',').map(Number)
  : ['sidewalk', 'sidewalk_curb', 'sidewalk_curb_e', 'sidewalk_curb_w'].map((n) => TILESET.findIndex((t) => t.name === n));

const img: Img = decodePng(fs.readFileSync(src));
const W = img.w, H = img.h, D = img.data;
// magenta test: strong magenta spill → background
const isBg = (i: number): boolean => { const r = D[i], g = D[i + 1], b = D[i + 2]; return Math.min(r, b) - g > 60; };
// column occupancy → figure runs
const col = new Int32Array(W);
for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y++) if (!isBg((y * W + x) * 4)) n++; col[x] = n; }
const runs: [number, number][] = []; let s = -1, gap = 0; const MINGAP = 10, MINW = 20;
for (let x = 0; x < W; x++) {
  if (col[x] > 3) { if (s < 0) s = x; gap = 0; }
  else if (s >= 0) { if (++gap >= MINGAP) { if (x - gap - s >= MINW) runs.push([s, x - gap]); s = -1; } }
}
if (s >= 0 && W - s >= MINW) runs.push([s, W]);
console.log(`found ${runs.length} figures; mapping to cells [${cells.join(',')}]`);

const strip: Img = decodePng(fs.readFileSync(STRIP));
const BAK = STRIP.replace(/\.png$/, '.pre-sidewalk-art.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

function writeCell(cell: number, tile: Uint8Array): void {
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const o = (y * CELL + x) * 4, d = (y * strip.w + cell * CELL + x) * 4;
    strip.data[d] = tile[o]; strip.data[d + 1] = tile[o + 1]; strip.data[d + 2] = tile[o + 2]; strip.data[d + 3] = 255;
  }
}
// content bbox within a column run, then area-average resize to 64x64 (opaque)
function extract(x0: number, x1: number): Uint8Array {
  let ty0 = H, ty1 = 0, tx0 = x1, tx1 = x0;
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) if (!isBg((y * W + x) * 4)) { if (y < ty0) ty0 = y; if (y > ty1) ty1 = y; if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; }
  const bw = tx1 - tx0 + 1, bh = ty1 - ty0 + 1;
  const out = new Uint8Array(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    // sample the source box (nearest source pixel; snap magenta pixels to a neutral cream)
    const sxp = tx0 + Math.min(bw - 1, Math.floor((x / CELL) * bw));
    const syp = ty0 + Math.min(bh - 1, Math.floor((y / CELL) * bh));
    const i = (syp * W + sxp) * 4, o = (y * CELL + x) * 4;
    if (isBg(i)) { out[o] = 224; out[o + 1] = 219; out[o + 2] = 197; }
    else { out[o] = D[i]; out[o + 1] = D[i + 1]; out[o + 2] = D[i + 2]; }
    out[o + 3] = 255;
  }
  return out;
}
runs.slice(0, cells.length).forEach(([a, b], k) => { writeCell(cells[k], extract(a, b)); console.log(`  cell ${cells[k]} <- figure ${k} (x ${a}..${b})`); });
fs.writeFileSync(STRIP, encodePng(strip));
console.log(`baked ${Math.min(runs.length, cells.length)} sidewalk tiles. backup: ${BAK.split(/[\\/]/).pop()}`);
