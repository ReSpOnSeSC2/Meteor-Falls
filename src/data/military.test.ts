/**
 * S19 Movement 39 (ADR-080) — THE MILITARY MOTOR POOL, both directions + the
 * hardening law. Mirrors the content-validate `military` gate and proves a
 * hardened military vehicle REFUSES the Clicker until its shield is knocked off.
 */
import { describe, it, expect } from 'vitest';
import { MILITARY_VEHICLES, MILITARY_TYPES } from './military';
import { VEHICLE_SPECS } from '../spritegen/vehicles';
import { isHardened, militaryTarget, attempt, controllable, type Caster } from '../engine/control';

const clicker = (over: Partial<Caster> = {}): Caster => ({ kind: 'clicker', x: 0, y: 0, pp: 20, range: 60, cost: 6, ...over });

describe('the military motor pool — both directions', () => {
  it('every listed vehicle is a real, hardened VEHICLE_SPECS type', () => {
    for (const t of MILITARY_TYPES) {
      expect(VEHICLE_SPECS[t], `missing spec '${t}'`).toBeDefined();
      expect(VEHICLE_SPECS[t].hardened, `'${t}' must be hardened`).toBe(true);
    }
  });
  it('every hardened spec is in the motor pool (no orphan hardening)', () => {
    const listed = new Set(MILITARY_TYPES);
    for (const [type, spec] of Object.entries(VEHICLE_SPECS)) {
      if (spec.hardened === true) expect(listed.has(type), `'${type}' hardened but unlisted`).toBe(true);
    }
  });
  it('the pool has the canon five (tank, F-15, Humvee, transport, attack heli)', () => {
    for (const t of ['tank', 'f15', 'humvee', 'troop_transport', 'attack_heli']) {
      expect(MILITARY_VEHICLES[t], `missing '${t}'`).toBeDefined();
    }
  });
  it('the tank is its own silhouette family + a 3-seat road craft', () => {
    expect(VEHICLE_SPECS.tank.cls).toBe('tank');
    expect(VEHICLE_SPECS.tank.terrain).toBe('road');
    expect(VEHICLE_SPECS.tank.seats).toBe(3);
  });
});

describe('the hardening law — helmeted hardware refuses control', () => {
  it('isHardened reads the spec; civilian kit is not hardened', () => {
    expect(isHardened('tank')).toBe(true);
    expect(isHardened('f15')).toBe(true);
    expect(isHardened('sedan')).toBe(false);
  });

  it('a fresh hardened tank cannot be Clickered (blocked); de-shielding frees it', () => {
    const armed = militaryTarget('tank1', 'tank', 20, 0);          // shield up
    expect(armed.shielded).toBe(true);
    expect(controllable(clicker(), armed)).toBe(false);
    expect(attempt(clicker(), armed).reason).toBe('blocked');

    const exposed = militaryTarget('tank1', 'tank', 20, 0, true);  // shield knocked off
    expect(exposed.shielded).toBe(false);
    expect(controllable(clicker(), exposed)).toBe(true);
    expect(attempt(clicker(), exposed).reason).toBe('ok');
  });

  it('the F-15 + Humvee are hardened targets too', () => {
    expect(militaryTarget('e', 'f15', 10, 0).shielded).toBe(true);
    expect(militaryTarget('h', 'humvee', 10, 0).shielded).toBe(true);
  });
});
