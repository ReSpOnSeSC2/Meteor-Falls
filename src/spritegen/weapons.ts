/**
 * WEAPON_ART — S11b "weapons are real objects". Every §A8 EQUIPPABLE maps to
 * drawn art, and the validator (tools/content-validate.ts + the vitest mirror
 * in weapons.test.ts) gates the registry BOTH directions like ADR-030's fx
 * gate: an equippable without an art row and an art row no item claims both
 * fail naming the gap.
 *
 * Three art kinds, one per equip-slot family:
 *  - 'held'    (weapon slot): composed into the battler's grip at sheet-
 *    generation time (spritegen/battlers.ts) — one SILHOUETTE per weapon
 *    class so the swing reads identically down a §A8 line, item-specific by
 *    ramp + a detail pass (a Cracked bat and a T-Ball bat read differently,
 *    the silhouette never drifts).
 *  - 'torso'   ('body' slot): rendered ON battler and bust torsos — the
 *    Champion Jacket is visible the moment it's equipped; equipment is never
 *    invisible again.
 *  - 'trinket' ('other' + 'arms' slots): a drawn icon (charms ride pockets;
 *    S12's STARTING FOUR wristwear reads as icons — ADR-034 amends ADR-032's
 *    provisional arms-to-torso mapping, set before any arms item shipped).
 *
 * Phaser-free on purpose: the validator imports this file. ADR-020 rules
 * hold — weapons are drawn BEFORE outline() so they live inside the sprite's
 * one contour; only pure light (the pan glint) lands after.
 */
import { Pixmap } from './pixmap';
import { RAMP, px, C } from '../palette';

/** the swing family a held weapon belongs to — drives choreography + sfx */
export type WeaponClass = 'bat' | 'pan' | 'rifle' | 'beads';

/** the orientations a held weapon is drawn in, per battler pose */
export type HeldPose = 'rest' | 'back' | 'strike' | 'aim' | 'recoil';

/** grip context the battler hands to the weapon draw */
export interface GripCtx {
  pm: Pixmap;
  /** near-hand pixel (the grip) in frame coords */
  gx: number;
  gy: number;
  pose: HeldPose;
}

export interface HeldArt {
  kind: 'held';
  class: WeaponClass;
  /** palette ramp for the weapon body (cedar vs cast-iron vs aluminum) */
  ramp: number;
  /** item-specific pass (tape, cracks, rings, dents) over the class silhouette */
  detail?: (ctx: GripCtx) => void;
}

export interface TorsoArt {
  kind: 'torso';
  /** garment ramp the torso re-dresses in (battler back + bust front) */
  ramp: number;
  /** trim/sleeve ramp */
  trim: number;
}

export interface TrinketArt {
  kind: 'trinket';
  /** small drawn icon — the charm itself (menus; never a torso composition) */
  icon: () => Pixmap;
}

export type WeaponArt = HeldArt | TorsoArt | TrinketArt;

const held = (a: Omit<HeldArt, 'kind'>): HeldArt => ({ kind: 'held', ...a });

/* ================================================================== */
/* Class silhouettes — ONE drawing per class; items recolor + detail.  */
/* All draws happen pre-outline; coordinates are relative to the grip. */

/** bat: a tapered 2px shaft swinging off the grip; taped near the hands */
function drawBat(ctx: GripCtx, ramp: number): void {
  const { pm, gx, gy, pose } = ctx;
  const wood = px(ramp, 2);
  const woodL = px(ramp, 3);
  const woodD = px(ramp, 1);
  const seg = (x0: number, y0: number, x1: number, y1: number): void => {
    pm.line(x0, y0, x1, y1, wood);
    pm.line(x0 + 1, y0, x1 + 1, y1, woodD); // shaft thickness
  };
  if (pose === 'back') {
    // wound up over the far shoulder, tip high behind the head
    seg(gx - 9, gy - 9, gx, gy);
    pm.line(gx - 9, gy - 10, gx - 4, gy - 5, woodL); // lit top edge
    pm.rect(gx - 11, gy - 12, 3, 3, wood); // the fat tip
    pm.set(gx - 11, gy - 12, woodL);
  } else if (pose === 'strike') {
    // follow-through: swept out level past the lead hand (foreshortened —
    // the swing climbs AWAY from the camera, up at the bird)
    seg(gx + 1, gy - 1, gx + 7, gy - 3);
    pm.line(gx + 1, gy - 2, gx + 6, gy - 4, woodL);
    pm.rect(gx + 7, gy - 5, 3, 3, wood);
    pm.set(gx + 9, gy - 5, woodL);
  } else {
    // rest: shouldered, tip up-right
    seg(gx + 1, gy - 2, gx + 5, gy - 7);
    pm.rect(gx + 5, gy - 9, 3, 3, wood);
    pm.set(gx + 5, gy - 9, woodL);
  }
  // taped shaft — two wraps just off the grip (every §A8 bat is loved)
  const tape = px(RAMP.PAPER, 2);
  if (pose === 'back') {
    pm.set(gx - 2, gy - 2, tape);
    pm.set(gx - 4, gy - 4, tape);
  } else if (pose === 'strike') {
    pm.set(gx + 2, gy - 1, tape);
    pm.set(gx + 4, gy - 2, tape);
  } else {
    pm.set(gx + 2, gy - 3, tape);
    pm.set(gx + 3, gy - 4, tape);
  }
}

/** pan: the §A3 disc + handle, swung like the family heirloom it is */
function drawPan(ctx: GripCtx, ramp: number): void {
  const { pm, gx, gy, pose } = ctx;
  const iron = px(ramp, 1);
  const ironL = px(ramp, 2);
  const handle = px(RAMP.EARTH, 1);
  if (pose === 'back') {
    // two-hand wind-up: pan high behind the far shoulder
    pm.line(gx, gy, gx - 4, gy - 5, handle);
    pm.rect(gx - 9, gy - 10, 6, 5, iron);
    pm.hline(gx - 9, gy - 10, 6, ironL);
    pm.set(gx - 8, gy - 9, ironL); // rim sheen
  } else if (pose === 'strike') {
    // the clang: disc leading, face to the bird
    pm.line(gx + 1, gy - 1, gx + 4, gy - 3, handle);
    pm.rect(gx + 4, gy - 7, 6, 6, iron);
    pm.hline(gx + 4, gy - 7, 6, ironL);
    pm.vline(gx + 4, gy - 7, 6, ironL);
  } else {
    // rest: hanging at the side, disc low — the overworld carry, rear view
    pm.vline(gx, gy + 1, 2, handle);
    pm.rect(gx - 2, gy + 3, 6, 4, iron);
    pm.hline(gx - 2, gy + 3, 6, ironL);
  }
}

/** rifle: stock + barrel; aims UP at the bird, cracks, recoils */
function drawRifle(ctx: GripCtx, ramp: number): void {
  const { pm, gx, gy, pose } = ctx;
  const stock = px(ramp, 1);
  const stockL = px(ramp, 2);
  const steel = px(RAMP.INK, 1);
  const steelL = px(RAMP.INK, 2);
  if (pose === 'aim' || pose === 'recoil') {
    const k = pose === 'recoil' ? 1 : 0; // the crack shoves it back a pixel
    // stock at the shoulder
    pm.rect(gx - 3 + k, gy - 1, 4, 3, stock);
    pm.set(gx - 3 + k, gy - 1, stockL);
    // barrel line climbing up-right toward the sky
    pm.line(gx + 1 + k, gy - 1, gx + 9 + k, gy - 7 + k, steel);
    pm.line(gx + 1 + k, gy, gx + 9 + k, gy - 6 + k, steelL);
    pm.set(gx + 10 + k, gy - 8 + k, steel); // muzzle
  } else {
    // rest: held low across the hip, muzzle down-right (range manners)
    pm.line(gx - 2, gy - 1, gx + 2, gy, stock);
    pm.rect(gx - 4, gy - 2, 3, 3, stock);
    pm.set(gx - 4, gy - 2, stockL);
    pm.line(gx + 3, gy + 1, gx + 6, gy + 3, steel);
    pm.set(gx + 7, gy + 3, steelL);
  }
}

/** beads: the loop rides the striking wrist; the strike trails a bead arc */
function drawBeads(ctx: GripCtx, ramp: number): void {
  const { pm, gx, gy, pose } = ctx;
  const bead = px(ramp, 2);
  const beadD = px(ramp, 1);
  // the loop on the wrist — alternating bead pixels
  pm.set(gx - 1, gy, bead);
  pm.set(gx, gy + 1, beadD);
  pm.set(gx + 1, gy, bead);
  if (pose === 'strike') {
    // a short arc of beads trailing the punch
    pm.set(gx + 3, gy - 2, bead);
    pm.set(gx + 5, gy - 3, beadD);
    pm.set(gx + 7, gy - 3, bead);
  }
  if (pose === 'back') {
    pm.set(gx - 2, gy - 1, beadD); // the loop swings as the fist draws back
  }
}

export function drawHeldWeapon(ctx: GripCtx, art: HeldArt): void {
  switch (art.class) {
    case 'bat':
      drawBat(ctx, art.ramp);
      break;
    case 'pan':
      drawPan(ctx, art.ramp);
      break;
    case 'rifle':
      drawRifle(ctx, art.ramp);
      break;
    case 'beads':
      drawBeads(ctx, art.ramp);
      break;
  }
  art.detail?.(ctx);
}

/* ================================================================== */
/* Trinket icons                                                       */

/* ---- THE STARTING FOUR (S12) — arms-slot icons. ADR-032 mapped the
 * arms slot to torso art while zero arms items existed; the first real
 * arms line ships as DRAWN ICONS (a 2px wristband cannot read on a 28px
 * battler arm — ADR-034 records the amendment). Equipment visibility for
 * arms gear = the icon + the STATUS Arms line + the stat preview. */

/** Champ's Sweatband — terrycloth, four quarters deep */
function drawSweatbandIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const red = px(RAMP.RED, 2);
  pm.rect(3, 4, 8, 5, red);
  pm.hline(3, 4, 8, px(RAMP.RED, 3)); // lit roll
  pm.hline(3, 8, 8, px(RAMP.RED, 1));
  pm.vline(5, 5, 3, px(RAMP.RED, 1)); // terry rib
  pm.vline(8, 5, 3, px(RAMP.RED, 1));
  pm.set(7, 6, px(RAMP.PAPER, 3)); // the one star stitch
  pm.outline(C.outline);
  return pm;
}

/** Victory Scrunchie — holds a championship together at the wrist */
function drawScrunchieIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const m = px(RAMP.MAGENTA, 2);
  pm.hline(4, 2, 6, m);
  pm.set(3, 3, m);
  pm.set(10, 3, m);
  pm.vline(2, 4, 3, m);
  pm.vline(11, 4, 3, m);
  pm.set(3, 7, m);
  pm.set(10, 7, m);
  pm.hline(4, 8, 6, px(RAMP.MAGENTA, 1));
  // the scrunch: gathered pinches around the loop
  pm.set(6, 1, px(RAMP.MAGENTA, 3));
  pm.set(1, 5, px(RAMP.MAGENTA, 3));
  pm.set(12, 5, px(RAMP.MAGENTA, 1));
  pm.set(7, 9, px(RAMP.MAGENTA, 1));
  pm.outline(C.outline);
  return pm;
}

/** Shooter's Sleeve — aerodynamically smug */
function drawSleeveIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const c = px(RAMP.CYAN, 2);
  // a tapered tube, elbow bend implied
  pm.rect(4, 1, 6, 10, c);
  pm.vline(4, 1, 10, px(RAMP.CYAN, 3));
  pm.vline(9, 2, 9, px(RAMP.CYAN, 1));
  pm.hline(4, 1, 6, px(RAMP.CYAN, 3));
  pm.hline(4, 10, 6, px(RAMP.CYAN, 1));
  pm.hline(5, 5, 4, px(RAMP.CYAN, 1)); // the elbow seam
  pm.outline(C.outline);
  return pm;
}

/** Iron Wristguard — the mountain's replacement for fear */
function drawWristguardIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const iron = px(RAMP.PAPER, 1);
  pm.rect(3, 3, 8, 6, iron);
  pm.hline(3, 3, 8, px(RAMP.PAPER, 2)); // lit rim
  pm.hline(3, 8, 8, px(RAMP.PAPER, 0));
  pm.vline(6, 4, 4, px(RAMP.PAPER, 0)); // strap channel
  pm.set(9, 5, px(RAMP.GOLD, 2)); // the single rivet
  pm.outline(C.outline);
  return pm;
}

/* ---- THE SUNDAY SET (S13): four clubhouse charms, drawn small ---- */

/** the Sunday Visor — a brim that has read every green on the coast */
function drawVisorIcon(): Pixmap {
  const pm = new Pixmap(14, 10);
  const band = px(RAMP.GRASS, 2);
  pm.hline(3, 2, 8, band); // the band
  pm.set(2, 3, band);
  pm.set(11, 3, band);
  pm.hline(3, 3, 8, px(RAMP.GRASS, 3));
  pm.hline(2, 5, 10, px(RAMP.PAPER, 3)); // the brim, forward
  pm.hline(3, 6, 9, px(RAMP.PAPER, 2));
  pm.set(4, 6, px(RAMP.PAPER, 1)); // the read line worn into it
  pm.outline(C.outline);
  return pm;
}

/** the Sunday Glove — soft from a thousand honest grips */
function drawGloveIcon(): Pixmap {
  const pm = new Pixmap(12, 13);
  const leather = px(RAMP.PAPER, 3);
  pm.rect(3, 4, 6, 6, leather); // the palm
  pm.rect(3, 1, 1, 3, leather); // fingers
  pm.rect(5, 1, 1, 3, leather);
  pm.rect(7, 1, 1, 3, leather);
  pm.rect(9, 4, 2, 3, leather); // the thumb out wide
  pm.hline(3, 9, 6, px(RAMP.PAPER, 1)); // the cuff
  pm.set(4, 6, px(RAMP.PAPER, 2)); // the worn heart of the grip
  pm.set(5, 6, px(RAMP.PAPER, 2));
  pm.outline(C.outline);
  return pm;
}

/** the Lucky Tee — survived a driver swing untouched (impossible) */
function drawTeeIcon(): Pixmap {
  const pm = new Pixmap(10, 13);
  const wood = px(RAMP.GOLD, 2);
  pm.hline(2, 2, 6, wood); // the cup
  pm.hline(3, 3, 4, px(RAMP.GOLD, 3));
  pm.vline(4, 4, 6, wood); // the shaft
  pm.vline(5, 4, 6, px(RAMP.GOLD, 1));
  pm.set(4, 10, px(RAMP.GOLD, 1)); // the point
  pm.outline(C.outline);
  return pm;
}

/** the Caddy's Marker — a coin that knows exactly where it is */
function drawMarkerIcon(): Pixmap {
  const pm = new Pixmap(12, 12);
  pm.ellipse(5, 5, 4, 4, px(RAMP.GOLD, 2));
  pm.ellipse(5, 5, 3, 3, px(RAMP.GOLD, 3));
  pm.set(5, 5, px(RAMP.CYAN, 1)); // the line it marks, forever
  pm.set(4, 3, px(RAMP.PAPER, 3)); // the shine
  pm.outline(C.outline);
  return pm;
}

/** the Lucky Collar — Biscuit's pond-scented gift, as a drawn charm */
function drawCollarIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const red = px(RAMP.RED, 2);
  // the loop, hand-rounded
  pm.hline(4, 2, 6, red);
  pm.set(3, 3, red);
  pm.set(10, 3, red);
  pm.vline(2, 4, 3, red);
  pm.vline(11, 4, 3, red);
  pm.set(3, 7, red);
  pm.set(10, 7, red);
  pm.hline(4, 8, 6, px(RAMP.RED, 1));
  pm.set(4, 2, px(RAMP.RED, 3)); // lit edge
  // the gold tag, chewed lucky
  pm.rect(6, 8, 3, 3, px(RAMP.GOLD, 2));
  pm.set(6, 8, px(RAMP.GOLD, 3));
  pm.set(8, 10, px(RAMP.GOLD, 1)); // tooth mark
  pm.outline(C.outline);
  return pm;
}

/** the Tin Sun Pendant (S14 — §A8 Ch.2's shelf charm): hammered tin, honest grin */
function drawSunPendantIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const tin = px(RAMP.PAPER, 2);
  pm.ellipse(6, 7, 4, 4, tin);
  pm.ellipse(5, 6, 2, 2, px(RAMP.PAPER, 3)); // hammered shine
  // eight rays, hand-placed
  pm.set(6, 1, tin);
  pm.set(6, 13, tin);
  pm.set(0, 7, tin);
  pm.set(12, 7, tin);
  pm.set(2, 3, tin);
  pm.set(10, 3, tin);
  pm.set(2, 11, tin);
  pm.set(10, 11, tin);
  pm.set(5, 7, C.outline); // the grin's eyes
  pm.set(8, 7, C.outline);
  pm.hline(5, 9, 3, C.outline); // honestly grinning
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* THE REGISTRY — every §A8 equippable, both directions enforced.      */

export const WEAPON_ART: Record<string, WeaponArt> = {
  /* ---- Jay's bats (§A8: taped shafts; same swing, different bat) ---- */
  cracked_bat: held({
    class: 'bat',
    ramp: RAMP.EARTH,
    // the crack: a dark jag across the shaft — one good SMAAASH left in it
    detail: ({ pm, gx, gy, pose }) => {
      const crack = px(RAMP.EARTH, 0);
      if (pose === 'back') {
        pm.set(gx - 6, gy - 6, crack);
        pm.set(gx - 5, gy - 7, crack);
      } else if (pose === 'strike') {
        pm.set(gx + 5, gy - 2, crack);
        pm.set(gx + 6, gy - 3, crack);
      } else {
        pm.set(gx + 3, gy - 5, crack);
        pm.set(gx + 4, gy - 5, crack);
      }
    },
  }),
  tball_bat: held({
    class: 'bat',
    ramp: RAMP.GOLD,
    // regulation ring stripe near the tip — the Otters went 0-12 with it
    detail: ({ pm, gx, gy, pose }) => {
      const ring = px(RAMP.RED, 2);
      if (pose === 'back') {
        pm.set(gx - 9, gy - 10, ring);
        pm.set(gx - 10, gy - 11, ring);
      } else if (pose === 'strike') {
        pm.set(gx + 7, gy - 4, ring);
        pm.set(gx + 8, gy - 4, ring);
      } else {
        pm.set(gx + 5, gy - 7, ring);
        pm.set(gx + 6, gy - 8, ring);
      }
    },
  }),

  /* ---- Mia's pans (§A8: twenty years of breakfast, NOT done serving) ---- */
  hand_me_down_pan: held({
    class: 'pan',
    ramp: RAMP.INK,
    // the dent — and one white spark of polish that never wore off
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'back') {
        pm.set(gx - 5, gy - 8, px(RAMP.INK, 0)); // the dent
        pm.set(gx - 7, gy - 9, C.white); // the spark (pure light, EB law)
      } else if (pose === 'strike') {
        pm.set(gx + 6, gy - 5, C.white);
        pm.set(gx + 8, gy - 6, px(RAMP.INK, 0));
      } else {
        pm.set(gx - 1, gy + 4, px(RAMP.INK, 0));
        pm.set(gx + 1, gy + 4, C.white);
      }
    },
  }),

  /* ---- Milo's guns (§A8 line opens with the Pellet Popper) ---- */
  pellet_popper: held({
    class: 'rifle',
    ramp: RAMP.EARTH,
    // safety-orange muzzle tip — Wintermoor insists, Milo pretends to mind
    detail: ({ pm, gx, gy, pose }) => {
      const tip = px(RAMP.ORANGE, 3);
      if (pose === 'aim') pm.set(gx + 10, gy - 8, tip);
      else if (pose === 'recoil') pm.set(gx + 11, gy - 7, tip);
      else pm.set(gx + 7, gy + 4, tip);
    },
  }),

  /* ---- Dorin's bead lines (§A8: Cedar Beads start the chase) ---- */
  cedar_beads: held({
    class: 'beads',
    ramp: RAMP.EARTH,
    // one gold focal bead — the monastery's blessing knot
    detail: ({ pm, gx, gy }) => {
      pm.set(gx, gy - 1, px(RAMP.GOLD, 2));
    },
  }),

  /* ---- S14 Ch.2 weapon shelf (§A8 refresh curve) ---- */
  sandlot_slugger: held({
    class: 'bat',
    ramp: RAMP.ORANGE,
    // forty summers of initials carved near the tip
    detail: ({ pm, gx, gy, pose }) => {
      const carve = px(RAMP.ORANGE, 0);
      if (pose === 'back') {
        pm.set(gx - 8, gy - 9, carve);
        pm.set(gx - 10, gy - 11, carve);
      } else if (pose === 'strike') {
        pm.set(gx + 6, gy - 3, carve);
        pm.set(gx + 8, gy - 4, carve);
      } else {
        pm.set(gx + 4, gy - 6, carve);
        pm.set(gx + 5, gy - 8, carve);
      }
    },
  }),
  copper_pan: held({
    class: 'pan',
    ramp: RAMP.ORANGE,
    // the copper bloom — heat has been here (and one polished gleam)
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'back') {
        pm.set(gx - 7, gy - 7, px(RAMP.ORANGE, 3));
        pm.set(gx - 6, gy - 9, C.white);
      } else if (pose === 'strike') {
        pm.set(gx + 6, gy - 4, px(RAMP.ORANGE, 3));
        pm.set(gx + 7, gy - 6, C.white);
      } else {
        pm.set(gx, gy + 4, px(RAMP.ORANGE, 3));
        pm.set(gx + 2, gy + 5, C.white);
      }
    },
  }),

  /* ---- body gear (renders ON battler + bust torsos) ---- */
  champion_jacket: {
    kind: 'torso',
    ramp: RAMP.RED, // varsity body — Sal pressed every letter himself
    trim: RAMP.PAPER, // white sleeves + snap trim
  },
  // S14 — the Wool Poncho (§A10 #5's prize): six llamas' worth of warmth
  wool_poncho: {
    kind: 'torso',
    ramp: RAMP.EARTH, // undyed wool body
    trim: RAMP.RED, // the woven border band
  },

  /* ---- 'arms'-slot gear (S12 — drawn icons, see the note above) ---- */
  cage_sweatband: {
    kind: 'trinket',
    icon: drawSweatbandIcon,
  },
  victory_scrunchie: {
    kind: 'trinket',
    icon: drawScrunchieIcon,
  },
  shooters_sleeve: {
    kind: 'trinket',
    icon: drawSleeveIcon,
  },
  iron_wristguard: {
    kind: 'trinket',
    icon: drawWristguardIcon,
  },

  /* ---- 'other'-slot charms (drawn icons; pockets, not fists) ---- */
  lucky_collar: {
    kind: 'trinket',
    icon: drawCollarIcon,
  },
  tin_sun_pendant: {
    kind: 'trinket',
    icon: drawSunPendantIcon,
  },

  /* ---- THE SUNDAY SET (S13 — the first Invitational's prize) ---- */
  sunday_visor: {
    kind: 'trinket',
    icon: drawVisorIcon,
  },
  sunday_glove: {
    kind: 'trinket',
    icon: drawGloveIcon,
  },
  lucky_tee: {
    kind: 'trinket',
    icon: drawTeeIcon,
  },
  caddys_marker: {
    kind: 'trinket',
    icon: drawMarkerIcon,
  },
};

/** the swing family of an equipped weapon id — bare hands are 'fist' */
export function weaponClassOf(weaponId: string | null | undefined): WeaponClass | 'fist' {
  if (!weaponId) return 'fist';
  const art = WEAPON_ART[weaponId];
  return art && art.kind === 'held' ? art.class : 'fist';
}

/** the per-class swing sfx preset (engine/audio.ts) */
export function swingSfxOf(cls: WeaponClass | 'fist'): string {
  switch (cls) {
    case 'bat':
      return 'swing_bat';
    case 'pan':
      return 'swing_pan';
    case 'rifle':
      return 'rifle_crack';
    case 'beads':
      return 'swing_beads';
    default:
      return 'swing_fist';
  }
}
