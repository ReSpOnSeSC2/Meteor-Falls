/**
 * THE BUILDING CATALOG (S15i, ADR-050) — a DETERMINISTIC generator that turns a
 * handful of facade FAMILIES into 100+ distinct, named city buildings by
 * combining each family's treatment with a curated wall-ramp pool and a height
 * ladder. Every entry is plain CityBuildingOpts → drawCityBuilding(), so the
 * forge gets a deep skin pool (no Math.random — names + opts derive from
 * indices, Prime Law 2) and BUILDING_DIMS (levelkit/kit.ts) reads each entry's
 * true {w, u} straight off this list.
 *
 * THE PER-AREA LAW (the user's "each area feels fresh and new"): the pool is
 * SLICED into AREA_SKINS — every named level area draws from its OWN curated
 * subset (distinct families + a distinct ramp palette), so Otterbrook never
 * reuses Brickton's towers and a new area is never a reskin of an old one.
 * Going forward, every new area MUST register its own skin set here.
 *
 * Plus the COLOSSI: landmark megastructures so large their footprint spans a
 * good slice of a city map — the "you walk an entire block to round it" read.
 */
import { RAMP } from '../palette';
import type { CityBuildingOpts } from './tiles';

export interface CatalogEntry {
  name: string;
  family: string;
  ramp: number;
  opts: CityBuildingOpts;
}

/** stable ramp short-names for deterministic sprite keys */
const RAMP_NAME: Record<number, string> = {
  [RAMP.RED]: 'red', [RAMP.ORANGE]: 'orange', [RAMP.GOLD]: 'gold', [RAMP.GRASS]: 'grass',
  [RAMP.FOREST]: 'forest', [RAMP.CYAN]: 'cyan', [RAMP.BLUE]: 'blue', [RAMP.PURPLE]: 'purple',
  [RAMP.MAGENTA]: 'magenta', [RAMP.EARTH]: 'earth', [RAMP.PAPER]: 'paper', [RAMP.NIGHT]: 'night',
};

/** short, kid-readable, EarthBound-flavoured signage pools, one per family */
const SIGNS: Record<string, readonly string[]> = {
  shop: ['CORNER', 'FIVE DIME', 'NOTIONS', 'HARDWARE', 'GROCER', 'RECORDS', 'COMICS', 'SHOES', 'TOYS', 'PAINT', 'SODA', 'KEYS', 'BAIT', 'YARN'],
  cafe: ['DINER', 'CAFE', 'MALT SHOP', 'COFFEE', 'PIE CO', 'WAFFLES', 'CHILI', 'DONUTS'],
  brownstone: ['FLATS', 'ROW', 'NO 9', 'LODGINGS', 'THE NOOK', 'WALKUP', 'NO 14', 'STOOP'],
  apartments: ['THE ARMS', 'TERRACE', 'COURT', 'MANOR', 'GARDENS', 'THE PINES', 'HEIGHTS', 'VILLA', 'TOWERS', 'COMMONS', 'CRESCENT', 'WILLOWS'],
  office: ['SUITES', 'TRUST', 'HOLDINGS', 'AGENCY', 'WIDGETS', 'PARTNERS', 'CONSOLIDATED', 'DATACORP', 'OPTICS', 'DYNAMIC', 'VENTURES', 'SYSTEMS'],
  civic: ['LIBRARY', 'COURT', 'POST', 'MUSEUM', 'WATERWORKS', 'ARCHIVE'],
  theater: ['ORPHEUM', 'BIJOU', 'ROXY', 'PALACE', 'STARLITE', 'PARAMOUNT', 'MAJESTIC', 'GRANADA'],
  market: ['MARKET', 'ARCADE', 'BAZAAR', 'EXCHANGE', 'STALLS', 'GALLERIA'],
  neon: ['NEON', 'JAZZ', 'CLUB 88', 'LATE NITE', 'NOODLES', 'KARAOKE'],
  warehouse: ['DEPOT', 'STORAGE', 'FREIGHT', 'WORKS', 'COLD CO', 'CANNERY'],
  deptstore: ['GRANDE', 'EMPORIUM', 'MERCANTILE', 'GOODS CO', 'BARGAINS', 'OUTFITTERS'],
  hotel: ['HOTEL', 'GRAND', 'PLAZA', 'IMPERIAL', 'TRAVELERS', 'REGENT'],
  bank: ['SAVINGS', 'FIRST BANK', 'MUTUAL', 'TRUST CO', 'CREDIT'],
};

/** a family is a base flag set + the ramp pool + (width, stories) tiers it spans */
interface Family {
  key: string;
  base: Partial<CityBuildingOpts>;
  ramps: readonly number[];
  /** [wallTiles, upperRows] tiers — each ramp × tier becomes one building */
  tiers: ReadonlyArray<readonly [number, number]>;
}

const FAMILIES: readonly Family[] = [
  { key: 'shop', base: { awning: RAMP.RED, doorAt: 1 }, ramps: [RAMP.ORANGE, RAMP.GRASS, RAMP.CYAN, RAMP.GOLD, RAMP.RED], tiers: [[4, 1], [5, 2], [4, 2]] },
  { key: 'cafe', base: { awning: RAMP.PAPER, doorAt: 1 }, ramps: [RAMP.RED, RAMP.ORANGE, RAMP.BLUE, RAMP.GOLD], tiers: [[4, 1], [4, 2]] },
  { key: 'brownstone', base: { doorAt: 1 }, ramps: [RAMP.EARTH, RAMP.RED, RAMP.ORANGE, RAMP.PURPLE], tiers: [[4, 3], [4, 4]] },
  { key: 'apartments', base: { balconies: true, doorAt: 2 }, ramps: [RAMP.ORANGE, RAMP.EARTH, RAMP.RED, RAMP.GOLD], tiers: [[5, 4], [6, 5], [5, 6]] },
  { key: 'office', base: { tower: true, doorAt: 2 }, ramps: [RAMP.CYAN, RAMP.BLUE, RAMP.PAPER, RAMP.GRASS], tiers: [[5, 5], [5, 7], [6, 6]] },
  { key: 'civic', base: { portico: true, doubleDoor: true, doorAt: 3 }, ramps: [RAMP.PAPER, RAMP.GOLD, RAMP.CYAN], tiers: [[6, 2], [6, 3]] },
  { key: 'theater', base: { marquee: true, doubleDoor: true, doorAt: 2 }, ramps: [RAMP.RED, RAMP.PURPLE, RAMP.BLUE, RAMP.MAGENTA], tiers: [[5, 2], [5, 3]] },
  { key: 'market', base: { colonnade: true, doorAt: 3 }, ramps: [RAMP.GOLD, RAMP.ORANGE, RAMP.GRASS], tiers: [[6, 1], [6, 2]] },
  { key: 'neon', base: { neon: true, doorAt: 1 }, ramps: [RAMP.NIGHT, RAMP.PURPLE, RAMP.MAGENTA], tiers: [[4, 2], [5, 3]] },
  { key: 'warehouse', base: { doubleDoor: true, doorAt: 4 }, ramps: [RAMP.PAPER, RAMP.EARTH, RAMP.CYAN], tiers: [[7, 1], [8, 1]] },
  { key: 'deptstore', base: { doubleDoor: true, doorAt: 4 }, ramps: [RAMP.PURPLE, RAMP.RED, RAMP.BLUE], tiers: [[8, 2], [8, 3]] },
  { key: 'hotel', base: { tower: true, balconies: true, doorAt: 2 }, ramps: [RAMP.RED, RAMP.GOLD, RAMP.CYAN], tiers: [[6, 7], [6, 9]] },
  { key: 'bank', base: { portico: true, doorAt: 2 }, ramps: [RAMP.PAPER, RAMP.GOLD], tiers: [[6, 2], [7, 3]] },
];

let litSeq = 100; // deterministic, distinct lit-window seed per generated facade

function buildCatalog(): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  for (const fam of FAMILIES) {
    const signs = SIGNS[fam.key];
    let n = 0;
    for (const ramp of fam.ramps) {
      for (const [w, u] of fam.tiers) {
        out.push({
          name: `bldg_gen_${fam.key}_${RAMP_NAME[ramp]}_${u}`,
          family: fam.key,
          ramp,
          opts: { wallTiles: w, upperRows: u, wall: ramp, signText: signs[n % signs.length], litSeed: litSeq++, ...fam.base },
        });
        n++;
      }
    }
  }
  return out;
}

/** 100+ generated city facades across 13 families (the deep skin pool) */
export const CITY_CATALOG: readonly CatalogEntry[] = buildCatalog();

/**
 * THE COLOSSI — landmark megastructures, in two registers:
 *   WIDE — footprint spans a slice of the map; you round them on foot.
 *     arcology (~72 tiles), grand (~40 tiles).
 *   SKY — they climb 2–4+ SCREENS into the air (a screen ≈ 225px; H = 44+u·16),
 *     so the top is gone long before you reach the door:
 *     skyscraper (large AND tall, ~3.6 screens), needle (thin AND tall, ~4.3
 *     screens), spire (~1.75 screens). Their solids (via BUILDING_DIMS) block the
 *     whole footprint at any height, so a hero can't clip them.
 */
export const COLOSSI: readonly CatalogEntry[] = [
  // WIDE colossi
  { name: 'bldg_colossus_arcology', family: 'colossus', ramp: RAMP.BLUE, opts: { wallTiles: 72, upperRows: 16, wall: RAMP.BLUE, signText: 'METEOR FALLS ARCOLOGY', tower: true, doubleDoor: true, doorAt: 35, litSeed: 901 } },
  { name: 'bldg_colossus_grand', family: 'colossus', ramp: RAMP.PAPER, opts: { wallTiles: 40, upperRows: 14, wall: RAMP.PAPER, signText: 'GRAND CENTRAL', tower: true, portico: true, doubleDoor: true, doorAt: 19, litSeed: 903 } },
  // SKY colossi — hundreds of feet, 2–4+ screens tall
  { name: 'bldg_colossus_skyscraper', family: 'colossus', ramp: RAMP.CYAN, opts: { wallTiles: 26, upperRows: 48, wall: RAMP.CYAN, signText: 'STARFALL CENTER', tower: true, doubleDoor: true, doorAt: 12, litSeed: 904 } }, // 418×812 ≈ 3.6 screens (large AND tall)
  { name: 'bldg_colossus_needle', family: 'colossus', ramp: RAMP.NIGHT, opts: { wallTiles: 8, upperRows: 58, wall: RAMP.NIGHT, signText: 'THE NEEDLE', tower: true, neon: true, doorAt: 3, litSeed: 905 } }, // 130×972 ≈ 4.3 screens (thin AND tall)
  { name: 'bldg_colossus_spire', family: 'colossus', ramp: RAMP.PURPLE, opts: { wallTiles: 14, upperRows: 30, wall: RAMP.PURPLE, signText: 'THE SPIRE', tower: true, neon: true, doubleDoor: true, doorAt: 6, litSeed: 902 } }, // 226×524 ≈ 2.3 screens
];

/** every generated entry (families + colossi) — index.ts registers them all */
export const GENERATED_BUILDINGS: readonly CatalogEntry[] = [...CITY_CATALOG, ...COLOSSI];

/* ----------------------- formal-city scale variants ----------------------- */

/**
 * Production facade scale contract: an ordinary city building is at least 6.7
 * 32px heroes tall; a landmark is at least 9 heroes tall. These are real,
 * procedurally-authored storeys with unchanged lot widths — never a y-stretch.
 *
 * Minimus keeps its 0.5 Gulliver native scale. Its source variants therefore
 * carry twice the storeys, producing the same runtime silhouette while citizens,
 * doors, props, and vehicles remain visibly miniature.
 */
export const FORMAL_CITY_HERO_HEIGHT = 32;
export const FORMAL_CITY_MIN_RATIO = 6.7;
export const FORMAL_CITY_LANDMARK_MIN_RATIO = 9;
export const FORMAL_CITY_ORDINARY_ROWS = 11; // H=220 => 6.875 heroes
export const FORMAL_CITY_LANDMARK_ROWS = 16; // H=300 => 9.375 heroes
export const MINIMUS_CITY_ORDINARY_ROWS = 25; // H=444 × .5 => 222 => 6.9375 heroes
export const MINIMUS_CITY_LANDMARK_ROWS = 34; // H=588 × .5 => 294 => 9.1875 heroes

export const FORMAL_CITY_SCALE_IDS = [
  'brickton',
  'puerto_sol',
  'valle_dorado',
  'minimus_major',
  'zanzibel',
  'chandrapore',
  'lotus_harbor',
] as const;

export type FormalCityScaleId = (typeof FORMAL_CITY_SCALE_IDS)[number];

/** Every facade source currently placed in the seven formal cities, with its
 *  declared lot width. Promotion is intentionally closed-world: a newly placed
 *  facade fails the validator until it receives an authored city-scale variant. */
export const FORMAL_CITY_FACADE_SOURCE_WIDTHS: Record<FormalCityScaleId, Readonly<Record<string, number>>> = {
  brickton: {
    bldg_ob_hotel: 7,
    bldg_hospital: 7,
    bldg_dept: 8,
    bldg_civic: 6,
    bldg_warehouse: 8,
    bldg_brickmore: 5,
    bldg_starmart: 5,
    bldg_bagels: 4,
    bldg_bank: 6,
    bldg_arcade2: 5,
    bldg_theater: 5,
    bldg_gen_shop_grass_1: 4,
    bldg_diner: 4,
    bldg_market: 6,
    bldg_apartments: 5,
    bldg_brownstone: 4,
  },
  puerto_sol: {
    bldg_ps_mercado: 5,
    bldg_ps_clinic: 5,
    bldg_ps_pension: 5,
    bldg_ps_museum: 6,
    bldg_ps_casa: 4,
    bldg_ps_casa_b: 4,
    bldg_ps_deli: 4,
    bldg_ps_pension_b: 5,
    bldg_ps_casa_c: 4,
    bldg_ps_cantina: 5,
    bldg_ps_catedral: 6,
    bldg_ps_gran_hotel: 6,
    bldg_ps_aduana: 7,
    bldg_gen_market_gold_1: 6,
    bldg_gen_civic_paper_2: 6,
  },
  valle_dorado: {
    bldg_colossus_spire: 14,
    bldg_tower_arms: 6,
    bldg_tower_glass: 6,
    bldg_tower_corp: 7,
    bldg_gen_bank_paper_3: 7,
    bldg_gen_market_gold_1: 6,
    bldg_gen_shop_gold_2: 4,
    bldg_gen_civic_paper_3: 6,
    bldg_gen_market_orange_2: 6,
    bldg_gen_cafe_orange_1: 4,
    bldg_gen_brownstone_earth_3: 4,
    bldg_gen_brownstone_earth_4: 4,
  },
  minimus_major: {
    bldg_minimus_cathedral: 4,
    bldg_minimus_petit_market: 4,
    bldg_minimus_manor: 4,
    bldg_minimus_thimble_inn: 4,
  },
  zanzibel: {
    bldg_zanzibel_home: 4,
    bldg_zanzibel_indigo_dyer: 4,
    bldg_zanzibel_caravanserai: 4,
  },
  chandrapore: {
    bldg_zanzibel_caravanserai: 4,
    bldg_zanzibel_investment_desk: 4,
    bldg_zanzibel_civic_hall: 4,
    bldg_zanzibel_harbor_customs: 4,
  },
  lotus_harbor: {
    bldg_lotus_harbor_lantern_shop: 4,
    bldg_lotus_harbor_tea_house: 4,
    bldg_lotus_harbor_temple: 4,
  },
};

export const FORMAL_CITY_LANDMARK_SOURCES: ReadonlySet<string> = new Set([
  'bldg_dept',
  'bldg_ps_catedral',
  'bldg_ps_gran_hotel',
  'bldg_ps_aduana',
  'bldg_colossus_spire',
  'bldg_tower_arms',
  'bldg_tower_glass',
  'bldg_tower_corp',
  'bldg_minimus_cathedral',
  'bldg_zanzibel_caravanserai',
  'bldg_zanzibel_civic_hall',
  'bldg_zanzibel_harbor_customs',
  'bldg_lotus_harbor_temple',
]);

const CITY_SCALE_PALETTE: Record<FormalCityScaleId, readonly number[]> = {
  brickton: [RAMP.BLUE, RAMP.CYAN, RAMP.PURPLE, RAMP.NIGHT],
  puerto_sol: [RAMP.GOLD, RAMP.ORANGE, RAMP.PAPER, RAMP.RED],
  valle_dorado: [RAMP.PAPER, RAMP.GOLD, RAMP.PURPLE, RAMP.CYAN],
  minimus_major: [RAMP.GOLD, RAMP.RED, RAMP.PAPER],
  zanzibel: [RAMP.EARTH, RAMP.ORANGE, RAMP.PURPLE, RAMP.GOLD],
  chandrapore: [RAMP.PAPER, RAMP.PURPLE, RAMP.GOLD, RAMP.CYAN],
  lotus_harbor: [RAMP.RED, RAMP.GOLD, RAMP.CYAN, RAMP.NIGHT],
};

const CITY_SCALE_FALLBACK_SIGNS: Record<FormalCityScaleId, readonly string[]> = {
  brickton: ['TWOTON', 'SECOND WIND', 'UPTOWN', 'CIVIC LOOP'],
  puerto_sol: ['PUERTO SOL', 'EL FARO', 'PLAZA DEL SOL', 'BUEN VIENTO'],
  valle_dorado: ['VALLE', 'ESTRELLA', 'AVENIDA', 'GOLDEN HOUR'],
  minimus_major: ['MAJOR', 'THIMBLE ROW', 'GRANDISH', 'ROYAL SIZE'],
  zanzibel: ['INDIGO ROW', 'BAOBAB COURT', 'CARAVAN WAY', 'MARKET SONG'],
  chandrapore: ['MOON GATE', 'MONSOON HOUSE', 'SILVER HILL', 'CHANDRA'],
  lotus_harbor: ['LOTUS ROW', 'LANTERN WAY', 'JADE QUAY', 'MOON TEA'],
};

const CITY_SCALE_SOURCE_SIGNS: Readonly<Record<string, string>> = {
  bldg_ob_hotel: 'TWOTON HOTEL',
  bldg_hospital: 'TWOTON GENERAL',
  bldg_dept: 'DEPT OF SMILES',
  bldg_civic: 'CIVIC HALL',
  bldg_warehouse: 'BUS DEPOT',
  bldg_brickmore: 'THE BRICKMORE',
  bldg_starmart: 'STARMART',
  bldg_bagels: 'BAGELS',
  bldg_bank: 'SAVINGS LOAN',
  bldg_arcade2: 'STARPORT II',
  bldg_theater: 'ORPHEUM',
  bldg_diner: 'PIE IN THE SKY',
  bldg_market: 'MARKET',
  bldg_apartments: 'THE ARMS',
  bldg_brownstone: 'FLATS',
  bldg_ps_mercado: 'MERCADO SOL',
  bldg_ps_clinic: 'CLINICA',
  bldg_ps_pension: 'PENSION',
  bldg_ps_museum: 'MUSEO',
  bldg_ps_casa: 'CASA DEL SOL',
  bldg_ps_casa_b: 'CASA AZUL',
  bldg_ps_deli: 'DELI SOL',
  bldg_ps_pension_b: 'EL FARO',
  bldg_ps_casa_c: 'CASA LUZ',
  bldg_ps_cantina: 'CANTINA',
  bldg_ps_catedral: 'CATEDRAL',
  bldg_ps_gran_hotel: 'GRAN HOTEL',
  bldg_ps_aduana: 'ADUANA',
  bldg_colossus_spire: 'STARFALL SPIRE',
  bldg_tower_arms: 'EMBERTON',
  bldg_tower_glass: 'MERIDIAN',
  bldg_tower_corp: 'OMNICORP',
  bldg_minimus_cathedral: 'TALL CHAPEL',
  bldg_minimus_petit_market: 'PETIT MARKET',
  bldg_minimus_manor: 'MINIMUS MANOR',
  bldg_minimus_thimble_inn: 'THIMBLE INN',
  bldg_zanzibel_home: 'COURTYARD',
  bldg_zanzibel_indigo_dyer: 'INDIGO DYER',
  bldg_zanzibel_caravanserai: 'CARAVANSERAI',
  bldg_zanzibel_investment_desk: 'MOON BANK',
  bldg_zanzibel_civic_hall: 'CIVIC HALL',
  bldg_zanzibel_harbor_customs: 'HARBOR GATE',
  bldg_lotus_harbor_lantern_shop: 'LANTERN SHOP',
  bldg_lotus_harbor_tea_house: 'MOON TEA',
  bldg_lotus_harbor_temple: 'LOTUS TEMPLE',
};

function cityScaleHash(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface CityScaleCatalogEntry extends CatalogEntry {
  cityId: FormalCityScaleId;
  source: string;
  landmark: boolean;
}

function cityScaleOpts(cityId: FormalCityScaleId, source: string, width: number, landmark: boolean): CityBuildingOpts {
  const hash = cityScaleHash(`${cityId}:${source}`);
  const palettes = CITY_SCALE_PALETTE[cityId];
  const wall = palettes[hash % palettes.length];
  const minimus = cityId === 'minimus_major';
  const upperRows = minimus
    ? (landmark ? MINIMUS_CITY_LANDMARK_ROWS : MINIMUS_CITY_ORDINARY_ROWS)
    : (landmark ? FORMAL_CITY_LANDMARK_ROWS : FORMAL_CITY_ORDINARY_ROWS);
  const market = /market|mercado|deli|cantina/.test(source);
  const civic = /civic|bank|clinic|hospital|cathedral|catedral|temple|customs/.test(source);
  const theater = /theater|arcade/.test(source);
  const residential = /hotel|pension|casa|home|manor|inn|apartments|brownstone|brickmore/.test(source);
  const overtTower = landmark || /tower|colossus|dept|investment/.test(source) || minimus;
  const colonial = cityId !== 'brickton' && cityId !== 'valle_dorado' && !minimus;
  const doubleDoor = landmark || civic || /dept|warehouse/.test(source);
  const doorAt = Math.max(1, Math.min(width - (doubleDoor ? 2 : 1), Math.floor(width / 2) - (doubleDoor ? 1 : 0)));
  return {
    wallTiles: width,
    upperRows,
    wall,
    signText: CITY_SCALE_SOURCE_SIGNS[source]
      ?? CITY_SCALE_FALLBACK_SIGNS[cityId][hash % CITY_SCALE_FALLBACK_SIGNS[cityId].length],
    doorAt,
    doubleDoor,
    tower: overtTower,
    balconies: residential || (hash & 1) === 1,
    marquee: theater,
    colonnade: market && !overtTower,
    portico: civic,
    neon: (cityId === 'brickton' || cityId === 'lotus_harbor') && (theater || (hash & 3) === 0),
    arch: colonial,
    ...(!colonial && !civic && !theater && !overtTower ? { awning: palettes[(hash + 1) % palettes.length] } : {}),
    litSeed: 1200 + (hash % 50000),
  };
}

function buildCityScaleCatalog(): CityScaleCatalogEntry[] {
  const out: CityScaleCatalogEntry[] = [];
  for (const cityId of FORMAL_CITY_SCALE_IDS) {
    for (const [source, width] of Object.entries(FORMAL_CITY_FACADE_SOURCE_WIDTHS[cityId])) {
      const landmark = FORMAL_CITY_LANDMARK_SOURCES.has(source);
      const stem = source.replace(/^bldg_/, '').replace(/[^a-z0-9_]/g, '_');
      const opts = cityScaleOpts(cityId, source, width, landmark);
      out.push({
        name: `bldg_cityscale_${cityId}_${stem}`,
        family: 'cityscale',
        ramp: opts.wall,
        opts,
        cityId,
        source,
        landmark,
      });
    }
  }
  return out;
}

/** Procedural tall art used only by the post-tenancy formal-city promotion. */
export const CITY_SCALE_BUILDINGS: readonly CityScaleCatalogEntry[] = buildCityScaleCatalog();

const CITY_SCALE_BY_CITY_SOURCE = new Map(
  CITY_SCALE_BUILDINGS.map((entry) => [`${entry.cityId}:${entry.source}`, entry] as const),
);
const CITY_SCALE_BY_VARIANT = new Map(CITY_SCALE_BUILDINGS.map((entry) => [entry.name, entry] as const));

export function cityScaleVariantFor(cityId: FormalCityScaleId, source: string): CityScaleCatalogEntry | undefined {
  return CITY_SCALE_BY_CITY_SOURCE.get(`${cityId}:${source}`);
}

export function cityScaleVariantMeta(sprite: string): CityScaleCatalogEntry | undefined {
  return CITY_SCALE_BY_VARIANT.get(sprite);
}

/** select catalog sprite names by family (and optionally a ramp filter) */
export function skinsFor(families: readonly string[], ramps?: readonly number[]): string[] {
  return CITY_CATALOG.filter(
    (e) => families.includes(e.family) && (!ramps || ramps.includes(e.ramp)),
  ).map((e) => e.name);
}

export const KVISTHAVN_FACADES: readonly string[] = [
  'bldg_kvisthavn_boathouse', 'bldg_kvisthavn_chapel', 'bldg_kvisthavn_fjord_cabin',
  'bldg_kvisthavn_harbor_cafe', 'bldg_kvisthavn_supply_shop',
];

export const LILLEBY_FACADES: readonly string[] = [
  'bldg_lilleby_giant_inn', 'bldg_lilleby_runic_bank', 'bldg_lilleby_tiny_house',
  'bldg_lilleby_warehouse',
];

export const MINIMUS_FACADES: readonly string[] = [
  'bldg_minimus_cathedral', 'bldg_minimus_census_office', 'bldg_minimus_major_palace',
  'bldg_minimus_manor', 'bldg_minimus_needle_armory', 'bldg_minimus_petit_market',
  'bldg_minimus_post_office', 'bldg_minimus_thimble_inn', 'bldg_minimus_whistle_barracks',
];

export const ZANZIBEL_FACADES: readonly string[] = [
  'bldg_zanzibel_caravanserai', 'bldg_zanzibel_civic_hall', 'bldg_zanzibel_courier_guild',
  'bldg_zanzibel_grand_market', 'bldg_zanzibel_harbor_customs', 'bldg_zanzibel_home',
  'bldg_zanzibel_indigo_dyer', 'bldg_zanzibel_investment_desk', 'bldg_zanzibel_spice_stall',
];

export const LOTUS_HARBOR_FACADES: readonly string[] = [
  'bldg_lotus_harbor_grand_market', 'bldg_lotus_harbor_harbor_office', 'bldg_lotus_harbor_lantern_shop',
  'bldg_lotus_harbor_pagoda', 'bldg_lotus_harbor_row_house', 'bldg_lotus_harbor_tea_house',
  'bldg_lotus_harbor_temple', 'bldg_lotus_harbor_theater',
];

export const VALEA_FACADES: readonly string[] = [
  'bldg_valea_painted_house', 'bldg_valea_church', 'bldg_valea_inn',
  'bldg_valea_shop', 'bldg_valea_cottage', 'bldg_valea_barn',
  'bldg_valea_mill', 'bldg_valea_hall',
];

// CH.10 ALASKA — AURORA STATION: authored cold-outpost facades (steel warehouse,
// command office, civic comms hall, frozen bank, crew habitat dome, rover garage).
export const AURORA_FACADES: readonly string[] = [
  'bldg_aurora_warehouse', 'bldg_aurora_command', 'bldg_aurora_comms_hall',
  'bldg_aurora_bank', 'bldg_aurora_habitat', 'bldg_aurora_garage',
];

// CH.10 HAWAII — MAUNA LANI: authored lush launch-pad-resort facades (surf shop,
// beach cafe, open market, beach hotel, spaceport launch office, tiki bar).
export const MAUNA_LANI_FACADES: readonly string[] = [
  'bldg_mauna_lani_surf_shop', 'bldg_mauna_lani_cafe', 'bldg_mauna_lani_market',
  'bldg_mauna_lani_beach_hotel', 'bldg_mauna_lani_launch_office', 'bldg_mauna_lani_tiki_bar',
];

// CH.10 MARS — THE SEA OF SILENCE: authored ruined-outpost facades (a dead-neon
// husk, a shuttered theater, a department-store ruin, a sealed comms relay, a
// collapsed habitat dome) — the NIGHT needle colossus stays as the lone landmark.
export const MARS_FACADES: readonly string[] = [
  'bldg_mars_neon_husk', 'bldg_mars_dead_theater', 'bldg_mars_dept_ruin',
  'bldg_mars_comms_relay', 'bldg_mars_habitat_ruin',
];

/**
 * AREA_SKINS — the per-area building rosters (the "each area feels fresh" law).
 * Every named level area draws ONLY from its own slice: a distinct family mix +
 * ramp palette, so no two areas read alike. The grammar (Movement Two) passes
 * `AREA_SKINS[area]` as buildDistrict's `catalog`. A new area MUST add an entry
 * here — never reuse another area's roster.
 */
export const AREA_SKINS: Record<string, readonly string[]> = {
  // OTTERBROOK — sleepy 1995 Ohio: low brownstone/shop/cafe walk-ups, warm ramps
  otterbrook: skinsFor(['brownstone', 'shop', 'cafe', 'apartments'], [RAMP.EARTH, RAMP.RED, RAMP.ORANGE, RAMP.GOLD]),
  // BRICKTON — the 2077 city: glass offices, hotels, neon, theaters, a dept store,
  // the COMMON mega-towers (tops off-screen), + the landmark colossi, cool ramps
  brickton: [
    ...skinsFor(['office', 'hotel', 'deptstore', 'theater', 'neon', 'bank'], [RAMP.BLUE, RAMP.CYAN, RAMP.PURPLE, RAMP.NIGHT, RAMP.PAPER, RAMP.MAGENTA]),
    // the shipped u12–13 mega-towers — COMMON in Brickton (the mega pass drops these)
    'bldg_tower_glass', 'bldg_tower_arms', 'bldg_tower_corp',
    // the landmark colossi (hand-placed / footprint spans a slice you round on foot)
    'bldg_colossus_arcology', 'bldg_colossus_spire', 'bldg_colossus_grand',
  ],
  // THE CAGE PARK (S15i Task 6, ADR-059) — the gritty rec-block approach to THE
  // CAGE: warehouse/brownstone/shop walk-ups in earthy reds + grass-greens. Its
  // OWN slice (never Brickton's cool glass), hand-placed on the park's city edge.
  cage_park: skinsFor(['warehouse', 'brownstone', 'shop'], [RAMP.EARTH, RAMP.RED, RAMP.GRASS]),
  // THE GOLF RESORT (S15i Task 6, ADR-059) — the expensive Costa Estrella
  // subdivision: bespoke pastel MANSIONS (drawHouse, pitched roofs) + the gatehouse.
  // Its OWN roster of NEW house sprites, hand-placed along the manicured course.
  golf_resort: ['mansion_a', 'mansion_b', 'mansion_c', 'golf_gatehouse'],
  // PUERTO SOL — Ch.2 colonial port keeps its bespoke bldg_ps_* faces + open-air
  // markets; S15i Task 4 (ADR-057) the grown dock district adds the colonial MEGAS
  // (cathedral / grand hotel / customs house — tops off-screen) the mega pass stands.
  // Masonry, not glass — megas are COMMON here (the waterfront has the room Brickton
  // lacked), but they read as a grand colonial port, never a downtown skyline.
  puerto_sol: [
    'bldg_ps_mercado', 'bldg_ps_clinic', 'bldg_ps_pension', 'bldg_ps_museum', 'bldg_ps_casa',
    'bldg_ps_casa_b', 'bldg_ps_deli', 'bldg_ps_cantina', 'bldg_ps_casa_c', 'bldg_ps_pension_b',
    'bldg_ps_catedral', 'bldg_ps_gran_hotel', 'bldg_ps_aduana', 'bldg_warehouse',
    ...skinsFor(['market', 'civic'], [RAMP.GOLD, RAMP.ORANGE, RAMP.PAPER]),
  ],

  // ─── S18 MOVEMENT 25 (ADR-066) — THE UNLANDED AREAS' SKINS ──────────────────
  // Forward-looking rosters: every canon §A5/§A6 area registers its OWN slice now
  // (a distinct family-mix + ramp palette per the place's feel), so when its maps
  // land the forge already wears the right silhouette — no area is ever a reskin of
  // another, and the validator pins this both directions (extend, never reuse).

  // CH.3 ENGLAND — FOGGYBOTTOM-ON-TYNE: a damp stone river-town. Low brick
  // brownstones, a savings bank, a civic hall, a tea cafe — cool paper/earth/blue
  // masonry, never warm Americana, never glass.
  foggybottom: skinsFor(['brownstone', 'bank', 'civic', 'cafe'], [RAMP.EARTH, RAMP.PAPER, RAMP.BLUE, RAMP.CYAN]),
  // CH.3 ENGLAND — WINTERMOOR ACADEMY: institution-as-monster. Pale stone offices,
  // civic halls + a bank front read as faculty blocks + a porter's lodge; foggy
  // paper/cyan/blue, taller and colder than the town below it.
  wintermoor: skinsFor(['office', 'civic', 'bank', 'brownstone'], [RAMP.PAPER, RAMP.CYAN, RAMP.EARTH, RAMP.BLUE]),

  // CH.4 NORWAY — KVISTHAVN: a normal-scale fishing hamlet under the cliffs. Low
  // weatherboard cafes/shops, a cold-storage cannery, brick walk-ups — red/blue/
  // earth/paper, cozy and small (the human-sized half of the giant chapter).
  kvisthavn: KVISTHAVN_FACADES,
  // CH.4 NORWAY — LILLEBY: the giants' town, where the party walks UNDER the doors.
  // Everything towers: hotels, apartment arms, a department store, an office block,
  // plus a real mega + a landmark colossus so the scale-comedy reads on sight.
  lilleby: [...LILLEBY_FACADES, 'bldg_tower_arms'],

  // CH.5 MINIMUS — MINIMUS MAJOR: a tabletop capital shrunk to 1/100. ONLY the
  // tiniest tiers (1–2 storeys), a jewel-box gold/red duchy palette: a knee-high
  // cathedral (civic), ribbon-street shops/cafes, a stall market. Hand-picked so a
  // mega can never sneak into a town the party steps over.
  minimus: [
    ...MINIMUS_FACADES,
  ],

  // CH.6 AFRICA — ZANZIBEL: the bazaar port (best market music in the game). Sun-
  // baked open-air markets, freight warehouses, corner shops, a civic customs hall —
  // gold/orange/earth/grass, masonry warmed by dust, never cool glass.
  zanzibel: ZANZIBEL_FACADES,

  // CH.7 INDIA — CHANDRAPORE: the game's biggest, densest city. A riot of theaters
  // (the cinema playing a movie about your party), a department emporium, a grand
  // hotel, neon, market arcades, apartment towers + a palace spire colossus —
  // orange/gold/magenta/red/purple, loud and crowded.
  chandrapore: [
    ...skinsFor(['deptstore', 'theater', 'hotel', 'market', 'neon', 'apartments'], [RAMP.ORANGE, RAMP.GOLD, RAMP.MAGENTA, RAMP.RED, RAMP.PURPLE]),
    'bldg_colossus_spire',
  ],

  // CH.8 CHINA — LOTUS HARBOR: temple-town on the river. Colonnaded markets, porticoed
  // civic temples, a lacquer-red theater, brick row houses, a riverside tea cafe —
  // temple red/gold + jade grass + harbor cyan.
  lotus_harbor: LOTUS_HARBOR_FACADES,

  // CH.9 ROMANIA — VALEA STELELOR: the painted village (the emotional heart). AUTHORED
  // painted-Romanian-village facades — a folk-flower-trimmed house, a wooden Orthodox
  // church, a two-story han (inn), a shop, a humble cottage, a timber barn, a water mill,
  // and the star-festival pavilion. Low and hand-painted, never a city.
  valea: VALEA_FACADES,

  // CH.10 ALASKA — AURORA STATION: a cold utilitarian outpost, claustrophobic. Steel
  // warehouses, an office block, a civic comms hall, a bank window — cyan/blue/paper/
  // night, frozen and functional.
  aurora: AURORA_FACADES,
  // CH.10 HAWAII — MAUNA LANI: a launch-pad resort that reads claustrophobic (true to
  // life — §B4). Lush shops/cafes, a market, a beach hotel — grass/cyan/gold/orange.
  mauna_lani: MAUNA_LANI_FACADES,
  // CH.10 MARS — THE SEA OF SILENCE: dread, alien, sparse. Neon husks, a dead theater
  // marquee, a department ruin + the lone NIGHT needle colossus — night/purple/magenta,
  // the music thinning as you pass.
  mars: [...MARS_FACADES, 'bldg_colossus_needle'],
};

/**
 * THE CANON AREA LIST — every named §A5/§A6 settlement area that owns an AREA_SKINS
 * slice. The validator pins AREA_SKINS ⇄ this list BOTH directions (ADR-066): a new
 * chapter cannot forget its slice, and a slice cannot orphan a place that doesn't
 * exist. Add a place here AND give it a roster above, in the same change.
 */
export const CANON_AREAS: readonly string[] = [
  'otterbrook', 'brickton', 'cage_park', 'golf_resort', 'puerto_sol',
  'foggybottom', 'wintermoor', 'kvisthavn', 'lilleby', 'minimus', 'zanzibel',
  'chandrapore', 'lotus_harbor', 'valea', 'aurora', 'mauna_lani', 'mars',
];

/**
 * Bespoke facade sprites used by AREA_SKINS that are drawn outside the generated
 * catalog + SHIPPED_DIMS (the golf_resort mansions/gatehouse are drawHouse art, not
 * drawCityBuilding facades). The validator allows these alongside BUILDING_DIMS so a
 * roster can name a real, registered sprite that simply doesn't carry city dims.
 */
export const BESPOKE_AREA_FACADES: readonly string[] = [
  'mansion_a', 'mansion_b', 'mansion_c', 'golf_gatehouse',
  ...KVISTHAVN_FACADES, ...LILLEBY_FACADES, ...MINIMUS_FACADES, ...ZANZIBEL_FACADES,
  ...LOTUS_HARBOR_FACADES, ...VALEA_FACADES, ...AURORA_FACADES, ...MAUNA_LANI_FACADES,
  ...MARS_FACADES,
];

/**
 * ADR-051/099 — LANDMARK FACADES: hand-placed drawHouse props (the golf resort's
 * grand clubhouse, its gatehouse, and the three mansions) that must COLLIDE AS THEIR
 * REAL DRAWN FOOTPRINT, not their hand-coded data solid. The clubhouse_grand is a
 * tall 8×3 house carrying only a 30px data band, so its lower body had no collision
 * (the user's "walk straight through the walls") and its doorstep sat too deep (you
 * walked through the drawn door before the transition fired). The OverworldScene
 * routes these through the SAME texture-derived solid + entrance rebuild that every
 * `bldg_*` facade gets (ADR-051) — collision == footprint minus the doorway, the
 * entrance at the drawn door's mouth. (City Hall is a `bldg_` facade already.)
 *
 * The door-less Ch.1–2 cottages join here too: their hand-tuned data solids DID
 * drift — the drawn bodies are ~310–350px wide but the solids were ~200–264, so
 * you could walk through the right side. Texture-derived collision matches the
 * drawn footprint on every map. (house_rex is enterable, so it keeps a corrected
 * data solid + door zone instead — routing it here would move its door box/glow.)
 */
export const LANDMARK_FACADE_SPRITES: ReadonlySet<string> = new Set([
  'clubhouse_grand', 'golf_gatehouse', 'mansion_a', 'mansion_b', 'mansion_c',
  'house_chad', 'house_a', 'house_b',
  // The Valle Dorado set joined the hi-res promotion (2026-07) — the new art is
  // wider than the old hand-tuned data solids (e.g. valle_shop draws 102 native
  // px over a 82px solid), so route them through the same texture-derived
  // rebuild. The three enterable ones keep working: the entrance box derives
  // from door.ox against the DRAWN body (maps_ch2.ts carries door.ox re-measured
  // for the hi-res art).
  'valle_shop', 'valle_clinic', 'valle_chapel', 'valle_house', 'valle_house_b',
  // The Otterbrook hi-res storefronts (chapel/drugstore/arcade) outgrew their old
  // ×1-era data solids — the drawn art is 30–100px wider/taller than s(solid), so
  // their lower body + flanks were walk-through. Route them through the same
  // texture-derived collision + entrance rebuild (their door.ox was re-measured to
  // the drawn, centred door — mirrors the valle_* enterable set above).
  'chapel', 'drugstore', 'arcade',
  // World Overhaul S5 — the POLICE facade (facade_otter_station) is re-authored
  // hi-res and hand-placed on the rebuilt town; its drawn body is wider than the
  // old placeFacade data solid, so route it through texture-true collision + the
  // entrance rebuild (its door.ox is centred against the drawn front, like the
  // other authored storefronts above).
  'facade_otter_station',
  // The authored 'facade_busdepot' art (the BUS DEPOT marquee facade) is finally
  // placed on the Otterbrook depot (was the generic bldg_brickmore) — route it
  // through texture-true collision + entrance like the other authored storefronts.
  // (facade_busdepot_open is a runtime door-open swap, never a placed prop, so it
  // stays out of this set — the no-orphan test enforces that.)
  'facade_busdepot',
  // 2026-07-08 Maple St block — OTTERBROOK REALTY (enterable office), BERT'S USED
  // CARS (door-less lot), the Main St gas pumps + hardware store (door-less, but
  // their drawn bodies outgrow the data solids like every authored storefront),
  // and 27 MAPLE (house_maple — the for-sale house's flag-gated door): all routed
  // through texture-derived collision + the entrance rebuild.
  'facade_realty', 'facade_autolot', 'facade_fillshop', 'facade_hardware', 'house_maple',
  // EB SCALE PASS (2026-07-11) — the downtown BACK-RANK skyline masses (storey-
  // band-cloned talls, tools/derive-tall-facades.ts). Deliberately NON-'bldg_'
  // keys: they are doorless scenery volumes and must not be grafted into
  // occupyCity housing units (the 27-Maple rule).
  'facade_apartments_tall', 'facade_hotel_tall',
  // EB POLISH ROLLOUT — TWOTON (2026-07-11): the Twoton back rank clones its own
  // brick vernacular (brickmore/brownstone bands) — same non-'bldg_' scenery rule.
  'facade_brickmore_tall', 'facade_brownstone_tall',
]);
