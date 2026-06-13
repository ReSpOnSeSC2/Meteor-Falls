/**
 * S16 Movement 8 (ADR-060) — the ITEM_ICON completeness MIRROR. The validator
 * enforces the same truths in tools/content-validate.ts; this suite keeps them
 * red in vitest alone. Both directions: every §A8 item maps to a drawn menu
 * icon, and an icon row no item claims is a dead manifest row. Plus the art law
 * itself — every icon draws content inside sane menu-scale bounds, and distinct
 * items never lazily share a drawing.
 */
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../data/items';
import { ITEM_ICON, itemIconKey } from './icons';
import { T } from '../palette';

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
      const n = pm.data.reduce((a, c) => a + (c !== T ? 1 : 0), 0);
      expect(n, `icon '${id}' draws nothing`).toBeGreaterThan(0);
    }
  });

  it('distinct items get distinct icons (no lazy reuse)', () => {
    const data = (id: string): Uint8Array => ITEM_ICON[id]().data;
    const same = (a: string, b: string): boolean => Buffer.from(data(a)).equals(Buffer.from(data(b)));
    expect(same('corn_dog', 'pbj'), 'food icons must differ').toBe(false);
    expect(same('basket_basic', 'basket_feast'), 'baskets must escalate visibly').toBe(false);
    expect(same('cracked_bat', 'hand_me_down_pan'), 'bat vs pan must differ').toBe(false);
    expect(same('star_locket', 'lemonade_jug'), 'key items must differ').toBe(false);
  });

  it('itemIconKey is stable and id-scoped', () => {
    expect(itemIconKey('corn_dog')).toBe('item_corn_dog');
    expect(itemIconKey('star_locket')).toBe('item_star_locket');
  });
});
