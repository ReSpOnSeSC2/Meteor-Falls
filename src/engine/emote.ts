/**
 * THE EMOTE POP — a tiny over-the-head feeling glyph (S18, ADR-093 family).
 *
 * EarthBound punctuates a moment by floating a little mark over a character's
 * head: a startled ❗, a sleepy 💤, a happy ♥, a musing "…". THE EMOTE POP is the
 * runtime that pops one of THE FLAIR WEAVE's pixel glyphs (spritegen/flair.ts)
 * above any overworld NPC / party member or battle combatant, on a cutscene or
 * AI cue. It draws nothing new — it REUSES the flair textures already baked at
 * boot (index.ts registers every `flair_<token>`), so it stays palette-clean by
 * construction (ADR-020) and shares the weave's art vocabulary.
 *
 * It is the reusable CORE only: the project lead wires the cues. A caller pops an
 * emote at a target (a `{x,y}` or any Phaser game object with x/y), gets back an
 * EmoteHandle, and can cancel it early (e.g. the moment the player talks to the
 * NPC). The glyph TRACKS a moving world sprite — it re-reads target.x/y every
 * frame off the scene's 'update' event, so it follows a walking NPC and detaches
 * cleanly on stop/finish.
 *
 * dt-INVARIANCE (ADR-024): all motion is Phaser-tween driven (durations in ms),
 * and the per-frame work is a pure position read — no dt math, no Date.now /
 * Math.random (Prime Law 2). Images are POOLED per-scene (the mob_shadow idiom in
 * OverworldScene), so a chatty scene never thrashes the texture/display lists.
 */
import { flairGlyphKey } from '../spritegen/flair';

/** the emote vocabulary — each id maps to an existing flair glyph token. The
 *  surprise/idle/sleep/happy beats reuse the weave's `exclaim`/`note`/`zzz`/
 *  `heart`; `think` uses the `ellipsis` glyph added to the weave for it. */
export const EMOTES = {
  surprise: 'exclaim',
  idle: 'note',
  sleep: 'zzz',
  think: 'ellipsis',
  happy: 'heart',
} as const;

export type EmoteId = keyof typeof EMOTES;

/** the flair texture key for an emote — what index.ts registered at boot. */
export function emoteGlyphKey(id: EmoteId): string {
  return flairGlyphKey(EMOTES[id]);
}

/** a target is either a plain point or any game object exposing x/y (a Sprite,
 *  Image, Container…). We only ever READ x/y, so this stays maximally permissive. */
export interface EmoteTarget {
  x: number;
  y: number;
}

export interface EmoteOpts {
  /** which feeling to pop. */
  id: EmoteId;
  /** px ABOVE the target's (x,y) to float the glyph. Default ~20px — clears an
   *  origin-bottom overworld sprite's head. */
  aboveY?: number;
  /** ms to hold before the fade-out (one-shots only; looping emotes ignore it
   *  and persist until stop()). Default 900. */
  holdMs?: number;
  /** keep a gentle idle bob forever (use for 💤 sleep and 🎵 idle) instead of
   *  holding-then-fading. The caller owns its lifetime via stop(). */
  loop?: boolean;
  /** render depth. Default floats the glyph well above y-sorted overworld actors
   *  (OverworldScene sets an actor's depth = its y). */
  depth?: number;
}

/** the cancel token a caller keeps — `stop()` ends the pop early and recycles the
 *  image; `active` reports whether it is still on screen. */
export interface EmoteHandle {
  stop(): void;
  readonly active: boolean;
}

/** px above the target by default — clears an origin-bottom (feet-anchored)
 *  overworld sprite's head with a little breathing room. */
const DEFAULT_ABOVE_Y = 20;
/** ms a one-shot holds before fading. */
const DEFAULT_HOLD_MS = 900;
/** default depth: high enough to sit above every y-sorted overworld actor (whose
 *  depth equals its world y, never this large) yet below scrollFactor-0 HUD. */
const DEFAULT_DEPTH = 9000;

/** pop-in: the small overshoot the glyph springs to, then settles to 1×. */
const POP_SCALE = 1.25;
const POP_IN_MS = 180;
/** the gentle vertical bob (px) layered on top of the tracked head position. */
const BOB_PX = 2;
const BOB_MS = 620;
const FADE_MS = 220;

/** one pooled emote slot — a reusable Image plus the live bookkeeping for the
 *  pop currently riding it (null when the slot is free for reuse). */
interface EmoteSlot {
  img: Phaser.GameObjects.Image;
  live: LivePop | null;
}

interface LivePop {
  target: EmoteTarget;
  aboveY: number;
  /** the bob offset written by the active tween, added to the head position. */
  bob: number;
  onUpdate: () => void;
  tweens: Phaser.Tweens.Tween[];
  handle: MutableHandle;
}

interface MutableHandle extends EmoteHandle {
  active: boolean;
}

/** the per-scene pool key (Phaser's DataManager lives on every Scene as
 *  scene.data) — keeps the pool with the scene, auto-dropped when it shuts down,
 *  with no edit to the scene classes. */
const POOL_KEY = '__emotePool';

function poolFor(scene: Phaser.Scene): EmoteSlot[] {
  let pool = scene.data.get(POOL_KEY) as EmoteSlot[] | undefined;
  if (!pool) {
    pool = [];
    scene.data.set(POOL_KEY, pool);
  }
  return pool;
}

/** grab a free slot or grow the pool by one (the mob_shadow grow-and-reuse). */
function acquireSlot(scene: Phaser.Scene, textureKey: string): EmoteSlot {
  const pool = poolFor(scene);
  for (const slot of pool) {
    if (!slot.live) {
      slot.img.setTexture(textureKey);
      return slot;
    }
  }
  const img = scene.add.image(0, 0, textureKey).setOrigin(0.5, 0.5).setVisible(false);
  const slot: EmoteSlot = { img, live: null };
  pool.push(slot);
  return slot;
}

/** retire a pop: kill its tweens, detach the tracker, hide the image, free the
 *  slot for reuse. Safe to call twice (stop() races finish()). */
function release(scene: Phaser.Scene, slot: EmoteSlot): void {
  const live = slot.live;
  if (!live) return;
  slot.live = null;
  live.handle.active = false;
  scene.events.off('update', live.onUpdate);
  for (const tw of live.tweens) tw.stop();
  live.tweens.length = 0;
  slot.img.setVisible(false).setAlpha(1).setScale(1);
}

/**
 * Pop an emote glyph above a target. Returns an EmoteHandle the caller can
 * `stop()` to cancel early. The glyph pops in (a small scale overshoot + a soft
 * upward bob), then — unless `loop` — fades out after `holdMs`. Looping emotes
 * keep a gentle idle bob until `stop()`.
 */
export function popEmote(scene: Phaser.Scene, target: EmoteTarget, opts: EmoteOpts): EmoteHandle {
  const aboveY = opts.aboveY ?? DEFAULT_ABOVE_Y;
  const holdMs = opts.holdMs ?? DEFAULT_HOLD_MS;
  const depth = opts.depth ?? DEFAULT_DEPTH;
  const loop = opts.loop ?? false;

  const slot = acquireSlot(scene, emoteGlyphKey(opts.id));
  const img = slot.img;

  const handle: MutableHandle = {
    active: true,
    stop: () => release(scene, slot),
  };

  // the tracker re-reads the target each frame so a walking NPC keeps its glyph;
  // the bob offset (written by the tween) rides on top of the head position.
  const live: LivePop = {
    target,
    aboveY,
    bob: 0,
    tweens: [],
    handle,
    onUpdate: () => {
      img.x = Math.round(live.target.x);
      img.y = Math.round(live.target.y - live.aboveY + live.bob);
    },
  };
  slot.live = live;

  img.setDepth(depth).setAlpha(1).setVisible(true);
  live.onUpdate(); // seat it at the head before the first paint (no 1-frame jump)
  scene.events.on('update', live.onUpdate);

  // pop-in: a brief scale overshoot that settles to 1×.
  img.setScale(POP_SCALE * 0.4);
  live.tweens.push(
    scene.tweens.add({
      targets: img,
      scale: { from: POP_SCALE * 0.4, to: 1 },
      ease: 'Back.easeOut',
      duration: POP_IN_MS,
    }),
  );

  // the soft vertical bob — looped emotes keep it forever; one-shots do one rise
  // and a hold, then fade. We bob `live.bob` (not img.y) so the tracker stays in
  // charge of the head x/y every frame.
  live.tweens.push(
    scene.tweens.add({
      targets: live,
      bob: { from: 0, to: BOB_PX },
      ease: 'Sine.easeInOut',
      duration: BOB_MS,
      yoyo: true,
      repeat: loop ? -1 : 0,
    }),
  );

  if (!loop) {
    live.tweens.push(
      scene.tweens.add({
        targets: img,
        alpha: { from: 1, to: 0 },
        ease: 'Quad.easeIn',
        delay: holdMs,
        duration: FADE_MS,
        onComplete: () => release(scene, slot),
      }),
    );
  }

  return handle;
}
