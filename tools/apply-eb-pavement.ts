/**
 * tools/apply-eb-pavement.ts — restyle the sidewalk slab to the EARTHBOUND
 * pavement read (user reference 2026-07-11: Onett's pavement is a FLAT cream
 * plane with sparse short dash ticks — NOT a dense diagonal corduroy hatch —
 * and its raised edges carry a bright rounded rim over a thin dark line).
 *
 * SURGICAL + IDEMPOTENT: redraws only the 'sidewalk' and 'sidewalk_crack'
 * cells (the curb family is re-derived from the new slab by re-running
 * tools/apply-curb-kit.ts, whose slab source is the live sidewalk cell).
 * Writes a .bak of the pre-pavement strip once. Deterministic (hash ticks).
 *
 *   npx tsx tools/apply-eb-pavement.ts && npx tsx tools/apply-curb-kit.ts
 */
import * as fs from 'fs';
import { decodePng, encodePng, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const idx = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`no tile ${name}`);
  return i;
};

const strip: Img = decodePng(fs.readFileSync(STRIP));
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != ${CELL}`);
const BAK = STRIP.replace(/\.png$/, '.pre-eb-pavement.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

// ---- the EB slab palette (PAPER-ramp creams; flat fills, no gradient wash) ----
const SLAB = [232, 224, 196]; // the plane (PAPER 2)
const SLAB_LO = [222, 214, 184]; // faint lower-half tone so big plazas aren't airless
const TICK = [196, 184, 156]; // the sparse dash marks (PAPER 1)
const TICK_HI = [246, 240, 220]; // 1px lit edge beside a tick (the EB double-stroke)
const CRACK = [148, 136, 108]; // sidewalk_crack's hairline (PAPER 0)

function put(cell: number, x: number, y: number, rgb: number[]): void {
  const d = (y * strip.w + cell * CELL + x) * 4;
  strip.data[d] = rgb[0];
  strip.data[d + 1] = rgb[1];
  strip.data[d + 2] = rgb[2];
  strip.data[d + 3] = 255;
}

/**
 * EarthBound's pavement ticks: SHORT '/' dashes, sparse and scattered (the
 * reference shows ~4-6 per screen-tile), never a contiguous hatch. Fixed
 * positions so every cell tiles seamlessly; kept ≥4px off the borders.
 */
const TICKS: Array<[number, number, number]> = [
  // [x, y, len] — a '/' dash rises right-to-left from (x,y)
  [11, 14, 5],
  [40, 9, 4],
  [55, 22, 5],
  [22, 30, 4],
  [47, 38, 5],
  [8, 45, 4],
  [33, 52, 5],
  [56, 50, 4],
];

function drawSlab(cell: number): void {
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      put(cell, x, y, y < CELL / 2 ? SLAB : SLAB_LO);
    }
  }
  for (const [tx, ty, len] of TICKS) {
    for (let i = 0; i < len; i++) {
      put(cell, tx + (len - 1 - i), ty + i, TICK);
      put(cell, tx + (len - 1 - i) + 1, ty + i, TICK_HI);
    }
  }
}

drawSlab(idx('sidewalk'));

// sidewalk_crack: the same slab with one meandering hairline (kept for the
// hand-placed wear char '1')
{
  const cell = idx('sidewalk_crack');
  drawSlab(cell);
  let x = 30;
  for (let y = 6; y < CELL - 6; y++) {
    x += ((y * 7 + x * 3) % 5) - 2;
    x = Math.max(8, Math.min(CELL - 9, x));
    put(cell, x, y, CRACK);
    if (y % 9 === 0) put(cell, x + 1, y, CRACK);
  }
}

fs.writeFileSync(STRIP, encodePng(strip));
console.log(
  `EB pavement slab restyled: sidewalk=${idx('sidewalk')} sidewalk_crack=${idx('sidewalk_crack')}. ` +
    `Now re-run apply-curb-kit.ts to re-derive the curb family from the new slab. backup: ${BAK.split(/[\\/]/).pop()}`,
);
