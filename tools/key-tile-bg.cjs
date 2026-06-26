/**
 * tools/key-tile-bg.cjs — remove the solid background from a tile-cell sprite so it
 * reads as a clean prop (the Minimus décor cells were sliced from the tile strip and
 * carry their tile's square fill). Border flood-fill: seed from the 4 edges, clear any
 * pixel CONNECTED to the border whose colour is within `tol` of the corner colour →
 * the centred object (not edge-connected) survives even if a similar hue.
 *
 *   node tools/key-tile-bg.cjs <src.png> <out.png> [tol=48]
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const [, , src, out, tolArg] = process.argv;
if (!src || !out) { console.error('usage: node tools/key-tile-bg.cjs <src> <out> [tol]'); process.exit(1); }
const TOL = Number(tolArg || 48) * 3; // sum-of-abs over RGB
const img = PNG.sync.read(fs.readFileSync(src));
const { width: W, height: H, data } = img;
const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
let cr = 0, cg = 0, cb = 0;
for (const [x, y] of corners) { const i = (y * W + x) * 4; cr += data[i]; cg += data[i + 1]; cb += data[i + 2]; }
cr /= 4; cg /= 4; cb /= 4;
const dist = (i) => Math.abs(data[i] - cr) + Math.abs(data[i + 1] - cg) + Math.abs(data[i + 2] - cb);
const seen = new Uint8Array(W * H); const stack = [];
const visit = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const p = y * W + x; if (seen[p]) return; seen[p] = 1; if (dist(p * 4) <= TOL) { data[p * 4 + 3] = 0; stack.push(p); } };
for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
while (stack.length) { const p = stack.pop(); const x = p % W, y = (p / W) | 0; visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1); }
fs.writeFileSync(out, PNG.sync.write(img));
let cleared = 0; for (let p = 0; p < W * H; p++) if (data[p * 4 + 3] === 0) cleared++;
console.log(`${out}: cleared ${cleared}/${W * H} px (corner rgb ${Math.round(cr)},${Math.round(cg)},${Math.round(cb)})`);
