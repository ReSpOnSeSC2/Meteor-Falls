/**
 * S18 Movement 27 (ADR-067) — THE CONTROL SYSTEM spine.
 *
 * Proves the §A4.10 rules the OverworldScene's wheel UI rides on: targeting +
 * range, the single helmet/shield counter, PP cost, the seat-fit ride/remote
 * split, and remote-drive gate unlocks.
 */
import { describe, it, expect } from 'vitest';
import {
  inRange, controllable, candidates, attempt, canCast,
  canRide, rideOrRemote, unlocksGate, fieldLabel,
  type Caster, type ControlTarget,
} from './control';

const puppeteer = (over: Partial<Caster> = {}): Caster => ({ kind: 'puppet', x: 0, y: 0, pp: 20, range: 40, cost: 8, ...over });
const clicker = (over: Partial<Caster> = {}): Caster => ({ kind: 'clicker', x: 0, y: 0, pp: 20, range: 40, cost: 6, ...over });

const guard = (over: Partial<ControlTarget> = {}): ControlTarget => ({ id: 'g', kind: 'person', x: 20, y: 0, ...over });
const car = (over: Partial<ControlTarget> = {}): ControlTarget => ({ id: 'c', kind: 'machine', x: 20, y: 0, vehicleType: 'sedan', ...over });

describe('control — targeting + range', () => {
  it('only the right kind of target is controllable', () => {
    expect(controllable(puppeteer(), guard())).toBe(true);
    expect(controllable(puppeteer(), car())).toBe(false);     // Puppet can't drive a machine directly
    expect(controllable(clicker(), car())).toBe(true);
    expect(controllable(clicker(), guard())).toBe(false);     // Clicker can't borrow a mind
  });

  it('a target out of range cannot be controlled', () => {
    expect(inRange(puppeteer({ range: 10 }), guard({ x: 20 }))).toBe(false);
    expect(controllable(puppeteer({ range: 10 }), guard({ x: 20 }))).toBe(false);
    expect(attempt(puppeteer({ range: 10 }), guard({ x: 20 })).reason).toBe('out_of_range');
  });

  it('candidates rings only same-kind targets in range', () => {
    const targets = [guard({ id: 'a', x: 10 }), guard({ id: 'b', x: 200 }), car({ id: 'c', x: 10 })];
    const ring = candidates(puppeteer(), targets);
    expect(ring.map((t) => t.id)).toEqual(['a']); // b is too far, c is a machine
  });
});

describe('control — the DEAD-AIR HELMET / shield (one counter)', () => {
  it('a helmeted person refuses PUPPET; remove the helmet and it works', () => {
    expect(attempt(puppeteer(), guard({ helmet: true })).reason).toBe('blocked');
    expect(attempt(puppeteer(), guard({ helmet: false })).ok).toBe(true);
  });
  it('a shielded machine refuses the CLICKER', () => {
    expect(attempt(clicker(), car({ shielded: true })).reason).toBe('blocked');
    expect(attempt(clicker(), car({ shielded: false })).ok).toBe(true);
  });
  it('an OCCUPIED machine cannot be Clickered driver-less', () => {
    expect(attempt(clicker(), car({ occupied: true })).reason).toBe('occupied');
  });
});

describe('control — PP cost', () => {
  it('a cast you cannot afford fails with no_pp', () => {
    expect(canCast(puppeteer({ pp: 4, cost: 8 }))).toBe(false);
    expect(attempt(puppeteer({ pp: 4, cost: 8 }), guard()).reason).toBe('no_pp');
  });
});

describe('control — the ride (seat-fit) + remote drive', () => {
  it('rides when the seats fit, remotes when too small, none for a prop', () => {
    expect(canRide('suv', 4)).toBe(true);
    expect(rideOrRemote('sedan', 3)).toBe('ride');
    expect(rideOrRemote('sedan', 4)).toBe('remote');   // too big to ride → Clicker it empty
    expect(rideOrRemote('motorcycle', 2)).toBe('remote');
    expect(rideOrRemote('trash_cans', 1)).toBe('none'); // a prop, not drivable
  });
});

describe('control — remote-drive gate unlocks', () => {
  it('a bus-only lane opens for a bus, not a sedan', () => {
    expect(unlocksGate('bus', { needsClass: 'bus' })).toBe(true);
    expect(unlocksGate('sedan', { needsClass: 'bus' })).toBe(false);
  });
  it('a weight-limited bridge wants a minimum size', () => {
    expect(unlocksGate('truck', { minSeats: 3 })).toBe(true);
    expect(unlocksGate('motorcycle', { minSeats: 3 })).toBe(false);
  });
  it('a water gate needs a water craft; an exact-type gate is strict', () => {
    expect(unlocksGate('boat', { terrain: 'water' })).toBe(true);
    expect(unlocksGate('sedan', { terrain: 'water' })).toBe(false);
    expect(unlocksGate('boat', { needsType: 'boat' })).toBe(true);
    expect(unlocksGate('yacht', { needsType: 'boat' })).toBe(false);
  });
});

describe('control — field labels', () => {
  it('Puppet and Clicker read on the wheel', () => {
    expect(fieldLabel('puppet')).toBe('PUPPET');
    expect(fieldLabel('clicker')).toBe('CLICKER');
  });
});
