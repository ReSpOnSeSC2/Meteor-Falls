/**
 * Pixmap — the sprite engine's drawing surface.
 * A grid of master-palette indices (T = transparent). All art in the game is
 * authored through this tiny DSL, which makes palette conformance structural:
 * there is no API that accepts an RGB color.
 */
import { PALETTE, T, C, SH, SHADES_PER_RAMP, pxr } from '../palette';

/**
 * The game's single light direction (ADR-101): top-left, everywhere. Every
 * lit-volume helper below shades toward the lower-right and highlights toward
 * the upper-left, so a mailbox, a llama, and a hero all catch the light from
 * the same place — the one change that reads as "designed" instead of flat.
 */
export const LIGHT = { x: -1, y: -1 } as const;

/** pick the 6-stop shade for a point on a lit sphere/ellipse. `u` is the
 *  normalized light-axis coordinate (+1 = full toward the light, −1 = away). */
function litBand(u: number): number {
  if (u > 0.6) return SH.HILITE;
  if (u > 0.3) return SH.LIT;
  if (u > 0.0) return SH.BASE;
  if (u > -0.3) return SH.MID;
  if (u > -0.6) return SH.DARK;
  return SH.SHADOW;
}

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

  /* ================================================================== */
  /* ADR-101 — THE LIGHTING MODEL. Fill a form straight to a lit volume   */
  /* off a 6-stop ramp: highlight on the top-left, core across the body,  */
  /* shadow on the lower-right. One call replaces the hand-laid           */
  /* lit-edge / core / shaded-edge dance and guarantees the light agrees. */

  /** a lit box: BASE core, LIT top+left bevel (HILITE corner), DARK
   *  bottom+right bevel (SHADOW corner). The designed-volume primitive. */
  litRect(x: number, y: number, w: number, h: number, ramp: number): this {
    if (w <= 0 || h <= 0) return this;
    this.rect(x, y, w, h, pxr(ramp, SH.BASE));
    this.hline(x, y + h - 1, w, pxr(ramp, SH.DARK)); // bottom in shade
    this.vline(x + w - 1, y, h, pxr(ramp, SH.DARK)); // right in shade
    this.set(x + w - 1, y + h - 1, pxr(ramp, SH.SHADOW)); // core-shadow corner
    this.hline(x, y, w, pxr(ramp, SH.LIT)); // top catches the light
    this.vline(x, y, h, pxr(ramp, SH.LIT)); // left catches the light
    this.set(x, y, pxr(ramp, SH.HILITE)); // hot corner
    return this;
  }

  /** a lit ellipse — a 6-band sphere when rx===ry. The fix for every flat
   *  blob (minis, fruit, heads, lamps): real round volume in one call. */
  litEllipse(cx: number, cy: number, rx: number, ry: number, ramp: number): this {
    if (rx <= 0 || ry <= 0) return this;
    for (let j = -ry; j <= ry; j++) {
      for (let i = -rx; i <= rx; i++) {
        const ni = i / rx;
        const nj = j / ry;
        if (ni * ni + nj * nj > 1.05) continue;
        const u = -(ni + nj) / Math.SQRT2; // +1 toward the light (upper-left)
        this.set(Math.round(cx + i), Math.round(cy + j), pxr(ramp, litBand(u)));
      }
    }
    return this;
  }

  /** a lit ball (litEllipse with rx===ry===r) */
  sphere(cx: number, cy: number, r: number, ramp: number): this {
    return this.litEllipse(cx, cy, r, r, ramp);
  }

  /**
   * Selective, RAMP-COLORED outline (ADR-101 / ADR-104, the EarthBound idiom):
   * the shadow rim (lower-right facing) stays true dark INK against the
   * background; the LIT rim (top-left facing) is recolored to the DARKEST shade
   * of the adjacent fill's OWN ramp — a dark red edge on a red cap, a tan edge
   * on cream — so the contour reads rounded and lit, never stamped. This is the
   * single biggest "blocky → crafted" win. Only writes the transparent margin,
   * so call it last and keep a 1px border.
   */
  outlineLit(dark = C.outline): this {
    const src = this.data.slice();
    const at = (x: number, y: number): number =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : T;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y) !== T) continue;
        const up = at(x, y - 1) !== T;
        const dn = at(x, y + 1) !== T;
        const lf = at(x - 1, y) !== T;
        const rt = at(x + 1, y) !== T;
        if (!up && !dn && !lf && !rt) continue;
        // solid below/right → this rim sits on the lit (upper-left) face
        const score = (dn ? 1 : 0) + (rt ? 1 : 0) - (up ? 1 : 0) - (lf ? 1 : 0);
        if (score > 0) {
          // colored edge: the darkest shade of the lit-facing fill's ramp
          const fill = dn ? at(x, y + 1) : rt ? at(x + 1, y) : lf ? at(x - 1, y) : at(x, y - 1);
          this.data[y * this.w + x] = pxr(Math.floor(fill / SHADES_PER_RAMP), SH.SHADOW);
        } else {
          this.data[y * this.w + x] = dark;
        }
      }
    }
    return this;
  }

  /**
   * Diagonal anti-alias (ADR-101): softens the hard INTERIOR corners of the
   * silhouette where the outline turns a sharp convex 90°. The fill pixel
   * tucked just inside such a corner is replaced with the soft ink, so the
   * staircase reads as a rounded bevel — WITHOUT ever adding a pixel outside
   * the contour (no prickly halo, no silhouette growth, background-independent).
   * It only rewrites FILL pixels (never the outline, never transparent), so the
   * shape and its 1px margin are preserved exactly.
   */
  aaDiag(ink = C.inkAA): this {
    const src = this.data.slice();
    const at = (x: number, y: number): number =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : T;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y) === T) continue; // candidate must be solid (a fill pixel)
        // COLOR-AGNOSTIC convex-corner test (cooperates with the ramp-colored
        // outline, whose edge pixels are no longer a fixed ink): the two sides
        // toward the corner are solid, the diagonal-out is exterior (T), and
        // there is mass BEHIND us (inward diagonal solid) — which proves we're
        // the fill pixel tucked inside the corner, not a thin border pixel.
        for (const [dx, dy] of [
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ] as const) {
          if (
            at(x + dx, y + dy) === T &&
            at(x + dx, y) !== T &&
            at(x, y + dy) !== T &&
            at(x - dx, y - dy) !== T
          ) {
            this.data[y * this.w + x] = ink;
            break;
          }
        }
      }
    }
    return this;
  }

  /* ================================================================== */
  /* ADR-104 — named shading helpers the character generator calls       */
  /* directly (Prompt 2). All operate in palette indices, never RGB.     */

  /** aaEdge — public name for the diagonal stair-corner smoother (alias of
   *  aaDiag): drop an intermediate-shade pixel on convex stair tips. */
  aaEdge(ink = C.inkAA): this {
    return this.aaDiag(ink);
  }

  /**
   * softShade — re-shade an already-filled region into a smooth highlight →
   * core → shadow gradient off a 6-deep ramp, light from the top-left (the one
   * game light). Only repaints NON-transparent pixels, so it shades the form
   * the silhouette already laid down without spilling past it.
   */
  softShade(x: number, y: number, w: number, h: number, ramp: number, lightDir: 'topleft' | 'top' = 'topleft'): this {
    const cx = x + (w - 1) / 2;
    const cy = y + (h - 1) / 2;
    const rx = Math.max(1, (w - 1) / 2);
    const ry = Math.max(1, (h - 1) / 2);
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (this.get(i, j) === T) continue;
        const ni = (i - cx) / rx;
        const nj = (j - cy) / ry;
        const u = lightDir === 'top' ? -nj : -(ni + nj) / Math.SQRT2;
        this.set(i, j, pxr(ramp, litBand(u)));
      }
    }
    return this;
  }

  /**
   * rimLight — lay a 1px lighter-shade rim along the LIT (top-left) silhouette
   * edge of the form: any solid pixel whose top OR left neighbor is transparent
   * becomes the ramp's LIT shade. The catch of light that rounds a shoulder.
   */
  rimLight(ramp: number, shade: number = SH.LIT): this {
    const src = this.data.slice();
    const at = (x: number, y: number): number =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : T;
    const rim = pxr(ramp, shade);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y) === T) continue;
        if (at(x, y - 1) === T || at(x - 1, y) === T) this.data[y * this.w + x] = rim;
      }
    }
    return this;
  }

  /** dither2 — a tight 1px checker between two adjacent shades over the
   *  region's existing pixels (a gentle gradient seam, ADR-020 one-seam rule). */
  dither2(x: number, y: number, w: number, h: number, a: number, b: number): this {
    return this.checker(x, y, w, h, a, b, 1);
  }

  /**
   * The standard finishing pass (ADR-101): selective outline + diagonal AA.
   * Generators call this instead of `outline(C.outline)` to get the lit rim
   * and the de-jagged edge in one line. `lit:false` keeps a flat dark outline
   * (tiny/UI sprites); `aa:false` skips the AA (sprites with no diagonals).
   */
  finish(opts?: { lit?: boolean; aa?: boolean }): this {
    if (opts?.lit === false) this.outline(C.outline);
    else this.outlineLit();
    if (opts?.aa !== false) this.aaDiag();
    return this;
  }

  /**
   * Palette-swap one whole ramp for another (ADR-101) — every shade maps to
   * the SAME shade slot of the target ramp, so a form's lighting survives the
   * recolor intact. The cheap-variety primitive: one generator → many looks.
   */
  swapRamp(from: number, to: number): this {
    const f0 = from * SHADES_PER_RAMP;
    const t0 = to * SHADES_PER_RAMP;
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (c !== T && c >= f0 && c < f0 + SHADES_PER_RAMP) this.data[i] = t0 + (c - f0);
    }
    return this;
  }

  /**
   * Recolor several ramps at once from a {fromRamp: toRamp} map, in a single
   * pass (no chaining — a ramp that is both a source and a target can't double-
   * remap). The engine behind palette-swap NPC/enemy variety.
   */
  recolor(map: Record<number, number>): this {
    const lut = new Int16Array(SHADES_PER_RAMP * 16);
    for (let r = 0; r < 16; r++) {
      const dst = map[r] ?? r;
      for (let s = 0; s < SHADES_PER_RAMP; s++) lut[r * SHADES_PER_RAMP + s] = dst * SHADES_PER_RAMP + s;
    }
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (c !== T && c < lut.length) this.data[i] = lut[c];
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

/**
 * Palette-swap a whole animation sheet (ADR-101): clone each frame and remap
 * its ramps, so ONE generator yields many recolors — the cheap NPC/enemy/crowd
 * variety EarthBound's overworld leans on. Because recolor preserves the shade
 * SLOT, every variant keeps its lighting (highlight → core → shadow) intact.
 */
export function recolorFrames(frames: Pixmap[], map: Record<number, number>): Pixmap[] {
  return frames.map((f) => f.clone().recolor(map));
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
