import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import {
  BRIDGE_BERRY_CROSSING,
  CH4_MAP_IDS,
  CH4_WORLD,
  SPINE_MELTFALL_CROSSING,
  buildChapter4Maps,
} from './maps_ch4';
import { LIVE_PROPERTIES } from './properties';
import { STATIONS } from './stations';
import { bridgeBerryClears } from '../engine/ch4-world';

const walkable = new Set(['.', ',', '~', 'f', 'F', ':', '^', 'T', 'w', 'r', 'o', 'M', '=', 'R', 'D', '_', 'X', 'P', 'd']);

describe('Chapter 4 production world contract', () => {
  it('pins the exact six-map roster and production dimensions', () => {
    const maps = buildChapter4Maps();
    expect(Object.keys(maps)).toEqual([...CH4_MAP_IDS]);
    expect(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, [map.grid[0].length, map.grid.length]]))).toEqual({
      kvisthavn: [64, 48], bootstep_moor: [112, 80], lilleby: [72, 56],
      spine_hand: [48, 36], spine_shoulder: [56, 40], spine_ear: [52, 40],
    });
  });

  it('builds byte-identically on repeated calls', () => {
    expect(JSON.stringify(buildChapter4Maps())).toBe(JSON.stringify(buildChapter4Maps()));
  });

  it('keeps every route reciprocal with body-safe walkable landings', () => {
    const maps = buildChapter4Maps();
    for (const map of Object.values(maps)) {
      for (const door of map.doors.filter((door) => CH4_MAP_IDS.includes(door.to as (typeof CH4_MAP_IDS)[number]))) {
        const target = maps[door.to];
        expect(target.doors.some((back) => back.to === map.id), `${map.id} → ${door.to}`).toBe(true);
        const tx = Math.floor(door.tx / 16); const ty = Math.floor(door.ty / 16);
        expect(walkable.has(target.grid[ty][tx]), `${map.id} → ${door.to} '${target.grid[ty][tx]}'`).toBe(true);
      }
    }
  });

  it('pins every trigger, NPC, sign and service anchor in bounds', () => {
    for (const map of Object.values(buildChapter4Maps())) {
      const w = map.grid[0].length; const h = map.grid.length;
      for (const trigger of map.triggers) {
        expect(trigger.rect.x).toBeGreaterThanOrEqual(0); expect(trigger.rect.y).toBeGreaterThanOrEqual(0);
        expect(trigger.rect.x + trigger.rect.w).toBeLessThanOrEqual(w);
        expect(trigger.rect.y + trigger.rect.h).toBeLessThanOrEqual(h);
      }
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(actor.x).toBeGreaterThanOrEqual(0); expect(actor.y).toBeGreaterThanOrEqual(0);
        expect(actor.x).toBeLessThan(w); expect(actor.y).toBeLessThan(h);
      }
    }
  });

  it('makes Bridge Berry one persistent closed/open geometry contract with two valid solutions', () => {
    const moor = buildChapter4Maps().bootstep_moor;
    const prop = moor.props.find((candidate) => candidate.sprite === 'mini_giant_berry_blocker');
    expect(prop).toMatchObject({ x: BRIDGE_BERRY_CROSSING.x, y: BRIDGE_BERRY_CROSSING.y, unlessFlag: 'moor_berry_cleared' });
    expect(prop?.solid).toBeDefined();
    expect(moor.triggers.find((trigger) => trigger.id === 'moor_bridge_berry')?.rect).toEqual(BRIDGE_BERRY_CROSSING);
    expect(bridgeBerryClears('fight', true)).toBe(true);
    expect(bridgeBerryClears('fight', false)).toBe(false);
    expect(bridgeBerryClears('roll')).toBe(true);
    expect(bridgeBerryClears('leave')).toBe(false);
  });

  it('pins the dual-state meltfall and orders boss before resonance', () => {
    const maps = buildChapter4Maps();
    const shoulder = maps.spine_shoulder;
    for (let y = SPINE_MELTFALL_CROSSING.y; y < SPINE_MELTFALL_CROSSING.y + SPINE_MELTFALL_CROSSING.h; y++) {
      for (let x = SPINE_MELTFALL_CROSSING.x; x < SPINE_MELTFALL_CROSSING.x + SPINE_MELTFALL_CROSSING.w; x++) {
        expect(shoulder.grid[y][x]).toBe('E');
      }
    }
    expect(shoulder.triggers.some((trigger) => trigger.id === 'spine_meltfall')).toBe(true);
    const ids = maps.spine_ear.triggers.map((trigger) => trigger.id);
    expect(ids.indexOf('whisperwig_boss')).toBeLessThan(ids.indexOf('sleepers_ear_resonance'));
    expect(maps.spine_ear.spawners.every((spawner) => spawner.unlessFlag === 'whisperwig_defeated')).toBe(true);
  });

  it('preserves giant identity, authored landmarks, picnic rests and live services', () => {
    const maps = buildChapter4Maps();
    expect(CH4_WORLD.lilleby.scale).toBe(2.3);
    expect(maps.bootstep_moor.props.filter((prop) => prop.sprite === 'giant_bootprint_snow')).toHaveLength(4);
    expect(Object.values(maps).flatMap((map) => map.props).filter((prop) => prop.sprite === 'picnic')).toHaveLength(3);
    expect(maps.lilleby.props.filter((prop) => prop.sprite.startsWith('bldg_lilleby_')).length).toBeGreaterThanOrEqual(4);
    expect(LIVE_PROPERTIES).toContain('fjord_cabin');
    expect(STATIONS.kvisthavn_fyll.fuels).toEqual(['gas', 'diesel', 'electric']);
    expect(STATIONS.lilleby_giant_pump.fuels).toEqual(['gas', 'diesel']);
    expect(MAPS.kvisthavn_unit_0.name).toContain('KVISTHAVN CABIN');
    expect(MAPS.kvisthavn_unit_1.npcs.some((npc) => npc.shop === 'kvisthavn_supply')).toBe(true);
    expect(MAPS.kvisthavn_unit_2.npcs.some((npc) => npc.id === 'citysvc_kvisthavn_realtor')).toBe(true);
    expect(MAPS.kvisthavn_unit_3.npcs.some((npc) => npc.id === 'citysvc_kvisthavn_dealer')).toBe(true);
  });
});
