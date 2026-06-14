/**
 * THE FLEET DRIVER (S18 Movement 33, ADR-074) — pure piloting + purchasing rules
 * for §A4.10's scale-up. What the control power can pilot by chapter (ADR-035
 * staging), whether a craft can enter a given water depth / take off from a given
 * pad, the Ember-trail reach law (visited nodes only), no-fly/no-wake zone gates,
 * and what a craft costs + the title you own it by. The boat/plane/sub SCENES (the
 * water-handling mode, takeoff/landing, the dive layer) render over these rules.
 */
import { VEHICLE_SPECS, type VehicleClass, type VehicleTerrain } from '../spritegen/vehicles';
import {
  FLEET_STAGES, FLEET_CRAFT, WATER_ACCESS, AIR_ACCESS,
  type CraftForSale, type Water, type Pad,
} from '../data/fleet';

function bandIndex(band: string): number {
  return Number(/^ch(\d+)$/.exec(band)?.[1] ?? 1);
}

/** the {terrain, classes} the control power can pilot at/under `chapter` (staging) */
export function controlReach(chapter: number): Array<{ terrain: VehicleTerrain; cls: VehicleClass }> {
  const out: Array<{ terrain: VehicleTerrain; cls: VehicleClass }> = [];
  for (const st of FLEET_STAGES) {
    if (bandIndex(st.band) <= chapter) for (const cls of st.classes) out.push({ terrain: st.terrain, cls });
  }
  return out;
}

/** can the control power pilot this vehicle type yet (its class+terrain is staged)? */
export function canPilot(vehicleType: string, chapter: number): boolean {
  const spec = VEHICLE_SPECS[vehicleType];
  if (!spec) return false;
  return controlReach(chapter).some((r) => r.terrain === spec.terrain && r.cls === spec.cls);
}

/** depth rule: a dinghy hugs rivers, a yacht needs open water, a sub dives */
export function canEnterWater(vehicleType: string, water: Water): boolean {
  return (WATER_ACCESS[vehicleType] ?? []).includes(water);
}

/** launch rule: jets need a runway; helis/blimps lift off anything flat */
export function canTakeOff(vehicleType: string, pad: Pad): boolean {
  return (AIR_ACCESS[vehicleType] ?? []).includes(pad);
}

/**
 * The Ember-trail reach law (§A5): a flown/sailed craft reaches only VISITED
 * nodes — never a new chapter's airfield/port before the Embers take you there.
 */
export function reachesNode(visitedNodes: readonly string[], nodeId: string): boolean {
  return visitedNodes.includes(nodeId);
}

/** a no-fly / no-wake zone stays closed until its chapter (the diegetic fence) */
export function zoneOpen(zoneBand: string, chapter: number): boolean {
  return chapter >= bandIndex(zoneBand);
}

/* ─── PURCHASING ─────────────────────────────────────────────────────────── */

/** the craft buyable at a venue at/under `chapter` */
export function craftForSale(venue: CraftForSale['venue'], chapter: number): CraftForSale[] {
  return Object.values(FLEET_CRAFT).filter((c) => c.venue === venue && bandIndex(c.band) <= chapter);
}

/** can the player afford + is the craft listed yet? */
export function canBuy(craft: CraftForSale, cashOnHand: number, chapter: number): boolean {
  return bandIndex(craft.band) <= chapter && cashOnHand >= craft.price;
}

/** the key-item TITLE you own a craft by (parked at your property once owned) */
export function titleOf(craftId: string): string | null {
  return FLEET_CRAFT[craftId]?.title ?? null;
}

/** do you own this craft? (the title key-item is present) */
export function ownsCraft(craftId: string, keyItems: readonly string[]): boolean {
  const t = titleOf(craftId);
  return t !== null && keyItems.includes(t);
}
