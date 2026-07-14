/**
 * Convert a 3-column x 5-row authored walk atlas into the engine's 46-frame
 * 96x128 / 4-column character sheet. The source atlas rows are down, left,
 * up, down-left, and up-left; each row is stand, step A, step B.
 *
 * The transformation is deliberately limited to chroma removal, transparent
 * crop/normalization, exact placement, copy, and horizontal mirror. It never
 * invents in-between poses.
 *
 *   npx tsx tools/assemble-ch1-walk-atlas.ts <atlas.png> <runtime.png>
 *     [--master=<master.png>] [--review=<contact.png>]
 *   npm run ch1:npc:borden|realtor|waitress
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

const FW = 96;
const FH = 128;
const COLS = 4;
const SHEET_ROWS = 12;
const TARGET_H = 108;
const FOOT = 16;

const NPC_PRESET = {
  borden: 'npc_borden',
  realtor: 'npc_realtor',
  waitress: 'npc_waitress',
} as const;

let [, , atlasPath, outputPath, ...args] = process.argv;
if (atlasPath?.startsWith('--npc=')) {
  const preset = atlasPath.slice('--npc='.length) as keyof typeof NPC_PRESET;
  const id = NPC_PRESET[preset];
  if (!id) throw new Error(`unknown Chapter 1 NPC walk preset: ${preset}`);
  atlasPath = `assets/art/masters/generated/ch1-expanded/${id}-walk-atlas-source.png`;
  outputPath = `assets/art/characters/${id}_anim_46_4x.png`;
  args = [
    `--master=assets/art/masters/characters/animation/${id}_anim_46_4x_master.png`,
    `--review=output/ch1_asset_contacts/${id}_walk_review.png`,
  ];
}
if (!atlasPath || !outputPath) {
  throw new Error('usage: npx tsx tools/assemble-ch1-walk-atlas.ts <atlas.png> <runtime.png> [--master=...] [--review=...] | --npc=borden|realtor|waitress');
}
const option = (name: string): string | undefined => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

function isGreenKey(r: number, g: number, b: number, a: number): boolean {
  return a > 0 && g > 70 && g > r * 1.25 && g > b * 1.25 && g - Math.max(r, b) > 28;
}

function removeGreenMatte(source: Img): Img {
  const out: Img = { w: source.w, h: source.h, data: new Uint8Array(source.data) };
  // Flood only green connected to the atlas border. This preserves legitimate
  // interior greens such as the realtor's jacket and Borden's shoulder patch.
  const seen = new Uint8Array(out.w * out.h);
  const queue = new Int32Array(out.w * out.h);
  let head = 0;
  let tail = 0;
  const visit = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= out.w || y >= out.h) return;
    const p = y * out.w + x;
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4;
    if (!isGreenKey(out.data[i], out.data[i + 1], out.data[i + 2], out.data[i + 3])) return;
    out.data.fill(0, i, i + 4);
    queue[tail++] = p;
  };
  for (let x = 0; x < out.w; x++) {
    visit(x, 0);
    visit(x, out.h - 1);
  }
  for (let y = 0; y < out.h; y++) {
    visit(0, y);
    visit(out.w - 1, y);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % out.w;
    const y = Math.floor(p / out.w);
    visit(x + 1, y);
    visit(x - 1, y);
    visit(x, y + 1);
    visit(x, y - 1);
  }

  // Image generators sometimes leave tiny enclosed key-color pinholes inside
  // hair or between a prop and hand. They cannot be reached by the border flood,
  // but are still unmistakably bright matte (authored greens in these three
  // designs are much darker). Clear those islands before resampling.
  for (let p = 0; p < out.w * out.h; p++) {
    const i = p * 4;
    const r = out.data[i];
    const g = out.data[i + 1];
    const b = out.data[i + 2];
    if (
      out.data[i + 3] > 0
      && g >= 115
      && g > r * 1.18
      && g > b * 1.18
      && g - Math.max(r, b) > 18
    ) out.data.fill(0, i, i + 4);
  }

  // Remove very bright green antialias fringe next to the cleared matte. Dark
  // authored greens remain untouched.
  const matte = new Uint8Array(out.w * out.h);
  for (let p = 0; p < matte.length; p++) matte[p] = out.data[p * 4 + 3] === 0 ? 1 : 0;
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const p = y * out.w + x;
      const i = p * 4;
      const r = out.data[i];
      const g = out.data[i + 1];
      const b = out.data[i + 2];
      if (out.data[i + 3] === 0 || g < 150 || !isGreenKey(r, g, b, out.data[i + 3])) continue;
      let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < out.w && ny < out.h && matte[ny * out.w + nx]) {
            edge = true;
            break;
          }
        }
      }
      if (edge) out.data.fill(0, i, i + 4);
    }
  }
  return out;
}

function findPoseRows(source: Img): Array<[number, number]> {
  const occupied = new Int32Array(source.h);
  for (let y = 0; y < source.h; y++) {
    let count = 0;
    for (let x = 0; x < source.w; x++) {
      if (source.data[(y * source.w + x) * 4 + 3] > 24) count++;
    }
    occupied[y] = count;
  }
  const rows: Array<[number, number]> = [];
  const minGap = 8;
  const minHeight = 40;
  let start = -1;
  let gap = 0;
  for (let y = 0; y < source.h; y++) {
    if (occupied[y] >= 3) {
      if (start < 0) start = y;
      gap = 0;
    } else if (start >= 0) {
      gap++;
      if (gap >= minGap) {
        const end = y - gap;
        if (end - start + 1 >= minHeight) rows.push([Math.max(0, start - 2), Math.min(source.h - 1, end + 2)]);
        start = -1;
      }
    }
  }
  if (start >= 0 && source.h - start >= minHeight) rows.push([Math.max(0, start - 2), source.h - 1]);
  if (rows.length !== 5) throw new Error(`expected 5 authored pose rows after chroma removal, found ${rows.length}: ${JSON.stringify(rows)}`);
  return rows;
}

function extractCell(source: Img, col: number, row: [number, number]): Img {
  const x0 = Math.floor(col * source.w / 3);
  const x1 = Math.floor((col + 1) * source.w / 3);
  const [y0, yEnd] = row;
  const y1 = yEnd + 1;
  const out = makeImg(x1 - x0, y1 - y0);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const src = ((y0 + y) * source.w + x0 + x) * 4;
      const dst = (y * out.w + x) * 4;
      out.data.set(source.data.subarray(src, src + 4), dst);
    }
  }
  return out;
}

function bounds(image: Img): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = image.w;
  let minY = image.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.h; y++) {
    for (let x = 0; x < image.w; x++) {
      if (image.data[(y * image.w + x) * 4 + 3] <= 24) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) throw new Error('empty authored pose after chroma removal');
  return { minX, minY, maxX, maxY };
}

function normalizePose(image: Img, scale: number): Img {
  const box = bounds(image);
  const bw = box.maxX - box.minX + 1;
  const bh = box.maxY - box.minY + 1;
  const ow = Math.max(1, Math.round(bw * scale));
  const oh = Math.max(1, Math.round(bh * scale));
  const out = makeImg(FW, FH);
  const offX = Math.round((FW - ow) / 2);
  const offY = FH - FOOT - oh;

  for (let oy = 0; oy < oh; oy++) {
    for (let ox = 0; ox < ow; ox++) {
      const sx0 = box.minX + Math.floor(ox / scale);
      const sx1 = Math.min(box.maxX, box.minX + Math.floor((ox + 1) / scale));
      const sy0 = box.minY + Math.floor(oy / scale);
      const sy1 = Math.min(box.maxY, box.minY + Math.floor((oy + 1) / scale));
      let premulR = 0;
      let premulG = 0;
      let premulB = 0;
      let alphaSum = 0;
      let samples = 0;
      for (let sy = sy0; sy <= sy1; sy++) {
        for (let sx = sx0; sx <= sx1; sx++) {
          const i = (sy * image.w + sx) * 4;
          const alpha = image.data[i + 3];
          premulR += image.data[i] * alpha;
          premulG += image.data[i + 1] * alpha;
          premulB += image.data[i + 2] * alpha;
          alphaSum += alpha;
          samples++;
        }
      }
      if (!alphaSum) continue;
      const i = ((offY + oy) * FW + offX + ox) * 4;
      out.data[i] = Math.round(premulR / alphaSum);
      out.data[i + 1] = Math.round(premulG / alphaSum);
      out.data[i + 2] = Math.round(premulB / alphaSum);
      out.data[i + 3] = Math.round(alphaSum / samples);
    }
  }
  return out;
}

function frameOrigin(frame: number): [number, number] {
  return [(frame % COLS) * FW, Math.floor(frame / COLS) * FH];
}

function place(sheet: Img, frame: number, pose: Img): void {
  const [ox, oy] = frameOrigin(frame);
  for (let y = 0; y < FH; y++) {
    const src = y * FW * 4;
    const dst = ((oy + y) * sheet.w + ox) * 4;
    sheet.data.set(pose.data.subarray(src, src + FW * 4), dst);
  }
}

function copy(sheet: Img, dstFrame: number, srcFrame: number, mirror = false): void {
  const [sx, sy] = frameOrigin(srcFrame);
  const pose = makeImg(FW, FH);
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const sourceX = mirror ? FW - 1 - x : x;
      const src = ((sy + y) * sheet.w + sx + sourceX) * 4;
      const dst = (y * FW + x) * 4;
      pose.data.set(sheet.data.subarray(src, src + 4), dst);
    }
  }
  place(sheet, dstFrame, pose);
}

const atlas = removeGreenMatte(decodePng(readFileSync(atlasPath)));
const poseRows = findPoseRows(atlas);
const extracted = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 3 }, (_, col) => extractCell(atlas, col, poseRows[row])),
);
// Keep each direction's stand/step trio at one shared scale so walking cannot
// pulse. Different facings may need different normalization because a carried
// clipboard or coffee pot changes the authored silhouette width dramatically.
const rowScales = extracted.map((row) => {
  const rowBounds = row.map((pose) => bounds(pose));
  return Math.min(
    TARGET_H / Math.max(...rowBounds.map((box) => box.maxY - box.minY + 1)),
    (FW - 2) / Math.max(...rowBounds.map((box) => box.maxX - box.minX + 1)),
  );
});
const poses = extracted.map((row, index) => row.map((pose) => normalizePose(pose, rowScales[index])));
const sheet = makeImg(FW * COLS, FH * SHEET_ROWS);

for (const [row, frames] of [[0, [0, 1, 3]], [1, [4, 5, 7]], [2, [12, 13, 15]], [3, [27, 28, 29]], [4, [33, 34, 35]]] as const) {
  frames.forEach((frame, col) => place(sheet, frame, poses[row][col]));
}
copy(sheet, 2, 0);
copy(sheet, 6, 4);
copy(sheet, 14, 12);
for (const [dst, src] of [[8, 4], [9, 5], [10, 6], [11, 7], [24, 27], [25, 28], [26, 29], [30, 33], [31, 34], [32, 35]] as const) {
  copy(sheet, dst, src, true);
}
for (const [dst, src] of [[16, 1], [17, 3], [18, 5], [19, 7], [20, 9], [21, 11], [22, 13], [23, 15], [36, 25], [37, 26], [38, 28], [39, 29], [40, 31], [41, 32], [42, 34], [43, 35], [44, 0], [45, 0]] as const) {
  copy(sheet, dst, src);
}

const encoded = encodePng(sheet);
writeFileSync(outputPath, encoded);
const masterPath = option('master');
if (masterPath) writeFileSync(masterPath, encoded);

const reviewPath = option('review');
if (reviewPath) {
  const reviewFrames = [
    [0, 1, 3], [27, 28, 29], [4, 5, 7], [33, 34, 35],
    [12, 13, 15], [30, 31, 32], [8, 9, 11], [24, 25, 26],
  ];
  const scale = 2;
  const review = makeImg(8 * FW * scale, 3 * FH * scale);
  for (let col = 0; col < reviewFrames.length; col++) {
    for (let row = 0; row < 3; row++) {
      const [sx, sy] = frameOrigin(reviewFrames[col][row]);
      for (let y = 0; y < FH; y++) {
        for (let x = 0; x < FW; x++) {
          const src = ((sy + y) * sheet.w + sx + x) * 4;
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const rx = (col * FW + x) * scale + dx;
              const ry = (row * FH + y) * scale + dy;
              const dst = (ry * review.w + rx) * 4;
              const checker = ((Math.floor(rx / 16) + Math.floor(ry / 16)) & 1) ? 52 : 76;
              const alpha = sheet.data[src + 3] / 255;
              review.data[dst] = Math.round(sheet.data[src] * alpha + checker * (1 - alpha));
              review.data[dst + 1] = Math.round(sheet.data[src + 1] * alpha + checker * (1 - alpha));
              review.data[dst + 2] = Math.round(sheet.data[src + 2] * alpha + checker * (1 - alpha));
              review.data[dst + 3] = 255;
            }
          }
        }
      }
    }
  }
  writeFileSync(reviewPath, encodePng(review));
}

console.log(`assembled ${atlas.w}x${atlas.h} atlas -> ${sheet.w}x${sheet.h} sheet at row scales ${rowScales.map((scale) => scale.toFixed(4)).join(',')}${masterPath ? ' + master' : ''}${reviewPath ? ' + review' : ''}`);
