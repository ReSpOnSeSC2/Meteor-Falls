import { describe, expect, it } from 'vitest';
import { CHAPTER_MANIFESTS } from './chapters';
import { MAPS } from './maps';
import {
  CH1_BOUNDARY_MAPS,
  CH1_GENERATED_OTTERBROOK_UNIT_IDS,
  CH1_MAP_DIMENSIONS,
  CH1_MAP_GROUPS,
  CH1_OWNED_MAP_IDS,
  CH1_RETIRED_MAP_IDS,
} from './maps_ch1';

describe('Chapter 1 world ownership contract', () => {
  it('owns exactly 81 unique live maps grouped exactly once', () => {
    const grouped = Object.values(CH1_MAP_GROUPS).flat();
    expect(grouped).toEqual(CH1_OWNED_MAP_IDS);
    expect(grouped).toHaveLength(81);
    expect(new Set(grouped).size).toBe(81);
    expect(Object.keys(CH1_MAP_DIMENSIONS)).toEqual(grouped);

    for (const id of grouped) {
      expect(MAPS[id], id).toBeDefined();
      expect(MAPS[id].id, `${id} self identity`).toBe(id);
    }
  });

  it('pins every post-assembly dimension', () => {
    for (const id of CH1_OWNED_MAP_IDS) {
      const map = MAPS[id];
      const expected = CH1_MAP_DIMENSIONS[id];
      expect(map.grid[0]?.length, `${id} width`).toBe(expected.width);
      expect(map.grid.length, `${id} height`).toBe(expected.height);
      expect(map.grid.every((row) => row.length === expected.width), `${id} rectangular`).toBe(true);
    }
  });

  it('classifies the walkable Brickton pier as a Chapter 2 boundary, never dual ownership', () => {
    expect(CH1_BOUNDARY_MAPS).toEqual({
      brickton_docks: {
        ownerChapter: 2,
        walkableBeforeChapter1Complete: true,
        dimensions: { width: 30, height: 18 },
      },
    });
    expect(CH1_OWNED_MAP_IDS).not.toContain('brickton_docks');
    expect(MAPS.brickton_docks).toBeDefined();
    expect(MAPS.brickton.doors.some((door) => door.to === 'brickton_docks')).toBe(true);
    expect(MAPS.brickton_docks.doors.some((door) => door.to === 'brickton')).toBe(true);
  });

  it('keeps every authored Chapter 1 transition inside ownership or its explicit pier boundary', () => {
    const allowed = new Set<string>([
      ...CH1_OWNED_MAP_IDS,
      ...Object.keys(CH1_BOUNDARY_MAPS),
    ]);
    for (const id of CH1_OWNED_MAP_IDS) {
      const map = MAPS[id];
      const targets = [
        ...map.doors.map((door) => door.to),
        ...map.props.flatMap((prop) => prop.door ? [prop.door.to] : []),
      ];
      for (const target of targets) {
        expect(allowed.has(target), `${id} -> ${target} has classified ownership`).toBe(true);
        expect(MAPS[target], `${id} -> ${target} exists`).toBeDefined();
      }
    }
  });

  it('freezes the ten historical Otterbrook generated-unit identities', () => {
    const assembled = Object.keys(MAPS)
      .filter((id) => /^otterbrook_unit_\d+$/.test(id))
      .sort((a, b) => Number(a.slice(a.lastIndexOf('_') + 1)) - Number(b.slice(b.lastIndexOf('_') + 1)));
    expect(assembled).toEqual(CH1_GENERATED_OTTERBROOK_UNIT_IDS);

    const exteriorTargets = MAPS.otterbrook.props
      .flatMap((prop) => prop.door?.to.startsWith('otterbrook_unit_') ? [prop.door.to] : [])
      .sort((a, b) => Number(a.slice(a.lastIndexOf('_') + 1)) - Number(b.slice(b.lastIndexOf('_') + 1)));
    expect(exteriorTargets).toEqual(CH1_GENERATED_OTTERBROOK_UNIT_IDS);
  });

  it('retires downtown and every superseded hill id from live content', () => {
    for (const retired of CH1_RETIRED_MAP_IDS) {
      expect(MAPS[retired], `${retired} absent from MAPS`).toBeUndefined();
    }
    expect(CHAPTER_MANIFESTS['1'].maps).not.toContain('downtown_otterbrook');
    expect(CHAPTER_MANIFESTS['1'].maps).toEqual([
      'otterbrook', 'bus_depot_int', 'brickton', 'bus_interior',
      'meadow_mile', 'meadow_woods', 'meadow_far', 'meadow_overpass',
    ]);
  });
});
