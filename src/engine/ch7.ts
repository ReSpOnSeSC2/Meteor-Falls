/**
 * Chapter 7 story-state helpers.  The Star Locket remains a permanent shared
 * key item; the Night Train heist changes only its temporary availability.
 * Keeping this check Phaser-free gives menus, battle, rewind, migrations, and
 * tests one contract instead of each interpreting the theft flags differently.
 */
import type { GameStateData } from './state';

export const STAR_LOCKET_ID = 'star_locket';

export type LocketState = Pick<GameStateData, 'keyItems' | 'flags'>;

export function ownsStarLocket(state: LocketState): boolean {
  return state.keyItems.includes(STAR_LOCKET_ID);
}

/**
 * A recovered flag wins over a stale stolen flag.  Normal runtime recovery
 * clears `ch7_locket_stolen`, while this precedence also makes old/interrupted
 * saves recoverable rather than permanently disabling the Locket.
 */
export function locketAvailable(state: LocketState): boolean {
  if (!ownsStarLocket(state)) return false;
  if (state.flags.ch7_locket_recovered === true) return true;
  return state.flags.ch7_locket_stolen !== true;
}

export function locketTemporarilyStolen(state: LocketState): boolean {
  return ownsStarLocket(state)
    && state.flags.ch7_locket_stolen === true
    && state.flags.ch7_locket_recovered !== true;
}

/** Native (unscaled) door coordinates; goThroughDoor applies runtime scale. */
export function chapter7DoorLanding(point: { x: number; y: number }): { x: number; y: number } {
  return { x: point.x * 16 + 8, y: point.y * 16 + 12 };
}
