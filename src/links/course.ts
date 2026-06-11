/**
 * COSTA ESTRELLA LINKS — the course (S13). Phaser-free geometry + the nine
 * authored holes + the club bag, shared by the sim, the renderer, and the
 * hole-texture painter the way hoops/court.ts is (ADR-034's law: the painted
 * ground IS the physics).
 *
 * VENUE (canon, ADR-037): a clifftop resort NORTH OF PUERTO SOL — §A5 Ch.2's
 * Spanish-colonial port. Holes play NORTH (up the grid, tee at the bottom);
 * the surf is real water (a splash costs a stroke and a drop).
 *
 * Units: 1 tile = 16px; YD = 2 px per yard (so a tile is 8 yards). Grids are
 * RLE-authored rows ('C2W3R2F6R2W3C2' → 18 tiles; a 'n*' prefix repeats the
 * row) — hand-written, reviewable, expanded by ONE function everything
 * shares. Terrain chars: T tee · F fairway · R rough · S sand · W water/surf
 * · G green · C cliff rock.
 */

import type { HoleDef, ClubDef, LinksVec as Vec } from '../schemas';

export type { HoleDef, ClubDef };
export type { LinksVec as Vec } from '../schemas';

export const TILE = 16;
/** px per yard (carry tables speak yards; the world speaks px) */
export const YD = 2;

export type Terrain = 'T' | 'F' | 'R' | 'S' | 'W' | 'G' | 'C';

/** expand one RLE row ('C2W3F6…') into its tile string */
export function expandRow(rle: string): string {
  let out = '';
  const re = /([TFRSWGC])(\d*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rle)) !== null) {
    out += m[1].repeat(m[2] === '' ? 1 : Number(m[2]));
  }
  return out;
}

/** expand a hole's rows ('12*R3F8R3' repeats) into the tile grid */
export function expandGrid(rle: string[]): string[] {
  const rows: string[] = [];
  for (const line of rle) {
    const star = line.indexOf('*');
    const n = star > 0 ? Number(line.slice(0, star)) : 1;
    const row = expandRow(star > 0 ? line.slice(star + 1) : line);
    for (let i = 0; i < n; i++) rows.push(row);
  }
  return rows;
}

/** terrain under a px point (off-grid = the surf took it) */
export function terrainAt(grid: string[], x: number, y: number): Terrain {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) return 'W';
  return grid[ty][tx] as Terrain;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function yards(px: number): number {
  return Math.round(px / YD);
}

/* ================= THE CLUB BAG (data table — B cycles it) ================= */

export const CLUBS: ClubDef[] = [
  { id: 'driver', name: 'DRIVER', carry: 230, roll: 24, loft: 0.28, accWindow: 0.034 },
  { id: 'wood3', name: '3 WOOD', carry: 210, roll: 18, loft: 0.34, accWindow: 0.038 },
  { id: 'iron3', name: '3 IRON', carry: 190, roll: 14, loft: 0.38, accWindow: 0.042 },
  { id: 'iron5', name: '5 IRON', carry: 170, roll: 11, loft: 0.46, accWindow: 0.046 },
  { id: 'iron7', name: '7 IRON', carry: 150, roll: 8, loft: 0.56, accWindow: 0.05 },
  { id: 'iron9', name: '9 IRON', carry: 130, roll: 5, loft: 0.66, accWindow: 0.054 },
  { id: 'wedge', name: 'WEDGE', carry: 100, roll: 2, loft: 0.8, accWindow: 0.06 },
  { id: 'sand', name: 'SAND WEDGE', carry: 70, roll: 1, loft: 0.92, accWindow: 0.056 },
];

/** lie taxes: [carry factor, roll factor, accuracy-window factor] */
export const LIES: Record<Terrain, { carry: number; roll: number; acc: number }> = {
  T: { carry: 1, roll: 1, acc: 1 },
  F: { carry: 1, roll: 1, acc: 1 },
  G: { carry: 1, roll: 1.25, acc: 1 },
  R: { carry: 0.82, roll: 0.4, acc: 0.7 },
  S: { carry: 0.62, roll: 0.1, acc: 0.5 },
  W: { carry: 0, roll: 0, acc: 1 }, // you do not swing from the sea
  C: { carry: 0.9, roll: 1.4, acc: 0.6 },
};

/* ================= THE NINE (validator counts and sweeps) ================= */

const H = (h: HoleDef): HoleDef => h;
const tp = (tx: number, ty: number): Vec => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

/**
 * Nine authored holes, par 36 out of a single clifftop. Names + plaque lines
 * are §A11 (exactly one obsession per landmark); the surf is the west and
 * north of everything.
 */
export const HOLES: HoleDef[] = [
  // 1 — a handshake opener: wide fairway, surf far left, one greeting bunker
  H({
    id: 'h1',
    name: 'The Handshake',
    par: 4,
    plaque: 'Hole 1 — THE HANDSHAKE. Par 4. The resort says hello. The second bunker is also the resort.',
    rle: [
      '3*W2C2R10C2W2',
      'W2C2R3G4R3C2W2',
      '2*W2C2R3G4R3C2W2',
      'W2C2R10C2W2',
      '4*W2C2R2F6R2C2W2',
      'W2C2R2F4S2R2C2W2', // the greeting bunker
      '14*W2C2R2F6R2C2W2',
      '3*W2C2R3F4R3C2W2',
      '2*W2C2R3T4R3C2W2',
    ],
    tee: tp(8, 29),
    pin: tp(8, 4),
    slope: { x: 8, y: -4 },
  }),
  // 2 — the cliff carry: nothing but surf between the tee and the green
  H({
    id: 'h2',
    name: 'Two Putts of Surf',
    par: 3,
    plaque: 'Hole 2 — TWO PUTTS OF SURF. Par 3. The caddy measured the carry. Two putts, straight down, do not.',
    rle: [
      '2*W4C2R6C2W4',
      'W4C2R1G4R1C2W4',
      '2*W4C2G6C2W4',
      'W4C2R1G4R1C2W4',
      '2*W4C2R6C2W4',
      '9*W18',
      'W4C2R6C2W4',
      '2*W4C2R1T4R1C2W4',
      'W4C2R6C2W4',
    ],
    tee: tp(9, 19),
    pin: tp(9, 3),
    slope: { x: -10, y: 0 },
  }),
  // 3 — the bunker the staff call dune restoration
  H({
    id: 'h3',
    name: 'The Beach The Staff Deny',
    par: 4,
    plaque: 'Hole 3 — THE BEACH THE STAFF DENY. Par 4. Officially it is "dune restoration." It restores bogeys.',
    rle: [
      '3*C2R12C2',
      'C2R3G5R4C2',
      '2*C2R3G5R4C2',
      'C2R12C2',
      '3*C2R2S8R2C2', // the beach
      '2*C2R2S3F3S2R2C2',
      '12*C2R3F6R3C2',
      '5*C2R4F5R3C2',
      '3*C2R4T4R4C2',
    ],
    tee: tp(8, 30),
    pin: tp(7, 4),
    slope: { x: 0, y: 6 },
  }),
  // 4 — terraced fairways stepping up the cliff
  H({
    id: 'h4',
    name: 'The Terraces',
    par: 5,
    plaque: 'Hole 4 — THE TERRACES. Par 5. Three shelves. The grounds crew mows each one at a different hour, out of respect.',
    rle: [
      '3*W2C2R10C2W2',
      'W2C2R2G5R3C2W2',
      '2*W2C2R2G5R3C2W2',
      'W2C2R10C2W2',
      '8*W2C2R2F6R2C2W2', // top shelf
      '2*W2C3R8C3W2', // the lip
      '10*W2C2R3F5R2C2W2', // middle shelf
      '2*W2C3R8C3W2', // the lip
      '12*W2C2R2F6R2C2W2', // bottom shelf
      '4*W2C2R3F4R3C2W2',
      '3*W2C2R3T4R3C2W2',
    ],
    tee: tp(8, 45),
    pin: tp(8, 4),
    slope: { x: 0, y: -8 },
  }),
  // 5 — the dogleg a goat designed
  H({
    id: 'h5',
    name: "The Goat's Commute",
    par: 4,
    plaque: "Hole 5 — THE GOAT'S COMMUTE. Par 4. The architect followed a goat. The goat was not consulted on the bunkering.",
    rle: [
      '3*C2R5W4R5C2',
      'C2R1G4W4R5C2',
      '2*C2R1G4W4R5C2',
      'C2R5W4R5C2',
      '6*C2R1F5W4R4C2', // the left lane home
      '3*C2R1F5R3S2R3C2',
      '6*C2R2F10R2C2', // the corner
      '10*C2R6F5R3C2', // the drive lane (right side)
      '4*C2R6F4R4C2',
      '3*C2R6T4R4C2',
    ],
    tee: tp(9, 36),
    pin: tp(4, 4),
    slope: { x: 6, y: 4 },
  }),
  // 6 — the par-3 onto a sea stack
  H({
    id: 'h6',
    name: 'The Sea Stack',
    par: 3,
    plaque: 'Hole 6 — THE SEA STACK. Par 3. The green stands offshore on its own pillar. The tide collects what doubts you.',
    rle: [
      '2*W18',
      'W6C1G4C1W6', // the stack
      '2*W5C1G6C1W5',
      'W6C1G4C1W6',
      'W7C4W7',
      '8*W18',
      'W5C2R4C2W5',
      '2*W5C2T4R1C1W5',
      'W5C2R4C2W5',
    ],
    tee: tp(9, 17),
    pin: tp(9, 3),
    slope: { x: 12, y: 2 },
  }),
  // 7 — the long one; siesta benches line the rough (in spirit)
  H({
    id: 'h7',
    name: 'The Long Siesta',
    par: 5,
    plaque: 'Hole 7 — THE LONG SIESTA. Par 5. Three good swings or one long nap. The rough accommodates either.',
    rle: [
      '3*C2R12C2',
      'C2R4G5R3C2',
      '2*C2R3G6R3C2',
      'C2R12C2',
      '6*C2R3F7R2C2',
      'C2R3F4S3R2C2', // mid bunker
      '14*C2R2F8R2C2',
      'C2R2F4S2F2R2C2', // drive bunker
      '12*C2R3F6R3C2',
      '4*C2R4F5R3C2',
      '3*C2R4T4R4C2',
    ],
    tee: tp(8, 46),
    pin: tp(8, 4),
    slope: { x: -6, y: -6 },
  }),
  // 8 — the alley between the market hedges
  H({
    id: 'h8',
    name: "Vendor's Alley",
    par: 4,
    plaque: "Hole 8 — VENDOR'S ALLEY. Par 4. Narrow as a market lane. Everything off the short grass is somebody's stall.",
    rle: [
      '3*C2R12C2',
      'C2R4G4R4C2',
      '2*C2R4G4R4C2',
      'C2R12C2',
      '20*C2R4F4R4C2', // the alley — never wider than four
      '4*C2R4F4R4C2',
      '3*C2R5T4R3C2',
    ],
    tee: tp(8, 31),
    pin: tp(7, 4),
    slope: { x: 4, y: -10 },
  }),
  // 9 — west over the surf at golden hour; the §A11.2 tee
  H({
    id: 'h9',
    name: 'Sunset',
    par: 4,
    plaque: 'Hole 9 — SUNSET. Par 4. Play it at golden hour. The plaque has nothing funny to add.',
    rle: [
      '3*W3C2R8C2W3',
      'W3C2R1G5R2C2W3',
      '2*W3C2R1G5R2C2W3',
      'W3C2R8C2W3',
      '5*W3C2R1F6R1C2W3',
      '2*W3C2R1F4S2R1C2W3', // the last bunker catches the brave line
      '12*W3C2R1F6R1C2W3',
      '4*W3C2R2F4R2C2W3',
      '3*W3C2R2T4R2C2W3',
    ],
    tee: tp(8, 31),
    pin: tp(8, 4),
    slope: { x: -8, y: -6 },
  }),
];

/** total par (the scorecard's bottom line) */
export const COURSE_PAR = HOLES.reduce((s, h) => s + h.par, 0);
