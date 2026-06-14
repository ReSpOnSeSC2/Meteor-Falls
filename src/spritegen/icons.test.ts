/**
 * THE ICON ATLAS + THE ICON FORGE — the completeness + distinctness MIRROR.
 *
 * S16 M8 (ADR-060) gated ITEM_ICON ⇄ §A8 items BOTH directions; the validator
 * enforces the same in tools/content-validate.ts. S17 M17 (ADR-062) adds THE
 * ICON FORGE — the parametric engine for the ~500-item long tail — and this
 * suite is its slop-detector in vitest alone: every shipped icon AND every
 * forge gallery sample is byte-DISTINCT (no two faces are the same drawing,
 * across AND within kinds), the forge stamps a distinct face for EVERY planned
 * subcategory, and each of the three layers (subcat / ramp / detail) actually
 * differentiates. Plus the art law (palette-only, in-bounds) and determinism.
 */
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../data/items';
import { ITEM_ICON, itemIconKey } from './icons';
import {
  forgeIcon,
  forgeGallery,
  FORGE_CATALOG,
  REGION_RAMPS,
  type IconSpec,
} from './iconforge';
import { PALETTE, T } from '../palette';
import type { Pixmap } from './pixmap';
import type { ItemBand } from '../schemas';

/** a content fingerprint: dimensions + bytes. Two icons share it only if they
 *  are the SAME drawing — the lazy-reuse / palette-swap detector. */
const keyOf = (pm: Pixmap): string => `${pm.w}x${pm.h}:${Buffer.from(pm.data).toString('base64')}`;
const nonT = (pm: Pixmap): number => pm.data.reduce((n, c) => n + (c !== T ? 1 : 0), 0);

describe('ITEM_ICON ⇄ §A8 items (both directions)', () => {
  it('every item has an icon row', () => {
    for (const item of Object.values(ITEMS)) {
      expect(ITEM_ICON[item.id], `item '${item.id}' (${item.kind}) has no ITEM_ICON row`).toBeDefined();
    }
  });

  it('every icon row is claimed by a real item', () => {
    for (const id of Object.keys(ITEM_ICON)) {
      expect(ITEMS[id], `ITEM_ICON row '${id}' claims no item`).toBeDefined();
    }
  });

  it('every icon draws content inside 12–16px menu bounds', () => {
    for (const [id, draw] of Object.entries(ITEM_ICON)) {
      const pm = draw();
      expect(pm.w, `icon '${id}' has no width`).toBeGreaterThan(0);
      expect(pm.h, `icon '${id}' has no height`).toBeGreaterThan(0);
      // §A8 / Movement 8: 12–16px icons — legible in a menu row, never huge
      expect(pm.w, `icon '${id}' is too wide for a menu row`).toBeLessThanOrEqual(16);
      expect(pm.h, `icon '${id}' is too tall for a menu row`).toBeLessThanOrEqual(16);
      expect(nonT(pm), `icon '${id}' draws nothing`).toBeGreaterThan(0);
    }
  });

  it('itemIconKey is stable and id-scoped', () => {
    expect(itemIconKey('corn_dog')).toBe('item_corn_dog');
    expect(itemIconKey('star_locket')).toBe('item_star_locket');
  });
});

describe('THE ICON ATLAS — no two faces are the same drawing (all pairs)', () => {
  it('every ITEM_ICON is byte-distinct from every other', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [id, draw] of Object.entries(ITEM_ICON)) {
      const k = keyOf(draw());
      const prev = seen.get(k);
      if (prev) collisions.push(`'${id}' === '${prev}'`);
      else seen.set(k, id);
    }
    expect(collisions, `lazy icon reuse (identical drawings): ${collisions.join(', ')}`).toEqual([]);
  });

  // the readability anchors the original ADR-060 test pinned, now a subset of
  // the all-pairs sweep above — kept as named regression guards
  it('the canonical distinct pairs hold', () => {
    const same = (a: string, b: string): boolean => keyOf(ITEM_ICON[a]()) === keyOf(ITEM_ICON[b]());
    expect(same('corn_dog', 'pbj'), 'food icons must differ').toBe(false);
    expect(same('basket_basic', 'basket_feast'), 'baskets must escalate visibly').toBe(false);
    expect(same('cracked_bat', 'hand_me_down_pan'), 'bat vs pan must differ').toBe(false);
    expect(same('star_locket', 'lemonade_jug'), 'key items must differ').toBe(false);
  });
});

describe('THE ICON FORGE (ADR-062) — every subcategory renders, on-theme', () => {
  it('the forge library is substantial (the long tail needs breadth)', () => {
    expect(FORGE_CATALOG.length).toBeGreaterThanOrEqual(50);
  });

  it('every planned subcategory draws content inside menu bounds', () => {
    for (const g of forgeGallery()) {
      expect(g.pm.w, `forge '${g.subcat}' width`).toBeLessThanOrEqual(16);
      expect(g.pm.h, `forge '${g.subcat}' height`).toBeLessThanOrEqual(16);
      expect(nonT(g.pm), `forge '${g.subcat}' draws nothing`).toBeGreaterThan(8);
    }
  });

  it('every forged pixel is a palette index (ADR-020 by construction)', () => {
    for (const g of forgeGallery()) {
      for (const c of g.pm.data) {
        expect(c === T || (c >= 0 && c < PALETTE.length), `forge '${g.subcat}' emitted off-palette ${c}`).toBe(true);
      }
    }
  });

  it('is deterministic: (spec) → identical bytes, twice', () => {
    const spec: IconSpec = { subcat: 'pastry', band: 'ch2', detail: 'dots', seed: 'alfajor' };
    expect(keyOf(forgeIcon(spec))).toBe(keyOf(forgeIcon(spec)));
  });
});

describe('THE ICON FORGE — the three layers each differentiate', () => {
  it('layer 1 (silhouette): every subcategory is a distinct shape', () => {
    // hold band/detail/seed fixed; only the subcat varies → all must differ
    const keys = FORGE_CATALOG.map((subcat) => keyOf(forgeIcon({ subcat, band: 'ch1', seed: 'fixed' })));
    expect(new Set(keys).size, 'two subcategories collapsed to one shape').toBe(FORGE_CATALOG.length);
  });

  it('layer 2 (region ramp): the same item reads differently across regions', () => {
    const bands = Object.keys(REGION_RAMPS) as ItemBand[];
    const keys = bands.map((band) => keyOf(forgeIcon({ subcat: 'can', band, detail: 'label', seed: 'soda' })));
    // the region pools differ in membership, so a fixed item is not one colour
    // worldwide — most bands give a distinct face
    expect(new Set(keys).size).toBeGreaterThanOrEqual(5);
  });

  it('layer 3 (detail): a different mark makes a same-subcat item distinct', () => {
    const base: IconSpec = { subcat: 'pastry', band: 'ch2', seed: 'twins' };
    const plain = keyOf(forgeIcon(base));
    const dotted = keyOf(forgeIcon({ ...base, detail: 'dots' }));
    const bitten = keyOf(forgeIcon({ ...base, detail: 'bite' }));
    expect(new Set([plain, dotted, bitten]).size, 'details did not differentiate').toBe(3);
  });

  it('the gem tint differentiates resist charms of one subcategory', () => {
    const charm = (tintName: 'fire' | 'cyan' | 'gold'): string => {
      const tint = { fire: 5, cyan: 10, gold: 7 }[tintName]; // RED / CYAN / GOLD ramps
      return keyOf(forgeIcon({ subcat: 'pendant', band: 'ch7', detail: 'stone', tint, seed: 'pend' }));
    };
    expect(new Set([charm('fire'), charm('cyan'), charm('gold')]).size).toBe(3);
  });
});

describe('THE ICON FORGE — slop-detector across the whole atlas', () => {
  it('no shipped icon and no forge sample share a drawing', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    const add = (label: string, pm: Pixmap): void => {
      const k = keyOf(pm);
      const prev = seen.get(k);
      if (prev) collisions.push(`${label} === ${prev}`);
      else seen.set(k, label);
    };
    for (const [id, draw] of Object.entries(ITEM_ICON)) add(`item:${id}`, draw());
    for (const g of forgeGallery()) add(`forge:${g.subcat}`, g.pm);
    expect(collisions, `byte-identical icons: ${collisions.join(', ')}`).toEqual([]);
  });
});
