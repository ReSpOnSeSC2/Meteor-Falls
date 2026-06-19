/**
 * Assemble an authored ENEMY OVERWORLD 8-direction sheet from 5 generated views.
 *
 * Output: assets/art/enemies/overworld/<id>_8dir.png — 768×128, eight 96×128 frames.
 * Frame order is fixed by OverworldScene.enemyOverworldFrame():
 *   0 down · 1 downleft · 2 left · 3 upleft · 4 up · 5 upright · 6 right · 7 downright
 * The three right-facing frames are MIRRORS of their left-facing twins, so you only
 * author 5 views (down, downleft, left, upleft, up) and this mirrors 5←3, 6←2, 7←1.
 *
 * Each source is auto-keyed (magenta despill / near-white flood / passthrough),
 * cropped to content, area-average downscaled to fit a 96×128 cell, centered-x and
 * floor-aligned (feet ~2px off the bottom) so the roamer plants consistently.
 *
 *   node tools/assemble-enemy-8dir.js <id> <down.png> <downleft.png> <left.png> <upleft.png> <up.png>
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , id, ...views] = process.argv;
if (!id || views.length !== 5) {
  console.error('usage: node tools/assemble-enemy-8dir.js <id> <down> <downleft> <left> <upleft> <up>');
  process.exit(1);
}

const FW = 96, FH = 128, FLOOR = 2; // cell + floor margin

// key the background out, returning {data,W,H} with real alpha + the content bbox.
function keyAndCrop(path) {
  const src = PNG.sync.read(fs.readFileSync(path));
  const { width: W, height: H, data } = src;
  const c = [data[0], data[1], data[2], data[3]];
  const magentaish = c[3] > 16 && Math.min(c[0], c[2]) - c[1] > 60;
  const whiteish = c[3] > 16 && c[0] > 200 && c[1] > 200 && c[2] > 200;
  if (magentaish) {
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
  } else if (whiteish) {
    const bgR = data[0], bgG = data[1], bgB = data[2], TOL = 38;
    const isBg = (i) => Math.abs(data[i] - bgR) < TOL && Math.abs(data[i + 1] - bgG) < TOL && Math.abs(data[i + 2] - bgB) < TOL;
    const seen = new Uint8Array(W * H), stack = [];
    const visit = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const p = y * W + x; if (seen[p]) return; seen[p] = 1; if (isBg(p * 4)) { data[p * 4 + 3] = 0; stack.push(p); } };
    for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
    for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
    while (stack.length) { const p = stack.pop(); const x = p % W, y = (p / W) | 0; visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1); }
  }
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 16) {
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { data, W, H, minX, minY, maxX, maxY, key: magentaish ? 'magenta' : whiteish ? 'white' : 'alpha' };
}

// draw a keyed source into the sheet at cell `col`, fit + center-x + floor-align.
function place(sheet, src, col, mirror) {
  const { data, W, minX, minY, maxX, maxY } = src;
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const scale = Math.min((FW - 4) / cw, (FH - FLOOR - 2) / ch);
  const dw = Math.max(1, Math.round(cw * scale)), dh = Math.max(1, Math.round(ch * scale));
  const cellX = col * FW;
  const dx = cellX + Math.round((FW - dw) / 2);
  const dy = (FH - FLOOR) - dh;
  const sscale = dw / cw;
  for (let oy = 0; oy < dh; oy++) for (let ox = 0; ox < dw; ox++) {
    const sx0 = minX + Math.floor(ox / sscale), sx1 = Math.min(maxX, minX + Math.floor((ox + 1) / sscale));
    const sy0 = minY + Math.floor(oy / sscale), sy1 = Math.min(maxY, minY + Math.floor((oy + 1) / sscale));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
      const i = (sy * W + sx) * 4, al = data[i + 3];
      r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; a += al; n++;
    }
    const fx = mirror ? (dw - 1 - ox) : ox;
    const cx = dx + fx, cy = dy + oy;
    if (cx < 0 || cy < 0 || cx >= 768 || cy >= FH) continue;
    const oi = (cy * 768 + cx) * 4;
    if (a > 0) { sheet.data[oi] = Math.round(r / a); sheet.data[oi + 1] = Math.round(g / a); sheet.data[oi + 2] = Math.round(b / a); sheet.data[oi + 3] = Math.round(a / Math.max(1, n)); }
  }
}

const srcs = views.map(keyAndCrop);
const sheet = new PNG({ width: 768, height: FH }); // transparent
// 0 down,1 downleft,2 left,3 upleft,4 up
[0, 1, 2, 3, 4].forEach((col) => place(sheet, srcs[col], col, false));
// 5 upright=mirror upleft(3), 6 right=mirror left(2), 7 downright=mirror downleft(1)
place(sheet, srcs[3], 5, true);
place(sheet, srcs[2], 6, true);
place(sheet, srcs[1], 7, true);

const out = `assets/art/enemies/overworld/${id}_8dir.png`;
fs.mkdirSync('assets/art/enemies/overworld', { recursive: true });
fs.writeFileSync(out, PNG.sync.write(sheet));
console.log(`wrote ${out}  768x128  keys=[${srcs.map((s) => s.key).join(',')}]`);
