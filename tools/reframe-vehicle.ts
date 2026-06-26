/**
 * tools/reframe-vehicle.ts — give a vehicle sheet proper interior margin so its art
 * stops reading as CUT OFF against the frame edge. Some vehicle PNGs were sliced too
 * tight when authored (e.g. savanna_caravan_truck — the roof cargo is flush at the top,
 * margin 0), so in traffic the model looks clipped. This rescales the content inside
 * each of the 4 frames (uniform, alpha-weighted downscale — no distortion) and recenters
 * it with a top/bottom margin, in place. It CANNOT restore pixels the original slice
 * already cut (a flat-topped load stays flat) — for that, re-author the vehicle via
 * ChatGPT — but it removes the jammed-against-the-edge clipping. Re-runnable.
 *
 * Run:  npx vite-node tools/reframe-vehicle.ts <vehicle_id> [topMargin=8] [botMargin=5]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePng, encodePng, makeImg } from './imageio';

const id = process.argv[2];
if (!id) throw new Error('usage: reframe-vehicle <vehicle_id> [topMargin] [botMargin]');
const topMargin = Number(process.argv[3] ?? 8);
const botMargin = Number(process.argv[4] ?? 5);
const PATH = `assets/art/vehicles/${id}.png`;

const src = decodePng(readFileSync(PATH));
const fw = Math.floor(src.w / 4);
const fh = src.h;
const out = makeImg(src.w, src.h); // same dims; only the in-frame placement changes

for (let fr = 0; fr < 4; fr++) {
  const fx0 = fr * fw;
  // 1) content bbox inside this frame
  let minX = fw, minY = fh, maxX = -1, maxY = -1;
  for (let y = 0; y < fh; y++) {
    for (let lx = 0; lx < fw; lx++) {
      if (src.data[(y * src.w + fx0 + lx) * 4 + 3] > 8) {
        if (lx < minX) minX = lx;
        if (lx > maxX) maxX = lx;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) continue;
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  // 2) uniform scale so the content fits the frame with the requested margins
  const scale = Math.min((fh - topMargin - botMargin) / ch, (fw - 8) / cw, 1);
  const sw = Math.max(1, Math.round(cw * scale));
  const sh = Math.max(1, Math.round(ch * scale));
  const offX = fx0 + Math.round((fw - sw) / 2); // centered horizontally
  const offY = topMargin + Math.round(((fh - topMargin - botMargin) - sh) / 2);
  // 3) alpha-weighted area-average downscale of the content box into place
  for (let oy = 0; oy < sh; oy++) {
    for (let ox = 0; ox < sw; ox++) {
      const bx0 = minX + Math.floor(ox / scale);
      const bx1 = minX + Math.floor((ox + 1) / scale);
      const by0 = minY + Math.floor(oy / scale);
      const by1 = minY + Math.floor((oy + 1) / scale);
      let pr = 0, pg = 0, pb = 0, sa = 0, n = 0;
      for (let yy = by0; yy <= Math.min(by1, maxY); yy++) {
        for (let xx = bx0; xx <= Math.min(bx1, maxX); xx++) {
          const i = (yy * src.w + fx0 + xx) * 4;
          const a = src.data[i + 3];
          pr += src.data[i] * a; pg += src.data[i + 1] * a; pb += src.data[i + 2] * a;
          sa += a; n++;
        }
      }
      const d = ((offY + oy) * out.w + offX + ox) * 4;
      const avgA = n > 0 ? sa / n : 0;
      if (avgA < 8 || sa === 0) { out.data[d + 3] = 0; }
      else {
        out.data[d] = Math.round(pr / sa);
        out.data[d + 1] = Math.round(pg / sa);
        out.data[d + 2] = Math.round(pb / sa);
        out.data[d + 3] = Math.round(avgA);
      }
    }
  }
}

writeFileSync(PATH, encodePng(out));
console.log(`reframed ${id} (top=${topMargin} bot=${botMargin}) -> ${PATH} (${out.w}x${out.h})`);
