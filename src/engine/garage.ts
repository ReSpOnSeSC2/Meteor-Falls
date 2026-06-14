/**
 * THE GARAGE (S19 Movements 37–38, ADR-078/079) — pure buy/sell/own/park logic
 * for road vehicles. M37 (here): the dealership economy — listings by chapter,
 * the buy with the can-afford check, the SELL with Bert's depreciation curve
 * ("the tenth, and the new-car smell"), ownership by `title_*` key-item. M38
 * adds the home GARAGE (capacity by storage tier, park/pull, the active ride).
 *
 * Stateless math: it takes the numbers and the key-items and returns the result,
 * so every rule is unit-tested (`garage.test.ts`); the OverworldScene owns the
 * lot interior + the wheel UI. Ownership rides ADR-015 flags + a key-item title,
 * NOT the §A8 item catalog (no icon-gate burden).
 */
import { DEALERSHIP, type CarForSale } from '../data/dealership';

function bandIndex(band: string): number {
  return Number(/^ch(\d+)$/.exec(band)?.[1] ?? 1);
}

/* ─── LISTINGS + OWNERSHIP ───────────────────────────────────────────────── */

/** the cars Bert lists at or under `chapter` (band gates availability) */
export function carsForSale(chapter: number): CarForSale[] {
  return Object.values(DEALERSHIP).filter((c) => bandIndex(c.band) <= chapter);
}

/** the listing for an id, or null */
export function carById(id: string): CarForSale | null {
  return DEALERSHIP[id] ?? null;
}

/** the key-item TITLE you own a car by (parks in your garage once owned) */
export function titleOf(carId: string): string | null {
  return DEALERSHIP[carId]?.title ?? null;
}

/** do you own this car? (the title key-item is present) */
export function ownsCar(carId: string, keyItems: readonly string[]): boolean {
  const t = titleOf(carId);
  return t !== null && keyItems.includes(t);
}

/* ─── DEPRECIATION (Bert keeps the tenth AND the new-car smell) ───────────── */

/**
 * The resale factor by chapter band — a car ALWAYS sells back for less than the
 * sticker (the dealer always wins). Cheap early rides depreciate hardest; the
 * dear later exotics hold their value a little better, but never reach par.
 */
const RESALE_BY_BAND: Record<string, number> = {
  ch1: 0.45, ch2: 0.48, ch3: 0.5, ch4: 0.52, ch5: 0.55,
  ch6: 0.58, ch7: 0.6, ch8: 0.62, ch9: 0.64, ch10: 0.65,
};

/** the fraction of sticker a car sells back for (< 1 always — the depreciation) */
export function resaleFactor(car: CarForSale): number {
  return RESALE_BY_BAND[car.band] ?? 0.5;
}

/** the trade-in value of a car (its walked-down resale) */
export function sellValue(car: CarForSale): number {
  return Math.round(car.price * resaleFactor(car));
}

/* ─── THE BUY + THE SELL ─────────────────────────────────────────────────── */

export type BuyReason = 'ok' | 'unknown' | 'not_listed' | 'already_owned' | 'cant_afford';
export interface BuyResult {
  ok: boolean;
  reason: BuyReason;
  /** what the buy costs (the sticker) — 0 when it can't proceed */
  cost: number;
  /** the title to add to keyItems on a successful buy */
  title: string | null;
}

/** is the car listed yet AND affordable AND not already owned? */
export function canBuyCar(car: CarForSale, cashOnHand: number, chapter: number, keyItems: readonly string[] = []): boolean {
  return buyCar(car.id, cashOnHand, chapter, keyItems).ok;
}

/**
 * Resolve a buy: the precise reason it can/can't happen + the title to grant.
 * The scene applies it (deduct `cost`, push `title`, set the `owned_*` flag).
 */
export function buyCar(carId: string, cashOnHand: number, chapter: number, keyItems: readonly string[] = []): BuyResult {
  const car = DEALERSHIP[carId];
  if (!car) return { ok: false, reason: 'unknown', cost: 0, title: null };
  if (bandIndex(car.band) > chapter) return { ok: false, reason: 'not_listed', cost: 0, title: null };
  if (ownsCar(carId, keyItems)) return { ok: false, reason: 'already_owned', cost: 0, title: null };
  if (cashOnHand < car.price) return { ok: false, reason: 'cant_afford', cost: 0, title: null };
  return { ok: true, reason: 'ok', cost: car.price, title: car.title };
}

export interface SellResult {
  ok: boolean;
  /** the cash the trade-in pays out (depreciated) — 0 when it can't proceed */
  proceeds: number;
  /** the title to remove from keyItems on a successful sale */
  title: string | null;
}

/** resolve a sale: the depreciated payout + the title to surrender (must be owned) */
export function sellCar(carId: string, keyItems: readonly string[]): SellResult {
  const car = DEALERSHIP[carId];
  if (!car || !ownsCar(carId, keyItems)) return { ok: false, proceeds: 0, title: null };
  return { ok: true, proceeds: sellValue(car), title: car.title };
}
