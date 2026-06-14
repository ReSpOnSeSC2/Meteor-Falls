/**
 * THE MIXED-RUN LAYOUT — S18 Movement 23 (ADR-093). The heart of THE FLAIR WEAVE.
 *
 * A caption can mix two kinds of run: FONT-TEXT and FLAIR-SPRITE (`{g:NAME}`). This
 * pure, Phaser-free module splits a string into atoms (one per character, one per
 * glyph), word-wraps them across a monospace grid measured in CELLS (the retro
 * font is fixed-width — 1 char = 1 cell; a glyph reserves N cells), and produces:
 *
 *   · `text`    — the wrapped string with '\n' at breaks and a glyph's cells filled
 *                 by spaces (so the BitmapText reserves the slot, and the sprite is
 *                 drawn over it by the Phaser glue in flairline.ts);
 *   · `glyphs`  — each glyph's {name, col, line} placement, in cells;
 *   · `unitChars` — the reveal map: after K visual UNITS, `text.slice(0, unitChars[K])`
 *                 is visible. A glyph counts as ONE unit (so the existing caption-
 *                 timing formula still lands), even though it fills N cells of text.
 *
 * Unit-tested headlessly (runlayout.test.ts) so the layout is provably correct
 * without a WebGL canvas.
 */

/** one visual unit: a single character, or one inline flair glyph. */
export type Atom =
  | { kind: 'char'; ch: string }
  | { kind: 'glyph'; name: string; cells: number };

/** a placed glyph — column + line are in CELLS / lines; the glue scales to px. */
export interface LaidGlyph {
  name: string;
  /** left cell of the reserved slot on its line */
  col: number;
  /** line index (0-based) */
  line: number;
  /** how many cells the slot spans */
  cells: number;
  /** the atom (= unit) index — visible once revealed units > unit */
  unit: number;
}

export interface RunLayout {
  /** the wrapped text: '\n' at breaks, glyph slots filled with spaces */
  text: string;
  /** inline glyph placements */
  glyphs: LaidGlyph[];
  /** total visual units (chars + glyphs, each glyph counting ONCE) */
  units: number;
  /** unitChars[k] = chars of `text` visible after revealing k units (k = 0..units) */
  unitChars: number[];
  /** number of laid-out lines */
  lines: number;
}

const FLAIR_TOKEN = /\{g:(\w+)\}/g;

/**
 * Split a string into atoms. `cellsOf(name)` returns how many cells a glyph
 * reserves (the flair registry's glyphCells). An unknown glyph still produces a
 * glyph atom (the both-directions gate catches it at build; the glue draws a
 * "missing" tile) so the layout never throws on live text.
 */
export function parseAtoms(text: string, cellsOf: (name: string) => number): Atom[] {
  const atoms: Atom[] = [];
  let last = 0;
  FLAIR_TOKEN.lastIndex = 0;
  let mt: RegExpExecArray | null;
  const pushChars = (s: string): void => {
    for (const ch of s) atoms.push({ kind: 'char', ch });
  };
  while ((mt = FLAIR_TOKEN.exec(text)) !== null) {
    pushChars(text.slice(last, mt.index));
    const name = mt[1];
    atoms.push({ kind: 'glyph', name, cells: Math.max(1, cellsOf(name)) });
    last = mt.index + mt[0].length;
  }
  pushChars(text.slice(last));
  return atoms;
}

const atomCells = (a: Atom): number => (a.kind === 'glyph' ? a.cells : 1);

interface Word {
  /** atom indices that make up the word (no spaces / breaks) */
  parts: number[];
  width: number;
  /** the separator atom index BEFORE this word (a space or newline), or -1 */
  sepIndex: number;
  sepKind: 'none' | 'space' | 'break';
}

/**
 * Word-wrap atoms across `maxCols` cells. Greedy, classic: a word fits on the
 * current line or the separator before it becomes a line break. A glyph glues to
 * its neighbouring word exactly like a character would, so flair never wraps away
 * from the word it punctuates.
 */
export function layoutAtoms(atoms: Atom[], maxCols: number): RunLayout {
  const cols = Math.max(1, Math.floor(maxCols));

  // 1) group atoms into words separated by space / newline atoms
  const words: Word[] = [];
  let cur: Word | null = null;
  let pendingSep: Word['sepKind'] = 'none';
  let pendingSepIdx = -1;
  atoms.forEach((a, i) => {
    const isSpace = a.kind === 'char' && a.ch === ' ';
    const isBreak = a.kind === 'char' && a.ch === '\n';
    if (isSpace || isBreak) {
      if (cur) {
        words.push(cur);
        cur = null;
      }
      // a newline wins over a space if they stack; the latest separator's atom
      // index is the one we render as ' ' or '\n'
      pendingSep = isBreak ? 'break' : pendingSep === 'break' ? 'break' : 'space';
      pendingSepIdx = i;
      return;
    }
    if (!cur) {
      cur = { parts: [], width: 0, sepIndex: pendingSepIdx, sepKind: pendingSep };
      pendingSep = 'none';
      pendingSepIdx = -1;
    }
    cur.parts.push(i);
    cur.width += atomCells(a);
  });
  if (cur) words.push(cur);
  const trailingSepIdx = pendingSepIdx; // a string ending in a space/newline

  // 2) place the words, deciding each separator's render and each glyph's cell
  const renders: string[] = atoms.map(() => '');
  const glyphs: LaidGlyph[] = [];
  let line = 0;
  let col = 0;

  for (const w of words) {
    if (w.sepKind === 'break') {
      renders[w.sepIndex] = '\n';
      line += 1;
      col = 0;
    } else if (w.sepKind === 'space') {
      if (col === 0) {
        renders[w.sepIndex] = ''; // no leading indent at a line start
      } else if (col + 1 + w.width > cols) {
        renders[w.sepIndex] = '\n'; // wrap: the space becomes the break
        line += 1;
        col = 0;
      } else {
        renders[w.sepIndex] = ' ';
        col += 1;
      }
    }
    // lay the word's atoms down at the running cursor
    for (const idx of w.parts) {
      const a = atoms[idx];
      if (a.kind === 'glyph') {
        glyphs.push({ name: a.name, col, line, cells: a.cells, unit: idx });
        renders[idx] = ' '.repeat(a.cells);
        col += a.cells;
      } else {
        renders[idx] = a.ch;
        col += 1;
      }
    }
  }
  if (trailingSepIdx >= 0) renders[trailingSepIdx] = atoms[trailingSepIdx].kind === 'char' && (atoms[trailingSepIdx] as { ch: string }).ch === '\n' ? '\n' : ' ';

  // 3) build the reveal map: unitChars[k] = length of the first k atoms' renders
  const unitChars: number[] = new Array(atoms.length + 1);
  unitChars[0] = 0;
  for (let k = 1; k <= atoms.length; k++) unitChars[k] = unitChars[k - 1] + renders[k - 1].length;

  return {
    text: renders.join(''),
    glyphs,
    units: atoms.length,
    unitChars,
    lines: line + 1,
  };
}
