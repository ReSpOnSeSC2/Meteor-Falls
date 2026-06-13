/**
 * THE SPRITE FORGE — the composer (S15g Movement 3b, ADR-046).
 *
 * `composeEnemy(spec, wear)` layers the hand-drawn part families in a fixed
 * order onto one face canvas: silhouette (shape + volume) → material (surface) →
 * region (locale) → accessory (face) → wear (the drums) → `outline()`. A
 * PartsSpec + its seed reproduce identical bytes forever (Prime Law 2). Nothing
 * is synthesized: every pixel comes from a `px`-only part function (ADR-020 BY
 * CONSTRUCTION). The proposer offers 5–10 seeded candidates per forged grunt for
 * the human to pick from; bosses and the five heroes stay bespoke (never forged).
 */
import { Pixmap } from '../pixmap';
import { px, RAMP, C } from '../../palette';
import { Streams } from '../../levelkit/rng';
import type { WearTier } from '../battlers';
import type { PartsSpec } from '../../schemas';
import { SILHOUETTES } from './silhouettes';
import { MATERIALS } from './materials';
import { ACCESSORIES } from './accessories';
import { WEAR_ACCENTS } from './wear';
import { REGION_ACCENTS } from './regions';
import { FACE_W, FACE_H, defaultAnchors, type ComposeCtx } from './types';

export { SILHOUETTES, MATERIALS, ACCESSORIES, WEAR_ACCENTS, REGION_ACCENTS };
export { FACE_W, FACE_H } from './types';
export type { ComposeCtx, Anchors } from './types';

/** the stable runtime texture keys a picked forged enemy renders through */
export function forgeFaceKey(id: string): string {
  return `forgeface_${id}`;
}
export function forgeMiniKey(id: string): string {
  return `forgemini_${id}`;
}

/** when a spec names no wear accent, the drums still read — generic flaking */
const FALLBACK_WEAR = WEAR_ACCENTS.chips;

/**
 * Compose a forged enemy's battle face at one wear tier. Pure: (spec + seed) →
 * identical bytes. A malformed spec (unknown silhouette/material) draws an empty
 * canvas — the validator gates that away before it can ever ship.
 */
export function composeEnemy(spec: PartsSpec, wear: WearTier): Pixmap {
  const pm = new Pixmap(FACE_W, FACE_H);
  const sil = SILHOUETTES[spec.silhouette];
  const mat = MATERIALS[spec.material];
  if (!sil || !mat) return pm;
  const reg = spec.region ? REGION_ACCENTS[spec.region] : undefined;
  const acc = spec.accessory ? ACCESSORIES[spec.accessory] : undefined;
  const wac = spec.wear ? WEAR_ACCENTS[spec.wear] : undefined;
  const ctx: ComposeCtx = {
    pm,
    S: new Streams(spec.seed >>> 0),
    wear,
    ramp: mat.ramp,
    trim: reg?.trim ?? mat.trim ?? mat.ramp,
    a: defaultAnchors(),
  };
  sil.body(ctx); // shape + 3-tone volume, stamps the anchors
  mat.surface(ctx); // surface motif over the body
  reg?.accent(ctx); // locale whisper
  acc?.face(ctx); // eyes / mouth / prop
  // the drums accumulate: tier 2 keeps tier 1's marks and adds to them
  if (wear >= 1) (wac ?? FALLBACK_WEAR).mark(ctx, 1);
  if (wear >= 2) (wac ?? FALLBACK_WEAR).mark(ctx, 2);
  pm.outline(C.outline);
  return pm;
}

/** a 16×16 one-glance overworld roamer derived from the same parts */
export function composeMini(spec: PartsSpec): Pixmap {
  const pm = new Pixmap(16, 16);
  const mat = MATERIALS[spec.material];
  if (!mat) return pm;
  const ramp = mat.ramp;
  if (spec.silhouette === 'totem' || spec.silhouette === 'husk') pm.ellipse(8, 9, 4, 6, px(ramp, 2));
  else if (spec.silhouette === 'lump') pm.ellipse(8, 11, 6, 4, px(ramp, 2));
  else pm.ellipse(8, 9, 6, 5, px(ramp, 2));
  pm.ellipse(6, 7, 3, 3, px(ramp, 3)); // the lit shoulder
  for (const ex of [6, 10]) {
    pm.set(ex, 9, C.outline);
    pm.set(ex - 1, 8, px(RAMP.PAPER, 3));
  }
  if (spec.accessory === 'crown') {
    pm.hline(5, 3, 6, px(RAMP.GOLD, 2));
    pm.set(8, 2, px(RAMP.GOLD, 3));
  } else if (spec.accessory === 'antennae') {
    pm.line(6, 5, 3, 2, C.outline);
    pm.line(10, 5, 13, 2, C.outline);
  }
  const reg = spec.region ? REGION_ACCENTS[spec.region] : undefined;
  if (reg) pm.set(8, 14, px(reg.trim, 2));
  pm.outline(C.outline);
  return pm;
}

/* ====================== THE CANDIDATE PROPOSER ====================== */

/** the catalog, by family — the validator sweeps these BOTH directions */
export const CATALOG = {
  silhouette: Object.keys(SILHOUETTES),
  material: Object.keys(MATERIALS),
  accessory: Object.keys(ACCESSORIES),
  wear: Object.keys(WEAR_ACCENTS),
  region: Object.keys(REGION_ACCENTS),
} as const;

interface RolePool {
  sil: string[];
  mat: string[];
  acc: string[];
  wear: string[];
}

/**
 * Per-role part pools — which catalog parts READ for each forge archetype. The
 * union across roles must equal the catalog (no orphan parts), and the region
 * map below must cover every region: the validator proves both directions.
 */
export const ROLE_POOLS: Record<string, RolePool> = {
  grunt: { sil: ['blob', 'lump', 'cabinet'], mat: ['chitin', 'iron', 'cloth'], acc: ['glare', 'dots'], wear: ['dents', 'chips'] },
  bruiser: { sil: ['carapace', 'husk', 'cabinet'], mat: ['iron', 'stone'], acc: ['grin', 'glare'], wear: ['dents', 'cracks'] },
  caster: { sil: ['totem', 'wisp'], mat: ['lacquer', 'ember'], acc: ['cyclops', 'crown'], wear: ['cracks', 'scorch'] },
  thief: { sil: ['wisp', 'lump'], mat: ['cloth', 'lacquer'], acc: ['dots', 'antennae'], wear: ['tatters', 'chips'] },
  swarm: { sil: ['lump', 'blob'], mat: ['chitin', 'cloth'], acc: ['antennae', 'dots'], wear: ['tatters', 'chips'] },
  lurker: { sil: ['husk', 'wisp'], mat: ['stone', 'ember'], acc: ['cyclops', 'grin'], wear: ['cracks', 'scorch'] },
};

/** the locale each forge chapter draws its region accent from (Bible settings) */
export const CHAPTER_REGION: Record<number, string> = {
  3: 'fog', 4: 'fog', 5: 'ochre', 6: 'bog', 7: 'ochre', 8: 'bog', 9: 'velvet', 10: 'dust',
};

/** FNV-1a so a candidate's art seed derives deterministically from the enemy id */
function fnv32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Offer N distinct seeded candidate faces for a forged grunt — the Sprite Lab
 * contact sheet's content. Deterministic on the enemy id, so the same enemy
 * shows the same candidates in the LAB and in the .shots sheet, every time.
 * The human picks one; that exact PartsSpec is recorded (it reproduces forever).
 */
export function proposeCandidates(id: string, role: string, chapter: number, n = 8): PartsSpec[] {
  const pool = ROLE_POOLS[role] ?? ROLE_POOLS.grunt;
  const region = CHAPTER_REGION[chapter] ?? 'fog';
  const base = fnv32(id);
  const S = new Streams(base);
  const out: PartsSpec[] = [];
  const seen = new Set<string>();
  for (let guard = 0; out.length < n && guard < n * 12; guard++) {
    const i = out.length;
    const silhouette = S.pick(`sil${guard}`, pool.sil);
    const material = S.pick(`mat${guard}`, pool.mat);
    const accessory = S.pick(`acc${guard}`, pool.acc);
    const wear = S.pick(`wear${guard}`, pool.wear);
    const key = `${silhouette}|${material}|${accessory}|${wear}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ silhouette, material, accessory, wear, region, seed: (base ^ (i * 0x9e3779b1)) >>> 0 });
  }
  return out;
}
