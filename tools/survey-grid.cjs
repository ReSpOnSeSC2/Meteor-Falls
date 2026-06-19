// tools/survey-grid.cjs — tile one frame from EVERY character sheet into a grid
// for fast triage (missing legs, wrong facings, etc.).
// Usage: node tools/survey-grid.cjs <frame> <cols> [outPath]
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'assets', 'art', 'characters');
const frame = Number(process.argv[2] || 0);
const cols = Number(process.argv[3] || 8);
const out = process.argv[4] || path.resolve(__dirname, '..', '.shots', `survey_f${frame}.png`);

const HEROES = new Set(['jay', 'mia', 'milo', 'pippa', 'dorin']);
const files = fs
  .readdirSync(dir)
  .filter((f) => /_anim_46_4x\.png$/.test(f))
  .filter((f) => !HEROES.has(f.replace('_anim_46_4x.png', '')))
  .sort();
const SC = Number(process.env.SC || 1);
const FW = 96 * SC, FH = 128 * SC, pad = 4;
const rows = Math.ceil(files.length / cols);
const o = new PNG({ width: cols * (FW + pad) + pad, height: rows * (FH + pad) + pad });
for (let i = 0; i < o.width * o.height; i++) {
  o.data[i * 4] = 210; o.data[i * 4 + 1] = 210; o.data[i * 4 + 2] = 210; o.data[i * 4 + 3] = 255;
}
files.forEach((f, idx) => {
  let sheet;
  try { sheet = PNG.sync.read(fs.readFileSync(path.join(dir, f))); } catch (e) { return; }
  const sx = (frame % 4) * 96, sy = ((frame / 4) | 0) * 128;
  const cx = idx % cols, cy = (idx / cols) | 0;
  const ox = pad + cx * (FW + pad), oy = pad + cy * (FH + pad);
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const ssx = sx + ((x / SC) | 0), ssy = sy + ((y / SC) | 0);
      if (ssx < sheet.width && ssy < sheet.height) {
        const si = (ssy * sheet.width + ssx) * 4, a = sheet.data[si + 3] / 255, di = ((oy + y) * o.width + (ox + x)) * 4;
        for (let c = 0; c < 3; c++) o.data[di + c] = Math.round(sheet.data[si + c] * a + o.data[di + c] * (1 - a));
      }
    }
});
fs.writeFileSync(out, PNG.sync.write(o));
console.log('survey', path.basename(out), o.width + 'x' + o.height, files.length + ' sheets');
console.log('order:', files.map((f) => f.replace('_anim_46_4x.png', '')).join(' '));
