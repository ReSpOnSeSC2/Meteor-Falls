/**
 * VEHICLE FERRYING (S20 Movement 46, ADR-087) — §A5 moving your car between
 * continents. You can't drive an ocean, so you LOAD it: in a jumbo jet's cargo
 * hold (AIR), onto a boat/yacht deck (SEA), or — for Mars — into the rocket. Pure,
 * tested logic the OverworldScene's airfield/marina/launch-pad UI drives.
 *
 *   · WITHIN a continent you just drive (same-continent → no ferry).
 *   · EARTH ↔ EARTH: air OR sea. Commercial freight is always available (pay the
 *     fee); owning a qualifying craft (a jumbo jet / a boat or yacht) makes it
 *     CHEAPER (you run it yourself).
 *   · ANY ↔ MARS: the ROCKET only — no commercial Mars freight; you must own/earn
 *     The Long Shot (M48).
 *   · THE EMBER LAW (§A5): you can only ferry to a VISITED continent.
 *
 * A car can only be DRIVEN on the continent it's parked on; ferrying moves its
 * location (`carLocation`, save v15).
 */
import { AREA_CONTINENT, CONTINENTS } from '../data/world';

export type FerryMethod = 'air' | 'sea' | 'rocket';

/** the continent an area sits on (null for an unknown area) */
export function continentOfArea(area: string): string | null {
  return AREA_CONTINENT[area] ?? null;
}

/** which methods CAN bridge two continents (ignoring what you own) */
export function ferryMethodsBetween(from: string, to: string): FerryMethod[] {
  if (from === to) return [];
  const a = CONTINENTS[from];
  const b = CONTINENTS[to];
  if (!a || !b) return [];
  if (!a.earth || !b.earth) return ['rocket']; // Mars is involved → rocket only
  return ['air', 'sea'];
}

/** the craft titles that satisfy each method (own one to ferry it yourself) */
export const METHOD_CRAFT: Record<FerryMethod, readonly string[]> = {
  air: ['title_jumbo_jet', 'title_starhopper'],   // a jet with a cargo hold
  sea: ['title_river_dinghy', 'title_pearl_yacht'], // a boat/yacht deck
  rocket: ['title_the_long_shot'],                 // the rocket (M48)
};

/** do you own a craft that flies/sails/launches `method`? */
export function ownsMethodCraft(method: FerryMethod, ownedTitles: readonly string[]): boolean {
  return METHOD_CRAFT[method].some((t) => ownedTitles.includes(t));
}

/** is there a commercial option for this method (air/sea freight; never Mars)? */
export function hasCommercial(method: FerryMethod): boolean {
  return method === 'air' || method === 'sea';
}

export type FerryReason = 'ok' | 'same_continent' | 'unknown' | 'not_visited' | 'needs_rocket';
export interface FerryCheck {
  ok: boolean;
  reason: FerryReason;
  /** the methods you could actually use right now (owned craft or commercial) */
  methods: FerryMethod[];
}

/**
 * Can you ferry a car from `from` to `to` right now? Honors the Ember law
 * (destination must be visited) and the Mars rule (rocket only, must be owned).
 */
export function canFerry(
  from: string, to: string, ownedTitles: readonly string[], visited: readonly string[],
): FerryCheck {
  if (from === to) return { ok: false, reason: 'same_continent', methods: [] };
  if (!CONTINENTS[from] || !CONTINENTS[to]) return { ok: false, reason: 'unknown', methods: [] };
  if (!visited.includes(to)) return { ok: false, reason: 'not_visited', methods: [] };
  const possible = ferryMethodsBetween(from, to);
  const usable = possible.filter((m) => ownsMethodCraft(m, ownedTitles) || hasCommercial(m));
  if (usable.length === 0) {
    // the only path is the rocket and you don't own it yet
    return { ok: false, reason: 'needs_rocket', methods: [] };
  }
  return { ok: true, reason: 'ok', methods: usable };
}

/* ─── COST ───────────────────────────────────────────────────────────────── */

/** base commercial freight fee by method (the rocket is dear; sea is the slow bargain) */
export const FERRY_BASE: Record<FerryMethod, number> = {
  sea: 1200, air: 4000, rocket: 250_000,
};
/** owning the craft drops the bill to this fraction (you run it yourself) */
export const OWN_CRAFT_DISCOUNT = 0.3;

/** the cash to ferry by `method`, cheaper if you own a qualifying craft */
export function ferryCost(method: FerryMethod, ownsCraft: boolean): number {
  return Math.round(FERRY_BASE[method] * (ownsCraft ? OWN_CRAFT_DISCOUNT : 1));
}

/** the cheapest usable method + its cost for a legal ferry (null if you can't) */
export function bestFerry(
  from: string, to: string, ownedTitles: readonly string[], visited: readonly string[],
): { method: FerryMethod; cost: number } | null {
  const check = canFerry(from, to, ownedTitles, visited);
  if (!check.ok) return null;
  let best: { method: FerryMethod; cost: number } | null = null;
  for (const m of check.methods) {
    const cost = ferryCost(m, ownsMethodCraft(m, ownedTitles));
    if (!best || cost < best.cost) best = { method: m, cost };
  }
  return best;
}

/** a car can only be DRIVEN where it's parked (its `carLocation` continent) */
export function carIsHere(carTitle: string, here: string, carLocation: Record<string, string>): boolean {
  return (carLocation[carTitle] ?? null) === here;
}
