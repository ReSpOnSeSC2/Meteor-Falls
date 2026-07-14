/**
 * PARTY FATE (S21, ADR-127). The Axes make companions LEAVE and return — Pippa on
 * the STRINGS path (she can't trust her own agency around Jay), Dorin on the IRON
 * path (he knows better than anyone what being emptied costs). Pure state over
 * GS.data.party; the staged departure/return scenes live in OverworldScene.
 *
 * A departed hero is BENCHED (removed from the active party), never deleted: the
 * exact record rides `departedHeroes`, while a `<id>_left` flag feeds ending and
 * finale logic. Rejoin restores that record; legacy saves without one fall back
 * to the Prompt-21 name and a supplied level.
 */
import { GS, makeHeroState, type HeroState } from './state';
import type { HeroId } from '../data/heroes';
import { AWAKENINGS } from '../data/awakenings';

/** is this hero in the ACTIVE party right now? */
export function isPresent(id: HeroId): boolean {
  return GS.data.party.some((h) => h.id === id);
}

/** Copy the mutable members as well as the hero record itself, so edits to an
 * active hero can never leak into the persisted bench (or vice versa). */
export function cloneHeroState(hero: HeroState): HeroState {
  return {
    ...hero,
    stats: { ...hero.stats },
    bag: [...hero.bag],
    equip: { ...hero.equip },
    boosts: { ...hero.boosts },
  };
}

/** bench a hero — remove from the active party, remember they left */
export function departHero(id: HeroId): boolean {
  const i = GS.data.party.findIndex((h) => h.id === id);
  if (i < 0) return false;
  GS.data.departedHeroes[id] = cloneHeroState(GS.data.party[i]);
  GS.setFlag(`${id}_left`, true);
  GS.data.party.splice(i, 1);
  return true;
}

/** Restore the exact benched record. `level` is only a legacy fallback for a
 * left flag whose old/corrupt save has no companion record. */
export function rejoinHero(id: HeroId, level: number): void {
  if (isPresent(id)) {
    delete GS.data.departedHeroes[id];
    GS.setFlag(`${id}_left`, false);
    return;
  }
  const benched = GS.data.departedHeroes[id];
  const restored = benched
    ? cloneHeroState(benched)
    : makeHeroState(id, level, GS.data.heroNames[id]);
  GS.data.party.push(restored);
  delete GS.data.departedHeroes[id];
  GS.setFlag(`${id}_left`, false);
}

/** the IRON path locks Dorin's Vibe Comet Ω for the rest of the run — an intended,
 *  balance-validated cost (verify.ts iron_* variants keep the finale winnable with it
 *  withheld). There is no mid-run restore; the OPEN_HAND/MERCY branch at ch9_count is the
 *  alternative that never withholds. Passing on=false only undoes a not-yet-committed set. */
export function withholdUltimate(id: HeroId, on = true): void {
  GS.setFlag(`${id}_withholds`, on);
}
export function isWithholding(id: HeroId): boolean {
  return GS.flag(`${id}_withholds`) === true;
}

/** a hero's awakening-granted ability ids (its story "ultimate(s)" — Comet Ω for
 *  Dorin via trial_of_the_mute_mountain). Pure; read by the battle gate below. */
export function awakenedAbilityIds(id: HeroId): Set<string> {
  return new Set(Object.values(AWAKENINGS).filter((a) => a.hero === id).map((a) => a.ability));
}

/**
 * S21 (ADR-130): the BATTLE side of the withhold. While a hero `isWithholding`,
 * their awakened ultimate drops off the Vibe menu — the IRON-path Dorin can't
 * call Comet Ω for the rest of the run (its permanent cost; OPEN_HAND/MERCY at
 * ch9_count is the branch that never withholds). The pure
 * mirror of `puppetLocked()` (echo.ts): an engine predicate the scene asks per
 * ability, so the rule lives in one tested place (party.test.ts).
 */
export function isWithheldAbility(id: HeroId, abilityId: string): boolean {
  return isWithholding(id) && awakenedAbilityIds(id).has(abilityId);
}
