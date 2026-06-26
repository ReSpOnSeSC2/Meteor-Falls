/**
 * tools/sync-minimus-tiles.ts — append (or refresh) the PKG-12 §A11 MINIMUS region
 * tiles (minimus_turf / minimus_hedge / minimus_cobble) as the trailing columns of the
 * runtime world-tile strip (assets/art/world/otterbrook_tiles_16.png).
 *
 * WHY: the otterbrook strip overrides the procedural atlas 1:1 for EVERY TILESET index
 * (WORLD_TILE_ART.names = TILESET.map(name)), so appending tiles to TILESET requires the
 * strip to grow matching columns or it (a) fails the size pin (authored_assets.test.ts:
 * w === TILESET.length*64) and (b) misaligns every column. Same SURGICAL contract as
 * tools/sync-melt-ice-tile.ts: keep every existing column byte-for-byte (never re-pack —
 * that clobbers the hand-authored fence tiles) and (re)write only the trailing N columns
 * from each tile's procedural fallback painter (the boot source of truth). The real
 * Minimus look comes from Minimus_tiles_16.png at runtime (a partial-override strip wired
 * in spritegen/authored.ts); these fallback columns only show if that PNG fails to load.
 * Re-runnable/idempotent.
 *
 * Run:  npx vite-node tools/sync-minimus-tiles.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { TILESET } from '../src/spritegen/tiles';
import { PALETTE, T } from '../src/palette';
import { decodePng, encodePng, makeImg } from './imageio';

const STRIP = 'assets/art/world/otterbrook_tiles_16.png';
const NEW_TILES = ['minimus_turf', 'minimus_hedge', 'minimus_cobble'] as const;

// the Minimus tiles must be the LAST N entries of TILESET, in this order
const firstNew = TILESET.length - NEW_TILES.length;
NEW_TILES.forEach((name, i) => {
  const got = TILESET[firstNew + i]?.name;
  if (got !== name) {
    throw new Error(`expected '${name}' at TILESET[${firstNew + i}], got '${got}'`);
  }
});

const live = decodePng(readFileSync(STRIP));
const cell = live.h; // runtime tile size (64px at ART_SCALE 4)
const scale = Math.max(1, Math.floor(cell / 16)); // 16px native painter -> runtime cell
const keepCols = firstNew; // every tile before the first Minimus tile keeps its column
if (live.w < keepCols * cell) {
  throw new Error(`strip ${live.w}x${live.h} too small to keep ${keepCols} columns`);
}

const out = makeImg(TILESET.length * cell, cell);

// 1) copy every existing column byte-for-byte (preserves authored fence/melt_ice tiles)
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

// 2) render each new fallback painter into its trailing column (nearest-neighbor upscale)
for (let c = 0; c < NEW_TILES.length; c++) {
  const pm = TILESET[firstNew + c].make(); // 16x16 palette-index Pixmap
  const dx0 = (keepCols + c) * cell;
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
}

writeFileSync(STRIP, encodePng(out));
console.log(`synced ${NEW_TILES.length} Minimus tiles (cols ${keepCols}..${TILESET.length - 1}) -> ${STRIP} (${out.w}x${out.h})`);
