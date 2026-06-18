/**
 * Extract specific frames from a 46-frame character sheet into a side-by-side
 * strip for visual inspection. Diagnostic only.
 *   node tools/extract-char-frames.js <sheet.png> <out.png> <frame> [frame...]
 * Layout: 96x128 frames, 4 cols (24x32 native x4). Index = row*4 + col.
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , sheetPath, outPath, ...frameArgs] = process.argv;
const FW = 96, FH = 128, COLS = 4;
const frames = frameArgs.map(Number);
const sheet = PNG.sync.read(fs.readFileSync(sheetPath));
const out = new PNG({ width: FW * frames.length, height: FH });
// light checker so transparent areas are visible
for (let y = 0; y < FH; y++) {
  for (let x = 0; x < out.width; x++) {
    const c = ((x >> 3) + (y >> 3)) & 1 ? 200 : 230;
    const i = (y * out.width + x) * 4;
    out.data[i] = out.data[i + 1] = out.data[i + 2] = c;
    out.data[i + 3] = 255;
  }
}
frames.forEach((f, idx) => {
  const sx = (f % COLS) * FW, sy = ((f / COLS) | 0) * FH;
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const si = ((sy + y) * sheet.width + (sx + x)) * 4;
      const a = sheet.data[si + 3] / 255;
      const di = (y * out.width + (idx * FW + x)) * 4;
      out.data[di] = Math.round(sheet.data[si] * a + out.data[di] * (1 - a));
      out.data[di + 1] = Math.round(sheet.data[si + 1] * a + out.data[di + 1] * (1 - a));
      out.data[di + 2] = Math.round(sheet.data[si + 2] * a + out.data[di + 2] * (1 - a));
    }
  }
});
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`wrote ${outPath} — frames [${frames.join(', ')}] from ${sheet.width}x${sheet.height}`);
