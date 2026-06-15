import { describe, expect, it } from 'vitest';
import { openingPhase, type OpeningFlags } from './opening';

const F = (over: Partial<OpeningFlags> = {}): OpeningFlags => ({
  intro_done: false,
  op_fell: false,
  op_house: false,
  ...over,
});

describe('openingPhase', () => {
  it('walks the four phases across the maps in order', () => {
    // phase 1: new game lands on hickory_hill with opening requested
    expect(openingPhase('hickory_hill', F(), true)).toBe(1);
    // phase 2: after the fall, on otterbrook
    expect(openingPhase('otterbrook', F({ op_fell: true }), false)).toBe(2);
    // phase 3: after the house, back on hickory_hill
    expect(openingPhase('hickory_hill', F({ op_fell: true, op_house: true }), false)).toBe(3);
    // phase 4: after the climb, in the bedroom
    expect(openingPhase('rex_bedroom', F({ op_fell: true, op_house: true }), false)).toBe(4);
  });

  it('never re-triggers once the intro is done', () => {
    const done = F({ intro_done: true, op_fell: true, op_house: true });
    for (const m of ['hickory_hill', 'otterbrook', 'rex_bedroom']) {
      expect(openingPhase(m, done, true)).toBe(0);
    }
  });

  it('phase 1 needs openingRequested — re-entering the hill mid-cinematic does not re-fire the fall', () => {
    // back on hickory_hill for the climb (op_fell + op_house): phase 3, not 1
    expect(openingPhase('hickory_hill', F({ op_fell: true, op_house: true }), false)).toBe(3);
    // hickory_hill with op_fell but NOT op_house and no opening flag → nothing (not 1)
    expect(openingPhase('hickory_hill', F({ op_fell: true }), false)).toBe(0);
  });

  it('does nothing on unrelated maps / states', () => {
    expect(openingPhase('brickton', F({ op_fell: true }), false)).toBe(0);
    expect(openingPhase('otterbrook', F(), false)).toBe(0); // before the fall
    expect(openingPhase('rex_bedroom', F(), false)).toBe(0); // before the house beat
  });
});
