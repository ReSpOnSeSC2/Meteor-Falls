import { captionTimelineMs, readableCaptionMs } from './cutscenePacing';

/**
 * Ch.1 OPENING — the phase machine.
 *
 * Otterbrook is now ONE elevated map (town + hill + crater), so the opening is a
 * single continuous cinematic there, NOT a hop across maps. Only the bedroom wake
 * still cuts to its own map:
 *
 *   1  otterbrook   — meteor-fall at the crater
 *   2  otterbrook   — sleeping-house overview and pan to the trail
 *   3  otterbrook   — trail climb to the crater, then the bedroom cut
 *   4  rex_bedroom  — {rex} wakes (the bedroom beat), then back to otterbrook
 *
 * Flags advance it one completed presentation at a time. Phases 1–3 can still
 * run continuously in one scene, but each can resume independently after reload.
 */
export type OpeningPhase = 0 | 1 | 2 | 3 | 4;

export interface OpeningFlags {
  intro_done: boolean;
  op_fell: boolean;
  op_house: boolean;
}

/** The active on-map opening copy. Keeping it beside the phase/route data makes
 * every auto-advanced line subject to the same readability audit. */
export const OPENING_CAPTIONS = {
  establishing: 'Otterbrooke, Ohio. Summer, 1995.',
  falling: 'A wrong star falls over Otterbrooke — too low, too bright, and coming down fast.',
  impact: 'It comes down behind Hickory Hill, and the whole town feels it land.',
  sleepingTown: "Down one of these streets, a kid named {rex} is fast asleep — same as the whole town.",
  hillApproach: "But something came down on the hill tonight, and it's still glowing up there.",
  trailClimb: "The trail climbs Hickory Hill, toward a light that wasn't there yesterday.",
  craterGlow: 'Whatever fell is still up there — still glowing, still warm.',
} as const;

export const OPENING_CAPTION_HOLDS = {
  // The first image is also the player's visual orientation beat, so it gets a
  // longer floor than its short location/date caption alone would require.
  establishing: readableCaptionMs(OPENING_CAPTIONS.establishing, 5_200),
  falling: readableCaptionMs(OPENING_CAPTIONS.falling),
  impact: readableCaptionMs(OPENING_CAPTIONS.impact),
  sleepingTown: readableCaptionMs(OPENING_CAPTIONS.sleepingTown),
  hillApproach: readableCaptionMs(OPENING_CAPTIONS.hillApproach),
  trailClimb: readableCaptionMs(OPENING_CAPTIONS.trailClimb),
  craterGlow: readableCaptionMs(OPENING_CAPTIONS.craterGlow),
} as const;

const BETWEEN_HILL_LINES_MS = 300;

/** One continuous camera route from the sleeping house to the crater. Adjacent
 * legs share both their semantic endpoint and zoom; there is no phase-entry cut. */
export const OPENING_CAMERA = {
  trail: { tx: 56, ty: 44 },
  meteorFallMs: captionTimelineMs(OPENING_CAPTIONS.falling),
  betweenHillLinesMs: BETWEEN_HILL_LINES_MS,
  craterHoldMs: 900,
  houseToTrail: {
    from: 'house',
    to: 'trail',
    fromZoom: 0.9,
    toZoom: 0.84,
    durationMs: captionTimelineMs(OPENING_CAPTIONS.hillApproach),
    cutBefore: false,
  },
  trailToCrater: {
    from: 'trail',
    to: 'crater',
    fromZoom: 0.84,
    toZoom: 0.78,
    durationMs: captionTimelineMs(OPENING_CAPTIONS.trailClimb)
      + BETWEEN_HILL_LINES_MS
      + captionTimelineMs(OPENING_CAPTIONS.craterGlow),
    cutBefore: false,
  },
} as const;

/** Minimal camera surface used by the opening director, kept Phaser-free so the
 * completion/skip invariant can be tested deterministically. */
export interface OpeningCameraPort {
  pan(
    x: number,
    y: number,
    duration?: number,
    ease?: string | Function,
    force?: boolean,
    callback?: (...args: any[]) => void,
  ): unknown;
  zoomTo(zoom: number, duration?: number, ease?: string | Function, force?: boolean): unknown;
}

export function playOpeningCameraLeg(
  camera: OpeningCameraPort,
  x: number,
  y: number,
  ms: number,
  zoom: number,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    camera.pan(x, y, ms, 'Sine.easeInOut', true, (_camera: unknown, progress: number) => {
      if (settled || progress < 1) return;
      settled = true;
      resolve();
    });
    camera.zoomTo(zoom, ms, 'Sine.easeInOut', true);
  });
}

/**
 * Which opening phase (if any) should play on `mapId` given the flags. 0 = none.
 * Save flags, not runtime launch data, own recovery: a direct load of any partial
 * Otterbrooke opening deterministically resumes its next missing presentation.
 */
export function openingPhase(mapId: string, flags: OpeningFlags): OpeningPhase {
  if (flags.intro_done) return 0; // the opening is over forever
  if (mapId === 'otterbrook') {
    if (!flags.op_fell) return 1;
    if (!flags.op_house) return 2;
    return 3;
  }
  if (mapId === 'rex_bedroom' && flags.op_house) return 4;
  return 0;
}
