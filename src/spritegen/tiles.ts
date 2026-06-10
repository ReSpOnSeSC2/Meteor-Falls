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
