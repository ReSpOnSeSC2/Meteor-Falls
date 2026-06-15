/**
 * PKG-05 combat iconography: ability menu faces, tiny status badges, and the
 * exported battle flair spritelets. Phaser-free so tools and validators can
 * import it exactly like the item icon atlas.
 */
import { ABILITIES } from '../data/abilities';
import { FX_REGISTRY, type FxFamily } from '../battle/fxRegistry';
import { C, RAMP, T, px } from '../palette';
import type { AbilityDef } from '../schemas';
import { GLYPH_TOKENS, flairGlyph } from './flair';
import { Pixmap } from './pixmap';

type Draw = () => Pixmap;

const ABILITY_W = 16;
const ABILITY_H = 16;

export const STATUS_ICON_NAMES = [
  'asleep',
  'burn',
  'crying',
  'exposed',
  'frozen',
  'gilded',
  'hushed',
  'marked',
  'paralyzed',
  'puppet',
  'rattled',
  'shield',
] as const;
export type StatusIconName = (typeof STATUS_ICON_NAMES)[number];

export function abilityIconKey(id: string): string {
  return `ability_${id}`;
}

export function statusIconKey(name: string): string {
  return `status_${name}`;
}

export function battleFxIconKey(name: string): string {
  return `fx_${name}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dot(pm: Pixmap, x: number, y: number, c: number): void {
  pm.set(x, y, c);
  pm.set(x + 1, y, c);
  pm.set(x, y + 1, c);
  pm.set(x + 1, y + 1, c);
}

function tierOf(id: string, specTier?: number): number {
  if (specTier !== undefined) return Math.max(1, Math.min(5, specTier));
  if (/_x$|_s$/.test(id)) return 5;
  if (/_o$/.test(id)) return 4;
  if (/_g$/.test(id)) return 3;
  if (/_b$/.test(id)) return 2;
  return 1;
}

function rampOf(ab: AbilityDef, family: FxFamily | undefined): number {
  if (ab.heal || ab.status === 'cure' || family === 'sparkle_rain') return RAMP.GRASS;
  if (ab.status === 'shield' || ab.status === 'ward' || ab.status === 'reflect') return RAMP.CYAN;
  if (ab.status === 'puppet' || ab.status === 'hushed' || family === 'spiral' || family === 'wire_cross') return RAMP.PURPLE;
  if (ab.kind === 'gadget') return RAMP.BLUE;
  if (ab.kind === 'physical') return RAMP.EARTH;
  switch (ab.element) {
    case 'fire':
      return RAMP.ORANGE;
    case 'freeze':
      return RAMP.CYAN;
    case 'volt':
      return RAMP.GOLD;
    case 'holy':
      return RAMP.GOLD;
    case 'physical':
      return RAMP.RED;
    default:
      return RAMP.MAGENTA;
  }
}

function drawStar(pm: Pixmap, ramp: number, cx = 8, cy = 7): void {
  const m = px(ramp, 2);
  const l = px(ramp, 3);
  pm.vline(cx, cy - 5, 11, m);
  pm.hline(cx - 5, cy, 11, m);
  pm.line(cx - 4, cy - 4, cx + 4, cy + 4, m);
  pm.line(cx - 4, cy + 4, cx + 4, cy - 4, m);
  pm.set(cx, cy, l);
}

function drawFamily(pm: Pixmap, family: FxFamily | undefined, ramp: number): void {
  const d = px(ramp, 1);
  const m = px(ramp, 2);
  const l = px(ramp, 3);
  switch (family) {
    case 'flame_wave':
      pm.contour(8, 2, [0, 1, 2, 3, 3, 2, 2, 1], m);
      pm.contour(8, 5, [0, 1, 2, 1], px(RAMP.GOLD, 3));
      pm.set(6, 10, px(RAMP.RED, 1));
      break;
    case 'lattice':
      pm.vline(8, 2, 10, m);
      pm.line(4, 4, 12, 10, m);
      pm.line(4, 10, 12, 4, m);
      pm.set(8, 7, C.white);
      break;
    case 'bolt':
      pm.line(10, 2, 6, 7, l);
      pm.hline(5, 7, 5, l);
      pm.line(9, 7, 5, 13, m);
      pm.set(8, 4, C.white);
      break;
    case 'sparkle_rain':
      drawStar(pm, ramp, 8, 6);
      pm.set(4, 11, l);
      pm.set(12, 11, l);
      break;
    case 'barrier':
    case 'reflect_field':
      pm.frame(4, 3, 9, 10, m);
      pm.line(4, 3, 8, 1, l);
      pm.line(12, 3, 8, 1, l);
      pm.line(4, 12, 8, 14, d);
      pm.line(12, 12, 8, 14, d);
      if (family === 'reflect_field') pm.vline(8, 4, 8, C.white);
      break;
    case 'spiral':
      pm.ellipse(8, 8, 5, 4, d);
      pm.ellipse(8, 8, 3, 2, T);
      pm.hline(7, 8, 5, l);
      pm.set(6, 7, l);
      pm.set(9, 9, m);
      break;
    case 'screen_flash':
      drawStar(pm, RAMP.GOLD, 8, 8);
      pm.frame(3, 4, 10, 8, d);
      break;
    case 'rocket':
      pm.line(4, 12, 10, 4, m);
      pm.line(5, 12, 11, 4, l);
      pm.set(11, 3, C.white);
      pm.set(3, 13, px(RAMP.ORANGE, 3));
      pm.set(2, 14, px(RAMP.RED, 2));
      break;
    case 'scan':
      pm.frame(3, 3, 10, 10, d);
      pm.hline(4, 8, 8, l);
      pm.set(5, 5, l);
      pm.set(11, 11, l);
      break;
    case 'throw_arc':
      pm.line(3, 11, 8, 4, l);
      pm.line(8, 4, 13, 11, m);
      pm.rect(6, 9, 4, 3, d);
      break;
    case 'comet':
      pm.line(2, 2, 8, 8, px(RAMP.CYAN, 3));
      pm.line(3, 1, 9, 7, C.white);
      pm.ellipse(11, 10, 3, 3, m);
      pm.set(10, 9, l);
      break;
    case 'starsong':
      pm.vline(10, 3, 7, m);
      pm.ellipse(7, 10, 3, 2, l);
      pm.set(11, 4, l);
      pm.set(12, 5, m);
      pm.set(4, 4, px(RAMP.GOLD, 3));
      break;
    case 'siphon':
      pm.frame(3, 4, 4, 6, m);
      pm.frame(9, 4, 4, 6, m);
      pm.line(6, 10, 9, 10, l);
      pm.line(6, 4, 9, 4, l);
      break;
    case 'wire_cross':
      pm.line(3, 3, 13, 13, m);
      pm.line(13, 3, 3, 13, m);
      pm.set(5, 8, l);
      pm.set(10, 8, l);
      break;
    case 'revive':
      pm.vline(8, 3, 10, l);
      pm.hline(4, 7, 9, l);
      pm.set(8, 2, C.white);
      pm.set(5, 11, px(RAMP.GOLD, 2));
      pm.set(11, 11, px(RAMP.GOLD, 2));
      break;
    case 'pray':
    case 'pray_event':
      pm.line(6, 11, 8, 5, m);
      pm.line(10, 11, 8, 5, m);
      pm.set(8, 3, px(RAMP.GOLD, 3));
      pm.set(7, 4, C.white);
      pm.set(9, 4, C.white);
      break;
    case 'run_up':
      pm.vline(8, 3, 10, m);
      pm.contour(8, 3, [0, 1, 2, 3], l);
      break;
    case 'overnight':
      pm.ellipse(8, 7, 5, 5, px(RAMP.GOLD, 2));
      pm.ellipse(10, 5, 5, 5, T);
      pm.line(4, 12, 12, 4, px(RAMP.PAPER, 2));
      break;
    case 'surge':
    default:
      drawStar(pm, ramp);
      pm.ellipse(8, 7, 3, 3, m);
      pm.set(8, 7, C.white);
      break;
  }
}

function stampTarget(pm: Pixmap, target: AbilityDef['target']): void {
  const enemy = px(RAMP.RED, 3);
  const ally = px(RAMP.GRASS, 3);
  const self = px(RAMP.BLUE, 3);
  if (target === 'enemy') dot(pm, 12, 1, enemy);
  else if (target === 'enemies') {
    pm.set(12, 1, enemy);
    pm.set(14, 1, enemy);
    pm.set(13, 2, enemy);
  } else if (target === 'ally') dot(pm, 12, 1, ally);
  else if (target === 'allies') {
    pm.set(12, 1, ally);
    pm.set(14, 1, ally);
    pm.set(13, 2, ally);
  } else dot(pm, 12, 1, self);
}

function stampTierAndHash(pm: Pixmap, id: string, ramp: number, tier: number): void {
  for (let i = 0; i < tier; i++) pm.set(2 + i * 2, 2, px(RAMP.GOLD, 3));
  const h = hash(id);
  for (let i = 0; i < 8; i++) {
    pm.set(4 + i, 14, (h >> i) & 1 ? C.white : px(ramp, 1));
  }
}

function stampKind(pm: Pixmap, ab: AbilityDef): void {
  if (ab.heal) {
    pm.vline(2, 5, 5, px(RAMP.GRASS, 3));
    pm.hline(0, 7, 5, px(RAMP.GRASS, 3));
  }
  if (ab.kind === 'gadget') {
    pm.set(2, 11, px(RAMP.PAPER, 2));
    pm.set(3, 10, px(RAMP.PAPER, 1));
    pm.set(4, 11, px(RAMP.PAPER, 2));
  } else if (ab.kind === 'physical') {
    pm.line(1, 12, 5, 8, px(RAMP.EARTH, 2));
    pm.set(5, 8, px(RAMP.PAPER, 2));
  } else if (ab.kind === 'pray') {
    pm.set(2, 11, px(RAMP.GOLD, 3));
    pm.set(3, 10, C.white);
  }
}

function drawAbilityIcon(ab: AbilityDef): Pixmap {
  const pm = new Pixmap(ABILITY_W, ABILITY_H);
  const spec = FX_REGISTRY[ab.fx];
  const family = spec?.family;
  const ramp = rampOf(ab, family);
  drawFamily(pm, family, ramp);
  stampKind(pm, ab);
  stampTarget(pm, ab.target);
  stampTierAndHash(pm, ab.id, ramp, tierOf(ab.id, spec?.tier));
  pm.outline(C.outline);
  return pm;
}

function drawStatusBadge(name: StatusIconName): Pixmap {
  const pm = new Pixmap(8, 8);
  switch (name) {
    case 'asleep':
      pm.hline(1, 2, 4, px(RAMP.BLUE, 3));
      pm.line(4, 2, 1, 5, px(RAMP.BLUE, 3));
      pm.hline(1, 5, 4, px(RAMP.BLUE, 3));
      pm.hline(5, 1, 2, px(RAMP.CYAN, 3));
      break;
    case 'burn':
      pm.contour(4, 1, [0, 1, 2, 2, 1], px(RAMP.RED, 2));
      pm.contour(4, 3, [0, 1, 0], px(RAMP.GOLD, 3));
      break;
    case 'crying':
      pm.contour(2, 1, [0, 1, 1, 0], px(RAMP.BLUE, 2));
      pm.contour(5, 2, [0, 1, 1, 0], px(RAMP.CYAN, 2));
      break;
    case 'exposed':
      pm.frame(1, 1, 6, 6, px(RAMP.RED, 2));
      pm.set(4, 4, C.white);
      break;
    case 'frozen':
      pm.vline(4, 1, 6, px(RAMP.CYAN, 3));
      pm.line(1, 1, 6, 6, px(RAMP.CYAN, 2));
      pm.line(1, 6, 6, 1, px(RAMP.CYAN, 2));
      break;
    case 'gilded':
      pm.ellipse(4, 4, 3, 3, px(RAMP.GOLD, 2));
      pm.set(3, 3, px(RAMP.GOLD, 3));
      pm.set(5, 4, C.white);
      break;
    case 'hushed':
      pm.hline(1, 4, 6, px(RAMP.PURPLE, 3));
      pm.line(2, 2, 6, 6, px(RAMP.PURPLE, 2));
      break;
    case 'marked':
      pm.hline(1, 4, 6, px(RAMP.RED, 3));
      pm.vline(4, 1, 6, px(RAMP.RED, 3));
      pm.set(4, 4, C.white);
      break;
    case 'paralyzed':
      pm.line(5, 1, 2, 4, px(RAMP.GOLD, 3));
      pm.hline(2, 4, 4, px(RAMP.GOLD, 3));
      pm.line(5, 4, 3, 7, px(RAMP.GOLD, 2));
      break;
    case 'puppet':
      pm.ellipse(4, 5, 2, 2, px(RAMP.PURPLE, 2));
      pm.line(2, 1, 4, 4, px(RAMP.PAPER, 2));
      pm.line(6, 1, 4, 4, px(RAMP.PAPER, 2));
      break;
    case 'rattled':
      pm.line(2, 1, 5, 3, px(RAMP.ORANGE, 3));
      pm.line(5, 3, 2, 5, px(RAMP.ORANGE, 2));
      pm.line(2, 5, 5, 7, px(RAMP.ORANGE, 3));
      break;
    case 'shield':
      pm.contour(4, 1, [2, 2, 2, 2, 1, 0], px(RAMP.CYAN, 2));
      pm.vline(4, 2, 4, C.white);
      break;
  }
  pm.outline(C.outline);
  return pm;
}

export const ABILITY_ICON: Record<string, Draw> = Object.fromEntries(
  Object.values(ABILITIES).map((ab) => [ab.id, () => drawAbilityIcon(ab)]),
);

export const STATUS_ICON: Record<StatusIconName, Draw> = Object.fromEntries(
  STATUS_ICON_NAMES.map((name) => [name, () => drawStatusBadge(name)]),
) as Record<StatusIconName, Draw>;

export const BATTLE_FX_ICON: Record<string, Draw> = Object.fromEntries(
  GLYPH_TOKENS.map((name) => [name, () => flairGlyph(name).clone()]),
);
