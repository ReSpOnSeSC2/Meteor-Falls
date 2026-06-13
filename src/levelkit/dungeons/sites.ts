/**
 * THE EIGHT DUNGEON GRAMMARS (S15g Movement Two, ADR-045). ONE per SITE —
 * never a generic maze (the user's law). They SHARE the carve verbs in
 * ./kit and the named Streams in ../rng; what differs is the GRAMMAR — each
 * site's shape obeys its own §A6 law:
 *
 *   wintermoor_academy — spine hall + wings, a patrolled dorm, a stack maze
 *   sleepers_spine     — the terrain-giant, hand→shoulder→ear (THE SCALE LAW)
 *   the_hedgerow       — wide escort lanes, FALSE exits that rejoin (comedy)
 *   laughing_ruins     — a TREE of passages: the loops are a lie (BFS-proven)
 *   night_train        — car-by-car LINEAR, car count = the ≤30-min law
 *   spore_forest       — Mushroomize zones with CURE-SAFE return paths (proven)
 *   castle_hoaxula     — fake-scare loop, then the BACKSTAGE REVEAL behind a wall
 *   sea_of_silence     — SUBTRACTIVE: three zones at FALLING density (the curve)
 *
 * Every grammar builds a deterministic SKELETON (reachability holds for all
 * seeds by construction — the entrance room is a SAFE CAMP, spawners begin
 * deeper) and lets the seed move only DRESSING inside it (the settlements
 * precedent). `sealed()` proves the post-conditions before the draft leaves
 * the building (Prime Law 4).
 */
import type {
  DungeonRecipe,
  DraftMapDef,
  DraftNpc,
  PropDef,
  SignDef,
  SpawnerDef,
  DoorZone,
  TriggerDef,
  PatrolDef,
} from '../../schemas';
import { Streams } from '../rng';
import { furniture, slot } from '../kit';
import {
  Grid,
  corridorH,
  corridorV,
  carveRoom,
  rest,
  bandEnemies,
  risingSpawners,
  sealed,
  trappedZones,
} from './kit';

type Rect = { x: number; y: number; w: number; h: number };

/** clamp a recipe size (or a per-site default) to a structural floor */
function size(r: DungeonRecipe, dw: number, dh: number, minW: number, minH: number): [number, number] {
  const [w, h] = r.size ?? [dw, dh];
  return [Math.max(minW, w), Math.max(minH, h)];
}

/** assemble the common draft envelope (sites fill the gameplay arrays) */
function draft(
  r: DungeonRecipe,
  grid: string[],
  parts: Partial<Pick<DraftMapDef, 'props' | 'npcs' | 'signs' | 'phones' | 'doors' | 'spawners' | 'triggers' | 'patrols'>>,
): DraftMapDef {
  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    interior: true,
    grid,
    props: parts.props ?? [],
    npcs: parts.npcs ?? [],
    signs: parts.signs ?? [],
    phones: parts.phones ?? [],
    doors: parts.doors ?? [],
    spawners: parts.spawners ?? [],
    triggers: parts.triggers ?? [],
    ...(parts.patrols ? { patrols: parts.patrols } : {}),
  };
}

/* ===================================================================== *
 * 1. WINTERMOOR ACADEMY (Ch.3, England) — classroom wings off a spine
 *    hall, a dorm wing with a sight-cone PATROL, library stacks as a soft
 *    maze, a boiler basement. Fog is dressing only (a tag, never a wall).
 * ===================================================================== */
export function buildWintermoor(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 44, 34, 36, 30);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'W'); // wall_int rock
  const floor = 'w';
  const cx = Math.floor(W / 2);

  // THE SPINE HALL: a wide vertical corridor from the entrance up to the head
  corridorV(g, cx - 1, 2, H - 2, floor, 3);

  // entrance lobby (bottom, the SAFE CAMP) + boiler basement off it
  carveRoom(g, cx - 4, H - 6, 9, 4, floor);
  carveRoom(g, 2, H - 6, 6, 4, floor); // boiler room (west)
  corridorH(g, 8, cx - 4, H - 4, floor, 2);

  // classroom wings: rooms left + right at three landings, each spurred in
  const wings: Rect[] = [];
  for (let i = 0; i < 3; i++) {
    const wy = H - 12 - i * 6;
    const left: Rect = { x: 3, y: wy, w: 9, h: 4 };
    const right: Rect = { x: W - 12, y: wy, w: 9, h: 4 };
    carveRoom(g, left.x, left.y, left.w, left.h, floor);
    carveRoom(g, right.x, right.y, right.w, right.h, floor);
    corridorH(g, left.x + left.w, cx - 1, wy + 1, floor, 1);
    corridorH(g, cx + 1, right.x, wy + 1, floor, 1);
    wings.push(left, right);
  }

  // the LIBRARY STACKS: a room whose shelves form a soft maze (a guaranteed
  // lane is carved up its middle, the stacks flank it as solids)
  const lib: Rect = { x: cx - 4, y: 8, w: 9, h: 6 };
  carveRoom(g, lib.x, lib.y, lib.w, lib.h, floor);
  const stacks: PropDef[] = [];
  for (let sx = lib.x + 1; sx < lib.x + lib.w - 1; sx += 2) {
    for (let sy = lib.y + 1; sy < lib.y + lib.h - 1; sy++) {
      if (sx === cx) continue; // keep the centre lane clear
      if (S.chance(`stack${sx}_${sy}`, 0.7)) stacks.push({ sprite: 'shelf', x: sx, y: sy, solid: { ox: 0, oy: 12, w: 32, h: 12 } });
    }
  }

  // the HEAD'S STUDY (boss room) at the top + the exit throat
  carveRoom(g, cx - 4, 2, 9, 4, floor);
  for (let y = 0; y < 2; y++) g.set(cx, y, floor);

  const doors: DoorZone[] = [
    { x: cx - 1, y: H - 1, w: 2, h: 1, to: `${r.id}__exit`, tx: 16, ty: 16, facing: 'down', indicator: 'mat' },
    { x: cx - 1, y: 0, w: 2, h: 1, to: `${r.id}__head`, tx: 16, ty: 16, facing: 'up', indicator: 'door' },
  ];

  // a phone in the lobby BEFORE the climb; rising fights up the lower wings
  const ph = rest(cx + 2, H - 4);
  const band = bandEnemies(r.encounterBand, 'ch3');
  const spawners = risingSpawners(band, wings.slice(0, 4));

  // a sight-cone PATROL in an upper wing (the dos_f3 prefect pattern)
  const dorm = wings[5];
  const patrols: PatrolDef[] = [
    { id: 'prefect_a', enemy: band[0], route: [[dorm.x + 1, dorm.y + 1], [dorm.x + dorm.w - 2, dorm.y + 1]], sight: 5 },
  ];
  const triggers: TriggerDef[] = [{ id: 'wintermoor_boss', rect: { x: cx - 1, y: 2, w: 2, h: 2 }, once: false }];

  return sealed(
    draft(r, g.out(), {
      props: [...stacks, ph.prop, furniture('bench', 3, H - 5)],
      signs: [{ x: lib.x, y: lib.y + 1, dialogue: `${r.id}_stacks` }],
      phones: [ph.phone],
      doors,
      spawners,
      triggers,
      patrols,
    }),
  );
}

/* ===================================================================== *
 * 2. SLEEPERS' SPINE (Ch.4, Norway) — GRANDFATHER STORHEIM under THE SCALE
 *    LAW: terrain-giant architecture, three vast chambers (hand → shoulder
 *    → ear) with narrow passes; the HAND is the safe base camp, the EAR the
 *    boss. Partial-view staging hooks (pillars) for the Whisperwig.
 * ===================================================================== */
export function buildSleepersSpine(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 60, 52, 48, 44);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'Z'); // pyramid_wall reads as ancient stone
  const floor = 'Y';
  const cx = Math.floor(W / 2);

  const hand: Rect = { x: 4, y: H - 18, w: W - 8, h: 14 };
  const shoulder: Rect = { x: 8, y: H - 34, w: W - 16, h: 12 };
  const ear: Rect = { x: cx - 9, y: 4, w: 18, h: 12 };
  for (const c of [hand, shoulder, ear]) carveRoom(g, c.x, c.y, c.w, c.h, floor);

  // narrow passes BETWEEN chambers (the kneeling-giant joints)
  corridorV(g, cx, ear.y + ear.h, shoulder.y, floor, 2);
  corridorV(g, cx, shoulder.y + shoulder.h, hand.y, floor, 2);
  corridorV(g, cx, hand.y + hand.h, H - 2, floor, 2);
  for (let y = 0; y < 4; y++) g.set(cx, y, floor);

  // partial-view staging hooks for the Whisperwig — pillars the boss hides
  // behind (real solids, so "partial view" is geometry, not a camera trick)
  const pillars: PropDef[] = [];
  for (let i = 0; i < 5; i++) {
    const px = ear.x + 2 + i * 3;
    pillars.push({ sprite: 'well', x: px, y: ear.y + 3 + S.int(`pil${i}`, 2), solid: { ox: 2, oy: 8, w: 20, h: 12 } });
  }

  const doors: DoorZone[] = [
    { x: cx - 1, y: H - 1, w: 2, h: 1, to: `${r.id}__base`, tx: 16, ty: 16, facing: 'down', indicator: 'mat' },
    { x: cx - 1, y: 0, w: 2, h: 1, to: `${r.id}__ear`, tx: 16, ty: 16, facing: 'up', indicator: 'door' },
  ];

  const ph = rest(cx - 2, hand.y + hand.h - 2); // by the throat into the hand
  const band = bandEnemies(r.encounterBand, 'ch4');
  // pressure climbs the giant: the TOP of the hand, then the shoulder twice —
  // the lower hand (the camp) stays calm so the phone is the first thing met
  const handTop: Rect = { x: hand.x + 2, y: hand.y + 1, w: hand.w - 4, h: 4 };
  const shoulderLo: Rect = { x: shoulder.x + 2, y: shoulder.y + 6, w: shoulder.w - 4, h: 4 };
  const shoulderHi: Rect = { x: shoulder.x + 2, y: shoulder.y + 1, w: shoulder.w - 4, h: 4 };
  const spawners = risingSpawners(band, [handTop, shoulderLo, shoulderHi], 0);
  const triggers: TriggerDef[] = [
    { id: 'whisperwig_stage', rect: { x: ear.x, y: ear.y + ear.h - 2, w: ear.w, h: 2 }, once: true },
    { id: 'sleepers_boss', rect: { x: cx - 1, y: ear.y + 1, w: 2, h: 2 }, once: false },
  ];

  return sealed(
    draft(r, g.out(), {
      props: [...pillars, ph.prop],
      signs: [{ x: hand.x + 1, y: hand.y + hand.h - 2, dialogue: `${r.id}_kneel` }],
      phones: [ph.phone],
      doors,
      spawners,
      triggers,
    }),
  );
}

/* ===================================================================== *
 * 3. THE HEDGEROW (Ch.5, Minimus) — escort lanes WIDE enough for the Tin
 *    Battalion at your shrunk scale; branch-FALSE exits that REJOIN the main
 *    lane (comedy, never a dead end you regret). Hedges are the walls.
 * ===================================================================== */
export function buildHedgerow(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 46, 34, 38, 28);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'b'); // bush hedges
  const floor = '.';
  const cx = Math.floor(W / 2);

  // THE MAIN LANE: a wide (3-tile) ribbon that bends up the duchy
  let ly = H - 4;
  const laneYs: number[] = [];
  for (let x = 2; x < W - 2; x++) {
    corridorV(g, x, ly, ly + 2, floor, 1);
    laneYs[x] = ly;
    if (S.chance(`bend${x}`, 0.16) && x > 4 && x < W - 6) ly = Math.max(4, Math.min(H - 6, ly + (S.chance(`bd${x}`, 0.5) ? -1 : 1)));
  }
  // a vertical riser at the east end up to the boss court
  corridorV(g, W - 4, 4, laneYs[W - 3] + 1, floor, 3);
  carveRoom(g, W - 8, 3, 6, 4, floor); // the duchess's court (boss)

  // FALSE EXITS: stubs that peel off the lane toward an edge, then curl BACK
  // to it a few tiles on — they look like a way out, they only waste a giggle
  for (let i = 0; i < 3; i++) {
    const bx = 8 + i * Math.floor((W - 16) / 3) + S.int(`fx${i}`, 2);
    const by = laneYs[bx] ?? H - 4;
    const dir = i % 2 === 0 ? -1 : 1; // peel north or south
    const yA = Math.min(by, by + dir * 3);
    const yB = Math.max(by, by + dir * 3);
    corridorV(g, bx, yA, yB, floor, 1);
    corridorH(g, bx, bx + 3, by + dir * 3, floor, 1);
    corridorV(g, bx + 3, yA, yB, floor, 1); // rejoins the lane
  }

  corridorV(g, 1, H - 3, H - 2, floor, 1);
  corridorV(g, W - 2, 4, 5, floor, 1);
  const doors: DoorZone[] = [
    { x: 1, y: H - 3, w: 1, h: 2, to: `${r.id}__gate`, tx: 16, ty: 16, facing: 'left', indicator: 'none' },
    { x: W - 2, y: 4, w: 1, h: 2, to: `${r.id}__court`, tx: 16, ty: 16, facing: 'right', indicator: 'none' },
  ];

  // the Tin Battalion you escort — a draft NPC slot riding the lane
  const npcs: DraftNpc[] = [slot(S, 0, 5, H - 3)];
  const ph = rest(3, H - 3);
  const band = bandEnemies(r.encounterBand, 'ch5');
  // pressure rises along the lane's far thirds (the first third by the gate is
  // the calm escort start — the phone is the first thing met)
  const third = Math.floor((W - 12) / 3);
  const zones: Rect[] = [0, 1, 2].map((i) => ({ x: 10 + i * third, y: 4, w: third - 2, h: H - 8 }));
  const spawners = risingSpawners(band, zones, 2);
  const triggers: TriggerDef[] = [{ id: 'hedgerow_boss', rect: { x: W - 7, y: 4, w: 4, h: 2 }, once: false }];

  return sealed(
    draft(r, g.out(), {
      props: [ph.prop, furniture('planter', cx, laneYs[cx] ?? H - 4)],
      npcs,
      phones: [ph.phone],
      doors,
      spawners,
      triggers,
    }),
    { entry: [2, H - 3], exit: [W - 3, 4] },
  );
}

/* ===================================================================== *
 * 4. THE LAUGHING RUINS (Ch.6, Africa) — echo zones (ambience tags the
 *    audio reads), riddle chambers (sign rooms), and FALSE LOOPS: the floor
 *    is a 1-wide TREE, so every passage that LOOKS like it circled back is a
 *    dead branch. The laughter is the map lying politely — BFS-provably
 *    (sealed with tree:true asserts edges == cells − 1: no cycle exists).
 * ===================================================================== */
export function buildLaughingRuins(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 42, 34, 34, 28);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'Z'); // ruined stone
  const floor = 'n'; // sand drift
  const cx = Math.floor(W / 2);

  // A 1-WIDE TREE grown from the entrance on a coarse lattice (odd cols/rows,
  // so corridors never touch sideways and no 2×2 floor block can form — the
  // graph is acyclic by construction; the loops you "remember" are dead ends).
  const colN = Math.floor((W - 3) / 2);
  const rowN = Math.floor((H - 3) / 2);
  const node = (c: number, rrow: number): [number, number] => [1 + c * 2, 1 + rrow * 2];
  const visited = new Set<string>();
  const startC = Math.floor(colN / 2);
  const startR = rowN - 1; // bottom lattice row (the entrance)
  const stack: Array<[number, number]> = [[startC, startR]];
  visited.add(`${startC},${startR}`);
  const depthOf = new Map<string, number>([[`${startC},${startR}`, 0]]);
  while (stack.length) {
    const [c, rr] = stack[stack.length - 1];
    const [nx, ny] = node(c, rr);
    g.set(nx, ny, floor);
    const nbrs = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
      .map(([dc, dr]) => [c + dc, rr + dr] as [number, number])
      .filter(([nc, nr]) => nc >= 0 && nr >= 0 && nc < colN && nr < rowN && !visited.has(`${nc},${nr}`));
    if (!nbrs.length) {
      stack.pop();
      continue;
    }
    const [tc, tr] = nbrs[S.int(`ruin${c}_${rr}_${stack.length}`, nbrs.length)];
    const [ax, ay] = node(c, rr);
    const [bx, by] = node(tc, tr);
    g.set((ax + bx) / 2, (ay + by) / 2, floor); // the single 1-wide link
    g.set(bx, by, floor);
    visited.add(`${tc},${tr}`);
    depthOf.set(`${tc},${tr}`, (depthOf.get(`${c},${rr}`) ?? 0) + 1);
    stack.push([tc, tr]);
  }

  // entrance = the start node (bottom); exit/boss = the DEEPEST node on the TOP
  // lattice row, so each throat is a single edge-cell that crosses no node
  // (a throat through the maze body would forge a real loop — forbidden).
  let exitC = startC;
  let best = -1;
  for (const k of visited) {
    const [c, rr] = k.split(',').map(Number);
    if (rr === 0 && (depthOf.get(k) ?? 0) > best) { best = depthOf.get(k) ?? 0; exitC = c; }
  }
  const [sx, sy] = node(startC, startR);
  const [ex, ey] = node(exitC, 0);
  corridorV(g, sx, sy, H - 1, floor, 1); // down to the entrance mat (below all nodes)
  g.set(ex, 0, floor); // up one cell to the exit (the top node sits at row 1)
  const doors: DoorZone[] = [
    { x: sx, y: H - 1, w: 1, h: 1, to: `${r.id}__mouth`, tx: 16, ty: 16, facing: 'down', indicator: 'mat' },
    { x: ex, y: 0, w: 1, h: 1, to: `${r.id}__deep`, tx: 16, ty: 16, facing: 'up', indicator: 'door' },
  ];

  // riddle chambers (signs) + the FALSE-LOOP twin dressing: two non-adjacent
  // leaves wear an identical (sign+well) pair so you SWEAR you've circled back
  const leaves = [...visited].map((k) => k.split(',').map(Number) as [number, number])
    .filter(([c, rr]) => {
      const links = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).filter(([dc, dr]) => visited.has(`${c + dc},${rr + dr}`)).length;
      return links === 1 && !(c === startC && rr === startR) && !(c === exitC && rr === 0);
    });
  const props: PropDef[] = [];
  const signs: SignDef[] = [];
  const twinAt = (c: number, rr: number): void => {
    const [px, py] = node(c, rr);
    signs.push({ x: px, y: py, dialogue: `${r.id}_echo` });
  };
  if (leaves.length >= 2) {
    twinAt(leaves[0][0], leaves[0][1]);
    twinAt(leaves[leaves.length - 1][0], leaves[leaves.length - 1][1]);
  }

  const ph = rest(sx, sy);
  props.push(ph.prop);
  const band = bandEnemies(r.encounterBand, 'ch6');
  // pressure rises toward the deep leaf (mid-corridor, then near the boss),
  // both kept clear of the start node so the phone is the first thing met
  const spawners: SpawnerDef[] = [
    { enemies: band, count: 2, rect: { x: 2, y: Math.floor(H / 2) - 1, w: W - 4, h: 1 } },
    { enemies: band, count: 3, rect: { x: Math.max(2, ex - 4), y: 5, w: 8, h: 1 } }, // clear of the boss touch
  ];
  const triggers: TriggerDef[] = [
    { id: 'ruins_echo', rect: { x: cx - 3, y: Math.floor(H / 2), w: 6, h: 4 }, once: true },
    { id: 'laughing_boss', rect: { x: Math.max(1, ex - 1), y: 1, w: 2, h: 2 }, once: false },
  ];

  return sealed(
    draft(r, g.out(), { props, signs, phones: [ph.phone], doors, spawners, triggers }),
    { entry: [sx, sy], exit: [ex, ey], tree: true },
  );
}

/* ===================================================================== *
 * 5. THE NIGHT TRAIN (Ch.7, India) — a car-by-car LINEAR generator: cars
 *    coupled left→right, a service crawl over the top, pressure rising
 *    carward. The §A6 ≤30-minute Locket-loss pacing law is a GENERATION
 *    PARAMETER: `rooms` (the car count) bounds the sequence length [3, 7].
 * ===================================================================== */
export function buildNightTrain(r: DungeonRecipe): DraftMapDef {
  const cars = Math.max(3, Math.min(7, r.rooms ?? 5));
  const carW = 9;
  const W = cars * carW + 2;
  const H = 12;
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'U'); // bus_wall — the carriage shell
  const floor = 'u';
  const midY = Math.floor(H / 2);

  const carRects: Rect[] = [];
  for (let i = 0; i < cars; i++) {
    const x = 1 + i * carW;
    carveRoom(g, x, 2, carW - 1, H - 4, floor);
    carRects.push({ x, y: 2, w: carW - 1, h: H - 4 });
    if (i > 0) corridorH(g, x - 1, x, midY, floor, 2); // the coupling vestibule
  }
  // SERVICE CRAWL over the top: a maintenance route spanning the train,
  // dropping back into the rear and engine cars (a real over/under bypass)
  corridorH(g, 2, W - 3, 1, floor, 1);
  corridorV(g, 2, 1, 3, floor, 1);
  corridorV(g, W - 3, 1, 3, floor, 1);

  corridorH(g, 0, 1, midY, floor, 2);
  corridorH(g, W - 2, W - 1, midY, floor, 2);
  const doors: DoorZone[] = [
    { x: 0, y: midY, w: 1, h: 2, to: `${r.id}__rear`, tx: 16, ty: 16, facing: 'left', indicator: 'none' },
    { x: W - 1, y: midY, w: 1, h: 2, to: `${r.id}__engine`, tx: 16, ty: 16, facing: 'right', indicator: 'door' },
  ];

  const ph = rest(carRects[0].x + 1, carRects[0].y + 1); // the rear car is the camp
  const band = bandEnemies(r.encounterBand, 'ch7');
  const spawners = risingSpawners(band, carRects.slice(1, cars - 1), 1);
  const triggers: TriggerDef[] = [
    { id: 'night_train_boss', rect: { x: carRects[cars - 1].x + 1, y: midY - 1, w: 3, h: 2 }, once: false },
  ];
  // seeded luggage: a bench whose spot wanders per seed, plus one stray crate
  const props: PropDef[] = [ph.prop];
  for (const c of carRects) props.push(furniture('bench', c.x + 1 + S.int(`seat${c.x}`, c.w - 3), c.y + c.h - 1));
  const crateCar = carRects[1 + S.int('crate', Math.max(1, cars - 2))];
  props.push({ sprite: 'dumpster', x: crateCar.x + 1, y: crateCar.y + 1, solid: { ox: 1, oy: 8, w: 20, h: 9 } });

  return sealed(
    draft(r, g.out(), {
      props,
      signs: [{ x: carRects[0].x + 1, y: carRects[0].y + 2, dialogue: `${r.id}_ticket` }],
      phones: [ph.phone],
      doors,
      spawners,
      triggers,
    }),
    { entry: [1, midY], exit: [W - 2, midY] },
  );
}

/* ===================================================================== *
 * 6. THE SPORE FOREST (Ch.8, China) — organic winding paths, Mushroomize
 *    ZONES (status-hazard trigger rects) in side pockets, and CURE-SAFE
 *    RETURN PATHS: from any zone a SCRAMBLE-FREE route home exists —
 *    generator-PROVEN (trapping a scrambled kid is cruelty, not challenge).
 * ===================================================================== */
export function buildSporeForest(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 44, 36, 36, 30);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'J'); // jungle_wall canopy
  const floor = 'j';
  const cx = Math.floor(W / 2);

  // a CLEAN winding spine from the entrance camp to the heart (never inside a
  // hazard — the cure-safe trunk every return route falls back on)
  let px = cx;
  const trailX: number[] = [];
  for (let y = H - 2; y >= 4; y--) {
    corridorH(g, px - 1, px, y, floor, 1); // 2-wide trunk
    trailX[y] = px;
    if (S.chance(`wind${y}`, 0.3) && y > 6 && y < H - 4) px = Math.max(3, Math.min(W - 6, px + (S.chance(`wd${y}`, 0.5) ? -1 : 1)));
  }
  const heartX = trailX[4] ?? cx;
  carveRoom(g, heartX - 2, 2, 5, 4, floor); // the heart (boss grove)
  for (let y = 0; y < 2; y++) g.set(heartX, y, floor);

  // side POCKETS hang off the trunk: each opens through a CLEAN margin column,
  // the Mushroomize hazard sits in its FAR cells — so stepping one tile toward
  // the trunk is already scramble-free (cure-safe, proven below)
  const pockets: Rect[] = [];
  const hazards: Rect[] = [];
  for (let i = 0; i < 3; i++) {
    const py = H - 8 - i * Math.floor((H - 14) / 3);
    const side = i % 2 === 0 ? 1 : -1;
    const tx = trailX[py] ?? cx;
    const px0 = side > 0 ? Math.min(W - 7, tx + 1) : Math.max(2, tx - 6);
    const pocket: Rect = { x: px0, y: py - 1, w: 6, h: 3 };
    carveRoom(g, pocket.x, pocket.y, pocket.w, pocket.h, floor);
    corridorH(g, Math.min(tx, pocket.x), Math.max(tx, pocket.x + pocket.w - 1), py, floor, 1); // clean stub
    // hazard on the side AWAY from the trunk; the near margin stays clean
    const hz: Rect = side > 0
      ? { x: pocket.x + 3, y: pocket.y, w: 3, h: pocket.h }
      : { x: pocket.x, y: pocket.y, w: 3, h: pocket.h };
    pockets.push(pocket);
    hazards.push(hz);
  }

  const doors: DoorZone[] = [
    { x: cx - 1, y: H - 1, w: 2, h: 1, to: `${r.id}__trailhead`, tx: 16, ty: 16, facing: 'down', indicator: 'mat' },
    { x: heartX, y: 0, w: 1, h: 1, to: `${r.id}__heart`, tx: 16, ty: 16, facing: 'up', indicator: 'door' },
  ];
  corridorH(g, cx - 1, cx, H - 1, floor, 1);

  const ph = rest(cx + 1, H - 3); // the trailhead camp
  const band = bandEnemies(r.encounterBand, 'ch8');
  // pressure rises along the trunk's thirds (off the pockets + the camp)
  const seg = Math.floor((H - 10) / 3);
  const zones: Rect[] = [0, 1, 2].map((i) => {
    const y = H - 8 - i * seg;
    const t = trailX[y] ?? cx;
    return { x: t - 1, y: y - 1, w: 2, h: 2 };
  });
  const spawners = risingSpawners(band, zones, 0);
  const triggers: TriggerDef[] = [
    ...hazards.map((z, i) => ({ id: `mushroomize_${i}`, rect: z, once: false })),
    { id: 'spore_boss', rect: { x: heartX - 1, y: 2, w: 2, h: 2 }, once: false },
  ];

  const built = draft(r, g.out(), {
    props: [ph.prop],
    signs: [{ x: cx - 1, y: H - 3, dialogue: `${r.id}_spores` }],
    phones: [ph.phone],
    doors,
    spawners,
    triggers,
  });

  const trapped = trappedZones(built.grid, [cx, H - 3], hazards);
  if (trapped.length) throw new Error(`[levelkit] spore_forest '${r.id}': mushroomize zone(s) ${trapped.join(',')} trap a scrambled kid (no cure-safe return)`);
  return sealed(built, { entry: [cx, H - 2], exit: [heartX, 1] });
}

/* ===================================================================== *
 * 7. CASTLE HOAXULA (Ch.9, Romania) — theme-park fakery: a queue-rope maze,
 *    a gift shop, fake-scare rooms on a REAL LOOP (the haunt you circle),
 *    then the BACKSTAGE REVEAL — clean staff rooms behind ONE seam. The map
 *    itself does the unmasking.
 * ===================================================================== */
export function buildCastleHoaxula(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 48, 36, 42, 32);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'W'); // painted plywood "stone"
  const floor = 'w';
  const cx = Math.floor(W / 2);
  const midY = Math.floor(H / 2);

  // the LOBBY + GIFT SHOP (bottom-left): the safe front-of-house camp
  carveRoom(g, 2, H - 7, 9, 5, floor);
  for (let y = H - 2; y >= H - 3; y--) g.set(6, y, floor); // entrance throat

  // the HAUNT RING — four fake-scare rooms wired in a real cycle
  const ring: Rect[] = [
    { x: 5, y: H - 13, w: 7, h: 5 }, // BL
    { x: 5, y: 5, w: 7, h: 5 },      // TL
    { x: cx, y: 5, w: 7, h: 5 },     // TR
    { x: cx, y: H - 13, w: 7, h: 5 },// BR
  ];
  for (const c of ring) carveRoom(g, c.x, c.y, c.w, c.h, floor);
  corridorV(g, 6, ring[0].y - 1, H - 8, floor, 1);   // lobby → ring BL
  corridorV(g, 6, ring[1].y + ring[1].h, ring[0].y, floor, 1); // BL ↔ TL (left)
  corridorH(g, ring[1].x + ring[1].w, ring[2].x, 7, floor, 1); // TL ↔ TR (top)
  corridorV(g, cx + 3, ring[2].y + ring[2].h, ring[3].y, floor, 1); // TR ↔ BR (right)
  corridorH(g, ring[0].x + ring[0].w, ring[3].x, H - 11, floor, 1); // BL ↔ BR (bottom)

  // THE BACKSTAGE REVEAL: clean staff rooms east, reached by ONE seam punched
  // through the ring's east wall — the map unmasks itself.
  const back: Rect = { x: W - 13, y: 5, w: 11, h: H - 10 };
  carveRoom(g, back.x, back.y, back.w, back.h, floor);
  corridorH(g, ring[2].x + ring[2].w, back.x, 7, floor, 1); // the single seam
  corridorH(g, back.x + back.w, W - 1, midY, floor, 2); // exit throat (east)

  const doors: DoorZone[] = [
    { x: 6, y: H - 1, w: 1, h: 1, to: `${r.id}__gate`, tx: 16, ty: 16, facing: 'down', indicator: 'mat' },
    { x: W - 1, y: midY, w: 1, h: 2, to: `${r.id}__green_room`, tx: 16, ty: 16, facing: 'right', indicator: 'door' },
  ];

  const ph = rest(4, H - 4);
  const band = bandEnemies(r.encounterBand, 'ch9');
  const spawners = risingSpawners(band, [ring[0], ring[1], ring[2]], 1);
  const triggers: TriggerDef[] = [
    { id: 'hoaxula_reveal', rect: { x: back.x, y: back.y, w: back.w, h: back.h }, once: true },
    { id: 'hoaxula_boss', rect: { x: back.x + back.w - 4, y: midY - 1, w: 2, h: 2 }, once: false },
  ];

  // seeded FAKE-SCARE props: a prop springs in a corner of each haunt room
  // (a different prop each seed — the haunt is reshuffled, the bones are not)
  const scares: PropDef[] = [];
  const scareSprites = ['planter', 'sign', 'bench'] as const;
  ring.forEach((c, i) => {
    if (S.chance(`scare${i}`, 0.75)) {
      scares.push(furniture(scareSprites[S.int(`scarekind${i}`, scareSprites.length)], c.x + 1 + S.int(`scarex${i}`, c.w - 2), c.y + 1));
    }
  });

  return sealed(
    draft(r, g.out(), {
      props: [ph.prop, { sprite: 'counter', x: 7, y: H - 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } }, ...scares],
      signs: [{ x: 3, y: H - 6, dialogue: `${r.id}_giftshop` }],
      phones: [ph.phone],
      doors,
      spawners,
      triggers,
    }),
    { entry: [6, H - 2], exit: [W - 2, midY] },
  );
}

/* ===================================================================== *
 * 8. THE SEA OF SILENCE (Ch.10, Mars) — SUBTRACTIVE: three zones generated
 *    at FALLING density (props, then walls, then almost nothing), wired to
 *    the §A6 stem-loss audio. The emptiness curve is DATA — zone N+1 holds
 *    strictly fewer obstacles than zone N (asserted by silenceCurve()).
 * ===================================================================== */
export function buildSeaOfSilence(r: DungeonRecipe): DraftMapDef {
  const [W, H] = size(r, 54, 30, 45, 24);
  const S = new Streams(r.seed);
  const g = new Grid(W, H, 'p'); // plaza — a flat dead surface (mostly open)
  const wall = 'Z';
  const midY = Math.floor(H / 2);
  const zoneW = Math.floor(W / 3);

  // an open crossing the whole way; zones SUBTRACT obstacles as you go deeper
  const densities = [0.16, 0.07, 0.0]; // the FALLING curve (walls + props)
  const props: PropDef[] = [];
  const wallCount = [0, 0, 0];
  for (let z = 0; z < 3; z++) {
    const x0 = z * zoneW + (z === 0 ? 4 : 1); // leave the entrance margin clear
    const x1 = z === 2 ? W - 1 : (z + 1) * zoneW;
    for (let y = 2; y < H - 2; y++) {
      for (let x = x0; x < x1; x++) {
        if (Math.abs(y - midY) <= 1) continue; // keep the central lane clear
        if (S.chance(`empty${z}_${x}_${y}`, densities[z])) {
          if (S.chance(`kind${z}_${x}_${y}`, 0.5)) { g.set(x, y, wall); wallCount[z] += 1; }
          else props.push({ sprite: 'planter', x, y, solid: { ox: 1, oy: 6, w: 20, h: 9 } });
        }
      }
    }
  }
  // guarantee the strictly-falling WALL curve regardless of seed jitter: scrub
  // a later zone's far edge until it holds strictly fewer walls than the prior
  for (let z = 1; z < 3; z++) {
    let x = (z + 1) * zoneW - 1;
    while (wallCount[z] >= wallCount[z - 1] && x > z * zoneW) {
      for (let y = 2; y < H - 2; y++) if (g.rows[y][x] === wall) { g.set(x, y, 'p'); wallCount[z] -= 1; }
      x -= 1;
    }
  }
  corridorH(g, 0, W - 1, midY, 'p', 2); // the clean lane is never subtracted away

  const doors: DoorZone[] = [
    { x: 0, y: midY, w: 1, h: 2, to: `${r.id}__shore`, tx: 16, ty: 16, facing: 'left', indicator: 'none' },
    { x: W - 1, y: midY, w: 1, h: 2, to: `${r.id}__deep`, tx: 16, ty: 16, facing: 'right', indicator: 'door' },
  ];

  const ph = rest(2, midY - 2); // the shore camp, beside the entrance
  props.push(ph.prop);
  const band = bandEnemies(r.encounterBand, 'ch10');
  // ENEMY pressure RISES even as obstacles fall — the dread is the emptiness,
  // the fights are the floor of it. The first zone's spawn starts past the camp.
  const zones: Rect[] = [0, 1, 2].map((z) => {
    const x = z * zoneW + (z === 0 ? 6 : 2);
    const right = z === 2 ? W - 8 : (z + 1) * zoneW; // the deep zone stops clear of the boss touch
    return { x, y: 2, w: Math.max(2, right - x), h: H - 4 };
  });
  const spawners = risingSpawners(band, zones, 1);
  const triggers: TriggerDef[] = [
    { id: 'silence_stemloss', rect: { x: zoneW, y: 2, w: W - zoneW - 2, h: H - 4 }, once: true },
    { id: 'silence_boss', rect: { x: W - 6, y: midY - 1, w: 2, h: 2 }, once: false },
  ];

  return sealed(
    draft(r, g.out(), {
      props,
      signs: [{ x: 3, y: midY - 2, dialogue: `${r.id}_quiet` }],
      phones: [ph.phone],
      doors,
      spawners,
      triggers,
    }),
    { entry: [1, midY], exit: [W - 2, midY] },
  );
}

/** the wall-count curve sea_of_silence promises, deep→shallow (read by the
 *  dungeon test): index 0 is the shallow zone, 2 the near-empty deep zone */
export function silenceCurve(d: DraftMapDef): number[] {
  const W = d.grid[0].length;
  const zoneW = Math.floor(W / 3);
  const counts = [0, 0, 0];
  for (let y = 0; y < d.grid.length; y++) {
    for (let x = 0; x < W; x++) {
      if (d.grid[y][x] === 'Z') counts[Math.min(2, Math.floor(x / zoneW))] += 1;
    }
  }
  return counts;
}
