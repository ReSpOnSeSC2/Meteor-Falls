/**
 * 5×7 pixel font rendered into a RetroFont sheet at boot.
 * Glyphs are 7 rows of 5-bit masks (bit 4 = leftmost pixel).
 * Covers printable ASCII 32–126 plus game glyphs: ▼ ★ ♥ … → ▶
 */
import { Pixmap } from './pixmap';
import { C } from '../palette';

const A = (rows: number[]): number[] => rows;

// ASCII 32..126, in order.
const ASCII_GLYPHS: number[][] = [
  A([0, 0, 0, 0, 0, 0, 0]), // space
  A([4, 4, 4, 4, 4, 0, 4]), // !
  A([10, 10, 10, 0, 0, 0, 0]), // "
  A([10, 10, 31, 10, 31, 10, 10]), // #
  A([4, 15, 20, 14, 5, 30, 4]), // $
  A([24, 25, 2, 4, 8, 19, 3]), // %
  A([12, 18, 20, 8, 21, 18, 13]), // &
  A([12, 4, 8, 0, 0, 0, 0]), // '
  A([2, 4, 8, 8, 8, 4, 2]), // (
  A([8, 4, 2, 2, 2, 4, 8]), // )
  A([0, 4, 21, 14, 21, 4, 0]), // *
  A([0, 4, 4, 31, 4, 4, 0]), // +
  A([0, 0, 0, 0, 12, 4, 8]), // ,
  A([0, 0, 0, 31, 0, 0, 0]), // -
  A([0, 0, 0, 0, 0, 12, 12]), // .
  A([0, 1, 2, 4, 8, 16, 0]), // /
  A([14, 17, 19, 21, 25, 17, 14]), // 0
  A([4, 12, 4, 4, 4, 4, 14]), // 1
  A([14, 17, 1, 2, 4, 8, 31]), // 2
  A([31, 2, 4, 2, 1, 17, 14]), // 3
  A([2, 6, 10, 18, 31, 2, 2]), // 4
  A([31, 16, 30, 1, 1, 17, 14]), // 5
  A([6, 8, 16, 30, 17, 17, 14]), // 6
  A([31, 1, 2, 4, 8, 8, 8]), // 7
  A([14, 17, 17, 14, 17, 17, 14]), // 8
  A([14, 17, 17, 15, 1, 2, 12]), // 9
  A([0, 12, 12, 0, 12, 12, 0]), // :
  A([0, 12, 12, 0, 12, 4, 8]), // ;
  A([2, 4, 8, 16, 8, 4, 2]), // <
  A([0, 0, 31, 0, 31, 0, 0]), // =
  A([8, 4, 2, 1, 2, 4, 8]), // >
  A([14, 17, 1, 2, 4, 0, 4]), // ?
  A([14, 17, 1, 13, 21, 21, 14]), // @
  A([14, 17, 17, 17, 31, 17, 17]), // A
  A([30, 17, 17, 30, 17, 17, 30]), // B
  A([14, 17, 16, 16, 16, 17, 14]), // C
  A([28, 18, 17, 17, 17, 18, 28]), // D
  A([31, 16, 16, 30, 16, 16, 31]), // E
  A([31, 16, 16, 30, 16, 16, 16]), // F
  A([14, 17, 16, 23, 17, 17, 15]), // G
  A([17, 17, 17, 31, 17, 17, 17]), // H
  A([14, 4, 4, 4, 4, 4, 14]), // I
  A([7, 2, 2, 2, 2, 18, 12]), // J
  A([17, 18, 20, 24, 20, 18, 17]), // K
  A([16, 16, 16, 16, 16, 16, 31]), // L
  A([17, 27, 21, 21, 17, 17, 17]), // M
  A([17, 17, 25, 21, 19, 17, 17]), // N
  A([14, 17, 17, 17, 17, 17, 14]), // O
  A([30, 17, 17, 30, 16, 16, 16]), // P
  A([14, 17, 17, 17, 21, 18, 13]), // Q
  A([30, 17, 17, 30, 20, 18, 17]), // R
  A([15, 16, 16, 14, 1, 1, 30]), // S
  A([31, 4, 4, 4, 4, 4, 4]), // T
  A([17, 17, 17, 17, 17, 17, 14]), // U
  A([17, 17, 17, 17, 17, 10, 4]), // V
  A([17, 17, 17, 21, 21, 21, 10]), // W
  A([17, 17, 10, 4, 10, 17, 17]), // X
  A([17, 17, 17, 10, 4, 4, 4]), // Y
  A([31, 1, 2, 4, 8, 16, 31]), // Z
  A([14, 8, 8, 8, 8, 8, 14]), // [
  A([0, 16, 8, 4, 2, 1, 0]), // backslash
  A([14, 2, 2, 2, 2, 2, 14]), // ]
  A([4, 10, 17, 0, 0, 0, 0]), // ^
  A([0, 0, 0, 0, 0, 0, 31]), // _
  A([8, 4, 2, 0, 0, 0, 0]), // `
  A([0, 0, 14, 1, 15, 17, 15]), // a
  A([16, 16, 22, 25, 17, 17, 30]), // b
  A([0, 0, 14, 16, 16, 17, 14]), // c
  A([1, 1, 13, 19, 17, 17, 15]), // d
  A([0, 0, 14, 17, 31, 16, 14]), // e
  A([6, 9, 8, 28, 8, 8, 8]), // f
  A([0, 15, 17, 17, 15, 1, 14]), // g
  A([16, 16, 22, 25, 17, 17, 17]), // h
  A([4, 0, 12, 4, 4, 4, 14]), // i
  A([2, 0, 6, 2, 2, 18, 12]), // j
  A([16, 16, 18, 20, 24, 20, 18]), // k
  A([12, 4, 4, 4, 4, 4, 14]), // l
  A([0, 0, 26, 21, 21, 17, 17]), // m
  A([0, 0, 22, 25, 17, 17, 17]), // n
  A([0, 0, 14, 17, 17, 17, 14]), // o
  A([0, 0, 30, 17, 30, 16, 16]), // p
  A([0, 0, 13, 19, 15, 1, 1]), // q
  A([0, 0, 22, 25, 16, 16, 16]), // r
  A([0, 0, 14, 16, 14, 1, 30]), // s
  A([8, 8, 28, 8, 8, 9, 6]), // t
  A([0, 0, 17, 17, 17, 19, 13]), // u
  A([0, 0, 17, 17, 17, 10, 4]), // v
  A([0, 0, 17, 17, 21, 21, 10]), // w
  A([0, 0, 17, 10, 4, 10, 17]), // x
  A([0, 0, 17, 17, 15, 1, 14]), // y
  A([0, 0, 31, 2, 4, 8, 31]), // z
  A([2, 4, 4, 8, 4, 4, 2]), // {
  A([4, 4, 4, 4, 4, 4, 4]), // |
  A([8, 4, 4, 2, 4, 4, 8]), // }
  A([0, 0, 8, 21, 2, 0, 0]), // ~
];

/**
 * S-Mia: the emoji → Private-Use-Area glyph mapping. Keys are the REAL emoji
 * codepoints (single code point each, no variation selector) Mia's spell lines
 * use; values are the BMP PUA char the font actually draws (the RetroFont can
 * only index single UTF-16 code units, and astral emoji are surrogate pairs).
 * src/ui/text.ts swaps the literal emoji for these at render time. Add a glyph
 * to SPECIALS for every value here, or it renders as tofu (the §5 caveat).
 */
export const EMOJI_GLYPH: Record<string, string> = {
  '🔥': '',
  '❄': '',
  '⚡': '',
  '✨': '',
  '🌟': '',
  '🧲': '',
  '💜': '',
  '💛': '',
  '🍀': '',
  '⭐': '',
  '🌙': '',
};

const SPECIALS: Array<[string, number[]]> = [
  ['▼', A([0, 31, 31, 14, 14, 4, 0])],
  ['★', A([0, 4, 14, 31, 14, 4, 0])],
  ['♥', A([0, 10, 31, 31, 14, 4, 0])],
  ['…', A([0, 0, 0, 0, 0, 0, 21])],
  ['→', A([0, 4, 2, 31, 2, 4, 0])],
  ['▶', A([16, 24, 28, 30, 28, 24, 16])],
  ['—', A([0, 0, 0, 31, 0, 0, 0])],
  ['•', A([0, 0, 12, 30, 30, 12, 0])],
  // ---- S-Mia ("Ability Expansion"): tiny pixel "emoji" glyphs for her spell
  // lines (🔥❄⚡✨🌟🧲💜💛🍀⭐🌙). Each maps to a Private-Use-Area codepoint
  // so the RetroFont can index it as a single UTF-16 code unit (real emoji are
  // astral surrogate pairs the font can't address). The tokenizer in
  // src/ui/text.ts swaps the literal emoji for these PUA chars at draw time, so
  // `text` stores the real codepoint and the zero-binary-asset rule holds —
  // these glyphs are code-drawn, not imported. EMOJI_GLYPH names the mapping.
  [EMOJI_GLYPH['🔥'], A([4, 4, 14, 14, 31, 31, 14])], // fire
  [EMOJI_GLYPH['❄'], A([4, 21, 14, 31, 14, 21, 4])], // snowflake
  [EMOJI_GLYPH['⚡'], A([3, 6, 12, 31, 6, 12, 24])], // lightning bolt
  [EMOJI_GLYPH['✨'], A([4, 4, 21, 14, 21, 4, 4])], // sparkles
  [EMOJI_GLYPH['🌟'], A([4, 14, 31, 14, 21, 0, 0])], // glowing star
  [EMOJI_GLYPH['🧲'], A([27, 17, 17, 17, 17, 14, 0])], // magnet (horseshoe)
  [EMOJI_GLYPH['💜'], A([0, 10, 31, 31, 14, 4, 0])], // purple heart
  [EMOJI_GLYPH['💛'], A([0, 10, 31, 31, 14, 4, 0])], // yellow heart
  [EMOJI_GLYPH['🍀'], A([10, 31, 31, 14, 4, 4, 0])], // clover
  [EMOJI_GLYPH['⭐'], A([0, 4, 14, 31, 14, 4, 0])], // star
  [EMOJI_GLYPH['🌙'], A([12, 24, 16, 16, 16, 24, 12])], // crescent moon
];

export const FONT_CELL_W = 6;
export const FONT_CELL_H = 9;
export const FONT_CHARS_PER_ROW = 16;

/** the charset string in sheet order */
export const FONT_CHARS: string =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') +
  SPECIALS.map(([ch]) => ch).join('');

function glyphOf(ch: string): number[] | undefined {
  const code = ch.charCodeAt(0);
  if (code >= 32 && code <= 126) return ASCII_GLYPHS[code - 32];
  const special = SPECIALS.find(([c]) => c === ch);
  return special?.[1];
}

/** Stamp 5×7 text directly into a pixmap (signs, logos). Advance = 6px. */
export function drawTextInto(pm: Pixmap, text: string, x: number, y: number, c: number): void {
  let cx = x;
  for (const ch of text) {
    const rows = glyphOf(ch);
    if (rows) {
      rows.forEach((bits, ry) => {
        for (let rx = 0; rx < 5; rx++) {
          if (bits & (1 << (4 - rx))) pm.set(cx + rx, y + ry, c);
        }
      });
    }
    cx += 6;
  }
}

/** Render the full glyph grid (white pixels — tint at use sites). */
export function makeFontSheet(): HTMLCanvasElement {
  const glyphs = [...ASCII_GLYPHS, ...SPECIALS.map(([, g]) => g)];
  const rows = Math.ceil(glyphs.length / FONT_CHARS_PER_ROW);
  const pm = new Pixmap(FONT_CHARS_PER_ROW * FONT_CELL_W, rows * FONT_CELL_H);
  glyphs.forEach((rowsBits, idx) => {
    const gx = (idx % FONT_CHARS_PER_ROW) * FONT_CELL_W;
    const gy = Math.floor(idx / FONT_CHARS_PER_ROW) * FONT_CELL_H + 1;
    rowsBits.forEach((bits, y) => {
      for (let x = 0; x < 5; x++) {
        if (bits & (1 << (4 - x))) pm.set(gx + x, gy + y, C.white);
      }
    });
  });
  return pm.toCanvas();
}
