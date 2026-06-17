/**
 * THE ENEMY FORGE — proofs (S15g Movement Three, ADR-046).
 *  - (chapter + seed) → IDENTICAL BYTES (rosters hash-pinned; a refactor that
 *    shifts one stat fails here);
 *  - every forged enemy sits INSIDE its chapter's §A9 sanity band and
 *    schema-parses as a DraftEnemyDef;
 *  - a forged draft can NEVER masquerade as canon (the strict EnemiesSchema
 *    refuses its role/chapter tags — the DraftMapDef law, applied to enemies);
 *  - the curve is HONEST: every shipped §A7 Ch.1–2 regular enemy falls in its
 *    own chapter band (the forge scales from the same ladder they sit on);
 *  - the §A6 boss-HP ladder is pinned to canon.
 */
import { describe, it, expect } from 'vitest';
import { DraftEnemyDefSchema, EnemiesSchema } from '../../schemas';
import { ENEMIES } from '../../data/enemies';
import { buildRoster, buildEnemy, FORGE_ROLES } from './enemies';
import { outOfSanity, BOSS_HP, statAtLevel } from './curves';

function fnv(o: unknown): string {
  const s = JSON.stringify(o);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** one pinned roster hash per Ch.3–10 (buildRoster(ch, 1000 + ch)) */
const ROSTER_PINS: Record<number, string> = {
  3: '098d7c80', 4: 'e21942eb', 5: 'ca8badb1', 6: 'eb8a9a12',
  7: 'c54a1fa3', 8: '6b7cf0cb', 9: '0cd16b15', 10: '6f596f54',
};

describe('S15g M3 — the enemy forge is deterministic + canon-banded', () => {
  for (let ch = 3; ch <= 10; ch++) {
    it(`Ch.${ch}: roster is identical bytes, twice + hash-pinned`, () => {
      expect(JSON.stringify(buildRoster(ch, 1000 + ch))).toBe(JSON.stringify(buildRoster(ch, 1000 + ch)));
      expect(fnv(buildRoster(ch, 1000 + ch))).toBe(ROSTER_PINS[ch]);
    });
    it(`Ch.${ch}: every forged enemy is in-band, parses, and can't masquerade`, () => {
      for (const e of buildRoster(ch, 1000 + ch)) {
        expect(outOfSanity(e, ch), e.id).toEqual([]);
        expect(DraftEnemyDefSchema.safeParse(e).success, e.id).toBe(true);
        // the canon roster schema must REFUSE it (role/chapter have no slot)
        expect(EnemiesSchema.safeParse({ [e.id]: e }).success, e.id).toBe(false);
      }
    });
  }

  it('buildEnemy is deterministic per role across seeds', () => {
    for (const role of FORGE_ROLES) {
      for (const seed of [7, 42, 31337]) {
        const r = { chapter: 6, role, seed, index: 0 };
        expect(JSON.stringify(buildEnemy(r))).toBe(JSON.stringify(buildEnemy(r)));
        expect(outOfSanity(buildEnemy(r), 6)).toEqual([]);
      }
    }
  });
});

describe('S15g M3 — the curve is honest (shipped §A7 rows fall in their band)', () => {
  const CH: Record<number, string[]> = {
    1: ['cranky_mailbox', 'runaway_lawnmower', 'coily_cicada', 'blazer_smiler', 'pigeon_gang', 'hill_slug_deluxe'],
    2: ['pickpocket_parrot', 'gilded_beetle', 'cursed_souvenir', 'step_mask', 'banana_bunch', 'jungle_jitterbug'],
  };
  for (const [ch, ids] of Object.entries(CH)) {
    for (const id of ids) {
      it(`Ch.${ch} ${id} sits in its sanity band`, () => {
        expect(outOfSanity(ENEMIES[id], Number(ch)), id).toEqual([]);
      });
    }
  }
});

describe('S15g M3 — the §A6 boss ladder is pinned to canon', () => {
  it('boss HP matches the Bible', () => {
    // ADR-122 THE RESCALE: Ch.1–3 dropped to the new combat curve (Tick 60, Idol 300, Mainframe 750); Ch.4–9 await the staged forward retune.
    expect(BOSS_HP).toMatchObject({ 1: 60, 2: 300, 3: 750, 4: 1900, 5: 2150, 6: 2300, 7: 3200, 8: 4100, 9: 5300 });
  });
  it('the per-level baseline reproduces the Ch.1 anchor (a L1 ~24 HP foe)', () => {
    expect(statAtLevel(1).hp).toBe(25); // Cranky Mailbox neighborhood
    expect(statAtLevel(13).hp).toBe(109); // Jungle Jitterbug neighborhood
  });
});
