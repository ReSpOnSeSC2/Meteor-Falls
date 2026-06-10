/**
 * Unified input (GAME_BIBLE §B1 row "Input"): one semantic action layer fed by
 * three sources — keyboard (dev), Gamepad API (Bluetooth/USB controllers,
 * polled raw so it works in Android WebView), and the touch overlay (UIScene
 * writes into touchDir/touchBtns). Touch controls auto-hide on gamepad
 * connect; both directions hot-swap.
 */

export type Btn = 'A' | 'B' | 'START';

type Listener = (connected: boolean, padId: string) => void;

const KEY_MAP_A = ['KeyZ', 'Space'];
const KEY_MAP_B = ['KeyX', 'ShiftLeft', 'ShiftRight'];
const KEY_MAP_START = ['Enter'];

class InputBus {
  private keysDown = new Set<string>();
  /** written by the touch overlay scene */
  touchDir = { x: 0, y: 0 };
  touchBtns = new Set<Btn>();

  private cur = new Set<Btn>();
  private prev = new Set<Btn>();
  private padIndex: number | null = null;
  private listeners: Listener[] = [];
  gamepadConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        this.keysDown.add(e.code);
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => this.keysDown.delete(e.code));
      window.addEventListener('blur', () => this.keysDown.clear());
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        this.padIndex = e.gamepad.index;
        this.gamepadConnected = true;
        this.listeners.forEach((l) => l(true, e.gamepad.id));
      });
      window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
        if (this.padIndex === e.gamepad.index) {
          this.padIndex = null;
          this.gamepadConnected = false;
          this.listeners.forEach((l) => l(false, e.gamepad.id));
        }
      });
    }
  }

  onGamepad(l: Listener): void {
    this.listeners.push(l);
  }

  private pad(): Gamepad | null {
    if (this.padIndex === null || typeof navigator === 'undefined') return null;
    const pads = navigator.getGamepads();
    return pads[this.padIndex] ?? null;
  }

  /** call once per frame (UIScene owns this) */
  update(): void {
    this.prev = this.cur;
    this.cur = new Set<Btn>();
    if (KEY_MAP_A.some((k) => this.keysDown.has(k))) this.cur.add('A');
    if (KEY_MAP_B.some((k) => this.keysDown.has(k))) this.cur.add('B');
    if (KEY_MAP_START.some((k) => this.keysDown.has(k))) this.cur.add('START');
    this.touchBtns.forEach((b) => this.cur.add(b));
    const pad = this.pad();
    if (pad) {
      if (pad.buttons[0]?.pressed) this.cur.add('A');
      if (pad.buttons[1]?.pressed || pad.buttons[2]?.pressed) this.cur.add('B');
      if (pad.buttons[9]?.pressed) this.cur.add('START');
    }
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
}

export const INPUT = new InputBus();
