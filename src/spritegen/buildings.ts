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

/** select catalog sprite names by family (and optionally a ramp filter) */
export function skinsFor(families: readonly string[], ramps?: readonly number[]): string[] {
  return CITY_CATALOG.filter(
    (e) => families.includes(e.family) && (!ramps || ramps.includes(e.ramp)),
  ).map((e) => e.name);
}

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
};
