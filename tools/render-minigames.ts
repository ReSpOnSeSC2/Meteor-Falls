/**
 * PKG-10 MINIGAME CONTACT SHEETS.
 *
 * Exports the runtime-authored Hoops, Links, and Arcade sprites into the
 * package folders requested by docs/asset-packages/PKG-10-minigames.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { Pixmap } from '../src/spritegen/pixmap';
import { RAMP, T, px } from '../src/palette';
import { drawTextInto } from '../src/spritegen/font';
import { CAST } from '../src/spritegen/characters';
import {
  generateAthleteFrames,
  deriveOpponentSpec,
  drawAthleteShadow,
  drawBall,
  drawHoopSide,
  drawCageCourt,
  drawCageBehind,
} from '../src/spritegen/athletes';
import {
  asphaltCrack,
  asphaltLineH,
  asphaltLineV,
  asphaltTile,
  cageMeshTile,
  drawBackboardProp,
  drawBleachers,
  drawCageGate,
  drawCageMural,
  drawChalkBoard,
} from '../src/spritegen/tiles';
import {
  allHoleTextures,
  drawGolfBall,
  drawLinksPoster,
  drawPinFlag,
  drawSandFrames,
  drawSplashFrames,
  generateGolferFrames,
} from '../src/spritegen/golfers';
import {
  drawArcadeBolt,
  drawArcadeCorndog,
  drawArcadeMoth,
  drawArcadeRock,
  drawArcadeSaucer,
  drawArcadeShip,
  drawScanline,
} from '../src/spritegen/arcade';
import { pixmapToPng } from './png';

const ROOT = 'assets/art/minigames';
const SCALE = 4;
const BG = px(RAMP.INK, 1);

interface Cell {
  name: string;
  pm: Pixmap;
}

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
  }
}

function frameSheet(frames: Pixmap[], cols: number, bg = T): Pixmap {
  const pad = 2;
  const fw = frames[0].w;
  const fh = frames[0].h;
  const rows = Math.ceil(frames.length / cols);
  const out = new Pixmap(cols * fw + (cols + 1) * pad, rows * fh + (rows + 1) * pad);
  if (bg !== T) out.fill(bg);
  frames.forEach((pm, i) => {
    const x = pad + (i % cols) * (fw + pad);
    const y = pad + Math.floor(i / cols) * (fh + pad);
    blit(out, pm, x, y);
  });
  return out;
}

function contactSheet(title: string, cells: Cell[], cols: number): Pixmap {
  const cellW = Math.max(...cells.map((c) => c.pm.w), 40) + 14;
  const cellH = Math.max(...cells.map((c) => c.pm.h), 28) + 16;
  const rows = Math.ceil(cells.length / cols);
  const out = new Pixmap(cols * cellW + 12, rows * cellH + 22).fill(BG);
  drawTextInto(out, title, 6, 6, px(RAMP.GOLD, 3));
  cells.forEach((cell, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 6 + col * cellW;
    const y = 18 + row * cellH;
    out.rect(x, y, cellW - 4, cellH - 4, px(RAMP.INK, 0));
    out.frame(x, y, cellW - 4, cellH - 4, px(RAMP.INK, 2));
    blit(out, cell.pm, x + Math.floor((cellW - 4 - cell.pm.w) / 2), y + 4);
    drawTextInto(out, cell.name.slice(0, 18), x + 3, y + cellH - 11, px(RAMP.PAPER, 3));
  });
  return out;
}

function write(dir: string, name: string, pm: Pixmap, opts: { scale?: number; bg?: number } = {}): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${name}.png`, pixmapToPng(pm, opts));
  console.log(`wrote ${dir}/${name}.png`);
}

function renderHoops(): void {
  const dir = `${ROOT}/hoops`;
  const opponent = deriveOpponentSpec(0x5eed, 2, RAMP.BLUE);
  const cells: Cell[] = [
    { name: 'ball', pm: drawBall() },
    { name: 'shadow', pm: drawAthleteShadow() },
    { name: 'hoop_net_0', pm: drawHoopSide(0) },
    { name: 'hoop_net_1', pm: drawHoopSide(1) },
    { name: 'hoop_net_2', pm: drawHoopSide(2) },
    { name: 'backboard', pm: drawBackboardProp() },
    { name: 'asphalt', pm: asphaltTile() },
    { name: 'crack', pm: asphaltCrack() },
    { name: 'line_h', pm: asphaltLineH() },
    { name: 'line_v', pm: asphaltLineV() },
    { name: 'cage_mesh', pm: cageMeshTile() },
    { name: 'gate', pm: drawCageGate() },
    { name: 'bleachers_a', pm: drawBleachers(11) },
    { name: 'bleachers_b', pm: drawBleachers(40) },
    { name: 'mural', pm: drawCageMural() },
    { name: 'chalkboard', pm: drawChalkBoard() },
  ];
  write(dir, 'athlete_rex_sheet', frameSheet(generateAthleteFrames(CAST.rex), 5, BG), { scale: SCALE });
  write(dir, 'athlete_faye_sheet', frameSheet(generateAthleteFrames(CAST.faye), 5, BG), { scale: SCALE });
  write(dir, 'athlete_opponent_sheet', frameSheet(generateAthleteFrames(opponent, { ramp: RAMP.BLUE, trim: RAMP.PAPER }), 5, BG), { scale: SCALE });
  write(dir, 'hoop_side_sheet', frameSheet([drawHoopSide(0), drawHoopSide(1), drawHoopSide(2)], 3, BG), { scale: SCALE });
  for (const cell of cells) write(dir, cell.name, cell.pm, { scale: SCALE });
  write(dir, 'court_full', drawCageCourt());
  write(dir, 'court_behind', drawCageBehind());
  write(dir, 'hoops_contact', contactSheet('PKG-10 HOOPS', cells, 4), { scale: SCALE, bg: BG });
}

function renderGolf(): void {
  const dir = `${ROOT}/golf`;
  const cells: Cell[] = [
    { name: 'flag', pm: drawPinFlag() },
    { name: 'ball', pm: drawGolfBall() },
    { name: 'splash', pm: frameSheet(drawSplashFrames(), 2, BG) },
    { name: 'sand', pm: frameSheet(drawSandFrames(), 2, BG) },
    { name: 'poster', pm: drawLinksPoster() },
  ];
  write(dir, 'golfer_rex_sheet', frameSheet(generateGolferFrames(CAST.rex), 4, BG), { scale: SCALE });
  write(dir, 'golfer_faye_sheet', frameSheet(generateGolferFrames(CAST.faye), 4, BG), { scale: SCALE });
  for (const cell of cells) write(dir, cell.name, cell.pm, { scale: SCALE });
  for (const { id, pm } of allHoleTextures()) write(dir, id, pm);
  write(dir, 'golf_contact', contactSheet('PKG-10 LINKS', cells, 5), { scale: SCALE, bg: BG });
}

function renderArcade(): void {
  const dir = `${ROOT}/arcade`;
  const cells: Cell[] = [
    { name: 'ship', pm: drawArcadeShip() },
    { name: 'moth', pm: drawArcadeMoth() },
    { name: 'rock', pm: drawArcadeRock() },
    { name: 'saucer', pm: drawArcadeSaucer() },
    { name: 'corndog', pm: drawArcadeCorndog() },
    { name: 'bolt', pm: drawArcadeBolt() },
    { name: 'scanline', pm: drawScanline() },
  ];
  for (const cell of cells) write(dir, cell.name, cell.pm, { scale: SCALE });
  write(dir, 'arcade_contact', contactSheet('PKG-10 ARCADE', cells, 4), { scale: SCALE, bg: BG });
}

renderHoops();
renderGolf();
renderArcade();
