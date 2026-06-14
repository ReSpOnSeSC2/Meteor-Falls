/**
 * DISGUISE RULES (S18 Movement 31, ADR-072) — §A6 sneaks, pure logic. Whether a
 * costume blends you past a faction, and the "made" check (a deterministic roll vs.
 * an NPC's alertness). Getting made is ALWAYS a fight, never a fail.
 */
import { DISGUISES, type DisguiseDef } from '../data/disguise';

/** does this disguise blend you into `faction`? */
export function blendsWith(disguiseId: string | null, faction: string): boolean {
  if (!disguiseId) return false;
  return DISGUISES[disguiseId]?.blendTag === faction;
}

/**
 * The chance an NPC sees through the costume this encounter: the NPC's alertness
 * (0–1) minus the disguise quality, floored at 0. A wrong-faction disguise (or
 * none) never blends, so it's always "made" against that faction's checkers.
 */
export function madeChance(disguiseId: string | null, faction: string, alertness: number): number {
  if (!blendsWith(disguiseId, faction)) return 1;
  const q = DISGUISES[disguiseId as string].quality;
  return Math.max(0, Math.min(1, alertness - q));
}

/** deterministic "made?" check — a roll in [0,1) under the chance is a blown cover */
export function isMade(disguiseId: string | null, faction: string, alertness: number, roll: number): boolean {
  return roll < madeChance(disguiseId, faction, alertness);
}

/** what happens when you're spotted: a fight, NEVER a fail (the EB law) */
export function onSpotted(): 'fight' {
  return 'fight';
}

/** the disguises available in a band (the sneak's wardrobe) */
export function disguisesForBand(band: string): DisguiseDef[] {
  return Object.values(DISGUISES).filter((d) => d.band === band);
}
