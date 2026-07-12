import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import { DIALOGUE } from './dialogue';
import { ITEMS } from './items';
import { SHOPS } from './shops';
import { buyCar } from '../engine/garage';
import { decodePng } from '../../tools/imageio';
import { formalCityFacadeSource } from './formal_city_scale';
import { cityScaleVariantMeta } from '../spritegen/buildings';
import { cityBuildingHeight } from '../spritegen/tiles';

const IDS = [
  'twoton_hotel_lobby',
  'twoton_hotel_hall',
  'twoton_hotel_room',
  'twoton_bus_station',
  'twoton_theater',
  'twoton_community_center',
  'twoton_bike_shop',
  'twoton_pizza',
] as const;

describe('TWOTON purpose-built service interiors', () => {
  it('registers every stable service id as a furnished interior', () => {
    for (const id of IDS) {
      const m = MAPS[id];
      expect(m, id).toBeDefined();
      expect(m.interior, id).toBe(true);
      expect(m.props.length, `${id} props`).toBeGreaterThanOrEqual(5);
      expect(m.doors.length, `${id} doors`).toBeGreaterThanOrEqual(1);
    }
  });

  it('builds a reciprocal hotel route using an elevator, never stairs', () => {
    const lobby = MAPS.twoton_hotel_lobby;
    const hall = MAPS.twoton_hotel_hall;
    const room = MAPS.twoton_hotel_room;

    expect(lobby.grid[0].length).toBe(20);
    expect(lobby.grid.length).toBe(12);
    expect(hall.grid[0].length).toBe(20);
    expect(hall.grid.length).toBe(10);
    expect(room.grid[0].length).toBe(12);
    expect(room.grid.length).toBe(9);

    expect(lobby.doors.some((d) => d.to === 'twoton_hotel_hall' && d.indicator === 'elevator')).toBe(true);
    expect(hall.doors.some((d) => d.to === 'twoton_hotel_lobby' && d.indicator === 'elevator')).toBe(true);
    expect(hall.doors.some((d) => d.to === 'twoton_hotel_room' && d.indicator === 'door')).toBe(true);
    expect(room.doors.some((d) => d.to === 'twoton_hotel_hall')).toBe(true);
    expect([lobby, hall, room].flatMap((m) => m.doors).some((d) => d.indicator === 'stairs')).toBe(false);
    expect(lobby.npcs.some((n) => n.id === 'twoton_hotel_clerk')).toBe(true);
    expect(lobby.phones.length).toBe(1);
    expect(lobby.atms?.length).toBe(1);
  });

  it('moves the existing return-bus activity into a real station concourse', () => {
    const station = MAPS.twoton_bus_station;
    expect(station.grid[0].length).toBe(21);
    expect(station.grid.length).toBe(13);
    expect(station.triggers).toContainEqual({
      id: 'bus_stop_brickton',
      rect: { x: 2, y: 4, w: 4, h: 2 },
      once: false,
    });
    expect(station.props.some((p) => p.sprite === 'prop_ticket_window')).toBe(true);
    expect(station.props.filter((p) => p.sprite === 'bench').length).toBeGreaterThanOrEqual(3);
    expect(station.npcs.some((n) => n.id === 'twoton_station_clerk')).toBe(true);
    expect(station.phones.length).toBe(1);
    expect(station.atms?.length).toBe(1);
  });

  it('makes the Orpheum an auditorium with a lobby rather than a generic unit', () => {
    const theater = MAPS.twoton_theater;
    expect(theater.grid[0].length).toBe(24);
    expect(theater.grid.length).toBe(16);
    expect(theater.props.some((p) => p.sprite === 'karaoke_stage')).toBe(true);
    expect(theater.props.some((p) => p.sprite === 'prop_ticket_window')).toBe(true);
    expect(theater.props.filter((p) => p.sprite === 'bench').length).toBeGreaterThanOrEqual(6);
    expect(theater.npcs.map((n) => n.id)).toEqual(
      expect.arrayContaining(['twoton_theater_clerk', 'twoton_theater_usher', 'twoton_stagehand']),
    );
    expect(theater.grid[7].slice(10, 14)).toBe('aaaa');
  });

  it('gives the community center a distinct preschool and meeting-room life', () => {
    const center = MAPS.twoton_community_center;
    expect(center.grid[0].length).toBe(22);
    expect(center.grid.length).toBe(14);
    expect(center.props.some((p) => p.sprite === 'chalk_board')).toBe(true);
    expect(center.props.filter((p) => p.sprite === 'desk').length).toBeGreaterThanOrEqual(2);
    expect(center.npcs.map((n) => n.id)).toEqual(
      expect.arrayContaining(['twoton_preschool_teacher', 'twoton_preschool_child', 'twoton_community_volunteer']),
    );
    expect(center.phones.length).toBe(1);
  });

  it('makes the cycle shop a real save-backed BMX purchase, not scenery', () => {
    const shop = MAPS.twoton_bike_shop;
    expect(shop.grid[0].length).toBe(18);
    expect(shop.grid.length).toBe(12);
    expect(shop.props.map((p) => p.sprite)).toEqual(
      expect.arrayContaining(['kids_bmx', 'ten_speed', 'prop_pegboard_wall', 'prop_tool_shelf']),
    );
    expect(shop.npcs.some((n) => n.id === 'twoton_bike_clerk' && !n.shop)).toBe(true);
    expect(shop.doors.some((d) => d.to === 'brickton')).toBe(true);
    expect(buyCar('kids_bmx', 90, 1, [])).toEqual({
      ok: true,
      reason: 'ok',
      cost: 90,
      title: 'title_car_bmx',
    });
  });

  it('opens a pizza counter with valid food stock and an on-screen kitchen', () => {
    const pizza = MAPS.twoton_pizza;
    expect(pizza.grid[0].length).toBe(20);
    expect(pizza.grid.length).toBe(14);
    expect(pizza.npcs).toContainEqual(expect.objectContaining({ id: 'twoton_pizza_clerk', shop: 'twoton_pizza' }));
    expect(pizza.props.map((p) => p.sprite)).toEqual(
      expect.arrayContaining(['prop_flat_grill', 'prop_deep_fryer', 'prop_range_hood', 'fridge', 'prop_booth']),
    );
    expect(SHOPS.twoton_pizza.keeperNpc).toBe('twoton_pizza_clerk');
    expect(SHOPS.twoton_pizza.stock).toContain('pizza_slice');
    for (const id of SHOPS.twoton_pizza.stock) expect(ITEMS[id], id).toBeDefined();
    expect(ITEMS.pizza_slice.kind).toBe('food');
  });

  it('ships authored dialogue for every service keeper and venue anchor', () => {
    for (const id of [
      'npc_twoton_hotel_clerk',
      'twoton_hotel_wake',
      'npc_twoton_station_clerk',
      'twoton_station_board',
      'npc_twoton_theater_clerk',
      'twoton_theater_stage',
      'npc_twoton_preschool_teacher',
      'twoton_preschool_board',
      'npc_twoton_bike_clerk',
      'twoton_bike_bought',
      'shop_twoton_pizza_greet',
      'twoton_pizza_kitchen',
    ]) {
      expect(DIALOGUE[id]?.length, id).toBeGreaterThan(0);
    }
  });

  it('aligns every named facade opening with its production-scale doorway', () => {
    const expectedCenters = [
      ['bldg_ob_hotel', 'twoton_hotel_lobby'],
      ['bldg_hospital', 'hospital_int'],
      ['bldg_dept', 'dos_f1'],
      ['bldg_civic', 'twoton_community_center'],
      ['bldg_warehouse', 'twoton_bus_station'],
      ['bldg_theater', 'twoton_theater'],
      ['bldg_gen_shop_grass_1', 'twoton_bike_shop'],
      ['bldg_diner', 'twoton_pizza'],
      ['bldg_starmart', 'starmart_int'],
      ['bldg_arcade2', 'arcade2_int'],
    ] as const;

    for (const [sprite, target] of expectedCenters) {
      const prop = MAPS.brickton.props.find((p) => formalCityFacadeSource(p.sprite) === sprite && p.door?.to === target);
      expect(prop, `${sprite} facade`).toBeDefined();
      const door = prop?.door;
      expect(door, `${sprite} opening`).toBeDefined();
      const meta = prop ? cityScaleVariantMeta(prop.sprite) : undefined;
      expect(meta, `${sprite} scale metadata`).toBeDefined();
      const artW = meta?.opts.doubleDoor ? 22 : 12;
      const at = meta?.opts.doorAt ?? Math.floor((meta?.opts.wallTiles ?? 2) / 2);
      const paintedCenter = 1 + at * 16 + Math.floor((16 - artW) / 2) + artW / 2;
      const runtimeCenter = (door?.ox ?? 0) + (door?.w ?? 0) / 2;
      expect(Math.abs(runtimeCenter - paintedCenter), `${sprite} procedural-door offset`).toBeLessThanOrEqual(0.01);
    }
  });

  it('keeps every named interior return body below its facade lintel', () => {
    const targets = [
      'twoton_hotel_lobby', 'hospital_int', 'dos_f1', 'twoton_community_center',
      'twoton_bus_station', 'twoton_theater', 'twoton_bike_shop', 'twoton_pizza',
      'starmart_int', 'arcade2_int',
    ] as const;

    for (const target of targets) {
      const prop = MAPS.brickton.props.find((p) => p.door?.to === target);
      expect(prop, `${target} facade`).toBeDefined();
      const back = MAPS[target].doors.find((d) => d.to === 'brickton');
      expect(back, `${target} return`).toBeDefined();
      const meta = prop ? cityScaleVariantMeta(prop.sprite) : undefined;
      expect(meta, `${target} scale metadata`).toBeDefined();
      const facadeLintelBottom = (prop?.y ?? 0) * 16 + cityBuildingHeight(meta?.opts.upperRows ?? 0) - 18;
      expect((back?.ty ?? 0) - 9, `${target} return body`).toBeGreaterThanOrEqual(facadeLintelBottom);
    }
    expect(MAPS.brickton.props.find((p) => p.door?.to === 'twoton_bus_station')?.door?.ty).toBe(188);
  });

  it('ships the depot facade without the unrelated tower fragment from the next source row', () => {
    const depot = decodePng(readFileSync(resolve('assets/art/world/facades/bldg_warehouse.png')));
    expect([depot.w, depot.h]).toEqual([341, 303]);
    const lastRow = depot.data.subarray((depot.h - 1) * depot.w * 4);
    expect(lastRow.some((channel, index) => index % 4 === 3 && channel > 0)).toBe(true);
  });
});
