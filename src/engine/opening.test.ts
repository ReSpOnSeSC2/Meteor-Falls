import { describe, expect, it, vi } from 'vitest';
import { captionTimelineMs, readableCaptionMs } from './cutscenePacing';
import {
  OPENING_CAMERA,
  OPENING_CAPTION_HOLDS,
  OPENING_CAPTIONS,
  openingPhase,
  playOpeningCameraLeg,
  type OpeningFlags,
} from './opening';

const F = (over: Partial<OpeningFlags> = {}): OpeningFlags => ({
  intro_done: false,
  op_fell: false,
  op_house: false,
  ...over,
});

describe('openingPhase', () => {
  it('starts the meteor on any incomplete Otterbrooke load without runtime-only launch data', () => {
    expect(openingPhase('otterbrook', F())).toBe(1);
  });

  it('resumes the house and hill substages from their durable flags', () => {
    expect(openingPhase('otterbrook', F({ op_fell: true }))).toBe(2);
    expect(openingPhase('otterbrook', F({ op_fell: true, op_house: true }))).toBe(3);
  });

  it('phase 4 is the bedroom wake after the hill cut', () => {
    expect(openingPhase('rex_bedroom', F({ op_fell: true, op_house: true }))).toBe(4);
  });

  it('never re-triggers once the intro is done', () => {
    const done = F({ intro_done: true, op_fell: true, op_house: true });
    for (const m of ['otterbrook', 'rex_bedroom', 'brickton']) {
      expect(openingPhase(m, done)).toBe(0);
    }
  });

  it('does nothing on unrelated maps / states', () => {
    expect(openingPhase('brickton', F({ op_fell: true }))).toBe(0);
    expect(openingPhase('rex_bedroom', F())).toBe(0); // before the house beat
  });
});

describe('opening cinematic direction', () => {
  it('holds the establishing card for at least five seconds at full opacity', () => {
    expect(OPENING_CAPTION_HOLDS.establishing).toBeGreaterThanOrEqual(5_000);
  });

  it('gives every auto-advancing line its full readable hold', () => {
    for (const id of Object.keys(OPENING_CAPTIONS) as Array<keyof typeof OPENING_CAPTIONS>) {
      expect(OPENING_CAPTION_HOLDS[id], id).toBeGreaterThanOrEqual(readableCaptionMs(OPENING_CAPTIONS[id]));
    }
  });

  it('keeps both hill legs continuous in position and zoom', () => {
    expect(OPENING_CAMERA.houseToTrail.to).toBe(OPENING_CAMERA.trailToCrater.from);
    expect(OPENING_CAMERA.houseToTrail.toZoom).toBe(OPENING_CAMERA.trailToCrater.fromZoom);
    expect(OPENING_CAMERA.houseToTrail.cutBefore).toBe(false);
    expect(OPENING_CAMERA.trailToCrater.cutBefore).toBe(false);
  });

  it('paces camera motion for the complete associated caption timelines', () => {
    expect(OPENING_CAMERA.meteorFallMs).toBeGreaterThanOrEqual(captionTimelineMs(OPENING_CAPTIONS.falling));
    expect(OPENING_CAMERA.houseToTrail.durationMs).toBeGreaterThanOrEqual(
      captionTimelineMs(OPENING_CAPTIONS.hillApproach),
    );
    expect(OPENING_CAMERA.trailToCrater.durationMs).toBeGreaterThanOrEqual(
      captionTimelineMs(OPENING_CAPTIONS.trailClimb)
      + OPENING_CAMERA.betweenHillLinesMs
      + captionTimelineMs(OPENING_CAPTIONS.craterGlow),
    );
  });

  it('does not finish a skipped narration beat until its physical pan completes', async () => {
    let updatePan: ((camera: unknown, progress: number) => void) | undefined;
    const camera = {
      pan: vi.fn((
        _x: number,
        _y: number,
        _ms?: number,
        _ease?: string | Function,
        _force?: boolean,
        callback?: (camera: unknown, progress: number) => void,
      ) => { updatePan = callback; }),
      zoomTo: vi.fn(),
    };
    const cameraMove = playOpeningCameraLeg(camera, 100, 200, 5_000, 0.8);
    let beatFinished = false;
    const beat = Promise.all([cameraMove, Promise.resolve()]).then(() => { beatFinished = true; });

    await Promise.resolve();
    expect(beatFinished).toBe(false);
    updatePan?.(camera, 0.5);
    await Promise.resolve();
    expect(beatFinished).toBe(false);
    updatePan?.(camera, 1);
    await beat;

    expect(beatFinished).toBe(true);
    expect(camera.pan).toHaveBeenCalledWith(100, 200, 5_000, 'Sine.easeInOut', true, expect.any(Function));
    expect(camera.zoomTo).toHaveBeenCalledWith(0.8, 5_000, 'Sine.easeInOut', true);
  });
});
