/**
 * THE FLAIR WEAVE — the completeness + distinctness MIRROR (S18 M23, ADR-093).
 *
 * The sibling of icons.test.ts / glyphs.test.ts. THE FLAIR WEAVE (spritegen/flair.ts)
 * draws a small vocabulary of inline pixel-emoji glyphs for the `{g:NAME}` token;
 * this suite is its slop-detector in vitest: every shipped glyph is byte-DISTINCT
 * (no two are the same drawing), the GLYPH_TOKENS vocabulary is pinned BOTH
 * directions against the drawn registry, the battle auto-flair maps reference real
 * glyphs, and the art law (palette-only, in-bounds, draws something) holds.
 */
import { describe, expect, it } from 'vitest';
import {
  GLYPH_TOKENS,
  flairGlyph,
  flairGlyphKey,
  glyphRegistryNames,
  glyphCells,
  isGlyph,
  FLAIR_BY_ELEMENT,
  FLAIR_BY_RESULT,
  GLYPH_W,
  GLYPH_H,
} from './flair';
import { PALETTE, T } from '../palette';
import type { Pixmap } from './pixmap';

const keyOf = (pm: Pixmap): string => `${pm.w}x${pm.h}:${Buffer.from(pm.data).toString('base64')}`;
const nonT = (pm: Pixmap): number => pm.data.reduce((n, c) => n + (c !== T ? 1 : 0), 0);

describe('GLYPH_TOKENS ⇄ the drawn registry (both directions)', () => {
  it('every declared token is actually drawn', () => {
    const drawn = new Set(glyphRegistryNames());
    for (const name of GLYPH_TOKENS) {
      expect(drawn.has(name), `GLYPH_TOKENS declares '${name}' but flair.ts draws no such glyph`).toBe(true);
      expect(isGlyph(name)).toBe(true);
    }
  });

  it('every drawn glyph is declared (no undeclared orphan)', () => {
    const declared = new Set<string>(GLYPH_TOKENS);
    for (const name of glyphRegistryNames()) {
      expect(declared.has(name), `flair.ts draws '${name}' but it is not in GLYPH_TOKENS`).toBe(true);
    }
  });

  it('the vocabulary is substantial (the weave needs breadth — ~40)', () => {
    expect(GLYPH_TOKENS.length).toBeGreaterThanOrEqual(40);
  });
});

describe('THE FLAIR WEAVE — every glyph is legible art', () => {
  it('every glyph fits the 11×11 cell and draws something', () => {
    for (const name of GLYPH_TOKENS) {
      const pm = flairGlyph(name);
      expect(pm.w, `glyph '${name}' width`).toBe(GLYPH_W);
      expect(pm.h, `glyph '${name}' height`).toBe(GLYPH_H);
      expect(nonT(pm), `glyph '${name}' draws nothing`).toBeGreaterThan(4);
    }
  });

  it('every pixel is a palette index (ADR-020 by construction)', () => {
    for (const name of GLYPH_TOKENS) {
      for (const c of flairGlyph(name).data) {
        expect(c === T || (c >= 0 && c < PALETTE.length), `glyph '${name}' emitted off-palette ${c}`).toBe(true);
      }
    }
  });

  it('each glyph reserves exactly 2 monospace text-cells', () => {
    for (const name of GLYPH_TOKENS) expect(glyphCells(name), `glyph '${name}' cells`).toBe(2);
  });

  it('flairGlyphKey is stable, id-scoped, and distinct from the M22 area prefix', () => {
    expect(flairGlyphKey('fire')).toBe('flair_fire');
    expect(flairGlyphKey('smash')).toBe('flair_smash');
    expect(flairGlyphKey('fire').startsWith('glyph_')).toBe(false); // never collide with glyph_<area>
  });

  it('is stable: the same glyph reproduces identical bytes', () => {
    expect(keyOf(flairGlyph('meteor'))).toBe(keyOf(flairGlyph('meteor')));
  });
});

describe('THE FLAIR WEAVE — slop-detector (no two glyphs share a drawing)', () => {
  it('every flair glyph is byte-distinct from every other', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const name of GLYPH_TOKENS) {
      const k = keyOf(flairGlyph(name));
      const prev = seen.get(k);
      if (prev) collisions.push(`'${name}' === '${prev}'`);
      else seen.set(k, name);
    }
    expect(collisions, `byte-identical flair glyphs: ${collisions.join(', ')}`).toEqual([]);
  });
});

describe('THE FLAIR WEAVE — the battle auto-flair maps name real glyphs', () => {
  it('every element maps to a real glyph', () => {
    const set = new Set<string>(GLYPH_TOKENS);
    for (const [el, g] of Object.entries(FLAIR_BY_ELEMENT)) {
      if (g) expect(set.has(g), `FLAIR_BY_ELEMENT['${el}'] = '${g}'`).toBe(true);
    }
  });

  it('every result maps to a real glyph', () => {
    const set = new Set<string>(GLYPH_TOKENS);
    for (const [res, g] of Object.entries(FLAIR_BY_RESULT)) {
      expect(set.has(g), `FLAIR_BY_RESULT['${res}'] = '${g}'`).toBe(true);
    }
  });

  it('the four damage elements each carry a glyph (§A11.5)', () => {
    for (const el of ['fire', 'freeze', 'volt', 'holy'] as const) {
      expect(FLAIR_BY_ELEMENT[el], `${el} has no battle flair`).toBeDefined();
    }
  });
});
