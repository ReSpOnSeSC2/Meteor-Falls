/**
 * Fit a sliced facade PNG to its catalog aspect (nearest-neighbour height
 * resample). The engine width-anchors every generated-catalog facade
 * (worldSpriteScale: footW*RT_TILE/texW), so display HEIGHT follows the PNG's
 * aspect — art whose aspect drifts from the procedural canvas
 * (wallTiles*16+2 × 44+upperRows*16) would sink below / float above the
 * baseline the map placed it against. This pins the aspect exactly.
 *
 *   node tools/fit-facade-aspect.cjs <png> <nativeW> <nativeH>
 *
 * Keeps the PNG's width; height becomes round(width * nativeH / nativeW).
 */
const fs = require('node:fs');
const { PNG } = require('pngjs');

const [file, wArg, hArg] = process.argv.slice(2);
if (!file || !wArg || !hArg) {
  console.error('usage: node tools/fit-facade-aspect.cjs <png> <nativeW> <nativeH>');
  process.exit(1);
}
const natW = Number(wArg);
const natH = Number(hArg);
const src = PNG.sync.read(fs.readFileSync(file));
const outH = Math.round((src.width * natH) / natW);
if (outH === src.height) {
  console.log(`${file}: ${src.width}x${src.height} already fits ${natW}:${natH}`);
  process.exit(0);
}
const out = new PNG({ width: src.width, height: outH });
for (let y = 0; y < outH; y++) {
  const sy = Math.min(src.height - 1, Math.floor((y * src.height) / outH));
  for (let x = 0; x < src.width; x++) {
    const si = (sy * src.width + x) * 4;
    const di = (y * src.width + x) * 4;
    out.data[di] = src.data[si];
    out.data[di + 1] = src.data[si + 1];
    out.data[di + 2] = src.data[si + 2];
    out.data[di + 3] = src.data[si + 3];
  }
}
fs.writeFileSync(file, PNG.sync.write(out));
console.log(`${file}: ${src.width}x${src.height} -> ${src.width}x${outH} (aspect ${natW}:${natH})`);
