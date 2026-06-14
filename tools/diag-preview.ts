/**
 * DIAGONAL / 3D PREVIEW (proposal) — renders approval examples for the
 * "make it feel 3D" pass WITHOUT touching the shipping generators:
 *
 *   1. 8-direction CHARACTERS — the four new 3/4 diagonal facings, composited
 *      from the existing FRONT (a frontal eye + full shoulders) and SIDE (the
 *      nose bump + profile hairline) frames so the head reads as TURNED.
 *   2. OBLIQUE "3D" CARS — a from-scratch cabinet-projection car that shows the
 *      near flank, the front face, AND the roof top, beside the current flat
 *      side-elevation car for comparison.
 *
 *   npx vite-node tools/diag-preview.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAST, generateCharacterFrames, generateDiagFrames, FRAME_W, FRAME_H } from '../src/spritegen/characters';
import { Pixmap } from '../src/spritegen/pixmap';
import { drawTextInto } from '../src/spritegen/font';
import { drawVehicle } from '../src/spritegen/vehicles';
import { RAMP, px, C, T } from '../src/palette';
import { pixmapToPng } from './png';

function blit(dst: Pixmap, src: Pixmap, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== T) dst.set(dx + x, dy + y, c);
    }
}

/* ── 1. CHARACTER DIAGONALS via front+side composite ─────────────────────── */

// frame layout from generateCharacterFrames: down 0-3, left 4-7, right 8-11, up 12-15
const DOWN = [0, 1, 2, 3];
const RIGHT = [8, 9, 10, 11];
const UP = [12, 13, 14, 15];

function charBlock(id: string): Pixmap {
  const f = generateCharacterFrames(CAST[id]);
  const down = f[DOWN[0]];
  const right = f[RIGHT[0]];
  const up = f[UP[0]];
  const left = right.flipX();
  // generateDiagFrames order: downright[0..2], downleft[3..5], upright[6..8], upleft[9..11]
  const dg = generateDiagFrames(CAST[id]);
  const downright = dg[0];
  const downleft = dg[3];
  const upright = dg[6];
  const upleft = dg[9];

  // an 8-way compass row, stand pose: the existing four cardinals interleaved
  // with the four NEW diagonals (marked *), so the turn reads around the clock.
  const cell = FRAME_W + 16;
  const order = [up, upright, right, downright, down, downleft, left, upleft];
  const names = ['up', 'UP-R *', 'right', 'DN-R *', 'down', 'DN-L *', 'left', 'UP-L *'];
  const block = new Pixmap(cell * 8 + 4, FRAME_H + 12);
  order.forEach((pm, i) => {
    const isNew = names[i].includes('*');
    blit(block, pm, i * cell + (cell - FRAME_W) / 2, 1);
    drawTextInto(block, names[i], i * cell + 3, FRAME_H + 3, isNew ? px(RAMP.GOLD, 3) : px(RAMP.PAPER, 1));
  });
  return block;
}

/* ── 2. OBLIQUE "3D" CAR (cabinet projection) ────────────────────────────── */

const GLASS = px(RAMP.CYAN, 2);
const GLASS_D = px(RAMP.CYAN, 1);
const TIRE = px(RAMP.INK, 1);
const HUB = px(RAMP.PAPER, 1);
const CHROME = C.white;
const LAMP = px(RAMP.GOLD, 3);
const SHADOW = px(RAMP.INK, 1);

interface ObliqueOpts {
  len: number;     // flank length
  cabH: number;    // cabin height
  cabX0: number;   // cabin start (along the flank, from rear)
  cabX1: number;   // cabin end
  depth: number;   // oblique depth (the up-right extrusion length)
  tall?: boolean;
}

/**
 * Oblique "2.5D" car facing down-right via SILHOUETTE EXTRUSION: we draw the
 * clean side PROFILE (the near vertical face), then extrude its TOP and FRONT
 * edges up-right by `depth` — every top edge sweeps into the lit roof/hood
 * plane, every right edge into the shaded front plane. Because the depth band
 * follows the real contour, the roof bump and hood step come out automatically
 * clean (no hand-stacked parallelograms). Light from top-left: top = lite,
 * front = mid, near flank = body.
 */
function drawCarOblique(o: ObliqueOpts, ramp: number): Pixmap {
  const body = px(ramp, 2);
  const lite = px(ramp, 3);
  const mid = px(ramp, 1);
  const dark = px(ramp, 0);
  const d = o.depth;
  const beltY = o.tall ? 9 : 8;            // glass/body seam on the near face
  const floorY = beltY + (o.tall ? 7 : 6); // near-face bottom
  const ry = beltY - o.cabH;               // roof line (near face)

  // ── build the clean side PROFILE into a mask (which palette index, T = none) ──
  const pw = o.len + 2;
  const ph = floorY + 1;
  const prof = new Pixmap(pw, ph);
  const x0 = 1;
  const x1 = o.len;
  prof.rect(x0, beltY, x1 - x0 + 1, floorY - beltY, body);        // lower body
  prof.rect(o.cabX0, ry, o.cabX1 - o.cabX0, o.cabH + 1, body);    // cabin block
  prof.set(o.cabX1 - 1, ry, T); prof.set(o.cabX1, ry + 1, T);     // round the A-pillar
  prof.set(o.cabX0, ry, T);                                       // round the C-pillar
  prof.set(x1, beltY, T);                                         // round the nose top

  // ── extrude TOP edges (up-right → roof/hood, LIT) and RIGHT edges
  //    (→ front face, MID), drawn BEHIND the near face ──
  const out = new Pixmap(pw + d + 2, ph + d + 2);
  const OY = d + 1; // push the near face down so the top plane has room
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      if (prof.get(x, y) === T) continue;
      const top = prof.get(x, y - 1) === T;   // exposed to the sky → roof/hood
      const right = prof.get(x + 1, y) === T; // exposed to the front → nose face
      if (top) for (let k = 1; k <= d; k++) out.set(x + k, OY + y - k, lite);
      if (right) for (let k = 1; k <= d; k++) out.set(x + k, OY + y - k, k > d - 2 ? lite : mid);
    }
  }

  // ── the near face, over the extrusion ──
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const c = prof.get(x, y);
      if (c !== T) out.set(x, OY + y, c);
    }
  // near-face shading + glass
  out.hline(x0, OY + beltY, x1 - x0 + 1, lite);                   // belt highlight
  out.hline(x0, OY + floorY - 1, x1 - x0 + 1, dark);             // rocker shadow
  out.rect(o.cabX0 + 1, OY + ry + 1, o.cabX1 - o.cabX0 - 2, o.cabH - 1, GLASS);
  out.vline(Math.floor((o.cabX0 + o.cabX1) / 2), OY + ry + 1, o.cabH - 1, body); // B-pillar
  out.set(o.cabX1 - 1, OY + ry + 1, GLASS_D);

  // ── front-face details on the extruded nose (grille + headlight) ──
  out.rect(x1 + d - 2, OY + beltY + 1 - d, 2, 2, LAMP);           // headlight on the nose
  out.hline(x1 + 1, OY + floorY - 2 - 1, 2, CHROME);             // bumper corner

  // ── wheels: far pair (up-right, small) behind, near pair in front ──
  const wheelNear = (cx: number): void => {
    out.rect(cx, OY + floorY - 1, 6, 4, TIRE);
    out.set(cx, OY + floorY - 1, T); out.set(cx + 5, OY + floorY - 1, T);
    out.rect(cx + 2, OY + floorY, 2, 2, HUB);
  };
  const wheelFar = (cx: number): void => {
    out.rect(cx + d, OY + floorY - 1 - d, 5, 3, TIRE);
    out.set(cx + d + 2, OY + floorY - d, HUB);
  };
  wheelFar(x0 + 2); wheelFar(x1 - 8);
  wheelNear(x0 + 1); wheelNear(x1 - 9);

  out.shadowUnder(Math.floor(out.w / 2), out.h - 1, Math.floor(out.w / 2) - 2, SHADOW);
  out.outline(C.outline);
  // pure-light glints after the contour
  out.set(o.cabX0 + 2, OY + ry + 1, CHROME);                     // windshield glint
  out.set(o.cabX1 + d - 1, OY + ry - d + 1, lite);               // roof corner spark
  return out;
}

/* ── compose the sheets ──────────────────────────────────────────────────── */

mkdirSync('.shots', { recursive: true });

// CHARACTER sheet: three leads, each an 8-way compass row (new diagonals marked *)
const leads = ['rex', 'faye', 'milo'];
const charBlocks = leads.map((id) => ({ id, pm: charBlock(id) }));
const cw = Math.max(...charBlocks.map((b) => b.pm.w)) + 8;
const chH = charBlocks[0].pm.h + 12;
const charSheet = new Pixmap(cw + 8, charBlocks.length * chH + 16).fill(px(RAMP.GRASS, 2));
drawTextInto(charSheet, 'PROPOSAL A — 8-DIRECTION CHARACTERS (* = NEW DIAGONAL 3/4 FACINGS)', 6, 2, px(RAMP.INK, 0));
charBlocks.forEach((b, i) => {
  drawTextInto(charSheet, b.id.toUpperCase(), 6, 14 + i * chH, px(RAMP.RED, 1));
  blit(charSheet, b.pm, 6, 22 + i * chH);
});
writeFileSync('.shots/proposal_diagonals.png', pixmapToPng(charSheet, { scale: 5, bg: px(RAMP.GRASS, 2) }));

// HEAD CLOSE-UP: down vs down-right vs down-left, top 17 rows, for eye review
const HEADH = 17;
const zoom = new Pixmap((FRAME_W + 3) * 3 * leads.length + 4, HEADH + 4).fill(px(RAMP.NIGHT, 1));
leads.forEach((id, li) => {
  const f = generateCharacterFrames(CAST[id]);
  const dg = generateDiagFrames(CAST[id]);
  const heads = [f[DOWN[0]], dg[0], dg[3]]; // down, downright, downleft
  heads.forEach((pm, hi) => {
    const ox = (li * 3 + hi) * (FRAME_W + 3) + 2;
    for (let y = 0; y < HEADH; y++) for (let x = 0; x < FRAME_W; x++) { const c = pm.get(x, y); if (c !== T) zoom.set(ox + x, 2 + y, c); }
  });
});
writeFileSync('.shots/proposal_diag_heads.png', pixmapToPng(zoom, { scale: 12, bg: px(RAMP.NIGHT, 1) }));

// FULL-CAST robustness: every CAST id, down-right stand, to catch any build/
// hairstyle/hat/glasses that the diagonal generator breaks on.
const allIds = Object.keys(CAST);
const cols = 12;
const ccell = FRAME_W + 4;
const crows = Math.ceil(allIds.length / cols);
const castSheet = new Pixmap(cols * ccell + 4, crows * (FRAME_H + 10) + 4).fill(px(RAMP.GRASS, 2));
allIds.forEach((id, i) => {
  const dr = generateDiagFrames(CAST[id])[0]; // down-right stand
  const ox = (i % cols) * ccell + 2;
  const oy = Math.floor(i / cols) * (FRAME_H + 10) + 2;
  blit(castSheet, dr, ox, oy);
  drawTextInto(castSheet, id.slice(0, 6), ox, oy + FRAME_H + 1, px(RAMP.INK, 0));
});
writeFileSync('.shots/proposal_diag_cast.png', pixmapToPng(castSheet, { scale: 4, bg: px(RAMP.GRASS, 2) }));
console.log(`cast diagonal sheet: ${allIds.length} ids`);

// CAR sheet: current flat car (top) vs oblique 3D car (bottom), three paints
const paints = [RAMP.RED, RAMP.BLUE, RAMP.GOLD];
const flat = paints.map((r) => drawVehicle(`veh_sedan_${({ [RAMP.RED]: 'red', [RAMP.BLUE]: 'blue', [RAMP.GOLD]: 'gold' } as Record<number, string>)[r]}`));
const obl = paints.map((r) => drawCarOblique({ len: 30, cabH: 6, cabX0: 9, cabX1: 22, depth: 5 }, r));
const carRowH = 30;
const carSheet = new Pixmap(360, carRowH * 2 + 40).fill(px(RAMP.EARTH, 1));
drawTextInto(carSheet, 'PROPOSAL B — CARS: CURRENT (FLAT SIDE) vs OBLIQUE 3D', 6, 2, px(RAMP.PAPER, 3));
drawTextInto(carSheet, 'NOW:', 6, 16, px(RAMP.PAPER, 2));
let cx = 60;
flat.forEach((pm) => { blit(carSheet, pm, cx, 14 + (carRowH - pm.h)); cx += pm.w + 12; });
drawTextInto(carSheet, 'NEW:', 6, 16 + carRowH, px(RAMP.GOLD, 3));
cx = 60;
obl.forEach((pm) => { blit(carSheet, pm, cx, 14 + carRowH + (carRowH - pm.h)); cx += pm.w + 12; });
writeFileSync('.shots/proposal_cars3d.png', pixmapToPng(carSheet, { scale: 5, bg: px(RAMP.EARTH, 1) }));

console.log('wrote .shots/proposal_diagonals.png and .shots/proposal_cars3d.png');
