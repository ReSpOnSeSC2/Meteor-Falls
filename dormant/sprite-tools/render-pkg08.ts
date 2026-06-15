/**
 * PKG-08 hero frame export.
 *
 * The runtime already consumes the 46-frame *_anim_46_24x32.png sheets. This
 * export keeps the package-facing *_8dir_24x32.png names in the same full-frame
 * contract, and emits the per-hero mourning angel sheets requested by PKG-08.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAST, generateAngelFrames } from '../../src/spritegen/characters';
import { Pixmap } from '../../src/spritegen/pixmap';
import { RAMP, T, px } from '../../src/palette';
import { pixmapToPng } from './png';

const ROOT = process.cwd();
const CHARACTER_DIR = join(ROOT, 'assets', 'art', 'characters');
const BUST_DIR = join(ROOT, 'assets', 'art', 'busts');
const BATTLER_DIR = join(ROOT, 'assets', 'art', 'battlers');
const REVIEW_DIR = join(ROOT, 'assets', 'art', 'review');

const HEROES = [
  { slug: 'jay', id: 'rex' },
  { slug: 'mia', id: 'faye' },
  { slug: 'milo', id: 'milo' },
  { slug: 'pippa', id: 'pippa' },
  { slug: 'dorin', id: 'dorin' },
] as const;

function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function assertSize(path: string, w: number, h: number): void {
  const size = pngSize(path);
  if (size.w !== w || size.h !== h) {
    throw new Error(`${path} is ${size.w}x${size.h}, expected ${w}x${h}`);
  }
}

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
  }
}

function frameSheet(frames: Pixmap[], cols: number): Pixmap {
  const fw = frames[0].w;
  const fh = frames[0].h;
  const sheet = new Pixmap(cols * fw, Math.ceil(frames.length / cols) * fh);
  frames.forEach((frame, i) => blit(sheet, frame, (i % cols) * fw, Math.floor(i / cols) * fh));
  return sheet;
}

mkdirSync(CHARACTER_DIR, { recursive: true });
mkdirSync(REVIEW_DIR, { recursive: true });

const angelReview = new Pixmap(5 * 32 + 6 * 6, 28).fill(px(RAMP.NIGHT, 1));

HEROES.forEach((hero, index) => {
  const animPath = join(CHARACTER_DIR, `${hero.slug}_anim_46_24x32.png`);
  const eightDirPath = join(CHARACTER_DIR, `${hero.slug}_8dir_24x32.png`);
  assertSize(animPath, 96, 384);
  copyFileSync(animPath, eightDirPath);
  assertSize(eightDirPath, 96, 384);

  assertSize(join(BUST_DIR, `${hero.slug}_bust_18_32x32.png`), 128, 160);
  assertSize(join(BATTLER_DIR, `${hero.slug}_battler_14_28x36.png`), 112, 144);

  const angelFrames = generateAngelFrames(CAST[hero.id]);
  const angelSheet = frameSheet(angelFrames, 2);
  const angelPath = join(CHARACTER_DIR, `angel_${hero.id}_2_12x16.png`);
  writeFileSync(angelPath, pixmapToPng(angelSheet));
  assertSize(angelPath, 24, 16);

  const x = 6 + index * 38;
  blit(angelReview, angelFrames[0], x, 6);
  blit(angelReview, angelFrames[1], x + 14, 6);
});

writeFileSync(
  join(REVIEW_DIR, 'main_cast_angels_2_12x16_review.png'),
  pixmapToPng(angelReview, { scale: 5, bg: px(RAMP.NIGHT, 1) }),
);

console.log('PKG-08 export complete: 5 full overworld _8dir sheets, 5 bust sheets, 5 battler sheets, 5 angel sheets.');
