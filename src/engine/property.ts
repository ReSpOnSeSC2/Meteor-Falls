/**
 * THE PROPERTY ECONOMY (S18 Movement 29, ADR-070) — §A4.13 buy / sell / finance /
 * rent / the seeded price walk. Pure, deterministic math (ADR-008 — same save +
 * same seed replays byte-equal): the agency, the lawyer's office, and the S&L loan
 * desk all read these functions; the OverworldScene owns the interiors + the UI.
 *
 * Ownership + loans ride ADR-015 flags; this module is stateless — it takes the
 * numbers and returns the numbers, so every rule is unit-testable.
 */
import { PROPERTIES, type PropertyDef } from '../data/properties';

/** the lawyer's cut on a sale ("the tenth part, for the pen") */
export const LAWYER_CUT = 0.1;
/** the S&L garnish: a quarter of every future Dad deposit repays a loan */
export const GARNISH_RATE = 0.25;
/** a loan clears at principal × this (the S&L's modest interest) */
export const LOAN_FACTOR = 1.1;
/** coziness (0–100) lifts a home's resale by up to this fraction (the flip hook) */
export const MAX_COZY_LIFT = 0.5;

/** 'ch3' → 3 ; 'cross' / junk → 1 (a sane floor) */
export function bandIndex(band: string): number {
  const m = /^ch(\d+)$/.exec(band);
  return m ? Number(m[1]) : 1;
}

const FNV = 0x811c9dc5;
function hash(s: string): number {
  let h = FNV;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/**
 * The seeded chapter-boundary price walk. Prices move ONCE per chapter boundary
 * after a property is listed, on a deterministic per-save walk: each step scales
 * by a factor in [0.90, 1.20) (mean ~1.05 — a gentle upward drift, the Fortune
 * Arc). `walkSeed` is the save's own seed so two saves diverge but one replays
 * byte-equal.
 */
export function walkedPrice(def: PropertyDef, chapter: number, walkSeed: number): number {
  const start = bandIndex(def.band);
  let price = def.basePrice;
  for (let c = start; c < chapter; c++) {
    const r = (hash(`${def.id}:${c}:${walkSeed}`) % 1000) / 1000; // [0,1)
    price *= 0.9 + 0.3 * r;
  }
  return Math.max(1, Math.round(price / 10) * 10);
}

/** the cash a CASH purchase costs right now (the down payment IS the price) */
export function buyCost(def: PropertyDef, chapter: number, walkSeed: number): number {
  return walkedPrice(def, chapter, walkSeed);
}

/**
 * The sale proceeds: the walked price, lifted by COZINESS (the furnished-flip
 * hook — M30 feeds the score), minus the lawyer's tenth. A run-down property only
 * reaches its full lift once it's been furnished (coziness > 0).
 */
export function sellProceeds(def: PropertyDef, chapter: number, walkSeed: number, coziness = 0): number {
  const base = walkedPrice(def, chapter, walkSeed);
  const lift = 1 + (Math.max(0, Math.min(100, coziness)) / 100) * MAX_COZY_LIFT;
  return Math.round(base * lift * (1 - LAWYER_CUT));
}

/* ─── FINANCING (the S&L loan desk) ──────────────────────────────────────── */

/** the amount that must be repaid to clear a loan of `principal` */
export function loanTarget(principal: number): number {
  return Math.ceil(principal * LOAN_FACTOR);
}

/** the garnish skimmed off one Dad deposit toward an active loan */
export function garnishFromDeposit(deposit: number, principal: number, paid: number): number {
  if (principal <= 0) return 0;
  const owed = Math.max(0, loanTarget(principal) - paid);
  return Math.min(owed, Math.floor(Math.max(0, deposit) * GARNISH_RATE));
}

/** TRUE once a loan is fully repaid (principal × 1.1 reached) */
export function loanCleared(principal: number, paid: number): boolean {
  return principal <= 0 || paid >= loanTarget(principal);
}

/** what's still owed on a loan */
export function loanRemaining(principal: number, paid: number): number {
  return Math.max(0, loanTarget(principal) - paid);
}

/* ─── RENT (owned shops/rentals pay into Dad's deposits at chapter flags) ─── */

/** the rent owed by a set of owned property ids at a chapter boundary */
export function rentAccrued(ownedIds: readonly string[]): number {
  let total = 0;
  for (const id of ownedIds) {
    const def = PROPERTIES[id];
    if (def && (def.kind === 'shop' || def.kind === 'rental')) total += def.rent;
  }
  return total;
}

/* ─── NET WORTH (the stats-page line; the callers are the real score) ─────── */

export interface NetWorthInput {
  cashOnHand: number;
  banked: number;
  ownedIds: readonly string[];
  chapter: number;
  walkSeed: number;
  /** coziness per owned home id (0 if unfurnished); raises that home's value */
  coziness?: Record<string, number>;
  /** active loan, if any */
  loanPrincipal?: number;
  loanPaid?: number;
}

export function netWorth(inp: NetWorthInput): number {
  let worth = inp.cashOnHand + inp.banked;
  for (const id of inp.ownedIds) {
    const def = PROPERTIES[id];
    if (!def) continue;
    const cozy = inp.coziness?.[id] ?? 0;
    const lift = 1 + (Math.max(0, Math.min(100, cozy)) / 100) * MAX_COZY_LIFT;
    worth += Math.round(walkedPrice(def, inp.chapter, inp.walkSeed) * lift);
  }
  worth -= loanRemaining(inp.loanPrincipal ?? 0, inp.loanPaid ?? 0);
  return worth;
}

/** the storage capacity (slots) an owned home grants by its tier */
export function storageSlots(def: PropertyDef): number {
  return def.storageTier * 20;
}
