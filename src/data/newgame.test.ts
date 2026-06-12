/**
 * New Game BEHAVIOR — screen order, prefill identity, grid nav math,
 * don't-care randomness. The typeable-on-grid sweep and the §B4 placeholder
 * sweep moved to tools/content-validate.ts (S5).
 */
import { describe, it, expect } from 'vitest';
import {
  NEW_GAME_ENTRIES,
  GRID_ROWS,
  randomDontCare,
  NAME_CAP,
  PHRASE_CAP,
} from './newgame';
import { HEROES } from './heroes';
import { newGameData } from '../engine/state';

describe('New Game entry data (Prompt 21)', () => {
  it('seven screens in canon order', () => {
    expect(NEW_GAME_ENTRIES.map((e) => e.key)).toEqual([
      'rex',
      'faye',
      'milo',
      'dorin',
      'player',
      'food',
      'thing',
    ]);
  });

  it('hero prefills are the §A3 canon names; food/thing match the save defaults', () => {
    const fresh = newGameData();
    for (const id of ['rex', 'faye', 'milo', 'dorin'] as const) {
      const entry = NEW_GAME_ENTRIES.find((e) => e.key === id);
      expect(entry?.prefill).toBe(HEROES[id].name);
      expect(entry?.sprite).toBe(id);
    }
    expect(NEW_GAME_ENTRIES.find((e) => e.key === 'player')?.prefill).toBe('');
    expect(NEW_GAME_ENTRIES.find((e) => e.key === 'food')?.prefill).toBe(fresh.favoriteFood);
    expect(NEW_GAME_ENTRIES.find((e) => e.key === 'thing')?.prefill).toBe(fresh.coolestThing);
  });

  it('setup prompts plainly say what the player is entering', () => {
    const byKey = (key: string): string => NEW_GAME_ENTRIES.find((e) => e.key === key)?.prompt ?? '';

    expect(byKey('player')).toContain('YOUR name');
    expect(byKey('player')).not.toMatch(/holding this|shy/i);
    expect(byKey('food')).toContain('favorite homemade food');
    expect(byKey('thing')).toContain('coolest thing');
  });

  it('the grid is 5 even rows of 13; caps are the canon constants (nav math depends on it)', () => {
    expect(GRID_ROWS).toHaveLength(5);
    for (const row of GRID_ROWS) expect(row).toHaveLength(13);
    for (const e of NEW_GAME_ENTRIES) {
      expect(e.cap).toBe(e.kind === 'hero' || e.kind === 'player' ? NAME_CAP : PHRASE_CAP);
      expect(e.dontCare.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("don't-care picks from the list", () => {
    const e = NEW_GAME_ENTRIES[0];
    for (let i = 0; i < 50; i++) {
      expect(e.dontCare).toContain(randomDontCare(e));
    }
  });
});
