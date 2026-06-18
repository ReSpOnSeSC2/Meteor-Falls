/**
 * Validate one generated 96x128 character frame before importing it.
 *
 * Example:
 *   npm run anim:frame:check -- --image assets/art/review/fixes/dorin_frame_7.png
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodePng } from './imageio';

const FRAME_W = 96;
const FRAME_H = 128;

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

function fail(message: string): never {
  throw new Error(message);
}

function main(): void {
  const imagePath = firstValue('image') ?? firstValue('frame-image');
  if (!imagePath) fail('need --image <96x128 PNG>');

  const resolved = resolve(process.cwd(), imagePath);
  const img = decodePng(readFileSync(resolved));
  if (img.w !== FRAME_W || img.h !== FRAME_H) {
    fail(`${imagePath} must be exactly ${FRAME_W}x${FRAME_H}, found ${img.w}x${img.h}`);
  }

  let visible = 0;
  let edgeVisible = 0;
  let x0 = FRAME_W;
  let y0 = FRAME_H;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const a = img.data[(y * FRAME_W + x) * 4 + 3];
      if (a < 24) continue;
      visible++;
      if (x === 0 || y === 0 || x === FRAME_W - 1 || y === FRAME_H - 1) edgeVisible++;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }

  if (visible < 1500) fail(`${imagePath} has too little visible character art (${visible} alpha pixels)`);
  if (visible > 9500) fail(`${imagePath} is mostly opaque (${visible} alpha pixels); likely has a background`);
  if (edgeVisible > 0) fail(`${imagePath} has opaque pixels on the canvas edge; likely clipped or has a background`);
  if (x0 < 4 || x1 > FRAME_W - 5 || y0 < 2 || y1 > FRAME_H - 3) {
    fail(`${imagePath} character bounds are too close to the frame edge (${x0},${y0})-(${x1},${y1})`);
  }

  console.log(`${imagePath}: ok single ${FRAME_W}x${FRAME_H} transparent frame`);
  console.log(`${imagePath}: visible alpha pixels ${visible}; bounds (${x0},${y0})-(${x1},${y1})`);
}

main();
