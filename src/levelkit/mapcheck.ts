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

/* ===================================================================== *
 * THE DOOR AUDIT (S15i playtest C, ADR-045 family) — a STATIC sweep that
 * walks every transition and asks the two ways a door betrays the player:
 *   (a) it dumps you onto a SOLID / out-of-bounds tile (you spawn stuck), or
 *   (b) it lands you nowhere near the reciprocal return-door (you "come in
 *       from the wrong way" / the wrong edge of the map).
 * Pure graph + geometry on the same `isSolid(ch)` predicate the validator
 * builds (no Phaser): the runtime does `scene.restart({mapId:to, x:tx, y:ty})`
 * then spawns the player at PIXEL (tx,ty), feet-origin — so the landing tile
 * is (floor(tx/TILE), floor(ty/TILE)), identical to mapQualityFlags above.
 * Prop `door`s carry no facing and always admit you facing 'up' (the engine
 * hard-codes it); zone doors carry their own. This function only REPORTS —
 * the fixes are the project lead's (tools/door-audit.ts owns the gate).
 *
 * WRONG-EDGE measurement: a reciprocal door pair shares ONE physical seam, so a
 * correct landing arrives where you'd STAND to walk back through the return door
 * — i.e. at that return door's interior cell (doorCell()), NOT on its zone (the
 * zone sits IN the wall; you can never land on the wall). Anchoring the distance
 * to the return door's CENTER (the literal spec phrasing) double-counts that
 * unavoidable ~1.5-tile "one tile inside the doorway" offset and floods the
 * report with non-bugs; anchoring to doorCell() isolates the true fault (you
 * landed on a DIFFERENT edge — tens to hundreds of px away). We REPORT the
 * center distance (spec phrasing, full transparency) but FLAG on the doorCell
 * distance against the same ~1.5-tile budget.
 * ===================================================================== */

/** px per tile — the tilemap is built `{ tileWidth: 16, tileHeight: 16 }` */
const TILE = 16;

/**
 * px a landing may sit from where you'd STAND to use the reciprocal return door
 * (its interior doorCell) before it reads as the WRONG edge / wrong way in.
 *
 * The playtest spec's first estimate was "~24px ≈ 1.5 tiles"; a normal building
 * entrance / screen seam lands you one tile inside the threshold, which is
 * already ~25px from the return door's cell (the feet-origin offset) — so 24px
 * is under the by-design floor. The gate first shipped at 64px, but that
 * tolerated a "lands 2–4 tiles into the room" band the player reads as spawning
 * mid-floor (the growInterior rooms all drifted there when their mats rode down;
 * fixed 2026-07-02 by the maps.ts assembly re-aim pass + hand re-aims). The
 * re-measured distribution (tools/door-landing-survey.ts): a dense snug cluster
 * at 8–32px, exactly TWO deliberate 34px hand-tunes (procession_way→
 * minimus_major lands ON the street per its comment; spine_hand→bootstep_moor
 * lands directly above the moor's south gate — its doorCell falls back oddly),
 * then NOTHING until the historic wrong-edge band at ≥142px (jungle_2→
 * valle_dorado 584px, wintermoor inter-floor 184–376px, valle_dorado→
 * pyramid_ante 192px — all long fixed). 40px sits in the empty gap: above the
 * snug cluster + both hand-tunes, far below any real wrong-edge. Tune here if
 * the maps move — the gap is the truth, not 40.
 */
export const FAR_FROM_RETURN_PX = 40;

/** one transition's verdict. `lx,ly` are the destination LANDING tile;
 *  `char` is the destination tile char there ('' = out of bounds). */
export interface DoorFinding {
  /** source map id */
  from: string;
  /** destination map id (the door's `to`) */
  to: string;
  /** which sort of door this is */
  kind: 'door' | 'prop';
  /** landing pixel (the engine spawns the player's feet here) */
  tx: number;
  ty: number;
  /** landing tile = floor(tx/TILE), floor(ty/TILE) */
  lx: number;
  ly: number;
  /** the destination tile char under the landing ('' if out of bounds) */
  char: string;
  /** the failure modes (a door can trip more than one) */
  issue: Array<'landsSolid' | 'noReturn' | 'farFromReturn' | 'bodyBlocked'>;
  /** human line per issue, in order */
  detail: string[];
}

/** a door's indicator marks VERTICAL connectors (stairs/elevator) — these move
 *  you between floors, so the reciprocal up-/down-door is NEVER co-located with
 *  the landing (you step OFF the stairhead into the room); the wrong-EDGE check
 *  is meaningless for them and is skipped. */
function isVertical(indicator: string | undefined): boolean {
  return indicator === 'stairs' || indicator === 'elevator';
}

/** a normalized door, source-agnostic, for the audit's sweep */
interface AuditDoor {
  from: string;
  to: string;
  kind: 'door' | 'prop';
  tx: number;
  ty: number;
  /** the source door's indicator (zone doors only; props carry none) */
  indicator?: string;
  /** a label for the prop's sprite, purely for richer detail text */
  label: string;
}

/** every door (zone + prop) on one map, normalized to PIXELS */
function auditDoors(id: string, m: MapDef): AuditDoor[] {
  const out: AuditDoor[] = [];
  for (const d of m.doors) {
    out.push({ from: id, to: d.to, kind: 'door', tx: d.tx, ty: d.ty, indicator: d.indicator, label: `door` });
  }
  for (const p of m.props) {
    if (!p.door) continue;
    out.push({
      from: id,
      to: p.door.to,
      kind: 'prop',
      tx: p.door.tx,
      ty: p.door.ty,
      label: `prop '${p.sprite}' door`,
    });
  }
  return out;
}

/** the CENTER pixel of a door zone on the destination map (for return math) */
function zoneCenterPx(d: MapDef['doors'][number]): { cx: number; cy: number } {
  return { cx: (d.x + d.w / 2) * TILE, cy: (d.y + d.h / 2) * TILE };
}

/**
 * THE PLAYER BODY BOX (ADR-135), expressed in map-DATA tile coordinates. A door
 * places the player's FEET at the landing pixel (d.tx,d.ty); the engine's
 * collision box is (in NATIVE px) bx = feet.x − 5, by = feet.y − 9, w = 10, h = 9
 * — see OverworldScene.clampSpawnToWalkable's `fits()`. Because every native px
 * cancels against TILE_PX (= 16 × ART_SCALE) in that floor-divide, the TILE SPAN
 * the box covers is scale-free and derivable from the raw d.tx/d.ty here — no
 * Phaser, no ART_SCALE.
 *
 * The catch this encodes: feet land at the tile's TOP edge (a door aims ty at a
 * row's top, ty = row*16), so `by = ty − 9` always sits ~9px UP into the row
 * ABOVE the landing tile, and the ±5px width can reach the side/corner tiles. So
 * the box ALWAYS overlaps ≥1 neighbour of the landing tile — a "2-tall door
 * mouth": land on a walkable floor tile whose upper (or corner) neighbour is a
 * solid border and the body still clips the wall (the Aurora ice-field entry
 * soft-lock class). Returns the INCLUSIVE tile range [x0..x1]×[y0..y1] the engine
 * samples — the far edge is inclusive to match `fits()`'s floor((bx+bw)/TILE_PX).
 */
export function playerBodyBoxTiles(tx: number, ty: number): { x0: number; x1: number; y0: number; y1: number } {
  return {
    x0: Math.floor((tx - 5) / TILE),
    x1: Math.floor((tx + 5) / TILE),
    y0: Math.floor((ty - 9) / TILE),
    y1: Math.floor(ty / TILE),
  };
}

/**
 * THE DOOR AUDIT — structured findings for every BROKEN transition across all
 * maps (clean doors produce nothing). For each door (zone + prop) on each map:
 *
 *   landsSolid     — the landing tile is solid, or out of the destination
 *                    grid's bounds → the player spawns STUCK.
 *   noReturn       — the destination map has NO door (zone or prop) whose `to`
 *                    points back to this map → one-way trip (reported, lower
 *                    severity: not every door must be reciprocal).
 *   bodyBlocked    — (opt-in, opts.bodyBox) the landing TILE is walkable, but the
 *                    40×36 player body box (feet at the tile TOP) pokes into a
 *                    solid/OOB NEIGHBOUR, so the runtime clampSpawnToWalkable has
 *                    to NUDGE the spawn — the "2-tall door mouth" trap the single-
 *                    tile landsSolid check structurally cannot see. Non-breaking
 *                    warning tier (the nudge rescues it); mirrors OverworldScene's
 *                    `fits()` in TILE space (see playerBodyBoxTiles). Default OFF
 *                    so existing callers are unchanged.
 *   farFromReturn  — the landing pixel sits > FAR_FROM_RETURN_PX from where you
 *                    would STAND to use the NEAREST reciprocal return-door (its
 *                    interior doorCell) on the destination → you arrive at the
 *                    wrong edge / wrong way. The raw zone-CENTER distance (the
 *                    spec's phrasing) is reported alongside for transparency.
 *                    Measured only against zone return-doors — prop doors carry
 *                    no facing/cell to anchor on; if the only return path is a
 *                    prop door, the distance is undefined and we don't flag it.
 *                    VERTICAL connectors (stairs/elevator, either side) are
 *                    exempt: a stairwell deliberately drops you off the stairhead
 *                    away from the up-door, which is not a wrong EDGE.
 *
 * Pure: the caller supplies `isSolid` (the engine's tile solidity) and the full
 * `maps` record so destinations + their return-doors resolve.
 */
export function doorAudit(
  maps: Record<string, MapDef>,
  isSolid: IsSolid,
  opts?: { bodyBox?: boolean },
): DoorFinding[] {
  const findings: DoorFinding[] = [];
  // pre-index, per map, the zone doors that point back OUT to a given source —
  // these are the candidate "return doors" a landing should arrive beside.
  const returnZonesByMap: Record<string, MapDef['doors']> = {};
  for (const [id, m] of Object.entries(maps)) returnZonesByMap[id] = m.doors;
  // does ANY door (zone OR prop) on `dst` point back to `src`?
  const hasAnyReturn = (dst: string, src: string): boolean => {
    const dm = maps[dst];
    if (!dm) return false;
    if (dm.doors.some((d) => d.to === src)) return true;
    return dm.props.some((p) => p.door?.to === src);
  };

  for (const [id, m] of Object.entries(maps)) {
    for (const d of auditDoors(id, m)) {
      const target = maps[d.to];
      if (!target) continue; // dangling targets are the validator's existing job

      const lx = Math.floor(d.tx / TILE);
      const ly = Math.floor(d.ty / TILE);
      const inBounds = ly >= 0 && ly < target.grid.length && lx >= 0 && lx < target.grid[0].length;
      const char = inBounds ? target.grid[ly][lx] : '';

      const issue: DoorFinding['issue'] = [];
      const detail: string[] = [];

      // (a) STUCK — solid landing or off the destination grid entirely
      if (!inBounds) {
        issue.push('landsSolid');
        detail.push(
          `lands OUT OF BOUNDS on ${d.to} (tile ${lx},${ly}; grid is ${target.grid[0].length}×${target.grid.length}) — player spawns stuck`,
        );
      } else if (isSolid(char)) {
        issue.push('landsSolid');
        detail.push(`lands on SOLID tile '${char}' @${lx},${ly} of ${d.to} — player spawns stuck`);
      }

      // (a2) BODY-BLOCKED (opt-in) — the landing TILE is walkable, but the 40×36
      // player body box (feet at the tile top) overlaps a solid/OOB NEIGHBOUR, so
      // the runtime clampSpawnToWalkable must NUDGE the spawn. The single-tile
      // landsSolid check above can never see this; it's a warning tier, not a hard
      // fault (the nudge rescues it), but a door aimed at the tile interior lands
      // clean and needs no rescue. Mirrors OverworldScene's `fits()` in TILE space.
      if (opts?.bodyBox && inBounds && !isSolid(char)) {
        const box = playerBodyBoxTiles(d.tx, d.ty);
        const blockers: string[] = [];
        for (let by = box.y0; by <= box.y1; by++) {
          for (let bx = box.x0; bx <= box.x1; bx++) {
            if (bx === lx && by === ly) continue; // the landing tile itself is walkable (checked above)
            if (by < 0 || bx < 0 || by >= target.grid.length || bx >= target.grid[0].length) {
              blockers.push(`(${bx},${by})=OOB`);
            } else if (isSolid(target.grid[by][bx])) {
              blockers.push(`(${bx},${by})='${target.grid[by][bx]}'`);
            }
          }
        }
        if (blockers.length > 0) {
          issue.push('bodyBlocked');
          detail.push(
            `walkable landing @${lx},${ly} of ${d.to}, but the player body box overlaps solid/OOB tile(s) ${blockers.join(', ')} — spawn body-blocked (clampSpawnToWalkable nudges it)`,
          );
        }
      }

      // (b1) one-way: nothing on the destination comes back here
      if (!hasAnyReturn(d.to, id)) {
        issue.push('noReturn');
        detail.push(`${d.to} has no door back to ${id} (one-way)`);
      } else if (isVertical(d.indicator)) {
        // VERTICAL connector (stairs/elevator): you step OFF the stairhead into
        // the floor, deliberately away from the reciprocal up-/down-door — a
        // big landing↔return gap is by design here, never a wrong EDGE. Skip.
      } else {
        // (b2) wrong-edge: a reciprocal pair shares ONE seam, so a correct
        // landing arrives where you'd STAND to walk back through the return
        // door — its interior cell (doorCell). Pick the NEAREST zone return-
        // door to this map (by that interior cell), measure the landing to it,
        // and flag when it's farther than the ~1.5-tile budget. We also report
        // the raw zone CENTER distance (the spec's literal phrasing) so the
        // number is transparent. (Prop returns have no zone facing/cell to
        // anchor on — if the ONLY way back is a prop door, we don't measure.)
        const returns = (returnZonesByMap[d.to] ?? []).filter((rd) => rd.to === id);
        if (returns.length > 0) {
          let bestCellDist = Infinity;
          let best = returns[0];
          let bestCellPx: { x: number; y: number } | null = null;
          for (const rd of returns) {
            const cell = doorCell(target.grid, isSolid, rd); // walkable tile inside the return door
            // anchor px: the interior cell's CENTER if we found one, else the
            // zone center (a return door whose mouth is fully walled — rare)
            const ax = cell ? (cell[0] + 0.5) * TILE : zoneCenterPx(rd).cx;
            const ay = cell ? (cell[1] + 0.5) * TILE : zoneCenterPx(rd).cy;
            const dist = Math.hypot(d.tx - ax, d.ty - ay);
            if (dist < bestCellDist) {
              bestCellDist = dist;
              best = rd;
              bestCellPx = { x: ax, y: ay };
            }
          }
          // the matched RETURN door is itself a stairwell/elevator → same logic:
          // the landing sits off the stairhead by design, not on a wrong edge.
          if (!isVertical(best.indicator) && bestCellDist > FAR_FROM_RETURN_PX) {
            const { cx, cy } = zoneCenterPx(best);
            const centerDist = Math.hypot(d.tx - cx, d.ty - cy);
            const cellTxt = bestCellPx ? `, you'd return-stand @px(${bestCellPx.x},${bestCellPx.y})` : '';
            issue.push('farFromReturn');
            detail.push(
              `landing (${d.tx},${d.ty}) is ${bestCellDist.toFixed(1)}px (>${FAR_FROM_RETURN_PX}) from where you'd stand to use the nearest return-door on ${d.to} ` +
                `(zone @tile ${best.x},${best.y} w${best.w}h${best.h}, center ${cx},${cy}=${centerDist.toFixed(1)}px${cellTxt}, facing '${best.facing}') — wrong edge / wrong-way entry`,
            );
          }
        }
      }

      if (issue.length > 0) {
        findings.push({ from: id, to: d.to, kind: d.kind, tx: d.tx, ty: d.ty, lx, ly, char, issue, detail });
      }
    }
  }

  return findings;
}
