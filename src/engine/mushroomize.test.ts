import { describe, expect, it } from 'vitest';
import { GS, freshMushroomize, type MushroomizeRecovery } from './state';
import { ITEMS, consumesOnUse } from '../data/items';
import {
  applyMushroomize,
  cureMushroomize,
  recordMushroomizeRecovery,
  recoverMushroomizedParty,
  resolveMushroomizeCureUse,
  transformMushroomizedDirection,
} from './mushroomize';

const safe: MushroomizeRecovery = {
  map: 'spore_forest', x: 17 * 16 + 8, y: 70 * 16 + 12, facing: 'up',
};

describe('Mushroomized direction transform', () => {
  it.each([
    [0, { x: 0, y: -1 }, { x: 1, y: 0 }],
    [1, { x: 0, y: -1 }, { x: -1, y: 0 }],
    [2, { x: 0, y: -1 }, { x: 0, y: 1 }],
    [0, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }],
    [1, { x: 0.5, y: 0.5 }, { x: 0.5, y: -0.5 }],
    [2, { x: 0.5, y: 0.5 }, { x: -0.5, y: -0.5 }],
  ] as const)('applies deterministic phase %s', (phase, input, expected) => {
    expect(transformMushroomizedDirection(input, {
      active: true, phase, source: `mushroomize_${phase}`, recovery: safe,
    })).toEqual(expected);
  });

  it('does nothing while inactive and never mutates INPUT.dir() output', () => {
    const input = { x: -0.25, y: 1 };
    const output = transformMushroomizedDirection(input, freshMushroomize());
    expect(output).toEqual(input);
    expect(output).not.toBe(input);
  });
});

describe('Mushroomized persistence domain', () => {
  it('latches the first hazard phase/source/recovery until cured', () => {
    const first = applyMushroomize(freshMushroomize(), {
      phase: 0, source: 'mushroomize_0', recovery: safe,
    });
    const overlapped = applyMushroomize(first, {
      phase: 2, source: 'mushroomize_2',
      recovery: { ...safe, x: 999 },
    });
    expect(overlapped).toEqual(first);
    expect(overlapped).not.toBe(first);
  });

  it('records a clean recovery before exposure and preserves it during exposure', () => {
    const clean = recordMushroomizeRecovery(freshMushroomize(), safe);
    const active = applyMushroomize(clean, {
      phase: 1, source: 'spore_puffer', recovery: clean.recovery!,
    });
    expect(recordMushroomizeRecovery(active, { ...safe, x: 999 })).toEqual(active);
    const recovered = recoverMushroomizedParty(active);
    expect(recovered.recovery).toEqual(safe);
    expect(recovered.state).toEqual(freshMushroomize());
  });

  it('reports whether a cure did real work and clears every latched field', () => {
    expect(cureMushroomize(freshMushroomize()).cured).toBe(false);
    const active = applyMushroomize(freshMushroomize(), {
      phase: 2, source: 'mushroomize_2', recovery: safe,
    });
    expect(cureMushroomize(active)).toEqual({ state: freshMushroomize(), cured: true });
  });

  it('persists its latched phase/source/recovery through the real save round-trip', () => {
    GS.reset();
    GS.data.mushroomize = applyMushroomize(freshMushroomize(), {
      phase: 1, source: 'mushroomize_1', recovery: safe,
    });
    const exact = JSON.parse(JSON.stringify(GS.data.mushroomize));
    GS.deserialize(GS.serialize());
    expect(GS.data.mushroomize).toEqual(exact);
  });

  it('pairs the consumable antidote and reusable Scroll with the same real cure token', () => {
    expect(ITEMS.spore_antidote.cures).toContain('mushroomize');
    expect(consumesOnUse(ITEMS.spore_antidote)).toBe(true);
    expect(ITEMS.scroll_of_calm.cures).toContain('mushroomize');
    expect(consumesOnUse(ITEMS.scroll_of_calm)).toBe(false);

    const active = applyMushroomize(freshMushroomize(), {
      phase: 0, source: 'spore_puffer', recovery: safe,
    });
    expect(resolveMushroomizeCureUse(active, consumesOnUse(ITEMS.spore_antidote))).toMatchObject({
      cured: true, consumeItem: true,
    });
    expect(resolveMushroomizeCureUse(active, consumesOnUse(ITEMS.scroll_of_calm))).toMatchObject({
      cured: true, consumeItem: false,
    });
    expect(resolveMushroomizeCureUse(freshMushroomize(), true)).toMatchObject({
      cured: false, consumeItem: false,
    });
  });
});
