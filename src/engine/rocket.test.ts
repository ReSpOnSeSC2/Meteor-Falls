/**
 * S20 Movement 48 (ADR-089) — THE ROCKET (The Long Shot). The rocket sprite is
 * real, ownership rides a title, and the launch flies only the pad↔Mars route,
 * owns-gated and Ember-law (visited) safe — and it's REPEATABLE both ways.
 */
import { describe, it, expect } from 'vitest';
import { ownsRocket, canLaunch, launchCost, launchDestination, EARTH_PAD, MARS } from './rocket';
import { THE_LONG_SHOT } from '../data/rocket';
import { METHOD_CRAFT } from './ferry';
import { VEHICLE_SPECS } from '../spritegen/vehicles';

describe('the rocket sprite + data', () => {
  it('The Long Shot is a real air vehicle type', () => {
    expect(VEHICLE_SPECS[THE_LONG_SHOT.vehicleType]?.cls).toBe('rocket');
    expect(VEHICLE_SPECS[THE_LONG_SHOT.vehicleType].terrain).toBe('air');
  });
  it('its title is the one key that opens Mars (the ferry agrees)', () => {
    expect(THE_LONG_SHOT.title).toBe('title_the_long_shot');
    expect(METHOD_CRAFT.rocket).toContain('title_the_long_shot');
  });
  it('it flies from the Hawaii pad to Mars', () => {
    expect(EARTH_PAD).toBe('hawaii');
    expect(MARS).toBe('mars');
  });
});

describe('ownership + the launch rules', () => {
  const owned = ['title_the_long_shot'];
  it('you must own The Long Shot to launch', () => {
    expect(ownsRocket([])).toBe(false);
    expect(ownsRocket(owned)).toBe(true);
    expect(canLaunch(EARTH_PAD, MARS, [], ['mars']).reason).toBe('not_owned');
  });
  it('it flies only the pad↔Mars route', () => {
    expect(canLaunch('usa', MARS, owned, ['mars']).reason).toBe('wrong_pads');
    expect(canLaunch(EARTH_PAD, 'china', owned, ['china']).reason).toBe('wrong_pads');
  });
  it('it honors the Ember law (Mars must be visited)', () => {
    expect(canLaunch(EARTH_PAD, MARS, owned, []).reason).toBe('not_visited');
  });
  it('a fully-earned launch succeeds — and the return trip works (repeatable)', () => {
    expect(canLaunch(EARTH_PAD, MARS, owned, ['mars']).ok).toBe(true);
    expect(canLaunch(MARS, EARTH_PAD, owned, ['mars', 'hawaii']).ok).toBe(true);
  });
  it('a launch costs rocket fuel; destinations resolve both ways', () => {
    expect(launchCost()).toBeGreaterThan(0);
    expect(launchDestination(EARTH_PAD)).toBe(MARS);
    expect(launchDestination(MARS)).toBe(EARTH_PAD);
    expect(launchDestination('usa')).toBeNull();
  });
});
