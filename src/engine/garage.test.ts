/**
 * S19 Movement 37 (ADR-078) — THE DEALERSHIP buy/sell + depreciation, and
 * Movement 38 (ADR-079) — the HOME GARAGE (capacity, park/pull, the active ride).
 *
 * Mirrors the content-validate `dealership` gate and proves the §A4.15 economy:
 * listings gate by chapter, the buy honors affordability + ownership, Bert's
 * depreciation always loses, and a bigger property holds more cars.
 */
import { describe, it, expect } from 'vitest';
import {
  carsForSale, carById, titleOf, ownsCar,
  resaleFactor, sellValue, buyCar, sellCar, canBuyCar,
  garageCapacity, garageContents, parkCar, pullCar, setActive,
} from './garage';
import { DEALERSHIP } from '../data/dealership';
import { PROPERTIES } from '../data/properties';
import { VEHICLE_SPECS } from '../spritegen/vehicles';

describe('the dealership — listings gate by chapter', () => {
  it('Ch.1 lists only the starter wheels; later cars wait for their band', () => {
    const ch1 = carsForSale(1).map((c) => c.id);
    expect(ch1).toContain('kids_bmx');
    expect(ch1).toContain('commuter');
    expect(ch1).not.toContain('the_nikolai'); // ch6
    expect(carsForSale(8).map((c) => c.id)).toContain('the_stretch'); // ch8 stretch limo
  });
  it('every listing is a real road vehicle (the both-directions law)', () => {
    for (const c of Object.values(DEALERSHIP)) {
      expect(VEHICLE_SPECS[c.vehicleType]?.terrain, `'${c.id}'`).toBe('road');
    }
  });
});

describe('ownership rides a title_* key-item', () => {
  it('titleOf / ownsCar read the key-item', () => {
    expect(titleOf('the_nikolai')).toBe('title_car_nikolai');
    expect(ownsCar('the_nikolai', [])).toBe(false);
    expect(ownsCar('the_nikolai', ['title_car_nikolai'])).toBe(true);
  });
  it('carById resolves the listing', () => {
    expect(carById('commuter')?.vehicleType).toBe('sedan');
    expect(carById('nope')).toBeNull();
  });
});

describe('the buy — affordability, listing, and not-already-owned', () => {
  it('a listed, affordable, unowned car buys and grants its title', () => {
    const r = buyCar('commuter', 6000, 1, []);
    expect(r).toEqual({ ok: true, reason: 'ok', cost: 5500, title: 'title_car_sedan' });
  });
  it("can't afford it → cant_afford, no title, no cost", () => {
    expect(buyCar('commuter', 100, 1, [])).toEqual({ ok: false, reason: 'cant_afford', cost: 0, title: null });
  });
  it('not listed yet → not_listed', () => {
    expect(buyCar('the_nikolai', 1_000_000, 1, []).reason).toBe('not_listed');
  });
  it('already owned → already_owned', () => {
    expect(buyCar('commuter', 6000, 1, ['title_car_sedan']).reason).toBe('already_owned');
  });
  it('an unknown id → unknown', () => {
    expect(buyCar('flying_carpet', 9e9, 10, []).reason).toBe('unknown');
  });
  it('canBuyCar mirrors buyCar.ok', () => {
    expect(canBuyCar(DEALERSHIP.commuter, 6000, 1, [])).toBe(true);
    expect(canBuyCar(DEALERSHIP.commuter, 10, 1, [])).toBe(false);
  });
});

describe('the sell — Bert keeps the tenth AND the new-car smell', () => {
  it('every car depreciates: trade-in is strictly less than the sticker', () => {
    for (const c of Object.values(DEALERSHIP)) {
      expect(resaleFactor(c)).toBeLessThan(1);
      expect(sellValue(c), `'${c.id}'`).toBeLessThan(c.price);
    }
  });
  it('a sale pays the depreciated value and surrenders the title (must be owned)', () => {
    const car = DEALERSHIP.commuter;
    expect(sellCar('commuter', [])).toEqual({ ok: false, proceeds: 0, title: null }); // not owned
    const r = sellCar('commuter', ['title_car_sedan']);
    expect(r.ok).toBe(true);
    expect(r.title).toBe('title_car_sedan');
    expect(r.proceeds).toBe(Math.round(car.price * resaleFactor(car)));
  });
  it('cheap early rides depreciate harder than dear exotics', () => {
    expect(resaleFactor(DEALERSHIP.kids_bmx)).toBeLessThan(resaleFactor(DEALERSHIP.the_stretch));
  });
});

/* ─── M38 — the home garage (capacity, park/pull, the active ride) ───────── */

describe('M38 (ADR-079) — the home garage', () => {
  it('capacity scales with the property storage tier; non-homes hold none', () => {
    expect(garageCapacity(PROPERTIES['27_maple'])).toBeGreaterThan(0);          // tier 1 starter
    expect(garageCapacity(PROPERTIES.hillcrest_manor)).toBeGreaterThan(
      garageCapacity(PROPERTIES['27_maple']),                                    // tier 3 manor holds more
    );
    expect(garageCapacity(PROPERTIES.brickton_walkup)).toBe(0);                  // a rental is no home garage
  });

  it('parks a car into a home garage, respecting capacity', () => {
    const garage: Record<string, string[]> = {};
    const cap = garageCapacity(PROPERTIES['27_maple']);
    expect(parkCar(garage, '27_maple', 'title_car_sedan', cap)).toBe(true);
    expect(garageContents(garage, '27_maple')).toEqual(['title_car_sedan']);
    expect(parkCar(garage, '27_maple', 'title_car_sedan', cap)).toBe(false); // no double-park
  });

  it('refuses to overfill a starter garage but a manor swallows more', () => {
    const garage: Record<string, string[]> = {};
    // a tiny cap of 1 proves the refusal cleanly
    expect(parkCar(garage, '27_maple', 'title_car_a', 1)).toBe(true);
    expect(parkCar(garage, '27_maple', 'title_car_b', 1)).toBe(false); // full
    // a manor's real capacity holds several
    const big: Record<string, string[]> = {};
    const cap = garageCapacity(PROPERTIES.hillcrest_manor);
    for (let i = 0; i < cap; i++) expect(parkCar(big, 'hillcrest_manor', `title_car_${i}`, cap)).toBe(true);
    expect(parkCar(big, 'hillcrest_manor', 'title_car_extra', cap)).toBe(false);
  });

  it('pulls a car back out of the garage', () => {
    const garage: Record<string, string[]> = { '27_maple': ['title_car_sedan', 'title_car_ev'] };
    expect(pullCar(garage, '27_maple', 'title_car_sedan')).toBe(true);
    expect(garageContents(garage, '27_maple')).toEqual(['title_car_ev']);
    expect(pullCar(garage, '27_maple', 'title_car_sedan')).toBe(false); // already gone
  });

  it('setActive picks a ride you own; refuses one you do not', () => {
    const owned = ['title_car_sedan', 'title_car_ev'];
    expect(setActive('title_car_sedan', owned)).toBe('title_car_sedan');
    expect(setActive('title_car_limo', owned)).toBeNull(); // not owned — no swap
    expect(setActive(null, owned)).toBeNull();             // park everything (drive nothing)
  });
});
