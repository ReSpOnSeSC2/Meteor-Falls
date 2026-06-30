/**
 * tools/compose-ch10-tiles.ts — build the Ch.10 region tile strips (the AUTHORED
 * partial-override art) from the ChatGPT source textures.
 *
 * Each region has three 1254×1254 seamless ChatGPT textures in
 * assets/art/masters/generated/<region>_{ground,path,wall}_src.png. This packs them
 * (area/box-filter downscaled to one runtime cell each) into a 3-cell strip
 * assets/art/world/<Region>_tiles_16.png laid out [ground, path, wall] — the exact
 * shape China_tiles_16.png / Romania_tiles_16.png already use (192×64, wired in
 * spritegen/authored.ts as <REGION>_TILE_ART and drawn over the matching appended
 * TILESET cells by drawAuthoredTileStrip). The runtime LOOK comes from this PNG; the
 * TILESET fallback painters (synced into otterbrook_tiles_16.png) only show if it fails
 * to load. Re-runnable/idempotent.
 *
 * Run:  npx vite-node tools/compose-ch10-tiles.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

const CELL = 64; // runtime tile size (ART_SCALE 4)
const KINDS = ['ground', 'path', 'wall'] as const;
const REGIONS: ReadonlyArray<{ region: string; out: string }> = [
  { region: 'aurora', out: 'Aurora_tiles_16.png' },
  { region: 'lani', out: 'Lani_tiles_16.png' },
  { region: 'mars', out: 'Mars_tiles_16.png' },
];

/** area (box-filter) downscale to size×size — averages each source block so the 64px
 *  cell keeps the texture's overall tone instead of nearest-neighbor sparkle. */
function boxDownscale(src: Img, size: number): Img {
  const out = makeImg(size, size);
  const sx = src.w / size;
  const sy = src.h / size;
  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      const x0 = Math.floor(tx * sx);
      const x1 = Math.max(x0 + 1, Math.min(src.w, Math.floor((tx + 1) * sx)));
      const y0 = Math.floor(ty * sy);
      const y1 = Math.max(y0 + 1, Math.min(src.h, Math.floor((ty + 1) * sy)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const s = (y * src.w + x) * 4;
          r += src.data[s]; g += src.data[s + 1]; b += src.data[s + 2]; a += src.data[s + 3];
          n++;
        }
      }
      const d = (ty * size + tx) * 4;
      out.data[d] = Math.round(r / n);
      out.data[d + 1] = Math.round(g / n);
      out.data[d + 2] = Math.round(b / n);
      out.data[d + 3] = Math.round(a / n);
    }
  }
  return out;
}

for (const { region, out } of REGIONS) {
  const strip = makeImg(CELL * KINDS.length, CELL);
  KINDS.forEach((kind, c) => {
    const srcPath = `assets/art/masters/generated/${region}_${kind}_src.png`;
    const cell = boxDownscale(decodePng(readFileSync(srcPath)), CELL);
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const s = (y * CELL + x) * 4;
        const d = (y * strip.w + c * CELL + x) * 4;
        strip.data[d] = cell.data[s];
        strip.data[d + 1] = cell.data[s + 1];
        strip.data[d + 2] = cell.data[s + 2];
        strip.data[d + 3] = 0xff; // tiles are fully opaque ground
      }
    }
  });
  const outPath = `assets/art/world/${out}`;
  writeFileSync(outPath, encodePng(strip));
  console.log(`composed ${region} -> ${outPath} (${strip.w}x${strip.h}, 3 cells of ${CELL}px)`);
}
