/**
 * THE ENCOUNTER PRESSURE LIBRARY (S15g Movement Two, ADR-045) — pure math so
 * vitest pins it, and tools/encounter-report.ts can score EVERY canon map.
 *
 * It answers the user's complaint about maps that "look fine but feel annoying
 * or empty": it measures the FEEL of a map's danger numerically —
 *  - density: enemies per 400×225 screen-equivalent (the §A9 chapter bands);
 *  - grace:   px from each entrance to the first possible contact (a player
 *             deserves a beat after a door before the first spawner reaches);
 *  - exposure: px from each rest point (phone/picnic) to the nearest danger;
 *  - unavoidable touches: with each spawner DILATED by a pursuit radius, can a
 *             walking player still cross entrance→exit without being forced
 *             into a fight? (corridor width vs sight radius, BFS-decided);
 *  - side paths: spawners OFF the main corridor — rewarded optional fights;
 *  - proximity: px from the nearest spawner to any door/phone/atm/trigger (a
 *             spawn sitting on a save phone is the annoyance, quantified).
 *
 * Nothing here imports Phaser or data — the caller passes `isSolid` (the
 * engine's tile solidity) exactly like src/levelkit/mapcheck.ts. The HARD
 * subset (grace + proximity, and dungeon monotonicity) joins the content
 * validator; the rest is report-only so taste never blocks the build.
 */
import type { MapDef } from '../schemas';
import { bfsField, doorCell, type IsSolid, type Cell } from './mapcheck';

/** one screen-equivalent in tiles: 400/16 × 225/16 ≈ 25 × 14 = 350 */
export const SCREEN_TILES = 350;
const PX = 16;

/** the structural slice a pressure read needs (a DraftMapDef satisfies it) */
export type PressureLike = Pick<MapDef, 'id' | 'grid' | 'doors' | 'props' | 'phones' | 'atms' | 'spawners' | 'triggers' | 'settlement' | 'interior'>;

export interface PressureReport {
  id: string;
  /** inferred class for the §A9 band read */
  klass: 'city' | 'town' | 'village' | 'interior' | 'field' | 'dungeon';
  tiles: number;
  screens: number;
  enemyCount: number;
  /** enemies per screen-equivalent (the band metric) */
  density: number;
  /** px from the nearest entrance to the nearest spawn cell (−1 = no spawners) */
  gracePx: number;
  /** px from the most-exposed rest point to the nearest danger (−1 = none) */
  restExposurePx: number;
  /** entrance→door crossings forced through a dilated spawner (a real touch) */
  unavoidableTouches: number;
  /** spawners that sit OFF the main entrance→exit corridor (optional fights) */
  sidePaths: number;
  /** px from the nearest spawn cell to any door/phone/atm/trigger (−1 = none) */
  proximityPx: number;
}

function klassOf(m: PressureLike): PressureReport['klass'] {
  if (m.settlement) return m.settlement;
  const hasSpawners = m.spawners.length > 0;
  if (m.interior) return hasSpawners ? 'dungeon' : 'interior';
  return hasSpawners ? 'field' : 'interior';
}

/** every walkable cell inside the spawner rects (the danger field) */
function spawnerCells(m: PressureLike): Cell[] {
  const out: Cell[] = [];
  for (const s of m.spawners) {
    for (let y = s.rect.y; y < s.rect.y + s.rect.h; y++) {
      for (let x = s.rect.x; x < s.rect.x + s.rect.w; x++) {
        if (y >= 0 && x >= 0 && y < m.grid.length && x < m.grid[0].length) out.push([x, y]);
      }
    }
  }
  return out;
}

/** the door cells (entrances/exits) that actually open onto walkable floor */
function entrances(m: PressureLike, isSolid: IsSolid): Cell[] {
  return m.doors.map((d) => doorCell(m.grid, isSolid, d)).filter((c): c is Cell => c !== null);
}

/** min Manhattan-px from a cell to the nearest of `cells` (−1 = empty set) */
function nearestPx(from: Cell, cells: Cell[]): number {
  let best = -1;
  for (const [x, y] of cells) {
    const d = (Math.abs(x - from[0]) + Math.abs(y - from[1])) * PX;
    if (best < 0 || d < best) best = d;
  }
  return best;
}

/** BFS-px from `from` to the nearest reachable cell in `cells` (−1 = none) */
function bfsNearestPx(grid: readonly string[], isSolid: IsSolid, from: Cell, cells: Cell[]): number {
  if (!cells.length) return -1;
  const field = bfsField(grid, isSolid, from);
  let best = -1;
  for (const [x, y] of cells) {
    if (y < 0 || x < 0 || y >= grid.length || x >= grid[0].length) continue;
    const d = field[y][x];
    if (d >= 0 && (best < 0 || d < best)) best = d;
  }
  return best < 0 ? -1 : best * PX;
}

/**
 * THE PRESSURE READ for one map. Pure: same map + isSolid → same numbers
 * forever (vitest pins a few). `sight` is the pursuit dilation radius in
 * tiles for the unavoidable-touch test (default 2 — a walking player needs
 * ~2 tiles of clearance to slip a roamer).
 */
export function pressureReport(m: PressureLike, isSolid: IsSolid, sight = 2): PressureReport {
  const w = m.grid[0].length;
  const h = m.grid.length;
  const tiles = w * h;
  const screens = tiles / SCREEN_TILES;
  const enemyCount = m.spawners.reduce((a, s) => a + s.count, 0);
  const danger = spawnerCells(m);
  const ents = entrances(m, isSolid);

  // grace: BFS-px from the nearest entrance to the first reachable spawn cell
  let gracePx = -1;
  for (const e of ents) {
    const d = bfsNearestPx(m.grid, isSolid, e, danger);
    if (d >= 0 && (gracePx < 0 || d < gracePx)) gracePx = d;
  }

  // exposure: the WORST (largest) rest→danger gap is fine; we report the
  // smallest gap among rest points (the most-exposed phone/picnic)
  const rests: Cell[] = [
    ...m.phones.map((p) => [Math.round(p.x), Math.round(p.y)] as Cell),
    ...m.props.filter((p) => p.sprite === 'picnic').map((p) => [Math.round(p.x), Math.round(p.y)] as Cell),
  ];
  let restExposurePx = -1;
  for (const r of rests) {
    const d = bfsNearestPx(m.grid, isSolid, r, danger);
    if (d >= 0 && (restExposurePx < 0 || d < restExposurePx)) restExposurePx = d;
  }

  // proximity: the nearest spawn cell to any FIXTURE the player interacts with
  // — doors, phones, atms, and POINT triggers (a story beat / a boss touch,
  // rect ≤ 6 tiles). Big AMBIENT zone triggers (echo, stem-loss, a reveal
  // sweep) are SUPPOSED to blanket the danger, so they don't count as crowded.
  const fixtures: Cell[] = [
    ...m.doors.map((d) => [Math.floor(d.x + d.w / 2), Math.floor(d.y + d.h / 2)] as Cell),
    ...m.phones.map((p) => [Math.round(p.x), Math.round(p.y)] as Cell),
    ...(m.atms ?? []).map((p) => [Math.round(p.x), Math.round(p.y)] as Cell),
    ...m.triggers.filter((t) => t.rect.w * t.rect.h <= 6).map((t) => [Math.floor(t.rect.x + t.rect.w / 2), Math.floor(t.rect.y + t.rect.h / 2)] as Cell),
  ];
  let proximityPx = -1;
  for (const s of danger) {
    const d = nearestPx(s, fixtures);
    if (d >= 0 && (proximityPx < 0 || d < proximityPx)) proximityPx = d;
  }

  // unavoidable touches: BFS from entrance[0] over floor with each spawner
  // DILATED by `sight` removed — any other door now unreachable was a forced
  // fight to traverse. side paths: spawners whose rect never touches the SAFE
  // corridor (the cells still reachable once danger is dilated away).
  let unavoidableTouches = 0;
  let sidePaths = 0;
  if (ents.length >= 1 && danger.length) {
    const dilated = new Set<string>();
    for (const [x, y] of danger) {
      for (let dy = -sight; dy <= sight; dy++) {
        for (let dx = -sight; dx <= sight; dx++) dilated.add(`${x + dx},${y + dy}`);
      }
    }
    const safeSolid: IsSolid = (ch: string): boolean => isSolid(ch); // base
    const safeGrid = m.grid;
    const safeField = bfsFieldMasked(safeGrid, safeSolid, ents[0], dilated);
    for (let i = 1; i < ents.length; i++) {
      const [ex, ey] = ents[i];
      if (safeField[ey]?.[ex] === undefined || safeField[ey][ex] < 0) unavoidableTouches += 1;
    }
    for (const s of m.spawners) {
      const cx = Math.floor(s.rect.x + s.rect.w / 2);
      const cy = Math.floor(s.rect.y + s.rect.h / 2);
      // a spawner is a SIDE path if its rect centre is NOT on the safe
      // corridor (you can route around it) — a rewarded optional fight
      if (safeField[cy]?.[cx] === undefined || safeField[cy][cx] < 0) sidePaths += 1;
    }
  }

  return {
    id: m.id,
    klass: klassOf(m),
    tiles,
    screens: round2(screens),
    enemyCount,
    density: round2(screens > 0 ? enemyCount / screens : 0),
    gracePx,
    restExposurePx,
    unavoidableTouches,
    sidePaths,
    proximityPx,
  };
}

/** BFS field that treats the `masked` cell set as solid too (the dilated danger) */
function bfsFieldMasked(grid: readonly string[], isSolid: IsSolid, from: Cell, masked: Set<string>): number[][] {
  const h = grid.length;
  const w = grid[0].length;
  const dist = Array.from({ length: h }, () => Array.from({ length: w }, () => -1));
  const [sx, sy] = from;
  if (sx < 0 || sy < 0 || sx >= w || sy >= h || isSolid(grid[sy][sx]) || masked.has(`${sx},${sy}`)) return dist;
  dist[sy][sx] = 0;
  const q: Cell[] = [[sx, sy]];
  let head = 0;
  while (head < q.length) {
    const [cx, cy] = q[head++];
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (dist[ny][nx] !== -1 || isSolid(grid[ny][nx]) || masked.has(`${nx},${ny}`)) continue;
      dist[ny][nx] = dist[cy][cx] + 1;
      q.push([nx, ny]);
    }
  }
  return dist;
}

/** the §A9 target density band per class (enemies per screen) — routes hot,
 *  settlements cool, dungeons rising. Report-only guidance, not a gate. */
export const BAND_TARGET: Record<PressureReport['klass'], [number, number]> = {
  city: [0, 1.2],
  town: [0, 1.6],
  village: [0, 1.6],
  interior: [0, 0],
  field: [1.5, 4.5],
  dungeon: [1.0, 4.0],
};

/** the one-word §A9 verdict for a report's density vs its class band */
export function bandVerdict(r: PressureReport): 'cool' | 'in-band' | 'hot' {
  const [lo, hi] = BAND_TARGET[r.klass];
  if (r.density < lo) return 'cool';
  if (r.density > hi) return 'hot';
  return 'in-band';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ---------------- the HARD subset (joins the content validator) ----------- *
 * Only the rules that catch a genuine PLAYABILITY fault gate the build; the
 * soft "feel" numbers stay in the report. Thresholds are the user's "annoying
 * or empty" line drawn conservatively so shipped maps pass and only a real
 * spawn-on-the-phone or a no-grace doorway trips it (fix, or a reasoned WAIVER
 * in content-validate.ts per Prime Law 4).
 */
export const PRESSURE_LIMITS = {
  /** a spawner must sit at least this far (px) from a door/phone/atm/trigger */
  MIN_PROXIMITY_PX: 24,
  /** a doorway must give at least this much (px) before the first contact */
  MIN_GRACE_PX: 16,
} as const;

/** the hard-rule flags for one map (empty = clean) */
export function pressureHardFlags(r: PressureReport): string[] {
  const flags: string[] = [];
  if (r.proximityPx >= 0 && r.proximityPx < PRESSURE_LIMITS.MIN_PROXIMITY_PX) {
    flags.push(`a spawner sits ${r.proximityPx}px from a door/phone/atm/trigger (min ${PRESSURE_LIMITS.MIN_PROXIMITY_PX}px) — it crowds a fixture`);
  }
  if (r.gracePx >= 0 && r.gracePx < PRESSURE_LIMITS.MIN_GRACE_PX) {
    flags.push(`an entrance gives only ${r.gracePx}px of grace before the first spawner (min ${PRESSURE_LIMITS.MIN_GRACE_PX}px)`);
  }
  return flags;
}
