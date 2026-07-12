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

/** Amenity settlements are broader than formal cities. Foggybottom remains a
 * town in the world taxonomy while opting into the same real service domains. */
export const AMENITY_TOWN_IDS = ['foggybottom'] as const;
export const AMENITY_SETTLEMENT_IDS = [...FORMAL_CITY_IDS, ...AMENITY_TOWN_IDS] as const;
export type AmenitySettlementId = (typeof AMENITY_SETTLEMENT_IDS)[number];

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

export function cityServiceNpcId(cityId: AmenitySettlementId, role: CityServiceRole): string {
  return `${CITY_SERVICE_NPC_PREFIX}${cityId}_${role}`;
}

export function cityHotelRoomId(cityId: AmenitySettlementId): string {
  return `${CITY_SERVICE_NPC_PREFIX}${cityId}_hotel_room`;
}

export function cityAmenitySignId(cityId: AmenitySettlementId, role: GeneratedCityAmenityRole): string {
  return `${CITY_SERVICE_NPC_PREFIX}sign_${cityId}_${role}`;
}

export interface ExistingCityHotelRef {
  /** Hand-authored lobby retained as the canonical paid-hotel entrance. */
  lobbyId: string;
  /** Hand-authored room used after a successful stay transaction. */
  roomId: string;
  /** Existing clerk ID; intentionally not rewritten to the citysvc_ prefix. */
  clerkNpcId: string;
  /** Optional authored arrival inside a multi-use room, in native map pixels. */
  roomSpawn?: { x: number; y: number; facing: 'left' | 'right' | 'up' | 'down' };
}

export interface AmenityDeliveryBase {
  area: string;
  /** Authored native-world pixels; the overworld applies the runtime scale. */
  x: number;
  y: number;
  facing: 'left' | 'right' | 'up' | 'down';
}

export interface CityAmenityDef<Id extends AmenitySettlementId = FormalCityId> {
  cityId: Id;
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
    /** Physical display stock used by an authored showroom interior. */
    displayVehicleIds?: readonly string[];
    /** Canonical station whose fuels and regional price the service desk uses. */
    stationId?: string;
    /** One explicit outdoor curb point; the vehicle domain allocates free bays
     * around it so repeated deliveries cannot stack. */
    deliveryBase?: AmenityDeliveryBase;
  };
  hotel: {
    name: string;
    rate: number;
    existing?: ExistingCityHotelRef;
  };
  /** Ordered source-sprite fragments used to claim a semantically plausible
   * existing facade without adding, deleting, or reordering a building prop. */
  facadeHints: Readonly<Record<GeneratedCityAmenityRole, readonly string[]>>;
  /** Existing generated interiors claimed without adding or renumbering maps. */
  serviceUnits?: Partial<Readonly<Record<GeneratedCityAmenityRole, string>>>;
}

export const CITY_AMENITIES: Record<FormalCityId, CityAmenityDef> = {
  brickton: {
    cityId: 'brickton',
    residential: { propertyId: 'twoton_house', listingName: 'Civic Lane House' },
    agency: { name: 'Twoton Realty & Keys' },
    dealership: { name: 'Second Wind Auto Hall', featuredVehicleId: 'commuter', stationId: 'brickton_fillup' },
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
    dealership: { name: 'Sunwheel Motors', featuredVehicleId: 'commuter', stationId: 'puerto_sol_bomba' },
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
    dealership: { name: 'Avenida Motor Salon', featuredVehicleId: 'commuter', stationId: 'puerto_sol_bomba' },
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
    dealership: { name: 'Little Wheel Motorworks', featuredVehicleId: 'old_reliable', stationId: 'minimus_thimble' },
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
    dealership: { name: 'Caravan Road Motors', featuredVehicleId: 'big_block', stationId: 'zanzibel_pump' },
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
    dealership: { name: 'Monsoon Motor Gallery', featuredVehicleId: 'drop_top', stationId: 'chandrapore_filling' },
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
    dealership: { name: 'Neon Crane Auto Salon', featuredVehicleId: 'the_stretch', stationId: 'lotus_harbor_dock' },
    hotel: { name: 'Lotus Lantern Hotel', rate: 120 },
    facadeHints: {
      home: ['lotus_harbor_tea_house'],
      agency: ['lotus_harbor_lantern_shop'],
      dealership: ['lotus_harbor_temple'],
      hotel: ['lotus_harbor_tea_house'],
    },
  },
};

export const FOGGYBOTTOM_AMENITY: CityAmenityDef<'foggybottom'> = {
  cityId: 'foggybottom',
  residential: { propertyId: 'foggybottom_flat', listingName: 'No. 9, Foggybottom' },
  agency: { name: 'Foggybottom Keys & Property' },
  dealership: {
    name: 'Tyne Motor Works',
    featuredVehicleId: 'city_ev',
    displayVehicleIds: ['city_ev', 'work_van'],
    stationId: 'foggybottom_petrol',
    // The curb directly below unit_0's high-street door, expressed in native px.
    // The interior returns at (88,325); the delivery bay is one step below it.
    deliveryBase: { area: 'foggybottom', x: 88, y: 349, facing: 'right' },
  },
  hotel: {
    name: 'The Kettle',
    rate: 55,
    existing: {
      lobbyId: 'kettle_taproom',
      roomId: 'kettle_snug',
      clerkNpcId: 'kettle_keeper',
      roomSpawn: { x: 22 * 16 + 8, y: 10 * 16 + 12, facing: 'up' },
    },
  },
  facadeHints: {
    home: ['brownstone_earth'],
    agency: ['civic_paper'],
    dealership: ['civic_cyan'],
    hotel: ['fb_kettle'],
  },
  serviceUnits: {
    dealership: 'foggybottom_unit_0',
    home: 'foggybottom_unit_1',
    agency: 'foggybottom_unit_2',
  },
};

/** Runtime-facing amenity registry. CITY_AMENITIES deliberately remains the
 * exact seven-city contract used by formal-city generation and validation. */
export const SETTLEMENT_AMENITIES: Readonly<
  Record<AmenitySettlementId, CityAmenityDef<AmenitySettlementId>>
> = {
  ...CITY_AMENITIES,
  foggybottom: FOGGYBOTTOM_AMENITY,
};

export interface CityServiceNpcBinding {
  cityId: AmenitySettlementId;
  role: CityServiceRole;
}

/** Stable NPC -> service binding consumed by future interaction handlers. */
export const CITY_SERVICE_NPC_LOOKUP: Readonly<Record<string, CityServiceNpcBinding>> =
  Object.fromEntries(
    [
      ...AMENITY_SETTLEMENT_IDS.flatMap((cityId) =>
        CITY_SERVICE_ROLES.map((role) => [cityServiceNpcId(cityId, role), { cityId, role }] as const),
      ),
      // The Kettle predates citysvc_* IDs; retain its canonical NPC save/dialogue ID.
      ['kettle_keeper', { cityId: 'foggybottom', role: 'hotel_clerk' }] as const,
    ],
  );

export function cityServiceForNpc(npcId: string): CityServiceNpcBinding | undefined {
  return CITY_SERVICE_NPC_LOOKUP[npcId];
}
