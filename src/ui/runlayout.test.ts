/**
 * THE MIXED-RUN LAYOUT — the correctness proof (S18 M23, ADR-093).
 *
 * Proves the heart of THE FLAIR WEAVE headlessly: a `{g:NAME}` token becomes ONE
 * visual unit (so the caption-timing formula still lands), the wrapped text
 * reserves the glyph's cells, the reveal map is monotonic and exact, and a plain
 * caption (no flair) is laid out byte-for-byte unchanged so the 461 existing
 * scripts keep their behaviour.
 */
import { describe, expect, it } from 'vitest';
import { parseAtoms, layoutAtoms } from './runlayout';

// every flair glyph reserves 2 cells (flair.ts glyphCells) — the test uses a fixed
// stub so the layout proof is independent of the art
const cells = (): number => 2;

describe('parseAtoms — text vs flair runs', () => {
  it('splits a string into one atom per char + one per glyph', () => {
    const atoms = parseAtoms('ab{g:fire}c', cells);
    expect(atoms.map((a) => a.kind)).toEqual(['char', 'char', 'glyph', 'char']);
    expect(atoms[2]).toEqual({ kind: 'glyph', name: 'fire', cells: 2 });
  });

  it('a plain string is all char atoms', () => {
    expect(parseAtoms('hi', cells)).toEqual([
      { kind: 'char', ch: 'h' },
      { kind: 'char', ch: 'i' },
    ]);
  });

  it('handles back-to-back and edge glyphs', () => {
    const atoms = parseAtoms('{g:star}{g:heart}', cells);
    expect(atoms.map((a) => a.kind)).toEqual(['glyph', 'glyph']);
  });
});

describe('layoutAtoms — a glyph is ONE visual unit', () => {
  it('units = chars + glyphs (the token collapses to one unit)', () => {
    const lay = layoutAtoms(parseAtoms('ab{g:fire}c', cells), 40);
    // 'ab' + glyph + 'c' = 4 units, NOT the 11 raw chars of "ab{g:fire}c"
    expect(lay.units).toBe(4);
  });

  it('reserves the glyph cells as spaces, glyph placed at its column', () => {
    const lay = layoutAtoms(parseAtoms('ab{g:fire}c', cells), 40);
    expect(lay.text).toBe('ab  c'); // 2 spaces hold the 2-cell glyph slot
    expect(lay.glyphs).toHaveLength(1);
    expect(lay.glyphs[0]).toMatchObject({ name: 'fire', col: 2, line: 0, cells: 2, unit: 2 });
  });

  it('the reveal map is monotonic and exact', () => {
    const lay = layoutAtoms(parseAtoms('ab{g:fire}c', cells), 40);
    expect(lay.unitChars).toEqual([0, 1, 2, 4, 5]); // glyph adds its 2 reserved chars at once
    expect(lay.unitChars[lay.units]).toBe(lay.text.length);
    for (let k = 1; k <= lay.units; k++) expect(lay.unitChars[k]).toBeGreaterThanOrEqual(lay.unitChars[k - 1]);
  });

  it('the glyph reveals as one unit (revealed > unit) alongside the letters', () => {
    const lay = layoutAtoms(parseAtoms('ab{g:fire}c', cells), 40);
    const g = lay.glyphs[0];
    // before its unit is reached the slot is blank text; AT its unit the slot + sprite appear together
    expect(lay.text.slice(0, lay.unitChars[2])).toBe('ab');
    expect(lay.text.slice(0, lay.unitChars[3])).toBe('ab  ');
    expect(3 > g.unit).toBe(true); // visible once 3 units are revealed
    expect(2 > g.unit).toBe(false);
  });
});

describe('layoutAtoms — word wrap', () => {
  it('breaks at the space that would overflow, and keeps a glyph glued to its word', () => {
    const lay = layoutAtoms(parseAtoms('alpha beta{g:star} gamma', cells), 10);
    // 'alpha' (5) + ' beta' + glyph(2) would exceed 10 cells → wrap before 'beta…'
    expect(lay.lines).toBeGreaterThanOrEqual(2);
    // the glyph stays on the same line as 'beta' (its word), never wraps away alone
    const g = lay.glyphs[0];
    const betaLine = lay.text.split('\n').findIndex((ln) => ln.includes('beta'));
    expect(g.line).toBe(betaLine);
  });

  it('no leading indent after a wrap', () => {
    const lay = layoutAtoms(parseAtoms('aaaaa bbbbb ccccc', cells), 6);
    for (const ln of lay.text.split('\n')) expect(ln.startsWith(' ')).toBe(false);
  });
});

describe('layoutAtoms — a plain caption is unchanged', () => {
  it('no flair → units = char count, text passes through, no glyphs', () => {
    const src = 'Jay tried the Casey swing!';
    const lay = layoutAtoms(parseAtoms(src, cells), 80);
    expect(lay.glyphs).toEqual([]);
    expect(lay.units).toBe(src.length);
    expect(lay.text).toBe(src); // one line, no wrap, byte-identical
    expect(lay.unitChars[lay.units]).toBe(src.length);
  });
});
