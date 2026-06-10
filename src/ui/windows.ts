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

export const DEPTH_UI = 1000;

export function vars(text: string): string {
  return text
    .replaceAll('{playername}', GS.data.playerName)
    .replaceAll('{favoritefood}', GS.data.favoriteFood)
    .replaceAll('{rex}', GS.hero('rex')?.name ?? 'Rex');
}

export function makeWindow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.NineSlice {
  const win = scene.add.nineslice(x, y, 'win9', 0, w, h, 8, 8, 8, 8);
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
      const ev = this.scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          const fast = INPUT.held('A') || INPUT.held('B');
          acc += fast ? 3.2 : 1;
          while (acc >= 1 && i < page.length) {
            acc -= 1;
            i++;
          }
          tx.setText(page.slice(0, i));
          if (i % 3 === 0 && i < page.length) AUDIO.sfx('text');
          if (i >= page.length) {
            ev.remove();
            resolve();
          }
        },
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
      const poll = this.scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          if (INPUT.justPressed('A')) {
            AUDIO.sfx('cursor');
            blink.remove();
            poll.remove();
            this.cursor?.setVisible(false);
            resolve();
          }
        },
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
      const poll = scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
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
        },
      });
      const finish = (i: number): void => {
        AUDIO.sfx(opts.cancelIndex === i ? 'cancel' : 'confirm');
        poll.remove();
        win.destroy();
        texts.forEach((t) => t.destroy());
        zones.forEach((z) => z.destroy());
        hand.destroy();
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
