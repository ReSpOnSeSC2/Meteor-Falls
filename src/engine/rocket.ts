/**
 * THE ROCKET (S20 Movement 48, ADR-089) — §A5/§A6 launching The Long Shot between
 * the Mauna Lani pad (Hawaii) and Mars. Pure, tested logic the launch-pad scene
 * drives. Once you own the rocket (earned at the §A6 Ch.10 launch), the route is
 * REPEATABLE — fly to Mars to live, fly home for dinner.
 *
 *   · You must OWN The Long Shot (`title_the_long_shot`).
 *   · The route is the PAD ↔ Mars (Hawaii ↔ Mars) only — you stage from the pad.
 *   · The §A5 EMBER LAW holds: Mars must be VISITED (the story took you there first).
 *   · A launch isn't free — rocket fuel costs, both ways.
 */
import { THE_LONG_SHOT } from '../data/rocket';

export const EARTH_PAD = THE_LONG_SHOT.earthPad; // 'hawaii' (Mauna Lani)
export const MARS = THE_LONG_SHOT.marsPad;       // 'mars'

/** do you own The Long Shot? (the title key-item is present) */
export function ownsRocket(keyItems: readonly string[]): boolean {
  return keyItems.includes(THE_LONG_SHOT.title);
}

export type LaunchReason = 'ok' | 'not_owned' | 'wrong_pads' | 'not_visited';
export interface LaunchCheck {
  ok: boolean;
  reason: LaunchReason;
}

/**
 * Can The Long Shot launch from `from` to `to` right now? It only flies the pad↔
 * Mars route, you must own it, and (Ember law) Mars must be visited.
 */
export function canLaunch(
  from: string, to: string, keyItems: readonly string[], visited: readonly string[],
): LaunchCheck {
  if (!ownsRocket(keyItems)) return { ok: false, reason: 'not_owned' };
  const route = (from === EARTH_PAD && to === MARS) || (from === MARS && to === EARTH_PAD);
  if (!route) return { ok: false, reason: 'wrong_pads' };
  const dest = to;
  if (!visited.includes(dest)) return { ok: false, reason: 'not_visited' };
  return { ok: true, reason: 'ok' };
}

/** the cash a launch burns (rocket fuel) — the same dear bill both directions */
export const LAUNCH_COST = 75_000;
export function launchCost(): number {
  return LAUNCH_COST;
}

/** the destination of a launch from `from` (the pad goes to Mars, Mars comes home) */
export function launchDestination(from: string): string | null {
  if (from === EARTH_PAD) return MARS;
  if (from === MARS) return EARTH_PAD;
  return null;
}
