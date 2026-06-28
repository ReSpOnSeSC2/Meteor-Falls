/**
 * Enemy sprite generators v3 (ADR-019) — GAME_BIBLE §A7 Chapter 1 roster +
 * Boss 1, rebuilt at EB battle scale (64–96px): front-facing portraits,
 * full 1px outlines, 4-tone ramp shading with checker dither, weird charm.
 * Battle sprites are static (hit-flash and idle-bob happen at runtime).
 * Each enemy also gets a 16×16 overworld mini with the same silhouette.
 *
 * S11b WEAR TIERS: every battle draw takes a wear param — 0 full ·
 * 1 scuffed (<66% HP) · 2 battered (<33%) — with DELIBERATE authored damage
 * per ADR-020 rule 1 (clustered marks, never noise): the mailbox dents and
 * its flag knocks askew, the mower bends a blade and coughs smoke, the
 * cicada's wing glass cracks, the slug's crown chips, the Smiler's tie
 * loosens as the smile strains, the pigeons shed feathers, and the Tick
 * bruises and visibly DEFLATES. All three tiers generate at boot (ADR-002)
 * through ENEMY_BATTLE_ART; the scene swaps textures, never redraws.
 */
import { Pixmap } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import type { WearTier } from './battlers';
import { composeEnemy } from './parts';
import type { PartsSpec } from '../schemas';

/* ---------------------------------------------------------------- */
/* Battle sprites.                                                    */
/* NOTE (ADR-020): EB battle enemies FLOAT on the psychedelic field — */
/* no ground shadows here, ever. Big curves are hand-authored contour */
/* runs, not ellipse() output; texture is deliberate plates/freckles, */
/* never scattered noise.                                             */

export function drawCrankyMailbox(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(64, 76);
  const blue = px(RAMP.BLUE, 2);
  const blueL = px(RAMP.BLUE, 3);
  const blueD = px(RAMP.BLUE, 1);
  const blueDD = px(RAMP.BLUE, 0);
  // wooden post with grain
  pm.rect(27, 44, 10, 26, px(RAMP.EARTH, 1));
  pm.vline(27, 44, 26, px(RAMP.EARTH, 2));
  pm.vline(35, 44, 26, px(RAMP.EARTH, 0));
  pm.vline(31, 48, 12, px(RAMP.EARTH, 0)); // grain crack
  pm.rect(22, 68, 20, 4, px(RAMP.EARTH, 1)); // base plate
  pm.hline(22, 68, 20, px(RAMP.EARTH, 2));
  // rounded mailbox body (dome top, US curbside profile)
  pm.rect(8, 14, 48, 32, blue);
  pm.rect(10, 8, 44, 7, blue);
  pm.rect(13, 5, 38, 4, blue);
  pm.hline(15, 4, 34, blue);
  // dome light + body shading
  pm.hline(16, 5, 24, blueL);
  pm.hline(13, 6, 14, blueL);
  pm.vline(8, 16, 28, blueL);
  pm.vline(9, 14, 31, blue);
  pm.rect(50, 12, 6, 34, blueD);
  pm.checker(46, 14, 10, 32, blue, blueD, 1);
  pm.rect(8, 42, 48, 4, blueD);
  pm.hline(8, 45, 48, blueDD);
  // a proud dent (it has seen some baseball bats)
  pm.hline(14, 11, 5, blueD);
  pm.set(15, 12, blueDD);
  // furious uni-brow eyes
  pm.rect(16, 17, 8, 8, px(RAMP.PAPER, 3));
  pm.rect(38, 17, 8, 8, px(RAMP.PAPER, 3));
  pm.rect(19, 20, 4, 5, C.outline); // pupils, glaring down-in
  pm.rect(39, 20, 4, 5, C.outline);
  pm.set(20, 21, px(RAMP.PAPER, 3)); // catchlight
  pm.set(40, 21, px(RAMP.PAPER, 3));
  pm.line(13, 14, 25, 18, C.outline); // the brow
  pm.line(50, 14, 38, 18, C.outline);
  pm.line(13, 15, 25, 19, blueDD); // brow shadow
  pm.line(50, 15, 38, 19, blueDD);
  // open slot mouth, mid-yell, letters flying
  pm.rect(17, 30, 30, 10, blueDD);
  pm.rect(19, 32, 26, 6, C.outline);
  pm.rect(24, 33, 14, 4, px(RAMP.PAPER, 3)); // the letter, outgoing
  pm.set(26, 34, px(RAMP.RED, 2)); // stamp
  pm.hline(28, 35, 7, px(RAMP.PAPER, 1)); // address line
  // two escaped letters
  pm.rect(2, 24, 8, 5, px(RAMP.PAPER, 3));
  pm.hline(3, 26, 5, px(RAMP.PAPER, 1));
  pm.rect(56, 30, 7, 5, px(RAMP.PAPER, 2));
  // flag arm raised in fury — until the fight knocks it askew (S11b w2)
  if (wear < 2) {
    pm.rect(55, 4, 4, 18, px(RAMP.RED, 1));
    pm.rect(53, 2, 10, 7, px(RAMP.RED, 2));
    pm.hline(53, 2, 10, px(RAMP.RED, 3));
  } else {
    // the flag hangs off its hinge, dignity going with it
    pm.line(56, 14, 61, 21, px(RAMP.RED, 1));
    pm.rect(59, 21, 7, 5, px(RAMP.RED, 2));
    pm.hline(59, 21, 7, px(RAMP.RED, 1));
    pm.set(60, 22, px(RAMP.RED, 3));
  }
  if (wear >= 1) {
    // fresh dents, clustered where the bats landed
    pm.hline(44, 9, 4, blueD);
    pm.set(45, 10, blueDD);
    pm.hline(10, 24, 3, blueD);
    pm.set(11, 25, blueDD);
  }
  if (wear >= 2) {
    // the slot bends mid-yell; a crease folds the dome
    pm.hline(18, 30, 6, blueDD);
    pm.set(17, 29, blueDD);
    pm.hline(28, 7, 5, blueD);
    pm.set(30, 8, blueDD);
    pm.set(31, 8, blueDD);
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawRunawayLawnmower(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(84, 64);
  const red = px(RAMP.RED, 2);
  const redL = px(RAMP.RED, 3);
  const redD = px(RAMP.RED, 1);
  const redDD = px(RAMP.RED, 0);
  // handle flailing up-back like raised arms
  pm.line(60, 34, 76, 8, px(RAMP.PAPER, 0));
  pm.line(61, 35, 77, 9, px(RAMP.PAPER, 1));
  pm.line(62, 36, 78, 10, px(RAMP.PAPER, 0));
  pm.rect(72, 4, 9, 4, px(RAMP.PAPER, 1)); // grip
  pm.hline(72, 4, 9, px(RAMP.PAPER, 2));
  // deck — wide and low, grinning grille up front
  pm.rect(10, 32, 52, 16, red);
  pm.hline(10, 32, 52, redL);
  pm.hline(10, 33, 40, redL);
  pm.rect(10, 44, 52, 4, redD);
  pm.hline(10, 47, 52, redDD);
  pm.checker(50, 34, 12, 14, red, redD, 1); // shade dither on the far side
  // engine block
  pm.rect(22, 16, 26, 17, px(RAMP.PAPER, 2));
  pm.hline(22, 16, 26, px(RAMP.PAPER, 3));
  pm.vline(22, 16, 17, px(RAMP.PAPER, 3));
  pm.rect(44, 18, 4, 15, px(RAMP.PAPER, 1));
  pm.rect(28, 10, 10, 7, px(RAMP.PAPER, 1)); // air filter hump
  pm.hline(28, 10, 10, px(RAMP.PAPER, 2));
  pm.rect(40, 12, 5, 5, px(RAMP.EARTH, 1)); // fuel cap
  pm.set(41, 13, px(RAMP.EARTH, 3));
  // pull cord whipping loose
  pm.line(48, 20, 58, 14, px(RAMP.PAPER, 0));
  pm.set(59, 13, px(RAMP.EARTH, 2)); // the handle at the end
  pm.set(60, 12, px(RAMP.EARTH, 2));
  // one crazed eye on the engine + a smaller twitchy one
  pm.rect(25, 19, 9, 10, px(RAMP.PAPER, 3));
  pm.rect(28, 22, 4, 5, C.outline);
  pm.set(29, 23, px(RAMP.PAPER, 3));
  pm.rect(36, 21, 6, 7, px(RAMP.PAPER, 3));
  pm.rect(38, 24, 2, 3, C.outline);
  // grille = teeth
  pm.rect(14, 36, 28, 8, px(RAMP.PAPER, 3));
  pm.frame(14, 36, 28, 8, C.outline);
  for (let x = 17; x < 41; x += 4) pm.vline(x, 37, 6, px(RAMP.PAPER, 1));
  pm.hline(14, 40, 28, px(RAMP.PAPER, 1)); // tooth midline
  // wheels with hubcaps
  const wheel = (cx: number, cy: number): void => {
    pm.ellipse(cx, cy, 7, 7, C.inkSoft);
    pm.ellipse(cx, cy, 5, 5, px(RAMP.INK, 1));
    pm.ellipse(cx, cy, 2, 2, px(RAMP.PAPER, 2));
    pm.set(cx - 1, cy - 1, px(RAMP.PAPER, 3));
  };
  wheel(18, 52);
  wheel(52, 52);
  // grass spray off the blade side
  const g2 = px(RAMP.GRASS, 2);
  const g3 = px(RAMP.GRASS, 3);
  pm.set(4, 28, g2);
  pm.set(2, 34, g3);
  pm.set(6, 40, px(RAMP.GRASS, 1));
  pm.set(3, 22, g2);
  pm.set(7, 17, g3);
  pm.set(1, 45, g2);
  pm.set(8, 12, px(RAMP.GRASS, 1));
  if (wear >= 1) {
    // deck dings + the handle takes a kink
    pm.hline(20, 35, 3, redDD);
    pm.set(21, 36, redD);
    pm.set(70, 12, px(RAMP.PAPER, 0));
    pm.set(71, 11, px(RAMP.PAPER, 0));
    pm.hline(44, 40, 2, redDD);
  }
  if (wear >= 2) {
    // a grille tooth knocked out, the bent blade showing, coughing smoke
    pm.rect(21, 37, 3, 6, px(RAMP.INK, 1)); // the gap in the grin
    pm.line(4, 49, 9, 47, C.inkSoft); // the blade, bent past the deck line
    pm.set(10, 47, C.inkSoft);
    const smoke = px(RAMP.PAPER, 1);
    pm.rect(30, 4, 3, 2, smoke); // engine cough — clustered puffs
    pm.rect(35, 1, 2, 2, smoke);
    pm.set(33, 6, smoke);
    pm.set(27, 8, px(RAMP.PAPER, 0));
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawCoilyCicada(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(76, 66);
  const shell = px(RAMP.FOREST, 2);
  const shellL = px(RAMP.FOREST, 3);
  const shellD = px(RAMP.FOREST, 1);
  const shellDD = px(RAMP.FOREST, 0);
  const wing = px(RAMP.CYAN, 3);
  const wingD = px(RAMP.CYAN, 2);
  // glassy wings swept up-back, veined
  const wingShape = (cx: number, cy: number, dir: 1 | -1): void => {
    pm.ellipse(cx, cy, 16, 7, wing);
    pm.ellipse(cx - 4 * dir, cy - 2, 12, 4, wing);
    // veins
    pm.line(cx + 12 * dir, cy - 4, cx - 14 * dir, cy + 2, wingD);
    pm.line(cx + 10 * dir, cy + 3, cx - 12 * dir, cy - 1, wingD);
    pm.line(cx + 4 * dir, cy - 6, cx - 6 * dir, cy + 5, wingD);
  };
  wingShape(28, 12, 1);
  wingShape(20, 24, 1);
  // the COIL — a fat segmented spring abdomen
  for (let i = 0; i < 4; i++) {
    const r = 16 - i * 3;
    pm.ellipse(22, 42, r, Math.max(3, r - 5), i % 2 === 0 ? shell : shellD);
  }
  pm.ellipse(22, 40, 5, 3, shellL); // coil crown light
  pm.checker(8, 34, 28, 18, shell, shellD, 1);
  pm.ellipse(22, 42, 2, 1, shellDD); // coil center hole
  // thorax
  pm.ellipse(46, 36, 12, 10, shell);
  pm.ellipse(43, 33, 7, 5, shellL);
  pm.checker(40, 38, 18, 9, shell, shellD, 1);
  // head, tilted up at you
  pm.ellipse(60, 26, 9, 8, shell);
  pm.ellipse(58, 23, 5, 4, shellL);
  // HUGE red compound eyes
  pm.ellipse(64, 20, 5, 5, px(RAMP.RED, 2));
  pm.ellipse(63, 19, 2, 2, px(RAMP.RED, 3));
  pm.set(65, 21, px(RAMP.RED, 1));
  pm.ellipse(55, 17, 3, 3, px(RAMP.RED, 2));
  pm.set(54, 16, px(RAMP.RED, 3));
  // mouth parts, mildly apologetic
  pm.hline(62, 31, 5, shellDD);
  pm.set(66, 32, shellDD);
  // antenna coiled like a phone cord
  pm.line(64, 12, 67, 8, shellD);
  pm.set(68, 7, shellD);
  pm.set(69, 8, shellD);
  pm.set(70, 7, shellD);
  // six legs, braced
  pm.line(40, 44, 34, 58, shellD);
  pm.line(46, 46, 44, 59, shellD);
  pm.line(52, 44, 58, 56, shellD);
  pm.line(41, 44, 35, 58, shellDD);
  pm.set(34, 59, C.outline);
  pm.set(44, 60, C.outline);
  pm.set(58, 57, C.outline);
  if (wear >= 1) {
    // the wing glass cracks — two clean fractures across the panes
    const crack = px(RAMP.CYAN, 1);
    pm.line(24, 8, 30, 14, crack);
    pm.set(31, 15, crack);
    pm.line(14, 22, 19, 26, crack);
  }
  if (wear >= 2) {
    // a wing corner shatters clean off; the coil takes a dent
    pm.rect(38, 6, 6, 5, T);
    pm.set(37, 8, px(RAMP.CYAN, 2)); // the broken edge still glints
    pm.set(37, 10, px(RAMP.CYAN, 2));
    pm.hline(16, 38, 4, shellDD);
    pm.set(17, 39, shellDD);
    pm.set(18, 39, shellDD);
  }
  pm.finish(); // ADR-101
  return pm;
}

export function drawBlazerSmiler(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(64, 88);
  const suit = px(RAMP.BLUE, 1);
  const suitL = px(RAMP.BLUE, 2);
  const suitD = px(RAMP.BLUE, 0);
  const skin = px(RAMP.SKIN, 2);
  const skinL = px(RAMP.SKIN, 3);
  const skinD = px(RAMP.SKIN, 1);
  // head — too round, too happy
  pm.ellipse(32, 17, 13, 13, skin);
  pm.ellipse(27, 11, 6, 4, skinL); // forehead shine
  pm.checker(38, 16, 8, 12, skin, skinD, 1); // cheek shade dither
  // flat corporate hair, parted with a ruler
  pm.rect(20, 4, 25, 5, px(RAMP.INK, 1));
  pm.hline(21, 3, 22, px(RAMP.INK, 1));
  pm.hline(22, 5, 8, px(RAMP.INK, 2)); // the part
  pm.set(19, 7, px(RAMP.INK, 1)); // sideburns
  pm.set(45, 7, px(RAMP.INK, 1));
  // dead-cheerful eyes: tall outlined whites, pupils that track YOUR quota
  pm.rect(23, 12, 6, 8, px(RAMP.PAPER, 3));
  pm.rect(36, 12, 6, 8, px(RAMP.PAPER, 3));
  pm.frame(22, 11, 8, 10, skinD); // socket rims
  pm.frame(35, 11, 8, 10, skinD);
  pm.rect(25, 14, 3, 5, C.outline);
  pm.rect(38, 14, 3, 5, C.outline);
  pm.set(25, 14, px(RAMP.PAPER, 3)); // catchlights
  pm.set(38, 14, px(RAMP.PAPER, 3));
  // THE GRIN — wall to wall teeth
  pm.rect(20, 22, 26, 8, px(RAMP.PAPER, 3));
  pm.frame(20, 22, 26, 8, C.outline);
  for (let x = 23; x < 45; x += 4) pm.vline(x, 23, 6, px(RAMP.PAPER, 1));
  pm.hline(21, 26, 24, px(RAMP.PAPER, 1));
  pm.hline(21, 29, 24, px(RAMP.PAPER, 1)); // lower-lip tooth shade
  pm.set(19, 25, skinD); // grin corner creases
  pm.set(46, 25, skinD);
  pm.set(19, 24, px(RAMP.SKIN, 0));
  pm.set(46, 24, px(RAMP.SKIN, 0));
  // blazer torso, shoulders first
  pm.rect(14, 32, 36, 30, suit);
  pm.rect(12, 33, 4, 16, suit); // shoulder caps
  pm.rect(48, 33, 4, 16, suit);
  pm.vline(14, 32, 30, suitL);
  pm.checker(44, 34, 6, 28, suit, suitD, 1);
  // lapels
  pm.line(26, 32, 30, 42, suitL);
  pm.line(38, 32, 34, 42, suitL);
  pm.line(27, 32, 31, 42, suitD);
  pm.line(37, 32, 33, 42, suitD);
  // shirt + tie
  pm.rect(28, 32, 9, 14, px(RAMP.PAPER, 3));
  pm.rect(31, 33, 3, 11, px(RAMP.RED, 2));
  pm.vline(31, 33, 11, px(RAMP.RED, 3));
  pm.rect(31, 44, 3, 3, px(RAMP.RED, 1)); // tie point
  pm.set(32, 32, px(RAMP.RED, 1)); // the knot
  // name badge: HELLO MY NAME IS [a smile]
  pm.rect(17, 36, 8, 6, px(RAMP.PAPER, 3));
  pm.hline(17, 36, 8, px(RAMP.RED, 2));
  pm.set(19, 39, C.outline);
  pm.set(22, 39, C.outline);
  pm.hline(19, 40, 4, C.outline);
  // RIGHT ARM — extended at the camera for the unwanted handshake,
  // foreshortened: small sleeve, ENORMOUS hand
  pm.rect(50, 36, 8, 6, suit);
  pm.rect(56, 34, 7, 9, skin);
  pm.ellipse(60, 44, 7, 8, skin); // the hand, looming
  pm.ellipse(58, 41, 3, 3, skinL);
  pm.vline(57, 48, 3, skinD); // finger seams
  pm.vline(60, 49, 3, skinD);
  pm.vline(63, 48, 3, skinD);
  pm.hline(56, 38, 4, skinD); // thumb crease
  // left arm holds the World's Best Quota mug
  pm.rect(10, 36, 5, 16, suit);
  pm.vline(10, 36, 16, suitL);
  pm.rect(8, 52, 7, 6, skin);
  pm.rect(6, 50, 9, 8, px(RAMP.PAPER, 3)); // mug
  pm.hline(6, 50, 9, px(RAMP.PAPER, 1));
  pm.set(5, 53, px(RAMP.PAPER, 2)); // handle
  pm.set(9, 49, px(RAMP.PAPER, 2)); // steam
  pm.set(8, 47, px(RAMP.PAPER, 1));
  pm.set(11, 52, px(RAMP.GOLD, 2)); // motivational decal
  // slacks, pressed to a deadly crease
  pm.rect(18, 62, 12, 18, px(RAMP.INK, 1));
  pm.rect(34, 62, 12, 18, px(RAMP.INK, 1));
  pm.vline(18, 62, 18, px(RAMP.INK, 2));
  pm.vline(34, 62, 18, px(RAMP.INK, 2));
  pm.vline(23, 63, 16, px(RAMP.INK, 0)); // crease shadow
  pm.vline(39, 63, 16, px(RAMP.INK, 0));
  pm.rect(14, 60, 36, 4, suitD); // jacket hem
  // loafers, gleaming
  pm.rect(15, 80, 16, 4, C.inkSoft);
  pm.rect(33, 80, 16, 4, C.inkSoft);
  pm.hline(16, 80, 6, px(RAMP.INK, 2)); // shine
  pm.hline(34, 80, 6, px(RAMP.INK, 2));
  if (wear >= 1) {
    // the tie loosens: knot yanked sideways, one hair breaks formation
    pm.set(33, 32, px(RAMP.RED, 1)); // the slid knot
    pm.set(30, 32, px(RAMP.PAPER, 3)); // collar gap it left behind
    pm.set(24, 2, px(RAMP.INK, 1));
    pm.set(25, 1, px(RAMP.INK, 1));
  }
  if (wear >= 2) {
    // the smile STRAINS: tie swings free, a tooth cracks, flop sweat
    pm.rect(31, 33, 3, 11, px(RAMP.PAPER, 3)); // shirt where the tie was
    pm.line(33, 33, 36, 43, px(RAMP.RED, 2)); // the tie, hanging on sideways
    pm.set(36, 44, px(RAMP.RED, 1));
    pm.set(37, 45, px(RAMP.RED, 1));
    pm.vline(31, 23, 6, px(RAMP.PAPER, 0)); // the cracked tooth
    pm.set(30, 25, px(RAMP.PAPER, 0));
    pm.set(48, 13, px(RAMP.CYAN, 3)); // sweat past the cheek dither
    pm.set(48, 14, px(RAMP.CYAN, 2));
  }
  pm.finish(); // ADR-101
  return pm;
}

export function drawPigeonGang(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(88, 64);
  const grey = px(RAMP.PAPER, 2);
  const greyL = px(RAMP.PAPER, 3);
  const greyD = px(RAMP.PAPER, 1);
  const greyDD = px(RAMP.PAPER, 0);
  const pigeon = (cx: number, cy: number, scale: number, boss: boolean): void => {
    const rx = Math.round(10 * scale);
    const ry = Math.round(8 * scale);
    // body
    pm.ellipse(cx, cy, rx, ry, grey);
    pm.ellipse(cx - 3, cy - 3, Math.round(rx * 0.5), Math.round(ry * 0.5), greyL);
    pm.checker(cx, cy, rx, ry, grey, greyD, 1);
    // head up top
    const hy = cy - ry - Math.round(4 * scale);
    pm.ellipse(cx + Math.round(5 * scale), hy, Math.round(5 * scale), Math.round(5 * scale), grey);
    // iridescent neck dither — the EB pigeon tell
    pm.checker(cx + 1, hy + 2, Math.round(6 * scale), Math.round(5 * scale), px(RAMP.CYAN, 2), px(RAMP.FOREST, 2), 1);
    // beak + cere
    pm.rect(cx + Math.round(9 * scale), hy - 1, 4, 2, px(RAMP.GOLD, 2));
    pm.set(cx + Math.round(9 * scale), hy - 2, px(RAMP.PAPER, 3));
    // eye — orange ring, black pin
    pm.set(cx + Math.round(6 * scale), hy - 1, px(RAMP.ORANGE, 2));
    pm.set(cx + Math.round(6 * scale) + 1, hy - 1, C.outline);
    // folded wing with feather steps
    pm.ellipse(cx - Math.round(3 * scale), cy, Math.round(6 * scale), Math.round(4 * scale), greyD);
    pm.hline(cx - rx + 2, cy + 2, Math.round(7 * scale), greyDD);
    pm.hline(cx - rx + 1, cy + 4, Math.round(6 * scale), greyDD);
    // tail
    pm.line(cx - rx, cy + 1, cx - rx - 6, cy + 4, greyDD);
    pm.line(cx - rx, cy + 2, cx - rx - 6, cy + 5, greyD);
    pm.line(cx - rx, cy + 3, cx - rx - 5, cy + 6, greyDD);
    // legs
    pm.vline(cx - 2, cy + ry, 4, px(RAMP.ORANGE, 2));
    pm.vline(cx + 3, cy + ry, 4, px(RAMP.ORANGE, 2));
    pm.set(cx - 3, cy + ry + 3, px(RAMP.ORANGE, 2));
    pm.set(cx + 2, cy + ry + 3, px(RAMP.ORANGE, 2));
    if (boss) {
      // the do-rag
      pm.rect(cx + 1, hy - Math.round(5 * scale), Math.round(10 * scale), 3, px(RAMP.RED, 2));
      pm.hline(cx + 1, hy - Math.round(5 * scale), Math.round(10 * scale), px(RAMP.RED, 3));
      pm.set(cx, hy - Math.round(3 * scale), px(RAMP.RED, 1)); // the knot
      pm.set(cx - 1, hy - Math.round(2 * scale), px(RAMP.RED, 1)); // tails
      // toothpick. for intimidation.
      pm.hline(cx + Math.round(11 * scale), hy + 1, 4, px(RAMP.EARTH, 3));
    }
  };
  pigeon(16, 38, 0.85, false);
  pigeon(70, 38, 0.85, false);
  pigeon(43, 32, 1.15, true); // the ringleader, front and center
  // the crumb they're guarding. it's a good crumb.
  pm.ellipse(43, 56, 3, 2, px(RAMP.GOLD, 2));
  pm.set(42, 55, px(RAMP.GOLD, 3));
  if (wear >= 1) {
    // shed feathers — three drift loose around the gang
    pm.hline(28, 52, 2, grey);
    pm.hline(58, 48, 2, grey);
    pm.set(12, 55, greyD);
    pm.set(59, 49, greyL);
  }
  if (wear >= 2) {
    // patchy coats, more down on the pavement, the do-rag knocked askew
    pm.rect(40, 28, 3, 2, greyDD); // bare patch on the boss
    pm.rect(14, 37, 2, 2, greyDD);
    pm.rect(69, 38, 2, 2, greyDD);
    pm.set(54, 13, px(RAMP.RED, 2)); // the rag slid over one eye
    pm.set(55, 14, px(RAMP.RED, 1));
    pm.hline(20, 58, 2, grey);
    pm.hline(70, 56, 2, greyD);
    pm.set(35, 59, greyL);
  }
  pm.finish(); // ADR-101
  return pm;
}

export function drawHillSlugDeluxe(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(88, 60);
  const body = px(RAMP.GRASS, 1);
  const bodyL = px(RAMP.GRASS, 2);
  const bodyLL = px(RAMP.GRASS, 3);
  const bodyD = px(RAMP.GRASS, 0);
  // glistening slime trail — a drawn streak, not an ellipse puddle
  pm.hline(8, 54, 22, px(RAMP.CYAN, 1));
  pm.hline(12, 55, 13, px(RAMP.CYAN, 1));
  pm.set(8, 53, px(RAMP.CYAN, 3));
  pm.set(28, 53, px(RAMP.CYAN, 3));
  // fat slug body — hand-set contour, swells fast and settles
  const BODY: number[] = [
    9, 15, 19, 22, 24, 26, 27, 28, 29, 29, 30, 30, 30, 30, 30, 30,
    30, 30, 29, 29, 28, 28, 27, 27, 26, 26, 25, 25, 24, 24,
  ];
  pm.contour(38, 22, BODY, body);
  const BELLYLIGHT: number[] = [10, 15, 18, 20, 21, 22, 22, 22, 21, 21, 20, 20, 19, 19];
  pm.contour(32, 38, BELLYLIGHT, bodyL);
  pm.checker(16, 32, 44, 16, body, bodyD, 2); // mottled back (kept inside the mass)
  pm.rect(10, 50, 56, 4, bodyLL); // belly foot
  pm.hline(10, 49, 56, bodyL);
  // glossy highlight arc, two hand strokes
  pm.hline(22, 25, 12, bodyLL);
  pm.hline(18, 27, 7, bodyLL);
  // head rise
  pm.ellipse(64, 28, 13, 14, body);
  pm.ellipse(61, 28, 8, 9, bodyL);
  pm.set(58, 24, bodyLL);
  // eye stalks with big hopeful eyes
  pm.line(67, 14, 70, 6, body);
  pm.line(68, 14, 71, 7, bodyD);
  pm.line(58, 14, 55, 7, body);
  pm.line(59, 14, 56, 8, bodyD);
  pm.ellipse(71, 4, 4, 4, px(RAMP.PAPER, 3));
  pm.ellipse(55, 5, 4, 4, px(RAMP.PAPER, 3));
  pm.rect(71, 4, 2, 3, C.outline);
  pm.rect(55, 5, 2, 3, C.outline);
  pm.set(70, 3, px(RAMP.PAPER, 3));
  pm.set(54, 4, px(RAMP.PAPER, 3));
  // the DELUXE part: a proper little crown between the stalks
  pm.rect(59, 9, 10, 4, px(RAMP.GOLD, 2));
  pm.hline(59, 12, 10, px(RAMP.GOLD, 1));
  pm.set(59, 8, px(RAMP.GOLD, 2));
  pm.set(62, 7, px(RAMP.GOLD, 3));
  pm.set(65, 8, px(RAMP.GOLD, 2));
  pm.set(68, 7, px(RAMP.GOLD, 3));
  pm.set(63, 10, px(RAMP.RED, 2)); // one inset ruby
  // breathing pore (it's working hard)
  pm.ellipse(48, 34, 2, 1, bodyD);
  // back racing spots
  pm.ellipse(24, 32, 3, 2, px(RAMP.FOREST, 2));
  pm.ellipse(36, 27, 2, 2, px(RAMP.FOREST, 2));
  pm.ellipse(30, 40, 2, 1, px(RAMP.FOREST, 2));
  if (wear >= 1) {
    // the crown chips — royalty is a high-contact sport
    pm.set(59, 8, T); // one point, snapped clean off
    pm.set(60, 9, px(RAMP.GOLD, 1));
    pm.hline(26, 30, 2, px(RAMP.FOREST, 1)); // a welt on the back
    pm.set(27, 31, px(RAMP.FOREST, 1));
  }
  if (wear >= 2) {
    // badly chipped, the ruby GONE, welts clustering
    pm.set(62, 7, T);
    pm.set(65, 8, T);
    pm.set(63, 10, px(RAMP.GOLD, 0)); // the empty setting
    pm.hline(40, 33, 3, px(RAMP.FOREST, 1));
    pm.set(41, 34, px(RAMP.FOREST, 1));
    pm.hline(31, 44, 2, px(RAMP.FOREST, 1));
    pm.set(54, 24, bodyD); // the gloss arc dulls where it took the hit
    pm.set(55, 24, bodyD);
  }
  pm.finish(); // ADR-101
  return pm;
}

/** BOSS 1 — THE TITANIC TICK (GAME_BIBLE §A6 Ch.1). It must read as a BOSS:
 *  a looming engorged dome that fills the frame, vibe-glow veins, hooked
 *  graspers raised at the camera. The dome contour and every plate are
 *  hand-authored runs (ADR-020) — no ellipse stacking, no scatter noise. */
export function drawTitanicTick(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(96, 84);
  const shell = px(RAMP.EARTH, 1);
  const shellL = px(RAMP.EARTH, 2);
  const shellLL = px(RAMP.EARTH, 3);
  const shellD = px(RAMP.EARTH, 0);
  // 8 legs first (so the dome overlaps them), hooked and braced
  const leg = (x0: number, y0: number, x1: number, y1: number, hook: 1 | -1): void => {
    pm.line(x0, y0, x1, y1, shellD);
    pm.line(x0 + 1, y0, x1 + 1, y1, shell);
    pm.line(x1, y1, x1 + 3 * hook, y1 + 4, shellD);
    pm.set(x1 + 4 * hook, y1 + 5, C.outline); // the hook tip
  };
  leg(20, 52, 6, 64, -1);
  leg(24, 58, 12, 70, -1);
  leg(34, 62, 28, 74, -1);
  leg(72, 52, 88, 64, 1);
  leg(70, 58, 82, 70, 1);
  leg(60, 62, 66, 74, 1);

  // THE DOME — one hand-set contour, top at y=8. Run steps ease 6-5-3-2-1
  // like a drawn curve, hold the wide belly, then tuck in above the head.
  const DOME_FULL: number[] = [
    9, 15, 20, 24, 27, 30, 32, 34, 35, 36, 37, 38, 38, 39, 39, 39,
    39, 39, 39, 39, 39, 38, 38, 38, 37, 37, 36, 36, 35, 35, 34, 33,
    33, 32, 31, 30, 29, 28, 26, 25, 23, 21, 19, 17, 14, 11, 8, 5,
  ];
  // S11b battered tier: it visibly DEFLATES — the crown drops six rows and
  // sags wide early (everything it drank, leaking back out). Same base row,
  // so the head, plates, and festoons all keep their seats.
  const DOME_DEFLATED: number[] = [
    12, 19, 24, 28, 31, 33, 35, 36, 37, 38, 38, 39, 39, 39, 39, 39,
    39, 39, 38, 38, 37, 37, 36, 35, 35, 34, 33, 32, 31, 30, 28, 27,
    26, 25, 23, 21, 19, 17, 14, 11, 8, 5,
  ];
  const DOME = wear >= 2 ? DOME_DEFLATED : DOME_FULL;
  const domeTop = wear >= 2 ? 14 : 8;
  pm.contour(47, domeTop, DOME, shell);
  // tone zones: lit crown third (offset up-left), shaded eaves of the shell
  const LIT: number[] = [7, 13, 17, 20, 23, 25, 27, 28, 29, 30, 30, 30, 29, 28, 26, 24, 21, 17, 12, 6];
  pm.contour(42, domeTop + 2, LIT, shellL);
  if (wear < 2) {
    const SHINE: number[] = [5, 9, 12, 14, 15, 15, 14, 12, 9, 5];
    pm.contour(35, 13, SHINE, shellLL); // taut highlight — it is FULL
  }
  // belly shade: the underside curve, hand-run
  for (let i = 0; i < 10; i++) {
    const hw = DOME[DOME.length - 10 + i] - 1;
    if (hw > 0) pm.hline(47 - hw, domeTop + DOME.length - 10 + i, hw * 2 + 2, i % 3 === 2 ? shell : shellD);
  }
  // dorsal plates: five deliberate arcs, two broken — drawn, not generated
  pm.hline(34, 22, 9, shellD);
  pm.hline(46, 23, 7, shellD);
  pm.hline(58, 22, 6, shellD);
  pm.hline(28, 32, 12, shellD);
  pm.hline(44, 33, 14, shellD);
  pm.hline(62, 31, 9, shellD);
  pm.hline(35, 43, 10, shellD);
  pm.hline(50, 44, 12, shellD);
  // a few freckle clusters along the plates (pairs, never lone pixels)
  pm.hline(38, 26, 2, shellD);
  pm.hline(55, 27, 2, shellD);
  pm.hline(31, 37, 2, shellD);
  pm.hline(60, 38, 2, shellD);
  pm.hline(46, 49, 2, shellD);
  pm.hline(52, 18, 2, shellL); // and two catching the light
  pm.hline(43, 15, 2, shellLL);
  // festoons: the ridged rim segments every tick has, following the contour
  for (const [fx, fy] of [
    [12, 46],
    [18, 52],
    [26, 57],
    [68, 57],
    [76, 52],
    [82, 46],
  ] as const) {
    pm.vline(fx, fy, 3, shellD);
    pm.vline(fx + 1, fy + 1, 2, shellD);
  }
  // VIBE-GLOW VEINS — it has been drinking the hill (the magenta is the
  // tell); battered, the glow runs a shade dimmer — the drink is leaving
  const vein = px(RAMP.MAGENTA, wear >= 2 ? 1 : 2);
  const veinL = px(RAMP.MAGENTA, wear >= 2 ? 2 : 3);
  pm.line(36, 34, 44, 42, vein);
  pm.line(44, 42, 52, 40, vein);
  pm.line(50, 30, 56, 38, vein);
  pm.line(30, 40, 38, 46, vein);
  pm.set(44, 42, veinL);
  pm.set(52, 40, veinL);
  pm.set(36, 34, veinL);
  pm.hline(45, 40, 4, vein); // the feeding blush
  pm.hline(44, 41, 5, vein);
  pm.set(46, 40, veinL);
  // head plate, small and mean, low center — hand-contoured
  const HEAD: number[] = [8, 11, 13, 14, 15, 15, 15, 14, 13, 11, 8];
  pm.contour(48, 55, HEAD, shellD);
  const HEADTOP: number[] = [7, 10, 11, 12, 12, 11, 9, 6];
  pm.contour(48, 56, HEADTOP, shell);
  pm.hline(42, 57, 5, shellL); // brow ridge catches the light
  pm.hline(50, 57, 5, shellL);
  // compound eyes — red, four of them, why not. The face anchors the boss.
  pm.rect(39, 58, 5, 5, px(RAMP.RED, 2));
  pm.rect(53, 58, 5, 5, px(RAMP.RED, 2));
  pm.set(40, 59, px(RAMP.RED, 3)); // catchlights
  pm.set(54, 59, px(RAMP.RED, 3));
  pm.hline(40, 62, 3, px(RAMP.RED, 1));
  pm.hline(54, 62, 3, px(RAMP.RED, 1));
  pm.rect(45, 55, 2, 2, px(RAMP.RED, 1)); // the small dorsal pair
  pm.rect(50, 55, 2, 2, px(RAMP.RED, 1));
  // mandibles, open, hanging off the head plate
  pm.line(43, 65, 37, 75, shellD);
  pm.line(44, 66, 39, 75, shell);
  pm.line(53, 65, 59, 75, shellD);
  pm.line(52, 66, 57, 75, shell);
  pm.set(37, 76, C.outline);
  pm.set(59, 76, C.outline);
  pm.hline(45, 64, 7, shellD); // mouth seam
  // front graspers — raised AT YOU while it has the strength; battered,
  // they droop toward the dirt (the deflation's other read)
  if (wear < 2) {
    pm.line(26, 48, 10, 34, shellD);
    pm.line(27, 49, 12, 36, shell);
    pm.line(10, 34, 6, 26, shellD);
    pm.set(5, 24, C.outline);
    pm.set(6, 25, C.outline);
    pm.line(70, 48, 86, 34, shellD);
    pm.line(69, 49, 84, 36, shell);
    pm.line(86, 34, 90, 26, shellD);
    pm.set(91, 24, C.outline);
    pm.set(90, 25, C.outline);
  } else {
    pm.line(26, 50, 10, 46, shellD);
    pm.line(27, 51, 12, 48, shell);
    pm.line(10, 46, 7, 52, shellD);
    pm.set(6, 54, C.outline);
    pm.line(70, 50, 86, 46, shellD);
    pm.line(69, 51, 84, 48, shell);
    pm.line(86, 46, 89, 52, shellD);
    pm.set(90, 54, C.outline);
  }
  if (wear >= 1) {
    // bruise patches where the bats landed — clustered, never noise
    const bruise = px(RAMP.PURPLE, 1);
    const bruiseD = px(RAMP.PURPLE, 0);
    pm.hline(38, 27, 3, bruise);
    pm.set(39, 28, bruiseD);
    pm.hline(57, 36, 2, bruise);
    pm.set(57, 37, bruiseD);
    // the sag crease across the crown — it is leaking what it drank
    pm.hline(33, domeTop + 11, 4, shellD);
    pm.set(37, domeTop + 12, shellD);
  }
  if (wear >= 2) {
    const bruise = px(RAMP.PURPLE, 1);
    pm.hline(45, 22, 3, bruise);
    pm.set(46, 23, px(RAMP.PURPLE, 0));
    pm.hline(29, 41, 2, bruise);
    pm.hline(63, 30, 2, bruise);
  }
  pm.finish(); // ADR-101
  return pm;
}

/* ================================================================= */
/* §A7 CHAPTER 2 (S14) — the South America six + BOSS 2. Same laws:   */
/* hand-authored contours, deliberate clustered wear, floats, no      */
/* scatter on bodies. The Idol draws BOTH §A6 forms — SOLID GOLD and  */
/* HOLLOW — through one base so the swap reads as the same body with  */
/* the warmth gone.                                                   */

export function drawPickpocketParrot(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(68, 76);
  const g = px(RAMP.GRASS, 2);
  const gL = px(RAMP.GRASS, 3);
  const gD = px(RAMP.GRASS, 1);
  const gDD = px(RAMP.GRASS, 0);
  // body — a plump hover, hand-run contour (rule 3)
  pm.contour(30, 18, [4, 7, 9, 11, 12, 13, 13, 13, 13, 12, 12, 11, 10, 9, 7, 5, 3], g);
  pm.contour(26, 22, [3, 5, 6, 7, 7, 7, 6, 5, 3], gL); // chest light
  pm.rect(38, 26, 5, 14, gD); // wing-side shade
  // head + red crest
  pm.contour(30, 6, [3, 5, 6, 7, 7, 6], g);
  pm.hline(27, 7, 5, gL);
  pm.rect(27, 2, 8, 4, px(RAMP.RED, 2));
  pm.hline(28, 1, 5, px(RAMP.RED, 3));
  if (wear >= 2) {
    // the crest knocked sideways — pride goes first
    pm.rect(27, 2, 8, 4, T);
    pm.line(33, 2, 38, 5, px(RAMP.RED, 2));
    pm.set(38, 4, px(RAMP.RED, 3));
  }
  // greedy eye + gold beak holding a coin
  pm.rect(31, 9, 4, 4, px(RAMP.PAPER, 3));
  pm.rect(33, 10, 2, 2, C.outline);
  pm.set(33, 10, px(RAMP.PAPER, 3));
  pm.contour(40, 10, [2, 3, 2, 1], px(RAMP.GOLD, 2));
  pm.hline(39, 10, 3, px(RAMP.GOLD, 3));
  pm.ellipse(44, 12, 2, 2, px(RAMP.GOLD, 3)); // the coin, mid-getaway
  pm.set(44, 12, px(RAMP.GOLD, 1));
  // wings out — feather runs, hand-stepped
  pm.line(18, 22, 6, 14, gD);
  pm.line(18, 26, 5, 20, g);
  pm.line(19, 30, 6, 27, gD);
  pm.rect(8, 18, 12, 12, g);
  pm.contour(13, 16, [2, 4, 6, 7, 7, 6, 5, 3], gL);
  pm.line(43, 22, 56, 14, gD);
  pm.line(43, 26, 57, 20, g);
  pm.line(42, 30, 56, 27, gD);
  pm.rect(44, 18, 12, 12, g);
  pm.contour(50, 16, [2, 4, 6, 7, 7, 6, 5, 3], gD);
  if (wear >= 1) {
    // shed feathers: two clean gaps in the near wing + one drifting down
    pm.rect(10, 24, 3, 4, T);
    pm.rect(48, 22, 3, 3, T);
    pm.line(14, 52, 16, 56, gL);
  }
  // tail fan
  pm.line(30, 50, 24, 64, gD);
  pm.line(32, 50, 32, 66, g);
  pm.line(34, 50, 40, 64, gD);
  // feet: one clutching the PURSE (the whole §A7 quirk, held up like a prize)
  pm.vline(26, 50, 5, px(RAMP.GOLD, 1));
  pm.vline(36, 50, 4, px(RAMP.GOLD, 1));
  pm.contour(26, 56, [3, 4, 5, 5, 4], px(RAMP.EARTH, 2));
  pm.hline(24, 57, 4, px(RAMP.EARTH, 3));
  pm.set(26, 55, px(RAMP.GOLD, 2)); // the clasp
  if (wear >= 2) {
    // the purse leaks — three coins escaping (your refund, mid-air)
    pm.set(22, 64, px(RAMP.GOLD, 3));
    pm.set(28, 68, px(RAMP.GOLD, 2));
    pm.set(33, 65, px(RAMP.GOLD, 3));
  }
  pm.checker(26, 36, 10, 8, g, gDD, 1);
  pm.finish(); // ADR-101
  return pm;
}

export function drawGildedBeetle(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(76, 60);
  const au = px(RAMP.GOLD, 2);
  const auL = px(RAMP.GOLD, 3);
  const auD = px(RAMP.GOLD, 1);
  const auDD = px(RAMP.GOLD, 0);
  // the carapace dome — one proud hand-run contour
  pm.contour(40, 8, [6, 10, 13, 15, 17, 18, 19, 20, 20, 20, 20, 19, 18, 17, 15, 12], au);
  // seam down the middle (wing cases)
  pm.vline(40, 10, 14, auD);
  // dome light: a deliberate gleam arc, top-left
  pm.contour(32, 10, [2, 4, 5, 5, 4, 2], auL);
  pm.set(28, 12, px(RAMP.PAPER, 3)); // the one white spark (pure light)
  // lower-right core shadow + ONE dither seam (rule 6)
  pm.rect(48, 26, 11, 10, auD);
  pm.checker(44, 24, 14, 12, au, auD, 1);
  pm.hline(24, 36, 33, auDD);
  // head + horn (it has opinions)
  pm.contour(14, 22, [3, 5, 6, 7, 7, 6], px(RAMP.EARTH, 1));
  pm.rect(10, 26, 4, 4, px(RAMP.EARTH, 2));
  pm.line(12, 22, 4, 10, auD); // the horn, gilded at the tip
  pm.line(13, 22, 5, 11, au);
  pm.set(4, 9, auL);
  pm.rect(15, 25, 3, 3, px(RAMP.RED, 2)); // one cross eye
  pm.set(16, 26, px(RAMP.RED, 3));
  // legs — six, planted like furniture
  for (const [x0, y0, x1, y1] of [
    [24, 38, 18, 50],
    [34, 40, 30, 52],
    [44, 40, 46, 52],
    [54, 38, 60, 50],
    [28, 39, 24, 51],
    [50, 39, 54, 51],
  ] as const) {
    pm.line(x0, y0, x1, y1, px(RAMP.EARTH, 0));
    pm.set(x1, y1 + 1, px(RAMP.EARTH, 1));
  }
  if (wear >= 1) {
    // the gilding chips at the rim — two clustered scuffs, brown shows through
    pm.rect(52, 14, 4, 3, px(RAMP.EARTH, 1));
    pm.set(53, 15, px(RAMP.EARTH, 2));
    pm.rect(30, 30, 3, 2, px(RAMP.EARTH, 1));
  }
  if (wear >= 2) {
    // the big crack: mostly beetle after all
    pm.line(36, 9, 44, 22, auDD);
    pm.line(44, 22, 40, 32, auDD);
    pm.rect(41, 18, 5, 4, px(RAMP.EARTH, 1)); // plain beetle, exposed
    pm.set(42, 19, px(RAMP.EARTH, 2));
    pm.set(28, 12, T); // the spark of polish is gone
  }
  pm.finish(); // ADR-101
  return pm;
}

export function drawCursedSouvenir(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(60, 80);
  const stone = px(RAMP.EARTH, 2);
  const stoneL = px(RAMP.EARTH, 3);
  const stoneD = px(RAMP.EARTH, 1);
  const stoneDD = px(RAMP.EARTH, 0);
  // wooden gift-shop base + the price tag that seals the curse
  pm.rect(14, 64, 32, 8, px(RAMP.EARTH, 1));
  pm.hline(14, 64, 32, px(RAMP.EARTH, 2));
  pm.hline(15, 71, 30, stoneDD);
  pm.rect(42, 58, 10, 7, px(RAMP.PAPER, 3)); // the tag
  pm.line(42, 58, 38, 54, px(RAMP.PAPER, 1)); // its string
  pm.hline(44, 60, 6, px(RAMP.RED, 2)); // a price nobody should pay
  pm.hline(44, 62, 4, px(RAMP.PAPER, 1));
  if (wear >= 2) {
    // the tag tears — the curse loosens its paperwork
    pm.rect(48, 58, 4, 7, T);
    pm.line(47, 58, 49, 64, px(RAMP.PAPER, 2));
  }
  // the little idol body — squat, hand-stepped
  pm.contour(30, 14, [5, 7, 9, 10, 11, 11, 11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 13, 13, 13, 12], stone);
  // top-left light, lower-right core (3-tone, rule-abiding)
  pm.contour(25, 16, [2, 3, 4, 4, 4, 3], stoneL);
  pm.rect(36, 38, 6, 18, stoneD);
  pm.hline(22, 56, 18, stoneDD);
  // carved zigzag band — deliberate, off-center (rule 4)
  for (let i = 0; i < 4; i++) {
    pm.line(20 + i * 6, 44, 23 + i * 6, 41, stoneDD);
    pm.line(23 + i * 6, 41, 26 + i * 6, 44, stoneDD);
  }
  // ENORMOUS weepy eyes — the whole quirk, front and center
  pm.rect(21, 22, 8, 9, px(RAMP.PAPER, 3));
  pm.rect(33, 22, 8, 9, px(RAMP.PAPER, 3));
  pm.rect(24, 26, 4, 5, px(RAMP.BLUE, 1)); // pupils, swimming
  pm.rect(35, 26, 4, 5, px(RAMP.BLUE, 1));
  pm.set(25, 27, px(RAMP.PAPER, 3));
  pm.set(36, 27, px(RAMP.PAPER, 3));
  pm.line(19, 21, 30, 19, C.outline); // the heavy carved brow
  pm.line(43, 21, 32, 19, C.outline);
  // tear streams — pure light, stamped AFTER outline (rule-2 mirror) below
  // tiny useless arms
  pm.rect(14, 40, 4, 10, stone);
  pm.rect(42, 40, 4, 10, stone);
  pm.set(15, 50, stoneL);
  pm.set(43, 50, stoneL);
  // downturned carved mouth
  pm.contour(31, 34, [4, 5], stoneDD);
  pm.hline(28, 33, 7, C.outline);
  if (wear >= 1) {
    // chips where it has been dropped before — clustered, top corner
    pm.rect(37, 15, 3, 2, stoneL);
    pm.set(38, 17, stoneL);
    pm.set(20, 36, stoneDD);
    pm.set(21, 37, stoneDD);
  }
  if (wear >= 2) {
    // the base splits — it is coming apart from the grief
    pm.line(26, 64, 30, 71, stoneDD);
    pm.line(30, 64, 28, 71, C.outline);
    pm.rect(24, 50, 3, 3, stoneDD); // a body fissure
  }
  pm.finish(); // ADR-101
  // the tears, after outline: light is never outlined (ADR-021 idiom)
  pm.vline(23, 31, wear >= 1 ? 14 : 9, px(RAMP.CYAN, 3));
  pm.vline(38, 31, wear >= 1 ? 16 : 11, px(RAMP.CYAN, 3));
  pm.set(23, 31 + (wear >= 1 ? 14 : 9), px(RAMP.CYAN, 2));
  pm.set(38, 31 + (wear >= 1 ? 16 : 11), px(RAMP.CYAN, 2));
  return pm;
}

export function drawStepMask(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(80, 68);
  const stone = px(RAMP.EARTH, 2);
  const stoneL = px(RAMP.EARTH, 3);
  const stoneD = px(RAMP.EARTH, 1);
  const stoneDD = px(RAMP.EARTH, 0);
  // the mask slab — wide, stepped like its pyramid (hand-run sides)
  pm.contour(40, 6, [14, 17, 20, 23, 26, 28, 29, 30, 30, 30, 30, 30, 30, 29, 29, 28, 28, 27, 26, 25, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4], stone);
  // stepped headdress notches — geometry, not noise
  pm.rect(18, 6, 8, 3, stoneD);
  pm.rect(54, 6, 8, 3, stoneD);
  pm.rect(26, 3, 28, 4, stone);
  pm.hline(28, 2, 24, stoneL);
  // top-left light plane + lower-right core shadow, ONE dither seam
  pm.contour(28, 9, [6, 8, 9, 9, 8, 6], stoneL);
  pm.rect(56, 36, 10, 16, stoneD);
  pm.checker(50, 34, 12, 14, stone, stoneD, 1);
  pm.hline(22, 56, 30, stoneDD);
  // the heavy brow + deep-set carved eyes
  pm.rect(16, 20, 48, 4, stoneDD);
  pm.rect(22, 26, 12, 8, C.outline);
  pm.rect(46, 26, 12, 8, C.outline);
  pm.rect(24, 28, 4, 4, px(RAMP.MAGENTA, 2)); // something keeps watch inside
  pm.rect(48, 28, 4, 4, px(RAMP.MAGENTA, 2));
  pm.set(25, 29, px(RAMP.MAGENTA, 3));
  pm.set(49, 29, px(RAMP.MAGENTA, 3));
  // the nose slab
  pm.rect(36, 28, 8, 12, stoneD);
  pm.vline(36, 28, 12, stoneL);
  // teeth — a calm, terrible row
  pm.rect(24, 44, 32, 8, stoneDD);
  for (let i = 0; i < 7; i++) pm.rect(25 + Math.round(i * 4.5), 45, 3, 6, px(RAMP.PAPER, 2));
  pm.hline(25, 45, 30, px(RAMP.PAPER, 3));
  // moss tufts — two deliberate clusters where the centuries landed
  pm.rect(14, 38, 4, 2, px(RAMP.FOREST, 1));
  pm.set(15, 37, px(RAMP.FOREST, 2));
  pm.rect(60, 16, 3, 2, px(RAMP.FOREST, 1));
  pm.set(61, 15, px(RAMP.FOREST, 2));
  // carved cheek spirals (off-center, rule 4)
  pm.line(18, 44, 22, 40, stoneDD);
  pm.set(22, 41, stoneDD);
  if (wear >= 1) {
    // a corner chip + one long hairline crack
    pm.rect(64, 10, 4, 3, T);
    pm.set(63, 12, stoneL);
    pm.line(58, 12, 52, 24, stoneDD);
  }
  if (wear >= 2) {
    // split through the right eye — the watcher inside flickers out
    pm.line(50, 6, 52, 26, C.outline);
    pm.line(52, 26, 48, 40, stoneDD);
    pm.rect(48, 28, 4, 4, C.outline);
    pm.rect(30, 45, 4, 7, T); // a tooth gone
  }
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawBananaBunch(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(60, 68);
  const y2 = px(RAMP.GOLD, 2);
  const y3 = px(RAMP.GOLD, 3);
  const y1 = px(RAMP.GOLD, 1);
  // five members standing together, fanned like a raised fist
  const stems: Array<[number, number, number]> = [
    [12, 24, -2], // x of base, top y, lean
    [22, 16, -1],
    [31, 12, 0],
    [40, 16, 1],
    [49, 24, 2],
  ];
  stems.forEach(([bx, ty, lean], i) => {
    const droop = wear >= 2 && (i === 0 || i === 4) ? 8 : 0; // two members peel off the cause
    for (let j = 0; j < 36 - (ty - 12) - droop; j++) {
      const x = bx + Math.round((lean * j) / 12);
      pm.rect(x, ty + droop + j, 5, 1, j < 4 ? y1 : y2);
    }
    pm.vline(bx + Math.round((lean * 2) / 12), ty + droop + 1, 4, px(RAMP.FOREST, 1)); // the stem tip
    // each member's lit edge
    for (let j = 4; j < 20; j++) pm.set(bx + Math.round((lean * j) / 12), ty + droop + j, y3);
    if (wear >= 1) {
      // bruises — clustered, honest, organic (deliberate spots, never noise)
      pm.rect(bx + 1, ty + droop + 14 + i * 2, 2, 2, px(RAMP.EARTH, 1));
    }
  });
  // the bunch joins at the crown
  pm.rect(18, 50, 26, 8, y1);
  pm.hline(20, 50, 22, y2);
  pm.hline(18, 57, 26, px(RAMP.EARTH, 1));
  // the front member's face — the union rep
  pm.rect(28, 24, 4, 4, px(RAMP.PAPER, 3));
  pm.rect(34, 24, 4, 4, px(RAMP.PAPER, 3));
  pm.rect(29, 25, 2, 2, C.outline);
  pm.rect(35, 25, 2, 2, C.outline);
  pm.line(27, 22, 31, 23, C.outline); // organized brows
  pm.line(39, 22, 35, 23, C.outline);
  pm.hline(30, 31, 6, C.outline); // a firm line of a mouth
  // the tiny picket sign (it says everything it needs to)
  pm.vline(8, 30, 22, px(RAMP.EARTH, 1));
  pm.rect(3, 24, 11, 8, px(RAMP.PAPER, 3));
  pm.vline(8, 26, 4, px(RAMP.RED, 2));
  pm.set(8, 31, px(RAMP.RED, 2)); // "!"
  pm.finish(); // ADR-101
  return pm;
}

export function drawJungleJitterbug(wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(76, 78);
  const sh = px(RAMP.FOREST, 2);
  const shL = px(RAMP.FOREST, 3);
  const shD = px(RAMP.FOREST, 1);
  const shDD = px(RAMP.FOREST, 0);
  // thorax mid-spin — tilted body contour, one hip thrown out
  pm.contour(38, 16, [3, 6, 8, 10, 11, 12, 12, 12, 12, 11, 11, 10, 9, 8, 6, 4], sh);
  pm.contour(34, 19, [2, 4, 5, 5, 4, 2], shL);
  pm.rect(44, 28, 6, 10, shD);
  pm.hline(30, 38, 14, shDD);
  // iridescent sheen — two deliberate magenta plates (never scatter)
  pm.rect(33, 24, 4, 3, px(RAMP.MAGENTA, 2));
  pm.set(34, 25, px(RAMP.MAGENTA, 3));
  pm.rect(41, 33, 3, 2, px(RAMP.MAGENTA, 1));
  // head thrown back, doing the thing with the eyes
  pm.contour(48, 6, [2, 4, 5, 6, 6, 5], sh);
  pm.hline(46, 7, 4, shL);
  pm.rect(50, 9, 4, 4, px(RAMP.GOLD, 3)); // compound eye, stage-lit
  pm.set(51, 10, C.outline);
  // antennae — one ahead of the beat
  pm.line(48, 5, 42, 0, shD);
  pm.line(52, 5, 58, 1, shD);
  if (wear >= 2) {
    // the showy antenna bends — the rhythm section is struggling
    pm.line(52, 5, 58, 1, T);
    pm.line(52, 5, 57, 6, shD);
    pm.set(58, 7, shD);
  }
  // six legs, mid-choreography: two planted, two kicked, two jazz
  pm.line(32, 40, 22, 54, shD);
  pm.line(22, 54, 20, 64, shDD);
  pm.line(40, 42, 44, 58, shD);
  pm.line(44, 58, 42, 68, shDD);
  pm.line(46, 36, 60, 30, shD); // the kick
  pm.line(60, 30, 70, 26, shDD);
  pm.line(30, 32, 16, 28, shD);
  pm.line(16, 28, 8, 30, shDD);
  pm.line(44, 40, 56, 48, shD);
  pm.line(56, 48, 64, 46, shDD);
  pm.line(28, 36, 18, 42, shD);
  if (wear >= 1) {
    // a clean crack across the thorax plate
    pm.line(34, 26, 42, 30, shDD);
    pm.set(38, 28, C.outline);
  }
  if (wear >= 2) {
    // one leg drags the floor — the dance is mostly memory now
    pm.line(44, 40, 56, 48, T);
    pm.line(44, 40, 52, 56, shD);
    pm.line(52, 56, 54, 66, shDD);
  }
  pm.finish(); // ADR-101
  // motion ticks — pure light after outline (it never stops moving)
  pm.set(24, 14, shL);
  pm.set(22, 16, shL);
  pm.set(58, 44, shL);
  pm.set(60, 42, shL);
  return pm;
}

/**
 * BOSS 2 — IDOL OF THE GILDED GRIN, both §A6 forms off one base so the swap
 * reads as the same body with the warmth gone. SOLID GOLD gleams; HOLLOW is
 * the same silhouette gone dark — a thin shell rim around an absence, the
 * grin now an opening with nothing behind it. The §A11.3 rule shapes the
 * art: nothing about it is funny.
 */
export function drawGildedGrin(wear: WearTier = 0, hollow = false): Pixmap {
  const pm = new Pixmap(100, 96);
  const au = hollow ? px(RAMP.NIGHT, 2) : px(RAMP.GOLD, 2);
  const auL = hollow ? px(RAMP.NIGHT, 3) : px(RAMP.GOLD, 3);
  const auD = hollow ? px(RAMP.NIGHT, 1) : px(RAMP.GOLD, 1);
  const auDD = hollow ? px(RAMP.NIGHT, 0) : px(RAMP.GOLD, 0);
  // the stepped headdress — the pyramid, restated (three tiers, off-center vent)
  pm.rect(34, 2, 32, 7, au);
  pm.rect(26, 9, 48, 8, au);
  pm.rect(18, 17, 64, 9, au);
  pm.hline(35, 2, 18, auL);
  pm.hline(27, 9, 22, auL);
  pm.hline(19, 17, 28, auL);
  pm.rect(60, 4, 4, 3, auD); // the off-center inlay
  if (wear >= 2) {
    // a tier corner gone — the mountain is coming for its gold back
    pm.rect(66, 9, 8, 8, T);
    pm.set(65, 12, auD);
    pm.set(64, 15, auD);
  }
  // the face slab — a squat, wide presence (hand-run jaw taper)
  pm.contour(50, 26, [32, 33, 34, 34, 35, 35, 35, 35, 35, 35, 34, 34, 34, 33, 33, 32, 32, 31, 30, 29, 28, 27, 26, 25, 24, 22, 21, 19, 17, 15], au);
  // plinth feet
  pm.rect(28, 84, 16, 8, auD);
  pm.rect(56, 84, 16, 8, auD);
  pm.hline(29, 84, 14, au);
  pm.hline(57, 84, 14, au);
  // light plane top-left + core shadow lower-right, ONE dither seam each
  pm.contour(34, 28, [8, 10, 11, 11, 10, 8, 6], auL);
  pm.rect(70, 52, 12, 22, auD);
  pm.checker(64, 50, 14, 20, au, auD, 1);
  pm.hline(30, 80, 36, auDD);
  // the eyes: inlaid sockets. SOLID keeps two gold pinpoints deep inside;
  // HOLLOW keeps nothing at all.
  pm.rect(30, 36, 14, 10, C.outline);
  pm.rect(56, 36, 14, 10, C.outline);
  if (!hollow) {
    pm.set(36, 40, px(RAMP.GOLD, 3));
    pm.set(62, 40, px(RAMP.GOLD, 3));
  }
  // the heavy brow
  pm.rect(26, 33, 48, 3, auDD);
  // THE GRIN — wider than the face has any right to hold (it keeps going)
  pm.contour(50, 56, [26, 28, 29, 29, 28, 26, 23, 19, 14], auDD);
  pm.rect(26, 58, 48, 8, C.outline);
  if (!hollow) {
    // square golden teeth, every one polished by somebody's wish
    for (let i = 0; i < 8; i++) pm.rect(28 + i * 6, 59, 4, 6, px(RAMP.GOLD, 1));
    pm.hline(28, 59, 44, px(RAMP.GOLD, 2));
  } else {
    // the grin opens on the inside of the shell — a rim, then nothing
    pm.hline(27, 58, 46, px(RAMP.PURPLE, 1));
    pm.rect(30, 60, 40, 5, C.outline);
  }
  if (wear >= 1) {
    // fissures at the grin's corners — it is held open by habit now
    pm.line(24, 56, 20, 50, auDD);
    pm.line(76, 56, 80, 50, auDD);
    pm.set(21, 51, C.outline);
    pm.set(79, 51, C.outline);
  }
  if (wear >= 2) {
    // the grin itself cracks mid-tooth; the gleam goes out
    pm.line(50, 58, 48, 70, C.outline);
    pm.line(48, 70, 52, 78, auDD);
    if (!hollow) {
      pm.rect(46, 59, 4, 6, auD); // one tooth dulled
    }
  }
  // crossed arms — low, immovable
  pm.rect(24, 70, 52, 7, auD);
  pm.hline(25, 70, 50, au);
  pm.contour(32, 72, [3, 4, 4, 3], auL);
  pm.contour(68, 72, [3, 4, 4, 3], auD);
  pm.finish({ aa: false }); // ADR-101
  if (!hollow && wear < 2) {
    // the gleam — pure light, stamped after outline (never outlined)
    pm.set(24, 30, px(RAMP.PAPER, 3));
    pm.set(40, 4, px(RAMP.PAPER, 3));
  }
  if (hollow) {
    // a cold seep at the seams — the absence leaks (light-after-outline rule)
    pm.set(26, 46, px(RAMP.PURPLE, 2));
    pm.set(74, 44, px(RAMP.PURPLE, 2));
    pm.set(50, 24, px(RAMP.PURPLE, 1));
  }
  return pm;
}

/* ---------------------------------------------------------------- */
/* THE WEAR REGISTRY (S11b) — every §A7 roster enemy maps to a wear-  */
/* capable battle draw, and the validator + wear.test.ts gate it BOTH */
/* directions: a roster enemy without a wear draw and a wear row no   */
/* enemy claims both fail naming the gap. Boot registers all three    */
/* tiers per enemy (ADR-002); BattleScene swaps textures on the hp    */
/* thresholds, never redraws.                                         */

export interface EnemyBattleArt {
  /** the base texture key (EnemyDef.sprite must agree — validator-pinned) */
  sprite: string;
  draw: (wear: WearTier) => Pixmap;
}

/**
 * §A7 Ch.3 (ADR-095) — the live England roster's dev-art faces. Each Ch.3 enemy
 * wears one of the SIX forged Ch.3 faces, grouped by silhouette family (ADR-046),
 * COMPOSED here from the hand-drawn part catalog (parts/index.ts) so every wear
 * tier reads the drums exactly like a forged grunt. These are the canon copies of
 * the forge's Ch.3 picks (the draft FACE_PICKS stays Lab-only, Prime Law 1);
 * bespoke per-enemy silhouettes land in the art pass. The keys agree with each
 * EnemyDef.sprite/.mini (wear-gate pinned both directions).
 */
export const CH3_FACE_SPECS: Record<string, PartsSpec> = {
  battle_ch3_grunt_0: { silhouette: 'blob', material: 'iron', accessory: 'dots', wear: 'dents', region: 'fog', seed: 940144808 },
  battle_ch3_bruiser_1: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 },
  battle_ch3_caster_2: { silhouette: 'totem', material: 'lacquer', accessory: 'cyclops', wear: 'cracks', region: 'fog', seed: 3603594537 },
  battle_ch3_lurker_3: { silhouette: 'wisp', material: 'stone', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 427607496 },
  battle_ch3_grunt_4: { silhouette: 'blob', material: 'cloth', accessory: 'glare', wear: 'dents', region: 'fog', seed: 723260049 },
  battle_ch3_caster_5: { silhouette: 'wisp', material: 'ember', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 3953429982 },
  battle_prefect_drone: { silhouette: 'blob', material: 'cloth', accessory: 'glare', wear: 'dents', region: 'fog', seed: 723260049 },
  battle_possessed_textbook: { silhouette: 'totem', material: 'lacquer', accessory: 'cyclops', wear: 'cracks', region: 'fog', seed: 3603594537 },
  battle_fog_hound: { silhouette: 'wisp', material: 'stone', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 427607496 },
  battle_tea_poltergeist: { silhouette: 'wisp', material: 'ember', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 3953429982 },
  battle_cricket_eleven: { silhouette: 'blob', material: 'iron', accessory: 'dots', wear: 'dents', region: 'fog', seed: 940144808 },
  battle_greenhouse_creeper: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 },
  battle_pillar_box: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 },
  battle_brolly_bat: { silhouette: 'wisp', material: 'stone', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 427607496 },
  battle_moor_sheep: { silhouette: 'blob', material: 'iron', accessory: 'dots', wear: 'dents', region: 'fog', seed: 940144808 },
  battle_soot_imp: { silhouette: 'blob', material: 'iron', accessory: 'dots', wear: 'dents', region: 'fog', seed: 940144808 },
  battle_detention_desk: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 },
  battle_schedule_bell: { silhouette: 'totem', material: 'lacquer', accessory: 'cyclops', wear: 'cracks', region: 'fog', seed: 3603594537 },
  battle_foggy_locker: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 },
  battle_tea_trolley: { silhouette: 'wisp', material: 'ember', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 3953429982 },
  battle_telephone_box: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 },
  battle_overdue_tome: { silhouette: 'totem', material: 'lacquer', accessory: 'cyclops', wear: 'cracks', region: 'fog', seed: 3603594537 },
  battle_roman_sentry: { silhouette: 'wisp', material: 'stone', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 427607496 },
  battle_head_prefect: { silhouette: 'blob', material: 'cloth', accessory: 'glare', wear: 'dents', region: 'fog', seed: 723260049 },
  battle_boiler_golem: { silhouette: 'wisp', material: 'ember', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 3953429982 },
  battle_the_invigilator: { silhouette: 'wisp', material: 'stone', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 427607496 },
};

/** which forged face each Ch.3 enemy wears (its EnemyDef.sprite must agree) */
const CH3_ENEMY_FACE: Record<string, string> = {
  prefect_drone: 'battle_prefect_drone',
  possessed_textbook: 'battle_possessed_textbook',
  fog_hound: 'battle_fog_hound',
  tea_poltergeist: 'battle_tea_poltergeist',
  cricket_eleven: 'battle_cricket_eleven',
  greenhouse_creeper: 'battle_greenhouse_creeper',
  pillar_box: 'battle_pillar_box',
  brolly_bat: 'battle_brolly_bat',
  moor_sheep: 'battle_moor_sheep',
  soot_imp: 'battle_soot_imp',
  detention_desk: 'battle_detention_desk',
  schedule_bell: 'battle_schedule_bell',
  foggy_locker: 'battle_foggy_locker',
  tea_trolley: 'battle_tea_trolley',
  telephone_box: 'battle_telephone_box',
  overdue_tome: 'battle_overdue_tome',
  roman_sentry: 'battle_roman_sentry',
  head_prefect: 'battle_head_prefect',
  boiler_golem: 'battle_boiler_golem',
  the_invigilator: 'battle_the_invigilator',
};

export const ENEMY_BATTLE_ART: Record<string, EnemyBattleArt> = {
  cranky_mailbox: { sprite: 'battle_cranky_mailbox', draw: drawCrankyMailbox },
  runaway_lawnmower: { sprite: 'battle_runaway_lawnmower', draw: drawRunawayLawnmower },
  coily_cicada: { sprite: 'battle_coily_cicada', draw: drawCoilyCicada },

  blazer_smiler: { sprite: 'battle_blazer_smiler', draw: drawBlazerSmiler },
  // S22 (ADR-118): Constable Borden GRAY-BOXES on the Blazer Smiler battler (a
  // blazered Otterbrook adult) — a registry alias, not a new generator. The
  // authored Borden battler/bust is queued in docs/CH1_ART_PROMPTS.md (§4.3).
  borden: { sprite: 'battle_constable_borden', draw: drawBlazerSmiler },
  pigeon_gang: { sprite: 'battle_pigeon_gang', draw: drawPigeonGang },
  hill_slug_deluxe: { sprite: 'battle_hill_slug', draw: drawHillSlugDeluxe },
  titanic_tick: { sprite: 'battle_titanic_tick', draw: drawTitanicTick },
  // ADR-121 — THE HUSH SENTINEL: authored battler (3 wear tiers) lands at
  // battle_hush_sentinel{,_w1,_w2}. The procedural `draw` is just the boot fallback
  // (it never ships — the PNG overrides it); the Tick face is the nearest gray-box.
  hush_sentinel: { sprite: 'battle_hush_sentinel', draw: drawTitanicTick },

  // ADR-119 — the Ch.1 ecosystem to 20. Each owns its OWN battle_<id> key so an
  // authored PNG (docs/CH1_ART_PROMPTS.md §7) drops straight in; the `draw` is a
  // reused generator standing in as the gray-box until that art lands (no new
  // generator — ADR-109 frozen). sprite key MUST match the EnemyDef sprite (S11b).
  sprinkler_sentry: { sprite: 'battle_sprinkler_sentry', draw: drawRunawayLawnmower },
  recycling_raccoon: { sprite: 'battle_recycling_raccoon', draw: drawPigeonGang },
  skeeter_swarm: { sprite: 'battle_skeeter_swarm', draw: drawCoilyCicada },
  unionized_gnome: { sprite: 'battle_unionized_gnome', draw: drawCrankyMailbox },
  mandatory_memo: { sprite: 'battle_mandatory_memo', draw: drawCrankyMailbox },
  motivational_poster: { sprite: 'battle_motivational_poster', draw: drawBlazerSmiler },
  quota_clock: { sprite: 'battle_quota_clock', draw: drawRunawayLawnmower },
  expired_meter: { sprite: 'battle_expired_meter', draw: drawCrankyMailbox },
  showroom_mannequin: { sprite: 'battle_showroom_mannequin', draw: drawBlazerSmiler },
  good_investment: { sprite: 'battle_good_investment', draw: drawPigeonGang },
  rogue_icecream_truck: { sprite: 'battle_rogue_icecream_truck', draw: drawRunawayLawnmower },
  tick_nymph: { sprite: 'battle_tick_nymph', draw: drawCoilyCicada },
  the_suit: { sprite: 'battle_the_suit', draw: drawBlazerSmiler },

  // §A7 Ch.2 (S14) — every quirk drawn, all three wear tiers authored
  pickpocket_parrot: { sprite: 'battle_pickpocket_parrot', draw: drawPickpocketParrot },
  gilded_beetle: { sprite: 'battle_gilded_beetle', draw: drawGildedBeetle },
  cursed_souvenir: { sprite: 'battle_cursed_souvenir', draw: drawCursedSouvenir },
  step_mask: { sprite: 'battle_step_mask', draw: drawStepMask },
  banana_bunch: { sprite: 'battle_banana_bunch', draw: drawBananaBunch },
  jungle_jitterbug: { sprite: 'battle_jungle_jitterbug', draw: drawJungleJitterbug },
  // §A7 Ch.2 EXPANSION — five adopted battlers. The authored PNG overrides at
  // runtime; these frozen draw fns are the never-rendered boot fallback (reused).
  brass_market_mimic: { sprite: 'battle_brass_market_mimic', draw: drawGildedBeetle },
  bronze_mask_guardian: { sprite: 'battle_bronze_mask_guardian', draw: drawStepMask },
  cackling_mask: { sprite: 'battle_cackling_mask', draw: drawStepMask },
  confetti_cannon: { sprite: 'battle_confetti_cannon', draw: drawRunawayLawnmower },
  postage_stampede: { sprite: 'battle_postage_stampede', draw: drawJungleJitterbug },
  gilded_grin: { sprite: 'battle_gilded_grin', draw: (w) => drawGildedGrin(w, false) },
  // BOSS 3 (ADR-099) — HEADMASTER MAINFRAME wears the institutional-watcher face
  // (dev-art: it shares the §A7 lurker silhouette this session; the bespoke server-
  // colossus silhouette is the dedicated art pass, ADR-095 / Prompt 41).
  headmaster_mainframe: { sprite: 'battle_headmaster_mainframe', draw: (w: WearTier) => composeEnemy(CH3_FACE_SPECS.battle_ch3_lurker_3, w) },

  // §A7 Ch.3 (ADR-095) — the England roster, each wearing its forged face
  // (CH3_ENEMY_FACE → CH3_FACE_SPECS), composed through the hand-drawn parts.
  ...Object.fromEntries(
    Object.entries(CH3_ENEMY_FACE).map(([id, faceKey]) => [
      id,
      { sprite: faceKey, draw: (w: WearTier) => composeEnemy(CH3_FACE_SPECS[faceKey], w) },
    ]),
  ),

  // §A7 Ch.4 NORWAY — the snail / gull / berry / Whisperwig wear their OWN authored
  // PNGs (assets/art/enemies/battle_*; wired in authored.ts, all three tiers on disk).
  // The rest GRAY-BOX on a shipped battler (ADR-119 pattern — own EnemyDef, borrowed
  // face) until the art pass paints each one; `draw` is a reused generator standing in
  // as the boot fallback (ADR-109 frozen — no new generators). sprite keys agree with
  // each EnemyDef.sprite (S11b wear-gate, both directions).
  thunder_snail: { sprite: 'battle_thunder_snail', draw: drawHillSlugDeluxe },
  hushed_gull: { sprite: 'battle_fjord_gull_bully', draw: drawPigeonGang },
  hushed_skua: { sprite: 'battle_hushed_skua', draw: drawPigeonGang },
  dog_sized_berry: { sprite: 'battle_giant_berry_blocker', draw: drawHillSlugDeluxe },
  bridge_berry: { sprite: 'battle_giant_berry_blocker', draw: drawHillSlugDeluxe },
  the_whisperwig: { sprite: 'battle_the_whisperwig', draw: drawCursedSouvenir },
  colossal_gnat: { sprite: 'battle_colossal_gnat', draw: drawCoilyCicada },
  snore_gust: { sprite: 'battle_snore_gust', draw: drawCoilyCicada },
  knitting_needles: { sprite: 'battle_knitting_needles', draw: drawCursedSouvenir },
  bog_cotton_wisp: { sprite: 'battle_bog_cotton_wisp', draw: drawCursedSouvenir },
  dream_leech: { sprite: 'battle_dream_leech', draw: drawCursedSouvenir },
  lost_mitten: { sprite: 'battle_lost_mitten', draw: drawCursedSouvenir },
  junior_jotun: { sprite: 'battle_junior_jotun', draw: drawStepMask },
  earwax_golem: { sprite: 'battle_earwax_golem', draw: drawStepMask },
  giant_house_cat: { sprite: 'battle_giant_house_cat', draw: drawStepMask },
  frost_jotun_elder: { sprite: 'battle_frost_jotun_elder', draw: drawStepMask },
  boulder_lichen: { sprite: 'battle_boulder_lichen', draw: drawHillSlugDeluxe },
  moor_midge_cloud: { sprite: 'battle_moor_midge_cloud', draw: drawBananaBunch },
  frost_hare: { sprite: 'battle_frost_hare', draw: drawPickpocketParrot },
  amber_hoard_troll: { sprite: 'battle_amber_hoard_troll', draw: drawGildedBeetle },
  aurora_moth: { sprite: 'battle_aurora_moth', draw: drawJungleJitterbug },

  // §A7 Ch.5 MINIMUS — the seed six + the Flow-Law expansion + BOSS 5. Each owns
  // its OWN battle_<id> key so the authored PNG (docs/CH5_ART_PROMPTS.md) drops
  // straight in; the `draw` is a REUSED generator standing in as the gray-box
  // until that art lands (ADR-109 frozen — no new generators). sprite keys agree
  // with each EnemyDef.sprite (S11b wear-gate, both directions).
  tin_parade: { sprite: 'battle_tin_parade', draw: drawStepMask },
  duelist_pip: { sprite: 'battle_duelist_pip', draw: drawBlazerSmiler },
  crumb_cannoneer: { sprite: 'battle_crumb_cannoneer', draw: drawCrankyMailbox },
  powderwig_wasp: { sprite: 'battle_powderwig_wasp', draw: drawCoilyCicada },
  windup_wyrmlet: { sprite: 'battle_windup_wyrmlet', draw: drawRunawayLawnmower },
  dust_bunny: { sprite: 'battle_dust_bunny', draw: drawHillSlugDeluxe },
  whistle_guard: { sprite: 'battle_whistle_guard', draw: drawBlazerSmiler },
  census_pigeon: { sprite: 'battle_census_pigeon', draw: drawPigeonGang },
  toll_clerk: { sprite: 'battle_toll_clerk', draw: drawBlazerSmiler },
  cobble_mite: { sprite: 'battle_cobble_mite', draw: drawGildedBeetle },
  hedge_sprite: { sprite: 'battle_hedge_sprite', draw: drawJungleJitterbug },
  topiary_knight: { sprite: 'battle_topiary_knight', draw: drawStepMask },
  bramble_tangle: { sprite: 'battle_bramble_tangle', draw: drawBananaBunch },
  lapel_pin_mob: { sprite: 'battle_lapel_pin_mob', draw: drawGildedBeetle },
  town_crier: { sprite: 'battle_town_crier', draw: drawBlazerSmiler },
  snuffbox_beetle: { sprite: 'battle_snuffbox_beetle', draw: drawGildedBeetle },
  tax_assessor: { sprite: 'battle_tax_assessor', draw: drawStepMask },
  halberd_column: { sprite: 'battle_halberd_column', draw: drawBananaBunch },
  bell_ringer_acolyte: { sprite: 'battle_bell_ringer_acolyte', draw: drawCursedSouvenir },
  grand_parade: { sprite: 'battle_grand_parade', draw: drawPigeonGang },
  whiskerzilla: { sprite: 'battle_whiskerzilla', draw: drawHillSlugDeluxe },
  flat_bell: { sprite: 'battle_flat_bell', draw: drawCursedSouvenir },
  // Chapter 6 (Africa) — the authored PNGs override these at boot; the draw fns are
  // only the FROZEN boot fallback (borrowed, never new — CLAUDE.md spritegen freeze).
  caravan_hyena_pack: { sprite: 'battle_caravan_hyena_pack', draw: drawPigeonGang },
  baobab_root_snare: { sprite: 'battle_baobab_root_snare', draw: drawBananaBunch },
  laughing_dust_pot: { sprite: 'battle_laughing_dust_pot', draw: drawCursedSouvenir },
  sphinx_paw_shadow: { sprite: 'battle_sphinx_paw_shadow', draw: drawHillSlugDeluxe },
  // §A7 Ch.6 expansion to twenty — the 16 adopted Africa battlers. Authored PNGs
  // override these at boot; the draw fns are the FROZEN borrowed boot fallback only.
  hollow_jackal: { sprite: 'battle_hollow_jackal', draw: drawPigeonGang },
  dust_devil_charm: { sprite: 'battle_dust_devil_charm', draw: drawJungleJitterbug },
  salt_flat_lurker: { sprite: 'battle_salt_flat_lurker', draw: drawHillSlugDeluxe },
  thornbush_bomber: { sprite: 'battle_thornbush_bomber', draw: drawBananaBunch },
  ribbon_serpent: { sprite: 'battle_ribbon_serpent', draw: drawCoilyCicada },
  canteen_mirage: { sprite: 'battle_canteen_mirage', draw: drawCursedSouvenir },
  trade_salt_heap: { sprite: 'battle_trade_salt_heap', draw: drawHillSlugDeluxe },
  mirage_vendor: { sprite: 'battle_mirage_vendor', draw: drawBlazerSmiler },
  griot_string_snare: { sprite: 'battle_griot_string_snare', draw: drawStepMask },
  town_gossip_troll: { sprite: 'battle_town_gossip_troll', draw: drawBlazerSmiler },
  punchline_head: { sprite: 'battle_punchline_head', draw: drawStepMask },
  echoing_riddle: { sprite: 'battle_echoing_riddle', draw: drawCursedSouvenir },
  laughing_sphinx_riddle: { sprite: 'battle_laughing_sphinx_riddle', draw: drawHillSlugDeluxe },
  rare_riddle_ring: { sprite: 'battle_rare_riddle_ring', draw: drawGildedBeetle },
  sunbaked_idol: { sprite: 'battle_sunbaked_idol', draw: drawStepMask },
  fastest_man_echo: { sprite: 'battle_fastest_man_echo', draw: drawBlazerSmiler },
  laughing_sphinx: { sprite: 'battle_laughing_sphinx', draw: drawHillSlugDeluxe },
  // Chapter 7 (India) — the authored PNGs override these at boot; the draw fns are
  // only the FROZEN boot fallback (borrowed, never new — CLAUDE.md spritegen freeze).
  rickshaw_swarm: { sprite: 'battle_rickshaw_swarm', draw: drawPigeonGang },
  spice_djinn: { sprite: 'battle_spice_djinn', draw: drawCursedSouvenir },
  temple_macaque: { sprite: 'battle_temple_macaque', draw: drawHillSlugDeluxe },
  naga_sentry: { sprite: 'battle_naga_sentry', draw: drawBananaBunch },
  cobra_raja: { sprite: 'battle_cobra_raja', draw: drawHillSlugDeluxe },
};

/**
 * S14 — BOSS FORM ART: phase-machine form swaps land as TEXTURE swaps (the
 * ENEMY_BATTLE_ART law extended to §A6 forms). Each row registers a full
 * wear-tier family at boot; PhaseRunner.spriteFor() builds the live key as
 * EnemyDef.sprite + the form's spriteSuffix, and wearSpriteKey wraps it.
 * The validator walks every BossScriptDef form with a non-empty suffix
 * into this registry, both directions.
 */
export const FORM_ART: Record<string, EnemyBattleArt> = {
  gilded_grin_hollow: { sprite: 'battle_gilded_grin_hollow', draw: (w) => drawGildedGrin(w, true) },
  // §A6 Ch.4 — the Whisperwig's SURFACED form (spriteSuffix '_exposed'): noise drags
  // it out of the ear canal. Authored PNG on disk (battle_the_whisperwig_exposed.png),
  // wired in authored.ts; the gray-box draw is the boot fallback.
  the_whisperwig_exposed: { sprite: 'battle_the_whisperwig_exposed', draw: drawCursedSouvenir },
};

/** the wear-tier texture key battle swaps to (tier 0 = the base sprite) */
export function wearSpriteKey(sprite: string, wear: WearTier): string {
  return wear === 0 ? sprite : `${sprite}_w${wear}`;
}

/**
 * S15g 3b — ENEMY_BATTLE_ART, resolved THROUGH a forged enemy's partsSpec. A
 * picked forged grunt wears the same {sprite, draw:(wear)=>Pixmap} contract as
 * every shipped sprite, except its three tiers are COMPOSED from the hand-drawn
 * part catalog (parts/index.ts) instead of one bespoke draw — so it reads the
 * drums (0/1/2) identically. Returns null for an unpicked draft (it keeps its
 * borrowed placeholder) and for bosses/heroes (always bespoke, never forged).
 */
export function forgedFaceArt(def: { sprite: string; partsSpec?: PartsSpec; boss?: boolean }): EnemyBattleArt | null {
  if (def.boss || !def.partsSpec) return null;
  const spec = def.partsSpec;
  return { sprite: def.sprite, draw: (w) => composeEnemy(spec, w) };
}

/* ---------------------------------------------------------------- */
/* Overworld minis (16×16 roamers) — outlined, one-glance silhouettes */

export function drawCicadaMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const shell = px(RAMP.FOREST, 2);
  pm.ellipse(6, 10, 5, 4, shell);
  pm.ellipse(6, 10, 3, 2, px(RAMP.FOREST, 1)); // the coil
  pm.set(6, 10, shell);
  pm.ellipse(11, 7, 3, 3, px(RAMP.FOREST, 3));
  pm.set(13, 5, px(RAMP.RED, 2)); // red eye
  pm.set(14, 6, px(RAMP.RED, 3));
  pm.line(8, 4, 3, 1, px(RAMP.CYAN, 3)); // wings
  pm.line(9, 5, 4, 3, px(RAMP.CYAN, 2));
  pm.line(6, 13, 4, 15, px(RAMP.FOREST, 1));
  pm.line(9, 13, 9, 15, px(RAMP.FOREST, 1));
  pm.finish(); // ADR-101
  return pm;
}

export function drawSlugMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const body = px(RAMP.GRASS, 1);
  pm.ellipse(7, 11, 6, 4, body);
  pm.ellipse(6, 12, 4, 2, px(RAMP.GRASS, 2));
  pm.hline(3, 14, 9, px(RAMP.GRASS, 3)); // belly foot
  pm.ellipse(12, 8, 3, 3, px(RAMP.GRASS, 2));
  pm.set(13, 4, px(RAMP.PAPER, 3)); // eyes
  pm.set(11, 4, px(RAMP.PAPER, 3));
  pm.vline(13, 5, 2, body);
  pm.vline(11, 5, 2, body);
  pm.hline(11, 3, 3, px(RAMP.GOLD, 2)); // crumb of a crown
  pm.set(12, 2, px(RAMP.GOLD, 3));
  pm.set(2, 14, px(RAMP.CYAN, 3)); // slime glint
  pm.finish(); // ADR-101
  return pm;
}

export function drawMailboxMini(): Pixmap {
  const pm = new Pixmap(16, 20);
  const blue = px(RAMP.BLUE, 2);
  pm.rect(3, 3, 10, 7, blue);
  pm.hline(4, 2, 8, px(RAMP.BLUE, 3));
  pm.vline(3, 3, 7, px(RAMP.BLUE, 3));
  pm.vline(12, 3, 7, px(RAMP.BLUE, 1));
  pm.rect(5, 4, 2, 3, px(RAMP.PAPER, 3)); // glaring whites
  pm.rect(9, 4, 2, 3, px(RAMP.PAPER, 3));
  pm.set(5, 5, C.outline);
  pm.set(9, 5, C.outline);
  pm.rect(5, 8, 6, 1, C.outline); // slot scowl
  pm.set(13, 2, px(RAMP.RED, 2)); // flag
  pm.vline(13, 2, 4, px(RAMP.RED, 1));
  pm.rect(6, 10, 3, 7, px(RAMP.EARTH, 1));
  pm.vline(6, 10, 7, px(RAMP.EARTH, 2));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawMowerMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const red = px(RAMP.RED, 2);
  pm.rect(2, 7, 9, 4, red);
  pm.hline(2, 7, 9, px(RAMP.RED, 3));
  pm.rect(4, 4, 5, 3, px(RAMP.PAPER, 2));
  pm.set(6, 5, C.outline); // the eye
  pm.set(7, 5, px(RAMP.PAPER, 3));
  pm.hline(3, 9, 5, px(RAMP.PAPER, 3)); // grille teeth
  pm.line(11, 7, 14, 3, px(RAMP.PAPER, 0));
  pm.set(14, 2, px(RAMP.PAPER, 1));
  pm.ellipse(4, 12, 2, 2, C.inkSoft);
  pm.ellipse(9, 12, 2, 2, C.inkSoft);
  pm.set(4, 12, px(RAMP.PAPER, 2));
  pm.set(0, 6, px(RAMP.GRASS, 2));
  pm.set(1, 9, px(RAMP.GRASS, 3));
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawPigeonMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const grey = px(RAMP.PAPER, 2);
  pm.ellipse(7, 9, 5, 4, grey);
  pm.ellipse(5, 8, 3, 2, px(RAMP.PAPER, 3));
  pm.ellipse(10, 4, 2, 2, grey);
  pm.set(9, 5, px(RAMP.CYAN, 2)); // neck sheen
  pm.set(10, 6, px(RAMP.FOREST, 2));
  pm.set(12, 4, px(RAMP.GOLD, 2)); // beak
  pm.set(10, 3, C.outline); // eye
  pm.rect(9, 1, 4, 2, px(RAMP.RED, 2)); // the boss's do-rag
  pm.line(3, 9, 1, 11, px(RAMP.PAPER, 0)); // tail
  pm.line(3, 10, 1, 12, px(RAMP.PAPER, 1));
  pm.vline(6, 13, 2, px(RAMP.ORANGE, 2));
  pm.vline(8, 13, 2, px(RAMP.ORANGE, 2));
  pm.finish(); // ADR-101
  return pm;
}

/* ---- §A7 Ch.2 minis (S14) — same one-glance silhouette discipline ---- */

export function drawParrotMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const g = px(RAMP.GRASS, 2);
  pm.ellipse(7, 9, 4, 4, g);
  pm.ellipse(6, 8, 2, 2, px(RAMP.GRASS, 3));
  pm.ellipse(10, 5, 2, 2, g);
  pm.rect(9, 2, 3, 2, px(RAMP.RED, 2)); // the crest
  pm.set(11, 4, C.outline); // eye
  pm.set(13, 6, px(RAMP.GOLD, 2)); // beak
  pm.set(14, 7, px(RAMP.GOLD, 3)); // the coin it is absolutely keeping
  pm.line(4, 6, 1, 3, px(RAMP.GRASS, 1)); // wing
  pm.line(5, 12, 3, 15, px(RAMP.GRASS, 1)); // tail
  pm.vline(9, 13, 2, px(RAMP.GOLD, 1));
  pm.finish(); // ADR-101
  return pm;
}

export function drawBeetleMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const au = px(RAMP.GOLD, 2);
  pm.ellipse(8, 9, 5, 4, au);
  pm.ellipse(7, 8, 3, 2, px(RAMP.GOLD, 3));
  pm.vline(8, 6, 6, px(RAMP.GOLD, 1)); // wing-case seam
  pm.ellipse(3, 10, 2, 2, px(RAMP.EARTH, 1)); // head
  pm.line(2, 8, 0, 5, px(RAMP.GOLD, 1)); // the horn
  pm.set(2, 9, px(RAMP.RED, 2)); // eye
  pm.line(5, 13, 4, 15, px(RAMP.EARTH, 0));
  pm.line(9, 13, 9, 15, px(RAMP.EARTH, 0));
  pm.line(12, 12, 14, 15, px(RAMP.EARTH, 0));
  pm.finish(); // ADR-101
  return pm;
}

export function drawSouvenirMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const stone = px(RAMP.EARTH, 2);
  pm.rect(5, 3, 7, 9, stone);
  pm.hline(5, 3, 7, px(RAMP.EARTH, 3));
  pm.rect(6, 5, 2, 2, px(RAMP.PAPER, 3)); // weepy eyes
  pm.rect(9, 5, 2, 2, px(RAMP.PAPER, 3));
  pm.set(6, 8, px(RAMP.CYAN, 3)); // a tear
  pm.hline(7, 10, 3, C.outline); // the little frown
  pm.rect(4, 12, 9, 3, px(RAMP.EARTH, 1)); // the base
  pm.set(13, 11, px(RAMP.PAPER, 3)); // price tag corner
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawMaskMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const stone = px(RAMP.EARTH, 2);
  pm.rect(3, 4, 11, 9, stone);
  pm.hline(4, 3, 9, stone);
  pm.hline(4, 3, 5, px(RAMP.EARTH, 3));
  pm.rect(5, 6, 3, 2, C.outline); // carved eyes
  pm.rect(10, 6, 3, 2, C.outline);
  pm.set(6, 6, px(RAMP.MAGENTA, 2));
  pm.set(11, 6, px(RAMP.MAGENTA, 2));
  pm.rect(5, 10, 8, 2, px(RAMP.EARTH, 0)); // the calm mouth
  pm.hline(6, 10, 6, px(RAMP.PAPER, 2));
  pm.set(3, 13, px(RAMP.FOREST, 1)); // moss
  pm.finish({ aa: false }); // ADR-101
  return pm;
}

export function drawBananaMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const y2 = px(RAMP.GOLD, 2);
  // three members visible at street scale, leaning together
  pm.line(4, 4, 3, 12, y2);
  pm.line(5, 4, 4, 12, px(RAMP.GOLD, 3));
  pm.line(8, 2, 8, 12, y2);
  pm.line(9, 2, 9, 12, px(RAMP.GOLD, 3));
  pm.line(12, 4, 13, 12, y2);
  pm.set(8, 1, px(RAMP.FOREST, 1)); // stems
  pm.set(4, 3, px(RAMP.FOREST, 1));
  pm.set(12, 3, px(RAMP.FOREST, 1));
  pm.rect(3, 12, 11, 3, px(RAMP.GOLD, 1)); // the crown that unites them
  pm.set(7, 6, C.outline); // the rep's eyes
  pm.set(10, 6, C.outline);
  pm.finish(); // ADR-101
  return pm;
}

export function drawJitterbugMini(): Pixmap {
  const pm = new Pixmap(16, 16);
  const sh = px(RAMP.FOREST, 2);
  pm.ellipse(8, 8, 4, 3, sh);
  pm.ellipse(7, 7, 2, 1, px(RAMP.FOREST, 3));
  pm.set(10, 8, px(RAMP.MAGENTA, 2)); // the sheen plate
  pm.ellipse(12, 4, 2, 2, sh); // head thrown back
  pm.set(13, 4, px(RAMP.GOLD, 3)); // stage-lit eye
  pm.line(11, 2, 9, 0, px(RAMP.FOREST, 1)); // antennae
  pm.line(13, 2, 15, 1, px(RAMP.FOREST, 1));
  pm.line(5, 10, 2, 14, px(RAMP.FOREST, 1)); // legs mid-step
  pm.line(8, 11, 8, 15, px(RAMP.FOREST, 1));
  pm.line(11, 10, 14, 13, px(RAMP.FOREST, 1));
  pm.line(5, 7, 1, 5, px(RAMP.FOREST, 1)); // the kick
  pm.finish(); // ADR-101
  return pm;
}
