/**
 * tools/derive-tall-facades.ts — derive TALL downtown facade variants from the
 * existing AUTHORED facades by cloning a clean repeating storey band (the same
 * derive-from-authored pattern as tools/derive-ch5-minis.ts — no new art is
 * painted; every pixel comes from a user-approved render).
 *
 * WHY: measured off the EarthBound references
 * (assets/art/masters/reference/earthbound/), EB downtown buildings run
 * 3-6.5 character-heights; every Otterbrooke facade was authored at 384px =
 * 3 units, which is why downtown read as garden sheds. These derivations give
 * the skyline its tall anchors TODAY; the Batch-A ChatGPT re-authors
 * (docs/DOWNTOWN_OTTERBROOKE_REBUILD.md) remain the gold standard and simply
 * replace these PNGs when they land.
 *
 *   facade_hotel_tall      269x576 (4.5 units) — hotel storey band [160,224) x3
 *   facade_apartments_tall 285x544 (4.25 units) — brownstone band [176,256) x2
 * (NON-'bldg_' keys on purpose: these are doorless back-rank scenery volumes,
 * and the 'bldg_' prefix would get them grafted into occupyCity housing units
 * — the 27-Maple rule. They are registered in LANDMARK_FACADE_SPRITES instead.)
 *
 * Deterministic; overwrites its outputs (sources are committed, so re-runs are
 * byte-stable).
 *
 *   npx tsx tools/derive-tall-facades.ts
 */
import * as fs from 'fs';
import { decodePng, encodePng, type Img } from './imageio';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = `${ROOT}assets/art/world/facades/`;

function cloneBand(srcName: string, outName: string, y0: number, y1: number, copies: number): void {
  const src: Img = decodePng(fs.readFileSync(`${DIR}${srcName}.png`));
  const bandH = y1 - y0;
  const out: Img = { w: src.w, h: src.h + bandH * copies, data: new Uint8Array(src.w * (src.h + bandH * copies) * 4) };
  const row = (img: Img, y: number): Uint8Array => img.data.subarray(y * img.w * 4, (y + 1) * img.w * 4);
  let dy = 0;
  for (let y = 0; y < y1; y++) out.data.set(row(src, y), dy++ * out.w * 4); // top incl. the band once
  for (let c = 0; c < copies; c++) for (let y = y0; y < y1; y++) out.data.set(row(src, y), dy++ * out.w * 4);
  for (let y = y1; y < src.h; y++) out.data.set(row(src, y), dy++ * out.w * 4); // ground floor + stoop
  fs.writeFileSync(`${DIR}${outName}.png`, encodePng(out));
  console.log(`${outName}: ${src.w}x${src.h} -> ${out.w}x${out.h} (band [${y0},${y1}) x${copies})`);
}

cloneBand('bldg_ob_hotel', 'facade_hotel_tall', 160, 224, 3);
cloneBand('bldg_apartments', 'facade_apartments_tall', 176, 256, 2);
// TWOTON back rank (EB polish rollout §3.5): Twoton's own brick vernacular so
// its skyline masses don't read as imported Otterbrooke art.
cloneBand('bldg_brickmore', 'facade_brickmore_tall', 178, 229, 3); // 271x384 -> 271x537 (4.2u)
cloneBand('bldg_brownstone', 'facade_brownstone_tall', 86, 159, 2); // 291x339 -> 291x485 (3.8u)
