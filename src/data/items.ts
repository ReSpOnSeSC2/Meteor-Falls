/**
 * Item catalog — the Chapter 1 slice of GAME_BIBLE §A8.
 * Weapons carry a wielder tag (§A8: bats are Rex's line, pans are Faye's).
 */
import type { HeroId } from './heroes';

/** equipment slots per Prompt 19 (weapon/body/arms/other) */
export type EquipSlot = 'weapon' | 'body' | 'arms' | 'other';
export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'body', 'arms', 'other'];

/** EB hands-full rule: every hero's bag holds 14 items (Prompt 19) */
export const BAG_MAX = 14;

export interface ItemDef {
  id: string;
  name: string;
  kind: 'weapon' | 'food' | 'cure' | 'battle' | 'key';
  heal?: number;
  offense?: number;
  /** §A8 weapon lines are personal — only this hero can equip it */
  wielder?: HeroId;
  /** battle item damage */
  power?: number;
  /** breaks the Tick's latch (§A6 Boss 1 gimmick) */
  breaksLatch?: boolean;
  cures?: string[];
  usableInBattle: boolean;
  price: number;
  text: string;
}

/** which equip slot an item occupies, if any (armor kinds land in Phase 2+) */
export function slotOf(item: ItemDef): EquipSlot | null {
  return item.kind === 'weapon' ? 'weapon' : null;
}

const I = (i: ItemDef): ItemDef => i;

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [
    I({
      id: 'cracked_bat',
      name: 'Cracked Bat',
      kind: 'weapon',
      offense: 4,
      wielder: 'rex',
      usableInBattle: false,
      price: 18,
      text: 'It has one good SMAAASH left in it. Maybe two.',
    }),
    I({
      id: 'tball_bat',
      name: 'T-Ball Bat',
      kind: 'weapon',
      offense: 8,
      wielder: 'rex',
      usableInBattle: false,
      price: 48,
      text: 'Regulation tee-ball. The Otterbrook Otters went 0-12 with it.',
    }),
    I({
      id: 'hand_me_down_pan',
      name: 'Hand-Me-Down Pan',
      kind: 'weapon',
      offense: 6,
      wielder: 'faye',
      usableInBattle: false,
      price: 36,
      text: 'It made twenty years of breakfast. It is NOT done serving.',
    }),
    I({
      id: 'corn_dog',
      name: 'Corn Dog',
      kind: 'food',
      heal: 30,
      usableInBattle: true,
      price: 6,
      text: "Rex's one true love. Recovers about 30 HP.",
    }),
    I({
      id: 'pbj',
      name: 'PB&J',
      kind: 'food',
      heal: 20,
      usableInBattle: true,
      price: 4,
      text: 'Crusts removed by a professional. Recovers about 20 HP.',
    }),
    I({
      id: 'lemonade',
      name: 'Lemonade',
      kind: 'food',
      heal: 12,
      usableInBattle: true,
      price: 2,
      text: "Ana & Vivi's house blend. 25 cents of pure summer. ~12 HP.",
    }),
    I({
      id: 'salt_shaker',
      name: 'Salt Shaker',
      kind: 'battle',
      power: 40,
      breaksLatch: true,
      usableInBattle: true,
      price: 10,
      text: 'Devastating against slugs, ticks, and unseasoned fries.',
    }),
    I({
      id: 'glints_spark',
      name: "Glint's Spark",
      kind: 'cure',
      heal: 9999,
      cures: ['down'],
      usableInBattle: true,
      price: 0,
      text: 'A warm mote of star-stuff. It wants to help one more time.',
    }),
    I({
      id: 'star_locket',
      name: 'Star Locket',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'It hums when the Embers sing. 1/8th of a Homesong lives inside.',
    }),
  ].map((i) => [i.id, i]),
);
