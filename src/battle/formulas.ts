/**
 * Battle math (EB-style, GAME_BIBLE Prompt 14): offense×2 − defense for
 * physical, power coefficient × Vibe for abilities, Guts drives SMAAASH and
 * mortal-blow survival. Every function takes its RNG so tests are exact.
 */
import { ITEMS, slotOf, EQUIP_SLOTS } from '../data/items';
import { RAMP, px } from '../palette';
import type { HeroState } from '../engine/state';
import type { ItemDef, ItemBonus, ResistElement, PrayTier } from '../schemas';

export type Rng = () => number;

/* ---- S17 (ADR-061): the SECONDARY-bonus + permanent-boost + resist seams ----
 * Equipment keeps ONE primary slot stat (weapon→Offense, body→Defense,
 * arms→Speed|Guts, other→Luck) read by the heroX functions below; on TOP of
 * that, any worn piece may carry a small `bonus` map, a `vibe` rider, or
 * elemental `resists`, and a TONIC may have permanently raised the hero's stat
 * (HeroState.boosts). These helpers sum those extras; with the existing 41
 * items (none carry them, no tonic used) every sum is 0 — identical math. */

/** the items a hero currently has equipped, in slot order */
export function equippedItems(hero: HeroState): ItemDef[] {
  const out: ItemDef[] = [];
  for (const slot of EQUIP_SLOTS) {
    const id = hero.equip[slot];
    const it = id ? ITEMS[id] : undefined;
    if (it) out.push(it);
  }
  return out;
}

/** Σ of one secondary `bonus` stat across worn gear (§A8 secondaries) */
export function equipBonus(hero: HeroState, stat: keyof ItemBonus): number {
  return equippedItems(hero).reduce((a, it) => a + (it.bonus?.[stat] ?? 0), 0);
}

/** Σ of the dedicated `vibe` rider across worn gear (Riddle Ring +Vibe) */
export function equipVibe(hero: HeroState): number {
  return equippedItems(hero).reduce((a, it) => a + (it.vibe ?? 0), 0);
}

/** a permanent tonic boost (§A4.12), 0 if none */
export function boostOf(hero: HeroState, stat: 'offense' | 'defense' | 'speed' | 'guts' | 'vibe' | 'luck' | 'hp' | 'pp'): number {
  return hero.boosts?.[stat] ?? 0;
}

/** a hero's swing: base offense + THEIR equipped weapon (S3) + any secondary
 *  bonus on worn gear + any permanent Iron-Tonic boost (S17) */
export function heroOffense(hero: HeroState): number {
  const weapon = hero.equip.weapon ? ITEMS[hero.equip.weapon] : undefined;
  return hero.stats.offense + (weapon?.offense ?? 0) + equipBonus(hero, 'offense') + boostOf(hero, 'offense');
}

/** Prompt 19's preview: how much Offense changes if hero equips itemId */
export function equipDelta(hero: HeroState, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'weapon') return 0;
  const current = hero.equip.weapon ? (ITEMS[hero.equip.weapon]?.offense ?? 0) : 0;
  return (item.offense ?? 0) - current;
}

/** a hero's defense: base stat + their 'body'-slot armor (S10 — the Champion
 *  Jacket is §A8's first). Enemy physical damage and STATUS both read this
 *  the way Offense reads heroOffense. */
export function heroDefense(hero: HeroState): number {
  const armor = hero.equip.body ? ITEMS[hero.equip.body] : undefined;
  return hero.stats.defense + (armor?.defense ?? 0) + equipBonus(hero, 'defense') + boostOf(hero, 'defense');
}

/** the S10 armor preview — equipDelta's shape, aimed at the 'body' slot */
export function equipDefenseDelta(hero: HeroState, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'body') return 0;
  const current = hero.equip.body ? (ITEMS[hero.equip.body]?.defense ?? 0) : 0;
  return (item.defense ?? 0) - current;
}

/** a hero's luck: base stat + their 'other'-slot charm (S9 — Lucky Collar).
 *  STATUS reads this the way Offense reads heroOffense. */
export function heroLuck(hero: HeroState): number {
  const charm = hero.equip.other ? ITEMS[hero.equip.other] : undefined;
  return hero.stats.luck + (charm?.luck ?? 0) + equipBonus(hero, 'luck') + boostOf(hero, 'luck');
}

/** a hero's VIBE: base stat + any Vibe rider on worn gear (§A10 Riddle Ring,
 *  S17) + any Brain-Food-Lunch boost. Vibe ability power reads through this the
 *  heroOffense way — before S17 nothing buffed Vibe, so battles read the raw
 *  stat; now gear and tonics can. */
export function heroVibe(hero: HeroState): number {
  return hero.stats.vibe + equipVibe(hero) + boostOf(hero, 'vibe');
}

/** a hero's speed: base stat + their 'arms'-slot gear (S12 — THE STARTING
 *  FOUR is §A8's first). Run chance, turn order, and THE CAGE's court
 *  ratings all read through this, the heroOffense way. */
export function heroSpeed(hero: HeroState): number {
  const arms = hero.equip.arms ? ITEMS[hero.equip.arms] : undefined;
  return hero.stats.speed + (arms?.speed ?? 0) + equipBonus(hero, 'speed') + boostOf(hero, 'speed');
}

/** a hero's guts: base stat + their 'arms'-slot gear (S12). SMAAASH chance,
 *  mortal-blow survival, the combo cap, and the cage's rim game read here. */
export function heroGuts(hero: HeroState): number {
  const arms = hero.equip.arms ? ITEMS[hero.equip.arms] : undefined;
  return hero.stats.guts + (arms?.guts ?? 0) + equipBonus(hero, 'guts') + boostOf(hero, 'guts');
}

/* ---- S17 (ADR-061): elemental resists (§A8 pendants/robes made mechanical) ----
 * Worn armor + charms may carry `resists` lines; a hero's resist to an element
 * is the summed pct across gear, capped, applied to incoming elemental damage.
 * The display lives on the STATUS screen now; the APPLICATION binds at the
 * hero-damage seam the day enemies carry elemental moves (none do today, so
 * heroResist is 0 for every current fight — no behaviour change). */

/** cap on stacked elemental resistance — even four pendants can't make a hero
 *  immune (EB never let you fully no-sell an element) */
export const RESIST_CAP_PCT = 80;

/** a hero's resistance to one element, 0..RESIST_CAP/100 (a fraction) */
export function heroResist(hero: HeroState, element: ResistElement): number {
  const pct = equippedItems(hero).reduce(
    (a, it) => a + (it.resists?.find((r) => r.element === element)?.pct ?? 0),
    0,
  );
  return Math.min(RESIST_CAP_PCT, pct) / 100;
}

/** reduce elemental damage by a resist fraction (always leaves ≥1) */
export function applyResist(dmg: number, resistFrac: number): number {
  return Math.max(1, Math.round(dmg * (1 - resistFrac)));
}

/** S18 M24 (ADR-094): THE §A8 PENDANT SEAM on an INCOMING elemental hit. A worn
 *  resist pendant/robe (summed by heroResist) shaves its pct off a matching
 *  fire/freeze/volt/holy hit — the §A8 "pendants (elemental resists)" made to
 *  actually answer a landed elemental ENEMY move. This is DISTINCT from
 *  mitigateIncoming (Jay's active WARD): both may apply, gear first (here), the
 *  cast after. A physical/none hit is untouched — pendants resist the four Vibe
 *  elements only, never the EB-default physical. The S17 heroResist note
 *  promised "the APPLICATION binds at the hero-damage seam the day enemies carry
 *  elemental moves"; M24 lands the first such move (the Coily Cicada) and this
 *  is that seam, pure so the math unit-tests exactly. */
export function resistIncoming(dmg: number, element: string, hero: HeroState): number {
  if (element === 'fire' || element === 'freeze' || element === 'volt' || element === 'holy') {
    return applyResist(dmg, heroResist(hero, element));
  }
  return dmg;
}

/** the S12 arms preview — slot-generalized: an arms piece carries exactly
 *  one stat (schema law), and the preview names THAT stat ("Speed up by N!") */
export function equipArmsDelta(hero: HeroState, itemId: string): { stat: 'Speed' | 'Guts'; d: number } {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'arms') return { stat: 'Speed', d: 0 };
  const cur = hero.equip.arms ? ITEMS[hero.equip.arms] : undefined;
  if (item.guts !== undefined) {
    return { stat: 'Guts', d: item.guts - (cur?.guts ?? 0) };
  }
  return { stat: 'Speed', d: (item.speed ?? 0) - (cur?.speed ?? 0) };
}

/** the S9 charm preview — equipDelta's shape, aimed at the 'other' slot */
export function equipLuckDelta(hero: HeroState, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || slotOf(item) !== 'other') return 0;
  const current = hero.equip.other ? (ITEMS[hero.equip.other]?.luck ?? 0) : 0;
  return (item.luck ?? 0) - current;
}

export function physicalDamage(offense: number, defense: number, rng: Rng): number {
  const base = Math.max(1, offense * 2 - defense);
  return Math.max(1, Math.round(base * (0.85 + rng() * 0.3)));
}

/** SMAAASH!! chance — Guts-driven, capped like EB. Mia's LUCKY STAR feeds an
 *  optional Luck term (raises crit/SMAAASH); base callers pass no luck and read
 *  the exact old curve. */
export function smashChance(guts: number, luck = 0): number {
  return Math.min(0.2, 0.02 + guts / 100 + luck / 300);
}

export function smashDamage(offense: number, defense: number, rng: Rng): number {
  const base = Math.max(2, offense * 3 - Math.floor(defense / 2));
  return Math.round(base * (0.9 + rng() * 0.2));
}

/* ---- the SMAAAASH combo (S11b — Mother-3 spam-A multi-hits) ---- */

/** the combo window: edge-triggered A presses land follow-up hits for this
 *  long after the smash connects (skip-scaled like everything else) */
export const COMBO_WINDOW_MS = 1100;

/** max TOTAL hits in one combo (the opening smash counts as hit 1):
 *  3 + Guts/40, capped at 8 (§A3 — Guts drives the crit game) */
export function comboCap(guts: number): number {
  return Math.min(8, 3 + Math.floor(guts / 40));
}

/** each follow-up press lands 25% of the smash — deterministic, no dice
 *  inside the window (ADR-029: presses in, hits out) */
export function comboHitDamage(smashDmg: number): number {
  return Math.max(1, Math.floor(smashDmg * 0.25));
}

/** total damage of a combo: the smash + (hits − 1) follow-ups */
export function comboTotal(smashDmg: number, hits: number): number {
  return smashDmg + comboHitDamage(smashDmg) * Math.max(0, hits - 1);
}

/* ---- wear tiers (S11b): battle sprites read the drums ---- */

/** 0 full · 1 scuffed (<66%) · 2 battered (<33%) — heroes key this on the
 *  DISPLAYED odometer value, never the target: a mortal roll degrades AS
 *  the drum falls. Enemies key it on their plain hp. */
export function wearTier(hp: number, max: number): 0 | 1 | 2 {
  if (max <= 0) return 2;
  const r = hp / max;
  if (r < 1 / 3) return 2;
  if (r < 2 / 3) return 1;
  return 0;
}

export function vibeDamage(power: number, vibe: number, rng: Rng): number {
  return Math.max(1, Math.round(power * (1 + vibe / 60) * (0.9 + rng() * 0.2)));
}

/* ---- MILO'S GADGETS (no Vibe, no PP) — competence, not the old light ----
 * Milo's tech is a MACHINE: it reads OFF `power` alone, never the Vibe stat (his
 * Vibe is 0 by design — he out-engineers magic). Same ±10% rng seam every damage
 * path keeps, so the bottle rockets and the new EMP/cryo/siege gadgets all scale
 * identically and sensibly without a drop of Vibe. Pure + rng-injected so the
 * ADR-008 replay bot and the unit tests stay exact. */
export function gadgetDamage(power: number, rng: Rng): number {
  return Math.max(1, Math.round(power * (0.9 + rng() * 0.2)));
}

export function vibeHeal(power: number, vibe: number, rng: Rng): number {
  return Math.max(1, Math.round(power * (1 + vibe / 80) * (0.95 + rng() * 0.1)));
}

/** elemental weakness ×1.5 (the original single-sided multiplier — still the
 *  item/gadget path; Mia's five-element kit reads the fuller applyElement) */
export function applyWeakness(dmg: number, weak: boolean): number {
  return weak ? Math.round(dmg * 1.5) : dmg;
}

/* ---- MIA'S ELEMENTAL EDGE (the OUTGOING hero→enemy multiplier) ----
 * The five-element kit's whole point: the right element MULTIPLIES the hit. This
 * is the OUTGOING seam at damageEnemy — distinct from mitigateIncoming (the
 * enemy→hero ward seam); the two never conflate. ~×1.5 on a weakness, ~×0.5 on a
 * resist, always ≥1. HOLY pierces a slice of resistance (the Embers' light is
 * the Hush's bane): a resisted holy hit still lands at ~×0.75, and a holy-weak
 * foe takes the full weakness. Pure + rng-free so the replay bot stays exact. */
export const WEAK_MUL = 1.5;
export const RESIST_MUL = 0.5;
export const HOLY_PIERCE_MUL = 0.75;

export interface ElementHit {
  weak?: boolean;
  resist?: boolean;
  /** the hit is `holy` (Starsong / Pray) — pierces a slice of resistance */
  holy?: boolean;
  /** ADR-099: a per-enemy override for the WEAKNESS multiplier (default WEAK_MUL=1.5).
   *  §A6 Ch.3 says "Vibe Freeze DOUBLES damage" on the Headmaster Mainframe's cooling-fan
   *  weak point — so that boss carries `weakMul: 2` and a freeze hit literally doubles,
   *  while every other foe keeps the generic ×1.5. Ignored unless the hit is `weak`. */
  weakMul?: number;
}

/** the weak/resist/holy multiplier on one hero→enemy hit */
export function elementMultiplier({ weak = false, resist = false, holy = false, weakMul }: ElementHit): number {
  if (weak) return weakMul ?? WEAK_MUL; // a weakness wins outright, even a "resisted" holy
  if (resist) return holy ? HOLY_PIERCE_MUL : RESIST_MUL; // holy pierces half the resist
  return 1;
}

/** apply the element multiplier to a hit, never below 1 */
export function applyElement(dmg: number, hit: ElementHit): number {
  return Math.max(1, Math.round(dmg * elementMultiplier(hit)));
}

/* ---- the EXPOSED amplifier (Hush Hex) — the OUTGOING mirror of Jay's ward ----
 * `exposed` is ×1.3 on every hit the enemy takes; it STACKS MULTIPLICATIVELY
 * with `marked` (Milo/Pippa's focus-fire tag, ×1.25) so a coordinated focus turn
 * is the party's biggest spike (the build prompt §8). Applied at damageEnemy,
 * PARALLEL to (never inside) mitigateIncoming. */
export const EXPOSED_MUL = 1.3;
export const MARKED_MUL = 1.25;

/** the focus-fire amplifier on a hit the enemy takes (exposed × marked) */
export function focusMultiplier(opts: { exposed?: boolean; marked?: boolean }): number {
  let m = 1;
  if (opts.exposed) m *= EXPOSED_MUL;
  if (opts.marked) m *= MARKED_MUL;
  return m;
}

/** apply the focus amplifier to a hit, never below 1 */
export function applyFocus(dmg: number, opts: { exposed?: boolean; marked?: boolean }): number {
  return Math.max(1, Math.round(dmg * focusMultiplier(opts)));
}

/* ---- BURN (Fire γ+) — Fire's "stack damage over time" identity vs Freeze's
 * control. A small flame DoT (~6% max HP, min 4) at the end of the burned foe's
 * turn, 3 turns; the chip STACKS with `exposed` (the chip-and-amplify combo). */
export const BURN_TURNS = 3;
export function burnTick(maxHp: number): number {
  return Math.max(4, Math.round(maxHp * 0.06));
}

/* ---- FROZEN (Freeze γ+, SHARED with Milo's Cryo Grenade — ONE implementation)
 * Skip the next turn, chance by tier (γ40 / Ω55 / Σ70%), 1 turn. Bosses are
 * capped/immune via the LIVE mindImmune philosophy (reuse the same gate so Freeze
 * control mirrors Jay's puppet rules exactly — control never trivializes a boss). */
// tiers 3–5 are Mia's Freeze ladder (γ/Ω/Σ); tier 2 is Milo's CRYO GRENADE — a
// dedicated single-target lockdown tool (his whole turn, fixed 80 dmg, no Vibe),
// so its skip-lock lands a touch more often than Mia's first freeze rung.
export const FROZEN_CHANCE: Record<number, number> = { 2: 0.5, 3: 0.4, 4: 0.55, 5: 0.7 };
export function frozenChance(tier: number): number {
  return FROZEN_CHANCE[tier] ?? 0;
}
export function frozenLands(tier: number, rng: Rng): boolean {
  return rng() < frozenChance(tier);
}

/* ---- LIFEDRAIN (Magnet Ω/Σ) — on hit, Mia takes a bite of enemy HP (on top of
 * the PP sip) and heals half of it. Partly self-sufficient — but a drain turn is
 * NOT a nuke turn (the trade). Σ is AoE, so it bites a little less per target. */
export function lifedrainDamage(aoe: boolean, vibe: number, rng: Rng): number {
  const base = aoe ? 60 : 95;
  return Math.max(1, Math.round(base * (1 + vibe / 90) * (0.9 + rng() * 0.2)));
}
/** Mia heals half of whatever a lifedrain takes (HP + PP) */
export function lifedrainHeal(drained: number): number {
  return Math.max(1, Math.round(drained * 0.5));
}

/** LUCKY STAR's temporary Luck bump (status 'lucky') — read at the luck seam
 *  (heroLuckS) the steeled way, never baked into permanent `boosts`; raises
 *  crit/SMAAASH and dodge while it holds, then ticks off in statusPhase. */
export const LUCKY_LUCK = 10;

/* ---- PIPPA — the page's tactical kit (§A3, S15h: NO Vibe, NO PP) ----
 * Her power is competence, not the old light: she MARKS targets so the big kids
 * can't whiff, RALLIES morale, stitches wounds, and out-maneuvers things at
 * thimble-scale. Statuses route through Luck where a stat is needed — she is
 * absurdly lucky (base Luck 9), and that shows up in the numbers (the dodge math
 * below). Pure + rng-injected so the ADR-008 replay bot and the unit tests stay
 * exact; BattleScene reads the result at the matching seam.
 *
 * `marked` (enemy) folds into the existing MARKED_MUL/applyFocus amplifier above
 * (×1.25) AND opens the guaranteed-hit gate here; `frozen`/`cure` are shared
 * with Mia/Milo and implemented once. */

/** marked (enemy): the party can't miss it AND it takes ×1.25 — 3 turns */
export const MARKED_TURNS = 3;

/** the shared "is this party hit guaranteed?" gate — a MARKED foe can't be
 *  missed, and a FOCUSED hero (Big-Little Focus / The Minutes) can't whiff its
 *  next physical swing. Skips the crying-miss (and any future evasion) gate. */
export function guaranteedHit(opts: { marked?: boolean; focus?: boolean }): boolean {
  return opts.marked === true || opts.focus === true;
}

/** rally (party): quick and lucky — +Speed and +Luck while it holds, read at the
 *  heroSpeed/heroLuck seams the steeled way. Standing Ovation lasts longer. */
export const RALLY_SPEED = 5;
export const RALLY_LUCK = 5;
export const RALLY_TURNS = 3;
export const OVATION_TURNS = 5;

/** focus (party): the next physical hit can't miss (the big-little focus combo
 *  with Milo) — 2 turns, consumed by the swing it guarantees. */
export const FOCUS_TURNS = 2;

/** evasion (self): the thimble-scale gimmick — a decoy eats the FIRST incoming
 *  hit outright, then a high dodge each hit, nudged up by Speed/Luck (she is
 *  absurdly lucky, so her dodge floor is genuinely high). 3 turns. */
export const EVASION_TURNS = 3;
export function evasionDodges(speed: number, luck: number, rng: Rng): boolean {
  return rng() < Math.min(0.85, 0.55 + (speed + luck) / 300);
}

/** rattled (enemy): Stern Decree's no-magic Offense-down — its hits land ×0.8
 *  and it has a small chance to be too cowed to act. 3 turns. */
export const RATTLED_TURNS = 3;
export const RATTLED_MUL = 0.8;
export const RATTLED_SKIP_CHANCE = 0.2;
export function rattledDamage(dmg: number): number {
  return Math.max(1, Math.round(dmg * RATTLED_MUL));
}
export function rattledSkips(rng: Rng): boolean {
  return rng() < RATTLED_SKIP_CHANCE;
}

/** morale (party, until consumed): Bellwether — the next PRAY "carries" one tier
 *  better (feeding Mia's faith mechanic, a cross-character synergy) and the next
 *  party heal is amplified ×1.5. */
export const MORALE_HEAL_MUL = 1.5;
const PRAY_TIER_ORDER: PrayTier[] = ['backfire', 'strange', 'nothing', 'good', 'wonderful', 'miraculous'];
/** bump a rolled pray tier one rung better (the rung above 'miraculous' is
 *  itself — morale can't exceed the canon ceiling) */
export function moraleTierUp(tier: PrayTier): PrayTier {
  const i = PRAY_TIER_ORDER.indexOf(tier);
  return i < 0 || i >= PRAY_TIER_ORDER.length - 1 ? tier : PRAY_TIER_ORDER[i + 1];
}
/** the amplified heal a morale charge carries (always ≥1) */
export function moraleHeal(amount: number): number {
  return Math.max(1, Math.round(amount * MORALE_HEAL_MUL));
}

/** Guts: chance to survive a mortal blow at 1 HP (§A3) */
export function gutsSurvive(guts: number, rng: Rng): boolean {
  return rng() < Math.min(0.5, guts / 120);
}

export function runChance(heroSpeed: number, maxEnemySpeed: number): number {
  return Math.min(0.92, Math.max(0.15, 0.5 + (heroSpeed - maxEnemySpeed) * 0.025));
}

/**
 * §A4.2 instant auto-win: the party vastly outlevels the enemy.
 */
export function instantWin(avgPartyLevel: number, enemyLevel: number, isBoss: boolean): boolean {
  return !isBoss && avgPartyLevel >= enemyLevel + 6;
}

/** EXP split among conscious heroes, rounded up (everyone gets something) */
export function expShare(total: number, aliveCount: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, aliveCount)));
}

/* ---- §A7 LOOT (S18 M24, ADR-094): a defeated enemy rolls its drops ---- */

/** roll each of a defeated enemy's drops independently; returns the ids that
 *  landed (EarthBound-style — most fights drop nothing, identity drops are
 *  deliberately rare). Pure + rng-injected so the ADR-008 replay bot and the
 *  unit tests stay exact (dice in, items out). */
export function rollDrops(
  drops: ReadonlyArray<{ item: string; chance: number }> | undefined,
  rng: Rng,
): string[] {
  if (!drops) return [];
  const out: string[] = [];
  for (const d of drops) if (rng() < d.chance) out.push(d.item);
  return out;
}

/* ---- §A4.8 status rolls (S11) — injected rng, tested exactly ---- */

export const CRYING_MISS_CHANCE = 0.5;
export const PARALYZED_SKIP_CHANCE = 0.5;
export const ASLEEP_WAKE_CHANCE = 0.34;

/** Crying: can't aim — gnats, onion ghosts, and Flash α agree */
export function cryingMisses(rng: Rng): boolean {
  return rng() < CRYING_MISS_CHANCE;
}

export function paralyzedSkips(rng: Rng): boolean {
  return rng() < PARALYZED_SKIP_CHANCE;
}

/** rolled when a sleeper's turn comes up (a hit always wakes them) */
export function asleepWakes(rng: Rng): boolean {
  return rng() < ASLEEP_WAKE_CHANCE;
}

/** Magnet α: the PP trickle — enemy PP pools arrive with the Phase-2 data;
 *  until then the siphon draws a small fixed sip out of the air */
export function magnetSiphon(rng: Rng): number {
  return 2 + Math.floor(rng() * 5);
}

/* ---- §A3 LAYERED WARDS (S16 — "The Old Light, Doubled": Jay's defense suite) ----
 * Three stacking mitigation layers, each gated on the hit's CLASS, plus two
 * "use all the tools" synergies. Pure + rng-free so the ADR-008 replay bot and
 * the unit tests are exact; BattleScene reads the result at the damage seam.
 *   shield  — halves PHYSICAL only (existing status)
 *   ward    — halves ELEMENTAL only: fire/freeze/volt/holy (S16)
 *   reflect — halves ALL classes AND bounces ~1/3 back at the attacker (S16)
 *   mirror  — halves all + bounces ~1/4 (Dorin's existing status, folded in here)
 * Synergies: BULWARK — holding shield AND ward at once shaves a little extra off
 * whatever lands (double-guarded); BRACE-AND-ANSWER — a STEELED hero behind a
 * reflect bounces harder. Layers are multiplicative; the result never zeroes a
 * hit (the existing "always ≥1 damage" rule the mirror path already obeyed).
 */
export interface WardState {
  shield: boolean;
  ward: boolean;
  reflect: boolean;
  mirror: boolean;
  /** Resolve's 'steeled' — boosts the reflect/mirror bounce (brace and answer) */
  steeled: boolean;
}

const ELEMENTAL_CLASSES = new Set(['fire', 'freeze', 'volt', 'holy']);

/** apply the ward layers to one incoming hit; returns the damage actually
 *  TAKEN and the amount BOUNCED back at the attacker (0 when no reflect/mirror) */
export function mitigateIncoming(dmg: number, element: string, w: WardState): { taken: number; reflected: number } {
  let taken = dmg;
  if (w.shield && element === 'physical') taken = Math.floor(taken / 2);
  if (w.ward && ELEMENTAL_CLASSES.has(element)) taken = Math.floor(taken / 2);
  // reflect/mirror halve EVERY class — physical, elemental, and typeless 'none'
  if (w.reflect || w.mirror) taken = Math.floor(taken / 2);
  // BULWARK: double-guarded (shield + ward both held) trims a little more
  if (w.shield && w.ward) taken = Math.floor(taken * 0.85);
  taken = Math.max(1, taken);
  let reflected = 0;
  if (w.reflect) reflected = Math.floor(dmg / (w.steeled ? 2 : 3)); // brace-and-answer
  else if (w.mirror) reflected = Math.floor(dmg / 4);
  return { taken, reflected };
}

/** S16 MIND WARP ('puppet'): an elite foe's chance to SHRUG OFF the control
 *  application, scaling with how far it outlevels Jay — clamp((eLvl−jLvl)×4%,
 *  0..85%). Bosses never roll this; they're mind_immune outright (prompt §4),
 *  so control stays a crowd/tempo tool, never an "I win" on a boss. */
export function puppetResist(enemyLevel: number, jayLevel: number): number {
  return Math.min(0.85, Math.max(0, (enemyLevel - jayLevel) * 0.04));
}

/** S16 MIND WARP: a foe Jay's puppet can NEVER grip — bosses by design (so
 *  control never trivializes a boss fight), plus anything explicitly flagged
 *  mind_immune (the build prompt §4). Shared by BattleScene + the tests. */
export function mindImmune(def: { boss?: boolean; mind_immune?: boolean }): boolean {
  return def.boss === true || def.mind_immune === true;
}

/** S16 MIND WARP duration: α grips one common foe for a turn; Ω (the awakened
 *  'the_borrowed_voice') holds for 2–3 and can grip stronger enemies */
export function puppetTurns(omega: boolean, rng: Rng): number {
  return omega ? 2 + (rng() < 0.5 ? 1 : 0) : 1;
}

/** S16 RESOLVE: the temporary Guts bump 'steeled' grants (crit chance + the
 *  1-HP mortal-blow survive read through this; never baked into permanent
 *  `boosts` — it ticks off like any status) */
export const STEELED_GUTS = 8;

/* ---- DORIN'S MARTIAL STANCES (§4 — "make his own turn a choice") ----
 * Two self-buff statuses built on the S16 temp-boost pattern: each reads at a
 * LIVE stat seam (heroDefense / heroSpeed), never baked into permanent `boosts`,
 * and ticks off in statusPhase like 'steeled'. Pure + rng-injected so the replay
 * bot and the unit tests stay exact.
 *   braced  (Stone Brow Stance) — +Defense AND a physical counter
 *   flowing (Flowing Step)      — +Speed AND a dodge window
 */

/** the temporary Defense bump 'braced' grants — read at the heroDefense seam
 *  (the incoming-damage calc), the steeled-Guts way */
export const BRACED_DEFENSE = 8;

/** the temporary Speed bump 'flowing' grants — read at the heroSpeed seam
 *  (run chance + turn tempo) */
export const FLOWING_SPEED = 6;

/** Stone Brow Stance's counter: a braced monk answers a PHYSICAL hit with ~40%
 *  of the swing as fist damage, bounced back at the attacker. Resolves at the
 *  same `reflected` seam mitigateIncoming feeds — never a parallel damage path
 *  (the build prompt §1.5). "Patience is also a fist." */
export function bracedCounter(dmg: number): number {
  return Math.floor(dmg * 0.4);
}

/** Flowing Step's dodge: ~35% to slip a hit entirely, nudged up a little by
 *  Speed/Luck. The shared "did this hit miss?" gate — Pippa's evasion routes
 *  here too — read off the hero's live status before mitigateIncoming. */
export function flowingDodge(speed: number, luck: number, rng: Rng): boolean {
  return rng() < Math.min(0.6, 0.35 + (speed + luck) / 400);
}

/* ---- §A4.5 SUNNY SIDE (S14 / Bible Prompt 23) ---- */

/** the picnic buff covers the NEXT five battles (§A4.5, canon) */
export const SUNNY_BATTLES = 5;
export const SUNNY_MUL = 1.1;

/**
 * +10% ALL stats while the picnic counter holds (the seam beside
 * heroOffense — battle stat reads multiply through this). The counter is a
 * plain number flag ('sunny_side'), so the remainder persists on the save
 * with no migration step; BattleScene burns one per battle resolved.
 */
export function sunnyMul(flagOf: (flag: string) => number | boolean): number {
  return (Number(flagOf('sunny_side')) || 0) > 0 ? SUNNY_MUL : 1;
}

/* ---- §A4.7 hospitals (S14 / Bible Prompt 25) ---- */

/** pay-to-revive an angel: scales with the FALLEN hero's level (canon) */
export function reviveCost(level: number): number {
  return 10 + level * 4;
}

/** the cure-all-statuses desk — flat, a little steep, very effective */
export const CURE_ALL_COST = 18;

/** chapels restore 50 HP party-wide, free (§A4.7 / Prompt 25) */
export const CHAPEL_HEAL = 50;

/* ---- Homesick (§A4.4/§A4.8, S4): Jay-only, cured by Mom's call ---- */

// ADR-042: was 0.08 — user playtest: "pops up way too often... it just
// generates way too fast". The mechanic stays; the dice calm down.
export const HOMESICK_CHANCE = 0.02;
export const HOMESICK_SKIP_CHANCE = 0.5;

/** rolled once per battle victory — the quiet hits him after the noise */
export function contractHomesick(rng: Rng): boolean {
  return rng() < HOMESICK_CHANCE;
}

/** rolled whenever a Homesick Jay is about to act */
export function homesickSkips(rng: Rng): boolean {
  return rng() < HOMESICK_SKIP_CHANCE;
}

/* ---------------- §A4.2 contact angle & the swirl traffic-light (S15c) ---------------- */

/** contact angle → first strike. dotF = facing·(unit toEnemy); an enemy
 *  fleeing away from you caught from behind gives up its back. Thresholds
 *  are the S1 originals, extracted here so the read is pinned headless. */
export function contactAdvantage(dotF: number, enemyFleeing: boolean): 'player' | 'enemy' | 'none' {
  if (dotF < -0.35) return 'enemy'; // it got our back
  if (enemyFleeing && dotF > 0.35) return 'player'; // we got its back
  return 'none';
}

/** The swirl reads like a traffic light (user law, S15c — and EB-faithful;
 *  Bible §A4.2 + Prompt 16 amended in the same commit): GREEN = you snuck
 *  up and move first, RED = it got the drop on you, paper-grey = neutral.
 *  The flip ships ahead of queued S14d item 1 — its per-color sfx and
 *  spin-direction colorblind channel remain queued there. */
export const SWIRL_TINT: Record<'player' | 'enemy' | 'none', number> = {
  player: px(RAMP.GRASS, 2),
  enemy: px(RAMP.RED, 2),
  none: px(RAMP.PAPER, 1),
};
