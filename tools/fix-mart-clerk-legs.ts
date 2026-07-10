/**
 * Restore the lower body on the authored martClerk sheet.
 *
 * The original render painted the blue apron all the way to the common foot
 * line, making every pose read as a torso with no legs.  The deliKeeper sheet
 * uses the same 46-frame contract and a compatible stocky adult silhouette, so
 * it supplies only the planted trouser/shoe anatomy.  Everything above the
 * lower apron (identity, face, hat, arms, hands, uniform, animation timing) is
 * byte-preserved from martClerk.
 *
 * Preview:
 *   vite-node tools/fix-mart-clerk-legs.ts --out tmp/martClerk_legs_preview.png
 * Apply to both the runtime sheet and its canonical master:
 *   vite-node tools/fix-mart-clerk-legs.ts --apply
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { decodePng, encodePng, type Img } from './imageio';

const FRAME_W = 96;
const FRAME_H = 128;
const COLS = 4;
const FILLED_FRAMES = 46;
const SHEET_W = FRAME_W * COLS;
const SHEET_H = FRAME_H * Math.ceil(FILLED_FRAMES / COLS);
const LOWER_BODY_HEIGHT = 24;
const TROUSER_HEIGHT = 15;

const runtimePath = resolve('assets/art/characters/martClerk_anim_46_4x.png');
const masterPath = resolve('assets/art/masters/characters/animation/martClerk_anim_46_4x_master.png');
const donorPath = resolve('assets/art/characters/deliKeeper_anim_46_4x.png');

function arg(name: string): string | undefined {
  const exact = `--${name}`;
  const prefix = `${exact}=`;
  const index = process.argv.indexOf(exact);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function assertSheet(img: Img, path: string): void {
  if (img.w !== SHEET_W || img.h !== SHEET_H) {
    throw new Error(`${path} must be ${SHEET_W}x${SHEET_H}; found ${img.w}x${img.h}`);
  }
}

function offset(img: Img, frame: number, x: number, y: number): number {
  const ox = (frame % COLS) * FRAME_W;
  const oy = Math.floor(frame / COLS) * FRAME_H;
  return ((oy + y) * img.w + ox + x) * 4;
}

function rgba(img: Img, frame: number, x: number, y: number): [number, number, number, number] {
  const i = offset(img, frame, x, y);
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

function isUniformSkinOrShirt(pixel: readonly number[]): boolean {
  const [r, g, b, a] = pixel;
  if (a <= 16) return false;
  // Preserve the cook's dark skin/gold details and cream shirt.  The blue
  // apron deliberately does not match either family.
  const warm = r > 72 && r > g * 1.28 && g > b * 1.28;
  const cream = r > 125 && g > 110 && b > 80 && Math.max(r, g, b) - Math.min(r, g, b) < 105;
  return warm || cream;
}

function isDarkDonorLowerBody(pixel: readonly number[]): boolean {
  const [r, g, b, a] = pixel;
  return a > 8 && Math.max(r, g, b) < 142;
}

function alphaBottom(img: Img, frame: number): number {
  for (let y = FRAME_H - 1; y >= 0; y--) {
    for (let x = 0; x < FRAME_W; x++) {
      if (rgba(img, frame, x, y)[3] > 16) return y;
    }
  }
  throw new Error(`frame ${frame} is empty`);
}

function donorLegMask(donor: Img, frame: number): { mask: Uint8Array; bottom: number } {
  const mask = new Uint8Array(FRAME_W * FRAME_H);
  const bottom = alphaBottom(donor, frame);
  for (let y = Math.max(0, bottom - 26); y <= bottom; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      if (isDarkDonorLowerBody(rgba(donor, frame, x, y))) mask[y * FRAME_W + x] = 1;
    }
  }

  // Retain only dark connected components that reach the shared foot zone.
  // This discards lower hand/arm outlines while keeping both walking legs.
  const seen = new Uint8Array(mask.length);
  const selected = new Uint8Array(mask.length);
  const steps = [-FRAME_W - 1, -FRAME_W, -FRAME_W + 1, -1, 1, FRAME_W - 1, FRAME_W, FRAME_W + 1];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const queue = [start];
    const component: number[] = [];
    let reachesFeet = false;
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      component.push(current);
      const cy = Math.floor(current / FRAME_W);
      const cx = current % FRAME_W;
      if (cy >= bottom - 2) reachesFeet = true;
      for (const step of steps) {
        const next = current + step;
        if (next < 0 || next >= mask.length || !mask[next] || seen[next]) continue;
        const ny = Math.floor(next / FRAME_W);
        const nx = next % FRAME_W;
        if (Math.abs(nx - cx) > 1 || Math.abs(ny - cy) > 1) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
    if (reachesFeet && component.length >= 12) {
      for (const index of component) selected[index] = 1;
    }
  }
  return { mask: selected, bottom };
}

function protectedMask(target: Img, frame: number, startY: number): Uint8Array {
  const base = new Uint8Array(FRAME_W * FRAME_H);
  const keep = new Uint8Array(base.length);
  for (let y = startY; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      if (isUniformSkinOrShirt(rgba(target, frame, x, y))) base[y * FRAME_W + x] = 1;
    }
  }
  // Keep the anti-aliased outline immediately surrounding hands and sleeves.
  for (let y = startY; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      let protectedPixel = false;
      for (let dy = -2; dy <= 2 && !protectedPixel; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < FRAME_W && ny >= startY && ny < FRAME_H && base[ny * FRAME_W + nx]) {
            protectedPixel = true;
            break;
          }
        }
      }
      if (protectedPixel) keep[y * FRAME_W + x] = 1;
    }
  }
  return keep;
}

function tintTrouserPixel(pixel: readonly number[], shoe: boolean): [number, number, number, number] {
  const [r, g, b, a] = pixel;
  if (shoe) return [r, g, b, a]; // retain the donor's near-black shoes
  const light = (r + g + b) / 3;
  const lift = Math.round((light - 45) * 0.32);
  return [
    Math.max(8, Math.min(70, 20 + lift)),
    Math.max(24, Math.min(96, 49 + lift)),
    Math.max(50, Math.min(142, 91 + lift)),
    a,
  ];
}

function tintApronPixel(pixel: readonly number[]): [number, number, number, number] {
  const [r, g, b, a] = pixel;
  const light = (r + g + b) / 3;
  const lift = Math.round((light - 145) * 0.34);
  return [
    Math.max(5, Math.min(74, 25 + lift)),
    Math.max(66, Math.min(178, 117 + lift)),
    Math.max(112, Math.min(232, 178 + lift)),
    a,
  ];
}

function isWarmApronPixel(pixel: readonly number[]): boolean {
  const [r, g, b, a] = pixel;
  return a > 8 && r > 105 && g > 65 && r > b * 1.25;
}

function setPixel(img: Img, frame: number, x: number, y: number, pixel: readonly number[]): void {
  const i = offset(img, frame, x, y);
  img.data[i] = pixel[0];
  img.data[i + 1] = pixel[1];
  img.data[i + 2] = pixel[2];
  img.data[i + 3] = pixel[3];
}

function repair(target: Img, donor: Img): Img {
  const out: Img = { w: target.w, h: target.h, data: new Uint8Array(target.data) };
  for (let frame = 0; frame < FILLED_FRAMES; frame++) {
    const { mask: legs, bottom: donorBottom } = donorLegMask(donor, frame);
    const targetBottom = alphaBottom(target, frame);
    const shiftY = targetBottom - donorBottom;
    const targetStart = Math.max(0, targetBottom - LOWER_BODY_HEIGHT + 1);
    const donorStart = Math.max(0, donorBottom - LOWER_BODY_HEIGHT + 1);
    const trouserStart = Math.max(donorStart, donorBottom - TROUSER_HEIGHT + 1);
    const keep = protectedMask(target, frame, targetStart);

    // First reshape the final apron rows from the donor's coherent body form.
    // Its yellow textile is tinted into the cook's existing cyan uniform; warm
    // pixels outside the torso are hands and remain the cook's own dark skin.
    for (let sourceY = donorStart; sourceY < trouserStart; sourceY++) {
      const y = sourceY + shiftY;
      if (y < 0 || y >= FRAME_H) continue;
      for (let x = 22; x <= 73; x++) {
        if (keep[y * FRAME_W + x]) continue;
        const pixel = rgba(donor, frame, x, sourceY);
        if (pixel[3] <= 8) continue;
        if (isWarmApronPixel(pixel)) {
          setPixel(out, frame, x, y, tintApronPixel(pixel));
        } else if (Math.max(pixel[0], pixel[1], pixel[2]) < 112) {
          setPixel(out, frame, x, y, pixel);
        }
      }
    }

    // Then replace the floor-length apron with the donor's two planted legs.
    for (let sourceY = trouserStart; sourceY < FRAME_H; sourceY++) {
      const y = sourceY + shiftY;
      if (y < targetStart || y >= FRAME_H) continue;
      let minX = FRAME_W;
      let maxX = -1;
      for (let x = 0; x < FRAME_W; x++) {
        if (!legs[sourceY * FRAME_W + x]) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      if (maxX < 0) continue;

      // Remove the old floor-length apron across the donor leg span.  Clearing
      // the middle as well is what makes the two legs read separately.
      for (let x = Math.max(0, minX - 1); x <= Math.min(FRAME_W - 1, maxX + 1); x++) {
        if (!keep[y * FRAME_W + x]) setPixel(out, frame, x, y, [0, 0, 0, 0]);
      }
      for (let x = 0; x < FRAME_W; x++) {
        if (!legs[sourceY * FRAME_W + x] || keep[y * FRAME_W + x]) continue;
        setPixel(
          out,
          frame,
          x,
          y,
          tintTrouserPixel(rgba(donor, frame, x, sourceY), sourceY >= donorBottom - 6),
        );
      }
    }
  }
  return out;
}

const target = decodePng(readFileSync(runtimePath));
const donor = decodePng(readFileSync(donorPath));
assertSheet(target, runtimePath);
assertSheet(donor, donorPath);
const repaired = repair(target, donor);

if (process.argv.includes('--apply')) {
  const bytes = encodePng(repaired);
  writeFileSync(runtimePath, bytes);
  writeFileSync(masterPath, bytes);
  console.log(`updated ${runtimePath}`);
  console.log(`updated ${masterPath}`);
} else {
  const outPath = resolve(arg('out') ?? 'tmp/martClerk_legs_preview.png');
  writeFileSync(outPath, encodePng(repaired));
  console.log(`previewed ${outPath}`);
  console.log('use --apply to update the runtime sheet and canonical master');
}
