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
import {
  TRAFFIC_DIR,
  TrafficSim,
  cellKey,
  directionalVehiclePose,
  isTrafficRoadChar,
  legacyVehiclePose,
  normalizedVehicleVector,
  projectedVehicleBounds,
  trafficDirFromVector,
  trafficDirectionVector,
  type TrafficVehicle,
} from './traffic';

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

/** A five-cell-wide southeast boulevard. Every diagonal edge has both road
 * bridge cells, matching Puerto Sol / Valle Dorado's authored slanted bands. */
function diagonalRoad(length: number): Set<string> {
  const roads = new Set<string>();
  for (let y = 0; y < length; y++) {
    for (let x = 0; x < length; x++) {
      if (Math.abs(x - y) <= 2) roads.add(cellKey(x, y));
    }
  }
  return roads;
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

  it('yields around full owned-vehicle footprint cells', () => {
    const roads = roadGrid(9, 5);
    const sim = new TrafficSim({ roads, seed: 818, max: 12, types: ['sedan'] });
    sim.spawn();
    const blocked = new Set([cellKey(4, 1), cellKey(4, 2), cellKey(4, 3), cellKey(5, 2)]);
    for (let step = 0; step < 80; step++) {
      sim.step({ x: 1, y: 2 }, blocked);
      for (const vehicle of sim.vehicles) {
        expect(blocked.has(cellKey(vehicle.x, vehicle.y))).toBe(false);
      }
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

describe('TrafficSim — true diagonal roads', () => {
  it('drives a stable 1:1 diagonal instead of tracing a square loop', () => {
    const sim = new TrafficSim({ roads: diagonalRoad(30), seed: 404, max: 0, types: ['sedan'] });
    const car: TrafficVehicle = {
      id: 1,
      type: 'sedan',
      x: 3,
      y: 3,
      dir: TRAFFIC_DIR.SE,
      px: 3,
      py: 3,
      paused: false,
    };
    sim.vehicles = [car];

    const visited = new Set<string>();
    for (let step = 0; step < 16; step++) {
      const before = { x: car.x, y: car.y };
      sim.step({ x: 100, y: 100 });
      expect(car.dir).toBe(TRAFFIC_DIR.SE);
      expect(car.x).toBe(before.x + 1);
      expect(car.y).toBe(before.y + 1);
      expect(visited.has(cellKey(car.x, car.y))).toBe(false);
      visited.add(cellKey(car.x, car.y));
    }
  });

  it('does not cut a diagonal corner unless both bridge cells are road and clear', () => {
    const isolated = new Set([cellKey(1, 1), cellKey(2, 2)]);
    const noBridges = new TrafficSim({ roads: isolated, seed: 1, max: 0, types: ['sedan'] });
    noBridges.vehicles = [{ id: 1, type: 'sedan', x: 1, y: 1, dir: TRAFFIC_DIR.SE, px: 1, py: 1, paused: false }];
    noBridges.step({ x: 99, y: 99 });
    expect(noBridges.vehicles[0]).toMatchObject({ x: 1, y: 1, paused: true });

    const roads = diagonalRoad(12);
    const blockedBridge = new TrafficSim({ roads, seed: 2, max: 0, types: ['sedan'] });
    blockedBridge.vehicles = [{ id: 1, type: 'sedan', x: 4, y: 4, dir: TRAFFIC_DIR.SE, px: 4, py: 4, paused: false }];
    blockedBridge.step({ x: 99, y: 99 }, new Set([cellKey(5, 4)]));
    expect(blockedBridge.vehicles[0].x === 5 && blockedBridge.vehicles[0].y === 5).toBe(false);

    const playerOnBridge = new TrafficSim({ roads, seed: 3, max: 0, types: ['sedan'] });
    playerOnBridge.vehicles = [{ id: 1, type: 'sedan', x: 4, y: 4, dir: TRAFFIC_DIR.SE, px: 4, py: 4, paused: false }];
    playerOnBridge.step({ x: 4, y: 5 });
    expect(playerOnBridge.vehicles[0].x === 5 && playerOnBridge.vehicles[0].y === 5).toBe(false);
  });

  it('takes an ordinary corner instead of hooking backward into a local orbit', () => {
    const roads = new Set<string>();
    // A long NE branch shares its first bridge with a short east turn. From a
    // south heading, NE is a 135-degree hook; east is the sane 90-degree exit.
    for (let i = 0; i < 9; i++) {
      roads.add(cellKey(i, -i));
      roads.add(cellKey(i + 1, -i));
      roads.add(cellKey(i, -i - 1));
    }
    roads.add(cellKey(2, 0));
    const sim = new TrafficSim({ roads, seed: 14, max: 0, types: ['sedan'] });
    sim.vehicles = [{ id: 1, type: 'sedan', x: 0, y: 0, dir: TRAFFIC_DIR.S, px: 0, py: 0, paused: false }];

    sim.step({ x: 99, y: 99 });
    expect(sim.vehicles[0]).toMatchObject({ x: 1, y: 0, dir: TRAFFIC_DIR.E, paused: false });
  });

  it('keeps the full road alphabet connected, including horizontal dash cells', () => {
    expect(['R', 'D', '_', 'X'].every((ch) => isTrafficRoadChar(ch))).toBe(true);
    expect(['=', 'P', ':', undefined].some((ch) => isTrafficRoadChar(ch))).toBe(false);
  });

  it('provides coherent eight-way art poses and projected collision bounds', () => {
    const unitDiagonal = normalizedVehicleVector({ x: 1, y: 1 });
    expect(unitDiagonal.x).toBeCloseTo(Math.SQRT1_2);
    expect(unitDiagonal.y).toBeCloseTo(Math.SQRT1_2);
    expect(normalizedVehicleVector({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect([
      [1, 0], [1, 1], [0, 1], [-1, 1],
      [-1, 0], [-1, -1], [0, -1], [1, -1],
    ].map(([x, y]) => trafficDirFromVector(x, y))).toEqual([
      TRAFFIC_DIR.E, TRAFFIC_DIR.SE, TRAFFIC_DIR.S, TRAFFIC_DIR.SW,
      TRAFFIC_DIR.W, TRAFFIC_DIR.NW, TRAFFIC_DIR.N, TRAFFIC_DIR.NE,
    ]);
    expect(trafficDirectionVector(TRAFFIC_DIR.SE)).toEqual({ x: 1, y: 1 });
    expect(trafficDirectionVector(TRAFFIC_DIR.NW)).toEqual({ x: -1, y: -1 });
    expect(directionalVehiclePose(TRAFFIC_DIR.SE)).toEqual({ frame: 1, flipX: true, angle: 0 });
    expect(directionalVehiclePose(TRAFFIC_DIR.SW)).toEqual({ frame: 1, flipX: false, angle: 0 });
    expect(directionalVehiclePose(TRAFFIC_DIR.NE)).toEqual({ frame: 2, flipX: true, angle: 0 });
    expect(legacyVehiclePose(TRAFFIC_DIR.SE)).toEqual({ frame: 0, flipX: true, angle: 45 });

    const diagonal = projectedVehicleBounds(40, 20, trafficDirectionVector(TRAFFIC_DIR.SE));
    expect(diagonal.w).toBeCloseTo(30 * Math.SQRT2);
    expect(diagonal.h).toBeCloseTo(30 * Math.SQRT2);
    expect(projectedVehicleBounds(40, 20, trafficDirectionVector(TRAFFIC_DIR.E))).toEqual({ w: 40, h: 20 });
    expect(projectedVehicleBounds(40, 20, trafficDirectionVector(TRAFFIC_DIR.S))).toEqual({ w: 20, h: 40 });
  });
});
