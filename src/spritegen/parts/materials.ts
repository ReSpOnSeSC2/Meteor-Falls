/**
 * MATERIAL family (the surface) — S15g Movement 3b, ADR-046.
 *
 * A material owns the body's base `ramp` (the silhouette draws its volume in it)
 * and a `surface` pass that lays the deliberate texture MOTIF over the body —
 * chitin plates, hammered rivets, woven thread, carved stone, ember glow, gloss.
 * Every motif is clustered/geometric with at most ONE dither seam per tone
 * transition (ADR-020 rules 1 & 6); none is `scatter()` noise. Marks land only
 * where the silhouette already painted (the `over` guard), so the surface can
 * never spill past the shape.
 */
import { px, RAMP, T } from '../../palette';
import type { Pixmap } from '../pixmap';
import type { Material } from './types';

/** paint only where the body already is — the surface never leaves the shape */
function over(pm: Pixmap, x: number, y: number, c: number): void {
  if (pm.get(x, y) !== T) pm.set(x, y, c);
}
function overV(pm: Pixmap, x: number, y: number, h: number, c: number): void {
  for (let j = 0; j < h; j++) over(pm, x, y + j, c);
}
function overH(pm: Pixmap, x: number, y: number, w: number, c: number): void {
  for (let i = 0; i < w; i++) over(pm, x + i, y, c);
}

/** chitin — a green beetle shell: plate seams, paired freckles, one dither seam */
const chitin: Material = {
  id: 'chitin',
  ramp: RAMP.FOREST,
  trim: RAMP.GOLD,
  surface: (ctx) => {
    const { pm, ramp, a, S } = ctx;
    for (const dy of [7, 15, 23]) overH(pm, a.cx - a.bodyHalfW, a.bodyTop + dy, a.bodyHalfW * 2, px(ramp, 1));
    pm.checker(a.cx + 4, a.bodyBottom - 18, 12, 12, px(ramp, 2), px(ramp, 1), 1);
    const r = S.use('chitin');
    for (let i = 0; i < 4; i++) {
      const x = a.cx - 9 + Math.floor(r() * 18);
      const y = a.bodyTop + 9 + Math.floor(r() * Math.max(1, a.bodyBottom - a.bodyTop - 18));
      over(pm, x, y, px(ramp, 0));
      over(pm, x + 1, y, px(ramp, 0));
    }
  },
};

/** iron — dull pewter: a riveted seam, hammered facets, one white gleam */
const iron: Material = {
  id: 'iron',
  ramp: RAMP.INK,
  trim: RAMP.PAPER,
  surface: (ctx) => {
    const { pm, ramp, a } = ctx;
    for (let y = a.bodyTop + 7; y < a.bodyBottom - 4; y += 6) {
      over(pm, a.cx, y, px(ramp, 0));
      over(pm, a.cx, y - 1, px(ramp, 3));
    }
    pm.checker(a.cx + 2, a.bodyTop + 10, 12, 14, px(ramp, 2), px(ramp, 1), 1);
    over(pm, a.cx - Math.floor(a.bodyHalfW / 2), a.bodyTop + 6, px(RAMP.PAPER, 3)); // the gleam
  },
};

/** cloth — matte woven burlap: thread rows + a trim hem band */
const cloth: Material = {
  id: 'cloth',
  ramp: RAMP.EARTH,
  trim: RAMP.RED,
  surface: (ctx) => {
    const { pm, ramp, trim, a } = ctx;
    for (let y = a.bodyTop + 6; y < a.bodyBottom - 5; y += 3)
      for (let x = a.cx - a.bodyHalfW; x <= a.cx + a.bodyHalfW; x += 2) over(pm, x, y, px(ramp, 1));
    overH(pm, a.cx - a.bodyHalfW, a.bodyBottom - 5, a.bodyHalfW * 2, px(trim, 2));
    overH(pm, a.cx - a.bodyHalfW, a.bodyBottom - 4, a.bodyHalfW * 2, px(trim, 1));
  },
};

/** stone — pale carved limestone: an off-center glyph band, chips, one seam */
const stone: Material = {
  id: 'stone',
  ramp: RAMP.PAPER,
  trim: RAMP.EARTH,
  surface: (ctx) => {
    const { pm, ramp, a } = ctx;
    const by = a.bodyTop + Math.floor((a.bodyBottom - a.bodyTop) * 0.62);
    for (let i = 0; i < 4; i++) {
      pm.line(a.cx - 12 + i * 6, by, a.cx - 9 + i * 6, by - 3, px(ramp, 0));
      pm.line(a.cx - 9 + i * 6, by - 3, a.cx - 6 + i * 6, by, px(ramp, 0));
    }
    pm.checker(a.cx + 4, a.bodyTop + 8, 10, 12, px(ramp, 2), px(ramp, 1), 1);
    over(pm, a.cx + 6, a.bodyTop + 5, px(ramp, 0)); // a chip
  },
};

/** ember — a glowing coal: a bright core bloom + a flicker dither */
const ember: Material = {
  id: 'ember',
  ramp: RAMP.ORANGE,
  trim: RAMP.GOLD,
  surface: (ctx) => {
    const { pm, ramp, a } = ctx;
    const gy = Math.floor((a.bodyTop + a.bodyBottom) / 2) + 2;
    for (let j = -5; j <= 5; j++)
      for (let i = -6; i <= 6; i++) {
        if ((i * i) / 36 + (j * j) / 25 > 1) continue;
        over(pm, a.cx + i, gy + j, px(ramp, i * i + j * j < 9 ? 3 : 2));
      }
    pm.checker(a.cx - 14, a.bodyTop + 6, 10, 12, px(ramp, 2), px(ramp, 1), 1);
  },
};

/** lacquer — glossy violet: a vertical gloss streak + a deep shadow pool */
const lacquer: Material = {
  id: 'lacquer',
  ramp: RAMP.PURPLE,
  trim: RAMP.GOLD,
  surface: (ctx) => {
    const { pm, ramp, a } = ctx;
    overV(pm, a.cx - 6, a.bodyTop + 6, a.bodyBottom - a.bodyTop - 12, px(ramp, 3));
    overV(pm, a.cx - 5, a.bodyTop + 6, a.bodyBottom - a.bodyTop - 12, px(ramp, 2));
    pm.checker(a.cx + 3, a.bodyBottom - 20, 12, 14, px(ramp, 1), px(ramp, 0), 1);
  },
};

export const MATERIALS: Record<string, Material> = {
  chitin, iron, cloth, stone, ember, lacquer,
};
