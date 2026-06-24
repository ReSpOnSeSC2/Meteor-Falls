/**
 * tools/sync-melt-ice-tile.ts — append (or refresh) the §A4.11 frozen-meltfall
 * ICE tile as the last column of the runtime world-tile strip
 * (assets/art/world/otterbrook_tiles_16.png).
 *
 * WHY a bespoke tool instead of tools/pack-world-tiles.ts: the live strip carries
 * hand-authored tiles (fence_h/fence_v) that the review grid does NOT reproduce,
 * so a full re-pack would clobber them. This tool is SURGICAL — it preserves
 * every existing column byte-for-byte and only (re)writes the trailing ice
 * column, rendered from the procedural meltIceTile() painter (the boot-fallback
 * source of truth, so the strip override and the fallback always match).
 * Re-runnable/idempotent: it keeps the first (TILESET.length-1) columns and
 * re-appends a fresh ice column each run.
 *
 * Run:  npx vite-node tools/sync-melt-ice-tile.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { TILESET, tileIndexByName } from '../src/spritegen/tiles';
import { PALETTE, T } from '../src/palette';
import { decodePng, encodePng, makeImg } from './imageio';

const STRIP = 'assets/art/world/otterbrook_tiles_16.png';

const iceIndex = tileIndexByName('melt_ice');
if (iceIndex !== TILESET.length - 1) {
  throw new Error(`melt_ice must be the LAST TILESET tile (got index ${iceIndex} of ${TILESET.length})`);
}

const live = decodePng(readFileSync(STRIP));
const cell = live.h; // runtime tile size (64px at ART_SCALE 4)
const scale = Math.max(1, Math.floor(cell / 16)); // 16px native painter -> runtime cell
const keepCols = iceIndex; // the non-ice tiles occupy columns 0..iceIndex-1
if (live.w < keepCols * cell) {
  throw new Error(`strip ${live.w}x${live.h} too small to keep ${keepCols} columns`);
}

const pm = TILESET[iceIndex].make(); // 16x16 palette-index Pixmap
const out = makeImg((keepCols + 1) * cell, cell);

// 1) copy every existing column byte-for-byte (preserves authored tiles)
for (let y = 0; y < cell; y++) {
  for (let x = 0; x < keepCols * cell; x++) {
    const s = (y * live.w + x) * 4;
    const d = (y * out.w + x) * 4;
    out.data[d] = live.data[s];
    out.data[d + 1] = live.data[s + 1];
    out.data[d + 2] = live.data[s + 2];
    out.data[d + 3] = live.data[s + 3];
  }
}

// 2) render the ice painter into the trailing column (nearest-neighbor upscale)
const dx0 = keepCols * cell;
for (let y = 0; y < cell; y++) {
  for (let x = 0; x < cell; x++) {
    const idx = pm.data[Math.floor(y / scale) * pm.w + Math.floor(x / scale)];
    const d = (y * out.w + dx0 + x) * 4;
    if (idx === T) {
      out.data[d + 3] = 0;
      continue;
    }
    const n = parseInt(PALETTE[idx].slice(1), 16);
    out.data[d] = (n >> 16) & 0xff;
    out.data[d + 1] = (n >> 8) & 0xff;
    out.data[d + 2] = n & 0xff;
    out.data[d + 3] = 0xff;
  }
}

writeFileSync(STRIP, encodePng(out));
console.log(`synced melt_ice as column ${iceIndex} -> ${STRIP} (${out.w}x${out.h})`);
