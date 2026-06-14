/**
 * THE PAPERBOY (S18 Movement 32, ADR-072) — the deterministic route sim (the
 * Arcade/Hoops/Links minigame law: Phaser-free, seeded, inputs in / a score out,
 * same seed + same input tape = same run, forever). PaperboyScene is a renderer
 * over this state.
 *
 * Ride the M26 bicycle down a 3-lane suburban street: throw papers into the
 * mailboxes (lane 0 = left houses, lane 2 = right houses; you ride lane 1-ish),
 * dodge the hazards (a dog, a sprinkler, a parked car, the OPEN car door). Deliver
 * the goal and finish the street to win the prize. Crashing costs the run's pace,
 * never the game — you always reach the end (EarthBound-kind).
 */

export type Lane = 0 | 1 | 2;
export type Hazard = 'dog' | 'sprinkler' | 'car' | 'cardoor';
export type ItemKind = 'mailbox' | Hazard;

export interface RouteItem {
  /** column along the street (0…length-1) */
  x: number;
  lane: Lane;
  kind: ItemKind;
}

export interface PaperboyRoute {
  id: string;
  length: number;
  papers: number;
  deliverGoal: number;
  items: RouteItem[];
}

export interface PaperInput {
  /** the lane to ride into this tick */
  lane: Lane;
  /** throw a paper this tick */
  throw: boolean;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** scoring (canon) */
export const SCORE = {
  deliver: 100,
  perfectBonus: 500, // every house on the route delivered
  hazard: -40,
  miss: -20, // a mailbox you rode past undelivered
} as const;

/**
 * Build a deterministic route: mailboxes on the house lanes (0/2) and a scatter
 * of hazards on all lanes, seeded. `density` (0–1) tunes hazard frequency. The
 * deliver goal is ~80% of the houses (you can drop a few and still win).
 */
export function buildRoute(id: string, seed: number, length = 80, density = 0.25): PaperboyRoute {
  const rng = mulberry32(seed);
  const items: RouteItem[] = [];
  let houses = 0;
  for (let x = 4; x < length - 2; x++) {
    const r = rng();
    if (r < 0.34) {
      const lane: Lane = rng() < 0.5 ? 0 : 2; // a house on one side
      items.push({ x, lane, kind: 'mailbox' });
      houses++;
    } else if (r < 0.34 + density) {
      const lane = Math.floor(rng() * 3) as Lane;
      const kinds: Hazard[] = ['dog', 'sprinkler', 'car', 'cardoor'];
      items.push({ x, lane, kind: kinds[Math.floor(rng() * kinds.length)] });
    }
  }
  const papers = Math.max(1, Math.ceil(houses * 1.1)); // a few spare
  const deliverGoal = Math.max(1, Math.floor(houses * 0.8));
  return { id, length, papers, deliverGoal, items };
}

export interface PaperboyState {
  x: number;
  lane: Lane;
  papers: number;
  delivered: number;
  missed: number;
  hits: number;
  score: number;
  done: boolean;
}

export class PaperboySim {
  readonly route: PaperboyRoute;
  private byCol: Map<number, RouteItem[]> = new Map();
  private houses: number;
  state: PaperboyState;

  constructor(route: PaperboyRoute) {
    this.route = route;
    for (const it of route.items) {
      const arr = this.byCol.get(it.x) ?? [];
      arr.push(it);
      this.byCol.set(it.x, arr);
    }
    this.houses = route.items.filter((i) => i.kind === 'mailbox').length;
    this.state = { x: 0, lane: 1, papers: route.papers, delivered: 0, missed: 0, hits: 0, score: 0, done: false };
  }

  /** advance one column; resolve the deliveries + hazards at the new position */
  step(inp: PaperInput): void {
    const s = this.state;
    if (s.done) return;
    s.lane = inp.lane;
    s.x += 1;
    for (const it of this.byCol.get(s.x) ?? []) {
      if (it.kind === 'mailbox') {
        const adjacent = Math.abs(s.lane - it.lane) <= 1;
        if (inp.throw && adjacent && s.papers > 0) {
          s.papers -= 1;
          s.delivered += 1;
          s.score += SCORE.deliver;
        } else {
          s.missed += 1;
          s.score += SCORE.miss;
        }
      } else if (it.lane === s.lane) {
        // a hazard you rode into
        s.hits += 1;
        s.score += SCORE.hazard;
      }
    }
    if (s.x >= this.route.length - 1) {
      s.done = true;
      if (s.delivered >= this.houses && this.houses > 0) s.score += SCORE.perfectBonus;
      if (s.score < 0) s.score = 0; // EarthBound-kind: a bad run scores 0, never negative
    }
  }

  /** run an input tape to completion (for tests / replays) */
  run(tape: readonly PaperInput[]): PaperboyState {
    for (const inp of tape) { if (this.state.done) break; this.step(inp); }
    // if the tape ran short, coast straight to the end (no throws)
    while (!this.state.done) this.step({ lane: this.state.lane, throw: false });
    return this.state;
  }

  /** the houses on this route (for goal/perfect reads) */
  get houseCount(): number { return this.houses; }
}

/** did this run win the prize? (hit the deliver goal and finished) */
export function prizeEarned(route: PaperboyRoute, state: PaperboyState): boolean {
  return state.done && state.delivered >= route.deliverGoal;
}
