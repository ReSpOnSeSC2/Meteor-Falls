import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import { DEALERSHIP } from './dealership';
import { LIVE_PROPERTIES, PROPERTIES } from './properties';
import { formalCityFacadeSource } from './formal_city_scale';
import { CHAPTER_MANIFESTS } from './chapters';
import { DIALOGUE } from './dialogue';
import {
  CITY_AMENITIES,
  CITY_AMENITY_MARKER_SPRITES,
  CITY_SERVICE_NPC_PREFIX,
  FORMAL_CITY_IDS,
  cityAmenitySignId,
  cityHotelRoomId,
  cityServiceForNpc,
  cityServiceNpcId,
  type FormalCityId,
  type GeneratedCityAmenityRole,
} from './city_amenities';

const mapWithNpc = (npcId: string) =>
  Object.values(MAPS).find((map) => map.npcs.some((npc) => npc.id === npcId));

const npcOccurrences = (npcId: string) =>
  Object.values(MAPS).flatMap((map) => map.npcs.filter((npc) => npc.id === npcId).map(() => map.id));

const amenityInterior = (cityId: FormalCityId, role: GeneratedCityAmenityRole) => {
  const amenity = CITY_AMENITIES[cityId];
  if (role === 'hotel' && amenity.hotel.existing) return MAPS[amenity.hotel.existing.lobbyId];
  const npcRole = ({
    home: 'home_host',
    agency: 'realtor',
    dealership: 'dealer',
    hotel: 'hotel_clerk',
  } as const)[role];
  return mapWithNpc(cityServiceNpcId(cityId, npcRole));
};

const amenityFacade = (cityId: FormalCityId, role: GeneratedCityAmenityRole) => {
  const interior = amenityInterior(cityId, role);
  return interior && MAPS[cityId].props.find((prop) => prop.door?.to === interior.id);
};

const hasDoorPath = (from: string, to: string): boolean => {
  const seen = new Set<string>();
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const door of MAPS[id]?.doors ?? []) if (!seen.has(door.to)) queue.push(door.to);
  }
  return false;
};

describe('formal-city amenity registry', () => {
  it('covers exactly the seven maps designated as formal cities', () => {
    const cityMaps = Object.values(MAPS)
      .filter((map) => map.settlement === 'city')
      .map((map) => map.id)
      .sort();
    expect([...FORMAL_CITY_IDS].sort()).toEqual(cityMaps);
    expect(Object.keys(CITY_AMENITIES).sort()).toEqual(cityMaps);
  });

  it.each(FORMAL_CITY_IDS)('%s maps to a live true home and a real featured vehicle', (cityId) => {
    const amenity = CITY_AMENITIES[cityId];
    const property = PROPERTIES[amenity.residential.propertyId];
    expect(property, `${cityId} property exists`).toBeDefined();
    expect(property.kind).toBe('home');
    expect(LIVE_PROPERTIES).toContain(property.id);
    expect(DEALERSHIP[amenity.dealership.featuredVehicleId]).toBeDefined();
    expect(amenity.hotel.rate).toBeGreaterThan(0);
  });

  it.each(FORMAL_CITY_IDS)('%s features stock available on its first chapter visit', (cityId) => {
    const chapter = Object.values(CHAPTER_MANIFESTS).find((manifest) =>
      manifest.settlements.some((settlement) => settlement.id === cityId),
    )?.chapter;
    const car = DEALERSHIP[CITY_AMENITIES[cityId].dealership.featuredVehicleId];
    expect(chapter, `${cityId} belongs to a chapter manifest`).toBeDefined();
    expect(Number(car.band.replace('ch', ''))).toBeLessThanOrEqual(chapter!);
  });

  it('Puerto Sol and Valle Dorado no longer display locked Chapter-3 stock in Chapter 2', () => {
    expect(CITY_AMENITIES.puerto_sol.dealership.featuredVehicleId).toBe('commuter');
    expect(CITY_AMENITIES.valle_dorado.dealership.featuredVehicleId).toBe('commuter');
  });
});

describe('formal-city generated services', () => {
  it.each(FORMAL_CITY_IDS)('%s has one stable home, agency, and dealership service NPC', (cityId) => {
    const roles = ['home_host', 'realtor', 'dealer'] as const;
    for (const role of roles) {
      const npcId = cityServiceNpcId(cityId, role);
      expect(npcId.startsWith(CITY_SERVICE_NPC_PREFIX)).toBe(true);
      expect(npcOccurrences(npcId), `${npcId} occurs exactly once`).toHaveLength(1);
      expect(cityServiceForNpc(npcId)).toEqual({ cityId, role });
    }
  });

  it.each(FORMAL_CITY_IDS)('%s claims existing facade targets instead of adding a service building', (cityId) => {
    const city = MAPS[cityId];
    const facadeTargets = new Set(city.props.flatMap((prop) => (prop.door ? [prop.door.to] : [])));
    for (const role of ['home_host', 'realtor', 'dealer'] as const) {
      const interior = mapWithNpc(cityServiceNpcId(cityId, role));
      expect(interior, `${cityId} ${role} interior`).toBeDefined();
      expect(facadeTargets.has(interior!.id), `${interior!.id} remains a facade-door target`).toBe(true);
      expect(interior!.id === `${cityId}_unit_0` || interior!.id.startsWith(`${cityId}_unit_`) || interior!.id.startsWith('brickton_lot_')).toBe(true);
    }
  });

  it.each(FORMAL_CITY_IDS)('%s services are visually/functionally distinct data maps', (cityId) => {
    const home = mapWithNpc(cityServiceNpcId(cityId, 'home_host'))!;
    const agency = mapWithNpc(cityServiceNpcId(cityId, 'realtor'))!;
    const dealer = mapWithNpc(cityServiceNpcId(cityId, 'dealer'))!;
    expect(new Set([home.id, agency.id, dealer.id]).size).toBe(3);
    expect(home.props.some((prop) => prop.sprite === 'bed')).toBe(true);
    expect(agency.props.some((prop) => prop.sprite === 'prop_rate_board')).toBe(true);
    expect(dealer.props.filter((prop) =>
      prop.sprite === CITY_AMENITIES[cityId].dealership.featuredVehicleId || prop.sprite === 'vehicle_clunker',
    )).toHaveLength(2);
    expect(dealer.grid.some((row) => row.includes('='))).toBe(true);
  });

  it.each(FORMAL_CITY_IDS)('%s has a paid-hotel data contract and reachable room', (cityId) => {
    const hotel = CITY_AMENITIES[cityId].hotel;
    if (hotel.existing) {
      expect(MAPS[hotel.existing.lobbyId]).toBeDefined();
      expect(MAPS[hotel.existing.roomId]).toBeDefined();
      expect(MAPS[hotel.existing.lobbyId].npcs.some((npc) => npc.id === hotel.existing!.clerkNpcId)).toBe(true);
      expect(hasDoorPath(hotel.existing.lobbyId, hotel.existing.roomId)).toBe(true);
      return;
    }

    const clerkId = cityServiceNpcId(cityId, 'hotel_clerk');
    const lobby = mapWithNpc(clerkId);
    const roomId = cityHotelRoomId(cityId);
    expect(npcOccurrences(clerkId)).toHaveLength(1);
    expect(lobby).toBeDefined();
    expect(MAPS[roomId]).toBeDefined();
    expect(lobby!.doors.some((door) => door.to === roomId)).toBe(true);
    expect(MAPS[roomId].doors.some((door) => door.to === lobby!.id)).toBe(true);
  });

  it.each(FORMAL_CITY_IDS)('%s exposes four visible, readable exterior service markers', (cityId) => {
    const city = MAPS[cityId];
    const seen = new Set<string>();
    for (const role of ['home', 'agency', 'dealership', 'hotel'] as const) {
      const dialogueId = cityAmenitySignId(cityId, role);
      const signs = city.signs.filter((sign) => sign.dialogue === dialogueId);
      expect(signs, `${cityId} ${role} has exactly one plaque`).toHaveLength(1);
      const sign = signs[0];
      const marker = city.props.find((prop) =>
        prop.sprite === CITY_AMENITY_MARKER_SPRITES[role] &&
        Math.abs(prop.x - sign.x) < 0.01 &&
        Math.abs(prop.y - (sign.y + 0.35)) < 0.01,
      );
      expect(marker, `${cityId} ${role} has its role silhouette`).toBeDefined();
      expect(marker?.solid, `${cityId} ${role} marker cannot block the doorway`).toBeUndefined();
      const copy = DIALOGUE[dialogueId]?.join(' ') ?? '';
      expect(copy.length, `${dialogueId} resolves to readable copy`).toBeGreaterThan(30);
      const heading = role === 'home'
        ? CITY_AMENITIES[cityId].residential.listingName
        : role === 'agency'
          ? CITY_AMENITIES[cityId].agency.name
          : role === 'dealership'
            ? CITY_AMENITIES[cityId].dealership.name
            : CITY_AMENITIES[cityId].hotel.name;
      expect(copy.toUpperCase(), `${dialogueId} names the actual venue`).toContain(heading.toUpperCase());
      const facade = amenityFacade(cityId, role)!;
      const sx = typeof facade.scale === 'number' ? facade.scale : facade.scale?.x ?? 1;
      const sy = typeof facade.scale === 'number' ? facade.scale : facade.scale?.y ?? 1;
      const doorX = facade.x * 16 + (facade.door!.ox + facade.door!.w / 2) * sx;
      const doorY = facade.y * 16 + (facade.door!.oy + facade.door!.h) * sy + 5;
      expect(
        Math.hypot((sign.x + 0.5) * 16 - doorX, (sign.y + 0.5) * 16 - doorY),
        `${cityId} ${role} marker stays beside its exterior door`,
      ).toBeLessThan(80);
      seen.add(`${sign.x},${sign.y}`);
    }
    expect(seen.size, `${cityId} markers do not stack`).toBe(4);
  });

  it.each(FORMAL_CITY_IDS)('%s prefers role-appropriate source facades without changing targets', (cityId) => {
    const amenity = CITY_AMENITIES[cityId];
    for (const role of ['home', 'agency', 'dealership', 'hotel'] as const) {
      const facade = amenityFacade(cityId, role);
      expect(facade, `${cityId} ${role} exterior`).toBeDefined();
      const source = formalCityFacadeSource(facade!.sprite) ?? facade!.sprite;
      expect(
        amenity.facadeHints[role].some((hint) => source.includes(hint)),
        `${cityId} ${role} uses hinted facade ${source}`,
      ).toBe(true);
    }
  });

  it('Puerto paid stays own a dedicated empty room, not the honeymooners room', () => {
    expect(CITY_AMENITIES.puerto_sol.hotel.existing?.roomId).toBe('hotel_ps_guest_room');
    const room = MAPS.hotel_ps_guest_room;
    expect(room).toBeDefined();
    expect(room.npcs).toHaveLength(0);
    expect(room.props.filter((prop) => prop.sprite === 'bed').length).toBeGreaterThanOrEqual(2);
    expect(room.doors.some((door) => door.to === 'hotel_ps_hall')).toBe(true);
    expect(MAPS.hotel_ps_hall.doors.some((door) => door.to === room.id)).toBe(true);
    expect(MAPS.hotel_ps_room_b.npcs.some((npc) => npc.id === 'gh_honeymoon')).toBe(true);
  });
});

describe('amenity claiming preserves authored city facade order', () => {
  const facadeOrder = (cityId: string) => MAPS[cityId].props
    .filter((prop) => prop.sprite.startsWith('bldg_'))
    .map((prop) => formalCityFacadeSource(prop.sprite) ?? prop.sprite);
  const sourceOrder = (rows: string[]) => rows.map((row) => row.slice(0, row.indexOf('@')));

  it('preserves Puerto Sol building order', () => {
    expect(facadeOrder('puerto_sol')).toEqual(sourceOrder([
      'bldg_ps_mercado@32,11.25', 'bldg_ps_clinic@40,11.25', 'bldg_ps_pension@48,10.25',
      'bldg_ps_museum@56,10.25', 'bldg_ps_casa@65,10.25', 'bldg_ps_casa_b@72,11.25',
      'bldg_ps_deli@70,22.25', 'bldg_ps_pension_b@62,30.25', 'bldg_ps_pension_b@59,39.25',
      'bldg_ps_casa_c@45,47.25', 'bldg_ps_cantina@77,21.25', 'bldg_ps_cantina@71,29.25',
      'bldg_ps_catedral@40,20.25', 'bldg_ps_gran_hotel@67,36.25', 'bldg_ps_aduana@76,37.25',
      'bldg_ps_aduana@86,37.25', 'bldg_gen_market_gold_1@10,45.25', 'bldg_gen_civic_paper_2@19,44.25',
    ]));
  });

  it('preserves Valle Dorado building order', () => {
    expect(facadeOrder('valle_dorado')).toEqual(sourceOrder([
      'bldg_colossus_spire@9,20.25', 'bldg_tower_arms@7,53.25', 'bldg_tower_glass@82,35.25',
      'bldg_tower_corp@83,52.25', 'bldg_gen_bank_paper_3@10,7.25', 'bldg_gen_market_gold_1@19,9.25',
      'bldg_gen_shop_gold_2@28,8.25', 'bldg_gen_civic_paper_3@35,7.25',
      'bldg_gen_market_orange_2@53,8.25', 'bldg_gen_cafe_orange_1@62,9.25',
      'bldg_gen_brownstone_earth_3@69,7.25', 'bldg_gen_brownstone_earth_4@76,6.25',
      'bldg_gen_civic_paper_3@83,7.25', 'bldg_gen_shop_gold_2@83,64.25',
    ]));
  });
});
