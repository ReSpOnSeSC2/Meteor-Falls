/**
 * Promote the eight authored Lotus Harbor image-generation masters into the
 * exact city-scale runtime canvases consumed by the formal-city registry.
 *
 * This is an offline, deterministic export step: runtime always loads the
 * committed PNGs below and never falls back to drawCityBuilding(). Source art
 * is retained under assets/art/masters/generated for visual review/re-export.
 *
 *   node_modules/.bin/vite-node tools/promote-lotus-cityscale-facades.ts
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MASTER_DIR = join(ROOT, 'assets', 'art', 'masters', 'generated');
const OUT_DIR = join(ROOT, 'assets', 'art', 'world', 'facades');

interface Promotion {
  id: string;
  height: 880 | 1200;
}

export const LOTUS_CITY_SCALE_PROMOTIONS: readonly Promotion[] = [
  { id: 'grand_market', height: 1200 },
  { id: 'harbor_office', height: 880 },
  { id: 'lantern_shop', height: 880 },
  { id: 'pagoda', height: 1200 },
  { id: 'row_house', height: 880 },
  { id: 'tea_house', height: 880 },
  { id: 'temple', height: 1200 },
  { id: 'theater', height: 1200 },
] as const;

const TARGET_W = 264;
const PAD = 2;
const LOW = 28;
const HIGH = 130;

function keyMagenta(source: Img): Img {
  const out: Img = { w: source.w, h: source.h, data: new Uint8Array(source.data) };
  for (let i = 0; i < out.data.length; i += 4) {
    const r = out.data[i];
    const g = out.data[i + 1];
    const b = out.data[i + 2];
    const spill = Math.min(r, b) - g;
    if (spill <= 0) continue;
    out.data[i] = Math.max(0, r - spill);
    out.data[i + 2] = Math.max(0, b - spill);
    const alpha = Math.max(0, Math.min(255, Math.round(255 - ((spill - LOW) / (HIGH - LOW)) * 255)));
    out.data[i + 3] = Math.min(out.data[i + 3], alpha);
  }
  return out;
}

function contentBounds(img: Img): { x: number; y: number; w: number; h: number } {
  let minX = img.w;
  let minY = img.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] <= 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('master contains no non-magenta subject');
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Alpha-weighted box resample into the exact formal-city canvas. The imagegen
 * prompts already authored each subject for the destination aspect; pinning
 * both axes here removes harmless prompt-render margin drift and keeps every
 * facade's footprint/height contract byte-stable. */
function fitExact(source: Img, targetH: number): Img {
  const src = keyMagenta(source);
  const box = contentBounds(src);
  const out = makeImg(TARGET_W, targetH);
  const dw = TARGET_W - PAD * 2;
  const dh = targetH - PAD * 2;

  for (let oy = 0; oy < dh; oy++) {
    const sy0 = box.y + Math.floor((oy * box.h) / dh);
    const sy1 = box.y + Math.max(Math.floor(((oy + 1) * box.h) / dh), Math.floor((oy * box.h) / dh) + 1);
    for (let ox = 0; ox < dw; ox++) {
      const sx0 = box.x + Math.floor((ox * box.w) / dw);
      const sx1 = box.x + Math.max(Math.floor(((ox + 1) * box.w) / dw), Math.floor((ox * box.w) / dw) + 1);
      let pr = 0;
      let pg = 0;
      let pb = 0;
      let alpha = 0;
      let samples = 0;
      for (let sy = sy0; sy < Math.min(box.y + box.h, sy1); sy++) {
        for (let sx = sx0; sx < Math.min(box.x + box.w, sx1); sx++) {
          const i = (sy * src.w + sx) * 4;
          const a = src.data[i + 3];
          pr += src.data[i] * a;
          pg += src.data[i + 1] * a;
          pb += src.data[i + 2] * a;
          alpha += a;
          samples++;
        }
      }
      const o = ((oy + PAD) * out.w + ox + PAD) * 4;
      if (alpha > 0) {
        out.data[o] = Math.round(pr / alpha);
        out.data[o + 1] = Math.round(pg / alpha);
        out.data[o + 2] = Math.round(pb / alpha);
      }
      out.data[o + 3] = Math.round(alpha / Math.max(1, samples));
    }
  }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const { id, height } of LOTUS_CITY_SCALE_PROMOTIONS) {
  const sourcePath = join(MASTER_DIR, `lh_cityscale_${id}_src.png`);
  const runtimeName = `bldg_cityscale_lotus_harbor_lotus_harbor_${id}.png`;
  const runtimePath = join(OUT_DIR, runtimeName);
  const out = fitExact(decodePng(readFileSync(sourcePath)), height);
  const encoded = encodePng(out);
  mkdirSync(dirname(runtimePath), { recursive: true });
  writeFileSync(runtimePath, encoded);
  const hash = createHash('sha256').update(encoded).digest('hex').slice(0, 16);
  console.log(`${runtimeName} ${out.w}x${out.h} sha256:${hash}`);
}
