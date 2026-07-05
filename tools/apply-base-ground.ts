/**
 * tools/apply-base-ground.ts — install the GAME-WIDE oblique BASE GROUND KIT into the tile
 * strip, SURGICALLY. Unlike apply-oblique-ground (which appended Otterbrooke-only ob_* tiles),
 * this OVERWRITES the SHARED base TILESET tiles in place, so every un-skinned map's ground
 * upgrades to the EarthBound oblique look at once.
 *
 * Source: one ChatGPT 4×4 magenta-gridded base-ground sheet:
 *   assets/art/masters/world/base-ground-oblique-source.png
 *     r0: grass / grass+flowers / tall-grass / asphalt
 *     r1: asphalt+dash / crosswalk / sidewalk / sidewalk+curb
 *     r2: sand / dirt+grass-edge / sandy / sand+water
 *     r3: sea water / dock planks / cobblestone / hedge
 *
 *   npx tsx tools/apply-base-ground.ts
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const SRC = `${ROOT}assets/art/masters/world/base-ground-oblique-source.png`;
const CELL = 64;

const read = (p: string): Img => decodePng(fs.readFileSync(p));
const isMag = (d: Uint8Array, i: number): boolean => d[i] > 190 && d[i + 2] > 190 && d[i + 1] < 130;

function spans(img: Img, axis: 'x' | 'y'): Array<[number, number]> {
  const N = axis === 'x' ? img.w : img.h, M = axis === 'x' ? img.h : img.w;
  const mag: boolean[] = [];
  for (let a = 0; a < N; a++) {
    let m = 0;
    for (let b = 0; b < M; b += 4) { const x = axis === 'x' ? a : b, y = axis === 'x' ? b : a; if (isMag(img.data, (y * img.w + x) * 4)) m++; }
    mag.push(m / Math.ceil(M / 4) > 0.8);
  }
  const out: Array<[number, number]> = []; let s = -1;
  for (let a = 0; a < N; a++) { if (!mag[a] && s < 0) s = a; else if (mag[a] && s >= 0) { if (a - s > CELL) out.push([s, a]); s = -1; } }
  if (s >= 0 && N - s > CELL) out.push([s, N]);
  return out;
}

function cellTo64(img: Img, x0: number, x1: number, y0: number, y1: number): Uint8Array {
  const out = new Uint8Array(CELL * CELL * 4);
  const cw = x1 - x0, ch = y1 - y0, inset = Math.round(Math.min(cw, ch) * 0.04);
  for (let oy = 0; oy < CELL; oy++) for (let ox = 0; ox < CELL; ox++) {
    const sx0 = x0 + inset + Math.floor((ox / CELL) * (cw - 2 * inset));
    const sx1 = x0 + inset + Math.max(Math.floor(((ox + 1) / CELL) * (cw - 2 * inset)), Math.floor((ox / CELL) * (cw - 2 * inset)) + 1);
    const sy0 = y0 + inset + Math.floor((oy / CELL) * (ch - 2 * inset));
    const sy1 = y0 + inset + Math.max(Math.floor(((oy + 1) / CELL) * (ch - 2 * inset)), Math.floor((oy / CELL) * (ch - 2 * inset)) + 1);
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { const i = (y * img.w + x) * 4; if (isMag(img.data, i)) continue; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; }
    const o = (oy * CELL + ox) * 4;
    if (n > 0) { out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n); }
    out[o + 3] = 255;
  }
  return out;
}

const src = read(SRC);
const xs = spans(src, 'x'), ys = spans(src, 'y');
if (xs.length < 4 || ys.length < 4) throw new Error(`expected a 4×4 grid, got ${xs.length}×${ys.length}`);
const cells: Uint8Array[] = [];
for (let ry = 0; ry < 4; ry++) for (let rx = 0; rx < 4; rx++) cells.push(cellTo64(src, xs[rx][0], xs[rx][1], ys[ry][0], ys[ry][1]));

// cell index → EXISTING base tile name to overwrite (row-major 4×4)
const MAP: Record<string, number> = {
  grass_a: 0, grass_b: 1, grass_tuft: 2, road: 3, road_dash: 4, crosswalk: 5, sidewalk: 6,
  sand_a: 8, sea_a: 12, dock: 13, plaza: 14,
};
const idxOf = (name: string): number => { const i = TILESET.findIndex((t) => t.name === name); if (i < 0) throw new Error(`base tile ${name} not in TILESET`); return i; };

const strip = read(STRIP);
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != 64`);
const BAK = STRIP.replace(/\.png$/, '.pre-base-ground.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);
const grown = makeImg(Math.max(TILESET.length * CELL, strip.w), CELL);
for (let y = 0; y < CELL; y++) grown.data.set(strip.data.subarray(y * strip.w * 4, (y + 1) * strip.w * 4), y * grown.w * 4);
const writeCol = (idx: number, cell: Uint8Array): void => {
  const x0 = idx * CELL;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const s = (y * CELL + x) * 4, d = (y * grown.w + x0 + x) * 4; grown.data[d] = cell[s]; grown.data[d + 1] = cell[s + 1]; grown.data[d + 2] = cell[s + 2]; grown.data[d + 3] = 255; }
};
for (const [name, ci] of Object.entries(MAP)) writeCol(idxOf(name), cells[ci]);
fs.writeFileSync(STRIP, encodePng(grown));
console.log(`base ground installed (global): overwrote ${Object.keys(MAP).join(', ')}`);
