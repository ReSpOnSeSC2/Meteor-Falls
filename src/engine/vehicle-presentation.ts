/**
 * Unit-agnostic presentation rules shared by the authored map cars and the
 * live vehicle controller. Values passed to vehicleOccupantPose may be native
 * or runtime pixels; the returned offsets use the same unit.
 */

export type VehicleFacing =
  | 'down'
  | 'left'
  | 'right'
  | 'up'
  | 'downright'
  | 'downleft'
  | 'upright'
  | 'upleft';

/** The clunker master is a padded three-view sheet. This matches the driven
 * sedan scale instead of squeezing its 3/4 art into the old 38x16 thumbnail. */
export const STATIC_CLUNKER_DISPLAY_SIZE = { w: 64, h: 35 } as const;

/** Lower-body footprint inside the padded clunker frame. Directional frames
 * stay upright, so this box is already correct for the front/back views. */
export const STATIC_CLUNKER_SOLID = { ox: 16, oy: 9, w: 32, h: 24 } as const;

const HEAD_FRAME: Readonly<Record<VehicleFacing, number>> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
  downright: 4,
  downleft: 5,
  upright: 6,
  upleft: 7,
};

/** Eight compact head frames are packed in the same facing order as this map. */
export function vehicleHeadFrame(facing: VehicleFacing): number {
  return HEAD_FRAME[facing];
}

/**
 * Use the cast's real action drawings as a two-frame pedal/straddle cycle.
 * The run block carries bent knees, a forward lean, and bent arms that read as
 * hands reaching the handlebars; the former walk block still left the rider's
 * arms hanging straight beside the bicycle.
 */
export function vehicleRiderFrame(facing: VehicleFacing, phase: 0 | 1): number {
  switch (facing) {
    case 'down': return phase === 0 ? 16 : 17;
    case 'left': return phase === 0 ? 18 : 19;
    case 'right': return phase === 0 ? 20 : 21;
    case 'up': return phase === 0 ? 22 : 23;
    case 'downright': return phase === 0 ? 36 : 37;
    case 'downleft': return phase === 0 ? 38 : 39;
    case 'upright': return phase === 0 ? 40 : 41;
    case 'upleft': return phase === 0 ? 42 : 43;
  }
}

export interface VehicleOccupantPose {
  /** Open vehicles show the full articulated cast sprite; enclosed ones show
   * a compact generated head through the glass. */
  mode: 'rider' | 'window';
  dx: number;
  dy: number;
  scale: number;
  visible: boolean;
}

function direction(facing: VehicleFacing): { x: number; y: number } {
  return {
    x: facing.includes('right') ? 1 : facing.includes('left') ? -1 : 0,
    y: facing.includes('down') ? 1 : facing.includes('up') ? -1 : 0,
  };
}

/**
 * Seat/window placement for every party member. The side view exposes the
 * whole cabin; front/back and diagonal views expose the front row only.
 */
export function vehicleOccupantPose(
  vehicleClass: string,
  facing: VehicleFacing,
  slot: number,
  occupants: number,
  displayW: number,
  displayH: number,
): VehicleOccupantPose {
  const open = vehicleClass === 'bike' || vehicleClass === 'moto';
  const dir = direction(facing);
  const sideView = dir.y === 0;
  if (open) {
    const passenger = slot > 0;
    const trail = passenger ? 0.18 : 0;
    return {
      mode: 'rider',
      dx: sideView
        ? -dir.x * displayW * trail
        : (passenger ? displayW * 0.12 : 0),
      dy: -displayH * 0.22 + (!sideView && passenger ? -dir.y * displayH * 0.2 : 0),
      scale: passenger ? 0.78 : 0.9,
      visible: true,
    };
  }

  const roomy = vehicleClass === 'bus' || vehicleClass === 'van';
  const shown = sideView ? Math.max(1, occupants) : Math.min(2, Math.max(1, occupants));
  const visible = sideView || slot < shown;
  const windowSpan = displayW * (roomy ? 0.56 : sideView ? 0.38 : 0.22);
  const step = shown > 1 ? windowSpan / (shown - 1) : 0;
  return {
    mode: 'window',
    dx: (slot - (shown - 1) / 2) * step,
    dy: -displayH * (roomy ? 0.53 : 0.5),
    scale: roomy ? 0.46 : 0.4,
    visible,
  };
}
