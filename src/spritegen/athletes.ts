/**
 * SPORT SHEETS — THE CAGE's athletes (S12, ADR-033). One bespoke 32×40
 * multi-frame sheet per athlete, generated from the SAME CharacterSpec as
 * everything else (the ADR-021 variant pattern): ADR-022 hand-authored skull
 * spans, ADR-025 hairTones, ADR-020 rules binding — deliberate clustered
 * pixels, no scatter, shadows never baked (the scene floats a separate
 * un-outlined shadow pip under every athlete, rule-2 clean).
 *
 * Frames author FACING RIGHT; the runtime mirrors with flipX (the sheet has
 * no 'left' — the battler precedent, stated as law in ADR-033). The ball is
 * its own sprite (the sim owns its position); hands pose to meet it.
 *
 * SPORT_FRAME is the contract — HoopsScene speaks these names, tests pin
 * the count and the per-frame distinctness:
 *   dribble idle ×2 · dribble run ×2 · off-ball run ×2 · defensive slide ×2
 *   · gather · jumper rise + readable RELEASE · layup ×2 · THREE dunk
 *   cinematics ×2 each · block leap ×2 · steal swipe · fall (the ankle tax)
 *   · celebration ×2 — 25 frames.
 *
 * Opponents inherit faces too: deriveOpponentSpec() hashes a team id into
 * skin/hair/eyes/mouth variety (ADR-022's "no two faces alike" applied to
 * 31 fives) and the team jersey re-dresses the torso.
 */
import { Pixmap } from './pixmap';
import { RAMP, T, px, C } from '../palette';
import { COURT } from '../hoops/court';
import { hairTones, isKid, type CharacterSpec, type EyeStyle, type MouthStyle, type HairStyle } from './characters';

export const ATHLETE_W = 32;
export const ATHLETE_H = 40;

export const SPORT_FRAME = {
  idleA: 0,
  idleB: 1,
  runA: 2,
  runB: 3,
  offA: 4,
  offB: 5,
  slideA: 6,
  slideB: 7,
  gather: 8,
  rise: 9,
  release: 10,
  layupA: 11,
  layupB: 12,
  dunkAa: 13,
  dunkAb: 14,
  dunkBa: 15,
  dunkBb: 16,
  dunkCa: 17,
  dunkCb: 18,
  blockA: 19,
  blockB: 20,
  steal: 21,
  fall: 22,
  cheerA: 23,
  cheerB: 24,
} as const;
export type SportFrameName = keyof typeof SPORT_FRAME;
export const SPORT_FRAME_COUNT = 25;

/** team kit — when present it re-dresses the torso (heroes/walk-ons play in
 *  their own clothes; the 31 fives play in their TEAMS jersey ramp) */
export interface JerseyOpts {
  ramp: number;
  trim: number;
}

/* ---------------- construction ---------------- */

/**
 * Side-profile skull, facing right: 12 hand-authored [inset, width] rows on
 * a 14px box (ADR-022 — drawn dome, flat occiput left, brow/nose pulled
 * right). The athlete head is the overworld head seen mid-game: same dome
 * language, two pixels leaner.
 */
const SIDE_SKULL: Array<readonly [number, number]> = [
  [4, 7],
  [2, 10],
  [1, 12],
  [0, 13],
  [0, 14],
  [0, 14],
  [0, 14],
  [0, 13],
  [1, 12],
  [1, 11],
  [2, 9],
  [3, 7],
];
const HEAD_W = 14;
const HEAD_ROWS = SIDE_SKULL.length;

type LegPose = 'stand' | 'strideA' | 'strideB' | 'wide' | 'tuck' | 'split' | 'sprawl';
type ArmPose =
  | 'dribble'
  | 'dribbleB'
  | 'pump'
  | 'pumpB'
  | 'guard'
  | 'gather'
  | 'cock'
  | 'release'
  | 'reach'
  | 'windup'
  | 'slam'
  | 'windmill'
  | 'twohand'
  | 'blockup'
  | 'swipe'
  | 'cheer'
  | 'limp';

interface FrameOpts {
  legs: LegPose;
  arms: ArmPose;
  /** whole-figure rise (air frames draw high in the box; z offset is the
   *  scene's job — these keep feet inside the canvas) */
  lift: number;
  lean: number; // head/torso forward lean in px
  mouthOpen: boolean;
  /** lying down (the fall frame rotates the read sideways) */
  prone: boolean;
}

const F_BASE: FrameOpts = { legs: 'stand', arms: 'dribble', lift: 0, lean: 0, mouthOpen: false, prone: false };

function drawAthleteFrame(spec: CharacterSpec, jersey: JerseyOpts | null, o: FrameOpts): Pixmap {
  const pm = new Pixmap(ATHLETE_W, ATHLETE_H);
  const skin = px(spec.skin, 2);
  const skinL = px(spec.skin, 3);
  const skinD = px(spec.skin, 1);
  const { hairB, hair, hairL } = hairTones(spec);
  const chub = (spec.build ?? 'kid') === 'chub';
  const kid = isKid(spec);

  /* ---- the prone read (ankles got him) ---- */
  if (o.prone) {
    // sprawled toward camera-left, sneakers up-right — one deliberate pose
    const gy = 32;
    pm.rect(4, gy, 12, 4, jersey ? px(jersey.ramp, 2) : px(spec.top.ramp, 2)); // torso flat
    pm.rect(2, gy - 1, 6, 5, skin); // head on the asphalt
    pm.hline(3, gy - 2, 4, spec.hairStyle === 'none' ? skin : hair);
    pm.set(4, gy + 1, C.outline); // the one open eye, regretting
    pm.rect(15, gy + 1, 9, 2, px(spec.bottom.ramp, 2)); // legs
    pm.rect(23, gy, 3, 2, px(spec.shoes, 1)); // a sneaker, skyward
    pm.rect(24, gy + 3, 3, 2, px(spec.shoes, 1));
    pm.rect(8, gy - 4, 4, 2, skin); // an arm flung
    pm.outline(C.outline);
    // little dizzy stars — pure light after outline (the ADR-021 idiom)
    pm.set(3, gy - 6, px(RAMP.GOLD, 3));
    pm.set(7, gy - 8, px(RAMP.GOLD, 2));
    return pm;
  }

  const lift = o.lift;
  const hy = 2 - Math.floor(lift / 2) + (o.legs === 'wide' ? 1 : 0);
  const hx = 8 + o.lean;
  const torsoTop = hy + HEAD_ROWS + 1;
  const torsoH = chub ? 9 : 8;
  const torsoBot = torsoTop + torsoH;
  const tw = chub ? 13 : 11;
  const tx = 9;

  /* ---------------- legs (long — athletes use the 40px) ---------------- */
  const pants = px(spec.bottom.ramp, 2);
  const pantsL = px(spec.bottom.ramp, 3);
  const sock = px(RAMP.PAPER, 3);
  const shoe = px(spec.shoes, 1);
  const shoeL = px(spec.shoes, 2);
  const sole = px(RAMP.PAPER, 2);
  const dress = !jersey && spec.top.style === 'dress';
  const shorts = jersey !== null || (kid && !spec.longPants && !dress);
  const legTop = torsoBot + 1;
  const floor = 38;
  /** one leg: thigh (shorts/pants), shin (skin or pants), sock, shoe */
  const leg = (x: number, kneeBend: number, back: boolean): void => {
    const thigh = shorts || dress ? (dress ? skin : pants) : pants;
    const shin = shorts || dress ? skin : spec.longPants ? pants : skin;
    const y0 = legTop;
    const y1 = floor - 3 - kneeBend; // sock top
    const knee = y0 + Math.floor((y1 - y0) * 0.55);
    pm.rect(x, y0, 3, knee - y0, back && thigh === skin ? skinD : thigh);
    if (!shorts && !dress && spec.longPants) pm.vline(x, y0, knee - y0, pantsL);
    pm.rect(x + (kneeBend > 0 ? 1 : 0), knee, 3, y1 - knee, back && shin === skin ? skinD : shin);
    if (spec.socks ?? kid) pm.rect(x + (kneeBend > 0 ? 1 : 0), y1, 3, 2, back ? px(RAMP.PAPER, 2) : sock);
    const sx = x + (kneeBend > 0 ? 1 : 0);
    pm.rect(sx, y1 + 2, 4, 2, back ? px(spec.shoes, 0) : shoe);
    pm.set(sx + 3, y1 + 2, back ? px(spec.shoes, 0) : shoeL);
    pm.hline(sx, y1 + 4 - 1 + 1, 4, sole); // the sole line
  };
  switch (o.legs) {
    case 'strideA':
      leg(10, 0, true);
      leg(15, 3, false);
      break;
    case 'strideB':
      leg(15, 0, true);
      leg(10, 3, false);
      break;
    case 'wide':
      leg(7, 1, true);
      leg(17, 1, false);
      break;
    case 'tuck':
      leg(11, 6, true);
      leg(14, 7, false);
      break;
    case 'split':
      leg(8, 5, true);
      leg(16, 1, false);
      break;
    default:
      leg(11, 0, true);
      leg(14, 0, false);
      break;
  }
  if (shorts && !dress) {
    // shorts hems — the EB kid uniform at game speed (ADR-023)
    const hemY = legTop + 2;
    pm.hline(10, hemY, 7, jersey ? px(jersey.trim, 2) : pantsL);
  }

  /* ---------------- torso ---------------- */
  const topRamp = jersey ? jersey.ramp : spec.top.ramp;
  const gLit = px(topRamp, 3);
  const gBase = px(topRamp, 2);
  const gDark = px(topRamp, 1);
  if (dress) {
    pm.rect(tx, torsoTop, tw - 1, 4, gBase);
    for (let i = 0; i < 5; i++) {
      const grow = Math.min(3, 1 + Math.floor(i / 2));
      pm.hline(tx - grow + 1, torsoTop + 4 + i, tw - 1 + grow, gBase);
    }
    pm.hline(tx - 2, torsoBot, tw + 2, gDark); // hem in motion
    pm.vline(tx, torsoTop + 2, 6, gLit);
    pm.vline(tx + tw - 2, torsoTop + 3, 6, gDark); // pleat weight
  } else {
    pm.rect(tx, torsoTop, tw, torsoH, gBase);
    pm.vline(tx, torsoTop, torsoH, gLit); // lit chest edge (light top-left)
    pm.vline(tx + tw - 1, torsoTop + 1, torsoH - 1, gDark);
    pm.hline(tx, torsoBot - 1, tw, gDark);
    pm.set(tx, torsoTop, T);
    pm.set(tx + tw - 1, torsoTop, T);
    if (jersey) {
      // the tank: armhole scoops + trim bands — a jersey, not a tee
      pm.vline(tx + 1, torsoTop, 2, skin);
      pm.vline(tx + tw - 2, torsoTop, 2, skinD);
      pm.hline(tx + 2, torsoTop, tw - 4, px(jersey.trim, 3)); // collar
      pm.hline(tx, torsoBot - 1, tw, px(jersey.trim, 2)); // waist band
      pm.vline(tx + Math.floor(tw / 2), torsoTop + 2, 3, px(jersey.trim, 2)); // side stripe turned
    } else {
      switch (spec.top.style) {
        case 'stripe': {
          const acc = px(spec.top.accent ?? RAMP.BLUE, 2);
          pm.hline(tx, torsoTop + 2, tw, acc);
          pm.hline(tx, torsoTop + 5, tw, acc);
          pm.hline(tx + 1, torsoTop, tw - 2, px(RAMP.PAPER, 3)); // ringer collar
          break;
        }
        case 'gi': {
          const sash = px(spec.top.accent ?? RAMP.GOLD, 2);
          pm.hline(tx, torsoTop + 4, tw, sash);
          pm.vline(tx + 3, torsoTop, 4, px(RAMP.PAPER, 1)); // lapel line
          break;
        }
        case 'blazer':
          pm.vline(tx + 2, torsoTop, torsoH - 1, gDark); // rolled to play in it
          pm.set(tx + 3, torsoTop + 2, C.white); // the pen survives
          break;
        case 'shirt':
          pm.hline(tx + 3, torsoTop, 4, px(RAMP.PAPER, 3)); // collar wings
          pm.hline(tx, torsoBot - 1, tw, px(RAMP.INK, 1)); // tucked + belt
          break;
        default:
          break;
      }
    }
  }

  /* ---------------- arms (pose first, ball is the scene's) ------------- */
  const sleeve = jersey ? skin : px(topRamp, 2); // tanks bare the arms
  const arm = (x0: number, y0: number, x1: number, y1: number, back: boolean): void => {
    pm.line(x0, y0, x1, y1, back ? skinD : skin);
    pm.line(x0 + (x1 >= x0 ? 1 : -1), y0, x1 + (x1 >= x0 ? 1 : -1), y1, back ? skinD : skin);
    pm.rect(x1 - 1, y1, 3, 2, back ? skinD : skin); // the hand
    if (!jersey && sleeve !== skin) {
      pm.rect(x0 - 1, y0 - 1, 3, 3, back ? px(topRamp, 1) : sleeve); // cap sleeve
    }
  };
  const shL = { x: tx + 1, y: torsoTop + 1 }; // far shoulder (back)
  const shR = { x: tx + tw - 2, y: torsoTop + 1 }; // near shoulder
  switch (o.arms) {
    case 'dribble':
      arm(shL.x, shL.y, shL.x - 2, shL.y + 6, true);
      arm(shR.x, shR.y, shR.x + 4, shR.y + 9, false); // dribbling hand low
      break;
    case 'dribbleB':
      arm(shL.x, shL.y, shL.x - 2, shL.y + 6, true);
      arm(shR.x, shR.y, shR.x + 4, shR.y + 7, false); // hand riding the bounce
      break;
    case 'pump':
      arm(shL.x, shL.y, shL.x + 4, shL.y + 4, true); // pumping front
      arm(shR.x, shR.y, shR.x - 3, shR.y + 5, false); // and back
      break;
    case 'pumpB':
      arm(shL.x, shL.y, shL.x - 3, shL.y + 5, true);
      arm(shR.x, shR.y, shR.x + 4, shR.y + 4, false);
      break;
    case 'guard':
      arm(shL.x, shL.y, shL.x - 4, shL.y + 3, true); // wide, palms out
      arm(shR.x, shR.y, shR.x + 5, shR.y + 2, false);
      break;
    case 'gather':
      arm(shL.x, shL.y, tx + 4, torsoTop + 4, true); // both hands meet the rock
      arm(shR.x, shR.y, tx + 6, torsoTop + 4, false);
      break;
    case 'cock':
      arm(shL.x, shL.y, hx + 3, hy + 1, true); // ball cocked over the brow
      arm(shR.x, shR.y, hx + 8, hy - 1, false);
      break;
    case 'release': {
      // THE release frame — near arm at full extension, wrist snapped
      arm(shL.x, shL.y, shL.x - 2, shL.y + 4, true);
      pm.line(shR.x, shR.y, shR.x + 3, hy - 5, skin);
      pm.line(shR.x + 1, shR.y, shR.x + 4, hy - 5, skin);
      pm.rect(shR.x + 3, hy - 7, 3, 2, skin); // the snapped hand
      pm.set(shR.x + 5, hy - 6, skinL); // fingertips in the light
      break;
    }
    case 'reach':
      arm(shL.x, shL.y, shL.x - 2, shL.y + 5, true);
      pm.line(shR.x, shR.y, shR.x + 5, hy - 3, skin);
      pm.line(shR.x + 1, shR.y, shR.x + 6, hy - 3, skin);
      pm.rect(shR.x + 5, hy - 5, 3, 2, skin); // scooping up
      break;
    case 'windup':
      arm(shL.x, shL.y, shL.x - 3, shL.y + 4, true);
      pm.line(shR.x, shR.y, shR.x + 2, hy - 4, skin); // tomahawk loaded
      pm.rect(shR.x + 1, hy - 6, 3, 2, skin);
      break;
    case 'slam':
      arm(shL.x, shL.y, shL.x - 3, shL.y + 3, true);
      pm.line(shR.x, shR.y, shR.x + 6, torsoTop + 3, skin); // driven THROUGH
      pm.rect(shR.x + 5, torsoTop + 3, 3, 2, skin);
      break;
    case 'windmill':
      arm(shL.x, shL.y, shL.x - 4, shL.y + 2, true);
      pm.line(shR.x, shR.y, shR.x + 1, torsoBot + 2, skin); // mid-circle, low
      pm.rect(shR.x, torsoBot + 2, 3, 2, skin);
      break;
    case 'twohand':
      pm.line(shL.x, shL.y, hx + 2, hy - 5, skinD);
      pm.line(shR.x, shR.y, hx + 9, hy - 5, skin);
      pm.rect(hx + 1, hy - 7, 3, 2, skinD); // both hands on it
      pm.rect(hx + 8, hy - 7, 3, 2, skin);
      break;
    case 'blockup':
      pm.line(shL.x, shL.y, shL.x, hy - 6, skinD);
      pm.line(shR.x, shR.y, shR.x + 1, hy - 7, skin);
      pm.rect(shR.x, hy - 9, 3, 2, skin); // the wall's top brick
      pm.rect(shL.x - 1, hy - 8, 3, 2, skinD);
      break;
    case 'swipe':
      arm(shL.x, shL.y, shL.x - 2, shL.y + 5, true);
      pm.line(shR.x, shR.y + 2, shR.x + 7, shR.y + 4, skin); // the swipe, flat
      pm.line(shR.x, shR.y + 3, shR.x + 7, shR.y + 5, skin);
      pm.rect(shR.x + 6, shR.y + 3, 3, 2, skin);
      break;
    case 'cheer':
      pm.line(shL.x, shL.y, shL.x - 2, hy - 4, skinD);
      pm.line(shR.x, shR.y, shR.x + 3, hy - 5, skin);
      pm.rect(shL.x - 3, hy - 6, 3, 2, skinD);
      pm.rect(shR.x + 2, hy - 7, 3, 2, skin);
      break;
    default:
      arm(shL.x, shL.y, shL.x - 1, shL.y + 6, true);
      arm(shR.x, shR.y, shR.x + 2, shR.y + 6, false);
      break;
  }

  /* ---------------- the head (side profile, facing right) -------------- */
  const last = HEAD_ROWS - 1;
  SIDE_SKULL.forEach(([ins, wd], r) => pm.hline(hx + ins, hy + r, wd, skin));
  // neck
  pm.rect(hx + 6, hy + last + 1, 3, torsoTop - (hy + last + 1), skin);
  const bald = spec.hairStyle === 'gray' || spec.hairStyle === 'none';
  const hatted = spec.hat?.kind === 'cap';
  /** hair mass: crown + occiput; the face owns x ≥ hx+9 (ADR-025 three-tone) */
  const hairMass = (style: HairStyle): void => {
    if (bald) {
      for (let r = 4; r <= 7; r++) pm.rect(hx + SIDE_SKULL[r][0], hy + r, 3, 1, hair); // temple patch
      pm.set(hx + 3, hy + 1, skinL); // crown shine
      return;
    }
    for (let r = 0; r <= last - 3; r++) {
      const [ins, wd] = SIDE_SKULL[r];
      const x1 = Math.min(hx + ins + wd, hx + (r <= 3 ? ins + wd : style === 'bob' ? 10 : 9));
      pm.rect(hx + ins, hy + r, Math.max(0, x1 - (hx + ins)), 1, hair);
    }
    pm.hline(hx + SIDE_SKULL[0][0] + 1, hy, 3, hairL); // lit arc
    pm.set(hx + SIDE_SKULL[1][0], hy + 1, hairL);
    for (let r = 4; r <= last - 3; r++) pm.set(hx + (style === 'bob' ? 9 : 8), hy + r, hairB); // hairline seam
    pm.hline(hx + SIDE_SKULL[last - 2][0], hy + last - 2, 4, hairB); // nape
    if (style === 'bob') {
      for (let r = 4; r <= last - 1; r++) pm.rect(hx + SIDE_SKULL[r][0] - 1, hy + r, 2, 1, hair);
      pm.set(hx + SIDE_SKULL[last - 1][0] - 1, hy + last - 1, hairB); // curl tip
    }
    if (style === 'topknot') {
      pm.hline(hx + 2, hy - 2, 3, hair);
      pm.hline(hx + 1, hy - 1, 5, hair);
      pm.set(hx + 2, hy - 2, hairL);
      pm.hline(hx + 2, hy, 3, hairB); // the tie
    }
    if (style === 'sidepart') {
      pm.hline(hx + 4, hy + 4, 5, hair); // the swoop reaching the brow
      pm.set(hx + 8, hy + 5, hairB);
    }
  };
  hairMass(spec.hairStyle);
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    const capL = px(spec.hat.ramp, 3);
    for (let r = 0; r <= 3; r++) {
      const [ins, wd] = SIDE_SKULL[r];
      pm.rect(hx + ins, hy + r, wd, 1, cap);
    }
    pm.hline(hx + SIDE_SKULL[0][0] + 1, hy - 1, 4, cap);
    pm.set(hx + SIDE_SKULL[1][0] + 1, hy, capL);
    pm.hline(hx + SIDE_SKULL[3][0], hy + 3, SIDE_SKULL[3][1], capD); // band
    pm.hline(hx + 9, hy + 3, 6, capL); // the bill, forward
    pm.hline(hx + 10, hy + 4, 6, capD);
    if (!bald) {
      for (let r = 4; r <= 7; r++) pm.rect(hx + SIDE_SKULL[r][0], hy + r, 3, 1, hair); // nape under the band
    }
  }
  if (spec.hat?.kind === 'bow') {
    const bow = px(spec.hat.ramp, 2);
    pm.rect(hx + 1, hy - 1, 3, 3, bow); // riding the back of the head
    pm.rect(hx + 5, hy - 1, 2, 3, bow);
    pm.set(hx + 4, hy, px(spec.hat.ramp, 1)); // knot
    pm.set(hx + 1, hy - 1, T);
  }
  // the profile face: ear, one eye, brow/nose edge, mouth, blush
  pm.rect(hx + 6, hy + 6, 2, 3, skin);
  pm.set(hx + 7, hy + 7, skinD); // ear
  const eyeY = hy + 5;
  const ex = hx + 10;
  const eyes: EyeStyle = spec.eyes ?? 'tall';
  if (eyes === 'happy') {
    pm.set(ex, eyeY + 1, C.outline);
    pm.set(ex + 1, eyeY, C.outline);
  } else if (eyes === 'glare') {
    pm.rect(ex, eyeY + 1, 2, 2, C.outline);
    pm.hline(ex - 1, eyeY - 1, 3, bald ? skinD : hairB);
  } else if (eyes === 'wide') {
    pm.rect(ex - 1, eyeY - 1, 3, 4, C.white);
    pm.rect(ex, eyeY, 2, 2, C.outline);
  } else {
    pm.rect(ex, eyeY, 2, eyes === 'dot' ? 2 : 3, C.outline);
    pm.set(ex + 1, eyeY, C.white); // catchlight hunts the rim
  }
  if (spec.glasses) {
    pm.frame(ex - 1, eyeY - 1, 4, 5, C.inkSoft);
    pm.hline(hx + 7, eyeY + 1, 2, C.inkSoft);
    pm.set(ex + 2, eyeY - 1, px(RAMP.CYAN, 3));
  }
  pm.set(hx + HEAD_W - 1, hy + 5, skin); // brow ledge
  pm.set(hx + HEAD_W - 1, hy + 7, skin); // nose bump
  pm.set(hx + HEAD_W - 1, hy + 8, skinD); // nostril shadow
  if (spec.blush ?? isKid(spec)) pm.hline(hx + 10, hy + 8, 2, px(RAMP.RED, 3));
  const my = hy + 10;
  const mouth: MouthStyle = spec.mouth ?? 'hint';
  if (o.mouthOpen) {
    pm.rect(hx + 10, my - 1, 2, 2, C.outline);
    pm.set(hx + 10, my, px(RAMP.RED, 1));
  } else if (mouth !== 'none') {
    pm.hline(hx + 10, my, 2, px(spec.skin, 0));
  }
  pm.hline(hx + SIDE_SKULL[last][0], hy + last, SIDE_SKULL[last][1] - 3, skinD); // jaw shadow

  pm.outline(C.outline);
  return pm;
}

/** the 25-frame SPORT SHEET for one spec (+ optional team jersey) */
export function generateAthleteFrames(spec: CharacterSpec, jersey: JerseyOpts | null = null): Pixmap[] {
  const F = (o: Partial<FrameOpts>): Pixmap => drawAthleteFrame(spec, jersey, { ...F_BASE, ...o });
  return [
    F({ legs: 'stand', arms: 'dribble' }), // idleA
    F({ legs: 'stand', arms: 'dribbleB', lift: 1 }), // idleB
    F({ legs: 'strideA', arms: 'dribble', lean: 1 }), // runA
    F({ legs: 'strideB', arms: 'dribbleB', lean: 1 }), // runB
    F({ legs: 'strideA', arms: 'pump', lean: 1 }), // offA
    F({ legs: 'strideB', arms: 'pumpB', lean: 1 }), // offB
    F({ legs: 'wide', arms: 'guard' }), // slideA
    F({ legs: 'wide', arms: 'guard', lift: 1 }), // slideB
    F({ legs: 'stand', arms: 'gather', lean: 1 }), // gather
    F({ legs: 'tuck', arms: 'cock', lift: 2 }), // rise
    F({ legs: 'tuck', arms: 'release', lift: 3, mouthOpen: true }), // RELEASE
    F({ legs: 'split', arms: 'reach', lean: 2 }), // layupA
    F({ legs: 'tuck', arms: 'reach', lift: 3, lean: 2 }), // layupB
    F({ legs: 'tuck', arms: 'windup', lift: 3, mouthOpen: true }), // dunkAa
    F({ legs: 'split', arms: 'slam', lift: 3, lean: 2, mouthOpen: true }), // dunkAb
    F({ legs: 'tuck', arms: 'windmill', lift: 3, lean: 1 }), // dunkBa
    F({ legs: 'tuck', arms: 'slam', lift: 3, lean: 2, mouthOpen: true }), // dunkBb
    F({ legs: 'tuck', arms: 'twohand', lift: 3, mouthOpen: true }), // dunkCa
    F({ legs: 'split', arms: 'slam', lift: 3, lean: 1, mouthOpen: true }), // dunkCb
    F({ legs: 'tuck', arms: 'blockup', lift: 2 }), // blockA
    F({ legs: 'tuck', arms: 'blockup', lift: 4 }), // blockB
    F({ legs: 'wide', arms: 'swipe', lean: 2 }), // steal
    F({ prone: true }), // fall
    F({ legs: 'stand', arms: 'cheer' }), // cheerA
    F({ legs: 'stand', arms: 'cheer', lift: 1, mouthOpen: true }), // cheerB
  ];
}

/* ---------------- opponents: hashed faces in team kits ---------------- */

const OPP_HAIR_RAMPS = [RAMP.INK, RAMP.EARTH, RAMP.BLOND, RAMP.ORANGE] as const;
const OPP_HAIR_STYLES: HairStyle[] = ['short', 'sidepart', 'bob', 'gray', 'short'];
const OPP_EYES: EyeStyle[] = ['tall', 'dot', 'happy', 'glare', 'wide'];
const OPP_MOUTHS: MouthStyle[] = ['hint', 'smile', 'open', 'frown', 'hint'];

/**
 * Five faces per team, no two alike (ADR-022's rule applied to the field),
 * deterministically hashed off the team id — same Classic, same faces,
 * every boot. The jersey is applied at sheet time, not here.
 */
export function deriveOpponentSpec(teamHash: number, slot: number, jersey: number): CharacterSpec {
  const h = (teamHash + slot * 97) >>> 0;
  return {
    skin: h % 3 === 0 ? RAMP.SKIN_DEEP : RAMP.SKIN,
    hair: OPP_HAIR_RAMPS[h % OPP_HAIR_RAMPS.length],
    hairStyle: OPP_HAIR_STYLES[(h >> 2) % OPP_HAIR_STYLES.length],
    top: { ramp: jersey, style: 'shirt' },
    bottom: { ramp: RAMP.PAPER },
    shoes: h % 2 === 0 ? RAMP.RED : RAMP.INK,
    eyes: OPP_EYES[(h >> 4) % OPP_EYES.length],
    mouth: OPP_MOUTHS[(h >> 6) % OPP_MOUTHS.length],
    build: h % 5 === 4 ? 'chub' : 'kid',
    blush: false,
  };
}

/* ---------------- the ball + the net ---------------- */

/** the rock: 7×7, two seams, one deliberate highlight (ADR-020) */
export function drawBall(): Pixmap {
  const pm = new Pixmap(7, 7);
  const o = px(RAMP.ORANGE, 2);
  const oD = px(RAMP.ORANGE, 1);
  const oL = px(RAMP.ORANGE, 3);
  pm.hline(2, 0, 3, o);
  for (let y = 1; y < 6; y++) pm.hline(y === 1 || y === 5 ? 1 : 0, y, y === 1 || y === 5 ? 5 : 7, o);
  pm.hline(2, 6, 3, o);
  pm.hline(2, 3, 3, oD); // lateral seam
  pm.vline(3, 1, 5, oD); // meridian seam
  pm.set(2, 1, oL); // top-left light
  pm.set(1, 2, oL);
  pm.outline(C.outline);
  return pm;
}

/** the floating shadow pip — UN-OUTLINED by rule 2 (it is a shadow) */
export function drawAthleteShadow(): Pixmap {
  const pm = new Pixmap(14, 5);
  const s = px(RAMP.EARTH, 0);
  pm.hline(3, 0, 8, s);
  pm.hline(1, 1, 12, s);
  pm.hline(1, 2, 12, s);
  pm.hline(3, 3, 8, s);
  return pm;
}

/**
 * A cage hoop, side-on (one drawing; the scene mirrors the far end): pole,
 * board with the painted square, BENT rim (street canon), chain net with
 * three ripple frames — net 0 still · 1 splash wide · 2 settling.
 */
export function drawHoopSide(net: 0 | 1 | 2): Pixmap {
  const pm = new Pixmap(30, 64);
  const steel = px(RAMP.PAPER, 1);
  const steelD = px(RAMP.PAPER, 0);
  const boardL = px(RAMP.PAPER, 3);
  const board = px(RAMP.PAPER, 2);
  // pole (planted left) + the gooseneck arm
  pm.rect(2, 8, 3, 56, steel);
  pm.vline(2, 8, 56, px(RAMP.PAPER, 2));
  pm.hline(4, 8, 6, steel);
  // backboard — weathered, the paint square half gone
  pm.rect(9, 2, 4, 26, board);
  pm.vline(9, 2, 26, boardL);
  pm.vline(12, 3, 25, steelD);
  pm.hline(9, 2, 4, boardL);
  pm.rect(12, 12, 1, 8, px(RAMP.RED, 1)); // the square's surviving edge
  // the rim: BENT — droops a pixel as it reaches out (canon)
  pm.hline(13, 18, 10, px(RAMP.ORANGE, 1));
  pm.hline(15, 19, 9, px(RAMP.ORANGE, 2));
  pm.set(23, 19, px(RAMP.ORANGE, 1));
  pm.set(24, 20, px(RAMP.ORANGE, 1)); // the droop
  // chain net (street cages run chain — it SINGS on a swish)
  const chain = px(RAMP.PAPER, 2);
  const chainD = px(RAMP.PAPER, 1);
  const sway = net === 1 ? 2 : net === 2 ? 1 : 0;
  for (let i = 0; i < 4; i++) {
    const x = 15 + i * 3 + (net > 0 && i % 2 === 0 ? sway : 0);
    pm.vline(x, 20, 7 - (i % 2), i % 2 === 0 ? chain : chainD);
    pm.set(x + (i % 2 === 0 ? 1 : -1), 24, chainD); // cross links
  }
  if (net === 1) {
    pm.hline(14, 27, 3, chainD); // the splash kicks the skirt out
    pm.hline(22, 26, 3, chainD);
  }
  pm.outline(C.outline);
  return pm;
}

/* ---------------- the court texture (one big deliberate painting) ------- */

/** scene-space margins around the inbounds rect inside the texture */
export const COURT_PAD = 34;

/**
 * The full cage floor in one texture: sun-worn asphalt (FLAT — rule 1; the
 * wear is five hand-placed crack clusters and two tar patches), hand-painted
 * lines (worn through in runs, never noise), keys, the 2-point arcs, a
 * center circle, and the chain-link ring with bleacher planks at the top.
 */
export function drawCageCourt(): Pixmap {
  const W = COURT.W + COURT_PAD * 2;
  const H = COURT.H + COURT_PAD * 2;
  const pm = new Pixmap(W, H);
  const x0 = COURT_PAD;
  const y0 = COURT_PAD;
  const asphalt = px(RAMP.INK, 2);
  const asphaltD = px(RAMP.INK, 1);
  const paint = px(RAMP.PAPER, 2);
  const paintD = px(RAMP.PAPER, 1);
  pm.fill(asphaltD);
  pm.rect(x0 - COURT.FENCE + 2, y0 - COURT.FENCE + 2, COURT.W + COURT.FENCE * 2 - 4, COURT.H + COURT.FENCE * 2 - 4, asphalt);

  // deliberate wear: five crack clusters + two tar patches (rule 1 — no scatter)
  const crack = (cx: number, cy: number): void => {
    pm.line(cx, cy, cx + 7, cy + 3, asphaltD);
    pm.line(cx + 7, cy + 3, cx + 9, cy + 8, asphaltD);
    pm.line(cx + 3, cy + 1, cx + 2, cy + 6, asphaltD);
  };
  crack(x0 + 90, y0 + 60);
  crack(x0 + 300, y0 + 280);
  crack(x0 + 520, y0 + 90);
  crack(x0 + 180, y0 + 300);
  crack(x0 + 430, y0 + 40);
  pm.rect(x0 + 240, y0 + 150, 16, 9, px(RAMP.INK, 0));
  pm.rect(x0 + 470, y0 + 240, 12, 7, px(RAMP.INK, 0));

  /** worn paint line: breaks mid-run (rule 4 — repetition must break) */
  const worn = (x: number, y: number, w: number, h: number, gapSeed: number): void => {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const k = (x + i) * 13 + (y + j) * 29 + gapSeed;
        if (k % 19 === 3 || k % 23 === 7) continue; // the wear
        pm.set(x + i, y + j, k % 11 === 0 ? paintD : paint);
      }
    }
  };
  // sidelines + baselines
  worn(x0, y0, COURT.W, 2, 1);
  worn(x0, y0 + COURT.H - 2, COURT.W, 2, 2);
  worn(x0, y0, 2, COURT.H, 3);
  worn(x0 + COURT.W - 2, y0, 2, COURT.H, 4);
  // center line + circle
  worn(x0 + COURT.W / 2 - 1, y0, 2, COURT.H, 5);
  const cx = x0 + COURT.W / 2;
  const cy = y0 + COURT.H / 2;
  for (let a = 0; a < 64; a++) {
    const th = (a / 64) * Math.PI * 2;
    const X = Math.round(cx + Math.cos(th) * 34);
    const Y = Math.round(cy + Math.sin(th) * 34);
    if ((X * 13 + Y * 29) % 17 !== 3) pm.set(X, Y, paint);
  }
  // keys + arcs, both ends
  for (const right of [false, true]) {
    const rx = x0 + (right ? COURT.RIM_R_X : COURT.RIM_L_X);
    const ry = y0 + COURT.RIM_Y;
    const dir = right ? -1 : 1;
    const bx = right ? x0 + COURT.W - 2 : x0;
    // the key: two rails + the line across, lane PAINTED in a worn film
    const keyX = right ? rx - (COURT.KEY_D - 20) : bx;
    for (let i = 0; i < COURT.KEY_D - 18; i++) {
      for (let j = 0; j < COURT.KEY_W; j++) {
        const X = keyX + i;
        const Y = ry - COURT.KEY_W / 2 + j;
        if ((X * 7 + Y * 3) % 4 === 0) pm.set(X, Y, px(RAMP.RED, 0)); // faded key fill
      }
    }
    worn(bx, ry - COURT.KEY_W / 2, COURT.KEY_D - 18, 2, 6);
    worn(bx, ry + COURT.KEY_W / 2 - 2, COURT.KEY_D - 18, 2, 7);
    worn(right ? rx - (COURT.KEY_D - 20) : x0 + COURT.KEY_D - 20, ry - COURT.KEY_W / 2, 2, COURT.KEY_W, 8);
    // the 2-point arc
    for (let a = 0; a <= 96; a++) {
      const th = -Math.PI / 2 + (a / 96) * Math.PI;
      const X = Math.round(rx + dir * Math.cos(th) * COURT.ARC_R);
      const Y = Math.round(ry + Math.sin(th) * COURT.ARC_R);
      if (X < x0 + 2 || X > x0 + COURT.W - 3) continue;
      if ((X * 13 + Y * 29) % 13 !== 5) {
        pm.set(X, Y, paint);
        pm.set(X + dir, Y, paintD);
      }
    }
  }

  // the chain-link ring: posts + mesh, drawn as the border band
  const mesh = px(RAMP.PAPER, 1);
  const post = px(RAMP.PAPER, 0);
  const fy0 = y0 - COURT.FENCE;
  const fy1 = y0 + COURT.H + COURT.FENCE - 2;
  const fx0 = x0 - COURT.FENCE;
  const fx1 = x0 + COURT.W + COURT.FENCE - 2;
  for (let x = fx0; x <= fx1; x += 2) {
    if ((x - fx0) % 4 === 0) pm.set(x, fy0, mesh);
    pm.set(x, fy0 + 1, (x - fx0) % 4 === 2 ? mesh : asphaltD);
    if ((x - fx0) % 4 === 0) pm.set(x, fy1, mesh);
    pm.set(x, fy1 + 1, (x - fx0) % 4 === 2 ? mesh : asphaltD);
  }
  for (let y = fy0; y <= fy1; y += 2) {
    if ((y - fy0) % 4 === 0) pm.set(fx0, y, mesh);
    pm.set(fx0 + 1, y, (y - fy0) % 4 === 2 ? mesh : asphaltD);
    if ((y - fy0) % 4 === 0) pm.set(fx1, y, mesh);
    pm.set(fx1 + 1, y, (y - fy0) % 4 === 2 ? mesh : asphaltD);
  }
  for (let x = fx0; x <= fx1 + 1; x += 56) {
    pm.rect(x, fy0, 2, 3, post);
    pm.rect(x, fy1, 2, 3, post);
  }
  for (let y = fy0; y <= fy1 + 1; y += 56) {
    pm.rect(fx0, y, 3, 2, post);
    pm.rect(fx1 - 1, y, 3, 2, post);
  }
  return pm;
}
