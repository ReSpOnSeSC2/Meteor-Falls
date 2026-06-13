/**
 * SILHOUETTE family (the body SHAPE) — S15g Movement 3b, ADR-046.
 *
 * Each silhouette lays its mass as a hand-authored `Pixmap.contour` run (ADR-020
 * rule 3 — never `ellipse()` stacking), shades it three tones (top-left light
 * plane, mid body, lower-right core, the shipped-enemy idiom), and stamps the
 * shared `Anchors` so the face/material/wear families land on the right pixels.
 * The body color is `ctx.ramp` (the material's), set before the silhouette runs.
 */
import { px } from '../../palette';
import type { ComposeCtx, Silhouette } from './types';

/** stack a lighter arc just inside the top-left shoulder — the lit plane */
function litPlane(ctx: ComposeCtx, x: number, top: number, run: number[]): void {
  ctx.pm.contour(x, top, run, px(ctx.ramp, 3));
}

/** rounded amorphous BLOB — the friendly default grunt mass */
const blob: Silhouette = {
  id: 'blob',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    pm.contour(32, 12, [
      6, 9, 11, 13, 15, 16, 17, 18, 19, 19, 20, 20, 20, 21, 21, 21, 21, 21, 20, 20,
      20, 19, 19, 19, 18, 18, 18, 18, 19, 19, 19, 18, 17, 16, 15, 14, 12, 11, 9, 8, 7, 6, 5, 4, 3, 2,
    ], px(ramp, 2));
    litPlane(ctx, 25, 16, [3, 5, 6, 6, 5, 3]);
    pm.rect(40, 34, 12, 14, px(ramp, 1)); // core shadow, lower-right
    pm.hline(15, 55, 30, px(ramp, 0));
    ctx.a = { cx: 32, eyeY: 30, eyeDX: 8, browY: 25, mouthY: 41, crownX: 32, crownY: 12, bodyTop: 12, bodyBottom: 57, bodyHalfW: 21 };
  },
};

/** beetle CARAPACE — a proud dome over a head bump (the gilded-beetle lineage) */
const carapace: Silhouette = {
  id: 'carapace',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    pm.contour(32, 10, [
      7, 11, 14, 16, 18, 19, 20, 21, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23,
      22, 22, 22, 21, 21, 20, 20, 19, 18, 17, 16, 14, 12, 10, 8, 6,
    ], px(ramp, 2));
    pm.vline(32, 12, 14, px(ramp, 1)); // wing-case seam
    litPlane(ctx, 24, 13, [2, 4, 5, 5, 4, 2]);
    pm.rect(40, 28, 11, 9, px(ramp, 1));
    pm.hline(16, 42, 32, px(ramp, 0));
    // the head bump, poking out low
    pm.contour(32, 44, [9, 11, 12, 12, 12, 11, 9, 7], px(ramp, 2));
    ctx.a = { cx: 32, eyeY: 24, eyeDX: 10, browY: 18, mouthY: 50, crownX: 32, crownY: 10, bodyTop: 10, bodyBottom: 52, bodyHalfW: 23 };
  },
};

/** a stepped TOTEM slab — tall, narrow, a mask carved on a pillar */
const totem: Silhouette = {
  id: 'totem',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    // stepped headdress crown (geometry, not noise — ADR-020 rule 1)
    pm.rect(20, 5, 24, 4, px(ramp, 2));
    pm.rect(24, 2, 16, 4, px(ramp, 2));
    pm.hline(25, 2, 14, px(ramp, 3));
    pm.contour(32, 9, [
      11, 13, 15, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15, 15, 15, 15, 15, 15,
      15, 14, 14, 14, 14, 14, 13, 13, 13, 13, 12, 12, 12, 11, 11, 10, 9, 8, 7, 6, 5, 4,
    ], px(ramp, 2));
    litPlane(ctx, 25, 12, [4, 6, 7, 7, 6, 4]);
    pm.rect(40, 36, 9, 14, px(ramp, 1));
    pm.hline(18, 50, 28, px(ramp, 0));
    ctx.a = { cx: 32, eyeY: 26, eyeDX: 11, browY: 20, mouthY: 44, crownX: 32, crownY: 2, bodyTop: 2, bodyBottom: 51, bodyHalfW: 16 };
  },
};

/** a floaty WISP — a rounded head tapering to a tucked tail (spirits, echoes) */
const wisp: Silhouette = {
  id: 'wisp',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    pm.contour(32, 10, [
      6, 10, 13, 15, 16, 16, 16, 16, 15, 15, 14, 14, 13, 13, 12, 12, 12, 11, 11, 11,
      10, 10, 10, 9, 9, 9, 8, 8, 8, 9, 9, 8, 7, 7, 8, 7, 6, 6, 5, 4, 3,
    ], px(ramp, 2));
    litPlane(ctx, 26, 13, [3, 5, 6, 5, 3]);
    pm.rect(36, 30, 8, 12, px(ramp, 1));
    // a couple of trailing tail wisps (deliberate, off-center)
    pm.set(30, 52, px(ramp, 2));
    pm.set(34, 53, px(ramp, 1));
    ctx.a = { cx: 32, eyeY: 26, eyeDX: 8, browY: 21, mouthY: 36, crownX: 32, crownY: 10, bodyTop: 10, bodyBottom: 52, bodyHalfW: 16 };
  },
};

/** a squat LUMP — wide and low (slugs, crumbs, the swarm body) */
const lump: Silhouette = {
  id: 'lump',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    pm.contour(32, 22, [
      8, 13, 17, 20, 22, 24, 25, 26, 26, 27, 27, 27, 27, 26, 26, 25, 24, 22, 20, 17, 14, 11, 8, 6, 4,
    ], px(ramp, 2));
    litPlane(ctx, 22, 25, [4, 7, 8, 8, 6, 4]);
    pm.rect(42, 36, 12, 8, px(ramp, 1));
    pm.hline(10, 45, 40, px(ramp, 0));
    ctx.a = { cx: 32, eyeY: 33, eyeDX: 10, browY: 28, mouthY: 42, crownX: 32, crownY: 22, bodyTop: 22, bodyBottom: 47, bodyHalfW: 27 };
  },
};

/** an upright HUSK — a tapered pod (cocoons, sentries, the lurker shell) */
const husk: Silhouette = {
  id: 'husk',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    pm.contour(32, 8, [
      3, 6, 9, 11, 13, 14, 15, 16, 16, 17, 17, 17, 17, 17, 17, 17, 17, 16, 16, 16,
      16, 15, 15, 15, 15, 14, 14, 13, 13, 12, 12, 11, 11, 10, 10, 9, 9, 8, 8, 7, 6, 6, 5, 4, 3, 2,
    ], px(ramp, 2));
    litPlane(ctx, 26, 12, [2, 4, 5, 5, 4, 3]);
    pm.rect(38, 30, 8, 16, px(ramp, 1));
    pm.vline(32, 14, 30, px(ramp, 1)); // a segmenting seam down the pod
    ctx.a = { cx: 32, eyeY: 28, eyeDX: 7, browY: 23, mouthY: 40, crownX: 32, crownY: 8, bodyTop: 8, bodyBottom: 54, bodyHalfW: 17 };
  },
};

/** a CABINET — tall, narrow, SQUARED: lockers, vending machines, filing units.
 *  The one hard-edged, man-made shape (the rest are organic) — a door seam, vent
 *  louvers, a latch. Drawn from rects/lines, not contour (boxes have no curves). */
const cabinet: Silhouette = {
  id: 'cabinet',
  body: (ctx) => {
    const { pm, ramp } = ctx;
    const x0 = 21;
    const w = 22;
    const top = 6;
    const bot = 64;
    pm.rect(x0, top, w, bot - top, px(ramp, 2)); // the flat door face
    pm.vline(x0, top, bot - top, px(ramp, 3)); // lit left edge
    pm.rect(x0 + w - 3, top, 3, bot - top, px(ramp, 1)); // right side-return (the box's depth)
    pm.hline(x0, top, w, px(ramp, 3)); // lit top lip
    pm.hline(x0, bot - 1, w, px(ramp, 0)); // base shadow
    pm.vline(x0 + 3, top + 2, bot - top - 4, px(ramp, 1)); // the door seam
    for (const vy of [11, 14, 17]) pm.hline(x0 + 6, vy, w - 11, px(ramp, 1)); // vent louvers
    pm.rect(x0 + w - 7, 32, 3, 7, px(ramp, 0)); // the latch handle
    pm.set(x0 + w - 6, 33, px(ramp, 3));
    ctx.a = { cx: 32, eyeY: 28, eyeDX: 6, browY: 23, mouthY: 44, crownX: 32, crownY: 6, bodyTop: 6, bodyBottom: 63, bodyHalfW: 11 };
  },
};

export const SILHOUETTES: Record<string, Silhouette> = {
  blob, carapace, totem, wisp, lump, husk, cabinet,
};
