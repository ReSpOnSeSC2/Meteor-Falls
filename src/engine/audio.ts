/**
 * WebAudio synth: SFX presets + a pattern sequencer (ADR-006).
 * Phase 8 swaps the voices for rendered stems behind this same API.
 */

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
  // THE HOMESONG (§A4.9): eight stems, one per Ember. The Locket screen plays
  // channels [0..embers) — with one Heartlight, one instrument plays all
  // alone. Channel 0 is the heartlight lead, so the cue carries over.
  // (Phase 8 swaps these synth voices for rendered stems behind the same API.)
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
    ],
  },
};

/* ------------------------------------------------------------------ */

class AudioSys {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: number | null = null;
  private current: string | null = null;
  private step = 0;
  private nextTime = 0;
  private held: Record<number, { osc: OscillatorNode; gain: GainNode } | undefined> = {};
  /** channel cap for the current track (Homesong stems, §A4.9) */
  private stems = Infinity;
  muted = false;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    // honor the persisted sound preference from the first note onward
    try {
      this.muted = localStorage.getItem('meteor-falls-sound') === 'off';
    } catch {
      /* storage unavailable */
    }
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 1;
    this.musicGain.connect(this.master);
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
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
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
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, filterFreq: number, when = 0): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
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
    if (this.current === name && this.stems === wantStems) return;
    this.stopMusic();
    this.stems = wantStems;
    if (!name) return;
    this.current = name;
    if (!this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    const tick = (): void => {
      if (!this.ctx || this.current !== name) return;
      const track = TRACKS[name];
      const stepDur = 60 / track.bpm / 2; // 8th notes
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        const stepIdx = this.step % track.channels[0].notes.length;
        if (!track.loop && this.step >= track.channels[0].notes.length) {
          // one-shot finished: release every held (tied) note at the pattern's
          // end and kill the scheduler — otherwise the last note drones on
          const end = this.nextTime;
          Object.keys(this.held).forEach((k) => this.releaseHeld(Number(k), end));
          if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
          }
          this.current = null;
          return;
        }
        const swing = track.swing ? (stepIdx % 2 === 1 ? stepDur * track.swing : 0) : 0;
        const t = this.nextTime + swing;
        track.channels.forEach((ch, ci) => {
          if (ci >= this.stems) return; // stem not earned yet (§A4.9)
          const n = ch.notes[stepIdx];
          if (n === null) {
            this.releaseHeld(ci, t);
            return;
          }
          if (n === '-') return; // tie
          this.releaseHeld(ci, t);
          this.scheduleNote(ci, ch, n, t, stepDur);
        });
        this.step++;
        this.nextTime += stepDur;
      }
    };
    this.timer = window.setInterval(tick, 30);
    tick();
  }

  private scheduleNote(ci: number, ch: Channel, note: string, t: number, stepDur: number): void {
    if (!this.ctx || !this.musicGain) return;
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
      src.connect(f).connect(g).connect(this.musicGain);
      src.start(t, Math.random(), 0.08);
      return;
    }
    const osc = this.ctx.createOscillator();
    osc.type = ch.wave;
    osc.frequency.value = freqOf(note);
    if (ch.detune) osc.detune.value = ch.detune;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(ch.vol, t + 0.015);
    osc.connect(g).connect(this.musicGain);
    osc.start(t);
    // safety stop: longest tie run in any track is 4 steps; releaseHeld
    // normally ends notes well before this
    osc.stop(t + stepDur * 8);
    this.held[ci] = { osc, gain: g };
  }

  private releaseHeld(ci: number, t: number): void {
    const h = this.held[ci];
    if (!h) return;
    try {
      h.gain.gain.setTargetAtTime(0.0001, t, 0.03);
      h.osc.stop(t + 0.25);
    } catch {
      /* node already stopped */
    }
    this.held[ci] = undefined;
  }

  stopMusic(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      const t = this.ctx.currentTime;
      Object.keys(this.held).forEach((k) => this.releaseHeld(Number(k), t));
    }
    this.current = null;
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
