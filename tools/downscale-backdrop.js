/**
 * Downscale a behind-view course/green BACKDROP (a full opaque scene, no alpha)
 * to the runtime size with a clean area-average filter. Backdrops are NOT
 * chroma-keyed (slice-chroma's magenta despill would nibble reds/blues), so this
 * is the plain-resize path for them.
 *
 *   node tools/downscale-backdrop.js <src.png> <out.png> [w=1600] [h=900]
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , src, out, wArg, hArg] = process.argv;
if (!src || !out) {
  console.error('usage: node tools/downscale-backdrop.js <src.png> <out.png> [w] [h]');
  process.exit(1);
}
const ow = Number(wArg) || 1600;
const oh = Number(hArg) || 900;

const s = PNG.sync.read(fs.readFileSync(src));
const o = new PNG({ width: ow, height: oh });
const sx = s.width / ow;
const sy = s.height / oh;
for (let y = 0; y < oh; y++) {
  for (let x = 0; x < ow; x++) {
    const x0 = Math.floor(x * sx);
    const x1 = Math.min(s.width, Math.floor((x + 1) * sx) + 1);
    const y0 = Math.floor(y * sy);
    const y1 = Math.min(s.height, Math.floor((y + 1) * sy) + 1);
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * s.width + xx) * 4;
        r += s.data[i];
        g += s.data[i + 1];
        b += s.data[i + 2];
        n++;
      }
    }
    const j = (y * ow + x) * 4;
    o.data[j] = Math.round(r / n);
    o.data[j + 1] = Math.round(g / n);
    o.data[j + 2] = Math.round(b / n);
    o.data[j + 3] = 255;
  }
}
fs.writeFileSync(out, PNG.sync.write(o));
console.log(`wrote ${out}  ${ow}x${oh}  (from ${s.width}x${s.height})`);
