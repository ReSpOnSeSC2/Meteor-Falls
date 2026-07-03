// Deterministic offline check: no tree/bush prop may sit on a walkable path tile.
// Runs against the fully-assembled MAPS (post grow + occupyCity), so it proves the
// shipped map, not the browser. Usage: npx tsx tools/check-trees-on-path.mts [mapId]
import { MAPS } from '../src/data/maps';

const PATH = new Set([':', 'R', 'D', 'X']);
const TREE = /^(tree|tree_b|tree_c|pine|bush)$/;
const targets = process.argv[2] ? [process.argv[2]] : Object.keys(MAPS);
let hits = 0;
for (const id of targets) {
  const m = MAPS[id];
  if (!m?.grid || !m.props) continue;
  for (const p of m.props) {
    if (!TREE.test(p.sprite)) continue;
    const gx = Math.round(p.x), gy = Math.round(p.y);
    const ch = m.grid[gy]?.[gx];
    if (PATH.has(ch)) { console.log(`ON-PATH  ${id.padEnd(14)} ${p.sprite.padEnd(7)} (${gx},${gy}) '${ch}'`); hits++; }
  }
}
console.log(hits ? `\n${hits} tree(s) on path.` : 'OK — no trees on path.');
process.exit(hits ? 1 : 0);
