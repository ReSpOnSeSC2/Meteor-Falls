/**
 * Purpose-built TWOTON service interiors.
 *
 * The compact 104x84 exterior remains editor-authored (`maps_twoton.ts`). These rooms
 * deliberately live in code because their reciprocal landings and activities
 * are runtime contracts: the exterior wrapper grafts stable facade doors, then
 * `maps.ts` supplies the computed street doorsteps below.
 *
 * The six venues fill the largest Twoson-shaped gaps without touching the
 * Department of Smiles, Twoton General, or their story flags:
 *   - a working hotel (lobby -> elevator -> hall -> guest room),
 *   - a full bus-station concourse using the existing 6:15 trigger,
 *   - the Orpheum as a two-zone lobby/auditorium,
 *   - a combined community center and preschool,
 *   - a bicycle shop whose BMX plugs into the save-backed garage system,
 *   - a staffed pizza counter with a visible working kitchen.
 */
import { Grid } from './mapkit';
import type { MapDef } from '../schemas';

export interface TwotonServiceSteps {
  hotel: { tx: number; ty: number };
  bus: { tx: number; ty: number };
  theater: { tx: number; ty: number };
  community: { tx: number; ty: number };
  bike: { tx: number; ty: number };
  pizza: { tx: number; ty: number };
}

const COUNTER_SOLID = { ox: 0, oy: 4, w: 30, h: 14 } as const;
const BENCH_SOLID = { ox: 1, oy: 6, w: 20, h: 6 } as const;
const PLANT_SOLID = { ox: 3, oy: 14, w: 8, h: 7 } as const;

export function buildTwotonHotelLobby(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(20, 12, 'w');
  g.rect(0, 0, 20, 2, 'W');
  g.rect(8, 4, 4, 7, 'r');
  return {
    id: 'twoton_hotel_lobby',
    name: 'TWOTON HOTEL',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'mailboxes', x: 1, y: 0.5, solid: { ox: 0, oy: 20, w: 40, h: 12 } },
      { sprite: 'counter', x: 3, y: 3, solid: COUNTER_SOLID },
      { sprite: 'counter', x: 5, y: 3, solid: COUNTER_SOLID },
      { sprite: 'floor_lamp', x: 8, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bench', x: 13, y: 5, solid: BENCH_SOLID },
      { sprite: 'bench', x: 15.5, y: 5, solid: BENCH_SOLID },
      { sprite: 'rocking_chair', x: 14, y: 8, solid: { ox: 2, oy: 12, w: 14, h: 10 } },
      { sprite: 'plant_pot', x: 18, y: 8, solid: PLANT_SOLID },
      { sprite: 'atm', x: 1, y: 10, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
      { sprite: 'payphone', x: 18, y: 10, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'twoton_hotel_clerk', sprite: 'npc_clerk', x: 4, y: 2, facing: 'down', dialogue: 'npc_twoton_hotel_clerk', idle: true },
      { id: 'twoton_hotel_guest', sprite: 'grayCommuter', x: 15, y: 7, facing: 'up', dialogue: 'npc_twoton_hotel_guest', idle: true, emote: 'think' },
    ],
    signs: [
      { x: 1, y: 1, dialogue: 'twoton_hotel_keys' },
      { x: 9, y: 3, dialogue: 'twoton_hotel_registry' },
    ],
    phones: [{ x: 18, y: 10 }],
    atms: [{ x: 1, y: 10 }],
    doors: [
      { x: 9, y: 11, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 15, y: 2, w: 2, h: 1, to: 'twoton_hotel_hall', tx: 40, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildTwotonHotelHall(): MapDef {
  const g = new Grid(20, 10, 'w');
  g.rect(0, 0, 20, 2, 'W');
  g.rect(1, 2, 2, 2, 'r');
  g.rect(9, 2, 2, 6, 'r');
  return {
    id: 'twoton_hotel_hall',
    name: 'TWOTON HOTEL - FLOOR 2',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'floor_lamp', x: 4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 15, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'water_cooler', x: 18, y: 2.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'bench', x: 4, y: 6, solid: BENCH_SOLID },
      { sprite: 'plant_pot', x: 17, y: 7, solid: PLANT_SOLID },
      { sprite: 'trophy_shelf', x: 12, y: 0.3 },
    ],
    npcs: [
      { id: 'twoton_hotel_housekeeper', sprite: 'fernLady', x: 14, y: 6, facing: 'left', dialogue: 'npc_twoton_hotel_housekeeper', idle: true },
    ],
    signs: [
      { x: 6, y: 1, dialogue: 'twoton_hotel_directory' },
      { x: 18, y: 3, dialogue: 'twoton_hotel_cooler' },
    ],
    phones: [],
    doors: [
      { x: 1, y: 2, w: 2, h: 1, to: 'twoton_hotel_lobby', tx: 264, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 9, y: 2, w: 2, h: 1, to: 'twoton_hotel_room', tx: 104, ty: 124, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildTwotonHotelRoom(): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  g.rect(5, 6, 2, 2, 'r');
  return {
    id: 'twoton_hotel_room',
    name: 'TWOTON HOTEL - ROOM 202',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'bed', x: 3.5, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'dresser', x: 8, y: 1.2, solid: { ox: 2, oy: 8, w: 26, h: 14 } },
      { sprite: 'tv', x: 8.5, y: 0.6 },
      { sprite: 'floor_lamp', x: 7, y: 5, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'rocking_chair', x: 9, y: 5, solid: { ox: 2, oy: 12, w: 14, h: 10 } },
      { sprite: 'plant_pot', x: 1, y: 7, solid: PLANT_SOLID },
    ],
    npcs: [],
    signs: [
      { x: 2, y: 3, dialogue: 'twoton_hotel_bed' },
      { x: 9, y: 2, dialogue: 'twoton_hotel_tv' },
    ],
    phones: [],
    doors: [
      { x: 5, y: 8, w: 2, h: 1, to: 'twoton_hotel_hall', tx: 168, ty: 60, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildTwotonBusStation(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(21, 13, 'w');
  g.rect(0, 0, 21, 2, 'W');
  g.rect(6, 2, 1, 4, 'W');
  g.rect(14, 2, 1, 4, 'W');
  return {
    id: 'twoton_bus_station',
    name: 'TWOTON BUS STATION',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'prop_ticket_window', x: 2, y: 1.4, solid: { ox: 1, oy: 16, w: 56, h: 12 } },
      { sprite: 'departure_board', x: 9, y: 2, solid: { ox: 2, oy: 20, w: 22, h: 8 } },
      { sprite: 'bench', x: 7, y: 6, solid: BENCH_SOLID },
      { sprite: 'bench', x: 10, y: 6, solid: BENCH_SOLID },
      { sprite: 'bench', x: 12, y: 8, solid: BENCH_SOLID },
      { sprite: 'news_box', x: 15, y: 3, solid: { ox: 2, oy: 12, w: 12, h: 7 } },
      { sprite: 'cola_fridge', x: 18, y: 0.25 },
      { sprite: 'counter', x: 16, y: 4, solid: COUNTER_SOLID },
      { sprite: 'counter', x: 18, y: 4, solid: COUNTER_SOLID },
      { sprite: 'trash_can', x: 19, y: 9, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'plant_pot', x: 13, y: 3, solid: PLANT_SOLID },
      { sprite: 'payphone', x: 1, y: 11, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 19, y: 11, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      { id: 'twoton_station_clerk', sprite: 'npc_depot_clerk', x: 4, y: 3, facing: 'down', dialogue: 'npc_twoton_station_clerk', idle: true },
      { id: 'twoton_station_reader', sprite: 'quarterMan', x: 10, y: 3, facing: 'up', dialogue: 'npc_twoton_station_reader', idle: true, emote: 'think' },
      { id: 'twoton_station_commuter', sprite: 'grayCommuter', x: 8, y: 7, facing: 'right', dialogue: 'npc_twoton_station_commuter', idle: true },
      { id: 'twoton_station_vendor', sprite: 'fernLady', x: 17, y: 3, facing: 'down', dialogue: 'npc_twoton_station_vendor', idle: true },
    ],
    signs: [
      { x: 10, y: 2, dialogue: 'twoton_station_board' },
      { x: 3, y: 4, dialogue: 'twoton_station_window' },
    ],
    phones: [{ x: 1, y: 11 }],
    atms: [{ x: 19, y: 11 }],
    doors: [
      { x: 10, y: 12, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    // Reuse the existing, battle-tested return trip flow. The station is the
    // canonical Twoton stop, so the exterior does not duplicate this prompt.
    triggers: [{ id: 'bus_stop_brickton', rect: { x: 2, y: 4, w: 4, h: 2 }, once: false }],
  };
}

export function buildTwotonTheater(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(24, 16, 'a');
  g.rect(0, 0, 24, 2, 'A');
  g.rect(0, 7, 24, 1, 'A');
  g.rect(10, 7, 4, 1, 'a');
  g.rect(10, 12, 4, 3, '*');
  return {
    id: 'twoton_theater',
    name: 'THE TWOTON ORPHEUM',
    music: 'arcade',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'karaoke_stage', x: 10.2, y: 1.4, solid: { ox: 2, oy: 26, w: 56, h: 14 } },
      { sprite: 'floor_lamp', x: 7, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 16, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bench', x: 3, y: 4, solid: BENCH_SOLID },
      { sprite: 'bench', x: 7, y: 4, solid: BENCH_SOLID },
      { sprite: 'bench', x: 15, y: 4, solid: BENCH_SOLID },
      { sprite: 'bench', x: 19, y: 4, solid: BENCH_SOLID },
      { sprite: 'bench', x: 5, y: 6, solid: BENCH_SOLID },
      { sprite: 'bench', x: 17, y: 6, solid: BENCH_SOLID },
      { sprite: 'prop_ticket_window', x: 2, y: 8.4, solid: { ox: 1, oy: 16, w: 56, h: 12 } },
      { sprite: 'poster_stand', x: 19, y: 9, solid: { ox: 2, oy: 12, w: 16, h: 8 } },
      { sprite: 'prop_velvet_rope', x: 8, y: 11, solid: { ox: 2, oy: 12, w: 10, h: 6 } },
      { sprite: 'prop_velvet_rope', x: 15, y: 11, solid: { ox: 2, oy: 12, w: 10, h: 6 } },
      { sprite: 'plant_pot', x: 22, y: 13, solid: PLANT_SOLID },
    ],
    npcs: [
      { id: 'twoton_theater_clerk', sprite: 'npc_clerk', x: 4, y: 9, facing: 'down', dialogue: 'npc_twoton_theater_clerk', idle: true },
      { id: 'twoton_theater_usher', sprite: 'grayCommuter', x: 12, y: 9, facing: 'down', dialogue: 'npc_twoton_theater_usher', idle: true },
      { id: 'twoton_stagehand', sprite: 'sidewalkCritic', x: 12, y: 3, facing: 'down', dialogue: 'npc_twoton_stagehand', idle: true },
    ],
    signs: [
      { x: 20, y: 10, dialogue: 'twoton_theater_program' },
      { x: 13, y: 3, dialogue: 'twoton_theater_stage' },
      { x: 3, y: 10, dialogue: 'twoton_theater_tickets' },
    ],
    phones: [],
    doors: [
      { x: 11, y: 15, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildTwotonCommunityCenter(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(22, 14, 'w');
  g.rect(0, 0, 22, 2, 'W');
  g.rect(12, 2, 1, 7, 'W');
  g.rect(12, 7, 1, 2, 'w');
  g.rect(3, 4, 6, 3, 'r');
  g.rect(15, 4, 4, 3, 'r');
  return {
    id: 'twoton_community_center',
    name: 'TWOTON COMMUNITY & PRESCHOOL',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'chalk_board', x: 3, y: 1.2, solid: { ox: 1, oy: 22, w: 31, h: 7 } },
      { sprite: 'desk', x: 2, y: 5, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'desk', x: 6, y: 5, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'bookshelf', x: 9.5, y: 0.5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'sofa', x: 15, y: 5, solid: { ox: 0, oy: 4, w: 34, h: 14 } },
      { sprite: 'dining_table', x: 15, y: 9, solid: { ox: 2, oy: 12, w: 30, h: 18 } },
      { sprite: 'counter', x: 2, y: 9, solid: COUNTER_SOLID },
      { sprite: 'counter', x: 4, y: 9, solid: COUNTER_SOLID },
      { sprite: 'plant_pot', x: 20, y: 10, solid: PLANT_SOLID },
      { sprite: 'payphone', x: 1, y: 12, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'twoton_preschool_teacher', sprite: 'fernLady', x: 5, y: 3, facing: 'down', dialogue: 'npc_twoton_preschool_teacher', idle: true },
      { id: 'twoton_preschool_child', sprite: 'pajamaKid', x: 8, y: 7, facing: 'left', dialogue: 'npc_twoton_preschool_child', wander: true },
      { id: 'twoton_community_volunteer', sprite: 'oldTimer', x: 16, y: 4, facing: 'down', dialogue: 'npc_twoton_community_volunteer', idle: true },
    ],
    signs: [
      { x: 4, y: 2, dialogue: 'twoton_preschool_board' },
      { x: 16, y: 10, dialogue: 'twoton_community_table' },
    ],
    phones: [{ x: 1, y: 12 }],
    doors: [
      { x: 10, y: 13, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** A compact, legible showroom. The displayed cycles use the same authored
 * directional vehicle sheets as the ride the player can buy from the clerk. */
export function buildTwotonBikeShop(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(18, 12, 'w');
  g.rect(0, 0, 18, 2, 'W');
  g.rect(8, 8, 2, 3, 'r');
  return {
    id: 'twoton_bike_shop',
    name: 'SECOND WIND CYCLES',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'prop_pegboard_wall', x: 1, y: 0.25, solid: { ox: 1, oy: 18, w: 44, h: 12 } },
      { sprite: 'prop_tool_shelf', x: 5, y: 0.25, solid: { ox: 1, oy: 18, w: 34, h: 12 } },
      { sprite: 'prop_lockbox_counter', x: 11.5, y: 0.55, solid: { ox: 1, oy: 10, w: 44, h: 12 } },
      { sprite: 'counter', x: 11, y: 3, solid: COUNTER_SOLID },
      { sprite: 'counter', x: 13, y: 3, solid: COUNTER_SOLID },
      { sprite: 'kids_bmx', x: 1.5, y: 3.5, solid: { ox: 1, oy: 9, w: 18, h: 7 } },
      { sprite: 'ten_speed', x: 4.5, y: 3.5, solid: { ox: 1, oy: 9, w: 22, h: 7 } },
      { sprite: 'kids_bmx', x: 7.5, y: 3.5, solid: { ox: 1, oy: 9, w: 18, h: 7 } },
      { sprite: 'bench', x: 12, y: 7, solid: BENCH_SOLID },
      { sprite: 'plant_pot', x: 16, y: 8, solid: PLANT_SOLID },
    ],
    npcs: [
      { id: 'twoton_bike_clerk', sprite: 'sidewalkCritic', x: 12, y: 2, facing: 'down', dialogue: 'npc_twoton_bike_clerk', idle: true },
      { id: 'twoton_bike_kid', sprite: 'pajamaKid', x: 5, y: 7, facing: 'up', dialogue: 'npc_twoton_bike_kid', idle: true, emote: 'think' },
    ],
    signs: [
      { x: 2, y: 4, dialogue: 'twoton_bike_price_card' },
      { x: 3, y: 1, dialogue: 'twoton_bike_repair_wall' },
    ],
    phones: [],
    doors: [
      { x: 8, y: 11, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** Twoton's pizza shop keeps the kitchen on-screen: the counter is functional,
 * while the grill, hood, fryer, fridge, cook, booths, and payphone make it a
 * place rather than a buy menu in an empty rectangle. */
export function buildTwotonPizza(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(20, 14, 'o');
  g.rect(0, 0, 20, 2, 'O');
  g.rect(10, 2, 1, 4, 'O');
  g.rect(9, 10, 2, 3, 'r');
  return {
    id: 'twoton_pizza',
    name: 'PIE IN THE SKY PIZZA',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'menu_board', x: 1.2, y: 0.55 },
      { sprite: 'prop_burger_counter', x: 2, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_burger_counter', x: 5, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_burger_counter', x: 8, y: 3, solid: { ox: 1, oy: 12, w: 20, h: 10 } },
      { sprite: 'prop_flat_grill', x: 12, y: 2.3, solid: { ox: 1, oy: 10, w: 20, h: 8 } },
      { sprite: 'prop_deep_fryer', x: 15, y: 2.2, solid: { ox: 1, oy: 12, w: 16, h: 9 } },
      { sprite: 'prop_range_hood', x: 13.2, y: 0.3 },
      { sprite: 'fridge', x: 18, y: 1.2, solid: { ox: 2, oy: 14, w: 14, h: 18 } },
      { sprite: 'prop_booth', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 7, y: 7, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 13, y: 7, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_jukebox', x: 16.5, y: 10, solid: { ox: 2, oy: 12, w: 18, h: 10 } },
      { sprite: 'payphone', x: 18, y: 12, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'twoton_pizza_clerk', sprite: 'deliKeeper', x: 5, y: 2, facing: 'down', dialogue: 'shop_twoton_pizza_greet', shop: 'twoton_pizza', idle: true },
      { id: 'twoton_pizza_cook', sprite: 'martClerk', x: 14, y: 4, facing: 'up', dialogue: 'npc_twoton_pizza_cook', idle: true },
      { id: 'twoton_pizza_regular', sprite: 'oldTimer', x: 4, y: 9, facing: 'up', dialogue: 'npc_twoton_pizza_regular', idle: true },
    ],
    signs: [
      { x: 2, y: 1, dialogue: 'twoton_pizza_menu' },
      { x: 13, y: 3, dialogue: 'twoton_pizza_kitchen' },
      { x: 3, y: 8, dialogue: 'twoton_pizza_booth' },
    ],
    phones: [{ x: 18, y: 12 }],
    doors: [
      { x: 9, y: 13, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildTwotonServiceMaps(steps: TwotonServiceSteps): Record<string, MapDef> {
  return {
    twoton_hotel_lobby: buildTwotonHotelLobby(steps.hotel),
    twoton_hotel_hall: buildTwotonHotelHall(),
    twoton_hotel_room: buildTwotonHotelRoom(),
    twoton_bus_station: buildTwotonBusStation(steps.bus),
    twoton_theater: buildTwotonTheater(steps.theater),
    twoton_community_center: buildTwotonCommunityCenter(steps.community),
    twoton_bike_shop: buildTwotonBikeShop(steps.bike),
    twoton_pizza: buildTwotonPizza(steps.pizza),
  };
}
