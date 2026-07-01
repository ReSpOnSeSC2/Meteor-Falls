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
import {
  smashChance,
  WEAK_MUL,
  RESIST_MUL,
  HOLY_PIERCE_MUL,
  BREAK_MUL,
  composureChip,
  defaultComposure,
  DEFAULT_BOSS_BREAK_RESIST,
} from './formulas';
import { ITEMS } from '../data/items';

/** shared empty exclusion set — the default for the un-gated DPR read */
const NO_EXCLUDE: ReadonlySet<string> = new Set();

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
 *  (a boss). vibeDamage/gadgetDamage both average their rng to 1.0; the element
 *  the foe's COLOR dictates the swing (applyElement): a weakness multiplies
 *  (WEAK_MUL), a resist halves (RESIST_MUL, or HOLY_PIERCE_MUL for holy), an
 *  absorb deals nothing (it heals the foe — never the pick). Heals and
 *  pure-status casts return 0 — they are not damage. `bossResist`/`bossAbsorb`
 *  default empty so the un-coloured read (and the finale) are unchanged. */
export function expectedAbilityDamage(
  ab: AbilityDef,
  vibe: number,
  bossWeak: ReadonlySet<string>,
  bossResist: ReadonlySet<string> = NO_EXCLUDE,
  bossAbsorb: ReadonlySet<string> = NO_EXCLUDE,
  targetMaxHp = 0,
): number {
  if (ab.heal || (ab.power <= 0 && !ab.pctMaxHp)) return 0;
  if (ab.target !== 'enemy' && ab.target !== 'enemies') return 0;
  // an ABSORBED element deals no damage (it HEALS the foe) — the model never picks it
  if (ab.element && bossAbsorb.has(ab.element)) return 0;
  // Milo's gadgets read OFF power alone (no Vibe); Vibe abilities scale by Vibe
  let dmg = ab.kind === 'gadget' ? ab.power : ab.power * (1 + vibe / 60);
  if (ab.element && bossWeak.has(ab.element))
    dmg *= WEAK_MUL; // the RIGHT element — the big swing that should decide the pick
  else if (ab.element && bossResist.has(ab.element))
    dmg *= ab.element === 'holy' ? HOLY_PIERCE_MUL : RESIST_MUL; // the WRONG element (holy still pierces)
  // ADR-134 — the flat siege gets a %-max-HP bite so Milo SCALES late (element-agnostic,
  // added after the multiplier — it is armour-piercing, not a spell).
  if (ab.pctMaxHp) dmg += Math.floor(targetMaxHp * ab.pctMaxHp);
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
  exclude: ReadonlySet<string> = NO_EXCLUDE,
  bossResist: ReadonlySet<string> = NO_EXCLUDE,
  bossAbsorb: ReadonlySet<string> = NO_EXCLUDE,
  targetMaxHp = 0,
): { ability: AbilityDef; dmg: number } | null {
  const vibe = statsAtLevel(heroId, level).vibe;
  const maxPp = maxPpAtLevel(heroId, level);
  let best: { ability: AbilityDef; dmg: number } | null = null;
  for (const ab of abilitiesByLevel(heroId, level)) {
    if (exclude.has(ab.id)) continue; // a withheld ultimate (Comet Ω) — §A6 finale variant
    if (ab.pp > maxPp) continue; // can't afford a single cast
    // the pick reads the foe's COLOR: a resisted nuke loses to a neutral one, an
    // absorbed nuke scores 0 — so the model naturally rotates onto the right element.
    const dmg = expectedAbilityDamage(ab, vibe, bossWeak, bossResist, bossAbsorb, targetMaxHp);
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
  exclude: ReadonlySet<string> = NO_EXCLUDE,
  bossResist: ReadonlySet<string> = NO_EXCLUDE,
  bossAbsorb: ReadonlySet<string> = NO_EXCLUDE,
  targetMaxHp = 0,
): number {
  const s = statsAtLevel(heroId, level);
  const phys = expectedPhysical(s.offense, bossDef, s.guts);
  const nuke = heroBestNuke(heroId, level, bossWeak, exclude, bossResist, bossAbsorb, targetMaxHp);
  if (!nuke || nuke.dmg <= phys) return phys;
  const maxPp = maxPpAtLevel(heroId, level);
  // ADR-134 — a 0-PP gadget (Milo's tech) is FREE: it is castable EVERY round, not
  // PP-gated. The old floor(maxPp/pp) gave Milo ZERO nuke rounds (maxPp 0 ⇒ physical
  // only), which is why his siege looked like dead weight in the model. Free tech
  // sustains the whole fight — that is exactly what makes the %-max-HP rider matter.
  const casts = nuke.ability.pp === 0 ? SUSTAIN_ROUNDS : Math.floor(maxPp / nuke.ability.pp);
  const nukeRounds = Math.min(casts, SUSTAIN_ROUNDS);
  const swingRounds = SUSTAIN_ROUNDS - nukeRounds;
  return Math.round((nukeRounds * nuke.dmg + swingRounds * phys) / SUSTAIN_ROUNDS);
}

/* ------------------------------ party + bosses ----------------------------- */

/** §A3 join points — who is in the party when each chapter's BOSS is fought.
 *  Jay is SOLO for the Tick (Hickory Hill crater, before the bus to Brickton);
 *  Mia joins Ch.1's close; Milo Ch.3; Pippa AFTER Whiskerzilla (so she is in from
 *  Ch.6). ADR-125/133: Dorin joins MID-journey too — L26 at Ch.5-end (Minimus,
 *  OverworldScene.ts) and travels through Ch.10 — so he is counted from Ch.6, not
 *  the old Ch.9/10 assumption. Including him from Ch.6 is what resolves the former
 *  Ch.9 conservative TTK flag (the model used to omit the powerhouse). Conservative:
 *  it never over-counts the party for a boss. */
export const BOSS_PARTY: Record<number, HeroId[]> = {
  1: ['rex'],
  2: ['rex', 'faye'],
  3: ['rex', 'faye', 'milo'],
  4: ['rex', 'faye', 'milo'],
  5: ['rex', 'faye', 'milo'],
  6: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
  7: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
  8: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
  9: ['rex', 'faye', 'milo', 'pippa', 'dorin'],
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

/** the boss's elemental RESISTS (ADR-134) — the colours that hit for ~×0.4, so
 *  the party must rotate OFF them. Empty for an unlanded/uncoloured boss. */
function bossResistance(bossId: string): Set<string> {
  return new Set(ENEMIES[bossId]?.resists ?? []);
}

/** the boss's ABSORBED colours (ADR-134) — the signature-foe elements that deal
 *  0 and heal the foe. Empty for all but a handful of set-piece enemies. */
function bossAbsorbs(bossId: string): Set<string> {
  return new Set(ENEMIES[bossId]?.absorbs ?? []);
}

/** the §A6 boss check at its target level: party DPR vs HP → TTK. Pulls HP +
 *  target level straight from CHAPTER_MANIFESTS (the canon §A6 ladder). */
export function bossCheck(chapter: number): BossCheck {
  const m = CHAPTER_MANIFESTS[String(chapter)];
  const boss = m.boss;
  const level = m.targetLevel;
  const party = BOSS_PARTY[chapter] ?? ['rex'];
  const weak = bossWeakness(boss.id);
  const resist = bossResistance(boss.id);
  const absorb = bossAbsorbs(boss.id);
  // §A7 confirms boss defense tracks its level (Tick def 7 @ L7, Grin def 14 @
  // L13) — a uniform, validated proxy for the unlanded bosses' physical term.
  const bossDef = level;
  const partyDpr = party.reduce(
    (a, h) => a + heroDamagePerRound(h, level, weak, bossDef, NO_EXCLUDE, resist, absorb, boss.hp),
    0,
  );
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

/* --------------------- ADR-134: THE READ vs THE SPAM ----------------------- */

/** how many rounds a party spends CHIPPING composure before it earns a break —
 *  conservative (a party with mark + control breaks faster). */
export const BREAK_SETUP_ROUNDS = 3;

/** the effective DPR of a party that PLAYS THE BREAK: it chips for `setup` rounds
 *  at its base DPR, then bursts ONE round at ×BREAK_MUL, and repeats. Bosses carry
 *  a breakResist wall so their setup is longer. A conservative amortised uplift —
 *  the real ×2 window is bigger when the burst nuke lands inside it. */
export function breakLoopDpr(baseDpr: number, boss: boolean): number {
  const setup = boss ? BREAK_SETUP_ROUNDS + 2 : BREAK_SETUP_ROUNDS;
  return Math.round((baseDpr * setup + baseDpr * BREAK_MUL) / (setup + 1));
}

/** the SPAM read: a hero that fires its single biggest-RAW-POWER nuke every turn,
 *  the foe's colour be damned — so it EATS resists and MISSES weaknesses it doesn't
 *  happen to match. The opposite of reading the fight. */
function heroSpamNuke(heroId: HeroId, level: number): AbilityDef | null {
  const maxPp = maxPpAtLevel(heroId, level);
  let top: AbilityDef | null = null;
  for (const ab of abilitiesByLevel(heroId, level)) {
    if (ab.heal || ab.power <= 0) continue;
    if (ab.target !== 'enemy' && ab.target !== 'enemies') continue;
    if (ab.pp > maxPp) continue;
    if (!top || ab.power > top.power) top = ab;
  }
  return top;
}

/** one hero's DPR SPAMMING its biggest raw nuke into a foe of a given colour (the
 *  foe's weak/resist/absorb applies to that FIXED pick — it isn't chosen to fit). */
function heroSpamDpr(
  heroId: HeroId,
  level: number,
  weak: ReadonlySet<string>,
  resist: ReadonlySet<string>,
  absorb: ReadonlySet<string>,
  bossDef: number,
  targetMaxHp: number,
): number {
  const s = statsAtLevel(heroId, level);
  const phys = expectedPhysical(s.offense, bossDef, s.guts);
  const nuke = heroSpamNuke(heroId, level);
  if (!nuke) return phys;
  const dmg = expectedAbilityDamage(nuke, s.vibe, weak, resist, absorb, targetMaxHp);
  if (dmg <= phys) return phys;
  const casts = nuke.pp === 0 ? SUSTAIN_ROUNDS : Math.floor(maxPpAtLevel(heroId, level) / nuke.pp);
  const nukeRounds = Math.min(casts, SUSTAIN_ROUNDS);
  return Math.round((nukeRounds * dmg + (SUSTAIN_ROUNDS - nukeRounds) * phys) / SUSTAIN_ROUNDS);
}

export interface ReadSpamCheck {
  chapter: number;
  bossId: string;
  name: string;
  hp: number;
  /** DPR / TTK spamming the biggest raw nuke (no read, no break) */
  spamDpr: number;
  spamTtk: number;
  /** DPR / TTK rotating onto the weakness AND playing the break (the ×2 window) */
  readDpr: number;
  readTtk: number;
  weakness: string[];
}

/** the headline ADR-134 proof: for one boss, does PLAYING THE READ (rotate onto the
 *  weakness, then set up and cash a BREAK) beat SPAMMING the biggest number? */
export function readVsSpam(chapter: number): ReadSpamCheck {
  const m = CHAPTER_MANIFESTS[String(chapter)];
  const boss = m.boss;
  const level = m.targetLevel;
  const party = BOSS_PARTY[chapter] ?? ['rex'];
  const weak = bossWeakness(boss.id);
  const resist = bossResistance(boss.id);
  const absorb = bossAbsorbs(boss.id);
  const bossDef = level;
  const spamDpr = party.reduce((a, h) => a + heroSpamDpr(h, level, weak, resist, absorb, bossDef, boss.hp), 0);
  // READ picks the best nuke vs the foe (heroBestNuke rotates onto the weakness) …
  const readBase = party.reduce(
    (a, h) => a + heroDamagePerRound(h, level, weak, bossDef, NO_EXCLUDE, resist, absorb, boss.hp),
    0,
  );
  // … then cashes the BREAK loop (the ×2 window) on top.
  const readDpr = breakLoopDpr(readBase, true);
  return {
    chapter,
    bossId: boss.id,
    name: boss.name,
    hp: boss.hp,
    spamDpr,
    spamTtk: Math.max(1, Math.ceil(boss.hp / Math.max(1, spamDpr))),
    readDpr,
    readTtk: Math.max(1, Math.ceil(boss.hp / Math.max(1, readDpr))),
    weakness: [...weak],
  };
}

/** the read-vs-spam proof across every §A6 boss. */
export function allReadVsSpam(): ReadSpamCheck[] {
  return Object.keys(CHAPTER_MANIFESTS)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map(readVsSpam);
}

/* ------------------- ADR-134: MILO & PIPPA in the break economy ------------------ */

export interface BreakEconomyRow {
  chapter: number;
  bossHp: number;
  /** Milo's siege_rocket damage at this boss (flat 360 + the %-max-HP bite) — it SCALES */
  siege: number;
  /** actions to break the boss chipping ONLY plain weakness hits */
  actionsPlain: number;
  /** actions to break WITH Milo's control chip + Pippa's mark (+50%) — the payoff */
  actionsHelped: number;
}

/** the flat-tool crew's ledger: Milo's siege SCALES with the boss (vs a dead 360
 *  flat), and Milo's control + Pippa's mark cut the break setup from ~3 actions to
 *  ~2 — proof they are never dead weight late (the §4.7 acceptance, in numbers). */
export function breakEconomy(chapter: number): BreakEconomyRow {
  const m = CHAPTER_MANIFESTS[String(chapter)];
  const bossHp = m.boss.hp;
  const siege = expectedAbilityDamage(ABILITIES.siege_rocket, 0, new Set(), NO_EXCLUDE, NO_EXCLUDE, bossHp);
  const cmax = defaultComposure(m.targetLevel);
  const br = DEFAULT_BOSS_BREAK_RESIST;
  const plain = composureChip(cmax, { weak: true, breakResist: br });
  const helped = composureChip(cmax, { weak: true, control: true, focused: true, breakResist: br });
  return {
    chapter,
    bossHp,
    siege,
    actionsPlain: Math.ceil(cmax / Math.max(1, plain)),
    actionsHelped: Math.ceil(cmax / Math.max(1, helped)),
  };
}

/** the break-economy ledger across every §A6 boss. */
export function allBreakEconomy(): BreakEconomyRow[] {
  return Object.keys(CHAPTER_MANIFESTS)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map(breakEconomy);
}

/* --------------------------- the finale loadout ---------------------------- */

/**
 * THE HUSH FINALE VARIANTS (S21, ADR-130) — the one fight the branching reshapes.
 * Per the Party-Fate axes (src/engine/party.ts, src/data/choices.ts) the Hush is
 * fought at party size 3, 4, or 5, with Dorin's Comet Ω possibly WITHHELD (IRON)
 * and the STOLEN LIGHT chip possibly banked (IRON). §4.3 of BRANCHING_REDESIGN.md
 * demands every reachable loadout stay in the fair TTK window; this is the model
 * `npm run balance` prints and verify.test.ts pins.
 *
 * Two small knobs keep it fair, both on the canon curve (money > combat untouched —
 * every effective HP is < the base 150k < the Ch.10 Fortune target):
 *   • a per-party-size effective-HP EASE — a wounded party faces a Hush the long
 *     road had already worn thinner (the §4.3 "BOSS_HP adjustment keyed to size");
 *   • the STOLEN LIGHT chip — a Quiet-phase survival-round reducer the control path
 *     banked, NOT a nuke (its magnitude IS the §A8 item's own `power`, one source).
 */
export const HUSH_LEVEL = 52;

/** the Hush's effective HP by party size (§4.3) — base 150k for the full five,
 *  eased for a wounded party so the worst case (a Dorin-less four/three) clears the
 *  fair ceiling with headroom rather than sitting at TTK 10. */
export const FINALE_HUSH_HP: Record<number, number> = { 5: 150000, 4: 138000, 3: 120000 };

/** the banked Stolen Light's per-round chip = its §A8 item power (single source) */
export const STOLEN_LIGHT_CHIP = ITEMS.stolen_light?.power ?? 0;

/** Dorin's awakened ultimate — dropped from his DPR when the IRON path withholds it */
const COMET_OMEGA: ReadonlySet<string> = new Set(['vibe_comet_o']);

export interface FinaleVariant {
  id: string;
  label: string;
  party: HeroId[];
  /** IRON, un-redeemed: Dorin is present but cannot call Comet Ω */
  cometWithheld: boolean;
  /** IRON: the Stolen Light is banked and chips each round */
  stolenLight: boolean;
}

/**
 * The reachable finale loadouts, by axis combination (§4–5): sizes 5/4/3, Comet Ω
 * on/withheld, Stolen Light off (warm) / on (control). The warm full-five is the
 * canon baseline and equals bossCheck(10).
 */
export const FINALE_VARIANTS: FinaleVariant[] = [
  { id: 'warm', label: 'FREE · OPEN_HAND (full five)', party: ['rex', 'faye', 'milo', 'pippa', 'dorin'], cometWithheld: false, stolenLight: false },
  { id: 'open_strings', label: 'STRINGS · OPEN_HAND (Pippa calls in)', party: ['rex', 'faye', 'milo', 'dorin'], cometWithheld: false, stolenLight: false },
  { id: 'iron_full', label: 'FREE · IRON (Ω withheld, Light banked)', party: ['rex', 'faye', 'milo', 'pippa', 'dorin'], cometWithheld: true, stolenLight: true },
  { id: 'iron_strings', label: 'STRINGS · IRON (no Pippa, Ω withheld)', party: ['rex', 'faye', 'milo', 'dorin'], cometWithheld: true, stolenLight: true },
  // Dorin (the powerhouse) leaves but a reconciled Pippa stays — the low-DPR four
  { id: 'iron_dorin_left', label: 'IRON · Dorin left (Pippa stays)', party: ['rex', 'faye', 'milo', 'pippa'], cometWithheld: false, stolenLight: true },
  { id: 'iron_strings_cold', label: 'STRINGS · IRON · cold (both gone)', party: ['rex', 'faye', 'milo'], cometWithheld: false, stolenLight: true },
];

export interface FinaleCheck extends FinaleVariant {
  size: number;
  hp: number;
  partyDpr: number;
  ttk: number;
}

/** the Hush check for one finale loadout: party DPR (less a withheld Ω, plus the
 *  Stolen Light chip) vs the party-size-eased HP → TTK. Same conservative model as
 *  bossCheck (base stats, no weapons), so the read is a fair lower bound. */
export function finaleHushCheck(v: FinaleVariant): FinaleCheck {
  const weak: ReadonlySet<string> = new Set(); // the Hush is bespoke — no exploitable weakness
  const bossDef = HUSH_LEVEL;
  const hp = FINALE_HUSH_HP[v.party.length] ?? FINALE_HUSH_HP[5];
  let partyDpr = 0;
  for (const h of v.party) {
    const exclude = v.cometWithheld && h === 'dorin' ? COMET_OMEGA : NO_EXCLUDE;
    partyDpr += heroDamagePerRound(h, HUSH_LEVEL, weak, bossDef, exclude, NO_EXCLUDE, NO_EXCLUDE, hp);
  }
  if (v.stolenLight) partyDpr += STOLEN_LIGHT_CHIP;
  const ttk = Math.max(1, Math.ceil(hp / Math.max(1, partyDpr)));
  return { ...v, size: v.party.length, hp, partyDpr, ttk };
}

/** every reachable finale loadout, checked — the §4.3 balance read. */
export function finaleHushChecks(): FinaleCheck[] {
  return FINALE_VARIANTS.map(finaleHushCheck);
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
