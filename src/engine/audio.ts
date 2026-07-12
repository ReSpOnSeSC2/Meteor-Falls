/**
 * WebAudio synth: SFX presets + a pattern sequencer (ADR-006).
 * Phase 8 swaps the voices for rendered stems behind this same API.
 *
 * THE MIXER (ADR-100). The signal graph is now a small console rather than two
 * bare gains:
 *
 *   voice.gain (crossfade 0..1) ─┐
 *   voice.gain (crossfade 0..1) ─┴→ musicBus (music vol) → musicMuffle (lowpass
 *                                     veil) → master (master vol × mute) → dest
 *   tone()/noise() ────────────────→ sfxBus  (sfx vol) ───────────────→ master
 *
 * playMusic() CROSSFADES (ramps the outgoing track to 0 while the incoming rides
 * up) instead of hard-cutting; a menu/pause/indoor map MUFFLES the music path
 * (setMusicMuffle); the player sets per-bus volumes (setBus); and battle slow-mo
 * can BEND the synth (setMusicDetune). SFX deliberately bypass the muffle.
 */
import {
  AudioBus,
  BUS_DEFAULTS,
  BUS_KEYS,
  CROSSFADE_MS,
  MUFFLE_GLIDE_S,
  MuffleLevel,
  clamp01,
  muffleCutoff,
  parseBusLevel,
} from './audiobus';
import { AMBIENCE } from './ambience';
import type { AmbienceId } from '../schemas';

type Wave = OscillatorType | 'noise';

interface Channel {
  wave: Wave;
  vol: number;
  /** note per step: 'C4' | null (rest) | '-' (tie/hold previous) */
  notes: (string | null)[];
  decay?: number; // seconds, default step length
  detune?: number;
}

interface Track {
  bpm: number;
  swing?: number; // 0..0.5 fraction of a step
  loop: boolean;
  channels: Channel[];
}

/** one playing track instance (ADR-100). Each has its OWN crossfade gain + its
 *  own scheduler clock so two can overlap during a crossfade. `held` carries the
 *  per-channel sustaining oscillator + its base detune (so a global slow-mo bend
 *  rides on top of the channel's own detune). `live` gates the tick after dispose. */
interface MusicVoice {
  name: string;
  gain: GainNode;
  timer: number | null;
  step: number;
  nextTime: number;
  stems: number;
  held: Record<number, { osc: OscillatorNode; gain: GainNode; base: number } | undefined>;
  live: boolean;
}

interface AmbienceVoice {
  id: AmbienceId;
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo: OscillatorNode | null;
  lfoGain: GainNode | null;
}

const NOTE_OFFSET: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function freqOf(note: string): number {
  // e.g. 'C4', 'F#3', 'Bb2'
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) return 440;
  let midi = NOTE_OFFSET[m[1]] + (m[3].charCodeAt(0) - 48 + 1) * 12;
  if (m[2] === '#') midi += 1;
  if (m[2] === 'b') midi -= 1;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/* ------------------------------------------------------------------ */
/* Tracks — canon briefs from GAME_BIBLE §B3 / Prompt 40, slice set    */

const TRACKS: Record<string, Track> = {
  // Title: wonder, distant choir pad
  title: {
    bpm: 60,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.16,
        notes: ['C3', '-', '-', '-', 'A2', '-', '-', '-', 'F2', '-', '-', '-', 'G2', '-', '-', '-'],
      },
      {
        wave: 'sine',
        vol: 0.12,
        notes: ['E4', '-', 'G4', '-', 'C5', '-', 'E4', '-', 'A4', '-', 'C5', '-', 'B4', '-', 'G4', '-'],
      },
      {
        wave: 'sine',
        vol: 0.05,
        detune: 7,
        notes: ['G5', null, null, null, null, null, 'E5', null, null, null, 'C6', null, null, null, null, null],
      },
    ],
  },
  // Otterbrook daytime: lazy I-IV shuffle, slap-ish bass (à la Onett)
  otterbrook: {
    bpm: 96,
    swing: 0.18,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.2,
        notes: ['F2', null, 'F2', 'C3', 'Bb2', null, 'Bb2', 'C3', 'F2', null, 'A2', 'C3', 'Bb2', 'C3', 'Bb2', 'G2'],
      },
      {
        wave: 'square',
        vol: 0.07,
        notes: ['A4', null, 'C5', null, 'D5', 'C5', null, 'A4', null, 'F4', 'G4', 'A4', null, 'G4', 'F4', null],
      },
      {
        wave: 'noise',
        vol: 0.025,
        notes: ['C5', null, 'C5', null, 'C5', null, 'C5', 'C5', 'C5', null, 'C5', null, 'C5', null, 'C5', 'C5'],
      },
    ],
  },
  // Hickory Hill at 2 AM: sparse minor amble + cricket blips
  hill: {
    bpm: 84,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.18,
        notes: ['D2', null, null, 'D3', null, null, 'F2', null, 'A2', null, null, 'G2', null, null, 'C3', null],
      },
      {
        wave: 'square',
        vol: 0.05,
        notes: ['D5', null, null, null, 'F5', null, 'E5', null, null, 'A4', null, null, 'C5', null, 'D5', null],
      },
      {
        wave: 'sine',
        vol: 0.04,
        notes: [null, null, 'A6', null, null, null, null, 'A6', null, null, null, 'A6', null, null, null, null],
      },
    ],
  },
  // home interior: cozy
  home: {
    bpm: 80,
    swing: 0.12,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.16,
        notes: ['C3', null, 'G2', null, 'A2', null, 'E2', null, 'F2', null, 'C3', null, 'G2', null, 'C3', null],
      },
      {
        wave: 'sine',
        vol: 0.09,
        notes: ['E4', 'G4', '-', 'C5', '-', null, 'B4', 'A4', '-', null, 'F4', 'A4', '-', 'G4', '-', null],
      },
    ],
  },
  // Battle: driving swing (the §B3 brief says 140)
  battle: {
    bpm: 140,
    swing: 0.16,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.22,
        notes: ['A2', 'A2', 'C3', 'A2', 'D3', 'A2', 'C3', 'A2', 'G2', 'G2', 'B2', 'G2', 'C3', 'G2', 'E3', 'D3'],
      },
      {
        wave: 'square',
        vol: 0.08,
        notes: ['A4', null, 'C5', 'E5', null, 'E5', 'D5', 'C5', null, 'B4', null, 'D5', 'C5', null, 'A4', null],
      },
      {
        wave: 'noise',
        vol: 0.035,
        notes: ['C5', null, 'C5', 'C5', 'C5', null, 'C5', null, 'C5', null, 'C5', 'C5', 'C5', null, 'C5', 'C5'],
      },
    ],
  },
  // Boss: asymmetric sneer
  boss: {
    bpm: 132,
    loop: true,
    channels: [
      {
        wave: 'sawtooth',
        vol: 0.12,
        notes: ['E2', 'E2', null, 'E2', 'G2', null, 'E2', 'Bb2', 'A2', null, 'E2', 'E2', null, 'C3', 'B2', null],
      },
      {
        wave: 'square',
        vol: 0.07,
        notes: ['E5', null, 'E5', 'F5', null, null, 'E5', null, null, 'Bb4', null, 'B4', null, 'C5', null, null],
      },
      {
        wave: 'noise',
        vol: 0.04,
        notes: ['C5', 'C5', null, 'C5', 'C5', null, 'C5', null, 'C5', 'C5', null, 'C5', 'C5', null, 'C5', null],
      },
    ],
  },
  victory: {
    bpm: 150,
    loop: false,
    channels: [
      {
        wave: 'square',
        vol: 0.1,
        notes: ['C5', 'C5', 'C5', 'E5', 'G5', '-', 'E5', 'G5', '-', '-', null, null, null, null, null, null],
      },
      {
        wave: 'triangle',
        vol: 0.16,
        notes: ['C3', null, 'E3', null, 'G3', '-', 'C3', 'G3', '-', '-', null, null, null, null, null, null],
      },
    ],
  },
  levelup: {
    bpm: 160,
    loop: false,
    channels: [
      {
        wave: 'square',
        vol: 0.1,
        notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'G5', '-', null, null, null, null, null, null, null, null],
      },
    ],
  },
  // Brickton City: confident downtown strut, walking bass (à la Fourside's kid sibling)
  brickton: {
    bpm: 112,
    swing: 0.14,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.2,
        notes: ['C2', null, 'E2', 'G2', 'A2', null, 'B2', null, 'C3', null, 'A2', 'G2', 'F2', 'G2', 'G2', null],
      },
      {
        wave: 'square',
        vol: 0.07,
        notes: ['E4', 'G4', null, 'C5', null, 'B4', 'A4', null, 'G4', null, 'E4', null, 'D4', 'E4', null, null],
      },
      {
        wave: 'noise',
        vol: 0.03,
        notes: ['C5', null, 'C5', 'C5', 'C5', null, 'C5', null, 'C5', null, 'C5', 'C5', 'C5', null, 'C5', null],
      },
    ],
  },
  // Department of Smiles: rigid corporate music-box, major key with a worm in it.
  // No swing. The Smiles do not swing.
  department: {
    bpm: 96,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.16,
        notes: ['C3', null, 'C3', null, 'G2', null, 'G2', null, 'C3', null, 'C3', null, 'Ab2', null, 'G2', null],
      },
      {
        wave: 'square',
        vol: 0.06,
        notes: ['C5', null, 'E5', null, 'G5', null, 'E5', null, 'C5', null, 'F5', 'E5', null, 'Bb4', 'B4', null],
      },
      {
        wave: 'sine',
        vol: 0.035,
        detune: 4,
        notes: ['E6', null, null, null, null, null, null, null, 'E6', null, null, null, null, null, 'Eb6', null],
      },
    ],
  },
  // STARPORT arcades (S10): hammering chip loop — the cabinet wants quarters
  // it will never charge. A minor, square-on-square, hi-hat sixteenths.
  arcade: {
    bpm: 150,
    loop: true,
    channels: [
      {
        wave: 'square',
        vol: 0.13,
        notes: ['A2', 'A2', 'E3', 'A2', 'G2', 'G2', 'D3', 'G2', 'F2', 'F2', 'C3', 'F2', 'E2', 'E2', 'B2', 'E2'],
      },
      {
        wave: 'square',
        vol: 0.06,
        notes: ['A4', 'C5', 'E5', 'C5', 'B4', 'D5', 'G4', 'B4', 'A4', 'C5', 'F4', 'A4', 'E4', 'G4', 'B4', 'E5'],
      },
      {
        wave: 'sine',
        vol: 0.05,
        detune: 5,
        notes: ['A5', null, null, 'E5', null, null, 'A5', null, 'G5', null, null, 'D5', null, 'E5', null, null],
      },
      {
        wave: 'noise',
        vol: 0.02,
        notes: ['C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5', 'C5'],
      },
    ],
  },
  // THE CAGE (S12): boom-bap streetball strut — swung E-minor bass, a horn
  // stab answering on the off-beats, chain-link hat. 1995 had a soundtrack.
  cage: {
    bpm: 96,
    swing: 0.3,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.18,
        notes: ['E2', null, 'E2', 'G2', null, 'E2', null, 'A2', 'A2', null, 'G2', null, 'B2', null, 'D3', 'B2'],
      },
      {
        wave: 'square',
        vol: 0.07,
        notes: [null, null, 'E4', null, null, 'G4', null, null, null, 'A4', null, 'G4', null, null, 'B4', null],
      },
      {
        wave: 'sine',
        vol: 0.06,
        detune: 4,
        notes: ['E5', null, null, null, null, null, 'D5', null, null, null, 'E5', null, null, 'G5', null, null],
      },
      {
        wave: 'noise',
        vol: 0.022,
        notes: ['C5', null, 'C5', 'C5', null, 'C5', 'C5', null, 'C5', null, 'C5', 'C5', null, 'C5', 'C5', 'C5'],
      },
    ],
  },
  // the 6:15: a friendly diesel roll, somewhere between home and everything else
  bus: {
    bpm: 100,
    swing: 0.2,
    loop: true,
    channels: [
      {
        wave: 'triangle',
        vol: 0.18,
        notes: ['F2', null, 'C3', null, 'F2', null, 'C3', 'C3', 'Bb2', null, 'F2', null, 'C3', null, 'D3', null],
      },
      {
        wave: 'sine',
        vol: 0.09,
        notes: ['A4', '-', 'C5', '-', 'F4', '-', null, 'A4', 'G4', '-', 'F4', '-', 'G4', '-', null, null],
      },
      {
        wave: 'noise',
        vol: 0.02,
        notes: ['C5', null, null, null, 'C5', null, null, null, 'C5', null, null, null, 'C5', null, null, null],
      },
    ],
  },
  // S14 Ch.2 — the crossing rolls, the port grins, the jungle counts itself
  // in, the valley worries in 3/4, the pyramid holds its breath (ADR-006
  // interim synth; Phase 8 swaps voices behind the same API)
  boat: {
    bpm: 92,
    swing: 0.22,
    loop: true,
    channels: [
      { wave: 'triangle', vol: 0.17, notes: ['C3', null, 'G3', null, 'C3', null, 'G3', 'A3', 'F2', null, 'C3', null, 'G2', null, 'C3', null] },
      { wave: 'sine', vol: 0.1, notes: ['E5', '-', 'G5', '-', null, 'C5', '-', null, 'D5', '-', 'F5', '-', 'E5', '-', null, null] },
      { wave: 'noise', vol: 0.018, notes: ['C5', null, null, 'C5', null, null, 'C5', null, 'C5', null, null, 'C5', null, null, 'C5', null] },
    ],
  },
  puerto: {
    bpm: 116,
    swing: 0.18,
    loop: true,
    channels: [
      { wave: 'triangle', vol: 0.16, notes: ['D3', null, 'A3', 'D3', null, 'A3', 'D3', null, 'G2', null, 'D3', 'G3', 'A2', null, 'A3', null] },
      { wave: 'square', vol: 0.05, notes: ['F5', 'A5', null, 'F5', 'E5', null, 'D5', null, 'B4', 'D5', null, 'G5', 'A5', '-', null, null] },
      { wave: 'sine', vol: 0.08, notes: ['D4', null, 'F4', null, 'E4', null, 'D4', null, 'B3', null, 'D4', null, 'C4', '-', null, null] },
      { wave: 'noise', vol: 0.022, notes: ['C5', null, 'C5', 'C5', null, 'C5', null, 'C5', 'C5', null, 'C5', 'C5', null, 'C5', null, 'C5'] },
    ],
  },
  jungle: {
    bpm: 104,
    loop: true,
    channels: [
      { wave: 'triangle', vol: 0.16, notes: ['E2', null, null, 'E2', 'G2', null, 'E2', null, 'A2', null, null, 'A2', 'G2', null, 'B2', null] },
      { wave: 'sine', vol: 0.07, notes: [null, 'E4', null, null, 'G4', '-', null, 'A4', null, null, 'G4', null, 'E4', '-', null, null] },
      { wave: 'noise', vol: 0.03, notes: ['C5', 'C5', null, 'C5', null, 'C5', 'C5', null, 'C5', null, 'C5', 'C5', null, 'C5', 'C5', null] },
    ],
  },
  // LAS DUNAS — an off-kilter desert road theme: loping bass, dry reed-like
  // square lead, and unanswered high notes that feel a little too far away.
  // Wind remains a separate ambience bed so interiors can muffle cleanly.
  dunas: {
    bpm: 88,
    swing: 0.28,
    loop: true,
    channels: [
      { wave: 'triangle', vol: 0.16, notes: ['E2', null, 'B2', null, 'D3', null, 'A2', null, 'C3', null, 'G2', null, 'B2', null, 'D3', null] },
      { wave: 'square', vol: 0.045, notes: [null, 'B4', '-', null, 'G4', null, 'E4', '-', null, 'A4', '-', 'G4', null, 'F4', 'E4', null] },
      { wave: 'sine', vol: 0.065, notes: ['E5', null, null, null, 'D5', '-', null, null, 'B4', null, null, 'C5', '-', null, null, null] },
      { wave: 'noise', vol: 0.014, notes: ['C5', null, null, 'C5', null, null, null, 'C5', 'C5', null, null, null, 'C5', null, null, null] },
    ],
  },
  valle: {
    bpm: 84,
    loop: true,
    channels: [
      { wave: 'triangle', vol: 0.15, notes: ['A2', null, null, 'E3', null, null, 'F2', null, null, 'C3', null, null, 'G2', null, 'E3', null] },
      { wave: 'sine', vol: 0.11, notes: ['A4', '-', 'C5', 'B4', '-', null, 'A4', '-', 'F4', '-', 'G4', 'A4', '-', '-', null, null] },
      { wave: 'sine', vol: 0.05, notes: [null, 'E4', null, null, 'C4', null, null, 'A3', null, null, 'C4', null, null, 'B3', null, null] },
    ],
  },
  pyramid: {
    bpm: 66,
    loop: true,
    channels: [
      { wave: 'triangle', vol: 0.14, notes: ['D2', '-', '-', '-', null, null, 'Eb2', '-', '-', null, 'D2', '-', null, null, null, null] },
      { wave: 'sine', vol: 0.06, notes: [null, null, 'D5', null, null, null, null, null, 'F5', null, null, 'Eb5', null, null, null, null] },
      { wave: 'noise', vol: 0.012, notes: [null, null, null, 'C5', null, null, null, null, null, null, 'C5', null, null, null, null, null] },
    ],
  },
  // The opening cinema (ADR-041): the sky before it falls. Otherworldly on
  // purpose — a half-step drone that never resolves, detuned star-bells on
  // tritones, no downbeat a town band could find. It stops DEAD at impact;
  // the silence afterward is part of the track.
  starfall: {
    bpm: 52,
    loop: true,
    channels: [
      {
        wave: 'sine',
        vol: 0.09,
        notes: ['C2', '-', '-', '-', '-', '-', '-', '-', 'Db2', '-', '-', '-', 'C2', '-', '-', '-'],
      },
      {
        wave: 'sine',
        vol: 0.045,
        detune: 11,
        notes: ['Gb5', null, null, null, 'F5', null, null, 'C6', null, null, 'Eb5', null, null, null, 'Gb5', null],
      },
      {
        wave: 'triangle',
        vol: 0.05,
        notes: [null, null, null, 'Gb3', null, null, null, null, null, 'F3', null, null, null, null, 'Ab3', null],
      },
      {
        wave: 'sine',
        vol: 0.02,
        detune: -8,
        notes: [null, 'C7', null, null, null, null, 'Gb6', null, null, null, null, 'C7', null, null, null, null],
      },
    ],
  },
  // Heartlight: the Homesong's first stem — played when an Ember is recorded
  heartlight: {
    bpm: 72,
    loop: false,
    channels: [
      {
        wave: 'sine',
        vol: 0.14,
        notes: ['C5', '-', 'G4', '-', 'A4', '-', 'E5', '-', 'D5', '-', 'C5', '-', '-', null, null, null],
      },
      {
        wave: 'triangle',
        vol: 0.1,
        notes: ['C3', null, null, null, 'F2', null, null, null, 'G2', null, null, null, 'C3', '-', null, null],
      },
    ],
  },
  // THE HOMESONG (§A4.9): TEN stems, one per Ember (ten Embers, ten Heartlights).
  // The Locket screen plays channels [0..embers) — with one Heartlight, one
  // instrument plays all alone. Channel 0 is the heartlight lead, so the cue
  // carries over. (Phase 8 swaps these synth voices for rendered stems.)
  homesong: {
    bpm: 76,
    loop: true,
    channels: [
      {
        wave: 'sine',
        vol: 0.14,
        notes: ['C5', '-', 'G4', '-', 'A4', '-', 'E5', '-', 'D5', '-', 'C5', '-', 'G4', '-', 'A4', '-'],
      },
      {
        wave: 'triangle',
        vol: 0.12,
        notes: ['C3', null, null, null, 'F2', null, null, null, 'G2', null, null, null, 'C3', null, 'G2', null],
      },
      {
        wave: 'square',
        vol: 0.04,
        notes: ['E4', '-', null, null, 'A4', '-', null, null, 'B4', '-', null, null, 'E4', '-', null, null],
      },
      {
        wave: 'sine',
        vol: 0.05,
        notes: [null, 'E5', null, 'G5', null, 'C6', null, null, null, 'B5', null, 'G5', null, null, 'E5', null],
      },
      {
        wave: 'noise',
        vol: 0.015,
        notes: [null, null, 'C5', null, null, null, 'C5', null, null, null, 'C5', null, null, null, 'C5', null],
      },
      {
        wave: 'sine',
        vol: 0.035,
        detune: 6,
        notes: ['G4', '-', '-', '-', 'A4', '-', '-', '-', 'G4', '-', '-', '-', 'B4', '-', '-', '-'],
      },
      {
        wave: 'square',
        vol: 0.025,
        notes: ['C6', null, null, null, null, null, null, 'G5', null, null, null, null, 'E6', null, null, null],
      },
      {
        wave: 'triangle',
        vol: 0.1,
        notes: ['C2', '-', '-', '-', 'F2', '-', '-', '-', 'G2', '-', '-', '-', 'C2', '-', '-', '-'],
      },
      // stem 9 — the late sparkle: a high counter that twinkles in on offbeats
      {
        wave: 'sine',
        vol: 0.03,
        detune: -3,
        notes: [null, 'E6', null, 'C6', null, 'A5', null, 'G6', null, 'B5', null, 'C6', null, 'G5', null, 'E6'],
      },
      // stem 10 — the full warmth of all ten: a low fifth pad that fills it out
      {
        wave: 'triangle',
        vol: 0.05,
        notes: ['G3', '-', '-', '-', 'C4', '-', '-', '-', 'D4', '-', '-', '-', 'G3', '-', '-', '-'],
      },
    ],
  },
};

/* ------------------------------------------------------------------ */

class AudioSys {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** the music sub-mix: voices → musicBus → musicMuffle → master (ADR-100). */
  private musicBus: GainNode | null = null;
  private musicMuffle: BiquadFilterNode | null = null;
  /** SFX sub-mix → master (bypasses the muffle). */
  private sfxBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  /** One looping, filtered noise bed under the music. Map data chooses the
   * semantic bed; this voice makes that previously data-only contract audible. */
  private ambienceVoice: AmbienceVoice | null = null;
  private intendedAmbience: AmbienceId | null = null;
  private intendedAmbienceScale = 1;
  /** the active track and the one crossfading out beneath it (at most one each). */
  private musicVoice: MusicVoice | null = null;
  private fadingVoice: MusicVoice | null = null;
  /** what playMusic was last ASKED to play — survives having no ctx yet, and
   *  drives idempotency exactly as the old `current` field did. */
  private intendedName: string | null = null;
  private intendedStems = Infinity;
  /** current muffle step + global synth detune (cents) for slow-mo bends. */
  private muffle: MuffleLevel = 0;
  private musicDetune = 0;
  /** per-bus levels (restored from device-local storage on unlock). */
  private levels: Record<AudioBus, number> = { ...BUS_DEFAULTS };
  muted = false;

  /** the track currently asked-for (back-compat for jingle + callers). */
  get current(): string | null {
    return this.intendedName;
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    // honor the persisted sound preference + per-bus volumes from the first note
    try {
      this.muted = localStorage.getItem('meteor-falls-sound') === 'off';
      this.levels.master = parseBusLevel(localStorage.getItem(BUS_KEYS.master), BUS_DEFAULTS.master);
      this.levels.music = parseBusLevel(localStorage.getItem(BUS_KEYS.music), BUS_DEFAULTS.music);
      this.levels.sfx = parseBusLevel(localStorage.getItem(BUS_KEYS.sfx), BUS_DEFAULTS.sfx);
    } catch {
      /* storage unavailable — defaults already seeded */
    }
    // master: the final fader, zeroed by mute (mute wins over the master level)
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.levels.master;
    this.master.connect(this.ctx.destination);
    // music path: musicBus (volume) → musicMuffle (lowpass veil) → master
    this.musicMuffle = this.ctx.createBiquadFilter();
    this.musicMuffle.type = 'lowpass';
    this.musicMuffle.frequency.value = muffleCutoff(this.muffle);
    this.musicMuffle.Q.value = 0.707; // gentle Butterworth knee, no resonant peak
    this.musicMuffle.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.levels.music;
    this.musicBus.connect(this.musicMuffle);
    // sfx path: sfxBus (volume) → master, DELIBERATELY bypassing the muffle
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.levels.sfx;
    this.sfxBus.connect(this.master);
    // 1s of white noise, reused
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // audio focus: go silent when the game is backgrounded (tab/app switch)
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (!this.muted) void this.ctx.resume();
    });
    // REALIZE the pending intent. A track is almost always requested BEFORE this
    // first gesture (the title theme is asked for on frame 1; the unlocking tap
    // comes seconds later) — playMusic() can only latch the name while ctx is
    // null, and its idempotency guard then suppresses every same-track re-request.
    // So the graph coming up is the one moment that intent can be SOUNDED; without
    // this the opening music never starts. (No-op when nothing was requested.)
    if (this.intendedName) this.applyMusic(this.intendedName, this.intendedStems);
    if (this.intendedAmbience) this.applyAmbience(this.intendedAmbience, this.intendedAmbienceScale);
  }

  /**
   * Audio focus (S8): the Capacitor shell parks the synth when the app loses
   * the foreground — incoming calls, app switches — and revives it on return.
   * Same suspend/resume the visibilitychange handler uses; appStateChange
   * fires in cases where the WebView never flips document.hidden.
   */
  focusLost(): void {
    if (this.ctx) void this.ctx.suspend();
  }

  focusGained(): void {
    if (this.ctx && !this.muted && !document.hidden) void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.levels.master;
    try {
      localStorage.setItem('meteor-falls-sound', m ? 'off' : 'on');
    } catch {
      /* storage unavailable */
    }
  }

  /** flips mute; returns the new muted state */
  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /* ---------------- SFX ---------------- */

  private tone(
    wave: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    when = 0,
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, filterFreq: number, when = 0): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuf) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t, Math.random(), dur + 0.05);
  }

  sfx(name: string): void {
    // S11b combo pitch ladder: 'combo_2'…'combo_8' — every follow-up hit in
    // the SMAAAASH window rings one step higher than the last
    if (name.startsWith('combo_')) {
      const step = Math.max(1, Math.min(9, Number(name.slice(6)) || 1));
      const f = 392 * Math.pow(2, step / 12);
      this.tone('square', f, f, 0.06, 0.07);
      this.tone('square', f * 1.5, f * 1.5, 0.05, 0.04, 0.03);
      this.noise(0.05, 0.05, 2400);
      return;
    }
    switch (name) {
      case 'text':
        this.tone('square', 950, 700, 0.025, 0.04);
        break;
      case 'cursor':
        this.tone('square', 660, 660, 0.035, 0.05);
        break;
      case 'confirm':
        this.tone('square', 523, 784, 0.07, 0.06);
        break;
      case 'cancel':
        this.tone('square', 392, 262, 0.07, 0.05);
        break;
      case 'engine_start':
        this.noise(0.18, 0.09, 520);
        this.tone('sawtooth', 72, 128, 0.34, 0.08, 0.05);
        this.tone('triangle', 110, 84, 0.28, 0.05, 0.18);
        break;
      case 'vehicle_horn':
        this.tone('square', 246, 246, 0.13, 0.07);
        this.tone('square', 310, 310, 0.13, 0.055, 0.015);
        break;
      case 'swirl':
        this.noise(0.5, 0.1, 2400);
        this.tone('sawtooth', 180, 900, 0.5, 0.05);
        break;
      case 'hit':
        this.noise(0.1, 0.12, 1200);
        this.tone('triangle', 160, 60, 0.12, 0.12);
        break;
      case 'smash':
        this.noise(0.3, 0.16, 900);
        this.tone('square', 120, 45, 0.3, 0.14);
        this.tone('square', 90, 35, 0.34, 0.1, 0.03);
        break;
      case 'odo':
        this.tone('square', 1300, 1300, 0.012, 0.018);
        break;
      case 'odo_danger':
        this.tone('square', 1700, 1700, 0.012, 0.03);
        break;
      case 'heal':
        this.tone('sine', 523, 523, 0.08, 0.07);
        this.tone('sine', 659, 659, 0.08, 0.07, 0.07);
        this.tone('sine', 784, 784, 0.12, 0.07, 0.14);
        break;
      case 'phone':
        for (const dt of [0, 0.45]) {
          this.tone('square', 440, 440, 0.18, 0.05, dt);
          this.tone('square', 480, 480, 0.18, 0.05, dt + 0.2);
        }
        break;
      case 'zapper':
        this.tone('sawtooth', 110, 70, 0.35, 0.12);
        this.noise(0.3, 0.1, 4000);
        break;
      case 'ember':
        this.tone('sine', 880, 880, 0.5, 0.08);
        this.tone('sine', 1320, 1320, 0.5, 0.04, 0.02);
        break;
      case 'step':
        this.noise(0.04, 0.015, 700);
        break;
      case 'whoosh':
        // door transitions (S7 juice): a quick airy sweep
        this.noise(0.22, 0.06, 1600);
        this.tone('sine', 520, 180, 0.2, 0.04);
        break;
      case 'thud':
        this.tone('triangle', 90, 50, 0.1, 0.1);
        break;
      /* ---- the opening cinema (ADR-041): the full fall, scored ---- */
      case 'meteor_far':
        // the wrong star: a detuned shimmer, far too high up to be weather
        this.tone('sine', 1976, 1976, 1.4, 0.025);
        this.tone('sine', 1985, 1985, 1.4, 0.02, 0.05);
        this.tone('sine', 2960, 2960, 0.9, 0.012, 0.4);
        break;
      case 'meteor_fall':
        // entry scream + a rumble that builds the whole way down (~2.8s,
        // sized to the descent tween)
        this.tone('sawtooth', 1350, 70, 2.7, 0.045);
        this.tone('sine', 2100, 110, 2.7, 0.035, 0.08);
        this.noise(0.7, 0.025, 700);
        this.noise(0.8, 0.05, 900, 0.6);
        this.noise(0.9, 0.085, 1100, 1.3);
        this.noise(1.1, 0.13, 1500, 1.9);
        break;
      case 'sonic_boom':
        // the sky cracks once on the way down
        this.noise(0.09, 0.16, 5200);
        this.tone('square', 200, 55, 0.22, 0.11);
        this.noise(0.5, 0.06, 800, 0.08);
        break;
      case 'meteor_crash':
        // the ground gets the news: sub thump, long brown roar, two echoes
        this.tone('triangle', 64, 22, 1.5, 0.24);
        this.tone('sine', 46, 18, 2.0, 0.2, 0.04);
        this.noise(1.7, 0.22, 380);
        this.noise(1.1, 0.12, 160, 0.18);
        this.tone('triangle', 50, 24, 0.9, 0.1, 1.15);
        this.noise(0.9, 0.07, 300, 1.2);
        this.tone('triangle', 44, 22, 0.8, 0.06, 2.1);
        this.noise(0.8, 0.04, 260, 2.15);
        break;
      case 'rumble':
        // aftershock: the floor remembers
        this.tone('sine', 38, 30, 1.3, 0.07);
        this.noise(1.2, 0.05, 240);
        break;
      case 'light_on':
        // one porch light joins the conversation
        this.tone('sine', 740, 988, 0.05, 0.02);
        break;
      case 'pray':
        this.tone('sine', 660, 660, 0.3, 0.05);
        this.tone('sine', 990, 990, 0.4, 0.04, 0.1);
        break;
      case 'alert':
        // a patrol Smiler notices you, productively
        this.tone('square', 620, 980, 0.09, 0.07);
        this.tone('square', 980, 980, 0.07, 0.06, 0.09);
        break;
      /* ---- S12 THE CAGE presets: the court's whole vocabulary ---- */
      case 'bounce':
        this.tone('triangle', 130, 70, 0.07, 0.1);
        this.noise(0.03, 0.03, 500);
        break;
      case 'swish':
        // chain net — the cage's one pure sound
        this.noise(0.16, 0.08, 5200);
        this.tone('sine', 1980, 1480, 0.14, 0.04, 0.01);
        break;
      case 'rim':
        this.tone('square', 420, 380, 0.09, 0.09);
        this.tone('square', 630, 590, 0.07, 0.05, 0.02);
        break;
      case 'fence':
        // the ball plays off the chain-link (no out of bounds here)
        this.noise(0.12, 0.06, 3200);
        this.tone('triangle', 240, 180, 0.1, 0.05);
        break;
      case 'pass':
        this.noise(0.06, 0.04, 1900);
        break;
      case 'catch':
        this.tone('triangle', 300, 240, 0.04, 0.06);
        break;
      case 'gather':
        this.tone('sine', 360, 520, 0.12, 0.05);
        break;
      case 'green':
        // the GREEN release — one clean tick of certainty
        this.tone('sine', 1245, 1245, 0.09, 0.06);
        break;
      case 'jump':
        this.noise(0.05, 0.04, 900);
        this.tone('sine', 240, 420, 0.08, 0.04);
        break;
      case 'swipe':
        this.noise(0.07, 0.05, 2600);
        break;
      case 'steal':
        this.tone('square', 700, 1050, 0.08, 0.06);
        break;
      case 'block':
        this.noise(0.12, 0.1, 1100);
        this.tone('triangle', 140, 70, 0.12, 0.1);
        break;
      case 'dunk':
        // the hammer + the chain aftermath
        this.tone('triangle', 110, 50, 0.16, 0.13);
        this.noise(0.2, 0.09, 4800, 0.03);
        break;
      case 'buzzer':
        this.tone('sawtooth', 220, 220, 0.55, 0.09);
        this.tone('sawtooth', 222, 222, 0.55, 0.07);
        break;
      /* ---- S11 battle-fx presets: one voice per element/family ---- */
      case 'fx_surge':
        // the old light: rising fifths blooming into noise shimmer
        this.tone('square', 220, 880, 0.3, 0.08);
        this.tone('square', 330, 1320, 0.3, 0.06, 0.06);
        this.noise(0.35, 0.05, 5200, 0.12);
        break;
      case 'fx_fire':
        this.noise(0.4, 0.12, 1500);
        this.tone('sawtooth', 220, 90, 0.4, 0.07);
        this.noise(0.25, 0.07, 2600, 0.12);
        break;
      case 'fx_freeze':
        // crystalline: glassy descending partials
        this.tone('sine', 1760, 1760, 0.12, 0.06);
        this.tone('sine', 1320, 1320, 0.12, 0.06, 0.07);
        this.tone('sine', 988, 988, 0.18, 0.06, 0.14);
        this.noise(0.12, 0.03, 7800, 0.3);
        break;
      case 'fx_volt':
        this.tone('sawtooth', 1800, 120, 0.16, 0.1);
        this.noise(0.1, 0.09, 6000);
        this.tone('square', 90, 60, 0.18, 0.08, 0.05);
        break;
      case 'fx_lifeup':
        this.tone('sine', 392, 392, 0.09, 0.06);
        this.tone('sine', 523, 523, 0.09, 0.06, 0.08);
        this.tone('sine', 659, 659, 0.14, 0.06, 0.16);
        break;
      case 'fx_shield':
        // the hex snaps shut
        this.tone('triangle', 247, 494, 0.1, 0.08);
        this.tone('square', 988, 988, 0.05, 0.04, 0.1);
        break;
      case 'fx_hypno':
        this.tone('sine', 520, 260, 0.5, 0.06);
        this.tone('sine', 524, 262, 0.5, 0.05, 0.04);
        break;
      case 'fx_flash':
        this.noise(0.3, 0.1, 8000);
        this.tone('sine', 1568, 784, 0.3, 0.05);
        break;
      case 'fx_comet':
        this.tone('sine', 1400, 300, 0.45, 0.07);
        this.noise(0.4, 0.05, 3000, 0.1);
        this.tone('triangle', 80, 50, 0.2, 0.1, 0.3);
        break;
      case 'fx_magnet':
        this.tone('sine', 880, 220, 0.35, 0.06);
        this.tone('sine', 1100, 275, 0.35, 0.04, 0.05);
        break;
      case 'fx_starsong':
        // Mia's holy light: a warm rising major chord with a bell shimmer on top
        this.tone('sine', 523, 523, 0.12, 0.06);
        this.tone('sine', 659, 659, 0.12, 0.06, 0.07);
        this.tone('sine', 784, 1568, 0.22, 0.06, 0.14);
        this.tone('triangle', 1976, 1976, 0.1, 0.03, 0.2);
        break;
      case 'fx_brainjam':
        this.tone('square', 392, 415, 0.12, 0.07);
        this.tone('square', 415, 392, 0.12, 0.07, 0.12);
        this.noise(0.08, 0.05, 4400, 0.24);
        break;
      case 'fx_cure':
        this.tone('sine', 587, 587, 0.1, 0.06);
        this.tone('sine', 880, 880, 0.16, 0.06, 0.1);
        break;
      case 'fx_revive':
        this.tone('sine', 392, 392, 0.16, 0.07);
        this.tone('sine', 523, 523, 0.16, 0.07, 0.14);
        this.tone('sine', 784, 784, 0.3, 0.07, 0.28);
        break;
      case 'fx_rocket':
        this.noise(0.35, 0.1, 1800);
        this.tone('sawtooth', 140, 700, 0.32, 0.05);
        break;
      case 'fx_spy':
        this.tone('square', 1200, 1200, 0.03, 0.05);
        this.tone('square', 1500, 1500, 0.03, 0.05, 0.05);
        this.tone('square', 1800, 1800, 0.05, 0.05, 0.1);
        break;
      case 'fx_salt':
        // shake-shake, then the crack
        this.noise(0.05, 0.06, 5000);
        this.noise(0.05, 0.06, 5000, 0.09);
        this.noise(0.12, 0.1, 2400, 0.3);
        break;
      case 'fx_munch':
        this.noise(0.06, 0.08, 900);
        this.noise(0.06, 0.07, 800, 0.12);
        this.noise(0.08, 0.06, 700, 0.24);
        break;
      case 'fx_fizz':
        this.noise(0.5, 0.05, 9000);
        this.tone('sine', 1047, 1568, 0.18, 0.04, 0.1);
        break;
      case 'fx_dissolve':
        this.noise(0.4, 0.07, 2000);
        this.tone('triangle', 300, 60, 0.42, 0.07);
        break;
      case 'fx_latch':
        this.tone('sawtooth', 200, 90, 0.2, 0.1);
        this.noise(0.14, 0.07, 1400, 0.06);
        break;
      case 'fx_sever':
        this.tone('square', 700, 1400, 0.08, 0.08);
        this.noise(0.1, 0.08, 3600, 0.06);
        break;
      case 'fx_guard':
        this.tone('triangle', 196, 196, 0.07, 0.09);
        this.tone('triangle', 262, 262, 0.06, 0.07, 0.07);
        break;
      case 'fx_summon':
        this.tone('sine', 262, 1047, 0.4, 0.06);
        this.noise(0.3, 0.04, 5000, 0.1);
        break;
      case 'fx_phase':
        this.tone('sawtooth', 110, 440, 0.4, 0.08);
        this.tone('sawtooth', 116, 466, 0.4, 0.06, 0.04);
        this.noise(0.3, 0.06, 2200, 0.2);
        break;
      case 'fx_cheer':
        this.tone('square', 523, 784, 0.1, 0.06);
        this.tone('square', 784, 1047, 0.12, 0.06, 0.1);
        break;
      /* ---- S16 ("The Old Light, Doubled"): Jay's expanded kit ---- */
      case 'fx_surge_x':
        // the FINALE: a held swell, then the chrysanthemum — fx_surge, bigger,
        // with a deep sub-boom under the noise shimmer (the whole sky)
        this.tone('square', 165, 660, 0.45, 0.09);
        this.tone('square', 247, 990, 0.45, 0.07, 0.06);
        this.tone('square', 330, 1320, 0.5, 0.06, 0.12);
        this.tone('triangle', 70, 50, 0.6, 0.11, 0.2);
        this.noise(0.55, 0.06, 5600, 0.18);
        break;
      case 'fx_mindwarp':
        // a mind being turned: two close detuned sines bending the wrong way
        this.tone('sine', 330, 392, 0.4, 0.06);
        this.tone('sine', 333, 262, 0.45, 0.05, 0.05);
        this.noise(0.1, 0.04, 1600, 0.22);
        break;
      case 'fx_ward':
        // the cool veil: fx_shield, a third lower and softer (elemental, not steel)
        this.tone('triangle', 196, 392, 0.12, 0.07);
        this.tone('sine', 784, 784, 0.06, 0.04, 0.1);
        break;
      case 'fx_reflect':
        // the answering mirror: the snap, then its own echo a beat behind
        this.tone('triangle', 262, 524, 0.1, 0.08);
        this.tone('square', 1047, 1047, 0.05, 0.04, 0.09);
        this.tone('triangle', 262, 524, 0.1, 0.05, 0.18);
        break;
      case 'fx_brace':
        // STAND: a short, low, resolute double-knock
        this.tone('triangle', 147, 147, 0.09, 0.1);
        this.tone('triangle', 196, 196, 0.1, 0.09, 0.09);
        break;
      /* ---- S11b stage presets: per-weapon swings, doors, the barrier ---- */
      case 'swing_bat':
        // a deep bat whoosh — air parting before the SMAAASH decides
        this.noise(0.16, 0.08, 1100);
        this.tone('sine', 300, 130, 0.16, 0.05);
        break;
      case 'swing_pan':
        // whoosh + the cast-iron ring of twenty years of breakfast
        this.noise(0.14, 0.07, 1300);
        this.tone('triangle', 880, 870, 0.18, 0.06, 0.06);
        this.tone('triangle', 1318, 1305, 0.14, 0.04, 0.07);
        break;
      case 'rifle_crack':
        // the Pellet Popper speaks: sharp crack, tight tail
        this.noise(0.06, 0.16, 7000);
        this.tone('square', 220, 70, 0.09, 0.1);
        this.noise(0.18, 0.05, 1600, 0.05);
        break;
      case 'swing_beads':
        // bead rattle into the strike — clicks riding a short whoosh
        this.noise(0.03, 0.07, 5200);
        this.noise(0.03, 0.06, 4800, 0.05);
        this.noise(0.1, 0.06, 1400, 0.08);
        break;
      case 'swing_fist':
        this.noise(0.1, 0.06, 1200);
        this.tone('sine', 240, 120, 0.1, 0.04);
        break;
      case 'swing_kit':
        // M19 (ADR-064): Pippa's tiny precise jab — a short tick + a bright ping
        this.noise(0.03, 0.05, 4200);
        this.tone('triangle', 1760, 1740, 0.07, 0.03, 0.03);
        break;
      case 'door_creak':
        // an interior door admits you: hinge creak, then the S7 whoosh family
        this.tone('sawtooth', 180, 320, 0.22, 0.035);
        this.tone('sawtooth', 187, 340, 0.2, 0.025, 0.04);
        this.noise(0.18, 0.05, 1500, 0.16);
        break;
      case 'shield_panel':
        // one hex panel seats and locks
        this.tone('triangle', 740, 740, 0.04, 0.05);
        this.tone('square', 1480, 1480, 0.03, 0.025, 0.03);
        break;
      case 'breath':
        // the winded tick — a worked breath, barely voiced
        this.noise(0.12, 0.025, 900);
        this.noise(0.08, 0.015, 700, 0.16);
        break;
      /* ---- the six pray tiers (§A11.4: hopeful even on Nothing) ---- */
      case 'pray_mir':
        // the choir answers: a slow major bloom with a shimmer crown
        for (const [f, dt] of [[262, 0], [330, 0.14], [392, 0.28], [523, 0.42], [659, 0.56], [784, 0.7]] as const) {
          this.tone('sine', f, f, 0.6, 0.06, dt);
          this.tone('sine', f * 2, f * 2, 0.5, 0.02, dt + 0.05);
        }
        this.noise(0.8, 0.02, 9000, 0.5);
        break;
      case 'pray_won':
        this.tone('sine', 392, 392, 0.3, 0.07);
        this.tone('sine', 494, 494, 0.3, 0.06, 0.12);
        this.tone('sine', 587, 587, 0.4, 0.06, 0.24);
        break;
      case 'pray_good':
        this.tone('sine', 523, 523, 0.2, 0.06);
        this.tone('sine', 659, 659, 0.3, 0.05, 0.14);
        break;
      case 'pray_none':
        // one small note. it tries.
        this.tone('sine', 659, 659, 0.22, 0.045);
        break;
      case 'pray_str':
        this.tone('sine', 660, 612, 0.4, 0.06);
        this.tone('sine', 668, 720, 0.4, 0.05, 0.06);
        break;
      case 'pray_back':
        this.tone('sine', 523, 523, 0.18, 0.06);
        this.tone('sine', 494, 392, 0.4, 0.05, 0.16);
        break;
      default:
        break;
    }
  }

  /* ---------------- music sequencer ---------------- */

  /**
   * Start a looping track. `stems` caps how many channels play — the Star
   * Locket screen passes the Ember count so the Homesong grows one
   * instrument layer per Heartlight (§A4.9).
   */
  playMusic(name: string | null, stems?: number): void {
    const wantStems = stems ?? Infinity;
    // idempotent: already playing (or intending) this exact track + stem count
    if (this.intendedName === name && this.intendedStems === wantStems) return;
    this.intendedName = name;
    this.intendedStems = wantStems;
    // no context yet (pre-gesture): only RECORD the intent. The idempotency guard
    // above means a later same-track call can't start it, so unlock() is what
    // sounds this once the audio graph comes up (see the tail of unlock()).
    if (!this.ctx || !this.musicBus) return;
    this.applyMusic(name, wantStems);
  }

  /**
   * Crossfade the music (#2, ADR-100): ramp the outgoing voice down to 0 (then
   * dispose it) WHILE the incoming voice rides up — no hard cut. `name === null`
   * fades the current track out to silence.
   */
  private applyMusic(name: string | null, wantStems: number): void {
    // at most one fade-out at a time — drop any still-fading voice immediately
    if (this.fadingVoice) this.disposeVoice(this.fadingVoice);
    if (this.musicVoice) {
      const out = this.musicVoice;
      this.musicVoice = null;
      this.fadingVoice = out;
      this.rampGain(out.gain, 0, CROSSFADE_MS);
      window.setTimeout(() => {
        if (this.fadingVoice === out) this.disposeVoice(out);
      }, CROSSFADE_MS + 80);
    }
    if (!name) return;
    const voice = this.startVoice(name, wantStems);
    this.musicVoice = voice;
    this.rampGain(voice.gain, 1, CROSSFADE_MS);
  }

  /** spin up a fresh voice (its own crossfade gain + scheduler clock) and start
   *  its loop. The caller ramps `voice.gain` in. */
  private startVoice(name: string, stems: number): MusicVoice {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0; // the crossfade ramps this up
    gain.connect(this.musicBus!);
    const voice: MusicVoice = {
      name,
      gain,
      timer: null,
      step: 0,
      nextTime: ctx.currentTime + 0.05,
      stems,
      held: {},
      live: true,
    };
    const tick = (): void => {
      if (!this.ctx || !voice.live) return;
      const track = TRACKS[name];
      const stepDur = 60 / track.bpm / 2; // 8th notes
      while (voice.nextTime < this.ctx.currentTime + 0.12) {
        const stepIdx = voice.step % track.channels[0].notes.length;
        if (!track.loop && voice.step >= track.channels[0].notes.length) {
          // one-shot finished: release tied notes at the pattern end, then retire
          // the voice (clearing the intent only if this was the active track)
          const end = voice.nextTime;
          Object.keys(voice.held).forEach((k) => this.releaseHeld(voice, Number(k), end));
          if (this.musicVoice === voice && this.intendedName === voice.name) this.intendedName = null;
          this.disposeVoice(voice);
          return;
        }
        const swing = track.swing ? (stepIdx % 2 === 1 ? stepDur * track.swing : 0) : 0;
        const t = voice.nextTime + swing;
        track.channels.forEach((ch, ci) => {
          if (ci >= voice.stems) return; // stem not earned yet (§A4.9)
          const n = ch.notes[stepIdx];
          if (n === null) {
            this.releaseHeld(voice, ci, t);
            return;
          }
          if (n === '-') return; // tie
          this.releaseHeld(voice, ci, t);
          this.scheduleNote(voice, ci, ch, n, t, stepDur);
        });
        voice.step++;
        voice.nextTime += stepDur;
      }
    };
    voice.timer = window.setInterval(tick, 30);
    tick();
    return voice;
  }

  private scheduleNote(voice: MusicVoice, ci: number, ch: Channel, note: string, t: number, stepDur: number): void {
    if (!this.ctx) return;
    if (ch.wave === 'noise') {
      if (!this.noiseBuf) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 5000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(ch.vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      src.connect(f).connect(g).connect(voice.gain);
      src.start(t, Math.random(), 0.08);
      return;
    }
    const osc = this.ctx.createOscillator();
    osc.type = ch.wave;
    osc.frequency.value = freqOf(note);
    // the channel's own detune plus the global slow-mo bend (ADR-100/§A4 slow-mo)
    const base = ch.detune ?? 0;
    osc.detune.value = base + this.musicDetune;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(ch.vol, t + 0.015);
    osc.connect(g).connect(voice.gain);
    osc.start(t);
    // safety stop: longest tie run in any track is 4 steps; releaseHeld
    // normally ends notes well before this
    osc.stop(t + stepDur * 8);
    voice.held[ci] = { osc, gain: g, base };
  }

  private releaseHeld(voice: MusicVoice, ci: number, t: number): void {
    const h = voice.held[ci];
    if (!h) return;
    try {
      h.gain.gain.setTargetAtTime(0.0001, t, 0.03);
      h.osc.stop(t + 0.25);
    } catch {
      /* node already stopped */
    }
    voice.held[ci] = undefined;
  }

  /** ramp a gain to `to` over `ms` — the crossfade primitive. */
  private rampGain(g: GainNode, to: number, ms: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(to, now + ms / 1000);
  }

  /** retire a voice: stop its clock, release held notes, unwire its gain, and
   *  clear it from the active/fading slots. Safe to call twice. */
  private disposeVoice(voice: MusicVoice): void {
    voice.live = false;
    if (voice.timer !== null) {
      window.clearInterval(voice.timer);
      voice.timer = null;
    }
    if (this.ctx) {
      const t = this.ctx.currentTime;
      Object.keys(voice.held).forEach((k) => this.releaseHeld(voice, Number(k), t));
    }
    try {
      voice.gain.disconnect();
    } catch {
      /* already disconnected */
    }
    if (this.musicVoice === voice) this.musicVoice = null;
    if (this.fadingVoice === voice) this.fadingVoice = null;
  }

  /** hard-stop ALL music immediately (no fade) — for teardown/scene shutdown.
   *  Room-to-room changes go through playMusic(), which crossfades instead. */
  stopMusic(): void {
    if (this.fadingVoice) this.disposeVoice(this.fadingVoice);
    if (this.musicVoice) this.disposeVoice(this.musicVoice);
    this.intendedName = null;
    this.intendedStems = Infinity;
  }

  /** Select the current map's audible ambient bed. The source loops under the
   * music bus, so player music volume and the indoor muffle veil apply to rain,
   * wind, waves, and machinery too. Re-selecting a bed only retunes its gain;
   * changing maps crossfades the old bed out. */
  setAmbience(id: AmbienceId | null | undefined, scale = 1): void {
    this.intendedAmbience = id ?? null;
    this.intendedAmbienceScale = clamp01(scale);
    if (!this.ctx || !this.musicBus || !this.noiseBuf) return;
    if (!id) {
      const old = this.ambienceVoice;
      this.ambienceVoice = null;
      if (old) this.disposeAmbienceVoice(old, true);
      return;
    }
    if (this.ambienceVoice?.id === id) {
      this.rampGain(this.ambienceVoice.gain, AMBIENCE[id].gain * this.intendedAmbienceScale, 420);
      return;
    }
    this.applyAmbience(id, this.intendedAmbienceScale);
  }

  private applyAmbience(id: AmbienceId, scale: number): void {
    if (!this.ctx || !this.musicBus || !this.noiseBuf) return;
    const bed = AMBIENCE[id];
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuf;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = bed.cutoff;
    filter.Q.value = bed.base === 'white' ? 0.45 : bed.base === 'pink' ? 0.7 : 0.9;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(this.musicBus);

    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (bed.sway) {
      lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 1 / bed.sway.rate;
      lfoGain = this.ctx.createGain();
      lfoGain.gain.value = bed.sway.depth;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
    }
    const old = this.ambienceVoice;
    const voice = { id, source, filter, gain, lfo, lfoGain };
    this.ambienceVoice = voice;
    source.start();
    this.rampGain(gain, bed.gain * clamp01(scale), 650);
    if (old) this.disposeAmbienceVoice(old, true);
  }

  private disposeAmbienceVoice(voice: AmbienceVoice, fade: boolean): void {
    const finish = (): void => {
      try { voice.source.stop(); } catch { /* already stopped */ }
      try { voice.lfo?.stop(); } catch { /* already stopped */ }
      try { voice.source.disconnect(); } catch { /* already disconnected */ }
      try { voice.filter.disconnect(); } catch { /* already disconnected */ }
      try { voice.gain.disconnect(); } catch { /* already disconnected */ }
      try { voice.lfo?.disconnect(); } catch { /* already disconnected */ }
      try { voice.lfoGain?.disconnect(); } catch { /* already disconnected */ }
    };
    if (!fade || !this.ctx) {
      finish();
      return;
    }
    this.rampGain(voice.gain, 0, 500);
    window.setTimeout(finish, 540);
  }

  /**
   * Set the music MUFFLE veil (#2): 0 open · 1 menu/pause veil · 2 deep/indoor.
   * Lerps the lowpass cutoff so it glides rather than clicks. Idempotent-safe and
   * a no-op before unlock (the level is remembered and applied when the graph
   * comes up).
   */
  setMusicMuffle(level: MuffleLevel): void {
    this.muffle = level;
    if (!this.ctx || !this.musicMuffle) return;
    const now = this.ctx.currentTime;
    const f = this.musicMuffle.frequency;
    f.cancelScheduledValues(now);
    f.setValueAtTime(f.value, now);
    f.linearRampToValueAtTime(muffleCutoff(level), now + MUFFLE_GLIDE_S);
  }

  /** Set a mixer bus volume 0..1 (#7), persisted device-local. 'master' still
   *  honors mute (mute zeroes it regardless of level). */
  setBus(bus: AudioBus, level: number): void {
    const v = clamp01(level);
    this.levels[bus] = v;
    if (bus === 'master') {
      if (this.master) this.master.gain.value = this.muted ? 0 : v;
    } else if (bus === 'music') {
      if (this.musicBus) this.musicBus.gain.value = v;
    } else if (this.sfxBus) {
      this.sfxBus.gain.value = v;
    }
    try {
      localStorage.setItem(BUS_KEYS[bus], String(v));
    } catch {
      /* storage unavailable — the in-memory level still took */
    }
  }

  /** current level of a bus (0..1). */
  getBus(bus: AudioBus): number {
    return this.levels[bus];
  }

  /**
   * Bend the whole synth by `cents` (ADR-100) — battle slow-mo detunes the music
   * down as time stretches, then back to 0. Applies to currently-held notes
   * immediately (over their own base detune) and to every note scheduled after.
   */
  setMusicDetune(cents: number): void {
    this.musicDetune = cents;
    for (const voice of [this.musicVoice, this.fadingVoice]) {
      if (!voice) continue;
      for (const key of Object.keys(voice.held)) {
        const h = voice.held[Number(key)];
        if (h) {
          try {
            h.osc.detune.value = h.base + cents;
          } catch {
            /* node already stopped */
          }
        }
      }
    }
  }

  /** play a one-shot jingle, then resume previous music */
  jingle(name: string, resumeAfterMs: number, resume: string | null): void {
    this.playMusic(name);
    window.setTimeout(() => {
      if (this.current === name || this.current === null) this.playMusic(resume);
    }, resumeAfterMs);
  }
}

export const AUDIO = new AudioSys();
