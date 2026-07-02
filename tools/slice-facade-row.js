/**
 * Slice a single-ROW ChatGPT facade strip into individual runtime facade PNGs
 * (assets/art/world/facades/<key>.png, wired in spritegen/authored.ts).
 *
 *   node tools/slice-facade-row.js <src.png> key1,key2,...,keyN [options]
 *
 * The source is a wide image with N building facades in one horizontal row,
 * separated by empty (transparent) gutters. We segment on the vertical gutters,
 * trim each building to its non-transparent bounding box, and write it left→right
 * to the given keys.
 *
 * Background handling:
 *   --bg=alpha        (default) the strip already has a transparent background;
 *                     segment/trim by alpha.
 *   --bg=auto         detect a near-uniform border colour and flood-fill it to
 *                     transparent from the edges (interior same-colour regions,
 *                     e.g. white walls, are preserved), then segment by alpha.
 *   --bg=RRGGBB       key that exact colour (flood-filled from the edges).
 *   --tol=N           colour match tolerance for --bg=auto/RRGGBB (default 40).
 *   --gutter=N        a column counts as a gutter if it has <= N opaque px
 *                     (default 2 — tolerates a little antialias dust).
 *   --minband=N       ignore segments narrower than N px as specks (default 24).
 *   --out=DIR         output dir (default assets/art/world/facades).
 *   --minwidth=N      up-scale any sliced facade narrower than N px to N wide
 *                     (keeps aspect) so it clears the worldSpriteScale <=160 ×4
 *                     trap; default 180.
 *   --dry             report segments/sizes only, write nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const [srcArg, keysArg, ...rest] = process.argv.slice(2);
if (!srcArg || !keysArg) {
  console.error('usage: node tools/slice-facade-row.js <src.png> key1,key2,... [--bg=alpha|auto|RRGGBB] [--tol=40] [--gutter=2] [--minband=24] [--minwidth=180] [--out=DIR] [--dry]');
  process.exit(1);
}
const keys = keysArg.split(',').map((k) => k.trim()).filter(Boolean);
const opt = Object.fromEntries(rest.map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const bgMode = (opt.bg ?? 'alpha');
const tol = Number(opt.tol ?? 40);
const gutterMax = Number(opt.gutter ?? 2);
const minBand = Number(opt.minband ?? 24);
const minWidth = Number(opt.minwidth ?? 180);
const outDir = opt.out ?? 'assets/art/world/facades';
const dry = !!opt.dry;

const png = PNG.sync.read(fs.readFileSync(srcArg));
const { width: W, height: H, data } = png;
const idx = (x, y) => (y * W + x) * 4;
const A = (x, y) => data[idx(x, y) + 3];

// ---- optional background flood-fill to transparent ------------------------
if (bgMode !== 'alpha') {
  let bg;
  if (/^[0-9a-fA-F]{6}$/.test(String(bgMode))) {
    bg = [parseInt(bgMode.slice(0, 2), 16), parseInt(bgMode.slice(2, 4), 16), parseInt(bgMode.slice(4, 6), 16)];
  } else {
    // auto: average the four corners
    const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => [data[idx(x, y)], data[idx(x, y) + 1], data[idx(x, y) + 2]]);
    bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, k) => s + k[c], 0) / corners.length));
  }
  const near = (x, y) => {
    const i = idx(x, y);
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db) <= tol;
  };
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => { if (x >= 0 && x < W && y >= 0 && y < H && !seen[y * W + x]) { seen[y * W + x] = 1; stack.push(x, y); } };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (!near(x, y)) continue;
    data[idx(x, y) + 3] = 0; // transparent
    push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
  }
  console.log(`bg keyed: [${bg}] tol ${tol}`);
}

// ---- column coverage → gutters → bands ------------------------------------
const col = new Int32Array(W);
for (let x = 0; x < W; x++) { let c = 0; for (let y = 0; y < H; y++) if (A(x, y) > 16) c++; col[x] = c; }
const bands = [];
let start = -1;
for (let x = 0; x < W; x++) {
  const solid = col[x] > gutterMax;
  if (solid && start < 0) start = x;
  if (!solid && start >= 0) { if (x - start >= minBand) bands.push([start, x - 1]); start = -1; }
}
if (start >= 0 && W - start >= minBand) bands.push([start, W - 1]);

console.log(`${srcArg}: ${W}x${H} -> ${bands.length} band(s) found (expected ${keys.length})`);
bands.forEach((b, i) => console.log(`  band ${i}: x ${b[0]}..${b[1]} (w ${b[1] - b[0] + 1})`));
if (bands.length !== keys.length) {
  console.error(`\n!! band count ${bands.length} != key count ${keys.length}. Adjust --gutter/--minband or regenerate. Bands are NOT written.`);
  if (!dry) process.exit(2);
}

// ---- trim each band to bbox + write ---------------------------------------
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
bands.forEach(([x0, x1], i) => {
  const key = keys[i];
  if (!key) return;
  let minY = H, maxY = -1, minX = x1, maxX = x0;
  for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (A(x, y) > 16) {
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
  }
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const trimmed = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const si = idx(minX + x, minY + y), di = (y * tw + x) * 4;
    trimmed.data[di] = data[si]; trimmed.data[di + 1] = data[si + 1];
    trimmed.data[di + 2] = data[si + 2]; trimmed.data[di + 3] = data[si + 3];
  }
  let out = trimmed, ow = tw, oh = th;
  if (tw < minWidth) {
    // nearest-neighbour up-scale to keep the crisp edges + clear the ×4 trap
    const scale = Math.ceil(minWidth / tw);
    ow = tw * scale; oh = th * scale;
    out = new PNG({ width: ow, height: oh });
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const si = ((Math.floor(y / scale)) * tw + Math.floor(x / scale)) * 4, di = (y * ow + x) * 4;
      out.data[di] = trimmed.data[si]; out.data[di + 1] = trimmed.data[si + 1];
      out.data[di + 2] = trimmed.data[si + 2]; out.data[di + 3] = trimmed.data[si + 3];
    }
  }
  const dest = path.join(outDir, `${key}.png`);
  if (dry) console.log(`  ${key}: ${tw}x${th}${ow !== tw ? ` ->${ow}x${oh}` : ''} (dry, not written)`);
  else { fs.writeFileSync(dest, PNG.sync.write(out)); console.log(`  ${key}: ${ow}x${oh} -> ${dest}`); }
});
