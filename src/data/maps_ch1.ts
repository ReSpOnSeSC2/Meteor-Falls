/**
 * Stable Chapter 1 world contract.
 *
 * This module deliberately does not import `MAPS`: it is safe for map assembly,
 * save migration, render tooling, and developer profiles to consume without
 * creating an initialization cycle. Coordinates are authored in the native
 * 16 px map space. Profile/recovery `x`/`y` values are planted player feet;
 * callers apply the runtime art scale exactly once.
 */

export type Ch1Facing = 'up' | 'down' | 'left' | 'right';

export interface Ch1AuthoredPoint {
  readonly mapId: string;
  readonly x: number;
  readonly y: number;
}

export interface Ch1WorldFeet extends Ch1AuthoredPoint {
  readonly tile: Readonly<{ x: number; y: number }>;
  readonly facing: Ch1Facing;
}

const authoredPoint = (mapId: string, x: number, y: number): Ch1AuthoredPoint =>
  Object.freeze({ mapId, x, y });

/** Convert an authored tile to native-pixel player feet. */
export function ch1NativeFeet(
  mapId: string,
  tileX: number,
  tileY: number,
  facing: Ch1Facing,
): Ch1WorldFeet {
  return Object.freeze({
    mapId,
    tile: Object.freeze({ x: tileX, y: tileY }),
    x: tileX * 16 + 8,
    y: tileY * 16 + 12,
    facing,
  });
}

/** Intentional render/audit groups; flattening them is the exact owned roster. */
export const CH1_MAP_GROUPS = {
  world: [
    'otterbrook',
    'oak_roots',
    'oak_hollow',
    'oak_heart',
    'meadow_mile',
    'meadow_woods',
    'meadow_far',
    'meadow_overpass',
    'bus_interior',
    'brickton',
    'cage_park',
    'the_cage',
  ],
  otterHomes: [
    'rex_home',
    'rex_hall',
    'rex_bedroom',
    'ana_room',
    'vivi_room',
    'chad_home',
    'otter_home_sodd',
    'otter_home_birch',
    'otter_home_pond',
    'maple27_int',
    'oldman_int',
    'workshop_int',
    'trail_shed_int',
  ],
  otterPublic: [
    'bus_depot_int',
    'otterbrook_cityhall',
    'otter_station',
    'otter_clinic_int',
    'otter_clinic_exam',
    'diner_int',
    'diner_kitchen',
    'burger_int',
    'bank_int',
    'bank_vault',
    'hardware_int',
    'hardware_stockroom',
    'bakery_int',
    'drugstore_int',
    'drugstore_pharmacy',
    'arcade_int',
    'arcade_service',
    'realty_int',
    'chapel_int',
  ],
  otterHotel: [
    'otter_hotel_lobby',
    'otter_hotel_hall',
    'otter_hotel_room_201',
    'otter_hotel_room_202',
    'otter_hotel_room_203',
  ],
  otterGenerated: [
    'otterbrook_unit_0',
    'otterbrook_unit_1',
    'otterbrook_unit_2',
    'otterbrook_unit_3',
    'otterbrook_unit_4',
    'otterbrook_unit_5',
    'otterbrook_unit_6',
    'otterbrook_unit_7',
    'otterbrook_unit_8',
    'otterbrook_unit_9',
  ],
  bricktonPublic: [
    'twoton_hotel_lobby',
    'twoton_hotel_hall',
    'twoton_hotel_room',
    'hospital_int',
    'hospital_f2',
    'hospital_f3',
    'twoton_community_center',
    'twoton_bus_station',
    'starmart_int',
    'arcade2_int',
    'twoton_theater',
    'twoton_bike_shop',
    'twoton_pizza',
  ],
  bricktonGenerated: [
    'brickton_lot_5700_725',
    'brickton_lot_1500_5025',
    'brickton_lot_7100_5025',
    'brickton_lot_5100_6325',
    'brickton_lot_5900_6225',
    'brickton_lot_6700_6325',
  ],
  department: ['dos_f1', 'dos_f2', 'dos_f3'],
} as const;

export const CH1_OWNED_MAP_IDS = Object.freeze(
  Object.values(CH1_MAP_GROUPS).flat(),
) as readonly Ch1OwnedMapId[];

export type Ch1OwnedMapId = (typeof CH1_MAP_GROUPS)[keyof typeof CH1_MAP_GROUPS][number];

/** Save-facing generated identities. Never derive these from current occupancy. */
export const CH1_GENERATED_OTTERBROOK_UNIT_IDS = CH1_MAP_GROUPS.otterGenerated;

export interface Ch1MapDimensions {
  readonly width: number;
  readonly height: number;
}

const dims = (width: number, height: number): Ch1MapDimensions => Object.freeze({ width, height });

/** Post-assembly dimensions (after roomy-interior growth and living-city fill). */
export const CH1_MAP_DIMENSIONS = Object.freeze({
  otterbrook: dims(112, 198),
  oak_roots: dims(36, 52),
  oak_hollow: dims(30, 26),
  oak_heart: dims(28, 30),
  meadow_mile: dims(16, 40),
  meadow_woods: dims(16, 36),
  meadow_far: dims(16, 38),
  meadow_overpass: dims(16, 34),
  bus_interior: dims(22, 9),
  brickton: dims(104, 84),
  cage_park: dims(26, 22),
  the_cage: dims(40, 30),
  rex_home: dims(14, 10),
  rex_hall: dims(16, 7),
  rex_bedroom: dims(16, 11),
  ana_room: dims(16, 11),
  vivi_room: dims(16, 11),
  chad_home: dims(16, 11),
  otter_home_sodd: dims(16, 11),
  otter_home_birch: dims(16, 11),
  otter_home_pond: dims(16, 11),
  maple27_int: dims(16, 11),
  oldman_int: dims(16, 11),
  workshop_int: dims(18, 11),
  trail_shed_int: dims(14, 12),
  bus_depot_int: dims(19, 13),
  otterbrook_cityhall: dims(26, 16),
  otter_station: dims(24, 16),
  otter_clinic_int: dims(16, 11),
  otter_clinic_exam: dims(12, 9),
  diner_int: dims(16, 11),
  diner_kitchen: dims(16, 11),
  burger_int: dims(16, 11),
  bank_int: dims(16, 11),
  bank_vault: dims(14, 10),
  hardware_int: dims(16, 11),
  hardware_stockroom: dims(16, 11),
  bakery_int: dims(16, 11),
  drugstore_int: dims(16, 11),
  drugstore_pharmacy: dims(16, 11),
  arcade_int: dims(16, 11),
  arcade_service: dims(16, 11),
  realty_int: dims(16, 11),
  chapel_int: dims(16, 11),
  otter_hotel_lobby: dims(18, 12),
  otter_hotel_hall: dims(22, 10),
  otter_hotel_room_201: dims(12, 9),
  otter_hotel_room_202: dims(12, 9),
  otter_hotel_room_203: dims(12, 9),
  otterbrook_unit_0: dims(13, 13),
  otterbrook_unit_1: dims(15, 13),
  otterbrook_unit_2: dims(13, 15),
  otterbrook_unit_3: dims(13, 13),
  otterbrook_unit_4: dims(15, 13),
  otterbrook_unit_5: dims(20, 9),
  otterbrook_unit_6: dims(13, 13),
  otterbrook_unit_7: dims(15, 13),
  otterbrook_unit_8: dims(15, 13),
  otterbrook_unit_9: dims(15, 13),
  twoton_hotel_lobby: dims(20, 12),
  twoton_hotel_hall: dims(20, 10),
  twoton_hotel_room: dims(12, 9),
  hospital_int: dims(20, 12),
  hospital_f2: dims(20, 12),
  hospital_f3: dims(20, 12),
  twoton_community_center: dims(22, 14),
  twoton_bus_station: dims(21, 13),
  starmart_int: dims(17, 11),
  arcade2_int: dims(16, 11),
  twoton_theater: dims(24, 16),
  twoton_bike_shop: dims(18, 12),
  twoton_pizza: dims(20, 14),
  brickton_lot_5700_725: dims(13, 13),
  brickton_lot_1500_5025: dims(11, 9),
  brickton_lot_7100_5025: dims(15, 9),
  brickton_lot_5100_6325: dims(13, 13),
  brickton_lot_5900_6225: dims(13, 15),
  brickton_lot_6700_6325: dims(11, 13),
  dos_f1: dims(40, 26),
  dos_f2: dims(48, 32),
  dos_f3: dims(42, 28),
} satisfies Record<Ch1OwnedMapId, Ch1MapDimensions>);

/**
 * `brickton_docks` is physically walkable from Brickton during Chapter 1, but
 * its content/travel ownership begins in Chapter 2. Keep that boundary explicit
 * instead of silently counting the pier in both chapters.
 */
export const CH1_BOUNDARY_MAPS = Object.freeze({
  brickton_docks: Object.freeze({
    ownerChapter: 2,
    walkableBeforeChapter1Complete: true,
    dimensions: dims(30, 18),
  }),
} as const);

/** Map ids removed from live assembly whose old saves need deterministic rescue. */
export const CH1_RETIRED_MAP_IDS = [
  'downtown_otterbrook',
  'hill_road',
  'hickory_trail',
  'whisperwood_rise',
  'hickory_hill',
] as const;

/** Stable high-risk coordinates shared by authored data, tests, migrations, and profiles. */
export const CH1_WORLD = Object.freeze({
  recovery: ch1NativeFeet('otterbrook', 56, 100, 'down'),
  profiles: Object.freeze({
    bedroom: ch1NativeFeet('rex_bedroom', 4, 5, 'down'),
    opening: ch1NativeFeet('otterbrook', 75, 13, 'down'),
    crater: ch1NativeFeet('otterbrook', 68, 10, 'right'),
    porch: ch1NativeFeet('otterbrook', 49, 57, 'up'),
    tickCave: ch1NativeFeet('oak_heart', 14, 10, 'up'),
    meadow: ch1NativeFeet('meadow_mile', 7, 3, 'down'),
    meadowMile: ch1NativeFeet('meadow_mile', 7, 3, 'down'),
    meadowWoods: ch1NativeFeet('meadow_woods', 7, 3, 'down'),
    meadowFar: ch1NativeFeet('meadow_far', 6, 3, 'down'),
    meadowOverpass: ch1NativeFeet('meadow_overpass', 8, 3, 'down'),
    orientation: ch1NativeFeet('meadow_overpass', 8, 30, 'down'),
    bus: ch1NativeFeet('bus_interior', 18, 6, 'right'),
    brickton: ch1NativeFeet('brickton', 48, 18, 'down'),
    bricktonArrival: ch1NativeFeet('brickton', 74, 3, 'down'),
    dos: ch1NativeFeet('dos_f1', 20, 24, 'up'),
    dosF1: ch1NativeFeet('dos_f1', 20, 24, 'up'),
    dosF2: ch1NativeFeet('dos_f2', 4, 3, 'down'),
    dosF3: ch1NativeFeet('dos_f3', 39, 3, 'down'),
    faye: ch1NativeFeet('dos_f3', 10, 6, 'left'),
    manager: ch1NativeFeet('dos_f3', 28, 4, 'right'),
    payphone: ch1NativeFeet('brickton', 57, 20, 'right'),
  }),
  quest: Object.freeze({
    lemonadeStand: authoredPoint('otterbrook', 62, 57.2),
    ana: authoredPoint('otterbrook', 61, 58),
    vivi: authoredPoint('otterbrook', 65, 58),
    biscuitClue1: authoredPoint('otterbrook', 21, 43),
    biscuitClue2: authoredPoint('otterbrook', 17, 40),
    hillSpring: authoredPoint('otterbrook', 57, 52),
    pajamaKid: authoredPoint('otterbrook', 34, 94),
    pigeonKid: authoredPoint('brickton', 30, 54),
  }),
} as const);
