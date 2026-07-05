/**
 * tools/apply-canopy-tile.ts — install the authored Otterbrooke WOODS-CANOPY tile
 * into the live world tile strip, SURGICALLY (append-only; every existing column kept
 * byte-for-byte). Clone of tools/apply-cliff-kit.ts's strip-write.
 *
 * Source: one ChatGPT full-bleed top-down tree-canopy texture (no magenta needed) —
 *   assets/art/masters/world/otterbrook-canopy-source.png
 * It area-average downscales the whole texture to one 64×64 OPAQUE tile and writes it
 * at the imported TILESET index of 'tree_canopy' (the strip grows by that one column).
 * A .pre-canopy.bak.png of the strip is written first.
 *
 *   npx tsx tools/apply-canopy-tile.ts [src.png]
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const SRC = process.argv[2] || `${ROOT}assets/art/masters/world/otterbrook-canopy-source.png`;
const CELL = 64;

const read = (p: string): Img => decodePng(fs.readFileSync(p));

/** area-average downscale the WHOLE source to CELL×CELL, opaque (canopy is a solid mass). */
function scaleTo64(img: Img): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const { w, h } = img;
  for (let oy = 0; oy < CELL; oy++) {
    for (let ox = 0; ox < CELL; ox++) {
      const sx0 = Math.floor((ox * w) / CELL), sx1 = Math.max(sx0 + 1, Math.ceil(((ox + 1) * w) / CELL));
      const sy0 = Math.floor((oy * h) / CELL), sy1 = Math.max(sy0 + 1, Math.ceil(((oy + 1) * h) / CELL));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) {
        const i = (y * w + x) * 4;
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
      }
      const o = (oy * CELL + ox) * 4;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n); out[o + 3] = 255;
    }
  }
  return out;
}

const cell = scaleTo64(read(SRC));
const strip = read(STRIP);
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != 64`);
const idx = TILESET.findIndex((t) => t.name === 'tree_canopy');
if (idx < 0) throw new Error("tree_canopy not in TILESET — add the push in tiles.ts first");

const BAK = STRIP.replace(/\.png$/, '.pre-canopy.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);
const grown = makeImg(Math.max(TILESET.length * CELL, strip.w), CELL);
for (let y = 0; y < CELL; y++) grown.data.set(strip.data.subarray(y * strip.w * 4, (y + 1) * strip.w * 4), y * grown.w * 4);
const x0 = idx * CELL;
for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
  const s = (y * CELL + x) * 4, d = (y * grown.w + x0 + x) * 4;
  grown.data[d] = cell[s]; grown.data[d + 1] = cell[s + 1]; grown.data[d + 2] = cell[s + 2]; grown.data[d + 3] = 255;
}
fs.writeFileSync(STRIP, encodePng(grown));
console.log(`tree_canopy -> column ${idx}; strip now ${grown.w / CELL} cols (TILESET.length=${TILESET.length})`);
