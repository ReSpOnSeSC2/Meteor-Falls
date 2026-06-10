/**
 * Map data integrity — every reference a MapDef makes must resolve.
 * (Prompt S5 turns these checks into the full zod content validator.)
 */
import { describe, expect, it } from 'vitest';
import { CHAR_LEGEND, MAPS } from './maps';
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
