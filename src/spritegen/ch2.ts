/**
 * S14 — Chapter 2 prop art (the crossing, the port, the valley, the
 * pyramid). Same laws as every sprite: ADR-019 fixed canvases (map solids
 * and door zones aim at these exact dimensions), ADR-020's six rules
 * (hand-run contours, deliberate clustered detail, shadows and light only
 * after outline), palette-by-construction.
 *
 * The llama walks the DOG SHEET CONTRACT (S7c): frames [E, E-step, W,
 * W-step]; NpcDef.dog rides the same scene branch, so a llama NPC costs
 * zero new engine code — which is exactly what §A10 #5's herding wants.
 */
import { Pixmap } from './pixmap';
import { RAMP, px, C } from '../palette';

/** the Puerto Sol plaza fountain — colonial stone, honest water */
export function drawFountain(): Pixmap {
  const pm = new Pixmap(40, 38);
  const stone = px(RAMP.PAPER, 2);
  const stoneD = px(RAMP.PAPER, 1);
  // the basin — wide hand-run bowl
  pm.contour(20, 22, [16, 17, 18, 18, 18, 17, 16, 14], stone);
  pm.hline(4, 22, 33, px(RAMP.PAPER, 3)); // rim in the sun
  pm.contour(20, 25, [13, 14, 14, 13], px(RAMP.CYAN, 1)); // the pool
  pm.hline(10, 26, 8, px(RAMP.CYAN, 2)); // one bright band
  // the column + the spout
  pm.rect(17, 8, 6, 14, stone);
  pm.vline(17, 8, 14, px(RAMP.PAPER, 3));
  pm.vline(22, 8, 14, stoneD);
  pm.contour(20, 4, [3, 4, 4, 3], stone); // the cap
  pm.finish(); // ADR-101
  // water: pure light, stamped after outline (the ADR-021 idiom)
  pm.vline(19, 2, 4, px(RAMP.CYAN, 3));
  pm.vline(21, 3, 4, px(RAMP.CYAN, 2));
  pm.set(14, 24, px(RAMP.CYAN, 3));
  pm.set(26, 25, px(RAMP.CYAN, 3));
  pm.shadowUnder(20, 36, 16, C.inkSoft);
  return pm;
}

/** a market stall — striped canopy over crates of loud fruit */
export function drawMarketStall(stripe: number): Pixmap {
  const pm = new Pixmap(40, 34);
  // canopy stripes
  for (let x = 0; x < 40; x += 8) {
    pm.rect(x, 2, 4, 8, px(stripe, 2));
    pm.vline(x, 2, 8, px(stripe, 3));
    pm.rect(x + 4, 2, 4, 8, px(RAMP.PAPER, 3));
    pm.vline(x + 7, 2, 8, px(RAMP.PAPER, 2));
  }
  for (let x = 2; x < 40; x += 4) pm.set(x, 10, x % 8 < 4 ? px(stripe, 2) : px(RAMP.PAPER, 3));
  pm.hline(0, 11, 40, px(stripe, 0)); // canopy shadow line
  // posts
  pm.vline(2, 11, 18, px(RAMP.EARTH, 1));
  pm.vline(37, 11, 18, px(RAMP.EARTH, 1));
  // the table + goods (deliberate stacks, never scatter)
  pm.rect(4, 18, 32, 6, px(RAMP.EARTH, 2));
  pm.hline(4, 18, 32, px(RAMP.EARTH, 3));
  pm.rect(7, 14, 8, 4, px(RAMP.GOLD, 2)); // bananas, on duty
  pm.hline(8, 13, 5, px(RAMP.GOLD, 3));
  pm.ellipse(20, 16, 3, 2, px(RAMP.RED, 2)); // tomatoes in a bowl
  pm.set(19, 15, px(RAMP.RED, 3));
  pm.rect(26, 14, 7, 4, px(RAMP.GRASS, 2)); // limes, organized
  pm.set(27, 15, px(RAMP.GRASS, 3));
  pm.rect(4, 24, 32, 5, px(RAMP.EARTH, 1)); // skirt
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(20, 31, 17, C.inkSoft);
  return pm;
}

/** THE BANANA BOAT — the Ch.2 crossing, moored and structurally a banana */
export function drawBananaBoat(): Pixmap {
  const pm = new Pixmap(128, 64);
  const hull = px(RAMP.GOLD, 2);
  const hullL = px(RAMP.GOLD, 3);
  const hullD = px(RAMP.GOLD, 1);
  // the hull — a long sheer line, hand-run
  pm.contour(64, 30, [52, 56, 58, 60, 60, 59, 58, 56, 53, 49, 44, 38, 30], hull);
  pm.hline(8, 30, 112, hullL); // gunwale catch
  pm.hline(10, 41, 108, hullD);
  pm.hline(14, 42, 100, px(RAMP.GOLD, 0)); // waterline band
  // bow + stern upsweeps
  pm.contour(8, 22, [2, 3, 4, 5, 6, 6, 5], hull);
  pm.contour(120, 22, [2, 3, 4, 5, 6, 6, 5], hull);
  pm.set(6, 23, hullL);
  // the wheelhouse
  pm.rect(52, 12, 24, 18, px(RAMP.PAPER, 2));
  pm.hline(52, 12, 24, px(RAMP.PAPER, 3));
  pm.rect(55, 15, 7, 6, px(RAMP.CYAN, 1)); // windows
  pm.rect(65, 15, 7, 6, px(RAMP.CYAN, 1));
  pm.set(56, 16, px(RAMP.CYAN, 3));
  pm.set(66, 16, px(RAMP.CYAN, 3));
  pm.rect(60, 4, 5, 8, px(RAMP.RED, 2)); // the proud little funnel
  pm.hline(60, 4, 5, px(RAMP.RED, 3));
  pm.rect(61, 2, 3, 2, px(RAMP.INK, 1)); // soot ring
  // crates of cargo on deck (stacked, never scattered)
  pm.rect(24, 22, 12, 8, px(RAMP.EARTH, 2));
  pm.frame(24, 22, 12, 8, px(RAMP.EARTH, 0));
  pm.rect(28, 16, 12, 6, px(RAMP.EARTH, 2));
  pm.frame(28, 16, 12, 6, px(RAMP.EARTH, 0));
  pm.rect(88, 20, 14, 10, px(RAMP.EARTH, 2));
  pm.frame(88, 20, 14, 10, px(RAMP.EARTH, 0));
  pm.hline(90, 19, 8, px(RAMP.GOLD, 2)); // bananas peeking out
  pm.set(91, 18, px(RAMP.GOLD, 3));
  // the name, stenciled in three dashes of confidence
  pm.hline(40, 35, 3, px(RAMP.INK, 1));
  pm.hline(45, 35, 3, px(RAMP.INK, 1));
  pm.hline(50, 35, 3, px(RAMP.INK, 1));
  pm.finish(); // ADR-101
  // bow-wave glints — light after outline
  pm.set(12, 44, px(RAMP.CYAN, 3));
  pm.set(116, 44, px(RAMP.CYAN, 3));
  return pm;
}

/** the departures board — it lists one destination, proudly */
export function drawDepartureBoard(): Pixmap {
  const pm = new Pixmap(26, 30);
  pm.rect(2, 2, 22, 18, px(RAMP.INK, 1));
  pm.frame(2, 2, 22, 18, px(RAMP.EARTH, 2));
  pm.hline(3, 3, 20, px(RAMP.EARTH, 3));
  // SALIDAS rows: one lit destination, two dashes of honesty
  pm.hline(5, 7, 16, px(RAMP.GOLD, 3));
  pm.hline(5, 11, 10, px(RAMP.PAPER, 2));
  pm.hline(5, 15, 6, px(RAMP.PAPER, 1));
  pm.vline(12, 20, 8, px(RAMP.EARTH, 1)); // post
  pm.vline(13, 20, 8, px(RAMP.EARTH, 2));
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(13, 28, 8, C.inkSoft);
  return pm;
}

/** the Valle Dorado shrine — the wishing spot (small, gleaming, wrong) */
export function drawIdolShrine(): Pixmap {
  const pm = new Pixmap(40, 44);
  const stone = px(RAMP.EARTH, 2);
  // stepped pedestal (the pyramid, miniature)
  pm.rect(8, 30, 24, 8, stone);
  pm.rect(12, 24, 16, 6, stone);
  pm.hline(8, 30, 24, px(RAMP.EARTH, 3));
  pm.hline(12, 24, 16, px(RAMP.EARTH, 3));
  pm.hline(9, 37, 22, px(RAMP.EARTH, 0));
  // the little idol — gold, grinning, too pleased
  pm.contour(20, 8, [3, 5, 6, 7, 7, 7, 7, 6, 6, 5, 5, 4], px(RAMP.GOLD, 2));
  pm.rect(16, 12, 3, 2, C.outline); // the empty eyes
  pm.rect(22, 12, 3, 2, C.outline);
  pm.hline(15, 17, 11, C.outline); // the grin, rehearsing
  pm.hline(16, 18, 9, px(RAMP.GOLD, 0));
  pm.contour(15, 9, [1, 2, 2, 1], px(RAMP.GOLD, 3)); // crown light
  // offerings left at the base (deliberate, sad, specific)
  pm.rect(10, 27, 4, 3, px(RAMP.RED, 2)); // a kid's mitten
  pm.ellipse(28, 28, 2, 1, px(RAMP.CYAN, 2)); // somebody's marble
  pm.finish({ aa: false }); // ADR-101
  pm.set(17, 7, px(RAMP.PAPER, 3)); // the gleam — pure light, after outline
  pm.shadowUnder(20, 42, 14, C.inkSoft);
  return pm;
}

/** the step-pyramid's gate face — megalith courses around a dark mouth */
export function drawPyramidGate(): Pixmap {
  const pm = new Pixmap(96, 76);
  const stone = px(RAMP.EARTH, 2);
  const stoneL = px(RAMP.EARTH, 3);
  const stoneD = px(RAMP.EARTH, 1);
  // three steps of the lowest tiers
  pm.rect(16, 4, 64, 16, stone);
  pm.rect(8, 20, 80, 18, stone);
  pm.rect(0, 38, 96, 32, stone);
  pm.hline(16, 4, 64, stoneL);
  pm.hline(8, 20, 80, stoneL);
  pm.hline(0, 38, 96, stoneL);
  pm.hline(17, 19, 62, px(RAMP.EARTH, 0));
  pm.hline(9, 37, 78, px(RAMP.EARTH, 0));
  // course lines — broken mid-run (rule 4)
  pm.hline(4, 46, 40, stoneD);
  pm.hline(52, 46, 38, stoneD);
  pm.hline(0, 56, 30, stoneD);
  pm.hline(38, 56, 58, stoneD);
  pm.vline(24, 39, 7, stoneD);
  pm.vline(70, 47, 9, stoneD);
  // the mouth — a tall dark doorway with a carved lintel
  pm.rect(38, 44, 20, 26, C.outline);
  pm.rect(34, 40, 28, 5, stoneD);
  pm.hline(34, 40, 28, stoneL);
  pm.rect(45, 41, 6, 3, px(RAMP.GOLD, 1)); // the lintel glyph
  // moss where the jungle is winning (two clusters)
  pm.rect(2, 40, 5, 3, px(RAMP.FOREST, 1));
  pm.set(4, 39, px(RAMP.FOREST, 2));
  pm.rect(84, 24, 4, 3, px(RAMP.FOREST, 1));
  // torch sconces flanking the mouth
  pm.vline(32, 50, 8, px(RAMP.EARTH, 0));
  pm.vline(63, 50, 8, px(RAMP.EARTH, 0));
  pm.finish({ aa: false }); // ADR-101
  pm.set(32, 48, px(RAMP.ORANGE, 3)); // flame — light after outline
  pm.set(63, 48, px(RAMP.ORANGE, 3));
  pm.set(32, 47, px(RAMP.GOLD, 3));
  pm.set(63, 47, px(RAMP.GOLD, 3));
  return pm;
}

/** a mask switch — the rotation key; lit when its floor just turned */
export function drawMaskSwitch(lit: boolean): Pixmap {
  const pm = new Pixmap(18, 22);
  const stone = px(RAMP.EARTH, 2);
  pm.rect(5, 12, 8, 8, px(RAMP.EARTH, 1)); // the pedestal
  pm.hline(5, 12, 8, stone);
  // the mask
  pm.contour(9, 2, [3, 4, 5, 5, 5, 5, 4, 4, 3], stone);
  pm.hline(7, 3, 5, px(RAMP.EARTH, 3));
  pm.rect(6, 5, 2, 2, lit ? px(RAMP.MAGENTA, 3) : C.outline);
  pm.rect(11, 5, 2, 2, lit ? px(RAMP.MAGENTA, 3) : C.outline);
  pm.hline(7, 9, 5, C.outline); // the set mouth
  pm.finish({ aa: false }); // ADR-101
  if (lit) {
    pm.set(4, 3, px(RAMP.MAGENTA, 2)); // the hum — light after outline
    pm.set(14, 3, px(RAMP.MAGENTA, 2));
  }
  pm.shadowUnder(9, 20, 6, C.inkSoft);
  return pm;
}

/** a museum pedestal carrying one ALMOST-gold idol (four variants) */
export function drawPedestal(variant: number): Pixmap {
  const pm = new Pixmap(22, 30);
  pm.rect(4, 16, 14, 12, px(RAMP.PAPER, 2)); // the plinth
  pm.hline(4, 16, 14, px(RAMP.PAPER, 3));
  pm.vline(17, 16, 12, px(RAMP.PAPER, 1));
  pm.hline(5, 27, 12, px(RAMP.PAPER, 0));
  const fake = px(RAMP.GOLD, 1); // not-quite gold — the whole museum's point
  switch (variant % 4) {
    case 0: // the squat grinner (a tourist made this)
      pm.contour(11, 6, [2, 3, 4, 4, 4, 4, 3], fake);
      pm.hline(9, 10, 5, C.outline);
      pm.set(9, 8, C.outline);
      pm.set(13, 8, C.outline);
      break;
    case 1: // the tall thin one (clearly a candlestick)
      pm.rect(9, 4, 4, 12, fake);
      pm.hline(9, 4, 4, px(RAMP.GOLD, 2));
      pm.set(10, 7, C.outline);
      break;
    case 2: // the llama-shaped one (suspiciously good)
      pm.rect(7, 9, 9, 5, fake);
      pm.rect(13, 4, 3, 6, fake);
      pm.vline(8, 14, 2, fake);
      pm.vline(14, 14, 2, fake);
      pm.set(14, 5, C.outline);
      break;
    default: // the abstract one (the plaque insists)
      pm.contour(11, 5, [1, 2, 3, 2, 3, 2, 1], fake);
      pm.set(11, 8, px(RAMP.GOLD, 2));
      break;
  }
  pm.finish({ aa: false }); // ADR-101
  pm.shadowUnder(11, 28, 7, C.inkSoft);
  return pm;
}

/** deck cargo — one honest crate (banana variant stencils the truth) */
export function drawCrate(bananas: boolean): Pixmap {
  const pm = new Pixmap(20, 18);
  pm.rect(1, 3, 18, 14, px(RAMP.EARTH, 2));
  pm.frame(1, 3, 18, 14, px(RAMP.EARTH, 0));
  pm.hline(2, 4, 16, px(RAMP.EARTH, 3));
  pm.vline(10, 3, 14, px(RAMP.EARTH, 1));
  pm.hline(1, 10, 18, px(RAMP.EARTH, 1));
  if (bananas) {
    pm.hline(4, 1, 6, px(RAMP.GOLD, 2)); // the cargo, overflowing
    pm.set(5, 0, px(RAMP.GOLD, 3));
    pm.set(8, 0, px(RAMP.GOLD, 3));
    pm.hline(6, 7, 4, px(RAMP.GOLD, 1)); // the stencil
  } else {
    pm.hline(5, 7, 8, px(RAMP.RED, 1)); // FRAGIL, in spirit
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the gangplank onto the boat (walkable visual — no solid) */
export function drawGangplank(): Pixmap {
  const pm = new Pixmap(24, 20);
  pm.rect(2, 2, 20, 16, px(RAMP.EARTH, 2));
  pm.hline(2, 6, 20, px(RAMP.EARTH, 1));
  pm.hline(2, 11, 20, px(RAMP.EARTH, 1));
  pm.hline(2, 15, 20, px(RAMP.EARTH, 1));
  pm.hline(2, 3, 20, px(RAMP.EARTH, 3));
  pm.vline(2, 2, 16, px(RAMP.EARTH, 3));
  pm.vline(21, 2, 16, px(RAMP.EARTH, 0));
  return pm;
}

/**
 * The llama, on the S7c dog sheet contract: [E, E-step, W, W-step],
 * 20×20 frames. Wool reads cream with one EARTH saddle patch; the §A10 #5
 * personalities live in dialogue, not pixels — except the ear angle,
 * which is personality enough.
 */
export function generateLlamaFrames(): Pixmap[] {
  const wool = px(RAMP.PAPER, 3);
  const woolSh = px(RAMP.PAPER, 2);
  const saddle = px(RAMP.EARTH, 2);
  const make = (step: boolean): Pixmap => {
    const pm = new Pixmap(20, 20);
    // body — a woolly loaf, hand-run
    pm.contour(9, 8, [4, 6, 6, 6, 6, 5], wool);
    pm.rect(6, 10, 7, 3, woolSh); // belly shade
    pm.rect(9, 8, 4, 3, saddle); // the saddle patch (one, deliberate)
    pm.set(10, 8, px(RAMP.EARTH, 3));
    // the neck + head, periscope-confident
    pm.rect(13, 2, 3, 8, wool);
    pm.vline(13, 2, 8, px(RAMP.PAPER, 3));
    pm.contour(15, 0, [1, 2, 2], wool);
    pm.set(17, 1, C.outline); // the eye (it has seen your plans)
    pm.set(14, 0, wool); // ears
    pm.set(16, 0, wool);
    pm.set(18, 2, px(RAMP.EARTH, 1)); // the muzzle
    // legs — stilts; the step frame swings them
    if (step) {
      pm.vline(5, 13, 5, woolSh);
      pm.vline(8, 14, 4, wool);
      pm.vline(11, 13, 5, woolSh);
      pm.vline(13, 14, 4, wool);
    } else {
      pm.vline(6, 13, 5, wool);
      pm.vline(9, 13, 5, woolSh);
      pm.vline(10, 13, 5, wool);
      pm.vline(13, 13, 5, woolSh);
    }
    pm.line(4, 8, 3, 10, woolSh); // the tail puff
    pm.finish(); // ADR-101
    pm.shadowUnder(9, 18, 7, C.inkSoft);
    return pm;
  };
  const east = make(false);
  const eastStep = make(true);
  return [east, eastStep, east.flipX(), eastStep.flipX()];
}
