/**
 * SPIKE — NOT wired into the game. "What is the procedural engine's CEILING?"
 *
 * The shipping engine renders heroes at 24×32 on a locked 96-colour palette,
 * flat-shaded — the deliberate 1994-EarthBound look. The reference rotation art
 * is ~32×60 with ~1,300 anti-aliased colours. This script answers: if we
 * OVERHAULED spritegen, how close could code-generated art realistically get?
 *
 * Techniques an overhaul would adopt, all demoed here on one hero (Jay, front):
 *   - a much bigger grid (120×180 here)
 *   - FREE RGB colour with smooth multi-stop gradient shading (volume, not slabs)
 *   - 4× SUPERSAMPLED anti-aliasing (draw at 4×, box-downsample → smooth edges)
 *   - slimmer ~1:4.5 proportions instead of chibi 1:2.5
 *   - a real face: eyes w/ iris + pupil + catchlight, brows, nose shadow, mouth
 *
 *   npx vite-node tools/proto-hero.ts   →   .shots/proto_jay.png
 *
 * This is the honest best-case: clearly a lift over 24×32, and still below a
 * human/AI artist's hand. That trade is the whole point of showing it.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { encodePng } from './png';

const SS = 4;
const FW = 120;
const FH = 180;
const W = FW * SS;
const H = FH * SS;
const buf = new Float32Array(W * H * 4); // straight-alpha RGBA, 0..1

type RGB = [number, number, number];
const n = (c: RGB): RGB => [c[0] / 255, c[1] / 255, c[2] / 255];

// materials: [shadow, base, highlight] in 0..255 → normalized
interface Mat { sh: RGB; base: RGB; hi: RGB; }
const M = (sh: RGB, base: RGB, hi: RGB): Mat => ({ sh: n(sh), base: n(base), hi: n(hi) });
const skin = M([176, 104, 70], [240, 176, 128], [255, 226, 184]);
const hair = M([30, 22, 40], [58, 44, 74], [104, 86, 124]);
const capR = M([132, 28, 40], [214, 52, 56], [252, 130, 104]);
const shirt = M([176, 134, 38], [242, 200, 72], [255, 236, 150]);
const strp = M([150, 70, 28], [212, 116, 40], [246, 170, 78]);
const ovr = M([34, 46, 108], [56, 92, 190], [116, 150, 228]);
const shoe = M([86, 40, 24], [156, 74, 44], [212, 112, 78]);
const white: RGB = n([250, 248, 238]);
const dark: RGB = n([34, 24, 42]);

function smooth(t: number): number { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
function mix(a: RGB, b: RGB, t: number): RGB { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
/** 3-stop ramp lookup, u=0 shadow … 0.5 base … 1 highlight */
function shade(m: Mat, u: number): RGB { return u < 0.5 ? mix(m.sh, m.base, smooth(u * 2)) : mix(m.base, m.hi, smooth((u - 0.5) * 2)); }
/** light from the upper-left: returns u in 0..1 from a shape-local normal */
function lightU(nx: number, ny: number): number { return Math.max(0, Math.min(1, 0.52 - 0.5 * (nx + ny) / Math.SQRT2)); }

function comp(x: number, y: number, c: RGB, a: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  const i = (y * W + x) * 4;
  const da = buf[i + 3];
  const oa = a + da * (1 - a);
  if (oa <= 0) return;
  const k = da * (1 - a);
  buf[i] = (c[0] * a + buf[i] * k) / oa;
  buf[i + 1] = (c[1] * a + buf[i + 1] * k) / oa;
  buf[i + 2] = (c[2] * a + buf[i + 2] * k) / oa;
  buf[i + 3] = oa;
}

// all draw coords below are FINAL pixels; s() scales to the supersample grid
const s = (v: number): number => v * SS;

function ellipse(cx: number, cy: number, rx: number, ry: number, m: Mat, opt?: { uBias?: number; flatTop?: boolean }): void {
  cx = s(cx); cy = s(cy); rx = s(rx); ry = s(ry);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx; const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      if (opt?.flatTop && ny < -0.1) continue;
      comp(x, y, shade(m, lightU(nx, ny) + (opt?.uBias ?? 0)), 1);
    }
  }
}

/** capsule / rounded bar from (x0..x1) × (y0..y1), corner radius r */
function bar(x0: number, y0: number, x1: number, y1: number, r: number, m: Mat, uBias = 0): void {
  const X0 = s(x0); const Y0 = s(y0); const X1 = s(x1); const Y1 = s(y1); const R = s(r);
  const cw = (X1 - X0) / 2; const ch = (Y1 - Y0) / 2; const mx = (X0 + X1) / 2; const my = (Y0 + Y1) / 2;
  for (let y = Math.floor(Y0); y <= Math.ceil(Y1); y++) {
    for (let x = Math.floor(X0); x <= Math.ceil(X1); x++) {
      const dx = Math.abs(x - mx) - (cw - R); const dy = Math.abs(y - my) - (ch - R);
      const d = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
      if (d > R) continue;
      const nx = (x - mx) / cw; const ny = (y - my) / ch;
      comp(x, y, shade(m, lightU(nx, ny) + uBias), 1);
    }
  }
}

/** soft dark seam/AO stroke between layers (low-alpha, blurred by SS) */
function seam(x0: number, y0: number, x1: number, y1: number, a = 0.28): void {
  const X0 = s(x0); const Y0 = s(y0); const X1 = s(x1); const Y1 = s(y1);
  const steps = Math.ceil(Math.hypot(X1 - X0, Y1 - Y0));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(X0 + (X1 - X0) * (i / steps)); const y = Math.round(Y0 + (Y1 - Y0) * (i / steps));
    for (let oy = -SS; oy <= SS; oy++) for (let ox = -SS; ox <= SS; ox++) {
      const w = 1 - Math.hypot(ox, oy) / (SS + 1); if (w > 0) comp(x + ox, y + oy, dark, a * w);
    }
  }
}

function dot(cx: number, cy: number, r: number, c: RGB, a = 1): void {
  const CX = s(cx); const CY = s(cy); const R = s(r);
  for (let y = Math.floor(CY - R); y <= Math.ceil(CY + R); y++)
    for (let x = Math.floor(CX - R); x <= Math.ceil(CX + R); x++)
      if (Math.hypot(x - CX, y - CY) <= R) comp(x, y, c, a);
}

/* ---- compose Jay, back to front (chunky-kid ~1:2.5 proportions) -------- */
function ellipseShadow(cx: number, cy: number, rx: number, ry: number, a: number): void {
  const CX = s(cx); const CY = s(cy); const RX = s(rx); const RY = s(ry);
  for (let y = Math.floor(CY - RY); y <= Math.ceil(CY + RY); y++)
    for (let x = Math.floor(CX - RX); x <= Math.ceil(CX + RX); x++) {
      const nx = (x - CX) / RX; const ny = (y - CY) / RY; if (nx * nx + ny * ny <= 1) comp(x, y, dark, a);
    }
}
// soft ground shadow
for (let i = 0; i < 3; i++) ellipseShadow(60, 166 - i, 27 - i * 4, 6 - i, 0.14);

// legs (short, chunky denim) + rounded shoes
bar(46, 112, 58, 150, 7, ovr);
bar(62, 112, 74, 150, 7, ovr, 0.05);
seam(60, 116, 60, 150, 0.3); // gap between legs
ellipse(51, 156, 10, 8, shoe, { uBias: 0.05 });
ellipse(69, 156, 10, 8, shoe);
bar(43, 154, 59, 164, 4, shoe); // toe
bar(61, 154, 77, 164, 4, shoe, 0.04);
seam(46, 150, 56, 150, 0.16); seam(64, 150, 74, 150, 0.16); // ankle line

// torso — slimmer yellow striped tee (waist narrower than the shoulders)
bar(43, 66, 77, 114, 13, shirt);
bar(43, 86, 77, 95, 5, strp); // ringer stripe
seam(45, 113, 75, 113, 0.16);

// overall bib + straps (denim over the shirt)
bar(49, 92, 71, 116, 6, ovr, 0.04);
bar(51, 68, 57, 96, 3.2, ovr); // left strap
bar(63, 68, 69, 96, 3.2, ovr, 0.05); // right strap
dot(54, 94, 1.5, shade(shirt, 0.95)); // brass buttons
dot(66, 94, 1.5, shade(shirt, 0.8));

// arms — slim short sleeves, skin forearms, round hands (held close in)
bar(33, 68, 44, 90, 6, shirt); // L sleeve
bar(76, 68, 87, 90, 6, shirt, 0.05); // R sleeve
bar(33, 88, 43, 112, 5, skin); // L forearm
bar(77, 88, 87, 112, 5, skin, 0.05); // R forearm
dot(37, 114, 5, shade(skin, 0.5)); dot(83, 114, 5, shade(skin, 0.42)); // hands
seam(44, 70, 44, 88, 0.18); seam(76, 70, 76, 88, 0.18);

// neck
bar(53, 60, 67, 70, 4, skin, -0.08);
seam(54, 62, 66, 62, 0.2);

// head — big round kid head
ellipse(60, 44, 22, 23, skin);

// hair: fringe peeking under the brim + a little at the nape
bar(44, 44, 76, 49, 4, hair);
ellipse(41, 50, 4, 9, hair); ellipse(79, 50, 4, 9, hair, { uBias: -0.05 });

// cap — red dome + forward brim, button on top
ellipse(60, 31, 24, 17, capR);
dot(60, 15, 2.6, shade(capR, 0.95));
ellipse(60, 41, 21, 5.5, capR, { uBias: 0.05 }); // brim over the brow
seam(42, 45, 78, 45, 0.2); // brim shadow on the forehead

/* ---- face -------------------------------------------------------------- */
// eyes: sclera, brown iris, dark pupil, catchlight (the EarthBound-kid big eye)
for (const ex of [52, 68]) {
  ellipse(ex, 52, 4.2, 5.2, M([208, 202, 192], [248, 246, 238], [255, 255, 252]));
  dot(ex + 0.4, 52.8, 2.8, n([80, 56, 38]));
  dot(ex + 0.6, 53.2, 1.7, n([26, 18, 26]));
  dot(ex - 0.7, 51, 1.0, white, 0.95); // catchlight
}
// brows
seam(47, 46, 56, 45.5, 0.32); seam(64, 45.5, 73, 46, 0.32);
// nose + mouth
seam(60, 56, 60, 58, 0.15);
seam(55, 62, 65, 62, 0.3);
// cheeks
dot(48, 59, 3.5, n([240, 150, 130]), 0.2); dot(72, 59, 3.5, n([240, 150, 130]), 0.2);

/* ---- downsample SS→FINAL (premultiplied average) + write --------------- */
const out = new Uint8Array(FW * FH * 4);
for (let fy = 0; fy < FH; fy++) {
  for (let fx = 0; fx < FW; fx++) {
    let sr = 0; let sg = 0; let sb = 0; let sa = 0;
    for (let oy = 0; oy < SS; oy++) for (let ox = 0; ox < SS; ox++) {
      const i = ((fy * SS + oy) * W + (fx * SS + ox)) * 4; const a = buf[i + 3];
      sr += buf[i] * a; sg += buf[i + 1] * a; sb += buf[i + 2] * a; sa += a;
    }
    const o = (fy * FW + fx) * 4; const aa = sa / (SS * SS);
    out[o] = sa > 0 ? Math.round((sr / sa) * 255) : 0;
    out[o + 1] = sa > 0 ? Math.round((sg / sa) * 255) : 0;
    out[o + 2] = sa > 0 ? Math.round((sb / sa) * 255) : 0;
    out[o + 3] = Math.round(aa * 255);
  }
}
mkdirSync('.shots', { recursive: true });
writeFileSync('.shots/proto_jay.png', encodePng(FW, FH, out));
console.log('wrote .shots/proto_jay.png (120×180, RGB+AA spike)');
