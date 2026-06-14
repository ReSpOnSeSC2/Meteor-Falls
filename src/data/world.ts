/**
 * THE WORLD MAP — CONTINENTS (S20 Movement 46, ADR-087) — §A5 the landmasses the
 * 17 areas group into. You DRIVE freely WITHIN a continent (the areas there are
 * road/door-connected); you cannot drive an ocean — to take your car to another
 * continent you FERRY it (load it in a jumbo jet's cargo hold or onto a boat;
 * Mars needs the rocket). The ferry rules live in `src/engine/ferry.ts`.
 *
 * The Ember trail (§A5) is untouched: ferrying reaches only VISITED continents,
 * and new chapters still gate on the Embers. This is the wealth/free-roam layer.
 */

export interface Continent {
  id: string;
  /** the diegetic name (an area banner, never a chapter number — §A11.6) */
  name: string;
  /** the AREA_SKINS areas that sit on this landmass (drive between them) */
  areas: readonly string[];
  /** Earth landmass (air/sea ferry) vs. Mars (rocket only) */
  earth: boolean;
}

const K = (c: Continent): Continent => c;

export const CONTINENTS: Record<string, Continent> = Object.fromEntries(
  [
    K({ id: 'usa', name: 'America', areas: ['otterbrook', 'brickton', 'cage_park', 'golf_resort'], earth: true }),
    K({ id: 'south_america', name: 'Costa Estrella', areas: ['puerto_sol'], earth: true }),
    K({ id: 'england', name: 'England', areas: ['foggybottom', 'wintermoor'], earth: true }),
    K({ id: 'norway', name: 'Norway', areas: ['kvisthavn', 'lilleby'], earth: true }),
    K({ id: 'minimus', name: 'The Grand Duchy of Minimus', areas: ['minimus'], earth: true }),
    K({ id: 'africa', name: 'Zanzibel', areas: ['zanzibel'], earth: true }),
    K({ id: 'india', name: 'Chandrapore', areas: ['chandrapore'], earth: true }),
    K({ id: 'china', name: 'Lotus Harbor', areas: ['lotus_harbor'], earth: true }),
    K({ id: 'romania', name: 'Valea Stelelor', areas: ['valea'], earth: true }),
    K({ id: 'alaska', name: 'Aurora Station', areas: ['aurora'], earth: true }),
    K({ id: 'hawaii', name: 'Mauna Lani', areas: ['mauna_lani'], earth: true }),
    K({ id: 'mars', name: 'Mars — The Sea of Silence', areas: ['mars'], earth: false }),
  ].map((c) => [c.id, c]),
);

/** area → continent id (derived from CONTINENTS; the validator pins full coverage) */
export const AREA_CONTINENT: Record<string, string> = Object.fromEntries(
  Object.values(CONTINENTS).flatMap((c) => c.areas.map((a) => [a, c.id])),
);

export const CONTINENT_IDS: readonly string[] = Object.keys(CONTINENTS);
