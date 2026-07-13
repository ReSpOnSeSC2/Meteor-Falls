import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import { CH5_MAP_IDS, CH5_WORLD, buildChapter5Maps } from './maps_ch5';
import { cityServiceNpcId } from './city_amenities';

const walkable = new Set(['.', ',', '~', 'f', 'F', ':', '^', 'T', 'w', 'r', 'o', 'M', '=', 'R', 'D', '_', 'X', 'P', 'd', 'p']);

describe('Chapter 5 production world contract', () => {
  it('pins the exact four-map roster and production dimensions', () => {
    const maps = buildChapter5Maps();
    expect(Object.keys(maps)).toEqual([...CH5_MAP_IDS]);
    expect(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, [map.grid[0].length, map.grid.length]]))).toEqual({
      minimus_major: [72, 56], procession_way: [104, 64],
      the_hedgerow: [88, 72], ducal_crown: [52, 40],
    });
  });

  it('builds byte-identically on repeated calls', () => {
    expect(JSON.stringify(buildChapter5Maps())).toBe(JSON.stringify(buildChapter5Maps()));
  });

  it('keeps every route reciprocal with body-safe walkable landings', () => {
    const maps = buildChapter5Maps();
    for (const map of Object.values(maps)) {
      for (const door of map.doors.filter((candidate) => CH5_MAP_IDS.includes(candidate.to as (typeof CH5_MAP_IDS)[number]))) {
        const target = maps[door.to];
        expect(target.doors.some((back) => back.to === map.id), `${map.id} → ${door.to}`).toBe(true);
        const tx = Math.floor(door.tx / 16); const ty = Math.floor(door.ty / 16);
        expect(walkable.has(target.grid[ty][tx]), `${map.id} → ${door.to} '${target.grid[ty][tx]}'`).toBe(true);
      }
    }
  });

  it('pins every trigger, NPC, sign, door, and service anchor in bounds', () => {
    for (const map of Object.values(buildChapter5Maps())) {
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
      for (const door of map.doors) {
        expect(door.x).toBeGreaterThanOrEqual(0); expect(door.y).toBeGreaterThanOrEqual(0);
        expect(door.x + door.w).toBeLessThanOrEqual(w);
        expect(door.y + door.h).toBeLessThanOrEqual(h);
      }
    }
  });

  it('preserves the first six generated unit ids while expanding Minimus to sixteen facades', () => {
    const city = buildChapter5Maps().minimus_major;
    const facades = city.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(facades).toHaveLength(16);
    expect(facades.slice(0, 7).map((prop) => prop.sprite)).toEqual([
      'bldg_minimus_cathedral', 'bldg_minimus_cathedral',
      'bldg_minimus_petit_market', 'bldg_minimus_manor',
      'bldg_minimus_thimble_inn', 'bldg_minimus_thimble_inn',
      'bldg_minimus_cathedral',
    ]);
    for (let i = 0; i < 6; i++) expect(MAPS[`minimus_major_unit_${i}`]).toBeDefined();
    expect(MAPS.minimus_major_unit_0.npcs.some((npc) => npc.id === cityServiceNpcId('minimus_major', 'realtor'))).toBe(true);
    expect(MAPS.minimus_major_unit_1.npcs.some((npc) => npc.id === cityServiceNpcId('minimus_major', 'dealer'))).toBe(true);
    expect(MAPS.minimus_major_unit_2.npcs.some((npc) => npc.id === cityServiceNpcId('minimus_major', 'home_host'))).toBe(true);
    expect(MAPS.minimus_major_unit_3.npcs.some((npc) => npc.id === cityServiceNpcId('minimus_major', 'hotel_clerk'))).toBe(true);
  });

  it('wires every Chapter 5 quest objective to a reachable map trigger', () => {
    const maps = buildChapter5Maps();
    const triggerIds = Object.values(maps).flatMap((map) => map.triggers.map((trigger) => trigger.id));
    expect(triggerIds).toEqual(expect.arrayContaining([
      'q_census_market', 'q_census_stamps',
      'q_repairs_bridge', 'q_repairs_well', 'q_repairs_scaffold',
      'q_lostfound_button', 'q_lostfound_spoon',
      'q_belfry_clappers', 'q_say_cheese',
    ]));
    expect(maps.minimus_major.npcs.map((npc) => npc.id)).toEqual(expect.arrayContaining([
      'mn_census', 'mn_engineer', 'mn_lostfound', 'mn_bellkeeper',
    ]));
    expect(maps.procession_way.npcs.some((npc) => npc.id === 'pw_click')).toBe(true);
  });

  it('orders the Crown boss before resonance and clears the Hedgerow after mercy', () => {
    const maps = buildChapter5Maps();
    const ids = maps.ducal_crown.triggers.map((trigger) => trigger.id);
    expect(ids.indexOf('whiskerzilla_boss')).toBeLessThan(ids.indexOf('ducal_crown_resonance'));
    expect(CH5_WORLD.ducalCrown.boss.y).toBeGreaterThan(CH5_WORLD.ducalCrown.resonance.y);
    expect(maps.the_hedgerow.spawners.every((spawner) => spawner.unlessFlag === 'whiskerzilla_defeated')).toBe(true);
  });

  it('preserves giant-scale identity, authored rest rhythm, and the Royal Long-View', () => {
    const maps = buildChapter5Maps();
    expect(Object.values(maps).flatMap((map) => map.props).filter((prop) => prop.sprite === 'picnic')).toHaveLength(3);
    expect(maps.minimus_major.props.some((prop) => prop.sprite === 'costa_telescope')).toBe(true);
    expect(maps.minimus_major.signs.some((sign) => sign.dialogue === 'sign_minimus_long_view')).toBe(true);
    expect(maps.minimus_major.props).toEqual(expect.arrayContaining([
      expect.objectContaining({ sprite: 'minimus_crown' }),
      expect.objectContaining({ sprite: 'matchbox_podium' }),
    ]));
  });
});
