/**
 * tools/key-prop-square.cjs — turn a ChatGPT imagegen shot of a SINGLE prop on a flat
 * MAGENTA (#FF00FF) screen into a clean, transparent, SQUARE runtime PNG. Unlike
 * slice-chroma.js (content-tight, non-square) this keeps the output SQUARE so the
 * AUTHORED_WORLD_PROP_DISPLAY_SIZE setDisplaySize (which forces a square w==h) never
 * distorts the object. Global magenta key + despill (same math as slice-chroma) →
 * crop to content → centre in a square with a small margin → area-average downscale.
 *
 *   node tools/key-prop-square.cjs <src.png> <out.png> [targetPx=64] [marginFrac=0.08]
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const [, , srcPath, outPath, targetArg, marginArg] = process.argv;
if (!srcPath || !outPath) { console.error('usage: node tools/key-prop-square.cjs <src> <out> [targetPx=64] [marginFrac=0.08]'); process.exit(1); }
const TARGET = Number(targetArg || 64);
const MARGIN = Number(marginArg || 0.08);

let buf = fs.readFileSync(srcPath);
const iend = buf.indexOf('IEND'); if (iend >= 0) buf = buf.subarray(0, iend + 8); // tolerate trailing bytes
const src = PNG.sync.read(buf);
const { width: W, height: H, data } = src;

// 1) MAGENTA chroma key + despill (spill = min(R,B) - G; high only for magenta).
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

// 2) content bbox (alpha > 16)
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (data[(y * W + x) * 4 + 3] > 16) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
const bw = maxX - minX + 1, bh = maxY - minY + 1;

// 3) centre into a SQUARE buffer with a margin
const side = Math.max(bw, bh);
const pad = Math.round(side * MARGIN);
const S = side + 2 * pad;
const sq = new Uint8ClampedArray(S * S * 4); // transparent
const offX = pad + ((side - bw) >> 1);
const offY = pad + ((side - bh) >> 1);
for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
  const si = ((minY + y) * W + (minX + x)) * 4;
  const di = ((offY + y) * S + (offX + x)) * 4;
  sq[di] = data[si]; sq[di + 1] = data[si + 1]; sq[di + 2] = data[si + 2]; sq[di + 3] = data[si + 3];
}

// 4) area-average downscale S -> TARGET, premultiplied alpha
const out = new PNG({ width: TARGET, height: TARGET });
const scale = TARGET / S;
for (let oy = 0; oy < TARGET; oy++) for (let ox = 0; ox < TARGET; ox++) {
  const sx0 = Math.floor(ox / scale), sx1 = Math.min(S - 1, Math.floor((ox + 1) / scale));
  const sy0 = Math.floor(oy / scale), sy1 = Math.min(S - 1, Math.floor((oy + 1) / scale));
  let r = 0, g = 0, b = 0, a = 0, n = 0;
  for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
    const i = (sy * S + sx) * 4; const al = sq[i + 3];
    r += sq[i] * al; g += sq[i + 1] * al; b += sq[i + 2] * al; a += al; n++;
  }
  const oi = (oy * TARGET + ox) * 4;
  if (a > 0) { out.data[oi] = Math.round(r / a); out.data[oi + 1] = Math.round(g / a); out.data[oi + 2] = Math.round(b / a); out.data[oi + 3] = Math.round(a / Math.max(1, n)); }
}
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`wrote ${outPath}  ${TARGET}x${TARGET}  (content ${bw}x${bh} of ${W}x${H}, square ${S})`);
