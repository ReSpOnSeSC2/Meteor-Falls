/**
 * AMBIENT BEDS (Wave 2, ADR-108) — the pure registry of map ambience layers (#16).
 *
 * EarthBound rooms have a FLOOR of sound under the tune: rain on the glass, a moor
 * wind, the wash of surf, a server room's hum. THE AMBIENT BED is a low, looping
 * texture layered UNDER the music (never replacing it): a map declares `ambience`
 * (src/schemas MapDef) and OverworldScene starts/crossfades the bed on load (the
 * playback lands in Wave 3, riding the ADR-100 mixer's music path so the §A4 volume
 * sliders and the muffle veil cover it too).
 *
 * This file is the pure SPEC only — the numbers a synth bed is built from, split out
 * exactly like audiobus.ts so it unit-tests headlessly (audio.ts itself can't run
 * under vitest's node env — it touches window/AudioContext). Each bed is a filtered
 * NOISE source (the existing WebAudio synth's `noise()` primitive) with an optional
 * slow sway on its cutoff for living gusts/wave-sets; Wave 3 wires these onto real
 * nodes. No Phaser, no Date.now/Math.random (Prime Law 2) — deterministic data.
 *
 * The id union is owned by src/schemas (AMBIENCE_IDS) so map authoring type-checks
 * against it; AMBIENCE is `Record<AmbienceId, …>`, so the compiler pins this registry
 * to EXACTLY those ids, and tools/content-validate.ts pins the two equal both ways.
 */
import type { AmbienceId } from '../schemas';

/** the noise colour a bed is built from — the timbre of its floor (the WebAudio
 *  `noise()` synth can shape any of these via its lowpass). */
export type NoiseColor = 'white' | 'pink' | 'brown';

export const NOISE_COLORS: readonly NoiseColor[] = ['white', 'pink', 'brown'] as const;

/** an optional slow drift on the bed's cutoff — a moor wind GUSTS, wave SETS roll in.
 *  `depth` is how far the cutoff swings (Hz), `rate` the seconds for one full breath. */
export interface AmbienceSway {
  depth: number;
  rate: number;
}

/** one ambient bed: a filtered noise floor + an optional cutoff sway. */
export interface AmbienceBed {
  /** the schema id this bed answers to (pinned equal to AMBIENCE_IDS). */
  id: AmbienceId;
  /** a short human label (dev tooling / a future SETUP ambience preview). */
  label: string;
  /** the noise colour the bed is built from. */
  base: NoiseColor;
  /** lowpass cutoff (Hz) shaping the floor — low reads distant/dark, high reads near. */
  cutoff: number;
  /** steady level UNDER the music (0..1) — a bed, never the foreground. */
  gain: number;
  /** an optional slow sway on `cutoff` for a living gust/swell. */
  sway?: AmbienceSway;
}

/**
 * THE BEDS. Gains are deliberately low — a floor beneath the music, not a competitor.
 * `river` is reserved vocabulary (the Long Walk's brook + future stream maps) and is
 * intentionally unreferenced by a map today; the rest are wired in maps.ts (#16).
 */
export const AMBIENCE: Record<AmbienceId, AmbienceBed> = {
  rain: { id: 'rain', label: 'Steady rain', base: 'white', cutoff: 4200, gain: 0.14, sway: { depth: 600, rate: 5.0 } },
  wind: { id: 'wind', label: 'Moor wind', base: 'pink', cutoff: 1100, gain: 0.12, sway: { depth: 700, rate: 6.5 } },
  waves: { id: 'waves', label: 'Sea waves', base: 'brown', cutoff: 900, gain: 0.16, sway: { depth: 520, rate: 7.5 } },
  river: { id: 'river', label: 'River babble', base: 'white', cutoff: 5200, gain: 0.11, sway: { depth: 900, rate: 3.5 } },
  crowd: { id: 'crowd', label: 'Town murmur', base: 'pink', cutoff: 1600, gain: 0.1, sway: { depth: 400, rate: 4.5 } },
  machine: { id: 'machine', label: 'Mainframe hum', base: 'brown', cutoff: 700, gain: 0.13 },
  birds: { id: 'birds', label: 'Woodland birdsong', base: 'white', cutoff: 6500, gain: 0.09, sway: { depth: 1200, rate: 2.5 } },
  cave: { id: 'cave', label: 'Dripping cave', base: 'brown', cutoff: 600, gain: 0.1 },
};

/** the bed ids, in registry order — the validator pins this equal to AMBIENCE_IDS. */
export const AMBIENCE_BEDS = Object.keys(AMBIENCE) as AmbienceId[];

/** look a bed up by id (the consumer in Wave 3 uses this). */
export function ambienceBed(id: AmbienceId): AmbienceBed {
  return AMBIENCE[id];
}
