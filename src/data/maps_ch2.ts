/**
 * S14 — the Chapter 2 maps (GAME_BIBLE §A5/§A6: Brickton docks → the banana
 * boat → PUERTO SOL → the jungle → VALLE DORADO → the step-pyramid). Same
 * ADR-004 code-grid law as every map; PUERTO SOL is a CITY under the full
 * ADR-012 sweep with its own frozen seed:
 *
 *   PUERTO SOL'S SEED IS 1898 — pick it once, freeze it forever (the 1995
 *   rule's fourth application; 1995/2077/2095 remain byte-identical because
 *   this stream lives in its own builder). Every jittered position below
 *   derives from this stream IN ORDER: adding rng() calls before existing
 *   ones would shift the whole port. Don't.
 *
 * THE PYRAMID ROTATION (§A6): each chamber's center is a 7×7 ROTOR — a
 * T-shaped channel that the room's mask switch turns 90° clockwise per
 * press (flag pyr_rot_N counts presses; the effective rotation is
 * (initial + presses) % 4, applied at BUILD time by rotateRect — the
 * carveHoldingRoom pattern: the shared MapDef is never mutated, the scene
 * fade-restarts per ADR-014). The T's arms read on the floor, so the solve
 * is visual: turn the channel until it bridges your door to the next.
 *   Bot line (documented for the ADR-008 driver): presses per room
 *   1 → 1 → 2 → 1 (rooms start at rotations 0/2/3/2; room 3 exits EAST,
 *   room 4 is entered from the west into its south lobby — one press bridges up).
 */
import { Grid, doorstepOf } from './mapkit';
import { cityBuildingHeight } from '../spritegen/tiles';
import { facadeDims } from '../levelkit/kit';
// 2026-07-08 — the stage 3/4 rebuilds: Puerto Sol (Threed), Las Dunas (Dusty
// Dunes), Valle Dorado (Fourside) are EDITOR-AUTHORED documents now; the old
// frozen-core/grow builders are retired (the Twoton precedent).
import { puertoSolMap } from './maps_puerto_sol';
import { dunasWestMap, dunasEastMap } from './maps_dunas';
import { valleDoradoMap } from './maps_valle_dorado';
import type { MapDef, PropDef, SignDef } from '../schemas';

/** S17 M18 Part B (ADR-063): a one-grant gift box + its sign — the maps.ts
 *  `walkPresent` pattern, inlined for Ch.2 (where the grotto chests + the dock
 *  present already use it raw). The closed box/sign retire on `flag`; the opened
 *  box + a flavor sign take their place. `extra.ifFlag` layers a SECOND gate on
 *  the closed state only (the wish token appears once the Grin falls), so the
 *  open state still keys cleanly on `flag`. The sub-tile solid never seals a
 *  lane; callers place the box on an open, BFS-reachable tile. */
const GIFT_SOLID = { ox: 1, oy: 7, w: 12, h: 6 } as const;
function giftBox(
  flag: string,
  x: number,
  y: number,
  extra: { ifFlag?: string } = {},
): { props: PropDef[]; signs: SignDef[] } {
  return {
    props: [
      { sprite: 'gift_box', x, y, solid: GIFT_SOLID, ...extra, unlessFlag: flag },
      { sprite: 'gift_box_open', x, y, solid: GIFT_SOLID, ifFlag: flag },
    ],
    signs: [
      { x, y: y + 1, dialogue: flag, ...extra, unlessFlag: flag },
      { x, y: y + 1, dialogue: `${flag}_done`, ifFlag: flag },
    ],
  };
}

/* ================= THE BRICKTON DOCKS (the Ch.2 gate) ================= */

export function buildBricktonDocks(): MapDef {
  const g = new Grid(30, 18, '=');
  // the sea owns the east and the south
  g.rect(20, 0, 10, 18, 'e');
  g.rect(0, 15, 30, 3, 'e');
  g.rect(0, 14, 20, 1, 'E');
  g.rect(19, 0, 1, 15, 'E');
  // the pier pushes out into it
  g.rect(8, 6, 16, 5, 'd');
  g.rect(22, 7, 4, 3, 'd');
  // brick spine along the north (the city at your back) — the west wall
  // opens at y 6–8, the return door's rows (doors[] below): the gap must
  // stay walkable or the docks seal Brickton off behind the boat
  g.rect(0, 0, 30, 2, 'B');
  g.rect(0, 2, 1, 4, 'B');
  g.rect(0, 9, 1, 5, 'B');
  return {
    id: 'brickton_docks',
    name: 'TWOTON DOCKS',
    music: 'puerto',
    grid: g.out(),
    props: [
      // THE BANANA BOAT, moored where the §A5 row says it waits
      { sprite: 'banana_boat', x: 21, y: 3.5, solid: { ox: 4, oy: 22, w: 120, h: 24 } },
      { sprite: 'gangplank', x: 22.6, y: 7.6 },
      { sprite: 'departure_board', x: 9, y: 4.4, solid: { ox: 2, oy: 20, w: 22, h: 8 } },
      { sprite: 'crate', x: 11, y: 8.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate_bananas', x: 12.3, y: 9.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'payphone', x: 4, y: 4, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'trash_can', x: 16, y: 3.4, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      // S17 M18 Part B (ADR-063): the banana cargo passage stub (§A5 key item),
      // pinned under a crate mid-pier (open 'd' deck, clear of the crates/boat)
      ...giftBox('gift_boat_ticket', 14, 8).props,
    ],
    npcs: [
      { id: 'captain', sprite: 'captain', x: 21, y: 9, facing: 'down', dialogue: 'npc_captain' },
      { id: 'dock_kid', sprite: 'pigeonKid', x: 7, y: 11, facing: 'right', dialogue: 'npc_dock_kid', wander: true },
      // the Ch.3 tease (zero map yet): Uncle Bert turns up once the Grin falls
      { id: 'uncle_bert', sprite: 'uncleBert', x: 13, y: 5, facing: 'down', dialogue: 'npc_uncle_bert', ifFlag: 'ch2_complete' },
    ],
    signs: [
      { x: 9, y: 5, dialogue: 'sign_departures' },
      ...giftBox('gift_boat_ticket', 14, 8).signs,
    ],
    phones: [{ x: 4, y: 4 }],
    doors: [
      // back through the east gate onto TWOTON's drag, just west of the river
      // bridge (the Twoson rebuild's docks road; BRICKTON_DOCKS_RETURN in maps.ts
      // pins the same px — world_block.test keeps the two sides from drifting).
      { x: 0, y: 6, w: 1, h: 3, to: 'brickton', tx: 1944, ty: 1008, facing: 'left' },
    ],
    spawners: [],
    triggers: [
      // standing at the gangplank — the captain's boarding ask (ch1-gated)
      { id: 'board_boat', rect: { x: 22, y: 7, w: 2, h: 3 }, once: false },
    ],
  };
}

/* ================= THE CROSSING (the boat's deck — bus-map precedent) ================= */

export function buildBoatInterior(): MapDef {
  const g = new Grid(24, 10, 'd');
  g.rect(0, 0, 24, 3, 'y'); // sky band — the reel scrolls here
  g.rect(0, 3, 24, 1, 'e'); // the horizon
  g.rect(0, 4, 24, 1, '-'); // the rail
  g.rect(0, 9, 24, 1, '-'); // stern rail
  return {
    id: 'boat_interior',
    name: 'THE BANANA BOAT',
    music: 'boat',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'crate_bananas', x: 3, y: 5.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate', x: 5.6, y: 6.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate_bananas', x: 18, y: 6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate', x: 16.4, y: 7.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    ],
    npcs: [
      { id: 'captain_deck', sprite: 'captain', x: 21, y: 6, facing: 'left', dialogue: 'npc_captain_deck' },
      // a Valle Dorado señora heading home — the worry rides with you
      { id: 'boat_senora', sprite: 'senora', x: 9, y: 6, facing: 'up', dialogue: 'npc_boat_senora' },
    ],
    signs: [],
    phones: [],
    doors: [],
    spawners: [],
    triggers: [],
  };
}

/* ================= PUERTO SOL — the §A5 Ch.2 port CITY (seed 1898) ================= */

/** where the boat lands you — OverworldScene's crossing flow reads this */
export const PUERTO_SOL_PIER_SPAWN = { x: 416, y: 996 } as const;
/** the north gate up the cliff road — COSTA_DOOR_FOR_PUERTO_SOL aims here */
export const PUERTO_SOL_NORTH_GATE = { tx: 120, ty: 32 } as const;

/**
 * RE-LAYOUT (docs/CITY_DESIGN_LANGUAGE.md, "Malecón + zócalo"): a colonial port
 * town, six quarters tangent to each other:
 *   ZÓCALO (plaza, x30-45/y12-18) — the town's room: a re-centered fountain,
 *     benches facing it, the picnic + sign + nina gathered around.
 *   NORTH ROW (mercado/clinic/pension, x2-20) — commercial trio with TWO
 *     callejón alcoves cut into the gaps (crate/trash_can dead-ends).
 *   THE MUSEUM (x22-27) — pulled off the trio so its door centers on the
 *     x24-26 avenue: looking down the avenue from street A, the museum's
 *     door is dead ahead (M4 landmark axis).
 *   CASA QUARTER (west of the avenue, y10-20, x1-23) — a residential pocket:
 *     staggered casas/pension_b behind courtyard fence runs with flower beds.
 *   MARKET LANE (y23.4, south of street B) — 3 stalls tightened with crates
 *     between them, the stallman working the middle.
 *   THE MALECÓN ROOT (dock band, y26-29) — palms on a waterfront rhythm, the
 *     pier's crates, the fisher reading the tide.
 * Streets gain X crosswalks at both avenue×street junctions (M1: "every
 * intersection"), storm drains at curb corners, and a seeded wear pass
 * ('1' cracks / '2' patches) the CORE's own stream — never shared outward.
 */
/* ================= PUERTO SOL — the THREED rebuild (2026-07-08) ================= */

/**
 * The port is the EDITOR-AUTHORED document now (src/data/maps_puerto_sol.ts ⇄
 * tools/mapeditor/puerto_sol.json) — Threed grammar per the user's towns 1–4
 * lock: one E-W spine with gate arches both ends, two slanted shopping
 * diagonals making parallelogram blocks, the catedral plaza at the heart,
 * EL CAMPO VIEJO walled graveyard NW, and the working quay + banana boat along
 * the south water. buildPuertoSol (the 1898 frozen core) + growPuertoSol are
 * RETIRED (the Twoton precedent). This wrapper grafts only the five NAMED
 * interior doors — art-anchored px rects the editor can't express, so an
 * editor re-export can never drop them; occupyCity doors the rest at the
 * registry, and the corridor landings are cross-aimed in the Valle block.
 */
const PS_NAMED_DOORS: Record<
  string,
  { ox: number | 'center'; w: number; to: string; tx: number; ty: number }
> = {
  bldg_ps_mercado: { ox: 33, w: 16, to: 'mercado_int', tx: 96, ty: 118 },
  bldg_ps_clinic: { ox: 33, w: 16, to: 'clinic_ps_int', tx: 88, ty: 118 },
  bldg_ps_museum: { ox: 33, w: 26, to: 'museum_int', tx: 120, ty: 150 },
  bldg_ps_deli: { ox: 17, w: 16, to: 'deli_int', tx: 88, ty: 118 },
  bldg_ps_gran_hotel: { ox: 'center', w: 16, to: 'hotel_ps_lobby', tx: 168, ty: 172 },
};
function makePuertoSol(): MapDef {
  const m = puertoSolMap;
  for (const p of m.props) {
    const spec = PS_NAMED_DOORS[p.sprite];
    if (!spec || p.door) continue;
    const dims = facadeDims(p.sprite);
    const H = cityBuildingHeight(dims.u);
    const ox = spec.ox === 'center' ? Math.round((dims.w * 16) / 2) - 8 : spec.ox;
    p.door = { ox, oy: H - 14, w: spec.w, h: 18, to: spec.to, tx: spec.tx, ty: spec.ty };
  }
  return m;
}
/** the LIVE port (grafted once at module load — every consumer sees the doors) */
export const puertoSol = makePuertoSol();

/** land 2 tiles inside a map's EDGE door zone, centered on it — the computed-landing
 *  law (ADR-012): corridor doors aim at these, never at baked px. */
function edgeLanding(map: MapDef, to: string): { tx: number; ty: number } {
  const d = map.doors.find((dd) => dd.to === to);
  if (!d) return { tx: 40, ty: 40 };
  const W = map.grid[0].length;
  const H = map.grid.length;
  const cx = d.x + (d.w - 1) / 2;
  const cy = d.y + (d.h - 1) / 2;
  if (d.x === 0) return { tx: 2 * 16 + 8, ty: Math.round(cy) * 16 };
  if (d.x >= W - 1) return { tx: (W - 3) * 16 + 8, ty: Math.round(cy) * 16 };
  if (d.y === 0) return { tx: Math.round(cx) * 16 + 8, ty: 2 * 16 + 8 };
  return { tx: Math.round(cx) * 16 + 8, ty: (H - 3) * 16 + 8 };
}
/** the desert road's return landing — just inside the port's EAST gate, on the spine */
export const PUERTO_SOL_JUNGLE_RETURN = edgeLanding(puertoSol, 'jungle_1');

export function buildMercadoInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'mercado_int',
    name: 'MERCADO DEL SOL',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf', x: 1, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'cola_fridge', x: 8.4, y: 0.25 },
      // every shop carries an ATM (cash) + a payphone (save) — the user's decree
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      { id: 'mercado_keeper', sprite: 'mercadoKeeper', x: 5, y: 2, facing: 'down', dialogue: 'shop_mercado_greet', shop: 'mercado' },
    ],
    signs: [{ x: 10, y: 1, dialogue: 'sign_mercado_wall' }],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 5, y: 8, w: 2, h: 1, to: 'puerto_sol', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildClinicPsInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  return {
    id: 'clinic_ps_int',
    name: 'CLINICA DEL SOL',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'cot', x: 8, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 8, y: 5.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'plant_pot', x: 1, y: 6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'poster_smile', x: 5, y: 0.55 },
    ],
    npcs: [
      { id: 'doc_puerto', sprite: 'docPuerto', x: 4, y: 4, facing: 'down', dialogue: 'npc_doc_puerto' },
    ],
    signs: [{ x: 2, y: 1, dialogue: 'clinic_ps_wall' }],
    phones: [],
    doors: [
      { x: 5, y: 8, w: 2, h: 1, to: 'puerto_sol', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // 2026-07-02 (the "every clinic is more than one room" decree): the back
      // OBSERVATION WARD through a real door in the wall band. The ward's return
      // landing is re-aimed by the maps.ts ROOMY pass (this room grows to 16×11).
      { x: 9, y: 2, w: 2, h: 1, to: 'clinic_ps_ward', tx: 88, ty: 108, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** CLINICA DEL SOL — the back ward: whoever the jungle path sent over today */
export function buildClinicPsWard(): MapDef {
  const g = new Grid(10, 8, 'w');
  g.rect(0, 0, 10, 2, 'W');
  return {
    id: 'clinic_ps_ward',
    name: 'CLINICA — OBSERVACIÓN',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'cot', x: 1, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 4, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 7, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'plant_pot', x: 8, y: 5.4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'poster_smile', x: 4, y: 0.55 },
    ],
    npcs: [
      { id: 'cw_ps_patient', sprite: 'dockworker', x: 2, y: 4, facing: 'up', dialogue: 'npc_cw_ps_patient', idle: true },
      { id: 'cw_ps_kid', sprite: 'pigeonKid', x: 5, y: 4, facing: 'up', dialogue: 'npc_cw_ps_kid', idle: true, emote: 'happy' },
    ],
    signs: [
      { x: 2, y: 1, dialogue: 'cw_ps_chart' },
      { x: 8, y: 1, dialogue: 'cw_ps_quiet' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'clinic_ps_int', tx: 168, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

export function buildDeliInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  return {
    id: 'deli_int',
    name: 'DELI SOL',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf_b', x: 9, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'cola_fridge', x: 1.4, y: 0.25 },
      { sprite: 'picnic', x: 7, y: 5.6, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    ],
    npcs: [
      { id: 'deli_keeper', sprite: 'deliKeeper', x: 4, y: 2, facing: 'down', dialogue: 'npc_deli' },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'deli_wall' }],
    phones: [],
    doors: [
      { x: 5, y: 8, w: 2, h: 1, to: 'puerto_sol', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE MUSEUM OF ALMOST-GOLD (§A10 #6's venue) — four fakes, one skeptic */
export function buildMuseumInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(5, 4, 6, 3, 'r'); // the gallery runner
  return {
    id: 'museum_int',
    name: 'MUSEO DEL CASI-ORO',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'pedestal_0', x: 2, y: 2.2, solid: { ox: 3, oy: 18, w: 16, h: 10 } },
      { sprite: 'pedestal_1', x: 12.6, y: 2.2, solid: { ox: 3, oy: 18, w: 16, h: 10 } },
      { sprite: 'pedestal_2', x: 2, y: 6.4, solid: { ox: 3, oy: 18, w: 16, h: 10 } },
      { sprite: 'pedestal_3', x: 12.6, y: 6.4, solid: { ox: 3, oy: 18, w: 16, h: 10 } },
      { sprite: 'counter', x: 7, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'plant_pot', x: 7.6, y: 8.4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [
      { id: 'curator', sprite: 'curator', x: 8, y: 3, facing: 'down', dialogue: 'npc_curator' },
    ],
    signs: [
      { x: 2, y: 3, dialogue: 'museum_idol_1' },
      { x: 13, y: 3, dialogue: 'museum_idol_2' },
      { x: 2, y: 7, dialogue: 'museum_idol_3' },
      { x: 13, y: 7, dialogue: 'museum_idol_4' },
      { x: 5, y: 1, dialogue: 'museum_wall' },
    ],
    phones: [],
    doors: [
      { x: 7, y: 10, w: 2, h: 1, to: 'puerto_sol', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ============== THE GRAN HOTEL SOL (2026-07-02 — the grand suite) ==============
 * The waterfront's authored mega facade finally opens: a real 1898 grand dame
 * with a working ELEVATOR BANK — the west car to the guest floor (two rooms),
 * the east car express to the penthouse, where Sr. Casi keeps the pyrite nugget
 * he almost traded the harbor for (the Museo del Casi-Oro's older brother, and
 * a Fortune-Arc parable: worth is a strange arithmetic). */

export function buildHotelPsLobby(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(20, 12, 'w');
  g.rect(0, 0, 20, 2, 'W');
  g.rect(8, 4, 4, 7, 'r'); // the grand runner, desk to door
  return {
    id: 'hotel_ps_lobby',
    name: 'GRAN HOTEL SOL',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      // the front desk (west) + the lounge (east)
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'bench', x: 14, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 14, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'floor_lamp', x: 12.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 17.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bookshelf', x: 16, y: 0 }, // the reading nook nobody reads
      { sprite: 'plant_pot', x: 1, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 17, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 13, y: 2.4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [
      { id: 'gh_clerk', sprite: 'senora', x: 4, y: 2, facing: 'down', dialogue: 'npc_gh_clerk' },
      { id: 'gh_bellhop', sprite: 'dockworker', x: 8, y: 6, facing: 'down', dialogue: 'npc_gh_bellhop', emote: 'think' },
      { id: 'gh_lounger', sprite: 'oldTimer', x: 15, y: 6, facing: 'left', dialogue: 'npc_gh_lounger', idle: true },
    ],
    signs: [
      { x: 3, y: 1, dialogue: 'gh_registry' },
      { x: 10, y: 1, dialogue: 'gh_plaque' },
    ],
    phones: [{ x: 2, y: 9 }], // the courtesy phone — a rest before the jungle
    doors: [
      { x: 9, y: 11, w: 2, h: 1, to: 'puerto_sol', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // THE ELEVATOR BANK — west car: the guest floor; east car: the penthouse
      { x: 4, y: 2, w: 2, h: 1, to: 'hotel_ps_hall', tx: 56, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 14, y: 2, w: 2, h: 1, to: 'hotel_ps_pent', tx: 56, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** floor 4 — the guest corridor: two doors that open, several that only exist
 *  on the registry, an ice machine in mourning, and the maid mid-rounds */
export function buildHotelPsHall(): MapDef {
  const g = new Grid(18, 9, 'w');
  g.rect(0, 0, 18, 2, 'W');
  g.rect(2, 4, 14, 2, 'r'); // the corridor runner
  return {
    id: 'hotel_ps_hall',
    name: 'GRAN HOTEL — FLOOR 4',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'floor_lamp', x: 6.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 10.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'plant_pot', x: 16, y: 6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'water_cooler', x: 16, y: 2.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } }, // the "ice machine"
    ],
    npcs: [
      { id: 'gh_maid', sprite: 'fernLady', x: 9, y: 6, facing: 'down', dialogue: 'npc_gh_maid' },
    ],
    signs: [
      { x: 1, y: 1, dialogue: 'gh_hall_sign' },
      { x: 16, y: 1, dialogue: 'gh_ice' },
    ],
    phones: [],
    doors: [
      { x: 2, y: 2, w: 2, h: 1, to: 'hotel_ps_lobby', tx: 88, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 7, y: 2, w: 2, h: 1, to: 'hotel_ps_room_a', tx: 88, ty: 108, facing: 'up', indicator: 'door' },
      { x: 12, y: 2, w: 2, h: 1, to: 'hotel_ps_room_b', tx: 88, ty: 108, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** ROOM 3 — the charm salesman and his two hundred samples */
export function buildHotelPsRoomA(): MapDef {
  const g = new Grid(10, 8, 'w');
  g.rect(0, 0, 10, 2, 'W');
  return {
    id: 'hotel_ps_room_a',
    name: 'ROOM 3',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 6, y: 1.55, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'crate', x: 7, y: 4.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } }, // the sample trunk
      { sprite: 'plant_pot', x: 1, y: 5.4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [
      { id: 'gh_salesman', sprite: 'tomas', x: 4, y: 4, facing: 'down', dialogue: 'npc_gh_salesman', emote: 'happy' },
    ],
    signs: [
      { x: 4, y: 1, dialogue: 'gh_room_a_window' },
      { x: 7, y: 5, dialogue: 'gh_samples' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'hotel_ps_hall', tx: 136, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/** ROOM 4 — the honeymooners who booked Costa Estrella */
export function buildHotelPsRoomB(): MapDef {
  const g = new Grid(10, 8, 'w');
  g.rect(0, 0, 10, 2, 'W');
  return {
    id: 'hotel_ps_room_b',
    name: 'ROOM 4',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'bed', x: 6, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'tv', x: 3.6, y: 0.6 },
      { sprite: 'crate', x: 8, y: 4.9, solid: { ox: 1, oy: 8, w: 18, h: 9 } }, // one of seven suitcases
    ],
    npcs: [
      { id: 'gh_honeymoon', sprite: 'wokeB', x: 4, y: 5, facing: 'down', dialogue: 'npc_gh_honeymoon' },
    ],
    signs: [
      { x: 2, y: 1, dialogue: 'gh_room_b_view' },
      { x: 8, y: 6, dialogue: 'gh_room_b_luggage' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'hotel_ps_hall', tx: 216, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/** THE PENTHOUSE — Sr. Casi, the nugget, and the harbor he never traded */
export function buildHotelPsPent(): MapDef {
  const g = new Grid(16, 10, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(3, 4, 10, 4, 'r'); // the grand carpet
  return {
    id: 'hotel_ps_pent',
    name: 'THE PENTHOUSE',
    music: 'puerto',
    interior: true,
    grid: g.out(),
    props: [
      // the pyrite nugget, displayed like the museum wishes it could
      { sprite: 'pedestal_0', x: 7, y: 2.2, solid: { ox: 3, oy: 18, w: 16, h: 10 } },
      { sprite: 'bookshelf', x: 2, y: 0 },
      { sprite: 'bookshelf', x: 4, y: 0 },
      { sprite: 'bed', x: 13, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'floor_lamp', x: 5.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 10.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'plant_pot', x: 1, y: 6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 14, y: 6.4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [
      { id: 'gh_dorado', sprite: 'oldTimer', x: 9, y: 5, facing: 'down', dialogue: 'npc_gh_dorado', emote: 'think' },
    ],
    signs: [
      { x: 7, y: 3, dialogue: 'gh_pyrite' },
      { x: 12, y: 1, dialogue: 'gh_pent_window' },
    ],
    phones: [],
    doors: [
      { x: 2, y: 2, w: 2, h: 1, to: 'hotel_ps_lobby', tx: 248, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ================= Ch.1 retrofits' interiors (Prompt 25) ================= */

/** BRICKTON GENERAL — the ADR-028 landmark-large hospital, finally open */
export function buildHospitalInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(20, 12, 'o');
  g.rect(0, 0, 20, 2, 'O');
  return {
    id: 'hospital_int',
    name: 'TWOTON GENERAL',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'cot', x: 13, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 16, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 13, y: 5.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'water_cooler', x: 1, y: 2.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'plant_pot', x: 18, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // (moved off x:9 — the elevator bank's doors now hang there in the wall band)
      { sprite: 'poster_chart', x: 2, y: 0.55 },
    ],
    npcs: [
      { id: 'doc_brickton', sprite: 'docBrickton', x: 5, y: 2, facing: 'down', dialogue: 'npc_doc_brickton' },
    ],
    signs: [
      { x: 3, y: 1, dialogue: 'hospital_wall' },
      { x: 14, y: 1, dialogue: 'hospital_mushroom_note' },
    ],
    phones: [],
    doors: [
      { x: 9, y: 11, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // S22 (ADR-117): stairs up to the WARD floor — the front desk (revive) stays
      // on the ground floor; the patients (and the quiet) live upstairs.
      { x: 17, y: 2, w: 1, h: 1, to: 'hospital_f2', tx: 272, ty: 60, facing: 'down', indicator: 'stairs' },
      // THE ELEVATOR BANK (2026-07-02, the "real hospital" decree): two cars mid-
      // lobby — the WEST car serves the ward, the EAST car runs express to floor 3
      // (records + long-stay). Each lands one row below the destination's own car.
      { x: 9, y: 2, w: 2, h: 1, to: 'hospital_f2', tx: 264, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 11, y: 2, w: 2, h: 1, to: 'hospital_f3', tx: 200, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** BRICKTON GENERAL — floor 2 (S22, ADR-117): the WARD. Rows of cots, a handful
 *  of patients with something to say, a night nurse, and the stairs back down.
 *  No street exit (you leave via the ground-floor lobby) — the multi-floor shape
 *  the user asked every hospital to have. */
export function buildHospitalF2(): MapDef {
  const g = new Grid(20, 12, 'o');
  g.rect(0, 0, 20, 2, 'O');
  return {
    id: 'hospital_f2',
    name: 'TWOTON GENERAL — WARD',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'cot', x: 2, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 5, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 9, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 12, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 2, y: 6.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 5, y: 6.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 9, y: 6.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 12, y: 6.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'water_cooler', x: 18, y: 6.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'plant_pot', x: 15, y: 9, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'poster_chart', x: 6, y: 0.55 },
    ],
    npcs: [
      { id: 'ward_nurse', sprite: 'docBrickton', x: 18, y: 3, facing: 'left', dialogue: 'npc_ward_nurse', idle: true },
      { id: 'ward_patient1', sprite: 'oldTimer', x: 3, y: 4, facing: 'up', dialogue: 'npc_ward_patient1', idle: true, emote: 'sleep' },
      { id: 'ward_patient2', sprite: 'grayCommuter', x: 10, y: 4, facing: 'up', dialogue: 'npc_ward_patient2', idle: true },
      { id: 'ward_patient3', sprite: 'senora', x: 6, y: 8, facing: 'up', dialogue: 'npc_ward_patient3', idle: true, emote: 'think' },
    ],
    signs: [{ x: 3, y: 1, dialogue: 'hospital_f2_sign' }],
    phones: [],
    doors: [
      { x: 17, y: 2, w: 1, h: 1, to: 'hospital_int', tx: 272, ty: 60, facing: 'down', indicator: 'stairs' },
      // the WEST elevator car back down to the lobby (lands beside its bank)
      { x: 15, y: 2, w: 2, h: 1, to: 'hospital_int', tx: 168, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** BRICKTON GENERAL — floor 3 (2026-07-02): RECORDS & LONG-STAY. The quiet top
 *  floor the elevator bank finally reaches — the records room that filed the
 *  whole meteor night (and one cabinet of smiling men's paperwork), two
 *  long-stay cots, a floating nurse, and a phone for the visiting hours. */
export function buildHospitalF3(): MapDef {
  const g = new Grid(20, 12, 'o');
  g.rect(0, 0, 20, 2, 'O');
  return {
    id: 'hospital_f3',
    name: 'TWOTON GENERAL — RECORDS',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      // the records stacks — a paper canyon
      { sprite: 'shelf', x: 2, y: 3, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 5, y: 3, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 2, y: 6, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 5, y: 6, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'desk', x: 8, y: 2.2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      // the long-stay corner — two cots by the east windows
      { sprite: 'cot', x: 15, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 15, y: 6.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'water_cooler', x: 18, y: 2.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'plant_pot', x: 18, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'poster_chart', x: 14, y: 0.55 },
    ],
    npcs: [
      { id: 'hps_records', sprite: 'curator', x: 9, y: 4, facing: 'down', dialogue: 'npc_hps_records' },
      { id: 'hps_longstay', sprite: 'quarterMan', x: 16, y: 4, facing: 'up', dialogue: 'npc_hps_longstay', idle: true, emote: 'think' },
      { id: 'hps_float', sprite: 'docBrickton', x: 13, y: 8, facing: 'down', dialogue: 'npc_hps_float' },
    ],
    signs: [
      { x: 3, y: 1, dialogue: 'hps_f3_sign' },
      { x: 3, y: 4, dialogue: 'hps_records_sign' },
    ],
    phones: [{ x: 18, y: 10 }],
    doors: [
      // the EAST express car back down to the lobby (lands beside its bank)
      { x: 11, y: 2, w: 2, h: 1, to: 'hospital_int', tx: 200, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** the Otterbrook chapel (Prompt 25) — pews, candles, the warm priest */
export function buildChapelInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(11, 11, 'w');
  g.rect(0, 0, 11, 2, 'W');
  g.rect(4, 4, 3, 4, 'r'); // the aisle runner
  return {
    id: 'chapel_int',
    name: 'OTTERBROOK CHAPEL',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 4, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } }, // the altar table
      { sprite: 'floor_lamp', x: 2.5, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 7.5, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bench', x: 1, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 1, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [
      { id: 'priest_otter', sprite: 'priestOtter', x: 5, y: 3, facing: 'down', dialogue: 'npc_priest_otter' },
    ],
    signs: [{ x: 8, y: 1, dialogue: 'chapel_wall' }],
    phones: [],
    doors: [
      { x: 4, y: 10, w: 3, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ================= THE JUNGLE PATH (2 screens + the grotto) ================= */

/** `psReturn` is where the west door drops you back on PUERTO SOL — the lane just
 *  inside the grown port's relocated jungle gate (the doorstepOf analog, ADR-057).
 *  Defaults to the grown landing; the frozen core's old spot is gone with the gate. */
/* ================= LAS DUNAS — the DUSTY DUNES crossing (2026-07-08) ================= */
// buildJungle1/buildJungle2 are RETIRED — the desert legs are the editor-authored
// documents (src/data/maps_dunas.ts ⇄ tools/mapeditor/jungle_1.json + jungle_2.json);
// the internal ids stay jungle_1/jungle_2 for save-compat, the display names read
// LAS DUNAS DESERT / DEEP DUNAS. Corridor landings are cross-aimed in the Valle
// Dorado block below; the grotto keeps its baked landing (grotto is unchanged).
/** the optional grotto — a chest run (the S9b gift-box pattern, three deep) */
export function buildGrotto(): MapDef {
  const g = new Grid(14, 11, 'Y');
  g.rect(0, 0, 14, 2, 'Z');
  g.rect(0, 0, 1, 11, 'Z');
  g.rect(13, 0, 1, 11, 'Z');
  g.rect(0, 10, 14, 1, 'Z');
  g.rect(5, 10, 3, 1, 'Y'); // the mouth
  g.rect(4, 4, 2, 3, 'Z'); // a column the dark hides behind
  g.set(9, 6, 'G');
  return {
    id: 'grotto',
    name: 'JUNGLE GROTTO',
    music: 'pyramid',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'gift_box', x: 2, y: 2.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'grotto_chest_1' },
      { sprite: 'gift_box_open', x: 2, y: 2.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'grotto_chest_1' },
      { sprite: 'gift_box', x: 11, y: 2.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'grotto_chest_2' },
      { sprite: 'gift_box_open', x: 11, y: 2.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'grotto_chest_2' },
      { sprite: 'gift_box', x: 7, y: 5.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'grotto_chest_3' },
      { sprite: 'gift_box_open', x: 7, y: 5.4, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'grotto_chest_3' },
    ],
    npcs: [],
    signs: [
      { x: 2, y: 3, dialogue: 'grotto_chest_1', unlessFlag: 'grotto_chest_1' },
      { x: 11, y: 3, dialogue: 'grotto_chest_2', unlessFlag: 'grotto_chest_2' },
      { x: 7, y: 6, dialogue: 'grotto_chest_3', unlessFlag: 'grotto_chest_3' },
      { x: 9, y: 6, dialogue: 'grotto_glyph' },
    ],
    phones: [],
    doors: [{ x: 5, y: 10, w: 3, h: 1, to: 'jungle_2', tx: 192, ty: 40, facing: 'down', indicator: 'mat' }],
    spawners: [{ enemies: ['cursed_souvenir'], count: 1, rect: { x: 8, y: 7, w: 4, h: 2 } }],
    triggers: [],
  };
}

/* ================= VALLE DORADO (the village, §A6) ================= */

/* ================= VALLE DORADO — the FOURSIDE rebuild (2026-07-08) ================= */

/**
 * Stage 4 is THE BIG GOLDEN CITY now (user directive 2026-07-08): the
 * editor-authored Fourside grammar (src/data/maps_valle_dorado.ts ⇄
 * tools/mapeditor/valle_dorado.json) — diamond boulevards behind a river
 * seawall, the relocated STARFALL SPIRE + the three towers, the clock plaza
 * where THE GOLDEN MINUTE now fires, and the old quarter the city grew around
 * (shrine + pedestals + wishers/woke + the llama pen, flags verbatim).
 * buildValleDorado (the jungle village) is RETIRED; settlement kind
 * 'village' → 'city' in chapters.ts. The graft table carries the named doors
 * the editor cannot express: the three hi-res landmark doors verbatim from the
 * old builder, plus the spire lobby inherited from old Brickton.
 */
const VALLE_NAMED_DOORS: Record<
  string,
  { ox: number; oy: number; w: number; h: number; to: string; tx: number; ty: number }
> = {
  valle_shop: { ox: 72, oy: 56, w: 16, h: 30, to: 'valle_shop_int', tx: 88, ty: 118 },
  valle_clinic: { ox: 36, oy: 56, w: 16, h: 30, to: 'clinic_valle_int', tx: 88, ty: 118 },
  valle_chapel: { ox: 16, oy: 78, w: 16, h: 30, to: 'chapel_valle_int', tx: 88, ty: 134 },
  bldg_colossus_spire: { ox: 104, oy: 510, w: 16, h: 18, to: 'spire_lobby', tx: 152, ty: 156 },
};
function makeValleDorado(): MapDef {
  const m = valleDoradoMap;
  for (const p of m.props) {
    const spec = VALLE_NAMED_DOORS[p.sprite];
    if (spec && !p.door) {
      p.door = { ox: spec.ox, oy: spec.oy, w: spec.w, h: spec.h, to: spec.to, tx: spec.tx, ty: spec.ty };
    }
  }
  return m;
}
/** the LIVE golden city (grafted once at module load — every consumer sees the doors) */
export const valleDorado = makeValleDorado();

// ── the stage-3→4 corridor: cross-aim every door landing off the LIVE documents
// (each door lands 2 tiles inside its RECIPROCAL door's edge — computed, never baked) ──
{
  const aim = (map: MapDef, to: string, landing: { tx: number; ty: number }): void => {
    const d = map.doors.find((dd) => dd.to === to);
    if (d) {
      d.tx = landing.tx;
      d.ty = landing.ty;
    }
  };
  aim(puertoSol, 'jungle_1', edgeLanding(dunasWestMap, 'puerto_sol'));
  aim(dunasWestMap, 'puerto_sol', PUERTO_SOL_JUNGLE_RETURN);
  aim(dunasWestMap, 'jungle_2', edgeLanding(dunasEastMap, 'jungle_1'));
  aim(dunasEastMap, 'jungle_1', edgeLanding(dunasWestMap, 'jungle_2'));
  aim(dunasEastMap, 'valle_dorado', edgeLanding(valleDorado, 'jungle_2'));
  aim(valleDorado, 'jungle_2', edgeLanding(dunasEastMap, 'valle_dorado'));
}
/** rotor geometry shared by builder, scene, and tests */
export const PYR_ROTOR = { x: 4, y: 4, size: 7 } as const;
/** authored initial rotations per room (presses add to these, % 4) */
export const PYR_INITIAL_ROT: Record<string, number> = {
  pyramid_1: 0,
  pyramid_2: 2,
  pyramid_3: 3,
  // room 4 is entered from the WEST. At rotation 1 the channel is the full
  // vertical bar (N↔S already open), so the west door could only feed an
  // ISOLATED entry alcove — you spawned boxed in a 9-tile pocket with nothing
  // to do but the switch (the "can't move on entry" soft-lock report). Start it
  // at rotation 2 instead (⊤, north arm closed): the west door now opens
  // straight into the roomy south lobby (45 tiles), and ONE press bridges up to
  // the apex. Roomy landing + a single productive press, no sealed box.
  pyramid_4: 2,
};

/**
 * Rotate a square sub-grid clockwise `turns` times — the §A6 rotation as a
 * deterministic permutation (the carveHoldingRoom pattern: build-time, on a
 * copy, never the shared MapDef).
 */
export function rotateRect(grid: string[], x: number, y: number, size: number, turns: number): string[] {
  const rows = grid.map((r) => r.split(''));
  let block: string[][] = [];
  for (let j = 0; j < size; j++) block.push(rows[y + j].slice(x, x + size));
  for (let t = 0; t < ((turns % 4) + 4) % 4; t++) {
    const next: string[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => 'Y'));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) next[c][size - 1 - r] = block[r][c];
    }
    block = next;
  }
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) rows[y + j][x + i] = block[j][i];
  }
  return rows.map((r) => r.join(''));
}

/** the T-channel rotor at rotation 0: arms N, E, W (S is the missing arm) */
const ROTOR_T = ['ZZZgZZZ', 'ZZZgZZZ', 'ZZZgZZZ', 'ggggggg', 'ZZZZZZZ', 'ZZZZZZZ', 'ZZZZZZZ'];

/**
 * One pyramid chamber: 15×14, the 7×7 rotor wall-to-wall across the middle
 * (side walls flank it, so the ONLY way across is through the channel),
 * lobbies north and south, the mask switch in the entry lobby. `exit` puts
 * the far door north or east (room 3 turns the chain).
 */
function buildPyramidRoom(
  id: string,
  exit: 'north' | 'east',
  doors: MapDef['doors'],
  glyphAt: [number, number],
  spawn?: MapDef['spawners'][number],
): MapDef {
  const g = new Grid(15, 14, 'Y');
  g.rect(0, 0, 15, 1, 'Z');
  g.rect(0, 13, 15, 1, 'Z');
  g.rect(0, 0, 1, 14, 'Z');
  g.rect(14, 0, 1, 14, 'Z');
  // the rotor band: walls flank the mechanism wall-to-wall
  g.rect(1, 4, 3, 7, 'Z');
  g.rect(11, 4, 3, 7, 'Z');
  // stamp the rotor's T at rotation 0 — the scene applies the LIVE rotation
  // at build time via rotateRect (initial + mask presses, % 4)
  for (let j = 0; j < PYR_ROTOR.size; j++) {
    for (let i = 0; i < PYR_ROTOR.size; i++) {
      g.set(PYR_ROTOR.x + i, PYR_ROTOR.y + j, ROTOR_T[j][i]);
    }
  }
  // doorway gaps
  g.rect(6, 13, 3, 1, 'Y'); // south (entry)
  if (exit === 'north') g.rect(6, 0, 3, 1, 'Y');
  else {
    // an EAST exit: the door + a carved channel through the flank wall at
    // the rotor's side-mouth row — reachable ONLY through the channel
    g.rect(14, 5, 1, 3, 'Y');
    g.rect(11, 7, 3, 1, 'Y');
  }
  if (id === 'pyramid_4') {
    // room 4 is entered from the WEST (room 3 exits east): door + a short
    // alcove through the west flank that holds the mask. With the room's
    // initial rotation now 2 (PYR_INITIAL_ROT, ⊤), the rotor bar (row 7) is
    // open the moment you arrive, so this alcove reads straight through into
    // the roomy south lobby — you land able to move, not boxed in. One press
    // (→ rot 3) then bridges the channel up to the apex door.
    g.rect(0, 5, 1, 3, 'Y');
    g.rect(1, 6, 3, 2, 'Y');
    g.rect(6, 13, 3, 1, 'Z'); // no south door here
  }
  g.set(glyphAt[0], glyphAt[1], 'G');
  const west = id === 'pyramid_4';
  return {
    id,
    name: 'THE STEP-PYRAMID',
    music: 'pyramid',
    interior: true,
    grid: g.out(),
    props: [
      // the mask switch lives in the entry lobby (room 4: the west alcove) —
      // interacting turns the floor a quarter clockwise (the §A6 rotation).
      // West: sit it INSIDE the alcove floor (rows 6-7), not up in the flank
      // wall — props anchor top-left, so a y in the wall drew the mask buried
      // above the alcove and it read as unreachable (the soft-lock report).
      { sprite: 'mask_switch', x: 2, y: west ? 6.2 : 11, solid: { ox: 4, oy: 12, w: 10, h: 8 } },
    ],
    npcs: [],
    signs: [
      { x: 2, y: west ? 6 : 12, dialogue: `pyr_mask_${id.slice(-1)}` },
    ],
    phones: [],
    doors,
    spawners: spawn ? [spawn] : [],
    triggers: [],
  };
}

export function buildPyramidAnte(): MapDef {
  const g = new Grid(21, 16, '.');
  g.sprinkle(34, ',~', 0.06);
  g.rect(9, 1, 3, 15, ':');
  g.rect(0, 0, 21, 1, 'J');
  g.rect(0, 1, 1, 15, 'J');
  g.rect(20, 1, 1, 15, 'J');
  return {
    id: 'pyramid_ante',
    name: 'PYRAMID APPROACH',
    music: 'pyramid',
    grid: g.out(),
    props: [
      // the gate face fills the north — its mouth is the way in
      { sprite: 'pyramid_gate', x: 7.5, y: 1.4, solid: { ox: 0, oy: 38, w: 96, h: 30 }, door: { ox: 38, oy: 62, w: 20, h: 16, to: 'pyramid_1', tx: 120, ty: 196 } },
      // §A4.5: the antechamber table — the strategy beat before the climb
      { sprite: 'picnic', x: 3, y: 11.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'sign', x: 14, y: 10, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'phone_table', x: 16, y: 12, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      // S17 M18 Part B (ADR-063): a Fool's-Gold Idol tossed by the gate ramp
      // (sell-fodder valuable, the joke at the Gilded Ruins' door); open '.' east
      ...giftBox('gift_fools_idol', 16, 4).props,
    ],
    npcs: [],
    signs: [
      { x: 14, y: 11, dialogue: 'sign_pyramid' },
      ...giftBox('gift_fools_idol', 16, 4).signs,
    ],
    phones: [{ x: 16, y: 12 }],
    // Fourside rebuild 2026-07-08: land just inside the golden city's SOUTH gate
    // (placeholder px — buildChapter2Maps re-aims this via edgeLanding, ADR-012)
    doors: [{ x: 9, y: 15, w: 3, h: 1, to: 'valle_dorado', tx: 728, ty: 1360, facing: 'down' }],
    spawners: [
      { enemies: ['step_mask', 'gilded_beetle', 'bronze_mask_guardian'], count: 2, rect: { x: 3, y: 5, w: 6, h: 5 } },
    ],
    triggers: [
      { id: 'pyramid_approach', rect: { x: 8, y: 12, w: 5, h: 2 }, once: true },
    ],
  };
}

export function buildPyramidRooms(): MapDef[] {
  return [
    buildPyramidRoom(
      'pyramid_1',
      'north',
      [
        { x: 6, y: 13, w: 3, h: 1, to: 'pyramid_ante', tx: 168, ty: 80, facing: 'down', indicator: 'mat' },
        { x: 6, y: 0, w: 3, h: 1, to: 'pyramid_2', tx: 120, ty: 196, facing: 'up', indicator: 'door' },
      ],
      [2, 4],
      { enemies: ['step_mask'], count: 1, rect: { x: 5, y: 1, w: 5, h: 2 } },
    ),
    buildPyramidRoom(
      'pyramid_2',
      'north',
      [
        { x: 6, y: 13, w: 3, h: 1, to: 'pyramid_1', tx: 120, ty: 28, facing: 'down', indicator: 'mat' },
        { x: 6, y: 0, w: 3, h: 1, to: 'pyramid_3', tx: 120, ty: 196, facing: 'up', indicator: 'door' },
      ],
      [12, 9],
      { enemies: ['cursed_souvenir', 'step_mask', 'cackling_mask'], count: 2, rect: { x: 4, y: 1, w: 7, h: 2 } },
    ),
    buildPyramidRoom(
      'pyramid_3',
      'east',
      [
        { x: 6, y: 13, w: 3, h: 1, to: 'pyramid_2', tx: 120, ty: 28, facing: 'down', indicator: 'mat' },
        { x: 14, y: 5, w: 1, h: 3, to: 'pyramid_4', tx: 28, ty: 104, facing: 'right' },
      ],
      [2, 2],
      { enemies: ['jungle_jitterbug'], count: 1, rect: { x: 9, y: 11, w: 4, h: 2 } },
    ),
    buildPyramidRoom(
      'pyramid_4',
      'north',
      [
        // back to room 3's east channel — land on the carved channel floor
        // (13,7), NOT (13,6) which is the flank WALL (ty 104 spawned you inside
        // a solid tile; the safety-net then had to fish you out — fixed here).
        { x: 0, y: 5, w: 1, h: 3, to: 'pyramid_3', tx: 208, ty: 120, facing: 'left' },
        { x: 6, y: 0, w: 3, h: 1, to: 'pyramid_apex', tx: 144, ty: 180, facing: 'up', indicator: 'door' },
      ],
      [12, 2],
      { enemies: ['step_mask', 'gilded_beetle'], count: 2, rect: { x: 9, y: 9, w: 4, h: 3 } },
    ),
  ];
}

/** the apex — the Resonance Site, and the thing that grins on it (§A6) */
export function buildPyramidApex(): MapDef {
  const g = new Grid(19, 13, 'Y');
  g.rect(0, 0, 19, 1, 'Z');
  g.rect(0, 12, 19, 1, 'Z');
  g.rect(0, 0, 1, 13, 'Z');
  g.rect(18, 0, 1, 13, 'Z');
  g.rect(8, 12, 3, 1, 'Y'); // the way up
  // the dais
  g.rect(7, 3, 5, 3, 'p');
  g.set(5, 4, 'G');
  g.set(13, 4, 'G');
  g.set(9, 7, 'G');
  return {
    id: 'pyramid_apex',
    name: 'PYRAMID APEX',
    music: 'pyramid',
    interior: true,
    grid: g.out(),
    props: [
      // the Idol waits on its dais until the fight takes it off the books
      { sprite: 'idol_shrine', x: 8.2, y: 1.6, solid: { ox: 6, oy: 28, w: 28, h: 14 }, unlessFlag: 'grin_defeated' },
    ],
    npcs: [],
    signs: [
      { x: 9, y: 5, dialogue: 'apex_dais', unlessFlag: 'grin_defeated' },
      { x: 9, y: 5, dialogue: 'apex_dais_after', ifFlag: 'grin_defeated' },
    ],
    phones: [],
    doors: [{ x: 8, y: 12, w: 3, h: 1, to: 'pyramid_4', tx: 120, ty: 28, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [
      { id: 'apex_grin', rect: { x: 7, y: 5, w: 5, h: 3 }, once: false },
    ],
  };
}

/* ================= Valle Dorado interiors ================= */

export function buildValleShopInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  return {
    id: 'valle_shop_int',
    name: 'LANA & MAS',
    music: 'valle',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 9, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      // every shop carries an ATM (cash) + a payphone (save) — the user's decree
      { sprite: 'payphone', x: 2, y: 6, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 9, y: 6, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      { id: 'valle_keeper', sprite: 'senora', x: 5, y: 2, facing: 'down', dialogue: 'shop_valle_greet', shop: 'valle_shop' },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_valle_wall' }],
    phones: [{ x: 2, y: 6 }],
    atms: [{ x: 9, y: 6 }],
    doors: [
      { x: 5, y: 8, w: 2, h: 1, to: 'valle_dorado', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

export function buildClinicValleInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(11, 9, 'w');
  g.rect(0, 0, 11, 2, 'W');
  return {
    id: 'clinic_valle_int',
    name: 'CLINICA VALLE',
    music: 'valle',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'cot', x: 7, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 7, y: 5.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'plant_pot', x: 1, y: 6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [
      { id: 'doc_valle', sprite: 'docValle', x: 4, y: 4, facing: 'down', dialogue: 'npc_doc_valle' },
    ],
    signs: [{ x: 2, y: 1, dialogue: 'clinic_valle_wall' }],
    phones: [],
    doors: [
      { x: 4, y: 8, w: 2, h: 1, to: 'valle_dorado', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // 2026-07-02: the back REPOSO ward (see clinic_ps_int — the same decree;
      // the ward's return landing is re-aimed by the maps.ts ROOMY pass)
      { x: 8, y: 2, w: 2, h: 1, to: 'clinic_valle_ward', tx: 88, ty: 108, facing: 'up', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** CLINICA VALLE — the back ward: rest, soup, and a window that faces the
 *  pyramid (curtain closed, doctor's orders) */
export function buildClinicValleWard(): MapDef {
  const g = new Grid(10, 8, 'w');
  g.rect(0, 0, 10, 2, 'W');
  return {
    id: 'clinic_valle_ward',
    name: 'CLINICA — REPOSO',
    music: 'valle',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'cot', x: 1, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 6, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'plant_pot', x: 8, y: 5.4, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [
      { id: 'cw_valle_patient', sprite: 'senora', x: 2, y: 4, facing: 'up', dialogue: 'npc_cw_valle_patient', idle: true, emote: 'think' },
    ],
    signs: [
      { x: 2, y: 1, dialogue: 'cw_valle_chart' },
      { x: 6, y: 1, dialogue: 'cw_valle_window' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'clinic_valle_int', tx: 152, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

export function buildChapelValleInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(11, 11, 'w');
  g.rect(0, 0, 11, 2, 'W');
  g.rect(4, 4, 3, 4, 'r');
  return {
    id: 'chapel_valle_int',
    name: 'CAPILLA DEL VALLE',
    music: 'valle',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 4, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'floor_lamp', x: 2.5, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 7.5, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bench', x: 1, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 1, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [
      { id: 'priest_valle', sprite: 'priestValle', x: 5, y: 3, facing: 'down', dialogue: 'npc_priest_valle' },
    ],
    signs: [{ x: 8, y: 1, dialogue: 'chapel_valle_wall' }],
    phones: [],
    doors: [
      { x: 4, y: 10, w: 3, h: 1, to: 'valle_dorado', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ================= assembly (maps.ts spreads this) ================= */

export function buildChapter2Maps(steps: {
  /** the Otterbrook chapel's street doorstep (derived in maps.ts, ADR-012) */
  chapelStep: { tx: number; ty: number };
  /** Brickton General's jittered doorstep (derived in maps.ts, ADR-012) */
  hospitalStep: { tx: number; ty: number };
}): Record<string, MapDef> {
  // 2026-07-08: the live port + golden city are the EDITOR-AUTHORED documents
  // (grafted + cross-aimed at module load above). The interior doorsteps still
  // derive from the live facade doors (doorstepOf — the computed-coords law).
  const puerto = puertoSol;
  const valle = valleDorado;
  const mercadoStep = doorstepOf(puerto, 'mercado_int') ?? { tx: 96, ty: 130 };
  const clinicStep = doorstepOf(puerto, 'clinic_ps_int') ?? { tx: 224, ty: 130 };
  const deliStep = doorstepOf(puerto, 'deli_int') ?? { tx: 96, ty: 322 };
  const museumStep = doorstepOf(puerto, 'museum_int') ?? { tx: 520, ty: 130 };
  const valleShopStep = doorstepOf(valle, 'valle_shop_int') ?? { tx: 344, ty: 130 };
  const valleClinicStep = doorstepOf(valle, 'clinic_valle_int') ?? { tx: 500, ty: 258 };
  const valleChapelStep = doorstepOf(valle, 'chapel_valle_int') ?? { tx: 154, ty: 430 };
  // 2026-07-02: the GRAN HOTEL's doorstep derives from the door grafted onto the
  // authored mega facade in growPuertoSol (the clinic/mercado doorstepOf pattern)
  const hotelStep = doorstepOf(puerto, 'hotel_ps_lobby') ?? { tx: 1448, ty: 392 };
  const rooms = buildPyramidRooms();
  const ante = buildPyramidAnte();
  {
    // the ante's return lands just inside Valle's SOUTH gate — computed off the
    // live document's door zone like every other stage-3/4 landing (ADR-012)
    const d = ante.doors.find((dd) => dd.to === 'valle_dorado');
    const l = edgeLanding(valleDorado, 'pyramid_ante');
    if (d) {
      d.tx = l.tx;
      d.ty = l.ty;
    }
  }
  return {
    brickton_docks: buildBricktonDocks(),
    boat_interior: buildBoatInterior(),
    hospital_int: buildHospitalInt(steps.hospitalStep),
    hospital_f2: buildHospitalF2(),
    hospital_f3: buildHospitalF3(),
    chapel_int: buildChapelInt(steps.chapelStep),
    puerto_sol: puerto,
    mercado_int: buildMercadoInt(mercadoStep),
    clinic_ps_int: buildClinicPsInt(clinicStep),
    clinic_ps_ward: buildClinicPsWard(),
    deli_int: buildDeliInt(deliStep),
    museum_int: buildMuseumInt(museumStep),
    hotel_ps_lobby: buildHotelPsLobby(hotelStep),
    hotel_ps_hall: buildHotelPsHall(),
    hotel_ps_room_a: buildHotelPsRoomA(),
    hotel_ps_room_b: buildHotelPsRoomB(),
    hotel_ps_pent: buildHotelPsPent(),
    jungle_1: dunasWestMap,
    jungle_2: dunasEastMap,
    grotto: buildGrotto(),
    valle_dorado: valle,
    valle_shop_int: buildValleShopInt(valleShopStep),
    clinic_valle_int: buildClinicValleInt(valleClinicStep),
    clinic_valle_ward: buildClinicValleWard(),
    chapel_valle_int: buildChapelValleInt(valleChapelStep),
    pyramid_ante: ante,
    pyramid_1: rooms[0],
    pyramid_2: rooms[1],
    pyramid_3: rooms[2],
    pyramid_4: rooms[3],
    pyramid_apex: buildPyramidApex(),
  };
}
