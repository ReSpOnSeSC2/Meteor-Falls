/**
 * THE CONTROL SYSTEM (S18 Movement 27, ADR-068) — the overworld-ability SPINE
 * Jay's PUPPET, Milo's CLICKER, and (M28) the PSI casts all consume. Pure logic,
 * no Phaser: it answers WHO/WHAT can be controlled from here, whether a cast can
 * be paid for, whether the party can RIDE or must REMOTE-drive, and whether a
 * borrowed/clickered vehicle UNLOCKS a gate. The OverworldScene owns the wheel
 * UI, the target highlight, and the driving feel; this module owns the rules and
 * is proven in control.test.ts.
 *
 * §A4.10 in one place:
 *   · JAY — VIBE PUPPET: borrow a PERSON in range (walk them, open a gate, vouch
 *     past a guard, take a driver's seat). The DEAD-AIR HELMET (`mind_immune`,
 *     here a target `helmet` flag) blocks it — a clear "no signal".
 *   · MILO — THE CLICKER: pilot an UNOCCUPIED machine/vehicle in range; a
 *     Faraday `shielded` machine blocks it.
 *   · THE RIDE: usable seats = vehicle.seats − 1; board only if ≥ party size,
 *     else Clicker-drive it EMPTY (its own puzzle layer).
 *   · THE COUNTER is ONE identity (helmet/shield) — route around or knock it off.
 */
import { VEHICLE_SPECS, usableSeats, seatsFit, type VehicleClass } from '../spritegen/vehicles';

export type ControlKind = 'puppet' | 'clicker';

/** a thing in the world the player might control (a person or a machine) */
export interface ControlTarget {
  id: string;
  kind: 'person' | 'machine';
  x: number;
  y: number;
  /** PEOPLE: a DEAD-AIR HELMET blocks PUPPET (the `mind_immune` data spine) */
  helmet?: boolean;
  /** MACHINES: a Faraday shield blocks the CLICKER */
  shielded?: boolean;
  /** MACHINES that are vehicles: their VEHICLE_SPECS type (seat-fit + drive) */
  vehicleType?: string;
  /** MACHINES: a driver is already aboard (can't be Clickered driver-less) */
  occupied?: boolean;
}

export interface Caster {
  kind: ControlKind;
  x: number;
  y: number;
  /** current PP */
  pp: number;
  /** reach in pixels (the highlight radius) */
  range: number;
  /** PP this cast costs */
  cost: number;
}

export type ControlReason =
  | 'ok' | 'no_pp' | 'out_of_range' | 'blocked' | 'wrong_kind' | 'occupied';

export interface ControlResult {
  ok: boolean;
  reason: ControlReason;
}

/** Euclidean reach test (the highlight radius) */
export function inRange(c: Caster, t: ControlTarget): boolean {
  const dx = c.x - t.x;
  const dy = c.y - t.y;
  return dx * dx + dy * dy <= c.range * c.range;
}

/** the right kind of target for the power (Puppet→people, Clicker→machines) */
export function rightKind(kind: ControlKind, t: ControlTarget): boolean {
  return kind === 'puppet' ? t.kind === 'person' : t.kind === 'machine';
}

/** the DEAD-AIR HELMET / Faraday shield — the single counter, by kind */
export function isBlocked(kind: ControlKind, t: ControlTarget): boolean {
  return kind === 'puppet' ? t.helmet === true : t.shielded === true;
}

/** can the caster pay for the cast right now? */
export function canCast(c: Caster): boolean {
  return c.pp >= c.cost;
}

/** is `t` a legal control target for `c` (kind + range + not blocked + free)? */
export function controllable(c: Caster, t: ControlTarget): boolean {
  if (!rightKind(c.kind, t)) return false;
  if (!inRange(c, t)) return false;
  if (isBlocked(c.kind, t)) return false;
  // a Clickered machine must be UNOCCUPIED (no driver to override)
  if (c.kind === 'clicker' && t.occupied === true) return false;
  return true;
}

/** the highlightable targets in range (what the UI rings) */
export function candidates(c: Caster, targets: readonly ControlTarget[]): ControlTarget[] {
  return targets.filter((t) => rightKind(c.kind, t) && inRange(c, t));
}

/** attempt a control, with the precise reason it failed (drives the "no signal" tell) */
export function attempt(c: Caster, t: ControlTarget): ControlResult {
  if (!rightKind(c.kind, t)) return { ok: false, reason: 'wrong_kind' };
  if (!inRange(c, t)) return { ok: false, reason: 'out_of_range' };
  if (!canCast(c)) return { ok: false, reason: 'no_pp' };
  if (isBlocked(c.kind, t)) return { ok: false, reason: 'blocked' };
  if (c.kind === 'clicker' && t.occupied === true) return { ok: false, reason: 'occupied' };
  return { ok: true, reason: 'ok' };
}

/* ─── THE RIDE — seat-fit (§A4.10) ──────────────────────────────────────── */

export type RideMode = 'ride' | 'remote' | 'none';

/** can the whole party board this vehicle (driver borrowed/clickered)? */
export function canRide(vehicleType: string, partySize: number): boolean {
  return seatsFit(vehicleType, partySize);
}

/**
 * What can the party do with this vehicle right now?
 *   'ride'   — the seats fit; Jay borrows the driver, the party piles in;
 *   'remote' — too small to ride, but Milo can Clicker it EMPTY to a place;
 *   'none'   — not a drivable vehicle (a prop, e.g. trash cans).
 */
export function rideOrRemote(vehicleType: string, partySize: number): RideMode {
  const spec = VEHICLE_SPECS[vehicleType];
  if (!spec || spec.cls === 'prop') return 'none';
  if (canRide(vehicleType, partySize)) return 'ride';
  return 'remote';
}

/* ─── REMOTE-DRIVE AREA UNLOCKS — the Clicker puzzle layer ───────────────── */

/** a gate that only a particular kind/size of vehicle can open */
export interface GateReq {
  /** an exact vehicle type ("only the riverboat") */
  needsType?: string;
  /** any vehicle of a class ("a bus-only lane", "a boat across the water") */
  needsClass?: VehicleClass;
  /** a weight/size floor expressed as a minimum seat count (a heavy bridge) */
  minSeats?: number;
  /** the terrain the gate sits on (a water gate needs a water craft) */
  terrain?: 'road' | 'water' | 'air';
}

/** does driving `vehicleType` (remote or ridden) satisfy this gate? */
export function unlocksGate(vehicleType: string, req: GateReq): boolean {
  const spec = VEHICLE_SPECS[vehicleType];
  if (!spec) return false;
  if (req.needsType && vehicleType !== req.needsType) return false;
  if (req.needsClass && spec.cls !== req.needsClass) return false;
  if (req.terrain && spec.terrain !== req.terrain) return false;
  if (req.minSeats !== undefined && spec.seats < req.minSeats) return false;
  return true;
}

/* ─── M36 (ADR-077): SELF-CREEP — the Nikolai's autopilot toy ────────────── */

export type SelfCreepReason = 'ok' | 'no_autopilot' | 'lot_not_clear';
export interface SelfCreepResult {
  ok: boolean;
  reason: SelfCreepReason;
}

/** does this vehicle TYPE have the self-creep autopilot (the Nikolai gag)? */
export function canSelfCreep(vehicleType: string): boolean {
  return VEHICLE_SPECS[vehicleType]?.selfDrive === true;
}

/**
 * The Nikolai's party trick: it can creep around DRIVER-LESS on its own — no
 * Puppet, no Clicker — but ONLY in a cleared lot (the EarthBound-safe joke: it
 * won't trundle into a crowd). Pure logic; the OverworldScene plays the creep.
 *   · 'no_autopilot' — this vehicle has no self-drive (most do not);
 *   · 'lot_not_clear' — there are people/obstacles in the way (the safety law);
 *   · 'ok' — let it creep.
 */
export function selfCreep(vehicleType: string, lotClear: boolean): SelfCreepResult {
  if (!canSelfCreep(vehicleType)) return { ok: false, reason: 'no_autopilot' };
  if (!lotClear) return { ok: false, reason: 'lot_not_clear' };
  return { ok: true, reason: 'ok' };
}

/* ─── M39 (ADR-080): HARDENED military hardware — the Clicker counter on wheels ─ */

/** is this vehicle TYPE Faraday/dead-air shielded by default (the army's kit)? */
export function isHardened(vehicleType: string): boolean {
  return VEHICLE_SPECS[vehicleType]?.hardened === true;
}

/**
 * Build a ControlTarget for a military vehicle. It carries `shielded` from the
 * spec's hardening UNLESS the shield's been knocked off (the mid/late control
 * puzzle, §A7) — so a fresh tank refuses the Clicker, a de-shielded one yields.
 */
export function militaryTarget(
  id: string, vehicleType: string, x: number, y: number, shieldDown = false,
): ControlTarget {
  return { id, kind: 'machine', x, y, vehicleType, shielded: isHardened(vehicleType) && !shieldDown };
}

/** the field label for a power (Mind Warp is the battle face; Puppet the field) */
export function fieldLabel(kind: ControlKind): string {
  return kind === 'puppet' ? 'PUPPET' : 'CLICKER';
}

/** re-export so consumers read one seat-fit source of truth */
export { usableSeats };
