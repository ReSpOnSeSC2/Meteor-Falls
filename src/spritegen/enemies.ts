/**
 * Enemy sprite generators — GAME_BIBLE §A7 Chapter 1 roster + Boss 1.
 * Battle sprites are bespoke (EB enemies are static portraits; hit-flash and
 * idle-bob happen at runtime). Each enemy also gets a 16×16 overworld mini.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, T, px, C } from '../palette';

/* ---------------------------------------------------------------- */
/* Battle sprites                                                     */

export function drawCrankyMailbox(): Pixmap {
  const pm = new Pixmap(44, 52);
  const blue = px(RAMP.BLUE, 2);
  const blueD = px(RAMP.BLUE, 1);
  const blueDD = px(RAMP.BLUE, 0);
  // rounded mailbox body
  pm.rect(8, 10, 28, 20, blue);
  pm.rect(8, 6, 28, 6, blue);
  for (let i = 0; i < 4; i++) {
    pm.hline(8 + i, 6 - 0, 1, T);
  }
  pm.set(8, 6, T);
  pm.set(35, 6, T);
  pm.hline(9, 5, 26, blue);
  pm.hline(10, 4, 24, px(RAMP.BLUE, 3));
  pm.rect(8, 28, 28, 2, blueD);
  // angry uni-brow eyes
  pm.rect(13, 12, 4, 4, C.white);
  pm.rect(26, 12, 4, 4, C.white);
  pm.rect(14, 14, 2, 2, C.outline);
  pm.rect(27, 14, 2, 2, C.outline);
  pm.line(11, 10, 17, 12, C.outline);
  pm.line(31, 10, 25, 12, C.outline);
  // open slot mouth, mid-yell, with a letter sticking out
  pm.rect(13, 21, 18, 5, blueDD);
  pm.rect(14, 22, 16, 3, C.outline);
  pm.rect(17, 22, 8, 2, C.white); // the letter
  pm.set(18, 23, px(RAMP.RED, 2)); // stamp
  // flag arm raised in fury
  pm.vline(36, 8, 10, px(RAMP.RED, 1));
  pm.rect(36, 6, 6, 4, px(RAMP.RED, 2));
  // post
  pm.rect(19, 30, 6, 16, px(RAMP.EARTH, 1));
  pm.vline(19, 30, 16, px(RAMP.EARTH, 0));
  pm.rect(15, 46, 14, 3, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawRunawayLawnmower(): Pixmap {
  const pm = new Pixmap(52, 44);
  const red = px(RAMP.RED, 2);
  const redD = px(RAMP.RED, 1);
  // deck
  pm.rect(8, 22, 30, 10, red);
  pm.rect(8, 20, 30, 3, px(RAMP.RED, 3));
  pm.rect(8, 30, 30, 2, redD);
  // engine block
  pm.rect(14, 12, 14, 10, px(RAMP.PAPER, 1));
  pm.rect(14, 12, 14, 3, px(RAMP.PAPER, 2));
  pm.rect(18, 8, 6, 5, px(RAMP.PAPER, 0));
  // crazed eye on the engine
  pm.rect(20, 14, 6, 6, C.white);
  pm.rect(22, 16, 2, 3, C.outline);
  // handle flailing back
  pm.line(38, 22, 48, 8, px(RAMP.PAPER, 0));
  pm.line(39, 23, 49, 9, px(RAMP.PAPER, 0));
  pm.rect(46, 6, 5, 3, px(RAMP.PAPER, 0));
  // wheels
  const wheel = (cx: number, cy: number): void => {
    pm.ellipse(cx, cy, 5, 5, C.inkSoft);
    pm.ellipse(cx, cy, 2, 2, px(RAMP.PAPER, 1));
  };
  wheel(13, 35);
  wheel(33, 35);
  // grass spray
  const g = px(RAMP.GRASS, 2);
  pm.set(4, 18, g);
  pm.set(2, 22, g);
  pm.set(5, 25, px(RAMP.GRASS, 1));
  pm.set(3, 14, px(RAMP.GRASS, 3));
  pm.set(6, 11, g);
  pm.outline(C.outline);
  return pm;
}

export function drawCoilyCicada(): Pixmap {
  const pm = new Pixmap(48, 44);
  const shell = px(RAMP.FOREST, 2);
  const shellD = px(RAMP.FOREST, 1);
  const wing = px(RAMP.CYAN, 3);
  // coiled abdomen — the "Coily" part: segmented spring
  pm.ellipse(15, 28, 10, 8, shell);
  pm.ellipse(15, 28, 6, 5, shellD);
  pm.ellipse(15, 28, 3, 2, shell);
  // thorax + head
  pm.ellipse(31, 22, 8, 7, shell);
  pm.ellipse(38, 18, 5, 5, px(RAMP.FOREST, 3));
  // huge red eyes
  pm.ellipse(40, 15, 3, 3, px(RAMP.RED, 2));
  pm.set(41, 14, px(RAMP.RED, 3));
  pm.set(40, 16, C.outline);
  // wings swept back
  pm.line(28, 16, 10, 6, wing);
  pm.line(29, 17, 12, 8, wing);
  pm.line(30, 18, 14, 10, px(RAMP.CYAN, 2));
  pm.ellipse(20, 12, 9, 4, wing);
  pm.ellipse(20, 12, 9, 4, wing);
  for (let x = 12; x <= 28; x += 4) pm.set(x, 12, px(RAMP.CYAN, 2));
  // legs
  pm.line(28, 28, 24, 36, shellD);
  pm.line(33, 28, 33, 37, shellD);
  pm.line(37, 26, 41, 34, shellD);
  // antenna coil
  pm.line(42, 12, 45, 8, shellD);
  pm.set(46, 7, shellD);
  pm.outline(C.outline);
  return pm;
}

export function drawBlazerSmiler(): Pixmap {
  const pm = new Pixmap(40, 56);
  const suit = px(RAMP.BLUE, 1);
  const suitL = px(RAMP.BLUE, 2);
  const skin = px(RAMP.SKIN, 2);
  // head — too round, too happy
  pm.ellipse(20, 13, 9, 9, skin);
  pm.rect(12, 5, 17, 3, px(RAMP.INK, 1)); // flat corporate hair
  pm.hline(13, 4, 15, px(RAMP.INK, 1));
  // dead-cheerful eyes: tall whites, pinprick pupils
  pm.rect(14, 10, 4, 5, C.white);
  pm.rect(23, 10, 4, 5, C.white);
  pm.set(15, 12, C.outline);
  pm.set(24, 12, C.outline);
  // THE GRIN — wall to wall teeth
  pm.rect(12, 17, 17, 5, C.white);
  pm.frame(12, 17, 17, 5, C.outline);
  for (let x = 14; x < 28; x += 3) pm.vline(x, 18, 3, px(RAMP.PAPER, 1));
  // blazer torso
  pm.rect(10, 24, 21, 22, suit);
  pm.rect(10, 24, 3, 22, suitL);
  pm.rect(28, 24, 3, 22, suitL);
  // shirt + tie
  pm.rect(17, 24, 7, 10, C.white);
  pm.rect(19, 25, 3, 9, px(RAMP.RED, 2));
  pm.set(20, 34, px(RAMP.RED, 1));
  // name badge: a tiny smile
  pm.rect(13, 28, 4, 4, C.white);
  pm.set(14, 30, C.outline);
  pm.set(15, 30, C.outline);
  // arms — one extended for an unwanted handshake
  pm.rect(31, 26, 7, 4, suit);
  pm.rect(36, 27, 3, 3, skin);
  pm.rect(7, 26, 3, 12, suit);
  pm.rect(7, 38, 3, 3, skin);
  // slacks
  pm.rect(13, 46, 6, 8, px(RAMP.INK, 1));
  pm.rect(22, 46, 6, 8, px(RAMP.INK, 1));
  pm.rect(12, 53, 8, 2, C.outline);
  pm.rect(21, 53, 8, 2, C.outline);
  pm.outline(C.outline);
  return pm;
}

export function drawPigeonGang(): Pixmap {
  const pm = new Pixmap(52, 40);
  const grey = px(RAMP.PAPER, 1);
  const greyD = px(RAMP.PAPER, 0);
  const sheen = px(RAMP.CYAN, 2);
  const pigeon = (cx: number, cy: number, boss: boolean): void => {
    pm.ellipse(cx, cy, 7, 6, grey);
    pm.ellipse(cx + 5, cy - 6, 4, 4, grey);
    pm.rect(cx + 2, cy - 4, 4, 3, sheen); // neck sheen
    pm.set(cx + 8, cy - 7, px(RAMP.GOLD, 2)); // beak
    pm.set(cx + 9, cy - 7, px(RAMP.GOLD, 2));
    pm.set(cx + 6, cy - 8, boss ? px(RAMP.RED, 2) : C.outline); // eye
    pm.ellipse(cx - 2, cy, 4, 3, greyD); // folded wing
    pm.line(cx - 7, cy + 1, cx - 11, cy + 3, greyD); // tail
    pm.line(cx - 7, cy + 2, cx - 11, cy + 4, greyD);
    pm.vline(cx - 1, cy + 6, 3, px(RAMP.ORANGE, 2)); // legs
    pm.vline(cx + 2, cy + 6, 3, px(RAMP.ORANGE, 2));
    if (boss) {
      // do-rag on the ringleader
      pm.rect(cx + 2, cy - 10, 7, 3, px(RAMP.RED, 1));
      pm.set(cx + 1, cy - 8, px(RAMP.RED, 1));
    }
  };
  pigeon(13, 28, false);
  pigeon(38, 28, false);
  pigeon(25, 16, true);
  // one dropped crumb they're guarding
  pm.ellipse(25, 35, 2, 1, px(RAMP.GOLD, 2));
  pm.outline(C.outline);
  return pm;
}

export function drawHillSlugDeluxe(): Pixmap {
  const pm = new Pixmap(52, 40);
  const body = px(RAMP.GRASS, 1);
  const bodyL = px(RAMP.GRASS, 2);
  const belly = px(RAMP.GOLD, 3);
  // fat slug body
  pm.ellipse(24, 26, 18, 10, body);
  pm.ellipse(20, 28, 14, 7, bodyL);
  pm.rect(8, 33, 34, 3, belly);
  // head rise
  pm.ellipse(38, 18, 8, 9, body);
  pm.ellipse(37, 18, 5, 6, bodyL);
  // eye stalks
  pm.line(40, 10, 42, 4, body);
  pm.line(35, 10, 33, 5, body);
  pm.ellipse(42, 3, 2, 2, C.white);
  pm.ellipse(33, 4, 2, 2, C.white);
  pm.set(43, 3, C.outline);
  pm.set(34, 4, C.outline);
  // the DELUXE part: a tiny gold crown between the stalks
  pm.rect(36, 7, 6, 2, px(RAMP.GOLD, 2));
  pm.set(36, 6, px(RAMP.GOLD, 2));
  pm.set(38, 6, px(RAMP.GOLD, 3));
  pm.set(41, 6, px(RAMP.GOLD, 2));
  // slime sparkle
  pm.set(6, 35, px(RAMP.CYAN, 3));
  pm.set(45, 34, px(RAMP.CYAN, 3));
  // back spots
  pm.set(18, 22, px(RAMP.FOREST, 2));
  pm.set(26, 20, px(RAMP.FOREST, 2));
  pm.set(22, 25, px(RAMP.FOREST, 2));
  pm.outline(C.outline);
  return pm;
}

/** BOSS 1 — THE TITANIC TICK (GAME_BIBLE §A6 Ch.1) */
export function drawTitanicTick(): Pixmap {
  const pm = new Pixmap(88, 64);
  const shell = px(RAMP.EARTH, 1);
  const shellL = px(RAMP.EARTH, 2);
  const shellD = px(RAMP.EARTH, 0);
  const rng = mulberry32(0x71c4);
  // colossal abdomen
  pm.ellipse(36, 32, 26, 20, shell);
  pm.ellipse(32, 28, 18, 12, shellL);
  // mottled back pattern
  pm.scatter(rng, 16, 16, 40, 26, shellD, 90);
  pm.ellipse(36, 18, 10, 4, shellD);
  // head plate
  pm.ellipse(66, 30, 12, 10, shellD);
  pm.ellipse(66, 28, 9, 7, shell);
  // mean little eyes
  pm.rect(62, 24, 3, 3, px(RAMP.RED, 2));
  pm.rect(70, 24, 3, 3, px(RAMP.RED, 2));
  pm.set(63, 25, px(RAMP.RED, 3));
  pm.set(71, 25, px(RAMP.RED, 3));
  // mandibles
  pm.line(74, 34, 82, 38, shellD);
  pm.line(75, 33, 83, 35, shellD);
  pm.line(74, 36, 81, 42, shellD);
  pm.set(83, 36, C.outline);
  pm.set(82, 42, C.outline);
  // 8 legs, hooked
  const legPairs: Array<[number, number, number, number]> = [
    [20, 48, 12, 58],
    [30, 50, 26, 60],
    [42, 50, 42, 61],
    [54, 48, 60, 58],
  ];
  for (const [x0, y0, x1, y1] of legPairs) {
    pm.line(x0, y0, x1, y1, shellD);
    pm.line(x0 + 1, y0, x1 + 1, y1, shellD);
    pm.set(x1, y1 + 1, C.outline);
  }
  pm.line(24, 20, 14, 10, shellD); // front graspers
  pm.line(25, 21, 16, 12, shellD);
  // engorged glow — it has been drinking the hill's vibe
  pm.set(30, 30, px(RAMP.MAGENTA, 2));
  pm.set(38, 34, px(RAMP.MAGENTA, 2));
  pm.set(34, 38, px(RAMP.MAGENTA, 1));
  pm.outline(C.outline);
  return pm;
}

/* ---------------------------------------------------------------- */
/* Overworld minis (16×16 roamers)                                    */

export function drawCicadaMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const shell = px(RAMP.FOREST, 2);
  pm.ellipse(6, 9, 4, 3, shell);
  pm.ellipse(11, 7, 3, 3, px(RAMP.FOREST, 3));
  pm.set(13, 5, px(RAMP.RED, 2));
  pm.line(8, 5, 3, 2, px(RAMP.CYAN, 3));
  pm.line(9, 6, 5, 4, px(RAMP.CYAN, 2));
  pm.line(6, 12, 4, 14, px(RAMP.FOREST, 1));
  pm.line(9, 12, 9, 14, px(RAMP.FOREST, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawSlugMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const body = px(RAMP.GRASS, 1);
  pm.ellipse(7, 11, 6, 3, body);
  pm.ellipse(12, 8, 3, 3, px(RAMP.GRASS, 2));
  pm.set(13, 4, C.white);
  pm.set(11, 4, C.white);
  pm.vline(13, 5, 2, body);
  pm.vline(11, 5, 2, body);
  pm.set(12, 3, px(RAMP.GOLD, 2)); // crumb of a crown
  pm.outline(C.outline);
  return pm;
}

export function drawMailboxMini(): Pixmap {
  const pm = new Pixmap(16, 20);
  const blue = px(RAMP.BLUE, 2);
  pm.rect(3, 3, 10, 7, blue);
  pm.hline(4, 2, 8, px(RAMP.BLUE, 3));
  pm.rect(5, 5, 2, 2, C.white);
  pm.rect(9, 5, 2, 2, C.white);
  pm.set(5, 6, C.outline);
  pm.set(9, 6, C.outline);
  pm.rect(5, 8, 6, 1, C.outline);
  pm.set(13, 2, px(RAMP.RED, 2));
  pm.vline(13, 2, 4, px(RAMP.RED, 1));
  pm.rect(6, 10, 3, 7, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

export function drawMowerMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const red = px(RAMP.RED, 2);
  pm.rect(2, 7, 9, 4, red);
  pm.rect(4, 4, 5, 3, px(RAMP.PAPER, 1));
  pm.set(6, 5, C.outline);
  pm.line(11, 7, 14, 3, px(RAMP.PAPER, 0));
  pm.ellipse(4, 12, 2, 2, C.inkSoft);
  pm.ellipse(9, 12, 2, 2, C.inkSoft);
  pm.set(0, 6, px(RAMP.GRASS, 2));
  pm.set(1, 9, px(RAMP.GRASS, 3));
  pm.outline(C.outline);
  return pm;
}

export function drawPigeonMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const grey = px(RAMP.PAPER, 1);
  pm.ellipse(7, 9, 4, 3, grey);
  pm.ellipse(10, 5, 2, 2, grey);
  pm.set(9, 6, px(RAMP.CYAN, 2));
  pm.set(12, 5, px(RAMP.GOLD, 2));
  pm.set(10, 4, C.outline);
  pm.line(3, 9, 1, 10, px(RAMP.PAPER, 0));
  pm.vline(6, 12, 2, px(RAMP.ORANGE, 2));
  pm.vline(8, 12, 2, px(RAMP.ORANGE, 2));
  pm.outline(C.outline);
  return pm;
}
