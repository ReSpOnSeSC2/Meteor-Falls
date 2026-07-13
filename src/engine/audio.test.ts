/**
 * AudioSys mixer tests (ADR-100) — a minimal FAKE Web Audio graph that records
 * connections + AudioParam ops, so the crossfade, muffle, and volume-bus
 * behaviors lock in headlessly (the real AudioContext isn't available under
 * vitest's node env). We reset the AUDIO singleton's privates per test and let
 * it rebuild on a fresh fake context.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AUDIO } from './audio';
import { BUS_KEYS, muffleCutoff } from './audiobus';

interface Op {
  kind: 'set' | 'linear' | 'expo' | 'target' | 'cancel';
  value?: number;
}

class FakeParam {
  value: number;
  ops: Op[] = [];
  constructor(v: number) {
    this.value = v;
  }
  setValueAtTime(v: number): this {
    this.value = v;
    this.ops.push({ kind: 'set', value: v });
    return this;
  }
  linearRampToValueAtTime(v: number): this {
    this.value = v;
    this.ops.push({ kind: 'linear', value: v });
    return this;
  }
  exponentialRampToValueAtTime(v: number): this {
    this.value = v;
    this.ops.push({ kind: 'expo', value: v });
    return this;
  }
  setTargetAtTime(v: number): this {
    this.ops.push({ kind: 'target', value: v });
    return this;
  }
  cancelScheduledValues(): this {
    this.ops.push({ kind: 'cancel' });
    return this;
  }
  /** the last ramp/target the param was sent toward (what it's heading to). */
  lastTarget(): number | undefined {
    for (let i = this.ops.length - 1; i >= 0; i--) {
      const o = this.ops[i];
      if (o.kind !== 'cancel') return o.value;
    }
    return undefined;
  }
}

class FakeGain {
  gain = new FakeParam(1);
  outs: unknown[] = [];
  connect(n: unknown): unknown {
    this.outs.push(n);
    return n;
  }
  disconnect(): void {
    this.outs = [];
  }
}
class FakeFilter {
  type = 'lowpass';
  frequency = new FakeParam(350);
  Q = new FakeParam(1);
  outs: unknown[] = [];
  connect(n: unknown): unknown {
    this.outs.push(n);
    return n;
  }
  disconnect(): void {
    this.outs = [];
  }
}
class FakeOsc {
  type = 'sine';
  frequency = new FakeParam(440);
  detune = new FakeParam(0);
  outs: unknown[] = [];
  connect(n: unknown): unknown {
    this.outs.push(n);
    return n;
  }
  start(): void {}
  stop(): void {}
}
class FakeBufferSource {
  buffer: unknown = null;
  loop = false;
  outs: unknown[] = [];
  connect(n: unknown): unknown {
    this.outs.push(n);
    return n;
  }
  start(): void {}
  stop(): void {}
}
class FakeCtx {
  state = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = { name: 'destination' };
  oscillators: FakeOsc[] = [];
  bufferSources: FakeBufferSource[] = [];
  createGain(): FakeGain {
    return new FakeGain();
  }
  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }
  createOscillator(): FakeOsc {
    const osc = new FakeOsc();
    this.oscillators.push(osc);
    return osc;
  }
  createBufferSource(): FakeBufferSource {
    const source = new FakeBufferSource();
    this.bufferSources.push(source);
    return source;
  }
  createBuffer(_ch: number, len: number): { getChannelData(): Float32Array } {
    return { getChannelData: () => new Float32Array(len) };
  }
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let ctx: FakeCtx;
let store: Record<string, string>;

beforeEach(() => {
  ctx = new FakeCtx();
  store = {};
  (globalThis as any).window = {
    AudioContext: function AudioContextFake() {
      return ctx; // `new` returns this object
    },
    setInterval: () => 1,
    clearInterval: () => undefined,
    setTimeout: () => 2,
  };
  (globalThis as any).document = { hidden: false, addEventListener: () => undefined };
  (globalThis as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  // reset the module singleton so unlock() rebuilds on the fresh fake context
  const a = AUDIO as any;
  a.ctx = null;
  a.musicVoice = null;
  a.fadingVoice = null;
  a.ambienceVoice = null;
  a.intendedAmbience = null;
  a.intendedAmbienceScale = 1;
  a.intendedName = null;
  a.intendedStems = Infinity;
  a.muted = false;
  a.muffle = 0;
  a.musicDetune = 0;
  a.levels = { master: 0.9, music: 1.0, sfx: 0.95 };
  AUDIO.unlock();
});

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).document;
  delete (globalThis as any).localStorage;
});

describe('AudioSys mixer graph (ADR-100)', () => {
  it('wires music → musicBus → muffle → master → destination, and sfx → master (bypassing the muffle)', () => {
    const a = AUDIO as any;
    expect(a.master.outs).toContain(ctx.destination);
    expect(a.musicBus.outs).toContain(a.musicMuffle);
    expect(a.musicMuffle.outs).toContain(a.master);
    expect(a.sfxBus.outs).toContain(a.master);
    expect(a.sfxBus.outs).not.toContain(a.musicMuffle); // SFX must NOT be muffled
    expect(a.musicMuffle.type).toBe('lowpass');
    expect(a.musicMuffle.frequency.value).toBe(muffleCutoff(0)); // starts open
  });
});

describe('volume buses (#7)', () => {
  it('routes each bus to the right node gain and persists device-local', () => {
    const a = AUDIO as any;
    AUDIO.setBus('music', 0.5);
    expect(a.musicBus.gain.value).toBe(0.5);
    expect(store[BUS_KEYS.music]).toBe('0.5');
    AUDIO.setBus('sfx', 0.3);
    expect(a.sfxBus.gain.value).toBe(0.3);
    expect(store[BUS_KEYS.sfx]).toBe('0.3');
    AUDIO.setBus('master', 0.7);
    expect(a.master.gain.value).toBe(0.7);
  });
  it('clamps out-of-range levels', () => {
    const a = AUDIO as any;
    AUDIO.setBus('music', 2);
    expect(a.musicBus.gain.value).toBe(1);
    AUDIO.setBus('music', -1);
    expect(a.musicBus.gain.value).toBe(0);
  });
  it('the master bus honors mute (mute wins; unmute restores the level)', () => {
    const a = AUDIO as any;
    AUDIO.setMuted(true);
    expect(a.master.gain.value).toBe(0);
    AUDIO.setBus('master', 0.8); // still muted → stays silent
    expect(a.master.gain.value).toBe(0);
    AUDIO.setMuted(false); // restores to the set level
    expect(a.master.gain.value).toBe(0.8);
  });
  it('restores persisted bus levels on unlock', () => {
    store[BUS_KEYS.music] = '0.4';
    store[BUS_KEYS.master] = '0.6';
    const a = AUDIO as any;
    a.ctx = null; // force a rebuild
    AUDIO.unlock();
    expect(a.musicBus.gain.value).toBe(0.4);
    expect(a.master.gain.value).toBe(0.6);
  });
});

describe('the muffle veil (#2)', () => {
  it('ramps the lowpass cutoff toward the level target rather than jumping', () => {
    const a = AUDIO as any;
    AUDIO.setMusicMuffle(2);
    expect(a.musicMuffle.frequency.lastTarget()).toBe(muffleCutoff(2)); // ~800
    AUDIO.setMusicMuffle(1);
    expect(a.musicMuffle.frequency.lastTarget()).toBe(muffleCutoff(1));
    AUDIO.setMusicMuffle(0);
    expect(a.musicMuffle.frequency.lastTarget()).toBe(muffleCutoff(0));
    // a ramp, not an instant set
    expect(a.musicMuffle.frequency.ops.some((o: Op) => o.kind === 'linear')).toBe(true);
  });
});

describe('map ambient beds (ADR-108 runtime seam)', () => {
  it('loops filtered ambience through the music bus and retunes it without rebuilding', () => {
    const a = AUDIO as any;
    AUDIO.setAmbience('rain');
    const rain = a.ambienceVoice;
    expect(rain.id).toBe('rain');
    expect(rain.source.loop).toBe(true);
    expect(rain.source.outs).toContain(rain.filter);
    expect(rain.filter.outs).toContain(rain.gain);
    expect(rain.gain.outs).toContain(a.musicBus);
    expect(rain.gain.gain.lastTarget()).toBeCloseTo(0.14);

    AUDIO.setAmbience('rain', 0.25);
    expect(a.ambienceVoice).toBe(rain);
    expect(rain.gain.gain.lastTarget()).toBeCloseTo(0.035);
  });

  it('crossfades beds and can clear the map ambience', () => {
    const a = AUDIO as any;
    AUDIO.setAmbience('rain');
    const rain = a.ambienceVoice;
    AUDIO.setAmbience('wind');
    expect(a.ambienceVoice).toBeNull();
    expect(a.intendedAmbience).toBeNull();
    expect(rain.gain.gain.lastTarget()).toBe(0);
    AUDIO.setAmbience('machine');
    expect(a.ambienceVoice.id).toBe('machine');
    AUDIO.setAmbience(null);
    expect(a.ambienceVoice).toBeNull();
  });

  it('does not build permanent noise voices for abstract or water ambience labels', () => {
    const a = AUDIO as any;
    const before = ctx.bufferSources.length;
    for (const id of ['wind', 'waves', 'river', 'birds', 'crowd', 'cave'] as const) {
      AUDIO.setAmbience(id);
      expect(a.ambienceVoice).toBeNull();
    }
    expect(ctx.bufferSources).toHaveLength(before);
  });
});

describe('the crossfade (#2)', () => {
  it('a new track ramps IN, and a replacement fades the old out WHILE the new rides up (no hard cut)', () => {
    const a = AUDIO as any;
    AUDIO.playMusic('title');
    const v1 = a.musicVoice;
    expect(v1).toBeTruthy();
    expect(v1.gain.outs).toContain(a.musicBus); // the voice feeds the music bus
    expect(v1.gain.gain.lastTarget()).toBe(1); // ramping IN from 0

    AUDIO.playMusic('battle'); // replace
    const v2 = a.musicVoice;
    expect(v2).not.toBe(v1);
    expect(a.fadingVoice).toBe(v1); // the old voice is kept, fading
    expect(v1.live).toBe(true); // still audible during the crossfade
    expect(v1.gain.gain.lastTarget()).toBe(0); // ramping OUT (not stopped)
    expect(v2.gain.gain.lastTarget()).toBe(1); // new one ramping IN
  });

  it('playMusic is idempotent; stopMusic hard-stops everything', () => {
    const a = AUDIO as any;
    AUDIO.playMusic('title');
    const v = a.musicVoice;
    AUDIO.playMusic('title'); // identical → no churn
    expect(a.musicVoice).toBe(v);

    AUDIO.stopMusic();
    expect(a.musicVoice).toBeNull();
    expect(a.fadingVoice).toBeNull();
    expect(AUDIO.current).toBeNull();
    expect(v.live).toBe(false);
  });

  it('sounds a track requested BEFORE the first unlock() (the opening-theme path)', () => {
    // TitleScene.update() asks for the title theme on frame 1 — long before the
    // tap that unlocks audio. playMusic() can only LATCH the name while ctx is
    // null, and its idempotency guard then blocks every same-track re-request, so
    // unlock() must be the thing that finally sounds it. Regression for the
    // "no music on the opening screen" bug (the other tests unlock() first, so
    // they never exercised this path).
    const a = AUDIO as any;
    a.ctx = null; // rewind to the genuine pre-gesture state
    a.musicVoice = null;
    a.fadingVoice = null;
    a.intendedName = null;
    a.intendedStems = Infinity;

    AUDIO.playMusic('title'); // latched only — there's no context yet
    expect(a.musicVoice).toBeNull();
    expect(a.intendedName).toBe('title');

    AUDIO.unlock(); // the first gesture brings the graph up...
    expect(a.musicVoice).toBeTruthy(); // ...and the pending track must now sound
    expect(a.musicVoice.name).toBe('title');
    expect(a.musicVoice.gain.outs).toContain(a.musicBus); // wired into the mix
    expect(a.musicVoice.gain.gain.lastTarget()).toBe(1); // ramping IN, not silent
  });

  it('playMusic(null) fades the current track out to silence', () => {
    const a = AUDIO as any;
    AUDIO.playMusic('title');
    const v = a.musicVoice;
    AUDIO.playMusic(null);
    expect(a.musicVoice).toBeNull();
    expect(a.fadingVoice).toBe(v);
    expect(v.gain.gain.lastTarget()).toBe(0); // fading out
  });
});

describe('the synth bend (#3 slow-mo hook)', () => {
  it('setMusicDetune records the global bend and applies base+cents to held notes', () => {
    const a = AUDIO as any;
    AUDIO.playMusic('title');
    AUDIO.setMusicDetune(-60);
    expect(a.musicDetune).toBe(-60);
    const held = a.musicVoice.held as Record<number, { osc: FakeOsc; base: number } | undefined>;
    for (const k of Object.keys(held)) {
      const h = held[Number(k)];
      if (h) expect(h.osc.detune.value).toBe(h.base - 60);
    }
  });
});

describe('opening-cinema sound design', () => {
  it('keeps the descent and aftershocks tonal instead of layering white-noise static', () => {
    const before = ctx.bufferSources.length;
    AUDIO.sfx('meteor_fall');
    AUDIO.sfx('aftershock');
    expect(ctx.bufferSources).toHaveLength(before);
    expect(ctx.oscillators.length).toBeGreaterThanOrEqual(5);
  });

  it('fades filtered impact texture in from silence instead of hard-starting it', () => {
    AUDIO.sfx('rumble');
    const source = ctx.bufferSources[ctx.bufferSources.length - 1];
    const filter = source?.outs[0] as FakeFilter | undefined;
    const gain = filter?.outs[0] as FakeGain | undefined;
    expect(gain?.gain.ops[0]).toEqual({ kind: 'set', value: 0.001 });
    expect(gain?.gain.ops[1]?.kind).toBe('expo');
    expect(gain?.gain.ops[1]?.value).toBeGreaterThan(0.001);
  });
});

describe('localized environmental accents', () => {
  it('renders a water lap as one short non-looping texture with tonal detail', () => {
    const sourcesBefore = ctx.bufferSources.length;
    const oscillatorsBefore = ctx.oscillators.length;
    AUDIO.sfx('water_lap');
    expect(ctx.bufferSources).toHaveLength(sourcesBefore + 1);
    expect(ctx.bufferSources[ctx.bufferSources.length - 1]?.loop).toBe(false);
    expect(ctx.oscillators.length - oscillatorsBefore).toBe(3);
  });
});
