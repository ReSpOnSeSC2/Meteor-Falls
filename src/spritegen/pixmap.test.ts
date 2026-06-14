/**
 * ADR-101 — the Pixmap lighting / AA / palette-swap vocabulary. These are the
 * structural primitives the whole sprite engine now leans on, so their
 * contracts (palette-conformance, light direction, single-pass recolor) are
 * pinned here.
 */
import { describe, it, expect } from 'vitest';
import { Pixmap } from './pixmap';
import { PALETTE, T, RAMP, C, px, pxr, SH } from '../palette';

const paletteOk = (pm: Pixmap): boolean =>
  pm.data.every((c) => c === T || (c >= 0 && c < PALETTE.length));

describe('ADR-101 — lit volumes', () => {
  it('litRect / sphere only emit master-palette indices', () => {
    const a = new Pixmap(20, 20).litRect(2, 2, 16, 16, RAMP.RED);
    const b = new Pixmap(20, 20).sphere(10, 10, 8, RAMP.CYAN);
    expect(paletteOk(a)).toBe(true);
    expect(paletteOk(b)).toBe(true);
  });

  it('the light comes from the top-left: upper-left is lighter than lower-right', () => {
    const pm = new Pixmap(20, 20).sphere(10, 10, 8, RAMP.BLUE);
    const ul = pm.get(5, 5); // toward the light
    const lr = pm.get(14, 14); // away from it
    // shade slot rises toward the light (BASE=3 … HILITE=5 vs SHADOW=0 … DARK=1)
    expect(ul % 6).toBeGreaterThan(lr % 6);
  });

  it('litRect puts the hot corner top-left and the core shadow bottom-right', () => {
    const pm = new Pixmap(10, 10).litRect(0, 0, 10, 10, RAMP.GRASS);
    expect(pm.get(0, 0)).toBe(pxr(RAMP.GRASS, SH.HILITE));
    expect(pm.get(9, 9)).toBe(pxr(RAMP.GRASS, SH.SHADOW));
  });
});

describe('ADR-101 — selective outline + diagonal AA', () => {
  it('outlineLit only writes the transparent margin (never touches fill)', () => {
    const pm = new Pixmap(16, 16);
    pm.rect(4, 4, 8, 8, px(RAMP.GOLD, 2));
    const before = pm.clone();
    pm.outlineLit();
    for (let i = 0; i < before.data.length; i++) {
      if (before.data[i] !== T) expect(pm.data[i]).toBe(before.data[i]);
    }
    expect(paletteOk(pm)).toBe(true);
  });

  it('aaDiag rounds INTERIOR corners and never grows the silhouette', () => {
    const pm = new Pixmap(10, 10);
    pm.rect(3, 3, 4, 4, px(RAMP.GOLD, 2)); // fill block at 3..6
    pm.outline(C.outline); // a 1px outline ring around it
    const before = pm.clone();
    const solidBefore = before.data.filter((c) => c !== T).length;
    pm.aaDiag();
    // the fill pixel tucked inside the top-left convex corner is now soft ink…
    expect(pm.get(3, 3)).toBe(C.inkAA);
    // …the exterior margin is untouched (no prickly halo, no growth)…
    expect(pm.get(2, 2)).toBe(T);
    const solidAfter = pm.data.filter((c) => c !== T).length;
    expect(solidAfter).toBe(solidBefore);
  });
});

describe('ADR-101 — palette-swap', () => {
  it('swapRamp maps a ramp to another, shade slot intact (lighting survives)', () => {
    const pm = new Pixmap(4, 4);
    pm.set(0, 0, pxr(RAMP.RED, SH.HILITE));
    pm.set(1, 0, pxr(RAMP.RED, SH.SHADOW));
    pm.set(2, 0, pxr(RAMP.GRASS, SH.BASE)); // a different ramp — untouched
    pm.swapRamp(RAMP.RED, RAMP.BLUE);
    expect(pm.get(0, 0)).toBe(pxr(RAMP.BLUE, SH.HILITE));
    expect(pm.get(1, 0)).toBe(pxr(RAMP.BLUE, SH.SHADOW));
    expect(pm.get(2, 0)).toBe(pxr(RAMP.GRASS, SH.BASE));
  });

  it('recolor is single-pass: a from/to that overlaps does not double-remap', () => {
    const pm = new Pixmap(4, 4);
    pm.set(0, 0, pxr(RAMP.RED, SH.BASE));
    pm.set(1, 0, pxr(RAMP.BLUE, SH.BASE));
    pm.recolor({ [RAMP.RED]: RAMP.BLUE, [RAMP.BLUE]: RAMP.RED }); // a true swap
    expect(pm.get(0, 0)).toBe(pxr(RAMP.BLUE, SH.BASE));
    expect(pm.get(1, 0)).toBe(pxr(RAMP.RED, SH.BASE));
  });

  it('recolor leaves transparent pixels transparent', () => {
    const pm = new Pixmap(4, 4); // all T
    pm.recolor({ [RAMP.RED]: RAMP.BLUE });
    expect(pm.data.every((c) => c === T)).toBe(true);
  });
});
