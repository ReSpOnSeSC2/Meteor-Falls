import { describe, expect, it } from 'vitest';
import { openingPhase, type OpeningFlags } from './opening';

const F = (over: Partial<OpeningFlags> = {}): OpeningFlags => ({
  intro_done: false,
  op_fell: false,
  op_house: false,
  ...over,
});

describe('openingPhase', () => {
  it('phase 1 is the whole on-map cinematic (meteor-fall → house pan → climb) on otterbrook', () => {
    // new game lands on otterbrook — the crater is on this one elevated map now
    expect(openingPhase('otterbrook', F(), true)).toBe(1);
  });

  it('phase 4 is the bedroom wake, after the phase-1 sequence set op_house', () => {
    expect(openingPhase('rex_bedroom', F({ op_fell: true, op_house: true }), false)).toBe(4);
  });

  it('phases 2 & 3 are folded INTO phase 1 (run inline, never separately dispatched)', () => {
    // the mid-sequence otterbrook states never re-dispatch (the whole thing runs in phase 1)
    expect(openingPhase('otterbrook', F({ op_fell: true }), false)).toBe(0);
    expect(openingPhase('otterbrook', F({ op_fell: true, op_house: true }), false)).toBe(0);
  });

  it('phase 1 needs openingRequested + !op_fell (re-entering otterbrook never re-fires the fall)', () => {
    expect(openingPhase('otterbrook', F(), false)).toBe(0); // no opening flag
    expect(openingPhase('otterbrook', F({ op_fell: true }), true)).toBe(0); // already fell
  });

  it('never re-triggers once the intro is done', () => {
    const done = F({ intro_done: true, op_fell: true, op_house: true });
    for (const m of ['otterbrook', 'rex_bedroom', 'brickton']) {
      expect(openingPhase(m, done, true)).toBe(0);
    }
  });

  it('does nothing on unrelated maps / states', () => {
    expect(openingPhase('brickton', F({ op_fell: true }), false)).toBe(0);
    expect(openingPhase('rex_bedroom', F(), false)).toBe(0); // before the house beat
  });
});
