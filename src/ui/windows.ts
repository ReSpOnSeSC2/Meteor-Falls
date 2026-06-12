/**
 * EB-style window system (GAME_BIBLE Prompt 6): beveled rounded windows,
 * letter-by-letter text with A-to-fast-forward, @-speaker convention, choice
 * menus with the pointing-hand cursor, toasts. Touch AND controller drive
 * everything: rows are tappable, A/B map to taps.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { GS } from '../engine/state';
import { colorOf } from '../palette';
import { RAMP, px } from '../palette';
import { vars } from './text';

export { vars } from './text';

export const DEPTH_UI = 1000;

/**
 * Full-screen overlays (night tint, covers) MUST bleed past the viewport:
 * camera scroll rounding shifts scrollFactor-0 shapes and the tilemap by
 * unequal sub-pixels, exposing screen row 0 as an untinted line (playtest,
 * S15c — pixel-proven at scrollY 171: row 0 read day grass over a night
 * map). 4px of overscan on every edge absorbs the asymmetry forever.
 */
export const OVERSCAN = 4;
export function overscanRect(w: number, h: number): { x: number; y: number; w: number; h: number } {
  return { x: -OVERSCAN, y: -OVERSCAN, w: w + OVERSCAN * 2, h: h + OVERSCAN * 2 };
}

/**
 * Run cb once per rendered frame while the scene runs (ADR-024). UI polls
 * MUST use this instead of 16ms Clock timers: INPUT edges (justPressed) are
 * true for exactly ONE frame, and a Clock timer fires less often than once
 * per frame on >60Hz displays — that mismatch silently ate button presses.
 * Pauses with the scene exactly like a timer would. Returns an unsubscribe.
 */
export function everyFrame(scene: Phaser.Scene, cb: (dtMs: number) => void): () => void {
  const handler = (_t: number, delta: number): void => cb(delta);
  scene.events.on(Phaser.Scenes.Events.UPDATE, handler);
  const off = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, handler);
  };
  // S15c: polls die with the scene. A stop/restart mid-poll used to leave
  // the handler subscribed to the persistent scene emitter while its UI
  // objects were destroyed — the next life of the scene then drove the
  // poll into a corpse every frame (caught live: a say() typewriter
  // setText on a destroyed BitmapText threw on every pump, forever).
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  return off;
}

/** S14b: the live window-flavor texture key (Prompt 6 — per SAVE FILE: the
 *  pick is a plain number flag, so it rides the notebook with no save step) */
export function winTexture(): string {
  const n = Number(GS.flag('win_flavor')) || 0;
  return n > 0 && n <= 3 ? `win9_${n}` : 'win9';
}

/** S14b: the per-save text speed — 0 patient · 1 normal · 2 brisk; every
 *  typewriter (dialogue + battle) multiplies its chars/frame through this */
export function textSpeedMul(): number {
  const raw = GS.flag('text_speed');
  const n = raw === false ? 1 : Number(raw); // unset = NORMAL
  return n === 0 ? 0.55 : n === 2 ? 1.7 : 1;
}

export function makeWindow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.NineSlice {
  const win = scene.add.nineslice(x, y, winTexture(), 0, w, h, 8, 8, 8, 8);
  win.setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI);
  return win;
}

export function makeBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.NineSlice {
  const win = scene.add.nineslice(x, y, 'box9', 0, w, h, 6, 6, 6, 6);
  win.setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI);
  return win;
}

/* ------------------------------------------------------------------ */

export class Dialogue {
  private scene: Phaser.Scene;
  private win: Phaser.GameObjects.NineSlice | null = null;
  private text: Phaser.GameObjects.BitmapText | null = null;
  private cursor: Phaser.GameObjects.BitmapText | null = null;
  /** true while a say()/ask() is running — owner scene pauses the world */
  busy = false;
  /** scene-time stamp of the last say()/ask() teardown (see justReleased) */
  private releasedAt = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * True on the very frame a dialogue tore down. ask()'s poll runs in the
   * scene's PRE-update phase, so the A that confirms a menu row would still
   * read as justPressed in the SAME frame's update() — without this check
   * the overworld re-fires interact() and a second conversation interleaves
   * with the first (S6's notebook ask exposed it; the S4 contact list and
   * ATM menus had the same latent race).
   */
  justReleased(now: number): boolean {
    return now <= this.releasedAt;
  }

  private layout(): { x: number; y: number; w: number; h: number } {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    return { x: 8, y: H - 66, w: W - 16, h: 60 };
  }

  /** Show pages of dialogue. Each string is one page; @ prefix = speech. */
  async say(...pages: string[]): Promise<void> {
    this.busy = true;
    const { x, y, w, h } = this.layout();
    this.win ??= makeWindow(this.scene, x, y, w, h);
    this.win.setTexture(winTexture()); // a flavor change applies live (S14b)
    this.win.setVisible(true);
    this.text ??= this.scene.add
      .bitmapText(x + 10, y + 8, 'retro', '', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(w - 24);
    this.text.setVisible(true);
    this.cursor ??= this.scene.add
      .bitmapText(x + w - 16, y + h - 14, 'retro', '▼', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    for (const raw of pages) {
      const page = vars(raw);
      await this.typewrite(page);
      await this.waitAdvance();
    }
    this.hide();
    this.releasedAt = this.scene.time.now;
    this.busy = false;
  }

  private hide(): void {
    this.win?.setVisible(false);
    this.text?.setVisible(false);
    this.cursor?.setVisible(false);
  }

  private typewrite(page: string): Promise<void> {
    return new Promise((resolve) => {
      const tx = this.text;
      if (!tx) {
        resolve();
        return;
      }
      tx.setText('');
      this.cursor?.setVisible(false);
      let i = 0;
      let acc = 0;
      // per-frame, dt-scaled: same chars-per-second on every display (ADR-024)
      const off = everyFrame(this.scene, (dt) => {
        const fast = INPUT.held('A') || INPUT.held('B');
        acc += (fast ? 3.2 : textSpeedMul()) * (dt / 16);
        while (acc >= 1 && i < page.length) {
          acc -= 1;
          i++;
        }
        tx.setText(page.slice(0, i));
        if (i % 3 === 0 && i < page.length) AUDIO.sfx('text');
        if (i >= page.length) {
          off();
          resolve();
        }
      });
    });
  }

  private waitAdvance(): Promise<void> {
    return new Promise((resolve) => {
      this.cursor?.setVisible(true);
      const blink = this.scene.time.addEvent({
        delay: 350,
        loop: true,
        callback: () => this.cursor?.setVisible(!this.cursor.visible),
      });
      const off = everyFrame(this.scene, () => {
        // A or B advances, like EB — polled every frame so no press drops
        if (INPUT.justPressed('A') || INPUT.justPressed('B')) {
          AUDIO.sfx('cursor');
          blink.remove();
          off();
          this.cursor?.setVisible(false);
          resolve();
        }
      });
    });
  }

  /** N-way choice menu. Returns chosen index (B = defaultIndex if allowed). */
  ask(options: string[], opts: { cancelIndex?: number } = {}): Promise<number> {
    this.busy = true;
    const scene = this.scene;
    const W = scene.scale.width;
    const rowH = 14;
    const w = Math.max(...options.map((o) => o.length)) * 6 + 36;
    const h = options.length * rowH + 16;
    const x = W - w - 10;
    const y = scene.scale.height - 66 - h - 4;
    const win = makeWindow(scene, x, y, w, h);
    const texts = options.map((o, i) =>
      scene.add
        .bitmapText(x + 22, y + 9 + i * rowH, 'retro', vars(o), 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1),
    );
    const hand = scene.add
      .image(x + 12, y + 13, 'hand')
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2);
    let sel = 0;
    return new Promise((resolve) => {
      const zones = options.map((_, i) => {
        const z = scene.add
          .zone(x, y + 6 + i * rowH, w, rowH)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 3)
          .setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          sel = i;
          finish(i);
        });
        return z;
      });
      const off = everyFrame(scene, () => {
        const d = INPUT.dir();
        if (INPUT.justPressed('A')) {
          finish(sel);
          return;
        }
        if (opts.cancelIndex !== undefined && INPUT.justPressed('B')) {
          finish(opts.cancelIndex);
          return;
        }
        if (this.navTick(d.y)) {
          sel = (sel + (d.y > 0 ? 1 : options.length - 1)) % options.length;
          AUDIO.sfx('cursor');
        }
        hand.y = y + 13 + sel * rowH;
      });
      const finish = (i: number): void => {
        AUDIO.sfx(opts.cancelIndex === i ? 'cancel' : 'confirm');
        off();
        win.destroy();
        texts.forEach((t) => t.destroy());
        zones.forEach((z) => z.destroy());
        hand.destroy();
        this.releasedAt = this.scene.time.now;
        this.busy = false;
        resolve(i);
      };
    });
  }

  private navHeld = 0;
  private navTick(dy: number): boolean {
    if (dy === 0) {
      this.navHeld = 0;
      return false;
    }
    const now = this.scene.time.now;
    if (now > this.navHeld) {
      this.navHeld = now + 180;
      return true;
    }
    return false;
  }
}

/* ------------------------------------------------------------------ */

export function toast(scene: Phaser.Scene, message: string): void {
  const W = scene.scale.width;
  const w = message.length * 6 + 24;
  const win = makeWindow(scene, (W - w) / 2, 10, w, 24);
  const tx = scene.add
    .bitmapText((W - w) / 2 + 12, 18, 'retro', message, 6)
    .setScrollFactor(0)
    .setDepth(DEPTH_UI + 1);
  scene.tweens.add({
    targets: [win, tx],
    alpha: 0,
    delay: 1800,
    duration: 400,
    onComplete: () => {
      win.destroy();
      tx.destroy();
    },
  });
}
