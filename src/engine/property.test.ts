/**
 * S18 Movement 29 (ADR-069) — THE PROPERTY ECONOMY (§A4.13).
 *
 * Proves the buy/sell/finance/rent/price-walk math the agency, lawyer, and S&L
 * desk ride on — deterministic (ADR-008 byte-equal replay), and the flip loop
 * (coziness lifts resale) actually profits.
 */
import { describe, it, expect } from 'vitest';
import { PROPERTIES } from '../data/properties';
import {
  walkedPrice, buyCost, sellProceeds, LAWYER_CUT,
  loanTarget, garnishFromDeposit, loanCleared, loanRemaining,
  rentAccrued, netWorth, bandIndex,
} from './property';

const maple = PROPERTIES['27_maple'];
const fixer = PROPERTIES.maple_fixer;
const shop = PROPERTIES.zanzibel_shop;

describe('the price walk — deterministic + drifts upward', () => {
  it('same seed → identical price (ADR-008 byte-equal replay)', () => {
    expect(walkedPrice(maple, 5, 4104)).toBe(walkedPrice(maple, 5, 4104));
  });
  it('different seeds diverge', () => {
    const a = walkedPrice(maple, 8, 1);
    const b = walkedPrice(maple, 8, 999999);
    expect(a).not.toBe(b);
  });
  it('at the listing chapter the price is the sticker', () => {
    expect(walkedPrice(maple, bandIndex(maple.band), 4104)).toBe(maple.basePrice);
  });
});

describe('buy + sell (the lawyer takes the tenth)', () => {
  it('a cash buy costs the walked price', () => {
    expect(buyCost(maple, 3, 7)).toBe(walkedPrice(maple, 3, 7));
  });
  it('selling an unfurnished home nets the price minus the lawyer cut', () => {
    const price = walkedPrice(maple, 3, 7);
    expect(sellProceeds(maple, 3, 7, 0)).toBe(Math.round(price * (1 - LAWYER_CUT)));
  });
  it('THE FLIP — a furnished (cozy) sale beats an empty one', () => {
    const empty = sellProceeds(fixer, 4, 7, 0);
    const furnished = sellProceeds(fixer, 4, 7, 80);
    expect(furnished).toBeGreaterThan(empty);
  });
});

describe('financing (the S&L garnish)', () => {
  it('a loan clears at principal × 1.1', () => {
    expect(loanTarget(1000)).toBe(1100);
    expect(loanCleared(1000, 1100)).toBe(true);
    expect(loanCleared(1000, 1099)).toBe(false);
  });
  it('a deposit garnishes 25%, never more than what is owed', () => {
    expect(garnishFromDeposit(400, 1000, 0)).toBe(100);
    expect(garnishFromDeposit(100000, 1000, 0)).toBe(1100); // capped at the target
    expect(garnishFromDeposit(400, 1000, 1100)).toBe(0);    // already clear
  });
  it('remaining owed counts down to zero', () => {
    expect(loanRemaining(1000, 0)).toBe(1100);
    expect(loanRemaining(1000, 600)).toBe(500);
    expect(loanRemaining(1000, 2000)).toBe(0);
  });
});

describe('rent + net worth', () => {
  it('only shops/rentals pay rent', () => {
    expect(rentAccrued([shop.id])).toBe(shop.rent);
    expect(rentAccrued([maple.id])).toBe(0); // a home pays no rent
    expect(rentAccrued([shop.id, 'brickton_walkup'])).toBe(shop.rent + PROPERTIES.brickton_walkup.rent);
  });
  it('net worth sums cash + bank + owned value − loan', () => {
    const base = netWorth({ cashOnHand: 100, banked: 50, ownedIds: [], chapter: 3, walkSeed: 7 });
    expect(base).toBe(150);
    const withHome = netWorth({ cashOnHand: 100, banked: 50, ownedIds: [maple.id], chapter: 3, walkSeed: 7 });
    expect(withHome).toBe(150 + walkedPrice(maple, 3, 7));
    const withLoan = netWorth({ cashOnHand: 100, banked: 50, ownedIds: [], chapter: 3, walkSeed: 7, loanPrincipal: 1000, loanPaid: 0 });
    expect(withLoan).toBe(150 - 1100);
  });
});
