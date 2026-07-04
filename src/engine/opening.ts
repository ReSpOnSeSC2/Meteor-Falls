/**
 * Ch.1 OPENING — the phase machine.
 *
 * Otterbrook is now ONE elevated map (town + hill + crater), so the opening is a
 * single continuous cinematic there, NOT a hop across maps. Only the bedroom wake
 * still cuts to its own map:
 *
 *   1  otterbrook   — meteor-fall at the crater → house pan → hill climb (all inline)
 *   4  rex_bedroom  — {rex} wakes (the bedroom beat), then back to otterbrook
 *
 * Flags advance it: `op_fell` + `op_house` are set WITHIN the phase-1 sequence,
 * `intro_done` after phase 4 (which ends the whole opening). Pure + total so it can
 * be unit-tested without a scene.
 */
export type OpeningPhase = 0 | 1 | 2 | 3 | 4;

export interface OpeningFlags {
  intro_done: boolean;
  op_fell: boolean;
  op_house: boolean;
}

/**
 * Which opening phase (if any) should play on `mapId` given the flags. 0 = none.
 * `openingRequested` (the new-game data flag, true only on the very first entry)
 * guards phase 1 so re-visiting the hill mid-cinematic can't re-trigger the fall.
 */
export function openingPhase(mapId: string, flags: OpeningFlags, openingRequested: boolean): OpeningPhase {
  if (flags.intro_done) return 0; // the opening is over forever
  // ONE continuous cinematic on otterbrook now (the elevated map holds the crater, {rex}'s
  // house, and the climb — no map transitions). Phase 1 plays meteor-fall → house pan → hill
  // climb INLINE, setting op_fell then op_house along the way, then cuts to rex_bedroom for
  // the wake (phase 4). Phases 2 & 3 are folded into phase 1 and no longer dispatched here.
  if (mapId === 'otterbrook' && !flags.op_fell && openingRequested) return 1;
  if (mapId === 'rex_bedroom' && flags.op_house) return 4;
  return 0;
}
