/**
 * BATTLE BUSTS — S11 "The Living Battle". Each hero's party card carries a
 * 32×32 head-and-shoulders portrait generated from the SAME CharacterSpec
 * that builds their overworld sheet (the ADR-021 variant pattern, exactly
 * like the per-hero mourning angels). The 24×32 overworld sheets are
 * untouched law (ADR-009/022); this is a NEW sheet at portrait proportions.
 *
 * Construction rules carried over: ADR-022 hand-authored dome spans (never a
 * chamfered rect), ADR-025 hairTones (EARTH steps one shade darker), ADR-020
 * anti-generation rules — light is stamped AFTER outline() (the Vibe glow,
 * cheer stars), busts float (no ground shadow), facial marks in the deepest
 * skin tone.
 *
 * Sheet order (BUST_FRAME): idle breathing ×2 · act lunge · cast ×2 (arms
 * raised, Vibe glow between the hands) · pray (hands together, eyes closed —
 * §A11.4, played straight) · gadget fiddle · item rummage · munch/drink ·
 * guard brace · hurt flinch · LOW-HP nervous ×2 · DOWN slump · victory
 * cheer ×2. All 16 frames 32×32, 4 columns.
 */
import { Pixmap } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { hairTones, isKid, type CharacterSpec } from './characters';
import { WEAPON_ART } from './weapons';
import type { WearTier } from './battlers';

export const BUST_W = 32;
export const BUST_H = 32;

/** frame indices on every bust sheet — BattleScene's BustView speaks these.
 *  S11b APPENDS winded ×2 (heaving shoulders below 33% displayed HP); the
 *  original 16 indices are contract and never move. */
export const BUST_FRAME = {
  idleA: 0,
  idleB: 1,
  lunge: 2,
  castA: 3,
  castB: 4,
  pray: 5,
  gadget: 6,
  rummage: 7,
  munch: 8,
  guard: 9,
  hurt: 10,
  nervousA: 11,
  nervousB: 12,
  down: 13,
  cheerA: 14,
  cheerB: 15,
  windedA: 16,
  windedB: 17,
} as const;
export type BustFrameName = keyof typeof BUST_FRAME;

/** portrait dome, 18 wide × 14 rows — eased crown, tapered jaw (ADR-022) */
const BUST_SKULL: Array<readonly [number, number]> = [
  [5, 8],
  [3, 12],
  [2, 14],
  [1, 16],
  [0, 18],
  [0, 18],
  [0, 18],
  [0, 18],
  [0, 18],
  [0, 18],
  [0, 18],
  [1, 16],
  [2, 14],
  [3, 12],
];

interface BustOpts {
  headDx: number;
  headDy: number;
  /** -1 = shoulders rise (inhale / slump uses +1) */
  bodyDy: number;
  eyes: 'spec' | 'closed' | 'shut' | 'wide' | 'down' | 'happy' | 'glare';
  mouth: 'spec' | 'open' | 'frown' | 'none' | 'smile' | 'hint';
  armsUp: boolean;
  glow: 0 | 1 | 2;
  clasped: boolean;
  gadget: boolean;
  rummage: boolean;
  munch: boolean;
  guard: boolean;
  /** 0 none, 1 raised, 2 high (+star) */
  fist: 0 | 1 | 2;
  sweat: 0 | 1 | 2;
  slump: boolean;
}

const BASE: BustOpts = {
  headDx: 0,
  headDy: 0,
  bodyDy: 0,
  eyes: 'spec',
  mouth: 'spec',
  armsUp: false,
  glow: 0,
  clasped: false,
  gadget: false,
  rummage: false,
  munch: false,
  guard: false,
  fist: 0,
  sweat: 0,
  slump: false,
};

const HEAD_X = 7;
const HEAD_Y = 2;
const HEAD_W = 18;
const CX = 16;

function drawBustFrame(spec: CharacterSpec, o: BustOpts, body: string | null = null, wear: WearTier = 0): Pixmap {
  const pm = new Pixmap(BUST_W, BUST_H);
  const skin = px(spec.skin, 2);
  const skinL = px(spec.skin, 3);
  const skinD = px(spec.skin, 1);
  const lip = px(spec.skin, 0);
  const { hairB, hair, hairL } = hairTones(spec);
  const t = spec.top;
  // S11b: body gear re-dresses the torso — the Champion Jacket is visible
  // the moment it's equipped (WEAPON_ART 'torso' rows; never invisible again)
  const bodyArt = body ? WEAPON_ART[body] : undefined;
  const jacket = bodyArt && bodyArt.kind === 'torso' ? bodyArt : null;
  const gRamp = jacket ? jacket.ramp : t.ramp;
  const gLit = px(gRamp, 3);
  const gBase = px(gRamp, 2);
  const gDark = px(gRamp, 1);
  // jacket sleeves run in the trim color (varsity white over the red body)
  const armBase = jacket ? px(jacket.trim, 3) : gBase;
  const armLit = jacket ? px(jacket.trim, 2) : gLit;
  const armDark = jacket ? px(jacket.trim, 1) : gDark;

  const hx = HEAD_X + o.headDx;
  const hy = HEAD_Y + o.headDy;
  const last = BUST_SKULL.length - 1;
  const yBot = hy + last;
  const bodyTop = 16 + o.bodyDy + (o.slump ? 1 : 0);

  /* ---------------- torso: shoulders + garment ---------------- */
  const shW = o.slump ? 24 : 26;
  const shX = CX - shW / 2;
  // sloping shoulder rows, then the full chest
  pm.hline(CX - 8, bodyTop, 16, gBase);
  pm.hline(CX - 11, bodyTop + 1, 22, gBase);
  for (let y = bodyTop + 2; y < BUST_H; y++) pm.hline(shX, y, shW, gBase);
  // weighted cloth (ADR-022): lit left edge + chest catch, shaded right side
  for (let y = bodyTop + 1; y < BUST_H; y++) {
    pm.set(shX, y, gLit);
    pm.set(shX + shW - 1, y, gDark);
    pm.set(shX + shW - 2, y, gDark);
  }
  pm.hline(CX - 6, bodyTop, 3, gLit); // shoulder light
  // neck — skin between chin and collar
  pm.rect(CX - 3, bodyTop - 1, 6, 2, skin);
  pm.hline(CX - 3, bodyTop, 6, skinD); // chin shadow on the neck

  // garment styles at portrait scale
  const colY = bodyTop + 2;
  if (jacket) {
    // the varsity front: open panels over the chest, snap trim, rib collar
    const trim3 = px(jacket.trim, 3);
    const trim1 = px(jacket.trim, 1);
    pm.hline(CX - 4, colY - 1, 8, trim3); // rib collar band
    pm.vline(CX - 4, colY, BUST_H - colY, trim1); // panel edges
    pm.vline(CX + 3, colY, BUST_H - colY, trim1);
    pm.vline(CX, colY, BUST_H - colY, trim3); // the zipper line
    pm.set(CX - 2, colY + 2, trim3); // snaps
    pm.set(CX - 2, colY + 5, trim3);
  } else {
  switch (t.style) {
    case 'stripe': {
      const acc = px(t.accent ?? RAMP.BLUE, 2);
      pm.hline(shX, colY + 2, shW, acc);
      pm.hline(shX, colY + 3, shW, acc);
      pm.hline(shX, colY + 7, shW, acc);
      pm.hline(shX, colY + 8, shW, acc);
      pm.set(shX + shW - 1, colY + 2, px(t.accent ?? RAMP.BLUE, 1));
      // ringer collar band around the neckline (v5)
      pm.hline(CX - 4, colY - 1, 8, px(RAMP.PAPER, 3));
      pm.set(CX - 1, colY, px(RAMP.PAPER, 3));
      pm.set(CX, colY, px(RAMP.PAPER, 2));
      break;
    }
    case 'shirt': {
      pm.hline(CX - 5, colY - 1, 3, px(RAMP.PAPER, 3)); // collar wings
      pm.hline(CX + 2, colY - 1, 3, px(RAMP.PAPER, 3));
      pm.set(CX - 1, colY - 1, gDark);
      pm.set(CX, colY - 1, gDark);
      pm.set(CX - 1, colY, gDark); // the V point
      pm.set(CX, colY + 2, px(RAMP.PAPER, 3)); // buttons
      pm.set(CX, colY + 5, px(RAMP.PAPER, 3));
      break;
    }
    case 'dress': {
      pm.hline(CX - 5, colY - 1, 10, skin); // collar line of skin
      if (t.accent !== undefined) pm.hline(shX + 1, colY + 6, shW - 2, px(t.accent, 3)); // sash
      pm.vline(CX - 6, colY + 1, BUST_H - colY - 1, gDark); // bodice pleat
      pm.vline(CX + 5, colY + 2, BUST_H - colY - 2, gDark);
      break;
    }
    case 'blazer': {
      pm.rect(CX - 2, colY - 1, 4, 8, C.white); // shirt
      pm.line(CX - 6, colY - 1, CX - 1, colY + 6, C.inkSoft); // lapels
      pm.line(CX + 5, colY - 1, CX, colY + 6, C.inkSoft);
      const tie = px(t.accent ?? RAMP.RED, 2);
      pm.rect(CX - 1, colY, 2, 6, tie);
      pm.set(CX - 1, colY + 6, px(t.accent ?? RAMP.RED, 1));
      break;
    }
    case 'gi': {
      pm.line(shX + 3, colY - 1, CX, colY + 6, gDark); // crossed collars
      pm.line(shX + shW - 4, colY - 1, CX - 1, colY + 6, gDark);
      pm.line(shX + 4, colY - 1, CX + 1, colY + 6, skin); // chest sliver
      break;
    }
    case 'apron': {
      pm.rect(CX - 5, colY + 1, 10, BUST_H - colY - 1, C.white); // bib
      pm.vline(CX - 5, colY + 1, BUST_H - colY - 1, px(RAMP.PAPER, 2));
      pm.set(CX - 4, colY, px(RAMP.PAPER, 1)); // straps
      pm.set(CX + 3, colY, px(RAMP.PAPER, 1));
      break;
    }
    case 'pajama': {
      const acc = px(t.accent ?? RAMP.CYAN, 2);
      for (let yy = colY + 1; yy < BUST_H; yy += 3) pm.hline(shX, yy, shW, acc);
      break;
    }
  }
  }

  /* ---------------- pose arms / props on the chest ---------------- */
  if (o.armsUp) {
    // both arms raised beside the head, hands open at the crown
    for (const ax of [4, 25]) {
      pm.rect(ax, 7, 3, bodyTop - 6, armBase);
      pm.vline(ax, 7, bodyTop - 6, ax === 4 ? armLit : armDark);
      pm.rect(ax, 4, 3, 3, skin); // hand
      pm.set(ax + 1, 4, skinL);
    }
  }
  if (o.clasped) {
    // hands together at the heart — §A11.4, played straight
    pm.rect(CX - 2, bodyTop + 3, 4, 4, skin);
    pm.vline(CX - 1, bodyTop + 3, 4, skinD); // finger seam
    pm.set(CX - 2, bodyTop + 3, skinL);
    pm.hline(CX - 3, bodyTop + 5, 1, skin); // thumbs
    pm.hline(CX + 2, bodyTop + 5, 1, skin);
  }
  if (o.gadget) {
    // a little machine, mid-fiddle (Milo's whole personality)
    pm.rect(CX - 3, bodyTop + 3, 6, 4, px(RAMP.INK, 1));
    pm.hline(CX - 3, bodyTop + 3, 6, px(RAMP.INK, 2));
    pm.set(CX + 1, bodyTop + 4, px(RAMP.GOLD, 3)); // the blinky light
    pm.rect(CX - 5, bodyTop + 4, 2, 2, skin); // hands on it
    pm.rect(CX + 3, bodyTop + 4, 2, 2, skin);
  }
  if (o.rummage) {
    // one arm dives off-frame into the bag; the other shoulder rides up
    pm.rect(shX + shW - 5, bodyTop + 2, 4, BUST_H - bodyTop - 2, armDark);
    pm.rect(shX + 1, bodyTop + 4, 2, 2, skin); // idle hand
  }
  if (o.munch) {
    pm.rect(CX - 1, yBot - 2, 3, 3, skin); // hand at the mouth
    pm.set(CX, yBot - 3, px(RAMP.GOLD, 2)); // the bite in transit
  }
  if (o.guard) {
    // forearms crossed over the chest
    pm.line(shX + 1, bodyTop + 7, shX + shW - 2, bodyTop + 3, armDark);
    pm.line(shX + 1, bodyTop + 3, shX + shW - 2, bodyTop + 7, armBase);
    pm.rect(shX + shW - 4, bodyTop + 2, 3, 2, skin); // fists at the ends
    pm.rect(shX + 1, bodyTop + 2, 3, 2, skin);
  }
  if (o.fist > 0) {
    // one arm thrown up — the cheer
    const fy = o.fist === 2 ? 1 : 3;
    pm.rect(25, fy + 3, 3, bodyTop - fy - 2, armBase);
    pm.vline(27, fy + 3, bodyTop - fy - 2, armDark);
    pm.rect(25, fy, 3, 3, skin);
    pm.set(25, fy, skinL);
  }

  /* ---------------- the head ---------------- */
  const bald = spec.hairStyle === 'gray' || spec.hairStyle === 'none';
  BUST_SKULL.forEach(([ins, wd], r) => pm.hline(hx + ins, hy + r, wd, skin));
  // brow light following the dome, jaw + chin core shadow
  pm.hline(hx + BUST_SKULL[1][0] + 1, hy + 1, BUST_SKULL[1][1] - 6, skinL);
  pm.hline(hx + BUST_SKULL[2][0] + 1, hy + 2, 3, skinL);
  pm.hline(hx + BUST_SKULL[last][0], yBot, BUST_SKULL[last][1], skinD);
  pm.set(hx + BUST_SKULL[last][0] + 2, yBot, lip);
  pm.set(hx + BUST_SKULL[last][0] + BUST_SKULL[last][1] - 3, yBot, lip);
  pm.set(hx + BUST_SKULL[last - 1][0], yBot - 1, skinD); // jaw turn
  pm.set(hx + BUST_SKULL[last - 1][0] + BUST_SKULL[last - 1][1] - 1, yBot - 1, skinD);
  // ears riding the dome
  pm.rect(hx - 1, hy + 7, 1, 4, skin);
  pm.rect(hx + HEAD_W, hy + 7, 1, 4, skin);
  pm.set(hx - 1, hy + 10, skinD);
  pm.set(hx + HEAD_W, hy + 10, skinD);

  /** paint the top N dome rows (hair/cap crowns) */
  const crown = (rows: number, c: number): void => {
    for (let r = 0; r < rows; r++) pm.hline(hx + BUST_SKULL[r][0], hy + r, BUST_SKULL[r][1], c);
  };

  const hatted = spec.hat?.kind === 'cap';
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    const capL = px(spec.hat.ramp, 3);
    crown(5, cap);
    pm.hline(hx + BUST_SKULL[0][0] + 1, hy - 1, BUST_SKULL[0][1] - 2, cap);
    pm.hline(hx + BUST_SKULL[1][0] + 1, hy, 5, capL); // crown light
    pm.hline(hx + BUST_SKULL[4][0], hy + 4, BUST_SKULL[4][1], capD); // band
    pm.rect(hx + HEAD_W / 2 - 1, hy - 2, 2, 1, capD); // button
    pm.hline(hx - 2, hy + 5, HEAD_W + 4, capL); // brim
    pm.hline(hx - 2, hy + 6, HEAD_W + 4, capD);
    if (!bald) {
      pm.vline(hx, hy + 7, 2, hairB); // sideburn tufts under the brim
      pm.vline(hx + HEAD_W - 1, hy + 7, 2, hairB);
      pm.set(hx + 1, hy + 7, hair);
      pm.set(hx + HEAD_W - 2, hy + 7, hair);
    }
  } else {
    switch (spec.hairStyle) {
      case 'short': {
        crown(5, hair);
        pm.hline(hx + BUST_SKULL[0][0] + 1, hy, 4, hairL);
        pm.hline(hx + BUST_SKULL[1][0] + 1, hy + 1, 2, hairL);
        for (let i = 0; i < HEAD_W; i++) {
          if (i < 2 || i >= HEAD_W - 2 || i % 5 < 3) pm.set(hx + i, hy + 5, hair);
        }
        pm.rect(hx, hy + 6, 1, 3, hair); // sideburns
        pm.rect(hx + HEAD_W - 1, hy + 6, 1, 3, hair);
        break;
      }
      case 'sidepart': {
        crown(5, hair);
        pm.hline(hx + BUST_SKULL[0][0] + 1, hy, 4, hairL);
        const part = Math.floor(HEAD_W * 0.64);
        pm.hline(hx, hy + 5, part, hair);
        pm.hline(hx + 1, hy + 6, Math.floor(HEAD_W / 3), hair);
        pm.hline(hx + 1, hy + 7, 2, hairB); // underside shade
        pm.vline(hx + part, hy + 1, 4, hairB); // the part line
        pm.set(hx + HEAD_W - 1, hy + 4, hair); // flick
        pm.set(hx + HEAD_W - 1, hy + 5, hair);
        pm.rect(hx, hy + 6, 1, 3, hair);
        break;
      }
      case 'bob': {
        crown(6, hair);
        pm.hline(hx + BUST_SKULL[0][0] + 1, hy, 4, hairL);
        pm.hline(hx + BUST_SKULL[1][0] + 1, hy + 1, 2, hairL);
        for (let r = 3; r <= Math.min(11, last); r++) {
          const ins = BUST_SKULL[r][0];
          pm.rect(hx + ins - 1, hy + r, 2, 1, hair);
          pm.rect(hx + BUST_SKULL[r][1] + ins - 1, hy + r, 2, 1, hair);
        }
        pm.set(hx + 1, hy + Math.min(11, last), hairB); // curl tips
        pm.set(hx + HEAD_W - 2, hy + Math.min(11, last), hairB);
        pm.hline(hx + 1, hy + 5, HEAD_W - 2, hair); // full fringe
        pm.set(hx + HEAD_W / 2, hy + 5, hairB); // center notch
        break;
      }
      case 'gray': {
        pm.set(hx + BUST_SKULL[0][0] + 2, hy + 1, skinL); // crown shine
        for (let r = 3; r <= 7; r++) {
          const ins = BUST_SKULL[r][0];
          pm.rect(hx + ins, hy + r, 2, 1, hair);
          pm.rect(hx + ins + BUST_SKULL[r][1] - 2, hy + r, 2, 1, hair);
        }
        pm.set(hx + 1, hy + 8, hairB);
        pm.set(hx + HEAD_W - 2, hy + 8, hairB);
        break;
      }
      case 'topknot': {
        crown(4, hairB);
        pm.hline(CX - 1 + o.headDx, hy - 2, 3, hair); // the bun
        pm.hline(CX - 2 + o.headDx, hy - 1, 5, hair);
        pm.set(CX - 1 + o.headDx, hy - 2, hairL);
        pm.hline(CX - 1 + o.headDx, hy, 3, hairB); // tie wrap
        break;
      }
      case 'none':
        break;
    }
  }
  if (spec.hat?.kind === 'bow') {
    const bow = px(spec.hat.ramp, 2);
    const bx = hx + HEAD_W - 7;
    pm.rect(bx, hy - 2, 3, 3, bow);
    pm.rect(bx + 4, hy - 2, 3, 3, bow);
    pm.set(bx, hy - 2, T);
    pm.set(bx + 6, hy - 2, T);
    pm.rect(bx + 3, hy - 1, 1, 2, px(spec.hat.ramp, 1)); // knot
  }

  /* ---------------- the face ---------------- */
  const eyeY = hy + 7;
  const lx = CX - 5 + o.headDx;
  const rx = CX + 3 + o.headDx;
  const eyeMode = o.eyes === 'spec' ? (spec.eyes ?? 'tall') : o.eyes;
  const eye = (ex: number): void => {
    switch (eyeMode) {
      case 'tall':
        pm.rect(ex, eyeY, 2, 3, C.outline);
        pm.set(ex, eyeY, C.white);
        break;
      case 'dot':
        pm.rect(ex, eyeY + 1, 2, 2, C.outline);
        pm.set(ex, eyeY + 1, C.white);
        break;
      case 'happy':
        pm.set(ex - 1, eyeY + 1, C.outline);
        pm.set(ex, eyeY + 2, C.outline);
        pm.set(ex + 1, eyeY + 2, C.outline);
        pm.set(ex + 2, eyeY + 1, C.outline);
        break;
      case 'wide':
        pm.rect(ex - 1, eyeY - 1, 4, 5, C.white);
        pm.rect(ex, eyeY + 1, 2, 2, C.outline);
        pm.hline(ex - 1, eyeY - 2, 4, skinD);
        break;
      case 'glare':
        pm.rect(ex, eyeY + 1, 2, 2, C.outline);
        pm.hline(ex - 1, eyeY - 1, 4, bald ? skinD : hairB);
        break;
      case 'closed': // resting lashes — pray, sleep, down
        pm.hline(ex - 1, eyeY + 2, 4, lip);
        pm.set(ex - 1, eyeY + 3, skinD);
        pm.set(ex + 2, eyeY + 3, skinD);
        break;
      case 'shut': // squeezed >< — the hurt flinch
        pm.set(ex - 1, eyeY, lip);
        pm.set(ex, eyeY + 1, lip);
        pm.set(ex + 1, eyeY + 2, lip);
        pm.set(ex + 1, eyeY, lip);
        pm.set(ex - 1, eyeY + 2, lip);
        break;
      case 'down': // pupils low — fiddling, rummaging
        pm.rect(ex, eyeY + 2, 2, 2, C.outline);
        pm.set(ex, eyeY + 2, C.white);
        break;
    }
  };
  eye(lx);
  eye(rx);
  if (spec.glasses) {
    pm.frame(lx - 1, eyeY - 1, 4, 5, C.inkSoft);
    pm.frame(rx - 1, eyeY - 1, 4, 5, C.inkSoft);
    pm.hline(lx + 3, eyeY + 1, rx - lx - 4, C.inkSoft);
    pm.set(lx + 2, eyeY - 1, px(RAMP.CYAN, 3));
    pm.set(rx + 2, eyeY - 1, px(RAMP.CYAN, 3));
  }
  // blush + nose (deepest tone — mid shades vanish at game zoom, ADR-023)
  if (spec.blush ?? isKid(spec)) {
    const rosy = px(RAMP.RED, 3);
    const bw = o.munch ? 3 : 2;
    pm.hline(hx + 2, hy + 10, bw, rosy);
    pm.hline(hx + HEAD_W - 2 - bw, hy + 10, bw, rosy);
  }
  pm.set(CX + o.headDx, hy + 10, lip); // nose
  pm.set(CX - 1 + o.headDx, hy + 10, skinD);

  // mouth
  const my = yBot - 1;
  const mouthMode = o.mouth === 'spec' ? (spec.grin ? 'grin' : (spec.mouth ?? 'hint')) : o.mouth;
  switch (mouthMode) {
    case 'hint':
      pm.hline(CX - 1 + o.headDx, my, 2, lip);
      break;
    case 'smile':
      pm.set(CX - 2 + o.headDx, my - 1, lip);
      pm.hline(CX - 1 + o.headDx, my, 2, lip);
      pm.set(CX + 1 + o.headDx, my - 1, lip);
      break;
    case 'open':
      pm.rect(CX - 1 + o.headDx, my - 1, 3, 3, C.outline);
      pm.set(CX - 1 + o.headDx, my, px(RAMP.RED, 1));
      break;
    case 'frown':
      pm.set(CX - 2 + o.headDx, my, lip);
      pm.hline(CX - 1 + o.headDx, my - 1, 2, lip);
      pm.set(CX + 1 + o.headDx, my, lip);
      break;
    case 'grin': {
      const gw = 8;
      pm.rect(CX - 4 + o.headDx, my - 1, gw, 3, C.white);
      pm.frame(CX - 4 + o.headDx, my - 1, gw, 3, C.outline);
      break;
    }
    case 'none':
      break;
  }

  // the nervous sweat bead — liquid catches light, drawn before outline
  if (o.sweat > 0) {
    const sy = o.sweat === 1 ? hy + 4 : hy + 7;
    pm.set(hx + HEAD_W, sy, px(RAMP.CYAN, 3));
    pm.set(hx + HEAD_W, sy + 1, px(RAMP.CYAN, 2));
  }

  /* ---- wear pass (S11b): deliberate clustered damage, never noise ---- */
  const bald2 = spec.hairStyle === 'gray' || spec.hairStyle === 'none';
  if (wear >= 1) {
    if (hatted && spec.hat) {
      // the cap takes it first: a dented crown notch + a wild tuft below
      pm.set(hx + 5, hy - 1, px(spec.hat.ramp, 1));
      if (!bald2) pm.set(hx - 1, hy + 6, hairB);
    } else if (!bald2) {
      // mussed hair: two strays off the crown, a notch in the mass
      pm.set(hx + 4, hy - 1, hair);
      pm.set(hx + 12, hy - 1, hair);
      pm.set(hx + 7, hy, hairB);
    }
    pm.hline(CX - 4, bodyTop + 6, 2, px(RAMP.EARTH, 0)); // chest scuff
  }
  if (wear >= 2) {
    // battered: cheek bruise, torn shoulder + hanging thread, sweat sheen
    pm.hline(hx + 2, hy + 8, 2, px(RAMP.PURPLE, 1));
    pm.set(hx + 3, hy + 9, px(RAMP.PURPLE, 1));
    pm.set(CX - shW / 2 + 1, bodyTop + 2, skin); // the tear
    pm.set(CX - shW / 2 + 2, bodyTop + 3, skin);
    pm.set(CX - shW / 2, bodyTop + 4, armDark); // the thread, hanging on
    pm.set(hx + HEAD_W - 3, hy + 3, px(RAMP.CYAN, 3)); // sweat sheen
    pm.set(hx + HEAD_W - 3, hy + 4, px(RAMP.CYAN, 2));
    pm.hline(CX + 2, bodyTop + 8, 2, px(RAMP.EARTH, 0)); // second scuff
  }

  pm.finish(); // ADR-101

  /* ---- pure light, stamped after the outline (the ADR-021 rule-2 idiom) ---- */
  if (o.glow > 0) {
    // the Vibe glow between the raised hands, arcing over the crown
    const g3 = px(RAMP.GOLD, 3);
    const g2 = px(RAMP.GOLD, 2);
    pm.hline(12, 1, 8, g3);
    pm.set(10, 2, g2);
    pm.set(21, 2, g2);
    pm.set(8, 3, g2);
    pm.set(23, 3, g2);
    if (o.glow === 2) {
      pm.hline(13, 0, 6, C.white); // white-hot on the release beat
      pm.set(11, 1, g3);
      pm.set(20, 1, g3);
      pm.set(6, 2, g3);
      pm.set(25, 2, g3);
    }
  }
  if (o.fist === 2) {
    // a star wrung out of the air — victory
    pm.set(29, 1, px(RAMP.GOLD, 3));
    pm.set(28, 0, px(RAMP.GOLD, 2));
    pm.set(30, 2, px(RAMP.GOLD, 2));
  }
  if (o.clasped) {
    pm.set(CX - 3, bodyTop + 2, px(RAMP.GOLD, 3)); // the faintest warmth
  }
  return pm;
}

/** 18 frames: the full BUST_FRAME state set for one hero spec — generated
 *  per body-gear look and wear tier (S11b; bare look, tier 0 by default so
 *  every pre-S11b call site keeps its exact sheet) */
export function generateBustFrames(spec: CharacterSpec, body: string | null = null, wear: WearTier = 0): Pixmap[] {
  const F = (o: Partial<BustOpts>): Pixmap => drawBustFrame(spec, { ...BASE, ...o }, body, wear);
  return [
    F({}), // idleA
    F({ bodyDy: -1 }), // idleB — the inhale
    F({ headDy: -1, headDx: 1, eyes: 'glare', mouth: 'open' }), // lunge
    F({ armsUp: true, glow: 1 }), // castA
    F({ armsUp: true, glow: 2, headDy: -1 }), // castB
    F({ clasped: true, headDy: 1, eyes: 'closed', mouth: 'hint' }), // pray
    F({ gadget: true, eyes: 'down', mouth: 'hint' }), // gadget fiddle
    F({ rummage: true, headDx: 1, eyes: 'down' }), // item rummage
    F({ munch: true, eyes: 'happy', mouth: 'none' }), // munch/drink
    F({ guard: true, headDy: 1, eyes: 'glare', mouth: 'frown' }), // guard brace
    F({ headDx: -1, headDy: 1, eyes: 'shut', mouth: 'open' }), // hurt flinch
    F({ eyes: 'wide', mouth: 'frown', sweat: 1 }), // nervousA
    F({ headDx: 1, eyes: 'wide', mouth: 'frown', sweat: 2 }), // nervousB
    F({ headDy: 2, bodyDy: 1, slump: true, eyes: 'closed', mouth: 'none' }), // down
    F({ fist: 1, eyes: 'spec', mouth: 'open' }), // cheerA
    F({ fist: 2, headDy: -1, eyes: 'happy', mouth: 'open' }), // cheerB
    // S11b WINDED — heaving shoulders, eyes down, mouth open (the loop the
    // idle becomes below 33% displayed HP; the mortal roll keeps nervous)
    F({ bodyDy: 1, headDy: 2, eyes: 'down', mouth: 'open' }), // windedA — exhale
    F({ bodyDy: -1, eyes: 'down', mouth: 'open', sweat: 2 }), // windedB — inhale
  ];
}

/**
 * The Homesick thought-bubble (§A4.8 card rendering): a little cloud with a
 * steaming plate inside — what {favoritefood} looks like from a thousand
 * miles away. The battle text names the actual food; the bubble is the tell.
 */
/**
 * The hex PIP — the first GOOD-status indicator (S11b): while Shield or
 * Mirror turns remain, this little locked panel rides the card, seated
 * opposite the §A4.8 ailment row so buffs and ailments never collide.
 * Drawn white-lit so the scene can tint it (cyan = shield, paper = mirror).
 */
export function drawHexPip(): Pixmap {
  const pm = new Pixmap(9, 9);
  const c = C.white;
  // a 9px hex, hand-rounded
  pm.hline(3, 0, 3, c);
  pm.hline(2, 1, 5, c);
  pm.hline(1, 2, 7, c);
  pm.rect(0, 3, 9, 3, c);
  pm.hline(1, 6, 7, c);
  pm.hline(2, 7, 5, c);
  pm.hline(3, 8, 3, c);
  // the lock seam — six panels meet in the middle
  pm.set(4, 4, px(RAMP.PAPER, 1));
  pm.set(4, 2, px(RAMP.PAPER, 2));
  pm.set(2, 5, px(RAMP.PAPER, 2));
  pm.set(6, 5, px(RAMP.PAPER, 2));
  pm.finish(); // ADR-101
  return pm;
}

export function drawThoughtFood(): Pixmap {
  const pm = new Pixmap(16, 14);
  const cloud = C.white;
  const shade = px(RAMP.PAPER, 2);
  // the cloud — hand-set rows, scalloped
  pm.hline(4, 0, 8, cloud);
  pm.rect(2, 1, 12, 2, cloud);
  pm.rect(1, 3, 14, 4, cloud);
  pm.rect(2, 7, 12, 2, cloud);
  pm.hline(4, 9, 8, cloud);
  pm.set(2, 7, shade);
  pm.set(13, 8, shade);
  // trailing dots toward the head it came from
  pm.rect(3, 11, 2, 1, cloud);
  pm.set(1, 13, cloud);
  // the plate + the food + the steam
  pm.hline(4, 7, 8, px(RAMP.CYAN, 2)); // plate
  pm.rect(5, 5, 6, 2, px(RAMP.EARTH, 2)); // the main course
  pm.hline(5, 5, 3, px(RAMP.EARTH, 3));
  pm.set(11, 5, px(RAMP.GOLD, 2)); // butter, probably
  pm.set(6, 3, shade); // steam
  pm.set(9, 2, shade);
  pm.finish(); // ADR-101
  return pm;
}
