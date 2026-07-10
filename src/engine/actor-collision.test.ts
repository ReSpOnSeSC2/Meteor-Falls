import { describe, expect, it } from 'vitest';
import {
  CHARACTER_FEET_OFFSET,
  DOG_DISPLAY_SCALE,
  NPC_FOOTPRINT,
  characterFeet,
  characterNativeScale,
  footRect,
  npcEffectiveScale,
  unitVectorOrZero,
} from './actor-collision';

describe('shared overworld character geometry', () => {
  it('converts authored anchors to the runtime feet position at native and runtime scale', () => {
    expect(characterFeet(4, 7)).toEqual({ x: 72, y: 134 });
    expect(characterFeet(4, 7, 64, 4)).toEqual({ x: 288, y: 536 });
    expect(CHARACTER_FEET_OFFSET).toEqual({ x: 8, y: 22 });
  });

  it('scales standard, dog, Minimus, and per-axis NPC footprints from the feet', () => {
    expect(npcEffectiveScale('brickton', false)).toEqual({ x: 1, y: 1 });
    expect(npcEffectiveScale('brickton', true)).toEqual({ x: DOG_DISPLAY_SCALE, y: DOG_DISPLAY_SCALE });
    expect(characterNativeScale('minimus_major')).toBe(0.5);
    expect(npcEffectiveScale('minimus_major', false, { x: 2, y: 0.5 })).toEqual({ x: 1, y: 0.25 });

    expect(footRect({ x: 100, y: 80 }, NPC_FOOTPRINT, { x: 0.5, y: 2 })).toEqual({
      x: 97,
      y: 60,
      w: 6,
      h: 20,
    });
  });

  it('never returns NaN when two actors occupy the same point', () => {
    expect(unitVectorOrZero(0, 0)).toEqual({ x: 0, y: 0 });
    expect(unitVectorOrZero(3, 4)).toEqual({ x: 0.6, y: 0.8 });
    expect(unitVectorOrZero(Number.NaN, 1)).toEqual({ x: 0, y: 0 });
  });
});
