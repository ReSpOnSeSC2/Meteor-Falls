/**
 * THE PARTY VITALS BAR (S15g — the user's UI decree). EarthBound's bottom-of-
 * screen status windows: one small panel per party hero (up to 5 once Pippa
 * lands) showing NAME, HP cur/max, PP cur/max, a thin HP/PP bar, and a
 * DOWN/HOMESICK tag. Reads GS party state LIVE — persists nothing.
 *
 * Shared by TWO callers:
 *  - the MENU draws it PERSISTENTLY along the bottom; it YIELDS (hides) while
 *    ANY other bottom UI is up — the item DESCRIPTION PANEL *and* a dialogue
 *    box (item flavor text), which also lives at the bottom (never overlap,
 *    the §A4 readability law). The MENU owns that call (it knows its dlg.busy +
 *    description-panel state); `show()`/`hide()` are idempotent so it can drive
 *    them every frame for free.
 *  - the OVERWORLD pops it as a quick glance on a button (the EB "check HP
 *    fast" beat), dismissed on the same button / B / a tap (and on any dialogue).
 *
 * Pure layout over makeWindow + bitmapText + rectangles (no odometer animation —
 * a glance wants a still, instantly-readable number + bar, not a rolling reel).
 */
import Phaser from 'phaser';
import { GS } from '../engine/state';
import { makeWindow, DEPTH_UI } from './windows';
import { colorOf, RAMP, px } from '../palette';

export interface VitalsBar {
  show(): void;
  hide(): void;
  /** re-read live party state (call after HP/PP changes) */
  refresh(): void;
  readonly visible: boolean;
  destroy(): void;
}

const MARGIN = 4;
const GAP = 3;
const PANEL_H = 46;

/** the HP-bar colour by remaining fraction — green, then gold, then red */
function hpRamp(frac: number): number {
  if (frac > 0.5) return RAMP.GRASS;
  if (frac > 0.25) return RAMP.GOLD;
  return RAMP.RED;
}

/** every panel piece is a display object with both destroy() and setVisible() */
type Vis = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

export function makeVitalsBar(scene: Phaser.Scene): VitalsBar {
  let objs: Vis[] = [];
  let shown = false;

  const clear = (): void => {
    objs.forEach((o) => o.destroy());
    objs = [];
  };

  const text = (x: number, y: number, s: string, ramp: number, shade: 0 | 1 | 2 | 3): Phaser.GameObjects.BitmapText => {
    const t = scene.add.bitmapText(x, y, 'retro', s, 6).setScrollFactor(0).setDepth(DEPTH_UI + 1).setTint(colorOf(px(ramp, shade)));
    objs.push(t);
    return t;
  };

  const bar = (x: number, y: number, w: number, frac: number, ramp: number): void => {
    const f = Math.max(0, Math.min(1, frac));
    const bg = scene.add.rectangle(x, y, w, 3, colorOf(px(RAMP.NIGHT, 2))).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI + 1);
    objs.push(bg);
    if (f > 0) {
      const fill = scene.add.rectangle(x, y, Math.max(1, Math.round(w * f)), 3, colorOf(px(ramp, 2))).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH_UI + 2);
      objs.push(fill);
    }
  };

  const build = (): void => {
    clear();
    const party = GS.data.party;
    const n = Math.max(1, party.length);
    const W = scene.scale.width;
    const H = scene.scale.height;
    const panelW = Math.floor((W - MARGIN * 2 - GAP * (n - 1)) / n);
    const y = H - PANEL_H - 3;
    party.forEach((h, i) => {
      const x = MARGIN + i * (panelW + GAP);
      objs.push(makeWindow(scene, x, y, panelW, PANEL_H));
      const barW = panelW - 12;
      // name + a status tag (DOWN, then §A4.8 HOMESICK for Rex until Mom's call)
      const homesick = h.id === 'rex' && GS.flag('rex_homesick') === true;
      text(x + 6, y + 5, h.name, h.down ? RAMP.RED : RAMP.GOLD, 3);
      if (h.down) text(x + panelW - 28, y + 5, 'DOWN', RAMP.RED, 2);
      else if (homesick) text(x + panelW - 28, y + 5, 'HOME', RAMP.CYAN, 2);
      // HP — number then a thin bar
      text(x + 6, y + 15, `HP ${h.hp}/${h.maxHp}`, RAMP.PAPER, 3);
      bar(x + 6, y + 24, barW, h.maxHp > 0 ? h.hp / h.maxHp : 0, h.down ? RAMP.RED : hpRamp(h.maxHp > 0 ? h.hp / h.maxHp : 0));
      // PP — number then a thin bar
      text(x + 6, y + 30, `PP ${h.pp}/${h.maxPp}`, RAMP.PAPER, 3);
      bar(x + 6, y + 39, barW, h.maxPp > 0 ? h.pp / h.maxPp : 0, RAMP.CYAN);
    });
    objs.forEach((o) => o.setVisible(shown));
  };

  // idempotent so the caller can drive them every frame; show() (re)reads live
  // party state, hide() just blanks the panels (kept for a cheap re-show)
  function show(): void {
    if (shown) return;
    shown = true;
    build();
  }
  function hide(): void {
    if (!shown) return;
    shown = false;
    objs.forEach((o) => o.setVisible(false));
  }

  return {
    show,
    hide,
    refresh: () => {
      if (shown) build();
    },
    get visible() {
      return shown;
    },
    destroy: clear,
  };
}
