/**
 * Slice an authored multi-NPC 8-DIRECTION pose sheet (e.g.
 * assets/art/masters/characters/npc-batch-1-transparent.png) into per-NPC
 * 8-direction strips the engine can synthesize a 46-frame walk from.
 *
 *   node tools/slice-npc-8dir.js
 *
 * Each batch sheet is an N-row × 8-col grid: one NPC per row, 8 facings per row
 * in the engine's COUNTER-CLOCKWISE order (down, downleft, left, upleft, up,
 * upright, right, downright — see makeCharacterCanvas in spritegen/authored.ts).
 * For each NPC we bbox-trim every facing, area-average downscale it to the
 * runtime 96×128 frame (feet-aligned, centred, one consistent scale across the
 * 8 facings), and lay the 8 frames into a 768×128 strip saved as the runtime
 * `<id>_anim_46_4x.png`. Landscape aspect => the engine takes the 8-dir
 * synthesis path and builds stand/walk/run frames from these poses.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const OUT = 'assets/art/characters';
const FW = 96;
const FH = 128;
const TARGET_H = 104; // character height inside the 128px frame (matches the heroes)
const FEET_MARGIN = 6;

// One job per batch sheet. ids[row] = roster id, or null to skip a row.
const JOBS = [
  {
    src: 'assets/art/masters/characters/npc-batch-1-transparent.png',
    cols: 8,
    rows: 8,
    ids: ['chad', 'mom', 'mrsPemmel', 'busDriver', 'ana', 'vivi', 'oldTimer', 'pajamaKid'],
  },
];

function run(job) {
  const png = PNG.sync.read(fs.readFileSync(job.src));
  const { width: W, height: H, data } = png;
  const A = (x, y) => data[(y * W + x) * 4 + 3];
  const cellBox = (cx0, cx1, cy0, cy1) => {
    let minX = cx1, minY = cy1, maxX = -1, maxY = -1;
    for (let y = cy0; y < cy1; y++)
      for (let x = cx0; x < cx1; x++)
        if (A(x, y) > 16) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
    return { minX, minY, maxX, maxY };
  };
  // alpha-weighted area average of source rect [sx0,sx1)×[sy0,sy1)
  const sample = (sx0, sy0, sx1, sy1) => {
    let r = 0, g = 0, b = 0, aw = 0, an = 0, n = 0;
    const ix0 = Math.floor(sx0), ix1 = Math.max(Math.floor(sx1 - 1e-6) + 1, ix0 + 1);
    const iy0 = Math.floor(sy0), iy1 = Math.max(Math.floor(sy1 - 1e-6) + 1, iy0 + 1);
    for (let y = iy0; y < iy1; y++)
      for (let x = ix0; x < ix1; x++) {
        const i = (y * W + x) * 4, al = data[i + 3];
        r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al;
        aw += al; an += al; n++;
      }
    if (aw === 0) return [0, 0, 0, 0];
    return [Math.round(r / aw), Math.round(g / aw), Math.round(b / aw), Math.round(an / n)];
  };

  for (let row = 0; row < job.rows; row++) {
    const id = job.ids[row];
    if (!id) continue;
    const cy0 = Math.floor((row * H) / job.rows), cy1 = Math.floor(((row + 1) * H) / job.rows);
    const boxes = [];
    let maxH = 1;
    for (let col = 0; col < job.cols; col++) {
      const cx0 = Math.floor((col * W) / job.cols), cx1 = Math.floor(((col + 1) * W) / job.cols);
      const bb = cellBox(cx0, cx1, cy0, cy1);
      boxes.push(bb);
      if (bb.maxY >= bb.minY) maxH = Math.max(maxH, bb.maxY - bb.minY + 1);
    }
    const k = TARGET_H / maxH;
    const strip = new PNG({ width: job.cols * FW, height: FH });
    for (let col = 0; col < job.cols; col++) {
      const bb = boxes[col];
      if (bb.maxX < bb.minX) continue;
      const cw = bb.maxX - bb.minX + 1, ch = bb.maxY - bb.minY + 1;
      const dw = Math.max(1, Math.round(cw * k)), dh = Math.max(1, Math.round(ch * k));
      const fx = col * FW + Math.round((FW - dw) / 2);
      const fy = FH - FEET_MARGIN - dh;
      for (let dy = 0; dy < dh; dy++)
        for (let dx = 0; dx < dw; dx++) {
          const [r, g, b, a] = sample(bb.minX + dx / k, bb.minY + dy / k, bb.minX + (dx + 1) / k, bb.minY + (dy + 1) / k);
          const px = fx + dx, py = fy + dy;
          if (px < 0 || px >= job.cols * FW || py < 0 || py >= FH) continue;
          const di = (py * job.cols * FW + px) * 4;
          strip.data[di] = r; strip.data[di + 1] = g; strip.data[di + 2] = b; strip.data[di + 3] = a;
        }
    }
    fs.writeFileSync(path.join(OUT, `${id}_anim_46_4x.png`), PNG.sync.write(strip));
    console.log(`${id.padEnd(12)} row ${row}  maxH ${maxH}  k ${k.toFixed(2)}`);
  }
}

JOBS.forEach(run);
