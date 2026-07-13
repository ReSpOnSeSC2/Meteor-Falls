import { describe, expect, it } from 'vitest';
import { chapter7DoorLanding, locketAvailable, locketTemporarilyStolen, ownsStarLocket, type LocketState } from './ch7';

function state(flags: LocketState['flags'] = {}, keyItems = ['star_locket']): LocketState {
  return { flags, keyItems };
}

describe('Chapter 7 Star Locket availability', () => {
  it('requires permanent physical ownership', () => {
    expect(ownsStarLocket(state())).toBe(true);
    expect(locketAvailable(state({}, []))).toBe(false);
    expect(locketTemporarilyStolen(state({ ch7_locket_stolen: true }, []))).toBe(false);
  });

  it('is available before the heist and unavailable while stolen', () => {
    expect(locketAvailable(state())).toBe(true);
    expect(locketAvailable(state({ ch7_locket_stolen: true }))).toBe(false);
    expect(locketTemporarilyStolen(state({ ch7_locket_stolen: true }))).toBe(true);
  });

  it('recovers idempotently, including an interrupted save with both flags', () => {
    expect(locketAvailable(state({ ch7_locket_stolen: false, ch7_locket_recovered: true }))).toBe(true);
    expect(locketAvailable(state({ ch7_locket_stolen: true, ch7_locket_recovered: true }))).toBe(true);
    expect(locketTemporarilyStolen(state({ ch7_locket_stolen: true, ch7_locket_recovered: true }))).toBe(false);
  });
});

describe('Chapter 7 travel coordinates', () => {
  it('keeps fixed-point landings native for goThroughDoor to scale once', () => {
    expect(chapter7DoorLanding({ x: 8, y: 22 })).toEqual({ x: 136, y: 364 });
  });
});
