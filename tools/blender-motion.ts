import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodePng } from './imageio';
import { requireBlender } from './blender-utils';

const FRAME_W = 96;
const FRAME_H = 128;

const MOTIONS: Record<string, number[]> = {
  'walk-down': [0, 1, 2, 3],
  'walk-left': [4, 5, 6, 7],
  'walk-right': [8, 9, 10, 11],
  'walk-up': [12, 13, 14, 15],
  'run-down': [16, 17],
  'run-left': [18, 19],
  'run-right': [20, 21],
  'run-up': [22, 23],
  'walk-downright': [24, 25, 26],
  'walk-downleft': [27, 28, 29],
  'walk-upright': [30, 31, 32],
  'walk-upleft': [33, 34, 35],
  'run-downright': [36, 37],
  'run-downleft': [38, 39],
  'run-upright': [40, 41],
  'run-upleft': [42, 43],
  idle: [44, 45],
  all: Array.from({ length: 46 }, (_, frame) => frame),
};

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

function parseFrameList(value: string): number[] {
  const frames: number[] = [];
  for (const part of value.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (/^\d+-\d+$/.test(trimmed)) {
      const [a, b] = trimmed.split('-').map(Number);
      const step = a <= b ? 1 : -1;
      for (let frame = a; frame !== b + step; frame += step) frames.push(frame);
    } else {
      frames.push(Number(trimmed));
    }
  }
  for (const frame of frames) {
    if (!Number.isInteger(frame) || frame < 0 || frame > 45) throw new Error(`invalid frame ${frame}`);
  }
  return frames;
}

function checkFrameImage(path: string): void {
  const img = decodePng(readFileSync(path));
  if (img.w !== FRAME_W || img.h !== FRAME_H) {
    throw new Error(`${path} must be exactly ${FRAME_W}x${FRAME_H}, found ${img.w}x${img.h}`);
  }

  let visible = 0;
  let edgeVisible = 0;
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const a = img.data[(y * FRAME_W + x) * 4 + 3];
      if (a < 24) continue;
      visible++;
      if (x === 0 || y === 0 || x === FRAME_W - 1 || y === FRAME_H - 1) edgeVisible++;
    }
  }
  if (visible < 1500) throw new Error(`${path} has too little visible character art (${visible} alpha pixels)`);
  if (visible > 9500) throw new Error(`${path} is mostly opaque (${visible} alpha pixels); likely has a background`);
  if (edgeVisible > 0) throw new Error(`${path} has opaque pixels on the canvas edge`);
}

function main(): void {
  const id = firstValue('char') ?? firstValue('character');
  if (!id) throw new Error('need --char <id>');

  const frames = firstValue('frames')
    ? parseFrameList(firstValue('frames') as string)
    : MOTIONS[firstValue('motion') ?? ''] ?? (() => { throw new Error(`need --motion <${Object.keys(MOTIONS).join('|')}> or --frames <list>`); })();

  const blend = resolve(process.cwd(), firstValue('blend') ?? `assets/art/masters/characters/rigs/${id}.blend`);
  if (!existsSync(blend)) throw new Error(`missing Blender rig ${blend}`);

  const outDir = resolve(process.cwd(), firstValue('out-dir') ?? `assets/art/review/blender/${id}_${firstValue('motion') ?? 'frames'}`);
  mkdirSync(outDir, { recursive: true });

  const exe = requireBlender();
  const script = resolve(process.cwd(), 'tools/blender/render-character-frames.py');
  const frameArg = frames.join(',');
  const result = spawnSync(exe, ['--background', blend, '--python', script, '--', '--char', id, '--frames', frameArg, '--out-dir', outDir], {
    encoding: 'utf8',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Blender exited with status ${result.status}`);

  const ops = frames.map((frame) => {
    const image = resolve(outDir, `${id}_frame_${frame}_blender.png`);
    if (!existsSync(image)) throw new Error(`missing rendered frame ${image}`);
    checkFrameImage(image);
    return {
      op: 'importImage',
      image: image.replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/') + '/', ''),
      to: frame,
      note: `Blender-rendered frame ${frame}`,
    };
  });

  const manifest = resolve(outDir, `${id}_${firstValue('motion') ?? 'frames'}_manifest.json`);
  writeFileSync(manifest, JSON.stringify({ characters: { [id]: ops } }, null, 2));
  console.log(`${id}: checked ${frames.length} rendered frame(s)`);
  console.log(`${id}: wrote import manifest ${manifest}`);

  if (hasFlag('apply')) {
    const apply = spawnSync('npm.cmd', ['run', 'anim:fix', '--', '--manifest', manifest, '--apply'], { cwd: process.cwd(), encoding: 'utf8' });
    if (apply.stdout) process.stdout.write(apply.stdout);
    if (apply.stderr) process.stderr.write(apply.stderr);
    if (apply.error) throw apply.error;
    if (apply.status !== 0) throw new Error(`anim:fix exited with status ${apply.status}`);
  }
}

main();
