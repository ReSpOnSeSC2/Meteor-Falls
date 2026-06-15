/**
 * THE FLAIR LINE — S18 Movement 23 (ADR-093). The Phaser glue for THE FLAIR WEAVE.
 *
 * The pure layout (runlayout.ts) decides WHERE every character and inline glyph
 * sits, in cells. This binds that to a live BitmapText: it reads the font's real
 * on-screen metrics (so it is correct whatever scale Phaser renders the retro font
 * at), reserves each glyph's slot as spaces in the text, and overlays a tiny flair
 * sprite per glyph — revealed letter-by-letter as ONE timed visual unit each,
 * respecting word-wrap AND the A-to-fast-forward typewriter.
 *
 * Used by BOTH the Dialogue letter-by-letter reveal (windows.ts) and BattleScene
 * .print — the single mixed-run renderer the movement promised.
 */
import Phaser from 'phaser';
import { parseAtoms, layoutAtoms, type RunLayout } from './runlayout';
import { flairGlyphKey, glyphCells, glyphSize } from '../spritegen/flair';

const FLAIR_RE = /\{g:\w+\}/;

/** does this string carry any `{g:NAME}` flair token? (the cheap fast path: a
 *  caption with no flair takes the existing plain typewriter unchanged). */
export function hasFlair(s: string): boolean {
  return FLAIR_RE.test(s);
}

/** strip flair tokens to plain text — the fallback for any surface that is NOT
 *  the mixed renderer (a menu row, a toast) so a stray `{g:}` never shows raw. */
export function stripFlair(s: string): string {
  return s.replace(/\{g:\w+\}/g, '');
}

/** a glyph sits this many px below the line top so it reads centred on the caps
 *  of the retro font (whose drawn cell is top-weighted). Tuned on the contact
 *  sheet (the parked `dormant/sprite-tools/render-flair.ts`) and shared with it so the sheet faithfully previews in-game. */
export const GLYPH_Y_BIAS = 0;

interface Metrics {
  cw: number;
  lineHeight: number;
  scale: number;
}

function metricsOf(bt: Phaser.GameObjects.BitmapText): Metrics {
  const fd = bt.fontData;
  const size = fd.size && fd.size > 0 ? fd.size : 6;
  const scale = bt.fontSize / size;
  // the retro font is monospace with spacing.x = 0, so a char's drawn width IS
  // its advance — use 'M' (a full cell) as the measure
  const cell = fd.chars?.[77]?.width ?? size;
  return { cw: cell * scale, lineHeight: (fd.lineHeight ?? size + 2) * scale, scale };
}

/**
 * One flair line bound to a reused BitmapText. `set()` lays a string out and
 * spawns its glyph sprites (hidden); `reveal(units)` shows the first N units;
 * `clear()` tears the sprites down and restores the BitmapText's wrap. The owner
 * scene drives the unit counter exactly as it drove the char counter before —
 * with a glyph counted as ONE unit so the caption timing is unchanged.
 */
export class FlairLine {
  private imgs: Phaser.GameObjects.Image[] = [];
  private layout: RunLayout | null = null;
  private savedMaxWidth = 0;

  constructor(
    private scene: Phaser.Scene,
    private bt: Phaser.GameObjects.BitmapText,
    private opts: { maxWidthPx: number; depth: number; tint?: number } = { maxWidthPx: 240, depth: 0 },
  ) {}

  /** total visual units in the laid-out line (chars + glyphs, glyph = 1). */
  get units(): number {
    return this.layout?.units ?? 0;
  }

  /** lay out `text` (already vars()/glyphify()'d) and build its hidden sprites. */
  set(text: string): void {
    this.clear();
    const m = metricsOf(this.bt);
    const maxCols = Math.max(8, Math.floor(this.opts.maxWidthPx / m.cw));
    const atoms = parseAtoms(text, glyphCells);
    this.layout = layoutAtoms(atoms, maxCols);

    // our own newlines do the wrapping now — disable the BitmapText's
    this.savedMaxWidth = this.bt.maxWidth;
    this.bt.setMaxWidth(0).setText('');

    for (const g of this.layout.glyphs) {
      const { w, h } = glyphSize(g.name);
      const img = this.scene.add
        .image(0, 0, flairGlyphKey(g.name))
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(this.opts.depth)
        .setScale(m.scale)
        .setVisible(false);
      if (this.opts.tint !== undefined) img.setTint(this.opts.tint);
      const slotPx = g.cells * m.cw;
      img.x = Math.round(this.bt.x + g.col * m.cw + (slotPx - w * m.scale) / 2);
      img.y = Math.round(this.bt.y + g.line * m.lineHeight + (m.lineHeight - h * m.scale) / 2 + GLYPH_Y_BIAS);
      this.imgs.push(img);
    }
  }

  /** reveal the first `units` visual units — sets the text slice + sprite show. */
  reveal(units: number): void {
    const lay = this.layout;
    if (!lay) return;
    const n = Math.max(0, Math.min(units, lay.units));
    this.bt.setText(lay.text.slice(0, lay.unitChars[n]));
    lay.glyphs.forEach((g, i) => this.imgs[i]?.setVisible(n > g.unit));
  }

  /** tear down the sprites and give the BitmapText its wrap back. */
  clear(): void {
    for (const img of this.imgs) img.destroy();
    this.imgs = [];
    if (this.layout) {
      this.bt.setMaxWidth(this.savedMaxWidth);
      this.layout = null;
    }
  }
}
