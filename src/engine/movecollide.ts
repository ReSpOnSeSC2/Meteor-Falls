/**
 * Movement-collision geometry for the overworld — the pure predicates behind
 * OverworldScene.tryMove. Kept here (not in the scene) so the soft-lock rule is
 * unit-testable without a Phaser harness.
 *
 * THE SOFT-LOCK RULE (ADR-137). The overworld resolves movement by testing the
 * DESTINATION foot-box for overlap and refusing any step that overlaps a solid.
 * That traps the player whenever they end up INSIDE a moving body:
 *   - an ambient car — its collision rect is scaled 1.35× (2.8× for Lilleby's
 *     giant trucks), so it is BIGGER THAN ONE TILE and overlaps the player's
 *     foot-box even from an adjacent cell, despite the traffic sim's cell-level
 *     no-crush law; or
 *   - a wandering NPC that closed onto the player.
 * Once the foot-box is inside such a body, every few-pixel step still overlaps it,
 * so no incremental step ever clears it → the player cannot move at all.
 *
 * The fix: a DYNAMIC body blocks a step ONLY when the step ENTERS it fresh — the
 * destination box overlaps a body the CURRENT box is not already inside. A body the
 * player already overlaps never blocks, so they can always walk back out (and can't
 * be shoved deeper against their input). Static geometry (tiles + props) is handled
 * separately and still blocks unconditionally, so walls and buildings stay solid.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Axis-aligned bounding-box overlap. Touching edges do NOT count as an overlap. */
export function aabbOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * True when moving from `cur` to `box` would step INTO a dynamic body the mover is
 * not already overlapping — the only case where a car/NPC should block. Escaping a
 * body already overlapped (or sliding around inside it) returns false, so the mover
 * is never trapped. Entering a *different* body while escaping the first still
 * blocks — you can leave the car you're in, but not phase through the next one.
 */
export function entersNewBody(box: Rect, cur: Rect, bodies: readonly Rect[]): boolean {
  for (const b of bodies) {
    if (aabbOverlap(box, b) && !aabbOverlap(cur, b)) return true;
  }
  return false;
}
