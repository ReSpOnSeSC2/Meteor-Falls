/**
 * THE HICKORY HILL CAVE — the Titanic Tick's dungeon, rebuilt 2026-07-09 to the
 * EarthBound GIANT STEP grammar via the MAP EDITOR PIPELINE (the literals in
 * maps_oakcave.ts are generated from tools/mapeditor/oak_*.json). This is the
 * per-map elevation guard the ELEVATED_ALLOWLIST demands: every floor declares
 * a well-formed plane, the flights exist, and the beats stay pinned.
 */
import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';

const FLOORS = ['oak_roots', 'oak_hollow', 'oak_heart'] as const;

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

  it('keeps the boss beat: the heart_oak trigger sits ON the raised dais', () => {
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
    expect(roots.patrols?.some((p) => p.id === 'roots_sentry')).toBe(true);
    expect(roots.spawners.length).toBeGreaterThanOrEqual(3);
    for (const s of roots.spawners) {
      expect(s.ifFlag).toBe('zapper_done');
      expect(s.unlessFlag).toBe('tick_defeated');
    }
  });

  it('uses the authored meteor-cave kit instead of recycled oak dressing', () => {
    const allProps = FLOORS.flatMap((id) => MAPS[id].props.map((prop) => prop.sprite));
    for (const key of ['stalactite', 'stalagmite', 'cave_crystal', 'cave_crystal_b', 'rubble_pile', 'meteor_shard']) {
      expect(allProps, `${key} appears in the cave chain`).toContain(key);
    }
    for (const retired of ['root_curtain', 'root_knot', 'glow_shroom', 'glow_shroom_b', 'tree_c']) {
      expect(allProps, `${retired} retired from the meteor cave`).not.toContain(retired);
    }
  });
});
