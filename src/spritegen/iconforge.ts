/**
 * THE ICON FORGE — S17 Movement 17 (ADR-062). The parametric engine behind the
 * §A8 long tail. THE ICON ATLAS (ADR-060) gave every item a hand-drawn face;
 * the catalog is now headed for ~500 (ADR-061), and 500 faces can be neither
 * 500 one-offs nor 500 palette-swaps. So a face is composed from THREE
 * independent choices, and two icons are never the same drawing by construction:
 *
 *   1. SILHOUETTE = the SUBCATEGORY  (a `can`, a `pastry`, a `pendant`) — the
 *      shape function shared by a family (the drawBatIcon / drawPanIcon pattern,
 *      generalised). What the thing IS.
 *   2. RAMP        = the REGION palette family (warm clay for South America,
 *      fjord-cold for Norway, jade/lacquer for China) — chosen from the item's
 *      `band` mood pool, SEEDED off the stable item id. Where it's FROM.
 *   3. DETAIL      = the per-item mark (a label, a bite, a cork, a gem, a fuse)
 *      laid after the fill, before outline(). Which one of its kind it is.
 *
 * Bespoke stays bespoke: every SIGNATURE (the hero weapon rungs, the §A8
 * signature SETS, the named key items) keeps its hand drawing in icons.ts /
 * WEAPON_ART. The forge is ADDITIVE — it pours the generic foods, drinks, gear,
 * cures, tonics, battle items, valuables the regional catalogs (M18–21) author
 * as pure data: `() => forgeIcon({ subcat, band, detail, seed })`.
 *
 * Phaser-free on purpose (the validator + the contact-sheet tool import it). The
 * ADR-020 laws hold BY CONSTRUCTION: the Pixmap DSL accepts only palette indices
 * (no API takes an RGB), fills are flat and marks deliberate (no scatter noise),
 * `outline()` lands LAST so each icon lives inside one INK contour, and only
 * pure light (a glass glint) follows the contour via the silhouette's `light`.
 *
 * Determinism (no map FNV, no levelkit re-pin): the look is a pure function of
 * (subcat, band, detail, seed). The seed is the item id — a stable string, not a
 * map stream — so an item's face reproduces forever and a refactor cannot drift
 * it. Icons are not sample-routed generators, so the frozen-core / world_block
 * pins do not apply here.
 */
import { Pixmap, mulberry32 } from './pixmap';
import { RAMP, px, C, T } from '../palette';
import type { ItemBand, ItemKind } from '../schemas';

/** every forged icon is a square menu tile — legible in a bag row, ≤16px (the
 *  ADR-060 bound the icons.test sweep enforces) */
export const ICON_W = 14;
export const ICON_H = 14;

const {
  INK, PAPER, RED, ORANGE, GOLD, GRASS, FOREST, CYAN, BLUE, PURPLE, MAGENTA, EARTH, NIGHT,
} = RAMP;

/* ====================================================================== */
/* LAYER 2 — THE REGION PALETTE FAMILIES                                   */
/* Each band lends a MOOD POOL of ramps; the item id seeds which one its    */
/* body wears, so a region's parametric goods share a palette (§A11.7 at    */
/* the pixel level) without any two being forced to match. The pools are    */
/* deliberately distinct in membership so a Norway cure can't read as an    */
/* India one even at a glance. Functional bits (a wooden stick, a battery   */
/* terminal, glass) stay their real colour — a battery is a battery in any  */
/* country; the REGION lives in the body mass and the detail.               */

export const REGION_RAMPS: Record<ItemBand, number[]> = {
  ch1: [RED, BLUE, GOLD, EARTH, GRASS], //   USA — warm suburban Americana
  ch2: [ORANGE, GOLD, EARTH, RED, FOREST], // South America — Andean clay, dulce, jungle
  ch3: [NIGHT, BLUE, FOREST, CYAN, PAPER], // England — fog, slate, tweed, tea
  ch4: [CYAN, PAPER, BLUE, NIGHT, FOREST], // Norway — fjord ice, snow, deep pine
  ch5: [PURPLE, MAGENTA, GOLD, RED, BLUE], // Minimus — a heraldic jewel-box
  ch6: [GOLD, ORANGE, EARTH, BLUE, GRASS], // Africa — savanna ochre + indigo cloth
  ch7: [MAGENTA, ORANGE, GOLD, PURPLE, RED], // India — bazaar spice + jewel
  ch8: [FOREST, RED, GOLD, PAPER, CYAN], //   China — jade, lacquer-red, rice paper
  ch9: [RED, PURPLE, EARTH, NIGHT, GOLD], //  Romania — velvet, harvest, candlelit castle
  ch10: [CYAN, NIGHT, RED, PURPLE, ORANGE], // Alaska→Hawaii→Mars — cold, then dread, then magma
  cross: [GOLD, EARTH, PAPER, BLUE, GRASS], // cross-world chains — neutral & warm
};

/* ====================================================================== */
/* THE COMPOSE CONTEXT                                                      */

export interface ForgeCtx {
  pm: Pixmap;
  /** the body ramp, chosen from the band pool by seed (layer 2) */
  ramp: number;
  /** a second pool ramp for trim / contrast / fillings */
  accent: number;
  /** the detail tint (a charm gem's hue, a sauce) — defaults to GOLD */
  tint: number;
  /** a named deterministic sub-stream (seed ⊕ name → mulberry32) */
  rng: (name: string) => () => number;
}

interface Silhouette {
  /** which ItemKind this subcategory serves (gallery grouping + labels) */
  kind: ItemKind;
  /** the base shape: flat 3-tone volume in `ramp`, marks before outline() */
  draw: (ctx: ForgeCtx) => void;
  /** OPTIONAL pure light that follows the contour (ADR-020) — glass glints */
  light?: (ctx: ForgeCtx) => void;
}

/* small shade helpers — readability over the px(ramp, n) noise */
const d = (r: number): number => px(r, 1); // shadow
const m = (r: number): number => px(r, 2); // mid
const l = (r: number): number => px(r, 3); // light

/* ====================================================================== */
/* LAYER 1 — THE SUBCATEGORY SILHOUETTES                                    */
/* One drawing per family; the region recolours it and the detail marks it. */
/* Grouped by ItemKind. Each reads as its object AND is structurally        */
/* distinct from its siblings (a disc is a coin OR a pill OR a medal by its  */
/* interior mark, never by luck).                                           */

const SILHOUETTES: Record<string, Silhouette> = {
  /* ---------------------------- FOOD ---------------------------- */

  /** skewer — corn dog / kebab / taquito: a stick threaded with chunks */
  skewer: {
    kind: 'food',
    draw: ({ pm, ramp }) => {
      pm.vline(7, 1, 12, d(EARTH));
      pm.set(7, 1, m(EARTH));
      for (const cy of [4, 7, 10]) {
        pm.ellipse(7, cy, 2, 2, m(ramp));
        pm.set(6, cy - 1, l(ramp));
      }
    },
  },

  /** sandwich — PB&J / grilled cheese: two slices, a filling band, a corner */
  sandwich: {
    kind: 'food',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(2, 3, 10, 3, l(ramp)); // top slice
      pm.hline(2, 3, 10, m(ramp));
      pm.rect(2, 6, 10, 2, m(accent)); // the filling
      pm.rect(2, 8, 10, 3, l(ramp)); // bottom slice
      pm.hline(2, 10, 10, d(ramp));
      pm.line(11, 3, 12, 4, m(ramp)); // a turned corner
      pm.set(3, 7, l(accent)); // a gleam of filling
    },
  },

  /** pastry — alfajor / empanada / samosa / scone: a glazed half-dome */
  pastry: {
    kind: 'food',
    draw: ({ pm, ramp }) => {
      pm.contour(7, 3, [1, 2, 3, 4, 4, 5, 5], m(ramp));
      pm.hline(2, 10, 11, d(ramp)); // the base
      for (const x of [3, 5, 7, 9, 11]) pm.set(x, 10, l(ramp)); // crimped edge
      pm.contour(6, 4, [0, 1, 2, 2], l(ramp)); // glaze
    },
  },

  /** bowl — jollof / poke / ceviche / nachos: a deep bowl, contents mounded */
  bowl: {
    kind: 'food',
    draw: ({ pm, ramp, accent }) => {
      pm.contour(7, 4, [2, 3, 4], m(accent)); // the mound
      pm.set(6, 4, l(accent));
      pm.contour(7, 7, [6, 6, 5, 4, 2], m(ramp)); // the bowl
      pm.hline(1, 7, 13, l(ramp)); // rim highlight
      pm.hline(3, 11, 5, d(ramp)); // foot shadow
    },
  },

  /** loaf — baozi / crumb / mămăligă: a full-width block with a pleated cap */
  loaf: {
    kind: 'food',
    draw: ({ pm, ramp }) => {
      pm.rect(1, 6, 12, 6, m(ramp));
      pm.contour(7, 3, [2, 4, 5], l(ramp)); // domed cap
      pm.hline(1, 6, 12, l(ramp));
      pm.hline(1, 11, 12, d(ramp));
      for (const x of [4, 6, 8, 10]) pm.vline(x, 4, 3, d(ramp)); // pleats
    },
  },

  /** wedge — pie / cheese / cake slice: a triangle, point-left, crust right */
  wedge: {
    kind: 'food',
    draw: ({ pm, ramp, accent }) => {
      const tip = 3;
      const base = 12;
      for (let x = tip; x <= base; x++) {
        const half = Math.round((x - tip) / 2);
        pm.vline(x, 8 - half, half * 2 + 1, m(ramp));
      }
      pm.vline(base, 4, 9, d(ramp)); // the back crust
      pm.line(tip + 1, 8, base, 6, m(accent)); // a filling stratum
      pm.line(tip, 8, base, 4, l(ramp)); // lit upper edge
    },
  },

  /** fruit — mango / dates / cloudberry: a round body (stem via the sprout detail) */
  fruit: {
    kind: 'food',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 8, 4, 4, m(ramp));
      pm.ellipse(6, 7, 2, 2, l(ramp));
      pm.set(7, 4, d(ramp)); // the stem dimple
      pm.set(9, 10, d(ramp));
    },
  },

  /** bar — dulce / chocolate: a wrapped rectangle in segments */
  bar: {
    kind: 'food',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(2, 4, 10, 7, m(ramp));
      pm.hline(2, 4, 10, l(ramp));
      pm.vline(2, 4, 7, l(ramp));
      pm.vline(11, 4, 7, d(ramp));
      pm.vline(5, 5, 5, d(ramp)); // segment scores
      pm.vline(8, 5, 5, d(ramp));
      pm.rect(11, 5, 2, 5, m(accent)); // the wrapper's folded end
      pm.set(12, 6, l(accent));
    },
  },

  /** plate — casserole / sarmale: a flat plate under a low mound */
  plate: {
    kind: 'food',
    draw: ({ pm, ramp, accent }) => {
      pm.ellipse(7, 9, 5, 2, l(ramp)); // the plate
      pm.ellipse(7, 8, 4, 2, m(ramp)); // inner well
      pm.ellipse(7, 7, 3, 2, m(accent)); // the mound
      pm.set(6, 6, l(accent));
      pm.hline(3, 10, 9, d(ramp));
    },
  },

  /** cup_cold — lemonade / chicha / lassi: an open glass, straw, region liquid */
  cup_cold: {
    kind: 'food',
    draw: ({ pm, ramp, accent }) => {
      for (let r = 0; r < 7; r++) pm.hline(4, 6 + r, 6, m(ramp)); // the drink
      pm.hline(4, 6, 6, l(ramp)); // the meniscus
      pm.vline(3, 4, 9, m(PAPER)); // glass walls
      pm.vline(10, 4, 9, m(PAPER));
      pm.hline(3, 13, 8, m(PAPER)); // base
      pm.hline(3, 4, 8, l(PAPER)); // rim
      pm.line(8, 2, 6, 9, m(accent)); // the straw
    },
    light: ({ pm }) => pm.set(4, 7, C.white),
  },

  /* ---------------------------- PP DRINK ---------------------------- */

  /** can — the Star Cola line / jungle fizz: a cylinder with a lid + band */
  can: {
    kind: 'pp',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 3, 8, 9, m(ramp));
      pm.vline(3, 3, 9, l(ramp));
      pm.vline(10, 3, 9, d(ramp));
      pm.rect(3, 2, 8, 1, d(PAPER)); // the lid
      pm.set(6, 1, m(PAPER)); // the pull tab
      pm.rect(3, 6, 8, 2, m(accent)); // the label band
    },
    light: ({ pm }) => pm.set(4, 4, C.white),
  },

  /** bottle — mate / monastery cordial: a body, shoulders, a neck + cap */
  bottle: {
    kind: 'pp',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(6, 1, 3, 2, m(accent)); // cap
      pm.contour(7, 3, [1, 2, 3], m(ramp)); // shoulders
      pm.rect(3, 6, 9, 6, m(ramp)); // body
      pm.vline(3, 6, 6, l(ramp));
      pm.vline(11, 6, 6, d(ramp));
      pm.rect(4, 7, 7, 2, m(accent)); // label band
    },
    light: ({ pm }) => pm.set(4, 7, C.white),
  },

  /** teacup — Earl Grey / builder's / chai: cup, saucer, handle (steam detail) */
  teacup: {
    kind: 'pp',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 4, 7, 4, m(ramp)); // cup
      pm.contour(6, 8, [3, 2], m(ramp)); // rounded base
      pm.hline(3, 4, 7, l(ramp)); // rim
      pm.hline(4, 5, 5, m(accent)); // the tea
      pm.set(10, 5, m(ramp)); // handle
      pm.set(11, 6, m(ramp));
      pm.set(10, 7, m(ramp));
      pm.hline(2, 10, 9, l(ramp)); // saucer
      pm.hline(3, 11, 7, d(ramp));
    },
  },

  /** incense — temple incense: a holder, a thin stick, a glowing tip */
  incense: {
    kind: 'pp',
    draw: ({ pm, ramp }) => {
      pm.rect(4, 10, 6, 2, m(ramp)); // holder
      pm.hline(4, 10, 6, l(ramp));
      pm.vline(7, 3, 7, m(EARTH)); // the stick
      pm.set(7, 2, l(ORANGE)); // the ember
      pm.set(7, 3, m(ORANGE));
      pm.set(6, 1, m(PAPER)); // a curl of smoke
      pm.set(8, 0, d(PAPER));
    },
  },

  /* ---------------------------- CURE / REVIVAL ---------------------------- */

  /** vial — eye-drops / unknot / syrup: a small bottle with a dropper bulb */
  vial: {
    kind: 'cure',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(4, 6, 6, 6, m(ramp));
      pm.vline(4, 6, 6, l(ramp));
      pm.vline(9, 6, 6, d(ramp));
      pm.hline(4, 11, 6, d(ramp));
      pm.rect(5, 8, 4, 3, m(accent)); // the medicine
      pm.rect(6, 3, 2, 3, m(PAPER)); // the glass neck
      pm.ellipse(7, 2, 1, 1, m(RED)); // the rubber bulb
    },
    light: ({ pm }) => pm.set(5, 7, C.white),
  },

  /** leaf — a generic herb blade (aloe stays bespoke): midrib + veins */
  leaf: {
    kind: 'cure',
    draw: ({ pm, ramp }) => {
      pm.contour(7, 2, [0, 1, 2, 2, 3, 3, 2, 2, 1], m(ramp));
      pm.vline(7, 3, 7, d(ramp)); // midrib
      pm.line(7, 5, 5, 6, d(ramp)); // veins
      pm.line(7, 7, 9, 8, d(ramp));
      pm.contour(7, 3, [0, 1, 1, 1], l(ramp)); // a lit inner stripe
    },
  },

  /** cloth — a folded square (the hanky stays bespoke): a corner + a motif */
  cloth: {
    kind: 'cure',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(2, 4, 10, 8, l(ramp));
      pm.hline(2, 4, 10, m(ramp));
      pm.hline(2, 11, 10, d(ramp));
      pm.line(9, 4, 11, 6, d(ramp)); // a turned-down corner
      pm.set(6, 7, m(accent)); // the embroidered motif
      pm.set(7, 8, m(accent));
      pm.set(7, 6, m(accent));
      pm.set(5, 8, m(accent));
    },
  },

  /** shaker — a perforated shaker (salt stays bespoke): cap holes */
  shaker: {
    kind: 'cure',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(4, 6, 6, 6, m(ramp));
      pm.contour(7, 4, [1, 2], m(ramp)); // the shoulder
      pm.vline(4, 6, 6, l(ramp));
      pm.vline(9, 6, 6, d(ramp));
      pm.rect(5, 8, 4, 3, l(ramp)); // the contents heaped inside
      pm.rect(4, 3, 6, 2, m(accent)); // the metal cap
      pm.set(5, 3, C.outline); // the holes
      pm.set(7, 3, C.outline);
      pm.set(9, 3, C.outline);
    },
  },

  /** bell — wakey / hallelujah: a dome, a clapper, a handle */
  bell: {
    kind: 'cure',
    draw: ({ pm, ramp, accent }) => {
      pm.contour(7, 3, [1, 2, 3, 4, 4], m(ramp));
      pm.hline(2, 8, 11, l(ramp)); // the mouth rim
      pm.set(7, 10, d(ramp)); // the clapper
      pm.rect(6, 1, 3, 2, m(accent)); // the handle
      pm.vline(5, 4, 4, l(ramp)); // lit flank
    },
  },

  /** tape — Mom's Voice Tape: a cassette, label + two reels */
  tape: {
    kind: 'cure',
    draw: ({ pm, ramp }) => {
      pm.rect(2, 4, 11, 7, m(ramp));
      pm.hline(2, 4, 11, l(ramp));
      pm.frame(2, 4, 11, 7, d(ramp));
      pm.rect(3, 5, 9, 2, m(PAPER)); // the label
      pm.ellipse(5, 9, 1, 1, d(INK)); // reels
      pm.ellipse(9, 9, 1, 1, d(INK));
      pm.set(5, 9, m(PAPER));
      pm.set(9, 9, m(PAPER));
    },
  },

  /** feather — Guardian-Angel Feather: symmetric vanes over a bare quill */
  feather: {
    kind: 'cure',
    draw: ({ pm, ramp }) => {
      const hw = [1, 2, 3, 3, 3, 2, 2, 1, 1];
      hw.forEach((w, i) => pm.hline(7 - w, 3 + i, 2 * w + 1, m(ramp)));
      pm.vline(7, 2, 11, d(ramp)); // the rachis, through and below the vanes
      pm.set(7, 13, d(ramp)); // the quill tip
      pm.set(5, 6, l(ramp)); // barb gleams
      pm.set(9, 8, l(ramp));
    },
    light: ({ pm }) => pm.set(6, 5, C.white),
  },

  /* ---------------------------- TONIC ---------------------------- */

  /** pill — Sudden Guts Pill: a round tablet with a single score line */
  pill: {
    kind: 'tonic',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 7, 4, 4, m(ramp));
      pm.ellipse(6, 6, 2, 2, l(ramp));
      pm.vline(7, 4, 7, d(ramp)); // the score
    },
  },

  /** capsule — a two-tone horizontal capsule */
  capsule: {
    kind: 'tonic',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 6, 9, 4, m(ramp));
      pm.rect(3, 6, 5, 4, m(accent)); // the left half
      pm.set(2, 7, m(accent)); // rounded ends
      pm.set(2, 8, m(accent));
      pm.set(12, 7, m(ramp));
      pm.set(12, 8, m(ramp));
      pm.hline(3, 6, 5, l(accent)); // sheen
      pm.hline(8, 6, 4, l(ramp));
    },
  },

  /** carton — Growth-Spurt Milk: a gabled milk carton */
  carton: {
    kind: 'tonic',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 5, 8, 8, l(ramp)); // body
      pm.vline(3, 5, 8, m(ramp));
      pm.vline(10, 5, 8, d(ramp));
      pm.line(3, 5, 7, 2, m(ramp)); // the gable
      pm.line(10, 5, 7, 2, m(ramp));
      pm.hline(6, 2, 3, d(ramp)); // the folded ridge
      pm.rect(4, 7, 6, 3, m(accent)); // the label
    },
  },

  /** battery — Charged Battery: a cell, a terminal nub, a bolt */
  battery: {
    kind: 'tonic',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 4, 7, 9, m(ramp));
      pm.vline(3, 4, 9, l(ramp));
      pm.vline(9, 4, 9, d(ramp));
      pm.rect(5, 2, 3, 2, m(PAPER)); // the + terminal
      pm.rect(3, 7, 7, 3, m(accent)); // the label band
      pm.set(6, 7, l(GOLD)); // the lightning bolt
      pm.set(5, 8, l(GOLD));
      pm.set(6, 8, m(GOLD));
      pm.set(5, 9, l(GOLD));
      pm.set(4, 10, l(GOLD));
    },
  },

  /** lunchbox — Brain-Food Lunch: a box, a lid seam, a latch, a handle */
  lunchbox: {
    kind: 'tonic',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(2, 5, 11, 7, m(ramp));
      pm.hline(2, 5, 11, l(ramp));
      pm.frame(2, 5, 11, 7, d(ramp));
      pm.hline(2, 7, 11, d(ramp)); // the lid seam
      pm.set(7, 7, l(accent)); // the latch
      pm.set(7, 8, l(accent));
      pm.contour(7, 3, [-1, -1, 3], m(ramp)); // the handle arch
      pm.set(4, 4, m(ramp));
      pm.set(10, 4, m(ramp));
    },
  },

  /** wax_tin — Turtle Wax: a shallow round tin with a label ring */
  wax_tin: {
    kind: 'tonic',
    draw: ({ pm, ramp, accent }) => {
      pm.ellipse(7, 8, 5, 2, m(ramp)); // the body
      pm.ellipse(7, 7, 5, 2, l(ramp)); // the lid top
      pm.ellipse(7, 7, 3, 1, m(accent)); // the label ring
      pm.hline(2, 8, 11, d(ramp)); // the seam
    },
  },

  /* ---------------------------- BATTLE ---------------------------- */

  /** firework — Bottle Rocket: a tube, a nose cone, a guide stick */
  firework: {
    kind: 'battle',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(5, 3, 4, 7, m(ramp)); // tube
      pm.vline(5, 3, 7, l(ramp));
      pm.vline(8, 3, 7, d(ramp));
      pm.contour(7, 1, [1, 2], m(accent)); // the nose cone
      pm.vline(7, 10, 3, m(EARTH)); // the guide stick
      pm.set(9, 9, d(EARTH)); // a stub of fuse
    },
  },

  /** string — Firecracker String: a cord hung with little red crackers */
  string: {
    kind: 'battle',
    draw: ({ pm, ramp }) => {
      pm.line(2, 3, 12, 11, d(EARTH)); // the cord
      for (const [cx, cy] of [[4, 4], [7, 6], [9, 7], [6, 9], [11, 10]] as Array<[number, number]>) {
        pm.rect(cx, cy, 2, 3, m(ramp));
        pm.set(cx, cy, l(ramp));
        pm.set(cx, cy + 3, m(GOLD)); // a tiny fuse spark
      }
    },
  },

  /** zapper — Bug Zapper: a racket head with a mesh grid + a handle */
  zapper: {
    kind: 'battle',
    draw: ({ pm, ramp, accent }) => {
      pm.ellipse(7, 5, 4, 4, m(ramp)); // the frame
      pm.ellipse(7, 5, 3, 3, d(INK)); // the mesh void
      pm.vline(5, 3, 5, m(accent)); // the grid
      pm.vline(9, 3, 5, m(accent));
      pm.hline(4, 4, 7, m(accent));
      pm.hline(4, 6, 7, m(accent));
      pm.rect(6, 9, 3, 4, m(EARTH)); // the handle
      pm.set(7, 5, l(GOLD)); // a captive zap
    },
  },

  /** bomb — Stink Bomb: a round body with a fuse cap + a lit fuse */
  bomb: {
    kind: 'battle',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 9, 4, 4, m(ramp));
      pm.ellipse(6, 8, 2, 2, l(ramp));
      pm.rect(6, 3, 3, 2, d(ramp)); // the fuse cap
      pm.line(7, 3, 9, 1, d(EARTH)); // the fuse
      pm.set(10, 1, l(GOLD)); // the spark
    },
  },

  /** cushion — Whoopee Cushion: a flat disc with a nozzle spout */
  cushion: {
    kind: 'battle',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 8, 5, 3, m(ramp));
      pm.ellipse(6, 7, 3, 2, l(ramp));
      pm.rect(1, 8, 3, 2, d(ramp)); // the nozzle
      pm.set(0, 8, m(ramp));
      pm.hline(3, 9, 8, d(ramp)); // a fold
    },
  },

  /** pouch — Pocket Sand: a round drawstring bag, a tie, spilling grains */
  pouch: {
    kind: 'battle',
    draw: ({ pm, ramp, accent }) => {
      pm.ellipse(7, 9, 4, 3, m(ramp));
      pm.rect(3, 8, 9, 4, m(ramp));
      pm.hline(3, 11, 9, d(ramp));
      pm.vline(3, 8, 4, l(ramp));
      pm.contour(7, 5, [1, 2, 3], m(ramp)); // the gathered neck
      pm.hline(5, 7, 5, m(accent)); // the drawstring tie
      pm.set(11, 11, l(GOLD)); // spilling grains
      pm.set(12, 12, m(GOLD));
      pm.set(11, 12, l(GOLD));
    },
  },

  /* ---------------------------- VALUABLE ---------------------------- */

  /** stamp — a perforated stamp (fresh_stamps stays bespoke): a framed print */
  stamp: {
    kind: 'valuable',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(2, 2, 10, 10, l(ramp)); // the stamp
      pm.rect(3, 3, 8, 8, m(accent)); // the printed field
      pm.set(7, 6, l(accent)); // a tiny device
      pm.set(6, 7, l(accent));
      pm.set(8, 7, l(accent));
      for (let i = 3; i <= 10; i += 2) {
        // the perforated edge — paper bumps
        pm.set(i, 1, l(ramp));
        pm.set(i, 12, l(ramp));
        pm.set(1, i, l(ramp));
        pm.set(12, i, l(ramp));
      }
    },
  },

  /** sack — a tied bag (sugar stays bespoke): a gathered neck + a label */
  sack: {
    kind: 'valuable',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 5, 8, 8, m(ramp));
      pm.vline(3, 5, 8, l(ramp));
      pm.vline(10, 5, 8, d(ramp));
      pm.contour(7, 2, [1, 2, 3], m(ramp)); // the gathered neck
      pm.hline(5, 4, 5, d(EARTH)); // the tie
      pm.rect(5, 8, 4, 3, m(accent)); // the label
    },
  },

  /** crate — a slatted crate (lemon_crate stays bespoke): contents poke over */
  crate: {
    kind: 'valuable',
    draw: ({ pm, ramp }) => {
      for (const x of [4, 7, 10]) {
        pm.ellipse(x, 4, 1, 1, m(ramp)); // contents peeking
        pm.set(x - 1, 3, l(ramp));
      }
      pm.rect(2, 5, 11, 7, m(EARTH)); // the wood
      pm.hline(2, 5, 11, l(EARTH));
      pm.frame(2, 5, 11, 7, d(EARTH));
      pm.vline(6, 5, 7, d(EARTH)); // slat gaps
      pm.vline(9, 5, 7, d(EARTH));
      pm.hline(2, 8, 11, d(EARTH));
    },
  },

  /** idol — fool's-gold idol: a carved totem face */
  idol: {
    kind: 'valuable',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(4, 3, 6, 9, m(ramp)); // the column
      pm.vline(4, 3, 9, l(ramp));
      pm.vline(9, 3, 9, d(ramp));
      pm.hline(5, 5, 4, d(ramp)); // the brow
      pm.set(5, 6, C.outline); // the eyes
      pm.set(8, 6, C.outline);
      pm.vline(6, 6, 2, d(ramp)); // the nose
      pm.hline(5, 9, 4, C.outline); // the mouth
      pm.set(6, 4, l(accent)); // a set gem
    },
  },

  /** hubcap — a spare hubcap: a disc with radial spokes + a centre bolt */
  hubcap: {
    kind: 'valuable',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 7, 5, 5, m(ramp));
      pm.ellipse(7, 7, 4, 4, l(ramp));
      pm.line(7, 7, 7, 3, d(ramp)); // five spokes
      pm.line(7, 7, 11, 6, d(ramp));
      pm.line(7, 7, 10, 11, d(ramp));
      pm.line(7, 7, 4, 11, d(ramp));
      pm.line(7, 7, 3, 6, d(ramp));
      pm.ellipse(7, 7, 1, 1, d(ramp)); // the centre bolt
    },
  },

  /** banknote — the giant's banknote: a wide bill, a portrait, engraving */
  banknote: {
    kind: 'valuable',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(1, 5, 11, 5, l(ramp)); // the bill
      pm.frame(1, 5, 11, 5, d(ramp));
      pm.ellipse(4, 7, 1, 2, m(accent)); // a portrait oval
      pm.hline(7, 7, 4, m(ramp)); // engraving
      pm.set(10, 6, d(ramp)); // a corner numeral
      pm.set(2, 8, d(ramp));
    },
  },

  /** coin — a very small crown / loose change: a disc with a centred emboss */
  coin: {
    kind: 'valuable',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 7, 4, 4, m(GOLD));
      pm.ellipse(7, 7, 3, 3, l(GOLD));
      pm.set(7, 5, d(ramp)); // the embossed device (a diamond)
      pm.set(6, 7, d(ramp));
      pm.set(8, 7, d(ramp));
      pm.set(7, 9, d(ramp));
      pm.set(7, 7, m(ramp));
    },
  },

  /** gem — a loose gemstone: a faceted brilliant */
  gem: {
    kind: 'valuable',
    draw: ({ pm, ramp }) => {
      pm.hline(4, 4, 6, l(ramp)); // the table
      pm.line(4, 4, 2, 7, m(ramp)); // the crown
      pm.line(9, 4, 12, 7, m(ramp));
      pm.hline(2, 7, 11, m(ramp)); // the girdle
      pm.line(2, 7, 7, 12, d(ramp)); // the pavilion
      pm.line(12, 7, 7, 12, d(ramp));
      pm.line(4, 4, 7, 7, l(ramp)); // facet lines
      pm.line(9, 4, 7, 7, l(ramp));
      pm.vline(7, 7, 5, d(ramp));
    },
    light: ({ pm }) => pm.set(5, 5, C.white),
  },

  /* ---------------------------- ARMOR ---------------------------- */

  /** hat — the §A8 hat ladder: a domed crown, a band, a wide brim */
  hat: {
    kind: 'armor',
    draw: ({ pm, ramp, accent }) => {
      pm.contour(7, 2, [2, 3, 4, 4], m(ramp)); // the crown
      pm.hline(3, 5, 9, l(ramp));
      pm.hline(3, 6, 9, m(accent)); // the band
      pm.hline(1, 8, 13, m(ramp)); // the brim
      pm.hline(1, 8, 13, l(ramp));
      pm.hline(2, 9, 11, d(ramp));
    },
  },

  /** garment — poncho / vest / robe / coat (poncho stays bespoke): a drape */
  garment: {
    kind: 'armor',
    draw: ({ pm, ramp, accent }) => {
      pm.contour(7, 3, [3, 3, 4, 4, 5, 5, 6, 6, 6], m(ramp));
      pm.set(6, 3, C.outline); // the collar gap
      pm.set(8, 3, C.outline);
      pm.vline(7, 4, 8, d(ramp)); // the centre seam
      for (let i = 1; i < 9; i++) pm.set(5, 3 + i, l(ramp)); // a lit fold
      pm.hline(2, 11, 11, m(accent)); // the hem band
    },
  },

  /* ---------------------------- ARMS ---------------------------- */

  /** wrap — sweatband / scrunchie / sleeve (signatures stay bespoke): a band */
  wrap: {
    kind: 'arms',
    draw: ({ pm, ramp, accent }) => {
      pm.ellipse(7, 7, 5, 4, m(ramp)); // the band
      pm.ellipse(6, 6, 4, 3, l(ramp)); // lit upper curve
      pm.ellipse(7, 7, 2, 2, d(ramp)); // the wrist opening, in shadow
      pm.vline(4, 6, 3, m(accent)); // ribbing
      pm.vline(10, 6, 3, m(accent));
    },
  },

  /** glove — a work/keeper glove (sunday_glove stays bespoke): hand + cuff */
  glove: {
    kind: 'arms',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(4, 6, 6, 5, m(ramp)); // the palm
      pm.hline(4, 6, 6, l(ramp));
      pm.rect(4, 3, 1, 3, m(ramp)); // fingers
      pm.rect(6, 2, 1, 4, m(ramp));
      pm.rect(8, 3, 1, 3, m(ramp));
      pm.rect(3, 7, 1, 3, m(ramp)); // the thumb
      pm.hline(4, 11, 6, m(accent)); // the cuff
    },
  },

  /** bracer — a strapped wristguard (iron_wristguard stays bespoke) */
  bracer: {
    kind: 'arms',
    draw: ({ pm, ramp, accent }) => {
      // a cuff wrapping the wrist — curved top & bottom edges read the 3D wrap
      pm.rect(3, 4, 8, 6, m(ramp));
      pm.hline(4, 3, 6, m(ramp)); // curved top edge
      pm.hline(4, 10, 6, m(ramp)); // curved bottom edge
      pm.hline(3, 4, 8, l(ramp)); // top sheen
      pm.vline(3, 4, 6, l(ramp)); // lit near edge
      pm.vline(10, 4, 6, d(ramp)); // far edge in shadow
      // the buckle strap across the middle, a stud at its heart
      pm.rect(3, 6, 8, 2, m(accent));
      pm.rect(6, 5, 3, 4, d(accent)); // the buckle housing
      pm.set(7, 6, l(GOLD));
      pm.set(7, 7, m(GOLD));
    },
  },

  /* ---------------------------- CHARM ---------------------------- */

  /** pendant — a stone on a cord (the §A8 resist pendants): tinted gem */
  pendant: {
    kind: 'charm',
    draw: ({ pm, accent, tint }) => {
      // the bail — a metal loop a cord threads through (reads "wearable")
      pm.frame(6, 1, 3, 3, m(accent));
      pm.set(7, 4, d(accent)); // the link down to the stone
      // the stone — the hero of the charm; its hue is the resist element
      pm.ellipse(7, 9, 4, 4, m(tint));
      pm.ellipse(6, 8, 2, 2, l(tint));
      pm.set(8, 10, d(tint)); // a cut facet in shadow
    },
    light: ({ pm }) => pm.set(6, 8, C.white),
  },

  /** brooch — an oval frame around a centre stone, pearl bumps */
  brooch: {
    kind: 'charm',
    draw: ({ pm, accent, tint }) => {
      pm.ellipse(7, 7, 5, 4, m(accent)); // the frame
      pm.ellipse(7, 7, 3, 2, m(tint)); // the stone
      pm.ellipse(6, 6, 1, 1, l(tint));
      pm.set(7, 3, l(PAPER)); // pearl bumps
      pm.set(7, 11, l(PAPER));
      pm.set(2, 7, l(PAPER));
      pm.set(12, 7, l(PAPER));
    },
    light: ({ pm }) => pm.set(6, 6, C.white),
  },

  /** medal — the saint's medal: a ribbon over a gold disc */
  medal: {
    kind: 'charm',
    draw: ({ pm, accent }) => {
      pm.rect(5, 1, 5, 3, m(accent)); // the ribbon
      pm.set(5, 4, m(accent));
      pm.set(9, 4, m(accent));
      pm.set(7, 5, d(accent)); // the swallowtail notch
      pm.ellipse(7, 9, 3, 3, m(GOLD)); // the disc
      pm.ellipse(7, 9, 2, 2, l(GOLD));
      pm.set(7, 7, l(GOLD)); // a tiny star
      pm.set(6, 8, l(GOLD));
      pm.set(8, 8, l(GOLD));
      pm.set(7, 11, l(GOLD));
      pm.set(7, 9, m(accent));
    },
  },

  /** paw — the monkey-paw charm: a clawed little hand */
  paw: {
    kind: 'charm',
    draw: ({ pm, ramp }) => {
      pm.ellipse(7, 9, 3, 3, m(ramp)); // the palm
      pm.rect(5, 3, 1, 5, m(ramp)); // three fingers
      pm.rect(7, 2, 1, 6, m(ramp));
      pm.rect(9, 3, 1, 5, m(ramp));
      pm.set(5, 2, C.outline); // claw tips
      pm.set(7, 1, C.outline);
      pm.set(9, 2, C.outline);
      pm.rect(3, 7, 2, 2, m(ramp)); // the thumb
      pm.set(6, 9, d(ramp)); // fur shadow
      pm.set(8, 9, d(ramp));
    },
  },

  /* ---------------------------- KEY ---------------------------- */

  /** card — ATM / library card: a wide card, a stripe, a chip */
  card: {
    kind: 'key',
    draw: ({ pm, ramp }) => {
      pm.rect(1, 4, 11, 7, m(ramp));
      pm.hline(1, 4, 11, l(ramp));
      pm.frame(1, 4, 11, 7, d(ramp));
      pm.hline(1, 5, 11, d(INK)); // the magnetic stripe
      pm.rect(3, 8, 2, 2, m(GOLD)); // the chip
      pm.hline(6, 9, 5, l(ramp)); // a row of digits
    },
  },

  /** ticket — train ticket (3rd class): a stub split by a perforation */
  ticket: {
    kind: 'key',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(2, 5, 10, 5, l(ramp));
      pm.frame(2, 5, 10, 5, d(ramp));
      for (let y = 5; y <= 9; y++) if (y % 2 === 1) pm.set(8, y, d(ramp)); // perforation
      pm.ellipse(10, 7, 1, 1, d(ramp)); // a punch hole
      pm.set(10, 7, T);
      pm.hline(3, 7, 4, m(accent)); // the printing
    },
  },

  /** house_key — the Player's House Key: a bow, a shaft, the teeth */
  house_key: {
    kind: 'key',
    draw: ({ pm }) => {
      pm.ellipse(4, 5, 3, 3, m(GOLD)); // the bow
      pm.ellipse(4, 5, 1, 1, T); // the hole through it
      pm.rect(6, 6, 6, 2, m(GOLD)); // the shaft
      pm.hline(6, 6, 6, l(GOLD));
      pm.set(9, 8, m(GOLD)); // the teeth
      pm.set(11, 8, m(GOLD));
      pm.set(11, 9, m(GOLD));
    },
  },

  /** book — a bound volume (the library first edition, the duchy census): cover,
   *  spine, page block, a bookmark ribbon */
  book: {
    kind: 'valuable',
    draw: ({ pm, ramp, accent }) => {
      pm.rect(3, 2, 8, 11, m(ramp)); // the cover
      pm.vline(3, 2, 11, d(ramp)); // the spine, in shadow
      pm.vline(4, 2, 11, l(ramp)); // a lit board edge
      pm.rect(10, 3, 2, 9, l(PAPER)); // the page block (fore-edge)
      pm.hline(10, 3, 2, m(PAPER));
      for (const y of [5, 7, 9]) pm.hline(10, y, 2, d(PAPER)); // page striations
      pm.rect(5, 5, 4, 3, m(accent)); // a label / device on the cover
      pm.set(7, 1, m(RED)); // a bookmark ribbon poking from the top
      pm.set(7, 0, d(RED));
    },
  },

  /** note — the doctor's note / Rocket Manifest: a paper, lines, a dog-ear */
  note: {
    kind: 'key',
    draw: ({ pm, accent }) => {
      pm.rect(3, 2, 8, 10, l(PAPER));
      pm.frame(3, 2, 8, 10, m(EARTH));
      pm.set(10, 2, T); // the clipped corner
      pm.set(11, 2, T);
      pm.set(11, 3, T);
      pm.line(9, 2, 11, 4, d(EARTH)); // the dog-ear fold
      for (const y of [5, 7, 9]) pm.hline(5, y, 5, m(accent)); // ruled writing
    },
  },
};

/* ====================================================================== */
/* LAYER 3 — THE DETAIL VOCABULARY                                         */
/* Tiny overlays laid AFTER the fill, BEFORE outline(). What makes the      */
/* Alfajor ≠ the Empanada though both are `pastry`. Generic by design —     */
/* each works over any body. Extend as the catalogs demand new marks.       */

type DetailFn = (ctx: ForgeCtx) => void;

const DETAILS: Record<string, DetailFn> = {
  /** a small bright label patch with an ink tick (a wrapper letter) */
  label: ({ pm }) => {
    pm.rect(8, 8, 3, 2, m(PAPER));
    pm.hline(8, 8, 3, l(PAPER));
    pm.set(9, 9, C.inkSoft);
  },
  /** a contrasting stripe across the middle (mustard, sash, trim) */
  stripe: ({ pm, accent }) => pm.hline(2, 7, 11, l(accent)),
  /** three scattered seeds / sprinkles / polka dots */
  dots: ({ pm, accent }) => {
    pm.set(5, 6, l(accent));
    pm.set(8, 5, l(accent));
    pm.set(7, 9, l(accent));
  },
  /** a gem set into the piece — the per-charm hue (layer 3 ⊗ tint) */
  stone: ({ pm, tint }) => {
    pm.rect(6, 6, 2, 2, m(tint));
    pm.set(6, 6, l(tint));
    pm.set(7, 7, d(tint));
  },
  /** a bite taken out — this one's been tasted */
  bite: ({ pm, accent }) => {
    pm.ellipse(11, 4, 2, 2, T); // clear a wedge
    pm.set(9, 5, m(accent)); // a crumb
  },
  /** a cork stopper on top */
  cork: ({ pm }) => {
    pm.rect(6, 1, 3, 2, m(EARTH));
    pm.hline(6, 1, 3, l(EARTH));
  },
  /** a cap bar laid across the top */
  cap: ({ pm, accent }) => {
    pm.hline(3, 2, 8, m(accent));
    pm.hline(3, 1, 8, d(accent));
  },
  /** a wisp of steam rising (tea, fresh food) */
  steam: ({ pm }) => {
    pm.set(6, 1, m(PAPER));
    pm.set(7, 0, d(PAPER));
    pm.set(8, 1, m(PAPER));
  },
  /** a small flame tip */
  flame: ({ pm }) => {
    pm.set(7, 0, l(GOLD));
    pm.set(7, 1, l(ORANGE));
    pm.set(6, 1, m(ORANGE));
    pm.set(8, 2, m(RED));
  },
  /** a stem-and-leaf sprout (fruit, fresh produce) */
  sprout: ({ pm }) => {
    pm.vline(7, 0, 3, d(FOREST));
    pm.set(8, 1, m(GRASS));
    pm.set(9, 1, l(GRASS));
    pm.set(8, 0, m(GRASS));
  },
  /** twisted wrapper ends (a piece of candy) */
  wrapper: ({ pm, accent }) => {
    pm.set(1, 7, m(accent));
    pm.set(0, 6, l(accent));
    pm.set(0, 8, l(accent));
    pm.set(12, 7, m(accent));
    pm.set(13, 6, l(accent));
    pm.set(13, 8, l(accent));
  },
  /** a small bow / ribbon at the top */
  ribbon: ({ pm, accent }) => {
    pm.set(6, 2, m(accent));
    pm.set(8, 2, m(accent));
    pm.set(7, 3, l(accent));
    pm.set(6, 3, d(accent));
    pm.set(8, 3, d(accent));
  },
  /** a hairline crack */
  crack: ({ pm }) => {
    pm.set(7, 5, C.inkSoft);
    pm.set(8, 6, C.inkSoft);
    pm.set(7, 7, C.inkSoft);
    pm.set(8, 8, C.inkSoft);
  },
  /** a small gold star */
  star: ({ pm }) => {
    pm.set(9, 4, l(GOLD));
    pm.set(8, 5, l(GOLD));
    pm.set(9, 5, m(GOLD));
    pm.set(10, 5, l(GOLD));
    pm.set(9, 6, l(GOLD));
  },
  /** a lit fuse curling off the top-right */
  fuse: ({ pm }) => {
    pm.line(9, 3, 11, 1, d(EARTH));
    pm.set(12, 1, l(GOLD));
    pm.set(12, 0, m(GOLD));
  },
  /** a little hang tag on a string */
  tag: ({ pm }) => {
    pm.line(7, 0, 9, 2, d(EARTH));
    pm.rect(9, 2, 3, 3, m(PAPER));
    pm.set(9, 2, C.inkSoft);
  },
};

/* ====================================================================== */
/* THE FORGE                                                               */

export type Subcat = keyof typeof SILHOUETTES;
export type Detail = keyof typeof DETAILS;

export interface IconSpec {
  /** layer 1 — which family's silhouette */
  subcat: Subcat;
  /** layer 2 — the region whose palette mood the body wears */
  band: ItemBand;
  /** layer 3 — the per-item mark(s) (one, several, or none) */
  detail?: Detail | Detail[];
  /** the stable item id the ramp + accents seed off (defaults to the subcat,
   *  which is what the gallery samples use — real items pass their own id) */
  seed?: string;
  /** force the body ramp (skip the seeded pool pick) */
  ramp?: number;
  /** force the accent ramp */
  accent?: number;
  /** the detail tint (a charm gem's element hue); defaults to GOLD */
  tint?: number;
}

/** FNV-1a → 32-bit. Derives a deterministic seed from a string (the item id),
 *  NOT a map stream — icons need no world_block / levelkit re-pin (ADR-062). */
function fnv32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickRamp(pool: number[], r: () => number): number {
  return pool[Math.floor(r() * pool.length)];
}

/**
 * Forge one §A8 icon from its three layers. Pure: (subcat, band, detail, seed)
 * → identical bytes forever. An unknown subcat returns an empty canvas — the
 * both-directions gate + the distinctness test catch that before it ships.
 */
export function forgeIcon(spec: IconSpec): Pixmap {
  const pm = new Pixmap(ICON_W, ICON_H);
  const sil = SILHOUETTES[spec.subcat];
  if (!sil) return pm;

  const pool = REGION_RAMPS[spec.band] ?? REGION_RAMPS.cross;
  const seed = spec.seed ?? spec.subcat;
  const rng = (name: string): (() => number) => mulberry32((fnv32(seed) ^ fnv32(name)) >>> 0);

  const ramp = spec.ramp ?? pickRamp(pool, rng('ramp'));
  let accent = spec.accent ?? pickRamp(pool, rng('accent'));
  if (accent === ramp) accent = pool[(pool.indexOf(ramp) + 1) % pool.length];

  const ctx: ForgeCtx = { pm, ramp, accent, tint: spec.tint ?? GOLD, rng };

  sil.draw(ctx);
  const details = spec.detail === undefined ? [] : Array.isArray(spec.detail) ? spec.detail : [spec.detail];
  for (const id of details) DETAILS[id]?.(ctx);
  pm.outline(C.outline);
  sil.light?.(ctx); // pure light follows the contour (ADR-020)
  return pm;
}

/* ====================================================================== */
/* THE CATALOG + THE GALLERY                                               */

/** every subcategory the forge can stamp — the both-directions sweep target */
export const FORGE_CATALOG: Subcat[] = Object.keys(SILHOUETTES) as Subcat[];

/** the ItemKind each subcategory serves (gallery grouping + labels) */
export const SUBCAT_KIND: Record<Subcat, ItemKind> = Object.fromEntries(
  (Object.entries(SILHOUETTES) as Array<[Subcat, Silhouette]>).map(([k, s]) => [k, s.kind]),
) as Record<Subcat, ItemKind>;

/**
 * One curated sample per subcategory — a real-feeling (region × detail × tint)
 * so the `--forge` gallery proves "the forge can render every planned
 * subcategory" at 41 items, when no shipped item uses most subcats yet. Spread
 * across bands on purpose, so the gallery also reads as a palette tour.
 */
const GALLERY_SAMPLE: Record<Subcat, { band: ItemBand; detail?: Detail | Detail[]; tint?: number }> = {
  // food
  skewer: { band: 'ch1', detail: 'stripe' },
  sandwich: { band: 'ch1', detail: 'bite' },
  pastry: { band: 'ch2', detail: 'dots' },
  bowl: { band: 'ch6', detail: 'steam' },
  loaf: { band: 'ch8', detail: 'dots' },
  wedge: { band: 'ch9', detail: 'dots' },
  fruit: { band: 'ch4', detail: 'sprout' },
  bar: { band: 'ch2', detail: 'wrapper' },
  plate: { band: 'ch9', detail: 'steam' },
  cup_cold: { band: 'ch1' },
  // pp
  can: { band: 'ch1', detail: 'label' },
  bottle: { band: 'ch2', detail: 'label' },
  teacup: { band: 'ch3', detail: 'steam' },
  incense: { band: 'ch8' },
  // cure
  vial: { band: 'ch3', detail: 'cap' },
  leaf: { band: 'ch6' },
  cloth: { band: 'ch4', detail: 'label' },
  shaker: { band: 'ch1' },
  bell: { band: 'ch9', detail: 'star' },
  tape: { band: 'ch1', detail: 'label' },
  feather: { band: 'ch10' },
  // tonic
  pill: { band: 'ch3' },
  capsule: { band: 'ch7' },
  carton: { band: 'ch4', detail: 'label' },
  battery: { band: 'ch10', detail: 'star' },
  lunchbox: { band: 'ch1', detail: 'label' },
  wax_tin: { band: 'ch8', detail: 'label' },
  // battle
  firework: { band: 'ch1', detail: 'fuse' },
  string: { band: 'ch8' },
  zapper: { band: 'ch1' },
  bomb: { band: 'ch6', detail: 'fuse' },
  cushion: { band: 'ch1' },
  pouch: { band: 'ch6' },
  // valuable
  stamp: { band: 'ch1' },
  book: { band: 'ch3', detail: 'tag' },
  sack: { band: 'ch2', detail: 'label' },
  crate: { band: 'ch1' },
  idol: { band: 'ch2', detail: 'star', tint: GOLD },
  hubcap: { band: 'ch1' },
  banknote: { band: 'ch4' },
  coin: { band: 'ch5' },
  gem: { band: 'ch7', tint: MAGENTA },
  // armor
  hat: { band: 'ch6', detail: 'stripe' },
  garment: { band: 'ch2', detail: 'stripe' },
  // arms
  wrap: { band: 'ch1', detail: 'stripe' },
  glove: { band: 'ch3' },
  bracer: { band: 'ch9', detail: 'star' },
  // charm
  pendant: { band: 'ch7', detail: 'stone', tint: CYAN },
  brooch: { band: 'ch5', detail: 'stone', tint: MAGENTA },
  medal: { band: 'ch9', detail: 'ribbon' },
  paw: { band: 'ch7' },
  // key
  card: { band: 'ch1', detail: 'stripe' },
  ticket: { band: 'ch7' },
  house_key: { band: 'cross' },
  note: { band: 'ch3' },
};

export interface GallerySample {
  subcat: Subcat;
  kind: ItemKind;
  band: ItemBand;
  detail?: Detail | Detail[];
  pm: Pixmap;
}

/**
 * Render one sample of every subcategory (silhouette × a sample ramp × a sample
 * detail). The `--forge` contact sheet and the distinctness test both consume
 * this: it is the proof, at 41 items, that the forge stamps a distinct, on-theme
 * face for every planned subcategory.
 */
export function forgeGallery(): GallerySample[] {
  return FORGE_CATALOG.map((subcat) => {
    const s = GALLERY_SAMPLE[subcat];
    return {
      subcat,
      kind: SUBCAT_KIND[subcat],
      band: s.band,
      detail: s.detail,
      pm: forgeIcon({ subcat, band: s.band, detail: s.detail, tint: s.tint, seed: `gallery_${subcat}` }),
    };
  });
}
