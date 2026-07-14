/**
 * Append/refresh the two generated Oak Cave material cells in the global
 * authored world-tile strip while preserving every established column byte for
 * byte. Run after process-ch1-venue-cave-kit.cjs.
 *
 *   node_modules\\.bin\\vite-node.cmd tools/sync-oak-cave-tiles.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { TILESET } from '../src/spritegen/tiles';
import { decodePng, encodePng, makeImg } from './imageio';

const LIVE = 'assets/art/world/otterbrook_tiles_16.png';
const SOURCE = 'assets/art/world/OakCave_tiles_16.png';
const NAMES = ['oak_cave_floor', 'oak_cave_wall'] as const;
const firstNew = TILESET.length - NAMES.length;

NAMES.forEach((name, index) => {
  const actual = TILESET[firstNew + index]?.name;
  if (actual !== name) throw new Error(`expected ${name} at TILESET[${firstNew + index}], got ${actual}`);
});

const live = decodePng(readFileSync(LIVE));
const source = decodePng(readFileSync(SOURCE));
const cell = live.h;
if (cell !== 64 || source.w !== 128 || source.h !== 64) {
  throw new Error(`expected live height 64 and cave source 128x64; got ${live.w}x${live.h}, ${source.w}x${source.h}`);
}
if (live.w < firstNew * cell) throw new Error(`live strip is too narrow to preserve ${firstNew} columns`);

const out = makeImg(TILESET.length * cell, cell);
for (let y = 0; y < cell; y++) {
  for (let x = 0; x < firstNew * cell; x++) {
    const si = (y * live.w + x) * 4;
    const di = (y * out.w + x) * 4;
    out.data.set(live.data.subarray(si, si + 4), di);
  }
  for (let x = 0; x < source.w; x++) {
    const si = (y * source.w + x) * 4;
    const di = (y * out.w + firstNew * cell + x) * 4;
    out.data.set(source.data.subarray(si, si + 4), di);
  }
}

writeFileSync(LIVE, encodePng(out));
console.log(`synced Oak Cave tiles at columns ${firstNew}-${TILESET.length - 1} -> ${LIVE}`);
