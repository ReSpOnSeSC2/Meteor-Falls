/**
 * ARCADE LEGEND cabinet-screen sprites (S10, §A10 #4) — what the CRT shows,
 * not what the world shows: CRT-bright, shadowless (they float on phosphor
 * the way battle sprites float on psychedelia — ADR-020 rule 5), hand-set
 * pixels under the anti-generation rules. Palette-by-construction as ever.
 */
import { Pixmap } from './pixmap';
import { RAMP, px, C } from '../palette';

/** the player's ride: a bottle rocket flying right, EB's finest ordnance */
export function drawArcadeShip(): Pixmap {
  const pm = new Pixmap(16, 9);
  // stick tail
  pm.hline(1, 4, 4, px(RAMP.EARTH, 2));
  pm.set(1, 4, px(RAMP.EARTH, 1));
  // body tube
  pm.rect(5, 2, 7, 5, px(RAMP.PAPER, 2));
  pm.hline(5, 2, 7, px(RAMP.PAPER, 3));
  pm.hline(5, 6, 7, px(RAMP.PAPER, 1));
  pm.vline(7, 2, 5, px(RAMP.RED, 2)); // the proud stripe
  // nose cone
  pm.vline(12, 3, 3, px(RAMP.RED, 2));
  pm.set(13, 4, px(RAMP.RED, 3));
  pm.set(14, 4, px(RAMP.RED, 2));
  // fuse spark riding along
  pm.set(3, 3, px(RAMP.GOLD, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** MOON MOTH — flies like it owes the moon money */
export function drawArcadeMoth(): Pixmap {
  const pm = new Pixmap(11, 9);
  // wings: two soft cream lobes, beating out of phase forever
  pm.rect(1, 1, 4, 3, px(RAMP.PAPER, 2));
  pm.set(1, 1, px(RAMP.PAPER, 3));
  pm.rect(1, 5, 4, 3, px(RAMP.PAPER, 1));
  // body
  pm.rect(5, 3, 4, 3, px(RAMP.NIGHT, 2));
  pm.hline(5, 3, 4, px(RAMP.NIGHT, 3));
  // one enormous moon-struck eye
  pm.set(8, 4, px(RAMP.GOLD, 3));
  // antennae, optimistic
  pm.set(9, 2, px(RAMP.NIGHT, 3));
  pm.set(10, 1, px(RAMP.NIGHT, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** GRUMBLE ROCK — a rock that read one book about attitude (2 hits) */
export function drawArcadeRock(): Pixmap {
  const pm = new Pixmap(13, 11);
  pm.contour(6, 1, [2, 4, 5, 5, 5, 5, 5, 4, 2], px(RAMP.EARTH, 2));
  // re-tone: lit crown, shaded jaw
  pm.hline(4, 2, 4, px(RAMP.EARTH, 3));
  pm.rect(2, 6, 8, 3, px(RAMP.EARTH, 1));
  // the brow. THE brow.
  pm.hline(3, 4, 3, px(RAMP.INK, 0));
  pm.hline(7, 4, 3, px(RAMP.INK, 0));
  pm.set(4, 5, px(RAMP.PAPER, 3)); // glint of judgement
  pm.set(8, 5, px(RAMP.PAPER, 3));
  pm.hline(5, 8, 3, px(RAMP.INK, 0)); // the frown, load-bearing
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** SAUCER SALESMAN — uninvited, unstoppable, uninsured */
export function drawArcadeSaucer(): Pixmap {
  const pm = new Pixmap(14, 9);
  // glass dome with somebody in there
  pm.rect(5, 1, 4, 3, px(RAMP.CYAN, 2));
  pm.set(5, 1, px(RAMP.CYAN, 3));
  pm.set(7, 2, px(RAMP.GRASS, 2)); // the salesman, mid-pitch
  // disc
  pm.rect(1, 4, 12, 3, px(RAMP.PAPER, 2));
  pm.hline(1, 4, 12, px(RAMP.PAPER, 3));
  pm.hline(2, 6, 10, px(RAMP.PAPER, 0));
  // running lights — one is the tie. it's a tie.
  pm.set(3, 5, px(RAMP.GOLD, 3));
  pm.set(7, 5, px(RAMP.RED, 2));
  pm.set(11, 5, px(RAMP.GOLD, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** the corn dog cameo — eat it (+300) or live with yourself */
export function drawArcadeCorndog(): Pixmap {
  const pm = new Pixmap(15, 7);
  pm.hline(1, 3, 4, px(RAMP.EARTH, 2)); // stick
  // golden batter, slightly lit on top
  pm.rect(5, 1, 9, 5, px(RAMP.GOLD, 2));
  pm.hline(6, 1, 7, px(RAMP.GOLD, 3));
  pm.hline(6, 5, 7, px(RAMP.GOLD, 1));
  pm.set(13, 2, px(RAMP.GOLD, 3));
  // mustard, applied with conviction
  pm.set(7, 2, px(RAMP.ORANGE, 2));
  pm.set(9, 3, px(RAMP.ORANGE, 2));
  pm.set(11, 2, px(RAMP.ORANGE, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

/** player shots: a hot little bolt */
export function drawArcadeBolt(): Pixmap {
  const pm = new Pixmap(5, 3);
  pm.hline(0, 1, 4, px(RAMP.GOLD, 3));
  pm.set(4, 1, C.white);
  pm.set(1, 0, px(RAMP.GOLD, 2));
  pm.set(1, 2, px(RAMP.GOLD, 2));
  return pm;
}

/** 2×4 scanline pattern — tiled over the CRT at low alpha for the glass */
export function drawScanline(): Pixmap {
  const pm = new Pixmap(2, 4);
  pm.hline(0, 2, 2, px(RAMP.INK, 0));
  return pm;
}
