/**
 * Production vehicle ownership domain.
 *
 * This is the single mutation seam shared by the dealership UI, a future home
 * garage, and the overworld vehicle controller. It keeps the title key-item,
 * owned flag, garage, active/driving state, fuel, continent, and exact parking
 * position consistent as one transaction. Callers validate through a result;
 * failed operations never partially mutate the save.
 */
import { DEALERSHIP, type CarForSale } from '../data/dealership';
import { AREA_CONTINENT, CONTINENTS } from '../data/world';
import { VEHICLE_SPECS } from '../spritegen/vehicles';
import { s } from '../spritegen/scale';
import type { GameStateData, VehicleParkingState } from './state';
import { buyCar, carsForSale, sellCar, sellValue } from './garage';
import { fuelProfile, needsFuel, rangeTiles as fullRangeTiles, type FuelKind } from './fuel';

export type VehicleFilter = 'all' | 'bikes' | 'powered' | 'cars' | readonly string[];

export interface VehicleView {
  id: string;
  title: string;
  /** Authored Phaser texture key; intentionally identical to the listing id. */
  textureKey: string;
  name: string;
  vehicleType: string;
  price: number;
  note: string;
  owned: boolean;
  active: boolean;
  driving: boolean;
  sellValue: number;
  seats: number;
  fuelKind: FuelKind;
  /** Save-backed tank/charge level for owned powered vehicles. */
  fuelCurrent: number | null;
  fuelCapacity: number | null;
  rangeTiles: number;
}

export type VehicleMutationReason =
  | 'ok'
  | 'unknown'
  | 'not_listed'
  | 'already_owned'
  | 'cant_afford'
  | 'not_owned'
  | 'unknown_area'
  | 'missing_trade'
  | 'same_vehicle'
  | 'currently_driving'
  | 'no_driving_vehicle';

export interface VehicleMutationResult {
  ok: boolean;
  reason: VehicleMutationReason;
  message: string;
  car?: VehicleView;
  /** Positive pays the player; negative is money spent. */
  cashDelta: number;
}

export interface VehicleDeliveryOptions {
  chapter: number;
  /** Area/map id at the dealer. Continent ids are accepted too. */
  area: string;
  /** A map author may override the default player-adjacent delivery point. */
  parking?: VehicleParkingState;
}

export interface VehicleTradeOptions extends VehicleDeliveryOptions {
  /** Owned title surrendered as credit toward the target `carId`. */
  tradeTitle: string;
}

const result = (
  ok: boolean,
  reason: VehicleMutationReason,
  message: string,
  cashDelta = 0,
  car?: VehicleView,
): VehicleMutationResult => ({ ok, reason, message, cashDelta, ...(car ? { car } : {}) });

/** Chapter policy shared with OverworldScene: zero Ember flags means Chapter 1. */
export function currentVehicleChapter(data: GameStateData): number {
  let earned = 0;
  for (let i = 1; i <= 10; i++) if (data.flags[`ember${i}`]) earned++;
  return Math.min(10, earned + 1);
}

export function vehicleByTitle(title: string): CarForSale | null {
  return Object.values(DEALERSHIP).find((car) => car.title === title) ?? null;
}

export function vehicleView(data: GameStateData, carId: string): VehicleView | null {
  const car = DEALERSHIP[carId];
  if (!car) return null;
  const spec = VEHICLE_SPECS[car.vehicleType];
  const fuel = fuelProfile(car.vehicleType);
  const owned = data.keyItems.includes(car.title);
  return {
    id: car.id,
    title: car.title,
    textureKey: car.id,
    name: car.displayName,
    vehicleType: car.vehicleType,
    price: car.price,
    note: car.note,
    owned,
    active: data.activeVehicle === car.title,
    driving: data.drivingVehicle === car.title,
    sellValue: sellValue(car),
    seats: spec?.seats ?? 0,
    fuelKind: fuel.kind,
    fuelCurrent: owned && fuel.kind !== 'none'
      ? Math.max(0, data.fuel[car.title] ?? fuel.tank)
      : null,
    fuelCapacity: fuel.kind === 'none' ? null : fuel.tank,
    rangeTiles: fullRangeTiles(car.vehicleType),
  };
}

function matchesFilter(car: CarForSale, filter: VehicleFilter): boolean {
  if (Array.isArray(filter)) return filter.includes(car.id);
  if (filter === 'all') return true;
  const spec = VEHICLE_SPECS[car.vehicleType];
  if (!spec) return false;
  if (filter === 'bikes') return spec.cls === 'bike';
  if (filter === 'powered') return needsFuel(car.vehicleType);
  if (filter === 'cars') return spec.cls !== 'bike' && spec.cls !== 'moto';
  return true;
}

/** Real, chapter-gated dealership rows enriched for the production shop. */
export function vehicleCatalog(
  data: GameStateData,
  chapter = currentVehicleChapter(data),
  filter: VehicleFilter = 'all',
): VehicleView[] {
  return carsForSale(chapter)
    .filter((car) => matchesFilter(car, filter))
    .map((car) => vehicleView(data, car.id))
    .filter((car): car is VehicleView => car !== null);
}

/** Resolve an area id or an already-resolved continent id. */
export function vehicleContinent(area: string): string | null {
  if (CONTINENTS[area]) return area;
  const formalCityAlias: Readonly<Record<string, string>> = {
    // These production map ids are the larger city within an existing world
    // area's landmass; the original continent registry predates their rebuild.
    valle_dorado: 'south_america',
    minimus_major: 'minimus',
  };
  return AREA_CONTINENT[area] ?? formalCityAlias[area] ?? null;
}

/** Dealership paperwork follows the physical vehicle's continent. A missing
 * legacy location remains serviceable so migration gaps never destroy access. */
export function vehicleServiceableAtArea(
  data: Pick<GameStateData, 'carLocation'>,
  title: string,
  area: string,
): boolean {
  const dealerContinent = vehicleContinent(area);
  const carContinent = data.carLocation[title];
  return !dealerContinent || !carContinent || dealerContinent === carContinent;
}

function deliveryPoint(data: GameStateData, options: VehicleDeliveryOptions): VehicleParkingState {
  return options.parking ?? {
    area: options.area,
    x: data.x,
    y: data.y,
    facing: data.facing,
  };
}

interface ParkingRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DELIVERY_SLOT_STEP = s(16);
const DELIVERY_SLOT_GAP = s(6);

/**
 * Match the overworld's parked-car footprint closely enough to allocate
 * separate delivery bays without importing Phaser. Unknown legacy titles use
 * a conservative one-car box so corrupt save data cannot collapse new cars
 * onto the same point.
 */
function parkingRect(title: string, parking: VehicleParkingState): ParkingRect {
  const car = vehicleByTitle(title);
  const spec = car ? VEHICLE_SPECS[car.vehicleType] : undefined;
  const vertical = !parking.facing.includes('left') && !parking.facing.includes('right');
  const long = s(spec?.solid.w ?? 40) * 1.2;
  const wide = s(spec?.solid.h ?? 16) * 1.25;
  const w = vertical ? wide : long;
  const h = vertical ? long : wide;
  return {
    x: parking.x - w / 2 - DELIVERY_SLOT_GAP / 2,
    y: parking.y - h - DELIVERY_SLOT_GAP / 2,
    w: w + DELIVERY_SLOT_GAP,
    h: h + DELIVERY_SLOT_GAP,
  };
}

function parkingRectsOverlap(a: ParkingRect, b: ParkingRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Public diagnostic shared by tests/map tooling; different maps never collide. */
export function vehicleParkingSlotsOverlap(
  aTitle: string,
  a: VehicleParkingState,
  bTitle: string,
  b: VehicleParkingState,
): boolean {
  return a.area === b.area && parkingRectsOverlap(parkingRect(aTitle, a), parkingRect(bTitle, b));
}

/**
 * Find the nearest deterministic free bay around an authored delivery point.
 *
 * The search walks square rings on the runtime tile lattice. It only competes
 * with parked titles on the same map/area, keeps the requested facing, and
 * ignores `title` itself so garage deployment can safely re-seat an existing
 * record. This is exported for the home-garage deploy UI as well as purchases.
 */
export function allocateVehicleDeliverySlot(
  data: Pick<GameStateData, 'vehicleParking'>,
  title: string,
  requested: VehicleParkingState,
): VehicleParkingState {
  const occupied = Object.entries(data.vehicleParking)
    .filter(([candidateTitle, parking]) => candidateTitle !== title && parking.area === requested.area)
    .map(([candidateTitle, parking]) => parkingRect(candidateTitle, parking));

  const free = (parking: VehicleParkingState): boolean => {
    const rect = parkingRect(title, parking);
    return occupied.every((other) => !parkingRectsOverlap(rect, other));
  };

  if (free(requested)) return { ...requested };

  // Deterministic nearest-first square rings. Checking the curb axis before
  // the perpendicular axis produces a tidy row for ordinary repeated buys.
  for (let ring = 1; ring <= 512; ring++) {
    const offsets: Array<readonly [number, number]> = [];
    for (let x = -ring; x <= ring; x++) offsets.push([x, -ring]);
    for (let y = -ring + 1; y <= ring; y++) offsets.push([ring, y]);
    for (let x = ring - 1; x >= -ring; x--) offsets.push([x, ring]);
    for (let y = ring - 1; y > -ring; y--) offsets.push([-ring, y]);
    offsets.sort((a, b) => {
      const ad = Math.abs(a[0]) + Math.abs(a[1]);
      const bd = Math.abs(b[0]) + Math.abs(b[1]);
      if (ad !== bd) return ad - bd;
      // Horizontal facings line cars along X; vertical facings line them along Y.
      const horizontal = requested.facing.includes('left') || requested.facing.includes('right');
      const ap = horizontal ? Math.abs(a[1]) : Math.abs(a[0]);
      const bp = horizontal ? Math.abs(b[1]) : Math.abs(b[0]);
      if (ap !== bp) return ap - bp;
      if (a[1] !== b[1]) return a[1] - b[1];
      return a[0] - b[0];
    });
    for (const [ox, oy] of offsets) {
      const candidate = {
        ...requested,
        x: requested.x + ox * DELIVERY_SLOT_STEP,
        y: requested.y + oy * DELIVERY_SLOT_STEP,
      };
      if (free(candidate)) return candidate;
    }
  }

  // Finite save data guarantees the lattice search finds a slot. Keep a
  // deterministic defensive fallback for deliberately malformed giant saves.
  return {
    ...requested,
    x: requested.x + (Object.keys(data.vehicleParking).length + 513) * DELIVERY_SLOT_STEP,
  };
}

function removeFromEveryGarage(data: GameStateData, title: string): void {
  for (const [propertyId, titles] of Object.entries(data.garage)) {
    const kept = titles.filter((candidate) => candidate !== title);
    if (kept.length > 0) data.garage[propertyId] = kept;
    else delete data.garage[propertyId];
  }
}

function grantVehicle(
  data: GameStateData,
  car: CarForSale,
  options: VehicleDeliveryOptions,
  continent: string,
): void {
  if (!data.keyItems.includes(car.title)) data.keyItems.push(car.title);
  data.flags[`owned_${car.id}`] = true;
  const fuel = fuelProfile(car.vehicleType);
  if (fuel.kind === 'none') delete data.fuel[car.title];
  else data.fuel[car.title] = fuel.tank;
  data.carLocation[car.title] = continent;
  removeFromEveryGarage(data, car.title);
  data.vehicleParking[car.title] = allocateVehicleDeliverySlot(
    data,
    car.title,
    deliveryPoint(data, options),
  );
}

function revokeVehicle(data: GameStateData, car: CarForSale): void {
  data.keyItems = data.keyItems.filter((title) => title !== car.title);
  data.flags[`owned_${car.id}`] = false;
  removeFromEveryGarage(data, car.title);
  delete data.fuel[car.title];
  delete data.carLocation[car.title];
  delete data.vehicleParking[car.title];
  if (data.activeVehicle === car.title) data.activeVehicle = null;
  if (data.drivingVehicle === car.title) data.drivingVehicle = null;
}

/** Buy from the real dealership and commit every ownership field together. */
export function purchaseVehicle(
  data: GameStateData,
  carId: string,
  options: VehicleDeliveryOptions,
): VehicleMutationResult {
  const quote = buyCar(carId, data.cashOnHand, options.chapter, data.keyItems);
  const car = DEALERSHIP[carId];
  if (!quote.ok || !quote.title || !car) {
    const reason = quote.reason as VehicleMutationReason;
    const messages: Record<string, string> = {
      unknown: "Bert can't find that model in his book.",
      not_listed: "Bert hasn't put that model on the lot yet.",
      already_owned: 'That title is already yours.',
      cant_afford: 'Not enough cash on hand for that sticker.',
    };
    return result(false, reason, messages[reason] ?? 'The sale could not be completed.');
  }
  const continent = vehicleContinent(options.parking?.area ?? options.area);
  if (!continent) return result(false, 'unknown_area', 'Bert needs a real delivery area before he can hand over the keys.');

  // All validation is complete. Everything below is one synchronous commit.
  data.cashOnHand -= quote.cost;
  grantVehicle(data, car, options, continent);
  return result(true, 'ok', `${car.displayName} is yours.`, -quote.cost, vehicleView(data, car.id) ?? undefined);
}

/** Sell one owned listing back to Bert and remove every dependent save record. */
export function sellVehicle(data: GameStateData, carId: string): VehicleMutationResult {
  const car = DEALERSHIP[carId];
  if (!car) return result(false, 'unknown', "Bert can't find that model in his book.");
  if (data.drivingVehicle === car.title) {
    return result(false, 'currently_driving', 'Park it before handing Bert the title.');
  }
  const sale = sellCar(carId, data.keyItems);
  if (!sale.ok) return result(false, 'not_owned', "You can't trade a title you don't own.");

  data.cashOnHand += sale.proceeds;
  revokeVehicle(data, car);
  return result(true, 'ok', `Bert paid $${sale.proceeds} for the ${car.displayName}.`, sale.proceeds, vehicleView(data, car.id) ?? undefined);
}

/**
 * Trade one owned title toward a different target model. Validation uses the
 * trade credit before committing, so a failed upgrade leaves the save unchanged.
 */
export function tradeVehicle(
  data: GameStateData,
  carId: string,
  options: VehicleTradeOptions,
): VehicleMutationResult {
  const target = DEALERSHIP[carId];
  if (!target) return result(false, 'unknown', "Bert can't find that model in his book.");
  const trade = vehicleByTitle(options.tradeTitle);
  if (!trade) return result(false, 'missing_trade', "Bert can't value that title.");
  if (trade.id === target.id) return result(false, 'same_vehicle', 'Trading a car for itself mostly moves paperwork.');
  if (!data.keyItems.includes(trade.title)) return result(false, 'not_owned', "You can't trade a title you don't own.");
  if (data.drivingVehicle === trade.title) {
    return result(false, 'currently_driving', 'Park it before handing Bert the title.');
  }
  const credit = sellValue(trade);
  const buyingPower = data.cashOnHand + credit;
  const quote = buyCar(target.id, buyingPower, options.chapter, data.keyItems);
  if (!quote.ok || !quote.title) {
    const reason = quote.reason as VehicleMutationReason;
    if (reason === 'cant_afford') return result(false, reason, 'The trade credit still leaves the sticker out of reach.');
    if (reason === 'not_listed') return result(false, reason, "Bert hasn't put that model on the lot yet.");
    if (reason === 'already_owned') return result(false, reason, 'That title is already yours.');
    return result(false, reason, 'The trade could not be completed.');
  }
  const continent = vehicleContinent(options.parking?.area ?? options.area);
  if (!continent) return result(false, 'unknown_area', 'Bert needs a real delivery area before he can hand over the keys.');

  const wasActive = data.activeVehicle === trade.title;
  const cashDelta = credit - target.price;
  data.cashOnHand += cashDelta;
  revokeVehicle(data, trade);
  grantVehicle(data, target, options, continent);
  if (wasActive) data.activeVehicle = target.title;
  return result(
    true,
    'ok',
    `Bert allowed $${credit} for the ${trade.displayName}. The ${target.displayName} is yours.`,
    cashDelta,
    vehicleView(data, target.id) ?? undefined,
  );
}

/** Select an owned title for the next deployment without inventing a world move. */
export function chooseActiveVehicle(data: GameStateData, title: string | null): VehicleMutationResult {
  if (data.drivingVehicle !== null && data.drivingVehicle !== title) {
    return result(false, 'currently_driving', 'Exit the vehicle you are driving before choosing another.');
  }
  if (title === null) {
    data.activeVehicle = null;
    return result(true, 'ok', 'No vehicle is active.');
  }
  const car = vehicleByTitle(title);
  if (!car) return result(false, 'unknown', 'That title does not match a dealership vehicle.');
  if (!data.keyItems.includes(title)) return result(false, 'not_owned', "You don't own that title.");
  data.activeVehicle = title;
  return result(
    true,
    'ok',
    `${car.displayName} is marked as preferred. It stays wherever it is parked.`,
    0,
    vehicleView(data, car.id) ?? undefined,
  );
}

/** Runtime enter seam: claim movement only for a title the save actually owns. */
export function beginDrivingVehicle(data: GameStateData, title: string): VehicleMutationResult {
  const car = vehicleByTitle(title);
  if (!car) return result(false, 'unknown', 'That title does not match a dealership vehicle.');
  if (!data.keyItems.includes(title)) return result(false, 'not_owned', "You don't own that title.");
  if (data.drivingVehicle && data.drivingVehicle !== title) {
    return result(false, 'currently_driving', 'Exit the current vehicle first.');
  }
  removeFromEveryGarage(data, title);
  delete data.vehicleParking[title];
  data.activeVehicle = title;
  data.drivingVehicle = title;
  return result(true, 'ok', `Entered the ${car.displayName}.`, 0, vehicleView(data, car.id) ?? undefined);
}

/** Runtime exit seam: park the entered title at an exact, save-backed position. */
export function parkDrivingVehicle(
  data: GameStateData,
  parking: VehicleParkingState,
): VehicleMutationResult {
  const title = data.drivingVehicle;
  if (!title) return result(false, 'no_driving_vehicle', 'There is no entered vehicle to park.');
  const car = vehicleByTitle(title);
  if (!car || !data.keyItems.includes(title)) {
    return result(false, 'not_owned', 'The entered vehicle no longer has a valid title.');
  }
  const continent = vehicleContinent(parking.area);
  if (!continent) return result(false, 'unknown_area', 'That parking area is not part of the world map.');
  data.vehicleParking[title] = { ...parking };
  data.carLocation[title] = continent;
  data.drivingVehicle = null;
  data.activeVehicle = null;
  return result(true, 'ok', `Parked the ${car.displayName}.`, 0, vehicleView(data, car.id) ?? undefined);
}
