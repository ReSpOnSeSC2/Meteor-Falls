import { describe, expect, it } from 'vitest';
import type { MapDef, PropDef } from '../schemas';
import { cityServiceNpcId } from './city_amenities';
import { CHAPTER_MANIFESTS } from './chapters';
import { ENEMIES } from './enemies';
import { formalCityFacadeSource } from './formal_city_scale';
import { CHAR_LEGEND, MAPS } from './maps';
import { CH7_MAP_IDS, CH7_WORLD, buildChapter7Maps } from './maps_ch7';
import { SHOPS } from './shops';
import { cityViolations, livingCityViolations } from '../levelkit/metrics';
import {
  CHANDRAPORE_FACADES,
  FORMAL_CITY_FACADE_SOURCE_WIDTHS,
  cityScaleVariantMeta,
} from '../spritegen/buildings';
import { TILESET } from '../spritegen/tiles';

const SOLID_BY_NAME = new Map(TILESET.map((tile) => [tile.name, tile.solid]));

function isWalkable(map: MapDef, x: number, y: number): boolean {
  const ch = map.grid[y]?.[x];
  if (ch === undefined) return false;
  if (ch === ':' || ch === 'r') return true;
  return SOLID_BY_NAME.get(CHAR_LEGEND[ch] ?? 'grass_a') !== true;
}

function startFor(map: MapDef): { x: number; y: number } {
  switch (map.id) {
    case 'chandrapore': return CH7_WORLD.chandrapore.landing;
    case 'monsoon_road': return CH7_WORLD.monsoonRoad.cityLanding;
    case 'night_train': return CH7_WORLD.nightTrain.roadLanding;
    default: return CH7_WORLD.palaceThrone.entry;
  }
}

function walkableTiles(map: MapDef, blocked?: { x: number; y: number; w: number; h: number }): Set<string> {
  const start = startFor(map);
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [[start.x, start.y]];
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    const key = `${x},${y}`;
    const inBlocked = blocked
      && x >= blocked.x && x < blocked.x + blocked.w
      && y >= blocked.y && y < blocked.y + blocked.h;
    if (seen.has(key) || inBlocked || !isWalkable(map, x, y)) continue;
    seen.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

function rectHasReachableTile(seen: Set<string>, rect: { x: number; y: number; w: number; h: number }): boolean {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (seen.has(`${x},${y}`)) return true;
    }
  }
  return false;
}

function propSolidRect(prop: PropDef): { x: number; y: number; w: number; h: number } | null {
  if (!prop.solid) return null;
  const sx = typeof prop.scale === 'number' ? prop.scale : prop.scale?.x ?? 1;
  const sy = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
  return {
    x: prop.x * 16 + prop.solid.ox * sx,
    y: prop.y * 16 + prop.solid.oy * sy,
    w: prop.solid.w * sx,
    h: prop.solid.h * sy,
  };
}

function pointInside(rect: { x: number; y: number; w: number; h: number }, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

describe('Chapter 7 production world contract', () => {
  it('pins the exact four-map roster and production dimensions', () => {
    const maps = buildChapter7Maps();
    expect(Object.keys(maps)).toEqual([...CH7_MAP_IDS]);
    expect(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, [map.grid[0].length, map.grid.length]]))).toEqual({
      chandrapore: [120, 88],
      monsoon_road: [108, 68],
      night_train: [48, 128],
      palace_throne: [88, 104],
    });
  });

  it('builds byte-identically on repeated calls', () => {
    expect(JSON.stringify(buildChapter7Maps())).toBe(JSON.stringify(buildChapter7Maps()));
  });

  it('keeps every route reciprocal and derives a body-safe landing from CH7_WORLD', () => {
    const maps = buildChapter7Maps();
    const expectedLanding: Record<string, { x: number; y: number }> = {
      'chandrapore>monsoon_road': CH7_WORLD.monsoonRoad.cityLanding,
      'monsoon_road>chandrapore': CH7_WORLD.chandrapore.monsoonLanding,
      'monsoon_road>night_train': CH7_WORLD.nightTrain.roadLanding,
      'night_train>monsoon_road': CH7_WORLD.monsoonRoad.trainLanding,
      'night_train>palace_throne': CH7_WORLD.palaceThrone.entry,
      'palace_throne>night_train': CH7_WORLD.nightTrain.palaceLanding,
    };
    for (const map of Object.values(maps)) {
      for (const door of map.doors.filter((candidate) => CH7_MAP_IDS.includes(candidate.to as (typeof CH7_MAP_IDS)[number]))) {
        const target = maps[door.to as keyof typeof maps];
        expect(target.doors.some((back) => back.to === map.id), `${map.id} -> ${door.to}`).toBe(true);
        const expected = expectedLanding[`${map.id}>${door.to}`];
        expect({ tx: door.tx, ty: door.ty }).toEqual({ tx: expected.x * 16 + 8, ty: expected.y * 16 + 12 });
        expect(isWalkable(target, expected.x, expected.y), `${map.id} -> ${door.to} landing`).toBe(true);
        expect(isWalkable(target, expected.x + 1, expected.y), `${map.id} -> ${door.to} body clearance`).toBe(true);
      }
    }
  });

  it('makes every door, trigger, NPC, and sign reachable from its chapter entry', () => {
    for (const map of Object.values(buildChapter7Maps())) {
      const seen = walkableTiles(map);
      for (const trigger of map.triggers) {
        expect(rectHasReachableTile(seen, trigger.rect), `${map.id}:${trigger.id}`).toBe(true);
      }
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(seen.has(`${Math.floor(actor.x)},${Math.floor(actor.y)}`), `${map.id}:${actor.x},${actor.y}`).toBe(true);
      }
      for (const door of map.doors) {
        expect(rectHasReachableTile(seen, door), `${map.id} door ${door.to}`).toBe(true);
      }
    }
  });

  it('keeps every authored anchor in bounds with a collision-clear interaction tile', () => {
    for (const map of Object.values(buildChapter7Maps())) {
      const w = map.grid[0].length;
      const h = map.grid.length;
      const solids = map.props.map(propSolidRect).filter((rect): rect is NonNullable<typeof rect> => rect !== null);
      for (const trigger of map.triggers) {
        expect(trigger.rect.x).toBeGreaterThanOrEqual(0);
        expect(trigger.rect.y).toBeGreaterThanOrEqual(0);
        expect(trigger.rect.x + trigger.rect.w).toBeLessThanOrEqual(w);
        expect(trigger.rect.y + trigger.rect.h).toBeLessThanOrEqual(h);
        let clear = false;
        for (let y = trigger.rect.y; y < trigger.rect.y + trigger.rect.h && !clear; y++) {
          for (let x = trigger.rect.x; x < trigger.rect.x + trigger.rect.w; x++) {
            if (isWalkable(map, x, y) && !solids.some((rect) => pointInside(rect, x * 16 + 8, y * 16 + 12))) clear = true;
          }
        }
        expect(clear, `${map.id}:${trigger.id}`).toBe(true);
      }
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(actor.x).toBeGreaterThanOrEqual(0);
        expect(actor.y).toBeGreaterThanOrEqual(0);
        expect(actor.x).toBeLessThan(w);
        expect(actor.y).toBeLessThan(h);
        expect(solids.some((rect) => pointInside(rect, actor.x * 16 + 8, actor.y * 16 + 12)), `${map.id}:${actor.x},${actor.y}`).toBe(false);
      }
    }
  });

  it('ships Chandrapore as the biggest city with three legible districts and a real river edge', () => {
    const map = buildChapter7Maps().chandrapore;
    expect(map.grid.length * map.grid[0].length).toBeGreaterThan(MAPS.zanzibel.grid.length * MAPS.zanzibel.grid[0].length);
    expect(cityViolations(map)).toEqual([]);
    expect(MAPS.chandrapore.area).toBe('chandrapore');
    expect(map.grid.flatMap((row) => [...row]).filter((tile) => tile === 'e').length).toBeGreaterThan(500);
    expect(map.reflect).toHaveLength(1);
    for (const point of [CH7_WORLD.chandrapore.bazaarCenter, CH7_WORLD.chandrapore.ghats, CH7_WORLD.chandrapore.cinema, CH7_WORLD.chandrapore.station]) {
      expect(isWalkable(map, point.x, point.y), `${point.x},${point.y}`).toBe(true);
    }
    expect(isWalkable(map, CH7_WORLD.chandrapore.vehicleBay.x, CH7_WORLD.chandrapore.vehicleBay.y)).toBe(true);
    expect(map.props.some((prop) => prop.x === CH7_WORLD.chandrapore.vehicleBay.x && prop.y === CH7_WORLD.chandrapore.vehicleBay.y)).toBe(false);
  });

  it('preserves historical units 0-3 while expanding to 22 facades and 18 generated units', () => {
    const raw = buildChapter7Maps().chandrapore.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(raw).toHaveLength(22);
    expect(raw.slice(0, 5).map((prop) => prop.sprite)).toEqual([
      'bldg_chandrapore_hillcrest_manor',
      'bldg_chandrapore_moon_gate_realty',
      'bldg_chandrapore_civic_hall',
      'bldg_chandrapore_motor_gallery',
      'bldg_chandrapore_silver_parasol',
    ]);
    expect(raw.filter((prop) => !['bldg_chandrapore_majestic_cinema', 'bldg_chandrapore_station'].includes(prop.sprite))).toHaveLength(20);
    expect(raw.every((prop) => !prop.sprite.includes('zanzibel'))).toBe(true);

    const live = MAPS.chandrapore.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(live.map((prop) => formalCityFacadeSource(prop.sprite))).toEqual(raw.map((prop) => prop.sprite));
    expect(live.map((prop, index) => prop.door ? -1 : index).filter((index) => index >= 0)).toEqual([2, 19, 20, 21]);
    expect(Object.keys(MAPS).filter((id) => /^chandrapore_unit_\d+$/.test(id))).toHaveLength(18);
    expect(MAPS.chandrapore_unit_0.name).toContain('HILLCREST MANOR');
    expect(MAPS.chandrapore_unit_1.name).toBe('MOON GATE REALTY');
    expect(MAPS.chandrapore_unit_2.name).toBe('MONSOON MOTOR GALLERY');
    expect(MAPS.chandrapore_unit_3.name).toContain('SILVER PARASOL');
    expect(livingCityViolations(MAPS.chandrapore)).toEqual([]);
  });

  it('retains all four city services in the historical unit roster', () => {
    expect(MAPS.chandrapore_unit_0.npcs.some((npc) => npc.id === cityServiceNpcId('chandrapore', 'home_host'))).toBe(true);
    expect(MAPS.chandrapore_unit_1.npcs.some((npc) => npc.id === cityServiceNpcId('chandrapore', 'realtor'))).toBe(true);
    expect(MAPS.chandrapore_unit_2.npcs.some((npc) => npc.id === cityServiceNpcId('chandrapore', 'dealer'))).toBe(true);
    expect(MAPS.chandrapore_unit_3.npcs.some((npc) => npc.id === cityServiceNpcId('chandrapore', 'hotel_clerk'))).toBe(true);
  });

  it('owns a complete Chandrapore facade family with no Zanzibel metadata', () => {
    const widths = FORMAL_CITY_FACADE_SOURCE_WIDTHS.chandrapore;
    expect(Object.keys(widths)).toEqual([...CHANDRAPORE_FACADES]);
    expect(Object.values(widths).every((width) => width === 4)).toBe(true);
    expect(CHANDRAPORE_FACADES.every((source) => source.startsWith('bldg_chandrapore_'))).toBe(true);
    for (const prop of MAPS.chandrapore.props.filter((candidate) => candidate.sprite.startsWith('bldg_'))) {
      const meta = cityScaleVariantMeta(prop.sprite);
      expect(meta).toBeDefined();
      expect(meta?.source.includes('zanzibel')).toBe(false);
    }
  });

  it('wires seven spices, the monkey chase, and all three new quest footprints', () => {
    const map = buildChapter7Maps().chandrapore;
    const triggerIds = map.triggers.map((trigger) => trigger.id);
    expect(triggerIds.filter((id) => /^q_spice_find_\d+$/.test(id))).toHaveLength(7);
    expect(new Set(CH7_WORLD.chandrapore.spicePoints.map((point) => `${point.x},${point.y}`))).toHaveLength(7);
    expect(CH7_WORLD.chandrapore.spicePoints[1]).toEqual({ x: 18, y: 72 }); // ghat-edge cumin
    expect(CH7_WORLD.chandrapore.spicePoints[2].x).toBeGreaterThan(CH7_WORLD.chandrapore.cinema.x); // cinema cashier
    expect(CH7_WORLD.chandrapore.spicePoints[6]).toEqual(CH7_WORLD.chandrapore.bazaarCenter); // final crossing
    expect(triggerIds).toEqual(expect.arrayContaining([
      'q_monkey_chase', 'q_monkey_corner', 'q_last_showing_projector', 'ch7_cinema',
      'q_river_clue_1', 'q_river_clue_2', 'q_river_clue_3',
    ]));
    expect(map.npcs.map((npc) => npc.id)).toEqual(expect.arrayContaining([
      'cp_spice_merchant', 'cp_dabbawala', 'cp_stationmaster', 'cp_usher', 'cp_ghat_elder',
    ]));
    expect(map.props.filter((prop) => prop.ifFlag).map((prop) => prop.ifFlag)).toEqual(expect.arrayContaining([
      'q_showing_done', 'q_third_class_done', 'q_river_done',
    ]));
  });

  it('stages the heist before the road and orders chase, climax, recovery, and palace access', () => {
    const maps = buildChapter7Maps();
    const bazaar = maps.chandrapore.triggers.find((trigger) => trigger.id === 'ch7_bazaar');
    expect(bazaar?.rect).toBe(CH7_WORLD.chandrapore.bazaarApproach);
    expect(rectHasReachableTile(walkableTiles(maps.chandrapore), CH7_WORLD.chandrapore.bazaarApproach)).toBe(true);
    expect(CH7_WORLD.chandrapore.bazaarApproach.y).toBeLessThan(CH7_WORLD.chandrapore.arrival.y);
    expect(maps.chandrapore.triggers.some((trigger) => trigger.id === 'ch7_heist' && trigger.rect === CH7_WORLD.chandrapore.heist)).toBe(true);
    expect(maps.night_train.triggers.some((trigger) => trigger.id === 'ch7_heist')).toBe(false);
    expect(CH7_WORLD.nightTrain.chase.y).toBeGreaterThan(CH7_WORLD.nightTrain.couplingClimax.y);
    expect(CH7_WORLD.nightTrain.couplingClimax.y).toBeGreaterThan(CH7_WORLD.nightTrain.recovery.y);
    const roadDoor = maps.chandrapore.doors.find((door) => door.to === 'monsoon_road');
    expect(roadDoor?.ifFlag).toBe('ch7_heist_seen');
    expect(maps.chandrapore.signs).toEqual(expect.arrayContaining([
      expect.objectContaining({ dialogue: 'sign_monsoon_gate_locked', unlessFlag: 'ch7_heist_seen' }),
      expect.objectContaining({ dialogue: 'sign_monsoon_gate', ifFlag: 'ch7_heist_seen' }),
    ]));
    const palaceDoor = maps.night_train.doors.find((door) => door.to === 'palace_throne');
    expect(palaceDoor?.ifFlag).toBe('ch7_locket_recovered');
    expect(maps.monsoon_road.doors.find((door) => door.to === 'night_train')?.ifFlag).toBeUndefined();
  });

  it('forces the Cobra approach before resonance and makes both arenas spatially distinct', () => {
    const map = buildChapter7Maps().palace_throne;
    expect(overlaps(CH7_WORLD.palaceThrone.boss, CH7_WORLD.palaceThrone.resonance)).toBe(false);
    expect(map.signs.filter((sign) => sign.dialogue === 'sign_palace_restored')).toHaveLength(2);
    expect(map.signs.filter((sign) => sign.dialogue === 'sign_palace_throne').every((sign) => sign.unlessFlag === 'cobra_raja_defeated')).toBe(true);
    expect(CH7_WORLD.palaceThrone.boss.y).toBeGreaterThan(CH7_WORLD.palaceThrone.resonance.y);
    const withoutBoss = walkableTiles(map, CH7_WORLD.palaceThrone.boss);
    expect(rectHasReachableTile(withoutBoss, CH7_WORLD.palaceThrone.resonance)).toBe(false);
    expect(map.props.some((prop) => prop.sprite === 'picnic')).toBe(false);
  });

  it('retires every hostile spawner after Cobra Raja and keeps door grace clear', () => {
    const maps = buildChapter7Maps();
    const spawners = Object.values(maps).flatMap((map) => map.spawners.map((spawner) => ({ map, spawner })));
    expect(spawners.length).toBeGreaterThanOrEqual(8);
    expect(spawners.every(({ spawner }) => spawner.unlessFlag === 'cobra_raja_defeated')).toBe(true);
    for (const { map, spawner } of spawners) {
      for (const door of map.doors) expect(overlaps(spawner.rect, door), `${map.id} spawner overlaps ${door.to}`).toBe(false);
    }
    expect(new Set(spawners.flatMap(({ spawner }) => spawner.enemies))).toEqual(new Set([
      'rickshaw_swarm', 'spice_djinn', 'temple_macaque', 'naga_sentry',
    ]));
  });

  it('keeps the shipped Chapter 7 combat contract exact', () => {
    expect(CHAPTER_MANIFESTS['7'].boss).toMatchObject({ id: 'cobra_raja', hp: 20_000 });
    expect(ENEMIES.cobra_raja).toMatchObject({ hp: 20_000, level: 35, mind_immune: true });
    expect({
      rickshaw_swarm: ENEMIES.rickshaw_swarm.hp,
      spice_djinn: ENEMIES.spice_djinn.hp,
      temple_macaque: ENEMIES.temple_macaque.hp,
      naga_sentry: ENEMIES.naga_sentry.hp,
    }).toEqual({ rickshaw_swarm: 3000, spice_djinn: 2000, temple_macaque: 2400, naga_sentry: 5000 });
    expect(SHOPS.chandrapore_bazaar.stock).toContain('antivenom_vial');
  });

  it('pins the three-recovery chapter rhythm and keeps the boss chamber empty', () => {
    const maps = buildChapter7Maps();
    expect(CH7_MAP_IDS.map((id) => maps[id].props.filter((prop) => prop.sprite === 'picnic').length)).toEqual([1, 1, 1, 0]);
  });
});
