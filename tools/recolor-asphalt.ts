/**
 * tools/recolor-asphalt.ts — lift the street out of the dark (EB Onett value pass).
 *
 * EarthBound's asphalt is a PALE, warm gray — close in value to the sidewalk —
 * so the whole street reads as one light plane and the outlines/sprites carry
 * the contrast. Ours shipped near-black (body lum ≈ 90), which turns every
 * downtown into a heavy charcoal cross that swallows the lane markings.
 *
 * SURGICAL: only the asphalt-family cells change in otterbrook_tiles_16.png;
 * every other column stays byte-identical. Writes a .bak first. Deterministic
 * (pure per-pixel remap, no RNG).
 *
 *   road / road_dash / road_dash_h / crosswalk — body → warm pale gray
 *     (lum 87-97 → ~150-170, texture variance amplified so the stipple
 *     survives the lift); yellow dashes and white bars are preserved.
 *   parking / road_patch — same lift, and the stray BLUE cast (avgRGB had
 *     b-r ≈ +38) is neutralized to the same warm asphalt family.
 *   storm_drain — the cream background is re-grounded onto the new asphalt
 *     tone (it sits in the carriageway); the dark grate is lifted slightly
 *     so it still reads against the paler road.
 *
 *   npx tsx tools/recolor-asphalt.ts
 */
import * as fs from 'fs';
import { decodePng, encodePng, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const idx = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`no tile ${name}`);
  return i;
};

const BAK = STRIP.replace(/\.png$/, '.pre-asphalt-recolor.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);
// IDEMPOTENT: always remap from the pre-recolor backup, then merge the result
// into the live strip — re-running never double-lifts the body values.
const strip: Img = decodePng(fs.readFileSync(STRIP));
const source: Img = decodePng(fs.readFileSync(BAK));
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != ${CELL}`);
if (source.w !== strip.w) throw new Error(`bak width ${source.w} != strip width ${strip.w} — refresh the .bak`);

const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
const lumOf = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

/** the EB warm-asphalt ramp: a luminance dressed in a slightly warm gray */
const warmAsphalt = (L: number): [number, number, number] => [clamp(L + 8), clamp(L + 4), clamp(L - 8)];

/** dark body (≈87-97) → pale (≈150-170), texture contrast amplified ×2 */
const liftBody = (L: number): number => Math.max(120, Math.min(200, 160 + (L - 92) * 2));

type PxRule = (r: number, g: number, b: number) => [number, number, number] | null; // null = keep

const asphaltRule: PxRule = (r, g, b) => {
  const L = lumOf(r, g, b);
  if (r - b > 60 && r > 120) return null; // yellow lane marking — keep
  if (L >= 180 && Math.abs(r - b) < 40) return null; // white bars / bright paint — keep
  return warmAsphalt(liftBody(L));
};

// crosswalk: the zebra bars must stay BRIGHT against the lifted body, so any
// paint-ish pixel (light, low chroma) is pushed to warm white instead of kept
// (bar edge pixels sat at lum 150-180 and washed out under the generic rule).
const crosswalkRule: PxRule = (r, g, b) => {
  const L = lumOf(r, g, b);
  if (r - b > 60 && r > 120) return null; // yellow paint — keep
  if (L >= 150 && Math.abs(r - b) < 40) {
    const W = Math.max(235, L);
    return [clamp(W + 8), clamp(W + 6), clamp(W - 4)];
  }
  return warmAsphalt(liftBody(L));
};

// parking + road_patch carry a blue cast: remap EVERY body pixel by luminance
// (which neutralizes the blue), keeping only genuinely bright warm markings.
const deblueRule: PxRule = (r, g, b) => {
  const L = lumOf(r, g, b);
  if (L >= 140 && b - r <= 15) return null; // the white bay lines
  return warmAsphalt(liftBody(L));
};

// storm drain: cream background sits in the carriageway → asphalt tone;
// the grate (dark) lifts a touch so contrast stays fair on the pale road.
const drainRule: PxRule = (r, g, b) => {
  const L = lumOf(r, g, b);
  if (L >= 150) return warmAsphalt(160 + (L - 195) * 0.5);
  return warmAsphalt(L + 26);
};

function recolorCell(cell: number, rule: PxRule): void {
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      const d = (y * strip.w + cell * CELL + x) * 4;
      const [r, g, b, a] = [source.data[d], source.data[d + 1], source.data[d + 2], source.data[d + 3]];
      const out = rule(r, g, b) ?? [r, g, b];
      strip.data[d] = out[0];
      strip.data[d + 1] = out[1];
      strip.data[d + 2] = out[2];
      strip.data[d + 3] = a;
    }
  }
}

const CELLS: Array<[string, PxRule]> = [
  ['road', asphaltRule],
  ['road_dash', asphaltRule],
  ['road_dash_h', asphaltRule],
  ['crosswalk', crosswalkRule],
  ['parking', deblueRule],
  ['road_patch', deblueRule],
  ['storm_drain', drainRule],
];

for (const [name, rule] of CELLS) recolorCell(idx(name), rule);

fs.writeFileSync(STRIP, encodePng(strip));
console.log(
  `recolored asphalt family: ${CELLS.map(([n]) => `${n}=${idx(n)}`).join(' ')} — backup: ${BAK.split(/[\\/]/).pop()}`,
);
