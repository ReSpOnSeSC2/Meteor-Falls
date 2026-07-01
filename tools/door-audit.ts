/**
 * tools/door-audit.ts — THE DOOR / SCREEN-TRANSITION AUDIT (S15i playtest C).
 * Run: `npx vite-node tools/door-audit.ts`.
 *
 * Statically walks EVERY door (zone doors + prop `door`s) on every canon map
 * and reports the two ways a transition betrays the player:
 *   landsSolid     — the destination landing tile is solid or out of bounds
 *                    → the player spawns STUCK in a wall / off the grid.
 *   farFromReturn  — the landing is far (> ~24px) from the reciprocal
 *                    return-door on the destination → you arrive at the WRONG
 *                    edge / "come in from the wrong way".
 *   noReturn       — the destination has no door back here (one-way; reported
 *                    at lower severity, never fails the build).
 *
 * The math is the pure `doorAudit` in src/levelkit/mapcheck.ts (vitest-pinned).
 * This file mirrors tools/content-validate.ts: it imports MAPS + the SAME
 * CHAR_LEGEND / TILESET solidity the validator uses, builds the identical
 * `isSolid` predicate, calls doorAudit, prints a report GROUPED BY MAP, marks
 * WAIVED bespoke maps (the frozen pyramid rooms + dos_f3 — their static grids
 * lie: the rotor turns / the holding room carves at runtime), and EXITS
 * NON-ZERO if any REAL (non-waived) landsSolid or farFromReturn survives.
 */
import { CHAR_LEGEND, MAPS } from '../src/data/maps';
import { TILESET } from '../src/spritegen/tiles';
import { doorAudit, type DoorFinding } from '../src/levelkit/mapcheck';

// the engine's own tile solidity (TILESET.solid), keyed by legend name; ':'
// (path) and 'r' (rug) are walkable by construction (OverworldScene.buildTiles).
// This is byte-for-byte the predicate content-validate.ts and the levelkit
// tests build — the audit must judge doors by the SAME solidity the game runs.
const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
const isSolidChar = (ch: string): boolean =>
  ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

/**
 * WAIVED bespoke maps — the same frozen, STATEFUL §A6 dungeons content-validate
 * waives from the reachability gate (REACH_WAIVERS). Their STATIC grid is a lie:
 *   pyramid_1..4 — the §A6 floor ROTATES; a return-door that lands on a rotor
 *     wall (or far from the static return) opens once the floor turns.
 *   pyramid_ante / pyramid_apex — the gate room + the boss apex either side of
 *     the rotor maze; their static doors thread the bespoke step-pyramid.
 *   dos_f3 — the holding room is SEALED until carveHoldingRoom() opens it on
 *     holding_open; its inner doors don't exist in the static grid.
 * Findings here are SHOWN but never fail the build (the project lead owns them).
 */
const WAIVED = new Set<string>(['pyramid_1', 'pyramid_2', 'pyramid_3', 'pyramid_4', 'pyramid_ante', 'pyramid_apex', 'dos_f3']);

const SEV: Record<DoorFinding['issue'][number], string> = {
  landsSolid: 'STUCK',
  farFromReturn: 'WRONG-EDGE',
  noReturn: 'one-way',
  // ADR-135: label staged for the body-box tier. This audit still calls doorAudit
  // WITHOUT { bodyBox: true }, so no 'bodyBlocked' finding is produced yet — the
  // gate wiring (enable the tier + waive the 2 generated city-unit doorsteps) lands
  // separately. Present only so the Record stays exhaustive over the widened union.
  bodyBlocked: 'BODY-BLOCK',
};

function arrow(f: DoorFinding): string {
  const k = f.kind === 'prop' ? 'prop-door' : 'door';
  return `${k} ${f.from} → ${f.to}  @px(${f.tx},${f.ty}) tile(${f.lx},${f.ly}) char '${f.char || 'OOB'}'`;
}

const findings = doorAudit(MAPS, isSolidChar);

// group by source map for a readable, scannable report
const byMap = new Map<string, DoorFinding[]>();
for (const f of findings) {
  const arr = byMap.get(f.from) ?? [];
  arr.push(f);
  byMap.set(f.from, arr);
}

console.log('========================================================================');
console.log('  DOOR / SCREEN-TRANSITION AUDIT — every door on every canon map');
console.log(`  ${Object.keys(MAPS).length} maps swept · ${findings.length} door(s) with at least one issue`);
console.log('  (landsSolid = spawn stuck · farFromReturn = wrong edge · noReturn = one-way)');
console.log('========================================================================');

let realStuck = 0;
let realWrongEdge = 0;
let realNoReturn = 0;
let waivedFindings = 0;
let waivedStuck = 0;
let waivedWrongEdge = 0;

// stable, readable order: real maps first (alpha), then the waived bespoke set
const order = [...byMap.keys()].sort((a, b) => {
  const wa = WAIVED.has(a) ? 1 : 0;
  const wb = WAIVED.has(b) ? 1 : 0;
  return wa - wb || a.localeCompare(b);
});

for (const mapId of order) {
  const waived = WAIVED.has(mapId);
  const list = byMap.get(mapId)!;
  console.log('');
  console.log(`── ${mapId}${waived ? '   [WAIVED bespoke — frozen §A6 dungeon, shown only]' : ''} ──`);
  for (const f of list) {
    const tags = f.issue.map((i) => SEV[i]).join('+');
    console.log(`  [${tags}] ${arrow(f)}`);
    for (const d of f.detail) console.log(`        · ${d}`);
    if (waived) {
      waivedFindings += 1;
      if (f.issue.includes('landsSolid')) waivedStuck += 1;
      if (f.issue.includes('farFromReturn')) waivedWrongEdge += 1;
    } else {
      if (f.issue.includes('landsSolid')) realStuck += 1;
      if (f.issue.includes('farFromReturn')) realWrongEdge += 1;
      if (f.issue.includes('noReturn')) realNoReturn += 1;
    }
  }
}

console.log('');
console.log('========================================================================');
console.log('  SUMMARY');
console.log(`    REAL maps:   ${realStuck} stuck-landing · ${realWrongEdge} wrong-edge · ${realNoReturn} one-way`);
console.log(`    WAIVED maps: ${waivedFindings} finding(s) (${waivedStuck} stuck · ${waivedWrongEdge} wrong-edge) — frozen bespoke, not gated`);
console.log('========================================================================');

// the GATE: a REAL (non-waived) stuck-landing or wrong-edge door is a genuine
// playability break. one-way doors are reported but never fail (intentional
// one-way transitions exist — cutscene flights, the rocket pad, etc.).
const fatal = realStuck + realWrongEdge;
if (fatal > 0) {
  console.log(`✗ door-audit: ${fatal} REAL playability break(s) — ${realStuck} stuck + ${realWrongEdge} wrong-edge. Fix the map data (or waive with a reason).`);
  process.exit(1);
} else {
  console.log('✓ door-audit: no REAL stuck-landing or wrong-edge doors. (waived bespoke + one-way doors listed above.)');
}
