/**
 * tools/imageio.ts — zero-dependency TRUE-RGBA PNG read/write for the
 * authored-art pipeline (ADR-109).
 *
 * Unlike dormant/sprite-tools/png.ts (which quantizes to the engine's 64-color
 * palette), this keeps full RGBA so high-res ChatGPT/imagegen art is processed
 * losslessly. Node only (node:zlib). Supports 8-bit PNG color type 2 (RGB) and
 * 6 (RGBA), non-interlaced — the formats imagegen emits. Throws a clear error on
 * anything else so the fix (re-export as 8-bit, no interlace) is obvious.
 */
import { deflateSync, inflateSync } from 'node:zlib';

export interface Img {
  w: number;
  h: number;
  /** RGBA, row-major, 4 bytes per pixel */
  data: Uint8Array;
}

export function makeImg(w: number, h: number): Img {
  return { w, h, data: new Uint8Array(w * h * 4) };
}

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

/** encode an RGBA image as an 8-bit truecolor+alpha PNG */
export function encodePng(img: Img): Uint8Array {
  const { w, h, data } = img;
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = new Uint8Array(h * (1 + w * 4)); // filter byte 0 per row
  for (let y = 0; y < h; y++) {
    raw.set(data.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1);
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

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** decode an 8-bit RGB/RGBA non-interlaced PNG into a flat RGBA image */
export function decodePng(bytes: Uint8Array): Img {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  sig.forEach((v, i) => {
    if (bytes[i] !== v) throw new Error('not a PNG file');
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
      if (data[8] !== 8) throw new Error(`unsupported PNG bit depth ${data[8]} — re-export as 8-bit`);
      colorType = data[9];
      if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported PNG color type ${colorType} — need RGB or RGBA`);
      if (data[12] !== 0) throw new Error('interlaced PNG not supported — re-export without interlace');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  const compressed = new Uint8Array(idat.reduce((n, part) => n + part.length, 0));
  let pos = 0;
  for (const part of idat) {
    compressed.set(part, pos);
    pos += part.length;
  }

  const bpp = colorType === 6 ? 4 : 3;
  const rowBytes = w * bpp;
  const raw = inflateSync(compressed);
  const data = new Uint8Array(w * h * 4);
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
      data[dst] = row[src];
      data[dst + 1] = row[src + 1];
      data[dst + 2] = row[src + 2];
      data[dst + 3] = colorType === 6 ? row[src + 3] : 255;
    }
    prev = row;
  }
  return { w, h, data };
}
