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

/**
 * The 5×7 bitmap font (src/spritegen/font.ts) only draws ASCII 32–126 plus a fixed
 * symbol set (▼▲◄►←→▶★♥…—•). Authored text carries characters it can't address —
 * authentic international names (Choripán, Rømmegrøt, Jötun, señor, mămăligă),
 * smart punctuation pasted from ChatGPT (' ' " " –), and a couple of stray symbols
 * (↑ ↓ ·) — all of which would render as GAPS. foldToFont() maps them to renderable
 * equivalents at DRAW TIME so the authored source keeps its correct spelling while
 * the screen shows a clean ASCII/known-glyph fallback. Chosen over extending the
 * (frozen) font: non-destructive, one place, covers future cases by construction.
 */
const FONT_FOLD: Record<string, string> = {
  // non-decomposable Latin letters (NFD can't strip these)
  ø: 'o', Ø: 'O', æ: 'ae', Æ: 'AE', œ: 'oe', Œ: 'OE', ß: 'ss',
  đ: 'd', Đ: 'D', ð: 'd', Ð: 'D', þ: 'th', Þ: 'Th', ł: 'l', Ł: 'L', ı: 'i',
  // smart punctuation → straight ASCII
  '‘': "'", '’': "'", '‚': ',', '“': '"', '”': '"',
  '–': '-', '−': '-', ' ': ' ', '«': '"', '»': '"',
  // stray symbols → the font's existing sibling glyphs
  '↑': '▲', '↓': '▼', '·': '•',
};
const FONT_FOLD_RE = new RegExp(`[${Object.keys(FONT_FOLD).join('')}]`, 'g');

export function foldToFont(text: string): string {
  if (!text) return text;
  // strip combining diacritics off decomposable letters (á â ñ ö ā ă ș í ó …),
  // then map the leftovers the font still can't draw.
  const stripped = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return FONT_FOLD_RE.test(stripped) ? stripped.replace(FONT_FOLD_RE, (c) => FONT_FOLD[c] ?? c) : stripped;
}

export function glyphify(text: string): string {
  if (!text) return text;
  let out = text.replace(VARIATION_SELECTORS, '');
  for (const [emoji, glyph] of EMOJI_ENTRIES) {
    if (out.includes(emoji)) out = out.replaceAll(emoji, glyph);
  }
  // fold font-unrenderable characters LAST — after emoji became PUA glyphs, which
  // NFD/the map leave untouched (idempotent alongside re-runs of glyphify).
  return foldToFont(out);
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

/** comma-group a non-negative integer: 1234567 → "1,234,567". */
function group(v: number): string {
  const s = String(v);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ',';
    out += s[i];
  }
  return out;
}

/**
 * Format a money amount for display (ADR-pending): comma-grouped ("$1,234,567")
 * for exact contexts like the ATM, or — with `{abbrev}` — shortened once it gets
 * big ("$1.2M", "$3.4B", "$1.0T") so it fits tight HUD corners as the §A9 fortune
 * arc climbs to the billions (the cash/bank box was running off-screen with raw
 * digits). Display-only; never feed this back into arithmetic.
 */
export function money(n: number, opts?: { abbrev?: boolean }): string {
  const neg = n < 0;
  const v = Math.abs(Math.floor(n));
  let body: string;
  if (opts?.abbrev && v >= 1_000_000) {
    const units: Array<[number, string]> = [
      [1e12, 'T'],
      [1e9, 'B'],
      [1e6, 'M'],
    ];
    const hit = units.find(([b]) => v >= b);
    const base = hit ? hit[0] : 1e6;
    const suf = hit ? hit[1] : 'M';
    const scaled = v / base;
    // one decimal until it reaches 100 of that unit, then drop it ($120M not $120.4M)
    body = (scaled >= 100 ? String(Math.floor(scaled)) : scaled.toFixed(1).replace(/\.0$/, '')) + suf;
  } else {
    body = group(v);
  }
  return `${neg ? '-' : ''}$${body}`;
}
