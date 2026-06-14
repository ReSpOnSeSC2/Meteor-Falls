/**
 * S20 Movement 44 (ADR-085) — IGNITION. You have to turn most vehicles ON; the
 * EV line is keyless; human-powered bikes have nothing to start; a dry tank won't
 * catch; you can't drive a combustion car until it's running.
 */
import { describe, it, expect } from 'vitest';
import {
  ignitionRequired, isElectric, startEngine, stopEngine, canDrive, ignitionLabel,
} from './ignition';
import { fuelProfile } from './fuel';
import { VEHICLE_SPECS } from '../spritegen/vehicles';

describe('ignition is required for combustion, not for EVs or bikes', () => {
  it('gas/diesel/jet need a key; electric + human-powered do not', () => {
    expect(ignitionRequired('sedan')).toBe(true);
    expect(ignitionRequired('tank')).toBe(true);     // diesel
    expect(ignitionRequired('jumbo_jet')).toBe(true); // jet
    expect(ignitionRequired('nikolai')).toBe(false);  // EV — keyless
    expect(ignitionRequired('ev')).toBe(false);
    expect(ignitionRequired('bmx')).toBe(false);      // human-powered
  });
  it('matches the fuel kind exactly (the both-directions consistency)', () => {
    for (const t of Object.keys(VEHICLE_SPECS)) {
      const combustion = ['gas', 'diesel', 'jet'].includes(fuelProfile(t).kind);
      expect(ignitionRequired(t), `'${t}'`).toBe(combustion);
    }
  });
  it('isElectric reads the EV line', () => {
    expect(isElectric('nikolai')).toBe(true);
    expect(isElectric('sedan')).toBe(false);
  });
});

describe('starting the engine', () => {
  it('a fuelled combustion car catches; a dry one stalls', () => {
    expect(startEngine('sedan', 20)).toEqual({ ok: true, state: 'running', reason: 'ok' });
    expect(startEngine('sedan', 0)).toEqual({ ok: false, state: 'stalled', reason: 'no_fuel' });
  });
  it('an EV with charge is instantly ready (no key)', () => {
    expect(startEngine('nikolai', 50)).toEqual({ ok: true, state: 'running', reason: 'no_ignition_needed' });
    expect(startEngine('nikolai', 0).ok).toBe(false); // dead battery still can't roll
  });
  it('a bike is always ready (nothing to start)', () => {
    expect(startEngine('bmx', 0)).toEqual({ ok: true, state: 'running', reason: 'no_ignition_needed' });
  });
  it('stopEngine settles off', () => {
    expect(stopEngine()).toBe('off');
  });
});

describe('canDrive — the gate the wheel UI checks', () => {
  it('a combustion car drives only when running AND fuelled', () => {
    expect(canDrive('sedan', true, 10)).toBe(true);
    expect(canDrive('sedan', false, 10)).toBe(false); // not turned on
    expect(canDrive('sedan', true, 0)).toBe(false);   // out of gas
  });
  it('an EV drives on charge alone (keyless)', () => {
    expect(canDrive('nikolai', false, 10)).toBe(true);
    expect(canDrive('nikolai', false, 0)).toBe(false);
  });
  it('a bike always drives', () => {
    expect(canDrive('road_bike', false, 0)).toBe(true);
  });
});

describe('the wheel-UI ignition label', () => {
  it('combustion shows START / TURN OFF; EVs + bikes show no button', () => {
    expect(ignitionLabel('sedan', false)).toBe('START');
    expect(ignitionLabel('sedan', true)).toBe('TURN OFF');
    expect(ignitionLabel('nikolai', false)).toBeNull();
    expect(ignitionLabel('bmx', true)).toBeNull();
  });
});
