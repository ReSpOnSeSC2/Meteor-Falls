import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { TILESET } from '../src/spritegen/tiles';
import { decodePng, encodePng, makeImg } from './imageio';

const srcPath = process.argv[2] ?? 'assets/art/review/world_replacement_tiles_preview.png';
const outPath = process.argv[3] ?? 'assets/art/world/otterbrook_tiles_16.png';

const GRID_COLS = 16;
const SOURCE_PITCH = 70;
const SOURCE_CELL = 64;
const SOURCE_PAD = Math.floor((SOURCE_PITCH - SOURCE_CELL) / 2);
const OUT_CELL = 64;

const src = decodePng(readFileSync(srcPath));
const frames = TILESET.length;
const rows = Math.ceil(frames / GRID_COLS);

if (src.w < GRID_COLS * SOURCE_PITCH || src.h < rows * SOURCE_PITCH) {
  throw new Error(
    `source grid ${src.w}x${src.h} is too small for ${frames} tiles (${GRID_COLS} cols, ${rows} rows)`,
  );
}

const out = makeImg(frames * OUT_CELL, OUT_CELL);
for (let i = 0; i < frames; i++) {
  const sx0 = (i % GRID_COLS) * SOURCE_PITCH + SOURCE_PAD;
  const sy0 = Math.floor(i / GRID_COLS) * SOURCE_PITCH + SOURCE_PAD;
  const dx0 = i * OUT_CELL;
  for (let y = 0; y < OUT_CELL; y++) {
    for (let x = 0; x < OUT_CELL; x++) {
      const so = ((sy0 + y) * src.w + sx0 + x) * 4;
      const do2 = (y * out.w + dx0 + x) * 4;
      out.data[do2] = src.data[so];
      out.data[do2 + 1] = src.data[so + 1];
      out.data[do2 + 2] = src.data[so + 2];
      out.data[do2 + 3] = src.data[so + 3];
    }
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, encodePng(out));
console.log(`packed ${frames} world tiles (${OUT_CELL}px) -> ${outPath} (${out.w}x${out.h})`);
