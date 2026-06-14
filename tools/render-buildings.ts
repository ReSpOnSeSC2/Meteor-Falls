/**
 * THE BUILDING FORGE CONTACT SHEET (S15i, ADR-050) — renders the city-facade
 * catalog through the real drawCityBuilding() into .shots/ PNGs, the out-of-game
 * half of the building-art review (the cast-sheet.ts / forge-faces.ts precedent).
 * A 16×24 hero block stands at the left of each row for scale, so "buildings
 * tower over the hero" and "the mega's top runs off-screen" are READABLE here.
 *
 *   npm run art:buildings
 *
 * Emits: buildings_s15i.png — every S15i family + the MEGA towers, bottoms
 * aligned on a ground line, a hero block for scale, names under each.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, px, T } from '../src/palette';
import { drawCityBuilding, type CityBuildingOpts } from '../src/spritegen/tiles';
import { drawTextInto } from '../src/spritegen/font';
import { CITY_CATALOG, COLOSSI, AREA_SKINS, CANON_AREAS } from '../src/spritegen/buildings';
import { BUILDING_DIMS } from '../src/levelkit/kit';
import { pixmapToPng } from './png';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

/** the rows: each is a themed band of facades, drawn bottoms-aligned */
const ROWS: Array<{ title: string; items: Array<{ name: string; o: CityBuildingOpts }> }> = [
  {
    title: 'STOREFRONT FAMILIES (S15i)',
    items: [
      { name: 'brownstone', o: { wallTiles: 4, upperRows: 3, wall: RAMP.EARTH, signText: 'FLATS', doorAt: 1, litSeed: 79 } },
      { name: 'neon', o: { wallTiles: 4, upperRows: 2, wall: RAMP.NIGHT, signText: 'NEON', neon: true, doorAt: 1, litSeed: 81 } },
      { name: 'theater', o: { wallTiles: 5, upperRows: 2, wall: RAMP.RED, signText: 'ORPHEUM', marquee: true, doubleDoor: true, doorAt: 2, litSeed: 77 } },
      { name: 'civic', o: { wallTiles: 6, upperRows: 2, wall: RAMP.PAPER, signText: 'CIVIC HALL', portico: true, doubleDoor: true, doorAt: 3, litSeed: 76 } },
      { name: 'market', o: { wallTiles: 6, upperRows: 1, wall: RAMP.GOLD, signText: 'MARKET', colonnade: true, doorAt: 3, litSeed: 78 } },
      { name: 'apartments', o: { wallTiles: 5, upperRows: 4, wall: RAMP.ORANGE, signText: 'THE ARMS', balconies: true, doorAt: 2, litSeed: 74 } },
      { name: 'office', o: { wallTiles: 5, upperRows: 5, wall: RAMP.CYAN, signText: 'SUITES', tower: true, doorAt: 2, litSeed: 75 } },
      { name: 'deptstore', o: { wallTiles: 8, upperRows: 3, wall: RAMP.PURPLE, signText: 'GRANDE', doubleDoor: true, doorAt: 4, litSeed: 82 } },
    ],
  },
  {
    title: 'MEGA-BUILDINGS (tops off-screen) vs the shipped 1-3 story scale',
    items: [
      { name: 'bagels(1)', o: { wallTiles: 4, upperRows: 1, wall: RAMP.ORANGE, signText: 'BAGELS', awning: RAMP.RED, doorAt: 1, litSeed: 11 } },
      { name: 'brickmore(3)', o: { wallTiles: 5, upperRows: 3, wall: RAMP.RED, signText: 'THE BRICKMORE', doorAt: 2, litSeed: 14 } },
      { name: 'tower_glass(12)', o: { wallTiles: 6, upperRows: 12, wall: RAMP.BLUE, signText: 'MERIDIAN', tower: true, doubleDoor: true, doorAt: 2, litSeed: 71 } },
      { name: 'tower_arms(12)', o: { wallTiles: 6, upperRows: 12, wall: RAMP.RED, signText: 'EMBERTON', tower: true, balconies: true, doorAt: 2, litSeed: 72 } },
      { name: 'tower_corp(13)', o: { wallTiles: 7, upperRows: 13, wall: RAMP.NIGHT, signText: 'OMNICORP', tower: true, neon: true, doubleDoor: true, doorAt: 3, litSeed: 73 } },
    ],
  },
];

const PAD = 8;
const GAP = 10;
const LABEL_H = 9;
const HERO_W = 16;
const HERO_H = 24;

const built = ROWS.map((row) => ({
  title: row.title,
  items: row.items.map((it) => ({ name: it.name, pm: drawCityBuilding(it.o) })),
}));

const rowHeights = built.map((r) => Math.max(...r.items.map((i) => i.pm.h)));
const rowWidths = built.map(
  (r) => PAD + HERO_W + GAP + r.items.reduce((s, i) => s + i.pm.w + GAP, 0),
);
const sheetW = Math.max(...rowWidths) + PAD;
const sheetH = PAD + rowHeights.reduce((s, rh) => s + 10 + rh + LABEL_H + GAP * 2, 0) + PAD;

const sheet = new Pixmap(sheetW, sheetH).fill(px(RAMP.NIGHT, 1));

let y = PAD;
for (let r = 0; r < built.length; r++) {
  const row = built[r];
  drawTextInto(sheet, row.title, PAD, y, px(RAMP.GOLD, 3));
  y += 10;
  const ground = y + rowHeights[r];
  sheet.hline(0, ground, sheetW, px(RAMP.PAPER, 0)); // sidewalk line
  sheet.hline(0, ground + 1, sheetW, px(RAMP.INK, 1));
  let x = PAD;
  // the 16×24 hero, for scale
  sheet.rect(x, ground - HERO_H, HERO_W, HERO_H, px(RAMP.SKIN, 2));
  sheet.rect(x + 3, ground - HERO_H, HERO_W - 6, 7, px(RAMP.EARTH, 1)); // hair
  sheet.rect(x + 2, ground - HERO_H + 9, HERO_W - 4, 10, px(RAMP.BLUE, 2)); // shirt
  x += HERO_W + GAP;
  for (const it of row.items) {
    blit(sheet, it.pm, x, ground - it.pm.h);
    drawTextInto(sheet, it.name, x, ground + 3, px(RAMP.PAPER, 3));
    x += it.pm.w + GAP;
  }
  y = ground + LABEL_H + GAP * 2;
}

mkdirSync('.shots', { recursive: true });
writeFileSync('.shots/buildings_s15i.png', pixmapToPng(sheet, { scale: 2, bg: px(RAMP.NIGHT, 1) }));
console.log(`wrote .shots/buildings_s15i.png (${sheetW}x${sheetH} @2x)`);

/* ---- THE COLOSSI: landmark megastructures, with the hero for scale ---- */
{
  const items = COLOSSI.map((c) => ({ name: c.name, pm: drawCityBuilding(c.opts) }));
  const maxH = Math.max(...items.map((i) => i.pm.h));
  const w = PAD + HERO_W + GAP + items.reduce((s, i) => s + i.pm.w + GAP, 0) + PAD;
  const h = PAD + 10 + maxH + LABEL_H + PAD;
  const cs = new Pixmap(w, h).fill(px(RAMP.NIGHT, 1));
  drawTextInto(cs, 'THE COLOSSI — wide ones span half a city map; SKY ones climb 2-4+ SCREENS (one screen = 225px)', PAD, PAD, px(RAMP.GOLD, 3));
  const ground = PAD + 10 + maxH;
  // faint SCREEN-height gridlines so the 2-4 screen claim is readable
  for (let k = 1; k * 225 < maxH + 225; k++) {
    const ly = ground - k * 225;
    if (ly < PAD + 10) break;
    cs.hline(0, ly, w, px(RAMP.NIGHT, 3));
    drawTextInto(cs, `${k} screen${k > 1 ? 's' : ''}`, PAD, ly + 1, px(RAMP.CYAN, 3));
  }
  cs.hline(0, ground, w, px(RAMP.PAPER, 0));
  let x = PAD;
  cs.rect(x, ground - HERO_H, HERO_W, HERO_H, px(RAMP.SKIN, 2));
  cs.rect(x + 2, ground - HERO_H + 9, HERO_W - 4, 10, px(RAMP.BLUE, 2));
  x += HERO_W + GAP;
  for (const it of items) {
    blit(cs, it.pm, x, ground - it.pm.h);
    drawTextInto(cs, it.name.replace('bldg_colossus_', ''), x, ground + 3, px(RAMP.PAPER, 3));
    x += it.pm.w + GAP;
  }
  writeFileSync('.shots/buildings_colossi.png', pixmapToPng(cs, { scale: 1, bg: px(RAMP.NIGHT, 1) }));
  console.log(`wrote .shots/buildings_colossi.png (${w}x${h} @1x) — ${items.map((i) => `${i.name} ${i.pm.w}x${i.pm.h}`).join(', ')}`);
}

/* ---- THE GENERATED CATALOG: 100+ facades, a wrapped thumbnail grid ---- */
{
  const COLS = 13;
  const items = CITY_CATALOG.map((c) => drawCityBuilding(c.opts));
  const cellW = Math.max(...items.map((p) => p.w)) + GAP;
  const rows: typeof items[] = [];
  for (let i = 0; i < items.length; i += COLS) rows.push(items.slice(i, i + COLS));
  const rowH = rows.map((r) => Math.max(...r.map((p) => p.h)) + GAP);
  const w = PAD + COLS * cellW + PAD;
  const h = PAD + 10 + rowH.reduce((s, v) => s + v, 0) + PAD;
  const cat = new Pixmap(w, h).fill(px(RAMP.NIGHT, 1));
  drawTextInto(cat, `THE GENERATED CATALOG — ${CITY_CATALOG.length} facades across 13 families (per-area slices in AREA_SKINS)`, PAD, PAD, px(RAMP.GOLD, 3));
  let y = PAD + 10;
  rows.forEach((row, ri) => {
    const ground = y + rowH[ri] - GAP;
    let x = PAD;
    for (const pm of row) {
      blit(cat, pm, x, ground - pm.h);
      x += cellW;
    }
    y += rowH[ri];
  });
  writeFileSync('.shots/buildings_catalog.png', pixmapToPng(cat, { scale: 1, bg: px(RAMP.NIGHT, 1) }));
  console.log(`wrote .shots/buildings_catalog.png (${w}x${h} @1x) — ${CITY_CATALOG.length} generated facades`);
}

/* ---- S18 M25 (ADR-065): PER-AREA SKINS — each area's slice, side by side, so
   "no two areas read alike" is READABLE by eye (otterbrook's warm low walk-ups vs
   minimus's tiny jewel-box vs lilleby's giants' towers vs mars's neon husks). ---- */
{
  // name → CityBuildingOpts for any catalog/colossus facade; bespoke + shipped
  // names with no opts get a plain wall facade synthesised from BUILDING_DIMS.
  const optsByName = new Map<string, CityBuildingOpts>();
  for (const e of [...CITY_CATALOG, ...COLOSSI]) optsByName.set(e.name, e.opts);
  const drawByName = (name: string): Pixmap => {
    const o = optsByName.get(name);
    if (o) return drawCityBuilding(o);
    const d = BUILDING_DIMS[name] ?? { w: 4, u: 2 };
    return drawCityBuilding({ wallTiles: d.w, upperRows: d.u, wall: RAMP.PAPER, signText: name.slice(0, 8).toUpperCase(), doorAt: 1, litSeed: 999 });
  };

  const PREVIEW = 6; // up to this many faces per area row
  const rows = CANON_AREAS.map((area) => {
    const names = AREA_SKINS[area].slice(0, PREVIEW);
    return { area, items: names.map((n) => ({ name: n, pm: drawByName(n) })) };
  });
  const rh = rows.map((r) => Math.max(24, ...r.items.map((i) => i.pm.h)));
  const labelW = 90;
  const w = PAD + labelW + GAP + Math.max(...rows.map((r) => r.items.reduce((s, i) => s + i.pm.w + GAP, 0))) + PAD;
  const h = PAD + 12 + rh.reduce((s, v) => s + v + LABEL_H + GAP, 0) + PAD;
  const sh = new Pixmap(w, h).fill(px(RAMP.NIGHT, 1));
  drawTextInto(sh, `THE PER-AREA SKINS — ${CANON_AREAS.length} areas, each its own family-mix + ramp palette (ADR-050/065)`, PAD, PAD, px(RAMP.GOLD, 3));
  let y = PAD + 12;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const ground = y + rh[r];
    sh.hline(0, ground, w, px(RAMP.NIGHT, 3));
    drawTextInto(sh, row.area.toUpperCase(), PAD, ground - 8, px(RAMP.CYAN, 3));
    let x = PAD + labelW + GAP;
    for (const it of row.items) {
      blit(sh, it.pm, x, ground - it.pm.h);
      x += it.pm.w + GAP;
    }
    y = ground + LABEL_H + GAP;
  }
  writeFileSync('.shots/buildings_areas.png', pixmapToPng(sh, { scale: 1, bg: px(RAMP.NIGHT, 1) }));
  console.log(`wrote .shots/buildings_areas.png (${w}x${h} @1x) — ${CANON_AREAS.length} per-area slices`);
}
