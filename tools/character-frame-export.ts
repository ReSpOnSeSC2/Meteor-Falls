/**
 * Export one 96x128 frame from an authored character sheet.
 *
 * Examples:
 *   npm run anim:frame -- --char dorin --frame 7
 *   npm run anim:frame -- --char dorin --frame 7 --out assets/art/review/fixes/dorin_frame_7.png
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AUTHORED_NPC_CHARACTER_IDS } from '../src/spritegen/authored';
import { decodePng, encodePng, type Img } from './imageio';

const FRAME_W = 96;
const FRAME_H = 128;
const COLS = 4;
const TOTAL_FRAMES = 46;
const SHEET_W = FRAME_W * COLS;
const SHEET_H = FRAME_H * Math.ceil(TOTAL_FRAMES / COLS);

const HERO_ART_BY_ID = new Map<string, string>([
  ['rex', 'jay'],
  ['jay', 'jay'],
  ['faye', 'mia'],
  ['mia', 'mia'],
  ['milo', 'milo'],
  ['pippa', 'pippa'],
  ['dorin', 'dorin'],
]);

for (const id of AUTHORED_NPC_CHARACTER_IDS) HERO_ART_BY_ID.set(id, id);

function argsAfterSeparator(argv: string[]): string[] {
  const marker = argv.indexOf('--');
  return marker >= 0 ? argv.slice(marker + 1) : argv;
}

const argv = argsAfterSeparator(process.argv.slice(2));

function hasFlag(name: string): boolean {
  return argv.includes(`--${name}`);
}

function firstValue(name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === `--${name}`) return argv[i + 1];
    if (argv[i].startsWith(`--${name}=`)) return argv[i].slice(name.length + 3);
  }
  return undefined;
}

function characterArt(id: string): string {
  const art = HERO_ART_BY_ID.get(id);
  if (!art) throw new Error(`unknown authored character '${id}'`);
  return art;
}

function runtimePath(art: string): string {
  return resolve(process.cwd(), `assets/art/characters/${art}_anim_46_4x.png`);
}

function masterPath(art: string): string {
  return resolve(process.cwd(), `assets/art/masters/characters/animation/${art}_anim_46_4x_master.png`);
}

function assertCharacterSheet(img: Img, path: string): void {
  if (img.w !== SHEET_W || img.h !== SHEET_H) {
    throw new Error(`${path} must be ${SHEET_W}x${SHEET_H}, found ${img.w}x${img.h}`);
  }
}

function frameOrigin(frame: number): { x: number; y: number } {
  if (!Number.isInteger(frame) || frame < 0 || frame >= TOTAL_FRAMES) throw new Error(`invalid frame ${frame}`);
  return { x: (frame % COLS) * FRAME_W, y: Math.floor(frame / COLS) * FRAME_H };
}

function getFrame(img: Img, frame: number): Img {
  const out: Img = { w: FRAME_W, h: FRAME_H, data: new Uint8Array(FRAME_W * FRAME_H * 4) };
  const { x: ox, y: oy } = frameOrigin(frame);
  for (let y = 0; y < FRAME_H; y++) {
    const srcStart = ((oy + y) * img.w + ox) * 4;
    const dstStart = y * FRAME_W * 4;
    out.data.set(img.data.subarray(srcStart, srcStart + FRAME_W * 4), dstStart);
  }
  return out;
}

function main(): void {
  const id = firstValue('char') ?? firstValue('character');
  const frame = Number(firstValue('frame'));
  if (!id || Number.isNaN(frame)) throw new Error('need --char <id> and --frame <0-45>');

  const art = characterArt(id);
  const source = firstValue('from')
    ? resolve(process.cwd(), firstValue('from') as string)
    : hasFlag('master')
      ? masterPath(art)
      : runtimePath(art);
  if (!existsSync(source)) throw new Error(`missing source sheet ${source}`);

  const sheet = decodePng(readFileSync(source));
  assertCharacterSheet(sheet, source);
  const out = resolve(process.cwd(), firstValue('out') ?? `assets/art/review/frame-work/${art}_frame_${frame}.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, encodePng(getFrame(sheet, frame)));
  console.log(`${id}: exported frame ${frame} from ${source}`);
  console.log(`${id}: wrote ${out}`);
}

main();
