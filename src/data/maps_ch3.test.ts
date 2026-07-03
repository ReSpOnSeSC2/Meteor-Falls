/**
 * CHAPTER 3 — the WORLD-OVERHAUL GUARD (pre-rebuild fixed-point pins).
 *
 * The Ch3 pilot (World Overhaul program, docs/WORLD_OVERHAUL_HANDOFF.md) rebuilds
 * Foggybottom to the ~126×96 regional bar and enriches the Wintermoor dungeon.
 * Unlike Ch1–2, Ch3 has NO frozen-core / envelope test — so a rebuild is unusually
 * free, which also means a broken external-warp landing or a dropped story contract
 * would only surface in door-audit or live play, never a byte test.
 *
 * This suite pins the SEMANTIC contracts a rebuild must preserve, and deliberately
 * pins NONE of the coordinates the rebuild is meant to move (district layout, door
 * MOUTH positions, the Lucille landing tile). Door LANDING geometry (farFromReturn,
 * landsSolid) is owned by `npx tsx tools/door-audit.ts`, a stronger live check — so
 * this file asserts targets/counts/ids, not tile math. If any assertion here fails
 * after a rebuild, a fixed point was lost; recover it before shipping the map.
 */
import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import { FOGGYBOTTOM_LANDING } from './maps_ch3';

/** the ten hand-authored Ch3 maps (buildChapter3Maps) that ship into MAPS */
const CH3_MAP_IDS = [
  'biplane_interior',
  'foggybottom',
  'foggy_moor',
  'wintermoor_grounds',
  'the_old_stones',
  'wintermoor_f1',
  'wintermoor_f2',
  'wintermoor_f3',
  'wintermoor_dorm',
  'wintermoor_boiler',
] as const;

const map = (id: string) => {
  const m = MAPS[id];
  if (!m) throw new Error(`Ch3 map '${id}' is missing from the assembled MAPS`);
  return m;
};

describe('Ch3 world-overhaul guard — every hand-authored map still assembles', () => {
  it.each(CH3_MAP_IDS)('%s exists in MAPS', (id) => {
    expect(MAPS[id]).toBeDefined();
  });

  it('every map-level door across Ch3 targets a real map', () => {
    for (const id of CH3_MAP_IDS) {
      for (const d of map(id).doors ?? []) {
        expect(MAPS[d.to], `${id} → ${d.to} is a dangling door`).toBeDefined();
      }
    }
  });
});

describe('Ch3 guard — the Lucille arrival contract (biplane ↔ foggybottom)', () => {
  it('the biplane sets the party down via FOGGYBOTTOM_LANDING (kept in sync)', () => {
    const toTown = map('biplane_interior').doors.filter((d) => d.to === 'foggybottom');
    expect(toTown, 'exactly one biplane → foggybottom hatch').toHaveLength(1);
    // the door target must stay wired to the exported landing constant, whatever the
    // rebuild moves that tile to — this is the sync contract, not a coordinate pin.
    expect(toTown[0].tx).toBe(FOGGYBOTTOM_LANDING.x * 16);
    expect(toTown[0].ty).toBe(FOGGYBOTTOM_LANDING.y * 16);
  });

  it('foggybottom keeps EXACTLY ONE door back to the biplane (Lucille origin/return)', () => {
    // OverworldScene.lucilleReturnDoor keys on MAPS.foggybottom.doors.find(to==='biplane_interior');
    // losing or duplicating it silently regresses the Ch4+ hatch-return.
    const toBiplane = map('foggybottom').doors.filter((d) => d.to === 'biplane_interior');
    expect(toBiplane).toHaveLength(1);
    // it lands on the biplane's frozen hatch spawn (biplane geometry is NOT rebuilt)
    expect(toBiplane[0].tx).toBe(11 * 16);
    expect(toBiplane[0].ty).toBe(8 * 16);
  });

  it('foggybottom stays a settlement town so occupyCity keeps filling it', () => {
    expect(map('foggybottom').settlement).toBe('town');
    expect(map('foggybottom').area).toBe('foggybottom');
  });
});

describe('Ch3 guard — §A4.5 picnic law (exactly one rest table per overworld map)', () => {
  it.each(['foggybottom', 'foggy_moor', 'wintermoor_grounds'] as const)(
    '%s has exactly one picnic table',
    (id) => {
      const picnics = map(id).props.filter((p) => p.sprite === 'picnic');
      expect(picnics).toHaveLength(1);
    },
  );
});

describe('Ch3 guard — story / quest / PSI trigger contracts survive the rebuild', () => {
  // ids wired to OverworldScene trigger dispatch, quests.ts, and psigates.ts. The
  // rects may move; the ids and their host map must not.
  const CONTRACTS: Record<string, string[]> = {
    biplane_interior: ['ch3_arrival'],
    foggybottom: ['q_sender_l1', 'q_sender_l2', 'q_sender_l3'],
    foggy_moor: ['q_penny_found'],
    wintermoor_grounds: ['wm_arrival', 'q_cuppa_milk'],
    the_old_stones: ['old_stones_resonance', 'q_cuppa_water'],
    wintermoor_f1: ['q_overdue_b1'],
    wintermoor_f2: ['q_overdue_b2'],
    wintermoor_f3: ['mainframe_boss'],
    wintermoor_dorm: ['q_overdue_b3'],
    wintermoor_boiler: ['wintermoor_coolant'], // §A4.11 PSI gate (Vibe Freeze)
  };
  for (const [id, ids] of Object.entries(CONTRACTS)) {
    it(`${id} keeps [${ids.join(', ')}]`, () => {
      const have = new Set((map(id).triggers ?? []).map((t) => t.id));
      for (const t of ids) expect(have.has(t), `${id} lost trigger '${t}'`).toBe(true);
    });
  }
});

describe('Ch3 guard — ambience + the reflective Tyne (post-assembly passes still bind)', () => {
  it('map ambience is keyed by id (rebuild must keep the ids)', () => {
    expect(map('foggybottom').ambience).toBe('rain');
    expect(map('wintermoor_boiler').ambience).toBe('machine');
    expect(map('wintermoor_boiler').muffle).toBe(2);
  });

  it('foggybottom keeps a reflective river rect, in-bounds and over water', () => {
    const fb = map('foggybottom');
    const zones = fb.reflect ?? [];
    expect(zones.length).toBeGreaterThan(0);
    const H = fb.grid.length;
    const W = fb.grid[0].length;
    for (const z of zones) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.x + z.w).toBeLessThanOrEqual(W);
      expect(z.y + z.h).toBeLessThanOrEqual(H);
      // the mirror needs real water under it — at least one sea tile in the rect
      let overWater = false;
      for (let y = z.y; y < z.y + z.h; y++)
        for (let x = z.x; x < z.x + z.w; x++) if (fb.grid[y][x] === 'e') overWater = true;
      expect(overWater, 'reflect rect must overlap a sea (e) tile').toBe(true);
    }
  });
});
