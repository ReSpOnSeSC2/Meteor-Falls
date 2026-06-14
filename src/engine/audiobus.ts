/**
 * Audio-bus PARAMETERS (ADR-100) — the pure, Web-Audio-free knobs behind the
 * crossfade / muffle / volume-bus work, split out so the numbers and the
 * persistence contract unit-test headlessly (audio.ts itself can't run under
 * vitest's node env — it touches window/AudioContext). audio.ts imports these
 * and wires them onto real nodes.
 */

/**
 * The music MUFFLE veil (#2). A lowpass sits on the MUSIC path (never SFX) and
 * its cutoff lerps DOWN to dampen the track when a menu opens, on pause, or on
 * an indoor map. Three steps:
 *   0 — OPEN: effectively no filtering (above hearing), the normal overworld.
 *   1 — VEIL: highs rolled off — a menu/pause "stepped behind glass" feel.
 *   2 — DEEP: heavily muffled + distant — indoors / under-the-pillow.
 */
export type MuffleLevel = 0 | 1 | 2;

/** Wide-open cutoff (Hz) — past the top of hearing, so level 0 is "filter off". */
export const MUFFLE_OPEN_HZ = 20000;

/** Lowpass cutoff (Hz) for each muffle step. */
export function muffleCutoff(level: MuffleLevel): number {
  switch (level) {
    case 0:
      return MUFFLE_OPEN_HZ;
    case 1:
      return 2200; // a veil — the tune is clearly "behind" the menu
    case 2:
      return 800; // deep/indoor — muffled and far off
  }
}

/** Crossfade length (ms) when one track replaces another (#2) — long enough to
 *  read as a blend, short enough that a snappy room-to-room cut still feels tight. */
export const CROSSFADE_MS = 500;

/** Glide (s) for a muffle cutoff change — quick but not a click. */
export const MUFFLE_GLIDE_S = 0.18;

/** The three mixer buses the player sets a level on (#7). 'master' rides the mute
 *  (mute wins → 0), 'music' feeds the muffle, 'sfx' bypasses it. */
export type AudioBus = 'master' | 'music' | 'sfx';

export const AUDIO_BUSES: readonly AudioBus[] = ['master', 'music', 'sfx'] as const;

/** clamp a level to [0,1]. */
export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Device-local persistence keys per bus — kept SEPARATE from the legacy
 *  'meteor-falls-sound' mute flag, which migrates forward untouched (#7). */
export const BUS_KEYS: Record<AudioBus, string> = {
  master: 'meteor-falls-vol-master',
  music: 'meteor-falls-vol-music',
  sfx: 'meteor-falls-vol-sfx',
};

/** Default level per bus when nothing is persisted yet. */
export const BUS_DEFAULTS: Record<AudioBus, number> = {
  master: 0.9,
  music: 1.0,
  sfx: 0.95,
};

/** Parse a persisted "0".."1" string into a clamped level, or the fallback when
 *  absent/garbage — so a missing key is the default, never a NaN gain. */
export function parseBusLevel(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? clamp01(n) : fallback;
}
