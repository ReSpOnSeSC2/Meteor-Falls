/**
 * THE FORGED ENEMY REGISTRY — wiring proofs (S15g Movement Three, ADR-046).
 *  - the registry IS the roster forge.test.ts pins (FIXED_SEED[ch] === 1000+ch);
 *  - BAND_ROSTER Ch.3–10 resolve ENTIRELY to forged ids the registry holds, so
 *    a walked dungeon's every spawn has a def the LAB can inject;
 *  - ch1/ch2 stay the shipped, frozen §A7 enemies;
 *  - PRIME LAW 1: no forged id leaks into the canon ENEMIES SOURCE, and the
 *    strict EnemiesSchema refuses a tagged draft;
 *  - stripForgeTags yields the canon-valid EnemyDef the LAB injects at runtime.
 */
import { describe, it, expect } from 'vitest';
import { EnemiesSchema, EnemyDefSchema } from '../../schemas';
import { ENEMIES } from '../../data/enemies';
import { BAND_ROSTER } from '../kit';
import { buildRoster } from './enemies';
import {
  FORGED_ENEMIES,
  FORGED_ROSTERS,
  FIXED_SEED,
  FORGE_CHAPTERS,
  forgedBandIds,
  stripForgeTags,
} from './registry';

describe('S15g M3 — the forged registry is deterministic + canon-seeded', () => {
  for (const ch of FORGE_CHAPTERS) {
    it(`Ch.${ch}: FIXED_SEED is 1000+ch and the roster matches the pinned buildRoster`, () => {
      expect(FIXED_SEED[ch]).toBe(1000 + ch);
      expect(JSON.stringify(FORGED_ROSTERS[ch])).toBe(JSON.stringify(buildRoster(ch, 1000 + ch)));
    });
  }
  it('FORGED_ENEMIES keys every forged enemy by id (no roster member dropped)', () => {
    const total = FORGE_CHAPTERS.reduce((n, ch) => n + FORGED_ROSTERS[ch].length, 0);
    expect(Object.keys(FORGED_ENEMIES).length).toBe(total);
  });
});

describe('S15g M3 — BAND_ROSTER Ch.3–10 resolve to forged ids (the wiring)', () => {
  for (let ch = 3; ch <= 10; ch++) {
    it(`ch${ch}: every band id is a forged enemy the registry can inject`, () => {
      const ids = BAND_ROSTER[`ch${ch}` as keyof typeof BAND_ROSTER];
      expect(ids.length).toBeGreaterThan(0);
      expect([...ids]).toEqual(forgedBandIds(ch));
      for (const id of ids) {
        expect(FORGED_ENEMIES[id], id).toBeTruthy();
        expect(id.startsWith(`forge_ch${ch}_`), id).toBe(true);
      }
    });
  }
  it('ch1/ch2 stay the shipped, frozen §A7 enemies (not forged drafts)', () => {
    for (const band of ['ch1', 'ch2'] as const) {
      for (const id of BAND_ROSTER[band]) {
        expect(ENEMIES[id], id).toBeTruthy();
        expect(FORGED_ENEMIES[id], id).toBeUndefined();
      }
    }
  });
});

describe('S15g M3 — Prime Law 1: a forged draft never enters canon ENEMIES', () => {
  it('no forged id exists in the shipped ENEMIES source', () => {
    for (const id of Object.keys(FORGED_ENEMIES)) {
      expect(ENEMIES[id], id).toBeUndefined();
    }
  });
  it('the strict canon EnemiesSchema REFUSES a tagged forged draft', () => {
    const draft = Object.values(FORGED_ENEMIES)[0];
    expect(EnemiesSchema.safeParse({ [draft.id]: draft }).success).toBe(false);
  });
});

describe('S15g M3 — stripForgeTags yields the canon EnemyDef the LAB injects', () => {
  it('drops role/chapter/partsSpec and parses as a canon EnemyDef', () => {
    for (const draft of Object.values(FORGED_ENEMIES)) {
      const canon = stripForgeTags(draft);
      expect('role' in canon).toBe(false);
      expect('chapter' in canon).toBe(false);
      expect('partsSpec' in canon).toBe(false);
      expect(EnemyDefSchema.safeParse(canon).success, draft.id).toBe(true);
      // stripped, it can now live in the runtime registry (canon-valid)
      expect(EnemiesSchema.safeParse({ [canon.id]: canon }).success, draft.id).toBe(true);
    }
  });
});
