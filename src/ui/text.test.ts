import { describe, it, expect, beforeEach } from 'vitest';
import { vars, glyphify, foldToFont } from './text';
import { GS, newGameData } from '../engine/state';
import { DIALOGUE } from '../data/dialogue';
import { EMOJI_GLYPH, FONT_CHARS } from '../spritegen/font';
import { ABILITIES } from '../data/abilities';

describe('dialogue text variables (Prompt 6 + 21)', () => {
  beforeEach(() => GS.reset());

  it('resolves every New Game variable', () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', pippa: 'Quill', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    expect(vars('{rex} {faye} {milo} {dorin}')).toBe('Casey Wren Pekoe Petru');
    expect(vars('Hi {playername}, eat {favoritefood}, behold {coolthing}.')).toBe(
      'Hi Jay, eat pancakes, behold dial tones.',
    );
  });

  it('unjoined heroes resolve from the heroNames record', () => {
    expect(vars('{faye}')).toBe('Mia');
  });

  it('renders the @-speech convention as a bullet', () => {
    expect(vars('@Hello.')).toBe('•Hello.');
  });

  it("Mom's dinner line greets you with your chosen food (§A11: the joke survives)", () => {
    GS.data.favoriteFood = 'fuzzy pickles';
    const line = vars(DIALOGUE.npc_mom[0]);
    expect(line).toContain('Dinner is fuzzy pickles.');
    expect(line).not.toContain('{favoritefood}');
  });

  // (the every-{token}-resolves sweep is validator-owned now: S5 checks all
  //  dialogue/map/item/battle text against the TEXT_VARS registry)

  it("S2: Mom's payphone call consumes {favoritefood} and {rex} (ADR-013 — no literals)", () => {
    GS.applyNewGameChoices({
      heroNames: { rex: 'Casey', faye: 'Wren', milo: 'Pekoe', pippa: 'Quill', dorin: 'Petru' },
      playerName: 'Jay',
      favoriteFood: 'pancakes',
      coolestThing: 'dial tones',
    });
    const all = DIALOGUE.mom_payphone.map((p) => vars(p)).join('\n');
    expect(all).toContain('pancakes');
    expect(all).toContain('Casey');
    expect(all).not.toMatch(/\{\w+\}/);
    // the join + manager scenes carry her chosen name everywhere
    expect(DIALOGUE.faye_join.map((p) => vars(p)).join('\n')).toContain('Wren');
    expect(DIALOGUE.manager_intro.map((p) => vars(p)).join('\n')).toContain('Wren');
  });

  // S-Mia ("Ability Expansion"): the emoji glyph map (§5 caveat — the procedural
  // font draws no emoji, so a literal codepoint must resolve to a drawn glyph or
  // it renders as tofu). glyphify() swaps emoji → PUA glyph; the font draws it.
  it('every authored emoji codepoint resolves to a drawn glyph (no tofu)', () => {
    for (const [emoji, glyph] of Object.entries(EMOJI_GLYPH)) {
      // the swap happens…
      expect(glyphify(emoji)).toBe(glyph);
      // …and the swapped char is a single code unit the font actually draws
      expect(glyph.length).toBe(1);
      expect(FONT_CHARS).toContain(glyph);
    }
  });

  it('glyphify strips emoji variation selectors and is idempotent', () => {
    // ❄️ (snowflake + U+FE0F) collapses to the drawn ❄ glyph
    expect(glyphify('❄️')).toBe(EMOJI_GLYPH['❄']);
    // PUA glyphs are not emoji, so re-running is a no-op
    const once = glyphify('a 🔥 b');
    expect(glyphify(once)).toBe(once);
    // plain ASCII passes through untouched (the existing dialogue tests rely on it)
    expect(glyphify('Hi Jay.')).toBe('Hi Jay.');
  });

  it("every emoji in Mia's spell lines is one the glyph map can draw", () => {
    // gather all non-ASCII codepoints from her ability text; after glyphify each
    // surviving char must be in FONT_CHARS (a face exists — no tofu ships)
    for (const ab of Object.values(ABILITIES)) {
      for (const ch of glyphify(ab.text)) {
        const code = ch.codePointAt(0) ?? 0;
        if (code < 32 || code > 126) {
          // tokens like {user} are ASCII; anything left non-ASCII must be a glyph
          expect(FONT_CHARS).toContain(ch);
        }
      }
    }
  });

  it("S6: vars() resolves against a PASSED blob — slot summaries use each slot's own names", () => {
    const other = newGameData();
    for (const h of other.party) h.name = 'Otto';
    other.heroNames.rex = 'Otto';
    other.heroNames.faye = 'Wilma';
    other.favoriteFood = 'waffles';
    expect(vars("{rex}'S HOUSE", other)).toBe("Otto'S HOUSE");
    expect(vars('{faye} loves {favoritefood}', other)).toBe('Wilma loves waffles');
    // the one-arg form still reads the live game
    expect(vars("{rex}'S HOUSE")).toBe("Jay'S HOUSE");
  });
});

// The 5×7 font only draws ASCII + a fixed symbol set. foldToFont() maps authored
// international spellings and stray punctuation down to renderable glyphs at draw
// time so nothing ships as a gap, while the source keeps its correct spelling.
describe('foldToFont — render-time fallback for font-unrenderable characters', () => {
  it('folds accented international names to their ASCII base', () => {
    expect(foldToFont('Choripán')).toBe('Choripan');
    expect(foldToFont('Rømmegrøt')).toBe('Rommegrot');
    expect(foldToFont('Fårikål')).toBe('Farikal');
    expect(foldToFont('Junior Jötun')).toBe('Junior Jotun');
    expect(foldToFont('señor')).toBe('senor');
    expect(foldToFont('mămăligă')).toBe('mamaliga');
    expect(foldToFont('Brânză de Burduf')).toBe('Branza de Burduf');
    expect(foldToFont('Papanași')).toBe('Papanasi');
    expect(foldToFont('kāṣāya')).toBe('kasaya');
    expect(foldToFont('EL MALECÓN')).toBe('EL MALECON');
  });

  it('folds smart punctuation and stray symbols to renderable glyphs', () => {
    expect(foldToFont('wasn’t')).toBe("wasn't");
    expect(foldToFont('“hi”')).toBe('"hi"');
    expect(foldToFont('a – b')).toBe('a - b');
    expect(foldToFont('↑ THE ROAD')).toBe('▲ THE ROAD');
    expect(foldToFont('A · B · C')).toBe('A • B • C');
  });

  it('leaves ASCII and already-supported glyphs untouched', () => {
    expect(foldToFont('Hi Jay.')).toBe('Hi Jay.');
    // em-dash, ellipsis, and bullet ARE in the font — must survive the fold
    expect(foldToFont('one — two … three • four')).toBe('one — two … three • four');
  });

  it('every folded character is one the font can actually draw (no gaps ship)', () => {
    const samples = [
      'Choripán', 'Rømmegrøt', 'Junior Jötun', 'señor', 'mămăligă', 'kāṣāya',
      'wasn’t', '↑ THE ROAD', 'A · B', 'EL MALECÓN', 'Tomás', 'Vegvísir',
    ];
    for (const s of samples) {
      for (const ch of foldToFont(s)) {
        const code = ch.codePointAt(0) ?? 0;
        if (code < 32 || code > 126) expect(FONT_CHARS).toContain(ch);
      }
    }
  });

  it('is applied through glyphify() (and therefore vars() and battle print)', () => {
    expect(glyphify('Choripán')).toBe('Choripan');
    expect(vars('@Go warm, niño.')).toBe('•Go warm, nino.');
  });
});
