import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AUTHORED_NPC_CHARACTER_IDS } from '../src/spritegen/authored';
import { decodePng, encodePng, type Img } from './imageio';
import { requireBlender } from './blender-utils';

const FRAME_W = 96;
const FRAME_H = 128;
const COLS = 4;
const TOTAL_FRAMES = 46;
const SHEET_W = FRAME_W * COLS;
const SHEET_H = FRAME_H * Math.ceil(TOTAL_FRAMES / COLS);

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PieceSpec extends Rect {
  name: string;
  image: string;
  pivotX: number;
  pivotY: number;
  layer: number;
}

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

function assertCharacterSheet(img: Img, path: string): void {
  if (img.w !== SHEET_W || img.h !== SHEET_H) {
    throw new Error(`${path} must be ${SHEET_W}x${SHEET_H}, found ${img.w}x${img.h}`);
  }
}

function getFrame(img: Img, frame: number): Img {
  if (!Number.isInteger(frame) || frame < 0 || frame >= TOTAL_FRAMES) throw new Error(`invalid frame ${frame}`);
  const out: Img = { w: FRAME_W, h: FRAME_H, data: new Uint8Array(FRAME_W * FRAME_H * 4) };
  const ox = (frame % COLS) * FRAME_W;
  const oy = Math.floor(frame / COLS) * FRAME_H;
  for (let y = 0; y < FRAME_H; y++) {
    const srcStart = ((oy + y) * img.w + ox) * 4;
    const dstStart = y * FRAME_W * 4;
    out.data.set(img.data.subarray(srcStart, srcStart + FRAME_W * 4), dstStart);
  }
  return out;
}

function visibleBounds(img: Img): Rect {
  let x0 = img.w;
  let y0 = img.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] < 24) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < x0 || y1 < y0) throw new Error('source frame has no visible pixels');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function clampRect(rect: Rect): Rect {
  const x = Math.max(0, Math.min(FRAME_W - 1, Math.round(rect.x)));
  const y = Math.max(0, Math.min(FRAME_H - 1, Math.round(rect.y)));
  const x1 = Math.max(x + 1, Math.min(FRAME_W, Math.round(rect.x + rect.w)));
  const y1 = Math.max(y + 1, Math.min(FRAME_H, Math.round(rect.y + rect.h)));
  return { x, y, w: x1 - x, h: y1 - y };
}

function crop(img: Img, rect: Rect): Img {
  const out: Img = { w: rect.w, h: rect.h, data: new Uint8Array(rect.w * rect.h * 4) };
  for (let y = 0; y < rect.h; y++) {
    const srcStart = ((rect.y + y) * img.w + rect.x) * 4;
    const dstStart = y * rect.w * 4;
    out.data.set(img.data.subarray(srcStart, srcStart + rect.w * 4), dstStart);
  }
  return out;
}

function pieceRects(bounds: Rect): Array<Omit<PieceSpec, 'image'>> {
  const { x, y, w, h } = bounds;
  const r = (name: string, rx: number, ry: number, rw: number, rh: number, px: number, py: number, layer: number) => {
    const rect = clampRect({ x: x + w * rx, y: y + h * ry, w: w * rw, h: h * rh });
    return {
      name,
      ...rect,
      pivotX: Math.round(x + w * px),
      pivotY: Math.round(y + h * py),
      layer,
    };
  };
  return [
    r('arm_l', 0.00, 0.38, 0.34, 0.46, 0.20, 0.48, 1),
    r('leg_l', 0.16, 0.64, 0.36, 0.36, 0.33, 0.67, 2),
    r('leg_r', 0.48, 0.64, 0.38, 0.36, 0.62, 0.67, 3),
    r('torso', 0.22, 0.35, 0.58, 0.46, 0.50, 0.44, 4),
    r('head', 0.05, 0.00, 0.90, 0.48, 0.50, 0.30, 5),
    r('arm_r', 0.66, 0.38, 0.34, 0.46, 0.80, 0.48, 6),
  ];
}

function main(): void {
  const id = firstValue('char') ?? firstValue('character');
  if (!id) throw new Error('need --char <id>');
  const art = characterArt(id);
  const source = resolve(process.cwd(), firstValue('source') ?? runtimePath(art));
  if (!existsSync(source)) throw new Error(`missing source sheet ${source}`);

  const sheet = decodePng(readFileSync(source));
  assertCharacterSheet(sheet, source);
  const referenceFrame = Number(firstValue('reference-frame') ?? '0');
  const frame = getFrame(sheet, referenceFrame);
  const bounds = visibleBounds(frame);

  const rigRoot = resolve(process.cwd(), firstValue('rig-dir') ?? 'assets/art/masters/characters/rigs');
  const partsDir = resolve(rigRoot, `${art}_parts`);
  mkdirSync(partsDir, { recursive: true });

  const pieces: PieceSpec[] = pieceRects(bounds).map((spec) => {
    const image = resolve(partsDir, `${spec.name}.png`);
    writeFileSync(image, encodePng(crop(frame, spec)));
    return { ...spec, image };
  });

  const specPath = resolve(partsDir, 'rig.json');
  const blendOut = resolve(process.cwd(), firstValue('out') ?? `assets/art/masters/characters/rigs/${art}.blend`);
  mkdirSync(dirname(blendOut), { recursive: true });
  writeFileSync(
    specPath,
    JSON.stringify({ id, art, frameW: FRAME_W, frameH: FRAME_H, source, referenceFrame, bounds, pieces }, null, 2),
  );

  const exe = requireBlender();
  const script = resolve(process.cwd(), 'tools/blender/create-sprite-puppet.py');
  const result = spawnSync(exe, ['--background', '--python', script, '--', '--spec', specPath, '--out', blendOut], { encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Blender exited with status ${result.status}`);
  if (!existsSync(blendOut)) throw new Error(`Blender did not write ${blendOut}`);

  console.log(`${id}: wrote Blender rig ${blendOut}`);
  console.log(`${id}: wrote rig parts ${partsDir}`);
}

main();
