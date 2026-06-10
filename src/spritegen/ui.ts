/**
 * UI art: EB beveled windows (9-slice), battle status boxes, odometer digit
 * drums, touch controls, cursors, and the title-screen painting.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { drawTextInto } from './font';

export function scalePixmap(src: Pixmap, n: number): Pixmap {
  const out = new Pixmap(src.w * n, src.h * n);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.data[y * src.w + x];
      if (c === T) continue;
      out.rect(x * n, y * n, n, n, c);
    }
  }
  return out;
}

/** classic EB dialogue window — 9-slice source, 8px corners */
export function drawWindowSlice(): Pixmap {
  const s = 24;
  const pm = new Pixmap(s, s);
  const fill = px(RAMP.NIGHT, 1);
  pm.rect(0, 0, s, s, fill);
  // rounded white double-border
  pm.frame(1, 1, s - 2, s - 2, C.white);
  pm.frame(2, 2, s - 4, s - 4, C.white);
  pm.frame(3, 3, s - 6, s - 6, px(RAMP.NIGHT, 0));
  // round the corners
  for (const [cx, cy, sx, sy] of [
    [0, 0, 1, 1],
    [s - 1, 0, -1, 1],
    [0, s - 1, 1, -1],
    [s - 1, s - 1, -1, -1],
  ]) {
    pm.set(cx, cy, T);
    pm.set(cx + sx, cy, T);
    pm.set(cx, cy + sy, T);
    pm.set(cx + sx, cy, T);
    pm.set(cx + sx, cy + sy, C.white);
    pm.set(cx + 2 * sx, cy, C.white);
    pm.set(cx, cy + 2 * sy, C.white);
  }
  return pm;
}

/** cream battle status box — 9-slice source */
export function drawBoxSlice(): Pixmap {
  const s = 24;
  const pm = new Pixmap(s, s);
  pm.rect(0, 0, s, s, px(RAMP.PAPER, 2));
  pm.frame(0, 0, s, s, C.outline);
  pm.frame(1, 1, s - 2, s - 2, C.white);
  pm.hline(1, s - 2, s - 2, px(RAMP.PAPER, 1));
  pm.vline(s - 2, 1, s - 2, px(RAMP.PAPER, 1));
  return pm;
}

/** odometer digit drum: 11 cells (0-9 then 0) of 8×12, light on dark */
export const ODO_CELL_W = 8;
export const ODO_CELL_H = 12;
export function drawOdometerStrip(): Pixmap {
  const pm = new Pixmap(ODO_CELL_W, ODO_CELL_H * 11);
  pm.rect(0, 0, ODO_CELL_W, ODO_CELL_H * 11, px(RAMP.NIGHT, 0));
  for (let i = 0; i < 11; i++) {
    const d = i % 10;
    drawTextInto(pm, String(d), 2, i * ODO_CELL_H + 3, C.white);
    pm.hline(0, i * ODO_CELL_H, ODO_CELL_W, px(RAMP.NIGHT, 1));
  }
  return pm;
}

/** D-pad for touch play */
export function drawDpad(): Pixmap {
  const s = 54;
  const arm = 18;
  const pm = new Pixmap(s, s);
  const g1 = px(RAMP.PAPER, 0);
  const g2 = px(RAMP.PAPER, 1);
  const cx = (s - arm) / 2;
  pm.rect(cx, 0, arm, s, g1);
  pm.rect(0, cx, s, arm, g1);
  pm.rect(cx + 2, 2, arm - 4, s - 4, g2);
  pm.rect(2, cx + 2, s - 4, arm - 4, g2);
  // arrows
  const a = px(RAMP.PAPER, 2);
  for (let i = 0; i < 4; i++) {
    pm.hline(s / 2 - 1 - i, 6 + i, 2 + i * 2, a); // up
    pm.hline(s / 2 - 1 - i, s - 7 - i, 2 + i * 2, a); // down
    pm.vline(6 + i, s / 2 - 1 - i, 2 + i * 2, a); // left
    pm.vline(s - 7 - i, s / 2 - 1 - i, 2 + i * 2, a); // right
  }
  pm.rect(cx + 4, cx + 4, arm - 8, arm - 8, g1);
  pm.outline(C.outline);
  return pm;
}

export function drawRoundButton(label: string, ramp: number): Pixmap {
  const s = 30;
  const pm = new Pixmap(s, s);
  pm.ellipse(s / 2 - 1, s / 2 - 1, 13, 13, px(ramp, 1));
  pm.ellipse(s / 2 - 1, s / 2 - 2, 12, 11, px(ramp, 2));
  drawTextInto(pm, label, s / 2 - 3, s / 2 - 4, C.white);
  pm.outline(C.outline);
  return pm;
}

export function drawStartPill(): Pixmap {
  const pm = new Pixmap(40, 14);
  pm.rect(2, 1, 36, 12, px(RAMP.PAPER, 0));
  pm.rect(3, 2, 34, 10, px(RAMP.PAPER, 1));
  pm.set(2, 1, T);
  pm.set(37, 1, T);
  pm.set(2, 12, T);
  pm.set(37, 12, T);
  drawTextInto(pm, 'MENU', 9, 4, C.white);
  pm.outline(C.outline);
  return pm;
}

/** EB pointing-hand cursor */
export function drawHandCursor(): Pixmap {
  const pm = new Pixmap(14, 10);
  const w = C.white;
  pm.rect(1, 4, 7, 4, w); // fist
  pm.rect(7, 3, 6, 2, w); // pointing finger
  pm.set(2, 3, w);
  pm.set(5, 3, w);
  pm.hline(8, 5, 3, px(RAMP.PAPER, 1));
  pm.outline(C.outline);
  return pm;
}

/** little phone icon (save points, finale callers) */
export function drawPhoneIcon(): Pixmap {
  const pm = new Pixmap(12, 12);
  pm.rect(2, 2, 8, 3, px(RAMP.RED, 2));
  pm.set(2, 4, px(RAMP.RED, 1));
  pm.set(9, 4, px(RAMP.RED, 1));
  pm.rect(4, 5, 4, 5, px(RAMP.RED, 2));
  pm.outline(C.outline);
  return pm;
}

/* ---------------------------------------------------------------- */
/* Title screen painting: the meteor streaking over Otterbrook        */

export function drawTitleArt(w: number, h: number): Pixmap {
  const pm = new Pixmap(w, h);
  const rng = mulberry32(1995);
  // night sky bands
  pm.rect(0, 0, w, h, px(RAMP.NIGHT, 0));
  pm.rect(0, Math.floor(h * 0.45), w, h, px(RAMP.NIGHT, 1));
  pm.rect(0, Math.floor(h * 0.7), w, h, px(RAMP.NIGHT, 2));
  // stars
  for (let i = 0; i < 90; i++) {
    const sx = Math.floor(rng() * w);
    const sy = Math.floor(rng() * h * 0.6);
    pm.set(sx, sy, rng() > 0.8 ? C.white : px(RAMP.NIGHT, 3));
  }
  // a few twinkles
  for (let i = 0; i < 6; i++) {
    const sx = 10 + Math.floor(rng() * (w - 20));
    const sy = 6 + Math.floor(rng() * h * 0.4);
    pm.set(sx, sy, C.white);
    pm.set(sx - 1, sy, px(RAMP.CYAN, 3));
    pm.set(sx + 1, sy, px(RAMP.CYAN, 3));
    pm.set(sx, sy - 1, px(RAMP.CYAN, 3));
    pm.set(sx, sy + 1, px(RAMP.CYAN, 3));
  }
  // THE METEOR — streaking down-right toward the hill
  const mx = Math.floor(w * 0.68);
  const my = Math.floor(h * 0.3);
  for (let t = 0; t < 70; t++) {
    const tx = mx - t * 2;
    const ty = my - t;
    const c = t < 12 ? px(RAMP.GOLD, 3) : t < 30 ? px(RAMP.ORANGE, 2) : px(RAMP.ORANGE, 1);
    pm.set(tx, ty, c);
    pm.set(tx + 1, ty, c);
    if (t < 25) pm.set(tx, ty + 1, px(RAMP.GOLD, 2));
    if (t % 5 === 2 && t > 8) pm.set(tx + Math.floor(rng() * 5) - 2, ty + Math.floor(rng() * 5) - 2, px(RAMP.GOLD, 3));
  }
  pm.ellipse(mx, my, 5, 4, px(RAMP.GOLD, 3));
  pm.ellipse(mx + 1, my, 2, 2, C.white);
  // Hickory Hill silhouette (right)
  for (let x = Math.floor(w * 0.55); x < w; x++) {
    const ht = Math.floor(h * 0.78 - Math.sin(((x - w * 0.55) / (w * 0.45)) * Math.PI) * h * 0.16);
    for (let y = ht; y < h; y++) pm.set(x, y, px(RAMP.NIGHT, 1));
  }
  // town silhouette (left): rooftops + lit windows
  const base = Math.floor(h * 0.84);
  let xCursor = 4;
  while (xCursor < w * 0.6) {
    const bw = 18 + Math.floor(rng() * 22);
    const bh = 12 + Math.floor(rng() * 18);
    pm.rect(xCursor, base - bh, bw, bh + (h - base), px(RAMP.NIGHT, 0));
    pm.hline(xCursor, base - bh, bw, px(RAMP.NIGHT, 2));
    // windows — someone's still awake
    if (rng() > 0.4) {
      const wx = xCursor + 3 + Math.floor(rng() * (bw - 8));
      pm.rect(wx, base - bh + 4, 3, 3, px(RAMP.GOLD, 2));
    }
    xCursor += bw + 2 + Math.floor(rng() * 6);
  }
  pm.rect(0, base, w, h - base, px(RAMP.NIGHT, 0));
  // crash glow on the hill
  pm.ellipse(Math.floor(w * 0.78), Math.floor(h * 0.74), 10, 4, px(RAMP.ORANGE, 1));
  pm.ellipse(Math.floor(w * 0.78), Math.floor(h * 0.74), 5, 2, px(RAMP.GOLD, 2));
  return pm;
}

/** "METEOR FALLS" logo: 5×7 font scaled ×3, gold gradient, drop shadow */
export function drawLogo(): Pixmap {
  const line1 = 'METEOR';
  const line2 = 'FALLS';
  const small = new Pixmap(line1.length * 6, 17);
  drawTextInto(small, line1, 0, 0, px(RAMP.GOLD, 3));
  drawTextInto(small, line2, 3, 9, px(RAMP.GOLD, 3));
  const big = scalePixmap(small, 3);
  // vertical gradient: top white-hot to gold to orange
  for (let y = 0; y < big.h; y++) {
    const band = y < 6 ? C.white : y < 12 ? px(RAMP.GOLD, 3) : y < 21 ? px(RAMP.GOLD, 2) : y < 27 ? px(RAMP.GOLD, 3) : y < 36 ? px(RAMP.GOLD, 2) : px(RAMP.ORANGE, 2);
    for (let x = 0; x < big.w; x++) {
      if (big.get(x, y) !== T) big.set(x, y, band);
    }
  }
  // drop shadow + outline
  const framed = new Pixmap(big.w + 4, big.h + 4);
  for (let y = 0; y < big.h; y++) {
    for (let x = 0; x < big.w; x++) {
      if (big.get(x, y) !== T) framed.set(x + 3, y + 3, C.outline);
    }
  }
  framed.blit(big, 1, 1);
  framed.outline(C.outline);
  return framed;
}
