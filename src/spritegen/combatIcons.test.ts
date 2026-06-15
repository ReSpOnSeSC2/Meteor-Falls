import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ABILITIES } from '../data/abilities';
import { T } from '../palette';
import { FLAIR_BY_ELEMENT, FLAIR_BY_RESULT, GLYPH_TOKENS } from './flair';
import {
  ABILITY_ICON,
  BATTLE_FX_ICON,
  STATUS_ICON,
  STATUS_ICON_NAMES,
  abilityIconKey,
  battleFxIconKey,
  statusIconKey,
} from './combatIcons';
import type { Pixmap } from './pixmap';

const nonT = (pm: Pixmap): number => pm.data.reduce((n, c) => n + (c !== T ? 1 : 0), 0);
const keyOf = (pm: Pixmap): string => `${pm.w}x${pm.h}:${Buffer.from(pm.data).toString('base64')}`;

function packageAbilityIds(): string[] {
  return readFileSync('docs/asset-lists/ability_icons.txt', 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('PKG-05 ability icons', () => {
  it('matches the ability source of truth and package list', () => {
    const listed = packageAbilityIds();
    expect(listed.length).toBe(92);
    expect(new Set(listed)).toEqual(new Set(Object.keys(ABILITIES)));
    expect(new Set(Object.keys(ABILITY_ICON))).toEqual(new Set(listed));
  });

  it('draws one distinct 16x16-or-smaller face per ability', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [id, draw] of Object.entries(ABILITY_ICON)) {
      const pm = draw();
      expect(pm.w, id).toBeLessThanOrEqual(16);
      expect(pm.h, id).toBeLessThanOrEqual(16);
      expect(nonT(pm), id).toBeGreaterThan(8);
      const k = keyOf(pm);
      const prev = seen.get(k);
      if (prev) collisions.push(`${id} === ${prev}`);
      else seen.set(k, id);
    }
    expect(collisions).toEqual([]);
  });

  it('uses stable texture keys', () => {
    expect(abilityIconKey('vibe_fire_a')).toBe('ability_vibe_fire_a');
  });
});

describe('PKG-05 status badges', () => {
  it('exports exactly the requested badge names', () => {
    expect(STATUS_ICON_NAMES).toEqual([
      'asleep',
      'burn',
      'crying',
      'exposed',
      'frozen',
      'gilded',
      'hushed',
      'marked',
      'paralyzed',
      'puppet',
      'rattled',
      'shield',
    ]);
    expect(new Set(Object.keys(STATUS_ICON))).toEqual(new Set(STATUS_ICON_NAMES));
  });

  it('draws tiny overlay-sized badges', () => {
    for (const name of STATUS_ICON_NAMES) {
      const pm = STATUS_ICON[name]();
      expect(pm.w, name).toBe(8);
      expect(pm.h, name).toBe(8);
      expect(nonT(pm), name).toBeGreaterThan(3);
      expect(statusIconKey(name)).toBe(`status_${name}`);
    }
  });
});

describe('PKG-05 battle fx icons', () => {
  it('aliases the full flair glyph set', () => {
    expect(new Set(Object.keys(BATTLE_FX_ICON))).toEqual(new Set(GLYPH_TOKENS));
    expect(GLYPH_TOKENS.length).toBeGreaterThanOrEqual(40);
  });

  it('covers battle auto-flair mappings', () => {
    for (const g of Object.values(FLAIR_BY_ELEMENT)) if (g) expect(BATTLE_FX_ICON[g]).toBeDefined();
    for (const g of Object.values(FLAIR_BY_RESULT)) expect(BATTLE_FX_ICON[g]).toBeDefined();
  });

  it('draws 11x11 spritelets under stable fx keys', () => {
    for (const [name, draw] of Object.entries(BATTLE_FX_ICON)) {
      const pm = draw();
      expect(pm.w, name).toBe(11);
      expect(pm.h, name).toBe(11);
      expect(nonT(pm), name).toBeGreaterThan(4);
      expect(battleFxIconKey(name)).toBe(`fx_${name}`);
    }
  });
});
