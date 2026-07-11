/**
 * tools/apply-curb-kit.ts — grow the authored strip with the EB CURB KIT
 * (the 16-mask sidewalk→street step family + 3 crosswalk curb-cut ramps
 * registered at CURB_BASE in src/spritegen/tiles.ts).
 *
 * DERIVED, not painted fresh: every cell's slab TOP is copied pixel-for-pixel
 * from the authored 'sidewalk' cell, so the family can never drift from the
 * base pavement art (the old sidewalk_curb trio was baked against an earlier
 * sidewalk and shows a tone seam). Faces reuse the tuned apply-sidewalk-curb
 * palette; the FOOT contact line reads as EarthBound's dark curb line against
 * the recolored pale asphalt (tools/recolor-asphalt.ts).
 *
 * Mask convention (matches OverworldScene.buildTiles): bit 1=N, 2=E, 4=S, 8=W
 * set where the CARRIAGEWAY borders the slab.
 *   S/E/W bits — a tall vertical curb face on that edge (lip → shade → foot).
 *   N bit — the step faces away from the camera in the oblique view, so it
 *   renders as a thin shadowed lip along the top edge, not a face.
 *   curb_cut_s/e/w — FLUSH ramps for crosswalk edges: dark score line + a
 *   short blend down to the asphalt tone, no face (EB drops the curb at
 *   crossings).
 *
 * SURGICAL + IDEMPOTENT: only the CURB_BASE..(+18) columns are (re)written,
 * sourcing the slab from the CURRENT authored sidewalk cell; a .bak of the
 * pre-kit strip is written once. Deterministic (no RNG).
 *
 *   npx tsx tools/apply-curb-kit.ts
 */
import * as fs from 'fs';
import { decodePng, encodePng, type Img } from './imageio';
import { TILESET, CURB_BASE } from '../src/spritegen/tiles';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const idx = (name: string): number => {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`no tile ${name}`);
  return i;
};

const old: Img = decodePng(fs.readFileSync(STRIP));
if (old.h !== CELL) throw new Error(`strip height ${old.h} != ${CELL}`);
const BAK = STRIP.replace(/\.png$/, '.pre-curb-kit.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

// grow to the registry width (the size-pin law: strip.w === TILESET.length*64)
const W = TILESET.length * CELL;
const strip: Img = { w: W, h: CELL, data: new Uint8Array(W * CELL * 4) };
for (let y = 0; y < CELL; y++) {
  strip.data.set(old.data.subarray(y * old.w * 4, y * old.w * 4 + old.w * 4), y * W * 4);
}

// ---- palette (faces from apply-sidewalk-curb; asphalt tone from recolor-asphalt) ----
const LIP = [255, 253, 238]; // lit front edge at the top of a face
const FACE_T = [164, 154, 128]; // face, near top (in shade)
const FACE_B = [110, 102, 82]; // face, bottom
const FOOT = [64, 58, 46]; // hard contact line where curb meets road
const N_EDGE = [150, 142, 118]; // the away-facing top lip (shadowed, no face)
const N_EDGE_DK = [110, 102, 82];
const RAMP_LINE = [150, 142, 118]; // curb-cut score line
const ASPHALT = [168, 164, 152]; // warmAsphalt(160) — the recolored road body
const FACE = 21; // face thickness in px (of 64) — matches the legacy trio

const lerp = (a: number[], b: number[], t: number, i: number): number => Math.round(a[i] + (b[i] - a[i]) * t);

const srcSidewalk = idx('sidewalk') * CELL;
function slabPx(x: number, y: number): [number, number, number, number] {
  const d = (y * strip.w + srcSidewalk + x) * 4;
  return [strip.data[d], strip.data[d + 1], strip.data[d + 2], strip.data[d + 3]];
}
function put(cell: number, x: number, y: number, rgb: number[]): void {
  const d = (y * strip.w + cell * CELL + x) * 4;
  strip.data[d] = Math.max(0, Math.min(255, Math.round(rgb[0])));
  strip.data[d + 1] = Math.max(0, Math.min(255, Math.round(rgb[1])));
  strip.data[d + 2] = Math.max(0, Math.min(255, Math.round(rgb[2])));
  strip.data[d + 3] = 255;
}

/** vertical face shading at depth 0..FACE-1 (0 = lit lip, FACE-1 = road foot) */
function facePx(depth: number): number[] {
  if (depth <= 1) return LIP;
  if (depth >= FACE - 2) return FOOT;
  const t = (depth - 2) / Math.max(1, FACE - 5);
  return [lerp(FACE_T, FACE_B, t, 0), lerp(FACE_T, FACE_B, t, 1), lerp(FACE_T, FACE_B, t, 2)];
}

function drawCurbCell(cell: number, mask: number): void {
  const n = (mask & 1) !== 0;
  const e = (mask & 2) !== 0;
  const s = (mask & 4) !== 0;
  const w = (mask & 8) !== 0;
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      // which face claims this pixel? S wins the bottom band; E/W the side
      // bands above it; N is a thin lip only.
      const sDepth = s ? y - (CELL - FACE) : -1;
      const eDepth = e ? x - (CELL - FACE) : -1;
      const wDepth = w ? FACE - 1 - x : -1;
      if (sDepth >= 0) {
        // the S face runs the full width; where an E/W face also lands here the
        // deeper of the two shades wins so the outer corner turns cleanly.
        const side = Math.max(eDepth, wDepth);
        put(cell, x, y, facePx(Math.max(sDepth, side)));
        continue;
      }
      if (eDepth >= 0 || wDepth >= 0) {
        put(cell, x, y, facePx(Math.max(eDepth, wDepth)));
        continue;
      }
      // slab top — copied from the authored sidewalk so tones always match
      const [r, g2, b, a] = slabPx(x, y);
      let rgb: number[] = [r, g2, b];
      if (a === 0) rgb = [r, g2, b];
      if (n && y === 0) rgb = N_EDGE_DK.slice();
      else if (n && y <= 2) rgb = N_EDGE.slice();
      put(cell, x, y, rgb);
    }
  }
}

/** flush crosswalk ramp on one edge: score line + short blend to asphalt */
function drawCutCell(cell: number, edge: 's' | 'e' | 'w'): void {
  const RAMP = 8;
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      let depth = -1;
      if (edge === 's') depth = y - (CELL - RAMP);
      else if (edge === 'e') depth = x - (CELL - RAMP);
      else depth = RAMP - 1 - x;
      if (depth >= 0) {
        if (depth <= 1) {
          put(cell, x, y, RAMP_LINE);
        } else {
          const t = (depth - 2) / Math.max(1, RAMP - 3);
          const [r, g2, b] = slabPx(x, y);
          put(cell, x, y, [lerp([r, g2, b], ASPHALT, t, 0), lerp([r, g2, b], ASPHALT, t, 1), lerp([r, g2, b], ASPHALT, t, 2)]);
        }
        continue;
      }
      const [r, g2, b] = slabPx(x, y);
      put(cell, x, y, [r, g2, b]);
    }
  }
}

for (let m = 1; m < 16; m++) drawCurbCell(idx(`curb_${m}`), m);
// curb_0 (no road neighbour — never emitted, but the column must exist): plain slab
drawCurbCell(idx('curb_0'), 0);
drawCutCell(idx('curb_cut_s'), 's');
drawCutCell(idx('curb_cut_e'), 'e');
drawCutCell(idx('curb_cut_w'), 'w');
// re-derive the LEGACY trio from the same slab so the old cells (still shown by
// the map editor and any straggler) stop carrying the pre-base-ground tone seam
drawCurbCell(idx('sidewalk_curb'), 4);
drawCurbCell(idx('sidewalk_curb_e'), 2);
drawCurbCell(idx('sidewalk_curb_w'), 8);

fs.writeFileSync(STRIP, encodePng(strip));

// mating proof: the family laid out around a fake road pocket for review
const P = 5 * CELL;
const proof: Img = { w: P, h: 3 * CELL, data: new Uint8Array(P * 3 * CELL * 4) };
const blit = (cellIdx: number, cx: number, cy: number): void => {
  for (let y = 0; y < CELL; y++) {
    const src = (y * strip.w + cellIdx * CELL) * 4;
    proof.data.set(strip.data.subarray(src, src + CELL * 4), ((cy * CELL + y) * P + cx * CELL) * 4);
  }
};
// a 3×3 sidewalk ring around one road cell (masks as buildTiles would emit)
blit(idx('curb_6'), 0, 0); blit(idx('curb_4'), 1, 0); blit(idx('curb_12'), 2, 0);
blit(idx('curb_2'), 0, 1); blit(idx('road'), 1, 1); blit(idx('curb_8'), 2, 1);
blit(idx('curb_3'), 0, 2); blit(idx('curb_1'), 1, 2); blit(idx('curb_9'), 2, 2);
// cuts + plain slab on a spare column
blit(idx('curb_cut_s'), 3, 0); blit(idx('curb_cut_e'), 3, 1); blit(idx('curb_cut_w'), 3, 2);
blit(idx('sidewalk'), 4, 0); blit(idx('road_dash'), 4, 1); blit(idx('crosswalk'), 4, 2);
fs.writeFileSync(`${ROOT}assets/art/review/curb-kit-proof.png`, encodePng(proof));

console.log(
  `curb kit installed: CURB_BASE=${CURB_BASE} cells curb_0..15 + 3 cuts + legacy trio re-derived. ` +
    `strip ${old.w}px -> ${W}px (${TILESET.length} tiles). proof: assets/art/review/curb-kit-proof.png`,
);
