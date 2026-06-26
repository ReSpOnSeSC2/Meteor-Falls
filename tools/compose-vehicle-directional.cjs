/**
 * tools/compose-vehicle-directional.cjs — build a 3-frame DIRECTIONAL vehicle
 * sheet [side, front, back] from the existing authored side sheet + two authored
 * oblique views (front 3/4 and rear 3/4). ADR-097's traffic design TURNS a car by
 * swapping these frames instead of rotating a 3/4 sprite, killing the vertical-lane
 * skew. Frame 0 (side) is taken VERBATIM from the existing sheet (preserve the look);
 * the front/back are alpha-cropped, scaled to match the SIDE car's content height,
 * and bottom-aligned + centered into the same frame box, so the car keeps one size
 * and one ground line as it turns.
 *
 *   node tools/compose-vehicle-directional.cjs <existingSheet.png> <frontKeyed.png> <backKeyed.png> <out.png>
 *
 * The existing sheet is the 4-motion-frame side sheet (frame 0 is used). front/back
 * must already be magenta-keyed to transparent (tools/slice-chroma.js).
 */
const { PNG } = require('pngjs');
const fs = require('fs');

const [, , sheetPath, frontPath, backPath, outPath] = process.argv;
if (!sheetPath || !frontPath || !backPath || !outPath) {
  console.error('usage: node tools/compose-vehicle-directional.cjs <sheet> <frontKeyed> <backKeyed> <out>');
  process.exit(1);
}
const load = (p) => PNG.sync.read(fs.readFileSync(p));
function bbox(img) {
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 16) {
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// 1) extract frame 0 (the side view) from the existing 4-frame sheet, verbatim.
//    Round the frame width UP to a multiple of 4 so the 3-frame sheet width stays
//    on the 4px ART_SCALE grid (pkg07_assets.test.ts pins width % 4 === 0).
const sheet = load(sheetPath);
const origFW = Math.round(sheet.width / 4);
const FW = Math.ceil(origFW / 4) * 4;
const FH = sheet.height;
const side = new PNG({ width: FW, height: FH });
for (let i = 0; i < side.data.length; i++) side.data[i] = 0;
const sideOffX = Math.floor((FW - origFW) / 2);
for (let y = 0; y < FH; y++) for (let x = 0; x < origFW; x++) {
  const si = (y * sheet.width + x) * 4, di = (y * FW + (sideOffX + x)) * 4;
  side.data[di] = sheet.data[si]; side.data[di + 1] = sheet.data[si + 1];
  side.data[di + 2] = sheet.data[si + 2]; side.data[di + 3] = sheet.data[si + 3];
}
const sb = bbox(side);           // the side car's content box
const carH = sb.h;               // target height to match
const groundY = sb.maxY;         // wheel line within the frame

// 2) scale a keyed view to carH, bottom at groundY, centered X, into an FW×FH frame
function placeView(p) {
  const v = load(p);
  const vb = bbox(v);
  const scale = carH / vb.h;
  const nw = Math.max(1, Math.round(vb.w * scale));
  const nh = Math.max(1, Math.round(vb.h * scale));
  const frame = new PNG({ width: FW, height: FH });
  for (let i = 0; i < frame.data.length; i++) frame.data[i] = 0;
  const offX = Math.round((FW - nw) / 2);
  const offY = groundY - nh + 1;
  for (let oy = 0; oy < nh; oy++) for (let ox = 0; ox < nw; ox++) {
    const sx0 = vb.minX + Math.floor(ox / scale), sx1 = vb.minX + Math.floor((ox + 1) / scale);
    const sy0 = vb.minY + Math.floor(oy / scale), sy1 = vb.minY + Math.floor((oy + 1) / scale);
    let pr = 0, pg = 0, pb = 0, sa = 0, n = 0;
    for (let yy = sy0; yy <= Math.min(sy1, vb.maxY); yy++) for (let xx = sx0; xx <= Math.min(sx1, vb.maxX); xx++) {
      const i = (yy * v.width + xx) * 4; const a = v.data[i + 3];
      pr += v.data[i] * a; pg += v.data[i + 1] * a; pb += v.data[i + 2] * a; sa += a; n++;
    }
    const dx = offX + ox, dy = offY + oy; if (dx < 0 || dy < 0 || dx >= FW || dy >= FH) continue;
    const di = (dy * FW + dx) * 4; const avgA = n > 0 ? sa / n : 0;
    if (avgA < 8 || sa === 0) { frame.data[di + 3] = 0; }
    else { frame.data[di] = Math.round(pr / sa); frame.data[di + 1] = Math.round(pg / sa); frame.data[di + 2] = Math.round(pb / sa); frame.data[di + 3] = Math.round(avgA); }
  }
  return frame;
}
const front = placeView(frontPath);
const back = placeView(backPath);

// 3) compose [side, front, back] → 3 equal frames
const out = new PNG({ width: FW * 3, height: FH });
const blit = (frame, fx) => {
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const si = (y * FW + x) * 4, di = (y * (FW * 3) + (fx + x)) * 4;
    out.data[di] = frame.data[si]; out.data[di + 1] = frame.data[si + 1];
    out.data[di + 2] = frame.data[si + 2]; out.data[di + 3] = frame.data[si + 3];
  }
};
blit(side, 0); blit(front, FW); blit(back, FW * 2);
fs.writeFileSync(outPath, PNG.sync.write(out));
console.log(`wrote ${outPath} ${FW * 3}x${FH} — 3 frames of ${FW}x${FH} (side carH=${carH}, groundY=${groundY})`);
