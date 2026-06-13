/**
 * `npm run bench:map -- <draftId>` — the levelkit's perf hook (S15g, ADR-044).
 *
 * S14d's pumped p99 ≤ 8.3ms benchmark is the kit's perf LAW, but that gate is
 * a browser-pumped XL walk (the QA pre-flight, window.pump). This is its node-
 * side PRE-FILTER: it proves the generator is fast + deterministic and that a
 * draft's render load sits inside the XL envelope (Brickton-grown holds the
 * gate at ~72×42 / ~150 props) BEFORE a session spends polish on it. A draft
 * that clears here still owes the authoritative browser p99 walk at promotion.
 */
import { SAMPLE_RECIPES, SAMPLE_IDS } from '../src/levelkit/samples';
import { generate } from '../src/levelkit';
import type { Recipe } from '../src/schemas';

// the XL envelope: the budget Brickton-grown walks at p99 ≤ 8.3ms (S14d)
const MAX_TILES = 4000;
const MAX_PROPS = 260;
const REBUILDS = 200;

const id = process.argv[2];
if (!id || !(id in SAMPLE_RECIPES)) {
  console.error(`usage: npm run bench:map -- <draftId>\n  known drafts: ${SAMPLE_IDS.join(', ')}`);
  process.exit(id ? 1 : 0);
}

const recipe = SAMPLE_RECIPES[id] as Recipe;

// build time + determinism over many rebuilds (recipe + seed → identical bytes)
const first = JSON.stringify(generate(recipe));
let deterministic = true;
const t0 = performance.now();
for (let i = 0; i < REBUILDS; i++) {
  if (JSON.stringify(generate(recipe)) !== first) deterministic = false;
}
const perBuild = (performance.now() - t0) / REBUILDS;

const draft = generate(recipe);
const tiles = draft.grid[0].length * draft.grid.length;
const props = draft.props.length;
const reasons: string[] = [];
if (tiles > MAX_TILES) reasons.push(`${tiles} tiles > ${MAX_TILES}`);
if (props > MAX_PROPS) reasons.push(`${props} props > ${MAX_PROPS}`);

console.log(`\nLEVELKIT bench — ${id}`);
console.log(`  recipe   ${recipe.kind}  seed ${recipe.seed}`);
console.log(`  build    ${perBuild.toFixed(3)}ms/build over ${REBUILDS}   deterministic=${deterministic}`);
console.log(`  load     grid ${draft.grid[0].length}x${draft.grid.length} = ${tiles} tiles | props ${props} | npcs ${draft.npcs.length} | spawners ${draft.spawners.length}`);
console.log(`  envelope tiles <= ${MAX_TILES}, props <= ${MAX_PROPS}  (S14d p99<=8.3ms law)`);
console.log(`  verdict  ${reasons.length === 0 ? 'WITHIN ENVELOPE' : `HEAVY: ${reasons.join('; ')} — re-scope before promotion`}`);
console.log(`  note     the authoritative p99<=8.3ms gate is the browser-pumped XL walk (QA pre-flight).\n`);

if (!deterministic) {
  console.error('  ✗ NON-DETERMINISTIC — a generator under src/levelkit rolled instead of re-deriving');
  process.exit(1);
}
process.exit(0);
