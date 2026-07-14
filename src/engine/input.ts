/**
 * Unified input (GAME_BIBLE §B1 row "Input"): one semantic action layer fed by
 * three sources — keyboard (dev), Gamepad API (Bluetooth/USB controllers,
 * polled raw so it works in Android WebView), and the touch overlay (UIScene
 * writes into touchDir/touchBtns). Touch controls auto-hide on gamepad
 * connect; both directions hot-swap.
 *
 * S12c: the layer grows X and Y (the cage's SPRINT and DRIBBLE-MOVE buttons;
 * the RPG ignores them until something claims them) and a REBINDABLE binding
 * table — SETUP → CONTROLS captures a physical key or pad button per semantic
 * action, persisted DEVICE-LOCAL like the Sound preference (never save data).
 * Every read in the game already goes through held()/justPressed()/dir(), so
 * the RPG and the cage both read through the table by construction. Pad
 * defaults: A=0 B=1 X=2 Y=3 START=9 — pad B NARROWED from buttons 1|2 to 1
 * (button 2 is X now; ADR records it).
 */

export type Btn = 'A' | 'B' | 'X' | 'Y' | 'START';
export const BTNS: readonly Btn[] = ['A', 'B', 'X', 'Y', 'START'] as const;
export type BindingProfile = 'main' | 'hoops';

export interface Bindings {
  keys: Record<Btn, string[]>;
  pad: Record<Btn, number[]>;
}

export const DEFAULT_BINDINGS: Bindings = {
  keys: {
    A: ['KeyZ', 'Space'],
    B: ['KeyX', 'ShiftLeft', 'ShiftRight'],
    X: ['KeyC'],
    Y: ['KeyV'],
    START: ['Enter'],
  },
  pad: { A: [0], B: [1], X: [2], Y: [3], START: [9] },
};

/** device-local persistence keys (the meteor-falls-sound pattern) */
const BIND_KEYS: Record<BindingProfile, string> = {
  main: 'meteor-falls-controls',
  hoops: 'meteor-falls-hoops-controls',
};

function cloneBindings(b: Bindings): Bindings {
  return {
    keys: Object.fromEntries(BTNS.map((k) => [k, [...b.keys[k]]])) as Record<Btn, string[]>,
    pad: Object.fromEntries(BTNS.map((k) => [k, [...b.pad[k]]])) as Record<Btn, number[]>,
  };
}

type BindingGuard<T> = (value: unknown) => value is T;

/** Repair persisted binding tables into complete, globally unique mappings. */
function normalizeBindingSource<T>(
  raw: Partial<Record<Btn, unknown>> | undefined,
  fallback: Record<Btn, T[]>,
  defaults: Record<Btn, T[]>,
  valid: BindingGuard<T>,
): Record<Btn, T[]> {
  const out = Object.fromEntries(BTNS.map((b) => [b, [] as T[]])) as Record<Btn, T[]>;
  const used = new Set<T>();

  // Preserve valid user choices first. BTNS order makes repair of an already
  // corrupt duplicate deterministic.
  for (const b of BTNS) {
    const saved = raw?.[b];
    const candidates = Array.isArray(saved) && saved.some(valid) ? saved.filter(valid) : fallback[b];
    for (const value of candidates) {
      if (used.has(value)) continue;
      used.add(value);
      out[b].push(value);
    }
  }

  // If all saved values were duplicates, prefer this action's fallback and
  // then any free canonical input. Shipped defaults contain enough unique
  // values for all five actions.
  const globalFallbacks = BTNS.flatMap((b) => [...fallback[b], ...defaults[b]]);
  for (const b of BTNS) {
    if (out[b].length > 0) continue;
    const replacement = [...fallback[b], ...defaults[b], ...globalFallbacks].find((value) => !used.has(value));
    if (replacement === undefined) throw new Error(`No unique ${b} input binding is available`);
    used.add(replacement);
    out[b].push(replacement);
  }
  return out;
}

function normalizeBindings(raw: Partial<Bindings> | undefined, fallback: Bindings): Bindings {
  return {
    keys: normalizeBindingSource(
      raw?.keys as Partial<Record<Btn, unknown>> | undefined,
      fallback.keys,
      DEFAULT_BINDINGS.keys,
      (value): value is string => typeof value === 'string' && value.length > 0,
    ),
    pad: normalizeBindingSource(
      raw?.pad as Partial<Record<Btn, unknown>> | undefined,
      fallback.pad,
      DEFAULT_BINDINGS.pad,
      (value): value is number => Number.isInteger(value) && (value as number) >= 0,
    ),
  };
}

function loadBindings(profile: BindingProfile, fallback: Bindings = DEFAULT_BINDINGS): Bindings {
  try {
    const raw = localStorage.getItem(BIND_KEYS[profile]);
    if (!raw) return normalizeBindings(fallback, fallback);
    const parsed: unknown = JSON.parse(raw);
    return normalizeBindings(parsed && typeof parsed === 'object' ? parsed as Partial<Bindings> : undefined, fallback);
  } catch {
    return normalizeBindings(fallback, fallback);
  }
}

type Listener = (connected: boolean, padId: string) => void;
/** press-to-capture: the controls page hands us a one-shot sink */
type CaptureSink = (source: 'key' | 'pad', code: string | number) => void;

export class InputBus {
  private keysDown = new Set<string>();
  /** written by the touch overlay scene */
  touchDir = { x: 0, y: 0 };
  touchBtns = new Set<Btn>();

  private cur = new Set<Btn>();
  private prev = new Set<Btn>();
  /**
   * Press latch (ADR-024): every source TRANSITION (keydown, touch tap) lands
   * here the moment it happens, and update() folds it into the next frame's
   * snapshot. A tap shorter than one frame — or one that lands inside a GC
   * hitch — can no longer vanish between two update() calls.
   */
  private queued = new Set<Btn>();
  /**
   * Release latch (ADR-038 — the press latch's mirror): keyup and touch-lift
   * transitions land here the moment they happen, so a release followed by a
   * re-press inside ONE frame still reads as a release (the pump-fake/quick-
   * pump case the held-set diff can never see). Caveat, documented: holding
   * TWO keys bound to the same button and lifting one fires a release edge —
   * the event IS a release of a bound key; nobody plays chords on one action.
   */
  private releaseQueued = new Set<Btn>();
  private released = new Set<Btn>();
  private padIndex: number | null = null;
  private padId = '';
  private listeners = new Set<Listener>();
  gamepadConnected = false;

  /** the live binding tables (SETUP controls edit them; device-local) */
  private profiles: Record<BindingProfile, Bindings> = (() => {
    const main = loadBindings('main');
    const hoops = loadBindings('hoops', main);
    return { main, hoops };
  })();
  private activeProfile: BindingProfile = 'main';
  private capture: CaptureSink | null = null;
  /** pad buttons already down when capture starts must not auto-capture */
  private padPrevPressed = new Set<number>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (!e.repeat && this.capture) {
          const sink = this.capture;
          this.capture = null;
          sink('key', e.code);
          e.preventDefault();
          return;
        }
        this.keysDown.add(e.code);
        if (!e.repeat) {
          const b = this.btnForKey(e.code);
          if (b) this.queued.add(b);
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => {
        this.keysDown.delete(e.code);
        const b = this.btnForKey(e.code);
        if (b) this.releaseQueued.add(b); // ADR-038: releases latch like presses
      });
      window.addEventListener('blur', () => this.keysDown.clear());
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        // Prefer the controller that just announced itself, matching the old
        // hot-swap behavior while routing all state through reconciliation.
        this.reconcilePad(e.gamepad.index, null, e.gamepad);
      });
      window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
        if (this.padIndex !== e.gamepad.index) return;
        // Some browsers leave the disconnected entry visible during the event
        // turn, so explicitly exclude it while selecting a live fallback.
        this.reconcilePad(null, e.gamepad.index);
      });
    }
    // Covers a controller already connected before reload and browsers which
    // suppress gamepadconnected until the first physical input.
    this.reconcilePad();
  }

  private btnForKey(code: string): Btn | null {
    const bindings = this.bindingsFor();
    for (const b of BTNS) if (bindings.keys[b].includes(code)) return b;
    return null;
  }

  onGamepad(l: Listener): () => void {
    this.listeners.add(l);
    // UIScene subscribes after this singleton is constructed; immediately
    // replay the usable controller so overlay visibility is never stale.
    if (this.gamepadConnected) l(true, this.padId);
    return () => this.listeners.delete(l);
  }

  bindingsFor(profile: BindingProfile = this.activeProfile): Bindings {
    return this.profiles[profile];
  }

  useProfile(profile: BindingProfile): () => void {
    const prevProfile = this.activeProfile;
    this.activeProfile = profile;
    const held = this.readHeldButtons(profile);
    this.cur = new Set(held);
    this.prev = new Set(held);
    this.queued.clear();
    this.releaseQueued.clear();
    this.released.clear();
    return () => {
      this.activeProfile = prevProfile;
      const restoredHeld = this.readHeldButtons(prevProfile);
      this.cur = new Set(restoredHeld);
      this.prev = new Set(restoredHeld);
      this.queued.clear();
      this.releaseQueued.clear();
      this.released.clear();
    };
  }

  private readHeldButtons(profile: BindingProfile): Set<Btn> {
    const out = new Set<Btn>();
    const bindings = this.bindingsFor(profile);
    for (const b of BTNS) {
      if (bindings.keys[b].some((k) => this.keysDown.has(k))) out.add(b);
    }
    this.touchBtns.forEach((b) => out.add(b));
    const pad = this.pad();
    if (pad && !this.capture) {
      for (const b of BTNS) {
        if (bindings.pad[b].some((i) => pad.buttons[i]?.pressed)) out.add(b);
      }
    }
    return out;
  }

  /* ---------------- rebinding (S12c — SETUP → CONTROLS) ---------------- */

  /**
   * One-shot press-to-capture: the next physical keydown OR newly-pressed pad
   * button lands in the sink (and is swallowed — it must not also act).
   * Returns a cancel function. Pad capture is polled in update().
   */
  captureNext(sink: CaptureSink): () => void {
    this.capture = sink;
    this.padPrevPressed = new Set(this.padPressedNow());
    return () => {
      if (this.capture === sink) this.capture = null;
    };
  }

  get capturing(): boolean {
    return this.capture !== null;
  }

  /** rebind a semantic action to one physical key (replaces its key list) */
  rebindKey(btn: Btn, code: string, profile: BindingProfile = this.activeProfile): void {
    this.profiles[profile] = normalizeBindings(this.profiles[profile], DEFAULT_BINDINGS);
    this.rebindSource(this.profiles[profile].keys, btn, code, DEFAULT_BINDINGS.keys);
    this.persistBindings(profile);
  }

  /** rebind a semantic action to one pad button index */
  rebindPad(btn: Btn, idx: number, profile: BindingProfile = this.activeProfile): void {
    this.profiles[profile] = normalizeBindings(this.profiles[profile], DEFAULT_BINDINGS);
    this.rebindSource(this.profiles[profile].pad, btn, idx, DEFAULT_BINDINGS.pad);
    this.persistBindings(profile);
  }

  /**
   * Give one physical input exclusively to `btn`. If that steals another
   * action's final binding, give it one of the target's newly freed inputs (a
   * deterministic swap) before falling back to an unused canonical default.
   */
  private rebindSource<T>(source: Record<Btn, T[]>, btn: Btn, value: T, defaults: Record<Btn, T[]>): void {
    const freed = source[btn].filter((candidate) => candidate !== value);
    for (const b of BTNS) source[b] = source[b].filter((candidate) => candidate !== value);
    source[btn] = [value];

    const used = new Set(BTNS.flatMap((b) => source[b]));
    const globalDefaults = BTNS.flatMap((b) => defaults[b]);
    for (const b of BTNS) {
      if (source[b].length > 0) continue;
      const replacement = [...freed, ...defaults[b], ...globalDefaults].find((candidate) => !used.has(candidate));
      if (replacement === undefined) throw new Error(`No unique ${b} input binding is available`);
      source[b] = [replacement];
      used.add(replacement);
    }
  }

  resetBindings(profile: BindingProfile = this.activeProfile): void {
    this.profiles[profile] = cloneBindings(DEFAULT_BINDINGS);
    this.persistBindings(profile);
  }

  private persistBindings(profile: BindingProfile): void {
    try {
      localStorage.setItem(BIND_KEYS[profile], JSON.stringify(this.profiles[profile]));
    } catch {
      /* storage denied — bindings live for the session */
    }
  }

  /* ---------------- sources ---------------- */

  /** touch overlay taps latch through here so sub-frame taps still land */
  pressBtn(b: Btn): void {
    this.touchBtns.add(b);
    this.queued.add(b);
  }

  /** touch overlay lifts latch through here (ADR-038) — a thumb that taps
   *  and lifts inside one frame still reads press-then-release */
  releaseBtn(b: Btn): void {
    this.touchBtns.delete(b);
    this.releaseQueued.add(b);
  }

  /**
   * One-frame press from a source with no release event (the Android back
   * button, S8): rides the ADR-024 latch, never enters the held set — so
   * back-as-B can cancel a menu but can never read as B-held running.
   */
  tapBtn(b: Btn): void {
    this.queued.add(b);
  }

  private livePads(): Array<Gamepad | null> {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
    try {
      return Array.from(navigator.getGamepads(), (pad) => pad && pad.connected !== false ? pad : null);
    } catch {
      return [];
    }
  }

  private selectPad(next: Gamepad | null): Gamepad | null {
    const nextIndex = next?.index ?? null;
    const nextId = next?.id ?? '';
    const changed = nextIndex !== this.padIndex || nextId !== this.padId;
    const previousId = this.padId;
    const wasConnected = this.gamepadConnected;

    this.padIndex = nextIndex;
    this.padId = nextId;
    this.gamepadConnected = next !== null;

    if (changed) {
      if (next) this.listeners.forEach((listener) => listener(true, next.id));
      else if (wasConnected) this.listeners.forEach((listener) => listener(false, previousId));
    }
    return next;
  }

  /** Select one usable controller and keep public state/listeners in lockstep. */
  private reconcilePad(
    preferredIndex: number | null = null,
    unavailableIndex: number | null = null,
    eventPad: Gamepad | null = null,
  ): Gamepad | null {
    const pads = this.livePads();
    const usable = (pad: Gamepad | null | undefined): pad is Gamepad =>
      !!pad && pad.connected !== false && pad.index !== unavailableIndex;

    let next: Gamepad | null = null;
    if (preferredIndex !== null) {
      const preferred = pads[preferredIndex];
      if (usable(preferred)) next = preferred;
      else if (eventPad?.index === preferredIndex && usable(eventPad)) next = eventPad;
    }
    if (!next && this.padIndex !== null && usable(pads[this.padIndex])) next = pads[this.padIndex] as Gamepad;
    if (!next) next = pads.find(usable) ?? null;
    return this.selectPad(next);
  }

  private pad(): Gamepad | null {
    // Bluetooth pads blip null mid-session (and Chrome withholds the connect
    // event after a reload until the first input) — fall back to any live pad
    // so a press is never read against a dead handle (ADR-024).
    return this.reconcilePad();
  }

  private padPressedNow(): number[] {
    const pad = this.pad();
    if (!pad) return [];
    const out: number[] = [];
    pad.buttons.forEach((bt, i) => {
      if (bt?.pressed) out.push(i);
    });
    return out;
  }

  /** call once per frame — main.ts PRE_STEP owns this, before any scene runs */
  update(): void {
    // pad press-to-capture: the first NEWLY pressed button wins
    if (this.capture) {
      const now = this.padPressedNow();
      const fresh = now.find((i) => !this.padPrevPressed.has(i));
      this.padPrevPressed = new Set(now);
      if (fresh !== undefined) {
        const sink = this.capture;
        this.capture = null;
        sink('pad', fresh);
      }
    }
    this.prev = this.cur;
    this.cur = new Set<Btn>();
    const bindings = this.bindingsFor();
    for (const b of BTNS) {
      if (bindings.keys[b].some((k) => this.keysDown.has(k))) this.cur.add(b);
    }
    this.touchBtns.forEach((b) => this.cur.add(b));
    const pad = this.pad();
    if (pad && !this.capture) {
      for (const b of BTNS) {
        if (bindings.pad[b].some((i) => pad.buttons[i]?.pressed)) this.cur.add(b);
      }
    }
    // fold in latched taps, then clear — each press is visible ≥1 full frame
    this.queued.forEach((b) => this.cur.add(b));
    this.queued.clear();
    // releases: held-set diffs (covers pads at poll granularity) UNIONED with
    // the latch — a sub-frame lift, or a lift-and-re-press, never vanishes
    this.released = new Set<Btn>();
    this.prev.forEach((b) => {
      if (!this.cur.has(b)) this.released.add(b);
    });
    this.releaseQueued.forEach((b) => this.released.add(b));
    this.releaseQueued.clear();
  }

  /** 8-direction intent: each axis −1, 0, or 1 */
  dir(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.keysDown.has('ArrowLeft') || this.keysDown.has('KeyA')) x -= 1;
    if (this.keysDown.has('ArrowRight') || this.keysDown.has('KeyD')) x += 1;
    if (this.keysDown.has('ArrowUp') || this.keysDown.has('KeyW')) y -= 1;
    if (this.keysDown.has('ArrowDown') || this.keysDown.has('KeyS')) y += 1;
    const pad = this.pad();
    if (pad) {
      if (pad.buttons[14]?.pressed) x -= 1;
      if (pad.buttons[15]?.pressed) x += 1;
      if (pad.buttons[12]?.pressed) y -= 1;
      if (pad.buttons[13]?.pressed) y += 1;
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (Math.abs(ax) > 0.4) x += Math.sign(ax);
      if (Math.abs(ay) > 0.4) y += Math.sign(ay);
    }
    x += this.touchDir.x;
    y += this.touchDir.y;
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  }

  held(b: Btn): boolean {
    return this.cur.has(b);
  }

  justPressed(b: Btn): boolean {
    return this.cur.has(b) && !this.prev.has(b);
  }

  /** the release edge, latch-backed (ADR-038) — symmetric to justPressed.
   *  True for exactly one frame per physical release, even when the button
   *  was re-pressed before the frame closed. */
  justReleased(b: Btn): boolean {
    return this.released.has(b);
  }
}

export const INPUT = new InputBus();
