/**
 * FX timeline core — S11 "The Living Battle" (GAME_BIBLE Prompt 12/14
 * presentation pass). Phaser-free on purpose: this file is the part of the
 * effect system vitest exercises headlessly (timeline math, pooling), and
 * tools/content-validate.ts imports the registry that sits beside it.
 *
 * A timeline is EVENTS (fire once at t) + SPANS (update(progress) from t0..t1)
 * advanced by tick(dtMs). The caller scales dt before passing it in — holding
 * A/B fast-forwards battle choreography at the SAME ×4 the text typewriter
 * uses (ADR-010): one skip state, one multiplier, applied where dt is read.
 * Tweens are for pure cosmetics only (ADR-024) — anything a battle awaits
 * goes through here so the ADR-008 bot's pump() replays it deterministically.
 */

export interface FxEvent {
  at: number;
  run: () => void;
  fired: boolean;
}

export interface FxSpan {
  from: number;
  to: number;
  update: (progress: number) => void;
  done: boolean;
}

export class FxTimeline {
  private t = 0;
  private events: FxEvent[] = [];
  private spans: FxSpan[] = [];
  private tail = 0;
  private onDone: Array<() => void> = [];
  private finished = false;

  /** current clock, ms (read-only outside; tests assert against it) */
  get clock(): number {
    return this.t;
  }

  get done(): boolean {
    return this.finished;
  }

  get duration(): number {
    return this.tail;
  }

  /** fire once when the clock reaches `at` ms */
  event(at: number, run: () => void): this {
    this.events.push({ at, run, fired: false });
    this.tail = Math.max(this.tail, at);
    return this;
  }

  /** update(progress 0..1) every tick while the clock is inside [from, to] —
   *  always receives a final 1.0 so end states are exact under any dt */
  span(from: number, to: number, update: (p: number) => void): this {
    this.spans.push({ from, to: Math.max(to, from + 0.0001), update, done: false });
    this.tail = Math.max(this.tail, to);
    return this;
  }

  /** extend the timeline's tail without scheduling anything (a held beat) */
  hold(until: number): this {
    this.tail = Math.max(this.tail, until);
    return this;
  }

  /**
   * Advance by dtMs (pre-scaled by the caller's skip state). Events fire in
   * time order even when one tick jumps past several; spans get their final
   * progress=1 exactly once. Returns true when the timeline completes.
   */
  tick(dtMs: number): boolean {
    if (this.finished) return true;
    this.t += dtMs;
    // events in schedule order — a big skip tick still fires every beat
    this.events.sort((a, b) => a.at - b.at);
    for (const e of this.events) {
      if (!e.fired && e.at <= this.t) {
        e.fired = true;
        e.run();
      }
    }
    for (const s of this.spans) {
      if (s.done || this.t < s.from) continue;
      const p = Math.min(1, (this.t - s.from) / (s.to - s.from));
      s.update(p);
      if (p >= 1) s.done = true;
    }
    if (this.t >= this.tail) {
      this.finished = true;
      const cbs = this.onDone;
      this.onDone = [];
      cbs.forEach((cb) => cb());
      return true;
    }
    return false;
  }

  /** resolve when the timeline completes (already-done resolves immediately) */
  whenDone(): Promise<void> {
    if (this.finished) return Promise.resolve();
    return new Promise((res) => this.onDone.push(res));
  }
}

/**
 * Multi-target stagger: impact times for N targets, one every `step` ms after
 * `base` — the "sweep" read of an all-enemy spell (each enemy answers in
 * turn, not as one clump).
 */
export function staggerTimes(count: number, base: number, step = 110): number[] {
  return Array.from({ length: count }, (_, i) => base + i * step);
}

/**
 * Object pool — Prompt 42 profiles BattleScene hardest, so every transient
 * effect object (particle struct, popup text, tether segment) cycles through
 * one of these instead of churning the GC at 60fps.
 */
export class Pool<T> {
  private free: T[] = [];
  private created = 0;

  constructor(
    private make: () => T,
    private reset: (o: T) => void,
  ) {}

  take(): T {
    const o = this.free.pop();
    if (o !== undefined) return o;
    this.created++;
    return this.make();
  }

  give(o: T): void {
    this.reset(o);
    this.free.push(o);
  }

  /** total objects ever constructed — tests assert reuse keeps this flat */
  get totalCreated(): number {
    return this.created;
  }

  get available(): number {
    return this.free.length;
  }
}
