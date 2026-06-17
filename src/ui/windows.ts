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
import { s } from '../spritegen/scale';
import { vars, money } from './text';
import { FlairLine, hasFlair } from './flairline';
import { paginate, pageOf, ROW_H } from './paginate';

export { vars } from './text';

// Dialogue/HUD must paint above ALL world sprites. World depth is y-based
// (a prop's depth = its bottom edge in px = up to mapHeight*16 + sprite height),
// so on tall city maps a colossus like THE SPIRE reaches ~1000+ and would cover
// the text box. Park UI well above any plausible world depth, but BELOW the
// full-screen door/transition fade at 99998 (the wipe must still cover the UI).
export const DEPTH_UI = 90000;

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

/**
 * [PLAYTEST B] DEV TRIPWIRE: a loud console.warn the instant ANY window/box is
 * created outside the screen rect. It does NOT throw — a stray pixel must never
 * crash the game — but it makes an off-screen box impossible to miss in dev (the
 * cash corner running off the right edge is exactly the bug it catches). Inert in
 * production (`import.meta.env.DEV`) and guarded for headless/test runs.
 */
function boundsCheck(scene: Phaser.Scene, kind: string, x: number, y: number, w: number, h: number): void {
  const dev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  if (!dev) return;
  const sw = scene.scale.width;
  const sh = scene.scale.height;
  if (x < 0 || y < 0 || x + w > sw || y + h > sh) {
    console.warn(
      `[ui] ${kind} off-screen: rect (${x},${y},${w}×${h}) right=${x + w} bottom=${y + h} exceeds ${sw}×${sh}`,
    );
  }
}

export function makeWindow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.NineSlice {
  boundsCheck(scene, 'makeWindow', x, y, w, h);
  // 9-slice corner pieces are 8px native; the corner texture is upscaled
  // ×ART_SCALE at boot, so the slice sizes must match in runtime px.
  const win = scene.add.nineslice(x, y, winTexture(), 0, w, h, s(8), s(8), s(8), s(8));
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
  boundsCheck(scene, 'makeBox', x, y, w, h);
  // 6px native corner pieces; the box9 texture is upscaled ×ART_SCALE at boot.
  const win = scene.add.nineslice(x, y, 'box9', 0, w, h, s(6), s(6), s(6), s(6));
  win.setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI);
  return win;
}

/**
 * [PLAYTEST B] THE EB cash corner ($X · BANK $Y), shared by the menu AND the
 * shops so the SAME clamp can never drift between them. Amounts abbreviate
 * ($1.2M) once big, and the window is CLAMPED so its right edge stays ≤ screen
 * width: width is capped to `screenW - 12`, and the box is pinned `screenW - w -
 * 4` from the left so it physically cannot run off the right edge — for any
 * amount, up to the §A9 billions. The text shares the same right anchor and
 * rides inside the frame. Returns the objects so the caller can redraw it.
 */
export function makeCashBox(
  scene: Phaser.Scene,
  cashOnHand: number,
  banked: number,
): Phaser.GameObjects.GameObject[] {
  const sw = scene.scale.width;
  const cash = `${money(cashOnHand, { abbrev: true })}  BANK ${money(banked, { abbrev: true })}`;
  // cap the window to the screen (minus an 8px right + 4px safety margin); the
  // box's left then sits at sw - w - 4, so right edge = sw - 4 ≤ screen, always.
  // sw is already runtime px; the px paddings + the 6px glyph advance scale.
  const w = Math.min(cash.length * s(6) + s(20), sw - s(12));
  const bx = sw - w - s(4);
  return [
    makeWindow(scene, bx, s(8), w, s(22)),
    scene.add
      .bitmapText(bx + s(10), s(15), 'retro', cash, s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(w - s(16)), // the text is bounded to the frame's interior
  ];
}

/* ------------------------------------------------------------------ */

export class Dialogue {
  private scene: Phaser.Scene;
  private win: Phaser.GameObjects.NineSlice | null = null;
  private text: Phaser.GameObjects.BitmapText | null = null;
  private cursor: Phaser.GameObjects.BitmapText | null = null;
  /** S18 M23 (ADR-093): the mixed-run flair renderer, bound to `text`. Lazily
   *  built; only engaged on pages that carry a `{g:NAME}` token. */
  private flair: FlairLine | null = null;
  /** true while a say()/ask() is running — owner scene pauses the world */
  busy = false;
  /** scene-time stamp of the last say()/ask() teardown (see justReleased) */
  private releasedAt = -1;
  /** Optional overrides for where an ask() menu sits (runtime px). The battle uses
   *  them to dock the action menu in a BOTTOM-LEFT band (EarthBound layout): menuX
   *  left edge instead of right-aligning, menuBottomY the bottom anchor, menuTopY
   *  the highest the menu may grow (so it stays in the band and paginates rather
   *  than rising into the enemy zone). Null = the default right-aligned placement. */
  menuX: number | null = null;
  menuBottomY: number | null = null;
  menuTopY: number | null = null;

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
    return { x: s(8), y: H - s(66), w: W - s(16), h: s(60) };
  }

  /** Show pages of dialogue. Each string is one page; @ prefix = speech. */
  async say(...pages: string[]): Promise<void> {
    this.busy = true;
    const { x, y, w, h } = this.layout();
    this.win ??= makeWindow(this.scene, x, y, w, h);
    this.win.setTexture(winTexture()); // a flavor change applies live (S14b)
    this.win.setVisible(true);
    this.text ??= this.scene.add
      .bitmapText(x + s(10), y + s(8), 'retro', '', s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setMaxWidth(w - s(24));
    this.text.setVisible(true);
    this.cursor ??= this.scene.add
      .bitmapText(x + w - s(16), y + h - s(14), 'retro', '▼', s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(RAMP.GOLD, 3)));
    this.flair ??= new FlairLine(this.scene, this.text, { maxWidthPx: w - s(24), depth: DEPTH_UI + 1 });
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
    this.flair?.clear();
    this.win?.setVisible(false);
    this.text?.setVisible(false);
    this.cursor?.setVisible(false);
  }

  private typewrite(page: string): Promise<void> {
    // S18 M23: a page that carries inline flair lays out as a mixed run; every
    // other page (the overwhelming majority) keeps the original plain typewriter.
    this.flair?.clear();
    if (hasFlair(page) && this.flair) return this.typewriteFlair(page, this.flair);
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

  /** the mixed-run twin of typewrite(): the SAME dt-scaled, A-to-fast-forward
   *  pacing, but the counter advances VISUAL UNITS (a glyph = one unit), so a
   *  flair page reveals exactly like a plain one and the existing timing holds. */
  private typewriteFlair(page: string, fl: FlairLine): Promise<void> {
    return new Promise((resolve) => {
      fl.set(page);
      const total = fl.units;
      this.cursor?.setVisible(false);
      let i = 0;
      let acc = 0;
      const off = everyFrame(this.scene, (dt) => {
        const fast = INPUT.held('A') || INPUT.held('B');
        acc += (fast ? 3.2 : textSpeedMul()) * (dt / 16);
        while (acc >= 1 && i < total) {
          acc -= 1;
          i++;
        }
        fl.reveal(i);
        if (i % 3 === 0 && i < total) AUDIO.sfx('text');
        if (i >= total) {
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

  /** N-way choice menu. Returns chosen index (B = defaultIndex if allowed).
   *  S16 (ADR-060): an optional per-row `icons` array (texture keys, undefined
   *  to skip a row) draws a face left of each label — battle Goods reads the
   *  item icons through it, the way pick() does in the menus.
   *
   *  [PLAYTEST B] The menu's bottom edge is pinned 4px above the dialogue box
   *  and it grows UPWARD; rows are capped to what fits between the screen top and
   *  that edge, paginating past it — the same structural overflow guard pick()
   *  uses, over the shared Phaser-free paginate()/pageOf() math. Short fixed
   *  lists (every ask() in the game today) stay a single page at the old size. */
  ask(
    options: string[],
    opts: { cancelIndex?: number; icons?: Array<string | undefined> } = {},
  ): Promise<number> {
    this.busy = true;
    const scene = this.scene;
    const W = scene.scale.width;
    const rowH = s(ROW_H); // ROW_H is native px (paginate.ts); pitch in runtime px
    const iconPad = opts.icons?.some((k) => k !== undefined) ? s(13) : 0;
    const w = Math.max(...options.map((o) => o.length)) * s(6) + s(36) + iconPad;
    const x = W - w - s(10);
    // The menu's bottom edge — 4px above the H-66 dialogue box — is the fixed
    // anchor; AUTO-FIT how many rows fit above it (a 4px top margin + the 16px
    // frame padding reserved), and PAGINATE the rest. The frame is sized to
    // perPage (== min(length, fitRows)) so a fitting list keeps the exact old
    // compact height — h = length*rowH + 16 — and a uniform frame across pages.
    const menuBottom = this.menuBottomY ?? scene.scale.height - s(66) - s(4);
    const fitRows = Math.max(1, Math.floor((menuBottom - s(4) - s(16)) / rowH));
    const { perPage, pages } = paginate(options.length, 1, fitRows);
    const h = perPage * rowH + s(16);
    const y = menuBottom - h; // == scene.scale.height - 66 - h - 4 (the original)
    const win = makeWindow(scene, x, y, w, h);

    let sel = 0;
    let page = 0;
    const indexOfSlot = (slot: number): number => page * perPage + slot;
    const slotOfIndex = (i: number): number => i - page * perPage;
    const slotCount = (): number => Math.min(perPage, options.length - page * perPage);

    const hand = scene.add
      .image(x + s(12), y + s(13), 'hand')
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 2);

    // per-page pools: labels + icons + tap zones + a "1/3" marker, all rebuilt on
    // a page flip so the menu can never paint a row (or fire a tap) off its frame.
    const pageObjs: Phaser.GameObjects.GameObject[] = [];
    let zones: Phaser.GameObjects.Zone[] = [];
    let finish: (i: number) => void = () => {};

    const renderPage = (): void => {
      pageObjs.forEach((o) => o.destroy());
      pageObjs.length = 0;
      zones.forEach((z) => z.destroy());
      zones = [];
      const n = slotCount();
      for (let slot = 0; slot < n; slot++) {
        const i = indexOfSlot(slot);
        const icon = opts.icons?.[i];
        if (icon !== undefined) {
          pageObjs.push(
            scene.add
              .image(x + s(24), y + s(13) + slot * rowH, icon)
              .setScrollFactor(0)
              .setDepth(DEPTH_UI + 1),
          );
        }
        pageObjs.push(
          scene.add
            .bitmapText(x + s(22) + iconPad, y + s(9) + slot * rowH, 'retro', vars(options[i]), s(6))
            .setScrollFactor(0)
            .setDepth(DEPTH_UI + 1),
        );
        const z = scene.add
          .zone(x, y + s(6) + slot * rowH, w, rowH)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 3)
          .setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          sel = i;
          finish(i);
        });
        zones.push(z);
      }
      // [PLAYTEST B] the page indicator — gold "1/3" with up/down arrows in the
      // bottom frame margin (mirrors pick()); absent on the single-page menus.
      if (pages > 1) {
        const label = `${page > 0 ? '▲ ' : ''}${page + 1}/${pages}${page < pages - 1 ? ' ▼' : ''}`;
        pageObjs.push(
          scene.add
            .bitmapText(x + w - label.length * s(6) - s(6), y + h - s(11), 'retro', label, s(6))
            .setScrollFactor(0)
            .setDepth(DEPTH_UI + 1)
            .setTint(colorOf(px(RAMP.GOLD, 3))),
        );
      }
      hand.y = y + s(13) + slotOfIndex(sel) * rowH;
    };

    return new Promise((resolve) => {
      finish = (i: number): void => {
        AUDIO.sfx(opts.cancelIndex === i ? 'cancel' : 'confirm');
        off();
        win.destroy();
        hand.destroy();
        pageObjs.forEach((o) => o.destroy());
        zones.forEach((z) => z.destroy());
        this.releasedAt = this.scene.time.now;
        this.busy = false;
        resolve(i);
      };

      renderPage();

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
          // sel wraps the WHOLE list; flip to the page that now holds it.
          const np = pageOf(sel, perPage);
          if (np !== page) {
            page = np;
            renderPage();
          }
        }
        hand.y = y + s(13) + slotOfIndex(sel) * rowH;
      });
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
  const w = message.length * s(6) + s(24);
  const win = makeWindow(scene, (W - w) / 2, s(10), w, s(24));
  const tx = scene.add
    .bitmapText((W - w) / 2 + s(12), s(18), 'retro', message, s(6))
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
