/**
 * PKG-10 MINIGAME CONTACT SHEETS.
 *
 * Exports the runtime-authored Hoops, Links, and Arcade sprites into the
 * package folders requested by docs/asset-packages/PKG-10-minigames.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Pixmap } from '../../src/spritegen/pixmap';
import { RAMP, T, px } from '../../src/palette';
import { drawTextInto } from '../../src/spritegen/font';
import {
  deriveOpponentSpec,
  drawAthleteShadow,
  drawBall,
  drawHoopSide,
  drawCageCourt,
  drawCageBehind,
} from '../../src/spritegen/athletes';
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
} from '../../src/spritegen/tiles';
import {
  allHoleTextures,
  drawGolfBall,
  drawLinksPoster,
  drawPinFlag,
  drawSandFrames,
  drawSplashFrames,
} from '../../src/spritegen/golfers';
import {
  drawArcadeBolt,
  drawArcadeCorndog,
  drawArcadeMoth,
  drawArcadeRock,
  drawArcadeSaucer,
  drawArcadeShip,
  drawScanline,
} from '../../src/spritegen/arcade';
import { decodePngToPixmap, pixmapToPng } from './png';

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

function crop(src: Pixmap, sx: number, sy: number, w: number, h: number): Pixmap {
  const out = new Pixmap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = src.get(sx + x, sy + y);
      if (c !== T) out.set(x, y, c);
    }
  }
  return out;
}

function rawSheet(frames: Pixmap[], cols: number): Pixmap {
  const fw = frames[0].w;
  const fh = frames[0].h;
  const out = new Pixmap(cols * fw, Math.ceil(frames.length / cols) * fh);
  frames.forEach((pm, i) => blit(out, pm, (i % cols) * fw, Math.floor(i / cols) * fh));
  return out;
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

type SourceSlug = 'jay' | 'mia' | 'dockworker';

const SOURCE = {
  jay: 'assets/art/characters/jay_anim_46_24x32.png',
  mia: 'assets/art/characters/mia_anim_46_24x32.png',
  dockworker: 'assets/art/characters/dockworker_anim_46_24x32.png',
} as const satisfies Record<SourceSlug, string>;

const SRC_W = 24;
const SRC_H = 32;
const SRC_COLS = 4;

function readCharacterFrame(slug: SourceSlug, frame: number): Pixmap {
  const sheet = decodePngToPixmap(readFileSync(SOURCE[slug]));
  return crop(sheet, (frame % SRC_COLS) * SRC_W, Math.floor(frame / SRC_COLS) * SRC_H, SRC_W, SRC_H);
}

function sportFrame(slug: SourceSlug, sourceFrame: number, opts: { x?: number; y?: number; ball?: [number, number]; club?: 'driver' | 'putter' | 'high' } = {}): Pixmap {
  const out = new Pixmap(32, 40);
  blit(out, readCharacterFrame(slug, sourceFrame), 4 + (opts.x ?? 0), 7 + (opts.y ?? 0));
  if (opts.ball) {
    const [bx, by] = opts.ball;
    const ball = drawBall();
    blit(out, ball, bx, by);
  }
  if (opts.club) {
    const shaft = px(RAMP.PAPER, 1);
    const head = px(RAMP.PAPER, 0);
    if (opts.club === 'high') {
      out.line(13, 9, 5, 3, shaft);
      out.rect(3, 2, 3, 2, head);
    } else if (opts.club === 'putter') {
      out.line(20, 24, 24, 37, shaft);
      out.rect(23, 37, 5, 2, head);
    } else {
      out.line(19, 23, 27, 37, shaft);
      out.rect(26, 37, 4, 2, head);
    }
  }
  return out;
}

function authoredAthleteFrames(slug: SourceSlug): Pixmap[] {
  const standR = 8;
  const stepR = 10;
  const standR2 = 10;
  const stepR2 = 8;
  const standD = 0;
  const stepD = 2;
  const standU = 12;
  const runR0 = 8;
  const runR1 = 10;
  const diagR = 24;
  return [
    sportFrame(slug, standR, { ball: [23, 25] }),
    sportFrame(slug, standR2, { y: -1, ball: [23, 23] }),
    sportFrame(slug, runR0, { x: 1, ball: [24, 26] }),
    sportFrame(slug, runR1, { x: 1, ball: [23, 24] }),
    sportFrame(slug, runR0, { x: 1 }),
    sportFrame(slug, runR1, { x: 1 }),
    sportFrame(slug, standD, { x: -2 }),
    sportFrame(slug, stepD, { x: 2 }),
    sportFrame(slug, standR, { ball: [21, 17] }),
    sportFrame(slug, diagR, { y: -4, ball: [20, 8] }),
    sportFrame(slug, standR, { y: -6, ball: [24, 4] }),
    sportFrame(slug, runR0, { x: 2, y: -1, ball: [24, 13] }),
    sportFrame(slug, runR1, { x: 2, y: -4, ball: [24, 9] }),
    sportFrame(slug, diagR, { y: -7, ball: [18, 4] }),
    sportFrame(slug, standR, { y: -7, ball: [25, 14] }),
    sportFrame(slug, standU, { y: -7, ball: [12, 24] }),
    sportFrame(slug, standR, { y: -7, ball: [25, 14] }),
    sportFrame(slug, stepR, { y: -7, ball: [17, 3] }),
    sportFrame(slug, standR, { y: -7, ball: [25, 14] }),
    sportFrame(slug, diagR, { y: -5 }),
    sportFrame(slug, standR, { y: -7 }),
    sportFrame(slug, stepR2, { x: 2, ball: [25, 20] }),
    sportFrame(slug, standD, { x: 1, y: 4 }),
    sportFrame(slug, standD, { y: -2 }),
    sportFrame(slug, stepD, { y: -3 }),
    sportFrame(slug, standU, { ball: [14, 23] }),
    sportFrame(slug, standR, { x: 2, ball: [22, 20] }),
    sportFrame(slug, runR1, { ball: [14, 25] }),
    sportFrame(slug, runR0, { ball: [24, 24] }),
    sportFrame(slug, standD, { x: -2, ball: [16, 28] }),
    sportFrame(slug, standD, { x: 2, ball: [14, 28] }),
    sportFrame(slug, standR, { x: -1 }),
    sportFrame(slug, standR2, { x: 1 }),
    sportFrame(slug, runR1, { x: 2 }),
    sportFrame(slug, standR, { ball: [24, 16] }),
    sportFrame(slug, standR, { ball: [23, 26] }),
    sportFrame(slug, runR0, { ball: [14, 23] }),
    sportFrame(slug, standR, { y: -6, ball: [25, 4] }),
    sportFrame(slug, standD, { y: 1 }),
  ];
}

function authoredGolferFrames(slug: SourceSlug): Pixmap[] {
  const standR = 8;
  const stepR = 10;
  const standR2 = 10;
  const stepR2 = 8;
  const standD = 0;
  const runR0 = 10;
  return [
    sportFrame(slug, standR, { club: 'driver' }),
    sportFrame(slug, stepR, { club: 'high' }),
    sportFrame(slug, standR2, { y: -1, club: 'high' }),
    sportFrame(slug, runR0, { x: 2, club: 'driver' }),
    sportFrame(slug, stepR2, { x: 1, club: 'high' }),
    sportFrame(slug, standR, { y: -1, club: 'high' }),
    sportFrame(slug, standD, { y: -2 }),
    sportFrame(slug, standR, { y: 3, club: 'putter' }),
    sportFrame(slug, stepR, { y: 4, club: 'putter' }),
    sportFrame(slug, standR, { club: 'putter' }),
    sportFrame(slug, runR0, { x: 1, club: 'putter' }),
  ];
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
  const rexFrames = authoredAthleteFrames('jay');
  const fayeFrames = authoredAthleteFrames('mia');
  const opponentFrames = authoredAthleteFrames('dockworker');
  void opponent;
  write(dir, 'athlete_rex_runtime', rawSheet(rexFrames, 5));
  write(dir, 'athlete_faye_runtime', rawSheet(fayeFrames, 5));
  write(dir, 'athlete_opponent_runtime', rawSheet(opponentFrames, 5));
  write(dir, 'athlete_rex_sheet', frameSheet(rexFrames, 5, BG), { scale: SCALE });
  write(dir, 'athlete_faye_sheet', frameSheet(fayeFrames, 5, BG), { scale: SCALE });
  write(dir, 'athlete_opponent_sheet', frameSheet(opponentFrames, 5, BG), { scale: SCALE });
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
  const rexFrames = authoredGolferFrames('jay');
  const fayeFrames = authoredGolferFrames('mia');
  write(dir, 'golfer_rex_runtime', rawSheet(rexFrames, 4));
  write(dir, 'golfer_faye_runtime', rawSheet(fayeFrames, 4));
  write(dir, 'golfer_rex_sheet', frameSheet(rexFrames, 4, BG), { scale: SCALE });
  write(dir, 'golfer_faye_sheet', frameSheet(fayeFrames, 4, BG), { scale: SCALE });
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
