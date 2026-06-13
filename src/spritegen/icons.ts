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
import { RAMP, px, C } from '../palette';
import { WEAPON_ART } from './weapons';

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

/** an air rifle: stock low-left, barrel to the right, the orange safety tip */
function drawRifleIcon(): Pixmap {
  const pm = new Pixmap(14, 12);
  const stock = px(RAMP.EARTH, 1);
  const stockL = px(RAMP.EARTH, 2);
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
  // the safety-orange muzzle tip — Wintermoor insists
  pm.set(12, 5, px(RAMP.ORANGE, 3));
  pm.set(12, 6, px(RAMP.ORANGE, 2));
  pm.outline(C.outline);
  return pm;
}

/** a prayer-bead bracelet: a loop of beads, one gold focal bead */
function drawBeadsIcon(): Pixmap {
  const pm = new Pixmap(14, 14);
  const bead = px(RAMP.EARTH, 2);
  const beadL = px(RAMP.EARTH, 3);
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
  pellet_popper: () => drawRifleIcon(),
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
