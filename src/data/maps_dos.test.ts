import { describe, expect, it } from 'vitest';
import {
  CHAR_LEGEND,
  HOLDING_DOOR_GAP,
  HOLDING_ROOM,
  MAPS,
  carveHoldingRoom,
  type DoorZone,
  type MapDef,
  type NpcDef,
  type PropDef,
} from './maps';
import { TILESET } from '../spritegen/tiles';
import {
  NPC_FOOTPRINT,
  PATROL_FOOTPRINT,
  PLAYER_FOOTPRINT,
  characterFeet,
  footRect,
  npcEffectiveScale,
} from '../engine/actor-collision';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const solidByName = new Map(TILESET.map((tile) => [tile.name, tile.solid]));
const isSolidChar = (ch: string): boolean =>
  ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function doorCell(door: DoorZone): readonly [number, number] {
  return [Math.floor(door.x + door.w / 2), Math.floor(door.y + door.h / 2)];
}

function shortestPath(grid: string[], from: readonly [number, number], to: readonly [number, number]): number {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const queue: Array<readonly [number, number]> = [from];
  const distance = new Map<string, number>([[`${from[0]},${from[1]}`, 0]]);

  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    const d = distance.get(`${x},${y}`)!;
    if (x === to[0] && y === to[1]) return d;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || distance.has(key) || isSolidChar(grid[ny][nx])) continue;
      distance.set(key, d + 1);
      queue.push([nx, ny]);
    }
  }
  return Number.POSITIVE_INFINITY;
}

function reachable(grid: string[], from: readonly [number, number], to: readonly [number, number]): boolean {
  return Number.isFinite(shortestPath(grid, from, to));
}

function visibleInPhase(
  def: { ifFlag?: string; unlessFlag?: string },
  flags: ReadonlySet<string>,
): boolean {
  return (!def.ifFlag || flags.has(def.ifFlag)) && (!def.unlessFlag || !flags.has(def.unlessFlag));
}

function propSolids(prop: PropDef): Rect[] {
  const authored = prop.solidParts ?? (prop.solid ? [prop.solid] : []);
  const rawScale = prop.scale;
  const sx = typeof rawScale === 'number' ? rawScale : rawScale?.x ?? 1;
  const sy = typeof rawScale === 'number' ? rawScale : rawScale?.y ?? 1;
  const displayW = (prop.sprite === 'ch3_viaduct_arch' ? 72 : prop.sprite === 'ch3_trilithon' ? 72 : 16) * sx;
  const displayH = (prop.sprite === 'ch3_viaduct_arch' ? 134 : prop.sprite === 'ch3_trilithon' ? 116 : 16) * sy;
  return authored.map((part) => {
    let x = part.ox * sx;
    let y = part.oy * sy;
    let w = part.w * sx;
    let h = part.h * sy;
    if (prop.rot === 90) [x, y, w, h] = [displayH - y - h, x, h, w];
    else if (prop.rot === 180) [x, y] = [displayW - x - w, displayH - y - h];
    else if (prop.rot === 270) [x, y, w, h] = [y, displayW - x - w, h, w];
    return { x: prop.x * 16 + x, y: prop.y * 16 + y, w, h };
  });
}

function npcBody(npc: NpcDef, mapId: string): Rect {
  return footRect(
    characterFeet(npc.x, npc.y),
    NPC_FOOTPRINT,
    npcEffectiveScale(mapId, npc.dog === true, npc.scale),
  );
}

function tileSolids(grid: string[]): Rect[] {
  const out: Rect[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (isSolidChar(grid[y][x])) out.push({ x: x * 16, y: y * 16, w: 16, h: 16 });
    }
  }
  return out;
}

function staticSolids(map: MapDef, grid: string[], flags: ReadonlySet<string>): Rect[] {
  const props = map.props
    .filter((prop) => visibleInPhase(prop, flags))
    // buildHoldingDoor deliberately drops its solid once the quota opens it.
    .filter((prop) => !(prop.sprite === 'holding_door' && flags.has('holding_open')))
    .flatMap(propSolids);
  const pinnedNpcs = map.npcs
    .filter((npc) => visibleInPhase(npc, flags))
    .filter((npc) => npc.stationary === true || npc.wander !== true)
    .map((npc) => npcBody(npc, map.id));
  return [...tileSolids(grid), ...props, ...pinnedNpcs];
}

function playerBodyAt(tx: number, ty: number): Rect {
  return footRect({ x: tx, y: ty }, PLAYER_FOOTPRINT);
}

function expectLandingClear(map: MapDef, tx: number, ty: number, flags: ReadonlySet<string>): void {
  const grid = map.id === 'dos_f3' && flags.has('holding_open') ? carveHoldingRoom(map.grid) : map.grid;
  const player = playerBodyAt(tx, ty);
  expect(
    staticSolids(map, grid, flags).some((solid) => overlaps(player, solid)),
    `${map.id} landing (${tx},${ty}) must fit the full player body`,
  ).toBe(false);
}

function canCoexist(a: NpcDef, b: NpcDef): boolean {
  if (a.ifFlag && a.ifFlag === b.unlessFlag) return false;
  if (b.ifFlag && b.ifFlag === a.unlessFlag) return false;
  return true;
}

describe('Department of Smiles production rebuild', () => {
  const f1 = MAPS.dos_f1;
  const f2 = MAPS.dos_f2;
  const f3 = MAPS.dos_f3;

  it('ships the enlarged three-stage compound footprint', () => {
    expect([f1.grid[0].length, f1.grid.length]).toEqual([40, 26]);
    expect([f2.grid[0].length, f2.grid.length]).toEqual([48, 32]);
    expect([f3.grid[0].length, f3.grid.length]).toEqual([42, 28]);
  });

  it('uses the dedicated blue campus palette and rewards exploration with two presents', () => {
    for (const map of [f1, f2, f3]) {
      const cells = map.grid.join('');
      expect(cells.includes('Q'), `${map.id} needs blue walkable floor`).toBe(true);
      expect(cells.includes('L'), `${map.id} needs blue chapel walls`).toBe(true);
      expect(cells.includes('M'), `${map.id} needs ceremonial runner accents`).toBe(true);
    }
    const giftFlags = f2.props
      .filter((prop) => prop.sprite === 'gift_box')
      .map((prop) => prop.unlessFlag)
      .sort();
    expect(giftFlags).toEqual(['dos_gift_cola', 'dos_gift_lunch']);
    expect(f2.signs.filter((sign) => giftFlags.includes(sign.dialogue)).length).toBe(2);
  });

  it('cannot bypass the floor-one switchbacks or floor-two doctrine maze', () => {
    const f1Street = f1.doors.find((door) => door.to === 'brickton');
    const f1Elevator = f1.doors.find((door) => door.to === 'dos_f2' && !door.ifFlag);
    const f2Elevator = f2.doors.find((door) => door.to === 'dos_f1' && !door.ifFlag);
    const f2Stairs = f2.doors.find((door) => door.to === 'dos_f3' && !door.ifFlag);
    expect(f1Street).toBeDefined();
    expect(f1Elevator).toBeDefined();
    expect(f2Elevator).toBeDefined();
    expect(f2Stairs).toBeDefined();

    const f1Distance = shortestPath(f1.grid, doorCell(f1Street!), doorCell(f1Elevator!));
    const f2Distance = shortestPath(f2.grid, doorCell(f2Elevator!), doorCell(f2Stairs!));
    expect(Number.isFinite(f1Distance)).toBe(true);
    expect(Number.isFinite(f2Distance)).toBe(true);
    expect(f1Distance).toBeGreaterThanOrEqual(60);
    expect(f2Distance).toBeGreaterThanOrEqual(120);
  });

  it('keeps exactly three persistent quota patrols', () => {
    const patrols = f3.patrols ?? [];
    expect(patrols.map((patrol) => patrol.id).sort()).toEqual(['f3a', 'f3b', 'f3c']);
    expect(patrols.map((patrol) => patrol.countFlag).sort()).toEqual([
      'dos_quota_f3a',
      'dos_quota_f3b',
      'dos_quota_f3c',
    ]);
    expect(new Set(patrols.map((patrol) => patrol.countFlag)).size).toBe(3);
    expect(patrols.map((patrol) => patrol.support)).toEqual([
      ['mandatory_memo'],
      ['motivational_poster'],
      ['quota_clock'],
    ]);
  });

  it('seals the relocated holding room until quota, then opens a reachable room without mutating canon data', () => {
    expect(HOLDING_ROOM).toEqual({ x: 3, y: 2, w: 10, h: 8 });
    expect(HOLDING_DOOR_GAP).toEqual({ x: 7, w: 2 });
    const stair = f3.doors.find((door) => door.to === 'dos_f2' && !door.ifFlag);
    const faye = f3.npcs.find((npc) => npc.id === 'faye');
    expect(stair).toBeDefined();
    expect(faye).toBeDefined();
    const start = doorCell(stair!);
    const captive = [Math.round(faye!.x), Math.round(faye!.y)] as const;

    expect(reachable(f3.grid, start, captive)).toBe(false);
    const sealedInterior = f3.grid[HOLDING_ROOM.y + 1][HOLDING_ROOM.x + 1];
    const opened = carveHoldingRoom(f3.grid);
    expect(reachable(opened, start, captive)).toBe(true);
    expect(isSolidChar(sealedInterior)).toBe(true);
    expect(f3.grid[HOLDING_ROOM.y + 1][HOLDING_ROOM.x + 1]).toBe(sealedInterior);
    for (let x = HOLDING_DOOR_GAP.x; x < HOLDING_DOOR_GAP.x + HOLDING_DOOR_GAP.w; x++) {
      expect(isSolidChar(f3.grid[HOLDING_ROOM.y + HOLDING_ROOM.h - 1][x])).toBe(true);
      expect(isSolidChar(opened[HOLDING_ROOM.y + HOLDING_ROOM.h - 1][x])).toBe(false);
    }
  });

  it('wires reciprocal landings and the post-Manager express elevator', () => {
    const bricktonEntry = MAPS.brickton.props.find((prop) => prop.door?.to === 'dos_f1')?.door;
    const f1ToF2 = f1.doors.find((door) => door.to === 'dos_f2' && !door.ifFlag);
    const f2ToF1 = f2.doors.find((door) => door.to === 'dos_f1' && !door.ifFlag);
    const f2ToF3 = f2.doors.find((door) => door.to === 'dos_f3' && !door.ifFlag);
    const f3ToF2 = f3.doors.find((door) => door.to === 'dos_f2' && !door.ifFlag);
    const f1Express = f1.doors.find((door) => door.to === 'dos_f3' && door.ifFlag === 'manager_defeated');
    const f3Express = f3.doors.find((door) => door.to === 'dos_f1' && door.ifFlag === 'manager_defeated');

    expect(bricktonEntry).toMatchObject({ tx: 320, ty: 394 });
    expect(f1.doors.find((door) => door.to === 'brickton')?.indicator).toBe('none');
    expect(f1ToF2).toMatchObject({ x: 3, y: 2, w: 2, tx: 64, ty: 60, indicator: 'elevator' });
    expect(f2ToF1).toMatchObject({ x: 3, y: 2, w: 2, tx: 64, ty: 60, indicator: 'elevator' });
    expect(f2ToF3).toMatchObject({ x: 44, y: 2, w: 1, tx: 632, ty: 60, indicator: 'stairs' });
    expect(f3ToF2).toMatchObject({ x: 39, y: 2, w: 1, tx: 712, ty: 60, indicator: 'stairs' });
    expect(f1Express).toMatchObject({ x: 35, y: 2, w: 2, tx: 400, ty: 60, indicator: 'elevator' });
    expect(f3Express).toMatchObject({ x: 24, y: 2, w: 2, tx: 576, ty: 60, indicator: 'elevator' });

    const initial = new Set<string>();
    const restored = new Set(['holding_open', 'faye_joined', 'manager_defeated']);
    expectLandingClear(f1, bricktonEntry!.tx, bricktonEntry!.ty, initial);
    expectLandingClear(f2, f1ToF2!.tx, f1ToF2!.ty, initial);
    expectLandingClear(f1, f2ToF1!.tx, f2ToF1!.ty, initial);
    expectLandingClear(f3, f2ToF3!.tx, f2ToF3!.ty, initial);
    expectLandingClear(f2, f3ToF2!.tx, f3ToF2!.ty, initial);
    expectLandingClear(f3, f1Express!.tx, f1Express!.ty, restored);
    expectLandingClear(f1, f3Express!.tx, f3Express!.ty, restored);
  });

  it('makes the rescue and Manager return gate unavoidable in the opened story phase', () => {
    const faye = f3.npcs.find((npc) => npc.id === 'faye');
    const meet = f3.triggers.find((trigger) => trigger.id === 'faye_meet');
    const manager = f3.triggers.find((trigger) => trigger.id === 'manager_block');
    const stair = f3.doors.find((door) => door.to === 'dos_f2' && !door.ifFlag);
    expect(faye).toBeDefined();
    expect(meet?.rect).toEqual({ x: 5, y: 4, w: 7, h: 4 });
    expect(manager?.rect).toEqual({ x: 22, y: 3, w: 19, h: 3 });
    expect(stair).toBeDefined();
    expect(faye!.x).toBeGreaterThanOrEqual(meet!.rect.x);
    expect(faye!.x).toBeLessThan(meet!.rect.x + meet!.rect.w);
    expect(faye!.y).toBeGreaterThanOrEqual(meet!.rect.y);
    expect(faye!.y).toBeLessThan(meet!.rect.y + meet!.rect.h);

    const opened = carveHoldingRoom(f3.grid);
    expect(reachable(opened, [Math.round(faye!.x), Math.round(faye!.y)], doorCell(stair!))).toBe(true);
    const managerBlocked = opened.map((row) => row.split(''));
    for (let y = manager!.rect.y; y < manager!.rect.y + manager!.rect.h; y++) {
      for (let x = manager!.rect.x; x < manager!.rect.x + manager!.rect.w; x++) managerBlocked[y][x] = 'L';
    }
    expect(
      reachable(managerBlocked.map((row) => row.join('')), [Math.round(faye!.x), Math.round(faye!.y)], doorCell(stair!)),
    ).toBe(false);
  });

  it('populates each stage with pinned, body-clear Smilers instead of pass-through scenery', () => {
    expect(f1.npcs.length).toBeGreaterThanOrEqual(7);
    expect(f2.npcs.length).toBeGreaterThanOrEqual(8);
    expect(f3.npcs.length).toBeGreaterThanOrEqual(6);

    for (const map of [f1, f2, f3]) {
      for (const npc of map.npcs) {
        expect(npc.id === 'faye' || npc.stationary, `${map.id}/${npc.id} must be explicitly pinned`).toBe(true);
        const openRoom = map.id === 'dos_f3' && npc.ifFlag === 'holding_open';
        const flags = new Set<string>(openRoom ? ['holding_open'] : []);
        const grid = openRoom ? carveHoldingRoom(map.grid) : map.grid;
        const ownBody = npcBody(npc, map.id);
        const environment = [
          ...tileSolids(grid),
          ...map.props
            .filter((prop) => visibleInPhase(prop, flags))
            .filter((prop) => !(prop.sprite === 'holding_door' && flags.has('holding_open')))
            .flatMap(propSolids),
        ];
        expect(
          environment.some((solid) => overlaps(ownBody, solid)),
          `${map.id}/${npc.id} foot box overlaps authored geometry`,
        ).toBe(false);
      }

      for (let i = 0; i < map.npcs.length; i++) {
        for (let j = i + 1; j < map.npcs.length; j++) {
          if (!canCoexist(map.npcs[i], map.npcs[j])) continue;
          expect(
            overlaps(npcBody(map.npcs[i], map.id), npcBody(map.npcs[j], map.id)),
            `${map.id}/${map.npcs[i].id} overlaps ${map.npcs[j].id}`,
          ).toBe(false);
        }
      }
    }
  });

  it('keeps every full patrol leg clear at the runtime foot-box offset', () => {
    for (const map of [f1, f2, f3, MAPS.wintermoor_dorm]) {
      const flags = new Set<string>();
      const solids = staticSolids(map, map.grid, flags);
      for (const patrol of map.patrols ?? []) {
        for (let segment = 0; segment < patrol.route.length; segment++) {
          const from = patrol.route[segment];
          const to = patrol.route[(segment + 1) % patrol.route.length];
          const nativeLength = Math.hypot((to[0] - from[0]) * 16, (to[1] - from[1]) * 16);
          const samples = Math.max(1, Math.ceil(nativeLength / 2));
          for (let sample = 0; sample <= samples; sample++) {
            const t = sample / samples;
            const x = from[0] + (to[0] - from[0]) * t;
            const y = from[1] + (to[1] - from[1]) * t;
            const body = footRect(characterFeet(x, y), PATROL_FOOTPRINT);
            expect(
              solids.some((solid) => overlaps(body, solid)),
              `${map.id}/${patrol.id} segment ${segment + 1} clips geometry near (${x.toFixed(2)},${y.toFixed(2)})`,
            ).toBe(false);
          }
        }
      }
    }
  });
});
