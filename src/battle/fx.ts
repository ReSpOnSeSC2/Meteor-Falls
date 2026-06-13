/**
 * BattleFx — S11's effect engine. Composable, OBJECT-POOLED primitives
 * (particle bursts, expanding rings, bolts, screen flashes, camera shakes,
 * sprite tint/flash, palette-cycle pulses) composed into the named timelines
 * of battle/fxRegistry.ts. Timelines advance on dt via the scene's update
 * (ADR-024 — never Clock timers, never awaited tweens), pre-scaled by the
 * ADR-010 skip state: holding A/B fast-forwards choreography at the text
 * typewriter's exact ×4. The ADR-008 bot replays everything through pump().
 *
 * THE ODOMETER LAW (S11 hard law): nothing here may cover or delay the
 * rolling drums. Every fx display object sits BELOW DEPTH_UI — field bursts
 * under the cards, full-screen floods under everything UI — and no timeline
 * ever blocks the per-frame odometer tick (the scene's update owns that).
 *
 * Tweens appear nowhere in this file; Prompt 42 profiles this scene hardest,
 * so particles, popups, rings, bolts, and tether segments all cycle through
 * pools instead of churning the GC.
 */
import Phaser from 'phaser';
import { FxTimeline, Pool, staggerTimes } from './fxTimeline';
import { FX_REGISTRY } from './fxRegistry';
import { AUDIO } from '../engine/audio';
import { colorOf, px, RAMP } from '../palette';
import { DEPTH_UI } from '../ui/windows';

/** field fx (bursts, rings, bolts) — under every card and window */
const D_FIELD = DEPTH_UI - 10;
/** damage/heal popups — above enemies, still under the UI */
const D_POPUP = DEPTH_UI - 5;
/** full-screen floods slide UNDER the party cards entirely */
const D_FLASH = DEPTH_UI - 20;

export interface FxTarget {
  x: number;
  y: number;
  spr?: Phaser.GameObjects.Image;
}

export interface FxContext {
  caster?: FxTarget;
  targets?: FxTarget[];
  /** fired at each target's hit beat (the scene applies tint/derived state) */
  onHit?: (index: number) => void;
}

interface Particle {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  age: number;
  life: number;
  c0: number;
  c1: number;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  width: number;
  color: number;
  alpha: number;
  dead: boolean;
}

interface Bolt {
  pts: number[]; // x0,y0,x1,y1,...
  color: number;
  alpha: number;
  dead: boolean;
}

interface Popup {
  txt: Phaser.GameObjects.BitmapText;
  age: number;
  life: number;
  y0: number;
}

export class BattleFx {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private flashRect: Phaser.GameObjects.Rectangle;
  private pulseRect: Phaser.GameObjects.Rectangle;
  private timelines: FxTimeline[] = [];
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private bolts: Bolt[] = [];
  private popups: Popup[] = [];
  private pPool: Pool<Particle>;
  private ringPool: Pool<Ring>;
  private boltPool: Pool<Bolt>;
  private popPool: Pool<Phaser.GameObjects.BitmapText>;
  /** the SMAAAASH banner layers (4 ink + 1 green) — allocated once */
  private bannerTexts: Phaser.GameObjects.BitmapText[] = [];
  // the Tick's latch — persistent until severed (§A6 Boss 1)
  private tetherSegs: Phaser.GameObjects.Image[] = [];
  private tetherFrom: (() => { x: number; y: number }) | null = null;
  private tetherTo: (() => { x: number; y: number }) | null = null;
  private tetherPhase = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(D_FIELD).setScrollFactor(0);
    this.flashRect = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0xffffff, 1)
      .setOrigin(0)
      .setDepth(D_FLASH)
      .setScrollFactor(0)
      .setAlpha(0);
    this.pulseRect = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0xffffff, 1)
      .setOrigin(0)
      .setDepth(D_FLASH - 1)
      .setScrollFactor(0)
      .setAlpha(0);
    this.pPool = new Pool<Particle>(
      () => ({
        img: scene.add.image(0, 0, 'pixel').setDepth(D_FIELD + 1).setScrollFactor(0).setVisible(false),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        age: 0,
        life: 1,
        c0: 0xffffff,
        c1: 0xffffff,
        size: 1,
      }),
      (p) => p.img.setVisible(false),
    );
    this.ringPool = new Pool<Ring>(
      () => ({ x: 0, y: 0, r: 0, width: 1, color: 0xffffff, alpha: 1, dead: false }),
      (r) => (r.dead = true),
    );
    this.boltPool = new Pool<Bolt>(
      () => ({ pts: [], color: 0xffffff, alpha: 1, dead: false }),
      (b) => (b.dead = true),
    );
    this.popPool = new Pool<Phaser.GameObjects.BitmapText>(
      () =>
        scene.add
          .bitmapText(0, 0, 'retro', '', 6)
          .setOrigin(0.5, 1)
          .setDepth(D_POPUP)
          .setScrollFactor(0)
          .setVisible(false),
      (t) => t.setVisible(false),
    );
  }

  /** true while any choreography timeline is still running */
  get busy(): boolean {
    return this.timelines.length > 0;
  }

  /* ================= the per-frame pump ================= */

  /**
   * Advance everything by dtMs × (fast ? 4 : 1) — the same skip multiplier
   * the battle typewriter uses (ADR-010). Called from the scene's update.
   */
  update(dtMs: number, fast: boolean): void {
    const dt = dtMs * (fast ? 4 : 1);
    // timelines — drained against a snapshot: events fired mid-tick may PUSH
    // new inner timelines (rings, panels), and a plain filter() reassignment
    // would strand them on the discarded array, freezing their visuals at
    // full alpha forever (S11b catch — surfaced by back-to-back guard rings)
    if (this.timelines.length > 0) {
      const snapshot = this.timelines;
      this.timelines = [];
      const live: FxTimeline[] = [];
      for (const tl of snapshot) {
        if (!tl.tick(dt)) live.push(tl);
      }
      // inners born during the ticks join the live set (they tick next frame)
      live.push(...this.timelines);
      this.timelines = live;
    }
    // particles
    const sec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.particles.splice(i, 1);
        this.pPool.give(p);
        continue;
      }
      p.vx += p.ax * sec;
      p.vy += p.ay * sec;
      p.x += p.vx * sec;
      p.y += p.vy * sec;
      const t = p.age / p.life;
      p.img.setPosition(p.x, p.y).setTint(t < 0.55 ? p.c0 : p.c1).setAlpha(t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      p.img.setScale(p.size * (1 - t * 0.4));
    }
    // popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const u = this.popups[i];
      u.age += dt;
      const t = u.age / u.life;
      if (t >= 1) {
        this.popups.splice(i, 1);
        this.popPool.give(u.txt);
        continue;
      }
      u.txt.y = u.y0 - 14 * t;
      u.txt.setAlpha(t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1);
    }
    // tether segments track their endpoints every frame (cards never wait)
    this.tetherPhase += sec * 4;
    this.drawTether();
    // rings + bolts redraw into the one pooled Graphics
    this.gfx.clear();
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      if (r.dead) {
        this.rings.splice(i, 1);
        this.ringPool.give(r);
        continue;
      }
      this.gfx.lineStyle(r.width, r.color, r.alpha);
      this.gfx.strokeCircle(r.x, r.y, Math.max(1, r.r));
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      if (b.dead) {
        this.bolts.splice(i, 1);
        this.boltPool.give(b);
        continue;
      }
      this.gfx.lineStyle(2, b.color, b.alpha);
      for (let k = 0; k + 3 < b.pts.length; k += 2) {
        this.gfx.lineBetween(b.pts[k], b.pts[k + 1], b.pts[k + 2], b.pts[k + 3]);
      }
    }
  }

  /* ================= primitives (all pooled) ================= */

  private spawn(x: number, y: number, opts: Partial<Particle>): void {
    const p = this.pPool.take();
    p.x = x;
    p.y = y;
    p.vx = opts.vx ?? 0;
    p.vy = opts.vy ?? 0;
    p.ax = opts.ax ?? 0;
    p.ay = opts.ay ?? 0;
    p.age = 0;
    p.life = opts.life ?? 500;
    p.c0 = opts.c0 ?? 0xffffff;
    p.c1 = opts.c1 ?? p.c0;
    p.size = opts.size ?? 1;
    p.img.setVisible(true).setPosition(x, y).setTint(p.c0).setAlpha(1).setScale(p.size);
    this.particles.push(p);
  }

  /** radial burst — the workhorse impact read */
  burst(x: number, y: number, ramp: number, n = 10, speed = 60, life = 420, size = 1): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
      const v = speed * (0.6 + (i % 3) * 0.25);
      this.spawn(x, y, {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        ay: 30,
        life: life * (0.7 + (i % 4) * 0.12),
        c0: colorOf(px(ramp, 3)),
        c1: colorOf(px(ramp, 1)),
        size,
      });
    }
  }

  /** sparkles raining down over a width (Lifeup, healing) */
  rain(x: number, y: number, w: number, ramp: number, n = 12, life = 600): void {
    for (let i = 0; i < n; i++) {
      this.spawn(x - w / 2 + (i / (n - 1)) * w, y - 18 - (i % 3) * 6, {
        vy: 36 + (i % 4) * 8,
        life: life * (0.75 + (i % 3) * 0.18),
        c0: colorOf(px(ramp, 3)),
        c1: colorOf(px(ramp, 2)),
      });
    }
  }

  /** warm motes drifting upward (pray, porch-light, revive) */
  motes(x: number, y: number, w: number, ramp: number, n = 8, life = 800): void {
    for (let i = 0; i < n; i++) {
      this.spawn(x - w / 2 + (i / Math.max(1, n - 1)) * w, y + (i % 3) * 4, {
        vy: -(18 + (i % 4) * 7),
        vx: (i % 2 === 0 ? 1 : -1) * 4,
        life: life * (0.7 + (i % 3) * 0.2),
        c0: colorOf(px(ramp, 3)),
        c1: colorOf(px(ramp, 2)),
      });
    }
  }

  /** an expanding ring driven by a timeline span */
  ring(tl: FxTimeline, at: number, x: number, y: number, r0: number, r1: number, ramp: number, ms = 320, width = 2): void {
    tl.event(at, () => {
      const ring = this.ringPool.take();
      ring.x = x;
      ring.y = y;
      ring.r = r0;
      ring.width = width;
      ring.color = colorOf(px(ramp, 3));
      ring.alpha = 1;
      ring.dead = false;
      this.rings.push(ring);
      const inner = new FxTimeline();
      inner.span(0, ms, (p) => {
        ring.r = r0 + (r1 - r0) * p;
        ring.alpha = 1 - p * 0.9;
        if (p >= 1) ring.dead = true;
      });
      this.timelines.push(inner);
    });
  }

  /** a zigzag bolt flashed for a moment (Volt) */
  bolt(tl: FxTimeline, at: number, x: number, y: number, ramp: number, fromY = 6): void {
    tl.event(at, () => {
      const b = this.boltPool.take();
      b.pts = [];
      b.color = colorOf(px(ramp, 3));
      b.alpha = 1;
      b.dead = false;
      let yy = fromY;
      let xx = x + ((x % 7) - 3) * 2;
      b.pts.push(xx, yy);
      let step = 0;
      while (yy < y - 4) {
        yy += 9 + (step % 3) * 4;
        xx = x + (step % 2 === 0 ? -1 : 1) * (7 - Math.min(6, step)) + ((step * 5) % 3);
        b.pts.push(Math.min(this.scene.scale.width - 2, Math.max(2, xx)), Math.min(y, yy));
        step++;
      }
      b.pts.push(x, y);
      this.bolts.push(b);
      const inner = new FxTimeline();
      inner.span(0, 150, (p) => {
        b.alpha = 1 - p;
        if (p >= 1) b.dead = true;
      });
      this.timelines.push(inner);
    });
  }

  /** full-field flood — depth D_FLASH: it slides UNDER the cards (the law) */
  flood(tl: FxTimeline, at: number, color: number, alpha: number, ms: number): void {
    tl.span(at, at + ms, (p) => {
      this.flashRect.setFillStyle(color, 1);
      this.flashRect.setAlpha(p < 0.25 ? (alpha * p) / 0.25 : alpha * (1 - (p - 0.25) / 0.75));
    });
  }

  /** palette-cycle pulse on the psychedelic field (3 ramp shades, additive) */
  palettePulse(tl: FxTimeline, at: number, ramp: number, ms = 360): void {
    const shades = ([3, 1, 2] as const).map((s) => colorOf(px(ramp, s)));
    tl.span(at, at + ms, (p) => {
      const c = shades[Math.min(2, Math.floor(p * 3))];
      this.pulseRect.setFillStyle(c, 1);
      this.pulseRect.setAlpha(p >= 1 ? 0 : 0.16 * (1 - p));
    });
  }

  shake(tl: FxTimeline, at: number, ms = 150, power = 0.008): void {
    tl.event(at, () => this.scene.cameras.main.shake(ms, power));
  }

  /** hit-flash + flinch on a target sprite, with an exact home restore */
  hitFlash(tl: FxTimeline, at: number, t: FxTarget): void {
    const spr = t.spr;
    if (!spr) return;
    tl.event(at, () => spr.setTintFill(0xf8f8f0));
    tl.event(at + 110, () => spr.clearTint());
    const home = { x: 0, set: false };
    tl.span(at, at + 160, (p) => {
      if (!home.set) {
        home.x = spr.x;
        home.set = true;
      }
      spr.x = home.x + (p >= 1 ? 0 : Math.round(Math.sin(p * Math.PI * 4) * 3));
    });
  }

  sfx(tl: FxTimeline, at: number, name: string | undefined): void {
    if (!name) return;
    tl.event(at, () => AUDIO.sfx(name));
  }

  /** floating damage/heal popup (the S10 popFoe idiom, pooled + dt-driven) */
  popup(x: number, y: number, text: string, ramp: number): void {
    const t = this.popPool.take();
    t.setText(text).setPosition(x, y).setTint(colorOf(px(ramp, 3))).setAlpha(1).setVisible(true);
    this.popups.push({ txt: t, age: 0, life: 620, y0: y });
  }

  /* ============ the SMAAAASH combo dressing (S11b) ============ */

  /**
   * The combo ring timer: rendered under the target at fx depth, draining
   * with the window. The caller drives it (tick reads the live progress so
   * it compresses with the skip state exactly like the window itself).
   */
  comboRing(x: number, y: number, progress: () => number): { tick: () => void; done: () => void } {
    const ring = this.ringPool.take();
    ring.x = x;
    ring.y = y;
    ring.width = 2;
    ring.alpha = 0.9;
    ring.dead = false;
    ring.r = 14;
    ring.color = colorOf(px(RAMP.GRASS, 3));
    this.rings.push(ring);
    return {
      tick: () => {
        const p = Math.max(0, Math.min(1, progress()));
        ring.r = 2 + 12 * p;
        ring.color = colorOf(px(p > 0.35 ? RAMP.GRASS : RAMP.RED, 3));
      },
      done: () => {
        ring.dead = true;
      },
    };
  }

  /**
   * The HUGE GREEN banner (S11b): comic letters in the GRASS ramp over an
   * INK outline (the palette law holds), slamming in at 3× with a green
   * radial burst. Texts are allocated once and reused — never pooled churn.
   */
  smashBanner(text: string): Promise<void> {
    if (this.bannerTexts.length === 0) {
      for (let i = 0; i < 5; i++) {
        this.bannerTexts.push(
          this.scene.add
            .bitmapText(0, 0, 'retro', '', 6)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(D_POPUP + (i === 4 ? 1 : 0))
            .setVisible(false),
        );
      }
    }
    const W = this.scene.scale.width;
    const ink = colorOf(px(RAMP.INK, 0));
    const g3 = colorOf(px(RAMP.GRASS, 3));
    const g1 = colorOf(px(RAMP.GRASS, 1));
    const offs: Array<[number, number]> = [
      [-3, 0],
      [3, 0],
      [0, -3],
      [0, 3],
      [0, 0],
    ];
    this.bannerTexts.forEach((t, i) => {
      t.setText(text).setVisible(true).setAlpha(1);
      if (i < 4) t.setTint(ink);
      else t.setTint(g3, g3, g1, g1); // comic gradient: lit top, deep base
    });
    const tl = new FxTimeline();
    tl.span(0, 130, (p) => {
      const s = 5 - 2 * p; // the slam: 5× crashing down to 3×
      this.bannerTexts.forEach((t, i) => {
        t.setScale(s).setPosition(W / 2 + (offs[i][0] * s) / 3, 70 + (offs[i][1] * s) / 3);
      });
    });
    tl.event(130, () => this.burst(W / 2, 70, RAMP.GRASS, 12, 80, 420, 2));
    this.shake(tl, 130, 200, 0.012);
    tl.span(720, 860, (p) => this.bannerTexts.forEach((t) => t.setAlpha(1 - p)));
    tl.event(860, () => this.bannerTexts.forEach((t) => t.setVisible(false)));
    this.timelines.push(tl);
    return tl.whenDone();
  }

  /* ================= the Tick's tether (§A6 Boss 1) ================= */

  attachTether(from: () => { x: number; y: number }, to: () => { x: number; y: number }): void {
    this.tetherFrom = from;
    this.tetherTo = to;
    if (this.tetherSegs.length === 0) {
      for (let i = 0; i < 11; i++) {
        this.tetherSegs.push(
          this.scene.add.image(0, 0, 'pixel').setDepth(D_FIELD - 1).setScrollFactor(0).setVisible(false),
        );
      }
    }
    AUDIO.sfx('fx_latch');
  }

  get tethered(): boolean {
    return this.tetherFrom !== null;
  }

  /** the salt (or Vibe Fire) visibly breaks the latch — segments scatter */
  severTether(): void {
    if (!this.tetherFrom || !this.tetherTo) return;
    const a = this.tetherFrom();
    const b = this.tetherTo();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      this.spawn(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * 8, {
        vx: (t - 0.5) * 50,
        vy: -28,
        ay: 90,
        life: 460,
        c0: colorOf(px(RAMP.MAGENTA, 3)),
        c1: colorOf(px(RAMP.MAGENTA, 1)),
      });
    }
    this.tetherFrom = null;
    this.tetherTo = null;
    this.tetherSegs.forEach((s) => s.setVisible(false));
    AUDIO.sfx('fx_sever');
  }

  private drawTether(): void {
    if (!this.tetherFrom || !this.tetherTo) return;
    const a = this.tetherFrom();
    const b = this.tetherTo();
    const n = this.tetherSegs.length;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const sag = Math.sin(t * Math.PI) * 8;
      const throb = Math.sin(this.tetherPhase - t * 5);
      const seg = this.tetherSegs[i];
      seg
        .setVisible(true)
        .setPosition(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + sag + throb * 1.5)
        .setTint(colorOf(px(RAMP.MAGENTA, throb > 0.45 ? 3 : 2)))
        .setAlpha(0.85)
        .setScale(throb > 0.45 ? 1.5 : 1);
    }
  }

  /* ================= named timelines ================= */

  /**
   * Play a registered effect. Resolves when the timeline completes — and the
   * whole thing compresses ×4 under held A/B, exactly like text (ADR-010).
   */
  play(key: string, ctx: FxContext = {}): Promise<void> {
    const spec = FX_REGISTRY[key];
    const tl = new FxTimeline();
    if (!spec) {
      // unregistered keys cannot ship (validator), but never strand a battle
      tl.hold(1);
      this.timelines.push(tl);
      return tl.whenDone();
    }
    const ramp = spec.ramp ?? RAMP.GOLD;
    const tier = spec.tier ?? 1;
    const targets = ctx.targets ?? [];
    const caster = ctx.caster;
    const W = this.scene.scale.width;
    const hit = (i: number, at: number): void => {
      tl.event(at, () => ctx.onHit?.(i));
    };

    switch (spec.family) {
      case 'surge': {
        // THE SIGNATURE NUKE (S12b rebuild — it must never read as a bash; S16
        // §5 — FIVE rungs, each its own firework, EarthBound-style). A CHARGE at
        // the caster's raised hands (motes converge, swelling pulses), the old
        // light TRAVELS the field as a burst train, then the per-tier finale
        // answers on the targets. The charge + travel are shared; the FIREWORK
        // ESCALATES (not just scales): α a single bottle-rocket pop · β concentric
        // rings + an edge bloom · γ rings + the falling-spark "willow" · Ω a
        // multi-burst volley + palette cycle · Σ the held-flash chrysanthemum
        // finale that fills the screen and settles to spark-rain. The fx layer
        // already sits below DEPTH_UI, so the HP wheels stay readable (odometer law).
        this.sfx(tl, 0, spec.sfx);
        const sigma = tier >= 5;
        // Σ opens on a HELD white flash and a beat of quiet before anything moves
        if (sigma) this.flood(tl, 0, 0xffffff, 0.5, 360);
        const charge = sigma ? 520 : 0;
        if (caster) {
          tl.event(0, () => this.motes(caster.x, caster.y, sigma ? 40 : 26, ramp, sigma ? 7 : 4, 420));
          const pulses = sigma ? 4 : 3;
          for (let c = 0; c < pulses; c++) {
            this.ring(tl, charge + 60 + c * 120, caster.x, caster.y - 6, 14 - c * 3, 4 + c * 2, c === pulses - 1 ? RAMP.GOLD : ramp, 160);
          }
        }
        targets.forEach((t, i) => {
          const base = charge + 480 + i * 110;
          if (caster) {
            // the travel: bursts cross from the hands to the target (more for Σ)
            const steps = sigma ? 6 : 4;
            for (let s = 0; s < steps; s++) {
              const p = (s + 1) / (steps + 1);
              const bx = caster.x + (t.x - caster.x) * p;
              const by = caster.y - 6 + (t.y - (caster.y - 6)) * p;
              tl.event(charge + 380 + s * 36 + i * 110, () => this.burst(bx, by, ramp, 3, 16));
            }
          }
          // β+: concentric rings (count + size climb with tier)
          for (let r = 0; r < tier + 1; r++) {
            this.ring(tl, base + r * 90, t.x, t.y, 4, 18 + tier * 7 + r * 6, r % 2 === 0 ? ramp : RAMP.GOLD, 300 + r * 40);
          }
          // γ+: the "willow" — falling spark trails settling after the burst
          if (tier >= 3) tl.event(base + 120, () => this.rain(t.x, t.y - 6, 30 + tier * 6, ramp, 10 + tier * 3, 520));
          tl.event(base + 60, () => this.burst(t.x, t.y, ramp, 8 + tier * 3, 54 + tier * 14));
          this.hitFlash(tl, base + 80, t);
          hit(i, base + 90);
          // Σ: the grand chrysanthemum (two huge rings) + sequential secondary
          // bursts walking across each target, then a slow spark-rain settle
          if (sigma) {
            this.ring(tl, base + 140, t.x, t.y, 6, 96, RAMP.GOLD, 520, 3);
            this.ring(tl, base + 200, t.x, t.y, 6, 128, ramp, 600, 2);
            for (let s = 0; s < 4; s++) {
              tl.event(base + 260 + s * 90, () => this.burst(t.x + (s - 1.5) * 16, t.y - 8, s % 2 ? RAMP.GOLD : ramp, 12, 70, 520, 2));
            }
            tl.event(base + 540, () => this.rain(t.x, t.y - 10, 48, ramp, 18, 760));
          }
        });
        // β/γ: a brief screen-edge bloom; Ω/Σ: the full palette-cycling flood
        if (tier === 2 || tier === 3) this.flood(tl, charge + 480, colorOf(px(ramp, 2)), 0.16, 220);
        if (tier >= 4) this.flood(tl, charge + 520, colorOf(px(ramp, 3)), sigma ? 0.5 : 0.4, sigma ? 620 : 420);
        this.shake(tl, charge + 540, 160 + tier * 60, 0.004 + tier * 0.002);
        this.palettePulse(tl, charge + 440, ramp);
        tl.hold(charge + 820 + tier * 120 + targets.length * 110 + (sigma ? 620 : 0));
        break;
      }
      case 'flame_wave': {
        // a rolling wave of flame sweeping the enemy row left to right. Σ (tier 5,
        // Fire Sigma) is a FINALE, not tier 4 scaled up (the build prompt §1.5):
        // a held flash, a denser wave, and a rising firewall column on each foe.
        this.sfx(tl, 0, spec.sfx);
        const sigma = tier >= 5;
        if (sigma) this.flood(tl, 0, 0xffffff, 0.42, 320);
        const charge = sigma ? 380 : 0;
        const sorted = [...targets].sort((a, b) => a.x - b.x);
        const x0 = Math.min(40, ...sorted.map((t) => t.x - 30));
        const x1 = Math.max(...sorted.map((t) => t.x + 30), x0 + 60);
        const sweepMs = 380 + tier * 60;
        const rowY = sorted[0]?.y ?? 92;
        tl.span(charge + 80, charge + 80 + sweepMs, (p) => {
          const wx = x0 + (x1 - x0) * p;
          // deterministic cadence (no dice in fx — the ADR-008 bot replays this)
          if (Math.floor(p * 60) % 3 === 2 && !sigma) return;
          this.spawn(wx, rowY + 18, {
            vy: -(50 + tier * 12),
            vx: 8,
            life: 320 + tier * 40,
            c0: colorOf(px(RAMP.GOLD, 3)),
            c1: colorOf(px(ramp, 2)),
            size: tier >= 3 ? 2 : 1,
          });
        });
        sorted.forEach((t) => {
          const i = targets.indexOf(t);
          const at = charge + 80 + sweepMs * ((t.x - x0) / (x1 - x0));
          tl.event(at, () => this.burst(t.x, t.y, ramp, 8 + tier * 2, 55));
          this.hitFlash(tl, at + 20, t);
          hit(i, at + 30);
          // Σ: a firewall climbs each foe — rising sparks + a doubled burst that
          // hangs (the whole sky went orange, and STAYED)
          if (sigma) {
            tl.event(at + 60, () => this.rain(t.x, t.y - 8, 40, RAMP.GOLD, 16, 700));
            this.ring(tl, at + 90, t.x, t.y, 6, 92, ramp, 560, 2);
            for (let s = 0; s < 4; s++) {
              tl.event(at + 150 + s * 80, () => this.spawn(t.x + (s - 1.5) * 10, t.y + 14, { vy: -(120 + s * 18), life: 520, c0: colorOf(px(RAMP.GOLD, 3)), c1: colorOf(px(ramp, 2)), size: 2 }));
            }
          }
        });
        if (sigma) {
          this.flood(tl, charge + 120, colorOf(px(ramp, 3)), 0.4, 520);
          this.shake(tl, charge + 160, 320, 0.01);
        }
        this.palettePulse(tl, charge + 100, ramp);
        tl.hold(charge + 80 + sweepMs + 260 + (sigma ? 520 : 0));
        break;
      }
      case 'lattice': {
        // crystal spokes grow from the target, hang, then shatter. Σ (tier 5,
        // Freeze Sigma) is the FINALE: a held flash, a fuller 12-spoke lattice
        // that hangs longer, then a hard shatter (the whole room held still).
        this.sfx(tl, 0, spec.sfx);
        const sigma = tier >= 5;
        if (sigma) this.flood(tl, 0, 0xffffff, 0.4, 300);
        const charge = sigma ? 360 : 0;
        targets.forEach((t, i) => {
          const base = charge + 120 + i * 110;
          const spokes = sigma ? 12 : 6;
          const hang = sigma ? 560 : 360;
          tl.event(base, () => {
            for (let s = 0; s < spokes; s++) {
              const b = this.boltPool.take();
              const a = (s / spokes) * Math.PI * 2 + 0.26;
              const len = 12 + tier * 4;
              b.pts = [t.x, t.y, t.x + Math.cos(a) * len, t.y + Math.sin(a) * len];
              b.color = colorOf(px(ramp, 3));
              b.alpha = 0.9;
              b.dead = false;
              this.bolts.push(b);
              const inner = new FxTimeline();
              inner.span(0, hang, (p) => {
                b.alpha = p < 0.7 ? 0.9 : 0.9 * (1 - (p - 0.7) / 0.3);
                if (p >= 1) b.dead = true;
              });
              this.timelines.push(inner);
            }
          });
          tl.event(base + hang - 40, () => this.burst(t.x, t.y, ramp, 10 + tier * 2, 70, 380));
          if (sigma) {
            this.ring(tl, base + hang - 40, t.x, t.y, 8, 96, ramp, 520, 3);
            tl.event(base + hang, () => this.burst(t.x, t.y, RAMP.PAPER, 18, 110, 480, 2));
          }
          this.hitFlash(tl, base + hang - 30, t);
          hit(i, base + hang - 20);
        });
        if (sigma) this.shake(tl, charge + 160, 300, 0.009);
        tl.hold(charge + 120 + targets.length * 110 + 480 + (sigma ? 360 : 0));
        break;
      }
      case 'bolt': {
        // zigzag bolts from the sky, one per target (tiers add seconds). Σ (tier 5,
        // Volt Sigma) is the FINALE: a held white flash, a full barrage of bolts
        // on every foe, and a strobing flood (every hair on every arm stood up).
        this.sfx(tl, 40, spec.sfx);
        const sigma = tier >= 5;
        if (sigma) this.flood(tl, 0, 0xffffff, 0.5, 280);
        const charge = sigma ? 300 : 0;
        const times = staggerTimes(targets.length, 120).map((t) => t + charge);
        const strikes = sigma ? 5 : Math.min(tier, 3);
        targets.forEach((t, i) => {
          for (let n = 0; n < strikes; n++) this.bolt(tl, times[i] + n * 70, t.x, t.y, ramp);
          tl.event(times[i] + 40, () => this.burst(t.x, t.y, ramp, sigma ? 16 : 8, sigma ? 90 : 60));
          this.flood(tl, times[i], 0xffffff, 0.18, 120);
          this.hitFlash(tl, times[i] + 50, t);
          hit(i, times[i] + 60);
          if (sigma) {
            this.ring(tl, times[i] + 40, t.x, t.y, 6, 88, RAMP.GOLD, 480, 3);
            for (let s = 0; s < 3; s++) this.flood(tl, times[i] + 120 + s * 90, 0xffffff, 0.22, 70);
          }
        });
        if (sigma) this.shake(tl, charge + 60, 320, 0.011);
        tl.hold(charge + 120 + targets.length * 110 + 300 + (sigma ? 360 : 0));
        break;
      }
      case 'starsong': {
        // STARSONG (S-Mia) — the anti-Hush light: warm gold notes RISE from below
        // and BURST into stars over the foes. Tiers add notes, rings, and reach;
        // Σ (tier 5) is the FINALE — a held gold flood, a sky full of stars, and a
        // slow chord of spark-rain (the Hush remembered being light, for a moment).
        this.sfx(tl, 0, spec.sfx);
        const sigma = tier >= 5;
        if (sigma) this.flood(tl, 0, colorOf(px(RAMP.GOLD, 3)), 0.34, 360);
        const charge = sigma ? 380 : 0;
        if (caster) {
          // the note gathers at her hands before it rises
          tl.event(0, () => this.motes(caster.x, caster.y, sigma ? 34 : 20, RAMP.GOLD, sigma ? 6 : 4, 420));
        }
        targets.forEach((t, i) => {
          const base = charge + 200 + i * 100;
          const notes = sigma ? 7 : 2 + tier;
          // notes rise from below the foe and bloom into a star at the top
          for (let n = 0; n < notes; n++) {
            tl.event(base + n * 40, () =>
              this.spawn(t.x + (n - notes / 2) * 6, t.y + 20, {
                vy: -(70 + tier * 12),
                life: 460 + tier * 30,
                c0: colorOf(px(RAMP.GOLD, 3)),
                c1: colorOf(px(ramp, 2)),
                size: tier >= 3 ? 2 : 1,
              }),
            );
          }
          for (let r = 0; r < tier; r++) {
            this.ring(tl, base + 120 + r * 70, t.x, t.y - 4, 4, 22 + tier * 6 + r * 8, RAMP.GOLD, 320 + r * 40);
          }
          tl.event(base + 140, () => this.burst(t.x, t.y - 4, RAMP.GOLD, 8 + tier * 2, 56 + tier * 10));
          this.hitFlash(tl, base + 150, t);
          hit(i, base + 160);
          if (sigma) {
            this.ring(tl, base + 200, t.x, t.y - 4, 6, 110, RAMP.GOLD, 600, 3);
            for (let s = 0; s < 5; s++) {
              tl.event(base + 240 + s * 80, () => this.burst(t.x + (s - 2) * 14, t.y - 12, s % 2 ? ramp : RAMP.GOLD, 10, 64, 520, 2));
            }
            tl.event(base + 520, () => this.rain(t.x, t.y - 12, 52, RAMP.GOLD, 20, 800));
          }
        });
        if (sigma) {
          this.flood(tl, charge + 120, colorOf(px(RAMP.GOLD, 3)), 0.36, 560);
          this.shake(tl, charge + 160, 260, 0.007);
        }
        this.palettePulse(tl, charge + 120, RAMP.GOLD);
        tl.hold(charge + 360 + targets.length * 100 + 320 + (sigma ? 620 : 0));
        break;
      }
      case 'sparkle_rain': {
        this.sfx(tl, 60, spec.sfx);
        targets.forEach((t, i) => {
          tl.event(80 + i * 90, () => this.rain(t.x, t.y, 44, ramp, 14));
          hit(i, 260 + i * 90);
        });
        tl.hold(620 + targets.length * 90);
        break;
      }
      case 'barrier': {
        // S11b: six hex panels FLY IN from the field corners and LOCK like
        // armor being fitted — per-panel lock ticks, then the flash + a
        // closing ring. The persistent hex PIP on the card is BustView's.
        const H = this.scene.scale.height;
        const CORNERS = [
          { x: 6, y: 6 },
          { x: W - 6, y: 6 },
          { x: 6, y: H - 60 },
          { x: W - 6, y: H - 60 },
          { x: W / 2, y: 4 },
          { x: W / 2, y: H - 56 },
        ];
        targets.forEach((t, i) => {
          const at = 40 + i * 110;
          const lockAt = at + 5 * 45 + 280;
          for (let s = 0; s < 6; s++) {
            const a0 = (s / 6) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((s + 1) / 6) * Math.PI * 2 - Math.PI / 2;
            const corner = CORNERS[s];
            const fly0 = at + s * 45;
            tl.event(fly0, () => {
              const b = this.boltPool.take();
              b.color = colorOf(px(ramp, 3));
              b.alpha = 0;
              b.dead = false;
              b.pts = [0, 0, 0, 0];
              this.bolts.push(b);
              const inner = new FxTimeline();
              // the panel travels corner → its hex seat, growing as it comes
              inner.span(0, 240, (p) => {
                const cx = corner.x + (t.x - corner.x) * p;
                const cy = corner.y + (t.y - corner.y) * p;
                const r = 4 + 7 * p;
                b.pts = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
                b.alpha = 0.35 + 0.65 * p;
              });
              inner.event(240, () => AUDIO.sfx('shield_panel')); // the lock tick
              // seated: hold the panel until the lock flash releases it
              inner.span(240, lockAt - fly0 + 260, (p) => {
                b.alpha = p >= 1 ? 0 : 1 - Math.max(0, (p - 0.7) / 0.3);
                if (p >= 1) b.dead = true;
              });
              this.timelines.push(inner);
            });
          }
          // the lock: a flash, the ring closing onto the hex, the snap sfx
          this.sfx(tl, lockAt, spec.sfx);
          this.flood(tl, lockAt, colorOf(px(ramp, 3)), 0.22, 240);
          this.ring(tl, lockAt, t.x, t.y, 20, 10, ramp, 220);
          tl.event(lockAt + 30, () => this.burst(t.x, t.y, ramp, 6, 30, 280));
          hit(i, lockAt + 60);
        });
        tl.hold(40 + targets.length * 110 + 5 * 45 + 280 + 420);
        break;
      }
      case 'reflect_field': {
        // S16 POWER SHIELD — the wall that answers. A standing MIRROR-WALL
        // rises in front of each ally: horizontal rungs flash in from a point
        // to full width, the pane holds still as water, then a bright rung
        // sweeps DOWN it (the bounce-back made visible) and a ring snaps at its
        // foot. Reuses the boltPool segment idiom (the barrier technique) at a
        // vertical scale — gold, because gold is the color that gives it back.
        this.sfx(tl, 60, spec.sfx);
        const paneH = 30;
        const rungs = 6;
        targets.forEach((t, i) => {
          const at = 40 + i * 90;
          for (let r = 0; r < rungs; r++) {
            const yy = t.y - paneH / 2 + (r / (rungs - 1)) * paneH;
            const myPos = r / (rungs - 1);
            tl.event(at + r * 26, () => {
              const b = this.boltPool.take();
              b.color = colorOf(px(ramp, 3));
              b.alpha = 0;
              b.dead = false;
              b.pts = [t.x, yy, t.x, yy];
              this.bolts.push(b);
              const inner = new FxTimeline();
              // grow from a point to the full rung width
              inner.span(0, 200, (p) => {
                const w = 13 * p;
                b.pts = [t.x - w, yy, t.x + w, yy];
                b.alpha = 0.4 + 0.6 * p;
              });
              // hold, then the downward ANSWER-SWEEP lights each rung as it passes
              inner.span(200, 760, (p) => {
                const lit = Math.abs(p - myPos) < 0.18;
                b.color = colorOf(px(lit ? RAMP.GOLD : ramp, 3));
                b.alpha = p >= 1 ? 0 : 1 - Math.max(0, (p - 0.75) / 0.25);
                if (p >= 1) b.dead = true;
              });
              this.timelines.push(inner);
            });
          }
          // the snap at the pane's foot: a flash, a closing ring, an answer-burst
          const snapAt = at + rungs * 26;
          this.flood(tl, snapAt, colorOf(px(RAMP.GOLD, 3)), 0.2, 240);
          this.ring(tl, snapAt, t.x, t.y, 6, 16, RAMP.GOLD, 260);
          tl.event(snapAt + 200, () => this.burst(t.x, t.y + paneH / 2, RAMP.GOLD, 8, 44, 360));
          hit(i, snapAt + 60);
        });
        tl.hold(40 + targets.length * 90 + rungs * 26 + 760 + 200);
        break;
      }
      case 'spiral': {
        // the Hypno spiral — motes orbit in and the eyelids follow
        this.sfx(tl, 60, spec.sfx);
        targets.forEach((t, i) => {
          tl.span(60 + i * 90, 760 + i * 90, (p) => {
            const a = p * Math.PI * 6;
            const r = 22 * (1 - p);
            this.spawnSparse(p, t.x + Math.cos(a) * r, t.y + Math.sin(a) * r * 0.7, ramp);
          });
          hit(i, 700 + i * 90);
        });
        tl.hold(820 + targets.length * 90);
        break;
      }
      case 'screen_flash': {
        // Flash α — the whole field whites out (under the cards: the law)
        this.sfx(tl, 60, spec.sfx);
        this.flood(tl, 60, 0xffffff, 0.5, 460);
        targets.forEach((t, i) => {
          tl.event(160, () => this.burst(t.x, t.y, ramp, 8, 50));
          hit(i, 220 + i * 40);
        });
        this.palettePulse(tl, 80, ramp);
        tl.hold(640);
        break;
      }
      case 'rocket': {
        // arcing projectile + payload burst. tier 4 (Multi) is a 4-volley; tiers
        // 2 (Big) and 3 (SIEGE — the boss-buster) are escalating SINGLE payloads
        // — the bigger the tier, the heavier the burst + shake (tier 2 unchanged).
        const volley = tier >= 4 ? 4 : 1;
        const big = tier === 2 || tier === 3;
        for (let v = 0; v < volley; v++) {
          const t = targets[v % Math.max(1, targets.length)];
          if (!t) break;
          const at = v * 140;
          this.sfx(tl, at, spec.sfx);
          tl.span(at, at + 380, (p) => {
            const sx = caster?.x ?? W / 2;
            const sy = caster?.y ?? 200;
            const x = sx + (t.x - sx) * p;
            const y = sy + (t.y - sy) * p - Math.sin(p * Math.PI) * 46;
            this.spawnSparse(p, x, y, RAMP.GOLD);
          });
          tl.event(at + 380, () => {
            this.burst(t.x, t.y, ramp, big ? 18 + (tier - 2) * 8 : 10, big ? 90 + (tier - 2) * 30 : 65, 460, big ? 2 : 1);
            AUDIO.sfx('smash');
          });
          this.hitFlash(tl, at + 390, t);
          hit(targets.indexOf(t), at + 400);
          if (big) this.shake(tl, at + 380, 180 + (tier - 2) * 80, 0.01 + (tier - 2) * 0.004);
        }
        tl.hold(volley * 140 + 640);
        break;
      }
      case 'scan': {
        // Spy: a scanline sweeps the target, then the stats stamp flashes
        this.sfx(tl, 40, spec.sfx);
        const t = targets[0];
        if (t) {
          const b = this.boltPool.take();
          b.color = colorOf(px(ramp, 3));
          b.alpha = 0;
          b.dead = false;
          b.pts = [0, 0, 0, 0];
          this.bolts.push(b);
          tl.span(40, 480, (p) => {
            const y = t.y - 26 + 52 * p;
            b.pts = [t.x - 26, y, t.x + 26, y];
            b.alpha = p >= 1 ? 0 : 0.9;
            if (p >= 1) b.dead = true;
          });
          // bracket corners stamp the reveal
          tl.event(500, () => {
            this.burst(t.x - 22, t.y - 22, ramp, 3, 18, 260);
            this.burst(t.x + 22, t.y - 22, ramp, 3, 18, 260);
            this.burst(t.x - 22, t.y + 22, ramp, 3, 18, 260);
            this.burst(t.x + 22, t.y + 22, ramp, 3, 18, 260);
          });
          hit(0, 520);
        }
        tl.hold(660);
        break;
      }
      case 'throw_arc': {
        // the Salt Shaker's arc — and the latch visibly breaks on impact
        this.sfx(tl, 0, spec.sfx);
        const t = targets[0];
        if (t) {
          tl.span(0, 360, (p) => {
            const sx = caster?.x ?? W / 2;
            const sy = caster?.y ?? 200;
            const x = sx + (t.x - sx) * p;
            const y = sy + (t.y - sy) * p - Math.sin(p * Math.PI) * 54;
            this.spawnSparse(p, x, y, RAMP.PAPER);
          });
          tl.event(360, () => {
            this.burst(t.x, t.y - 8, RAMP.PAPER, 14, 70, 380);
            if (this.tethered) this.severTether();
          });
          this.hitFlash(tl, 380, t);
          hit(0, 390);
        }
        tl.hold(620);
        break;
      }
      case 'munch': {
        this.sfx(tl, 120, spec.sfx);
        if (caster) {
          tl.event(60, () => this.motes(caster.x, caster.y - 4, 14, ramp, 4, 360));
          tl.event(260, () => this.burst(caster.x, caster.y, ramp, 4, 22, 280));
        }
        targets.forEach((_, i) => hit(i, 300));
        tl.hold(480);
        break;
      }
      case 'fizz': {
        this.sfx(tl, 80, spec.sfx);
        if (caster) {
          tl.span(60, 520, (p) => this.spawnSparse(p, caster.x - 6 + (p * 37) % 12, caster.y + 6 - p * 18, ramp));
        }
        targets.forEach((_, i) => hit(i, 360));
        tl.hold(560);
        break;
      }
      case 'porchlight': {
        // Glint's Spark: warm as a porch light in late summer
        this.sfx(tl, 60, spec.sfx);
        const t = targets[0] ?? caster;
        if (t) {
          this.flood(tl, 60, colorOf(px(RAMP.GOLD, 2)), 0.22, 700);
          tl.event(120, () => this.motes(t.x, t.y + 8, 26, RAMP.GOLD, 10, 900));
          this.ring(tl, 200, t.x, t.y, 4, 20, RAMP.GOLD, 420, 1);
        }
        targets.forEach((_, i) => hit(i, 420));
        tl.hold(880);
        break;
      }
      case 'comet': {
        // the cold stars answer — streaks fall across the whole field
        this.sfx(tl, 60, spec.sfx);
        const n = 5 + tier * 3;
        for (let s = 0; s < n; s++) {
          tl.event(80 + s * 60, () => {
            const x = 30 + ((s * 83) % (W - 60));
            this.spawn(x, 4, {
              vx: -34,
              vy: 130,
              life: 420,
              c0: 0xffffff,
              c1: colorOf(px(RAMP.CYAN, 2)),
              size: 2,
            });
          });
        }
        targets.forEach((t, i) => {
          const at = 220 + i * 100;
          tl.event(at, () => this.burst(t.x, t.y, RAMP.CYAN, 10 + tier * 3, 70));
          this.hitFlash(tl, at + 10, t);
          hit(i, at + 20);
        });
        if (tier >= 2) this.shake(tl, 300, 220, 0.012);
        tl.hold(80 + n * 60 + 420);
        break;
      }
      case 'siphon': {
        // Magnet: motes stream from the target back to the caster's palm
        this.sfx(tl, 60, spec.sfx);
        const t = targets[0];
        if (t && caster) {
          tl.span(60, 620, (p) => {
            const x = t.x + (caster.x - t.x) * p;
            const y = t.y + (caster.y - t.y) * p - Math.sin(p * Math.PI) * 12;
            this.spawnSparse(p, x, y, ramp);
          });
          hit(0, 560);
        }
        tl.hold(720);
        break;
      }
      case 'wire_cross': {
        // Brainjam: the wires of a mind, crossed
        this.sfx(tl, 80, spec.sfx);
        targets.forEach((t, i) => {
          this.bolt(tl, 100 + i * 90, t.x - 8, t.y - 6, ramp, t.y - 30);
          this.bolt(tl, 160 + i * 90, t.x + 8, t.y - 6, ramp, t.y - 30);
          tl.event(240 + i * 90, () => this.burst(t.x, t.y - 14, ramp, 6, 36, 300));
          hit(i, 300 + i * 90);
        });
        tl.hold(420 + targets.length * 90);
        break;
      }
      case 'revive': {
        // Healing γ / the §A4.7 return: a warm column stands the angel down
        this.sfx(tl, 100, spec.sfx);
        const t = targets[0];
        if (t) {
          tl.span(60, 700, (p) => this.spawnSparse(p, t.x - 8 + ((p * 53) % 16), t.y + 10 - p * 26, RAMP.GOLD));
          this.ring(tl, 320, t.x, t.y, 4, 22, RAMP.GOLD, 380);
          this.flood(tl, 280, colorOf(px(RAMP.GOLD, 2)), 0.18, 420);
          hit(0, 520);
        }
        tl.hold(840);
        break;
      }
      case 'pray': {
        // the hands-together beat before the roll (§A11.4 — played straight)
        this.sfx(tl, 0, 'pray');
        if (caster) tl.event(60, () => this.motes(caster.x, caster.y - 2, 16, RAMP.GOLD, 5, 520));
        tl.hold(420);
        break;
      }
      case 'pray_event': {
        this.prayEvent(tl, tier, ctx);
        break;
      }
      case 'impact': {
        this.sfx(tl, 0, spec.sfx);
        targets.forEach((t, i) => {
          tl.event(i * 100, () => this.burst(t.x, t.y, ramp, 8, 55));
          this.hitFlash(tl, i * 100 + 10, t);
          hit(i, i * 100 + 20);
        });
        tl.hold(targets.length * 100 + 240);
        break;
      }
      case 'smash': {
        // SMAAASH!! — the comic burst keeps its crown
        this.sfx(tl, 0, spec.sfx);
        const t = targets[0];
        if (t) {
          tl.event(0, () => {
            this.burst(t.x, t.y, RAMP.GOLD, 14, 95, 460, 2);
            for (let s = 0; s < 8; s++) {
              const b = this.boltPool.take();
              const a = (s / 8) * Math.PI * 2 + 0.2;
              b.pts = [t.x + Math.cos(a) * 8, t.y + Math.sin(a) * 8, t.x + Math.cos(a) * 26, t.y + Math.sin(a) * 26];
              b.color = colorOf(px(RAMP.GOLD, 3));
              b.alpha = 1;
              b.dead = false;
              this.bolts.push(b);
              const inner = new FxTimeline();
              inner.span(0, 260, (p) => {
                b.alpha = 1 - p;
                if (p >= 1) b.dead = true;
              });
              this.timelines.push(inner);
            }
          });
          this.hitFlash(tl, 20, t);
          hit(0, 40);
        }
        this.shake(tl, 0, 180, 0.012);
        tl.hold(420);
        break;
      }
      case 'dissolve': {
        // death per ADR-020: battle sprites float — they break up, never squash
        this.sfx(tl, 40, spec.sfx);
        const t = targets[0];
        const spr = t?.spr;
        if (t && spr) {
          tl.event(0, () => spr.setTintFill(0xf8f8f0));
          tl.event(120, () => {
            spr.clearTint();
            const w = spr.width;
            const h = spr.height;
            for (let i = 0; i < 16; i++) {
              this.spawn(t.x - w / 2 + ((i * 37) % w), t.y - h / 2 + ((i * 23) % h), {
                vx: ((i % 5) - 2) * 16,
                vy: -22 - (i % 4) * 10,
                ay: 26,
                life: 520 + (i % 3) * 90,
                c0: colorOf(px(ramp, 3)),
                c1: colorOf(px(RAMP.NIGHT, 1)),
              });
            }
          });
          tl.span(120, 520, (p) => spr.setAlpha(1 - p));
        }
        tl.hold(640);
        break;
      }
      case 'tether': {
        // visual handled by attachTether (persistent); this is the latch SNAP
        this.sfx(tl, 0, spec.sfx);
        const t = targets[0];
        if (t) tl.event(40, () => this.burst(t.x, t.y, RAMP.MAGENTA, 8, 40, 320));
        tl.hold(300);
        break;
      }
      case 'sever': {
        tl.event(0, () => this.severTether());
        tl.hold(320);
        break;
      }
      case 'summon': {
        // Prompt 15 hook: the Manager's summons arrive in a column of light
        this.sfx(tl, 0, spec.sfx);
        const t = targets[0];
        if (t) {
          tl.span(0, 380, (p) => this.spawnSparse(p, t.x - 6 + ((p * 41) % 12), t.y + 16 - p * 40, ramp));
          this.ring(tl, 280, t.x, t.y, 2, 18, ramp, 300);
        }
        this.flood(tl, 60, colorOf(px(ramp, 2)), 0.2, 360);
        tl.hold(520);
        break;
      }
      case 'phase_swap': {
        // Prompt 15 hook: boss form swaps announce themselves
        this.sfx(tl, 0, spec.sfx);
        this.flood(tl, 0, colorOf(px(ramp, 3)), 0.4, 420);
        this.palettePulse(tl, 60, ramp, 500);
        const t = targets[0];
        if (t) {
          this.ring(tl, 100, t.x, t.y, 6, 34, ramp, 380, 3);
          tl.event(140, () => this.burst(t.x, t.y, ramp, 16, 80, 460));
          this.hitFlash(tl, 120, t);
        }
        this.shake(tl, 80, 240, 0.012);
        tl.hold(620);
        break;
      }
      case 'guard': {
        this.sfx(tl, 40, spec.sfx);
        const t = targets[0] ?? caster;
        if (t) this.ring(tl, 40, t.x, t.y, 16, 9, ramp, 220);
        tl.hold(300);
        break;
      }
      case 'heal_glow': {
        this.sfx(tl, 40, spec.sfx);
        const t = targets[0] ?? caster;
        if (t) {
          tl.event(40, () => this.motes(t.x, t.y + 6, 28, ramp, 8, 600));
          this.ring(tl, 80, t.x, t.y, 4, 16, ramp, 300, 1);
        }
        tl.hold(520);
        break;
      }
      case 'run_up':
      case 'overnight': {
        // out-of-battle abilities (Teleport's run-up, Repair's overnight) —
        // registered so the manifest closes, never played by BattleScene
        tl.hold(1);
        break;
      }
    }

    this.timelines.push(tl);
    return tl.whenDone();
  }

  /** the six pray events — §A11.4: hopeful even on Nothing */
  private prayEvent(tl: FxTimeline, tier: number, ctx: FxContext): void {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const caster = ctx.caster;
    const targets = ctx.targets ?? [];
    const spec = { sfx: undefined as string | undefined };
    switch (tier) {
      case 6: {
        // MIRACULOUS — the screen floods warm; something enormous smiles back
        spec.sfx = 'pray_mir';
        this.sfx(tl, 0, spec.sfx);
        this.flood(tl, 0, colorOf(px(RAMP.GOLD, 3)), 0.45, 1100);
        this.palettePulse(tl, 100, RAMP.GOLD, 700);
        for (let i = 0; i < 7; i++) {
          tl.event(80 + i * 110, () => this.motes(30 + ((i * 67) % (W - 60)), H - 60, 50, RAMP.GOLD, 6, 1000));
        }
        targets.forEach((t, i) => {
          const at = 420 + i * 120;
          this.ring(tl, at, t.x, t.y, 4, 30, RAMP.GOLD, 420);
          tl.event(at + 40, () => this.burst(t.x, t.y, RAMP.GOLD, 12, 70));
          this.hitFlash(tl, at + 50, t);
          tl.event(at + 60, () => ctx.onHit?.(i));
        });
        tl.hold(1500);
        break;
      }
      case 5: {
        // WONDERFUL — a wave of warmth rolls over everyone
        spec.sfx = 'pray_won';
        this.sfx(tl, 0, spec.sfx);
        this.flood(tl, 60, colorOf(px(RAMP.GOLD, 2)), 0.3, 700);
        tl.span(60, 660, (p) => this.spawnSparse(p, W * p, 70 + Math.sin(p * 6) * 16, RAMP.GOLD));
        targets.forEach((t, i) => {
          tl.event(360 + i * 100, () => this.burst(t.x, t.y, RAMP.GOLD, 8, 55));
          this.hitFlash(tl, 370 + i * 100, t);
          tl.event(380 + i * 100, () => ctx.onHit?.(i));
        });
        tl.hold(1000);
        break;
      }
      case 4: {
        // GOOD — a soft light settles on the party
        spec.sfx = 'pray_good';
        this.sfx(tl, 60, spec.sfx);
        targets.forEach((t, i) => {
          tl.event(120 + i * 90, () => this.rain(t.x, t.y, 36, RAMP.GOLD, 8));
          tl.event(320 + i * 90, () => ctx.onHit?.(i));
        });
        tl.hold(760);
        break;
      }
      case 3: {
        // NOTHING — one mote rises anyway. It tries. (§A11.4)
        spec.sfx = 'pray_none';
        this.sfx(tl, 200, spec.sfx);
        if (caster) {
          tl.span(100, 900, (p) => {
            if (Math.floor(p * 24) % 6 === 0) {
              this.spawn(caster.x, caster.y - 6 - p * 30, {
                vy: -6,
                life: 200,
                c0: colorOf(px(RAMP.GOLD, 3)),
                c1: colorOf(px(RAMP.GOLD, 1)),
              });
            }
          });
          tl.event(940, () => this.burst(caster.x, caster.y - 40, RAMP.GOLD, 3, 14, 240));
        }
        tl.hold(1100);
        break;
      }
      case 2: {
        // STRANGE — the light comes back weird and lands on SOMEBODY
        spec.sfx = 'pray_str';
        this.sfx(tl, 80, spec.sfx);
        const t = targets[0];
        if (caster && t) {
          tl.span(80, 700, (p) => {
            const x = caster.x + (t.x - caster.x) * p + Math.sin(p * 14) * 10;
            const y = caster.y + (t.y - caster.y) * p + Math.cos(p * 11) * 8;
            this.spawnSparse(p, x, y, RAMP.PURPLE);
          });
          tl.event(700, () => this.burst(t.x, t.y, RAMP.PURPLE, 8, 45));
          this.hitFlash(tl, 710, t);
          tl.event(720, () => ctx.onHit?.(0));
        }
        this.palettePulse(tl, 120, RAMP.PURPLE, 500);
        tl.hold(900);
        break;
      }
      default: {
        // BACKFIRE — the soft flare; somebody's eyelids get heavy
        spec.sfx = 'pray_back';
        this.sfx(tl, 60, spec.sfx);
        this.flood(tl, 60, colorOf(px(RAMP.GOLD, 3)), 0.35, 380);
        targets.forEach((t, i) => {
          tl.event(300 + i * 70, () => this.burst(t.x, t.y - 4, RAMP.GOLD, 4, 26, 300));
          tl.event(340 + i * 70, () => ctx.onHit?.(i));
        });
        tl.hold(720);
        break;
      }
    }
  }

  /** span helper: emit a particle only on a sparse cadence of the progress */
  private spawnSparse(p: number, x: number, y: number, ramp: number): void {
    if (Math.floor(p * 40) % 2 !== 0) return;
    this.spawn(x, y, {
      life: 260,
      c0: colorOf(px(ramp, 3)),
      c1: colorOf(px(ramp, 1)),
    });
  }
}
