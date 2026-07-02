/**
 * Compose an authored TOP-DOWN court illustration into the engine's side-view
 * court texture, matching drawCageCourt()'s exact layout so the rim/player/camera
 * coordinate system (PAD-based) is unchanged. The authored art is area-resized
 * into the INBOUNDS rect; the COURT_PAD margin is filled with the court's own
 * border colour (a dark asphalt apron). Output replaces `cage_court`.
 *
 *   node tools/compose-hoops-court.js <src.png> <out.png> [--crop=x,y,w,h]
 *
 * --crop=x,y,w,h  the source's PAINTED BOUNDARY rectangle (outer line centers).
 *   The source is composed so that rect lands exactly on the engine INBOUNDS
 *   rect (sim sidelines/3-pt geometry line up with the painted lines), and the
 *   SAME transform extends over the COURT_PAD margin, so the source's own
 *   apron/cage ring fills the pad (clamp-sampled at the source edges) instead
 *   of a flat fill. Without --crop the legacy fit (full frame -> inbounds,
 *   flat-filled pad) is used.
 *   The 2026-07 re-compose measured the weathered painted boundary of
 *   masters/pkg10/hoops_side_court_src.png at --crop=122,105,1455,722
 *   (center-outward scan for the first row/col whose low-saturation
 *   brightness>125 run crosses >40-55% of the frame).
 *
 * Geometry mirrors src/spritegen/athletes.ts (COURT_PAD=34, drawCageCourt size)
 * and src/hoops/court.ts (COURT.W=672, COURT.H=368) at ART_SCALE=4.
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , src, out, ...flags] = process.argv;
if (!src || !out) {
  console.error('usage: node tools/compose-hoops-court.js <src.png> <out.png> [--crop=x,y,w,h]');
  process.exit(1);
}
const cropFlag = flags.find((f) => f.startsWith('--crop='));
const crop = cropFlag ? cropFlag.slice(7).split(',').map(Number) : null;
if (crop && (crop.length !== 4 || crop.some((n) => !Number.isFinite(n)) || crop[2] <= 0 || crop[3] <= 0)) {
  console.error(`bad --crop '${cropFlag}' — expected --crop=x,y,w,h`);
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

// the source rect that must land on the inbounds rect (painted lines with --crop,
// the full frame without), and the dest region the transform is sampled over
const [cx0, cy0, cw, ch] = crop ?? [0, 0, s.width, s.height];
const sx = cw / IW;
const sy = ch / IH;
// with --crop, extend the same transform across the WHOLE texture so the pad
// shows the source's own apron/cage ring; legacy mode paints inbounds only
const dx0 = crop ? -IX : 0;
const dy0 = crop ? -IY : 0;
const dx1 = crop ? TW - IX : IW;
const dy1 = crop ? TH - IY : IH;
for (let y = dy0; y < dy1; y++) {
  for (let x = dx0; x < dx1; x++) {
    let x0 = Math.floor(cx0 + x * sx), x1 = Math.floor(cx0 + (x + 1) * sx) + 1;
    let y0 = Math.floor(cy0 + y * sy), y1 = Math.floor(cy0 + (y + 1) * sy) + 1;
    // clamp-sample at the source edges (keeps at least a 1px box)
    x0 = Math.max(0, Math.min(s.width - 1, x0)); x1 = Math.max(x0 + 1, Math.min(s.width, x1));
    y0 = Math.max(0, Math.min(s.height - 1, y0)); y1 = Math.max(y0 + 1, Math.min(s.height, y1));
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
const mode = crop ? `crop ${cw}x${ch}@${cx0},${cy0} -> inbounds` : 'full frame -> inbounds';
console.log(`wrote ${out}  ${TW}x${TH}  (${mode} ${IW}x${IH} at ${IX},${IY}; margin #${mr.toString(16)}${mg.toString(16)}${mb.toString(16)}; from ${s.width}x${s.height})`);
