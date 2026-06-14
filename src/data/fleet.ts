/**
 * THE FLEET (S18 Movement 33, ADR-074) — §A4.10/§A5 the traversal capstone. The
 * control power (Jay's Puppet + Milo's Clicker) SCALES up the chapters (ADR-035
 * staging): cars → trucks/buses → boats → planes → subs/yachts. Water becomes
 * drivable terrain and air a traversal layer; the bigger craft are PURCHASED at
 * dealers/marinas/airfields/helipads (incl. on owned properties) as key-item
 * TITLES. The piloting RULES live in `src/engine/fleet.ts`; the boat/plane/sub
 * scenes ride the M26 `VEHICLE_SPECS` + the M27 control spine.
 *
 * The Ember-trail law holds (§A5): flying/sailing NEVER skips story — a craft
 * reaches VISITED nodes only, and new chapters still gate on the Embers.
 */
import type { VehicleClass, VehicleTerrain } from '../spritegen/vehicles';

/** ADR-035 staging — which terrain + classes the control power can pilot, by band */
export interface FleetStage {
  band: string;
  terrain: VehicleTerrain;
  classes: readonly VehicleClass[];
  note: string;
}

export const FLEET_STAGES: readonly FleetStage[] = [
  { band: 'ch3', terrain: 'road', classes: ['car'], note: 'The first borrow: Jay puppets a driver, the party rides a car.' },
  { band: 'ch5', terrain: 'road', classes: ['truck', 'bus', 'machine'], note: 'Bigger road craft — trucks, buses, the parade float, heavy machinery.' },
  { band: 'ch8', terrain: 'water', classes: ['boat'], note: 'Clicker the riverboat up Lotus Harbor; water becomes drivable.' },
  { band: 'ch10', terrain: 'air', classes: ['plane', 'heli'], note: 'The launch approach: planes + helicopters; air becomes a layer.' },
  { band: 'ch10', terrain: 'water', classes: ['sub'], note: 'Late marinas: the submarine adds a dive layer to the deep pockets.' },
];

/** where a craft is sold */
export type FleetVenue = 'dealer' | 'marina' | 'airfield' | 'helipad';

export interface CraftForSale {
  id: string;
  /** the VEHICLE_SPECS type it is */
  vehicleType: string;
  venue: FleetVenue;
  /** chapter band it becomes buyable */
  band: string;
  /** §A9 Fortune-Arc price */
  price: number;
  /** the key-item TITLE string ownership rides */
  title: string;
  /** the §A11 seller (one obsession) */
  seller: string;
  note: string;
}

const C = (c: CraftForSale): CraftForSale => c;

export const FLEET_CRAFT: Record<string, CraftForSale> = Object.fromEntries(
  [
    C({ id: 'comet_gt', vehicleType: 'race_car', venue: 'dealer', band: 'ch1', price: 8000, title: 'title_comet_gt',
      seller: 'Bert', note: "Bert's pre-loved lot, back room. \"She's got one careful owner and four careless ones. Runs like a dream you regret.\"" }),
    C({ id: 'river_dinghy', vehicleType: 'boat', venue: 'marina', band: 'ch8', price: 26000, title: 'title_river_dinghy',
      seller: 'the harbormaster', note: '"Hugs a river like she means it. Don\'t take her past the breakwater or I\'ll hear about it."' }),
    C({ id: 'starhopper', vehicleType: 'small_plane', venue: 'airfield', band: 'ch10', price: 1400000, title: 'title_starhopper',
      seller: "Roxanne (Bert's niece)", note: '"Needs a strip to land. She glides like a thrown brick, but she GLIDES."' }),
    C({ id: 'pearl_yacht', vehicleType: 'yacht', venue: 'marina', band: 'ch10', price: 9000000, title: 'title_pearl_yacht',
      seller: 'the harbormaster', note: '"Open water only — she draws too much for a river. Seats your whole crew and their guests."' }),
    C({ id: 'deep_marlin', vehicleType: 'submarine', venue: 'marina', band: 'ch10', price: 40000000, title: 'title_deep_marlin',
      seller: 'the harbormaster', note: '"She dives. The deep pockets nobody else reaches? Those. Mind the no-wake zones."' }),
    C({ id: 'sky_taxi', vehicleType: 'helicopter', venue: 'helipad', band: 'ch10', price: 3200000, title: 'title_sky_taxi',
      seller: 'Roxanne (Bert\'s niece)', note: '"Lands anywhere flat. No strip, no problem. A botched landing is just a funny story."' }),
  ].map((c) => [c.id, c]),
);

/** WATER depth a craft can travel (a dinghy hugs rivers; a yacht needs open water) */
export type Water = 'river' | 'open' | 'deep';
export const WATER_ACCESS: Record<string, readonly Water[]> = {
  boat: ['river', 'open'],
  yacht: ['open'],
  submarine: ['open', 'deep'],
};

/** AIR launch a craft needs (a jet needs a runway; a heli hovers off anything flat) */
export type Pad = 'runway' | 'helipad' | 'flat';
export const AIR_ACCESS: Record<string, readonly Pad[]> = {
  small_plane: ['runway'],
  fighter_jet: ['runway'],
  jumbo_jet: ['runway'],
  helicopter: ['helipad', 'flat'],
  blimp: ['helipad', 'flat'],
};
