/**
 * THE HELD BREATH — Jay's Locket-borne rewind (S21, ADR-126; GAME_BIBLE §A4
 * as amended). The Star Locket already records MOMENTS (each Heartlight is
 * 1/10 of the Homesong — a captured instant). Jay learns it records the BREATH
 * around the song: holding the Locket, he can make the world take a breath back
 * and let a friend's CHOICE be re-made. Diegetically tiny (a thumb on a locket),
 * mechanically bounded and costly so the three Axes (src/data/choices.ts) stay
 * weighty:
 *   • finite BREATHS, refuelled only by Mia's high-tier PRAY (faith owns supply);
 *   • a Breath spent LOCKS Puppet (`mindwarp_a`) for the map — bend will OR time;
 *   • every rewind ticks `rewindCount` (the Hush leans in; high counts close the
 *     golden ending — src/engine/ending.ts);
 *   • the TERMINAL Ch.10 song is NOT an anchor (renunciation — the last choice
 *     stands, mirroring Jay's §A6 "refuses to take a will").
 *
 * Snapshots ride the save (`GameStateData.echoes`, v16) as full GS.serialize()
 * blobs taken the instant BEFORE a rewindable decision; rewinding restores one
 * and clears every downstream choice flag (src/engine/echo.ts).
 */
import type { EchoAnchorDef, EchoState } from '../schemas';

/** the Breath bank Jay's Locket can hold (the Breath meter caps here) */
export const MAX_BREATHS = 3;

/** callers ≥ this + the fully-virtuous path + few rewinds ⇒ the golden ending */
export const GOLDEN_CALLER_THRESHOLD = 45;
/** rewinds ≤ this keeps the golden "Long Shot" ending reachable */
export const GOLDEN_REWIND_CAP = 2;

/** a new game / pre-v16 save: a full bank, no snapshots, no rewinds yet */
export function freshEchoes(): EchoState {
  return { stack: [], breaths: MAX_BREATHS, rewindCount: 0 };
}

/**
 * The rewindable choice anchors. The terminal Ch.10 song (`ch10_song`) is
 * deliberately absent — the finale cannot be un-chosen. Keyed by ChoiceId so
 * the validator cross-checks each against a real, NON-terminal choice.
 */
export const ECHO_ANCHORS: Record<string, EchoAnchorDef> = {
  ch6_string: {
    choice: 'ch6_string',
    offerDialogue: 'echo_offer_ch6',
    costDialogue: 'echo_cost_ch6',
  },
  ch9_count: {
    choice: 'ch9_count',
    offerDialogue: 'echo_offer_ch9',
    costDialogue: 'echo_cost_ch9',
  },
};
