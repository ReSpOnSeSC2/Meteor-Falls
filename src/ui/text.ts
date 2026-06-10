/**
 * Dialogue text variables (GAME_BIBLE Prompt 6 + Prompt 21) — Phaser-free so
 * the resolver unit-tests headlessly. All New Game choices flow through here.
 */
import { GS } from '../engine/state';

export function vars(text: string): string {
  const filled = text
    .replaceAll('{playername}', GS.data.playerName)
    .replaceAll('{favoritefood}', GS.data.favoriteFood)
    .replaceAll('{coolthing}', GS.data.coolestThing)
    .replaceAll('{rex}', GS.heroName('rex'))
    .replaceAll('{faye}', GS.heroName('faye'))
    .replaceAll('{milo}', GS.heroName('milo'))
    .replaceAll('{dorin}', GS.heroName('dorin'));
  // the Bible's @-speech convention renders as a speech bullet, not a literal @
  return filled.startsWith('@') ? `•${filled.slice(1)}` : filled;
}
