/**
 * S15h — THE ITEMS MENU EXPLAINS ITSELF. The description panel reads a pure
 * (label + effect) blurb off every ItemDef; this proves no item is mute and
 * pins the plain-language shapes the player relies on (Offense +N, Heals about
 * N HP, In battle: …). The flavor lives in `item.text` (swept elsewhere) — this
 * guards the MECHANICS line, the part that must never make a player guess.
 */
import { describe, it, expect } from 'vitest';
import { ITEMS, itemKindLabel, itemEffectLine, boostStatLabel, equipSecondaryNote, consumesOnUse, spiceFoodHeal, SPICE_BOX_MUL } from './items';
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

describe('S17 M19 (ADR-064) — THE OLD-WORLD CATALOG pours Ch.3/4/5', () => {
  const byBand = (b: string): ItemDef[] => Object.values(ITEMS).filter((i) => i.band === b);

  it('England, Norway, and Minimus each carry ≈40 items', () => {
    expect(byBand('ch3').length).toBeGreaterThanOrEqual(40);
    expect(byBand('ch4').length).toBeGreaterThanOrEqual(40);
    expect(byBand('ch5').length).toBeGreaterThanOrEqual(40);
  });

  it("Milo's gun ladder climbs (Pellet Popper → … → *Gauss Lobber*), all his", () => {
    const ladder = ['pellet_popper', 'spud_gun', 'double_barrel_sparker', 'gauss_lobber'];
    let last = 0;
    for (const id of ladder) {
      const it = ITEMS[id];
      expect(it.kind, id).toBe('weapon');
      expect(it.wielder, id).toBe('milo');
      expect(it.offense ?? 0, id).toBeGreaterThan(last); // each rung is a real upgrade
      last = it.offense ?? 0;
    }
    expect(ITEMS.gauss_lobber.price).toBe(0); // the boss-drop top is a drop, not stock
  });

  it("Pippa's KIT ladder climbs (Stamp Sling → … → *Royal Red Pen*), all hers", () => {
    const ladder = ['stamp_sling', 'needle_saber', 'thimble_bell', 'royal_red_pen'];
    let last = 0;
    for (const id of ladder) {
      const it = ITEMS[id];
      expect(it.kind, id).toBe('weapon');
      expect(it.wielder, id).toBe('pippa');
      expect(it.offense ?? 0, id).toBeGreaterThan(last);
      last = it.offense ?? 0;
    }
    expect(ITEMS.royal_red_pen.price).toBe(0); // the Minister's appointment, not merch
    expect(ITEMS.royal_red_pen.bonus).toEqual({ luck: 6 }); // her kit reads Luck/morale
  });

  it('THE FIRST RESIST PENDANTS carry freeze-resist DATA (the Cool Charm vs cold)', () => {
    // resist% is wired through heroResist + STATUS (ADR-061); the damage binding
    // defers to the chapter that lands (ADR-064) — but the DATA ships now, region-true
    expect(ITEMS.cool_charm.kind).toBe('charm');
    expect(ITEMS.cool_charm.resists).toEqual([{ element: 'freeze', pct: 25 }]);
    expect(ITEMS.fur_lined_hood.resists).toEqual([{ element: 'freeze', pct: 20 }]); // on armor too
  });

  it('the M19 tonics permanently raise their stat (§A4.12)', () => {
    expect(ITEMS.brain_food_lunch.boost).toEqual({ stat: 'vibe', amount: 3 });
    expect(ITEMS.growth_spurt_milk.boost).toEqual({ stat: 'hp', amount: 20 }); // the scale joke
    expect(ITEMS.charged_battery.boost).toEqual({ stat: 'pp', amount: 12 });
    expect(ITEMS.lucky_penny_tonic.boost).toEqual({ stat: 'luck', amount: 2 });
  });

  it('the §A8 hat-ladder rungs land (Cricket Cap / Fur-Lined Hood / Paper Crown)', () => {
    for (const id of ['cricket_cap', 'fur_lined_hood', 'paper_crown']) {
      expect(ITEMS[id].kind, id).toBe('armor');
      expect(ITEMS[id].defense ?? 0, id).toBeGreaterThan(0);
    }
  });

  it('THE LOST & FOUND OF IMPOSSIBLE SIZES seeds the cross-chain (band cross)', () => {
    for (const id of ['giant_button', 'impossible_berry', 'tiny_postcard']) {
      expect(ITEMS[id].band, id).toBe('cross'); // not a single region — it travels the world
    }
  });
});

describe('S17 M20 (ADR-065) — THE FAR-WORLD CATALOG pours Ch.6/7/8', () => {
  const byBand = (b: string): ItemDef[] => Object.values(ITEMS).filter((i) => i.band === b);

  it('Africa, India, and China each carry ≈40 items', () => {
    expect(byBand('ch6').length).toBeGreaterThanOrEqual(40);
    expect(byBand('ch7').length).toBeGreaterThanOrEqual(40);
    expect(byBand('ch8').length).toBeGreaterThanOrEqual(40);
  });

  it("the §A8 MID-RUNGS land, each wielder-tagged, the boss-drop tops priced 0", () => {
    // Jay's Aluminum → Hall-of-Famer, Mia's Cast-Iron → Chef's, Dorin's River Beads
    expect(ITEMS.aluminum_bat.wielder).toBe('rex');
    expect(ITEMS.cast_iron_pan.wielder).toBe('faye');
    expect(ITEMS.river_beads.wielder).toBe('dorin');
    expect(ITEMS.aluminum_bat.offense ?? 0).toBeLessThan(ITEMS.hall_of_famer_bat.offense ?? 0);
    expect(ITEMS.cast_iron_pan.offense ?? 0).toBeLessThan(ITEMS.chefs_pan.offense ?? 0);
    // the boss drops (Sphinx / Cobra Raja / Paper Dragon) are drops, not stock
    expect(ITEMS.hall_of_famer_bat.price).toBe(0);
    expect(ITEMS.chefs_pan.price).toBe(0);
    expect(ITEMS.paper_fan.price).toBe(0);
  });

  it('THE RIDDLE RING finally fills the §A8 "+10 Vibe" field (§A10 #13)', () => {
    expect(ITEMS.riddle_ring.kind).toBe('charm');
    expect(ITEMS.riddle_ring.vibe).toBe(10); // the field ADR-061 added, now used
    expect(ITEMS.riddle_ring.luck ?? 0).toBeGreaterThan(0); // still a charm (heroLuck)
  });

  it('the resist pendants carry volt + fire DATA (binding deferred, ADR-065)', () => {
    // the §A8 ELEMENTAL RESIST gear: M19 shipped freeze, M20 ships volt + fire.
    // resist% is summed by heroResist + shown in STATUS (ADR-061); the damage
    // binding still waits for the first chapter that LANDS with an elemental enemy.
    expect(ITEMS.rubber_brooch.resists).toEqual([{ element: 'volt', pct: 25 }]);
    expect(ITEMS.jade_salamander_charm.resists).toEqual([{ element: 'fire', pct: 25 }]);
  });

  it('the Spice Box + Scroll of Calm ship per the three M20 DECISIONS (data-only)', () => {
    // #15 Spice Box: a KEY with the "cooked foods heal +50%" flavor, NOT wired
    expect(ITEMS.spice_box.kind).toBe('key');
    // #17 Scroll of Calm: a Mushroomize cure, canonically REUSABLE (the cure-path
    // binding that RESPECTS reusable is deferred — like M19's reusable Defibrillator)
    expect(ITEMS.scroll_of_calm.cures).toContain('mushroomize');
    expect(ITEMS.scroll_of_calm.reusable).toBe(true);
    // the Mushroomize status (§A4.8) debuts here — a consumable cure tier too
    expect(ITEMS.spore_antidote.cures).toContain('mushroomize');
  });

  it('the M20 tonics permanently raise their stat, filling the §A4.12 Defense slot', () => {
    expect(ITEMS.turmeric_draught.boost).toEqual({ stat: 'defense', amount: 3 });
    expect(ITEMS.savanna_grit.boost).toEqual({ stat: 'guts', amount: 3 });
    expect(ITEMS.baobab_draught.boost).toEqual({ stat: 'hp', amount: 18 });
  });

  it('the §A8 hat-ladder rungs land (Turban of Calm / jeweled Pagri / Bamboo Hat)', () => {
    for (const id of ['turban_of_calm', 'jeweled_pagri', 'bamboo_hat']) {
      expect(ITEMS[id].kind, id).toBe('armor');
      expect(ITEMS[id].defense ?? 0, id).toBeGreaterThan(0);
    }
  });
});

describe('S17 M21 (ADR-091) — THE LAST-WORLD CATALOG pours Ch.9/10 + closes the §A8 ladders', () => {
  const byBand = (b: string): ItemDef[] => Object.values(ITEMS).filter((i) => i.band === b);

  it('Romania (~42) and the three-locale Ch.10 (~76) carry their pours; cross rounds to ~15', () => {
    expect(byBand('ch9').length).toBeGreaterThanOrEqual(42);
    expect(byBand('ch10').length).toBeGreaterThanOrEqual(70); // Alaska + Hawaii + Mars, a double pour
    expect(byBand('cross').length).toBeGreaterThanOrEqual(14);
  });

  it('the §A8 hero weapon TOPS CLOSE, each wielder-tagged and priced 0 (a drop/blessing)', () => {
    // Mia's THE HOLY PAN (ch9 monastery), Jay's CASEY'S LAST SWING (ch10 Mars drop),
    // Dorin's COMET BEAD (ch10, the 1/128 Null Walker chase). Each tops its line.
    expect(ITEMS.holy_pan.wielder).toBe('faye');
    expect(ITEMS.holy_pan.offense ?? 0).toBeGreaterThan(ITEMS.chefs_pan.offense ?? 0); // above the Ch.7 mid-top
    expect(ITEMS.caseys_last_swing.wielder).toBe('rex');
    expect(ITEMS.caseys_last_swing.offense ?? 0).toBeGreaterThan(ITEMS.hall_of_famer_bat.offense ?? 0);
    expect(ITEMS.comet_bead.wielder).toBe('dorin');
    expect(ITEMS.comet_bead.offense ?? 0).toBeGreaterThan(ITEMS.river_beads.offense ?? 0);
    expect(ITEMS.comet_bead.vibe).toBe(10); // the chase chase remembers; it carries Vibe
    for (const id of ['holy_pan', 'caseys_last_swing', 'comet_bead']) {
      expect(ITEMS[id].band, id).toMatch(/^ch(9|10)$/);
      expect(ITEMS[id].price, id).toBe(0);
    }
    // the Board of Legends — Jay's funniest sidegrade (§A10 #20), pure self-belief Luck
    expect(ITEMS.board_of_legends.wielder).toBe('rex');
    expect(ITEMS.board_of_legends.bonus).toEqual({ luck: 6 });
  });

  it('the HALLELUJAH BELL is the revival TOP — a full revive that WORKS today (§A4.12)', () => {
    expect(ITEMS.hallelujah_bell.kind).toBe('cure');
    expect(ITEMS.hallelujah_bell.cures).toContain('down'); // the LIVE revival path (ADR-061 §A4.12)
    expect(ITEMS.hallelujah_bell.heal ?? 0).toBeGreaterThanOrEqual(9999); // full revive
    expect(ITEMS.hallelujah_bell.reusable).toBeUndefined(); // consumed (unlike the deferred reusable line)
    // and the sincere Romania rung beneath it revives too (the monastery vigil)
    expect(ITEMS.vigil_candle.cures).toContain('down');
    expect(ITEMS.vigil_candle.heal ?? 0).toBeGreaterThan(0);
  });

  it("Buni's Mămăligă cu Brânză is the BEST HP/$ food in the whole catalog (§A8)", () => {
    const foods = Object.values(ITEMS).filter((i) => i.kind === 'food' && i.price > 0);
    const ratio = (i: ItemDef): number => (i.heal ?? 0) / i.price;
    const best = foods.reduce((a, b) => (ratio(b) > ratio(a) ? b : a));
    expect(best.id).toBe('mamaliga');
  });

  it('THE PLAYER\'S HOUSE KEY is the last item — a key, banded to the endgame, priced 0', () => {
    const key = ITEMS.players_house_key;
    expect(key.kind).toBe('key');
    expect(key.band).toBe('ch10'); // it matters at the very end (Mars → the walk home)
    expect(key.price).toBe(0);
  });

  it('Akutaq is poured in ALASKA, not Norway (§A8 / §A11.7 — its exact region)', () => {
    expect(ITEMS.akutaq.band).toBe('ch10');
    expect(ITEMS.akutaq.kind).toBe('food');
  });

  it('the §A8 ELEMENTAL RESIST set completes — Romania ships HOLY, the minibosses drop freeze + fire', () => {
    // M19 freeze · M20 volt+fire · M21 HOLY (the Saint\'s Medal) → all four exist as DATA
    expect(ITEMS.saints_medal.resists).toEqual([{ element: 'holy', pct: 25 }]);
    expect(ITEMS.sentinels_heart.resists).toEqual([{ element: 'freeze', pct: 40 }]); // Frost Sentinel drop
    expect(ITEMS.tiki_magma_charm.resists).toEqual([{ element: 'fire', pct: 40 }]); // Tiki Magma Golem drop
  });

  it('the cross-world chains seed their CATALOG pieces (band cross)', () => {
    // Mr. Click's Photo Album · Dad's Postcards · the Traveling Hint Stand · the
    // Homesong Recordings · more Lost & Found — the quest/system wiring stays for later
    for (const id of ['mr_click_photo', 'dads_postcard', 'folded_map', 'homesong_stem', 'minimus_spoon']) {
      expect(ITEMS[id].band, id).toBe('cross');
    }
    // the Homesong stems are KEYS that add pause-menu Locket layers
    expect(ITEMS.homesong_stem.kind).toBe('key');
  });

  it('the M21 tonics permanently raise their stat — the dearest, rarest in the game (§A4.12)', () => {
    expect(ITEMS.highland_honey.boost).toEqual({ stat: 'hp', amount: 24 }); // Romania
    expect(ITEMS.meteor_shard_tonic.boost).toEqual({ stat: 'vibe', amount: 5 }); // Mars — the rarest
    expect(ITEMS.red_planet_iron.boost).toEqual({ stat: 'offense', amount: 5 });
    // the Meteor Shard is the dearest thing in the catalog
    const dearest = Object.values(ITEMS).reduce((a, b) => (b.price > a.price ? b : a));
    expect(dearest.id).toBe('meteor_shard_tonic');
  });
});

/* ---- S18 M24 (ADR-094) — Debt #2: THE REUSABLE-CURE PATH (consumesOnUse) ---- */

describe('consumesOnUse — a reusable item survives use, a normal one is spent', () => {
  it('a normal consumable is consumed; a reusable cure/battle item is not', () => {
    expect(consumesOnUse(ITEMS.second_wind)).toBe(true); // a one-shot revive
    expect(consumesOnUse(ITEMS.corn_dog)).toBe(true); // a normal food
    expect(consumesOnUse(ITEMS.scroll_of_calm)).toBe(false); // §A10 #17 — reusable
    expect(consumesOnUse(ITEMS.camera_flash)).toBe(false); // a flash, not film
    expect(consumesOnUse(ITEMS.defibrillator)).toBe(false); // §A4.12 — reusable revive
  });

  it('the Defibrillator is the §A4.12 reusable revive (cures down, heals, never spent)', () => {
    const d = ITEMS.defibrillator;
    expect(d.kind).toBe('cure');
    expect(d.cures).toContain('down');
    expect(d.heal).toBeGreaterThan(0);
    expect(d.reusable).toBe(true);
    expect(d.usableInBattle).toBe(true);
  });

  it('every reusable item is a cure or a battle item (no reusable food/weapon)', () => {
    for (const it of Object.values(ITEMS)) {
      if (it.reusable === true) expect(['cure', 'battle'], it.id).toContain(it.kind);
    }
  });
});

/* ---- S18 M24 (ADR-094) — Debt #3: THE SPICE BOX food-multiplier ---- */

describe('spiceFoodHeal — the Spice Box makes cooked food heal +50% (§A10 #15)', () => {
  it('owning the box multiplies the heal; without it the food is plain', () => {
    expect(spiceFoodHeal(60, false)).toBe(60);
    expect(spiceFoodHeal(60, true)).toBe(Math.round(60 * SPICE_BOX_MUL));
    expect(spiceFoodHeal(60, true)).toBe(90);
  });

  it('the multiplier is exactly the §A10 +50% and rounds cleanly', () => {
    expect(SPICE_BOX_MUL).toBe(1.5);
    expect(spiceFoodHeal(45, true)).toBe(68); // round(67.5)
    expect(spiceFoodHeal(1, true)).toBe(2); // round(1.5) — never lost
  });

  it('the Spice Box is the §A10 #15 key item it keys off', () => {
    expect(ITEMS.spice_box.kind).toBe('key');
  });
});
