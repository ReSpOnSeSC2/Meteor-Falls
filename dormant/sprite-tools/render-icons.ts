/**
 * THE ICON CONTACT SHEETS (S16 M8 ADR-060 → S17 M17 ADR-062). Renders every
 * ITEM_ICON — and, with --forge, one sample of every forge SUBCATEGORY —
 * through the real draw into .shots/, the out-of-game half of the icon review
 * (the art:buildings / cast-sheet precedent). Visual proof lives HERE, not in
 * preview_screenshot (which hangs on the WebGL canvas, per ADR-059/060).
 *
 *   npm run art:icons                 # paginate: one sheet per ItemKind + a combined sheet
 *   npm run art:icons -- --region ch2 # just one region's catalog (by item band)
 *   npm run art:icons -- --forge      # the forge gallery: every subcategory, one sample each
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Pixmap } from '../../src/spritegen/pixmap';
import { RAMP, px, T } from '../../src/palette';
import { drawTextInto } from '../../src/spritegen/font';
import { ITEMS, itemKindLabel, type ItemDef } from '../../src/data/items';
import { ITEM_ICON, forgeGallery, forgeIcon } from '../../src/spritegen/icons';
import type { ItemBand, ItemKind } from '../../src/schemas';
import { pixmapToPng } from './png';

const SCALE = 4;
const PAD = 6;
const CELL_W = 80;
const CELL_H = 22; // icon area
const LABEL_H = 9;
const HEADER_H = 11;
const COLS = 5;
const ITEM_EXPORT_DIR = 'assets/art/icons/items';

const KIND_ORDER: ItemKind[] = [
  'weapon', 'armor', 'arms', 'charm', 'food', 'pp', 'cure', 'tonic', 'battle', 'valuable', 'basket', 'key',
];
const BANDS: ItemBand[] = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'cross'];

interface Cell {
  caption: string;
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

/** lay grouped cells out into one labelled contact sheet */
function buildSheet(title: string, groups: Group[]): Pixmap {
  let totalH = PAD + HEADER_H; // the title bar
  for (const g of groups) {
    const subRows = Math.max(1, Math.ceil(g.cells.length / COLS));
    totalH += HEADER_H + subRows * (CELL_H + LABEL_H) + PAD;
  }
  const sheetW = PAD + COLS * CELL_W + PAD;
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
      const cx = PAD + col * CELL_W;
      const cy = y + row * (CELL_H + LABEL_H);
      sheet.rect(cx, cy, CELL_W - 4, CELL_H, px(RAMP.INK, 0)); // a per-cell panel
      sheet.frame(cx, cy, CELL_W - 4, CELL_H, px(RAMP.INK, 2));
      blit(sheet, cell.pm, cx + Math.floor((CELL_W - 4 - cell.pm.w) / 2), cy + Math.floor((CELL_H - cell.pm.h) / 2));
      drawTextInto(sheet, cell.caption.slice(0, 12), cx, cy + CELL_H + 1, px(RAMP.PAPER, 3));
    });
    y += Math.max(1, Math.ceil(g.cells.length / COLS)) * (CELL_H + LABEL_H) + PAD;
  }
  return sheet;
}

function write(name: string, sheet: Pixmap): void {
  writeFileSync(`.shots/${name}`, pixmapToPng(sheet, { scale: SCALE, bg: px(RAMP.INK, 1) }));
  console.log(`  wrote .shots/${name} (${sheet.w}x${sheet.h} @${SCALE}x)`);
}

function parsePackageIds(path: string): string[] {
  const md = readFileSync(path, 'utf8');
  return [...md.matchAll(/^-\s+\[[ xX]\]\s+`([^`]+)`/gm)].map((m) => m[1]);
}

function writeItemIcons(ids: string[], opts: { skipMissing?: boolean; placeholderBands?: boolean } = {}): void {
  mkdirSync(ITEM_EXPORT_DIR, { recursive: true });
  const missing = ids.filter((id) => !ITEM_ICON[id]);
  const placeholderBands = missing.filter((id) => opts.placeholderBands && BANDS.includes(id as ItemBand));
  const unhandledMissing = missing.filter((id) => !placeholderBands.includes(id));
  if (unhandledMissing.length) {
    const message = `missing ITEM_ICON row(s): ${unhandledMissing.join(', ')}`;
    if (!opts.skipMissing) {
      console.error(`cannot export ${message}`);
      process.exit(1);
    }
    console.warn(`skipping ${message}`);
  }
  for (const id of ids.filter((id) => ITEM_ICON[id])) {
    writeFileSync(`${ITEM_EXPORT_DIR}/${id}.png`, pixmapToPng(ITEM_ICON[id]()));
  }
  for (const id of placeholderBands) {
    writeFileSync(`${ITEM_EXPORT_DIR}/${id}.png`, pixmapToPng(forgeIcon({ subcat: 'note', band: id as ItemBand, detail: 'label', seed: id })));
  }
  if (placeholderBands.length) console.warn(`wrote band placeholder PNG(s): ${placeholderBands.join(', ')}`);
  console.log(`exported ${ids.length - unhandledMissing.length} item icon PNGs to ${ITEM_EXPORT_DIR}/`);
}

/** the catalog grouped by kind (skipping empty kinds) */
function itemsByKind(filter?: (item: ItemDef) => boolean): Group[] {
  return KIND_ORDER.flatMap((kind) => {
    const ids = Object.values(ITEMS)
      .filter((it) => it.kind === kind && (filter ? filter(it) : true))
      .map((it) => it.id);
    if (!ids.length) return [];
    const sample = ITEMS[ids[0]];
    return [{ label: `${itemKindLabel(sample)}  (${ids.length})`, cells: ids.map((id) => ({ caption: id, pm: ITEM_ICON[id]() })) }];
  });
}

const argv = process.argv;
const wantForge = argv.includes('--forge');
const wantExportItems = argv.includes('--export-items');
const skipMissing = argv.includes('--skip-missing');
const placeholderBands = argv.includes('--placeholder-bands');
const pi = argv.indexOf('--package');
const ri = argv.indexOf('--region');
const region = ri >= 0 ? argv[ri + 1] : null;

mkdirSync('.shots', { recursive: true });

if (wantExportItems) {
  const ids = pi >= 0 ? parsePackageIds(argv[pi + 1]) : Object.keys(ITEM_ICON).sort();
  writeItemIcons(ids, { skipMissing, placeholderBands });
} else if (wantForge) {
  // THE FORGE GALLERY — one sample per subcategory, grouped by the ItemKind it
  // serves, captioned with the subcat name. The proof (at 41 items, when no
  // shipped item uses most subcats yet) that the forge stamps a distinct,
  // on-theme face for every planned subcategory (ADR-062).
  const samples = forgeGallery();
  const groups: Group[] = KIND_ORDER.flatMap((kind) => {
    const cells = samples.filter((s) => s.kind === kind).map((s) => ({ caption: s.subcat, pm: s.pm }));
    return cells.length ? [{ label: `${kind.toUpperCase()} — forge  (${cells.length})`, cells }] : [];
  });
  write('icons_forge.png', buildSheet(`THE ICON FORGE — ${samples.length} subcategories`, groups));
  console.log(`forge gallery: ${samples.length} subcategories across ${groups.length} kinds`);
} else if (region) {
  if (!BANDS.includes(region as ItemBand)) {
    console.error(`unknown region '${region}' — use one of: ${BANDS.join(', ')}`);
    process.exit(1);
  }
  const groups = itemsByKind((it) => it.band === region);
  const count = groups.reduce((n, g) => n + g.cells.length, 0);
  write(`icons_region_${region}.png`, buildSheet(`REGION ${region} — ${count} items`, groups));
} else {
  // default: paginate — a sheet per ItemKind, plus a combined index sheet
  const groups = itemsByKind();
  write('icons_s17.png', buildSheet(`THE ICON ATLAS — ${Object.keys(ITEM_ICON).length} items`, groups));
  for (const g of groups) {
    const kind = g.cells.length ? ITEMS[g.cells[0].caption].kind : 'key';
    write(`icons_${kind}.png`, buildSheet(g.label, [g]));
  }
  console.log(`paginated ${groups.length} kinds + the combined sheet — ${Object.keys(ITEM_ICON).length} icons`);
}
