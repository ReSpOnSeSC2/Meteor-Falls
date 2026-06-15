/**
 * COSTA ESTRELLA LINKS — golfer sheets + the course paint (S13, ADR-037).
 * GOLFER sheets are CUT FROM THE S12 SPORT-SHEET CONTRACT (ADR-033): 32×40
 * frames authored FACING RIGHT off the SAME CharacterSpec — the head is
 * literally athletes.ts's drawProfileHead. ADR-020's six rules bind all of
 * it: flat surfaces, deliberate marks, shadows/light never outlined, one
 * dither seam, repetition breaks.
 *
 * GOLF_FRAME is the contract (tests pin count + names): address · backswing
 * ×2 (the power tick rides backB) · strike · follow-through ×2 · fist-pump ·
 * the universal sad putter slump ×2 · putt address · putt strike — 11.
 */
import { Pixmap } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { TILE, HOLES, expandGrid, type HoleDef, type Terrain } from '../links/course';
import { drawProfileHead, ATHLETE_W, ATHLETE_H } from './athletes';
import { isKid, type CharacterSpec } from './characters';

export const GOLF_FRAME = {
  address: 0,
  backA: 1,
  backB: 2,
  strike: 3,
  followA: 4,
  followB: 5,
  fistpump: 6,
  slumpA: 7,
  slumpB: 8,
  puttAddress: 9,
  puttStrike: 10,
} as const;
export type GolfFrameName = keyof typeof GOLF_FRAME;
export const GOLF_FRAME_COUNT = 11;

type Swing = 'address' | 'backA' | 'backB' | 'strike' | 'followA' | 'followB' | 'pump' | 'slumpA' | 'slumpB' | 'puttAddress' | 'puttStrike';

function drawGolferFrame(spec: CharacterSpec, pose: Swing): Pixmap {
  const pm = new Pixmap(ATHLETE_W, ATHLETE_H);
  const skin = px(spec.skin, 2);
  const skinD = px(spec.skin, 1);
  const kid = isKid(spec);
  const slump = pose === 'slumpA' || pose === 'slumpB';

  // the figure: head + torso + golf stance, all right-facing (the ball sits
  // off-canvas right; the scene owns it)
  const lean = pose === 'backB' ? -1 : pose === 'strike' ? 2 : pose === 'followB' ? 1 : slump ? 2 : 0;
  const hy = (slump ? 5 : 2) + (pose === 'pump' ? -1 : 0);
  const hx = 8 + lean;
  const torsoTop = hy + 13;
  const torsoH = 8;
  const torsoBot = torsoTop + torsoH;
  const tw = 11;
  const tx = 9;

  /* ---- legs: the golf stance is planted; the slump folds them ---- */
  const pants = px(spec.bottom.ramp, 2);
  const shoe = px(spec.shoes, 1);
  const sole = px(RAMP.PAPER, 2);
  const sock = px(RAMP.PAPER, 3);
  const shorts = kid && !spec.longPants;
  const legTop = torsoBot + 1;
  const floor = 38;
  const leg = (x: number, bend: number, back: boolean): void => {
    const y1 = floor - 3 - bend;
    const knee = legTop + Math.floor((y1 - legTop) * 0.55);
    pm.rect(x, legTop, 3, knee - legTop, back && shorts ? skinD : pants);
    pm.rect(x + (bend > 0 ? 1 : 0), knee, 3, y1 - knee, shorts ? (back ? skinD : skin) : pants);
    if (spec.socks ?? kid) pm.rect(x + (bend > 0 ? 1 : 0), y1, 3, 2, back ? px(RAMP.PAPER, 2) : sock);
    pm.rect(x + (bend > 0 ? 1 : 0), y1 + 2, 4, 2, back ? px(spec.shoes, 0) : shoe);
    pm.hline(x + (bend > 0 ? 1 : 0), y1 + 4, 4, sole);
  };
  if (slump) {
    leg(10, 4, true);
    leg(15, 4, false);
  } else if (pose === 'pump') {
    leg(10, 0, true);
    leg(15, 2, false);
  } else {
    leg(9, 1, true); // the planted golf base, slightly open
    leg(16, 1, false);
  }

  /* ---- torso (canon clothes — heroes golf as themselves) ---- */
  const topRamp = spec.top.ramp;
  pm.rect(tx, torsoTop, tw, torsoH, px(topRamp, 2));
  pm.vline(tx, torsoTop, torsoH, px(topRamp, 3));
  pm.vline(tx + tw - 1, torsoTop + 1, torsoH - 1, px(topRamp, 1));
  pm.hline(tx, torsoBot - 1, tw, px(topRamp, 1));
  pm.set(tx, torsoTop, T);
  pm.set(tx + tw - 1, torsoTop, T);

  /* ---- arms + THE CLUB (one line of steel; putter is shorter) ---- */
  const club = px(RAMP.PAPER, 1);
  const clubHead = px(RAMP.PAPER, 0);
  const shL = { x: tx + 1, y: torsoTop + 1 };
  const shR = { x: tx + tw - 2, y: torsoTop + 1 };
  const arm = (x0: number, y0: number, x1: number, y1: number, back: boolean): void => {
    pm.line(x0, y0, x1, y1, back ? skinD : skin);
    pm.line(x0 + 1, y0, x1 + 1, y1, back ? skinD : skin);
    pm.rect(x1 - 1, y1, 3, 2, back ? skinD : skin);
  };
  switch (pose) {
    case 'address': {
      // hands meet low over the ball, club to the turf
      arm(shL.x, shL.y, tx + 6, torsoBot + 3, true);
      arm(shR.x, shR.y, tx + 7, torsoBot + 3, false);
      pm.line(tx + 8, torsoBot + 4, tx + 13, floor - 1, club);
      pm.rect(tx + 12, floor - 2, 3, 2, clubHead);
      break;
    }
    case 'backA': {
      // half back: hands at the hip, club 45° behind
      arm(shL.x, shL.y, tx + 2, torsoTop + 5, true);
      arm(shR.x, shR.y, tx + 3, torsoTop + 5, false);
      pm.line(tx + 2, torsoTop + 5, tx - 4, torsoTop - 2, club);
      pm.rect(tx - 6, torsoTop - 4, 3, 2, clubHead);
      break;
    }
    case 'backB': {
      // full coil: hands high behind the head, club across the sky —
      // the POWER TICK frame (the meter's second tap reads off this)
      arm(shL.x, shL.y, hx + 1, hy - 2, true);
      arm(shR.x, shR.y, hx + 2, hy - 3, false);
      pm.line(hx + 2, hy - 4, hx - 5, hy - 8, club);
      pm.rect(hx - 7, hy - 9, 3, 2, clubHead);
      break;
    }
    case 'strike': {
      // impact: arms extended down the line, shaft a blur at the turf
      arm(shL.x, shL.y, tx + 8, torsoBot + 4, true);
      arm(shR.x, shR.y, tx + 9, torsoBot + 4, false);
      pm.line(tx + 10, torsoBot + 5, tx + 15, floor - 1, club);
      pm.rect(tx + 14, floor - 2, 3, 2, clubHead);
      pm.set(tx + 13, floor - 3, px(RAMP.PAPER, 3)); // the flash off the face
      break;
    }
    case 'followA': {
      // the wrap begins: hands crossing high left
      arm(shL.x, shL.y, hx - 1, hy + 2, true);
      arm(shR.x, shR.y, hx, hy + 1, false);
      pm.line(hx, hy + 1, hx - 5, hy - 4, club);
      pm.rect(hx - 7, hy - 5, 3, 2, clubHead);
      break;
    }
    case 'followB': {
      // the held finish, watching it fly (chin up is the lean)
      arm(shL.x, shL.y, hx, hy - 1, true);
      arm(shR.x, shR.y, hx + 1, hy - 2, false);
      pm.line(hx + 1, hy - 3, hx - 3, hy - 9, club);
      pm.rect(hx - 5, hy - 10, 3, 2, clubHead);
      break;
    }
    case 'pump': {
      // the fist-pump (mouth handled by head call)
      arm(shL.x, shL.y, shL.x - 3, shL.y + 5, true);
      pm.line(shR.x, shR.y, shR.x + 3, hy - 4, skin);
      pm.line(shR.x + 1, shR.y, shR.x + 4, hy - 4, skin);
      pm.rect(shR.x + 3, hy - 6, 3, 3, skin); // the fist
      break;
    }
    case 'slumpA':
    case 'slumpB': {
      // the universal sad putter slump: shoulders down, putter as a cane
      arm(shL.x, shL.y + 1, shL.x - 2, torsoBot + 2, true);
      arm(shR.x, shR.y + 1, shR.x + 2, torsoBot + (pose === 'slumpB' ? 4 : 3), false);
      pm.line(shR.x + 3, torsoBot + 4, shR.x + 4, floor - 1, club);
      pm.rect(shR.x + 3, floor - 2, 3, 2, clubHead);
      break;
    }
    case 'puttAddress': {
      arm(shL.x, shL.y, tx + 6, torsoBot + 2, true);
      arm(shR.x, shR.y, tx + 7, torsoBot + 2, false);
      pm.line(tx + 8, torsoBot + 3, tx + 10, floor - 1, club);
      pm.rect(tx + 9, floor - 2, 4, 2, clubHead); // the flat blade
      break;
    }
    case 'puttStrike': {
      arm(shL.x, shL.y, tx + 8, torsoBot + 2, true);
      arm(shR.x, shR.y, tx + 9, torsoBot + 2, false);
      pm.line(tx + 10, torsoBot + 3, tx + 13, floor - 1, club);
      pm.rect(tx + 12, floor - 2, 4, 2, clubHead);
      break;
    }
  }

  /* ---- the head (the SAME head, ADR-033 contract) ---- */
  drawProfileHead(pm, spec, hx, hy, torsoTop, pose === 'pump', false);
  // the slump hangs the head: a hint of brow shadow under the hair
  if (slump) pm.hline(hx + 9, hy + 4, 3, skinD);

  pm.finish(); // ADR-101
  return pm;
}

/** the 11-frame GOLF SHEET for one spec */
export function generateGolferFrames(spec: CharacterSpec): Pixmap[] {
  const poses: Swing[] = ['address', 'backA', 'backB', 'strike', 'followA', 'followB', 'pump', 'slumpA', 'slumpB', 'puttAddress', 'puttStrike'];
  return poses.map((p) => drawGolferFrame(spec, p));
}

/* ================= the course paint (the ground IS the rules) ============ */

const SURF_EDGE = px(RAMP.PAPER, 3);

/**
 * One hole's ground texture: flat deliberate surfaces per ADR-020 — water
 * with a hand of surf lines at every coast, cliff rock with a lit cap,
 * fairway in WIDE mow bands (rule 4: the band period breaks at the green),
 * plugged-warm sand, rough kept dark and quiet, the green pale with its
 * fringe. The slope arrows and pin are stamped by drawGreenDressing so the
 * HUD truth lives beside the paint.
 */
export function drawHoleTexture(hole: HoleDef): Pixmap {
  const grid = expandGrid(hole.rle);
  const W = grid[0].length * TILE;
  const H = grid.length * TILE;
  const pm = new Pixmap(W, H);
  const at = (tx: number, ty: number): Terrain => (grid[ty]?.[tx] ?? 'W') as Terrain;
  for (let ty = 0; ty < grid.length; ty++) {
    for (let tx = 0; tx < grid[0].length; tx++) {
      const t = at(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      switch (t) {
        case 'W': {
          pm.rect(x, y, TILE, TILE, px(RAMP.BLUE, 1));
          // one deliberate swell line per tile row pair — never noise
          if (ty % 2 === 0) pm.hline(x + 3, y + 9, 7, px(RAMP.BLUE, 2));
          break;
        }
        case 'C': {
          pm.rect(x, y, TILE, TILE, px(RAMP.EARTH, 1));
          pm.hline(x, y, TILE, px(RAMP.EARTH, 2)); // the lit cap
          if ((tx + ty) % 3 === 0) pm.rect(x + 4, y + 6, 5, 3, px(RAMP.EARTH, 0)); // a shadowed face
          break;
        }
        case 'R':
          pm.rect(x, y, TILE, TILE, px(RAMP.FOREST, 1));
          break;
        case 'F':
        case 'T': {
          // WIDE mow bands, two tiles a stripe
          const band = Math.floor(ty / 2) % 2 === 0;
          pm.rect(x, y, TILE, TILE, px(RAMP.GRASS, band ? 2 : 1));
          break;
        }
        case 'S':
          pm.rect(x, y, TILE, TILE, px(RAMP.PAPER, 2));
          pm.set(x + 4, y + 10, px(RAMP.PAPER, 1)); // one deliberate footprint pock
          break;
        case 'G':
          pm.rect(x, y, TILE, TILE, px(RAMP.GRASS, 3));
          break;
      }
    }
  }
  // edges drawn AFTER the fills: surf foam where water meets anything dry,
  // fringe where green meets not-green (deliberate 1px reads, rule 1)
  for (let ty = 0; ty < grid.length; ty++) {
    for (let tx = 0; tx < grid[0].length; tx++) {
      const t = at(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (t !== 'W') {
        if (at(tx, ty - 1) === 'W') pm.hline(x, y, TILE, SURF_EDGE);
        if (at(tx, ty + 1) === 'W') pm.hline(x, y + TILE - 1, TILE, SURF_EDGE);
        if (at(tx - 1, ty) === 'W') pm.vline(x, y, TILE, SURF_EDGE);
        if (at(tx + 1, ty) === 'W') pm.vline(x + TILE - 1, y, TILE, SURF_EDGE);
      }
      if (t === 'G') {
        const fr = px(RAMP.GRASS, 2);
        if (at(tx, ty - 1) !== 'G') pm.hline(x, y, TILE, fr);
        if (at(tx, ty + 1) !== 'G') pm.hline(x, y + TILE - 1, TILE, fr);
        if (at(tx - 1, ty) !== 'G') pm.vline(x, y, TILE, fr);
        if (at(tx + 1, ty) !== 'G') pm.vline(x + TILE - 1, y, TILE, fr);
      }
      if (t === 'T') {
        // tee markers: two deliberate dots astride the teeing line
        pm.rect(x + 2, y + 7, 2, 2, px(RAMP.RED, 2));
        pm.rect(x + TILE - 4, y + 7, 2, 2, px(RAMP.RED, 2));
      }
    }
  }
  // THE SLOPE ARROWS — drawn from hole.slope EXACTLY (the honest grid):
  // three arrows on the green pointing where a ball will drift
  const len = Math.hypot(hole.slope.x, hole.slope.y);
  if (len > 0.01) {
    const nx = hole.slope.x / len;
    const ny = hole.slope.y / len;
    const arrowAt = (ax: number, ay: number): void => {
      const x1 = Math.round(ax + nx * 6);
      const y1 = Math.round(ay + ny * 6);
      pm.line(Math.round(ax - nx * 4), Math.round(ay - ny * 4), x1, y1, px(RAMP.CYAN, 1));
      pm.set(x1 + Math.round(-ny), y1 + Math.round(nx), px(RAMP.CYAN, 1));
      pm.set(x1 - Math.round(-ny), y1 - Math.round(nx), px(RAMP.CYAN, 1));
    };
    arrowAt(hole.pin.x - 14, hole.pin.y + 8);
    arrowAt(hole.pin.x + 12, hole.pin.y - 6);
    arrowAt(hole.pin.x - 4, hole.pin.y + 18);
  }
  // the cup
  pm.rect(Math.round(hole.pin.x) - 2, Math.round(hole.pin.y) - 1, 4, 3, px(RAMP.INK, 0));
  return pm;
}

/** the pin flag (the scene plants it at the cup; it leans with the wind) */
export function drawPinFlag(): Pixmap {
  const pm = new Pixmap(12, 22);
  pm.vline(2, 2, 19, px(RAMP.PAPER, 1)); // the stick
  pm.rect(3, 2, 7, 5, px(RAMP.RED, 2)); // the flag
  pm.rect(3, 2, 7, 1, px(RAMP.RED, 3));
  pm.set(9, 6, T);
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the ball (4×4 — the camera rides this) */
export function drawGolfBall(): Pixmap {
  const pm = new Pixmap(5, 5);
  pm.rect(1, 0, 3, 5, C.white);
  pm.rect(0, 1, 5, 3, C.white);
  pm.set(1, 1, px(RAMP.PAPER, 3));
  pm.set(3, 3, px(RAMP.PAPER, 2));
  pm.finish(); // ADR-101
  return pm;
}

/** splash frames (the surf accepts your offering) — light, never outlined */
export function drawSplashFrames(): Pixmap[] {
  const a = new Pixmap(16, 12);
  a.hline(5, 8, 6, px(RAMP.CYAN, 3));
  a.set(4, 6, px(RAMP.CYAN, 3));
  a.set(11, 6, px(RAMP.CYAN, 3));
  const b = new Pixmap(16, 12);
  b.hline(3, 7, 10, px(RAMP.CYAN, 2));
  b.set(2, 3, px(RAMP.CYAN, 3));
  b.set(13, 4, px(RAMP.CYAN, 3));
  b.set(7, 1, px(RAMP.PAPER, 3));
  b.set(9, 2, px(RAMP.CYAN, 3));
  return [a, b];
}

/** sand burst frames (dune restoration in progress) */
export function drawSandFrames(): Pixmap[] {
  const a = new Pixmap(14, 10);
  a.hline(4, 7, 6, px(RAMP.PAPER, 2));
  a.set(3, 5, px(RAMP.PAPER, 3));
  a.set(10, 4, px(RAMP.PAPER, 3));
  const b = new Pixmap(14, 10);
  b.hline(2, 6, 10, px(RAMP.PAPER, 1));
  b.set(4, 2, px(RAMP.PAPER, 3));
  b.set(9, 1, px(RAMP.PAPER, 2));
  return [a, b];
}

/**
 * The Brickton travel poster (the S13 tease): a framed clifftop sunset —
 * sea bands, the stack, one gull. Placed on a fresh rng stream so the 1995
 * layout stays byte-identical (ADR-016's rule, third application).
 */
export function drawLinksPoster(): Pixmap {
  const pm = new Pixmap(20, 26);
  pm.rect(0, 0, 20, 26, px(RAMP.EARTH, 1)); // the frame
  pm.rect(2, 2, 16, 22, px(RAMP.GOLD, 3)); // sunset sky
  pm.rect(2, 12, 16, 5, px(RAMP.ORANGE, 2)); // the low sun band
  pm.rect(2, 17, 16, 7, px(RAMP.BLUE, 1)); // the sea
  pm.hline(2, 17, 16, px(RAMP.PAPER, 3)); // the surf line
  pm.rect(13, 9, 3, 8, px(RAMP.EARTH, 1)); // the sea stack
  pm.hline(13, 9, 3, px(RAMP.EARTH, 2));
  pm.set(6, 6, C.outline); // one gull
  pm.set(7, 5, C.outline);
  pm.set(8, 6, C.outline);
  pm.hline(4, 21, 12, px(RAMP.PAPER, 3)); // the caption strip
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** every hole pre-painted (eighteen textures, generated once at scene create) */
export function allHoleTextures(): Array<{ id: string; pm: Pixmap }> {
  return HOLES.map((h) => ({ id: `links_${h.id}`, pm: drawHoleTexture(h) }));
}
