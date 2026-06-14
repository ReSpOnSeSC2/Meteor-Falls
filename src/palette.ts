/**
 * The master palette (GAME_BIBLE §B3) — the single source of truth.
 * Organized as 16 ramps. Every sprite in the game is built from these indices;
 * the sprite engine cannot emit a color outside this table, which is what makes
 * mixed art read as one game.
 *
 * ADR-101 (THE POLISH PASS) widened every ramp from 4 shades to **6**. Detail
 * lives in the in-between tones: without them you can't shade a curve or
 * anti-alias a diagonal. The two new stops are inserted in the heavily-used
 * dark→base→light range, so the lighting model (Pixmap) has a real highlight →
 * core → shadow falloff to work with on every form.
 *
 * The widening is BY CONSTRUCTION backward-compatible (the ADR-019 rule): the
 * four authored anchor shades keep their exact hex, and `px(ramp, 0|1|2|3)`
 * still resolves to them byte-for-byte — every one of the ~3000 existing call
 * sites renders identically. New high-detail code reaches the full ramp through
 * `pxr(ramp, 0..5)` and the semantic `SH` names.
 */

export const RAMP = {
  INK: 0, // outlines, night sky, text shadow
  PAPER: 1, // whites, UI, teeth, clouds
  SKIN: 2, // fair skin
  SKIN_DEEP: 3, // deep skin
  BLOND: 4, // blond hair, straw, lemonade
  RED: 5, // caps, roofs, apples
  ORANGE: 6, // autumn, fire, Tick shell
  GOLD: 7, // coins, stars, embers
  GRASS: 8, // daylight grass greens
  FOREST: 9, // trees, checker shrubs
  CYAN: 10, // water, glass, ice
  BLUE: 11, // jeans, mail, roofs
  PURPLE: 12, // psychedelia, arcade
  MAGENTA: 13, // acid accent row (battle swirls)
  EARTH: 14, // dirt paths, wood, fur
  NIGHT: 15, // 2 AM blues
} as const;

export type RampName = keyof typeof RAMP;

/**
 * The four AUTHORED anchor shades per ramp, darkest first — the hand-tuned
 * EarthBound-daylight palette (ADR-019): bright pastel mids, WARM shadows
 * (every shade-0 leans plum/brown, never gray), cream whites instead of studio
 * white, sun-yellowed grass. The outline color of every sprite is INK 0.
 *
 * These remain the source of truth. The 6-stop ramps are derived from them, so
 * the anchors can never drift out of sync with the colors existing art expects.
 */
const ANCHORS: Record<RampName, [string, string, string, string]> = {
  INK: ['#1a1024', '#36284a', '#564a70', '#7e7298'],
  PAPER: ['#94886c', '#c4b89c', '#e8e0c4', '#fcf8e8'],
  SKIN: ['#9c5430', '#cc8454', '#f0b080', '#fcdcb0'],
  SKIN_DEEP: ['#5c3020', '#8c5430', '#b87c4c', '#dca470'],
  BLOND: ['#946c1c', '#c8a030', '#ecd058', '#fcf0a0'],
  RED: ['#7c1c2c', '#b43038', '#ec5448', '#fc9484'],
  ORANGE: ['#94440c', '#cc7420', '#f4a438', '#fcd478'],
  GOLD: ['#8c5c08', '#c4901c', '#f0c834', '#fcf080'],
  GRASS: ['#4c8834', '#74b648', '#a4dc64', '#d4f49c'],
  FOREST: ['#1c4424', '#2c6438', '#449454', '#70c074'],
  CYAN: ['#1c647c', '#2c9cb0', '#54ccd4', '#acf4f0'],
  BLUE: ['#243070', '#3454ac', '#5888ec', '#9cc0fc'],
  PURPLE: ['#3c1458', '#6c289c', '#a44cdc', '#d094f8'],
  MAGENTA: ['#841068', '#c42498', '#f054c8', '#fca4f0'],
  EARTH: ['#54341c', '#8c5c34', '#c08c58', '#ecc890'],
  NIGHT: ['#0c0c1c', '#1c2044', '#34386c', '#5064a4'],
};

/** how many shades each ramp now carries (ADR-101: was 4) */
export const SHADES_PER_RAMP = 6;

/**
 * Semantic shade indices into a 6-stop ramp (0 darkest … 5 lightest). The
 * lighting model speaks in these: a lit form runs HILITE/LIT on the light edge,
 * BASE across the core, DARK/SHADOW where it turns away. MID and LIT are the two
 * tones ADR-101 added — the in-betweens shading and anti-aliasing need.
 */
export const SH = {
  SHADOW: 0, // core shadow / occlusion (the authored darkest)
  DARK: 1, // shade side (authored shade-1)
  MID: 2, // NEW tween: dark → base
  BASE: 3, // the local color (authored shade-2)
  LIT: 4, // NEW tween: base → hilite
  HILITE: 5, // highlight (authored shade-3)
} as const;
export type Shade6 = (typeof SH)[keyof typeof SH];

/** average two #rrggbb hex strings channel-wise (the derived in-between tone) */
function mixHex(a: string, b: string): string {
  const ai = parseInt(a.slice(1), 16);
  const bi = parseInt(b.slice(1), 16);
  const ch = (shift: number): number =>
    Math.round((((ai >> shift) & 0xff) + ((bi >> shift) & 0xff)) / 2);
  return (
    '#' +
    [ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}

/**
 * The 6-stop ramps, derived from the 4 anchors:
 *   [a0, a1, mix(a1,a2), a2, mix(a2,a3), a3]
 * so the anchors land at 6-stop positions 0,1,3,5 (see FOUR_TO_SIX) and the two
 * computed tweens sit at 2 (MID) and 4 (LIT).
 */
const RAMPS6: Record<RampName, string[]> = Object.fromEntries(
  (Object.keys(ANCHORS) as RampName[]).map((name) => {
    const [a0, a1, a2, a3] = ANCHORS[name];
    return [name, [a0, a1, mixHex(a1, a2), a2, mixHex(a2, a3), a3]];
  }),
) as Record<RampName, string[]>;

/** Flat hex palette. Index = ramp * SHADES_PER_RAMP + shade. */
export const PALETTE: string[] = (Object.keys(RAMPS6) as RampName[]).flatMap(
  (name) => RAMPS6[name],
);

/** maps the legacy 4 shade slots onto the 6-stop ramp (anchors preserved) */
const FOUR_TO_SIX = [0, 1, 3, 5] as const;

/**
 * Palette index from ramp + the legacy 4-shade slot (0 dark … 3 light).
 * BY CONSTRUCTION identical to the pre-ADR-101 colors — every existing call
 * site is untouched. Reach the two new in-between tones via `pxr`.
 */
export function px(ramp: number, shade: 0 | 1 | 2 | 3): number {
  return ramp * SHADES_PER_RAMP + FOUR_TO_SIX[shade];
}

/** Palette index from ramp + the full 6-stop shade (0 dark … 5 light, see SH). */
export function pxr(ramp: number, shade: number): number {
  return ramp * SHADES_PER_RAMP + shade;
}

/** Transparent marker used by the sprite engine. */
export const T = 255;

/** Frequently used indices, named. */
export const C = {
  outline: px(RAMP.INK, 0),
  inkSoft: px(RAMP.INK, 1),
  inkAA: pxr(RAMP.INK, SH.MID), // ADR-101: the soft ink the diagonal AA pass lays
  white: px(RAMP.PAPER, 3),
  paper: px(RAMP.PAPER, 2),
  grayLight: px(RAMP.PAPER, 1),
  gray: px(RAMP.PAPER, 0),
  night: px(RAMP.NIGHT, 0),
} as const;

/** Hex -> 0xRRGGBB int for Phaser tints/fills. */
export function hexInt(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/** Palette index -> 0xRRGGBB int. */
export function colorOf(index: number): number {
  return hexInt(PALETTE[index]);
}

/** Palette index -> [r,g,b] 0..1 floats, for shader uniforms. */
export function rgbOf(index: number): [number, number, number] {
  const n = colorOf(index);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}
