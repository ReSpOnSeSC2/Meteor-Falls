/**
 * THE EMOTE POP — the wiring mirror (S18, ADR-093 family).
 *
 * The emote runtime (engine/emote.ts) pops one of THE FLAIR WEAVE's pixel glyphs
 * over a character's head. This suite is its slop-detector: every EmoteId resolves
 * to a glyph token that the weave actually DRAWS (so no emote can ever point at a
 * missing texture), emoteGlyphKey() returns the canonical `flair_<token>` key, and
 * the `ellipsis` glyph minted for the `think` emote is declared in the registry and
 * renders palette-clean without throwing. (popEmote() itself is exercised in-scene;
 * this stays Phaser-free, like flair.test.ts.)
 */
import { describe, expect, it } from 'vitest';
import { EMOTES, emoteGlyphKey, type EmoteId } from './emote';
import {
  GLYPH_TOKENS,
  flairGlyph,
  flairGlyphKey,
  glyphRegistryNames,
  isGlyph,
  GLYPH_W,
  GLYPH_H,
} from '../spritegen/flair';
import { PALETTE, T } from '../palette';

const EMOTE_IDS = Object.keys(EMOTES) as EmoteId[];

describe('THE EMOTE POP — every emote maps to a real flair glyph', () => {
  it('every EmoteId resolves to a token the weave declares AND draws', () => {
    const declared = new Set<string>(GLYPH_TOKENS);
    const drawn = new Set(glyphRegistryNames());
    for (const id of EMOTE_IDS) {
      const token = EMOTES[id];
      expect(declared.has(token), `EMOTES['${id}'] = '${token}' not in GLYPH_TOKENS`).toBe(true);
      expect(drawn.has(token), `EMOTES['${id}'] = '${token}' has no draw fn`).toBe(true);
      expect(isGlyph(token), `'${token}' is not a real flair glyph`).toBe(true);
    }
  });

  it('emoteGlyphKey() returns the canonical flair_<token> key', () => {
    for (const id of EMOTE_IDS) {
      expect(emoteGlyphKey(id)).toBe(flairGlyphKey(EMOTES[id]));
      expect(emoteGlyphKey(id)).toBe(`flair_${EMOTES[id]}`);
    }
    // pin the canonical map so a rename can't silently drift
    expect(emoteGlyphKey('surprise')).toBe('flair_exclaim');
    expect(emoteGlyphKey('idle')).toBe('flair_note');
    expect(emoteGlyphKey('sleep')).toBe('flair_zzz');
    expect(emoteGlyphKey('think')).toBe('flair_ellipsis');
    expect(emoteGlyphKey('happy')).toBe('flair_heart');
  });

  it('covers the five named feelings', () => {
    expect(EMOTE_IDS.sort()).toEqual(['happy', 'idle', 'sleep', 'surprise', 'think']);
  });
});

describe('THE EMOTE POP — the new `ellipsis` glyph (the think mark)', () => {
  it('is registered in the flair vocabulary', () => {
    expect(GLYPH_TOKENS).toContain('ellipsis');
    expect(isGlyph('ellipsis')).toBe(true);
    expect(glyphRegistryNames()).toContain('ellipsis');
  });

  it('renders into the 11×11 cell, palette-clean, without throwing', () => {
    let pm!: ReturnType<typeof flairGlyph>;
    expect(() => {
      pm = flairGlyph('ellipsis');
    }).not.toThrow();
    expect(pm.w).toBe(GLYPH_W);
    expect(pm.h).toBe(GLYPH_H);
    let drawn = 0;
    for (const c of pm.data) {
      expect(c === T || (c >= 0 && c < PALETTE.length), `off-palette index ${c}`).toBe(true);
      if (c !== T) drawn++;
    }
    expect(drawn, 'ellipsis drew nothing').toBeGreaterThan(4);
  });
});
