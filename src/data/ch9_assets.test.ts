import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

function asset(path: string): Buffer {
  return readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)));
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function paeth(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function pngCornerPixels(bytes: Buffer): number[][] {
  const idat: Buffer[] = [];
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let offset = 8;

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === 'IDAT') {
      idat.push(chunk);
    }
    offset += length + 12;
    if (type === 'IEND') break;
  }

  expect(bitDepth).toBe(8);
  expect([2, 6]).toContain(colorType);
  expect(interlace).toBe(0);
  const { width, height } = pngSize(bytes);
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowBytes = width * bytesPerPixel;
  const raw = inflateSync(Buffer.concat(idat));
  expect(raw.length).toBe((rowBytes + 1) * height);

  let sourceOffset = 0;
  let previous = Buffer.alloc(rowBytes);
  let top: number[][] = [];
  let bottom: number[][] = [];
  for (let y = 0; y < height; y++) {
    const filter = raw[sourceOffset++];
    if (filter > 4) throw new Error(`unsupported PNG filter ${filter}`);
    const row = Buffer.allocUnsafe(rowBytes);
    for (let x = 0; x < rowBytes; x++) {
      const value = raw[sourceOffset++];
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      const prediction = filter === 0 ? 0
        : filter === 1 ? left
          : filter === 2 ? up
            : filter === 3 ? Math.floor((left + up) / 2)
              : filter === 4 ? paeth(left, up, upperLeft)
                : -1;
      row[x] = (value + prediction) & 0xff;
    }
    if (y === 0) {
      top = [0, width - 1].map((x) => {
        const rgb = Array.from(row.subarray(x * bytesPerPixel, x * bytesPerPixel + bytesPerPixel));
        return bytesPerPixel === 4 ? rgb : [...rgb, 255];
      });
    }
    if (y === height - 1) {
      bottom = [0, width - 1].map((x) => {
        const rgb = Array.from(row.subarray(x * bytesPerPixel, x * bytesPerPixel + bytesPerPixel));
        return bytesPerPixel === 4 ? rgb : [...rgb, 255];
      });
    }
    previous = row;
  }
  return [...top, ...bottom];
}

describe('Chapter 9 enemy wear art contracts', () => {
  it('keeps retained masters chroma-keyable and runtime trios aligned, transparent, and distinct', () => {
    const masterNames = [
      'haystack_mimic_w1',
      'haystack_mimic_w2',
      'moss_strigoi_w1',
      'moss_strigoi_w2',
      'animated_armor_w1',
      'animated_armor_w2',
      'wolf_of_the_old_road_w1',
      'wolf_of_the_old_road_w2',
      'count_hoaxula_w2',
      'count_hoaxula_unmasked_w1',
      'count_hoaxula_unmasked_w2',
    ];
    for (const name of masterNames) {
      const master = asset(`assets/art/masters/generated/${name}_src.png`);
      expect(pngSize(master), `${name} master canvas`).toEqual({ width: 1254, height: 1254 });
      for (const [red, green, blue, alpha] of pngCornerPixels(master)) {
        expect(alpha, `${name} master corner alpha`).toBe(255);
        expect(Math.min(red, blue) - green, `${name} master corner chroma`).toBeGreaterThan(160);
      }
    }

    const trioNames = [
      'haystack_mimic',
      'moss_strigoi',
      'animated_armor',
      'wolf_of_the_old_road',
      'count_hoaxula',
      'count_hoaxula_unmasked',
    ];
    for (const name of trioNames) {
      const stages = ['', '_w1', '_w2'].map((suffix) =>
        asset(`assets/art/enemies/battle_${name}${suffix}.png`),
      );
      expect(new Set(stages.map((stage) => JSON.stringify(pngSize(stage)))).size, `${name} canvas drift`).toBe(1);
      expect(new Set(stages.map(sha256)).size, `${name} duplicate wear stage`).toBe(3);
    }

    for (const name of masterNames) {
      const runtime = asset(`assets/art/enemies/battle_${name}.png`);
      expect(pngCornerPixels(runtime).map((pixel) => pixel[3]), `${name} runtime corners`).toEqual([0, 0, 0, 0]);
    }
  });
});
