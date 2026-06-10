import { describe, it, expect } from 'vitest';
import {
  NEW_GAME_ENTRIES,
  GRID_ROWS,
  gridCharset,
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

  it('the grid is 5 even rows of 13 (nav math depends on it)', () => {
    expect(GRID_ROWS).toHaveLength(5);
    for (const row of GRID_ROWS) expect(row).toHaveLength(13);
  });

  it("every prefill and don't-care value is typeable on the grid and fits its box", () => {
    const charset = gridCharset();
    for (const e of NEW_GAME_ENTRIES) {
      expect(e.cap).toBe(e.kind === 'hero' || e.kind === 'player' ? NAME_CAP : PHRASE_CAP);
      expect(e.dontCare.length).toBeGreaterThanOrEqual(4);
      for (const v of [e.prefill, ...e.dontCare]) {
        expect(v.length).toBeLessThanOrEqual(e.cap);
        for (const ch of v) {
          expect(charset.has(ch), `'${ch}' of '${v}' missing from grid`).toBe(true);
        }
      }
    }
  });

  it("don't-care picks from the list", () => {
    const e = NEW_GAME_ENTRIES[0];
    for (let i = 0; i < 50; i++) {
      expect(e.dontCare).toContain(randomDontCare(e));
    }
  });

  it('no placeholder strings (§B4)', () => {
    expect(/todo|placeholder|lorem/i.test(JSON.stringify(NEW_GAME_ENTRIES))).toBe(false);
  });
});
