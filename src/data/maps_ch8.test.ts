import { describe, expect, it } from 'vitest';
import type { MapDef, PropDef } from '../schemas';
import { cityServiceNpcId } from './city_amenities';
import { formalCityFacadeSource } from './formal_city_scale';
import { CHAR_LEGEND, MAPS } from './maps';
import {
  CH8_MAP_IDS,
  CH8_WORLD,
  LOTUS_HARBOR_UNIT_IDS,
  buildChapter8Maps,
  nativeFeet,
} from './maps_ch8';
import { cityViolations, livingCityViolations } from '../levelkit/metrics';
import { pressureHardFlags, pressureReport } from '../levelkit/pressure';
import {
  FORMAL_CITY_FACADE_SOURCE_WIDTHS,
  LOTUS_HARBOR_FACADES,
  cityScaleVariantMeta,
} from '../spritegen/buildings';
import {
  AUTHORED_FACADE_KEYS,
  AUTHORED_LOTUS_HARBOR_CITY_SCALE_FACADES,
} from '../spritegen/authored';
import { TILESET } from '../spritegen/tiles';

interface Rect { x: number; y: number; w: number; h: number }

const SOLID_BY_NAME = new Map(TILESET.map((tile) => [tile.name, tile.solid]));
const IS_SOLID = (ch: string): boolean => ch !== ':' && ch !== 'r' && SOLID_BY_NAME.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

function isWalkable(map: MapDef, x: number, y: number): boolean {
  const ch = map.grid[y]?.[x];
  if (ch === undefined) return false;
  if (ch === ':' || ch === 'r') return true;
  return SOLID_BY_NAME.get(CHAR_LEGEND[ch] ?? 'grass_a') !== true;
}

function startFor(map: MapDef): { x: number; y: number } {
  switch (map.id) {
    case 'lotus_harbor': return CH8_WORLD.lotusHarbor.arrival.riverboat;
    case 'bamboo_road': return CH8_WORLD.lotusHarbor.transition.bamboo.landing;
    case 'spore_forest': return CH8_WORLD.bambooRoad.transition.spore.landing;
    default: return CH8_WORLD.sporeForest.transition.temple.landing;
  }
}

function inside(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function walkableTiles(
  map: MapDef,
  blocked: readonly Rect[] = [],
  start: { x: number; y: number } = startFor(map),
): Set<string> {
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [[start.x, start.y]];
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    const key = `${x},${y}`;
    if (seen.has(key) || blocked.some((rect) => inside(rect, x, y)) || !isWalkable(map, x, y)) continue;
    seen.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

function rectHasReachableTile(seen: Set<string>, rect: Rect): boolean {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (seen.has(`${x},${y}`)) return true;
    }
  }
  return false;
}

function propSolidRect(prop: PropDef): Rect | null {
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

function pointInsideProp(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function expandedPoint(point: { x: number; y: number }, margin: number): Rect {
  return { x: point.x - margin, y: point.y - margin, w: margin * 2 + 1, h: margin * 2 + 1 };
}

function tileIsPropClear(map: MapDef, x: number, y: number): boolean {
  return !map.props
    .map(propSolidRect)
    .filter((rect): rect is Rect => rect !== null)
    .some((rect) => pointInsideProp(rect, x * 16 + 8, y * 16 + 12));
}

interface WorldGeometry {
  path: string;
  rect: Rect;
  point: boolean;
}

function collectWorldGeometry(value: unknown, path = '', result: WorldGeometry[] = []): WorldGeometry[] {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectWorldGeometry(entry, `${path}.${index}`, result));
    return result;
  }
  if (!value || typeof value !== 'object') return result;
  const record = value as Record<string, unknown>;
  if (typeof record.x === 'number' && typeof record.y === 'number') {
    const point = typeof record.w !== 'number' && typeof record.h !== 'number';
    result.push({
      path: path.replace(/^\./, ''),
      rect: {
        x: record.x,
        y: record.y,
        w: typeof record.w === 'number' ? record.w : 1,
        h: typeof record.h === 'number' ? record.h : 1,
      },
      point,
    });
    return result;
  }
  for (const [key, entry] of Object.entries(record)) {
    collectWorldGeometry(entry, path ? `${path}.${key}` : key, result);
  }
  return result;
}

const WORLD_ROOT_MAP: Readonly<Record<string, string>> = {
  lotusHarbor: 'lotus_harbor',
  bambooRoad: 'bamboo_road',
  sporeForest: 'spore_forest',
  mtShuTemple: 'mt_shu_temple',
};

const LANDING_TARGET_MAP: Readonly<Record<string, string>> = {
  'lotusHarbor.transition.bamboo.landing': 'bamboo_road',
  'bambooRoad.transition.lotus.landing': 'lotus_harbor',
  'bambooRoad.transition.spore.landing': 'spore_forest',
  'sporeForest.transition.bamboo.landing': 'bamboo_road',
  'sporeForest.transition.temple.landing': 'mt_shu_temple',
  'mtShuTemple.transition.spore.landing': 'spore_forest',
};

function targetMapIdsForGeometry(path: string): readonly string[] {
  if (path === 'lotusHarbor.unitMigration') return LOTUS_HARBOR_UNIT_IDS;
  if (path === 'lotusHarbor.hotelRoom.migration') return [CH8_WORLD.lotusHarbor.hotelRoom.id];
  if (LANDING_TARGET_MAP[path]) return [LANDING_TARGET_MAP[path]];
  return [WORLD_ROOT_MAP[path.split('.')[0]]];
}

function squareIsWalkable(map: MapDef, point: { x: number; y: number }, width: number): boolean {
  const low = -Math.floor((width - 1) / 2);
  const high = low + width - 1;
  for (let dy = low; dy <= high; dy++) {
    for (let dx = low; dx <= high; dx++) {
      if (!isWalkable(map, point.x + dx, point.y + dy)) return false;
    }
  }
  return true;
}

describe('Chapter 8 production world contract', () => {
  it('pins the exact four-map roster and production dimensions', () => {
    const maps = buildChapter8Maps();
    expect(Object.keys(maps)).toEqual([...CH8_MAP_IDS]);
    expect(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, [map.grid[0].length, map.grid.length]]))).toEqual({
      lotus_harbor: [112, 80],
      bamboo_road: [104, 64],
      spore_forest: [88, 104],
      mt_shu_temple: [96, 104],
    });
  });

  it('builds byte-identically and keeps profile/migration points in one registry', () => {
    expect(JSON.stringify(buildChapter8Maps())).toBe(JSON.stringify(buildChapter8Maps()));
    expect(CH8_WORLD.lotusHarbor).toMatchObject({
      arrival: { riverboat: { x: 14, y: 68, facing: 'up' }, city: { x: 50, y: 56, facing: 'up' } },
      migration: { x: 50, y: 58, facing: 'down' },
      unitMigration: { x: 5, y: 7, facing: 'up' },
      hotelRoom: { id: 'citysvc_lotus_harbor_hotel_room', migration: { x: 5, y: 7, facing: 'up' } },
    });
    expect(CH8_WORLD.sporeForest.profiles.forestCured).toEqual(CH8_WORLD.sporeForest.recovery);
    expect(CH8_WORLD.mtShuTemple.profiles.boss).toEqual(CH8_WORLD.mtShuTemple.bossRestart);
    expect(CH8_WORLD.mtShuTemple.profiles.complete).toEqual(CH8_WORLD.mtShuTemple.resonanceApproach);
    expect(CH8_WORLD.lotusHarbor.story.orientation).toEqual({ x: 39, y: 52, w: 18, h: 10 });
    expect(CH8_WORLD.bambooRoad.story.clickerClearing).toEqual({ x: 28, y: 43, w: 11, h: 7 });
    expect(CH8_WORLD.sporeForest.story.scramble).toEqual({ x: 38, y: 87, w: 12, h: 7 });
    expect(CH8_WORLD.sporeForest.story.pippaCreases).toEqual({ x: 35, y: 30, w: 12, h: 8 });
    expect(CH8_WORLD.sporeForest.transition.temple.landing).toEqual({ x: 48, y: 98, facing: 'up' });
    expect(CH8_WORLD.mtShuTemple.yakArrival).toEqual({ x: 48, y: 94, facing: 'up' });
  });

  it('keeps every route reciprocal with CH8_WORLD-derived body-safe landings', () => {
    const maps = buildChapter8Maps();
    const expectedLanding: Record<string, { x: number; y: number }> = {
      'lotus_harbor>bamboo_road': CH8_WORLD.lotusHarbor.transition.bamboo.landing,
      'bamboo_road>lotus_harbor': CH8_WORLD.bambooRoad.transition.lotus.landing,
      'bamboo_road>spore_forest': CH8_WORLD.bambooRoad.transition.spore.landing,
      'spore_forest>bamboo_road': CH8_WORLD.sporeForest.transition.bamboo.landing,
      'spore_forest>mt_shu_temple': CH8_WORLD.sporeForest.transition.temple.landing,
      'mt_shu_temple>spore_forest': CH8_WORLD.mtShuTemple.transition.spore.landing,
    };
    for (const map of Object.values(maps)) {
      for (const door of map.doors.filter((candidate) => CH8_MAP_IDS.includes(candidate.to as (typeof CH8_MAP_IDS)[number]))) {
        const target = maps[door.to as keyof typeof maps];
        expect(target.doors.some((back) => back.to === map.id), `${map.id} -> ${door.to}`).toBe(true);
        const landing = expectedLanding[`${map.id}>${door.to}`];
        expect({ tx: door.tx, ty: door.ty }).toEqual(nativeFeet(landing));
        for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1]] as const) {
          expect(isWalkable(target, landing.x + dx, landing.y + dy), `${map.id} -> ${door.to} body ${dx},${dy}`).toBe(true);
        }
      }
    }
  });

  it('makes every door, trigger, NPC, and sign reachable from its chapter entry', () => {
    for (const map of Object.values(buildChapter8Maps())) {
      const seen = walkableTiles(map);
      for (const trigger of map.triggers) expect(rectHasReachableTile(seen, trigger.rect), `${map.id}:${trigger.id}`).toBe(true);
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(seen.has(`${Math.floor(actor.x)},${Math.floor(actor.y)}`), `${map.id}:${actor.x},${actor.y}`).toBe(true);
      }
      for (const door of map.doors) expect(rectHasReachableTile(seen, door), `${map.id} door ${door.to}`).toBe(true);
    }
  });

  it('keeps Chapter 8 trigger IDs unique within the four-map production scope', () => {
    const occurrences = Object.values(buildChapter8Maps()).flatMap((map) =>
      map.triggers.map((trigger) => `${trigger.id}@${map.id}`));
    const byId = new Map<string, string[]>();
    for (const occurrence of occurrences) {
      const [id] = occurrence.split('@');
      byId.set(id, [...(byId.get(id) ?? []), occurrence]);
    }
    expect([...byId.values()].filter((entries) => entries.length > 1)).toEqual([]);
  });

  it('exhaustively keeps every CH8_WORLD point/rectangle in-bounds, reachable, and prop-clear', () => {
    const primary = buildChapter8Maps();
    const geometries = collectWorldGeometry(CH8_WORLD);
    const invalid: string[] = [];
    expect(geometries.length).toBeGreaterThan(60);

    for (const geometry of geometries) {
      for (const mapId of targetMapIdsForGeometry(geometry.path)) {
        const map = primary[mapId as keyof typeof primary] ?? MAPS[mapId];
        expect(map, `${geometry.path} target ${mapId}`).toBeDefined();
        const width = map.grid[0].length;
        const height = map.grid.length;
        expect(geometry.rect.x, geometry.path).toBeGreaterThanOrEqual(0);
        expect(geometry.rect.y, geometry.path).toBeGreaterThanOrEqual(0);
        expect(geometry.rect.x + geometry.rect.w, geometry.path).toBeLessThanOrEqual(width);
        expect(geometry.rect.y + geometry.rect.h, geometry.path).toBeLessThanOrEqual(height);

        const chapterMap = CH8_MAP_IDS.includes(mapId as (typeof CH8_MAP_IDS)[number]);
        const seen = walkableTiles(
          map,
          [],
          chapterMap ? startFor(map) : { x: geometry.rect.x, y: geometry.rect.y },
        );
        const validTiles: string[] = [];
        for (let y = geometry.rect.y; y < geometry.rect.y + geometry.rect.h; y++) {
          for (let x = geometry.rect.x; x < geometry.rect.x + geometry.rect.w; x++) {
            if (seen.has(`${x},${y}`) && tileIsPropClear(map, x, y)) validTiles.push(`${x},${y}`);
          }
        }
        if (validTiles.length === 0) invalid.push(`${geometry.path} on ${mapId}: no reachable prop-clear tile`);
        if (geometry.point && (validTiles.length !== 1 || validTiles[0] !== `${geometry.rect.x},${geometry.rect.y}`)) {
          invalid.push(`${geometry.path} on ${mapId}: exact point is not reachable and prop-clear`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('pins follower-safe width at every mandatory route handoff and recovery court', () => {
    const maps = buildChapter8Maps();
    const checkpoints: Array<[
      keyof typeof maps,
      { x: number; y: number },
      number,
      string,
    ]> = [
      ['lotus_harbor', CH8_WORLD.lotusHarbor.arrival.riverboat, 3, 'riverboat arrival'],
      ['lotus_harbor', CH8_WORLD.lotusHarbor.arrival.city, 3, 'city fan'],
      ['lotus_harbor', CH8_WORLD.bambooRoad.transition.lotus.landing, 3, 'Bamboo return'],
      ['bamboo_road', CH8_WORLD.lotusHarbor.transition.bamboo.landing, 3, 'Lotus gate'],
      ['bamboo_road', CH8_WORLD.bambooRoad.profiles.barge, 3, 'lower braid'],
      ['bamboo_road', CH8_WORLD.bambooRoad.recovery, 3, 'switchback rest'],
      ['bamboo_road', CH8_WORLD.bambooRoad.yakDepot, 3, 'Yak depot'],
      ['bamboo_road', CH8_WORLD.sporeForest.transition.bamboo.landing, 3, 'Spore return'],
      ['spore_forest', CH8_WORLD.bambooRoad.transition.spore.landing, 3, 'forest trailhead'],
      ['spore_forest', CH8_WORLD.sporeForest.recovery, 3, 'clean recovery'],
      ['spore_forest', CH8_WORLD.sporeForest.kiln, 3, 'kiln loop'],
      ['spore_forest', CH8_WORLD.sporeForest.yakPickup, 3, 'Yak ledge'],
      ['spore_forest', CH8_WORLD.mtShuTemple.transition.spore.landing, 3, 'temple return'],
      ['mt_shu_temple', CH8_WORLD.sporeForest.transition.temple.landing, 4, 'Yak terrace entry'],
      ['mt_shu_temple', CH8_WORLD.mtShuTemple.yakArrival, 4, 'Yak arrival'],
      ['mt_shu_temple', CH8_WORLD.mtShuTemple.profiles.temple, 4, 'folded ascent'],
      ['mt_shu_temple', CH8_WORLD.mtShuTemple.recovery, 4, 'recovery court'],
      ['mt_shu_temple', CH8_WORLD.mtShuTemple.bossRestart, 4, 'boss restart'],
      ['mt_shu_temple', CH8_WORLD.mtShuTemple.resonanceApproach, 4, 'bell approach'],
    ];
    for (const [mapId, point, width, label] of checkpoints) {
      expect(squareIsWalkable(maps[mapId], point, width), `${mapId}:${label} ${width}-tile width`).toBe(true);
    }
  });

  it('keeps every authored interaction in bounds with at least one prop-clear tile', () => {
    for (const map of Object.values(buildChapter8Maps())) {
      const w = map.grid[0].length;
      const h = map.grid.length;
      const solids = map.props.map(propSolidRect).filter((rect): rect is Rect => rect !== null);
      for (const trigger of map.triggers) {
        expect(trigger.rect.x).toBeGreaterThanOrEqual(0);
        expect(trigger.rect.y).toBeGreaterThanOrEqual(0);
        expect(trigger.rect.x + trigger.rect.w).toBeLessThanOrEqual(w);
        expect(trigger.rect.y + trigger.rect.h).toBeLessThanOrEqual(h);
        let clear = false;
        for (let y = trigger.rect.y; y < trigger.rect.y + trigger.rect.h && !clear; y++) {
          for (let x = trigger.rect.x; x < trigger.rect.x + trigger.rect.w; x++) {
            if (isWalkable(map, x, y) && !solids.some((rect) => pointInsideProp(rect, x * 16 + 8, y * 16 + 12))) clear = true;
          }
        }
        expect(clear, `${map.id}:${trigger.id}`).toBe(true);
      }
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(actor.x).toBeGreaterThanOrEqual(0);
        expect(actor.y).toBeGreaterThanOrEqual(0);
        expect(actor.x).toBeLessThan(w);
        expect(actor.y).toBeLessThan(h);
        expect(solids.some((rect) => pointInsideProp(rect, actor.x * 16 + 8, actor.y * 16 + 12)), `${map.id}:${actor.x},${actor.y}`).toBe(false);
      }
    }
  });

  it('ships Lotus Harbor as a compliant crescent city with clear arrival and vehicle bays', () => {
    const map = buildChapter8Maps().lotus_harbor;
    expect(cityViolations(map)).toEqual([]);
    expect(MAPS.lotus_harbor.area).toBe('lotus_harbor');
    expect(map.grid.flatMap((row) => [...row]).filter((tile) => tile === 'e').length).toBeGreaterThan(500);
    expect(map.reflect).toHaveLength(1);
    for (const point of [
      CH8_WORLD.lotusHarbor.arrival.riverboat,
      CH8_WORLD.lotusHarbor.arrival.city,
      CH8_WORLD.lotusHarbor.riverboat,
      CH8_WORLD.lotusHarbor.dock,
      { x: CH8_WORLD.lotusHarbor.vehicleBay.x, y: CH8_WORLD.lotusHarbor.vehicleBay.y },
    ]) expect(isWalkable(map, point.x, point.y), `${point.x},${point.y}`).toBe(true);
  });

  it('pins historical Lotus units 0-3 and appends deterministic tenancy through unit 21', () => {
    const raw = buildChapter8Maps().lotus_harbor.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(raw).toHaveLength(24);
    expect(raw.slice(0, 4).map((prop) => prop.sprite)).toEqual([
      'bldg_lotus_harbor_lantern_shop',
      'bldg_lotus_harbor_tea_house',
      'bldg_lotus_harbor_temple',
      'bldg_lotus_harbor_tea_house',
    ]);
    expect(new Set(raw.map((prop) => prop.sprite))).toEqual(new Set(LOTUS_HARBOR_FACADES));

    const live = MAPS.lotus_harbor.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(live.map((prop) => formalCityFacadeSource(prop.sprite))).toEqual(raw.map((prop) => prop.sprite));
    expect(live.slice(0, 4).map((prop) => prop.door?.to)).toEqual(LOTUS_HARBOR_UNIT_IDS.slice(0, 4));
    const liveUnitIds = Object.keys(MAPS).filter((id) => /^lotus_harbor_unit_\d+$/.test(id));
    expect(new Set(liveUnitIds)).toEqual(new Set(LOTUS_HARBOR_UNIT_IDS));
    expect(livingCityViolations(MAPS.lotus_harbor)).toEqual([]);

    expect(MAPS.lotus_harbor_unit_0.name).toBe('LOTUS HARBOR HOMES');
    expect(MAPS.lotus_harbor_unit_1.name).toBe('OPEN HOUSE — LOTUS ROW TOWNHOUSE');
    expect(MAPS.lotus_harbor_unit_2.name).toBe('NEON CRANE AUTO SALON');
    expect(MAPS.lotus_harbor_unit_3.name).toBe('LOTUS LANTERN HOTEL — LOBBY');
    expect(MAPS.lotus_harbor_unit_0.npcs.map((npc) => npc.id)).toContain(cityServiceNpcId('lotus_harbor', 'realtor'));
    expect(MAPS.lotus_harbor_unit_1.npcs.map((npc) => npc.id)).toContain(cityServiceNpcId('lotus_harbor', 'home_host'));
    expect(MAPS.lotus_harbor_unit_2.npcs.map((npc) => npc.id)).toContain(cityServiceNpcId('lotus_harbor', 'dealer'));
    expect(MAPS.lotus_harbor_unit_3.npcs.map((npc) => npc.id)).toContain(cityServiceNpcId('lotus_harbor', 'hotel_clerk'));
  });

  it('owns all eight Lotus source identities and routes every promoted key through authored art', () => {
    expect(Object.keys(FORMAL_CITY_FACADE_SOURCE_WIDTHS.lotus_harbor)).toEqual([...LOTUS_HARBOR_FACADES]);
    expect(Object.values(FORMAL_CITY_FACADE_SOURCE_WIDTHS.lotus_harbor).every((width) => width === 4)).toBe(true);
    const promoted = LOTUS_HARBOR_FACADES.map((source) => `bldg_cityscale_lotus_harbor_${source.replace(/^bldg_/, '')}`);
    expect(AUTHORED_LOTUS_HARBOR_CITY_SCALE_FACADES).toEqual(promoted);
    for (const key of promoted) expect(AUTHORED_FACADE_KEYS).toContain(key);

    const landmarkSources = new Set([
      'bldg_lotus_harbor_grand_market', 'bldg_lotus_harbor_pagoda',
      'bldg_lotus_harbor_temple', 'bldg_lotus_harbor_theater',
    ]);
    for (const prop of MAPS.lotus_harbor.props.filter((candidate) => candidate.sprite.startsWith('bldg_'))) {
      const meta = cityScaleVariantMeta(prop.sprite);
      expect(meta, prop.sprite).toBeDefined();
      expect(meta?.cityId).toBe('lotus_harbor');
      expect(meta?.landmark).toBe(landmarkSources.has(meta!.source));
    }
  });

  it('wires exact story, quest, hazard, and profile anchors from CH8_WORLD', () => {
    const maps = buildChapter8Maps();
    expect(maps.lotus_harbor.triggers.find((trigger) => trigger.id === 'ch8_arrival')?.rect).toBe(CH8_WORLD.lotusHarbor.story.arrival);
    expect(maps.bamboo_road.triggers.find((trigger) => trigger.id === 'ch8_barge_crisis')?.rect).toBe(CH8_WORLD.bambooRoad.story.bargeCrisis);
    expect(maps.spore_forest.triggers.filter((trigger) => /^mushroomize_/.test(trigger.id)).map((trigger) => trigger.rect)).toEqual(CH8_WORLD.sporeForest.hazards.map((hazard) => hazard.rect));
    expect(CH8_WORLD.sporeForest.hazards.map((hazard) => hazard.phase)).toEqual([0, 1, 2]);
    expect(maps.spore_forest.triggers.filter((trigger) => /^q_brush_/.test(trigger.id)).map((trigger) => trigger.id)).toEqual(CH8_WORLD.sporeForest.quest.brushes.map((brush) => brush.flag));
    expect(maps.mt_shu_temple.triggers.find((trigger) => trigger.id === 'paper_dragon_boss')?.rect).toBe(CH8_WORLD.mtShuTemple.story.paperDragon);
    expect(maps.mt_shu_temple.triggers.find((trigger) => trigger.id === 'mt_shu_temple_resonance')?.rect).toBe(CH8_WORLD.mtShuTemple.resonance);
  });

  it('keeps the four frozen overlaps explicit and orders story before quest or hazard dispatch', () => {
    const maps = buildChapter8Maps();
    const pairs = Object.values(maps).flatMap((map) => map.triggers.flatMap((first, index) =>
      map.triggers.slice(index + 1)
        .filter((second) => overlaps(first.rect, second.rect))
        .map((second) => [map.id, first.id, second.id] as const)));
    expect(pairs).toEqual([
      ['lotus_harbor', 'ch8_orientation', 'q_false_fold_lantern_2'],
      ['bamboo_road', 'ch8_barge_crisis', 'ch8_clicker_clearing'],
      ['spore_forest', 'spore_forest_scramble', 'mushroomize_0'],
      ['spore_forest', 'ch8_pippa_creases', 'mushroomize_2'],
    ]);
  });

  it('persists all five quest footprints and all four retry-safe optional caches', () => {
    const maps = buildChapter8Maps();
    const footprints = [
      ['lotus_harbor', 'q_brushes_done', 'q_brushes_footprint_rack'],
      ['lotus_harbor', 'q_false_fold_lanterns_done', 'q_false_fold_footprint'],
      ['bamboo_road', 'q_yak_waits_done', 'q_yak_waits_footprint'],
      ['lotus_harbor', 'q_harbor_balance_done', 'q_harbor_balance_footprint'],
      ['mt_shu_temple', 'q_empty_chair_done', 'q_empty_chair_footprint'],
    ] as const;
    for (const [mapId, flag, dialogue] of footprints) {
      const map = maps[mapId];
      expect(map.props.some((prop) => prop.ifFlag === flag), `${flag} changes a prop`).toBe(true);
      expect(map.signs.some((sign) => sign.ifFlag === flag && sign.dialogue === dialogue), dialogue).toBe(true);
    }

    const caches = [
      ['lotus_harbor', 'q_lotus_jade_cache'],
      ['bamboo_road', 'q_bamboo_islet_cache'],
      ['spore_forest', 'q_spore_kiln_cache'],
      ['mt_shu_temple', 'q_mt_shu_jade_cache'],
    ] as const;
    for (const [mapId, flag] of caches) {
      const map = maps[mapId];
      expect(map.props.some((prop) => prop.sprite === 'gift_box' && prop.unlessFlag === flag), `${flag} closed`).toBe(true);
      expect(map.props.some((prop) => prop.sprite === 'gift_box_open' && prop.ifFlag === flag), `${flag} open`).toBe(true);
      expect(map.signs.some((sign) => sign.dialogue === flag && sign.unlessFlag === flag), `${flag} interaction`).toBe(true);
    }
  });

  it('shows every Chapter 8 quest target before completion and visibly refolds its lanterns', () => {
    const maps = buildChapter8Maps();
    const lotus = maps.lotus_harbor;
    const falseFolds = lotus.props.filter((prop) =>
      prop.sprite === 'festival_lantern_span' && prop.unlessFlag === 'q_false_fold_lanterns_done');
    const honestFolds = lotus.props.filter((prop) =>
      prop.sprite === 'festival_lantern_span' && prop.ifFlag === 'q_false_fold_lanterns_done');
    expect(falseFolds).toHaveLength(3);
    expect(falseFolds.every((prop) => prop.rot === 180 && prop.scale === 0.86)).toBe(true);
    expect(honestFolds).toHaveLength(3);
    expect(honestFolds.every((prop) => prop.rot === undefined && prop.scale === undefined)).toBe(true);

    for (const index of [1, 2] as const) {
      expect(lotus.props.some((prop) =>
        prop.sprite === 'puerto_mooring_bollards'
        && prop.unlessFlag === `q_harbor_balance_weight_${index}`), `weight ${index}`).toBe(true);
    }

    const bamboo = maps.bamboo_road;
    expect(bamboo.props.some((prop) =>
      prop.sprite === 'well' && prop.unlessFlag === 'q_yak_waits_route')).toBe(true);
    expect(bamboo.props.some((prop) =>
      prop.sprite === 'prop_trail_marker' && prop.unlessFlag === 'q_yak_waits_route')).toBe(true);
  });

  it('leaves a reachable gated repaired-lock footprint', () => {
    const maps = buildChapter8Maps();
    const bamboo = maps.bamboo_road;
    expect(bamboo.props).toContainEqual(expect.objectContaining({
      sprite: 'puerto_cargo_crane', ifFlag: 'thread_clicker_clearing',
    }));
    const lockSign = bamboo.signs.find((sign) => sign.dialogue === 'ch8_lock_footprint');
    expect(lockSign).toMatchObject({ ifFlag: 'thread_clicker_clearing' });
    expect(walkableTiles(bamboo).has(`${lockSign!.x},${lockSign!.y}`)).toBe(true);
  });

  it('gives every named Chapter 8 specialist a distinct authored identity', () => {
    const maps = buildChapter8Maps();
    const roles = [
      maps.lotus_harbor.npcs.find((npc) => npc.id === 'lh_harbor_master'),
      maps.lotus_harbor.npcs.find((npc) => npc.id === 'lh_calligrapher'),
      maps.lotus_harbor.npcs.find((npc) => npc.id === 'lh_lantern_girl'),
      maps.lotus_harbor.npcs.find((npc) => npc.id === 'lh_tea_monk'),
      maps.lotus_harbor.npcs.find((npc) => npc.id === 'lh_yak_handler'),
      maps.bamboo_road.npcs.find((npc) => npc.id === 'lotus_bargeman'),
      maps.mt_shu_temple.npcs.find((npc) => npc.id === 'mt_shu_elder'),
    ];
    expect(roles.every(Boolean)).toBe(true);
    expect(roles.map((npc) => npc!.sprite)).toEqual([
      'lh_harbor_master', 'lh_calligrapher', 'lh_lantern_girl', 'lh_tea_monk',
      'lh_yak_handler', 'lotus_bargeman', 'mt_shu_elder',
    ]);
    expect(new Set(roles.map((npc) => npc!.sprite)).size).toBe(7);
    expect(roles[5]).toMatchObject({
      x: 39, y: 43, ifFlag: 'thread_clicker_clearing', dialogue: 'npc_lotus_bargeman',
    });
    expect(walkableTiles(maps.bamboo_road).has('39,43')).toBe(true);
  });

  it('gives every Mushroomized belt a hazard-free return through the safe-pocket network', () => {
    const map = buildChapter8Maps().spore_forest;
    const hazards = CH8_WORLD.sporeForest.hazards.map((hazard) => hazard.rect);
    const clean = walkableTiles(map, hazards);
    for (const point of [...CH8_WORLD.sporeForest.safePockets, ...CH8_WORLD.sporeForest.safeExits]) {
      expect(clean.has(`${point.x},${point.y}`), `clean return reaches ${point.x},${point.y}`).toBe(true);
    }
    for (const hazard of CH8_WORLD.sporeForest.hazards) {
      expect(rectHasReachableTile(walkableTiles(map), hazard.rect), hazard.id).toBe(true);
    }
  });

  it('separates Paper Dragon from the post-reward bell and gates the only stair', () => {
    const map = buildChapter8Maps().mt_shu_temple;
    expect(overlaps(CH8_WORLD.mtShuTemple.bossArena, CH8_WORLD.mtShuTemple.resonance)).toBe(false);
    expect(CH8_WORLD.mtShuTemple.bossArena.y).toBeGreaterThan(CH8_WORLD.mtShuTemple.resonance.y);
    expect(CH8_WORLD.mtShuTemple.recovery.y).toBeGreaterThan(CH8_WORLD.mtShuTemple.story.paperDragon.y + CH8_WORLD.mtShuTemple.story.paperDragon.h);
    const gate = map.props.find((prop) => prop.sprite === 'pyramid_gate');
    expect(gate).toMatchObject({ x: 44, y: 17, unlessFlag: 'paper_fan_claimed' });
    const beforeVictory = walkableTiles(map, [{ x: 44, y: 17, w: 8, h: 1 }]);
    expect(rectHasReachableTile(beforeVictory, CH8_WORLD.mtShuTemple.bossArena)).toBe(true);
    expect(rectHasReachableTile(beforeVictory, CH8_WORLD.mtShuTemple.resonance)).toBe(false);
  });

  it('retires every hostile spawner after Paper Dragon and keeps four-tile grace zones clear', () => {
    const maps = buildChapter8Maps();
    const spawners = Object.values(maps).flatMap((map) => map.spawners.map((spawner) => ({ map, spawner })));
    expect(spawners).toHaveLength(10);
    expect(spawners.every(({ spawner }) => spawner.unlessFlag === 'paper_dragon_defeated')).toBe(true);
    expect(new Set(spawners.flatMap(({ spawner }) => spawner.enemies))).toEqual(new Set([
      'paper_lantern_wisp', 'spore_puffer', 'origami_warrior', 'porcelain_warlord',
    ]));
    for (const { map, spawner } of spawners) {
      expect(rectHasReachableTile(walkableTiles(map), spawner.rect), `${map.id} pressure`).toBe(true);
      for (const door of map.doors) expect(overlaps(spawner.rect, door), `${map.id} spawner overlaps ${door.to}`).toBe(false);
    }
    for (const map of Object.values(maps)) {
      expect(pressureHardFlags(pressureReport(map, IS_SOLID)), `${map.id} encounter pressure`).toEqual([]);
    }

    const grace: Array<[MapDef, { x: number; y: number }]> = [
      [maps.bamboo_road, CH8_WORLD.bambooRoad.recovery],
      [maps.spore_forest, CH8_WORLD.sporeForest.recovery],
      [maps.mt_shu_temple, CH8_WORLD.mtShuTemple.recovery],
    ];
    for (const [map, point] of grace) {
      for (const spawner of map.spawners) expect(overlaps(spawner.rect, expandedPoint(point, 4)), `${map.id} recovery grace`).toBe(false);
    }
  });

  it('pins the three-recovery rhythm: Lotus, Spore Forest, and Mt. Shu only', () => {
    const maps = buildChapter8Maps();
    expect(CH8_MAP_IDS.map((id) => maps[id].props.filter((prop) => prop.sprite === 'picnic').length)).toEqual([1, 0, 1, 1]);
    expect(CH8_MAP_IDS.map((id) => maps[id].props
      .filter((prop) => prop.sprite === 'picnic')
      .map((prop) => [prop.x, prop.y]))).toEqual([
      [[54, 57]],
      [],
      [[15, 70]],
      [[49, 40]],
    ]);
    for (const [mapId, recovery] of [
      ['lotus_harbor', CH8_WORLD.lotusHarbor.recovery],
      ['bamboo_road', CH8_WORLD.bambooRoad.recovery],
      ['spore_forest', CH8_WORLD.sporeForest.recovery],
      ['mt_shu_temple', CH8_WORLD.mtShuTemple.recovery],
    ] as const) {
      expect(tileIsPropClear(maps[mapId], recovery.x, recovery.y), `${mapId} recovery`).toBe(true);
    }
  });
});
