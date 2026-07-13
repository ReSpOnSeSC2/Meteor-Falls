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
import { s } from '../spritegen/scale';

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
  /** Cinematics hide navigation chrome but retain a quiet A skip affordance. */
  private cinematic = false;

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
      this.syncControlVisibility();
    });
    this.game.events.on('mf-hoops-closed', () => {
      this.hoopsLive = false;
      this.syncControlVisibility();
    });

    const enterCinematic = (): void => {
      this.cinematic = true;
      INPUT.touchDir.x = 0;
      INPUT.touchDir.y = 0;
      this.syncControlVisibility();
    };
    const leaveCinematic = (): void => {
      this.cinematic = false;
      this.syncControlVisibility();
    };
    this.game.events.on('mf-cinematic-open', enterCinematic);
    this.game.events.on('mf-cinematic-closed', leaveCinematic);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('mf-cinematic-open', enterCinematic);
      this.game.events.off('mf-cinematic-closed', leaveCinematic);
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
      this.layoutControls();
      this.syncControlVisibility();
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
      this.syncControlVisibility();
    });
  }

  /** §A4 (S15g): the Y button rides the thumb arc as the VITALS quick-glance
   *  whenever the OVERWORLD is the live scene (the EB "check HP fast" beat) —
   *  and as the cage's sauce button during HOOPS. X stays hoops-only. */
  override update(): void {
    this.syncControlVisibility();
  }

  private syncControlVisibility(): void {
    if (!this.controls) return;
    this.controls.setVisible(!INPUT.gamepadConnected);
    this.dpad?.setVisible(!this.cinematic);
    this.btnA?.setVisible(true).setAlpha(this.cinematic ? 0.3 : 0.6);
    this.btnB?.setVisible(!this.cinematic);
    this.btnStart?.setVisible(!this.cinematic);
    this.btnX?.setVisible(!this.cinematic && this.hoopsLive);
    this.btnY?.setVisible(!this.cinematic && (this.hoopsLive || this.scene.isActive('overworld')));
  }

  /** anchor the cluster to the screen corners, pushed inward by any cutout */
  private layoutControls(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const ins = gameInsets(this.sys.game.canvas, W);
    this.dpadCenter = { x: s(46) + ins.left, y: H - s(46) - ins.bottom };
    this.aCenter = { x: W - s(26) - ins.right, y: H - s(56) - ins.bottom };
    this.bCenter = { x: W - s(56) - ins.right, y: H - s(26) - ins.bottom };
    // the thumb arc continues outward: X above A, Y beyond B (S12c — the
    // four sit on one sweep so sprint and sauce are roll-of-the-thumb away)
    this.xCenter = { x: W - s(30) - ins.right, y: H - s(92) - ins.bottom };
    this.yCenter = { x: W - s(92) - ins.right, y: H - s(30) - ins.bottom };
    this.startCenter = { x: W - s(30) - ins.right, y: s(12) + ins.top };
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
    const hit = (c: { x: number; y: number }, r: number): boolean => Math.hypot(x - c.x, y - c.y) < r;

    // During a cinematic the only live touch target is the visible A affordance
    // (skip/advance). Hidden navigation zones must not keep moving the world.
    if (this.cinematic) {
      if (isDown && hit(this.aCenter, s(22))) {
        this.pointerRoles.set(p.id, 'A');
        INPUT.pressBtn('A');
      }
      return;
    }

    // D-pad: generous capture zone on the left half-bottom
    const dx = x - this.dpadCenter.x;
    const dy = y - this.dpadCenter.y;
    const dist = Math.hypot(dx, dy);
    if (existing === 'dpad' || (isDown && dist < s(56)) || (!existing && p.isDown && dist < s(56))) {
      this.pointerRoles.set(p.id, 'dpad');
      if (dist < s(6)) {
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

    // pressBtn latches the tap (ADR-024) — a sub-frame tap still registers
    if (hit(this.aCenter, s(22))) {
      this.pointerRoles.set(p.id, 'A');
      INPUT.pressBtn('A');
    } else if (hit(this.bCenter, s(22))) {
      this.pointerRoles.set(p.id, 'B');
      INPUT.pressBtn('B');
    } else if (this.hoopsLive && hit(this.xCenter, s(20))) {
      this.pointerRoles.set(p.id, 'X');
      INPUT.pressBtn('X');
    } else if ((this.hoopsLive || this.scene.isActive('overworld')) && hit(this.yCenter, s(20))) {
      // §A4 (S15g): Y on the overworld pops the vitals glance
      this.pointerRoles.set(p.id, 'Y');
      INPUT.pressBtn('Y');
    } else if (x > this.startCenter.x - s(30) && y < this.startCenter.y + s(14)) {
      this.pointerRoles.set(p.id, 'START');
      INPUT.pressBtn('START');
    }
  }
}
