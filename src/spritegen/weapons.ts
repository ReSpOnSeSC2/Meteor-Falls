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
import { forgeIcon } from './iconforge';

/** the swing family a held weapon belongs to — drives choreography + sfx.
 *  S17 M19 (ADR-064): 'kit' opens for Pippa's page implements (Stamp Sling →
 *  Needle Saber → Thimble Bell → *Royal Red Pen*) — one tiny, precise jab, the
 *  rungs told apart by ramp + a per-rung mark, EXACTLY the bat-class pattern. */
export type WeaponClass = 'bat' | 'pan' | 'rifle' | 'beads' | 'kit';

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

/** kit: Pippa's tiny page implement — a slim shaft with a small head that JABS.
 *  Precision over force; the rungs differ by ramp + the per-rung detail mark. */
function drawKit(ctx: GripCtx, ramp: number): void {
  const { pm, gx, gy, pose } = ctx;
  const body = px(ramp, 2);
  const bodyL = px(ramp, 3);
  const head = px(RAMP.GOLD, 2); // a bright little working head (nib/needle/bell)
  if (pose === 'back') {
    // drawn back, head high behind the shoulder, ready to flick
    pm.line(gx - 1, gy - 1, gx - 6, gy - 6, body);
    pm.line(gx - 1, gy - 2, gx - 6, gy - 7, bodyL);
    pm.set(gx - 7, gy - 7, head);
  } else if (pose === 'strike') {
    // the thrust: shaft level, head leading at the foe
    pm.line(gx + 1, gy - 1, gx + 7, gy - 2, body);
    pm.line(gx + 1, gy - 2, gx + 7, gy - 3, bodyL);
    pm.set(gx + 8, gy - 2, head);
  } else {
    // rest: carried up-right, tidy and small
    pm.line(gx + 1, gy - 1, gx + 4, gy - 5, body);
    pm.line(gx + 1, gy - 2, gx + 4, gy - 6, bodyL);
    pm.set(gx + 4, gy - 6, head);
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
    case 'kit':
      drawKit(ctx, art.ramp);
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

/** Minister's Ribbon (S15h) — the sash of Being Taken Seriously: a gold band
 *  crossing to a sealed medallion, two tails below (ADR-048, Pippa's arms) */
function drawMinisterRibbonIcon(): Pixmap {
  const pm = new Pixmap(14, 13);
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  const goldD = px(RAMP.GOLD, 1);
  // the sash, shoulder (top-right) down to the medal
  pm.set(11, 1, goldL);
  pm.set(10, 1, gold);
  pm.set(9, 3, gold);
  pm.set(8, 4, gold);
  pm.set(7, 5, goldD);
  pm.set(6, 6, gold);
  pm.set(5, 7, gold);
  // the medallion where the sash gathers, a purple seal at its heart
  pm.ellipse(5, 9, 3, 3, gold);
  pm.ellipse(5, 9, 2, 2, goldL);
  pm.set(5, 9, px(RAMP.PURPLE, 2));
  // two ribbon tails hanging below
  pm.set(3, 11, goldD);
  pm.set(7, 11, goldD);
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

/** the Walker's Charm (S15i Task 3 — Ch.1 #5): a pressed wildflower under glass */
function drawWalkersCharmIcon(): Pixmap {
  const pm = new Pixmap(13, 13);
  const glass = px(RAMP.PAPER, 3);
  const petal = px(RAMP.MAGENTA, 2);
  pm.ellipse(6, 6, 5, 5, px(RAMP.PAPER, 2)); // the glass frame
  pm.ellipse(6, 6, 4, 4, glass);
  // a four-petal flower, hand-placed, pressed flat
  pm.set(6, 3, petal);
  pm.set(6, 9, petal);
  pm.set(3, 6, petal);
  pm.set(9, 6, petal);
  pm.set(5, 5, petal);
  pm.set(7, 5, petal);
  pm.set(5, 7, petal);
  pm.set(7, 7, petal);
  pm.set(6, 6, px(RAMP.GOLD, 3)); // the gold center
  pm.set(4, 4, px(RAMP.PAPER, 3)); // a glint on the glass
  pm.outline(C.outline);
  return pm;
}

/** the Captain's Button (S15i Task 3 — Ch.2 dock crate): brass, an anchor stamped in */
function drawButtonIcon(): Pixmap {
  const pm = new Pixmap(12, 12);
  const brass = px(RAMP.GOLD, 2);
  pm.ellipse(5, 5, 4, 4, brass);
  pm.ellipse(5, 5, 3, 3, px(RAMP.GOLD, 1)); // the recessed face
  // a tiny anchor stamped into it
  pm.vline(5, 3, 4, px(RAMP.GOLD, 3));
  pm.hline(4, 5, 3, px(RAMP.GOLD, 3));
  pm.set(3, 6, px(RAMP.GOLD, 3));
  pm.set(7, 6, px(RAMP.GOLD, 3));
  pm.set(3, 2, px(RAMP.PAPER, 3)); // shine
  pm.outline(C.outline);
  return pm;
}

/* ---- S17 M18 (ADR-063): THE PORCH SET — the coffee-can treasures of a
 *      summer porch, drawn small (Ch.1 hero-signature charms) ---- */

/** the Firefly Jar (Jay) — a mason jar that still blinks; it remembers Glint */
function drawFireflyJarIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const glass = px(RAMP.CYAN, 3);
  // the jar body + a tin lid
  pm.rect(3, 4, 7, 9, glass);
  pm.vline(3, 4, 9, px(RAMP.CYAN, 2)); // shaded glass side
  pm.rect(3, 2, 7, 2, px(RAMP.PAPER, 1)); // the lid
  pm.hline(3, 2, 7, px(RAMP.PAPER, 2));
  pm.set(5, 1, C.outline); // punched air holes
  pm.set(7, 1, C.outline);
  // the firefly, mid-blink — a warm gold mote low in the jar
  pm.set(6, 9, px(RAMP.GOLD, 3));
  pm.set(6, 10, px(RAMP.GOLD, 2));
  pm.set(7, 9, px(RAMP.GOLD, 3));
  pm.set(4, 6, px(RAMP.PAPER, 3)); // a glass glint
  pm.outline(C.outline);
  pm.set(6, 9, C.white); // pure light after the contour — it still wants to glow
  return pm;
}

/** the Wind-Chime Charm (Mia) — three pipes off the back porch, ringing good news */
function drawWindChimeIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const wood = px(RAMP.EARTH, 2);
  const pipe = px(RAMP.CYAN, 2);
  const pipeL = px(RAMP.CYAN, 3);
  // the top disc the strings hang from
  pm.ellipse(6, 3, 3, 1, wood);
  pm.set(6, 1, px(RAMP.EARTH, 1)); // the hanging loop
  // three pipes of stepped length
  pm.vline(3, 5, 5, pipe);
  pm.vline(6, 5, 7, pipe);
  pm.vline(9, 5, 4, pipe);
  pm.set(3, 5, pipeL);
  pm.set(6, 5, pipeL);
  pm.set(9, 5, pipeL);
  // the clapper disc in the middle, lower
  pm.ellipse(6, 12, 1, 1, px(RAMP.GOLD, 2));
  pm.outline(C.outline);
  return pm;
}

/** the Whittled Whistle (Milo) — carved one rainy afternoon; it even works */
function drawWhittledWhistleIcon(): Pixmap {
  const pm = new Pixmap(14, 11);
  const wood = px(RAMP.EARTH, 2);
  const woodL = px(RAMP.EARTH, 3);
  const woodD = px(RAMP.EARTH, 1);
  // a stubby barrel whistle, mouthpiece left
  pm.rect(2, 4, 10, 4, wood);
  pm.hline(2, 4, 10, woodL); // lit top
  pm.hline(2, 7, 10, woodD);
  pm.rect(1, 5, 2, 2, woodL); // the mouthpiece nub
  // the fipple notch + the air hole on top
  pm.set(6, 4, C.outline);
  pm.set(6, 3, woodD);
  pm.set(9, 5, C.outline); // the finger hole
  pm.set(4, 6, woodD); // a whittle gouge mark
  pm.outline(C.outline);
  return pm;
}

/** the Bottle-Cap Medallion (Pippa) — a root-beer cap hammered flat, on twine */
function drawBottleCapMedallionIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const cap = px(RAMP.RED, 2);
  const capL = px(RAMP.RED, 3);
  // the twine up to a knot
  pm.vline(6, 1, 3, px(RAMP.EARTH, 2));
  pm.set(6, 1, px(RAMP.EARTH, 1));
  // the flattened cap disc
  pm.ellipse(6, 9, 4, 4, cap);
  pm.ellipse(5, 8, 2, 2, capL); // lit face
  // the crimped edge — little teeth all round
  for (const [x, y] of [[6, 5], [9, 7], [9, 11], [6, 13], [3, 11], [3, 7]] as Array<[number, number]>) {
    pm.set(x, y, px(RAMP.RED, 1));
  }
  pm.set(7, 9, px(RAMP.GOLD, 3)); // a worn dab of gold lettering
  pm.outline(C.outline);
  return pm;
}

/** the Lucky Acorn (Dorin) — cap on; it looks like a tiny monk */
function drawLuckyAcornIcon(): Pixmap {
  const pm = new Pixmap(12, 14);
  const nut = px(RAMP.BLOND, 2);
  const nutL = px(RAMP.BLOND, 3);
  const cap = px(RAMP.EARTH, 1);
  const capL = px(RAMP.EARTH, 2);
  // the nut body
  pm.ellipse(6, 9, 4, 4, nut);
  pm.ellipse(5, 8, 2, 2, nutL);
  pm.set(6, 13, px(RAMP.EARTH, 1)); // the little point
  // the textured cap
  pm.contour(6, 3, [2, 3, 4], cap);
  pm.hline(2, 6, 9, capL); // cap rim
  pm.set(4, 4, capL); // cap stipple (the "hood")
  pm.set(7, 4, capL);
  pm.set(6, 1, cap); // the stem
  pm.outline(C.outline);
  return pm;
}

/* ---- S17 M18 (ADR-063): THE MERCADO SET — the Puerto Sol market stalls,
 *      drawn small (Ch.2 hero-signature charms) ---- */

/** the Friendship Bracelet (Jay) — three colors a kid would not sell */
function drawFriendshipBraceletIcon(): Pixmap {
  const pm = new Pixmap(14, 13);
  // a flat woven band arching across, chevrons in three threads
  const rows: Array<[number, number]> = [[5, 3], [6, 5], [7, 7], [8, 5], [9, 3]];
  // backing band
  for (let x = 2; x <= 11; x++) pm.set(x, 6, px(RAMP.EARTH, 1));
  // the chevron stitches in RED / GOLD / CYAN, stepped
  const cols = [RAMP.RED, RAMP.GOLD, RAMP.CYAN];
  rows.forEach(([x, y], i) => {
    const c = px(cols[i % 3], 2);
    pm.set(x, y, c);
    pm.set(x, y + 1, px(cols[i % 3], 3));
  });
  // the tie strings off each end
  pm.line(2, 6, 0, 4, px(RAMP.RED, 2));
  pm.line(11, 6, 13, 8, px(RAMP.CYAN, 2));
  pm.outline(C.outline);
  return pm;
}

/** the Evil-Eye Bead (Mia) — blue glass nazar against mal de ojo */
function drawEvilEyeBeadIcon(): Pixmap {
  const pm = new Pixmap(13, 13);
  // concentric rings: blue, white, cyan, the dark pupil
  pm.ellipse(6, 7, 5, 5, px(RAMP.BLUE, 2));
  pm.ellipse(6, 7, 4, 4, px(RAMP.BLUE, 1));
  pm.ellipse(6, 7, 3, 3, px(RAMP.PAPER, 3));
  pm.ellipse(6, 7, 2, 2, px(RAMP.CYAN, 2));
  pm.ellipse(6, 7, 1, 1, C.outline); // the pupil, watching
  pm.set(6, 1, px(RAMP.EARTH, 2)); // the cord hole at the top
  pm.set(4, 5, px(RAMP.PAPER, 3)); // a glass glint
  pm.outline(C.outline);
  return pm;
}

/** the Brass Gear Charm (Milo) — salvaged off a dead clock; turns nothing, perfectly */
function drawBrassGearIcon(): Pixmap {
  const pm = new Pixmap(13, 13);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  // the gear body
  pm.ellipse(6, 6, 4, 4, brass);
  pm.ellipse(6, 6, 2, 2, px(RAMP.GOLD, 1)); // recessed hub
  pm.set(6, 6, C.outline); // the center bore
  // eight teeth around the rim
  for (const [x, y] of [[6, 1], [10, 2], [11, 6], [10, 10], [6, 11], [2, 10], [1, 6], [2, 2]] as Array<[number, number]>) {
    pm.set(x, y, brass);
  }
  pm.set(4, 4, brassL); // a polished tooth Milo cleaned
  pm.outline(C.outline);
  return pm;
}

/** the Tin Milagro (Pippa) — a stamped-tin charm of a thing you hope mends */
function drawTinMilagroIcon(): Pixmap {
  const pm = new Pixmap(13, 13);
  const tin = px(RAMP.PAPER, 2);
  const tinL = px(RAMP.PAPER, 3);
  // a little stamped heart (the classic milagro)
  pm.set(4, 4, tin);
  pm.set(5, 3, tin);
  pm.set(6, 4, tin);
  pm.set(7, 3, tin);
  pm.set(8, 4, tin);
  pm.rect(3, 5, 7, 3, tin);
  pm.contour(6, 8, [3, 2, 1], tin); // tapering to the point
  pm.hline(4, 5, 5, tinL); // hammered shine across the top
  pm.set(5, 6, px(RAMP.PAPER, 1)); // a stamped seam
  pm.set(7, 6, px(RAMP.PAPER, 1));
  pm.set(6, 1, px(RAMP.EARTH, 2)); // the pin hole
  pm.outline(C.outline);
  return pm;
}

/** the Jade Frog (Dorin) — a green stone frog mid-leap, going nowhere */
function drawJadeFrogIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const jade = px(RAMP.FOREST, 2);
  const jadeL = px(RAMP.GRASS, 2);
  const jadeD = px(RAMP.FOREST, 1);
  // the squat body
  pm.ellipse(7, 7, 4, 3, jade);
  pm.ellipse(6, 6, 2, 1, jadeL); // a polished back
  // the two bulging eyes up top
  pm.set(5, 3, jade);
  pm.set(5, 2, jade);
  pm.set(9, 3, jade);
  pm.set(9, 2, jade);
  pm.set(5, 2, jadeL);
  pm.set(9, 2, jadeL);
  pm.set(5, 3, C.outline); // pupils
  pm.set(9, 3, C.outline);
  // the splayed back legs, mid-leap
  pm.set(2, 9, jadeD);
  pm.set(3, 10, jade);
  pm.set(12, 9, jadeD);
  pm.set(11, 10, jade);
  pm.outline(C.outline);
  return pm;
}

/* ---- S17 M20 (ADR-065): THE FAR-WORLD CATALOG — the one signature charm of
 *      the pour. §A10 #13's RIDDLE RING is story-grade (the first real VIBE-on-
 *      gear, +10 Vibe); it earns a hand drawing, not a forge stamp. ---- */

/** the Riddle Ring (Ch.6 — §A10 #13) — a heavy savanna-gold band, an indigo
 *  stone with a tiny carved glyph that nobody can quite read (the eldest stone's
 *  riddle, made wearable). The first charm the §A8 "+10 Vibe" field finally fills. */
function drawRiddleRingIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  const goldD = px(RAMP.GOLD, 1);
  // the thick band, seen at an angle — a fat gold loop
  pm.ellipse(6, 9, 4, 4, gold);
  pm.ellipse(6, 9, 2, 2, C.outline); // the finger hole, dark
  pm.ellipse(6, 9, 4, 4, gold); // re-lay the rim over the hole edge
  pm.set(3, 9, goldL); // lit near shoulder
  pm.set(9, 9, goldD); // far shoulder in shadow
  pm.set(4, 11, goldD);
  // the raised setting + the indigo riddle-stone up top
  pm.rect(5, 3, 3, 3, goldL);
  pm.rect(5, 3, 3, 3, px(RAMP.BLUE, 1)); // the stone bezel, deep indigo
  pm.set(6, 4, px(RAMP.BLUE, 3)); // a facet catching light
  // the carved glyph nobody can read (a tiny crooked mark)
  pm.set(6, 3, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  pm.set(6, 4, C.white); // pure light on the stone — it hums
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
  // S15h (ADR-048): Pippa's STARTING FIVE arms piece
  minister_ribbon: {
    kind: 'trinket',
    icon: drawMinisterRibbonIcon,
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
  // S15i Task 3 (ADR-058) — Movement 4 quest charms
  walkers_charm: {
    kind: 'trinket',
    icon: drawWalkersCharmIcon,
  },
  captains_button: {
    kind: 'trinket',
    icon: drawButtonIcon,
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

  /* ============ S17 M18 (ADR-063) — THE AMERICAS CATALOG ============ */

  /* ---- Ch.1 weapon SIDEGRADES (§A8 lines are personal; reuse the bat/pan
     class silhouettes, item-specific by ramp) ---- */
  foam_finger: held({
    class: 'bat',
    ramp: RAMP.RED, // a giant red #1 — you BELIEVE you are hitting something
    detail: ({ pm, gx, gy, pose }) => {
      const one = px(RAMP.PAPER, 3); // the white "1" printed on the foam
      if (pose === 'back') pm.set(gx - 6, gy - 7, one);
      else if (pose === 'strike') pm.set(gx + 5, gy - 3, one);
      else pm.set(gx + 4, gy - 6, one);
    },
  }),
  wiffle_bat: held({
    class: 'bat',
    ramp: RAMP.PAPER, // hollow white plastic — the SMAAASH is a polite TOK
    detail: ({ pm, gx, gy, pose }) => {
      const hole = px(RAMP.PAPER, 0); // the famous holes
      if (pose === 'back') pm.set(gx - 7, gy - 8, hole);
      else if (pose === 'strike') pm.set(gx + 6, gy - 4, hole);
      else pm.set(gx + 4, gy - 6, hole);
    },
  }),
  nonstick_pan: held({
    class: 'pan',
    ramp: RAMP.NIGHT, // black teflon — eggs slide right off, so do consequences
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'back') pm.set(gx - 6, gy - 8, C.white);
      else if (pose === 'strike') pm.set(gx + 7, gy - 5, C.white);
      else pm.set(gx, gy + 4, C.white);
    },
  }),

  /* ---- armor 'body' gear (torso re-dress; the §A8 hat/garment ladder) ---- */
  otterbrook_cap: { kind: 'torso', ramp: RAMP.BLUE, trim: RAMP.PAPER },
  chullo: { kind: 'torso', ramp: RAMP.RED, trim: RAMP.GOLD },
  cushma: { kind: 'torso', ramp: RAMP.EARTH, trim: RAMP.RED },
  alpaca_vest: { kind: 'torso', ramp: RAMP.PAPER, trim: RAMP.EARTH },

  /* ---- generic ARMS (un-tagged; the forge draws the menu trinket) ---- */
  woven_wristlet: {
    kind: 'trinket',
    icon: () => forgeIcon({ subcat: 'wrap', band: 'ch2', detail: 'stripe', seed: 'woven_wristlet' }),
  },
  climbing_gloves: {
    kind: 'trinket',
    icon: () => forgeIcon({ subcat: 'glove', band: 'ch2', seed: 'climbing_gloves' }),
  },

  /* ---- THE PORCH SET (Ch.1 hero-signature charms) ---- */
  firefly_jar: { kind: 'trinket', icon: drawFireflyJarIcon },
  wind_chime_charm: { kind: 'trinket', icon: drawWindChimeIcon },
  whittled_whistle: { kind: 'trinket', icon: drawWhittledWhistleIcon },
  bottle_cap_medallion: { kind: 'trinket', icon: drawBottleCapMedallionIcon },
  lucky_acorn: { kind: 'trinket', icon: drawLuckyAcornIcon },

  /* ---- THE MERCADO SET (Ch.2 hero-signature charms) ---- */
  friendship_bracelet: { kind: 'trinket', icon: drawFriendshipBraceletIcon },
  evil_eye_bead: { kind: 'trinket', icon: drawEvilEyeBeadIcon },
  brass_gear_charm: { kind: 'trinket', icon: drawBrassGearIcon },
  tin_milagro: { kind: 'trinket', icon: drawTinMilagroIcon },
  jade_frog: { kind: 'trinket', icon: drawJadeFrogIcon },

  /* ============ S17 M19 (ADR-064) — THE OLD-WORLD CATALOG ============ */

  /* ---- Ch.3 ENGLAND — MILO'S GUN LADDER (rifle class; ramp + a per-rung
     muzzle mark) and the cricket-bat sidegrade (bat class) ---- */
  spud_gun: held({
    class: 'rifle',
    ramp: RAMP.NIGHT,
    // a King Edward jammed in the muzzle — the day's ammunition
    detail: ({ pm, gx, gy, pose }) => {
      const spud = px(RAMP.BLOND, 2);
      if (pose === 'aim') pm.set(gx + 10, gy - 8, spud);
      else if (pose === 'recoil') pm.set(gx + 11, gy - 7, spud);
      else pm.set(gx + 7, gy + 4, spud);
    },
  }),
  double_barrel_sparker: held({
    class: 'rifle',
    ramp: RAMP.INK,
    // a spark off the twin muzzles
    detail: ({ pm, gx, gy, pose }) => {
      const spark = px(RAMP.GOLD, 3);
      if (pose === 'aim') pm.set(gx + 11, gy - 9, spark);
      else if (pose === 'recoil') pm.set(gx + 12, gy - 8, spark);
      else pm.set(gx + 8, gy + 3, spark);
    },
  }),
  gauss_lobber: held({
    class: 'rifle',
    ramp: RAMP.BLUE,
    // the magnetised charge glows blue at the muzzle (boss-drop top)
    detail: ({ pm, gx, gy, pose }) => {
      const charge = px(RAMP.CYAN, 3);
      if (pose === 'aim') pm.set(gx + 10, gy - 8, charge);
      else if (pose === 'recoil') pm.set(gx + 11, gy - 7, charge);
      else pm.set(gx + 7, gy + 4, charge);
    },
  }),
  cricket_bat: held({
    class: 'bat',
    ramp: RAMP.BLOND,
    // the willow seam + a smear of linseed (carved-in initials, the team's)
    detail: ({ pm, gx, gy, pose }) => {
      const seam = px(RAMP.BLOND, 0);
      if (pose === 'back') pm.set(gx - 7, gy - 8, seam);
      else if (pose === 'strike') pm.set(gx + 6, gy - 4, seam);
      else pm.set(gx + 4, gy - 6, seam);
    },
  }),

  /* ---- Ch.3 — armor 'body' gear (torso re-dress; the §A8 hat/garment ladder) ---- */
  cricket_cap: { kind: 'torso', ramp: RAMP.RED, trim: RAMP.BLUE },
  school_blazer: { kind: 'torso', ramp: RAMP.NIGHT, trim: RAMP.GOLD },
  tweed_waistcoat: { kind: 'torso', ramp: RAMP.EARTH, trim: RAMP.BLOND },
  oilcloth_mac: { kind: 'torso', ramp: RAMP.INK, trim: RAMP.BLUE },

  /* ---- Ch.3 — generic ARMS + academic CHARMS (forge trinkets) ---- */
  fingerless_mitts: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch3', detail: 'stripe', seed: 'fingerless_mitts' }) },
  cricket_pads: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'bracer', band: 'ch3', seed: 'cricket_pads' }) },
  lucky_conker: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch3', detail: 'stone', tint: RAMP.EARTH, seed: 'lucky_conker' }) },
  house_pin: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch3', seed: 'house_pin' }) },
  brass_compass: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch3', detail: 'stone', tint: RAMP.GOLD, seed: 'brass_compass' }) },
  rain_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch3', detail: 'stone', tint: RAMP.CYAN, seed: 'rain_charm' }) },

  /* ---- Ch.4 NORWAY — funny SIDEGRADES (a frozen fish, a flatbread griddle) ---- */
  frozen_cod: held({
    class: 'bat',
    ramp: RAMP.CYAN,
    // the frost rime + a fishy eye near the tip
    detail: ({ pm, gx, gy, pose }) => {
      const rime = px(RAMP.PAPER, 3);
      const eye = px(RAMP.INK, 1);
      if (pose === 'back') { pm.set(gx - 8, gy - 9, rime); pm.set(gx - 10, gy - 11, eye); }
      else if (pose === 'strike') { pm.set(gx + 6, gy - 3, rime); pm.set(gx + 8, gy - 4, eye); }
      else { pm.set(gx + 4, gy - 6, rime); pm.set(gx + 5, gy - 8, eye); }
    },
  }),
  lefse_griddle: held({
    class: 'pan',
    ramp: RAMP.EARTH,
    // the griddle's heat-bloom + a white spark of well-seasoned iron
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'back') { pm.set(gx - 6, gy - 8, px(RAMP.ORANGE, 2)); pm.set(gx - 7, gy - 9, C.white); }
      else if (pose === 'strike') { pm.set(gx + 6, gy - 5, px(RAMP.ORANGE, 2)); pm.set(gx + 8, gy - 6, C.white); }
      else { pm.set(gx, gy + 4, px(RAMP.ORANGE, 2)); pm.set(gx + 2, gy + 5, C.white); }
    },
  }),

  /* ---- Ch.4 — armor 'body' gear (the Fur-Lined Hood heads the §A8 rung) ---- */
  fur_lined_hood: { kind: 'torso', ramp: RAMP.CYAN, trim: RAMP.PAPER },
  wool_sweater: { kind: 'torso', ramp: RAMP.BLUE, trim: RAMP.PAPER },
  oilskin_slicker: { kind: 'torso', ramp: RAMP.NIGHT, trim: RAMP.GOLD },
  troll_hide_vest: { kind: 'torso', ramp: RAMP.FOREST, trim: RAMP.EARTH },

  /* ---- Ch.4 — generic ARMS + the resist CHARMS (forge trinkets) ---- */
  reindeer_mittens: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch4', detail: 'dots', seed: 'reindeer_mittens' }) },
  rope_bracer: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'wrap', band: 'ch4', seed: 'rope_bracer' }) },
  cool_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch4', detail: 'stone', tint: RAMP.CYAN, seed: 'cool_charm' }) },
  troll_cross: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch4', detail: 'stone', tint: RAMP.INK, seed: 'troll_cross' }) },
  amber_drop: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch4', detail: 'stone', tint: RAMP.GOLD, seed: 'amber_drop' }) },
  vegvisir_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch4', detail: 'star', seed: 'vegvisir_charm' }) },

  /* ---- Ch.5 MINIMUS — PIPPA'S KIT LADDER (kit class; one tiny jab, the rungs
     told apart by ramp + a per-rung head mark; the Royal Red Pen is the top) ---- */
  stamp_sling: held({
    class: 'kit',
    ramp: RAMP.EARTH,
    // a flash of the licked, loaded stamp at the head
    detail: ({ pm, gx, gy, pose }) => {
      const stamp = px(RAMP.PURPLE, 2);
      if (pose === 'back') pm.set(gx - 7, gy - 7, stamp);
      else if (pose === 'strike') pm.set(gx + 8, gy - 2, stamp);
      else pm.set(gx + 4, gy - 6, stamp);
    },
  }),
  needle_saber: held({
    class: 'kit',
    ramp: RAMP.PAPER,
    // a thread of magenta trailing the eye of the needle
    detail: ({ pm, gx, gy, pose }) => {
      const thread = px(RAMP.MAGENTA, 2);
      if (pose === 'back') pm.set(gx + 1, gy + 1, thread);
      else if (pose === 'strike') pm.set(gx, gy + 1, thread);
      else pm.set(gx, gy, thread);
    },
  }),
  thimble_bell: held({
    class: 'kit',
    ramp: RAMP.PAPER,
    // a bright ring of the silver bell at the head
    detail: ({ pm, gx, gy, pose }) => {
      const ring = px(RAMP.GOLD, 3);
      if (pose === 'back') pm.set(gx - 7, gy - 7, ring);
      else if (pose === 'strike') pm.set(gx + 8, gy - 2, ring);
      else pm.set(gx + 4, gy - 6, ring);
    },
  }),
  royal_red_pen: held({
    class: 'kit',
    ramp: RAMP.RED,
    // the gold nib + a final red correction at the tip (boss-drop top)
    detail: ({ pm, gx, gy, pose }) => {
      const nib = px(RAMP.GOLD, 3);
      if (pose === 'back') { pm.set(gx - 7, gy - 7, nib); pm.set(gx - 6, gy - 8, px(RAMP.RED, 3)); }
      else if (pose === 'strike') { pm.set(gx + 8, gy - 2, nib); pm.set(gx + 9, gy - 1, px(RAMP.RED, 3)); }
      else { pm.set(gx + 4, gy - 6, nib); pm.set(gx + 5, gy - 7, px(RAMP.RED, 3)); }
    },
  }),

  /* ---- Ch.5 — armor 'body' gear (the Paper Crown heads the §A8 rung) ---- */
  paper_crown: { kind: 'torso', ramp: RAMP.GOLD, trim: RAMP.PURPLE },
  velvet_doublet: { kind: 'torso', ramp: RAMP.PURPLE, trim: RAMP.GOLD },
  herald_tabard: { kind: 'torso', ramp: RAMP.MAGENTA, trim: RAMP.BLUE },
  ermine_cape: { kind: 'torso', ramp: RAMP.RED, trim: RAMP.PAPER },

  /* ---- Ch.5 — generic ARMS + diplomatic CHARMS (forge trinkets) ---- */
  lace_cuffs: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch5', detail: 'ribbon', seed: 'lace_cuffs' }) },
  signet_bracer: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'bracer', band: 'ch5', detail: 'star', seed: 'signet_bracer' }) },
  duchy_seal_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch5', detail: 'ribbon', seed: 'duchy_seal_charm' }) },
  morale_medal: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch5', detail: 'star', seed: 'morale_medal' }) },
  lens_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch5', detail: 'stone', tint: RAMP.CYAN, seed: 'lens_charm' }) },
  census_quill_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch5', detail: 'stone', tint: RAMP.GOLD, seed: 'census_quill_charm' }) },

  /* ============ S17 M20 (ADR-065) — THE FAR-WORLD CATALOG ============
   * Ch.6 Africa · Ch.7 India · Ch.8 China. The §A8 MID-RUNGS land here: Jay's
   * Aluminum → Hall-of-Famer, Mia's Cast-Iron → Chef's, Dorin's River Beads —
   * each a HAND signature (the bat/pan/beads silhouettes, told apart by ramp +
   * mark), the boss-drop tops priced 0. Plus the two funny kit sidegrades
   * (Pippa's cobra-flute, the folded-paper fan). Armor re-dresses the torso;
   * the generic arms/charms ride forge trinkets; the Riddle Ring is bespoke. */

  /* ---- Ch.6 AFRICA — Jay's Aluminum + Hall-of-Famer (the Sphinx drop), Mia's
     Cast-Iron (savanna ochre + indigo) ---- */
  aluminum_bat: held({
    class: 'bat',
    ramp: RAMP.PAPER, // brushed silver — a regulation ring near the tip
    detail: ({ pm, gx, gy, pose }) => {
      const ring = px(RAMP.INK, 2);
      if (pose === 'back') pm.set(gx - 9, gy - 10, ring);
      else if (pose === 'strike') pm.set(gx + 7, gy - 4, ring);
      else pm.set(gx + 5, gy - 7, ring);
    },
  }),
  hall_of_famer_bat: held({
    class: 'bat',
    ramp: RAMP.GOLD, // a gilded bat off the Laughing Ruins' old hall — a star burned in
    detail: ({ pm, gx, gy, pose }) => {
      const star = px(RAMP.PAPER, 3);
      if (pose === 'back') pm.set(gx - 8, gy - 9, star);
      else if (pose === 'strike') pm.set(gx + 8, gy - 4, star);
      else pm.set(gx + 5, gy - 8, star);
    },
  }),
  cast_iron_pan: held({
    class: 'pan',
    ramp: RAMP.INK, // black iron, a warm seasoned bloom and a hard-won gleam
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'back') { pm.set(gx - 6, gy - 8, px(RAMP.ORANGE, 1)); pm.set(gx - 7, gy - 9, C.white); }
      else if (pose === 'strike') { pm.set(gx + 6, gy - 5, px(RAMP.ORANGE, 1)); pm.set(gx + 8, gy - 6, C.white); }
      else { pm.set(gx - 1, gy + 4, px(RAMP.ORANGE, 1)); pm.set(gx + 1, gy + 4, C.white); }
    },
  }),

  /* ---- Ch.7 INDIA — Mia's Chef's Pan (the Cobra Raja drop) + the cobra-flute
     sidegrade (Pippa, kit class) ---- */
  chefs_pan: held({
    class: 'pan',
    ramp: RAMP.GOLD, // a gleaming palace-kitchen pan, brass-bright
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'back') { pm.set(gx - 6, gy - 8, px(RAMP.PAPER, 3)); pm.set(gx - 7, gy - 9, C.white); }
      else if (pose === 'strike') { pm.set(gx + 6, gy - 5, px(RAMP.PAPER, 3)); pm.set(gx + 8, gy - 6, C.white); }
      else { pm.set(gx - 1, gy + 4, px(RAMP.PAPER, 3)); pm.set(gx + 1, gy + 4, C.white); }
    },
  }),
  cobra_flute: held({
    class: 'kit',
    ramp: RAMP.GOLD, // a brass been; the charmer's note hangs at the head
    detail: ({ pm, gx, gy, pose }) => {
      const note = px(RAMP.MAGENTA, 2);
      if (pose === 'back') pm.set(gx - 7, gy - 7, note);
      else if (pose === 'strike') pm.set(gx + 8, gy - 2, note);
      else pm.set(gx + 4, gy - 6, note);
    },
  }),

  /* ---- Ch.8 CHINA — Dorin's River Beads + the folded-paper fan (Pippa, kit;
     the Paper Dragon's own fold, the boss-drop) ---- */
  river_beads: held({
    class: 'beads',
    ramp: RAMP.BLUE, // river-blue agate; the gold focal bead still blesses each strike
    detail: ({ pm, gx, gy }) => {
      pm.set(gx, gy - 1, px(RAMP.GOLD, 2));
    },
  }),
  paper_fan: held({
    class: 'kit',
    ramp: RAMP.CYAN, // a rice-paper fan, a lacquer-red rib at the head
    detail: ({ pm, gx, gy, pose }) => {
      const rib = px(RAMP.RED, 2);
      if (pose === 'back') pm.set(gx - 7, gy - 7, rib);
      else if (pose === 'strike') pm.set(gx + 8, gy - 2, rib);
      else pm.set(gx + 4, gy - 6, rib);
    },
  }),

  /* ---- Ch.6 AFRICA — armor 'body' gear (the Turban of Calm heads the §A8 rung —
     "of Calm" is the joke; it does nothing calming) + the savanna bodies ---- */
  turban_of_calm: { kind: 'torso', ramp: RAMP.PAPER, trim: RAMP.GOLD },
  kanga_wrap: { kind: 'torso', ramp: RAMP.BLUE, trim: RAMP.GOLD },
  savanna_cloak: { kind: 'torso', ramp: RAMP.EARTH, trim: RAMP.ORANGE },
  mudcloth_vest: { kind: 'torso', ramp: RAMP.EARTH, trim: RAMP.BLUE },

  /* ---- Ch.6 — generic ARMS + the savanna CHARMS (Riddle Ring bespoke) ---- */
  beaded_cuff: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'wrap', band: 'ch6', detail: 'dots', seed: 'beaded_cuff' }) },
  hide_bracer: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'bracer', band: 'ch6', seed: 'hide_bracer' }) },
  riddle_ring: { kind: 'trinket', icon: drawRiddleRingIcon },
  dust_devil_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch6', detail: 'stone', tint: RAMP.EARTH, seed: 'dust_devil_charm' }) },
  fastest_man_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch6', detail: 'star', seed: 'fastest_man_charm' }) },
  griot_string: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch6', detail: 'stone', tint: RAMP.GOLD, seed: 'griot_string' }) },
  baobab_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch6', detail: 'stone', tint: RAMP.GRASS, seed: 'baobab_charm' }) },

  /* ---- Ch.7 INDIA — armor 'body' gear (the jeweled Pagri heads the rung) ---- */
  jeweled_pagri: { kind: 'torso', ramp: RAMP.MAGENTA, trim: RAMP.GOLD },
  silk_kurta: { kind: 'torso', ramp: RAMP.GOLD, trim: RAMP.RED },
  embroidered_sherwani: { kind: 'torso', ramp: RAMP.PURPLE, trim: RAMP.GOLD },
  nawab_coat: { kind: 'torso', ramp: RAMP.RED, trim: RAMP.GOLD },

  /* ---- Ch.7 — generic ARMS + the bazaar CHARMS (Star Pendant, the volt-resist
     Rubber Brooch as DATA, the Monkey Paw) ---- */
  glass_bangles: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'wrap', band: 'ch7', detail: 'ribbon', seed: 'glass_bangles' }) },
  wrestler_wraps: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch7', detail: 'stripe', seed: 'wrestler_wraps' }) },
  star_pendant: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch7', detail: ['stone', 'star'], tint: RAMP.GOLD, seed: 'star_pendant' }) },
  monkey_paw_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'paw', band: 'ch7', seed: 'monkey_paw_charm' }) },
  rubber_brooch: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch7', detail: 'stone', tint: RAMP.GOLD, seed: 'rubber_brooch' }) },
  brass_elephant: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch7', seed: 'brass_elephant' }) },
  peacock_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch7', detail: 'stone', tint: RAMP.BLUE, seed: 'peacock_charm' }) },

  /* ---- Ch.8 CHINA — armor 'body' gear (the Bamboo Hat heads the rung; jade,
     lacquer-red, saffron) ---- */
  bamboo_hat: { kind: 'torso', ramp: RAMP.GOLD, trim: RAMP.FOREST },
  silk_changshan: { kind: 'torso', ramp: RAMP.FOREST, trim: RAMP.GOLD },
  lacquer_robe: { kind: 'torso', ramp: RAMP.RED, trim: RAMP.GOLD },
  monks_robe: { kind: 'torso', ramp: RAMP.GOLD, trim: RAMP.RED },

  /* ---- Ch.8 — generic ARMS + the paper-fold/jade CHARMS (the fire-resist Jade
     Salamander as DATA; Pippa's "false folds" paper crane) ---- */
  silk_armguards: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch8', detail: 'dots', seed: 'silk_armguards' }) },
  prayer_wraps: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'wrap', band: 'ch8', seed: 'prayer_wraps' }) },
  paper_crane_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch8', detail: 'ribbon', seed: 'paper_crane_charm' }) },
  jade_salamander_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch8', detail: 'stone', tint: RAMP.GRASS, seed: 'jade_salamander_charm' }) },
  jade_pendant: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch8', detail: 'stone', tint: RAMP.FOREST, seed: 'jade_pendant' }) },
  lucky_knot: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch8', detail: 'ribbon', tint: RAMP.RED, seed: 'lucky_knot' }) },
  cash_coin_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch8', detail: 'star', seed: 'cash_coin_charm' }) },

  /* ============ S17 M21 (ADR-091) — THE LAST-WORLD CATALOG ============
   * Ch.9 Romania · Ch.10 Alaska→Hawaii→Mars. The §A8 hero ladders CLOSE here: Mia's
   * THE HOLY PAN (ch9 monastery), Jay's CASEY'S LAST SWING (ch10 Mars drop), Dorin's
   * COMET BEAD (ch10, the 1/128 Null Walker chase) — each a HAND signature (the pan/
   * bat/beads silhouettes, told apart by ramp + mark), plus the funny Board of
   * Legends (Jay, Hawaii) and Pemberton's optional ray-gun (Milo, dad's chapter).
   * Armor re-dresses the torso; the generic arms/charms ride forge trinkets. */

  /* ---- Ch.9 ROMANIA — Mia's Holy Pan (TOP) + the Candelabra (Hoaxula's boss-drop) ---- */
  holy_pan: held({
    class: 'pan',
    ramp: RAMP.PAPER, // silver-white, blessed; a gold halo-glint where it lands
    detail: ({ pm, gx, gy, pose }) => {
      const halo = px(RAMP.GOLD, 3);
      if (pose === 'back') pm.set(gx - 7, gy - 11, halo);
      else if (pose === 'strike') { pm.set(gx + 7, gy - 8, halo); pm.set(gx + 8, gy - 7, C.white); }
      else pm.set(gx, gy + 1, halo);
    },
  }),
  candelabra: held({
    class: 'bat',
    ramp: RAMP.GOLD, // heavy brass; a guttering flame at the tip
    detail: ({ pm, gx, gy, pose }) => {
      const flame = px(RAMP.ORANGE, 3);
      if (pose === 'back') pm.set(gx - 11, gy - 13, flame);
      else if (pose === 'strike') pm.set(gx + 9, gy - 6, flame);
      else pm.set(gx + 6, gy - 10, flame);
    },
  }),

  /* ---- Ch.10 HAWAII — the Board of Legends (Jay, funniest sidegrade) + Pemberton's
     ray-gun (Milo, the dad chapter) ---- */
  board_of_legends: held({
    class: 'bat',
    ramp: RAMP.CYAN, // a surf longboard swung like a colossal bat; a red stringer
    detail: ({ pm, gx, gy, pose }) => {
      const stripe = px(RAMP.RED, 2);
      if (pose === 'back') pm.set(gx - 6, gy - 6, stripe);
      else if (pose === 'strike') pm.set(gx + 5, gy - 3, stripe);
      else pm.set(gx + 3, gy - 5, stripe);
    },
  }),
  pembertons_raygun: held({
    class: 'rifle',
    ramp: RAMP.PURPLE, // a sleek ion-lobber; a charged muzzle bead
    detail: ({ pm, gx, gy, pose }) => {
      if (pose === 'aim' || pose === 'recoil') pm.set(gx + 10, gy - 8, px(RAMP.MAGENTA, 3));
    },
  }),

  /* ---- Ch.10 MARS — Casey's Last Swing (Jay TOP) + Comet Bead (Dorin TOP) ---- */
  caseys_last_swing: held({
    class: 'bat',
    ramp: RAMP.BLOND, // plain worn ash; one gold star burned near the barrel
    detail: ({ pm, gx, gy, pose }) => {
      const star = px(RAMP.GOLD, 3);
      if (pose === 'back') { pm.set(gx - 7, gy - 8, star); pm.set(gx - 8, gy - 9, C.white); }
      else if (pose === 'strike') { pm.set(gx + 7, gy - 4, star); pm.set(gx + 9, gy - 5, C.white); }
      else { pm.set(gx + 4, gy - 6, star); pm.set(gx + 5, gy - 8, C.white); }
    },
  }),
  comet_bead: held({
    class: 'beads',
    ramp: RAMP.PURPLE, // fallen-star bead; a comet head + a cyan tail on the strike
    detail: ({ pm, gx, gy, pose }) => {
      pm.set(gx, gy - 1, px(RAMP.GOLD, 3));
      if (pose === 'strike') {
        pm.set(gx + 8, gy - 3, C.white);
        pm.set(gx + 9, gy - 2, px(RAMP.CYAN, 2));
      }
    },
  }),

  /* ---- Ch.9 ROMANIA — armor 'body' gear (the căciulă heads the §A8 rung) + the
     velvet/harvest/monastery bodies (candlelit-castle palette) ---- */
  caciula: { kind: 'torso', ramp: RAMP.EARTH, trim: RAMP.PAPER },
  monks_wrap: { kind: 'torso', ramp: RAMP.NIGHT, trim: RAMP.GOLD },
  velvet_cloak: { kind: 'torso', ramp: RAMP.PURPLE, trim: RAMP.GOLD },
  sheepskin_cojoc: { kind: 'torso', ramp: RAMP.PAPER, trim: RAMP.RED },
  embroidered_ie: { kind: 'torso', ramp: RAMP.PAPER, trim: RAMP.MAGENTA },

  /* ---- Ch.9 — generic ARMS + the monastery/castle CHARMS (the Saint's Medal is the
     §A8 HOLY-resist pendant — DATA; un-tagged, no ch9 SET) ---- */
  monks_wraps: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'wrap', band: 'ch9', detail: 'stripe', seed: 'monks_wraps' }) },
  embroidered_cuffs: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch9', detail: 'ribbon', seed: 'embroidered_cuffs' }) },
  prayer_bead_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch9', detail: 'stone', tint: RAMP.EARTH, seed: 'prayer_bead_charm' }) },
  saints_medal: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch9', detail: 'star', seed: 'saints_medal' }) },
  trial_keepsake: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch9', detail: 'stone', tint: RAMP.RED, seed: 'trial_keepsake' }) },
  garlic_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch9', detail: 'stone', tint: RAMP.PAPER, seed: 'garlic_charm' }) },

  /* ---- Ch.10 ALASKA — armor 'body' gear (the Aurora Fur-Hood heads the rung;
     freeze-resist) + the cold-country charms (the Sentinel's Heart is the Frost
     Sentinel drop) ---- */
  aurora_fur_hood: { kind: 'torso', ramp: RAMP.CYAN, trim: RAMP.PAPER },
  insulated_suit: { kind: 'torso', ramp: RAMP.NIGHT, trim: RAMP.ORANGE },
  sealskin_parka: { kind: 'torso', ramp: RAMP.NIGHT, trim: RAMP.CYAN },
  insulated_gloves: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'glove', band: 'ch10', detail: 'dots', seed: 'insulated_gloves' }) },
  sentinels_heart: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch10', detail: ['stone', 'dots'], tint: RAMP.CYAN, seed: 'sentinels_heart' }) },
  ulu_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch10', detail: 'star', seed: 'ulu_charm' }) },
  aurora_locket: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch10', detail: 'stone', tint: RAMP.GRASS, seed: 'aurora_locket' }) },

  /* ---- Ch.10 HAWAII — armor 'body' gear (the Lauhala Hat heads the rung; the
     Heat-Shield Vest is the fire-resist rung) + the island charms (the Magma Heart
     is the Tiki Magma Golem drop) ---- */
  lauhala_hat: { kind: 'torso', ramp: RAMP.GOLD, trim: RAMP.EARTH },
  heat_shield_vest: { kind: 'torso', ramp: RAMP.RED, trim: RAMP.GOLD },
  aloha_shirt: { kind: 'torso', ramp: RAMP.CYAN, trim: RAMP.RED },
  surf_wax_grips: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'wrap', band: 'ch10', detail: 'stripe', seed: 'surf_wax_grips' }) },
  lei_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch10', detail: 'stone', tint: RAMP.MAGENTA, seed: 'lei_charm' }) },
  surf_visor: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'brooch', band: 'ch10', detail: 'stone', tint: RAMP.CYAN, seed: 'surf_visor' }) },
  tiki_magma_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch10', detail: 'stone', tint: RAMP.ORANGE, seed: 'tiki_magma_charm' }) },

  /* ---- Ch.10 MARS — armor 'body' gear (the Pressure Suit, dearest in the game) +
     the endgame charms ---- */
  pressure_suit: { kind: 'torso', ramp: RAMP.PAPER, trim: RAMP.ORANGE },
  oxygen_hood: { kind: 'torso', ramp: RAMP.CYAN, trim: RAMP.NIGHT },
  eva_gauntlets: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'bracer', band: 'ch10', detail: 'star', seed: 'eva_gauntlets' }) },
  cosmonaut_medal: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'medal', band: 'ch10', detail: ['ribbon', 'dots'], seed: 'cosmonaut_medal' }) },
  stardust_charm: { kind: 'trinket', icon: () => forgeIcon({ subcat: 'pendant', band: 'ch10', detail: 'stone', tint: RAMP.PURPLE, seed: 'stardust_charm' }) },
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
    case 'kit':
      return 'swing_kit';
    default:
      return 'swing_fist';
  }
}
