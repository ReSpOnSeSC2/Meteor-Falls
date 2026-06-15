/**
 * THE GLYPH FORGE — S18 Movement 22 (ADR-092). The icon forge's sibling.
 *
 * EarthBound's world is full of WRITING that isn't English: rune-marks on
 * ancient stones, squiggle-script on a foreign sign, the flourish stamped over a
 * bazaar banner, the seal carved above a temple door, the dead readout glowing
 * on a Mars interface. THE GLYPH FORGE gives Meteor Falls that vocabulary the
 * way THE ICON FORGE (ADR-062) gave the §A8 catalog its 500 faces: a parametric,
 * deterministic, palette-clean engine that stamps a DECORATIVE, REGION-TRUE
 * glyph RUN by construction — so an Africa market banner can never be mistaken
 * for a Mt. Shu temple inscription or a Mars dead-interface readout (§A11.7 at
 * the stroke level: a glyph that could move to another region unchanged is not
 * done). It implements §A11.8 THE GLYPH LAW.
 *
 * A glyph run is composed from THREE independent choices, exactly like the icon
 * forge — so two runs are never the same drawing:
 *
 *   1. SCRIPT FAMILY = the STROKE GRAMMAR (`runic`, `cursive`, `seal`,
 *      `barscript`, `hush`…). HOW the marks are made — angular staves vs looping
 *      cursive vs a square seal vs broken machine segments. The silhouette layer.
 *   2. REGION RAMP  = `REGION_RAMPS[band]` (reused from the icon forge), so a
 *      glyph wears its region's mood. WHERE it's from.
 *   3. SEED         = a stable id → mulberry32 ⊕ fnv. Lays out the SPECIFIC run:
 *      how many glyphs, and which stroke variant each cell takes. WHICH writing
 *      this is. A run reproduces forever off its seed (NOT a map stream — glyphs
 *      need no world_block / levelkit re-pin, ADR-062's discipline).
 *
 * Phaser-free on purpose (the validator + the contact-sheet tool import it). The
 * ADR-020 laws hold BY CONSTRUCTION: the Pixmap DSL accepts only palette indices
 * (no API takes an RGB), strokes are flat and deliberate (no scatter noise),
 * `outline()` lands LAST so each run lives inside one INK contour, and only pure
 * light (a glint) follows the contour.
 *
 * §A11.6 SAFETY: glyphs are diegetic DECORATION. A script family draws abstract
 * stroke-forms, never the Latin alphabet — a run spells nothing readable, so it
 * can never leak a chapter title or chapter structure. §A11.3: the Hush's script
 * is sparse, lowercase-feeling, WRONG — and never funny.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, px, C, T } from '../palette';
import { REGION_RAMPS } from './iconforge';
import type { ItemBand } from '../schemas';

/** one glyph occupies a 7×11 cell; cells are spaced by GAP and the whole run
 *  keeps a 1px transparent margin so `outline()` has room to land. */
export const GLYPH_CELL_W = 7;
export const GLYPH_CELL_H = 11;
const GAP = 2;
const MARGIN = 1;

/* small shade helpers (the iconforge convention) */
const d = (r: number): number => px(r, 1); // shadow
const m = (r: number): number => px(r, 2); // mid
const l = (r: number): number => px(r, 3); // light

/* ====================================================================== */
/* THE COMPOSE CONTEXT                                                      */

export interface GlyphCtx {
  pm: Pixmap;
  /** the body ramp, chosen from the band pool by seed (layer 2) */
  ramp: number;
  /** a second pool ramp for trim / accents */
  accent: number;
}

interface Script {
  /** human note: which region's voice this grammar carries (gallery labels) */
  voice: string;
  /** draw ONE glyph into the cell at (x0,y0); `r` is this cell's deterministic
   *  sub-stream, so a run reads like varied writing, not a repeated stamp. */
  cell: (ctx: GlyphCtx, x0: number, y0: number, r: () => number) => void;
  /** OPTIONAL pure light that follows the contour (ADR-020) — a glint per cell */
  light?: (ctx: GlyphCtx, x0: number, y0: number) => void;
}

/** pick one of n by the cell's stream */
const pick = (r: () => number, n: number): number => Math.floor(r() * n) % n;

/* ====================================================================== */
/* LAYER 1 — THE SCRIPT FAMILIES                                            */
/* One stroke-grammar per family. The region recolours it and the per-cell  */
/* seed varies the specific glyph. Each grammar is structurally distinct     */
/* from its siblings (a stave is runic, a loop is cursive, a box is a seal)  */
/* so no two regions' writing can be confused at a glance.                   */

const SCRIPTS: Record<string, Script> = {
  accent: {
    voice: 'accent-mark festival script',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const cx = x0 + 3;
      const stem = pick(r, 4);
      if (stem === 0) pm.vline(cx, y0 + 3, 5, m(ramp));
      else if (stem === 1) pm.line(cx - 2, y0 + 7, cx + 2, y0 + 3, m(ramp));
      else if (stem === 2) pm.frame(cx - 2, y0 + 3, 5, 5, m(ramp));
      else {
        pm.hline(cx - 2, y0 + 6, 5, m(ramp));
        pm.vline(cx, y0 + 3, 5, m(ramp));
      }
      const mark = pick(r, 4);
      if (mark === 0) pm.hline(cx - 1, y0 + 1, 3, m(accent));
      else if (mark === 1) pm.line(cx - 1, y0 + 2, cx + 1, y0, m(accent));
      else if (mark === 2) {
        pm.set(cx - 1, y0 + 1, m(accent));
        pm.set(cx + 1, y0 + 1, m(accent));
      } else {
        pm.set(cx, y0, l(accent));
        pm.set(cx - 1, y0 + 1, m(accent));
        pm.set(cx + 1, y0 + 1, m(accent));
      }
    },
    light: ({ pm }, x0, y0) => pm.set(x0 + 3, y0 + 1, C.white),
  },

  ramp: {
    voice: 'stepped transit ramp script',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const base = y0 + 8;
      const rise = 2 + pick(r, 4);
      pm.line(x0 + 1, base, x0 + 5, base - rise, m(ramp));
      pm.line(x0 + 1, base + 1, x0 + 5, base + 1 - rise, d(ramp));
      const ticks = 1 + pick(r, 3);
      for (let i = 0; i < ticks; i++) {
        const tx = x0 + 1 + i * 2;
        pm.vline(tx, base - i, 2, m(accent));
      }
      if (pick(r, 2) === 0) pm.hline(x0 + 2, y0 + 2, 4, m(accent));
      else pm.line(x0 + 2, y0 + 2, x0 + 5, y0 + 4, m(accent));
    },
  },

  /** COLONIAL — sign-painted Americana caps: a thick post + bars + serif feet.
   *  Otterbrook hardware-store lettering, the diner window, the bus-stop board. */
  colonial: {
    voice: 'sign-painted Americana',
    cell: ({ pm, ramp }, x0, y0, r) => {
      const cx = x0 + 3;
      const form = pick(r, 6);
      const post = (): void => {
        pm.vline(cx, y0 + 1, 8, m(ramp));
        pm.vline(cx - 1, y0 + 1, 8, l(ramp)); // a painted highlight edge
      };
      const feet = (): void => {
        pm.hline(cx - 2, y0 + 1, 4, d(ramp)); // top serif
        pm.hline(cx - 2, y0 + 8, 4, d(ramp)); // foot serif
      };
      if (form === 0) { post(); feet(); } //  I
      else if (form === 1) { post(); pm.hline(cx, y0 + 1, 4, m(ramp)); pm.hline(cx, y0 + 8, 4, m(ramp)); } // E-ish
      else if (form === 2) { post(); pm.hline(cx, y0 + 8, 3, m(ramp)); } // L
      else if (form === 3) { pm.frame(x0 + 1, y0 + 1, 5, 8, m(ramp)); pm.vline(x0 + 1, y0 + 1, 8, l(ramp)); } // O
      else if (form === 4) { post(); pm.hline(cx - 2, y0 + 4, 4, m(ramp)); pm.vline(cx + 2, y0 + 1, 8, m(ramp)); } // H
      else { pm.hline(cx - 2, y0 + 1, 5, m(ramp)); pm.vline(cx, y0 + 1, 8, m(ramp)); } // T
    },
  },

  /** DECO — Brickton's tall future-city lettering: stepped art-deco verticals
   *  with a chevron cap and a zig speed-line. Cold, narrow, neon-shaped. */
  deco: {
    voice: 'art-deco future city',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const cx = x0 + 3;
      pm.vline(cx, y0 + 2, 7, m(ramp)); // the tall stem
      pm.vline(cx - 1, y0 + 3, 6, l(ramp));
      const cap = pick(r, 3);
      if (cap === 0) { pm.line(cx - 2, y0 + 2, cx, y0, m(accent)); pm.line(cx + 2, y0 + 2, cx, y0, m(accent)); } // chevron
      else if (cap === 1) { pm.hline(cx - 2, y0 + 1, 5, m(accent)); pm.hline(cx - 1, y0, 3, l(accent)); } // a stepped lintel
      else { pm.rect(cx - 1, y0, 3, 2, m(accent)); } // a block cap
      // a deco speed-line stepping off the base
      if (pick(r, 2) === 0) { pm.hline(cx, y0 + 8, 3, d(accent)); pm.set(cx + 2, y0 + 9, d(accent)); }
    },
    light: ({ pm }, x0, y0) => pm.set(x0 + 2, y0 + 3, C.white),
  },

  /** TALAVERA — Andean colonial tilework: a lozenge with a centre dot and flanking
   *  ticks, the painted-pottery motif of Puerto Sol & Valle Dorado. */
  talavera: {
    voice: 'Andean painted tile',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const cx = x0 + 3;
      const cy = y0 + 5;
      // the diamond/lozenge
      pm.line(cx, cy - 3, cx + 3, cy, m(ramp));
      pm.line(cx + 3, cy, cx, cy + 3, m(ramp));
      pm.line(cx, cy + 3, cx - 3, cy, m(ramp));
      pm.line(cx - 3, cy, cx, cy - 3, m(ramp));
      const fill = pick(r, 3);
      if (fill === 0) pm.set(cx, cy, m(accent)); // a centre dot
      else if (fill === 1) { pm.set(cx, cy - 1, m(accent)); pm.set(cx, cy + 1, m(accent)); } // a stacked pair
      else pm.rect(cx - 1, cy - 1, 3, 3, d(ramp)); // a hollow heart
      // flanking ticks above & below, painted on
      if (pick(r, 2) === 0) { pm.set(cx, y0 + 1, m(accent)); pm.set(cx, y0 + 9, m(accent)); }
    },
  },

  /** FRAKTUR — England's institutional blackletter: tall narrow strokes, angular
   *  serifs, a diagonal hairline. Wintermoor's faculty signage, Foggybottom stone. */
  fraktur: {
    voice: 'blackletter institution',
    cell: ({ pm, ramp }, x0, y0, r) => {
      const cx = x0 + 3;
      pm.vline(cx, y0 + 1, 9, m(ramp)); // the heavy stem
      pm.set(cx - 1, y0 + 1, d(ramp)); // top-left serif barb
      pm.set(cx + 1, y0 + 9, d(ramp)); // bottom-right serif barb
      const adorn = pick(r, 4);
      if (adorn === 0) pm.line(cx - 2, y0 + 2, cx + 2, y0 + 6, d(ramp)); // a diagonal hairline
      else if (adorn === 1) { pm.vline(cx + 2, y0 + 1, 9, m(ramp)); pm.hline(cx, y0 + 5, 3, d(ramp)); } // a second stem + brace
      else if (adorn === 2) { pm.hline(cx - 1, y0 + 1, 3, m(ramp)); pm.set(cx - 2, y0 + 3, d(ramp)); } // a fraktur head
      else pm.line(cx, y0 + 9, cx - 2, y0 + 7, d(ramp)); // a kicked foot
    },
  },

  /** RUNIC — Norse rune-marks carved on the Sleeper's stones: a vertical stave
   *  with 1–3 angular branches. Kvisthavn's harbour-posts, Lilleby's giant signs. */
  runic: {
    voice: 'carved Norse rune',
    cell: ({ pm, ramp }, x0, y0, r) => {
      const cx = x0 + 2;
      pm.vline(cx, y0 + 1, 9, m(ramp)); // the stave
      pm.vline(cx - 1, y0 + 1, 9, d(ramp)); // the carved shadow groove
      const branches = 1 + pick(r, 3);
      for (let b = 0; b < branches; b++) {
        const at = y0 + 2 + pick(r, 6);
        const up = pick(r, 2) === 0;
        const len = 2 + pick(r, 2);
        if (up) pm.line(cx, at, cx + len, at - len, m(ramp));
        else pm.line(cx, at, cx + len, at + len, m(ramp));
      }
    },
  },

  /** HERALDIC — Minimus's jewel-box heraldry: a tiny crest mark — a shield, a
   *  pennant, a fleur tick. Precise and minuscule, fit for a tabletop duchy. */
  heraldic: {
    voice: 'tiny ducal heraldry',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const cx = x0 + 3;
      const mark = pick(r, 3);
      if (mark === 0) {
        // a little shield
        pm.rect(cx - 2, y0 + 2, 5, 3, m(ramp));
        pm.contour(cx, y0 + 5, [2, 1, 0], m(ramp));
        pm.set(cx, y0 + 3, m(accent)); // a charge
      } else if (mark === 1) {
        // a pennant on a staff
        pm.vline(cx - 2, y0 + 1, 8, d(ramp));
        pm.contour(cx - 1, y0 + 2, [-1, 1, 3, 1], m(accent));
        pm.hline(cx - 1, y0 + 2, 3, m(accent));
      } else {
        // a fleur tick
        pm.vline(cx, y0 + 2, 6, m(ramp));
        pm.set(cx - 1, y0 + 3, m(accent));
        pm.set(cx + 1, y0 + 3, m(accent));
        pm.hline(cx - 1, y0 + 6, 3, m(ramp));
      }
    },
    light: ({ pm }, x0, y0) => pm.set(x0 + 3, y0 + 2, C.white),
  },

  /** CURSIVE — Zanzibel's flowing bazaar-banner script: a connected baseline
   *  wave with loops above. The best market music in the game, written down. */
  cursive: {
    voice: 'flowing bazaar banner',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      // the connecting baseline stroke (runs cell to cell)
      pm.line(x0, y0 + 7, x0 + GLYPH_CELL_W, y0 + 7, m(ramp));
      const loop = pick(r, 4);
      const cx = x0 + 3;
      if (loop === 0) { pm.contour(cx, y0 + 2, [0, 1, 2, 1, 0], m(ramp)); pm.set(cx, y0 + 4, T); } // an open loop
      else if (loop === 1) { pm.line(cx - 2, y0 + 6, cx, y0 + 2, m(ramp)); pm.line(cx, y0 + 2, cx + 2, y0 + 6, m(ramp)); } // an ascender peak
      else if (loop === 2) { pm.ellipse(cx, y0 + 4, 2, 2, m(ramp)); pm.set(cx, y0 + 4, T); pm.set(cx + 2, y0 + 8, m(accent)); } // a bowl + a dot below
      else pm.line(cx - 2, y0 + 7, cx + 2, y0 + 3, m(ramp)); // a rising tail
      // a diacritic dot, scattered above by the stream
      if (pick(r, 2) === 0) pm.set(cx + pick(r, 2), y0 + 1, m(accent));
    },
  },

  /** BARSCRIPT — Chandrapore's Devanagari-feel script: glyphs HANG from a top
   *  headline bar, with verticals and a curl below. India's loud, dense lettering. */
  barscript: {
    voice: 'headline-bar bazaar script',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      pm.hline(x0, y0 + 2, GLYPH_CELL_W, m(ramp)); // the shirorekha headline bar
      const cx = x0 + 3;
      const body = pick(r, 4);
      pm.vline(cx, y0 + 2, 6, m(ramp)); // a hanging vertical
      if (body === 0) pm.contour(cx, y0 + 7, [2, 1], m(ramp)); // a rounded belly
      else if (body === 1) { pm.vline(cx - 2, y0 + 2, 6, m(ramp)); pm.hline(cx - 2, y0 + 5, 3, d(ramp)); } // twin legs + brace
      else if (body === 2) { pm.line(cx, y0 + 7, cx + 2, y0 + 9, m(ramp)); pm.set(cx + 2, y0 + 9, m(accent)); } // a curl tail
      else pm.ellipse(cx, y0 + 6, 1, 2, m(ramp)); // a closed loop
      if (pick(r, 2) === 0) pm.set(cx, y0, m(accent)); // a vowel mark above the bar
    },
  },

  /** SEAL — Mt. Shu / Lotus Harbor seal-script: a square box subdivided by a few
   *  internal strokes, the carved chop of a temple. Blocky, balanced, sincere. */
  seal: {
    voice: 'carved temple seal',
    cell: ({ pm, ramp }, x0, y0, r) => {
      pm.frame(x0 + 1, y0 + 1, 5, 9, m(ramp)); // the seal border
      pm.vline(x0 + 1, y0 + 1, 9, l(ramp)); // a lit chiselled edge
      const inner = pick(r, 4);
      const cx = x0 + 3;
      if (inner === 0) { pm.hline(x0 + 1, y0 + 5, 5, m(ramp)); pm.vline(cx, y0 + 1, 9, m(ramp)); } // a cross
      else if (inner === 1) { pm.hline(x0 + 2, y0 + 4, 3, m(ramp)); pm.hline(x0 + 2, y0 + 7, 3, m(ramp)); } // two bars
      else if (inner === 2) { pm.vline(cx, y0 + 2, 7, m(ramp)); pm.hline(x0 + 2, y0 + 6, 3, m(ramp)); } // a 十
      else { pm.vline(x0 + 3, y0 + 2, 7, m(ramp)); pm.vline(x0 + 4, y0 + 2, 7, m(ramp)); } // a pair of strokes
    },
  },

  /** SLAVONIC — Valea Stelelor's village Cyrillic-feel: angular forms with a
   *  mirrored vertical and a crossbar, hand-painted on the star-gate fences. */
  slavonic: {
    voice: 'painted village Cyrillic',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const cx = x0 + 3;
      const form = pick(r, 5);
      pm.vline(x0 + 1, y0 + 1, 8, m(ramp)); // a left post
      if (form === 0) { pm.vline(x0 + 5, y0 + 1, 8, m(ramp)); pm.hline(x0 + 1, y0 + 5, 5, m(ramp)); } // Н
      else if (form === 1) { pm.line(x0 + 1, y0 + 1, x0 + 5, y0 + 8, m(ramp)); pm.vline(x0 + 5, y0 + 1, 8, m(ramp)); } // И
      else if (form === 2) { pm.hline(x0 + 1, y0 + 1, 5, m(ramp)); pm.vline(cx, y0 + 1, 8, m(ramp)); } // Т-ish
      else if (form === 3) { pm.rect(x0 + 1, y0 + 1, 5, 4, m(ramp)); pm.vline(x0 + 1, y0 + 5, 4, m(ramp)); } // Б-ish
      else { pm.line(x0 + 1, y0 + 5, x0 + 5, y0 + 1, m(ramp)); pm.line(x0 + 1, y0 + 5, x0 + 5, y0 + 8, m(ramp)); pm.set(cx, y0 + 5, m(accent)); } // Ж spur
    },
  },

  /** FROST — Aurora Station's cold readout: a crystalline dendrite, a central
   *  axis with symmetric branchlets. Alaska's frozen, functional signage. */
  frost: {
    voice: 'crystalline Aurora readout',
    cell: ({ pm, ramp, accent }, x0, y0, r) => {
      const cx = x0 + 3;
      pm.vline(cx, y0 + 1, 9, m(ramp)); // the axis
      const arms = 2 + pick(r, 2);
      for (let a = 0; a < arms; a++) {
        const at = y0 + 2 + a * 2 + pick(r, 2);
        const len = 1 + pick(r, 2);
        pm.line(cx, at, cx - len, at - 1, m(accent)); // symmetric branchlets
        pm.line(cx, at, cx + len, at - 1, m(accent));
      }
      pm.set(cx, y0 + 1, l(accent)); // a frozen tip
      pm.set(cx, y0 + 9, l(accent));
    },
    light: ({ pm }, x0, y0) => pm.set(x0 + 3, y0 + 5, C.white),
  },

  /** TIKI — Mauna Lani's carved petroglyph: a totem stick-form or a wave/triangle
   *  motif, chiselled into lava rock. Hawaii's island marks. */
  tiki: {
    voice: 'carved island petroglyph',
    cell: ({ pm, ramp }, x0, y0, r) => {
      const cx = x0 + 3;
      const mark = pick(r, 3);
      if (mark === 0) {
        // a petroglyph figure: round head, body bar, two legs
        pm.ellipse(cx, y0 + 2, 1, 1, m(ramp));
        pm.vline(cx, y0 + 3, 4, m(ramp));
        pm.line(cx, y0 + 7, cx - 2, y0 + 9, m(ramp));
        pm.line(cx, y0 + 7, cx + 2, y0 + 9, m(ramp));
        pm.hline(cx - 2, y0 + 4, 5, m(ramp)); // outstretched arms
      } else if (mark === 1) {
        // stacked wave chevrons (the sea)
        for (const yy of [y0 + 3, y0 + 6]) {
          pm.line(x0 + 1, yy + 1, cx, yy - 1, m(ramp));
          pm.line(cx, yy - 1, x0 + 5, yy + 1, m(ramp));
        }
      } else {
        // a carved triangle (a mountain / shark-tooth)
        pm.contour(cx, y0 + 2, [0, 1, 2, 3, 4], m(ramp));
        pm.hline(x0 + 1, y0 + 7, 5, d(ramp));
      }
    },
  },

  /** HUSH — Mars, the dead interface (§A7 Ch.10, §A11.3). A broken seven-segment
   *  readout: sparse fragments, some cells nearly empty, lowercase-feeling, WRONG.
   *  Never funny — it is what writing looks like after the warmth is eaten. */
  hush: {
    voice: 'the dead Mars interface',
    cell: ({ pm, ramp }, x0, y0, r) => {
      // a faint seven-segment frame with most segments MISSING — it can't finish
      const cx = x0 + 3;
      const present = pick(r, 4);
      // most of the time, only one or two cold strokes survive
      if (present === 0) pm.hline(x0 + 2, y0 + 8, 3, d(ramp)); // a low, lowercase-feeling bar
      else if (present === 1) { pm.vline(cx + 1, y0 + 5, 3, d(ramp)); pm.set(cx + 1, y0 + 8, m(ramp)); } // a half-digit, dropped
      else if (present === 2) { pm.hline(x0 + 2, y0 + 5, 2, d(ramp)); pm.set(x0 + 5, y0 + 6, d(ramp)); } // disconnected segments
      else {
        // a glitched glyph: a stroke that starts and gives up
        pm.vline(cx, y0 + 4, 2, d(ramp));
        pm.set(cx, y0 + 7, m(ramp));
      }
      // a stray dead pixel, far from the rest — the silence between
      if (pick(r, 3) === 0) pm.set(x0 + 1 + pick(r, 5), y0 + 1 + pick(r, 2), d(ramp));
    },
  },
};

/* ====================================================================== */
/* THE FORGE                                                               */

export type ScriptFamily = keyof typeof SCRIPTS;

export interface GlyphSpec {
  /** layer 1 — which family's stroke grammar */
  script: ScriptFamily;
  /** layer 2 — the region whose palette mood the run wears */
  band: ItemBand;
  /** the stable id the ramp + per-cell streams seed off (defaults to the script
   *  name — what the gallery uses; real surfaces pass their own id) */
  seed?: string;
  /** how many glyphs in the run (a "word"); defaults to 4 */
  length?: number;
  /** force the body ramp (skip the seeded pool pick) — for a region whose mood
   *  fights its band pool (Brickton's cold deco over warm ch1 ramps) */
  ramp?: number;
  /** force the accent ramp */
  accent?: number;
}

/** FNV-1a → 32-bit. A deterministic seed from a string id (NOT a map stream —
 *  glyphs need no world_block / levelkit re-pin, ADR-062). */
function fnv32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickRamp(pool: number[], r: () => number): number {
  return pool[Math.floor(r() * pool.length)];
}

/**
 * Forge one decorative glyph RUN from its three layers. Pure: (script, band,
 * seed, length) → identical bytes forever. An unknown script returns an empty
 * canvas — the both-directions gate + the distinctness test catch that before it
 * ships.
 */
export function forgeGlyphRun(spec: GlyphSpec): Pixmap {
  const script = SCRIPTS[spec.script];
  const length = Math.max(1, spec.length ?? 4);
  const w = MARGIN * 2 + length * GLYPH_CELL_W + (length - 1) * GAP;
  const h = MARGIN * 2 + GLYPH_CELL_H;
  const pm = new Pixmap(w, h);
  if (!script) return pm;

  const pool = REGION_RAMPS[spec.band] ?? REGION_RAMPS.cross;
  const seed = spec.seed ?? spec.script;
  const stream = (name: string): (() => number) => mulberry32((fnv32(seed) ^ fnv32(name)) >>> 0);

  const ramp = spec.ramp ?? pickRamp(pool, stream('ramp'));
  let accent = spec.accent ?? pickRamp(pool, stream('accent'));
  if (accent === ramp) accent = pool[(pool.indexOf(ramp) + 1) % pool.length];

  const ctx: GlyphCtx = { pm, ramp, accent };
  const origins: Array<[number, number]> = [];
  for (let i = 0; i < length; i++) {
    const x0 = MARGIN + i * (GLYPH_CELL_W + GAP);
    const y0 = MARGIN;
    origins.push([x0, y0]);
    script.cell(ctx, x0, y0, stream(`cell${i}`));
  }
  pm.outline(C.outline);
  if (script.light) for (const [x0, y0] of origins) script.light(ctx, x0, y0); // pure light after the contour
  return pm;
}

/* ====================================================================== */
/* THE SCRIPT CATALOG + THE GALLERY                                         */

/** every script family the forge can stamp — the both-directions sweep target */
export const SCRIPT_CATALOG: ScriptFamily[] = Object.keys(SCRIPTS) as ScriptFamily[];

/** the in-voice note for each family (gallery captions) */
export const SCRIPT_VOICE: Record<ScriptFamily, string> = Object.fromEntries(
  (Object.entries(SCRIPTS) as Array<[ScriptFamily, Script]>).map(([k, s]) => [k, s.voice]),
) as Record<ScriptFamily, string>;

export interface GlyphGallerySample {
  script: ScriptFamily;
  voice: string;
  band: ItemBand;
  pm: Pixmap;
}

/** a sample band per family for the `--forge` gallery — chosen so the gallery
 *  also reads as a palette tour (each family in a region it actually serves). */
const GALLERY_BAND: Record<ScriptFamily, ItemBand> = {
  accent: 'cross',
  ramp: 'cross',
  colonial: 'ch1', deco: 'ch1', talavera: 'ch2', fraktur: 'ch3', runic: 'ch4',
  heraldic: 'ch5', cursive: 'ch6', barscript: 'ch7', seal: 'ch8', slavonic: 'ch9',
  frost: 'ch10', tiki: 'ch10', hush: 'ch10',
};

/**
 * Render one sample of every script family (grammar × a sample ramp × a length-5
 * run). The `--forge` contact sheet and the distinctness test both consume this:
 * it is the proof that the forge stamps a distinct, region-true script for every
 * planned family.
 */
export function forgeGlyphGallery(): GlyphGallerySample[] {
  return SCRIPT_CATALOG.map((script) => ({
    script,
    voice: SCRIPT_VOICE[script],
    band: GALLERY_BAND[script],
    pm: forgeGlyphRun({ script, band: GALLERY_BAND[script], length: 5, seed: `gallery_${script}` }),
  }));
}

/* ====================================================================== */
/* THE AREA REGISTRY — every canon §A5/§A6 area's region-true script         */
/* The way ADR-066 gave each area its own AREA_SKINS building roster, every  */
/* CANON_AREA owns ONE region-true glyph script here. Pinned BOTH directions */
/* (the `glyph-script` validator gate + the glyphs.test.ts mirror) against    */
/* spritegen/buildings.ts CANON_AREAS: every area has a script, no orphan.    */
/* The KEYS are area strings (this forge stays free of the buildings import); */
/* the gate is what proves the two lists agree.                               */

export interface GlyphScriptSpec {
  /** the family whose stroke grammar this area writes in */
  script: ScriptFamily;
  /** the region mood pool the run wears */
  band: ItemBand;
  /** the run length the area's signage tends toward */
  length?: number;
  /** a forced body ramp where the area's mood fights its band pool */
  ramp?: number;
  /** a forced accent ramp */
  accent?: number;
}

export const GLYPH_SCRIPT: Record<string, GlyphScriptSpec> = {
  // CH.1 AMERICA — sign-painted Americana. Brickton's 2077 downtown swaps to cold
  // art-deco future-lettering (its band stays ch1, so the cool ramp is forced).
  otterbrook: { script: 'colonial', band: 'ch1', length: 4 },
  brickton: { script: 'deco', band: 'ch1', length: 5, ramp: RAMP.BLUE, accent: RAMP.CYAN },
  cage_park: { script: 'colonial', band: 'ch1', length: 4, ramp: RAMP.RED, accent: RAMP.GRASS },
  golf_resort: { script: 'colonial', band: 'ch1', length: 4, ramp: RAMP.GRASS, accent: RAMP.GOLD },
  // CH.2 SOUTH AMERICA — Andean painted-tile lozenges.
  puerto_sol: { script: 'talavera', band: 'ch2', length: 5 },
  // CH.3 ENGLAND — institutional blackletter (town stone + faculty signage).
  foggybottom: { script: 'fraktur', band: 'ch3', length: 5 },
  wintermoor: { script: 'fraktur', band: 'ch3', length: 4, ramp: RAMP.PAPER, accent: RAMP.CYAN },
  // CH.4 NORWAY — carved Norse rune-marks (harbour posts → giants' signs).
  kvisthavn: { script: 'runic', band: 'ch4', length: 4 },
  lilleby: { script: 'runic', band: 'ch4', length: 6 }, // a giants' sign runs long
  // CH.5 MINIMUS — minuscule ducal heraldry.
  minimus: { script: 'heraldic', band: 'ch5', length: 5 },
  // CH.6 AFRICA — the flowing bazaar-banner cursive.
  zanzibel: { script: 'cursive', band: 'ch6', length: 6 },
  // CH.7 INDIA — the headline-bar bazaar script.
  chandrapore: { script: 'barscript', band: 'ch7', length: 6 },
  // CH.8 CHINA — the carved temple seal.
  lotus_harbor: { script: 'seal', band: 'ch8', length: 4 },
  // CH.9 ROMANIA — the painted-village Cyrillic of the star gates.
  valea: { script: 'slavonic', band: 'ch9', length: 5 },
  // CH.10 ALASKA / HAWAII / MARS — cold crystal, carved island stone, dead silence.
  aurora: { script: 'frost', band: 'ch10', length: 4, ramp: RAMP.CYAN, accent: RAMP.PAPER },
  mauna_lani: { script: 'tiki', band: 'ch10', length: 5, ramp: RAMP.EARTH, accent: RAMP.GRASS },
  mars: { script: 'hush', band: 'ch10', length: 5, ramp: RAMP.PURPLE, accent: RAMP.NIGHT },
};

/** the Phaser texture key an area's banner glyph registers under (index.ts) */
export function glyphBannerKey(area: string): string {
  return `glyph_${area}`;
}

export function glyphScriptBannerKey(script: ScriptFamily): string {
  return `glyph_banner_${script}`;
}

export function scriptBannerRun(script: ScriptFamily): Pixmap {
  return forgeGlyphRun({ script, band: GALLERY_BAND[script] ?? 'cross', seed: `banner_${script}`, length: 7 });
}

/** forge an area's region-true glyph run (seeded off the area id, so a place's
 *  signage reproduces forever). Returns an empty 1×1 canvas for an unknown area —
 *  the both-directions gate catches that before it ships. */
export function areaGlyphRun(area: string): Pixmap {
  const spec = GLYPH_SCRIPT[area];
  if (!spec) return new Pixmap(1, 1);
  return forgeGlyphRun({ ...spec, seed: area });
}
