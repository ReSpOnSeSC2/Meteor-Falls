// tools/make-blink.cjs <sheet.png> [--src=0 --dst=45 --breath=44]
// Builds an eyes-closed BLINK frame from the front stand (src) into dst, by
// detecting the two eye clusters (dark, skin-flanked pixels in the upper face),
// painting them over with sampled skin, and drawing a thin lid line.
// Also copies src->breath so the idle-breath frame faces front (not a back-view).
// 46-frame layout, 96x128 cells, 4 cols. Writes the sheet in place.
const { PNG } = require('pngjs');
const fs = require('fs');

const args = process.argv.slice(2);
const sheet = args[0];
const opt = (k, def) => {
  const a = args.find((s) => s.startsWith('--' + k + '='));
  return a ? a.split('=')[1] : def;
};
const SRC = +opt('src', 0);
const DST = +opt('dst', 45);
const BREATH = opt('breath', '44') === 'none' ? null : +opt('breath', 44);
const FW = 96, FH = 128, COLS = 4;

const p = PNG.sync.read(fs.readFileSync(sheet));
const cell = (f) => ({ x: (f % COLS) * FW, y: Math.floor(f / COLS) * FH });
const s = cell(SRC), d = cell(DST);
const at = (o, x, y) => ((o.y + y) * p.width + (o.x + x)) * 4;

// copy src -> dst (and src -> breath)
const copyCell = (from, to) => {
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const si = at(from, x, y), di = at(to, x, y);
    for (let c = 0; c < 4; c++) p.data[di + c] = p.data[si + c];
  }
};
copyCell(s, d);
if (BREATH != null) copyCell(s, cell(BREATH));

// New generated faces can have dense brows, moustaches, or beard pixels that
// make heuristic eye-cluster detection ambiguous. An explicitly reviewed pair
// of eye centres keeps the edit surgical: --manual=leftX,leftY,rightX,rightY.
const manual = opt('manual', '');
if (manual) {
  const coords = manual.split(',').map(Number);
  if (coords.length !== 4 || coords.some((value) => !Number.isInteger(value))) {
    throw new Error('--manual needs leftX,leftY,rightX,rightY');
  }
  const skinAt = (cx, cy) => {
    const samples = [];
    for (let radius = 1; radius <= 5; radius++) {
      for (let yy = cy - radius; yy <= cy + radius; yy++) {
        for (let xx = cx - radius; xx <= cx + radius; xx++) {
          if (xx < 0 || xx >= FW || yy < 0 || yy >= FH) continue;
          const i = at(s, xx, yy);
          const r = p.data[i], g = p.data[i + 1], b = p.data[i + 2], a = p.data[i + 3];
          if (a > 16 && r > 135 && r >= g && g >= b && r - b > 18 && r - b < 165) {
            samples.push([r, g, b]);
          }
        }
      }
      if (samples.length >= 8) break;
    }
    if (!samples.length) return [226, 182, 152];
    return [0, 1, 2].map((channel) => Math.round(
      samples.reduce((sum, sample) => sum + sample[channel], 0) / samples.length,
    ));
  };
  for (const [cx, cy] of [[coords[0], coords[1]], [coords[2], coords[3]]]) {
    const skin = skinAt(cx, cy);
    for (let yy = cy; yy <= cy + 1; yy++) {
      for (let xx = cx - 1; xx <= cx + 1; xx++) {
        const i = at(d, xx, yy);
        p.data[i] = skin[0]; p.data[i + 1] = skin[1]; p.data[i + 2] = skin[2]; p.data[i + 3] = 255;
      }
    }
    for (let xx = cx - 1; xx <= cx + 1; xx++) {
      const i = at(d, xx, cy + 1);
      p.data[i] = 70; p.data[i + 1] = 52; p.data[i + 2] = 46; p.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(sheet, PNG.sync.write(p));
  console.log(`blink ${sheet.split(/[\\/]/).pop()}: manual eyes ${manual}`);
  process.exit(0);
}

// figure bbox in src
let x0 = FW, y0 = FH, x1 = 0, y1 = 0;
for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
  if (p.data[at(s, x, y) + 3] > 16) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
}
const h = y1 - y0 + 1;
const by0 = Math.round(y0 + 0.12 * h), by1 = Math.round(y0 + 0.32 * h);
const cx = (x0 + x1) / 2;
const px = (x, y) => { const i = at(s, x, y); return [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]]; };
const isSkin = (r, g, b, a) => a > 16 && r > 150 && r >= g && g >= b && r - b > 18 && r - b < 150;
const bright = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

const eyePx = [];
for (let y = by0; y <= by1; y++) for (let x = x0; x <= x1; x++) {
  const [r, g, b, a] = px(x, y);
  if (a > 16 && bright(r, g, b) < 80) {
    let skinN = false;
    for (const [dx, dy] of [[-2, 0], [2, 0], [-3, 0], [3, 0], [0, -2], [-2, -2], [2, -2]]) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < FW && yy >= 0 && yy < FH) { const q = px(xx, yy); if (isSkin(q[0], q[1], q[2], q[3])) skinN = true; }
    }
    if (skinN) eyePx.push([x, y]);
  }
}
const left = eyePx.filter(([x]) => x < cx - 1), right = eyePx.filter(([x]) => x > cx + 1);
const bbox = (pts) => { let a = FW, b = FH, c = 0, e = 0; for (const [x, y] of pts) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > e) e = y; } return [a, b, c, e]; };
const sampleSkin = (eb) => {
  const [a, b, c, e] = eb; const sx = Math.round((a + c) / 2);
  for (let yy = e + 1; yy < e + 7; yy++) { const q = px(sx, yy); if (isSkin(q[0], q[1], q[2], q[3])) return [q[0], q[1], q[2]]; }
  for (let yy = b - 1; yy > b - 7; yy--) { const q = px(sx, yy); if (isSkin(q[0], q[1], q[2], q[3])) return [q[0], q[1], q[2]]; }
  return [226, 182, 152];
};
const closeEye = (pts) => {
  if (pts.length < 2) return 0;
  const eb = bbox(pts); const skin = sampleSkin(eb);
  for (const [x, y] of pts) { const di = at(d, x, y); p.data[di] = skin[0]; p.data[di + 1] = skin[1]; p.data[di + 2] = skin[2]; p.data[di + 3] = 255; }
  const [a, b, c, e] = eb; const ly = Math.round((b + e) / 2);
  for (let x = a; x <= c; x++) for (let yy = ly; yy <= ly + 1; yy++) { const di = at(d, x, yy); p.data[di] = 70; p.data[di + 1] = 52; p.data[di + 2] = 46; p.data[di + 3] = 255; }
  return pts.length;
};
const L = closeEye(left), R = closeEye(right);
fs.writeFileSync(sheet, PNG.sync.write(p));
console.log(`blink ${sheet.split(/[\\/]/).pop()}: left=${L}px right=${R}px band y[${by0}..${by1}]`);
