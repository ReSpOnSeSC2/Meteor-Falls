/**
 * Shared overworld-character geometry.
 *
 * Map NPC/patrol coordinates are authoring anchors, not their feet. Runtime art
 * plants every character at the centre of the anchor column and 22 native pixels
 * below the anchor row. Keep that conversion and the small foot collision boxes
 * here so the scene, editor, validators, and tests cannot each invent a slightly
 * different character position.
 *
 * All constants are in the 16px authoring space. `pixelScale` converts them to
 * runtime pixels (`ART_SCALE` in OverworldScene); callers doing map QA leave it 1.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Scale2 {
  x: number;
  y: number;
}

export type InstanceScale = number | Scale2 | undefined;

export interface Footprint {
  ox: number;
  oy: number;
  w: number;
  h: number;
}

export const AUTHOR_TILE_PX = 16;
export const CHARACTER_FEET_OFFSET = { x: 8, y: 22 } as const;
export const PLAYER_FOOTPRINT = { ox: -5, oy: -9, w: 10, h: 9 } as const;
export const NPC_FOOTPRINT = { ox: -6, oy: -10, w: 12, h: 10 } as const;
export const ROAMER_FOOTPRINT = { ox: -5, oy: -8, w: 10, h: 8 } as const;
export const PATROL_FOOTPRINT = PLAYER_FOOTPRINT;

export const DOG_DISPLAY_SCALE = 1.5;
export const MINIMUS_NATIVE_SCALE = 0.5;
export const LILLEBY_GIANT_SCALE = 2.3;

export const MINIMUS_NATIVE_MAP_IDS = [
  'minimus_major',
  'procession_way',
  'the_hedgerow',
  'ducal_crown',
] as const;

export const LILLEBY_GIANT_MAP_IDS = ['lilleby'] as const;

const MINIMUS_NATIVE_MAPS: ReadonlySet<string> = new Set(MINIMUS_NATIVE_MAP_IDS);
const LILLEBY_GIANT_MAPS: ReadonlySet<string> = new Set(LILLEBY_GIANT_MAP_IDS);

/** Native visual scale for a map's citizens. Dogs keep their dog-specific scale. */
export function characterNativeScale(mapId: string): number {
  if (MINIMUS_NATIVE_MAPS.has(mapId)) return MINIMUS_NATIVE_SCALE;
  if (LILLEBY_GIANT_MAPS.has(mapId)) return LILLEBY_GIANT_SCALE;
  return 1;
}

export function scale2(value: InstanceScale): Scale2 {
  if (typeof value === 'number') return { x: value, y: value };
  return value ? { x: value.x, y: value.y } : { x: 1, y: 1 };
}

/** Effective sprite/foot scale after dog-or-map scale and per-instance resize. */
export function npcEffectiveScale(
  mapId: string,
  dog: boolean,
  instanceScale?: InstanceScale,
): Scale2 {
  const instance = scale2(instanceScale);
  const base = dog ? DOG_DISPLAY_SCALE : characterNativeScale(mapId);
  return { x: base * instance.x, y: base * instance.y };
}

/** Convert an authored NPC or patrol anchor to its planted feet position. */
export function characterFeet(
  tileX: number,
  tileY: number,
  tilePx = AUTHOR_TILE_PX,
  pixelScale = tilePx / AUTHOR_TILE_PX,
): Point {
  return {
    x: tileX * tilePx + CHARACTER_FEET_OFFSET.x * pixelScale,
    y: tileY * tilePx + CHARACTER_FEET_OFFSET.y * pixelScale,
  };
}

/** Scale a native foot box from the actor's planted feet. */
export function footRect(
  feet: Point,
  footprint: Footprint,
  actorScale: Scale2 = { x: 1, y: 1 },
  pixelScale = 1,
): Rect {
  return {
    x: feet.x + footprint.ox * actorScale.x * pixelScale,
    y: feet.y + footprint.oy * actorScale.y * pixelScale,
    w: footprint.w * actorScale.x * pixelScale,
    h: footprint.h * actorScale.y * pixelScale,
  };
}

/** Finite unit direction; coincident points deliberately produce no movement. */
export function unitVectorOrZero(dx: number, dy: number): Point {
  const length = Math.hypot(dx, dy);
  return length > 0 && Number.isFinite(length)
    ? { x: dx / length, y: dy / length }
    : { x: 0, y: 0 };
}
