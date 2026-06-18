/**
 * Assemble a 46-frame character sheet (96x128 frames, 4 cols, 12 rows) from a
 * base sheet + per-frame pose PNGs + mirror/copy ops. This is the "place the cut
 * out pose in the sheet at the right cell, mirror where a mirror suffices" step
 * of the authored-character pipeline.
 *
 * Mirroring is the ONLY synthetic transform we use (user constraint): a profile
 * flipped horizontally is the opposite profile, a diagonal flipped is the mirror
 * diagonal, and a FRONT/BACK step flipped is the other foot. So:
 *   right       = flip(left)        (cells 8,9,10,11,20,21 <- 4,5,6,7,18,19)
 *   down-right  = flip(down-left)   (24,25,26,36,37        <- 27,28,29,38,39)
 *   up-right    = flip(up-left)     (30,31,32,40,41        <- 33,34,35,42,43)
 *   --footmirror: down/up walkB,runB = flip(walkA,runA)  ([1,3][13,15][16,17][22,23])
 *
 *   node tools/assemble-char-sheet.js <base.png> <out.png> \
 *        --place=<frame>:<pose.png> [...] \
 *        --copy=<dst>:<src> [...] \
 *        --mirror=<dst>:<src> [...] \
 *        [--footmirror]
 * Ops apply in argument order, so a --mirror/--copy can reference a just-placed
 * cell. Use RELATIVE pose paths (no drive-letter colon).
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const FW = 96, FH = 128, COLS = 4;
const FOOT_MIRROR = [[1, 3], [13, 15], [16, 17], [22, 23]]; // [src, dst]

const [, , basePath, outPath, ...ops] = process.argv;
if (!basePath || !outPath) {
  console.error('usage: node tools/assemble-char-sheet.js <base.png> <out.png> --place=f:pose.png --mirror=dst:src --copy=dst:src [--footmirror]');
  process.exit(1);
}
const base = PNG.sync.read(fs.readFileSync(basePath));
const W = base.width, D = base.data;
const origin = (f) => [(f % COLS) * FW, ((f / COLS) | 0) * FH];

function clearCell(f) {
  const [ox, oy] = origin(f);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const i = ((oy + y) * W + (ox + x)) * 4;
    D[i] = D[i + 1] = D[i + 2] = D[i + 3] = 0;
  }
}
function placePose(f, posePath) {
  const pose = PNG.sync.read(fs.readFileSync(posePath));
  clearCell(f);
  const [ox, oy] = origin(f);
  for (let y = 0; y < FH && y < pose.height; y++) for (let x = 0; x < FW && x < pose.width; x++) {
    const si = (y * pose.width + x) * 4;
    const di = ((oy + y) * W + (ox + x)) * 4;
    D[di] = pose.data[si]; D[di + 1] = pose.data[si + 1]; D[di + 2] = pose.data[si + 2]; D[di + 3] = pose.data[si + 3];
  }
}
function copyCell(dst, src, flip) {
  const [sx, sy] = origin(src), [dx, dy] = origin(dst);
  const buf = new Uint8Array(FW * FH * 4); // snapshot src (dst may overlap src on no-op)
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const si = ((sy + y) * W + (sx + x)) * 4, bi = (y * FW + x) * 4;
    buf[bi] = D[si]; buf[bi + 1] = D[si + 1]; buf[bi + 2] = D[si + 2]; buf[bi + 3] = D[si + 3];
  }
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const bx = flip ? FW - 1 - x : x, bi = (y * FW + bx) * 4;
    const di = ((dy + y) * W + (dx + x)) * 4;
    D[di] = buf[bi]; D[di + 1] = buf[bi + 1]; D[di + 2] = buf[bi + 2]; D[di + 3] = buf[bi + 3];
  }
}

for (const op of ops) {
  if (op === '--footmirror') { for (const [s, d] of FOOT_MIRROR) copyCell(d, s, true); continue; }
  const eq = op.indexOf('=');
  const k = op.slice(2, eq), v = op.slice(eq + 1);
  if (k === 'place') { const c = v.indexOf(':'); placePose(Number(v.slice(0, c)), v.slice(c + 1)); }
  else if (k === 'copy') { const [d, s] = v.split(':'); copyCell(Number(d), Number(s), false); }
  else if (k === 'mirror') { const [d, s] = v.split(':'); copyCell(Number(d), Number(s), true); }
  else console.error('unknown op', op);
}
fs.writeFileSync(outPath, PNG.sync.write(base));
console.log(`wrote ${outPath}`);
