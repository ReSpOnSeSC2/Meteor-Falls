/**
 * Segment a chroma-green strip of N character poses (side by side) into N
 * separate, normalized 96x128 frames. Same chroma key / despill / normalize as
 * slice-chroma-pose.js, but splits the image into figures by the green column
 * gaps between them first. Use for "two walk steps in one generation" strips.
 *
 *   node tools/slice-chroma-strip.js <src.png> <outPrefix> \
 *        [--h=108] [--foot=16] [--cw=96] [--ch=128] [--despill=1] [--expect=N]
 * Writes <outPrefix>_0.png, <outPrefix>_1.png, ... (left-to-right). Prints the
 * figure count; pass --expect=N to assert it (non-zero exit on mismatch).
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const argv = process.argv;
const opt = (n, d) => { const m = argv.find((a) => a.startsWith(`--${n}=`)); return m ? m.split('=')[1] : d; };
const [, , srcPath, outPrefix] = argv;
if (!srcPath || !outPrefix) {
  console.error('usage: node tools/slice-chroma-strip.js <src.png> <outPrefix> [--h=108] [--foot=16] [--expect=N]');
  process.exit(1);
}
const TARGET_H = Number(opt('h', 108));
const FOOT = Number(opt('foot', 16));
const CW = Number(opt('cw', 96));
const CH = Number(opt('ch', 128));
const DESPILL = opt('despill', '1') !== '0';
const EXPECT = opt('expect', null);

let buf = fs.readFileSync(srcPath);
const iend = buf.indexOf('IEND');
if (iend >= 0) buf = buf.subarray(0, iend + 8);
const src = PNG.sync.read(buf);
const { width: W, height: H, data } = src;

const isChroma = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return g > 70 && g > r * 1.25 && g > b * 1.25 && g - Math.max(r, b) > 28;
};
// flood-fill chroma from borders -> alpha 0 (interior survives)
const seen = new Uint8Array(W * H);
const stack = [];
const visit = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (seen[p]) return;
  seen[p] = 1;
  if (isChroma(p * 4)) { data[p * 4 + 3] = 0; stack.push(p); }
};
for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
while (stack.length) { const p = stack.pop(); const x = p % W, y = (p / W) | 0; visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1); }
if (DESPILL) {
  for (let p = 0; p < W * H; p++) {
    const i = p * 4; if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const cap = Math.round((r + b) / 2); if (g > cap) data[i + 1] = Math.min(g, cap + 10);
  }
}

// column occupancy (>=3 opaque px) -> split into figure runs by gaps
const colCount = new Int32Array(W);
for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y++) if (data[(y * W + x) * 4 + 3] > 40) n++; colCount[x] = n; }
const MINGAP = 10;       // empty columns that separate two figures
const MINFIGW = 30;      // ignore slivers narrower than this
const runs = [];
let start = -1, gap = 0;
for (let x = 0; x < W; x++) {
  if (colCount[x] > 0) { if (start < 0) start = x; gap = 0; }
  else if (start >= 0) { gap++; if (gap >= MINGAP) { if (x - gap - start >= MINFIGW) runs.push([start, x - gap]); start = -1; } }
}
if (start >= 0 && W - start >= MINFIGW) runs.push([start, W - 1]);

if (EXPECT != null && runs.length !== Number(EXPECT)) {
  console.error(`figure count ${runs.length} != expected ${EXPECT} (runs: ${JSON.stringify(runs)})`);
  process.exit(3);
}

runs.forEach(([cx0, cx1], idx) => {
  // figure bbox within its column span
  let minX = cx1, minY = H, maxX = cx0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = cx0; x <= cx1; x++) {
    if (data[(y * W + x) * 4 + 3] > 24) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  let scale = TARGET_H / bh;
  if (bw * scale > CW) scale = CW / bw;
  const ow = Math.max(1, Math.round(bw * scale)), oh = Math.max(1, Math.round(bh * scale));
  const out = new PNG({ width: CW, height: CH });
  const offX = Math.round((CW - ow) / 2), offY = CH - FOOT - oh;
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    const sx0 = minX + Math.floor(ox / scale), sx1 = Math.min(maxX, minX + Math.floor((ox + 1) / scale));
    const sy0 = minY + Math.floor(oy / scale), sy1 = Math.min(maxY, minY + Math.floor((oy + 1) / scale));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) { const i = (sy * W + sx) * 4; const al = data[i + 3]; r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al; n++; }
    const dx = offX + ox, dy = offY + oy; if (dx < 0 || dy < 0 || dx >= CW || dy >= CH) continue;
    const oi = (dy * CW + dx) * 4;
    if (a > 0) { out.data[oi] = Math.round(r / a); out.data[oi + 1] = Math.round(g / a); out.data[oi + 2] = Math.round(b / a); out.data[oi + 3] = Math.round(a / Math.max(1, n)); }
  }
  fs.writeFileSync(`${outPrefix}_${idx}.png`, PNG.sync.write(out));
});
console.log(`segmented ${runs.length} figures -> ${outPrefix}_[0..${runs.length - 1}].png  runs=${JSON.stringify(runs)}`);
