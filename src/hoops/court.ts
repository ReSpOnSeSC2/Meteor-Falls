/**
 * THE CAGE — court geometry (S12). Shared by the sim (Phaser-free), the
 * renderer, and the court-texture painter, so the painted lines, the physics,
 * and the 2-point arc are the same numbers by construction. Units: px.
 *
 * Full court, NYC-cage proportions at EB pixel scale. (0,0) is the court's
 * top-left INBOUNDS corner; the chain-link fence rings it at FENCE px out —
 * in a cage there is no out of bounds, the fence is live (street canon).
 *
 * SCALE LAW (mirrors src/links/course.ts — keep the shared constant NATIVE,
 * scale at consumption): `COURT`, `HALF`, `spacingSpots`, `clampToCage`,
 * `rimFor`, `behindArc`, `pointsFor` are **NATIVE** pixel quantities and MUST
 * stay native. The FROZEN painter (`spritegen/athletes.ts` — `drawCageCourt`/
 * `drawCageBehind`/`behindMap`) imports `COURT` and paints the court TEXTURE at
 * NATIVE resolution; that texture is then upscaled ×ART_SCALE at the boot seam
 * (`addPixmap`). If `COURT` were itself scaled, the painter would draw a
 * ×ART_SCALE canvas the seam upscales AGAIN → ×ART_SCALE² (the double-scale
 * bug). GAMEPLAY scales at consumption through the RUNTIME view `COURT_RT`
 * (and `HALF_RT`/`spacingSpotsRT`/`clampToCageRT`/`rimForRT`) at the bottom of
 * this file — the sim reads those. At ART_SCALE=1 the runtime view is
 * byte-identical to the native one (s(n) === n).
 */
import { s } from '../spritegen/scale';

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

/** rim center for the side an athlete ATTACKS (0 = us → right rim). NATIVE. */
export function rimFor(attackRight: boolean): Vec {
  return { x: attackRight ? COURT.RIM_R_X : COURT.RIM_L_X, y: COURT.RIM_Y };
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** true if (x,y) is behind the 2-point arc of the given rim. NATIVE. */
export function behindArc(x: number, y: number, rim: Vec): boolean {
  return dist(x, y, rim.x, rim.y) > COURT.ARC_R;
}

/** street scoring: 1s and 2s — 2 behind the arc (S12 canon). NATIVE. */
export function pointsFor(x: number, y: number, rim: Vec): 1 | 2 {
  return behindArc(x, y, rim) ? 2 : 1;
}

/** clamp a walker to the playable surface (the cage apron is walkable). NATIVE. */
export function clampToCage(v: Vec): void {
  v.x = Math.max(-COURT.FENCE + 6, Math.min(COURT.W + COURT.FENCE - 6, v.x));
  v.y = Math.max(-COURT.FENCE + 8, Math.min(COURT.H + COURT.FENCE - 8, v.y));
}

/**
 * The 3v3 halfcourt: pickup plays the NEAR (left) half — its rim, its arc,
 * and a check-up spot at the top of the arc. NATIVE.
 */
export const HALF = {
  RIM: { x: COURT.RIM_L_X, y: COURT.RIM_Y } as Vec,
  /** the check-up spot — "check-up after scores", ball walks it up here */
  CHECK: { x: COURT.RIM_L_X + COURT.ARC_R + 36, y: COURT.RIM_Y } as Vec,
  /** halfcourt's east wall for clamping (play stays on the near half) */
  X_MAX: COURT.W / 2 + 6,
} as const;

/** offensive spacing spots around a rim (mirrored for the right end). NATIVE.
 *  Index 0 is the top, then wings, then corners — assignments rotate by
 *  athlete slot so the floor stays spaced (teammate AI earns its minutes). */
export function spacingSpots(rim: Vec, attackRight: boolean): Vec[] {
  const dir = attackRight ? -1 : 1; // spots sit up-court of the rim
  const a = COURT.ARC_R;
  return [
    { x: rim.x + dir * (a + 18), y: rim.y }, // top
    { x: rim.x + dir * (a - 10), y: rim.y - 108 }, // high wing
    { x: rim.x + dir * (a - 10), y: rim.y + 108 }, // low wing
    { x: rim.x + dir * 26, y: rim.y - (a - 6) }, // high corner
    { x: rim.x + dir * 26, y: rim.y + (a - 6) }, // low corner
  ];
}

/* ===================== the RUNTIME (ART_SCALE) view ===================== */

/**
 * The runtime (ART_SCALE-scaled) view of the cage geometry — what GAMEPLAY
 * reads (player/ball positions, bounds, rim, arcs, key, clamps). Every field
 * is `COURT.*` lifted to runtime px, so the sim plays at the framebuffer's
 * resolution while the painter keeps `COURT` native. At ART_SCALE=1 this is
 * byte-identical to `COURT` (s(n) === n).
 */
export const COURT_RT = {
  W: s(COURT.W),
  H: s(COURT.H),
  FENCE: s(COURT.FENCE),
  RIM_L_X: s(COURT.RIM_L_X),
  RIM_R_X: s(COURT.RIM_R_X),
  RIM_Y: s(COURT.RIM_Y),
  RIM_Z: s(COURT.RIM_Z),
  ARC_R: s(COURT.ARC_R),
  KEY_W: s(COURT.KEY_W),
  KEY_D: s(COURT.KEY_D),
  BOARD_OFF: s(COURT.BOARD_OFF),
} as const;

/** runtime rim center for the attacked side — the sim's positions are runtime */
export function rimForRT(attackRight: boolean): Vec {
  return { x: attackRight ? COURT_RT.RIM_R_X : COURT_RT.RIM_L_X, y: COURT_RT.RIM_Y };
}

/** behind the 2-point arc, RUNTIME (compares the sim's runtime coords against
 *  the runtime-scaled arc — the native behindArc would mismatch at ×4) */
export function behindArcRT(x: number, y: number, rim: Vec): boolean {
  return dist(x, y, rim.x, rim.y) > COURT_RT.ARC_R;
}

/** street scoring in RUNTIME space (the sim rolls it on runtime positions) */
export function pointsForRT(x: number, y: number, rim: Vec): 1 | 2 {
  return behindArcRT(x, y, rim) ? 2 : 1;
}

/** runtime clamp to the playable surface (the sim's walker positions). The
 *  +6/+8 apron insets are native px → scaled to match the runtime bounds. */
export function clampToCageRT(v: Vec): void {
  v.x = Math.max(-COURT_RT.FENCE + s(6), Math.min(COURT_RT.W + COURT_RT.FENCE - s(6), v.x));
  v.y = Math.max(-COURT_RT.FENCE + s(8), Math.min(COURT_RT.H + COURT_RT.FENCE - s(8), v.y));
}

/** the 3v3 halfcourt in RUNTIME px (the sim's check spot, rim, and east wall) */
export const HALF_RT = {
  RIM: { x: COURT_RT.RIM_L_X, y: COURT_RT.RIM_Y } as Vec,
  /** RIM_L_X + ARC_R inherit the scale; only the bare +36 px is wrapped */
  CHECK: { x: COURT_RT.RIM_L_X + COURT_RT.ARC_R + s(36), y: COURT_RT.RIM_Y } as Vec,
  X_MAX: COURT_RT.W / 2 + s(6),
} as const;

/** runtime offensive spacing spots (the sim seeks to these). ARC_R is already
 *  runtime-scaled; the bare ±18/10/26/108/6 offsets take s(). */
export function spacingSpotsRT(rim: Vec, attackRight: boolean): Vec[] {
  const dir = attackRight ? -1 : 1; // ±1 direction, NOT the scaler
  const a = COURT_RT.ARC_R;
  return [
    { x: rim.x + dir * (a + s(18)), y: rim.y }, // top
    { x: rim.x + dir * (a - s(10)), y: rim.y - s(108) }, // high wing
    { x: rim.x + dir * (a - s(10)), y: rim.y + s(108) }, // low wing
    { x: rim.x + dir * s(26), y: rim.y - (a - s(6)) }, // high corner
    { x: rim.x + dir * s(26), y: rim.y + (a - s(6)) }, // low corner
  ];
}
