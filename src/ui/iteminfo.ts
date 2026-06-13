/**
 * THE ITEM HELP PANEL (S15h) — EarthBound's "what is this thing" line, made a
 * live panel along the bottom of the screen. For the highlighted item it shows
 * the NAME, a one-word CATEGORY + a plain-language EFFECT (Offense +N, Heals
 * about N HP, In battle: …), then the flavor `text` underneath.
 *
 * Shared by the MENU (ITEMS / EQUIP / key items) AND the SHOPS (buy / sell),
 * all driven by `pick()`'s `onHighlight` (ui/pick.ts) so a player always reads
 * what a thing IS before they spend money — or a slot — on it. The mechanics
 * line is the pure `itemKindLabel`/`itemEffectLine` (data/items.ts); the joke
 * stays in `item.text`.
 */
import Phaser from 'phaser';
import { makeWindow, DEPTH_UI } from './windows';
import { colorOf, RAMP, px } from '../palette';
import { ITEMS, itemKindLabel, itemEffectLine } from '../data/items';

export interface ItemInfoPanel {
  /** re-read the panel for an item id (call from pick()'s onHighlight) */
  render: (itemId: string) => void;
  destroy: () => void;
}

export function makeItemInfo(scene: Phaser.Scene): ItemInfoPanel {
  const x = 8;
  const w = scene.scale.width - 16;
  const h = 60;
  const y = scene.scale.height - h - 6;
  const win = makeWindow(scene, x, y, w, h);
  const mk = (oy: number, ramp: number, shade: 0 | 1 | 2 | 3, maxW?: number): Phaser.GameObjects.BitmapText => {
    const t = scene.add
      .bitmapText(x + 10, y + oy, 'retro', '', 6)
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(ramp, shade)));
    if (maxW) t.setMaxWidth(maxW);
    return t;
  };
  const nameT = mk(8, RAMP.GOLD, 3);
  const effT = mk(22, RAMP.CYAN, 3, w - 20);
  const flavT = mk(34, RAMP.PAPER, 2, w - 20);
  // S15g: the party VITALS BAR also lives at the bottom of the menu — tell it
  // to yield while this panel is up (no listener in the shops; harmless there)
  scene.events.emit('mf-iteminfo-open');
  return {
    render: (itemId: string): void => {
      const item = ITEMS[itemId];
      if (!item) {
        nameT.setText(itemId);
        effT.setText('');
        flavT.setText('');
        return;
      }
      nameT.setText(item.name);
      effT.setText(`${itemKindLabel(item)}    ${itemEffectLine(item)}`);
      flavT.setText(item.text);
    },
    destroy: (): void => {
      win.destroy();
      nameT.destroy();
      effT.destroy();
      flavT.destroy();
      scene.events.emit('mf-iteminfo-closed'); // the vitals bar may resume
    },
  };
}
