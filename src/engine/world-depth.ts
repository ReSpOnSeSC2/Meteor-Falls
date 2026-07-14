export interface VisualDepthRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GroundedVisualDepth {
  x: number;
  y: number;
  level: number;
  lift: number;
  depth: number;
}

export interface PreferredGroundContact {
  x: number;
  y: number;
}

/**
 * Depth-sort a tall world object from its visual bottom while sampling the
 * elevation of the ground it actually stands on, rather than its roof. The
 * optional contact lets an enterable facade use its authored threshold when
 * 3/4-view art extends below the door or spans two elevation regions.
 */
export function groundedVisualDepth(
  rect: Readonly<VisualDepthRect>,
  levelDepthBias: number,
  levelAtPx: (x: number, y: number) => number,
  preferredGround?: Readonly<PreferredGroundContact>,
): GroundedVisualDepth {
  const left = Math.min(rect.x, rect.x + rect.w);
  const right = Math.max(rect.x, rect.x + rect.w);
  const centerX = rect.x + rect.w / 2;
  const requestedX = preferredGround && Number.isFinite(preferredGround.x)
    ? preferredGround.x
    : centerX;
  const x = Math.max(left, Math.min(right, requestedX));
  const y = preferredGround && Number.isFinite(preferredGround.y)
    ? preferredGround.y
    : rect.y + rect.h;
  const level = levelAtPx(x, y);
  const lift = level * levelDepthBias;
  return { x, y, level, lift, depth: rect.y + rect.h + lift };
}
