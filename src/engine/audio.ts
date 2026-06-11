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
