/**
 * Dialogue text variables (GAME_BIBLE Prompt 6 + 21) — Phaser-free so the
 * resolver unit-tests headlessly. All New Game choices flow through here.
 */
import { GS, heroNameIn, type GameStateData } from '../engine/state';

/**
 * Every {token} vars() resolves — THE registry. tools/content-validate.ts
 * sweeps all dialogue/map/item text against exactly these keys (S5), so a
 * typo like {favortefood} fails the build instead of rendering literally.
 * Add a variable here and the sweep accepts it everywhere, by construction.
 */
export const TEXT_VARS: Record<string, (d: GameStateData) => string> = {
  playername: (d) => d.playerName,
  favoritefood: (d) => d.favoriteFood,
  coolthing: (d) => d.coolestThing,
  rex: (d) => heroNameIn(d, 'rex'),
  faye: (d) => heroNameIn(d, 'faye'),
  milo: (d) => heroNameIn(d, 'milo'),
  dorin: (d) => heroNameIn(d, 'dorin'),
};

/**
 * Resolve {tokens} (and the @→• speech bullet). `data` defaults to the live
 * game; S6 slot summaries pass a slot's own blob so "{rex}'S HOUSE" follows
 * THAT playthrough's rename, not the loaded one's (ADR-013/018).
 */
export function vars(text: string, data: GameStateData = GS.data): string {
  let filled = text;
  for (const [name, get] of Object.entries(TEXT_VARS)) {
    if (filled.includes(`{${name}}`)) filled = filled.replaceAll(`{${name}}`, get(data));
  }
  // the Bible's @-speech convention renders as a speech bullet, not a literal @
  return filled.startsWith('@') ? `•${filled.slice(1)}` : filled;
}
