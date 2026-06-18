/**
 * Chroma-key a single imagegen character pose into a transparent, normalized
 * 96x128 frame for the 46-frame character sheets.
 *
 * The authored-character pipeline (see CLAUDE.md / memory): ChatGPT renders a
 * fresh pose on a SOLID CHROMA-GREEN background so NO light sprite pixel is lost
 * to the white-matte flatten the ChatGPT "Download" applies. We key the green
 * out (flood-fill from the borders, so an interior non-green pixel can never be
 * punched out), despill the green fringe, crop to the figure, and scale it so
 * the character HEIGHT matches the rest of the sheet (mom: ~108px tall, feet
 * 16px off the cell bottom) — bottom-center anchored so every facing animates
 * without size/baseline jitter.
 *
 *   node tools/slice-chroma-pose.js <src.png> <out.png> \
 *        [--h=108] [--foot=16] [--cw=96] [--ch=128] [--despill=1]
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const argv = process.argv;
const opt = (name, def) => {
  const m = argv.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split('=')[1] : def;
};
const [, , srcPath, outPath] = argv;
if (!srcPath || !outPath) {
  console.error('usage: node tools/slice-chroma-pose.js <src.png> <out.png> [--h=108] [--foot=16] [--cw=96] [--ch=128] [--despill=1]');
  process.exit(1);
}
const TARGET_H = Number(opt('h', 108));
const FOOT = Number(opt('foot', 16));
const CW = Number(opt('cw', 96));
const CH = Number(opt('ch', 128));
const DESPILL = opt('despill', '1') !== '0';

// Canvas-exported PNGs (from the browser capture path) can carry trailing
// chunks after IEND that pngjs's strict sync reader rejects — truncate to the
// end of the IEND chunk first.
let buf = fs.readFileSync(srcPath);
const iend = buf.indexOf('IEND');
if (iend >= 0) buf = buf.subarray(0, iend + 8);
const src = PNG.sync.read(buf);
const { width: W, height: H, data } = src;

// chroma test: green clearly the dominant channel (handles a #00FF00-ish bg even
// with imagegen gradient / lighting noise). Tunable margins.
const isChroma = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return g > 70 && g > r * 1.25 && g > b * 1.25 && g - Math.max(r, b) > 28;
};

// flood-fill chroma from the borders -> background alpha 0. interior survives.
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
while (stack.length) {
  const p = stack.pop();
  const x = p % W, y = (p / W) | 0;
  visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1);
}

// despill: knock the green cast off kept (edge) pixels.
if (DESPILL) {
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const cap = Math.round((r + b) / 2);
    if (g > cap) data[i + 1] = Math.min(g, cap + 10);
  }
}

// bounding box of the surviving figure
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 24) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
if (maxX < minX) { console.error('no content survived the key — bad chroma / wrong color?'); process.exit(2); }
const bw = maxX - minX + 1, bh = maxY - minY + 1;

// scale so the FIGURE HEIGHT == TARGET_H (so all facings match); clamp to width.
let scale = TARGET_H / bh;
if (bw * scale > CW) scale = CW / bw;
const ow = Math.max(1, Math.round(bw * scale));
const oh = Math.max(1, Math.round(bh * scale));

const out = new PNG({ width: CW, height: CH }); // zero-filled = transparent
const offX = Math.round((CW - ow) / 2);
const offY = CH - FOOT - oh; // feet anchored FOOT px off the bottom
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
    const dx = offX + ox, dy = offY + oy;
    if (dx < 0 || dy < 0 || dx >= CW || dy >= CH) continue;
    const oi = (dy * CW + dx) * 4;
    if (a > 0) {
      out.data[oi] = Math.round(r / a);
      out.data[oi + 1] = Math.round(g / a);
      out.data[oi + 2] = Math.round(b / a);
      out.data[oi + 3] = Math.round(a / Math.max(1, n));
    }
  }
}
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`wrote ${outPath}  figure ${bw}x${bh} -> ${ow}x${oh} @ (${offX},${offY}) in ${CW}x${CH}`);
