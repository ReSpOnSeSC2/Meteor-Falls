/**
 * Slice an imagegen battle WEAR frame (battle_<x>_w1 / _w2) so it lands on the
 * EXACT same canvas as its base sprite, with the subject centered + floor-aligned.
 *
 * Why exact-canvas: in battle the wear swap is `spr.setTexture(battle_x_wN)` with
 * the BASE frame's setScale() left untouched and the float-tween Y derived from the
 * base displayHeight (src/scenes/BattleScene.ts). If a wear frame has different
 * native dims, the battler visibly grows/jumps when it takes damage. Every shipped
 * trio is therefore byte-identical in W×H (e.g. cranky_mailbox = 238×235 ×3). This
 * tool reproduces that: read the base for canvas size + content box, key the new
 * art, fit it to the base's content height, then center-x / bottom-align it.
 *
 * Background is auto-detected: solid MAGENTA screen → chroma despill (slice-chroma
 * math); near-white matte → border flood-fill (slice-enemy-mini math); already
 * transparent → used as-is.
 *
 *   node tools/slice-enemy-wear.js <src.png> <outKey> <baseKey>
 *     <src.png>  raw imagegen download
 *     <outKey>   e.g. battle_constable_borden_w1  → assets/art/enemies/<outKey>.png
 *     <baseKey>  e.g. battle_constable_borden     (reference for canvas + footprint)
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , srcPath, outKey, baseKey] = process.argv;
if (!srcPath || !outKey || !baseKey) {
  console.error('usage: node tools/slice-enemy-wear.js <src.png> <outKey> <baseKey>');
  process.exit(1);
}

const src = PNG.sync.read(fs.readFileSync(srcPath));
const { width: W, height: H, data } = src;

// --- 0) background removal, auto-detected from the corner pixel -------------
const corner = [data[0], data[1], data[2], data[3]];
const magentaish = corner[3] > 16 && Math.min(corner[0], corner[2]) - corner[1] > 60;
const whiteish = corner[3] > 16 && corner[0] > 200 && corner[1] > 200 && corner[2] > 200;

if (magentaish) {
  // MAGENTA chroma key + despill (spill = min(R,B) − G), graded alpha. Same math
  // as tools/slice-chroma.js — unambiguous when the subject wears white/cream.
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
} else if (whiteish) {
  // near-white MATTE → flood-fill from the borders (interior whites survive).
  const bgR = data[0], bgG = data[1], bgB = data[2], TOL = 38;
  const isBg = (i) => Math.abs(data[i] - bgR) < TOL && Math.abs(data[i + 1] - bgG) < TOL && Math.abs(data[i + 2] - bgB) < TOL;
  const seen = new Uint8Array(W * H);
  const stack = [];
  const visit = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (seen[p]) return;
    seen[p] = 1;
    if (isBg(p * 4)) { data[p * 4 + 3] = 0; stack.push(p); }
  };
  for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
  for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1);
  }
}
// else: already has real alpha — leave it.

// --- 1) crop to opaque content ---------------------------------------------
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
const cw = maxX - minX + 1;
const ch = maxY - minY + 1;

// --- 2) reference base: canvas size + content footprint --------------------
const base = PNG.sync.read(fs.readFileSync(`assets/art/enemies/${baseKey}.png`));
const BW = base.width, BH = base.height;
let bx0 = BW, by0 = BH, bx1 = 0, by1 = 0;
for (let y = 0; y < BH; y++) {
  for (let x = 0; x < BW; x++) {
    if (base.data[(y * BW + x) * 4 + 3] > 16) {
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
    }
  }
}
const refCW = bx1 - bx0 + 1;
const refCH = by1 - by0 + 1;

// fit the subject inside the base's content box (height-led, width-clamped),
// never upscaling past the source resolution.
const scale = Math.min(refCH / ch, refCW / cw);
const dw = Math.max(1, Math.round(cw * scale));
const dh = Math.max(1, Math.round(ch * scale));
// center horizontally on the canvas; bottom-align feet to the base's floor line.
const dx = Math.round((BW - dw) / 2);
const dy = (by1 + 1) - dh;

// --- 3) area-average downscale (premultiplied alpha) into the placed rect ---
const out = new PNG({ width: BW, height: BH });
const sscale = dw / cw; // src→dest
for (let oy = 0; oy < dh; oy++) {
  for (let ox = 0; ox < dw; ox++) {
    const sx0 = minX + Math.floor(ox / sscale);
    const sx1 = Math.min(maxX, minX + Math.floor((ox + 1) / sscale));
    const sy0 = minY + Math.floor(oy / sscale);
    const sy1 = Math.min(maxY, minY + Math.floor((oy + 1) / sscale));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy <= sy1; sy++) {
      for (let sx = sx0; sx <= sx1; sx++) {
        const i = (sy * W + sx) * 4;
        const al = data[i + 3];
        r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al;
        a += al; n++;
      }
    }
    const cx = dx + ox, cy = dy + oy;
    if (cx < 0 || cy < 0 || cx >= BW || cy >= BH) continue;
    const oi = (cy * BW + cx) * 4;
    if (a > 0) {
      out.data[oi] = Math.round(r / a);
      out.data[oi + 1] = Math.round(g / a);
      out.data[oi + 2] = Math.round(b / a);
      out.data[oi + 3] = Math.round(a / Math.max(1, n));
    }
  }
}
fs.writeFileSync(`assets/art/enemies/${outKey}.png`, PNG.sync.write(out));
console.log(`wrote assets/art/enemies/${outKey}.png  ${BW}x${BH}  (subject ${dw}x${dh} @ ${dx},${dy}; key=${magentaish ? 'magenta' : whiteish ? 'white' : 'alpha'})`);
