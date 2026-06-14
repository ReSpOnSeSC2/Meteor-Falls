/**
 * IGNITION (S20 Movement 44, ADR-085) — §A4.16 the on/off switch. A combustion
 * vehicle has to be TURNED ON before it'll move (turn the key, hear it catch). The
 * EV line is KEYLESS — step in and it's ready (no ignition) — and human-powered
 * bikes have nothing to start (you just pedal). Pure logic the OverworldScene's
 * wheel UI drives; ignition is a per-drive RUNTIME state (a car is off when you
 * walk up to it), so it earns no save field.
 */
import { fuelProfile, needsFuel } from './fuel';

export type IgnitionState = 'off' | 'running' | 'stalled';

/** does this vehicle need its engine STARTED before it'll drive?
 *  combustion (gas/diesel/jet) → yes; the EV line + human-powered → no. */
export function ignitionRequired(type: string): boolean {
  const p = fuelProfile(type);
  return p.kind === 'gas' || p.kind === 'diesel' || p.kind === 'jet';
}

/** the EV line — keyless, instant-on (no key to turn) */
export function isElectric(type: string): boolean {
  return fuelProfile(type).kind === 'electric';
}

export type StartReason = 'ok' | 'no_fuel' | 'no_ignition_needed';
export interface StartResult {
  ok: boolean;
  state: IgnitionState;
  reason: StartReason;
}

/**
 * Try to turn the key. A combustion engine catches only with fuel in the tank
 * (else it just cranks — `stalled`/`no_fuel`). For an EV or a bike there's nothing
 * to start: it's `running` if it can roll (charge left / always), reason
 * `no_ignition_needed`.
 */
export function startEngine(type: string, fuel: number): StartResult {
  if (!ignitionRequired(type)) {
    const rollable = !needsFuel(type) || fuel > 0; // bike always; EV needs charge
    return { ok: rollable, state: rollable ? 'running' : 'stalled', reason: 'no_ignition_needed' };
  }
  if (fuel <= 0) return { ok: false, state: 'stalled', reason: 'no_fuel' };
  return { ok: true, state: 'running', reason: 'ok' };
}

/** turn the key off — the engine settles to 'off' */
export function stopEngine(): IgnitionState {
  return 'off';
}

/**
 * Can the party actually DRIVE this vehicle right now?
 *   · human-powered (a bike): always — no fuel, no key;
 *   · the EV line: yes if there's charge left (keyless);
 *   · combustion: the engine must be RUNNING and there must be fuel.
 */
export function canDrive(type: string, running: boolean, fuel: number): boolean {
  if (!needsFuel(type)) return true;          // human-powered
  if (isElectric(type)) return fuel > 0;      // keyless, just needs charge
  return running && fuel > 0;                  // combustion: on + fuelled
}

/** the wheel-UI label for the start/stop button (EVs/bikes never show "START") */
export function ignitionLabel(type: string, running: boolean): string | null {
  if (!ignitionRequired(type)) return null;   // no button for EVs / bikes
  return running ? 'TURN OFF' : 'START';
}
