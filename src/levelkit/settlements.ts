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
} from '../schemas';
import { Streams, streamSeed } from './rng';
import {
  Grid,
  STYLE_PACKS,
  ROLE_FACADE,
  BAND_ROSTER,
  placeFacade,
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
