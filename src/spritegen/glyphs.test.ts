/**
 * THE GLYPH FORGE — the completeness + distinctness MIRROR (S18 M22, ADR-092).
 *
 * The sibling of icons.test.ts. THE GLYPH FORGE (spritegen/glyphforge.ts) stamps
 * a decorative, REGION-TRUE script run for every canon §A5/§A6 area; this suite
 * is its slop-detector in vitest alone: every shipped area run AND every forge
 * gallery sample is byte-DISTINCT (no two scripts are the same drawing), the
 * forge writes a distinct grammar for EVERY planned family, each of the three
 * layers (script / ramp / seed) actually differentiates, the GLYPH_SCRIPT
 * registry is pinned BOTH directions against CANON_AREAS, and the art law
 * (palette-only, in-bounds) + determinism hold.
 */
import { describe, expect, it } from 'vitest';
import {
  forgeGlyphRun,
  forgeGlyphGallery,
  areaGlyphRun,
  GLYPH_SCRIPT,
  SCRIPT_CATALOG,
  type GlyphSpec,
} from './glyphforge';
import { REGION_RAMPS } from './iconforge';
import { CANON_AREAS } from './buildings';
import { PALETTE, T } from '../palette';
import type { Pixmap } from './pixmap';
import type { ItemBand } from '../schemas';

/** a content fingerprint: dimensions + bytes. Two runs share it only if they are
 *  the SAME drawing — the lazy-reuse / palette-swap detector. */
const keyOf = (pm: Pixmap): string => `${pm.w}x${pm.h}:${Buffer.from(pm.data).toString('base64')}`;
const nonT = (pm: Pixmap): number => pm.data.reduce((n, c) => n + (c !== T ? 1 : 0), 0);

describe('GLYPH_SCRIPT ⇄ CANON_AREAS (both directions)', () => {
  it('every canon area owns a region-true script', () => {
    for (const area of CANON_AREAS) {
      expect(GLYPH_SCRIPT[area], `canon area '${area}' has no GLYPH_SCRIPT row — give it a region-true script`).toBeDefined();
    }
  });

  it('every GLYPH_SCRIPT row names a real canon area (no orphan)', () => {
    const canon = new Set(CANON_AREAS);
    for (const area of Object.keys(GLYPH_SCRIPT)) {
      expect(canon.has(area), `GLYPH_SCRIPT row '${area}' is an orphan — add it to CANON_AREAS or retire it`).toBe(true);
    }
  });

  it('every area script names a real family and a well-formed band', () => {
    const fams = new Set<string>(SCRIPT_CATALOG);
    for (const [area, spec] of Object.entries(GLYPH_SCRIPT)) {
      expect(fams.has(spec.script), `area '${area}' names unknown script '${spec.script}'`).toBe(true);
      expect(REGION_RAMPS[spec.band], `area '${area}' band '${spec.band}' has no ramp pool`).toBeDefined();
    }
  });
});

describe('THE GLYPH FORGE — every family writes, on-theme', () => {
  it('the family library is substantial (17 areas need region-true breadth)', () => {
    expect(SCRIPT_CATALOG.length).toBeGreaterThanOrEqual(12);
  });

  it('every gallery sample draws content inside its run bounds', () => {
    for (const g of forgeGlyphGallery()) {
      expect(g.pm.w, `glyph '${g.script}' width`).toBeGreaterThan(0);
      expect(g.pm.h, `glyph '${g.script}' height`).toBeLessThanOrEqual(16);
      // the Hush's script is sparse by design (§A11.3) — it still must write SOMETHING
      expect(nonT(g.pm), `glyph '${g.script}' draws nothing`).toBeGreaterThan(3);
    }
  });

  it('every area run draws region-true content', () => {
    for (const area of CANON_AREAS) {
      const pm = areaGlyphRun(area);
      expect(nonT(pm), `area '${area}' glyph run draws nothing`).toBeGreaterThan(3);
    }
  });

  it('every forged pixel is a palette index (ADR-020 by construction)', () => {
    const all = [...forgeGlyphGallery().map((g) => g.pm), ...CANON_AREAS.map(areaGlyphRun)];
    for (const pm of all) {
      for (const c of pm.data) {
        expect(c === T || (c >= 0 && c < PALETTE.length), `off-palette index ${c} emitted`).toBe(true);
      }
    }
  });

  it('is deterministic: (spec) → identical bytes, twice', () => {
    const spec: GlyphSpec = { script: 'runic', band: 'ch4', seed: 'kvisthavn', length: 4 };
    expect(keyOf(forgeGlyphRun(spec))).toBe(keyOf(forgeGlyphRun(spec)));
    expect(keyOf(areaGlyphRun('mars'))).toBe(keyOf(areaGlyphRun('mars')));
  });
});

describe('THE GLYPH FORGE — the three layers each differentiate', () => {
  it('layer 1 (script family): every grammar is a distinct drawing', () => {
    // hold band/seed/length fixed; only the family varies → all must differ
    const keys = SCRIPT_CATALOG.map((script) => keyOf(forgeGlyphRun({ script, band: 'ch1', seed: 'fixed', length: 4 })));
    expect(new Set(keys).size, 'two script families collapsed to one drawing').toBe(SCRIPT_CATALOG.length);
  });

  it('layer 2 (region ramp): the same script reads differently across regions', () => {
    const bands = Object.keys(REGION_RAMPS) as ItemBand[];
    const keys = bands.map((band) => keyOf(forgeGlyphRun({ script: 'cursive', band, seed: 'banner', length: 5 })));
    // the region pools differ in membership, so a fixed script is not one colour worldwide
    expect(new Set(keys).size).toBeGreaterThanOrEqual(5);
  });

  it('layer 3 (seed): a different id lays out a different run', () => {
    const run = (seed: string): string => keyOf(forgeGlyphRun({ script: 'barscript', band: 'ch7', seed, length: 6 }));
    expect(new Set([run('shop'), run('temple'), run('palace')]).size, 'the seed did not differentiate runs').toBe(3);
  });

  it('two areas sharing a family are still byte-distinct (seed = area id)', () => {
    // kvisthavn & lilleby both write `runic`; foggybottom & wintermoor both `fraktur`
    expect(keyOf(areaGlyphRun('kvisthavn')) === keyOf(areaGlyphRun('lilleby'))).toBe(false);
    expect(keyOf(areaGlyphRun('foggybottom')) === keyOf(areaGlyphRun('wintermoor'))).toBe(false);
  });
});

describe('THE GLYPH FORGE — slop-detector across every shipped script', () => {
  it('no area run and no gallery sample share a drawing', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    const add = (label: string, pm: Pixmap): void => {
      const k = keyOf(pm);
      const prev = seen.get(k);
      if (prev) collisions.push(`${label} === ${prev}`);
      else seen.set(k, label);
    };
    for (const area of CANON_AREAS) add(`area:${area}`, areaGlyphRun(area));
    for (const g of forgeGlyphGallery()) add(`forge:${g.script}`, g.pm);
    expect(collisions, `byte-identical glyph runs: ${collisions.join(', ')}`).toEqual([]);
  });

  it('the Hush is sparser than a living region (§A11.3 read at the pixel)', () => {
    const mars = nonT(areaGlyphRun('mars'));
    const zanzibel = nonT(areaGlyphRun('zanzibel'));
    expect(mars, 'the Mars dead-interface script should be the sparsest writing in the game').toBeLessThan(zanzibel);
  });
});
