import { describe, expect, it } from 'vitest';
import {
  NPC_FOOTPRINT,
  PLAYER_FOOTPRINT,
  characterFeet,
  footRect,
  npcEffectiveScale,
  type Rect,
} from '../engine/actor-collision';
import { aabbOverlap } from '../engine/movecollide';
import { TILESET } from '../spritegen/tiles';
import type { MapDef, NpcDef, PropDef, SignDef } from '../schemas';
import { CHAR_LEGEND, HOLDING_ROOM, MAPS, carveHoldingRoom } from './maps';
import { CH1_WORLD, type Ch1WorldFeet } from './maps_ch1';

const solidByName = new Map(TILESET.map((tile) => [tile.name, tile.solid]));
const isSolidChar = (ch: string): boolean =>
  ch === ':' || ch === 'r' ? false : solidByName.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

const visibleInPhase = (
  def: { ifFlag?: string; unlessFlag?: string },
  flags: ReadonlySet<string>,
): boolean => (!def.ifFlag || flags.has(def.ifFlag)) && (!def.unlessFlag || !flags.has(def.unlessFlag));

function propSolids(prop: PropDef): Rect[] {
  const parts = prop.solidParts ?? (prop.solid ? [prop.solid] : []);
  const sx = typeof prop.scale === 'number' ? prop.scale : prop.scale?.x ?? 1;
  const sy = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
  return parts.map((part) => ({
    x: prop.x * 16 + part.ox * sx,
    y: prop.y * 16 + part.oy * sy,
    w: part.w * sx,
    h: part.h * sy,
  }));
}

function npcBody(map: MapDef, npc: NpcDef): Rect {
  return footRect(
    characterFeet(npc.x, npc.y),
    NPC_FOOTPRINT,
    npcEffectiveScale(map.id, npc.dog === true, npc.scale),
  );
}

function phaseGrid(map: MapDef, flags: ReadonlySet<string>): string[] {
  return map.id === 'dos_f3' && flags.has('holding_open') ? carveHoldingRoom(map.grid) : map.grid;
}

function activePropSolids(map: MapDef, flags: ReadonlySet<string>): Rect[] {
  return map.props
    .filter((prop) => visibleInPhase(prop, flags))
    // Runtime removes this collision when carveHoldingRoom opens the doorway.
    .filter((prop) => !(prop.sprite === 'holding_door' && flags.has('holding_open')))
    .flatMap(propSolids);
}

function activeNpcs(map: MapDef, flags: ReadonlySet<string>): NpcDef[] {
  return map.npcs.filter((npc) => visibleInPhase(npc, flags));
}

function bodyTouchesSolidTile(grid: string[], body: Rect): boolean {
  const x0 = Math.floor(body.x / 16);
  const y0 = Math.floor(body.y / 16);
  const x1 = Math.floor((body.x + body.w) / 16);
  const y1 = Math.floor((body.y + body.h) / 16);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (y < 0 || x < 0 || y >= grid.length || x >= grid[0].length || isSolidChar(grid[y][x])) return true;
    }
  }
  return false;
}

function playerBodyAtTile(x: number, y: number): Rect {
  return footRect({ x: x * 16 + 8, y: y * 16 + 12 }, PLAYER_FOOTPRINT);
}

function bodyFitsStaticMap(
  map: MapDef,
  body: Rect,
  flags: ReadonlySet<string>,
  includeNpcs = true,
): boolean {
  if (bodyTouchesSolidTile(phaseGrid(map, flags), body)) return false;
  if (activePropSolids(map, flags).some((solid) => aabbOverlap(body, solid))) return false;
  return !includeNpcs || !activeNpcs(map, flags).some((npc) => aabbOverlap(body, npcBody(map, npc)));
}

function npcStartsClear(map: MapDef, wanted: NpcDef, flags: ReadonlySet<string>): boolean {
  const body = npcBody(map, wanted);
  if (bodyTouchesSolidTile(phaseGrid(map, flags), body)) return false;
  if (activePropSolids(map, flags).some((solid) => aabbOverlap(body, solid))) return false;
  return !activeNpcs(map, flags)
    .filter((npc) => npc !== wanted)
    .some((npc) => aabbOverlap(body, npcBody(map, npc)));
}

function reachableTiles(
  map: MapDef,
  start: Readonly<{ x: number; y: number }>,
  flags: ReadonlySet<string>,
): Set<string> {
  const seen = new Set<string>();
  const grid = phaseGrid(map, flags);
  const props = activePropSolids(map, flags);
  const npcs = activeNpcs(map, flags).map((npc) => npcBody(map, npc));
  const fits = (x: number, y: number): boolean => {
    const body = playerBodyAtTile(x, y);
    return !bodyTouchesSolidTile(grid, body)
      && !props.some((solid) => aabbOverlap(body, solid))
      && !npcs.some((npc) => aabbOverlap(body, npc));
  };
  if (!fits(start.x, start.y)) return seen;
  const queue: Array<readonly [number, number]> = [[start.x, start.y]];
  seen.add(`${start.x},${start.y}`);
  const elevation = map.elevation?.level;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !fits(nx, ny)) continue;
      if (elevation) {
        const fromLevel = elevation[y]?.[x];
        const toLevel = elevation[ny]?.[nx];
        const stairBridge = map.grid[y]?.[x] === 'T' || map.grid[ny]?.[nx] === 'T';
        if (fromLevel !== toLevel && !stairBridge) continue;
      }
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return seen;
}

const FACINGS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const;

/** Exact `interact()` probe, including NPC-before-sign priority. */
function hasReachableUncontestedInteraction(
  map: MapDef,
  sign: SignDef,
  seen: ReadonlySet<string>,
  flags: ReadonlySet<string>,
): boolean {
  const target = { x: sign.x * 16 + 8, y: sign.y * 16 + 8 };
  const active = activeNpcs(map, flags);
  for (let y = Math.floor(sign.y) - 2; y <= Math.floor(sign.y) + 2; y++) {
    for (let x = Math.floor(sign.x) - 2; x <= Math.floor(sign.x) + 2; x++) {
      if (!seen.has(`${x},${y}`)) continue;
      const feet = { x: x * 16 + 8, y: y * 16 + 12 };
      for (const facing of FACINGS) {
        const probe = {
          x: feet.x + facing.x * 16,
          y: feet.y - 6 + facing.y * 14,
        };
        if (Math.hypot(target.x - probe.x, target.y - probe.y) >= 16) continue;
        const npcWins = active.some((npc) => {
          const npcFeet = characterFeet(npc.x, npc.y);
          return Math.hypot(npcFeet.x - probe.x, Math.abs(npcFeet.y - 6 - probe.y)) < 16;
        });
        if (!npcWins) return true;
      }
    }
  }
  return false;
}

function expectProfileClear(point: Ch1WorldFeet, flags: ReadonlySet<string>): void {
  const map = MAPS[point.mapId];
  const body = footRect({ x: point.x, y: point.y }, PLAYER_FOOTPRINT);
  if (!bodyFitsStaticMap(map, body, flags)) {
    const grid = phaseGrid(map, flags);
    const tiles: string[] = [];
    for (let y = Math.floor(body.y / 16); y <= Math.floor((body.y + body.h) / 16); y++) {
      for (let x = Math.floor(body.x / 16); x <= Math.floor((body.x + body.w) / 16); x++) {
        tiles.push(`${x},${y}:${grid[y]?.[x]}`);
      }
    }
    const props = map.props
      .filter((prop) => visibleInPhase(prop, flags))
      .filter((prop) => propSolids(prop).some((solid) => aabbOverlap(body, solid)))
      .map((prop) => `${prop.sprite}@${prop.x},${prop.y}`);
    const npcs = activeNpcs(map, flags)
      .filter((npc) => aabbOverlap(body, npcBody(map, npc)))
      .map((npc) => npc.id);
    expect.fail(`${point.mapId} profile ${point.tile.x},${point.tile.y} blocked; tiles=${tiles.join('|')} props=${props.join('|')} npcs=${npcs.join('|')}`);
  }
  expect(bodyFitsStaticMap(map, body, flags), `${point.mapId} profile ${point.tile.x},${point.tile.y}`).toBe(true);
}

describe('Chapter 1 runtime geometry contracts', () => {
  it('keeps the migration anchor and every developer-profile feet point body-clear', () => {
    const phases: Record<keyof typeof CH1_WORLD.profiles, ReadonlySet<string>> = {
      bedroom: new Set(),
      opening: new Set(),
      crater: new Set(['meteor_fell']),
      porch: new Set(),
      tickCave: new Set(['zapper_done']),
      meadow: new Set(['tick_defeated']),
      meadowMile: new Set(['tick_defeated']),
      meadowWoods: new Set(['tick_defeated']),
      meadowFar: new Set(['tick_defeated']),
      meadowOverpass: new Set(['tick_defeated']),
      orientation: new Set(['tick_defeated']),
      bus: new Set(['tick_defeated']),
      brickton: new Set(['tick_defeated']),
      bricktonArrival: new Set(['tick_defeated', 'visitor_badge']),
      dos: new Set(['tick_defeated', 'brickton_dial_goal']),
      dosF1: new Set(['tick_defeated', 'brickton_dial_goal']),
      dosF2: new Set(['tick_defeated', 'brickton_dial_goal']),
      dosF3: new Set(['tick_defeated', 'brickton_dial_goal']),
      faye: new Set(['tick_defeated', 'holding_open']),
      manager: new Set(['tick_defeated', 'holding_open', 'faye_joined']),
      payphone: new Set(['tick_defeated', 'brickton_foot_first']),
    };
    for (const flags of [
      new Set<string>(),
      new Set(['meteor_fell']),
      new Set(['zapper_done', 'meteor_fell']),
      new Set(['zapper_done', 'tick_defeated']),
    ]) {
      expectProfileClear(CH1_WORLD.recovery, flags);
    }
    for (const [id, point] of Object.entries(CH1_WORLD.profiles) as Array<[
      keyof typeof CH1_WORLD.profiles,
      Ch1WorldFeet,
    ]>) {
      expectProfileClear(point, phases[id]);
    }
  });

  it('plants every repaired NPC with real characterFeet clear of tiles, props, and peers', () => {
    const cases = [
      { map: MAPS.otterbrook, id: 'ana', point: CH1_WORLD.quest.ana, flags: new Set(['zapper_done']) },
      { map: MAPS.otterbrook, id: 'ana', point: CH1_WORLD.quest.ana, flags: new Set(['zapper_done', 'tick_defeated']) },
      { map: MAPS.otterbrook, id: 'vivi', point: CH1_WORLD.quest.vivi, flags: new Set(['zapper_done']) },
      { map: MAPS.otterbrook, id: 'vivi', point: CH1_WORLD.quest.vivi, flags: new Set(['zapper_done', 'tick_defeated']) },
      { map: MAPS.otterbrook, id: 'pajama_kid', point: CH1_WORLD.quest.pajamaKid, flags: new Set<string>() },
      { map: MAPS.otterbrook, id: 'pajama_kid', point: CH1_WORLD.quest.pajamaKid, flags: new Set(['meteor_fell']) },
      { map: MAPS.otterbrook, id: 'pajama_kid', point: CH1_WORLD.quest.pajamaKid, flags: new Set(['zapper_done', 'tick_defeated']) },
      { map: MAPS.brickton, id: 'pigeon_kid', point: CH1_WORLD.quest.pigeonKid, flags: new Set<string>() },
    ] as const;
    for (const entry of cases) {
      const npc = entry.map.npcs.find((candidate) => candidate.id === entry.id);
      expect(npc, entry.id).toBeDefined();
      expect(npc).toMatchObject({ x: entry.point.x, y: entry.point.y });
      if (!npcStartsClear(entry.map, npc!, entry.flags)) {
        const body = npcBody(entry.map, npc!);
        const grid = phaseGrid(entry.map, entry.flags);
        const tiles: string[] = [];
        for (let y = Math.floor(body.y / 16); y <= Math.floor((body.y + body.h) / 16); y++) {
          for (let x = Math.floor(body.x / 16); x <= Math.floor((body.x + body.w) / 16); x++) {
            tiles.push(`${x},${y}:${grid[y]?.[x]}`);
          }
        }
        const props = entry.map.props
          .filter((prop) => visibleInPhase(prop, entry.flags))
          .filter((prop) => propSolids(prop).some((solid) => aabbOverlap(body, solid)))
          .map((prop) => `${prop.sprite}@${prop.x},${prop.y} scale=${JSON.stringify(prop.scale)} solid=${JSON.stringify(prop.solid)} rect=${JSON.stringify(propSolids(prop))}`);
        const peers = activeNpcs(entry.map, entry.flags)
          .filter((peer) => peer !== npc && aabbOverlap(body, npcBody(entry.map, peer)))
          .map((peer) => peer.id);
        expect.fail(`${entry.map.id}:${entry.id} blocked; tiles=${tiles.join('|')} props=${props.join('|')} peers=${peers.join('|')}`);
      }
      expect(npcStartsClear(entry.map, npc!, entry.flags), `${entry.map.id}:${entry.id}`).toBe(true);
    }
  });

  it('makes the lemonade stand, paw clues, and hill spring visible at their stable points', () => {
    const otterbrook = MAPS.otterbrook;
    const quest = CH1_WORLD.quest;
    expect(otterbrook.props.find((prop) => prop.sprite === 'lemonade')).toMatchObject({
      x: quest.lemonadeStand.x,
      y: quest.lemonadeStand.y,
      ifFlag: 'zapper_done',
    });
    expect(otterbrook.props.find((prop) => prop.sprite === 'well')).toMatchObject({
      x: quest.hillSpring.x,
      y: quest.hillSpring.y,
    });
    expect(otterbrook.props.filter((prop) => prop.sprite === 'paw_prints')).toEqual(expect.arrayContaining([
      expect.objectContaining({
        x: quest.biscuitClue1.x,
        y: quest.biscuitClue1.y,
        ifFlag: 'q_biscuit',
        unlessFlag: 'q_biscuit_c1',
      }),
      expect.objectContaining({
        x: quest.biscuitClue2.x,
        y: quest.biscuitClue2.y,
        ifFlag: 'q_biscuit_c1',
        unlessFlag: 'q_biscuit_c2',
      }),
    ]));
    for (const [dialogue, point] of [
      ['q_biscuit_clue1', quest.biscuitClue1],
      ['q_biscuit_clue2', quest.biscuitClue2],
      ['hill_spring', quest.hillSpring],
    ] as const) {
      expect(otterbrook.signs.find((sign) => sign.dialogue === dialogue)).toMatchObject({
        x: point.x,
        y: point.y,
      });
    }
  });

  it('keeps both paw clues and spring reachable with an uncontested runtime interaction', () => {
    const map = MAPS.otterbrook;
    const recoveryTile = CH1_WORLD.recovery.tile;
    const phases = [
      { dialogue: 'q_biscuit_clue1', flags: new Set(['zapper_done', 'tick_defeated', 'q_biscuit']) },
      { dialogue: 'q_biscuit_clue2', flags: new Set(['zapper_done', 'tick_defeated', 'q_biscuit', 'q_biscuit_c1']) },
      { dialogue: 'hill_spring', flags: new Set(['zapper_done', 'tick_defeated', 'q_lemonade']) },
    ];
    for (const phase of phases) {
      const sign = map.signs.find((candidate) => candidate.dialogue === phase.dialogue);
      expect(sign, phase.dialogue).toBeDefined();
      const seen = reachableTiles(map, recoveryTile, phase.flags);
      expect(seen.size, `${phase.dialogue} has a navigable phase`).toBeGreaterThan(0);
      expect(
        hasReachableUncontestedInteraction(map, sign!, seen, phase.flags),
        `${phase.dialogue} is reachable and not stolen by an NPC`,
      ).toBe(true);
    }
  });

  it('opens the Faye profile only through the runtime holding-room carve', () => {
    const point = CH1_WORLD.profiles.faye;
    const body = footRect({ x: point.x, y: point.y }, PLAYER_FOOTPRINT);
    expect(bodyTouchesSolidTile(MAPS.dos_f3.grid, body)).toBe(true);
    expect(bodyTouchesSolidTile(carveHoldingRoom(MAPS.dos_f3.grid), body)).toBe(false);
    expect(point.tile.x).toBeGreaterThan(HOLDING_ROOM.x);
    expect(point.tile.x).toBeLessThan(HOLDING_ROOM.x + HOLDING_ROOM.w - 1);
  });
});
