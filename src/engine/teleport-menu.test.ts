import { describe, expect, it } from 'vitest';
import {
  makeTeleportMenuRequest,
  TELEPORT_REQUEST_REGISTRY_KEY,
  TELEPORT_TOWN_DESTINATIONS,
} from './teleport-menu';
import { eligibleTeleportDestinations } from './teleport';
import { CHAR_LEGEND, MAPS } from '../data/maps';
import { CH8_WORLD } from '../data/maps_ch8';
import { TILESET, tileIndexByName } from '../spritegen/tiles';

const flagReader = (...enabled: string[]) => (flag: string): boolean => enabled.includes(flag);
const lotus = TELEPORT_TOWN_DESTINATIONS.find((destination) => destination.id === 'lotus_harbor')!;
const origin = { map: 'mt_shu_temple', x: 1200, y: 2400, facing: 'up' as const };

describe('Teleport field-menu handoff', () => {
  it('publishes one stable registry key and unique native safe-town anchors', () => {
    expect(TELEPORT_REQUEST_REGISTRY_KEY).toBe('teleportRequest');
    expect(new Set(TELEPORT_TOWN_DESTINATIONS.map((destination) => destination.id)).size)
      .toBe(TELEPORT_TOWN_DESTINATIONS.length);
    expect(TELEPORT_TOWN_DESTINATIONS.every((destination) =>
      destination.arrival.x >= 0 && destination.arrival.y >= 0)).toBe(true);
    const anchor = CH8_WORLD.lotusHarbor.arrival.city;
    expect(lotus.arrival).toEqual({
      map: 'lotus_harbor',
      x: anchor.x * 16 + 8,
      y: anchor.y * 16 + 12,
      facing: anchor.facing,
    });
  });

  it('pins every destination to a walkable authored map tile', () => {
    for (const destination of TELEPORT_TOWN_DESTINATIONS) {
      const map = MAPS[destination.arrival.map];
      expect(map, destination.id).toBeDefined();
      const tx = Math.floor(destination.arrival.x / 16);
      const ty = Math.floor(destination.arrival.y / 16);
      const glyph = map.grid[ty]?.[tx];
      const tile = tileIndexByName(CHAR_LEGEND[glyph] ?? 'grass_a');
      expect(TILESET[tile].solid, `${destination.id} (${tx},${ty}) glyph=${glyph}`).toBe(false);
      const solidPropHits = map.props.filter((prop) => prop.solid
        && destination.arrival.x >= prop.x * 16 + prop.solid.ox
        && destination.arrival.x <= prop.x * 16 + prop.solid.ox + prop.solid.w
        && destination.arrival.y >= prop.y * 16 + prop.solid.oy
        && destination.arrival.y <= prop.y * 16 + prop.solid.oy + prop.solid.h);
      expect(solidPropHits, `${destination.id} arrival overlaps a solid prop`).toEqual([]);
    }
  });

  it('offers only towns with both visit and story-open evidence', () => {
    const eligible = eligibleTeleportDestinations(
      TELEPORT_TOWN_DESTINATIONS,
      flagReader('ch6_arrived'),
    );
    expect(eligible.map((destination) => destination.id)).toEqual(['zanzibel']);
    expect(eligibleTeleportDestinations(
      TELEPORT_TOWN_DESTINATIONS,
      flagReader('ch8_arrived'),
    ).map((destination) => destination.id)).toEqual(['lotus_harbor']);
    expect(eligibleTeleportDestinations(
      TELEPORT_TOWN_DESTINATIONS,
      flagReader('ch4_arrived'),
    ).map((destination) => destination.id)).toEqual(['kvisthavn']);
    expect(eligibleTeleportDestinations(
      TELEPORT_TOWN_DESTINATIONS,
      flagReader('ch4_arrived', 'ch4_lilleby_seen'),
    ).map((destination) => destination.id)).toEqual(['kvisthavn', 'lilleby']);
  });

  it.each([
    ['teleport_a', 96, 2],
    ['teleport_b', 32, 4],
  ] as const)('%s emits the exact run-up/cost contract without charging PP', (ability, runUp, ppCost) => {
    const flags = ability === 'teleport_b'
      ? flagReader('ch8_arrived', 'awake_teleport_b')
      : flagReader('ch8_arrived');
    const selection = makeTeleportMenuRequest({
      ability,
      casterId: 'rex',
      learnedAbilities: [ability],
      flagOf: flags,
      pp: 20,
      destination: lotus,
      origin,
    });
    expect(selection).toEqual({
      ok: true,
      request: {
        version: 1,
        ability,
        casterId: 'rex',
        destination: lotus,
        origin,
        runUpNativePx: runUp,
        ppCost,
        ppAlreadyCharged: false,
      },
    });
  });

  it('blocks Beta before the elder flag and never emits an unaffordable request', () => {
    expect(makeTeleportMenuRequest({
      ability: 'teleport_b', casterId: 'rex', learnedAbilities: ['teleport_b'],
      flagOf: flagReader('ch8_arrived'), pp: 20, destination: lotus, origin,
    })).toEqual({ ok: false, reason: 'beta-story-locked' });
    expect(makeTeleportMenuRequest({
      ability: 'teleport_b', casterId: 'rex', learnedAbilities: ['teleport_b'],
      flagOf: flagReader('ch8_arrived', 'awake_teleport_b'), pp: 3, destination: lotus, origin,
    })).toEqual({ ok: false, reason: 'not-enough-pp' });
  });
});
