/**
 * Always-on overlay: virtual D-pad + A/B/MENU for touch play, gamepad
 * connect/disconnect toasts (touch controls auto-hide per GAME_BIBLE §B1),
 * and the first-gesture audio unlock + fullscreen request.
 *
 * S8: control positions respect the device's safe-area insets (camera
 * cutouts) — engine/native.ts maps env(safe-area-inset-*) into game pixels
 * and the whole cluster shifts inward; on inset-less screens the layout is
 * byte-identical to the pre-S8 one. Re-laid-out on every scale/orientation
 * change.
 */
import Phaser from 'phaser';
import { INPUT, type Btn } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { gameInsets } from '../engine/native';
import { toast } from '../ui/windows';

export class UIScene extends Phaser.Scene {
  private controls: Phaser.GameObjects.Container | null = null;
  private dpad: Phaser.GameObjects.Image | null = null;
  private btnA: Phaser.GameObjects.Image | null = null;
  private btnB: Phaser.GameObjects.Image | null = null;
  private btnX: Phaser.GameObjects.Image | null = null;
  private btnY: Phaser.GameObjects.Image | null = null;
  private btnStart: Phaser.GameObjects.Image | null = null;
  private dpadCenter = { x: 0, y: 0 };
  private aCenter = { x: 0, y: 0 };
  private bCenter = { x: 0, y: 0 };
  private xCenter = { x: 0, y: 0 };
  private yCenter = { x: 0, y: 0 };
  private startCenter = { x: 0, y: 0 };
  private pointerRoles = new Map<number, 'dpad' | Btn>();
  /** S12c: X/Y exist on the thumb arc DURING HOOPS ONLY (sprint + sauce) */
  private hoopsLive = false;

  constructor() {
    super('ui');
  }

  create(): void {
    const isTouch = this.sys.game.device.input.touch;

    // first gesture: unlock audio (+ fullscreen on touch devices). On the
    // phone this fires from the FIRST TOUCH — the §B4/ADR-006 unlock path.
    const unlock = (): void => {
      AUDIO.unlock();
      if (isTouch && !this.scale.isFullscreen) {
        try {
          this.scale.startFullscreen();
        } catch {
          /* fullscreen denied — fine (the Capacitor shell is already immersive) */
        }
      }
    };
    this.input.on('pointerdown', unlock);
    this.input.keyboard?.on('keydown', () => AUDIO.unlock());
    // M toggles all sound, anywhere
    this.input.keyboard?.on('keydown-M', () => {
      const muted = AUDIO.toggleMuted();
      toast(this, muted ? 'Sound OFF' : 'Sound ON');
    });

    // X/Y ride the overlay only while the cage plays (S12c) — both input
    // sources stay live everywhere; only the TOUCH chrome is hoops-scoped
    this.game.events.on('mf-hoops-open', () => {
      this.hoopsLive = true;
      this.btnX?.setVisible(true);
      this.btnY?.setVisible(true);
    });
    this.game.events.on('mf-hoops-closed', () => {
      this.hoopsLive = false;
      this.btnX?.setVisible(false);
      this.btnY?.setVisible(false);
    });

    if (isTouch) {
      this.dpad = this.add.image(0, 0, 'dpad').setAlpha(0.55);
      this.btnA = this.add.image(0, 0, 'btn_a').setAlpha(0.6);
      this.btnB = this.add.image(0, 0, 'btn_b').setAlpha(0.6);
      this.btnX = this.add.image(0, 0, 'btn_x').setAlpha(0.6).setVisible(false);
      this.btnY = this.add.image(0, 0, 'btn_y').setAlpha(0.6).setVisible(false);
      this.btnStart = this.add.image(0, 0, 'btn_start').setAlpha(0.55);
      this.controls = this.add.container(0, 0, [this.dpad, this.btnA, this.btnB, this.btnX, this.btnY, this.btnStart]);
      this.controls.setDepth(5000);
      this.controls.setVisible(!INPUT.gamepadConnected);
      this.layoutControls();
      // insets shift on rotation/fold; FIT letterboxing shifts on resize
      this.scale.on(Phaser.Scale.Events.RESIZE, () => this.layoutControls());

      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.touchAt(p, true));
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.touchAt(p, false));
      const release = (p: Phaser.Input.Pointer): void => {
        const role = this.pointerRoles.get(p.id);
        if (role === 'dpad') {
          INPUT.touchDir.x = 0;
          INPUT.touchDir.y = 0;
        } else if (role) {
          // releaseBtn latches the lift (ADR-038) — the meter release lands
          // on the exact frame the thumb leaves, even sub-frame
          INPUT.releaseBtn(role);
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

  /** anchor the cluster to the screen corners, pushed inward by any cutout */
  private layoutControls(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const ins = gameInsets(this.sys.game.canvas, W);
    this.dpadCenter = { x: 46 + ins.left, y: H - 46 - ins.bottom };
    this.aCenter = { x: W - 26 - ins.right, y: H - 56 - ins.bottom };
    this.bCenter = { x: W - 56 - ins.right, y: H - 26 - ins.bottom };
    // the thumb arc continues outward: X above A, Y beyond B (S12c — the
    // four sit on one sweep so sprint and sauce are roll-of-the-thumb away)
    this.xCenter = { x: W - 30 - ins.right, y: H - 92 - ins.bottom };
    this.yCenter = { x: W - 92 - ins.right, y: H - 30 - ins.bottom };
    this.startCenter = { x: W - 30 - ins.right, y: 12 + ins.top };
    this.dpad?.setPosition(this.dpadCenter.x, this.dpadCenter.y);
    this.btnA?.setPosition(this.aCenter.x, this.aCenter.y);
    this.btnB?.setPosition(this.bCenter.x, this.bCenter.y);
    this.btnX?.setPosition(this.xCenter.x, this.xCenter.y);
    this.btnY?.setPosition(this.yCenter.x, this.yCenter.y);
    this.btnStart?.setPosition(this.startCenter.x, this.startCenter.y);
  }

  private touchAt(p: Phaser.Input.Pointer, isDown: boolean): void {
    if (!this.controls?.visible) return;
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

    const hit = (c: { x: number; y: number }, r: number): boolean => Math.hypot(x - c.x, y - c.y) < r;
    // pressBtn latches the tap (ADR-024) — a sub-frame tap still registers
    if (hit(this.aCenter, 22)) {
      this.pointerRoles.set(p.id, 'A');
      INPUT.pressBtn('A');
    } else if (hit(this.bCenter, 22)) {
      this.pointerRoles.set(p.id, 'B');
      INPUT.pressBtn('B');
    } else if (this.hoopsLive && hit(this.xCenter, 20)) {
      this.pointerRoles.set(p.id, 'X');
      INPUT.pressBtn('X');
    } else if (this.hoopsLive && hit(this.yCenter, 20)) {
      this.pointerRoles.set(p.id, 'Y');
      INPUT.pressBtn('Y');
    } else if (x > this.startCenter.x - 30 && y < this.startCenter.y + 14) {
      this.pointerRoles.set(p.id, 'START');
      INPUT.pressBtn('START');
    }
  }
}
