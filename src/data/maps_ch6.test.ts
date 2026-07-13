import { describe, expect, it } from 'vitest';
import type { MapDef, PropDef } from '../schemas';
import { chapter6ChoiceAction } from '../engine/ch6-world';
import { cityServiceNpcId } from './city_amenities';
import { CHAPTER_MANIFESTS } from './chapters';
import { ENEMIES } from './enemies';
import { formalCityFacadeSource } from './formal_city_scale';
import { MAPS } from './maps';
import { CH6_MAP_IDS, CH6_WORLD, buildChapter6Maps } from './maps_ch6';

const WALKABLE = new Set(['.', ',', '~', 'f', 'F', ':', '^', 'T', 'w', 'r', 'o', 'M', '=', 'R', 'D', '_', 'X', 'P', 'd', 'p']);

function walkableTiles(map: MapDef): Set<string> {
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [];
  const start = map.id === 'zanzibel' ? CH6_WORLD.zanzibel.landing
    : map.id === 'savanna_run' ? { x: 2, y: 50 }
      : map.id === 'laughing_ruins' ? { x: 40, y: 85 }
        : { x: 28, y: 41 };
  queue.push([start.x, start.y]);
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (seen.has(key) || !WALKABLE.has(map.grid[y]?.[x] ?? '')) continue;
    seen.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

function rectHasReachableTile(seen: Set<string>, rect: { x: number; y: number; w: number; h: number }): boolean {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) if (seen.has(`${x},${y}`)) return true;
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

describe('Chapter 6 production world contract', () => {
  it('pins the exact four-map roster and production dimensions', () => {
    const maps = buildChapter6Maps();
    expect(Object.keys(maps)).toEqual([...CH6_MAP_IDS]);
    expect(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, [map.grid[0].length, map.grid.length]]))).toEqual({
      zanzibel: [72, 56], savanna_run: [104, 64],
      laughing_ruins: [80, 88], sphinx_chin: [56, 44],
    });
  });

  it('builds byte-identically on repeated calls', () => {
    expect(JSON.stringify(buildChapter6Maps())).toBe(JSON.stringify(buildChapter6Maps()));
  });

  it('keeps every route reciprocal with body-safe walkable landings', () => {
    const maps = buildChapter6Maps();
    for (const map of Object.values(maps)) {
      for (const door of map.doors.filter((candidate) => CH6_MAP_IDS.includes(candidate.to as (typeof CH6_MAP_IDS)[number]))) {
        const target = maps[door.to];
        expect(target.doors.some((back) => back.to === map.id), `${map.id} → ${door.to}`).toBe(true);
        const tx = Math.floor(door.tx / 16); const ty = Math.floor(door.ty / 16);
        expect(WALKABLE.has(target.grid[ty]?.[tx] ?? ''), `${map.id} → ${door.to} landing`).toBe(true);
        expect(WALKABLE.has(target.grid[ty]?.[Math.min(tx + 1, target.grid[0].length - 1)] ?? ''), `${map.id} → ${door.to} body clearance`).toBe(true);
      }
    }
  });

  it('makes every door, trigger, NPC, and sign reachable from its chapter entry', () => {
    for (const map of Object.values(buildChapter6Maps())) {
      const seen = walkableTiles(map);
      for (const trigger of map.triggers) {
        expect(rectHasReachableTile(seen, trigger.rect), `${map.id}:${trigger.id}`).toBe(true);
      }
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(seen.has(`${Math.floor(actor.x)},${Math.floor(actor.y)}`), `${map.id}:${actor.x},${actor.y}`).toBe(true);
      }
      for (const door of map.doors) expect(rectHasReachableTile(seen, door), `${map.id} door ${door.to}`).toBe(true);
    }
  });

  it('pins every authored anchor in bounds and clear of static prop collision', () => {
    for (const map of Object.values(buildChapter6Maps())) {
      const w = map.grid[0].length; const h = map.grid.length;
      const solids = map.props.map(propSolidRect).filter((rect): rect is NonNullable<typeof rect> => rect !== null);
      for (const trigger of map.triggers) {
        expect(trigger.rect.x).toBeGreaterThanOrEqual(0); expect(trigger.rect.y).toBeGreaterThanOrEqual(0);
        expect(trigger.rect.x + trigger.rect.w).toBeLessThanOrEqual(w);
        expect(trigger.rect.y + trigger.rect.h).toBeLessThanOrEqual(h);
        let clear = false;
        for (let y = trigger.rect.y; y < trigger.rect.y + trigger.rect.h && !clear; y++) {
          for (let x = trigger.rect.x; x < trigger.rect.x + trigger.rect.w; x++) {
            if (WALKABLE.has(map.grid[y][x]) && !solids.some((rect) => pointInside(rect, x * 16 + 8, y * 16 + 12))) clear = true;
          }
        }
        expect(clear, `${map.id}:${trigger.id} has a collision-clear firing tile`).toBe(true);
      }
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(actor.x).toBeGreaterThanOrEqual(0); expect(actor.y).toBeGreaterThanOrEqual(0);
        expect(actor.x).toBeLessThan(w); expect(actor.y).toBeLessThan(h);
        expect(solids.some((rect) => pointInside(rect, actor.x * 16 + 8, actor.y * 16 + 12)), `${map.id}:${actor.x},${actor.y}`).toBe(false);
      }
      for (const door of map.doors) {
        expect(door.x).toBeGreaterThanOrEqual(0); expect(door.y).toBeGreaterThanOrEqual(0);
        expect(door.x + door.w).toBeLessThanOrEqual(w);
        expect(door.y + door.h).toBeLessThanOrEqual(h);
      }
    }
  });

  it('preserves the five historical unit identities while expanding to sixteen supported facades', () => {
    const raw = buildChapter6Maps().zanzibel.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(raw).toHaveLength(16);
    expect(raw.slice(0, 6).map((prop) => prop.sprite)).toEqual([
      'bldg_zanzibel_home', 'bldg_zanzibel_indigo_dyer',
      'bldg_zanzibel_home', 'bldg_zanzibel_home',
      'bldg_zanzibel_indigo_dyer', 'bldg_zanzibel_caravanserai',
    ]);
    expect(new Set(raw.map((prop) => prop.sprite))).toEqual(new Set([
      'bldg_zanzibel_home', 'bldg_zanzibel_indigo_dyer', 'bldg_zanzibel_caravanserai',
    ]));

    const live = MAPS.zanzibel.props.filter((prop) => prop.sprite.startsWith('bldg_'));
    expect(live.map((prop) => formalCityFacadeSource(prop.sprite))).toEqual(raw.map((prop) => prop.sprite));
    expect(live.map((prop, index) => prop.door ? -1 : index).filter((index) => index >= 0)).toEqual([4, 12]);
    expect(Object.keys(MAPS).filter((id) => /^zanzibel_unit_\d+$/.test(id))).toHaveLength(14);
    expect(MAPS.zanzibel_unit_0.name).toBe('OPEN HOUSE — INDIGO COURTYARD HOUSE');
    expect(MAPS.zanzibel_unit_1.name).toBe('BAOBAB KEYS & LAND');
    expect(MAPS.zanzibel_unit_2.name).toBe('CARAVAN ROAD MOTORS');
    expect(MAPS.zanzibel_unit_3.name).toBe('ODDS & ENDS');
    expect(MAPS.zanzibel_unit_4.name).toBe('INDIGO CARAVANSERAI — LOBBY');
  });

  it('retains every formal city-service role in the historical unit roster', () => {
    expect(MAPS.zanzibel_unit_0.npcs.some((npc) => npc.id === cityServiceNpcId('zanzibel', 'home_host'))).toBe(true);
    expect(MAPS.zanzibel_unit_1.npcs.some((npc) => npc.id === cityServiceNpcId('zanzibel', 'realtor'))).toBe(true);
    expect(MAPS.zanzibel_unit_2.npcs.some((npc) => npc.id === cityServiceNpcId('zanzibel', 'dealer'))).toBe(true);
    expect(MAPS.zanzibel_unit_4.npcs.some((npc) => npc.id === cityServiceNpcId('zanzibel', 'hotel_clerk'))).toBe(true);
  });

  it('wires both Chapter 6 quests to distinct, reachable progression beats', () => {
    const maps = buildChapter6Maps();
    const ids = Object.values(maps).flatMap((map) => map.triggers.map((trigger) => trigger.id));
    expect(ids).toEqual(expect.arrayContaining([
      'q_convoy_reach', 'q_convoy_escort', 'q_stones_listen',
    ]));
    expect(maps.zanzibel.npcs.map((npc) => npc.id)).toEqual(expect.arrayContaining(['zn_dockmaster', 'zn_guide']));
    expect(CH6_WORLD.savannaRun.wateringHole).not.toEqual(CH6_WORLD.savannaRun.escort);
  });

  it('forces Held Breath before the Trust choice and the boss before resonance', () => {
    const maps = buildChapter6Maps();
    const ruinIds = maps.laughing_ruins.triggers.map((trigger) => trigger.id);
    expect(ruinIds.indexOf('held_breath_unlock')).toBeLessThan(ruinIds.indexOf('choice_trust'));
    expect(CH6_WORLD.laughingRuins.heldBreath.y).toBeGreaterThan(CH6_WORLD.laughingRuins.choice.y);
    const chinIds = maps.sphinx_chin.triggers.map((trigger) => trigger.id);
    expect(chinIds.indexOf('laughing_sphinx_boss')).toBeLessThan(chinIds.indexOf('sphinx_chin_resonance'));
    expect(CH6_WORLD.sphinxChin.boss.y).toBeGreaterThan(CH6_WORLD.sphinxChin.resonance.y);
    expect(maps.laughing_ruins.spawners.every((spawner) => spawner.unlessFlag === 'laughing_sphinx_defeated')).toBe(true);
    expect(chapter6ChoiceAction({ heldBreathUnlocked: false, choiceDecided: false })).toBe('held-breath-required');
    expect(chapter6ChoiceAction({ heldBreathUnlocked: true, choiceDecided: false })).toBe('present-choice');
    expect(chapter6ChoiceAction({ heldBreathUnlocked: true, choiceDecided: true })).toBe('already-decided');
  });

  it('keeps the shipped Laughing Sphinx at the established 9000 HP', () => {
    expect(CHAPTER_MANIFESTS['6'].boss.hp).toBe(9000);
    expect(ENEMIES.laughing_sphinx.hp).toBe(9000);
  });

  it('keeps Zanzibel glyph identity and the authored three-picnic chapter rhythm', () => {
    const maps = buildChapter6Maps();
    expect(MAPS.zanzibel.area).toBe('zanzibel');
    expect(Object.values(maps).flatMap((map) => map.props).filter((prop) => prop.sprite === 'picnic')).toHaveLength(3);
    expect(CH6_MAP_IDS.map((id) => maps[id].props.filter((prop) => prop.sprite === 'picnic').length)).toEqual([1, 1, 1, 0]);
  });
});
