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
import { vars } from './text';
import { s } from '../spritegen/scale';
import { vehicleByTitle } from '../engine/vehicle-domain';
import { VEHICLE_SPECS } from '../spritegen/vehicles';
import { fuelProfile, rangeTiles } from '../engine/fuel';

export interface ItemInfoPanel {
  /** re-read the panel for an item id (call from pick()'s onHighlight) */
  render: (itemId: string) => void;
  destroy: () => void;
}

/** [PLAYTEST B] the panel's full bottom footprint (box height + its 6px margin).
 *  Lists that pair with this panel pass it as pick()'s `reserveBottom` so they
 *  auto-fit ABOVE it and can never overlap — read it here, never re-hardcode. */
export const ITEMINFO_RESERVE = s(60) + s(6);

export function makeItemInfo(scene: Phaser.Scene): ItemInfoPanel {
  const x = s(8);
  const w = scene.scale.width - s(16);
  const h = s(60);
  const y = scene.scale.height - h - s(6);
  const win = makeWindow(scene, x, y, w, h);
  const mk = (oy: number, ramp: number, shade: 0 | 1 | 2 | 3, maxW?: number): Phaser.GameObjects.BitmapText => {
    const t = scene.add
      .bitmapText(x + s(10), y + oy, 'retro', '', s(6))
      .setScrollFactor(0)
      .setDepth(DEPTH_UI + 1)
      .setTint(colorOf(px(ramp, shade)));
    if (maxW) t.setMaxWidth(maxW);
    return t;
  };
  const nameT = mk(s(8), RAMP.GOLD, 3);
  const effT = mk(s(22), RAMP.CYAN, 3, w - s(20));
  const flavT = mk(s(34), RAMP.PAPER, 2, w - s(20));
  // S15g: the party VITALS BAR also lives at the bottom of the menu — tell it
  // to yield while this panel is up (no listener in the shops; harmless there)
  scene.events.emit('mf-iteminfo-open');
  return {
    render: (itemId: string): void => {
      const item = ITEMS[itemId];
      if (!item) {
        const car = vehicleByTitle(itemId);
        if (car) {
          const spec = VEHICLE_SPECS[car.vehicleType];
          const fuel = fuelProfile(car.vehicleType);
          nameT.setText(car.displayName);
          effT.setText(`VEHICLE    ${spec?.seats ?? 0} SEATS    ${fuel.kind === 'none' ? 'HUMAN POWER' : `${fuel.kind.toUpperCase()} · ${rangeTiles(car.vehicleType)} TILE RANGE`}`);
          flavT.setText(vars(car.note));
        } else {
          nameT.setText(itemId);
          effT.setText('');
          flavT.setText('');
        }
        return;
      }
      nameT.setText(item.name);
      effT.setText(`${itemKindLabel(item)}    ${itemEffectLine(item)}`);
      // item.text is a vars()-render string (same as the say()/shop path + the
      // content-validate token sweep); resolve {rex}… here so the help panel doesn't
      // leak literal tokens (e.g. the starting Corn Dog's "{rex}'s one true love").
      flavT.setText(vars(item.text));
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
