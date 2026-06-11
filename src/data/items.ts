/**
 * Item catalog — the Chapter 1 slice of GAME_BIBLE §A8.
 * Weapons carry a wielder tag (§A8: bats are Jay's line, pans are Mia's).
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

/** which equip slot an item occupies, if any (charms ride 'other' since S9,
 *  armor rides 'body' since S10, and 'arms' opened with S12 — THE STARTING
 *  FOUR, the Classic's first-title prize, is §A8's first arms gear) */
export function slotOf(item: ItemDef): EquipSlot | null {
  if (item.kind === 'weapon') return 'weapon';
  if (item.kind === 'armor') return 'body';
  if (item.kind === 'arms') return 'arms';
  if (item.kind === 'charm') return 'other';
  return null;
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
    /* ---- S11b: the §A8 line openers for the back half of the party —
       Milo's first gun and Dorin's first beads, so every hero's stage
       swing is real the day they join (their chapters stock/grant them) ---- */
    I({
      id: 'pellet_popper',
      name: 'Pellet Popper',
      kind: 'weapon',
      offense: 14,
      wielder: 'milo',
      usableInBattle: false,
      price: 98,
      text: 'Wintermoor-legal air rifle. The safety tip is orange. The attitude is not.',
    }),
    I({
      id: 'cedar_beads',
      name: 'Cedar Beads',
      kind: 'weapon',
      offense: 26,
      wielder: 'dorin',
      usableInBattle: false,
      price: 210,
      text: 'Monastery cedar, wrist-wrapped. Every strike smells faintly of prayer.',
    }),
    I({
      id: 'corn_dog',
      name: 'Corn Dog',
      kind: 'food',
      heal: 30,
      usableInBattle: true,
      price: 6,
      text: "{rex}'s one true love. Recovers about 30 HP.",
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
    /* ---- S9: §A10 #1–3 quest rewards + supplies ---- */
    I({
      id: 'lucky_collar',
      name: 'Lucky Collar',
      kind: 'charm',
      luck: 7,
      usableInBattle: false,
      price: 0,
      text: 'Biscuit chewed the lucky right into it. Smells faintly of pond. Luck +7.',
    }),
    I({
      id: 'fresh_stamps',
      name: 'Fresh Stamps',
      kind: 'valuable',
      usableInBattle: false,
      price: 240,
      text: 'Mint 1995 commemoratives. A collector would pay anything. The drugstore pays exactly half of anything.',
    }),
    I({
      id: 'sugar_bag',
      name: 'Sugar Bag',
      kind: 'valuable',
      usableInBattle: false,
      price: 4,
      text: 'Four pounds. The recipe on the back is one word long.',
    }),
    I({
      id: 'lemon_crate',
      name: 'Lemon Crate',
      kind: 'valuable',
      usableInBattle: false,
      price: 8,
      text: 'City lemons, imported from a city. You can tell by the attitude.',
    }),
    I({
      id: 'lemonade_jug',
      name: 'The Jug',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'The official jug of the Lemonade Empire. The tiny hand-drawn flag makes it official.',
    }),
    /* ---- S10: §A10 #4 quest reward — the first 'body' gear ---- */
    I({
      id: 'champion_jacket',
      name: 'Champion Jacket',
      kind: 'armor',
      defense: 8,
      usableInBattle: false,
      price: 0,
      text: 'CHAMPION across the back in iron-on letters. Sal pressed every one himself. Defense +8.',
    }),
    /* ---- S12: THE STARTING FOUR — the Brickton Classic's first-title
       prize, §A8's first 'arms' gear (one piece per hero, wielder-tagged;
       battle + STATUS read them through heroSpeed/heroGuts) ---- */
    I({
      id: 'cage_sweatband',
      name: "Champ's Sweatband",
      kind: 'arms',
      guts: 6,
      wielder: 'rex',
      usableInBattle: false,
      price: 0,
      text: 'Soaked in four quarters of not quitting. Guts +6.',
    }),
    I({
      id: 'victory_scrunchie',
      name: 'Victory Scrunchie',
      kind: 'arms',
      speed: 6,
      wielder: 'faye',
      usableInBattle: false,
      price: 0,
      text: 'Holds a championship together at the wrist. Speed +6.',
    }),
    I({
      id: 'shooters_sleeve',
      name: "Shooter's Sleeve",
      kind: 'arms',
      speed: 7,
      wielder: 'milo',
      usableInBattle: false,
      price: 0,
      text: 'Aerodynamically smug. Wintermoor would not approve. Speed +7.',
    }),
    I({
      id: 'iron_wristguard',
      name: 'Iron Wristguard',
      kind: 'arms',
      guts: 7,
      wielder: 'dorin',
      usableInBattle: false,
      price: 0,
      text: 'The mountain deleted his fear. The cage gave him this instead. Guts +7.',
    }),
    /* ---- S13: THE SUNDAY SET — the first Costa Estrella Invitational's
       prize: four hero-tagged 'other'-slot charms (§A8 amended — the
       'other' expansion; luck reads through heroLuck, the S9 seam) ---- */
    I({
      id: 'sunday_visor',
      name: 'Sunday Visor',
      kind: 'charm',
      luck: 7,
      wielder: 'rex',
      usableInBattle: false,
      price: 0,
      text: 'The brim has read every green on the coast. It will read anything for you now. Luck +7.',
    }),
    I({
      id: 'sunday_glove',
      name: 'Sunday Glove',
      kind: 'charm',
      luck: 6,
      wielder: 'faye',
      usableInBattle: false,
      price: 0,
      text: 'Worn soft by a thousand honest grips. It only fits a steady hand. Luck +6.',
    }),
    I({
      id: 'lucky_tee',
      name: 'Lucky Tee',
      kind: 'charm',
      luck: 6,
      wielder: 'milo',
      usableInBattle: false,
      price: 0,
      text: 'Survived a driver swing untouched. Statistically impossible. Milo keeps checking the math. Luck +6.',
    }),
    I({
      id: 'caddys_marker',
      name: "Caddy's Marker",
      kind: 'charm',
      luck: 7,
      wielder: 'dorin',
      usableInBattle: false,
      price: 0,
      text: 'A coin that has marked ten thousand putts. It knows exactly where it is. Luck +7.',
    }),
  ].map((i) => [i.id, i]),
);
