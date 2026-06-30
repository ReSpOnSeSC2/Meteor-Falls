/**
 * Cover-fit a source image (e.g. a ChatGPT-authored screen illustration) into a
 * runtime full-screen background at the game's 1600x900 (ART_SCALE=4) resolution.
 * Unlike the legacy 400x225 screen art, this keeps the art HI-RES so it renders
 * crisp 1:1 under SaveSlotsScene's setDisplaySize(1600,900) (no ×4 upscale blur).
 *
 * Cover (not contain): scale so the image fills the frame, center-crop the
 * overflow — no letterbox bars. Bilinear sampling (good for the mild up/down
 * mix from a 1024²/1536×1024 source to 1600×900).
 *
 *   node tools/fit-screen-bg.js <src.png> <out.png> [W=1600] [H=900]
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , src, out, wArg, hArg] = process.argv;
if (!src || !out) {
  console.error('usage: node tools/fit-screen-bg.js <src.png> <out.png> [W=1600] [H=900]');
  process.exit(1);
}
const TW = Number(wArg) || 1600;
const TH = Number(hArg) || 900;

const srcPng = PNG.sync.read(fs.readFileSync(src));
const { width: SW, height: SH, data: sd } = srcPng;
const dstPng = new PNG({ width: TW, height: TH });
const dd = dstPng.data;

// cover: the larger of the two ratios fills both axes; center the crop.
const scale = Math.max(TW / SW, TH / SH);
const scaledW = SW * scale;
const scaledH = SH * scale;
const cropX = (scaledW - TW) / 2;
const cropY = (scaledH - TH) / 2;

const sample = (sx, sy, ch) => {
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, SW - 1);
  const y1 = Math.min(y0 + 1, SH - 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const i00 = (y0 * SW + x0) * 4 + ch;
  const i10 = (y0 * SW + x1) * 4 + ch;
  const i01 = (y1 * SW + x0) * 4 + ch;
  const i11 = (y1 * SW + x1) * 4 + ch;
  const top = sd[i00] * (1 - fx) + sd[i10] * fx;
  const bot = sd[i01] * (1 - fx) + sd[i11] * fx;
  return top * (1 - fy) + bot * fy;
};

for (let ty = 0; ty < TH; ty++) {
  for (let tx = 0; tx < TW; tx++) {
    const sx = Math.min(Math.max((tx + cropX) / scale, 0), SW - 1);
    const sy = Math.min(Math.max((ty + cropY) / scale, 0), SH - 1);
    const di = (ty * TW + tx) * 4;
    dd[di] = Math.round(sample(sx, sy, 0));
    dd[di + 1] = Math.round(sample(sx, sy, 1));
    dd[di + 2] = Math.round(sample(sx, sy, 2));
    dd[di + 3] = 255;
  }
}

fs.writeFileSync(out, PNG.sync.write(dstPng));
console.log(`fit ${SW}x${SH} -> ${TW}x${TH}  ${out}`);
