/**
 * World tileset + prop sprites, v3 (ADR-019) — the Mother 2 look, properly:
 * oblique 3/4 buildings with visible two-tone dithered roof planes and eaves
 * shadows, 90s-Americana street furniture, plank-floor interiors, sunlit
 * grass with flower clusters. All 16×16 tiles unless noted.
 *
 * Hard rule carried from S4/S6: every pixmap that map data points solids or
 * door zones at KEEPS ITS EXACT DIMENSIONS and internal door/wall positions.
 * The restyle happens inside the same bands.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { drawTextInto } from './font';

export const TILE = 16;

/* ---------------------------------------------------------------- */
/* Ground tiles                                                       */

/**
 * EB lawns are FLAT — almost no per-tile noise (uniform speckle is the
 * fastest way to read "generated"). Life comes from the dedicated tuft and
 * flower tiles the maps sprinkle sparsely. `busy` now places at most a
 * couple of deliberate 2px blade marks, clustered, never lone pixels.
 */
function grassBase(seed: number, busy: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.GRASS, 2));
  if (busy <= 0) return pm;
  const rng = mulberry32(seed);
  const marks = Math.min(2, Math.ceil(busy / 3));
  for (let n = 0; n < marks; n++) {
    const x = 2 + Math.floor(rng() * (TILE - 5));
    const y = 2 + Math.floor(rng() * (TILE - 4));
    // a little two-blade check, like a mower missed it
    pm.set(x, y, px(RAMP.GRASS, 1));
    pm.set(x + 1, y, px(RAMP.GRASS, 1));
    pm.set(x + 1, y - 1, px(RAMP.GRASS, 3));
  }
  return pm;
}

function grassTuft(): Pixmap {
  const pm = grassBase(7, 3);
  const d = px(RAMP.GRASS, 0);
  const m = px(RAMP.GRASS, 1);
  // three sprigs, each a little V with a lit tip
  for (const [bx, by] of [
    [3, 10],
    [9, 5],
    [12, 12],
  ]) {
    pm.set(bx - 1, by - 1, m);
    pm.set(bx + 1, by - 1, m);
    pm.set(bx, by, d);
    pm.set(bx - 1, by - 2, d);
    pm.set(bx + 1, by - 2, d);
    pm.set(bx, by - 3, px(RAMP.GRASS, 3));
  }
  return pm;
}

/** flower CLUSTER — a clump of 2-3 blooms with petals, not lone pixels */
function flowers(ramp: number): Pixmap {
  const pm = grassBase(11, 3);
  const bloom = (bx: number, by: number, small: boolean): void => {
    pm.set(bx, by + (small ? 2 : 3), px(RAMP.FOREST, 1)); // stem
    if (!small) pm.set(bx - 1, by + 3, px(RAMP.FOREST, 2)); // leaf
    pm.set(bx - 1, by, px(ramp, 3));
    pm.set(bx + 1, by, px(ramp, 3));
    pm.set(bx, by - 1, px(ramp, 3));
    pm.set(bx, by + 1, px(ramp, 2));
    pm.set(bx, by, px(RAMP.GOLD, 3));
    if (!small) {
      pm.set(bx - 1, by - 1, px(ramp, 2));
      pm.set(bx + 1, by + 1, px(ramp, 2));
    }
  };
  bloom(5, 5, false);
  bloom(11, 8, true);
  bloom(4, 12, true);
  return pm;
}

/**
 * path with grass-edge mask: bit 1=N, 2=E, 4=S, 8=W edges.
 * v3: light worn tan, dark edge line, and WORN ROUNDED CORNERS — where two
 * edges meet the dirt nibbles back in 3 dithered steps (the EB path look).
 */
function pathTile(mask: number, variant: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 3));
  // two deliberate pebble pairs + one light scuff, placed differently per
  // variant — clustered marks, never lone-pixel noise
  if (variant === 0) {
    pm.hline(4, 6, 2, px(RAMP.EARTH, 2));
    pm.hline(10, 11, 2, px(RAMP.EARTH, 2));
    pm.set(12, 4, px(RAMP.PAPER, 3));
  } else {
    pm.hline(9, 5, 2, px(RAMP.EARTH, 2));
    pm.hline(3, 12, 2, px(RAMP.EARTH, 2));
    pm.set(6, 9, px(RAMP.PAPER, 3));
  }
  const edge = px(RAMP.EARTH, 1);
  const grass = px(RAMP.GRASS, 2);
  const grassD = px(RAMP.GRASS, 1);
  if (mask & 1) {
    pm.hline(0, 0, TILE, grassD);
    pm.hline(0, 1, TILE, edge);
    pm.hline(0, 2, TILE, px(RAMP.EARTH, 2)); // shade under the lip
  }
  if (mask & 4) {
    pm.hline(0, TILE - 1, TILE, edge);
  }
  if (mask & 8) {
    pm.vline(0, 0, TILE, grassD);
    pm.vline(1, 0, TILE, edge);
  }
  if (mask & 2) {
    pm.vline(TILE - 1, 0, TILE, edge);
  }
  // worn corners: stepped grass bites where two edges meet. The two path
  // variants bite differently so no two junctions match exactly.
  const deep = variant === 0 ? 4 : 3;
  const bite = (cx: number, cy: number, sx: number, sy: number): void => {
    for (let i = 0; i < deep; i++) pm.set(cx + sx * i, cy, grass);
    for (let i = 0; i < deep - 1; i++) pm.set(cx + sx * i, cy + sy, grass);
    pm.set(cx, cy + sy * 2, grass);
    if (deep > 3) pm.set(cx + sx, cy + sy * 2, grass);
    pm.set(cx, cy + sy * (deep - 1), grass);
    // edge line tracing the bite
    pm.set(cx + sx * deep, cy, edge);
    pm.set(cx + sx * (deep - 1), cy + sy, edge);
    pm.set(cx + sx * (deep - 2), cy + sy * 2, edge);
    pm.set(cx + sx, cy + sy * (deep - 1), edge);
    pm.set(cx, cy + sy * deep, edge);
    pm.set(cx + sx * 2, cy + sy * (deep - 1), px(RAMP.EARTH, 2)); // worn dither
  };
  if ((mask & 1) !== 0 && (mask & 8) !== 0) bite(0, 0, 1, 1);
  if ((mask & 1) !== 0 && (mask & 2) !== 0) bite(TILE - 1, 0, -1, 1);
  if ((mask & 4) !== 0 && (mask & 8) !== 0) bite(0, TILE - 1, 1, -1);
  if ((mask & 4) !== 0 && (mask & 2) !== 0) bite(TILE - 1, TILE - 1, -1, -1);
  return pm;
}

function bush(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  // EB's iconic checkered shrub — now with a lit crown and a ground shadow
  pm.rect(1, 3, 14, 12, px(RAMP.FOREST, 1));
  pm.set(1, 3, T);
  pm.set(14, 3, T);
  pm.set(1, 14, T);
  pm.set(14, 14, T);
  pm.checker(1, 3, 14, 12, px(RAMP.FOREST, 1), px(RAMP.FOREST, 2), 2);
  pm.hline(3, 3, 5, px(RAMP.FOREST, 3));
  pm.set(2, 4, px(RAMP.FOREST, 3));
  pm.set(7, 4, px(RAMP.FOREST, 3));
  pm.hline(2, 15, 12, px(RAMP.FOREST, 0)); // sits on its own shadow
  pm.finish(); // ADR-101
  return pm;
}

function fenceH(): Pixmap {
  const pm = grassBase(21, 3);
  const wood = px(RAMP.PAPER, 3);
  const woodM = px(RAMP.PAPER, 2);
  const woodD = px(RAMP.PAPER, 1);
  for (const x of [2, 10]) {
    pm.rect(x, 3, 3, 10, woodM);
    pm.vline(x, 3, 10, wood); // lit left
    pm.set(x + 1, 2, wood); // pointed cap
    pm.vline(x + 2, 3, 10, woodD);
    pm.hline(x, 12, 3, woodD);
  }
  pm.rect(0, 5, TILE, 2, woodM);
  pm.hline(0, 5, TILE, wood);
  pm.hline(0, 6, TILE, woodD);
  pm.rect(0, 9, TILE, 2, woodM);
  pm.hline(0, 9, TILE, wood);
  pm.hline(0, 10, TILE, woodD);
  return pm;
}

function fenceV(): Pixmap {
  const pm = grassBase(22, 3);
  const wood = px(RAMP.PAPER, 3);
  const woodM = px(RAMP.PAPER, 2);
  const woodD = px(RAMP.PAPER, 1);
  pm.rect(6, 0, 2, TILE, woodM);
  pm.vline(6, 0, TILE, wood);
  pm.rect(9, 0, 2, TILE, woodD);
  pm.rect(5, 2, 6, 3, woodM);
  pm.hline(5, 2, 6, wood);
  pm.rect(5, 10, 6, 3, woodM);
  pm.hline(5, 10, 6, wood);
  return pm;
}

function scorch(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 0));
  const rng = mulberry32(seed);
  pm.scatter(rng, 0, 0, TILE, TILE, C.inkSoft, 10);
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

/**
 * plank floor with grain — LONG light-tan boards. Board seams are soft and
 * horizontal; end joints are rare and never stacked, so it reads as wood,
 * not brick courses (the v2 mistake this replaces).
 */
function floorWood(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 3));
  const seam = px(RAMP.EARTH, 2);
  const grain = px(RAMP.EARTH, 2);
  // soft board seams
  for (let y = 3; y < TILE; y += 4) pm.hline(0, y, TILE, seam);
  // light catches SOME board edges, not all — uniform striping reads fake
  pm.hline(0, 4, TILE, px(RAMP.PAPER, 3));
  pm.hline(0, 12, 9, px(RAMP.PAPER, 3));
  // ONE end joint, on one board only — boards run long
  pm.vline(11, 8, 3, seam);
  // grain: long thin streaks within boards + one knot
  pm.hline(2, 1, 6, grain);
  pm.hline(9, 6, 5, grain);
  pm.hline(3, 9, 4, grain);
  pm.hline(7, 13, 6, grain);
  pm.set(5, 5, px(RAMP.EARTH, 1)); // knot
  pm.set(5, 6, grain);
  return pm;
}

/**
 * cream wallpaper with the EB 2.5D read: the top 3 rows are the WALL CAP —
 * the wall's own top edge seen from above — then the face, then baseboard.
 */
function wallInterior(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 2));
  // wall cap (thickness seen from above)
  pm.rect(0, 0, TILE, 3, px(RAMP.PAPER, 3));
  pm.hline(0, 0, TILE, px(RAMP.PAPER, 2));
  pm.hline(0, 3, TILE, px(RAMP.PAPER, 0)); // cap drop edge
  // faint vertical stripe pairs on the face
  for (let x = 2; x < TILE; x += 5) pm.vline(x, 4, 7, px(RAMP.PAPER, 3));
  pm.hline(0, 10, TILE, px(RAMP.PAPER, 1)); // picture rail
  // baseboard
  pm.rect(0, 11, TILE, 3, px(RAMP.EARTH, 2));
  pm.hline(0, 11, TILE, px(RAMP.EARTH, 3));
  pm.hline(0, 13, TILE, px(RAMP.EARTH, 1));
  pm.hline(0, 14, TILE, px(RAMP.EARTH, 0));
  pm.hline(0, TILE - 1, TILE, C.inkSoft); // floor shadow
  return pm;
}

/**
 * the living-room rug — EDGE-AWARE like the path tiles: the gold border
 * follows the rug's actual perimeter (mask bits 1=N 2=E 4=S 8=W are the
 * sides where the rug ENDS), so a 3×2 rug reads as ONE bordered rug, never
 * a grid of stamped motifs (the tiled-medallion look is a dead giveaway).
 * Interior cells get a quiet woven field.
 */
function rugTile(mask: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.RED, 2));
  // woven field: sparse offset stitch marks
  pm.set(4, 3, px(RAMP.RED, 1));
  pm.set(5, 3, px(RAMP.RED, 1));
  pm.set(11, 7, px(RAMP.RED, 1));
  pm.set(12, 7, px(RAMP.RED, 1));
  pm.set(6, 12, px(RAMP.RED, 1));
  pm.set(7, 12, px(RAMP.RED, 1));
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  const fringe = px(RAMP.RED, 1);
  if (mask & 1) {
    pm.hline(0, 0, TILE, fringe);
    pm.hline(0, 1, TILE, gold);
    pm.hline(0, 2, TILE, gold);
  }
  if (mask & 4) {
    pm.hline(0, TILE - 1, TILE, fringe);
    pm.hline(0, TILE - 2, TILE, gold);
    pm.hline(0, TILE - 3, TILE, gold);
  }
  if (mask & 8) {
    pm.vline(0, 0, TILE, fringe);
    pm.vline(1, 0, TILE, gold);
    pm.vline(2, 0, TILE, gold);
  }
  if (mask & 2) {
    pm.vline(TILE - 1, 0, TILE, fringe);
    pm.vline(TILE - 2, 0, TILE, gold);
    pm.vline(TILE - 3, 0, TILE, gold);
  }
  // corner knots where two borders meet
  if ((mask & 1) !== 0 && (mask & 8) !== 0) pm.set(2, 2, goldL);
  if ((mask & 1) !== 0 && (mask & 2) !== 0) pm.set(TILE - 3, 2, goldL);
  if ((mask & 4) !== 0 && (mask & 8) !== 0) pm.set(2, TILE - 3, goldL);
  if ((mask & 4) !== 0 && (mask & 2) !== 0) pm.set(TILE - 3, TILE - 3, goldL);
  return pm;
}

/** plain interior rug cell (also the legend fallback) */
const rug = (): Pixmap => rugTile(0);

/* ---- Brickton City ground (S1, restyled S7) ---- */

/** flat concrete slabs — seams carry the read; wear lives in the crack tile */
function sidewalkBase(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 2));
  // expansion seams: one slab per tile, with a sun-catch on the seam lip
  pm.hline(0, TILE - 1, TILE, px(RAMP.PAPER, 1));
  pm.vline(TILE - 1, 0, TILE, px(RAMP.PAPER, 1));
  pm.set(0, TILE - 1, px(RAMP.PAPER, 1));
  pm.hline(0, TILE - 2, 3, px(RAMP.PAPER, 3));
  return pm;
}

const sidewalkTile = (): Pixmap => sidewalkBase();

/** hairline crack + a brave weed — scattered through Brickton by the builder */
function sidewalkCrack(): Pixmap {
  const pm = sidewalkBase();
  const ck = px(RAMP.PAPER, 0);
  pm.line(2, 12, 6, 8, ck);
  pm.line(6, 8, 9, 9, ck);
  pm.line(9, 9, 13, 4, ck);
  pm.set(7, 9, px(RAMP.PAPER, 1)); // crumbled lip
  pm.set(10, 8, px(RAMP.PAPER, 1));
  pm.set(8, 8, px(RAMP.GRASS, 1)); // the weed
  pm.set(9, 7, px(RAMP.GRASS, 2));
  return pm;
}

/** curb where sidewalk meets road below: highlight lip + shaded face */
function sidewalkCurbS(): Pixmap {
  const pm = sidewalkBase();
  pm.hline(0, 11, TILE, px(RAMP.PAPER, 3)); // sun on the curb edge
  pm.hline(0, 12, TILE, px(RAMP.PAPER, 3));
  pm.rect(0, 13, TILE, 3, px(RAMP.PAPER, 0)); // curb face in shadow
  pm.hline(0, 13, TILE, px(RAMP.PAPER, 1));
  return pm;
}

function sidewalkCurbE(): Pixmap {
  const pm = sidewalkBase();
  pm.vline(12, 0, TILE, px(RAMP.PAPER, 3));
  pm.rect(13, 0, 3, TILE, px(RAMP.PAPER, 0));
  pm.vline(13, 0, TILE, px(RAMP.PAPER, 1));
  return pm;
}

function sidewalkCurbW(): Pixmap {
  const pm = sidewalkBase();
  pm.rect(0, 0, 3, TILE, px(RAMP.PAPER, 0));
  pm.vline(2, 0, TILE, px(RAMP.PAPER, 1));
  pm.vline(3, 0, TILE, px(RAMP.PAPER, 3));
  return pm;
}

/** flat warm asphalt — patches and drains carry the wear, not noise */
function roadBase(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.INK, 2));
  return pm;
}

function roadDash(): Pixmap {
  const pm = roadBase();
  pm.rect(3, 7, 10, 2, px(RAMP.GOLD, 2));
  pm.set(3, 7, px(RAMP.GOLD, 3));
  pm.set(12, 8, px(RAMP.GOLD, 1)); // worn paint
  return pm;
}

function crosswalk(): Pixmap {
  const pm = roadBase();
  for (const y of [1, 5, 9, 13]) {
    pm.rect(0, y, TILE, 2, px(RAMP.PAPER, 2));
    // tire-worn nibbles in the paint
    pm.set(3, y, px(RAMP.INK, 2));
    pm.set(11, y + 1, px(RAMP.INK, 2));
    pm.set(7, y, px(RAMP.PAPER, 3));
  }
  return pm;
}

/** fresh tar patch over a pothole — every 90s street has one */
function roadPatch(): Pixmap {
  const pm = roadBase();
  pm.rect(3, 4, 10, 8, px(RAMP.INK, 1));
  pm.set(3, 4, px(RAMP.INK, 2));
  pm.set(12, 11, px(RAMP.INK, 2));
  pm.hline(5, 3, 4, px(RAMP.INK, 1)); // tar spill
  pm.set(13, 7, px(RAMP.INK, 1));
  pm.set(2, 9, px(RAMP.INK, 1));
  return pm;
}

/** storm drain set into the road against the curb */
function stormDrain(): Pixmap {
  const pm = roadBase();
  pm.rect(2, 1, 12, 6, px(RAMP.INK, 1));
  pm.hline(2, 1, 12, px(RAMP.PAPER, 0)); // worn steel lip
  for (const x of [4, 7, 10]) pm.rect(x, 3, 2, 3, C.outline); // slots
  pm.hline(3, 7, 10, C.inkSoft); // dark mouth under the lip
  return pm;
}

function parkingLot(): Pixmap {
  const pm = roadBase();
  // stall striping — one corner per tile, so it tiles into a lot
  pm.vline(0, 0, 10, px(RAMP.PAPER, 1));
  pm.hline(0, 0, 7, px(RAMP.PAPER, 1));
  pm.set(0, 0, px(RAMP.PAPER, 2));
  pm.set(5, 12, px(RAMP.INK, 1)); // oil drip
  pm.set(6, 13, px(RAMP.INK, 1));
  return pm;
}

function brickWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.RED, 1));
  const mortar = px(RAMP.PAPER, 1);
  for (let y = 3; y < TILE; y += 4) pm.hline(0, y, TILE, mortar);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 3 : 9;
    pm.vline(off, row * 4, 3, mortar);
    pm.vline((off + 8) % TILE, row * 4, 3, mortar);
  }
  // THREE deliberate odd bricks, not noise: two bleached, one dark
  pm.rect(4, 4, 5, 3, px(RAMP.RED, 2));
  pm.rect(10, 12, 5, 3, px(RAMP.RED, 2));
  pm.rect(0, 8, 3, 3, px(RAMP.RED, 0));
  return pm;
}

/* ---- Department of Smiles interiors ---- */

/** carpet tiles: flat warm beige squares, every other square a half-tone
 *  deeper with the faintest fleck — office carpet, not wallpaper */
function officeFloor(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 1));
  const rng = mulberry32(46);
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      if ((tx + ty) % 2 === 0) continue;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if ((x + y) % 5 === 0) pm.set(tx * 8 + x, ty * 8 + y, px(RAMP.PAPER, 0));
        }
      }
    }
  }
  // soft seams between carpet tiles
  pm.hline(0, 7, TILE, px(RAMP.PAPER, 0));
  pm.vline(7, 0, TILE, px(RAMP.PAPER, 0));
  pm.scatter(rng, 0, 0, TILE, TILE, px(RAMP.PAPER, 2), 3);
  return pm;
}

function officeWallBase(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 2));
  // dropped-ceiling tile band up top
  pm.rect(0, 0, TILE, 4, px(RAMP.PAPER, 3));
  pm.hline(0, 4, TILE, px(RAMP.PAPER, 1));
  pm.vline(7, 0, 4, px(RAMP.PAPER, 1));
  pm.vline(15, 0, 4, px(RAMP.PAPER, 1));
  for (let x = 1; x < TILE; x += 8) pm.vline(x, 6, 5, px(RAMP.PAPER, 3));
  // baseboard
  pm.rect(0, 12, TILE, 3, px(RAMP.PAPER, 0));
  pm.hline(0, 12, TILE, px(RAMP.PAPER, 1));
  pm.hline(0, TILE - 1, TILE, C.inkSoft);
  return pm;
}

const officeWall = (): Pixmap => officeWallBase();

/** the variant with a humming fluorescent panel (auto-placed by the scene) */
function officeWallLight(): Pixmap {
  const pm = officeWallBase();
  pm.rect(3, 0, 10, 4, C.inkSoft); // fixture frame
  pm.rect(4, 1, 8, 2, px(RAMP.GOLD, 3)); // the panel
  pm.hline(4, 1, 8, px(RAMP.PAPER, 3));
  pm.set(4, 2, px(RAMP.GOLD, 2)); // one end flickers, of course
  // light pooling on the wall below
  pm.hline(5, 5, 6, px(RAMP.PAPER, 3));
  return pm;
}

function cubicleWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.NIGHT, 3)); // that exact cubicle-fabric blue
  pm.hline(0, 0, TILE, px(RAMP.PAPER, 2)); // top rail catches the light
  pm.hline(0, 1, TILE, px(RAMP.PAPER, 1));
  const rng = mulberry32(47);
  pm.scatter(rng, 0, 2, TILE, TILE - 2, px(RAMP.NIGHT, 2), 8);
  // a pinned memo, slightly crooked
  pm.rect(10, 4, 4, 5, px(RAMP.PAPER, 3));
  pm.set(11, 4, px(RAMP.RED, 2)); // pushpin
  pm.hline(11, 6, 2, px(RAMP.NIGHT, 2)); // illegible line
  pm.hline(11, 8, 2, px(RAMP.NIGHT, 2));
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
  pm.hline(3, 2, 8, px(RAMP.PAPER, 2));
  pm.rect(4, 3, 6, 4, px(RAMP.CYAN, 1));
  pm.set(5, 4, px(RAMP.CYAN, 3));
  pm.hline(5, 5, 3, px(RAMP.CYAN, 2));
  // a very neat stack of paper + the world's saddest coffee
  pm.rect(12, 4, 3, 5, px(RAMP.PAPER, 3));
  pm.hline(12, 6, 3, px(RAMP.PAPER, 1));
  pm.rect(13, 1, 2, 2, px(RAMP.RED, 2)); // mug
  pm.set(13, 0, px(RAMP.PAPER, 2)); // steam, allegedly
  pm.rect(0, 12, TILE, 4, px(RAMP.EARTH, 1)); // desk front
  pm.hline(0, 12, TILE, px(RAMP.EARTH, 0));
  return pm;
}

/* ---- bus interior ---- */

function skyDay(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.BLUE, 3));
  // puffy clouds with shaded undersides
  pm.rect(2, 4, 5, 2, px(RAMP.PAPER, 3));
  pm.hline(3, 3, 3, px(RAMP.PAPER, 3));
  pm.hline(2, 6, 5, px(RAMP.PAPER, 2));
  pm.rect(10, 10, 4, 2, px(RAMP.PAPER, 3));
  pm.set(9, 11, px(RAMP.PAPER, 3));
  pm.hline(10, 12, 4, px(RAMP.PAPER, 2));
  return pm;
}

function busFloor(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.INK, 1));
  for (let y = 1; y < TILE; y += 4) pm.hline(0, y, TILE, px(RAMP.INK, 2));
  pm.set(5, 7, px(RAMP.INK, 2)); // scuff
  pm.set(11, 13, px(RAMP.INK, 0)); // gum. ancient.
  return pm;
}

function busWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 2));
  pm.hline(0, 0, TILE, px(RAMP.PAPER, 3));
  pm.rect(0, 5, TILE, 2, px(RAMP.RED, 2)); // the transit-authority stripe
  pm.hline(0, 5, TILE, px(RAMP.RED, 3));
  pm.hline(0, TILE - 2, TILE, px(RAMP.PAPER, 1));
  pm.hline(0, TILE - 1, TILE, C.inkSoft);
  return pm;
}

/* ---- STARPORT arcades (S10) ---- */

/**
 * Arcade carpet: deep 2 AM blues in quiet 8px tiles — the dark a CRT needs.
 * Flat per ADR-020 rule 1; the sparkle lives in arcadeFloorStar, placed
 * deliberately by the builder, never sprinkled.
 */
function arcadeFloor(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.NIGHT, 1));
  pm.hline(0, 7, TILE, px(RAMP.NIGHT, 0));
  pm.vline(7, 0, TILE, px(RAMP.NIGHT, 0));
  pm.set(3, 12, px(RAMP.NIGHT, 0)); // one flattened gum ghost
  return pm;
}

/** the carpet's famous four-point sparkle — 90s arcades, by law */
function arcadeFloorStar(): Pixmap {
  const pm = arcadeFloor();
  pm.set(7, 7, px(RAMP.CYAN, 2));
  pm.set(7, 5, px(RAMP.PURPLE, 2));
  pm.set(7, 9, px(RAMP.PURPLE, 2));
  pm.set(5, 7, px(RAMP.PURPLE, 2));
  pm.set(9, 7, px(RAMP.PURPLE, 2));
  pm.set(12, 2, px(RAMP.MAGENTA, 1)); // a lesser, aspiring sparkle
  return pm;
}

/**
 * Arcade wall: the wallInterior construction in showroom dark — 3px wall cap
 * (ADR-020 thickness), a lit neon rail across the face, padded base.
 */
function arcadeWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.NIGHT, 2));
  // wall cap seen from above
  pm.rect(0, 0, TILE, 3, px(RAMP.NIGHT, 3));
  pm.hline(0, 3, TILE, px(RAMP.NIGHT, 0)); // cap drop edge
  // the neon rail — lit core over its glow row (light is never outlined)
  pm.hline(0, 6, TILE, px(RAMP.MAGENTA, 1));
  pm.hline(0, 7, TILE, px(RAMP.MAGENTA, 3));
  pm.hline(0, 8, TILE, px(RAMP.PURPLE, 1));
  // padded baseboard
  pm.rect(0, 11, TILE, 3, px(RAMP.INK, 1));
  pm.hline(0, 11, TILE, px(RAMP.INK, 2));
  pm.hline(0, TILE - 1, TILE, C.inkSoft); // floor shadow
  return pm;
}


/* ---------------- S14 Chapter 2 terrain (ADR-020 discipline) ---------------- */

/** open sea — flat deep water, two deliberate glints (never scatter) */
function seaTile(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.BLUE, 1));
  // one slow swell line per tile, phase-shifted by seed
  const y = 4 + (seed % 3) * 4;
  pm.hline(2, y, 6, px(RAMP.BLUE, 2));
  pm.set(9 + (seed % 4), y + 5, px(RAMP.CYAN, 2));
  return pm;
}

/** the surf line where sea meets land — foam crest on the top edge */
function seaFoamTile(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.BLUE, 1));
  pm.rect(0, 0, TILE, 4, px(RAMP.CYAN, 2));
  pm.hline(0, 0, TILE, px(RAMP.PAPER, 3)); // the crest
  pm.hline(2, 1, 5, px(RAMP.PAPER, 3));
  pm.hline(10, 1, 4, px(RAMP.PAPER, 3));
  pm.set(6, 5, px(RAMP.CYAN, 3));
  pm.set(13, 6, px(RAMP.CYAN, 3));
  return pm;
}

/** §A4.11 — the frozen-meltfall ICE BRIDGE. CYAN is the palette's ice ramp (§B3);
 *  PAPER-white frost streaks + deeper-cyan hairline cracks give the "blue-white"
 *  the dialogue promises. Rendered for the 'E' crossing only when the meltfall is
 *  frozen (OverworldScene.buildTiles); the rest of the fall stays blue sea_a.
 *  Walkable (solid:false) — the collision carve and this appearance are the two
 *  halves of one flag (spine_meltfall_frozen). */
function meltIceTile(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.CYAN, 3)); // pale ice (#acf4f0)
  // surface sheen — two deliberate white frost streaks (ADR-020: marks, never noise)
  pm.hline(1, 3, 7, px(RAMP.PAPER, 3)); // #fcf8e8
  pm.hline(8, 11, 6, px(RAMP.PAPER, 3));
  // hairline cracks — deeper-cyan veins (the "blue" of blue-white)
  pm.line(3, 6, 7, 10, px(RAMP.CYAN, 1)); // #2c9cb0
  pm.line(11, 2, 13, 8, px(RAMP.CYAN, 1));
  // two cold glints
  pm.set(12, 5, px(RAMP.PAPER, 3));
  pm.set(5, 13, px(RAMP.CYAN, 2)); // #54ccd4
  return pm;
}

/** pier planks — long warm boards running with the walkway */
function dockTile(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 2));
  pm.hline(0, 4, TILE, px(RAMP.EARTH, 1));
  pm.hline(0, 9, TILE, px(RAMP.EARTH, 1));
  pm.hline(0, 14, TILE, px(RAMP.EARTH, 1));
  pm.hline(0, 5, TILE, px(RAMP.EARTH, 3)); // each board's lit edge
  pm.hline(0, 10, TILE, px(RAMP.EARTH, 3));
  pm.set(3, 7, px(RAMP.EARTH, 0)); // one nail pair, one board end
  pm.set(12, 12, px(RAMP.EARTH, 0));
  return pm;
}

/** plaza pavers — warm colonial stone in a broken grid (rule 4) */
function plazaTile(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.PAPER, 2));
  pm.hline(0, 7, TILE, px(RAMP.PAPER, 1));
  // vertical joints stagger per row half — never one long seam
  pm.vline(5 + (seed % 3), 0, 7, px(RAMP.PAPER, 1));
  pm.vline(10 - (seed % 2), 8, 8, px(RAMP.PAPER, 1));
  pm.set(2, 3, px(RAMP.PAPER, 3)); // one sun-bleached corner
  return pm;
}

/** dry sand — flat, two pebbles where the tide left them */
function sandTile(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.GOLD, 1));
  pm.hline(2 + (seed % 4), 5, 3, px(RAMP.GOLD, 2)); // a ripple ridge
  pm.set(11, 11, px(RAMP.EARTH, 2)); // the pebbles, together
  pm.set(12, 12, px(RAMP.EARTH, 1));
  return pm;
}

/** S15i Task 6 (ADR-059) — manicured FAIRWAY: bright mown green with mowing stripes
 *  (deliberate bands, not noise — ADR-020). The golf resort's course tile. */
function fairwayTile(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.GRASS, 3));
  for (let y = 1; y < TILE; y += 4) pm.hline(0, y, TILE, px(RAMP.GRASS, 2)); // the cut stripes
  return pm;
}

/** jungle floor — deep shaded green, one leaf-litter cluster */
function jungleFloor(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.FOREST, 1));
  const x = 3 + (seed % 6);
  const y = 4 + ((seed * 3) % 7);
  pm.set(x, y, px(RAMP.FOREST, 2)); // the litter, clustered
  pm.set(x + 1, y, px(RAMP.GRASS, 1));
  pm.set(x, y + 1, px(RAMP.FOREST, 0));
  return pm;
}

/** jungle wall — undergrowth too dense to argue with (solid) */
function jungleWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.FOREST, 1));
  pm.checkerFill(0, 0, TILE, 7, px(RAMP.FOREST, 2), px(RAMP.FOREST, 1), 2); // canopy checker (EB's own)
  pm.hline(0, 7, TILE, px(RAMP.FOREST, 0));
  pm.vline(4, 8, 8, px(RAMP.FOREST, 0)); // trunks in the dark
  pm.vline(11, 9, 7, px(RAMP.FOREST, 0));
  pm.set(7, 11, px(RAMP.GRASS, 2)); // one bright frond
  pm.set(8, 11, px(RAMP.GRASS, 1));
  return pm;
}

/** pyramid stone floor — cut slabs, cool in the dark */
function pyramidFloor(seed: number): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 1));
  pm.hline(0, 8, TILE, px(RAMP.EARTH, 0));
  pm.vline(seed % 2 === 0 ? 6 : 11, 0, 8, px(RAMP.EARTH, 0));
  pm.vline(seed % 2 === 0 ? 12 : 4, 9, 7, px(RAMP.EARTH, 0));
  pm.set(2, 2, px(RAMP.EARTH, 2)); // a worn-smooth corner
  return pm;
}

/** pyramid wall — megalith courses with one carved notch (solid) */
function pyramidWall(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 2));
  pm.hline(0, 5, TILE, px(RAMP.EARTH, 0));
  pm.hline(0, 11, TILE, px(RAMP.EARTH, 0));
  pm.vline(9, 0, 5, px(RAMP.EARTH, 0));
  pm.vline(4, 6, 5, px(RAMP.EARTH, 0));
  pm.vline(12, 12, 4, px(RAMP.EARTH, 0));
  pm.hline(0, 0, TILE, px(RAMP.EARTH, 3)); // course tops in the torchlight
  pm.hline(0, 6, TILE, px(RAMP.EARTH, 3));
  pm.rect(6, 8, 2, 2, px(RAMP.EARTH, 1)); // the carved notch, off-center
  return pm;
}

/** glyph slab — a floor stone the masons signed (walkable decor) */
function pyramidGlyph(): Pixmap {
  const pm = pyramidFloor(1);
  pm.frame(4, 4, 8, 8, px(RAMP.GOLD, 1));
  pm.set(7, 6, px(RAMP.GOLD, 1)); // the grin, abbreviated
  pm.set(9, 6, px(RAMP.GOLD, 1));
  pm.hline(6, 9, 4, px(RAMP.GOLD, 1));
  return pm;
}

/** rotor floor — circular grooves: THIS floor is the part that moves */
function pyramidRotor(): Pixmap {
  const pm = new Pixmap(TILE, TILE);
  pm.fill(px(RAMP.EARTH, 1));
  pm.frame(1, 1, 14, 14, px(RAMP.EARTH, 0)); // the groove ring
  pm.frame(5, 5, 6, 6, px(RAMP.EARTH, 0)); // the inner ring
  pm.set(2, 2, px(RAMP.EARTH, 2)); // wear where it grinds
  pm.set(13, 13, px(RAMP.EARTH, 2));
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
  { name: 'grass_a', solid: false, make: () => grassBase(1, 5) },
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
  { name: 'road', solid: false, make: roadBase },
  { name: 'road_dash', solid: false, make: roadDash },
  { name: 'crosswalk', solid: false, make: crosswalk },
  { name: 'parking', solid: false, make: parkingLot },
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
  // S7 street wear (builder-placed) + scene-auto variants
  { name: 'sidewalk_crack', solid: false, make: sidewalkCrack },
  { name: 'sidewalk_curb', solid: false, make: sidewalkCurbS },
  { name: 'sidewalk_curb_e', solid: false, make: sidewalkCurbE },
  { name: 'sidewalk_curb_w', solid: false, make: sidewalkCurbW },
  { name: 'road_patch', solid: false, make: roadPatch },
  { name: 'storm_drain', solid: false, make: stormDrain },
  { name: 'office_wall_light', solid: true, make: officeWallLight },
  // STARPORT arcades (S10)
  { name: 'arcade_floor', solid: false, make: arcadeFloor },
  { name: 'arcade_floor_star', solid: false, make: arcadeFloorStar },
  { name: 'arcade_wall', solid: true, make: arcadeWall },
  // THE CAGE (S12) — the_cage venue map
  { name: 'asphalt', solid: false, make: asphaltTile },
  { name: 'asphalt_crack', solid: false, make: asphaltCrack },
  { name: 'asphalt_line_h', solid: false, make: asphaltLineH },
  { name: 'asphalt_line_v', solid: false, make: asphaltLineV },
  { name: 'cage_mesh', solid: true, make: cageMeshTile },
  // S14 Chapter 2 — the crossing, the port, the jungle, the pyramid
  { name: 'sea_a', solid: true, make: () => seaTile(1) },
  { name: 'sea_foam', solid: true, make: seaFoamTile },
  { name: 'dock', solid: false, make: dockTile },
  { name: 'plaza', solid: false, make: () => plazaTile(2) },
  { name: 'sand_a', solid: false, make: () => sandTile(3) },
  { name: 'fairway', solid: false, make: fairwayTile }, // S15i Task 6 (ADR-059) — the golf course
  { name: 'jungle_floor', solid: false, make: () => jungleFloor(4) },
  { name: 'jungle_wall', solid: true, make: jungleWall },
  { name: 'pyramid_floor', solid: false, make: () => pyramidFloor(0) },
  { name: 'pyramid_wall', solid: true, make: pyramidWall },
  { name: 'pyramid_glyph', solid: false, make: pyramidGlyph },
  { name: 'pyramid_rotor', solid: false, make: pyramidRotor },
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

/** 16 edge-aware rug variants (ADR-020) — the scene masks 'r' regions the
 *  same way it masks ':' paths, so any rug footprint reads as one rug */
export const RUG_BASE = TILESET.length;
for (let mask = 0; mask < 16; mask++) {
  const mv = mask;
  TILESET.push({ name: `rug_${mv}`, solid: false, make: () => rugTile(mv) });
}

// §A4.11 — the frozen-meltfall ice bridge, appended at the TAIL so it never
// shifts an existing tile index (base/path/rug all keep theirs, so the on-disk
// authored strip stays aligned). The runtime strip otterbrook_tiles_16.png
// carries one matching column at this same tail index, synced by
// tools/sync-melt-ice-tile.ts (the strip diverges from the review grid for a
// couple of hand-authored tiles, so we append rather than re-pack the grid).
TILESET.push({ name: 'melt_ice', solid: false, make: meltIceTile });

// PKG-12 §A11 — the Grand Duchy of MINIMUS region tiles. At runtime these render from
// the authored Minimus_tiles_16.png strip, applied ONLY to the Ch.5 maps via a render-
// time name-remap in OverworldScene.buildTiles (the global TILESET has no per-area swap,
// so the same grid chars `.`/`O`/`=`/`R` are reskinned by NAME there). The make() painters
// here are the boot FALLBACK only — REUSED existing painters, so spritegen stays FROZEN
// (no new art generator). Each carries the SAME solidity as the base tile it stands in
// for, so the Ch.5 remap is collision-preserving: turf/cobble walkable, hedge solid like
// office_wall. Appended at the tail (after melt_ice) so no existing index shifts; the
// otterbrook full-override strip gets matching trailing columns via tools/sync-minimus-tiles.ts.
TILESET.push({ name: 'minimus_turf', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'minimus_hedge', solid: true, make: officeWall });
TILESET.push({ name: 'minimus_cobble', solid: false, make: sidewalkTile });

// PKG-15 §1 — the Ch.8 CHINA (Lotus Harbor) region tiles. Same partial-override mechanism
// as the Minimus set above: the authored China_tiles_16.png strip supplies the real look at
// runtime (wired in spritegen/authored.ts), applied ONLY to the Ch.8 maps via the render-time
// name-remap CHINA_TILE_SKIN in OverworldScene.buildTiles. make() = the boot FALLBACK only
// (REUSED painters, spritegen stays FROZEN), each carrying the SAME solidity as the base tile
// it stands in for (ground/path walkable, wall solid like office_wall) so the remap is
// collision-preserving. Appended at the tail so no existing index shifts; the otterbrook
// full-override strip gets matching trailing columns via tools/sync-china-tiles.ts.
TILESET.push({ name: 'china_ground', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'china_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'china_wall', solid: true, make: officeWall });

// Ch.9 ROMANIA (Valea Stelelor) region tiles — same contract as the China set above: the
// authored Romania_tiles_16.png strip supplies the real look at runtime (wired in
// spritegen/authored.ts), applied ONLY to the Ch.9 maps via the render-time name-remap
// ROMANIA_TILE_SKIN in OverworldScene.buildTiles. make() = the boot FALLBACK only (REUSED
// painters, spritegen stays FROZEN), each carrying the SAME solidity as the base tile it
// stands in for (meadow ground/dirt path walkable, castle stone wall solid like office_wall).
// Appended at the tail so no existing index shifts; tools/sync-romania-tiles.ts grows the
// otterbrook full-override strip matching trailing columns.
TILESET.push({ name: 'romania_ground', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'romania_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'romania_wall', solid: true, make: officeWall });

// Ch.10 region tiles (Alaska / Hawaii / Mars) — same partial-override contract as the China /
// Romania sets above: the authored {Aurora,Lani,Mars}_tiles_16.png strips supply the real look at
// runtime (wired in spritegen/authored.ts), applied ONLY to the Ch.10 maps via the render-time
// name-remaps AURORA/LANI/MARS_TILE_SKIN in OverworldScene.buildTiles. make() = boot FALLBACK only
// (REUSED painters, spritegen stays FROZEN), each carrying the SAME solidity as the base tile it
// stands in for (ground/path walkable, wall solid like office_wall). Appended at the tail so no
// existing index shifts; tools/sync-ch10-tiles.ts grows the otterbrook strip matching columns.
TILESET.push({ name: 'aurora_ground', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'aurora_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'aurora_wall', solid: true, make: officeWall });
TILESET.push({ name: 'lani_ground', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'lani_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'lani_wall', solid: true, make: officeWall });
TILESET.push({ name: 'mars_ground', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'mars_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'mars_wall', solid: true, make: officeWall });

// Ch.4 NORWAY (Kvisthavn / Bootstep Moor / Lilleby) region tiles — same partial-override
// contract as the sets above: the authored Norway_tiles_16.png strip supplies the real look
// at runtime (wired in spritegen/authored.ts), applied ONLY to the Ch.4 outdoor maps via the
// render-time name-remap NORWAY_TILE_SKIN in OverworldScene.buildTiles. make() = boot FALLBACK
// only (REUSED painters, spritegen stays FROZEN), each carrying the SAME solidity as the base
// tile it stands in for (snow ground / cobble lane walkable; cliff wall + fjord water solid
// like office_wall / sea_a). Appended at the tail so no existing index shifts;
// tools/sync-ch4-ch6-tiles.ts grows the otterbrook strip matching columns.
TILESET.push({ name: 'norway_ground', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'norway_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'norway_wall', solid: true, make: officeWall });
TILESET.push({ name: 'norway_water', solid: true, make: () => seaTile(1) });

// Ch.6 AFRICA (Zanzibel / Savanna Run / Laughing Ruins) region tiles — same contract. The
// authored Africa_tiles_16.png strip authors THREE sub-biome grounds (ochre-sand port,
// savanna grassland, cracked-earth ruins), so Ch.6 carries three map-scoped skins
// (ZANZIBEL/SAVANNA/RUINS_TILE_SKIN in OverworldScene.buildTiles) sharing these tiles.
TILESET.push({ name: 'africa_sand', solid: false, make: () => sandTile(3) });
TILESET.push({ name: 'africa_path', solid: false, make: sidewalkTile });
TILESET.push({ name: 'africa_wall', solid: true, make: pyramidWall });
TILESET.push({ name: 'africa_water', solid: true, make: () => seaTile(1) });
TILESET.push({ name: 'africa_earth', solid: false, make: () => sandTile(3) });
TILESET.push({ name: 'africa_ruin_wall', solid: true, make: pyramidWall });
TILESET.push({ name: 'africa_grass', solid: false, make: () => grassBase(1, 5) });

// EB GROUND KIT (2026-07-02 baseline overhaul) — terracing tiles for the Onett-style
// town construction (cliff faces between terrace levels, grassy lip trim on the upper
// edge, concrete stairs connecting levels). Same contract as every set above: authored
// columns in otterbrook_tiles_16.png supply the real look (grown by
// tools/apply-eb-tile-kit.ts); make() = boot FALLBACK only (REUSED painters, spritegen
// stays FROZEN). cliff_face is solid like a wall; the lip + stairs are walkable.
// Grid chars: 'K' = cliff_face, '^' = cliff_lip, 'T' = stairs (CHAR_LEGEND, maps.ts).
TILESET.push({ name: 'cliff_face', solid: true, make: pyramidWall });
TILESET.push({ name: 'cliff_lip', solid: false, make: () => grassBase(1, 5) });
TILESET.push({ name: 'stairs', solid: false, make: sidewalkTile });
// the UNDER-OAK's root-tangle wall (ADR-121 rework): the dungeon's K cells
// reskin to this by name (UNDEROAK_TILE_SKIN in OverworldScene.buildTiles) —
// same solidity as the cliff it stands in for. Authored column via
// tools/apply-eb-tile-kit.ts (eb-grounds-fix sheet, cell 7).
TILESET.push({ name: 'root_wall', solid: true, make: officeWall });

export function tileIndexByName(name: string): number {
  const i = TILESET.findIndex((t) => t.name === name);
  if (i < 0) throw new Error(`unknown tile ${name}`);
  return i;
}

/* ---------------------------------------------------------------- */
/* Props (placed as sprites with depth-sort + collision rects)        */

/**
 * Trees, v3.1: 1px outline, two-tone checker-dithered canopy with a lit
 * crown, root flare. The ground shadow is stamped AFTER the outline pass
 * (shadowUnder) so it never grows an outline of its own. All variants share
 * the 26×34 canvas and trunk-bottom row so the canon solid rect {7,22,12,10}
 * fits every one.
 */
function treeTrunk(pm: Pixmap, topY: number): void {
  const bark = px(RAMP.EARTH, 1);
  const barkD = px(RAMP.EARTH, 0);
  const barkL = px(RAMP.EARTH, 2);
  pm.rect(11, topY, 4, 32 - topY, bark);
  pm.vline(11, topY, 32 - topY, barkL);
  pm.vline(14, topY, 32 - topY, barkD);
  // root flare
  pm.set(10, 31, bark);
  pm.set(15, 31, bark);
  pm.set(9, 31, barkD);
  pm.set(16, 31, barkD);
}

export function drawTree(variant: 'round' | 'tall' | 'small' = 'round'): Pixmap {
  const pm = new Pixmap(26, 34);
  const lo = px(RAMP.FOREST, 1);
  const mid = px(RAMP.FOREST, 2);
  const hi = px(RAMP.FOREST, 3);
  if (variant === 'round') {
    treeTrunk(pm, 24);
    pm.ellipse(13, 13, 11, 12, lo);
    pm.checker(2, 1, 22, 25, lo, mid, 2);
    // lit crown + a couple of leaf clumps breaking the silhouette
    pm.ellipse(8, 7, 4, 3, hi);
    pm.set(13, 3, hi);
    pm.ellipse(19, 16, 3, 2, lo);
    pm.set(2, 10, lo);
    pm.set(24, 12, lo);
    // dark under-canopy
    pm.hline(8, 24, 10, px(RAMP.FOREST, 0));
  } else if (variant === 'tall') {
    treeTrunk(pm, 26);
    pm.ellipse(13, 16, 9, 10, lo);
    pm.ellipse(13, 8, 7, 7, lo);
    pm.checker(4, 0, 18, 27, lo, mid, 2);
    pm.ellipse(9, 4, 3, 2, hi);
    pm.set(14, 2, hi);
    pm.hline(9, 26, 8, px(RAMP.FOREST, 0));
  } else {
    treeTrunk(pm, 26);
    pm.ellipse(13, 18, 9, 9, lo);
    pm.checker(4, 9, 18, 19, lo, mid, 2);
    pm.ellipse(9, 13, 3, 2, hi);
    pm.hline(9, 26, 9, px(RAMP.FOREST, 0));
  }
  pm.finish(); // ADR-101
  pm.shadowUnder(13, 32, 9, px(RAMP.FOREST, 0));
  return pm;
}

/** the pine — same canvas + trunk bottom, layered skirts */
export function drawPine(): Pixmap {
  const pm = new Pixmap(26, 34);
  const lo = px(RAMP.FOREST, 1);
  const mid = px(RAMP.FOREST, 2);
  const hi = px(RAMP.FOREST, 3);
  treeTrunk(pm, 27);
  // three skirts, each a stepped triangle
  const skirt = (cy: number, half: number): void => {
    for (let r = 0; r < 6; r++) {
      const hw = Math.max(1, Math.floor((half * (r + 2)) / 7));
      pm.hline(13 - hw, cy + r, hw * 2 + 1, lo);
    }
  };
  skirt(2, 4);
  skirt(8, 7);
  skirt(15, 10);
  skirt(22, 12);
  pm.checker(1, 2, 24, 26, lo, mid, 2);
  // snow-light catch on the left edges of each skirt
  pm.set(13, 1, hi);
  pm.line(11, 4, 9, 6, hi);
  pm.line(9, 10, 6, 13, hi);
  pm.line(7, 17, 4, 20, hi);
  pm.finish(); // ADR-101
  pm.shadowUnder(13, 32, 9, px(RAMP.FOREST, 0));
  return pm;
}

export function drawSign(): Pixmap {
  const pm = new Pixmap(16, 18);
  const wood = px(RAMP.EARTH, 2);
  pm.rect(2, 2, 12, 9, wood);
  pm.hline(3, 2, 10, px(RAMP.EARTH, 3));
  pm.frame(2, 2, 12, 9, px(RAMP.EARTH, 0));
  pm.hline(4, 5, 8, px(RAMP.EARTH, 0));
  pm.hline(4, 7, 6, px(RAMP.EARTH, 0));
  pm.set(3, 3, px(RAMP.EARTH, 1)); // nail
  pm.set(12, 3, px(RAMP.EARTH, 1));
  pm.rect(6, 11, 3, 6, px(RAMP.EARTH, 1));
  pm.vline(6, 11, 6, px(RAMP.EARTH, 2));
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(7, 16, 4, px(RAMP.GRASS, 1));
  return pm;
}

/** doormat — the universal "this is a door" decal */
export function drawDoormat(): Pixmap {
  const pm = new Pixmap(18, 10);
  pm.rect(1, 1, 16, 8, px(RAMP.EARTH, 3));
  pm.frame(1, 1, 16, 8, px(RAMP.GOLD, 2));
  pm.hline(4, 3, 10, px(RAMP.EARTH, 2));
  pm.hline(4, 5, 10, px(RAMP.EARTH, 2));
  pm.hline(4, 7, 10, px(RAMP.EARTH, 2));
  pm.set(2, 2, px(RAMP.GOLD, 3)); // stitch catch
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** staircase decal for floor-to-floor exits */
export function drawStairs(): Pixmap {
  const pm = new Pixmap(18, 24);
  pm.rect(2, 1, 14, 5, C.inkSoft);
  pm.rect(3, 1, 12, 3, C.outline);
  pm.rect(2, 6, 14, 4, px(RAMP.EARTH, 1));
  pm.hline(2, 6, 14, px(RAMP.EARTH, 0));
  pm.rect(2, 10, 14, 4, px(RAMP.EARTH, 2));
  pm.hline(2, 10, 14, px(RAMP.EARTH, 1));
  pm.rect(2, 14, 14, 4, px(RAMP.EARTH, 3));
  pm.hline(2, 14, 14, px(RAMP.EARTH, 1));
  pm.rect(2, 18, 14, 5, px(RAMP.EARTH, 3));
  pm.hline(2, 18, 14, px(RAMP.EARTH, 2));
  pm.vline(1, 1, 22, px(RAMP.EARTH, 0));
  pm.vline(16, 1, 22, px(RAMP.EARTH, 0));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** §A4.5 (S14): the unrolled blanket the picnic scene spreads on the grass */
export function drawPicnicBlanket(): Pixmap {
  const pm = new Pixmap(40, 24);
  pm.checkerFill(1, 1, 38, 22, px(RAMP.RED, 2), px(RAMP.PAPER, 3), 3);
  pm.frame(1, 1, 38, 22, px(RAMP.RED, 1));
  // a thermos and two paper plates, set out with intent (never scatter)
  pm.rect(8, 8, 4, 7, px(RAMP.CYAN, 2));
  pm.hline(8, 8, 4, px(RAMP.CYAN, 3));
  pm.ellipse(22, 12, 4, 2, px(RAMP.PAPER, 3));
  pm.ellipse(30, 8, 3, 2, px(RAMP.PAPER, 3));
  pm.set(22, 12, px(RAMP.GOLD, 2)); // something good on the plate
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** §A4.5 (S14): the songbird that lands on the picnic — two hop frames */
export function drawSongbird(frame: 0 | 1): Pixmap {
  const pm = new Pixmap(12, 12);
  const body = px(RAMP.CYAN, 2);
  const hop = frame === 1 ? -1 : 0;
  pm.ellipse(5, 8 + hop, 3, 2, body);
  pm.ellipse(4, 7 + hop, 2, 1, px(RAMP.CYAN, 3));
  pm.ellipse(8, 5 + hop, 2, 2, body); // head
  pm.set(10, 5 + hop, px(RAMP.GOLD, 2)); // beak
  pm.set(8, 4 + hop, C.outline); // eye
  pm.line(2, 8 + hop, 0, 6 + hop, px(RAMP.CYAN, 1)); // tail
  if (frame === 0) {
    pm.vline(5, 10, 2, px(RAMP.ORANGE, 2)); // legs planted
    pm.vline(7, 10, 2, px(RAMP.ORANGE, 2));
  } else {
    pm.set(5, 10, px(RAMP.ORANGE, 2)); // mid-hop tuck
    pm.set(7, 10, px(RAMP.ORANGE, 2));
  }
  pm.finish(); // ADR-101
  return pm;
}

export function drawPicnicTable(): Pixmap {
  const pm = new Pixmap(36, 26);
  const wood = px(RAMP.EARTH, 2);
  const woodL = px(RAMP.EARTH, 3);
  const woodD = px(RAMP.EARTH, 1);
  // tabletop planks
  pm.rect(4, 6, 28, 8, wood);
  pm.hline(4, 6, 28, woodL);
  pm.hline(4, 9, 28, woodD);
  pm.hline(4, 12, 28, woodD);
  pm.frame(4, 6, 28, 8, woodD);
  // checkered cloth draped over one end, with a hanging corner
  pm.checkerFill(20, 6, 12, 8, px(RAMP.RED, 2), px(RAMP.PAPER, 3), 2);
  pm.rect(28, 14, 4, 3, px(RAMP.RED, 2));
  pm.set(29, 15, px(RAMP.PAPER, 3));
  pm.hline(20, 13, 12, px(RAMP.RED, 1)); // cloth shade at the table edge
  // A-frame legs
  pm.rect(8, 14, 3, 8, woodD);
  pm.rect(25, 14, 3, 8, woodD);
  pm.vline(8, 14, 8, wood);
  pm.vline(25, 14, 8, wood);
  // benches
  pm.rect(0, 16, 12, 3, wood);
  pm.hline(0, 16, 12, woodL);
  pm.rect(24, 16, 12, 3, wood);
  pm.hline(24, 16, 12, woodL);
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(17, 23, 15, px(RAMP.GRASS, 1));
  return pm;
}

export function drawPhoneTable(): Pixmap {
  const pm = new Pixmap(16, 18);
  pm.rect(2, 8, 12, 3, px(RAMP.EARTH, 2));
  pm.hline(2, 8, 12, px(RAMP.EARTH, 3));
  pm.rect(3, 11, 2, 6, px(RAMP.EARTH, 1));
  pm.rect(11, 11, 2, 6, px(RAMP.EARTH, 1));
  pm.hline(4, 8, 8, px(RAMP.PAPER, 3)); // doily
  // the phone — cherry red, the most important object in the game
  pm.rect(4, 4, 8, 4, px(RAMP.RED, 2));
  pm.vline(4, 4, 4, px(RAMP.RED, 3));
  pm.rect(3, 2, 10, 2, px(RAMP.RED, 3)); // handset
  pm.set(3, 3, px(RAMP.RED, 2));
  pm.set(12, 3, px(RAMP.RED, 2));
  pm.set(6, 5, px(RAMP.RED, 1)); // dial
  pm.set(8, 5, px(RAMP.RED, 1));
  pm.set(13, 9, px(RAMP.RED, 1)); // the cord, heading off-table
  pm.set(14, 10, px(RAMP.RED, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the quilted bed — grandma stitched this one square at a time */
export function drawBed(): Pixmap {
  const pm = new Pixmap(20, 30);
  pm.rect(2, 2, 16, 5, px(RAMP.EARTH, 1)); // headboard
  pm.hline(2, 2, 16, px(RAMP.EARTH, 2));
  pm.set(2, 2, px(RAMP.EARTH, 3)); // post knobs
  pm.set(17, 2, px(RAMP.EARTH, 3));
  pm.rect(3, 5, 14, 6, px(RAMP.PAPER, 3)); // pillow
  pm.frame(3, 5, 14, 6, px(RAMP.PAPER, 1));
  pm.hline(6, 8, 8, px(RAMP.PAPER, 1)); // pillow crease
  // folded sheet band
  pm.rect(2, 11, 16, 3, px(RAMP.PAPER, 2));
  pm.hline(2, 11, 16, px(RAMP.PAPER, 3));
  // the quilt: red field, cream lattice, gold knots
  pm.rect(2, 14, 16, 13, px(RAMP.RED, 2));
  for (let y = 14; y < 27; y++) {
    for (let x = 2; x < 18; x++) {
      if ((x + y) % 6 === 0 || (x - y + 60) % 6 === 0) pm.set(x, y, px(RAMP.PAPER, 3));
      if ((x + y) % 6 === 3 && (x - y + 60) % 6 === 3) pm.set(x, y, px(RAMP.GOLD, 3));
    }
  }
  pm.vline(2, 14, 13, px(RAMP.RED, 3)); // lit edge
  pm.vline(17, 14, 13, px(RAMP.RED, 1));
  pm.rect(2, 26, 16, 2, px(RAMP.EARTH, 1)); // footboard
  pm.hline(2, 26, 16, px(RAMP.EARTH, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawDesk(): Pixmap {
  const pm = new Pixmap(26, 18);
  pm.rect(2, 4, 22, 7, px(RAMP.EARTH, 2));
  pm.hline(2, 4, 22, px(RAMP.EARTH, 3));
  pm.hline(2, 10, 22, px(RAMP.EARTH, 1));
  pm.rect(3, 11, 3, 6, px(RAMP.EARTH, 1));
  pm.rect(20, 11, 3, 6, px(RAMP.EARTH, 1));
  pm.vline(3, 11, 6, px(RAMP.EARTH, 2));
  pm.vline(20, 11, 6, px(RAMP.EARTH, 2));
  // gooseneck lamp, on
  pm.set(6, 1, px(RAMP.GOLD, 3));
  pm.rect(5, 2, 3, 2, px(RAMP.RED, 2));
  pm.vline(6, 3, 2, C.inkSoft);
  pm.set(5, 4, px(RAMP.GOLD, 3)); // pool of light on the desk
  pm.hline(4, 5, 4, px(RAMP.EARTH, 3));
  // comic book, mid-issue
  pm.rect(14, 5, 6, 4, px(RAMP.PAPER, 3));
  pm.set(15, 6, px(RAMP.RED, 2));
  pm.set(17, 6, px(RAMP.BLUE, 2));
  pm.hline(14, 8, 6, px(RAMP.PAPER, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawSofa(): Pixmap {
  const pm = new Pixmap(34, 20);
  const cloth = px(RAMP.ORANGE, 2);
  const clothL = px(RAMP.ORANGE, 3);
  const clothD = px(RAMP.ORANGE, 1);
  pm.rect(2, 2, 30, 8, cloth); // back
  pm.hline(3, 2, 28, clothL);
  pm.rect(2, 8, 30, 8, clothD); // seat shadow band
  pm.rect(3, 9, 28, 5, cloth); // cushions
  pm.vline(17, 9, 5, clothD); // cushion seam
  pm.hline(3, 9, 28, clothL);
  pm.rect(2, 6, 5, 10, cloth); // arms
  pm.rect(27, 6, 5, 10, cloth);
  pm.vline(2, 6, 10, clothL);
  pm.vline(31, 7, 9, clothD);
  pm.hline(2, 15, 30, clothD); // skirt
  pm.set(4, 17, px(RAMP.EARTH, 0)); // feet
  pm.set(29, 17, px(RAMP.EARTH, 0));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawCounter(): Pixmap {
  const pm = new Pixmap(30, 18);
  pm.rect(2, 2, 26, 6, px(RAMP.PAPER, 3));
  pm.hline(2, 7, 26, px(RAMP.PAPER, 1));
  pm.rect(2, 8, 26, 8, px(RAMP.CYAN, 2));
  pm.hline(2, 8, 26, px(RAMP.CYAN, 1));
  pm.vline(15, 9, 6, px(RAMP.CYAN, 1)); // cabinet doors
  pm.set(13, 11, px(RAMP.PAPER, 3)); // knobs
  pm.set(17, 11, px(RAMP.PAPER, 3));
  // pie cooling, obviously
  pm.ellipse(9, 3, 4, 2, px(RAMP.ORANGE, 2));
  pm.hline(6, 2, 7, px(RAMP.GOLD, 3)); // crimped crust
  pm.set(9, 1, px(RAMP.PAPER, 2)); // steam
  pm.set(8, 0, px(RAMP.PAPER, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawBugZapper(): Pixmap {
  const pm = new Pixmap(14, 26);
  pm.vline(6, 6, 18, C.inkSoft);
  pm.vline(7, 6, 18, C.inkSoft);
  pm.rect(3, 1, 8, 7, px(RAMP.NIGHT, 2));
  pm.frame(3, 1, 8, 7, C.inkSoft);
  pm.rect(5, 2, 4, 5, px(RAMP.CYAN, 3)); // the deadly glow
  pm.set(6, 3, px(RAMP.PAPER, 3));
  pm.set(5, 5, px(RAMP.CYAN, 2));
  pm.set(2, 3, px(RAMP.CYAN, 3)); // glow spill
  pm.set(11, 4, px(RAMP.CYAN, 3));
  pm.hline(4, 0, 6, C.inkSoft);
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawMeteorRock(): Pixmap {
  const pm = new Pixmap(30, 24);
  pm.ellipse(15, 13, 13, 9, C.inkSoft);
  pm.ellipse(13, 11, 9, 6, px(RAMP.NIGHT, 2));
  pm.ellipse(10, 9, 4, 2, px(RAMP.NIGHT, 3)); // starlight on the crown
  // glowing cracks
  pm.line(8, 14, 14, 9, px(RAMP.ORANGE, 2));
  pm.line(14, 9, 20, 13, px(RAMP.GOLD, 2));
  pm.line(13, 16, 18, 17, px(RAMP.ORANGE, 1));
  pm.set(14, 9, px(RAMP.GOLD, 3));
  pm.set(17, 12, px(RAMP.GOLD, 3));
  pm.finish(); // ADR-101
  return pm;
}

/**
 * A road-work SAWHORSE (S15i, Task 0) — the meteor-drop roadblock's barricade
 * and the sleeping-town gate at Otterbrook's east line. An A-frame trestle with
 * a hazard-striped board (orange-on-cream, the universal "do not pass" read).
 * Placed as a prop; the map gives it a solid that seals the lane it sits on.
 */
export function drawSawhorse(): Pixmap {
  const pm = new Pixmap(26, 20);
  const wood = px(RAMP.EARTH, 2);
  const woodD = px(RAMP.EARTH, 1);
  // splayed A-frame legs
  pm.line(4, 18, 8, 8, woodD);
  pm.line(5, 18, 9, 8, wood);
  pm.line(21, 18, 17, 8, woodD);
  pm.line(20, 18, 16, 8, wood);
  // the cross board
  pm.rect(3, 6, 20, 5, px(RAMP.PAPER, 3));
  // diagonal hazard stripes, clipped to the board
  for (let i = -1; i < 5; i++) {
    const x0 = 4 + i * 4;
    for (let t = 0; t < 5; t++) {
      const x = x0 + t;
      const y = 10 - t;
      if (x >= 4 && x <= 21 && y >= 6 && y <= 10) pm.set(x, y, px(RAMP.ORANGE, 2));
    }
  }
  pm.frame(3, 6, 20, 5, woodD);
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(13, 19, 9, px(RAMP.GRASS, 1));
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
  pm.set(5, 5, px(RAMP.PAPER, 3));
  pm.finish(); // ADR-101
  return pm;
}

export function drawLemonadeStand(): Pixmap {
  const pm = new Pixmap(36, 30);
  // booth with wood grain
  pm.rect(2, 12, 32, 12, px(RAMP.GOLD, 2));
  pm.hline(2, 12, 32, px(RAMP.GOLD, 3));
  pm.hline(2, 16, 32, px(RAMP.GOLD, 1));
  pm.hline(2, 20, 32, px(RAMP.GOLD, 1));
  pm.rect(2, 22, 32, 2, px(RAMP.GOLD, 1));
  // banner
  pm.rect(4, 2, 28, 8, px(RAMP.PAPER, 3));
  pm.frame(4, 2, 28, 8, px(RAMP.RED, 2));
  drawTextInto(pm, '25c', 9, 3, px(RAMP.RED, 1));
  // pitcher + lemon bowl
  pm.rect(26, 6, 5, 6, px(RAMP.CYAN, 3));
  pm.rect(27, 8, 3, 3, px(RAMP.GOLD, 3));
  pm.set(26, 6, px(RAMP.PAPER, 3));
  pm.hline(20, 11, 4, px(RAMP.GOLD, 3)); // lemons on the counter
  pm.set(21, 10, px(RAMP.GOLD, 3));
  pm.vline(2, 24, 4, px(RAMP.GOLD, 1));
  pm.vline(33, 24, 4, px(RAMP.GOLD, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawBusSign(): Pixmap {
  const pm = new Pixmap(14, 26);
  pm.vline(6, 8, 16, C.inkSoft);
  pm.vline(7, 8, 16, C.inkSoft);
  pm.rect(2, 1, 10, 8, px(RAMP.BLUE, 2));
  pm.frame(2, 1, 10, 8, px(RAMP.PAPER, 3));
  drawTextInto(pm, 'B', 5, 2, px(RAMP.PAPER, 3));
  pm.set(3, 2, px(RAMP.BLUE, 3)); // sky glint
  pm.finish({ aa: false }); // ADR-101
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
  /** roof construction — hip (default) or front-facing gable */
  roofStyle?: 'hip' | 'gable';
  /** striped awning over the windows in this ramp (shops) */
  awning?: number;
  /** one window carries a humming AC unit */
  ac?: boolean;
  /** seeds the per-window curtains/blinds/flowerboxes — every home differs */
  litSeed?: number;
}

/**
 * drawHouse v3.1 — the true EB oblique. Same canvas + band math as ever
 * (door rect, wall floor, total dims FIXED — map solids/door zones depend
 * on them), but houses without a sign band now let the ROOF PLANE run 6px
 * down into the wall band, so the roof reads as the dominant top surface
 * (the Mother 2 proportion) and the visible siding shrinks to a skirt.
 * Windows ride lower to follow. Shops keep the shallow roof — their sign
 * band + awning carry the volume instead.
 *
 * Anti-tell rules applied here: flat tone zones with ONE clustered dither
 * seam (no full-surface dither), off-center gablet/chimney, per-window
 * curtain/flowerbox variety from litSeed, and no outlined shadows.
 */
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
  const wallL = px(RAMP.PAPER, 3);
  const wallD = px(RAMP.PAPER, 1);
  const wallDD = px(RAMP.PAPER, 0);
  const roof = px(o.roof, 2);
  const roofD = px(o.roof, 1);
  const roofDD = px(o.roof, 0);
  const roofL = px(o.roof, 3);
  const rng = mulberry32((o.litSeed ?? 3) * 131 + o.wallTiles);

  // deep roof for houses; shallow for signed shops (sign band needs its row)
  const deepRoof = signH === 0;
  const eavesY = deepRoof ? wallTop + 4 : top + 16; // fascia top row
  const wallShowTop = eavesY + 3; // first siding row under the eaves shadow

  /* ---- siding skirt ---- */
  pm.rect(1, wallTop, w, wallH, wall);
  for (let y = wallShowTop + 4; y < wallTop + wallH; y += 4) pm.hline(1, y, w, wallD);
  pm.vline(1, wallShowTop, wallTop + wallH - wallShowTop, wallL); // lit corner board
  pm.vline(w, wallShowTop + 1, wallTop + wallH - wallShowTop - 1, wallD);
  pm.hline(1, wallTop + wallH - 1, w, wallDD); // base course

  /* ---- THE ROOF PLANE (ridge at the back, eaves toward you) ---- */
  const planeBot = eavesY - 1;
  const planeRows = planeBot - top + 1;
  // body: lit upper third, mid, shaded eaves zone — flat zones, no noise
  for (let r = 0; r < planeRows; r++) {
    const y = top + r;
    const zone = r < 2 ? roofL : r < Math.floor(planeRows * 0.55) ? roof : roofD;
    const inset = r === 0 ? 5 : r === 1 ? 3 : r === 2 ? 1 : 0;
    pm.hline(1 + inset, y, w - inset * 2, zone);
  }
  // ridge cap
  pm.hline(6, top, w - 10, roofL);
  pm.hline(4, top + 1, 4, roofL);
  pm.hline(w - 6, top + 1, 4, roofL);
  // hip seams: one clean diagonal per side
  pm.line(6, top + 1, 1, planeBot, roofDD);
  pm.line(w - 5, top + 1, w, planeBot, roofDD);
  // the ONE dither seam where mid meets shade (2px clusters, off-phase)
  const seamY = top + Math.floor(planeRows * 0.55);
  for (let x = 2; x < w - 1; x += 4) {
    pm.hline(x, seamY, 2, roof);
    if (x + 5 < w) pm.set(x + 5, seamY + 1, roof);
  }
  // one long shingle seam in the lit zone, broken twice (hand-worn)
  const shY = top + 4;
  pm.hline(3, shY, Math.floor(w / 3), roofD);
  pm.hline(Math.floor(w / 3) + 6, shY, Math.floor(w / 3) - 2, roofD);
  pm.hline(2 * Math.floor(w / 3) + 7, shY, Math.floor(w / 4), roofD);

  /* ---- gablet dormer (off-center — 'gable' style) ---- */
  if (o.roofStyle === 'gable' && deepRoof) {
    const gx = 2 + Math.floor(w * 0.22); // deliberately not centered
    const gy = top + 3;
    // face
    for (let r = 0; r < 6; r++) {
      const half = Math.min(5, r + 1);
      pm.hline(gx + 5 - half, gy + r, half * 2 + 1, wall);
    }
    pm.hline(gx + 1, gy + 6, 9, wallD); // face base shade
    // rake edges
    pm.line(gx + 5, gy - 1, gx, gy + 5, roofL);
    pm.line(gx + 5, gy - 1, gx + 10, gy + 5, roofDD);
    pm.set(gx + 5, gy - 1, roofL);
    // vent
    pm.rect(gx + 4, gy + 3, 3, 3, wallD);
    pm.hline(gx + 4, gy + 4, 3, wallDD);
  }

  /* ---- chimney, off-center right, sitting ON the plane ---- */
  if (o.chimney) {
    const chx = w - 12 - (o.wallTiles % 2) * 3;
    pm.rect(chx, top + 2, 8, 11, px(RAMP.RED, 1));
    pm.vline(chx, top + 2, 11, px(RAMP.RED, 2));
    pm.hline(chx - 1, top + 2, 10, px(RAMP.PAPER, 2)); // concrete cap
    pm.hline(chx + 1, top + 5, 6, px(RAMP.PAPER, 0)); // mortar
    pm.hline(chx + 1, top + 8, 6, px(RAMP.PAPER, 0));
    pm.vline(chx + 4, top + 6, 2, px(RAMP.PAPER, 0)); // head joint
    pm.hline(chx, top + 13, 9, roofDD); // its little shadow on the shingles
  }

  /* ---- eaves fascia + cast shadow ---- */
  pm.hline(0, eavesY, w + 2, roofL); // sun on the fascia lip
  pm.hline(0, eavesY + 1, w + 2, roofDD); // board face
  pm.hline(0, eavesY + 2, w + 2, px(RAMP.INK, 1)); // the under-eave dark
  if (deepRoof) pm.hline(1, eavesY + 3, w, wallD); // soft shadow on siding

  /* ---- sign band (shops) ---- */
  if (o.signText !== undefined) {
    const sy = top + roofH;
    pm.rect(1, sy, w, signH, px(RAMP.PAPER, 3));
    pm.frame(1, sy, w, signH, wallD);
    pm.hline(2, sy + signH - 1, w - 2, wallDD); // sign shadow lip
    const tw = o.signText.length * 6 - 1;
    drawTextInto(pm, o.signText, Math.floor((w - tw) / 2) + 1, sy + 3, C.inkSoft);
  }

  /* ---- steeple + cross (chapel) ---- */
  if (o.steeple) {
    const cx = Math.floor(w / 2) + 1;
    pm.rect(cx - 6, 10, 12, steepleH - 8, wall);
    pm.vline(cx - 6, 10, steepleH - 8, wallL);
    pm.vline(cx + 5, 10, steepleH - 8, wallD);
    pm.rect(cx - 8, 6, 16, 5, roofD);
    pm.hline(cx - 8, 6, 16, roof);
    pm.rect(cx - 5, 3, 10, 4, roof);
    pm.hline(cx - 5, 3, 10, roofL);
    pm.vline(cx, 12, 6, px(RAMP.GOLD, 2)); // cross
    pm.hline(cx - 2, 14, 5, px(RAMP.GOLD, 2));
    pm.set(cx, 12, px(RAMP.GOLD, 3));
    // belfry window
    pm.rect(cx - 2, 19, 4, 5, px(RAMP.NIGHT, 1));
    pm.set(cx - 1, 20, px(RAMP.GOLD, 2)); // the bell, glinting
  }

  /* ---- awning over the windows (shops only — houses get porch hoods) ---- */
  if (o.awning !== undefined && !deepRoof) {
    const ay = wallTop + 2;
    for (let x = 1; x < w + 1; x += 6) {
      pm.rect(x, ay, 3, 5, px(o.awning, 2));
      pm.vline(x, ay, 5, px(o.awning, 3));
      pm.rect(x + 3, ay, 3, 5, px(RAMP.PAPER, 3));
    }
    for (let x = 2; x < w; x += 3) pm.set(x, ay + 5, x % 6 < 3 ? px(o.awning, 2) : px(RAMP.PAPER, 3)); // scallops
    pm.hline(1, ay + 6, w, wallDD); // shade under the awning
  }

  /* ---- door (EXACT rect: 10×14 at dx, wallTop+wallH-14) ---- */
  const doorTile = o.doorAt ?? Math.floor(o.wallTiles / 2);
  const dx = 1 + doorTile * TILE + 3;
  const dh = 14;
  const doorTop = wallTop + wallH - dh;
  pm.rect(dx, doorTop, 10, dh, px(RAMP.EARTH, 1));
  pm.frame(dx, doorTop, 10, dh, px(RAMP.EARTH, 0));
  pm.vline(dx + 1, doorTop + 1, dh - 2, px(RAMP.EARTH, 2)); // lit stile
  pm.frame(dx + 2, doorTop + 6, 6, 6, px(RAMP.EARTH, 0)); // lower panel
  pm.rect(dx + 2, doorTop + 2, 6, 3, px(RAMP.CYAN, 1)); // transom glass
  pm.set(dx + 3, doorTop + 2, px(RAMP.CYAN, 3));
  pm.set(dx + 7, doorTop + 9, px(RAMP.GOLD, 3)); // knob
  pm.hline(dx - 1, wallTop + wallH - 1, 12, px(RAMP.EARTH, 0)); // step
  // porch hood: a little roof of its own over the door (houses)
  if (deepRoof) {
    pm.hline(dx - 2, doorTop - 4, 14, roofL);
    pm.hline(dx - 2, doorTop - 3, 14, roof);
    pm.hline(dx - 2, doorTop - 2, 14, roofD);
    pm.hline(dx - 1, doorTop - 1, 12, wallDD); // its shadow
    pm.set(dx - 1, doorTop, wallDD); // bracket feet
    pm.set(dx + 10, doorTop, wallDD);
  }
  // porch light beside the door — a warm point with a halo on the siding
  const plx = dx + 12;
  if (plx < w) {
    pm.set(plx, doorTop + 3, px(RAMP.INK, 1)); // bracket
    pm.set(plx, doorTop + 4, px(RAMP.GOLD, 3)); // bulb
    pm.set(plx - 1, doorTop + 4, px(RAMP.GOLD, 2));
    pm.set(plx + 1, doorTop + 4, px(RAMP.GOLD, 2));
    pm.set(plx, doorTop + 5, px(RAMP.GOLD, 2));
  }

  /* ---- windows: lower on deep-roof houses, with seeded variety ---- */
  const winRows = o.windows ?? Array.from({ length: o.wallTiles }, (_, i) => i).filter((i) => i !== doorTile);
  const wy = deepRoof ? wallTop + 10 : wallTop + 4;
  winRows.forEach((wt, wi) => {
    if (wt >= o.wallTiles) return;
    const wx = 1 + wt * TILE + 4;
    pm.rect(wx, wy, 8, 9, px(RAMP.CYAN, 1));
    pm.line(wx + 1, wy + 3, wx + 3, wy + 1, px(RAMP.CYAN, 3)); // glass shine
    pm.set(wx + 2, wy + 2, px(RAMP.CYAN, 2));
    const dress = rng();
    if (dress < 0.4) {
      // curtains, tied at the waist
      pm.vline(wx, wy, 9, px(RAMP.PAPER, 3));
      pm.vline(wx + 1, wy, 4, px(RAMP.PAPER, 3));
      pm.vline(wx + 7, wy, 9, px(RAMP.PAPER, 3));
      pm.vline(wx + 6, wy, 4, px(RAMP.PAPER, 3));
      pm.set(wx, wy + 5, px(RAMP.PAPER, 1));
      pm.set(wx + 7, wy + 5, px(RAMP.PAPER, 1));
    } else if (dress < 0.62) {
      // a half-drawn blind
      const drop = 3 + Math.floor(rng() * 3);
      pm.rect(wx, wy, 8, drop, px(RAMP.PAPER, 2));
      pm.hline(wx, wy + drop - 1, 8, px(RAMP.PAPER, 0));
      pm.set(wx + 4, wy + drop, px(RAMP.PAPER, 0)); // pull cord
    }
    pm.frame(wx - 1, wy - 1, 10, 11, px(RAMP.PAPER, 3));
    pm.hline(wx, wy + 4, 8, px(RAMP.PAPER, 3));
    pm.vline(wx + 4, wy, 9, px(RAMP.PAPER, 3));
    pm.hline(wx - 1, wy + 9, 10, wallD); // sill
    pm.hline(wx, wy + 10, 9, wallDD); // sill shadow
    if (dress >= 0.62 && dress < 0.8) {
      // flowerbox under the sill
      pm.rect(wx, wy + 10, 8, 2, px(RAMP.EARTH, 1));
      pm.hline(wx, wy + 10, 8, px(RAMP.EARTH, 2));
      pm.set(wx + 1, wy + 9, px(RAMP.RED, 3));
      pm.set(wx + 4, wy + 9, px(RAMP.GOLD, 3));
      pm.set(wx + 6, wy + 9, px(RAMP.RED, 3));
    }
    if (o.ac && wi === 0) {
      // window AC unit, dripping faithfully
      pm.rect(wx, wy + 5, 8, 4, px(RAMP.PAPER, 1));
      pm.hline(wx, wy + 5, 8, px(RAMP.PAPER, 2));
      pm.hline(wx + 1, wy + 7, 6, px(RAMP.PAPER, 0));
      pm.set(wx + 6, wy + 6, px(RAMP.INK, 1)); // vent
      pm.set(wx + 1, wy + 10, px(RAMP.CYAN, 3)); // the drip
    }
  });

  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/* ---------------------------------------------------------------- */
/* Brickton City props & buildings (S1, restyled S7)                  */

/** downtown building: flat parapet roof, window floors, sign band,
 *  storefront level with display windows + door. Height: 44 + 16·upperRows. */
export interface CityBuildingOpts {
  wallTiles: number;
  /** story count. 1–3 = classic storefront; ≥6 reads as a tower; ≥11 (H≥220px,
   *  ~14 tiles) is a MEGA-BUILDING whose top runs off-screen (S15i, ADR-050). */
  upperRows: number;
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
  /** seeds which windows are lit — every building's evening is different */
  litSeed?: number;
  /** S14: Spanish-colonial vocabulary INSIDE the fixed canvas (ADR-019) —
   *  arched window crowns + an arched doorway. Skip the awning with this. */
  arch?: boolean;
  /** S15i (ADR-050) — the height ladder grows up. The flags below add real
   *  facade-FAMILY vocabulary so generated districts don't read as five
   *  reskins; each is purely additive (an unset building draws byte-identical
   *  to its pre-S15i sprite). Combine with a large `upperRows` for MEGA towers. */
  /** TOWER read: pilastered curtain-wall bays + ribbon windows + a setback
   *  ledge + a rooftop water-tank crown (offices/apartments/mega-buildings). */
  tower?: boolean;
  /** a balcony slab + rail under each upper window row (apartment blocks) */
  balconies?: boolean;
  /** a bulb-lit marquee canopy over the storefront + a tall blade (theaters) */
  marquee?: boolean;
  /** ground floor is an arched arcade walk instead of display glass (markets) */
  colonnade?: boolean;
  /** columns flanking the door + a pediment notch in the parapet (civic halls) */
  portico?: boolean;
  /** the sign band + blade GLOW (neon storefronts — pair with a NIGHT wall) */
  neon?: boolean;
}

export const cityBuildingHeight = (upperRows: number): number => 44 + upperRows * 16;

/** TRUE if this opt set reads as a tower (its own window vocabulary) */
const isTower = (o: CityBuildingOpts): boolean => o.tower === true;

/**
 * The TOWER upper wall (S15i): pilastered curtain-wall bays of ribbon windows
 * with stepped setback ledges (more the taller it is), so a many-story shaft
 * reads as one stacked skyscraper, not a column of identical storefronts. Drawn
 * INSIDE the same (1,upTop,w,upH) band the storefront grammar reserves, so the
 * solid/door math is untouched at any height (2–4+ screen colossi included).
 */
function drawTowerWall(
  pm: Pixmap, o: CityBuildingOpts, w: number, upTop: number, upH: number,
  wallL: number, wallD: number, wallDD: number, litRng: () => number,
): void {
  const glassLit = px(RAMP.GOLD, 2);
  const glass = px(RAMP.CYAN, 1);
  // vertical pilasters between every bay — lit edge + shadow groove
  for (let t = 0; t <= o.wallTiles; t++) {
    const bx = 1 + t * TILE;
    pm.vline(bx, upTop, upH, wallL);
    pm.vline(bx + 1, upTop, upH, wallDD);
  }
  // ribbon windows, one per bay per floor; spandrel shadow under each
  for (let r = 0; r < o.upperRows; r++) {
    const wy = upTop + r * 16 + 4;
    for (let t = 0; t < o.wallTiles; t++) {
      const wx = 1 + t * TILE + 4;
      const lit = litRng() < 0.34;
      const g = lit ? glassLit : glass;
      const gm = lit ? px(RAMP.GOLD, 1) : px(RAMP.CYAN, 2);
      pm.rect(wx, wy, 9, 9, g);
      pm.vline(wx + 3, wy, 9, gm); // mullions
      pm.vline(wx + 6, wy, 9, gm);
      pm.hline(wx, wy + 4, 9, gm);
      pm.set(wx + 1, wy + 1, lit ? px(RAMP.GOLD, 3) : px(RAMP.CYAN, 3));
      pm.hline(wx - 1, wy + 9, 11, wallD); // spandrel
    }
  }
  // setback LEDGES: sunlit lips over their own shadow break the shaft into
  // stacked volumes — the taller the tower, the more steps (the art-deco
  // stepped-skyscraper read on the 2–4-screen colossi).
  const ledges =
    o.upperRows >= 30 ? [0.24, 0.42, 0.58, 0.72, 0.85]
    : o.upperRows >= 18 ? [0.3, 0.52, 0.72, 0.88]
    : o.upperRows >= 10 ? [0.5, 0.76]
    : [0.62];
  for (const f of ledges) {
    const sy = upTop + Math.floor(upH * f);
    pm.hline(1, sy, w, wallL);
    pm.hline(1, sy + 1, w, wallDD);
  }
}

/**
 * The TOWER crown (S15i): a rooftop water tank on stilts + a mechanical
 * penthouse, drawn within the parapet's roof-deck rows (no extra canvas
 * height, so placeFacade's H math is unchanged). Replaces the window-AC unit.
 */
function drawTowerCrown(pm: Pixmap, w: number, litRng: () => number): void {
  const tankX = 3 + Math.floor(litRng() * Math.max(1, w - 22));
  // penthouse box
  pm.rect(tankX, 1, 8, 5, px(RAMP.PAPER, 1));
  pm.hline(tankX, 1, 8, px(RAMP.PAPER, 2));
  pm.frame(tankX, 1, 8, 5, px(RAMP.PAPER, 0));
  // water tank: a squat cylinder on four legs, beside the penthouse
  const tx = Math.min(w - 9, tankX + 11);
  pm.rect(tx, 2, 7, 4, px(RAMP.EARTH, 1));
  pm.hline(tx, 2, 7, px(RAMP.EARTH, 2)); // sunlit band
  pm.set(tx + 1, 1, px(RAMP.EARTH, 2)); // domed lid
  pm.hline(tx + 1, 0, 5, px(RAMP.EARTH, 2));
  pm.set(tx + 1, 6, px(RAMP.INK, 1)); // legs
  pm.set(tx + 5, 6, px(RAMP.INK, 1));
}

export function drawCityBuilding(o: CityBuildingOpts): Pixmap {
  const w = o.wallTiles * TILE;
  const H = cityBuildingHeight(o.upperRows);
  const pm = new Pixmap(w + 2, H);
  const wall = px(o.wall, 2);
  const wallL = px(o.wall, 3);
  const wallD = px(o.wall, 1);
  const wallDD = px(o.wall, 0);
  const litRng = mulberry32(o.litSeed ?? 7);

  /* ---- parapet: coping in the sun, roof deck behind it, dentils ---- */
  pm.hline(0, 0, w + 2, wallL); // coping catches the light
  pm.hline(0, 1, w + 2, wallD);
  pm.hline(2, 2, w - 2, px(RAMP.INK, 1)); // the roof DECK behind the coping
  pm.rect(1, 3, w, 4, wallD);
  pm.checker(1, 5, w, 2, wallD, wallDD, 1); // dentil dither course
  pm.hline(1, 7, w, wallDD);
  if (isTower(o)) {
    // a tower wears a water-tank + penthouse crown, not a window AC unit
    drawTowerCrown(pm, w, litRng);
  } else {
    // rooftop AC unit + a vent pipe, breaking the parapet line
    const acx = 4 + Math.floor(litRng() * Math.max(1, w - 18));
    pm.rect(acx, 1, 9, 5, px(RAMP.PAPER, 1));
    pm.hline(acx, 1, 9, px(RAMP.PAPER, 2));
    pm.frame(acx, 1, 9, 5, px(RAMP.PAPER, 0));
    pm.ellipse(acx + 4, 3, 2, 1, px(RAMP.PAPER, 0)); // fan
    const ventX = Math.min(w - 3, acx + 14);
    pm.rect(ventX, 1, 2, 4, px(RAMP.PAPER, 0)); // pipe
    pm.hline(ventX - 1, 1, 4, px(RAMP.PAPER, 1)); // rain cap
  }
  // a civic pediment notches the parapet center (drawn over the coping)
  if (o.portico) {
    const cx = 1 + Math.floor(w / 2);
    for (let i = 0; i < 6; i++) pm.hline(cx - i, 1 + (5 - i), i * 2 + 1, wallL);
    pm.hline(cx - 6, 7, 13, wallDD); // the pediment's shadow base
  }

  /* ---- upper wall + window grid ---- */
  const upTop = 8;
  const upH = o.upperRows * 16;
  pm.rect(1, upTop, w, upH, wall);
  pm.vline(1, upTop, upH, wallL); // lit corner
  pm.vline(w, upTop, upH, wallD);
  if (isTower(o)) {
    drawTowerWall(pm, o, w, upTop, upH, wallL, wallD, wallDD, litRng);
  } else {
  if (o.wall === RAMP.RED || o.wall === RAMP.ORANGE) {
    // brick coursing
    for (let y = upTop + 3; y < upTop + upH; y += 4) pm.hline(1, y, w, wallD);
    for (let y = upTop; y < upTop + upH; y += 8) {
      for (let x = 5 + (y % 16 === 0 ? 0 : 4); x < w; x += 8) pm.set(x, y + 1, wallD);
    }
  }
  for (let r = 0; r < o.upperRows; r++) {
    for (let t = 0; t < o.wallTiles; t++) {
      if (o.smiley && t >= Math.floor(o.wallTiles / 2) - 1 && t <= Math.floor(o.wallTiles / 2)) continue;
      const wx = 1 + t * TILE + 4;
      const wy = upTop + r * 16 + 3;
      const roll = litRng();
      const lit = roll < 0.3;
      const hasAc = !lit && roll > 0.82;
      const blind = !lit && !hasAc && roll > 0.55;
      pm.rect(wx, wy, 8, 10, lit ? px(RAMP.GOLD, 2) : px(RAMP.CYAN, 1));
      if (lit) {
        pm.set(wx + 1, wy + 1, px(RAMP.GOLD, 3));
        pm.rect(wx + 5, wy + 4, 2, 6, px(RAMP.GOLD, 1)); // someone standing there
      } else {
        pm.line(wx + 1, wy + 3, wx + 3, wy + 1, px(RAMP.CYAN, 3)); // sky glint
        pm.set(wx + 2, wy + 2, px(RAMP.CYAN, 2));
      }
      if (blind) {
        // venetian blind, dropped to wherever its owner gave up
        const drop = 3 + Math.floor(litRng() * 5);
        pm.rect(wx, wy, 8, drop, px(RAMP.PAPER, 2));
        for (let by = wy + 1; by < wy + drop; by += 2) pm.hline(wx, by, 8, px(RAMP.PAPER, 1));
        pm.hline(wx, wy + drop - 1, 8, px(RAMP.PAPER, 0));
      }
      pm.frame(wx - 1, wy - 1, 10, 12, wallD);
      if (o.arch) {
        // the colonial crown: a rounded cap over the frame (S14 — drawn
        // INSIDE the window's own 16px band, the ADR-019 fixed-canvas law)
        pm.hline(wx, wy - 2, 8, wallD);
        pm.set(wx - 1, wy - 1, wallD);
        pm.set(wx + 8, wy - 1, wallD);
        pm.hline(wx + 1, wy - 3, 6, wallL);
        pm.set(wx + 3, wy - 2, wallL); // keystone catch
      }
      pm.hline(wx, wy + 5, 8, wallD);
      pm.hline(wx - 1, wy + 10, 10, wallL); // sill catch
      if (hasAc) {
        pm.rect(wx, wy + 6, 8, 4, px(RAMP.PAPER, 1));
        pm.hline(wx, wy + 6, 8, px(RAMP.PAPER, 2));
        pm.hline(wx + 1, wy + 8, 6, px(RAMP.PAPER, 0));
        pm.set(wx + 1, wy + 11, px(RAMP.CYAN, 3)); // drip
      }
    }
  }
  if (o.smiley) {
    const cx = 1 + Math.floor(w / 2);
    const cy = upTop + Math.floor(upH / 2);
    pm.ellipse(cx, cy, 9, 9, px(RAMP.GOLD, 2));
    pm.ellipse(cx - 3, cy - 4, 3, 3, px(RAMP.GOLD, 3));
    pm.rect(cx - 4, cy - 3, 2, 3, C.outline); // eyes
    pm.rect(cx + 2, cy - 3, 2, 3, C.outline);
    pm.hline(cx - 5, cy + 4, 11, C.outline); // the grin. wider than necessary.
    pm.set(cx - 5, cy + 3, C.outline);
    pm.set(cx + 5, cy + 3, C.outline);
    pm.hline(cx - 3, cy + 5, 7, px(RAMP.GOLD, 1)); // lower-lip shade
  }
  } // end non-tower upper wall
  // balcony slab + rail under each floor (apartment blocks — tower or standard)
  if (o.balconies) {
    for (let r = 0; r < o.upperRows; r++) {
      const by = upTop + r * 16 + 13;
      pm.hline(1, by, w, wallL); // slab lip in the sun
      pm.hline(1, by + 1, w, wallDD); // its shadow
      for (let x = 3; x < w; x += 3) pm.set(x, by - 1, wallD); // rail bars
    }
  }

  /* ---- sign band ---- */
  const sy = upTop + upH;
  const tw = o.signText.length * 6 - 1;
  if (o.neon) {
    // a dark fascia with a glowing neon tube tracing it + lit lettering
    pm.rect(1, sy, w, 12, px(RAMP.NIGHT, 0));
    pm.frame(1, sy + 1, w, 10, px(RAMP.MAGENTA, 2));
    pm.hline(2, sy + 2, w - 2, px(RAMP.MAGENTA, 3)); // the lit tube
    pm.hline(2, sy + 9, w - 2, px(RAMP.PURPLE, 2)); // its glow pooling below
    drawTextInto(pm, o.signText, Math.floor((w - tw) / 2) + 1, sy + 3, px(RAMP.CYAN, 3));
  } else {
    pm.rect(1, sy, w, 12, px(RAMP.PAPER, 3));
    pm.frame(1, sy, w, 12, wallDD);
    pm.hline(2, sy + 1, w - 2, px(RAMP.PAPER, 2)); // band top shade
    drawTextInto(pm, o.signText, Math.floor((w - tw) / 2) + 1, sy + 3, C.inkSoft);
  }
  if (o.cross) {
    const cx = w - 9;
    pm.rect(cx - 1, sy + 2, 4, 8, px(RAMP.RED, 2));
    pm.rect(cx - 3, sy + 4, 8, 4, px(RAMP.RED, 2));
    pm.set(cx - 1, sy + 2, px(RAMP.RED, 3));
  }

  /* ---- storefront level ---- */
  const fy = sy + 12;
  pm.rect(1, fy, w, 24, wall);
  pm.hline(1, fy, w, wallDD); // sign band drops a shadow
  pm.vline(1, fy, 24, wallL);
  pm.vline(w, fy, 24, wallD);
  pm.hline(1, fy + 23, w, wallDD);
  if (o.awning !== undefined) {
    // striped canvas awning with scallops and a shade line under it
    for (let x = 1; x < w + 1; x += 6) {
      pm.rect(x, fy, 3, 6, px(o.awning, 2));
      pm.vline(x, fy, 6, px(o.awning, 3));
      pm.rect(x + 3, fy, 3, 6, px(RAMP.PAPER, 3));
      pm.vline(x + 5, fy, 6, px(RAMP.PAPER, 2));
    }
    for (let x = 1; x < w + 1; x += 3) {
      pm.set(x + 1, fy + 6, x % 6 < 3 ? px(o.awning, 2) : px(RAMP.PAPER, 3)); // scallop drops
    }
    pm.hline(1, fy + 7, w, wallDD); // awning shadow
  }
  if (o.marquee) {
    // a bulb-lit theater canopy juts over the whole storefront
    pm.rect(0, fy + 1, w + 2, 5, px(RAMP.RED, 1));
    pm.hline(0, fy + 1, w + 2, px(RAMP.RED, 2)); // lit front edge
    pm.hline(0, fy + 6, w + 2, C.inkSoft); // canopy underside shadow
    for (let x = 3; x < w; x += 4) pm.set(x, fy + 5, px(RAMP.GOLD, 3)); // chase bulbs
    pm.hline(1, fy + 7, w, wallDD); // shadow it throws on the wall
  }

  /* ---- door + display windows (EXACT v2 rects) ---- */
  const doorTile = o.doorAt ?? Math.floor(o.wallTiles / 2);
  const dw = o.doubleDoor ? 22 : 12;
  const dx = 1 + doorTile * TILE + Math.floor((TILE - dw) / 2);
  for (let t = 0; t < o.wallTiles; t++) {
    if (t === doorTile || (o.doubleDoor && t === doorTile + 1)) continue;
    const wx = 1 + t * TILE + 2;
    if (o.colonnade) {
      // a market ARCADE: a shaded arched opening you walk under, lantern-lit
      pm.rect(wx, fy + 6, 12, 15, px(RAMP.NIGHT, 1));
      pm.contour(wx + 6, fy + 3, [2, 4, 5, 6], px(RAMP.NIGHT, 1)); // arch head
      pm.vline(wx - 1, fy + 6, 15, wallL); // the pier between arches
      pm.vline(wx + 12, fy + 6, 15, wallD);
      pm.set(wx + 6, fy + 12, px(RAMP.GOLD, 2)); // a lantern in the dark
      pm.set(wx + 6, fy + 13, px(RAMP.GOLD, 3));
      continue;
    }
    if (o.portico) {
      // a fluted civic column standing in a shadowed recess
      pm.rect(wx - 1, fy + 4, 14, 17, wallDD); // recess
      pm.rect(wx + 4, fy + 3, 4, 18, px(RAMP.PAPER, 3)); // shaft
      pm.vline(wx + 5, fy + 3, 18, px(RAMP.PAPER, 2)); // flute
      pm.rect(wx + 3, fy + 2, 6, 2, px(RAMP.PAPER, 3)); // capital
      pm.rect(wx + 3, fy + 20, 6, 2, px(RAMP.PAPER, 1)); // base
      continue;
    }
    if (o.marquee) {
      // a brass-cased coming-attractions poster
      pm.rect(wx, fy + 8, 12, 12, px(RAMP.NIGHT, 1));
      pm.rect(wx + 2, fy + 10, 8, 8, px(RAMP.PURPLE, 2));
      pm.set(wx + 5, fy + 12, px(RAMP.GOLD, 3)); // a star on the bill
      pm.frame(wx - 1, fy + 7, 14, 14, px(RAMP.GOLD, 2)); // brass case
      continue;
    }
    pm.rect(wx, fy + 7, 12, 13, px(RAMP.CYAN, 1));
    // goods on a shelf behind the glass
    pm.hline(wx + 1, fy + 15, 10, px(RAMP.PAPER, 1));
    pm.rect(wx + 2, fy + 12, 2, 3, px(RAMP.GOLD, 2));
    pm.rect(wx + 5, fy + 11, 3, 4, px(RAMP.RED, 2));
    pm.rect(wx + 9, fy + 13, 2, 2, px(RAMP.GRASS, 2));
    pm.line(wx + 2, fy + 16, wx + 8, fy + 10, px(RAMP.CYAN, 3)); // glass shine
    pm.line(wx + 3, fy + 17, wx + 9, fy + 11, px(RAMP.CYAN, 2));
    pm.frame(wx - 1, fy + 6, 14, 15, px(RAMP.PAPER, 3));
    if (o.arch) {
      // arched display tops (S14 colonial pass — same rects, crowned)
      pm.hline(wx, fy + 5, 12, px(RAMP.PAPER, 3));
      pm.hline(wx + 2, fy + 4, 8, px(RAMP.PAPER, 2));
    }
    pm.hline(wx - 1, fy + 21, 14, wallD); // ledge shadow
  }
  const doorTop = fy + 24 - 17;
  pm.rect(dx, doorTop, dw, 17, px(RAMP.EARTH, 1));
  pm.frame(dx, doorTop, dw, 17, px(RAMP.EARTH, 0));
  if (o.arch) {
    // the arched doorway: a crown of wall-light over the same door rect
    pm.hline(dx, doorTop - 1, dw, wallD);
    pm.hline(dx + 1, doorTop - 2, dw - 2, wallL);
    pm.set(dx + Math.floor(dw / 2), doorTop - 2, wallDD); // the keystone
    pm.set(dx - 1, doorTop, wallD);
    pm.set(dx + dw, doorTop, wallD);
  }
  if (o.doubleDoor) {
    pm.vline(dx + Math.floor(dw / 2), doorTop, 17, px(RAMP.EARTH, 0));
    pm.rect(dx + 2, doorTop + 3, 7, 8, px(RAMP.CYAN, 1));
    pm.rect(dx + 13, doorTop + 3, 7, 8, px(RAMP.CYAN, 1));
    pm.set(dx + 3, doorTop + 4, px(RAMP.CYAN, 3));
    pm.set(dx + 14, doorTop + 4, px(RAMP.CYAN, 3));
    pm.hline(dx + 2, doorTop + 12, 7, px(RAMP.PAPER, 2)); // push bars
    pm.hline(dx + 13, doorTop + 12, 7, px(RAMP.PAPER, 2));
  } else {
    pm.rect(dx + 2, doorTop + 3, dw - 4, 8, px(RAMP.CYAN, 1)); // shop door glass
    pm.set(dx + 3, doorTop + 4, px(RAMP.CYAN, 3));
    pm.set(dx + dw - 3, doorTop + 8, px(RAMP.GOLD, 3)); // handle
    pm.hline(dx + 1, doorTop + 14, dw - 2, px(RAMP.PAPER, 1)); // kickplate
  }

  /* ---- hanging blade sign on a bracket, beside the door ---- */
  const bladeRamp = o.awning ?? o.wall;
  const bx = dx >= 16 ? dx - 13 : dx + dw + 3;
  if (bx > 1 && bx + 9 < w) {
    pm.hline(bx + 2, fy + 1, 7, px(RAMP.INK, 1)); // bracket arm
    pm.set(bx + 8, fy + 2, px(RAMP.INK, 1));
    pm.rect(bx, fy + 3, 9, 11, px(bladeRamp, 2));
    pm.frame(bx, fy + 3, 9, 11, px(bladeRamp, 1));
    pm.vline(bx + 1, fy + 4, 9, px(bladeRamp, 3));
    drawTextInto(pm, o.signText[0], bx + 2, fy + 6, px(RAMP.PAPER, 3));
  }

  /* ---- side return: the building turns away on the right (2.5D) ---- */
  pm.vline(w - 1, upTop, H - upTop - 1, wallD);
  pm.vline(w, upTop, H - upTop - 1, wallDD);
  pm.vline(w, upTop + 2, 3, wallD); // a worn patch so the edge isn't a ruler

  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** payphone — Brickton's finest dial tone */
export function drawPayphone(): Pixmap {
  const pm = new Pixmap(16, 28);
  pm.rect(1, 1, 14, 4, px(RAMP.BLUE, 2)); // canopy
  pm.hline(2, 1, 12, px(RAMP.BLUE, 3));
  pm.hline(1, 4, 14, px(RAMP.BLUE, 1));
  pm.vline(2, 5, 19, px(RAMP.BLUE, 1)); // posts
  pm.vline(13, 5, 19, px(RAMP.BLUE, 1));
  pm.rect(3, 5, 10, 14, px(RAMP.CYAN, 1)); // glass
  pm.line(4, 16, 11, 7, px(RAMP.CYAN, 3));
  pm.rect(5, 8, 6, 8, px(RAMP.RED, 2)); // the phone unit
  pm.vline(5, 8, 8, px(RAMP.RED, 3));
  pm.rect(6, 7, 4, 2, px(RAMP.RED, 3)); // handset
  pm.set(6, 11, C.inkSoft); // keypad
  pm.set(8, 11, C.inkSoft);
  pm.set(6, 13, C.inkSoft);
  pm.set(8, 13, C.inkSoft);
  pm.set(10, 12, px(RAMP.GOLD, 3)); // coin slot glint
  pm.rect(1, 24, 14, 3, px(RAMP.BLUE, 1)); // base
  pm.hline(1, 24, 14, px(RAMP.BLUE, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** alley dumpster — every real city has one, and it has a tenant */
export function drawDumpster(): Pixmap {
  const pm = new Pixmap(22, 18);
  pm.rect(1, 6, 20, 9, px(RAMP.FOREST, 1));
  pm.rect(1, 4, 20, 3, px(RAMP.FOREST, 2)); // lid, slightly ajar
  pm.hline(1, 4, 20, px(RAMP.FOREST, 3));
  for (const x of [4, 9, 14, 18]) pm.vline(x, 7, 7, px(RAMP.FOREST, 2));
  pm.hline(2, 14, 18, px(RAMP.FOREST, 0));
  pm.set(6, 2, px(RAMP.PAPER, 2)); // something poking out. don't ask.
  pm.set(7, 3, px(RAMP.PAPER, 1));
  pm.set(16, 3, px(RAMP.GOLD, 3)); // a banana peel, classically
  pm.rect(3, 15, 3, 2, C.inkSoft);
  pm.rect(16, 15, 3, 2, C.inkSoft);
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawBench(): Pixmap {
  const pm = new Pixmap(22, 13);
  const wood = px(RAMP.EARTH, 2);
  pm.rect(1, 1, 20, 3, wood); // backrest
  pm.hline(1, 1, 20, px(RAMP.EARTH, 3));
  pm.hline(1, 3, 20, px(RAMP.EARTH, 1));
  pm.rect(1, 6, 20, 3, wood); // seat
  pm.hline(1, 6, 20, px(RAMP.EARTH, 3));
  pm.hline(1, 8, 20, px(RAMP.EARTH, 1));
  pm.vline(7, 1, 3, px(RAMP.EARTH, 1)); // slat gaps
  pm.vline(14, 1, 3, px(RAMP.EARTH, 1));
  pm.rect(2, 9, 2, 3, C.inkSoft);
  pm.rect(18, 9, 2, 3, C.inkSoft);
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawHydrant(): Pixmap {
  const pm = new Pixmap(10, 14);
  pm.rect(3, 2, 4, 2, px(RAMP.PAPER, 2)); // silver bonnet
  pm.set(4, 1, px(RAMP.PAPER, 2));
  pm.rect(2, 4, 6, 7, px(RAMP.RED, 2));
  pm.set(1, 6, px(RAMP.PAPER, 2)); // side caps
  pm.set(8, 6, px(RAMP.PAPER, 1));
  pm.vline(3, 4, 7, px(RAMP.RED, 3));
  pm.vline(6, 5, 6, px(RAMP.RED, 1));
  pm.set(5, 7, px(RAMP.RED, 1)); // chain bolt
  pm.rect(1, 11, 8, 2, px(RAMP.RED, 1));
  pm.hline(1, 11, 8, px(RAMP.RED, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawPlanter(): Pixmap {
  const pm = new Pixmap(22, 16);
  pm.rect(1, 8, 20, 7, px(RAMP.RED, 1)); // brick box
  pm.hline(1, 8, 20, px(RAMP.RED, 2));
  pm.hline(1, 11, 20, px(RAMP.PAPER, 1));
  pm.vline(6, 9, 2, px(RAMP.PAPER, 1)); // head joints
  pm.vline(14, 12, 2, px(RAMP.PAPER, 1));
  pm.rect(2, 3, 18, 6, px(RAMP.FOREST, 1)); // greenery
  pm.checker(2, 3, 18, 6, px(RAMP.FOREST, 1), px(RAMP.FOREST, 2), 2);
  pm.hline(4, 3, 4, px(RAMP.FOREST, 3));
  pm.set(5, 2, px(RAMP.RED, 3)); // brave little flowers
  pm.set(11, 2, px(RAMP.GOLD, 3));
  pm.set(16, 2, px(RAMP.MAGENTA, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/* ---- 90s street furniture (S7) ---- */

/**
 * telephone pole with two sagging wire spans. Poles placed 8 tiles (128px)
 * apart chain their wires into a continuous run. Wires live in the top band
 * so the pole can stand close behind sidewalk props without tangling them.
 */
export function drawTelephonePole(): Pixmap {
  const pm = new Pixmap(136, 48);
  const wood = px(RAMP.EARTH, 1);
  const woodD = px(RAMP.EARTH, 0);
  const woodL = px(RAMP.EARTH, 2);
  const wire = px(RAMP.INK, 1);
  // two wires sagging to each edge (parabola-ish, mirrored)
  for (let i = 0; i <= 68; i++) {
    const t = i / 68;
    const sag = Math.round(6 * (1 - t) * (1 - t));
    pm.set(68 - i, 6 + sag, wire);
    pm.set(68 + i, 6 + sag, wire);
    const sag2 = Math.round(7 * (1 - t) * (1 - t));
    pm.set(68 - i, 10 + sag2, wire);
    pm.set(68 + i, 10 + sag2, wire);
  }
  // crossarm
  pm.rect(58, 4, 21, 2, wood);
  pm.hline(58, 4, 21, woodL);
  pm.set(60, 3, px(RAMP.CYAN, 2)); // glass insulators
  pm.set(68, 3, px(RAMP.CYAN, 2));
  pm.set(76, 3, px(RAMP.CYAN, 2));
  // the pole
  pm.rect(66, 4, 4, 42, wood);
  pm.vline(66, 4, 42, woodL);
  pm.vline(69, 4, 42, woodD);
  pm.hline(66, 2, 4, woodD); // cap
  pm.set(67, 20, woodD); // climbing peg
  pm.set(70, 24, woodD);
  // a stapled flyer, weathered illegible
  pm.rect(66, 28, 4, 5, px(RAMP.PAPER, 2));
  pm.hline(66, 30, 4, px(RAMP.PAPER, 1));
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(67, 46, 5, px(RAMP.INK, 1));
  return pm;
}

/** galvanized trash can, lid askew */
export function drawTrashCan(): Pixmap {
  const pm = new Pixmap(14, 18);
  const tin = px(RAMP.PAPER, 1);
  const tinL = px(RAMP.PAPER, 2);
  const tinD = px(RAMP.PAPER, 0);
  pm.rect(2, 5, 10, 11, tin);
  for (const x of [3, 6, 9]) pm.vline(x, 5, 11, tinL); // ribs
  pm.vline(11, 5, 11, tinD);
  pm.hline(2, 15, 10, tinD);
  // lid, one degree off level
  pm.rect(1, 2, 12, 2, tinL);
  pm.hline(1, 3, 12, tinD);
  pm.set(0, 3, tinL);
  pm.rect(6, 0, 3, 2, tinL); // handle
  pm.set(13, 4, tinD);
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(7, 16, 5, px(RAMP.PAPER, 0));
  return pm;
}

/** parking meter — EXPIRED, naturally */
export function drawParkingMeter(): Pixmap {
  const pm = new Pixmap(10, 22);
  pm.rect(4, 9, 2, 11, px(RAMP.INK, 2)); // pole
  pm.vline(4, 9, 11, px(RAMP.INK, 3));
  pm.rect(2, 1, 6, 8, px(RAMP.PAPER, 1)); // head
  pm.hline(3, 0, 4, px(RAMP.PAPER, 2));
  pm.vline(2, 1, 8, px(RAMP.PAPER, 2));
  pm.rect(3, 2, 4, 4, px(RAMP.CYAN, 1)); // window
  pm.set(4, 3, px(RAMP.RED, 2)); // the red flag
  pm.set(5, 3, px(RAMP.RED, 2));
  pm.set(6, 7, C.outline); // coin slot
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(5, 20, 3, px(RAMP.PAPER, 0));
  return pm;
}

/** newspaper box: THE BRICKTON BUGLE, 25 cents, headline illegible */
export function drawNewspaperBox(): Pixmap {
  const pm = new Pixmap(16, 20);
  pm.rect(2, 2, 12, 14, px(RAMP.BLUE, 2));
  pm.vline(2, 2, 14, px(RAMP.BLUE, 3));
  pm.vline(13, 3, 13, px(RAMP.BLUE, 1));
  pm.hline(2, 2, 12, px(RAMP.BLUE, 3));
  // window with the day's stack
  pm.rect(4, 4, 8, 6, px(RAMP.PAPER, 3));
  pm.frame(4, 4, 8, 6, px(RAMP.BLUE, 1));
  pm.hline(5, 6, 6, C.inkSoft); // headline
  pm.hline(5, 8, 4, px(RAMP.PAPER, 1));
  pm.set(10, 11, px(RAMP.GOLD, 3)); // coin door
  pm.hline(4, 13, 8, px(RAMP.BLUE, 1)); // pull handle
  pm.rect(3, 16, 2, 3, px(RAMP.INK, 1)); // legs
  pm.rect(11, 16, 2, 3, px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
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
  pm.vline(10, 8, 21, px(RAMP.PAPER, 0)); // panel shading
  pm.vline(23, 8, 21, px(RAMP.PAPER, 0));
  pm.rect(3, 2, 20, 4, px(RAMP.INK, 1)); // indicator panel
  pm.set(11, 3, px(RAMP.GOLD, 3)); // up light (always up. concerning.)
  pm.set(10, 4, px(RAMP.GOLD, 1)); // glow spill
  pm.set(12, 4, px(RAMP.GOLD, 1));
  pm.set(14, 3, px(RAMP.INK, 2)); // down light, dark
  pm.set(24, 18, px(RAMP.GOLD, 2)); // call button
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawWaterCooler(): Pixmap {
  const pm = new Pixmap(12, 22);
  pm.rect(2, 1, 8, 8, px(RAMP.CYAN, 2)); // bottle
  pm.vline(3, 2, 6, px(RAMP.CYAN, 3));
  pm.hline(3, 1, 6, px(RAMP.CYAN, 3));
  pm.set(7, 3, px(RAMP.CYAN, 3)); // the eternal bubble
  pm.set(6, 5, px(RAMP.CYAN, 1));
  pm.rect(1, 9, 10, 10, px(RAMP.PAPER, 2)); // body
  pm.vline(2, 10, 8, px(RAMP.PAPER, 3));
  pm.vline(9, 10, 8, px(RAMP.PAPER, 1));
  pm.set(3, 12, px(RAMP.CYAN, 1)); // tap
  pm.set(8, 12, px(RAMP.RED, 2)); // hot tap nobody trusts
  pm.hline(3, 14, 6, px(RAMP.PAPER, 1)); // drip tray
  pm.rect(1, 19, 10, 2, px(RAMP.PAPER, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawCopier(): Pixmap {
  const pm = new Pixmap(24, 18);
  pm.rect(1, 5, 20, 10, px(RAMP.PAPER, 1)); // body
  pm.vline(1, 5, 10, px(RAMP.PAPER, 2));
  pm.rect(1, 3, 20, 3, px(RAMP.PAPER, 0)); // lid
  pm.hline(1, 3, 20, px(RAMP.PAPER, 2));
  pm.hline(2, 6, 18, px(RAMP.GRASS, 3)); // scan light escaping the lid
  pm.rect(15, 7, 8, 3, px(RAMP.PAPER, 2)); // output tray
  pm.hline(16, 8, 6, px(RAMP.PAPER, 3)); // fresh copies
  pm.set(3, 8, px(RAMP.GRASS, 2)); // ready light
  pm.set(5, 8, px(RAMP.RED, 2)); // jam light (also ready)
  pm.rect(3, 10, 6, 3, px(RAMP.PAPER, 0)); // control panel
  pm.set(4, 11, px(RAMP.CYAN, 2));
  pm.rect(2, 15, 3, 2, C.inkSoft);
  pm.rect(17, 15, 3, 2, C.inkSoft);
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawPlantPot(): Pixmap {
  const pm = new Pixmap(14, 22);
  pm.ellipse(7, 6, 5, 5, px(RAMP.FOREST, 2)); // office ficus
  pm.checker(2, 1, 11, 11, px(RAMP.FOREST, 2), px(RAMP.FOREST, 1), 2);
  pm.ellipse(4, 4, 2, 2, px(RAMP.FOREST, 3));
  pm.ellipse(10, 8, 3, 3, px(RAMP.FOREST, 1));
  pm.rect(4, 13, 7, 2, px(RAMP.EARTH, 2)); // rim
  pm.hline(4, 13, 7, px(RAMP.EARTH, 3));
  pm.rect(5, 15, 5, 6, px(RAMP.EARTH, 1)); // pot
  pm.vline(5, 15, 6, px(RAMP.EARTH, 2));
  pm.finish(); // ADR-101
  return pm;
}

/**
 * The floor-3 holding room door: sealed, riveted, smiling. S2's PRODUCTIVITY
 * LOCK lights one quota pip per defeated floor-3 patrol (0–3); at 3 the lock
 * light goes green too, a frame before the door slides away for good.
 */
export function drawHoldingDoor(lit = 0): Pixmap {
  const pm = new Pixmap(20, 28);
  pm.rect(1, 1, 18, 26, px(RAMP.INK, 1)); // steel slab
  pm.frame(1, 1, 18, 26, px(RAMP.INK, 2));
  pm.vline(2, 2, 24, px(RAMP.INK, 2)); // brushed sheen
  for (const [rx, ry] of [
    [3, 3],
    [16, 3],
    [3, 24],
    [16, 24],
  ]) {
    pm.set(rx, ry, px(RAMP.INK, 3)); // rivets
  }
  pm.hline(2, 14, 16, px(RAMP.INK, 0)); // plate seam
  pm.set(4, 5, lit >= 3 ? px(RAMP.GRASS, 3) : px(RAMP.RED, 2)); // lock light
  // the badge: a small brass smiley
  pm.rect(6, 7, 8, 6, px(RAMP.GOLD, 2));
  pm.hline(6, 7, 8, px(RAMP.GOLD, 3));
  pm.set(8, 9, C.inkSoft);
  pm.set(11, 9, C.inkSoft);
  pm.hline(8, 11, 4, C.inkSoft);
  // PRODUCTIVITY LOCK housing
  pm.rect(5, 17, 10, 7, px(RAMP.PAPER, 0));
  pm.frame(5, 17, 10, 7, px(RAMP.INK, 2));
  pm.rect(7, 19, 6, 3, px(RAMP.GOLD, 1)); // quota pips: dark until earned
  pm.set(8, 20, lit >= 1 ? px(RAMP.GRASS, 3) : px(RAMP.INK, 1));
  pm.set(10, 20, lit >= 2 ? px(RAMP.GRASS, 3) : px(RAMP.INK, 1));
  pm.set(12, 20, lit >= 3 ? px(RAMP.GRASS, 3) : px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** QUOTA: MET — the lock housing stays on the wall after the door slides away */
export function drawQuotaPanel(): Pixmap {
  const pm = new Pixmap(14, 12);
  pm.rect(1, 1, 12, 10, px(RAMP.PAPER, 0));
  pm.frame(1, 1, 12, 10, px(RAMP.INK, 2));
  pm.hline(2, 1, 10, px(RAMP.PAPER, 1));
  pm.rect(3, 3, 8, 4, px(RAMP.GOLD, 1));
  pm.set(4, 4, px(RAMP.GRASS, 3)); // three green pips, very pleased
  pm.set(7, 4, px(RAMP.GRASS, 3));
  pm.set(10, 4, px(RAMP.GRASS, 3));
  pm.hline(4, 8, 6, px(RAMP.GRASS, 2)); // and a smile of its own
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the holding room cot — too neat, like it apologized for being slept in */
export function drawCot(): Pixmap {
  const pm = new Pixmap(20, 24);
  pm.rect(2, 2, 16, 18, px(RAMP.INK, 2)); // steel frame
  pm.frame(2, 2, 16, 18, px(RAMP.INK, 3));
  pm.rect(3, 3, 14, 5, px(RAMP.PAPER, 3)); // pillow
  pm.hline(4, 5, 12, px(RAMP.PAPER, 1));
  pm.rect(3, 8, 14, 11, px(RAMP.CYAN, 1)); // blanket, hospital corners
  pm.hline(3, 8, 14, px(RAMP.CYAN, 3));
  pm.hline(3, 12, 14, px(RAMP.CYAN, 0)); // fold line, ruler-straight
  pm.hline(3, 16, 14, px(RAMP.CYAN, 0));
  pm.vline(3, 8, 11, px(RAMP.CYAN, 2));
  pm.rect(2, 20, 3, 3, px(RAMP.INK, 1)); // legs
  pm.rect(15, 20, 3, 3, px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/**
 * The interior door (S11b — "any entry way needs a door, not just a mat").
 * Mounted IN the wall band above a facing-'up' door zone: frame with a lit
 * top rail, a two-panel door, a brass knob. Walking in swings it open —
 * the open variant shows the dark hall beyond with the door edge-on at the
 * jamb. ADR-019 fixed-canvas + ADR-020 discipline (deliberate panels, no
 * noise; the knob's glint is the only light).
 */
export function drawInteriorDoor(open: boolean): Pixmap {
  const pm = new Pixmap(20, 28);
  const jamb = px(RAMP.EARTH, 1);
  // the frame: jambs + the lit top rail
  pm.rect(1, 1, 18, 26, jamb);
  pm.hline(2, 1, 16, px(RAMP.EARTH, 3)); // lit top rail
  pm.hline(2, 2, 16, px(RAMP.EARTH, 2));
  pm.vline(1, 1, 26, px(RAMP.EARTH, 2));
  pm.vline(18, 2, 25, px(RAMP.EARTH, 0));
  if (!open) {
    // the panel door, closed: two inset panels + the brass knob
    pm.rect(3, 3, 14, 24, px(RAMP.EARTH, 2));
    pm.vline(3, 3, 24, px(RAMP.EARTH, 3)); // lit stile
    pm.frame(5, 5, 10, 9, px(RAMP.EARTH, 1)); // upper panel
    pm.frame(5, 16, 10, 9, px(RAMP.EARTH, 1)); // lower panel
    pm.set(6, 6, px(RAMP.EARTH, 3)); // panel light catches
    pm.set(6, 17, px(RAMP.EARTH, 3));
    pm.set(15, 14, px(RAMP.GOLD, 3)); // the brass knob
    pm.set(15, 15, px(RAMP.GOLD, 1));
  } else {
    // swung inward: the dark room beyond, the door edge-on at the jamb
    pm.rect(3, 3, 14, 24, px(RAMP.NIGHT, 1));
    pm.rect(3, 3, 14, 2, px(RAMP.NIGHT, 0)); // header shadow
    pm.hline(4, 25, 12, px(RAMP.NIGHT, 2)); // a sliver of floor light
    pm.rect(3, 3, 3, 24, px(RAMP.EARTH, 2)); // the door, edge-on
    pm.vline(3, 3, 24, px(RAMP.EARTH, 3));
    pm.vline(5, 3, 24, px(RAMP.EARTH, 0));
    pm.set(6, 14, px(RAMP.GOLD, 2)); // the knob, catching what light is left
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** wooden office door with a nameplate (the Manager's) */
export function drawOfficeDoor(): Pixmap {
  const pm = new Pixmap(16, 26);
  pm.rect(1, 1, 14, 24, px(RAMP.EARTH, 2));
  pm.frame(1, 1, 14, 24, px(RAMP.EARTH, 0));
  pm.vline(2, 2, 22, px(RAMP.EARTH, 3)); // lit stile
  pm.frame(3, 10, 10, 13, px(RAMP.EARTH, 1)); // lower panel
  pm.rect(4, 3, 8, 5, px(RAMP.PAPER, 2)); // nameplate
  pm.frame(4, 3, 8, 5, px(RAMP.GOLD, 1));
  pm.hline(6, 5, 4, C.inkSoft);
  pm.set(13, 14, px(RAMP.GOLD, 3)); // knob
  pm.set(13, 15, px(RAMP.GOLD, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/* ---- motivational decor (S7 — §A11 voice, mounted on office walls) ---- */

/** small motivational poster: the smiley sunrise */
export function drawPosterSmile(): Pixmap {
  const pm = new Pixmap(16, 20);
  pm.rect(1, 1, 14, 18, px(RAMP.PAPER, 3));
  pm.frame(1, 1, 14, 18, px(RAMP.INK, 1));
  pm.set(2, 2, px(RAMP.PAPER, 1)); // tape corners
  pm.set(13, 2, px(RAMP.PAPER, 1));
  // a smiling sun cresting a hill
  pm.ellipse(8, 7, 4, 4, px(RAMP.GOLD, 2));
  pm.set(7, 6, C.outline);
  pm.set(9, 6, C.outline);
  pm.hline(7, 8, 3, C.outline);
  pm.rect(2, 11, 12, 3, px(RAMP.GRASS, 2));
  pm.hline(2, 11, 12, px(RAMP.GRASS, 3));
  // illegible inspiration
  pm.hline(4, 15, 8, px(RAMP.INK, 2));
  pm.hline(5, 17, 6, px(RAMP.INK, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** small motivational poster: the chart that only goes up */
export function drawPosterChart(): Pixmap {
  const pm = new Pixmap(16, 20);
  pm.rect(1, 1, 14, 18, px(RAMP.PAPER, 3));
  pm.frame(1, 1, 14, 18, px(RAMP.INK, 1));
  pm.set(2, 2, px(RAMP.PAPER, 1));
  pm.set(13, 2, px(RAMP.PAPER, 1));
  pm.vline(3, 4, 9, px(RAMP.INK, 2)); // axes
  pm.hline(3, 12, 10, px(RAMP.INK, 2));
  pm.line(4, 11, 7, 8, px(RAMP.RED, 2)); // the line. it goes up.
  pm.line(7, 8, 9, 9, px(RAMP.RED, 2));
  pm.line(9, 9, 12, 4, px(RAMP.RED, 2));
  pm.set(12, 4, px(RAMP.RED, 3));
  pm.hline(4, 15, 8, px(RAMP.INK, 2));
  pm.hline(5, 17, 5, px(RAMP.INK, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the lobby banner. it wants you to have a certain kind of day. */
export function drawProductivityBanner(): Pixmap {
  const pm = new Pixmap(104, 18);
  pm.rect(1, 2, 102, 14, px(RAMP.GOLD, 2));
  pm.hline(1, 2, 102, px(RAMP.GOLD, 3));
  pm.hline(1, 15, 102, px(RAMP.GOLD, 1));
  pm.frame(1, 2, 102, 14, px(RAMP.RED, 2));
  drawTextInto(pm, 'A PRODUCTIVE DAY!', 3, 6, C.outline);
  // hanging strings
  pm.set(10, 1, px(RAMP.INK, 1));
  pm.set(93, 1, px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
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
  pm.hline(1, 20, 14, px(RAMP.FOREST, 1));
  pm.rect(2, 21, 3, 2, C.inkSoft);
  pm.rect(11, 21, 3, 2, C.inkSoft);
  pm.finish({ aa: false }); // ADR-101
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
    pm.vline(x, 8, 38, px(RAMP.PAPER, 2));
    pm.vline(x + 5, 8, 38, px(RAMP.PAPER, 0));
  }
  pm.rect(0, 46, widthPx, 5, px(RAMP.PAPER, 2)); // sill
  pm.hline(0, 46, widthPx, px(RAMP.PAPER, 3));
  pm.rect(0, 51, widthPx, 11, px(RAMP.PAPER, 1)); // wall under the sill
  pm.rect(0, 54, widthPx, 2, px(RAMP.RED, 2)); // the stripe again
  pm.hline(0, 54, widthPx, px(RAMP.RED, 3));
  return pm;
}

/** shop shelving (S4 interiors) — richer seeded goods per ADR-016 */
export function drawShopShelf(seed = 4): Pixmap {
  const pm = new Pixmap(32, 24);
  // case
  pm.rect(0, 0, 32, 24, px(RAMP.EARTH, 1));
  pm.rect(1, 1, 30, 22, px(RAMP.EARTH, 2));
  pm.vline(1, 1, 22, px(RAMP.EARTH, 3)); // lit left edge
  pm.rect(1, 1, 30, 2, px(RAMP.EARTH, 0)); // shaded backboard top
  // two boards with lit lips
  pm.rect(1, 10, 30, 2, px(RAMP.EARTH, 0));
  pm.hline(1, 10, 30, px(RAMP.EARTH, 3));
  pm.rect(1, 21, 30, 2, px(RAMP.EARTH, 0));
  pm.hline(1, 21, 30, px(RAMP.EARTH, 3));
  // goods: cans, boxes, bottles — never the same run twice
  const rng = mulberry32(seed);
  const ramps = [RAMP.RED, RAMP.GOLD, RAMP.CYAN, RAMP.GRASS, RAMP.MAGENTA, RAMP.BLUE, RAMP.ORANGE];
  for (const boardY of [4, 15]) {
    let gx = 3;
    while (gx < 26) {
      const ramp = ramps[Math.floor(rng() * ramps.length)];
      const kind = rng();
      if (kind < 0.45) {
        // canned goods with a label band
        const h = 4 + Math.floor(rng() * 2);
        pm.rect(gx, boardY + 6 - h, 3, h, px(ramp, 2));
        pm.vline(gx, boardY + 6 - h, h, px(ramp, 3));
        pm.hline(gx, boardY + 6 - Math.ceil(h / 2), 3, px(RAMP.PAPER, 3)); // label
        gx += 4;
      } else if (kind < 0.8) {
        // a box with a printed lid
        const w2 = 4 + Math.floor(rng() * 2);
        const h = 5 + Math.floor(rng() * 2);
        pm.rect(gx, boardY + 6 - h, w2, h, px(ramp, 2));
        pm.vline(gx, boardY + 6 - h, h, px(ramp, 3));
        pm.hline(gx, boardY + 6 - h + 1, w2, px(ramp, 1));
        pm.set(gx + 1, boardY + 6 - h + 3, px(RAMP.PAPER, 3)); // label dot
        gx += w2 + 1;
      } else {
        // a bottle with a neck
        pm.rect(gx + 1, boardY, 1, 2, px(ramp, 1));
        pm.rect(gx, boardY + 2, 3, 4, px(ramp, 2));
        pm.vline(gx, boardY + 2, 4, px(ramp, 3));
        gx += 4;
      }
      if (rng() < 0.25) gx += 2; // a gap a customer left
    }
    // a dangling price tag off the shelf lip
    const tagX = 5 + Math.floor(rng() * 20);
    pm.rect(tagX, boardY + 7, 3, 3, px(RAMP.PAPER, 3));
    pm.set(tagX + 1, boardY + 8, px(RAMP.RED, 1));
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/**
 * An arcade cabinet (S10) — 18×28, face-on: marquee, CRT, control deck,
 * coin door. `screen` picks one of three hand-set attract scenes (variety is
 * a parameter, never noise — ADR-020); `marquee` is the brand ramp.
 */
export function drawArcadeCabinet(o: { marquee: number; screen: 0 | 1 | 2 }): Pixmap {
  const pm = new Pixmap(18, 28);
  // body — purple showroom sides, lit left
  pm.rect(1, 1, 16, 26, px(RAMP.PURPLE, 1));
  pm.vline(1, 1, 26, px(RAMP.PURPLE, 2));
  pm.vline(16, 2, 25, px(RAMP.PURPLE, 0));
  // marquee: lit band with its glow row under (light is never outlined)
  pm.rect(2, 1, 14, 4, px(o.marquee, 2));
  pm.hline(2, 1, 14, px(o.marquee, 3));
  pm.hline(2, 5, 14, px(o.marquee, 1));
  // CRT in its bezel
  pm.rect(3, 7, 12, 9, px(RAMP.INK, 0));
  if (o.screen === 0) {
    // a tiny rocket holding the high score nobody beats
    pm.set(6, 11, px(RAMP.PAPER, 3));
    pm.set(7, 11, px(RAMP.RED, 2));
    pm.hline(10, 9, 3, px(RAMP.GOLD, 2)); // the score line
    pm.set(5, 13, px(RAMP.CYAN, 2));
    pm.set(12, 12, px(RAMP.NIGHT, 3));
  } else if (o.screen === 1) {
    // maze game: dots, one brave dot
    for (let x = 5; x <= 12; x += 3) pm.set(x, 10, px(RAMP.GOLD, 3));
    pm.hline(5, 12, 8, px(RAMP.BLUE, 2));
    pm.set(6, 14, px(RAMP.GOLD, 3));
  } else {
    // blocks descending. they always descend.
    pm.rect(5, 9, 2, 2, px(RAMP.CYAN, 2));
    pm.rect(9, 11, 2, 2, px(RAMP.MAGENTA, 2));
    pm.rect(12, 9, 2, 2, px(RAMP.GOLD, 2));
    pm.hline(4, 14, 10, px(RAMP.GRASS, 2));
  }
  // control deck — sloped lip, stick + two buttons
  pm.rect(2, 16, 14, 3, px(RAMP.PURPLE, 2));
  pm.hline(2, 16, 14, px(RAMP.PURPLE, 3));
  pm.set(5, 17, px(RAMP.INK, 0)); // stick
  pm.set(5, 16, px(RAMP.RED, 3)); // ball top
  pm.set(10, 17, px(RAMP.RED, 2));
  pm.set(13, 17, px(RAMP.GOLD, 2));
  // lower body + coin door
  pm.rect(2, 19, 14, 8, px(RAMP.PURPLE, 1));
  pm.rect(7, 21, 4, 4, px(RAMP.INK, 1));
  pm.set(8, 22, px(RAMP.GOLD, 2)); // coin slot, hopeful
  pm.hline(2, 26, 14, px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/**
 * THE machine — the ARCADE LEGEND cabinet (§A10 #4): a head taller, gold
 * star marquee, and the attract screen forever flashing MGR's three letters.
 */
export function drawLegendCabinet(): Pixmap {
  const pm = new Pixmap(22, 32);
  pm.rect(1, 1, 20, 30, px(RAMP.PURPLE, 1));
  pm.vline(1, 1, 30, px(RAMP.PURPLE, 2));
  pm.vline(20, 2, 29, px(RAMP.PURPLE, 0));
  // tall gold marquee with the star
  pm.rect(2, 1, 18, 5, px(RAMP.GOLD, 2));
  pm.hline(2, 1, 18, px(RAMP.GOLD, 3));
  pm.hline(2, 6, 18, px(RAMP.GOLD, 1));
  pm.set(10, 2, px(RAMP.PAPER, 3)); // the star: a plus of light
  pm.set(9, 3, px(RAMP.PAPER, 3));
  pm.set(11, 3, px(RAMP.PAPER, 3));
  pm.set(10, 4, px(RAMP.PAPER, 3));
  pm.set(10, 3, C.white);
  // the CRT — attract mode: a rocket, a foe, and the three famous letters
  pm.rect(3, 8, 16, 11, px(RAMP.INK, 0));
  pm.hline(8, 10, 5, px(RAMP.GOLD, 3)); // M G R, abstracted to its glow
  pm.set(7, 13, px(RAMP.PAPER, 3)); // the little ship
  pm.set(8, 13, px(RAMP.RED, 2));
  pm.set(9, 13, px(RAMP.GOLD, 2)); // its flame
  pm.set(14, 12, px(RAMP.CYAN, 2)); // a moth, unbothered
  pm.set(13, 16, px(RAMP.NIGHT, 3)); // starfield
  pm.set(5, 16, px(RAMP.NIGHT, 3));
  // deck + buttons
  pm.rect(2, 19, 18, 3, px(RAMP.PURPLE, 2));
  pm.hline(2, 19, 18, px(RAMP.PURPLE, 3));
  pm.set(6, 20, px(RAMP.INK, 0));
  pm.set(6, 19, px(RAMP.RED, 3));
  pm.set(12, 20, px(RAMP.RED, 2));
  pm.set(16, 20, px(RAMP.GOLD, 2));
  // body + coin door
  pm.rect(2, 22, 18, 9, px(RAMP.PURPLE, 1));
  pm.rect(9, 24, 4, 4, px(RAMP.INK, 1));
  pm.set(10, 25, px(RAMP.GOLD, 2));
  pm.hline(2, 30, 18, px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the Star Cola fridge case — the coldest object in any room it's in */
export function drawColaFridge(): Pixmap {
  const pm = new Pixmap(26, 30);
  // cabinet
  pm.rect(1, 1, 24, 28, px(RAMP.RED, 2));
  pm.vline(1, 1, 28, px(RAMP.RED, 3));
  pm.vline(24, 2, 27, px(RAMP.RED, 1));
  pm.rect(1, 1, 24, 6, px(RAMP.RED, 1)); // brand band
  pm.hline(1, 1, 24, px(RAMP.RED, 2));
  drawTextInto(pm, 'COLA', 2, 1, px(RAMP.PAPER, 3));
  pm.set(21, 3, px(RAMP.GOLD, 3)); // the star
  // glass door, interior lit
  pm.rect(3, 8, 18, 18, px(RAMP.CYAN, 1));
  pm.frame(3, 8, 18, 18, px(RAMP.PAPER, 1));
  pm.rect(4, 9, 16, 16, px(RAMP.PAPER, 3)); // glowing interior
  // two shelves of cans
  for (const sy of [13, 20]) {
    pm.hline(4, sy + 4, 16, px(RAMP.PAPER, 1)); // shelf
    for (let cx = 5; cx < 19; cx += 3) {
      pm.rect(cx, sy, 2, 4, px(RAMP.RED, 2));
      pm.set(cx, sy + 1, px(RAMP.PAPER, 3)); // label flash
      pm.hline(cx, sy, 2, px(RAMP.PAPER, 2)); // lid
    }
  }
  pm.line(5, 23, 18, 10, px(RAMP.CYAN, 3)); // glass shine over everything
  pm.vline(22, 9, 16, px(RAMP.PAPER, 2)); // handle
  pm.rect(2, 26, 22, 3, px(RAMP.RED, 1)); // kick vent
  for (let x = 4; x < 22; x += 3) pm.vline(x, 27, 1, px(RAMP.RED, 0));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the SAVINGS & LOAN's ATM (S4) — the only part of the bank that's awake */
export function drawAtm(): Pixmap {
  const pm = new Pixmap(16, 26);
  // cabinet
  pm.rect(1, 2, 14, 22, px(RAMP.BLUE, 1));
  pm.rect(2, 3, 12, 20, px(RAMP.BLUE, 2));
  pm.vline(2, 3, 20, px(RAMP.BLUE, 3));
  pm.rect(1, 2, 14, 2, px(RAMP.BLUE, 3)); // crowned top
  // screen, mid-thought
  pm.rect(3, 6, 10, 7, px(RAMP.CYAN, 1));
  pm.frame(3, 6, 10, 7, px(RAMP.BLUE, 0));
  pm.hline(4, 8, 6, px(RAMP.CYAN, 3)); // a line of friendly text
  pm.hline(4, 10, 4, px(RAMP.CYAN, 2));
  pm.set(11, 7, px(RAMP.CYAN, 3)); // cursor, blinking forever
  // keypad
  for (let ky = 0; ky < 2; ky++) {
    for (let kx = 0; kx < 3; kx++) pm.set(4 + kx * 2, 15 + ky * 2, C.inkSoft);
  }
  // card slot, glowing faintly
  pm.rect(10, 15, 4, 2, C.inkSoft);
  pm.set(11, 15, px(RAMP.GOLD, 3));
  // cash tray
  pm.rect(3, 20, 10, 2, px(RAMP.BLUE, 0));
  pm.hline(4, 21, 8, px(RAMP.BLUE, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/* ---- home furnishings (S7 — the EB interior set) ---- */

/** chest of drawers with a doily and a framed photo */
export function drawDresser(): Pixmap {
  const pm = new Pixmap(22, 24);
  pm.rect(1, 4, 20, 18, px(RAMP.EARTH, 2));
  pm.hline(1, 4, 20, px(RAMP.EARTH, 3)); // top edge
  pm.hline(1, 5, 20, px(RAMP.EARTH, 3));
  pm.vline(1, 4, 18, px(RAMP.EARTH, 3));
  pm.vline(20, 5, 17, px(RAMP.EARTH, 1));
  // three drawers
  for (const dy of [7, 12, 17]) {
    pm.hline(2, dy + 4, 18, px(RAMP.EARTH, 1));
    pm.set(9, dy + 1, px(RAMP.GOLD, 3)); // knobs
    pm.set(12, dy + 1, px(RAMP.GOLD, 3));
    pm.hline(3, dy, 16, px(RAMP.EARTH, 3)); // drawer-face light
  }
  // doily + photo of someone waving
  pm.hline(4, 3, 7, px(RAMP.PAPER, 3));
  pm.rect(14, 0, 5, 5, px(RAMP.GOLD, 1)); // frame
  pm.rect(15, 1, 3, 3, px(RAMP.CYAN, 2));
  pm.set(16, 2, px(RAMP.SKIN, 2)); // the waver
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** wood-grain console TV with rabbit ears, mid-broadcast */
export function drawTv(): Pixmap {
  const pm = new Pixmap(22, 20);
  // rabbit ears
  pm.line(8, 4, 4, 0, px(RAMP.INK, 2));
  pm.line(13, 4, 17, 0, px(RAMP.INK, 2));
  pm.set(4, 0, px(RAMP.PAPER, 2));
  pm.set(17, 0, px(RAMP.PAPER, 2));
  // wood console body with a real top plane
  pm.rect(1, 4, 20, 13, px(RAMP.EARTH, 1));
  pm.rect(1, 4, 20, 2, px(RAMP.EARTH, 2));
  pm.hline(1, 4, 20, px(RAMP.EARTH, 3));
  pm.vline(1, 4, 13, px(RAMP.EARTH, 2));
  // screen, glowing
  pm.rect(3, 6, 12, 9, px(RAMP.CYAN, 1));
  pm.frame(3, 6, 12, 9, C.inkSoft);
  pm.line(4, 13, 9, 8, px(RAMP.CYAN, 3));
  pm.rect(5, 8, 4, 3, px(RAMP.CYAN, 2)); // a face? a weather map?
  pm.set(13, 7, px(RAMP.PAPER, 3)); // corner glint
  // dials
  pm.set(17, 8, px(RAMP.GOLD, 3));
  pm.set(17, 11, px(RAMP.RED, 2));
  pm.set(17, 13, px(RAMP.INK, 2));
  // legs
  pm.rect(3, 17, 2, 2, px(RAMP.EARTH, 0));
  pm.rect(17, 17, 2, 2, px(RAMP.EARTH, 0));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the family range — four coils, one roast, eternal */
export function drawStove(): Pixmap {
  const pm = new Pixmap(22, 24);
  pm.rect(1, 3, 20, 19, px(RAMP.PAPER, 2));
  pm.vline(1, 3, 19, px(RAMP.PAPER, 3));
  pm.vline(20, 4, 18, px(RAMP.PAPER, 1));
  // control backsplash
  pm.rect(1, 1, 20, 4, px(RAMP.PAPER, 1));
  pm.hline(1, 1, 20, px(RAMP.PAPER, 2));
  for (const kx of [4, 8, 13, 17]) pm.set(kx, 2, C.inkSoft); // knobs
  // cooktop with 4 coil burners
  pm.rect(2, 5, 18, 7, px(RAMP.PAPER, 0));
  const burner = (bx: number, by: number, hot: boolean): void => {
    pm.ellipse(bx, by, 2, 1, hot ? px(RAMP.RED, 2) : px(RAMP.INK, 2));
    pm.set(bx, by, hot ? px(RAMP.ORANGE, 2) : px(RAMP.INK, 1));
  };
  burner(6, 7, false);
  burner(15, 7, true); // dinner's on
  burner(6, 10, false);
  burner(15, 10, false);
  pm.rect(12, 5, 7, 2, px(RAMP.PAPER, 1)); // pot on the hot one
  pm.hline(12, 5, 7, px(RAMP.PAPER, 3));
  pm.set(15, 4, px(RAMP.PAPER, 2)); // steam
  // oven door with a window and a glow
  pm.rect(3, 13, 16, 7, px(RAMP.PAPER, 1));
  pm.hline(3, 13, 16, px(RAMP.PAPER, 3)); // handle bar
  pm.rect(6, 15, 10, 4, C.inkSoft);
  pm.rect(7, 16, 8, 2, px(RAMP.ORANGE, 1)); // something rising in there
  pm.set(9, 16, px(RAMP.ORANGE, 2));
  pm.rect(2, 21, 3, 2, px(RAMP.PAPER, 0)); // feet
  pm.rect(17, 21, 3, 2, px(RAMP.PAPER, 0));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** bookshelf — spines in every ramp, one book always leaning */
export function drawBookshelf(): Pixmap {
  const pm = new Pixmap(24, 30);
  pm.rect(1, 1, 22, 27, px(RAMP.EARTH, 1));
  pm.vline(1, 1, 27, px(RAMP.EARTH, 2));
  pm.rect(1, 1, 22, 2, px(RAMP.EARTH, 2)); // top plane
  pm.hline(1, 1, 22, px(RAMP.EARTH, 3));
  const spineRamps = [RAMP.RED, RAMP.BLUE, RAMP.GOLD, RAMP.FOREST, RAMP.CYAN, RAMP.PURPLE, RAMP.ORANGE];
  const rng = mulberry32(0xb00c);
  for (const shelfY of [3, 12, 21]) {
    pm.rect(2, shelfY + 7, 20, 2, px(RAMP.EARTH, 0)); // board
    pm.hline(2, shelfY + 7, 20, px(RAMP.EARTH, 3));
    let bx = 3;
    while (bx < 19) {
      const ramp = spineRamps[Math.floor(rng() * spineRamps.length)];
      const h = 5 + Math.floor(rng() * 3);
      const bw = 2 + Math.floor(rng() * 2);
      pm.rect(bx, shelfY + 7 - h, bw, h, px(ramp, 2));
      pm.vline(bx, shelfY + 7 - h, h, px(ramp, 3));
      pm.set(bx + 1, shelfY + 7 - h + 2, px(ramp, 1)); // title band
      bx += bw + (rng() < 0.2 ? 2 : 0);
    }
    // the leaner
    pm.line(19, shelfY + 6, 21, shelfY + 1, px(RAMP.PAPER, 2));
    pm.line(20, shelfY + 6, 22, shelfY + 1, px(RAMP.PAPER, 1));
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** floor lamp with a warm pool of light baked at its feet */
export function drawFloorLamp(): Pixmap {
  const pm = new Pixmap(18, 30);
  // the pool first (under everything)
  pm.ellipse(9, 26, 7, 3, px(RAMP.GOLD, 3));
  pm.ellipse(9, 26, 4, 2, px(RAMP.PAPER, 3));
  // shade
  pm.rect(4, 1, 10, 6, px(RAMP.GOLD, 2));
  pm.hline(3, 6, 12, px(RAMP.GOLD, 1));
  pm.hline(4, 1, 10, px(RAMP.GOLD, 3));
  pm.vline(4, 1, 6, px(RAMP.GOLD, 3));
  pm.hline(5, 7, 8, px(RAMP.PAPER, 3)); // glow under the shade
  // pole + base
  pm.vline(8, 8, 16, px(RAMP.INK, 2));
  pm.vline(9, 8, 16, px(RAMP.INK, 1));
  pm.rect(6, 24, 6, 2, px(RAMP.INK, 1));
  pm.finish({ aa: false }); // ADR-101
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
    pm.hline(x, 46 - h, Math.min(w, 150 - x), px(RAMP.NIGHT, 2)); // roofline catch
    for (let wy = 46 - h + 3; wy < 43; wy += 4) {
      for (let wx = x + 2; wx < x + w - 2 && wx < 147; wx += 4) {
        if (rng() < 0.4) pm.set(wx, wy, px(RAMP.GOLD, 2));
      }
    }
    x += w + 2;
  }
  // the water tower every skyline needs
  pm.rect(60, 8, 10, 7, px(RAMP.NIGHT, 2));
  pm.hline(59, 8, 12, px(RAMP.NIGHT, 3));
  pm.line(61, 15, 60, 20, px(RAMP.NIGHT, 2));
  pm.line(68, 15, 69, 20, px(RAMP.NIGHT, 2));
  // one blinking antenna (statically mid-blink)
  pm.vline(100, 2, 6, px(RAMP.NIGHT, 2));
  pm.set(100, 1, px(RAMP.RED, 2));
  return pm;
}

/* ---- juice (S7 / Prompt 39) ---- */

/** two-frame dust puff for running footsteps */
export function drawDustFrames(): Pixmap[] {
  const a = new Pixmap(10, 8);
  const dust = px(RAMP.PAPER, 2);
  const dustL = px(RAMP.PAPER, 3);
  a.ellipse(4, 5, 2, 1, dust);
  a.set(7, 4, dust);
  a.set(2, 3, dustL);
  const b = new Pixmap(10, 8);
  b.set(1, 4, dust);
  b.set(4, 2, dustL);
  b.set(8, 3, dust);
  b.set(6, 6, dust);
  return [a, b];
}

/** four-point sparkle frames for Ember pickups */
export function drawSparkFrames(): Pixmap[] {
  const out: Pixmap[] = [];
  for (const r of [2, 4]) {
    const pm = new Pixmap(12, 12);
    pm.vline(6, 6 - r, r * 2 + 1, px(RAMP.GOLD, 3));
    pm.hline(6 - r, 6, r * 2 + 1, px(RAMP.GOLD, 3));
    pm.set(6, 6, px(RAMP.PAPER, 3));
    if (r > 2) {
      pm.set(4, 4, px(RAMP.GOLD, 2));
      pm.set(8, 8, px(RAMP.GOLD, 2));
      pm.set(8, 4, px(RAMP.GOLD, 2));
      pm.set(4, 8, px(RAMP.GOLD, 2));
    }
    out.push(pm);
  }
  return out;
}

/**
 * S9: Biscuit's paw prints — a quest sniff-clue ground marking. Markings
 * follow ADR-020 rule 2's idiom (shadows/light are never outlined; neither
 * are prints pressed INTO the ground) and rule 1 (deliberate 2px clusters,
 * never scatter): two trotting impressions, each four toe dots over a pad,
 * in deep EARTH so they read on grass and dirt alike. The second print
 * lands ahead and offset — a dog going somewhere, not a stamp.
 */
export function drawPawPrints(): Pixmap {
  const pm = new Pixmap(18, 12);
  const deep = px(RAMP.EARTH, 0);
  const soft = px(RAMP.EARTH, 1);
  const paw = (x: number, y: number): void => {
    pm.rect(x + 1, y + 3, 3, 2, deep); // pad
    pm.set(x, y + 1, soft); // toes
    pm.set(x + 1, y, deep);
    pm.set(x + 3, y, deep);
    pm.set(x + 4, y + 1, soft);
  };
  paw(2, 5); // back print
  paw(11, 1); // front print, mid-stride
  return pm;
}

/**
 * S9b: wrapped present (the twins' rooms — Prompt 19's gift boxes arrive).
 * Deliberate flat planes per ADR-020: lit top face, shaded side, one ribbon
 * cross + a bow read at 2px scale, outlined like any object, shadowUnder
 * after outline (rule 2).
 */
export function drawGiftBox(): Pixmap {
  const pm = new Pixmap(14, 14);
  const lit = px(RAMP.RED, 2);
  const base = px(RAMP.RED, 1);
  const dark = px(RAMP.RED, 0);
  pm.rect(1, 4, 12, 8, base); // body
  pm.rect(1, 4, 12, 2, lit); // lid face catches the light
  pm.hline(1, 11, 12, dark); // base shadow row
  pm.vline(12, 5, 7, dark); // turned side
  // ribbon cross + bow
  pm.rect(6, 2, 2, 10, px(RAMP.GOLD, 2));
  pm.hline(1, 7, 12, px(RAMP.GOLD, 1));
  pm.set(5, 2, px(RAMP.GOLD, 3));
  pm.set(8, 2, px(RAMP.GOLD, 3));
  pm.rect(6, 1, 2, 2, px(RAMP.GOLD, 2));
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(7, 12, 5, px(RAMP.INK, 1));
  return pm;
}

/** the same present, opened — lid ajar against the box, tissue rising */
export function drawGiftBoxOpen(): Pixmap {
  const pm = new Pixmap(16, 14);
  const base = px(RAMP.RED, 1);
  const dark = px(RAMP.RED, 0);
  pm.rect(1, 6, 11, 6, base); // body, lid gone
  pm.hline(1, 11, 11, dark);
  pm.vline(11, 7, 4, dark);
  pm.rect(2, 4, 9, 2, px(RAMP.PAPER, 2)); // tissue puffing out
  pm.set(4, 3, px(RAMP.PAPER, 3));
  pm.set(8, 3, px(RAMP.PAPER, 3));
  // the lid leans on the right side, ribbon still on it
  pm.rect(12, 8, 3, 5, px(RAMP.RED, 2));
  pm.vline(13, 8, 5, px(RAMP.GOLD, 2));
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(7, 12, 5, px(RAMP.INK, 1));
  return pm;
}

/* ================== THE CAGE (S12) — venue tiles + props ================== */

/** sun-worn asphalt — FLAT per ADR-020 rule 1; the wear lives in the
 *  dedicated crack/patch variants, never on the base tile */
export function asphaltTile(): Pixmap {
  const pm = new Pixmap(16, 16);
  pm.fill(px(RAMP.INK, 2));
  return pm;
}

/** one hand-placed crack cluster (the sparse-variant rule) */
export function asphaltCrack(): Pixmap {
  const pm = asphaltTile();
  const d = px(RAMP.INK, 1);
  pm.line(3, 4, 8, 7, d);
  pm.line(8, 7, 9, 12, d);
  pm.set(4, 5, px(RAMP.INK, 0));
  return pm;
}

/** worn painted line across the asphalt — breaks mid-run (rule 4) */
export function asphaltLineH(): Pixmap {
  const pm = asphaltTile();
  const paint = px(RAMP.PAPER, 2);
  for (let x = 0; x < 16; x++) {
    if (x === 5 || x === 11) continue; // the wear
    pm.set(x, 7, paint);
    pm.set(x, 8, x % 3 === 0 ? px(RAMP.PAPER, 1) : paint);
  }
  return pm;
}

export function asphaltLineV(): Pixmap {
  const pm = asphaltTile();
  const paint = px(RAMP.PAPER, 2);
  for (let y = 0; y < 16; y++) {
    if (y === 4 || y === 12) continue;
    pm.set(7, y, paint);
    pm.set(8, y, y % 3 === 0 ? px(RAMP.PAPER, 1) : paint);
  }
  return pm;
}

/** chain-link fence run (solid) — diamond mesh between galvanized rails */
export function cageMeshTile(): Pixmap {
  const pm = new Pixmap(16, 16);
  pm.fill(px(RAMP.INK, 2)); // asphalt reads through the links
  const wire = px(RAMP.PAPER, 1);
  const wireD = px(RAMP.PAPER, 0);
  pm.hline(0, 1, 16, wire); // top rail
  pm.hline(0, 2, 16, wireD);
  for (let y = 3; y < 15; y++) {
    for (let x = 0; x < 16; x++) {
      // the diamond weave: two phase-shifted zigzags, one wire apart
      if ((x + y) % 4 === 0) pm.set(x, y, wire);
      if ((x - y + 16) % 4 === 0) pm.set(x, y, wireD);
    }
  }
  pm.hline(0, 15, 16, wireD); // ground rail
  return pm;
}

/**
 * The vacant lot's GATE (Brickton prop): a chain-link door in the fence run,
 * latch chain hanging, the FUTURE SITE finally open for business. Canvas
 * spans one fence tile so the map swaps it in without moving anything.
 */
export function drawCageGate(): Pixmap {
  const pm = new Pixmap(16, 22);
  const wire = px(RAMP.PAPER, 1);
  const wireD = px(RAMP.PAPER, 0);
  const post = px(RAMP.PAPER, 2);
  pm.rect(0, 2, 2, 18, post); // hinge post
  pm.rect(14, 2, 2, 18, post); // latch post
  pm.frame(2, 3, 12, 16, wire); // the gate frame
  for (let y = 5; y < 17; y++) {
    for (let x = 3; x < 13; x++) {
      if ((x + y) % 4 === 0) pm.set(x, y, wire);
      if ((x - y + 16) % 4 === 0) pm.set(x, y, wireD);
    }
  }
  // the latch chain, hanging open — somebody is ALWAYS here
  pm.vline(13, 8, 5, px(RAMP.GOLD, 1));
  pm.set(12, 13, px(RAMP.GOLD, 2));
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(8, 20, 6, px(RAMP.INK, 1));
  return pm;
}

/** map-scale backboard on its pole — bent rim, chain net (street canon) */
export function drawBackboardProp(): Pixmap {
  const pm = new Pixmap(26, 44);
  const steel = px(RAMP.PAPER, 1);
  pm.rect(12, 10, 3, 33, steel); // pole
  pm.vline(12, 10, 33, px(RAMP.PAPER, 2));
  pm.rect(5, 2, 17, 11, px(RAMP.PAPER, 2)); // board
  pm.hline(5, 2, 17, px(RAMP.PAPER, 3));
  pm.vline(21, 3, 10, px(RAMP.PAPER, 0));
  pm.frame(10, 5, 7, 6, px(RAMP.RED, 1)); // the painted square, fading
  // rim seen face-on below the board — bent left where summers landed
  pm.hline(8, 13, 11, px(RAMP.ORANGE, 2));
  pm.set(7, 14, px(RAMP.ORANGE, 1)); // the droop
  // chain net
  for (let i = 0; i < 5; i++) {
    pm.vline(9 + i * 2, 14, 5 - (i % 2), i % 2 === 0 ? px(RAMP.PAPER, 2) : px(RAMP.PAPER, 1));
  }
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(13, 42, 7, px(RAMP.INK, 1));
  return pm;
}

/** THE CAGE PARK's community MURAL (S15i Task 6, ADR-059) — a painted handball
 *  wall: a sunset court, a big ball, three kids going UP. Flat fills + deliberate
 *  marks (ADR-020), solid (you read it, you don't walk through it). */
export function drawCageMural(): Pixmap {
  const pm = new Pixmap(46, 28);
  // the wall: a warm sunset sky over an asphalt band
  pm.rect(0, 0, 46, 18, px(RAMP.ORANGE, 3));
  pm.rect(0, 8, 46, 6, px(RAMP.MAGENTA, 2)); // a sunset stripe
  pm.rect(0, 18, 46, 10, px(RAMP.EARTH, 1)); // the court
  // the big ball / low sun, off-centre (the focal mark)
  pm.ellipse(12, 13, 8, 8, px(RAMP.ORANGE, 1));
  pm.ellipse(12, 13, 7, 7, px(RAMP.GOLD, 3));
  pm.vline(12, 6, 15, px(RAMP.ORANGE, 0)); // ball seams
  pm.hline(5, 13, 15, px(RAMP.ORANGE, 0));
  pm.set(8, 9, px(RAMP.ORANGE, 0));
  pm.set(16, 18, px(RAMP.ORANGE, 0));
  // three kids going up — bold flat silhouettes, arms reaching
  const kid = (x: number, ramp: number): void => {
    pm.rect(x, 13, 3, 8, px(ramp, 2)); // body
    pm.set(x + 1, 11, px(RAMP.EARTH, 2)); // head
    pm.vline(x + 2, 8, 4, px(ramp, 2)); // arm up
    pm.set(x - 1, 15, px(ramp, 1)); // arm out
  };
  kid(26, RAMP.RED);
  kid(33, RAMP.CYAN);
  kid(40, RAMP.PURPLE);
  // the wall frame + a tag corner
  pm.frame(0, 0, 46, 28, px(RAMP.PAPER, 2));
  pm.set(3, 24, px(RAMP.CYAN, 3));
  pm.set(4, 24, px(RAMP.GOLD, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** bleacher planks with a seeded-but-deliberate bench crowd (litSeed style) */
export function drawBleachers(crowdSeed: number): Pixmap {
  const pm = new Pixmap(64, 26);
  const plank = px(RAMP.EARTH, 2);
  const plankL = px(RAMP.EARTH, 3);
  const plankD = px(RAMP.EARTH, 1);
  // three rising rows of planks
  for (let r = 0; r < 3; r++) {
    const y = 6 + r * 6;
    pm.rect(2, y, 60, 4, plank);
    pm.hline(2, y, 60, plankL);
    pm.hline(2, y + 3, 60, plankD);
    pm.set(20 + r * 9, y + 1, plankD); // one knot per plank, off-center
  }
  pm.rect(4, 22, 3, 3, plankD); // legs
  pm.rect(57, 22, 3, 3, plankD);
  pm.rect(30, 22, 3, 3, plankD);
  // the bench crowd: little heads + shoulders along the top plank, hashed
  // placement (no two cages cheer alike), deliberate 3px figures
  const ramps = [RAMP.RED, RAMP.CYAN, RAMP.GOLD, RAMP.PURPLE, RAMP.GRASS] as const;
  for (let i = 0; i < 9; i++) {
    const h = (crowdSeed * 31 + i * 67) % 97;
    if (h % 5 === 4) continue; // an empty seat — somebody went for colas
    const x = 5 + i * 6 + (h % 3);
    const skin = h % 4 === 1 ? px(RAMP.SKIN_DEEP, 2) : px(RAMP.SKIN, 2);
    pm.rect(x, 1, 3, 3, skin); // head
    pm.rect(x - 1, 4, 5, 2, px(ramps[h % ramps.length], 2)); // shoulders
  }
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(32, 24, 26, px(RAMP.INK, 1));
  return pm;
}

/**
 * The hand-chalked bracket board: a plywood sheet on two posts, THE CLASSIC
 * across the top, chalk rows the scene narrates (the live bracket draws in
 * HoopsScene; this prop is the venue fixture).
 */
export function drawChalkBoard(): Pixmap {
  const pm = new Pixmap(34, 30);
  const ply = px(RAMP.EARTH, 1);
  pm.rect(4, 24, 3, 5, ply); // posts
  pm.rect(27, 24, 3, 5, ply);
  pm.rect(1, 1, 32, 24, px(RAMP.INK, 1)); // the board, chalkboard-dark
  pm.frame(1, 1, 32, 24, ply);
  const chalk = px(RAMP.PAPER, 2);
  const chalkD = px(RAMP.PAPER, 1);
  pm.hline(5, 4, 24, chalk); // THE CLASSIC banner line
  pm.hline(8, 5, 18, chalkD);
  // bracket arms: two columns of seeds feeding a center line
  for (let r = 0; r < 4; r++) {
    pm.hline(4, 9 + r * 4, 6, r % 2 === 0 ? chalk : chalkD);
    pm.hline(24, 9 + r * 4, 6, r % 2 === 1 ? chalk : chalkD);
    pm.set(10, 10 + r * 4, chalkD);
    pm.set(23, 10 + r * 4, chalkD);
  }
  pm.vline(16, 10, 9, chalk); // the line everything feeds
  pm.set(16, 20, px(RAMP.GOLD, 3)); // the champion's chalk star
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(17, 28, 9, px(RAMP.INK, 1));
  return pm;
}
