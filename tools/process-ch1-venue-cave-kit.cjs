/**
 * Deterministically derive Chapter 1 venue doors, cave props, and the two-cell
 * Oak Cave material strip from the accepted 5x2 image-generation master.
 *
 * Usage:
 *   node tools/process-ch1-venue-cave-kit.cjs \
 *     assets/art/masters/world/ch1-venue-cave-kit-source.png
 *
 * Cell order is frozen in the image-generation prompt:
 *   hotel/hardware/hospital closed, cave arch, mushrooms
 *   hotel/hardware/hospital open, cave floor, cave wall
 */
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('usage: node tools/process-ch1-venue-cave-kit.cjs <5x2-master.png>');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const PROP_DIR = path.join(ROOT, 'assets', 'art', 'world', 'props');
const TILE_OUT = path.join(ROOT, 'assets', 'art', 'world', 'OakCave_tiles_16.png');
const COLS = 5;
const ROWS = 2;
const DOOR_W = 80;
const DOOR_H = 112;

let encoded = fs.readFileSync(path.resolve(sourcePath));
const iend = encoded.indexOf('IEND');
if (iend >= 0) encoded = encoded.subarray(0, iend + 8);
const source = PNG.sync.read(encoded);

// Global magenta despill/key. The prompt reserves #ff00ff exclusively for the
// screen, so this can remove antialiased spill without deleting authored hues.
for (let i = 0; i < source.data.length; i += 4) {
  const r = source.data[i];
  const g = source.data[i + 1];
  const b = source.data[i + 2];
  const spill = Math.min(r, b) - g;
  if (spill <= 0) continue;
  source.data[i] = Math.max(0, r - spill);
  source.data[i + 2] = Math.max(0, b - spill);
  const alpha = Math.max(0, Math.min(255, Math.round(255 - ((spill - 24) / 105) * 255)));
  source.data[i + 3] = Math.min(source.data[i + 3], alpha);
}

function cell(index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const inset = Math.max(3, Math.floor(Math.min(source.width / COLS, source.height / ROWS) * 0.025));
  const x0 = Math.floor((col * source.width) / COLS) + inset;
  const x1 = Math.floor(((col + 1) * source.width) / COLS) - 1 - inset;
  const y0 = Math.floor((row * source.height) / ROWS) + inset;
  const y1 = Math.floor(((row + 1) * source.height) / ROWS) - 1 - inset;
  let minX = x1;
  let minY = y1;
  let maxX = x0;
  let maxY = y0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (source.data[(y * source.width + x) * 4 + 3] <= 20) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error(`cell ${index} has no visible subject`);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function sample(rect, outW, outH, opaque = false) {
  const out = new PNG({ width: outW, height: outH });
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx0 = rect.x + Math.floor((ox * rect.w) / outW);
      const sx1 = Math.min(rect.x + rect.w - 1, rect.x + Math.floor(((ox + 1) * rect.w) / outW));
      const sy0 = rect.y + Math.floor((oy * rect.h) / outH);
      const sy1 = Math.min(rect.y + rect.h - 1, rect.y + Math.floor(((oy + 1) * rect.h) / outH));
      let pr = 0;
      let pg = 0;
      let pb = 0;
      let alpha = 0;
      let count = 0;
      for (let sy = sy0; sy <= sy1; sy++) {
        for (let sx = sx0; sx <= sx1; sx++) {
          const si = (sy * source.width + sx) * 4;
          const a = source.data[si + 3];
          pr += source.data[si] * a;
          pg += source.data[si + 1] * a;
          pb += source.data[si + 2] * a;
          alpha += a;
          count++;
        }
      }
      const di = (oy * outW + ox) * 4;
      if (alpha > 0) {
        out.data[di] = Math.round(pr / alpha);
        out.data[di + 1] = Math.round(pg / alpha);
        out.data[di + 2] = Math.round(pb / alpha);
        out.data[di + 3] = opaque ? 255 : Math.round(alpha / Math.max(1, count));
      } else if (opaque) {
        // A true tile must never expose the transparent world clear color.
        out.data[di] = 38;
        out.data[di + 1] = 42;
        out.data[di + 2] = 46;
        out.data[di + 3] = 255;
      }
    }
  }
  return out;
}

function blit(from, to, dx, dy) {
  for (let y = 0; y < from.height; y++) {
    for (let x = 0; x < from.width; x++) {
      const si = (y * from.width + x) * 4;
      const di = ((dy + y) * to.width + dx + x) * 4;
      from.data.copy(to.data, di, si, si + 4);
    }
  }
}

function writeDoor(index, name) {
  const rect = cell(index);
  const scale = Math.min(72 / rect.w, 106 / rect.h);
  const w = Math.max(1, Math.round(rect.w * scale));
  const h = Math.max(1, Math.round(rect.h * scale));
  const normalized = new PNG({ width: DOOR_W, height: DOOR_H });
  blit(sample(rect, w, h), normalized, Math.round((DOOR_W - w) / 2), DOOR_H - h - 2);
  fs.writeFileSync(path.join(PROP_DIR, `${name}.png`), PNG.sync.write(normalized));
}

function writeProp(index, name, target = 256) {
  const rect = cell(index);
  const scale = Math.min(1, target / Math.max(rect.w, rect.h));
  const w = Math.max(1, Math.round(rect.w * scale));
  const h = Math.max(1, Math.round(rect.h * scale));
  fs.writeFileSync(path.join(PROP_DIR, `${name}.png`), PNG.sync.write(sample(rect, w, h)));
}

writeDoor(0, 'door_hotel');
writeDoor(1, 'door_hardware');
writeDoor(2, 'door_hospital');
writeProp(3, 'cave_root_arch');
writeProp(4, 'cave_mushroom_cluster');
writeDoor(5, 'door_hotel_open');
writeDoor(6, 'door_hardware_open');
writeDoor(7, 'door_hospital_open');

const tileStrip = new PNG({ width: 128, height: 64 });
blit(sample(cell(8), 64, 64, true), tileStrip, 0, 0);
blit(sample(cell(9), 64, 64, true), tileStrip, 64, 0);
fs.writeFileSync(TILE_OUT, PNG.sync.write(tileStrip));

console.log('wrote 6 venue doors, 2 cave props, and assets/art/world/OakCave_tiles_16.png');
