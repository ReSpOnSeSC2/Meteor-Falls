// tools/montage-frames.cjs — tile loose 96x128 (or any same-size) frame PNGs
// horizontally with gaps onto a light-gray background, for quick visual review.
// Usage: node tools/montage-frames.cjs out.png frameA.png frameB.png ...
const { PNG } = require('pngjs');
const fs = require('fs');

const [, , outPath, ...frames] = process.argv;
if (!outPath || frames.length === 0) {
  console.error('usage: node tools/montage-frames.cjs out.png frame1.png [frame2.png ...]');
  process.exit(1);
}
const imgs = frames.map((f) => PNG.sync.read(fs.readFileSync(f)));
const FW = Math.max(...imgs.map((i) => i.width));
const FH = Math.max(...imgs.map((i) => i.height));
const gap = 8;
const N = imgs.length;
const o = new PNG({ width: FW * N + gap * (N - 1), height: FH });
for (let i = 0; i < o.width * o.height; i++) {
  o.data[i * 4] = 190;
  o.data[i * 4 + 1] = 190;
  o.data[i * 4 + 2] = 190;
  o.data[i * 4 + 3] = 255;
}
imgs.forEach((f, k) => {
  const ox = k * (FW + gap);
  for (let y = 0; y < f.height; y++)
    for (let x = 0; x < f.width; x++) {
      const si = (y * f.width + x) * 4;
      const a = f.data[si + 3] / 255;
      const di = (y * o.width + (ox + x)) * 4;
      for (let c = 0; c < 3; c++) o.data[di + c] = Math.round(f.data[si + c] * a + o.data[di + c] * (1 - a));
    }
});
fs.writeFileSync(outPath, PNG.sync.write(o));
console.log('montage', o.width + 'x' + o.height, '<-', frames.length, 'frames');
