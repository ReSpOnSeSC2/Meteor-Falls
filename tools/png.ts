/**
 * Minimal zero-dependency PNG writer for build-time art export (S8).
 *
 * The sprite engine draws palette indices into Pixmaps (ADR-002); this module
 * turns those into real PNG bytes in Node — no canvas, no extra deps — so the
 * Android icon/splash set is rendered FROM the engine at build time. Palette
 * conformance is by construction: the only colors that can appear are the 64
 * entries of src/palette.ts (plus transparency).
 */
import { deflateSync } from 'node:zlib';
import { PALETTE, T } from '../src/palette';
import type { Pixmap } from '../src/spritegen/pixmap';

const CRC_TABLE = ((): Uint32Array => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** encode straight RGBA pixels (row-major, 4 bytes/px) as a PNG */
export function encodePng(w: number, h: number, rgba: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // raw scanlines, filter byte 0 per row
  const raw = new Uint8Array(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export interface PixmapPngOpts {
  /** integer upscale (nearest-neighbor), default 1 */
  scale?: number;
  /** palette index painted under transparent pixels; omit = stay transparent */
  bg?: number;
}

/** render a Pixmap's palette indices to PNG bytes */
export function pixmapToPng(pm: Pixmap, opts: PixmapPngOpts = {}): Uint8Array {
  const scale = Math.max(1, Math.floor(opts.scale ?? 1));
  const w = pm.w * scale;
  const h = pm.h * scale;
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < pm.h; y++) {
    for (let x = 0; x < pm.w; x++) {
      let idx = pm.get(x, y);
      let alpha = 255;
      if (idx === T) {
        if (opts.bg === undefined) alpha = 0;
        else idx = opts.bg;
      }
      const [r, g, b] = alpha === 0 ? [0, 0, 0] : hexRgb(PALETTE[idx]);
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const o = ((y * scale + sy) * w + x * scale + sx) * 4;
          rgba[o] = r;
          rgba[o + 1] = g;
          rgba[o + 2] = b;
          rgba[o + 3] = alpha;
        }
      }
    }
  }
  return encodePng(w, h, rgba);
}
