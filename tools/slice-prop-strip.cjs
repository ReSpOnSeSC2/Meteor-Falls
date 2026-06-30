/**
 * tools/slice-prop-strip.cjs — split ONE ChatGPT imagegen shot of several props in a
 * row on a flat MAGENTA (#FF00FF) screen into N clean, transparent, CONTENT-TIGHT
 * (aspect-preserving, NON-square) runtime PNGs — one per prop. This is the
 * edge-feature counterpart to key-prop-square.cjs (which forces square output):
 * edge features (ice spires, palms, dunes, bamboo, basalt, red rock) are NOT square,
 * so we keep each prop's true aspect and let AUTHORED_WORLD_PROP_DISPLAY_SIZE size it.
 *
 * Magenta key + despill (same math as slice-chroma.js) → column-gap split into N
 * figures (same idea as slice-chroma-strip.js) → per-figure content bbox →
 * area-average downscale to a target LONGEST side (premultiplied alpha).
 *
 *   node tools/slice-prop-strip.cjs <src.png> <outPrefix> \
 *        [--target=200] [--expect=N] [--mingap=12] [--minw=24]
 * Writes <outPrefix>_0.png, <outPrefix>_1.png, ... (left-to-right) and prints the
 * figure count + each output's WxH. Pass --expect=N to assert the count.
 */
const { PNG } = require('pngjs');
const fs = require('fs');

const argv = process.argv;
const opt = (n, d) => { const m = argv.find((a) => a.startsWith(`--${n}=`)); return m ? m.split('=')[1] : d; };
const [, , srcPath, outPrefix] = argv;
if (!srcPath || !outPrefix) {
  console.error('usage: node tools/slice-prop-strip.cjs <src> <outPrefix> [--target=200] [--expect=N] [--mingap=12] [--minw=24]');
  process.exit(1);
}
const TARGET = Number(opt('target', 200));
const MINGAP = Number(opt('mingap', 12)); // empty columns that separate two props
const MINFIGW = Number(opt('minw', 24));  // ignore slivers narrower than this
const EXPECT = opt('expect', null);

let buf = fs.readFileSync(srcPath);
const iend = buf.indexOf('IEND'); if (iend >= 0) buf = buf.subarray(0, iend + 8); // tolerate trailing bytes
const src = PNG.sync.read(buf);
const { width: W, height: H, data } = src;

// 1) MAGENTA chroma key + despill (spill = min(R,B) − G; high only for magenta).
const LOW = 28, HIGH = 130;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const spill = Math.min(r, b) - g;
  if (spill > 0) {
    data[i] = Math.max(0, r - spill);
    data[i + 2] = Math.max(0, b - spill);
    const a = Math.max(0, Math.min(255, Math.round(255 - ((spill - LOW) / (HIGH - LOW)) * 255)));
    data[i + 3] = Math.min(data[i + 3], a);
  }
}

// 2) column occupancy (>=3 opaque px) -> split into figure runs separated by gaps
const colCount = new Int32Array(W);
for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y++) if (data[(y * W + x) * 4 + 3] > 40) n++; colCount[x] = n; }
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

const sizes = [];
runs.forEach(([cx0, cx1], idx) => {
  // figure bbox within its column span (alpha > 16)
  let minX = cx1, minY = H, maxX = cx0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = cx0; x <= cx1; x++) {
    if (data[(y * W + x) * 4 + 3] > 16) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  // area-average downscale to TARGET on the longest side, premultiplied alpha
  const scale = Math.min(1, TARGET / Math.max(bw, bh));
  const ow = Math.max(1, Math.round(bw * scale)), oh = Math.max(1, Math.round(bh * scale));
  const out = new PNG({ width: ow, height: oh });
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    const sx0 = minX + Math.floor(ox / scale), sx1 = Math.min(maxX, minX + Math.floor((ox + 1) / scale));
    const sy0 = minY + Math.floor(oy / scale), sy1 = Math.min(maxY, minY + Math.floor((oy + 1) / scale));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) { const i = (sy * W + sx) * 4; const al = data[i + 3]; r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al; n++; }
    const oi = (oy * ow + ox) * 4;
    if (a > 0) { out.data[oi] = Math.round(r / a); out.data[oi + 1] = Math.round(g / a); out.data[oi + 2] = Math.round(b / a); out.data[oi + 3] = Math.round(a / Math.max(1, n)); }
  }
  fs.writeFileSync(`${outPrefix}_${idx}.png`, PNG.sync.write(out));
  sizes.push(`${ow}x${oh}`);
});
console.log(`segmented ${runs.length} props -> ${outPrefix}_[0..${runs.length - 1}].png  sizes=[${sizes.join(', ')}]  runs=${JSON.stringify(runs)}`);
