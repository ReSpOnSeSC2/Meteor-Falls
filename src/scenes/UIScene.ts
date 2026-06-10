/**
 * Always-on overlay: virtual D-pad + A/B/MENU for touch play, gamepad
 * connect/disconnect toasts (touch controls auto-hide per GAME_BIBLE §B1),
 * and the first-gesture audio unlock + fullscreen request.
 */
import Phaser from 'phaser';
import { INPUT, type Btn } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { toast } from '../ui/windows';

export class UIScene extends Phaser.Scene {
  private controls: Phaser.GameObjects.Container | null = null;
  private dpadCenter = { x: 0, y: 0 };
  private pointerRoles = new Map<number, 'dpad' | Btn>();

  constructor() {
    super('ui');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const isTouch = this.sys.game.device.input.touch;

    // first gesture: unlock audio (+ fullscreen on touch devices)
    const unlock = (): void => {
      AUDIO.unlock();
      if (isTouch && !this.scale.isFullscreen) {
        try {
          this.scale.startFullscreen();
        } catch {
          /* fullscreen denied — fine */
        }
      }
    };
    this.input.on('pointerdown', unlock);
    this.input.keyboard?.on('keydown', () => AUDIO.unlock());

    if (isTouch) {
      const dpad = this.add.image(46, H - 46, 'dpad').setAlpha(0.55);
      this.dpadCenter = { x: 46, y: H - 46 };
      const btnA = this.add.image(W - 26, H - 56, 'btn_a').setAlpha(0.6);
      const btnB = this.add.image(W - 56, H - 26, 'btn_b').setAlpha(0.6);
      const btnStart = this.add.image(W - 30, 12, 'btn_start').setAlpha(0.55);
      this.controls = this.add.container(0, 0, [dpad, btnA, btnB, btnStart]);
      this.controls.setDepth(5000);
      this.controls.setVisible(!INPUT.gamepadConnected);

      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.touchAt(p, true));
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.touchAt(p, false));
      const release = (p: Phaser.Input.Pointer): void => {
        const role = this.pointerRoles.get(p.id);
        if (role === 'dpad') {
          INPUT.touchDir.x = 0;
          INPUT.touchDir.y = 0;
        } else if (role) {
          INPUT.touchBtns.delete(role);
        }
        this.pointerRoles.delete(p.id);
      };
      this.input.on('pointerup', release);
      this.input.on('pointerupoutside', release);
    }

    INPUT.onGamepad((connected, id) => {
      toast(this, connected ? `Controller connected: ${id.slice(0, 24)}` : 'Controller disconnected');
      this.controls?.setVisible(!connected && isTouch);
    });
  }

  private touchAt(p: Phaser.Input.Pointer, isDown: boolean): void {
    if (!this.controls?.visible) return;
    const W = this.scale.width;
    const H = this.scale.height;
    const x = p.x;
    const y = p.y;
    const existing = this.pointerRoles.get(p.id);

    // D-pad: generous capture zone on the left half-bottom
    const dx = x - this.dpadCenter.x;
    const dy = y - this.dpadCenter.y;
    const dist = Math.hypot(dx, dy);
    if (existing === 'dpad' || (isDown && dist < 56) || (!existing && p.isDown && dist < 56)) {
      this.pointerRoles.set(p.id, 'dpad');
      if (dist < 6) {
        INPUT.touchDir.x = 0;
        INPUT.touchDir.y = 0;
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        INPUT.touchDir.x = Math.abs(nx) > 0.42 ? Math.sign(nx) : 0;
        INPUT.touchDir.y = Math.abs(ny) > 0.42 ? Math.sign(ny) : 0;
      }
      return;
    }
    if (!isDown) return;

    const hit = (cx: number, cy: number, r: number): boolean => Math.hypot(x - cx, y - cy) < r;
    if (hit(W - 26, H - 56, 22)) {
      this.pointerRoles.set(p.id, 'A');
      INPUT.touchBtns.add('A');
    } else if (hit(W - 56, H - 26, 22)) {
      this.pointerRoles.set(p.id, 'B');
      INPUT.touchBtns.add('B');
    } else if (x > W - 60 && y < 26) {
      this.pointerRoles.set(p.id, 'START');
      INPUT.touchBtns.add('START');
    }
  }
}
