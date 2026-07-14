/**
 * Pure field-domain rules for Chapter 8's Mushroomized status. Input devices
 * still share INPUT.dir(); the overworld applies this transform only after that
 * common logical direction has been read. Buttons never enter this module.
 */
import {
  freshMushroomize,
  type MushroomizePhase,
  type MushroomizeRecovery,
  type MushroomizeState,
} from './state';

export const MUSHROOMIZE_TOKEN = 'mushroomize' as const;
export const MUSHROOMIZE_NAME = 'Mushroomized' as const;

export interface DirectionVector {
  x: number;
  y: number;
}

const vector = (x: number, y: number): DirectionVector => ({
  x: x === 0 ? 0 : x,
  y: y === 0 ? 0 : y,
});

const copyRecovery = (recovery: MushroomizeRecovery | null): MushroomizeRecovery | null =>
  recovery ? { ...recovery } : null;

export function transformMushroomizedDirection(
  direction: Readonly<DirectionVector>,
  status: Readonly<MushroomizeState>,
): DirectionVector {
  if (!status.active) return { x: direction.x, y: direction.y };
  switch (status.phase) {
    // Screen-space y grows downward: up (0,-1) clockwise becomes right (1,0).
    case 0: return vector(-direction.y, direction.x);
    case 1: return vector(direction.y, -direction.x);
    case 2: return vector(-direction.x, -direction.y);
  }
}

/** Short alias for the post-INPUT.dir() integration seam. */
export const transformDirection = transformMushroomizedDirection;

export interface MushroomizeExposure {
  phase: MushroomizePhase;
  source: string;
  recovery: MushroomizeRecovery;
}

/** Entering a hazard chooses the phase exactly once. Later overlapping hazard
 * rectangles cannot scramble an already latched status again. */
export function applyMushroomize(
  current: Readonly<MushroomizeState>,
  exposure: Readonly<MushroomizeExposure>,
): MushroomizeState {
  if (current.active) return { ...current, recovery: copyRecovery(current.recovery) };
  return {
    active: true,
    phase: exposure.phase,
    source: exposure.source,
    recovery: { ...exposure.recovery },
  };
}

/** A clean pocket may update the fallback only while controls are normal. */
export function recordMushroomizeRecovery(
  current: Readonly<MushroomizeState>,
  recovery: Readonly<MushroomizeRecovery>,
): MushroomizeState {
  if (current.active) return { ...current, recovery: copyRecovery(current.recovery) };
  return { ...current, recovery: { ...recovery } };
}

export function cureMushroomize(current: Readonly<MushroomizeState>): {
  state: MushroomizeState;
  cured: boolean;
} {
  return {
    state: freshMushroomize(),
    cured: current.active,
  };
}

/** Menu/domain accounting: an item is consumed only when it performed a cure,
 * and only when the catalog's shared consumesOnUse rule says it is one-shot. */
export function resolveMushroomizeCureUse(
  current: Readonly<MushroomizeState>,
  consumes: boolean,
): { state: MushroomizeState; cured: boolean; consumeItem: boolean } {
  const result = cureMushroomize(current);
  return { ...result, consumeItem: result.cured && consumes };
}

/** Defeat recovery needs both the last safe point and the cleared status. */
export function recoverMushroomizedParty(current: Readonly<MushroomizeState>): {
  recovery: MushroomizeRecovery | null;
  state: MushroomizeState;
} {
  return {
    recovery: copyRecovery(current.recovery),
    state: freshMushroomize(),
  };
}
