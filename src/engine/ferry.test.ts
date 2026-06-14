/**
 * S20 Movement 46 (ADR-087) — THE WORLD MAP + VEHICLE FERRYING. Mirrors the
 * `world` gate and proves the §A5 rules: drive within a continent, ferry between
 * (air/sea, cheaper if you own a craft), Mars only by rocket, visited-only.
 */
import { describe, it, expect } from 'vitest';
import {
  continentOfArea, ferryMethodsBetween, ownsMethodCraft, canFerry,
  ferryCost, bestFerry, carIsHere, FERRY_BASE, OWN_CRAFT_DISCOUNT,
} from './ferry';
import { CONTINENTS, AREA_CONTINENT, CONTINENT_IDS } from '../data/world';
import { CANON_AREAS } from '../spritegen/buildings';
import { PROPERTIES } from '../data/properties';

describe('the world map — areas group into continents', () => {
  it('every canon area lives on exactly one continent', () => {
    for (const a of CANON_AREAS) expect(AREA_CONTINENT[a], `area '${a}'`).toBeDefined();
  });
  it('continentOfArea reads the map', () => {
    expect(continentOfArea('otterbrook')).toBe('usa');
    expect(continentOfArea('mars')).toBe('mars');
    expect(continentOfArea('nowhere')).toBeNull();
  });
  it('Mars is the only off-Earth continent', () => {
    expect(Object.values(CONTINENTS).filter((c) => !c.earth).map((c) => c.id)).toEqual(['mars']);
  });
  it('M47 (ADR-088): every continent has at least one buyable property (incl. Mars)', () => {
    const withProp = new Set(Object.values(PROPERTIES).map((p) => AREA_CONTINENT[p.area]).filter(Boolean));
    for (const id of CONTINENT_IDS) expect(withProp.has(id), `continent '${id}' has no property`).toBe(true);
    // and the Mars billionaire pad is the dearest thing in the game
    const mars = PROPERTIES.mars_habitat;
    expect(mars).toBeDefined();
    expect(Math.max(...Object.values(PROPERTIES).map((p) => p.basePrice))).toBe(mars.basePrice);
  });
});

describe('which methods bridge two continents', () => {
  it('same continent → no ferry (just drive)', () => {
    expect(ferryMethodsBetween('usa', 'usa')).toEqual([]);
  });
  it('Earth ↔ Earth → air or sea', () => {
    expect(ferryMethodsBetween('usa', 'england')).toEqual(['air', 'sea']);
  });
  it('anything ↔ Mars → rocket only', () => {
    expect(ferryMethodsBetween('usa', 'mars')).toEqual(['rocket']);
    expect(ferryMethodsBetween('mars', 'china')).toEqual(['rocket']);
  });
});

describe('canFerry — Ember law + the Mars rule', () => {
  const visitedEarth = ['usa', 'england', 'china'];
  it('refuses an unvisited continent (the Ember trail still gates)', () => {
    expect(canFerry('usa', 'india', [], visitedEarth).reason).toBe('not_visited');
  });
  it('Earth→Earth always works via commercial freight (own nothing)', () => {
    const c = canFerry('usa', 'england', [], visitedEarth);
    expect(c.ok).toBe(true);
    expect(c.methods).toEqual(['air', 'sea']);
  });
  it('Mars needs the rocket — commercial freight does not fly to Mars', () => {
    const visited = [...visitedEarth, 'mars'];
    expect(canFerry('usa', 'mars', [], visited).reason).toBe('needs_rocket');
    expect(canFerry('usa', 'mars', ['title_the_long_shot'], visited).ok).toBe(true);
  });
  it('same continent is not a ferry', () => {
    expect(canFerry('usa', 'usa', [], visitedEarth).reason).toBe('same_continent');
  });
});

describe('ferry cost — own the craft, pay far less', () => {
  it('owning a qualifying craft discounts the fare', () => {
    expect(ferryCost('air', false)).toBe(FERRY_BASE.air);
    expect(ferryCost('air', true)).toBe(Math.round(FERRY_BASE.air * OWN_CRAFT_DISCOUNT));
    expect(ownsMethodCraft('air', ['title_jumbo_jet'])).toBe(true);
    expect(ownsMethodCraft('sea', ['title_pearl_yacht'])).toBe(true);
  });
  it('bestFerry picks the cheapest usable method', () => {
    // sea is the bargain commercial option Earth→Earth
    const best = bestFerry('usa', 'england', [], ['usa', 'england']);
    expect(best?.method).toBe('sea');
    expect(best?.cost).toBe(FERRY_BASE.sea);
  });
  it('the rocket is the dear option, and Mars has no cheaper alternative', () => {
    const best = bestFerry('usa', 'mars', ['title_the_long_shot'], ['usa', 'mars']);
    expect(best?.method).toBe('rocket');
    expect(best?.cost).toBe(Math.round(FERRY_BASE.rocket * OWN_CRAFT_DISCOUNT));
  });
});

describe('a car can only be driven where it is parked', () => {
  it('carIsHere reads the location map', () => {
    const loc = { title_car_sedan: 'usa', title_car_nikolai: 'mars' };
    expect(carIsHere('title_car_sedan', 'usa', loc)).toBe(true);
    expect(carIsHere('title_car_sedan', 'england', loc)).toBe(false); // it's back home in the USA
    expect(carIsHere('title_car_nikolai', 'mars', loc)).toBe(true);
    expect(carIsHere('title_unknown', 'usa', loc)).toBe(false);
  });
});
