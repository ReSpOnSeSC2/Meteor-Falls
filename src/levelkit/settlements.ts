/**
 * THE LEVELKIT — settlements (S15g, ADR-044).
 *
 *  buildCity    — the ADR-012 grid law BY CONSTRUCTION: ≥2 streets separated
 *                 by built-up blocks, a full-height avenue stitching them,
 *                 facades north of EACH street (≥2 block faces), crosswalks,
 *                 negative space, alleys. Passes the maps.test.ts city sweep
 *                 unexempted on any seed — the jitter only moves details
 *                 inside the guaranteed skeleton.
 *  buildTown    — bending lanes + negative space (organic, never a strip).
 *  buildVillage — one organic cluster around a commons.
 *
 * All output is DraftMapDef (plain MapDef + role-tagged NPC slots). Story-
 * important parts are RESERVED, never authored: requiredDoors + landmarks
 * become facade doors into draft interior ids the session hand-builds.
 */
import type {
  CityRecipe,
  TownRecipe,
  VillageRecipe,
  DraftMapDef,
  DraftNpc,
  PropDef,
  SignDef,
  SpawnerDef,
  DoorZone,
  SettlementStyle,
} from '../schemas';
import { cityBuildingHeight } from '../spritegen/tiles';
import { Streams, streamSeed } from './rng';
import {
  Grid,
  STYLE_PACKS,
  ROLE_FACADE,
  BAND_ROSTER,
  placeFacade,
  facadeDims,
  isMega,
  furniture,
  tree,
  slot,
  clampSize,
} from './kit';

/** the §A7 band roster as a mutable enemy list (SpawnerDef wants string[]) */
function bandEnemies(band: CityRecipe['encounterBand']): string[] {
  return [...(BAND_ROSTER[band ?? 'ch1'] ?? BAND_ROSTER.ch1)];
}

/* ============================ buildCity ============================ */

export function buildCity(r: CityRecipe): DraftMapDef {
  const [W, H] = clampSize(r.size, 48, 30);
  const S = new Streams(r.seed);
  const pack = STYLE_PACKS[r.style];
  const g = new Grid(W, H, pack.pave);

  // bounds + the brick spine the top row of facades backs onto
  g.rect(0, 0, W, 1, 'B').rect(0, 0, 1, H, 'B').rect(W - 1, 0, 1, H, 'B').rect(0, H - 1, W, 1, 'B');
  g.rect(1, 1, W - 2, 4, 'B');

  // STREETS: two or three horizontal bands, each separated by a built block
  const streetCount = H >= 40 ? 3 : 2;
  const streetY: number[] =
    streetCount === 3
      ? [Math.round(H * 0.24), Math.round(H * 0.52), Math.round(H * 0.8)]
      : [Math.round(H * 0.3), Math.round(H * 0.64)];
  for (const sy of streetY) g.rect(1, sy, W - 2, 3, 'R');

  // AVENUE(S): full-height R bands stitch every street together (≥12 tall →
  // the connector the sweep demands). A second avenue for wide cities.
  const avenues = [Math.round(W * 0.36) + S.jitter('avenueJit', 1)];
  if (W >= 64) avenues.push(Math.round(W * 0.72));
  for (const ax of avenues) g.rect(ax, 5, 3, H - 7, 'R');

  // dashed centerlines per street (phase-shifted), broken where avenues cross
  const avenueCols = new Set(avenues.flatMap((ax) => [ax - 1, ax, ax + 1, ax + 2, ax + 3]));
  streetY.forEach((sy, i) => {
    for (let x = 1; x < W - 1; x++) {
      if ((x + i) % 4 < 2 && !avenueCols.has(x)) g.set(x, sy + 1, 'D');
    }
  });
  // crosswalks flank each avenue at each street
  for (const ax of avenues) {
    for (const sy of streetY) {
      g.rect(ax - 2, sy, 2, 3, 'X');
      g.rect(ax + 3, sy, 2, 3, 'X');
    }
  }

  // NEGATIVE SPACE: a parking lot west of the first avenue, an irregular park
  // east of it — corners nibbled so neither reads as a rectangle.
  const midY = streetY[0] + 4;
  if (midY + 5 < streetY[1]) {
    g.rect(2, midY, 8, Math.min(5, streetY[1] - midY - 1), 'P');
    const px0 = avenues[0] + 6;
    const pw = Math.min(12, W - px0 - 3);
    if (pw > 4) {
      g.rect(px0, midY, pw, Math.min(5, streetY[1] - midY - 1), pack.ground);
      g.rect(px0, midY, 1 + S.int('parkNibA', 3), 1, pack.pave);
      g.rect(px0 + pw - 3 + S.int('parkNibB', 2), midY, 3, 1, pack.pave);
    }
  }
  g.sprinkle(streamSeed(r.seed, 'sprinkle'), pack.sprinkle, 0.14);

  /* ---- buildings: a jittered row north of EACH street ---- */
  const props: PropDef[] = [];
  const doors: DoorZone[] = [];
  const signs: SignDef[] = [];

  // required-door + landmark facades get reserved first so they always land
  const reservedRoles = [...(r.requiredDoors ?? [])];
  const reservedLandmarks = [...(r.landmarks ?? [])];

  streetY.forEach((sy, streetIdx) => {
    const bottomPx = sy * 16 - 4; // collision floor one row above the street
    let x = 2 + S.int(`bldgStart${streetIdx}`, 2);
    let placed = 0;
    while (x < W - 6) {
      if (avenueCols.has(x) || avenueCols.has(x + 4)) {
        x = Math.max(...avenues.filter((a) => a >= x), x) + 5;
        continue;
      }
      const wTiles = S.range(`bldgW${streetIdx}_${placed}`, 4, 6);
      if (x + wTiles > W - 3) break;
      const u = (S.range(`bldgU${streetIdx}_${placed}`, 1, 3) as 1 | 2 | 3);

      // assign a reserved role/landmark door to this lot if any remain
      let sprite = pack.buildings[S.int(`bldgSprite${streetIdx}_${placed}`, pack.buildings.length)];
      let door: { to: string; tx: number; ty: number } | undefined;
      if (reservedRoles.length) {
        const role = reservedRoles.shift() as string;
        sprite = ROLE_FACADE[role] ?? sprite;
        door = { to: `${r.id}__${role}_int`, tx: 144, ty: 150 };
      } else if (reservedLandmarks.length) {
        const lm = reservedLandmarks.shift() as string;
        door = { to: `${r.id}__lm_${lm}`, tx: 144, ty: 150 };
        signs.push({ x: x + 1, y: sy - 1, dialogue: `${r.id}_lm_${lm}` });
      }
      props.push(placeFacade(sprite, x, bottomPx, wTiles, u, door));

      // alley dumpster in the gap after this facade
      if (S.chance(`alley${streetIdx}_${placed}`, 0.5)) {
        props.push(furniture('dumpster', x + wTiles, (bottomPx - 70) / 16));
      }
      x += wTiles + 1 + S.int(`gap${streetIdx}_${placed}`, 2);
      placed++;
    }
  });

  /* ---- street furniture on the sidewalk below each street ---- */
  const doorCols = new Set(props.filter((p) => p.door).map((p) => Math.round(p.x) + 2));
  streetY.forEach((sy, streetIdx) => {
    const fy = sy + 3; // the pave row just south of the street
    if (fy >= H - 1) return;
    for (let fx = 3; fx < W - 3; fx += 3 + S.int(`furnStep${streetIdx}_${fx}`, 3)) {
      if (doorCols.has(fx) || avenueCols.has(fx)) continue;
      if (S.chance(`furnSkip${streetIdx}_${fx}`, 0.45)) continue;
      props.push(furniture(pack.furniture[S.int(`furnPick${streetIdx}_${fx}`, pack.furniture.length)], fx, fy));
    }
  });

  /* ---- street trees lining the south sidewalk ---- */
  const lastFy = streetY[streetY.length - 1] + 3;
  for (let tx = 3; tx < W - 3; tx += 4) {
    if (avenueCols.has(tx) || doorCols.has(tx)) continue;
    if (lastFy + 1 < H - 1 && S.chance(`tree${tx}`, 0.6)) props.push(tree(tx, lastFy + 1, pack.pines));
  }

  /* ---- rest points (§A4.5 + S14d): a phone and an ATM, near the south
   *      entrance and BEFORE the dangerous edge (the spawner, far north) ---- */
  const entranceY = H - 3;
  const phoneX = 4;
  props.push(furniture('payphone', phoneX, entranceY));
  const phones = [{ x: phoneX, y: entranceY }];
  const atmX = W - 6;
  props.push(furniture('atm', atmX, entranceY));
  const atms = [{ x: atmX, y: entranceY }];

  // picnic tables in the south commons (finding one before the edge is strategy)
  const picnicCount = r.picnicCount ?? 0;
  for (let i = 0; i < picnicCount; i++) {
    props.push(furniture('picnic', 8 + i * 5 + S.int(`picnicJit${i}`, 2), entranceY - 1));
  }

  /* ---- NPC slots (role-tagged drafts) on the south sidewalk ---- */
  const npcs: DraftNpc[] = [];
  const slots = r.npcSlots ?? 0;
  for (let i = 0; i < slots; i++) {
    const sx = 6 + ((i * 5 + S.int(`slotX${i}`, 3)) % (W - 12));
    npcs.push(slot(S, i, sx, lastFy + (i % 2 === 0 ? 0 : -1) + 1));
  }

  /* ---- the dangerous edge: a spawner at the far (north) outskirt ---- */
  const spawners: SpawnerDef[] = [];
  spawners.push({
    enemies: bandEnemies(r.encounterBand),
    count: 2,
    rect: { x: 2, y: streetY[0] - 2 < 6 ? 6 : streetY[0] - 2, w: Math.max(4, W - 4), h: 2 },
  });

  // a south-edge entrance door so reachability has a front door to walk from
  doors.push({
    x: Math.round(W / 2) - 1,
    y: H - 1,
    w: 2,
    h: 1,
    to: `${r.id}__exit`,
    tx: 16,
    ty: 16,
    facing: 'up',
    indicator: 'none',
  });

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    settlement: 'city',
    grid: g.out(),
    props,
    npcs,
    signs,
    phones,
    atms,
    doors,
    spawners,
    triggers: [],
  };
}

/* ============================ buildTown ============================ */

export function buildTown(r: TownRecipe): DraftMapDef {
  const [W, H] = clampSize(r.size, 30, 24);
  const S = new Streams(r.seed);
  const pack = STYLE_PACKS[r.style];
  const g = new Grid(W, H, pack.ground);
  g.sprinkle(streamSeed(r.seed, 'sprinkle'), pack.sprinkle, 0.1);

  // a bending main lane + branching spurs (organic — argues with the land)
  const lanes = r.lanes ?? 2;
  let ly = Math.round(H / 2);
  for (let x = 1; x < W - 1; x++) {
    g.rect(x, ly, 1, 2, ':');
    if (S.chance(`bend${x}`, 0.18)) ly = Math.max(3, Math.min(H - 5, ly + (S.chance(`bendDir${x}`, 0.5) ? 1 : -1)));
  }
  for (let l = 1; l < lanes; l++) {
    const sx = Math.round((W * l) / (lanes + 1)) + S.jitter(`spurX${l}`, 2);
    const top = 3 + S.int(`spurTop${l}`, 3);
    const bot = H - 4 - S.int(`spurBot${l}`, 3);
    for (let y = Math.min(top, bot); y < Math.max(top, bot); y++) g.set(sx, y, ':');
  }

  // scattered houses on both sides of the lane (never one strip), with a
  // couple of required-door / landmark facades reserved
  const props: PropDef[] = [];
  const signs: SignDef[] = [];
  const reserved = [...(r.requiredDoors ?? []), ...(r.landmarks ?? [])];
  const houseXs: number[] = [];
  for (let i = 0; i < Math.max(4, Math.round((W * H) / 90)); i++) {
    const hx = 3 + S.int(`hx${i}`, W - 8);
    const hy = 4 + S.int(`hy${i}`, H - 10);
    if (houseXs.some((x) => Math.abs(x - hx) < 5)) continue;
    houseXs.push(hx);
    const u = (S.range(`hu${i}`, 1, 2) as 1 | 2);
    let door: { to: string; tx: number; ty: number } | undefined;
    let sprite = pack.buildings[S.int(`hsprite${i}`, pack.buildings.length)];
    if (reserved.length) {
      const role = reserved.shift() as string;
      sprite = ROLE_FACADE[role] ?? sprite;
      door = { to: `${r.id}__${role}_int`, tx: 144, ty: 150 };
    }
    props.push(placeFacade(sprite, hx, hy * 16 + 60, 4, u, door));
    if (S.chance(`htree${i}`, 0.5)) props.push(tree(hx + 5, hy + 1, pack.pines));
  }

  // commons dressing + rest points near the entrance edge
  const entranceY = H - 3;
  props.push(furniture('payphone', 3, entranceY));
  const phones = [{ x: 3, y: entranceY }];
  for (let i = 0; i < (r.picnicCount ?? 0); i++) {
    props.push(furniture('picnic', 7 + i * 5, entranceY - 1));
  }
  for (const [tx, ty] of [[2, 2], [W - 3, 2], [2, H - 4], [W - 4, H - 5]] as const) {
    if (S.chance(`edgeTree${tx}_${ty}`, 0.7)) props.push(tree(tx, ty, pack.pines));
  }

  const npcs: DraftNpc[] = [];
  for (let i = 0; i < (r.npcSlots ?? 0); i++) {
    npcs.push(slot(S, i, 5 + ((i * 4) % (W - 10)), Math.round(H / 2) + (i % 2 ? 2 : -2)));
  }

  const spawners: SpawnerDef[] = [
    { enemies: bandEnemies(r.encounterBand), count: 2, rect: { x: 1, y: 1, w: W - 2, h: 2 } },
  ];

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    settlement: 'town',
    grid: g.out(),
    props,
    npcs,
    signs,
    phones,
    doors: [
      { x: Math.round(W / 2) - 1, y: H - 1, w: 2, h: 1, to: `${r.id}__exit`, tx: 16, ty: 16, facing: 'up', indicator: 'none' },
    ],
    spawners,
    triggers: [],
  };
}

/* ============================ buildVillage ============================ */

export function buildVillage(r: VillageRecipe): DraftMapDef {
  const [W, H] = clampSize(r.size, 24, 20);
  const S = new Streams(r.seed);
  const pack = STYLE_PACKS[r.style];
  const g = new Grid(W, H, pack.ground);
  g.sprinkle(streamSeed(r.seed, 'sprinkle'), pack.sprinkle, 0.12);

  // one organic cluster around a central commons (a well on the green)
  const cx = Math.round(W / 2);
  const cy = Math.round(H / 2);
  // short radial paths from the commons
  for (const ang of [0, 1, 2, 3]) {
    const dx = ang === 1 ? 1 : ang === 3 ? -1 : 0;
    const dy = ang === 0 ? 1 : ang === 2 ? -1 : 0;
    for (let s = 1; s < Math.min(W, H) / 2 - 1; s++) g.set(cx + dx * s, cy + dy * s, ':');
  }

  const props: PropDef[] = [furniture('well', cx - 1, cy - 1)];
  const signs: SignDef[] = [];
  const reserved = [...(r.requiredDoors ?? []), ...(r.landmarks ?? [])];
  const houses: Array<[number, number]> = [];
  for (let i = 0; i < Math.max(3, Math.round((W * H) / 110)); i++) {
    const a = (i / Math.max(3, Math.round((W * H) / 110))) * Math.PI * 2;
    const rad = 4 + S.int(`vrad${i}`, 3);
    const hx = Math.round(cx + Math.cos(a) * rad) - 2;
    const hy = Math.round(cy + Math.sin(a) * rad) - 1;
    if (hx < 2 || hx > W - 6 || hy < 2 || hy > H - 5) continue;
    if (houses.some(([x, y]) => Math.abs(x - hx) < 4 && Math.abs(y - hy) < 3)) continue;
    houses.push([hx, hy]);
    let door: { to: string; tx: number; ty: number } | undefined;
    let sprite = pack.buildings[S.int(`vsprite${i}`, pack.buildings.length)];
    if (reserved.length) {
      const role = reserved.shift() as string;
      sprite = ROLE_FACADE[role] ?? sprite;
      door = { to: `${r.id}__${role}_int`, tx: 144, ty: 150 };
    }
    props.push(placeFacade(sprite, hx, hy * 16 + 60, 4, 1, door));
  }
  for (const [tx, ty] of [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]] as const) {
    if (S.chance(`vtree${tx}_${ty}`, 0.8)) props.push(tree(tx, ty, pack.pines));
  }

  const entranceY = H - 3;
  props.push(furniture('payphone', 3, entranceY));
  const phones = [{ x: 3, y: entranceY }];
  for (let i = 0; i < (r.picnicCount ?? 0); i++) props.push(furniture('picnic', 6 + i * 5, entranceY - 1));

  const npcs: DraftNpc[] = [];
  for (let i = 0; i < (r.npcSlots ?? 0); i++) {
    const a = (i / Math.max(1, r.npcSlots ?? 1)) * Math.PI * 2;
    npcs.push(slot(S, i, Math.round(cx + Math.cos(a) * 2), Math.round(cy + Math.sin(a) * 2)));
  }

  return {
    id: r.id,
    name: r.id.replace(/_/g, ' ').toUpperCase(),
    music: null,
    settlement: 'village',
    grid: g.out(),
    props,
    npcs,
    signs,
    phones,
    doors: [
      { x: cx - 1, y: H - 1, w: 2, h: 1, to: `${r.id}__exit`, tx: 16, ty: 16, facing: 'up', indicator: 'none' },
    ],
    spawners: [{ enemies: bandEnemies(r.encounterBand), count: 2, rect: { x: 1, y: 1, w: W - 2, h: 2 } }],
    triggers: [],
  };
}

/* ============================ buildDistrict ============================ *
 * THE FORGE AS A DISTRICT LIBRARY (S15h, ADR-049). buildCity/buildTown each
 * build a WHOLE map from a blank grid — too coarse to graft new growth onto a
 * SHIPPED core. buildDistrict is the same grammar made stitchable: it lays a
 * GRID district (the buildCity skeleton — streets, an avenue, jittered facade
 * rows north of each street, crosswalks, a nibbled park) or an ORGANIC one
 * (the buildTown skeleton — a bending lane + scattered houses, never a strip)
 * INTO a sub-rectangle of an existing Grid, and returns ONLY the props/signs
 * it added. It never writes outside `region`, so a frozen core copied into the
 * top-left stays byte-identical; determinism still rides the named Streams
 * (Prime Law 2 — no Date.now/Math.random). NPC slots are NOT emitted: canon
 * growth hand-authors its souls (Prime Laws 1 + 3), the forge lays the bones.
 */
export interface DistrictRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** a facade the district must open into a named interior (assigned in order) */
export interface DistrictReserve {
  /** the door target map id */
  to: string;
  /** force this facade sprite (else the role/catalog default) */
  sprite?: string;
  /** spawn point inside the target (defaults to the kit's 144,150) */
  tx?: number;
  ty?: number;
  /** drop a readable sign over the facade keyed on this dialogue id */
  sign?: string;
}

export interface DistrictOpts {
  /** 'grid' = the buildCity block grammar; 'organic' = buildTown's lanes */
  layout: 'grid' | 'organic';
  style: SettlementStyle;
  /** grid: absolute E–W street rows (each 3 tall, spanning the region width) */
  streetRows?: readonly number[];
  /** grid: absolute N–S avenue columns (each 3 wide, spanning the region height) */
  avenueCols?: readonly number[];
  /** organic: how many bending lanes branch the network (default 2) */
  lanes?: number;
  /** facades that must open a named door (assigned to lots in order) */
  reserve?: readonly DistrictReserve[];
  /** override the building catalog (defaults to the style pack's) — pass an
   *  AREA_SKINS roster so each area draws only its own facades (ADR-050) */
  catalog?: readonly string[];
  /** the tallest NON-MEGA facade the district's ROWS draw (default 2). A sleepy
   *  town stays low (2–3); a downtown passes a higher cap (or omits it) so its
   *  offices/hotels land. The top≥regionTop guard still rejects anything that
   *  would poke above the region (into a core copied just above it). */
  maxStories?: number;
  /** ADR-054 — run a MEGA PASS: after the rows, drop the catalog's MEGA towers
   *  (isMega: u≥11) backing onto the region's DEEPEST edge, where the most sky
   *  is. Same top≥regionTop + spacing guards, so a tower never sinks through the
   *  street or pokes into a frozen core. Brickton-class downtowns set this. */
  mega?: boolean;
  /** lay a region-bounded ground sprinkle (never touches a copied-in core) */
  sprinkle?: boolean;
  /** ADR-053: a SHARED building-footprint list. Pass the same array to every
   *  buildDistrict call for one map and the spacing law holds ACROSS regions too
   *  (no two buildings seal a walkway at a region seam). Seeded + appended. */
  occupied?: Array<{ x: number; y: number; w: number; h: number }>;
}

export interface DistrictResult {
  props: PropDef[];
  /** facade doors are carried on the props; this stays for edge stubs the
   *  caller may want the helper to compute later (empty today) */
  doors: DoorZone[];
  signs: SignDef[];
}

/** a placed building's tile-space footprint (for the spacing law) */
interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * THE SPACING LAW (S15i, ADR-053): two buildings must never seal a walkway shut.
 * Since collision now matches a facade's TRUE drawn footprint, the grammar must
 * place each building at its real size (BUILDING_DIMS) and keep PLACE_MARGIN
 * walkable tiles between footprints — so anywhere the player can walk, there's a
 * lane, never a wall of touching buildings.
 */
const PLACE_MARGIN = 2;

/** does `r` keep ≥ PLACE_MARGIN tiles from every already-placed footprint? */
function hasGap(r: TileRect, placed: readonly TileRect[]): boolean {
  const m = PLACE_MARGIN;
  return !placed.some(
    (q) =>
      r.x - m < q.x + q.w && r.x + r.w + m > q.x && r.y - m < q.y + q.h && r.y + r.h + m > q.y,
  );
}

/**
 * Try to place ONE district facade at (x, bottomPx). Chooses the sprite (a
 * reserved door/role wins), sizes it from BUILDING_DIMS (so it renders + collides
 * at exactly the footprint we space against), and places it ONLY if its footprint
 * (a) stays inside the region top and (b) keeps a walkable margin from every
 * building already placed. Returns null (and leaves any reserve unspent) when
 * there's no room — the caller advances and tries the next lot.
 */
function tryPlaceFacade(
  S: Streams,
  catalog: readonly string[],
  reserve: DistrictReserve[],
  signs: SignDef[],
  placed: TileRect[],
  regionTop: number,
  regionRight: number,
  key: string,
  x: number,
  bottomPx: number,
): PropDef | null {
  const pick = catalog[S.int(`${key}_sprite`, catalog.length)];
  const res = reserve[0];
  const sprite = res ? res.sprite ?? ROLE_FACADE[res.to] ?? pick : pick;
  const { w, u } = facadeDims(sprite);
  const top = Math.floor((bottomPx - cityBuildingHeight(u)) / 16);
  // a facade may never poke above the region (into a core copied just above it)
  // nor past its right edge, and must keep a walkable lane from its neighbours
  const foot: TileRect = { x, y: top, w, h: Math.ceil(cityBuildingHeight(u) / 16) };
  if (top < regionTop || x + w > regionRight || !hasGap(foot, placed)) return null;
  let door: { to: string; tx: number; ty: number } | undefined;
  if (res) {
    reserve.shift();
    door = { to: res.to, tx: res.tx ?? 144, ty: res.ty ?? 150 };
    if (res.sign) signs.push({ x: x + 1, y: Math.max(0, top - 1), dialogue: res.sign });
  }
  placed.push(foot);
  return placeFacade(sprite, x, bottomPx, w, u, door);
}

export function buildDistrict(g: Grid, region: DistrictRegion, S: Streams, opts: DistrictOpts): DistrictResult {
  const pack = STYLE_PACKS[opts.style];
  const props: PropDef[] = [];
  const doors: DoorZone[] = [];
  const signs: SignDef[] = [];
  const reserve = [...(opts.reserve ?? [])];
  const catalog = opts.catalog ?? pack.buildings;
  const maxU = opts.maxStories ?? 2;
  const { x: rx, y: ry, w: rw, h: rh } = region;
  const rRight = rx + rw;
  const rBot = ry + rh;
  // ADR-053/054: ONE shared footprint list across the whole region (and across
  // regions when `occupied` is passed) — the row pass, the mega pass, and other
  // districts all space against it, so no two buildings ever seal a walkway.
  const placedRects: TileRect[] = opts.occupied ?? [];

  // region-bounded sprinkle — a SEPARATE named stream so it can't shift the
  // structural jitter, and it only fills cells already at the default '.'
  // (a copied-in core never holds '.', so the core is never touched)
  if (opts.sprinkle) {
    const next = S.use('districtSprinkle');
    for (let y = ry; y < rBot; y++) {
      for (let x = rx; x < rRight; x++) {
        if (g.rows[y]?.[x] === '.' && next() < 0.1) {
          g.set(x, y, pack.sprinkle[Math.floor(next() * pack.sprinkle.length)]);
        }
      }
    }
  }

  // ADR-054 — THE MEGA PASS runs FIRST so the towers claim their wide deep-edge
  // footprints; the row pass then SPACES its shorter facades into the gaps around
  // them (they share `placedRects`), so a downtown reads as towers among walk-ups.
  // tryPlaceFacade's top≥regionTop guard rejects any tower whose body would poke
  // above the region (into a core copied just above it); the spacing law keeps a
  // walkable lane around each — you ROUND a tower on foot, never clip it.
  if (opts.mega) {
    const deepStreet = opts.layout === 'grid' && opts.streetRows?.length ? Math.max(...opts.streetRows) : rBot - 2;
    const bottomPx = deepStreet * 16 - 4;
    // only megas that actually FIT this region — narrow enough to leave a lane,
    // short enough that their top stays inside it. Oversized landmark colossi are
    // hand-placed in their own carved plaza; the pass keeps picks from being wasted.
    const megas = catalog.filter(
      (s) => isMega(s) && facadeDims(s).w + PLACE_MARGIN <= rw && bottomPx - cityBuildingHeight(facadeDims(s).u) >= ry * 16,
    );
    if (megas.length) {
      let x = rx + 1 + S.int('megaStart', 3);
      let placed = 0;
      while (x < rRight - 6 && placed < 40) {
        const prop = tryPlaceFacade(S, megas, [], signs, placedRects, ry, rRight - 1, `mega${placed}`, x, bottomPx);
        if (prop) {
          props.push(prop);
          x += facadeDims(prop.sprite).w + 1 + S.int(`megaGap${placed}`, 2);
        } else {
          x += 3;
        }
        placed++;
      }
    }
  }

  if (opts.layout === 'grid') {
    const streetRows = opts.streetRows ?? [];
    const avenueCols = opts.avenueCols ?? [];
    // streets span the region width; avenues span its height (the connectors)
    for (const sy of streetRows) g.rect(rx, sy, rw, 3, 'R');
    for (const ax of avenueCols) g.rect(ax, ry, 3, rh, 'R');
    // dashed centerlines, phase-shifted per street, broken where avenues cross
    const avenueSet = new Set(avenueCols.flatMap((ax) => [ax - 1, ax, ax + 1, ax + 2, ax + 3]));
    streetRows.forEach((sy, i) => {
      for (let x = rx; x < rRight; x++) {
        if ((x + i) % 4 < 2 && !avenueSet.has(x)) g.set(x, sy + 1, 'D');
      }
    });
    // crosswalks flank each avenue at each street (clamped INSIDE the region —
    // a stripe must never reach back over a core copied just outside it)
    for (const ax of avenueCols) {
      for (const sy of streetRows) {
        if (ax - 2 >= rx) g.rect(ax - 2, sy, 2, 3, 'X');
        if (ax + 5 <= rRight) g.rect(ax + 3, sy, 2, 3, 'X');
      }
    }
    // an irregular park (negative space) in the first wide gap, corners nibbled
    if (streetRows.length >= 2) {
      const py = streetRows[0] + 4;
      const ph = Math.min(5, streetRows[1] - py - 1);
      if (ph > 2) {
        const px0 = rx + 3 + S.int('gParkX', 4);
        const pw = Math.min(12, rRight - px0 - 3);
        if (pw > 5) {
          g.rect(px0, py, pw, ph, pack.ground);
          g.rect(px0, py, 1 + S.int('gParkNibA', 3), 1, pack.pave);
          g.rect(px0 + pw - 3 + S.int('gParkNibB', 2), py, 3, 1, pack.pave);
        }
      }
    }
    // a jittered facade row north of EACH street (≥2 block faces by construction).
    // catalog-driven + spaced: each lot is placed at its TRUE size and only if it
    // keeps a walkable lane from every other building (ADR-053 — never a sealed row)
    const doorCols = new Set<number>();
    // rows draw NON-mega facades only, honouring the height cap; megas (if any)
    // are the mega pass's job (they need the region's deep edge for their sky)
    const catU = catalog.filter((s) => !isMega(s) && facadeDims(s).u <= maxU);
    const rowCatalog = catU.length ? catU : catalog.filter((s) => !isMega(s));
    streetRows.forEach((sy, si) => {
      const bottomPx = sy * 16 - 4;
      let x = rx + 1 + S.int(`gBldgStart${si}`, 2);
      let placed = 0;
      while (x < rRight - 6) {
        if (avenueSet.has(x) || avenueSet.has(x + 4)) {
          const next = avenueCols.filter((a) => a >= x);
          x = (next.length ? Math.max(...next) : x) + 5;
          continue;
        }
        const prop = tryPlaceFacade(S, rowCatalog, reserve, signs, placedRects, ry, rRight - 1, `gBldg${si}_${placed}`, x, bottomPx);
        const advance = (prop ? facadeDims(prop.sprite).w : 4) + 1 + S.int(`gGap${si}_${placed}`, 2);
        if (prop) {
          if (prop.door) doorCols.add(Math.round(prop.x) + 2);
          props.push(prop);
          if (S.chance(`gAlley${si}_${placed}`, 0.5)) {
            props.push(furniture('dumpster', x + facadeDims(prop.sprite).w, (bottomPx - 70) / 16));
          }
        }
        x += advance;
        placed++;
      }
    });
    // street furniture on the sidewalk just south of each street
    streetRows.forEach((sy, si) => {
      const fy = sy + 3;
      if (fy >= rBot - 1) return;
      for (let fx = rx + 3; fx < rRight - 3; fx += 3 + S.int(`gFurnStep${si}_${fx}`, 3)) {
        if (doorCols.has(fx) || avenueSet.has(fx)) continue;
        if (S.chance(`gFurnSkip${si}_${fx}`, 0.45)) continue;
        props.push(furniture(pack.furniture[S.int(`gFurnPick${si}_${fx}`, pack.furniture.length)], fx, fy));
      }
    });
    // street trees lining the southmost sidewalk
    const lastFy = streetRows.length ? streetRows[streetRows.length - 1] + 3 : ry + 2;
    for (let tx = rx + 3; tx < rRight - 3; tx += 4) {
      if (avenueSet.has(tx) || doorCols.has(tx)) continue;
      if (lastFy + 1 < rBot - 1 && S.chance(`gTree${tx}`, 0.55)) props.push(tree(tx, lastFy + 1, pack.pines));
    }
  } else {
    // ORGANIC: a bending main lane across the region + branching spurs, then
    // scattered houses on both sides (never a single strip — buildTown's law)
    const lanes = opts.lanes ?? 2;
    let ly = ry + Math.round(rh / 2);
    for (let x = rx + 1; x < rRight - 1; x++) {
      g.rect(x, ly, 1, 2, ':');
      if (S.chance(`oBend${x}`, 0.18)) {
        ly = Math.max(ry + 2, Math.min(rBot - 4, ly + (S.chance(`oBendDir${x}`, 0.5) ? 1 : -1)));
      }
    }
    for (let l = 1; l < lanes; l++) {
      const sx = rx + Math.round((rw * l) / (lanes + 1)) + S.jitter(`oSpurX${l}`, 2);
      const top = ry + 2 + S.int(`oSpurTop${l}`, 3);
      const bot = rBot - 3 - S.int(`oSpurBot${l}`, 3);
      for (let y = Math.min(top, bot); y < Math.max(top, bot); y++) g.set(sx, y, ':');
    }
    // scattered, catalog-sized, SPACED houses — tryPlaceFacade rejects any lot
    // whose true footprint would touch a neighbour, so a path is never sealed
    // (ADR-053). Honour the height cap so a tall facade can't poke into the core.
    const catU = catalog.filter((s) => !isMega(s) && facadeDims(s).u <= maxU);
    const houseCatalog = catU.length ? catU : catalog.filter((s) => !isMega(s));
    // over-generate candidates: the spacing law caps real density, so more
    // attempts FILL the district with spaced buildings instead of leaving it bare
    const count = Math.max(8, Math.round((rw * rh) / 45));
    for (let i = 0; i < count; i++) {
      const hx = rx + 3 + S.int(`oHx${i}`, Math.max(1, rw - 8));
      const hy = ry + 3 + S.int(`oHy${i}`, Math.max(1, rh - 9));
      const prop = tryPlaceFacade(S, houseCatalog, reserve, signs, placedRects, ry, rRight - 1, `oHouse${i}`, hx, hy * 16 + 60);
      if (!prop) continue;
      props.push(prop);
      if (S.chance(`oTree${i}`, 0.5)) props.push(tree(hx + facadeDims(prop.sprite).w + 1, hy + 1, pack.pines));
    }
  }

  return { props, doors, signs };
}

/* ===================== NOOKS + POCKETS (S15i, ADR-054) ===================== *
 * The variety verbs §B4's size law calls for — small, hand-feeling pockets a
 * grown map grafts in so it never reads squared-off (a wooded pocket, an
 * underground sewer stretch, the placeNook family). Each writes ONLY inside its
 * region (the frozen-core guarantee), rides the named Streams (Prime Law 2), and
 * returns a DistrictResult; the session wires the door / hidden reward at
 * promotion. A present belongs in a nook (§B4 — every grown area earns its size).
 */

const clampN = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** the nook palette (§B4) — placeNook grafts ONE of these */
export type NookKind = 'shack' | 'alley' | 'lot' | 'courtyard' | 'rooftop';

/**
 * A WOODED POCKET: a winding clearing path threads the region end to end and one
 * central GLADE stays open (a hidden-reward spot); trees fill the rest, never on
 * the path corridor (so the pocket is always walkable — no soft-lock).
 */
export function buildWoods(
  g: Grid,
  region: DistrictRegion,
  S: Streams,
  opts?: { pines?: boolean; density?: number; gladeProp?: string },
): DistrictResult {
  const { x: rx, y: ry, w: rw, h: rh } = region;
  const rRight = rx + rw;
  const rBot = ry + rh;
  const props: PropDef[] = [];
  const pathY: number[] = [];
  let py = clampN(ry + Math.round(rh / 2), ry + 1, rBot - 2);
  for (let x = rx; x < rRight; x++) {
    g.set(x, py, ':');
    pathY[x] = py;
    if (S.chance(`woodsBend${x}`, 0.24)) py = clampN(py + (S.chance(`woodsDir${x}`, 0.5) ? 1 : -1), ry + 1, rBot - 2);
  }
  const gladeX = rx + Math.round(rw / 2);
  const gladeY = pathY[gladeX] ?? py;
  // the GLADE reward (a hidden rest/present) — placed on the cleared glade,
  // reachable via the path. Pushed FIRST so it survives a tight prop budget.
  if (opts?.gladeProp) props.push(furniture(opts.gladeProp, clampN(gladeX - 1, rx, rRight - 2), gladeY));
  const density = opts?.density ?? 0.42;
  for (let y = ry; y < rBot; y++) {
    for (let x = rx; x < rRight; x++) {
      if (Math.abs(y - (pathY[x] ?? py)) <= 1) continue; // keep the path corridor clear
      if (Math.abs(x - gladeX) <= 2 && Math.abs(y - gladeY) <= 1) continue; // the glade
      if (S.chance(`woodsT${x}_${y}`, density)) props.push(tree(x, y, opts?.pines));
    }
  }
  return { props, doors: [], signs: [] };
}

/**
 * AN UNDERGROUND SEWER STRETCH: brick-walled, plank service ledges, a solid water
 * channel down the middle you cross at plank gaps (both banks stay connected, so
 * it's walkable end to end). A session wires the manhole door + what's down here.
 */
export function buildUnderground(g: Grid, region: DistrictRegion, S: Streams, opts?: { channel?: boolean }): DistrictResult {
  const { x: rx, y: ry, w: rw, h: rh } = region;
  const rRight = rx + rw;
  const rBot = ry + rh;
  g.rect(rx, ry, rw, rh, 'w'); // the service floor (plank)
  g.rect(rx, ry, rw, 1, 'B'); // brick walls ring the stretch
  g.rect(rx, rBot - 1, rw, 1, 'B');
  g.rect(rx, ry, 1, rh, 'B');
  g.rect(rRight - 1, ry, 1, rh, 'B');
  if (opts?.channel !== false && rh >= 6) {
    const cy = ry + Math.round(rh / 2);
    for (let x = rx + 2; x < rRight - 2; x++) {
      if ((x - rx) % 5 !== 0) g.set(x, cy, 'e'); // water, but a plank crossing every 5th tile
    }
    g.set(rx + 1, cy, 'E');
    g.set(rRight - 2, cy, 'E');
  }
  const props: PropDef[] = [];
  if (rh >= 7) {
    for (let i = 0; i < Math.max(1, Math.round((rw * rh) / 110)); i++) {
      const px = clampN(rx + 2 + S.int(`sewX${i}`, Math.max(1, rw - 4)), rx + 2, rRight - 3);
      props.push(furniture('dumpster', px, ry + 1)); // junk against the top wall
    }
  }
  return { props, doors: [], signs: [] };
}

/**
 * ONE detailed NOOK grafted into a region (the §B4 palette). Each is a small,
 * irregular pocket with somewhere a present can hide. Region-contained + seeded.
 * 'shack' opens a low facade (pass a 1-area catalog + an optional reserved door).
 */
export function placeNook(
  g: Grid,
  region: DistrictRegion,
  S: Streams,
  kind: NookKind,
  opts?: { catalog?: readonly string[]; reserve?: DistrictReserve },
): DistrictResult {
  const { x: rx, y: ry, w: rw, h: rh } = region;
  const rRight = rx + rw;
  const rBot = ry + rh;
  const props: PropDef[] = [];
  const signs: SignDef[] = [];
  const placed: TileRect[] = [];
  switch (kind) {
    case 'shack': {
      const cat = opts?.catalog ?? ['bldg_brownstone'];
      const reserve = opts?.reserve ? [opts.reserve] : [];
      const prop = tryPlaceFacade(S, cat, reserve, signs, placed, ry, rRight - 1, 'nookShack', rx + 1, (rBot - 1) * 16 - 4);
      if (prop) props.push(prop);
      for (let x = rx; x < rRight; x++) g.set(x, rBot - 1, '-'); // a low yard fence
      break;
    }
    case 'alley': {
      const ax = rx + Math.round(rw / 2);
      g.rect(ax, ry, 1, rh, ':'); // the 1-wide slot
      if (ax - 1 >= rx) g.rect(ax - 1, ry, 1, rh, 'B');
      if (ax + 1 < rRight) g.rect(ax + 1, ry, 1, rh, 'B');
      props.push(furniture('dumpster', ax, rBot - 2));
      break;
    }
    case 'lot': {
      g.rect(rx, ry, rw, 1, '-'); // a fenced vacant lot
      g.rect(rx, rBot - 1, rw, 1, '-');
      g.rect(rx, ry, 1, rh, '|');
      g.rect(rRight - 1, ry, 1, rh, '|');
      props.push(furniture('trash_can', rx + 2, ry + 2));
      break;
    }
    case 'courtyard': {
      g.rect(rx, ry, rw, rh, '='); // a paved square
      for (let x = rx; x < rRight; x++) {
        if (S.chance(`cyTop${x}`, 0.7)) g.set(x, ry, 'b'); // hedge ring, corners nibbled
        if (S.chance(`cyBot${x}`, 0.7)) g.set(x, rBot - 1, 'b');
      }
      props.push(furniture('bench', rx + clampN(Math.round(rw / 2) - 1, 0, rw - 2), ry + Math.round(rh / 2)));
      break;
    }
    case 'rooftop': {
      g.rect(rx, ry, rw, rh, '='); // the deck
      for (let x = rx; x < rRight; x++) {
        g.set(x, ry, 'b'); // a parapet rings the roof
        g.set(x, rBot - 1, 'b');
      }
      for (let y = ry; y < rBot; y++) {
        g.set(rx, y, 'b');
        g.set(rRight - 1, y, 'b');
      }
      props.push(furniture('water_cooler', rx + 2, ry + 2));
      props.push(furniture('plant_pot', rRight - 3, rBot - 3));
      break;
    }
  }
  return { props, doors: [], signs };
}
