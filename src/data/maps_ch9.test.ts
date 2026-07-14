import { describe, expect, it } from 'vitest';
import type { MapDef, NpcDef, PropDef } from '../schemas';
import { doorAudit, playerBodyBoxTiles } from '../levelkit/mapcheck';
import { CHAR_LEGEND } from './maps';
import {
  CH9_BUNI_PICKUP_CUES,
  CH9_MAP_IDS,
  CH9_WORLD,
  buildChapter9Maps,
  nativeFeet,
} from './maps_ch9';
import { TILESET } from '../spritegen/tiles';
import { DIALOGUE } from './dialogue';
import {
  NPC_FOOTPRINT,
  PLAYER_FOOTPRINT,
  characterFeet,
  footRect,
  npcEffectiveScale,
} from '../engine/actor-collision';

interface Rect { x: number; y: number; w: number; h: number }

const SOLID_BY_NAME = new Map(TILESET.map((tile) => [tile.name, tile.solid]));
const IS_SOLID = (ch: string): boolean =>
  ch !== ':' && ch !== 'r' && SOLID_BY_NAME.get(CHAR_LEGEND[ch] ?? 'grass_a') === true;

function isWalkable(map: MapDef, x: number, y: number): boolean {
  const ch = map.grid[y]?.[x];
  return ch !== undefined && !IS_SOLID(ch);
}

function inside(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function grace(point: Readonly<{ x: number; y: number }>, radius = 4): Rect {
  return { x: point.x - radius, y: point.y - radius, w: radius * 2 + 1, h: radius * 2 + 1 };
}

function startFor(map: MapDef): { x: number; y: number } {
  switch (map.id) {
    case 'valea_stelelor': return CH9_WORLD.valea.arrival;
    case 'old_road': return CH9_WORLD.valea.transition.oldRoad.landing;
    case 'castle_hoaxula': return CH9_WORLD.oldRoad.transition.castle.landing;
    default: return CH9_WORLD.castle.transition.monastery.landing;
  }
}

function walkableTiles(
  map: MapDef,
  blocked: readonly Rect[] = [],
  start: { x: number; y: number } = startFor(map),
): Set<string> {
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [[start.x, start.y]];
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    const key = `${x},${y}`;
    if (seen.has(key) || blocked.some((rect) => inside(rect, x, y)) || !playerBodyFits(map, x, y)) continue;
    seen.add(key);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

function rectHasReachableTile(seen: Set<string>, rect: Rect): boolean {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (seen.has(`${x},${y}`)) return true;
    }
  }
  return false;
}

function propSolidRect(prop: PropDef): Rect | null {
  if (!prop.solid) return null;
  const sx = typeof prop.scale === 'number' ? prop.scale : prop.scale?.x ?? 1;
  const sy = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
  return {
    x: prop.x * 16 + prop.solid.ox * sx,
    y: prop.y * 16 + prop.solid.oy * sy,
    w: prop.solid.w * sx,
    h: prop.solid.h * sy,
  };
}

function playerBodyAtTile(x: number, y: number): Rect {
  return footRect({ x: x * 16 + 8, y: y * 16 + 12 }, PLAYER_FOOTPRINT);
}

function npcBodyRect(map: MapDef, npc: NpcDef): Rect {
  return footRect(
    characterFeet(npc.x, npc.y),
    NPC_FOOTPRINT,
    npcEffectiveScale(map.id, npc.dog === true, npc.scale),
  );
}

/** Exact buildNpcs runtime rule: pinned people join static collision; explicit
 * and default outdoor wanderers use dynamic actor collision instead. */
function npcWandersAtRuntime(map: MapDef, npc: NpcDef): boolean {
  return npc.wander === true || (
    npc.wander !== false && !npc.shop && !npc.stationary && !npc.dog && !map.interior
  );
}

/** Mirror OverworldScene.playerBodyAt/collidesStatic in native map pixels.
 * The flood enumerates every tile-centred planted-feet position with the real
 * 10x9 player footprint, including the complete prop/facade collision boxes. */
function playerBodyFits(map: MapDef, x: number, y: number): boolean {
  const body = playerBodyAtTile(x, y);
  const x0 = Math.floor(body.x / 16);
  const y0 = Math.floor(body.y / 16);
  const x1 = Math.floor((body.x + body.w) / 16);
  const y1 = Math.floor((body.y + body.h) / 16);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isWalkable(map, tx, ty)) return false;
    }
  }
  const hitsProp = map.props
    .map(propSolidRect)
    .filter((rect): rect is Rect => rect !== null)
    .some((rect) => overlaps(body, rect));
  if (hitsProp) return false;
  return !map.npcs
    .filter((npc) => !npcWandersAtRuntime(map, npc))
    .map((npc) => npcBodyRect(map, npc))
    .some((rect) => overlaps(body, rect));
}

function playerBodyAvoidsAllNpcs(map: MapDef, x: number, y: number): boolean {
  const body = playerBodyAtTile(x, y);
  return !map.npcs.some((npc) => overlaps(body, npcBodyRect(map, npc)));
}

const CARDINAL_FACING = [
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
] as const;

/** Mirror interact(): a tile-centred player leans a 16px/14px facing probe from
 * chest height. Candidate bodies must be flood-reachable and clear of every
 * actor's authored starting body, including dynamic wanderers. */
function hasReachableRuntimeInteraction(
  map: MapDef,
  seen: Set<string>,
  target: Readonly<{ x: number; y: number }>,
): boolean {
  const centerX = Math.floor(target.x / 16);
  const centerY = Math.floor(target.y / 16);
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      if (!seen.has(`${x},${y}`) || !playerBodyAvoidsAllNpcs(map, x, y)) continue;
      const feet = { x: x * 16 + 8, y: y * 16 + 12 };
      for (const facing of CARDINAL_FACING) {
        const probe = {
          x: feet.x + facing.x * 16,
          y: feet.y - 6 + facing.y * 14,
        };
        if (Math.hypot(target.x - probe.x, target.y - probe.y) < 16) return true;
      }
    }
  }
  return false;
}

function tileRectPixels(rect: Rect): Rect {
  return { x: rect.x * 16, y: rect.y * 16, w: rect.w * 16, h: rect.h * 16 };
}

function pointInsideProp(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function tileIsPropClear(map: MapDef, x: number, y: number): boolean {
  return !map.props
    .map(propSolidRect)
    .filter((rect): rect is Rect => rect !== null)
    .some((rect) => pointInsideProp(rect, x * 16 + 8, y * 16 + 12));
}

function squareIsWalkable(map: MapDef, point: { x: number; y: number }, width: number): boolean {
  const low = -Math.floor((width - 1) / 2);
  const high = low + width - 1;
  for (let dy = low; dy <= high; dy++) {
    for (let dx = low; dx <= high; dx++) {
      if (!isWalkable(map, point.x + dx, point.y + dy)) return false;
    }
  }
  return true;
}

interface WorldGeometry {
  path: string;
  rect: Rect;
  point: boolean;
}

function collectWorldGeometry(value: unknown, path = '', result: WorldGeometry[] = []): WorldGeometry[] {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectWorldGeometry(entry, `${path}.${index}`, result));
    return result;
  }
  if (!value || typeof value !== 'object') return result;
  const record = value as Record<string, unknown>;
  if (typeof record.x === 'number' && typeof record.y === 'number') {
    const point = typeof record.w !== 'number' && typeof record.h !== 'number';
    result.push({
      path: path.replace(/^\./, ''),
      rect: {
        x: record.x,
        y: record.y,
        w: typeof record.w === 'number' ? record.w : 1,
        h: typeof record.h === 'number' ? record.h : 1,
      },
      point,
    });
    return result;
  }
  for (const [key, entry] of Object.entries(record)) {
    collectWorldGeometry(entry, path ? `${path}.${key}` : key, result);
  }
  return result;
}

const WORLD_ROOT_MAP: Readonly<Record<string, string>> = {
  valea: 'valea_stelelor',
  oldRoad: 'old_road',
  castle: 'castle_hoaxula',
  monastery: 'stone_brow_monastery',
};

const LANDING_TARGET_MAP: Readonly<Record<string, string>> = {
  'valea.transition.oldRoad.landing': 'old_road',
  'oldRoad.transition.valea.landing': 'valea_stelelor',
  'oldRoad.transition.castle.landing': 'castle_hoaxula',
  'castle.transition.oldRoad.landing': 'old_road',
  'castle.transition.monastery.landing': 'stone_brow_monastery',
  'monastery.transition.castle.landing': 'castle_hoaxula',
};

function mapForGeometry(path: string): string {
  return LANDING_TARGET_MAP[path] ?? WORLD_ROOT_MAP[path.split('.')[0]];
}

type Ch9MapId = (typeof CH9_MAP_IDS)[number];

interface NamedPoint { label: string; x: number; y: number }
interface NamedAnchor extends NamedPoint { kind: 'prop' | 'npc' | 'sign' }

const LANDING_AND_RECOVERY_POINTS: Readonly<Record<Ch9MapId, readonly NamedPoint[]>> = {
  valea_stelelor: [
    { label: 'train arrival', ...CH9_WORLD.valea.arrival },
    { label: 'Old Road return landing', ...CH9_WORLD.oldRoad.transition.valea.landing },
    { label: 'recovery', ...CH9_WORLD.valea.recovery },
  ],
  old_road: [
    { label: 'Valea landing', ...CH9_WORLD.valea.transition.oldRoad.landing },
    { label: 'castle return landing', ...CH9_WORLD.castle.transition.oldRoad.landing },
    { label: 'recovery', ...CH9_WORLD.oldRoad.recovery },
  ],
  castle_hoaxula: [
    { label: 'Old Road landing', ...CH9_WORLD.oldRoad.transition.castle.landing },
    { label: 'monastery return landing', ...CH9_WORLD.monastery.transition.castle.landing },
    { label: 'recovery', ...CH9_WORLD.castle.recovery },
  ],
  stone_brow_monastery: [
    { label: 'castle landing', ...CH9_WORLD.castle.transition.monastery.landing },
    { label: 'recovery', ...CH9_WORLD.monastery.recovery },
  ],
};

function authoredAnchors(map: MapDef): NamedAnchor[] {
  return [
    ...map.props.map((prop, index) => ({
      kind: 'prop' as const,
      label: `${prop.sprite}[${index}]`,
      x: prop.x,
      y: prop.y,
    })),
    ...map.npcs.map((npc) => ({ kind: 'npc' as const, label: npc.id, x: npc.x, y: npc.y })),
    ...map.signs.map((sign, index) => ({
      kind: 'sign' as const,
      label: `${sign.dialogue}[${index}]`,
      x: sign.x,
      y: sign.y,
    })),
  ];
}

describe('Chapter 9 production world contract', () => {
  it('pins the exact four-map roster, dimensions, and deterministic build', () => {
    const maps = buildChapter9Maps();
    expect(Object.keys(maps)).toEqual([...CH9_MAP_IDS]);
    expect(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, [map.grid[0].length, map.grid.length]]))).toEqual({
      valea_stelelor: [80, 64],
      old_road: [96, 72],
      castle_hoaxula: [72, 96],
      stone_brow_monastery: [64, 88],
    });
    expect(JSON.stringify(buildChapter9Maps())).toBe(JSON.stringify(buildChapter9Maps()));
  });

  it('keeps every fixed point and rectangle in bounds and reachable by an exhaustive real-body flood', () => {
    const maps = buildChapter9Maps();
    const invalid: string[] = [];
    const geometries = collectWorldGeometry(CH9_WORLD);
    expect(geometries.length).toBeGreaterThan(50);
    for (const geometry of geometries) {
      const map = maps[mapForGeometry(geometry.path) as keyof typeof maps];
      expect(map, geometry.path).toBeDefined();
      const width = map.grid[0].length;
      const height = map.grid.length;
      expect(geometry.rect.x, geometry.path).toBeGreaterThanOrEqual(0);
      expect(geometry.rect.y, geometry.path).toBeGreaterThanOrEqual(0);
      expect(geometry.rect.x + geometry.rect.w, geometry.path).toBeLessThanOrEqual(width);
      expect(geometry.rect.y + geometry.rect.h, geometry.path).toBeLessThanOrEqual(height);
      const seen = walkableTiles(map);
      const clear: string[] = [];
      for (let y = geometry.rect.y; y < geometry.rect.y + geometry.rect.h; y++) {
        for (let x = geometry.rect.x; x < geometry.rect.x + geometry.rect.w; x++) {
          if (seen.has(`${x},${y}`) && tileIsPropClear(map, x, y)) clear.push(`${x},${y}`);
        }
      }
      if (clear.length === 0) invalid.push(`${geometry.path}: no reachable prop-clear tile`);
      if (geometry.point && (clear.length !== 1 || clear[0] !== `${geometry.rect.x},${geometry.rect.y}`)) {
        invalid.push(`${geometry.path}: exact point is not reachable and prop-clear`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('uses reciprocal CH9_WORLD doors with centered, real-body-safe landings', () => {
    const maps = buildChapter9Maps();
    const expected: Readonly<Record<string, { x: number; y: number }>> = {
      'valea_stelelor>old_road': CH9_WORLD.valea.transition.oldRoad.landing,
      'old_road>valea_stelelor': CH9_WORLD.oldRoad.transition.valea.landing,
      'old_road>castle_hoaxula': CH9_WORLD.oldRoad.transition.castle.landing,
      'castle_hoaxula>old_road': CH9_WORLD.castle.transition.oldRoad.landing,
      'castle_hoaxula>stone_brow_monastery': CH9_WORLD.castle.transition.monastery.landing,
      'stone_brow_monastery>castle_hoaxula': CH9_WORLD.monastery.transition.castle.landing,
    };
    for (const map of Object.values(maps)) {
      for (const door of map.doors) {
        const target = maps[door.to as keyof typeof maps];
        expect(target, `${map.id}>${door.to}`).toBeDefined();
        expect(target.doors.some((back) => back.to === map.id), `${map.id}>${door.to} return`).toBe(true);
        const landing = expected[`${map.id}>${door.to}`];
        expect({ tx: door.tx, ty: door.ty }).toEqual(nativeFeet(landing));
        expect(playerBodyFits(target, landing.x, landing.y), `${map.id}>${door.to} exact body`).toBe(true);
        const body = playerBodyBoxTiles(door.tx, door.ty);
        for (let y = body.y0; y <= body.y1; y++) {
          for (let x = body.x0; x <= body.x1; x++) {
            expect(isWalkable(target, x, y), `${map.id}>${door.to} body ${x},${y}`).toBe(true);
            expect(tileIsPropClear(target, x, y), `${map.id}>${door.to} prop ${x},${y}`).toBe(true);
          }
        }
      }
    }
    const findings = doorAudit(maps, IS_SOLID, { bodyBox: true });
    expect(findings.filter((finding) => finding.issue.some((issue) =>
      issue === 'landsSolid' || issue === 'bodyBlocked' || issue === 'noReturn'))).toEqual([]);
    expect(findings).toEqual([]);
  });

  it('makes every door, trigger, NPC, sign, and spawner footprint reachable', () => {
    for (const map of Object.values(buildChapter9Maps())) {
      const seen = walkableTiles(map);
      for (const door of map.doors) expect(rectHasReachableTile(seen, door), `${map.id} door ${door.to}`).toBe(true);
      for (const trigger of map.triggers) expect(rectHasReachableTile(seen, trigger.rect), `${map.id}:${trigger.id}`).toBe(true);
      for (const spawner of map.spawners) expect(rectHasReachableTile(seen, spawner.rect), `${map.id} spawner`).toBe(true);
      for (const npc of map.npcs) {
        const feet = characterFeet(npc.x, npc.y);
        expect(
          hasReachableRuntimeInteraction(map, seen, { x: feet.x, y: feet.y - 6 }),
          `${map.id}:${npc.id} runtime interaction`,
        ).toBe(true);
      }
      for (const sign of map.signs) {
        expect(
          hasReachableRuntimeInteraction(map, seen, { x: sign.x * 16 + 8, y: sign.y * 16 + 8 }),
          `${map.id}:${sign.dialogue} runtime interaction`,
        ).toBe(true);
      }
    }
  });

  it('rejects literal cross-category anchor conflicts with triggers, landings, recovery, and spawners', () => {
    for (const map of Object.values(buildChapter9Maps())) {
      const anchors = authoredAnchors(map);
      const protectedPoints = LANDING_AND_RECOVERY_POINTS[map.id as Ch9MapId];

      for (let left = 0; left < anchors.length; left++) {
        const a = anchors[left];
        for (let right = left + 1; right < anchors.length; right++) {
          const b = anchors[right];
          if (a.kind === b.kind) continue;
          expect(
            a.x === b.x && a.y === b.y,
            `${map.id} ${a.kind}:${a.label} shares ${b.kind}:${b.label} @${a.x},${a.y}`,
          ).toBe(false);
        }
        for (const trigger of map.triggers) {
          expect(
            inside(trigger.rect, a.x, a.y),
            `${map.id} ${a.kind}:${a.label} inside trigger ${trigger.id}`,
          ).toBe(false);
        }
        for (const point of protectedPoints) {
          expect(
            a.x === point.x && a.y === point.y,
            `${map.id} ${a.kind}:${a.label} shares ${point.label}`,
          ).toBe(false);
        }
        for (const spawner of map.spawners) {
          expect(
            inside(spawner.rect, a.x, a.y),
            `${map.id} ${a.kind}:${a.label} inside spawner ${JSON.stringify(spawner.rect)}`,
          ).toBe(false);
        }
      }

      for (const trigger of map.triggers) {
        for (const spawner of map.spawners) {
          expect(overlaps(trigger.rect, spawner.rect), `${map.id}:${trigger.id} spawner conflict`).toBe(false);
        }
      }
      for (const point of protectedPoints) {
        for (const spawner of map.spawners) {
          expect(inside(spawner.rect, point.x, point.y), `${map.id}:${point.label} spawner conflict`).toBe(false);
        }
      }
    }
  });

  it('uses runtime player/NPC footprints for prop, facade, trigger, and interaction-body clearance', () => {
    for (const map of Object.values(buildChapter9Maps())) {
      const solids = map.props
        .map((prop, index) => ({ label: `${prop.sprite}[${index}]`, rect: propSolidRect(prop) }))
        .filter((entry): entry is { label: string; rect: Rect } => entry.rect !== null);
      const triggerBodies = map.triggers.map((trigger) => ({
        label: trigger.id,
        rect: tileRectPixels(trigger.rect),
      }));
      const npcBodies = map.npcs.map((npc) => ({ npc, rect: npcBodyRect(map, npc) }));
      const signBodies = map.signs.map((sign) => ({
        sign,
        // A sign is proximity-only at runtime. This is the authored interaction
        // feet contract; the probe-level reach is independently exercised above.
        rect: playerBodyAtTile(sign.x, sign.y),
      }));

      for (const solid of solids) {
        for (const trigger of triggerBodies) {
          expect(overlaps(solid.rect, trigger.rect), `${map.id} ${solid.label} body enters ${trigger.label}`).toBe(false);
        }
      }
      for (let left = 0; left < npcBodies.length; left++) {
        const actor = npcBodies[left];
        for (const solid of solids) {
          expect(overlaps(actor.rect, solid.rect), `${map.id}:${actor.npc.id} body enters ${solid.label}`).toBe(false);
        }
        for (const trigger of triggerBodies) {
          expect(overlaps(actor.rect, trigger.rect), `${map.id}:${actor.npc.id} body enters ${trigger.label}`).toBe(false);
        }
        for (let right = left + 1; right < npcBodies.length; right++) {
          expect(
            overlaps(actor.rect, npcBodies[right].rect),
            `${map.id}:${actor.npc.id} body overlaps ${npcBodies[right].npc.id}`,
          ).toBe(false);
        }
      }
      for (const entry of signBodies) {
        expect(playerBodyFits(map, entry.sign.x, entry.sign.y), `${map.id}:${entry.sign.dialogue} interaction feet`).toBe(true);
        expect(playerBodyAvoidsAllNpcs(map, entry.sign.x, entry.sign.y), `${map.id}:${entry.sign.dialogue} NPC body`).toBe(true);
        for (const solid of solids) {
          expect(overlaps(entry.rect, solid.rect), `${map.id}:${entry.sign.dialogue} body enters ${solid.label}`).toBe(false);
        }
        for (const trigger of triggerBodies) {
          expect(overlaps(entry.rect, trigger.rect), `${map.id}:${entry.sign.dialogue} body enters ${trigger.label}`).toBe(false);
        }
      }

      for (const point of LANDING_AND_RECOVERY_POINTS[map.id as Ch9MapId]) {
        const body = playerBodyAtTile(point.x, point.y);
        expect(playerBodyFits(map, point.x, point.y), `${map.id}:${point.label} static body`).toBe(true);
        expect(playerBodyAvoidsAllNpcs(map, point.x, point.y), `${map.id}:${point.label} NPC body`).toBe(true);
        for (const sign of signBodies) {
          expect(overlaps(body, sign.rect), `${map.id}:${point.label} enters ${sign.sign.dialogue} body`).toBe(false);
        }
      }
    }
  });

  it('keeps the Old Road five-wide at every frozen route point and protects its safe pockets', () => {
    const map = buildChapter9Maps().old_road;
    for (const point of CH9_WORLD.oldRoad.route) expect(squareIsWalkable(map, point, 5), `${point.x},${point.y}`).toBe(true);
    for (const point of CH9_WORLD.oldRoad.safePockets) {
      expect(squareIsWalkable(map, point, 5), `safe ${point.x},${point.y}`).toBe(true);
      const grace = { x: point.x - 3, y: point.y - 3, w: 7, h: 7 };
      for (const spawner of map.spawners) expect(overlaps(grace, spawner.rect), `${point.x},${point.y} pressure`).toBe(false);
    }
  });

  it('forces boss then choice before the flag-gated monastery door', () => {
    const castle = buildChapter9Maps().castle_hoaxula;
    const north = castle.doors.find((door) => door.to === 'stone_brow_monastery');
    expect(north).toMatchObject({ ifFlag: 'ch9_count_decided' });
    expect(overlaps(CH9_WORLD.castle.story.boss, CH9_WORLD.castle.story.choice)).toBe(false);
    expect(inside(CH9_WORLD.castle.regions.bossArena, CH9_WORLD.castle.story.boss.x, CH9_WORLD.castle.story.boss.y)).toBe(true);

    const beforeBoss = walkableTiles(castle, [CH9_WORLD.castle.story.boss], CH9_WORLD.oldRoad.transition.castle.landing);
    expect(rectHasReachableTile(beforeBoss, CH9_WORLD.castle.story.choice)).toBe(false);
    const beforeChoice = walkableTiles(castle, [CH9_WORLD.castle.story.choice], CH9_WORLD.castle.bossRestart);
    expect(rectHasReachableTile(beforeChoice, CH9_WORLD.castle.transition.monastery.mouth)).toBe(false);
  });

  it('keeps five Buni pickups spatial, unique, and available on the calm backtrack', () => {
    const maps = buildChapter9Maps();
    const ingredients = [...CH9_WORLD.valea.quest.ingredients, ...CH9_WORLD.oldRoad.quest.ingredients];
    expect(ingredients.map((entry) => entry.item)).toEqual([
      'smantana', 'pickled_cabbage', 'grandfather_plums', 'branza_burduf', 'valley_mushrooms',
    ]);
    expect(new Set(ingredients.map((entry) => entry.flag)).size).toBe(5);
    const triggers = [
      ...maps.valea_stelelor.triggers,
      ...maps.old_road.triggers,
    ].filter((trigger) => trigger.id.startsWith('q_buni_'));
    expect(triggers.map((trigger) => trigger.id)).toEqual(ingredients.map((entry) => entry.flag));
    for (const trigger of triggers) expect(trigger.once).toBe(false);

    expect(CH9_BUNI_PICKUP_CUES.map((cue) => cue.flag)).toEqual(ingredients.map((entry) => entry.flag));
    for (const cue of CH9_BUNI_PICKUP_CUES) {
      const map = maps[cue.map];
      const trigger = map.triggers.find((entry) => entry.id === cue.flag);
      expect(trigger, cue.flag).toBeDefined();
      expect(trigger!.rect.w, cue.flag).toBe(1);
      expect(trigger!.rect.h, cue.flag).toBe(1);
      const cueDistance = Math.abs(cue.x - trigger!.rect.x) + Math.abs(cue.y - trigger!.rect.y);
      expect(cueDistance, cue.flag).toBeGreaterThan(0);
      expect(cueDistance, cue.flag).toBeLessThanOrEqual(2);
      const prop = map.props.find((entry) =>
        entry.sprite === cue.sprite && entry.x === cue.x && entry.y === cue.y);
      expect(prop, `${cue.flag} visible cue`).toBeDefined();
      expect(prop!.unlessFlag, `${cue.flag} retires`).toBe(cue.flag);
      expect({ x: prop!.x, y: prop!.y }, `${cue.flag} does not cover pickup`).not.toEqual({
        x: trigger!.rect.x,
        y: trigger!.rect.y,
      });
      expect(tileIsPropClear(map, trigger!.rect.x, trigger!.rect.y), `${cue.flag} cue collision`).toBe(true);
    }
  });

  it('boots the Buni retry beside Buni and keeps the castle entry outside encounter pens', () => {
    const maps = buildChapter9Maps();
    const buni = maps.valea_stelelor.npcs.find((npc) => npc.id === 'vs_buni');
    expect(buni).toBeDefined();
    expect(CH9_WORLD.valea.profiles.buni).toEqual({ x: buni!.x - 1, y: buni!.y, facing: 'right' });
    expect(CH9_WORLD.valea.profiles.fullBag).toEqual(CH9_WORLD.valea.profiles.buni);

    const entry = CH9_WORLD.castle.profiles.entry;
    for (const spawner of maps.castle_hoaxula.spawners) {
      expect(inside(spawner.rect, entry.x, entry.y), `castle entry overlaps ${JSON.stringify(spawner.rect)}`).toBe(false);
    }
  });

  it('retires every Chapter 9 encounter after Hoaxula and preserves the exact regular roster', () => {
    const maps = buildChapter9Maps();
    const spawners = Object.values(maps).flatMap((map) => map.spawners.map((spawner) => ({ map, spawner })));
    expect(spawners.length).toBeGreaterThan(0);
    expect(spawners.every(({ spawner }) => spawner.unlessFlag === 'count_hoaxula_defeated')).toBe(true);
    expect(new Set(spawners.flatMap(({ spawner }) => spawner.enemies))).toEqual(new Set([
      'haystack_mimic', 'ribcage_rattler', 'moss_strigoi', 'animated_armor', 'wolf_of_the_old_road',
    ]));
    expect(maps.stone_brow_monastery.spawners).toEqual([]);
    for (const { map, spawner } of spawners) {
      const spawnerPixels = {
        x: spawner.rect.x * 16,
        y: spawner.rect.y * 16,
        w: spawner.rect.w * 16,
        h: spawner.rect.h * 16,
      };
      for (const door of map.doors) expect(overlaps(spawner.rect, door), `${map.id} door pressure`).toBe(false);
      for (const trigger of map.triggers) expect(overlaps(spawner.rect, trigger.rect), `${map.id}:${trigger.id} pressure`).toBe(false);
      for (const actor of [...map.npcs, ...map.signs]) {
        expect(inside(spawner.rect, actor.x, actor.y), `${map.id} actor ${actor.x},${actor.y} pressure`).toBe(false);
      }
      for (const prop of map.props) {
        expect(inside(spawner.rect, prop.x, prop.y), `${map.id} prop ${prop.sprite} pressure`).toBe(false);
        const solid = propSolidRect(prop);
        if (solid) expect(overlaps(spawnerPixels, solid), `${map.id} solid ${prop.sprite} pressure`).toBe(false);
      }
    }

    const protectedZones: Readonly<Record<string, readonly Readonly<{ x: number; y: number }>[]>> = {
      valea_stelelor: [
        CH9_WORLD.oldRoad.transition.valea.landing,
        CH9_WORLD.valea.arrival,
        CH9_WORLD.valea.migration,
        CH9_WORLD.valea.recovery,
        ...Object.values(CH9_WORLD.valea.profiles),
      ],
      old_road: [
        CH9_WORLD.valea.transition.oldRoad.landing,
        CH9_WORLD.castle.transition.oldRoad.landing,
        CH9_WORLD.oldRoad.migration,
        CH9_WORLD.oldRoad.recovery,
        ...CH9_WORLD.oldRoad.safePockets,
        ...Object.values(CH9_WORLD.oldRoad.profiles),
      ],
      castle_hoaxula: [
        CH9_WORLD.oldRoad.transition.castle.landing,
        CH9_WORLD.monastery.transition.castle.landing,
        CH9_WORLD.castle.migration,
        CH9_WORLD.castle.recovery,
        CH9_WORLD.castle.bossRestart,
        ...Object.values(CH9_WORLD.castle.profiles),
      ],
      stone_brow_monastery: [
        CH9_WORLD.castle.transition.monastery.landing,
        CH9_WORLD.monastery.migration,
        CH9_WORLD.monastery.recovery,
        ...Object.values(CH9_WORLD.monastery.profiles),
      ],
    };
    for (const map of Object.values(maps)) {
      for (const point of protectedZones[map.id]) {
        for (const spawner of map.spawners) {
          expect(overlaps(grace(point), spawner.rect), `${map.id} unsafe arrival ${point.x},${point.y}`).toBe(false);
        }
      }
    }
  });

  it('uses all eight Valea facades deliberately without generic tenancy and keeps the train landmark', () => {
    const map = buildChapter9Maps().valea_stelelor;
    expect(map.area).toBe('valea');
    expect(map.settlement).toBe('village');
    expect(map.props.filter((prop) => prop.sprite.startsWith('bldg_valea_')).map((prop) => prop.sprite)).toEqual([
      'bldg_valea_painted_house', 'bldg_valea_cottage', 'bldg_valea_inn', 'bldg_valea_shop',
      'bldg_valea_hall', 'bldg_valea_church', 'bldg_valea_mill', 'bldg_valea_barn',
    ]);
    expect(map.props.filter((prop) => prop.sprite.startsWith('bldg_valea_'))
      .every((prop) => prop.facadeUse === 'outdoor-court' && !prop.door)).toBe(true);
    expect(map.props.find((prop) => prop.sprite === 'orient_less_express')).toBeDefined();
    expect(map.doors.some((door) => door.to === 'biplane_interior')).toBe(false);
  });

  it('keeps Valea inhabited with distinct wandering locals and one property sign per future home', () => {
    const maps = buildChapter9Maps();
    const map = maps.valea_stelelor;
    const ambientIds = [
      'vs_orchard_keeper', 'vs_miller', 'vs_church_neighbor', 'vs_green_dancer', 'vs_station_cousin',
    ];
    const ambient = map.npcs.filter((npc) => ambientIds.includes(npc.id));
    expect(map.npcs).toHaveLength(9);
    expect(ambient.map((npc) => npc.id)).toEqual(ambientIds);
    expect(ambient.every((npc) => npc.wander === true)).toBe(true);
    expect(new Set(ambient.map((npc) => npc.dialogue)).size).toBe(ambient.length);
    expect(new Set(ambient.map((npc) => `${npc.x},${npc.y}`)).size).toBe(ambient.length);
    for (const npc of ambient) {
      expect(DIALOGUE[npc.dialogue as keyof typeof DIALOGUE], npc.dialogue).toBeDefined();
      expect(isWalkable(map, npc.x, npc.y), npc.id).toBe(true);
      expect(tileIsPropClear(map, npc.x, npc.y), `${npc.id} prop collision`).toBe(true);
    }
    expect(map.signs.filter((sign) => sign.dialogue === 'sign_valea_cottage')).toHaveLength(1);
    expect(maps.castle_hoaxula.signs.filter((sign) => sign.dialogue === 'sign_hoaxula_park')).toHaveLength(1);
  });

  it('puts a functional picnic rest within arm\'s reach of the castle recovery point', () => {
    const castle = buildChapter9Maps().castle_hoaxula;
    const picnic = castle.props.find((prop) => prop.sprite === 'picnic');
    expect(picnic).toMatchObject({ x: 37, y: 39 });
    expect(picnic!.solid).toBeDefined();
    const recovery = CH9_WORLD.castle.recovery;
    expect(Math.abs(picnic!.x - recovery.x) + Math.abs(picnic!.y - recovery.y)).toBe(2);
    expect(isWalkable(castle, recovery.x, recovery.y)).toBe(true);
    expect(tileIsPropClear(castle, recovery.x, recovery.y)).toBe(true);
    expect(tileIsPropClear(castle, CH9_WORLD.castle.bossRestart.x, CH9_WORLD.castle.bossRestart.y)).toBe(true);
  });

  it('orders three separate monastery courts and keeps the destination quiet', () => {
    const map = buildChapter9Maps().stone_brow_monastery;
    const { trial, awakening, resonance } = CH9_WORLD.monastery.story;
    expect(trial.y).toBeGreaterThan(awakening.y + awakening.h);
    expect(awakening.y).toBeGreaterThan(resonance.y + resonance.h);
    expect(overlaps(trial, awakening)).toBe(false);
    expect(overlaps(awakening, resonance)).toBe(false);
    expect(map.triggers.map((trigger) => trigger.rect)).toEqual([trial, awakening, resonance]);
    expect(map.spawners).toEqual([]);
  });

  it('boots monastery story profiles on the real durable trigger frontiers', () => {
    const { profiles, story } = CH9_WORLD.monastery;
    expect(inside(story.trial, profiles.monastery.x, profiles.monastery.y)).toBe(true);
    expect(profiles.monastery.facing).toBe('up');
    expect(inside(story.awakening, profiles.awakening.x, profiles.awakening.y)).toBe(true);
    expect(profiles.awakening.facing).toBe('up');
    expect(profiles.complete.y).toBeGreaterThan(story.resonance.y + story.resonance.h - 1);
  });

  it('keeps trigger IDs unique and mandatory trigger tiles clear of prop collision', () => {
    const maps = buildChapter9Maps();
    const ids = Object.values(maps).flatMap((map) => map.triggers.map((trigger) => trigger.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const map of Object.values(maps)) {
      for (const trigger of map.triggers) {
        let clear = false;
        for (let y = trigger.rect.y; y < trigger.rect.y + trigger.rect.h && !clear; y++) {
          for (let x = trigger.rect.x; x < trigger.rect.x + trigger.rect.w; x++) {
            if (isWalkable(map, x, y) && tileIsPropClear(map, x, y)) clear = true;
          }
        }
        expect(clear, `${map.id}:${trigger.id}`).toBe(true);
      }
    }
  });
});
