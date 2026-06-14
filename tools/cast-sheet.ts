/**
 * Art-review contact sheets — the hero-art VERIFICATION LOOP (ADR-104, Prompt 8).
 * Renders the cast through the real sprite engine into .shots/ PNGs, headless
 * (no browser — the same offscreen pixmap→PNG path the other art:* tools use):
 *
 *   npm run art:castsheet
 *
 * Emits, deterministically:
 *   cast_angles.png — EVERY hero, all 8 compass facings (down · dr · right · ur ·
 *                     up · ul · left · dl), so you can check every angle at once.
 *   cast_anim.png   — the five leads' down-facing LIFE strip: idle-breath, stand,
 *                     walk-A, walk-B, blink — the frames the overworld plays.
 *   cast_busts.png  — the five leads' battle busts (the rim-lit portrait pass).
 * Plus a BEFORE/AFTER: the prior cast_angles.png is copied to cast_angles_prev.png
 * before each run, so you can open the two side by side to judge a change.
 *
 * The art-direction loop (no drawing needed): run this → open the PNG → describe
 * the next tweak ("rounder cheeks on Mia", "warmer shadow on Jay's jacket"). See
 * docs/ART_LOOP.md.
 */
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import {
  CAST,
  generateCharacterFrames,
  generateIdleFrames,
  diagWalkBase,
  IDLE_BREATH,
  IDLE_BLINK,
  FRAME_W,
  FRAME_H,
} from '../src/spritegen/characters';
import { generateBustFrames, BUST_W, BUST_H } from '../src/spritegen/busts';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, T, px } from '../src/palette';
import { pixmapToPng } from './png';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
  }
}

/** lay a 2D grid of pixmaps (rows × cols), bottom-aligned in each cell so feet
 *  sit on a common ground line; returns the composited sheet at 1× */
function buildSheet(rows: Pixmap[][], cw: number, ch: number, bg: number): Pixmap {
  const cols = Math.max(...rows.map((r) => r.length));
  const pad = 3;
  const W = cols * (cw + pad) + pad;
  const H = rows.length * (ch + pad) + pad;
  const pm = new Pixmap(W, H).rect(0, 0, W, H, bg);
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const ox = pad + c * (cw + pad) + Math.floor((cw - cell.w) / 2);
      const oy = pad + r * (ch + pad) + (ch - cell.h); // bottom-align
      blit(pm, cell, ox, oy);
    });
  });
  return pm;
}

// the 8 compass facings → the stand-frame index in the 44-frame sheet
// (cardinals: down 0, left 4, right 8, up 12; diagonals from diagWalkBase)
const ANGLE_IDX = [
  0, // down
  diagWalkBase('downright'),
  8, // right
  diagWalkBase('upright'),
  12, // up
  diagWalkBase('upleft'),
  4, // left
  diagWalkBase('downleft'),
];

const allIds = Object.keys(CAST);
const leads = ['rex', 'faye', 'milo', 'dorin', 'pippa'];

// every hero, all 8 angles
const angleRows = allIds.map((id) => {
  const f = generateCharacterFrames(CAST[id]);
  return ANGLE_IDX.map((i) => f[i]);
});

// the leads' down-facing LIFE strip: breath · stand · walkA · walkB · blink
const animRows = leads.map((id) => {
  const f = generateCharacterFrames(CAST[id]);
  const idle = generateIdleFrames(CAST[id]); // [breath, blink]
  return [idle[IDLE_BREATH - 44], f[0], f[1], f[3], idle[IDLE_BLINK - 44]];
});

// the leads' battle busts (neutral frame)
const bustRows = leads.map((id) => [generateBustFrames(CAST[id])[0]]);

mkdirSync('.shots', { recursive: true });
const anglePath = '.shots/cast_angles.png';
if (existsSync(anglePath)) copyFileSync(anglePath, '.shots/cast_angles_prev.png'); // before/after
writeFileSync(anglePath, pixmapToPng(buildSheet(angleRows, FRAME_W, FRAME_H, px(RAMP.GRASS, 2)), { scale: 4 }));
writeFileSync('.shots/cast_anim.png', pixmapToPng(buildSheet(animRows, FRAME_W, FRAME_H, px(RAMP.GRASS, 2)), { scale: 7 }));
writeFileSync('.shots/cast_busts.png', pixmapToPng(buildSheet(bustRows, BUST_W, BUST_H, px(RAMP.NIGHT, 1)), { scale: 5 }));

console.log(
  `wrote .shots/cast_angles.png (${allIds.length} cast × 8 angles), cast_anim.png (life strip), cast_busts.png` +
    (existsSync('.shots/cast_angles_prev.png') ? ' — prev saved to cast_angles_prev.png' : ''),
);
