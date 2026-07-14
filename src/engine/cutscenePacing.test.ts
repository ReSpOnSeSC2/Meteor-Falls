import { describe, expect, it } from 'vitest';
import {
  captionTimelineMs,
  CINEMATIC_HELD_SKIP_GUARD_MS,
  CINEMATIC_TEXT_TIMING,
  readableCaptionMs,
  timedCaptionComplete,
} from './cutscenePacing';

describe('cinematic text pacing', () => {
  it('supports fresh taps and guarded held-advance across successive cards', () => {
    expect(timedCaptionComplete(0, 5000, { pressed: true, held: false })).toBe(true);
    expect(timedCaptionComplete(CINEMATIC_HELD_SKIP_GUARD_MS - 1, 5000, { pressed: false, held: true })).toBe(false);
    expect(timedCaptionComplete(CINEMATIC_HELD_SKIP_GUARD_MS, 5000, { pressed: false, held: true })).toBe(true);
    expect(timedCaptionComplete(5000, 5000, { pressed: false, held: false })).toBe(true);
  });
  it('gives even short captions an unhurried fully-visible hold', () => {
    expect(readableCaptionMs('A wrong star.')).toBeGreaterThanOrEqual(CINEMATIC_TEXT_TIMING.minimumHoldMs);
  });

  it('scales with copy length and treats an authored duration as a minimum', () => {
    const short = readableCaptionMs('Hickory Hill.');
    const long = readableCaptionMs('Something came down on the hill tonight, and it is still glowing up there.');

    expect(long).toBeGreaterThan(short);
    expect(readableCaptionMs('Otterbrooke, Ohio.', 5_200)).toBeGreaterThanOrEqual(5_200);
  });

  it('keeps fade time outside the readable hold', () => {
    const text = 'The trail climbs toward a light that was not there yesterday.';
    expect(captionTimelineMs(text)).toBe(
      CINEMATIC_TEXT_TIMING.liveFadeInMs
      + readableCaptionMs(text)
      + CINEMATIC_TEXT_TIMING.liveFadeOutMs,
    );
  });
});
