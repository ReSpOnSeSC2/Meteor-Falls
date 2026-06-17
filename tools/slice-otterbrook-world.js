/**
 * Slice the authored Otterbrook world master sheet into the individual runtime
 * PROP PNGs the game loads (assets/art/world/props/<key>.png, listed in
 * spritegen/authored.ts WORLD_PROP_KEYS). Re-run after re-authoring the master.
 *
 *   node tools/slice-otterbrook-world.js
 *
 * The master is an 8x4 grid (1774x887). Rows 0-1 are floor/ground TILES (a
 * separate renderer — NOT sliced here); rows 2-3 are the props. Each prop cell
 * is trimmed to its non-transparent bbox so it sits tight on the map.
 *
 * Because the old runtime props were authored at ~native (×1) res and lifted
 * ×ART_SCALE at placement, the hi-res slices must instead carry an explicit
 * AUTHORED_WORLD_PROP_DISPLAY_SIZE entry so they render at the SAME footprint.
 * We anchor each entry on the OLD prop's native HEIGHT (keeps ground line +
 * y-sort depth identical) and derive width from the slice's true aspect ratio.
 * The script PRINTS the entries to paste into spritegen/authored.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const SRC = 'assets/art/masters/world/otterbrook-world-transparent.png';
const OUT = 'assets/art/world/props';
const COLS = 8;
const ROWS = 4;
// [row][col] -> prop key (null = tile cell or unused, leave unsliced)
const KEYS = [
  [null, null, null, null, null, null, null, null], // row0: grass / bush / fence / dirt TILES
  [null, null, null, null, null, null, null, null], // row1: wood / rug / stone / road TILES
  ['tree', 'tree_b', 'tree_c', 'pine', 'sign', 'picnic', 'picnic_blanket', 'phone_table'],
  ['bed', null, 'sofa', 'desk', 'dresser', 'tv', 'bookshelf', 'floor_lamp'], // col1 = nightstand (no key)
];
// fallback native height for any prop with no existing low-res PNG to anchor on
const FALLBACK_H = { tree_b: 34, tree_c: 30, pine: 36, picnic_blanket: 22 };

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width, height, data } = png;
const alpha = (x, y) => data[(y * width + x) * 4 + 3];
const entries = [];

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const key = KEYS[r][c];
    if (!key) continue;
    // exact tiling of the non-integer cell so columns/rows abut without gaps
    const x0 = Math.floor((c * width) / COLS);
    const x1 = Math.floor(((c + 1) * width) / COLS);
    const y0 = Math.floor((r * height) / ROWS);
    const y1 = Math.floor(((r + 1) * height) / ROWS);
    let minX = x1, minY = y1, maxX = -1, maxY = -1;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (alpha(x, y) > 12) {
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
    // anchor display size on the OLD prop's native height (keeps ground/depth)
    const oldPath = path.join(OUT, `${key}.png`);
    let h0 = FALLBACK_H[key] ?? 24;
    if (fs.existsSync(oldPath)) h0 = PNG.sync.read(fs.readFileSync(oldPath)).height;
    const wDisp = Math.round((h0 * tw) / th);
    entries.push(`  ${key}: { w: ${wDisp}, h: ${h0} },`);

    const out = new PNG({ width: tw, height: th });
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const si = ((minY + y) * width + (minX + x)) * 4;
        const di = (y * tw + x) * 4;
        out.data[di] = data[si];
        out.data[di + 1] = data[si + 1];
        out.data[di + 2] = data[si + 2];
        out.data[di + 3] = data[si + 3];
      }
    }
    fs.writeFileSync(oldPath, PNG.sync.write(out));
    console.log(`${key}: slice ${tw}x${th}  (anchor h=${h0} -> display ${wDisp}x${h0})`);
  }
}

console.log('\n--- paste into AUTHORED_WORLD_PROP_DISPLAY_SIZE ---');
console.log(entries.join('\n'));
