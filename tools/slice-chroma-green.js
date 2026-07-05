/**
 * Chroma-key an imagegen building shot on a solid bright-GREEN screen (~2,251,4)
 * into a clean transparent runtime PNG. Green subjects (green roofs, awnings, the
 * BANK facade) must survive, so we key by DISTANCE to the sampled background color
 * — the chroma is an extreme point (R,B ~ 0, G ~ 251); real building greens sit far
 * from it in R/B. Edge-fringe pixels get the green spill removed and a graded alpha,
 * then we crop to content and area-average downscale (premultiplied) to a target.
 *
 *   node tools/slice-chroma-green.js <src.png> <outPath.png> [targetLongestPx=0]
 *   (targetLongestPx=0 keeps the cropped content size; else downscale to that.)
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , srcPath, outPath, targetArg] = process.argv;
if (!srcPath || !outPath) {
  console.error('usage: node tools/slice-chroma-green.js <src.png> <outPath.png> [targetPx]');
  process.exit(1);
}
const TARGET = Number(targetArg) || 0;

const src = PNG.sync.read(fs.readFileSync(srcPath));
const { width: W, height: H, data } = src;

// sample bg = average of the 4 corners (all solid chroma)
const corner = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
const cs = [corner(2, 2), corner(W - 3, 2), corner(2, H - 3), corner(W - 3, H - 3)];
const bg = [0, 1, 2].map((k) => Math.round(cs.reduce((s, c) => s + c[k], 0) / cs.length));

// distance-to-chroma key. dist < NEAR = pure background (alpha 0); dist > FAR =
// real subject (untouched, so green roofs are safe); between = graded edge fringe
// with the green spill clamped out so there is no lime halo.
const NEAR = 58, FAR = 112;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const dr = r - bg[0], dg = g - bg[1], db = b - bg[2];
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  if (dist < FAR) {
    const spill = g - Math.max(r, b);       // green excess only on the fringe
    if (spill > 0) data[i + 1] = Math.max(r, b); // despill: clamp G down
    const a = dist <= NEAR ? 0 : Math.round(((dist - NEAR) / (FAR - NEAR)) * 255);
    data[i + 3] = Math.min(data[i + 3], a);
  }
}

// bounding box of opaque-ish content
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (data[(y * W + x) * 4 + 3] > 16) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}
const bw = maxX - minX + 1, bh = maxY - minY + 1;

const scale = TARGET > 0 ? TARGET / bw : 1; // TARGET = target WIDTH (facade width-anchor)
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
        r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al; n++;
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
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`wrote ${outPath}  ${ow}x${oh}  (content ${bw}x${bh} of ${W}x${H}, bg=${bg})`);
