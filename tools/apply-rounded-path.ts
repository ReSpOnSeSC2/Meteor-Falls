/**
 * tools/apply-rounded-path.ts — ROUND the ':' dirt-path autotile corners in the live
 * tile strip (otterbrook_tiles_16.png), SURGICALLY (only the 32 path cells change; every
 * other column stays byte-identical).
 *
 * Why: the 16-mask path cells (PATH_BASE..+PATH_VARIANTS*16-1) carried pathTile()'s
 * "stepped grass bite" corners, which read boxy at a 90° turn. This re-cuts each cell so
 * the dirt<->grass boundary is a smooth rounded-rectangle:
 *   - a CONVEX tile corner (where BOTH of its edges face grass) rounds off with RADIUS;
 *   - a grass-facing edge pulls back by MARGIN (a thin grass lip);
 *   - a PATH-facing edge stays FULL (inset 0) so the trail still tiles seamlessly into
 *     its neighbour.
 * The dirt + grass PIXELS are copied straight from the existing strip (PATH_BASE+0 = the
 * pure-dirt mask-0 cell for each variant; cell 0 = grass_a), so the authored dirt/grass
 * look is preserved — only the silhouette changes. Deterministic; writes a .bak first.
 *
 *   npx tsx tools/apply-rounded-path.ts
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, type Img } from './imageio';
import { PATH_BASE, PATH_VARIANTS } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const MARGIN = 2; // grass lip on a straight grass edge (px, 64-space)
const RADIUS = 18; // convex-corner round-off radius (px, 64-space)
const GRASS_CELL = 0; // TILESET index of grass_a (the base grass tile)

const strip: Img = decodePng(fs.readFileSync(STRIP));
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != ${CELL}`);
const BAK = STRIP.replace(/\.png$/, '.pre-rounded-path.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

/** copy a 64x64 cell out of the strip by column index */
function readCell(idx: number): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const x0 = idx * CELL;
  for (let y = 0; y < CELL; y++)
    for (let x = 0; x < CELL; x++) {
      const s = (y * strip.w + x0 + x) * 4;
      const o = (y * CELL + x) * 4;
      out[o] = strip.data[s]; out[o + 1] = strip.data[s + 1]; out[o + 2] = strip.data[s + 2]; out[o + 3] = strip.data[s + 3];
    }
  return out;
}
function writeCell(idx: number, px: Uint8Array): void {
  const x0 = idx * CELL;
  for (let y = 0; y < CELL; y++)
    for (let x = 0; x < CELL; x++) {
      const s = (y * CELL + x) * 4;
      const d = (y * strip.w + x0 + x) * 4;
      strip.data[d] = px[s]; strip.data[d + 1] = px[s + 1]; strip.data[d + 2] = px[s + 2]; strip.data[d + 3] = 255;
    }
}

const grass = readCell(GRASS_CELL);

// mask bits: 1=N 2=E 4=S 8=W is SET where the neighbour is GRASS (NOT path) — the ':' path
// convention from OverworldScene.buildTiles. A pixel is DIRT iff it's inside the rounded
// rectangle whose grass sides inset by MARGIN and whose both-grass corners round by RADIUS.
function isDirt(fx: number, fy: number, mask: number): boolean {
  const gN = mask & 1, gE = mask & 2, gS = mask & 4, gW = mask & 8;
  const L = gW ? MARGIN : 0;
  const T = gN ? MARGIN : 0;
  const R = CELL - (gE ? MARGIN : 0);
  const B = CELL - (gS ? MARGIN : 0);
  if (fx < L || fx > R || fy < T || fy > B) return false;
  const rTL = gN && gW ? RADIUS : 0;
  const rTR = gN && gE ? RADIUS : 0;
  const rBL = gS && gW ? RADIUS : 0;
  const rBR = gS && gE ? RADIUS : 0;
  // inside a corner's rounding box → must be within the arc radius of the arc centre
  if (rTL && fx < L + rTL && fy < T + rTL) { const dx = fx - (L + rTL), dy = fy - (T + rTL); if (dx * dx + dy * dy > rTL * rTL) return false; }
  if (rTR && fx > R - rTR && fy < T + rTR) { const dx = fx - (R - rTR), dy = fy - (T + rTR); if (dx * dx + dy * dy > rTR * rTR) return false; }
  if (rBL && fx < L + rBL && fy > B - rBL) { const dx = fx - (L + rBL), dy = fy - (B - rBL); if (dx * dx + dy * dy > rBL * rBL) return false; }
  if (rBR && fx > R - rBR && fy > B - rBR) { const dx = fx - (R - rBR), dy = fy - (B - rBR); if (dx * dx + dy * dy > rBR * rBR) return false; }
  return true;
}

let n = 0;
for (let v = 0; v < PATH_VARIANTS; v++) {
  const dirt = readCell(PATH_BASE + v * 16 + 0); // pure-dirt (mask 0) for this variant
  for (let mask = 0; mask < 16; mask++) {
    const out = new Uint8Array(CELL * CELL * 4);
    for (let y = 0; y < CELL; y++)
      for (let x = 0; x < CELL; x++) {
        const o = (y * CELL + x) * 4;
        const src = isDirt(x + 0.5, y + 0.5, mask) ? dirt : grass;
        out[o] = src[o]; out[o + 1] = src[o + 1]; out[o + 2] = src[o + 2]; out[o + 3] = 255;
      }
    writeCell(PATH_BASE + v * 16 + mask, out);
    n++;
  }
}

fs.writeFileSync(STRIP, encodePng(strip));
console.log(`rounded ${n} path cells (PATH_BASE=${PATH_BASE}, ${PATH_VARIANTS} variants); margin ${MARGIN} radius ${RADIUS}. backup: ${BAK.split(/[\\/]/).pop()}`);
