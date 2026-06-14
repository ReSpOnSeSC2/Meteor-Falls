/**
 * ITEM_ICON — S16 Movement 8 (ADR-060): THE ICON ATLAS. The universal menu-icon
 * registry. Every §A8 item, of EVERY ItemKind, gets a bespoke 12–16px drawn
 * icon so the menus feel finished: the player reads a face beside every name in
 * the Items bag, the Equip screen, the shop counter, and battle Goods.
 *
 * This GENERALISES the equippable-only WEAPON_ART (spritegen/weapons.ts): the
 * 'trinket' icons (arms + charms) are already bespoke, so ITEM_ICON reuses them
 * verbatim — one drawing, two registries. Held weapons and torso armor compose
 * onto the BATTLER through WEAPON_ART and so had no standalone face; they get a
 * fresh, legible OBJECT icon here (a little bat, a folded jacket). Everything
 * that isn't equippable — food, drinks, cures, battle items, valuables, picnic
 * baskets, key items — gets a brand-new icon drawn to its §A8 flavor.
 *
 * The registry is gated BOTH directions (tools/content-validate.ts + the vitest
 * mirror in icons.test.ts), exactly like WEAPON_ART: every ITEMS entry has an
 * icon row, and no icon row names an item that does not exist.
 *
 * Phaser-free on purpose (the validator imports this). ADR-020 holds: flat
 * fills, deliberate marks, no scatter noise; outline() lands last so every icon
 * lives inside one INK contour, and only pure light (a glass glint) follows it.
 */
import { Pixmap } from './pixmap';
import { RAMP, px, C, T } from '../palette';
import { WEAPON_ART } from './weapons';
import { forgeIcon } from './iconforge';

/** the Phaser texture key an item icon registers under (index.ts) */
export function itemIconKey(id: string): string {
  return `item_${id}`;
}

/* ================================================================== */
/* HELD WEAPONS — a small object icon (the battler swing lives in WEAPON_ART). */

type BatMark = 'crack' | 'ring' | 'carve';

/** a baseball bat laid corner-to-corner: thin knob low-left, fat barrel high-right */
function drawBatIcon(ramp: number, mark: BatMark): Pixmap {
  const pm = new Pixmap(14, 14);
  const wood = px(ramp, 2);
  const woodL = px(ramp, 3);
  const woodD = px(ramp, 1);
  // knob
  pm.rect(2, 11, 2, 2, woodD);
  // shaft — 2px, climbing up-right
  pm.line(3, 11, 8, 6, wood);
  pm.line(4, 11, 9, 6, wood);
  pm.line(3, 10, 8, 5, woodL); // lit upper edge
  // barrel — fattens to 3px toward the tip
  pm.line(8, 6, 11, 3, wood);
  pm.line(9, 6, 12, 3, wood);
  pm.line(7, 6, 10, 3, woodL);
  // the fat tip
  pm.rect(10, 2, 3, 2, wood);
  pm.set(10, 2, woodL);
  // tape near the grip — every §A8 bat is loved
  pm.set(4, 9, px(RAMP.PAPER, 2));
  pm.set(5, 9, px(RAMP.PAPER, 2));
  // the item-specific mark
  if (mark === 'crack') {
    const c = px(ramp, 0);
    pm.set(6, 8, c);
    pm.set(7, 7, c);
  } else if (mark === 'ring') {
    const r = px(RAMP.RED, 2);
    pm.set(9, 5, r);
    pm.set(10, 4, r);
  } else {
    const c = px(ramp, 0); // carved initials nick
    pm.set(8, 6, c);
    pm.set(9, 5, c);
  }
  pm.outline(C.outline);
  return pm;
}

/** a frying pan: a round disc with a handle out the upper-right */
function drawPanIcon(ramp: number, copper: boolean): Pixmap {
  const pm = new Pixmap(14, 14);
  const iron = px(ramp, 1);
  const ironL = px(ramp, 2);
  const handle = px(RAMP.EARTH, copper ? 2 : 1);
  // the disc
  pm.ellipse(6, 8, 4, 4, iron);
  pm.ellipse(6, 7, 3, 2, ironL); // the cooking face, lit
  // handle up-right
  pm.line(9, 5, 12, 2, handle);
  pm.line(10, 5, 13, 2, handle);
  // the detail: a polish spark, or the copper bloom
  if (copper) {
    pm.set(5, 6, px(RAMP.ORANGE, 3));
    pm.set(7, 9, px(RAMP.ORANGE, 0));
  }
  pm.set(4, 6, C.white); // the gleam twenty years of breakfast left
  pm.outline(C.outline);
  return pm;
}

/** Milo's gun-ladder menu face: stock low-left, barrel right. The mark walks the
 *  §A8 ladder — the orange safety tip (Popper) → a loaded spud → twin barrels →
 *  the Mainframe's gauss coil (the boss-drop top). One silhouette, four rungs. */
type RifleMark = 'tip' | 'spud' | 'double' | 'gauss';
function drawRifleIcon(ramp: number, mark: RifleMark): Pixmap {
  const pm = new Pixmap(14, 12);
  const stock = px(ramp, 1);
  const stockL = px(ramp, 2);
  const steel = px(RAMP.INK, 1);
  const steelL = px(RAMP.INK, 2);
  // stock (the shoulder end)
  pm.rect(1, 6, 4, 3, stock);
  pm.hline(1, 6, 4, stockL);
  // barrel along the top
  pm.rect(5, 5, 7, 2, steel);
  pm.hline(5, 5, 7, steelL);
  // trigger guard + grip hint
  pm.set(5, 8, steel);
  pm.set(6, 9, stock);
  if (mark === 'spud') {
    // a King Edward jammed in the muzzle, the day's ammunition
    pm.ellipse(12, 5, 2, 2, px(RAMP.BLOND, 2));
    pm.set(11, 4, px(RAMP.BLOND, 3));
    pm.set(13, 6, px(RAMP.EARTH, 1)); // a potato eye
  } else if (mark === 'double') {
    // a second barrel slung under the first, and a spark off the tips
    pm.rect(5, 7, 7, 1, steel);
    pm.set(12, 4, px(RAMP.GOLD, 3));
    pm.set(13, 5, px(RAMP.GOLD, 2));
  } else if (mark === 'gauss') {
    // the magnetic coil wound round the barrel, a captive blue charge at the muzzle
    pm.vline(7, 4, 4, px(RAMP.GOLD, 2));
    pm.vline(9, 4, 4, px(RAMP.GOLD, 2));
    pm.set(12, 5, px(RAMP.CYAN, 3));
    pm.set(13, 5, px(RAMP.CYAN, 2));
    pm.set(12, 6, px(RAMP.CYAN, 3));
  } else {
    // the safety-orange muzzle tip — Wintermoor insists
    pm.set(12, 5, px(RAMP.ORANGE, 3));
    pm.set(12, 6, px(RAMP.ORANGE, 2));
  }
  pm.outline(C.outline);
  if (mark === 'gauss') pm.set(12, 5, C.white); // pure light after the contour — the charge glows
  return pm;
}

/** a one-bespoke menu face for Lucille's spare propeller (§A8 key item): a
 *  two-blade airscrew on a brass hub, the way it leans against Uncle Bert's hangar */
function drawPropellerIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const wood = px(RAMP.EARTH, 2);
  const woodL = px(RAMP.EARTH, 3);
  // two blades sweeping from a central hub (a shallow S)
  pm.line(7, 7, 2, 3, wood);
  pm.line(7, 7, 3, 2, woodL);
  pm.line(7, 7, 12, 11, wood);
  pm.line(7, 7, 11, 12, woodL);
  pm.set(2, 4, wood); // blade tips broaden
  pm.set(12, 10, wood);
  // the brass hub + bolt
  pm.ellipse(7, 7, 2, 2, px(RAMP.GOLD, 2));
  pm.set(7, 7, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

/** Sigrid's Monocle (§A8 key, Ch.4): a reground lens in a brass ring on a chain —
 *  pond-sized to the party, the reusable Focus of Bootstep Moor */
function drawMonocleIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  // the lens ring, large and low-left
  pm.ellipse(6, 8, 5, 5, brass);
  pm.ellipse(6, 8, 4, 4, px(RAMP.CYAN, 1)); // the cold glass
  pm.ellipse(5, 7, 2, 2, px(RAMP.CYAN, 3)); // a watery highlight
  // the little adjustment knob + a chain trailing off the top-right
  pm.set(10, 4, brassL);
  pm.set(11, 3, brass);
  pm.set(12, 3, brass);
  pm.set(13, 4, brass);
  pm.outline(C.outline);
  pm.set(5, 6, C.white); // pure light after the contour — a pond catches the sky
  return pm;
}

/* ---- Ch.5 MINIMUS — PIPPA'S KIT LADDER menu faces (bespoke signatures). Tiny,
 *      precise page implements; normal-sized in the bag, absurd in the fiction. ---- */

/** the Stamp Sling: a forked twig sling cradling a loaded postage stamp */
function drawStampSlingIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const wood = px(RAMP.EARTH, 2);
  // the Y-fork
  pm.vline(6, 8, 5, wood);
  pm.line(6, 8, 3, 4, wood);
  pm.line(6, 8, 9, 4, wood);
  // the elastic, drawn back
  pm.line(3, 4, 6, 7, px(RAMP.RED, 1));
  pm.line(9, 4, 6, 7, px(RAMP.RED, 1));
  // the loaded stamp (perforated paper, a tiny crown printed)
  pm.rect(5, 6, 3, 3, px(RAMP.PURPLE, 2));
  pm.set(6, 7, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

/** the Needle Saber: a darning needle as a rapier, thread looped at the eye */
function drawNeedleSaberIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const steel = px(RAMP.PAPER, 2);
  const steelL = px(RAMP.PAPER, 3);
  // the blade, corner to corner, fine
  pm.line(3, 11, 11, 3, steel);
  pm.line(4, 11, 12, 3, steelL);
  pm.set(12, 2, steelL); // the point
  // the eye at the pommel + a loop of magenta thread
  pm.ellipse(3, 11, 1, 1, steel);
  pm.set(3, 11, C.outline);
  pm.set(2, 13, px(RAMP.MAGENTA, 2));
  pm.set(1, 12, px(RAMP.MAGENTA, 3));
  pm.outline(C.outline);
  pm.set(11, 3, C.white); // a glint off the tip
  return pm;
}

/** the Thimble Bell: a silver thimble inverted as a bell, a clapper below */
function drawThimbleBellIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const silver = px(RAMP.PAPER, 2);
  const silverL = px(RAMP.PAPER, 3);
  // the dimpled thimble dome (a bell)
  pm.contour(6, 3, [1, 2, 3, 4, 4], silver);
  pm.hline(2, 8, 9, silverL); // the mouth rim
  // the dimple texture
  pm.set(5, 5, px(RAMP.PAPER, 1));
  pm.set(7, 5, px(RAMP.PAPER, 1));
  pm.set(6, 4, px(RAMP.PAPER, 1));
  // a gold clapper swinging below
  pm.set(6, 10, px(RAMP.GOLD, 2));
  pm.set(6, 11, px(RAMP.GOLD, 3));
  // the crown-loop on top
  pm.set(6, 1, px(RAMP.GOLD, 2));
  pm.outline(C.outline);
  return pm;
}

/** the Royal Red Pen (boss-drop top): a red fountain pen, gold nib, a final mark */
function drawRedPenIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const red = px(RAMP.RED, 2);
  const redL = px(RAMP.RED, 3);
  // the barrel, corner to corner
  pm.line(2, 11, 9, 4, red);
  pm.line(3, 11, 10, 4, redL);
  pm.line(2, 12, 9, 5, px(RAMP.RED, 1));
  // the gold cap band + clip
  pm.set(5, 8, px(RAMP.GOLD, 2));
  pm.set(6, 7, px(RAMP.GOLD, 2));
  // the gold nib at the tip
  pm.line(9, 4, 11, 2, px(RAMP.GOLD, 2));
  pm.set(11, 2, px(RAMP.GOLD, 3));
  // a small red correction mark, freshly made — corrections are final
  pm.set(12, 11, redL);
  pm.set(13, 12, red);
  pm.set(13, 10, red);
  pm.outline(C.outline);
  pm.set(11, 2, C.white); // pure light on the nib
  return pm;
}

/** the Royal Thimble (§A8 key — Pippa's scale-anchor): an ornate gold thimble */
function drawRoyalThimbleIcon(): Pixmap {
  const pm = new Pixmap(12, 14);
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  const goldD = px(RAMP.GOLD, 1);
  // the domed thimble
  pm.contour(6, 2, [1, 2, 3, 4, 4, 4], gold);
  pm.hline(2, 9, 9, goldL); // the lit rim
  pm.hline(2, 10, 9, goldD);
  // the dimpled pattern
  for (const [x, y] of [[5, 4], [7, 4], [6, 5], [4, 6], [8, 6], [6, 7]] as Array<[number, number]>) {
    pm.set(x, y, goldD);
  }
  // a tiny inset jewel near the crown — a thimble fit for state
  pm.set(6, 3, px(RAMP.MAGENTA, 2));
  pm.outline(C.outline);
  pm.set(4, 3, C.white); // a regal glint
  return pm;
}

/** the Big-Little Lens (§A6 Ch.5 build key): a brass loupe, ground true */
function drawBigLittleLensIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  // the lens ring (a loupe), the glass a focused dot of cyan
  pm.ellipse(6, 6, 5, 5, brass);
  pm.ellipse(6, 6, 4, 4, px(RAMP.CYAN, 1));
  pm.ellipse(6, 6, 2, 2, px(RAMP.CYAN, 3)); // a bright focused centre
  // a folding brass handle out the bottom
  pm.rect(9, 10, 4, 2, brass);
  pm.hline(9, 10, 4, brassL);
  pm.outline(C.outline);
  pm.set(6, 6, C.white); // the point of perfect focus
  return pm;
}

/** a prayer-bead bracelet: a loop of beads, one gold focal bead. The ramp tells
 *  Dorin's rungs apart (cedar EARTH → river BLUE), the gold focal bead constant. */
function drawBeadsIcon(ramp: number = RAMP.EARTH): Pixmap {
  const pm = new Pixmap(14, 14);
  const bead = px(ramp, 2);
  const beadL = px(ramp, 3);
  // a ring of beads (8 around a loop)
  const at: Array<[number, number]> = [
    [6, 2], [9, 3], [11, 6], [10, 9], [7, 11], [4, 10], [2, 7], [3, 4],
  ];
  for (const [x, y] of at) {
    pm.rect(x, y, 2, 2, bead);
    pm.set(x, y, beadL); // each bead catches a little light
  }
  // the gold focal bead — the monastery's blessing knot
  pm.rect(6, 11, 2, 2, px(RAMP.GOLD, 2));
  pm.set(6, 11, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* TORSO ARMOR — a folded-garment icon (the body composes via WEAPON_ART). */

/** a varsity jacket: body + two sleeves, a star on the chest */
function drawJacketIcon(): Pixmap {
  const pm = new Pixmap(14, 13);
  const body = px(RAMP.RED, 2);
  const bodyD = px(RAMP.RED, 1);
  const sleeve = px(RAMP.PAPER, 2);
  // shoulders + sleeves (white, snap-trimmed)
  pm.rect(1, 3, 3, 5, sleeve);
  pm.rect(10, 3, 3, 5, sleeve);
  pm.hline(1, 7, 3, px(RAMP.PAPER, 1));
  pm.hline(10, 7, 3, px(RAMP.PAPER, 1));
  // body
  pm.rect(4, 2, 6, 9, body);
  pm.hline(4, 2, 6, px(RAMP.RED, 3)); // lit collar line
  pm.vline(6, 3, 8, bodyD); // the zip
  // the one star Sal pressed on himself
  pm.set(8, 5, px(RAMP.GOLD, 3));
  pm.set(7, 6, px(RAMP.GOLD, 3));
  pm.set(8, 6, px(RAMP.GOLD, 2));
  pm.set(9, 6, px(RAMP.GOLD, 3));
  pm.set(8, 7, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

/** a wool poncho: a draped trapezoid, a neck hole, a woven border + fringe */
function drawPonchoIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const wool = px(RAMP.EARTH, 2);
  const woolL = px(RAMP.EARTH, 3);
  const woolD = px(RAMP.EARTH, 1);
  // the drape — narrow shoulders widening to a hem (y=2..10)
  const hw = [2, 3, 3, 4, 4, 5, 5, 6, 6];
  pm.contour(7, 2, hw, wool);
  // the fold catching light, just left of center
  for (let i = 1; i < hw.length; i++) pm.set(6, 2 + i, woolL);
  pm.vline(7, 3, 7, woolL);
  // the head hole at the top
  pm.set(6, 2, C.outline);
  pm.set(7, 2, C.outline);
  pm.set(8, 2, C.outline);
  pm.set(7, 3, woolD);
  // the woven border band near the hem (the one reluctant llama's stripe)
  pm.hline(2, 9, 11, px(RAMP.RED, 2));
  pm.set(4, 9, px(RAMP.GOLD, 2));
  pm.set(7, 9, px(RAMP.GOLD, 2));
  pm.set(10, 9, px(RAMP.GOLD, 2));
  // the fringe hanging off the hem
  for (const fx of [2, 4, 6, 8, 10, 12]) pm.set(fx, 11, woolD);
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* FOOD */

/** a corn dog on a stick, mustard zig-zag */
function drawCornDog(): Pixmap {
  const pm = new Pixmap(12, 14);
  const stick = px(RAMP.EARTH, 2);
  const batter = px(RAMP.ORANGE, 2);
  const batterL = px(RAMP.ORANGE, 3);
  // the stick
  pm.vline(5, 10, 4, stick);
  pm.vline(6, 11, 3, px(RAMP.EARTH, 1));
  // the battered dog
  pm.ellipse(5, 5, 3, 5, batter);
  pm.ellipse(4, 4, 1, 3, batterL); // lit side
  // a mustard zig-zag (GOLD) — {rex}'s one true love
  pm.set(3, 3, px(RAMP.GOLD, 3));
  pm.set(5, 4, px(RAMP.GOLD, 3));
  pm.set(4, 6, px(RAMP.GOLD, 3));
  pm.set(6, 7, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

/** a stacked PB&J: two bread slices, jelly + peanut butter oozing between */
function drawPbj(): Pixmap {
  const pm = new Pixmap(14, 12);
  const bread = px(RAMP.EARTH, 3); // light tan crumb
  const crust = px(RAMP.EARTH, 1); // browned crust
  const jelly = px(RAMP.PURPLE, 2);
  const pb = px(RAMP.GOLD, 1);
  // top slice
  pm.rect(2, 2, 10, 3, bread);
  pm.hline(2, 2, 10, crust); // top crust
  // the filling: a band of grape jelly over peanut butter
  pm.rect(2, 5, 10, 2, jelly);
  pm.hline(2, 6, 10, pb);
  // bottom slice
  pm.rect(2, 7, 10, 3, bread);
  pm.hline(2, 9, 10, crust); // bottom crust
  // jelly oozing out one side (crusts removed by a professional)
  pm.set(2, 6, jelly);
  pm.set(11, 5, jelly);
  pm.set(11, 6, jelly);
  pm.outline(C.outline);
  return pm;
}

/** a glass of lemonade with a lemon wheel and a straw */
function drawLemonade(): Pixmap {
  const pm = new Pixmap(12, 14);
  const glass = px(RAMP.CYAN, 3);
  const drink = px(RAMP.BLOND, 2);
  const drinkL = px(RAMP.BLOND, 3);
  // a slightly tapered glass
  pm.contour(5, 4, [3, 3, 3, 3, 3, 3, 2, 2, 2], glass); // outer glass tint
  // the lemonade fill
  for (let r = 0; r < 7; r++) pm.hline(3 + (r > 4 ? 1 : 0), 6 + r, r > 4 ? 4 : 5, drink);
  pm.hline(3, 6, 5, drinkL); // the bright meniscus
  // a lemon wheel on the rim
  pm.ellipse(9, 4, 2, 2, px(RAMP.GOLD, 3));
  pm.set(9, 4, px(RAMP.BLOND, 3));
  // a straw
  pm.line(7, 2, 5, 9, px(RAMP.RED, 2));
  pm.outline(C.outline);
  return pm;
}

/** an alfajor: two cookies, dulce de leche between, powdered-sugar dusting */
function drawAlfajor(): Pixmap {
  const pm = new Pixmap(14, 12);
  const cookie = px(RAMP.EARTH, 3);
  const cookieD = px(RAMP.EARTH, 2);
  const dulce = px(RAMP.ORANGE, 1);
  // a stacked round sandwich cookie, seen edge-on
  pm.ellipse(6, 4, 5, 2, cookie); // top cookie
  pm.hline(2, 6, 9, dulce); // the dulce de leche layer
  pm.hline(2, 7, 9, dulce);
  pm.ellipse(6, 9, 5, 2, cookieD); // bottom cookie
  // the secret, peeking at the edges
  pm.set(1, 6, px(RAMP.ORANGE, 2));
  pm.set(11, 7, px(RAMP.ORANGE, 2));
  // powdered-sugar dusting on top
  pm.set(4, 3, px(RAMP.PAPER, 3));
  pm.set(7, 3, px(RAMP.PAPER, 3));
  pm.set(9, 4, px(RAMP.PAPER, 3));
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* PP DRINK */

/** a Star Cola can: a star on a red can, cold cosmic fizz off the top */
function drawCola(): Pixmap {
  const pm = new Pixmap(12, 14);
  const can = px(RAMP.RED, 2);
  const canD = px(RAMP.RED, 1);
  const lid = px(RAMP.PAPER, 1);
  // the can
  pm.rect(3, 4, 6, 9, can);
  pm.vline(3, 4, 9, px(RAMP.RED, 3)); // lit left edge
  pm.vline(8, 4, 9, canD);
  // the silver lid + pull tab
  pm.rect(3, 3, 6, 1, lid);
  pm.set(5, 2, px(RAMP.PAPER, 2));
  // the gold star
  pm.set(5, 7, px(RAMP.GOLD, 3));
  pm.set(6, 7, px(RAMP.GOLD, 3));
  pm.set(5, 8, px(RAMP.GOLD, 2));
  pm.set(6, 8, px(RAMP.GOLD, 2));
  pm.set(4, 8, px(RAMP.GOLD, 3));
  pm.set(7, 8, px(RAMP.GOLD, 3));
  // cosmic fizz
  pm.set(6, 1, px(RAMP.CYAN, 3));
  pm.set(8, 2, px(RAMP.CYAN, 2));
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* CURE */

/** Glint's Spark: a warm 4-point mote of star-stuff */
function drawSpark(): Pixmap {
  const pm = new Pixmap(13, 13);
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  // the four arms
  pm.vline(6, 1, 11, gold);
  pm.hline(1, 6, 11, gold);
  // a soft diamond core
  pm.set(5, 5, goldL);
  pm.set(7, 5, goldL);
  pm.set(5, 7, goldL);
  pm.set(7, 7, goldL);
  pm.set(6, 6, C.white); // it wants to help one more time
  // the tips brighten
  pm.set(6, 1, goldL);
  pm.set(6, 11, goldL);
  pm.set(1, 6, goldL);
  pm.set(11, 6, goldL);
  pm.outline(C.outline);
  return pm;
}

/** an aloe leaf: a pointed succulent blade, edge teeth */
function drawAloe(): Pixmap {
  const pm = new Pixmap(12, 14);
  const leaf = px(RAMP.GRASS, 1);
  const leafL = px(RAMP.GRASS, 2);
  const leafD = px(RAMP.FOREST, 2);
  // a fat pointed leaf
  pm.contour(6, 1, [0, 1, 2, 2, 3, 3, 3, 3, 2, 2, 2, 1], leaf);
  // a lighter inner stripe (the gel)
  pm.contour(6, 2, [0, 0, 1, 1, 1, 1, 1, 1, 1, 0], leafL);
  // edge teeth — it snaps cleanly and means well
  pm.set(3, 6, leafD);
  pm.set(9, 7, leafD);
  pm.set(3, 9, leafD);
  pm.set(9, 10, leafD);
  pm.outline(C.outline);
  return pm;
}

/** a folded handkerchief, somebody else's embroidered initial */
function drawHanky(): Pixmap {
  const pm = new Pixmap(14, 13);
  const cloth = px(RAMP.PAPER, 3);
  const fold = px(RAMP.PAPER, 1);
  // a folded square
  pm.rect(2, 3, 10, 8, cloth);
  pm.hline(2, 3, 10, px(RAMP.PAPER, 2)); // top hem
  // a turned-down corner (the fold)
  pm.line(9, 3, 11, 5, fold);
  pm.line(10, 3, 11, 4, fold);
  pm.set(11, 5, fold);
  // the embroidered initial — not yours
  pm.set(5, 7, px(RAMP.CYAN, 1));
  pm.set(6, 6, px(RAMP.CYAN, 1));
  pm.set(6, 8, px(RAMP.CYAN, 1));
  pm.set(7, 7, px(RAMP.CYAN, 1));
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* BATTLE ITEMS */

/** a salt shaker: glass body, perforated cap — death to slugs and ticks */
function drawSalt(): Pixmap {
  const pm = new Pixmap(12, 14);
  const glass = px(RAMP.PAPER, 2);
  const grains = px(RAMP.PAPER, 3);
  const cap = px(RAMP.GOLD, 1);
  // the rounded glass body
  pm.rect(3, 6, 6, 7, glass);
  pm.contour(5, 4, [1, 2, 3], glass); // the shoulder
  pm.vline(3, 7, 6, px(RAMP.PAPER, 1)); // shaded side
  // salt heaped inside
  pm.rect(4, 8, 4, 4, grains);
  // the metal cap with holes
  pm.rect(3, 3, 6, 2, cap);
  pm.set(4, 3, C.outline);
  pm.set(6, 3, C.outline);
  pm.set(8, 3, C.outline);
  pm.outline(C.outline);
  return pm;
}

/** a camera flash bursting white — blinds the whole room into tears */
function drawFlash(): Pixmap {
  const pm = new Pixmap(14, 13);
  const unit = px(RAMP.PAPER, 1);
  // the little flash unit, lower-left
  pm.rect(2, 8, 4, 4, unit);
  pm.hline(2, 8, 4, px(RAMP.PAPER, 2));
  // the burst, upper-right
  const w = px(RAMP.PAPER, 3);
  pm.ellipse(9, 5, 2, 2, w);
  pm.set(9, 5, C.white);
  // rays
  pm.set(9, 1, w);
  pm.set(13, 5, w);
  pm.set(9, 9, w);
  pm.set(12, 2, w);
  pm.set(12, 8, w);
  pm.set(6, 3, w);
  pm.outline(C.outline);
  // the burst core stays pure light, after the contour
  pm.set(9, 5, C.white);
  return pm;
}

/* ================================================================== */
/* VALUABLES */

/** a stamp: a perforated square with a tiny rocket — mint 1995 */
function drawStamps(): Pixmap {
  const pm = new Pixmap(13, 13);
  const paper = px(RAMP.PAPER, 3);
  // the stamp body
  pm.rect(2, 2, 9, 9, paper);
  // perforated edge — alternating nibbles of transparent
  for (let i = 2; i <= 10; i += 2) {
    pm.set(i, 1, paper);
    pm.set(i, 11, paper);
    pm.set(1, i, paper);
    pm.set(11, i, paper);
  }
  // the printed image — a tiny rocket on a blue field
  pm.rect(3, 3, 7, 7, px(RAMP.BLUE, 2));
  pm.vline(6, 4, 4, px(RAMP.RED, 2));
  pm.set(6, 4, px(RAMP.PAPER, 3)); // nose
  pm.set(5, 8, px(RAMP.GOLD, 3)); // flame
  pm.set(7, 8, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  return pm;
}

/** a paper sack of sugar, tied at the neck, four honest pounds */
function drawSugar(): Pixmap {
  const pm = new Pixmap(12, 14);
  const bag = px(RAMP.PAPER, 2);
  const bagL = px(RAMP.PAPER, 3);
  // the sack body
  pm.rect(2, 5, 8, 8, bag);
  pm.vline(2, 5, 8, bagL); // lit side
  // gathered, tied neck
  pm.contour(6, 2, [1, 2, 3], bag);
  pm.hline(4, 4, 5, px(RAMP.EARTH, 2)); // the tie string
  // the one-word recipe label
  pm.rect(4, 8, 4, 3, bagL);
  pm.hline(4, 9, 4, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

/** a wooden crate of lemons, city lemons with an attitude */
function drawLemonCrate(): Pixmap {
  const pm = new Pixmap(14, 12);
  const wood = px(RAMP.EARTH, 2);
  const woodD = px(RAMP.EARTH, 1);
  // the lemons poking over the top
  for (const [x, y] of [[3, 3], [6, 2], [9, 3], [11, 4]] as Array<[number, number]>) {
    pm.ellipse(x, y, 2, 2, px(RAMP.BLOND, 2));
    pm.set(x - 1, y - 1, px(RAMP.BLOND, 3));
  }
  // the crate
  pm.rect(2, 5, 11, 6, wood);
  pm.hline(2, 5, 11, px(RAMP.EARTH, 3)); // lit top slat
  pm.vline(5, 5, 6, woodD); // slat gaps
  pm.vline(9, 5, 6, woodD);
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* PICNIC BASKETS — basic → family → feast, plainly escalating (§A4.5). */

type BasketTier = 'basic' | 'family' | 'feast';

function drawBasket(tier: BasketTier): Pixmap {
  const pm = new Pixmap(14, 14);
  const wicker = px(RAMP.EARTH, 2);
  const wickerL = px(RAMP.EARTH, 3);
  const wickerD = px(RAMP.EARTH, 1);
  // the handle (arched)
  pm.contour(7, 3, [-1, -1, 4, 4], wicker); // a thin arch top
  pm.line(3, 6, 4, 4, wicker);
  pm.line(11, 6, 10, 4, wicker);
  pm.set(5, 3, wicker);
  pm.set(9, 3, wicker);
  pm.hline(5, 3, 5, wicker);
  // food poking out before the basket (so the lid sits over it)
  if (tier === 'family' || tier === 'feast') {
    pm.line(4, 6, 6, 3, px(RAMP.EARTH, 3)); // a baguette
    pm.ellipse(9, 5, 2, 2, px(RAMP.RED, 2)); // an apple
    pm.set(8, 4, px(RAMP.RED, 3));
  }
  if (tier === 'feast') {
    pm.line(5, 5, 7, 2, px(RAMP.SKIN, 2)); // a drumstick
    pm.set(7, 1, px(RAMP.PAPER, 3));
    pm.ellipse(11, 4, 1, 2, px(RAMP.PURPLE, 2)); // grapes
  }
  // the basket body
  pm.rect(2, 7, 11, 6, wicker);
  pm.hline(2, 7, 11, wickerL); // lit rim
  pm.hline(2, 12, 11, wickerD);
  // the weave
  for (let x = 3; x < 13; x += 2) pm.vline(x, 8, 4, wickerD);
  // the checkered cloth over the lip — the tier's signature color
  const check = tier === 'basic' ? RAMP.RED : tier === 'family' ? RAMP.GRASS : RAMP.GOLD;
  pm.set(3, 7, px(check, 2));
  pm.set(5, 7, px(check, 3));
  pm.set(7, 7, px(check, 2));
  pm.set(9, 7, px(check, 3));
  pm.set(11, 7, px(check, 2));
  pm.outline(C.outline);
  return pm;
}

/* ================================================================== */
/* KEY ITEMS */

/** the Star Locket: a gold oval on a chain, a star at its heart (§A4.9) */
function drawLocket(): Pixmap {
  const pm = new Pixmap(13, 14);
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  const goldD = px(RAMP.GOLD, 1);
  // the chain — a few links up to a clasp ring
  pm.set(6, 1, goldD);
  pm.set(5, 2, goldD);
  pm.set(7, 2, goldD);
  pm.set(6, 3, goldD);
  // the locket body
  pm.ellipse(6, 8, 4, 4, gold);
  pm.ellipse(6, 8, 3, 3, goldL);
  // the bail (where the chain meets it)
  pm.set(6, 4, gold);
  // the star at its heart — 1/10th of a Homesong lives inside
  pm.set(6, 6, px(RAMP.PAPER, 3));
  pm.set(5, 8, px(RAMP.PAPER, 3));
  pm.set(7, 8, px(RAMP.PAPER, 3));
  pm.set(6, 8, C.white);
  pm.set(6, 10, px(RAMP.PAPER, 3));
  pm.outline(C.outline);
  return pm;
}

/** the Jug: round body, narrow neck, a tiny hand-drawn flag makes it official */
function drawJug(): Pixmap {
  const pm = new Pixmap(13, 14);
  const jug = px(RAMP.PAPER, 2);
  const drink = px(RAMP.BLOND, 2);
  // the round body
  pm.ellipse(5, 9, 4, 4, jug);
  pm.ellipse(5, 9, 3, 3, drink); // the lemonade inside, through the glass
  pm.set(3, 7, px(RAMP.PAPER, 3)); // glass glint
  // the neck + lip
  pm.rect(4, 3, 3, 3, jug);
  pm.hline(4, 3, 3, px(RAMP.PAPER, 3));
  // the handle
  pm.line(9, 7, 10, 10, jug);
  pm.set(9, 6, jug);
  // the tiny flag — the official jug of the Lemonade Empire
  pm.vline(6, 1, 3, px(RAMP.EARTH, 2));
  pm.rect(7, 1, 3, 2, px(RAMP.RED, 2));
  pm.set(8, 1, px(RAMP.PAPER, 3));
  pm.outline(C.outline);
  return pm;
}

/** a camera: dark body, a big cyan lens, a small flash — the curator's loaner */
function drawCamera(): Pixmap {
  const pm = new Pixmap(14, 12);
  const body = px(RAMP.NIGHT, 2);
  const bodyL = px(RAMP.NIGHT, 3);
  // the body
  pm.rect(2, 4, 11, 7, body);
  pm.hline(2, 4, 11, bodyL); // lit top
  // the viewfinder hump + shutter
  pm.rect(3, 2, 3, 2, body);
  pm.set(10, 3, px(RAMP.RED, 2)); // the shutter button
  // the lens
  pm.ellipse(8, 7, 3, 3, px(RAMP.INK, 1));
  pm.ellipse(8, 7, 2, 2, px(RAMP.CYAN, 2));
  pm.set(7, 6, px(RAMP.CYAN, 3)); // glass glint
  // a small flash
  pm.rect(3, 6, 2, 2, px(RAMP.PAPER, 3));
  pm.outline(C.outline);
  return pm;
}

/* ---- S17 M20 (ADR-065) — THE FAR-WORLD CATALOG: the bespoke signature faces.
 *      The two funny kit sidegrades (a cobra-flute, a folded-paper fan) and the
 *      story-grade named keys (Train Ticket, Yak Treats, Spice Box, Scroll of
 *      Calm) are hand-drawn with love; the generic tail forges below. ---- */

/** the Cobra-Charmer's Flute (Ch.7 sidegrade): a brass been/pungi, a gourd bell,
 *  fingerholes, a curl of charmed sound rising */
function drawFluteIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  // the gourd wind-chamber, low-left
  pm.ellipse(4, 10, 3, 3, px(RAMP.EARTH, 2));
  pm.set(3, 9, px(RAMP.EARTH, 3));
  // the pipe climbing up-right
  pm.line(5, 8, 11, 2, brass);
  pm.line(6, 8, 12, 2, brassL);
  // the fingerholes
  pm.set(7, 6, C.outline);
  pm.set(8, 5, C.outline);
  pm.set(9, 4, C.outline);
  // the charmed note rising off the top
  pm.set(12, 1, px(RAMP.MAGENTA, 2));
  pm.set(13, 0, px(RAMP.MAGENTA, 3));
  pm.outline(C.outline);
  pm.set(12, 2, C.white); // a glint off the brass
  return pm;
}

/** the Folded-Paper Fan (Ch.8 boss-drop sidegrade): a rice-paper fan spread on
 *  lacquer-red ribs — the Paper Dragon's own last fold */
function drawFanIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const paper = px(RAMP.PAPER, 3);
  const rib = px(RAMP.RED, 2);
  const ribD = px(RAMP.RED, 1);
  // the fan blade — a quarter-circle opening up-right from a low pivot
  for (let i = 0; i <= 6; i++) {
    pm.line(4, 12, 4 + i, 12 - (i + 4), paper); // the paper leaves
  }
  // the lacquer ribs over the paper
  pm.line(4, 12, 4, 4, ribD);
  pm.line(4, 12, 7, 4, rib);
  pm.line(4, 12, 10, 6, rib);
  pm.line(4, 12, 11, 9, rib);
  // the pivot rivet
  pm.set(4, 12, px(RAMP.GOLD, 3));
  // the top arc edge
  pm.line(4, 4, 11, 9, rib);
  pm.outline(C.outline);
  return pm;
}

/** the Train Ticket, 3rd class (Ch.7 — §A8 key): a printed stub, a punched hole,
 *  a row of fare-class pips, torn along one perforated edge */
function drawTrainTicketIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const card = px(RAMP.BLOND, 3);
  const cardD = px(RAMP.BLOND, 1);
  // the stub body
  pm.rect(2, 2, 10, 8, card);
  pm.hline(2, 2, 10, px(RAMP.BLOND, 2));
  pm.frame(2, 2, 10, 8, px(RAMP.EARTH, 2));
  // a perforated tear down the right third
  for (let y = 2; y <= 9; y += 2) pm.set(9, y, cardD);
  // the printed bar + "3rd" pips (three dots, third class)
  pm.hline(3, 4, 4, px(RAMP.RED, 2));
  pm.set(3, 7, C.outline);
  pm.set(5, 7, C.outline);
  pm.set(7, 7, C.outline);
  // the conductor's punch hole
  pm.ellipse(11, 6, 1, 1, px(RAMP.EARTH, 1));
  pm.set(11, 6, C.outline);
  pm.outline(C.outline);
  return pm;
}

/** Yak Treats (Ch.8 — §A8 key): a little burlap feedbag of hay-cakes for the Yak
 *  Express, one cake poking out the cinched top */
function drawYakTreatsIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const burlap = px(RAMP.EARTH, 2);
  const burlapL = px(RAMP.EARTH, 3);
  // the cinched bag
  pm.rect(3, 6, 7, 7, burlap);
  pm.vline(3, 6, 7, burlapL);
  pm.hline(3, 12, 7, px(RAMP.EARTH, 1));
  pm.contour(6, 3, [1, 2, 3], burlap); // the gathered neck
  pm.hline(4, 5, 5, px(RAMP.RED, 2)); // the tie cord
  // the hay-cake poking out the top — golden, round
  pm.ellipse(6, 3, 2, 1, px(RAMP.BLOND, 2));
  pm.set(5, 3, px(RAMP.BLOND, 3));
  pm.set(7, 3, px(RAMP.GRASS, 2)); // a wisp of green hay
  // a burlap weave hint
  pm.set(5, 9, px(RAMP.EARTH, 1));
  pm.set(7, 10, px(RAMP.EARTH, 1));
  pm.outline(C.outline);
  return pm;
}

/** the Spice Box (Ch.7 — §A10 #15): a brass masala dabba, lid off, seven little
 *  bowls of colour inside — the seven spices of the bazaar hunt */
function drawSpiceBoxIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  // the round tin, seen from above
  pm.ellipse(7, 8, 6, 5, brass);
  pm.ellipse(7, 8, 5, 4, px(RAMP.GOLD, 1)); // the inner well
  pm.hline(2, 8, 11, brassL); // the lit front rim
  // six little spice bowls around a centre one — colours of the bazaar
  const bowls: Array<[number, number, number]> = [
    [7, 5, RAMP.ORANGE], [10, 7, RAMP.RED], [10, 10, RAMP.GOLD],
    [7, 11, RAMP.FOREST], [4, 10, RAMP.EARTH], [4, 7, RAMP.MAGENTA],
    [7, 8, RAMP.PURPLE],
  ];
  for (const [x, y, c] of bowls) {
    pm.set(x, y, px(c, 2));
    pm.set(x, y - 1, px(c, 3));
  }
  pm.outline(C.outline);
  return pm;
}

/** the Scroll of Calm (Ch.8 — §A10 #17, cures Mushroomize, canonically reusable):
 *  a rice-paper scroll on lacquer rollers, a single calm brush-stroke of ink */
function drawScrollIcon(): Pixmap {
  const pm = new Pixmap(14, 13);
  const paper = px(RAMP.PAPER, 3);
  const paperD = px(RAMP.PAPER, 1);
  const roller = px(RAMP.RED, 2);
  // the two lacquer rollers, top and bottom
  pm.rect(2, 2, 10, 2, roller);
  pm.rect(2, 9, 10, 2, roller);
  pm.set(1, 2, px(RAMP.GOLD, 2)); // the roller knobs
  pm.set(12, 2, px(RAMP.GOLD, 2));
  pm.set(1, 9, px(RAMP.GOLD, 2));
  pm.set(12, 9, px(RAMP.GOLD, 2));
  // the open paper field
  pm.rect(2, 4, 10, 5, paper);
  pm.hline(2, 8, 10, paperD);
  // one calm brush-stroke — a single grounding line of ink
  pm.line(4, 6, 9, 5, C.inkSoft);
  pm.set(10, 5, C.outline); // the stroke's settled end
  pm.set(5, 7, C.inkSoft); // a small seal mark
  pm.outline(C.outline);
  return pm;
}

/* ---- S17 M21 (ADR-091) — THE LAST-WORLD CATALOG: the bespoke signature faces.
 *      The hero weapon TOPS that CLOSE the §A8 ladders (Mia's Holy Pan, Jay's
 *      Casey's Last Swing, Dorin's Comet Bead) + the funny Board of Legends; the
 *      story-grade named keys (the Monastery Bell Clapper, the Rocket Manifest);
 *      the prayer-tier Hallelujah Bell; and — with the most love of all — THE
 *      PLAYER'S HOUSE KEY, the LAST item in the game. Hand-drawn; the tail forges. ---- */

/** The Holy Pan (Mia's §A8 TOP — Stone Brow's three-night blessing): the §A3 disc
 *  in silver-white, a thin gold halo floating above it. Sincere, not gaudy. */
function drawHolyPanIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const iron = px(RAMP.PAPER, 2);
  const ironL = px(RAMP.PAPER, 3);
  const handle = px(RAMP.EARTH, 2);
  // the disc, set a little low to leave room for the halo
  pm.ellipse(6, 9, 4, 4, iron);
  pm.ellipse(6, 9, 3, 2, ironL); // the cooking face, lit
  // handle up-right
  pm.line(9, 7, 12, 4, handle);
  pm.line(10, 7, 13, 4, handle);
  // the halo — a thin gold ring floating above
  pm.ellipse(6, 3, 4, 1, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  pm.set(4, 7, C.white); // a blessed gleam
  return pm;
}

/** the Candelabra (COUNT HOAXULA's boss-drop, a Jay bat sidegrade): a brass
 *  three-arm candle holder, flames lit — the prop he menaced with, now yours */
function drawCandelabraIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  // base + stem
  pm.rect(5, 12, 4, 1, brass);
  pm.vline(6, 6, 6, brass);
  pm.vline(7, 6, 6, brassL);
  // the two outer arms
  pm.line(6, 8, 2, 6, brass);
  pm.line(7, 8, 11, 6, brass);
  // candle cups, wax, and flames (three)
  for (const cx of [2, 6, 11]) {
    pm.set(cx, 5, px(RAMP.PAPER, 3)); // wax
    pm.set(cx, 4, px(RAMP.ORANGE, 3)); // flame body
  }
  pm.outline(C.outline);
  for (const cx of [2, 6, 11]) pm.set(cx, 3, C.white); // flame tips, pure light after the contour
  return pm;
}

/** the Monastery Bell Clapper (§A8 key — Stone Brow's resonance site): the great
 *  iron tongue of the bell, a hanging loop, a heavy striking ball worn shiny */
function drawBellClapperIcon(): Pixmap {
  const pm = new Pixmap(12, 14);
  const iron = px(RAMP.INK, 2);
  const ironL = px(RAMP.INK, 3);
  // the hanging loop up top
  pm.ellipse(6, 2, 2, 2, iron);
  pm.set(6, 2, T); // hollow it
  // the shaft
  pm.vline(6, 4, 6, iron);
  pm.vline(7, 4, 6, ironL);
  // the heavy striking ball
  pm.ellipse(6, 11, 3, 3, iron);
  pm.set(5, 10, ironL); // worn shine where it strikes the bell
  pm.outline(C.outline);
  pm.set(5, 10, C.white);
  return pm;
}

/** the Board of Legends (§A10 #20 — Jay's funniest sidegrade): a surf longboard
 *  laid corner-to-corner, a centre stringer stripe, a dark fin at the tail */
function drawSurfboardIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const deck = px(RAMP.CYAN, 2);
  const deckL = px(RAMP.CYAN, 3);
  // the board — long and pointed, low-left tail to high-right nose
  pm.line(2, 12, 11, 3, deck);
  pm.line(3, 12, 12, 3, deck);
  pm.line(2, 11, 11, 2, deckL); // lit upper rail
  pm.set(12, 2, deckL); // the nose
  // the stringer down the middle
  pm.line(3, 11, 11, 3, px(RAMP.RED, 2));
  // the fin near the tail
  pm.set(3, 13, px(RAMP.NIGHT, 2));
  pm.set(4, 13, px(RAMP.NIGHT, 2));
  pm.outline(C.outline);
  pm.set(11, 3, C.white); // sun off the nose
  return pm;
}

/** the Rocket Manifest (§A8 key — Pemberton's parts list): a clipboard, a tiny
 *  rocket sketch, ruled lines, one green check */
function drawRocketManifestIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const board = px(RAMP.EARTH, 2);
  const paper = px(RAMP.PAPER, 3);
  // the clipboard + paper
  pm.rect(2, 2, 9, 11, board);
  pm.rect(3, 3, 7, 9, paper);
  pm.rect(5, 1, 3, 2, px(RAMP.GOLD, 2)); // the clip
  // a tiny rocket sketch, left column
  pm.vline(5, 5, 3, px(RAMP.RED, 2));
  pm.set(5, 4, px(RAMP.RED, 3)); // nose
  pm.set(4, 8, px(RAMP.ORANGE, 3)); // flame
  // ruled list lines + a green check, right column
  pm.hline(7, 5, 2, C.inkSoft);
  pm.hline(7, 7, 2, C.inkSoft);
  pm.set(7, 10, px(RAMP.GRASS, 2));
  pm.set(8, 9, px(RAMP.GRASS, 2));
  pm.outline(C.outline);
  return pm;
}

/** Casey's Last Swing (Jay's §A8 TOP — the Ch.10 drop): a plain worn ash bat with
 *  a single gold star burned near the barrel. "There is no joy in Mudville." */
function drawCaseysBatIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const wood = px(RAMP.BLOND, 2);
  const woodL = px(RAMP.BLOND, 3);
  const woodD = px(RAMP.EARTH, 1);
  // knob
  pm.rect(2, 11, 2, 2, woodD);
  // shaft → barrel, corner to corner
  pm.line(3, 11, 10, 4, wood);
  pm.line(4, 11, 11, 4, wood);
  pm.line(3, 10, 10, 3, woodL); // lit upper edge
  // the fat tip
  pm.rect(10, 2, 3, 3, wood);
  pm.set(10, 2, woodL);
  // the one gold star
  pm.set(8, 6, px(RAMP.GOLD, 3));
  pm.set(7, 7, px(RAMP.GOLD, 3));
  pm.set(8, 7, px(RAMP.GOLD, 2));
  pm.set(9, 7, px(RAMP.GOLD, 3));
  pm.set(8, 8, px(RAMP.GOLD, 3));
  pm.outline(C.outline);
  pm.set(11, 3, C.white);
  return pm;
}

/** Comet Bead (Dorin's §A8 TOP — the 1/128 Null Walker drop): the bead loop with a
 *  single fallen-star focal bead trailing a comet's tail */
function drawCometBeadIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const bead = px(RAMP.PURPLE, 2);
  const beadL = px(RAMP.PURPLE, 3);
  const at: Array<[number, number]> = [
    [5, 2], [8, 3], [10, 6], [9, 9], [6, 10], [3, 8], [3, 5],
  ];
  for (const [x, y] of at) {
    pm.rect(x, y, 2, 2, bead);
    pm.set(x, y, beadL);
  }
  // the comet focal bead trailing a tail down-right
  pm.set(7, 12, px(RAMP.GOLD, 3));
  pm.set(8, 12, px(RAMP.PAPER, 3));
  pm.line(9, 12, 12, 13, px(RAMP.CYAN, 2)); // the tail
  pm.outline(C.outline);
  pm.set(7, 12, C.white); // the comet head — pure light after the contour
  return pm;
}

/** the Hallelujah Bell (§A4.12 revival TOP — full revive): a small gold handbell
 *  ringing one clear note even in the silence; the note radiates as pure light */
function drawHallelujahBellIcon(): Pixmap {
  const pm = new Pixmap(13, 14);
  const gold = px(RAMP.GOLD, 2);
  const goldL = px(RAMP.GOLD, 3);
  // the handle
  pm.vline(6, 1, 2, px(RAMP.EARTH, 2));
  pm.set(6, 1, px(RAMP.EARTH, 3));
  // the bell dome
  pm.contour(6, 3, [1, 2, 3, 4, 4], gold);
  pm.hline(2, 8, 9, goldL); // the mouth rim
  pm.hline(2, 9, 9, px(RAMP.GOLD, 1));
  pm.set(6, 10, px(RAMP.EARTH, 2)); // the clapper peeking
  pm.outline(C.outline);
  // the one clear note, radiating — pure light after the contour (ADR-020)
  pm.set(4, 4, C.white);
  pm.set(1, 3, C.white);
  pm.set(11, 3, C.white);
  pm.set(0, 6, C.white);
  pm.set(12, 6, C.white);
  return pm;
}

/** THE PLAYER'S HOUSE KEY (§A8 — the LAST item in the game). A worn brass key with
 *  a little house-shaped bow and a warm gleam: the post-credits walk home, in one
 *  small object. Given the most love of all. */
function drawHouseKeyIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const brass = px(RAMP.GOLD, 2);
  const brassL = px(RAMP.GOLD, 3);
  const brassD = px(RAMP.GOLD, 1);
  // the bow, shaped like a little house — a square body under a peaked roof
  pm.rect(2, 5, 5, 5, brass);
  pm.contour(4, 2, [1, 2, 3], brass); // the roof
  pm.set(4, 4, C.outline); // the ring-hole through the house, where it hangs by the Locket
  pm.set(4, 7, brassD); // a tiny door
  pm.set(4, 8, brassD);
  // the shaft running right
  pm.rect(7, 7, 6, 2, brass);
  pm.hline(7, 7, 6, brassL); // the lit top of the shaft
  // the bit (the teeth that open the one door that matters)
  pm.set(10, 9, brass);
  pm.set(12, 9, brass);
  pm.outline(C.outline);
  pm.set(3, 6, C.white); // a warm gleam — almost over; almost home
  return pm;
}

/* ================================================================== */
/* THE REGISTRY — every §A8 item, both directions enforced.            */

/** held-weapon + torso-armor + every non-equippable icon, drawn fresh here */
const FRESH_ICONS: Record<string, () => Pixmap> = {
  // held weapons (the swing lives in WEAPON_ART; this is the menu face)
  cracked_bat: () => drawBatIcon(RAMP.EARTH, 'crack'),
  tball_bat: () => drawBatIcon(RAMP.BLOND, 'ring'),
  sandlot_slugger: () => drawBatIcon(RAMP.ORANGE, 'carve'),
  hand_me_down_pan: () => drawPanIcon(RAMP.INK, false),
  copper_pan: () => drawPanIcon(RAMP.ORANGE, true),
  pellet_popper: () => drawRifleIcon(RAMP.EARTH, 'tip'),
  cedar_beads: () => drawBeadsIcon(),
  // torso armor (composes on the battler via WEAPON_ART; this is the menu face)
  champion_jacket: () => drawJacketIcon(),
  wool_poncho: () => drawPonchoIcon(),
  // food
  corn_dog: () => drawCornDog(),
  pbj: () => drawPbj(),
  lemonade: () => drawLemonade(),
  alfajor: () => drawAlfajor(),
  // pp drink
  star_cola: () => drawCola(),
  // cures
  glints_spark: () => drawSpark(),
  aloe_leaf: () => drawAloe(),
  hanky: () => drawHanky(),
  // battle items
  salt_shaker: () => drawSalt(),
  camera_flash: () => drawFlash(),
  // valuables
  fresh_stamps: () => drawStamps(),
  sugar_bag: () => drawSugar(),
  lemon_crate: () => drawLemonCrate(),
  // picnic baskets
  basket_basic: () => drawBasket('basic'),
  basket_family: () => drawBasket('family'),
  basket_feast: () => drawBasket('feast'),
  // key items
  star_locket: () => drawLocket(),
  lemonade_jug: () => drawJug(),
  camera: () => drawCamera(),

  /* ============ S17 M18 (ADR-063) — THE AMERICAS CATALOG ============
   * The generic long tail is forged (ADR-062): ONE line each — subcat × band ×
   * detail × the item id as seed. The both-directions gate + the distinctness
   * test (icons.test.ts) keep every face honest; where a same-subcat sibling
   * risked a collision, the detail layer pulls them apart. Signatures (the
   * weapon sidegrades, the §A8 SETS) stay hand-drawn — the bats/pans reuse
   * drawBatIcon/drawPanIcon here; the SET charms ride their WEAPON_ART trinket. */

  /* ---- Ch.1 USA — weapon sidegrades (reuse the bat/pan menu faces) ---- */
  foam_finger: () => drawBatIcon(RAMP.RED, 'carve'),
  wiffle_bat: () => drawBatIcon(RAMP.PAPER, 'ring'),
  nonstick_pan: () => drawPanIcon(RAMP.NIGHT, false),
  /* ---- Ch.1 USA — armor (the hat-ladder head) ---- */
  otterbrook_cap: () => forgeIcon({ subcat: 'hat', band: 'ch1', detail: 'stripe', seed: 'otterbrook_cap' }),
  /* ---- Ch.1 USA — foods / drinks / cures / tonic / battle / valuable ---- */
  grilled_cheese: () => forgeIcon({ subcat: 'sandwich', band: 'ch1', detail: 'bite', seed: 'grilled_cheese' }),
  apple_pie_slice: () => forgeIcon({ subcat: 'wedge', band: 'ch1', detail: 'steam', seed: 'apple_pie_slice' }),
  choco_comet_bar: () => forgeIcon({ subcat: 'bar', band: 'ch1', detail: 'wrapper', seed: 'choco_comet_bar' }),
  bug_juice: () => forgeIcon({ subcat: 'bottle', band: 'ch1', detail: 'cork', seed: 'bug_juice' }),
  diet_star_cola: () => forgeIcon({ subcat: 'can', band: 'ch1', detail: 'label', seed: 'diet_star_cola' }),
  moms_voice_tape: () => forgeIcon({ subcat: 'tape', band: 'ch1', detail: ['label', 'dots'], seed: 'moms_voice_tape' }),
  second_wind: () => forgeIcon({ subcat: 'vial', band: 'ch1', detail: 'star', seed: 'second_wind' }),
  sudden_guts_pill: () => forgeIcon({ subcat: 'pill', band: 'ch1', seed: 'sudden_guts_pill' }),
  bug_zapper: () => forgeIcon({ subcat: 'zapper', band: 'ch1', detail: 'tag', seed: 'bug_zapper' }),
  spare_hubcap: () => forgeIcon({ subcat: 'hubcap', band: 'ch1', detail: 'crack', seed: 'spare_hubcap' }),

  /* ---- Ch.2 South America — armor (chullo / cushma / alpaca vest) ---- */
  chullo: () => forgeIcon({ subcat: 'hat', band: 'ch2', detail: 'dots', seed: 'chullo' }),
  cushma: () => forgeIcon({ subcat: 'garment', band: 'ch2', detail: 'stripe', seed: 'cushma' }),
  alpaca_vest: () => forgeIcon({ subcat: 'garment', band: 'ch2', detail: 'dots', seed: 'alpaca_vest' }),
  /* ---- Ch.2 South America — foods ---- */
  empanada: () => forgeIcon({ subcat: 'pastry', band: 'ch2', detail: 'bite', seed: 'empanada' }),
  ceviche: () => forgeIcon({ subcat: 'bowl', band: 'ch2', detail: 'dots', seed: 'ceviche' }),
  choripan: () => forgeIcon({ subcat: 'sandwich', band: 'ch2', detail: 'stripe', seed: 'choripan' }),
  tres_leches: () => forgeIcon({ subcat: 'wedge', band: 'ch2', detail: 'dots', seed: 'tres_leches' }),
  mango: () => forgeIcon({ subcat: 'fruit', band: 'ch2', detail: 'sprout', seed: 'mango' }),
  arepa: () => forgeIcon({ subcat: 'loaf', band: 'ch2', detail: 'dots', seed: 'arepa' }),
  humita: () => forgeIcon({ subcat: 'loaf', band: 'ch2', detail: 'steam', seed: 'humita' }),
  chicha_morada: () => forgeIcon({ subcat: 'cup_cold', band: 'ch2', accent: RAMP.PURPLE, seed: 'chicha_morada' }),
  /* ---- Ch.2 South America — drinks / cures / tonic ---- */
  mate_gourd: () => forgeIcon({ subcat: 'teacup', band: 'ch2', detail: 'steam', seed: 'mate_gourd' }),
  jungle_fizz: () => forgeIcon({ subcat: 'bottle', band: 'ch2', detail: 'cork', seed: 'jungle_fizz' }),
  guardian_angel_feather: () => forgeIcon({ subcat: 'feather', band: 'ch2', seed: 'guardian_angel_feather' }),
  unknot_drops: () => forgeIcon({ subcat: 'vial', band: 'ch2', detail: 'cap', seed: 'unknot_drops' }),
  speed_demon_soda: () => forgeIcon({ subcat: 'can', band: 'ch2', detail: 'flame', seed: 'speed_demon_soda' }),
  /* ---- Ch.2 South America — valuables ---- */
  fools_gold_idol: () => forgeIcon({ subcat: 'idol', band: 'ch2', detail: 'crack', seed: 'fools_gold_idol' }),
  emerald: () => forgeIcon({ subcat: 'gem', band: 'ch2', ramp: RAMP.GRASS, seed: 'emerald' }),
  gold_doubloon: () => forgeIcon({ subcat: 'coin', band: 'ch2', seed: 'gold_doubloon' }),
  /* ---- Ch.2 South America — keys ---- */
  banana_boat_ticket: () => forgeIcon({ subcat: 'ticket', band: 'ch2', seed: 'banana_boat_ticket' }),
  wish_token: () => forgeIcon({ subcat: 'coin', band: 'ch2', detail: 'star', seed: 'wish_token' }),

  /* ============ S17 M19 (ADR-064) — THE OLD-WORLD CATALOG ============
   * Ch.3 England · Ch.4 Norway · Ch.5 Minimus. The generic tail is forged (one
   * line: subcat × band × detail × the id as seed); the hero weapon rungs (incl.
   * the boss-drop tops) and named key items stay hand-drawn signatures. The
   * both-directions gate + the distinctness sweep (icons.test.ts) keep every face
   * honest — where a same-subcat sibling risked a collision, the detail pulls it
   * apart. England reads damp-grey/brass/tea; the rifles climb one silhouette. */

  /* ---- Ch.3 ENGLAND — Milo's gun ladder (bespoke) + the cricket-bat sidegrade ---- */
  spud_gun: () => drawRifleIcon(RAMP.NIGHT, 'spud'),
  double_barrel_sparker: () => drawRifleIcon(RAMP.INK, 'double'),
  gauss_lobber: () => drawRifleIcon(RAMP.BLUE, 'gauss'),
  cricket_bat: () => drawBatIcon(RAMP.BLOND, 'carve'),
  /* ---- Ch.3 — tea (PP), foods, cures, tonics, battle, valuables, keys (forged) ---- */
  builders_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch3', detail: 'steam', seed: 'builders_tea' }),
  earl_grey: () => forgeIcon({ subcat: 'teacup', band: 'ch3', detail: 'stripe', seed: 'earl_grey' }),
  school_cocoa: () => forgeIcon({ subcat: 'teacup', band: 'ch3', detail: 'dots', seed: 'school_cocoa' }),
  scone_clotted_cream: () => forgeIcon({ subcat: 'pastry', band: 'ch3', detail: 'dots', seed: 'scone_clotted_cream' }),
  crumpet: () => forgeIcon({ subcat: 'loaf', band: 'ch3', detail: 'steam', seed: 'crumpet' }),
  fish_and_chips: () => forgeIcon({ subcat: 'bowl', band: 'ch3', detail: 'stripe', seed: 'fish_and_chips' }),
  bangers_and_mash: () => forgeIcon({ subcat: 'plate', band: 'ch3', detail: 'steam', seed: 'bangers_and_mash' }),
  canteen_stodge: () => forgeIcon({ subcat: 'plate', band: 'ch3', detail: 'dots', seed: 'canteen_stodge' }),
  sticky_toffee_pudding: () => forgeIcon({ subcat: 'wedge', band: 'ch3', detail: 'steam', seed: 'sticky_toffee_pudding' }),
  cucumber_sandwich: () => forgeIcon({ subcat: 'sandwich', band: 'ch3', detail: 'stripe', seed: 'cucumber_sandwich' }),
  pork_pie: () => forgeIcon({ subcat: 'pastry', band: 'ch3', detail: 'bite', seed: 'pork_pie' }),
  treacle_tart: () => forgeIcon({ subcat: 'wedge', band: 'ch3', detail: 'dots', seed: 'treacle_tart' }),
  marmite_toast: () => forgeIcon({ subcat: 'sandwich', band: 'ch3', detail: 'dots', seed: 'marmite_toast' }),
  eccles_cake: () => forgeIcon({ subcat: 'pastry', band: 'ch3', detail: 'wrapper', seed: 'eccles_cake' }),
  honey_lozenge: () => forgeIcon({ subcat: 'vial', band: 'ch3', detail: 'dots', seed: 'honey_lozenge' }),
  eye_drops: () => forgeIcon({ subcat: 'vial', band: 'ch3', detail: 'cap', seed: 'eye_drops' }),
  iron_tonic: () => forgeIcon({ subcat: 'capsule', band: 'ch3', detail: 'stripe', seed: 'iron_tonic' }),
  brain_food_lunch: () => forgeIcon({ subcat: 'lunchbox', band: 'ch3', detail: 'label', seed: 'brain_food_lunch' }),
  spark_coil: () => forgeIcon({ subcat: 'zapper', band: 'ch3', detail: 'fuse', seed: 'spark_coil' }),
  defibrillator: () => forgeIcon({ subcat: 'zapper', band: 'ch3', detail: 'star', seed: 'defibrillator' }),
  cog_grenade: () => forgeIcon({ subcat: 'bomb', band: 'ch3', detail: 'fuse', seed: 'cog_grenade' }),
  clockwork_sparrow: () => forgeIcon({ subcat: 'firework', band: 'ch3', detail: 'star', seed: 'clockwork_sparrow' }),
  broken_gizmo: () => forgeIcon({ subcat: 'hubcap', band: 'ch3', detail: 'crack', seed: 'broken_gizmo' }),
  first_edition: () => forgeIcon({ subcat: 'book', band: 'ch3', detail: 'tag', seed: 'first_edition' }),
  commemorative_tin: () => forgeIcon({ subcat: 'wax_tin', band: 'ch3', detail: 'label', seed: 'commemorative_tin' }),
  lucilles_propeller: () => drawPropellerIcon(),
  library_card: () => forgeIcon({ subcat: 'card', band: 'ch3', detail: 'stripe', seed: 'library_card' }),
  thermos: () => forgeIcon({ subcat: 'bottle', band: 'ch3', detail: 'cap', seed: 'thermos' }),
  /* ---- Ch.3 — armor menu faces (the swing/dress lives in WEAPON_ART torso) ---- */
  cricket_cap: () => forgeIcon({ subcat: 'hat', band: 'ch3', detail: 'stripe', seed: 'cricket_cap' }),
  school_blazer: () => forgeIcon({ subcat: 'garment', band: 'ch3', detail: 'stripe', seed: 'school_blazer' }),
  tweed_waistcoat: () => forgeIcon({ subcat: 'garment', band: 'ch3', detail: 'dots', seed: 'tweed_waistcoat' }),
  oilcloth_mac: () => forgeIcon({ subcat: 'garment', band: 'ch3', detail: 'cap', seed: 'oilcloth_mac' }),

  /* ---- Ch.4 NORWAY — sidegrades (bat/pan), the cold-blue fishing-hamlet tail.
     Cold-blue, birch, deep pine; the scale gag lives in the words, not the px. ---- */
  frozen_cod: () => drawBatIcon(RAMP.CYAN, 'ring'),
  lefse_griddle: () => drawPanIcon(RAMP.EARTH, false),
  cloudberry_cordial: () => forgeIcon({ subcat: 'bottle', band: 'ch4', detail: 'cork', seed: 'cloudberry_cordial' }),
  birch_sap: () => forgeIcon({ subcat: 'bottle', band: 'ch4', detail: 'label', seed: 'birch_sap' }),
  gjende_coffee: () => forgeIcon({ subcat: 'can', band: 'ch4', detail: 'steam', seed: 'gjende_coffee' }),
  brunost: () => forgeIcon({ subcat: 'wedge', band: 'ch4', detail: 'stripe', seed: 'brunost' }),
  fiskeboller: () => forgeIcon({ subcat: 'bowl', band: 'ch4', detail: 'steam', seed: 'fiskeboller' }),
  lutefisk: () => forgeIcon({ subcat: 'plate', band: 'ch4', detail: 'dots', seed: 'lutefisk' }),
  lefse: () => forgeIcon({ subcat: 'loaf', band: 'ch4', detail: 'stripe', seed: 'lefse' }),
  multekrem: () => forgeIcon({ subcat: 'bowl', band: 'ch4', detail: 'dots', seed: 'multekrem' }),
  rommegrot: () => forgeIcon({ subcat: 'plate', band: 'ch4', detail: 'steam', seed: 'rommegrot' }),
  farikal: () => forgeIcon({ subcat: 'plate', band: 'ch4', detail: 'stripe', seed: 'farikal' }),
  knekkebrod: () => forgeIcon({ subcat: 'bar', band: 'ch4', detail: 'dots', seed: 'knekkebrod' }),
  dog_sized_berry: () => forgeIcon({ subcat: 'fruit', band: 'ch4', detail: 'sprout', seed: 'dog_sized_berry' }),
  smoked_salmon: () => forgeIcon({ subcat: 'wedge', band: 'ch4', detail: 'bite', seed: 'smoked_salmon' }),
  vafler: () => forgeIcon({ subcat: 'pastry', band: 'ch4', detail: 'dots', seed: 'vafler' }),
  pickled_herring: () => forgeIcon({ subcat: 'bowl', band: 'ch4', detail: 'stripe', seed: 'pickled_herring' }),
  kransekake: () => forgeIcon({ subcat: 'pastry', band: 'ch4', detail: 'ribbon', seed: 'kransekake' }),
  salve_of_arnica: () => forgeIcon({ subcat: 'wax_tin', band: 'ch4', detail: 'dots', seed: 'salve_of_arnica' }),
  smelling_salts: () => forgeIcon({ subcat: 'vial', band: 'ch4', detail: 'cork', seed: 'smelling_salts' }),
  growth_spurt_milk: () => forgeIcon({ subcat: 'carton', band: 'ch4', detail: 'label', seed: 'growth_spurt_milk' }),
  cod_liver_oil: () => forgeIcon({ subcat: 'bottle', band: 'ch4', detail: 'cap', seed: 'cod_liver_oil' }),
  firecracker_string: () => forgeIcon({ subcat: 'string', band: 'ch4', seed: 'firecracker_string' }),
  snowball_special: () => forgeIcon({ subcat: 'bomb', band: 'ch4', ramp: RAMP.CYAN, seed: 'snowball_special' }),
  giants_banknote: () => forgeIcon({ subcat: 'banknote', band: 'ch4', detail: 'label', seed: 'giants_banknote' }),
  amber_chunk: () => forgeIcon({ subcat: 'gem', band: 'ch4', ramp: RAMP.GOLD, seed: 'amber_chunk' }),
  silver_hoard: () => forgeIcon({ subcat: 'sack', band: 'ch4', detail: 'dots', seed: 'silver_hoard' }),
  stockfish_bundle: () => forgeIcon({ subcat: 'crate', band: 'ch4', seed: 'stockfish_bundle' }),
  brass_ships_bell: () => forgeIcon({ subcat: 'bell', band: 'ch4', detail: 'star', seed: 'brass_ships_bell' }),
  sigrids_monocle: () => drawMonocleIcon(),
  halvors_letter: () => forgeIcon({ subcat: 'note', band: 'ch4', detail: 'ribbon', seed: 'halvors_letter' }),
  /* ---- Ch.4 — armor menu faces ---- */
  fur_lined_hood: () => forgeIcon({ subcat: 'hat', band: 'ch4', detail: 'dots', seed: 'fur_lined_hood' }),
  wool_sweater: () => forgeIcon({ subcat: 'garment', band: 'ch4', detail: 'dots', seed: 'wool_sweater' }),
  oilskin_slicker: () => forgeIcon({ subcat: 'garment', band: 'ch4', detail: ['cap', 'dots'], seed: 'oilskin_slicker' }),
  troll_hide_vest: () => forgeIcon({ subcat: 'garment', band: 'ch4', detail: 'stripe', seed: 'troll_hide_vest' }),

  /* ---- Ch.5 MINIMUS — Pippa's KIT LADDER + named keys (bespoke); the jewel-box
     tail forged in purple/magenta/gold. Tiny in fiction, normal in the bag. ---- */
  stamp_sling: () => drawStampSlingIcon(),
  needle_saber: () => drawNeedleSaberIcon(),
  thimble_bell: () => drawThimbleBellIcon(),
  royal_red_pen: () => drawRedPenIcon(),
  acorn_cup_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch5', detail: 'steam', seed: 'acorn_cup_tea' }),
  nectar_thimble: () => forgeIcon({ subcat: 'teacup', band: 'ch5', detail: 'dots', seed: 'nectar_thimble' }),
  dewdrop_cordial: () => forgeIcon({ subcat: 'bottle', band: 'ch5', detail: 'cork', seed: 'dewdrop_cordial' }),
  mint_julep_drop: () => forgeIcon({ subcat: 'bottle', band: 'ch5', detail: 'label', seed: 'mint_julep_drop' }),
  crumb_loaf: () => forgeIcon({ subcat: 'loaf', band: 'ch5', detail: 'dots', seed: 'crumb_loaf' }),
  petit_four: () => forgeIcon({ subcat: 'bar', band: 'ch5', detail: 'ribbon', seed: 'petit_four' }),
  seed_pie: () => forgeIcon({ subcat: 'wedge', band: 'ch5', detail: 'dots', seed: 'seed_pie' }),
  honey_drop: () => forgeIcon({ subcat: 'fruit', band: 'ch5', detail: 'star', seed: 'honey_drop' }),
  ribbon_candy: () => forgeIcon({ subcat: 'bar', band: 'ch5', detail: 'wrapper', seed: 'ribbon_candy' }),
  royal_tartlet: () => forgeIcon({ subcat: 'pastry', band: 'ch5', detail: 'dots', seed: 'royal_tartlet' }),
  cheese_sliver: () => forgeIcon({ subcat: 'wedge', band: 'ch5', detail: 'stripe', seed: 'cheese_sliver' }),
  teaspoon_stew: () => forgeIcon({ subcat: 'plate', band: 'ch5', detail: 'steam', seed: 'teaspoon_stew' }),
  marzipan_pig: () => forgeIcon({ subcat: 'fruit', band: 'ch5', detail: 'dots', seed: 'marzipan_pig' }),
  sugared_violet: () => forgeIcon({ subcat: 'pastry', band: 'ch5', detail: 'star', seed: 'sugared_violet' }),
  powder_wig_dust: () => forgeIcon({ subcat: 'pouch', band: 'ch5', detail: 'dots', seed: 'powder_wig_dust' }),
  smelling_bouquet: () => forgeIcon({ subcat: 'vial', band: 'ch5', detail: 'ribbon', seed: 'smelling_bouquet' }),
  lucky_penny_tonic: () => forgeIcon({ subcat: 'coin', band: 'ch5', ramp: RAMP.PURPLE, detail: 'star', seed: 'lucky_penny_tonic' }),
  charged_battery: () => forgeIcon({ subcat: 'battery', band: 'ch5', detail: 'star', seed: 'charged_battery' }),
  tin_soldier: () => forgeIcon({ subcat: 'firework', band: 'ch5', detail: 'cap', seed: 'tin_soldier' }),
  confetti_cannon: () => forgeIcon({ subcat: 'firework', band: 'ch5', detail: 'star', seed: 'confetti_cannon' }),
  crown_jewel_chip: () => forgeIcon({ subcat: 'gem', band: 'ch5', tint: RAMP.MAGENTA, seed: 'crown_jewel_chip' }),
  census_ledger: () => forgeIcon({ subcat: 'book', band: 'ch5', detail: 'stripe', seed: 'census_ledger' }),
  royal_doubloon_tiny: () => forgeIcon({ subcat: 'coin', band: 'ch5', detail: 'dots', seed: 'royal_doubloon_tiny' }),
  gilt_thimble_collection: () => forgeIcon({ subcat: 'wax_tin', band: 'ch5', detail: 'star', seed: 'gilt_thimble_collection' }),
  royal_thimble: () => drawRoyalThimbleIcon(),
  big_little_lens: () => drawBigLittleLensIcon(),
  procession_pass: () => forgeIcon({ subcat: 'ticket', band: 'ch5', detail: 'ribbon', seed: 'procession_pass' }),
  /* ---- Ch.5 — armor menu faces ---- */
  paper_crown: () => forgeIcon({ subcat: 'hat', band: 'ch5', detail: 'star', seed: 'paper_crown' }),
  velvet_doublet: () => forgeIcon({ subcat: 'garment', band: 'ch5', detail: 'stripe', seed: 'velvet_doublet' }),
  herald_tabard: () => forgeIcon({ subcat: 'garment', band: 'ch5', detail: 'dots', seed: 'herald_tabard' }),
  ermine_cape: () => forgeIcon({ subcat: 'garment', band: 'ch5', detail: 'ribbon', seed: 'ermine_cape' }),

  /* ---- CROSS-WORLD — THE LOST & FOUND OF IMPOSSIBLE SIZES (§A10) ---- */
  giant_button: () => forgeIcon({ subcat: 'hubcap', band: 'cross', detail: 'dots', seed: 'giant_button' }),
  impossible_berry: () => forgeIcon({ subcat: 'fruit', band: 'cross', detail: 'sprout', seed: 'impossible_berry' }),
  tiny_postcard: () => forgeIcon({ subcat: 'stamp', band: 'cross', detail: 'label', seed: 'tiny_postcard' }),

  /* ============ S17 M20 (ADR-065) — THE FAR-WORLD CATALOG ============
   * Ch.6 Africa · Ch.7 India · Ch.8 China. The hero weapon rungs reuse the
   * bat/pan/beads silhouettes (ramp + mark); the two kit sidegrades + the named
   * keys are bespoke (above); the long tail forges one line each. Savanna ochre/
   * indigo (ch6) · bazaar spice/jewel (ch7) · jade/lacquer-red/rice-paper (ch8). */

  /* ---- FAR-WORLD weapon menu faces (the swing lives in WEAPON_ART) ---- */
  aluminum_bat: () => drawBatIcon(RAMP.PAPER, 'carve'),
  hall_of_famer_bat: () => drawBatIcon(RAMP.GOLD, 'carve'),
  cast_iron_pan: () => drawPanIcon(RAMP.INK, true),
  chefs_pan: () => drawPanIcon(RAMP.GOLD, true),
  river_beads: () => drawBeadsIcon(RAMP.BLUE),
  cobra_flute: () => drawFluteIcon(),
  paper_fan: () => drawFanIcon(),

  /* ---- Ch.6 AFRICA — armor menu faces (Turban of Calm rung + savanna bodies) ---- */
  turban_of_calm: () => forgeIcon({ subcat: 'hat', band: 'ch6', detail: 'stripe', seed: 'turban_of_calm' }),
  kanga_wrap: () => forgeIcon({ subcat: 'garment', band: 'ch6', detail: 'stripe', seed: 'kanga_wrap' }),
  savanna_cloak: () => forgeIcon({ subcat: 'garment', band: 'ch6', detail: 'dots', seed: 'savanna_cloak' }),
  mudcloth_vest: () => forgeIcon({ subcat: 'garment', band: 'ch6', detail: 'cap', seed: 'mudcloth_vest' }),
  /* ---- Ch.6 — foods (Zanzibel market + the savanna crossing) ---- */
  jollof_bowl: () => forgeIcon({ subcat: 'bowl', band: 'ch6', detail: 'steam', seed: 'jollof_bowl' }),
  grilled_corn: () => forgeIcon({ subcat: 'skewer', band: 'ch6', detail: 'stripe', seed: 'grilled_corn' }),
  caravan_dates: () => forgeIcon({ subcat: 'fruit', band: 'ch6', detail: 'dots', seed: 'caravan_dates' }),
  caravan_rations: () => forgeIcon({ subcat: 'plate', band: 'ch6', detail: 'dots', seed: 'caravan_rations' }),
  suya_skewer: () => forgeIcon({ subcat: 'skewer', band: 'ch6', detail: 'flame', seed: 'suya_skewer' }),
  injera_roll: () => forgeIcon({ subcat: 'loaf', band: 'ch6', detail: 'stripe', seed: 'injera_roll' }),
  plantain_chips: () => forgeIcon({ subcat: 'bar', band: 'ch6', detail: 'dots', seed: 'plantain_chips' }),
  groundnut_stew: () => forgeIcon({ subcat: 'bowl', band: 'ch6', detail: 'dots', seed: 'groundnut_stew' }),
  akara_cake: () => forgeIcon({ subcat: 'pastry', band: 'ch6', detail: ['bite', 'dots'], seed: 'akara_cake' }),
  spiced_bun: () => forgeIcon({ subcat: 'pastry', band: 'ch6', detail: 'dots', seed: 'spiced_bun' }),
  coconut_rice: () => forgeIcon({ subcat: 'plate', band: 'ch6', detail: 'steam', seed: 'coconut_rice' }),
  fufu_bowl: () => forgeIcon({ subcat: 'loaf', band: 'ch6', detail: 'dots', seed: 'fufu_bowl' }),
  /* ---- Ch.6 — PP / cures / tonics ---- */
  kola_nut_drink: () => forgeIcon({ subcat: 'bottle', band: 'ch6', detail: ['cork', 'label'], seed: 'kola_nut_drink' }),
  hibiscus_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch6', detail: 'steam', seed: 'hibiscus_tea' }),
  baobab_juice: () => forgeIcon({ subcat: 'can', band: 'ch6', detail: 'label', seed: 'baobab_juice' }),
  shea_balm: () => forgeIcon({ subcat: 'wax_tin', band: 'ch6', detail: 'dots', seed: 'shea_balm' }),
  neem_drops: () => forgeIcon({ subcat: 'vial', band: 'ch6', detail: 'cap', seed: 'neem_drops' }),
  savanna_grit: () => forgeIcon({ subcat: 'pill', band: 'ch6', seed: 'savanna_grit' }),
  baobab_draught: () => forgeIcon({ subcat: 'capsule', band: 'ch6', detail: 'stripe', seed: 'baobab_draught' }),
  /* ---- Ch.6 — battle / valuables / keys ---- */
  thornbush_bomb: () => forgeIcon({ subcat: 'bomb', band: 'ch6', detail: 'fuse', seed: 'thornbush_bomb' }),
  dust_pot: () => forgeIcon({ subcat: 'pouch', band: 'ch6', seed: 'dust_pot' }),
  laughing_coin: () => forgeIcon({ subcat: 'coin', band: 'ch6', detail: 'crack', seed: 'laughing_coin' }),
  riddle_shard: () => forgeIcon({ subcat: 'gem', band: 'ch6', ramp: RAMP.BLUE, detail: 'crack', seed: 'riddle_shard' }),
  bronze_mask: () => forgeIcon({ subcat: 'idol', band: 'ch6', detail: 'star', seed: 'bronze_mask' }),
  trade_salt: () => forgeIcon({ subcat: 'sack', band: 'ch6', detail: 'dots', seed: 'trade_salt' }),
  canteen_of_the_crossing: () => forgeIcon({ subcat: 'bottle', band: 'ch6', detail: 'cap', seed: 'canteen_of_the_crossing' }),
  caravan_charter: () => forgeIcon({ subcat: 'note', band: 'ch6', seed: 'caravan_charter' }),

  /* ---- Ch.7 INDIA — armor menu faces (jeweled Pagri rung + bazaar bodies) ---- */
  jeweled_pagri: () => forgeIcon({ subcat: 'hat', band: 'ch7', detail: ['star', 'stripe'], seed: 'jeweled_pagri' }),
  silk_kurta: () => forgeIcon({ subcat: 'garment', band: 'ch7', detail: 'stripe', seed: 'silk_kurta' }),
  embroidered_sherwani: () => forgeIcon({ subcat: 'garment', band: 'ch7', detail: 'ribbon', seed: 'embroidered_sherwani' }),
  nawab_coat: () => forgeIcon({ subcat: 'garment', band: 'ch7', detail: 'dots', seed: 'nawab_coat' }),
  /* ---- Ch.7 — foods (Chandrapore bazaar street food) ---- */
  samosa: () => forgeIcon({ subcat: 'pastry', band: 'ch7', detail: 'bite', seed: 'samosa' }),
  jalebi: () => forgeIcon({ subcat: 'pastry', band: 'ch7', detail: 'ribbon', seed: 'jalebi' }),
  pani_puri: () => forgeIcon({ subcat: 'bowl', band: 'ch7', detail: 'dots', seed: 'pani_puri' }),
  butter_chicken: () => forgeIcon({ subcat: 'bowl', band: 'ch7', detail: 'steam', seed: 'butter_chicken' }),
  biryani: () => forgeIcon({ subcat: 'plate', band: 'ch7', detail: 'dots', seed: 'biryani' }),
  naan: () => forgeIcon({ subcat: 'loaf', band: 'ch7', detail: 'bite', seed: 'naan' }),
  pakora: () => forgeIcon({ subcat: 'pastry', band: 'ch7', detail: 'dots', seed: 'pakora' }),
  gulab_jamun: () => forgeIcon({ subcat: 'fruit', band: 'ch7', detail: 'steam', seed: 'gulab_jamun' }),
  dosa: () => forgeIcon({ subcat: 'loaf', band: 'ch7', detail: 'stripe', seed: 'dosa' }),
  mango_kulfi: () => forgeIcon({ subcat: 'bar', band: 'ch7', detail: 'wrapper', seed: 'mango_kulfi' }),
  chaat: () => forgeIcon({ subcat: 'bowl', band: 'ch7', detail: 'stripe', seed: 'chaat' }),
  /* ---- Ch.7 — PP / cures / tonics / revival ---- */
  masala_chai: () => forgeIcon({ subcat: 'teacup', band: 'ch7', detail: 'steam', seed: 'masala_chai' }),
  mango_lassi: () => forgeIcon({ subcat: 'cup_cold', band: 'ch7', seed: 'mango_lassi' }),
  falooda: () => forgeIcon({ subcat: 'cup_cold', band: 'ch7', ramp: RAMP.MAGENTA, seed: 'falooda' }),
  antivenom_vial: () => forgeIcon({ subcat: 'vial', band: 'ch7', detail: 'cap', seed: 'antivenom_vial' }),
  rosewater_drops: () => forgeIcon({ subcat: 'vial', band: 'ch7', detail: 'cork', seed: 'rosewater_drops' }),
  clarified_ghee: () => forgeIcon({ subcat: 'wax_tin', band: 'ch7', detail: 'label', seed: 'clarified_ghee' }),
  turmeric_draught: () => forgeIcon({ subcat: 'capsule', band: 'ch7', detail: 'stripe', seed: 'turmeric_draught' }),
  sacred_ash: () => forgeIcon({ subcat: 'vial', band: 'ch7', detail: 'dots', seed: 'sacred_ash' }),
  /* ---- Ch.7 — battle / valuables / keys ---- */
  diwali_cracker: () => forgeIcon({ subcat: 'firework', band: 'ch7', detail: 'fuse', seed: 'diwali_cracker' }),
  holi_powder: () => forgeIcon({ subcat: 'pouch', band: 'ch7', detail: 'dots', seed: 'holi_powder' }),
  peacock_plume: () => forgeIcon({ subcat: 'feather', band: 'ch7', seed: 'peacock_plume' }),
  star_ruby: () => forgeIcon({ subcat: 'gem', band: 'ch7', ramp: RAMP.RED, tint: RAMP.RED, detail: 'star', seed: 'star_ruby' }),
  brass_lota: () => forgeIcon({ subcat: 'wax_tin', band: 'ch7', detail: 'dots', seed: 'brass_lota' }),
  silk_bolt: () => forgeIcon({ subcat: 'bar', band: 'ch7', detail: 'ribbon', seed: 'silk_bolt' }),
  train_ticket: () => drawTrainTicketIcon(),
  spice_box: () => drawSpiceBoxIcon(),
  cinema_stub: () => forgeIcon({ subcat: 'ticket', band: 'ch7', detail: 'stripe', seed: 'cinema_stub' }),

  /* ---- Ch.8 CHINA — armor menu faces (Bamboo Hat rung + jade/lacquer bodies) ---- */
  bamboo_hat: () => forgeIcon({ subcat: 'hat', band: 'ch8', detail: 'dots', seed: 'bamboo_hat' }),
  silk_changshan: () => forgeIcon({ subcat: 'garment', band: 'ch8', detail: 'stripe', seed: 'silk_changshan' }),
  lacquer_robe: () => forgeIcon({ subcat: 'garment', band: 'ch8', detail: 'cap', seed: 'lacquer_robe' }),
  monks_robe: () => forgeIcon({ subcat: 'garment', band: 'ch8', detail: 'dots', seed: 'monks_robe' }),
  /* ---- Ch.8 — foods (Lotus Harbor + Mt. Shu temple) ---- */
  baozi: () => forgeIcon({ subcat: 'loaf', band: 'ch8', detail: ['steam', 'dots'], seed: 'baozi' }),
  jiaozi: () => forgeIcon({ subcat: 'bowl', band: 'ch8', detail: 'dots', seed: 'jiaozi' }),
  mooncake: () => forgeIcon({ subcat: 'pastry', band: 'ch8', detail: 'star', seed: 'mooncake' }),
  congee: () => forgeIcon({ subcat: 'bowl', band: 'ch8', detail: 'steam', seed: 'congee' }),
  lychee: () => forgeIcon({ subcat: 'fruit', band: 'ch8', detail: 'dots', seed: 'lychee' }),
  peking_pancake: () => forgeIcon({ subcat: 'plate', band: 'ch8', detail: 'stripe', seed: 'peking_pancake' }),
  dan_dan_noodles: () => forgeIcon({ subcat: 'bowl', band: 'ch8', detail: 'flame', seed: 'dan_dan_noodles' }),
  spring_roll: () => forgeIcon({ subcat: 'bar', band: 'ch8', detail: 'dots', seed: 'spring_roll' }),
  egg_tart: () => forgeIcon({ subcat: 'pastry', band: 'ch8', detail: 'dots', seed: 'egg_tart' }),
  tofu_claypot: () => forgeIcon({ subcat: 'plate', band: 'ch8', detail: 'steam', seed: 'tofu_claypot' }),
  sesame_ball: () => forgeIcon({ subcat: 'fruit', band: 'ch8', detail: ['dots', 'steam'], seed: 'sesame_ball' }),
  /* ---- Ch.8 — PP / cures / tonics / revival (Scroll of Calm bespoke) ---- */
  jade_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch8', detail: 'steam', seed: 'jade_tea' }),
  monks_broth: () => forgeIcon({ subcat: 'teacup', band: 'ch8', detail: 'dots', seed: 'monks_broth' }),
  temple_incense: () => forgeIcon({ subcat: 'incense', band: 'ch8', seed: 'temple_incense' }),
  spore_antidote: () => forgeIcon({ subcat: 'vial', band: 'ch8', detail: 'cap', seed: 'spore_antidote' }),
  scroll_of_calm: () => drawScrollIcon(),
  ginseng_root: () => forgeIcon({ subcat: 'capsule', band: 'ch8', detail: 'dots', seed: 'ginseng_root' }),
  monks_discipline: () => forgeIcon({ subcat: 'pill', band: 'ch8', seed: 'monks_discipline' }),
  joss_paper: () => forgeIcon({ subcat: 'note', band: 'ch8', detail: 'star', seed: 'joss_paper' }),
  /* ---- Ch.8 — battle / valuables / keys (the new `lantern` subcat lands) ---- */
  red_firecracker: () => forgeIcon({ subcat: 'firework', band: 'ch8', detail: 'fuse', seed: 'red_firecracker' }),
  paper_tiger: () => forgeIcon({ subcat: 'bomb', band: 'ch8', detail: 'star', seed: 'paper_tiger' }),
  ming_vase: () => forgeIcon({ subcat: 'bottle', band: 'ch8', ramp: RAMP.PAPER, detail: 'stripe', seed: 'ming_vase' }),
  terracotta_soldier: () => forgeIcon({ subcat: 'idol', band: 'ch8', detail: 'crack', seed: 'terracotta_soldier' }),
  jade_bi_disc: () => forgeIcon({ subcat: 'hubcap', band: 'ch8', ramp: RAMP.FOREST, seed: 'jade_bi_disc' }),
  harbor_lantern: () => forgeIcon({ subcat: 'lantern', band: 'ch8', detail: 'star', seed: 'harbor_lantern' }),
  yak_treats: () => drawYakTreatsIcon(),
  riverboat_pass: () => forgeIcon({ subcat: 'ticket', band: 'ch8', detail: 'stripe', seed: 'riverboat_pass' }),
  lotus_seal: () => forgeIcon({ subcat: 'card', band: 'ch8', detail: 'dots', seed: 'lotus_seal' }),

  /* ============ S17 M21 (ADR-091) — THE LAST-WORLD CATALOG ============
   * Ch.9 Romania · Ch.10 Alaska→Hawaii→Mars · the rounded-out cross chains. The
   * hero weapon TOPS that CLOSE the §A8 ladders + the story-grade named keys + the
   * Hallelujah Bell + THE PLAYER'S HOUSE KEY are bespoke (above); the long tail
   * forges one line each. Romania velvet/harvest/candlelit · Alaska ice · Hawaii
   * magma/island · Mars near-silent dread. */

  /* ---- Ch.9 ROMANIA — the hero TOP + the Hoaxula drop (bespoke menu faces) ---- */
  holy_pan: () => drawHolyPanIcon(),
  candelabra: () => drawCandelabraIcon(),
  /* ---- Ch.9 — armor menu faces (the căciulă hat rung + velvet/harvest bodies) ---- */
  caciula: () => forgeIcon({ subcat: 'hat', band: 'ch9', detail: 'dots', seed: 'caciula' }),
  monks_wrap: () => forgeIcon({ subcat: 'garment', band: 'ch9', detail: 'dots', seed: 'monks_wrap' }),
  velvet_cloak: () => forgeIcon({ subcat: 'garment', band: 'ch9', detail: 'ribbon', seed: 'velvet_cloak' }),
  sheepskin_cojoc: () => forgeIcon({ subcat: 'garment', band: 'ch9', detail: 'cap', seed: 'sheepskin_cojoc' }),
  embroidered_ie: () => forgeIcon({ subcat: 'garment', band: 'ch9', detail: 'stripe', seed: 'embroidered_ie' }),
  /* ---- Ch.9 — Buni's pantry + harvest foods ---- */
  sarmale: () => forgeIcon({ subcat: 'loaf', band: 'ch9', detail: 'stripe', seed: 'sarmale' }),
  mamaliga: () => forgeIcon({ subcat: 'bowl', band: 'ch9', detail: 'dots', seed: 'mamaliga' }),
  smantana: () => forgeIcon({ subcat: 'plate', band: 'ch9', detail: 'dots', seed: 'smantana' }),
  branza_burduf: () => forgeIcon({ subcat: 'wedge', band: 'ch9', detail: 'stripe', seed: 'branza_burduf' }),
  valley_mushrooms: () => forgeIcon({ subcat: 'bowl', band: 'ch9', detail: 'sprout', seed: 'valley_mushrooms' }),
  pickled_cabbage: () => forgeIcon({ subcat: 'bowl', band: 'ch9', detail: 'stripe', seed: 'pickled_cabbage' }),
  grandfather_plums: () => forgeIcon({ subcat: 'fruit', band: 'ch9', detail: 'sprout', seed: 'grandfather_plums' }),
  cozonac: () => forgeIcon({ subcat: 'loaf', band: 'ch9', detail: 'wrapper', seed: 'cozonac' }),
  mici: () => forgeIcon({ subcat: 'plate', band: 'ch9', detail: 'flame', seed: 'mici' }),
  ciorba: () => forgeIcon({ subcat: 'bowl', band: 'ch9', detail: 'steam', seed: 'ciorba' }),
  placinta: () => forgeIcon({ subcat: 'pastry', band: 'ch9', detail: 'dots', seed: 'placinta' }),
  papanasi: () => forgeIcon({ subcat: 'pastry', band: 'ch9', detail: 'star', seed: 'papanasi' }),
  /* ---- Ch.9 — PP / cures / tonics / battle ---- */
  monastery_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch9', detail: 'steam', seed: 'monastery_tea' }),
  linden_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch9', detail: 'dots', seed: 'linden_tea' }),
  socata: () => forgeIcon({ subcat: 'bottle', band: 'ch9', detail: 'cork', seed: 'socata' }),
  garlic_braid: () => forgeIcon({ subcat: 'string', band: 'ch9', seed: 'garlic_braid' }),
  pelin_bitters: () => forgeIcon({ subcat: 'vial', band: 'ch9', detail: 'cork', seed: 'pelin_bitters' }),
  vigil_candle: () => forgeIcon({ subcat: 'candle', band: 'ch9', detail: 'dots', seed: 'vigil_candle' }),
  highland_honey: () => forgeIcon({ subcat: 'wax_tin', band: 'ch9', detail: 'label', seed: 'highland_honey' }),
  censer_incense: () => forgeIcon({ subcat: 'incense', band: 'ch9', detail: 'dots', seed: 'censer_incense' }),
  holy_water: () => forgeIcon({ subcat: 'bottle', band: 'ch9', detail: 'cap', seed: 'holy_water' }),
  smoke_bomb: () => forgeIcon({ subcat: 'bomb', band: 'ch9', detail: 'fuse', seed: 'smoke_bomb' }),
  /* ---- Ch.9 — valuables (Hoaxula's props) + keys (Bell Clapper bespoke) ---- */
  fake_fang_denture: () => forgeIcon({ subcat: 'gem', band: 'ch9', ramp: RAMP.PAPER, detail: 'dots', seed: 'fake_fang_denture' }),
  cleveland_season_pass: () => forgeIcon({ subcat: 'ticket', band: 'ch9', detail: 'stripe', seed: 'cleveland_season_pass' }),
  stolen_vibe_jar: () => forgeIcon({ subcat: 'lantern', band: 'ch9', detail: 'star', seed: 'stolen_vibe_jar' }),
  velvet_curtain: () => forgeIcon({ subcat: 'sack', band: 'ch9', detail: 'ribbon', seed: 'velvet_curtain' }),
  painted_icon: () => forgeIcon({ subcat: 'idol', band: 'ch9', detail: 'star', seed: 'painted_icon' }),
  monastery_bell_clapper: () => drawBellClapperIcon(),
  orient_express_ticket: () => forgeIcon({ subcat: 'ticket', band: 'ch9', detail: 'dots', seed: 'orient_express_ticket' }),
  trial_stone: () => forgeIcon({ subcat: 'gem', band: 'ch9', ramp: RAMP.EARTH, seed: 'trial_stone' }),

  /* ---- Ch.10 ALASKA — Aurora Station (cold; freeze-resist gear) ---- */
  aurora_fur_hood: () => forgeIcon({ subcat: 'hat', band: 'ch10', detail: 'dots', seed: 'aurora_fur_hood' }),
  insulated_suit: () => forgeIcon({ subcat: 'parka', band: 'ch10', detail: 'dots', seed: 'insulated_suit' }),
  sealskin_parka: () => forgeIcon({ subcat: 'parka', band: 'ch10', detail: 'stripe', seed: 'sealskin_parka' }),
  akutaq: () => forgeIcon({ subcat: 'bowl', band: 'ch10', detail: 'dots', seed: 'akutaq' }),
  salmon_jerky: () => forgeIcon({ subcat: 'bar', band: 'ch10', detail: 'stripe', seed: 'salmon_jerky' }),
  reindeer_stew: () => forgeIcon({ subcat: 'bowl', band: 'ch10', detail: 'steam', seed: 'reindeer_stew' }),
  sourdough_flapjacks: () => forgeIcon({ subcat: 'plate', band: 'ch10', detail: 'stripe', seed: 'sourdough_flapjacks' }),
  crowberry_mash: () => forgeIcon({ subcat: 'bowl', band: 'ch10', detail: 'sprout', seed: 'crowberry_mash' }),
  aurora_cocoa: () => forgeIcon({ subcat: 'teacup', band: 'ch10', detail: 'steam', seed: 'aurora_cocoa' }),
  spruce_tip_tea: () => forgeIcon({ subcat: 'teacup', band: 'ch10', detail: 'sprout', seed: 'spruce_tip_tea' }),
  hand_warmer: () => forgeIcon({ subcat: 'wax_tin', band: 'ch10', detail: 'label', seed: 'hand_warmer' }),
  salmon_roe: () => forgeIcon({ subcat: 'capsule', band: 'ch10', detail: 'dots', seed: 'salmon_roe' }),
  flare_gun: () => forgeIcon({ subcat: 'firework', band: 'ch10', detail: 'fuse', seed: 'flare_gun' }),
  bear_spray: () => forgeIcon({ subcat: 'pouch', band: 'ch10', detail: 'dots', seed: 'bear_spray' }),
  gold_nugget: () => forgeIcon({ subcat: 'gem', band: 'ch10', ramp: RAMP.GOLD, detail: 'dots', seed: 'gold_nugget' }),
  generator_coil: () => forgeIcon({ subcat: 'hubcap', band: 'ch10', detail: 'crack', seed: 'generator_coil' }),
  walrus_ivory: () => forgeIcon({ subcat: 'idol', band: 'ch10', detail: 'star', seed: 'walrus_ivory' }),
  snowcat_fuel_key: () => forgeIcon({ subcat: 'card', band: 'ch10', detail: 'stripe', seed: 'snowcat_fuel_key' }),
  station_keycard: () => forgeIcon({ subcat: 'card', band: 'ch10', detail: 'dots', seed: 'station_keycard' }),

  /* ---- Ch.10 HAWAII — Mauna Lani (island, then magma); Board of Legends + the
     Pemberton ray-gun signatures, the Rocket Manifest bespoke ---- */
  board_of_legends: () => drawSurfboardIcon(),
  pembertons_raygun: () => drawRifleIcon(RAMP.PURPLE, 'gauss'),
  lauhala_hat: () => forgeIcon({ subcat: 'hat', band: 'ch10', detail: 'stripe', seed: 'lauhala_hat' }),
  heat_shield_vest: () => forgeIcon({ subcat: 'garment', band: 'ch10', detail: 'cap', seed: 'heat_shield_vest' }),
  aloha_shirt: () => forgeIcon({ subcat: 'garment', band: 'ch10', detail: 'dots', seed: 'aloha_shirt' }),
  poke_bowl: () => forgeIcon({ subcat: 'bowl', band: 'ch10', detail: 'stripe', seed: 'poke_bowl' }),
  kalua_pork: () => forgeIcon({ subcat: 'plate', band: 'ch10', detail: 'dots', seed: 'kalua_pork' }),
  spam_musubi: () => forgeIcon({ subcat: 'bar', band: 'ch10', detail: 'dots', seed: 'spam_musubi' }),
  malasada: () => forgeIcon({ subcat: 'pastry', band: 'ch10', detail: 'dots', seed: 'malasada' }),
  pineapple: () => forgeIcon({ subcat: 'fruit', band: 'ch10', detail: ['sprout', 'dots'], seed: 'pineapple' }),
  loco_moco: () => forgeIcon({ subcat: 'plate', band: 'ch10', detail: 'steam', seed: 'loco_moco' }),
  kona_coffee: () => forgeIcon({ subcat: 'teacup', band: 'ch10', detail: 'dots', seed: 'kona_coffee' }),
  coconut_water: () => forgeIcon({ subcat: 'cup_cold', band: 'ch10', seed: 'coconut_water' }),
  aloe_gel: () => forgeIcon({ subcat: 'leaf', band: 'ch10', seed: 'aloe_gel' }),
  noni_juice: () => forgeIcon({ subcat: 'bottle', band: 'ch10', detail: 'cork', seed: 'noni_juice' }),
  lava_salt: () => forgeIcon({ subcat: 'pill', band: 'ch10', detail: 'stripe', seed: 'lava_salt' }),
  macadamia: () => forgeIcon({ subcat: 'pill', band: 'ch10', detail: 'dots', seed: 'macadamia' }),
  tiki_torch: () => forgeIcon({ subcat: 'firework', band: 'ch10', detail: 'flame', seed: 'tiki_torch' }),
  sand_throw: () => forgeIcon({ subcat: 'pouch', band: 'ch10', seed: 'sand_throw' }),
  black_pearl: () => forgeIcon({ subcat: 'gem', band: 'ch10', ramp: RAMP.NIGHT, seed: 'black_pearl' }),
  tiki_idol: () => forgeIcon({ subcat: 'idol', band: 'ch10', detail: 'crack', seed: 'tiki_idol' }),
  rocket_manifest: () => drawRocketManifestIcon(),
  launch_pad_pass: () => forgeIcon({ subcat: 'ticket', band: 'ch10', detail: 'stripe', seed: 'launch_pad_pass' }),

  /* ---- Ch.10 MARS — The Sea of Silence; the hero TOPS, the Hallelujah Bell, and
     THE PLAYER'S HOUSE KEY are bespoke; the dread/freeze-dried tail forges ---- */
  caseys_last_swing: () => drawCaseysBatIcon(),
  comet_bead: () => drawCometBeadIcon(),
  pressure_suit: () => forgeIcon({ subcat: 'parka', band: 'ch10', detail: 'cap', seed: 'pressure_suit' }),
  oxygen_hood: () => forgeIcon({ subcat: 'hat', band: 'ch10', detail: 'cap', seed: 'oxygen_hood' }),
  freeze_dried_ice_cream: () => forgeIcon({ subcat: 'foilpack', band: 'ch10', detail: 'label', seed: 'freeze_dried_ice_cream' }),
  freeze_dried_stroganoff: () => forgeIcon({ subcat: 'foilpack', band: 'ch10', detail: 'stripe', seed: 'freeze_dried_stroganoff' }),
  ration_cube: () => forgeIcon({ subcat: 'bar', band: 'ch10', detail: 'label', seed: 'ration_cube' }),
  tube_peaches: () => forgeIcon({ subcat: 'foilpack', band: 'ch10', detail: 'dots', seed: 'tube_peaches' }),
  rehydrated_eggs: () => forgeIcon({ subcat: 'plate', band: 'ch10', detail: 'cap', seed: 'rehydrated_eggs' }),
  mars_vending_cola: () => forgeIcon({ subcat: 'can', band: 'ch10', detail: 'label', seed: 'mars_vending_cola' }),
  electrolyte_pouch: () => forgeIcon({ subcat: 'foilpack', band: 'ch10', detail: 'cap', seed: 'electrolyte_pouch' }),
  static_filter: () => forgeIcon({ subcat: 'card', band: 'ch10', detail: 'cap', seed: 'static_filter' }),
  hallelujah_bell: () => drawHallelujahBellIcon(),
  red_planet_iron: () => forgeIcon({ subcat: 'capsule', band: 'ch10', detail: ['stripe', 'dots'], seed: 'red_planet_iron' }),
  zero_g_serum: () => forgeIcon({ subcat: 'vial', band: 'ch10', detail: 'cap', seed: 'zero_g_serum' }),
  meteor_shard_tonic: () => forgeIcon({ subcat: 'gem', band: 'ch10', ramp: RAMP.PURPLE, detail: 'star', seed: 'meteor_shard_tonic' }),
  thruster_charge: () => forgeIcon({ subcat: 'bomb', band: 'ch10', detail: ['fuse', 'dots'], seed: 'thruster_charge' }),
  emp_grenade: () => forgeIcon({ subcat: 'bomb', band: 'ch10', detail: 'star', seed: 'emp_grenade' }),
  mars_meteorite: () => forgeIcon({ subcat: 'gem', band: 'ch10', ramp: RAMP.RED, detail: 'crack', seed: 'mars_meteorite' }),
  cracked_visor: () => forgeIcon({ subcat: 'gem', band: 'ch10', ramp: RAMP.CYAN, detail: 'crack', seed: 'cracked_visor' }),
  olivine_crystal: () => forgeIcon({ subcat: 'gem', band: 'ch10', ramp: RAMP.GRASS, detail: 'crack', seed: 'olivine_crystal' }),
  players_house_key: () => drawHouseKeyIcon(),
  airlock_card: () => forgeIcon({ subcat: 'note', band: 'ch10', detail: 'dots', seed: 'airlock_card' }),

  /* ---- CROSS-WORLD — the rounded-out §A10 chains' CATALOG pieces ---- */
  mr_click_photo: () => forgeIcon({ subcat: 'card', band: 'cross', detail: 'label', seed: 'mr_click_photo' }),
  mr_click_film: () => forgeIcon({ subcat: 'wax_tin', band: 'cross', detail: 'dots', seed: 'mr_click_film' }),
  dads_postcard: () => forgeIcon({ subcat: 'stamp', band: 'cross', detail: 'dots', seed: 'dads_postcard' }),
  folded_map: () => forgeIcon({ subcat: 'note', band: 'cross', detail: 'stripe', seed: 'folded_map' }),
  suspicious_peanut: () => forgeIcon({ subcat: 'fruit', band: 'cross', seed: 'suspicious_peanut' }),
  look_left_receipt: () => forgeIcon({ subcat: 'note', band: 'cross', detail: 'label', seed: 'look_left_receipt' }),
  homesong_stem: () => forgeIcon({ subcat: 'tape', band: 'cross', detail: 'label', seed: 'homesong_stem' }),
  homesong_bell_stem: () => forgeIcon({ subcat: 'tape', band: 'cross', detail: 'dots', seed: 'homesong_bell_stem' }),
  homesong_drum_stem: () => forgeIcon({ subcat: 'tape', band: 'cross', detail: 'stripe', seed: 'homesong_drum_stem' }),
  minimus_spoon: () => forgeIcon({ subcat: 'bell', band: 'cross', seed: 'minimus_spoon' }),
  giant_zipper_pull: () => forgeIcon({ subcat: 'hubcap', band: 'cross', detail: 'dots', seed: 'giant_zipper_pull' }),
};

/**
 * THE UNIVERSAL ITEM-ICON REGISTRY. The fresh icons above, plus every WEAPON_ART
 * 'trinket' (arms + charms) reused verbatim — one drawing, two registries. Built
 * once at module load; the content validator + icons.test.ts sweep it both ways
 * against ITEMS so a new item without a face, or a face without an item, fails.
 */
export const ITEM_ICON: Record<string, () => Pixmap> = (() => {
  const reg: Record<string, () => Pixmap> = { ...FRESH_ICONS };
  for (const [id, art] of Object.entries(WEAPON_ART)) {
    if (art.kind === 'trinket') reg[id] = art.icon;
  }
  return reg;
})();

/* ================================================================== */
/* THE ICON FORGE (S17 Movement 17, ADR-062) — the parametric long tail. */

/**
 * The §A8 catalog is headed for ~500 items (ADR-061), and 500 faces can be
 * neither 500 one-offs nor 500 palette-swaps. THE ICON FORGE (iconforge.ts)
 * composes a face from three independent layers — subcategory SILHOUETTE ×
 * region RAMP × per-item DETAIL — so each is distinct BY CONSTRUCTION. The
 * shipped 41 above keep their EXACT bespoke look; every SIGNATURE (hero weapon
 * rungs, the §A8 SETS, the named key items) stays a hand drawing here / in
 * WEAPON_ART. The forge is ADDITIVE, for the generic tail.
 *
 * M17 builds the forge and adds NO items. The regional catalogs (M18–21) author
 * a parametric item as ONE fresh ITEM_ICON row that calls forgeIcon with the
 * item's id as the seed — and the both-directions gate + the distinctness test
 * keep it honest (a face that collides with another fails the build):
 *
 *   alfajor:    () => forgeIcon({ subcat: 'pastry',  band: 'ch2', detail: 'dots',  seed: 'alfajor' }),
 *   star_pop:   () => forgeIcon({ subcat: 'can',     band: 'ch1', detail: 'label', seed: 'star_pop' }),
 *   cool_charm: () => forgeIcon({ subcat: 'pendant', band: 'ch4', detail: 'stone', tint: RAMP.CYAN, seed: 'cool_charm' }),
 */
export {
  forgeIcon,
  forgeGallery,
  FORGE_CATALOG,
  SUBCAT_KIND,
  REGION_RAMPS,
  ICON_W,
  ICON_H,
} from './iconforge';
export type { IconSpec, Subcat, Detail, ForgeCtx, GallerySample } from './iconforge';
