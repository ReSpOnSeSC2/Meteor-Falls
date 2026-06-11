/**
 * Pixmap — the sprite engine's drawing surface.
 * A grid of master-palette indices (T = transparent). All art in the game is
 * authored through this tiny DSL, which makes palette conformance structural:
 * there is no API that accepts an RGB color.
 */
import { PALETTE, T } from '../palette';

export class Pixmap {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h).fill(T);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x: number, y: number, c: number): void {
    if (this.inBounds(x, y)) this.data[y * this.w + x] = c;
  }

  get(x: number, y: number): number {
    return this.inBounds(x, y) ? this.data[y * this.w + x] : T;
  }

  fill(c: number): this {
    this.data.fill(c);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: number): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }

  /** hollow rectangle */
  frame(x: number, y: number, w: number, h: number, c: number): this {
    for (let i = x; i < x + w; i++) {
      this.set(i, y, c);
      this.set(i, y + h - 1, c);
    }
    for (let j = y; j < y + h; j++) {
      this.set(x, j, c);
      this.set(x + w - 1, j, c);
    }
    return this;
  }

  hline(x: number, y: number, w: number, c: number): this {
    for (let i = 0; i < w; i++) this.set(x + i, y, c);
    return this;
  }

  vline(x: number, y: number, h: number, c: number): this {
    for (let j = 0; j < h; j++) this.set(x, y + j, c);
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: number): this {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
    return this;
  }

  /** filled ellipse, center cx/cy, radii rx/ry (in pixels, inclusive-ish) */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number): this {
    if (rx <= 0 || ry <= 0) return this;
    for (let j = -ry; j <= ry; j++) {
      for (let i = -rx; i <= rx; i++) {
        if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1.05) {
          this.set(Math.round(cx + i), Math.round(cy + j), c);
        }
      }
    }
    return this;
  }

  /** EarthBound's signature checkerboard shading (bushes, tree canopies) */
  checker(x: number, y: number, w: number, h: number, a: number, b: number, size = 1): this {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cell = (Math.floor(i / size) + Math.floor(j / size)) % 2;
        const cur = this.get(x + i, y + j);
        if (cur !== T) this.set(x + i, y + j, cell === 0 ? a : b);
      }
    }
    return this;
  }

  /** checker over a region regardless of current pixels */
  checkerFill(x: number, y: number, w: number, h: number, a: number, b: number, size = 1): this {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cell = (Math.floor(i / size) + Math.floor(j / size)) % 2;
        this.set(x + i, y + j, cell === 0 ? a : b);
      }
    }
    return this;
  }

  /** scatter single pixels (grass texture, freckles of noise) */
  scatter(rng: () => number, x: number, y: number, w: number, h: number, c: number, count: number): this {
    for (let n = 0; n < count; n++) {
      this.set(x + Math.floor(rng() * w), y + Math.floor(rng() * h), c);
    }
    return this;
  }

  /** Replace every occurrence of one palette index with another (recolor). */
  remap(from: number, to: number): this {
    for (let i = 0; i < this.data.length; i++) if (this.data[i] === from) this.data[i] = to;
    return this;
  }

  /**
   * Stamp a soft ground shadow into TRANSPARENT pixels only — call this
   * AFTER outline(), so shadows never grow outlines of their own (outlined
   * shadow puddles are a dead generated-art tell; EB never outlines shadows).
   */
  shadowUnder(cx: number, y: number, rx: number, c: number): this {
    for (let j = -1; j <= 1; j++) {
      const w = j === 0 ? rx : rx - 2 - Math.abs(j);
      for (let i = -w; i <= w; i++) {
        const x = cx + i;
        if (this.get(x, y + j) === T) this.set(x, y + j, c);
      }
    }
    return this;
  }

  /**
   * Hand-authored contour: stack hlines whose half-widths YOU specify, row
   * by row. This is how curves stay pixel-perfect (deliberate 1-2-3 run
   * steps) instead of the lumpy stair-stepping ellipse() produces.
   */
  contour(cx: number, topY: number, halfWidths: number[], c: number): this {
    halfWidths.forEach((hw, i) => {
      if (hw >= 0) this.hline(cx - hw, topY + i, hw * 2 + 1, c);
    });
    return this;
  }

  /**
   * Outline pass: every transparent pixel 4-adjacent to a solid pixel becomes
   * the outline color. Sprites should keep a 1px transparent margin.
   */
  outline(c: number): this {
    const src = this.data.slice();
    const at = (x: number, y: number): number =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : T;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y) !== T) continue;
        if (at(x - 1, y) !== T || at(x + 1, y) !== T || at(x, y - 1) !== T || at(x, y + 1) !== T) {
          this.data[y * this.w + x] = c;
        }
      }
    }
    return this;
  }

  blit(src: Pixmap, dx: number, dy: number): this {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        if (c !== T) this.set(dx + x, dy + y, c);
      }
    }
    return this;
  }

  flipX(): Pixmap {
    const out = new Pixmap(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        out.data[y * this.w + (this.w - 1 - x)] = this.data[y * this.w + x];
      }
    }
    return out;
  }

  clone(): Pixmap {
    const out = new Pixmap(this.w, this.h);
    out.data.set(this.data);
    return out;
  }

  /** shift contents (used for walk-cycle bobs); vacated pixels transparent */
  shifted(dx: number, dy: number): Pixmap {
    const out = new Pixmap(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.data[y * this.w + x];
        if (c !== T) out.set(x + dx, y + dy, c);
      }
    }
    return out;
  }

  drawTo(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (c === T) continue;
      const hex = PALETTE[c];
      img.data[i * 4] = parseInt(hex.slice(1, 3), 16);
      img.data[i * 4 + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[i * 4 + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, ox, oy);
  }

  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.w;
    canvas.height = this.h;
    const ctx = canvas.getContext('2d');
    if (ctx) this.drawTo(ctx, 0, 0);
    return canvas;
  }
}

/** deterministic RNG so generated art is stable run-to-run */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lay frames out in a grid on one canvas. All frames must share dimensions. */
export function framesToCanvas(
  frames: Pixmap[],
  cols: number,
): { canvas: HTMLCanvasElement; fw: number; fh: number; cols: number; rows: number } {
  const fw = frames[0].w;
  const fh = frames[0].h;
  const rows = Math.ceil(frames.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * fw;
  canvas.height = rows * fh;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    frames.forEach((f, i) => {
      // putImageData ignores prior content per-rect; frames are same size so safe
      f.drawTo(ctx, (i % cols) * fw, Math.floor(i / cols) * fh);
    });
  }
  return { canvas, fw, fh, cols, rows };
}
