/**
 * tools/apply-horizon.ts — bake the EB HORIZON BAND tile ('horizon_ridge',
 * grid char '5') into the authored strip: EarthBound's checker-dithered sky
 * gradient over a dark treeline/ridge silhouette, in one solid band tile for
 * vista map edges (reference: assets/art/masters/reference/earthbound/
 * eb-twoson-rooftop-elevation.png — the dithered sky + rock ridge + hedge
 * horizon stack).
 *
 * SURGICAL + IDEMPOTENT: only the horizon_ridge column is (re)written; a .bak
 * of the pre-kit strip is written once. Deterministic.
 *
 *   npx tsx tools/apply-horizon.ts
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

const old: Img = decodePng(fs.readFileSync(STRIP));
if (old.h !== CELL) throw new Error(`strip height ${old.h} != ${CELL}`);
const BAK = STRIP.replace(/\.png$/, '.pre-horizon.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

const W = TILESET.length * CELL;
const strip: Img = { w: W, h: CELL, data: new Uint8Array(W * CELL * 4) };
for (let y = 0; y < CELL; y++) {
  strip.data.set(old.data.subarray(y * old.w * 4, y * old.w * 4 + old.w * 4), y * W * 4);
}

// NIGHT sky ramp (the plateau runs under the 2AM starfield parallax — the
// NIGHT palette ramp, dithered) + the moonlit forest-ridge silhouette
const SKY_HI = [12, 12, 28]; // zenith (meets the starfield)
const SKY_MID = [28, 32, 68];
const SKY_LO = [52, 56, 108]; // the pale glow just above the ridge
const CLOUD = [80, 100, 164]; // a dim night cloud (NIGHT 3)
const RIDGE = [16, 28, 20]; // the distant treeline mass, near-black
const RIDGE_LIT = [28, 64, 36]; // its moonlit crown (FOREST 0)
const cell = idx('horizon_ridge') * CELL;
function put(x: number, y: number, rgb: number[]): void {
  const d = (y * strip.w + cell + x) * 4;
  strip.data[d] = rgb[0];
  strip.data[d + 1] = rgb[1];
  strip.data[d + 2] = rgb[2];
  strip.data[d + 3] = 255;
}

// ridge crown line: a gentle deterministic wobble (period 64 → seamless)
const crown = (x: number): number => 40 + Math.round(3 * Math.sin((x / 64) * Math.PI * 2) + 2 * Math.sin((x / 16) * Math.PI * 2));

for (let x = 0; x < CELL; x++) {
  const cy = crown(x);
  for (let y = 0; y < CELL; y++) {
    if (y >= cy) {
      // the ridge silhouette: lit crown pixels, dark mass below
      put(x, y, y <= cy + 2 ? RIDGE_LIT : RIDGE);
      continue;
    }
    // checker-dithered sky gradient (EB's signature, never a smooth wash)
    let base = SKY_HI;
    let next = SKY_HI;
    if (y >= 28) {
      base = SKY_LO;
      next = SKY_LO;
    } else if (y >= 12) {
      base = SKY_MID;
      next = y >= 22 ? SKY_LO : SKY_MID;
    } else if (y >= 8) {
      base = SKY_HI;
      next = SKY_MID;
    }
    put(x, y, (x + y) % 2 === 0 ? base : next);
  }
}
// one small EB cloud fleck (flat white, hard edges), clear of the tile borders
for (const [cx, cyy, w] of [
  [18, 14, 10],
  [20, 12, 6],
] as const) {
  for (let x = cx; x < cx + w; x++) {
    put(x, cyy, CLOUD);
    put(x, cyy + 1, CLOUD);
  }
}

fs.writeFileSync(STRIP, encodePng(strip));
console.log(`horizon_ridge baked at tile ${idx('horizon_ridge')} (char '5'). strip ${old.w}px -> ${W}px. backup: ${BAK.split(/[\\/]/).pop()}`);
