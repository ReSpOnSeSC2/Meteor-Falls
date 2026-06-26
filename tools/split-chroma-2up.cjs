/**
 * tools/split-chroma-2up.cjs — split a magenta-keyed 2-up image (two vehicle views
 * side by side: LEFT=front 3/4, RIGHT=rear 3/4) into two transparent, alpha-cropped
 * PNGs. Border flood-fill keys the magenta (bg + the gap between the figures), then a
 * column-occupancy split separates the two cars. Feeds tools/compose-vehicle-directional.cjs.
 *
 *   node tools/split-chroma-2up.cjs <src.png> <outFront.png> <outBack.png> [targetPx=900]
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const [, , srcPath, outA, outB, targetArg] = process.argv;
if (!srcPath || !outA || !outB) { console.error('usage: node tools/split-chroma-2up.cjs <src> <outFront> <outBack> [targetPx]'); process.exit(1); }
const TARGET = Number(targetArg || 900);

let buf = fs.readFileSync(srcPath);
const iend = buf.indexOf('IEND'); if (iend >= 0) buf = buf.subarray(0, iend + 8);
const src = PNG.sync.read(buf);
const { width: W, height: H, data } = src;

const isMag = (i) => { const r = data[i], g = data[i + 1], b = data[i + 2]; return Math.min(r, b) - g > 60 && r > 90 && b > 90; };
// border flood-fill magenta -> alpha 0 (bg + the inter-figure gap; interior survives)
const seen = new Uint8Array(W * H); const stack = [];
const visit = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const p = y * W + x; if (seen[p]) return; seen[p] = 1; if (isMag(p * 4)) { data[p * 4 + 3] = 0; stack.push(p); } };
for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
while (stack.length) { const p = stack.pop(); const x = p % W, y = (p / W) | 0; visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1); }
// despill: pull magenta FRINGE (both r and b above green) back toward green; leaves real blues/reds
for (let p = 0; p < W * H; p++) { const i = p * 4; if (data[i + 3] === 0) continue; const r = data[i], g = data[i + 1], b = data[i + 2]; const cap = g + 24; if (r > cap && b > cap) { data[i] = Math.min(r, cap + 12); data[i + 2] = Math.min(b, cap + 12); } }

// column occupancy -> split into figure runs by magenta gaps
const col = new Int32Array(W);
for (let x = 0; x < W; x++) { let n = 0; for (let y = 0; y < H; y++) if (data[(y * W + x) * 4 + 3] > 40) n++; col[x] = n; }
const MINGAP = 12, MINW = 40; const runs = []; let start = -1, gap = 0;
for (let x = 0; x < W; x++) { if (col[x] > 0) { if (start < 0) start = x; gap = 0; } else if (start >= 0) { gap++; if (gap >= MINGAP) { if (x - gap - start >= MINW) runs.push([start, x - gap]); start = -1; } } }
if (start >= 0 && W - start >= MINW) runs.push([start, W - 1]);
console.log('runs', JSON.stringify(runs));
if (runs.length < 2) { console.error(`expected 2 figures, got ${runs.length}`); process.exit(3); }

function emit(run, outPath) {
  const [cx0, cx1] = run;
  let minX = cx1, minY = H, maxX = cx0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = cx0; x <= cx1; x++) { if (data[(y * W + x) * 4 + 3] > 24) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } }
  const bw = maxX - minX + 1, bh = maxY - minY + 1; const scale = Math.min(1, TARGET / Math.max(bw, bh));
  const ow = Math.max(1, Math.round(bw * scale)), oh = Math.max(1, Math.round(bh * scale));
  const out = new PNG({ width: ow, height: oh });
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    const sx0 = minX + Math.floor(ox / scale), sx1 = minX + Math.floor((ox + 1) / scale), sy0 = minY + Math.floor(oy / scale), sy1 = minY + Math.floor((oy + 1) / scale);
    let pr = 0, pg = 0, pb = 0, sa = 0, n = 0;
    for (let yy = sy0; yy <= Math.min(sy1, maxY); yy++) for (let xx = sx0; xx <= Math.min(sx1, maxX); xx++) { const i = (yy * W + xx) * 4; const a = data[i + 3]; pr += data[i] * a; pg += data[i + 1] * a; pb += data[i + 2] * a; sa += a; n++; }
    const oi = (oy * ow + ox) * 4; const avgA = n > 0 ? sa / n : 0;
    if (avgA < 8 || sa === 0) { out.data[oi + 3] = 0; } else { out.data[oi] = Math.round(pr / sa); out.data[oi + 1] = Math.round(pg / sa); out.data[oi + 2] = Math.round(pb / sa); out.data[oi + 3] = Math.round(avgA); }
  }
  fs.writeFileSync(outPath, PNG.sync.write(out));
  console.log(`wrote ${outPath} ${ow}x${oh}`);
}
emit(runs[0], outA);
emit(runs[runs.length - 1], outB);
