/**
 * COSTA ESTRELLA LINKS — diorama anchors + the sim→art projection (S13 art pass).
 *
 * The eighteen holes are AUTHORED as ¾-aerial illustrations (the dioramas in
 * `assets/art/minigames/golf/links_h*.png`). The DETERMINISTIC sim
 * (`links/sim.ts`) still plays in its own native tile-grid space (course.ts);
 * this module is the bridge that lets the scene draw the sim's ball/aim ON the
 * illustration without touching the physics.
 *
 * For each hole we record WHERE the tee and the cup sit on its illustration, as
 * NORMALIZED (0..1) image coordinates — eyeballed off the art. From those two
 * point-pairs (sim.tee↔art.tee, sim.pin↔art.cup) we build a 2D SIMILARITY
 * transform (rotation + uniform scale + translation). It sends the sim's
 * straight tee→pin axis onto the art's tee→cup diagonal, so a flushed shot
 * lands on the green by the flag and a push/pull deviates perpendicular to the
 * fairway exactly as the iso view reads. The transform is the ONLY thing the
 * renderer needs — zero sim changes, so every deterministic test stays green.
 *
 * This is PRESENTATION data: it is NOT part of the canon `HoleDef` (the schema
 * and content validators never see it). Tune the numbers by eye against the
 * PNGs; being a few percent off just nudges where the ball settles.
 */
import { s } from '../spritegen/scale';
import type { HoleDef } from './course';

export interface DioramaAnchors {
  /** the teeing ground on the illustration (normalized 0..1) — shot 1 starts here */
  tee: { x: number; y: number };
  /** the cup/flag base on the illustration (normalized 0..1) — good shots converge here */
  cup: { x: number; y: number };
}

/** A fallback for any hole missing an entry: tee low-centre, green high-centre. */
const DEFAULT_ANCHORS: DioramaAnchors = { tee: { x: 0.42, y: 0.84 }, cup: { x: 0.55, y: 0.26 } };

/**
 * Per-hole anchors, read off `links_h*.png`. tee = where the fairway starts
 * (near/low end); cup = the flag base (the green, far/high end). Holes that
 * dogleg (e.g. h12) point the axis across the art and the similarity transform
 * rotates the whole shot to suit.
 */
export const DIORAMA: Record<string, DioramaAnchors> = {
  h1: { tee: { x: 0.25, y: 0.84 }, cup: { x: 0.55, y: 0.3 } },
  h2: { tee: { x: 0.42, y: 0.84 }, cup: { x: 0.57, y: 0.24 } },
  h3: { tee: { x: 0.33, y: 0.84 }, cup: { x: 0.6, y: 0.22 } },
  h4: { tee: { x: 0.24, y: 0.8 }, cup: { x: 0.66, y: 0.24 } },
  h5: { tee: { x: 0.45, y: 0.84 }, cup: { x: 0.46, y: 0.24 } },
  h6: { tee: { x: 0.42, y: 0.84 }, cup: { x: 0.52, y: 0.22 } },
  h7: { tee: { x: 0.24, y: 0.8 }, cup: { x: 0.62, y: 0.26 } },
  h8: { tee: { x: 0.42, y: 0.84 }, cup: { x: 0.5, y: 0.24 } },
  h9: { tee: { x: 0.24, y: 0.8 }, cup: { x: 0.64, y: 0.28 } },
  h10: { tee: { x: 0.3, y: 0.82 }, cup: { x: 0.52, y: 0.3 } },
  h11: { tee: { x: 0.45, y: 0.84 }, cup: { x: 0.55, y: 0.24 } },
  h12: { tee: { x: 0.62, y: 0.82 }, cup: { x: 0.4, y: 0.26 } },
  h13: { tee: { x: 0.32, y: 0.84 }, cup: { x: 0.62, y: 0.2 } },
  h14: { tee: { x: 0.25, y: 0.8 }, cup: { x: 0.64, y: 0.26 } },
  h15: { tee: { x: 0.25, y: 0.8 }, cup: { x: 0.63, y: 0.22 } },
  h16: { tee: { x: 0.28, y: 0.78 }, cup: { x: 0.55, y: 0.26 } },
  h17: { tee: { x: 0.42, y: 0.82 }, cup: { x: 0.52, y: 0.24 } },
  h18: { tee: { x: 0.25, y: 0.8 }, cup: { x: 0.62, y: 0.28 } },
};

export function anchorsFor(holeId: string): DioramaAnchors {
  return DIORAMA[holeId] ?? DEFAULT_ANCHORS;
}

/** The projection for one hole: where its illustration is drawn + the sim→screen map. */
export interface HoleProjection {
  /** displayed illustration rect on screen (runtime px) */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** uniform fit factor: screen px per source px of the illustration */
  fit: number;
  /** similarity transform coefficients (complex ratio a+bi) + the anchor origins */
  a: number;
  b: number;
  stx: number;
  sty: number;
  dtx: number;
  dty: number;
  /** uniform scale of the sim→screen map (= |a+bi|), used to scale ball height/pop */
  scale: number;
}

export interface FitBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Lay the illustration into `box` and solve the similarity transform that maps
 * sim-space (RUNTIME px — the sim stores tee/pin as `s(native)`) onto it via the
 * tee/cup anchors.
 *
 * `cover` (default) scales the art to FILL the box (the hole becomes the whole
 * screen, immersive) and centres it on the tee↔cup midpoint so the playable
 * corridor stays framed, clamping so the oversized image always covers the box
 * (no gaps). `cover:false` is the old letterbox FIT (whole image visible).
 */
export function projectHole(hole: HoleDef, imgW: number, imgH: number, box: FitBox, cover = true): HoleProjection {
  const an = anchorsFor(hole.id);
  const fit = cover ? Math.max(box.w / imgW, box.h / imgH) : Math.min(box.w / imgW, box.h / imgH);
  const dw = imgW * fit;
  const dh = imgH * fit;
  let dx: number;
  let dy: number;
  if (cover) {
    // centre on the tee↔cup midpoint, then clamp so the image still fully covers
    const midX = (an.tee.x + an.cup.x) / 2;
    const midY = (an.tee.y + an.cup.y) / 2;
    dx = Math.min(box.x, Math.max(box.x + box.w - dw, box.x + box.w / 2 - midX * dw));
    dy = Math.min(box.y, Math.max(box.y + box.h - dh, box.y + box.h / 2 - midY * dh));
  } else {
    dx = box.x + (box.w - dw) / 2;
    dy = box.y + (box.h - dh) / 2;
  }

  // sim anchors (runtime px): the sim builds its ball/pin from s(hole.tee/pin)
  const stx = s(hole.tee.x);
  const sty = s(hole.tee.y);
  const spx = s(hole.pin.x);
  const spy = s(hole.pin.y);
  // illustration anchors (screen runtime px)
  const dtx = dx + an.tee.x * dw;
  const dty = dy + an.tee.y * dh;
  const dpx = dx + an.cup.x * dw;
  const dpy = dy + an.cup.y * dh;

  // similarity ratio r = (Dp − Dt) / (Sp − St) as a complex number a + bi
  const vx = spx - stx;
  const vy = spy - sty;
  const wx = dpx - dtx;
  const wy = dpy - dty;
  const denom = vx * vx + vy * vy || 1;
  const a = (wx * vx + wy * vy) / denom;
  const b = (wy * vx - wx * vy) / denom;

  return { dx, dy, dw, dh, fit, a, b, stx, sty, dtx, dty, scale: Math.hypot(a, b) };
}

/** Map a sim-space point (runtime px) onto the displayed illustration (screen px). */
export function projectPoint(p: HoleProjection, x: number, y: number): { x: number; y: number } {
  const dx = x - p.stx;
  const dy = y - p.sty;
  return { x: p.dtx + p.a * dx - p.b * dy, y: p.dty + p.b * dx + p.a * dy };
}

/**
 * THE TOP-VIEW CAMERA (the "camera doesn't change" fix): projectHole framed the
 * whole hole once, statically — late-hole shots rendered at the screen edge and
 * putts were unreadably small. This variant lays the SAME illustration into the
 * box at `zoom`× the cover fit, centred on `focus` (a point in image FRACTIONS,
 * 0..1), clamped so the oversized image always covers the box. The similarity
 * solve is identical to projectHole, so every projectPoint caller just works.
 */
export function projectHoleCam(
  hole: HoleDef,
  imgW: number,
  imgH: number,
  box: FitBox,
  focus: { fx: number; fy: number },
  zoom: number,
): HoleProjection {
  const an = anchorsFor(hole.id);
  const fit = Math.max(box.w / imgW, box.h / imgH) * Math.max(1, zoom);
  const dw = imgW * fit;
  const dh = imgH * fit;
  // centre the focus point in the box, clamped so the image still fully covers
  let dx = box.x + box.w / 2 - focus.fx * dw;
  let dy = box.y + box.h / 2 - focus.fy * dh;
  dx = Math.min(box.x, Math.max(box.x + box.w - dw, dx));
  dy = Math.min(box.y, Math.max(box.y + box.h - dh, dy));

  const stx = s(hole.tee.x);
  const sty = s(hole.tee.y);
  const spx = s(hole.pin.x);
  const spy = s(hole.pin.y);
  const dtx = dx + an.tee.x * dw;
  const dty = dy + an.tee.y * dh;
  const dpx = dx + an.cup.x * dw;
  const dpy = dy + an.cup.y * dh;
  const vx = spx - stx;
  const vy = spy - sty;
  const wx = dpx - dtx;
  const wy = dpy - dty;
  const denom = vx * vx + vy * vy || 1;
  const a = (wx * vx + wy * vy) / denom;
  const b = (wy * vx - wx * vy) / denom;
  return { dx, dy, dw, dh, fit, a, b, stx, sty, dtx, dty, scale: Math.hypot(a, b) };
}
