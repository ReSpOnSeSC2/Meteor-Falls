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
};

// treeSprite lives in mapkit.ts (S14 extraction — byte-identical)

/* ------------------------------------------------------------------ */

/* ------------------- OTTERBROOK ------------------- */

/** THE FROZEN 1995 CORE — byte-identical forever (the byte-identical test
 *  proves growOtterbrook copies it unchanged into the top-left). */
export function buildOtterbrook(): MapDef {
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

/* ------------- OTTERBROOK GROWS UP (S15h, ADR-049) ------------- */

/** the grown town's east gateway tile — MEADOW MILE (Movement 2) leaves from
 *  here. Computed from the grown bounds (W-2, the cross-lane row), never a
 *  literal baked into the road, so a re-scope can't strand it (ADR-012). */
export const OTTERBROOK_EAST_GATE = { x: 68, y: 16 } as const;

/** the solid for the standard tree (lifted from the core, byte-identical) */
const OAK: { ox: number; oy: number; w: number; h: number } = { ox: 7, oy: 22, w: 12, h: 10 };

/**
 * OTTERBROOK ~3× (1344 → 3920 tiles, inside the ≤4000 XL envelope). The frozen
 * 1995 core is COPIED byte-for-byte into the top-left of a 70×56 grid; the forge
 * lays two residential blocks SOUTH + EAST on fresh streams (organic, never a
 * strip). Every growth grid-write lands at x≥42 OR y≥32 — strictly OUTSIDE the
 * 42×32 core — so the core stays identical (the byte-identical test proves it).
 * The landmarks are HAND-BUILT: CITY HALL (a real facade into a civic interior),
 * the CIVIC GREEN (an irregular nibbled park — §B4 negative space), the POND
 * PARK (a water feature + §A4.5 picnic rests). The bus corner, lemonade stand,
 * chapel, the dos doorstep, and every 1995 prop keep their coordinates.
 */
export function growOtterbrook(): MapDef {
  const core = buildOtterbrook();
  const CW = core.grid[0].length; // 42
  const CH = core.grid.length; // 32
  const W = 70;
  const H = 56;
  const g = new Grid(W, H, '.');
  // 1) the frozen core, verbatim, in the top-left
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) g.set(x, y, core.grid[y][x]);

  // 2) THE FORGE lays two residential blocks on fresh streams (organic). Each
  //    region is wholly south of the core (y≥34) or east of it (x≥44), so the
  //    helper's region-bounded writes can never reach a core cell.
  // ADR-053: one shared footprint list so the spacing law holds ACROSS both
  // regions — no two buildings can touch at the south/east seam either
  const obOccupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  // S15i (ADR-050/054): each district draws ONLY Otterbrook's own skin roster —
  // warm, low brownstones/shops/cafés (no two areas read alike), up to 3 stories
  // over the hero (a sleepy town never towers; megas are a Brickton thing).
  const south = buildDistrict(g, { x: 28, y: 34, w: 39, h: 19 }, new Streams(19951), {
    layout: 'organic', style: 'americana', catalog: AREA_SKINS.otterbrook, lanes: 3, maxStories: 3, sprinkle: true, occupied: obOccupied,
  });
  const east = buildDistrict(g, { x: 44, y: 2, w: 23, h: 12 }, new Streams(19952), {
    layout: 'organic', style: 'americana', catalog: AREA_SKINS.otterbrook, lanes: 2, maxStories: 3, sprinkle: true, occupied: obOccupied,
  });
  // S15i (ADR-054): a wooded NOOK in the open SW corner, south of City Hall — a
  // quiet thicket with a hidden picnic at its glade (a rest you discover; §B4
  // says every grown area earns its size with a nook + a reward). Region-bounded,
  // wholly south of the core (y≥46), so the frozen 1995 core stays byte-identical.
  const thicket = buildWoods(g, { x: 1, y: 46, w: 12, h: 9 }, new Streams(19954), { gladeProp: 'picnic' });
  // §B4 (ADR-056): the nook earns a REAL hidden PRESENT beside its rest — a cached
  // Star Cola at the glade, a sibling to the picnic. Found via the thicket path
  // (the glade sits ON it); trees are cleared from its tile so it stays reachable.
  let gladeRow = 50;
  for (let y = 46; y < 55; y++) if (g.rows[y]?.[7] === ':') { gladeRow = y; break; }
  const woodsGift = walkPresent('otter_woods_gift', 9, gladeRow);
  const thicketProps = clearTreesIn(thicket.props, { x: 8, y: gladeRow - 1, w: 3, h: 3 });

  // 3) CONNECTIVE SEAMS — the main street flows south, the cross lane runs east
  //    to the gateway. Both start OUTSIDE the core (row 32 / col 42); the one-tile
  //    of core grass between (row 31 / cols 38-41) is already walkable, so the
  //    new ground joins the old without touching a single frozen cell.
  g.rect(20, 32, 2, 11, ':'); // main street → the civic spine (rows 32-42)
  g.rect(42, 16, 28, 2, ':'); // cross lane → MEADOW MILE gateway (cols 42-69, the east edge)
  g.rect(4, 42, 23, 2, ':'); // the civic lane fronting City Hall + the Green

  // 4) LANDMARK — CITY HALL: a real civic facade opening into a hand-authored
  //    interior. The draft skin is the neutral shipped brick (ADR-020: drawn art
  //    is a hand job — a bespoke "CITY HALL" facade is a promotion item; the
  //    plaque + the Mayor inside name it, and the skin carries no conflicting sign).
  const cityHall = placeFacade('bldg_brickmore', 6, 40 * 16 + 12, 6, 2, {
    to: 'otterbrook_cityhall', tx: 120, ty: 128,
  });
  g.rect(6, 41, 6, 1, '='); // the hall's front step meets the civic lane

  // 5) LANDMARK — THE CIVIC GREEN: an irregular park, corners nibbled so it
  //    never reads as a rectangle (§B4 negative space). Hedge fragments, not a
  //    wall; the interior stays open grass.
  for (const [hx, hw] of [[14, 4], [20, 5], [25, 2]] as const) g.rect(hx, 45, hw, 1, 'b');
  for (const [hx, hy] of [[14, 47], [14, 50], [26, 48], [26, 51]] as const) g.set(hx, hy, 'b');
  g.rect(15, 53, 4, 1, 'b');
  g.rect(22, 53, 3, 1, 'b');
  g.set(17, 48, 'f'); g.set(23, 49, 'F'); g.set(19, 51, 'f');

  // 6) LANDMARK — THE POND PARK: a small water feature (the sea tile reads as
  //    blue water; it is solid — you walk around it), foam at its lip, picnic
  //    tables on the bank (§A4.5 rests found before the south field's danger).
  g.rect(53, 22, 6, 4, 'e');
  g.rect(53, 21, 6, 1, 'E'); g.rect(53, 26, 6, 1, 'E');
  g.set(52, 23, 'E'); g.set(52, 24, 'E'); g.set(59, 23, 'E'); g.set(59, 24, 'E');

  // 7) LANDMARK — THE TRANSIT DEPOT (S22, ADR-114): the old bus SIGN becomes a
  //    real building fronting the cross lane (the road EAST, toward Brickton), in
  //    the open pocket west of the Pond Park. Wholly outside the frozen core, so
  //    the 1995 core stays byte-identical; the §A6 bus_stop trigger relocates to
  //    its curb (below). A waiting-room interior makes it a building you ENTER.
  g.rect(47, 17, 2, 7, ':'); // spur: the cross lane down to the depot door
  g.rect(45, 24, 6, 1, '='); // the depot's front step / boarding curb
  const busDepot = placeFacade('bldg_brickmore', 44, 23 * 16 + 12, 6, 2, {
    to: 'bus_depot_int', tx: 120, ty: 128,
  });

  // 8) DOWNTOWN entrance (S22, ADR-116): a street mouth in the open pocket south
  //    of the Depot opens onto "Main & Vine" (a separate screen — hardware + diner).
  g.rect(45, 25, 2, 8, ':'); // the walk from the Depot front down to the mouth
  g.rect(44, 33, 4, 1, ':'); // the doorstep apron
  const downtownEntry = placeFacade('bldg_brickmore', 44, 32 * 16, 4, 2, {
    to: 'downtown_otterbrook', tx: 208, ty: 224,
  });

  const treesAt = (xy: ReadonlyArray<readonly [number, number]>): PropDef[] =>
    xy.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK }));

  // S17 M18 Part B (ADR-063): two hidden Americas grants on the grown south side.
  //  • THE PORCH SET coffee can under the Civic Green's oak (open '.' grass, west
  //    of the south district at cols<28 — never a frozen cell, never a sealed lane).
  //  • the Spare Hubcap by the Pond Park fence (open ground, rows≥20 below the
  //    east district). Both sit on hand-laid open tiles; the box's sub-tile solid
  //    can't wall a lane, and the sign tile stays walkable (BFS re-proven in tests).
  const porchCan = walkPresent('porch_can', 22, 47);
  const hubcap = walkPresent('gift_hubcap', 63, 23);

  const props: PropDef[] = [
    // the frozen core's props stay verbatim (the byte-identical core test). The
    // old bus SIGN keeps its corner but now just POINTS to the new Transit Depot
    // (a redirect sign is appended below); the depot is the real stop.
    ...core.props,
    busDepot,
    downtownEntry,
    { sprite: 'bench', x: 51, y: 21, solid: { ox: 1, oy: 6, w: 20, h: 6 } }, // the boarding-curb bench
    { sprite: 'sign', x: 48, y: 32, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // "→ DOWNTOWN"
    ...south.props,
    ...east.props,
    ...thicketProps,
    ...woodsGift.props,
    ...porchCan.props,
    ...hubcap.props,
    { sprite: 'sign', x: 4, y: 44, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // the woods trailhead marker
    cityHall,
    { sprite: 'sign', x: 12, y: 41, solid: { ox: 3, oy: 10, w: 10, h: 7 } }, // City Hall plaque
    // the Civic Green's dressing
    { sprite: 'bench', x: 19, y: 49, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    { sprite: 'sign', x: 16, y: 46, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ...treesAt([[15, 46], [25, 47], [16, 52], [24, 52]]),
    // the Pond Park's rests + shade (the west table moved south off the depot step)
    { sprite: 'picnic', x: 49, y: 28, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    { sprite: 'picnic', x: 61, y: 24, solid: { ox: 2, oy: 8, w: 32, h: 14 } },
    { sprite: 'sign', x: 55, y: 28, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    ...treesAt([[50, 20], [60, 20], [51, 27], [62, 28]]),
    // the gateway marker (the road east; the live door is wired in Movement 2)
    { sprite: 'sign', x: 66, y: 15, solid: { ox: 3, oy: 10, w: 10, h: 7 } },
    // S15i Task 0 — THE DAYBREAK GATE: until the opening ends (zapper_done), the
    // road east is closed with a sleeping-town barricade (a reason, not an
    // invisible wall). The door itself is also gated in OverworldScene.checkDoors,
    // so the verges can't be skirted. At daybreak both retire and the road opens.
    { sprite: 'sawhorse', x: 67, y: 16, solid: { ox: 0, oy: 2, w: 36, h: 26 }, unlessFlag: 'zapper_done' },
  ];

  const npcs = [
    ...core.npcs,
    { id: 'green_keeper', sprite: 'fernLady', x: 21, y: 49, facing: 'down' as const, dialogue: 'npc_green_keeper', wander: true },
    { id: 'pond_angler', sprite: 'quarterMan', x: 51, y: 25, facing: 'right' as const, dialogue: 'npc_pond_angler', idle: true, emote: 'think' as const }, // Wave 2 (#4): pondering the still water
    { id: 'south_neighbor', sprite: 'senora', x: 34, y: 45, facing: 'down' as const, dialogue: 'npc_south_neighbor', wander: true },
    // S15i (ADR-054): the woods nook's resident obsessive (§A11) — a birdwatcher
    // at the thicket trailhead, who has Opinions about the new picnic spot
    { id: 'woods_birder', sprite: 'oldTimer', x: 5, y: 45, facing: 'down' as const, dialogue: 'npc_woods_birder', idle: true, emote: 'happy' as const }, // Wave 2 (#4): delighted by the birds
    { id: 'gate_walker', sprite: 'grayCommuter', x: 60, y: 16, facing: 'right' as const, dialogue: 'npc_gate_walker', dialogueDay: 'npc_gate_walker_day', wander: true },
    // S15i Task 0: the treeline gawker — at 2 AM he points you up the hill and
    // refuses to go himself; at daybreak (dialogueDay) he's seen the crater and
    // warns of the blocked road east. Stands by the hill gap, never wanders off it.
    { id: 'treeline_gawker', sprite: 'pigeonKid', x: 23, y: 4, facing: 'up' as const, dialogue: 'npc_treeline_gawker', dialogueDay: 'npc_treeline_gawker_day', idle: true, emote: 'surprise' as const }, // Wave 2 (#4): rattled by the crater up the hill
    // S22 (ADR-114): the depot comes ALIVE at daybreak — two commuters at the
    // curb (gated on zapper_done so the 2 AM opening stays eerily empty)
    { id: 'bus_waiter1', sprite: 'grayCommuter', x: 52, y: 23, facing: 'left' as const, dialogue: 'npc_bus_waiter1', idle: true, emote: 'think' as const, ifFlag: 'zapper_done' },
    { id: 'bus_waiter2', sprite: 'senora', x: 46, y: 25, facing: 'up' as const, dialogue: 'npc_bus_waiter2', idle: true, emote: 'idle' as const, ifFlag: 'zapper_done' },
    // S22 (ADR-115): the tycoon TEASERS on the civic lane — you can SEE the home +
    // car you'll someday afford. Both open at daybreak (zapper_done).
    { id: 'realtor_otter', sprite: 'senora', x: 14, y: 43, facing: 'up' as const, dialogue: 'npc_realtor', idle: true, ifFlag: 'zapper_done' },
    { id: 'car_dealer_otter', sprite: 'quarterMan', x: 22, y: 43, facing: 'up' as const, dialogue: 'npc_car_dealer', idle: true, emote: 'happy' as const, ifFlag: 'zapper_done' },
    // S22 (ADR-118): Constable Borden works the "hill vandalism" case at City Hall
    // by daybreak — an OPTIONAL cop fight that clears Chad's frame-up (never a wall).
    { id: 'constable_borden', sprite: 'grayCommuter', x: 10, y: 43, facing: 'up' as const, dialogue: 'npc_borden_accuse', idle: true, emote: 'surprise' as const, ifFlag: 'zapper_done' },
  ];

  const signs = [
    ...core.signs,
    { x: 12, y: 41, dialogue: 'sign_otter_hall' },
    { x: 16, y: 46, dialogue: 'sign_civic_green' },
    { x: 55, y: 28, dialogue: 'sign_pond_park' },
    { x: 66, y: 15, dialogue: 'sign_meadow_gate' },
    // S15i Task 0: the closed-gate notice, read at the barricade until daybreak
    { x: 64, y: 17, dialogue: 'sign_meadow_gate_closed', unlessFlag: 'zapper_done' },
    // S15i Task 1: the woods nook trailhead
    { x: 4, y: 44, dialogue: 'sign_otter_woods' },
    // S22 (ADR-114): the old bus-stop corner now points to the new Transit Depot
    { x: 23, y: 25, dialogue: 'sign_bus_moved' },
    // S22 (ADR-116): the downtown street mouth, south of the Depot
    { x: 48, y: 32, dialogue: 'sign_to_downtown' },
    ...woodsGift.signs, // ADR-056: the glade present (sign while sealed, flavor after)
    ...porchCan.signs, // ADR-063 Part B: THE PORCH SET coffee can
    ...hubcap.signs, // ADR-063 Part B: the Spare Hubcap ("worth more to a man named Earl")
    ...south.signs,
    ...east.signs,
  ];

  return {
    ...core,
    grid: g.out(),
    props,
    npcs,
    signs,
    // S22 (ADR-124): the living-world layer — park birdsong + the Pond Park mirror
    ambience: 'birds',
    reflect: [{ x: 53, y: 21, w: 6, h: 5 }],
    doors: [
      ...core.doors,
      // THE EXPORTED EAST STUB → MEADOW MILE (Movement 2). The core's doors stay
      // first + unchanged (the byte-identical test); growth only APPENDS this one.
      { x: W - 1, y: OTTERBROOK_EAST_GATE.y, w: 1, h: 2, to: 'meadow_mile', tx: 24, ty: 128, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      ...core.spawners,
      // the woken town's danger reaches the new south field too (gated like the
      // core's), seated well clear of every door/phone/sign (pressure ≥24px)
      { enemies: ['cranky_mailbox'], count: 1, rect: { x: 31, y: 47, w: 8, h: 3 }, ifFlag: 'meteor_fell' },
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
  const g = new Grid(16, 11, 'w');
  g.rect(0, 0, 16, 2, 'W');
  g.rect(6, 4, 4, 1, 'r'); // a civic rug runs to the counter
  g.rect(6, 5, 4, 1, 'r');
  return {
    id: 'otterbrook_cityhall',
    name: 'OTTERBROOK CITY HALL',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 8, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'shelf_b', x: 1, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } }, // records
      { sprite: 'shelf_b', x: 13, y: 2, solid: { ox: 0, oy: 12, w: 32, h: 12 } },
      { sprite: 'payphone', x: 2, y: 8, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'planter', x: 13, y: 8, solid: { ox: 1, oy: 6, w: 20, h: 9 } },
    ],
    npcs: [
      { id: 'hall_clerk', sprite: 'fernLady', x: 7, y: 2, facing: 'down', dialogue: 'npc_hall_clerk' },
      { id: 'mayor_otter', sprite: 'oldTimer', x: 11, y: 6, facing: 'left', dialogue: 'npc_mayor_otter' },
    ],
    signs: [{ x: 4, y: 1, dialogue: 'sign_hall_wall' }],
    phones: [{ x: 2, y: 8 }],
    doors: [
      { x: 7, y: 10, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
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
    ambience: 'wind', // S22 (ADR-124)
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

  const gift = walkPresent('meadow_gift_woods', gladeX - 1, gladeY);
  return {
    id: 'meadow_woods',
    name: 'WHISPERWOOD',
    music: 'otterbrook',
    ambience: 'birds', // S22 (ADR-124): the canopy comes back to life at daybreak
    grid,
    props: [
      ...trees,
      { sprite: 'payphone', x: 2, y: westY + 2, solid: WALK_PHONE_SOLID },
      { sprite: 'picnic', x: 3, y: Math.max(1, westY - 2), solid: WALK_PICNIC_SOLID },
      { sprite: 'sign', x: 5, y: Math.max(1, westY - 2), solid: WALK_SIGN_SOLID },
      ...gift.props,
    ],
    // S22 (ADR-124): the woods were dead (0 NPCs) — a keeper at the rest, a hiker at the mouth
    npcs: [
      { id: 'woods_keeper', sprite: 'fernLady', x: 4, y: westY, facing: 'right', dialogue: 'npc_woods_keeper', idle: true, emote: 'happy' },
      { id: 'woods_hiker', sprite: 'pajamaKid', x: W - 3, y: eastY, facing: 'left', dialogue: 'npc_woods_hiker', wander: true, emote: 'think' },
    ],
    signs: [{ x: 5, y: Math.max(1, westY - 2), dialogue: 'sign_whisperwood' }, ...gift.signs],
    phones: [{ x: 2, y: westY + 2 }],
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_mile', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_far', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: [
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: Math.round(W / 3), y: 2, w: Math.round(W / 3), h: H - 4 } },
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
    ambience: 'wind', // S22 (ADR-124): the open stretch where the air goes electric
    grid: draft.grid,
    props: [...props, ...gift.props],
    npcs: [
      { id: 'far_walker', sprite: 'pajamaKid', x: 5, y: westY, facing: 'right', dialogue: 'npc_far_walker', wander: true, idle: true, emote: 'think' },
      { id: 'far_forager', sprite: 'senora', x: Math.round(W * 0.5), y: eastY, facing: 'down', dialogue: 'npc_far_forager', wander: true, emote: 'happy' },
    ],
    signs: [...draft.signs, ...gift.signs],
    phones: draft.phones,
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_woods', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
      { x: W - 1, y: eastY, w: 1, h: 2, to: 'meadow_overpass', tx: 16, ty: eastY * 16, facing: 'right', indicator: 'none' },
    ],
    spawners: draft.spawners.map((s) => ({ ...s, enemies: ['runaway_lawnmower', 'pigeon_gang'] })),
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
    ambience: 'crowd', // S22 (ADR-124): the city hum reaches the threshold
    grid: draft.grid,
    props: [
      ...draft.props,
      { sprite: 'sign', x: W - 6, y: Math.max(1, eastY - 2), solid: WALK_SIGN_SOLID }, // BRICKTON CITY LIMITS
      { sprite: 'sign', x: regX, y: regY, solid: WALK_SIGN_SOLID }, // the Walkers' Register post
    ],
    // S22 (ADR-124): a traveler who comes up just to listen to the city — it's a place, not a checkpoint
    npcs: [...proctors, { id: 'overpass_traveler', sprite: 'grayCommuter', x: 4, y: westY, facing: 'right', dialogue: 'npc_overpass_traveler', idle: true, emote: 'think' }],
    signs: [
      ...draft.signs,
      { x: W - 6, y: Math.max(1, eastY - 2), dialogue: 'sign_overpass_gate' },
      { x: regX, y: regY, dialogue: 'walkers_register_book' },
    ],
    phones: draft.phones,
    doors: [
      { x: 0, y: westY, w: 1, h: 2, to: 'meadow_far', tx: 16, ty: westY * 16, facing: 'left', indicator: 'none' },
    ],
    spawners: draft.spawners.map((s) => ({ ...s, enemies: ['pigeon_gang', 'blazer_smiler'] })),
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
    ambience: 'wind', // S22 (ADR-124): the hill's bare-shouldered wind
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
      // S22 (ADR-124): a daytime hiker keeps the climb from feeling abandoned
      { id: 'hill_hiker', sprite: 'oldTimer', x: 15, y: 6, facing: 'down', dialogue: 'npc_hill_hiker', idle: true, emote: 'think', ifFlag: 'zapper_done' },
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
      // S22 (ADR-112): the climb now passes through HICKORY TRAIL before the crater
      { x: 13, y: 0, w: 4, h: 1, to: 'hickory_trail', tx: 232, ty: 288, facing: 'up' },
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
    ambience: 'wind', // S22 (ADR-124)
    music: 'hill',
    // night follows the §A6 story clock (2 AM until zapper_done), not a
    // permanent flag — dawn reaches the hill too (S9b)
    grid: g.out(),
    props: [
      ...trees.map(([x, y]) => ({ sprite: treeSprite(x, y, true), x, y, solid: { ox: 7, oy: 22, w: 12, h: 10 } })),
      { sprite: 'meteor_rock_hickory_hill', x: 14, y: 5, solid: { ox: 1, oy: 8, w: 28, h: 14 } },
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
    // S22 (ADR-112): descending from the crater drops into WHISPERWOOD RISE
    doors: [{ x: 13, y: 45, w: 4, h: 1, to: 'whisperwood_rise', tx: 232, ty: 36, facing: 'down' }],
    spawners: [
      { enemies: ['coily_cicada'], count: 3, rect: { x: 6, y: 18, w: 18, h: 8 } },
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 6, y: 28, w: 16, h: 8 } },
      { enemies: ['hill_slug_deluxe'], count: 1, rect: { x: 10, y: 12, w: 12, h: 6 } },
    ],
    triggers: [{ id: 'crater', rect: { x: 11, y: 8, w: 8, h: 3 }, once: true }],
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
  // the switchback (a dirt S the player actually walks)
  g.rect(13, 16, 3, 4, ':'); // south stub → HILL ROAD
  g.rect(6, 14, 10, 2, ':'); // sweep left
  g.rect(6, 8, 2, 8, ':'); // climb the left rail
  g.rect(6, 8, 16, 2, ':'); // cross to the right
  g.rect(20, 2, 2, 8, ':'); // climb the right rail
  g.rect(13, 2, 9, 2, ':'); // crest back to centre
  g.rect(13, 0, 3, 4, ':'); // north stub → WHISPERWOOD RISE
  // brush shaping the drops, fences on the steep edge
  g.rect(9, 13, 4, 1, 'b');
  g.rect(16, 7, 4, 1, 'b');
  g.rect(4, 17, 3, 1, 'b');
  g.rect(6, 16, 8, 1, '-');

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
      { enemies: ['hill_slug_deluxe', 'coily_cicada'], count: 2, rect: { x: 8, y: 13, w: 12, h: 4 }, ifFlag: 'meteor_fell' },
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
  g.rect(13, 0, 3, 20, ':'); // the aisle, edge to edge
  g.rect(8, 9, 8, 2, ':'); // a small clearing spur (the picnic glade)
  // dense bramble walls hemming the path in
  g.rect(5, 5, 5, 1, 'b');
  g.rect(20, 6, 5, 1, 'b');
  g.rect(6, 14, 4, 1, 'b');
  g.rect(19, 13, 5, 1, 'b');

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
    ],
    npcs: [],
    signs: [{ x: 16, y: 16, dialogue: 'sign_whisperwood_rise' }],
    phones: [],
    doors: [
      { x: 13, y: 19, w: 3, h: 1, to: 'hickory_trail', tx: 232, ty: 36, facing: 'down' },
      { x: 13, y: 0, w: 3, h: 1, to: 'hickory_hill', tx: 232, ty: 660, facing: 'up' },
    ],
    spawners: [
      { enemies: ['coily_cicada', 'hill_slug_deluxe'], count: 2, rect: { x: 8, y: 4, w: 14, h: 4 }, ifFlag: 'meteor_fell' },
      { enemies: ['hill_slug_deluxe'], count: 1, rect: { x: 8, y: 12, w: 14, h: 4 }, ifFlag: 'meteor_fell' },
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

/** where MEADOW MILE drops you on foot (S15h) — the grown city's SOUTH GATEWAY,
 *  in the new district (the orientation gate reads this). Computed for the 144×76
 *  grown grid; the bus still lands inside the old downtown (BRICKTON_BUS_SPAWN). */
export const BRICKTON_FOOT_SPAWN = { x: 30 * 16 + 8, y: 71 * 16 } as const;

/**
 * A real downtown, not a strip: two E-W streets stitched by a cross avenue,
 * buildings in three clusters with jittered placement and varied heights,
 * a parking lot, an irregular park, alleys you can cut through. All
 * irregularity comes from one fixed seed (1995 — the summer it fell) so the
 * city is sporadic to the eye but identical on every boot.
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
  const mapleProps: PropDef[] = [];
  let mx = 6;
  for (let i = 0; i < 5; i++) {
    mapleProps.push(placeFacade('bldg_brickmore', mx, 62 * 16 - 4, 5, 2));
    mx += 7;
  }

  // THE COLOSSUS LANDMARK (§B4): STARFALL SPIRE — a sky-tower whose footprint
  // spans a slice of the far-east blocks; you ROUND it on foot (lanes at col 125
  // west + cols 141–142 east). It backs onto Maple Street and climbs off-screen.
  // Hand-placed beyond the narrowed eastSouth so nothing it shadows is required.
  const spire = placeFacade('bldg_colossus_spire', 126, 63 * 16 - 4, 14, 30);

  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  const props: PropDef[] = [
    ...core.props,
    ...eastNorth.props,
    ...downtownHigh.props,
    ...eastSouth.props,
    ...southWest.props,
    ...mapleProps,
    spire,
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
    ambience: 'crowd', // S22 (ADR-124): the downtown murmur
    doors: [
      ...keptDoors, // the_cage gate stays byte-identical; the old docks-gap door is relocated ↓
      // S22 (ADR-122): the docks gap now opens onto THE WAREHOUSES (the approach head),
      // not straight onto the pier — Brickton → Warehouses → Seawall → Docks → boat.
      { x: W - 1, y: 21, w: 1, h: 3, to: 'docks_warehouses', tx: 32, ty: 112, facing: 'right' },
      { x: 29, y: H - 1, w: 3, h: 1, to: 'meadow_mile', tx: 544, ty: 128, facing: 'down', indicator: 'none' },
    ],
    spawners: [
      ...core.spawners,
      // the new districts run a city band too (clear of the gateway + fixtures)
      { enemies: ['blazer_smiler'], count: 1, rect: { x: 108, y: 32, w: 14, h: 6 } },
      { enemies: ['pigeon_gang'], count: 1, rect: { x: 10, y: 40, w: 20, h: 6 } },
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
 * THE TRANSIT DEPOT waiting room (S22, ADR-114) — the bus stop is a real
 * building now. A warm wood waiting room: a ticket window (the clerk), a
 * schedule board, benches, and a payphone to save. Boarding still happens at
 * the curb outside (the relocated §A6 bus_stop trigger), so the existing
 * busAsk flow is untouched — this is the "full building" the stop earned.
 */
function buildBusDepotInt(streetExit: { tx: number; ty: number }): MapDef {
  const g = new Grid(13, 9, 'w');
  g.rect(0, 0, 13, 2, 'W');
  return {
    id: 'bus_depot_int',
    name: 'OTTERBROOK TRANSIT',
    music: 'otterbrook',
    interior: true,
    grid: g.out(),
    props: [
      // the ticket window + counter along the back
      { sprite: 'counter', x: 4, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 6, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      // waiting benches
      { sprite: 'bench', x: 2, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 9, y: 5, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      // a payphone to save (Call Dad) + an ATM for fare money
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
      { sprite: 'atm', x: 10, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 12 } },
    ],
    npcs: [
      {
        id: 'depot_clerk',
        sprite: 'quarterMan',
        x: 5,
        y: 2,
        facing: 'down',
        dialogue: 'npc_depot_clerk',
        dialogueDay: 'npc_depot_clerk_day',
        idle: true,
      },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_bus_depot' }],
    phones: [{ x: 2, y: 7 }],
    atms: [{ x: 10, y: 7 }],
    doors: [
      { x: 6, y: 8, w: 2, h: 1, to: 'otterbrook', tx: streetExit.tx, ty: streetExit.ty, facing: 'down', indicator: 'mat' },
    ],
    spawners: [],
    // S22 (ADR-114): boarding lives HERE now (an interior trigger, free to add) —
    // step up to the ticket counter to catch the 6:15. Same gating as the old stop.
    triggers: [{ id: 'depot_board', rect: { x: 4, y: 4, w: 4, h: 1 }, once: false }],
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
    ambience: 'crowd', // S22 (ADR-124)
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
      { id: 'hodgkin', sprite: 'drugClerk', x: 6, y: 2, facing: 'down', dialogue: 'npc_hodgkin', idle: true },
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
      { sprite: 'counter', x: 3, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 5, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'counter', x: 7, y: 3, solid: { ox: 0, oy: 4, w: 30, h: 14 } },
      { sprite: 'cola_fridge', x: 10.4, y: 0.25 },
      { sprite: 'bench', x: 2, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'bench', x: 9, y: 6, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'payphone', x: 2, y: 7, solid: { ox: 1, oy: 10, w: 14, h: 16 } },
    ],
    npcs: [
      { id: 'diner_waitress', sprite: 'mom', x: 6, y: 2, facing: 'down', dialogue: 'npc_waitress', idle: true },
    ],
    signs: [{ x: 9, y: 1, dialogue: 'sign_diner' }],
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
    ambience: 'crowd', // S22 (ADR-124)
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
    ambience: 'crowd', // S22 (ADR-124)
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
      // S22 (ADR-121): south now threads back down the approach (Park → Lot → Block → city)
      { x: 11, y: H - 1, w: 3, h: 1, to: 'cage_lot', tx: 160, ty: 32, facing: 'down' },
    ],
    spawners: [],
    triggers: [
      // the first-arrival beat — the park, the mural, a ball bouncing somewhere ahead
      { id: 'cage_park_reveal', rect: { x: 10, y: 16, w: 5, h: 3 }, once: true },
    ],
  };
}

/* ----- THE CAGE APPROACH (S22, ADR-121) — the neighbourhood walk to the courts -----
 * The user's decree: THE CAGE shouldn't open one door off Brickton — there are
 * MULTIPLE map transitions before you even reach CAGE PARK. The walk now climbs the
 * rec block: Brickton → THE BLOCK (rowhouses, a cross street) → THE LOT (a fenced,
 * cracked-asphalt warm-up lot) → CAGE PARK → THE CAGE. North is "toward the courts"
 * on every screen; the Brickton return threads back down the same way. Gray-boxed on
 * shipped urban tiles/props; see docs/CH1_ART_PROMPTS.md for the authored pass.
 */
function buildCageBlock(): MapDef {
  const g = new Grid(20, 16, '='); // sidewalk underfoot
  // a cross street through the middle (walkable road; traffic reads it)
  g.rect(0, 6, 20, 4, 'R');
  g.rect(0, 7, 20, 1, 'D'); // the faded centerline
  g.rect(9, 6, 2, 4, 'X'); // the crosswalk the route uses
  // four brick building masses framing a central corridor (the route runs x9–10)
  g.rect(0, 0, 6, 6, 'B');
  g.rect(14, 0, 6, 6, 'B');
  g.rect(0, 10, 6, 6, 'B');
  g.rect(14, 10, 6, 6, 'B');
  // grit (all walkable)
  g.set(8, 3, '3'); g.set(11, 12, '3'); g.set(7, 13, '1'); g.set(12, 4, '1');

  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  return {
    id: 'cage_block',
    name: 'THE BLOCK',
    ambience: 'crowd', // S22 (ADR-124)
    music: 'brickton',
    grid: g.out(),
    props: [
      { sprite: 'trash_can', x: 5, y: 9, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'trash_can', x: 14, y: 5, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'phone_pole', x: 6, y: 11, solid: { ox: 5, oy: 26, w: 6, h: 6 } },
      { sprite: 'phone_pole', x: 13, y: 3, solid: { ox: 5, oy: 26, w: 6, h: 6 } },
      { sprite: 'bench', x: 6, y: 4, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: 'sign', x: 12, y: 10, solid: SIGN_SOLID },
    ],
    npcs: [
      { id: 'block_kid', sprite: 'pigeonKid', x: 12, y: 11, facing: 'left', dialogue: 'npc_block_kid', wander: true },
      { id: 'block_oldhead', sprite: 'quarterMan', x: 7, y: 3, facing: 'down', dialogue: 'npc_block_oldhead', idle: true, emote: 'idle' },
    ],
    signs: [{ x: 12, y: 10, dialogue: 'sign_the_block' }],
    phones: [],
    doors: [
      { x: 9, y: 15, w: 2, h: 1, to: 'brickton', tx: 808, ty: 402, facing: 'down' },
      { x: 9, y: 0, w: 2, h: 1, to: 'cage_lot', tx: 160, ty: 208, facing: 'up' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildCageLot(): MapDef {
  const g = new Grid(20, 16, 'q'); // cracked asphalt
  g.sprinkle(2061, 'zz~,z', 0.12); // cracks + weeds (all walkable)
  // chain-link rings the lot; gate gaps on the route at N (→ park) and S (→ block)
  g.rect(0, 0, 20, 1, 'C');
  g.rect(0, 15, 20, 1, 'C');
  g.rect(0, 1, 1, 14, 'C');
  g.rect(19, 1, 1, 14, 'C');
  g.rect(9, 0, 2, 1, 'q'); // north gate gap
  g.rect(9, 15, 2, 1, 'q'); // south gate gap
  g.rect(9, 1, 2, 14, 'q'); // the worn route through the weeds

  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  const OAK_S = { ox: 7, oy: 22, w: 12, h: 10 };
  return {
    id: 'cage_lot',
    name: 'THE LOT',
    ambience: 'wind', // S22 (ADR-124)
    music: 'cage',
    grid: g.out(),
    props: [
      // the warm-up rim + a graffiti wall — the lot has a soul
      { sprite: 'backboard', x: 4, y: 3.2, solid: { ox: 10, oy: 36, w: 7, h: 6 } },
      { sprite: 'cage_mural', x: 14, y: 5, solid: { ox: 0, oy: 6, w: 46, h: 24 } },
      { sprite: 'trash_can', x: 3, y: 12, solid: { ox: 2, oy: 10, w: 10, h: 7 } },
      { sprite: 'bench', x: 5, y: 11, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
      { sprite: treeSprite(16, 12), x: 16, y: 12, solid: OAK_S },
      { sprite: 'sign', x: 13, y: 12, solid: SIGN_SOLID },
    ],
    npcs: [
      { id: 'lot_hooper', sprite: 'pigeonKid', x: 6, y: 8, facing: 'right', dialogue: 'npc_lot_hooper', wander: true },
    ],
    signs: [{ x: 13, y: 12, dialogue: 'sign_cage_lot' }],
    phones: [],
    doors: [
      { x: 9, y: 15, w: 2, h: 1, to: 'cage_block', tx: 160, ty: 32, facing: 'down' },
      { x: 9, y: 0, w: 2, h: 1, to: 'cage_park', tx: 192, ty: 272, facing: 'up' },
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
    // S22 (ADR-121): the city door now opens onto THE BLOCK — the first of the
    // approach screens (Block → Lot → Park → Cage), not straight into the park.
    cage.to = 'cage_block';
    cage.tx = 160; // tile 10 — the block's central corridor
    cage.ty = 208; // tile 13 — up from the city, facing the rec block
  }
}
const cityHallDoorstep = doorstepOf(otterbrookMap, 'otterbrook_cityhall') ?? { tx: 104, ty: 672 };
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

/* ----- THE COSTA ESTRELLA APPROACH (S22, ADR-123) — the cliff road to the links -----
 * The user's decree (same as the Cage + Docks): the resort shouldn't open one door off
 * Puerto Sol. The climb to the clifftop links now crosses TWO screens: THE COAST ROAD
 * (a sea-cliff drive, the harbour far below) → THE RESORT GATE (hedges, a gatehouse, the
 * members' sign) → COSTA ESTRELLA LINKS → the estates → the clubhouse. NORTH is "up the
 * cliff, toward the resort" on every screen; the return rolls back down to Puerto Sol.
 */
function buildCostaRoad(): MapDef {
  const g = new Grid(16, 16, '.');
  g.sprinkle(1318, ',~ f', 0.06);
  g.rect(0, 0, 5, 16, 'e'); // the harbour, far below the cliff (west)
  g.rect(5, 0, 1, 16, 'E'); // the foam line at the cliff base
  g.rect(7, 0, 3, 16, ':'); // the coast road (the route)
  g.rect(6, 0, 1, 16, '|'); // the guardrail along the drop
  const OAK_S = { ox: 7, oy: 22, w: 12, h: 10 };
  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  // cliff-side palms (east), kept off the road
  const palms: Array<[number, number]> = [[11, 2], [13, 5], [12, 9], [14, 12], [11, 14]];
  return {
    id: 'costa_road',
    name: 'THE COAST ROAD',
    music: 'puerto',
    ambience: 'waves',
    grid: g.out(),
    props: [
      ...palms.map(([x, y]) => ({ sprite: treeSprite(x, y), x, y, solid: OAK_S })),
      { sprite: 'sign', x: 10, y: 8, solid: SIGN_SOLID },
      { sprite: 'bench', x: 10, y: 12, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [
      { id: 'road_gazer', sprite: 'caddy', x: 10, y: 7, facing: 'left', dialogue: 'npc_road_gazer', idle: true, emote: 'happy' },
    ],
    signs: [{ x: 10, y: 8, dialogue: 'sign_coast_road' }],
    phones: [],
    doors: [
      { x: 7, y: 15, w: 3, h: 1, to: 'puerto_sol', tx: 104, ty: 30, facing: 'down' },
      { x: 7, y: 0, w: 3, h: 1, to: 'costa_gate', tx: 128, ty: 208, facing: 'up' },
    ],
    spawners: [],
    triggers: [],
  };
}

function buildCostaGate(): MapDef {
  const g = new Grid(16, 16, '.');
  g.sprinkle(1319, ',~ F', 0.05);
  g.rect(7, 0, 3, 16, ':'); // the entrance drive (the route)
  g.rect(1, 8, 5, 3, 'm'); g.rect(10, 8, 5, 3, 'm'); // manicured lawn either side
  g.rect(2, 4, 4, 1, 'b'); g.rect(10, 4, 4, 1, 'b'); // clipped hedges
  g.rect(2, 12, 4, 1, 'b'); g.rect(10, 12, 4, 1, 'b');
  const OAK_S = { ox: 7, oy: 22, w: 12, h: 10 };
  const SIGN_SOLID = { ox: 3, oy: 10, w: 10, h: 7 };
  return {
    id: 'costa_gate',
    name: 'THE RESORT GATE',
    ambience: 'wind', // S22 (ADR-124)
    music: 'puerto',
    grid: g.out(),
    props: [
      { sprite: treeSprite(3, 2), x: 3, y: 2, solid: OAK_S },
      { sprite: treeSprite(13, 2), x: 13, y: 2, solid: OAK_S },
      { sprite: 'sign', x: 10, y: 7, solid: SIGN_SOLID }, // the members' sign
      { sprite: 'bench', x: 5, y: 9, solid: { ox: 1, oy: 6, w: 20, h: 6 } },
    ],
    npcs: [
      { id: 'gate_valet', sprite: 'caddy', x: 6, y: 7, facing: 'right', dialogue: 'npc_gate_valet', wander: true },
    ],
    signs: [{ x: 10, y: 7, dialogue: 'sign_costa_gate' }],
    phones: [],
    doors: [
      { x: 7, y: 15, w: 3, h: 1, to: 'costa_road', tx: 128, ty: 32, facing: 'down' },
      { x: 7, y: 0, w: 3, h: 1, to: 'costa_estrella', tx: 216, ty: 232, facing: 'up' },
    ],
    spawners: [],
    triggers: [],
  };
}

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
    ambience: 'wind', // S22 (ADR-124): the clifftop breeze off the surf
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
      // S22 (ADR-123): the links roll back down the cliff approach (Links → Gate →
      // Road → Puerto Sol) instead of one hop home. Same south door, new target.
      { x: COSTA_DOOR_FOR_PUERTO_SOL.x, y: COSTA_DOOR_FOR_PUERTO_SOL.y, w: 3, h: 1, to: 'costa_gate', tx: 128, ty: 32, facing: 'down' },
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
    ambience: 'wind', // S22 (ADR-124): the manicured hush of the estates
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

export const MAPS: Record<string, MapDef> = {
  ...buildChapter2Maps({ chapelStep: chapelDoorstep, hospitalStep: hospitalDoorstep }),
  // S18 (ADR-095) — CHAPTER 3 England (Half 1: maps + encounters + shops; the
  // manifest stays 'unlanded' until the story/boss half flips it)
  ...buildChapter3Maps(),
  otterbrook: otterbrookMap,
  // THE LONG WALK — the four foot legs (Otterbrook → woods → far meadow → overpass)
  ...longWalk,
  hill_road: buildHillRoad(),
  // S22 (ADR-112) — THE LONGER CLIMB: two legs between the road and the crater
  hickory_trail: buildHickoryTrail(),
  whisperwood_rise: buildWhisperwoodRise(),
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
  otterbrook_cityhall: buildOtterbrookCityHallInt(cityHallDoorstep),
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
  // S22 (ADR-121) — the approach now climbs the rec block: Brickton → BLOCK → LOT → PARK → CAGE
  cage_block: buildCageBlock(),
  cage_lot: buildCageLot(),
  costa_estrella: buildCostaEstrella(),
  // S22 (ADR-123): the cliff-road approach — Puerto Sol → ROAD → GATE → LINKS
  costa_road: buildCostaRoad(),
  costa_gate: buildCostaGate(),
  ...golfMaps, // S15i Task 6 (ADR-059) — the golf resort + clubhouse (computed doorsteps)
  bus_interior: buildBusInterior(),
};

// the user's decree — the cramped single-room interiors fill the screen now
// (no camera zoom, which would scale the HUD; the rooms themselves grow). Multi-
// room houses, vehicles, and the already-roomy halls (museum/hospital/dos) keep
// their hand-built size.
const ROOMY_INTERIORS: readonly string[] = [
  'drugstore_int', 'starmart_int', 'arcade_int', 'arcade2_int',
  'rex_bedroom', 'ana_room', 'vivi_room', 'otterbrook_cityhall', 'bus_depot_int',
  'hardware_int', 'diner_int', 'otter_clinic_int',
  'mercado_int', 'clinic_ps_int', 'deli_int', 'chapel_int',
  'valle_shop_int', 'clinic_valle_int', 'chapel_valle_int',
];
for (const id of ROOMY_INTERIORS) if (MAPS[id]) MAPS[id] = growInterior(MAPS[id], 16, 11);

// S18 M22 (ADR-092) — THE GLYPH LAW wired into the LIVE Americas settlement
// overworlds: each declares its canon §A5/§A6 area so the entry banner wears that
// region's decorative GLYPH script under the place name (§A11.8, §A11.6-safe). The
// unlanded regions inherit the same hook when their maps land — the GLYPH_SCRIPT
// registry already pins every canon area both directions. (validator: map.area
// must be a real GLYPH_SCRIPT key.)
const MAP_AREA: Record<string, string> = {
  otterbrook: 'otterbrook',
  brickton: 'brickton',
  cage_park: 'cage_park',
  puerto_sol: 'puerto_sol',
  // S18 (ADR-095) — CHAPTER 3 England: the stone town wears its M22 `fraktur`
  // glyph banner (§A11.8) over the M25 fog-stone skin. The academy + the moor
  // maps add their 'wintermoor' rows when they land.
  foggybottom: 'foggybottom',
  wintermoor_grounds: 'wintermoor',
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
  otterbrook: [{ x: 53, y: 22, w: 6, h: 4, within: 3 }], // the Pond Park water feature
  golf_resort: [{ x: 23, y: 10, w: 3, h: 3, within: 2 }], // the course's water hazard
  puerto_sol: [{ x: 0, y: 30, w: 52, h: 4, within: 4 }], // the working seafront
};
for (const [id, zones] of Object.entries(MAP_REFLECT)) {
  const m = MAPS[id];
  if (m) m.reflect = zones;
}
