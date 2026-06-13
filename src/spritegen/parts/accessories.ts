/**
 * ACCESSORY family (the face) — S15g Movement 3b, ADR-046.
 *
 * Eyes, brow, mouth, and the one prop that gives a grunt its read — landed on
 * the `Anchors` the silhouette stamped. Pupils and brows are `C.outline`;
 * catchlights are a shade-3 pixel pre-outline (the cursed-souvenir idiom). The
 * face is the loudest part of the read, so the proposer leans on it for variety.
 */
import { px, RAMP, C } from '../../palette';
import type { Accessory } from './types';

/** angry glaring eyes under a meeting brow — the cranky-mailbox read */
const glare: Accessory = {
  id: 'glare',
  face: (ctx) => {
    const { pm, a } = ctx;
    const wY = a.eyeY - 4;
    pm.rect(a.cx - a.eyeDX - 4, wY, 8, 8, px(RAMP.PAPER, 3));
    pm.rect(a.cx + a.eyeDX - 4, wY, 8, 8, px(RAMP.PAPER, 3));
    pm.rect(a.cx - a.eyeDX, wY + 3, 3, 5, C.outline); // pupils, glaring inward
    pm.rect(a.cx + a.eyeDX - 3, wY + 3, 3, 5, C.outline);
    pm.set(a.cx - a.eyeDX, wY + 3, px(RAMP.PAPER, 3));
    pm.set(a.cx + a.eyeDX - 1, wY + 3, px(RAMP.PAPER, 3));
    pm.line(a.cx - a.eyeDX - 5, a.browY, a.cx - 2, a.browY + 3, C.outline);
    pm.line(a.cx + a.eyeDX + 5, a.browY, a.cx + 2, a.browY + 3, C.outline);
  },
};

/** wide innocent bead eyes + a small mouth — disarming, the swarm read */
const dots: Accessory = {
  id: 'dots',
  face: (ctx) => {
    const { pm, a } = ctx;
    for (const s of [-1, 1]) {
      pm.ellipse(a.cx + s * a.eyeDX, a.eyeY, 3, 3, px(RAMP.PAPER, 3));
      pm.set(a.cx + s * a.eyeDX, a.eyeY, C.outline);
      pm.set(a.cx + s * a.eyeDX - 1, a.eyeY - 1, px(RAMP.PAPER, 3));
    }
    pm.hline(a.cx - 2, a.mouthY, 5, C.outline); // a small line mouth
  },
};

/** one enormous central eye — the lurker / single-minded read */
const cyclops: Accessory = {
  id: 'cyclops',
  face: (ctx) => {
    const { pm, a } = ctx;
    pm.rect(a.cx - 6, a.eyeY - 5, 12, 10, px(RAMP.PAPER, 3));
    pm.rect(a.cx - 3, a.eyeY - 2, 6, 6, px(RAMP.CYAN, 1)); // iris
    pm.rect(a.cx - 2, a.eyeY - 1, 3, 4, C.outline); // pupil
    pm.set(a.cx - 1, a.eyeY - 1, px(RAMP.PAPER, 3));
    pm.line(a.cx - 7, a.browY, a.cx + 7, a.browY, C.outline);
  },
};

/** narrow eyes over a toothy slot grin — the bruiser / boss-minion read */
const grin: Accessory = {
  id: 'grin',
  face: (ctx) => {
    const { pm, a } = ctx;
    for (const s of [-1, 1]) {
      pm.rect(a.cx + s * a.eyeDX - 3, a.eyeY - 2, 6, 5, px(RAMP.PAPER, 3));
      pm.rect(a.cx + s * a.eyeDX - 1, a.eyeY, 3, 3, C.outline);
    }
    pm.rect(a.cx - 9, a.mouthY, 18, 5, C.outline);
    for (let i = 0; i < 5; i++) pm.rect(a.cx - 8 + i * 4, a.mouthY + 1, 2, 3, px(RAMP.PAPER, 2));
  },
};

/** bead eyes + a pair of feelers off the crown (knobs in trim) */
const antennae: Accessory = {
  id: 'antennae',
  face: (ctx) => {
    const { pm, a, trim } = ctx;
    for (const s of [-1, 1]) {
      pm.ellipse(a.cx + s * a.eyeDX, a.eyeY, 2, 2, px(RAMP.PAPER, 3));
      pm.set(a.cx + s * a.eyeDX, a.eyeY, C.outline);
      pm.line(a.cx + s * 4, a.crownY + 2, a.cx + s * 9, a.crownY - 6, C.outline);
      pm.set(a.cx + s * 9, a.crownY - 7, px(trim, 2));
      pm.set(a.cx + s * 9, a.crownY - 8, px(trim, 3));
    }
    pm.hline(a.cx - 1, a.mouthY, 3, C.outline);
  },
};

/** bead eyes + a crumb of a gold crown (the hill-slug-deluxe read) */
const crown: Accessory = {
  id: 'crown',
  face: (ctx) => {
    const { pm, a } = ctx;
    for (const s of [-1, 1]) {
      pm.ellipse(a.cx + s * a.eyeDX, a.eyeY, 3, 3, px(RAMP.PAPER, 3));
      pm.set(a.cx + s * a.eyeDX, a.eyeY, C.outline);
      pm.set(a.cx + s * a.eyeDX - 1, a.eyeY - 1, px(RAMP.PAPER, 3));
    }
    const cy = a.crownY + 1;
    pm.rect(a.cx - 7, cy, 14, 3, px(RAMP.GOLD, 2));
    pm.hline(a.cx - 7, cy, 14, px(RAMP.GOLD, 3));
    pm.set(a.cx - 6, cy - 2, px(RAMP.GOLD, 3));
    pm.set(a.cx, cy - 3, px(RAMP.GOLD, 3));
    pm.set(a.cx + 6, cy - 2, px(RAMP.GOLD, 3));
    pm.set(a.cx, cy + 1, px(RAMP.RED, 2)); // the jewel
    pm.hline(a.cx - 2, a.mouthY, 5, C.outline);
  },
};

export const ACCESSORIES: Record<string, Accessory> = {
  glare, dots, cyclops, grin, antennae, crown,
};
