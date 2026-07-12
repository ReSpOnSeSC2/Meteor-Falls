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
 * The sim is grid-discrete (one road tile per step, including true diagonal
 * steps) and capped at `max` vehicles (the object pool); the renderer culls
 * what's off-screen.
 */

/** Clockwise eight-way headings. Keeping them ordered makes turn-distance and
 * route preference deterministic: E, SE, S, SW, W, NW, N, NE. */
export const TRAFFIC_DIR = {
  E: 0,
  SE: 1,
  S: 2,
  SW: 3,
  W: 4,
  NW: 5,
  N: 6,
  NE: 7,
} as const;

export type Dir = (typeof TRAFFIC_DIR)[keyof typeof TRAFFIC_DIR];

const ALL_DIRS: readonly Dir[] = [
  TRAFFIC_DIR.E,
  TRAFFIC_DIR.SE,
  TRAFFIC_DIR.S,
  TRAFFIC_DIR.SW,
  TRAFFIC_DIR.W,
  TRAFFIC_DIR.NW,
  TRAFFIC_DIR.N,
  TRAFFIC_DIR.NE,
];
const CARDINAL_DIRS: readonly Dir[] = [TRAFFIC_DIR.E, TRAFFIC_DIR.S, TRAFFIC_DIR.W, TRAFFIC_DIR.N];
const DX: readonly number[] = [1, 1, 0, -1, -1, -1, 0, 1];
const DY: readonly number[] = [0, 1, 1, 1, 0, -1, -1, -1];
const ROUTE_LOOKAHEAD = 6;

export interface TrafficVector {
  x: number;
  y: number;
}

export interface VehicleRenderPose {
  frame: 0 | 1 | 2;
  flipX: boolean;
  angle: number;
}

/** `R` asphalt, both vertical/horizontal dash cells, and crosswalks all belong
 * to one traffic graph. `_` used to be omitted, punching artificial holes in
 * otherwise continuous east-west streets. */
export function isTrafficRoadChar(ch: string | undefined): boolean {
  return ch === 'R' || ch === 'D' || ch === '_' || ch === 'X';
}

export function trafficDirectionVector(dir: Dir): TrafficVector {
  return { x: DX[dir], y: DY[dir] };
}

/** Constant-speed vehicle intent. Diagonals must not gain √2 speed or acquire
 * any angular/steering component: a held diagonal remains one straight line. */
export function normalizedVehicleVector(vector: TrafficVector): TrafficVector {
  const x = Number.isFinite(vector.x) ? vector.x : 0;
  const y = Number.isFinite(vector.y) ? vector.y : 0;
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

/** Convert an input/facing vector to the nearest exact eight-way heading. */
export function trafficDirFromVector(dx: number, dy: number, fallback: Dir = TRAFFIC_DIR.S): Dir {
  const x = Math.sign(Number.isFinite(dx) ? dx : 0);
  const y = Math.sign(Number.isFinite(dy) ? dy : 0);
  if (x > 0 && y > 0) return TRAFFIC_DIR.SE;
  if (x < 0 && y > 0) return TRAFFIC_DIR.SW;
  if (x < 0 && y < 0) return TRAFFIC_DIR.NW;
  if (x > 0 && y < 0) return TRAFFIC_DIR.NE;
  if (x > 0) return TRAFFIC_DIR.E;
  if (x < 0) return TRAFFIC_DIR.W;
  if (y > 0) return TRAFFIC_DIR.S;
  if (y < 0) return TRAFFIC_DIR.N;
  return fallback;
}

/** Three-view authored cars carry side/front-three-quarter/back-three-quarter
 * art. The diagonal headings therefore select the matching oblique frame and
 * mirror it, rather than rotating a car around its centre. */
export function directionalVehiclePose(dir: Dir): VehicleRenderPose {
  const { x, y } = trafficDirectionVector(dir);
  if (y > 0) return { frame: 1, flipX: x > 0, angle: 0 };
  if (y < 0) return { frame: 2, flipX: x > 0, angle: 0 };
  return { frame: 0, flipX: x > 0, angle: 0 };
}

/** One-view legacy vehicles have no oblique frames, so rotate the side art in
 * 45-degree increments. The source faces west; east is its mirrored form. */
export function legacyVehiclePose(dir: Dir): VehicleRenderPose {
  const { x, y } = trafficDirectionVector(dir);
  if (x > 0) return { frame: 0, flipX: true, angle: y * 45 };
  if (x < 0) return { frame: 0, flipX: false, angle: -y * 45 };
  return { frame: 0, flipX: false, angle: y > 0 ? -90 : 90 };
}

/** Axis-aligned bounds of a long×wide body rotated to `heading`. This is the
 * exact projected AABB for cardinal and 45-degree headings and is shared by
 * traffic, driven cars, and parked cars. */
export function projectedVehicleBounds(long: number, wide: number, heading: TrafficVector): { w: number; h: number } {
  const unit = normalizedVehicleVector(heading);
  const x = unit.x === 0 && unit.y === 0 ? 1 : Math.abs(unit.x);
  const y = Math.abs(unit.y);
  return {
    w: x * long + y * wide,
    h: y * long + x * wide,
  };
}

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
  /** the drivable cells, as "x,y" keys (road 'R'/'D'/'_'/'X' tiles) */
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
    for (const d of CARDINAL_DIRS) {
      const nx = px + DX[d];
      const ny = py + DY[d];
      if (this.isRoad(nx, ny) && !this.occupied(nx, ny, skipId)) n++;
    }
    return n;
  }

  /** Cells swept by a move. Diagonal motion is legal only across a complete
   * 2×2 road corner: destination + both cardinal bridge cells. Those bridge
   * cells are also checked for people, parked cars, and other traffic later,
   * preventing a long sprite from clipping across an occupied corner. */
  private edgeCells(x: number, y: number, dir: Dir): TrafficVector[] | null {
    const dx = DX[dir];
    const dy = DY[dir];
    const target = { x: x + dx, y: y + dy };
    if (!this.isRoad(target.x, target.y)) return null;
    if (dx === 0 || dy === 0) return [target];
    const bridgeX = { x: x + dx, y };
    const bridgeY = { x, y: y + dy };
    if (!this.isRoad(bridgeX.x, bridgeX.y) || !this.isRoad(bridgeY.x, bridgeY.y)) return null;
    return [target, bridgeX, bridgeY];
  }

  /** the directions a vehicle at (x,y) may travel onto an existing road cell */
  private exits(x: number, y: number): Dir[] {
    return ALL_DIRS.filter((dir) => this.edgeCells(x, y, dir) !== null);
  }

  /** Number of same-heading road edges ahead. On a broad diagonal boulevard,
   * NE/SW wins this lookahead; on a straight avenue E/W or N/S wins. */
  private straightRun(x: number, y: number, dir: Dir): number {
    let cx = x;
    let cy = y;
    let run = 0;
    for (; run < ROUTE_LOOKAHEAD; run++) {
      if (!this.edgeCells(cx, cy, dir)) break;
      cx += DX[dir];
      cy += DY[dir];
    }
    return run;
  }

  private turnDistance(a: Dir, b: Dir): number {
    const clockwise = (b - a + 8) % 8;
    return Math.min(clockwise, 8 - clockwise);
  }

  private spawnDirection(x: number, y: number, exits: readonly Dir[]): Dir {
    const bestRun = Math.max(...exits.map((dir) => this.straightRun(x, y, dir)));
    let best = exits.filter((dir) => this.straightRun(x, y, dir) === bestRun);
    // A fully open intersection has equal continuation in every direction;
    // prefer a lane cardinal there instead of cutting across the junction.
    const cardinals = best.filter((dir) => CARDINAL_DIRS.includes(dir));
    if (cardinals.length > 0) best = cardinals;
    return best[Math.floor(this.rand() * best.length)];
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
      const dir = this.spawnDirection(x, y, ex);
      const type = this.types[Math.floor(this.rand() * this.types.length)];
      this.vehicles.push({ id: this.nextId++, type, x, y, dir, px: x, py: y, paused: false });
    }
  }

  /**
   * Advance one tick. `player` is the player's current foot cell. Honours the
   * SAFETY LAW: a vehicle never enters the player's cell and never takes the
   * player's last free lane. Vehicles also never stack (one per cell).
   */
  step(player: { x: number; y: number }, blocked: ReadonlySet<string> = new Set()): void {
    // process in a stable order so the sim is deterministic
    const order = [...this.vehicles].sort((a, b) => a.id - b.id);
    for (const v of order) {
      v.px = v.x;
      v.py = v.y;
      const move = this.chooseMove(v, player, blocked);
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

  /** Pick a safe next cell. Longest forward continuation wins, then the
   * smallest heading change. This follows a slanted boulevard instead of
   * walking its square perimeter; an immediate U-turn remains last resort. */
  private chooseMove(
    v: TrafficVehicle,
    player: { x: number; y: number },
    blocked: ReadonlySet<string>,
  ): { x: number; y: number; dir: Dir } | null {
    const options: Array<{ x: number; y: number; dir: Dir; run: number; turn: number }> = [];
    for (const dir of ALL_DIRS) {
      const edge = this.edgeCells(v.x, v.y, dir);
      if (!edge) continue;
      if (edge.some((cell) => blocked.has(cellKey(cell.x, cell.y)))) continue;
      if (edge.some((cell) => cell.x === player.x && cell.y === player.y)) continue; // SAFETY 1: no crush/sweep
      if (edge.some((cell) => this.occupied(cell.x, cell.y, v.id))) continue;          // no stacking/crossing
      const { x: nx, y: ny } = edge[0];
      // SAFETY 2: if this cell is one of the player's escape lanes, only take it
      // when it is NOT the player's last one (count free neighbours as if we moved).
      const adjToPlayer = Math.abs(nx - player.x) + Math.abs(ny - player.y) === 1;
      if (adjToPlayer) {
        // simulate: would the player still have a free neighbour after we sit on (nx,ny)?
        const free = this.freeNeighboursExcluding(player.x, player.y, v.id, nx, ny, blocked);
        if (free < 1) continue;
      }
      options.push({ x: nx, y: ny, dir, run: this.straightRun(nx, ny, dir), turn: this.turnDistance(v.dir, dir) });
    }
    if (options.length === 0) return null;

    const reverse = ((v.dir + 4) % 8) as Dir;
    let candidates = options.some((option) => option.dir !== reverse)
      ? options.filter((option) => option.dir !== reverse)
      : options;
    // Do not trade a sane forward/45° path for a slightly longer 135° hook.
    // That sharp-hook choice is what made cars orbit six-cell pockets at the
    // seam between a straight avenue and a diagonal boulevard.
    const gentle = candidates.filter((option) => option.turn <= 1);
    if (gentle.length > 0) candidates = gentle;
    else {
      const ordinaryTurn = candidates.filter((option) => option.turn <= 2);
      if (ordinaryTurn.length > 0) candidates = ordinaryTurn;
    }
    const bestRun = Math.max(...candidates.map((option) => option.run));
    candidates = candidates.filter((option) => option.run === bestRun);
    const smallestTurn = Math.min(...candidates.map((option) => option.turn));
    candidates = candidates.filter((option) => option.turn === smallestTurn);
    const pick = candidates.length === 1
      ? candidates[0]
      : candidates[Math.floor(this.rand() * candidates.length)];
    return { x: pick.x, y: pick.y, dir: pick.dir };
  }

  /** free escape lanes for the player if a vehicle (skipId) sat on (bx,by) */
  private freeNeighboursExcluding(
    px: number,
    py: number,
    skipId: number,
    bx: number,
    by: number,
    blocked: ReadonlySet<string>,
  ): number {
    let n = 0;
    for (const d of CARDINAL_DIRS) {
      const nx = px + DX[d];
      const ny = py + DY[d];
      if (!this.isRoad(nx, ny)) continue;
      if (blocked.has(cellKey(nx, ny))) continue;
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
