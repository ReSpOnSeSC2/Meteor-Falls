/**
 * StageView — S11b "the caster takes the stage". One actor sprite that
 * carries a hero's rear-3/4 battler (spritegen/battlers.ts) from their card
 * up onto the STAGE — the field band between the party cards and the enemy
 * row — faces the target, performs the ability's choreography, and steps
 * back. BustView holds an 'away' state meanwhile, so card and stage never
 * pose-fight.
 *
 * Every movement and pose is an FxTimeline advanced by the dt the scene
 * passes in — already ×4 under held A/B (ADR-010's one skip state), so the
 * ADR-008 bot replays the whole walk through pump(). Tweens for nothing.
 * The actor renders at fx depth, below DEPTH_UI: it can never cover a drum.
 */
import Phaser from 'phaser';
import { FxTimeline } from './fxTimeline';
import { BATTLER_FRAME, type BattlerFrameName } from '../spritegen/battlers';
import { AUDIO } from '../engine/audio';
import { DEPTH_UI } from '../ui/windows';

/** the stage band — above the enemy sprites, below every window and card */
const D_STAGE = DEPTH_UI - 8;
/** where the battler's feet land (origin 0.5,1) — under the enemy row */
export const STAGE_Y = 158;

type HoldPose = 'idle' | 'cast' | 'aim' | 'pray';

export class StageView {
  private scene: Phaser.Scene;
  private spr: Phaser.GameObjects.Image;
  private timelines: FxTimeline[] = [];
  private holding: HoldPose | null = null;
  private holdT = 0;
  private winded = false;
  private breathAcc = 0;
  private home = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.spr = scene.add
      .image(0, 0, '__DEFAULT')
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(D_STAGE)
      .setVisible(false);
  }

  get active(): boolean {
    return this.spr.visible;
  }

  /** actor center — fx that answer the caster (motes, glows) aim here */
  point(): { x: number; y: number } {
    return { x: this.spr.x, y: this.spr.y - 18 };
  }

  /**
   * Step up from the card onto the stage: walk cycle on the way, face the
   * target, settle into idle. `sheet` is the look+wear battler texture;
   * `winded` swaps the waiting idle for the heaving loop (<33% HP).
   */
  enter(sheet: string, from: { x: number; y: number }, targetX: number, winded: boolean): Promise<void> {
    this.home = { x: from.x, y: from.y };
    this.winded = winded;
    const W = this.scene.scale.width;
    // stand just off the target's center, on the side the hero came from
    const side = from.x <= targetX ? -1 : 1;
    const toX = Math.max(26, Math.min(W - 26, targetX + side * 12));
    this.spr
      .setTexture(sheet)
      .setFrame(BATTLER_FRAME.stepA)
      .setPosition(from.x, from.y)
      .setFlipX(targetX < toX)
      .setVisible(true);
    const tl = new FxTimeline();
    tl.span(0, 340, (p) => {
      this.spr.setPosition(
        Math.round(from.x + (toX - from.x) * p),
        Math.round(from.y + (STAGE_Y - from.y) * p),
      );
      if (p < 1) {
        this.spr.setFrame(Math.floor((p * 340) / 90) % 2 === 0 ? BATTLER_FRAME.stepA : BATTLER_FRAME.stepB);
      }
    });
    tl.event(340, () => this.hold('idle'));
    this.timelines.push(tl);
    return tl.whenDone();
  }

  /** walk back down to the card and hand the pose back to the bust */
  exit(): Promise<void> {
    if (!this.spr.visible) return Promise.resolve();
    this.holding = null;
    const fx = this.spr.x;
    const fy = this.spr.y;
    const tl = new FxTimeline();
    tl.span(0, 300, (p) => {
      this.spr.setPosition(
        Math.round(fx + (this.home.x - fx) * p),
        Math.round(fy + (this.home.y - fy) * p),
      );
      this.spr.setFrame(Math.floor((p * 300) / 90) % 2 === 0 ? BATTLER_FRAME.stepB : BATTLER_FRAME.stepA);
    });
    tl.event(300, () => this.spr.setVisible(false));
    this.timelines.push(tl);
    return tl.whenDone();
  }

  /** loop a held pose (cast alternates its two frames; idle breathes) */
  hold(pose: HoldPose): void {
    this.holding = pose;
    this.holdT = 0;
  }

  /** strike a one-shot frame for ms (skip-scaled), then resume the hold */
  strike(frame: BattlerFrameName, ms: number, sfx?: string): Promise<void> {
    const was = this.holding;
    this.holding = null;
    const tl = new FxTimeline();
    tl.event(0, () => {
      if (sfx) AUDIO.sfx(sfx);
      this.spr.setFrame(BATTLER_FRAME[frame]);
    });
    tl.hold(ms);
    tl.event(ms, () => {
      if (this.holding === null) this.holding = was ?? 'idle';
    });
    this.timelines.push(tl);
    return tl.whenDone();
  }

  /** drive everything one frame; dtFx is already skip-scaled by the scene */
  update(dtFx: number): void {
    if (this.timelines.length > 0) {
      this.timelines = this.timelines.filter((tl) => !tl.tick(dtFx));
    }
    if (!this.spr.visible || this.holding === null) return;
    this.holdT += dtFx;
    switch (this.holding) {
      case 'cast':
        this.spr.setFrame(this.holdT % 440 < 220 ? BATTLER_FRAME.castA : BATTLER_FRAME.castB);
        break;
      case 'aim':
        this.spr.setFrame(BATTLER_FRAME.aim);
        break;
      case 'pray':
        this.spr.setFrame(BATTLER_FRAME.pray);
        break;
      default: {
        if (this.winded) {
          // heaving shoulders — faster breath than the idle (S11b winded)
          const heave = this.holdT % 640 < 320;
          this.spr.setFrame(heave ? BATTLER_FRAME.winded : BATTLER_FRAME.idleA);
          this.breathAcc += dtFx;
          if (heave && this.breathAcc > 640) {
            this.breathAcc = 0;
            AUDIO.sfx('breath');
          }
        } else {
          this.spr.setFrame(this.holdT % 1100 < 550 ? BATTLER_FRAME.idleA : BATTLER_FRAME.idleB);
        }
        break;
      }
    }
  }
}
