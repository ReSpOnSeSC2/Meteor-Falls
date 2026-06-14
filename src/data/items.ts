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
  // S17 M18 (ADR-063) — THE AMERICAS CATALOG, Ch.1 USA pour: foods, drinks,
  // cures + the revival floor, the first tonic, battle goods, a valuable, the
  // hat-ladder head, the weapon sidegrades, and THE PORCH SET (the coffee-can
  // treasures a kid hoards on a summer porch).
  grilled_cheese: 'ch1', apple_pie_slice: 'ch1', choco_comet_bar: 'ch1',
  bug_juice: 'ch1', diet_star_cola: 'ch1',
  moms_voice_tape: 'ch1', second_wind: 'ch1', sudden_guts_pill: 'ch1',
  bug_zapper: 'ch1', spare_hubcap: 'ch1', otterbrook_cap: 'ch1',
  foam_finger: 'ch1', wiffle_bat: 'ch1', nonstick_pan: 'ch1',
  firefly_jar: 'ch1', wind_chime_charm: 'ch1', whittled_whistle: 'ch1',
  bottle_cap_medallion: 'ch1', lucky_acorn: 'ch1',
  // ── Ch.2 South America (Puerto Sol / Valle Dorado)
  alfajor: 'ch2', aloe_leaf: 'ch2', hanky: 'ch2', sandlot_slugger: 'ch2',
  copper_pan: 'ch2', wool_poncho: 'ch2', captains_button: 'ch2', tin_sun_pendant: 'ch2',
  camera: 'ch2', camera_flash: 'ch2',
  // the Costa Estrella Invitational's first-title prize (THE SUNDAY SET) is South America
  sunday_visor: 'ch2', sunday_glove: 'ch2', lucky_tee: 'ch2', caddys_marker: 'ch2',
  // S17 M18 (ADR-063) — THE AMERICAS CATALOG, Ch.2 South America pour: Andean
  // clay/dulce/jungle foods, mate + jungle fizz, the next revival rung, a tonic,
  // the gold-idol valuables, the chullo/cushma armor, generic arms, the banana-
  // boat keys, and THE MERCADO SET (the Puerto Sol market stalls).
  empanada: 'ch2', ceviche: 'ch2', choripan: 'ch2', tres_leches: 'ch2',
  mango: 'ch2', arepa: 'ch2', humita: 'ch2', chicha_morada: 'ch2',
  mate_gourd: 'ch2', jungle_fizz: 'ch2',
  guardian_angel_feather: 'ch2', unknot_drops: 'ch2', speed_demon_soda: 'ch2',
  fools_gold_idol: 'ch2', emerald: 'ch2', gold_doubloon: 'ch2',
  chullo: 'ch2', cushma: 'ch2', alpaca_vest: 'ch2',
  woven_wristlet: 'ch2', climbing_gloves: 'ch2',
  banana_boat_ticket: 'ch2', wish_token: 'ch2',
  friendship_bracelet: 'ch2', evil_eye_bead: 'ch2', brass_gear_charm: 'ch2',
  tin_milagro: 'ch2', jade_frog: 'ch2',
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
    /* ================= S17 M18 (ADR-063) — THE AMERICAS CATALOG ================
     * The first real POUR. Ch.1 (USA, summer '95) and Ch.2 (South America) each
     * grow toward the §A8 ~40/region target — region-true (§A11.7), priced to §A9
     * (a full refresh ≈ two chapters of income), every face forged distinct
     * (ADR-062) or hand-drawn for a signature. Pure data where the forge allows.
     * ───────────────────────── Ch.1 USA — Otterbrook / Brickton ───────────── */
    // — foods (the forge; warm suburban Americana) —
    I({
      id: 'grilled_cheese',
      name: 'Grilled Cheese',
      kind: 'food',
      heal: 28,
      usableInBattle: true,
      price: 7,
      text: 'Cut on the diagonal, which a parent will tell you tastes better. They are right. ~28 HP.',
    }),
    I({
      id: 'apple_pie_slice',
      name: 'Apple Pie Slice',
      kind: 'food',
      heal: 45,
      usableInBattle: true,
      price: 12,
      text: "Mom's, allegedly. Still warm, somehow, three towns from home. Recovers about 45 HP.",
    }),
    I({
      id: 'choco_comet_bar',
      name: 'Choco Comet Bar',
      kind: 'food',
      heal: 35,
      usableInBattle: true,
      price: 10,
      text: 'A candy bar shaped like the thing that ruined everything. Tastes like nougat. ~35 HP.',
    }),
    // — PP drinks (the forge; the Star Cola family widens) —
    I({
      id: 'bug_juice',
      name: 'Bug Juice',
      kind: 'pp',
      ppHeal: 10,
      usableInBattle: true,
      price: 7,
      text: 'Summer-camp blue. Possibly a crayon, dissolved with intent. Restores about 10 PP.',
    }),
    I({
      id: 'diet_star_cola',
      name: 'Diet Star Cola',
      kind: 'pp',
      ppHeal: 14,
      usableInBattle: true,
      price: 11,
      text: 'All the cosmos, none of the sugar. The burp comes out a quieter chord. ~14 PP.',
    }),
    // — cures + the §A4.12 REVIVAL LINE floor (the forge) —
    I({
      id: 'moms_voice_tape',
      name: "Mom's Voice Tape",
      kind: 'cure',
      cures: ['homesick'],
      usableInBattle: true,
      price: 24,
      text: "Side A: \"Did you eat?\" Side B: more of that. Cures Homesickness when {rex} plays it back.",
    }),
    I({
      id: 'second_wind',
      name: 'Second Wind',
      kind: 'cure',
      heal: 30,
      cures: ['down'],
      usableInBattle: true,
      price: 70,
      text: 'You were down. Then you got that one big breath. Stands a fallen hero up at a sliver.',
    }),
    // — the movement's TONIC proof (§A4.12 — permanent, dear, quest-worthy) —
    I({
      id: 'sudden_guts_pill',
      name: 'Sudden Guts Pill',
      kind: 'tonic',
      boost: { stat: 'guts', amount: 4 },
      usableInBattle: false,
      price: 280,
      text: 'Swallow your fear. Literally. Whoever takes it keeps the nerve — Guts up by 4, for good.',
    }),
    // — battle items (thrown goods; Milo's Bottle-Rocket ABILITY tiers stay separate) —
    I({
      id: 'bug_zapper',
      name: 'Bug Zapper',
      kind: 'battle',
      power: 34,
      usableInBattle: true,
      price: 22,
      text: 'The very model that got Glint mid-sentence. Brutal on anything with too many legs.',
    }),
    // — a valuable (sell-fodder with a whole man's name on it) —
    I({
      id: 'spare_hubcap',
      name: 'Spare Hubcap',
      kind: 'valuable',
      usableInBattle: false,
      price: 30,
      text: "'72 Buick. Worth more to a man named Earl than to anyone else alive. Earl is not here.",
    }),
    // — the head of the §A8 HAT LADDER (armor 'body' slot) —
    I({
      id: 'otterbrook_cap',
      name: 'Otterbrook Cap',
      kind: 'armor',
      defense: 5,
      usableInBattle: false,
      price: 40,
      text: 'Adjustable-back, foam-front, OTTERS in felt. The brim has seen things. Defense +5.',
    }),
    // — weapon SIDEGRADES (bespoke; reuse drawBatIcon/drawPanIcon — §A8 lines are
    //   personal, so each carries a wielder and sits on WEAPON_LADDER[ch1]) —
    I({
      id: 'foam_finger',
      name: 'Foam Finger #1',
      kind: 'weapon',
      offense: 1,
      wielder: 'rex',
      bonus: { luck: 8 },
      usableInBattle: false,
      price: 120,
      text: "You're not hitting anything with this. But you BELIEVE you are. Offense +1, Luck +8.",
    }),
    I({
      id: 'wiffle_bat',
      name: 'Wiffle Bat',
      kind: 'weapon',
      offense: 2,
      wielder: 'rex',
      usableInBattle: false,
      price: 30,
      text: 'Hollow, holed, and weightless. The SMAAASH it makes is mostly a polite TOK.',
    }),
    I({
      id: 'nonstick_pan',
      name: 'Nonstick Pan',
      kind: 'weapon',
      offense: 13,
      wielder: 'faye',
      usableInBattle: false,
      price: 130,
      text: 'Eggs slide right off. So do consequences. Mia finds this deeply suspicious.',
    }),
    // — THE PORCH SET (bespoke charms; the coffee-can treasures of a summer
    //   porch — a title, not stock, so price 0; luck primary, one sweet rider) —
    I({
      id: 'firefly_jar',
      name: 'Firefly Jar',
      kind: 'charm',
      luck: 6,
      vibe: 3,
      wielder: 'rex',
      usableInBattle: false,
      price: 0,
      text: 'Punched the lid yourself, summer of \'95. One light still blinks in there. It remembers Glint. Luck +6.',
    }),
    I({
      id: 'wind_chime_charm',
      name: 'Wind-Chime Charm',
      kind: 'charm',
      luck: 7,
      wielder: 'faye',
      usableInBattle: false,
      price: 0,
      text: 'Three little pipes off the back porch. They ring when good news is coming, Mia says. Luck +7.',
    }),
    I({
      id: 'whittled_whistle',
      name: 'Whittled Whistle',
      kind: 'charm',
      luck: 6,
      wielder: 'milo',
      usableInBattle: false,
      price: 0,
      text: 'Carved one rainy afternoon with a pocketknife and a tongue stuck out in concentration. It even works. Luck +6.',
    }),
    I({
      id: 'bottle_cap_medallion',
      name: 'Bottle-Cap Medallion',
      kind: 'charm',
      luck: 6,
      wielder: 'pippa',
      usableInBattle: false,
      price: 0,
      text: 'A root-beer cap hammered flat and strung on twine. Pippa wears it like an order of merit. Luck +6.',
    }),
    I({
      id: 'lucky_acorn',
      name: 'Lucky Acorn',
      kind: 'charm',
      luck: 7,
      wielder: 'dorin',
      usableInBattle: false,
      price: 0,
      text: 'Cap still on. You kept it because it looked like a tiny monk. Dorin agrees, gravely. Luck +7.',
    }),
    /* ──────────────────── Ch.2 South America — Puerto Sol / Valle Dorado ────── */
    // — foods (the forge; Andean clay, dulce, jungle) —
    I({
      id: 'empanada',
      name: 'Empanada',
      kind: 'food',
      heal: 50,
      usableInBattle: true,
      price: 12,
      text: "The fold is a promise you can't verify until you bite. So far, kept. Recovers about 50 HP.",
    }),
    I({
      id: 'ceviche',
      name: 'Ceviche',
      kind: 'food',
      heal: 65,
      usableInBattle: true,
      price: 18,
      text: 'Cooked by lime alone, which the fish took surprisingly well. Bracing. Recovers about 65 HP.',
    }),
    I({
      id: 'choripan',
      name: 'Choripán',
      kind: 'food',
      heal: 55,
      usableInBattle: true,
      price: 14,
      text: 'Sausage, bread, a slick of chimichurri, no further questions. Recovers about 55 HP.',
    }),
    I({
      id: 'tres_leches',
      name: 'Tres Leches',
      kind: 'food',
      heal: 70,
      usableInBattle: true,
      price: 20,
      text: 'Three milks soaked all the way through. Eat it over a plate; it weeps a little. ~70 HP.',
    }),
    I({
      id: 'mango',
      name: 'Mango',
      kind: 'food',
      heal: 40,
      usableInBattle: true,
      price: 8,
      text: 'So ripe it argues with your hands. Worth the mess every single time. Recovers about 40 HP.',
    }),
    I({
      id: 'arepa',
      name: 'Arepa',
      kind: 'food',
      heal: 48,
      usableInBattle: true,
      price: 11,
      text: 'A warm corn pocket of whatever the morning had. Today: cheese. Recovers about 48 HP.',
    }),
    I({
      id: 'humita',
      name: 'Humita',
      kind: 'food',
      heal: 52,
      usableInBattle: true,
      price: 13,
      text: 'Sweet ground corn steamed in its own husk. You unwrap it like a small present. ~52 HP.',
    }),
    I({
      id: 'chicha_morada',
      name: 'Chicha Morada',
      kind: 'food',
      heal: 26,
      usableInBattle: true,
      price: 6,
      text: 'Purple corn boiled with pineapple and clove. Purple as a bruise, sweeter than one. ~26 HP.',
    }),
    // — PP drinks (the forge) —
    I({
      id: 'mate_gourd',
      name: 'Mate Gourd',
      kind: 'pp',
      ppHeal: 14,
      usableInBattle: true,
      price: 12,
      text: 'Shared clockwise, passed full, and you NEVER stir the bombilla. Restores about 14 PP.',
    }),
    I({
      id: 'jungle_fizz',
      name: 'Jungle Fizz',
      kind: 'pp',
      ppHeal: 11,
      usableInBattle: true,
      price: 9,
      text: 'A green bottle of something carbonated and faintly leafy. The cap fights you. ~11 PP.',
    }),
    // — cures + the next §A4.12 REVIVAL rung (above Second Wind / Glint's Spark) —
    I({
      id: 'guardian_angel_feather',
      name: 'Guardian-Angel Feather',
      kind: 'cure',
      heal: 200,
      cures: ['down'],
      usableInBattle: true,
      price: 220,
      text: 'It fell from no bird anyone could name. Brings a fallen friend most of the way home.',
    }),
    I({
      id: 'unknot_drops',
      name: 'Unknot Drops',
      kind: 'cure',
      cures: ['paralyzed'],
      usableInBattle: true,
      price: 16,
      text: 'Two drops on the tongue and the knots in your arms let go all at once. Cures Paralysis.',
    }),
    // — a TONIC (rare market vendor; permanent Speed) —
    I({
      id: 'speed_demon_soda',
      name: 'Speed-Demon Soda',
      kind: 'tonic',
      boost: { stat: 'speed', amount: 3 },
      usableInBattle: false,
      price: 300,
      text: 'The label is just a red blur with teeth. Whoever drinks it keeps the wheels — Speed up by 3.',
    }),
    // — valuables (the gold idol's whole tragedy lives here) —
    I({
      id: 'fools_gold_idol',
      name: "Fool's-Gold Idol",
      kind: 'valuable',
      usableInBattle: false,
      price: 90,
      text: "It granted a wish once. The wish was 'be quiet,' and the village obliged. Pyrite, of course.",
    }),
    I({
      id: 'emerald',
      name: 'Emerald',
      kind: 'valuable',
      usableInBattle: false,
      price: 160,
      text: 'Green enough to make the jungle jealous. A jeweler in Puerto Sol will weep, then lowball you.',
    }),
    I({
      id: 'gold_doubloon',
      name: 'Gold Doubloon',
      kind: 'valuable',
      usableInBattle: false,
      price: 80,
      text: 'Off a wreck, off a captain, off a story nobody finished. Real gold, this time. Bite it.',
    }),
    // — armor (the chullo heads Ch.2's slot of the §A8 hat/garment ladder) —
    I({
      id: 'chullo',
      name: 'Chullo',
      kind: 'armor',
      defense: 6,
      usableInBattle: false,
      price: 48,
      text: 'Earflaps down, pompom up. The pompom is non-negotiable. Defense +6.',
    }),
    I({
      id: 'cushma',
      name: 'Cushma',
      kind: 'armor',
      defense: 14,
      usableInBattle: false,
      price: 175,
      text: 'A woven tunic dyed with achiote and river clay. It has outlasted three owners. Defense +14.',
    }),
    I({
      id: 'alpaca_vest',
      name: 'Alpaca Vest',
      kind: 'armor',
      defense: 10,
      usableInBattle: false,
      price: 95,
      text: 'Warmer than wool and twice as smug about it. The alpaca is fine; ask anyone. Defense +10.',
    }),
    // — generic ARMS (un-tagged, so no SET — anyone can wear them) —
    I({
      id: 'woven_wristlet',
      name: 'Woven Wristlet',
      kind: 'arms',
      speed: 4,
      usableInBattle: false,
      price: 60,
      text: 'A band of bright market thread, knotted tight for luck and looser for speed. Speed +4.',
    }),
    I({
      id: 'climbing_gloves',
      name: 'Climbing Gloves',
      kind: 'arms',
      guts: 5,
      usableInBattle: false,
      price: 70,
      text: 'Sticky-palmed, chalk-dusted, made for the cliff path to Valle Dorado. Guts +5.',
    }),
    // — keys (ordinary §A8 keys ride the forge; not story objects) —
    I({
      id: 'banana_boat_ticket',
      name: 'Banana Boat Ticket',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'One passage up the coast on the cargo ship. Smells of sunscreen and very ripe fruit.',
    }),
    I({
      id: 'wish_token',
      name: 'Wish Token',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: "Drop it in the idol's bowl and make a wish you can live with. The last village couldn't.",
    }),
    // — THE MERCADO SET (bespoke charms; the Puerto Sol market stalls — a title,
    //   not stock, so price 0; luck primary) —
    I({
      id: 'friendship_bracelet',
      name: 'Friendship Bracelet',
      kind: 'charm',
      luck: 6,
      wielder: 'rex',
      usableInBattle: false,
      price: 0,
      text: 'Knotted in three colors by a kid at a stall who would not take money for it. Luck +6.',
    }),
    I({
      id: 'evil_eye_bead',
      name: 'Evil-Eye Bead',
      kind: 'charm',
      luck: 7,
      wielder: 'faye',
      usableInBattle: false,
      price: 0,
      text: 'A blue glass eye against mal de ojo. It stares down anything that wishes Mia ill. Luck +7.',
    }),
    I({
      id: 'brass_gear_charm',
      name: 'Brass Gear Charm',
      kind: 'charm',
      luck: 6,
      wielder: 'milo',
      usableInBattle: false,
      price: 0,
      text: 'Salvaged off a dead clock in the market. Milo cleaned every tooth. It turns nothing, perfectly. Luck +6.',
    }),
    I({
      id: 'tin_milagro',
      name: 'Tin Milagro',
      kind: 'charm',
      luck: 6,
      wielder: 'pippa',
      usableInBattle: false,
      price: 0,
      text: 'A tiny stamped-tin charm of a thing you hope mends. Pippa pinned hers on official business. Luck +6.',
    }),
    I({
      id: 'jade_frog',
      name: 'Jade Frog',
      kind: 'charm',
      luck: 7,
      wielder: 'dorin',
      usableInBattle: false,
      price: 0,
      text: 'A green stone frog, mid-leap, going nowhere. Dorin finds its patience instructive. Luck +7.',
    }),
  ].map((i) => [i.id, { ...i, band: ITEM_BAND[i.id] }]),
);

/**
 * S17 M18 (ADR-063) — the two AMERICAS hero-signature charm SETS, the emotional
 * cousins of THE STARTING FIVE / THE SUNDAY SET. Five hero-tagged charm pieces
 * each (luck primary; a title, price 0). Defined beside the literals so the
 * validator's SET_REGISTRY pins them both directions, exactly like STARTING_FIVE
 * (hoops.ts) and SUNDAY_SET (links.ts).
 */
export const PORCH_SET: Record<string, string> = {
  rex: 'firefly_jar',
  faye: 'wind_chime_charm',
  milo: 'whittled_whistle',
  pippa: 'bottle_cap_medallion',
  dorin: 'lucky_acorn',
};

export const MERCADO_SET: Record<string, string> = {
  rex: 'friendship_bracelet',
  faye: 'evil_eye_bead',
  milo: 'brass_gear_charm',
  pippa: 'tin_milagro',
  dorin: 'jade_frog',
};
