/**
 * The one list widget + the shared equip confirm (S3 MenuScene, extracted S4
 * so the shops use the SAME code paths instead of copies — Prompt 19/20).
 *
 * pick(): windowed rows, hand cursor, pad/key navigation with wrap, optional
 * second column, dim-disabled rows, and a tap zone per row (§B4: touch AND
 * controller). Resolves the picked index, or -1 on B.
 *
 * confirmEquip(): Prompt 19's "Offense up by N!" stat-delta preview BEFORE
 * the confirm, then GS.equipItem with wielder-tag/hands-full handling. The
 * equip-after-buy prompt (Prompt 20) is this exact function.
 */
import Phaser from 'phaser';
import { GS, type HeroState } from '../engine/state';
import { ITEMS, slotOf } from '../data/items';
import { equipDelta, equipDefenseDelta, equipLuckDelta } from '../battle/formulas';
import { INPUT } from '../engine/input';
import { AUDIO } from '../engine/audio';
import { Dialogue, makeWindow, everyFrame, DEPTH_UI } from './windows';
import { colorOf, RAMP, px } from '../palette';

export interface PickOpts {
  x: number;
  y: number;
  options: string[];
  /** rows rendered dim; confirming them just bonks */
  disabled?: Set<number>;
  /** column-major columns (EB item lists run in two) */
  cols?: number;
  title?: string;
  /** START also cancels (the command list closes the whole menu) */
  startCancels?: boolean;
  /** S9: optional per-row texture key drawn left of the label (the JOURNAL's
   *  earned-caller phone icons) — rows shift right to make room */
  icons?: Array<string | undefined>;
}

export const DIM = 0x8890a0;

export function pick(scene: Phaser.Scene, opts: PickOpts): Promise<number> {
  const { options } = opts;
  const cols = opts.cols ?? 1;
  const rows = Math.ceil(options.length / cols);
  const rowH = 14;
  const iconPad = opts.icons?.some((i) => i !== undefined) ? 13 : 0;
  const colW = Math.max(...options.map((o) => o.length)) * 6 + 28 + iconPad;
  const w = colW * cols + 8;
  const h = rows * rowH + 16;
  const x = Math.max(4, Math.min(opts.x, scene.scale.width - w - 4));
  let y = opts.y;
  const titleH = opts.title ? 22 : 0;
  y = Math.max(4, Math.min(y, scene.scale.height - h - titleH - 4));
  const made: Phaser.GameObjects.GameObject[] = [];
  if (opts.title) {
    const tw = opts.title.length * 6 + 20;
    made.push(makeWindow(scene, x, y, Math.max(tw, 60), 20));
    made.push(
      scene.add
        .bitmapText(x + 10, y + 6, 'retro', opts.title, 6)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 1)
        .setTint(colorOf(px(RAMP.GOLD, 3))),
    );
  }
  const ly = y + titleH;
  made.push(makeWindow(scene, x, ly, w, h));
  const cellPos = (i: number): { cx: number; cy: number } => {
    const c = Math.floor(i / rows);
    const r = i % rows;
    return { cx: x + 4 + c * colW, cy: ly + 9 + r * rowH };
  };
  options.forEach((o, i) => {
    const { cx, cy } = cellPos(i);
    const icon = opts.icons?.[i];
    if (icon !== undefined) {
      made.push(
        scene.add
          .image(cx + 22, cy + 3, icon)
          .setScrollFactor(0)
          .setDepth(DEPTH_UI + 1),
      );
    }
    const t = scene.add
      .bitmapText(cx + 18 + iconPad, cy, 'retro', o, 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1);
    if (opts.disabled?.has(i)) t.setTint(DIM);
    made.push(t);
  });
  const hand = scene.add
    .image(0, 0, 'hand')
    .setScrollFactor(0)
    .setDepth(DEPTH_UI + 2);
  made.push(hand);
  let sel = 0;
  const place = (): void => {
    const { cx, cy } = cellPos(sel);
    hand.setPosition(cx + 8, cy + 4);
  };
  place();
  let navAt = 0;
  const navTick = (moving: boolean): boolean => {
    if (!moving) {
      navAt = 0;
      return false;
    }
    const now = scene.time.now;
    if (now > navAt) {
      navAt = now + 180;
      return true;
    }
    return false;
  };
  return new Promise((resolve) => {
    const finish = (i: number): void => {
      if (i >= 0 && opts.disabled?.has(i)) {
        AUDIO.sfx('cancel');
        return;
      }
      AUDIO.sfx(i < 0 ? 'cancel' : 'confirm');
      off();
      made.forEach((m) => m.destroy());
      zones.forEach((z) => z.destroy());
      resolve(i);
    };
    const zones = options.map((_, i) => {
      const { cx, cy } = cellPos(i);
      const z = scene.add
        .zone(cx, cy - 3, colW, rowH)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI + 3)
        .setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sel = i;
        finish(i);
      });
      return z;
    });
    const off = everyFrame(scene, () => {
      if (INPUT.justPressed('A')) {
        finish(sel);
        return;
      }
      if (INPUT.justPressed('B') || (opts.startCancels && INPUT.justPressed('START'))) {
        finish(-1);
        return;
      }
      const d = INPUT.dir();
      if (!navTick(d.x !== 0 || d.y !== 0)) return;
      const c = Math.floor(sel / rows);
      const r = sel % rows;
      const colCount = (cc: number): number => Math.min(rows, options.length - cc * rows);
      if (d.y !== 0) {
        const cc = colCount(c);
        sel = c * rows + (((r + d.y) % cc) + cc) % cc;
        AUDIO.sfx('cursor');
      } else if (d.x !== 0 && cols > 1) {
        const c2 = (((c + d.x) % cols) + cols) % cols;
        sel = c2 * rows + Math.min(r, colCount(c2) - 1);
        AUDIO.sfx('cursor');
      }
      place();
    });
  });
}

/** Prompt 19: the stat delta previews BEFORE the confirm — menu AND shops.
 *  Weapons preview Offense; 'body' armor previews Defense (S10); 'other'-slot
 *  charms preview Luck (S9). One flow, stat-aware per slot. */
export async function confirmEquip(
  scene: Phaser.Scene,
  dlg: Dialogue,
  hero: HeroState,
  itemId: string,
): Promise<void> {
  const item = ITEMS[itemId];
  const slot = slotOf(item);
  const d =
    slot === 'other'
      ? equipLuckDelta(hero, itemId)
      : slot === 'body'
        ? equipDefenseDelta(hero, itemId)
        : equipDelta(hero, itemId);
  const stat = slot === 'other' ? 'Luck' : slot === 'body' ? 'Defense' : 'Offense';
  const preview =
    d > 0 ? `${stat} up by ${d}!` : d < 0 ? `${stat} down by ${-d}.` : `No change in ${stat}.`;
  const sel = await pick(scene, {
    x: 130,
    y: 64,
    options: ['Equip it', 'Never mind'],
    title: `${hero.name}: ${preview}`,
  });
  if (sel !== 0) return;
  const result = GS.equipItem(hero.id, itemId);
  if (result === 'ok') {
    AUDIO.sfx('confirm');
    await dlg.say(`* ${hero.name} equipped the ${item.name}. ${preview}`);
  } else if (result === 'hands-full') {
    await dlg.say(`${hero.name}'s hands are full!`);
  } else if (result === 'not-yours') {
    const owner = item.wielder ? GS.heroName(item.wielder) : 'somebody else';
    await dlg.say(`It squirms loose. It clearly belongs to ${owner}.`);
  }
}
