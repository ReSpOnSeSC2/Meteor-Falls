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
  // ── Ch.3 ENGLAND (Foggybottom-on-Tyne / Wintermoor Academy / The Old Stones)
  // S17 M19 (ADR-064) — THE OLD-WORLD CATALOG: Milo's chapter. The gun ladder,
  // the gizmo/repair line, tea-as-PP, canteen stodge, the Cricket Cap, academic
  // gear, library/groundskeeper goods. Damp-grey, brass, tea, and rules with shoes.
  spud_gun: 'ch3', double_barrel_sparker: 'ch3', gauss_lobber: 'ch3', cricket_bat: 'ch3',
  builders_tea: 'ch3', earl_grey: 'ch3', school_cocoa: 'ch3',
  scone_clotted_cream: 'ch3', crumpet: 'ch3', fish_and_chips: 'ch3', bangers_and_mash: 'ch3',
  canteen_stodge: 'ch3', sticky_toffee_pudding: 'ch3', cucumber_sandwich: 'ch3', pork_pie: 'ch3',
  treacle_tart: 'ch3', marmite_toast: 'ch3', eccles_cake: 'ch3',
  honey_lozenge: 'ch3', eye_drops: 'ch3',
  brain_food_lunch: 'ch3', iron_tonic: 'ch3',
  cricket_cap: 'ch3', school_blazer: 'ch3', tweed_waistcoat: 'ch3', oilcloth_mac: 'ch3',
  fingerless_mitts: 'ch3', cricket_pads: 'ch3',
  lucky_conker: 'ch3', house_pin: 'ch3', brass_compass: 'ch3', rain_charm: 'ch3',
  spark_coil: 'ch3', cog_grenade: 'ch3', clockwork_sparrow: 'ch3',
  broken_gizmo: 'ch3', first_edition: 'ch3', commemorative_tin: 'ch3',
  lucilles_propeller: 'ch3', library_card: 'ch3', thermos: 'ch3',
  // ── Ch.4 NORWAY (Kvisthavn / Bootstep Moor / Lilleby / The Sleeper's Spine)
  // S17 M19 (ADR-064): SCALE is the joke. Fishing-hamlet foods, the Fur-Lined Hood,
  // THE FIRST RESIST PENDANTS (the Cool Charm vs cold — resist DATA, not yet bound),
  // the Firecracker String (the Whisperwig's NOISE), and the Giant's Banknote.
  // Cold-blue, birch, deep pine. (Akutaq stays Alaskan per §A8 — region-true §A11.7.)
  frozen_cod: 'ch4', lefse_griddle: 'ch4',
  cloudberry_cordial: 'ch4', birch_sap: 'ch4', gjende_coffee: 'ch4',
  brunost: 'ch4', fiskeboller: 'ch4', lutefisk: 'ch4', lefse: 'ch4', multekrem: 'ch4',
  rommegrot: 'ch4', farikal: 'ch4', knekkebrod: 'ch4', dog_sized_berry: 'ch4',
  smoked_salmon: 'ch4', vafler: 'ch4', pickled_herring: 'ch4', kransekake: 'ch4',
  salve_of_arnica: 'ch4', smelling_salts: 'ch4',
  growth_spurt_milk: 'ch4', cod_liver_oil: 'ch4',
  fur_lined_hood: 'ch4', wool_sweater: 'ch4', oilskin_slicker: 'ch4', troll_hide_vest: 'ch4',
  reindeer_mittens: 'ch4', rope_bracer: 'ch4',
  cool_charm: 'ch4', troll_cross: 'ch4', amber_drop: 'ch4', vegvisir_charm: 'ch4',
  firecracker_string: 'ch4', snowball_special: 'ch4',
  giants_banknote: 'ch4', amber_chunk: 'ch4', silver_hoard: 'ch4', stockfish_bundle: 'ch4',
  brass_ships_bell: 'ch4',
  sigrids_monocle: 'ch4', halvors_letter: 'ch4',
  // ── Ch.5 MINIMUS (Minimus Major / Procession Way / Ducal Crown)
  // S17 M19 (ADR-064): TINY is the joke. PIPPA'S KIT LADDER, tiny-everything food/
  // charms, the Paper Crown, diplomatic gear (Luck/morale riders), the census/duchy
  // valuables, and her scale-anchor key items (Royal Thimble, Big-Little Lens).
  // Jewel-box velvets — purple, magenta, gold. Items tiny in fiction, normal as bag.
  stamp_sling: 'ch5', needle_saber: 'ch5', thimble_bell: 'ch5', royal_red_pen: 'ch5',
  acorn_cup_tea: 'ch5', nectar_thimble: 'ch5', dewdrop_cordial: 'ch5', mint_julep_drop: 'ch5',
  crumb_loaf: 'ch5', petit_four: 'ch5', seed_pie: 'ch5', honey_drop: 'ch5', ribbon_candy: 'ch5',
  royal_tartlet: 'ch5', cheese_sliver: 'ch5', teaspoon_stew: 'ch5', marzipan_pig: 'ch5', sugared_violet: 'ch5',
  powder_wig_dust: 'ch5', smelling_bouquet: 'ch5',
  lucky_penny_tonic: 'ch5', charged_battery: 'ch5',
  paper_crown: 'ch5', velvet_doublet: 'ch5', herald_tabard: 'ch5', ermine_cape: 'ch5',
  lace_cuffs: 'ch5', signet_bracer: 'ch5',
  duchy_seal_charm: 'ch5', morale_medal: 'ch5', lens_charm: 'ch5', census_quill_charm: 'ch5',
  tin_soldier: 'ch5', confetti_cannon: 'ch5',
  crown_jewel_chip: 'ch5', census_ledger: 'ch5', royal_doubloon_tiny: 'ch5', gilt_thimble_collection: 'ch5',
  royal_thimble: 'ch5', big_little_lens: 'ch5', procession_pass: 'ch5',
  // ── cross-world: THE LOST & FOUND OF IMPOSSIBLE SIZES (§A10 cross-chain) — items
  // displaced by Norway/Minimus scale logic, to be returned across the world
  giant_button: 'cross', impossible_berry: 'cross', tiny_postcard: 'cross',
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
    /* ================= S17 M19 (ADR-064) — THE OLD-WORLD CATALOG ================
     * The second regional pour: Ch.3 England, Ch.4 Norway, Ch.5 Minimus, each
     * toward the §A8 ~40/region target. Region-true (§A11.7), priced to §A9 (the
     * chapters get richer climbing — Ch.3 > Ch.2), every face forged distinct
     * (ADR-062) or hand-drawn for a signature. The Old-World is UNLANDED, so this
     * is DATA + ICONS + the validator manifest only — no shops, maps, or quests.
     * ───────────────────── Ch.3 ENGLAND — Foggybottom / Wintermoor ──────────── */
    // — MILO'S GUN LADDER (§A8: Pellet Popper → Spud Gun → Double-Barrel Sparker
    //   → *Gauss Lobber*, the Headmaster Mainframe drop). Wielder-tagged, bespoke. —
    I({
      id: 'spud_gun',
      name: 'Spud Gun',
      kind: 'weapon',
      offense: 22,
      wielder: 'milo',
      usableInBattle: false,
      price: 240,
      text: 'Fires a cored King Edward at Mach embarrassing. Reload is just a potato and a prayer.',
    }),
    I({
      id: 'double_barrel_sparker',
      name: 'Double-Barrel Sparker',
      kind: 'weapon',
      offense: 32,
      wielder: 'milo',
      usableInBattle: false,
      price: 480,
      text: 'Two barrels, twice the spark, half the dignity. Milo insists the word for it is "elegant."',
    }),
    I({
      id: 'gauss_lobber',
      name: 'Gauss Lobber',
      kind: 'weapon',
      offense: 46,
      wielder: 'milo',
      usableInBattle: false,
      price: 0,
      text: "Pulled off the Mainframe's own coil rack. Lobs a magnetised slug and, faintly, a small apology.",
    }),
    // — a funny regional SIDEGRADE (Jay; England gave him a bat he can't referee) —
    I({
      id: 'cricket_bat',
      name: 'Cricket Bat',
      kind: 'weapon',
      offense: 17,
      wielder: 'rex',
      usableInBattle: false,
      price: 150,
      text: "Willow, linseed-oiled, and very LBW about it. Jay doesn't know the rules. Neither, it turns out, does England.",
    }),
    // — TEA AS PP (the Wintermoor/Foggybottom brews → PP_LINE[ch3]) —
    I({
      id: 'builders_tea',
      name: "Builder's Tea",
      kind: 'pp',
      ppHeal: 16,
      usableInBattle: true,
      price: 12,
      text: 'Strong enough to trot a mouse across. Two sugars, no debate. Restores about 16 PP.',
    }),
    I({
      id: 'earl_grey',
      name: 'Earl Grey',
      kind: 'pp',
      ppHeal: 14,
      usableInBattle: true,
      price: 14,
      text: 'Bergamot and good posture. Restores about 14 PP and a little dignity.',
    }),
    I({
      id: 'school_cocoa',
      name: 'School Cocoa',
      kind: 'pp',
      ppHeal: 12,
      usableInBattle: true,
      price: 8,
      text: "Wintermoor's canteen cocoa: more skin than chocolate, served too hot to refuse. ~12 PP.",
    }),
    // — foods (school fog, institutional stodge, and a proper tea) —
    I({
      id: 'scone_clotted_cream',
      name: 'Scone & Clotted Cream',
      kind: 'food',
      heal: 50,
      usableInBattle: true,
      price: 14,
      text: 'Jam first or cream first is a war with casualties. Recovers about 50 HP whichever side you take.',
    }),
    I({
      id: 'crumpet',
      name: 'Crumpet',
      kind: 'food',
      heal: 38,
      usableInBattle: true,
      price: 9,
      text: 'Toasted and buttered into every single hole. The holes are the entire point. ~38 HP.',
    }),
    I({
      id: 'fish_and_chips',
      name: 'Fish & Chips',
      kind: 'food',
      heal: 70,
      usableInBattle: true,
      price: 18,
      text: "Wrapped in yesterday's newspaper. Salt, vinegar, and a headline you can't quite read. ~70 HP.",
    }),
    I({
      id: 'bangers_and_mash',
      name: 'Bangers & Mash',
      kind: 'food',
      heal: 64,
      usableInBattle: true,
      price: 16,
      text: 'Sausages adrift in a mash sea under onion-gravy weather. Recovers about 64 HP.',
    }),
    I({
      id: 'canteen_stodge',
      name: 'Canteen Stodge',
      kind: 'food',
      heal: 30,
      usableInBattle: true,
      price: 5,
      text: "Wintermoor's mystery pudding. Grey, dense, and scientifically optimised for happiness. ~30 HP.",
    }),
    I({
      id: 'sticky_toffee_pudding',
      name: 'Sticky Toffee Pudding',
      kind: 'food',
      heal: 75,
      usableInBattle: true,
      price: 20,
      text: 'Date sponge drowned in toffee. The drowning is entirely consensual. Recovers about 75 HP.',
    }),
    I({
      id: 'cucumber_sandwich',
      name: 'Cucumber Sandwich',
      kind: 'food',
      heal: 26,
      usableInBattle: true,
      price: 8,
      text: 'Crusts off, cut in triangles, served with quiet judgement. Recovers about 26 HP.',
    }),
    I({
      id: 'pork_pie',
      name: 'Pork Pie',
      kind: 'food',
      heal: 48,
      usableInBattle: true,
      price: 12,
      text: 'Cold water crust around a layer of jelly nobody asked for. Recovers about 48 HP anyway.',
    }),
    I({
      id: 'treacle_tart',
      name: 'Treacle Tart',
      kind: 'food',
      heal: 60,
      usableInBattle: true,
      price: 15,
      text: 'Golden syrup and breadcrumbs, sweet enough to file a formal complaint about. ~60 HP.',
    }),
    I({
      id: 'marmite_toast',
      name: 'Marmite Toast',
      kind: 'food',
      heal: 22,
      usableInBattle: true,
      price: 5,
      text: 'You love it or the Hush took your tongue. Scraped on, never spread. ~22 HP.',
    }),
    I({
      id: 'eccles_cake',
      name: 'Eccles Cake',
      kind: 'food',
      heal: 44,
      usableInBattle: true,
      price: 11,
      text: 'Flaky pastry stuffed with currants — "dead flies," the canteen calls them, fondly. ~44 HP.',
    }),
    // — cures (the chapter's Hushed throat; chalk-dust tears) —
    I({
      id: 'honey_lozenge',
      name: 'Honey Lozenge',
      kind: 'cure',
      cures: ['hushed'],
      usableInBattle: true,
      price: 18,
      text: 'Soothes a Hushed throat back to speech. Tastes of menthol and the school matron.',
    }),
    I({
      id: 'eye_drops',
      name: 'Eye Drops',
      kind: 'cure',
      cures: ['crying'],
      usableInBattle: true,
      price: 10,
      text: 'Two drops and the chalk-dust tears clear right up. Cures Crying.',
    }),
    // — TONICS (an apothecary's bracing brown bottle; a supervised packed lunch) —
    I({
      id: 'iron_tonic',
      name: 'Iron Tonic',
      kind: 'tonic',
      boost: { stat: 'offense', amount: 3 },
      usableInBattle: false,
      price: 300,
      text: 'A chemist\'s brown bottle of something rusty and bracing. Offense up by 3, for keeps.',
    }),
    I({
      id: 'brain_food_lunch',
      name: 'Brain-Food Lunch',
      kind: 'tonic',
      boost: { stat: 'vibe', amount: 3 },
      usableInBattle: false,
      price: 320,
      text: 'A balanced packed lunch, eaten under supervision. Whoever finishes it thinks a little brighter — Vibe up by 3.',
    }),
    // — armor: the §A8 HAT LADDER rung (Cricket Cap) + the school/fog bodies —
    I({
      id: 'cricket_cap',
      name: 'Cricket Cap',
      kind: 'armor',
      defense: 8,
      usableInBattle: false,
      price: 55,
      text: 'Striped in house colours, peak forward, a half-size too small on purpose. Defense +8.',
    }),
    I({
      id: 'school_blazer',
      name: 'School Blazer',
      kind: 'armor',
      defense: 14,
      usableInBattle: false,
      price: 130,
      text: 'Wintermoor crest, three compulsory buttons, and a rule sewn into the lining. Defense +14.',
    }),
    I({
      id: 'tweed_waistcoat',
      name: 'Tweed Waistcoat',
      kind: 'armor',
      defense: 11,
      usableInBattle: false,
      price: 100,
      text: 'Foggybottom tweed that smells of pipe smoke and rain. Itches with authority. Defense +11.',
    }),
    I({
      id: 'oilcloth_mac',
      name: 'Oilcloth Mac',
      kind: 'armor',
      defense: 16,
      usableInBattle: false,
      price: 165,
      text: 'A long waxed raincoat built for machine-made fog. Beads off water and sarcasm alike. Defense +16.',
    }),
    // — generic ARMS (un-tagged; the forge draws the trinket) —
    I({
      id: 'fingerless_mitts',
      name: 'Fingerless Mitts',
      kind: 'arms',
      speed: 5,
      usableInBattle: false,
      price: 70,
      text: 'For taking notes in an unheated dorm. The fingertips freelance. Speed +5.',
    }),
    I({
      id: 'cricket_pads',
      name: 'Cricket Pads',
      kind: 'arms',
      guts: 7,
      usableInBattle: false,
      price: 90,
      text: 'Buckled shin guards that have stopped much harder things than nerves. Guts +7.',
    }),
    // — generic CHARMS (academic luck; un-tagged) —
    I({
      id: 'lucky_conker',
      name: 'Lucky Conker',
      kind: 'charm',
      luck: 7,
      usableInBattle: false,
      price: 60,
      text: 'A champion conker, baked hard and vinegared, strung on a bootlace. A proven sixer. Luck +7.',
    }),
    I({
      id: 'house_pin',
      name: 'House Pin',
      kind: 'charm',
      luck: 6,
      usableInBattle: false,
      price: 45,
      text: 'An enamel house badge, worn upside-down as a small and deniable rebellion. Luck +6.',
    }),
    I({
      id: 'brass_compass',
      name: 'Brass Compass',
      kind: 'charm',
      luck: 6,
      usableInBattle: false,
      price: 80,
      text: 'A pocket compass that points, with total confidence, to the tuck shop. Luck +6.',
    }),
    I({
      id: 'rain_charm',
      name: 'Rain Charm',
      kind: 'charm',
      luck: 6,
      usableInBattle: false,
      price: 50,
      text: 'A tiny tin umbrella on a clip. It has personally prevented zero rainfall. Luck +6.',
    }),
    // — THE GIZMO / REPAIR LINE (§A3 Milo's Repair): Broken Gizmos as sell-scrap
    //   Milo's eyes light up at, plus the working repaired gizmos as battle goods —
    I({
      id: 'spark_coil',
      name: 'Spark Coil',
      kind: 'battle',
      power: 44,
      usableInBattle: true,
      price: 30,
      text: 'A repaired ignition coil. Touch it to a foe and the whole room smells of ozone. ~44 damage.',
    }),
    I({
      id: 'cog_grenade',
      name: 'Cog Grenade',
      kind: 'battle',
      power: 50,
      usableInBattle: true,
      price: 36,
      text: 'Milo packed a dead pocket-watch with worse intentions. Throws shrapnel made of time. ~50 damage.',
    }),
    I({
      id: 'clockwork_sparrow',
      name: 'Clockwork Sparrow',
      kind: 'battle',
      power: 40,
      usableInBattle: true,
      price: 26,
      text: 'A wind-up bird Milo coaxed back to life. It dive-bombs once, then needs winding again. ~40 damage.',
    }),
    // — valuables (the Repair seed; the library; the groundskeeper's shelf) —
    I({
      id: 'broken_gizmo',
      name: 'Broken Gizmo',
      kind: 'valuable',
      usableInBattle: false,
      price: 12,
      text: 'Cogs, a cracked lens, half a dynamo. Scrap to anyone else. To Milo, a Friday night and a project.',
    }),
    I({
      id: 'first_edition',
      name: 'First Edition',
      kind: 'valuable',
      usableInBattle: false,
      price: 180,
      text: 'A library book three centuries overdue. The accrued fine could quietly fund a small war.',
    }),
    I({
      id: 'commemorative_tin',
      name: 'Commemorative Tin',
      kind: 'valuable',
      usableInBattle: false,
      price: 40,
      text: 'A royal-wedding biscuit tin. The biscuits left in 1981; the sentiment stayed on. Holds buttons now.',
    }),
    // — key items (§A8 Lucille's Spare Propeller; the library card; the thermos) —
    I({
      id: 'lucilles_propeller',
      name: "Lucille's Propeller",
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: "Uncle Bert's spare prop for the biplane Lucille. Mind the edges — she's particular about who touches her.",
    }),
    I({
      id: 'library_card',
      name: 'Library Card',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'Laminated, and good for free tea refills forever. The librarian made you sign for it in cursive.',
    }),
    I({
      id: 'thermos',
      name: 'Thermos',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: "A dented vacuum flask. Keeps the groundskeeper's brew hot and a hot tea is, of course, portable PP.",
    }),
    /* ───────────────── Ch.4 NORWAY — Kvisthavn / Bootstep Moor / Lilleby ───────
     * SCALE is the joke (§A6/§A11.7): a berry the size of a curling stone, a banknote
     * like a picnic blanket, milk that swells your max HP. Region-true fishing-hamlet
     * fare, the Fur-Lined Hood, and THE FIRST RESIST PENDANT — the Cool Charm vs cold
     * (resist DATA on charm/armor, summed by heroResist + shown in STATUS; the damage
     * binding waits for the chapter that lands, ADR-064). */
    // — funny regional SIDEGRADES (the moor armed Jay with a fish, Mia with a griddle) —
    I({
      id: 'frozen_cod',
      name: 'Frozen Cod',
      kind: 'weapon',
      offense: 28,
      wielder: 'rex',
      usableInBattle: false,
      price: 260,
      text: 'A fish so deeply frozen it legally qualifies as a bat. Thaws into dinner if you lose.',
    }),
    I({
      id: 'lefse_griddle',
      name: 'Lefse Griddle',
      kind: 'weapon',
      offense: 26,
      wielder: 'faye',
      usableInBattle: false,
      price: 240,
      text: 'A long iron griddle for flatbread. Mia warms to it instantly. It warms to absolutely everything.',
    }),
    // — PP (the moor's cold, sweet drinks) —
    I({
      id: 'cloudberry_cordial',
      name: 'Cloudberry Cordial',
      kind: 'pp',
      ppHeal: 18,
      usableInBattle: true,
      price: 16,
      text: 'Molte syrup cut with cold spring water. Tastes of the moor\'s whole short summer. ~18 PP.',
    }),
    I({
      id: 'birch_sap',
      name: 'Birch Sap',
      kind: 'pp',
      ppHeal: 15,
      usableInBattle: true,
      price: 12,
      text: 'Tapped straight from a birch in spring. Faintly sweet, faintly wooden, deeply Norwegian. ~15 PP.',
    }),
    I({
      id: 'gjende_coffee',
      name: 'Kettle Coffee',
      kind: 'pp',
      ppHeal: 14,
      usableInBattle: true,
      price: 9,
      text: 'Kokekaffe boiled over a fire, grounds and all, poured through your teeth. ~14 PP.',
    }),
    // — foods (fishing-hamlet fare; the scale gag where the fiction wants it) —
    I({
      id: 'brunost',
      name: 'Brunost',
      kind: 'food',
      heal: 55,
      usableInBattle: true,
      price: 12,
      text: 'Brown whey cheese, sweet as caramel, shaved thin with a special plane. Recovers about 55 HP.',
    }),
    I({
      id: 'fiskeboller',
      name: 'Fiskeboller',
      kind: 'food',
      heal: 60,
      usableInBattle: true,
      price: 14,
      text: "Pale fish balls in white sauce. Comforting if you don't think about it too hard. ~60 HP.",
    }),
    I({
      id: 'lutefisk',
      name: 'Lutefisk',
      kind: 'food',
      heal: 40,
      usableInBattle: true,
      price: 8,
      text: 'Cod cured in lye until it gives up entirely. An acquired courage. Recovers about 40 HP.',
    }),
    I({
      id: 'lefse',
      name: 'Lefse',
      kind: 'food',
      heal: 48,
      usableInBattle: true,
      price: 10,
      text: 'Soft potato flatbread, buttered, sugared, and rolled tight as a secret. ~48 HP.',
    }),
    I({
      id: 'multekrem',
      name: 'Multekrem',
      kind: 'food',
      heal: 80,
      usableInBattle: true,
      price: 20,
      text: 'Cloudberries folded into whipped cream. The whole brief moor-summer in a bowl. ~80 HP.',
    }),
    I({
      id: 'rommegrot',
      name: 'Rømmegrøt',
      kind: 'food',
      heal: 72,
      usableInBattle: true,
      price: 18,
      text: 'Sour-cream porridge under a slowly spreading pool of melted butter and cinnamon. ~72 HP.',
    }),
    I({
      id: 'farikal',
      name: 'Fårikål',
      kind: 'food',
      heal: 90,
      usableInBattle: true,
      price: 24,
      text: 'Mutton and cabbage stewed until October surrenders. Norway\'s whole heart in a pot. ~90 HP.',
    }),
    I({
      id: 'knekkebrod',
      name: 'Knekkebrød',
      kind: 'food',
      heal: 30,
      usableInBattle: true,
      price: 6,
      text: 'Crispbread you could shingle a roof with. Holds any topping, and your weight. ~30 HP.',
    }),
    I({
      id: 'dog_sized_berry',
      name: 'Dog-Sized Berry',
      kind: 'food',
      heal: 120,
      usableInBattle: true,
      price: 28,
      text: 'One cloudberry the size of a curling stone. It barely fits the bag; the game shrinks it out of mercy. ~120 HP.',
    }),
    I({
      id: 'smoked_salmon',
      name: 'Smoked Salmon',
      kind: 'food',
      heal: 66,
      usableInBattle: true,
      price: 17,
      text: 'Cold-smoked over juniper until it glows orange. Sliced so thin you can read through it. ~66 HP.',
    }),
    I({
      id: 'vafler',
      name: 'Heart Waffles',
      kind: 'food',
      heal: 46,
      usableInBattle: true,
      price: 11,
      text: 'Five soft hearts in a clover, with brunost and jam. Served by someone who is glad you came. ~46 HP.',
    }),
    I({
      id: 'pickled_herring',
      name: 'Pickled Herring',
      kind: 'food',
      heal: 34,
      usableInBattle: true,
      price: 7,
      text: 'In a sweet-sour brine with onion and bay. Breakfast, somehow, and also dignity. ~34 HP.',
    }),
    I({
      id: 'kransekake',
      name: 'Kransekake',
      kind: 'food',
      heal: 58,
      usableInBattle: true,
      price: 15,
      text: 'A tower of almond rings, stacked for every Norwegian occasion. You take three rings down. ~58 HP.',
    }),
    // — cures (the moor's gnats, the runaway needles) —
    I({
      id: 'salve_of_arnica',
      name: 'Arnica Salve',
      kind: 'cure',
      cures: ['paralyzed'],
      usableInBattle: true,
      price: 18,
      text: 'Mountain arnica rubbed into a stiff arm. The knot in your muscles lets go all at once. Cures Paralysis.',
    }),
    I({
      id: 'smelling_salts',
      name: 'Smelling Salts',
      kind: 'cure',
      cures: ['asleep'],
      usableInBattle: true,
      price: 16,
      text: 'A sharp sniff and you are awake, alert, and slightly offended. Cures Sleep.',
    }),
    // — TONICS (giant Lilleby milk for max HP; the morning cod-liver penance) —
    I({
      id: 'growth_spurt_milk',
      name: 'Growth-Spurt Milk',
      kind: 'tonic',
      boost: { stat: 'hp', amount: 20 },
      usableInBattle: false,
      price: 360,
      text: 'Goat\'s milk from a Lilleby goat the size of a barn. One glass and your max HP swells for good — +20.',
    }),
    I({
      id: 'cod_liver_oil',
      name: 'Cod-Liver Oil',
      kind: 'tonic',
      boost: { stat: 'defense', amount: 3 },
      usableInBattle: false,
      price: 320,
      text: 'A spoonful every morning, whether you like it (you do not). Toughens you for keeps — Defense up by 3.',
    }),
    // — armor: the §A8 HAT LADDER rung (Fur-Lined Hood, freeze-resist) + the bodies —
    I({
      id: 'fur_lined_hood',
      name: 'Fur-Lined Hood',
      kind: 'armor',
      defense: 16,
      resists: [{ element: 'freeze', pct: 20 }],
      usableInBattle: false,
      price: 180,
      text: 'Reindeer-fur trim pulled tight against the fjord wind. Defense +16, and the cold bites a fifth less.',
    }),
    I({
      id: 'wool_sweater',
      name: 'Lusekofte Sweater',
      kind: 'armor',
      defense: 14,
      usableInBattle: false,
      price: 140,
      text: 'Knit in a star-and-louse pattern only a grandmother remembers. Itchy, eternal, warm. Defense +14.',
    }),
    I({
      id: 'oilskin_slicker',
      name: 'Oilskin Slicker',
      kind: 'armor',
      defense: 18,
      usableInBattle: false,
      price: 200,
      text: 'Tarred canvas for a deck awash. Sheds the North Sea and most unsolicited opinions. Defense +18.',
    }),
    I({
      id: 'troll_hide_vest',
      name: 'Troll-Hide Vest',
      kind: 'armor',
      defense: 24,
      usableInBattle: false,
      price: 280,
      text: 'Tanned from something that used to be a hill. Heavy as a guilty conscience, twice as warm. Defense +24.',
    }),
    // — generic ARMS (un-tagged) —
    I({
      id: 'reindeer_mittens',
      name: 'Reindeer Mittens',
      kind: 'arms',
      guts: 6,
      usableInBattle: false,
      price: 90,
      text: 'Two mittens on a string threaded through the sleeves, so even a giant can\'t lose them. Guts +6.',
    }),
    I({
      id: 'rope_bracer',
      name: 'Rope Bracer',
      kind: 'arms',
      speed: 6,
      usableInBattle: false,
      price: 95,
      text: 'Tarred fishing line wound tight to the wrist. Salt-stiff, sea-quick. Speed +6.',
    }),
    // — THE FIRST RESIST PENDANTS (§A8/§A10 — the Cool Charm vs cold; resist DATA) —
    I({
      id: 'cool_charm',
      name: 'Cool Charm',
      kind: 'charm',
      luck: 6,
      resists: [{ element: 'freeze', pct: 25 }],
      usableInBattle: false,
      price: 160,
      text: 'A bead of glacier ice that never once melts. The cold knows its own and leaves you be. Luck +6.',
    }),
    I({
      id: 'troll_cross',
      name: 'Troll Cross',
      kind: 'charm',
      luck: 8,
      usableInBattle: false,
      price: 120,
      text: 'A twist of black iron the smith bent against bad luck. Trolls hate it; you, gratefully, take it. Luck +8.',
    }),
    I({
      id: 'amber_drop',
      name: 'Amber Drop',
      kind: 'charm',
      luck: 7,
      usableInBattle: false,
      price: 130,
      text: 'North Sea amber with a gnat caught mid-complaint inside. A million years of held patience. Luck +7.',
    }),
    I({
      id: 'vegvisir_charm',
      name: 'Vegvísir Charm',
      kind: 'charm',
      luck: 7,
      usableInBattle: false,
      price: 135,
      text: 'A runic compass-stave inked on birch bark. Bear it and you will not lose your way in foul weather. Luck +7.',
    }),
    // — battle goods (the Whisperwig's NOISE; a Bootstep snowball) —
    I({
      id: 'firecracker_string',
      name: 'Firecracker String',
      kind: 'battle',
      power: 36,
      usableInBattle: true,
      price: 24,
      text: 'A braided string of bangers. The NOISE flushes things out of holes — ask the Whisperwig. ~36 damage.',
    }),
    I({
      id: 'snowball_special',
      name: 'Snowball Special',
      kind: 'battle',
      power: 30,
      usableInBattle: true,
      price: 14,
      text: 'Packed hard around a small rock, which is cheating, which is precisely the point. ~30 damage.',
    }),
    // — valuables (the Giant's Banknote + the hamlet's grey-sea wealth) —
    I({
      id: 'giants_banknote',
      name: "Giant's Banknote",
      kind: 'valuable',
      usableInBattle: false,
      price: 200,
      text: 'A single note from Lilleby, the size of a picnic blanket. Worth a fortune; folds up like a duvet.',
    }),
    I({
      id: 'amber_chunk',
      name: 'Amber Chunk',
      kind: 'valuable',
      usableInBattle: false,
      price: 150,
      text: 'Raw North Sea amber, fist-sized and warm to the touch. A jeweler will halve your every hope.',
    }),
    I({
      id: 'silver_hoard',
      name: 'Hacksilver',
      kind: 'valuable',
      usableInBattle: false,
      price: 110,
      text: "A fistful of chopped silver, weighed not counted, dug out of somebody's long-buried bad idea.",
    }),
    I({
      id: 'stockfish_bundle',
      name: 'Stockfish Bundle',
      kind: 'valuable',
      usableInBattle: false,
      price: 70,
      text: 'Wind-dried cod, hard as oar-wood, bundled and bound. Trades for a fortune three countries south.',
    }),
    I({
      id: 'brass_ships_bell',
      name: "Ship's Bell",
      kind: 'valuable',
      usableInBattle: false,
      price: 100,
      text: "Off a trawler lost in '53. Still rings true in fog, which is most of why nobody will melt it down.",
    }),
    // — key items (§A8 Sigrid's Monocle, the reusable Focus; Halvor's huge letter) —
    I({
      id: 'sigrids_monocle',
      name: "Sigrid's Monocle",
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'Sigrid\'s reground lens, big as a pond at your scale. Hold it up and far things hold gloriously still.',
    }),
    I({
      id: 'halvors_letter',
      name: "Halvor's Letter",
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: "Halvor's love letter, one enormous page at a time. Forty years carried; the ink is somehow still shy.",
    }),
    /* ───────────────── Ch.5 MINIMUS — Minimus Major / Procession Way ──────────
     * TINY is the joke (§A6/§A11.7): a stamp is a sling, a thimble a bell, a penny
     * the duchy's gold reserve. Pippa's KIT LADDER joins here; the scale gag stays
     * readable through the Royal Thimble / Big-Little Lens framing — items are tiny
     * in the fiction, normal in the bag. Jewel-box velvets. */
    // — PIPPA'S KIT LADDER (§A8: Stamp Sling → Needle Saber → Thimble Bell →
    //   *Royal Red Pen*, the appointment top). Wielder 'pippa', class 'kit', bespoke. —
    I({
      id: 'stamp_sling',
      name: 'Stamp Sling',
      kind: 'weapon',
      offense: 24,
      wielder: 'pippa',
      usableInBattle: false,
      price: 360,
      text: 'A garter-snapped postage stamp, licked and loaded. Stings exactly like overdue correspondence.',
    }),
    I({
      id: 'needle_saber',
      name: 'Needle Saber',
      kind: 'weapon',
      offense: 34,
      wielder: 'pippa',
      bonus: { speed: 3 },
      usableInBattle: false,
      price: 560,
      text: 'A darning needle balanced like a rapier. En garde, very quietly, and mind the thread. Speed +3.',
    }),
    I({
      id: 'thimble_bell',
      name: 'Thimble Bell',
      kind: 'weapon',
      offense: 42,
      wielder: 'pippa',
      bonus: { luck: 4 },
      usableInBattle: false,
      price: 760,
      text: 'A silver thimble that rings as it strikes — half a weapon, half a summons back to order. Luck +4.',
    }),
    I({
      id: 'royal_red_pen',
      name: 'Royal Red Pen',
      kind: 'weapon',
      offense: 58,
      wielder: 'pippa',
      bonus: { luck: 6 },
      usableInBattle: false,
      price: 0,
      text: "The Foreign Minister's red pen. Corrections are final, and they bleed a little. Luck +6.",
    }),
    // — PP (tiny vessels, full-strength duchy brews) —
    I({
      id: 'acorn_cup_tea',
      name: 'Acorn-Cup Tea',
      kind: 'pp',
      ppHeal: 16,
      usableInBattle: true,
      price: 14,
      text: 'Tea served in an acorn cap, which is a soup tureen here. Steeped to a stand-up strength. ~16 PP.',
    }),
    I({
      id: 'nectar_thimble',
      name: 'Nectar Thimble',
      kind: 'pp',
      ppHeal: 14,
      usableInBattle: true,
      price: 12,
      text: "A thimble of flower nectar, the duchy's espresso. One sip and you must sit right down. ~14 PP.",
    }),
    I({
      id: 'dewdrop_cordial',
      name: 'Dewdrop Cordial',
      kind: 'pp',
      ppHeal: 18,
      usableInBattle: true,
      price: 16,
      text: 'Cordial pressed from morning dew, bottled before noon by decree. Restores about 18 PP.',
    }),
    I({
      id: 'mint_julep_drop',
      name: 'Mint Drop',
      kind: 'pp',
      ppHeal: 13,
      usableInBattle: true,
      price: 9,
      text: 'A single crystallised mint leaf, a whole garden to the duchy. Cool and reviving. ~13 PP.',
    }),
    // — foods (everything tiny; you eat dozens, the bakers swoon) —
    I({
      id: 'crumb_loaf',
      name: 'Crumb Loaf',
      kind: 'food',
      heal: 44,
      usableInBattle: true,
      price: 10,
      text: 'A whole loaf to Minimus; a crumb to you. The bakery turns out a hundred before breakfast. ~44 HP.',
    }),
    I({
      id: 'petit_four',
      name: 'Petit Four',
      kind: 'food',
      heal: 38,
      usableInBattle: true,
      price: 12,
      text: 'A glazed cake the size of a sequin. You eat forty; the pastry chef has to lie down. ~38 HP.',
    }),
    I({
      id: 'seed_pie',
      name: 'Seed Pie',
      kind: 'food',
      heal: 50,
      usableInBattle: true,
      price: 14,
      text: 'A pie filled with one poppy seed — which is, at this scale, an entire watermelon. ~50 HP.',
    }),
    I({
      id: 'honey_drop',
      name: 'Honey Drop',
      kind: 'food',
      heal: 30,
      usableInBattle: true,
      price: 6,
      text: 'One drop of clover honey: a barrel to a bee, a hearty snack to you. ~30 HP.',
    }),
    I({
      id: 'ribbon_candy',
      name: 'Ribbon Candy',
      kind: 'food',
      heal: 34,
      usableInBattle: true,
      price: 8,
      text: "Folded sugar ribbon — the duchy hangs it as bunting AND eats it for pudding. ~34 HP.",
    }),
    I({
      id: 'royal_tartlet',
      name: 'Royal Tartlet',
      kind: 'food',
      heal: 62,
      usableInBattle: true,
      price: 18,
      text: 'Served at the Ducal Crown on a coat-button for a platter, with the tiniest fork. ~62 HP.',
    }),
    I({
      id: 'cheese_sliver',
      name: 'Cheese Sliver',
      kind: 'food',
      heal: 40,
      usableInBattle: true,
      price: 9,
      text: "A sliver off the duchy's one great wheel, rationed by the Slice-Master, who takes it seriously. ~40 HP.",
    }),
    I({
      id: 'teaspoon_stew',
      name: 'Teaspoon Stew',
      kind: 'food',
      heal: 56,
      usableInBattle: true,
      price: 15,
      text: "A whole banquet's stew, ladled out by the teaspoonful at the long table. ~56 HP.",
    }),
    I({
      id: 'marzipan_pig',
      name: 'Marzipan Pig',
      kind: 'food',
      heal: 42,
      usableInBattle: true,
      price: 11,
      text: 'A good-luck marzipan pig, hand-painted, faintly smug. Eat the smug first. ~42 HP.',
    }),
    I({
      id: 'sugared_violet',
      name: 'Sugared Violet',
      kind: 'food',
      heal: 28,
      usableInBattle: true,
      price: 7,
      text: 'A crystallised violet, the court confectioner\'s whole afternoon. Crunches like frost. ~28 HP.',
    }),
    // — cures (the chapter's powdered-wig sleep; a single-petal nosegay) —
    I({
      id: 'powder_wig_dust',
      name: 'Wig Powder',
      kind: 'cure',
      cures: ['asleep'],
      usableInBattle: true,
      price: 18,
      text: 'A pinch of antique wig-powder up the nose. Wakes anyone — ask the Powder-Wig Wasp. Cures Sleep.',
    }),
    I({
      id: 'smelling_bouquet',
      name: 'Smelling Bouquet',
      kind: 'cure',
      cures: ['crying'],
      usableInBattle: true,
      price: 12,
      text: 'A nosegay so small it is a single petal. One sniff dries any royal eye. Cures Crying.',
    }),
    // — TONICS (a penny that is the duchy's whole gold reserve; a watch battery
    //   that is, locally, a power station — Minimus's hundred engineers) —
    I({
      id: 'lucky_penny_tonic',
      name: 'Lucky Penny',
      kind: 'tonic',
      boost: { stat: 'luck', amount: 2 },
      usableInBattle: false,
      price: 340,
      text: 'A penny to you, the entire ducal treasury to them. Spend it on yourself — Luck up by 2, for keeps.',
    }),
    I({
      id: 'charged_battery',
      name: 'Charged Battery',
      kind: 'tonic',
      boost: { stat: 'pp', amount: 12 },
      usableInBattle: false,
      price: 360,
      text: 'A watch battery — a humming power station at duchy scale. Max PP up by 12, courtesy of the engineers.',
    }),
    // — armor: the §A8 HAT LADDER rung (Paper Crown) + the court bodies —
    I({
      id: 'paper_crown',
      name: 'Paper Crown',
      kind: 'armor',
      defense: 12,
      usableInBattle: false,
      price: 110,
      text: 'A coronation crown cut from gilt paper. It outranks you, and is keenly aware of the fact. Defense +12.',
    }),
    I({
      id: 'velvet_doublet',
      name: 'Velvet Doublet',
      kind: 'armor',
      defense: 18,
      usableInBattle: false,
      price: 180,
      text: 'Court velvet, jewel-toned, fitted to a colossus by a hundred tailors in a single panicked night. Defense +18.',
    }),
    I({
      id: 'herald_tabard',
      name: 'Herald Tabard',
      kind: 'armor',
      defense: 15,
      usableInBattle: false,
      price: 150,
      text: 'Quartered in duchy colours. Wear it and the Whistle Guards finally, visibly, relax. Defense +15.',
    }),
    I({
      id: 'ermine_cape',
      name: 'Ermine Cape',
      kind: 'armor',
      defense: 22,
      usableInBattle: false,
      price: 230,
      text: 'Trimmed in ermine — well, in mouse, but one does not say so at court. Defense +22.',
    }),
    // — generic ARMS (diplomatic quickness; un-tagged) —
    I({
      id: 'lace_cuffs',
      name: 'Lace Cuffs',
      kind: 'arms',
      speed: 6,
      usableInBattle: false,
      price: 100,
      text: 'Court lace at the wrists — quick for signing treaties, quicker for slapping down a gauntlet. Speed +6.',
    }),
    I({
      id: 'signet_bracer',
      name: 'Signet Bracer',
      kind: 'arms',
      guts: 7,
      usableInBattle: false,
      price: 110,
      text: 'A wax-seal signet bound to the wrist. Press it to a document and arguments simply end. Guts +7.',
    }),
    // — generic CHARMS (diplomatic riders — luck, morale, the Big-Little focus) —
    I({
      id: 'duchy_seal_charm',
      name: 'Duchy Seal',
      kind: 'charm',
      luck: 8,
      usableInBattle: false,
      price: 140,
      text: "The Grand Duchess's seal in miniature. Doors open before it; so, more slowly, do hearts. Luck +8.",
    }),
    I({
      id: 'morale_medal',
      name: 'Morale Medal',
      kind: 'charm',
      luck: 6,
      usableInBattle: false,
      price: 130,
      text: 'Pinned for valour at the Battle of the Breadbox. Frightened citizens stand a little taller near it. Luck +6.',
    }),
    I({
      id: 'lens_charm',
      name: 'Lens Charm',
      kind: 'charm',
      luck: 6,
      vibe: 2,
      usableInBattle: false,
      price: 150,
      text: 'A spare grind from Sigrid\'s lens, set as a monocle-charm. Small, hidden things swim into focus. Luck +6.',
    }),
    I({
      id: 'census_quill_charm',
      name: 'Census Quill',
      kind: 'charm',
      luck: 7,
      usableInBattle: false,
      price: 135,
      text: 'A worn-down quill nib on a chain. It has written every name in the duchy, twice, and lost none. Luck +7.',
    }),
    // — battle goods (the Tin Parade charges; a thimble of festive spite) —
    I({
      id: 'tin_soldier',
      name: 'Tin Soldier',
      kind: 'battle',
      power: 38,
      usableInBattle: true,
      price: 22,
      text: 'A wind-up tin guardsman who charges once, salutes, and topples over. ~38 damage and a small bow.',
    }),
    I({
      id: 'confetti_cannon',
      name: 'Confetti Cannon',
      kind: 'battle',
      power: 44,
      usableInBattle: true,
      price: 30,
      text: 'A thimble packed tight with sequins and spite. Fires once, festively, blindingly. ~44 damage.',
    }),
    // — valuables (the census, the crown's chip, the duchy's tiny coinage) —
    I({
      id: 'crown_jewel_chip',
      name: 'Crown-Jewel Chip',
      kind: 'valuable',
      usableInBattle: false,
      price: 180,
      text: 'A flake off the Ducal Crown — a boulder of a diamond at this scale, insured for a whole kingdom.',
    }),
    I({
      id: 'census_ledger',
      name: 'Census Ledger',
      kind: 'valuable',
      usableInBattle: false,
      price: 60,
      text: "The duchy's complete census, all 100 names, bound the size of a stamp. To Pippa, simply priceless.",
    }),
    I({
      id: 'royal_doubloon_tiny',
      name: 'Duchy Sovereign',
      kind: 'valuable',
      usableInBattle: false,
      price: 90,
      text: 'Legal tender for one acorn. A collector three countries over will pay you in genuine earnest money.',
    }),
    I({
      id: 'gilt_thimble_collection',
      name: 'Gilt Thimbles',
      kind: 'valuable',
      usableInBattle: false,
      price: 70,
      text: 'A case of gilded thimbles — goblets, to the duchy. Each one a tiny, slightly-dented heirloom.',
    }),
    // — key items (§A8 Royal Thimble — Pippa's scale-anchor; the Big-Little Lens) —
    I({
      id: 'royal_thimble',
      name: 'Royal Thimble',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: "Pippa's scale-anchor, worn like an order of state. It holds her readable beside giants without 'fixing' Minimus.",
    }),
    I({
      id: 'big_little_lens',
      name: 'Big-Little Lens',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: "Sigrid's spare lens, ground true by the duchy's hundred engineers. It teaches Spy to share its Focus.",
    }),
    I({
      id: 'procession_pass',
      name: 'Procession Pass',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'A ribboned pass to walk the Procession Way, so the Whistle Guards need not panic. Stamped, twice, in earnest.',
    }),
    /* ───────────────── CROSS-WORLD — THE LOST & FOUND OF IMPOSSIBLE SIZES ──────
     * §A10's cross-chain: objects displaced by Norway/Minimus scale logic, to be
     * returned across the world (Pippa shines here — she treats wrong-sized things
     * as diplomatic incidents). Banded 'cross', not to a single region. */
    I({
      id: 'giant_button',
      name: 'Giant Button',
      kind: 'valuable',
      usableInBattle: false,
      price: 80,
      text: 'A button the size of a manhole cover — which is exactly what Kvisthavn uses it for, while Lilleby swears blind it is a shield.',
    }),
    I({
      id: 'impossible_berry',
      name: 'Impossible Berry',
      kind: 'valuable',
      usableInBattle: false,
      price: 40,
      text: 'One bilberry too big for any bowl on earth except a giant\'s. It stubbornly refuses to spoil or be eaten.',
    }),
    I({
      id: 'tiny_postcard',
      name: 'Tiny Postcard',
      kind: 'key',
      usableInBattle: false,
      price: 0,
      text: 'A postcard from Minimus, printed at true scale. Dad needs the monocle, a steady hand, and his glasses.',
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
