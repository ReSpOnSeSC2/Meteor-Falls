/**
 * Chroma-key an imagegen sprite shot on a solid MAGENTA screen (RGB 255,0,255)
 * into a clean transparent runtime PNG. Magenta keys far better than white when
 * the subject wears white (polo/shoes) — white-on-white edges are ambiguous,
 * magenta is unambiguous. We key by "magenta-ness" = min(R,B) − G, DESPILL the
 * edge fringe (subtract the magenta excess from R and B), crop to content, then
 * area-average downscale (premultiplied alpha) to a target longest side.
 *
 *   node tools/slice-chroma.js <src.png> <outPath.png> [targetPx=460]
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , srcPath, outPath, targetArg] = process.argv;
if (!srcPath || !outPath) {
  console.error('usage: node tools/slice-chroma.js <src.png> <outPath.png> [targetPx]');
  process.exit(1);
}
const TARGET = Number(targetArg) || 460;

const src = PNG.sync.read(fs.readFileSync(srcPath));
const { width: W, height: H, data } = src;

// 0) MAGENTA chroma key + despill. spill = min(R,B) − G is high only for
// magenta; the subject (red/white/navy/skin/dark) all have spill ≤ 0, so they
// are untouched. Edge pixels (subject blended with magenta) get the magenta
// excess removed (despill) and a graded alpha so the cutout has no pink halo.
const LOW = 28; // spill below this = fully opaque (real subject edge)
const HIGH = 130; // spill above this = fully transparent (background)
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const spill = Math.min(r, b) - g;
  if (spill > 0) {
    data[i] = Math.max(0, r - spill); // despill R
    data[i + 2] = Math.max(0, b - spill); // despill B
    const a = Math.max(0, Math.min(255, Math.round(255 - ((spill - LOW) / (HIGH - LOW)) * 255)));
    data[i + 3] = Math.min(data[i + 3], a);
  }
}

// 1) bounding box of opaque-ish content
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
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`wrote ${outPath}  ${ow}x${oh}  (content ${bw}x${bh} of ${W}x${H})`);
