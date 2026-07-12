/**
 * Split a regular magenta-backed image-generation grid into transparent,
 * content-tight prop PNGs. This complements slice-prop-strip.cjs for prompts
 * that use multiple rows so each object can retain a useful authored size.
 *
 *   node tools/slice-prop-grid.cjs <src.png> <outPrefix> \
 *     [--cols=3] [--rows=2] [--target=256] [--inset=0]
 */
const { PNG } = require('pngjs');
const fs = require('fs');

const argv = process.argv;
const opt = (name, fallback) => {
  const arg = argv.find((value) => value.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
};
const [, , srcPath, outPrefix] = argv;
if (!srcPath || !outPrefix) {
  console.error('usage: node tools/slice-prop-grid.cjs <src> <outPrefix> [--cols=3] [--rows=2] [--target=256]');
  process.exit(1);
}

const COLS = Number(opt('cols', 3));
const ROWS = Number(opt('rows', 2));
const TARGET = Number(opt('target', 256));
const INSET = Number(opt('inset', 0));
if (!Number.isInteger(COLS) || !Number.isInteger(ROWS) || !Number.isInteger(INSET) || COLS < 1 || ROWS < 1 || TARGET < 1 || INSET < 0) {
  console.error('cols, rows, target, and inset must be non-negative integers (sizes positive)');
  process.exit(2);
}

let encoded = fs.readFileSync(srcPath);
const iend = encoded.indexOf('IEND');
if (iend >= 0) encoded = encoded.subarray(0, iend + 8);
const source = PNG.sync.read(encoded);
const { width: width, height: height, data } = source;

// Key and despill the flat magenta screen. The generated props deliberately use
// blue, amber, and charcoal, so requiring both red and blue to dominate green
// protects the authored colors while removing the screen and its fringe.
for (let i = 0; i < data.length; i += 4) {
  const red = data[i];
  const green = data[i + 1];
  const blue = data[i + 2];
  const spill = Math.min(red, blue) - green;
  if (spill <= 0) continue;
  data[i] = Math.max(0, red - spill);
  data[i + 2] = Math.max(0, blue - spill);
  const alpha = Math.max(0, Math.min(255, Math.round(255 - ((spill - 28) / 102) * 255)));
  data[i + 3] = Math.min(data[i + 3], alpha);
}

const sizes = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    // Image generators sometimes draw pale grid rules exactly across nominal
    // cell boundaries. A small opt-in inset excludes those gutters before
    // chroma keying without changing the default behavior for existing sheets.
    const cellX0 = Math.floor((col * width) / COLS) + INSET;
    const cellX1 = Math.floor(((col + 1) * width) / COLS) - 1 - INSET;
    const cellY0 = Math.floor((row * height) / ROWS) + INSET;
    const cellY1 = Math.floor(((row + 1) * height) / ROWS) - 1 - INSET;
    let minX = cellX1;
    let minY = cellY1;
    let maxX = cellX0;
    let maxY = cellY0;

    for (let y = cellY0; y <= cellY1; y++) {
      for (let x = cellX0; x <= cellX1; x++) {
        if (data[(y * width + x) * 4 + 3] <= 16) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      console.error(`cell ${col},${row} contains no keyed content`);
      process.exit(3);
    }

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const scale = Math.min(1, TARGET / Math.max(cropWidth, cropHeight));
    const outWidth = Math.max(1, Math.round(cropWidth * scale));
    const outHeight = Math.max(1, Math.round(cropHeight * scale));
    const output = new PNG({ width: outWidth, height: outHeight });

    for (let outY = 0; outY < outHeight; outY++) {
      for (let outX = 0; outX < outWidth; outX++) {
        const sourceX0 = minX + Math.floor(outX / scale);
        const sourceX1 = Math.min(maxX, minX + Math.floor((outX + 1) / scale));
        const sourceY0 = minY + Math.floor(outY / scale);
        const sourceY1 = Math.min(maxY, minY + Math.floor((outY + 1) / scale));
        let premulRed = 0;
        let premulGreen = 0;
        let premulBlue = 0;
        let alphaSum = 0;
        let sampleCount = 0;

        for (let y = sourceY0; y <= sourceY1; y++) {
          for (let x = sourceX0; x <= sourceX1; x++) {
            const sourceIndex = (y * width + x) * 4;
            const alpha = data[sourceIndex + 3];
            premulRed += data[sourceIndex] * alpha;
            premulGreen += data[sourceIndex + 1] * alpha;
            premulBlue += data[sourceIndex + 2] * alpha;
            alphaSum += alpha;
            sampleCount++;
          }
        }

        const outputIndex = (outY * outWidth + outX) * 4;
        if (alphaSum > 0) {
          output.data[outputIndex] = Math.round(premulRed / alphaSum);
          output.data[outputIndex + 1] = Math.round(premulGreen / alphaSum);
          output.data[outputIndex + 2] = Math.round(premulBlue / alphaSum);
          output.data[outputIndex + 3] = Math.round(alphaSum / Math.max(1, sampleCount));
        }
      }
    }

    const index = row * COLS + col;
    fs.writeFileSync(`${outPrefix}_${index}.png`, PNG.sync.write(output));
    sizes.push(`${outWidth}x${outHeight}`);
  }
}

console.log(`segmented ${COLS * ROWS} props -> ${outPrefix}_[0..${COLS * ROWS - 1}].png sizes=[${sizes.join(', ')}]`);
