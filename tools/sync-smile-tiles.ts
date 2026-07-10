/**
 * Append/refresh the Department of Smiles' three trailing world-tile columns.
 *
 * The authored world strip overrides the procedural atlas by TILESET index, so
 * adding tiles requires growing that strip without repacking or altering any of
 * its hand-authored columns. This script copies the existing prefix byte-for-
 * byte and paints only the three procedural fallback columns at the tail.
 *
 * Run: npx vite-node tools/sync-smile-tiles.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { TILESET } from '../src/spritegen/tiles';
import { PALETTE, T } from '../src/palette';
import { decodePng, encodePng, makeImg } from './imageio';

const STRIP = 'assets/art/world/otterbrook_tiles_16.png';
const NEW_TILES = ['smile_floor', 'smile_wall', 'smile_carpet'] as const;
const firstNew = TILESET.length - NEW_TILES.length;

NEW_TILES.forEach((name, i) => {
  const got = TILESET[firstNew + i]?.name;
  if (got !== name) {
    throw new Error(`expected '${name}' at TILESET[${firstNew + i}], got '${got}'`);
  }
});

const live = decodePng(readFileSync(STRIP));
const cell = live.h;
const scale = Math.max(1, Math.floor(cell / 16));
if (live.w < firstNew * cell) {
  throw new Error(`strip ${live.w}x${live.h} too small to preserve ${firstNew} columns`);
}

const out = makeImg(TILESET.length * cell, cell);

for (let y = 0; y < cell; y++) {
  for (let x = 0; x < firstNew * cell; x++) {
    const s = (y * live.w + x) * 4;
    const d = (y * out.w + x) * 4;
    out.data[d] = live.data[s];
    out.data[d + 1] = live.data[s + 1];
    out.data[d + 2] = live.data[s + 2];
    out.data[d + 3] = live.data[s + 3];
  }
}

for (let c = 0; c < NEW_TILES.length; c++) {
  const pm = TILESET[firstNew + c].make();
  const dx0 = (firstNew + c) * cell;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const idx = pm.data[Math.floor(y / scale) * pm.w + Math.floor(x / scale)];
      const d = (y * out.w + dx0 + x) * 4;
      if (idx === T) {
        out.data[d + 3] = 0;
        continue;
      }
      const n = Number.parseInt(PALETTE[idx].slice(1), 16);
      out.data[d] = (n >> 16) & 0xff;
      out.data[d + 1] = (n >> 8) & 0xff;
      out.data[d + 2] = n & 0xff;
      out.data[d + 3] = 0xff;
    }
  }
}

writeFileSync(STRIP, encodePng(out));
console.log(
  `synced ${NEW_TILES.length} Smile tiles (cols ${firstNew}..${TILESET.length - 1}) -> ${STRIP} (${out.w}x${out.h})`,
);
