/**
 * Chapter 1 shops — GAME_BIBLE Prompt 20 / §A8 Ch.1 stock (S4).
 * Each keeper has exactly one weird obsession (§A11): expiration dates at
 * OTTERBROOK DRUG, the wandering carts at STARMART. Stock ids must exist in
 * ITEMS with a nonzero price (`npm run validate` enforces it, S5).
 * Types are z.infer'd from src/schemas — compile shape ≡ runtime schema.
 */
import type { ShopDef } from '../schemas';

export type { ShopDef } from '../schemas';

export const SHOPS: Record<string, ShopDef> = {
  drugstore: {
    id: 'drugstore',
    name: 'OTTERBROOK DRUG',
    keeperNpc: 'drug_clerk',
    // sugar_bag: §A10 #3's first supply (S9) — expires never, per the keeper
    // M18 (ADR-063): the Americas pour — pharmacy food/cures, the revival floor
    // (Second Wind), Mom's Voice Tape, the hat-ladder head, the Bug Zapper
    stock: [
      'tball_bat', 'corn_dog', 'pbj', 'salt_shaker', 'sugar_bag',
      'grilled_cheese', 'apple_pie_slice', 'bug_juice', 'moms_voice_tape',
      'second_wind', 'bug_zapper', 'otterbrook_cap',
    ],
    greet: 'shop_drug_greet',
    farewell: 'shop_drug_bye',
  },
  starmart: {
    id: 'starmart',
    name: 'STARMART',
    keeperNpc: 'mart_clerk',
    // the pan is a spare — Mia already owns hers (ADR-015); Star Cola is the
    // game's first PP-restore item (§A8 "PP: Star Cola line");
    // lemon_crate: §A10 #3's city lemons (S9) — the twins insist on STARMART's
    // basket_basic: §A4.5 lands (S14) — the picnic system's entry ticket
    // M18 (ADR-063): Brickton's bigger store — Diet Star Cola, the candy-bar
    // comet, the weapon sidegrades (novelty rack), the dear Sudden Guts Pill
    stock: [
      'tball_bat', 'hand_me_down_pan', 'star_cola', 'corn_dog', 'pbj', 'salt_shaker', 'lemon_crate', 'basket_basic',
      'diet_star_cola', 'choco_comet_bar', 'foam_finger', 'wiffle_bat', 'nonstick_pan', 'sudden_guts_pill',
    ],
    greet: 'shop_mart_greet',
    farewell: 'shop_mart_bye',
  },
  /* ---- S14: the §A8 Ch.2 shelves (one shop per settlement, manifest-pinned) ---- */
  mercado: {
    id: 'mercado',
    name: 'MERCADO DEL SOL',
    keeperNpc: 'mercado_keeper',
    // the refresh curve starts here: Jay's Sandlot Slugger, the charm shelf,
    // regional food + the §A8 cures the Ch.2 roster makes matter
    // M18 (ADR-063): the Puerto Sol market — empanadas, ceviche, mate (clockwise!),
    // the chullo, a woven wristlet, unknot drops for the jungle's Paralyze
    stock: [
      'sandlot_slugger', 'alfajor', 'star_cola', 'salt_shaker', 'hanky', 'aloe_leaf', 'basket_basic', 'tin_sun_pendant',
      'empanada', 'ceviche', 'mango', 'arepa', 'chicha_morada', 'mate_gourd', 'jungle_fizz', 'unknot_drops',
      'chullo', 'woven_wristlet',
    ],
    greet: 'shop_mercado_greet',
    farewell: 'shop_mercado_bye',
  },
  valle_shop: {
    id: 'valle_shop',
    name: 'LANA & MAS',
    keeperNpc: 'valle_keeper',
    // Mia's Copper Pan waits up the mountain — priced like a real choice (§A9)
    // M18 (ADR-063): Valle Dorado's shelf — mountain food, the Guardian-Angel
    // Feather (the next revival rung), the rare Speed-Demon Soda vendor, the
    // cushma + alpaca vest + climbing gloves for the cliff path
    stock: [
      'copper_pan', 'alfajor', 'corn_dog', 'star_cola', 'aloe_leaf', 'hanky', 'basket_basic',
      'choripan', 'tres_leches', 'humita', 'guardian_angel_feather', 'speed_demon_soda',
      'cushma', 'alpaca_vest', 'climbing_gloves',
    ],
    greet: 'shop_valle_greet',
    farewell: 'shop_valle_bye',
  },
  /* ---- S18 (ADR-095): the §A8 Ch.3 shelf — Foggybottom's chemist (one shop per
   *  settlement). TEA IS PP this chapter; the chemist also keeps the chapter's
   *  cures (the Hushed throat, the chalk-dust tears), damp-stone food, and a hat +
   *  coat for the moor. Affordable on the Ch.3 Fortune Arc (§A9). One obsession:
   *  tea is steeped CORRECTLY or not at all. ---- */
  foggybottom_chemist: {
    id: 'foggybottom_chemist',
    name: "BOOTHE'S CHEMIST & TEAS",
    keeperNpc: 'fb_chemist',
    stock: [
      'honey_lozenge', 'eye_drops', 'builders_tea', 'earl_grey', 'school_cocoa',
      'scone_clotted_cream', 'crumpet', 'fish_and_chips', 'pork_pie', 'marmite_toast',
      'cricket_cap', 'tweed_waistcoat', 'rain_charm',
    ],
    greet: 'shop_fb_chemist_greet',
    farewell: 'shop_fb_chemist_bye',
  },
  /* ---- S18 (ADR-095): the §A8 Ch.3 DUNGEON shelf — Wintermoor's tuck shop. Milo's
   *  gun ladder (Pellet Popper → Spud Gun → Double-Barrel Sparker; the Gauss Lobber
   *  is the boss drop, never sold) + his repaired-gizmo battle goods + rationed
   *  cocoa. One obsession: what the mainframe doesn't optimise, you buy quietly. ---- */
  wintermoor_tuck: {
    id: 'wintermoor_tuck',
    name: 'THE TUCK SHOP (rationed)',
    keeperNpc: 'wm_tuck_keeper',
    stock: [
      'pellet_popper', 'spud_gun', 'double_barrel_sparker',
      'spark_coil', 'cog_grenade', 'clockwork_sparrow',
      'school_cocoa', 'canteen_stodge', 'cricket_pads', 'house_pin', 'brass_compass',
    ],
    greet: 'shop_wintermoor_tuck_greet',
    farewell: 'shop_wintermoor_tuck_bye',
  },
  /* ---- Ch.4 (Norway) — §A8 ch4 shelves. KVISTHAVN's supply shop keeps the
   *  fjord's food + cures, Jay's Frozen Cod / Mia's Lefse Griddle sidegrades, the
   *  cold-drink PP line, the FUR-LINED HOOD, and — crucially — the FIRECRACKER
   *  STRING (the NOISE that drags the Whisperwig out of the Sleeper's ear). One
   *  obsession: the fish were bigger before the hum. Affordable on the §A9 Ch.4
   *  arc. ---- */
  kvisthavn_supply: {
    id: 'kvisthavn_supply',
    name: "KVISTHAVN KOLONIAL",
    keeperNpc: 'kv_shopkeeper',
    stock: [
      'frozen_cod', 'lefse_griddle', 'cloudberry_cordial', 'birch_sap', 'gjende_coffee',
      'brunost', 'fiskeboller', 'lefse', 'smoked_salmon', 'salve_of_arnica', 'smelling_salts',
      'firecracker_string', 'snowball_special', 'fur_lined_hood', 'wool_sweater', 'reindeer_mittens',
      'cool_charm', 'basket_basic',
    ],
    greet: 'shop_kvisthavn_greet',
    farewell: 'shop_kvisthavn_bye',
  },
  /* ---- Ch.4 (Norway) — LILLEBY's warehouse: everything here is giant-sized and
   *  priced like it. The dearer goods — the tonics (giant goat's milk, the cod-liver
   *  penance), the troll charms, the heavy coats, and the long-keeping moor food.
   *  One obsession: NORMAL-SIZED, insists the sign, while the keeper kneels to
   *  ring you up. ---- */
  lilleby_warehouse: {
    id: 'lilleby_warehouse',
    name: 'LILLEBY DRY GOODS (normal-sized)',
    keeperNpc: 'll_keeper',
    stock: [
      'lutefisk', 'multekrem', 'rommegrot', 'farikal', 'knekkebrod', 'vafler', 'pickled_herring', 'kransekake',
      'growth_spurt_milk', 'cod_liver_oil', 'oilskin_slicker', 'troll_hide_vest', 'rope_bracer',
      'troll_cross', 'amber_drop', 'vegvisir_charm',
    ],
    greet: 'shop_lilleby_greet',
    farewell: 'shop_lilleby_bye',
  },
};
