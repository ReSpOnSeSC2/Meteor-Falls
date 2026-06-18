/**
 * Slice an imagegen overworld-enemy sprite into a runtime `mini_*` PNG:
 * trim the transparent margins, then area-average downscale (premultiplied alpha,
 * so edges stay clean) to a target longest-side size. Authored-art pipeline
 * (ADR-109) — source lives in assets/art/masters/generated/, runtime in
 * assets/art/enemies/.
 *
 *   node tools/slice-enemy-mini.js <src.png> <outKey> [targetPx=96]
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , srcPath, outKey, targetArg] = process.argv;
if (!srcPath || !outKey) {
  console.error('usage: node tools/slice-enemy-mini.js <src.png> <outKey> [targetPx]');
  process.exit(1);
}
const TARGET = Number(targetArg) || 96;

const src = PNG.sync.read(fs.readFileSync(srcPath));
const { width: W, height: H, data } = src;

// 0) BACKGROUND REMOVAL. imagegen "transparent" sprites often DOWNLOAD flattened
// onto a near-white matte (ChatGPT's Download does this). Flood-fill from the
// borders, clearing every pixel within tolerance of the corner color that is
// reachable from the edge. Interior light pixels ringed by darker body (wings,
// eyes) survive because the flood can't reach them past the opaque silhouette.
const bgR = data[0], bgG = data[1], bgB = data[2];
const TOL = 38;
const isBg = (i) => Math.abs(data[i] - bgR) < TOL && Math.abs(data[i + 1] - bgG) < TOL && Math.abs(data[i + 2] - bgB) < TOL;
const seen = new Uint8Array(W * H);
const stack = [];
const visit = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (seen[p]) return;
  seen[p] = 1;
  if (isBg(p * 4)) {
    data[p * 4 + 3] = 0; // clear alpha — this is background
    stack.push(p);
  }
};
for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
while (stack.length) {
  const p = stack.pop();
  const x = p % W, y = (p / W) | 0;
  visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1);
}

// 1) bounding box of the opaque-ish content
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 16) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const bw = maxX - minX + 1;
const bh = maxY - minY + 1;

// 2) area-average downscale to TARGET on the longest side, premultiplied alpha
const scale = TARGET / Math.max(bw, bh);
const ow = Math.max(1, Math.round(bw * scale));
const oh = Math.max(1, Math.round(bh * scale));
const out = new PNG({ width: ow, height: oh });
for (let oy = 0; oy < oh; oy++) {
  for (let ox = 0; ox < ow; ox++) {
    const sx0 = minX + Math.floor(ox / scale);
    const sx1 = Math.min(maxX, minX + Math.floor((ox + 1) / scale));
    const sy0 = minY + Math.floor(oy / scale);
    const sy1 = Math.min(maxY, minY + Math.floor((oy + 1) / scale));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy <= sy1; sy++) {
      for (let sx = sx0; sx <= sx1; sx++) {
        const i = (sy * W + sx) * 4;
        const al = data[i + 3];
        r += data[i] * al;
        g += data[i + 1] * al;
        b += data[i + 2] * al;
        a += al;
        n++;
      }
    }
    const oi = (oy * ow + ox) * 4;
    if (a > 0) {
      out.data[oi] = Math.round(r / a);
      out.data[oi + 1] = Math.round(g / a);
      out.data[oi + 2] = Math.round(b / a);
      out.data[oi + 3] = Math.round(a / Math.max(1, n));
    }
  }
}
fs.writeFileSync(`assets/art/enemies/${outKey}.png`, PNG.sync.write(out));
console.log(`wrote assets/art/enemies/${outKey}.png  ${ow}x${oh}  (content ${bw}x${bh} of ${W}x${H})`);
