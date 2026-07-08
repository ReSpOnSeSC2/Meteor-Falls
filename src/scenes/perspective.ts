/**
 * src/scenes/perspective.ts — the shared HD-2D projection core for the overworld's
 * opt-in "receding ground + upright billboard sprites" look (the art-director's 2.5D
 * request). RENDER-ONLY: world/logic coordinates are never changed by this — it only maps
 * a FLAT top-down screen position to where it lands on the tilted ground plane, plus a
 * uniform depth scale. The ground mesh and every sprite use the SAME function here, so they
 * stay pixel-aligned. OFF unless the scene enables PERSPECTIVE mode (flag-gated).
 *
 * Model = CSS `perspective(P) rotateX(tilt)` about a pivot row near the foreground:
 *   a flat point at (dx, dy) pixels from the pivot →
 *     y' = dy·cos(tilt)      (vertical foreshorten)
 *     z' = dy·sin(tilt)      (+z toward camera = nearer/lower · −z away = farther/upper)
 *     s  = P / (P − z')      (perspective divide: >1 near, <1 far)
 *   → screen offset (dx·s, y'·s) from the pivot, and depth-scale s.
 *
 * A SPRITE keeps its art upright: we move its FOOT to project(foot) and scale it by s — we
 * never rotate the sprite, so buildings and characters stand straight up on the tilted ground.
 */

export interface PerspectiveParams {
  /** ground recede angle in degrees (the rotateX amount). 0 = flat, ~30 = the mock's look. */
  tiltDeg: number;
  /** CSS-style perspective distance in px — smaller = stronger foreshorten. */
  perspectivePx: number;
  /** screen-Y fraction (0..1) of the tilt PIVOT row (the "you are here" foreground line). */
  pivotYFrac: number;
  /** clamp: farthest depth-scale allowed (stops distant rows collapsing to zero). */
  minScale: number;
}

export const DEFAULT_PERSPECTIVE: PerspectiveParams = {
  tiltDeg: 30,
  perspectivePx: 900,
  pivotYFrac: 0.74,
  minScale: 0.22,
};

export interface Projected {
  /** screen offset X from the pivot, after the transform. */
  sx: number;
  /** screen offset Y from the pivot, after the transform. */
  sy: number;
  /** uniform depth scale (>1 nearer than the pivot, <1 farther). */
  scale: number;
}

/**
 * Project a FLAT screen point given as (dx, dy) pixels relative to the tilt pivot through the
 * rotateX+perspective transform. Pure + deterministic — unit-testable, engine-free.
 */
export function projectPoint(dx: number, dy: number, p: PerspectiveParams): Projected {
  const t = (p.tiltDeg * Math.PI) / 180;
  const yc = dy * Math.cos(t);
  const zc = dy * Math.sin(t); // +toward camera (dy>0 = below pivot = near), −away (above = far)
  const denom = p.perspectivePx - zc;
  const raw = p.perspectivePx / (denom > 1 ? denom : 1);
  const scale = raw < p.minScale ? p.minScale : raw;
  return { sx: dx * scale, sy: yc * scale, scale };
}

/** the pivot's absolute screen Y for a viewport of height vh. */
export function pivotY(vh: number, p: PerspectiveParams): number {
  return vh * p.pivotYFrac;
}

/**
 * Convenience: map an ABSOLUTE flat screen point (fx, fy) to its perspective screen point,
 * given the viewport centre X and pivot Y. Returns absolute screen (x, y) + depth scale.
 */
export function projectScreen(
  fx: number,
  fy: number,
  originX: number,
  vh: number,
  p: PerspectiveParams,
): { x: number; y: number; scale: number } {
  const py = pivotY(vh, p);
  const r = projectPoint(fx - originX, fy - py, p);
  return { x: originX + r.sx, y: py + r.sy, scale: r.scale };
}
