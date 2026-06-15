/**
 * ADR-096 / ADR-097 ART REVIEW — renders the 8-direction characters and the
 * oblique 3D vehicles through the REAL generators into .shots/, the out-of-game
 * half of the review workflow (the cast-sheet / render-vehicles precedent).
 *
 *   npx vite-node tools/diag-preview.ts
 *
 * Emits: proposal_diagonals.png (each lead around the 8-way compass),
 * proposal_diag_heads.png (down-diagonal face close-ups), proposal_diag_cast.png
 * (every cast id, down-right — robustness), proposal_cars3d.png (oblique
 * side/front/back per body type, with a hero for scale).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAST, generateCharacterFrames, generateDiagFrames, FRAME_W, FRAME_H } from '../../src/spritegen/characters';
import { Pixmap } from '../../src/spritegen/pixmap';
import { drawTextInto } from '../../src/spritegen/font';
import { carViews, CAR_BODIES } from '../../src/spritegen/vehicles';
import { RAMP, px, T } from '../../src/palette';
import { pixmapToPng } from './png';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

// frame layout: down 0-3, left 4-7, right 8-11, up 12-15
const DOWN = 0;
const RIGHT = 8;
const UP = 12;

/** one lead, the stand pose around the 8-way compass (new diagonals marked *) */
function charBlock(id: string): Pixmap {
  const f = generateCharacterFrames(CAST[id]);
  const dg = generateDiagFrames(CAST[id]); // downright[0..2] downleft[3..5] upright[6..8] upleft[9..11]
  const order = [f[UP], dg[6], f[RIGHT], dg[0], f[DOWN], dg[3], f[4], dg[9]];
  const names = ['up', 'UP-R *', 'right', 'DN-R *', 'down', 'DN-L *', 'left', 'UP-L *'];
  const cell = FRAME_W + 16;
  const block = new Pixmap(cell * 8 + 4, FRAME_H + 12);
  order.forEach((pm, i) => {
    blit(block, pm, i * cell + (cell - FRAME_W) / 2, 1);
    drawTextInto(block, names[i], i * cell + 3, FRAME_H + 3, names[i].includes('*') ? px(RAMP.GOLD, 3) : px(RAMP.PAPER, 1));
  });
  return block;
}

mkdirSync('.shots', { recursive: true });

// 1. the 8-way compass, three leads
const leads = ['rex', 'faye', 'milo'];
const charBlocks = leads.map((id) => ({ id, pm: charBlock(id) }));
const cw = Math.max(...charBlocks.map((b) => b.pm.w)) + 8;
const chH = charBlocks[0].pm.h + 12;
const charSheet = new Pixmap(cw + 8, charBlocks.length * chH + 16).fill(px(RAMP.GRASS, 2));
drawTextInto(charSheet, 'ADR-096 — 8-DIRECTION CHARACTERS (* = NEW DIAGONAL 3/4 FACINGS)', 6, 2, px(RAMP.INK, 0));
charBlocks.forEach((b, i) => {
  drawTextInto(charSheet, b.id.toUpperCase(), 6, 14 + i * chH, px(RAMP.RED, 1));
  blit(charSheet, b.pm, 6, 22 + i * chH);
});
writeFileSync('.shots/proposal_diagonals.png', pixmapToPng(charSheet, { scale: 5, bg: px(RAMP.GRASS, 2) }));

// 2. down-diagonal head close-ups (eye review)
const HEADH = 17;
const zoom = new Pixmap((FRAME_W + 3) * 3 * leads.length + 4, HEADH + 4).fill(px(RAMP.NIGHT, 1));
leads.forEach((id, li) => {
  const f = generateCharacterFrames(CAST[id]);
  const dg = generateDiagFrames(CAST[id]);
  [f[DOWN], dg[0], dg[3]].forEach((pm, hi) => {
    const ox = (li * 3 + hi) * (FRAME_W + 3) + 2;
    for (let y = 0; y < HEADH; y++) for (let x = 0; x < FRAME_W; x++) { const c = pm.get(x, y); if (c !== T) zoom.set(ox + x, 2 + y, c); }
  });
});
writeFileSync('.shots/proposal_diag_heads.png', pixmapToPng(zoom, { scale: 12, bg: px(RAMP.NIGHT, 1) }));

// 3. full-cast robustness (every id, down-right stand)
const allIds = Object.keys(CAST);
const cols = 12;
const ccell = FRAME_W + 4;
const crows = Math.ceil(allIds.length / cols);
const castSheet = new Pixmap(cols * ccell + 4, crows * (FRAME_H + 10) + 4).fill(px(RAMP.GRASS, 2));
allIds.forEach((id, i) => {
  const dr = generateDiagFrames(CAST[id])[0];
  const ox = (i % cols) * ccell + 2;
  const oy = Math.floor(i / cols) * (FRAME_H + 10) + 2;
  blit(castSheet, dr, ox, oy);
  drawTextInto(castSheet, id.slice(0, 6), ox, oy + FRAME_H + 1, px(RAMP.INK, 0));
});
writeFileSync('.shots/proposal_diag_cast.png', pixmapToPng(castSheet, { scale: 4, bg: px(RAMP.GRASS, 2) }));

// 4. oblique 3D vehicles — side/front/back per body type, hero for scale
const heroSide = generateCharacterFrames(CAST.rex)[RIGHT];
const heroDown = generateCharacterFrames(CAST.rex)[DOWN];
const types = ['sedan', 'suv', 'van', 'bus', 'truck', 'limo'];
const ramps = [RAMP.RED, RAMP.BLUE, RAMP.GOLD, RAMP.FOREST, RAMP.CYAN, RAMP.NIGHT];
const rowH = 48;
const carSheet = new Pixmap(400, rowH * types.length + 16).fill(px(RAMP.EARTH, 1));
drawTextInto(carSheet, 'ADR-097 OBLIQUE 3D — side / front / back / +hero (scale)', 6, 2, px(RAMP.PAPER, 3));
types.forEach((t, i) => {
  const [side, front, back] = carViews(CAR_BODIES[t], ramps[i]);
  const ground = 12 + i * rowH + rowH - 6;
  drawTextInto(carSheet, t, 4, ground - 8, px(RAMP.PAPER, 1));
  let cx = 50;
  for (const pm of [side, front, back]) { blit(carSheet, pm, cx, ground - pm.h); cx += pm.w + 6; }
  blit(carSheet, heroSide, cx + 2, ground - heroSide.h);
  blit(carSheet, heroDown, cx + 16, ground - heroDown.h);
});
writeFileSync('.shots/proposal_cars3d.png', pixmapToPng(carSheet, { scale: 4, bg: px(RAMP.EARTH, 1) }));

console.log(`wrote 4 .shots — ${allIds.length} cast ids, ${types.length} vehicle bodies`);
