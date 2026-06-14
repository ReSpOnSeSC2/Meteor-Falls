/**
 * S18 Movement 26 (ADR-067) — THE TRAFFIC SYSTEM safety + determinism proofs.
 *
 * The §B4 / M26 safety law, proven over many time-steps on a dense road graph:
 *   1. NO CRUSH — a vehicle never shares the player's cell.
 *   2. NO CORNER-TRAP — the player always keeps ≥1 free road neighbour (a lane).
 *   3. NO STACKING — at most one vehicle per cell.
 *   4. DETERMINISM — same seed → identical traffic, byte-for-byte (Prime Law 2).
 */
import { describe, it, expect } from 'vitest';
import { TrafficSim, cellKey, type TrafficVehicle } from './traffic';

/** a W×H grid of road cells (a full block of streets — dense, lots of corners) */
function roadGrid(w: number, h: number): Set<string> {
  const s = new Set<string>();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) s.add(cellKey(x, y));
  return s;
}

/** a sparse #-graph: only marked cells are road (tests narrow lanes) */
function roadFromAscii(rows: string[]): Set<string> {
  const s = new Set<string>();
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'R') s.add(cellKey(x, y)); }));
  return s;
}

function snapshot(vs: readonly TrafficVehicle[]): string {
  return vs.map((v) => `${v.id}:${v.type}@${v.x},${v.y}/${v.dir}/${v.paused ? 'P' : '-'}`).join('|');
}

describe('TrafficSim — the safety law (no crush, no corner-trap)', () => {
  it('a vehicle never enters the player cell and never takes the last lane', () => {
    const roads = roadGrid(10, 10);
    const sim = new TrafficSim({ roads, seed: 1234, max: 40, types: ['sedan', 'bus', 'truck'] });
    sim.spawn();
    // a player wandering deterministically across the block
    let pxq = 5;
    let pyq = 5;
    for (let step = 0; step < 200; step++) {
      sim.step({ x: pxq, y: pyq });
      // 1. no crush
      for (const v of sim.vehicles) {
        expect(v.x === pxq && v.y === pyq, `vehicle ${v.id} crushed the player at ${pxq},${pyq}`).toBe(false);
      }
      // 2. no corner-trap — the player keeps a lane
      expect(sim.playerLanes(pxq, pyq), `player cornered at step ${step}`).toBeGreaterThanOrEqual(1);
      // 3. no stacking
      const seen = new Set<string>();
      for (const v of sim.vehicles) {
        const k = cellKey(v.x, v.y);
        expect(seen.has(k), `two vehicles stacked at ${k}`).toBe(false);
        seen.add(k);
      }
      // move the player into a free lane (or hold)
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      const d = dirs[step % 4];
      const nx = pxq + d[0];
      const ny = pyq + d[1];
      if (roads.has(cellKey(nx, ny)) && !sim.vehicles.some((v) => v.x === nx && v.y === ny)) {
        pxq = nx; pyq = ny;
      }
    }
  });

  it('holds the law on a NARROW single-lane road (the worst case)', () => {
    // a 1-wide horizontal lane: a vehicle must yield rather than trap the player
    const roads = roadFromAscii(['RRRRRRRRRR']);
    const sim = new TrafficSim({ roads, seed: 77, max: 6, types: ['truck', 'bus'] });
    sim.spawn();
    const px = 4;
    const py = 0;
    for (let step = 0; step < 100; step++) {
      sim.step({ x: px, y: py });
      for (const v of sim.vehicles) expect(v.x === px && v.y === py).toBe(false);
      expect(sim.playerLanes(px, py)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('TrafficSim — determinism (Prime Law 2)', () => {
  it('same seed → identical spawn + identical 50-step run', () => {
    const make = (): TrafficSim => {
      const s = new TrafficSim({ roads: roadGrid(8, 8), seed: 9090, max: 20, types: ['sedan', 'van', 'ev'] });
      s.spawn();
      return s;
    };
    const a = make();
    const b = make();
    expect(snapshot(a.vehicles)).toBe(snapshot(b.vehicles));
    for (let i = 0; i < 50; i++) {
      a.step({ x: 3, y: 3 });
      b.step({ x: 3, y: 3 });
    }
    expect(snapshot(a.vehicles)).toBe(snapshot(b.vehicles));
  });

  it('respects the object-pool cap', () => {
    const sim = new TrafficSim({ roads: roadGrid(6, 6), seed: 5, max: 12, types: ['sedan'] });
    sim.spawn();
    expect(sim.vehicles.length).toBeLessThanOrEqual(12);
    expect(sim.vehicles.length).toBeGreaterThan(0);
  });
});
