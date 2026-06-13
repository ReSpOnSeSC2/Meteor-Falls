/**
 * WEAR-ACCENT family (the drums) — S15g Movement 3b, ADR-046.
 *
 * Every forged face reads the wear drums like a shipped sprite: tier 1 (<66% HP)
 * scuffs it, tier 2 (<33%) batters it. Damage is DELIBERATE and CLUSTERED
 * (ADR-020 rule 1), and it ACCUMULATES — `composeEnemy` runs mark(1) then
 * mark(2) at tier 2, and because each accent draws from one cached named stream,
 * the tier-2 render keeps the tier-1 marks and adds to them (no drift, no noise).
 * Some accents subtract pixels (tatters, scorch, chips) so the foe visibly
 * comes apart — the Titanic-Tick "deflate" generalized.
 */
import { px, RAMP, T } from '../../palette';
import type { Pixmap } from '../pixmap';
import type { ComposeCtx, WearAccent } from './types';

/** a seeded point inside the body's reliably-filled core (few skips) */
function corePoint(ctx: ComposeCtx, r: () => number): [number, number] {
  const { a } = ctx;
  const x = a.cx + Math.round((r() * 2 - 1) * (a.bodyHalfW - 4));
  const y = a.bodyTop + 8 + Math.floor(r() * Math.max(1, a.bodyBottom - a.bodyTop - 14));
  return [x, y];
}

/** remove the lowest `n` body pixels at column x — a torn/burned nibble */
function bite(pm: Pixmap, x: number, fromY: number, n: number): void {
  let removed = 0;
  for (let y = fromY; y >= 0 && removed < n; y--) {
    if (pm.get(x, y) !== T) {
      pm.set(x, y, T);
      removed++;
    }
  }
}

/** dents — pressed-in dimples with a rim highlight (metal, hard shells) */
const dents: WearAccent = {
  id: 'dents',
  mark: (ctx, tier) => {
    const { pm, ramp } = ctx;
    const r = ctx.S.use('dent');
    const n = tier === 1 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const [x, y] = corePoint(ctx, r);
      if (pm.get(x, y) === T) continue;
      pm.set(x, y, px(ramp, 0));
      pm.set(x + 1, y, px(ramp, 0));
      pm.set(x, y + 1, px(ramp, 0));
      pm.set(x + 1, y + 1, px(ramp, 3)); // the pressed rim catches light
    }
    if (tier === 2) {
      const [x, y] = corePoint(ctx, r); // a deep crease
      pm.line(x - 3, y, x + 3, y + 2, px(ramp, 0));
    }
  },
};

/** cracks — dark jagged fissures; tier 2 opens a missing shard */
const cracks: WearAccent = {
  id: 'cracks',
  mark: (ctx, tier) => {
    const { pm, ramp } = ctx;
    const r = ctx.S.use('crack');
    const dk = px(ramp, 0);
    const seg = (): void => {
      const [x, y] = corePoint(ctx, r);
      let cx = x;
      let cy = y;
      for (let k = 0; k < 4; k++) {
        const nx = cx + (r() < 0.5 ? -2 : 2);
        const ny = cy + 2;
        pm.line(cx, cy, nx, ny, dk);
        cx = nx;
        cy = ny;
      }
    };
    seg();
    if (tier === 2) {
      seg();
      const [x, y] = corePoint(ctx, r); // a shard falls out
      pm.rect(x, y, 3, 3, T);
      pm.set(x - 1, y, dk);
    }
  },
};

/** tatters — bitten edges + dangling threads (cloth, paper, wings) */
const tatters: WearAccent = {
  id: 'tatters',
  mark: (ctx, tier) => {
    const { pm, ramp, trim, a } = ctx;
    const r = ctx.S.use('tatter');
    const n = tier === 1 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const x = a.cx + Math.round((r() * 2 - 1) * a.bodyHalfW);
      bite(pm, x, a.bodyBottom + 2, tier === 1 ? 2 : 4);
      pm.set(x, a.bodyBottom - (tier === 1 ? 1 : 3), px(trim, 1)); // a loose thread end
    }
    if (tier === 2) {
      const x = a.cx + Math.round((r() * 2 - 1) * (a.bodyHalfW - 2));
      for (let k = 0; k < 5; k++) bite(pm, x + k, a.bodyBottom, 3); // a wide rip
      pm.set(x + 2, a.bodyBottom - 4, px(ramp, 0));
    }
  },
};

/** scorch — char smudges, then a burned-through hole with an ember rim */
const scorch: WearAccent = {
  id: 'scorch',
  mark: (ctx, tier) => {
    const { pm } = ctx;
    const r = ctx.S.use('scorch');
    const n = tier === 1 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const [x, y] = corePoint(ctx, r);
      if (pm.get(x, y) === T) continue;
      pm.set(x, y, px(RAMP.INK, 0));
      pm.set(x + 1, y, px(RAMP.INK, 1));
    }
    if (tier === 2) {
      const [x, y] = corePoint(ctx, r);
      pm.rect(x, y, 3, 3, T); // burned through
      pm.set(x - 1, y - 1, px(RAMP.ORANGE, 2)); // the ember rim
      pm.set(x + 3, y + 2, px(RAMP.ORANGE, 3));
    }
  },
};

/** chips — flaked corners; tier 2 knocks a real chunk off the shoulder */
const chips: WearAccent = {
  id: 'chips',
  mark: (ctx, tier) => {
    const { pm, ramp, a } = ctx;
    const r = ctx.S.use('chip');
    const n = tier === 1 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = a.cx + side * (a.bodyHalfW - 2);
      const y = a.bodyTop + 6 + Math.floor(r() * 16);
      bite(pm, x, y + 2, 2);
      pm.set(x - side, y, px(ramp, 0)); // the exposed under-edge
    }
    if (tier === 2) {
      const x = a.cx + (a.bodyHalfW - 4);
      for (let k = 0; k < 4; k++) bite(pm, x + 0, a.bodyTop + 6 + k, 3);
      pm.set(x - 1, a.bodyTop + 8, px(ramp, 0));
    }
  },
};

export const WEAR_ACCENTS: Record<string, WearAccent> = {
  dents, cracks, tatters, scorch, chips,
};
