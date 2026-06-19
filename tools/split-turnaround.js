/**
 * Split a multi-view "turnaround" imagegen sheet (N character views in a row on a
 * solid MAGENTA screen) into N separate transparent PNGs, left-to-right.
 *
 * Segments by EMPTY VERTICAL GAPS: magenta-key to alpha, count opaque px per column,
 * then cut at runs of (near-)empty columns. Robust to detached limbs (unlike blob
 * labeling). Writes <outPrefix>_<name>.png for each expected view name, in order.
 *
 *   node tools/split-turnaround.js <src.png> <outPrefix> [name1,name2,...]
 *   e.g. node tools/split-turnaround.js .shots/borden_ow.png .shots/borden_ow down,downleft,left,upleft,up
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , srcPath, outPrefix, namesArg] = process.argv;
if (!srcPath || !outPrefix) { console.error('usage: node tools/split-turnaround.js <src.png> <outPrefix> [names csv]'); process.exit(1); }
const names = (namesArg || 'down,downleft,left,upleft,up').split(',');

const src = PNG.sync.read(fs.readFileSync(srcPath));
const { width: W, height: H, data } = src;

// magenta key + despill → alpha
const LOW = 28, HIGH = 130;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const spill = Math.min(r, b) - g;
  if (spill > 0) {
    data[i] = Math.max(0, r - spill); data[i + 2] = Math.max(0, b - spill);
    const a = Math.max(0, Math.min(255, Math.round(255 - ((spill - LOW) / (HIGH - LOW)) * 255)));
    data[i + 3] = Math.min(data[i + 3], a);
  }
}

// opaque px per column
const col = new Array(W).fill(0);
for (let x = 0; x < W; x++) { let c = 0; for (let y = 0; y < H; y++) if (data[(y * W + x) * 4 + 3] > 24) c++; col[x] = c; }
const MINCOL = 2; // a column with < this many opaque px counts as background

// content runs separated by empty gaps
const runs = [];
let start = -1;
for (let x = 0; x < W; x++) {
  const filled = col[x] >= MINCOL;
  if (filled && start < 0) start = x;
  else if (!filled && start >= 0) { runs.push([start, x - 1]); start = -1; }
}
if (start >= 0) runs.push([start, W - 1]);

// keep significant runs (width ≥ 12 and ≥ 3% of widest), then take the N widest, left-to-right
const widest = Math.max(...runs.map((r) => r[1] - r[0] + 1), 1);
let segs = runs.filter((r) => (r[1] - r[0] + 1) >= Math.max(12, widest * 0.12));
segs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
segs = segs.slice(0, names.length).sort((a, b) => a[0] - b[0]);

console.log(`segments found: ${segs.length}/${names.length}  x-ranges: ${segs.map((s) => s[0] + '-' + s[1]).join('  ')}`);
if (segs.length !== names.length) console.log('WARN: segment count != expected; check the source spacing.');

segs.forEach(([x0, x1], idx) => {
  // vertical crop within this column band
  let y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (data[(y * W + x) * 4 + 3] > 24) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = new PNG({ width: cw, height: ch });
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = ((y0 + y) * W + (x0 + x)) * 4, oi = (y * cw + x) * 4;
    out.data[oi] = data[si]; out.data[oi + 1] = data[si + 1]; out.data[oi + 2] = data[si + 2]; out.data[oi + 3] = data[si + 3];
  }
  const p = `${outPrefix}_${names[idx]}.png`;
  fs.writeFileSync(p, PNG.sync.write(out));
  console.log(`  wrote ${p}  ${cw}x${ch}`);
});
