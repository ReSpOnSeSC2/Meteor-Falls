/**
 * Segment an already-keyed character pose grid into normalized 96x128 frames.
 *
 * The image must have transparent gaps between rows and columns. Use the
 * imagegen chroma-removal helper first, then:
 *
 *   node tools/slice-chroma-grid.js <src.png> <outPrefix> \
 *     --rows=3 --cols=5 [--h=108] [--foot=16] [--cw=96] [--ch=128]
 *
 * Writes <outPrefix>_r0_c0.png, ... in row-major order. This script performs
 * layout normalization only; it never invents or alters character motion.
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const argv = process.argv;
const opt = (name, fallback) => {
  const arg = argv.find((value) => value.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
};

const [, , srcPath, outPrefix] = argv;
if (!srcPath || !outPrefix) {
  console.error('usage: node tools/slice-chroma-grid.js <src.png> <outPrefix> --rows=N --cols=N');
  process.exit(1);
}

const EXPECT_ROWS = Number(opt('rows', 0));
const EXPECT_COLS = Number(opt('cols', 0));
const TARGET_H = Number(opt('h', 108));
const FOOT = Number(opt('foot', 16));
const CW = Number(opt('cw', 96));
const CH = Number(opt('ch', 128));
if (!Number.isInteger(EXPECT_ROWS) || EXPECT_ROWS < 1 || !Number.isInteger(EXPECT_COLS) || EXPECT_COLS < 1) {
  console.error('--rows and --cols must be positive integers');
  process.exit(2);
}

let buf = fs.readFileSync(srcPath);
const iend = buf.indexOf('IEND');
if (iend >= 0) buf = buf.subarray(0, iend + 8);
const src = PNG.sync.read(buf);
const { width: W, height: H, data } = src;

function axisRuns(counts, minGap, minSpan) {
  const runs = [];
  let start = -1;
  let gap = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > 0) {
      if (start < 0) start = i;
      gap = 0;
    } else if (start >= 0) {
      gap++;
      if (gap >= minGap) {
        const end = i - gap;
        if (end - start + 1 >= minSpan) runs.push([start, end]);
        start = -1;
      }
    }
  }
  if (start >= 0 && counts.length - start >= minSpan) runs.push([start, counts.length - 1]);
  return runs;
}

const colCount = new Int32Array(W);
const rowCount = new Int32Array(H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] <= 24) continue;
    colCount[x]++;
    rowCount[y]++;
  }
}

// Imagegen grids leave broad transparent gutters. Requiring a few occupied
// pixels per axis ignores isolated antialias remnants from chroma removal.
for (let x = 0; x < W; x++) if (colCount[x] < 3) colCount[x] = 0;
for (let y = 0; y < H; y++) if (rowCount[y] < 3) rowCount[y] = 0;

const colRuns = axisRuns(colCount, 10, 24);
const rowRuns = axisRuns(rowCount, 10, 24);
if (colRuns.length !== EXPECT_COLS || rowRuns.length !== EXPECT_ROWS) {
  console.error(
    `grid ${rowRuns.length}x${colRuns.length} != expected ${EXPECT_ROWS}x${EXPECT_COLS} ` +
    `(rows=${JSON.stringify(rowRuns)} cols=${JSON.stringify(colRuns)})`,
  );
  process.exit(3);
}

function writeCell(row, col, xRange, yRange) {
  const [cellX0, cellX1] = xRange;
  const [cellY0, cellY1] = yRange;
  let minX = cellX1;
  let minY = cellY1;
  let maxX = cellX0;
  let maxY = cellY0;
  let visible = 0;
  for (let y = cellY0; y <= cellY1; y++) {
    for (let x = cellX0; x <= cellX1; x++) {
      if (data[(y * W + x) * 4 + 3] <= 24) continue;
      visible++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (visible === 0) throw new Error(`empty grid cell r${row} c${col}`);

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  let scale = TARGET_H / bh;
  if (bw * scale > CW) scale = CW / bw;
  const ow = Math.max(1, Math.round(bw * scale));
  const oh = Math.max(1, Math.round(bh * scale));
  const offX = Math.round((CW - ow) / 2);
  const offY = CH - FOOT - oh;
  const out = new PNG({ width: CW, height: CH });

  for (let oy = 0; oy < oh; oy++) {
    for (let ox = 0; ox < ow; ox++) {
      const sx0 = minX + Math.floor(ox / scale);
      const sx1 = Math.min(maxX, minX + Math.floor((ox + 1) / scale));
      const sy0 = minY + Math.floor(oy / scale);
      const sy1 = Math.min(maxY, minY + Math.floor((oy + 1) / scale));
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      let samples = 0;
      for (let sy = sy0; sy <= sy1; sy++) {
        for (let sx = sx0; sx <= sx1; sx++) {
          const index = (sy * W + sx) * 4;
          const a = data[index + 3];
          red += data[index] * a;
          green += data[index + 1] * a;
          blue += data[index + 2] * a;
          alpha += a;
          samples++;
        }
      }
      const dx = offX + ox;
      const dy = offY + oy;
      if (dx < 0 || dy < 0 || dx >= CW || dy >= CH) continue;
      const outIndex = (dy * CW + dx) * 4;
      if (alpha > 0) {
        out.data[outIndex] = Math.round(red / alpha);
        out.data[outIndex + 1] = Math.round(green / alpha);
        out.data[outIndex + 2] = Math.round(blue / alpha);
        out.data[outIndex + 3] = Math.round(alpha / Math.max(1, samples));
      }
    }
  }

  fs.writeFileSync(`${outPrefix}_r${row}_c${col}.png`, PNG.sync.write(out));
}

for (let row = 0; row < rowRuns.length; row++) {
  for (let col = 0; col < colRuns.length; col++) {
    writeCell(row, col, colRuns[col], rowRuns[row]);
  }
}

console.log(
  `segmented ${EXPECT_ROWS}x${EXPECT_COLS} grid -> ${outPrefix}_rN_cN.png ` +
  `rows=${JSON.stringify(rowRuns)} cols=${JSON.stringify(colRuns)}`,
);
