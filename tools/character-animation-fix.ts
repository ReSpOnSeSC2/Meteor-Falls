/**
 * Correct authored 46-frame character sheets by moving or importing cells.
 *
 * This is for setup mistakes: wrong direction blocks, bad ordering, copied
 * neutral frames, or importing a newly generated single frame. Failed images
 * are not salvaged here; regenerate them as one 96x128 PNG and import that.
 *
 * Examples:
 *   npm run anim:fix -- --char jay --preset swap-left-right
 *   npm run anim:fix -- --char dorin --op copy:4:6 --op mirror:5:9 --apply
 *   npm run anim:fix -- --char dorin --image assets/art/review/fixes/dorin_frame_7.png --op importImage:7 --apply
 *   npm run anim:fix -- --manifest docs/asset-lists/character_animation_fixes.json --apply
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AUTHORED_NPC_CHARACTER_IDS } from '../src/spritegen/authored';
import { decodePng, encodePng, type Img } from './imageio';

const FRAME_W = 96;
const FRAME_H = 128;
const COLS = 4;
const TOTAL_FRAMES = 46;
const SHEET_W = FRAME_W * COLS;
const SHEET_H = FRAME_H * Math.ceil(TOTAL_FRAMES / COLS);

type FixOp =
  | { op: 'swap'; a: number; b: number; note?: string }
  | { op: 'swapRange'; a: string | number[]; b: string | number[]; note?: string }
  | { op: 'copy'; from: number; to: number; note?: string }
  | { op: 'mirror'; from: number; to: number; note?: string }
  | { op: 'import'; source?: string; from: number; to: number; mirror?: boolean; note?: string }
  | { op: 'importImage'; image?: string; to: number; mirror?: boolean; note?: string }
  | { op: 'importRange'; source?: string; from: string | number[]; to: string | number[]; mirror?: boolean; note?: string }
  | { op: 'reverse'; frames: string | number[]; note?: string }
  | { op: 'rotate'; frames: string | number[]; by: number; note?: string };

interface Manifest {
  characters: Record<string, FixOp[]>;
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

function allValues(name: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === `--${name}` && argv[i + 1]) {
      values.push(argv[i + 1]);
      i++;
    } else if (argv[i].startsWith(`--${name}=`)) {
      values.push(argv[i].slice(name.length + 3));
    }
  }
  return values;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
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

function frameOrigin(frame: number): { x: number; y: number } {
  if (!Number.isInteger(frame) || frame < 0 || frame >= TOTAL_FRAMES) throw new Error(`invalid frame ${frame}`);
  return { x: (frame % COLS) * FRAME_W, y: Math.floor(frame / COLS) * FRAME_H };
}

function cloneImg(img: Img): Img {
  return { w: img.w, h: img.h, data: new Uint8Array(img.data) };
}

function assertCharacterSheet(img: Img, path: string): void {
  if (img.w !== SHEET_W || img.h !== SHEET_H) {
    throw new Error(`${path} must be ${SHEET_W}x${SHEET_H}, found ${img.w}x${img.h}`);
  }
}

function getFrame(img: Img, frame: number): Uint8Array {
  const out = new Uint8Array(FRAME_W * FRAME_H * 4);
  const { x: ox, y: oy } = frameOrigin(frame);
  for (let y = 0; y < FRAME_H; y++) {
    const srcStart = ((oy + y) * img.w + ox) * 4;
    const dstStart = y * FRAME_W * 4;
    out.set(img.data.subarray(srcStart, srcStart + FRAME_W * 4), dstStart);
  }
  return out;
}

function setFrame(img: Img, frame: number, data: Uint8Array): void {
  if (data.length !== FRAME_W * FRAME_H * 4) throw new Error(`frame buffer has wrong length ${data.length}`);
  const { x: ox, y: oy } = frameOrigin(frame);
  for (let y = 0; y < FRAME_H; y++) {
    const srcStart = y * FRAME_W * 4;
    const dstStart = ((oy + y) * img.w + ox) * 4;
    img.data.set(data.subarray(srcStart, srcStart + FRAME_W * 4), dstStart);
  }
}

function mirrorFrame(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const src = (y * FRAME_W + x) * 4;
      const dst = (y * FRAME_W + (FRAME_W - 1 - x)) * 4;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }
  return out;
}

function readSourceSheet(path: string): Img {
  const img = decodePng(readFileSync(resolve(process.cwd(), path)));
  assertCharacterSheet(img, path);
  return img;
}

function readFrameImage(path: string): Uint8Array {
  const img = decodePng(readFileSync(resolve(process.cwd(), path)));
  if (img.w !== FRAME_W || img.h !== FRAME_H) {
    throw new Error(`${path} must be a single ${FRAME_W}x${FRAME_H} frame image, found ${img.w}x${img.h}`);
  }
  return img.data;
}

function parseFrameList(value: string | number[]): number[] {
  if (Array.isArray(value)) return value.map((n) => Number(n));
  if (/^\d+-\d+$/.test(value)) {
    const [a, b] = value.split('-').map(Number);
    const step = a <= b ? 1 : -1;
    const frames: number[] = [];
    for (let frame = a; frame !== b + step; frame += step) frames.push(frame);
    return frames;
  }
  return value.split(',').map((part) => Number(part.trim())).filter((n) => !Number.isNaN(n));
}

function opLabel(op: FixOp): string {
  return `${op.op}${'note' in op && op.note ? ` (${op.note})` : ''}`;
}

function applyOp(
  img: Img,
  op: FixOp,
  defaultSource: string | undefined,
  sourceCache: Map<string, Img>,
  defaultImage: string | undefined,
  imageCache: Map<string, Uint8Array>,
): string[] {
  switch (op.op) {
    case 'swap': {
      const a = getFrame(img, op.a);
      const b = getFrame(img, op.b);
      setFrame(img, op.a, b);
      setFrame(img, op.b, a);
      return [op.a, op.b].map(String);
    }
    case 'swapRange': {
      const a = parseFrameList(op.a);
      const b = parseFrameList(op.b);
      if (a.length !== b.length) throw new Error(`swapRange needs equal frame counts: ${a.join(',')} vs ${b.join(',')}`);
      const aFrames = a.map((frame) => getFrame(img, frame));
      const bFrames = b.map((frame) => getFrame(img, frame));
      a.forEach((frame, index) => setFrame(img, frame, bFrames[index]));
      b.forEach((frame, index) => setFrame(img, frame, aFrames[index]));
      return [...a, ...b].map(String);
    }
    case 'copy': {
      setFrame(img, op.to, getFrame(img, op.from));
      return [op.to].map(String);
    }
    case 'mirror': {
      setFrame(img, op.to, mirrorFrame(getFrame(img, op.from)));
      return [op.to].map(String);
    }
    case 'import': {
      const sourcePath = op.source ?? defaultSource;
      if (!sourcePath) throw new Error('import op needs --source <sheet> or op.source');
      let source = sourceCache.get(sourcePath);
      if (!source) {
        source = readSourceSheet(sourcePath);
        sourceCache.set(sourcePath, source);
      }
      const frame = getFrame(source, op.from);
      setFrame(img, op.to, op.mirror ? mirrorFrame(frame) : frame);
      return [op.to].map(String);
    }
    case 'importImage': {
      const imagePath = op.image ?? defaultImage;
      if (!imagePath) throw new Error('importImage op needs --image <96x128 PNG> or op.image');
      let frame = imageCache.get(imagePath);
      if (!frame) {
        frame = readFrameImage(imagePath);
        imageCache.set(imagePath, frame);
      }
      setFrame(img, op.to, op.mirror ? mirrorFrame(frame) : frame);
      return [op.to].map(String);
    }
    case 'importRange': {
      const sourcePath = op.source ?? defaultSource;
      if (!sourcePath) throw new Error('importRange op needs --source <sheet> or op.source');
      let source = sourceCache.get(sourcePath);
      if (!source) {
        source = readSourceSheet(sourcePath);
        sourceCache.set(sourcePath, source);
      }
      const from = parseFrameList(op.from);
      const to = parseFrameList(op.to);
      if (from.length !== to.length) throw new Error(`importRange needs equal frame counts: ${from.join(',')} vs ${to.join(',')}`);
      from.forEach((srcFrame, index) => {
        const frame = getFrame(source as Img, srcFrame);
        setFrame(img, to[index], op.mirror ? mirrorFrame(frame) : frame);
      });
      return to.map(String);
    }
    case 'reverse': {
      const frames = parseFrameList(op.frames);
      const snapshots = frames.map((frame) => getFrame(img, frame)).reverse();
      frames.forEach((frame, index) => setFrame(img, frame, snapshots[index]));
      return frames.map(String);
    }
    case 'rotate': {
      const frames = parseFrameList(op.frames);
      const snapshots = frames.map((frame) => getFrame(img, frame));
      const by = ((op.by % frames.length) + frames.length) % frames.length;
      frames.forEach((frame, index) => setFrame(img, frame, snapshots[(index - by + frames.length) % frames.length]));
      return frames.map(String);
    }
    default: {
      const exhaustive: never = op;
      throw new Error(`unsupported op ${(exhaustive as { op: string }).op}`);
    }
  }
}

function presetOps(preset: string): FixOp[] {
  switch (preset) {
    case 'swap-left-right':
      return [
        { op: 'swapRange', a: '4-7', b: '8-11', note: 'cardinal walk left/right' },
        { op: 'swapRange', a: '18-19', b: '20-21', note: 'cardinal run left/right' },
        { op: 'swapRange', a: '24-26', b: '27-29', note: 'down diagonals left/right' },
        { op: 'swapRange', a: '30-32', b: '33-35', note: 'up diagonals left/right' },
        { op: 'swapRange', a: '36-37', b: '38-39', note: 'diag run down left/right' },
        { op: 'swapRange', a: '40-41', b: '42-43', note: 'diag run up left/right' },
      ];
    case 'swap-up-down':
      return [
        { op: 'swapRange', a: '0-3', b: '12-15', note: 'cardinal walk up/down' },
        { op: 'swapRange', a: '16-17', b: '22-23', note: 'cardinal run up/down' },
        { op: 'swapRange', a: '24-26', b: '30-32', note: 'right diagonals up/down' },
        { op: 'swapRange', a: '27-29', b: '33-35', note: 'left diagonals up/down' },
        { op: 'swapRange', a: '36-37', b: '40-41', note: 'diag run right up/down' },
        { op: 'swapRange', a: '38-39', b: '42-43', note: 'diag run left up/down' },
      ];
    case 'normalize-cardinal-stands':
      return [
        { op: 'copy', from: 0, to: 2, note: 'walk down neutral' },
        { op: 'copy', from: 4, to: 6, note: 'walk left neutral' },
        { op: 'copy', from: 8, to: 10, note: 'walk right neutral' },
        { op: 'copy', from: 12, to: 14, note: 'walk up neutral' },
      ];
    case 'mirror-right-from-left':
      return [
        { op: 'mirror', from: 4, to: 8, note: 'right stand from left stand' },
        { op: 'mirror', from: 5, to: 9, note: 'right walk A from left walk A' },
        { op: 'mirror', from: 6, to: 10, note: 'right stand B from left stand B' },
        { op: 'mirror', from: 7, to: 11, note: 'right walk B from left walk B' },
        { op: 'mirror', from: 18, to: 20, note: 'right run A from left run A' },
        { op: 'mirror', from: 19, to: 21, note: 'right run B from left run B' },
      ];
    case 'mirror-left-from-right':
      return [
        { op: 'mirror', from: 8, to: 4, note: 'left stand from right stand' },
        { op: 'mirror', from: 9, to: 5, note: 'left walk A from right walk A' },
        { op: 'mirror', from: 10, to: 6, note: 'left stand B from right stand B' },
        { op: 'mirror', from: 11, to: 7, note: 'left walk B from right walk B' },
        { op: 'mirror', from: 20, to: 18, note: 'left run A from right run A' },
        { op: 'mirror', from: 21, to: 19, note: 'left run B from right run B' },
      ];
    default:
      throw new Error(`unknown preset '${preset}'`);
  }
}

function parseOpSpec(spec: string): FixOp {
  const [kind, ...parts] = spec.split(':');
  switch (kind) {
    case 'swap':
      return { op: 'swap', a: Number(parts[0]), b: Number(parts[1]) };
    case 'swapRange':
    case 'swap-range':
      return { op: 'swapRange', a: parts[0], b: parts[1] };
    case 'copy':
      return { op: 'copy', from: Number(parts[0]), to: Number(parts[1]) };
    case 'mirror':
      return { op: 'mirror', from: Number(parts[0]), to: Number(parts[1]) };
    case 'import':
      return { op: 'import', from: Number(parts[0]), to: Number(parts[1]) };
    case 'importMirror':
    case 'import-mirror':
      return { op: 'import', from: Number(parts[0]), to: Number(parts[1]), mirror: true };
    case 'importImage':
    case 'import-image':
      return { op: 'importImage', to: Number(parts[0]) };
    case 'importImageMirror':
    case 'import-image-mirror':
      return { op: 'importImage', to: Number(parts[0]), mirror: true };
    case 'importRange':
    case 'import-range':
      return { op: 'importRange', from: parts[0], to: parts[1] };
    case 'importMirrorRange':
    case 'import-mirror-range':
      return { op: 'importRange', from: parts[0], to: parts[1], mirror: true };
    case 'reverse':
      return { op: 'reverse', frames: parts[0] };
    case 'rotate':
      return { op: 'rotate', frames: parts[0], by: Number(parts[1]) };
    default:
      throw new Error(`unknown --op '${kind}'`);
  }
}

function readManifest(path: string): Manifest {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  if (!parsed.characters || typeof parsed.characters !== 'object') {
    throw new Error(`${path} must contain { "characters": { "<id>": [ops] } }`);
  }
  return parsed;
}

function collectWork(): Array<{ id: string; ops: FixOp[] }> {
  const manifestPath = firstValue('manifest');
  if (manifestPath) {
    return Object.entries(readManifest(manifestPath).characters).map(([id, ops]) => ({ id, ops }));
  }

  const id = firstValue('char') ?? firstValue('character');
  if (!id) throw new Error('need --char <id> or --manifest <path>');

  const ops: FixOp[] = [];
  for (const preset of allValues('preset')) ops.push(...presetOps(preset));
  for (const opSpec of allValues('op')) ops.push(parseOpSpec(opSpec));
  if (ops.length === 0) throw new Error('need at least one --preset or --op');
  return [{ id, ops }];
}

function applyCharacter(
  id: string,
  ops: FixOp[],
  apply: boolean,
  stamp: string,
  outOverride?: string,
  defaultSource?: string,
  defaultImage?: string,
): void {
  const art = characterArt(id);
  const path = runtimePath(art);
  if (!existsSync(path)) throw new Error(`missing runtime sheet ${path}`);
  const before = decodePng(readFileSync(path));
  assertCharacterSheet(before, path);
  const after = cloneImg(before);
  const sourceCache = new Map<string, Img>();
  const imageCache = new Map<string, Uint8Array>();

  const changed = new Set<string>();
  for (const op of ops) {
    for (const frame of applyOp(after, op, defaultSource, sourceCache, defaultImage, imageCache)) changed.add(frame);
    console.log(`${id}: ${opLabel(op)}`);
  }

  if (apply) {
    const reviewDir = resolve(process.cwd(), 'assets/art/review');
    mkdirSync(reviewDir, { recursive: true });
    copyFileSync(path, resolve(reviewDir, `${art}_anim_46_4x_before_anim_fix_${stamp}.png`));
    const master = masterPath(art);
    if (existsSync(master)) copyFileSync(master, resolve(reviewDir, `${art}_anim_46_4x_master_before_anim_fix_${stamp}.png`));
    writeFileSync(path, encodePng(after));
    if (existsSync(master)) writeFileSync(master, encodePng(after));
    console.log(`${id}: applied ${ops.length} op(s), changed frames ${[...changed].sort((a, b) => Number(a) - Number(b)).join(', ')}`);
    console.log(`${id}: wrote ${path}`);
    if (existsSync(master)) console.log(`${id}: wrote ${master}`);
  } else {
    const out = outOverride
      ? resolve(process.cwd(), outOverride)
      : resolve(process.cwd(), `assets/art/review/${art}_anim_46_4x_candidate_anim_fix_${stamp}.png`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, encodePng(after));
    console.log(`${id}: dry run, wrote candidate ${out}`);
  }
}

function main(): void {
  const apply = hasFlag('apply');
  const stamp = timestamp();
  const outOverride = firstValue('out');
  const defaultSource = firstValue('source') ?? firstValue('source-sheet');
  const defaultImage = firstValue('image') ?? firstValue('frame-image');
  const work = collectWork();
  if (outOverride && work.length !== 1) throw new Error('--out can only be used with a single --char run');
  for (const item of work) applyCharacter(item.id, item.ops, apply, stamp, outOverride, defaultSource, defaultImage);
  if (!apply) console.log('dry run only; pass --apply to overwrite runtime/master sheets after review');
}

main();
