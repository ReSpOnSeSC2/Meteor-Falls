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

describe('S17 M18 (ADR-063) — THE AMERICAS CATALOG pours real items', () => {
  it('Ch.1 + Ch.2 each carry ≈40 items, every one banded right', () => {
    const byBand = (b: string): ItemDef[] => Object.values(ITEMS).filter((i) => i.band === b);
    expect(byBand('ch1').length).toBeGreaterThanOrEqual(40);
    expect(byBand('ch2').length).toBeGreaterThanOrEqual(40);
  });

  it('the §A4.12 REVIVAL LINE floor + rung revive (any cure listing "down")', () => {
    // Second Wind (cheap, a sliver) → Guardian-Angel Feather (mid) — both revive
    // because they list 'down', healing by their own value (ADR-061 generalised)
    for (const id of ['second_wind', 'guardian_angel_feather']) {
      const it = ITEMS[id];
      expect(it.kind, id).toBe('cure');
      expect(it.cures, id).toContain('down');
      expect(it.heal ?? 0, id).toBeGreaterThan(0);
    }
    expect((ITEMS.guardian_angel_feather.heal ?? 0)).toBeGreaterThan(ITEMS.second_wind.heal ?? 0);
  });

  it('the first tonics permanently raise a stat (§A4.12)', () => {
    expect(ITEMS.sudden_guts_pill.kind).toBe('tonic');
    expect(ITEMS.sudden_guts_pill.boost).toEqual({ stat: 'guts', amount: 4 });
    expect(ITEMS.speed_demon_soda.boost).toEqual({ stat: 'speed', amount: 3 });
  });

  it('the PORCH + MERCADO SETs are five hero-tagged luck charms each', () => {
    const porch = ['firefly_jar', 'wind_chime_charm', 'whittled_whistle', 'bottle_cap_medallion', 'lucky_acorn'];
    const mercado = ['friendship_bracelet', 'evil_eye_bead', 'brass_gear_charm', 'tin_milagro', 'jade_frog'];
    const wielders = new Set(['rex', 'faye', 'milo', 'dorin', 'pippa']);
    for (const set of [porch, mercado]) {
      expect(set.length).toBe(5);
      expect(new Set(set.map((id) => ITEMS[id].wielder))).toEqual(wielders); // one per hero
      for (const id of set) {
        const it = ITEMS[id];
        expect(it.kind, id).toBe('charm');
        expect(it.luck ?? 0, id).toBeGreaterThan(0); // luck primary
        expect(it.price, id).toBe(0); // a title, not stock
      }
    }
    // the Firefly Jar keeps Glint — a small Vibe rider is canon-sweet
    expect(ITEMS.firefly_jar.vibe).toBeGreaterThan(0);
  });

  it('the weapon sidegrades are personal, the foam finger is pure self-belief', () => {
    expect(ITEMS.foam_finger.wielder).toBe('rex');
    expect(ITEMS.foam_finger.bonus).toEqual({ luck: 8 });
    expect(ITEMS.foam_finger.offense).toBe(1); // you're not hitting anything
    expect(ITEMS.nonstick_pan.wielder).toBe('faye');
  });
});
