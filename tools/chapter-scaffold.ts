/**
 * THE CHAPTER SCAFFOLD (S15g Movement Four, ADR-047) — the tool that opens a
 * chapter session at 60% done.
 *
 *   npm run scaffold -- ch6
 *
 * Reads the chapter's manifest (src/data/chapters.ts) and writes a COMPLETE
 * DRAFT TREE under src/data/drafts/chN/** — the dungeon-grammar recipe, the
 * forged roster re-export, the forged boss draft(s), the settlement recipes, a
 * barrel — plus a docs/chapters/chN/checklist.md promotion guide. The PLAN is
 * pure (src/levelkit/scaffold.ts, vitest-pinned); this file owns only the fs
 * writes (the content-validate / forge-faces precedent — tool = IO, lib = logic).
 *
 * DRAFTS ARE NOT CONTENT (Prime Law 1): the tree is dev-only, excluded from MAPS
 * / the canon manifests / the §B4 sweep. Promotion is a human act.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { chapterManifest } from '../src/data/chapters';
import { scaffoldChapter } from '../src/levelkit/scaffold';

const arg = process.argv.slice(2).find((a) => /\d/.test(a)) ?? '';
const n = Number((arg.match(/\d+/) ?? [])[0]);

if (!Number.isInteger(n) || n < 1 || n > 10) {
  console.error('usage: npm run scaffold -- ch<N>   (N = 1..10, e.g. ch6)');
  process.exit(1);
}

const m = chapterManifest(n);
if (!m) {
  console.error(`no chapter manifest for Ch.${n} (src/data/chapters.ts)`);
  process.exit(1);
}

if (m.status === 'shipped') {
  console.log(`⚠ Ch.${n} (${m.title}) is already SHIPPED — its content is live in MAPS/ENEMIES/`);
  console.log(`  QUESTS. Scaffolding emits drafts beside shipped canon; you usually scaffold an`);
  console.log(`  UNLANDED chapter. Writing the tree anyway (drafts can never overwrite canon).\n`);
}

const plan = scaffoldChapter(m);
for (const f of plan.files) {
  mkdirSync(dirname(f.path), { recursive: true });
  writeFileSync(f.path, f.content);
}

console.log(`✓ scaffolded Ch.${n} — the boring 60% is generated; spend the rest on the SOUL.\n`);
for (const line of plan.summary) console.log(line);
console.log(`\n  wrote ${plan.files.length} files:`);
for (const f of plan.files) console.log(`    ${f.path}`);
console.log(`\nnext: open docs/chapters/ch${n}/checklist.md and start promoting.`);
