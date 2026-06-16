/**
 * BustView — one hero's living party card (S11). Owns the 32×32 battle bust
 * (sheet `bust_<id>`, frames per BUST_FRAME), the §A4.7 angel that floats
 * beside the card when the hero goes down, the card shake, and the §A4.8
 * status conditions rendered ON the card: Sunburn red edge-tint, Crying
 * droplets, Asleep Zzz drift, Paralyzed sparks, HUSHED muzzle shimmer,
 * Homesick {favoritefood} thought-bubble. (Mushroomized arrives with Ch.6.)
 *
 * Everything is derived — HeroState + battle events in, frames out; nothing
 * here is stored on the save. All animation advances on the dt the scene
 * passes in, which is already ×4 under held A/B (ADR-010's one skip state),
 * and the drums are never touched: shakes move the box/bust/labels, the
 * odometer strips stay planted (the S11 hard law).
 */
import Phaser from 'phaser';
import { BUST_FRAME, type BustFrameName } from '../spritegen/busts';
import { colorOf, px, RAMP } from '../palette';
import { DEPTH_UI } from '../ui/windows';
import { AUDIO } from '../engine/audio';
import { s } from '../spritegen/scale';

export interface CardStatusFlags {
  sunburn: boolean;
  crying: boolean;
  asleep: boolean;
  paralyzed: boolean;
  hushed: boolean;
  homesick: boolean;
}

export interface BustTick {
  mortal: boolean;
  down: boolean;
  defending: boolean;
  victory: boolean;
  /** S11b: displayed HP below 33% — the idle becomes the WINDED heave
   *  (the mortal roll still owns the nervous loop, ADR-030) */
  winded: boolean;
  /** S11b GOOD-status pips: shield/mirror turns remaining ride the card.
   *  S16 adds the layered-ward pips: ward (elemental), reflect (the wall that
   *  answers), and steeled (Resolve's Guts buff) — same hex PIP, tinted. */
  shield: boolean;
  mirror: boolean;
  ward: boolean;
  reflect: boolean;
  steeled: boolean;
  /** Dorin's martial stances — braced (earth/red) and flowing (cyan) ride the
   *  same hex PIP, tinted for legibility (the build prompt §1.5 card pips). */
  braced: boolean;
  flowing: boolean;
  statuses: CardStatusFlags;
}

const NO_STATUS: CardStatusFlags = {
  sunburn: false,
  crying: false,
  asleep: false,
  paralyzed: false,
  hushed: false,
  homesick: false,
};

export class BustView {
  private scene: Phaser.Scene;
  private bust: Phaser.GameObjects.Image;
  private angel: Phaser.GameObjects.Sprite | null = null;
  private heroId: string;
  private cardX: number;
  private cardY: number;
  private cardW: number;
  /** card chrome that shakes WITH the bust (never the drums) */
  private shakeables: Array<{ obj: { x: number; y: number }; baseX: number; baseY: number }>;
  private bustBaseX: number;
  private bustBaseY: number;

  private state: 'alive' | 'dying' | 'angel' = 'alive';
  private dieT = 0;
  private animT = 0;
  private shakeLeft = 0;
  /** the hero left the card for the stage — the bust stands empty (S11b) */
  private awayState = false;
  /** the picker's 2px card lift (S11b shield UI) */
  private lifted = false;
  /** winded breath-tick throttle */
  private breathAcc = 0;
  private pose: { frame: number; left: number } | null = null;
  private flags: BustTick = {
    mortal: false,
    down: false,
    defending: false,
    victory: false,
    winded: false,
    shield: false,
    mirror: false,
    ward: false,
    reflect: false,
    steeled: false,
    braced: false,
    flowing: false,
    statuses: NO_STATUS,
  };

  // status overlays — created once, visibility-toggled (pooled by ownership)
  private edges: Phaser.GameObjects.Rectangle[] = [];
  private drops: Phaser.GameObjects.Image[] = [];
  private zzz: Phaser.GameObjects.BitmapText;
  private sparks: Phaser.GameObjects.Image[] = [];
  private shimmer: Phaser.GameObjects.Image[] = [];
  private bubble: Phaser.GameObjects.Image;
  private pip: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    heroId: string,
    cardX: number,
    cardY: number,
    cardW: number,
    shakeables: Array<{ x: number; y: number }>,
    sheet = `bust_${heroId}`,
  ) {
    this.scene = scene;
    this.heroId = heroId;
    this.cardX = cardX;
    this.cardY = cardY;
    this.cardW = cardW;
    this.shakeables = shakeables.map((obj) => ({ obj, baseX: obj.x, baseY: obj.y }));
    // the MOTHER read (user direction): the bust rises from BEHIND the card,
    // centered over the HP box — its chest tucks under the card's top edge, so it
    // sits one depth below the box. RAISED to poke 30px above (was 22): the new
    // hi-res portrait shows head + shoulders instead of a floating head.
    this.bust = scene.add
      // the bust texture is upscaled ×ART_SCALE at the seam, so its native 32px
      // width centers against the runtime card as s(32)
      .image(cardX + (cardW - s(32)) / 2, cardY - s(30), sheet, BUST_FRAME.idleA)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI - 1);
    this.bustBaseX = this.bust.x;
    this.bustBaseY = this.bust.y;
    const cx = cardX + cardW / 2;

    // sunburn edge-tint: four thin strips hugging the card border
    const red = colorOf(px(RAMP.RED, 2));
    const mk = (x: number, y: number, w: number, h: number): Phaser.GameObjects.Rectangle =>
      scene.add.rectangle(x, y, w, h, red, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1).setVisible(false);
    this.edges = [
      mk(cardX + s(1), cardY + s(1), cardW - s(2), s(2)),
      mk(cardX + s(1), cardY + s(47), cardW - s(2), s(2)),
      mk(cardX + s(1), cardY + s(3), s(2), s(44)),
      mk(cardX + cardW - s(3), cardY + s(3), s(2), s(44)),
    ];
    // crying droplets, falling from the bust's eye line
    for (const dx of [-s(4), s(4)]) {
      this.drops.push(
        scene.add
          .image(cx + dx, cardY - s(10), 'pixel')
          .setTint(colorOf(px(RAMP.CYAN, 3)))
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 2)
          .setVisible(false),
      );
    }
    // asleep: one drifting z (it puts in the work of three)
    this.zzz = scene.add
      .bitmapText(cx + s(12), cardY - s(20), 'retro', 'z', s(6))
      .setTint(colorOf(px(RAMP.CYAN, 3)))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2)
      .setVisible(false);
    // paralyzed sparks skittering over card + bust
    for (let i = 0; i < 2; i++) {
      this.sparks.push(
        scene.add
          .image(cardX + s(6), cardY - s(12), 'pixel')
          .setTint(colorOf(px(RAMP.GOLD, 3)))
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 2)
          .setVisible(false),
      );
    }
    // HUSHED: the muzzle shimmer over the bust's mouth
    for (const dx of [-s(2), s(2)]) {
      this.shimmer.push(
        scene.add
          .image(cx + dx, cardY - s(7), 'pixel')
          .setTint(colorOf(px(RAMP.PURPLE, 3)))
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 2)
          .setVisible(false),
      );
    }
    // Homesick: the {favoritefood} thought-bubble beside the bust's head
    this.bubble = scene.add
      .image(cx + s(22), cardY - s(26), 'thought_food')
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2)
      .setVisible(false);
    // the hex PIP (S11b): shield/mirror turns remaining — the first GOOD-
    // status indicator, seated on the card's LEFT shoulder, opposite the
    // §A4.8 ailment cluster on the right, so buffs and ailments never collide
    this.pip = scene.add
      .image(cardX + s(7), cardY - s(10), 'hex_pip')
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2)
      .setVisible(false);
  }

  /** swap the bust sheet (S11b wear tiers / look changes), pose preserved */
  setSheet(key: string): void {
    if (this.bust.texture.key === key) return;
    const frame = this.bust.frame.name;
    this.bust.setTexture(key, frame);
  }

  /**
   * S11b 'away': the hero has stepped onto the stage — the card stands
   * empty until they walk back, so card and stage never pose-fight.
   */
  setAway(on: boolean): void {
    this.awayState = on;
    if (this.state === 'alive') this.bust.setVisible(!on);
  }

  /** the shield-picker lift: the candidate card rises 2px (drums NEVER move) */
  lift(on: boolean): void {
    if (this.lifted === on) return;
    this.lifted = on;
    const dy = on ? -s(2) : 0;
    this.shakeables.forEach((s) => (s.obj.y = s.baseY + dy));
    this.bust.y = this.bustBaseY + dy;
  }

  /** the picker's focus dim — non-candidates step back into the dark */
  dim(on: boolean): void {
    this.bust.setAlpha(on ? 0.45 : 1);
  }

  /** bust center in screen px — impact bursts and the Tick's tether aim here */
  point(): { x: number; y: number } {
    return { x: this.cardX + this.cardW / 2, y: this.cardY - s(6) };
  }

  /** strike a one-shot pose for ms (scaled dt, so it skips like text) */
  poseFor(name: BustFrameName, ms: number): void {
    if (this.state !== 'alive') return;
    this.pose = { frame: BUST_FRAME[name], left: ms };
  }

  clearPose(): void {
    this.pose = null;
  }

  /** the hurt read: card shakes, bust recoils one frame */
  hit(): void {
    this.shakeLeft = 260;
    this.poseFor('hurt', 360);
  }

  /** DOWN: slump, fade, then the angel floats beside the card (§A4.7) */
  down(): void {
    if (this.state !== 'alive') return;
    this.state = 'dying';
    this.dieT = 0;
    this.pose = null;
    this.bust.setFrame(BUST_FRAME.down);
  }

  /** revive: the angel rests, the bust returns (heal glow is the scene's fx) */
  revive(): void {
    if (this.state === 'alive') return;
    this.state = 'alive';
    this.angel?.setVisible(false);
    this.bust.setVisible(true).setAlpha(1).setFrame(BUST_FRAME.idleA);
  }

  get isAngel(): boolean {
    return this.state === 'angel';
  }

  /** drive everything one frame; dtFx is already skip-scaled by the scene */
  update(dtFx: number, flags: BustTick): void {
    this.flags = flags;
    this.animT += dtFx;

    // card shake — box/labels/bust offset; drums NEVER move (the law)
    if (this.shakeLeft > 0) {
      this.shakeLeft = Math.max(0, this.shakeLeft - dtFx);
      const k = this.shakeLeft > 0 ? Math.round(Math.sin(this.shakeLeft / 24) * s(2)) : 0;
      this.shakeables.forEach((s) => (s.obj.x = s.baseX + k));
      this.bust.x = this.bustBaseX + k;
    }

    // the hex PIP rides the card while shield/mirror turns remain (S11b) —
    // even while the hero is away on stage: the barrier didn't go anywhere
    // S16: any GOOD ward shows the hex PIP; the tint names which layer is up
    // (reflect/mirror = the answering wall read gold/paper; ward = grass;
    // steeled = red brace; shield = cyan). Priority follows strength.
    const pipOn =
      (flags.shield || flags.mirror || flags.ward || flags.reflect || flags.steeled || flags.braced || flags.flowing) &&
      this.state === 'alive';
    this.pip.setVisible(pipOn);
    if (pipOn) {
      const tint = flags.reflect
        ? colorOf(px(RAMP.GOLD, 3))
        : flags.mirror
          ? colorOf(px(RAMP.PAPER, 3))
          : flags.ward
            ? colorOf(px(RAMP.GRASS, 3))
            : flags.steeled || flags.braced
              ? colorOf(px(RAMP.RED, 3)) // the brace/answer pip — steeled + Stone Brow Stance
              : colorOf(px(RAMP.CYAN, 3)); // shield + Flowing Step
      this.pip.setTint(tint).setAlpha(0.7 + 0.3 * Math.sin(this.animT / 260));
    }

    // down → dying → angel
    if (flags.down && this.state === 'alive') this.down();
    if (this.state === 'dying') {
      this.dieT += dtFx;
      if (this.dieT < 380) {
        this.bust.setFrame(BUST_FRAME.down);
      } else if (this.dieT < 900) {
        this.bust.setAlpha(1 - (this.dieT - 380) / 520);
      } else {
        this.state = 'angel';
        this.bust.setVisible(false);
        // the angel takes the bust's place above the card (§A4.7)
        this.angel ??= this.scene.add
          .sprite(this.cardX + this.cardW / 2, this.cardY - s(14), `angel_${this.heroId}`)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI - 1);
        this.angel.setVisible(true);
        this.angel.play(`angel_${this.heroId}-float`);
      }
      this.setOverlays(NO_STATUS);
      return;
    }
    if (this.state === 'angel') {
      this.setOverlays(NO_STATUS);
      return;
    }

    // away on stage (S11b): the card stands empty; statuses keep rendering
    if (this.awayState) {
      this.bust.setVisible(false);
      this.overlayTick();
      return;
    }
    this.bust.setVisible(true);

    // pose one-shots ride the same scaled clock
    if (this.pose) {
      this.pose.left -= dtFx;
      if (this.pose.left > 0) {
        this.bust.setFrame(this.pose.frame);
        this.overlayTick();
        return;
      }
      this.pose = null;
    }

    // loops, by priority: victory > guard > mortal nervous > asleep > winded
    if (flags.victory) {
      this.bust.setFrame(this.animT % 560 < 280 ? BUST_FRAME.cheerA : BUST_FRAME.cheerB);
    } else if (flags.defending) {
      this.bust.setFrame(BUST_FRAME.guard);
    } else if (flags.mortal) {
      // the card sweats while the meter races (Prompt 13's urgency pitch)
      this.bust.setFrame(this.animT % 320 < 160 ? BUST_FRAME.nervousA : BUST_FRAME.nervousB);
    } else if (flags.statuses.asleep) {
      this.bust.setFrame(BUST_FRAME.down);
    } else if (flags.winded) {
      // S11b: below 33% the idle heaves — faster breath, shoulders working
      const heave = this.animT % 640 < 320;
      this.bust.setFrame(heave ? BUST_FRAME.windedA : BUST_FRAME.windedB);
      this.breathAcc += dtFx;
      if (heave && this.breathAcc > 1280) {
        this.breathAcc = 0;
        AUDIO.sfx('breath');
      }
    } else {
      this.bust.setFrame(this.animT % 1240 < 620 ? BUST_FRAME.idleA : BUST_FRAME.idleB);
    }
    this.overlayTick();
  }

  private setOverlays(s: CardStatusFlags): void {
    this.edges.forEach((e) => e.setVisible(s.sunburn));
    this.drops.forEach((d) => d.setVisible(s.crying));
    this.zzz.setVisible(s.asleep);
    this.sparks.forEach((sp) => sp.setVisible(s.paralyzed));
    this.shimmer.forEach((sh) => sh.setVisible(s.hushed));
    this.bubble.setVisible(s.homesick);
  }

  private overlayTick(): void {
    // `st` (not `s`) holds the status flags so the scale helper `s()` stays callable
    const st = this.flags.statuses;
    this.setOverlays(st);
    const t = this.animT;
    if (st.sunburn) {
      const a = 0.45 + 0.35 * Math.sin(t / 180);
      this.edges.forEach((e) => e.setAlpha(a));
    }
    if (st.crying) {
      // droplets fall eye → card top and loop (the 14px fall scales; the cadence is time)
      this.drops.forEach((d, i) => {
        const ph = ((t + i * 260) % 520) / 520;
        d.setY(this.cardY - s(10) + ph * s(14)).setAlpha(1 - ph * 0.6);
      });
    }
    if (st.asleep) {
      const ph = (t % 1100) / 1100;
      this.zzz
        .setY(this.cardY - s(20) - ph * s(10))
        .setX(this.cardX + this.cardW / 2 + s(12) + Math.sin(ph * 6) * s(2))
        .setAlpha(1 - ph * 0.7);
    }
    if (st.paralyzed) {
      this.sparks.forEach((sp, i) => {
        const step = Math.floor(t / 130) + i * 3;
        // the skitter offsets + their wrap ranges are all pixel spans
        sp.setPosition(this.cardX + s(4) + ((step * s(13)) % (this.cardW - s(8))), this.cardY - s(16) + ((step * s(7)) % s(56)));
        sp.setVisible(step % 3 !== 1);
      });
    }
    if (st.hushed) {
      this.shimmer.forEach((sh, i) => {
        const on = Math.floor(t / 160 + i) % 2 === 0;
        sh.setTint(colorOf(px(on ? RAMP.PURPLE : RAMP.CYAN, 3)));
        sh.setY(this.cardY - s(7) + (on ? 0 : s(1)));
      });
    }
    if (st.homesick) {
      this.bubble.setY(this.cardY - s(26) + Math.sin(t / 400) * s(1.5));
    }
  }
}
