/**
 * tools/slice-oblique-facade.ts — turn an OBLIQUE (3/4) building render on a CHROMA-GREEN
 * background into a runtime facade PNG. The EarthBound-style facades (front + right side)
 * are authored on a bright-green screen (ChatGPT), and the building itself may CONTAIN
 * green (awnings, signs, doors) — so we key out ONLY the background by FLOOD-FILLING green
 * from the image border (interior greens are enclosed by the building's dark outline and
 * never reached). Then crop to content + area-average downscale (alpha-weighted, no dark
 * halo) to a target height.
 *
 *   npx tsx tools/slice-oblique-facade.ts <src.png> <out.png> [targetHeight=384]
 */
import * as fs from 'fs';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

const SRC = process.argv[2];
const OUT = process.argv[3];
const TARGET_H = Number(process.argv[4] ?? 384);
if (!SRC || !OUT) throw new Error('usage: slice-oblique-facade <src> <out> [targetH]');

const img: Img = decodePng(fs.readFileSync(SRC));
const { w, h, data } = img;

// bright chroma-green test (the SCREEN, not the building's muted greens): very green,
// low red/blue. The awning/sign greens are darker/less pure → below these thresholds.
const isScreen = (i: number): boolean => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return g > 150 && g - r > 55 && g - b > 55;
};

// FLOOD-FILL the background from every border pixel; only screen-green CONNECTED to the
// edge is removed. Stack-based (avoids recursion depth on big images).
const bg = new Uint8Array(w * h); // 1 = background
const stack: number[] = [];
const push = (x: number, y: number): void => {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const p = y * w + x;
  if (bg[p]) return;
  if (!isScreen(p * 4)) return;
  bg[p] = 1;
  stack.push(p);
};
for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
while (stack.length) {
  const p = stack.pop()!;
  const x = p % w, y = (p - x) / w;
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

// knock out the background (alpha 0); also de-spill a 1px green fringe on kept edges
let minX = w, minY = h, maxX = 0, maxY = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const p = y * w + x, i = p * 4;
  if (bg[p]) { data[i + 3] = 0; continue; }
  // kept pixel touching background = likely a green-tinged edge → pull green toward r/b avg
  let edge = false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h && bg[ny * w + nx]) { edge = true; break; }
  }
  if (edge && isScreen(i)) data[i + 1] = Math.round((data[i] + data[i + 2]) / 2);
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
}
if (maxX < minX) throw new Error('nothing kept — chroma thresholds removed the whole image');

// crop to content
const cw = maxX - minX + 1, ch = maxY - minY + 1;

// area-average downscale (alpha-weighted RGB) to the target height
const scale = TARGET_H / ch;
const ow = Math.max(1, Math.round(cw * scale)), oh = TARGET_H;
const out = makeImg(ow, oh);
for (let oy = 0; oy < oh; oy++) {
  for (let ox = 0; ox < ow; ox++) {
    const sx0 = minX + Math.floor((ox / ow) * cw), sx1 = minX + Math.max(Math.floor(((ox + 1) / ow) * cw), Math.floor((ox / ow) * cw) + 1);
    const sy0 = minY + Math.floor((oy / oh) * ch), sy1 = minY + Math.max(Math.floor(((oy + 1) / oh) * ch), Math.floor((oy / oh) * ch) + 1);
    let r = 0, gg = 0, b = 0, a = 0, aw = 0, n = 0;
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) {
      const i = (y * w + x) * 4, al = data[i + 3];
      r += data[i] * al; gg += data[i + 1] * al; b += data[i + 2] * al; aw += al; a += al; n++;
    }
    const o = (oy * ow + ox) * 4;
    if (aw > 0) { out.data[o] = Math.round(r / aw); out.data[o + 1] = Math.round(gg / aw); out.data[o + 2] = Math.round(b / aw); }
    out.data[o + 3] = Math.round(a / Math.max(1, n));
  }
}
fs.writeFileSync(OUT, encodePng(out));
console.log(`sliced ${SRC} -> ${OUT}  content ${cw}x${ch} -> runtime ${ow}x${oh}  (DIMS: [${ow}, ${oh}])`);
