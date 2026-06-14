/**
 * THE PURSUIT (S19 Movement 41, ADR-082) — the §A6 army chase as a deterministic,
 * tested "heat" model + the set-pieces, pure logic the OverworldScene drives. The
 * EarthBound law: the chase is TENSE but ALWAYS escapable — never a soft-lock.
 *
 *   · HEAT rises when the pursuer sees you and falls when you EVADE. You evade by
 *     DRIVING (always available), REROUTING around a blocker, a remote-driven
 *     DECOY (the Clicker), or DISGUISE (army fatigues at a checkpoint). The base
 *     evade (drive) always nets negative even while seen, so escape is guaranteed.
 *   · THE HELMETED TANK can't be Clickered (the §A4.10 counter) — you ROUTE AROUND
 *     it on the road graph (a BFS) or out-drive it. The safety law from the traffic
 *     sim holds: a pursuer never corner-traps the player (it never takes the last lane).
 *   · THE F-15 FLYOVER is a timed, non-damaging-by-default beat (EarthBound spirit).
 */
import { isHardened } from './control';

/* ─── THE HEAT MODEL ─────────────────────────────────────────────────────── */

export const MAX_HEAT = 100;
/** heat added each step the pursuer has line-of-sight on you */
export const SEEN_GAIN = 8;

/** the evade actions, by how much heat each sheds (drive is always available) */
export type EvadeMove = 'drive' | 'reroute' | 'decoy' | 'disguise' | 'idle';
export const EVADE_DROP: Record<EvadeMove, number> = {
  drive: 12,      // out-run on open road — ALWAYS beats SEEN_GAIN (no soft-lock)
  reroute: 16,    // lose them around a corner / around the helmeted tank
  decoy: 24,      // a remote-driven decoy car pulls the pursuit off you (the Clicker)
  disguise: 40,   // army fatigues — slip a checkpoint as one of the recruits
  idle: 0,        // do nothing — the only way heat ever climbs
};

export interface PursuitState {
  heat: number;
  caught: boolean;
  escaped: boolean;
}

/** a fresh chase at a starting heat (the misread opens it hot) */
export function freshPursuit(startHeat = 60): PursuitState {
  return { heat: Math.max(0, Math.min(MAX_HEAT, startHeat)), caught: false, escaped: false };
}

export interface PursuitStep {
  move: EvadeMove;
  /** is the pursuer in line-of-sight this step? (raises heat by SEEN_GAIN) */
  seen: boolean;
}

/** advance the chase one step: seen raises heat, the evade move sheds it */
export function stepPursuit(state: PursuitState, step: PursuitStep): PursuitState {
  if (state.escaped || state.caught) return state;
  let heat = state.heat;
  if (step.seen) heat += SEEN_GAIN;
  heat -= EVADE_DROP[step.move];
  heat = Math.max(0, Math.min(MAX_HEAT, heat));
  return { heat, caught: heat >= MAX_HEAT, escaped: heat <= 0 };
}

/** what the player can do this step (drives which evade is best) */
export interface EvadeOptions {
  hasFatigues?: boolean;  // can disguise at a checkpoint
  canDecoy?: boolean;     // the Clicker can spin up a decoy here
  blockedByTank?: boolean; // a helmeted tank ahead — reroute around it
}

/** the strongest evade available right now (drive is the always-there fallback) */
export function bestEvade(opts: EvadeOptions = {}): EvadeMove {
  if (opts.hasFatigues) return 'disguise';
  if (opts.canDecoy) return 'decoy';
  if (opts.blockedByTank) return 'reroute';
  return 'drive';
}

/**
 * Drive the chase to escape using the best available evade each step. Returns the
 * step count + whether it escaped — used to PROVE evasion is always possible, even
 * when the pursuer sees you EVERY step (the no-soft-lock guarantee). Bounded so a
 * broken model can never hang the test.
 */
export function escapeRun(
  start: PursuitState, opts: EvadeOptions = {}, seenEveryStep = true, maxSteps = 1000,
): { steps: number; escaped: boolean; finalHeat: number } {
  let s = start;
  let steps = 0;
  while (!s.escaped && !s.caught && steps < maxSteps) {
    s = stepPursuit(s, { move: bestEvade(opts), seen: seenEveryStep });
    steps++;
  }
  return { steps, escaped: s.escaped, finalHeat: s.heat };
}

/* ─── THE HELMETED TANK — route around it on the road graph (a BFS) ───────── */

export interface RoadCell { x: number; y: number; }

/**
 * Can the player still reach the goal with the helmeted tank parked on `blocked`?
 * A 4-neighbour BFS over a road grid (1 = road, 0 = wall), the tank cell removed.
 * A helmeted tank can't be Clickered, but the SAFETY LAW guarantees it never seals
 * the only lane — so a route always exists unless the map itself is a dead end.
 */
export function canRouteAround(
  grid: readonly (readonly number[])[], start: RoadCell, goal: RoadCell, blocked: RoadCell,
): boolean {
  const h = grid.length;
  const w = h > 0 ? grid[0].length : 0;
  const open = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && grid[y][x] === 1 && !(x === blocked.x && y === blocked.y);
  if (!open(start.x, start.y) || !open(goal.x, goal.y)) return false;
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const queue: RoadCell[] = [start];
  while (queue.length) {
    const c = queue.shift() as RoadCell;
    if (c.x === goal.x && c.y === goal.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      const key = `${nx},${ny}`;
      if (open(nx, ny) && !seen.has(key)) { seen.add(key); queue.push({ x: nx, y: ny }); }
    }
  }
  return false;
}

/** a helmeted tank cannot be Clickered out of the way — you go AROUND it */
export function tankBlocksControl(vehicleType: string, shieldDown = false): boolean {
  return isHardened(vehicleType) && !shieldDown;
}

/* ─── THE SAFETY LAW (from the traffic sim) — never corner-trapped ────────── */

/**
 * The pursuer must YIELD before it would take the player's LAST open lane (the
 * traffic safety law applied to the chase): given the player's open-neighbour
 * count, the pursuer may close in only while ≥ 1 lane would remain. Proven so the
 * chase can never dead-end the player against a wall.
 */
export function pursuerKeepsLane(playerOpenLanes: number): boolean {
  return playerOpenLanes >= 1;
}

/* ─── THE F-15 FLYOVER — a timed, non-damaging-by-default set-piece ───────── */

export type FlyoverPhase = 'incoming' | 'overhead' | 'banking' | 'gone';
export interface FlyoverBeat {
  step: number;
  phase: FlyoverPhase;
  /** non-damaging by default (EarthBound spirit) — pure spectacle + window-rattle */
  damaging: boolean;
}

/**
 * The F-15 flyover as a finite, ordered beat sequence over `steps` ticks: it comes
 * in, screams overhead, banks, and is GONE. Non-damaging unless explicitly armed.
 */
export function flyover(steps: number, damaging = false): FlyoverBeat[] {
  const out: FlyoverBeat[] = [];
  const n = Math.max(4, Math.floor(steps));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const phase: FlyoverPhase = t < 0.4 ? 'incoming' : t < 0.6 ? 'overhead' : t < 0.85 ? 'banking' : 'gone';
    out.push({ step: i, phase, damaging });
  }
  return out;
}
