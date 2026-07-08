/**
 * tools/apply-sidewalk-curb.ts — bake a 2.5D EARTHBOUND sidewalk into the tile strip
 * (otterbrook_tiles_16.png). SURGICAL: only the 4 sidewalk cells change, every other
 * column stays byte-identical. Writes a .bak first. Deterministic.
 *
 *   sidewalk        (13) — flat raised slab: cream top, diagonal score grooves, soft bevel
 *   sidewalk_curb   (36) — road to the SOUTH: top surface + a tall dark CURB FACE on the bottom
 *   sidewalk_curb_e (37) — road to the EAST:  curb face on the right edge
 *   sidewalk_curb_w (38) — road to the WEST:  curb face on the left edge
 * The engine (OverworldScene.buildTiles) already swaps a road-adjacent `=` to the matching
 * curb variant, so the vertical curb face always faces the road → the walk reads as RAISED.
 *
 *   npx tsx tools/apply-sidewalk-curb.ts
 */
import * as fs from 'fs';
import { decodePng, encodePng, type Img } from './imageio';
import { TILESET } from '../src/spritegen/tiles';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STRIP = `${ROOT}assets/art/world/otterbrook_tiles_16.png`;
const CELL = 64;
const idx = (name: string): number => { const i = TILESET.findIndex((t) => t.name === name); if (i < 0) throw new Error(`no tile ${name}`); return i; };

const strip: Img = decodePng(fs.readFileSync(STRIP));
if (strip.h !== CELL) throw new Error(`strip height ${strip.h} != ${CELL}`);
const BAK = STRIP.replace(/\.png$/, '.pre-sidewalk-curb.bak.png');
if (!fs.existsSync(BAK)) fs.copyFileSync(STRIP, BAK);

// ---- palette (cream concrete + a real vertical curb face) ----
const TOP = [236, 232, 212];   // slab top (near light)
const TOP2 = [222, 217, 195];  // slab top (far)
const G_SH = [176, 168, 140];  // diagonal groove cut (bold, angled paving)
const G_HI = [252, 250, 234];  // groove lit lip (the raised edge beside the cut)
const LIP = [255, 253, 238];   // bright lit front edge at the top of the curb face
const FACE_T = [164, 154, 128]; // curb face, near top (in shade) — a clear step down from the slab
const FACE_B = [110, 102, 82];  // curb face, bottom
const FOOT = [64, 58, 46];      // hard contact shadow where curb meets road
const FACE = 21;                // curb-face thickness in px (of 64) — tall enough to read as raised

const lerp = (a: number[], b: number[], t: number, i: number): number => Math.round(a[i] + (b[i] - a[i]) * t);
const speck = (x: number, y: number): number => (((x * 71 + y * 131 + ((x ^ y) * 17)) % 19) - 9) * 0.6;
function put(cell: number, x: number, y: number, rgb: number[]): void {
  const d = (y * strip.w + cell * CELL + x) * 4;
  strip.data[d] = Math.max(0, Math.min(255, Math.round(rgb[0])));
  strip.data[d + 1] = Math.max(0, Math.min(255, Math.round(rgb[1])));
  strip.data[d + 2] = Math.max(0, Math.min(255, Math.round(rgb[2])));
  strip.data[d + 3] = 255;
}

// draw one sidewalk cell; curb ∈ 'none'|'s'|'e'|'w' (which edge drops to the road)
function drawSidewalk(cell: number, curb: 'none' | 's' | 'e' | 'w'): void {
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      // distance INTO the tile from the curb edge (how far along the vertical face we are)
      let faceDepth = -1; // -1 → top surface; 0..FACE-1 → curb face (0 = the lit lip)
      if (curb === 's') faceDepth = y - (CELL - FACE);
      else if (curb === 'e') faceDepth = x - (CELL - FACE);
      else if (curb === 'w') faceDepth = (FACE - 1) - x;
      if (faceDepth >= 0) {
        // ---- vertical CURB FACE ----
        if (faceDepth <= 1) { put(cell, x, y, LIP); continue; }         // 2px lit front edge (the raised lip)
        const t = (faceDepth - 2) / Math.max(1, FACE - 3);
        let rgb = [lerp(FACE_T, FACE_B, t, 0), lerp(FACE_T, FACE_B, t, 1), lerp(FACE_T, FACE_B, t, 2)];
        if (faceDepth >= FACE - 2) rgb = FOOT.slice();                  // 2px hard contact shadow at the road
        put(cell, x, y, rgb);
        continue;
      }
      // ---- top SLAB surface ----
      const t = y / (CELL - 1);
      let rgb = [lerp(TOP, TOP2, t, 0), lerp(TOP, TOP2, t, 1), lerp(TOP, TOP2, t, 2)];
      const s = speck(x, y); rgb = [rgb[0] + s, rgb[1] + s, rgb[2] + s];
      // BOLD '/' diagonal score grooves every 8px (seamless: 64 % 8 === 0) — a dark cut + a
      // bright raised lip beside it reads as angled 3D paving in the map's oblique projection.
      const diag = (x + y) % 8;
      if (diag === 0) rgb = G_SH.slice(); else if (diag === 1) rgb = G_HI.slice();
      // soft top/left highlight so even a flat slab reads slightly raised
      if (curb !== 's' && y === 0) rgb = LIP.slice();
      if (curb !== 'w' && x === 0) rgb = [rgb[0] + 12, rgb[1] + 12, rgb[2] + 10];
      put(cell, x, y, rgb);
    }
  }
}

drawSidewalk(idx('sidewalk'), 'none');
drawSidewalk(idx('sidewalk_curb'), 's');
drawSidewalk(idx('sidewalk_curb_e'), 'e');
drawSidewalk(idx('sidewalk_curb_w'), 'w');

fs.writeFileSync(STRIP, encodePng(strip));
console.log(`baked 3D sidewalk + curbs: sidewalk=${idx('sidewalk')} curb_s=${idx('sidewalk_curb')} curb_e=${idx('sidewalk_curb_e')} curb_w=${idx('sidewalk_curb_w')} (face ${FACE}px). backup: ${BAK.split(/[\\/]/).pop()}`);
