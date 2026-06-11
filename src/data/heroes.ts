/**
 * The Four Heroes — GAME_BIBLE §A3. All four are fully defined (visible in
 * Sprite Lab); Mia, Milo and Dorin join in their canon chapters.
 * Types are z.infer'd from src/schemas (S5) so the compile-time shape and the
 * runtime validation cannot drift; `import type` keeps zod out of the bundle.
 */
import type { HeroDef, HeroId, Stats } from '../schemas';

export type { HeroDef, HeroId } from '../schemas';

export const HEROES: Record<HeroId, HeroDef> = {
  rex: {
    id: 'rex',
    name: 'Rex',
    epithet: 'a quiet kid from Otterbrook',
    weapon: 'bats',
    base: { offense: 6, defense: 4, speed: 5, guts: 8, vibe: 6, luck: 5 },
    growth: { offense: 2.1, defense: 1.7, speed: 1.4, guts: 1.2, vibe: 1.8, luck: 0.8 },
    hp: { base: 30, lin: 6.5, quad: 0.08 },
    pp: { base: 10, lin: 2.4, quad: 0.03 },
    unlocks: [
      { level: 1, ability: 'vibe_surge_a' },
      { level: 3, ability: 'lifeup_a' },
      { level: 6, ability: 'hypno_a' },
      { level: 9, ability: 'shield_a' },
      { level: 16, ability: 'vibe_surge_b' },
      { level: 20, ability: 'lifeup_b' },
      { level: 24, ability: 'flash_a' },
      { level: 26, ability: 'teleport_a' },
      { level: 31, ability: 'vibe_surge_g' },
      { level: 33, ability: 'shield_s' },
      { level: 38, ability: 'lifeup_g' },
      { level: 47, ability: 'vibe_surge_o' },
    ],
  },
  faye: {
    id: 'faye',
    name: 'Mia',
    epithet: 'the girl who prays',
    weapon: 'frying pans',
    base: { offense: 4, defense: 4, speed: 6, guts: 6, vibe: 8, luck: 7 },
    growth: { offense: 1.6, defense: 1.5, speed: 1.7, guts: 1.0, vibe: 2.2, luck: 1.1 },
    hp: { base: 26, lin: 5.6, quad: 0.07 },
    pp: { base: 14, lin: 3.2, quad: 0.04 },
    unlocks: [
      { level: 1, ability: 'vibe_fire_a' },
      { level: 1, ability: 'pray' },
      { level: 4, ability: 'vibe_freeze_a' },
      { level: 8, ability: 'magnet_a' },
      { level: 10, ability: 'vibe_volt_a' },
      { level: 15, ability: 'vibe_fire_b' },
      { level: 18, ability: 'vibe_freeze_b' },
      { level: 26, ability: 'vibe_volt_b' },
      { level: 29, ability: 'vibe_fire_g' },
      { level: 32, ability: 'vibe_freeze_g' },
      { level: 40, ability: 'vibe_volt_g' },
      { level: 44, ability: 'vibe_fire_o' },
      { level: 46, ability: 'vibe_freeze_o' },
    ],
  },
  milo: {
    id: 'milo',
    name: 'Milo',
    epithet: 'gadget genius, tea snob',
    weapon: 'air rifles',
    base: { offense: 5, defense: 5, speed: 7, guts: 5, vibe: 0, luck: 6 },
    growth: { offense: 1.9, defense: 1.8, speed: 1.9, guts: 0.9, vibe: 0, luck: 1.0 },
    hp: { base: 28, lin: 6.0, quad: 0.07 },
    pp: { base: 0, lin: 0, quad: 0 },
    unlocks: [
      { level: 1, ability: 'spy' },
      { level: 1, ability: 'repair' },
      { level: 1, ability: 'bottle_rocket' },
      { level: 14, ability: 'big_bottle_rocket' },
      { level: 28, ability: 'multi_bottle_rocket' },
    ],
  },
  dorin: {
    id: 'dorin',
    name: 'Dorin',
    epithet: 'of Stone Brow Monastery',
    weapon: 'prayer beads',
    base: { offense: 7, defense: 6, speed: 8, guts: 7, vibe: 7, luck: 4 },
    growth: { offense: 2.2, defense: 1.9, speed: 2.0, guts: 1.1, vibe: 2.0, luck: 0.7 },
    hp: { base: 34, lin: 7.0, quad: 0.09 },
    pp: { base: 12, lin: 2.8, quad: 0.035 },
    unlocks: [
      { level: 1, ability: 'vibe_comet_a' },
      { level: 1, ability: 'mirror' },
      { level: 1, ability: 'healing_a' },
      { level: 40, ability: 'brainjam_a' },
      { level: 44, ability: 'healing_g' },
      { level: 50, ability: 'brainjam_o' },
      { level: 52, ability: 'vibe_comet_o' },
    ],
  },
};

export function statsAtLevel(id: HeroId, level: number): Stats {
  const d = HEROES[id];
  const l = level - 1;
  const stat = (b: number, g: number): number => Math.round(b + g * l);
  return {
    offense: stat(d.base.offense, d.growth.offense),
    defense: stat(d.base.defense, d.growth.defense),
    speed: stat(d.base.speed, d.growth.speed),
    guts: stat(d.base.guts, d.growth.guts),
    vibe: stat(d.base.vibe, d.growth.vibe),
    luck: stat(d.base.luck, d.growth.luck),
  };
}

export function maxHpAtLevel(id: HeroId, level: number): number {
  const c = HEROES[id].hp;
  const l = level - 1;
  return Math.round(c.base + c.lin * l + c.quad * l * l);
}

export function maxPpAtLevel(id: HeroId, level: number): number {
  const c = HEROES[id].pp;
  const l = level - 1;
  return Math.round(c.base + c.lin * l + c.quad * l * l);
}

/** abilities available at a given level */
export function unlockedAbilities(id: HeroId, level: number): string[] {
  return HEROES[id].unlocks.filter((u) => u.level <= level).map((u) => u.ability);
}
