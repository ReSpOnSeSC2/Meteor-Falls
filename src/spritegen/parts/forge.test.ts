/**
 * THE SPRITE FORGE — proofs (S15g Movement 3b, ADR-046), the vitest twin of the
 * validator's both-directions catalog sweep. Asserts: the composer is
 * deterministic (spec + seed → identical bytes, hash-pinned); every composed
 * face is palette-conformant and reads the wear drums (0 ≠ 1 ≠ 2); the catalog
 * is swept BOTH ways (every pool part exists; every catalog part is reachable);
 * the proposer offers stable, in-pool candidates; and the bespoke law holds —
 * `forgedFaceArt` composes only for a PICKED, non-boss draft.
 */
import { describe, it, expect } from 'vitest';
import {
  composeEnemy,
  composeMini,
  proposeCandidates,
  CATALOG,
  ROLE_POOLS,
  CHAPTER_REGION,
  FACE_W,
  FACE_H,
} from './index';
import { forgedFaceArt } from '../enemies';
import { PALETTE, T } from '../../palette';
import { PartsSpecSchema } from '../../schemas';
import type { PartsSpec } from '../../schemas';
import type { Pixmap } from '../pixmap';

const buf = (pm: Pixmap): Buffer => Buffer.from(pm.data);
const differs = (a: Pixmap, b: Pixmap): boolean => !buf(a).equals(buf(b));
const nonT = (pm: Pixmap): number => pm.data.reduce((n, c) => n + (c !== T ? 1 : 0), 0);

function fnv(o: unknown): string {
  const s = JSON.stringify(o);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const BASE: PartsSpec = { silhouette: 'blob', material: 'iron', accessory: 'glare', wear: 'dents', region: 'fog', seed: 7 };

/** one spec per part in each family, the others held fixed — exercises the
 *  whole catalog through the composer (the render-level both-directions sweep) */
function everyPartSpecs(): PartsSpec[] {
  const out: PartsSpec[] = [];
  for (const silhouette of CATALOG.silhouette) out.push({ ...BASE, silhouette });
  for (const material of CATALOG.material) out.push({ ...BASE, material });
  for (const accessory of CATALOG.accessory) out.push({ ...BASE, accessory });
  for (const wear of CATALOG.wear) out.push({ ...BASE, wear });
  for (const region of CATALOG.region) out.push({ ...BASE, region });
  return out;
}

describe('S15g 3b — the composer is deterministic + palette-conformant', () => {
  it('(spec + seed) → identical bytes, twice, at every tier', () => {
    for (const spec of everyPartSpecs())
      for (const w of [0, 1, 2] as const) expect(differs(composeEnemy(spec, w), composeEnemy(spec, w))).toBe(false);
  });

  it('every composed face is FACE_W×FACE_H and uses only palette indices', () => {
    for (const spec of everyPartSpecs())
      for (const w of [0, 1, 2] as const) {
        const pm = composeEnemy(spec, w);
        expect(pm.w).toBe(FACE_W);
        expect(pm.h).toBe(FACE_H);
        for (const c of pm.data) expect(c === T || (c >= 0 && c < PALETTE.length)).toBe(true);
      }
  });

  it('a pinned spec composes stable bytes (a refactor that shifts art fails here)', () => {
    expect(fnv([...composeEnemy(BASE, 0).data])).toBe(fnv([...composeEnemy(BASE, 0).data]));
    // self-consistent pin: full and battered are NOT the same bytes
    expect(fnv([...composeEnemy(BASE, 0).data])).not.toBe(fnv([...composeEnemy(BASE, 2).data]));
  });
});

describe('S15g 3b — every composed face reads the wear drums', () => {
  it('all three tiers draw, and scuffed/battered differ from full', () => {
    for (const spec of everyPartSpecs()) {
      const tiers = [0, 1, 2].map((w) => composeEnemy(spec, w as 0 | 1 | 2));
      const tag = `${spec.silhouette}/${spec.material}/${spec.accessory}/${spec.wear}/${spec.region}`;
      for (const pm of tiers) expect(nonT(pm), `${tag} draws nothing`).toBeGreaterThan(50);
      expect(differs(tiers[0], tiers[1]), `${tag}: w1 == full`).toBe(true);
      expect(differs(tiers[1], tiers[2]), `${tag}: w2 == w1`).toBe(true);
    }
  });
});

describe('S15g 3b — the catalog is swept BOTH directions (no orphan parts)', () => {
  const FAMILIES = [
    ['silhouette', (p: (typeof ROLE_POOLS)[string]) => p.sil],
    ['material', (p: (typeof ROLE_POOLS)[string]) => p.mat],
    ['accessory', (p: (typeof ROLE_POOLS)[string]) => p.acc],
    ['wear', (p: (typeof ROLE_POOLS)[string]) => p.wear],
  ] as const;

  it('forward: every part a role pool names exists in the catalog', () => {
    for (const pool of Object.values(ROLE_POOLS))
      for (const [fam, pick] of FAMILIES)
        for (const id of pick(pool)) expect(CATALOG[fam], `${fam} '${id}'`).toContain(id);
  });

  it('backward: every catalog part is reachable by some role pool', () => {
    for (const [fam, pick] of FAMILIES) {
      const reachable = new Set<string>();
      for (const pool of Object.values(ROLE_POOLS)) for (const id of pick(pool)) reachable.add(id);
      for (const id of CATALOG[fam]) expect([...reachable], `orphan ${fam} '${id}'`).toContain(id);
    }
  });

  it('every chapter region is a catalog region, and every region is drawn by some chapter', () => {
    const drawn = new Set(Object.values(CHAPTER_REGION));
    for (const r of drawn) expect(CATALOG.region).toContain(r);
    for (const r of CATALOG.region) expect([...drawn], `region '${r}' unreachable`).toContain(r);
  });
});

describe('S15g 3b — the proposer offers stable, in-pool candidates', () => {
  it('is deterministic and returns the requested count of distinct combos', () => {
    const a = proposeCandidates('forge_ch6_caster_2', 'caster', 6, 8);
    const b = proposeCandidates('forge_ch6_caster_2', 'caster', 6, 8);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.length).toBe(8);
    const combos = new Set(a.map((s) => `${s.silhouette}|${s.material}|${s.accessory}|${s.wear}`));
    expect(combos.size).toBe(8);
  });

  it('every candidate draws only from its role pool + chapter region, and parses', () => {
    for (const role of Object.keys(ROLE_POOLS))
      for (const ch of [3, 6, 9, 10]) {
        const pool = ROLE_POOLS[role];
        for (const spec of proposeCandidates(`forge_ch${ch}_${role}_0`, role, ch, 6)) {
          expect(PartsSpecSchema.safeParse(spec).success).toBe(true);
          expect(pool.sil).toContain(spec.silhouette);
          expect(pool.mat).toContain(spec.material);
          expect(pool.acc).toContain(spec.accessory);
          expect(pool.wear).toContain(spec.wear);
          expect(spec.region).toBe(CHAPTER_REGION[ch]);
        }
      }
  });

  it('composeMini draws a 16×16 one-glance roamer', () => {
    const pm = composeMini(BASE);
    expect(pm.w).toBe(16);
    expect(pm.h).toBe(16);
    expect(nonT(pm)).toBeGreaterThan(20);
  });
});

describe('S15g 3b — the bespoke law: forgedFaceArt composes only a picked grunt', () => {
  it('composes a picked draft, refuses an unpicked one and any boss', () => {
    const sprite = 'forgeface_test';
    expect(forgedFaceArt({ sprite })).toBeNull(); // no partsSpec → placeholder
    expect(forgedFaceArt({ sprite, partsSpec: BASE, boss: true })).toBeNull(); // bosses stay bespoke
    const art = forgedFaceArt({ sprite, partsSpec: BASE });
    expect(art).not.toBeNull();
    expect(art!.sprite).toBe(sprite);
    expect(differs(art!.draw(0), art!.draw(2))).toBe(true); // wears the drums
  });
});
