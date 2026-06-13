/**
 * Chapter 1 maps (ADR-004: code-authored grids behind the same MapDef the
 * future Tiled loader will emit). Legend:
 *   . , ~ grass variants   f F flowers   : path (auto-edged)   b bush
 *   - | fences   s S scorch / ember-flecked scorch
 *   w floor   W wall   r rug
 *   = sidewalk   R D road / dashed centerline   X crosswalk   B brick wall
 *   o office floor   O office wall   c cubicle partition   k cubicle desk
 *   y day sky   u bus floor   U bus wall
 */
import { cityBuildingHeight } from '../spritegen/tiles';
import { Grid, seededRng, treeSprite, doorstepOf } from './mapkit';
import { buildChapter2Maps } from './maps_ch2';

export { Grid, seededRng, treeSprite, doorstepOf } from './mapkit';
import type { MapDef, PropDef } from '../schemas';

// S5: shapes are z.infer'd from src/schemas — compile shape ≡ runtime schema
export type {
  DoorZone,
  MapDef,
  NpcDef,
  PatrolDef,
  PropDef,
  SignDef,
  SpawnerDef,
  TriggerDef,
} from '../schemas';

/** grid char -> tile name (the scene renders from this; tests validate it) */
export const CHAR_LEGEND: Record<string, string> = {
  '.': 'grass_a',
  ' ': 'grass_a', // sprinkle charsets use a space as "plain grass"
  ',': 'grass_b',
  '~': 'grass_tuft',
  f: 'flowers_red',
  F: 'flowers_gold',
  b: 'bush',
  '-': 'fence_h',
  '|': 'fence_v',
  s: 'scorch',
  S: 'scorch_ember',
  w: 'floor_wood',
  W: 'wall_int',
  r: 'rug',
  '=': 'sidewalk',
  R: 'road',
  D: 'road_dash',
  X: 'crosswalk',
  P: 'parking',
  B: 'brick',
  o: 'office_floor',
  O: 'office_wall',
  c: 'cubicle',
  k: 'cubicle_desk',
  y: 'sky_day',
  u: 'bus_floor',
  U: 'bus_wall',
  // S7 street wear (ADR-019) — builder-scattered, all walkable
  '1': 'sidewalk_crack',
  '2': 'road_patch',
  '3': 'storm_drain',
  // S10 STARPORT arcades
  a: 'arcade_floor',
  '*': 'arcade_floor_star',
  A: 'arcade_wall',
  // S12 THE CAGE
  q: 'asphalt',
  z: 'asphalt_crack',
  h: 'asphalt_line_h',
  v: 'asphalt_line_v',
  C: 'cage_mesh',
  // S14 Chapter 2 — the crossing, the port, the jungle, the pyramid
  e: 'sea_a',
  E: 'sea_foam',
  d: 'dock',
  p: 'plaza',
  n: 'sand_a',
  j: 'jungle_floor',
  J: 'jungle_wall',
  Y: 'pyramid_floor',
  Z: 'pyramid_wall',
  G: 'pyramid_glyph',
  g: 'pyramid_rotor',
};

// treeSprite lives in mapkit.ts (S14 extraction — byte-identical)

/* ------------------------------------------------------------------ */

/* ------------------- OTTERBROOK ------------------- */

function buildOtterbrook(): MapDef {
  const g = new Grid(42, 32);
  g.sprinkle(7, ',~,~ff F', 0.06);
  // main street (vertical) + cross lane
  g.rect(20, 1, 2, 30, ':');
  g.rect(4, 16, 34, 2, ':');
  // spurs to the buildings
  g.rect(7, 8, 1, 8, ':');
  g.rect(13, 8, 1, 8, ':');
  g.rect(27, 8, 1, 8, ':');
  g.rect(33, 8, 1, 8, ':');
  g.rect(8, 18, 1, 4, ':');
  g.rect(33, 18, 1, 4, ':');
  g.rect(26, 13, 2, 3, ':');
  // park hedges (S10: the north run stops short of the STARPORT's doorstep —
  // tiles 7-8 are the arcade door's landing now that the facade is real)
  g.rect(3, 22, 4, 1, 'b');
  g.rect(3, 28, 6, 1, 'b');
  g.rect(13, 23, 1, 3, 'b');
  // fences by the lemonade corner
  g.rect(10, 12, 6, 1, '-');
  // flower beds near chapel
  g.rect(30, 24, 3, 1, 'f');
  g.rect(36, 24, 3, 1, 'F');

  const treeLine: Array<[number, number]> = [];
  for (let x = 0; x < 42; x += 2) {
    if (x < 18 || x > 23) treeLine.push([x, 0]); // north wall except hill gap
    treeLine.push([x, 30]);
  }
  for (let y = 2; y < 30; y += 2) {
    treeLine.push([0, y]);
    treeLine.push([40, y]);
  }
  // park cluster
  treeLine.push([5, 24], [10, 26], [4, 26], [11, 23]);
  // inner greens (S7e: "more trees") — verified clear of the porch trigger,
  // bus corner, lemonade stand, phone, doorsteps, and spawner save-spots
  treeLine.push([3, 12], [37, 18], [18, 11], [24, 19]);

  return {
    id: 'otterbrook',
    name: 'OTTERBROOK, OHIO',
    music: 'otterbrook',
    settlement: 'town',
    grid: g.out(),
    props: [
      ...treeLine.map(([x, y]) => ({
        sprite: treeSprite(x, y),
        x,
        y,
        solid: { ox: 7, oy: 22, w: 12, h: 10 },
      })),
      // telephone poles along the cross lane (S7) — wires span pole to pole.
      // Visual only, no solid: never traps an old save (S6 rule).
      ...[9.875, 17.875, 25.875, 33.875].map((x) => ({
        sprite: 'phone_pole',
        x,
        y: 16.375,
      })),
      // trash cans on the verges, ≥2 tiles from every door/phone/trigger
      { sprite: 'trash_can', x: 4, y: 8, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'trash_can', x: 37, y: 9, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      {
        sprite: 'house_rex',
        x: 5,
        y: 2,
        solid: { ox: 0, oy: 20, w: 66, h: 46 },
        // zone reaches below the collision floor so the doorstep is walkable
        door: { ox: 32, oy: 52, w: 14, h: 28, to: 'rex_home', tx: 104, ty: 124 },
      },
      { sprite: 'house_chad', x: 11, y: 2, solid: { ox: 0, oy: 20, w: 66, h: 46 } },
      { sprite: 'house_a', x: 25, y: 2, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      { sprite: 'house_b', x: 31, y: 2, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      {
        sprite: 'drugstore',
        x: 24,
        y: 8,
        solid: { ox: 0, oy: 20, w: 82, h: 56 },
        // S4: a real door now (zone reaches below the collision floor, ADR-011)
        door: { ox: 33, oy: 64, w: 16, h: 28, to: 'drugstore_int', tx: 112, ty: 118 },
      },
      {
        sprite: 'arcade',
        x: 6,
        y: 17,
        solid: { ox: 0, oy: 20, w: 66, h: 56 },
        // S10: the STARPORT opens (zone reaches below the collision floor,
        // ADR-011; the interior's street exit derives from this via doorstepOf)
        door: { ox: 17, oy: 64, w: 16, h: 28, to: 'arcade_int', tx: 80, ty: 102 },
      },
      {
        sprite: 'chapel',
        x: 31,
        y: 16,
        solid: { ox: 0, oy: 30, w: 50, h: 60 },
        // S14 (Prompt 25): the chapel opens — zone reaches below the floor
        door: { ox: 17, oy: 78, w: 16, h: 30, to: 'chapel_int', tx: 88, ty: 150 },
      },
      { sprite: 'lemonade', x: 14, y: 13, solid: { ox: 0, oy: 10, w: 36, h: 18 } },
      { sprite: 'picnic', x: 6, y: 25, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'bus_sign', x: 23, y: 25, solid: { ox: 4, oy: 18, w: 6, h: 6 } },
      { sprite: 'phone_table', x: 28, y: 14, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      { sprite: 'bug_zapper', x: 16, y: 4, solid: { ox: 4, oy: 18, w: 6, h: 8 } },
      // S9 §A10 #1: the sniff trail's first clue — paw prints at the
      // trailhead, visible only mid-trail (walkable marking, no solid)
      { sprite: 'paw_prints', x: 19, y: 2.4, ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' },
    ],
    npcs: [
      {
        id: 'mrs_pemmel',
        sprite: 'mrsPemmel',
        x: 8,
        y: 23,
        facing: 'down',
        dialogue: 'npc_pemmel',
      },
      // S9: Biscuit holds the park until dawn (the §A10 #1 quest takes him),
      // and comes home — collar and all — once the trail is walked
      { id: 'biscuit', sprite: 'dog', x: 10, y: 24, facing: 'left', dialogue: 'npc_biscuit', dog: true, unlessFlag: 'zapper_done' },
      { id: 'biscuit_home', sprite: 'dog', x: 10, y: 24, facing: 'left', dialogue: 'npc_biscuit_collar', dog: true, ifFlag: 'q_biscuit_done' },
      {
        id: 'mr_plummer',
        sprite: 'mrPlummer',
        x: 22,
        y: 10,
        facing: 'down',
        dialogue: 'npc_plummer',
        wander: true,
      },
      { id: 'ana', sprite: 'ana', x: 15, y: 15, facing: 'down', dialogue: 'npc_ana' },
      { id: 'vivi', sprite: 'vivi', x: 17, y: 15, facing: 'down', dialogue: 'npc_vivi' },
      // S15c: the town reacts to the night, then to the morning after it
      { id: 'old_timer', sprite: 'oldTimer', x: 35, y: 22, facing: 'down', dialogue: 'npc_oldtimer', dialogueDay: 'npc_oldtimer_day', wander: true },
      { id: 'pajama_kid', sprite: 'pajamaKid', x: 24, y: 19, facing: 'left', dialogue: 'npc_pajama', dialogueDay: 'npc_pajama_day', wander: true },
    ],
    signs: [
      { x: 18, y: 27, dialogue: 'sign_welcome' },
      { x: 23, y: 14, dialogue: 'sign_hill' },
      { x: 30, y: 21, dialogue: 'sign_chapel' },
      // S9 §A10 #1: sniff clue 1 (under the paw prints, same gates)
      { x: 19, y: 2, dialogue: 'q_biscuit_clue1', ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' },
    ],
    phones: [{ x: 28, y: 14 }],
    doors: [
      // ADR-042: town's north edge now climbs HILL ROAD before the trail
      { x: 18, y: 0, w: 6, h: 1, to: 'hill_road', tx: 236, ty: 506, facing: 'up' },
    ],
    spawners: [
      {
        enemies: ['cranky_mailbox'],
        count: 1,
        rect: { x: 29, y: 19, w: 8, h: 4 },
        ifFlag: 'meteor_fell',
      },
      {
        enemies: ['runaway_lawnmower'],
        count: 1,
        rect: { x: 4, y: 23, w: 8, h: 5 },
        ifFlag: 'meteor_fell',
      },
      {
        enemies: ['pigeon_gang'],
        count: 1,
        rect: { x: 25, y: 22, w: 10, h: 5 },
        ifFlag: 'meteor_fell',
      },
      // S9 §A10 #2: Mr. Sodd's Runaway Lawnmower patrols his front yard
      // while his letter waits — one of the five doors, guarded (canon)
      {
        enemies: ['runaway_lawnmower'],
        count: 1,
        rect: { x: 25, y: 7, w: 3, h: 1 },
        ifFlag: 'q_mail',
        unlessFlag: 'q_mail_sodd',
      },
    ],
    triggers: [
      { id: 'bus_stop', rect: { x: 22, y: 24, w: 3, h: 3 }, once: false },
      { id: 'porch', rect: { x: 6, y: 6, w: 4, h: 2 }, once: true },
    ],
  };
}

/* ------------------- HILL ROAD (ADR-042) ------------------- */

/**
 * The last neighborhood before the trail — inserted between town and the
 * crater so the search for the meteor is a real walk (user law). A
 * switchback climb with fence-railed drops, three locked homes on a lane,
 * §A7 Ch.1 enemies woken by the fall, and Biscuit already up here at 2 AM,
 * pointing at the hill (he was right; he is ALWAYS right — quest #1 and the
 * finale's "Biscuit pointed at the sky and BARKED" both pay this off).
 */
function buildHillRoad(): MapDef {
  const g = new Grid(30, 34);
  g.sprinkle(21, ',~,~ ff', 0.07);
  // the road: town mouth → home lane → west climb → east climb → summit
  g.rect(13, 28, 4, 6, ':');
  g.rect(4, 26, 22, 2, ':');
  g.rect(4, 18, 2, 8, ':');
  g.rect(4, 18, 20, 2, ':');
  g.rect(22, 10, 2, 8, ':');
  g.rect(11, 10, 13, 2, ':');
  g.rect(13, 0, 4, 10, ':');
  // bush walls force the switchbacks (the homes block their own stretch)
  g.rect(10, 21, 8, 1, 'b');
  g.rect(22, 21, 2, 1, 'b');
  g.rect(4, 14, 17, 1, 'b');
  g.rect(17, 6, 9, 1, 'b');
  g.rect(4, 6, 8, 1, 'b');
  // fence rails along the drops — the "winding cliff" read
  g.rect(6, 17, 15, 1, '-');
  g.rect(11, 9, 2, 1, '-');
  g.rect(17, 9, 5, 1, '-');
  g.rect(6, 24, 3, 1, '-');

  const trees: Array<[number, number]> = [];
  for (let x = 0; x < 30; x += 2) {
    if (x < 12 || x > 18) {
      trees.push([x, 0]);
      trees.push([x, 32]);
    }
  }
  for (let y = 2; y < 32; y += 2) {
    trees.push([0, y]);
    trees.push([28, y]);
  }
  trees.push([7, 3], [20, 3], [25, 7], [3, 11], [8, 12], [26, 12], [2, 16], [26, 16], [10, 16]);

  return {
    id: 'hill_road',
    name: 'HILL ROAD',
    music: 'hill',
    // night rides the §A6 story clock with otterbrook/hickory_hill (S9b)
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      { sprite: 'house_a', x: 6, y: 21.8, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      { sprite: 'house_b', x: 18, y: 21.8, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      { sprite: 'house_a', x: 24, y: 21.8, solid: { ox: 0, oy: 20, w: 50, h: 46 } },
      { sprite: 'phone_pole', x: 10.5, y: 24.4, solid: { ox: 5, oy: 26, w: 6, h: 6 } },
      { sprite: 'phone_pole', x: 22.5, y: 24.4, solid: { ox: 5, oy: 26, w: 6, h: 6 } },
      { sprite: 'trash_can', x: 26, y: 26.2, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 17, y: 29, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // §A10 #1: the sniff trail crosses the road (same window as the hill clue)
      { sprite: 'paw_prints', x: 15, y: 13.4, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
    ],
    npcs: [
      // the dog with opinions about the sky, already on the case (cameo —
      // he keeps the park bench in town for the §A10 #1 machine itself)
      // (dog sheets are east/west only — the POINTING is in the dialogue)
      // S15c: the pointing dog has TWO opinions — the hill before the Tick
      // falls, YOU after (tick_defeated implies hidden post-dawn for the
      // first; the second retires at zapper_done exactly like the old gate)
      { id: 'biscuit_road', sprite: 'dog', x: 15, y: 3, facing: 'right', dialogue: 'npc_biscuit_road', dog: true, unlessFlag: 'tick_defeated' },
      { id: 'biscuit_road_after', sprite: 'dog', x: 15, y: 3, facing: 'right', dialogue: 'npc_biscuit_road_after', dog: true, ifFlag: 'tick_defeated', unlessFlag: 'zapper_done' },
    ],
    signs: [
      { x: 17, y: 29, dialogue: 'sign_hill_road' },
      { x: 7, y: 25, dialogue: 'hill_house_a' },
      { x: 19, y: 25, dialogue: 'locked_house' },
      { x: 25, y: 25, dialogue: 'hill_house_b' },
      { x: 15, y: 13, dialogue: 'hill_road_prints', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
    ],
    phones: [],
    doors: [
      { x: 13, y: 33, w: 4, h: 1, to: 'otterbrook', tx: 336, ty: 24, facing: 'down' },
      { x: 13, y: 0, w: 4, h: 1, to: 'hickory_hill', tx: 232, ty: 660, facing: 'up' },
    ],
    spawners: [
      { enemies: ['coily_cicada'], count: 2, rect: { x: 6, y: 11, w: 16, h: 6 }, ifFlag: 'meteor_fell' },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 6, y: 18, w: 14, h: 4 }, ifFlag: 'meteor_fell' },
      // a mailbox prowling the home lane — it has COMPLAINTS
      { enemies: ['cranky_mailbox'], count: 1, rect: { x: 18, y: 25, w: 8, h: 3 }, ifFlag: 'meteor_fell' },
    ],
    triggers: [],
  };
}

/* ------------------- HICKORY HILL ------------------- */

function buildHill(): MapDef {
  const g = new Grid(30, 46);
  g.sprinkle(13, ',~,~ f', 0.07);
  // winding trail: south entrance to crater
  g.rect(14, 41, 2, 5, ':');
  g.rect(8, 34, 8, 2, ':');
  g.rect(8, 28, 2, 8, ':');
  g.rect(8, 28, 14, 2, ':');
  g.rect(20, 20, 2, 10, ':');
  g.rect(10, 20, 12, 2, ':');
  g.rect(10, 12, 2, 10, ':');
  g.rect(10, 12, 8, 2, ':');
  g.rect(14, 41, 2, 1, ':');
  // crater (top center): scorched bowl
  g.rect(10, 3, 10, 7, 's');
  g.rect(12, 4, 6, 5, 'S');
  // brush walls shaping the switchbacks
  g.rect(4, 31, 4, 1, 'b');
  g.rect(18, 34, 6, 1, 'b');
  g.rect(5, 24, 3, 1, 'b');
  g.rect(24, 24, 3, 1, 'b');
  g.rect(13, 16, 5, 1, 'b');
  // fences along one drop
  g.rect(6, 38, 8, 1, '-');

  const trees: Array<[number, number]> = [];
  for (let x = 0; x < 30; x += 2) {
    trees.push([x, 0]);
    if (x < 12 || x > 17) trees.push([x, 44]);
  }
  for (let y = 2; y < 44; y += 2) {
    trees.push([0, y]);
    trees.push([28, y]);
  }
  trees.push([5, 18], [23, 14], [6, 10], [24, 31], [17, 25], [4, 35]);

  return {
    id: 'hickory_hill',
    name: 'HICKORY HILL',
    music: 'hill',
    // night follows the §A6 story clock (2 AM until zapper_done), not a
    // permanent flag — dawn reaches the hill too (S9b)
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      { sprite: 'meteor_rock', x: 14, y: 5, solid: { ox: 1, oy: 8, w: 28, h: 14 } },
      { sprite: 'picnic', x: 11, y: 23, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'sign', x: 12, y: 39, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // S9 §A10 #1: sniff clue 2 — prints by the picnic table, mid-trail only
      { sprite: 'paw_prints', x: 14, y: 23.4, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
    ],
    npcs: [],
    signs: [
      { x: 12, y: 39, dialogue: 'sign_trail' },
      // S9 §A10 #1: sniff clue 2 (under the prints, same gates)
      { x: 14, y: 23, dialogue: 'q_biscuit_clue2', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
      // S9 §A10 #3: the spring the Lemonade Empire claimed long ago —
      // always here; the jug-fill beat branches in the scene (ADR-014)
      { x: 9, y: 21, dialogue: 'hill_spring' },
    ],
    phones: [],
    doors: [{ x: 13, y: 45, w: 4, h: 1, to: 'hill_road', tx: 236, ty: 36, facing: 'down' }],
    spawners: [
      { enemies: ['coily_cicada'], count: 3, rect: { x: 6, y: 18, w: 18, h: 8 } },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 6, y: 28, w: 16, h: 8 } },
      { enemies: ['hill_slug_deluxe'], count: 1, rect: { x: 10, y: 12, w: 12, h: 6 } },
    ],
    triggers: [{ id: 'crater', rect: { x: 11, y: 8, w: 8, h: 3 }, once: true }],
  };
}

/* ------------------- INTERIORS ------------------- */

function buildRexHome(): MapDef {
  const g = new Grid(14, 10, 'w');
  g.rect(0, 0, 14, 2, 'W');
  g.rect(4, 4, 3, 2, 'r');
  return {
    id: 'rex_home',
    name: "{rex}'S HOUSE",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'sofa', x: 2, y: 4, solid: { ox: 0, oy: 4, w: 34, h: 14 } },
      { sprite: 'counter', x: 9, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'phone_table', x: 1, y: 2, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      // S7 furnishings, mounted into the wall band so no walkable ground is
      // lost (the wall tiles already collide; the lamp's small solid sits
      // clear of the phone-save spot — S6 rule)
      { sprite: 'tv', x: 2.8, y: 0.6 },
      { sprite: 'floor_lamp', x: 5.5, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'bookshelf', x: 7.5, y: 0 },
      { sprite: 'stove', x: 11, y: 0.5 },
    ],
    npcs: [{ id: 'mom', sprite: 'mom', x: 9, y: 5, facing: 'down', dialogue: 'npc_mom' }],
    signs: [],
    phones: [{ x: 1, y: 2 }],
    doors: [
      // ty lands just south of the (now taller) doorstep zone — no re-entry loop
      { x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: 120, ty: 117, facing: 'down', indicator: 'mat' },
      // S9b: the stairs land on the upstairs hall (three bedrooms up there now)
      { x: 12, y: 9, w: 2, h: 1, to: 'rex_hall', tx: 228, ty: 80, facing: 'left', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildBedroom(): MapDef {
  const g = new Grid(10, 8, 'w');
  g.rect(0, 0, 10, 2, 'W');
  g.rect(4, 4, 2, 2, 'r');
  return {
    id: 'rex_bedroom',
    name: "{rex}'S ROOM",
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 6, y: 2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'dresser', x: 7.8, y: 0.3 }, // against the wall band (S7)
    ],
    npcs: [],
    signs: [],
    phones: [],
    // S9b: the bedroom opens onto the upstairs hall — the house grew a wing
    doors: [{ x: 3, y: 7, w: 2, h: 1, to: 'rex_hall', tx: 44, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [{ id: 'wake_up', rect: { x: 0, y: 0, w: 10, h: 8 }, once: true }],
  };
}

/* ---------- S9b: the upstairs wing — hall + the twins' HQ (§A10 #3 amend:
 * Ana & Vivi are Jay's little sisters; the stand is the branch office) ---- */

function buildRexHall(): MapDef {
  const g = new Grid(16, 7, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(2, 3, 12, 2, 'r'); // the runner rug, worn down the middle
  return {
    id: 'rex_hall',
    name: 'UPSTAIRS',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bookshelf', x: 4.6, y: 0 },
      { sprite: 'floor_lamp', x: 10.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'plant_pot', x: 0.4, y: 4.6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [],
    signs: [
      { x: 6, y: 1, dialogue: 'hall_photos' },
      { x: 9, y: 1, dialogue: 'hall_window' },
    ],
    phones: [],
    doors: [
      // S11b: doorways through the wall are DOORS (user law) — they swing
      // open before they admit you; mats stay legal only at bottom edges
      { x: 2, y: 2, w: 2, h: 1, to: 'rex_bedroom', tx: 56, ty: 96, facing: 'up', indicator: 'door' },
      { x: 7, y: 2, w: 2, h: 1, to: 'ana_room', tx: 72, ty: 100, facing: 'up', indicator: 'door' },
      { x: 12, y: 2, w: 2, h: 1, to: 'vivi_room', tx: 72, ty: 100, facing: 'up', indicator: 'door' },
      { x: 15, y: 4, w: 1, h: 2, to: 'rex_home', tx: 200, ty: 132, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildAnaRoom(): MapDef {
  const g = new Grid(9, 8, 'w');
  g.rect(0, 0, 9, 2, 'W');
  g.rect(3, 4, 2, 2, 'r');
  return {
    id: 'ana_room',
    name: "ANA'S ROOM",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 5, y: 2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
      { sprite: 'dresser', x: 7.2, y: 0.3 },
      // her present for Jay — opened, the box stays (EB keeps its trash)
      { sprite: 'gift_box', x: 6, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'ana_gift_open' },
      { sprite: 'gift_box_open', x: 6, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'ana_gift_open' },
    ],
    npcs: [],
    signs: [
      { x: 6, y: 1, dialogue: 'ana_chart' },
      { x: 1, y: 2, dialogue: 'ana_bed' },
      { x: 6, y: 5, dialogue: 'gift_ana', unlessFlag: 'ana_gift_open' },
      { x: 6, y: 5, dialogue: 'gift_ana_done', ifFlag: 'ana_gift_open' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'rex_hall', tx: 124, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

function buildViviRoom(): MapDef {
  const g = new Grid(9, 8, 'w');
  g.rect(0, 0, 9, 2, 'W');
  g.rect(4, 4, 2, 2, 'r');
  return {
    id: 'vivi_room',
    name: "VIVI'S ROOM",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 6, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'bookshelf', x: 1.2, y: 0 }, // the ledgers. all of them.
      { sprite: 'tv', x: 6.6, y: 0.6 },
      { sprite: 'gift_box', x: 2, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'vivi_gift_open' },
      { sprite: 'gift_box_open', x: 2, y: 4.6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'vivi_gift_open' },
    ],
    npcs: [],
    signs: [
      { x: 2, y: 1, dialogue: 'vivi_jar' },
      { x: 6, y: 2, dialogue: 'vivi_bed' },
      { x: 2, y: 5, dialogue: 'gift_vivi', unlessFlag: 'vivi_gift_open' },
      { x: 2, y: 5, dialogue: 'gift_vivi_done', ifFlag: 'vivi_gift_open' },
    ],
    phones: [],
    doors: [{ x: 4, y: 7, w: 2, h: 1, to: 'rex_hall', tx: 204, ty: 60, facing: 'down', indicator: 'mat' }],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- BRICKTON CITY (S1, organic layout per ADR-012) ------------------- */

/** where the bus drops you — OverworldScene's bus flow reads this */
export const BRICKTON_BUS_SPAWN = { x: 88, y: 476 } as const;

/**
 * A real downtown, not a strip: two E-W streets stitched by a cross avenue,
 * buildings in three clusters with jittered placement and varied heights,
 * a parking lot, an irregular park, alleys you can cut through. All
 * irregularity comes from one fixed seed (1995 — the summer it fell) so the
 * city is sporadic to the eye but identical on every boot.
 */
function buildBrickton(): MapDef {
  const rng = seededRng(1995);
  const jit = (n: number): number => Math.floor(rng() * n);

  const g = new Grid(72, 38, '=');
  // bounds + the brick spine the north row backs onto
  g.rect(0, 0, 72, 1, 'B');
  g.rect(0, 0, 1, 38, 'B');
  g.rect(71, 0, 1, 38, 'B');
  g.rect(0, 37, 72, 1, 'B');
  g.rect(1, 1, 70, 5, 'B');
  // three streets + two avenues: Brickton is a real city block now, not a strip
  g.rect(1, 8, 70, 3, 'R');
  g.rect(1, 21, 70, 3, 'R');
  g.rect(25, 31, 46, 3, 'R');
  g.rect(25, 8, 3, 26, 'R');
  g.rect(58, 21, 3, 13, 'R');
  // dashed centerlines, phase-shifted per street, broken at the avenue + crossings
  const skipA = new Set([17, 18, 23, 24, 25, 26, 27]);
  const skipB = new Set([25, 26, 27, 28, 29]);
  for (let x = 1; x < 71; x++) {
    if (x % 4 < 2 && !skipA.has(x)) g.set(x, 9, 'D');
    if ((x + 2) % 4 < 2 && !skipB.has(x)) g.set(x, 22, 'D');
    if ((x + 1) % 4 < 2 && x >= 25 && x < 71 && ![58, 59, 60].includes(x)) g.set(x, 32, 'D');
  }
  // crosswalks: by the hospital, and flanking the avenue at each street
  g.rect(17, 8, 2, 3, 'X');
  g.rect(23, 8, 2, 3, 'X');
  g.rect(28, 21, 2, 3, 'X');
  g.rect(57, 21, 2, 3, 'X');
  g.rect(25, 30, 3, 2, 'X');
  g.rect(58, 30, 3, 2, 'X');
  // west mid-block: the parking lot (always emptier than it should be)
  g.rect(2, 13, 8, 5, 'P');
  // east mid-block: the park — corners nibbled so it isn't a rectangle
  g.rect(41, 13, 13, 6, '.');
  g.rect(41, 13, 1 + jit(3), 1, '=');
  g.rect(53 - jit(3), 13, 3, 1, '=');
  g.rect(41, 18, 2 + jit(3), 1, '=');
  g.rect(52 - jit(2), 18, 3, 1, '=');
  // east plaza: civic clock, public notices, and too much sidewalk
  g.rect(58, 12, 11, 7, '.');
  g.rect(61, 14, 5, 3, '=');
  g.rect(66, 16, 3, 2, '=');
  // south market lot: buses, deliveries, and pigeons with committees
  g.rect(3, 28, 9, 5, 'P');
  g.rect(34, 25, 11, 4, '.');
  // S14: the EAST GAP — street B runs out the wall to the DOCKS (a plain
  // g.set pair consumes NO rng; every seeded stream stays byte-identical)
  g.rect(71, 21, 1, 3, 'R');
  // SE vacant lot behind its fence — S12: the fence gains a GATE (one tile
  // swapped walkable; a plain g.set consumes NO rng, so the 1995 stream and
  // the whole jittered layout stay byte-identical, ADR-016's rule). The
  // FUTURE SITE finally arrived, and it's a basketball cage.
  g.rect(47, 26, 7, 1, '-');
  g.set(50, 26, '=');
  g.rect(47, 27, 1, 3, '|');
  g.rect(53, 27, 1, 3, '|');
  g.rect(48, 27, 5, 3, '.');
  // hedge fragments along the south edge — broken, like real municipal hedges
  let hx = 18;
  while (hx < 68) {
    const len = 2 + jit(3);
    if (rng() < 0.75) g.rect(hx, 35, len, 1, 'b');
    hx += len + 1 + jit(3);
  }
  g.sprinkle(95, ',~ff F', 0.16); // grass fuzz in the park + the lot

  /* ---- buildings: three clusters, jittered, height-varied ---- */
  interface Bldg {
    sprite: string;
    w: number;
    u: 1 | 2 | 3;
    x: number;
  }
  const north: Bldg[] = [
    { sprite: 'bldg_starmart', w: 5, u: 1, x: 2 + jit(2) },
    { sprite: 'bldg_brickmore', w: 5, u: 3, x: 9 + jit(2) },
    { sprite: 'bldg_hospital', w: 7, u: 2, x: 16 + jit(2) },
    { sprite: 'bldg_dept', w: 8, u: 2, x: 29 + jit(2) },
    { sprite: 'bldg_bank', w: 6, u: 2, x: 41 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 51 + jit(2) },
    { sprite: 'bldg_diner', w: 4, u: 1, x: 58 + jit(2) },
  ];
  for (let i = 1; i < north.length; i++) {
    const min = north[i - 1].x + north[i - 1].w + 1; // never overlap, alleys allowed
    if (north[i].x < min) north[i].x = min;
  }
  const midWest: Bldg[] = [
    { sprite: 'bldg_bagels', w: 4, u: 1, x: 11 + jit(2) },
    { sprite: 'bldg_arcade2', w: 5, u: 1, x: 16 + jit(3) },
  ];
  if (midWest[1].x < midWest[0].x + midWest[0].w) midWest[1].x = midWest[0].x + midWest[0].w; // touching = rowhouse
  if (midWest[1].x + midWest[1].w > 24) midWest[1].x = 24 - midWest[1].w; // stay west of the avenue
  const midEast: Bldg[] = [
    { sprite: 'bldg_diner', w: 4, u: 1, x: 29 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 35 + jit(2) },
  ];
  if (midEast[1].x < midEast[0].x + midEast[0].w) midEast[1].x = midEast[0].x + midEast[0].w;
  const south: Bldg[] = [
    { sprite: 'bldg_bagels', w: 4, u: 1, x: 30 + jit(2) },
    { sprite: 'bldg_brickmore', w: 5, u: 2, x: 37 + jit(2) },
    { sprite: 'bldg_diner', w: 4, u: 1, x: 46 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 53 + jit(2) },
    { sprite: 'bldg_bank', w: 6, u: 2, x: 61 + jit(2) },
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
      // the solid covers the FACADE down to the doorstep — oy:10 (was 26) so a
      // player can't walk horizontally ACROSS the upper floors (the "walk
      // through buildings at some angles" bug); the bottom stays at H-12 so the
      // door zone below it is still reachable, and depth-sort occludes a hero
      // pressed against the back, so there's no head-above-roof to see.
      solid: { ox: 0, oy: 10, w: b.w * 16 + 2, h: H - 22 },
    };
    if (b.sprite === 'bldg_dept') {
      prop.door = { ox: 44, oy: H - 14, w: 26, h: 18, to: 'dos_f1', tx: 208, ty: 234 };
    }
    // S4: STARMART opens for business (the zone reaches below the collision
    // floor, ADR-011; the return doorstep is derived from this jittered prop)
    if (b.sprite === 'bldg_starmart') {
      prop.door = { ox: 33, oy: H - 14, w: 16, h: 18, to: 'starmart_int', tx: 144, ty: 150 };
    }
    // S10: STARPORT II opens (§A10 #4's venue) — same doorAt-2 facade rect as
    // STARMART; assigning a door consumes NO rng, so the 1995 stream and the
    // whole jittered layout stay byte-identical (ADR-016's rule)
    if (b.sprite === 'bldg_arcade2') {
      prop.door = { ox: 33, oy: H - 14, w: 16, h: 18, to: 'arcade2_int', tx: 128, ty: 134 };
    }
    // S14 (Prompt 25): BRICKTON GENERAL opens — the dept's doubleDoor rect
    if (b.sprite === 'bldg_hospital') {
      prop.door = { ox: 44, oy: H - 14, w: 26, h: 18, to: 'hospital_int', tx: 152, ty: 166 };
    }
    bldgProps.push(prop);
    return prop;
  };
  north.forEach((b) => place(b, 112)); // doors open onto street A's sidewalk
  [...midWest, ...midEast].forEach((b) => place(b, 304)); // doors face street B
  south.forEach((b) => place(b, 464)); // doors face the new market street

  /* ---- scattered street life ---- */
  const trees: Array<[number, number]> = [[33, 13]]; // lone back-alley tree
  for (const [tx, ty] of [[42, 13], [49, 14], [43, 17], [51, 16], [46, 13]] as const) {
    if (rng() < 0.75) trees.push([tx, ty]);
  }
  for (const [tx, ty] of [[19, 27], [31, 28], [39, 27], [44, 28], [12, 28]] as const) {
    if (rng() < 0.6) trees.push([tx, ty]);
  }
  for (const [tx, ty] of [[63, 14], [67, 17], [36, 26], [41, 27], [8, 30], [65, 35]] as const) {
    if (rng() < 0.68) trees.push([tx, ty]);
  }

  const FURN_SOLID: Record<string, { ox: number; oy: number; w: number; h: number }> = {
    bench: { ox: 1, oy: 6, w: 20, h: 6 },
    hydrant: { ox: 2, oy: 8, w: 6, h: 5 },
    planter: { ox: 1, oy: 6, w: 20, h: 9 },
  };
  const furniture: PropDef[] = [];
  for (let fx = 18; fx <= 44; fx += 4 + jit(3)) {
    if (rng() < 0.45) continue;
    const sprite = (['bench', 'hydrant', 'planter'] as const)[jit(3)];
    furniture.push({ sprite, x: fx, y: 26, solid: FURN_SOLID[sprite] });
  }
  // a little clutter on sidewalk B too — but never in front of a door
  const doorCols = new Set(
    [...midWest, ...midEast].flatMap((b) => {
      const d = b.x + (b.sprite === 'bldg_arcade2' || b.sprite === 'bldg_video' ? 2 : 1);
      return [d - 1, d, d + 1];
    }),
  );
  for (const fx of [13, 22, 31, 40]) {
    if (rng() < 0.55 || doorCols.has(fx)) continue;
    const sprite = (['hydrant', 'planter'] as const)[jit(2)];
    furniture.push({ sprite, x: fx, y: 19, solid: FURN_SOLID[sprite] });
  }
  for (const fx of [30, 35, 44, 51, 57, 66]) {
    if (rng() < 0.35) continue;
    const sprite = (['bench', 'hydrant', 'planter'] as const)[jit(3)];
    furniture.push({ sprite, x: fx, y: 29, solid: FURN_SOLID[sprite] });
  }

  // alley dumpsters: one in the starmart-brickmore gap, one by the parking lot
  const alleyX = north[0].x + north[0].w + 0.1;
  const picnicX = 44 + jit(2);

  /* ---- S7 street wear + 90s furniture (ADR-019) ----
   * A SEPARATE seeded stream: the 1995 rng above is fully consumed before
   * this point, so the original jittered layout stays byte-identical
   * (ADR-016's rule). Everything here is either walkable tile wear or a
   * prop placed with clearance checks against doors/phones/triggers. */
  const rng2 = seededRng(2077);
  const jit2 = (n: number): number => Math.floor(rng2() * n);
  // sidewalk cracks — pure tile swaps, nothing moves
  for (let y = 6; y < 37; y++) {
    for (let x = 1; x < 71; x++) {
      if (g.rows[y][x] === '=' && rng2() < 0.045) g.set(x, y, '1');
    }
  }
  // tar patches on plain road cells
  for (const [py, x0] of [
    [9, 4],
    [10, 30],
    [22, 12],
    [23, 44],
    [32, 34],
    [32, 62],
  ] as const) {
    const x = x0 + jit2(8);
    if (g.rows[py][x] === 'R') g.set(x, py, '2');
  }
  // storm drains against each curb, clear of crosswalks
  for (const x of [5 + jit2(3), 20, 33 + jit2(3), 47]) {
    if (g.rows[8][x] === 'R') g.set(x, 8, '3');
  }
  for (const x of [9 + jit2(3), 36 + jit2(3), 51]) {
    if (g.rows[21][x] === 'R') g.set(x, 21, '3');
  }
  for (const x of [31 + jit2(3), 49 + jit2(3), 64]) {
    if (g.rows[31][x] === 'R') g.set(x, 31, '3');
  }

  // telephone poles: bases on the mid-block strip and the south sidewalk so
  // the sagging spans cross each street. Visual only — no solid (S6 rule).
  const poles: PropDef[] = [];
  for (const cx of [6, 14, 22, 30, 38, 46]) {
    if (cx === 22 || cx === 30) continue; // keep the avenue mouth clear
    poles.push({ sprite: 'phone_pole', x: cx - 4.125, y: 9.125 });
  }
  for (const cx of [10, 18, 34, 42, 50]) {
    poles.push({ sprite: 'phone_pole', x: cx - 4.125, y: 22.125 });
  }
  for (const cx of [32, 44, 56, 68]) {
    poles.push({ sprite: 'phone_pole', x: cx - 4.125, y: 32.125 });
  }

  // parking meters + newspaper boxes on sidewalk B, never at a door column
  // and never on a column the S1 furniture already took
  const occupied = new Set(furniture.map((f) => `${f.x},${f.y}`));
  const meters: PropDef[] = [];
  for (const mx of [12, 21, 30, 39, 48, 57, 66]) {
    if (doorCols.has(mx) || occupied.has(`${mx},19`)) continue;
    if (rng2() < 0.3) continue;
    meters.push({ sprite: 'parking_meter', x: mx + 0.3, y: 18.6, solid: { ox: 3, oy: 14, w: 4, h: 6 } });
  }
  meters.push({ sprite: 'news_box', x: 2.5, y: 25.4, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
  const nbx = midEast[1].x + 5;
  if (!doorCols.has(nbx)) {
    meters.push({ sprite: 'news_box', x: nbx, y: 18.7, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
  }
  meters.push({ sprite: 'news_box', x: 61.5, y: 28.8, solid: { ox: 2, oy: 12, w: 12, h: 7 } });
  // trash cans in the north alley gaps (between building solids, row 6)
  for (let i = 1; i < north.length; i++) {
    const gapStart = north[i - 1].x + north[i - 1].w + 0.2;
    const gapEnd = north[i].x;
    if (gapEnd - gapStart < 1.2) continue;
    if (rng2() < 0.4) continue;
    meters.push({ sprite: 'trash_can', x: gapStart, y: 5.9, solid: { ox: 2, oy: 10, w: 10, h: 7 } });
  }

  /* ---- street trees (S7e, user direction: "more trees in the cities") ----
   * EB's Twoson lines its blocks with trees. Same discipline as everything
   * above: rng2 stream (1995 layout untouched), standard tree solid, and
   * clearance from the avenue mouth, poles, doors, the payphone/bus corner,
   * and whatever the jittered furniture already claimed. */
  const streetTrees: Array<[number, number]> = [];
  const usedCols = new Set<number>();
  for (const f of [...furniture, ...meters]) {
    const fx = Math.round(f.x);
    usedCols.add(fx - 1).add(fx).add(fx + 1);
  }
  // mid-block strip between the parking lot and street B (bases on row ~12)
  for (const tx of [10, 18, 22, 30, 34, 42, 50, 62, 68]) {
    if (tx >= 24 && tx <= 28) continue; // avenue mouth
    if (rng2() < 0.2) continue;
    streetTrees.push([tx, 11]);
  }
  // south sidewalk, east of the bus/payphone corner (bases on row ~26)
  for (const tx of [20, 23, 29, 33, 37, 41, 45, 52, 63, 68]) {
    if (tx >= 24 && tx <= 28) continue; // avenue
    if (usedCols.has(tx)) continue; // S1 furniture got there first
    if (Math.abs(tx - 49) <= 1) continue; // the realtor's sign
    if (rng2() < 0.3) continue;
    streetTrees.push([tx, 24.4]);
  }
  // a couple more for the park, clear of the picnic table
  for (const [tx, ty] of [
    [47, 15],
    [41, 16],
    [52, 13],
    [63, 15],
    [67, 13],
  ] as const) {
    if (ty >= 14 && ty <= 16 && Math.abs(tx - picnicX) < 3) continue;
    if (rng2() < 0.4) continue;
    streetTrees.push([tx, ty]);
  }

  const hospital = north[2];
  const dept = north[3];
  // S4: the SAVINGS & LOAN stays locked, but its facade gains the ATM —
  // placed off the jittered bank, never hardcoded (ADR-012). Two tiles right
  // of its (locked) door, base on the sidewalk, screen against the wall.
  const bank = north[4];
  const atmX = bank.x + 4;

  // S13: the COSTA ESTRELLA travel poster — the tease (ADR-037). A FRESH rng
  // stream opened after every standing one (the ADR-016 rule, third
  // application: 1995 + 2077 stay byte-identical), jittering the poster
  // board into the bus-stop corner where travel ads live. Visual-only —
  // no solid near the payphone (the S7 discipline).
  const rng3 = seededRng(2095);
  const posterX = 11 + Math.floor(rng3() * 2);

  return {
    id: 'brickton',
    name: 'BRICKTON CITY',
    music: 'brickton',
    settlement: 'city',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      ...streetTrees.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      ...poles,
      ...bldgProps,
      { sprite: 'dumpster', x: alleyX, y: 5.4, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 2, y: 11.9, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 6, y: 27.2, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 63, y: 24.6, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'atm', x: atmX, y: 5.5, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
      // bus stop corner
      { sprite: 'bus_sign', x: 7, y: 26, solid: { ox: 4, oy: 18, w: 6, h: 6 } },
      { sprite: 'bench', x: 4, y: 27, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 10, y: 27, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'payphone', x: 14, y: 26, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      // park
      { sprite: 'picnic', x: picnicX, y: 15, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      // the lot's realtor sign, on the sidewalk where you can actually read it
      { sprite: 'sign', x: 49, y: 25, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // S14: the docks sign by the east gap (static placement, no rng)
      { sprite: 'sign', x: 68, y: 24, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 62, y: 14, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 35, y: 25, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 61, y: 28, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: dept.x + 2, y: 5.6, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // S12: the gate in the lot's fence — THE CAGE is open (no solid; the
      // door zone under it carries you through, chain hanging unlatched)
      { sprite: 'cage_gate', x: 50, y: 25.1 },
      // S13: the Costa Estrella travel poster (the tease — visual-only)
      { sprite: 'poster_links', x: posterX, y: 25.4 },
      ...furniture,
      ...meters,
    ],
    npcs: [
      { id: 'nurse', sprite: 'nurse', x: hospital.x + 3, y: 6, facing: 'down', dialogue: 'npc_nurse' },
      { id: 'gray_commuter', sprite: 'grayCommuter', x: dept.x + 5, y: 6, facing: 'up', dialogue: 'npc_commuter' },
      { id: 'quarter_man', sprite: 'quarterMan', x: 15, y: 27, facing: 'left', dialogue: 'npc_quarter' },
      { id: 'pigeon_kid', sprite: 'pigeonKid', x: 44, y: 15, facing: 'down', dialogue: 'npc_pigeonkid' },
      { id: 'sidewalk_critic', sprite: 'sidewalkCritic', x: 20, y: 19, facing: 'down', dialogue: 'npc_critic', wander: true },
      { id: 'clock_lady', sprite: 'oldTimer', x: 63, y: 15, facing: 'down', dialogue: 'npc_clock_lady' },
      { id: 'bagel_scout', sprite: 'pajamaKid', x: 33, y: 29, facing: 'up', dialogue: 'npc_bagel_scout', wander: true },
      { id: 'blue_watcher', sprite: 'grayCommuter', x: dept.x + 9, y: 7, facing: 'left', dialogue: 'npc_blue_watcher' },
      { id: 'bus_boy', sprite: 'pigeonKid', x: 7, y: 30, facing: 'right', dialogue: 'npc_bus_boy', wander: true },
      { id: 'plaza_mime', sprite: 'smilerB', x: 67, y: 17, facing: 'left', dialogue: 'npc_plaza_mime' },
    ],
    signs: [
      { x: 10, y: 27, dialogue: 'sign_brickton' },
      { x: 49, y: 25, dialogue: 'sign_lot' },
      // S14: the docks pointer at the east gap
      { x: 68, y: 24, dialogue: 'sign_to_docks' },
      { x: 62, y: 14, dialogue: 'sign_brickton_clock' },
      { x: 35, y: 25, dialogue: 'sign_market_row' },
      { x: 61, y: 28, dialogue: 'sign_overpass' },
      { x: dept.x + 2, y: 6, dialogue: 'sign_blue_notice' },
      // S13: the travel poster reads (coords follow the jittered board)
      { x: posterX, y: 26, dialogue: 'sign_links_poster' },
    ],
    phones: [{ x: 14, y: 26 }],
    atms: [{ x: atmX, y: 5.5 }],
    doors: [
      // S12: through the gate into THE CAGE (the lot's grid coords are
      // fixed — the gate tile was carved without touching the rng streams)
      { x: 50, y: 26, w: 1, h: 1, to: 'the_cage', tx: 320, ty: 60, facing: 'down' },
      // S14: east along street B to the BRICKTON DOCKS (§A5 Ch.2's gate)
      { x: 71, y: 21, w: 1, h: 3, to: 'brickton_docks', tx: 28, ty: 120, facing: 'right' },
    ],
    spawners: [
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 28, y: 6, w: 12, h: 2 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 11, y: 19, w: 13, h: 2 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 2, y: 13, w: 8, h: 5 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 41, y: 13, w: 12, h: 6 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 56, y: 12, w: 13, h: 7 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 3, y: 28, w: 9, h: 5 } },
      { enemies: ['cranky_mailbox'], count: 1, rect: { x: 30, y: 25, w: 16, h: 4 } },
    ],
    triggers: [
      { id: 'bus_stop_brickton', rect: { x: 4, y: 26, w: 4, h: 3 }, once: false },
      { id: 'brickton_clock_goal', rect: { x: 60, y: 13, w: 8, h: 5 }, once: false },
      { id: 'brickton_dial_goal', rect: { x: 13, y: 28, w: 5, h: 2 }, once: false },
      // S2: Mom calls the payphone (14,26) once the Department falls
      { id: 'payphone_ring', rect: { x: 12, y: 25, w: 6, h: 4 }, once: false },
    ],
  };
}

/* ------------------- THE DEPARTMENT OF SMILES ------------------- */

function buildDosF1(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(26, 16, 'o');
  g.rect(0, 0, 26, 2, 'O');
  g.rect(0, 0, 1, 16, 'O');
  g.rect(25, 0, 1, 16, 'O');
  g.rect(0, 15, 26, 1, 'O');
  g.set(12, 15, 'o'); // street door gap
  g.set(13, 15, 'o');
  // two welcome pods of cubicles
  g.rect(3, 5, 6, 1, 'c');
  g.rect(3, 6, 6, 1, 'k');
  g.rect(3, 9, 6, 1, 'c');
  g.rect(3, 10, 6, 1, 'k');
  g.rect(17, 8, 5, 1, 'c');
  g.rect(17, 9, 5, 1, 'k');

  return {
    id: 'dos_f1',
    name: 'DEPT. OF SMILES — LOBBY',
    music: 'department',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 10, y: 4, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'plant_pot', x: 2, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 19, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7: the lobby sets the tone (§A11) — wall-mounted, no new solids
      { sprite: 'banner_productive', x: 7, y: 0.55 },
      { sprite: 'poster_smile', x: 17, y: 0.55 },
    ],
    npcs: [
      { id: 'receptionist', sprite: 'smilerB', x: 14, y: 5, facing: 'down', dialogue: 'npc_receptionist' },
    ],
    signs: [
      { x: 8, y: 1, dialogue: 'dos_lobby' },
      { x: 20, y: 1, dialogue: 'dos_cert' },
    ],
    phones: [],
    doors: [
      { x: 12, y: 15, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      { x: 22, y: 2, w: 2, h: 1, to: 'dos_f2', tx: 368, ty: 60, facing: 'down', indicator: 'elevator' },
    ],
    spawners: [],
    triggers: [],
    // route stays clear of the entrance — nobody gets jumped on the doormat
    patrols: [{ id: 'f1a', enemy: 'blazer_smiler', route: [[4, 10.5], [21, 10.5]] }],
  };
}

function buildDosF2(): MapDef {
  const g = new Grid(30, 22, 'o');
  g.rect(0, 0, 30, 2, 'O');
  g.rect(0, 0, 1, 22, 'O');
  g.rect(29, 0, 1, 22, 'O');
  g.rect(0, 21, 30, 1, 'O');
  // break room (picnic table inside, per §A4.5 — the table before the climb)
  g.rect(1, 5, 8, 1, 'O');
  g.set(4, 5, 'o');
  g.set(5, 5, 'o');
  g.rect(8, 2, 1, 4, 'O');
  // the cubicle maze: three offset bank rows
  g.rect(3, 8, 11, 1, 'c');
  g.rect(3, 9, 11, 1, 'k');
  g.rect(16, 8, 11, 1, 'c');
  g.rect(16, 9, 11, 1, 'k');
  g.rect(3, 12, 7, 1, 'c');
  g.rect(3, 13, 7, 1, 'k');
  g.rect(12, 12, 15, 1, 'c');
  g.rect(12, 13, 15, 1, 'k');
  g.rect(3, 16, 17, 1, 'c');
  g.rect(3, 17, 17, 1, 'k');
  g.rect(22, 16, 5, 1, 'c');
  g.rect(22, 17, 5, 1, 'k');

  return {
    id: 'dos_f2',
    name: 'DEPT. OF SMILES — FLOOR 2',
    music: 'department',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'picnic', x: 2, y: 2, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'copier', x: 10, y: 2, solid: { ox: 1, oy: 6, w: 22, h: 11 } },
      { sprite: 'plant_pot', x: 25, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'water_cooler', x: 27, y: 17, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'plant_pot', x: 1, y: 18, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7 wall decor over the memo spots (§A11 voice lives in the signs)
      { sprite: 'poster_smile', x: 12, y: 0.55 },
      { sprite: 'poster_chart', x: 18, y: 0.55 },
    ],
    npcs: [],
    signs: [
      { x: 3, y: 1, dialogue: 'dos_breakroom' },
      { x: 12, y: 1, dialogue: 'dos_memo1' },
      { x: 18, y: 1, dialogue: 'dos_memo2' },
    ],
    phones: [],
    doors: [
      { x: 22, y: 2, w: 2, h: 1, to: 'dos_f1', tx: 368, ty: 60, facing: 'down', indicator: 'elevator' },
      { x: 27, y: 2, w: 1, h: 1, to: 'dos_f3', tx: 392, ty: 60, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [{ enemies: ['blazer_smiler'], count: 1, rect: { x: 3, y: 18, w: 24, h: 3 } }],
    triggers: [],
    patrols: [
      { id: 'f2a', enemy: 'blazer_smiler', route: [[4, 10], [25, 10]] },
      { id: 'f2b', enemy: 'blazer_smiler', route: [[25, 14], [4, 14]] },
    ],
  };
}

/** the sealed HOLDING ROOM block on floor 3 (S2: x18-23, y2-6) */
export const HOLDING_ROOM = { x: 18, y: 2, w: 6, h: 5 } as const;
/** doorway cells in the room's bottom rim, under the holding_door prop */
export const HOLDING_DOOR_GAP = { x: 20, w: 2 } as const;

/**
 * S2: once the PRODUCTIVITY LOCK's quota is met (flag `holding_open`), the
 * scene un-walls the room at build time — interior floor plus the doorway
 * gap — without ever mutating the shared MapDef grid (ADR-012 determinism).
 */
export function carveHoldingRoom(grid: string[]): string[] {
  const rows = grid.map((r) => r.split(''));
  const { x, y, w, h } = HOLDING_ROOM;
  for (let j = y + 1; j < y + h - 1; j++) {
    for (let i = x + 1; i < x + w - 1; i++) rows[j][i] = 'o';
  }
  for (let i = HOLDING_DOOR_GAP.x; i < HOLDING_DOOR_GAP.x + HOLDING_DOOR_GAP.w; i++) {
    rows[y + h - 1][i] = 'o';
  }
  return rows.map((r) => r.join(''));
}

function buildDosF3(): MapDef {
  const g = new Grid(26, 14, 'o');
  g.rect(0, 0, 26, 2, 'O');
  g.rect(0, 0, 1, 14, 'O');
  g.rect(25, 0, 1, 14, 'O');
  g.rect(0, 13, 26, 1, 'O');
  // the sealed HOLDING ROOM (S2 opens it: three Smilers' worth of quota)
  g.rect(HOLDING_ROOM.x, HOLDING_ROOM.y, HOLDING_ROOM.w, HOLDING_ROOM.h, 'O');
  // management cubicles (fewer, somehow worse)
  g.rect(3, 3, 6, 1, 'c');
  g.rect(3, 4, 6, 1, 'k');
  g.rect(11, 3, 5, 1, 'c');
  g.rect(11, 4, 5, 1, 'k');
  // executive runner
  g.rect(2, 8, 21, 1, 'r');
  g.rect(6, 10, 14, 1, 'c');
  g.rect(6, 11, 14, 1, 'k');

  return {
    id: 'dos_f3',
    name: 'DEPT. OF SMILES — FLOOR 3',
    music: 'department',
    interior: true,
    grid: g.out(),
    props: [
      // scene-interpreted (ADR-014): pips light per quota flag; opens into the panel
      { sprite: 'holding_door', x: 20.375, y: 5.25, solid: { ox: 0, oy: 14, w: 20, h: 14 } },
      { sprite: 'office_door', x: 10.5, y: 0.375, solid: { ox: 0, oy: 12, w: 16, h: 14 } },
      { sprite: 'plant_pot', x: 2, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 23, y: 7, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7 wall decor — management believes in you
      { sprite: 'poster_chart', x: 14, y: 0.55 },
      { sprite: 'poster_smile', x: 7, y: 0.55 },
      // inside the holding room, visible once it opens
      { sprite: 'cot', x: 19, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 }, ifFlag: 'holding_open' },
    ],
    npcs: [
      // §A6: MIA waits in the holding room until she joins (S2)
      {
        id: 'faye',
        sprite: 'faye',
        x: 21,
        y: 3,
        facing: 'down',
        dialogue: 'npc_faye_wait',
        ifFlag: 'holding_open',
        unlessFlag: 'faye_joined',
      },
    ],
    signs: [
      { x: 7, y: 1, dialogue: 'dos_quiet' },
      { x: 14, y: 1, dialogue: 'dos_memo3' },
      // the intake clipboard hangs off the cot
      { x: 19, y: 3, dialogue: 'holding_log' },
    ],
    phones: [],
    doors: [
      { x: 24, y: 2, w: 1, h: 1, to: 'dos_f2', tx: 440, ty: 60, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [
      // inside the opened room — Mia's join scene
      { id: 'faye_meet', rect: { x: 19, y: 3, w: 4, h: 3 }, once: false },
      // the column below the stairs: the Manager's exit interview
      { id: 'manager_block', rect: { x: 24, y: 3, w: 1, h: 2 }, once: false },
    ],
    patrols: [
      { id: 'f3a', enemy: 'blazer_smiler', route: [[3, 6], [16, 6]], countFlag: 'dos_quota_f3a' },
      { id: 'f3b', enemy: 'blazer_smiler', route: [[23, 8], [2, 8]], countFlag: 'dos_quota_f3b' },
      { id: 'f3c', enemy: 'blazer_smiler', route: [[2, 11.5], [23, 11.5]], sight: 6, countFlag: 'dos_quota_f3c' },
    ],
  };
}

/* ------------------- SHOP INTERIORS (S4, Bible Prompt 20) ------------------- */

/**
 * OTTERBROOK DRUG — the town drugstore, open now that the sky calmed down.
 * ADR-004 grid interior floating in void; the keeper knows every expiration
 * date by heart (§A11). Talking to him opens the buy/sell flow (NpcDef.shop).
 */
function buildDrugstoreInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'drugstore_int',
    name: 'OTTERBROOK DRUG',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf', x: 1, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      // S7: the Star Cola case hums against the back wall
      { sprite: 'cola_fridge', x: 7.4, y: 0.25 },
      // the user's decree: every shop carries an ATM (cash) + a payphone (save)
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      {
        id: 'drug_clerk',
        sprite: 'drugClerk',
        x: 5,
        y: 2,
        facing: 'down',
        dialogue: 'shop_drug_greet',
        shop: 'drugstore',
      },
      // S9 §A10 #1: the trail's end — Biscuit, parked at the corn dog shelf
      // (3rd screen of the sniff trail; talking to him sends him zooming home)
      {
        id: 'biscuit_drug',
        sprite: 'dog',
        x: 8,
        y: 5,
        facing: 'right',
        dialogue: 'npc_biscuit_drug',
        dog: true,
        ifFlag: 'q_biscuit_c2',
        unlessFlag: 'q_biscuit_c3',
      },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_drug_wall' }],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * STARMART — Brickton's 24-nonconsecutive-hour mart. Staggered aisles, a
 * keeper who counts the carts, and the §A8 Ch.1 stock incl. Star Cola.
 */
function buildStarmartInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(17, 11, 'o');
  g.rect(0, 0, 17, 2, 'O');
  return {
    id: 'starmart_int',
    name: 'STARMART',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      // two staggered aisles, like a real mart — you weave, you browse
      { sprite: 'shelf', x: 4, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 6, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 8, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 9, y: 7, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 11, y: 7, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 13, y: 7, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 14, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'plant_pot', x: 1, y: 8, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      // S7: the Star Cola case — STARMART's pride
      { sprite: 'cola_fridge', x: 12.2, y: 0.3 },
      // every shop carries an ATM (cash) + a payphone (save) — the user's decree
      { sprite: 'payphone', x: 2, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 14, y: 9, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      {
        id: 'mart_clerk',
        sprite: 'martClerk',
        x: 4,
        y: 2,
        facing: 'down',
        dialogue: 'shop_mart_greet',
        shop: 'starmart',
      },
    ],
    signs: [{ x: 12, y: 1, dialogue: 'sign_mart_wall' }],
    phones: [{ x: 2, y: 9 }],
    atms: [{ x: 14, y: 9 }],
    doors: [
      { x: 8, y: 10, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- STARPORT ARCADES (S10, §A10 #4) ------------------- */

/**
 * STARPORT — the Otterbrook original. Small, dark, open 24 hours because the
 * machines refuse to sleep. The ARCADE LEGEND machine's old spot is a
 * cabinet-shaped patch of clean carpet: the big game moved to the sequel in
 * Brickton (which is where §A10 #4 lives). ADR-004 grid floating in void;
 * the street exit derives its doorstep from the facade via doorstepOf().
 */
function buildArcadeInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(11, 8, 'a');
  g.rect(0, 0, 11, 2, 'A');
  // carpet sparkles — deliberate, asymmetric, never sprinkled (ADR-020)
  g.set(2, 3, '*');
  g.set(7, 4, '*');
  g.set(5, 6, '*');
  g.set(9, 2, '*');
  return {
    id: 'arcade_int',
    name: 'STARPORT',
    music: 'arcade',
    interior: true,
    grid: g.out(),
    props: [
      // the wall bank: three survivors and one famous gap
      { sprite: 'cab_a', x: 1, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_b', x: 2.6, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_c', x: 4.2, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      // (x 6.2 is the LEGEND machine's old spot — clean carpet, sign below)
      { sprite: 'cab_a', x: 8, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cola_fridge', x: 9.4, y: 0.25 },
      { sprite: 'counter', x: 1, y: 5, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    ],
    npcs: [],
    signs: [
      { x: 1, y: 1, dialogue: 'cab_slug_hunter' },
      { x: 2, y: 1, dialogue: 'cab_lawn_lord' },
      { x: 4, y: 1, dialogue: 'cab_tax_kid' },
      { x: 6, y: 1, dialogue: 'arcade_gap' },
      { x: 8, y: 1, dialogue: 'cab_retired' },
      { x: 2, y: 5, dialogue: 'arcade_counter_note' },
    ],
    phones: [],
    doors: [
      { x: 4, y: 7, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * STARPORT II — "The Sequel to the Arcade." Brickton, §A10 #4's venue: the
 * ARCADE LEGEND cabinet (its sign launches the playable shmup, ArcadeScene),
 * MGR's attract-mode reign, and SAL at the counter keeping score of
 * everything. Same ADR-004/ADR-011/doorstepOf discipline as every interior.
 */
function buildArcade2Int(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(15, 10, 'a');
  g.rect(0, 0, 15, 2, 'A');
  g.set(3, 4, '*');
  g.set(11, 3, '*');
  g.set(6, 7, '*');
  g.set(12, 6, '*');
  g.set(1, 8, '*');
  return {
    id: 'arcade2_int',
    name: 'STARPORT II',
    music: 'arcade',
    interior: true,
    grid: g.out(),
    props: [
      // the wall banks flank THE machine
      { sprite: 'cab_b', x: 1, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_a', x: 2.6, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_c', x: 4.2, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      // ARCADE LEGEND, a head taller than its court
      { sprite: 'cab_legend', x: 6.6, y: 0.45, solid: { ox: 0, oy: 22, w: 22, h: 10 } },
      { sprite: 'cab_a', x: 9, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_c', x: 10.6, y: 0.7, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cola_fridge', x: 13, y: 0.25 },
      // the mid-floor island bank (faces you; real arcades double back)
      { sprite: 'cab_c', x: 4, y: 3.4, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_b', x: 5.6, y: 3.4, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      { sprite: 'cab_a', x: 9.2, y: 3.4, solid: { ox: 0, oy: 18, w: 18, h: 10 } },
      // Sal's counter, where the scores are kept
      { sprite: 'counter', x: 1, y: 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 3, y: 6, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
    ],
    npcs: [
      {
        id: 'arcade_owner',
        sprite: 'arcadeOwner',
        x: 2,
        y: 5,
        facing: 'down',
        dialogue: 'npc_arcade_owner',
      },
    ],
    signs: [
      // THE machine — OverworldScene's signBeat launches the cabinet here
      { x: 7, y: 1, dialogue: 'cab_legend' },
      { x: 1, y: 1, dialogue: 'cab_grandma' },
      { x: 4, y: 1, dialogue: 'cab_fish_boss' },
      { x: 10, y: 1, dialogue: 'cab_smile_sim' },
      { x: 4, y: 5, dialogue: 'cab_island_a' },
      { x: 9, y: 5, dialogue: 'cab_island_b' },
      { x: 13, y: 1, dialogue: 'arcade2_fridge_note' },
    ],
    phones: [],
    doors: [
      { x: 7, y: 9, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- THE CAGE (S12 — the SE lot, up close) ------------------- */

/**
 * The vacant lot's FUTURE finally arrived: a full court in a chain-link
 * cage (ADR-004 grid floating in the lot's weeds — the lot's own wooden
 * fence rings the map edge). Fixtures: two bent-rim backboards, bleacher
 * planks with their bench crowd, the hand-chalked bracket board, PERMIT.
 * The MATCH plays in HoopsScene (the S10 cabinet law: its own scene on the
 * existing input layer) — this map is the venue you walk.
 */
function buildTheCage(): MapDef {
  const g = new Grid(40, 30, '.');
  // the lot's wooden fence at the map edge
  g.rect(0, 0, 40, 1, '-');
  g.rect(0, 29, 40, 1, '-');
  g.rect(0, 1, 1, 28, '|');
  g.rect(39, 1, 1, 28, '|');
  // the weeds stay confident
  g.sprinkle(2012, ',~ f', 0.07);
  // the chain-link ring, gate gap at the top (x19–20 — the Brickton door)
  g.rect(3, 2, 34, 1, 'C');
  g.rect(3, 27, 34, 1, 'C');
  g.rect(3, 3, 1, 24, 'C');
  g.rect(36, 3, 1, 24, 'C');
  g.rect(19, 2, 2, 1, 'q'); // the gap the gate swings over
  // the floor
  g.rect(4, 3, 32, 24, 'q');
  // hand-painted court: sidelines, baselines, the center line
  g.rect(7, 6, 26, 1, 'h');
  g.rect(7, 23, 26, 1, 'h');
  g.rect(7, 7, 1, 16, 'v');
  g.rect(32, 7, 1, 16, 'v');
  g.rect(19, 7, 1, 16, 'v');
  // keys: short rails off each baseline
  g.rect(8, 11, 3, 1, 'h');
  g.rect(8, 18, 3, 1, 'h');
  g.rect(29, 11, 3, 1, 'h');
  g.rect(29, 18, 3, 1, 'h');
  // two crack clusters where the summers landed (deliberate, ADR-020)
  g.set(13, 20, 'z');
  g.set(27, 9, 'z');

  return {
    id: 'the_cage',
    name: 'THE CAGE',
    music: 'cage',
    grid: g.out(),
    props: [
      // bleachers flank the gate, inside the fence — the bench crowd is
      // baked per-seed (no two planks cheer alike)
      { sprite: 'bleachers_a', x: 6, y: 2.4, solid: { ox: 2, oy: 10, w: 60, h: 14 } },
      { sprite: 'bleachers_b', x: 26.5, y: 2.4, solid: { ox: 2, oy: 10, w: 60, h: 14 } },
      // the bracket board by the gate (PERMIT chalks it himself)
      { sprite: 'chalk_board', x: 21.6, y: 3.1, solid: { ox: 1, oy: 22, w: 31, h: 7 } },
      // the rules, such as they are
      { sprite: 'sign', x: 16, y: 3.4, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // two backboards, rims bent the honest way
      { sprite: 'backboard', x: 5, y: 11.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
      { sprite: 'backboard', x: 33.4, y: 11.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
    ],
    npcs: [
      { id: 'permit', sprite: 'permit', x: 23, y: 6, facing: 'down', dialogue: 'npc_permit' },
    ],
    signs: [
      { x: 16, y: 4, dialogue: 'cage_rules' },
      { x: 22, y: 5, dialogue: 'cage_board' },
    ],
    phones: [],
    doors: [
      // back through the gate onto the Brickton sidewalk
      { x: 19, y: 1, w: 2, h: 1, to: 'brickton', tx: 808, ty: 402, facing: 'up' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------------- THE 6:15 (bus interior cutscene) ------------------- */

function buildBusInterior(): MapDef {
  const g = new Grid(22, 9, 'u');
  g.rect(0, 0, 22, 3, 'y');
  g.rect(0, 3, 22, 1, 'U');
  g.rect(0, 8, 22, 1, 'U');
  g.rect(0, 4, 1, 4, 'U');
  g.rect(21, 4, 1, 4, 'U');

  return {
    id: 'bus_interior',
    name: 'THE 6:15',
    music: 'bus',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bus_windows', x: 0, y: 0 },
      ...[3, 6, 9, 12, 15, 18].map((x) => ({
        sprite: 'bus_seat',
        x,
        y: 4,
        solid: { ox: 1, oy: 10, w: 14, h: 12 },
      })),
    ],
    npcs: [
      { id: 'bus_driver', sprite: 'busDriver', x: 20, y: 5, facing: 'right', dialogue: 'npc_busdriver' },
      { id: 'fern_lady', sprite: 'fernLady', x: 9, y: 5, facing: 'up', dialogue: 'npc_fernlady' },
    ],
    signs: [],
    phones: [],
    doors: [],
    spawners: [],
    triggers: [],
  };
}

// doorstepOf lives in mapkit.ts (S14 extraction — byte-identical)

const otterbrookMap = buildOtterbrook();
const bricktonMap = buildBrickton();
const deptDoorstep = doorstepOf(bricktonMap, 'dos_f1') ?? { tx: 489, ty: 121 };
const martDoorstep = doorstepOf(bricktonMap, 'starmart_int') ?? { tx: 80, ty: 121 };
const drugDoorstep = doorstepOf(otterbrookMap, 'drugstore_int') ?? { tx: 425, ty: 225 };
const arcadeDoorstep = doorstepOf(otterbrookMap, 'arcade_int') ?? { tx: 121, ty: 369 };
const arcade2Doorstep = doorstepOf(bricktonMap, 'arcade2_int') ?? { tx: 345, ty: 313 };

/* ------------- COSTA ESTRELLA (S13 — the clifftop resort) ------------- */

/**
 * THE WORLD DOOR, AUTHORED FOR PUERTO SOL (ADR-037): when Prompt 28 builds
 * §A5 Ch.2's port, wiring the resort in is ONE LINE — push this onto
 * costa_estrella's doors (and aim a Puerto Sol door back at the resort's
 * south path, tile ~13,15). It is NOT placed today: door targets must
 * exist (the validator's law), and Puerto Sol doesn't yet.
 */
export const COSTA_DOOR_FOR_PUERTO_SOL = { x: 12, y: 15, w: 3, h: 1, to: 'puerto_sol', tx: 104, ty: 30, facing: 'down' } as const;

/** the resort grounds: clubhouse, the caddy at the first tee, the plaque.
 *  Dev-reachable standalone (the Sprite Lab precedent) until Prompt 28. */
function buildCostaEstrella(): MapDef {
  const g = new Grid(27, 16, '.');
  // the cliff edge runs the north rim (fences — the surf is past them)
  g.rect(0, 0, 27, 1, '-');
  g.rect(0, 1, 1, 14, '|');
  g.rect(26, 1, 1, 14, '|');
  // the resort path: gate (south) up to the clubhouse, then west to the tee
  g.rect(12, 8, 3, 8, ':');
  g.rect(5, 8, 10, 2, ':');
  // hedges square the clubhouse lawn; flowers where the staff insist
  g.rect(17, 6, 6, 1, 'b');
  g.rect(17, 12, 6, 1, 'b');
  g.set(4, 4, 'f');
  g.set(6, 12, 'F');
  g.set(21, 4, 'f');
  g.set(9, 5, 'F');
  g.sprinkle(20, ',~', 0.12);

  return {
    id: 'costa_estrella',
    name: 'COSTA ESTRELLA LINKS',
    music: 'cage',
    settlement: 'village',
    grid: g.out(),
    props: [
      // the clubhouse (LINKS over the door, gold awning — Spanish-colonial
      // by way of a resort brochure)
      { sprite: 'clubhouse', x: 16, y: 1.6, solid: { ox: 0, oy: 20, w: 80, h: 28 } },
      // the first tee's plaque
      { sprite: 'sign', x: 5, y: 7, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // palms read as the coast's trees (the standard canvas, ADR-019)
      { sprite: 'tree_b', x: 2, y: 2 },
      { sprite: 'tree_b', x: 23, y: 13 },
      { sprite: 'tree', x: 8, y: 13 },
    ],
    npcs: [
      // FITO measures the world in putts and runs both formats (S13)
      { id: 'caddy', sprite: 'caddy', x: 6, y: 9, facing: 'down', dialogue: 'npc_caddy' },
    ],
    signs: [{ x: 5, y: 8, dialogue: 'sign_costa' }],
    phones: [],
    atms: [],
    doors: [
      // S14 (Prompt 28): THE ONE-LINE WIRE — the resort joins the world
      COSTA_DOOR_FOR_PUERTO_SOL,
    ],
    spawners: [],
    triggers: [],
  };
}

const chapelDoorstep = doorstepOf(otterbrookMap, 'chapel_int') ?? { tx: 521, ty: 372 };
const hospitalDoorstep = doorstepOf(bricktonMap, 'hospital_int') ?? { tx: 320, ty: 121 };

export const MAPS: Record<string, MapDef> = {
  ...buildChapter2Maps({ chapelStep: chapelDoorstep, hospitalStep: hospitalDoorstep }),
  otterbrook: otterbrookMap,
  hill_road: buildHillRoad(),
  hickory_hill: buildHill(),
  rex_home: buildRexHome(),
  rex_bedroom: buildBedroom(),
  rex_hall: buildRexHall(),
  ana_room: buildAnaRoom(),
  vivi_room: buildViviRoom(),
  brickton: bricktonMap,
  dos_f1: buildDosF1(deptDoorstep),
  dos_f2: buildDosF2(),
  dos_f3: buildDosF3(),
  drugstore_int: buildDrugstoreInt(drugDoorstep),
  starmart_int: buildStarmartInt(martDoorstep),
  arcade_int: buildArcadeInt(arcadeDoorstep),
  arcade2_int: buildArcade2Int(arcade2Doorstep),
  the_cage: buildTheCage(),
  costa_estrella: buildCostaEstrella(),
  bus_interior: buildBusInterior(),
};
