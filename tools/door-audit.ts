/**
 * tools/door-audit.ts — THE DOOR / SCREEN-TRANSITION AUDIT (S15i playtest C).
 * Run: `npx vite-node tools/door-audit.ts`.
 *
 * Statically walks EVERY door (zone doors + prop `door`s) on every canon map
 * and reports the two ways a transition betrays the player:
 *   landsSolid     — the destination landing tile is solid or out of bounds
 *                    → the player spawns STUCK in a wall / off the grid.
 *   farFromReturn  — the landing is far (> FAR_FROM_RETURN_PX = 40, ~2.5 tiles)
 *                    from the reciprocal return-door on the destination → you
 *                    arrive at the wrong edge / deep mid-room (ADR-138 snug-entry).
 *   noReturn       — the destination has no door back here (one-way; reported
 *                    at lower severity, never fails the build).
 *   bodyBlocked    — the landing TILE is walkable but the 40×36 player body box
 *                    clips a solid/OOB neighbour (the 2-tall door-mouth trap);
 *                    STRICT since ADR-136 — a non-waived hit fails the build.
 *
 * The math is the pure `doorAudit` in src/levelkit/mapcheck.ts (vitest-pinned).
 * This file mirrors tools/content-validate.ts: it imports MAPS + the SAME
 * CHAR_LEGEND / TILESET solidity the validator uses, builds the identical
 * `isSolid` predicate, calls doorAudit, prints a report GROUPED BY MAP, marks
 * WAIVED bespoke maps (the frozen pyramid rooms + dos_f3 — their static grids
 * lie: the rotor turns / the holding room carves at runtime), and EXITS
 * NON-ZERO if any REAL (non-waived) landsSolid, farFromReturn, or bodyBlocked survives.
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
// NB (divergence, deliberate + inert): this set NAMES pyramid_ante/pyramid_apex; content-
// validate's DOOR_WAIVERS OMITS them. INERT today — ante/apex currently produce NO door
// findings at all, so the omission changes nothing. Latent difference should that change:
// a future finding ORIGINATING at ante/apex is waived here (door-audit waives on the SOURCE
// map only — WAIVED.has(f.from), below), but content-validate (from-OR-to) would waive it
// only if it TARGETS a waived pyramid_1..4. Kept in sync by comment, not by membership
// (touching the hard-tier waiver set is riskier than the inert nit warrants).

/**
 * BODY_WAIVED (ADR-135/136) — the two GENERATED city-unit doorsteps whose body box
 * pokes the door-mouth wall. Their landing tile is walkable; only the 40×36 body
 * box clips a neighbour, which the runtime clampSpawnToWalkable nudges. Their
 * coords come from citylife.ts's shared stepTx/stepTy formula serving ~100 units,
 * so they're left to the clamp BY DESIGN (PR #84) — nudging the formula to fix
 * these 2 edge cases would perturb every other unit. Waived (keyed on f.from) for
 * the body-box tally only; their landsSolid/farFromReturn gating is unaffected.
 */
const BODY_WAIVED = new Set<string>(['minimus_major_unit_0', 'brickton_unit_8']);

const SEV: Record<DoorFinding['issue'][number], string> = {
  landsSolid: 'STUCK',
  farFromReturn: 'WRONG-EDGE',
  noReturn: 'one-way',
  // ADR-135/136: the body-box tier (opt-in below) — a walkable landing whose 40×36
  // player body box pokes a solid/OOB NEIGHBOUR, so the runtime clampSpawnToWalkable
  // must nudge the spawn. Now STRICT (ADR-136): a NON-waived hit is FATAL; the 4 known
  // hits are all waived (frozen pyramid rotors + the 2 generated city-unit doorsteps).
  bodyBlocked: 'BODY-BLOCK',
};

function arrow(f: DoorFinding): string {
  const k = f.kind === 'prop' ? 'prop-door' : 'door';
  return `${k} ${f.from} → ${f.to}  @px(${f.tx},${f.ty}) tile(${f.lx},${f.ly}) char '${f.char || 'OOB'}'`;
}

const findings = doorAudit(MAPS, isSolidChar, { bodyBox: true });

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
// ADR-135 body-box tier — tallied ORTHOGONALLY to the map-level waived/real split:
// the pyramid hits sit on WAIVED maps, but the 2 city-unit doorsteps sit on
// non-waived maps (so they print in the real section) yet must count as waived.
let realBodyBlocked = 0;
let waivedBodyBlocked = 0;

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
    const bodyWaived = WAIVED.has(f.from) || BODY_WAIVED.has(f.from);
    const tags = f.issue.map((i) => SEV[i]).join('+');
    const annot = f.issue.includes('bodyBlocked') && !WAIVED.has(mapId) && BODY_WAIVED.has(f.from)
      ? '   [body-box waived — generated city-unit doorstep, clamp-rescued]'
      : '';
    console.log(`  [${tags}] ${arrow(f)}${annot}`);
    for (const d of f.detail) console.log(`        · ${d}`);
    // body-box tier is tallied per-finding (orthogonal to the map-level waived flag)
    if (f.issue.includes('bodyBlocked')) {
      if (bodyWaived) waivedBodyBlocked += 1;
      else realBodyBlocked += 1;
    }
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
console.log(`    BODY-BOX:    ${realBodyBlocked} non-waived, ${waivedBodyBlocked} waived (frozen pyramid rotors + generated city-unit doorsteps) [ADR-136, clamp-rescued, STRICT — non-waived = fatal]`);
console.log('========================================================================');

// the GATE: a REAL (non-waived) stuck-landing or wrong-edge door is a genuine
// playability break. one-way doors are reported but never fail (intentional
// one-way transitions exist — cutscene flights, the rocket pad, etc.).
// The body-box tier is now STRICT (ADR-136, amending ADR-135's report-only): a
// NON-waived body-block is FATAL below. The runtime clampSpawnToWalkable would
// still nudge every body-blocked spawn (so it never soft-locks at play time), but
// we fail the BUILD to force the author to re-aim the door at the source rather
// than lean on the clamp. All 4 known hits are waived, so this stays green today.
const fatal = realStuck + realWrongEdge + realBodyBlocked; // ADR-136: body-box now STRICT (non-waived = fatal)
if (realBodyBlocked > 0) {
  console.log(`! door-audit body-box (ADR-136, STRICT): ${realBodyBlocked} NON-WAIVED body-blocked door(s) — a walkable landing whose player body box clips a wall (clampSpawnToWalkable would nudge it at runtime, but the gate now FAILS to force a fix). Re-aim tx,ty at the tile interior, or add a reasoned waiver.`);
}
if (fatal > 0) {
  console.log(`✗ door-audit: ${fatal} REAL playability break(s) — ${realStuck} stuck + ${realWrongEdge} wrong-edge + ${realBodyBlocked} body-blocked. Fix the map data (or waive with a reason).`);
  process.exit(1);
} else {
  console.log('✓ door-audit: no REAL stuck-landing, wrong-edge, or body-blocked doors. (waived bespoke + one-way + waived body-box listed above.)');
}
