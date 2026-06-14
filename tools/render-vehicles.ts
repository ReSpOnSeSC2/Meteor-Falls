/**
 * THE VEHICLE FORGE CONTACT SHEET (S18 M26, ADR-067) — renders the whole vehicle
 * catalog through the real drawVehicle() into .shots/vehicles.png, the out-of-game
 * half of the vehicle-art review (the render-buildings / render-icons precedent).
 * A 16×24 hero block stands at the left of each row for scale, so "a vehicle reads
 * against the hero" and the seat-fit class ladder are READABLE here.
 *
 *   npm run art:vehicles
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, px, T } from '../src/palette';
import { drawTextInto } from '../src/spritegen/font';
import { VEHICLE_CATALOG, VEHICLE_SPECS, drawVehicle, usableSeats } from '../src/spritegen/vehicles';
import { pixmapToPng } from './png';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

const PAD = 8;
const GAP = 10;
const LABEL_H = 9;
const HERO_W = 16;
const HERO_H = 24;

// one row per TYPE: its paint variants side by side, with the seat-fit read.
const rows = Object.keys(VEHICLE_SPECS).map((type) => {
  const variants = VEHICLE_CATALOG.filter((v) => v.type === type);
  const spec = VEHICLE_SPECS[type];
  return {
    title: `${type}  ·  ${spec.terrain}  ·  seats ${spec.seats} (ride ${usableSeats(type)})`,
    items: variants.map((v) => ({ name: v.name, pm: drawVehicle(v.name) })),
  };
});

const rowH = rows.map((r) => Math.max(HERO_H, ...r.items.map((i) => i.pm.h)));
const rowW = rows.map((r) => PAD + 150 + HERO_W + GAP + r.items.reduce((s, i) => s + i.pm.w + GAP, 0));
const sheetW = Math.max(...rowW) + PAD;
const sheetH = PAD + rowH.reduce((s, rh) => s + rh + LABEL_H + GAP + 4, 0) + PAD;

const sheet = new Pixmap(sheetW, sheetH).fill(px(RAMP.NIGHT, 1));
drawTextInto(sheet, `THE VEHICLE FORGE — ${VEHICLE_CATALOG.length} paint variants across ${rows.length} types (ADR-067)`, PAD, PAD - 4 < 0 ? 0 : 0, px(RAMP.GOLD, 3));

let y = PAD + 6;
for (let r = 0; r < rows.length; r++) {
  const row = rows[r];
  const ground = y + rowH[r];
  sheet.hline(0, ground, sheetW, px(RAMP.NIGHT, 3));
  drawTextInto(sheet, row.title.toUpperCase(), PAD, ground - 8, px(RAMP.CYAN, 3));
  let x = PAD + 150;
  // the 16×24 hero, for scale
  sheet.rect(x, ground - HERO_H, HERO_W, HERO_H, px(RAMP.SKIN, 2));
  sheet.rect(x + 3, ground - HERO_H, HERO_W - 6, 7, px(RAMP.EARTH, 1));
  sheet.rect(x + 2, ground - HERO_H + 9, HERO_W - 4, 10, px(RAMP.BLUE, 2));
  x += HERO_W + GAP;
  for (const it of row.items) {
    blit(sheet, it.pm, x, ground - it.pm.h);
    x += it.pm.w + GAP;
  }
  y = ground + LABEL_H + GAP + 4;
}

mkdirSync('.shots', { recursive: true });
writeFileSync('.shots/vehicles.png', pixmapToPng(sheet, { scale: 2, bg: px(RAMP.NIGHT, 1) }));
console.log(`wrote .shots/vehicles.png (${sheetW}x${sheetH} @2x) — ${VEHICLE_CATALOG.length} variants`);
