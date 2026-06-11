/**
 * Item catalog — the Chapter 1 slice of GAME_BIBLE §A8.
 * Weapons carry a wielder tag (§A8: bats are Rex's line, pans are Mia's).
 * Types are z.infer'd from src/schemas (S5) — compile shape ≡ runtime schema;
 * the kind 'pp' ⇔ ppHeal pairing (ADR-016) is a schema refinement.
 */
import type { EquipSlot, ItemDef } from '../schemas';

export type { EquipSlot, ItemDef } from '../schemas';

/** equipment slots per Prompt 19 — typed by the schema enum, so a slot added
 *  there must be added here too (and vice versa fails to compile) */
export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'body', 'arms', 'other'];

/** EB hands-full rule: every hero's bag holds 14 items (Prompt 19) */
export const BAG_MAX = 14;

/** which equip slot an item occupies, if any (armor kinds land in Phase 2+) */
export function slotOf(item: ItemDef): EquipSlot | null {
  return item.kind === 'weapon' ? 'weapon' : null;
}

/** Prompt 20: shops buy at half. Price-0 items (sparks, key items) don't sell. */
export function sellPrice(item: ItemDef): number {
  return Math.floor(item.price / 2);
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
      id: 'star_cola',
      name: 'Star Cola',
      kind: 'pp',
      ppHeal: 12,
      usableInBattle: true,
      price: 9,
      text: 'Cold cosmic fizz. Restores about 12 PP. The burp comes out as a chord.',
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
