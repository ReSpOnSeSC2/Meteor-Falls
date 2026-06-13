/**
 * THE ICON ATLAS CONTACT SHEET (S16 Movement 8, ADR-060) — renders every
 * ITEM_ICON through the real draw into .shots/icons_s16.png, grouped by
 * ItemKind, each labelled with its item id. The out-of-game half of the
 * icon review (the art:buildings / cast-sheet precedent) — so "every item
 * shows a distinct, on-theme icon" is READABLE here, not just in the menu.
 *
 *   npm run art:icons
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, px, T } from '../src/palette';
import { drawTextInto } from '../src/spritegen/font';
import { ITEMS, itemKindLabel, type ItemDef } from '../src/data/items';
import { ITEM_ICON } from '../src/spritegen/icons';
import { pixmapToPng } from './png';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

// group the catalog by kind, in a stable, readable order
const KIND_ORDER: ItemDef['kind'][] = [
  'weapon', 'armor', 'arms', 'charm', 'food', 'pp', 'cure', 'battle', 'valuable', 'basket', 'key',
];
const byKind = new Map<string, string[]>();
for (const item of Object.values(ITEMS)) {
  const list = byKind.get(item.kind) ?? [];
  list.push(item.id);
  byKind.set(item.kind, list);
}

const SCALE = 4;
const PAD = 6;
const CELL_W = 80;
const CELL_H = 22; // icon area
const LABEL_H = 9;
const HEADER_H = 11;
const COLS = 5;

// measure total height first
let totalH = PAD;
const bands = KIND_ORDER.filter((k) => byKind.has(k)).map((kind) => {
  const ids = byKind.get(kind)!;
  const subRows = Math.ceil(ids.length / COLS);
  const h = HEADER_H + subRows * (CELL_H + LABEL_H) + PAD;
  totalH += h;
  return { kind, ids, h };
});
const sheetW = PAD + COLS * CELL_W + PAD;

const sheet = new Pixmap(sheetW, totalH).fill(px(RAMP.INK, 1));

let y = PAD;
for (const band of bands) {
  // sample item for the human-readable kind label
  const sample = ITEMS[band.ids[0]];
  drawTextInto(sheet, `${itemKindLabel(sample)}  (${band.ids.length})`, PAD, y, px(RAMP.GOLD, 3));
  y += HEADER_H;
  band.ids.forEach((id, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = PAD + col * CELL_W;
    const cy = y + row * (CELL_H + LABEL_H);
    // a per-cell panel so transparent margins read
    sheet.rect(cx, cy, CELL_W - 4, CELL_H, px(RAMP.INK, 0));
    sheet.frame(cx, cy, CELL_W - 4, CELL_H, px(RAMP.INK, 2));
    const pm = ITEM_ICON[id]();
    blit(sheet, pm, cx + Math.floor((CELL_W - 4 - pm.w) / 2), cy + Math.floor((CELL_H - pm.h) / 2));
    drawTextInto(sheet, id.slice(0, 12), cx, cy + CELL_H + 1, px(RAMP.PAPER, 3));
  });
  y += Math.ceil(band.ids.length / COLS) * (CELL_H + LABEL_H) + PAD;
}

mkdirSync('.shots', { recursive: true });
writeFileSync('.shots/icons_s16.png', pixmapToPng(sheet, { scale: SCALE, bg: px(RAMP.INK, 1) }));
console.log(`wrote .shots/icons_s16.png (${sheetW}x${totalH} @${SCALE}x) — ${Object.keys(ITEM_ICON).length} icons`);
