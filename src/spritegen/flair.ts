/**
 * THE FLAIR WEAVE — S18 Movement 23 (ADR-093). The pixel-emoji `{g:NAME}` layer.
 *
 * EarthBound's text PUNCTUATES itself with tiny hand-drawn icons: a little flame
 * on a fire hit, a burst on a SMAAASH crit, a star, a heart, a sleepy "zzz". THE
 * FLAIR WEAVE gives Meteor Falls that vocabulary — a small registry of ~8–10px,
 * palette-clean PIXEL GLYPHS that can be INLINED in any caption via a `{g:NAME}`
 * token and rendered as a tiny sprite mixed into the letter-by-letter text.
 *
 * This is the DECORATIVE forge's sibling, NOT the same thing (do not confuse the
 * two glyph systems):
 *   · THE GLYPH FORGE (M22, `glyphforge.ts`) draws decorative REGION-TRUE SCRIPT
 *     runs ON SURFACES (foreign signs / banners / inscriptions). Abstract strokes.
 *   · THE FLAIR WEAVE (M23, here) draws tiny RECOGNISABLE EMOJI-GLYPHS inlined IN
 *     TEXT — a real 🔥, a 💥 burst, a ⭐, a 💔 — flair in a line, not on a wall.
 *
 * The ADR-020 laws hold BY CONSTRUCTION: the Pixmap DSL accepts only palette
 * indices (no API takes an RGB), strokes are flat and deliberate (no scatter
 * noise), `outline()` lands LAST so each glyph lives inside one INK contour. Every
 * glyph is a fixed 11×11 cell so the mixed-run layout reserves a tidy 2 text-cells
 * for each. Phaser-free on purpose (the validator + the contact-sheet tool + the
 * slop-detector test all import it).
 *
 * §A11 SAFETY (the spine M22 obeyed, carried forward — see §A11.9 THE FLAIR LAW):
 * a glyph never carries meaning the words don't (every line is kid-readable
 * WITHOUT it); the Hush never carries a glyph; sincere beats stay clean. Those are
 * rules about PLACEMENT (enforced where flair is wired); this file is only the art.
 */
import { Pixmap } from './pixmap';
import { px, C, T, RAMP } from '../palette';
import type { Element } from '../schemas';

/** every flair glyph is an 11×11 cell — content within a 1px margin so the final
 *  `outline()` has room to land, vertically centred so it sits on the text line. */
export const GLYPH_W = 11;
export const GLYPH_H = 11;
/** a glyph reserves this many monospace text-cells (6px each) in the mixed run —
 *  2 cells = 12px comfortably holds an 11px sprite with EarthBound breathing room. */
export const GLYPH_CELLS = 2;

/* shade helpers — the iconforge / glyphforge convention (0 dark … 3 light) */
const dk = (r: number): number => px(r, 0);
const d = (r: number): number => px(r, 1);
const m = (r: number): number => px(r, 2);
const l = (r: number): number => px(r, 3);

/* ====================================================================== */
/* THE GLYPH VOCABULARY                                                     */
/* One draw fn per token. Each is structurally distinct from its siblings   */
/* (the slop-detector asserts no two share a drawing). Content lives in the  */
/* inner 9×9; `outline()` is applied centrally by flairGlyph().              */

type Draw = (pm: Pixmap) => void;

const GLYPH_DRAW: Record<string, Draw> = {
  /* ---- the battle elements (the natural home, §A11.5) ---- */

  // FIRE — a licking flame, hot core to bright tip.
  fire: (pm) => {
    pm.contour(5, 2, [0, 1, 1, 2, 2, 3, 3], d(RAMP.RED)); // outer flame body
    pm.contour(5, 4, [0, 1, 1, 2, 2], m(RAMP.ORANGE)); // mid tongue
    pm.contour(5, 6, [0, 0, 1, 1], l(RAMP.GOLD)); // hot inner core
    pm.set(5, 3, l(RAMP.GOLD));
    pm.set(3, 8, m(RAMP.ORANGE));
    pm.set(7, 8, m(RAMP.ORANGE)); // a lick to each side
  },

  // FREEZE — a six-point snow crystal.
  freeze: (pm) => {
    pm.vline(5, 1, 9, m(RAMP.CYAN));
    pm.line(2, 2, 8, 8, m(RAMP.CYAN));
    pm.line(2, 8, 8, 2, m(RAMP.CYAN));
    for (const [x, y] of [[5, 2], [5, 8], [2, 2], [8, 2], [2, 8], [8, 8]]) pm.set(x, y, l(RAMP.CYAN));
    pm.set(5, 5, l(RAMP.PAPER)); // a frozen heart
  },

  // VOLT — a jagged lightning bolt.
  volt: (pm) => {
    pm.line(6, 1, 3, 5, m(RAMP.GOLD)); // upper stroke
    pm.line(3, 5, 6, 5, m(RAMP.GOLD)); // the kink
    pm.line(6, 5, 4, 9, m(RAMP.GOLD)); // lower stroke
    pm.set(5, 3, l(RAMP.PAPER)); // a white-hot edge
    pm.set(5, 7, l(RAMP.GOLD));
  },

  // HOLY — a radiant Latin cross, the Embers' light (Mia's Starsong).
  holy: (pm) => {
    pm.vline(5, 1, 8, l(RAMP.PAPER)); // the tall stroke
    pm.hline(3, 3, 5, l(RAMP.PAPER)); // the crossbar, high (a Latin cross)
    pm.set(5, 1, l(RAMP.GOLD)); // a gilded tip
    pm.set(5, 5, l(RAMP.GOLD));
    for (const [x, y] of [[2, 1], [8, 1], [2, 8], [8, 8]]) pm.set(x, y, m(RAMP.GOLD)); // a halo of light
  },

  // SMASH — the SMAAASH-crit impact burst.
  smash: (pm) => {
    for (const [x, y] of [[5, 0], [0, 5], [10, 5], [5, 10], [1, 1], [9, 1], [1, 9], [9, 9]]) pm.set(x, y, m(RAMP.RED));
    pm.contour(5, 2, [1, 2, 3, 2, 1], m(RAMP.ORANGE)); // the spiky star body
    pm.contour(5, 3, [0, 1, 2, 1, 0], l(RAMP.GOLD));
    pm.set(5, 5, l(RAMP.PAPER)); // the white-hot centre
  },

  // SPARKLE — a four-point twinkle with two satellite dots (heals / pickups).
  sparkle: (pm) => {
    pm.vline(5, 1, 9, m(RAMP.GOLD));
    pm.hline(1, 5, 9, m(RAMP.GOLD));
    pm.set(5, 5, l(RAMP.PAPER));
    pm.set(4, 5, l(RAMP.GOLD));
    pm.set(6, 5, l(RAMP.GOLD));
    pm.set(5, 4, l(RAMP.GOLD));
    pm.set(5, 6, l(RAMP.GOLD));
    pm.set(2, 2, l(RAMP.PAPER));
    pm.set(8, 8, l(RAMP.PAPER)); // the two little satellites
  },

  /* ---- hearts & feeling ---- */

  // STAR — a solid five-point gold star.
  star: (pm) => {
    pm.contour(5, 1, [0, 0, 1], m(RAMP.GOLD)); // top point
    pm.hline(1, 4, 9, m(RAMP.GOLD)); // arms
    pm.contour(5, 5, [3, 2, 2, 1], m(RAMP.GOLD)); // body taper
    pm.set(2, 9, m(RAMP.GOLD));
    pm.set(8, 9, m(RAMP.GOLD)); // the two legs
    pm.set(5, 4, l(RAMP.GOLD));
    pm.set(5, 6, l(RAMP.GOLD)); // a lit core
  },

  // HEART — a full heart.
  heart: (pm) => {
    pm.hline(2, 3, 3, m(RAMP.RED));
    pm.hline(6, 3, 3, m(RAMP.RED)); // the two lobes
    pm.rect(2, 4, 7, 2, m(RAMP.RED));
    pm.contour(5, 6, [3, 2, 1, 0], m(RAMP.RED)); // taper to the point
    pm.set(3, 3, l(RAMP.RED));
    pm.set(4, 4, l(RAMP.PAPER)); // a highlight glint
  },

  // BROKEN_HEART — a heart split by a jagged crack.
  broken_heart: (pm) => {
    pm.hline(2, 3, 3, d(RAMP.RED));
    pm.hline(6, 3, 3, d(RAMP.RED));
    pm.rect(2, 4, 7, 2, m(RAMP.RED));
    pm.contour(5, 6, [3, 2, 1, 0], m(RAMP.RED));
    // the lightning crack down the middle, in the transparent gap
    pm.set(5, 3, T);
    pm.set(4, 4, T);
    pm.set(6, 5, T);
    pm.set(5, 6, T);
    pm.set(5, 7, T);
  },

  // TEARS — two falling droplets (Crying status).
  tears: (pm) => {
    for (const ox of [2, 6]) {
      pm.set(ox + 1, 2, m(RAMP.CYAN));
      pm.contour(ox + 1, 3, [0, 1, 1], m(RAMP.BLUE));
      pm.set(ox + 1, 4, l(RAMP.CYAN)); // a shine in each drop
      pm.set(ox + 1, 8, d(RAMP.BLUE)); // a low splash
    }
  },

  // NOTE — a single eighth note (music / the Homesong).
  note: (pm) => {
    pm.vline(7, 1, 6, m(RAMP.BLUE)); // the stem
    pm.contour(7, 1, [0, 1], m(RAMP.BLUE)); // the flag
    pm.set(8, 2, m(RAMP.BLUE));
    pm.ellipse(4, 7, 2, 1, m(RAMP.PURPLE)); // the note head
    pm.set(4, 7, l(RAMP.PURPLE));
  },

  /* ---- status & sleep ---- */

  // SKULL — a little skull.
  skull: (pm) => {
    pm.contour(5, 2, [3, 3, 3], m(RAMP.PAPER)); // the dome
    pm.rect(2, 5, 7, 2, m(RAMP.PAPER));
    pm.rect(3, 4, 2, 2, dk(RAMP.INK)); // left eye socket
    pm.rect(6, 4, 2, 2, dk(RAMP.INK)); // right eye socket
    pm.hline(3, 7, 5, m(RAMP.PAPER)); // the jaw
    pm.set(4, 8, dk(RAMP.INK));
    pm.set(6, 8, dk(RAMP.INK)); // teeth gaps
  },

  // ZZZ — the stacked sleep mark.
  zzz: (pm) => {
    // a big Z low, a small z high — the rising snore
    pm.hline(2, 5, 4, m(RAMP.BLUE));
    pm.line(5, 5, 2, 8, m(RAMP.BLUE));
    pm.hline(2, 8, 4, m(RAMP.BLUE)); // the big Z
    pm.hline(6, 1, 3, l(RAMP.CYAN));
    pm.line(8, 1, 6, 4, l(RAMP.CYAN));
    pm.hline(6, 4, 3, l(RAMP.CYAN)); // the small z
  },

  // SWEAT — one anxious sweat-bead with a motion flick.
  sweat: (pm) => {
    pm.set(5, 2, m(RAMP.CYAN));
    pm.contour(5, 3, [0, 1, 2, 2, 1], m(RAMP.BLUE)); // the fat bead
    pm.set(5, 8, m(RAMP.BLUE));
    pm.set(4, 5, l(RAMP.PAPER)); // a shine
    pm.set(8, 3, d(RAMP.CYAN)); // a little flung-off fleck
  },

  /* ---- sky & nature ---- */

  // SUN — a sun with rays.
  sun: (pm) => {
    pm.ellipse(5, 5, 2, 2, m(RAMP.GOLD));
    pm.set(5, 5, l(RAMP.GOLD));
    for (const [x, y] of [[5, 1], [5, 9], [1, 5], [9, 5], [2, 2], [8, 2], [2, 8], [8, 8]]) pm.set(x, y, m(RAMP.ORANGE));
  },

  // MOON — a crescent.
  moon: (pm) => {
    pm.ellipse(5, 5, 3, 4, m(RAMP.GOLD));
    pm.ellipse(7, 4, 3, 4, T); // bite the crescent out
    pm.set(3, 5, l(RAMP.PAPER)); // a soft glow edge
  },

  // CLOUD — a fluffy cloud (England's machine-fog, weather).
  cloud: (pm) => {
    pm.ellipse(3, 6, 2, 1, m(RAMP.PAPER));
    pm.ellipse(5, 5, 2, 2, l(RAMP.PAPER));
    pm.ellipse(8, 6, 2, 1, m(RAMP.PAPER));
    pm.hline(2, 7, 7, m(RAMP.PAPER));
    pm.set(5, 4, l(RAMP.PAPER));
  },

  // LEAF — a single leaf with a vein.
  leaf: (pm) => {
    pm.contour(3, 2, [0, 1, 1, 2, 2, 1], m(RAMP.GRASS)); // the blade (slanted)
    pm.line(3, 2, 8, 8, d(RAMP.FOREST)); // the central vein
    pm.set(5, 4, l(RAMP.GRASS));
    pm.set(6, 6, l(RAMP.GRASS));
  },

  // DROPLET — a plain water drop.
  droplet: (pm) => {
    pm.set(5, 2, m(RAMP.CYAN));
    pm.contour(5, 3, [0, 1, 2, 2, 2, 1], m(RAMP.BLUE));
    pm.set(5, 8, m(RAMP.BLUE));
    pm.set(4, 5, l(RAMP.PAPER)); // the shine
    pm.set(4, 6, l(RAMP.CYAN));
  },

  /* ---- objects of this world ---- */

  // PHONE — a handset (Save = Call Your Dad / Mom's calls).
  phone: (pm) => {
    pm.line(2, 2, 8, 8, m(RAMP.RED)); // the diagonal handset
    pm.contour(3, 1, [0, 1], m(RAMP.RED)); // the ear cup
    pm.set(2, 3, l(RAMP.PAPER));
    pm.contour(8, 7, [1, 0], m(RAMP.RED)); // the mouth cup
    pm.set(9, 9, l(RAMP.PAPER));
  },

  // COIN — a gold coin with a star face (Dad's deposits).
  coin: (pm) => {
    pm.ellipse(5, 5, 4, 4, d(RAMP.GOLD)); // the rim, darker
    pm.ellipse(5, 5, 3, 3, m(RAMP.GOLD)); // the face
    pm.set(5, 3, l(RAMP.GOLD)); // a tiny star face
    pm.hline(3, 5, 5, l(RAMP.GOLD));
    pm.set(5, 7, l(RAMP.GOLD));
    pm.set(3, 3, l(RAMP.PAPER)); // glint
  },

  // BULB — a lightbulb (Milo's idea).
  bulb: (pm) => {
    pm.ellipse(5, 4, 3, 3, m(RAMP.GOLD));
    pm.set(5, 4, l(RAMP.PAPER)); // the filament glow
    pm.hline(4, 7, 3, d(RAMP.EARTH)); // the screw base
    pm.hline(4, 8, 3, d(RAMP.EARTH));
    pm.set(5, 9, d(RAMP.EARTH));
  },

  // GEAR — a cog (Milo's machines / the Clicker).
  gear: (pm) => {
    pm.ellipse(5, 5, 3, 3, m(RAMP.PAPER));
    pm.ellipse(5, 5, 1, 1, dk(RAMP.INK)); // the hub hole
    for (const [x, y] of [[5, 1], [5, 9], [1, 5], [9, 5], [2, 2], [8, 2], [2, 8], [8, 8]]) pm.set(x, y, d(RAMP.PAPER)); // teeth
  },

  // BELL — a hand bell (the Bell Choir stem, a shopkeeper's counter bell).
  bell: (pm) => {
    pm.set(5, 1, m(RAMP.GOLD)); // the handle
    pm.contour(5, 2, [0, 1, 2, 3], m(RAMP.GOLD)); // the dome
    pm.hline(2, 6, 7, m(RAMP.GOLD));
    pm.hline(2, 7, 7, d(RAMP.GOLD)); // the rim
    pm.set(5, 8, m(RAMP.GOLD)); // the clapper
    pm.set(4, 4, l(RAMP.PAPER)); // a shine
  },

  // KEY — an old key (a deed, a locked door).
  key: (pm) => {
    pm.frame(2, 2, 4, 4, m(RAMP.GOLD)); // the bow
    pm.set(3, 3, l(RAMP.GOLD));
    pm.hline(5, 6, 4, m(RAMP.GOLD)); // the shaft
    pm.set(8, 7, m(RAMP.GOLD));
    pm.set(7, 8, m(RAMP.GOLD)); // the teeth
  },

  // GIFT — a wrapped present (the twins' gifts, a reward).
  gift: (pm) => {
    pm.rect(2, 5, 7, 4, m(RAMP.RED)); // the box
    pm.vline(5, 5, 4, l(RAMP.GOLD)); // the ribbon
    pm.hline(2, 5, 7, l(RAMP.GOLD));
    pm.set(4, 3, m(RAMP.GOLD));
    pm.set(6, 3, m(RAMP.GOLD));
    pm.set(5, 4, l(RAMP.GOLD)); // the bow
  },

  // CROWN — a little crown (Minimus, royalty, Whiskerzilla knighted).
  crown: (pm) => {
    pm.hline(2, 8, 7, m(RAMP.GOLD)); // the band
    pm.contour(2, 4, [0, 1], m(RAMP.GOLD));
    pm.contour(5, 3, [0, 1, 1], m(RAMP.GOLD));
    pm.contour(8, 4, [0, 1], m(RAMP.GOLD)); // three points
    pm.rect(2, 6, 7, 2, m(RAMP.GOLD));
    pm.set(5, 5, l(RAMP.RED)); // a jewel
    pm.set(3, 7, l(RAMP.GOLD));
  },

  /* ---- arrows & marks ---- */

  // UP_ARROW — a rising arrow (a stat up, good news).
  up_arrow: (pm) => {
    pm.vline(5, 2, 7, m(RAMP.GRASS));
    pm.contour(5, 2, [0, 1, 2, 3], m(RAMP.GRASS)); // the head
    pm.set(5, 3, l(RAMP.GRASS));
  },

  // DOWN_ARROW — a falling arrow (a stat down).
  down_arrow: (pm) => {
    pm.vline(5, 2, 7, m(RAMP.RED));
    pm.contour(5, 5, [3, 2, 1, 0], m(RAMP.RED)); // the head, pointing down
    pm.set(5, 7, l(RAMP.RED));
  },

  // QUESTION — a "?" mark (a baffled NPC).
  question: (pm) => {
    pm.contour(5, 1, [1, 2], m(RAMP.BLUE));
    pm.hline(6, 2, 2, m(RAMP.BLUE));
    pm.line(7, 3, 5, 5, m(RAMP.BLUE));
    pm.vline(5, 5, 2, m(RAMP.BLUE));
    pm.set(5, 9, l(RAMP.CYAN)); // the dot
  },

  // ELLIPSIS — a "…" mark (a thinking NPC — three dots on the baseline).
  ellipsis: (pm) => {
    // three 2px dots spaced across the line, sitting low like printed "…"
    for (const ox of [1, 4, 7]) {
      pm.rect(ox, 7, 2, 2, m(RAMP.BLUE)); // the dot body
      pm.set(ox, 7, l(RAMP.CYAN)); // a soft top-left glint
    }
  },

  // EXCLAIM — a "!" mark (surprise — the EarthBound alert).
  exclaim: (pm) => {
    pm.vline(5, 1, 6, m(RAMP.RED));
    pm.set(4, 1, m(RAMP.RED));
    pm.set(6, 2, l(RAMP.RED));
    pm.set(5, 9, m(RAMP.RED)); // the dot
  },

  // ANGER — the cartoon anger vein (an irritated obsessive).
  anger: (pm) => {
    // two crossing puff-strokes — the classic # vein
    pm.line(2, 3, 5, 2, m(RAMP.RED));
    pm.line(5, 2, 4, 5, m(RAMP.RED)); // upper-left puff
    pm.line(6, 5, 9, 4, m(RAMP.RED));
    pm.line(9, 4, 8, 7, m(RAMP.RED)); // lower-right puff
    pm.set(5, 4, l(RAMP.RED));
    pm.set(7, 6, l(RAMP.RED));
  },

  /* ---- the EarthBound food winks + this game's icons ---- */

  // CORN_DOG — Jay eats too many of these (§A3).
  corn_dog: (pm) => {
    pm.vline(8, 7, 3, m(RAMP.EARTH)); // the stick
    pm.rect(3, 2, 4, 6, m(RAMP.GOLD)); // the battered dog
    pm.contour(5, 1, [1, 1], m(RAMP.GOLD));
    pm.contour(5, 8, [1, 1], m(RAMP.GOLD)); // rounded ends
    pm.set(4, 4, l(RAMP.GOLD));
    pm.set(6, 6, d(RAMP.ORANGE)); // a fried freckle
  },

  // PICKLE — the deli wink.
  pickle: (pm) => {
    pm.ellipse(5, 5, 2, 4, m(RAMP.GRASS));
    pm.set(4, 3, l(RAMP.GRASS));
    pm.set(6, 5, d(RAMP.FOREST)); // pickle bumps
    pm.set(4, 7, d(RAMP.FOREST));
    pm.set(5, 5, l(RAMP.GRASS));
  },

  // BURGER — a stacked burger.
  burger: (pm) => {
    pm.contour(5, 2, [3, 3], m(RAMP.EARTH)); // top bun
    pm.set(3, 2, l(RAMP.GOLD));
    pm.set(6, 2, l(RAMP.GOLD)); // sesame
    pm.hline(2, 4, 7, m(RAMP.GRASS)); // lettuce
    pm.hline(2, 5, 7, d(RAMP.RED)); // patty
    pm.hline(2, 6, 7, m(RAMP.EARTH)); // bottom bun
  },

  // SODA — a fountain cup with a straw.
  soda: (pm) => {
    pm.vline(7, 1, 4, m(RAMP.CYAN)); // the straw
    pm.rect(3, 3, 5, 6, m(RAMP.RED)); // the cup
    pm.contour(5, 9, [2, 1], m(RAMP.RED)); // tapered base
    pm.hline(3, 3, 5, l(RAMP.PAPER)); // the lid line
    pm.set(4, 5, l(RAMP.PAPER)); // a shine
  },

  // COOKIE — a chocolate-chip cookie.
  cookie: (pm) => {
    pm.ellipse(5, 5, 4, 4, m(RAMP.EARTH));
    pm.set(3, 4, dk(RAMP.INK));
    pm.set(6, 3, dk(RAMP.INK));
    pm.set(7, 6, dk(RAMP.INK));
    pm.set(4, 7, dk(RAMP.INK)); // the chips
    pm.set(5, 5, l(RAMP.EARTH));
  },

  // BONE — Biscuit's bone (dogs).
  bone: (pm) => {
    pm.hline(3, 5, 5, m(RAMP.PAPER)); // the shaft
    pm.hline(3, 6, 5, m(RAMP.PAPER));
    pm.set(2, 4, m(RAMP.PAPER));
    pm.set(2, 7, m(RAMP.PAPER));
    pm.set(9, 4, m(RAMP.PAPER));
    pm.set(9, 7, m(RAMP.PAPER)); // the four knobs
    pm.set(3, 5, l(RAMP.PAPER));
  },

  // METEOR — the game's emblem, a comet with a tail. ☄️
  meteor: (pm) => {
    pm.line(1, 1, 4, 4, m(RAMP.GOLD)); // the tail streak
    pm.line(2, 1, 5, 4, l(RAMP.ORANGE));
    pm.ellipse(7, 7, 2, 2, m(RAMP.ORANGE)); // the rock head
    pm.set(7, 6, l(RAMP.GOLD));
    pm.set(6, 7, l(RAMP.PAPER)); // the bright nose
  },

  // PAW — a paw print (Biscuit, the dogs of the world).
  paw: (pm) => {
    pm.ellipse(5, 7, 2, 2, m(RAMP.EARTH)); // the pad
    pm.set(3, 4, m(RAMP.EARTH));
    pm.set(5, 3, m(RAMP.EARTH));
    pm.set(7, 4, m(RAMP.EARTH)); // three toes
    pm.set(2, 6, m(RAMP.EARTH));
    pm.set(8, 6, m(RAMP.EARTH)); // two outer toes
  },

  // BAT — Jay's baseball bat (a kid's one obsession).
  bat: (pm) => {
    pm.line(2, 8, 8, 2, m(RAMP.EARTH)); // the barrel
    pm.line(2, 9, 8, 3, d(RAMP.EARTH));
    pm.set(2, 8, dk(RAMP.EARTH)); // the knob/handle
    pm.set(8, 2, l(RAMP.EARTH)); // the fat end
    pm.set(6, 4, l(RAMP.EARTH));
  },

  // LEMON — the Lemonade Empire (Ana & Vivi).
  lemon: (pm) => {
    pm.ellipse(5, 5, 3, 2, m(RAMP.BLOND));
    pm.set(2, 5, l(RAMP.BLOND));
    pm.set(8, 5, l(RAMP.BLOND)); // the two nubs
    pm.set(4, 4, l(RAMP.PAPER)); // a shine
    pm.set(6, 6, d(RAMP.BLOND));
  },
};

/* ====================================================================== */
/* THE REGISTRY                                                             */

/**
 * THE CANONICAL VOCABULARY — the declared keyset, pinned BOTH directions against
 * GLYPH_DRAW (the validator + flair.test.ts mirror): every drawn glyph is declared
 * here, and every declared token is drawn. The vocabulary is intentionally broader
 * than current usage — it is the palette the weave (battle auto-flair + the sparse
 * dialogue pass) draws from, and extends as the weave needs.
 */
export const GLYPH_TOKENS = [
  // battle elements / results
  'fire', 'freeze', 'volt', 'holy', 'smash', 'sparkle',
  // hearts & feeling
  'star', 'heart', 'broken_heart', 'tears', 'note',
  // status & sleep
  'skull', 'zzz', 'sweat',
  // sky & nature
  'sun', 'moon', 'cloud', 'leaf', 'droplet',
  // objects of this world
  'phone', 'coin', 'bulb', 'gear', 'bell', 'key', 'gift', 'crown',
  // arrows & marks
  'up_arrow', 'down_arrow', 'question', 'exclaim', 'ellipsis', 'anger',
  // the EarthBound food winks + this game's icons
  'corn_dog', 'pickle', 'burger', 'soda', 'cookie', 'bone', 'meteor', 'paw', 'bat', 'lemon',
] as const;

export type GlyphName = (typeof GLYPH_TOKENS)[number];

/** is this a real flair glyph? (the runtime guard for the mixed renderer) */
export function isGlyph(name: string): name is GlyphName {
  return Object.prototype.hasOwnProperty.call(GLYPH_DRAW, name);
}

/** the names actually DRAWN by the registry — the implementation side of the
 *  both-directions pin (GLYPH_TOKENS ⇄ GLYPH_DRAW), checked by the validator's
 *  `flair` gate and the flair.test.ts mirror: every declared token is drawn, and
 *  every drawn glyph is declared. */
export function glyphRegistryNames(): string[] {
  return Object.keys(GLYPH_DRAW);
}

const CACHE = new Map<string, Pixmap>();

/**
 * Forge one flair glyph — deterministic, palette-clean, outlined LAST (ADR-020).
 * Memoised: a glyph reproduces forever and boot draws each exactly once. An
 * unknown name returns a small "missing" box — the both-directions gate catches
 * that before it ships, but the renderer never crashes on it.
 */
export function flairGlyph(name: string): Pixmap {
  const hit = CACHE.get(name);
  if (hit) return hit;
  const pm = new Pixmap(GLYPH_W, GLYPH_H);
  const draw = GLYPH_DRAW[name];
  if (!draw) {
    pm.frame(2, 2, 7, 7, m(RAMP.MAGENTA)); // a loud "missing glyph" tile
    pm.set(5, 5, m(RAMP.MAGENTA));
  } else {
    draw(pm);
  }
  pm.outline(C.outline);
  CACHE.set(name, pm);
  return pm;
}

/** the Phaser texture key a flair glyph registers under (index.ts), beside the
 *  M22 `glyph_<area>` decorative-script textures — a DISTINCT prefix so the two
 *  glyph systems can never collide in the texture cache. */
export function flairGlyphKey(name: string): string {
  return `flair_${name}`;
}

/** a glyph's native pixel size (the mixed-run glue centres the sprite by it). */
export function glyphSize(name: string): { w: number; h: number } {
  const pm = flairGlyph(name);
  return { w: pm.w, h: pm.h };
}

/** how many monospace text-cells a glyph reserves in the mixed run (always 2 for
 *  the 11px cell; computed from the art so a wider future glyph stays honest). */
export function glyphCells(name: string): number {
  return Math.max(1, Math.ceil(flairGlyph(name).w / 6));
}

/* ====================================================================== */
/* THE BATTLE AUTO-FLAIR MAPS                                               */
/* BattleScene appends these by the move's ELEMENT / RESULT — never hand-    */
/* typed per enemy (§A11.5). Kept sparse: most battle lines stay plain.      */

/** an elemental hero attack punctuates its cast line with its element's glyph. */
export const FLAIR_BY_ELEMENT: Partial<Record<Element, GlyphName>> = {
  fire: 'fire',
  freeze: 'freeze',
  volt: 'volt',
  holy: 'holy',
};

/** a battle RESULT punctuates its line: a SMAAASH crit, a heal, a foe's KO. */
export const FLAIR_BY_RESULT = {
  smash: 'smash',
  heal: 'sparkle',
  ko: 'star',
} as const;

export type FlairResult = keyof typeof FLAIR_BY_RESULT;
