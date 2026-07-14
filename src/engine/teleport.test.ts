import { describe, expect, it } from 'vitest';
import {
  canUseTeleportAbility,
  eligibleTeleportDestinations,
  resolveTeleportAttempt,
  TELEPORT_PP_COST,
  TELEPORT_RUN_UP_NATIVE_PX,
  type TeleportAbility,
  type TeleportAttemptInput,
  type TeleportDestination,
} from './teleport';

const destination: TeleportDestination = {
  id: 'lotus_harbor',
  label: 'Lotus Harbor',
  arrival: { map: 'lotus_harbor', x: 808, y: 908, facing: 'up' },
  visitedFlag: 'visited_lotus_harbor',
  storyOpenFlag: 'ch8_arrived',
};

const flags = (...on: string[]) => (flag: string): boolean => on.includes(flag);
const clearContext = {
  inBattle: false, inCutscene: false, modalOpen: false,
  incompatibleVehicle: false, locketStolen: false,
};

const attempt = (ability: TeleportAbility, overrides: Partial<TeleportAttemptInput> = {}): TeleportAttemptInput => ({
  ability,
  learnedAbilities: [ability],
  flagOf: flags('visited_lotus_harbor', 'ch8_arrived', 'awake_teleport_b'),
  pp: 20,
  destination,
  distanceNativePx: TELEPORT_RUN_UP_NATIVE_PX[ability],
  wallCollision: false,
  context: clearContext,
  ...overrides,
});

describe('Teleport eligibility', () => {
  it('requires a learned ability and independently story-gates Beta', () => {
    expect(canUseTeleportAbility('teleport_a', ['teleport_a'], flags())).toBe(true);
    expect(canUseTeleportAbility('teleport_b', ['teleport_b'], flags())).toBe(false);
    expect(canUseTeleportAbility('teleport_b', ['teleport_b'], flags('awake_teleport_b'))).toBe(true);
    expect(canUseTeleportAbility('teleport_b', [], flags('awake_teleport_b'))).toBe(false);
  });

  it('lists each legitimately visited, story-open town once and copies its safe anchor', () => {
    const unvisited = { ...destination, id: 'zanzibel', visitedFlag: 'visited_zanzibel' };
    const closed = { ...destination, id: 'chandrapore', storyClosedFlag: 'ch7_locket_stolen' };
    const result = eligibleTeleportDestinations(
      [destination, destination, unvisited, closed],
      flags('visited_lotus_harbor', 'ch8_arrived', 'ch7_locket_stolen'),
    );
    expect(result.map((entry) => entry.id)).toEqual(['lotus_harbor']);
    expect(result[0].arrival).toEqual(destination.arrival);
    expect(result[0].arrival).not.toBe(destination.arrival);
  });
});

describe('Teleport attempt state machine', () => {
  it('pins Alpha to 96 native pixels and Beta to a 32-pixel short dash', () => {
    expect(TELEPORT_RUN_UP_NATIVE_PX).toEqual({ teleport_a: 96, teleport_b: 32 });
    expect(TELEPORT_PP_COST).toEqual({ teleport_a: 2, teleport_b: 4 });
    expect(resolveTeleportAttempt(attempt('teleport_a', { distanceNativePx: 95 }))).toMatchObject({
      status: 'running', remainingNativePx: 1, ppSpent: 0,
    });
    expect(resolveTeleportAttempt(attempt('teleport_b', { distanceNativePx: 31 }))).toMatchObject({
      status: 'running', remainingNativePx: 1, ppSpent: 0,
    });
  });

  it.each(['teleport_a', 'teleport_b'] as const)('%s charges once on wall failure and never travels', (ability) => {
    const first = resolveTeleportAttempt(attempt(ability, { distanceNativePx: 1, wallCollision: true }));
    expect(first).toMatchObject({
      status: 'failed', reason: 'wall', soot: true, traveled: false,
      arrival: null, ppSpent: TELEPORT_PP_COST[ability], ppCharged: true,
    });
    const repeated = resolveTeleportAttempt(attempt(ability, {
      distanceNativePx: 1, wallCollision: true,
      pp: first.ppAfter, ppAlreadyCharged: first.ppCharged,
    }));
    expect(repeated.ppSpent).toBe(0);
    expect(repeated.ppAfter).toBe(first.ppAfter);
  });

  it.each(['teleport_a', 'teleport_b'] as const)('%s succeeds at threshold with one charge and only the safe anchor', (ability) => {
    const result = resolveTeleportAttempt(attempt(ability));
    expect(result).toMatchObject({
      status: 'success', traveled: true, arrival: destination.arrival,
      followers: 'reform', vehicles: 'unchanged', ppSpent: TELEPORT_PP_COST[ability],
    });
  });

  it.each([
    ['inBattle', 'battle'],
    ['inCutscene', 'cutscene'],
    ['modalOpen', 'modal'],
    ['incompatibleVehicle', 'incompatible-vehicle'],
    ['locketStolen', 'locket-stolen'],
  ] as const)('blocks %s without spending PP', (field, reason) => {
    const result = resolveTeleportAttempt(attempt('teleport_a', {
      context: { ...clearContext, [field]: true },
    }));
    expect(result).toMatchObject({ status: 'blocked', reason, ppSpent: 0, ppAfter: 20 });
  });

  it('blocks unvisited destinations and unaffordable attempts without a charge', () => {
    expect(resolveTeleportAttempt(attempt('teleport_a', { flagOf: flags('ch8_arrived') }))).toMatchObject({
      status: 'blocked', reason: 'destination-locked', ppSpent: 0,
    });
    expect(resolveTeleportAttempt(attempt('teleport_b', { pp: 3 }))).toMatchObject({
      status: 'blocked', reason: 'not-enough-pp', ppSpent: 0, ppAfter: 3,
    });
  });
});
