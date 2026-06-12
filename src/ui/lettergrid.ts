/**
 * The shared EB letter grid (ADR-013, extracted S10) — the one on-screen
 * keyboard. NameEntryScene moved its grid here VERBATIM the way S4 moved
 * pick()/confirmEquip into ui/pick.ts: same cells, same button bar, same
 * hand-cursor wrap math, same SFX — so the ADR-013 QA recipe stays true.
 * ArcadeScene reuses it for the 3-letter high-score initials (§A10 #4).
 *
 * Input per ADR-024: the widget polls INPUT with everyFrame (never Clock
 * timers); cells and buttons are tap zones (§B4 touch); B erases (and steps
 * out via onEmptyBack when the field is empty); START jumps straight to OK.
 *
 * Layout: buttons pack center-on-200 with 6px gaps. Name entry shows
 * SPACE/BACK/RANDOM/OK; subsets (the initials entry shows BACK/OK only)
 * center themselves the same way.
 */
import Phaser from 'phaser';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { everyFrame, DEPTH_UI } from './windows';
import { colorOf, RAMP, px } from '../palette';
import { GRID_ROWS } from '../data/newgame';

export const GRID_X = 96; // left edge of the 13-column grid
export const GRID_Y = 72;
export const CELL_W = 16;
export const CELL_H = 15;
export const BTN_Y = 152;
export const BTN_H = 16;

export type GridAct = 'space' | 'back' | 'dontcare' | 'ok';

const BTN_DEFS: Record<GridAct, { label: string; w: number }> = {
  space: { label: 'SPACE', w: 56 },
  back: { label: 'BACK', w: 50 },
  dontcare: { label: 'RANDOM', w: 86 },
  ok: { label: 'OK', w: 38 },
};

/** grid rows 0..4 are letters; this virtual row is the button bar */
const BTN_ROW = GRID_ROWS.length;

export interface LetterGridOpts {
  /** max typed length — type() bonks past it (callers may change it later) */
  cap: number;
  value?: string;
  /** which buttons the bar shows, in order (default: all four, ADR-013) */
  buttons?: GridAct[];
  /** the value changed (type/erase/space/don't-care) — re-render it */
  onChange: (value: string) => void;
  /** OK (or START) with a non-empty trimmed value */
  onOk: (value: string) => void;
  /** B pressed while the value is already empty (EB: step back a screen) */
  onEmptyBack?: () => void;
  /** supplies the RANDOM replacement value */
  dontCare?: () => string;
  /** the boxes behind the button labels — provided so this module stays
   *  windowless; NameEntry and the cabinet both pass ui/windows makeBox */
  makeBox: (scene: Phaser.Scene, x: number, y: number, w: number, h: number) => Phaser.GameObjects.GameObject;
}

export class LetterGrid {
  value: string;
  private scene: Phaser.Scene;
  private opts: LetterGridOpts;
  private buttons: Array<{ act: GridAct; x: number; w: number }>;
  private row = 0;
  private col = 0;
  private cap: number;
  private locked = false;
  private navHeld = 0;
  private hand: Phaser.GameObjects.Image;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private off: () => void;

  constructor(scene: Phaser.Scene, opts: LetterGridOpts) {
    this.scene = scene;
    this.opts = opts;
    this.value = opts.value ?? '';
    this.cap = opts.cap;

    // button bar: packed widths, 6px gaps, centered on x=200 (see header)
    const acts = opts.buttons ?? (['space', 'back', 'dontcare', 'ok'] as GridAct[]);
    const total = acts.reduce((a, b) => a + BTN_DEFS[b].w, 0) + (acts.length - 1) * 6;
    let bx = Math.round(200 - total / 2);
    this.buttons = acts.map((act) => {
      const def = { act, x: bx, w: BTN_DEFS[act].w };
      bx += BTN_DEFS[act].w + 6;
      return def;
    });

    // letter cells + tap zones
    GRID_ROWS.forEach((rowStr, r) => {
      [...rowStr].forEach((ch, c) => {
        this.objs.push(
          scene.add
            .bitmapText(GRID_X + c * CELL_W + 8, GRID_Y + r * CELL_H + 4, 'retro', ch, 6)
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(DEPTH_UI + 1),
        );
        const z = scene.add
          .zone(GRID_X + c * CELL_W, GRID_Y + r * CELL_H, CELL_W, CELL_H)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setInteractive()
          .on('pointerdown', () => {
            if (this.locked) return;
            this.row = r;
            this.col = c;
            this.placeHand();
            this.activate();
          });
        this.objs.push(z);
      });
    });

    // button bar
    this.buttons.forEach((b, i) => {
      this.objs.push(opts.makeBox(scene, b.x, BTN_Y, b.w, BTN_H));
      this.objs.push(
        scene.add
          .bitmapText(b.x + b.w / 2 + 4, BTN_Y + 5, 'retro', BTN_DEFS[b.act].label, 6)
          .setOrigin(0.5, 0)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 1)
          .setTint(colorOf(px(RAMP.INK, 0))),
      );
      const z = scene.add
        .zone(b.x, BTN_Y, b.w, BTN_H)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => {
          if (this.locked) return;
          this.row = BTN_ROW;
          this.col = i;
          this.placeHand();
          this.activate();
        });
      this.objs.push(z);
    });

    this.hand = scene.add.image(0, 0, 'hand').setScrollFactor(0).setDepth(DEPTH_UI + 2);
    this.placeHand();

    // per-frame poll (ADR-024) — pauses with the scene like everything else
    this.off = everyFrame(scene, () => {
      if (this.locked) return;
      const d = INPUT.dir();
      if (this.navTick(d.x !== 0 || d.y !== 0)) this.moveCursor(d.x, d.y);
      if (INPUT.justPressed('A')) this.activate();
      else if (INPUT.justPressed('B')) this.erase();
      else if (INPUT.justPressed('START')) this.submit();
    });
  }

  setValue(v: string): void {
    this.value = v;
  }

  setCap(cap: number): void {
    this.cap = cap;
  }

  /** freeze the grid (recap windows, score submission) without tearing down */
  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  destroy(): void {
    this.off();
    this.objs.forEach((o) => o.destroy());
    this.hand.destroy();
  }

  private placeHand(): void {
    if (this.row === BTN_ROW) {
      const b = this.buttons[this.col];
      this.hand.setPosition(b.x + 5, BTN_Y + 8);
    } else {
      this.hand.setPosition(GRID_X + this.col * CELL_W - 2, GRID_Y + this.row * CELL_H + 7);
    }
  }

  private navTick(active: boolean): boolean {
    if (!active) {
      this.navHeld = 0;
      return false;
    }
    const now = this.scene.time.now;
    if (now > this.navHeld) {
      this.navHeld = now + 160;
      return true;
    }
    return false;
  }

  private moveCursor(dx: number, dy: number): void {
    const rowLen = (r: number): number => (r === BTN_ROW ? this.buttons.length : GRID_ROWS[r].length);
    if (dx !== 0) {
      const len = rowLen(this.row);
      this.col = (this.col + dx + len) % len;
    }
    if (dy !== 0) {
      const fromButtons = this.row === BTN_ROW;
      this.row = (this.row + dy + BTN_ROW + 1) % (BTN_ROW + 1);
      const toButtons = this.row === BTN_ROW;
      // crossing between 13-wide letter rows and the button bar: keep the
      // cursor roughly under the thumb
      if (toButtons && !fromButtons) {
        this.col = Math.min(this.buttons.length - 1, Math.floor((this.col / 13) * this.buttons.length));
      } else if (fromButtons && !toButtons) {
        this.col = Math.min(12, Math.round((this.col / Math.max(1, this.buttons.length - 1)) * 12));
      }
    }
    AUDIO.sfx('cursor');
    this.placeHand();
  }

  private activate(): void {
    if (this.row === BTN_ROW) {
      const act = this.buttons[this.col].act;
      if (act === 'space') this.type(' ');
      else if (act === 'back') this.erase();
      else if (act === 'dontcare') {
        const v = this.opts.dontCare?.();
        if (v !== undefined) {
          this.value = v;
          AUDIO.sfx('confirm');
          this.opts.onChange(this.value);
        }
      } else this.submit();
      return;
    }
    this.type(GRID_ROWS[this.row][this.col]);
  }

  private type(ch: string): void {
    if (this.value.length >= this.cap) {
      AUDIO.sfx('cancel');
      return;
    }
    this.value += ch;
    AUDIO.sfx('cursor');
    this.opts.onChange(this.value);
  }

  private erase(): void {
    if (this.value.length > 0) {
      this.value = this.value.slice(0, -1);
      AUDIO.sfx('cancel');
      this.opts.onChange(this.value);
      return;
    }
    // B on an empty field steps out, EB-style (NameEntry: back a screen)
    AUDIO.sfx('cancel');
    this.opts.onEmptyBack?.();
  }

  private submit(): void {
    const trimmed = this.value.trim();
    if (trimmed.length === 0) {
      AUDIO.sfx('cancel');
      return;
    }
    AUDIO.sfx('confirm');
    this.opts.onOk(trimmed);
  }
}
