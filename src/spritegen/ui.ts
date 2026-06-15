/**
 * UI art: EB beveled windows (9-slice), battle status boxes, odometer digit
 * drums, touch controls, cursors, and the title-screen painting.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { drawTextInto } from './font';
import { ART_SCALE } from './scale';

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
/**
 * S14b — WINDOW FLAVORS (Bible Prompt 6: "configurable palette per save
 * file (classic blue default + 3 flavors)" — the EB flavor menu, finally).
 * Each flavor recolors the window FACE and the inner accent ring; the
 * white double-border stays white in every flavor, exactly like EB.
 * Index 0 must remain the classic night-blue (every shipped screenshot).
 */
export interface WindowFlavor {
  name: string;
  /** face fill + the inner accent ring [face, accent] palette indices */
  face: number;
  accent: number;
}

export const WINDOW_FLAVORS: WindowFlavor[] = [
  { name: 'CLASSIC', face: px(RAMP.NIGHT, 1), accent: px(RAMP.NIGHT, 0) },
  { name: 'MINT', face: px(RAMP.FOREST, 0), accent: px(RAMP.GRASS, 1) },
  { name: 'STRAWBERRY', face: px(RAMP.RED, 0), accent: px(RAMP.MAGENTA, 1) },
  { name: 'BANANA', face: px(RAMP.EARTH, 0), accent: px(RAMP.GOLD, 1) },
];

/** the persisted-on-the-save flavor flag (plain number — no save step) */
export const WIN_FLAVOR_FLAG = 'win_flavor';

export function drawWindowSlice(flavor = 0): Pixmap {
  const s = 24;
  const pm = new Pixmap(s, s);
  const fv = WINDOW_FLAVORS[flavor] ?? WINDOW_FLAVORS[0];
  const fill = fv.face;
  pm.rect(0, 0, s, s, fill);
  // rounded white double-border
  pm.frame(1, 1, s - 2, s - 2, C.white);
  pm.frame(2, 2, s - 4, s - 4, C.white);
  pm.frame(3, 3, s - 6, s - 6, fv.accent);
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

/**
 * odometer digit drum: 11 cells (0-9 then 0) of 8×12, light on dark.
 *
 * The exported cell dims are RUNTIME px (× ART_SCALE): BattleScene's OdoDisplay
 * consumes them to place/mask the drum on screen, so they must match the
 * upscaled 'odo' texture. The DRAW below is FROZEN procedural art — it builds at
 * the NATIVE 8×12 and the boot seam (addPixmap) upscales the Pixmap ×ART_SCALE,
 * so it keeps the native literals (ODO_NATIVE_*) and never the runtime size.
 */
const ODO_NATIVE_W = 8;
const ODO_NATIVE_H = 12;
export const ODO_CELL_W = ODO_NATIVE_W * ART_SCALE;
export const ODO_CELL_H = ODO_NATIVE_H * ART_SCALE;
export function drawOdometerStrip(): Pixmap {
  const pm = new Pixmap(ODO_NATIVE_W, ODO_NATIVE_H * 11);
  pm.rect(0, 0, ODO_NATIVE_W, ODO_NATIVE_H * 11, px(RAMP.NIGHT, 0));
  for (let i = 0; i < 11; i++) {
    const d = i % 10;
    drawTextInto(pm, String(d), 2, i * ODO_NATIVE_H + 3, C.white);
    pm.hline(0, i * ODO_NATIVE_H, ODO_NATIVE_W, px(RAMP.NIGHT, 1));
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

/** §A4.5 SUNNY SIDE (S14): the little sun by the party strip */
export function drawSunIcon(): Pixmap {
  const pm = new Pixmap(12, 12);
  const sun = px(RAMP.GOLD, 2);
  pm.ellipse(5, 5, 3, 3, sun);
  pm.set(4, 4, px(RAMP.GOLD, 3)); // the shine
  // eight rays, hand-placed
  pm.set(5, 0, sun);
  pm.set(5, 10, sun);
  pm.set(0, 5, sun);
  pm.set(10, 5, sun);
  pm.set(1, 1, sun);
  pm.set(9, 1, sun);
  pm.set(1, 9, sun);
  pm.set(9, 9, sun);
  pm.outline(C.outline);
  return pm;
}

export const LOCKET_MAX_EMBERS = 10;

function drawTinyStar(pm: Pixmap, x: number, y: number, c: number): void {
  pm.set(x, y - 2, c);
  pm.set(x, y + 2, c);
  pm.set(x - 2, y, c);
  pm.set(x + 2, y, c);
  pm.set(x, y, C.white);
  pm.set(x - 1, y - 1, c);
  pm.set(x + 1, y - 1, c);
  pm.set(x - 1, y + 1, c);
  pm.set(x + 1, y + 1, c);
}

function drawInstrument(pm: Pixmap, n: number, x: number, y: number, lit: boolean): void {
  const body = lit ? px(RAMP.GOLD, 2) : px(RAMP.PAPER, 1);
  const trim = lit ? px(RAMP.CYAN, 2) : px(RAMP.NIGHT, 3);
  switch (n % LOCKET_MAX_EMBERS) {
    case 0: // bell
      pm.hline(x - 2, y + 2, 5, body);
      pm.contour(x, y - 2, [1, 2, 2, 2], body);
      pm.set(x, y + 3, trim);
      break;
    case 1: // drum
      pm.frame(x - 3, y - 2, 7, 5, body);
      pm.hline(x - 2, y - 1, 5, trim);
      pm.line(x - 3, y + 4, x + 3, y - 4, body);
      break;
    case 2: // flute
      pm.line(x - 4, y + 2, x + 4, y - 2, body);
      pm.set(x - 1, y, trim);
      pm.set(x + 2, y - 1, trim);
      break;
    case 3: // horn
      pm.line(x - 3, y + 1, x + 2, y - 2, body);
      pm.contour(x + 3, y - 3, [1, 2, 1], body);
      pm.set(x - 4, y + 2, trim);
      break;
    case 4: // harp
      pm.vline(x - 3, y - 4, 8, body);
      pm.line(x - 3, y - 4, x + 3, y + 2, body);
      pm.line(x - 2, y - 1, x + 1, y + 2, trim);
      pm.line(x - 1, y - 3, x + 2, y, trim);
      break;
    case 5: // tambourine
      pm.ellipse(x, y, 4, 3, body);
      pm.set(x, y, T);
      pm.set(x - 3, y, trim);
      pm.set(x + 3, y, trim);
      break;
    case 6: // keys
      pm.rect(x - 4, y - 2, 8, 4, body);
      for (let i = -3; i <= 3; i += 2) pm.vline(x + i, y - 2, 4, trim);
      break;
    case 7: // fiddle
      pm.ellipse(x - 1, y - 1, 2, 3, body);
      pm.vline(x + 2, y - 5, 7, body);
      pm.line(x - 4, y + 4, x + 4, y - 4, trim);
      break;
    case 8: // shaker
      pm.line(x - 2, y + 4, x + 2, y - 4, body);
      pm.ellipse(x + 2, y - 4, 2, 2, trim);
      break;
    default: // voice
      pm.ellipse(x - 2, y, 2, 3, body);
      pm.ellipse(x + 2, y, 2, 3, body);
      pm.set(x - 2, y, trim);
      pm.set(x + 2, y, trim);
      break;
  }
}

export function drawLocketState(embers: number): Pixmap {
  const n = Math.max(0, Math.min(LOCKET_MAX_EMBERS, Math.floor(embers)));
  const pm = new Pixmap(96, 72);
  pm.ellipse(48, 64, 28, 5, px(RAMP.INK, 0));
  // chain and bail
  for (let i = 0; i < 9; i++) {
    const lx = 26 + i * 5;
    pm.ellipse(lx, 8 + (i % 2), 3, 2, px(RAMP.GOLD, i % 2 === 0 ? 1 : 2));
  }
  pm.rect(43, 11, 10, 7, px(RAMP.GOLD, 2));
  pm.frame(44, 12, 8, 5, px(RAMP.GOLD, 3));
  // locket body
  pm.ellipse(48, 39, 31, 25, px(RAMP.GOLD, 1));
  pm.ellipse(48, 36, 27, 22, px(RAMP.GOLD, 2));
  pm.ellipse(48, 37, 22, 17, px(RAMP.NIGHT, 1));
  pm.ellipse(48, 37, 18, 13, px(RAMP.NIGHT, 0));
  drawTinyStar(pm, 48, 36, px(RAMP.GOLD, 3));
  pm.vline(48, 20, 37, px(RAMP.GOLD, 1));

  const sockets: Array<[number, number]> = [
    [33, 24], [43, 22], [53, 22], [63, 24], [68, 35],
    [63, 47], [53, 51], [43, 51], [33, 47], [28, 35],
  ];
  sockets.forEach(([sx, sy], i) => {
    const lit = i < n;
    pm.ellipse(sx, sy, 6, 5, lit ? px(RAMP.GOLD, 2) : px(RAMP.NIGHT, 2));
    pm.ellipse(sx, sy, 4, 3, lit ? px(RAMP.ORANGE, 2) : px(RAMP.NIGHT, 1));
    drawInstrument(pm, i, sx, sy, lit);
    if (lit) pm.set(sx - 2, sy - 3, C.white);
  });
  if (n === LOCKET_MAX_EMBERS) {
    for (const [sx, sy] of sockets) drawTinyStar(pm, sx, sy, px(RAMP.GOLD, 3));
  }
  pm.outline(C.outline);
  return pm;
}

export function drawLocketPauseFrame(): Pixmap {
  const pm = new Pixmap(230, 124);
  pm.rect(0, 0, pm.w, pm.h, px(RAMP.NIGHT, 1));
  pm.frame(0, 0, pm.w, pm.h, C.outline);
  pm.frame(1, 1, pm.w - 2, pm.h - 2, C.white);
  pm.frame(3, 3, pm.w - 6, pm.h - 6, px(RAMP.GOLD, 2));
  pm.rect(10, 10, pm.w - 20, pm.h - 20, px(RAMP.NIGHT, 0));
  drawTextInto(pm, 'THE STAR LOCKET', 69, 15, px(RAMP.GOLD, 3));
  pm.hline(24, 29, 182, px(RAMP.GOLD, 1));
  pm.hline(24, 98, 182, px(RAMP.GOLD, 1));
  return pm;
}

/* ---------------------------------------------------------------- */
/* Title screen painting: the meteor streaking over Otterbrook        */

export function drawTitleArt(
  w: number,
  h: number,
  // S8: callers may re-aim the meteor (the icon exporter did until it got its
  // own square composition, drawAppIcon); the title screen never passes opts
  // and is pixel-identical
  opts: { meteorX?: number; meteorY?: number } = {},
): Pixmap {
  const pm = new Pixmap(w, h);
  const rng = mulberry32(1995);
  // night sky bands
  pm.rect(0, 0, w, h, px(RAMP.NIGHT, 0));
  pm.rect(0, Math.floor(h * 0.45), w, h, px(RAMP.NIGHT, 1));
  pm.rect(0, Math.floor(h * 0.7), w, h, px(RAMP.NIGHT, 2));
  // stars — density scales with area (90 at the canonical 400×225)
  const stars = Math.round((w * h) / 1000);
  for (let i = 0; i < stars; i++) {
    const sx = Math.floor(rng() * w);
    const sy = Math.floor(rng() * h * 0.6);
    pm.set(sx, sy, rng() > 0.8 ? C.white : px(RAMP.NIGHT, 3));
  }
  // a few twinkles (6 at the canonical size)
  const twinkles = Math.max(1, Math.round((w * h) / 15000));
  for (let i = 0; i < twinkles; i++) {
    const sx = 10 + Math.floor(rng() * (w - 20));
    const sy = 6 + Math.floor(rng() * h * 0.4);
    pm.set(sx, sy, C.white);
    pm.set(sx - 1, sy, px(RAMP.CYAN, 3));
    pm.set(sx + 1, sy, px(RAMP.CYAN, 3));
    pm.set(sx, sy - 1, px(RAMP.CYAN, 3));
    pm.set(sx, sy + 1, px(RAMP.CYAN, 3));
  }
  // THE METEOR — streaking down-right toward the hill
  const mx = Math.floor(w * (opts.meteorX ?? 0.68));
  const my = Math.floor(h * (opts.meteorY ?? 0.3));
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

/**
 * S8 app icon: the meteor over Otterbrook, composed for a tiny square — the
 * raw title formula doesn't survive 24px (its trail exits the canvas and the
 * crash glow swallows the frame). Same engine vocabulary, palette-pure.
 * `centered` aims the meteor at the adaptive-icon safe zone (launcher masks
 * crop up to ~20% per side); the legacy icon keeps the down-right streak.
 */
export function drawAppIcon(s: number, centered = false): Pixmap {
  const pm = new Pixmap(s, s);
  const rng = mulberry32(1995);
  const u = (f: number): number => Math.round(s * f);
  // night sky bands
  pm.rect(0, 0, s, s, px(RAMP.NIGHT, 0));
  pm.rect(0, u(0.58), s, s, px(RAMP.NIGHT, 1));
  pm.rect(0, u(0.82), s, s, px(RAMP.NIGHT, 2));
  // a handful of stars, clear of the streak's lane
  for (let i = 0; i < 7; i++) {
    const sx = Math.floor(rng() * s);
    const sy = Math.floor(rng() * s * 0.5);
    pm.set(sx, sy, i % 3 === 0 ? C.white : px(RAMP.NIGHT, 3));
  }
  // hill silhouette rising to the right
  for (let x = u(0.3); x < s; x++) {
    const ht = Math.floor(s * 0.8 - Math.sin(((x - s * 0.3) / (s * 0.7)) * Math.PI * 0.9) * s * 0.13);
    for (let y = ht; y < s; y++) pm.set(x, y, px(RAMP.NIGHT, 1));
  }
  // one sleeping rooftop, one lit window (someone heard the roar)
  pm.rect(1, u(0.78), u(0.2), s - u(0.78), px(RAMP.NIGHT, 0));
  pm.hline(1, u(0.78), u(0.2), px(RAMP.NIGHT, 2));
  pm.set(2 + u(0.06), u(0.78) + 2, px(RAMP.GOLD, 2));
  // THE METEOR — head low enough to read, 45° trail to the corner
  const hx = centered ? u(0.5) : u(0.62);
  const hy = centered ? u(0.42) : u(0.38);
  for (let t = 1; t < s; t++) {
    const tx = hx - t;
    const ty = hy - t;
    if (tx < -1 || ty < -1) break;
    const c = t < u(0.12) ? px(RAMP.GOLD, 3) : t < u(0.3) ? px(RAMP.ORANGE, 2) : px(RAMP.ORANGE, 1);
    pm.set(tx, ty, c);
    pm.set(tx + 1, ty, c);
  }
  const r = Math.max(2, u(0.09));
  pm.ellipse(hx, hy, r, r, px(RAMP.GOLD, 3));
  pm.ellipse(hx + 1, hy, Math.max(1, r - 1), Math.max(1, r - 1), C.white);
  // crash glow tucked on the hillside
  pm.ellipse(u(0.72), u(0.86), u(0.14), u(0.05), px(RAMP.ORANGE, 1));
  pm.ellipse(u(0.72), u(0.86), u(0.07), Math.max(1, u(0.02)), px(RAMP.GOLD, 2));
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
