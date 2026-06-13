/**
 * Dialogue text variables (GAME_BIBLE Prompt 6 + 21) — Phaser-free so the
 * resolver unit-tests headlessly. All New Game choices flow through here.
 */
import { GS, heroNameIn, type GameStateData } from '../engine/state';
import { EMOJI_GLYPH } from '../spritegen/font';

/**
 * S-Mia ("Ability Expansion"): the emoji TOKENIZER (the §5 caveat). The game
 * draws its own procedural bitmap font (no emoji glyphs), so a literal 🔥❄⚡
 * renders as tofu. `text` stores the REAL codepoint; glyphify() swaps it for the
 * matching code-drawn PUA glyph at draw time (and strips emoji variation
 * selectors, which the font can't address). Idempotent — PUA glyphs aren't
 * emoji, so re-running is a no-op (vars() and BattleScene.print both call it).
 */
const EMOJI_ENTRIES = Object.entries(EMOJI_GLYPH);
const VARIATION_SELECTORS = /[︎️]/g;

export function glyphify(text: string): string {
  if (!text) return text;
  let out = text.replace(VARIATION_SELECTORS, '');
  for (const [emoji, glyph] of EMOJI_ENTRIES) {
    if (out.includes(emoji)) out = out.replaceAll(emoji, glyph);
  }
  return out;
}

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
  pippa: (d) => heroNameIn(d, 'pippa'), // S15h: the fifth name token (Ch.5 dialogue reads it)
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
  const out = filled.startsWith('@') ? `•${filled.slice(1)}` : filled;
  // S-Mia: swap any emoji codepoints for their drawn glyphs (§5 caveat)
  return glyphify(out);
}
