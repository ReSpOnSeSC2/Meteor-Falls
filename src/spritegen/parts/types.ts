/**
 * THE SPRITE FORGE — composition contract (S15g Movement 3b, ADR-047).
 *
 * A forged enemy's face is COMPOSED from hand-drawn parts, never synthesized
 * (ADR-020 BY CONSTRUCTION). Each part is a `px`-only function on the 64-color
 * palette — the WEAPON_ART precedent (spritegen/weapons.ts), applied to whole
 * enemies instead of held gear. The composer (parts/index.ts) layers them in a
 * fixed order onto one canvas, so the part FAMILIES never need to know about
 * each other; they only read the shared `Anchors` the silhouette stamps and
 * paint over the body the silhouette already laid down.
 *
 * Phaser-free on purpose (like weapons.ts): the validator and the contact-sheet
 * tool both import this so the catalog is gated and reviewable out of game.
 */
import type { Pixmap } from '../pixmap';
import type { Streams } from '../../levelkit/rng';
import type { WearTier } from '../battlers';

/** the composed-face canvas — one size for every forged enemy so its three
 *  wear tiers share a canvas (the texture swap can never drift, wear.test law) */
export const FACE_W = 64;
export const FACE_H = 72;

/**
 * The silhouette stamps these so the later families land on the right pixels —
 * a beetle's eyes ride its head, a totem's ride its slab — without any family
 * having to re-derive the body. Coordinates are face-canvas pixels.
 */
export interface Anchors {
  /** body center column (most silhouettes are bilateral about it) */
  cx: number;
  /** the eye line, and how far each eye sits off `cx` */
  eyeY: number;
  eyeDX: number;
  /** carved-brow row (just above the eyes) */
  browY: number;
  /** mouth row (below the eyes) */
  mouthY: number;
  /** the crown point — top-center of the mass (hats, antennae, horns) */
  crownX: number;
  crownY: number;
  /** body bounds the material/wear/region passes read to stay on the body */
  bodyTop: number;
  bodyBottom: number;
  bodyHalfW: number;
}

/** the layered draw surface every part writes to (one per composed face) */
export interface ComposeCtx {
  pm: Pixmap;
  /** seeded by PartsSpec.seed — every jittered detail rides a NAMED stream so
   *  (spec + seed) → identical bytes forever (Prime Law 2) */
  S: Streams;
  wear: WearTier;
  /** the material's base ramp (the body color the silhouette draws in) */
  ramp: number;
  /** the accent ramp (region locale, else the material's own trim) */
  trim: number;
  /** stamped by the silhouette, read by every later family */
  a: Anchors;
}

/** body shape: lays the mass with `ctx.ramp` and stamps `ctx.a` */
export interface Silhouette {
  id: string;
  body: (ctx: ComposeCtx) => void;
}

/** the surface: owns the base `ramp` + the texture pass over the body */
export interface Material {
  id: string;
  ramp: number;
  /** the secondary color when no region overrides it */
  trim?: number;
  surface: (ctx: ComposeCtx) => void;
}

/** the face: eyes / brow / mouth / props, landed on the anchors */
export interface Accessory {
  id: string;
  face: (ctx: ComposeCtx) => void;
}

/** the drums: clustered, deliberate damage at tiers 1 and 2 (ADR-020 rule 1) */
export interface WearAccent {
  id: string;
  mark: (ctx: ComposeCtx, tier: 1 | 2) => void;
}

/** locale flavor: a few region-colored pixels + the trim ramp it lends */
export interface RegionAccent {
  id: string;
  trim: number;
  accent: (ctx: ComposeCtx) => void;
}

/** the default anchors a silhouette starts from and then overrides */
export function defaultAnchors(): Anchors {
  return {
    cx: FACE_W / 2,
    eyeY: 30,
    eyeDX: 9,
    browY: 24,
    mouthY: 42,
    crownX: FACE_W / 2,
    crownY: 8,
    bodyTop: 10,
    bodyBottom: 60,
    bodyHalfW: 22,
  };
}
