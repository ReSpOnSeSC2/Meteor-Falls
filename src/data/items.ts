/**
 * Item catalog — the Chapter 1 slice of GAME_BIBLE §A8.
 * Weapons carry a wielder tag (§A8: bats are Jay's line, pans are Mia's).
 * Types are z.infer'd from src/schemas (S5) — compile shape ≡ runtime schema;
 * the kind 'pp' ⇔ ppHeal pairing (ADR-016) is a schema refinement.
 */
import type { BoostStat, EquipSlot, ItemBand, ItemBonus, ItemDef } from '../schemas';

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

/** the short category tag shown in the item-menu description panel (S15h UI
 *  pass). One word the player reads before the effect line — exhaustive over
 *  ItemKind, so a new kind must be labelled here or it fails to compile. */
export function itemKindLabel(item: ItemDef): string {
  switch (item.kind) {
    case 'weapon': return 'WEAPON';
    case 'armor': return 'ARMOR';
    case 'arms': return 'GEAR';
    case 'charm': return 'CHARM';
    case 'food': return 'FOOD';
    case 'pp': return 'PP DRINK';
    case 'cure': return 'MEDICINE';
    case 'battle': return 'BATTLE ITEM';
    case 'valuable': return 'VALUABLE';
    case 'basket': return 'PICNIC';
    case 'tonic': return 'TONIC';
    case 'key': return 'KEY ITEM';
    default: { const never: never = item.kind; return never; }
  }
}

/** S17 (ADR-061): the plain-language name of a boostable stat, for the tonic's
 *  effect line and the "X went up!" use beat (§A4.12). */
export function boostStatLabel(stat: BoostStat): string {
  switch (stat) {
    case 'offense': return 'Offense';
    case 'defense': return 'Defense';
    case 'speed': return 'Speed';
    case 'guts': return 'Guts';
    case 'vibe': return 'Vibe';
    case 'luck': return 'Luck';
    case 'hp': return 'max HP';
    case 'pp': return 'max PP';
    default: { const never: never = stat; return never; }
  }
}

function battleStatusLine(s: NonNullable<ItemDef['status']>): string {
  return s === 'crying' ? 'makes every foe cry' : s === 'asleep' ? 'puts every foe to sleep' : 'paralyzes every foe';
}

/** one plain-language line of WHAT THE ITEM DOES — the player should never have
 *  to guess (S15h items-menu pass). Pure, so the description panel and the
 *  shops can both read it. EarthBound register: a clear sentence; the joke and
 *  the flavor stay in `item.text`, this is just the mechanics, spoken simply. */
export function itemEffectLine(item: ItemDef): string {
  switch (item.kind) {
    case 'weapon': return `Offense +${item.offense ?? 0} when equipped`;
    case 'armor': return `Defense +${item.defense ?? 0} when worn`;
    case 'arms': return item.speed ? `Speed +${item.speed} when equipped` : `Guts +${item.guts ?? 0} when equipped`;
    case 'charm': return `Luck +${item.luck ?? 0} when equipped`;
    case 'food': return `Heals about ${item.heal ?? 0} HP`;
    case 'pp': return `Restores about ${item.ppHeal ?? 0} PP`;
    case 'cure': return item.cures && item.cures.length ? `Cures ${item.cures.join(', ')}` : 'Settles what ails you';
    case 'basket': return 'Open it at a picnic table to share a meal';
    case 'tonic': return item.boost ? `Permanently raises ${boostStatLabel(item.boost.stat)} by ${item.boost.amount}` : 'A permanent boost';
    case 'valuable': return item.price > 0 ? `Worth $${sellPrice(item)} at a shop counter` : 'Worth something to the right person';
    case 'key': return 'A key item — it opens something, somewhere';
    case 'battle': {
      if (item.status) return `In battle: ${battleStatusLine(item.status)}`;
      if (item.breaksLatch) return 'In battle: frees a hero from a latch';
      if (item.power) return `In battle: about ${item.power} damage to one foe`;
      return 'Use this during a battle';
    }
    default: { const never: never = item.kind; return never; }
  }
}

/** S17 (ADR-061): the "(also +N X)" rider the equip preview + STATUS show
 *  beneath an item's primary stat — its secondary `bonus` map, `vibe` rider,
 *  and elemental `resists`, spoken plainly. Empty for a pure single-stat
 *  classic (the whole 41-item catalog reads exactly as before). */
export function equipSecondaryNote(item: ItemDef, opts: { resists?: boolean } = {}): string {
  const withResists = opts.resists ?? true;
  const parts: string[] = [];
  if (item.bonus) {
    for (const [stat, n] of Object.entries(item.bonus)) {
      if (n) parts.push(`+${n} ${boostStatLabel(stat as keyof ItemBonus)}`);
    }
  }
  if (item.vibe) parts.push(`+${item.vibe} Vibe`);
  if (withResists && item.resists) for (const r of item.resists) parts.push(`+${r.pct}% ${r.element} resist`);
  return parts.length ? `(also ${parts.join(', ')})` : '';
}

const I = (i: ItemDef): ItemDef => i;

/**
 * S17 (ADR-061) — THE CATALOG SPINE: the chapter band each item belongs to
 * (§A8 per-region slice). Kept as one readable table beside the literals (the
 * item objects stay clean) and folded onto each item when ITEMS is built. Every
 * id MUST appear here — the validator fails naming any gap, both directions. As
 * the §A8 catalog grows to ~500, a new item adds one row here and one band:
 *   - 'ch1'…'ch10' = a region's own gear/food/cures/quest goods (where EARNED,
 *     not where the wielder later joins — the cage's STARTING FIVE is ch1)
 *   - 'cross'      = the cross-world chains (the deli Family Basket; the §A10
 *     Lost-&-Found of Impossible Sizes)
 * Early line-openers sit in their FUTURE region's band: Milo's first gun is
 * ch3 (England), Dorin's first beads + Buni's Feast Basket are ch9 (Romania).
 */
const ITEM_BAND: Record<string, ItemBand> = {
  // ── Ch.1 USA (Otterbrook / Brickton) — the two shipped chapters' home gear
  cracked_bat: 'ch1', tball_bat: 'ch1', hand_me_down_pan: 'ch1',
  corn_dog: 'ch1', pbj: 'ch1', lemonade: 'ch1', salt_shaker: 'ch1',
  star_cola: 'ch1', glints_spark: 'ch1', star_locket: 'ch1',
  lucky_collar: 'ch1', fresh_stamps: 'ch1', sugar_bag: 'ch1', lemon_crate: 'ch1',
  lemonade_jug: 'ch1', champion_jacket: 'ch1', walkers_charm: 'ch1', basket_basic: 'ch1',
  // the Brickton Classic's first-title prize (THE STARTING FIVE arms) is won in Ch.1
  cage_sweatband: 'ch1', victory_scrunchie: 'ch1', shooters_sleeve: 'ch1',
  iron_wristguard: 'ch1', minister_ribbon: 'ch1',
  // ── Ch.2 South America (Puerto Sol / Valle Dorado)
  alfajor: 'ch2', aloe_leaf: 'ch2', hanky: 'ch2', sandlot_slugger: 'ch2',
  copper_pan: 'ch2', wool_poncho: 'ch2', captains_button: 'ch2', tin_sun_pendant: 'ch2',
  camera: 'ch2', camera_flash: 'ch2',
  // the Costa Estrella Invitational's first-title prize (THE SUNDAY SET) is South America
  sunday_visor: 'ch2', sunday_glove: 'ch2', lucky_tee: 'ch2', caddys_marker: 'ch2',
  // ── line-openers banded to the region they're EARNED in (defined early)
  pellet_popper: 'ch3', // Milo's first air rifle — England
  cedar_beads: 'ch9',   // Dorin's first beads — Romania
  basket_feast: 'ch9',  // Buni's Feast Basket recipe — Romania
  // ── cross-world: the deli Family Basket crafts in every region
  basket_family: 'cross',
};

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
      text: 'It hums when the Embers sing. 1/10th of a Homesong lives inside.',
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
    /* ---- S12 / S15h: THE STARTING FIVE — the Brickton Classic's first-title
       prize, §A8's first 'arms' gear (one piece per hero, wielder-tagged;
       battle + STATUS read them through heroSpeed/heroGuts). ADR-048 added the
       fifth (Pippa's Minister's Ribbon) ---- */
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
    // S15h (ADR-048): Pippa's STARTING FIVE arms piece. §A8 names it "Luck+6",
    // but the arms slot reads Speed/Guts (luck rides charms — ADR-037); the
    // tiny tactician is quick, so the Ribbon carries Speed. Her canon Luck+6
    // belongs to her SUNDAY SET charm (unshipped — the links set awaits its 5th).
    I({
      id: 'minister_ribbon',
      name: "Minister's Ribbon",
      kind: 'arms',
      speed: 6,
      wielder: 'pippa',
      usableInBattle: false,
      price: 0,
      text: 'The sash of the Foreign Minister of Being Taken Seriously. Wear it and the room listens. Speed +6.',
    }),
    /* ================= S14 — CHAPTER 2 (§A8 South America) =================
     * The refresh curve: Jay's Sandlot Slugger and Mia's Copper Pan priced so
     * a full regional refresh ≈ two chapters of battle income (§A9 — choices
     * hurt a little, like 1995). Regional food, the §A8 canon cures the Ch.2
     * roster makes matter, and the §A4.5 PICNIC BASKETS. */
    I({
      id: 'alfajor',
      name: 'Alfajor',
      kind: 'food',
      heal: 60,
      usableInBattle: true,
      price: 14,
      text: 'Two cookies, one secret. The secret is dulce de leche. Recovers about 60 HP.',
    }),
    I({
      id: 'aloe_leaf',
      name: 'Aloe Leaf',
      kind: 'cure',
      cures: ['sunburn'],
      usableInBattle: true,
      price: 7,
      text: 'Snaps cleanly and means well. Cures Sunburn.',
    }),
    I({
      id: 'hanky',
      name: 'Hanky',
      kind: 'cure',
      cures: ['crying'],
      usableInBattle: true,
      price: 6,
      text: 'Embroidered with somebody else\'s initials. Cures Crying.',
    }),
    I({
      id: 'sandlot_slugger',
      name: 'Sandlot Slugger',
      kind: 'weapon',
      offense: 18,
      wielder: 'rex',
      usableInBattle: false,
      price: 185,
      text: 'Sanded by forty summers of somebody\'s older brothers. It remembers every game.',
    }),
    I({
      id: 'copper_pan',
      name: 'Copper Pan',
      kind: 'weapon',
      offense: 15,
      wielder: 'faye',
      usableInBattle: false,
      price: 164,
      text: 'Conducts heat, light, and consequences beautifully.',
    }),
    I({
      id: 'wool_poncho',
      name: 'Wool Poncho',
      kind: 'armor',
      defense: 12,
      usableInBattle: false,
      price: 0,
      text: 'Six llamas contributed. One contributed reluctantly. Defense +12.',
    }),
    /* ---- S15i Task 3 (ADR-058) — Movement 4 quest rewards ---- */
    I({
      id: 'walkers_charm',
      name: "Walker's Charm",
      kind: 'charm',
      luck: 6,
      usableInBattle: false,
      price: 0,
      text: 'A pressed wildflower under glass, signed into the Register. You notice things now. Luck +6.',
    }),
    I({
      id: 'captains_button',
      name: "Captain's Button",
      kind: 'charm',
      luck: 7,
      usableInBattle: false,
      price: 0,
      text: 'Brass, off a coat folded on a piano. It wants to go back to sea. Luck +7.',
    }),
    I({
      id: 'tin_sun_pendant',
      name: 'Tin Sun Pendant',
      kind: 'charm',
      luck: 5,
      usableInBattle: false,
      price: 110,
      text: 'Hammered tin, grinning honestly. The real sun approves. Luck +5.',
    }),
    /* ---- §A4.5 PICNIC BASKETS (Bible Prompt 23): table-only use ---- */
    I({
      id: 'basket_basic',
      name: 'Picnic Basket',
      kind: 'basket',
      usableInBattle: false,
      price: 44,
      text: 'Sandwiches, a thermos, one checkered blanket. Works only where picnics work.',
    }),
    I({
      id: 'basket_family',
      name: 'Family Basket',
      kind: 'basket',
      usableInBattle: false,
      price: 0,
      text: 'Three regional dishes and a deli\'s whole heart, packed tight. Find a table.',
    }),
    I({
      id: 'basket_feast',
      name: 'Feast Basket',
      kind: 'basket',
      usableInBattle: false,
      price: 0,
      text: 'Buni\'s recipe. The lid barely closes. Whoever eats this picnic cannot stay down.',
    }),
    /* ---- §A10 #6 — the museum quest's tools ---- */
    I({
      id: 'camera',
      name: 'Camera',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'The curator\'s loaner. The strap says ALMOST-GOLD WING in marker.',
    }),
    I({
      id: 'camera_flash',
      name: 'Camera Flash',
      kind: 'battle',
      status: 'crying',
      reusable: true,
      usableInBattle: true,
      price: 0,
      text: 'Detaches from the camera. Blinds the whole room into tears. Reusable — flashes are forever.',
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
  ].map((i) => [i.id, { ...i, band: ITEM_BAND[i.id] }]),
);
