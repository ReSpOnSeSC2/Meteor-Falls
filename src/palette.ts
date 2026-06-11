/**
 * The 64-color master palette (GAME_BIBLE §B3) — the single source of truth.
 * Organized as 16 ramps × 4 shades (0 = darkest … 3 = lightest).
 * Every sprite in the game is built from these indices; the sprite engine
 * cannot emit a color outside this table, which is what makes mixed art read
 * as one game.
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
 * ramp -> 4 hex shades, darkest first.
 *
 * S7 revision (ADR-019): the same 16 ramps re-tuned for EarthBound's daylight —
 * bright pastel mids, WARM shadows (every shade-0 leans plum/brown, never gray),
 * cream whites instead of studio white, sun-yellowed grass. The outline color
 * of every sprite in the game is INK 0, the deep plum.
 */
const RAMPS: Record<RampName, [string, string, string, string]> = {
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

/** Flat 64-entry hex palette. Index = ramp * 4 + shade. */
export const PALETTE: string[] = (Object.keys(RAMPS) as RampName[]).flatMap(
  (name) => RAMPS[name],
);

/** Palette index from ramp + shade (0 dark … 3 light). */
export function px(ramp: number, shade: 0 | 1 | 2 | 3): number {
  return ramp * 4 + shade;
}

/** Transparent marker used by the sprite engine. */
export const T = 255;

/** Frequently used indices, named. */
export const C = {
  outline: px(RAMP.INK, 0),
  inkSoft: px(RAMP.INK, 1),
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
