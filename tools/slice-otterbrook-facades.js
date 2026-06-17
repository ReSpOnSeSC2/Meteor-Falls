/**
 * Slice the authored Otterbrook facade master sheet into the individual runtime
 * facade PNGs the game loads (assets/art/world/facades/<key>.png, wired in
 * spritegen/authored.ts). Re-run after re-authoring the master.
 *
 *   node tools/slice-otterbrook-facades.js
 *
 * The master is a 4x2 grid (1536x1024 -> 384x512 cells); each facade is trimmed
 * to its non-transparent bounding box so it sits tight on the map.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const SRC = 'assets/art/masters/world/otterbrook-facades-transparent.png';
const OUT = 'assets/art/world/facades';
const COLS = 4;
const ROWS = 2;
// [row][col] -> facade key (null = leave that cell unsliced)
const KEYS = [
  ['house_rex', 'house_a', 'house_b', 'house_chad'],
  ['drugstore', 'arcade', 'chapel', 'house_pink'],
];

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width, height, data } = png;
const cw = Math.floor(width / COLS);
const chh = Math.floor(height / ROWS);
const alpha = (x, y) => data[(y * width + x) * 4 + 3];

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const key = KEYS[r][c];
    if (!key) continue;
    const x0 = c * cw;
    const y0 = r * chh;
    let minX = cw;
    let minY = chh;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < chh; y++) {
      for (let x = 0; x < cw; x++) {
        if (alpha(x0 + x, y0 + y) > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX) {
      console.log(`${key}: (empty cell, skipped)`);
      continue;
    }
    const tw = maxX - minX + 1;
    const th = maxY - minY + 1;
    const out = new PNG({ width: tw, height: th });
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const si = ((y0 + minY + y) * width + (x0 + minX + x)) * 4;
        const di = (y * tw + x) * 4;
        out.data[di] = data[si];
        out.data[di + 1] = data[si + 1];
        out.data[di + 2] = data[si + 2];
        out.data[di + 3] = data[si + 3];
      }
    }
    fs.writeFileSync(path.join(OUT, `${key}.png`), PNG.sync.write(out));
    console.log(`${key}: ${tw}x${th}`);
  }
}
