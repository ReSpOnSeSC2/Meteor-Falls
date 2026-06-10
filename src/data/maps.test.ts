/**
 * Map data integrity — every reference a MapDef makes must resolve.
 * (Prompt S5 turns these checks into the full zod content validator.)
 */
import { describe, expect, it } from 'vitest';
import {
  CHAR_LEGEND,
  MAPS,
  HOLDING_ROOM,
  HOLDING_DOOR_GAP,
  carveHoldingRoom,
  type MapDef,
} from './maps';
import { DIALOGUE } from './dialogue';
import { ENEMIES } from './enemies';
import { TILESET, tileIndexByName } from '../spritegen/tiles';

const maps = Object.values(MAPS);

describe('map grids', () => {
  it('rows are uniform width and every char is in the legend', () => {
    for (const m of maps) {
      const w = m.grid[0].length;
      for (const row of m.grid) {
        expect(row.length, `${m.id} row width`).toBe(w);
        for (const ch of row) {
          if (ch === ':') continue; // path tiles are auto-edged variants
          expect(CHAR_LEGEND[ch], `${m.id} unknown grid char "${ch}"`).toBeDefined();
        }
      }
    }
  });

  it('every legend entry resolves to a real tile', () => {
    for (const name of Object.values(CHAR_LEGEND)) {
      expect(() => tileIndexByName(name)).not.toThrow();
    }
    expect(TILESET.length).toBeGreaterThan(0);
  });
});

describe('map references', () => {
  it('door zones and prop doors lead to maps that exist', () => {
    for (const m of maps) {
      for (const d of m.doors) {
        expect(MAPS[d.to], `${m.id} door -> ${d.to}`).toBeDefined();
      }
      for (const p of m.props) {
        if (p.door) expect(MAPS[p.door.to], `${m.id} prop door -> ${p.door.to}`).toBeDefined();
      }
    }
  });

  it('npc and sign dialogue ids exist', () => {
    for (const m of maps) {
      for (const n of m.npcs) {
        expect(DIALOGUE[n.dialogue], `${m.id} npc ${n.id} -> ${n.dialogue}`).toBeDefined();
      }
      for (const s of m.signs) {
        expect(DIALOGUE[s.dialogue], `${m.id} sign -> ${s.dialogue}`).toBeDefined();
      }
    }
  });

  it('spawner and patrol enemies exist; patrols can walk', () => {
    for (const m of maps) {
      for (const sp of m.spawners) {
        for (const id of sp.enemies) expect(ENEMIES[id], `${m.id} spawner -> ${id}`).toBeDefined();
      }
      for (const p of m.patrols ?? []) {
        const def = ENEMIES[p.enemy];
        expect(def, `${m.id} patrol -> ${p.enemy}`).toBeDefined();
        expect(p.route.length, `${m.id} patrol ${p.id} route`).toBeGreaterThan(0);
        expect(def.walker ?? def.mini, `${m.id} patrol ${p.id} sprite`).toBeDefined();
      }
    }
  });
});

describe('S1 canon (GAME_BIBLE §A6/§A7/§A4.5, prompt S1)', () => {
  it('Brickton has 4+ NPCs, payphone, and Smilers + Pigeon Gang on the streets', () => {
    const b = MAPS.brickton;
    expect(b.npcs.length).toBeGreaterThanOrEqual(4);
    expect(b.phones.length).toBeGreaterThanOrEqual(1);
    const roster = new Set(b.spawners.flatMap((s) => s.enemies));
    expect(roster.has('blazer_smiler')).toBe(true);
    expect(roster.has('pigeon_gang')).toBe(true);
  });

  it('the dungeon entrance survived the jitter', () => {
    expect(MAPS.brickton.props.some((p) => p.door?.to === 'dos_f1')).toBe(true);
  });
});

describe('ADR-012 — every city follows the Brickton rules (GAME_BIBLE §B4)', () => {
  const cities = maps.filter((m) => m.settlement === 'city');
  const street = (ch: string): boolean => 'RDX'.includes(ch);

  /** broken rules for a city map; empty = compliant */
  const cityViolations = (m: MapDef): string[] => {
    const out: string[] = [];
    const grid = m.grid;
    const w = grid[0].length;
    // ≥2 horizontal street bands separated by a built-up block
    const roadRows = grid
      .map((row, y) => ({ y, n: [...row].filter(street).length }))
      .filter((r) => r.n > Math.floor(w * 0.4))
      .map((r) => r.y);
    if (roadRows.length < 6) out.push(`${m.id}: needs at least two streets`);
    if (!roadRows.some((y, i) => i > 0 && y - roadRows[i - 1] > 1)) {
      out.push(`${m.id}: streets must be separated by a built-up block`);
    }
    // a vertical avenue stitches the streets together
    let connector = false;
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = 0; y < grid.length; y++) if (street(grid[y][x])) n++;
      if (n >= 12) connector = true;
    }
    if (!connector) out.push(`${m.id}: needs a connecting avenue`);
    // buildings must front more than one street (the anti-strip rule);
    // band by each facade's ground line, derived from its solid rect
    const faces = new Set(
      m.props
        .filter((p) => p.sprite.startsWith('bldg_') && p.solid)
        .map((p) => Math.round((p.y * 16 + (p.solid?.oy ?? 0) + (p.solid?.h ?? 0) + 12) / 64)),
    );
    if (faces.size < 2) out.push(`${m.id}: buildings must occupy 2+ block faces`);
    return out;
  };

  it('city maps are tagged (Brickton today; Ch.2+ cities join this sweep)', () => {
    expect(cities.length).toBeGreaterThanOrEqual(1);
    expect(cities.some((m) => m.id === 'brickton')).toBe(true);
  });

  it('every tagged city passes: grid, connector, multiple faces — never a strip', () => {
    for (const m of cities) expect(cityViolations(m)).toEqual([]);
  });

  it('negative control: the sweep rejects a one-street strip-city', () => {
    const strip: MapDef = {
      id: 'strip_city',
      name: 'STRIPVILLE',
      music: null,
      settlement: 'city',
      grid: ['='.repeat(30), 'R'.repeat(30), 'R'.repeat(30), '='.repeat(30)],
      props: [{ sprite: 'bldg_fake', x: 1, y: 0, solid: { ox: 0, oy: 26, w: 66, h: 22 } }],
      npcs: [],
      signs: [],
      phones: [],
      doors: [],
      spawners: [],
      triggers: [],
    };
    expect(cityViolations(strip).length).toBeGreaterThanOrEqual(3);
  });
});

describe('S1 canon — the Department & the 6:15', () => {
  it('the Department is 3 floors ending at the locked holding room', () => {
    expect(MAPS.dos_f1.doors.some((d) => d.to === 'dos_f2')).toBe(true);
    expect(MAPS.dos_f2.doors.some((d) => d.to === 'dos_f3')).toBe(true);
    expect(MAPS.dos_f3.props.some((p) => p.sprite === 'holding_door')).toBe(true);
    // S2's PRODUCTIVITY LOCK counts three patrol Smilers on floor 3
    expect((MAPS.dos_f3.patrols ?? []).length).toBe(3);
  });

  it('two new picnic tables placed per §A4.5 (before the dungeon, and inside it)', () => {
    const tables =
      MAPS.brickton.props.filter((p) => p.sprite === 'picnic').length +
      MAPS.dos_f2.props.filter((p) => p.sprite === 'picnic').length;
    expect(tables).toBe(2);
  });

  it('the 6:15 connects Otterbrook and Brickton', () => {
    expect(MAPS.bus_interior).toBeDefined();
    expect(MAPS.otterbrook.triggers.some((t) => t.id === 'bus_stop')).toBe(true);
    expect(MAPS.brickton.triggers.some((t) => t.id === 'bus_stop_brickton')).toBe(true);
  });
});

describe('S2 canon — the PRODUCTIVITY LOCK, Faye, and the chapter button (§A6, ADR-014)', () => {
  const f3 = MAPS.dos_f3;

  it('the three floor-3 patrols carry distinct quota countFlags (stable ids, ADR-011)', () => {
    const patrols = f3.patrols ?? [];
    expect(patrols.map((p) => p.id).sort()).toEqual(['f3a', 'f3b', 'f3c']);
    const flags = patrols.map((p) => p.countFlag);
    expect(flags.every((f) => typeof f === 'string' && f.length > 0)).toBe(true);
    expect(new Set(flags).size).toBe(3);
  });

  it('the sealed holding room is solid wall; the carve opens floor + a doorway', () => {
    const { x, y, w, h } = HOLDING_ROOM;
    // sealed: every cell of the block is office wall
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        expect(f3.grid[j][i], `sealed (${i},${j})`).toBe('O');
      }
    }
    const carved = carveHoldingRoom(f3.grid);
    // interior is floor, rim stays wall, the gap under the door is walkable
    for (let j = y + 1; j < y + h - 1; j++) {
      for (let i = x + 1; i < x + w - 1; i++) {
        expect(carved[j][i], `carved interior (${i},${j})`).toBe('o');
      }
    }
    expect(carved[y][x]).toBe('O');
    expect(carved[y + h - 1][x]).toBe('O');
    for (let i = HOLDING_DOOR_GAP.x; i < HOLDING_DOOR_GAP.x + HOLDING_DOOR_GAP.w; i++) {
      expect(carved[y + h - 1][i], `doorway gap (${i})`).toBe('o');
    }
    // the original MapDef grid was not mutated (ADR-012 determinism)
    expect(f3.grid[y + 1][x + 1]).toBe('O');
  });

  it('Faye waits inside, gated on the open room and gone once joined', () => {
    const faye = f3.npcs.find((n) => n.id === 'faye');
    expect(faye).toBeDefined();
    expect(faye?.ifFlag).toBe('holding_open');
    expect(faye?.unlessFlag).toBe('faye_joined');
    const { x, y, w, h } = HOLDING_ROOM;
    expect(faye && faye.x > x && faye.x < x + w - 1 && faye.y > y && faye.y < y + h - 1).toBe(true);
    // her cot only exists once the room does
    expect(f3.props.find((p) => p.sprite === 'cot')?.ifFlag).toBe('holding_open');
  });

  it('the join, the exit interview, and the ringing payphone are all wired', () => {
    expect(f3.triggers.some((t) => t.id === 'faye_meet')).toBe(true);
    expect(f3.triggers.some((t) => t.id === 'manager_block')).toBe(true);
    expect(MAPS.brickton.triggers.some((t) => t.id === 'payphone_ring')).toBe(true);
    // Mom calls the canon payphone at brickton tile (14,26)
    expect(MAPS.brickton.phones).toContainEqual({ x: 14, y: 26 });
  });
});
