/**
 * Formal-city facade promotion.
 *
 * This pass runs AFTER occupyCity. That sequencing is the save-safety feature:
 * generated unit IDs, lock rolls, NPC IDs, interior dimensions, and return-door
 * targets are created from the historical facade data first. Promotion then
 * swaps only the exterior art/geometry, keeping every door `to/tx/ty` intact.
 */
import type { MapDef, PropDef } from '../schemas';
import { facadeDims, facadeSolid } from '../levelkit/kit';
import { cityBuildingHeight } from '../spritegen/tiles';
import { characterNativeScale, scale2 } from '../engine/actor-collision';
import {
  FORMAL_CITY_HERO_HEIGHT,
  FORMAL_CITY_MIN_RATIO,
  FORMAL_CITY_LANDMARK_MIN_RATIO,
  FORMAL_CITY_SCALE_IDS,
  cityScaleVariantFor,
  cityScaleVariantMeta,
  type FormalCityScaleId,
} from '../spritegen/buildings';

export const MINIMUS_SCALE_DEVICE_PROP = 'costa_telescope';
export const MINIMUS_SCALE_DEVICE_DIALOGUE = 'sign_minimus_long_view';

export interface FormalCityScaleResult {
  cityId: FormalCityScaleId;
  promoted: number;
  missingSources: string[];
}

const isFormalCity = (id: string): id is FormalCityScaleId =>
  (FORMAL_CITY_SCALE_IDS as readonly string[]).includes(id);

function visualDoorMetrics(entry: ReturnType<typeof cityScaleVariantFor>): { ox: number; w: number } {
  if (!entry) return { ox: 0, w: 16 };
  const doorAt = entry.opts.doorAt ?? Math.floor(entry.opts.wallTiles / 2);
  const artW = entry.opts.doubleDoor ? 22 : 12;
  const artX = 1 + doorAt * 16 + Math.floor((16 - artW) / 2);
  return { ox: artX, w: artW };
}

function relocateKnockSign(map: MapDef, prop: PropDef, oldBottomPx: number, newDoorCenterPx: number): void {
  const width = facadeDims(prop.sprite).w;
  const minX = prop.x - 0.5;
  const maxX = prop.x + width + 0.5;
  const knock = map.signs.find((sign) =>
    sign.dialogue.startsWith('cl_knock_')
    && sign.x >= minX
    && sign.x <= maxX
    && Math.abs(sign.y * 16 - oldBottomPx) <= 24,
  );
  if (knock) knock.x = Math.floor(newDoorCenterPx / 16);
}

/** occupyCity mounts service silhouettes beside the source-art doorway before
 * this pass swaps in the tall facade. Keep that plaque beside the promoted art
 * just as we already do for knock signs; its prop remains collision-free. */
function relocateAmenityMarker(
  map: MapDef,
  oldDoorCenterPx: number,
  newDoorCenterPx: number,
  oldBottomPx: number,
  moved: Set<MapDef['signs'][number]>,
): void {
  const plaque = map.signs
    .filter((sign) => sign.dialogue.startsWith(`citysvc_sign_${map.id}_`) && !moved.has(sign))
    .filter((sign) => Math.abs(sign.y * 16 - oldBottomPx) <= 32)
    .sort((a, b) => Math.abs(a.x + 0.5 - oldDoorCenterPx / 16) - Math.abs(b.x + 0.5 - oldDoorCenterPx / 16))[0];
  if (!plaque || Math.abs(plaque.x + 0.5 - oldDoorCenterPx / 16) > 4) return;
  const marker = map.props.find((prop) =>
    !prop.sprite.startsWith('bldg_') &&
    Math.abs(prop.x - plaque.x) < 0.01 &&
    Math.abs(prop.y - (plaque.y + 0.35)) < 0.01,
  );
  const shift = Math.round(newDoorCenterPx / 16) - Math.round(oldDoorCenterPx / 16);
  plaque.x += shift;
  if (marker) marker.x += shift;
  moved.add(plaque);
}

/** Promote one assembled formal city in place, retaining prop order. */
export function promoteFormalCityScale(map: MapDef): FormalCityScaleResult | undefined {
  if (!isFormalCity(map.id)) return undefined;
  let promoted = 0;
  const missingSources: string[] = [];
  const movedAmenityMarkers = new Set<MapDef['signs'][number]>();

  // Mutate in place — never sort/splice. Puerto and Valle's authored bldg order
  // remains byte-for-byte in the same array positions.
  for (const prop of map.props) {
    if (!prop.sprite.startsWith('bldg_')) continue;
    if (cityScaleVariantMeta(prop.sprite)) continue; // idempotent
    const source = prop.sprite;
    const entry = cityScaleVariantFor(map.id, source);
    if (!entry) {
      missingSources.push(source);
      continue;
    }

    const instance = scale2(prop.scale);
    const sourceDims = facadeDims(source);
    const sourceHeight = cityBuildingHeight(sourceDims.u);
    // A door's vertical metric is the strongest foot anchor: occupyCity writes
    // oy=H-14, while hand-authored doors tune the same value to their street
    // apron. With no door (the fixed ~10% locked set), the declared source height
    // is the stable placer contract.
    const oldBottomPx = prop.door
      ? prop.y * 16 + (prop.door.oy + 14) * instance.y
      : prop.y * 16 + sourceHeight * instance.y;
    const targetHeight = cityBuildingHeight(entry.opts.upperRows);

    const { ox: artDoorX, w: artDoorW } = visualDoorMetrics(entry);
    const artDoorCenter = artDoorX + artDoorW / 2;
    const oldDoorCenterPx = prop.door
      ? prop.x * 16 + (prop.door.ox + prop.door.w / 2) * instance.x
      : undefined;
    const newDoorCenterPx = prop.x * 16 + artDoorCenter * instance.x;
    if (!prop.door) relocateKnockSign(map, prop, oldBottomPx, newDoorCenterPx);
    else if (oldDoorCenterPx !== undefined) {
      relocateAmenityMarker(map, oldDoorCenterPx, newDoorCenterPx, oldBottomPx, movedAmenityMarkers);
    }

    prop.sprite = entry.name;
    // Foot-preserving re-layout: added storeys grow NORTH from the exact old
    // street apron. Width/x stay untouched, so roads and neighboring lots do not
    // move. Negative top coordinates are legitimate off-screen skyline, just as
    // the existing colossi already use.
    prop.y = (oldBottomPx - targetHeight * instance.y) / 16;
    prop.solid = facadeSolid(entry.opts.wallTiles, entry.opts.upperRows);
    if (prop.door) {
      const triggerW = Math.max(prop.door.w, artDoorW);
      prop.door = {
        ...prop.door,
        ox: artDoorCenter - triggerW / 2,
        oy: targetHeight - 14,
        w: triggerW,
      };
    }
    promoted++;
  }

  if (map.id === 'minimus_major') {
    // The Gulliver hard conflict is made diegetic rather than silently waived:
    // citizens/props remain true 0.5-scale miniatures, while the Royal Long-View
    // Lens optically exaggerates the duchy's narrow architecture upward. The
    // brass telescope + readable sign explain why giant visitors see tall,
    // needle-thin buildings without making the people normal-sized.
    if (!map.props.some((prop) => prop.sprite === MINIMUS_SCALE_DEVICE_PROP)) {
      map.props.push({ sprite: MINIMUS_SCALE_DEVICE_PROP, x: 18, y: 22 });
    }
    if (!map.signs.some((sign) => sign.dialogue === MINIMUS_SCALE_DEVICE_DIALOGUE)) {
      map.signs.push({ x: 18, y: 22, dialogue: MINIMUS_SCALE_DEVICE_DIALOGUE });
    }
  }

  return { cityId: map.id, promoted, missingSources };
}

export function formalCityFacadeSource(sprite: string): string | undefined {
  return cityScaleVariantMeta(sprite)?.source;
}

/** Actual runtime display height in native 32px-hero units. Procedural city-
 * scale textures are generated at cityBuildingHeight(u), upscaled uniformly at
 * boot, then receive the exact map-native and PropDef instance scales below. */
export function formalCityFacadeRuntimeHeight(mapId: string, prop: PropDef): number | undefined {
  const meta = cityScaleVariantMeta(prop.sprite);
  if (!meta) return undefined;
  const instance = scale2(prop.scale);
  return cityBuildingHeight(meta.opts.upperRows) * characterNativeScale(mapId) * instance.y;
}

export function formalCityFacadeRequiredRatio(prop: PropDef): number | undefined {
  const meta = cityScaleVariantMeta(prop.sprite);
  if (!meta) return undefined;
  return meta.landmark ? FORMAL_CITY_LANDMARK_MIN_RATIO : FORMAL_CITY_MIN_RATIO;
}

export function formalCityFacadeRatio(mapId: string, prop: PropDef): number | undefined {
  const height = formalCityFacadeRuntimeHeight(mapId, prop);
  return height === undefined ? undefined : height / FORMAL_CITY_HERO_HEIGHT;
}
