/**
 * THE DUNGEON GRAMMARS — dispatch (S15g Movement Two, ADR-045). A recipe
 * names its SITE; this routes it to the bespoke grammar. Keyed by NAME so the
 * post-S14c chapter renumber can never strand a grammar (the chapter is
 * incidental; the site is identity).
 */
import type { DungeonRecipe, DraftMapDef, DungeonSite } from '../../schemas';
import {
  buildWintermoor,
  buildSleepersSpine,
  buildHedgerow,
  buildLaughingRuins,
  buildNightTrain,
  buildSporeForest,
  buildCastleHoaxula,
  buildSeaOfSilence,
} from './sites';

export { silenceCurve } from './sites';
export { isDungeonSolid, DUNGEON_WALL } from './kit';

const GRAMMARS: Record<DungeonSite, (r: DungeonRecipe) => DraftMapDef> = {
  wintermoor_academy: buildWintermoor,
  sleepers_spine: buildSleepersSpine,
  the_hedgerow: buildHedgerow,
  laughing_ruins: buildLaughingRuins,
  night_train: buildNightTrain,
  spore_forest: buildSporeForest,
  castle_hoaxula: buildCastleHoaxula,
  sea_of_silence: buildSeaOfSilence,
};

export function buildDungeon(r: DungeonRecipe): DraftMapDef {
  return GRAMMARS[r.site](r);
}
