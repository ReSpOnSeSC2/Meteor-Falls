/**
 * THE DUNGEON KIT (S15g Movement Two, ADR-045) — the LOW-LEVEL verbs the
 * eight site grammars compose. The grammars themselves are bespoke (one per
 * SITE, never a generic maze — the user's law); what they SHARE is the carve
 * primitives, the band→spawner helper, the dungeon solidity predicate, and
 * the build-time post-condition gate. Determinism rides the named Streams
 * (Prime Law 2 — no Date.now()/Math.random() anywhere under src/levelkit/**).
 *
 * The model is "carve floor out of solid rock": a grammar opens a Grid filled
 * with its wall char, carves rooms + corridors as floor, and punches doors in
 * the outer wall. The spine (entrance→exit→boss) is carved FIRST and never
 * re-walled, so reachability holds BY CONSTRUCTION on every seed; `sealed()`
 * is the safety net that proves it before the draft leaves the building.
 */
import { Grid, furniture, BAND_ROSTER } from '../kit';
import { dungeonFlags, floorIsTree, type Cell } from '../mapcheck';
import type { DraftMapDef, EncounterBand, PropDef, SpawnerDef } from '../../schemas';

export { Grid };

/**
 * Wall chars the dungeon grammars draw — exactly the TILESET entries with
 * solid:true that read as "rock/wall" in each region. Matches the engine's
 * own solidity (vitest cross-checks DUNGEON_WALL against TILESET.solid), so a
 * build-time BFS collides identically to a shipped walk.
 */
export const DUNGEON_WALL = new Set(['Z', 'W', 'J', 'U', 'B', 'O', 'C', 'b', '-', '|', 'e', 'E', 'A']);
export const isDungeonSolid = (ch: string): boolean => DUNGEON_WALL.has(ch);

/** the §A7 band roster as a fresh enemy list (SpawnerDef wants string[]) */
export function bandEnemies(band: EncounterBand | undefined, fallback: EncounterBand): string[] {
  return [...(BAND_ROSTER[band ?? fallback] ?? BAND_ROSTER[fallback])];
}

/** carve a horizontal run of floor (thick rows downward from y) */
export function corridorH(g: Grid, x0: number, x1: number, y: number, floor: string, thick = 1): void {
  const [a, b] = x0 <= x1 ? [x0, x1] : [x1, x0];
  for (let x = a; x <= b; x++) for (let t = 0; t < thick; t++) g.set(x, y + t, floor);
}

/** carve a vertical run of floor (thick cols rightward from x) */
export function corridorV(g: Grid, x: number, y0: number, y1: number, floor: string, thick = 1): void {
  const [a, b] = y0 <= y1 ? [y0, y1] : [y1, y0];
  for (let y = a; y <= b; y++) for (let t = 0; t < thick; t++) g.set(x + t, y, floor);
}

/** carve a rectangular room of floor */
export function carveRoom(g: Grid, x: number, y: number, w: number, h: number, floor: string): void {
  g.rect(x, y, w, h, floor);
}

/** a payphone rest point: the prop + the phones[] entry, returned as a pair */
export function rest(x: number, y: number): { prop: PropDef; phone: { x: number; y: number } } {
  return { prop: furniture('payphone', x, y), phone: { x, y } };
}

/**
 * Rising spawners across a list of zone rects, ordered shallow→deep: counts
 * climb toward the boss (the §B4 "dungeons rise" law, made data). Each rect is
 * inset by `inset` so no spawn cell crowds a wall/fixture (the proximity rule).
 */
export function risingSpawners(
  band: string[],
  zones: ReadonlyArray<{ x: number; y: number; w: number; h: number }>,
  inset = 1,
): SpawnerDef[] {
  return zones.map((z, i) => ({
    enemies: band,
    count: Math.min(4, 1 + i),
    rect: {
      x: z.x + inset,
      y: z.y + inset,
      w: Math.max(1, z.w - inset * 2),
      h: Math.max(1, z.h - inset * 2),
    },
  }));
}

/**
 * THE BUILD-TIME POST-CONDITION GATE (Prime Law 4). Runs the generalized
 * dungeon BFS (entrance→exit, boss route, rest-before-pressure) on the
 * finished draft; throws — loudly, naming the site — if a draft would ship a
 * soft-lock. `tree` additionally proves the floor is acyclic (laughing_ruins'
 * "the loops are a lie" claim, BFS-provable: a tree has no cycle).
 */
export function sealed(d: DraftMapDef, opts?: { entry?: Cell; exit?: Cell; tree?: boolean }): DraftMapDef {
  const flags = dungeonFlags(d, isDungeonSolid, opts);
  if (opts?.tree && !floorIsTree(d.grid, isDungeonSolid)) {
    flags.push('the floor is NOT a tree — a real loop exists where the site promises none');
  }
  if (flags.length) {
    throw new Error(`[levelkit] dungeon '${d.id}' fails its post-conditions:\n  - ${flags.join('\n  - ')}`);
  }
  return d;
}

/** cure-safe return proof (spore_forest): from every `zone` cell a path home
 *  to `entry` exists that never crosses a hazard cell — a scrambled kid can
 *  always walk out. Returns the zones that TRAP (empty = all cure-safe). */
export function trappedZones(
  grid: readonly string[],
  entry: Cell,
  zones: ReadonlyArray<{ x: number; y: number; w: number; h: number }>,
): number[] {
  const hazard = new Set<string>();
  for (const z of zones) {
    for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) hazard.add(`${x},${y}`);
  }
  // BFS from entry over floor with ALL hazard cells masked: a zone is
  // cure-safe iff at least one cell ON ITS BORDER is reachable on the clean
  // graph (you step one tile out of the spores and you're already on a safe
  // route home).
  const h = grid.length;
  const w = grid[0].length;
  const seen = Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  const open = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && !isDungeonSolid(grid[y][x]) && !hazard.has(`${x},${y}`);
  if (open(entry[0], entry[1])) {
    const q: Cell[] = [entry];
    seen[entry[1]][entry[0]] = true;
    let head = 0;
    while (head < q.length) {
      const [cx, cy] = q[head++];
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (open(nx, ny) && !seen[ny][nx]) {
          seen[ny][nx] = true;
          q.push([nx, ny]);
        }
      }
    }
  }
  const bad: number[] = [];
  zones.forEach((z, i) => {
    let safe = false;
    for (let y = z.y - 1; y <= z.y + z.h && !safe; y++) {
      for (let x = z.x - 1; x <= z.x + z.w && !safe; x++) {
        if (x >= 0 && y >= 0 && x < w && y < h && seen[y][x]) safe = true;
      }
    }
    if (!safe) bad.push(i);
  });
  return bad;
}
