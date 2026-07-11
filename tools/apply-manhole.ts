/**
 * tools/apply-manhole.ts — bake the EB INTERSECTION KIT manhole cover into the
 * authored strip (the 'manhole' tile registered at the TILESET tail, grid char
 * '4'). DERIVED: the cell starts as a copy of the CURRENT recolored 'road'
 * cell so the cover always sits on exactly the shipped asphalt, then a round
 * lid is drawn over it — dark contact outline, warm iron lid a step darker
 * than the asphalt, a rim ring, a soft top-left light, and two pick slots.
 *
 * SURGICAL + IDEMPOTENT: only the manhole column is (re)written; a .bak of
 * the pre-kit strip is written once. Deterministic (no RNG).
 *
 *   npx tsx tools/apply-manhole.ts
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
const BAK = STRIP.replace(/\.png$/, '.pre-manhole.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

// grow to the registry width (size-pin law)
const W = TILESET.length * CELL;
const strip: Img = { w: W, h: CELL, data: new Uint8Array(W * CELL * 4) };
for (let y = 0; y < CELL; y++) {
  strip.data.set(old.data.subarray(y * old.w * 4, y * old.w * 4 + old.w * 4), y * W * 4);
}

const OUTLINE = [64, 58, 46]; // contact ring (the curb FOOT tone)
const LID = [138, 132, 116]; // iron lid, a clear step darker than the asphalt
const LID_DK = [118, 112, 96]; // lower-right shade
const RING = [96, 90, 76]; // inner ring groove
const LIT = [176, 170, 150]; // top-left light
const SLOT = [84, 78, 64]; // pick slots

const roadCell = idx('road') * CELL;
const manholeCell = idx('manhole') * CELL;
function put(x: number, y: number, rgb: number[]): void {
  const d = (y * strip.w + manholeCell + x) * 4;
  strip.data[d] = rgb[0];
  strip.data[d + 1] = rgb[1];
  strip.data[d + 2] = rgb[2];
  strip.data[d + 3] = 255;
}

// 1) asphalt bed — copy the shipped road cell
for (let y = 0; y < CELL; y++) {
  const src = (y * strip.w + roadCell) * 4;
  strip.data.set(strip.data.subarray(src, src + CELL * 4), (y * strip.w + manholeCell) * 4);
}

// 2) the lid — slightly squashed disc (oblique ground), centered
const CX = 32;
const CY = 33;
const RX = 21;
const RY = 17;
for (let y = 0; y < CELL; y++) {
  for (let x = 0; x < CELL; x++) {
    const dx = (x - CX) / RX;
    const dy = (y - CY) / RY;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > 1) continue;
    if (r > 0.88) {
      put(x, y, OUTLINE);
      continue;
    }
    // base lid with a lower-right shade and a top-left light
    let rgb = LID;
    if (dx + dy > 0.55) rgb = LID_DK;
    if (dx + dy < -0.72) rgb = LIT;
    // rim groove ring
    if (r > 0.66 && r <= 0.76) rgb = RING;
    put(x, y, rgb);
  }
}
// 3) two pick slots, EB-simple
for (let x = CX - 7; x <= CX - 3; x++) put(x, CY, SLOT);
for (let x = CX + 3; x <= CX + 7; x++) put(x, CY, SLOT);

fs.writeFileSync(STRIP, encodePng(strip));
console.log(`manhole baked at tile ${idx('manhole')} (char '4'). strip ${old.w}px -> ${W}px. backup: ${BAK.split(/[\\/]/).pop()}`);
