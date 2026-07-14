/**
 * THE LEVELKIT — the ADR-012 city sweep, made a SHARED function (S15g).
 *
 * The exact street/connector/block-face check maps.test.ts has run on every
 * shipped city since ADR-012, lifted here verbatim so it has ONE home:
 *  - maps.test.ts imports it (the shipped-city sweep, unchanged behaviour),
 *  - the levelkit test imports it (generated cities pass BY CONSTRUCTION),
 *  - the LEVELKIT LAB reads cityMetrics() for its live overlay.
 * Generated cities must clear it with no exemptions (Prime Law 3).
 */
import type { MapDef } from '../schemas';

/** the structural slice the sweep reads (a DraftMapDef satisfies it too) */
export type CityLike = Pick<MapDef, 'id' | 'grid' | 'props'>;

const isStreet = (ch: string): boolean => 'RDX'.includes(ch);

/** y of every row that is >40% street — the horizontal street bands */
function roadRows(grid: readonly string[]): number[] {
  const w = grid[0].length;
  return grid
    .map((row, y) => ({ y, n: [...row].filter(isStreet).length }))
    .filter((r) => r.n > Math.floor(w * 0.4))
    .map((r) => r.y);
}

/** building face bands: each facade's ground line ÷ 64 (the anti-strip read) */
function faceBands(m: CityLike): Set<number> {
  return new Set(
    m.props
      .filter((p) => p.sprite.startsWith('bldg_') && p.solid)
      .map((p) => Math.round((p.y * 16 + (p.solid?.oy ?? 0) + (p.solid?.h ?? 0) + 12) / 64)),
  );
}

/**
 * Broken ADR-012 rules for a city map; empty = compliant. IDENTICAL to the
 * sweep maps.test.ts has always run (≥2 separated streets, a connecting
 * avenue ≥12 cells tall, buildings on 2+ block faces — never a strip).
 */
export function cityViolations(m: CityLike): string[] {
  const out: string[] = [];
  const grid = m.grid;
  const w = grid[0].length;
  const rows = roadRows(grid);
  if (rows.length < 6) out.push(`${m.id}: needs at least two streets`);
  if (!rows.some((y, i) => i > 0 && y - rows[i - 1] > 1)) {
    out.push(`${m.id}: streets must be separated by a built-up block`);
  }
  let connector = false;
  for (let x = 0; x < w; x++) {
    let n = 0;
    for (let y = 0; y < grid.length; y++) if (isStreet(grid[y][x])) n++;
    if (n >= 12) connector = true;
  }
  if (!connector) out.push(`${m.id}: needs a connecting avenue`);
  if (faceBands(m).size < 2) out.push(`${m.id}: buildings must occupy 2+ block faces`);
  return out;
}

/**
 * THE LIVING-CITY LAW (S18, ADR — alive by default). A settlement must not ship
 * DEAD: its catalog facades each need a PURPOSE. After occupyCity runs, every
 * 'bldg_' facade either opens a door (enterable) or answers a knock (a locked
 * sign), and the enterable share stays high. The build (content-validate) and the
 * test suite both call this, so a future city that skips occupyCity FAILS the
 * build — dead-by-default can never regress in.
 *
 * Empty = compliant. Skips tiny settlements (<8 facades) where the ratio is noise.
 */
export type LivingLike = Pick<MapDef, 'id' | 'props' | 'signs'>;

export function livingCityViolations(m: LivingLike): string[] {
  const out: string[] = [];
  // Flag-swapped open/closed states are one physical building, not two dead
  // facades. Collapse identical placements and prefer the doored state.
  const placed = new Map<string, LivingLike['props'][number]>();
  for (const p of m.props) {
    if (!p.sprite.startsWith('bldg_') || !p.solid || p.facadeUse === 'outdoor-court') continue;
    // Phase art may legitimately change sprite keys (locked/open shed, dark/lit
    // storefront) while remaining one physical facade. Position + collision
    // footprint is the identity; prefer whichever state owns the real door.
    const solid = p.solid;
    const key = `${p.x}:${p.y}:${solid.ox}:${solid.oy}:${solid.w}:${solid.h}`;
    const prior = placed.get(key);
    if (!prior || (!prior.door && p.door)) placed.set(key, p);
  }
  const facades = [...placed.values()];
  if (facades.length < 8) return out; // villages / hand-built strips: not swept
  const enterable = facades.filter((p) => p.door).length;
  const pct = enterable / facades.length;
  if (pct < 0.75) {
    out.push(`${m.id}: only ${Math.round(pct * 100)}% of buildings are enterable (Living-City Law needs >=75%, target ~90%)`);
  }
  // every doorless facade must answer a knock (occupyCity drops a cl_knock_* sign)
  const locked = facades.length - enterable;
  const knocks = m.signs.filter((s) => s.dialogue.startsWith('cl_knock_')).length;
  if (knocks < locked) {
    out.push(`${m.id}: ${locked - knocks} locked building(s) give no knock-knock response (dead door)`);
  }
  return out;
}

/** live read for the LAB overlay: structure + negative-space share */
export interface CityMetrics {
  width: number;
  height: number;
  streetRows: number;
  /** avenue columns ≥12 street cells (connector strength) */
  avenueJoins: number;
  /** distinct building block faces */
  blockFaces: number;
  /** % of interior tiles that are open negative space (parking/grass/park) */
  negativeSpacePct: number;
  violations: string[];
}

export function cityMetrics(m: CityLike): CityMetrics {
  const grid = m.grid;
  const w = grid[0].length;
  const h = grid.length;
  let avenueJoins = 0;
  for (let x = 0; x < w; x++) {
    let n = 0;
    for (let y = 0; y < h; y++) if (isStreet(grid[y][x])) n++;
    if (n >= 12) avenueJoins++;
  }
  let open = 0;
  let interior = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      interior++;
      if ('P.,~fFbn'.includes(grid[y][x])) open++;
    }
  }
  return {
    width: w,
    height: h,
    streetRows: roadRows(grid).length,
    avenueJoins,
    blockFaces: faceBands(m).size,
    negativeSpacePct: interior ? Math.round((open / interior) * 100) : 0,
    violations: cityViolations(m),
  };
}
