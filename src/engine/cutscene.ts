/**
 * CUTSCENE PLAYER — the behavior half of the authored-panel cutscene system
 * (data: `src/data/cutscenes.ts`). Plays a registry cutscene as a sequence of
 * full-screen painted panels with code-driven motion: a Ken Burns drift over
 * each still, cross-fades between panels, timed captions, and per-beat
 * sfx/music/flash/shake. The panels are STILLS — this is how cutscenes are made
 * now (docs/PROMPT_WORLD_ANIMATIONS.md §7); no frame strips.
 *
 * Scene-agnostic: pass any Phaser.Scene. The caller owns its own input lock
 * (e.g. OverworldScene's `cut`). Captions auto-advance on a kid-readable timer
 * and A/B/START skips the current line, so the QA frame-pump drives it with no
 * simulated input.
 */
import Phaser from 'phaser';
import { s } from '../spritegen/scale';
import { INPUT } from './input';
import { AUDIO } from './audio';
import { vars } from '../ui/text';
import { DEPTH_UI, everyFrame } from '../ui/windows';
import { CUTSCENES, type Cutscene, type CutsceneBeat } from '../data/cutscenes';

// Eager URL map of every cutscene panel actually on disk. A registry beat with
// no matching PNG yet is simply skipped (no 404) until its art lands — so a
// future-chapter scaffold is harmless before its art exists.
const PANEL_URLS = import.meta.glob('../../assets/art/cutscenes/*/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Texture key for a panel (frame 1 / the still): `cutscene_<chapter>_<art>`. */
export function cutscenePanelKey(chapter: string, art: string): string {
  return `cutscene_${chapter}_${art}`;
}

/** Texture key for animation frame `n` (1-based). Frame 1 reuses the still key so
 *  a still and an animated beat's first frame are the same `_01.png` texture. */
function frameKey(chapter: string, art: string, n: number): string {
  return n <= 1 ? cutscenePanelKey(chapter, art) : `${cutscenePanelKey(chapter, art)}_f${n}`;
}

function panelUrl(chapter: string, art: string, n = 1): string | undefined {
  const pad = String(n).padStart(2, '0');
  return PANEL_URLS[`../../assets/art/cutscenes/${chapter}/${art}_${pad}.png`];
}

/** Queue every registry panel that has art on disk (all frames of animated
 *  beats). Call from a scene preload(). */
export function preloadCutscenePanels(scene: Phaser.Scene): void {
  for (const cs of Object.values(CUTSCENES)) {
    for (const beat of cs.beats) {
      const frames = Math.max(1, beat.frames ?? 1);
      for (let n = 1; n <= frames; n++) {
        const url = panelUrl(cs.chapter, beat.art, n);
        if (!url) continue;
        const key = frameKey(cs.chapter, beat.art, n);
        if (!scene.textures.exists(key)) scene.load.image(key, url);
      }
    }
  }
}

/** True once a cutscene's first panel is loaded — lets a caller fall back to a
 *  bespoke cinema when the authored art isn't present (×1 / art-not-loaded). */
export function cutsceneReady(id: string): boolean {
  const def = CUTSCENES[id];
  return !!def && def.beats.length > 0 && !!panelUrl(def.chapter, def.beats[0].art);
}

// unhurried, kid-readable pacing (mirrors the ADR-041 opening captions)
function captionHoldMs(text: string): number {
  return Math.max(2600, 1000 + text.length * 55);
}

function beatMotionMs(beat: CutsceneBeat): number {
  const caps = beat.captions ?? [];
  const capMs = caps.reduce((sum, c) => sum + captionHoldMs(vars(c)), 0);
  return Math.max(2800, capMs) + (beat.hold ?? 0) + 700;
}

/** A skippable wait: resolves after `ms`, or early if A/B/START is pressed. */
function holdMs(scene: Phaser.Scene, ms: number): Promise<void> {
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

interface ActivePanel {
  img: Phaser.GameObjects.Image;
  timer: Phaser.Time.TimerEvent | null;
}

/** Drive an animated beat: cycle `<art>_01…_NN` on the image under its Ken Burns
 *  tween. Returns the loop timer (or null for a still / frames-not-yet-authored). */
function startFrameLoop(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
  chapter: string,
  beat: CutsceneBeat,
  depth: number,
): Phaser.Time.TimerEvent | null {
  const count = Math.max(1, beat.frames ?? 1);
  if (count <= 1) return null;
  const keys: string[] = [];
  for (let n = 1; n <= count; n++) {
    const k = frameKey(chapter, beat.art, n);
    if (scene.textures.exists(k)) keys.push(k);
  }
  if (keys.length <= 1) return null; // frames not authored yet — play as a still
  let i = 0;
  const period = 1000 / (beat.fps ?? 6);
  return scene.time.addEvent({
    delay: period,
    loop: true,
    callback: () => {
      i = (i + 1) % keys.length;
      const nextKey = keys[i];
      if (!beat.dissolve) {
        img.setTexture(nextKey);
        return;
      }
      // cross-dissolve: a brief overlay at the base's current transform
      const ov = scene.add
        .image(img.x, img.y, nextKey)
        .setScrollFactor(0)
        .setDepth(depth)
        .setScale(img.scaleX, img.scaleY)
        .setAlpha(0);
      scene.tweens.add({
        targets: ov,
        alpha: 1,
        duration: Math.min(180, period * 0.8),
        onComplete: () => {
          img.setTexture(nextKey);
          ov.destroy();
        },
      });
    },
  });
}

interface Captioner {
  show(text: string): Promise<void>;
  destroy(): void;
}

/** A bottom caption line + scrim, reused across the whole cutscene. */
function makeCaptioner(scene: Phaser.Scene, w: number, h: number, depth: number): Captioner {
  const scrim = scene.add
    .rectangle(0, h - s(46), w, s(46), 0x05060c, 0.34)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0);
  const txt = scene.add
    .bitmapText(w / 2, h - s(34), 'retro', '', s(6))
    .setOrigin(0.5, 0)
    .setCenterAlign()
    .setMaxWidth(w - s(40))
    .setTint(0xf8f0d0)
    .setScrollFactor(0)
    .setDepth(depth + 1)
    .setAlpha(0);

  const fade = (target: Phaser.GameObjects.GameObject, alpha: number, ms: number): Promise<void> =>
    new Promise((resolve) => {
      scene.tweens.add({ targets: target, alpha, duration: ms, onComplete: () => resolve() });
    });

  return {
    show(raw: string): Promise<void> {
      const text = vars(raw);
      txt.setText(text);
      void fade(scrim, 0.34, 240);
      void fade(txt, 1, 240);
      return new Promise<void>((resolve) => {
        let elapsed = 0;
        const hold = captionHoldMs(text);
        const off = everyFrame(scene, (dt) => {
          elapsed += dt;
          if (elapsed >= hold || INPUT.justPressed('A') || INPUT.justPressed('B') || INPUT.justPressed('START')) {
            off();
            void fade(scrim, 0, 200);
            void fade(txt, 0, 200).then(resolve);
          }
        });
      });
    },
    destroy(): void {
      txt.destroy();
      scrim.destroy();
    },
  };
}

export interface CutsceneOpts {
  /** base render depth for the panels; captions/flash stack above it. */
  depth?: number;
}

/**
 * Play a cutscene to completion. Accepts a registry id or an inline definition.
 * Returns when the last panel has faded out (the caller's scene is underneath).
 * No-ops cleanly if the id is unknown or none of its panels are authored yet.
 */
export async function playCutscene(
  scene: Phaser.Scene,
  cutscene: string | Cutscene,
  opts: CutsceneOpts = {},
): Promise<void> {
  const def = typeof cutscene === 'string' ? CUTSCENES[cutscene] : cutscene;
  if (!def) return;

  const cam = scene.cameras.main;
  const w = cam.width;
  const h = cam.height;
  const baseDepth = opts.depth ?? DEPTH_UI + 20;
  const cap = makeCaptioner(scene, w, h, baseDepth + 2);

  let prev: ActivePanel | null = null;

  for (const beat of def.beats) {
    const key = cutscenePanelKey(def.chapter, beat.art);
    if (!scene.textures.exists(key)) continue; // unauthored — skip silently

    const img = scene.add
      .image(w / 2, h / 2, key)
      .setScrollFactor(0)
      .setDepth(baseDepth)
      .setAlpha(0);

    const cover = Math.max(w / img.width, h / img.height);
    const m = beat.motion ?? {};
    img.setScale(cover * (m.fromScale ?? 1.06));
    const motionMs = m.ms ?? beatMotionMs(beat);

    // cross-fade the new panel up over the previous one
    scene.tweens.add({ targets: img, alpha: 1, duration: prev ? 620 : 460, ease: 'sine.out' });
    // the Ken Burns drift, spanning the whole beat
    scene.tweens.add({
      targets: img,
      scale: cover * (m.toScale ?? 1.13),
      x: w / 2 + s(m.panX ?? 0),
      y: h / 2 + s(m.panY ?? 0),
      duration: motionMs,
      ease: m.ease ?? 'sine.inOut',
    });

    // animated beats flip/dissolve their frames under the same motion (no-op still)
    const timer = startFrameLoop(scene, img, def.chapter, beat, baseDepth);

    // entrance cues
    if (beat.stopMusic) AUDIO.stopMusic();
    if (beat.music) AUDIO.playMusic(beat.music);
    if (beat.sfx) AUDIO.sfx(beat.sfx);
    if (beat.shake) cam.shake(beat.shake[0], beat.shake[1]);
    if (beat.flash) {
      const fl = scene.add
        .rectangle(0, 0, w, h, 0xfffaf0, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(baseDepth + 4);
      scene.tweens.add({ targets: fl, alpha: 0, duration: beat.flash, ease: 'quad.out', onComplete: () => fl.destroy() });
    }

    // retire the previous panel once the cross-fade has covered it
    const old = prev;
    if (old) {
      old.timer?.remove();
      scene.time.delayedCall(680, () => old.img.destroy());
    }
    prev = { img, timer };

    const captions = beat.captions ?? [];
    if (captions.length === 0) {
      await holdMs(scene, beat.hold ?? Math.min(motionMs, 2400));
    } else {
      for (const line of captions) await cap.show(line);
      if (beat.hold) await holdMs(scene, beat.hold);
    }
  }

  // tail: fade the final panel out; the scene beneath takes over
  if (prev) {
    const last = prev;
    last.timer?.remove();
    await new Promise<void>((resolve) => {
      scene.tweens.add({
        targets: last.img,
        alpha: 0,
        duration: 520,
        ease: 'sine.in',
        onComplete: () => {
          last.img.destroy();
          resolve();
        },
      });
    });
  }
  cap.destroy();
}
