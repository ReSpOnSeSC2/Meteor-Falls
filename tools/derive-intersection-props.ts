/**
 * tools/derive-intersection-props.ts — the EB INTERSECTION KIT's two upright
 * props: traffic_light (the Onett yellow gooseneck) and stop_sign. Drawn as
 * flat palette-ramp fills with INK outlines against the banked EarthBound
 * reference (assets/art/masters/reference/earthbound/
 * eb-onett-street-kit-terracing.png) — interim production props until the
 * Batch-B ChatGPT renders replace the PNGs (docs/DOWNTOWN_OTTERBROOKE_REBUILD.md).
 * Deterministic; overwrites its outputs.
 *
 *   npx tsx tools/derive-intersection-props.ts
 */
import * as fs from 'fs';
import { encodePng, type Img } from './imageio';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = `${ROOT}assets/art/world/props/`;

// palette.ts anchors (INK/GOLD/RED/PAPER/GRASS/FOREST ramps)
const INK = [26, 16, 36];
const INK_SOFT = [54, 40, 74];
const GOLD_DK = [140, 92, 8];
const GOLD = [196, 144, 28];
const GOLD_LT = [240, 200, 52];
const RED_DK = [124, 28, 44];
const RED = [180, 48, 56];
const RED_LT = [236, 84, 72];
const PAPER = [252, 248, 232];
const LAMP_RED = [236, 84, 72];
const LAMP_AMBER = [240, 200, 52];
const LAMP_GREEN = [68, 148, 84];
const LAMP_OFF = [86, 74, 112];

function img(w: number, h: number): Img {
  return { w, h, data: new Uint8Array(w * h * 4) };
}
function put(im: Img, x: number, y: number, rgb: number[]): void {
  if (x < 0 || y < 0 || x >= im.w || y >= im.h) return;
  const d = (y * im.w + x) * 4;
  im.data[d] = rgb[0];
  im.data[d + 1] = rgb[1];
  im.data[d + 2] = rgb[2];
  im.data[d + 3] = 255;
}
function rect(im: Img, x0: number, y0: number, w: number, h: number, rgb: number[]): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(im, x, y, rgb);
}
/** 1px INK outline around every opaque region (reads on any ground) */
function outline(im: Img): void {
  const solid = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < im.w && y < im.h && im.data[(y * im.w + x) * 4 + 3] !== 0;
  const edges: Array<[number, number]> = [];
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++)
      if (!solid(x, y) && (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)))
        edges.push([x, y]);
  for (const [x, y] of edges) put(im, x, y, INK);
}

/* ---------------- traffic light: the Onett yellow gooseneck ---------------- */
// 112x384 (displays at native 14x48 via AUTHORED_WORLD_PROP_DISPLAY_SIZE)
{
  const t = img(112, 384);
  // pole (gold, lit left edge, shaded right)
  rect(t, 44, 56, 20, 304, GOLD);
  rect(t, 44, 56, 6, 304, GOLD_LT);
  rect(t, 58, 56, 6, 304, GOLD_DK);
  // base flare + foot plate
  rect(t, 36, 344, 36, 16, GOLD);
  rect(t, 36, 344, 8, 16, GOLD_LT);
  rect(t, 28, 358, 52, 12, GOLD_DK);
  // gooseneck arm: up from the pole top, arcing right
  rect(t, 44, 40, 44, 16, GOLD);
  rect(t, 44, 40, 44, 5, GOLD_LT);
  rect(t, 80, 40, 12, 28, GOLD);
  // signal head hanging from the arm's end: dark box + hood + 3 lamps
  rect(t, 64, 64, 44, 116, INK_SOFT);
  rect(t, 60, 58, 52, 12, INK_SOFT); // hood
  const lampX = 76;
  const lamps = [LAMP_RED, LAMP_AMBER, LAMP_GREEN];
  lamps.forEach((c, i) => {
    const cy = 86 + i * 34;
    for (let y = -10; y <= 10; y++)
      for (let x = -10; x <= 10; x++)
        if (x * x + y * y <= 100) put(t, lampX + 10 + x, cy + y, i === 2 ? c : i === 0 ? c : LAMP_OFF);
    // small glint on the lit lamps
    put(t, lampX + 4, cy - 5, PAPER);
    put(t, lampX + 5, cy - 5, PAPER);
  });
  outline(t);
  fs.writeFileSync(`${DIR}traffic_light.png`, encodePng(t));
  console.log('traffic_light.png 112x384');
}

/* ------------------------------ stop sign ------------------------------ */
// 104x224 (displays at native 13x28)
{
  const s = img(104, 224);
  // pole
  rect(s, 46, 96, 12, 108, [148, 140, 156]);
  rect(s, 46, 96, 4, 108, [200, 194, 208]);
  rect(s, 42, 198, 20, 10, [98, 92, 112]);
  // octagon: rows with insets
  const W = 96;
  const H = 96;
  const X0 = 4;
  const Y0 = 4;
  const CUT = 28;
  for (let y = 0; y < H; y++) {
    let inset = 0;
    if (y < CUT) inset = CUT - y;
    else if (y >= H - CUT) inset = y - (H - CUT) + 1;
    for (let x = X0 + inset; x < X0 + W - inset; x++) put(s, x, Y0 + y, RED);
  }
  // lit top-left facet + dark bottom-right facet
  for (let y = 0; y < 10; y++) for (let x = X0 + Math.max(0, CUT - (y + 0)); x < X0 + W - CUT; x++) put(s, x, Y0 + y, RED_LT);
  for (let y = H - 8; y < H; y++)
    for (let x = X0 + Math.max(0, y - (H - CUT) + 1); x < X0 + W - Math.max(0, y - (H - CUT) + 1); x++)
      put(s, x, Y0 + y, RED_DK);
  // white border ring (simple inset band)
  for (let y = 6; y < H - 6; y++) {
    let inset = 0;
    if (y < CUT) inset = CUT - y;
    else if (y >= H - CUT) inset = y - (H - CUT) + 1;
    put(s, X0 + inset + 3, Y0 + y, PAPER);
    put(s, X0 + inset + 4, Y0 + y, PAPER);
    put(s, X0 + W - inset - 4, Y0 + y, PAPER);
    put(s, X0 + W - inset - 5, Y0 + y, PAPER);
  }
  for (let x = X0 + CUT; x < X0 + W - CUT; x++) {
    put(s, x, Y0 + 7, PAPER);
    put(s, x, Y0 + 8, PAPER);
    put(s, x, Y0 + H - 8, PAPER);
    put(s, x, Y0 + H - 9, PAPER);
  }
  // STOP — 5x7 bitmaps, scaled x3 (letters 15x21), centered
  const FONT: Record<string, string[]> = {
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  };
  const SCALE = 3;
  const word = 'STOP';
  const wordW = word.length * 5 * SCALE + (word.length - 1) * SCALE;
  let cx = X0 + Math.round((W - wordW) / 2);
  const cy = Y0 + Math.round(H / 2) - Math.round((7 * SCALE) / 2);
  for (const ch of word) {
    const glyph = FONT[ch];
    for (let gy = 0; gy < 7; gy++)
      for (let gx = 0; gx < 5; gx++)
        if (glyph[gy][gx] === '1') rect(s, cx + gx * SCALE, cy + gy * SCALE, SCALE, SCALE, PAPER);
    cx += 6 * SCALE;
  }
  outline(s);
  fs.writeFileSync(`${DIR}stop_sign.png`, encodePng(s));
  console.log('stop_sign.png 104x224');
}
