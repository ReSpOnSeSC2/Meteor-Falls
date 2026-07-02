/**
 * tools/door-landing-survey.ts — LANDING SNUGNESS SURVEY (one-shot analysis).
 * Run: `npx vite-node tools/door-landing-survey.ts`.
 *
 * The door-audit's farFromReturn tier (FAR_FROM_RETURN_PX = 64) only flags a
 * landing dropped ~4+ tiles from the reciprocal return-door — a wrong-EDGE
 * detector. This survey measures the same landing→return-cell distance for
 * EVERY door and prints the full distribution, so we can see the "lands a few
 * tiles into the room" band the gate tolerates, and emit a PROPOSED re-aim
 * (tx,ty = the return-door's interior cell, feet at tile center) per door.
 *
 * Read-only: prints; changes nothing.
 */
import { CHAR_LEGEND, MAPS } from '../src/data/maps';
import { TILESET } from '../src/spritegen/tiles';
import { doorCell } from '../src/levelkit/mapcheck';

const TILE = 16;
const solidByName = new Map(TILESET.map((t) => [t.name, t.solid]));
const isSolidChar = (ch: string): boolean =>
  ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

const WAIVED = new Set<string>(['pyramid_1', 'pyramid_2', 'pyramid_3', 'pyramid_4', 'pyramid_ante', 'pyramid_apex', 'dos_f3']);
const isVertical = (ind?: string): boolean => ind === 'stairs' || ind === 'elevator';

interface Row {
  from: string;
  to: string;
  kind: 'door' | 'prop';
  tx: number;
  ty: number;
  dist: number;
  // the matched return zone + its interior cell
  cell: readonly [number, number] | null;
  proposed: { tx: number; ty: number } | null;
  proposedInZone: boolean;
  proposedBlocked: string; // '' if the proposal's body box is clean
  interiorTo: boolean;
  dims: string;
}

const rows: Row[] = [];

for (const [id, m] of Object.entries(MAPS)) {
  if (WAIVED.has(id)) continue;
  const all: Array<{ to: string; tx: number; ty: number; kind: 'door' | 'prop'; indicator?: string }> = [
    ...m.doors.map((d) => ({ to: d.to, tx: d.tx, ty: d.ty, kind: 'door' as const, indicator: d.indicator })),
    ...m.props.filter((p) => p.door).map((p) => ({ to: p.door!.to, tx: p.door!.tx, ty: p.door!.ty, kind: 'prop' as const })),
  ];
  for (const d of all) {
    const target = MAPS[d.to];
    if (!target || WAIVED.has(d.to)) continue;
    if (isVertical(d.indicator)) continue; // stairs/elevator: off-stairhead landing is by design
    const returns = target.doors.filter((rd) => rd.to === id);
    if (returns.length === 0) continue; // one-way: no anchor to measure against
    let best: { dist: number; cell: readonly [number, number] | null; rd: (typeof returns)[number] } | null = null;
    for (const rd of returns) {
      const cell = doorCell(target.grid, isSolidChar, rd);
      const ax = cell ? (cell[0] + 0.5) * TILE : (rd.x + rd.w / 2) * TILE;
      const ay = cell ? (cell[1] + 0.5) * TILE : (rd.y + rd.h / 2) * TILE;
      const dist = Math.hypot(d.tx - ax, d.ty - ay);
      if (!best || dist < best.dist) best = { dist, cell, rd };
    }
    if (!best) continue;
    if (isVertical(best.rd.indicator)) continue; // matched a stairwell — by-design offset
    // PROPOSAL: land feet at the interior cell's center (cx*16+8, cy*16+12) —
    // the tile you'd stand on to walk back out; body box fits inside one tile.
    let proposed: { tx: number; ty: number } | null = null;
    let proposedInZone = false;
    let proposedBlocked = '';
    if (best.cell) {
      let [cx, cy] = best.cell;
      const rd = best.rd;
      const inZone = (x: number, y: number): boolean => x >= rd.x && x < rd.x + rd.w && y >= rd.y && y < rd.y + rd.h;
      proposedInZone = inZone(cx, cy);
      proposed = { tx: cx * TILE + 8, ty: cy * TILE + 12 };
      // body box at the proposal (mirror playerBodyBoxTiles)
      const x0 = Math.floor((proposed.tx - 5) / TILE), x1 = Math.floor((proposed.tx + 5) / TILE);
      const y0 = Math.floor((proposed.ty - 9) / TILE), y1 = Math.floor(proposed.ty / TILE);
      const blockers: string[] = [];
      for (let by = y0; by <= y1; by++) {
        for (let bx = x0; bx <= x1; bx++) {
          if (by < 0 || bx < 0 || by >= target.grid.length || bx >= target.grid[0].length) blockers.push(`(${bx},${by})=OOB`);
          else if (isSolidChar(target.grid[by][bx])) blockers.push(`(${bx},${by})='${target.grid[by][bx]}'`);
        }
      }
      proposedBlocked = blockers.join(' ');
    }
    rows.push({
      from: id, to: d.to, kind: d.kind, tx: d.tx, ty: d.ty, dist: best.dist,
      cell: best.cell, proposed, proposedInZone, proposedBlocked,
      interiorTo: !!target.interior,
      dims: `${target.grid[0].length}x${target.grid.length}`,
    });
  }
}

// ---- histogram over ALL measured doors ----
const buckets = [8, 16, 24, 32, 40, 48, 56, 64, 96, 160, 1e9];
const counts = new Array(buckets.length).fill(0);
for (const r of rows) {
  for (let i = 0; i < buckets.length; i++) if (r.dist <= buckets[i]) { counts[i]++; break; }
}
console.log(`\n${rows.length} measurable doors (non-vertical, reciprocal, non-waived)`);
console.log('distance-to-return-cell histogram:');
let lo = 0;
for (let i = 0; i < buckets.length; i++) {
  if (counts[i] > 0) console.log(`  ${String(lo).padStart(4)}..${buckets[i] >= 1e9 ? '∞' : String(buckets[i]).padStart(4)} px : ${'#'.repeat(Math.min(counts[i], 80))} ${counts[i]}`);
  lo = buckets[i];
}

// ---- the fix list: everything landing farther than ~1.75 tiles from the cell ----
const THRESH = 28;
const bad = rows.filter((r) => r.dist > THRESH).sort((a, b) => b.dist - a.dist);
console.log(`\n${bad.length} door(s) land > ${THRESH}px (~1.75 tiles) from the return-door cell:\n`);
for (const r of bad) {
  const prop = r.proposed
    ? `→ propose tx:${r.proposed.tx} ty:${r.proposed.ty}${r.proposedInZone ? ' [IN-ZONE!]' : ''}${r.proposedBlocked ? ` [BLOCKED ${r.proposedBlocked}]` : ''}`
    : '→ (no walkable cell found)';
  console.log(
    `  ${r.dist.toFixed(0).padStart(4)}px ${r.kind === 'prop' ? 'P' : 'D'} ${(r.from + ' → ' + r.to).padEnd(46)} @(${r.tx},${r.ty}) ${r.interiorTo ? 'INT' : 'ext'} ${r.dims.padEnd(8)} ${prop}`,
  );
}
