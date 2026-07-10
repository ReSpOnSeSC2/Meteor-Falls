import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

interface SheetSpec {
  path: string;
  cols: number;
  rows: number;
  names: readonly (string | null)[];
  bg?: 'green' | 'black' | 'transparent';
}

const SPECS: readonly SheetSpec[] = [
  {
    path: 'assets/art/masters/world/brickton-facades-a-transparent.png',
    cols: 4,
    rows: 3,
    bg: 'green',
    names: [
      'bldg_starmart', 'bldg_hospital', 'bldg_brickmore', 'bldg_dept',
      'bldg_video', 'bldg_bank', 'bldg_arcade2', 'bldg_diner',
      'bldg_apartments', 'bldg_office', 'bldg_civic', 'bldg_theater',
    ],
  },
  {
    path: 'assets/art/masters/world/brickton-facades-b-transparent.png',
    cols: 3,
    rows: 3,
    bg: 'green',
    names: [
      'bldg_bagels', 'bldg_market', 'bldg_brownstone',
      'bldg_warehouse', 'bldg_neon', 'bldg_deptstore',
      'bldg_tower_glass', 'bldg_tower_arms', 'bldg_tower_corp',
    ],
  },
  {
    path: 'assets/art/masters/world/puerto-sol-facades-a-transparent.png',
    cols: 5,
    rows: 2,
    bg: 'black',
    names: [
      'bldg_ps_mercado', 'bldg_ps_clinic', 'bldg_ps_pension', 'bldg_ps_museum', 'bldg_ps_casa',
      'bldg_ps_casa_b', 'bldg_ps_deli', 'bldg_ps_cantina', 'bldg_ps_casa_c', 'bldg_ps_pension_b',
    ],
  },
  {
    path: 'assets/art/masters/world/puerto-sol-facades-b-transparent.png',
    cols: 3,
    rows: 1,
    bg: 'transparent',
    names: ['bldg_ps_catedral', 'bldg_ps_gran_hotel', 'bldg_ps_aduana'],
  },
];

/** The warehouse's source cell touches artwork from the row below after the
 * transparent separator. Clip at the depot's last painted row so regenerating
 * facades cannot reattach that unrelated tower or move the runtime doorway. */
const OUTPUT_HEIGHT: Readonly<Record<string, number>> = {
  bldg_warehouse: 303,
};

function cellBounds(img: Img, cols: number, rows: number, index: number): { x0: number; y0: number; x1: number; y1: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x0: Math.floor((img.w * col) / cols),
    y0: Math.floor((img.h * row) / rows),
    x1: Math.floor((img.w * (col + 1)) / cols),
    y1: Math.floor((img.h * (row + 1)) / rows),
  };
}

function isBackground(img: Img, x: number, y: number, bg: SheetSpec['bg']): boolean {
  const o = (y * img.w + x) * 4;
  const r = img.data[o];
  const g = img.data[o + 1];
  const b = img.data[o + 2];
  const a = img.data[o + 3];
  if (a < 24) return true;
  if (bg === 'green') return g > 180 && r < 80 && b < 80;
  if (bg === 'black') return r < 16 && g < 16 && b < 16;
  return false;
}

function findContent(img: Img, bounds: ReturnType<typeof cellBounds>, bg: SheetSpec['bg']): ReturnType<typeof cellBounds> {
  let x0 = bounds.x1;
  let y0 = bounds.y1;
  let x1 = bounds.x0;
  let y1 = bounds.y0;
  for (let y = bounds.y0; y < bounds.y1; y++) {
    for (let x = bounds.x0; x < bounds.x1; x++) {
      if (isBackground(img, x, y, bg)) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x + 1 > x1) x1 = x + 1;
      if (y + 1 > y1) y1 = y + 1;
    }
  }
  if (x1 <= x0 || y1 <= y0) throw new Error(`empty facade cell x[${bounds.x0}..${bounds.x1}] y[${bounds.y0}..${bounds.y1}]`);
  return {
    x0: Math.max(bounds.x0, x0 - 2),
    y0: Math.max(bounds.y0, y0 - 2),
    x1: Math.min(bounds.x1, x1 + 2),
    y1: Math.min(bounds.y1, y1 + 2),
  };
}

function cropTransparent(img: Img, bounds: ReturnType<typeof cellBounds>, bg: SheetSpec['bg']): Img {
  const out = makeImg(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const sx = bounds.x0 + x;
      const sy = bounds.y0 + y;
      const so = (sy * img.w + sx) * 4;
      const do2 = (y * out.w + x) * 4;
      if (isBackground(img, sx, sy, bg)) {
        out.data[do2] = 0;
        out.data[do2 + 1] = 0;
        out.data[do2 + 2] = 0;
        out.data[do2 + 3] = 0;
      } else {
        out.data[do2] = img.data[so];
        out.data[do2 + 1] = img.data[so + 1];
        out.data[do2 + 2] = img.data[so + 2];
        out.data[do2 + 3] = img.data[so + 3];
      }
    }
  }
  return out;
}

function clipHeight(img: Img, height: number): Img {
  if (height >= img.h) return img;
  const out = makeImg(img.w, height);
  for (let y = 0; y < height; y++) {
    const start = y * img.w * 4;
    out.data.set(img.data.subarray(start, start + img.w * 4), start);
  }
  return out;
}

const outDir = process.argv[2] ?? 'assets/art/world/facades';
mkdirSync(outDir, { recursive: true });

for (const spec of SPECS) {
  const img = decodePng(readFileSync(spec.path));
  spec.names.forEach((name, index) => {
    if (!name) return;
    const cell = cellBounds(img, spec.cols, spec.rows, index);
    const content = findContent(img, cell, spec.bg ?? 'transparent');
    const raw = cropTransparent(img, content, spec.bg ?? 'transparent');
    const out = clipHeight(raw, OUTPUT_HEIGHT[name] ?? raw.h);
    const outPath = join(outDir, `${name}.png`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, encodePng(out));
    console.log(`${name}: ${out.w}x${out.h}`);
  });
}
