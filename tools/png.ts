/**
 * Minimal zero-dependency PNG writer for build-time art export (S8).
 *
 * The sprite engine draws palette indices into Pixmaps (ADR-002); this module
 * turns those into real PNG bytes in Node — no canvas, no extra deps — so the
 * Android icon/splash set is rendered FROM the engine at build time. Palette
 * conformance is by construction: the only colors that can appear are the 64
 * entries of src/palette.ts (plus transparency).
 */
import { deflateSync, inflateSync } from 'node:zlib';
import { PALETTE, T } from '../src/palette';
import { Pixmap } from '../src/spritegen/pixmap';

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

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

const RGB_TO_INDEX = new Map(
  PALETTE.map((hex, i) => {
    const [r, g, b] = hexRgb(hex);
    return [`${r},${g},${b}`, i] as const;
  }),
);

function nearestPaletteIndex(r: number, g: number, b: number): number {
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  PALETTE.forEach((hex, i) => {
    const [pr, pg, pb] = hexRgb(hex);
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Decode an 8-bit truecolor PNG into the engine Pixmap palette. */
export function decodePngToPixmap(bytes: Uint8Array): Pixmap {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  sig.forEach((v, i) => {
    if (bytes[i] !== v) throw new Error('not a PNG');
  });

  let off = 8;
  let w = 0;
  let h = 0;
  let colorType = 0;
  const idat: Uint8Array[] = [];
  while (off < bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + off, 4).getUint32(0);
    const type = String.fromCharCode(bytes[off + 4], bytes[off + 5], bytes[off + 6], bytes[off + 7]);
    const data = bytes.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
      w = dv.getUint32(0);
      h = dv.getUint32(4);
      if (data[8] !== 8) throw new Error(`unsupported PNG bit depth ${data[8]}`);
      colorType = data[9];
      if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported PNG color type ${colorType}`);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  const compressed = new Uint8Array(idat.reduce((n, part) => n + part.length, 0));
  let pos = 0;
  idat.forEach((part) => {
    compressed.set(part, pos);
    pos += part.length;
  });

  const bpp = colorType === 6 ? 4 : 3;
  const rowBytes = w * bpp;
  const raw = inflateSync(compressed);
  const rgba = new Uint8Array(w * h * 4);
  let rawOff = 0;
  let prev = new Uint8Array(rowBytes);
  for (let y = 0; y < h; y++) {
    const filter = raw[rawOff++];
    const row = new Uint8Array(rowBytes);
    for (let x = 0; x < rowBytes; x++) {
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev[x] ?? 0;
      const c = x >= bpp ? prev[x - bpp] : 0;
      const v = raw[rawOff++];
      row[x] =
        filter === 0 ? v :
        filter === 1 ? (v + a) & 0xff :
        filter === 2 ? (v + b) & 0xff :
        filter === 3 ? (v + Math.floor((a + b) / 2)) & 0xff :
        filter === 4 ? (v + paeth(a, b, c)) & 0xff :
        (() => { throw new Error(`unsupported PNG filter ${filter}`); })();
    }
    for (let x = 0; x < w; x++) {
      const src = x * bpp;
      const dst = (y * w + x) * 4;
      rgba[dst] = row[src];
      rgba[dst + 1] = row[src + 1];
      rgba[dst + 2] = row[src + 2];
      rgba[dst + 3] = colorType === 6 ? row[src + 3] : 255;
    }
    prev = row;
  }

  const pm = new Pixmap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (rgba[o + 3] < 16) continue;
      const key = `${rgba[o]},${rgba[o + 1]},${rgba[o + 2]}`;
      pm.set(x, y, RGB_TO_INDEX.get(key) ?? nearestPaletteIndex(rgba[o], rgba[o + 1], rgba[o + 2]));
    }
  }
  return pm;
}
