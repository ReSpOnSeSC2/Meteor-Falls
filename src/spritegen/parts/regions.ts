/**
 * REGION-ACCENT family (locale flavor) — S15g Movement 3b, ADR-046.
 *
 * The same forged shape reads as a different PLACE's foe: England fog-grey is
 * not Africa ochre is not Mars dust. Each accent is a whisper — a few clustered,
 * on-body pixels (ADR-020 rule 1) plus the `trim` ramp it lends the material's
 * hems and the accessory's knobs — never a repaint of the body. The proposer
 * keys the region off the forged enemy's chapter (its place in the Bible).
 */
import { px, RAMP, T } from '../../palette';
import type { Pixmap } from '../pixmap';
import type { RegionAccent } from './types';

function over(pm: Pixmap, x: number, y: number, c: number): void {
  if (pm.get(x, y) !== T) pm.set(x, y, c);
}

/** fog — cold damp grey light along the top edge (the academy, the mountain) */
const fog: RegionAccent = {
  id: 'fog',
  trim: RAMP.NIGHT,
  accent: (ctx) => {
    const { pm, a } = ctx;
    for (let i = 0; i < 6; i++) over(pm, a.cx - 8 + i * 3, a.bodyTop + 3, px(RAMP.NIGHT, 3));
    over(pm, a.cx - a.bodyHalfW + 2, a.eyeY, px(RAMP.PAPER, 1)); // a wisp of mist
    over(pm, a.cx + a.bodyHalfW - 3, a.eyeY + 4, px(RAMP.PAPER, 1));
  },
};

/** ochre — warm desert dust drifted along the base (the kingdom, the palace) */
const ochre: RegionAccent = {
  id: 'ochre',
  trim: RAMP.GOLD,
  accent: (ctx) => {
    const { pm, a, S } = ctx;
    const r = S.use('ochre');
    for (let i = 0; i < 7; i++) {
      const x = a.cx + Math.round((r() * 2 - 1) * a.bodyHalfW);
      over(pm, x, a.bodyBottom - 2 - Math.floor(r() * 3), px(RAMP.ORANGE, 1));
    }
    over(pm, a.cx - 4, a.bodyBottom - 1, px(RAMP.GOLD, 2));
  },
};

/** bog — moss tufts clinging in two deliberate clusters (spore wood, ruins) */
const bog: RegionAccent = {
  id: 'bog',
  trim: RAMP.FOREST,
  accent: (ctx) => {
    const { pm, a } = ctx;
    const tuft = (x: number, y: number): void => {
      over(pm, x, y, px(RAMP.FOREST, 1));
      over(pm, x + 1, y, px(RAMP.FOREST, 2));
      over(pm, x, y + 1, px(RAMP.FOREST, 1));
      over(pm, x + 2, y + 1, px(RAMP.FOREST, 2));
    };
    tuft(a.cx - a.bodyHalfW + 3, a.bodyTop + 12);
    tuft(a.cx + a.bodyHalfW - 6, a.bodyBottom - 12);
  },
};

/** velvet — a plush trim band and a gold tassel (the theater, the count) */
const velvet: RegionAccent = {
  id: 'velvet',
  trim: RAMP.RED,
  accent: (ctx) => {
    const { pm, a } = ctx;
    for (let x = a.cx - a.bodyHalfW + 2; x <= a.cx + a.bodyHalfW - 2; x++) over(pm, x, a.bodyBottom - 7, px(RAMP.RED, 1));
    over(pm, a.cx + a.bodyHalfW - 4, a.bodyBottom - 6, px(RAMP.GOLD, 3)); // the tassel knot
    over(pm, a.cx + a.bodyHalfW - 4, a.bodyBottom - 5, px(RAMP.GOLD, 2));
  },
};

/** dust — faded red Mars grit and a sun-bleached patch (the sea of silence) */
const dust: RegionAccent = {
  id: 'dust',
  trim: RAMP.EARTH,
  accent: (ctx) => {
    const { pm, a, S } = ctx;
    const r = S.use('dust');
    for (let i = 0; i < 6; i++) {
      const x = a.cx + Math.round((r() * 2 - 1) * (a.bodyHalfW - 2));
      const y = a.bodyTop + 6 + Math.floor(r() * (a.bodyBottom - a.bodyTop - 10));
      over(pm, x, y, px(RAMP.RED, 1));
    }
    over(pm, a.cx - 6, a.bodyTop + 5, px(RAMP.PAPER, 2)); // a bleached patch
    over(pm, a.cx - 5, a.bodyTop + 6, px(RAMP.PAPER, 1));
  },
};

export const REGION_ACCENTS: Record<string, RegionAccent> = {
  fog, ochre, bog, velvet, dust,
};
