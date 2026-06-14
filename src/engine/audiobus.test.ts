import { describe, expect, it } from 'vitest';
import {
  AUDIO_BUSES,
  BUS_DEFAULTS,
  BUS_KEYS,
  CROSSFADE_MS,
  MUFFLE_GLIDE_S,
  MUFFLE_OPEN_HZ,
  clamp01,
  muffleCutoff,
  parseBusLevel,
} from './audiobus';

describe('audiobus — the muffle veil (#2 / ADR-100)', () => {
  it('level 0 is wide open (the lowpass is effectively off)', () => {
    expect(muffleCutoff(0)).toBe(MUFFLE_OPEN_HZ);
  });
  it('the cutoff steps strictly DOWN as the veil deepens', () => {
    expect(muffleCutoff(0)).toBeGreaterThan(muffleCutoff(1));
    expect(muffleCutoff(1)).toBeGreaterThan(muffleCutoff(2));
  });
  it('the deep veil lands at the spec ~800Hz', () => {
    expect(muffleCutoff(2)).toBe(800);
  });
  it('the glide is a brief positive time constant', () => {
    expect(MUFFLE_GLIDE_S).toBeGreaterThan(0);
    expect(MUFFLE_GLIDE_S).toBeLessThan(1);
  });
});

describe('audiobus — the volume buses (#7)', () => {
  it('clamp01 pins to [0,1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
  });
  it('parseBusLevel: null → fallback, garbage → fallback, value → clamped', () => {
    expect(parseBusLevel(null, 0.9)).toBe(0.9);
    expect(parseBusLevel('not-a-number', 0.5)).toBe(0.5);
    expect(parseBusLevel('0.25', 0.9)).toBe(0.25);
    expect(parseBusLevel('5', 0.9)).toBe(1); // over-range clamps
    expect(parseBusLevel('-3', 0.9)).toBe(0); // under-range clamps
  });
  it('every bus has a namespaced key + a default level in [0,1]', () => {
    for (const bus of AUDIO_BUSES) {
      expect(BUS_KEYS[bus]).toMatch(/^meteor-falls-vol-/);
      expect(BUS_DEFAULTS[bus]).toBeGreaterThanOrEqual(0);
      expect(BUS_DEFAULTS[bus]).toBeLessThanOrEqual(1);
    }
  });
  it('the bus keys are distinct and never collide with the legacy mute flag (migrates forward)', () => {
    const keys = Object.values(BUS_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain('meteor-falls-sound');
  });
  it('the crossfade is a sane positive duration', () => {
    expect(CROSSFADE_MS).toBeGreaterThan(0);
  });
});
