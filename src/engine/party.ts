/**
 * PARTY FATE (S21, ADR-127). The Axes make companions LEAVE and return — Pippa on
 * the STRINGS path (she can't trust her own agency around Jay), Dorin on the IRON
 * path (he knows better than anyone what being emptied costs). Pure state over
 * GS.data.party; the staged departure/return scenes live in OverworldScene.
 *
 * A departed hero is BENCHED (removed from the active party), never deleted: their
 * Prompt-21 name rides `heroNames`, the fact of their leaving rides a `<id>_left`
 * flag (which the ending cards + the finale read — they can still be dialed as a
 * caller), and rejoinHero rebuilds them at a level if they're gone.
 */
import { GS, makeHeroState } from './state';
import type { HeroId } from '../data/heroes';

/** is this hero in the ACTIVE party right now? */
export function isPresent(id: HeroId): boolean {
  return GS.data.party.some((h) => h.id === id);
}

/** bench a hero — remove from the active party, remember they left */
export function departHero(id: HeroId): boolean {
  const i = GS.data.party.findIndex((h) => h.id === id);
  if (i < 0) return false;
  GS.setFlag(`${id}_left`, true);
  GS.data.party.splice(i, 1);
  return true;
}

/** bring a benched hero back at a level (rebuilt if they were removed) */
export function rejoinHero(id: HeroId, level: number): void {
  GS.setFlag(`${id}_left`, false);
  if (isPresent(id)) return;
  GS.data.party.push(makeHeroState(id, level, GS.data.heroNames[id]));
}

/** the IRON path locks Dorin's Vibe Comet Ω until a redemption beat clears it */
export function withholdUltimate(id: HeroId, on = true): void {
  GS.setFlag(`${id}_withholds`, on);
}
export function isWithholding(id: HeroId): boolean {
  return GS.flag(`${id}_withholds`) === true;
}
