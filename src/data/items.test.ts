/**
 * S15h — THE ITEMS MENU EXPLAINS ITSELF. The description panel reads a pure
 * (label + effect) blurb off every ItemDef; this proves no item is mute and
 * pins the plain-language shapes the player relies on (Offense +N, Heals about
 * N HP, In battle: …). The flavor lives in `item.text` (swept elsewhere) — this
 * guards the MECHANICS line, the part that must never make a player guess.
 */
import { describe, it, expect } from 'vitest';
import { ITEMS, itemKindLabel, itemEffectLine } from './items';
import type { ItemDef } from '../schemas';

const firstOf = (k: ItemDef['kind']): ItemDef | undefined => Object.values(ITEMS).find((i) => i.kind === k);

describe('S15h — every item yields a category + a plain-language effect', () => {
  it('no item is mute (label + effect non-empty for the whole catalog)', () => {
    for (const item of Object.values(ITEMS)) {
      expect(itemKindLabel(item), item.id).toBeTruthy();
      expect(itemEffectLine(item), item.id).toBeTruthy();
    }
  });

  it('equipment reads its stat; consumables read what they restore', () => {
    const w = firstOf('weapon');
    if (w) expect(itemEffectLine(w)).toBe(`Offense +${w.offense} when equipped`);
    const a = firstOf('armor');
    if (a) expect(itemEffectLine(a)).toBe(`Defense +${a.defense} when worn`);
    const f = firstOf('food');
    if (f) expect(itemEffectLine(f)).toMatch(/^Heals about \d+ HP$/);
    const pp = firstOf('pp');
    if (pp) expect(itemEffectLine(pp)).toMatch(/^Restores about \d+ PP$/);
  });

  it('battle items always say they are for battle', () => {
    for (const item of Object.values(ITEMS)) {
      if (item.kind === 'battle') {
        expect(itemEffectLine(item), item.id).toMatch(/^(In battle:|Use this during a battle)/);
      }
    }
  });

  it('the category label is a short ALL-CAPS tag', () => {
    for (const item of Object.values(ITEMS)) {
      expect(itemKindLabel(item), item.id).toMatch(/^[A-Z ]{3,12}$/);
    }
  });
});
