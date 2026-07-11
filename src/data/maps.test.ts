/**
 * Map BEHAVIOR and structure — the ADR-012 city sweep, carveHoldingRoom, the
 * S4 doorstep derivation, and canon scene wiring. Pure existence and
 * cross-reference checks (legend chars, tile names, door targets, dialogue
 * ids, enemy ids) moved to tools/content-validate.ts (S5) — `npm run
 * validate` owns them now.
 */
import { describe, expect, it } from 'vitest';
import {
  MAPS,
  HOLDING_ROOM,
  HOLDING_DOOR_GAP,
  carveHoldingRoom,
  type MapDef,
} from './maps';
// S15g: the ADR-012 sweep has ONE home now (src/levelkit/metrics.ts) — the
// shipped-city check here and the generated-city proof in the levelkit test
// run the identical function, so they can never drift.
import { cityViolations, livingCityViolations } from '../levelkit/metrics';
import { LANDMARK_FACADE_SPRITES } from '../spritegen/buildings';

const maps = Object.values(MAPS);

describe('outdoor entrance presentation', () => {
  it('never authors generic welcome mats outdoors', () => {
    const offenders = maps
      .filter((map) => !map.interior)
      .flatMap((map) =>
        map.props
          .filter((prop) => prop.sprite === 'doormat')
          .map((prop) => `${map.id}@${prop.x},${prop.y}`),
      );

    expect(offenders).toEqual([]);
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

describe('ADR-099 — landmark drawHouse facades collide as their REAL footprint', () => {
  it('every golf-resort landmark prop is recognised for the texture-true rebuild', () => {
    // OverworldScene routes any LANDMARK_FACADE sprite through facadeSolids/
    // facadeDoorBox (the ADR-051 bldg_ path), so collision == the drawn footprint
    // minus the doorway and the entrance sits at the drawn door's mouth — the fix
    // for the clubhouse_grand walk-through-walls + too-deep-doorstep faults.
    const golf = MAPS.golf_resort;
    const landmarks = golf.props.filter((p) => LANDMARK_FACADE_SPRITES.has(p.sprite));
    expect(landmarks.map((p) => p.sprite).sort()).toEqual(
      ['clubhouse_grand', 'golf_gatehouse', 'mansion_a', 'mansion_b', 'mansion_c'].sort(),
    );
  });

  it('the LINKS clubhouse keeps its door into the pro-shop (the transition the fix re-aligns)', () => {
    const club = MAPS.golf_resort.props.find((p) => p.sprite === 'clubhouse_grand');
    expect(club?.door?.to).toBe('golf_clubhouse');
    expect(MAPS.golf_clubhouse).toBeDefined();
  });

  it('no LANDMARK_FACADE sprite is an orphan — each is placed on some map', () => {
    const placed = new Set(maps.flatMap((m) => m.props.map((p) => p.sprite)));
    for (const s of LANDMARK_FACADE_SPRITES) {
      expect(placed.has(s), `${s} should be placed on a map`).toBe(true);
    }
  });
});

describe('ADR-012 — every city follows the Brickton rules (GAME_BIBLE §B4)', () => {
  const cities = maps.filter((m) => m.settlement === 'city');

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

describe('Living-City Law (S18) — settlements are alive by default', () => {
  it('every settlement passes occupyCity: most buildings enterable, locked ones knock', () => {
    for (const m of maps.filter((x) => x.settlement)) {
      expect(livingCityViolations(m)).toEqual([]);
    }
  });

  it('the grown cities are richly enterable (Brickton, Puerto Sol)', () => {
    for (const id of ['brickton', 'puerto_sol']) {
      const m = maps.find((x) => x.id === id);
      if (!m) continue;
      const facades = m.props.filter((p) => p.sprite.startsWith('bldg_') && p.solid);
      const enterable = facades.filter((p) => p.door).length;
      expect(facades.length).toBeGreaterThanOrEqual(8);
      expect(enterable / facades.length).toBeGreaterThanOrEqual(0.75);
    }
  });

  it('negative control: a doorless block-city is rejected as dead', () => {
    const dead: MapDef = {
      id: 'dead_city',
      name: 'DEADTOWN',
      music: null,
      settlement: 'city',
      grid: ['='.repeat(20)],
      props: Array.from({ length: 10 }, (_v, i) => ({
        sprite: 'bldg_gen_office_blue_2',
        x: i,
        y: 0,
        solid: { ox: 0, oy: 26, w: 66, h: 22 },
      })),
      npcs: [],
      signs: [],
      phones: [],
      doors: [],
      spawners: [],
      triggers: [],
    };
    expect(livingCityViolations(dead).length).toBeGreaterThanOrEqual(1);
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
    // Both towns now board inside real stations. Keeping the return trigger off
    // Twoton's street prevents an immediate second prompt after leaving the depot.
    expect(MAPS.otterbrook.props.some((p) => p.door?.to === 'bus_depot_int') || MAPS.otterbrook.doors.some((d) => d.to === 'bus_depot_int')).toBe(true);
    expect(MAPS.bus_depot_int.triggers.some((t) => t.id === 'depot_board')).toBe(true);
    expect(MAPS.brickton.props.some((p) => p.door?.to === 'twoton_bus_station')).toBe(true);
    expect(MAPS.twoton_bus_station.triggers.some((t) => t.id === 'bus_stop_brickton')).toBe(true);
    expect(MAPS.brickton.triggers.some((t) => t.id === 'bus_stop_brickton')).toBe(false);
  });
});

describe('S4 canon — shops open, the bank grows an ATM (Prompt 20, ADR-016)', () => {
  it('the drugstore and STARMART are real doors now', () => {
    expect(MAPS.otterbrook.props.some((p) => p.door?.to === 'drugstore_int') || MAPS.otterbrook.doors.some((d) => d.to === 'drugstore_int')).toBe(true);
    expect(MAPS.brickton.props.some((p) => p.sprite === 'bldg_starmart' && p.door?.to === 'starmart_int')).toBe(true);
  });

  it('shop exits derive their doorsteps from the placed entry points -- computed, never hardcoded', () => {
    const cases: Array<{ street: string; interior: string }> = [
      { street: 'otterbrook', interior: 'drugstore_int' },
      { street: 'brickton', interior: 'starmart_int' },
    ];
    for (const c of cases) {
      const prop = MAPS[c.street].props.find((p) => p.door?.to === c.interior);
      const d = prop?.door;
      const zone = MAPS[c.street].doors.find((z) => z.to === c.interior);
      expect((prop && d) || zone, `${c.street} entry -> ${c.interior}`).toBeTruthy();
      const exit = MAPS[c.interior].doors.find((z) => z.to === c.street);
      expect(exit, `${c.interior} exit`).toBeDefined();
      if (prop && d) {
        // G11 (EB scale pass): door offsets are NATIVE units — a per-instance
        // PropDef.scale multiplies them, exactly as doorstepOf/the renderer do.
        const sx = typeof prop.scale === 'number' ? prop.scale : prop.scale?.x ?? 1;
        const sy = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
        expect(exit?.tx).toBe(prop.x * 16 + (d.ox + d.w / 2) * sx);
        expect(exit?.ty).toBe(prop.y * 16 + (d.oy + d.h) * sy + 5);
        // ADR-051: both case streets now place texture-refit facades (Otterbrooke
        // landmarks; Twoton's scaled 'bldg_' storefronts), so the live door opening
        // is audited by content-validate's door-audit (landsSolid/bodyBlocked)
        // rather than a static data-solid floor comparison here.
      } else {
        expect(exit?.tx).toBe((zone!.x + zone!.w / 2) * 16);
        expect(exit?.ty).toBe((zone!.y + zone!.h / 2) * 16);
      }
    }
  });

  it('each interior has a keeper who opens a shop, behind a counter', () => {
    for (const id of ['drugstore_int', 'starmart_int']) {
      const m = MAPS[id];
      const keeper = m.npcs.find((n) => n.shop !== undefined);
      expect(keeper, `${id} keeper`).toBeDefined();
      expect(m.props.filter((p) => p.sprite === 'counter').length).toBeGreaterThanOrEqual(2);
      // browsable stock: classic shelves OR the 2026-07-02 venue-pass aisles
      expect(m.props.some((p) => p.sprite.startsWith('shelf') || p.sprite === 'mart_aisle')).toBe(true);
      expect(m.interior).toBe(true);
    }
  });

  it('the ATM stands at the jittered SAVINGS & LOAN facade (and the bank stays locked)', () => {
    const bank = MAPS.brickton.props.find((p) => p.sprite === 'bldg_bank');
    expect(bank).toBeDefined();
    const atms = MAPS.brickton.atms ?? [];
    expect(atms.length).toBe(1);
    // parked on the bank's storefront, not floating somewhere hardcoded
    expect(atms[0].x).toBeGreaterThanOrEqual(bank?.x ?? 99);
    expect(atms[0].x).toBeLessThanOrEqual((bank?.x ?? 0) + 6);
    // the interaction point has a matching visible prop
    expect(MAPS.brickton.props.some((p) => p.sprite === 'atm' && p.x === atms[0].x)).toBe(true);
    // no door on the bank — it sleeps standing up
    expect(bank?.door).toBeUndefined();
  });
});

describe('S2 canon — the PRODUCTIVITY LOCK, Mia, and the chapter button (§A6, ADR-014)', () => {
  const f3 = MAPS.dos_f3;
  // (the three-distinct-countFlags rule is validator canon now, S5)

  it('the sealed holding room is solid wall; the carve opens floor + a doorway', () => {
    const { x, y, w, h } = HOLDING_ROOM;
    // sealed: every cell of the block is the Department's blue wall skin
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        expect(f3.grid[j][i], `sealed (${i},${j})`).toBe('L');
      }
    }
    const carved = carveHoldingRoom(f3.grid);
    // interior is floor, rim stays wall, the gap under the door is walkable
    for (let j = y + 1; j < y + h - 1; j++) {
      for (let i = x + 1; i < x + w - 1; i++) {
        expect(carved[j][i], `carved interior (${i},${j})`).toBe('o');
      }
    }
    expect(carved[y][x]).toBe('L');
    expect(carved[y + h - 1][x]).toBe('L');
    for (let i = HOLDING_DOOR_GAP.x; i < HOLDING_DOOR_GAP.x + HOLDING_DOOR_GAP.w; i++) {
      expect(carved[y + h - 1][i], `doorway gap (${i})`).toBe('o');
    }
    // the original MapDef grid was not mutated (ADR-012 determinism)
    expect(f3.grid[y + 1][x + 1]).toBe('L');
  });

  it('Mia waits inside, gated on the open room and gone once joined', () => {
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
    // Mom calls the canon payphone at Twoton's bus corner (58,19) — and the ring
    // trigger's rect actually covers it, so the beat fires where the phone stands
    expect(MAPS.brickton.phones).toContainEqual({ x: 58, y: 19 });
    const ring = MAPS.brickton.triggers.find((t) => t.id === 'payphone_ring');
    expect(ring && 58 >= ring.rect.x && 58 < ring.rect.x + ring.rect.w && 19 >= ring.rect.y && 19 < ring.rect.y + ring.rect.h).toBe(true);
  });
});

describe('Wave 2 (ADR-108) — map ambient audio · reflections · NPC ambient life', () => {
  it('ambient beds are wired onto the maps that asked for them (#16)', () => {
    expect(MAPS.foggybottom.ambience).toBe('rain');
    expect(MAPS.puerto_sol.ambience).toBe('waves');
    expect(MAPS.otterbrook.ambience).toBe('birds');
    // the Hushed mainframe's room overrides the indoor veil to DEEP + hums
    expect(MAPS.wintermoor_boiler.ambience).toBe('machine');
    expect(MAPS.wintermoor_boiler.muffle).toBe(2);
  });

  it('muffle is an OVERRIDE only — most maps leave it to derive from `interior`', () => {
    const withMuffle = maps.filter((m) => m.muffle !== undefined);
    expect(withMuffle.every((m) => m.muffle === 0 || m.muffle === 1 || m.muffle === 2)).toBe(true);
    expect(withMuffle.length).toBeLessThan(maps.length); // never blanket-authored
  });

  it('reflective surfaces sit on maps with water, in-bounds of the grid (#6)', () => {
    expect((MAPS.foggybottom.reflect ?? []).length).toBeGreaterThan(0);
    expect((MAPS.otterbrook.reflect ?? []).length).toBeGreaterThan(0);
    for (const m of maps) {
      const gw = m.grid[0]?.length ?? 0;
      const gh = m.grid.length;
      for (const z of m.reflect ?? []) {
        expect(z.x + z.w).toBeLessThanOrEqual(gw);
        expect(z.y + z.h).toBeLessThanOrEqual(gh);
      }
    }
  });

  it('ambient NPCs carry their moods; no dog opts into the idle-breath (#4)', () => {
    const angler = MAPS.otterbrook.npcs.find((n) => n.id === 'pond_angler');
    expect(angler?.emote).toBe('think');
    expect(angler?.idle).toBe(true);
    // the coherence rule the validator also enforces, pinned here too
    for (const m of maps) {
      for (const n of m.npcs) expect(n.dog && n.idle).toBeFalsy();
    }
  });
});
