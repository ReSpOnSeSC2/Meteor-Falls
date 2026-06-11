/**
 * THE CAGE — court geometry (S12). Shared by the sim (Phaser-free), the
 * renderer, and the court-texture painter, so the painted lines, the physics,
 * and the 2-point arc are the same numbers by construction. Units: px.
 *
 * Full court, NYC-cage proportions at EB pixel scale. (0,0) is the court's
 * top-left INBOUNDS corner; the chain-link fence rings it at FENCE px out —
 * in a cage there is no out of bounds, the fence is live (street canon).
 */

export const COURT = {
  W: 672,
  H: 368,
  /** fence stands this far outside the lines — the ball plays off it */
  FENCE: 22,
  /** rim centers, both ends */
  RIM_L_X: 46,
  RIM_R_X: 626,
  RIM_Y: 184,
  /** rim height (z px) — jump reach decides who touches what up there */
  RIM_Z: 64,
  /** the 2-point arc: "1s and 2s, 2 behind the arc" (street canon) */
  ARC_R: 138,
  /** painted key: width across, depth out from the baseline */
  KEY_W: 92,
  KEY_D: 116,
  /** backboard plane sits this far behind the rim center */
  BOARD_OFF: 12,
} as const;

export interface Vec {
  x: number;
  y: number;
}

/** rim center for the side an athlete ATTACKS (0 = us → right rim) */
export function rimFor(attackRight: boolean): Vec {
  return { x: attackRight ? COURT.RIM_R_X : COURT.RIM_L_X, y: COURT.RIM_Y };
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** true if (x,y) is behind the 2-point arc of the given rim */
export function behindArc(x: number, y: number, rim: Vec): boolean {
  return dist(x, y, rim.x, rim.y) > COURT.ARC_R;
}

/** street scoring: 1s and 2s — 2 behind the arc (S12 canon) */
export function pointsFor(x: number, y: number, rim: Vec): 1 | 2 {
  return behindArc(x, y, rim) ? 2 : 1;
}

/** clamp a walker to the playable surface (the cage apron is walkable) */
export function clampToCage(v: Vec): void {
  v.x = Math.max(-COURT.FENCE + 6, Math.min(COURT.W + COURT.FENCE - 6, v.x));
  v.y = Math.max(-COURT.FENCE + 8, Math.min(COURT.H + COURT.FENCE - 8, v.y));
}

/**
 * The 3v3 halfcourt: pickup plays the NEAR (left) half — its rim, its arc,
 * and a check-up spot at the top of the arc.
 */
export const HALF = {
  RIM: { x: COURT.RIM_L_X, y: COURT.RIM_Y } as Vec,
  /** the check-up spot — "check-up after scores", ball walks it up here */
  CHECK: { x: COURT.RIM_L_X + COURT.ARC_R + 36, y: COURT.RIM_Y } as Vec,
  /** halfcourt's east wall for clamping (play stays on the near half) */
  X_MAX: COURT.W / 2 + 6,
} as const;

/** offensive spacing spots around a rim (mirrored for the right end).
 *  Index 0 is the top, then wings, then corners — assignments rotate by
 *  athlete slot so the floor stays spaced (teammate AI earns its minutes). */
export function spacingSpots(rim: Vec, attackRight: boolean): Vec[] {
  const s = attackRight ? -1 : 1; // spots sit up-court of the rim
  const a = COURT.ARC_R;
  return [
    { x: rim.x + s * (a + 18), y: rim.y }, // top
    { x: rim.x + s * (a - 10), y: rim.y - 108 }, // high wing
    { x: rim.x + s * (a - 10), y: rim.y + 108 }, // low wing
    { x: rim.x + s * 26, y: rim.y - (a - 6) }, // high corner
    { x: rim.x + s * 26, y: rim.y + (a - 6) }, // low corner
  ];
}
