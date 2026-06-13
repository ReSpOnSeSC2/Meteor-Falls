/**
 * THE FORGED ENEMY REGISTRY (S15g Movement Three, ADR-046) — the dev-only
 * roster the LEVELKIT LAB injects so a walked Ch.3–10 dungeon fights REAL
 * forged foes (placeholder sprites until 3b). DETERMINISTIC by construction:
 * each chapter's roster is buildRoster(ch, FIXED_SEED[ch]) — recipe+seed →
 * identical bytes, the exact rosters forge.test.ts already hash-pins. No
 * Date.now()/Math.random() (Prime Law 2 — it is all buildRoster).
 *
 * PRIME LAW 1 holds BY CONSTRUCTION: a forged draft carries role/chapter tags
 * the strict canon EnemiesSchema has no slot for, so it can never masquerade as
 * a shipped §A7 row. The registry lives OUTSIDE src/data/enemies.ts; promotion
 * is a human act. The LAB strips those tags at injection time (stripForgeTags)
 * exactly the way it strips a map draft's role-tagged NPC slots before MAPS —
 * the canon ENEMIES SOURCE is never touched.
 */
import type { DraftEnemyDef, EnemyDef } from '../../schemas';
import { buildRoster } from './enemies';

/** the §A7 chapters the forge drafts (Ch.1–2 stay the shipped, frozen roster) */
export const FORGE_CHAPTERS: readonly number[] = [3, 4, 5, 6, 7, 8, 9, 10];

/**
 * The canonical seed per Ch.3–10. Pinned to 1000+ch so the registry IS the
 * roster forge.test.ts proves (buildRoster(ch, 1000 + ch)); change a seed here
 * and the dungeon hashes move with it — that is the point (the recipe owns the
 * bytes, ADR-046).
 */
export const FIXED_SEED: Record<number, number> = {
  3: 1003, 4: 1004, 5: 1005, 6: 1006, 7: 1007, 8: 1008, 9: 1009, 10: 1010,
};

/** the forged roster for each Ch.3–10 (deterministic on FIXED_SEED) */
export const FORGED_ROSTERS: Record<number, readonly DraftEnemyDef[]> = {
  3: buildRoster(3, FIXED_SEED[3]),
  4: buildRoster(4, FIXED_SEED[4]),
  5: buildRoster(5, FIXED_SEED[5]),
  6: buildRoster(6, FIXED_SEED[6]),
  7: buildRoster(7, FIXED_SEED[7]),
  8: buildRoster(8, FIXED_SEED[8]),
  9: buildRoster(9, FIXED_SEED[9]),
  10: buildRoster(10, FIXED_SEED[10]),
};

/** every forged enemy keyed by id — the dev registry the LAB injects (stripped) */
export const FORGED_ENEMIES: Record<string, DraftEnemyDef> = Object.fromEntries(
  FORGE_CHAPTERS.flatMap((ch) => FORGED_ROSTERS[ch].map((e) => [e.id, e] as const)),
);

/** the forged roster ids for a chapter — what BAND_ROSTER points Ch.3–10 at */
export function forgedBandIds(ch: number): string[] {
  return (FORGED_ROSTERS[ch] ?? []).map((e) => e.id);
}

/**
 * Strip the forge's bookkeeping tags → a canon EnemyDef. The promotion-shape
 * adapt the LAB runs before injecting a forged draft into the RUNTIME ENEMIES
 * (the DraftMapDef→MapDef pattern, applied to enemies). Pure; never mutates.
 */
export function stripForgeTags(d: DraftEnemyDef): EnemyDef {
  const { role: _role, chapter: _chapter, partsSpec: _partsSpec, ...canon } = d;
  void _role;
  void _chapter;
  void _partsSpec;
  return canon;
}
