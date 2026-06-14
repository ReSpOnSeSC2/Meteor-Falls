/**
 * THE PROPERTY MARKET (S18 Movement 29, ADR-069) — §A4.13 deeds, agencies,
 * lawyers, and the flip. Real estate is a buyable, sellable, OWNABLE layer over
 * the world and the back-half wealth engine (§A9 Fortune Arc). This is the DATA
 * registry; the economy math lives in `src/engine/property.ts`, the agency/lawyer/
 * S&L interiors + the buy/sell UI land per chapter (M29 ships the spine; live
 * placement of 27 MAPLE is Otterbrook's, the rest are forward-looking specs).
 *
 * Ownership + loans ride ADR-015 FLAGS (`owned_<id>`, garnishPrincipal/Paid, the
 * price-walk seed); the only array-shaped state is per-home storage (the save's
 * `homeStorage`). A DEED is a key-item STRING (`deed_<id>`) the lawyer hands over
 * — flags, not an ITEMS row (no icon-gate burden; ADR-015 prefer-flags).
 */

export type PropertyKind = 'home' | 'shop' | 'rental' | 'flip';

export interface PropertyDef {
  id: string;
  /** the agent's listing name (one §A11 voice) */
  name: string;
  /** the chapter band the listing belongs to ('ch1'…'ch10') */
  band: string;
  /** the AREA_SKINS area it sits in (M25) */
  area: string;
  kind: PropertyKind;
  /** sticker price in 1995-to-far-future dollars (the price walk moves it) */
  basePrice: number;
  /** rent paid into Dad's deposits per chapter boundary (shop/rental only; 0 else) */
  rent: number;
  /** the deed key-item string the lawyer hands over on closing */
  deed: string;
  /** the agent's one-line in-voice blurb ("She took the doorknobs.") */
  blurb: string;
  /** storage capacity tier when owned (a starter chest → a manor footlocker) */
  storageTier: number;
  /** TRUE for the run-down buys whose whole point is renovate-furnish-flip */
  rundown?: boolean;
}

const P = (p: PropertyDef): PropertyDef => p;

export const PROPERTIES: Record<string, PropertyDef> = Object.fromEntries(
  [
    // ── CH.1 USA — placed LIVE this movement (Otterbrook) ──────────────────
    P({
      id: '27_maple', name: '27 Maple', band: 'ch1', area: 'otterbrook', kind: 'home',
      basePrice: 1200, rent: 0, deed: 'deed_27_maple', storageTier: 1,
      blurb: 'Cozy! One previous owner. She took the doorknobs. Comes with a beagle who thinks he comes with it.',
    }),
    P({
      id: 'brickton_walkup', band: 'ch1', name: 'The Brickton Walk-Up', area: 'brickton', kind: 'rental',
      basePrice: 2600, rent: 120, deed: 'deed_brickton_walkup', storageTier: 1,
      blurb: 'Cozy! Third-floor, no lift, great light if you stand on the radiator. Tenants pay on time, mostly.',
    }),
    P({
      id: 'maple_fixer', band: 'ch1', name: '29 Maple (the Fixer)', area: 'otterbrook', kind: 'flip',
      basePrice: 800, rent: 0, deed: 'deed_maple_fixer', storageTier: 1, rundown: true,
      blurb: 'Cozy — eventually! Needs love. And a floor. And the previous floor removed. Priced to move.',
    }),
    // ── CH.7 INDIA — HILLCREST MANOR (the user's mansion; placed when Ch.7 lands)
    P({
      id: 'hillcrest_manor', band: 'ch7', name: 'Hillcrest Manor', area: 'chandrapore', kind: 'home',
      basePrice: 480000, rent: 0, deed: 'deed_hillcrest', storageTier: 3,
      blurb: 'Cozy, if you squint and own a map. Bluff views. Eleven rooms. A ballroom nobody will admit to needing.',
    }),
    // ── forward-looking per-region homes + flips (the agency lists; placed later)
    P({
      id: 'foggybottom_flat', band: 'ch3', name: 'No. 9, Foggybottom', area: 'foggybottom', kind: 'home',
      basePrice: 4200, rent: 0, deed: 'deed_foggybottom_flat', storageTier: 2,
      blurb: 'Cozy! Damp counts as cozy here. The radiator knocks out a little tune. Tea included, technically.',
    }),
    P({
      id: 'zanzibel_shop', band: 'ch6', name: 'A Stall on Market Row', area: 'zanzibel', kind: 'shop',
      basePrice: 22000, rent: 900, deed: 'deed_zanzibel_shop', storageTier: 2,
      blurb: 'Cozy AND loud! Best music on the row. Sells itself, honestly. You just stand there and it sells.',
    }),
    P({
      id: 'valea_cottage', band: 'ch9', name: "Buni's Spare Cottage", area: 'valea', kind: 'home',
      basePrice: 60000, rent: 0, deed: 'deed_valea_cottage', storageTier: 2,
      blurb: 'Cozy! Painted gates, a plum tree, a grandmother two doors down who will feed you whether you like it or not.',
    }),
    P({
      id: 'hoaxula_park', band: 'ch9', name: 'Castle Hoaxula (as-is)', area: 'valea', kind: 'flip',
      basePrice: 35000, rent: 0, deed: 'deed_hoaxula_park', storageTier: 3, rundown: true,
      blurb: 'Cozy, in a spooky way! A bankrupt haunted-castle attraction. Real bats. Fake cobwebs. Endless potential.',
    }),
  ].map((p) => [p.id, p]),
);

/** the live properties placed this movement (the rest land with their chapters) */
export const LIVE_PROPERTIES: readonly string[] = ['27_maple', 'brickton_walkup', 'maple_fixer'];

export const PROPERTY_KINDS: readonly PropertyKind[] = ['home', 'shop', 'rental', 'flip'];
