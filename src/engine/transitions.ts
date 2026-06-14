/**
 * Procedural screen transitions (S21, ADR-pending) — a self-contained library of
 * EarthBound-flavoured wipes, drawn ENTIRELY at runtime from the §B3 palette (no
 * binary assets). Scenes drive these between rooms / into battle; everything is a
 * screen-space overlay at a depth above all UI, cleaned up the instant it resolves.
 *
 * Four kinds (TransitionKind):
 *   · fade        — a full-screen rectangle alpha ramp (the cameras.fadeOut idiom,
 *                   but as a poolable overlay you can stack a swirl on top of).
 *   · irisWipe    — an expanding/contracting CIRCLE that reveals/hides the scene,
 *                   implemented with a Phaser GEOMETRY MASK off a Graphics circle so
 *                   it works on BOTH the canvas and WebGL renderers (no shader pipe).
 *   · barWipe     — a louvre/venetian wipe: horizontal bars sweeping closed / open.
 *   · battleSwirl — the accelerating EB battle-entry spiral, tinted by the contact
 *                   traffic-light (green = player advantage, red = enemy, paper-grey
 *                   = neutral) — the SAME palette colours formulas.SWIRL_TINT defines
 *                   (ADR-043), so it reads identically to the existing static swirl.
 *
 * `dir` is the universal direction: 'out' takes the live scene TO a solid/hidden
 * state (fade-to-black, iris shut, bars closed, swirl filled); 'in' brings it BACK
 * (fade-from-black, iris open, bars open, swirl unwinds). Default 'out'.
 *
 * The animation MATH lives in small PURE helpers (irisRadiusAt, swirlAngleAt,
 * swirlRadiusAt, barOffsetsAt, easeAccel) so it unit-tests exactly and stays
 * 60Hz dt-invariant — the per-frame draw reads a tween-driven 0..1 progress, the
 * ADR-024 frame-rate-independent way (we drive it with scene.tweens.addCounter,
 * matching the OverworldScene tween idiom).
 */
import Phaser from 'phaser';
import { colorOf, RAMP, px } from '../palette';
import { SWIRL_TINT } from '../battle/formulas';

export type TransitionKind = 'fade' | 'irisWipe' | 'barWipe' | 'battleSwirl';

export interface TransitionOpts {
  /** 'out' = scene → solid/hidden (default); 'in' = solid/hidden → scene */
  dir?: 'in' | 'out';
  /** ms the wipe runs (each kind carries a sensible default) */
  durationMs?: number;
  /** palette INDEX (fed through colorOf) for the fade/iris fill — default ink */
  color?: number;
  /** battleSwirl only — maps to the SWIRL_TINT traffic-light colour */
  tint?: 'sneak' | 'spotted' | 'neutral';
  /** irisWipe focus, screen-space px (defaults to screen centre) */
  centerX?: number;
  centerY?: number;
}

/** the overlay depth — above DEPTH_UI (1000) and the static swirl (4000) so a
 *  transition always sits on top of everything the scene has drawn */
export const TRANSITION_DEPTH = 9000;

/** per-kind default durations (ms) — fade is the quick one, the swirl lingers */
const DEFAULT_MS: Record<TransitionKind, number> = {
  fade: 250,
  irisWipe: 450,
  barWipe: 400,
  battleSwirl: 750,
};

/** the default fill for fade/iris when no palette index is passed — INK 0, the
 *  deep plum every outline uses (palette.ts), so a fade reads as ink, not raw black */
const DEFAULT_FILL = px(RAMP.INK, 0);

/** map the battleSwirl `tint` option onto the established SWIRL_TINT palette
 *  indices (formulas.ts, ADR-043): sneak = green (player), spotted = red (enemy),
 *  neutral = paper-grey. Reusing those exact values keeps the animated swirl
 *  colour-identical to the static one BattleScene/OverworldScene already show. */
export function swirlTintIndex(tint: 'sneak' | 'spotted' | 'neutral'): number {
  if (tint === 'sneak') return SWIRL_TINT.player;
  if (tint === 'spotted') return SWIRL_TINT.enemy;
  return SWIRL_TINT.none;
}

/* ============================================================================
 * PURE animation math — no Phaser, exported for the unit tests. Each takes a
 * normalized progress p in [0,1] (0 = animation start, 1 = animation end).
 * ========================================================================== */

/** clamp a number to [lo,hi] */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * The spiral's ACCELERATION curve — quadratic ease-in (p²). The swirl starts
 * slow and whips faster as it closes (the EB battle-entry "winding up"), and
 * 'cubic.in'/'quad.in' is the OverworldScene idiom for exactly this gesture.
 * easeAccel(0)=0, easeAccel(1)=1, and it is strictly increasing + accelerating
 * (its slope grows with p), which the tests pin.
 */
export function easeAccel(p: number): number {
  const c = clamp(p, 0, 1);
  return c * c;
}

/**
 * irisWipe radius at progress p. The circle reveals ('in', grows 0→maxR) or
 * hides ('out', shrinks maxR→0) the scene through the geometry mask.
 *   in : p=0 → 0 (nothing shown), p=1 → maxR (all shown)
 *   out: p=0 → maxR (all shown), p=1 → 0 (nothing shown)
 * Linear in p — the eye reads a steady iris; the value is monotonic across p.
 */
export function irisRadiusAt(p: number, maxR: number, dir: 'in' | 'out'): number {
  const c = clamp(p, 0, 1);
  const frac = dir === 'in' ? c : 1 - c;
  return frac * maxR;
}

/**
 * The largest radius an iris needs to cover the whole screen: the distance from
 * the focus (cx,cy) to the farthest corner of the w×h rectangle. Anything ≥ this
 * fully reveals; the iris animates between 0 and this.
 */
export function irisMaxRadius(w: number, h: number, cx: number, cy: number): number {
  const dx = Math.max(cx, w - cx);
  const dy = Math.max(cy, h - cy);
  return Math.hypot(dx, dy);
}

/**
 * battleSwirl arm ANGLE (radians) at progress p — total sweep is `turns` full
 * rotations, accelerated by easeAccel so the spin winds UP. swirlAngleAt(0)=0;
 * swirlAngleAt(1)=turns·2π. Monotonic increasing (the swirl never unspins
 * mid-wind), and its per-step delta GROWS with p (acceleration).
 */
export function swirlAngleAt(p: number, turns = 3): number {
  return easeAccel(p) * turns * Math.PI * 2;
}

/**
 * battleSwirl fill RADIUS at progress p — the spiral's outer edge expanding from
 * the centre to maxR as it fills the screen, on the SAME accelerating curve as
 * the angle so the arms grow and whip together. swirlRadiusAt(0)=0;
 * swirlRadiusAt(1)=maxR. Monotonic increasing.
 */
export function swirlRadiusAt(p: number, maxR: number): number {
  return easeAccel(p) * maxR;
}

/**
 * barWipe — the per-bar half-cover (px) at "close fraction" p, for `bars`
 * horizontal louvres over a totalH-tall screen. A bar's slot is (totalH/bars)
 * tall and shuts from BOTH its top and bottom edges toward its centre line, so
 * each rect is this tall and two of them meet when p=1:
 *   p=0 → 0       (slot fully open, screen clear)
 *   p=1 → slot/2  (the two rects meet, slot fully covered → screen solid)
 * Linear and monotonic in p. This helper is direction-agnostic on purpose (pure +
 * trivially testable): the 'out' wipe feeds it the raw progress (open→closed) and
 * the 'in' wipe feeds it (1-progress) (closed→open). Returns one entry per bar
 * (uniform today; the per-bar array leaves room for a staggered louvre later).
 */
export function barOffsetsAt(p: number, bars: number, totalH: number): number[] {
  const c = clamp(p, 0, 1);
  const slot = totalH / Math.max(1, bars);
  const half = (slot / 2) * c;
  const out: number[] = [];
  for (let i = 0; i < bars; i++) out.push(half);
  return out;
}

/* ============================================================================
 * The runtime driver.
 * ========================================================================== */

/** drive a 0..1 progress counter over durationMs the dt-invariant way (ADR-024),
 *  redrawing every frame; resolve + run cleanup on completion. One tween, one
 *  Promise — calling transition() repeatedly never stacks or leaks because every
 *  object it makes is destroyed in `done`. */
function runProgress(
  scene: Phaser.Scene,
  durationMs: number,
  onUpdate: (p: number) => void,
  cleanup: () => void,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    onUpdate(0); // paint the start state on frame 0 (no one-frame flash)
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: Math.max(1, durationMs),
      ease: 'linear', // the EASING lives in the pure helpers, so the counter is linear
      onUpdate: (tw) => onUpdate(tw.getValue() as number),
      onComplete: finish,
    });
  });
}

/**
 * Run a screen transition, resolving when it completes. Self-contained: it draws
 * its own Graphics / mask overlay in screen space at TRANSITION_DEPTH and destroys
 * everything on completion, so repeated calls never leak or stack.
 */
export function transition(scene: Phaser.Scene, kind: TransitionKind, opts: TransitionOpts = {}): Promise<void> {
  const dir = opts.dir ?? 'out';
  const durationMs = opts.durationMs ?? DEFAULT_MS[kind];
  const w = scene.scale.width;
  const h = scene.scale.height;
  switch (kind) {
    case 'fade':
      return runFade(scene, dir, durationMs, opts.color ?? DEFAULT_FILL, w, h);
    case 'irisWipe':
      return runIris(scene, dir, durationMs, opts.color ?? DEFAULT_FILL, w, h, opts.centerX ?? w / 2, opts.centerY ?? h / 2);
    case 'barWipe':
      return runBars(scene, dir, durationMs, opts.color ?? DEFAULT_FILL, w, h);
    case 'battleSwirl':
      return runSwirl(scene, dir, durationMs, opts.tint ?? 'neutral', w, h);
  }
}

/* ---- fade: a full-screen rect alpha ramp ---- */
function runFade(scene: Phaser.Scene, dir: 'in' | 'out', durationMs: number, colorIdx: number, w: number, h: number): Promise<void> {
  const rect = scene.add
    .rectangle(0, 0, w, h, colorOf(colorIdx))
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(TRANSITION_DEPTH)
    .setAlpha(dir === 'out' ? 0 : 1);
  return runProgress(
    scene,
    durationMs,
    (p) => rect.setAlpha(dir === 'out' ? p : 1 - p),
    () => rect.destroy(),
  );
}

/* ---- irisWipe: a geometry-masked circle revealing/hiding the scene ----
 * The mask Graphics is its OWN object (NOT added to the display list — a mask
 * source shouldn't render), filled as a circle whose radius animates. We mask a
 * full-screen fill so that OUTSIDE the circle shows the solid colour and inside
 * shows through to the scene: an INVERTED geometry mask gives exactly that — the
 * cover is visible everywhere the mask circle is NOT. */
function runIris(
  scene: Phaser.Scene,
  dir: 'in' | 'out',
  durationMs: number,
  colorIdx: number,
  w: number,
  h: number,
  cx: number,
  cy: number,
): Promise<void> {
  const maxR = irisMaxRadius(w, h, cx, cy);
  const maskG = scene.make.graphics({}, false); // off display list; mask source only
  const mask = maskG.createGeometryMask();
  mask.invertAlpha = true; // cover shows OUTSIDE the circle; the hole reveals the scene
  const cover = scene.add
    .rectangle(0, 0, w, h, colorOf(colorIdx))
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(TRANSITION_DEPTH);
  cover.setMask(mask);
  const draw = (p: number): void => {
    const r = irisRadiusAt(p, maxR, dir);
    maskG.clear();
    if (r > 0) maskG.fillStyle(0xffffff, 1).fillCircle(cx, cy, r);
  };
  return runProgress(
    scene,
    durationMs,
    draw,
    () => {
      cover.clearMask(true); // destroys the GeometryMask
      maskG.destroy();
      cover.destroy();
    },
  );
}

/* ---- barWipe: horizontal louvres closing/opening with Graphics rects ---- */
const BAR_COUNT = 8;
function runBars(scene: Phaser.Scene, dir: 'in' | 'out', durationMs: number, colorIdx: number, w: number, h: number): Promise<void> {
  const g = scene.add
    .graphics()
    .setScrollFactor(0)
    .setDepth(TRANSITION_DEPTH);
  const fill = colorOf(colorIdx);
  const slot = h / BAR_COUNT;
  const draw = (p: number): void => {
    // 'out' closes (cover grows 0→slot/2); 'in' opens (slot/2→0). barOffsetsAt
    // ramps 0→half with its argument, so feed it (1-p) on the way in.
    const offs = barOffsetsAt(dir === 'out' ? p : 1 - p, BAR_COUNT, h);
    g.clear();
    g.fillStyle(fill, 1);
    for (let i = 0; i < BAR_COUNT; i++) {
      const half = offs[i];
      if (half <= 0) continue;
      const top = i * slot;
      g.fillRect(0, top, w, half); // shut from the top edge of the slot
      g.fillRect(0, top + slot - half, w, half); // and from the bottom edge
    }
  };
  return runProgress(scene, durationMs, draw, () => g.destroy());
}

/* ---- battleSwirl: an accelerating, growing, rotating spiral (EB battle entry) ----
 * Redrawn each frame as polyline arms that lengthen (swirlRadiusAt) and rotate
 * (swirlAngleAt) on the easeAccel curve, over a cover whose alpha ramps in so the
 * screen ends fully filled in the swirl's tint. 'in' plays it in reverse (unwind). */
const SWIRL_ARMS = 5;
const SWIRL_SEGMENTS = 48;
function runSwirl(scene: Phaser.Scene, dir: 'in' | 'out', durationMs: number, tint: 'sneak' | 'spotted' | 'neutral', w: number, h: number): Promise<void> {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  const fill = colorOf(swirlTintIndex(tint));
  const cover = scene.add
    .rectangle(0, 0, w, h, fill)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(TRANSITION_DEPTH);
  const g = scene.add
    .graphics()
    .setScrollFactor(0)
    .setDepth(TRANSITION_DEPTH + 1);
  const draw = (raw: number): void => {
    // 'in' reverses the wind: the spiral unspools and the screen clears
    const p = dir === 'out' ? raw : 1 - raw;
    const baseAngle = swirlAngleAt(p);
    const r = swirlRadiusAt(p, maxR);
    cover.setAlpha(easeAccel(p)); // the tint fills in on the same accelerating curve
    g.clear();
    g.lineStyle(Math.max(2, maxR / 24), fill, 1);
    for (let a = 0; a < SWIRL_ARMS; a++) {
      const armBase = baseAngle + (a / SWIRL_ARMS) * Math.PI * 2;
      g.beginPath();
      for (let s = 0; s <= SWIRL_SEGMENTS; s++) {
        const t = s / SWIRL_SEGMENTS;
        const rad = t * r;
        // an Archimedean arm: angle grows with radius → the curl tightens inward
        const ang = armBase + t * Math.PI * 4;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (s === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  };
  return runProgress(
    scene,
    durationMs,
    draw,
    () => {
      g.destroy();
      cover.destroy();
    },
  );
}
