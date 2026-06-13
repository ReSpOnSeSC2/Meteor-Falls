/**
 * buildDistrict — THE FORGE AS A DISTRICT LIBRARY (S15h, ADR-049).
 *
 * The growth law leans on ONE promise: buildDistrict writes only inside its
 * region, so a frozen core copied into the rest of the grid stays byte-
 * identical. These pins prove that, plus determinism (Prime Law 2) and that
 * each layout still lays the grammar it inherits from buildCity/buildTown.
 */
import { describe, expect, it } from 'vitest';
import { Grid } from '../data/mapkit';
import { Streams } from './rng';
import { buildDistrict, buildWoods, buildUnderground, placeNook, type DistrictRegion, type NookKind } from './settlements';
import { isMega } from './kit';
import { AREA_SKINS } from '../spritegen/buildings';

/** a fresh grid pre-painted with a sentinel so any escape is visible */
function sentinelGrid(w: number, h: number, fill = 'B'): Grid {
  return new Grid(w, h, fill);
}

const REGION: DistrictRegion = { x: 20, y: 20, w: 40, h: 30 };

describe('buildDistrict — region containment (the frozen-core guarantee)', () => {
  it('a GRID district never writes a single cell outside its region', () => {
    const g = sentinelGrid(72, 60);
    buildDistrict(g, REGION, new Streams(1234), {
      layout: 'grid',
      style: 'americana',
      streetRows: [28, 42],
      avenueCols: [22, 56], // hard against both region edges — the clamp must hold
      sprinkle: true,
    });
    for (let y = 0; y < g.h; y++) {
      for (let x = 0; x < g.w; x++) {
        const inside = x >= REGION.x && x < REGION.x + REGION.w && y >= REGION.y && y < REGION.y + REGION.h;
        if (!inside) expect(g.rows[y][x], `escaped at (${x},${y})`).toBe('B');
      }
    }
  });

  it('an ORGANIC district never writes a single cell outside its region', () => {
    const g = sentinelGrid(72, 60);
    buildDistrict(g, REGION, new Streams(99), { layout: 'organic', style: 'americana', lanes: 3, sprinkle: true });
    for (let y = 0; y < g.h; y++) {
      for (let x = 0; x < g.w; x++) {
        const inside = x >= REGION.x && x < REGION.x + REGION.w && y >= REGION.y && y < REGION.y + REGION.h;
        if (!inside) expect(g.rows[y][x], `escaped at (${x},${y})`).toBe('B');
      }
    }
  });
});

describe('buildDistrict — deterministic (Prime Law 2)', () => {
  for (const layout of ['grid', 'organic'] as const) {
    it(`${layout}: same grid + region + seed → identical grid AND props, twice`, () => {
      const build = (): { grid: string; props: string } => {
        const g = new Grid(72, 60, '.');
        const r = buildDistrict(g, REGION, new Streams(7), {
          layout,
          style: 'americana',
          streetRows: [28, 42],
          avenueCols: [40],
          sprinkle: true,
        });
        return { grid: g.out().join('|'), props: JSON.stringify(r.props) };
      };
      const a = build();
      const b = build();
      expect(a.grid).toBe(b.grid);
      expect(a.props).toBe(b.props);
    });
  }
});

describe('buildDistrict — the grammar each layout inherits', () => {
  it('GRID lays roads and ≥2 facade block faces (the anti-strip read)', () => {
    const g = new Grid(72, 60, '.');
    const r = buildDistrict(g, REGION, new Streams(1), {
      layout: 'grid',
      style: 'americana',
      streetRows: [28, 42],
      avenueCols: [40],
    });
    // streets actually painted road tiles inside the region
    expect(g.rows[28].slice(REGION.x, REGION.x + REGION.w).join('')).toMatch(/R/);
    const faces = new Set(
      r.props
        .filter((p) => p.sprite.startsWith('bldg_') && p.solid)
        .map((p) => Math.round((p.y * 16 + (p.solid?.oy ?? 0) + (p.solid?.h ?? 0) + 12) / 64)),
    );
    expect(faces.size).toBeGreaterThanOrEqual(2);
  });

  it('ORGANIC lays a path and scattered houses, never a road strip', () => {
    const g = new Grid(72, 60, '.');
    const r = buildDistrict(g, REGION, new Streams(2), { layout: 'organic', style: 'americana', lanes: 2 });
    expect(g.out().join('')).toMatch(/:/); // a lane exists
    expect(g.out().join('')).not.toMatch(/R/); // a town is never a road grid
    expect(r.props.filter((p) => p.sprite.startsWith('bldg_') || p.sprite.startsWith('house')).length).toBeGreaterThan(0);
  });

  it('reserved doors land on exactly one facade each, in order', () => {
    const g = new Grid(72, 60, '.');
    const r = buildDistrict(g, REGION, new Streams(3), {
      layout: 'grid',
      style: 'americana',
      streetRows: [28, 42],
      avenueCols: [40],
      reserve: [{ to: 'town_hall_int', sprite: 'bldg_bank', tx: 100, ty: 120, sign: 'sign_hall' }],
    });
    const doored = r.props.filter((p) => p.door?.to === 'town_hall_int');
    expect(doored.length).toBe(1);
    expect(doored[0].sprite).toBe('bldg_bank');
    expect(r.signs.some((s) => s.dialogue === 'sign_hall')).toBe(true);
  });
});

describe('S15i — THE MEGA PASS (ADR-054): towers land, guarded + in-region', () => {
  it('mega:true drops ≥1 MEGA facade in a tall downtown, its body inside the region', () => {
    const g = new Grid(160, 80, '.');
    const region: DistrictRegion = { x: 2, y: 2, w: 80, h: 72 };
    const r = buildDistrict(g, region, new Streams(2077), {
      layout: 'grid', style: 'americana', streetRows: [10, 68], avenueCols: [40],
      catalog: AREA_SKINS.brickton, maxStories: 9, mega: true,
    });
    const megas = r.props.filter((p) => isMega(p.sprite));
    expect(megas.length).toBeGreaterThanOrEqual(1);
    // every mega's top tile sits at/below the region top — its body never pokes
    // above the region (into a core copied just above it)
    expect(megas.every((m) => m.y >= region.y)).toBe(true);
  });
  it('mega off by default → NO mega, even with a colossus-bearing catalog (backward compatible)', () => {
    const g = new Grid(160, 80, '.');
    const r = buildDistrict(g, { x: 2, y: 2, w: 80, h: 72 }, new Streams(2077), {
      layout: 'grid', style: 'americana', streetRows: [10, 68], catalog: AREA_SKINS.brickton, maxStories: 9,
    });
    expect(r.props.filter((p) => isMega(p.sprite)).length).toBe(0);
  });
});

describe('S15i — the nook + pocket verbs (ADR-054): region-contained + deterministic', () => {
  const R: DistrictRegion = { x: 20, y: 20, w: 30, h: 16 };
  const contained = (build: (g: Grid) => void): void => {
    const g = sentinelGrid(72, 60);
    build(g);
    for (let y = 0; y < g.h; y++) {
      for (let x = 0; x < g.w; x++) {
        const inside = x >= R.x && x < R.x + R.w && y >= R.y && y < R.y + R.h;
        if (!inside) expect(g.rows[y][x], `escaped at (${x},${y})`).toBe('B');
      }
    }
  };
  it('buildWoods stays inside its region', () => contained((g) => buildWoods(g, R, new Streams(1), { pines: true })));
  it('buildUnderground stays inside its region', () => contained((g) => buildUnderground(g, R, new Streams(2))));
  for (const kind of ['shack', 'alley', 'lot', 'courtyard', 'rooftop'] as const satisfies readonly NookKind[]) {
    it(`placeNook('${kind}') stays inside its region`, () => contained((g) => placeNook(g, R, new Streams(3), kind)));
  }
  it('the three verbs are deterministic (same grid + seed → identical bytes + props)', () => {
    const run = (): string => {
      const g = new Grid(72, 60, '.');
      const a = buildWoods(g, { x: 2, y: 2, w: 30, h: 16 }, new Streams(7), { pines: true });
      const b = buildUnderground(g, { x: 2, y: 40, w: 40, h: 12 }, new Streams(8));
      const c = placeNook(g, { x: 55, y: 20, w: 14, h: 12 }, new Streams(9), 'courtyard');
      return g.out().join('|') + JSON.stringify([a.props, b.props, c.props, c.signs]);
    };
    expect(run()).toBe(run());
  });
  it('buildWoods threads a walkable path; buildUnderground lays a brick-walled stretch', () => {
    const g = new Grid(72, 60, '.');
    buildWoods(g, R, new Streams(5));
    expect(g.out().join('')).toMatch(/:/); // a clearing path exists
    const g2 = new Grid(72, 60, '.');
    buildUnderground(g2, R, new Streams(6));
    expect(g2.rows[R.y].slice(R.x, R.x + R.w).join('')).toMatch(/B/); // brick wall ring
  });
});
