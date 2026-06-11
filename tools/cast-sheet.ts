/**
 * Art-review contact sheets (S8): renders the cast through the real sprite
 * engine into .shots/ PNGs — the out-of-game half of the .shots review
 * workflow (ADR-019; in-game shots stay window.shot via shot-server).
 *
 *   npx vite-node tools/cast-sheet.ts
 *
 * Emits: cast_side.png (all 24, right-facing, grass + void), cast_leads.png
 * (six leads, right stand + both steps, 12x), cast_front_side.png (the
 * EARTH-hair set that motivated hairTones, front vs side).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAST, generateCharacterFrames, FRAME_W, FRAME_H } from '../src/spritegen/characters';
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

function grid(ids: string[], frames: number[], cols: number, bg: number[]): Pixmap {
  const cw = FRAME_W + 4;
  const ch = FRAME_H + 4;
  const rows = Math.ceil(ids.length / cols) * frames.length;
  const bandRows = Math.ceil(ids.length / cols);
  const sheet = new Pixmap(cols * cw + 4, rows * ch * bg.length + 4);
  bg.forEach((b, bi) => {
    sheet.rect(0, bi * rows * ch, sheet.w, rows * ch + (bi === bg.length - 1 ? 4 : 0), b);
    ids.forEach((id, i) => {
      const all = generateCharacterFrames(CAST[id]);
      frames.forEach((fi, row) => {
        const cx = (i % cols) * cw + 4;
        const cy = bi * rows * ch + (row * bandRows + Math.floor(i / cols)) * ch + 4;
        blit(sheet, all[fi], cx, cy);
      });
    });
  });
  return sheet;
}

mkdirSync('.shots', { recursive: true });
const allIds = Object.keys(CAST);
writeFileSync(
  '.shots/cast_side.png',
  pixmapToPng(grid(allIds, [8], 8, [px(RAMP.GRASS, 2), px(RAMP.NIGHT, 1)]), { scale: 6 }),
);
writeFileSync(
  '.shots/cast_leads.png',
  pixmapToPng(grid(['rex', 'faye', 'milo', 'dorin', 'chad', 'mom'], [8, 9, 11], 6, [px(RAMP.GRASS, 2)]), {
    scale: 12,
  }),
);
writeFileSync(
  '.shots/cast_front_side.png',
  pixmapToPng(grid(['milo', 'mom', 'ana', 'vivi', 'quarterMan', 'smilerB'], [0, 8], 6, [px(RAMP.GRASS, 2)]), {
    scale: 12,
  }),
);
console.log(`wrote .shots/cast_side.png (${allIds.length} cast), cast_leads.png, cast_front_side.png`);
