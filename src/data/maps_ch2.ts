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
 *   1 → 1 → 2 → 2 (rooms start at rotations 0/2/3/1; room 3 exits EAST).
 */
import { Grid, seededRng, treeSprite, doorstepOf } from './mapkit';
import { cityBuildingHeight } from '../spritegen/tiles';
// S15i Task 4 (ADR-057) — PUERTO SOL grows: the forge lays the new DOCK DISTRICT
// as buildDistrict + placeNook stitched onto the frozen 1898 core (the bones);
// the soul (NPCs, the cutscene, the present) stays hand-authored.
import { buildDistrict, placeNook, Streams } from '../levelkit';
import { AREA_SKINS } from '../spritegen/buildings';
import type { MapDef, NpcDef, PropDef, SignDef } from '../schemas';

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
    name: 'BRICKTON DOCKS',
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
    ],
    npcs: [
      { id: 'captain', sprite: 'captain', x: 21, y: 9, facing: 'down', dialogue: 'npc_captain' },
      { id: 'dock_kid', sprite: 'pigeonKid', x: 7, y: 11, facing: 'right', dialogue: 'npc_dock_kid', wander: true },
      // the Ch.3 tease (zero map yet): Uncle Bert turns up once the Grin falls
      { id: 'uncle_bert', sprite: 'uncleBert', x: 13, y: 5, facing: 'down', dialogue: 'npc_uncle_bert', ifFlag: 'ch2_complete' },
    ],
    signs: [{ x: 9, y: 5, dialogue: 'sign_departures' }],
    phones: [{ x: 4, y: 4 }],
    doors: [
      // back through the gap onto Brickton's street B
      { x: 0, y: 6, w: 1, h: 3, to: 'brickton', tx: 856, ty: 360, facing: 'left' },
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
export const PUERTO_SOL_PIER_SPAWN = { x: 416, y: 484 } as const;
/** the north gate up the cliff road — COSTA_DOOR_FOR_PUERTO_SOL aims here */
export const PUERTO_SOL_NORTH_GATE = { tx: 104, ty: 30 } as const;

export function buildPuertoSol(): MapDef {
  const rng = seededRng(1898);
  const jit = (n: number): number => Math.floor(rng() * n);

  const g = new Grid(52, 34, '=');
  // bounds: cliffs north (brick spine reads as the old sea wall), sea south
  g.rect(0, 0, 52, 1, 'B');
  g.rect(0, 0, 1, 28, 'B');
  g.rect(51, 0, 1, 28, 'B');
  // the north gate gap — the cliff road to COSTA ESTRELLA (S13's one line)
  g.rect(5, 0, 3, 1, ':');
  // two E-W streets + the avenue that stitches them (ADR-012 minimums)
  g.rect(1, 8, 50, 3, 'R');
  g.rect(1, 20, 50, 3, 'R');
  g.rect(24, 8, 3, 15, 'R');
  // dashed centerlines, phase-shifted, broken at the avenue
  const skipA = new Set([24, 25, 26, 27]);
  for (let x = 1; x < 51; x++) {
    if (x % 4 < 2 && !skipA.has(x)) g.set(x, 9, 'D');
    if ((x + 2) % 4 < 2 && !skipA.has(x)) g.set(x, 21, 'D');
  }
  g.rect(16, 8, 2, 3, 'X');
  g.rect(33, 20, 2, 3, 'X');
  // THE PLAZA — pavers around the fountain, corners nibbled by the seed
  g.rect(30, 12, 16, 7, 'p');
  g.rect(30, 12, 1 + jit(3), 1, '=');
  g.rect(44 - jit(2), 18, 3, 1, '=');
  // the port district: dock band + the surf + open sea
  g.rect(1, 27, 50, 3, 'd');
  g.rect(0, 30, 52, 1, 'E');
  g.rect(0, 31, 52, 3, 'e');
  // the pier pushes south into the water
  g.rect(23, 30, 6, 3, 'd');
  // market lane fuzz west of the avenue
  g.sprinkle(1898, ',~f', 0.05);

  /* ---- buildings: north faces of both streets (two block faces) ---- */
  interface Bldg {
    sprite: string;
    w: number;
    u: 1 | 2 | 3;
    x: number;
  }
  const north: Bldg[] = [
    { sprite: 'bldg_ps_mercado', w: 5, u: 1, x: 2 + jit(2) },
    { sprite: 'bldg_ps_clinic', w: 5, u: 1, x: 10 + jit(2) },
    { sprite: 'bldg_ps_pension', w: 5, u: 2, x: 18 + jit(2) },
    { sprite: 'bldg_ps_museum', w: 6, u: 2, x: 29 + jit(2) },
    { sprite: 'bldg_ps_casa', w: 4, u: 2, x: 39 + jit(2) },
    { sprite: 'bldg_ps_casa_b', w: 4, u: 1, x: 46 - jit(2) },
  ];
  for (let i = 1; i < north.length; i++) {
    const min = north[i - 1].x + north[i - 1].w + 1;
    if (north[i].x < min) north[i].x = min;
  }
  const south: Bldg[] = [
    { sprite: 'bldg_ps_deli', w: 4, u: 1, x: 4 + jit(3) },
    { sprite: 'bldg_ps_cantina', w: 5, u: 1, x: 12 + jit(2) },
    { sprite: 'bldg_ps_casa_c', w: 4, u: 1, x: 34 + jit(3) },
    { sprite: 'bldg_ps_pension_b', w: 5, u: 2, x: 42 + jit(2) },
  ];
  for (let i = 1; i < south.length; i++) {
    const min = south[i - 1].x + south[i - 1].w + 1;
    if (south[i].x < min) south[i].x = min;
  }
  const bldgProps: PropDef[] = [];
  const place = (b: Bldg, bottomPx: number): PropDef => {
    const H = cityBuildingHeight(b.u);
    const prop: PropDef = {
      sprite: b.sprite,
      x: b.x,
      y: (bottomPx - H) / 16,
      // solid covers the FACADE to the doorstep — oy:10 (was 26) so a hero can't
      // walk straight ACROSS the upper floors (the walk-through-buildings bug);
      // bottom stays H-12 so the door zone is reachable (matches brickton).
      solid: { ox: 0, oy: 10, w: b.w * 16 + 2, h: H - 22 },
    };
    if (b.sprite === 'bldg_ps_mercado') {
      prop.door = { ox: 33, oy: H - 14, w: 16, h: 18, to: 'mercado_int', tx: 96, ty: 118 };
    }
    if (b.sprite === 'bldg_ps_clinic') {
      prop.door = { ox: 33, oy: H - 14, w: 16, h: 18, to: 'clinic_ps_int', tx: 88, ty: 118 };
    }
    if (b.sprite === 'bldg_ps_museum') {
      prop.door = { ox: 33, oy: H - 14, w: 26, h: 18, to: 'museum_int', tx: 120, ty: 150 };
    }
    if (b.sprite === 'bldg_ps_deli') {
      prop.door = { ox: 17, oy: H - 14, w: 16, h: 18, to: 'deli_int', tx: 88, ty: 118 };
    }
    bldgProps.push(prop);
    return prop;
  };
  north.forEach((b) => place(b, 128)); // faces street A
  south.forEach((b) => place(b, 320)); // faces street B

  /* ---- street life off the SAME stream, in order ---- */
  const stalls: PropDef[] = [];
  const stallRamps = [4, 7, 11]; // RED, GOLD, CYAN ramp indices vary per stall
  for (let i = 0; i < 3; i++) {
    stalls.push({
      sprite: `market_stall_${['a', 'b', 'c'][i]}`,
      x: 31 + i * 5 + jit(2),
      y: 23.4,
      solid: { ox: 1, oy: 14, w: 38, h: 14 },
    });
  }
  void stallRamps;
  const palms: Array<[number, number]> = [];
  for (const [tx, ty] of [
    [3, 12],
    [9, 14],
    [20, 13],
    [47, 12],
    [3, 24],
    [20, 24],
    [48, 24],
    [38, 11],
  ] as const) {
    if (rng() < 0.8) palms.push([tx, ty]);
  }

  return {
    id: 'puerto_sol',
    name: 'PUERTO SOL',
    music: 'puerto',
    settlement: 'city',
    grid: g.out(),
    props: [
      ...palms.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      ...bldgProps,
      ...stalls,
      { sprite: 'fountain', x: 36, y: 13.4, solid: { ox: 3, oy: 22, w: 34, h: 14 } },
      // the pier: the boat home + its board
      { sprite: 'banana_boat', x: 21, y: 29.2, solid: { ox: 4, oy: 22, w: 120, h: 20 } },
      { sprite: 'gangplank', x: 25.2, y: 28.4 },
      { sprite: 'departure_board', x: 30, y: 25.4, solid: { ox: 2, oy: 20, w: 22, h: 8 } },
      { sprite: 'crate_bananas', x: 4, y: 27.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'crate', x: 6.4, y: 28.1, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'payphone', x: 28, y: 24, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      // §A4.5: the plaza picnic table (one of Ch.2's three, before the jungle)
      { sprite: 'picnic', x: 42, y: 14.6, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'bench', x: 33, y: 17, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'trash_can', x: 2, y: 12, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
    ],
    npcs: [
      { id: 'ps_fisher', sprite: 'dockworker', x: 10, y: 25, facing: 'down', dialogue: 'npc_ps_fisher', wander: true },
      { id: 'ps_nina', sprite: 'wokeB', x: 38, y: 16, facing: 'down', dialogue: 'npc_ps_nina', wander: true },
      { id: 'ps_stallman', sprite: 'tomas', x: 33, y: 25, facing: 'down', dialogue: 'npc_ps_stall', unlessFlag: 'q_llama' },
      { id: 'ps_porter', sprite: 'captain', x: 18, y: 12, facing: 'down', dialogue: 'npc_ps_porter', wander: true },
    ],
    signs: [
      { x: 6, y: 1, dialogue: 'sign_costa_road' },
      { x: 30, y: 26, dialogue: 'sign_departures_home' },
      { x: 37, y: 18, dialogue: 'sign_plaza' },
      { x: 49, y: 21, dialogue: 'sign_jungle_gate' },
    ],
    phones: [{ x: 28, y: 24 }],
    doors: [
      // the cliff road north — COSTA ESTRELLA LINKS (the S13 one-line wire)
      { x: 5, y: 0, w: 3, h: 1, to: 'costa_estrella', tx: 216, ty: 232, facing: 'up' },
      // east gate into the jungle
      { x: 51, y: 20, w: 1, h: 3, to: 'jungle_1', tx: 24, ty: 264, facing: 'right' },
    ],
    spawners: [],
    triggers: [
      // the pier gangplank: ride the boat home (zero missables)
      { id: 'board_boat_return', rect: { x: 25, y: 28, w: 2, h: 2 }, once: false },
      // first step off the boat: the §A11 arrival beat
      { id: 'puerto_arrival', rect: { x: 23, y: 26, w: 6, h: 2 }, once: true },
    ],
  };
}

/* ------------- PUERTO SOL GROWS — THE DOCK DISTRICT (S15i Task 4, ADR-057) ------------- *
 * The user's scale decree, the World-Block law's fourth application: the §A5 port
 * should feel like a working CITY, not one plaza. The frozen 1898 core is COPIED
 * byte-for-byte into the top-left of a 128×44 grid (≈3.2×); every growth write lands
 * strictly OUTSIDE the 52×34 core (x≥52 || y≥34), so not one core cell can move.
 *
 * THE GOTCHA (why this isn't a Brickton clone): the core is WALLED north/east/west
 * with only the SOUTH (dock/sea) open — you cannot grow east through the frozen wall.
 * So the new region wraps the core's SOUTHEAST, joined to it through the dock band's
 * eastern seam (col 51 rows 28-29 = walkable '='). And because cityViolations counts
 * a "street" row as one exceeding 40% of the GROWN width (~50 cells at W=128), the
 * core's ~50-cell streets STOP COUNTING — so the grown city's ADR-012 sweep is carried
 * by NEW full-region streets in the dock district (the core's facades still feed
 * faceBands at bands 2 & 5). The jungle gate relocates to the new far-east edge.
 */
/** the grown port's east jungle gate row (street 2 center) + width — the jungle's
 *  return door lands just inside it (computed, never a baked jittered coord). */
const PUERTO_SOL_W = 128;
const PUERTO_SOL_EAST_GATE_ROW = 25;
/** where jungle_1's west door drops you back — the lane just inside the new east
 *  gate (W-2, the street-2 row). buildJungle1 reads this (the doorstepOf analog). */
export const PUERTO_SOL_JUNGLE_RETURN = {
  tx: (PUERTO_SOL_W - 2) * 16,
  ty: PUERTO_SOL_EAST_GATE_ROW * 16,
} as const;

const PS_OAK = { ox: 7, oy: 22, w: 12, h: 10 } as const;

export function growPuertoSol(): MapDef {
  const core = buildPuertoSol();
  const CW = core.grid[0].length; // 52
  const CH = core.grid.length; // 34
  const W = PUERTO_SOL_W; // 128
  const H = 44;
  const g = new Grid(W, H, '=');
  // 1) the frozen 1898 core, verbatim, in the top-left
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) g.set(x, y, core.grid[y][x]);

  // 2) the GROWN region's edges (the gotcha: cliff N, wall E, sea S) — only OUTSIDE
  //    the core, so the frozen cells never move.
  g.rect(CW, 0, W - CW, 1, 'B'); // north cliff, east of the core
  g.rect(W - 1, 0, 1, H, 'B'); // new east wall
  g.rect(0, CH, 1, H - CH, 'B'); // west cliff, below the core
  // the colonial-plaza floor the dock district stands on (pavers, not gray walk)
  g.rect(CW, 1, W - CW, 25, 'p');
  // THE MALECÓN — the new waterfront promenade (dock), continuing the core's dock
  // band EAST. THE SEAM: it meets the core dock at col 51→52, rows 28-29.
  g.rect(CW, 26, W - CW, 6, 'd'); // malecón, cols 52-127, rows 26-31
  // THE HARBOR — sea south of the malecón + below the core (the core keeps its own
  // 1898 sea; the new water is cols 52+ rows 32+, and cols 1-51 rows 34+)
  g.rect(CW, 32, W - CW, 1, 'E'); // foam lip along the malecón
  g.rect(CW, 33, W - CW, H - 33, 'e'); // open harbor SE
  g.rect(1, CH, CW - 1, H - CH, 'e'); // harbor below the core (cols 1-51)

  // 3) THE DOCK DISTRICT — TWO wide carrying streets (rows 6 + 24, each >40% of the
  //    grown width so the ADR-012 sweep counts them) joined by an avenue (col 90),
  //    then the forge lays the bones in PUERTO SOL's OWN colonial skins. The wide
  //    grid is NON-mega (its facades back onto the streets, ≤3 tall, never crossing a
  //    lane); the MEGAS rise from a dedicated tall POCKET between the streets — the
  //    cathedral / grand hotel / customs house, tops off-screen (the Brickton
  //    downtownHigh precedent — megas need 14 clear rows, so they get their own band,
  //    common here because the waterfront has the room Brickton's tight core lacked).
  //    ADR-053: ONE shared footprint list across every district + the hand-placed lots.
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  // (B FIRST) the MEGA POCKETS — two grand bands FLANKING the avenue (cols 54-86 west,
  //    96-123 east), so the towers rise on both sides while the avenue (col 90) stays a
  //    clear canyon between them. They claim their tall footprints before the storefront
  //    row pass fills the gaps; backing onto street 2 (row 24), rising clear of street 1
  //    (rows 6-8). Megas are COMMON here — a grand colonial waterfront, not a sparse one.
  const megaWest = buildDistrict(g, { x: 54, y: 9, w: 32, h: 16 }, new Streams(189803), {
    layout: 'grid', style: 'bazaar-port', catalog: AREA_SKINS.puerto_sol,
    streetRows: [24], maxStories: 3, mega: true, occupied,
  });
  const megaEast = buildDistrict(g, { x: 96, y: 9, w: 28, h: 16 }, new Streams(189804), {
    layout: 'grid', style: 'bazaar-port', catalog: AREA_SKINS.puerto_sol,
    streetRows: [24], maxStories: 3, mega: true, occupied,
  });
  // (A) the WIDE storefront grid — carries BOTH streets + the avenue spine (col 90,
  //    rows 1-25, meeting the malecón at row 26 — one line from the streets down to
  //    the waterfront and the seam). NON-mega: low colonial faces + dock warehouses.
  const district = buildDistrict(g, { x: CW, y: 1, w: W - CW - 1, h: 25 }, new Streams(189801), {
    layout: 'grid', style: 'bazaar-port', catalog: AREA_SKINS.puerto_sol,
    streetRows: [6, 24], avenueCols: [90], maxStories: 3, occupied,
  });

  // 4) THE MARKET NOOK (§B4) — a dockside market courtyard on the malecón's west,
  //    its open left/right edges onto the waterfront (a fully-ringed lot would seal
  //    itself; 'courtyard' only hedges top/bottom — the memory gotcha). The hidden
  //    present hides among its stalls.
  const nook = placeNook(g, { x: 54, y: 26, w: 13, h: 5 }, new Streams(189802), 'courtyard');

  // 5) piers fingering into the harbor (scenery off the malecón — the working-port read)
  g.rect(60, 31, 3, 6, 'd');
  g.rect(108, 31, 3, 7, 'd');

  const treesAt = (xy: ReadonlyArray<readonly [number, number]>): PropDef[] =>
    xy.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: PS_OAK }));

  // 6) the present (the S9b gift-box pattern), cached among the market stalls. Trees
  //    are not laid over it; the malecón around it is open dock, so it stays reachable.
  const giftX = 58;
  const giftY = 28;
  const present: PropDef[] = [
    { sprite: 'gift_box', x: giftX, y: giftY, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'ps_dock_gift' },
    { sprite: 'gift_box_open', x: giftX, y: giftY, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'ps_dock_gift' },
  ];

  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  const props: PropDef[] = [
    ...core.props,
    ...megaWest.props,
    ...megaEast.props,
    ...district.props,
    ...nook.props,
    ...present,
    // the relocated DEPARTURE BOARD — the freight/onward schedule, dockside
    { sprite: 'departure_board', x: 82, y: 27.4, solid: { ox: 2, oy: 20, w: 22, h: 8 } },
    // dock clutter — cargo waiting on the quay (off the walking lane)
    { sprite: 'crate_bananas', x: 72, y: 27.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    { sprite: 'crate', x: 74.3, y: 28.1, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    { sprite: 'crate', x: 104, y: 27.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    { sprite: 'crate_bananas', x: 106.3, y: 28.3, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    // the market nook's stalls (open-air, around the present)
    { sprite: 'market_stall_a', x: 56, y: 29, solid: { ox: 1, oy: 14, w: 38, h: 14 } },
    { sprite: 'market_stall_b', x: 62, y: 29, solid: { ox: 1, oy: 14, w: 38, h: 14 } },
    // §A4.5: a dockside picnic rest before the jungle's pressure (the 2nd PS table)
    { sprite: 'picnic', x: 98, y: 28.6, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    { sprite: 'payphone', x: 92, y: 27, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    // signage
    { sprite: 'sign', x: 54, y: 25, solid: SIGN_SOLID }, // the malecón / dock district
    { sprite: 'sign', x: 66, y: 30, solid: SIGN_SOLID }, // the market nook
    { sprite: 'sign', x: 124, y: 23, solid: SIGN_SOLID }, // EAST → the jungle (relocated gate)
    // palms on the new waterfront (isolated on open dock — you walk around them)
    ...treesAt([[68, 30], [88, 30], [120, 30]]),
  ];

  const npcs: NpcDef[] = [
    ...core.npcs,
    // §A11 — one obsession each, all new to the dock district
    { id: 'ps_crane', sprite: 'dockworker', x: 90, y: 25, facing: 'down', dialogue: 'npc_ps_crane', wander: true },
    { id: 'ps_tally', sprite: 'captain', x: 100, y: 25, facing: 'down', dialogue: 'npc_ps_tally' },
    { id: 'ps_board', sprite: 'tomas', x: 84, y: 26, facing: 'down', dialogue: 'npc_ps_board' },
    { id: 'ps_market', sprite: 'mercadoKeeper', x: 60, y: 28, facing: 'down', dialogue: 'npc_ps_market', wander: true },
  ];

  const signs: SignDef[] = [
    ...core.signs,
    { x: 54, y: 25, dialogue: 'sign_ps_malecon' },
    { x: 66, y: 30, dialogue: 'sign_ps_market' },
    { x: 124, y: 23, dialogue: 'sign_ps_jungle_east' },
    // the present: a sign while sealed, a flavor line once opened (gated)
    { x: giftX, y: giftY + 1, dialogue: 'ps_dock_gift', unlessFlag: 'ps_dock_gift' },
    { x: giftX, y: giftY + 1, dialogue: 'ps_dock_gift_done', ifFlag: 'ps_dock_gift' },
  ];

  // the jungle gate RELOCATES to the new far-east edge (the port moved out with the
  // city). Its target (jungle_1's west mouth) is unchanged; only its position moves.
  const keptDoors = core.doors.filter((d) => d.to !== 'jungle_1');

  return {
    ...core,
    grid: g.out(),
    props,
    npcs,
    signs,
    doors: [
      ...keptDoors, // the COSTA north gate stays byte-identical; the jungle gate relocates ↓
      { x: W - 1, y: PUERTO_SOL_EAST_GATE_ROW - 1, w: 1, h: 3, to: 'jungle_1', tx: 24, ty: 264, facing: 'right' },
    ],
    triggers: [
      ...core.triggers, // board_boat_return + puerto_arrival stay first + unchanged
      // the flag-gated waterfront beat — a warm look over the working harbor on first
      // reaching the malecón (fires once; the cut/dlg/camera pattern in OverworldScene)
      { id: 'puerto_malecon', rect: { x: 52, y: 27, w: 3, h: 4 }, once: true },
    ],
    spawners: [
      ...core.spawners,
      // the dock district runs a gentle Ch.2 band, clear of the gateway + the rests
      { enemies: ['pickpocket_parrot'], count: 1, rect: { x: 96, y: 18, w: 14, h: 4 } },
    ],
  };
}

/* ================= PUERTO SOL interiors ================= */

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
    ],
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

/* ================= Ch.1 retrofits' interiors (Prompt 25) ================= */

/** BRICKTON GENERAL — the ADR-028 landmark-large hospital, finally open */
export function buildHospitalInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(20, 12, 'o');
  g.rect(0, 0, 20, 2, 'O');
  return {
    id: 'hospital_int',
    name: 'BRICKTON GENERAL',
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
      { sprite: 'poster_chart', x: 9, y: 0.55 },
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
export function buildJungle1(psReturn: { tx: number; ty: number } = PUERTO_SOL_JUNGLE_RETURN): MapDef {
  const g = new Grid(30, 36, 'j');
  // dense walls shape a winding south-north climb
  g.rect(0, 0, 30, 1, 'J');
  g.rect(0, 35, 30, 1, 'J');
  g.rect(0, 1, 1, 34, 'J');
  g.rect(29, 1, 1, 34, 'J');
  g.set(0, 16, 'j'); // west mouth (from Puerto Sol)
  g.rect(0, 15, 1, 3, 'j');
  g.rect(28, 6, 2, 3, 'j'); // east mouth (to jungle_2)
  // undergrowth ribs (broken mid-run, rule 4)
  g.rect(5, 5, 12, 1, 'J');
  g.rect(20, 5, 6, 1, 'J');
  g.rect(3, 11, 8, 1, 'J');
  g.rect(14, 11, 12, 1, 'J');
  g.rect(6, 17, 14, 1, 'J');
  g.rect(23, 17, 4, 1, 'J');
  g.rect(3, 23, 10, 1, 'J');
  g.rect(16, 23, 10, 1, 'J');
  g.rect(8, 29, 16, 1, 'J');
  g.sprinkle(31, ',~f', 0.04);
  const trees: Array<[number, number]> = [
    [3, 3],
    [14, 7],
    [24, 9],
    [7, 14],
    [19, 19],
    [4, 26],
    [22, 26],
    [12, 32],
  ];
  return {
    id: 'jungle_1',
    name: 'JUNGLE PATH',
    music: 'jungle',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      { sprite: 'sign', x: 2, y: 14, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ],
    npcs: [],
    signs: [{ x: 2, y: 15, dialogue: 'sign_jungle1' }],
    phones: [],
    doors: [
      { x: 0, y: 15, w: 1, h: 3, to: 'puerto_sol', tx: psReturn.tx, ty: psReturn.ty, facing: 'left' },
      { x: 28, y: 6, w: 2, h: 3, to: 'jungle_2', tx: 40, ty: 200, facing: 'right' },
    ],
    spawners: [
      { enemies: ['pickpocket_parrot', 'banana_bunch'], count: 3, rect: { x: 4, y: 6, w: 22, h: 4 } },
      { enemies: ['jungle_jitterbug', 'pickpocket_parrot'], count: 2, rect: { x: 4, y: 18, w: 20, h: 4 } },
      { enemies: ['banana_bunch'], count: 2, rect: { x: 5, y: 24, w: 18, h: 4 } },
    ],
    triggers: [],
  };
}

export function buildJungle2(): MapDef {
  const g = new Grid(38, 28, 'j');
  g.rect(0, 0, 38, 1, 'J');
  g.rect(0, 27, 38, 1, 'J');
  g.rect(0, 1, 1, 26, 'J');
  g.rect(37, 1, 1, 26, 'J');
  g.rect(0, 11, 1, 3, 'j'); // west mouth (from jungle_1)
  g.rect(37, 18, 1, 3, 'j'); // east mouth (to Valle Dorado)
  // the river of undergrowth the path bends around
  g.rect(8, 5, 1, 14, 'J');
  g.rect(16, 9, 1, 16, 'J');
  g.rect(24, 3, 1, 14, 'J');
  g.rect(30, 12, 1, 12, 'J');
  g.rect(9, 5, 10, 1, 'J');
  g.rect(25, 3, 8, 1, 'J');
  g.sprinkle(32, ',~f', 0.04);
  return {
    id: 'jungle_2',
    name: 'DEEP JUNGLE',
    music: 'jungle',
    grid: g.out(),
    props: [
      ...([
        [4, 3],
        [12, 21],
        [20, 4],
        [28, 20],
        [34, 6],
        [5, 22],
      ] as const).map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      // §A4.5: the deep-jungle table (Ch.2's second — strategy before the village)
      { sprite: 'picnic', x: 33, y: 21.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'sign', x: 19, y: 24, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ],
    npcs: [],
    signs: [
      { x: 19, y: 25, dialogue: 'sign_jungle2' },
      // the grotto mouth — easy to walk past, the §A11 sign doesn't help
      { x: 10, y: 2, dialogue: 'sign_grotto' },
    ],
    phones: [],
    doors: [
      { x: 0, y: 11, w: 1, h: 3, to: 'jungle_1', tx: 440, ty: 120, facing: 'left' },
      { x: 37, y: 18, w: 1, h: 3, to: 'valle_dorado', tx: 32, ty: 312, facing: 'right' },
      // the optional grotto, tucked behind the north ribs
      { x: 11, y: 1, w: 2, h: 1, to: 'grotto', tx: 104, ty: 152, facing: 'up' },
    ],
    spawners: [
      { enemies: ['cursed_souvenir', 'jungle_jitterbug'], count: 3, rect: { x: 2, y: 14, w: 12, h: 6 } },
      { enemies: ['gilded_beetle', 'banana_bunch'], count: 3, rect: { x: 18, y: 6, w: 10, h: 8 } },
      { enemies: ['jungle_jitterbug'], count: 1, rect: { x: 26, y: 16, w: 8, h: 6 } },
    ],
    triggers: [],
  };
}

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

export function buildValleDorado(): MapDef {
  const g = new Grid(40, 30, '.');
  g.sprinkle(33, ',~,~ff', 0.07);
  // paths: the east gate lane, the shrine plaza, the pen spur
  g.rect(1, 19, 16, 2, ':');
  g.rect(16, 10, 2, 11, ':');
  g.rect(16, 10, 14, 2, ':');
  g.rect(28, 4, 2, 8, ':');
  g.rect(17, 21, 2, 6, ':');
  // the shrine plaza — pavers around the idol
  g.rect(20, 14, 9, 6, 'p');
  // THE LLAMA PEN: fences with a gate gap south
  g.rect(4, 4, 9, 1, '-');
  g.rect(4, 9, 9, 1, '-');
  g.rect(4, 5, 1, 4, '|');
  g.rect(12, 5, 1, 4, '|');
  g.set(8, 9, '.'); // the gate gap
  // edge trees
  const trees: Array<[number, number]> = [];
  for (let x = 0; x < 40; x += 2) {
    trees.push([x, 0]);
    if (x < 16 || x > 21) trees.push([x, 28]);
  }
  for (let y = 2; y < 28; y += 2) {
    trees.push([0, y]);
    if (y < 18 || y > 22) trees.push([38, y]);
  }
  trees.push([24, 8], [33, 22], [7, 24], [31, 3]);

  const npcs: NpcDef[] = [
    { id: 'tomas', sprite: 'tomas', x: 9, y: 11, facing: 'down', dialogue: 'npc_tomas' },
    { id: 'senora', sprite: 'senora', x: 19, y: 18, facing: 'down', dialogue: 'npc_senora', wander: true },
    { id: 'valle_kid', sprite: 'wokeB', x: 26, y: 21, facing: 'left', dialogue: 'npc_valle_kid', wander: true },
    { id: 'doc_valle_out', sprite: 'docValle', x: 31, y: 17, facing: 'down', dialogue: 'npc_doc_valle_out', ifFlag: 'grin_defeated' },
    // THE WISHERS (§A6): gray and mute at the shrine until the Grin falls,
    // then the same three people with their color back (flag-gated variants)
    { id: 'wisher_a', sprite: 'wisherA', x: 22, y: 16, facing: 'up', dialogue: 'npc_wisher_a', unlessFlag: 'grin_defeated' },
    { id: 'wisher_b', sprite: 'wisherB', x: 25, y: 17, facing: 'up', dialogue: 'npc_wisher_b', unlessFlag: 'grin_defeated' },
    { id: 'wisher_c', sprite: 'wisherC', x: 27, y: 15, facing: 'up', dialogue: 'npc_wisher_c', unlessFlag: 'grin_defeated' },
    { id: 'woke_a', sprite: 'wokeA', x: 22, y: 16, facing: 'down', dialogue: 'npc_woke_a', ifFlag: 'grin_defeated' },
    { id: 'woke_b', sprite: 'wokeB', x: 25, y: 17, facing: 'down', dialogue: 'npc_woke_b', ifFlag: 'grin_defeated' },
    { id: 'woke_c', sprite: 'wokeC', x: 27, y: 15, facing: 'down', dialogue: 'npc_woke_c', ifFlag: 'grin_defeated' },
  ];
  // §A10 #5: the six escaped llamas — each stands somewhere inconvenient
  // until herded (its flag), then stands IN the pen (the herded twin).
  // Llama 4 is the impostor: cornering it starts the §A7 beetle fight.
  const LLAMA_SPOTS: Array<[number, number]> = [
    [33, 6],
    [3, 14],
    [35, 25],
    [22, 25],
    [13, 16],
    [30, 9],
  ];
  const PEN_SPOTS: Array<[number, number]> = [
    [6, 6],
    [8, 5],
    [10, 7],
    [6, 8],
    [11, 5],
    [9, 7],
  ];
  LLAMA_SPOTS.forEach(([x, y], i) => {
    const n = i + 1;
    npcs.push({
      id: `llama_${n}`,
      sprite: 'llama',
      x,
      y,
      facing: x > 20 ? 'left' : 'right',
      dialogue: `npc_llama_${n}`,
      dog: true,
      ifFlag: 'q_llama',
      unlessFlag: `q_llama_${n}`,
    });
    npcs.push({
      id: `llama_pen_${n}`,
      sprite: 'llama',
      x: PEN_SPOTS[i][0],
      y: PEN_SPOTS[i][1],
      facing: 'left',
      dialogue: 'npc_llama_penned',
      dog: true,
      ifFlag: `q_llama_${n}`,
    });
  });

  return {
    id: 'valle_dorado',
    name: 'VALLE DORADO',
    music: 'valle',
    settlement: 'village',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      // the shrine — the village's whole problem, on a plinth
      { sprite: 'idol_shrine', x: 23.5, y: 12.2, solid: { ox: 6, oy: 28, w: 28, h: 14 } },
      // homes + the civic three (shop, clinic, chapel — Prompt 25's pair)
      { sprite: 'valle_shop', x: 19, y: 4, solid: { ox: 0, oy: 20, w: 82, h: 46 }, door: { ox: 33, oy: 56, w: 16, h: 30, to: 'valle_shop_int', tx: 88, ty: 118 } },
      { sprite: 'valle_clinic', x: 30, y: 12, solid: { ox: 0, oy: 20, w: 66, h: 46 }, door: { ox: 17, oy: 56, w: 16, h: 30, to: 'clinic_valle_int', tx: 88, ty: 118 } },
      { sprite: 'valle_chapel', x: 8, y: 20, solid: { ox: 0, oy: 30, w: 50, h: 56 }, door: { ox: 17, oy: 78, w: 16, h: 30, to: 'chapel_valle_int', tx: 88, ty: 134 } },
      { sprite: 'valle_house', x: 2, y: 22, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      { sprite: 'valle_house_b', x: 33, y: 19, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      // §A4.5: the village table (Ch.2's third before the dungeon)
      { sprite: 'picnic', x: 19, y: 23.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'phone_table', x: 14, y: 12, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      { sprite: 'sign', x: 3, y: 18, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ],
    npcs,
    signs: [
      { x: 3, y: 19, dialogue: 'sign_valle' },
      { x: 24, y: 19, dialogue: 'sign_shrine', unlessFlag: 'grin_defeated' },
      { x: 24, y: 19, dialogue: 'sign_shrine_after', ifFlag: 'grin_defeated' },
      { x: 8, y: 10, dialogue: 'sign_pen' },
    ],
    phones: [{ x: 14, y: 12 }],
    doors: [
      { x: 39, y: 18, w: 1, h: 3, to: 'jungle_2', tx: 576, ty: 312, facing: 'right' },
      // the mountain stair to the pyramid's antechamber
      { x: 17, y: 29, w: 3, h: 1, to: 'pyramid_ante', tx: 168, ty: 40, facing: 'down' },
    ],
    spawners: [],
    triggers: [
      { id: 'valle_arrival', rect: { x: 36, y: 18, w: 3, h: 3 }, once: true },
    ],
  };
}

/* ================= THE STEP-PYRAMID (rotating floors, §A6) ================= */

/** rotor geometry shared by builder, scene, and tests */
export const PYR_ROTOR = { x: 4, y: 4, size: 7 } as const;
/** authored initial rotations per room (presses add to these, % 4) */
export const PYR_INITIAL_ROT: Record<string, number> = {
  pyramid_1: 0,
  pyramid_2: 2,
  pyramid_3: 3,
  pyramid_4: 1,
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
    // room 4 is entered from the WEST (room 3 exits east): door + a small
    // alcove through the west flank — the mask waits IN the alcove, so the
    // switch is always reachable from the door (no soft-lock; tested)
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
      // interacting turns the floor a quarter clockwise (the §A6 rotation)
      { sprite: 'mask_switch', x: 2, y: west ? 4.6 : 11, solid: { ox: 4, oy: 12, w: 10, h: 8 } },
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
    ],
    npcs: [],
    signs: [{ x: 14, y: 11, dialogue: 'sign_pyramid' }],
    phones: [{ x: 16, y: 12 }],
    doors: [{ x: 9, y: 15, w: 3, h: 1, to: 'valle_dorado', tx: 288, ty: 456, facing: 'down' }],
    spawners: [
      { enemies: ['step_mask', 'gilded_beetle'], count: 2, rect: { x: 3, y: 5, w: 6, h: 5 } },
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
      { enemies: ['cursed_souvenir', 'step_mask'], count: 2, rect: { x: 4, y: 1, w: 7, h: 2 } },
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
        { x: 0, y: 5, w: 1, h: 3, to: 'pyramid_3', tx: 208, ty: 104, facing: 'left' },
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
    ],
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
  // S15i Task 4 (ADR-057): the live port is the GROWN city now; the frozen 1898
  // core sits byte-identical in its top-left (proven in world_block.test). The
  // interior doorsteps still derive from the core's facade doors (doorstepOf).
  const puerto = growPuertoSol();
  const valle = buildValleDorado();
  const mercadoStep = doorstepOf(puerto, 'mercado_int') ?? { tx: 96, ty: 130 };
  const clinicStep = doorstepOf(puerto, 'clinic_ps_int') ?? { tx: 224, ty: 130 };
  const deliStep = doorstepOf(puerto, 'deli_int') ?? { tx: 96, ty: 322 };
  const museumStep = doorstepOf(puerto, 'museum_int') ?? { tx: 520, ty: 130 };
  const valleShopStep = doorstepOf(valle, 'valle_shop_int') ?? { tx: 344, ty: 130 };
  const valleClinicStep = doorstepOf(valle, 'clinic_valle_int') ?? { tx: 500, ty: 258 };
  const valleChapelStep = doorstepOf(valle, 'chapel_valle_int') ?? { tx: 154, ty: 430 };
  const rooms = buildPyramidRooms();
  return {
    brickton_docks: buildBricktonDocks(),
    boat_interior: buildBoatInterior(),
    hospital_int: buildHospitalInt(steps.hospitalStep),
    chapel_int: buildChapelInt(steps.chapelStep),
    puerto_sol: puerto,
    mercado_int: buildMercadoInt(mercadoStep),
    clinic_ps_int: buildClinicPsInt(clinicStep),
    deli_int: buildDeliInt(deliStep),
    museum_int: buildMuseumInt(museumStep),
    jungle_1: buildJungle1(),
    jungle_2: buildJungle2(),
    grotto: buildGrotto(),
    valle_dorado: valle,
    valle_shop_int: buildValleShopInt(valleShopStep),
    clinic_valle_int: buildClinicValleInt(valleClinicStep),
    chapel_valle_int: buildChapelValleInt(valleChapelStep),
    pyramid_ante: buildPyramidAnte(),
    pyramid_1: rooms[0],
    pyramid_2: rooms[1],
    pyramid_3: rooms[2],
    pyramid_4: rooms[3],
    pyramid_apex: buildPyramidApex(),
  };
}
