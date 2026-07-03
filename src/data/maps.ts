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
import { buildChapter3Maps } from './maps_ch3';
import { buildChapter4Maps } from './maps_ch4';
import { buildChapter5Maps } from './maps_ch5';
import { buildChapter6Maps } from './maps_ch6';
import { buildChapter7Maps } from './maps_ch7';
import { buildChapter8Maps } from './maps_ch8';
import { buildChapter9Maps } from './maps_ch9';
import { buildChapter10Maps } from './maps_ch10';
// S15h (ADR-049) — THE WORLD BLOCK: the forge lays the new growth as a DISTRICT
// stitched onto each frozen core (the bones); the soul stays hand-authored.
import { buildDistrict, buildRoute, buildWoods, Streams } from '../levelkit';
import { placeFacade, facadeDims } from '../levelkit/kit';
import { occupyCity } from './citylife';
import { AREA_SKINS } from '../spritegen/buildings';

export { Grid, seededRng, treeSprite, doorstepOf } from './mapkit';
import type { MapDef, PropDef, NpcDef, SignDef, AmbienceId, ReflectZone } from '../schemas';

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
  // S15i Task 6 (ADR-059) — the golf resort's manicured course
  m: 'fairway',
  // EB GROUND KIT (2026-07-02 baseline overhaul) — Onett-style terracing. Scanned
  // FREE across every shipped grid before adoption (no stray K/^/T cells existed).
  K: 'cliff_face', // solid terrace wall — paint 1-2 rows tall below the upper level
  '^': 'cliff_lip', // walkable grass-over-rock trim on the upper terrace's edge row
  T: 'stairs', // walkable concrete steps connecting terrace levels
  // WORLD-OVERHAUL (Ch3+) — the HEDGE-WALL autotile belt (solid). buildTiles special-
  // cases 'H' to pick hedge_<mask> by 4-neighbour connectivity; this legend entry is the
  // solidity + boot fallback (isSolidChar('H') = hedge_15 is solid). See tiles.ts HEDGE_BASE.
  H: 'hedge_15', // solid winding-corridor hedge wall (16-mask; rendered per-neighbour)
  V: 'bramble_15', // solid winding-corridor bramble wall (16-mask; the hedge's thornier sibling)
};

// treeSprite lives in mapkit.ts (S14 extraction — byte-identical)

/* ---- EB winding-path painters (2026-07-02 de-blockify pass) ----
 * Roads and trails are painted from hand-authored CENTER TABLES instead of
 * straight rects: one center per row (windV) or per column (windH), each row
 * painting the UNION of its own span and the next row's span so every bend
 * stays ≥w connected (no diagonal pinches). Deterministic — the tables are
 * literals, never RNG. */
function windV(g: Grid, x0Centers: number[], yTop: number, w: number, ch: string): void {
  const half = Math.floor(w / 2);
  for (let i = 0; i < x0Centers.length; i++) {
    const next = x0Centers[Math.min(i + 1, x0Centers.length - 1)];
    const lo = Math.min(x0Centers[i], next) - half;
    const hi = Math.max(x0Centers[i], next) + (w - 1 - half);
    g.rect(lo, yTop + i, hi - lo + 1, 1, ch);
  }
}
function windH(g: Grid, yCenters: number[], xLeft: number, w: number, ch: string): void {
  const half = Math.floor(w / 2);
  for (let i = 0; i < yCenters.length; i++) {
    const next = yCenters[Math.min(i + 1, yCenters.length - 1)];
    const lo = Math.min(yCenters[i], next) - half;
    const hi = Math.max(yCenters[i], next) + (w - 1 - half);
    g.rect(xLeft + i, lo, 1, hi - lo + 1, ch);
  }
}

/* ------------------------------------------------------------------ */

/* ------------------- OTTERBROOK ------------------- */

/** THE FROZEN 1995 CORE — byte-identical forever (the byte-identical test
 *  proves growOtterbrook copies it unchanged into the top-left).
 *
 *  EB-CONSTRUCTION PASS (CH1_EB_BLUEPRINT v2): Otterbrook keeps its Session-3
 *  layout bones (brook/square/districts) but moves to the EB GROUND KIT —
 *  built on TERRACES like Onett, with an actual paved downtown. The Bluff
 *  (Elm Row, y0-8) sits one level up; a `^` lip + `K` cliff band runs the
 *  terrace edge at y8/y9, broken by 3-wide `T` stairs (Main St center, the
 *  west stair pocket) and the brook's waterfall gap. Below the terrace,
 *  downtown goes ASPHALT: Main St + Bridge St (Cross Ln) + the Civic Ln stub
 *  are real `R` roads with `D` dashes, `X` crosswalks at the four-corners,
 *  `=` sidewalk aprons both sides (curbs render automatically), `3` storm
 *  drains, and a short `P` parking lane. Residential Elm Row itself stays
 *  ':' dirt — only downtown paves. Four districts sit inside the 42×32 core
 *  (Bridge St / Creekside, the Civic Quarter, and the South live entirely in
 *  growth):
 *    D1 THE BLUFF / ELM ROW (upper terrace, y0-8) — a bending Elm Ln, 4
 *      staggered yards (mailbox, doghouse, kiddie pool, clothesline,
 *      tree-swing), an orchard pocket, footbridge #1 crossing the brook east.
 *    D2 DOWNTOWN + TOWN SQUARE (center, y9-21) — Main St's release moment: a
 *      paved plaza with the OTTER STATUE fountain on Main's sightline, a
 *      storefront row north of Bridge St, the bus corner, the morning market.
 *    D3 OTTER GREEN + STARPORT (SW) — hedge-ringed park: playground, dog run,
 *      picnic, a desire-path shortcut.
 *    D4 CHAPEL + COMMUNITY GARDENS (SE of center) — a fenced churchyard +
 *      two garden plots behind it.
 *  Main St runs the full spine (x19-21, 3-wide) so every quarter fronts it. */
export function buildOtterbrook(): MapDef {
  const g = new Grid(42, 32);
  g.sprinkle(7, ',~,~ff F', 0.06);

  // ============================================================
  // SKELETON — Main St spine, Elm Ln (bending) on the upper Bluff terrace,
  // the terrace edge (T-stairs down to downtown), Bridge St (asphalt Cross
  // Ln), the Green's inner loop + desire-path, the town-square plaza, the
  // storefront apron, and the brook's core segment (with footbridge #1).
  // ============================================================
  // ZONE GRAMMAR (clean-slate EB pass): the town reads in Onett order walking
  // south — THE BLUFF (houses, set apart) → HICKORY WOODS (a dirt lane walled
  // by trees) → THE MEADOW (an open release, nearly empty) → DOWNTOWN (a real
  // paved main drag with storefront walls both sides + the town square).
  // Each zone is its own texture; props exist only where a zone gives them a
  // reason. Main St (x19-21, pinned by the hill gate + stairs) is the single
  // north-south spine stitching all four.

  // ---- Z1 THE BLUFF: Elm Ln JOGS between y6 and y7 lot-to-lot (M2).
  g.rect(19, 1, 3, 7, ':'); // Main St's bluff-top stub (gate landing at 21,1)
  const elmRow = (x: number): number => ((x >= 12 && x < 22) || x >= 32 ? 7 : 6);
  for (let x = 4; x <= 38; x++) g.set(x, elmRow(x), ':');
  // driveway stubs up to each yard gate. house_rex's own stub is skipped — its
  // porch TRIGGER (6,6,4,2) already keeps that ground open.
  g.set(11, elmRow(11) + 1, ':'); // house_chad's gate stub
  g.set(26, elmRow(26) + 1, ':'); // house_a's gate stub
  g.set(33, elmRow(33) - 1, ':'); // house_b's gate stub

  // The terrace edge (Onett-style): a `^` lip on y8 over a `K` cliff on y9,
  // x0→38. ONE way down — Main St's own 3-wide stairs (a single funnel gives
  // the bluff its "set apart" feel; EB's hilltop has exactly one road down).
  // The brook falls over the band at x39-41 (foam, not cliff).
  g.rect(0, 8, 39, 1, '^');
  g.rect(0, 9, 39, 1, 'K');
  g.rect(19, 8, 3, 2, 'T'); // Main St stairs — the only cut in the band
  g.rect(39, 8, 3, 2, 'E'); // the waterfall lip
  g.set(18, 8, '-'); g.set(22, 8, '-'); // rail stubs flanking the stair mouth

  // ---- Z2 HICKORY WOODS (y10-15): Main St drops to a 3-wide dirt lane that
  // WINDS between the trees (planted below) — "a little area with a path
  // mainly blocked by trees". One clearing pocket opens west at y10-12 for
  // the lemonade stand (pinned 14,10 + twins 13-15,11): a roadside stand.
  windV(g, [20, 19, 19, 18, 19, 20, 21, 21, 20], 10, 3, ':'); // the woods lane, y10-18 (bends W then E, home at the city limit)
  g.rect(16, 11, 3, 1, ':'); // the clearing's spur (scenery width — not a mandatory route)

  // ---- Z2 continues: THE HICKORY WOODS BELT fills the rest of the core
  // (y16-31) — an Eagleland-style forest wall between the bluff and the rest
  // of town. Solid bramble ('b') masses it in; tree ranks (props) canopy it;
  // the lane's winding cut is the ONLY way through, so the next zone stays
  // hidden until you emerge. The meadow, the Green, downtown, civic, Maple
  // Ct, the pond park, the orchard, and both gates all live in GROWTH now —
  // the town is regional, and every zone is its own clearing.
  windV(g, [20, 21, 22, 22, 23, 24, 25, 26, 26, 27, 27, 28, 29], 19, 3, ':'); // the lane keeps winding SE, y19-31 (growth carries it to the meadow)
  // bramble mass west of the lane (leaving the clearing + the lane cut open)
  g.rect(2, 16, 12, 3, 'b');
  g.rect(1, 20, 15, 4, 'b');
  g.rect(2, 25, 16, 4, 'b');
  g.rect(1, 30, 18, 2, 'b');
  // bramble mass east of the lane, up to the river bank (x38)
  g.rect(26, 16, 12, 3, 'b');
  g.rect(28, 20, 10, 4, 'b');
  g.rect(30, 25, 8, 4, 'b');
  g.rect(32, 30, 6, 2, 'b');

  // ---- THE BROOK — one river line: enters the north edge at x39-40 beside
  // the bluff, falls over the terrace at y8-9, runs the east flank, and turns
  // EAST at y20-21 (growth carries the elbow to the pond's NW corner). Water
  // 'e'/'E' is solid, so the banks and both deck ends seal themselves — no
  // fence tiles ever sit on water.
  g.rect(39, 0, 2, 8, 'e');
  g.rect(38, 0, 1, 8, 'E'); // west bank foam above the falls
  g.rect(39, 10, 2, 10, 'e'); // below the falls, down the east flank (y10-19)
  g.rect(38, 10, 1, 4, 'E'); // west bank foam, falls → the deck
  g.rect(39, 6, 2, 3, ':'); // footbridge #1 — Elm Ln's deck (water above, waterfall lip below: sealed)
  // the country road's crossing: a 3-wide ':' wooden deck (x39-41, y16-18) —
  // the EB contrast beat; the corridor continues east in growth.
  g.rect(39, 16, 3, 3, ':');
  g.rect(41, 15, 1, 1, '-'); g.rect(41, 19, 1, 1, '-'); // rail posts on the LAND corner only
  g.rect(39, 20, 2, 2, 'e'); g.rect(41, 20, 1, 2, 'e'); // the ELBOW: the river turns east (grow continues x42+)
  g.rect(38, 20, 1, 2, 'E'); // outer-bank foam at the turn
  g.rect(39, 22, 2, 1, 'E'); // south bank foam under the elbow

  // ---- ELM ROW yards: fence runs with a gate gap at each driveway stub +
  // one tree between each pair of lots + a flower bed per lot. house_rex's
  // frontage (x6-9) is left OPEN, not fenced — the porch trigger (6,6,4,2)
  // and the S6 porch-cinematic pan (px128,128 = tile 8,8) must stay clear.
  g.rect(4, 6, 2, 1, '-'); g.rect(10, 6, 2, 1, '-'); // flanks of house_rex's open frontage
  g.rect(13, 6, 6, 1, '-'); // house_chad's fence, gap at x12 (the driveway stub)
  // Main St (x19-21) breaks the run; resume east of it for house_a (25,2) — gap at x26
  g.rect(22, 6, 4, 1, '-'); g.rect(27, 6, 4, 1, '-');
  g.rect(28, 7, 4, 1, '-'); // a's south rim, clear of the Sodd spawner rect (25,7,3,1)
  g.rect(31, 7, 1, 1, '-'); g.rect(34, 7, 3, 1, '-'); // house_b's fence (row 7, its own Elm Ln jog), gap at x33
  g.set(23, 5, 'F'); g.set(31, 6, 'f'); // yard flower beds (house_a's, house_b's)

  // ---- CHAPEL YARD (west end of the drag's south side): a flower bed by
  // its sidewalk path; the churchyard reads quiet against the busy square.
  g.set(14, 30, 'f');
  // TOWN SQUARE beds at the plaza's inner corners (the only planting downtown)
  g.set(27, 28, 'f'); g.set(35, 28, 'F');

  const treeLine: Array<[number, number]> = [
    // Z1 bluff: the west orchard pocket + one tree between each Elm lot pair
    [1, 3], [3, 2], [2, 5],
    [8, 4], [21, 3], [30, 4],
  ];
  // north wall (bluff top), gaps at the hill gate (x18-23), the orchard pocket
  // (x1-4) and the brook (x38+)
  for (let x = 0; x < 38; x += 2) {
    if ((x < 18 || x > 23) && (x < 1 || x > 4)) treeLine.push([x, 0]);
  }
  // west edge column down through the woods + meadow (the Green's hedge takes
  // over below y21; the south edge is an interior seam into growth — no wall)
  for (let y = 2; y < 20; y += 2) treeLine.push([0, y]);
  // Z2 HICKORY WOODS — the transition belt (y10-15): dense CLUMPS walling the
  // lane (x19-21) tight, leaving only the lemonade clearing (x12-17,y9-12),
  // the alley's south row, and the brook bank open. This is the "path blocked
  // by trees" beat — the one place the map plants thick.
  treeLine.push(
    // west block clumps
    [2, 11], [4, 12], [3, 14], [6, 10], [7, 13], [9, 11], [10, 14], [13, 13], [15, 14],
    [5, 15], [11, 12],
    // lane shoulders (tight, funneling)
    [17, 13], [16, 10], [23, 10], [23, 14],
    // east block clumps
    [25, 11], [26, 14], [28, 12], [30, 10], [31, 13], [33, 11], [35, 14], [36, 10], [37, 12],
    [27, 10], [34, 13],
  );
  // Z3 MEADOW — two lone clumps at the flanks; otherwise deliberately empty
  treeLine.push([5, 17], [7, 18], [34, 19]);
  // Z5 the Green — two shade trees on the north strip
  treeLine.push([4, 17], [7, 17]);
  // the riverbank at the elbow
  treeLine.push([37, 19]);

  // never plant a tree on a walkable street/path tile — Elm Row + the perimeter
  // tree-lines are placed by coordinate, so a few can land on ':' gravel or open
  // water. Drop those so no dirt path runs straight through a solid oak. `T`
  // (stairs) is excluded too — a tree there would block a mandatory terrace
  // route; `K` is already solid so a tree landing there is harmless either way.
  // IDENTICAL to growOtterbrook's guard set — the core-prefix law needs both
  // passes to keep/drop exactly the same trees (a '^' lip tree taught us).
  const ON_PATH = new Set([':', 'R', 'D', 'X', 'e', 'E', 'T', '=', 'p', 'P', '3', '^', 'K']);
  const treeLineClear = treeLine.filter(([x, y]) => !ON_PATH.has(g.rows[y]?.[x] ?? '.'));

  return {
    id: 'otterbrook',
    name: 'OTTERBROOK, OHIO',
    music: 'otterbrook',
    settlement: 'town',
    grid: g.out(),
    props: [
      ...treeLineClear.map(([x, y]) => ({
        sprite: treeSprite(x, y),
        x,
        y,
        solid: { ox: 7, oy: 22, w: 12, h: 10 },
      })),
      // telephone poles along the drag's north sidewalk (downtown-only rhythm;
      // the woods lane stays rural). Visual only, no solid (S6 rule).
      ...[59.875, 68.875, 81.875].map((x) => ({
        sprite: 'phone_pole',
        x,
        y: 48.375,
      })),
      // trash cans: one beside rex's porch, the alley's back-of-house pair
      { sprite: 'trash_can', x: 4, y: 6.4, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'trash_can', x: 61.4, y: 42.55, solid: { ox: 2, oy: 10, w: 10, h: 7 } }, // the service alley
      { sprite: 'trash_can', x: 88.3, y: 47.6, solid: { ox: 2, oy: 10, w: 10, h: 7 } }, // arcade's east flank
      // (deck rails RETIRED 2026-07-02 — the horizontal rail sprite lies across
      // the water/deck and reads as a barrier while its thin solid clips the
      // walk rows; the solid water itself is the bridge's guard. Corner posts
      // on land mark the decks instead.)
      {
        sprite: 'house_rex',
        x: 5,
        y: 2,
        // the drawn house is ~79 native wide (316 runtime); the old w:66 solid left
        // a ~52px walk-through gap on the right side. Match the drawn body width.
        solid: { ox: 0, oy: 20, w: 79, h: 34 },
        // door.ox aligns the doorstep + porch glow with the DRAWN door: measured at
        // texture x≈115 (native ≈24), so s(ox)+s(w)/2 must ≈115 → ox 22 (was 32,
        // which floated the glow right toward the window). zone reaches below the
        // collision floor so the doorstep is walkable.
        door: { ox: 22, oy: 52, w: 14, h: 28, to: 'rex_home', tx: 104, ty: 124 },
      },
      // rex's yard: Biscuit's doghouse, beside the porch but clear of the
      // trigger rect (6,6,4,2) and the pan box (x5-11,y5-8) — set at the open
      // frontage's east flank, plus a freestanding mailbox by the lane edge.
      { sprite: 'doghouse', x: 10.3, y: 6.35, solid: { ox: 2, oy: 14, w: 20, h: 10 } },
      { sprite: 'mailbox', x: 3.6, y: 6.05, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
      // Elm Row: staggered setbacks (M2) — rex(5,2) fixed, the rest step
      // forward/back a tile so the row doesn't read as one baseline.
      { sprite: 'house_chad', x: 11, y: 3, solid: { ox: 0, oy: 20, w: 66, h: 34 } },
      // chad's yard: kiddie pool + clothesline + a gate mailbox
      { sprite: 'kiddie_pool', x: 15.4, y: 5.2, solid: { ox: 2, oy: 10, w: 28, h: 12 } },
      { sprite: 'clothesline', x: 12.2, y: 4.6 },
      { sprite: 'mailbox', x: 11.6, y: 6.05, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
      { sprite: 'house_a', x: 25, y: 2, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
      // a's yard: a veggie garden (f/F rows already painted) + a gate mailbox
      { sprite: 'mailbox', x: 26.6, y: elmRow(26) - 0.95, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
      { sprite: 'house_b', x: 32, y: 3, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
      // b's yard: a tree-swing oak + flower beds (already painted) + a gate mailbox
      { sprite: 'tree_swing', x: 36.4, y: 4.4, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: 'mailbox', x: 33.4, y: elmRow(33) + 0.95, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
      // ================= Z4 DOWNTOWN — the storefront walls =================
      // North side, east of Main: the DRUGSTORE anchors the four-corners with
      // its P parking curb; the STARPORT arcade terminates the drag's east
      // sightline (M4 — its neon star is what you see walking east).
      {
        sprite: 'drugstore',
        x: 64.8,
        y: 44,
        solid: { ox: 0, oy: 20, w: 82, h: 56 },
        door: { ox: 38, oy: 64, w: 16, h: 28, to: 'drugstore_int', tx: 112, ty: 118 },
      },
      {
        sprite: 'arcade',
        x: 84,
        y: 43,
        solid: { ox: 0, oy: 20, w: 66, h: 56 },
        door: { ox: 28, oy: 64, w: 16, h: 28, to: 'arcade_int', tx: 80, ty: 102 },
      },
      // (the north side WEST of Main + the drag's remaining faces are catalog
      // storefronts, appended from growOtterbrook — bldg_* props in the core
      // array would be door-grafted by the living-city pass and break the
      // frozen-core byte test)
      // South side, west end: the CHAPEL fronts the south sidewalk behind its
      // small flowered yard — the quiet block against the square's bustle.
      {
        sprite: 'chapel',
        x: 58,
        y: 56,
        solid: { ox: 0, oy: 30, w: 50, h: 60 },
        door: { ox: 30, oy: 78, w: 16, h: 30, to: 'chapel_int', tx: 88, ty: 150 },
      },
      // ================= Z2 the lemonade clearing =================
      { sprite: 'lemonade', x: 14, y: 10, solid: { ox: 0, oy: 10, w: 36, h: 18 }, ifFlag: 'zapper_done' },
      // ================= Z4 TOWN SQUARE =================
      // The OTTER STATUE centers the plaza; four benches ring it facing in;
      // two planters mark the north corners. Nothing else — a square, not a shed.
      { sprite: 'otter_statue', x: 70.7, y: 56.2, solid: { ox: 35, oy: 60, w: 20, h: 10 } },
      { sprite: 'bench', x: 67.4, y: 56.7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 73.6, y: 56.7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 67.4, y: 58.6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 73.6, y: 58.6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'planter', x: 66.3, y: 56.1, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      { sprite: 'planter', x: 75.2, y: 56.1, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      // (the OLD center bus stop is fully retired — the Transit Depot with its
      // marquee sits ON the drag two storefronts east; no vestigial sign,
      // bench, or redirect trigger survives)
      // the save payphone on the north sidewalk, west of the four-corners
      { sprite: 'phone_table', x: 57, y: 48.95, solid: { ox: 1, oy: 8, w: 14, h: 9 } },
      { sprite: 'bug_zapper', x: 16, y: 4, solid: { ox: 4, oy: 18, w: 6, h: 8 } },
      // sidewalk furniture with a job: news box by the drugstore door, meters
      // on the P curb, hydrants at the junction + the drag's east end
      { sprite: 'news_box', x: 64.2, y: 48.5, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'parking_meter', x: 65.4, y: 48.55, solid: { ox: 3, oy: 14, w: 4, h: 6 } },
      { sprite: 'parking_meter', x: 67.4, y: 48.55, solid: { ox: 3, oy: 14, w: 4, h: 6 } },
      { sprite: 'hydrant', x: 55.4, y: 48.5, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
      { sprite: 'hydrant', x: 88.5, y: 54.5, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
      // S9 §A10 #1: the sniff trail's first clue — paw prints at the
      // trailhead, visible only mid-trail (walkable marking, no solid)
      { sprite: 'paw_prints', x: 19, y: 2.4, ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' },
      // §A10 #2 CLARITY (2026-07-02): while the mail route is live, a DOORMAT
      // appears at each undelivered stop — walk to the mat, the letter lands.
      // (Elm Row's three + the chapel + the arcade; each retires with its flag.)
      { sprite: 'doormat', x: 12.6, y: 6.35, ifFlag: 'q_mail', unlessFlag: 'q_mail_pickles' },
      { sprite: 'doormat', x: 26.4, y: 5.65, ifFlag: 'q_mail', unlessFlag: 'q_mail_sodd' },
      { sprite: 'doormat', x: 33.8, y: 6.45, ifFlag: 'q_mail', unlessFlag: 'q_mail_birch' },
      { sprite: 'doormat', x: 60.9, y: 60.2, ifFlag: 'q_mail', unlessFlag: 'q_mail_chapel' },
      { sprite: 'doormat', x: 86, y: 47.15, ifFlag: 'q_mail', unlessFlag: 'q_mail_arcade' },
      // ================= the Otter Green (in the meadow clearing) ==========
      // playground + picnic inside the ring; the dog run NE; the meadow's
      // spawner rect sits on the open grass east of the ring
      { sprite: 'swing_set', x: 12.4, y: 35.9, solid: { ox: 2, oy: 20, w: 60, h: 8 } },
      { sprite: 'seesaw', x: 15.5, y: 38.6, solid: { ox: 2, oy: 8, w: 40, h: 6 } },
      { sprite: 'picnic', x: 12.4, y: 39.2, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    ],
    npcs: [
      {
        id: 'mrs_pemmel',
        sprite: 'mrsPemmel',
        x: 15,
        y: 38,
        facing: 'down',
        dialogue: 'npc_pemmel',
      },
      // S9: Biscuit holds the park until dawn (the §A10 #1 quest takes him),
      // and comes home — collar and all — once the trail is walked. Lives in
      // the fenced dog-run pocket now (open toward the loop, at the N rim gap).
      { id: 'biscuit', sprite: 'dog', x: 19, y: 38, facing: 'left', dialogue: 'npc_biscuit', dog: true, unlessFlag: 'zapper_done' },
      { id: 'biscuit_home', sprite: 'dog', x: 19, y: 38, facing: 'left', dialogue: 'npc_biscuit_collar', dog: true, ifFlag: 'q_biscuit_done' },
      {
        // walks the Hickory Woods lane between the bluff stairs and town
        id: 'mr_plummer',
        sprite: 'mrPlummer',
        x: 22,
        y: 12,
        facing: 'down',
        dialogue: 'npc_plummer',
        wander: true,
      },
      // S?? (ADR-121): the twins are HOME ASLEEP through the meteor night — they
      // only set up the stand once it's morning (zapper_done). The night versions
      // live in ana_room / vivi_room. Stand moved north, out of the opening pan.
      { id: 'ana', sprite: 'ana', x: 13, y: 11, facing: 'down', dialogue: 'npc_ana', ifFlag: 'zapper_done' },
      { id: 'vivi', sprite: 'vivi', x: 15, y: 11, facing: 'down', dialogue: 'npc_vivi', ifFlag: 'zapper_done' },
      // S15c: the town reacts to the night, then to the morning after it.
      // mr_plummer wanders the square; old_timer works the community gardens.
      { id: 'old_timer', sprite: 'oldTimer', x: 58, y: 83, facing: 'down', dialogue: 'npc_oldtimer', dialogueDay: 'npc_oldtimer_day', wander: true }, // tends the community gardens
      { id: 'pajama_kid', sprite: 'pajamaKid', x: 65, y: 48, facing: 'left', dialogue: 'npc_pajama', dialogueDay: 'npc_pajama_day', wander: true }, // wanders near the bus corner
    ],
    signs: [
      { x: 61, y: 55, dialogue: 'sign_welcome' }, // the drag's south sidewalk, at the four-corners
      { x: 23, y: 14, dialogue: 'sign_hill' }, // the woods lane's east shoulder, pointing uphill
      { x: 59, y: 55, dialogue: 'sign_chapel' }, // beside the chapel's sidewalk path
      // S9 §A10 #1: sniff clue 1 (under the paw prints, same gates)
      { x: 19, y: 2, dialogue: 'q_biscuit_clue1', ifFlag: 'q_biscuit', unlessFlag: 'q_biscuit_c1' },
    ],
    phones: [{ x: 57, y: 49 }],
    doors: [
      // ADR-042: town's north edge now climbs HILL ROAD before the trail
      { x: 18, y: 0, w: 6, h: 1, to: 'hill_road', tx: 236, ty: 506, facing: 'up' },
    ],
    spawners: [
      {
        // the Hollow's lawns (open loop interior)
        enemies: ['cranky_mailbox', 'sprinkler_sentry'],
        count: 1,
        rect: { x: 64, y: 22, w: 8, h: 4 },
        ifFlag: 'meteor_fell',
      },
      {
        // the meadow east of the Green's ring (open grass; the lane may cross)
        enemies: ['runaway_lawnmower', 'recycling_raccoon', 'unionized_gnome'],
        count: 1,
        rect: { x: 26, y: 35, w: 8, h: 5 },
        ifFlag: 'meteor_fell',
      },
      {
        // downtown's own night trouble — pigeons working the empty drag
        // (road lanes only, ≥24px clear of the bus trigger + payphone + doors)
        enemies: ['pigeon_gang', 'good_investment'],
        count: 1,
        rect: { x: 67, y: 51, w: 8, h: 3 },
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
      { id: 'porch', rect: { x: 6, y: 6, w: 4, h: 2 }, once: true },
      // ADR-121 rework (2026-07-02, user direction): the Titanic Tick is no
      // longer fought by TOUCHING the tree — the Heart Oak's roots have torn
      // open into a BURROW (a real door beside the tree), and the heart_oak
      // trigger now lives at the bottom of the UNDER-OAK dungeon (oak_heart),
      // at the end of a directed three-map descent.
    ],
  };
}

/* ------------- OTTERBROOK GROWS UP (S15h, ADR-049) ------------- */

/** the grown town's east gateway tile — MEADOW MILE (Movement 2) leaves from
 *  here. Computed from the grown bounds (W-2, the cross-lane row), never a
 *  literal baked into the road, so a re-scope can't strand it (ADR-012). */
export const OTTERBROOK_EAST_GATE = { x: 124, y: 50 } as const;

/** the solid for the standard tree (lifted from the core, byte-identical) */
const OAK: { ox: number; oy: number; w: number; h: number } = { ox: 7, oy: 22, w: 12, h: 10 };

/**
 * OTTERBROOK ~2.9× (1216 → 3536 tiles, inside the ≤4000 XL envelope). The
 * frozen 1995 core is COPIED byte-for-byte into the top-left of a 70×56 grid.
 * FULL REBUILD (OTTERBROOK_BLUEPRINT): the old south/east FORGE districts are
 * retired — every grown quarter is HAND-BUILT now, so the brook, the bridges,
 * and the yards all read with intent instead of a generated block:
 *   D5 THE BROOK + BRIDGE ST + CREEKSIDE (NE) — the creek continues from the
 *     core, crosses Bridge St on footbridge #2 (at the pinned y16-17 gateway
 *     corridor), then a 5-building creekside loop lane.
 *   D6 CIVIC QUARTER (SW) — City Hall + the Station House on a paved civic
 *     lane; the Civic Green gets a GAZEBO bandstand; the (unchanged) woods
 *     nook thicket sits at its west edge.
 *   D7 SOUTH — Maple Court (a cul-de-sac loop of 5 homes), the Depot Pocket,
 *     Pond Park (re-dressed with cattails + a second brook crossing), and a
 *     community orchard where the brook flows out.
 * The bus corner, lemonade stand, chapel, the dos doorstep, and every 1995
 * prop keep their coordinates (the byte-identical core test).
 */
export function growOtterbrook(): MapDef {
  const core = buildOtterbrook();
  const CW = core.grid[0].length; // 42
  const CH = core.grid.length; // 32
  const W = 126; // EAGLELAND SCALE (user directive 2026-07-02): the town is
  const H = 96; //  regional — zones are clearings, separated by forest belts
  const g = new Grid(W, H, '.');
  // 1) the frozen core, verbatim, in the top-left
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) g.set(x, y, core.grid[y][x]);

  // 1b) THE FOREST BELTS — Eagleland's trick: you can never see the next zone
  //     from the current one. Thick bramble masses ('b', solid) wall each zone
  //     off; double tree ranks (props, below) canopy the faces; every
  //     connecting lane is painted AFTER the belts, so its winding cut is the
  //     only way through. Belts first, clearings + lanes over them.
  g.rect(42, 0, 14, 44, 'b'); // BELT W — seals the core's east flank down to the downtown approach
  g.rect(56, 10, 40, 4, 'b'); // BELT N — above the Hollow
  g.rect(56, 31, 40, 12, 'b'); // BELT C — between the Hollow and downtown
  g.rect(92, 14, 8, 34, 'b'); // BELT E — between downtown/Hollow and the pond park
  g.rect(8, 60, 88, 8, 'b'); // BELT S — between downtown and the civic/Maple south
  g.rect(0, 32, 8, 60, 'b'); // WEST WALL — the map's forested west edge below the core
  g.rect(96, 0, 30, 12, 'b'); // NE corner mass
  g.rect(100, 12, 26, 26, 'b'); // E corner mass above the pond park
  g.rect(110, 54, 16, 10, 'b'); // SE mass between the gate road and the orchard
  g.rect(96, 78, 30, 18, 'b'); // SE corner mass
  g.rect(8, 80, 8, 16, 'b'); // SW flank beside the thicket
  g.rect(42, 68, 12, 28, 'b'); // S mass between civic and Maple
  g.rect(84, 62, 12, 34, 'b'); // S mass east of Maple
  g.rect(90, 44, 6, 20, 'b'); // BELT E2 — between downtown's east end and the pond park (the gate road cuts it)

  // 2) THE WOODS NOOK — the same quiet thicket + glade gift, re-seated in the
  //    far SW corner clearing (same box size; the glade scan follows it).
  const thicket = buildWoods(g, { x: 1, y: 86, w: 12, h: 9 }, new Streams(19954), { gladeProp: 'picnic' });
  let gladeRow = 90;
  for (let y = 86; y < 95; y++) if (g.rows[y]?.[7] === ':') { gladeRow = y; break; }
  const woodsGift = walkPresent('otter_woods_gift', 9, gladeRow);
  const thicketProps = clearTreesIn(thicket.props, { x: 8, y: gladeRow - 1, w: 3, h: 3 });

  // 3) THE RIVER — the core carries it down the bluff woods' east bank
  //    (x39-40, to the core's south edge). Growth WINDS it southeast through
  //    the belts (a river through forest), across the map's midline, into the
  //    pond park. Banks: a 4-wide foam pass under a 2-wide water pass on the
  //    same centers leaves 1 cell of 'E' each side — solid, self-sealing.
  const riverV = [40, 41, 43, 45, 48, 51, 55, 59, 63, 66]; // rows y32-41
  windV(g, riverV, 32, 4, 'E');
  windV(g, riverV, 32, 2, 'e');
  const riverH = [42, 42, 43, 43, 43, 42, 42, 42, 43, 43, 44, 44, 44, 44, 44, 44, 44, 43, 43, 43, 43, 43, 43, 43, 44, 44, 44, 44, 44, 44, 44]; // cols x67-97
  windH(g, riverH, 67, 4, 'E');
  windH(g, riverH, 67, 2, 'e');

  // 4) THE HOLLOW (NE clearing) — a hidden residential pocket in the forest:
  //    a rounded loop lane, 4 homes + a corner store + a cafe, laundry lines.
  //    Reached ONLY by the lane cut down to downtown (painted after belts).
  g.rect(62, 20, 1, 8, ':');
  g.rect(62, 20, 14, 1, ':');
  g.rect(75, 20, 1, 8, ':');
  g.rect(62, 27, 14, 1, ':');
  g.set(63, 21, ':'); g.set(74, 21, ':'); g.set(63, 26, ':'); g.set(74, 26, ':'); // rounded corners
  const creeksideBldgs: PropDef[] = [
    placeFacade('bldg_gen_shop_orange_2', 62, 27 * 16 + 4, 5, 2), // the corner store, anchoring the lane mouth
    placeFacade('bldg_gen_cafe_red_2', 71, 27 * 16 + 4, 4, 2),
  ];
  const hollowHomes: PropDef[] = [
    { sprite: 'house_b', x: 63, y: 16.9, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
    { sprite: 'house_a', x: 69, y: 15.9, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
    { sprite: 'house_chad', x: 76.2, y: 21, solid: { ox: 0, oy: 20, w: 66, h: 34 } },
    // (the 4th home moved to the loop's WEST flank 2026-07-02 — at 66.5,28.4 it
    // squatted between the corner store and the cafe and its solid pinched the
    // lane cut down to downtown)
    { sprite: 'house_b', x: 57.5, y: 20.6, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
  ];
  const creeksideProps: PropDef[] = [
    { sprite: 'clothesline', x: 65.5, y: 17.6 },
    { sprite: 'clothesline', x: 74.5, y: 22.4 },
    { sprite: 'mailbox', x: 64.6, y: 19.5, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'mailbox', x: 70.6, y: 19.5, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'trash_can', x: 77.4, y: 20.6, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
  ];
  // the Hollow's lane cut down to downtown's back alley (through BELT C)
  windV(g, [69, 69, 70, 70, 71, 71, 70, 70, 70, 69, 69, 70, 70, 70, 70], 28, 3, ':');

  // 4b) THE MEADOW + OTTER GREEN (the release clearing between the bluff
  //     woods and downtown): the core lane emerges at (26-30,y31) and opens
  //     into grass; the Green's hedge ring sits in the middle of it; the
  //     approach road leaves SE for downtown through BELT W's cut.
  g.rect(8, 32, 34, 28, '.'); // carve the clearing out of the west wall / belt edges
  windV(g, [28, 28, 29, 30, 31, 32, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 56, 57], 32, 3, ':'); // the lane: meadow → SE through the belt cut → downtown NW
  // the Green — hedge ring, rounded loop, dog run, all inside the meadow
  g.rect(9, 33, 15, 1, 'b'); g.rect(9, 43, 13, 1, 'b'); // N + S hedges
  g.rect(9, 34, 1, 9, 'b'); // W hedge
  g.rect(23, 34, 1, 4, 'b'); g.rect(23, 41, 1, 2, 'b'); // E hedge, 3-wide gap at y38-40
  g.set(12, 33, '.'); g.set(13, 33, '.'); g.set(14, 33, '.'); // N gap onto the meadow
  g.rect(11, 35, 11, 1, ':'); g.rect(11, 41, 11, 1, ':'); // ring N + S legs
  g.rect(11, 35, 1, 7, ':'); g.rect(21, 35, 1, 7, ':'); // ring W + E legs
  g.set(12, 36, ':'); g.set(20, 36, ':'); g.set(12, 40, ':'); g.set(20, 40, ':'); // rounded corners
  g.rect(18, 36, 3, 1, '-'); g.rect(18, 37, 1, 2, '-'); g.rect(20, 37, 1, 2, '-'); // dog run, open S

  // 5) DOWNTOWN (the city clearing, x54-92 y42-60): the EB main drag — FOUR
  //    asphalt lanes with two-tile checkered sidewalks both sides, the
  //    approach road arriving from the NW belt cut at a real four-corners,
  //    the chamfered TOWN SQUARE off the south sidewalk, and the storefront
  //    walls (props below). The arcade's neon star terminates the east vista.
  g.rect(54, 42, 38, 18, '.'); // carve the clearing out of the belts
  g.rect(56, 50, 35, 4, 'R'); // THE DRAG, x56-90
  g.rect(60, 51, 29, 1, 'D'); // centerline dashes east of the junction
  g.rect(56, 48, 35, 2, '='); // north sidewalk
  g.rect(56, 54, 35, 2, '='); // south sidewalk
  // the NW approach road pours in as asphalt from the belt cut (the dirt lane
  // becomes pavement at the city limit, y47) and crosses at the four-corners
  g.rect(56, 44, 3, 6, 'R');
  g.rect(56, 48, 3, 2, 'X'); g.rect(56, 54, 3, 1, 'X'); // zebra crossings both sides of the junction
  g.set(55, 48, '3'); g.set(59, 48, '3'); g.set(55, 54, '3'); g.set(59, 54, '3'); // junction storm drains
  g.set(89, 54, '3');
  g.rect(65, 49, 5, 1, 'P'); // parking curb outside the drugstore
  // THE TOWN SQUARE — chamfered plaza off the south sidewalk
  g.rect(66, 56, 11, 4, 'p');
  g.set(66, 56, '='); g.set(76, 56, '='); // north corners step into the sidewalk
  g.set(66, 59, '.'); g.set(76, 59, '.'); // south corners soften into the grass
  g.set(68, 56, 'f'); g.set(74, 56, 'F'); // square beds
  g.rect(60, 43, 8, 1, ':'); // the service alley behind the north row (meets the Hollow lane)
  g.rect(56, 60, 30, 4, '.'); // the south-row yards (chapel/square/brownstone/mouth doorsteps) — belt S keeps y64-67
  g.set(59, 58, 'f'); // the chapel's yard bed

  // 6) CIVIC QUARTER (SW clearing, x14-42 y62-80) — City Hall + the Station
  //    House on an asphalt civic lane behind a paved forecourt; the GAZEBO
  //    green beside them; reached by its own winding lane from downtown's
  //    west end through BELT S's cut.
  g.rect(14, 62, 28, 18, '.'); // carve the clearing
  windV(g, [57, 56, 55, 53, 51, 49, 47, 45, 43, 42], 55, 3, ':'); // downtown SW corner → the civic clearing (the belt cut)
  g.rect(18, 66, 24, 2, 'R'); // CIVIC LN — asphalt
  g.rect(19, 66, 6, 1, 'D'); g.rect(34, 66, 6, 1, 'D');
  g.rect(40, 66, 3, 2, 'X'); // the lane-mouth crosswalk where the cut arrives
  g.rect(18, 65, 24, 1, '='); g.rect(18, 68, 24, 1, '='); // aprons
  g.set(19, 65, '3'); g.set(39, 68, '3');
  g.rect(20, 63, 14, 2, 'p'); // the CIVIC FORECOURT
  const cityHall = placeFacade('bldg_civic', 20, 63 * 16 + 12, 6, 2, {
    to: 'otterbrook_cityhall', tx: 120, ty: 128,
  });
  const station = placeFacade('facade_otter_station', 27, 63 * 16 + 12, 6, 2, {
    to: 'otter_station', tx: 120, ty: 128,
  });

  // 7) THE GAZEBO GREEN — beside the civic lane: a bandstand in a rounded
  //    ring, hedge fragments (never a wall), the porch_can oak + present on
  //    its lawn at (24,72) — the fixed-point test moves WITH it (same change).
  for (const [hx, hy, hw] of [[16, 69, 3], [23, 69, 3], [16, 78, 4], [24, 78, 3]] as const) g.rect(hx, hy, hw, 1, 'b');
  g.rect(18, 71, 6, 1, ':'); g.rect(18, 76, 6, 1, ':'); // ring N + S legs
  g.rect(18, 71, 1, 6, ':'); g.rect(23, 71, 1, 6, ':'); // ring W + E legs
  g.set(19, 72, ':'); g.set(22, 72, ':'); g.set(19, 75, ':'); g.set(22, 75, ':'); // rounded corners
  g.set(17, 73, 'f'); g.set(25, 74, 'F'); g.set(20, 78, 'f');
  // the WOODS-NOOK TRAIL — a winding cut from the civic green's SW corner
  // down through the forest to the thicket's mouth (the birder's trailhead)
  windV(g, [16, 15, 13, 11, 10, 9, 8], 79, 3, ':');
  // grass APRON ring around the thicket box (outside it — never repainting
  // the woods' own ground): the trailhead sign/birder pocket + the box mouth
  g.rect(0, 83, 14, 3, '.');
  g.rect(0, 86, 1, 10, '.');
  g.rect(13, 86, 1, 9, '.');
  g.rect(1, 95, 13, 1, '.');

  // 8) MAPLE CT (the south residential clearing, x56-82 y68-86) — a rounded
  //    cul-de-sac loop of homes reached by its own winding lane from the
  //    town square, through BELT S's second cut. Community gardens on its
  //    west approach.
  g.rect(56, 68, 26, 18, '.'); // carve the clearing
  windV(g, [70, 70, 69, 68, 67, 66, 65, 64, 63, 62, 62, 62, 62, 62], 60, 3, ':'); // square → Maple Ct (the belt cut)
  g.rect(60, 74, 1, 6, ':'); // the loop's west leg
  g.rect(60, 74, 16, 1, ':'); // the loop's north leg
  g.rect(75, 74, 1, 6, ':'); // the loop's east leg
  g.rect(60, 79, 16, 1, ':'); // the loop's south leg
  g.set(61, 75, ':'); g.set(74, 75, ':'); g.set(61, 78, ':'); g.set(74, 78, ':'); // rounded corners
  const mapleHomes: PropDef[] = [
    { sprite: 'house_a', x: 62, y: 70.9, solid: { ox: 0, oy: 20, w: 50, h: 34 } }, // north row, above the loop
    { sprite: 'house_chad', x: 69, y: 69.9, solid: { ox: 0, oy: 20, w: 66, h: 34 } }, // north row
    { sprite: 'house_b', x: 71, y: 80.4, solid: { ox: 0, oy: 20, w: 50, h: 34 } }, // south row, below the loop
    { sprite: 'house_a', x: 63, y: 80.4, solid: { ox: 0, oy: 20, w: 50, h: 34 } }, // south row
    { sprite: 'house_chad', x: 76.2, y: 75, solid: { ox: 0, oy: 20, w: 66, h: 34 } }, // east flank
  ];
  const mapleGrocery = placeFacade('bldg_gen_shop_gold_2', 57, 75 * 16 - 4, 5, 2); // corner grocery at the lane mouth (doorless — occupyCity grafts tenancy)
  const mapleProps: PropDef[] = [
    { sprite: 'mailbox', x: 63.6, y: 70.5, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'mailbox', x: 71.6, y: 79.6, solid: { ox: 4, oy: 12, w: 8, h: 6 } },
    { sprite: 'clothesline', x: 67.5, y: 69.6 },
    { sprite: 'tree_swing', x: 63.4, y: 83.9, solid: OAK },
    { sprite: 'trash_can', x: 59.5, y: 73.6, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
  ];
  // COMMUNITY GARDENS — two fenced plots on Maple's west approach (old_timer's
  // day beat), rims broken south.
  g.rect(52, 82, 4, 1, '-'); g.rect(52, 83, 1, 2, '-'); g.rect(55, 83, 1, 2, '-');
  g.rect(57, 82, 4, 1, '-'); g.rect(57, 83, 1, 2, '-');
  g.set(53, 83, 'f'); g.set(54, 84, 'F'); g.set(58, 83, 'F'); g.set(59, 84, 'f');

  // 9) THE BUS DEPOT — on the drag's north row (its marquee between the shop
  //    and the arcade), fronting the same sidewalk as every storefront; the
  //    DOWNTOWN MOUTH (Main & Vine) opens off the square's east flank.
  const busDepot: PropDef = {
    // 2026-07-02: the depot art re-authored GRAND (520×250 vs the storefronts'
    // ~380) — the terminal now visibly outranks its neighbors on the drag.
    // Bottom-anchored where the old art stood (y −0.41 tiles for the taller
    // canvas); door re-measured on the new PNG: centered → ox = 130/2·? →
    // native center 65 − 8 = 57; zone bottom clears the drawn floor by ~4px.
    sprite: 'facade_busdepot',
    x: 75,
    y: 43.84,
    solid: { ox: 0, oy: 12, w: 130, h: 46 }, // ignored (LANDMARK → texture-derived solid)
    door: { ox: 57, oy: 48, w: 16, h: 18, to: 'bus_depot_int', tx: 120, ty: 128 },
  };
  g.rect(80, 60, 4, 1, ':'); // the downtown mouth's doorstep apron
  const downtownEntry = placeFacade('bldg_brickmore', 80, 59 * 16, 4, 2, {
    to: 'downtown_otterbrook', tx: 208, ty: 224,
  });

  const treesAt = (xy: ReadonlyArray<readonly [number, number]>): PropDef[] =>
    xy.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK }));

  // S17 M18 Part B (ADR-063): two hidden Americas grants on the grown south side.
  //  • THE PORCH SET coffee can under the Civic Green's oak (open '.' grass, west
  //    of the Maple Ct district — never a frozen cell, never a sealed lane).
  //  • the Spare Hubcap by the Pond Park fence (open ground, rows≥20 below the
  //    Creekside district). Both sit on hand-laid open tiles; the box's sub-tile
  //    solid can't wall a lane, and the sign tile stays walkable (BFS re-proven).
  const porchCan = walkPresent('porch_can', 24, 72);
  const hubcap = walkPresent('gift_hubcap', 109, 44);

  // 10) THE POND PARK (E clearing, x94-112 y38-52) — the river arrives from
  //     the west, fills the rounded pond, and flows out south through the
  //     orchard. The HEART OAK keeps its knoll north of the water; the walk
  //     ring ties the picnics + the hubcap spot into one place.
  g.rect(94, 38, 18, 15, '.'); // carve the clearing
  g.rect(99, 43, 6, 4, 'e');
  g.rect(99, 42, 6, 1, 'E'); g.rect(99, 47, 6, 1, 'E');
  g.set(98, 44, 'E'); g.set(98, 45, 'E'); g.set(105, 44, 'E'); g.set(105, 45, 'E');
  g.set(99, 43, 'E'); g.set(104, 43, 'E'); g.set(99, 46, 'E'); g.set(104, 46, 'E'); // rounded corners
  g.rect(96, 41, 1, 10, ':'); g.rect(96, 50, 14, 1, ':'); g.rect(109, 41, 1, 10, ':');
  g.rect(96, 41, 14, 1, ':');
  g.set(97, 42, ':'); g.set(108, 42, ':'); g.set(97, 49, ':'); g.set(108, 49, ':'); // rounded ring corners
  // the river's mouth crosses the ring's west leg on a 2-wide stepping deck
  g.set(96, 44, ':'); g.set(96, 45, ':');
  // heart-oak knoll beds (the trigger rect 100,40,3,2 covers the walkable front)
  g.set(99, 40, 'f'); g.set(103, 40, 'F');

  // 11) THE OUTFLOW + ORCHARD (SE clearing) — the river leaves the pond's
  //     south lip and WINDS to the map's south edge; the community orchard
  //     rows sit on its east bank; the EAST GATE ROAD crosses it on a 3-wide
  //     deck. A bench, not a 5th picnic (§A4.5 pins otterbrook at EXACTLY 4).
  g.rect(96, 53, 26, 32, '.'); // carve the outflow/orchard clearing
  const outflowV = [101, 101, 102, 102, 102, 101, 101, 100, 100, 101, 102, 103, 103, 103, 102, 102, 101, 101, 101, 102, 102, 103, 103, 103, 103, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102, 102]; // rows y48-95
  windV(g, outflowV, 48, 4, 'E');
  windV(g, outflowV, 48, 2, 'e');
  // the EAST GATE ROAD crosses the outflow on its deck (painted after water)
  const orchardTrees: PropDef[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const ox = 107 + col * 3;
      const oy = 58 + row * 3;
      orchardTrees.push({ sprite: treeSprite(ox, oy), x: ox, y: oy, solid: OAK });
    }
  }
  const orchardProps: PropDef[] = [
    { sprite: 'bench', x: 105, y: 57.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
  ];

  // BELT-FACE TREE RANKS — canopy rows along the forest belts (trees standing
  // in the bramble masses + along each clearing's fringe). Deterministic lines.
  const rankTrees: PropDef[] = [];
  const rankLine = (x0: number, y0: number, dx: number, dy: number, n: number): void => {
    for (let i = 0; i < n; i++) {
      const x = x0 + dx * i;
      const y = y0 + dy * i;
      rankTrees.push({ sprite: treeSprite(x, y), x, y, solid: OAK });
    }
  };
  rankLine(55, 12, 0, 3, 11); // belt W's east face
  rankLine(44, 2, 0, 3, 10); // belt W's core-facing rank
  rankLine(58, 41, 4, 0, 9); // downtown's north face
  rankLine(58, 13, 4, 0, 9); // the Hollow's north face
  rankLine(10, 59, 4, 0, 12); // belt S's north face
  rankLine(16, 61, 4, 0, 7); // belt S over the civic clearing
  rankLine(58, 67, 4, 0, 6); // Maple's north face
  rankLine(91, 16, 0, 4, 8); // belt E's west face
  rankLine(96, 37, 4, 0, 4); // the pond park's north fringe
  rankLine(117, 56, 0, 3, 7); // the orchard's east fringe
  rankLine(58, 87, 4, 0, 6); // Maple's south face
  rankLine(13, 62, 0, 3, 6); // the civic clearing's west fringe
  rankLine(46, 46, 0, 3, 5); // the downtown approach's west wall
  rankLine(86, 62, 0, 3, 5); // the mass east of Maple

  // 12) THE EAST GATE ROAD — from the drag's east end, a winding country road
  //     through BELT E's cut, over the outflow deck, past the depot-era gate
  //     cluster to the Meadow Mile door on the east edge.
  const gateRoad = [50, 50, 51, 51, 51, 50, 50, 50, 51, 51, 52, 52, 51, 51, 50, 50, 50, 50, 51, 51, 51, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]; // cols x90-125
  windH(g, gateRoad, 90, 2, ':');
  g.rect(100, 50, 3, 2, ':'); // the outflow deck proper (3-wide, re-carved over the water)

  const propsRaw: PropDef[] = [
    // the frozen core's props stay verbatim (the byte-identical core test). The
    // old bus SIGN keeps its corner but now just POINTS to the new Transit Depot
    // (a redirect sign is appended below); the depot is the real stop.
    ...core.props,
    // DOWNTOWN's catalog faces (appended post-core so the living-city door
    // graft never touches a core-array prop): the cafe west of the junction,
    // the shop between the drugstore's parking curb and the depot, and the
    // brownstone east of the square. Never 2-same-adjacent.
    { sprite: 'bldg_gen_cafe_orange_1', x: 59.4, y: 44, solid: { ox: 0, oy: 10, w: 66, h: 38 } },
    { sprite: 'bldg_gen_shop_red_1', x: 70.3, y: 44, solid: { ox: 0, oy: 10, w: 66, h: 38 } },
    { sprite: 'bldg_gen_brownstone_earth_3', x: 78, y: 56.6, solid: { ox: 0, oy: 10, w: 66, h: 38 } },
    busDepot,
    downtownEntry,
    { sprite: 'bench', x: 75.6, y: 48.55, solid: { ox: 1, oy: 6, w: 20, h: 6 } }, // the depot's boarding bench
    { sprite: 'trash_can', x: 78.3, y: 48.55, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
    { sprite: 'sign', x: 84, y: 59, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // "→ DOWNTOWN" (the Main & Vine mouth)
    ...creeksideBldgs,
    ...hollowHomes,
    ...creeksideProps,
    ...mapleHomes,
    mapleGrocery,
    ...mapleProps,
    ...thicketProps,
    ...woodsGift.props,
    ...porchCan.props,
    ...hubcap.props,
    { sprite: 'sign', x: 4, y: 84, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // the woods trailhead marker
    cityHall,
    { sprite: 'sign', x: 26, y: 64, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // City Hall plaque
    station,
    { sprite: 'sign', x: 33, y: 64, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // STATION plaque
    // civic forecourt furniture — the flagpole centers between the two doors,
    // planters flank outward, one bench on the court's south edge
    { sprite: 'flagpole', x: 26.7, y: 63.3, solid: { ox: 6, oy: 6, w: 6, h: 6 } },
    { sprite: 'planter', x: 18.6, y: 63.3, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'planter', x: 34.4, y: 63.3, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'bench', x: 25.8, y: 64.35, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    // the GAZEBO green — bandstand + 3 benches facing it
    { sprite: 'gazebo', x: 18.5, y: 71.7, solid: { ox: 4, oy: 34, w: 48, h: 18 } },
    { sprite: 'bench', x: 17.7, y: 76.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: 21.2, y: 76.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: 19.4, y: 70.35, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'sign', x: 16, y: 70, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ...treesAt([[17, 70], [27, 71], [17, 77], [26, 77]]),
    // the Pond Park's rests + shade
    { sprite: 'picnic', x: 95, y: 48.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    { sprite: 'picnic', x: 107, y: 45.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    { sprite: 'sign', x: 101, y: 49, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    { sprite: 'bench', x: 108, y: 41.45, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ...treesAt([[97, 51], [108, 51]]),
    // cattails on the pond's verges (off the walk ring)
    ...[[98.3, 41.6], [104.6, 41.4], [98.2, 46.4], [104.7, 46.5], [97.6, 44.4], [105.4, 44.4]].map(([x, y]) => ({
      sprite: 'cattails', x, y,
    })),
    // (deck rails retired 2026-07-02 — they lay ACROSS the walk line at both
    // crossings and read as barriers; the solid water guards the decks itself)
    // ADR-121: THE HEART OAK — the great tree on the pond's north knoll, and
    // the torn BURROW MOUTH beside it (drawn over the door tiles; the Tick
    // waits at the bottom of the Under-Oak now).
    { sprite: 'tree_c', x: 101, y: 40, solid: OAK },
    { sprite: 'burrow_mouth', x: 100.3, y: 38.3 },
    // EAST-GATE road dressing: poles on the shoulder, the gate cluster
    ...[112.875, 118.875].map((x) => ({ sprite: 'phone_pole', x, y: 49.375 })),
    { sprite: 'sign', x: 120, y: 49, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    // S15i Task 0 + ADR-121 — THE DAYBREAK GATE barricade (comes down when the
    // Tick dies; the door itself is also gated in OverworldScene.checkDoors)
    { sprite: 'sawhorse', x: 121, y: 50, solid: { ox: 0, oy: 2, w: 36, h: 26 }, unlessFlag: 'tick_defeated' },
    ...orchardTrees,
    ...orchardProps,
    // BELT-FACE TREE RANKS — double canopy rows along every forest belt face,
    // so each clearing reads walled-in and the next zone stays hidden.
    ...rankTrees,
  ];

  // Same path-guard as the core (buildOtterbrook): drop any grown tree/bush
  // that landed on a ':' street tile or open water — the brook + its bridges
  // repaint a lot of ground here, so this guard matters more than ever. Core
  // trees are already path-clean (filtered in build), so this only trims
  // grown additions and the frozen-core prefix stays byte-identical.
  const ON_PATH = new Set([':', 'R', 'D', 'X', 'e', 'E', '=', 'p', 'P', '3', 'T', '^', 'K']);
  const TREE_SPRITE = /^(tree|tree_b|tree_c|pine|bush)$/;
  const props: PropDef[] = propsRaw.filter(
    (p) => !(TREE_SPRITE.test(p.sprite) && ON_PATH.has(g.rows[Math.round(p.y)]?.[Math.round(p.x)] ?? '.')),
  );

  const npcs = [
    ...core.npcs,
    { id: 'green_keeper', sprite: 'fernLady', x: 20, y: 73, facing: 'down' as const, dialogue: 'npc_green_keeper', wander: true },
    { id: 'pond_angler', sprite: 'quarterMan', x: 97, y: 44, facing: 'right' as const, dialogue: 'npc_pond_angler', idle: true, emote: 'think' as const }, // Wave 2 (#4): pondering the still water
    { id: 'south_neighbor', sprite: 'senora', x: 64, y: 73, facing: 'down' as const, dialogue: 'npc_south_neighbor', wander: true }, // on the Maple Ct loop
    // S15i (ADR-054): the woods nook's resident obsessive (§A11) — a birdwatcher
    // at the thicket trailhead, who has Opinions about the new picnic spot
    { id: 'woods_birder', sprite: 'oldTimer', x: 5, y: 85, facing: 'down' as const, dialogue: 'npc_woods_birder', idle: true, emote: 'happy' as const }, // Wave 2 (#4): delighted by the birds
    { id: 'gate_walker', sprite: 'grayCommuter', x: 114, y: 50, facing: 'right' as const, dialogue: 'npc_gate_walker', dialogueDay: 'npc_gate_walker_day', wander: true },
    // S15i Task 0: the treeline gawker — at 2 AM he points you up the hill and
    // refuses to go himself; at daybreak (dialogueDay) he's seen the crater and
    // warns of the blocked road east. Stands by the hill gap, never wanders off it.
    { id: 'treeline_gawker', sprite: 'pigeonKid', x: 23, y: 4, facing: 'up' as const, dialogue: 'npc_treeline_gawker', dialogueDay: 'npc_treeline_gawker_day', idle: true, emote: 'surprise' as const }, // Wave 2 (#4): rattled by the crater up the hill
    // S22 (ADR-114): the depot comes ALIVE at daybreak — two commuters at the
    // curb (gated on zapper_done so the 2 AM opening stays eerily empty)
    { id: 'bus_waiter1', sprite: 'grayCommuter', x: 76, y: 49, facing: 'left' as const, dialogue: 'npc_bus_waiter1', idle: true, emote: 'think' as const, ifFlag: 'zapper_done' },
    { id: 'bus_waiter2', sprite: 'senora', x: 73, y: 49, facing: 'up' as const, dialogue: 'npc_bus_waiter2', idle: true, emote: 'idle' as const, ifFlag: 'zapper_done' },
    // S22 (ADR-115): the tycoon TEASERS on the civic lane — you can SEE the home +
    // car you'll someday afford. Both open at daybreak (zapper_done).
    { id: 'realtor_otter', sprite: 'npc_realtor', x: 38, y: 67, facing: 'up' as const, dialogue: 'npc_realtor', idle: true, ifFlag: 'zapper_done' },
    { id: 'car_dealer_otter', sprite: 'quarterMan', x: 36, y: 67, facing: 'up' as const, dialogue: 'npc_car_dealer', idle: true, emote: 'happy' as const, ifFlag: 'zapper_done' },
    // S22 (ADR-118 rework): Constable Borden works the "hill vandalism" frame-up
    // out of the new STATION HOUSE by daybreak. He RUNS you down on sight (no need
    // to talk to him) and marches you into the holding cell — an OPTIONAL cop fight
    // that clears Chad's frame-up (never a wall). After he's cleared he stays on the
    // lane as a friendly (talk → npc_borden_done). Chase + beats: OverworldScene.
    { id: 'constable_borden', sprite: 'npc_borden', x: 30, y: 67, facing: 'up' as const, dialogue: 'npc_borden_accuse', idle: true, emote: 'surprise' as const, ifFlag: 'zapper_done', unlessFlag: 'borden_marching' },
  ];

  const signs = [
    ...core.signs,
    { x: 26, y: 64, dialogue: 'sign_otter_hall' },
    { x: 16, y: 70, dialogue: 'sign_civic_green' },
    { x: 101, y: 49, dialogue: 'sign_pond_park' },
    // the burrow's warning marker, read from the knoll beside the oak
    { x: 98, y: 40, dialogue: 'sign_oak_burrow' },
    { x: 120, y: 49, dialogue: 'sign_meadow_gate' },
    // S15i Task 0: the closed-gate notice, read at the barricade until daybreak
    { x: 118, y: 51, dialogue: 'sign_meadow_gate_closed', unlessFlag: 'zapper_done' },
    // S15i Task 1: the woods nook trailhead
    { x: 4, y: 84, dialogue: 'sign_otter_woods' },
    // (sign_bus_moved retired with the old stop — the depot is ON the drag)
    // S22 (ADR-116): the downtown street mouth, off the square's east flank
    { x: 84, y: 59, dialogue: 'sign_to_downtown' },
    ...woodsGift.signs, // ADR-056: the glade present (sign while sealed, flavor after)
    ...porchCan.signs, // ADR-063 Part B: THE PORCH SET coffee can
    ...hubcap.signs, // ADR-063 Part B: the Spare Hubcap ("worth more to a man named Earl")
  ];

  return {
    ...core,
    grid: g.out(),
    props,
    npcs,
    signs,
    doors: [
      ...core.doors,
      // THE EXPORTED EAST STUB → MEADOW MILE (Movement 2). The core's doors stay
      // first + unchanged (the byte-identical test); growth only APPENDS.
      { x: W - 1, y: OTTERBROOK_EAST_GATE.y, w: 1, h: 2, to: 'meadow_mile', tx: 24, ty: 128, facing: 'right', indicator: 'none' },
      // THE UNDER-OAK BURROW (ADR-121 rework): the torn root-mouth beside the
      // Heart Oak — the directed way DOWN to the Titanic Tick.
      { x: 100, y: 39, w: 3, h: 1, to: 'oak_roots', tx: 14 * 16 + 8, ty: 38 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      ...core.spawners,
      // the woken town's danger reaches the new south field too (gated like the
      // core's), seated well clear of every door/phone/sign (pressure ≥24px)
      { enemies: ['cranky_mailbox', 'skeeter_swarm'], count: 1, rect: { x: 64, y: 76, w: 8, h: 3 }, ifFlag: 'meteor_fell' },
    ],
    // triggers stay byte-identical to the frozen core (the world_block test pins
    // grown.triggers === core.triggers). The old center bus_stop becomes a ONE-TIME
    // redirect to the new Depot (handled in OverworldScene); real boarding moves
    // INSIDE the depot's waiting room (an interior `depot_board` trigger).
  };
}

/**
 * OTTERBROOK CITY HALL — the civic interior the human authors (Prime Law 1).
 * A warm wood lobby: the clerk's counter, the Mayor at her desk, a notice
 * board, and a payphone to save. The bottom door rides back to the jittered
 * facade's doorstep (computed, never hardcoded — the dos_f1 / S4 pattern).
 */
function buildOtterbrookCityHallInt(streetExit: { tx: number; ty: number }): MapDef {
  // 2026-07-02 (user direction): a REAL municipal building — three rooms off
  // one lobby. WEST: the records room (shelves, the town's one photocopier,
  // boxes of zoning). CENTER: the lobby, a civic rug running to the clerk's
  // counter, the save payphone. EAST: the Mayor's office (her desk, the town
  // flag, a window planter, a visitor chair she never lets anyone move).
  const g = new Grid(26, 16, 'w');
  g.rect(0, 0, 26, 2, 'W'); // back wall
  g.rect(8, 2, 1, 9, 'W'); g.set(8, 7, 'w'); // west partition, doorway mid-wall
  g.rect(17, 2, 1, 9, 'W'); g.set(17, 7, 'w'); // east partition, doorway mid-wall
  g.rect(11, 4, 4, 1, 'r'); // the civic rug runs to the counter
  g.rect(11, 5, 4, 1, 'r');
  return {
    id: 'otterbrook_cityhall',
    name: 'OTTERBROOK CITY HALL',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // THE LOBBY — clerk's counter + the notice board + the save phone
      { sprite: 'counter', x: 11, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 13, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'payphone', x: 9.5, y: 12, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'prop_waiting_bench', x: 14.5, y: 12.4, solid: { ox: 1, oy: 8, w: 30, h: 8 } },
      { sprite: 'planter', x: 12.5, y: 9.6, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      // THE RECORDS ROOM (west) — the town's paper memory + its one copier
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 4, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 1, y: 5.4, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'copier', x: 5.5, y: 8.6, solid: { ox: 1, oy: 8, w: 22, h: 12 } },
      { sprite: 'crate', x: 1.4, y: 9.4, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      { sprite: 'crate', x: 2.8, y: 9.7, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      // THE MAYOR'S OFFICE (east) — desk, flag, and the immovable chair
      { sprite: 'desk', x: 20, y: 4, solid: { ox: 0, oy: 8, w: 20, h: 12 } },
      { sprite: 'flagpole', x: 24, y: 2.4, solid: { ox: 6, oy: 6, w: 6, h: 6 } },
      { sprite: 'shelf_b', x: 18.5, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'planter', x: 23.5, y: 9.4, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      { sprite: 'floor_lamp', x: 18.6, y: 9.4, solid: { ox: 3, oy: 12, w: 8, h: 8 } },
    ],
    npcs: [
      { id: 'hall_clerk', sprite: 'fernLady', x: 12, y: 2, facing: 'down', dialogue: 'npc_hall_clerk' },
      { id: 'mayor_otter', sprite: 'oldTimer', x: 21, y: 6, facing: 'left', dialogue: 'npc_mayor_otter' },
    ],
    signs: [{ x: 10, y: 1, dialogue: 'sign_hall_wall' }],
    phones: [{ x: 10, y: 12 }],
    doors: [
      { x: 12, y: 15, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/**
 * THE OTTERBROOK STATION HOUSE — the little brick P.D.'s one room: a booking
 * desk, the case files, and a single holding CELL in the back-right corner (a
 * cot, a walled-off front with a barred doorway). Walked in off the civic lane
 * it's a quiet station; but when Constable Borden MARCHES you in (flag
 * `borden_marching`) you spawn INSIDE the cell and he books you — the cop fight
 * fires here (OverworldScene.bordenCellBeat). The bottom door rides back to the
 * jittered facade's doorstep (computed via doorstepOf — the dos_f1 pattern).
 */
function buildOtterStationInt(streetExit: { tx: number; ty: number }): MapDef {
  // 2026-07-02 (user direction): the P.D. grows into a real little station —
  // the BOOKING HALL (desk, case files, a bench nobody enjoys), the HOLDING
  // CELL kept byte-stable at its original tiles (OTTER_CELL still lands at
  // native 200,56 — the Borden march spawn), and an EAST WING: Borden's
  // office up top, the EVIDENCE/RECORDS room below it.
  const g = new Grid(24, 16, 'w');
  g.rect(0, 0, 24, 2, 'W'); // back wall
  // the HOLDING CELL — unchanged geometry (west wall col 10 rows 2-6, front
  // rail row 6 cols 11-15, barred gap at 13,6) + an east wall so the cell
  // stays a cell now that the building continues past it.
  g.rect(10, 2, 1, 5, 'W');
  g.rect(11, 6, 5, 1, 'W');
  g.set(13, 6, 'w');
  g.rect(16, 2, 1, 5, 'W'); // the cell's east wall
  // the EAST WING partition + its two rooms
  g.rect(16, 7, 1, 7, 'W'); g.set(16, 10, 'w'); // wing wall, doorway at 16,10
  g.rect(17, 8, 7, 1, 'W'); g.set(20, 8, 'w'); // office/records split, doorway at 20,8
  return {
    id: 'otter_station',
    name: 'OTTERBROOK STATION',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // THE BOOKING HALL
      { sprite: 'counter', x: 3, y: 4, solid: { ox: 0, oy: 4, w: 30, h: 14 } }, // the booking desk
      { sprite: 'counter', x: 5, y: 4, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } }, // case files
      { sprite: 'prop_waiting_bench', x: 2.5, y: 10.4, solid: { ox: 1, oy: 8, w: 30, h: 8 } },
      { sprite: 'water_cooler', x: 8.6, y: 8.2, solid: { ox: 2, oy: 10, w: 8, h: 8 } },
      { sprite: 'planter', x: 7, y: 12.6, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
      { sprite: 'cot', x: 11, y: 2, solid: { ox: 1, oy: 12, w: 18, h: 10 } }, // the cell bunk
      // BORDEN'S OFFICE (wing, top) — the desk where the book lives
      { sprite: 'desk', x: 18, y: 3.6, solid: { ox: 0, oy: 8, w: 20, h: 12 } },
      { sprite: 'chalk_board', x: 21.5, y: 2, solid: { ox: 0, oy: 10, w: 26, h: 10 } }, // the "case" board
      { sprite: 'floor_lamp', x: 17.4, y: 2.2, solid: { ox: 3, oy: 12, w: 8, h: 8 } },
      // EVIDENCE / RECORDS (wing, bottom)
      { sprite: 'prop_lockbox_counter', x: 17.5, y: 9.6, solid: { ox: 1, oy: 10, w: 34, h: 12 } },
      { sprite: 'shelf_b', x: 21, y: 9.4, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'crate', x: 18, y: 13.2, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
      { sprite: 'crate', x: 19.6, y: 13.5, solid: { ox: 1, oy: 8, w: 18, h: 10 } },
    ],
    npcs: [
      // Borden books you in the cell — present only while he's marched you in
      { id: 'borden_cell', sprite: 'npc_borden', x: 14, y: 3, facing: 'down', dialogue: 'npc_borden_holding', ifFlag: 'borden_marching', unlessFlag: 'borden_cleared' },
    ],
    signs: [{ x: 4, y: 1, dialogue: 'sign_station_wall' }],
    phones: [],
    doors: [
      { x: 11, y: 15, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------- THE LONG WALK — Otterbrook → Brickton on foot (S15i M3, ADR-056) ------------- *
 * The single MEADOW MILE screen grows into a real multi-screen journey (the user's
 * "deepen the world" decree): town park → woods → second meadow → overpass → the
 * city. Four legs, each its own feel, wired with COMPUTED leg doors — every door
 * lands on its neighbour's ACTUAL trail entry, read off the draft grid (never a
 * hardcoded jittered coord; the ADR-012 route discipline). The §A7 band escalates
 * Ch.1 → Ch.1.5 as you near Brickton; a rest (payphone + picnic) sits at each leg's
 * WEST mouth, BEFORE its hot middle (§B4). Two cutscene beats are flag-gated (a
 * roadside vignette in the woods, the "you can see the city now" reveal on the
 * overpass). The METEOR ROADBLOCK stays on its leg (meadow_mile, the Hickory-Hill-
 * adjacent meadow). THE ORIENTATION GATE + the grandfather clause (badge OR bus)
 * move to the overpass — the city line. Hidden presents hide along the way (the
 * S9b gift-box pattern). The "town park" the journey opens at is grown Otterbrook's
 * POND PARK (already shipped, §A4.5 rests on the bank).
 */

const WALK_PHONE_SOLID = { ox: 1, oy: 10, w: 14, h: 16 } as const;
const WALK_PICNIC_SOLID = { ox: 2, oy: 8, w: 32, h: 14 } as const;
const WALK_SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 } as const;
const WALK_GIFT_SOLID = { ox: 1, oy: 7, w: 12, h: 6 } as const;

/** the trail row (':') at a column — the entry a neighbour's door must land on,
 *  computed off the draft grid (ADR-012: jittered cross-map coords are derived) */
function trailRowAt(grid: string[], col: number): number {
  for (let y = 0; y < grid.length - 1; y++) if (grid[y][col] === ':') return y;
  return Math.round(grid.length / 2);
}

/** a hidden present: the closed box + its sign while sealed, the opened box + a
 *  flavor line after. `flag` is the open-state flag; OverworldScene.signBeat maps
 *  `flag` → the granted item (the S9b gift-box pattern, gated props). */
function walkPresent(flag: string, x: number, y: number): { props: PropDef[]; signs: SignDef[] } {
  return {
    props: [
      { sprite: 'gift_box', x, y, solid: WALK_GIFT_SOLID, unlessFlag: flag },
      { sprite: 'gift_box_open', x, y, solid: WALK_GIFT_SOLID, ifFlag: flag },
    ],
    signs: [
      { x, y: y + 1, dialogue: flag, unlessFlag: flag },
      { x, y: y + 1, dialogue: `${flag}_done`, ifFlag: flag },
    ],
  };
}

/** drop any TREE prop whose tile falls inside `box` — so a fixture (rest, present,
 *  door mouth) placed there stays reachable in-game (the grid BFS ignores prop
 *  solids, but trees DO collide; clear them or the reward is walled off) */
function clearTreesIn(props: PropDef[], box: { x: number; y: number; w: number; h: number }): PropDef[] {
  const isTree = (s: string): boolean => s === 'tree' || s === 'tree_b' || s === 'tree_c' || s === 'pine';
  return props.filter((p) => {
    const px = Math.round(p.x);
    const py = Math.round(p.y);
    return !(isTree(p.sprite) && px >= box.x && px < box.x + box.w && py >= box.y && py < box.y + box.h);
  });
}

/** LEG 1 — MEADOW MILE: the meadow just east of town, carrying the Task-0 meteor
 *  roadblock (a Hickory Hill chunk). Otterbrook's east gate lands here; the east
 *  edge is now a plain door onward to the woods. The gentlest §A7 band (near town). */
function buildMeadowMile(): MapDef {
  const draft = buildRoute({
    kind: 'route', id: 'meadow_mile', seed: 1500, size: [40, 16],
    style: 'treeline', encounterBand: 'ch1', signSlots: 2, ends: ['otterbrook', 'meadow_woods'],
  });
  const W = draft.grid[0].length;
  const H = draft.grid.length;
  const westY = draft.doors[0]?.y ?? Math.round(H / 2);
  const eastY = draft.doors[1]?.y ?? Math.round(H / 2);
  const traveler: NpcDef = { id: 'road_traveler', sprite: 'grayCommuter', x: 6, y: westY, facing: 'right', dialogue: 'npc_road_traveler', wander: true };

  // Task 0 — THE METEOR-DROP ROADBLOCK, kept on its leg: a chunk in the UPPER lane,
  // sawhorsed off; the lower lane stays walkable (you squeeze past — sweep-proven).
  const blockX = Math.round(W * 0.5);
  const tBlock = trailRowAt(draft.grid, blockX);
  const workerX = Math.max(2, blockX - 3);
  const tWorker = trailRowAt(draft.grid, workerX);
  const roadblock: PropDef[] = [
    { sprite: 'meteor_rock', x: blockX - 1, y: tBlock - 1, solid: { ox: 2, oy: 16, w: 30, h: 16 } },
    { sprite: 'sawhorse', x: blockX + 1, y: tBlock - 1, solid: { ox: 0, oy: 14, w: 30, h: 14 } },
  ];
  const worker: NpcDef = { id: 'roadblock_worker', sprite: 'quarterMan', x: workerX, y: tWorker, facing: 'right', dialogue: 'npc_roadblock_worker' };

  return {
    id: 'meadow_mile',
    name: 'MEADOW MILE',
    music: 'otterbrook',
    grid: draft.grid,
    props: [
      ...draft.props,
      { sprite: 'sign', x: W - 6, y: Math.max(1, eastY - 2), solid: WALK_SIGN_SOLID }, // → the woods
      ...roadblock,
      { sprite: 'sign', x: workerX, y: Math.max(1, tWorker - 1), solid: WALK_SIGN_SOLID }, // the ROAD WORK notice
    ],
    npcs: [traveler, worker],
    signs: [
      ...draft.signs,
      { x: W - 6, y: Math.max(1, eastY - 2), dialogue: 'sign_to_whisperwood' },
      { x: workerX, y: Math.max(1, tWorker - 1), dialogue: 'sign_roadblock' },
    ],
    phones: draft.phones,
    doors: [
      // west → Otterbrook's exported east gate (computed); east → the woods (the
      // coordinator rewrites tx/ty to the woods' real west entry below)
      { x: 0, y: westY, w: 1, h: 2, to: 'otterbrook', tx: OTTERBROOK_EAST_GATE.x * 16, ty: OTTERBROOK_EAST_GATE.y * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_woods', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: draft.spawners,
    // S15i Task 3 (ADR-058): THE WALKERS' REGISTER token — a strip just east of Hal
    // (you cross it walking on into the city; fires only while the quest is live)
    triggers: [{ id: 'walk_token', rect: { x: Math.round(W * 0.32), y: 0, w: 2, h: H }, once: false }],
  };
}

/** LEG 2 — WHISPERWOOD: buildWoods fills a forest around a winding clearing path;
 *  the rests, the glade present, the doors, the spawner + the roadside-vignette
 *  trigger are grafted on. Trees are FILTERED out of every fixture's tile so the
 *  whole leg stays reachable in-game. A slightly tougher §A7 band. */
function buildMeadowWoods(): MapDef {
  const W = 36;
  const H = 16;
  const S = new Streams(1510);
  const g = new Grid(W, H, '.');
  g.sprinkle(151001, ',~bb~ f', 0.16);
  const woods = buildWoods(g, { x: 0, y: 0, w: W, h: H }, S, { pines: true, density: 0.34 });
  const grid = g.out();
  const westY = trailRowAt(grid, 0);
  const eastY = trailRowAt(grid, W - 1);
  const gladeX = Math.round(W / 2);
  const gladeY = trailRowAt(grid, gladeX);

  // clear the rest mouth, the glade present, and both door mouths of trees so
  // every fixture is reachable from the cleared path corridor
  let trees = woods.props;
  for (const box of [
    { x: 0, y: westY - 2, w: 5, h: 5 }, // the west rest clearing
    { x: gladeX - 2, y: gladeY - 1, w: 4, h: 4 }, // the glade present
    { x: W - 3, y: eastY - 2, w: 3, h: 5 }, // the east mouth
  ]) {
    trees = clearTreesIn(trees, box);
  }

  // clearTreesIn only removes tree PROPS — but g.sprinkle can paint a SOLID bush
  // ('b') onto the WEST door-mouth GRID, wedging the player who arrives here from
  // meadow_mile (the landing is tile (1, westY), tx:16). Strip any solid bush from
  // the mouth so the entry is always walkable, never seed-luck (the trail ':' and
  // grass decor are left intact).
  for (let yy = Math.max(0, westY - 1); yy <= Math.min(H - 1, westY + 2); yy++) {
    const row = grid[yy].split('');
    for (let xx = 0; xx <= 2; xx++) if (row[xx] === 'b') row[xx] = '.';
    grid[yy] = row.join('');
  }

  const gift = walkPresent('meadow_gift_woods', gladeX - 1, gladeY);
  return {
    id: 'meadow_woods',
    name: 'WHISPERWOOD',
    music: 'otterbrook',
    grid,
    props: [
      ...trees,
      { sprite: 'payphone', x: 2, y: westY + 2, solid: WALK_PHONE_SOLID },
      { sprite: 'picnic', x: 3, y: Math.max(1, westY - 2), solid: WALK_PICNIC_SOLID },
      { sprite: 'sign', x: 5, y: Math.max(1, westY - 2), solid: WALK_SIGN_SOLID },
      ...gift.props,
    ],
    npcs: [],
    signs: [{ x: 5, y: Math.max(1, westY - 2), dialogue: 'sign_whisperwood' }, ...gift.signs],
    phones: [{ x: 2, y: westY + 2 }],
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_mile', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_far', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['hill_slug_deluxe', 'coily_cicada', 'recycling_raccoon'], count: 2, rect: { x: Math.round(W / 3), y: 2, w: Math.round(W / 3), h: H - 4 } },
    ],
    triggers: [
      { id: 'woods_vignette', rect: { x: 1, y: 0, w: 3, h: H }, once: false },
      // Task 3 (ADR-058): the WALKERS' REGISTER token, at the glade (what the quiet leaves)
      { id: 'walk_token', rect: { x: gladeX - 1, y: 0, w: 2, h: H }, once: false },
    ],
  };
}

/** LEG 3 — THE FAR MEADOW: the open stretch before the city edge, an off-trail
 *  present (the salt-shaker callback) and a tougher §A7 band (mower + pigeons). */
function buildMeadowFar(): MapDef {
  const draft = buildRoute({
    kind: 'route', id: 'meadow_far', seed: 1520, size: [38, 16],
    style: 'treeline', encounterBand: 'ch1', signSlots: 1, ends: ['meadow_woods', 'meadow_overpass'],
  });
  const W = draft.grid[0].length;
  const H = draft.grid.length;
  const westY = draft.doors[0]?.y ?? Math.round(H / 2);
  const eastY = draft.doors[1]?.y ?? Math.round(H / 2);
  const giftX = Math.round(W * 0.62);
  const giftY = Math.max(2, trailRowAt(draft.grid, giftX) - 3);
  const gift = walkPresent('meadow_gift_far', giftX, giftY);
  const props = clearTreesIn(draft.props, { x: giftX - 1, y: giftY - 1, w: 3, h: 3 });

  return {
    id: 'meadow_far',
    name: 'THE FAR MEADOW',
    music: 'otterbrook',
    grid: draft.grid,
    props: [...props, ...gift.props],
    npcs: [{ id: 'far_walker', sprite: 'pajamaKid', x: 5, y: westY, facing: 'right', dialogue: 'npc_far_walker', wander: true }],
    signs: [...draft.signs, ...gift.signs],
    phones: draft.phones,
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_woods', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_overpass', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: draft.spawners.map((s) => ({ ...s, enemies: ['runaway_lawnmower', 'pigeon_gang', 'skeeter_swarm'] })),
    // Task 3 (ADR-058): the WALKERS' REGISTER token (where the air goes electric)
    triggers: [{ id: 'walk_token', rect: { x: Math.round(W * 0.4), y: 0, w: 2, h: H }, once: false }],
  };
}

/** LEG 4 — THE OVERPASS: the city line. THE ORIENTATION GATE (three proctors +
 *  the east-edge trigger, grandfather clause intact) and the "you can see the city
 *  now" reveal live here. The toughest pre-city §A7 band (pigeons + smilers). */
function buildMeadowOverpass(): MapDef {
  const draft = buildRoute({
    kind: 'route', id: 'meadow_overpass', seed: 1530, size: [34, 16],
    style: 'fenced', encounterBand: 'ch1', signSlots: 1, ends: ['meadow_far', 'brickton'],
  });
  const W = draft.grid[0].length;
  const H = draft.grid.length;
  const westY = draft.doors[0]?.y ?? Math.round(H / 2);
  const eastY = draft.doors[1]?.y ?? Math.round(H / 2);
  const proctors: NpcDef[] = [
    { id: 'proctor_a', sprite: 'smilerB', x: W - 5, y: Math.max(2, eastY - 1), facing: 'left', dialogue: 'npc_proctor', unlessFlag: 'visitor_badge' },
    { id: 'proctor_b', sprite: 'smilerB', x: W - 4, y: eastY + 1, facing: 'left', dialogue: 'npc_proctor', unlessFlag: 'visitor_badge' },
    { id: 'proctor_c', sprite: 'smilerB', x: W - 6, y: eastY + 2, facing: 'left', dialogue: 'npc_proctor', unlessFlag: 'visitor_badge' },
  ];
  // S15i Task 3 (ADR-058): THE WALKERS' REGISTER post — Old Pell's ledger on a
  // post, mid-overpass and OFF the trail (computed so it never blocks the lane);
  // signing it completes Ch.1 #5 (handled in OverworldScene.signBeat).
  const regX = Math.round(W * 0.45);
  const regTrail = trailRowAt(draft.grid, regX);
  const regY = regTrail + 2 <= H - 2 ? regTrail + 2 : Math.max(1, regTrail - 2);

  return {
    id: 'meadow_overpass',
    name: 'THE OVERPASS',
    music: 'otterbrook',
    grid: draft.grid,
    props: [
      ...draft.props,
      { sprite: 'sign', x: W - 6, y: Math.max(1, eastY - 2), solid: WALK_SIGN_SOLID }, // BRICKTON CITY LIMITS
      { sprite: 'sign', x: regX, y: regY, solid: WALK_SIGN_SOLID }, // the Walkers' Register post
    ],
    npcs: [...proctors],
    signs: [
      ...draft.signs,
      { x: W - 6, y: Math.max(1, eastY - 2), dialogue: 'sign_overpass_gate' },
      { x: regX, y: regY, dialogue: 'walkers_register_book' },
    ],
    phones: draft.phones,
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_far', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
    ],
    spawners: draft.spawners.map((s) => ({ ...s, enemies: ['pigeon_gang', 'blazer_smiler', 'good_investment'] })),
    triggers: [
      // the "you can see the city now" reveal — on entry from the far meadow (west)
      { id: 'city_reveal', rect: { x: 1, y: 0, w: 3, h: H }, once: false },
      // THE ORIENTATION GATE — the east edge IS the city line; the gate runs the
      // proctor exercises → visitor_badge, or walks you straight in on badge/bus
      { id: 'orientation_gate', rect: { x: W - 3, y: 0, w: 3, h: H }, once: false },
    ],
  };
}

/** THE LONG WALK — build all four legs and wire their COMPUTED inter-leg doors:
 *  every door's tx/ty is overwritten to land on the neighbour's REAL trail entry
 *  (read off the draft), never a hardcoded coordinate (the ADR-012 discipline). */
function buildLongWalk(): { meadow_mile: MapDef; meadow_woods: MapDef; meadow_far: MapDef; meadow_overpass: MapDef } {
  const meadow_mile = buildMeadowMile();
  const meadow_woods = buildMeadowWoods();
  const meadow_far = buildMeadowFar();
  const meadow_overpass = buildMeadowOverpass();

  // each leg's real west/east entry (the trail row at its first/last column)
  const entry = (m: MapDef): { W: number; westY: number; eastY: number } => {
    const W = m.grid[0].length;
    return { W, westY: trailRowAt(m.grid, 0), eastY: trailRowAt(m.grid, W - 1) };
  };
  const e = { mile: entry(meadow_mile), woods: entry(meadow_woods), far: entry(meadow_far), op: entry(meadow_overpass) };
  // land an EAST→neighbour door at the neighbour's WEST mouth (tile 1); a
  // WEST→neighbour door at the neighbour's EAST mouth (tile W-2)
  const aim = (m: MapDef, to: string, tx: number, ty: number): void => {
    const d = m.doors.find((x) => x.to === to);
    if (d) { d.tx = tx; d.ty = ty; }
  };
  aim(meadow_mile, 'meadow_woods', 16, e.woods.westY * 16);
  aim(meadow_woods, 'meadow_mile', (e.mile.W - 2) * 16, e.mile.eastY * 16);
  aim(meadow_woods, 'meadow_far', 16, e.far.westY * 16);
  aim(meadow_far, 'meadow_woods', (e.woods.W - 2) * 16, e.woods.eastY * 16);
  aim(meadow_far, 'meadow_overpass', 16, e.op.westY * 16);
  aim(meadow_overpass, 'meadow_far', (e.far.W - 2) * 16, e.far.eastY * 16);
  return { meadow_mile, meadow_woods, meadow_far, meadow_overpass };
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
  // THE ROAD (EB blueprint): the ':' snake becomes a real 3-wide `R` asphalt
  // road, SAME switchback topology (town mouth → home lane → west climb →
  // east climb → summit) but climbing 4 distinct elevations via 3 terrace
  // bands (`^` lip + `K` cliff), each crossed by a 3-wide `T` stair at the
  // turn. Corridors widened from 2-wide to 3-wide throughout for the stairs.
  // THE ROAD WINDS (hand-authored center tables — a graded country road, not
  // a ruler): mouth stub → curving home lane → west climb through band 1's
  // cut → curving mid shelf → east climb through band 2's cut → curving
  // upper shelf → the straight crest stub through band 3's cut.
  g.rect(13, 28, 4, 6, 'R'); // south mouth stub (door-pinned width)
  windH(g, [27, 27, 26, 26, 26, 27, 27, 27, 26, 26, 27, 27, 27, 26, 26, 26, 27, 27, 27, 26, 26, 27], 4, 2, 'R'); // home lane
  windV(g, [4, 5, 5, 4, 4, 4, 4, 4], 18, 3, 'R'); // west climb (band 1's cut at y23-24, center 4)
  windH(g, [19, 19, 18, 18, 18, 19, 19, 19, 18, 18, 19, 19, 18, 18, 19, 19, 19, 19, 19, 19], 4, 2, 'R'); // mid shelf
  windV(g, [22, 22, 23, 22, 21, 22, 22, 22], 10, 3, 'R'); // east climb (band 2's cut at y15-16, center 22)
  windH(g, [11, 11, 10, 10, 11, 11, 11, 10, 10, 11, 11, 11, 11], 11, 2, 'R'); // upper shelf
  g.rect(13, 0, 4, 10, 'R'); // north stub → the crest (band 3's cut sits on it)
  g.rect(14, 1, 1, 6, 'D'); g.rect(14, 29, 1, 4, 'D'); // dashes only on the straight stubs

  // ---- THE 3 TERRACE BANDS: `^` lip (upper level) over `K` cliff (1 row).
  // The road passes each band through a ROAD CUT — the band skips the climb's
  // columns and the asphalt runs straight through the rock (a graded road,
  // not stairs; the K walls themselves flank the cut).
  // Band 1 — home lane (bottom) → the mid shelf; cut at the WEST climb (x3-5).
  g.rect(0, 23, 3, 1, '^'); g.rect(6, 23, 24, 1, '^');
  g.rect(0, 24, 3, 1, 'K'); g.rect(6, 24, 24, 1, 'K');
  g.rect(3, 23, 3, 2, 'R');
  // Band 2 — mid shelf → upper shelf; cut at the EAST climb (x21-23).
  g.rect(0, 15, 21, 1, '^'); g.rect(24, 15, 6, 1, '^');
  g.rect(0, 16, 21, 1, 'K'); g.rect(24, 16, 6, 1, 'K');
  g.rect(21, 15, 3, 2, 'R');
  // Band 3 — upper shelf → the crest; cut at the NORTH stub (x13-16, 4-wide),
  // matching HICKORY_TRAIL's own south-mouth pin above it.
  g.rect(0, 8, 13, 1, '^'); g.rect(17, 8, 13, 1, '^');
  g.rect(0, 9, 13, 1, 'K'); g.rect(17, 9, 13, 1, 'K');
  g.rect(13, 8, 4, 2, 'R');

  // (guardrail PROPS dress the shelf edges — no fence-tile lines against the
  // winding road; the K bands themselves read as the drops)

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
      { sprite: 'house_a', x: 6, y: 21.8, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
      { sprite: 'house_b', x: 18, y: 21.8, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
      { sprite: 'house_a', x: 24, y: 21.8, solid: { ox: 0, oy: 20, w: 50, h: 34 } },
      { sprite: 'phone_pole', x: 10.5, y: 24.4, solid: { ox: 5, oy: 26, w: 6, h: 6 } },
      { sprite: 'phone_pole', x: 22.5, y: 24.4, solid: { ox: 5, oy: 26, w: 6, h: 6 } },
      { sprite: 'trash_can', x: 26, y: 26.2, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'sign', x: 17, y: 29, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // §A10 #1: the sniff trail crosses the road (same window as the hill
      // clue). RELOCATED together onto the upper shelf (the nearest walkable
      // roadside to the old x15 column — the old y13.4 fell in open hillside
      // between terrace bands, off the new road network).
      { sprite: 'paw_prints', x: 15, y: 11.4, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
      // prop_guardrail dressing (blueprint) on each cliff level's outer edge —
      // visual rail atop the fence-tile line, clear of the road/stairs.
      { sprite: 'prop_guardrail', x: 11.5, y: 8.6 },
      { sprite: 'prop_guardrail', x: 20.5, y: 14.6 },
      { sprite: 'prop_guardrail', x: 7, y: 16.6 },
      // THE OVERLOOK — a scenic pocket at the crest's outer (east) corner:
      // bench + guardrail + 2 trees, view south back down the whole climb.
      { sprite: 'prop_guardrail', x: 19.5, y: 3.6 },
      { sprite: 'bench', x: 20, y: 4.3, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: treeSprite(22, 3, true), x: 22, y: 3, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(22, 6, true), x: 22, y: 6, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
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
      { x: 15, y: 11, dialogue: 'hill_road_prints', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
    ],
    phones: [],
    doors: [
      { x: 13, y: 33, w: 4, h: 1, to: 'otterbrook', tx: 336, ty: 24, facing: 'down' },
      // S22 (ADR-112): the climb now passes through HICKORY TRAIL before the crater
      { x: 13, y: 0, w: 4, h: 1, to: 'hickory_trail', tx: 232, ty: 288, facing: 'up' },
    ],
    spawners: [
      // shrunk from h:6 to h:4 (y11-14) — the old range reached into Band 2's
      // K/^ rows (y15-16); the upper shelf itself (y10-11) + the open hillside
      // above the mid shelf (y12-14) stays open ground under the whole rect.
      { enemies: ['coily_cicada', 'skeeter_swarm'], count: 2, rect: { x: 6, y: 11, w: 16, h: 4 }, ifFlag: 'meteor_fell' },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 6, y: 18, w: 14, h: 4 }, ifFlag: 'meteor_fell' },
      // a mailbox prowling the home lane — it has COMPLAINTS
      { enemies: ['cranky_mailbox', 'unionized_gnome'], count: 1, rect: { x: 18, y: 25, w: 8, h: 3 }, ifFlag: 'meteor_fell' },
    ],
    triggers: [],
  };
}

/* ------------------- HICKORY HILL ------------------- */

function buildHill(): MapDef {
  const g = new Grid(30, 46);
  g.sprinkle(13, ',~,~ f', 0.07);
  // winding trail: south entrance to crater (unchanged topology, EB dirt ':')
  // THE CLIMB — a WINDING trail (hand-authored center tables, never a ruler):
  // south stub (straight — the spawn pins live on it) → a bending approach →
  // west climb through band H1's cut → shelf → east climb through H2's cut →
  // shelf → final climb through H3's cut → the crater's torn-open south lip.
  g.rect(13, 41, 4, 5, ':'); // south stub, 4-wide to match the door mouth (x13-16)
  windV(g, [14, 13, 12, 11, 10], 36, 3, ':'); // bending approach, stub → the sweep
  windV(g, [9, 9, 8, 9, 9, 9, 10, 9], 28, 3, ':'); // west climb (H1's cut at y31-32, center 9)
  windH(g, [28, 28, 29, 29, 28, 28, 28, 29, 29, 28, 28, 28, 28, 28], 8, 2, ':'); // the y28 shelf
  windV(g, [21, 21, 21, 22, 21, 20, 21, 21, 21], 20, 3, ':'); // east climb (H2's cut at y24-25, center 21)
  windH(g, [20, 20, 21, 21, 21, 20, 20, 21, 21, 20, 20, 20, 20], 10, 2, ':'); // the y20 shelf
  windV(g, [11, 11, 10, 11, 11, 11, 12, 11, 11, 11], 12, 3, ':'); // final climb (H3's cut at y17-18, center 11)
  windH(g, [12, 12, 13, 13, 12, 12, 12, 12], 10, 2, ':'); // the top shelf, into the crater's lip
  // THE CRATER BOWL — an ORGANIC oval of scorched ground (a meteor punched it
  // last night; nothing here is built). Row spans hand-shaped so the bowl
  // reads as a crater, not a field; a sparse ember ring glows around the rock
  // only. FROZEN pins (meteor_rock 14,5 / sentinel_husk 11.5,4 / crater
  // trigger 11,8,8,3) all sit inside the walkable scorch.
  const BOWL: ReadonlyArray<readonly [number, number, number]> = [
    // [y, xFrom, xTo]
    [1, 12, 17], [2, 10, 19], [3, 9, 20], [4, 8, 20], [5, 8, 21],
    [6, 8, 21], [7, 9, 20], [8, 10, 19], [9, 11, 18], [10, 12, 17],
  ];
  for (const [y, x0, x1] of BOWL) g.rect(x0, y, x1 - x0 + 1, 1, 's');
  // ember flecks ringing the rock — a handful, not a carpet
  for (const [ex, ey] of [[13, 3], [16, 3], [12, 5], [17, 5], [13, 7], [16, 7], [15, 2], [14, 8]] as const) g.set(ex, ey, 'S');
  // NO rim, NO steps, NO built anything — a meteor hit a hilltop last night.
  // The bowl sits flush in normal ground; its scorch just spills south toward
  // the trail head where the blast kicked debris downhill.
  g.rect(13, 10, 4, 3, 's');

  // ---- THE CLIMB'S 3 TERRACE BANDS ("3 bands + rim = 4 terraces read"),
  // each a `^`/`K` row pair. The trail passes each band through a WORN DIRT
  // CUT (the band skips the crossing columns and the ':' runs through) — a
  // wilderness hill has no stairs; the path has simply worn its way up.
  // Band H1 — lowest leg → the y28 shelf; cut at the x8-10 climb.
  g.rect(0, 31, 8, 1, '^'); g.rect(11, 31, 19, 1, '^');
  g.rect(0, 32, 8, 1, 'K'); g.rect(11, 32, 19, 1, 'K');
  g.rect(8, 31, 3, 2, ':');
  // Band H2 — the y28 shelf → the y20 shelf; cut at the x20-22 climb.
  g.rect(0, 24, 20, 1, '^'); g.rect(23, 24, 7, 1, '^');
  g.rect(0, 25, 20, 1, 'K'); g.rect(23, 25, 7, 1, 'K');
  g.rect(20, 24, 3, 2, ':');
  // Band H3 — the y20 shelf → the y12 shelf (under the crater rim); cut at
  // the x10-12 climb.
  g.rect(0, 17, 10, 1, '^'); g.rect(13, 17, 17, 1, '^');
  g.rect(0, 18, 10, 1, 'K'); g.rect(13, 18, 17, 1, 'K');
  g.rect(10, 17, 3, 2, ':');

  // (the winding trail + the terrace bands shape the switchbacks now — no
  // bush walls, no fence lines; the hill is wilderness)

  // thinned from step-2 to step-3 on the tall side columns (blueprint: "keep
  // each ≤80 props" — the EB terracing pass adds spring cattails + guardrail
  // dressing, so the treeline gives back room while staying a dense flank).
  const trees: Array<[number, number]> = [];
  for (let x = 0; x < 30; x += 2) {
    trees.push([x, 0]);
    if (x < 12 || x > 17) trees.push([x, 44]);
  }
  for (let y = 2; y < 44; y += 3) {
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
      { sprite: 'meteor_rock_hickory_hill', x: 14, y: 5, solid: { ox: 1, oy: 8, w: 28, h: 14 } },
      // ADR-121 — the powered-down HUSH SENTINEL husk, half-sunk in the crater after
      // the first-night repel. A quiet ominous landmark the town walks around; it
      // wakes again far later (the Ch.10 callback hangs off `sentinel_repelled`).
      { sprite: 'sentinel_husk', x: 11.5, y: 4, ifFlag: 'sentinel_repelled', solid: { ox: 4, oy: 60, w: 152, h: 40 } },
      { sprite: 'picnic', x: 11, y: 23, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'sign', x: 12, y: 39, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // S9 §A10 #1: sniff clue 2 — prints by the picnic table, mid-trail only
      { sprite: 'paw_prints', x: 14, y: 23.4, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
      // THE SPRING pocket (8-10,20-22): 3 cattails beside the hill_spring sign
      // (9,21) — visual only, clear of the sign/picnic/paw-prints tiles.
      { sprite: 'cattails', x: 8.3, y: 20.3 },
      { sprite: 'cattails', x: 9.6, y: 22.4 },
      { sprite: 'cattails', x: 7.6, y: 21.6 },
      // (no guardrails up here — municipal furniture stops where the asphalt
      // does, back on Hill Road; the wilderness climb keeps only worn cuts)
    ],
    npcs: [],
    signs: [
      { x: 12, y: 39, dialogue: 'sign_trail' },
      // ADR-121: read the husk the morning after (only once the Sentinel's been repelled)
      { x: 13, y: 6, dialogue: 'sign_sentinel_husk', ifFlag: 'sentinel_repelled' },
      // S9 §A10 #1: sniff clue 2 (under the prints, same gates)
      { x: 14, y: 23, dialogue: 'q_biscuit_clue2', ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
      // S9 §A10 #3: the spring the Lemonade Empire claimed long ago —
      // always here; the jug-fill beat branches in the scene (ADR-014)
      { x: 9, y: 21, dialogue: 'hill_spring' },
    ],
    phones: [],
    // S22 (ADR-112): descending from the crater drops into WHISPERWOOD RISE
    doors: [{ x: 13, y: 45, w: 4, h: 1, to: 'whisperwood_rise', tx: 232, ty: 36, facing: 'down' }],
    spawners: [
      // shrunk h:8→h:6 (y18-23) — the old range reached into bands H2 (y24-25)
      // and grazed H3 (y17-18); the shelf + open ground y18-23 stays clear.
      { enemies: ['coily_cicada', 'tick_nymph'], count: 3, rect: { x: 6, y: 18, w: 18, h: 6 } },
      // shrunk h:8→h:3 (y28-30) — the old range reached into band H1 (y31-32).
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 6, y: 28, w: 16, h: 3 } },
      // shrunk h:6→h:5 (y12-16) — the old range grazed band H3's lip (y17).
      { enemies: ['hill_slug_deluxe'], count: 1, rect: { x: 10, y: 12, w: 12, h: 5 } },
    ],
    triggers: [{ id: 'crater', rect: { x: 11, y: 8, w: 8, h: 3 }, once: true }],
  };
}

/* ------------------- THE UNDER-OAK (ADR-121 rework, 2026-07-02) -------------------
 * The Titanic Tick is no longer fought by touching a tree. The Heart Oak's
 * roots have torn open into a BURROW in Pond Park, and BOSS 1 waits at the
 * bottom of a directed three-map descent — EarthBound's Giant-Step grammar:
 * a winding root-tunnel with fights, a breather hollow with a rest + a cache,
 * then the heart chamber and the Tick. The set rides CH1_STORY_NIGHT_MAPS'
 * hush clock, so the whole descent is pitch-dark until the boss dies and the
 * post-victory rebuild lets the morning down the roots. Direction is given in
 * dawn_hush_dark (the wake-up note points at Pond Park), sign_oak_burrow at
 * the mouth, and heart_oak_approach at the bottom. */

/** the root tunnel — enter from the burrow (bottom), wind and climb-down north */
function buildOakRoots(): MapDef {
  const g = new Grid(28, 40, 'K');
  // the entry throat — a scorched mouth chamber where the surface light dies
  for (const [y, x0, x1] of [[33, 10, 16], [34, 9, 17], [35, 9, 18], [36, 10, 17], [37, 11, 16], [38, 12, 15]] as const) {
    g.rect(x0, y, x1 - x0 + 1, 1, 's');
  }
  // the winding descent (center-table, never a ruler) up-map toward the hollow
  windV(g, [13, 13, 12, 11, 10, 10, 11, 13, 15, 17, 18, 18, 17, 15, 13, 11, 9, 8, 8, 9, 11, 13, 14, 14, 13, 12, 11, 11, 12, 13, 13], 2, 3, ':');
  // two side galleries the tunnel brushes past (fights live here)
  for (const [y, x0, x1] of [[19, 4, 9], [20, 3, 10], [21, 3, 10], [22, 4, 9], [23, 5, 8]] as const) g.rect(x0, y, x1 - x0 + 1, 1, 's');
  g.rect(9, 21, 3, 1, 's'); // gallery throat west
  for (const [y, x0, x1] of [[9, 18, 23], [10, 17, 24], [11, 17, 24], [12, 18, 23]] as const) g.rect(x0, y, x1 - x0 + 1, 1, 's');
  g.rect(16, 10, 3, 1, 's'); // gallery throat east
  // ember veins glowing in the cut walls
  for (const [ex, ey] of [[12, 30], [15, 26], [17, 21], [10, 16], [8, 12], [14, 7], [12, 4], [6, 21], [21, 10]] as const) g.set(ex, ey, 'S');
  g.rect(12, 0, 3, 3, ':'); // the north throat up to the hollow

  return {
    id: 'oak_roots',
    name: 'THE UNDER-OAK — ROOTS',
    music: 'hill',
    grid: g.out(),
    props: [
      { sprite: 'root_curtain', x: 12.5, y: 1.2 }, // rootlets over the north throat
      { sprite: 'root_curtain', x: 12.6, y: 33.2 }, // ...and the entry throat
      { sprite: 'root_knot', x: 6.5, y: 20.3, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'root_knot', x: 19.4, y: 10.6, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'glow_shroom', x: 10.6, y: 27.6 },
      { sprite: 'glow_shroom', x: 9.3, y: 9.6 },
      { sprite: 'glow_shroom_b', x: 16.4, y: 16.5 },
      { sprite: 'ember', x: 12.4, y: 31.4 },
      { sprite: 'ember', x: 17.6, y: 22.4 },
      { sprite: 'ember', x: 8.4, y: 13.5 },
      { sprite: 'ember', x: 14.5, y: 5.5 },
      { sprite: 'ember', x: 6.5, y: 22.3 },
      { sprite: 'ember', x: 21.4, y: 11.3 },
    ],
    npcs: [],
    signs: [{ x: 12, y: 35, dialogue: 'oak_roots_enter' }],
    phones: [],
    doors: [
      // back out the burrow mouth — land on the knoll below the door, facing down
      { x: 12, y: 39, w: 4, h: 1, to: 'otterbrook', tx: 101 * 16, ty: 41 * 16, facing: 'down', indicator: 'none' },
      { x: 12, y: 0, w: 3, h: 1, to: 'oak_hollow', tx: 11 * 16 + 8, ty: 19 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['tick_nymph', 'coily_cicada'], count: 2, rect: { x: 4, y: 19, w: 6, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
      { enemies: ['skeeter_swarm', 'tick_nymph'], count: 2, rect: { x: 17, y: 9, w: 7, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 1, rect: { x: 10, y: 24, w: 6, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    ],
    triggers: [],
  };
}

/** the breather hollow — an underground pool, a rest, and somebody's old cooler */
function buildOakHollow(): MapDef {
  const g = new Grid(26, 22, 'K');
  // the hall — a rounded root-vault
  for (const [y, x0, x1] of [[4, 8, 17], [5, 6, 19], [6, 5, 20], [7, 4, 21], [8, 4, 21], [9, 4, 21], [10, 4, 21], [11, 4, 21], [12, 5, 20], [13, 5, 20], [14, 6, 19], [15, 7, 18], [16, 9, 16]] as const) {
    g.rect(x0, y, x1 - x0 + 1, 1, 's');
  }
  // the still pool (solid water, foam lip) the roots drink from
  g.rect(9, 8, 5, 3, 'e');
  g.rect(9, 7, 5, 1, 'E'); g.rect(9, 11, 5, 1, 'E');
  g.set(8, 8, 'E'); g.set(8, 10, 'E'); g.set(14, 8, 'E'); g.set(14, 10, 'E');
  for (const [ex, ey] of [[6, 6], [19, 7], [5, 13], [18, 14]] as const) g.set(ex, ey, 'S');
  g.rect(11, 17, 3, 5, ':'); // south throat, down to the roots
  g.rect(11, 0, 3, 4, ':'); // north throat, up to the heart

  const cache = walkPresent('oak_cache', 18, 6);
  return {
    id: 'oak_hollow',
    name: 'THE UNDER-OAK — HOLLOW',
    music: 'hill',
    grid: g.out(),
    props: [
      ...cache.props,
      // a rest before the heart (§A4.5 — placed BEFORE the pressure)
      { sprite: 'picnic', x: 5.6, y: 12.4, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'root_curtain', x: 11.6, y: 0.4 },
      { sprite: 'root_knot', x: 16.6, y: 12.2, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'glow_shroom', x: 6.2, y: 7.2 },
      { sprite: 'glow_shroom_b', x: 16.5, y: 15 },
      { sprite: 'glow_shroom', x: 12.4, y: 13.8 },
      { sprite: 'ember', x: 6.4, y: 6.4 },
      { sprite: 'ember', x: 18.5, y: 13.5 },
      { sprite: 'ember', x: 12.3, y: 4.6 },
    ],
    npcs: [],
    signs: [...cache.signs],
    phones: [],
    doors: [
      { x: 11, y: 21, w: 3, h: 1, to: 'oak_roots', tx: 12 * 16 + 8, ty: 2 * 16, facing: 'down', indicator: 'none' },
      { x: 11, y: 0, w: 3, h: 1, to: 'oak_heart', tx: 10 * 16 + 8, ty: 20 * 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['skeeter_swarm', 'coily_cicada'], count: 1, rect: { x: 15, y: 9, w: 5, h: 4 }, ifFlag: 'zapper_done', unlessFlag: 'tick_defeated' },
    ],
    triggers: [],
  };
}

/** the heart chamber — the Tick's feeding mound and the heart_oak trigger */
function buildOakHeart(): MapDef {
  const g = new Grid(22, 24, 'K');
  // the chamber — widest at its middle, narrowing toward the throat
  for (const [y, x0, x1] of [[3, 8, 13], [4, 6, 15], [5, 4, 17], [6, 3, 18], [7, 3, 18], [8, 3, 18], [9, 3, 18], [10, 3, 18], [11, 4, 17], [12, 4, 17], [13, 5, 16], [14, 6, 15], [15, 7, 14], [16, 8, 13]] as const) {
    g.rect(x0, y, x1 - x0 + 1, 1, 's');
  }
  // the ember ring around the mound — the Tick's heat signature
  for (const [ex, ey] of [[8, 5], [13, 5], [6, 8], [15, 8], [7, 11], [14, 11], [10, 13], [11, 13]] as const) g.set(ex, ey, 'S');
  windV(g, [10, 10, 11, 11, 10, 10, 10], 17, 3, ':'); // the approach throat

  return {
    id: 'oak_heart',
    name: 'THE UNDER-OAK — HEART',
    music: 'hill',
    grid: g.out(),
    props: [
      // the feeding mound the Tick is buried under (the boss fires from the
      // heart_oak trigger in front of it — same scene, same re-arm rules)
      { sprite: 'meteor_rock', x: 9, y: 6, solid: { ox: 1, oy: 8, w: 28, h: 14 } },
      { sprite: 'tree_c', x: 5, y: 3.6, solid: OAK }, // great root columns
      { sprite: 'tree_c', x: 14.5, y: 3.4, solid: OAK },
      { sprite: 'root_curtain', x: 9.8, y: 2.2 }, // the heartwood hangs over the mound
      { sprite: 'root_knot', x: 4.4, y: 12.6, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'root_knot', x: 15.6, y: 12.8, solid: { ox: 2, oy: 10, w: 20, h: 9 } },
      { sprite: 'glow_shroom', x: 4.6, y: 8.6 },
      { sprite: 'glow_shroom_b', x: 16.4, y: 8.4 },
      { sprite: 'ember', x: 8.5, y: 5.6 },
      { sprite: 'ember', x: 13.4, y: 5.4 },
      { sprite: 'ember', x: 6.6, y: 11.4 },
      { sprite: 'ember', x: 14.6, y: 11.6 },
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [{ x: 9, y: 23, w: 3, h: 1, to: 'oak_hollow', tx: 12 * 16, ty: 2 * 16, facing: 'down', indicator: 'none' }],
    spawners: [],
    triggers: [
      // ADR-121: BOSS 1 — the same heartOakScene, now at the bottom of a real
      // route instead of on a surface tree. Gated in OverworldScene.runTrigger
      // (zapper_done && !tick_defeated); re-arms on re-entry after a flee/loss.
      { id: 'heart_oak', rect: { x: 8, y: 8, w: 6, h: 3 }, once: false },
    ],
  };
}

/* ------------------- THE LONGER CLIMB (S22, ADR-112) -------------------
 * Two transitional legs slotted BETWEEN hill_road and the crater so the walk
 * up Hickory Hill earns its payoff: a winding dirt switchback (HICKORY TRAIL)
 * and a dark wooded rise (WHISPERWOOD RISE). Both ride the §A6 story clock for
 * night (no `night` field — derived from meteor_fell && !zapper_done like the
 * rest of the hill). Door landings sit on the path so they stay walkable; the
 * paw-print sniff trail (§A10 #1) continues across both so Biscuit's clue line
 * reads unbroken on the longer route. Gray-boxed with shipped sprites — see
 * docs/CH1_ART_PROMPTS.md for the authored-PNG pass.
 */

/** HICKORY TRAIL — the winding dirt road. 30×20, an S-curve from the south
 *  edge (down to HILL ROAD) up to the north edge (up to WHISPERWOOD RISE). */
function buildHickoryTrail(): MapDef {
  const g = new Grid(30, 20);
  g.sprinkle(212, ',~,~ f', 0.07);
  // ASPHALT ENDS, DIRT BEGINS (EB blueprint): the switchback stays ':' dirt
  // (fringed masks now render automatically) — same S-curve topology, ONE
  // `^K` band mid-map with a 3-wide `T` stair where the trail crosses it.
  // HARD PIN: the cross-leg stays EXACTLY y8-9, x6→22 (hodgkin_mower's
  // patrol route [[8,8.5],[20,8.5]] is content) — the band sits BELOW it, in
  // the climb-left corridor, never touching the pinned leg.
  g.rect(13, 16, 3, 4, ':'); // south stub → HILL ROAD
  windH(g, [15, 15, 14, 14, 14, 15, 15, 15, 14, 14], 6, 2, ':'); // winding sweep left
  windV(g, [6, 6, 7, 7, 6, 6, 6, 6], 8, 3, ':'); // left climb (the band's cut at y12-13, center 6)
  g.rect(6, 8, 16, 2, ':'); // cross to the right — HARD PIN, unchanged (x6-22,y8-9: the mower's beat)
  windV(g, [21, 21, 22, 22, 21, 21, 21, 21], 2, 3, ':'); // right climb, winding
  windH(g, [3, 3, 2, 2, 2, 3, 3, 3, 2, 2], 13, 2, ':'); // crest back to centre
  g.rect(13, 0, 3, 4, ':'); // north stub → WHISPERWOOD RISE

  // ---- THE ONE TERRACE BAND: crossing the climb-left corridor (x5-7) at
  // y12/13 — mid-map, clear of the pinned cross-leg (y8-9) above it and the
  // sweep-left (y14-15) below it. The trail passes through a WORN DIRT CUT
  // (no stairs out here — the path has worn its own way through the rock).
  g.rect(0, 12, 5, 1, '^'); g.rect(8, 12, 22, 1, '^');
  g.rect(0, 13, 5, 1, 'K'); g.rect(8, 13, 22, 1, 'K');
  g.rect(5, 12, 3, 2, ':');

  // (the winding legs + the band shape the switchbacks — no bush shutters)

  const trees: Array<[number, number]> = [];
  for (let x = 0; x < 30; x += 2) {
    if (x < 12 || x > 17) trees.push([x, 0]);
    if (x < 12 || x > 17) trees.push([x, 19]);
  }
  for (let y = 2; y < 18; y += 2) {
    trees.push([0, y]);
    trees.push([28, y]);
  }
  trees.push([10, 5], [24, 12], [4, 9], [25, 5], [17, 11]);

  return {
    id: 'hickory_trail',
    name: 'HICKORY TRAIL',
    music: 'hill',
    ambience: 'wind',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: OAK })),
      { sprite: 'sign', x: 16, y: 17, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // a picnic table before the last push (§A4.5 — placed BEFORE the dungeon)
      { sprite: 'picnic', x: 9, y: 10, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      // §A10 #1: the sniff trail keeps climbing (same gates as the road/hill clues)
      { sprite: 'paw_prints', x: 14, y: 12.4, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
      // S22 (ADR-119): Hodgkin's locked supply shed (the soft Trail Key interlock)
      { sprite: 'sign', x: 10, y: 7, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ],
    npcs: [],
    signs: [
      { x: 16, y: 17, dialogue: 'sign_hickory_trail' },
      { x: 10, y: 7, dialogue: 'trail_shed' },
    ],
    phones: [],
    doors: [
      { x: 13, y: 19, w: 3, h: 1, to: 'hill_road', tx: 232, ty: 36, facing: 'down' },
      { x: 13, y: 0, w: 3, h: 1, to: 'whisperwood_rise', tx: 232, ty: 288, facing: 'up' },
    ],
    spawners: [
      { enemies: ['coily_cicada'], count: 2, rect: { x: 6, y: 8, w: 16, h: 4 }, ifFlag: 'meteor_fell' },
      // nudged y13→14 (h stays 4, now y14-17) — the old range's top row (y13)
      // sat on the new terrace band's K row; the sweep-left level (y14-15) +
      // open ground below it stays clear.
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 8, y: 14, w: 12, h: 4 }, ifFlag: 'meteor_fell' },
    ],
    // S22 (ADR-119): Hodgkin's runaway demo mower roams the switchbacks; catching
    // it (countFlag) earns the Trail Key. A counted patrol stays down once beaten.
    patrols: [{ id: 'hodgkin_mower', enemy: 'runaway_lawnmower', route: [[8, 8.5], [20, 8.5]], countFlag: 'q_mower_caught' }],
    triggers: [],
  };
}

/** WHISPERWOOD RISE — the dark wooded climb. 30×20, a near-straight aisle of
 *  pines from the south edge (down to HICKORY TRAIL) up to the crater. */
function buildWhisperwoodRise(): MapDef {
  const g = new Grid(30, 20);
  g.sprinkle(377, ',~,~bb', 0.09);
  // THE DARK PINE AISLE (EB blueprint): x13-15 full height but JOGGED twice
  // (±2 tiles, ~4 rows each) so the masks read winding instead of a ruler
  // line — both door mouths (y0, y19) stay at x13-15.
  // ONE continuous winding aisle, both door mouths pinned at x13-15 — the
  // center table drifts left, home, right (through the band's cut), home.
  windV(g, [14, 14, 13, 12, 12, 12, 13, 13, 14, 14, 14, 15, 16, 16, 16, 15, 14, 14, 14, 14], 0, 3, ':');
  g.rect(8, 9, 8, 2, ':'); // a small clearing spur (the picnic glade)
  // dense bramble walls hemming the path in
  g.rect(5, 5, 5, 1, 'b');
  g.rect(20, 6, 5, 1, 'b');
  g.rect(6, 14, 4, 1, 'b');
  g.rect(19, 13, 5, 1, 'b');

  // ---- THE ONE TERRACE BAND: crossing the aisle's right jog (x15-17) at
  // y13/14 — mid-map, clear of the glade spur (y9-10) and both door mouths.
  // A worn dirt cut carries the aisle through (no built stairs in the pines).
  g.rect(0, 13, 15, 1, '^'); g.rect(18, 13, 12, 1, '^');
  g.rect(0, 14, 15, 1, 'K'); g.rect(18, 14, 12, 1, 'K');
  g.rect(15, 13, 3, 2, ':');

  const trees: Array<[number, number]> = [];
  for (let x = 0; x < 30; x += 2) {
    if (x < 12 || x > 16) {
      trees.push([x, 0]);
      trees.push([x, 19]);
    }
  }
  for (let y = 1; y < 19; y += 1) {
    if (y % 2 === 0) {
      trees.push([0, y], [2, y], [27, y], [29, y]);
    }
  }
  // inner pines crowding the aisle (kept off the path column x13–15)
  trees.push([6, 4], [22, 4], [9, 7], [20, 8], [7, 12], [23, 11], [10, 16], [21, 16], [6, 9], [24, 14]);

  return {
    id: 'whisperwood_rise',
    name: 'WHISPERWOOD RISE',
    music: 'hill',
    ambience: 'wind',
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: OAK })),
      { sprite: 'sign', x: 16, y: 16, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // §A10 #1: the last paw prints before the crown of the hill
      { sprite: 'paw_prints', x: 14, y: 10.4, ifFlag: 'q_biscuit_c1', unlessFlag: 'q_biscuit_c2' },
      // the glade spur GAINS a bench (blueprint) — west end, clear of the
      // aisle's own walkway (x13-15) through the clearing.
      { sprite: 'bench', x: 9, y: 9.3, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [],
    signs: [{ x: 16, y: 16, dialogue: 'sign_whisperwood_rise' }],
    phones: [],
    doors: [
      { x: 13, y: 19, w: 3, h: 1, to: 'hickory_trail', tx: 232, ty: 36, facing: 'down' },
      // land one tile inside the hill's south seam (its return door at y:45) —
      // ty:660 dropped you four tiles up the slope, mid-screen
      { x: 13, y: 0, w: 3, h: 1, to: 'hickory_hill', tx: 248, ty: 716, facing: 'up' },
    ],
    spawners: [
      { enemies: ['coily_cicada', 'hill_slug_deluxe', 'skeeter_swarm'], count: 2, rect: { x: 8, y: 4, w: 14, h: 4 }, ifFlag: 'meteor_fell' },
      // shrunk h:4→h:1 (y12 only) — the old range (y12-15) reached into the
      // new terrace band (y13-14); the glade-adjacent ground at y12 stays open.
      { enemies: ['hill_slug_deluxe'], count: 1, rect: { x: 8, y: 12, w: 14, h: 1 }, ifFlag: 'meteor_fell' },
    ],
    triggers: [],
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
      // tx 109 centers the player on the DRAWN door (~world x436); the old 120 put
      // them ~45px right of it, over the window side. ty lands just south of the
      // doorstep zone (the door re-arm guard also blocks any exit-bounce now).
      { x: 6, y: 9, w: 2, h: 1, to: 'otterbrook', tx: 109, ty: 117, facing: 'down', indicator: 'mat' },
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
      { sprite: 'desk', x: 6, y: 1.55, solid: { ox: 1, oy: 4, w: 24, h: 13 } }, // backed up against the top wall
      { sprite: 'dresser', x: 8, y: 2.4, solid: { ox: 2, oy: 8, w: 26, h: 14 } }, // on the floor, right of the desk
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
      // NB: these tx/ty are the PRE-GROW rooms' numbers — the rooms are in
      // ROOMY_INTERIORS, so the assembly re-aim pass (below the growInterior
      // loop) rewrites each landing to one tile inside the grown room's mat.
      { x: 2, y: 2, w: 2, h: 1, to: 'rex_bedroom', tx: 56, ty: 96, facing: 'up', indicator: 'door' },
      { x: 7, y: 2, w: 2, h: 1, to: 'ana_room', tx: 72, ty: 112, facing: 'up', indicator: 'door' },
      { x: 12, y: 2, w: 2, h: 1, to: 'vivi_room', tx: 72, ty: 112, facing: 'up', indicator: 'door' },
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
    npcs: [
      // ADR-121: Ana is home through the meteor night; gone to the stand by morning.
      { id: 'ana', sprite: 'ana', x: 3, y: 5, facing: 'down', dialogue: 'ana_room_night', unlessFlag: 'zapper_done' },
    ],
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
    npcs: [
      // ADR-121: Vivi is home through the meteor night; gone to the stand by morning.
      { id: 'vivi', sprite: 'vivi', x: 6, y: 5, facing: 'down', dialogue: 'vivi_room_night', unlessFlag: 'zapper_done' },
    ],
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

/** where MEADOW MILE drops you on foot (S15h) — the grown city's SOUTH GATEWAY,
 *  in the new district (the orientation gate reads this). Computed for the 144×76
 *  grown grid; the bus still lands inside the old downtown (BRICKTON_BUS_SPAWN). */
export const BRICKTON_FOOT_SPAWN = { x: 30 * 16 + 8, y: 71 * 16 } as const;

/**
 * BRICKTON CITY — "Break the stripes" re-layout (docs/CITY_DESIGN_LANGUAGE.md).
 * Skeleton unchanged (streets A/B/Market, the two avenues) — every FIXED
 * POINT (bus corner, payphone cluster, clock plaza trigger, the cage lot)
 * sits at its exact tile, still walkable. What changes is the TEXTURE inside
 * the blocks: curb parking lanes read as real streets, two formal alleys
 * break the north row's unbroken baseline, the midtown reads as three
 * quarters (transit/lots, row-house strip, park-as-a-room), the clock plaza
 * gets benches that face the clock, and the south market lot becomes an
 * actual market. All irregularity still comes from one fixed seed (1995 —
 * the summer it fell) so the city is sporadic to the eye but identical on
 * every boot.
 */
/** THE FROZEN 2077 CORE — byte-identical forever (the byte-identical test
 *  proves growBrickton copies its grid + props unchanged into the top-left;
 *  only the docks EXIT door relocates to the grown city's new edge). */
export function buildBrickton(): MapDef {
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

  // M1 — PARKED LANES: 1-wide curb segments on the outer lane of streets A/B
  // (never the centerline row, never a crosswalk/avenue-mouth/alley-mouth
  // column), so the avenue reads as "cars actually park here" without
  // touching traffic width. Plain g.set calls — consumes NO rng (ADR-016),
  // so the 1995 stream below stays exactly the sequence it always drew.
  const paveSkipA = (x: number): boolean => (x >= 16 && x <= 28) || (x >= 55 && x <= 61);
  for (const [x0, len] of [[3, 10], [30, 6], [43, 10], [62, 6]] as const) {
    for (let x = x0; x < x0 + len; x++) if (!paveSkipA(x)) g.set(x, 8, 'P'); // street A north curb
  }
  const paveSkipB = (x: number): boolean => (x >= 25 && x <= 30) || (x >= 55 && x <= 61);
  for (const [x0, len] of [[3, 10], [31, 8], [46, 6], [62, 6]] as const) {
    for (let x = x0; x < x0 + len; x++) if (!paveSkipB(x)) g.set(x, 23, 'P'); // street B south curb
  }

  // west mid-block: the parking lot (always emptier than it should be)
  g.rect(2, 13, 8, 5, 'P');
  // M3 midtown CENTER — a service pocket behind the row-house strip (x11-24):
  // a 1-tall dressing strip just off street B's sidewalk, north of the curb
  g.rect(11, 19, 13, 1, '=');
  // east mid-block: THE PARK becomes a ROOM (M3 park/green quarter) — an
  // inner ':' loop around the fountain-picnic, corners nibbled so the plaza
  // never reads as a rectangle
  g.rect(41, 13, 13, 6, '.');
  g.rect(41, 13, 1 + jit(3), 1, '=');
  g.rect(53 - jit(3), 13, 3, 1, '=');
  g.rect(41, 18, 2 + jit(3), 1, '=');
  g.rect(52 - jit(2), 18, 3, 1, '=');
  g.rect(43, 14, 9, 1, ':'); g.rect(43, 17, 9, 1, ':'); // the loop's N/S legs
  g.rect(43, 14, 1, 4, ':'); g.rect(51, 14, 1, 4, ':'); // the loop's E/W legs
  // east plaza: THE CLOCK PLAZA — a coherent '=' room (M3 civic quarter);
  // public notices, too much sidewalk, and now a bench-lined court
  g.rect(58, 12, 11, 7, '.');
  g.rect(61, 14, 5, 3, '=');
  g.rect(66, 16, 3, 2, '=');
  g.rect(60, 15, 8, 1, '='); // the court apron the benches sit on
  // south market lot: buses, deliveries, and pigeons with committees — now
  // THE MARKET ROW (M3 market quarter): stalls crowd the walkway
  g.rect(3, 28, 9, 5, 'P');
  g.rect(34, 25, 11, 4, '=');
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
  // M2 — two formal ALLEYS in the north row (hospital→dept, video→diner):
  // rows 6-7 are already plain sidewalk (the default '=' fill, untouched by
  // any street/plaza paint above), so the alley reads through its WIDENED
  // gap + dumpster/crate dressing (below) — the same "bare" alley precedent
  // as the original starmart-brickmore gap. Neither avenue reaches this far
  // north (avenue-1/2 both start at row 8, the street itself), so the only
  // clearance that matters here is each alley's own building footprint —
  // guaranteed by the north-row spacing loop above (alley2X/alley3X, below).
  // hedge fragments along the south edge — broken, like real municipal hedges
  let hx = 18;
  while (hx < 68) {
    const len = 2 + jit(3);
    if (rng() < 0.75) g.rect(hx, 35, len, 1, 'b');
    hx += len + 1 + jit(3);
  }
  // M3 park quarter — hedge fragments at the room's corners (gaps ≥3-wide,
  // so the loop's own entrances at N/S/E/W stay clear)
  g.set(41, 13, 'b'); g.set(53, 13, 'b');
  g.set(41, 18, 'b'); g.set(53, 18, 'b');
  g.sprinkle(95, ',~ff F', 0.16); // grass fuzz in the park + the lot

  /* ---- buildings: three clusters, jittered, height-varied, staggered ---- */
  interface Bldg {
    sprite: string;
    w: number;
    u: 1 | 2 | 3;
    x: number;
    /** M2 setback stagger — a small ± tile nudge to the row's shared baseline */
    setback?: number;
  }
  const north: Bldg[] = [
    { sprite: 'bldg_starmart', w: 5, u: 1, x: 2 + jit(2) },
    { sprite: 'bldg_brickmore', w: 5, u: 3, x: 9 + jit(2), setback: -1 },
    { sprite: 'bldg_hospital', w: 7, u: 2, x: 16 + jit(2) },
    { sprite: 'bldg_dept', w: 8, u: 2, x: 29 + jit(2), setback: 1 },
    { sprite: 'bldg_bank', w: 6, u: 2, x: 41 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 51 + jit(2), setback: -1 },
    { sprite: 'bldg_diner', w: 4, u: 1, x: 58 + jit(2) },
  ];
  for (let i = 1; i < north.length; i++) {
    // M2: the hospital→dept and video→diner junctions (i===3, i===6) each
    // reserve a 2-wide ALLEY on top of the usual 1-tile min gap, so the carved
    // slot below (rows 6-7) never clips either building's true solid footprint
    const alleySlot = i === 3 || i === 6 ? 2 : 0;
    const min = north[i - 1].x + north[i - 1].w + 1 + alleySlot;
    if (north[i].x < min) north[i].x = min;
  }
  // the true right edge of a placed facade, in TILE units — matches
  // facadeSolid's own w*16+2 formula (kit.ts), so the alley slot below is
  // derived from where the building's collision ACTUALLY ends, never a guess
  const rightEdge = (b: Bldg): number => b.x + b.w + 2 / 16;
  const alley2X = Math.ceil(rightEdge(north[2])); // hospital's true edge → alley starts clear of it
  const alley3X = Math.ceil(rightEdge(north[5])); // video's true edge → alley starts clear of it
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
    { sprite: 'bldg_brickmore', w: 5, u: 2, x: 37 + jit(2), setback: -1 },
    { sprite: 'bldg_diner', w: 4, u: 1, x: 46 + jit(2) },
    { sprite: 'bldg_video', w: 4, u: 1, x: 53 + jit(2), setback: 1 },
    { sprite: 'bldg_bank', w: 6, u: 2, x: 61 + jit(2) },
  ];
  for (let i = 1; i < south.length; i++) {
    const min = south[i - 1].x + south[i - 1].w + 1;
    if (south[i].x < min) south[i].x = min;
  }

  const bldgProps: PropDef[] = [];
  const place = (b: Bldg, bottomPx: number): PropDef => {
    const H = cityBuildingHeight(b.u);
    const bpx = bottomPx + (b.setback ?? 0) * 16;
    const prop: PropDef = {
      sprite: b.sprite,
      x: b.x,
      y: (bpx - H) / 16,
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
  // the CENTER quarter's clutter, purposeful now (the service-pocket strip
  // at row 19) — but never in front of a door
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

  // alley dumpsters: the original starmart-brickmore gap + the two NEW
  // formal alleys (hospital-dept, video-diner; alley2X/alley3X computed
  // above, right after the north row's spacing) — a crate keeps each company
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
  // M6 — a '3' storm drain at each new P-lane's curb corner (both ends)
  for (const x of [3, 12, 30, 35, 43, 52, 62, 67]) {
    if (g.rows[8][x] === 'P') g.set(x, 8, '3');
  }
  for (const x of [3, 12, 31, 38, 46, 51, 62, 67]) {
    if (g.rows[23][x] === 'P') g.set(x, 23, '3');
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
  // trash cans in the north alley gaps (between building solids, row 6) — the
  // two FORMAL alleys (≥1.9 wide) always dress; the smaller incidental gaps roll
  for (let i = 1; i < north.length; i++) {
    const gapStart = north[i - 1].x + north[i - 1].w + 0.2;
    const gapEnd = north[i].x;
    if (gapEnd - gapStart < 1.2) continue;
    if (gapEnd - gapStart < 1.9 && rng2() < 0.4) continue;
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

  // THE MARKET (south lot, x34-45): three stalls crowding the walkway + a
  // couple of crates, replacing the empty grass lot the sign already pointed
  // at. Continues the SAME third stream (2095) — fully consumed above by one
  // draw, so this is just its next bytes, same discipline as every cluster.
  const marketStalls: PropDef[] = (['a', 'b', 'c'] as const).map((letter, i) => ({
    sprite: `market_stall_${letter}`,
    x: 35 + i * 3 + Math.floor(rng3() * 2),
    y: 26.4,
    solid: { ox: 1, oy: 14, w: 38, h: 14 },
  }));
  const marketCrates: PropDef[] = [
    { sprite: 'crate', x: 34.4, y: 27.2, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
    { sprite: 'crate', x: 43.6, y: 27.4, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
  ];

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
      { sprite: 'dumpster', x: alley2X, y: 5.4, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'crate', x: alley2X + 0.1, y: 6.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'dumpster', x: alley3X, y: 5.4, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'crate', x: alley3X + 0.1, y: 6.6, solid: { ox: 1, oy: 8, w: 18, h: 9 } },
      { sprite: 'dumpster', x: 2, y: 11.9, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 6, y: 27.2, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'dumpster', x: 63, y: 24.6, solid: { ox: 1, oy: 8, w: 20, h: 9 } },
      { sprite: 'atm', x: atmX, y: 5.5, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
      // bus stop corner
      { sprite: 'bus_sign', x: 7, y: 26, solid: { ox: 4, oy: 18, w: 6, h: 6 } },
      { sprite: 'bench', x: 4, y: 27, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 10, y: 27, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      { sprite: 'payphone', x: 14, y: 26, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      // THE PARK-AS-A-ROOM: the fountain-picnic centerpiece + 2 benches facing it
      { sprite: 'picnic', x: picnicX, y: 15, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
      { sprite: 'bench', x: picnicX - 2, y: 16.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: picnicX + 3, y: 16.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      // THE CLOCK PLAZA: 2 benches facing the clock cluster + a news box
      { sprite: 'bench', x: 61, y: 16, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 64, y: 16, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'news_box', x: 67, y: 15.4, solid: { ox: 2, oy: 12, w: 12, h: 7 } },
      // THE MARKET: stalls + crates crowding the walkway
      ...marketStalls,
      ...marketCrates,
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
      // 2026-07-02 (user: "can't find the basketball section"): the CLOCK the
      // plaza always talked about, plus a BOUNCE-TRAIL to The Cage — a
      // backboard teaser at the gate + signs that literally point the way.
      { sprite: 'town_clock', x: 62.2, y: 12.85, solid: { ox: 5, oy: 26, w: 9, h: 6 } },
      { sprite: 'backboard', x: 48.4, y: 24.2, solid: { ox: 2, oy: 20, w: 10, h: 6 } },
      // S13: the Costa Estrella travel poster (the tease — visual-only)
      { sprite: 'poster_links', x: posterX, y: 25.4 },
      ...furniture,
      ...meters,
    ],
    npcs: [
      { id: 'nurse', sprite: 'nurse', x: hospital.x + 3, y: 6, facing: 'down', dialogue: 'npc_nurse' },
      { id: 'gray_commuter', sprite: 'grayCommuter', x: dept.x + 5, y: 6, facing: 'up', dialogue: 'npc_commuter' },
      { id: 'quarter_man', sprite: 'quarterMan', x: 15, y: 27, facing: 'left', dialogue: 'npc_quarter' },
      { id: 'pigeon_kid', sprite: 'pigeonKid', x: 44, y: 17, facing: 'down', dialogue: 'npc_pigeonkid' },
      { id: 'sidewalk_critic', sprite: 'sidewalkCritic', x: 20, y: 19, facing: 'down', dialogue: 'npc_critic', wander: true },
      { id: 'clock_lady', sprite: 'oldTimer', x: 63, y: 15, facing: 'down', dialogue: 'npc_clock_lady' },
      // the hoops kid dribbling at the gate — a walking arrow to The Cage
      { id: 'hoops_kid', sprite: 'pajamaKid', x: 49, y: 27, facing: 'up', dialogue: 'npc_hoops_kid', wander: true },
      { id: 'bagel_scout', sprite: 'pajamaKid', x: 34, y: 29, facing: 'up', dialogue: 'npc_bagel_scout', wander: true },
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
      // the bounce-trail: plaza → the north gate → THE CAGE
      { x: 60, y: 14, dialogue: 'sign_to_cage_plaza' },
      { x: 48, y: 26, dialogue: 'sign_to_cage_gate' },
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
      { enemies: ['blazer_smiler', 'showroom_mannequin'], count: 1, rect: { x: 28, y: 6, w: 12, h: 2 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 11, y: 19, w: 13, h: 2 } },
      { enemies: ['pigeon_gang', 'rogue_icecream_truck'], count: 1, rect: { x: 2, y: 13, w: 8, h: 5 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 41, y: 13, w: 12, h: 6 } },
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 56, y: 12, w: 13, h: 7 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 3, y: 28, w: 9, h: 5 } },
      { enemies: ['cranky_mailbox', 'expired_meter'], count: 1, rect: { x: 30, y: 25, w: 16, h: 4 } },
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

/* ------------- BRICKTON SPRAWLS (S15h, ADR-049) ------------- */

/**
 * BRICKTON ~4× (2736 → 10944 tiles, 144×76). The frozen 2077 core is COPIED
 * byte-for-byte into the top-left — every tile, every prop, the Cage, the dept,
 * the bus stop, the clock + dial flags, UNCHANGED. The forge's CITY grammar lays
 * new walled districts in the L around it (an east band + the south band), all
 * connected to downtown through the core's ONE existing opening: street B's east
 * gap (col 71, rows 21-23, already road). The single deliberate exception to
 * "byte-for-byte": the docks EXIT door relocates from that gap to the grown
 * city's NEW east edge — the port moved out with the city — so street B can flow
 * east into the sprawl instead of dead-ending at the old wall. Brickton stays a
 * `city` and clears the ADR-012 sweep AT 144×76 (the maps.test sweep runs on it).
 */
export function growBrickton(): MapDef {
  const core = buildBrickton();
  const CW = core.grid[0].length; // 72
  const CH = core.grid.length; // 38
  const W = 144;
  const H = 76;
  const g = new Grid(W, H, '=');
  // 1) the frozen 2077 core, verbatim, in the top-left (grid byte-identical)
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) g.set(x, y, core.grid[y][x]);

  // 2) the GROWN city's outer brick walls (only in the new region — never over
  //    the core). The old downtown's east + south walls become interior walls.
  g.rect(CW, 0, W - CW, 1, 'B'); // north edge, east of the core
  g.rect(W - 1, 0, 1, H, 'B'); // new east edge
  g.rect(0, CH, 1, H - CH, 'B'); // west edge, below the core
  g.rect(0, H - 1, W, 1, 'B'); // new south edge

  // 3) STREET B runs EAST out the old gap (col 71, rows 21-23 = 'R' in the core)
  //    across the new east band to the relocated docks at the far edge. A south
  //    AVENUE drops from it; two E-W streets cross the new districts (the grid
  //    law extended — the core already clears the sweep, this only adds to it).
  g.rect(CW, 21, W - CW, 3, 'R'); // street B east extension (reopens the far-edge docks gap)
  g.rect(100, 24, 3, H - 25, 'R'); // the south connector avenue (drops off street B)
  g.rect(1, 50, W - 2, 3, 'R'); // SOUTH STREET — spans the sprawl
  g.rect(1, 63, W - 2, 3, 'R'); // MAPLE STREET — the brick rows back onto it
  g.rect(29, 53, 3, H - 53, 'R'); // the SOUTH GATEWAY road, down to the city line

  // 4) crosswalks where the avenue meets the new streets, dashed centerlines
  for (const sy of [50, 63]) {
    g.rect(98, sy, 2, 3, 'X');
    g.rect(103, sy, 2, 3, 'X');
    for (let x = 2; x < W - 2; x++) if (x % 4 < 2 && (x < 98 || x > 104)) g.set(x, sy + 1, 'D');
  }

  // 5) NEGATIVE SPACE (§B4): an irregular plaza-park east of the avenue, corners
  //    nibbled so it never reads as a rectangle; a parking lot west of it.
  g.rect(108, 30, 16, 10, '.');
  g.rect(108, 30, 3 + (CW % 4), 1, '=');
  g.rect(120, 39, 4, 1, '=');
  // the plaza-park becomes a ROOM too (M3/M4): a ':' inner loop around its
  // centerpiece, so it reads the same "park you walk a lap of" language as
  // the core's own park quarter
  g.rect(111, 32, 10, 1, ':'); g.rect(111, 37, 10, 1, ':'); // loop N/S legs
  g.rect(111, 32, 1, 6, ':'); g.rect(120, 32, 1, 6, ':'); // loop E/W legs
  g.rect(74, 56, 9, 6, 'P');
  // grass fuzz on the new park cells ONLY — a region-bounded sprinkle that skips
  // the frozen core (the core HAS '.' park cells; the global Grid.sprinkle would
  // corrupt them, so we guard x≥CW || y≥CH explicitly)
  const fuzz = seededRng(2077144);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < CW && y < CH) continue; // never touch the 2077 core
      if (g.rows[y][x] === '.' && fuzz() < 0.08) g.set(x, y, ',~ff F'[Math.floor(fuzz() * 6)]);
    }
  }
  // M6 — the wear pass extended into the grown streets/sidewalks: a FRESH
  // named stream (2077145, adjacent to the fuzz seed above but isolated), so
  // it can never disturb the fuzz sequence or anything upstream. Region-
  // guarded exactly like the fuzz pass — the frozen core never sees it.
  const wear = seededRng(2077145);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < CW && y < CH) continue; // never touch the 2077 core
      const ch = g.rows[y][x];
      if (ch === '=' && wear() < 0.04) g.set(x, y, '1');
      else if (ch === 'R' && wear() < 0.02) g.set(x, y, '2');
    }
  }

  // 6) THE FORGE lays the blocks — now in BRICKTON's OWN cool skins (ADR-050):
  //    glass offices / hotels / neon / theaters + the COMMON mega-towers (their
  //    tops run off the screen). Drawn art stays a hand job (ADR-020); the skins
  //    are the deterministic catalog, sliced per-area so Brickton ≠ Otterbrook.
  // ADR-053: shared footprint list so the spacing law spans every district.
  const bkOccupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  const skin = AREA_SKINS.brickton;
  const eastNorth = buildDistrict(g, { x: 74, y: 2, w: 66, h: 17 }, new Streams(207701), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [9], avenueCols: [120], maxStories: 3, occupied: bkOccupied,
  });
  // THE HIGH-RISE DOWNTOWN (ADR-054): a tall open block west of the avenue where
  // the MEGA PASS stands the u12–13 towers — mega-buildings are COMMON here, their
  // tops climbing off the top of the screen, shorter glass storefronts in the gaps.
  const downtownHigh = buildDistrict(g, { x: 74, y: 24, w: 26, h: 25 }, new Streams(207704), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [47], maxStories: 9, mega: true, occupied: bkOccupied,
  });
  // eastSouth narrowed to col 124 so the far-east blocks clear for the colossus
  const eastSouth = buildDistrict(g, { x: 104, y: 41, w: 21, h: 8 }, new Streams(207702), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [44], maxStories: 3, occupied: bkOccupied,
  });
  const southWest = buildDistrict(g, { x: 2, y: 38, w: 70, h: 10 }, new Streams(207703), {
    layout: 'grid', style: 'americana', catalog: skin, streetRows: [44], avenueCols: [40], maxStories: 3, occupied: bkOccupied,
  });

  // 7) MAPLE HEIGHTS — a hand-built brick row backing onto Maple Street (the
  //    named residential block the growth advertises), + the catalog storefronts.
  // M2: the 5 houses restagger to an uneven rhythm (was a flat +7 baseline) —
  // same count, same sprite, just less of a ruler-straight row. Each front
  // yard gets a fence run with a gate gap (the door's own column stays clear)
  // and a tree fills the wider gaps between houses (M2's "one tree per lot pair").
  const mapleXs = [6, 14, 21, 29, 36];
  const mapleProps: PropDef[] = [];
  const mapleTrees: PropDef[] = [];
  for (let i = 0; i < mapleXs.length; i++) {
    const mx = mapleXs[i];
    mapleProps.push(placeFacade('bldg_brickmore', mx, 62 * 16 - 4, 5, 2));
    // yard fence along the house's own frontage — row 62 (the doorstep's
    // landing sits at ~y60.4-61.75, so row 62 is the first fully-clear row
    // south of it, one row shy of Maple Street at row 63), gapped at the
    // door's center column (a 5-wide facade's door sits mid-span, mx+2..+3)
    g.rect(mx, 62, 2, 1, '-');
    g.rect(mx + 3, 62, 2, 1, '-');
    if (i < mapleXs.length - 1) {
      const gapStart = mx + 5;
      const gapEnd = mapleXs[i + 1];
      if (gapEnd - gapStart >= 2) {
        const tx = gapStart + Math.floor((gapEnd - gapStart) / 2);
        mapleTrees.push({ sprite: treeSprite(tx, 60), x: tx, y: 60, solid: { ox: 7, oy: 22, w: 12, h: 10 } });
      }
    }
  }

  // THE COLOSSUS LANDMARK (§B4): STARFALL SPIRE — a sky-tower whose footprint
  // spans a slice of the far-east blocks; you ROUND it on foot (lanes at col 125
  // west + cols 141–142 east). It backs onto Maple Street and climbs off-screen.
  // Hand-placed beyond the narrowed eastSouth so nothing it shadows is required.
  // Its centered gilt doors open into the bespoke LOBBY (lobby access ONLY — the
  // sign-canon holds: nobody goes up). Grafted here, pre-occupy, so occupyCity's
  // `!p.door` filter never hands the landmark a generic unit room.
  const spire = placeFacade('bldg_colossus_spire', 126, 63 * 16 - 4, 14, 30, { to: 'spire_lobby', tx: 152, ty: 156 });
  // the spire's own FORECOURT (M4 anchor): a paved apron at its base, west of
  // its footprint (clear of the lanes at col125/141-142), 2 planters + a
  // bench for spire_gazer to actually stand on
  const spireForecourt: PropDef[] = [
    { sprite: 'planter', x: 120.5, y: 57, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'planter', x: 120.5, y: 59, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    { sprite: 'bench', x: 122.5, y: 58, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
  ];
  g.rect(120, 56, 5, 5, '='); // the apron itself, in front of the spire

  // THE PLAZA-PARK (§5 above) gets its centerpiece: 3 trees + 2 benches
  // facing inward, on the ':' loop's inner grass — the same "room with a
  // reason to enter" language as the core's park quarter
  const plazaTrees: PropDef[] = [[113, 34], [118, 35], [115, 36]].map(([x, y]) => ({
    sprite: treeSprite(x, y), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 },
  }));
  const plazaBenches: PropDef[] = [
    { sprite: 'bench', x: 114, y: 33.4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'bench', x: 117, y: 36.5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
  ];

  // THE PARKING LOT (§5 above, x74-82/y56-61) gets a meter row along its
  // north curb, same canon parking_meter solid the core uses
  const lotMeters: PropDef[] = [76, 78, 80].map((x) => ({
    sprite: 'parking_meter', x: x + 0.3, y: 55.6, solid: { ox: 3, oy: 14, w: 4, h: 6 },
  }));

  // HYDRANTS at the south-street corners (M5 cadence: "hydrant near each
  // downtown corner") — South Street × the avenue, and × the gateway road
  const hydrants: PropDef[] = [
    { sprite: 'hydrant', x: 97, y: 49, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
    { sprite: 'hydrant', x: 105, y: 49, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
    { sprite: 'hydrant', x: 28, y: 52, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
    { sprite: 'hydrant', x: 32, y: 52, solid: { ox: 2, oy: 8, w: 6, h: 5 } },
  ];

  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  const props: PropDef[] = [
    ...core.props,
    ...eastNorth.props,
    ...downtownHigh.props,
    ...eastSouth.props,
    ...southWest.props,
    ...mapleProps,
    ...mapleTrees,
    spire,
    ...spireForecourt,
    ...plazaTrees,
    ...plazaBenches,
    ...lotMeters,
    ...hydrants,
    { sprite: 'sign', x: 8, y: 60, solid: SIGN_SOLID }, // MAPLE HEIGHTS marker
    { sprite: 'sign', x: 47, y: 48, solid: SIGN_SOLID }, // the Cage block, read from the new street
    { sprite: 'sign', x: 31, y: 70, solid: SIGN_SOLID }, // the south gateway / city line
    { sprite: 'sign', x: 138, y: 24, solid: SIGN_SOLID }, // to the relocated docks
    { sprite: 'sign', x: 124, y: 56, solid: SIGN_SOLID }, // the Starfall Spire plaza
    { sprite: 'sign', x: 86, y: 49, solid: SIGN_SOLID }, // the high-rise downtown
    // a rest point before the new south field's pressure (§A4.5) — a payphone,
    // NOT a picnic (the picnic-count pin holds: Brickton keeps exactly one)
    { sprite: 'payphone', x: 33, y: 67, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
  ];

  const npcs = [
    ...core.npcs,
    { id: 'maple_resident', sprite: 'fernLady', x: 12, y: 60, facing: 'down' as const, dialogue: 'npc_maple_resident', wander: true },
    { id: 'south_vendor', sprite: 'quarterMan', x: 60, y: 49, facing: 'down' as const, dialogue: 'npc_south_vendor' },
    { id: 'new_commuter', sprite: 'grayCommuter', x: 110, y: 22, facing: 'right' as const, dialogue: 'npc_new_commuter', wander: true },
    { id: 'dockward', sprite: 'sidewalkCritic', x: 132, y: 22, facing: 'right' as const, dialogue: 'npc_dockward' },
    // S15i (ADR-054): the high-rise downtown + the colossus each get a voice (§A11)
    { id: 'spire_gazer', sprite: 'sidewalkCritic', x: 123, y: 57, facing: 'right' as const, dialogue: 'npc_spire_gazer' },
    { id: 'downtown_suit', sprite: 'grayCommuter', x: 86, y: 48, facing: 'up' as const, dialogue: 'npc_downtown_suit', wander: true },
  ];

  const keptDoors = core.doors.filter((d) => d.to !== 'brickton_docks');
  return {
    ...core,
    grid: g.out(),
    props,
    npcs,
    signs: [
      ...core.signs,
      { x: 8, y: 60, dialogue: 'sign_maple_heights' },
      { x: 47, y: 48, dialogue: 'sign_cage_block' },
      { x: 31, y: 70, dialogue: 'sign_south_gate' },
      { x: 138, y: 24, dialogue: 'sign_new_docks' },
      { x: 124, y: 56, dialogue: 'sign_spire' },
      { x: 86, y: 49, dialogue: 'sign_downtown_high' },
      ...eastNorth.signs,
      ...downtownHigh.signs,
      ...eastSouth.signs,
      ...southWest.signs,
    ],
    phones: [...core.phones, { x: 33, y: 67 }],
    doors: [
      ...keptDoors, // the_cage gate stays byte-identical; the old docks-gap door is relocated ↓
      { x: W - 1, y: 21, w: 1, h: 3, to: 'brickton_docks', tx: 28, ty: 120, facing: 'right' },
      { x: 29, y: H - 1, w: 3, h: 1, to: 'meadow_mile', tx: 544, ty: 128, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      ...core.spawners,
      // the new districts run a city band too (clear of the gateway + fixtures)
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 108, y: 32, w: 14, h: 6 } },
      { enemies: ['pigeon_gang', 'expired_meter'], count: 1, rect: { x: 10, y: 40, w: 20, h: 6 } },
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
    spawners: [{ enemies: ['blazer_smiler', 'mandatory_memo', 'motivational_poster', 'quota_clock', 'the_suit'], count: 1, rect: { x: 3, y: 18, w: 24, h: 3 } }],
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

/** THE SPIRE — LOBBY. The colossus finally opens… eighteen tiles of it. Marble
 *  desk, palms, a runner, and a sealed elevator: the §A11 gag is that Brickton's
 *  tallest building has the city's smallest public interior. Canon stays intact
 *  (sign_spire: deck closed forever; the gazer: nobody goes through) — you can
 *  come IN, you just can't go UP. */
function buildSpireLobby(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(18, 11, 'o');
  g.rect(0, 0, 18, 2, 'O');
  g.rect(8, 4, 2, 7, 'r'); // the runner, desk to doors (the Gran Hotel idiom)
  return {
    id: 'spire_lobby',
    name: 'THE SPIRE — LOBBY',
    music: 'brickton',
    interior: true,
    grid: g.out(),
    props: [
      // the marble front desk, centered under the tower's axis
      { sprite: 'lobby_desk', x: 8, y: 2.6, solid: { ox: 0, oy: 12, w: 34, h: 12 } },
      { sprite: 'potted_palm', x: 6, y: 2.2, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'potted_palm', x: 11.2, y: 2.2, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'potted_palm', x: 1.4, y: 8.4, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'potted_palm', x: 15.6, y: 8.4, solid: { ox: 3, oy: 12, w: 10, h: 8 } },
      { sprite: 'floor_lamp', x: 3.4, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      { sprite: 'floor_lamp', x: 14.2, y: 0.9, solid: { ox: 6, oy: 26, w: 6, h: 3 } },
      // the waiting lounge nobody is ever called from
      { sprite: 'bench', x: 2.5, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 2.5, y: 7, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [
      { id: 'spire_concierge', sprite: 'grayCommuter', x: 9, y: 2, facing: 'down', dialogue: 'npc_spire_concierge', idle: true },
      { id: 'spire_lounger', sprite: 'oldTimer', x: 3, y: 6, facing: 'right', dialogue: 'npc_spire_lounger', idle: true },
    ],
    signs: [
      { x: 4, y: 1, dialogue: 'spire_directory' },
      { x: 13, y: 1, dialogue: 'spire_elevator' }, // the sealed car (no zone — it does not open)
    ],
    phones: [],
    doors: [
      { x: 8, y: 10, w: 2, h: 1, to: 'brickton', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
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
      // S17 M18 Part B (§A4.5, ADR-063): Ch.1's deli — the drugstore's
      // soda-fountain lunch counter. Crafts a FAMILY BASKET from three foods,
      // so the Americas' Ch.1 foods have a counter that packs them (Ch.2's
      // Mercado deli was the only one before). Stands at the back fountain.
      {
        id: 'deli_otter',
        sprite: 'deliKeeper',
        x: 8,
        y: 2,
        facing: 'down',
        dialogue: 'npc_deli_otter',
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
 * THE TRANSIT DEPOT (S22, ADR-114; expanded 2026-07-02) — the bus stop is a real,
 * BUSTLING building now. Three zones off an open concourse: a TICKET OFFICE alcove
 * (left, the clerk's window), the WAITING HALL (centre — the big departure board +
 * two bench rows), and a NEWSSTAND (right — cola case, papers, a vendor), worked by
 * a small crowd of travellers. Boarding still fires at the ticket window (the
 * depot_board trigger → busAsk), so the §A6 flow is untouched.
 *
 * ENTRY: the player still arrives at the NW corner (the town map's unchanged
 * busDepot door tx/ty = 120,128 → tile ~1.9,2), kept clear as an open vestibule
 * with the ticket window just to its right; the south door (tile 8,12) leads back
 * to the street. Enter NW / exit S mirrors the original depot's layout.
 */
function buildBusDepotInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(19, 13, 'w');
  g.rect(0, 0, 19, 2, 'W'); // back wall band
  g.rect(6, 2, 1, 4, 'W'); // vestibule+ticket / hall partition (open below y6)
  g.rect(13, 2, 1, 4, 'W'); // hall / newsstand partition (open below y6)
  return {
    id: 'bus_depot_int',
    name: 'OTTERBROOK TRANSIT',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // TICKET OFFICE (left; the NW corner x0-2 stays clear as the arrival vestibule)
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      // WAITING HALL (centre): the departure board + two bench rows + greenery
      { sprite: 'departure_board', x: 9, y: 2 },
      { sprite: 'bench', x: 7, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 9, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 11, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 11, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'plant_pot', x: 12, y: 3 },
      { sprite: 'trash_can', x: 12, y: 10, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      // NEWSSTAND (right alcove): cola case, counter, papers, a little greenery
      { sprite: 'cola_fridge', x: 14, y: 0.25 },
      { sprite: 'counter', x: 15, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 16, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'news_box', x: 18, y: 4, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'plant_pot', x: 18, y: 7 },
      // CONCOURSE: a payphone to save (Call Dad) + an ATM for fare money
      { sprite: 'payphone', x: 1, y: 11, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 17, y: 11, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      // the clerk keeps her window (existing dialogue); the crowd is new
      { id: 'depot_clerk', sprite: 'npc_depot_clerk', x: 4, y: 2, facing: 'down', dialogue: 'npc_depot_clerk', dialogueDay: 'npc_depot_clerk_day', idle: true },
      { id: 'depot_board_reader', sprite: 'quarterMan', x: 9, y: 3, facing: 'up', dialogue: 'npc_depot_board', idle: true, emote: 'think' },
      { id: 'depot_commuter_a', sprite: 'grayCommuter', x: 7, y: 7, facing: 'up', dialogue: 'npc_depot_commuter_a', idle: true, emote: 'think' },
      { id: 'depot_traveler', sprite: 'senora', x: 11, y: 7, facing: 'left', dialogue: 'npc_depot_traveler', idle: true },
      { id: 'depot_napper', sprite: 'oldTimer', x: 7, y: 9, facing: 'up', dialogue: 'npc_depot_napper', idle: true },
      { id: 'depot_commuter_b', sprite: 'grayCommuter', x: 11, y: 9, facing: 'up', dialogue: 'npc_depot_commuter_b', wander: true },
      { id: 'depot_kid', sprite: 'pigeonKid', x: 16, y: 6, facing: 'up', dialogue: 'npc_depot_kid', wander: true },
      { id: 'depot_vendor', sprite: 'fernLady', x: 15, y: 2, facing: 'down', dialogue: 'npc_depot_vendor', idle: true },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_bus_depot' }],
    phones: [{ x: 1, y: 11 }],
    atms: [{ x: 17, y: 11 }],
    doors: [
      { x: 8, y: 12, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    // boarding lives at the ticket window (depot_board → busAsk, same §A6 gating)
    triggers: [{ id: 'depot_board', rect: { x: 3, y: 4, w: 3, h: 1 }, once: false }],
  };
}

/* ------------------- DOWNTOWN OTTERBROOK (S22, ADR-116) -------------------
 * "Main & Vine" — a small commercial screen reached from the open pocket by the
 * Transit Depot. Two enterable shops (Hodgkin's Hardware + the Sunny Side Diner)
 * plus a flavor barbershop. Full new screen, so no frozen-core conflict; the
 * entrance façade is APPENDED to the grown town (below). Gray-boxed on shipped
 * facade/interior sprites — see docs/CH1_ART_PROMPTS.md (§2/§3) for the art pass.
 */
function buildDowntownOtterbrook(entryStreetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(28, 16);
  g.sprinkle(229, ',~ f', 0.05);
  g.rect(2, 9, 24, 2, '='); // the shopfront sidewalk
  g.rect(12, 10, 3, 6, '='); // the walk down to the way home (south edge)

  const hardware = placeFacade('bldg_brickmore', 3, 8 * 16, 5, 2, { to: 'hardware_int', tx: 120, ty: 128 });
  const diner = placeFacade('bldg_brickmore', 11, 8 * 16, 5, 2, { to: 'diner_int', tx: 120, ty: 128 });
  // S22 (ADR-120): the third shopfront is the OTTERBROOK CLINIC — the starting
  // town finally has a front-desk revive (and a back exam room), small-town scale.
  const clinic = placeFacade('bldg_brickmore', 19, 8 * 16, 5, 2, { to: 'otter_clinic_int', tx: 120, ty: 128 });

  const treeLine: Array<[number, number]> = [];
  for (let x = 0; x < 28; x += 2) treeLine.push([x, 15]);
  for (let y = 1; y < 15; y += 2) {
    treeLine.push([0, y]);
    treeLine.push([26, y]);
  }

  return {
    id: 'downtown_otterbrook',
    name: 'DOWNTOWN OTTERBROOK',
    music: 'otterbrook',
    grid: g.out(),
    props: [
      ...treeLine.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK })),
      hardware,
      diner,
      clinic,
      { sprite: 'bench', x: 16, y: 11, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 9, y: 8, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // the district plaque
      { sprite: 'sign', x: 24, y: 8, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // the clinic shingle
    ],
    npcs: [
      { id: 'downtown_loiterer', sprite: 'oldTimer', x: 18, y: 11, facing: 'down', dialogue: 'npc_pajama_day', wander: true, ifFlag: 'zapper_done' },
    ],
    signs: [
      { x: 9, y: 8, dialogue: 'sign_downtown' },
      { x: 24, y: 8, dialogue: 'sign_clinic' },
    ],
    phones: [],
    doors: [
      { x: 12, y: 15, w: 3, h: 1, to: 'otterbrook', tx: entryStreetExit.tx, ty: entryStreetExit.ty, facing: 'down', indicator: 'none' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** HODGKIN'S HARDWARE interior (S22, ADR-116) — pegboard walls, a lockbox
 *  counter, and Hodgkin himself. The night-chain's key shop (Trail Key) lands
 *  here in a later movement; for now it's a warm, browsable room. */
function buildHardwareInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'hardware_int',
    name: "HODGKIN'S HARDWARE",
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'shelf', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf', x: 1, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'shelf_b', x: 10, y: 5, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 7, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      { id: 'hodgkin', sprite: 'npc_hodgkin', x: 6, y: 2, facing: 'down', dialogue: 'npc_hodgkin', idle: true },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_hardware' }],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'downtown_otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE SUNNY SIDE DINER interior (S22, ADR-116) — counter stools, a booth, a
 *  pie case, and a waitress who feeds tired kids. (The §A4.5 Family Basket deli
 *  stays at the drugstore fountain; this is heart, not a counter.) */
function buildDinerInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'diner_int',
    name: 'THE SUNNY SIDE',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // the authored SUNNY SIDE set (booth/jukebox strip): counter-with-stools +
      // pie case run the north line; window booths take the walls; the jukebox
      // holds the NE corner. Coords use the GROWN 16×11 room (ROOMY_INTERIORS).
      { sprite: 'prop_counter_stools', x: 2.6, y: 2.8, solid: { ox: 0, oy: 8, w: 50, h: 12 } },
      { sprite: 'prop_pie_case', x: 6.2, y: 2.8, solid: { ox: 1, oy: 8, w: 28, h: 12 } },
      { sprite: 'cola_fridge', x: 10.4, y: 0.25 },
      { sprite: 'prop_jukebox', x: 12.6, y: 1.7, solid: { ox: 2, oy: 24, w: 18, h: 10 } },
      { sprite: 'prop_booth', x: 1, y: 4.8, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 12.8, y: 4.8, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'prop_booth', x: 12.8, y: 7.2, solid: { ox: 1, oy: 10, w: 32, h: 18 } },
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'diner_waitress', sprite: 'npc_waitress', x: 6, y: 2, facing: 'down', dialogue: 'npc_waitress', idle: true },
    ],
    signs: [
      { x: 9, y: 1, dialogue: 'sign_diner' },
      { x: 13, y: 3, dialogue: 'diner_jukebox' }, // read the jukebox front
    ],
    phones: [{ x: 2, y: 7 }],
    atms: [],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'downtown_otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE OTTERBROOK CLINIC — front desk (S22, ADR-120). Small-town scale: a
 *  reception counter with the doc (front-desk revive, the §A4.7 pay-to-wake
 *  flow), a couple of waiting chairs, a save payphone, and a back door to the
 *  EXAM ROOM — the "multiple rooms / multiple doors" shape, town-sized. */
function buildOtterClinicInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(14, 10, 'w');
  g.rect(0, 0, 14, 2, 'W');
  return {
    id: 'otter_clinic_int',
    name: 'OTTERBROOK CLINIC',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'bench', x: 2, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'plant_pot', x: 9, y: 6, solid: { ox: 3, oy: 14, w: 8, h: 7 } },
      { sprite: 'payphone', x: 12, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'doc_otter', sprite: 'docBrickton', x: 4, y: 2, facing: 'down', dialogue: 'npc_doc_otter', idle: true },
    ],
    signs: [{ x: 8, y: 1, dialogue: 'clinic_wall' }],
    phones: [{ x: 12, y: 7 }],
    doors: [
      { x: 6, y: 9, w: 2, h: 1, to: 'downtown_otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
      // the back door to the EXAM ROOM (a second enterable room)
      { x: 11, y: 2, w: 1, h: 1, to: 'otter_clinic_exam', tx: 48, ty: 64, facing: 'down', indicator: 'door' },
    ],
    spawners: [],
    triggers: [],
  };
}

/** THE OTTERBROOK CLINIC — exam room (S22, ADR-120). A cot, a privacy curtain,
 *  one nervous patient, and the door back to the front desk. */
function buildOtterClinicExam(): MapDef {
  const g = new Grid(12, 9, 'w');
  g.rect(0, 0, 12, 2, 'W');
  return {
    id: 'otter_clinic_exam',
    name: 'OTTERBROOK CLINIC — EXAM',
    music: 'home',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'cot', x: 6, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'cot', x: 9, y: 2.4, solid: { ox: 1, oy: 12, w: 18, h: 10 } },
      { sprite: 'water_cooler', x: 1, y: 5.2, solid: { ox: 1, oy: 10, w: 10, h: 11 } },
      { sprite: 'poster_chart', x: 4, y: 0.55 },
    ],
    npcs: [
      { id: 'clinic_patient', sprite: 'pajamaKid', x: 7, y: 4, facing: 'down', dialogue: 'npc_clinic_patient', idle: true, emote: 'think' },
    ],
    signs: [{ x: 3, y: 1, dialogue: 'clinic_exam_sign' }],
    phones: [],
    doors: [
      { x: 2, y: 2, w: 1, h: 1, to: 'otter_clinic_int', tx: 184, ty: 64, facing: 'down', indicator: 'door' },
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
      // 2026-07-02 venue pass: REAL supermarket furniture — packed aisle runs,
      // a freezer wall, a checkout lane (the generic shelves read as a library)
      { sprite: 'mart_aisle', x: 5, y: 4.6, solid: { ox: 0, oy: 12, w: 52, h: 12 } },
      { sprite: 'mart_aisle', x: 9.6, y: 6.6, solid: { ox: 0, oy: 12, w: 52, h: 12 } },
      { sprite: 'freezer_case', x: 8.6, y: 1.7, solid: { ox: 1, oy: 12, w: 34, h: 12 } },
      { sprite: 'checkout_lane', x: 4.4, y: 7.9, solid: { ox: 1, oy: 10, w: 40, h: 12 } },
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
      // S15i Task 6 (ADR-059): the gate now returns to THE CAGE PARK (you walked in
      // through it); the park carries you back to Brickton (symmetric approach)
      { x: 19, y: 1, w: 2, h: 1, to: 'cage_park', tx: 192, ty: 32, facing: 'up' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------- THE CAGE PARK — the walk-through approach (S15i Task 6, ADR-059) ------------- *
 * The user's decree: THE CAGE shouldn't open straight off a Brickton door — it should
 * have a real neighbourhood PARK in front of it. Brickton's frozen cage gate re-routes
 * (at the GROWN level, like the docks) THROUGH this park; you cross courts, benches, a
 * community MURAL and "THE CAGE →" signage, then WALK INTO buildTheCage. Its OWN skin
 * roster (AREA_SKINS.cage_park — gritty rec-block faces). A present + a cutscene earn it.
 */
function buildCagePark(): MapDef {
  const W = 26;
  const H = 22;
  const g = new Grid(W, H, '.');
  g.sprinkle(2059, ',~ f', 0.07);
  // the cage's outer chain-link rings the NORTH; a gate gap at the path's head
  g.rect(0, 0, W, 1, 'C');
  g.rect(11, 0, 3, 1, 'q'); // the gate gap (asphalt threshold → the_cage)
  g.rect(0, 1, 1, H - 3, '|'); // west park fence
  g.rect(W - 1, 1, 1, H - 3, '|'); // east park fence
  // the central path: the gate down to the city sidewalk
  g.rect(11, 1, 3, 18, ':');
  // the city edge — sidewalk the rec-block backs onto + the Brickton return
  g.rect(0, 19, W, 3, '=');
  // THE PRACTICE HALF-COURT (east) — a taste of what's ahead
  g.rect(16, 4, 8, 9, 'q');
  g.rect(17, 4, 6, 1, 'h'); // baseline
  g.rect(17, 12, 6, 1, 'h'); // baseline
  g.rect(20, 5, 1, 7, 'v'); // the lone center stripe
  g.set(18, 9, 'z'); // a crack the summers left

  // the rec-block on the city edge — TWO faces from THE CAGE PARK's OWN roster,
  // hand-placed at their true size (ADR-053 spacing) in the SOUTH corners, framing
  // the entrance (clear of the path + the courts + the present)
  const recA = AREA_SKINS.cage_park[0];
  const recB = AREA_SKINS.cage_park[3 % AREA_SKINS.cage_park.length];
  const dimA = facadeDims(recA);
  const dimB = facadeDims(recB);
  const recCenter = placeFacade(recA, 1, 19 * 16 - 4, dimA.w, dimA.u);
  const recStore = placeFacade(recB, W - 1 - dimB.w, 19 * 16 - 4, dimB.w, dimB.u);

  const OAK_S = { ox: 7, oy: 22, w: 12, h: 10 };
  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  // a hidden PRESENT — a basket left on the grass, north-west of the path where the
  // benches end (open grass, clear of every building + the courts)
  const gift: PropDef[] = [
    { sprite: 'gift_box', x: 8, y: 7, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'cage_park_gift' },
    { sprite: 'gift_box_open', x: 8, y: 7, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'cage_park_gift' },
  ];

  return {
    id: 'cage_park',
    name: 'CAGE PARK',
    music: 'cage',
    grid: g.out(),
    props: [
      recCenter,
      recStore,
      // THE MURAL — a free-standing handball wall on the west, the park's heart
      { sprite: 'cage_mural', x: 2, y: 6, solid: { ox: 0, oy: 6, w: 46, h: 24 } },
      // a practice backboard at the court's head
      { sprite: 'backboard', x: 19, y: 3.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
      // benches to watch from, a fountain, a couple of trees
      { sprite: 'bench', x: 7, y: 10, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 7, y: 12, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'trash_can', x: 15, y: 16, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: treeSprite(4, 4), x: 4, y: 4, solid: OAK_S },
      { sprite: treeSprite(22, 17), x: 22, y: 17, solid: OAK_S },
      ...gift,
      // signage: the cage is THIS way (north), and the park's plaque
      { sprite: 'sign', x: 9, y: 2, solid: SIGN_SOLID }, // THE CAGE →
      { sprite: 'sign', x: 8, y: 8, solid: SIGN_SOLID }, // the mural plaque
      { sprite: 'sign', x: 14, y: 18, solid: SIGN_SOLID }, // welcome to the park
    ],
    npcs: [
      { id: 'park_old_head', sprite: 'quarterMan', x: 9, y: 10, facing: 'right', dialogue: 'npc_park_old_head', wander: true },
      { id: 'park_kid', sprite: 'pigeonKid', x: 18, y: 7, facing: 'down', dialogue: 'npc_park_kid', wander: true },
    ],
    signs: [
      { x: 9, y: 2, dialogue: 'sign_cage_this_way' },
      { x: 8, y: 8, dialogue: 'sign_cage_mural' },
      { x: 14, y: 18, dialogue: 'sign_cage_park' },
      // the present (gift-box pattern, gated)
      { x: 8, y: 8, dialogue: 'cage_park_gift', unlessFlag: 'cage_park_gift' },
      { x: 8, y: 8, dialogue: 'cage_park_gift_done', ifFlag: 'cage_park_gift' },
    ],
    phones: [],
    doors: [
      // north through the chain-link gate INTO THE CAGE
      { x: 11, y: 0, w: 3, h: 1, to: 'the_cage', tx: 320, ty: 60, facing: 'up' },
      // south back onto the Brickton sidewalk (the cage-gate area)
      { x: 11, y: H - 1, w: 3, h: 1, to: 'brickton', tx: 808, ty: 402, facing: 'down' },
    ],
    spawners: [],
    triggers: [
      // the first-arrival beat — the park, the mural, a ball bouncing somewhere ahead
      { id: 'cage_park_reveal', rect: { x: 10, y: 16, w: 5, h: 3 }, once: true },
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

// doorstepOf lives in mapkit.ts (S14 extraction — byte-identical)

const otterbrookMap = growOtterbrook();
const bricktonMap = growBrickton();
// THE LONG WALK (ADR-056) — the four foot legs, with computed inter-leg doors.
const longWalk = buildLongWalk();
// Brickton's foot exit now lands on the OVERPASS (its city-adjacent leg), a few
// tiles WEST of the orientation gate so arriving never bounces you back through
// it — computed off the overpass's real trail (ADR-012), facing home (west). The
// frozen 2077 core is untouched: only this one appended door's target is rewritten.
{
  const op = longWalk.meadow_overpass;
  const opX = op.grid[0].length - 5;
  const opY = trailRowAt(op.grid, opX);
  const foot = bricktonMap.doors.find((d) => d.to === 'meadow_mile');
  if (foot) {
    foot.to = 'meadow_overpass';
    foot.tx = opX * 16 + 8;
    foot.ty = opY * 16;
    foot.facing = 'left';
  }
}
// S15i Task 6 (ADR-059): THE CAGE gate now opens THROUGH the new CAGE PARK (the
// user's "give the cage a real park in front" decree). A post-build fixup on the
// live map — exactly like the foot door above — so the frozen 2077 core's literal
// door stays byte-identical (it still reads → the_cage); only MAPS.brickton's door
// target is rewritten, landing you on the park's south path before the courts.
{
  const cage = bricktonMap.doors.find((d) => d.to === 'the_cage');
  if (cage) {
    cage.to = 'cage_park';
    cage.tx = 200; // tile 12 — one tile inside the park's south gate (its brickton
    cage.ty = 332; // door at y:21); the welcome rect (y:16-18) still fires on the walk north
  }
}
const cityHallDoorstep = doorstepOf(otterbrookMap, 'otterbrook_cityhall') ?? { tx: 104, ty: 672 };
const otterStationDoorstep = doorstepOf(otterbrookMap, 'otter_station') ?? { tx: 248, ty: 680 };
const busDepotDoorstep = doorstepOf(otterbrookMap, 'bus_depot_int') ?? { tx: 760, ty: 392 };
// S22 (ADR-116) — DOWNTOWN: the entry doorstep on the grown town, then the street
// screen, then its two shop interiors (doorsteps computed off the street map).
const downtownStep = doorstepOf(otterbrookMap, 'downtown_otterbrook') ?? { tx: 728, ty: 544 };
const downtownMap = buildDowntownOtterbrook(downtownStep);
const hardwareStep = doorstepOf(downtownMap, 'hardware_int') ?? { tx: 96, ty: 150 };
const dinerStep = doorstepOf(downtownMap, 'diner_int') ?? { tx: 224, ty: 150 };
const otterClinicStep = doorstepOf(downtownMap, 'otter_clinic_int') ?? { tx: 352, ty: 150 };
const deptDoorstep = doorstepOf(bricktonMap, 'dos_f1') ?? { tx: 489, ty: 121 };
const martDoorstep = doorstepOf(bricktonMap, 'starmart_int') ?? { tx: 80, ty: 121 };
const spireStep = doorstepOf(bricktonMap, 'spire_lobby') ?? { tx: 2128, ty: 1013 };
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
  // S15i Task 6 (ADR-059): the tee path runs ON west to a gate in the cliff wall —
  // the road to THE LINKS proper (the subdivision + course + the real clubhouse)
  g.rect(1, 8, 5, 2, ':');
  g.set(0, 8, ':');
  g.set(0, 9, ':');
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
      // (removed) the clifftop 'LINKS' clubhouse — it duplicated THE LINKS
      // building on the very next screen (golf_resort / THE LINKS ESTATES), so
      // it's gone; the clifftop is just the gate now (ADR-059, the gate door
      // west to golf_resort still stands in doors[] below)
      // the first tee's plaque
      { sprite: 'sign', x: 5, y: 7, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // the gate marker — to the subdivision + the clubhouse
      { sprite: 'sign', x: 2, y: 10, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
      // palms read as the coast's trees (the standard canvas, ADR-019)
      { sprite: 'tree_b', x: 2, y: 2 },
      { sprite: 'tree_b', x: 23, y: 13 },
      { sprite: 'tree', x: 8, y: 13 },
    ],
    npcs: [
      // S15i Task 6 (ADR-059): FITO the caddy moved INTO the new clubhouse (the
      // round-start is indoors now); a starter greets you at the clifftop gate
      { id: 'links_starter', sprite: 'caddy', x: 4, y: 9, facing: 'left', dialogue: 'npc_links_starter', wander: true },
    ],
    signs: [
      { x: 5, y: 8, dialogue: 'sign_costa' },
      { x: 2, y: 10, dialogue: 'sign_links_gate' },
    ],
    phones: [],
    atms: [],
    doors: [
      // S14 (Prompt 28): THE ONE-LINE WIRE — the resort joins the world
      COSTA_DOOR_FOR_PUERTO_SOL,
      // S15i Task 6 (ADR-059): west through the cliff gate to THE LINKS proper
      { x: 0, y: 8, w: 1, h: 2, to: 'golf_resort', tx: 224, ty: 320, facing: 'left' },
    ],
    spawners: [],
    triggers: [],
  };
}

/* ------------- THE GOLF RESORT — the subdivision approach (S15i Task 6, ADR-059) ------------- *
 * The user's decree: golf shouldn't START by talking to a caddy on a bare lawn — it should
 * be an EXPENSIVE place you walk through. Off costa_estrella's clifftop gate, a manicured
 * SUBDIVISION: pastel MANSIONS lining a cart path, fairway + bunkers + a water hazard, a
 * gatehouse, "THE LINKS →" signage, a present, a cutscene — then you WALK INTO the grand
 * CLUBHOUSE interior, where FITO starts your round (moved indoors from costa). Its OWN skin
 * roster (AREA_SKINS.golf_resort — the new mansion sprites). The course tile is 'm' (fairway).
 */
function buildGolfResort(costaStep: { tx: number; ty: number }): MapDef {
  const W = 30;
  const H = 22;
  const g = new Grid(W, H, '.');
  g.sprinkle(2061, ',~,~ f', 0.05);
  // the manicured FAIRWAY runs the WEST, a putting GREEN at the NE, a water hazard
  g.rect(1, 2, 8, 15, 'm');
  g.rect(2, 17, 5, 3, 'n'); // a sand bunker
  g.rect(21, 3, 7, 6, 'm'); // the practice green
  g.rect(23, 10, 3, 3, 'e'); // a water hazard (you walk around)
  g.rect(22, 9, 5, 1, 'E'); // its foam lip
  g.rect(22, 13, 5, 1, 'E');
  // the cart path: the clifftop gate (south) up to the clubhouse forecourt (north)
  g.rect(13, 1, 3, 20, ':');
  // clipped hedges line the manicured edges (geometric, the resort look)
  g.rect(10, 4, 1, 12, 'b');
  g.rect(18, 4, 1, 12, 'b');
  g.rect(11, 19, 8, 1, 'b'); // a low hedge by the entrance
  g.rect(13, 19, 3, 1, ':'); // ...with the cart path passing THROUGH it (the gate gap, ADR-059) — the hedge must never seal the entrance plaza off from the course
  // the clubhouse forecourt (north) + the entrance plaza (south)
  g.rect(10, 1, 9, 1, '=');
  g.rect(11, 20, 7, 2, '=');
  // flower beds where the gardeners insist
  g.set(20, 5, 'f'); g.set(26, 7, 'F'); g.set(9, 12, 'f'); g.set(4, 6, 'F');

  // THE GRAND CLUBHOUSE (north) — opens into the pro-shop interior; + the gatehouse
  // (south) by the entrance. Both from the resort's OWN roster (drawHouse mansions
  // are houses, so these are hand-placed, not buildDistrict'd).
  const clubhouse: PropDef = {
    sprite: 'clubhouse_grand', x: 11, y: 0.4, solid: { ox: 0, oy: 28, w: 128, h: 30 },
    door: { ox: 56, oy: 58, w: 16, h: 18, to: 'golf_clubhouse', tx: 128, ty: 150 },
  };
  const gatehouse: PropDef = { sprite: 'golf_gatehouse', x: 19, y: 17, solid: { ox: 0, oy: 20, w: 80, h: 28 } };
  // THE MANSIONS — three, lining the cart path's east side, set back behind the hedge
  const mansions: PropDef[] = [
    { sprite: 'mansion_c', x: 20, y: 2.4, solid: { ox: 0, oy: 30, w: 112, h: 40 } },
    { sprite: 'mansion_a', x: 2, y: 8.4, solid: { ox: 0, oy: 34, w: 112, h: 44 } },
    { sprite: 'mansion_b', x: 21, y: 12.4, solid: { ox: 0, oy: 34, w: 96, h: 40 } },
  ];

  const PALM_S = { ox: 7, oy: 22, w: 12, h: 10 };
  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  // a hidden PRESENT — a cooler left at the turn (open grass by the green)
  const gift: PropDef[] = [
    { sprite: 'gift_box', x: 26, y: 6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, unlessFlag: 'golf_resort_gift' },
    { sprite: 'gift_box_open', x: 26, y: 6, solid: { ox: 1, oy: 7, w: 12, h: 6 }, ifFlag: 'golf_resort_gift' },
  ];

  return {
    id: 'golf_resort',
    name: 'THE LINKS ESTATES',
    music: 'cage',
    settlement: 'village',
    grid: g.out(),
    props: [
      clubhouse,
      gatehouse,
      ...mansions,
      ...gift,
      { sprite: 'tree_b', x: 8, y: 3, solid: PALM_S },
      { sprite: 'tree', x: 27, y: 16, solid: PALM_S },
      // signage
      { sprite: 'sign', x: 12, y: 18, solid: SIGN_SOLID }, // THE LINKS / welcome
      { sprite: 'sign', x: 16, y: 2, solid: SIGN_SOLID }, // CLUBHOUSE / pro shop →
    ],
    npcs: [
      { id: 'estate_gardener', sprite: 'fernLady', x: 9, y: 8, facing: 'right', dialogue: 'npc_estate_gardener', wander: true },
      { id: 'estate_member', sprite: 'oldTimer', x: 17, y: 14, facing: 'left', dialogue: 'npc_estate_member' },
    ],
    signs: [
      { x: 12, y: 18, dialogue: 'sign_links_welcome' },
      { x: 16, y: 2, dialogue: 'sign_links_clubhouse' },
      { x: 26, y: 7, dialogue: 'golf_resort_gift', unlessFlag: 'golf_resort_gift' },
      { x: 26, y: 7, dialogue: 'golf_resort_gift_done', ifFlag: 'golf_resort_gift' },
    ],
    phones: [],
    doors: [
      // south back to costa_estrella's clifftop gate (just inside it)
      { x: 13, y: H - 1, w: 3, h: 1, to: 'costa_estrella', tx: costaStep.tx, ty: costaStep.ty, facing: 'down' },
    ],
    spawners: [],
    triggers: [
      // the first-arrival beat — the manicured course, the mansions, the clubhouse ahead
      { id: 'golf_resort_reveal', rect: { x: 12, y: 17, w: 5, h: 3 }, once: true },
    ],
  };
}

/**
 * THE CLUBHOUSE — the expensive pro-shop interior where the round now starts (the
 * caddy FITO moved indoors). A warm room: the counter, club racks, a trophy case,
 * the leaderboard. The bottom door rides back to the resort's clubhouse doorstep.
 */
function buildGolfClubhouse(resortExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(5, 4, 6, 2, 'r'); // a green runner to the counter
  return {
    id: 'golf_clubhouse',
    name: 'THE LINKS — CLUBHOUSE',
    music: 'cage',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 7, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } }, // club racks
      { sprite: 'shelf_b', x: 13, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'chalk_board', x: 2, y: 7, solid: { ox: 1, oy: 14, w: 31, h: 7 } }, // the leaderboard
      { sprite: 'planter', x: 13, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    ],
    npcs: [
      // FITO runs both formats from behind the counter now (the round-start, indoors)
      { id: 'caddy', sprite: 'caddy', x: 8, y: 2, facing: 'down', dialogue: 'npc_caddy' },
    ],
    signs: [{ x: 4, y: 1, dialogue: 'sign_clubhouse_wall' }],
    phones: [],
    doors: [
      { x: 7, y: 10, w: 2, h: 1, to: 'golf_resort', tx: resortExit.tx, ty: resortExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    triggers: [],
  };
}

const chapelDoorstep = doorstepOf(otterbrookMap, 'chapel_int') ?? { tx: 521, ty: 372 };
const hospitalDoorstep = doorstepOf(bricktonMap, 'hospital_int') ?? { tx: 320, ty: 121 };

/**
 * THE USER'S "BIGGER ROOMS" DECREE — a small interior used to FLOAT tiny in the
 * void (a 9×8 room filled ~⅓ of the screen, the hero lost in a sea of black).
 * Grow it to a comfortable minimum: pad FLOOR on the right + bottom so existing
 * content stays put (top-left anchored — the entry spawn still lands inside),
 * keep the top WALL band across the new width, and ride the bottom EXIT door
 * down to the new floor edge. Standard single-room interiors only; the validator
 * re-checks door-landing + reachability on the grown grid (its safety net).
 */
function growInterior(map: MapDef, minW: number, minH: number): MapDef {
  const grid = map.grid;
  const H = grid.length;
  const W = grid[0].length;
  const newW = Math.max(W, minW);
  const newH = Math.max(H, minH);
  if (newW === W && newH === H) return map;
  const wall = grid[0][0];
  // the top WALL band = the leading rows that are entirely the wall char
  let wallRows = 0;
  while (wallRows < H && [...grid[wallRows]].every((c) => c === wall)) wallRows += 1;
  // FLOOR = the most common char below the wall (handles 'w'/'a'/'o' + rugs)
  const counts = new Map<string, number>();
  for (let y = wallRows; y < H; y++) for (const ch of grid[y]) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let floor = grid[H - 1][0];
  let best = -1;
  for (const [ch, n] of counts) if (n > best) { best = n; floor = ch; }
  const padR = newW - W;
  const rows = grid.map((row, y) => (y < wallRows ? wall.repeat(newW) : row + floor.repeat(padR)));
  for (let y = H; y < newH; y++) rows.push(floor.repeat(newW));
  // the bottom exit door rides to the new floor edge (interiors exit downward)
  const doors = map.doors.map((d) => (d.y >= H - 1 ? { ...d, y: newH - 1 } : d));
  return { ...map, grid: rows, doors };
}

// S15i Task 6 (ADR-059): the golf resort + clubhouse, with computed doorsteps —
// the resort returns you just inside costa's west gate; the clubhouse rides back to
// the resort's grand-clubhouse doorstep (the doorstepOf pattern).
const golfResortMap = buildGolfResort({ tx: 24, ty: 128 });
const golfClubhouseStep = doorstepOf(golfResortMap, 'golf_clubhouse') ?? { tx: 224, ty: 32 };
const golfMaps = {
  golf_resort: golfResortMap,
  golf_clubhouse: buildGolfClubhouse(golfClubhouseStep),
};

/* ─────────────────────────────────────────────────────────────────────────
 * elev_spike — WORLD-OVERHAUL ELEVATION SPIKE (dev-only; window.mfWarp('elev_spike'))
 *
 * The FIRST map to opt into the true multi-level engine (World Overhaul P2). A
 * single 2-row cliff separates a LOWER ground (level 0, south) from an UPPER
 * terrace (level 1, north), joined by ONE 3-wide stair. Purpose: prove the
 * walk-behind overlay (a level-0 player who walks up to the cliff passes BEHIND
 * its face) + the player-level scalar (climbing the stair lifts you onto the
 * terrace). Reached ONLY by the dev warp — NOT wired into any shipped map — and
 * allowlisted in src/data/elevation.test.ts. Base tiles are the placeholder
 * in-plane cliff kit ('K'/'^'/'T'); the authored LAYERED cliff art is P4. See
 * docs/WILDERNESS_DESIGN_LANGUAGE.md § Elevation.
 * ──────────────────────────────────────────────────────────────────────── */
const ELEV_SPIKE_W = 24;
const ELEV_SPIKE_H = 18;
function buildElevSpike(): MapDef {
  const g = new Grid(ELEV_SPIKE_W, ELEV_SPIKE_H); // fill '.' grass
  // the cliff band: '^' lip (row 6) over a 2-row 'K' face (rows 7-8), with one
  // 3-wide 'T' stair cut through it (cols 10-12) joining terrace ↔ ground.
  g.rect(0, 6, ELEV_SPIKE_W, 1, '^');
  g.rect(0, 7, ELEV_SPIKE_W, 2, 'K');
  g.rect(10, 6, 3, 3, 'T'); // stair: row 6 (top, on the terrace) + rows 7-8 (through the face)
  const grid = g.out();
  // the parallel LEVEL plane, GENERATED from the grid so dimensions match exactly
  // (elevation.test.ts asserts this). Rows 0-6 = terrace + lip (level 1); the K
  // face rows 7-8 stay level 1 (they ARE the upper terrace's front wall, so the
  // overlay lifts them); the stair cells below the lip drop to level 0 so stepping
  // DOWN the stair lowers you; rows 9+ = ground (level 0).
  const level = grid.map((rowStr, y) =>
    rowStr
      .split('')
      .map((ch) => {
        if (y <= 6) return '1';
        if (y <= 8) return ch === 'T' ? '0' : '1';
        return '0';
      })
      .join(''),
  );
  return {
    id: 'elev_spike',
    name: 'ELEVATION SPIKE',
    music: 'hill',
    grid,
    elevation: { level },
    props: [
      // depth cues: trees on the upper terrace (north) + on the ground (south)
      { sprite: treeSprite(3, 2, true), x: 3, y: 2, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(20, 2, true), x: 20, y: 2, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(4, 15, true), x: 4, y: 15, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
      { sprite: treeSprite(19, 15, true), x: 19, y: 15, solid: { ox: 7, oy: 22, w: 12, h: 10 } },
    ],
    npcs: [],
    signs: [],
    phones: [],
    doors: [],
    spawners: [],
    triggers: [],
  };
}

export const MAPS: Record<string, MapDef> = {
  ...buildChapter2Maps({ chapelStep: chapelDoorstep, hospitalStep: hospitalDoorstep }),
  // S18 (ADR-095) — CHAPTER 3 England (Half 1: maps + encounters + shops; the
  // manifest stays 'unlanded' until the story/boss half flips it)
  ...buildChapter3Maps(),
  // CHAPTER 4 Norway — "The Fjord That Sleeps" (Kvisthavn / Bootstep Moor /
  // Lilleby / the Sleeper's Spine). Lands SHIPPED with its story/boss wiring.
  ...buildChapter4Maps(),
  // CHAPTER 5 Minimus — "The Grand Duchy of Minimus" (Minimus Major / the
  // Procession Way / the Hedgerow / the Ducal Crown). Lands SHIPPED at the flip.
  ...buildChapter5Maps(),
  // CHAPTER 6 Africa — "The Ruins That Laugh" (Zanzibel / the Savanna Run / the
  // Laughing Ruins / the Sphinx's chin). The BRANCH's home (Held Breath + Choice 1).
  ...buildChapter6Maps(),
  // CHAPTER 7 India — "The Cobra's Palace" (Chandrapore / the Monsoon Road / the
  // night train / the palace throne). A straight chapter (no branch beat).
  ...buildChapter7Maps(),
  // CHAPTER 8 China — "The Paper Dragon" (Lotus Harbor / the Bamboo Road / the
  // Spore Forest / the Mt. Shu temple). A straight chapter (no branch beat).
  ...buildChapter8Maps(),
  // CHAPTER 9 Romania — "The Count of Valea Stelelor" (Valea Stelelor / the Old Road /
  // Castle Hoaxula / Stone Brow Monastery). Carries the COMPASSION axis (CHOICE 2).
  ...buildChapter9Maps(),
  // CHAPTER 10 — "The Long Shot" (Aurora Station / the Aurora Ice Field / Mauna Lani /
  // the Lani Magma Flats / the Sea of Silence). THE FINALE — carries the FINALE axis
  // (CHOICE 3) and the bespoke Hush fight; the composed ending plays over the walk home.
  ...buildChapter10Maps(),
  otterbrook: otterbrookMap,
  // THE LONG WALK — the four foot legs (Otterbrook → woods → far meadow → overpass)
  ...longWalk,
  hill_road: buildHillRoad(),
  // S22 (ADR-112) — THE LONGER CLIMB: two legs between the road and the crater
  hickory_trail: buildHickoryTrail(),
  whisperwood_rise: buildWhisperwoodRise(),
  hickory_hill: buildHill(),
  // THE UNDER-OAK (ADR-121 rework) — the directed BOSS 1 descent
  oak_roots: buildOakRoots(),
  oak_hollow: buildOakHollow(),
  oak_heart: buildOakHeart(),
  rex_home: buildRexHome(),
  rex_bedroom: buildBedroom(),
  rex_hall: buildRexHall(),
  ana_room: buildAnaRoom(),
  vivi_room: buildViviRoom(),
  brickton: bricktonMap,
  dos_f1: buildDosF1(deptDoorstep),
  dos_f2: buildDosF2(),
  dos_f3: buildDosF3(),
  spire_lobby: buildSpireLobby(spireStep), // THE SPIRE's gilt doors — lobby access only

  otterbrook_cityhall: buildOtterbrookCityHallInt(cityHallDoorstep),
  otter_station: buildOtterStationInt(otterStationDoorstep),
  bus_depot_int: buildBusDepotInt(busDepotDoorstep),
  downtown_otterbrook: downtownMap,
  hardware_int: buildHardwareInt(hardwareStep),
  diner_int: buildDinerInt(dinerStep),
  otter_clinic_int: buildOtterClinicInt(otterClinicStep),
  otter_clinic_exam: buildOtterClinicExam(),
  drugstore_int: buildDrugstoreInt(drugDoorstep),
  starmart_int: buildStarmartInt(martDoorstep),
  arcade_int: buildArcadeInt(arcadeDoorstep),
  arcade2_int: buildArcade2Int(arcade2Doorstep),
  the_cage: buildTheCage(),
  cage_park: buildCagePark(), // S15i Task 6 (ADR-059) — the walk-through approach
  costa_estrella: buildCostaEstrella(),
  ...golfMaps, // S15i Task 6 (ADR-059) — the golf resort + clubhouse (computed doorsteps)
  bus_interior: buildBusInterior(),
  // WORLD-OVERHAUL P2 — the opt-in elevation spike (dev-only, window.mfWarp)
  elev_spike: buildElevSpike(),
};

// the user's decree — the cramped single-room interiors fill the screen now
// (no camera zoom, which would scale the HUD; the rooms themselves grow). Multi-
// room houses, vehicles, and the already-roomy halls (museum/hospital/dos) keep
// their hand-built size.
const ROOMY_INTERIORS: readonly string[] = [
  'drugstore_int', 'starmart_int', 'arcade_int', 'arcade2_int',
  'rex_bedroom', 'ana_room', 'vivi_room', 'otterbrook_cityhall', 'otter_station', 'bus_depot_int',
  'hardware_int', 'diner_int', 'otter_clinic_int',
  'mercado_int', 'clinic_ps_int', 'deli_int', 'chapel_int',
  'valle_shop_int', 'clinic_valle_int', 'chapel_valle_int',
];
for (const id of ROOMY_INTERIORS) if (MAPS[id]) MAPS[id] = growInterior(MAPS[id], 16, 11);

/* THE OTHER HALF OF THE DECREE — growInterior rides a room's bottom exit mat
 * down to the grown floor edge, but every INBOUND landing was authored against
 * the SMALL room, so it still aims at the old threshold row — dropping the
 * player mid-floor ("I enter my sister's room and appear in the middle of it").
 * Re-aim every door/prop-door landing that targets a grown room at the room's
 * OWN return door: mouth center-x, feet ONE TILE INSIDE the threshold — the
 * same interior cell the door-audit measures snugness against (mapcheck
 * doorCell). The inline tx/ty literals on source maps remain as the pre-grow
 * numbers; this pass is the single authority for grown-room entries. */
{
  const roomy = new Set<string>(ROOMY_INTERIORS);
  const reAim = (d: { to: string; tx: number; ty: number }, from: string): void => {
    const room = MAPS[d.to];
    const back = room?.doors.find((rd) => rd.to === from);
    if (!room || !back || back.indicator === 'stairs' || back.indicator === 'elevator') return;
    const cx = Math.floor(back.x + back.w / 2);
    const cy = Math.floor(back.y + back.h / 2);
    const dir: Record<string, [number, number]> = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };
    const [dx, dy] = dir[back.facing] ?? [0, 0];
    if (dx === 0 && dy === 0) return;
    // step off the zone, then past the wall BAND if the zone sits IN it (an
    // 'up' door hangs in the 2-row top wall; its mouth is the first floor row
    // below) — the same grid[0][0] wall-char read growInterior itself uses.
    const wall = room.grid[0][0];
    let ix = cx + dx;
    let iy = cy + dy;
    for (let hops = 0; hops < 3 && iy >= 0 && ix >= 0 && iy < room.grid.length && ix < room.grid[0].length && room.grid[iy][ix] === wall; hops++) {
      ix += dx;
      iy += dy;
    }
    if (iy < 0 || ix < 0 || iy >= room.grid.length || ix >= room.grid[0].length || room.grid[iy][ix] === wall) return; // keep the authored landing
    d.tx = ix * 16 + 8; // tile interior (ADR-136): the body box fits the one cell
    d.ty = iy * 16 + 12;
  };
  for (const [id, m] of Object.entries(MAPS)) {
    for (const d of m.doors) if (roomy.has(d.to)) reAim(d, id);
    for (const p of m.props) if (p.door && roomy.has(p.door.to)) reAim(p.door, id);
  }
}

// S18 M22 (ADR-092) — THE GLYPH LAW wired into the LIVE Americas settlement
// overworlds: each declares its canon §A5/§A6 area so the entry banner wears that
// region's decorative GLYPH script under the place name (§A11.8, §A11.6-safe). The
// unlanded regions inherit the same hook when their maps land — the GLYPH_SCRIPT
// registry already pins every canon area both directions. (validator: map.area
// must be a real GLYPH_SCRIPT key.)
const MAP_AREA: Record<string, string> = {
  otterbrook: 'otterbrook',
  oak_roots: 'otterbrook',
  oak_hollow: 'otterbrook',
  oak_heart: 'otterbrook',
  brickton: 'brickton',
  cage_park: 'cage_park',
  puerto_sol: 'puerto_sol',
  // S18 (ADR-095) — CHAPTER 3 England: the stone town wears its M22 `fraktur`
  // glyph banner (§A11.8) over the M25 fog-stone skin. The academy + the moor
  // maps add their 'wintermoor' rows when they land.
  foggybottom: 'foggybottom',
  wintermoor_grounds: 'wintermoor',
  // CH.4 Norway — the two settlements wear their own M25 skins + glyph banners
  kvisthavn: 'kvisthavn',
  lilleby: 'lilleby',
  // CH.5 Minimus — the capital wears the heraldic duchy hand (§A11; banner reads
  // MINIMUS MAJOR). The road/maze/crown carry no settlement glyph (like the moor/spine).
  minimus_major: 'minimus',
  // CH.10 The Long Shot — the two settlements wear their region glyph banners (AURORA STATION
  // in the frost script, MAUNA LANI in the tiki script). The ice field / magma flats / Sea of
  // Silence carry no settlement glyph (like the moor/spine), matching the tile-skin precedent.
  aurora_station: 'aurora',
  mauna_lani: 'mauna_lani',
};
for (const [id, area] of Object.entries(MAP_AREA)) if (MAPS[id]) MAPS[id].area = area;

// ─── THE LIVING-CITY PASS (S18) — alive by DEFAULT ──────────────────────────
// Every grown settlement runs through occupyCity: ~90% of its catalog facades get
// a door into a footprint-sized interior (homes / shops / cafes / offices /
// clinics), and the locked ~10% answer a knock with EarthBound-weird refusals.
// The pass mutates the live map and merges its generated interiors into MAPS. A
// NEW city becomes alive the moment it's added to this list — never dead by default.
function cityLifeSeed(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// EVERY settlement runs the pass (not a hardcoded list) — so any city, present or
// future, is alive by default. occupyCity only fills DOORLESS 'bldg_' facades, so
// hand-authored doors/interiors are untouched; a settlement with no catalog
// facades is a harmless no-op. Object.values() is a snapshot, so the interiors we
// merge in aren't re-scanned.
for (const m of Object.values(MAPS)) {
  if (!m.settlement) continue;
  Object.assign(MAPS, occupyCity(m, { area: m.area ?? m.id, seed: cityLifeSeed(m.id) }));
}

// ─── Wave 2 (ADR-108) — MAP AMBIENT AUDIO (#16) ─────────────────────────────
// A per-map ambient BED (engine/ambience.ts) layered under the music, plus an
// OPTIONAL explicit muffle override (absent → OverworldScene derives the veil from
// `interior`). Central like MAP_AREA so the whole soundscape reads in one place;
// applied LAST (after the living-city pass) so the fields can't be clobbered, across
// every chapter's maps by id. OverworldScene reads both on map load (Wave 3, #2).
const MAP_AUDIO: Record<string, { ambience?: AmbienceId; muffle?: 0 | 1 | 2 }> = {
  // CH.3 England — machine-made fog hangs wet over the stone town + the open moor
  foggybottom: { ambience: 'rain' }, // the damp town on the Tyne
  foggy_moor: { ambience: 'wind' }, // the exposed fog road
  the_old_stones: { ambience: 'wind' }, // the Resonance Site, bare to the weather
  wintermoor_grounds: { ambience: 'wind' }, // the academy's windswept grounds
  wintermoor_boiler: { ambience: 'machine', muffle: 2 }, // the Hushed mainframe's room — deep + humming
  // CH.2 South America — the working seafront + the §A6 pyramid depths
  puerto_sol: { ambience: 'waves' },
  pyramid_ante: { ambience: 'cave' },
  // CH.1 USA — the home town park + the busy second city
  otterbrook: { ambience: 'birds' }, // the pond park + civic green + woods nook
  brickton: { ambience: 'crowd' }, // the bigger city's street murmur
  // CH.4 Norway — the fjord hamlet, the exposed moor, the giants' high town, and
  // the deep warm dark inside the Sleeper (the ear sits at DEEP muffle for the boss)
  kvisthavn: { ambience: 'waves' }, // the quay under the cliffs
  bootstep_moor: { ambience: 'wind' }, // the open 10× moor
  lilleby: { ambience: 'wind' }, // the high giants' town
  spine_hand: { ambience: 'cave' },
  spine_shoulder: { ambience: 'cave' },
  spine_ear: { ambience: 'cave', muffle: 2 }, // the Resonance Site, deep in the canal
};
for (const [id, a] of Object.entries(MAP_AUDIO)) {
  const m = MAPS[id];
  if (!m) continue;
  if (a.ambience) m.ambience = a.ambience;
  if (a.muffle !== undefined) m.muffle = a.muffle;
}

// ─── Wave 2 (ADR-108) — REFLECTIVE SURFACES (#6) ────────────────────────────
// Tile rects (in tiles) over the maps' water; OverworldScene mirrors nearby actors
// below each surface line (Wave 3). Central + post-assembly like MAP_AUDIO; the
// content-validate `reflect` gate proves every rect is in-bounds AND overlaps a
// reflective (sea) tile, so a grid edit that moves the water fails the build here.
const MAP_REFLECT: Record<string, ReflectZone[]> = {
  foggybottom: [{ x: 0, y: 25, w: 40, h: 3, within: 4 }], // the river Tyne along the south lip
  otterbrook: [{ x: 99, y: 43, w: 6, h: 4, within: 3 }], // the Pond Park water feature (Eagleland re-seat)
  golf_resort: [{ x: 23, y: 10, w: 3, h: 3, within: 2 }], // the course's water hazard
  puerto_sol: [{ x: 0, y: 30, w: 52, h: 4, within: 4 }], // the working seafront
  // CH.4 Norway — the fjord, the moor gorge, and the Sleeper's meltwater fall
  kvisthavn: [{ x: 0, y: 22, w: 36, h: 2, within: 4 }], // the fjord along the south lip
  bootstep_moor: [{ x: 22, y: 1, w: 2, h: 7, within: 3 }], // the gorge water
  spine_shoulder: [{ x: 1, y: 5, w: 22, h: 2, within: 3 }], // the meltwater off the shoulder
};
for (const [id, zones] of Object.entries(MAP_REFLECT)) {
  const m = MAPS[id];
  if (m) m.reflect = zones;
}
