// One-off: find each facade's DOOR horizontal center from its PNG, so door.ox
// (old ×1-era values) can be corrected to the hi-res art. The door is the dark,
// opaque, ground-reaching feature in the bottom band; we take the weighted center
// of dark+opaque mass there, then derive door.ox (native ×1 units, ART_SCALE=4).
import { PNG } from 'pngjs';
import fs from 'node:fs';

const ART = 4; // ART_SCALE (native ×1 → runtime px)
// current data: [key, door.ox, door.w]  (native ×1 units, from src/data/maps.ts)
const FACADES = [
  ['house_rex', 22, 14], // sanity: door is drawn LEFT-of-center, expect ~22
  ['drugstore', 33, 16],
  ['arcade', 17, 16],
  ['chapel', 17, 16],
];

for (const [key, curOx, doorW] of FACADES) {
  const png = PNG.sync.read(fs.readFileSync(`assets/art/world/facades/${key}.png`));
  const { width: W, height: H, data } = png;
  let bl = W, br = 0; // opaque horizontal bbox
  const y0 = Math.floor(H * 0.80), y1 = Math.floor(H * 0.97);
  const col = new Array(W).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, a = data[i + 3];
      if (a > 128) { if (x < bl) bl = x; if (x > br) br = x; }
      if (y >= y0 && y < y1 && a > 128) {
        const lum = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        if (lum < 90) col[x]++;
      }
    }
  }
  let num = 0, den = 0;
  for (let x = 0; x < W; x++) { num += x * col[x]; den += col[x]; }
  const doorCx = den ? Math.round(num / den) : Math.round((bl + br) / 2);
  // door.ox is measured from the facade's DRAWN left edge (bl); prop origin sits at bl≈0
  const suggestedOx = Math.round((doorCx - bl) / ART - doorW / 2);
  console.log(
    `${key.padEnd(11)} texW=${String(W).padStart(3)} bbox=[${bl},${br}] doorCx=${String(doorCx).padStart(3)}px  ` +
    `curOx=${String(curOx).padStart(2)} -> suggestOx=${String(suggestedOx).padStart(2)}  ` +
    `(curDoorCenter=${(bl + curOx * ART + doorW * ART / 2)}px)`
  );
}
