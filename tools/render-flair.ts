/**
 * THE FLAIR CONTACT SHEET (S18 M23, ADR-093). The sibling of render-glyphs.ts.
 * Renders every flair glyph in a labelled gallery PLUS a handful of SAMPLE LINES
 * (a battle cast with element flair, a SMAAASH crit, a heal, a KO, a warm
 * dialogue line) through the REAL mixed-run layout into .shots/ — the out-of-game
 * half of the flair review. Visual proof lives HERE, not in preview_screenshot
 * (which hangs on the WebGL canvas, per ADR-059/060).
 *
 *   npm run art:flair
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, px, T } from '../src/palette';
import { drawTextInto } from '../src/spritegen/font';
import { GLYPH_TOKENS, flairGlyph, glyphCells } from '../src/spritegen/flair';
import { parseAtoms, layoutAtoms } from '../src/ui/runlayout';
import { pixmapToPng } from './png';

const SCALE = 4;
const PAD = 6;
const LINE_H = 11; // the in-game retro-font line pitch (cell 9 + lineSpacing 2)
const Y_BIAS = 0; // shared with flairline.ts GLYPH_Y_BIAS — keeps the sheet honest

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

/** lay a flair string out exactly as the game does (cw 6, lineHeight 11) and
 *  stamp it: text via drawTextInto, glyphs blitted over their reserved slots. */
function renderLine(dst: Pixmap, str: string, x: number, y: number, maxWidthPx: number, color: number): number {
  const lay = layoutAtoms(parseAtoms(str, glyphCells), Math.floor(maxWidthPx / 6));
  lay.text.split('\n').forEach((ln, li) => drawTextInto(dst, ln, x, y + li * LINE_H, color));
  for (const g of lay.glyphs) {
    const gp = flairGlyph(g.name);
    const slotPx = g.cells * 6;
    blit(dst, gp, x + g.col * 6 + Math.floor((slotPx - gp.w) / 2), y + g.line * LINE_H + Math.floor((LINE_H - gp.h) / 2) + Y_BIAS);
  }
  return lay.lines;
}

/* ---- THE GALLERY: every glyph, captioned ---- */
const COLS = 7;
const CELL = 38; // a generous panel per glyph
const galRows = Math.ceil(GLYPH_TOKENS.length / COLS);

/* ---- THE SAMPLE LINES (the mixed run, read by eye) ---- */
const SAMPLES: Array<{ label: string; line: string }> = [
  { label: 'battle · elemental cast', line: 'Mia let loose Vibe Fire! {g:fire}' },
  { label: 'battle · freeze + volt', line: 'Vibe Freeze found the seam. {g:freeze} Then the thunder! {g:volt}' },
  { label: 'battle · SMAAASH crit', line: 'Jay tried the Casey swing! SMAAASH!! 412 damage! {g:smash}' },
  { label: 'battle · a heal', line: 'Mia hummed a warm note! {g:sparkle} Jay recovered about 60 HP!' },
  { label: 'battle · a foe KO', line: 'The Coily Cicada gave one last apologetic buzz. {g:star}' },
  { label: 'dialogue · one warm wink', line: '@Lemonade! 25 cents! The secret ingredient is lemons. {g:lemon}' },
  { label: 'dialogue · wrap test', line: '@Thirty-one years on this route and not ONE box {g:phone} ever called my work derivative until today.' },
];

const SHEET_W = PAD + COLS * CELL + PAD;
const sampleAreaH = SAMPLES.length * (LINE_H * 3 + 8) + 12;
const SHEET_H = PAD + 11 + galRows * CELL + 14 + sampleAreaH + PAD;

const sheet = new Pixmap(SHEET_W, SHEET_H).fill(px(RAMP.INK, 1));
let y = PAD;
drawTextInto(sheet, `THE FLAIR WEAVE — ${GLYPH_TOKENS.length} glyphs`, PAD, y, px(RAMP.PAPER, 3));
y += 11;

// the gallery grid
GLYPH_TOKENS.forEach((name, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const cx = PAD + col * CELL;
  const cy = y + row * CELL;
  sheet.rect(cx, cy, CELL - 4, CELL - 4, px(RAMP.INK, 0));
  sheet.frame(cx, cy, CELL - 4, CELL - 4, px(RAMP.INK, 2));
  const gp = flairGlyph(name);
  blit(sheet, gp, cx + Math.floor((CELL - 4 - gp.w) / 2), cy + 3);
  drawTextInto(sheet, name.slice(0, 9), cx + 1, cy + CELL - 12, px(RAMP.PAPER, 2));
});
y += galRows * CELL + 8;

drawTextInto(sheet, 'SAMPLE LINES (the mixed run, the real layout):', PAD, y, px(RAMP.GOLD, 3));
y += 12;
for (const s of SAMPLES) {
  drawTextInto(sheet, s.label, PAD, y, px(RAMP.PAPER, 1));
  const lines = renderLine(sheet, s.line, PAD, y + LINE_H, SHEET_W - PAD * 2, px(RAMP.PAPER, 3));
  y += LINE_H + lines * LINE_H + 8;
}

mkdirSync('.shots', { recursive: true });
writeFileSync('.shots/flair.png', pixmapToPng(sheet, { scale: SCALE, bg: px(RAMP.INK, 1) }));
console.log(`  wrote .shots/flair.png (${sheet.w}x${sheet.h} @${SCALE}x) — ${GLYPH_TOKENS.length} glyphs + ${SAMPLES.length} sample lines`);
