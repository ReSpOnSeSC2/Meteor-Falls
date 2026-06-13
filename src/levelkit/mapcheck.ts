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
