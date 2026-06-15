/**
 * Ch.1 OPENING — the phase machine.
 *
 * The opening cinematic spans FOUR live maps, and `goThroughDoor`/`cinematicCut`
 * restart the scene between them (Phaser `scene.restart` tears down any running
 * async), so each beat is a flag-gated PHASE re-entered fresh on the next map:
 *
 *   1  hickory_hill  — the meteor falls into the crater (card → descent → impact → card)
 *   2  otterbrook    — the overview opens on {rex}'s house, pans up
 *   3  hickory_hill  — the overview climbs the hill, trail → crater
 *   4  rex_bedroom   — {rex} wakes (the bedroom beat)
 *
 * Flags advance it: `op_fell` after phase 1, `op_house` after phase 2,
 * `intro_done` after phase 4 (which also ends the whole opening). Pure + total so
 * it can be unit-tested without a scene.
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
  if (mapId === 'hickory_hill' && !flags.op_fell && openingRequested) return 1;
  if (mapId === 'otterbrook' && flags.op_fell && !flags.op_house) return 2;
  if (mapId === 'hickory_hill' && flags.op_fell && flags.op_house) return 3;
  if (mapId === 'rex_bedroom' && flags.op_house) return 4;
  return 0;
}
