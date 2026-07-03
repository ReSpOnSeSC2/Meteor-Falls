/**
 * tools/fit-eb-facade.ts — swap a legacy authored facade's ART in place while
 * keeping its exact canvas (so every measured door.ox / solid / doorstep keeps
 * working with ZERO wiring changes). EB facade re-author pipeline, 2026-07-02.
 *
 * Scale the new content-tight slice to the target canvas WIDTH, anchor it to the
 * BOTTOM (ground line), center horizontally; taller-than-canvas overflow crops
 * off the TOP (sky side), shorter pads transparent sky. First run writes
 * <target>.pre-eb.bak.png beside the target.
 *
 *   npx tsx tools/fit-eb-facade.ts <slice.png> <target.png>
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg } from './imageio';

const [, , slicePath, targetPath] = process.argv;
if (!slicePath || !targetPath) {
  console.error('usage: npx tsx tools/fit-eb-facade.ts <slice.png> <target.png>');
  process.exit(1);
}

const slice = decodePng(fs.readFileSync(slicePath));
const target = decodePng(fs.readFileSync(targetPath));
// backups live under masters/ — runtime art dirs are coverage-swept by
// authored_assets.test.ts (every PNG there must be wired), so never park a .bak in one
const bakName = targetPath.split(/[\\/]/).pop()!.replace(/\.png$/, '-pre-eb-runtime.png');
const bak = `${fileURLToPath(new URL('..', import.meta.url))}assets/art/masters/world/${bakName}`;
if (!fs.existsSync(bak)) fs.copyFileSync(targetPath, bak);

const out = makeImg(target.w, target.h);
// CONTAIN: never crop the art (steeples/rooflines survive); the smaller dimension
// gets transparent pads. Bottom-anchored (ground line), centered horizontally.
const scale = Math.min(target.w / slice.w, target.h / slice.h);
const scaledH = Math.round(slice.h * scale);
const scaledW = Math.round(slice.w * scale);
const padX = Math.floor((target.w - scaledW) / 2);
for (let y = 0; y < target.h; y++) {
  const syF = (y - (target.h - scaledH)) / scale;
  if (syF < 0) continue; // transparent sky pad
  for (let xo = 0; xo < scaledW; xo++) {
    const x = xo + padX;
    if (x < 0 || x >= target.w) continue;
    // area-average the source box for this output pixel (source x is content-relative)
    const x0 = Math.floor(xo / scale), x1 = Math.min(slice.w, Math.max(x0 + 1, Math.ceil((xo + 1) / scale)));
    const y0 = Math.floor(syF), y1 = Math.min(slice.h, Math.max(y0 + 1, Math.ceil(syF + 1 / scale)));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) {
      const i = (sy * slice.w + sx) * 4;
      r += slice.data[i]; g += slice.data[i + 1]; b += slice.data[i + 2]; a += slice.data[i + 3]; n++;
    }
    if (!n) continue;
    const o = (y * target.w + x) * 4;
    out.data[o] = r / n; out.data[o + 1] = g / n; out.data[o + 2] = b / n; out.data[o + 3] = a / n;
  }
}
fs.writeFileSync(targetPath, encodePng(out));
console.log(`${targetPath}: ${slice.w}x${slice.h} -> ${target.w}x${target.h} contain (top pad ${target.h - scaledH}px, x pads ${padX}px)`);
