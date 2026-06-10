/**
 * Character sprite generator — EarthBound proportions.
 *
 * Frames are 16×24. The head is ~45% of body height (the EB caricature look),
 * rendered at 3× canvas zoom so a hero stands ~11% of screen height — the
 * "characters look large" rule from the Bible review.
 *
 * Sheet order: down ×4, left ×4, right ×4, up ×4  (walk cycle: stand, stepA,
 * stand, stepB). Left frames are mirrored from right.
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

export const FRAME_W = 16;
export const FRAME_H = 24;

type Dir = 'down' | 'right' | 'up';
type Pose = 0 | 1 | 2 | 3; // stand, stepA, stand, stepB

/* ------------------------------------------------------------------ */

function drawLegsFront(pm: Pixmap, spec: CharacterSpec, pose: Pose): void {
  const pants = px(spec.bottom.ramp, 1);
  const pantsLit = px(spec.bottom.ramp, 2);
  const shoeD = px(spec.shoes, 0);
  const shoe = px(spec.shoes, 1);
  const skirt = spec.top.style === 'dress';
  const hipY = 17;
  // hips connect torso to legs
  if (!skirt) {
    pm.rect(5, hipY, 6, 1, pants);
    pm.set(5, hipY, pantsLit);
  }
  const leg = (x: number, lifted: boolean): void => {
    const legc = skirt ? px(spec.skin, 2) : pants;
    if (lifted) {
      pm.rect(x, 18, 2, 1, legc);
      pm.rect(x, 19, 2, 1, shoe);
      pm.set(x, 19, shoeD);
    } else {
      pm.rect(x, 18, 2, 2, legc);
      pm.rect(x, 20, 2, 1, shoe);
      pm.rect(x, 21, 2, 1, shoeD);
    }
  };
  if (pose === 1) {
    leg(5, true);
    leg(9, false);
  } else if (pose === 3) {
    leg(5, false);
    leg(9, true);
  } else {
    leg(5, false);
    leg(9, false);
  }
}

function drawLegsSide(pm: Pixmap, spec: CharacterSpec, pose: Pose): void {
  const pants = px(spec.bottom.ramp, 1);
  const pantsD = px(spec.bottom.ramp, 0);
  const shoeD = px(spec.shoes, 0);
  const shoe = px(spec.shoes, 1);
  const skirt = spec.top.style === 'dress';
  const legc = skirt ? px(spec.skin, 2) : pants;
  const legcD = skirt ? px(spec.skin, 1) : pantsD;
  if (!skirt) pm.rect(6, 17, 4, 1, pants);
  if (pose === 1) {
    // scissor: front leg forward, back leg back
    pm.rect(9, 18, 2, 2, legc);
    pm.rect(9, 20, 3, 1, shoe);
    pm.set(11, 20, shoeD);
    pm.rect(5, 18, 2, 2, legcD);
    pm.rect(4, 20, 3, 1, shoeD);
  } else if (pose === 3) {
    pm.rect(8, 18, 2, 2, legcD);
    pm.rect(7, 20, 2, 1, shoeD);
    pm.rect(6, 18, 2, 2, legc);
    pm.rect(6, 20, 3, 1, shoe);
  } else {
    pm.rect(6, 18, 2, 2, legcD); // back leg
    pm.rect(8, 18, 2, 2, legc); // front leg
    pm.rect(6, 20, 2, 1, shoeD);
    pm.rect(8, 20, 2, 2, shoe);
    pm.rect(8, 21, 2, 1, shoeD);
  }
}

function drawTorsoFront(pm: Pixmap, spec: CharacterSpec, bob: number, pose: Pose, back: boolean): void {
  const t = spec.top;
  const base = px(t.ramp, 2);
  const dark = px(t.ramp, 1);
  const skin = px(spec.skin, 2);
  const wide = spec.build === 'chub';
  const x0 = wide ? 3 : 4;
  const w = wide ? 10 : 8;
  const y0 = 12 + bob;
  const h = 6 - bob;

  if (t.style === 'dress') {
    pm.rect(x0 + 1, y0, w - 2, 3, base);
    pm.rect(x0, y0 + 3, w, h - 3, base);
    pm.rect(x0, y0 + h - 1, w, 1, dark);
    if (t.accent !== undefined) pm.hline(x0 + 1, y0 + 2, w - 2, px(t.accent, 2));
  } else {
    pm.rect(x0, y0, w, h, base);
    pm.rect(x0, y0 + h - 1, w, 1, dark);
    if (t.style === 'stripe') {
      const acc = px(t.accent ?? RAMP.BLUE, 2);
      pm.hline(x0, y0 + 1, w, acc);
      pm.hline(x0, y0 + 3, w, acc);
    }
    if (t.style === 'blazer' && !back) {
      // lapel V + tie
      pm.set(7, y0, C.white);
      pm.set(8, y0, C.white);
      pm.set(7, y0 + 1, C.white);
      pm.set(8, y0 + 1, px(t.accent ?? RAMP.RED, 2));
      pm.set(8, y0 + 2, px(t.accent ?? RAMP.RED, 2));
    }
    if (t.style === 'gi') {
      // crossed collar + sash
      if (!back) {
        pm.line(6, y0, 8, y0 + 2, dark);
        pm.line(9, y0, 8, y0 + 1, dark);
      }
      pm.hline(x0, y0 + 4, w, px(t.accent ?? RAMP.GOLD, 2));
    }
    if (t.style === 'apron' && !back) {
      pm.rect(6, y0 + 1, 4, h - 1, C.paper);
    }
    if (t.style === 'pajama') {
      const acc = px(t.accent ?? RAMP.CYAN, 2);
      for (let yy = 0; yy < h; yy += 2) pm.hline(x0, y0 + yy, w, acc);
    }
  }
  // arms: sleeve top, hands skin
  const armY = y0;
  const lx = x0 - 1;
  const rx = x0 + w;
  pm.set(lx, armY + 1, dark);
  pm.set(rx, armY + 1, dark);
  pm.set(lx, armY + 2, base);
  pm.set(rx, armY + 2, base);
  const swing = pose === 1 ? 1 : pose === 3 ? -1 : 0;
  pm.set(lx, armY + 3 + (swing === 1 ? 1 : 0), skin);
  pm.set(lx, armY + 4 + (swing === 1 ? 1 : 0), skin);
  pm.set(rx, armY + 3 + (swing === -1 ? 1 : 0), skin);
  pm.set(rx, armY + 4 + (swing === -1 ? 1 : 0), skin);
}

function drawTorsoSide(pm: Pixmap, spec: CharacterSpec, bob: number, pose: Pose): void {
  const t = spec.top;
  const base = px(t.ramp, 2);
  const dark = px(t.ramp, 1);
  const skin = px(spec.skin, 2);
  const y0 = 12 + bob;
  const h = 6 - bob;
  if (t.style === 'dress') {
    pm.rect(6, y0, 4, 3, base);
    pm.rect(5, y0 + 3, 6, h - 3, base);
    pm.hline(5, y0 + h - 1, 6, dark);
  } else {
    pm.rect(5, y0, 6, h, base);
    pm.hline(5, y0 + h - 1, 6, dark);
    if (t.style === 'stripe') {
      const acc = px(t.accent ?? RAMP.BLUE, 2);
      pm.hline(5, y0 + 1, 6, acc);
      pm.hline(5, y0 + 3, 6, acc);
    }
    if (t.style === 'gi') pm.hline(5, y0 + 4, 6, px(t.accent ?? RAMP.GOLD, 2));
    if (t.style === 'pajama') {
      const acc = px(t.accent ?? RAMP.CYAN, 2);
      for (let yy = 0; yy < h; yy += 2) pm.hline(5, y0 + yy, 6, acc);
    }
  }
  // swinging arm in front
  const swing = pose === 1 ? 1 : pose === 3 ? -1 : 0;
  const ax = 8 + swing;
  pm.set(ax, y0 + 1, dark);
  pm.rect(ax, y0 + 2, 1, 2, base);
  pm.set(ax, y0 + 4, skin);
}

function drawHeadFront(pm: Pixmap, spec: CharacterSpec, bob: number, back: boolean): void {
  const skin = px(spec.skin, 2);
  const skinD = px(spec.skin, 1);
  const hairB = px(spec.hair, 1);
  const hair = px(spec.hair, 2);
  const hairL = px(spec.hair, 3);
  const y0 = 2 + bob;
  const wide = spec.build === 'chub';
  const hx = wide ? 2 : 3;
  const hw = wide ? 12 : 10;

  // skull base
  pm.rect(hx, y0, hw, 10, back ? hair : skin);
  // round the corners
  pm.set(hx, y0, T);
  pm.set(hx + hw - 1, y0, T);
  pm.set(hx, y0 + 9, T);
  pm.set(hx + hw - 1, y0 + 9, T);
  pm.hline(hx + 1, y0 + 9, hw - 2, back ? hairB : skinD); // jaw shadow

  const hatted = spec.hat?.kind === 'cap';
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    pm.rect(hx, y0, hw, 3, cap);
    pm.set(hx, y0, T);
    pm.set(hx + hw - 1, y0, T);
    pm.hline(hx + 1, y0 - 1, hw - 2, cap);
    pm.hline(hx - 1, y0 + 3, hw + 2, back ? cap : capD); // brim wraps
    pm.set(hx + hw / 2 - 1, y0, capD); // button seam
  } else {
    switch (spec.hairStyle) {
      case 'short':
      case 'sidepart':
      case 'gray': {
        pm.rect(hx, y0, hw, 3, hair);
        pm.set(hx, y0, T);
        pm.set(hx + hw - 1, y0, T);
        pm.hline(hx + 1, y0, hw - 2, hairL);
        if (!back) {
          if (spec.hairStyle === 'sidepart') pm.hline(hx + 1, y0 + 3, 5, hair);
          else {
            pm.set(hx + 1, y0 + 3, hair);
            pm.set(hx + hw - 2, y0 + 3, hair);
          }
        } else {
          pm.rect(hx, y0 + 3, hw, 6, hair); // back of head: all hair
          pm.hline(hx + 1, y0 + 9, hw - 2, hairB);
        }
        break;
      }
      case 'bob': {
        pm.rect(hx, y0, hw, 3, hair);
        pm.set(hx, y0, T);
        pm.set(hx + hw - 1, y0, T);
        pm.hline(hx + 1, y0, hw - 2, hairL);
        // curtains down the sides
        pm.rect(hx, y0 + 3, 1, 5, hair);
        pm.rect(hx + hw - 1, y0 + 3, 1, 5, hair);
        pm.set(hx, y0 + 8, hairB);
        pm.set(hx + hw - 1, y0 + 8, hairB);
        if (back) {
          pm.rect(hx + 1, y0 + 3, hw - 2, 6, hair);
          pm.hline(hx + 1, y0 + 9, hw - 2, hairB);
        }
        break;
      }
      case 'topknot': {
        pm.rect(hx, y0, hw, 2, hairB);
        pm.set(hx, y0, T);
        pm.set(hx + hw - 1, y0, T);
        pm.rect(hx + hw / 2 - 1, y0 - 2, 2, 2, hair); // bun
        if (back) pm.rect(hx, y0 + 2, hw, 7, hairB);
        break;
      }
      case 'none':
        if (back) pm.rect(hx, y0 + 3, hw, 6, skin);
        break;
    }
  }

  if (spec.hat?.kind === 'bow') {
    const bow = px(spec.hat.ramp, 2);
    pm.rect(hx + hw - 3, y0 - 1, 2, 2, bow);
    pm.rect(hx + hw - 5, y0, 1, 1, px(spec.hat.ramp, 1));
  }

  if (!back) {
    // face
    const eyeY = y0 + 5;
    pm.rect(hx + 2, eyeY, 1, 2, C.outline);
    pm.rect(hx + hw - 3, eyeY, 1, 2, C.outline);
    if (spec.glasses) {
      const g = C.inkSoft;
      pm.frame(hx + 1, eyeY - 1, 3, 3, g);
      pm.frame(hx + hw - 4, eyeY - 1, 3, 3, g);
      pm.set(hx + 4, eyeY, g);
      pm.set(hx + hw - 5, eyeY, g);
      pm.set(hx + 2, eyeY, C.outline);
      pm.set(hx + hw - 3, eyeY, C.outline);
    }
    if (spec.grin) {
      pm.rect(hx + 2, y0 + 7, hw - 4, 2, C.white);
      pm.frame(hx + 2, y0 + 7, hw - 4, 2, C.outline);
      pm.hline(hx + 2, y0 + 7, hw - 4, C.white);
    }
  }
}

function drawHeadSide(pm: Pixmap, spec: CharacterSpec, bob: number): void {
  const skin = px(spec.skin, 2);
  const skinD = px(spec.skin, 1);
  const hairB = px(spec.hair, 1);
  const hair = px(spec.hair, 2);
  const hairL = px(spec.hair, 3);
  const y0 = 2 + bob;
  // skull: facing right; face occupies the right third
  pm.rect(3, y0, 10, 10, skin);
  pm.set(3, y0, T);
  pm.set(12, y0, T);
  pm.set(3, y0 + 9, T);
  pm.set(12, y0 + 9, T);
  pm.hline(4, y0 + 9, 8, skinD);
  pm.set(13, y0 + 6, skin); // nose bump

  const hatted = spec.hat?.kind === 'cap';
  if (hatted && spec.hat) {
    const cap = px(spec.hat.ramp, 2);
    const capD = px(spec.hat.ramp, 1);
    pm.rect(3, y0, 10, 3, cap);
    pm.set(3, y0, T);
    pm.set(12, y0, T);
    pm.hline(4, y0 - 1, 8, cap);
    pm.hline(9, y0 + 3, 5, capD); // brim forward
    pm.rect(3, y0 + 3, 3, 4, cap); // back of cap
  } else {
    switch (spec.hairStyle) {
      case 'short':
      case 'sidepart':
      case 'gray':
        pm.rect(3, y0, 10, 3, hair);
        pm.set(3, y0, T);
        pm.set(12, y0, T);
        pm.hline(4, y0, 8, hairL);
        pm.rect(3, y0 + 3, 4, 5, hair); // back of head
        pm.set(3, y0 + 7, hairB);
        break;
      case 'bob':
        pm.rect(3, y0, 10, 3, hair);
        pm.set(3, y0, T);
        pm.set(12, y0, T);
        pm.hline(4, y0, 8, hairL);
        pm.rect(3, y0 + 3, 4, 6, hair);
        pm.set(3, y0 + 8, hairB);
        pm.set(4, y0 + 8, hairB);
        break;
      case 'topknot':
        pm.rect(3, y0, 10, 2, hairB);
        pm.set(3, y0, T);
        pm.set(12, y0, T);
        pm.rect(6, y0 - 2, 2, 2, hair);
        pm.rect(3, y0 + 2, 3, 5, hairB);
        break;
      case 'none':
        break;
    }
  }
  if (spec.hat?.kind === 'bow') {
    pm.rect(4, y0 - 1, 2, 2, px(spec.hat.ramp, 2));
  }
  // eye
  pm.rect(10, y0 + 5, 1, 2, C.outline);
  if (spec.glasses) {
    pm.frame(9, y0 + 4, 3, 3, C.inkSoft);
    pm.set(10, y0 + 5, C.outline);
    pm.hline(4, y0 + 5, 5, C.inkSoft); // temple arm
  }
  if (spec.grin) {
    pm.rect(9, y0 + 7, 4, 2, C.white);
  }
}

/* ------------------------------------------------------------------ */

function drawFrame(spec: CharacterSpec, dir: Dir, pose: Pose): Pixmap {
  const pm = new Pixmap(FRAME_W, FRAME_H);
  const bob = pose === 1 || pose === 3 ? 1 : 0;
  if (dir === 'down' || dir === 'up') {
    drawLegsFront(pm, spec, pose);
    drawTorsoFront(pm, spec, bob, pose, dir === 'up');
    drawHeadFront(pm, spec, bob, dir === 'up');
  } else {
    drawLegsSide(pm, spec, pose);
    drawTorsoSide(pm, spec, bob, pose);
    drawHeadSide(pm, spec, bob);
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
    pm.rect(3, 7, 9, 4, body); // body
    pm.rect(9, 4, 5, 4, body); // head
    pm.set(9, 4, T);
    pm.set(13, 4, T);
    pm.rect(9, 4, 2, 3, earC); // ear
    pm.set(12, 6, C.outline); // eye
    pm.set(14, 7, C.outline); // nose
    pm.rect(4, 7, 3, 2, patch); // back patch
    pm.set(2, 6, earC); // tail
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
    pm.rect(4, 4 + lift, 4, 3, px(RAMP.SKIN, 2)); // little head
    pm.hline(4, 1 + lift, 4, halo);
    pm.rect(3, 7 + lift, 6, 5, robe);
    pm.set(3, 11 + lift, T);
    pm.set(8, 11 + lift, T);
    pm.set(2, 8 + lift, px(RAMP.PAPER, 1)); // wings
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
};
