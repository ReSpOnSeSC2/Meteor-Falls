/**
 * THE TRAFFIC SYSTEM (S18 Movement 26, ADR-067) — deterministic, seeded vehicle
 * movement over a map's road graph: the living-world ambiance the control system
 * (M27) later borrows. Pure logic, no Phaser, no Math.random / Date.now (Prime
 * Law 2) — the OverworldScene interpolates pixel positions between ticks and pools
 * the sprites; this module owns the WHERE and the SAFETY.
 *
 * THE SAFETY LAW (M26, non-negotiable): a moving vehicle may NEVER crush the
 * player or seal the player's last lane. Two guarantees, proven in traffic.test:
 *   1. NO CRUSH — a vehicle never enters the player's cell.
 *   2. NO CORNER-TRAP — a vehicle never takes the player's LAST free walkable
 *      neighbour; the player always has at least one road cell to step to.
 * When a vehicle can't move safely it YIELDS (pauses) or turns at an
 * intersection; it never forces the unsafe move.
 *
 * The sim is grid-discrete (one road tile per step) and capped at `max` vehicles
 * (the object pool); the renderer culls what's off-screen.
 */

export type Dir = 0 | 1 | 2 | 3; // E, S, W, N
const DX: readonly number[] = [1, 0, -1, 0];
const DY: readonly number[] = [0, 1, 0, -1];

export interface TrafficVehicle {
  id: number;
  type: string;
  x: number;
  y: number;
  dir: Dir;
  /** previous cell — the renderer lerps (x,y) from here for smooth motion */
  px: number;
  py: number;
  /** yielded this tick (held by the player / another car / a dead end) */
  paused: boolean;
}

export interface TrafficOpts {
  /** the drivable cells, as "x,y" keys (road 'R'/'D'/'X' tiles) */
  roads: ReadonlySet<string>;
  /** deterministic seed (same seed → same traffic, byte-for-byte) */
  seed: number;
  /** the object-pool cap (≈ the busiest the street ever gets) */
  max: number;
  /** the vehicle types ambient traffic may spawn (road types only) */
  types: readonly string[];
}

export const cellKey = (x: number, y: number): string => `${x},${y}`;

/** mulberry32, inlined so the sim has zero imports (Prime Law 2 determinism) */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class TrafficSim {
  readonly roads: ReadonlySet<string>;
  readonly max: number;
  private readonly types: readonly string[];
  private readonly rand: () => number;
  private readonly cells: string[];
  private nextId = 1;
  vehicles: TrafficVehicle[] = [];

  constructor(opts: TrafficOpts) {
    this.roads = opts.roads;
    this.max = opts.max;
    this.types = opts.types.length ? opts.types : ['sedan'];
    this.rand = rng(opts.seed);
    this.cells = [...opts.roads];
  }

  private isRoad(x: number, y: number): boolean {
    return this.roads.has(cellKey(x, y));
  }

  private occupied(x: number, y: number, skipId = -1): boolean {
    return this.vehicles.some((v) => v.id !== skipId && v.x === x && v.y === y);
  }

  /** the player's walkable neighbours that no vehicle sits on (their escape lanes) */
  private freeNeighbours(px: number, py: number, skipId = -1): number {
    let n = 0;
    for (let d = 0; d < 4; d++) {
      const nx = px + DX[d];
      const ny = py + DY[d];
      if (this.isRoad(nx, ny) && !this.occupied(nx, ny, skipId)) n++;
    }
    return n;
  }

  /** the directions a vehicle at (x,y) may travel onto an existing road cell */
  private exits(x: number, y: number): Dir[] {
    const out: Dir[] = [];
    for (let d = 0; d < 4; d++) if (this.isRoad(x + DX[d], y + DY[d])) out.push(d as Dir);
    return out;
  }

  /** fill the pool up to `max`, deterministically, on free road cells */
  spawn(): void {
    let guard = this.cells.length * 2;
    while (this.vehicles.length < this.max && guard-- > 0) {
      const c = this.cells[Math.floor(this.rand() * this.cells.length)];
      const [x, y] = c.split(',').map(Number);
      if (this.occupied(x, y)) continue;
      const ex = this.exits(x, y);
      if (ex.length === 0) continue;
      const dir = ex[Math.floor(this.rand() * ex.length)];
      const type = this.types[Math.floor(this.rand() * this.types.length)];
      this.vehicles.push({ id: this.nextId++, type, x, y, dir, px: x, py: y, paused: false });
    }
  }

  /**
   * Advance one tick. `player` is the player's current foot cell. Honours the
   * SAFETY LAW: a vehicle never enters the player's cell and never takes the
   * player's last free lane. Vehicles also never stack (one per cell).
   */
  step(player: { x: number; y: number }): void {
    // process in a stable order so the sim is deterministic
    const order = [...this.vehicles].sort((a, b) => a.id - b.id);
    for (const v of order) {
      v.px = v.x;
      v.py = v.y;
      const move = this.chooseMove(v, player);
      if (move === null) {
        v.paused = true;
        continue;
      }
      v.dir = move.dir;
      v.x = move.x;
      v.y = move.y;
      v.paused = false;
    }
  }

  /** pick a safe next cell, preferring straight-ahead, then turns; null = yield */
  private chooseMove(
    v: TrafficVehicle,
    player: { x: number; y: number },
  ): { x: number; y: number; dir: Dir } | null {
    // straight ahead first, then right, left (never an immediate U-turn)
    const order: Dir[] = [v.dir, ((v.dir + 1) % 4) as Dir, ((v.dir + 3) % 4) as Dir, ((v.dir + 2) % 4) as Dir];
    for (const d of order) {
      const nx = v.x + DX[d];
      const ny = v.y + DY[d];
      if (!this.isRoad(nx, ny)) continue;
      if (nx === player.x && ny === player.y) continue;       // SAFETY 1: no crush
      if (this.occupied(nx, ny, v.id)) continue;              // no stacking
      // SAFETY 2: if this cell is one of the player's escape lanes, only take it
      // when it is NOT the player's last one (count free neighbours as if we moved).
      const adjToPlayer = Math.abs(nx - player.x) + Math.abs(ny - player.y) === 1;
      if (adjToPlayer) {
        // simulate: would the player still have a free neighbour after we sit on (nx,ny)?
        const free = this.freeNeighboursExcluding(player.x, player.y, v.id, nx, ny);
        if (free < 1) continue;
      }
      return { x: nx, y: ny, dir: d };
    }
    return null;
  }

  /** free escape lanes for the player if a vehicle (skipId) sat on (bx,by) */
  private freeNeighboursExcluding(
    px: number,
    py: number,
    skipId: number,
    bx: number,
    by: number,
  ): number {
    let n = 0;
    for (let d = 0; d < 4; d++) {
      const nx = px + DX[d];
      const ny = py + DY[d];
      if (!this.isRoad(nx, ny)) continue;
      if (nx === bx && ny === by) continue;                 // the cell we'd occupy
      if (this.occupied(nx, ny, skipId)) continue;
      n++;
    }
    return n;
  }

  /** the current count of the player's free escape lanes (for tests / HUD) */
  playerLanes(px: number, py: number): number {
    return this.freeNeighbours(px, py);
  }
}
