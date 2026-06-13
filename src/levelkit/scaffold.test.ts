/**
 * THE CHAPTER SCAFFOLD — the plan proofs (S15g Movement Four, ADR-047).
 *
 *  - every chapter manifest schema-parses (the source of truth is valid);
 *  - the plan is DETERMINISTIC (same manifest → byte-identical files; Prime Law 2);
 *  - every chapter emits a COMPLETE tree (dungeon, settlements, roster, boss,
 *    barrel, checklist);
 *  - the scaffolded drafts are REAL (Prime Law verified, not stubs): an unlanded
 *    chapter's dungeon recipe builds a valid draft, its settlement recipes parse,
 *    the boss draft(s) it re-exports exist in the forge, and its roster is forged.
 */
import { describe, it, expect } from 'vitest';
import { CHAPTER_MANIFESTS } from '../data/chapters';
import { scaffoldChapter } from './scaffold';
import { ChapterManifestSchema, DungeonRecipeSchema, RecipeSchema, DraftMapDefSchema } from '../schemas';
import { buildDungeon } from './dungeons';
import { DRAFT_BOSS_SCRIPTS } from '../data/drafts/bosses';
import { FORGED_ROSTERS } from './forge/registry';

const all = Object.values(CHAPTER_MANIFESTS);
const unlanded = all.filter((m) => m.status === 'unlanded');

describe('S15g M4 — the chapter manifests + the scaffold plan (ADR-047)', () => {
  it('every manifest schema-parses (the per-chapter source of truth is valid)', () => {
    for (const m of all) {
      expect(ChapterManifestSchema.safeParse(m).success, `Ch.${m.chapter}`).toBe(true);
    }
  });

  it('is deterministic — same manifest → byte-identical files (Prime Law 2)', () => {
    for (const m of all) {
      expect(JSON.stringify(scaffoldChapter(m).files)).toBe(JSON.stringify(scaffoldChapter(m).files));
    }
  });

  it('emits a COMPLETE tree per chapter (dungeon, settlements, roster, boss, barrel, checklist)', () => {
    for (const m of all) {
      const plan = scaffoldChapter(m);
      const base = `src/data/drafts/ch${m.chapter}`;
      expect(plan.files.map((f) => f.path)).toEqual([
        `${base}/dungeon.ts`,
        `${base}/settlements.ts`,
        `${base}/roster.ts`,
        `${base}/boss.ts`,
        `${base}/index.ts`,
        `docs/chapters/ch${m.chapter}/checklist.md`,
      ]);
      for (const f of plan.files) expect(f.content.length, f.path).toBeGreaterThan(0);
    }
  });
});

describe('S15g M4 — the scaffolded drafts are REAL (buildable + forge-backed)', () => {
  for (const m of unlanded) {
    it(`Ch.${m.chapter}: the dungeon recipe parses and its grammar builds a valid draft`, () => {
      const plan = scaffoldChapter(m);
      expect(plan.dungeonRecipe, `Ch.${m.chapter} names no site`).not.toBeNull();
      expect(DungeonRecipeSchema.safeParse(plan.dungeonRecipe).success, JSON.stringify(plan.dungeonRecipe)).toBe(true);
      const draft = buildDungeon(plan.dungeonRecipe!);
      expect(DraftMapDefSchema.safeParse(draft).success, `Ch.${m.chapter} dungeon draft`).toBe(true);
    });

    it(`Ch.${m.chapter}: every settlement recipe parses (one per §A5 settlement)`, () => {
      const plan = scaffoldChapter(m);
      expect(plan.settlementRecipes.length).toBe(m.settlements.length);
      for (const rec of plan.settlementRecipes) {
        expect(RecipeSchema.safeParse(rec).success, JSON.stringify(rec)).toBe(true);
      }
    });

    it(`Ch.${m.chapter}: the boss draft(s) it re-exports exist in the forge (DRAFT_BOSS_SCRIPTS)`, () => {
      const plan = scaffoldChapter(m);
      const expected = [
        ...(m.boss.template !== 'bespoke' ? [m.boss.id] : []),
        ...(m.minibosses ?? []).filter((b) => b.template !== 'bespoke').map((b) => b.id),
      ];
      expect(plan.bossDraftIds).toEqual(expected);
      for (const id of plan.bossDraftIds) expect(DRAFT_BOSS_SCRIPTS[id], id).toBeTruthy();
    });

    it(`Ch.${m.chapter}: the forged roster is non-empty (the boring 60% is real)`, () => {
      expect(FORGED_ROSTERS[m.chapter].length).toBeGreaterThan(0);
    });
  }
});
