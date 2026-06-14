/**
 * BATTLERS — S11b "the caster takes the stage". Each hero gets a full-body
 * REAR-3/4 battle sheet (28×36): seen from behind-left with enough face
 * turned to read — the MOTHER framing, looking UP at the bird. Generated
 * from the SAME CharacterSpec as the overworld sheet (the ADR-021 variant
 * pattern); ADR-022 hand-authored span tables, ADR-025 hairTones, ADR-020
 * rules (pure light after outline, deliberate clustered detail, no scatter).
 * The 24×32 overworld and 32×32 bust sheets stay untouchable law — this is
 * a NEW sheet at stage proportions.
 *
 * The EQUIPPED weapon is composed into the frames at sheet-generation time
 * (spritegen/weapons.ts WEAPON_ART): Jay back-swings HIS bat, Mia winds up
 * HER pan, Milo shoulders the air rifle, Dorin strikes with bead-wrapped
 * fists. Body gear re-dresses the torso (the Champion Jacket reads from
 * behind — CHAMPION across the back). Sheets exist per (hero, look, wear
 * tier): all generated through the boot factory (spritegen/index.ts
 * ensureBattleArt), cached as textures, zero per-frame draws (Prompt 42).
 *
 * Wear tiers (S11b): 0 full · 1 scuffed (<66% displayed HP) · 2 battered
 * (<33%) — mussed hair, a cheek bruise, a torn sleeve with a hanging
 * thread, sweat sheen. Deliberate clustered marks, never noise (ADR-020).
 */
import { Pixmap } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { hairTones, isKid, type CharacterSpec } from './characters';
import { WEAPON_ART, drawHeldWeapon, type HeldPose } from './weapons';

export const BATTLER_W = 28;
export const BATTLER_H = 36;

/** frame indices on every battler sheet — battle/stage.ts speaks these */
export const BATTLER_FRAME = {
  idleA: 0,
  idleB: 1,
  stepA: 2,
  stepB: 3,
  backswing: 4,
  swing: 5,
  aim: 6,
  recoil: 7,
  castA: 8,
  castB: 9,
  pray: 10,
  throwA: 11,
  throwB: 12,
  winded: 13,
} as const;
export type BattlerFrameName = keyof typeof BATTLER_FRAME;

/** battle-damage tier: 0 full · 1 scuffed <66% · 2 battered <33% */
export type WearTier = 0 | 1 | 2;

/** what the hero is wearing — the sheet is generated per look (S11b) */
export interface BattlerLook {
  weapon: string | null;
  body: string | null;
}

export function battlerSheetKey(heroId: string, look: BattlerLook, wear: WearTier): string {
  return `battler_${heroId}_${look.weapon ?? 'none'}_${look.body ?? 'none'}_w${wear}`;
}

export function bustSheetKey(heroId: string, body: string | null, wear: WearTier): string {
  return `bust_${heroId}_${body ?? 'none'}_w${wear}`;
}

/* ================================================================== */
/* construction                                                        */

/**
 * Rear-3/4 skull (kid build — all four heroes): 15 wide × 13 rows,
 * hand-authored [inset, width] off x0 (ADR-022 — drawn dome, never a
 * chamfered rect). The face turns RIGHT: hair mass owns the camera side,
 * skin shows in a right-edge column where the cheek and brow come around.
 */
const REAR_SKULL: Array<readonly [number, number]> = [
  [4, 8],
  [2, 12],
  [1, 14],
  [0, 15],
  [0, 15],
  [0, 15],
  [0, 15],
  [0, 15],
  [0, 15],
  [0, 15],
  [0, 15],
  [1, 13],
  [3, 10],
];

const HEAD_X = 6;
const HEAD_W = 15;
const HEAD_TOP = 2;
const HEAD_ROWS = REAR_SKULL.length;
const CXB = 14; // frame center

type ArmPose = 'rest' | 'wound' | 'swing' | 'aim' | 'up' | 'throwBack' | 'throwOut' | 'heave';
type LegPose = 'stand' | 'stepA' | 'stepB' | 'brace' | 'kneel';

interface BattlerOpts {
  headDx: number;
  headDy: number;
  /** whole-figure drop (kneel) or breath rise */
  bodyDy: number;
  arms: ArmPose;
  legs: LegPose;
  weapon: HeldPose | null;
  /** chin up, eye high — the bird is UP there */
  lookUp: boolean;
  glow: 0 | 1 | 2;
  mouthOpen: boolean;
}

const B_BASE: BattlerOpts = {
  headDx: 0,
  headDy: 0,
  bodyDy: 0,
  arms: 'rest',
  legs: 'stand',
  weapon: 'rest',
  lookUp: false,
  glow: 0,
  mouthOpen: false,
};

/** per-pose grip anchors (frame coords) for the composed weapon */
function gripFor(pose: HeldPose, bodyDy: number): { gx: number; gy: number } {
  switch (pose) {
    case 'back':
      return { gx: 12, gy: 14 + bodyDy };
    case 'strike':
      return { gx: 18, gy: 17 + bodyDy };
    case 'aim':
      return { gx: 16, gy: 15 + bodyDy };
    case 'recoil':
      return { gx: 15, gy: 15 + bodyDy };
    default:
      return { gx: 20, gy: 22 + bodyDy };
  }
}

function drawBattlerFrame(spec: CharacterSpec, look: BattlerLook, wear: WearTier, o: BattlerOpts): Pixmap {
  const pm = new Pixmap(BATTLER_W, BATTLER_H);
  const skin = px(spec.skin, 2);
  const skinL = px(spec.skin, 3);
  const skinD = px(spec.skin, 1);
  const lip = px(spec.skin, 0);
  const { hairB, hair, hairL } = hairTones(spec);

  // the Champion Jacket re-dresses the torso (S11b: gear is never invisible)
  const bodyArt = look.body ? WEAPON_ART[look.body] : undefined;
  const jacket = bodyArt && bodyArt.kind === 'torso' ? bodyArt : null;
  const t = spec.top;
  const gRamp = jacket ? jacket.ramp : t.ramp;
  const gLit = px(gRamp, 3);
  const gBase = px(gRamp, 2);
  const gDark = px(gRamp, 1);
  const sleeve = jacket ? px(jacket.trim, 3) : gBase;
  const sleeveD = jacket ? px(jacket.trim, 1) : gDark;

  const dress = !jacket && t.style === 'dress';
  const kneel = o.legs === 'kneel';
  const drop = o.bodyDy + (kneel ? 6 : 0);
  const hy = HEAD_TOP + o.headDy + drop;
  const hx = HEAD_X + o.headDx;
  const torsoTop = 16 + drop;
  const torsoBot = 25 + drop; // hem row
  const tx = 8;
  const tw = 12;

  /* ---------------- legs (rear view) ---------------- */
  const kid = isKid(spec);
  const shorts = kid && !dress && !spec.longPants;
  const pants = px(spec.bottom.ramp, 2);
  const pantsD = px(spec.bottom.ramp, 1);
  const sock = px(RAMP.PAPER, 3);
  const sole = kid ? px(RAMP.PAPER, 2) : px(spec.shoes, 0);
  const shoe = px(spec.shoes, 1);
  const legRow = (r: number): number => {
    // rows top→bottom (7): shorts/pants ×2, skin ×2, sock ×3 — rear view
    if (dress) return r < 3 ? skin : sock;
    if (shorts) return r < 2 ? pants : r < 4 ? skin : sock;
    if (spec.longPants) return r < 6 ? pants : sock;
    return r < 4 ? pants : sock;
  };
  const drawLeg = (x: number, lift: number): void => {
    const y0 = 26 + drop - lift;
    for (let r = 0; r < 7; r++) pm.rect(x, y0 + r, 4, 1, legRow(r));
    if (!dress && (shorts || spec.longPants)) {
      pm.vline(x, y0, shorts ? 2 : 6, px(spec.bottom.ramp, 3)); // lit seam
      pm.set(x + 3, y0 + 1, pantsD);
    }
    // heel + sole, seen from behind
    pm.rect(x, y0 + 7, 4, 1, shoe);
    pm.rect(x, y0 + 8, 4, 1 + lift, sole);
    pm.set(x, y0 + 8, kid ? sole : px(spec.shoes, 1));
  };
  if (kneel) {
    // folded under: shins flat, soles facing the camera (the kneel's read)
    const ky = 31 + o.bodyDy;
    pm.rect(9, ky, 10, 2, dress ? skin : spec.longPants || shorts ? pants : pants);
    pm.rect(9, ky + 2, 10, 1, dress ? sock : skinD);
    pm.rect(10, ky + 3, 3, 2, sole);
    pm.rect(15, ky + 3, 3, 2, sole);
    pm.hline(10, ky + 3, 3, px(RAMP.PAPER, 1)); // sole tread
    pm.hline(15, ky + 3, 3, px(RAMP.PAPER, 1));
  } else if (o.legs === 'stepA') {
    drawLeg(9, 1);
    drawLeg(15, 0);
  } else if (o.legs === 'stepB') {
    drawLeg(9, 0);
    drawLeg(15, 1);
  } else if (o.legs === 'brace') {
    drawLeg(8, 0);
    drawLeg(16, 0);
  } else {
    drawLeg(9, 0);
    drawLeg(15, 0);
  }

  /* ---------------- torso (rear view) ---------------- */
  if (dress) {
    // bodice then the skirt flares over the hips
    pm.rect(tx + 1, torsoTop, tw - 2, 4, gBase);
    for (let i = 0; i < 8 && !kneel; i++) {
      const grow = Math.min(3, Math.floor(i / 2) + 1);
      pm.hline(tx + 1 - grow, torsoTop + 4 + i, tw - 2 + grow * 2, gBase);
    }
    if (kneel) {
      // the skirt pools around the kneel
      for (let i = 0; i < 6; i++) {
        const grow = Math.min(4, i + 1);
        pm.hline(tx + 1 - grow, torsoTop + 4 + i, tw - 2 + grow * 2, gBase);
      }
      pm.hline(tx - 3, torsoTop + 9, tw + 6, gDark);
    } else {
      pm.hline(tx - 2, torsoTop + 11, tw + 4, gDark); // hem
      pm.set(tx + tw + 1, torsoTop + 11, px(gRamp, 0));
    }
    pm.vline(tx - 1, torsoTop + 6, 5, gLit); // lit left flare
    pm.vline(tx + tw, torsoTop + 6, 5, gDark);
    pm.vline(tx + tw - 2, torsoTop + 5, 6, gDark); // pleat weight (ADR-022)
    if (t.accent !== undefined && !jacket) pm.hline(tx + 1, torsoTop + 3, tw - 2, px(t.accent, 3)); // sash
  } else {
    const h = torsoBot - torsoTop + 1;
    pm.rect(tx, torsoTop, tw, h, gBase);
    // weighted cloth: the camera sees the lit BACK (light is top-left)
    pm.vline(tx, torsoTop, h, gLit);
    pm.vline(tx + 1, torsoTop, 2, gLit);
    pm.vline(tx + tw - 1, torsoTop + 1, h - 1, gDark);
    pm.vline(tx + tw - 2, torsoTop + 3, h - 3, gDark);
    pm.hline(tx, torsoBot, tw, gDark);
    pm.set(tx + tw - 2, torsoBot, px(gRamp, 0)); // hem core corner
    pm.set(tx, torsoTop, T); // shoulder rounding
    pm.set(tx + tw - 1, torsoTop, T);

    if (jacket) {
      // CHAMPION across the back — Sal pressed every letter himself
      const letter = px(jacket.trim, 3);
      for (let i = 0; i < 4; i++) pm.hline(tx + 1 + i * 3, torsoTop + 3, 2, letter);
      pm.hline(tx + 1, torsoTop + 1, tw - 2, px(jacket.trim, 2)); // collar band
      pm.hline(tx, torsoBot - 1, tw, px(jacket.trim, 1)); // waist band
      pm.set(tx + 2, torsoBot - 1, letter); // snap
      pm.set(tx + tw - 3, torsoBot - 1, letter);
    } else {
      switch (t.style) {
        case 'stripe': {
          const acc = px(t.accent ?? RAMP.BLUE, 2);
          pm.hline(tx, torsoTop + 2, tw, acc);
          pm.hline(tx, torsoTop + 3, tw, acc);
          pm.hline(tx, torsoTop + 6, tw, acc);
          pm.hline(tx, torsoTop + 7, tw, acc);
          pm.hline(tx + 2, torsoTop, tw - 4, px(RAMP.PAPER, 3)); // ringer collar
          pm.hline(tx, torsoBot, tw, px(RAMP.INK, 1)); // belt
          break;
        }
        case 'blazer': {
          pm.vline(tx + tw / 2, torsoTop + 1, 8, gDark); // center back seam
          pm.set(tx + tw / 2, torsoBot - 1, px(gRamp, 0)); // vent notch
          if (spec.satchel) {
            pm.line(tx + 1, torsoTop, tx + tw - 2, torsoBot - 2, px(RAMP.EARTH, 1)); // strap
          }
          break;
        }
        case 'gi': {
          const sash = px(t.accent ?? RAMP.GOLD, 2);
          pm.hline(tx, torsoTop + 5, tw, sash);
          pm.hline(tx, torsoTop + 6, tw, px(t.accent ?? RAMP.GOLD, 1));
          // the back knot — monks tie behind
          pm.rect(CXB - 1, torsoTop + 5, 3, 3, sash);
          pm.vline(CXB - 1, torsoTop + 8, 2, px(t.accent ?? RAMP.GOLD, 1)); // tails
          pm.vline(CXB + 1, torsoTop + 8, 1, px(t.accent ?? RAMP.GOLD, 1));
          break;
        }
        case 'shirt': {
          pm.hline(tx + tw / 2 - 2, torsoTop, 4, gDark); // back collar
          pm.hline(tx, torsoBot, tw, px(RAMP.INK, 1)); // belt
          break;
        }
        case 'pajama': {
          const acc = px(t.accent ?? RAMP.CYAN, 2);
          for (let yy = 1; yy < h; yy += 3) pm.hline(tx, torsoTop + yy, tw, acc);
          break;
        }
        case 'apron': {
          // apron straps cross the back
          pm.line(tx + 2, torsoTop, tx + tw - 3, torsoTop + 5, px(RAMP.PAPER, 2));
          pm.line(tx + tw - 3, torsoTop, tx + 2, torsoTop + 5, px(RAMP.PAPER, 2));
          break;
        }
        case 'dress':
          break;
      }
    }
  }

  /* ---------------- arms ---------------- */
  const armSkin = (x: number, y: number, h2: number): void => {
    pm.rect(x, y, 2, h2, skin);
    pm.set(x + 1, y + h2 - 1, skinD);
  };
  const sleeveAt = (x: number, y: number, near: boolean): void => {
    pm.rect(x, y, near ? 3 : 2, 3, sleeve);
    pm.set(x, y, jacket ? px(jacket.trim, 2) : gLit);
    pm.hline(x, y + 2, near ? 3 : 2, sleeveD);
  };
  // beads live on the wrist in EVERY pose — when a frame doesn't pose the
  // weapon (casts, prayers, throws), bead-class art still rides the arm; the
  // bare CAST bracelet covers heroes with no bead item equipped
  const equippedHeld = look.weapon ? WEAPON_ART[look.weapon] : undefined;
  const heldBeads = equippedHeld && equippedHeld.kind === 'held' && equippedHeld.class === 'beads' ? equippedHeld : null;
  const gripOwnsFrame = o.weapon !== null && equippedHeld !== undefined && equippedHeld.kind === 'held';
  const wristBeads = (x: number, y: number): void => {
    if (gripOwnsFrame) return; // the grip draw owns this frame
    if (heldBeads) {
      drawHeldWeapon({ pm, gx: x, gy: y, pose: 'rest' }, heldBeads);
    } else if (spec.beads) {
      pm.set(x, y, px(RAMP.RED, 2));
      pm.set(x + 1, y, px(RAMP.RED, 1));
    }
  };
  switch (o.arms) {
    case 'up': {
      // both arms raised beside the head — the cast (rear view)
      for (const [ax, near] of [
        [5, true],
        [21, false],
      ] as const) {
        pm.rect(ax, hy + 6, near ? 3 : 2, torsoTop - hy - 4, gBase);
        pm.vline(ax, hy + 6, torsoTop - hy - 4, ax === 5 ? gLit : gDark);
        if (jacket) pm.rect(ax, hy + 6, near ? 3 : 2, torsoTop - hy - 4, sleeve);
        pm.rect(ax, hy + 3, near ? 3 : 2, 3, skin); // hands at the crown
        pm.set(ax, hy + 3, skinL);
      }
      wristBeads(6, hy + 6);
      break;
    }
    case 'wound': {
      // both hands together at the left shoulder — the back swing
      sleeveAt(5, torsoTop, true);
      pm.line(7, torsoTop + 2, 11, torsoTop - 2, skin); // near forearm up
      sleeveAt(20, torsoTop, false);
      pm.line(20, torsoTop + 2, 13, torsoTop - 1, skin); // far arm crosses the back
      pm.rect(11, torsoTop - 3, 3, 3, skin); // the grip hands
      pm.set(11, torsoTop - 3, skinL);
      wristBeads(11, torsoTop - 1);
      break;
    }
    case 'swing': {
      // follow-through: near arm whips right
      sleeveAt(5, torsoTop, true);
      pm.line(7, torsoTop + 3, 16, torsoTop + 1, skin);
      pm.rect(17, torsoTop, 3, 3, skin); // lead hands
      pm.set(17, torsoTop, skinL);
      sleeveAt(20, torsoTop + 1, false);
      armSkin(20, torsoTop + 4, 3); // far arm trails
      wristBeads(17, torsoTop + 2);
      break;
    }
    case 'aim': {
      // both hands on the rifle line, stock at the cheek
      sleeveAt(5, torsoTop, true);
      pm.line(7, torsoTop + 2, 13, torsoTop - 1, skin);
      pm.rect(13, torsoTop - 2, 3, 2, skin); // trigger hand
      sleeveAt(20, torsoTop, false);
      pm.line(20, torsoTop + 1, 19, torsoTop - 3, skin);
      pm.rect(19, torsoTop - 4, 2, 2, skin); // forend hand up the barrel
      wristBeads(13, torsoTop - 1);
      break;
    }
    case 'throwBack': {
      // near arm cocked back-down with the goods
      sleeveAt(5, torsoTop + 1, true);
      pm.line(6, torsoTop + 4, 4, torsoTop + 7, skin);
      pm.rect(3, torsoTop + 7, 3, 2, skin);
      pm.set(4, torsoTop + 6, px(RAMP.PAPER, 3)); // the item, palmed
      sleeveAt(20, torsoTop, false);
      armSkin(20, torsoTop + 3, 4);
      wristBeads(4, torsoTop + 8);
      break;
    }
    case 'throwOut': {
      // release — arm flung up-right after the lob
      sleeveAt(5, torsoTop, true);
      armSkin(5, torsoTop + 3, 4);
      sleeveAt(19, torsoTop - 1, false);
      pm.line(20, torsoTop - 1, 23, torsoTop - 5, skin);
      pm.rect(23, torsoTop - 6, 2, 2, skin); // open hand
      wristBeads(23, torsoTop - 4);
      break;
    }
    case 'heave': {
      // winded: hands braced on the knees, shoulders up
      sleeveAt(4, torsoTop + 1, true);
      pm.line(5, torsoTop + 4, 7, torsoTop + 8, skin);
      pm.rect(7, torsoTop + 8, 2, 2, skin);
      sleeveAt(21, torsoTop + 1, false);
      pm.line(21, torsoTop + 4, 19, torsoTop + 8, skin);
      pm.rect(18, torsoTop + 8, 2, 2, skin);
      wristBeads(7, torsoTop + 9);
      break;
    }
    default: {
      // rest: arms at the sides, near arm reads bigger
      sleeveAt(5, torsoTop, true);
      armSkin(5, torsoTop + 3, 5);
      pm.rect(5, torsoTop + 8, 2, 2, skin); // hand
      sleeveAt(20, torsoTop, false);
      armSkin(20, torsoTop + 3, 5);
      pm.rect(20, torsoTop + 8, 2, 2, skin);
      wristBeads(5, torsoTop + 7);
      break;
    }
  }

  /* ---------------- the head (rear-3/4, face turned right) ---------------- */
  const last = HEAD_ROWS - 1;
  const yBot = hy + last;
  // skull base in skin
  REAR_SKULL.forEach(([ins, wd], r) => pm.hline(hx + ins, hy + r, wd, skin));
  // neck — slightly right of center (the head is turned)
  pm.rect(CXB - 1 + o.headDx, yBot + 1, 4, torsoTop - yBot - 1, skin);
  pm.hline(CXB - 1 + o.headDx, yBot + 1, 4, skinD);

  /** hair mass: full crown + the camera side, leaving the right face column */
  const bald = spec.hairStyle === 'gray' || spec.hairStyle === 'none';
  const faceEdge = (r: number): number => {
    // hairline x (exclusive) per row — face shows right of it from row 5
    if (r <= 4) return hx + REAR_SKULL[r][0] + REAR_SKULL[r][1]; // crown: all hair
    if (spec.hairStyle === 'bob') return hx + 11;
    return hx + 10;
  };
  const hatted = spec.hat?.kind === 'cap';
  if (!bald && !hatted) {
    for (let r = 0; r <= (spec.hairStyle === 'topknot' ? 4 : last - 2); r++) {
      const [ins, wd] = REAR_SKULL[r];
      const x0 = hx + ins;
      const x1 = Math.min(hx + ins + wd, faceEdge(r));
      if (x1 > x0) pm.rect(x0, hy + r, x1 - x0, 1, hair);
    }
    // lit arc on the back-of-head curve (we're on the lit side, ADR-025)
    pm.hline(hx + REAR_SKULL[0][0] + 1, hy, 4, hairL);
    pm.hline(hx + REAR_SKULL[1][0] + 1, hy + 1, 3, hairL);
    pm.set(hx + REAR_SKULL[2][0], hy + 2, hairL);
    // hairline seam where hair meets the turned cheek
    for (let r = 5; r <= last - 2; r++) {
      if (spec.hairStyle !== 'topknot') pm.set(faceEdge(r) - 1, hy + r, hairB);
    }
    // nape
    pm.hline(hx + REAR_SKULL[last - 1][0], hy + last - 1, 5, hairB);
  }
  switch (spec.hairStyle) {
    case 'bob': {
      // curtains drape past the jaw on both silhouette edges
      for (let r = 5; r <= last; r++) {
        const [ins] = REAR_SKULL[r];
        pm.rect(hx + ins - 1, hy + r, 2, 1, hair);
      }
      pm.set(hx + REAR_SKULL[last][0] - 1, yBot, hairB); // shaded tip
      pm.set(hx + 11, hy + 5, hairB); // fringe notch coming around
      break;
    }
    case 'topknot': {
      if (!hatted) {
        // the bun, riding high at the back — and its gold tie
        pm.hline(CXB - 2 + o.headDx, hy - 2, 4, hair);
        pm.hline(CXB - 3 + o.headDx, hy - 1, 6, hair);
        pm.set(CXB - 2 + o.headDx, hy - 2, hairL);
        pm.hline(CXB - 2 + o.headDx, hy, 4, hairB); // tie wrap
        if (t.accent !== undefined) pm.set(CXB + 1 + o.headDx, hy - 1, px(t.accent, 2));
        // shaved nape shadow under the crown
        for (let r = 5; r <= 7; r++) pm.rect(hx + REAR_SKULL[r][0], hy + r, 3, 1, hairB);
      }
      break;
    }
    case 'gray': {
      // the horseshoe from behind
      for (let r = 5; r <= last - 1; r++) {
        const [ins] = REAR_SKULL[r];
        pm.rect(hx + ins, hy + r, 4, 1, hair);
      }
      pm.set(hx + REAR_SKULL[1][0] + 2, hy + 1, skinL); // crown shine
      break;
    }
    default:
      break;
  }
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    const capL = px(spec.hat.ramp, 3);
    for (let r = 0; r <= 4; r++) {
      const [ins, wd] = REAR_SKULL[r];
      pm.rect(hx + ins, hy + r, wd, 1, cap);
    }
    pm.hline(hx + REAR_SKULL[0][0] + 1, hy - 1, REAR_SKULL[0][1] - 2, cap); // dome rises into it
    pm.hline(hx + REAR_SKULL[1][0] + 1, hy, 3, capL);
    pm.hline(hx + REAR_SKULL[4][0], hy + 4, REAR_SKULL[4][1], capD); // band
    pm.rect(CXB - 1 + o.headDx, hy - 2, 2, 1, capD); // button
    // the bill pokes out where the face turned — over the right brow
    pm.hline(hx + 11, hy + 4, 7, capL);
    pm.hline(hx + 12, hy + 5, 7, capD);
    if (!bald) {
      // hair under the band: nape mass + sideburn at the ear (ADR-025)
      for (let r = 5; r <= last - 2; r++) {
        const [ins] = REAR_SKULL[r];
        pm.rect(hx + ins, hy + r, 4, 1, hair);
        pm.set(hx + ins, hy + r, r <= 7 ? hairL : hair);
      }
      pm.hline(hx + REAR_SKULL[last - 1][0], hy + last - 1, 4, hairB);
    }
  }
  if (spec.hat?.kind === 'bow') {
    // worn at the back of the head — prominent from behind, left of the part
    const bow = px(spec.hat.ramp, 2);
    pm.rect(hx + 2, hy - 1, 3, 3, bow);
    pm.rect(hx + 6, hy - 1, 3, 3, bow);
    pm.set(hx + 2, hy - 1, T);
    pm.set(hx + 8, hy - 1, T);
    pm.rect(hx + 5, hy, 1, 2, px(spec.hat.ramp, 1)); // knot
  }

  // the turned face: ear at the hair seam, one eye, brow + nose on the edge
  const earX = hx + 11;
  pm.rect(earX, hy + 7, 2, 3, skin);
  pm.set(earX + 1, hy + 8, skinD);
  const eyeY = hy + (o.lookUp ? 5 : 6);
  const ex = hx + 14;
  switch (spec.eyes ?? 'tall') {
    case 'tall':
      pm.rect(ex, eyeY, 2, 3, C.outline);
      pm.set(ex + 1, eyeY, C.white); // catchlight hunts the bird
      break;
    case 'dot':
      pm.rect(ex, eyeY + 1, 2, 2, C.outline);
      pm.set(ex + 1, eyeY + 1, C.white);
      break;
    case 'happy':
      pm.set(ex, eyeY + 1, C.outline);
      pm.set(ex + 1, eyeY, C.outline);
      pm.set(ex + 2, eyeY + 1, C.outline);
      break;
    case 'wide':
      pm.rect(ex - 1, eyeY - 1, 4, 4, C.white);
      pm.rect(ex + 1, eyeY, 2, 2, C.outline);
      break;
    case 'glare':
      pm.rect(ex, eyeY + 1, 2, 2, C.outline);
      pm.hline(ex - 1, eyeY - 1, 4, bald ? skinD : hairB);
      break;
  }
  if (spec.glasses) {
    pm.frame(ex - 1, eyeY - 1, 4, 5, C.inkSoft);
    pm.hline(earX + 1, eyeY + 1, ex - earX - 2, C.inkSoft); // temple arm
    pm.set(ex + 2, eyeY - 1, px(RAMP.CYAN, 3)); // lens glint
  }
  // brow ledge + nose bump on the right silhouette — the 3/4 read
  pm.set(hx + HEAD_W, hy + (o.lookUp ? 5 : 6), skin);
  pm.set(hx + HEAD_W, hy + (o.lookUp ? 7 : 8), skin);
  pm.set(hx + HEAD_W, hy + (o.lookUp ? 8 : 9), skinD); // nostril shadow
  if (spec.blush ?? isKid(spec)) {
    pm.hline(hx + 13, hy + 9, 2, px(RAMP.RED, 3));
  }
  const my = hy + 11;
  if (o.mouthOpen) {
    pm.rect(hx + 13, my - 1, 2, 2, C.outline);
    pm.set(hx + 13, my, px(RAMP.RED, 1));
  } else if ((spec.mouth ?? 'hint') !== 'none') {
    pm.hline(hx + 13, my, 2, lip);
  }
  // brow light + chin shadow following the dome
  pm.hline(hx + REAR_SKULL[1][0] + 1, hy + 1, 2, bald ? skinL : hairL);
  pm.hline(hx + REAR_SKULL[last][0], yBot, REAR_SKULL[last][1] - 4, hatted || bald ? skinD : hairB);

  /* ---------------- the equipped weapon ---------------- */
  if (o.weapon && equippedHeld && equippedHeld.kind === 'held') {
    const { gx, gy } = gripFor(o.weapon, drop);
    drawHeldWeapon({ pm, gx, gy, pose: o.weapon }, equippedHeld);
  }

  /* ---------------- wear pass (S11b — deliberate, clustered) ---------------- */
  if (wear >= 1) {
    // mussed hair: two strays breaking the crown line + a notch
    const stray = bald ? skinD : hair;
    pm.set(hx + 4, hy - 1, stray);
    pm.set(hx + 9, hy - 1, stray);
    if (!bald && !hatted) pm.set(hx + 6, hy, hairB);
    // a scuff on the back — one 2px dirt cluster
    pm.hline(tx + 3, torsoTop + (jacket ? 5 : 4) + 4, 2, px(RAMP.EARTH, 0));
  }
  if (wear >= 2) {
    // the battered tier: torn near sleeve + hanging thread, bruise, sweat
    pm.set(6, torsoTop + 1, skin); // the tear — skin through the sleeve
    pm.set(5, torsoTop + 2, skin);
    pm.set(4, torsoTop + 3, sleeveD); // the thread, hanging on
    pm.hline(hx + 13, hy + 8, 2, px(RAMP.PURPLE, 1)); // cheek bruise
    pm.set(hx + 12, hy + 9, px(RAMP.PURPLE, 1));
    pm.set(hx + 10, hy + 4, px(RAMP.CYAN, 3)); // sweat sheen at the temple
    pm.set(hx + 10, hy + 5, px(RAMP.CYAN, 2));
    pm.hline(tx + 6, torsoTop + 9, 2, px(RAMP.EARTH, 0)); // second scuff
  }

  pm.finish(); // ADR-101

  /* ---- pure light, stamped after the outline (the ADR-021 idiom) ---- */
  if (o.glow > 0) {
    const g3 = px(RAMP.GOLD, 3);
    const g2 = px(RAMP.GOLD, 2);
    pm.hline(CXB - 4, hy - 4, 8, g3);
    pm.set(CXB - 6, hy - 3, g2);
    pm.set(CXB + 5, hy - 3, g2);
    if (o.glow === 2) {
      pm.hline(CXB - 3, hy - 5, 6, C.white);
      pm.set(CXB - 8, hy - 2, g3);
      pm.set(CXB + 7, hy - 2, g3);
    }
  }
  return pm;
}

/** the 14-frame stage set for one hero spec, look, and wear tier */
export function generateBattlerFrames(spec: CharacterSpec, look: BattlerLook, wear: WearTier): Pixmap[] {
  const F = (o: Partial<BattlerOpts>): Pixmap => drawBattlerFrame(spec, look, wear, { ...B_BASE, ...o });
  return [
    F({}), // idleA
    F({ bodyDy: -1 }), // idleB — the inhale
    F({ legs: 'stepA', bodyDy: -1 }), // stepA
    F({ legs: 'stepB', bodyDy: -1 }), // stepB
    F({ arms: 'wound', legs: 'brace', weapon: 'back', headDx: -1, lookUp: true }), // backswing
    F({ arms: 'swing', legs: 'brace', weapon: 'strike', headDx: 1, lookUp: true, mouthOpen: true }), // swing
    F({ arms: 'aim', weapon: 'aim', lookUp: true }), // aim
    F({ arms: 'aim', weapon: 'recoil', headDy: 1, bodyDy: 1 }), // recoil
    F({ arms: 'up', weapon: null, glow: 1, lookUp: true }), // castA
    F({ arms: 'up', weapon: null, glow: 2, headDy: -1, lookUp: true }), // castB
    F({ arms: 'rest', legs: 'kneel', weapon: null, headDy: 1 }), // pray — kneeling
    F({ arms: 'throwBack', weapon: null, headDx: -1, lookUp: true }), // throwA
    F({ arms: 'throwOut', weapon: null, headDx: 1, lookUp: true, mouthOpen: true }), // throwB
    F({ arms: 'heave', headDy: 1, mouthOpen: true }), // winded — hands on knees
  ];
}
