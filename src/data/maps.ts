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
  B: 'brick',
  o: 'office_floor',
  O: 'office_wall',
  c: 'cubicle',
  k: 'cubicle_desk',
  y: 'sky_day',
  u: 'bus_floor',
  U: 'bus_wall',
};

export interface PropDef {
  sprite: string;
  /** tile coords of the prop's top-left */
  x: number;
  y: number;
  /** collision box in px relative to prop image; omit = walk-through */
  solid?: { ox: number; oy: number; w: number; h: number };
  /** door rectangle in px (relative to prop) that transitions maps */
  door?: { ox: number; oy: number; w: number; h: number; to: string; tx: number; ty: number };
}

export interface NpcDef {
  id: string;
  sprite: string;
  x: number;
  y: number;
  facing: 'down' | 'left' | 'right' | 'up';
  dialogue: string;
  wander?: boolean;
  /** special rendering: dog uses its own anim set */
  dog?: boolean;
}

export interface SignDef {
  x: number;
  y: number;
  dialogue: string;
}

export interface DoorZone {
  x: number;
  y: number;
  w: number;
  h: number;
  to: string;
  tx: number;
  ty: number;
  facing: 'down' | 'left' | 'right' | 'up';
  /** visible marker: mat (default in interiors), stairs, elevator doors, or none (map edges) */
  indicator?: 'mat' | 'stairs' | 'elevator' | 'none';
}

export interface SpawnerDef {
  enemies: string[]; // group rolled per spawn
  count: number;
  rect: { x: number; y: number; w: number; h: number }; // tiles
  /** spawn only when this flag is truthy */
  ifFlag?: string;
}

export interface TriggerDef {
  id: string;
  rect: { x: number; y: number; w: number; h: number }; // tiles
  once: boolean;
}

/**
 * Sight-line patrol (Department of Smiles; Prompt 29's prefects reuse this):
 * walks the route in a loop (2 waypoints = ping-pong), facing its direction
 * of travel. Spotting the player = alert + chase; contact = battle, not fail.
 */
export interface PatrolDef {
  id: string;
  enemy: string;
  /** tile waypoints (fractional allowed for fine corridor placement) */
  route: Array<[number, number]>;
  /** sight-line length in tiles (default 5) */
  sight?: number;
}

export interface MapDef {
  id: string;
  name: string;
  music: string | null;
  night?: boolean;
  interior?: boolean;
  grid: string[];
  props: PropDef[];
  npcs: NpcDef[];
  signs: SignDef[];
  phones: Array<{ x: number; y: number }>;
  doors: DoorZone[];
  spawners: SpawnerDef[];
  triggers: TriggerDef[];
  patrols?: PatrolDef[];
}

/* ------------------------------------------------------------------ */

class Grid {
  rows: string[][];
  w: number;
  h: number;
  constructor(w: number, h: number, fill = '.') {
    this.w = w;
    this.h = h;
    this.rows = Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
  }
  set(x: number, y: number, ch: string): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.rows[y][x] = ch;
  }
  rect(x: number, y: number, w: number, h: number, ch: string): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch);
    return this;
  }
  sprinkle(seed: number, chars: string, density: number): this {
    let a = seed >>> 0;
    const rng = (): number => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.rows[y][x] === '.' && rng() < density) {
          this.set(x, y, chars[Math.floor(rng() * chars.length)]);
        }
      }
    }
    return this;
  }
  out(): string[] {
    return this.rows.map((r) => r.join(''));
  }
}

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
  // park hedges
  g.rect(3, 22, 6, 1, 'b');
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

  return {
    id: 'otterbrook',
    name: 'OTTERBROOK, OHIO',
    music: 'otterbrook',
    grid: g.out(),
    props: [
      ...treeLine.map(([x, y]) => ({
        sprite: 'tree',
        x,
        y,
        solid: { ox: 7, oy: 22, w: 12, h: 10 },
      })),
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
      { sprite: 'drugstore', x: 24, y: 8, solid: { ox: 0, oy: 20, w: 82, h: 56 } },
      { sprite: 'arcade', x: 6, y: 17, solid: { ox: 0, oy: 20, w: 66, h: 56 } },
      { sprite: 'chapel', x: 31, y: 16, solid: { ox: 0, oy: 30, w: 50, h: 60 } },
      { sprite: 'lemonade', x: 14, y: 13, solid: { ox: 0, oy: 10, w: 36, h: 18 } },
      { sprite: 'picnic', x: 6, y: 25, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'bus_sign', x: 23, y: 25, solid: { ox: 4, oy: 18, w: 6, h: 6 } },
      { sprite: 'phone_table', x: 28, y: 14, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      { sprite: 'bug_zapper', x: 16, y: 4, solid: { ox: 4, oy: 18, w: 6, h: 8 } },
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
      { id: 'biscuit', sprite: 'dog', x: 10, y: 24, facing: 'left', dialogue: 'npc_biscuit', dog: true },
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
      { id: 'old_timer', sprite: 'oldTimer', x: 35, y: 22, facing: 'down', dialogue: 'npc_oldtimer', wander: true },
      { id: 'pajama_kid', sprite: 'pajamaKid', x: 24, y: 19, facing: 'left', dialogue: 'npc_pajama', wander: true },
    ],
    signs: [
      { x: 18, y: 27, dialogue: 'sign_welcome' },
      { x: 23, y: 14, dialogue: 'sign_hill' },
      { x: 30, y: 21, dialogue: 'sign_chapel' },
    ],
    phones: [{ x: 28, y: 14 }],
    doors: [
      { x: 18, y: 0, w: 6, h: 1, to: 'hickory_hill', tx: 232, ty: 660, facing: 'up' },
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
    ],
    triggers: [
      { id: 'bus_stop', rect: { x: 22, y: 24, w: 3, h: 3 }, once: false },
      { id: 'porch', rect: { x: 6, y: 6, w: 4, h: 2 }, once: true },
    ],
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
    night: true,
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: 'tree', x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      { sprite: 'meteor_rock', x: 14, y: 5, solid: { ox: 1, oy: 8, w: 28, h: 14 } },
      { sprite: 'picnic', x: 11, y: 23, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'sign', x: 12, y: 39, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ],
    npcs: [],
    signs: [{ x: 12, y: 39, dialogue: 'sign_trail' }],
    phones: [],
    doors: [{ x: 13, y: 45, w: 4, h: 1, to: 'otterbrook', tx: 336, ty: 24, facing: 'down' }],
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
    name: "REX'S HOUSE",
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'sofa', x: 2, y: 4, solid: { ox: 0, oy: 4, w: 34, h: 14 } },
      { sprite: 'counter', x: 9, y: 2, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'phone_table', x: 1, y: 2, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
    ],
    npcs: [{ id: 'mom', sprite: 'mom', x: 9, y: 5, facing: 'down', dialogue: 'npc_mom' }],
    signs: [],
    phones: [{ x: 1, y: 2 }],
    doors: [
      // ty lands just south of the (now taller) doorstep zone — no re-entry loop
      { x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: 120, ty: 117, facing: 'down', indicator: 'mat' },
      { x: 12, y: 9, w: 2, h: 1, to: 'rex_bedroom', tx: 56, ty: 96, facing: 'up', indicator: 'stairs' },
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
    name: "REX'S ROOM",
    music: null,
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 6, y: 2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [{ x: 3, y: 7, w: 2, h: 1, to: 'rex_home', tx: 200, ty: 132, facing: 'down', indicator: 'stairs' }],
    spawners: [],
    triggers: [{ id: 'wake_up', rect: { x: 0, y: 0, w: 10, h: 8 }, once: true }],
  };
}

/* ------------------- BRICKTON CITY (S1) ------------------- */

function buildBrickton(): MapDef {
  const g = new Grid(54, 26, '=');
  // city backdrop + bounds
  g.rect(0, 0, 54, 1, 'B');
  g.rect(0, 0, 1, 26, 'B');
  g.rect(53, 0, 1, 26, 'B');
  g.rect(0, 24, 54, 2, 'B');
  // the building row sits on solid brick (facades drawn over it)
  g.rect(1, 1, 52, 5, 'B');
  // the street
  g.rect(1, 8, 52, 3, 'R');
  for (let x = 1; x < 53; x++) if (x % 4 < 2) g.set(x, 9, 'D');
  g.rect(17, 8, 2, 3, 'X');
  g.rect(30, 8, 2, 3, 'X');
  // pocket park
  g.rect(18, 13, 13, 9, '.');
  g.set(20, 15, '~');
  g.set(27, 16, 'f');
  g.set(22, 19, 'F');
  g.set(25, 14, '~');
  g.set(29, 20, 'f');
  // hedge before the south wall
  g.rect(1, 23, 52, 1, 'b');
  // the vacant lot ("FUTURE SITE OF MORE BRICKTON")
  g.rect(47, 14, 6, 1, '-');
  g.rect(47, 20, 6, 1, '-');
  g.rect(47, 15, 1, 5, '|');
  g.rect(52, 15, 1, 5, '|');
  g.rect(48, 15, 4, 5, '.');
  g.set(49, 17, '~');
  g.set(50, 18, ',');

  const trees: Array<[number, number]> = [
    [19, 13],
    [28, 14],
    [21, 20],
    [26, 19],
    [33, 21],
    [10, 21],
    [14, 20],
  ];

  return {
    id: 'brickton',
    name: 'BRICKTON CITY',
    music: 'brickton',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: 'tree', x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      // north face of the street — door bottoms aligned to y=112
      { sprite: 'bldg_bagels', x: 1, y: 3.25, solid: { ox: 0, oy: 26, w: 66, h: 22 } },
      { sprite: 'bldg_starmart', x: 6, y: 3.25, solid: { ox: 0, oy: 26, w: 82, h: 22 } },
      { sprite: 'bldg_hospital', x: 13, y: 2.25, solid: { ox: 0, oy: 26, w: 114, h: 38 } },
      { sprite: 'bldg_brickmore', x: 21, y: 2.25, solid: { ox: 0, oy: 26, w: 82, h: 38 } },
      {
        sprite: 'bldg_dept',
        x: 27,
        y: 2.25,
        solid: { ox: 0, oy: 26, w: 130, h: 38 },
        door: { ox: 44, oy: 62, w: 26, h: 18, to: 'dos_f1', tx: 208, ty: 234 },
      },
      { sprite: 'bldg_video', x: 36, y: 3.25, solid: { ox: 0, oy: 26, w: 66, h: 22 } },
      { sprite: 'bldg_bank', x: 41, y: 2.25, solid: { ox: 0, oy: 26, w: 98, h: 38 } },
      // south side: bus stop, payphone, park furniture
      { sprite: 'bus_sign', x: 7, y: 12, solid: { ox: 4, oy: 18, w: 6, h: 6 } },
      { sprite: 'bench', x: 4, y: 13, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 9, y: 13, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'payphone', x: 11, y: 13, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'picnic', x: 23, y: 16, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'bench', x: 33, y: 13, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'hydrant', x: 37, y: 13, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
      { sprite: 'planter', x: 40, y: 13, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      { sprite: 'bench', x: 44, y: 13, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 49, y: 16, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ],
    npcs: [
      { id: 'nurse', sprite: 'nurse', x: 16, y: 6, facing: 'down', dialogue: 'npc_nurse' },
      { id: 'gray_commuter', sprite: 'grayCommuter', x: 33, y: 6, facing: 'up', dialogue: 'npc_commuter' },
      { id: 'quarter_man', sprite: 'quarterMan', x: 12, y: 14, facing: 'left', dialogue: 'npc_quarter' },
      { id: 'pigeon_kid', sprite: 'pigeonKid', x: 23, y: 14, facing: 'down', dialogue: 'npc_pigeonkid' },
      { id: 'sidewalk_critic', sprite: 'sidewalkCritic', x: 36, y: 11, facing: 'down', dialogue: 'npc_critic', wander: true },
    ],
    signs: [
      { x: 9, y: 13, dialogue: 'sign_brickton' },
      { x: 49, y: 16, dialogue: 'sign_lot' },
    ],
    phones: [{ x: 11, y: 13 }],
    doors: [],
    spawners: [
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 26, y: 6, w: 14, h: 2 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 33, y: 11, w: 16, h: 2 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 19, y: 14, w: 11, h: 7 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 8, y: 8, w: 14, h: 3 } },
    ],
    triggers: [{ id: 'bus_stop_brickton', rect: { x: 4, y: 12, w: 4, h: 3 }, once: false }],
  };
}

/* ------------------- THE DEPARTMENT OF SMILES ------------------- */

function buildDosF1(): MapDef {
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
      { x: 12, y: 15, w: 2, h: 1, to: 'brickton', tx: 489, ty: 121, facing: 'down', indicator: 'mat' },
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

function buildDosF3(): MapDef {
  const g = new Grid(26, 14, 'o');
  g.rect(0, 0, 26, 2, 'O');
  g.rect(0, 0, 1, 14, 'O');
  g.rect(25, 0, 1, 14, 'O');
  g.rect(0, 13, 26, 1, 'O');
  // the sealed HOLDING ROOM (its door opens in S2 — three Smilers' worth of quota)
  g.rect(18, 2, 6, 5, 'O');
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
      { sprite: 'holding_door', x: 20.375, y: 5.25, solid: { ox: 0, oy: 14, w: 20, h: 14 } },
      { sprite: 'office_door', x: 10.5, y: 0.375, solid: { ox: 0, oy: 12, w: 16, h: 14 } },
      { sprite: 'plant_pot', x: 2, y: 2, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'plant_pot', x: 23, y: 7, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
    ],
    npcs: [],
    signs: [
      { x: 7, y: 1, dialogue: 'dos_quiet' },
      { x: 14, y: 1, dialogue: 'dos_memo3' },
    ],
    phones: [],
    doors: [
      { x: 24, y: 2, w: 1, h: 1, to: 'dos_f2', tx: 440, ty: 60, facing: 'down', indicator: 'stairs' },
    ],
    spawners: [],
    triggers: [],
    patrols: [
      { id: 'f3a', enemy: 'blazer_smiler', route: [[3, 6], [16, 6]] },
      { id: 'f3b', enemy: 'blazer_smiler', route: [[23, 8], [2, 8]] },
      { id: 'f3c', enemy: 'blazer_smiler', route: [[2, 11.5], [23, 11.5]], sight: 6 },
    ],
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

export const MAPS: Record<string, MapDef> = {
  otterbrook: buildOtterbrook(),
  hickory_hill: buildHill(),
  rex_home: buildRexHome(),
  rex_bedroom: buildBedroom(),
  brickton: buildBrickton(),
  dos_f1: buildDosF1(),
  dos_f2: buildDosF2(),
  dos_f3: buildDosF3(),
  bus_interior: buildBusInterior(),
};
