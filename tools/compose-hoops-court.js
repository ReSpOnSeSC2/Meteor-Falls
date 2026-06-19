/**
 * Compose an authored TOP-DOWN court illustration into the engine's side-view
 * court texture, matching drawCageCourt()'s exact layout so the rim/player/camera
 * coordinate system (PAD-based) is unchanged. The authored art is area-resized
 * into the INBOUNDS rect; the COURT_PAD margin is filled with the court's own
 * border colour (a dark asphalt apron). Output replaces `cage_court`.
 *
 *   node tools/compose-hoops-court.js <src.png> <out.png>
 *
 * Geometry mirrors src/spritegen/athletes.ts (COURT_PAD=34, drawCageCourt size)
 * and src/hoops/court.ts (COURT.W=672, COURT.H=368) at ART_SCALE=4.
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , src, out] = process.argv;
if (!src || !out) {
  console.error('usage: node tools/compose-hoops-court.js <src.png> <out.png>');
  process.exit(1);
}

const ART_SCALE = 4;
const COURT_W = 672;
const COURT_H = 368;
const PAD = 34;
const TW = (COURT_W + PAD * 2) * ART_SCALE; // 2960
const TH = (COURT_H + PAD * 2) * ART_SCALE; // 1744
const IX = PAD * ART_SCALE; // 136
const IY = PAD * ART_SCALE; // 136
const IW = COURT_W * ART_SCALE; // 2688
const IH = COURT_H * ART_SCALE; // 1472

const s = PNG.sync.read(fs.readFileSync(src));
const o = new PNG({ width: TW, height: TH });

// margin colour = average of the source's top/bottom border rows (dark asphalt)
let ar = 0, ag = 0, ab = 0, an = 0;
for (let x = 0; x < s.width; x++) {
  for (const yy of [0, 1, 2, s.height - 1, s.height - 2, s.height - 3]) {
    const i = (yy * s.width + x) * 4;
    ar += s.data[i]; ag += s.data[i + 1]; ab += s.data[i + 2]; an++;
  }
}
const mr = Math.round(ar / an), mg = Math.round(ag / an), mb = Math.round(ab / an);
for (let p = 0; p < TW * TH; p++) {
  o.data[p * 4] = mr; o.data[p * 4 + 1] = mg; o.data[p * 4 + 2] = mb; o.data[p * 4 + 3] = 255;
}

// area-average resize the authored court into the inbounds rect
const sx = s.width / IW;
const sy = s.height / IH;
for (let y = 0; y < IH; y++) {
  for (let x = 0; x < IW; x++) {
    const x0 = Math.floor(x * sx), x1 = Math.min(s.width, Math.floor((x + 1) * sx) + 1);
    const y0 = Math.floor(y * sy), y1 = Math.min(s.height, Math.floor((y + 1) * sy) + 1);
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * s.width + xx) * 4;
        r += s.data[i]; g += s.data[i + 1]; b += s.data[i + 2]; n++;
      }
    }
    const j = ((IY + y) * TW + (IX + x)) * 4;
    o.data[j] = Math.round(r / n); o.data[j + 1] = Math.round(g / n); o.data[j + 2] = Math.round(b / n); o.data[j + 3] = 255;
  }
}

fs.writeFileSync(out, PNG.sync.write(o));
console.log(`wrote ${out}  ${TW}x${TH}  (court fit into ${IW}x${IH} at ${IX},${IY}; margin #${mr.toString(16)}${mg.toString(16)}${mb.toString(16)}; from ${s.width}x${s.height})`);
