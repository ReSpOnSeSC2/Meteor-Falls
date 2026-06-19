/**
 * Recolor the RED cap/trim accents of an authored hoops athlete sheet to a new
 * hue, to spin a distinct (fully-animated) athlete from an existing one without
 * generating 39 new frames. Targets ONLY saturated red pixels (hue ≈ 0) and
 * protects the orange BALL (hue ≈ 20–30), tan skin, and the white kit.
 *
 *   node tools/recolor-athlete.js <src.png> <out.png> <targetHueDeg>
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [, , src, out, hueArg] = process.argv;
if (!src || !out || hueArg === undefined) {
  console.error('usage: node tools/recolor-athlete.js <src.png> <out.png> <targetHueDeg>');
  process.exit(1);
}
const targetH = Number(hueArg);

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2; const d = mx - mn;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hsl2rgb(h, s, l) {
  h /= 360; let r, g, b;
  if (!s) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const t = (x) => { if (x < 0) x += 1; if (x > 1) x -= 1; if (x < 1 / 6) return p + (q - p) * 6 * x; if (x < 1 / 2) return q; if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6; return p; };
    r = t(h + 1 / 3); g = t(h); b = t(h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const p = PNG.sync.read(fs.readFileSync(src));
let n = 0;
for (let i = 0; i < p.data.length; i += 4) {
  if (p.data[i + 3] < 8) continue;
  const [h, s, l] = rgb2hsl(p.data[i], p.data[i + 1], p.data[i + 2]);
  // red accents only: hue wraps near 0 (≤12 or ≥346), well-saturated, mid lightness.
  // the orange ball (hue ~20–30) and tan skin (~25–40, lower sat) are excluded.
  const isRed = ((h >= 346) || (h <= 12)) && s > 0.33 && l > 0.18 && l < 0.82;
  if (isRed) {
    const [r, g, b] = hsl2rgb(targetH, s, l);
    p.data[i] = r; p.data[i + 1] = g; p.data[i + 2] = b; n++;
  }
}
fs.writeFileSync(out, PNG.sync.write(p));
console.log(`recolored ${n} red px → hue ${targetH}  ${out}`);
