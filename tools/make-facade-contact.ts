import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { decodePng, encodePng, makeImg, type Img } from './imageio';

const names = process.argv.slice(3);
const outPath = process.argv[2] ?? '.tmp/facade-contact.png';
if (!names.length) throw new Error('usage: vite-node tools/make-facade-contact.ts <out.png> <facade...>');

const imgs = names.map((name) => ({
  name,
  img: decodePng(readFileSync(join('assets/art/world/facades', `${name}.png`))),
}));

const cols = 5;
const cellW = Math.max(...imgs.map(({ img }) => img.w)) + 20;
const cellH = Math.max(...imgs.map(({ img }) => img.h)) + 20;
const rows = Math.ceil(imgs.length / cols);
const out = makeImg(cols * cellW, rows * cellH);

function blit(dst: Img, src: Img, dx0: number, dy0: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const so = (y * src.w + x) * 4;
      if (src.data[so + 3] === 0) continue;
      const do2 = ((dy0 + y) * dst.w + dx0 + x) * 4;
      dst.data[do2] = src.data[so];
      dst.data[do2 + 1] = src.data[so + 1];
      dst.data[do2 + 2] = src.data[so + 2];
      dst.data[do2 + 3] = src.data[so + 3];
    }
  }
}

imgs.forEach(({ img }, i) => {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const dx = col * cellW + Math.floor((cellW - img.w) / 2);
  const dy = row * cellH + cellH - img.h - 10;
  blit(out, img, dx, dy);
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, encodePng(out));
console.log(`${outPath} ${out.w}x${out.h}`);
