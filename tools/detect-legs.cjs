// tools/detect-legs.cjs — scan every character sheet for frames whose figure is
// abnormally SHORT (legs cut off) or empty, to find the "missing legs" defect.
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'assets', 'art', 'characters');
const HEROES = new Set(['jay', 'mia', 'milo', 'pippa', 'dorin']);
const FW = 96, FH = 128, COLS = 4, NFR = 46;
const SHORT = Number(process.argv[2] || 78); // height below this = suspicious

const files = fs
  .readdirSync(dir)
  .filter((f) => /_anim_46_4x\.png$/.test(f))
  .filter((f) => !HEROES.has(f.replace('_anim_46_4x.png', '')))
  .sort();

function bbox(p, f) {
  const sx = (f % COLS) * FW, sy = ((f / COLS) | 0) * FH;
  let x0 = FW, y0 = FH, x1 = -1, y1 = -1;
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const a = p.data[((sy + y) * p.width + (sx + x)) * 4 + 3];
      if (a > 16) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    }
  if (x1 < 0) return { empty: true, h: 0 };
  return { empty: false, h: y1 - y0 + 1, top: y0, bottom: y1, footFromBottom: FH - 1 - y1 };
}

for (const f of files) {
  const id = f.replace('_anim_46_4x.png', '');
  let p;
  try { p = PNG.sync.read(fs.readFileSync(path.join(dir, f))); } catch (e) { console.log(id, 'READ-ERR'); continue; }
  const flags = [];
  let minH = 999, maxH = 0;
  for (let fr = 0; fr < NFR; fr++) {
    const b = bbox(p, fr);
    if (b.empty) { flags.push(fr + ':EMPTY'); continue; }
    minH = Math.min(minH, b.h); maxH = Math.max(maxH, b.h);
    if (b.h < SHORT) flags.push(`${fr}:h${b.h}`);
  }
  const f0 = bbox(p, 0);
  if (flags.length) console.log(`${id.padEnd(16)} f0h=${f0.h} minH=${minH} maxH=${maxH}  SHORT/EMPTY: ${flags.join(' ')}`);
  else console.log(`${id.padEnd(16)} f0h=${f0.h} minH=${minH} maxH=${maxH}  ok`);
}
