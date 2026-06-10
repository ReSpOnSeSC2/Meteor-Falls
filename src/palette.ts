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

/** ramp -> 4 hex shades, darkest first */
const RAMPS: Record<RampName, [string, string, string, string]> = {
  INK: ['#16101e', '#2c2438', '#4c4260', '#746a8c'],
  PAPER: ['#8c8c94', '#bcbcc0', '#e0e0dc', '#f8f8f0'],
  SKIN: ['#8c4a2c', '#c87c50', '#eaa878', '#f8d4a8'],
  SKIN_DEEP: ['#50281c', '#7c4a2c', '#aa6c44', '#d49464'],
  BLOND: ['#8c6418', '#c49c2c', '#e8cc54', '#f8ec9c'],
  RED: ['#6c1424', '#a82434', '#e04444', '#f88880'],
  ORANGE: ['#8c3c0c', '#c46c1c', '#ec9c34', '#f8cc74'],
  GOLD: ['#7c5408', '#b8881c', '#e8c030', '#f8e87c'],
  GRASS: ['#3c7c2c', '#64aa3c', '#94d454', '#c4ec84'],
  FOREST: ['#143c24', '#245c34', '#3c8850', '#64b46c'],
  CYAN: ['#145c6c', '#2492a4', '#48c4cc', '#a0ecec'],
  BLUE: ['#1c2c64', '#2c4ca4', '#4c80e4', '#94b8f8'],
  PURPLE: ['#381054', '#642094', '#9c44d4', '#cc8cf4'],
  MAGENTA: ['#7c0c64', '#bc1c94', '#ec4cc4', '#f89cec'],
  EARTH: ['#4c3018', '#7c5430', '#b08050', '#dcb484'],
  NIGHT: ['#0a0a18', '#181c3c', '#2c3464', '#485c9c'],
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
