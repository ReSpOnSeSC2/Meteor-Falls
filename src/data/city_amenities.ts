/**
 * Canonical, data-only amenity contract for the seven formal cities.
 *
 * `occupyCity` uses this registry to claim otherwise generated storefronts
 * without changing facade order or the existing generated interior IDs.
 * Runtime interaction handlers can resolve stable service NPC IDs through
 * `CITY_SERVICE_NPC_LOOKUP` rather than inspecting map names or coordinates.
 */

export const FORMAL_CITY_IDS = [
  'brickton',
  'puerto_sol',
  'valle_dorado',
  'minimus_major',
  'zanzibel',
  'chandrapore',
  'lotus_harbor',
] as const;

export type FormalCityId = (typeof FORMAL_CITY_IDS)[number];

export const CITY_SERVICE_ROLES = [
  'home_host',
  'realtor',
  'dealer',
  'hotel_clerk',
] as const;

export type CityServiceRole = (typeof CITY_SERVICE_ROLES)[number];
export type GeneratedCityAmenityRole = 'home' | 'agency' | 'dealership' | 'hotel';

/** A small, collision-free street marker accompanies every service plaque. The
 * silhouettes stay deliberately familiar: mailbox=open house, newspaper box=
 * listings, meter=motor court, wooden shingle=hotel. */
export const CITY_AMENITY_MARKER_SPRITES: Readonly<Record<GeneratedCityAmenityRole, string>> = {
  home: 'mailbox',
  agency: 'news_box',
  dealership: 'parking_meter',
  hotel: 'sign',
};

export const CITY_SERVICE_NPC_PREFIX = 'citysvc_' as const;

export function cityServiceNpcId(cityId: FormalCityId, role: CityServiceRole): string {
  return `${CITY_SERVICE_NPC_PREFIX}${cityId}_${role}`;
}

export function cityHotelRoomId(cityId: FormalCityId): string {
  return `${CITY_SERVICE_NPC_PREFIX}${cityId}_hotel_room`;
}

export function cityAmenitySignId(cityId: FormalCityId, role: GeneratedCityAmenityRole): string {
  return `${CITY_SERVICE_NPC_PREFIX}sign_${cityId}_${role}`;
}

export interface ExistingCityHotelRef {
  /** Hand-authored lobby retained as the canonical paid-hotel entrance. */
  lobbyId: string;
  /** Hand-authored room used after a successful stay transaction. */
  roomId: string;
  /** Existing clerk ID; intentionally not rewritten to the citysvc_ prefix. */
  clerkNpcId: string;
}

export interface CityAmenityDef {
  cityId: FormalCityId;
  residential: {
    propertyId: string;
    listingName: string;
  };
  agency: {
    name: string;
  };
  dealership: {
    name: string;
    featuredVehicleId: string;
  };
  hotel: {
    name: string;
    rate: number;
    existing?: ExistingCityHotelRef;
  };
  /** Ordered source-sprite fragments used to claim a semantically plausible
   * existing facade without adding, deleting, or reordering a building prop. */
  facadeHints: Readonly<Record<GeneratedCityAmenityRole, readonly string[]>>;
}

export const CITY_AMENITIES: Record<FormalCityId, CityAmenityDef> = {
  brickton: {
    cityId: 'brickton',
    residential: { propertyId: 'twoton_house', listingName: 'Civic Lane House' },
    agency: { name: 'Twoton Realty & Keys' },
    dealership: { name: 'Second Wind Auto Hall', featuredVehicleId: 'commuter' },
    hotel: {
      name: 'Twoton Hotel',
      rate: 45,
      existing: {
        lobbyId: 'twoton_hotel_lobby',
        roomId: 'twoton_hotel_room',
        clerkNpcId: 'twoton_hotel_clerk',
      },
    },
    facadeHints: {
      home: ['apartments', 'brownstone', 'brickmore'],
      agency: ['brickmore', 'bagels'],
      dealership: ['market'],
      hotel: ['ob_hotel'],
    },
  },
  puerto_sol: {
    cityId: 'puerto_sol',
    residential: { propertyId: 'casa_del_sol', listingName: 'Casa del Sol' },
    agency: { name: 'Costa Clara Realty' },
    dealership: { name: 'Sunwheel Motors', featuredVehicleId: 'commuter' },
    hotel: {
      name: 'Grand Hotel Puerto Sol',
      rate: 60,
      existing: {
        lobbyId: 'hotel_ps_lobby',
        roomId: 'hotel_ps_guest_room',
        clerkNpcId: 'gh_clerk',
      },
    },
    facadeHints: {
      home: ['ps_casa', 'ps_pension'],
      agency: ['ps_aduana', 'gen_civic', 'ps_pension'],
      dealership: ['gen_market', 'ps_cantina', 'ps_aduana'],
      hotel: ['ps_gran_hotel'],
    },
  },
  valle_dorado: {
    cityId: 'valle_dorado',
    residential: { propertyId: 'valle_dorado_home', listingName: 'Casa de la Estrella' },
    agency: { name: 'Golden Valley Properties' },
    dealership: { name: 'Avenida Motor Salon', featuredVehicleId: 'commuter' },
    hotel: { name: 'Hotel Estrella', rate: 75 },
    facadeHints: {
      home: ['brownstone'],
      agency: ['tower_corp', 'gen_bank', 'gen_civic'],
      dealership: ['tower_arms', 'gen_shop', 'gen_market'],
      hotel: ['tower_glass', 'gen_cafe'],
    },
  },
  minimus_major: {
    cityId: 'minimus_major',
    residential: { propertyId: 'minimus_manor', listingName: 'Minimus Manor' },
    agency: { name: 'Major & Minor Estates' },
    dealership: { name: 'Little Wheel Motorworks', featuredVehicleId: 'old_reliable' },
    hotel: { name: 'The Major Rest', rate: 85 },
    facadeHints: {
      home: ['minimus_manor'],
      agency: ['minimus_cathedral'],
      dealership: ['minimus_petit_market'],
      hotel: ['minimus_thimble_inn'],
    },
  },
  zanzibel: {
    cityId: 'zanzibel',
    residential: { propertyId: 'zanzibel_courtyard', listingName: 'Indigo Courtyard House' },
    agency: { name: 'Baobab Keys & Land' },
    dealership: { name: 'Caravan Road Motors', featuredVehicleId: 'big_block' },
    hotel: { name: 'Indigo Caravanserai', rate: 95 },
    facadeHints: {
      home: ['zanzibel_home'],
      agency: ['zanzibel_indigo_dyer'],
      dealership: ['zanzibel_home'],
      hotel: ['zanzibel_caravanserai'],
    },
  },
  chandrapore: {
    cityId: 'chandrapore',
    residential: { propertyId: 'hillcrest_manor', listingName: 'Hillcrest Manor' },
    agency: { name: 'Moon Gate Realty' },
    dealership: { name: 'Monsoon Motor Gallery', featuredVehicleId: 'drop_top' },
    hotel: { name: 'The Silver Parasol', rate: 105 },
    facadeHints: {
      home: ['zanzibel_caravanserai'],
      agency: ['zanzibel_investment_desk'],
      dealership: ['zanzibel_investment_desk'],
      hotel: ['zanzibel_harbor_customs'],
    },
  },
  lotus_harbor: {
    cityId: 'lotus_harbor',
    residential: { propertyId: 'lotus_townhouse', listingName: 'Lotus Row Townhouse' },
    agency: { name: 'Lotus Harbor Homes' },
    dealership: { name: 'Neon Crane Auto Salon', featuredVehicleId: 'the_stretch' },
    hotel: { name: 'Lotus Lantern Hotel', rate: 120 },
    facadeHints: {
      home: ['lotus_harbor_tea_house'],
      agency: ['lotus_harbor_lantern_shop'],
      dealership: ['lotus_harbor_temple'],
      hotel: ['lotus_harbor_tea_house'],
    },
  },
};

export interface CityServiceNpcBinding {
  cityId: FormalCityId;
  role: CityServiceRole;
}

/** Stable NPC -> service binding consumed by future interaction handlers. */
export const CITY_SERVICE_NPC_LOOKUP: Readonly<Record<string, CityServiceNpcBinding>> =
  Object.fromEntries(
    FORMAL_CITY_IDS.flatMap((cityId) =>
      CITY_SERVICE_ROLES.map((role) => [cityServiceNpcId(cityId, role), { cityId, role }] as const),
    ),
  );

export function cityServiceForNpc(npcId: string): CityServiceNpcBinding | undefined {
  return CITY_SERVICE_NPC_LOOKUP[npcId];
}
