/**
 * THE PAPERBOY (S18 Movement 32, ADR-073) — the route config + the prize. The sim
 * lives in `src/paperboy/sim.ts`; PaperboyScene renders it (the Arcade/Hoops/Links
 * sub-scene precedent), reachable from a paper-stand prop in Otterbrook/Brickton,
 * non-missable. The PRIZE is a finale CALLER + a flag (the paper-route tie-in, Mr.
 * Plummer / quest #2); the §A8 charm pour rides the right manifest in a follow-up.
 */
import { buildRoute, type PaperboyRoute } from '../paperboy/sim';

export interface PaperboyConfig {
  /** the seed the live route is built from (deterministic, replayable) */
  seed: number;
  length: number;
  density: number;
  prize: {
    /** the save flag set on a winning run */
    flag: string;
    /** the finale caller this win earns (the §A6 PRAY payoff) */
    caller: string;
    name: string;
    note: string;
  };
}

export const PAPERBOY: PaperboyConfig = {
  seed: 1995,
  length: 84,
  density: 0.25,
  prize: {
    flag: 'paperboy_won',
    caller: 'mr_plummer',
    name: 'Steady Hands Charm',
    note: "Mr. Plummer's old route badge. \"Forty years, never missed a porch.\" Steadies your throw — and your nerves.",
  },
};

/** the live route the scene plays (built once, deterministically) */
export function liveRoute(): PaperboyRoute {
  return buildRoute('otterbrook_route', PAPERBOY.seed, PAPERBOY.length, PAPERBOY.density);
}
