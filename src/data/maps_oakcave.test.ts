/**
 * THE HICKORY HILL CAVE — the Titanic Tick's dungeon, rebuilt 2026-07-09 to the
 * EarthBound GIANT STEP grammar via the MAP EDITOR PIPELINE (the literals in
 * maps_oakcave.ts are generated from tools/mapeditor/oak_*.json). This is the
 * per-map elevation guard the ELEVATED_ALLOWLIST demands: every floor declares
 * a well-formed plane, the flights exist, and the beats stay pinned.
 */
import { describe, expect, it } from 'vitest';
import { characterFeet, footRect, PATROL_FOOTPRINT, ROAMER_FOOTPRINT } from '../engine/actor-collision';
import { TILESET, tileIndexByName } from '../spritegen/tiles';
import { CHAR_LEGEND, MAPS, type MapDef } from './maps';
import { oakCaveRows } from './maps_oakcave';

const FLOORS = ['oak_roots', 'oak_hollow', 'oak_heart'] as const;
const AUTHOR_TILE = 16;

type CollisionRect = { x: number; y: number; w: number; h: number };

function overlaps(a: CollisionRect, b: CollisionRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function levelAt(map: MapDef, px: number, py: number): number {
  const tx = Math.floor(px / AUTHOR_TILE);
  const ty = Math.floor(py / AUTHOR_TILE);
  const ch = map.elevation?.level[ty]?.[tx];
  return ch && ch >= '1' && ch <= '9' ? Number(ch) : 0;
}

function solidTile(map: MapDef, tx: number, ty: number): boolean {
  const ch = map.grid[ty]?.[tx];
  if (ch === undefined) return true;
  const tileName = CHAR_LEGEND[ch] ?? 'grass_a';
  return TILESET[tileIndexByName(tileName)].solid;
}

/** Runtime-equivalent authored prop bodies for this cave kit. None of these
 * props rotate or use the special facade/native-map scaling paths. */
function cavePropSolids(map: MapDef): CollisionRect[] {
  return map.props.flatMap((prop) => {
    const scale = prop.scale;
    const sx = typeof scale === 'number' ? scale : scale?.x ?? 1;
    const sy = typeof scale === 'number' ? scale : scale?.y ?? 1;
    const authored = prop.solidParts ?? (prop.solid ? [prop.solid] : []);
    return authored.map((body) => ({
      x: prop.x * AUTHOR_TILE + body.ox * sx,
      y: prop.y * AUTHOR_TILE + body.oy * sy,
      w: body.w * sx,
      h: body.h * sy,
    }));
  });
}

function collidesCaveStatic(
  map: MapDef,
  propSolids: readonly CollisionRect[],
  body: CollisionRect,
  actorLevel: number,
): boolean {
  const x0 = Math.floor(body.x / AUTHOR_TILE);
  const y0 = Math.floor(body.y / AUTHOR_TILE);
  const x1 = Math.floor((body.x + body.w) / AUTHOR_TILE);
  const y1 = Math.floor((body.y + body.h) / AUTHOR_TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (solidTile(map, tx, ty)) return true;
      if (
        map.elevation &&
        levelAt(map, (tx + 0.5) * AUTHOR_TILE, (ty + 0.5) * AUTHOR_TILE) !== actorLevel &&
        map.grid[ty]?.[tx] !== 'T'
      ) return true;
    }
  }
  return propSolids.some((solid) => overlaps(body, solid));
}

function safeSpawnerCells(map: MapDef, index: number): Array<{ tx: number; ty: number; level: number }> {
  const spawn = map.spawners[index];
  const propSolids = cavePropSolids(map);
  const cells: Array<{ tx: number; ty: number; level: number }> = [];
  for (let ty = Math.max(0, Math.floor(spawn.rect.y)); ty < Math.min(map.grid.length, Math.ceil(spawn.rect.y + spawn.rect.h)); ty++) {
    for (let tx = Math.max(0, Math.floor(spawn.rect.x)); tx < Math.min(map.grid[0].length, Math.ceil(spawn.rect.x + spawn.rect.w)); tx++) {
      if (solidTile(map, tx, ty)) continue;
      const feet = { x: (tx + 0.5) * AUTHOR_TILE, y: (ty + 0.5) * AUTHOR_TILE };
      const level = levelAt(map, feet.x, feet.y);
      const body = footRect(feet, ROAMER_FOOTPRINT);
      if (!collidesCaveStatic(map, propSolids, body, level)) cells.push({ tx, ty, level });
    }
  }
  return cells;
}

describe('HICKORY HILL CAVE — the Giant-Step rebuild', () => {
  it('every floor declares a well-formed elevation plane with stairs and faces', () => {
    for (const id of FLOORS) {
      const m = MAPS[id];
      expect(m.elevation, `${id} declares elevation`).toBeDefined();
      const level = m.elevation!.level;
      expect(level.length).toBe(m.grid.length);
      for (let y = 0; y < m.grid.length; y++) expect(level[y].length, `${id} row ${y}`).toBe(m.grid[y].length);
      expect(level.join('').includes('1'), `${id} has a raised terrace`).toBe(true);
      expect(m.grid.join('').includes('T'), `${id} has a stair flight`).toBe(true);
    }
    // the descent goes TWO terraces up — the L2 present ledge
    expect(MAPS.oak_roots.elevation!.level.join('').includes('2')).toBe(true);
  });

  it('keeps the dungeon chain wired both ways (surface → roots → hollow → heart)', () => {
    expect(MAPS.otterbrook.doors.some((d) => d.to === 'oak_roots')).toBe(true);
    expect(MAPS.oak_roots.doors.some((d) => d.to === 'otterbrook')).toBe(true);
    expect(MAPS.oak_roots.doors.some((d) => d.to === 'oak_hollow')).toBe(true);
    expect(MAPS.oak_hollow.doors.some((d) => d.to === 'oak_roots')).toBe(true);
    expect(MAPS.oak_hollow.doors.some((d) => d.to === 'oak_heart')).toBe(true);
    expect(MAPS.oak_heart.doors.some((d) => d.to === 'oak_hollow')).toBe(true);
  });

  it('keeps the shack/key route as the only surface permission into the cave', () => {
    const caveDoors = MAPS.otterbrook.doors.filter((door) => door.to === 'oak_roots');
    expect(caveDoors).toHaveLength(1);
    expect(caveDoors[0]).toMatchObject({ ifFlag: 'has_trail_key' });
    expect(MAPS.trail_shed_int.doors.some((door) => door.to === 'otterbrook')).toBe(true);
  });

  it('keeps the cave boss beat: the stable heart_oak trigger sits ON the raised meteor dais', () => {
    const heart = MAPS.oak_heart;
    const trig = heart.triggers.find((t) => t.id === 'heart_oak');
    expect(trig).toBeDefined();
    expect(trig!.once).toBe(false); // re-arms after a flee/loss
    // the trigger's whole rect lives on the L1 dais — the fight happens up top
    const { x, y, w, h } = trig!.rect;
    for (let ty = y; ty < y + h; ty++)
      for (let tx = x; tx < x + w; tx++)
        expect(heart.elevation!.level[ty][tx], `dais level @${tx},${ty}`).toBe('1');
    expect(heart.props.some((p) => p.sprite === 'meteor_rock'), 'the feeding mound').toBe(true);

    // Titanic Tick lives here, not in the exterior tree/crater encounter. The
    // stable trigger id must have exactly one owner across the whole world.
    const owners = Object.values(MAPS)
      .filter((map) => map.triggers.some((candidate) => candidate.id === 'heart_oak'))
      .map((map) => map.id);
    expect(owners).toEqual(['oak_heart']);
  });

  it('keeps the rewards + the pre-boss rest (§A4.5/§B4)', () => {
    // the L2 present ledge in the descent (cave_gift_roots — loot table grants it)
    expect(MAPS.oak_roots.props.some((p) => p.sprite === 'gift_box' && p.unlessFlag === 'cave_gift_roots')).toBe(true);
    expect(MAPS.oak_roots.signs.some((s) => s.dialogue === 'cave_gift_roots')).toBe(true);
    // the hollow: the oak_cache cooler (kept flag) now on its overlook ledge
    expect(MAPS.oak_hollow.props.some((p) => p.sprite === 'gift_box' && p.unlessFlag === 'oak_cache')).toBe(true);
    // ...and the rest: picnic + a SAVE payphone before the heart's pressure
    expect(MAPS.oak_hollow.props.some((p) => p.sprite === 'picnic')).toBe(true);
    expect(MAPS.oak_hollow.props.some((p) => p.sprite === 'payphone')).toBe(true);
    expect(MAPS.oak_hollow.phones.length).toBeGreaterThanOrEqual(1);
    // the pool reflects (MAP_REFLECT.oak_hollow, post-assembly)
    expect(MAPS.oak_hollow.reflect?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('keeps the lower hall alive: the patrolling cicada + gated fight bands', () => {
    const roots = MAPS.oak_roots;
    expect(roots.patrols?.find((p) => p.id === 'roots_sentry')).toMatchObject({
      ifFlag: 'zapper_done',
      unlessFlag: 'tick_defeated',
    });
    expect(roots.spawners.length).toBeGreaterThanOrEqual(3);
    for (const s of roots.spawners) {
      expect(s.ifFlag).toBe('zapper_done');
      expect(s.unlessFlag).toBe('tick_defeated');
    }
  });

  it('keeps every roaming spawn and the full roots_sentry route body-safe on one elevation plane', () => {
    // Pin the actual runtime-safe capacities, not just the visible floor chars.
    // The sampler uses these cells without replacement, so every requested body
    // must fit after tile, prop, footprint, and terrace collision are applied.
    const spawnCases = [
      { map: MAPS.oak_roots, index: 0, capacity: 20 },
      { map: MAPS.oak_roots, index: 1, capacity: 29 },
      { map: MAPS.oak_roots, index: 2, capacity: 45 },
      { map: MAPS.oak_hollow, index: 0, capacity: 11 },
    ];
    for (const { map, index, capacity } of spawnCases) {
      const cells = safeSpawnerCells(map, index);
      expect(cells, `${map.id} spawner ${index}`).toHaveLength(capacity);
      expect(cells.length).toBeGreaterThanOrEqual(map.spawners[index].count);
      expect(new Set(cells.map((cell) => cell.level)).size, `${map.id} spawner ${index} stays on one plane`).toBe(1);
    }

    const roots = MAPS.oak_roots;
    const sentry = roots.patrols!.find((patrol) => patrol.id === 'roots_sentry')!;
    const propSolids = cavePropSolids(roots);
    const routeSamples: Array<{ x: number; y: number; level: number }> = [];
    for (let leg = 0; leg < sentry.route.length; leg++) {
      const [ax, ay] = sentry.route[leg];
      const [bx, by] = sentry.route[(leg + 1) % sentry.route.length];
      const a = characterFeet(ax, ay);
      const b = characterFeet(bx, by);
      // Two native pixels per sample is narrower than either side of the patrol
      // foot box, so a thin prop or one-cell seam cannot hide between samples.
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const feet = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        const level = levelAt(roots, feet.x, feet.y);
        const body = footRect(feet, PATROL_FOOTPRINT);
        expect(collidesCaveStatic(roots, propSolids, body, level), `roots_sentry @${feet.x},${feet.y}`).toBe(false);
        routeSamples.push({ ...feet, level });
      }
    }
    expect(new Set(routeSamples.map((sample) => sample.level))).toEqual(new Set([0]));
  });

  it('uses one authored root/meteor cave kit and no outdoor road flooring', () => {
    const allProps = FLOORS.flatMap((id) => MAPS[id].props.map((prop) => prop.sprite));
    for (const key of [
      'stalactite', 'stalagmite', 'cave_crystal', 'cave_crystal_b', 'rubble_pile', 'meteor_shard',
      'root_curtain', 'root_knot', 'glow_shroom', 'glow_shroom_b',
      'cave_root_arch', 'cave_mushroom_cluster',
    ]) {
      expect(allProps, `${key} appears in the cave chain`).toContain(key);
    }

    for (const id of FLOORS) {
      const map = MAPS[id];
      expect(map.ambience).toBe('cave');
      expect(map.muffle).toBeGreaterThanOrEqual(1);
      expect(map.grid.join('')).not.toMatch(/[:.,~=RDB]/);
    }

    expect(oakCaveRows(['Ks:S'])).toEqual(['KssS']);
  });
});
