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
}

export const FRAME_W = 24;
export const FRAME_H = 32;

type Dir = 'down' | 'right' | 'up';
type Pose = 0 | 1 | 2 | 3; // stand, stepA, stand, stepB

interface Metrics {
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

/** rectangle with stepped (rounded) corners */
function roundedBlock(pm: Pixmap, x: number, y: number, w: number, h: number, c: number): void {
  pm.rect(x, y, w, h, c);
  for (const [cx, cy] of [
    [x, y],
    [x + w - 1, y],
    [x, y + h - 1],
    [x + w - 1, y + h - 1],
  ]) {
    pm.set(cx, cy, T);
  }
  // 2-step chamfer for a properly round skull
  pm.set(x + 1, y, T);
  pm.set(x + w - 2, y, T);
  pm.set(x, y + 1, T);
  pm.set(x + w - 1, y + 1, T);
  pm.set(x + 1, y + h - 1, T);
  pm.set(x + w - 2, y + h - 1, T);
  pm.set(x, y + h - 2, T);
  pm.set(x + w - 1, y + h - 2, T);
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

  // skull
  roundedBlock(pm, x0, y0, w, m.headH, back ? hair : skin);
  if (!back) {
    // forehead light + jaw shadow
    pm.hline(x0 + 2, y0 + 1, w - 6, skinL);
    pm.hline(x0 + 2, yBot, w - 4, skinD);
    pm.hline(x0 + 3, yBot - 1, 3, skinD);
    pm.hline(x0 + w - 6, yBot - 1, 3, skinD);
    // little ears
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
    roundedBlock(pm, x0, y0, w, 5, cap);
    pm.hline(x0 + 2, y0 - 1, w - 4, cap);
    pm.hline(x0 + 3, y0, w - 8, capL); // crown highlight
    pm.hline(x0 + 2, y0 + 4, w - 4, capD); // band
    pm.rect(x0 + w / 2 - 1, y0 - 1, 2, 2, capD); // button
    // brim: wider than the head, darker underside
    pm.hline(x0 - 2, y0 + 5, w + 4, back ? cap : capL);
    pm.hline(x0 - 2, y0 + 6, w + 4, capD);
  } else {
    switch (spec.hairStyle) {
      case 'short':
      case 'sidepart':
      case 'gray': {
        roundedBlock(pm, x0, y0, w, 5, hair);
        pm.hline(x0 + 3, y0, w - 9, hairL);
        pm.hline(x0 + 2, y0 + 1, 4, hairL);
        if (!back) {
          // jagged fringe
          for (let i = 0; i < w - 4; i += 2) {
            pm.set(x0 + 2 + i, y0 + 5, hair);
          }
          if (spec.hairStyle === 'sidepart') {
            pm.hline(x0 + 2, y0 + 5, Math.floor(w / 2), hair);
            pm.hline(x0 + 2, y0 + 6, Math.floor(w / 2) - 3, hairB);
          }
          // sideburn pixels
          pm.rect(x0, y0 + 5, 1, 3, hair);
          pm.rect(x0 + w - 1, y0 + 5, 1, 3, hair);
        } else {
          pm.rect(x0, y0 + 5, w, m.headH - 5, hair);
          pm.set(x0, yBot, T);
          pm.set(x0 + w - 1, yBot, T);
          pm.hline(x0 + 2, yBot, w - 4, hairB);
          pm.hline(x0 + 1, yBot - 1, w - 2, hairB);
          // whorl
          pm.set(x0 + w / 2 + 2, y0 + 6, hairB);
          pm.set(x0 + w / 2 + 3, y0 + 7, hairB);
        }
        break;
      }
      case 'bob': {
        roundedBlock(pm, x0, y0, w, 5, hair);
        pm.hline(x0 + 3, y0, w - 9, hairL);
        // side curtains with shadowed tips
        pm.rect(x0 - 1, y0 + 3, 2, 8, hair);
        pm.rect(x0 + w - 1, y0 + 3, 2, 8, hair);
        pm.hline(x0 - 1, y0 + 10, 2, hairB);
        pm.hline(x0 + w - 1, y0 + 10, 2, hairB);
        if (!back) {
          for (let i = 0; i < w - 4; i += 2) pm.set(x0 + 2 + i, y0 + 5, hair);
        } else {
          pm.rect(x0, y0 + 5, w, m.headH - 5, hair);
          pm.set(x0, yBot, T);
          pm.set(x0 + w - 1, yBot, T);
          pm.hline(x0 + 1, yBot, w - 2, hairB);
        }
        break;
      }
      case 'topknot': {
        roundedBlock(pm, x0, y0, w, 4, hairB);
        pm.rect(x0 + w / 2 - 2, y0 - 3, 4, 3, hair);
        pm.set(x0 + w / 2 - 2, y0 - 3, T);
        pm.set(x0 + w / 2 + 1, y0 - 3, T);
        pm.set(x0 + w / 2 - 1, y0 - 3, hairL);
        if (back) {
          pm.rect(x0, y0 + 4, w, m.headH - 4, hairB);
          pm.set(x0, yBot, T);
          pm.set(x0 + w - 1, yBot, T);
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
    // eyes: 2×3 with a catchlight, set close like EB faces
    const eyeY = y0 + 7;
    const lx = x0 + Math.floor(w / 2) - 4;
    const rx = x0 + Math.floor(w / 2) + 2;
    pm.rect(lx, eyeY, 2, 3, C.outline);
    pm.rect(rx, eyeY, 2, 3, C.outline);
    pm.set(lx, eyeY, C.white);
    pm.set(rx, eyeY, C.white);
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
      pm.hline(x0 + w / 2 - 1, yBot - 1, 2, skinD); // hint of a mouth
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
    // pleat shadows
    pm.vline(x0 + 3, y0 + 5, h - 5, dark);
    pm.vline(x0 + w - 4, y0 + 5, h - 5, dark);
    pm.vline(x0, y0 + 5, h - 5, lit);
    if (t.accent !== undefined) pm.hline(x0 + 1, y0 + 3, w - 2, px(t.accent, 3)); // sash
    if (!back) {
      pm.hline(x0 + 2, y0, w - 4, px(spec.skin, 2)); // collar line of skin
    }
  } else {
    pm.rect(x0, y0, w, h, base);
    // 3-tone shading: lit left, shadow right + hem
    pm.vline(x0, y0, h, lit);
    pm.vline(x0 + 1, y0, 2, lit);
    pm.vline(x0 + w - 1, y0 + 1, h - 1, dark);
    pm.hline(x0, hemY, w, dark);
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
        if (!back) pm.hline(x0 + w / 2 - 2, y0, 4, dark); // collar dip
        break;
      }
    }
  }

  // arms: sleeves then bare arm + hand, counter-swing in walk
  const armY = y0 + 1;
  const armLen = 7;
  const swing = pose === 1 ? 1 : pose === 3 ? -1 : 0;
  const drawArm = (ax: number, dy: number): void => {
    pm.rect(ax, armY + dy, 2, 3, base); // sleeve
    pm.set(ax, armY + dy, lit);
    pm.set(ax + 1, armY + 2 + dy, dark);
    pm.rect(ax, armY + 3 + dy, 2, armLen - 4, skin);
    pm.rect(ax, armY + armLen - 1 + dy, 2, 2, skin); // hand
    pm.set(ax + 1, armY + armLen + dy, skinD);
  };
  drawArm(x0 - 2, swing === 1 ? 1 : 0);
  drawArm(x0 + w, swing === -1 ? 1 : 0);
}

function legsFront(pm: Pixmap, spec: CharacterSpec, m: Metrics, pose: Pose): void {
  const pants = px(spec.bottom.ramp, 2);
  const pantsL = px(spec.bottom.ramp, 3);
  const pantsD = px(spec.bottom.ramp, 1);
  const shoeTop = px(spec.shoes, 1);
  const shoeSole = px(spec.shoes, 0);
  const skirt = spec.top.style === 'dress';
  const skin = px(spec.skin, 2);
  const x0 = m.bodyX + 1;
  const w = m.bodyW - 2;
  const legW = Math.floor((w - 2) / 2);
  const lx = x0;
  const rx = x0 + w - legW;

  if (!skirt) {
    pm.rect(x0, m.hipY - 1, w, 1, pants); // hip row
    pm.set(x0, m.hipY - 1, pantsL);
  }

  const leg = (x: number, lifted: boolean): void => {
    const c = skirt ? skin : pants;
    const cd = skirt ? px(spec.skin, 1) : pantsD;
    if (lifted) {
      pm.rect(x, m.hipY, legW, 2, c);
      pm.vline(x, m.hipY, 2, skirt ? skin : pantsL);
      pm.rect(x, m.hipY + 2, legW, 1, cd); // cuff
      pm.rect(x, m.hipY + 3, legW, 1, shoeTop);
      pm.rect(x, m.hipY + 4, legW, 1, shoeSole);
    } else {
      pm.rect(x, m.hipY, legW, 4, c);
      pm.vline(x, m.hipY, 4, skirt ? skin : pantsL);
      pm.vline(x + legW - 1, m.hipY, 4, cd);
      pm.rect(x, m.shoeY, legW, 1, shoeTop);
      pm.rect(x, m.shoeY + 1, legW, 1, shoeSole);
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

  roundedBlock(pm, x0, y0, w, m.headH, skin);
  pm.hline(x0 + 3, y0 + 1, w - 8, skinL);
  pm.hline(x0 + 2, yBot, w - 4, skinD);
  // nose bump + nostril shadow
  pm.set(x0 + w, y0 + 8, skin);
  pm.set(x0 + w, y0 + 9, skinD);
  // ear
  pm.rect(x0 + 6, y0 + 7, 3, 4, skin);
  pm.frame(x0 + 6, y0 + 7, 3, 4, skinD);
  pm.set(x0 + 7, y0 + 8, skinD);

  const hatted = spec.hat?.kind === 'cap';
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    const capL = px(spec.hat.ramp, 3);
    roundedBlock(pm, x0, y0, w, 5, cap);
    pm.hline(x0 + 2, y0 - 1, w - 4, cap);
    pm.hline(x0 + 3, y0, w - 8, capL);
    pm.hline(x0 + 1, y0 + 4, w - 2, capD);
    pm.rect(x0, y0 + 4, 4, 4, cap); // back of cap hugs the skull
    // brim forward
    pm.hline(x0 + w - 3, y0 + 5, 7, capL);
    pm.hline(x0 + w - 3, y0 + 6, 7, capD);
  } else {
    switch (spec.hairStyle) {
      case 'short':
      case 'sidepart':
      case 'gray':
        roundedBlock(pm, x0, y0, w, 5, hair);
        pm.hline(x0 + 3, y0, w - 8, hairL);
        pm.rect(x0, y0 + 4, 5, m.headH - 6, hair); // back of head
        pm.vline(x0, y0 + 5, m.headH - 8, hairB);
        pm.set(x0 + 1, yBot - 1, hairB);
        // bangs over the brow
        pm.hline(x0 + w - 7, y0 + 5, 5, hair);
        if (spec.hairStyle === 'sidepart') pm.hline(x0 + w - 9, y0 + 6, 4, hairB);
        break;
      case 'bob':
        roundedBlock(pm, x0, y0, w, 5, hair);
        pm.hline(x0 + 3, y0, w - 8, hairL);
        pm.rect(x0 - 1, y0 + 3, 6, m.headH - 4, hair);
        pm.vline(x0 - 1, y0 + 4, m.headH - 6, hairB);
        pm.hline(x0 - 1, yBot, 5, hairB);
        pm.hline(x0 + w - 7, y0 + 5, 5, hair);
        break;
      case 'topknot':
        roundedBlock(pm, x0, y0, w, 4, hairB);
        pm.rect(x0 + 4, y0 - 3, 4, 3, hair);
        pm.set(x0 + 4, y0 - 3, T);
        pm.set(x0 + 7, y0 - 3, T);
        pm.set(x0 + 5, y0 - 3, hairL);
        pm.rect(x0, y0 + 3, 4, 6, hairB);
        break;
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

  // single eye
  const eyeY = y0 + 7;
  const ex = x0 + w - 5;
  pm.rect(ex, eyeY, 2, 3, C.outline);
  pm.set(ex, eyeY, C.white);
  if (spec.glasses) {
    pm.frame(ex - 1, eyeY - 1, 4, 5, C.inkSoft);
    pm.hline(x0 + 8, eyeY, w - 14, C.inkSoft); // temple arm to the ear
    pm.set(ex + 2, eyeY - 1, px(RAMP.CYAN, 3));
  }
  if (spec.grin) {
    pm.rect(x0 + w - 7, yBot - 2, 6, 3, C.white);
    pm.frame(x0 + w - 7, yBot - 2, 6, 3, C.outline);
  } else {
    pm.set(x0 + w - 2, yBot - 1, skinD);
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
    pm.vline(x0 + w - 1, y0, h, lit); // chest catches the light
    pm.hline(x0, hemY, w, dark);
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

  const c = skirt ? skin : pants;
  const cBack = skirt ? skinD : pantsD;
  if (!skirt) pm.rect(cx - 4, m.hipY - 1, 8, 1, pants);

  const drawLeg = (x: number, shade: 'front' | 'back', stretch: number): void => {
    const col = shade === 'front' ? c : cBack;
    pm.rect(x, m.hipY, legW, 4, col);
    if (shade === 'front' && !skirt) pm.vline(x, m.hipY, 4, pantsL);
    // shoe with a toe
    const sy = m.shoeY;
    pm.rect(x - (stretch < 0 ? 1 : 0), sy, legW + 1 + Math.max(0, stretch), 1, shade === 'front' ? shoeTop : shoeSole);
    pm.rect(x - (stretch < 0 ? 1 : 0), sy + 1, legW + 1 + Math.max(0, stretch), 1, shoeSole);
  };

  if (pose === 1) {
    // scissor: front leg reaching forward, back leg trailing
    pm.rect(cx + 1, m.hipY, legW, 3, c);
    pm.rect(cx + 2, m.hipY + 3, legW, 1, c);
    pm.rect(cx + 2, m.shoeY, legW + 1, 1, shoeTop);
    pm.rect(cx + 2, m.shoeY + 1, legW + 1, 1, shoeSole);
    pm.rect(cx - 4, m.hipY, legW, 3, cBack);
    pm.rect(cx - 5, m.hipY + 3, legW, 1, cBack);
    pm.rect(cx - 6, m.shoeY, legW + 1, 1, shoeSole);
    pm.rect(cx - 6, m.shoeY + 1, legW + 1, 1, shoeSole);
  } else if (pose === 3) {
    pm.rect(cx - 3, m.hipY, legW, 3, c);
    pm.rect(cx - 4, m.hipY + 3, legW, 1, c);
    pm.rect(cx - 5, m.shoeY, legW + 1, 1, shoeTop);
    pm.rect(cx - 5, m.shoeY + 1, legW + 1, 1, shoeSole);
    pm.rect(cx + 1, m.hipY, legW, 3, cBack);
    pm.rect(cx + 2, m.hipY + 3, legW, 1, cBack);
    pm.rect(cx + 2, m.shoeY, legW + 1, 1, shoeSole);
    pm.rect(cx + 2, m.shoeY + 1, legW + 1, 1, shoeSole);
  } else {
    drawLeg(cx - 3, 'back', 0);
    drawLeg(cx, 'front', 1);
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

/** Biscuit-style beagle, side view, 2 walk frames + flip (16×16) */
export function generateDogFrames(): Pixmap[] {
  const body = px(RAMP.PAPER, 2);
  const patch = px(RAMP.EARTH, 2);
  const earC = px(RAMP.EARTH, 1);
  const make = (step: boolean): Pixmap => {
    const pm = new Pixmap(16, 16);
    pm.rect(3, 7, 9, 4, body);
    pm.rect(9, 4, 5, 4, body);
    pm.set(9, 4, T);
    pm.set(13, 4, T);
    pm.rect(9, 4, 2, 3, earC);
    pm.set(12, 6, C.outline);
    pm.set(14, 7, C.outline);
    pm.rect(4, 7, 3, 2, patch);
    pm.set(2, 6, earC);
    pm.set(1, 5, earC);
    if (step) {
      pm.rect(4, 11, 1, 2, body);
      pm.rect(7, 11, 1, 1, body);
      pm.rect(9, 11, 1, 2, body);
      pm.rect(11, 11, 1, 1, body);
    } else {
      pm.rect(5, 11, 1, 1, body);
      pm.rect(7, 11, 1, 2, body);
      pm.rect(9, 11, 1, 1, body);
      pm.rect(11, 11, 1, 2, body);
    }
    pm.outline(C.outline);
    return pm;
  };
  const a = make(false);
  const b = make(true);
  return [a, b, a.flipX(), b.flipX()];
}

/** Glint — the firefly star-creature (12×12, 2 sparkle frames) */
export function generateGlintFrames(): Pixmap[] {
  const core = px(RAMP.GOLD, 3);
  const mid = px(RAMP.GOLD, 2);
  const wing = px(RAMP.CYAN, 3);
  const f1 = new Pixmap(12, 12);
  f1.ellipse(6, 6, 2, 2, core);
  f1.set(6, 6, C.white);
  f1.vline(6, 1, 3, mid);
  f1.vline(6, 9, 2, mid);
  f1.hline(1, 6, 3, mid);
  f1.hline(9, 6, 2, mid);
  f1.set(3, 3, wing);
  f1.set(9, 3, wing);
  const f2 = new Pixmap(12, 12);
  f2.ellipse(6, 6, 2, 2, core);
  f2.set(6, 6, C.white);
  f2.set(3, 3, mid);
  f2.set(9, 9, mid);
  f2.set(9, 3, mid);
  f2.set(3, 9, mid);
  f2.set(2, 6, wing);
  f2.set(10, 6, wing);
  return [f1, f2];
}

/** small haloed angel sprite for fallen heroes (12×16, 2 float frames) */
export function generateAngelFrames(): Pixmap[] {
  const robe = C.white;
  const halo = px(RAMP.GOLD, 3);
  const make = (lift: number): Pixmap => {
    const pm = new Pixmap(12, 16);
    pm.rect(4, 4 + lift, 4, 3, px(RAMP.SKIN, 2));
    pm.hline(4, 1 + lift, 4, halo);
    pm.rect(3, 7 + lift, 6, 5, robe);
    pm.set(3, 11 + lift, T);
    pm.set(8, 11 + lift, T);
    pm.set(2, 8 + lift, px(RAMP.PAPER, 1));
    pm.set(9, 8 + lift, px(RAMP.PAPER, 1));
    pm.outline(C.outline);
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
  },
  // Faye — Paula archetype: blonde, red bow, rose dress
  faye: {
    skin: RAMP.SKIN,
    hair: RAMP.BLOND,
    hairStyle: 'bob',
    hat: { kind: 'bow', ramp: RAMP.RED },
    top: { ramp: RAMP.MAGENTA, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.MAGENTA },
    shoes: RAMP.RED,
  },
  // Milo — Jeff archetype: glasses, teal blazer, tea snob
  milo: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'sidepart',
    top: { ramp: RAMP.CYAN, style: 'blazer', accent: RAMP.RED },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.EARTH,
    glasses: true,
  },
  // Dorin — Poo archetype: topknot, monastery gi
  dorin: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'topknot',
    top: { ramp: RAMP.PAPER, style: 'gi', accent: RAMP.GOLD },
    bottom: { ramp: RAMP.PAPER },
    shoes: RAMP.EARTH,
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
  },
  mom: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    top: { ramp: RAMP.CYAN, style: 'apron' },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.EARTH,
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
  },
  mrsPemmel: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'bob',
    top: { ramp: RAMP.PURPLE, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.PURPLE },
    shoes: RAMP.INK,
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
  },
  ana: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    hat: { kind: 'bow', ramp: RAMP.GOLD },
    top: { ramp: RAMP.GOLD, style: 'dress' },
    bottom: { ramp: RAMP.GOLD },
    shoes: RAMP.PAPER,
  },
  vivi: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'bob',
    hat: { kind: 'bow', ramp: RAMP.CYAN },
    top: { ramp: RAMP.CYAN, style: 'dress' },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.PAPER,
  },
  oldTimer: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    top: { ramp: RAMP.FOREST, style: 'shirt' },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.EARTH,
    build: 'adult',
  },
  pajamaKid: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'short',
    top: { ramp: RAMP.PAPER, style: 'pajama', accent: RAMP.CYAN },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.PAPER,
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
  },
  nurse: {
    skin: RAMP.SKIN_DEEP,
    hair: RAMP.INK,
    hairStyle: 'bob',
    top: { ramp: RAMP.PAPER, style: 'apron', accent: RAMP.RED },
    bottom: { ramp: RAMP.CYAN },
    shoes: RAMP.PAPER,
    build: 'adult',
  },
  quarterMan: {
    skin: RAMP.SKIN,
    hair: RAMP.EARTH,
    hairStyle: 'sidepart',
    top: { ramp: RAMP.PURPLE, style: 'shirt' },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.INK,
    build: 'adult',
  },
  pigeonKid: {
    skin: RAMP.SKIN,
    hair: RAMP.RED,
    hairStyle: 'short',
    top: { ramp: RAMP.GRASS, style: 'stripe', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.BLUE },
    shoes: RAMP.BLUE,
  },
  sidewalkCritic: {
    skin: RAMP.SKIN,
    hair: RAMP.PAPER,
    hairStyle: 'gray',
    top: { ramp: RAMP.ORANGE, style: 'shirt' },
    bottom: { ramp: RAMP.EARTH },
    shoes: RAMP.EARTH,
    build: 'adult',
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
  },
  fernLady: {
    skin: RAMP.SKIN,
    hair: RAMP.BLOND,
    hairStyle: 'bob',
    top: { ramp: RAMP.FOREST, style: 'dress', accent: RAMP.PAPER },
    bottom: { ramp: RAMP.FOREST },
    shoes: RAMP.EARTH,
    build: 'adult',
  },
};
