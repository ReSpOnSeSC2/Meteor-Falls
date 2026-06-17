import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PALETTE, T } from '../src/palette';
import {
  CAST,
  generateCharacterFrames,
  generateIdleFrames,
  type CharacterSpec,
} from '../src/spritegen/characters';
import { ART_SCALE } from '../src/spritegen/scale';
import { encodePng, makeImg, type Img } from './imageio';

const DEFAULT_IDS = ['wisherA', 'wisherB', 'wisherC', 'wokeA', 'wokeB', 'arcadeOwner'];
const COLS = 4;
const FRAME_W = 24;
const FRAME_H = 32;
const OUT_FRAME_W = FRAME_W * ART_SCALE;
const OUT_FRAME_H = FRAME_H * ART_SCALE;
const TOTAL_FRAMES = 46;
const SHEET_W = COLS * OUT_FRAME_W;
const SHEET_H = Math.ceil(TOTAL_FRAMES / COLS) * OUT_FRAME_H;

interface PixmapLike {
  w: number;
  h: number;
  data: Uint8Array;
}

const cast = CAST as Record<string, CharacterSpec>;

function rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function drawUpscaledFrame(sheet: Img, frame: PixmapLike, frameIndex: number): void {
  const ox = (frameIndex % COLS) * OUT_FRAME_W;
  const oy = Math.floor(frameIndex / COLS) * OUT_FRAME_H;
  for (let y = 0; y < frame.h; y++) {
    for (let x = 0; x < frame.w; x++) {
      const color = frame.data[y * frame.w + x];
      if (color === T) continue;
      const [r, g, b] = rgb(PALETTE[color]);
      for (let sy = 0; sy < ART_SCALE; sy++) {
        for (let sx = 0; sx < ART_SCALE; sx++) {
          const px = ox + x * ART_SCALE + sx;
          const py = oy + y * ART_SCALE + sy;
          const off = (py * sheet.w + px) * 4;
          sheet.data[off] = r;
          sheet.data[off + 1] = g;
          sheet.data[off + 2] = b;
          sheet.data[off + 3] = 255;
        }
      }
    }
  }
}

function renderSheet(spec: CharacterSpec): Img {
  const frames = [...generateCharacterFrames(spec), ...generateIdleFrames(spec)];
  if (frames.length !== TOTAL_FRAMES) {
    throw new Error(`expected ${TOTAL_FRAMES} frames, got ${frames.length}`);
  }
  const sheet = makeImg(SHEET_W, SHEET_H);
  frames.forEach((frame, index) => drawUpscaledFrame(sheet, frame, index));
  return sheet;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

function writeCharacterSheet(id: string, stamp: string): void {
  const spec = cast[id];
  if (!spec) throw new Error(`unknown character id: ${id}`);

  const runtime = resolve('assets/art/characters', `${id}_anim_46_4x.png`);
  const master = resolve('assets/art/masters/characters/animation', `${id}_anim_46_4x_master.png`);
  const reviewDir = resolve('assets/art/review');
  mkdirSync(reviewDir, { recursive: true });

  copyFileSync(runtime, resolve(reviewDir, `${id}_anim_46_4x_before_full_leg_regen_${stamp}.png`));
  copyFileSync(master, resolve(reviewDir, `${id}_anim_46_4x_master_before_full_leg_regen_${stamp}.png`));

  const bytes = encodePng(renderSheet(spec));
  writeFileSync(runtime, bytes);
  writeFileSync(master, bytes);
  console.log(`${id}: wrote ${runtime} and ${master}`);
}

const ids = process.argv.slice(2).filter((arg) => arg !== '--');
const selectedIds = ids.length > 0 ? ids : DEFAULT_IDS;
const stamp = timestamp();

for (const id of selectedIds) writeCharacterSheet(id, stamp);

console.log(`backup stamp ${stamp}`);
