/**
 * S15h — THE ITEMS MENU EXPLAINS ITSELF. The description panel reads a pure
 * (label + effect) blurb off every ItemDef; this proves no item is mute and
 * pins the plain-language shapes the player relies on (Offense +N, Heals about
 * N HP, In battle: …). The flavor lives in `item.text` (swept elsewhere) — this
 * guards the MECHANICS line, the part that must never make a player guess.
 */
import { describe, it, expect } from 'vitest';
import { ITEMS, itemKindLabel, itemEffectLine, boostStatLabel, equipSecondaryNote } from './items';
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

describe('S17 (ADR-061) — the catalog spine: bands, tonics, secondary notes', () => {
  it('every item carries a chapter band (§A8 per-region slice)', () => {
    for (const item of Object.values(ITEMS)) {
      expect(item.band, item.id).toBeTruthy();
    }
  });

  it('a tonic reads its permanent boost plainly (§A4.12)', () => {
    const tonic: ItemDef = { id: 'sudden_guts_pill', name: 'Sudden Guts Pill', kind: 'tonic', boost: { stat: 'guts', amount: 2 }, usableInBattle: false, price: 800, text: 'A pill. It dares you.', band: 'ch1' };
    expect(itemKindLabel(tonic)).toBe('TONIC');
    expect(itemEffectLine(tonic)).toBe('Permanently raises Guts by 2');
  });

  it('boostStatLabel names every boostable stat, max HP/PP plainly', () => {
    expect(boostStatLabel('hp')).toBe('max HP');
    expect(boostStatLabel('pp')).toBe('max PP');
    expect(boostStatLabel('vibe')).toBe('Vibe');
    expect(boostStatLabel('offense')).toBe('Offense');
  });

  it('equipSecondaryNote lists riders, and is empty for a single-stat classic', () => {
    expect(equipSecondaryNote(ITEMS.cracked_bat)).toBe(''); // a pure +Offense bat
    const bat: ItemDef = { id: 'x', name: 'X', kind: 'weapon', offense: 9, wielder: 'rex', bonus: { guts: 2 }, vibe: 3, usableInBattle: false, price: 0, text: '.', band: 'cross' };
    expect(equipSecondaryNote(bat)).toBe('(also +2 Guts, +3 Vibe)');
    const robe: ItemDef = { id: 'y', name: 'Y', kind: 'armor', defense: 4, resists: [{ element: 'fire', pct: 25 }], usableInBattle: false, price: 0, text: '.', band: 'cross' };
    expect(equipSecondaryNote(robe)).toBe('(also +25% fire resist)');
    expect(equipSecondaryNote(robe, { resists: false })).toBe(''); // STATUS shows resists on their own line
  });
});
