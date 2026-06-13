/**
 * THE MAP QUALITY VALIDATOR — the playability library (S15g, Prime Law 4).
 *
 * Pure graph logic (no Phaser, no data imports): the caller passes an
 * `isSolid(ch)` predicate, so vitest can pin the math on synthetic grids and
 * tools/content-validate.ts can drive it over every canon map with the real
 * tile-solidity. The validator owns the WAIVER table; this file owns truth.
 *
 * Reachability is TILE-based (the engine's own solidity): it asks "ignoring
 * furniture, can you walk the floor from the map's connected world to each
 * piece of content?" — catching genuinely orphaned NPCs/signs/phones/ATMs/
 * picnics/triggers and doors that dump you into a wall. Prop-solid precision
 * and per-rotation dungeon BFS are Movement Two's job; this is the floor.
 */
import type { MapDef } from '../schemas';

export type IsSolid = (ch: string) => boolean;

export interface Components {
  comp: number[][];
  /** id of the largest walkable component (the reachable "world") */
  mainId: number;
}

/** flood every walkable tile into connected components (4-neighbour) */
export function components(grid: readonly string[], isSolid: IsSolid): Components {
  const h = grid.length;
  const w = grid[0].length;
  const comp = Array.from({ length: h }, () => Array.from({ length: w }, () => -1));
  let next = 0;
  let mainId = -1;
  let best = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (comp[y][x] !== -1 || isSolid(grid[y][x])) continue;
      const id = next++;
      let n = 0;
      const stack: Array<[number, number]> = [[x, y]];
      comp[y][x] = id;
      while (stack.length) {
        const [cx, cy] = stack.pop() as [number, number];
        n++;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (comp[ny][nx] !== -1 || isSolid(grid[ny][nx])) continue;
          comp[ny][nx] = id;
          stack.push([nx, ny]);
        }
      }
      if (n > best) {
        best = n;
        mainId = id;
      }
    }
  }
  return { comp, mainId };
}

/** is (tx,ty) — or a 4-neighbour you'd interact from — in the main world? */
export function reachable(c: Components, tx: number, ty: number): boolean {
  const h = c.comp.length;
  const w = c.comp[0].length;
  for (const [dx, dy] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
    const nx = tx + dx;
    const ny = ty + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    if (c.comp[ny][nx] === c.mainId) return true;
  }
  return false;
}

/* ===================================================================== *
 * MOVEMENT TWO (S15g, ADR-045) — the dungeon post-conditions, beside the
 * Movement One reachability. Still pure graph logic on an `isSolid`
 * predicate: vitest pins the math on synthetic grids and on the shipped
 * step-pyramid's own rotor states (the precedent, generalized below), and
 * the dungeon generators assert these AT BUILD so a draft can never ship a
 * soft-lock. Tile coords throughout (the engine's grid space).
 * ===================================================================== */

export type Cell = readonly [number, number];

/** BFS distances from a seed cell over the walkable floor; unreachable = -1 */
export function bfsField(grid: readonly string[], isSolid: IsSolid, from: Cell): number[][] {
  const h = grid.length;
  const w = grid[0].length;
  const dist = Array.from({ length: h }, () => Array.from({ length: w }, () => -1));
  const [sx, sy] = from;
  if (sx < 0 || sy < 0 || sx >= w || sy >= h || isSolid(grid[sy][sx])) return dist;
  dist[sy][sx] = 0;
  const queue: Cell[] = [[sx, sy]];
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (dist[ny][nx] !== -1 || isSolid(grid[ny][nx])) continue;
      dist[ny][nx] = dist[cy][cx] + 1;
      queue.push([nx, ny]);
    }
  }
  return dist;
}

/** can a walking player reach `to` from `from` across the floor? */
export function pathExists(grid: readonly string[], isSolid: IsSolid, from: Cell, to: Cell): boolean {
  const [tx, ty] = to;
  if (ty < 0 || tx < 0 || ty >= grid.length || tx >= grid[0].length) return false;
  return bfsField(grid, isSolid, from)[ty][tx] >= 0;
}

/** the nearest walkable tile to (cx,cy) within Chebyshev radius `r` (the
 *  cell a door/trigger is interacted FROM) — null if none is close */
export function nearestWalkable(grid: readonly string[], isSolid: IsSolid, cx: number, cy: number, r = 2): Cell | null {
  const h = grid.length;
  const w = grid[0].length;
  for (let rad = 0; rad <= r; rad++) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (!isSolid(grid[y][x])) return [x, y];
      }
    }
  }
  return null;
}

/**
 * THE GENERALIZED SOFT-LOCK PROOF — the step-pyramid's BFS-at-every-rotation
 * precedent (maps_ch2.test.ts), lifted out of the bespoke test into the
 * shared library. A STATEFUL piece (rotor, lock, switch) presents a finite
 * set of reachable grid STATES; the dungeon is soft-lock-free iff, in EVERY
 * one of those states, every `target` stays reachable from `entry`. The
 * pyramid proves it on its four rotor turns; a generated dungeon proves it
 * on every configuration its switches can reach — not just the initial one.
 *
 * Returns the indices of the states that strand a target (empty = proven).
 */
export function softLockFailures(states: ReadonlyArray<readonly string[]>, isSolid: IsSolid, entry: Cell, targets: readonly Cell[]): number[] {
  const bad: number[] = [];
  states.forEach((grid, i) => {
    const field = bfsField(grid, isSolid, entry);
    const stranded = targets.some(([tx, ty]) => {
      if (ty < 0 || tx < 0 || ty >= grid.length || tx >= grid[0].length) return true;
      return field[ty][tx] < 0;
    });
    if (stranded) bad.push(i);
  });
  return bad;
}

/**
 * Is the map's largest walkable component a TREE (acyclic)? An undirected
 * connected graph is a tree iff edges == nodes − 1. laughing_ruins' "the
 * loops are a lie" is exactly this: every passage that LOOKS like it circles
 * back is a dead branch — BFS-provable, not a promise. (4-neighbour floor;
 * a 2×2 floor block introduces a 4-cycle, so a tree map is corridor-thin.)
 */
export function floorIsTree(grid: readonly string[], isSolid: IsSolid): boolean {
  const { comp, mainId } = components(grid, isSolid);
  if (mainId < 0) return true; // no floor at all is vacuously acyclic
  let nodes = 0;
  let edges = 0;
  for (let y = 0; y < comp.length; y++) {
    for (let x = 0; x < comp[0].length; x++) {
      if (comp[y][x] !== mainId) continue;
      nodes++;
      // count each undirected edge once: only look right + down
      if (x + 1 < comp[0].length && comp[y][x + 1] === mainId) edges++;
      if (y + 1 < comp.length && comp[y + 1][x] === mainId) edges++;
    }
  }
  return edges === nodes - 1;
}

/** a map whose graph the dungeon post-conditions read (DraftMapDef satisfies it) */
export type DungeonLike = Pick<MapDef, 'grid' | 'doors' | 'props' | 'phones' | 'spawners' | 'triggers'>;

/** the cell just inside a door zone (where the player stands to use it) */
export function doorCell(grid: readonly string[], isSolid: IsSolid, d: MapDef['doors'][number]): Cell | null {
  const cx = Math.floor(d.x + d.w / 2);
  const cy = Math.floor(d.y + d.h / 2);
  // step one tile back from the edge the door sits on, toward the interior
  const back: Record<string, Cell> = {
    up: [cx, cy + 1], down: [cx, cy - 1], left: [cx + 1, cy], right: [cx - 1, cy],
  };
  const [bx, by] = back[d.facing] ?? [cx, cy];
  if (by >= 0 && bx >= 0 && by < grid.length && bx < grid[0].length && !isSolid(grid[by][bx])) return [bx, by];
  return nearestWalkable(grid, isSolid, cx, cy, 2);
}

/** every tile inside a spawner rect (the danger field) */
function spawnerCells(m: DungeonLike): Cell[] {
  const out: Cell[] = [];
  for (const s of m.spawners) {
    for (let y = s.rect.y; y < s.rect.y + s.rect.h; y++) {
      for (let x = s.rect.x; x < s.rect.x + s.rect.w; x++) out.push([x, y]);
    }
  }
  return out;
}

/**
 * The dungeon post-conditions (empty = clean). `entry`/`exit` default to the
 * FIRST and LAST door zones (the grammars order doors entrance→…→exit); a
 * trigger whose id contains 'boss' marks the boss arena. Rest points are
 * phones + picnic tables. Generators assert this at build; vitest re-derives
 * it from the produced draft on every pinned seed.
 */
export function dungeonFlags(m: DungeonLike, isSolid: IsSolid, opts?: { entry?: Cell; exit?: Cell }): string[] {
  const flags: string[] = [];
  if (m.doors.length < 2 && !(opts?.entry && opts?.exit)) {
    flags.push('a dungeon needs an entrance and an exit (≥2 doors)');
    return flags;
  }
  const entry = opts?.entry ?? doorCell(m.grid, isSolid, m.doors[0]);
  const exit = opts?.exit ?? doorCell(m.grid, isSolid, m.doors[m.doors.length - 1]);
  if (!entry) { flags.push('the entrance door opens onto a wall'); return flags; }
  if (!exit) { flags.push('the exit door opens onto a wall'); return flags; }

  const field = bfsField(m.grid, isSolid, entry);
  const reach = (c: Cell): number => (c[1] < 0 || c[0] < 0 || c[1] >= m.grid.length || c[0] >= m.grid[0].length ? -1 : field[c[1]][c[0]]);

  if (reach(exit) < 0) flags.push(`entrance does not reach the exit (${entry} → ${exit})`);

  // the boss route: a 'boss'-tagged trigger must sit on the entrance→exit graph
  const bossT = m.triggers.find((t) => /boss/i.test(t.id));
  if (bossT) {
    const bc: Cell = [Math.floor(bossT.rect.x + bossT.rect.w / 2), Math.floor(bossT.rect.y + bossT.rect.h / 2)];
    const bw = nearestWalkable(m.grid, isSolid, bc[0], bc[1], 3);
    if (!bw || reach(bw) < 0) flags.push(`the boss arena '${bossT.id}' is unreachable from the entrance`);
  }

  // §A4.5 rest-before-pressure: a phone/picnic must lie no DEEPER than the
  // first reachable danger (you always pass a heal before the first spike)
  const dangers = spawnerCells(m).map(reach).filter((d) => d >= 0);
  if (dangers.length) {
    const firstDanger = Math.min(...dangers);
    const rests: Cell[] = [
      ...m.phones.map((p) => [Math.round(p.x), Math.round(p.y)] as Cell),
      ...m.props.filter((p) => p.sprite === 'picnic').map((p) => [Math.round(p.x), Math.round(p.y)] as Cell),
    ];
    const restDists = rests.map((c) => nearestWalkable(m.grid, isSolid, c[0], c[1], 2)).map((c) => (c ? reach(c) : -1)).filter((d) => d >= 0);
    if (!restDists.length) flags.push('a dungeon with spawners has no reachable rest point (phone/picnic) before the pressure');
    else if (Math.min(...restDists) > firstDanger) flags.push(`the first rest point sits DEEPER than the first spawner (${Math.min(...restDists)} > ${firstDanger}) — no rest before pressure`);
  }

  return flags;
}

/**
 * Every playability flag for one map (empty = clean). The validator fixes or
 * WAIVES each. `maps` resolves door targets for the landing-walkable check.
 */
export function mapQualityFlags(m: MapDef, isSolid: IsSolid, maps: Record<string, MapDef>): string[] {
  const c = components(m.grid, isSolid);
  const flags: string[] = [];
  const at = (x: number, y: number): boolean => reachable(c, Math.round(x), Math.round(y));

  for (const n of m.npcs) {
    if (!at(n.x, n.y)) flags.push(`npc '${n.id}' is orphaned @${Math.round(n.x)},${Math.round(n.y)}`);
  }
  for (const s of m.signs) {
    if (!at(s.x, s.y)) flags.push(`sign @${s.x},${s.y} is orphaned`);
  }
  for (const p of m.phones) {
    if (!at(p.x, p.y)) flags.push(`phone @${p.x},${p.y} is orphaned`);
  }
  for (const a of m.atms ?? []) {
    if (!at(a.x, a.y)) flags.push(`atm @${a.x},${a.y} is orphaned`);
  }
  for (const p of m.props) {
    if (p.sprite === 'picnic' && !at(p.x, p.y)) flags.push(`picnic table @${p.x},${p.y} is orphaned`);
  }
  for (const t of m.triggers) {
    let ok = false;
    for (let y = t.rect.y; y < t.rect.y + t.rect.h && !ok; y++) {
      for (let x = t.rect.x; x < t.rect.x + t.rect.w && !ok; x++) if (at(x, y)) ok = true;
    }
    if (!ok) flags.push(`trigger '${t.id}' is orphaned`);
  }

  // doors (zones + prop doors) must land on a WALKABLE tile of the target map
  const doors: Array<{ to: string; tx: number; ty: number; kind: string }> = [
    ...m.doors.map((d) => ({ to: d.to, tx: d.tx, ty: d.ty, kind: 'door' })),
    ...m.props.flatMap((p) => (p.door ? [{ to: p.door.to, tx: p.door.tx, ty: p.door.ty, kind: `prop '${p.sprite}' door` }] : [])),
  ];
  for (const d of doors) {
    const target = maps[d.to];
    if (!target) continue; // existence + bounds are the validator's existing checks
    const lx = Math.floor(d.tx / 16);
    const ly = Math.floor(d.ty / 16);
    if (ly >= 0 && ly < target.grid.length && lx >= 0 && lx < target.grid[0].length && isSolid(target.grid[ly][lx])) {
      flags.push(`${d.kind} → ${d.to} lands on a solid tile '${target.grid[ly][lx]}' @${lx},${ly}`);
    }
  }

  return flags;
}
