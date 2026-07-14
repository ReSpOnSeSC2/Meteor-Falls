/**
 * Deterministic, lossless helpers for the Chapter 1 authored-raster repair pass.
 *
 * These routines deliberately operate on the already-accepted authored art. They
 * do not invent replacement pixels: chroma cleanup only removes/despills pixels
 * that still match the retired magenta key, and mini derivation is a transparent
 * crop plus premultiplied area-average reduction of the matching battler.
 */
import { createHash } from 'node:crypto';
import type { Img } from './imageio';
import { makeImg } from './imageio';

export interface AlphaBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
}

export interface ChromaCleanupStats {
  removedStrong: number;
  removedFringe: number;
  despilledFringe: number;
  canonicalizedTransparent: number;
}

export interface ChromaCleanupResult {
  image: Img;
  stats: ChromaCleanupStats;
}

export function cloneImg(input: Img): Img {
  return { w: input.w, h: input.h, data: new Uint8Array(input.data) };
}

export function alphaBounds(input: Img, threshold = 16): AlphaBounds | null {
  let minX = input.w;
  let minY = input.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < input.h; y++) {
    for (let x = 0; x < input.w; x++) {
      if (input.data[(y * input.w + x) * 4 + 3] <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < minX
    ? null
    : { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function chromaScore(r: number, g: number, b: number): number {
  return Math.min(r, b) - g;
}

/** Strong surviving pixels from the retired flat-magenta removal key. */
export function isStrongMagentaResidue(r: number, g: number, b: number, a: number): boolean {
  return a > 0
    && Math.min(r, b) >= 30
    && chromaScore(r, g, b) >= 15
    && Math.abs(r - b) <= 110;
}

function isMagentaFringe(r: number, g: number, b: number, a: number): boolean {
  return a > 0
    && Math.min(r, b) >= 20
    && chromaScore(r, g, b) >= 10
    && Math.abs(r - b) <= 120;
}

function hasMarkedNeighbor(mask: Uint8Array, w: number, h: number, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx] !== 0) return true;
    }
  }
  return false;
}

/**
 * Remove the very specific magenta residue left by the old broad flood-fill.
 * Strong key matches are cleared regardless of connectivity because the original
 * failure was disconnected internal key islands (bench slats and ward curtains).
 * Translucent key-colored fringe is cleared wherever it survived (the old pass
 * scattered it several pixels from the new alpha edge). Opaque authored purples
 * are preserved unless they directly border a removed strong-key pixel.
 */
export function cleanMagentaResidue(input: Img): ChromaCleanupResult {
  const image = cloneImg(input);
  const strong = new Uint8Array(input.w * input.h);
  const stats: ChromaCleanupStats = {
    removedStrong: 0,
    removedFringe: 0,
    despilledFringe: 0,
    canonicalizedTransparent: 0,
  };

  for (let p = 0; p < input.w * input.h; p++) {
    const i = p * 4;
    const r = input.data[i];
    const g = input.data[i + 1];
    const b = input.data[i + 2];
    const a = input.data[i + 3];
    if (!isStrongMagentaResidue(r, g, b, a)) continue;
    strong[p] = 1;
    image.data.fill(0, i, i + 4);
    stats.removedStrong++;
  }

  for (let y = 0; y < input.h; y++) {
    for (let x = 0; x < input.w; x++) {
      const p = y * input.w + x;
      if (strong[p] !== 0) continue;
      const i = p * 4;
      const r = input.data[i];
      const g = input.data[i + 1];
      const b = input.data[i + 2];
      const a = input.data[i + 3];
      if (!isMagentaFringe(r, g, b, a)) continue;

      // The original keyed export left isolated, partially transparent purple
      // sparks beyond the immediate edge. Their alpha is the reliable signal;
      // fully opaque dark-purple curtain folds remain authored subject matter.
      if (a < 240) {
        image.data.fill(0, i, i + 4);
        stats.removedFringe++;
        continue;
      }
      if (!hasMarkedNeighbor(strong, input.w, input.h, x, y)) continue;

      // A translucent key fringe contains more discarded background than subject.
      if (a <= 160 || chromaScore(r, g, b) >= 40) {
        image.data.fill(0, i, i + 4);
        stats.removedFringe++;
      } else {
        // Retain the opaque edge pixel, but remove the key's red/blue excess.
        image.data[i] = Math.min(r, g + 12);
        image.data[i + 2] = Math.min(b, g + 12);
        stats.despilledFringe++;
      }
    }
  }

  // Transparent RGB is irrelevant at runtime but must be canonical for stable
  // hashes and to prevent color bleed in downstream resampling.
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i + 3] !== 0) continue;
    if (image.data[i] !== 0 || image.data[i + 1] !== 0 || image.data[i + 2] !== 0) {
      stats.canonicalizedTransparent++;
    }
    image.data[i] = 0;
    image.data[i + 1] = 0;
    image.data[i + 2] = 0;
  }
  return { image, stats };
}

/** Same-identity mini derivation used by the established Ch.5 authored pass. */
export function deriveEnemyMini(input: Img, targetLongestSide = 64): Img {
  const bounds = alphaBounds(input, 16);
  if (!bounds) throw new Error('cannot derive a mini from an empty battler');
  const scale = targetLongestSide / Math.max(bounds.w, bounds.h);
  const outW = Math.max(1, Math.round(bounds.w * scale));
  const outH = Math.max(1, Math.round(bounds.h * scale));
  const output = makeImg(outW, outH);

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx0 = bounds.minX + Math.floor(ox / scale);
      const sx1 = bounds.minX + Math.floor((ox + 1) / scale);
      const sy0 = bounds.minY + Math.floor(oy / scale);
      const sy1 = bounds.minY + Math.floor((oy + 1) / scale);
      let premulR = 0;
      let premulG = 0;
      let premulB = 0;
      let alphaSum = 0;
      let samples = 0;
      for (let sy = sy0; sy <= Math.min(sy1, bounds.maxY); sy++) {
        for (let sx = sx0; sx <= Math.min(sx1, bounds.maxX); sx++) {
          const i = (sy * input.w + sx) * 4;
          const alpha = input.data[i + 3];
          premulR += input.data[i] * alpha;
          premulG += input.data[i + 1] * alpha;
          premulB += input.data[i + 2] * alpha;
          alphaSum += alpha;
          samples++;
        }
      }
      const o = (oy * outW + ox) * 4;
      const averageAlpha = samples > 0 ? alphaSum / samples : 0;
      if (averageAlpha < 8 || alphaSum === 0) continue;
      output.data[o] = Math.round(premulR / alphaSum);
      output.data[o + 1] = Math.round(premulG / alphaSum);
      output.data[o + 2] = Math.round(premulB / alphaSum);
      output.data[o + 3] = Math.round(averageAlpha);
    }
  }
  return output;
}

export function rgbaHash(input: Img): string {
  const header = Buffer.allocUnsafe(8);
  header.writeUInt32BE(input.w, 0);
  header.writeUInt32BE(input.h, 4);
  return createHash('sha256').update(header).update(input.data).digest('hex');
}

export function countStrongMagentaResidue(input: Img): number {
  let count = 0;
  for (let i = 0; i < input.data.length; i += 4) {
    if (isStrongMagentaResidue(input.data[i], input.data[i + 1], input.data[i + 2], input.data[i + 3])) count++;
  }
  return count;
}
