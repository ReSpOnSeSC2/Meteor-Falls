/**
 * THE CAR DEALERSHIP (S19 Movement 37, ADR-078) — §A4.15 the road-vehicle
 * counterpart to the property agency / the marina. Bert's lot lists the region's
 * road vehicles for sale; the buy/sell + depreciation MATH lives in
 * `src/engine/garage.ts` (pure, tested), the home GARAGE that holds them is M38,
 * and the lot interior + UI land per chapter. This is the DATA registry.
 *
 * Ownership rides the fleet pattern: a `title_*` key-item + an `owned_*` flag —
 * no item-catalog band-floor burden (ADR-015 prefer-flags). A car is a real
 * `VEHICLE_SPECS` ROAD type; the validator's `dealership` gate pins it both ways.
 *
 * BERT — one §A11 obsession: the NEW-CAR SMELL. He huffs it, bottles it, and
 * mourns the moment it leaves the lot (which is exactly why a car you sell back
 * is worth less than you paid — "the tenth, and the smell").
 */

export interface CarForSale {
  id: string;
  /** player-facing model name; never derive UI copy from the engine id */
  displayName: string;
  /** the VEHICLE_SPECS road type it is */
  vehicleType: string;
  /** the chapter band it becomes listed ('ch1'…'ch10') */
  band: string;
  /** §A9 Fortune-Arc sticker price */
  price: number;
  /** the key-item TITLE ownership rides (parks in your garage once bought) */
  title: string;
  /** the §A11 seller (one obsession — the new-car smell) */
  dealer: string;
  /** Bert's honest used-car patter (never generic) */
  note: string;
}

const C = (c: CarForSale): CarForSale => c;

export const DEALERSHIP: Record<string, CarForSale> = Object.fromEntries(
  [
    // ── starter wheels (Ch.1 — a kid's first ride) ─────────────────────────
    C({ id: 'kids_bmx', displayName: 'Red BMX', vehicleType: 'bmx', band: 'ch1', price: 90, title: 'title_car_bmx',
      dealer: 'Bert', note: '"My nephew outgrew it. Pegs included. Smells like a garage and a thousand summers."' }),
    C({ id: 'ten_speed', displayName: 'Ten-Speed', vehicleType: 'road_bike', band: 'ch1', price: 240, title: 'title_car_road_bike',
      dealer: 'Bert', note: '"Light as a rumor. Whoever owned her last waxed the chain. I respect that. I do not understand it."' }),
    C({ id: 'old_reliable', displayName: 'Old Reliable', vehicleType: 'motorcycle', band: 'ch1', price: 2600, title: 'title_car_motorcycle',
      dealer: 'Bert', note: '"One careful owner who is now afraid of it. Starts every time. Stops most times."' }),
    C({ id: 'commuter', displayName: 'Comet Sedan', vehicleType: 'sedan', band: 'ch1', price: 5500, title: 'title_car_sedan',
      dealer: 'Bert', note: '"A sensible car for a sensible person. The smell is gone. I sold the smell separately. Don\'t ask."' }),
    // ── everyday (Ch.3–4 — the working roster) ─────────────────────────────
    C({ id: 'city_ev', displayName: 'City EV', vehicleType: 'ev', band: 'ch3', price: 21000, title: 'title_car_ev',
      dealer: 'Bert', note: '"Silent. Eerie, honestly. You\'ll keep checking if it\'s on. It is. It\'s judging you."' }),
    C({ id: 'work_van', displayName: 'Work Van', vehicleType: 'van', band: 'ch3', price: 18000, title: 'title_car_van',
      dealer: 'Bert', note: '"Hauls anything. Seats the whole gang. Previous owner ran a balloon business. Make of that what you will."' }),
    C({ id: 'chrome_hog', displayName: 'Chrome Hog', vehicleType: 'cruiser', band: 'ch3', price: 9500, title: 'title_car_cruiser',
      dealer: 'Bert', note: '"She rumbles. The neighbors will know your business. Some folks call that a feature."' }),
    C({ id: 'trail_boss', displayName: 'Trail Boss', vehicleType: 'suv', band: 'ch4', price: 26000, title: 'title_car_suv',
      dealer: 'Bert', note: '"Four-wheel everything. Been up a real mountain exactly once, in a brochure. You can be the second time."' }),
    C({ id: 'the_quick_one', displayName: 'The Quick One', vehicleType: 'sport_bike', band: 'ch4', price: 13000, title: 'title_car_sport_bike',
      dealer: 'Bert', note: '"Fast. Too fast. I won\'t ride it. You shouldn\'t either. You\'re going to, aren\'t you."' }),
    // ── the high-end / exotic tier (Ch.6–8 — the Fortune-Arc toys) ─────────
    C({ id: 'big_block', displayName: 'Big Block', vehicleType: 'muscle_car', band: 'ch6', price: 42000, title: 'title_car_muscle',
      dealer: 'Bert', note: '"Hood scoop, side pipes, the whole confession. Drinks gas like it\'s mad at gas. Glorious."' }),
    C({ id: 'the_nikolai', displayName: 'The Nikolai', vehicleType: 'nikolai', band: 'ch6', price: 88000, title: 'title_car_nikolai',
      dealer: 'Bert', note: '"Drives itself around the lot when it\'s bored. I find it parked differently each morning. We don\'t discuss it."' }),
    C({ id: 'drop_top', displayName: 'Drop Top', vehicleType: 'roadster', band: 'ch7', price: 95000, title: 'title_car_roadster',
      dealer: 'Bert', note: '"Convertible. Two seats, one of them for your sense of consequence, which you will leave at home."' }),
    C({ id: 'grand_tourer', displayName: 'Grand Tourer', vehicleType: 'grand_tourer', band: 'ch7', price: 130000, title: 'title_car_grand_tourer',
      dealer: 'Bert', note: '"A continent-eater. Chrome where it counts. The kind of smell you frame, not bottle."' }),
    C({ id: 'the_stretch', displayName: 'The Stretch', vehicleType: 'limo', band: 'ch8', price: 180000, title: 'title_car_limo',
      dealer: 'Bert', note: '"Seats your whole crew and their egos. There\'s a phone in the back that only calls your dad. I left it in."' }),
  ].map((c) => [c.id, c]),
);
