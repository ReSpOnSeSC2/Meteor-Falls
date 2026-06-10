/**
 * Chapter 1 maps (ADR-004: code-authored grids behind the same MapDef the
 * future Tiled loader will emit). Legend:
 *   . , ~ grass variants   f F flowers   : path (auto-edged)   b bush
 *   - | fences   s S scorch / ember-flecked scorch
 *   w floor   W wall   r rug
 */

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

export interface MapDef {
  id: string;
  name: string;
  music: string | null;
  night?: boolean;
  grid: string[];
  props: PropDef[];
  npcs: NpcDef[];
  signs: SignDef[];
  phones: Array<{ x: number; y: number }>;
  doors: DoorZone[];
  spawners: SpawnerDef[];
  triggers: TriggerDef[];
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
        door: { ox: 32, oy: 52, w: 14, h: 14, to: 'rex_home', tx: 104, ty: 124 },
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
      { x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: 120, ty: 102, facing: 'down' },
      { x: 12, y: 9, w: 2, h: 1, to: 'rex_bedroom', tx: 56, ty: 96, facing: 'up' },
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
    grid: g.out(),
    props: [
      { sprite: 'bed', x: 1, y: 2, solid: { ox: 1, oy: 6, w: 18, h: 22 } },
      { sprite: 'desk', x: 6, y: 2, solid: { ox: 1, oy: 4, w: 24, h: 13 } },
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [{ x: 3, y: 7, w: 2, h: 1, to: 'rex_home', tx: 200, ty: 132, facing: 'down' }],
    spawners: [],
    triggers: [{ id: 'wake_up', rect: { x: 0, y: 0, w: 10, h: 8 }, once: true }],
  };
}

export const MAPS: Record<string, MapDef> = {
  otterbrook: buildOtterbrook(),
  hickory_hill: buildHill(),
  rex_home: buildRexHome(),
  rex_bedroom: buildBedroom(),
};
