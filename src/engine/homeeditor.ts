/**
 * THE HOME EDITOR (S18 Movement 30, ADR-071) — §A4.14, free-placement furniture.
 * Pure placement logic, no Phaser: the editor SCENE (the ArcadeScene/HoopsScene
 * paused-world precedent) renders the ghost + the catalog; THIS owns the rules —
 * footprints, rotation, overlap, door-reachability, and COZINESS — so every one
 * is unit-testable. The layout serialises to the save's `homeLayouts` (v12) as a
 * plain `Placement[]`; restoring is just reading it back.
 *
 * THE LAW (proven in homeeditor.test): a placement never overlaps another, never
 * blocks the door, and the room stays fully traversable from the door (BFS over
 * floor minus footprints) — so a furnished home can never soft-lock.
 */
import { FURNITURE, type FurnitureDef, type FurnitureFunction } from '../data/furniture';

/** 0,1,2,3 = 0°,90°,180°,270° (90/270 swap w↔h) */
export type Rot = 0 | 1 | 2 | 3;

export interface Placement {
  /** furniture id */
  f: string;
  /** top-left tile of the footprint */
  x: number;
  y: number;
  rot: Rot;
}

/** a room the editor works in: size, the door cell (must stay reachable), and
 *  any built-in solid tiles (walls/fixtures the layout must respect) */
export interface Room {
  w: number;
  h: number;
  door: { x: number; y: number };
  /** built-in solids as "x,y" keys (walls etc.); floor is everything else in-bounds */
  solid: ReadonlySet<string>;
}

const key = (x: number, y: number): string => `${x},${y}`;

/** a piece's footprint size after rotation */
export function footprint(def: FurnitureDef, rot: Rot): { w: number; h: number } {
  return rot % 2 === 0 ? { w: def.w, h: def.h } : { w: def.h, h: def.w };
}

/** the tiles a placement occupies */
export function cells(p: Placement): Array<{ x: number; y: number }> {
  const def = FURNITURE[p.f];
  if (!def) return [];
  const { w, h } = footprint(def, p.rot);
  const out: Array<{ x: number; y: number }> = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push({ x: p.x + dx, y: p.y + dy });
  return out;
}

/** in-bounds + not on a built-in solid + not on the door */
function onFloor(room: Room, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= room.w || y >= room.h) return false;
  if (room.solid.has(key(x, y))) return false;
  return true;
}

/** the set of tiles every placement occupies (for overlap + BFS) */
export function occupied(placements: readonly Placement[]): Set<string> {
  const s = new Set<string>();
  for (const p of placements) for (const c of cells(p)) s.add(key(c.x, c.y));
  return s;
}

/** TRUE if a candidate placement fits: in-bounds floor, no overlap, not the door */
export function canPlace(room: Room, existing: readonly Placement[], cand: Placement): boolean {
  const occ = occupied(existing);
  for (const c of cells(cand)) {
    if (!onFloor(room, c.x, c.y)) return false;
    if (c.x === room.door.x && c.y === room.door.y) return false; // never block the door
    if (occ.has(key(c.x, c.y))) return false;                     // no overlap
  }
  return true;
}

/**
 * The room stays traversable: a flood-fill from the door over FLOOR tiles (minus
 * furniture footprints) must reach every floor tile that isn't furniture. If a
 * placement walls off a pocket, this returns false — the editor refuses it.
 */
export function roomTraversable(room: Room, placements: readonly Placement[]): boolean {
  const occ = occupied(placements);
  const free = (x: number, y: number): boolean => onFloor(room, x, y) && !occ.has(key(x, y));
  // the door tile is the entrance; it must be free to stand on
  if (!free(room.door.x, room.door.y)) return false;
  const seen = new Set<string>([key(room.door.x, room.door.y)]);
  const stack = [room.door];
  while (stack.length) {
    const c = stack.pop() as { x: number; y: number };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      if (free(nx, ny) && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); stack.push({ x: nx, y: ny }); }
    }
  }
  // every free floor tile must have been reached
  for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) {
    if (free(x, y) && !seen.has(key(x, y))) return false;
  }
  return true;
}

/** the full editor commit check: fits AND keeps the room traversable */
export function commitPlace(room: Room, existing: readonly Placement[], cand: Placement): boolean {
  if (!canPlace(room, existing, cand)) return false;
  return roomTraversable(room, [...existing, cand]);
}

/* ─── COZINESS — the Sims-meets-tycoon lever (rest buff + resale) ────────── */

/** distinct functions present (a varied home is cozier than ten lamps) */
function distinctFunctions(placements: readonly Placement[]): Set<FurnitureFunction> {
  const fns = new Set<FurnitureFunction>();
  for (const p of placements) { const d = FURNITURE[p.f]; if (d) fns.add(d.fn); }
  return fns;
}

/**
 * COZINESS (0–100): the sum of placed pieces' points, + a VARIETY bonus per
 * distinct function, + a THEME bonus when a theme is well-represented (≥3 pieces).
 * Feeds the rest buff (a Sunny-Side-lite) AND `property.sellProceeds` (the flip).
 */
export function coziness(placements: readonly Placement[]): number {
  let score = 0;
  const themes = new Map<string, number>();
  for (const p of placements) {
    const d = FURNITURE[p.f];
    if (!d) continue;
    score += d.cozy;
    themes.set(d.theme, (themes.get(d.theme) ?? 0) + 1);
  }
  score += distinctFunctions(placements).size * 2; // variety
  for (const [, n] of themes) if (n >= 3) score += 5; // a coherent theme reads warm
  return Math.max(0, Math.min(100, score));
}

/** the small rest buff (next-battle Sunny-Side-lite) a cozy home grants on sleep */
export function restBuff(placements: readonly Placement[]): number {
  // 0 at coziness 0, up to +3 stages at a fully cozy home
  return Math.min(3, Math.floor(coziness(placements) / 30));
}

/** does the layout include a working function (bed/phone/fridge…)? */
export function hasFunction(placements: readonly Placement[], fn: FurnitureFunction): boolean {
  return placements.some((p) => FURNITURE[p.f]?.fn === fn);
}

/* ─── serialization — the layout IS the save field (plain data) ──────────── */

export function serializeLayout(placements: readonly Placement[]): Placement[] {
  return placements.map((p) => ({ f: p.f, x: p.x, y: p.y, rot: p.rot }));
}

/** read a saved layout back, dropping any piece whose def has since retired */
export function deserializeLayout(raw: readonly Placement[]): Placement[] {
  return raw.filter((p) => FURNITURE[p.f] !== undefined).map((p) => ({ f: p.f, x: p.x, y: p.y, rot: (p.rot % 4) as Rot }));
}
