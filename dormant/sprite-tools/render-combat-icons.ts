/**
 * PKG-05 exporter: ability icons, status badges, and battle flair spritelets.
 *
 *   npm run art:combat-icons
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Pixmap } from '../../src/spritegen/pixmap';
import { RAMP, T, px } from '../../src/palette';
import { drawTextInto } from '../../src/spritegen/font';
import {
  ABILITY_ICON,
  BATTLE_FX_ICON,
  STATUS_ICON,
  STATUS_ICON_NAMES,
} from '../../src/spritegen/combatIcons';
import { pixmapToPng } from './png';

const ABILITY_DIR = 'assets/art/icons/abilities';
const STATUS_DIR = 'assets/art/icons/status';
const FX_DIR = 'assets/art/fx';

function readAbilityList(): string[] {
  return readFileSync('docs/asset-lists/ability_icons.txt', 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function writeSet(dir: string, rows: Array<[string, Pixmap]>): void {
  mkdirSync(dir, { recursive: true });
  for (const [id, pm] of rows) writeFileSync(`${dir}/${id}.png`, pixmapToPng(pm));
  console.log(`  wrote ${rows.length} PNGs to ${dir}/`);
}

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
  }
}

function sheet(name: string, rows: Array<[string, Pixmap]>, cols: number, cellW: number, cellH: number): void {
  mkdirSync('.shots', { recursive: true });
  const pad = 6;
  const labelH = 9;
  const titleH = 12;
  const bodyRows = Math.ceil(rows.length / cols);
  const pm = new Pixmap(pad * 2 + cols * cellW, pad * 2 + titleH + bodyRows * (cellH + labelH)).fill(px(RAMP.INK, 1));
  drawTextInto(pm, `${name} (${rows.length})`, pad, pad, px(RAMP.PAPER, 3));
  rows.forEach(([id, icon], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * cellW;
    const y = pad + titleH + row * (cellH + labelH);
    pm.rect(x, y, cellW - 3, cellH, px(RAMP.INK, 0));
    pm.frame(x, y, cellW - 3, cellH, px(RAMP.INK, 2));
    blit(pm, icon, x + Math.floor((cellW - 3 - icon.w) / 2), y + Math.floor((cellH - icon.h) / 2));
    drawTextInto(pm, id.slice(0, 11), x, y + cellH + 1, px(RAMP.PAPER, 2));
  });
  writeFileSync(`.shots/${name}.png`, pixmapToPng(pm, { scale: 4, bg: px(RAMP.INK, 1) }));
  console.log(`  wrote .shots/${name}.png`);
}

const abilityIds = readAbilityList();
const missing = abilityIds.filter((id) => !ABILITY_ICON[id]);
if (missing.length) {
  console.error(`missing ability icon rows: ${missing.join(', ')}`);
  process.exit(1);
}

const abilityRows = abilityIds.map((id): [string, Pixmap] => [id, ABILITY_ICON[id]()]);
const statusRows = STATUS_ICON_NAMES.map((name): [string, Pixmap] => [name, STATUS_ICON[name]()]);
const fxRows = Object.keys(BATTLE_FX_ICON).map((name): [string, Pixmap] => [name, BATTLE_FX_ICON[name]()]);

writeSet(ABILITY_DIR, abilityRows);
writeSet(STATUS_DIR, statusRows);
writeSet(FX_DIR, fxRows);

sheet('combat_abilities', abilityRows, 6, 58, 22);
sheet('combat_status', statusRows, 6, 42, 16);
sheet('combat_fx', fxRows, 7, 42, 18);
