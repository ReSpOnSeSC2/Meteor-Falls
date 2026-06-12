/**
 * Chapter 2 map BEHAVIOR (S14): the §A6 pyramid rotation as a deterministic
 * permutation, the documented solve (the bot line: 1 → 1 → 2 → 2 presses),
 * Puerto Sol's frozen 1898 stream, and the recovery gating pairs. Existence
 * and cross-reference truth stays in tools/content-validate.ts (S5 law).
 */
import { describe, expect, it } from 'vitest';
import {
  buildPuertoSol,
  buildPyramidRooms,
  rotateRect,
  PYR_ROTOR,
  PYR_INITIAL_ROT,
} from './maps_ch2';
import { MAPS } from './maps';

/** BFS over a rotated room grid: can you walk from A to B? Solids are the
 *  wall/undergrowth chars; everything else (floor, glyph, rotor floor) walks. */
function reachable(grid: string[], from: [number, number], to: [number, number]): boolean {
  const solid = new Set(['Z', 'J', '-', '|', 'W', 'O', 'B', 'C', 'b', 'e', 'E']);
  const w = grid[0].length;
  const h = grid.length;
  const seen = new Set<string>([`${from[0]},${from[1]}`]);
  const queue: Array<[number, number]> = [from];
  while (queue.length > 0) {
    const [x, y] = queue.shift() as [number, number];
    if (x === to[0] && y === to[1]) return true;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(key)) continue;
      if (solid.has(grid[ny][nx])) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return false;
}

/** a room's grid at `presses` mask presses (what the scene builds, ADR-014) */
function roomAt(roomId: string, presses: number): string[] {
  const room = buildPyramidRooms().find((m) => m.id === roomId);
  if (!room) throw new Error(roomId);
  const turns = (PYR_INITIAL_ROT[roomId] + presses) % 4;
  return rotateRect(room.grid, PYR_ROTOR.x, PYR_ROTOR.y, PYR_ROTOR.size, turns);
}

describe('rotateRect — the §A6 rotation is a deterministic permutation', () => {
  const block = ['ZZZgZZZ', 'ZZZgZZZ', 'ZZZgZZZ', 'ggggggg', 'ZZZZZZZ', 'ZZZZZZZ', 'ZZZZZZZ'];
  const pad = (rows: string[]): string[] => rows.map((r) => `Y${r}Y`);
  const grid = ['Y'.repeat(9), ...pad(block), 'Y'.repeat(9)];

  it('zero turns is the identity; four turns comes back around', () => {
    expect(rotateRect(grid, 1, 1, 7, 0)).toEqual(grid);
    expect(rotateRect(grid, 1, 1, 7, 4)).toEqual(grid);
  });

  it('one clockwise turn moves the T arms N,E,W → E,S,N', () => {
    const turned = rotateRect(grid, 1, 1, 7, 1);
    // the old N arm (col 4) now runs E along row 4: row "gggg" right half
    expect(turned[4].slice(4, 8)).toBe('gggg');
    // the old E-W bar now runs N-S down col 4
    expect(turned[1][4]).toBe('g');
    expect(turned[7][4]).toBe('g');
    // the WEST edge of the rotor is sealed at its mid row (no W arm anymore)
    expect(turned[4][1]).toBe('Z');
  });

  it('never mutates the input', () => {
    const before = grid.join('|');
    rotateRect(grid, 1, 1, 7, 3);
    expect(grid.join('|')).toBe(before);
  });
});

describe('the pyramid solve — the documented bot line is the real solution', () => {
  // entry/exit cells per room (just inside each doorway)
  const ENTRY: Record<string, [number, number]> = {
    pyramid_1: [7, 12],
    pyramid_2: [7, 12],
    pyramid_3: [7, 12],
    pyramid_4: [1, 6],
  };
  const EXIT: Record<string, [number, number]> = {
    pyramid_1: [7, 1],
    pyramid_2: [7, 1],
    pyramid_3: [14, 6], // the east door gap itself (the carve feeds it)
    pyramid_4: [7, 1],
  };
  // the scene-header bot line: presses per room, in chain order
  const PRESSES: Record<string, number> = { pyramid_1: 1, pyramid_2: 1, pyramid_3: 2, pyramid_4: 2 };

  for (const room of ['pyramid_1', 'pyramid_2', 'pyramid_3', 'pyramid_4']) {
    it(`${room}: blocked as found, OPEN after ${PRESSES[room]} press(es)`, () => {
      expect(reachable(roomAt(room, 0), ENTRY[room], EXIT[room])).toBe(false);
      expect(reachable(roomAt(room, PRESSES[room]), ENTRY[room], EXIT[room])).toBe(true);
    });

    it(`${room}: the mask is ALWAYS reachable from the entry (no soft-lock)`, () => {
      const def = buildPyramidRooms().find((m) => m.id === room);
      const mask = def?.props.find((p) => p.sprite === 'mask_switch');
      if (!mask) throw new Error('no mask');
      // stand one tile south of the pedestal (where the sign beat fires)
      const at: [number, number] = [Math.round(mask.x), Math.round(mask.y) + 1];
      for (let presses = 0; presses < 4; presses++) {
        expect(reachable(roomAt(room, presses), ENTRY[room], at)).toBe(true);
      }
    });
  }
});

describe('PUERTO SOL — the 1898 stream is frozen (the 1995 rule, 4th application)', () => {
  it('two builds are byte-identical: grid, props, npc positions', () => {
    const a = buildPuertoSol();
    const b = buildPuertoSol();
    expect(a.grid.join('|')).toBe(b.grid.join('|'));
    expect(JSON.stringify(a.props)).toBe(JSON.stringify(b.props));
    expect(JSON.stringify(a.npcs)).toBe(JSON.stringify(b.npcs));
  });

  it('the live MAPS entry matches a fresh build (no later stream disturbed it)', () => {
    expect(MAPS.puerto_sol.grid.join('|')).toBe(buildPuertoSol().grid.join('|'));
  });
});

describe('the §A6 recovery pairs + the boat round trip (zero missables)', () => {
  it('every wisher has a woke twin standing in the same spot', () => {
    const valle = MAPS.valle_dorado;
    for (const w of ['a', 'b', 'c']) {
      const gray = valle.npcs.find((n) => n.id === `wisher_${w}`);
      const woke = valle.npcs.find((n) => n.id === `woke_${w}`);
      expect(gray?.x).toBe(woke?.x);
      expect(gray?.y).toBe(woke?.y);
    }
  });

  it('the six llamas each pair a loose spot with a pen spot', () => {
    const valle = MAPS.valle_dorado;
    for (let i = 1; i <= 6; i++) {
      const loose = valle.npcs.find((n) => n.id === `llama_${i}`);
      const penned = valle.npcs.find((n) => n.id === `llama_pen_${i}`);
      expect(loose?.unlessFlag).toBe(`q_llama_${i}`);
      expect(penned?.ifFlag).toBe(`q_llama_${i}`);
    }
  });

  it('the costa wire round-trips: cliff road up, pier road down', () => {
    expect(MAPS.costa_estrella.doors.some((d) => d.to === 'puerto_sol')).toBe(true);
    expect(MAPS.puerto_sol.doors.some((d) => d.to === 'costa_estrella')).toBe(true);
  });
});
