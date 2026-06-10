/**
 * World tileset + prop sprites — the Onett look: bright grass, checkered
 * shrubs and tree canopies, tan paths with dark edges, cream houses with
 * bold roofs. All 16×16 tiles unless noted.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { drawTextInto } from './font';

export const TILE = 16;

/* ---------------------------------------------------------------- */
/* Ground tiles                                                       */

function grassBase(seed: number, busy: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.GRASS, 2));
  const rng = mulberry32(seed);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.GRASS, 1), busy);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.GRASS, 3), Math.ceil(busy / 3));
  return pm;
}

function grassTuft(): Pixmap {
  const pm = grassBase(7, 4);
  const d = px(RAMP.GRASS, 0);
  // three little sprigs
  for (const [bx, by] of [
    [3, 9],
    [9, 5],
    [12, 11],
  ]) {
    pm.set(bx, by, d);
    pm.set(bx - 1, by - 1, d);
    pm.set(bx + 1, by - 1, d);
    pm.set(bx, by - 2, px(RAMP.GRASS, 1));
  }
  return pm;
}

function flowers(ramp: number): Pixmap {
  const pm = grassBase(11, 4);
  for (const [bx, by] of [
    [4, 4],
    [11, 7],
    [6, 12],
  ]) {
    pm.set(bx, by + 2, px(RAMP.FOREST, 2)); // stem
    pm.set(bx - 1, by, px(ramp, 3));
    pm.set(bx + 1, by, px(ramp, 3));
    pm.set(bx, by - 1, px(ramp, 3));
    pm.set(bx, by + 1, px(ramp, 3));
    pm.set(bx, by, px(RAMP.GOLD, 3));
  }
  return pm;
}

/** path with grass-edge mask: bit 1=N, 2=E, 4=S, 8=W edges */
function pathTile(mask: number, variant: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 2));
  const rng = mulberry32(100 + mask + variant * 977);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.EARTH, 1), 4);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.EARTH, 3), 3);
  const edge = px(RAMP.EARTH, 0);
  const grass = px(RAMP.GRASS, 1);
  if (mask & 1) {
    pm.hline(0, 0, TILE, grass);
    pm.hline(0, 1, TILE, edge);
  }
  if (mask & 4) {
    pm.hline(0, TILE - 1, TILE, edge);
  }
  if (mask & 8) {
    pm.vline(0, 0, TILE, grass);
    pm.vline(1, 0, TILE, edge);
  }
  if (mask & 2) {
    pm.vline(TILE - 1, 0, TILE, edge);
  }
  return pm;
}

function bush(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  // EB's iconic checkered shrub
  pm.rect(1, 2, 14, 13, px(RAMP.FOREST, 1));
  pm.set(1, 2, T);
  pm.set(14, 2, T);
  pm.set(1, 14, T);
  pm.set(14, 14, T);
  pm.checker(1, 2, 14, 13, px(RAMP.FOREST, 1), px(RAMP.FOREST, 2), 2);
  pm.hline(3, 2, 4, px(RAMP.FOREST, 3));
  pm.set(2, 3, px(RAMP.FOREST, 3));
  pm.outline(C.outline);
  return pm;
}

function fenceH(): Pixmap {
  const pm = grassBase(21, 3);
  const wood = C.white;
  const woodD = px(RAMP.PAPER, 1);
  for (const x of [2, 10]) {
    pm.rect(x, 3, 3, 10, wood);
    pm.set(x + 1, 2, wood);
    pm.vline(x + 2, 3, 10, woodD);
  }
  pm.rect(0, 5, TILE, 2, wood);
  pm.hline(0, 6, TILE, woodD);
  pm.rect(0, 9, TILE, 2, wood);
  pm.hline(0, 10, TILE, woodD);
  return pm;
}

function fenceV(): Pixmap {
  const pm = grassBase(22, 3);
  const wood = C.white;
  const woodD = px(RAMP.PAPER, 1);
  pm.rect(6, 0, 2, TILE, wood);
  pm.rect(9, 0, 2, TILE, woodD);
  pm.rect(5, 2, 6, 3, wood);
  pm.rect(5, 10, 6, 3, wood);
  return pm;
}

function scorch(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 0));
  const rng = mulberry32(seed);
  pm.scatter(rng, 0, 0, TILE, TILE, C.inkSoft, 12);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.EARTH, 1), 8);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.ORANGE, 1), 2);
  return pm;
}

function scorchEmber(): Pixmap {
  const pm = scorch(31);
  pm.set(5, 6, px(RAMP.ORANGE, 2));
  pm.set(6, 6, px(RAMP.GOLD, 3));
  pm.set(11, 11, px(RAMP.ORANGE, 2));
  pm.set(12, 3, px(RAMP.GOLD, 2));
  return pm;
}

/* interiors */
function floorWood(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 2));
  for (let y = 0; y < TILE; y += 4) pm.hline(0, y, TILE, px(RAMP.EARTH, 1));
  pm.vline(4, 0, 4, px(RAMP.EARTH, 1));
  pm.vline(12, 4, 4, px(RAMP.EARTH, 1));
  pm.vline(7, 8, 4, px(RAMP.EARTH, 1));
  pm.vline(13, 12, 4, px(RAMP.EARTH, 1));
  return pm;
}

function wallInterior(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.CYAN, 1));
  for (let x = 0; x < TILE; x += 4) pm.vline(x, 0, TILE, px(RAMP.CYAN, 0));
  pm.hline(0, TILE - 2, TILE, px(RAMP.CYAN, 0));
  pm.hline(0, TILE - 1, TILE, C.inkSoft);
  return pm;
}

function rug(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.BLUE, 2));
  pm.frame(0, 0, TILE, TILE, px(RAMP.GOLD, 2));
  pm.checker(2, 2, 12, 12, px(RAMP.BLUE, 2), px(RAMP.BLUE, 1), 4);
  return pm;
}

/* ---- Brickton City ground (S1) ---- */

function sidewalkTile(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 1));
  const rng = mulberry32(41);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.PAPER, 2), 5);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.PAPER, 0), 3);
  // expansion seams: one slab per tile
  pm.hline(0, TILE - 1, TILE, px(RAMP.PAPER, 0));
  pm.vline(TILE - 1, 0, TILE, px(RAMP.PAPER, 0));
  return pm;
}

function roadBase(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.INK, 2));
  const rng = mulberry32(seed);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.INK, 1), 6);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.INK, 3), 3);
  return pm;
}

function roadDash(): Pixmap {
  const pm = roadBase(43);
  pm.rect(3, 7, 10, 2, px(RAMP.GOLD, 2));
  return pm;
}

function crosswalk(): Pixmap {
  const pm = roadBase(44);
  for (const y of [1, 5, 9, 13]) pm.rect(0, y, TILE, 2, px(RAMP.PAPER, 2));
  return pm;
}

function brickWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.RED, 1));
  const mortar = px(RAMP.PAPER, 0);
  for (let y = 3; y < TILE; y += 4) pm.hline(0, y, TILE, mortar);
  // staggered head joints
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 3 : 9;
    pm.vline(off, row * 4, 3, mortar);
    pm.vline((off + 8) % TILE, row * 4, 3, mortar);
  }
  const rng = mulberry32(45);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.RED, 0), 4);
  return pm;
}

/* ---- Department of Smiles interiors ---- */

function officeFloor(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 1));
  pm.checker(0, 0, TILE, TILE, px(RAMP.PAPER, 1), px(RAMP.PAPER, 2), 8);
  const rng = mulberry32(46);
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.CYAN, 0), 2);
  return pm;
}

function officeWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 3));
  for (let x = 0; x < TILE; x += 8) pm.vline(x, 0, 12, px(RAMP.EARTH, 2));
  pm.hline(0, 11, TILE, px(RAMP.EARTH, 2));
  pm.rect(0, 12, TILE, 3, px(RAMP.EARTH, 1)); // baseboard
  pm.hline(0, TILE - 1, TILE, C.inkSoft);
  return pm;
}

function cubicleWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.NIGHT, 3)); // that exact cubicle-fabric blue
  pm.hline(0, 0, TILE, px(RAMP.PAPER, 2)); // top rail catches the light
  pm.hline(0, 1, TILE, px(RAMP.PAPER, 1));
  const rng = mulberry32(47);
  pm.scatter(rng, 0, 2, TILE, TILE - 2, px(RAMP.NIGHT, 2), 8);
  pm.vline(0, 0, TILE, px(RAMP.NIGHT, 2));
  pm.vline(TILE - 1, 0, TILE, px(RAMP.NIGHT, 2));
  return pm;
}

function cubicleDesk(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 2));
  pm.hline(0, 0, TILE, px(RAMP.EARTH, 3));
  // beige monitor, glowing spreadsheet
  pm.rect(3, 2, 8, 7, px(RAMP.PAPER, 1));
  pm.rect(4, 3, 6, 4, px(RAMP.CYAN, 2));
  pm.set(5, 4, px(RAMP.CYAN, 3));
  // a very neat stack of paper
  pm.rect(12, 4, 3, 5, px(RAMP.PAPER, 3));
  pm.hline(12, 6, 3, px(RAMP.PAPER, 1));
  pm.rect(0, 12, TILE, 4, px(RAMP.EARTH, 1)); // desk front
  pm.hline(0, 12, TILE, px(RAMP.EARTH, 0));
  return pm;
}

/* ---- bus interior ---- */

function skyDay(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.BLUE, 3));
  pm.rect(2, 4, 5, 2, px(RAMP.PAPER, 3));
  pm.rect(10, 10, 4, 2, px(RAMP.PAPER, 3));
  pm.set(9, 11, px(RAMP.PAPER, 3));
  return pm;
}

function busFloor(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.INK, 1));
  for (let y = 1; y < TILE; y += 4) pm.hline(0, y, TILE, px(RAMP.INK, 2));
  return pm;
}

function busWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 2));
  pm.rect(0, 5, TILE, 2, px(RAMP.RED, 2)); // the transit-authority stripe
  pm.hline(0, TILE - 2, TILE, px(RAMP.PAPER, 1));
  pm.hline(0, TILE - 1, TILE, C.inkSoft);
  return pm;
}

/* ---------------------------------------------------------------- */
/* Tile registry — order defines tilemap indices                      */

export interface TileEntry {
  name: string;
  solid: boolean;
  make: () => Pixmap;
}

export const TILESET: TileEntry[] = [
  { name: 'grass_a', solid: false, make: () => grassBase(1, 6) },
  { name: 'grass_b', solid: false, make: () => grassBase(2, 3) },
  { name: 'grass_tuft', solid: false, make: grassTuft },
  { name: 'flowers_red', solid: false, make: () => flowers(RAMP.RED) },
  { name: 'flowers_gold', solid: false, make: () => flowers(RAMP.MAGENTA) },
  { name: 'bush', solid: true, make: bush },
  { name: 'fence_h', solid: true, make: fenceH },
  { name: 'fence_v', solid: true, make: fenceV },
  { name: 'scorch', solid: false, make: () => scorch(30) },
  { name: 'scorch_ember', solid: false, make: scorchEmber },
  { name: 'floor_wood', solid: false, make: floorWood },
  { name: 'wall_int', solid: true, make: wallInterior },
  { name: 'rug', solid: false, make: rug },
  // Brickton City (S1)
  { name: 'sidewalk', solid: false, make: sidewalkTile },
  { name: 'road', solid: false, make: () => roadBase(42) },
  { name: 'road_dash', solid: false, make: roadDash },
  { name: 'crosswalk', solid: false, make: crosswalk },
  { name: 'brick', solid: true, make: brickWall },
  // Department of Smiles
  { name: 'office_floor', solid: false, make: officeFloor },
  { name: 'office_wall', solid: true, make: officeWall },
  { name: 'cubicle', solid: true, make: cubicleWall },
  { name: 'cubicle_desk', solid: true, make: cubicleDesk },
  // bus interior
  { name: 'sky_day', solid: false, make: skyDay },
  { name: 'bus_floor', solid: false, make: busFloor },
  { name: 'bus_wall', solid: true, make: busWall },
  // 16 path variants appended programmatically (indices PATH_BASE..+15)
];

export const PATH_BASE = TILESET.length;
export const PATH_VARIANTS = 2;
for (let v = 0; v < PATH_VARIANTS; v++) {
  for (let mask = 0; mask < 16; mask++) {
    const mv = mask;
    const vv = v;
    TILESET.push({ name: `path_${vv}_${mv}`, solid: false, make: () => pathTile(mv, vv) });
  }
}

export function tileIndexByName(name: string): number {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`unknown tile ${name}`);
  return i;
}

/* ---------------------------------------------------------------- */
/* Props (placed as sprites with depth-sort + collision rects)        */

export function drawTree(): Pixmap {
  const pm = new Pixmap(26, 34);
  // trunk
  pm.rect(11, 24, 4, 8, px(RAMP.EARTH, 1));
  pm.vline(11, 24, 8, px(RAMP.EARTH, 0));
  // canopy — checkered ball
  pm.ellipse(13, 14, 11, 12, px(RAMP.FOREST, 1));
  pm.checker(2, 2, 22, 25, px(RAMP.FOREST, 1), px(RAMP.FOREST, 2), 2);
  pm.ellipse(8, 8, 4, 3, px(RAMP.FOREST, 3));
  pm.outline(C.outline);
  return pm;
}

export function drawSign(): Pixmap {
  const pm = new Pixmap(16, 18);
  pm.rect(2, 2, 12, 9, px(RAMP.EARTH, 2));
  pm.frame(2, 2, 12, 9, px(RAMP.EARTH, 0));
  pm.hline(4, 5, 8, px(RAMP.EARTH, 0));
  pm.hline(4, 7, 6, px(RAMP.EARTH, 0));
  pm.rect(6, 11, 3, 6, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

/** doormat — the universal "this is a door" decal */
export function drawDoormat(): Pixmap {
  const pm = new Pixmap(18, 10);
  pm.rect(1, 1, 16, 8, px(RAMP.EARTH, 2));
  pm.frame(1, 1, 16, 8, px(RAMP.GOLD, 2));
  pm.hline(4, 3, 10, px(RAMP.EARTH, 1));
  pm.hline(4, 5, 10, px(RAMP.EARTH, 1));
  pm.hline(4, 7, 10, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

/** staircase decal for floor-to-floor exits */
export function drawStairs(): Pixmap {
  const pm = new Pixmap(18, 24);
  // dark opening at the top
  pm.rect(2, 1, 14, 5, C.inkSoft);
  pm.rect(3, 1, 12, 3, C.outline);
  // steps, lightening toward the player
  pm.rect(2, 6, 14, 4, px(RAMP.EARTH, 1));
  pm.hline(2, 6, 14, px(RAMP.EARTH, 0));
  pm.rect(2, 10, 14, 4, px(RAMP.EARTH, 2));
  pm.hline(2, 10, 14, px(RAMP.EARTH, 1));
  pm.rect(2, 14, 14, 4, px(RAMP.EARTH, 3));
  pm.hline(2, 14, 14, px(RAMP.EARTH, 1));
  pm.rect(2, 18, 14, 5, px(RAMP.EARTH, 3));
  pm.hline(2, 18, 14, px(RAMP.EARTH, 2));
  // side rails
  pm.vline(1, 1, 22, px(RAMP.EARTH, 0));
  pm.vline(16, 1, 22, px(RAMP.EARTH, 0));
  pm.outline(C.outline);
  return pm;
}

export function drawPicnicTable(): Pixmap {
  const pm = new Pixmap(36, 26);
  const wood = px(RAMP.EARTH, 2);
  const woodD = px(RAMP.EARTH, 1);
  pm.rect(4, 6, 28, 8, wood);
  pm.frame(4, 6, 28, 8, woodD);
  pm.hline(4, 9, 28, woodD);
  pm.rect(0, 16, 12, 3, wood); // benches
  pm.rect(24, 16, 12, 3, wood);
  pm.rect(8, 14, 3, 8, woodD); // legs
  pm.rect(25, 14, 3, 8, woodD);
  // red checker cloth corner
  pm.checkerFill(20, 6, 12, 8, px(RAMP.RED, 2), C.white, 2);
  pm.outline(C.outline);
  return pm;
}

export function drawPhoneTable(): Pixmap {
  const pm = new Pixmap(16, 18);
  pm.rect(2, 8, 12, 3, px(RAMP.EARTH, 2));
  pm.rect(3, 11, 2, 6, px(RAMP.EARTH, 1));
  pm.rect(11, 11, 2, 6, px(RAMP.EARTH, 1));
  // the phone — cherry red, the most important object in the game
  pm.rect(4, 4, 8, 4, px(RAMP.RED, 2));
  pm.rect(3, 2, 10, 2, px(RAMP.RED, 3)); // handset
  pm.set(3, 3, px(RAMP.RED, 2));
  pm.set(12, 3, px(RAMP.RED, 2));
  pm.outline(C.outline);
  return pm;
}

export function drawBed(): Pixmap {
  const pm = new Pixmap(20, 30);
  pm.rect(2, 2, 16, 5, px(RAMP.EARTH, 1)); // headboard
  pm.rect(3, 5, 14, 6, C.white); // pillow
  pm.frame(3, 5, 14, 6, px(RAMP.PAPER, 1));
  pm.rect(2, 10, 16, 17, px(RAMP.BLUE, 2)); // blanket
  pm.hline(2, 12, 16, px(RAMP.BLUE, 3));
  pm.checker(2, 14, 16, 13, px(RAMP.BLUE, 2), px(RAMP.BLUE, 1), 4);
  pm.rect(2, 26, 16, 2, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawDesk(): Pixmap {
  const pm = new Pixmap(26, 18);
  pm.rect(2, 4, 22, 7, px(RAMP.EARTH, 2));
  pm.hline(2, 4, 22, px(RAMP.EARTH, 3));
  pm.rect(3, 11, 3, 6, px(RAMP.EARTH, 1));
  pm.rect(20, 11, 3, 6, px(RAMP.EARTH, 1));
  // gooseneck lamp
  pm.set(6, 1, px(RAMP.GOLD, 3));
  pm.rect(5, 2, 3, 2, px(RAMP.RED, 2));
  pm.vline(6, 3, 2, C.inkSoft);
  // comic book
  pm.rect(14, 5, 6, 4, C.white);
  pm.set(15, 6, px(RAMP.RED, 2));
  pm.outline(C.outline);
  return pm;
}

export function drawSofa(): Pixmap {
  const pm = new Pixmap(34, 20);
  const cloth = px(RAMP.ORANGE, 2);
  const clothD = px(RAMP.ORANGE, 1);
  pm.rect(2, 2, 30, 8, cloth);
  pm.rect(2, 8, 30, 8, clothD);
  pm.rect(2, 6, 5, 10, cloth);
  pm.rect(27, 6, 5, 10, cloth);
  pm.hline(7, 10, 20, px(RAMP.ORANGE, 3));
  pm.outline(C.outline);
  return pm;
}

export function drawCounter(): Pixmap {
  const pm = new Pixmap(30, 18);
  pm.rect(2, 2, 26, 6, C.white);
  pm.rect(2, 8, 26, 8, px(RAMP.CYAN, 2));
  pm.hline(2, 8, 26, px(RAMP.CYAN, 1));
  // pie cooling, obviously
  pm.ellipse(9, 3, 4, 2, px(RAMP.ORANGE, 2));
  pm.hline(6, 2, 7, px(RAMP.ORANGE, 3));
  pm.outline(C.outline);
  return pm;
}

export function drawBugZapper(): Pixmap {
  const pm = new Pixmap(14, 26);
  pm.vline(6, 6, 18, C.inkSoft);
  pm.vline(7, 6, 18, C.inkSoft);
  pm.rect(3, 1, 8, 7, px(RAMP.NIGHT, 2));
  pm.frame(3, 1, 8, 7, C.inkSoft);
  pm.rect(5, 2, 4, 5, px(RAMP.CYAN, 3)); // the deadly glow
  pm.set(6, 3, C.white);
  pm.hline(4, 0, 6, C.inkSoft);
  pm.outline(C.outline);
  return pm;
}

export function drawMeteorRock(): Pixmap {
  const pm = new Pixmap(30, 24);
  pm.ellipse(15, 13, 13, 9, C.inkSoft);
  pm.ellipse(13, 11, 9, 6, px(RAMP.NIGHT, 2));
  // glowing cracks
  pm.line(8, 14, 14, 9, px(RAMP.ORANGE, 2));
  pm.line(14, 9, 20, 13, px(RAMP.GOLD, 2));
  pm.line(13, 16, 18, 17, px(RAMP.ORANGE, 1));
  pm.set(14, 9, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

export function drawEmber(): Pixmap {
  const pm = new Pixmap(12, 12);
  pm.set(5, 1, px(RAMP.GOLD, 3));
  pm.set(5, 2, px(RAMP.GOLD, 3));
  pm.rect(4, 3, 3, 2, px(RAMP.GOLD, 3));
  pm.rect(2, 5, 7, 3, px(RAMP.GOLD, 2));
  pm.rect(4, 8, 3, 2, px(RAMP.ORANGE, 2));
  pm.set(1, 5, px(RAMP.GOLD, 3));
  pm.set(9, 5, px(RAMP.GOLD, 3));
  pm.set(5, 5, C.white);
  pm.outline(C.outline);
  return pm;
}

export function drawLemonadeStand(): Pixmap {
  const pm = new Pixmap(36, 30);
  pm.rect(2, 12, 32, 12, px(RAMP.GOLD, 2)); // booth
  pm.hline(2, 12, 32, px(RAMP.GOLD, 3));
  pm.rect(2, 22, 32, 2, px(RAMP.GOLD, 1));
  pm.rect(4, 2, 28, 8, C.white); // banner
  pm.frame(4, 2, 28, 8, px(RAMP.RED, 2));
  drawTextInto(pm, '25c', 9, 3, px(RAMP.RED, 1));
  // pitcher
  pm.rect(26, 6, 5, 6, px(RAMP.CYAN, 3));
  pm.rect(27, 8, 3, 3, px(RAMP.GOLD, 3));
  pm.vline(2, 24, 4, px(RAMP.GOLD, 1));
  pm.vline(33, 24, 4, px(RAMP.GOLD, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawBusSign(): Pixmap {
  const pm = new Pixmap(14, 26);
  pm.vline(6, 8, 16, C.inkSoft);
  pm.vline(7, 8, 16, C.inkSoft);
  pm.rect(2, 1, 10, 8, px(RAMP.BLUE, 2));
  pm.frame(2, 1, 10, 8, C.white);
  drawTextInto(pm, 'B', 5, 2, C.white);
  pm.outline(C.outline);
  return pm;
}

/* ---------------------------------------------------------------- */
/* Buildings — generated whole, placed as props                       */

export interface HouseOpts {
  wallTiles: number; // width in tiles
  wallRows: number; // wall height in tiles
  roof: number; // ramp
  chimney?: boolean;
  signText?: string;
  steeple?: boolean; // chapel
  doorAt?: number; // tile offset of door (default centered)
  windows?: number[];
}

export function drawHouse(o: HouseOpts): Pixmap {
  const w = o.wallTiles * TILE;
  const wallH = o.wallRows * TILE;
  const roofH = 20;
  const signH = o.signText !== undefined ? 12 : 0;
  const steepleH = o.steeple ? 22 : 0;
  const pm = new Pixmap(w + 2, roofH + signH + wallH + steepleH + 2);
  const top = 1 + steepleH;
  const wallTop = top + roofH + signH;
  const wall = px(RAMP.PAPER, 2);
  const wallD = px(RAMP.PAPER, 1);

  // wall
  pm.rect(1, wallTop, w, wallH, wall);
  for (let y = wallTop + 3; y < wallTop + wallH; y += 4) pm.hline(1, y, w, wallD);
  pm.hline(1, wallTop + wallH - 1, w, px(RAMP.PAPER, 0));

  // roof — sloped cap with ridge highlight
  const roof = px(o.roof, 2);
  const roofD = px(o.roof, 1);
  const roofL = px(o.roof, 3);
  pm.rect(1, top + 6, w, roofH - 6, roof);
  pm.rect(4, top + 3, w - 6, 3, roof);
  pm.rect(7, top, w - 12, 3, roof);
  pm.hline(7, top, w - 12, roofL);
  for (let y = top + 4; y < top + roofH - 2; y += 3) pm.hline(2, y, w - 2, roofD);
  pm.rect(0, top + roofH - 2, w + 2, 2, roofD); // eaves overhang
  pm.hline(0, top + roofH - 1, w + 2, px(o.roof, 0));

  if (o.chimney) {
    pm.rect(w - 14, top - 8 + 6, 8, 10, px(RAMP.RED, 1));
    pm.hline(w - 15, top - 3, 10, px(RAMP.RED, 2));
    pm.checker(w - 14, top - 2, 8, 6, px(RAMP.RED, 1), px(RAMP.RED, 0), 2);
  }

  // sign band (shops)
  if (o.signText !== undefined) {
    const sy = top + roofH;
    pm.rect(1, sy, w, signH, C.white);
    pm.frame(1, sy, w, signH, px(RAMP.PAPER, 1));
    const tw = o.signText.length * 6 - 1;
    drawTextInto(pm, o.signText, Math.floor((w - tw) / 2) + 1, sy + 3, C.inkSoft);
  }

  // steeple + cross (chapel)
  if (o.steeple) {
    const cx = Math.floor(w / 2) + 1;
    pm.rect(cx - 6, 10, 12, steepleH - 8, wall);
    pm.rect(cx - 8, 6, 16, 5, roofD);
    pm.rect(cx - 5, 3, 10, 4, roof);
    pm.vline(cx, 12, 6, px(RAMP.GOLD, 2)); // cross
    pm.hline(cx - 2, 14, 5, px(RAMP.GOLD, 2));
  }

  // door
  const doorTile = o.doorAt ?? Math.floor(o.wallTiles / 2);
  const dx = 1 + doorTile * TILE + 3;
  const dh = 14;
  pm.rect(dx, wallTop + wallH - dh, 10, dh, px(RAMP.EARTH, 1));
  pm.frame(dx, wallTop + wallH - dh, 10, dh, px(RAMP.EARTH, 0));
  pm.set(dx + 7, wallTop + wallH - 7, px(RAMP.GOLD, 3)); // knob
  pm.hline(dx - 1, wallTop + wallH - 1, 12, px(RAMP.EARTH, 0)); // step

  // windows
  const winRows = o.windows ?? Array.from({ length: o.wallTiles }, (_, i) => i).filter((i) => i !== doorTile);
  for (const wt of winRows) {
    if (wt >= o.wallTiles) continue;
    const wx = 1 + wt * TILE + 4;
    const wy = wallTop + 4;
    pm.rect(wx, wy, 8, 9, px(RAMP.CYAN, 1));
    pm.set(wx + 1, wy + 1, px(RAMP.CYAN, 3));
    pm.set(wx + 2, wy + 2, px(RAMP.CYAN, 2));
    pm.frame(wx - 1, wy - 1, 10, 11, C.white);
    pm.hline(wx, wy + 4, 8, C.white);
    pm.vline(wx + 4, wy, 9, C.white);
  }

  pm.outline(C.outline);
  return pm;
}

/* ---------------------------------------------------------------- */
/* Brickton City props & buildings (S1)                               */

/** downtown building: flat parapet roof, window floors, sign band,
 *  storefront level with display windows + door. Height: 44 + 16·upperRows. */
export interface CityBuildingOpts {
  wallTiles: number;
  upperRows: 1 | 2;
  wall: number; // ramp
  signText: string;
  /** striped awning over the storefront, in this ramp */
  awning?: number;
  /** hospital cross on the sign band */
  cross?: boolean;
  /** an enormous, unblinking smiley on the upper wall */
  smiley?: boolean;
  doorAt?: number; // tile column of the door
  doubleDoor?: boolean;
}

export const cityBuildingHeight = (upperRows: 1 | 2): number => 44 + upperRows * 16;

export function drawCityBuilding(o: CityBuildingOpts): Pixmap {
  const w = o.wallTiles * TILE;
  const H = cityBuildingHeight(o.upperRows);
  const pm = new Pixmap(w + 2, H);
  const wall = px(o.wall, 2);
  const wallD = px(o.wall, 1);
  const wallDD = px(o.wall, 0);

  // parapet
  pm.rect(0, 0, w + 2, 2, C.inkSoft);
  pm.rect(1, 2, w, 6, wallD);
  pm.hline(1, 7, w, wallDD);

  // upper wall + window grid
  const upTop = 8;
  const upH = o.upperRows * 16;
  pm.rect(1, upTop, w, upH, wall);
  if (o.wall === RAMP.RED) {
    for (let y = upTop + 3; y < upTop + upH; y += 4) pm.hline(1, y, w, wallD);
  }
  for (let r = 0; r < o.upperRows; r++) {
    for (let t = 0; t < o.wallTiles; t++) {
      if (o.smiley && t >= Math.floor(o.wallTiles / 2) - 1 && t <= Math.floor(o.wallTiles / 2)) continue;
      const wx = 1 + t * TILE + 4;
      const wy = upTop + r * 16 + 3;
      const lit = (t + r) % 3 === 0;
      pm.rect(wx, wy, 8, 10, lit ? px(RAMP.GOLD, 2) : px(RAMP.CYAN, 1));
      pm.set(wx + 1, wy + 1, lit ? px(RAMP.GOLD, 3) : px(RAMP.CYAN, 3));
      pm.frame(wx - 1, wy - 1, 10, 12, wallD);
      pm.hline(wx, wy + 5, 8, wallD);
    }
  }
  if (o.smiley) {
    const cx = 1 + Math.floor(w / 2);
    const cy = upTop + Math.floor(upH / 2);
    pm.ellipse(cx, cy, 9, 9, px(RAMP.GOLD, 2));
    pm.ellipse(cx - 3, cy - 3, 2, 3, px(RAMP.GOLD, 3));
    pm.rect(cx - 4, cy - 3, 2, 3, C.inkSoft); // eyes
    pm.rect(cx + 2, cy - 3, 2, 3, C.inkSoft);
    pm.hline(cx - 5, cy + 4, 11, C.inkSoft); // the grin. wider than necessary.
    pm.set(cx - 5, cy + 3, C.inkSoft);
    pm.set(cx + 5, cy + 3, C.inkSoft);
  }

  // sign band
  const sy = upTop + upH;
  pm.rect(1, sy, w, 12, C.white);
  pm.frame(1, sy, w, 12, wallDD);
  const tw = o.signText.length * 6 - 1;
  drawTextInto(pm, o.signText, Math.floor((w - tw) / 2) + 1, sy + 3, C.inkSoft);
  if (o.cross) {
    const cx = w - 9;
    pm.rect(cx - 1, sy + 2, 4, 8, px(RAMP.RED, 2));
    pm.rect(cx - 3, sy + 4, 8, 4, px(RAMP.RED, 2));
  }

  // storefront level
  const fy = sy + 12;
  pm.rect(1, fy, w, 24, wall);
  pm.hline(1, fy + 23, w, wallDD);
  if (o.awning !== undefined) {
    for (let x = 1; x < w + 1; x += 6) {
      pm.rect(x, fy, 3, 5, px(o.awning, 2));
      pm.rect(x + 3, fy, 3, 5, C.white);
    }
    for (let x = 2; x < w; x += 6) pm.set(x + 1, fy + 5, px(o.awning, 2)); // scallops
  }

  // door (then display windows around it)
  const doorTile = o.doorAt ?? Math.floor(o.wallTiles / 2);
  const dw = o.doubleDoor ? 22 : 12;
  const dx = 1 + doorTile * TILE + Math.floor((TILE - dw) / 2);
  for (let t = 0; t < o.wallTiles; t++) {
    if (t === doorTile || (o.doubleDoor && t === doorTile + 1)) continue;
    const wx = 1 + t * TILE + 2;
    pm.rect(wx, fy + 7, 12, 13, px(RAMP.CYAN, 2));
    pm.line(wx + 2, fy + 16, wx + 8, fy + 10, px(RAMP.CYAN, 3));
    pm.frame(wx - 1, fy + 6, 14, 15, C.white);
  }
  pm.rect(dx, fy + 24 - 17, dw, 17, px(RAMP.EARTH, 1));
  pm.frame(dx, fy + 24 - 17, dw, 17, px(RAMP.EARTH, 0));
  if (o.doubleDoor) {
    pm.vline(dx + Math.floor(dw / 2), fy + 24 - 17, 17, px(RAMP.EARTH, 0));
    pm.rect(dx + 2, fy + 24 - 14, 7, 8, px(RAMP.CYAN, 1));
    pm.rect(dx + 13, fy + 24 - 14, 7, 8, px(RAMP.CYAN, 1));
  } else {
    pm.set(dx + dw - 3, fy + 24 - 9, px(RAMP.GOLD, 3));
  }

  pm.outline(C.outline);
  return pm;
}

/** payphone — Brickton's finest dial tone */
export function drawPayphone(): Pixmap {
  const pm = new Pixmap(16, 28);
  pm.rect(1, 1, 14, 4, px(RAMP.BLUE, 2)); // canopy
  pm.hline(2, 1, 12, px(RAMP.BLUE, 3));
  pm.vline(2, 5, 19, px(RAMP.BLUE, 1)); // posts
  pm.vline(13, 5, 19, px(RAMP.BLUE, 1));
  pm.rect(3, 5, 10, 14, px(RAMP.CYAN, 1)); // glass
  pm.line(4, 16, 11, 7, px(RAMP.CYAN, 3));
  pm.rect(5, 8, 6, 8, px(RAMP.RED, 2)); // the phone unit
  pm.rect(6, 7, 4, 2, px(RAMP.RED, 3)); // handset
  pm.set(6, 11, C.inkSoft); // keypad
  pm.set(8, 11, C.inkSoft);
  pm.rect(1, 24, 14, 3, px(RAMP.BLUE, 1)); // base
  pm.outline(C.outline);
  return pm;
}

export function drawBench(): Pixmap {
  const pm = new Pixmap(22, 13);
  const wood = px(RAMP.EARTH, 2);
  pm.rect(1, 1, 20, 3, wood); // backrest
  pm.hline(1, 2, 20, px(RAMP.EARTH, 3));
  pm.rect(1, 6, 20, 3, wood); // seat
  pm.hline(1, 7, 20, px(RAMP.EARTH, 1));
  pm.rect(2, 9, 2, 3, C.inkSoft);
  pm.rect(18, 9, 2, 3, C.inkSoft);
  pm.outline(C.outline);
  return pm;
}

export function drawHydrant(): Pixmap {
  const pm = new Pixmap(10, 14);
  pm.rect(3, 2, 4, 2, px(RAMP.RED, 3)); // cap
  pm.rect(2, 4, 6, 7, px(RAMP.RED, 2));
  pm.set(1, 6, px(RAMP.RED, 1)); // side nozzles
  pm.set(8, 6, px(RAMP.RED, 1));
  pm.vline(3, 4, 7, px(RAMP.RED, 3));
  pm.rect(1, 11, 8, 2, px(RAMP.RED, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawPlanter(): Pixmap {
  const pm = new Pixmap(22, 16);
  pm.rect(1, 8, 20, 7, px(RAMP.RED, 1)); // brick box
  pm.hline(1, 8, 20, px(RAMP.RED, 2));
  pm.hline(1, 11, 20, px(RAMP.PAPER, 0));
  pm.rect(2, 3, 18, 6, px(RAMP.FOREST, 1)); // greenery
  pm.checker(2, 3, 18, 6, px(RAMP.FOREST, 1), px(RAMP.FOREST, 2), 2);
  pm.set(5, 2, px(RAMP.RED, 3)); // brave little flowers
  pm.set(11, 2, px(RAMP.GOLD, 3));
  pm.set(16, 2, px(RAMP.MAGENTA, 3));
  pm.outline(C.outline);
  return pm;
}

/* ---- Department of Smiles props ---- */

/** elevator doors — drawn on the wall above an 'elevator' door zone */
export function drawElevator(): Pixmap {
  const pm = new Pixmap(26, 32);
  pm.rect(1, 1, 24, 30, C.inkSoft); // frame
  pm.rect(2, 7, 22, 23, px(RAMP.PAPER, 1)); // doors
  pm.vline(12, 7, 23, C.inkSoft); // seam
  pm.vline(13, 7, 23, C.inkSoft);
  pm.vline(3, 8, 21, px(RAMP.PAPER, 2)); // brushed-steel shine
  pm.vline(15, 8, 21, px(RAMP.PAPER, 2));
  pm.rect(3, 2, 20, 4, px(RAMP.INK, 1)); // indicator panel
  pm.set(11, 3, px(RAMP.GOLD, 3)); // up light (always up. concerning.)
  pm.set(14, 3, px(RAMP.INK, 2)); // down light, dark
  pm.outline(C.outline);
  return pm;
}

export function drawWaterCooler(): Pixmap {
  const pm = new Pixmap(12, 22);
  pm.rect(2, 1, 8, 8, px(RAMP.CYAN, 2)); // bottle
  pm.vline(3, 2, 6, px(RAMP.CYAN, 3));
  pm.hline(3, 1, 6, px(RAMP.CYAN, 3));
  pm.rect(1, 9, 10, 10, px(RAMP.PAPER, 2)); // body
  pm.vline(2, 10, 8, px(RAMP.PAPER, 3));
  pm.set(3, 12, px(RAMP.CYAN, 1)); // tap
  pm.set(8, 12, px(RAMP.RED, 2)); // hot tap nobody trusts
  pm.rect(1, 19, 10, 2, px(RAMP.PAPER, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawCopier(): Pixmap {
  const pm = new Pixmap(24, 18);
  pm.rect(1, 5, 20, 10, px(RAMP.PAPER, 1)); // body
  pm.rect(1, 3, 20, 3, px(RAMP.PAPER, 0)); // lid
  pm.hline(1, 3, 20, px(RAMP.PAPER, 2));
  pm.rect(15, 7, 8, 3, px(RAMP.PAPER, 2)); // output tray
  pm.hline(16, 8, 6, C.white); // fresh copies
  pm.set(3, 7, px(RAMP.GRASS, 2)); // ready light
  pm.set(5, 7, px(RAMP.RED, 2)); // jam light (also ready)
  pm.rect(2, 15, 3, 2, C.inkSoft);
  pm.rect(17, 15, 3, 2, C.inkSoft);
  pm.outline(C.outline);
  return pm;
}

export function drawPlantPot(): Pixmap {
  const pm = new Pixmap(14, 22);
  pm.ellipse(7, 6, 5, 5, px(RAMP.FOREST, 2)); // office ficus
  pm.ellipse(4, 4, 2, 2, px(RAMP.FOREST, 3));
  pm.ellipse(10, 8, 3, 3, px(RAMP.FOREST, 1));
  pm.rect(4, 13, 7, 2, px(RAMP.EARTH, 2)); // rim
  pm.rect(5, 15, 5, 6, px(RAMP.EARTH, 1)); // pot
  pm.vline(5, 15, 6, px(RAMP.EARTH, 2));
  pm.outline(C.outline);
  return pm;
}

/** the floor-3 holding room door: sealed, riveted, smiling */
export function drawHoldingDoor(): Pixmap {
  const pm = new Pixmap(20, 28);
  pm.rect(1, 1, 18, 26, px(RAMP.INK, 1)); // steel slab
  pm.frame(1, 1, 18, 26, px(RAMP.INK, 2));
  for (const [rx, ry] of [
    [3, 3],
    [16, 3],
    [3, 24],
    [16, 24],
  ]) {
    pm.set(rx, ry, px(RAMP.INK, 3)); // rivets
  }
  pm.hline(2, 14, 16, px(RAMP.INK, 0)); // plate seam
  pm.set(4, 5, px(RAMP.RED, 2)); // lock light. it is on.
  // the badge: a small brass smiley
  pm.rect(6, 7, 8, 6, px(RAMP.GOLD, 2));
  pm.set(8, 9, C.inkSoft);
  pm.set(11, 9, C.inkSoft);
  pm.hline(8, 11, 4, C.inkSoft);
  // PRODUCTIVITY LOCK housing
  pm.rect(5, 17, 10, 7, px(RAMP.PAPER, 0));
  pm.frame(5, 17, 10, 7, px(RAMP.INK, 2));
  pm.rect(7, 19, 6, 3, px(RAMP.GOLD, 1)); // three dark quota pips
  pm.set(8, 20, px(RAMP.INK, 1));
  pm.set(10, 20, px(RAMP.INK, 1));
  pm.set(12, 20, px(RAMP.INK, 1));
  pm.outline(C.outline);
  return pm;
}

/** wooden office door with a nameplate (the Manager's) */
export function drawOfficeDoor(): Pixmap {
  const pm = new Pixmap(16, 26);
  pm.rect(1, 1, 14, 24, px(RAMP.EARTH, 2));
  pm.frame(1, 1, 14, 24, px(RAMP.EARTH, 0));
  pm.frame(3, 10, 10, 13, px(RAMP.EARTH, 1)); // lower panel
  pm.rect(4, 3, 8, 5, px(RAMP.PAPER, 2)); // nameplate
  pm.frame(4, 3, 8, 5, px(RAMP.GOLD, 1));
  pm.hline(6, 5, 4, C.inkSoft);
  pm.set(13, 14, px(RAMP.GOLD, 3)); // knob
  pm.outline(C.outline);
  return pm;
}

/* ---- bus interior props ---- */

export function drawBusSeat(): Pixmap {
  const pm = new Pixmap(16, 24);
  const vinyl = px(RAMP.FOREST, 2);
  pm.rect(2, 1, 12, 14, px(RAMP.FOREST, 1)); // high back
  pm.rect(3, 2, 10, 12, vinyl);
  pm.vline(4, 3, 10, px(RAMP.FOREST, 3));
  pm.hline(3, 8, 10, px(RAMP.FOREST, 1)); // seam
  pm.rect(1, 15, 14, 6, vinyl); // cushion
  pm.hline(1, 15, 14, px(RAMP.FOREST, 3));
  pm.rect(2, 21, 3, 2, C.inkSoft);
  pm.rect(11, 21, 3, 2, C.inkSoft);
  pm.outline(C.outline);
  return pm;
}

/** the window band overlay: posts + sill; panes are transparent so the
 *  scenery sprites scroll behind it */
export function drawBusWindows(widthPx: number): Pixmap {
  const pm = new Pixmap(widthPx, 62);
  pm.rect(0, 0, widthPx, 8, px(RAMP.PAPER, 1)); // ceiling strip
  pm.hline(0, 7, widthPx, px(RAMP.PAPER, 0));
  pm.hline(0, 0, widthPx, px(RAMP.PAPER, 2));
  for (let x = 0; x < widthPx; x += 56) {
    pm.rect(x, 8, 6, 38, px(RAMP.PAPER, 1)); // window posts
    pm.vline(x + 5, 8, 38, px(RAMP.PAPER, 0));
  }
  pm.rect(0, 46, widthPx, 5, px(RAMP.PAPER, 2)); // sill
  pm.hline(0, 46, widthPx, px(RAMP.PAPER, 3));
  pm.rect(0, 51, widthPx, 11, px(RAMP.PAPER, 1)); // wall under the sill
  pm.rect(0, 54, widthPx, 2, px(RAMP.RED, 2)); // the stripe again
  return pm;
}

/** distant city silhouette for the bus ride's last act */
export function drawSkyline(): Pixmap {
  const pm = new Pixmap(150, 46);
  const rng = mulberry32(88);
  let x = 0;
  while (x < 146) {
    const w = 12 + Math.floor(rng() * 14);
    const h = 16 + Math.floor(rng() * 26);
    pm.rect(x, 46 - h, Math.min(w, 150 - x), h, px(RAMP.NIGHT, 1));
    for (let wy = 46 - h + 3; wy < 43; wy += 4) {
      for (let wx = x + 2; wx < x + w - 2 && wx < 147; wx += 4) {
        if (rng() < 0.4) pm.set(wx, wy, px(RAMP.GOLD, 2));
      }
    }
    x += w + 2;
  }
  return pm;
}
