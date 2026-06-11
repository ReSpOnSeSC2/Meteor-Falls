/**
 * Character sprite generator v2 — EarthBound proportions, detailed pass.
 *
 * Frames are 24×32 (ADR-009): a hero stands 1.5 tiles wide and 2 tall, the
 * chunky-but-readable EB scale. Light source is top-left everywhere: lit rim
 * on the left, core shadow lower-right, jaw shadow under the head, catchlight
 * in the eyes, 3-tone garments, counter-swinging arms in the walk.
 *
 * Sheet order: down ×4, left ×4, right ×4, up ×4 (stand, stepA, stand, stepB).
 * Left is mirrored from right.
 */
import { Pixmap } from './pixmap';
import { RAMP, T, px, C } from '../palette';

export type HairStyle = 'short' | 'bob' | 'sidepart' | 'topknot' | 'gray' | 'none';
export type TopStyle = 'shirt' | 'stripe' | 'dress' | 'gi' | 'blazer' | 'apron' | 'pajama';
export type Build = 'kid' | 'chub' | 'adult';
/** v4 (ADR-022): EB casts don't share one face — eye + mouth shapes vary */
export type EyeStyle = 'tall' | 'dot' | 'happy' | 'wide' | 'glare';
export type MouthStyle = 'hint' | 'smile' | 'open' | 'frown' | 'none';

/** drawn facings — 'left' never reaches a detail hook; it is mirrored from 'right' */
export type DrawDir = 'down' | 'right' | 'up';
export type WalkPose = 0 | 1 | 2 | 3; // stand, stepA, stand, stepB

/** everything a one-off detail pass needs to land pixels on the right rows */
export interface DetailCtx {
  pm: Pixmap;
  dir: DrawDir;
  pose: WalkPose;
  /** 1 on step frames — head/torso ride one row lower */
  bob: number;
  m: Metrics;
  spec: CharacterSpec;
}

export interface CharacterSpec {
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  hat?: { kind: 'cap' | 'bow'; ramp: number };
  top: { ramp: number; style: TopStyle; accent?: number };
  bottom: { ramp: number };
  shoes: number;
  glasses?: boolean;
  grin?: boolean;
  build?: Build;
  /** silhouette props (ADR-019): a carried frying pan, a satchel strap, a bead bracelet */
  held?: 'pan';
  satchel?: boolean;
  beads?: boolean;
  /** v4 face variety (ADR-022) — defaults: 'tall' eyes, 'hint' mouth */
  eyes?: EyeStyle;
  mouth?: MouthStyle;
  /** v5 (ADR-023): rosy cheeks — kids default true, adults opt in */
  blush?: boolean;
  /** v5: white socks above the sneakers — kids default true */
  socks?: boolean;
  /** v5: kids wear shorts (bare knee + sock) — set this for pajamas etc. */
  longPants?: boolean;
  /**
   * S7c bespoke pass: a hand-placed pixel detail (2–6 px, EB restraint) drawn
   * AFTER the parametric layers and BEFORE outline(). Silhouette stays the
   * read — details may never extend the sprite's bounds (ADR-009 metrics).
   */
  detail?: (ctx: DetailCtx) => void;
}

/** kids get the EB treatment by default: blush, shorts, white socks */
export const isKid = (spec: CharacterSpec): boolean => (spec.build ?? 'kid') !== 'adult';

export const FRAME_W = 24;
export const FRAME_H = 32;

type Dir = DrawDir;
type Pose = WalkPose;

export interface Metrics {
  headX: number;
  headW: number;
  headTop: number; // before bob
  headH: number;
  bodyX: number;
  bodyW: number;
  bodyTop: number;
  bodyH: number;
  hipY: number; // first leg row
  shoeY: number; // first shoe row (of 2)
}

function metrics(spec: CharacterSpec): Metrics {
  const build = spec.build ?? 'kid';
  if (build === 'chub') {
    return { headX: 4, headW: 16, headTop: 2, headH: 13, bodyX: 5, bodyW: 14, bodyTop: 15, bodyH: 10, hipY: 25, shoeY: 29 };
  }
  if (build === 'adult') {
    return { headX: 6, headW: 13, headTop: 1, headH: 12, bodyX: 6, bodyW: 12, bodyTop: 13, bodyH: 12, hipY: 25, shoeY: 29 };
  }
  return { headX: 5, headW: 14, headTop: 2, headH: 13, bodyX: 6, bodyW: 12, bodyTop: 15, bodyH: 10, hipY: 25, shoeY: 29 };
}

/**
 * v4 skulls (ADR-022): hand-authored [inset, width] rows per build — DRAWN
 * dome curves with eased run steps (8→12→14, taper 12→10 at the jaw), not
 * chamfered rectangles. Row count equals each build's headH. The SIDE
 * tables are asymmetric: flat at the back of the head, chin pulled forward.
 */
type Spans = Array<readonly [number, number]>;
const SKULL_FRONT: Record<Build, Spans> = {
  kid: [[3, 8], [1, 12], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [1, 12], [1, 12], [2, 10]],
  chub: [[4, 8], [2, 12], [1, 14], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [1, 14], [2, 12]],
  adult: [[3, 7], [1, 11], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [1, 11], [2, 9]],
};
const SKULL_SIDE: Record<Build, Spans> = {
  kid: [[3, 8], [1, 12], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 13], [2, 11], [4, 8]],
  chub: [[4, 8], [2, 12], [1, 14], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [0, 16], [0, 15], [1, 14], [3, 11]],
  adult: [[3, 7], [1, 11], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 12], [1, 11], [3, 8]],
};

function drawSkull(pm: Pixmap, x0: number, y0: number, spans: Spans, c: number): void {
  spans.forEach(([ins, wd], r) => pm.hline(x0 + ins, y0 + r, wd, c));
}

/* ================================================================== */
/* FRONT / BACK                                                        */

function headFront(pm: Pixmap, spec: CharacterSpec, m: Metrics, bob: number, back: boolean): void {
  const skin = px(spec.skin, 2);
  const skinL = px(spec.skin, 3);
  const skinD = px(spec.skin, 1);
  const hairB = px(spec.hair, 1);
  const hair = px(spec.hair, 2);
  const hairL = px(spec.hair, 3);
  const y0 = m.headTop + bob;
  const x0 = m.headX;
  const w = m.headW;
  const yBot = y0 + m.headH - 1;
  const spans = SKULL_FRONT[spec.build ?? 'kid'];
  const last = m.headH - 1;
  // gray/none show scalp from behind; everyone else is a hair dome back-on
  const bald = spec.hairStyle === 'gray' || spec.hairStyle === 'none';

  // the skull — a drawn dome (ADR-022), never a chamfered box
  drawSkull(pm, x0, y0, spans, back && !bald ? hair : skin);
  /** paint the top N dome rows in a color (hair crowns, cap crowns) */
  const crown = (rows: number, c: number): void => {
    for (let r = 0; r < rows; r++) pm.hline(x0 + spans[r][0], y0 + r, spans[r][1], c);
  };
  /** fill dome rows from r0 down (back-of-head hair) */
  const fillFrom = (r0: number, c: number): void => {
    for (let r = r0; r <= last; r++) pm.hline(x0 + spans[r][0], y0 + r, spans[r][1], c);
  };

  if (!back) {
    // brow light following the dome, cheeks, jaw + chin core shadow
    pm.hline(x0 + spans[1][0] + 1, y0 + 1, spans[1][1] - 5, skinL);
    pm.hline(x0 + spans[2][0] + 1, y0 + 2, 3, skinL);
    pm.hline(x0 + spans[last][0], yBot, spans[last][1], skinD);
    pm.set(x0 + spans[last][0] + 1, yBot, px(spec.skin, 0));
    pm.set(x0 + spans[last][0] + spans[last][1] - 2, yBot, px(spec.skin, 0));
    pm.set(x0 + spans[last - 1][0], yBot - 1, skinD); // jaw turn
    pm.set(x0 + spans[last - 1][0] + spans[last - 1][1] - 1, yBot - 1, skinD);
    // cheek light under each eye
    pm.set(x0 + 2, y0 + 9, skinL);
    pm.set(x0 + w - 3, y0 + 9, skinL);
    // v5 (ADR-023): rosy cheeks + a nose dot — the EB face essentials.
    // The nose is the DEEP skin tone (mid-shade vanished at game zoom).
    if (spec.blush ?? isKid(spec)) {
      const rosy = px(RAMP.RED, 3);
      pm.hline(x0 + 2, y0 + 10, 2, rosy);
      pm.hline(x0 + w - 4, y0 + 10, 2, rosy);
    }
    pm.set(x0 + Math.floor(w / 2), y0 + 10, px(spec.skin, 0)); // nose
    pm.set(x0 + Math.floor(w / 2) - 1, y0 + 10, skinD); // nose AA
    // little ears riding the dome
    pm.rect(x0 - 1, y0 + 7, 1, 3, skin);
    pm.rect(x0 + w, y0 + 7, 1, 3, skin);
    pm.set(x0 - 1, y0 + 9, skinD);
    pm.set(x0 + w, y0 + 9, skinD);
  }

  const hatted = spec.hat?.kind === 'cap';
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    const capL = px(spec.hat.ramp, 3);
    crown(5, cap);
    pm.hline(x0 + spans[0][0] + 1, y0 - 1, spans[0][1] - 2, cap); // the dome rises into it
    pm.hline(x0 + spans[1][0] + 1, y0, 4, capL); // crown light
    pm.hline(x0 + spans[4][0], y0 + 4, spans[4][1], capD); // band hugs the dome
    pm.rect(x0 + Math.floor(w / 2) - 1, y0 - 2, 2, 1, capD); // button
    // brim: wider than the head, darker underside
    pm.hline(x0 - 2, y0 + 5, w + 4, back ? cap : capL);
    pm.hline(x0 - 2, y0 + 6, w + 4, capD);
    if (!back && spec.hairStyle !== 'none' && spec.hairStyle !== 'gray') {
      // hair under the brim — sideburn tufts, not lone pixels
      pm.vline(x0, y0 + 7, 2, hairB);
      pm.vline(x0 + w - 1, y0 + 7, 2, hairB);
      pm.set(x0 + 1, y0 + 7, hair);
      pm.set(x0 + w - 2, y0 + 7, hair);
    }
    if (back && spec.hairStyle !== 'none') {
      // the dome below the band is HAIR from behind, never scalp
      pm.hline(x0 + spans[5][0], y0 + 5, spans[5][1], spec.hairStyle === 'gray' ? skin : hair);
    }
  } else {
    switch (spec.hairStyle) {
      case 'short': {
        crown(5, hair);
        pm.hline(x0 + spans[0][0] + 1, y0, 3, hairL);
        pm.hline(x0 + spans[1][0] + 1, y0 + 1, 2, hairL);
        if (!back) {
          // shaped fringe: solid temples, 3-on-2-off zigzag between
          for (let i = 0; i < w; i++) {
            if (i < 2 || i >= w - 2 || i % 5 < 3) pm.set(x0 + i, y0 + 5, hair);
          }
          pm.rect(x0, y0 + 6, 1, 2, hair); // sideburns
          pm.rect(x0 + w - 1, y0 + 6, 1, 2, hair);
        } else {
          fillFrom(5, hair);
          pm.hline(x0 + spans[last][0] + 1, yBot, spans[last][1] - 2, hairB); // nape
          pm.set(x0 + Math.floor(w / 2) + 2, y0 + 6, hairB); // whorl
          pm.set(x0 + Math.floor(w / 2) + 3, y0 + 7, hairB);
        }
        break;
      }
      case 'sidepart': {
        crown(5, hair);
        pm.hline(x0 + spans[0][0] + 1, y0, 3, hairL);
        if (!back) {
          // the swoop: deep fringe sweeping left, a flick at the right temple
          const part = Math.floor(w * 0.64);
          pm.hline(x0, y0 + 5, part, hair);
          pm.hline(x0 + 1, y0 + 6, Math.floor(w / 3), hair);
          pm.hline(x0 + 1, y0 + 7, 2, hairB); // underside shade
          pm.vline(x0 + part, y0 + 1, 3, hairB); // the part line
          pm.set(x0 + w - 1, y0 + 4, hair); // flick
          pm.set(x0 + w - 1, y0 + 5, hair);
          pm.rect(x0, y0 + 6, 1, 2, hair); // sideburn
        } else {
          fillFrom(5, hair);
          pm.hline(x0 + spans[last][0] + 1, yBot, spans[last][1] - 2, hairB);
          pm.vline(x0 + Math.floor(w * 0.6), y0 + 1, 4, hairB); // part from behind
        }
        break;
      }
      case 'bob': {
        crown(6, hair);
        pm.hline(x0 + spans[0][0] + 1, y0, 3, hairL);
        pm.hline(x0 + spans[1][0] + 1, y0 + 1, 2, hairL);
        // curtains hugging the dome, curling in at the jaw
        for (let r = 3; r <= Math.min(10, last); r++) {
          const ins = spans[r][0];
          pm.rect(x0 + ins - 1, y0 + r, 2, 1, hair);
          pm.rect(x0 + spans[r][1] + ins - 1, y0 + r, 2, 1, hair);
        }
        pm.set(x0 + 1, y0 + Math.min(10, last), hairB); // curl tips, shaded
        pm.set(x0 + w - 2, y0 + Math.min(10, last), hairB);
        if (!back) {
          pm.hline(x0 + 1, y0 + 5, w - 2, hair); // full straight fringe
          pm.set(x0 + Math.floor(w / 2), y0 + 5, hairB); // center notch
        } else {
          fillFrom(5, hair);
          pm.hline(x0 + spans[last][0] + 1, yBot, spans[last][1] - 2, hairB);
        }
        break;
      }
      case 'gray': {
        if (!back) {
          // receded: bare lit crown, tidy temple patches
          pm.set(x0 + spans[0][0] + 2, y0 + 1, skinL); // the shine
          for (let r = 3; r <= 6; r++) {
            const ins = spans[r][0];
            pm.rect(x0 + ins, y0 + r, 2, 1, hair);
            pm.rect(x0 + ins + spans[r][1] - 2, y0 + r, 2, 1, hair);
          }
          pm.set(x0 + 1, y0 + 7, hairB);
          pm.set(x0 + w - 2, y0 + 7, hairB);
        } else {
          // the horseshoe, from behind
          fillFrom(6, hair);
          pm.hline(x0 + spans[last][0] + 1, yBot, spans[last][1] - 2, hairB);
          pm.set(x0 + spans[1][0] + 2, y0 + 1, skinL); // crown shine
        }
        break;
      }
      case 'topknot': {
        crown(4, hairB);
        const cx = x0 + Math.floor(w / 2);
        pm.hline(cx - 1, y0 - 3, 3, hair); // the bun
        pm.hline(cx - 2, y0 - 2, 5, hair);
        pm.hline(cx - 1, y0 - 1, 3, hairB); // tie wrap
        pm.set(cx - 1, y0 - 3, hairL);
        if (back) {
          fillFrom(4, hairB);
          pm.hline(x0 + spans[last][0] + 1, yBot, spans[last][1] - 2, px(spec.hair, 0));
        }
        break;
      }
      case 'none':
        break;
    }
  }

  if (spec.hat?.kind === 'bow') {
    const bow = px(spec.hat.ramp, 2);
    const bowD = px(spec.hat.ramp, 1);
    const bx = x0 + w - 6;
    pm.rect(bx, y0 - 2, 3, 3, bow);
    pm.rect(bx + 4, y0 - 2, 3, 3, bow);
    pm.set(bx, y0 - 2, T);
    pm.set(bx + 6, y0 - 2, T);
    pm.rect(bx + 3, y0 - 1, 1, 2, bowD); // knot
  }

  if (!back) {
    // eyes: per-character styles (ADR-022) — EB casts don't share one face
    const eyeY = y0 + 7;
    const cxF = x0 + Math.floor(w / 2);
    const lx = cxF - 4;
    const rx = cxF + 2;
    const eye = (ex: number): void => {
      switch (spec.eyes ?? 'tall') {
        case 'tall': // the hero eye: 2×3 with a catchlight
          pm.rect(ex, eyeY, 2, 3, C.outline);
          pm.set(ex, eyeY, C.white);
          break;
        case 'dot': // calm 2×2 button eyes
          pm.rect(ex, eyeY + 1, 2, 2, C.outline);
          pm.set(ex, eyeY + 1, C.white);
          break;
        case 'happy': // closed-content ∪ arcs
          pm.set(ex - 1, eyeY + 1, C.outline);
          pm.set(ex, eyeY + 2, C.outline);
          pm.set(ex + 1, eyeY + 2, C.outline);
          pm.set(ex + 2, eyeY + 1, C.outline);
          break;
        case 'wide': // tall whites, pin pupils — the Department issue
          pm.rect(ex - 1, eyeY - 1, 4, 5, C.white);
          pm.rect(ex, eyeY + 1, 2, 2, C.outline);
          pm.hline(ex - 1, eyeY - 2, 4, skinD); // socket rim
          break;
        case 'glare': // narrowed, heavy brow
          pm.rect(ex, eyeY + 1, 2, 2, C.outline);
          pm.hline(ex - 1, eyeY - 1, 4, px(spec.hair, 1));
          break;
      }
    };
    eye(lx);
    eye(rx);
    if (spec.glasses) {
      const g = C.inkSoft;
      pm.frame(lx - 1, eyeY - 1, 4, 5, g);
      pm.frame(rx - 1, eyeY - 1, 4, 5, g);
      pm.hline(lx + 3, eyeY + 1, rx - lx - 4, g); // bridge
      pm.set(lx + 2, eyeY - 1, px(RAMP.CYAN, 3)); // lens glint
      pm.set(rx + 2, eyeY - 1, px(RAMP.CYAN, 3));
    }
    if (spec.grin) {
      const gw = w - 8;
      pm.rect(x0 + 4, yBot - 2, gw, 3, C.white);
      pm.frame(x0 + 4, yBot - 2, gw, 3, C.outline);
      for (let i = x0 + 6; i < x0 + 4 + gw - 1; i += 2) pm.vline(i, yBot - 1, 1, px(RAMP.PAPER, 1));
    } else {
      // mouths draw in the DEEPEST skin tone — mid-shade reads as nothing
      const my = yBot - 1;
      const lip = px(spec.skin, 0);
      switch (spec.mouth ?? 'hint') {
        case 'hint':
          pm.hline(cxF - 1, my, 2, lip);
          break;
        case 'smile': // corners up
          pm.set(cxF - 2, my - 1, lip);
          pm.hline(cxF - 1, my, 2, lip);
          pm.set(cxF + 1, my - 1, lip);
          break;
        case 'open': // small o of perpetual surprise
          pm.rect(cxF - 1, my - 1, 2, 2, C.outline);
          pm.set(cxF - 1, my, px(RAMP.RED, 1));
          break;
        case 'frown': // corners down
          pm.set(cxF - 2, my, lip);
          pm.hline(cxF - 1, my - 1, 2, lip);
          pm.set(cxF + 1, my, lip);
          break;
        case 'none':
          break;
      }
    }
  }
}

function torsoFront(pm: Pixmap, spec: CharacterSpec, m: Metrics, bob: number, pose: Pose, back: boolean): void {
  const t = spec.top;
  const lit = px(t.ramp, 3);
  const base = px(t.ramp, 2);
  const dark = px(t.ramp, 1);
  const skin = px(spec.skin, 2);
  const skinD = px(spec.skin, 1);
  const x0 = m.bodyX;
  const w = m.bodyW;
  const y0 = m.bodyTop + bob;
  const h = m.bodyH - bob;
  const hemY = y0 + h - 1;

  if (t.style === 'dress') {
    // bodice then flared skirt
    pm.rect(x0 + 1, y0, w - 2, 4, base);
    pm.vline(x0 + 1, y0, 4, lit);
    for (let i = 0; i < h - 4; i++) {
      const grow = Math.min(2, Math.floor(i / 2) + 1);
      pm.hline(x0 + 1 - grow, y0 + 4 + i, w - 2 + grow * 2, base);
    }
    pm.hline(x0 - 1, hemY, w + 2, dark);
    // pleat shadows — the shaded side carries real weight (ADR-022)
    pm.vline(x0 + 3, y0 + 5, h - 5, dark);
    pm.vline(x0 + w - 4, y0 + 5, h - 5, dark);
    pm.vline(x0 + w - 3, y0 + 6, h - 6, dark);
    pm.vline(x0, y0 + 5, h - 5, lit);
    pm.set(x0 + w - 3, hemY, px(t.ramp, 0)); // hem core shadow
    pm.set(x0 + w - 2, hemY, px(t.ramp, 0));
    if (t.accent !== undefined) pm.hline(x0 + 1, y0 + 3, w - 2, px(t.accent, 3)); // sash
    if (!back) {
      pm.hline(x0 + 2, y0, w - 4, px(spec.skin, 2)); // collar line of skin
    }
  } else {
    pm.rect(x0, y0, w, h, base);
    // weighted shading (ADR-022): lit left edge + chest catch, a 2-column
    // shaded side, hem dark with a core-shadow corner — reads at game zoom
    pm.vline(x0, y0, h, lit);
    pm.vline(x0 + 1, y0, 2, lit);
    pm.hline(x0 + 1, y0 + 1, 2, lit);
    pm.vline(x0 + w - 1, y0 + 1, h - 1, dark);
    pm.vline(x0 + w - 2, y0 + 3, h - 3, dark);
    pm.hline(x0, hemY, w, dark);
    pm.set(x0 + w - 2, hemY, px(t.ramp, 0));
    pm.set(x0 + w - 1, hemY - 1, px(t.ramp, 0));
    // shoulder rounding
    pm.set(x0, y0, T);
    pm.set(x0 + w - 1, y0, T);

    switch (t.style) {
      case 'stripe': {
        const acc = px(t.accent ?? RAMP.BLUE, 2);
        const accD = px(t.accent ?? RAMP.BLUE, 1);
        pm.hline(x0, y0 + 2, w, acc);
        pm.hline(x0, y0 + 3, w, acc);
        pm.hline(x0, y0 + 6, w, acc);
        pm.hline(x0, y0 + 7, w, acc);
        pm.set(x0 + w - 1, y0 + 2, accD);
        pm.set(x0 + w - 1, y0 + 6, accD);
        // v5: the ringer-tee collar band (front and back — it wraps)
        pm.hline(x0 + 2, y0, w - 4, px(RAMP.PAPER, 3));
        if (!back) {
          pm.set(x0 + Math.floor(w / 2) - 1, y0 + 1, px(RAMP.PAPER, 3)); // collar dip
          pm.set(x0 + Math.floor(w / 2), y0 + 1, px(RAMP.PAPER, 2));
        }
        break;
      }
      case 'blazer': {
        if (!back) {
          // shirt triangle + lapels + tie + buttons
          const cx = x0 + w / 2;
          pm.rect(cx - 2, y0, 4, 5, C.white);
          pm.line(cx - 3, y0, cx - 1, y0 + 4, C.inkSoft);
          pm.line(cx + 2, y0, cx, y0 + 4, C.inkSoft);
          const tie = px(t.accent ?? RAMP.RED, 2);
          pm.rect(cx - 1, y0 + 1, 2, 4, tie);
          pm.set(cx - 1, y0 + 5, px(t.accent ?? RAMP.RED, 1));
          pm.set(cx - 3, y0 + 7, C.white); // button
          pm.set(cx - 3, y0 + 9, C.white);
        } else {
          pm.vline(x0 + w / 2, y0 + 1, h - 2, dark); // center seam
        }
        break;
      }
      case 'gi': {
        if (!back) {
          pm.line(x0 + 3, y0, x0 + w / 2, y0 + 5, dark);
          pm.line(x0 + w - 4, y0, x0 + w / 2 - 1, y0 + 5, dark);
          pm.line(x0 + 4, y0, x0 + w / 2 + 1, y0 + 5, px(spec.skin, 2)); // chest sliver
        }
        const sash = px(t.accent ?? RAMP.GOLD, 2);
        pm.hline(x0, y0 + h - 3, w, sash);
        pm.hline(x0, y0 + h - 2, w, px(t.accent ?? RAMP.GOLD, 1));
        if (!back) pm.rect(x0 + 2, y0 + h - 3, 2, 3, sash); // knot
        break;
      }
      case 'apron': {
        if (!back) {
          pm.rect(x0 + 3, y0 + 2, w - 6, h - 2, C.white);
          pm.vline(x0 + 3, y0 + 2, h - 2, px(RAMP.PAPER, 2));
          pm.set(x0 + 4, y0 + 1, px(RAMP.PAPER, 1)); // neck strap
          pm.set(x0 + w - 5, y0 + 1, px(RAMP.PAPER, 1));
          pm.hline(x0 + 3, y0 + 5, w - 6, px(RAMP.PAPER, 1)); // waist seam
        }
        break;
      }
      case 'pajama': {
        const acc = px(t.accent ?? RAMP.CYAN, 2);
        for (let yy = 1; yy < h; yy += 3) pm.hline(x0, y0 + yy, w, acc);
        if (!back) {
          pm.set(x0 + w / 2, y0 + 2, C.white);
          pm.set(x0 + w / 2, y0 + 5, C.white);
        }
        break;
      }
      case 'shirt': {
        if (!back) {
          // v5: a real collar — white wings around a dark V, then buttons
          const cx = x0 + Math.floor(w / 2);
          pm.hline(cx - 3, y0, 2, px(RAMP.PAPER, 3));
          pm.hline(cx + 1, y0, 2, px(RAMP.PAPER, 3));
          pm.set(cx - 1, y0, dark);
          pm.set(cx, y0, dark);
          pm.set(cx - 1, y0 + 1, dark); // the V point
          pm.set(cx, y0 + 3, px(RAMP.PAPER, 3)); // buttons
          pm.set(cx, y0 + 5, px(RAMP.PAPER, 3));
        } else {
          pm.hline(x0 + w / 2 - 2, y0, 4, dark); // back collar line
        }
        break;
      }
    }
    // v5: a belt where the shirt tucks in (shirt/stripe/pajama — jackets,
    // gis, and aprons cover theirs). Buckle catches the light, front only.
    if (t.style === 'shirt' || t.style === 'stripe' || t.style === 'pajama') {
      pm.hline(x0, hemY, w, px(RAMP.INK, 1));
      if (!back) {
        pm.set(x0 + Math.floor(w / 2), hemY, px(RAMP.GOLD, 3));
        pm.set(x0 + Math.floor(w / 2) - 1, hemY, px(RAMP.GOLD, 1));
      }
    }
  }

  // arms: sleeves with cuffs, then bare arm + hand, counter-swing in walk
  const armY = y0 + 1;
  const armLen = 7;
  const swing = pose === 1 ? 1 : pose === 3 ? -1 : 0;
  // ringer tees get white sleeve cuffs to match the collar (v5)
  const cuff = t.style === 'stripe' ? px(RAMP.PAPER, 3) : dark;
  const drawArm = (ax: number, dy: number): void => {
    pm.rect(ax, armY + dy, 2, 2, base); // sleeve
    pm.set(ax, armY + dy, lit);
    pm.hline(ax, armY + 2 + dy, 2, cuff); // cuff
    pm.rect(ax, armY + 3 + dy, 2, armLen - 4, skin);
    pm.rect(ax, armY + armLen - 1 + dy, 2, 2, skin); // hand
    pm.set(ax + 1, armY + armLen + dy, skinD);
  };
  const rdy = swing === -1 ? 1 : 0;
  drawArm(x0 - 2, swing === 1 ? 1 : 0);
  drawArm(x0 + w, rdy);

  // silhouette props (ADR-019)
  if (spec.held === 'pan') {
    // the frying pan, carried at her right side — reads in one glance
    const hy = armY + armLen + rdy;
    pm.vline(x0 + w + 1, hy - 1, 2, px(RAMP.EARTH, 1)); // handle
    pm.rect(x0 + w, hy + 1, 4, 3, px(RAMP.INK, 1)); // the pan
    pm.hline(x0 + w, hy + 1, 4, px(RAMP.INK, 2));
    pm.set(x0 + w + 1, hy + 2, px(RAMP.INK, 2)); // cast-iron sheen
  }
  if (spec.satchel && !back) {
    // shoulder strap across the chest, bag at the left hip
    pm.line(x0 + w - 2, y0, x0 + 1, y0 + h - 2, px(RAMP.EARTH, 1));
    pm.rect(x0 - 2, y0 + h - 3, 4, 3, px(RAMP.EARTH, 2));
    pm.hline(x0 - 2, y0 + h - 3, 4, px(RAMP.EARTH, 3)); // flap
  }
  if (spec.satchel && back) {
    pm.line(x0 + 1, y0, x0 + w - 2, y0 + h - 2, px(RAMP.EARTH, 1));
  }
  if (spec.beads && !back) {
    // prayer-bead bracelet on the left wrist
    pm.set(x0 - 2, armY + armLen - 2 + (swing === 1 ? 1 : 0), px(RAMP.RED, 2));
    pm.set(x0 - 1, armY + armLen - 2 + (swing === 1 ? 1 : 0), px(RAMP.RED, 1));
  }
}

function legsFront(pm: Pixmap, spec: CharacterSpec, m: Metrics, pose: Pose): void {
  const pants = px(spec.bottom.ramp, 2);
  const pantsL = px(spec.bottom.ramp, 3);
  const pantsD = px(spec.bottom.ramp, 1);
  const shoeTop = px(spec.shoes, 1);
  const skirt = spec.top.style === 'dress';
  const skin = px(spec.skin, 2);
  const x0 = m.bodyX + 1;
  const w = m.bodyW - 2;
  const legW = Math.floor((w - 2) / 2);
  const lx = x0;
  const rx = x0 + w - legW;
  // v5 (ADR-023): kids wear shorts — bare knee, white sock, sneaker sole
  const kid = isKid(spec);
  const shorts = kid && !skirt && !spec.longPants;
  const sock = (spec.socks ?? kid) ? px(RAMP.PAPER, 3) : skirt ? skin : shorts ? skin : pants;
  const sole = kid ? px(RAMP.PAPER, 2) : px(spec.shoes, 0);
  // standing leg rows top→bottom (4): shorts|pants ×2, knee, sock
  const rowColor = (r: number): number => {
    if (skirt) return r === 3 ? sock : skin;
    if (shorts) return r < 2 ? pants : r === 2 ? skin : sock;
    return r === 3 && (spec.socks ?? false) ? sock : pants;
  };

  if (!skirt) {
    pm.rect(x0, m.hipY - 1, w, 1, pants); // hip row
    pm.set(x0, m.hipY - 1, pantsL);
  }

  const leg = (x: number, lifted: boolean): void => {
    if (lifted) {
      // compressed: hem, knee, sock, then the shoe
      pm.rect(x, m.hipY, legW, 1, rowColor(0));
      pm.rect(x, m.hipY + 1, legW, 1, rowColor(2));
      pm.rect(x, m.hipY + 2, legW, 1, rowColor(3));
      pm.rect(x, m.hipY + 3, legW, 1, shoeTop);
      pm.rect(x, m.hipY + 4, legW, 1, sole);
      if (!skirt) pm.set(x, m.hipY, pantsL);
    } else {
      for (let r = 0; r < 4; r++) pm.rect(x, m.hipY + r, legW, 1, rowColor(r));
      if (!skirt && !shorts) {
        pm.vline(x, m.hipY, 4, pantsL);
        pm.vline(x + legW - 1, m.hipY, 4, pantsD);
      }
      if (shorts) {
        pm.vline(x, m.hipY, 2, pantsL); // lit hem
        pm.set(x + legW - 1, m.hipY + 1, pantsD); // hem shade
      }
      pm.rect(x, m.shoeY, legW, 1, shoeTop);
      pm.rect(x, m.shoeY + 1, legW, 1, sole);
    }
  };
  if (pose === 1) {
    leg(lx, true);
    leg(rx, false);
  } else if (pose === 3) {
    leg(lx, false);
    leg(rx, true);
  } else {
    leg(lx, false);
    leg(rx, false);
  }
}

/* ================================================================== */
/* SIDE (facing right)                                                 */

function headSide(pm: Pixmap, spec: CharacterSpec, m: Metrics, bob: number): void {
  const skin = px(spec.skin, 2);
  const skinL = px(spec.skin, 3);
  const skinD = px(spec.skin, 1);
  const hairB = px(spec.hair, 1);
  const hair = px(spec.hair, 2);
  const hairL = px(spec.hair, 3);
  const y0 = m.headTop + bob;
  const x0 = m.headX;
  const w = m.headW;
  const yBot = y0 + m.headH - 1;
  const spans = SKULL_SIDE[spec.build ?? 'kid'];
  const last = m.headH - 1;

  // profile dome: flat at the back, chin pulled toward the face (ADR-022)
  drawSkull(pm, x0, y0, spans, skin);
  const crown = (rows: number, c: number): void => {
    for (let r = 0; r < rows; r++) pm.hline(x0 + spans[r][0], y0 + r, spans[r][1], c);
  };
  pm.hline(x0 + spans[1][0] + 2, y0 + 1, spans[1][1] - 6, skinL);
  pm.hline(x0 + spans[last][0], yBot, spans[last][1], skinD);
  pm.set(x0 + spans[last][0] + 1, yBot, px(spec.skin, 0)); // chin core shadow
  // v5: the cheek blush, profile edition
  if (spec.blush ?? isKid(spec)) {
    pm.hline(x0 + w - 7, y0 + 10, 2, px(RAMP.RED, 3));
  }
  // brow ledge, nose bump, nostril shadow — the profile read
  pm.set(x0 + w, y0 + 6, skin);
  pm.set(x0 + w, y0 + 8, skin);
  pm.set(x0 + w, y0 + 9, skinD);
  pm.set(x0 + w - 1, y0 + 10, skinD); // upper-lip turn
  // ear
  pm.rect(x0 + 6, y0 + 7, 3, 4, skin);
  pm.frame(x0 + 6, y0 + 7, 3, 4, skinD);
  pm.set(x0 + 7, y0 + 8, skinD);

  const hatted = spec.hat?.kind === 'cap';
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    const capL = px(spec.hat.ramp, 3);
    crown(5, cap);
    pm.hline(x0 + spans[0][0] + 1, y0 - 1, spans[0][1] - 2, cap);
    pm.hline(x0 + spans[1][0] + 1, y0, 4, capL);
    pm.hline(x0 + spans[4][0], y0 + 4, spans[4][1], capD); // band
    // brim forward over the brow
    pm.hline(x0 + w - 3, y0 + 5, 7, capL);
    pm.hline(x0 + w - 3, y0 + 6, 7, capD);
    // the back of the head under the cap is HAIR, not scalp (user catch:
    // "he looks bald from the side") — same mass the bare styles get
    if (spec.hairStyle === 'short' || spec.hairStyle === 'sidepart' || spec.hairStyle === 'bob') {
      for (let r = 5; r <= last - 2; r++) pm.rect(x0 + spans[r][0], y0 + r, 4, 1, hair);
      pm.vline(x0 + spans[6][0], y0 + 6, last - 7, hairB); // depth seam
      pm.set(x0 + spans[last - 1][0] + 1, yBot - 1, hairB); // nape point
    } else if (spec.hairStyle === 'gray') {
      for (let r = 5; r <= 8; r++) pm.rect(x0 + spans[r][0], y0 + r, 3, 1, hair);
      pm.set(x0 + spans[8][0] + 1, y0 + 8, hairB);
    }
  } else {
    switch (spec.hairStyle) {
      case 'short':
      case 'sidepart': {
        crown(5, hair);
        pm.hline(x0 + spans[0][0] + 1, y0, 3, hairL);
        // back-of-head mass tapering to the nape
        for (let r = 5; r <= last - 2; r++) pm.rect(x0 + spans[r][0], y0 + r, 4, 1, hair);
        pm.vline(x0 + spans[6][0], y0 + 6, last - 7, hairB); // depth seam
        pm.set(x0 + spans[last - 1][0] + 1, yBot - 1, hairB); // nape point
        // fringe over the brow
        pm.hline(x0 + w - 7, y0 + 5, 5, hair);
        if (spec.hairStyle === 'sidepart') {
          pm.hline(x0 + w - 8, y0 + 6, 4, hairB); // swoop underside
          pm.set(x0 + w - 2, y0 + 4, hair); // flick
        }
        break;
      }
      case 'bob': {
        crown(6, hair);
        pm.hline(x0 + spans[0][0] + 1, y0, 3, hairL);
        // back curtain falling past the nape, curling forward
        for (let r = 3; r <= Math.min(11, last); r++) pm.rect(x0 + spans[r][0] - 1, y0 + r, 5, 1, hair);
        pm.hline(x0 + spans[Math.min(11, last)][0], y0 + Math.min(11, last), 4, hairB); // shaded tip
        pm.hline(x0 + w - 7, y0 + 5, 5, hair); // fringe
        pm.set(x0 + w - 6, y0 + 6, hair); // front lock at the cheek
        pm.set(x0 + w - 6, y0 + 7, hairB);
        break;
      }
      case 'gray': {
        // receded in profile: shine on the crown, the horseshoe at the back
        pm.set(x0 + spans[0][0] + 2, y0 + 1, skinL);
        for (let r = 3; r <= last - 3; r++) pm.rect(x0 + spans[r][0], y0 + r, 3, 1, hair);
        pm.set(x0 + spans[4][0] + 1, y0 + 4, hairL);
        pm.set(x0 + spans[last - 2][0] + 1, yBot - 2, hairB); // nape
        break;
      }
      case 'topknot': {
        crown(4, hairB);
        pm.hline(x0 + 3, y0 - 3, 3, hair); // bun rides toward the back
        pm.hline(x0 + 2, y0 - 2, 5, hair);
        pm.hline(x0 + 3, y0 - 1, 3, hairB); // tie
        pm.set(x0 + 3, y0 - 3, hairL);
        pm.rect(x0 + spans[4][0], y0 + 4, 3, 4, hairB); // shaved nape shadow
        break;
      }
      case 'none':
        break;
    }
  }
  if (spec.hat?.kind === 'bow') {
    const bow = px(spec.hat.ramp, 2);
    pm.rect(x0 + 3, y0 - 2, 3, 3, bow);
    pm.rect(x0 + 7, y0 - 2, 2, 2, bow);
    pm.set(x0 + 6, y0 - 1, px(spec.hat.ramp, 1));
  }

  // single profile eye, in the character's style (ADR-022)
  const eyeY = y0 + 7;
  const ex = x0 + w - 5;
  switch (spec.eyes ?? 'tall') {
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
      pm.set(ex + 1, eyeY + 1, C.outline);
      break;
    case 'wide':
      pm.rect(ex - 1, eyeY - 1, 4, 5, C.white);
      pm.rect(ex + 1, eyeY + 1, 2, 2, C.outline); // pupil hunts forward
      pm.hline(ex - 1, eyeY - 2, 4, skinD);
      break;
    case 'glare':
      pm.rect(ex, eyeY + 1, 2, 2, C.outline);
      pm.hline(ex - 1, eyeY - 1, 4, px(spec.hair, 1));
      break;
  }
  if (spec.glasses) {
    pm.frame(ex - 1, eyeY - 1, 4, 5, C.inkSoft);
    pm.hline(x0 + 8, eyeY, w - 14, C.inkSoft); // temple arm to the ear
    pm.set(ex + 2, eyeY - 1, px(RAMP.CYAN, 3));
  }
  if (spec.grin) {
    pm.rect(x0 + w - 7, yBot - 2, 6, 3, C.white);
    pm.frame(x0 + w - 7, yBot - 2, 6, 3, C.outline);
  } else {
    // deepest skin tone, same as the front — mid-shade mouths vanish
    const my = yBot - 1;
    const lip = px(spec.skin, 0);
    switch (spec.mouth ?? 'hint') {
      case 'hint':
        pm.hline(x0 + w - 3, my, 2, lip);
        break;
      case 'smile':
        pm.set(x0 + w - 2, my - 1, lip);
        pm.set(x0 + w - 3, my, lip);
        break;
      case 'open':
        pm.rect(x0 + w - 3, my - 1, 2, 2, C.outline);
        pm.set(x0 + w - 3, my, px(RAMP.RED, 1));
        break;
      case 'frown':
        pm.set(x0 + w - 2, my, lip);
        pm.set(x0 + w - 3, my - 1, lip);
        break;
      case 'none':
        break;
    }
  }
}

function torsoSide(pm: Pixmap, spec: CharacterSpec, m: Metrics, bob: number, pose: Pose): void {
  const t = spec.top;
  const lit = px(t.ramp, 3);
  const base = px(t.ramp, 2);
  const dark = px(t.ramp, 1);
  const skin = px(spec.skin, 2);
  const skinD = px(spec.skin, 1);
  const x0 = m.bodyX + 1;
  const w = m.bodyW - 2;
  const y0 = m.bodyTop + bob;
  const h = m.bodyH - bob;
  const hemY = y0 + h - 1;

  if (t.style === 'dress') {
    pm.rect(x0 + 1, y0, w - 2, 4, base);
    for (let i = 0; i < h - 4; i++) {
      const grow = Math.min(2, Math.floor(i / 2) + 1);
      pm.hline(x0 + 1 - grow, y0 + 4 + i, w - 2 + grow * 2, base);
    }
    pm.hline(x0 - 1, hemY, w + 2, dark);
    pm.vline(x0 - 1, y0 + 6, h - 7, lit);
    pm.vline(x0 + w - 2, y0 + 5, h - 5, dark);
    if (t.accent !== undefined) pm.hline(x0, y0 + 3, w - 1, px(t.accent, 3));
  } else {
    pm.rect(x0, y0, w, h, base);
    pm.vline(x0, y0, h, dark); // back in shadow
    pm.vline(x0 + 1, y0 + 2, h - 2, dark); // weighted back (ADR-022)
    pm.vline(x0 + w - 1, y0, h, lit); // chest catches the light
    pm.hline(x0, hemY, w, dark);
    pm.set(x0, hemY, px(t.ramp, 0)); // hem core corner
    pm.set(x0 + 1, hemY, px(t.ramp, 0));
    pm.set(x0, y0, T);
    pm.set(x0 + w - 1, y0, T);
    if (t.style === 'stripe') {
      const acc = px(t.accent ?? RAMP.BLUE, 2);
      pm.hline(x0, y0 + 2, w, acc);
      pm.hline(x0, y0 + 3, w, acc);
      pm.hline(x0, y0 + 6, w, acc);
      pm.hline(x0, y0 + 7, w, acc);
    }
    if (t.style === 'gi') {
      const sash = px(t.accent ?? RAMP.GOLD, 2);
      pm.hline(x0, y0 + h - 3, w, sash);
      pm.hline(x0, y0 + h - 2, w, px(t.accent ?? RAMP.GOLD, 1));
    }
    if (t.style === 'blazer') {
      pm.vline(x0 + w - 2, y0 + 1, 4, C.white); // sliver of shirt
      pm.set(x0 + w - 2, y0 + 2, px(t.accent ?? RAMP.RED, 2));
    }
    if (t.style === 'pajama') {
      const acc = px(t.accent ?? RAMP.CYAN, 2);
      for (let yy = 1; yy < h; yy += 3) pm.hline(x0, y0 + yy, w, acc);
    }
    if (t.style === 'apron') {
      pm.rect(x0 + w - 4, y0 + 2, 3, h - 3, C.white);
    }
  }

  // near arm swings forward/back across the torso
  const swing = pose === 1 ? 2 : pose === 3 ? -2 : 0;
  const ax = x0 + Math.floor(w / 2) - 1 + swing;
  pm.rect(ax, y0 + 1, 2, 3, base);
  pm.set(ax, y0 + 1, lit);
  pm.rect(ax, y0 + 4, 2, 3, skin);
  pm.rect(ax, y0 + 7, 2, 2, skin);
  pm.set(ax + 1, y0 + 8, skinD);

  // silhouette props (ADR-019)
  if (spec.held === 'pan') {
    pm.vline(ax + 1, y0 + 9, 1, px(RAMP.EARTH, 1)); // handle from the near hand
    pm.rect(ax, y0 + 10, 4, 3, px(RAMP.INK, 1));
    pm.hline(ax, y0 + 10, 4, px(RAMP.INK, 2));
  }
  if (spec.satchel) {
    pm.rect(x0 - 1, y0 + h - 4, 3, 4, px(RAMP.EARTH, 2)); // bag at the hip
    pm.hline(x0 - 1, y0 + h - 4, 3, px(RAMP.EARTH, 3));
    pm.vline(x0 + 1, y0, h - 4, px(RAMP.EARTH, 1)); // strap edge-on
  }
  if (spec.beads) {
    pm.set(ax, y0 + 7, px(RAMP.RED, 2));
  }
}

function legsSide(pm: Pixmap, spec: CharacterSpec, m: Metrics, pose: Pose): void {
  const pants = px(spec.bottom.ramp, 2);
  const pantsL = px(spec.bottom.ramp, 3);
  const pantsD = px(spec.bottom.ramp, 1);
  const shoeTop = px(spec.shoes, 1);
  const shoeSole = px(spec.shoes, 0);
  const skirt = spec.top.style === 'dress';
  const skin = px(spec.skin, 2);
  const skinD = px(spec.skin, 1);
  const cx = m.bodyX + Math.floor(m.bodyW / 2);
  const legW = 3;
  // v5 (ADR-023): shorts + knee + sock for kids, in profile too
  const kid = isKid(spec);
  const shorts = kid && !skirt && !spec.longPants;
  const sockOn = spec.socks ?? kid;
  const sock = px(RAMP.PAPER, 3);
  const sockSh = px(RAMP.PAPER, 2);
  const sole = kid ? px(RAMP.PAPER, 2) : shoeSole;
  // rows top→bottom for a 4-row leg, per depth
  const rowColor = (r: number, front: boolean): number => {
    if (skirt) return r === 3 && sockOn ? (front ? sock : sockSh) : front ? skin : skinD;
    if (shorts) {
      if (r < 2) return front ? pants : pantsD;
      if (r === 2) return front ? skin : skinD;
      return sockOn ? (front ? sock : sockSh) : front ? skin : skinD;
    }
    if (r === 3 && sockOn && !kid) return front ? sock : sockSh;
    return front ? pants : pantsD;
  };

  if (!skirt) pm.rect(cx - 4, m.hipY - 1, 8, 1, pants);

  const drawLeg = (x: number, front: boolean, stretch: number): void => {
    for (let r = 0; r < 4; r++) pm.rect(x, m.hipY + r, legW, 1, rowColor(r, front));
    if (front && !skirt && !shorts) pm.vline(x, m.hipY, 2, pantsL);
    // shoe with a toe
    const sy = m.shoeY;
    pm.rect(x - (stretch < 0 ? 1 : 0), sy, legW + 1 + Math.max(0, stretch), 1, front ? shoeTop : shoeSole);
    pm.rect(x - (stretch < 0 ? 1 : 0), sy + 1, legW + 1 + Math.max(0, stretch), 1, sole);
  };

  if (pose === 1) {
    // scissor: front leg reaching forward, back leg trailing
    for (let r = 0; r < 3; r++) pm.rect(cx + 1, m.hipY + r, legW, 1, rowColor(r, true));
    pm.rect(cx + 2, m.hipY + 3, legW, 1, rowColor(3, true));
    pm.rect(cx + 2, m.shoeY, legW + 1, 1, shoeTop);
    pm.rect(cx + 2, m.shoeY + 1, legW + 1, 1, sole);
    for (let r = 0; r < 3; r++) pm.rect(cx - 4, m.hipY + r, legW, 1, rowColor(r, false));
    pm.rect(cx - 5, m.hipY + 3, legW, 1, rowColor(3, false));
    pm.rect(cx - 6, m.shoeY, legW + 1, 1, shoeSole);
    pm.rect(cx - 6, m.shoeY + 1, legW + 1, 1, sole);
  } else if (pose === 3) {
    for (let r = 0; r < 3; r++) pm.rect(cx - 3, m.hipY + r, legW, 1, rowColor(r, true));
    pm.rect(cx - 4, m.hipY + 3, legW, 1, rowColor(3, true));
    pm.rect(cx - 5, m.shoeY, legW + 1, 1, shoeTop);
    pm.rect(cx - 5, m.shoeY + 1, legW + 1, 1, sole);
    for (let r = 0; r < 3; r++) pm.rect(cx + 1, m.hipY + r, legW, 1, rowColor(r, false));
    pm.rect(cx + 2, m.hipY + 3, legW, 1, rowColor(3, false));
    pm.rect(cx + 2, m.shoeY, legW + 1, 1, shoeSole);
    pm.rect(cx + 2, m.shoeY + 1, legW + 1, 1, sole);
  } else {
    drawLeg(cx - 3, false, 0);
    drawLeg(cx, true, 1);
  }
}

/* ================================================================== */

function drawFrame(spec: CharacterSpec, dir: Dir, pose: Pose): Pixmap {
  const pm = new Pixmap(FRAME_W, FRAME_H);
  const m = metrics(spec);
  const bob = pose === 1 || pose === 3 ? 1 : 0;
  if (dir === 'down' || dir === 'up') {
    legsFront(pm, spec, m, pose);
    torsoFront(pm, spec, m, bob, pose, dir === 'up');
    headFront(pm, spec, m, bob, dir === 'up');
  } else {
    legsSide(pm, spec, m, pose);
    torsoSide(pm, spec, m, bob, pose);
    headSide(pm, spec, m, bob);
  }
  // S7c: the bespoke one-off pass — after every parametric layer, before
  // outline() so hand-placed pixels sit inside the same single contour
  spec.detail?.({ pm, dir, pose, bob, m, spec });
  pm.outline(C.outline);
  return pm;
}

/** 16 frames: down×4, left×4, right×4, up×4 */
export function generateCharacterFrames(spec: CharacterSpec): Pixmap[] {
  const down = ([0, 1, 2, 3] as Pose[]).map((p) => drawFrame(spec, 'down', p));
  const right = ([0, 1, 2, 3] as Pose[]).map((p) => drawFrame(spec, 'right', p));
  const left = right.map((f) => f.flipX());
  const up = ([0, 1, 2, 3] as Pose[]).map((p) => drawFrame(spec, 'up', p));
  return [...down, ...left, ...right, ...up];
}

/* ------------------------------------------------------------------ */
/* Special non-biped sprites                                           */

/**
 * Biscuit — a proper tricolor beagle (16×16, side view, 2 trot frames + flips).
 * v3 rules (ADR-020): hand-set row runs (no ellipse stacking), clustered
 * deliberate detail (saddle taper, white blaze, collar tag), full outline,
 * and the ground shadow stamped AFTER outline() so it is never outlined.
 * Sheet order unchanged: [stand→right, step→right, stand→left, step→left].
 */
export function generateDogFrames(): Pixmap[] {
  const coat = px(RAMP.PAPER, 3); // cream white
  const coatSh = px(RAMP.PAPER, 2); // belly + far-leg shade
  const tan = px(RAMP.EARTH, 2); // beagle head + saddle
  const tanL = px(RAMP.EARTH, 3); // crown light
  const tanD = px(RAMP.EARTH, 1); // ear flop, saddle trailing edge
  const make = (step: boolean): Pixmap => {
    const pm = new Pixmap(16, 16);

    // body — white mass, back line rises to the shoulder (hand-set runs)
    pm.hline(7, 6, 3, coat); // shoulder bridge under the skull
    pm.hline(3, 7, 9, coat);
    pm.rect(2, 8, 10, 3, coat); // barrel x2..11, y8..10
    pm.hline(3, 11, 9, coat); // belly row, tucked at the rump
    pm.hline(3, 11, 8, coatSh); // core shadow along the belly
    pm.set(2, 8, coatSh); // rump turns away from the light

    // saddle patch over the back — tapered by hand, never a rectangle
    pm.hline(4, 7, 6, tan);
    pm.hline(3, 8, 8, tan);
    pm.hline(3, 9, 7, tan);
    pm.hline(5, 10, 4, tan);
    pm.hline(5, 10, 2, tanD); // trailing-edge shade, one 2px cluster
    pm.set(3, 9, tanD);
    pm.hline(3, 10, 2, coatSh); // haunch crease — the rear thigh's plane

    // tail — up like a flag, white tip (the beagle "flag"); wags per frame
    if (step) {
      pm.set(2, 6, tan);
      pm.set(2, 5, tan);
      pm.set(2, 4, coat);
      pm.set(2, 3, coat);
    } else {
      pm.set(2, 6, tan);
      pm.set(1, 5, tan);
      pm.set(1, 4, coat);
      pm.set(1, 3, coat);
    }

    // skull — tan, chunky, rounded by hand rows; light from top-left
    pm.hline(9, 2, 5, tan); // y2 x9..13
    pm.hline(8, 3, 7, tan); // y3 x8..14
    pm.hline(8, 4, 7, tan);
    pm.hline(8, 5, 7, tan);
    pm.hline(8, 6, 7, tan);
    pm.hline(9, 7, 6, tan); // jaw row
    pm.hline(9, 2, 3, tanL); // crown catches the light
    pm.set(8, 3, tanL);

    // white blaze up the forehead — THE beagle read
    pm.set(13, 2, coat);
    pm.set(13, 3, coat);
    pm.set(13, 4, coat);

    // muzzle — white block, ink nose riding the tip
    pm.rect(12, 5, 3, 3, coat);
    pm.set(14, 5, C.outline); // nose
    pm.set(12, 7, coatSh); // chin shade
    pm.hline(9, 7, 3, tanD); // jaw shadow under the cheek

    // eye — one soulful pixel under the blaze
    pm.set(11, 4, C.outline);

    // ear — long tan flop over the skull side; bounces a row on the step
    const earDrop = step ? 1 : 0;
    pm.rect(7, 3, 2, 6 + earDrop, tanD);
    pm.set(7, 3, tan); // lit root
    pm.set(7, 8 + earDrop, T); // rounded tip
    pm.set(8, 9 + earDrop, tanD);

    // collar + tag (she IS somebody's dog — quest #1 sends her home)
    pm.hline(9, 8, 3, px(RAMP.RED, 2));
    pm.set(11, 8, px(RAMP.RED, 1));
    pm.set(10, 9, px(RAMP.GOLD, 3)); // the tag glint

    // legs — trot scissor; far pair one shade back
    if (step) {
      pm.rect(11, 12, 2, 2, coat); // near front, reaching
      pm.rect(2, 12, 2, 2, coat); // near back, trailing
      pm.vline(8, 12, 2, coatSh); // far front, under chest
      pm.vline(5, 12, 2, coatSh); // far back, swung forward
    } else {
      pm.rect(10, 12, 2, 2, coat);
      pm.rect(3, 12, 2, 2, coat);
      pm.vline(8, 12, 2, coatSh);
      pm.vline(6, 12, 2, coatSh);
    }

    pm.outline(C.outline);
    // ground shadow LAST — transparent-only, context green (park grass)
    pm.shadowUnder(7, 14, 5, px(RAMP.FOREST, 0));
    return pm;
  };
  const a = make(false);
  const b = make(true);
  return [a, b, a.flipX(), b.flipX()];
}

/**
 * Glint — the star-creature with a firefly heart (§A2), 12×12, 2 frames.
 * A four-point star (hand-set contour) whose belly-light BEATS between
 * frames: dim ember at rest, white-hot bloom with compass glow ticks on the
 * pulse. Floats — glow only, never a shadow (ADR-020). The glow ticks are
 * stamped after outline(): light is never outlined either.
 */
export function generateGlintFrames(): Pixmap[] {
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  const goldD = px(RAMP.GOLD, 1);
  const wing = px(RAMP.CYAN, 3);
  const make = (pulse: boolean): Pixmap => {
    const pm = new Pixmap(12, 12);
    // the star body — one hand-set contour with a pinched waist, a true ✦
    pm.contour(5, 2, [0, 1, 3, 4, 3, 1, 0], gold);
    // lit facets, upper-left; core shade settles lower-right
    pm.set(4, 3, goldL);
    pm.hline(2, 4, 3, goldL);
    pm.hline(2, 5, 2, goldL);
    pm.set(7, 6, goldD);
    pm.set(5, 8, goldD); // bottom point in shade
    pm.set(9, 5, goldD); // far point turns away
    // the face — two close-set eyes (he talks a LOT for a star)
    pm.set(4, 4, C.outline);
    pm.set(6, 4, C.outline);
    // wings — icy firefly blurs; high on the rest beat, flicked on the pulse
    if (pulse) {
      pm.set(2, 3, wing);
      pm.set(1, 2, wing);
      pm.set(8, 3, wing);
      pm.set(9, 2, wing);
    } else {
      pm.set(3, 3, wing);
      pm.set(2, 2, wing);
      pm.set(7, 3, wing);
      pm.set(8, 2, wing);
    }
    // THE HEART — the firefly belly-light the bug zapper takes from us:
    // a dark unlit ember low in the belly at rest, white-hot on the beat
    if (pulse) {
      pm.set(5, 7, C.white);
      pm.set(4, 7, goldL);
      pm.set(6, 7, goldL);
      pm.set(5, 8, goldL); // the lit belly tip
    } else {
      pm.set(5, 7, px(RAMP.ORANGE, 1));
    }
    pm.outline(C.outline);
    if (pulse) {
      // compass glow ticks — pure light, stamped after the outline
      pm.set(5, 0, goldL);
      pm.set(0, 5, gold);
      pm.set(10, 5, gold);
      pm.set(5, 10, gold);
    }
    return pm;
  };
  return [make(false), make(true)];
}

/**
 * The §A4.7 mourning angel (12×16, 2 float frames): closed lashes, clasped
 * hands, scalloped hem, wings that beat opposite the body's bob. Floats —
 * the halo is stamped after outline() as pure light, and there is never a
 * ground shadow. Pass a CAST spec to make the angel mourn SPECIFICALLY:
 * skin + hair + the spec's own signature (cap, bow, glasses, topknot bead)
 * carry over. No spec = the plain guest angel.
 */
export function generateAngelFrames(spec?: CharacterSpec): Pixmap[] {
  const robe = C.white;
  const robeSh = px(RAMP.PAPER, 2);
  const robeD = px(RAMP.PAPER, 1);
  const skin = px(spec?.skin ?? RAMP.SKIN, 2);
  const skinD = px(spec?.skin ?? RAMP.SKIN, 1);
  const make = (lift: number): Pixmap => {
    const pm = new Pixmap(12, 16);
    const y = lift; // body rides one row lower on the second beat

    // head — hand-rounded, lit from top-left
    pm.hline(4, 3 + y, 4, skin);
    pm.rect(3, 4 + y, 6, 3, skin);
    pm.hline(4, 7 + y, 4, skin);
    pm.set(4, 3 + y, px(spec?.skin ?? RAMP.SKIN, 3));
    pm.set(3, 6 + y, skinD);
    pm.set(8, 6 + y, skinD);

    // hair + signature, derived from the hero's own spec (S7c)
    if (spec) {
      const hair = px(spec.hair, 1);
      const hairMid = px(spec.hair, 2);
      if (spec.hat?.kind === 'cap') {
        // the cap stays on. of course it does.
        const cap = px(spec.hat.ramp, 2);
        pm.hline(4, 3 + y, 4, cap);
        pm.hline(3, 4 + y, 6, cap);
        pm.set(4, 3 + y, px(spec.hat.ramp, 3));
        pm.set(8, 4 + y, px(spec.hat.ramp, 1));
      } else {
        pm.hline(4, 3 + y, 4, hairMid);
        pm.hline(3, 4 + y, 6, hairMid);
        pm.set(4, 3 + y, px(spec.hair, 2));
        if (spec.hairStyle === 'bob') {
          pm.vline(3, 5 + y, 2, hair); // little curtains
          pm.vline(8, 5 + y, 2, hair);
        }
        if (spec.hairStyle === 'topknot') {
          pm.set(5, 2 + y, hair); // the knot
          if (spec.top.accent !== undefined) pm.set(6, 2 + y, px(spec.top.accent, 2)); // its gold tie
        }
        if (spec.hairStyle === 'sidepart') pm.hline(3, 5 + y, 3, hair);
      }
      if (spec.hat?.kind === 'bow') {
        pm.set(8, 2 + y, px(spec.hat.ramp, 2)); // the bow, still tied
        pm.set(9, 3 + y, px(spec.hat.ramp, 1));
      }
    }

    // face — closed lashes (asleep, not gone); glasses stay on for Milo
    if (spec?.glasses) {
      pm.set(4, 6 + y, px(RAMP.CYAN, 3));
      pm.set(7, 6 + y, px(RAMP.CYAN, 3));
      pm.set(5, 6 + y, C.inkSoft);
      pm.set(6, 6 + y, C.inkSoft);
    } else {
      pm.set(4, 6 + y, C.outline);
      pm.set(7, 6 + y, C.outline);
    }

    // wings — beat OPPOSITE the body bob, so the float reads as flight;
    // inner columns shade where they tuck behind the robe (separate plane)
    const wy = 9 - lift;
    pm.vline(2, wy, 3, robe);
    pm.vline(2, wy + 1, 2, robeD);
    pm.vline(1, wy, 2, robe);
    pm.set(1, wy + 2, robeD);
    pm.vline(9, wy, 3, robe);
    pm.vline(9, wy + 1, 2, robeD);
    pm.vline(10, wy, 2, robe);
    pm.set(10, wy + 2, robeD);

    // robe — flares by hand rows to a scalloped hem; two deliberate folds
    pm.hline(4, 8 + y, 4, robe);
    pm.rect(3, 9 + y, 6, 2, robe);
    pm.rect(2, 11 + y, 8, 2, robe);
    pm.vline(4, 10 + y, 3, robeSh);
    pm.vline(7, 11 + y, 2, robeSh);
    pm.set(9, 12 + y, robeSh);
    // hem teeth — 2px scallops with notches, EB ghost-hem style
    pm.hline(2, 13 + y, 2, robe);
    pm.hline(5, 13 + y, 2, robe);
    pm.hline(8, 13 + y, 2, robe);

    // hands clasped over the chest — she prays even now
    pm.hline(5, 9 + y, 2, skin);
    pm.set(6, 9 + y, skinD);

    pm.outline(C.outline);
    // the halo — pure light above everything, never outlined, never bobs
    pm.hline(4, 1, 4, px(RAMP.GOLD, 3));
    pm.set(3, 1, px(RAMP.GOLD, 1));
    pm.set(8, 1, px(RAMP.GOLD, 1));
    return pm;
  };
  return [make(0), make(1)];
}

/* ------------------------------------------------------------------ */
/* The cast — canon designs (GAME_BIBLE §A3 + Ch.1 NPCs)               */

export const CAST: Record<string, CharacterSpec> = {
  // Rex — Ness archetype: red cap, striped tee, jeans
  rex: {
    skin: RAMP.SKIN,
    hair: RAMP.INK,
    hairStyle: 'short',
    hat: { kind: 'cap', ramp: RAMP.RED },
    top: { ramp: RAMP.GOLD, style: 'stripe', accent: RAMP.BLUE },
    bottom: { ramp: RAMP.BLUE },
    shoes: RAMP.RED,
    // the cap's panel stitch, arcing off the crown (2px, every facing)
    detail: ({ pm, bob, m }) => {
      const seam = px(RAMP.RED, 1);
      pm.set(m.headX + m.headW - 5, m.headTop + bob + 1, seam);
      pm.set(m.headX + m.headW - 4, m.headTop + bob + 2, seam);
    },
  },
  // Mia — Paula archetype: blonde, red bow, rose dress — and her pan (§A3)
  faye: {
    skin: RAMP.SKIN,
    hair: RAMP.BLOND,
    hairStyle: 'bob',
    hat: { kind: 'bow', ramp: RAMP.RED },
    top: { ramp: RAMP.MAGENTA, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.MAGENTA },
    shoes: RAMP.RED,
    held: 'pan',
    mouth: 'smile', // kind, steel-spined (§A3)
    // one white spark on the cast iron + a pocket slit in the dress front
    detail: ({ pm, dir, pose, bob, m, spec }) => {
      const y0 = m.bodyTop + bob;
      if (dir === 'down') {
        const hy = y0 + 1 + 7 + (pose === 3 ? 1 : 0); // the pan hand's row
        pm.set(m.bodyX + m.bodyW + 2, hy + 1, C.white); // pan glint
        pm.hline(m.bodyX + m.bodyW - 5, y0 + 6, 2, px(spec.top.ramp, 1)); // pocket
      }
      if (dir === 'right') {
        const ax = m.bodyX + 1 + Math.floor((m.bodyW - 2) / 2) - 1 + (pose === 1 ? 2 : pose === 3 ? -2 : 0);
        pm.set(ax + 2, y0 + 10, C.white); // pan glint, side-on
      }
    },
  },
  // Milo — Jeff archetype: glasses, teal blazer, gadget satchel, tea snob
  milo: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'sidepart',
    top: { ramp: RAMP.CYAN, style: 'blazer', accent: RAMP.RED },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.EARTH,
    glasses: true,
    satchel: true,
    longPants: true, // Wintermoor slacks — the academy has standards
    // breast-pocket pen: lip, white barrel, red clip (4px, front only)
    detail: ({ pm, dir, bob, m, spec }) => {
      if (dir !== 'down') return;
      const y0 = m.bodyTop + bob;
      pm.hline(m.bodyX + 2, y0 + 4, 2, px(spec.top.ramp, 1)); // pocket lip
      pm.set(m.bodyX + 2, y0 + 3, C.white); // pen barrel
      pm.set(m.bodyX + 3, y0 + 3, px(RAMP.RED, 2)); // the clip
    },
  },
  // Dorin — Poo archetype: topknot, monastery gi, prayer beads (§A3)
  dorin: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'topknot',
    top: { ramp: RAMP.PAPER, style: 'gi', accent: RAMP.GOLD },
    bottom: { ramp: RAMP.PAPER },
    shoes: RAMP.EARTH,
    beads: true,
    eyes: 'dot', // composed monastery calm
    mouth: 'none', // speaks formally, rarely
    blush: false, // the mountain deleted his blush first
    longPants: true, // gi trousers
    // the gi's shoulder fold — two cloth-shadow pixels stepping off the seam
    detail: ({ pm, dir, bob, m, spec }) => {
      const y0 = m.bodyTop + bob;
      const fold = px(spec.top.ramp, 1);
      if (dir === 'up') {
        pm.set(m.bodyX + 2, y0 + 1, fold);
        pm.set(m.bodyX + 1, y0 + 2, fold);
      } else {
        const x0 = dir === 'down' ? m.bodyX : m.bodyX + 1;
        const w = dir === 'down' ? m.bodyW : m.bodyW - 2;
        pm.set(x0 + w - 3, y0 + 1, fold);
        pm.set(x0 + w - 2, y0 + 2, fold);
      }
    },
  },
  // Chad Pickle — Pokey analog: chubby, blond side-part, mustard stripes
  chad: {
    skin: RAMP.SKIN,
    hair: RAMP.BLOND,
    hairStyle: 'sidepart',
    top: { ramp: RAMP.GOLD, style: 'stripe', accent: RAMP.PURPLE },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.INK,
    build: 'chub',
    eyes: 'dot',
    mouth: 'open', // perpetually about to explain something
    // the shirt tail that never stays tucked, flopped over the right hip
    detail: ({ pm, dir, m, spec }) => {
      const tail = px(spec.top.ramp, 2);
      const tailD = px(spec.top.ramp, 1);
      if (dir === 'right') {
        pm.hline(m.bodyX + 1, m.hipY, 2, tail);
        pm.set(m.bodyX + 1, m.hipY, tailD);
        return;
      }
      const xr = m.bodyX + m.bodyW - 5;
      pm.hline(xr, m.hipY, 3, tail);
      pm.set(xr + 2, m.hipY, tailD);
    },
  },
  mom: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    top: { ramp: RAMP.CYAN, style: 'apron' },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.EARTH,
    eyes: 'happy',
    mouth: 'smile',
    blush: true, // it's warm in that kitchen
    // the oven mitt that lives on her right hand (cuff + mitt, 6px)
    detail: ({ pm, dir, pose, bob, m }) => {
      const mitt = px(RAMP.RED, 2);
      const mittD = px(RAMP.RED, 1);
      const armY = m.bodyTop + bob + 1;
      if (dir === 'right') {
        const ax = m.bodyX + 1 + Math.floor((m.bodyW - 2) / 2) - 1 + (pose === 1 ? 2 : pose === 3 ? -2 : 0);
        pm.hline(ax, armY + 5, 2, C.white); // cuff
        pm.rect(ax, armY + 6, 2, 2, mitt);
        pm.set(ax + 1, armY + 7, mittD);
        return;
      }
      const hx = m.bodyX + m.bodyW;
      const dy = pose === 3 ? 1 : 0;
      pm.hline(hx, armY + 5 + dy, 2, C.white); // cuff
      pm.rect(hx, armY + 6 + dy, 2, 2, mitt);
      pm.set(hx + 1, armY + 7 + dy, mittD);
    },
  },
  // Blazer Smiler — Department of Smiles cultist ("Have a PRODUCTIVE day!")
  smiler: {
    skin: RAMP.SKIN,
    hair: RAMP.INK,
    hairStyle: 'sidepart',
    top: { ramp: RAMP.BLUE, style: 'blazer', accent: RAMP.RED },
    bottom: { ramp: RAMP.INK },
    shoes: RAMP.INK,
    grin: true,
    build: 'adult',
    eyes: 'wide', // the Department stare
  },
  mrsPemmel: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'bob',
    top: { ramp: RAMP.PURPLE, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.PURPLE },
    shoes: RAMP.INK,
    eyes: 'happy',
    mouth: 'smile',
  },
  mrPlummer: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'gray',
    hat: { kind: 'cap', ramp: RAMP.BLUE },
    top: { ramp: RAMP.BLUE, style: 'shirt' },
    bottom: { ramp: RAMP.BLUE },
    shoes: RAMP.INK,
    build: 'adult',
    eyes: 'dot', // forty years of routes
  },
  ana: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    hat: { kind: 'bow', ramp: RAMP.GOLD },
    top: { ramp: RAMP.GOLD, style: 'dress' },
    bottom: { ramp: RAMP.GOLD },
    shoes: RAMP.PAPER,
    mouth: 'smile', // the saleswoman of the pair
  },
  vivi: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    hat: { kind: 'bow', ramp: RAMP.CYAN },
    top: { ramp: RAMP.CYAN, style: 'dress' },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.PAPER,
    eyes: 'dot', // the quality-control of the pair
  },
  oldTimer: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    top: { ramp: RAMP.FOREST, style: 'shirt' },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.EARTH,
    build: 'adult',
    eyes: 'happy', // has seen everything, liked most of it
  },
  pajamaKid: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'short',
    top: { ramp: RAMP.PAPER, style: 'pajama', accent: RAMP.CYAN },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.PAPER,
    eyes: 'dot', // half asleep since the meteor
    longPants: true, // pajama bottoms
    socks: false, // slippers, obviously
  },
  // ---- Brickton City (S1) ----
  // the Department's receptionist: same blazer, bobbed hair, same smile
  smilerB: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    top: { ramp: RAMP.BLUE, style: 'blazer', accent: RAMP.RED },
    bottom: { ramp: RAMP.INK },
    shoes: RAMP.INK,
    grin: true,
    build: 'adult',
    eyes: 'wide', // the Department stare, receptionist grade
  },
  nurse: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'bob',
    top: { ramp: RAMP.PAPER, style: 'apron', accent: RAMP.RED },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.PAPER,
    build: 'adult',
    mouth: 'smile',
  },
  // THE MANAGER (S2) — the blazer the other blazers report to. Gold, gray,
  // grinning. He is not the Hush; he just forwarded it everyone's calendar.
  manager: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    top: { ramp: RAMP.GOLD, style: 'blazer', accent: RAMP.RED },
    bottom: { ramp: RAMP.INK },
    shoes: RAMP.INK,
    grin: true,
    build: 'adult',
    eyes: 'wide', // the stare that signs your timesheet
    // the tie pin: one gold glint, one shade — Employee of Every Month
    detail: ({ pm, dir, bob, m }) => {
      if (dir !== 'down') return;
      const cx = m.bodyX + m.bodyW / 2;
      const y0 = m.bodyTop + bob;
      pm.set(cx - 1, y0 + 3, px(RAMP.GOLD, 3));
      pm.set(cx, y0 + 4, px(RAMP.GOLD, 1));
    },
  },
  quarterMan: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'sidepart',
    top: { ramp: RAMP.PURPLE, style: 'shirt' },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.INK,
    build: 'adult',
    eyes: 'dot',
    mouth: 'frown', // it was RIGHT THERE by the bench
  },
  pigeonKid: {
    skin: RAMP.SKIN,
    hair: RAMP.RED,
    hairStyle: 'short',
    top: { ramp: RAMP.GRASS, style: 'stripe', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.BLUE },
    shoes: RAMP.BLUE,
    mouth: 'open', // mid-fact about pigeons, always
  },
  sidewalkCritic: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    top: { ramp: RAMP.ORANGE, style: 'shirt' },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.EARTH,
    build: 'adult',
    eyes: 'glare',
    mouth: 'frown', // the sidewalk seams are NOT up to code
  },
  // she's near the Department a lot. she used to laugh a lot.
  grayCommuter: {
    skin: RAMP.SKIN,
    hair: RAMP.INK,
    hairStyle: 'bob',
    top: { ramp: RAMP.PAPER, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.NIGHT },
    shoes: RAMP.INK,
    build: 'adult',
    eyes: 'dot',
    mouth: 'none', // the Hush already came for it
  },
  // ---- S4 shopkeepers (§A11: one weird obsession each) ----
  // OTTERBROOK DRUG: knows every expiration date on every shelf by heart
  drugClerk: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    top: { ramp: RAMP.PAPER, style: 'apron', accent: RAMP.CYAN },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.INK,
    glasses: true,
    build: 'adult',
    eyes: 'happy', // squinting at an expiration date right now
  },
  // STARMART: counts the carts out at dawn and back in at dusk
  martClerk: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'short',
    hat: { kind: 'cap', ramp: RAMP.GOLD },
    top: { ramp: RAMP.CYAN, style: 'apron', accent: RAMP.GOLD },
    bottom: { ramp: RAMP.BLUE },
    shoes: RAMP.INK,
    build: 'adult',
    mouth: 'smile', // all carts accounted for
  },
  // ---- the 6:15 bus ----
  busDriver: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    hat: { kind: 'cap', ramp: RAMP.NIGHT },
    top: { ramp: RAMP.CYAN, style: 'shirt' },
    bottom: { ramp: RAMP.NIGHT },
    shoes: RAMP.INK,
    build: 'adult',
    eyes: 'dot', // eyes on the road for thirty years
  },
  fernLady: {
    skin: RAMP.SKIN,
    hair: RAMP.BLOND,
    hairStyle: 'bob',
    top: { ramp: RAMP.FOREST, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.FOREST },
    shoes: RAMP.EARTH,
    build: 'adult',
    eyes: 'happy',
    mouth: 'smile', // the fern is doing wonderfully, thanks for asking
  },
};
