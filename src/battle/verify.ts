/**
 * THE GREAT VERIFICATION (S18 M24, ADR-094) — pure, headless helpers that read
 * the §A9 combat curves BY THE NUMBERS: per-hero growth, the Vibe ability
 * ladders' power/PP tiers, and boss HP vs TIME-TO-KILL at the §A6 target levels.
 *
 * `npm run balance` (tools/balance-sim.ts) PRINTS these for a human to read by
 * eye; `src/battle/verify.test.ts` PINS them. There is NO Phaser and NO rng
 * here — only EXPECTED values (the mean of each rng'd formula), so the read is
 * deterministic and unit-testable. The model is deliberately CONSERVATIVE (base
 * stats, no equipped weapons), so a boss that falls in a fair number of turns
 * HERE falls at least as fast in the real, geared fight — the verification is a
 * lower bound on the party and never overclaims.
 */
import type { AbilityDef, HeroId } from '../schemas';
import { statsAtLevel, maxHpAtLevel, maxPpAtLevel, unlockedAbilities } from '../data/heroes';
import { ABILITIES } from '../data/abilities';
import { AWAKENINGS } from '../data/awakenings';
import { ENEMIES } from '../data/enemies';
import { CHAPTER_MANIFESTS } from '../data/chapters';
import { smashChance, WEAK_MUL } from './formulas';

/* ----------------------------- expected damage ----------------------------- */

/** the MEAN physical swing: physicalDamage's 0.85+rng·0.3 averages to 1.0, and
 *  a SMAAASH (Guts-driven) lands its bigger hit some of the time. No weapon — a
 *  conservative base-stat read. */
export function expectedPhysical(offense: number, defense: number, guts: number): number {
  const normal = Math.max(1, offense * 2 - defense);
  const smash = Math.max(2, offense * 3 - Math.floor(defense / 2));
  const p = smashChance(guts); // no luck term — the base curve
  return Math.round((1 - p) * normal + p * smash);
}

/** the MEAN damage of one cast of a damaging ability against a single target
 *  (a boss). vibeDamage/gadgetDamage both average their rng to 1.0; a matching
 *  boss weakness multiplies (applyElement's WEAK_MUL). Heals and pure-status
 *  casts return 0 — they are not damage. */
export function expectedAbilityDamage(ab: AbilityDef, vibe: number, bossWeak: ReadonlySet<string>): number {
  if (ab.heal || ab.power <= 0) return 0;
  if (ab.target !== 'enemy' && ab.target !== 'enemies') return 0;
  // Milo's gadgets read OFF power alone (no Vibe); Vibe abilities scale by Vibe
  let dmg = ab.kind === 'gadget' ? ab.power : ab.power * (1 + vibe / 60);
  if (ab.element && bossWeak.has(ab.element)) dmg *= WEAK_MUL;
  return Math.round(dmg);
}

/* --------------------------- ability availability -------------------------- */

/**
 * The level by which each AWAKENING (ADR-035) is earned — its story beat sits
 * in a chapter, so the awakened power is "available by" roughly that chapter's
 * level. Conservative (end-of-chapter), so the DPR read never grants a power
 * before the party plausibly has it. Validator-pinned both directions
 * (`verify` section) so it can't drift as awakenings are added.
 */
export const AWAKENING_LEVEL: Record<string, number> = {
  old_light: 1, // Jay, Surge α — Glint's crater prophecy (Ch.1 open)
  last_spark: 1, // Jay, Lifeup α — the porch (Ch.1 open)
  first_listen: 6, // Mia, Fire α — the Locket in the holding room (Ch.1)
  the_first_heartlight: 8, // Mia, Starsong α — the first Heartlight (Ch.1 close)
  cold_reads: 13, // Mia, Freeze α — the HOLLOW reveal (Ch.2 boss)
  the_wall_that_answers: 13, // Jay, Power Shield Σ — the Idol's last blow (Ch.2 boss)
  the_first_borrow: 18, // Jay, Mind Warp α — Milo's join (Ch.3)
  the_thunder_snore: 20, // Mia, Vibe Volt α — the Whisperwig surfaces (Ch.4)
  the_borrowed_voice: 35, // Jay, Mind Warp Ω — the hollowed crowd (mid-late)
  the_match_that_stays_lit: 46, // Mia, Fire Σ — the flame that stays lit (late)
  she_hears_it_all: 46, // Mia, Magnet Σ — the whole field's song (late)
  trial_of_the_mute_mountain: 46, // Dorin, Comet Ω — the Trial (Ch.9)
  the_whole_sky: 52, // Jay, Surge Σ — the Mars approach (Ch.10)
};

/** every ability a hero can USE by level L: level unlocks (level ≤ L) PLUS any
 *  awakening whose AWAKENING_LEVEL ≤ L. The §A3 availability rule, read for
 *  verification — `availableAbilities` needs a live flag map; this is its pure,
 *  level-only mirror. */
export function abilitiesByLevel(heroId: HeroId, level: number): AbilityDef[] {
  const ids = new Set(unlockedAbilities(heroId, level));
  for (const a of Object.values(AWAKENINGS)) {
    if (a.hero === heroId && (AWAKENING_LEVEL[a.id] ?? 999) <= level) ids.add(a.ability);
  }
  const out: AbilityDef[] = [];
  for (const id of ids) {
    const ab = ABILITIES[id];
    if (ab) out.push(ab);
  }
  return out;
}

/** a hero's BEST AFFORDABLE single-cast nuke at level L (the strongest damaging
 *  ability whose PP ≤ their max PP — so low levels can only afford α/β and the
 *  96-PP Surge Σ filters itself out until the bar is deep enough). null if the
 *  hero has no affordable damaging ability (a pure-physical turn). */
export function heroBestNuke(
  heroId: HeroId,
  level: number,
  bossWeak: ReadonlySet<string>,
): { ability: AbilityDef; dmg: number } | null {
  const vibe = statsAtLevel(heroId, level).vibe;
  const maxPp = maxPpAtLevel(heroId, level);
  let best: { ability: AbilityDef; dmg: number } | null = null;
  for (const ab of abilitiesByLevel(heroId, level)) {
    if (ab.pp > maxPp) continue; // can't afford a single cast
    const dmg = expectedAbilityDamage(ab, vibe, bossWeak);
    if (dmg > 0 && (!best || dmg > best.dmg)) best = { ability: ab, dmg };
  }
  return best;
}

/* ------------------------------- per-round DPR ----------------------------- */

/** how many rounds a caster sustains its best nuke before its PP runs dry, then
 *  it falls back to physical. Amortised over a typical boss fight so a caster's
 *  per-round damage is HONEST (not "nuke every turn forever"). */
export const SUSTAIN_ROUNDS = 8;

/** one hero's expected damage per round against a boss (base stats, no weapon):
 *  a caster opens with nukes until its PP budget is spent, then swings; a
 *  pure-physical hero just swings. `bossDef` reduces only the PHYSICAL term
 *  (Vibe ignores defense). Conservative — real heroes carry weapons. */
export function heroDamagePerRound(
  heroId: HeroId,
  level: number,
  bossWeak: ReadonlySet<string>,
  bossDef: number,
): number {
  const s = statsAtLevel(heroId, level);
  const phys = expectedPhysical(s.offense, bossDef, s.guts);
  const nuke = heroBestNuke(heroId, level, bossWeak);
  if (!nuke || nuke.dmg <= phys) return phys;
  const maxPp = maxPpAtLevel(heroId, level);
  const casts = Math.floor(maxPp / Math.max(1, nuke.ability.pp));
  const nukeRounds = Math.min(casts, SUSTAIN_ROUNDS);
  const swingRounds = SUSTAIN_ROUNDS - nukeRounds;
  return Math.round((nukeRounds * nuke.dmg + swingRounds * phys) / SUSTAIN_ROUNDS);
}

/* ------------------------------ party + bosses ----------------------------- */

/** §A3 join points — who is in the party when each chapter's BOSS is fought.
 *  Jay is SOLO for the Tick (Hickory Hill crater, before the bus to Brickton);
 *  Mia joins Ch.1's close; Milo Ch.3; Pippa AFTER Whiskerzilla (so she is in
 *  from Ch.6); Dorin joins late in Ch.9, so this counts him only from Ch.10.
 *  Conservative: it never over-counts the party for a boss. */
export const BOSS_PARTY: Record<number, HeroId[]> = {
  1: ['rex'],
  2: ['rex', 'faye'],
  3: ['rex', 'faye', 'milo'],
  4: ['rex', 'faye', 'milo'],
  5: ['rex', 'faye', 'milo'],
  6: ['rex', 'faye', 'milo', 'pippa'],
  7: ['rex', 'faye', 'milo', 'pippa'],
  8: ['rex', 'faye', 'milo', 'pippa'],
  9: ['rex', 'faye', 'milo', 'pippa'],
  10: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
};

export interface BossCheck {
  chapter: number;
  bossId: string;
  name: string;
  hp: number;
  level: number;
  party: HeroId[];
  /** total party expected damage per round (base stats, no weapons) */
  partyDpr: number;
  /** rounds to fell the boss at that DPR — the conservative read */
  ttk: number;
  /** the boss's §A7 weaknesses the party can exploit (landed bosses only) */
  weakness: string[];
}

/** the boss's exploitable weaknesses — read from the LANDED enemy data where it
 *  exists (Tick/Grin), else empty (an unlanded boss has no moveset yet, so the
 *  read stays conservative — no weakness multiplier). */
function bossWeakness(bossId: string): Set<string> {
  return new Set(ENEMIES[bossId]?.weakness ?? []);
}

/** the §A6 boss check at its target level: party DPR vs HP → TTK. Pulls HP +
 *  target level straight from CHAPTER_MANIFESTS (the canon §A6 ladder). */
export function bossCheck(chapter: number): BossCheck {
  const m = CHAPTER_MANIFESTS[String(chapter)];
  const boss = m.boss;
  const level = m.targetLevel;
  const party = BOSS_PARTY[chapter] ?? ['rex'];
  const weak = bossWeakness(boss.id);
  // §A7 confirms boss defense tracks its level (Tick def 7 @ L7, Grin def 14 @
  // L13) — a uniform, validated proxy for the unlanded bosses' physical term.
  const bossDef = level;
  const partyDpr = party.reduce((a, h) => a + heroDamagePerRound(h, level, weak, bossDef), 0);
  const ttk = Math.max(1, Math.ceil(boss.hp / Math.max(1, partyDpr)));
  return {
    chapter,
    bossId: boss.id,
    name: boss.name,
    hp: boss.hp,
    level,
    party,
    partyDpr,
    ttk,
    weakness: [...weak],
  };
}

/** every §A6 boss, Ch.1→10, checked at its target level. */
export function allBossChecks(): BossCheck[] {
  return Object.keys(CHAPTER_MANIFESTS)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map(bossCheck);
}

/* ------------------------------ growth + ladders --------------------------- */

export interface GrowthRow {
  level: number;
  hp: number;
  pp: number;
  offense: number;
  defense: number;
  speed: number;
  guts: number;
  vibe: number;
  luck: number;
}

/** a hero's full stat line at a level — the growth-curve report row. */
export function growthRow(heroId: HeroId, level: number): GrowthRow {
  const s = statsAtLevel(heroId, level);
  return {
    level,
    hp: maxHpAtLevel(heroId, level),
    pp: maxPpAtLevel(heroId, level),
    offense: s.offense,
    defense: s.defense,
    speed: s.speed,
    guts: s.guts,
    vibe: s.vibe,
    luck: s.luck,
  };
}

export interface LadderRung {
  id: string;
  name: string;
  tier: string; // α / β / γ / Ω / Σ
  pp: number;
  power: number;
}

/** the α→β→γ→Ω→Σ tier of a Vibe ability id, read off its name suffix. */
export function tierOf(ab: AbilityDef): string {
  const n = ab.name;
  if (/\bSigma$/.test(n)) return 'Σ';
  if (/\bOmega$/.test(n)) return 'Ω';
  if (/\bGamma$/.test(n)) return 'γ';
  if (/\bBeta$/.test(n)) return 'β';
  if (/\bAlpha$/.test(n)) return 'α';
  return '·';
}

/** a named Vibe ladder (e.g. 'Vibe Surge', 'Vibe Fire') as ordered rungs, so
 *  the report shows PP cost vs power tier and the α→β awakening LEAP (§A3/ADR-035
 *  promises ≈2.6×). Filters to damaging rungs of one base name, α→Σ order. */
export function ladder(baseName: string): LadderRung[] {
  const order = ['α', 'β', 'γ', 'Ω', 'Σ'];
  return Object.values(ABILITIES)
    .filter((a) => a.power > 0 && !a.heal && a.name.startsWith(baseName + ' '))
    .map((a) => ({ id: a.id, name: a.name, tier: tierOf(a), pp: a.pp, power: a.power }))
    .filter((r) => order.includes(r.tier))
    .sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));
}
