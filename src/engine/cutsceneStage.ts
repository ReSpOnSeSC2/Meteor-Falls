/**
 * CUTSCENE STAGE — the IN-ENGINE half of the cutscene system. Where
 * `playCutscene` (engine/cutscene.ts) shows authored painted PANELS, this stages
 * a scene with the game's OWN assets: real character sprites as actors on a
 * lightweight set, walking/facing/emoting, speaking through the dialogue box,
 * under cinematic letterbox + camera + FX. The two compose into one beat-string:
 * a painted card establishes "for a second," then we CUT to live actors playing
 * the interaction out (the Mother 3 move).
 *
 * A staged scene is an imperative director function `(d: Director) => Promise<…>`
 * (the flexible, production-direction way the bus/boat/Chad scenes already work),
 * not flat data — so the project lead blocks each beat by hand. `playStagedScene`
 * sets up the letterbox + director, runs it, and tears everything down. The caller
 * owns the input lock (OverworldScene's `cut`).
 *
 * Depths live in [STAGE_BASE, STAGE_BASE+60] — above the world, BELOW the dialogue
 * box (DEPTH_UI+1) and HUD, so speech and vitals read on top of the staged set.
 */
import Phaser from 'phaser';
import { s } from '../spritegen/scale';
import { INPUT } from './input';
import { AUDIO } from './audio';
import { Dialogue, everyFrame, vars } from '../ui/windows';
import { popEmote, type EmoteHandle, type EmoteId } from './emote';
import { standFrame, type Facing } from '../spritegen';
import { cutscenePanelKey } from './cutscene';

const STAGE_BASE = 80_000; // > world actors (depth≈y), < DEPTH_UI (90_000)
const D = {
  backdrop: STAGE_BASE,
  shadow: STAGE_BASE + 2,
  actor: STAGE_BASE + 4, // + a small per-actor y term for front/back sorting
  fx: STAGE_BASE + 40,
  flash: STAGE_BASE + 45,
  emote: STAGE_BASE + 50,
  card: STAGE_BASE + 54,
  cardText: STAGE_BASE + 55,
  letterbox: STAGE_BASE + 60,
} as const;

/** Built-in set palettes (sky band over a floor band). */
const SETS = {
  chamber: { sky: 0x05060c, floor: 0x100a16 }, // a dark resonance site
  night: { sky: 0x0b1024, floor: 0x12202a },
  dawn: { sky: 0x2a2440, floor: 0x40364e },
} as const;
type SetKind = keyof typeof SETS;

export interface ActorOpts {
  /** native-px screen position (0–400 × 0–225); s() applied internally. */
  x: number;
  y: number;
  facing?: Facing;
  /** display scale multiplier on the runtime sprite. Default 2 (a staged close). */
  scale?: number;
  tint?: number;
}

export interface StageActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  /** walk to a native-px x (keeps y), playing the walk cycle; resolves on arrival. */
  moveTo(x: number, ms?: number): Promise<void>;
  face(dir: Facing): void;
  emote(id: EmoteId, opts?: { holdMs?: number; loop?: boolean }): EmoteHandle;
  destroy(): void;
}

export interface CardOpts {
  chapter?: string; // default 'ch1'
  caption?: string;
  ms?: number; // hold before auto-advance (skippable). Default ~2600
  depth?: number;
}

/** A skippable wait: resolves after `ms`, or early on A/B/START. */
export function waitSkippable(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const off = everyFrame(scene, (dt) => {
      elapsed += dt;
      if (elapsed >= ms || INPUT.justPressed('A') || INPUT.justPressed('B') || INPUT.justPressed('START')) {
        off();
        resolve();
      }
    });
  });
}

/**
 * Show a painted panel card full-screen (Ken Burns push-in + optional caption):
 * fade in, hold (skippable), fade out. Standalone so ANY cutscene — a live-map
 * OverworldScene beat or a set-based staged scene — can flash an establishing
 * still without a Director.
 */
export function showCard(scene: Phaser.Scene, art: string, opts: CardOpts = {}): Promise<void> {
  const cam = scene.cameras.main;
  const key = cutscenePanelKey(opts.chapter ?? 'ch1', art);
  if (!scene.textures.exists(key)) return Promise.resolve();
  const depth = opts.depth ?? D.card;
  const img = scene.add
    .image(cam.width / 2, cam.height / 2, key)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0);
  const cover = Math.max(cam.width / img.width, cam.height / img.height);
  const hold = opts.ms ?? 2600;
  // Continuous Ken Burns: a slow diagonal push-in across the WHOLE card (fade-in
  // + hold), not just a 600ms nudge that then freezes — keeps the still alive.
  const panX = s(18);
  const panY = s(11);
  img.setScale(cover * 1.06).setPosition(cam.width / 2 - panX, cam.height / 2 - panY);
  scene.tweens.add({ targets: img, alpha: 1, duration: 600, ease: 'sine.out' });
  scene.tweens.add({
    targets: img,
    scale: cover * 1.26,
    x: cam.width / 2 + panX,
    y: cam.height / 2 + panY,
    duration: 600 + hold,
    ease: 'sine.inOut',
  });
  let text: Phaser.GameObjects.BitmapText | null = null;
  if (opts.caption) {
    text = scene.add
      .bitmapText(cam.width / 2, cam.height - s(34), 'retro', opts.caption, s(6))
      .setOrigin(0.5, 0)
      .setCenterAlign()
      .setMaxWidth(cam.width - s(40))
      .setTint(0xf8f0d0)
      .setScrollFactor(0)
      .setDepth(depth + 1)
      .setAlpha(0);
    scene.tweens.add({ targets: text, alpha: 1, duration: 360, delay: 200 });
  }
  return waitSkippable(scene, hold).then(
    () =>
      new Promise<void>((resolve) => {
        scene.tweens.add({
          targets: text ? [img, text] : img,
          alpha: 0,
          duration: 420,
          onComplete: () => {
            img.destroy();
            text?.destroy();
            resolve();
          },
        });
      }),
  );
}

/**
 * Show a TIMED narration caption over the LIVE scene (no card image) — the
 * cinematic-pan counterpart to showCard's caption: fade in, hold (skippable),
 * fade out. Used to narrate the opening's silent overworld pans so the player
 * is never just watching the camera drift with no idea what they're looking at.
 * Tokens ({rex}…) resolve via vars(); a soft shade plate keeps the words legible
 * over bright world tiles. Resolves once it has fully faded out.
 */
export function showCaption(scene: Phaser.Scene, text: string, opts: { ms?: number; depth?: number } = {}): Promise<void> {
  const cam = scene.cameras.main;
  const hold = opts.ms ?? 2600;
  const depth = opts.depth ?? D.cardText;
  const t = scene.add
    .bitmapText(cam.width / 2, cam.height - s(34), 'retro', vars(text), s(6))
    .setOrigin(0.5, 0)
    .setCenterAlign()
    .setMaxWidth(cam.width - s(40))
    .setTint(0xf8f0d0)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0);
  // a soft dark plate behind the words — the night maps are dark, but a bright
  // moon/firefly tile under the line shouldn't wash it out.
  const plate = scene.add
    .rectangle(cam.width / 2, t.y + t.height / 2, t.width + s(16), t.height + s(8), 0x000000, 0.5)
    .setScrollFactor(0)
    .setDepth(depth - 1)
    .setAlpha(0);
  scene.tweens.add({ targets: [t, plate], alpha: 1, duration: 360 });
  return waitSkippable(scene, hold).then(
    () =>
      new Promise<void>((resolve) => {
        scene.tweens.add({
          targets: [t, plate],
          alpha: 0,
          duration: 420,
          onComplete: () => {
            t.destroy();
            plate.destroy();
            resolve();
          },
        });
      }),
  );
}

export interface LetterboxHandle {
  remove(): Promise<void>;
}

/** Cinematic letterbox bars slide in; the handle's `remove()` slides them out. */
export function letterbox(scene: Phaser.Scene, opts: { depth?: number } = {}): LetterboxHandle {
  const cam = scene.cameras.main;
  const barH = Math.round(cam.height * 0.11);
  const depth = opts.depth ?? D.letterbox;
  const top = scene.add.rectangle(0, -barH, cam.width, barH, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(depth);
  const bot = scene.add.rectangle(0, cam.height, cam.width, barH, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(depth);
  scene.tweens.add({ targets: top, y: 0, duration: 420, ease: 'sine.out' });
  scene.tweens.add({ targets: bot, y: cam.height - barH, duration: 420, ease: 'sine.out' });
  return {
    remove: () =>
      new Promise<void>((resolve) => {
        scene.tweens.add({ targets: top, y: -barH, duration: 360, ease: 'sine.in' });
        scene.tweens.add({
          targets: bot,
          y: cam.height,
          duration: 360,
          ease: 'sine.in',
          onComplete: () => {
            top.destroy();
            bot.destroy();
            resolve();
          },
        });
      }),
  };
}

/** The staging API handed to a scene function. */
export class Director {
  private readonly created: Phaser.GameObjects.GameObject[] = [];
  private readonly actors: { spr: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image }[] = [];
  private readonly trackShadows: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly dlg: Dialogue,
  ) {
    this.trackShadows = () => {
      for (const a of this.actors) {
        a.shadow.setPosition(a.spr.x, a.spr.y - s(1));
      }
    };
    scene.events.on('update', this.trackShadows);
  }

  /** Show a painted panel card full-screen (establishing still). @see showCard. */
  card(art: string, opts: CardOpts = {}): Promise<void> {
    return showCard(this.scene, art, opts);
  }

  /** Build a backdrop set (a sky band over a floor band + soft vignette). */
  set(kind: SetKind | { sky: number; floor: number }): void {
    const cam = this.scene.cameras.main;
    const pal = typeof kind === 'string' ? SETS[kind] : kind;
    const sky = this.scene.add
      .rectangle(0, 0, cam.width, cam.height, pal.sky)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(D.backdrop)
      .setAlpha(0);
    const floor = this.scene.add
      .rectangle(0, cam.height * 0.62, cam.width, cam.height * 0.38, pal.floor)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(D.backdrop + 1)
      .setAlpha(0);
    this.scene.tweens.add({ targets: [sky, floor], alpha: 1, duration: 500, ease: 'sine.out' });
    this.created.push(sky, floor);
  }

  /** Spawn a sprite actor (a real character texture) + a contact shadow. */
  actor(id: string, opts: ActorOpts): StageActor {
    const px = s(opts.x);
    const py = s(opts.y);
    const facing = opts.facing ?? 'down';
    const scale = opts.scale ?? 2;
    const shadow = this.scene.add
      .image(px, py - s(1), 'mob_shadow')
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setScale(scale * 0.9, scale * 0.6)
      .setAlpha(0.32)
      .setDepth(D.shadow);
    const spr = this.scene.add
      .sprite(px, py, id, standFrame(facing))
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setScale(scale)
      .setDepth(D.actor + opts.y * 0.01);
    if (opts.tint !== undefined) spr.setTint(opts.tint);
    spr.setAlpha(0);
    shadow.setAlpha(0);
    this.scene.tweens.add({ targets: spr, alpha: 1, duration: 380 });
    this.scene.tweens.add({ targets: shadow, alpha: 0.32, duration: 380 });
    this.actors.push({ spr, shadow });

    const self: StageActor = {
      sprite: spr,
      moveTo: (x: number, ms = 900): Promise<void> =>
        new Promise((resolve) => {
          const tx = s(x);
          const dir: Facing = tx < spr.x ? 'left' : 'right';
          const animKey = `${id}-walk-${dir}`;
          if (this.scene.anims.exists(animKey)) spr.play(animKey, true);
          this.scene.tweens.add({
            targets: spr,
            x: tx,
            duration: ms,
            ease: 'sine.inOut',
            onComplete: () => {
              spr.stop();
              spr.setFrame(standFrame(dir));
              resolve();
            },
          });
        }),
      face: (dir: Facing): void => {
        spr.stop();
        spr.setFrame(standFrame(dir));
      },
      emote: (eid: EmoteId, eopts = {}): EmoteHandle =>
        popEmote(
          this.scene,
          { get x(): number { return spr.x; }, get y(): number { return spr.y - spr.displayHeight; } },
          { id: eid, depth: D.emote, aboveY: s(4), holdMs: eopts.holdMs, loop: eopts.loop },
        ),
      destroy: (): void => {
        spr.destroy();
        shadow.destroy();
      },
    };
    return self;
  }

  /** A warm pulsing glow (the Ember / a Resonance Site). Returns a `brighten()`. */
  glow(x: number, y: number, opts: { color?: number; r?: number } = {}): { brighten(): void } {
    const c = this.scene.add
      .circle(s(x), s(y), s(opts.r ?? 4), opts.color ?? 0xf8d868, 0.85)
      .setScrollFactor(0)
      .setDepth(D.fx - 1);
    const halo = this.scene.add
      .circle(s(x), s(y), s((opts.r ?? 4) * 2.4), opts.color ?? 0xf8d868, 0.12)
      .setScrollFactor(0)
      .setDepth(D.fx - 2);
    this.scene.tweens.add({ targets: [c, halo], scale: 1.35, duration: 820, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.created.push(c, halo);
    return {
      brighten: () => {
        this.scene.tweens.add({ targets: c, fillAlpha: 1, scale: 1.8, duration: 600, yoyo: true });
        this.scene.tweens.add({ targets: halo, fillAlpha: 0.3, scale: 2.2, duration: 900 });
      },
    };
  }

  /** Speak through the dialogue box (each page is one page; @ = a speaker line). */
  async say(...pages: string[]): Promise<void> {
    await this.dlg.say(...pages);
  }

  sparkle(x: number, y: number, count = 10): void {
    const cx = s(x);
    const cy = s(y);
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (i % 3) * 0.4;
      const dist = s(14) + (i % 5) * s(4);
      const sp = this.scene.add
        .sprite(cx, cy, 'spark', i % 2)
        .setScrollFactor(0)
        .setDepth(D.fx)
        .setScale(1 + (i % 3) * 0.3);
      this.scene.tweens.add({
        targets: sp,
        x: cx + Math.cos(ang) * dist,
        y: cy + Math.sin(ang) * dist - s(6),
        alpha: 0,
        scale: 0.3,
        duration: 560 + (i % 4) * 80,
        ease: 'cubic.out',
        onComplete: () => sp.destroy(),
      });
    }
  }

  flash(ms = 360, color = 0xfffaf0): void {
    const cam = this.scene.cameras.main;
    const fl = this.scene.add
      .rectangle(0, 0, cam.width, cam.height, color, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(D.flash);
    this.scene.tweens.add({ targets: fl, alpha: 0, duration: ms, ease: 'quad.out', onComplete: () => fl.destroy() });
  }

  shake(ms: number, intensity: number): void {
    this.scene.cameras.main.shake(ms, intensity);
  }

  sfx(name: string): void {
    AUDIO.sfx(name);
  }

  music(name: string | null): void {
    if (name) AUDIO.playMusic(name);
    else AUDIO.stopMusic();
  }

  /** Skippable wait (A/B/START cuts it short). */
  wait(ms: number): Promise<void> {
    return waitSkippable(this.scene, ms);
  }

  /** internal: tear down everything the director created. */
  teardown(): void {
    this.scene.events.off('update', this.trackShadows);
    for (const a of this.actors) {
      a.spr.destroy();
      a.shadow.destroy();
    }
    this.actors.length = 0;
    for (const o of this.created) o.destroy();
    this.created.length = 0;
  }
}

export interface StagedSceneOpts {
  /** the dialogue box to speak through (reuse the scene's, else one is made). */
  dialogue?: Dialogue;
  /** show cinematic letterbox bars for the duration. Default true. */
  letterbox?: boolean;
}

/**
 * Run a staged cutscene function with letterbox framing and a fresh director,
 * then tear it all down. The caller holds the input lock (`cut`) around this.
 */
export async function playStagedScene(
  scene: Phaser.Scene,
  fn: (d: Director) => Promise<void>,
  opts: StagedSceneOpts = {},
): Promise<void> {
  const bars = (opts.letterbox ?? true) ? letterbox(scene) : null;
  const dlg = opts.dialogue ?? new Dialogue(scene);
  const director = new Director(scene, dlg);
  try {
    await fn(director);
  } finally {
    director.teardown();
    if (bars) await bars.remove();
  }
}
