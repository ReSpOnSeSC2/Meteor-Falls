/**
 * THE LEVELKIT (S15g, ADR-044) — the production system that makes every
 * world session after it faster WITHOUT lowering the floor.
 *
 * (recipe + seed) → a plain DraftMapDef, deterministically (Prime Law 2).
 * Generators output the same MapDef the scene runtime already walks; drafts
 * differ only by role-tagged NPC slots and live OUTSIDE the MAPS registry +
 * the §B4 sweep (Prime Law 1). Promotion is a human act.
 *
 * Determinism rides the named Streams (mulberry32 == seededRng); generated
 * cities pass the ADR-012 sweep BY CONSTRUCTION (Prime Law 3). Nothing here
 * imports Phaser — the kit is pure data, vitest-pinnable.
 */
export { Streams, namedStream, streamSeed } from './rng';
export { STYLE_PACKS, BAND_ROSTER, ROLE_FACADE } from './kit';
export { buildCity, buildTown, buildVillage, buildDistrict, buildWoods, buildUnderground, placeNook } from './settlements';
export type { DistrictRegion, DistrictReserve, DistrictOpts, DistrictResult, NookKind } from './settlements';
export { buildInterior } from './interiors';
export { buildRoute, buildWild } from './routes';
export { buildTravelScene } from './travel';
export { buildDungeon } from './dungeons';
export { cityViolations, cityMetrics } from './metrics';
export type { CityLike, CityMetrics } from './metrics';
export { pressureReport, pressureHardFlags, bandVerdict, BAND_TARGET, PRESSURE_LIMITS } from './pressure';
export type { PressureReport, PressureLike } from './pressure';
export { dungeonFlags, mapQualityFlags, softLockFailures, floorIsTree, levelJoinFor } from './mapcheck';

import type { Recipe, DraftMapDef } from '../schemas';
import { buildCity, buildTown, buildVillage } from './settlements';
import { buildInterior } from './interiors';
import { buildRoute, buildWild } from './routes';
import { buildTravelScene } from './travel';
import { buildDungeon } from './dungeons';

/** dispatch any recipe to its generator (the LAB + bench:map entry point) */
export function generate(r: Recipe): DraftMapDef {
  switch (r.kind) {
    case 'city':
      return buildCity(r);
    case 'town':
      return buildTown(r);
    case 'village':
      return buildVillage(r);
    case 'interior':
      return buildInterior(r);
    case 'route':
      return buildRoute(r);
    case 'wild':
      return buildWild(r);
    case 'travel':
      return buildTravelScene(r);
    case 'dungeon':
      return buildDungeon(r);
  }
}
