/**
 * THE GLYPH CONTACT SHEETS (S18 M22, ADR-092). The sibling of render-icons.ts.
 * Renders every area's region-true glyph run — and, with --forge, one sample of
 * every script FAMILY — through the real draw into .shots/, the out-of-game half
 * of the glyph review. Visual proof lives HERE, not in preview_screenshot (which
 * hangs on the WebGL canvas, per ADR-059/060).
 *
 *   npm run art:glyphs            # the area sheet: every §A5/§A6 area's script, by region
 *   npm run art:glyphs -- --forge # the family gallery: every script grammar, one sample each
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, px, T } from '../src/palette';
import { drawTextInto } from '../src/spritegen/font';
import { CANON_AREAS } from '../src/spritegen/buildings';
import {
  GLYPH_SCRIPT,
  SCRIPT_VOICE,
  areaGlyphRun,
  forgeGlyphGallery,
} from '../src/spritegen/glyphforge';
import { pixmapToPng } from './png';

const SCALE = 4;
const PAD = 6;
const HEADER_H = 11;
const LABEL_H = 9;
const ROW_H = 16; // the glyph-run strip area
const COL_W = 150;
const COLS = 2;

interface Cell {
  caption: string;
  sub: string;
  pm: Pixmap;
}
interface Group {
  label: string;
  cells: Cell[];
}

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

function buildSheet(title: string, groups: Group[]): Pixmap {
  let totalH = PAD + HEADER_H;
  for (const g of groups) {
    const rows = Math.max(1, Math.ceil(g.cells.length / COLS));
    totalH += HEADER_H + rows * (ROW_H + LABEL_H) + PAD;
  }
  const sheetW = PAD + COLS * COL_W + PAD;
  const sheet = new Pixmap(sheetW, totalH).fill(px(RAMP.INK, 1));

  let y = PAD;
  drawTextInto(sheet, title, PAD, y, px(RAMP.PAPER, 3));
  y += HEADER_H;

  for (const g of groups) {
    drawTextInto(sheet, g.label, PAD, y, px(RAMP.GOLD, 3));
    y += HEADER_H;
    g.cells.forEach((cell, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = PAD + col * COL_W;
      const cy = y + row * (ROW_H + LABEL_H);
      sheet.rect(cx, cy, COL_W - 6, ROW_H, px(RAMP.INK, 0)); // a per-cell panel
      sheet.frame(cx, cy, COL_W - 6, ROW_H, px(RAMP.INK, 2));
      blit(sheet, cell.pm, cx + 4, cy + Math.floor((ROW_H - cell.pm.h) / 2));
      drawTextInto(sheet, cell.caption.slice(0, 22), cx, cy + ROW_H + 1, px(RAMP.PAPER, 3));
      drawTextInto(sheet, cell.sub.slice(0, 30), cx + 56, cy + 4, px(RAMP.PAPER, 1));
    });
    y += Math.max(1, Math.ceil(g.cells.length / COLS)) * (ROW_H + LABEL_H) + PAD;
  }
  return sheet;
}

function write(name: string, sheet: Pixmap): void {
  writeFileSync(`.shots/${name}`, pixmapToPng(sheet, { scale: SCALE, bg: px(RAMP.INK, 1) }));
  console.log(`  wrote .shots/${name} (${sheet.w}x${sheet.h} @${SCALE}x)`);
}

mkdirSync('.shots', { recursive: true });

const wantForge = process.argv.includes('--forge');

if (wantForge) {
  // THE FAMILY GALLERY — one sample per script grammar, captioned with its name
  // and its in-voice note. The proof that the forge writes a distinct, region-
  // true script for every planned family (ADR-092).
  const samples = forgeGlyphGallery();
  const cells: Cell[] = samples.map((s) => ({ caption: s.script, sub: s.voice, pm: s.pm }));
  write('glyphs_forge.png', buildSheet(`THE GLYPH FORGE — ${samples.length} script families`, [{ label: 'SCRIPT FAMILIES (one sample each)', cells }]));
  console.log(`family gallery: ${samples.length} script families`);
} else {
  // THE AREA SHEET — every canon §A5/§A6 area's region-true run, grouped by band
  // so it reads as a world tour (America → Mars). The both-directions proof that
  // every place has a script, read by eye for region-truth + no AI smell.
  const byBand = new Map<string, Cell[]>();
  for (const area of CANON_AREAS) {
    const spec = GLYPH_SCRIPT[area];
    const cells = byBand.get(spec.band) ?? [];
    cells.push({ caption: area, sub: `${spec.script} · ${SCRIPT_VOICE[spec.script]}`, pm: areaGlyphRun(area) });
    byBand.set(spec.band, cells);
  }
  const order = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'cross'];
  const groups: Group[] = order
    .filter((b) => byBand.has(b))
    .map((b) => ({ label: `REGION ${b}  (${byBand.get(b)!.length})`, cells: byBand.get(b)! }));
  write('glyphs_areas.png', buildSheet(`THE GLYPH LAW — ${CANON_AREAS.length} area scripts`, groups));
  console.log(`area sheet: ${CANON_AREAS.length} canon areas across ${groups.length} regions`);
}
