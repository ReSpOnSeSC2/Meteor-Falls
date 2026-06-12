/**
 * THE BOSS PHASE MACHINE (S14 — GAME_BIBLE Prompt 15). A declarative,
 * Phaser-free interpreter over BossScriptDef data (src/schemas, ADR-017):
 * triggers fire phases, phases run actions, and BattleScene supplies the
 * EFFECTS — print a line, swap the form texture, summon units, heal, steal.
 * Everything §A6 scripts for bosses 2–8 is expressible as data:
 *
 *   GILDED GRIN  — forms alternate on a turnCount cycle (telegraph at n,
 *                  swap at n+1), SOLID GOLD physical-immune / HOLLOW
 *                  vibe-immune; Vibe Freeze CRACKS the gold for a beat.
 *   MAINFRAME    — bothSummonsDead → summon(prefect_drone, 2), repeatable.
 *   COBRA RAJA   — hpBelow(0.4) → healSelf(800) + scriptLine, once.
 *   SPHINX       — riddleAnswered(true) → stunSelf(3);
 *                  riddleAnswered(false) → partyStatus(crying).
 *   PAPER DRAGON — forms airborne/grounded; hpBelow → setSpeedMul(2).
 *   HOAXULA      — stealEquipped / returnStolen; prayTierAtLeast('good')
 *                  → endBattleMercy (the game's quietest victory).
 *
 * The Tick stays bespoke — its latch shipped as engine law (S11) and stays.
 *
 * Determinism: the runner rolls no dice. Triggers in, actions out — vitest
 * proves every canon trigger headlessly (phases.test.ts), so Prompts 29–34
 * are data-only.
 */
import type { BossFormDef, BossPhaseDef, BossScriptDef, Element, PhaseAction, PrayTier, RiddleDef } from '../schemas';

export type { BossFormDef, BossPhaseDef, BossScriptDef, PhaseAction, PhaseTrigger, RiddleDef } from '../schemas';

/** what a damage source IS, for form immunities — bats and thrown goods are
 *  physical; the Vibe lines are vibe; PRAY is faith and always lands (§A2:
 *  the Hush cannot eat it — no idol gets to either) */
export type DamageClass = 'physical' | 'vibe' | 'pray';

/** the scene-side hands these in; every effect may be async (prints await) */
export interface PhaseEffects {
  scriptLine(dialogueId: string): Promise<void> | void;
  setForm(form: BossFormDef): Promise<void> | void;
  summon(enemyId: string, n: number): Promise<void> | void;
  healSelf(amount: number): Promise<void> | void;
  stealEquipped(): Promise<void> | void;
  returnStolen(): Promise<void> | void;
  endBattleMercy(): Promise<void> | void;
  partyStatus(status: 'crying' | 'asleep' | 'paralyzed' | 'sunburn' | 'hushed', turns: number): Promise<void> | void;
}

/** prayTierAtLeast ranking — backfire is the floor, miraculous the ceiling */
const TIER_RANK: Record<PrayTier, number> = {
  backfire: 0,
  strange: 1,
  nothing: 2,
  good: 3,
  wonderful: 4,
  miraculous: 5,
};

export function prayTierAtLeast(tier: PrayTier, atLeast: PrayTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[atLeast];
}

/** how many turns a freeze-crack suspends a form's physical immunity —
 *  the brittle beat lasts through the player's next swing */
export const CRACK_TURNS = 2;

export class PhaseRunner {
  readonly def: BossScriptDef;
  private fx: PhaseEffects;
  /** the active form (null = formless boss) */
  form: BossFormDef | null = null;
  /** boss turns remaining with immunity suspended (Vibe Freeze on gold) */
  cracked = 0;
  /** boss turns remaining skipped (the Sphinx's answered riddle) */
  stunned = 0;
  /** ≥2 grants the boss an extra action per round (Paper Dragon desperation) */
  speedMul = 1;
  /** set by endBattleMercy — the scene resolves victory without a kill */
  mercy = false;
  /** equipment the boss is holding hostage (Hoaxula) — returned on win */
  stolen: Array<{ heroId: string; itemId: string }> = [];
  private bossTurns = 0;
  private fired = new Set<string>();
  private everSummoned = false;
  private awakeningPlayed = false;

  constructor(def: BossScriptDef, fx: PhaseEffects) {
    this.def = def;
    this.fx = fx;
    if (def.initialForm && def.forms) {
      this.form = def.forms.find((f) => f.id === def.initialForm) ?? null;
    }
  }

  /** the boss's CURRENT battle texture: base sprite + the form's suffix */
  spriteFor(baseSprite: string): string {
    return this.form ? `${baseSprite}${this.form.spriteSuffix}` : baseSprite;
  }

  /** S14/ADR-035: the awakening staged on a form's FIRST appearance — the
   *  scene asks after every swap; non-null exactly once */
  awakeningDue(): string | null {
    const a = this.def.awakeningOnForm;
    if (!a || this.awakeningPlayed) return null;
    if (this.form?.id !== a.form) return null;
    this.awakeningPlayed = true;
    return a.awakening;
  }

  /* ---------------- damage filtering (form immunities) ---------------- */

  /**
   * 0 = the hit clangs off (immune), 1 = it lands. PRAY always lands.
   * A cracked form's PHYSICAL immunity is suspended (the freeze edge case —
   * the gold goes brittle and bats land, §A6 Ch.2 as taught by the fight).
   */
  damageMul(source: DamageClass): number {
    if (!this.form) return 1;
    if (source === 'pray') return 1;
    if (source === 'physical' && this.form.physicalImmune) {
      return this.cracked > 0 ? 1 : 0;
    }
    if (source === 'vibe' && this.form.vibeImmune) return 0;
    return 1;
  }

  /**
   * An elemental hit may CRACK the active form (crackedBy). Returns true
   * the moment the crack lands so the scene can print the brittle read.
   * Cracking is idempotent while already cracked (the timer just refills).
   */
  crackBy(element: Element): boolean {
    if (!this.form?.crackedBy || this.form.crackedBy !== element) return false;
    const fresh = this.cracked === 0;
    this.cracked = CRACK_TURNS;
    return fresh;
  }

  /* ---------------- trigger events (the scene reports, we fire) ---------------- */

  /**
   * The boss is about to act. Ticks the turn counter, fires due turnCount
   * phases, burns crack/stun timers. Returns 'skip' when the boss loses
   * this turn (stunned), 'act' otherwise.
   */
  async onBossTurnStart(): Promise<'act' | 'skip'> {
    this.bossTurns += 1;
    if (this.cracked > 0) this.cracked -= 1;
    for (const p of this.def.phases) {
      if (p.trigger.kind !== 'turnCount') continue;
      const { n, every } = p.trigger;
      const due =
        this.bossTurns === n ||
        (every !== undefined && this.bossTurns > n && (this.bossTurns - n) % every === 0);
      if (due) await this.firePhase(p);
    }
    if (this.stunned > 0) {
      this.stunned -= 1;
      return 'skip';
    }
    return 'act';
  }

  /** boss hp changed — evaluate hpBelow thresholds (each fires once) */
  async onHpFrac(frac: number): Promise<void> {
    for (const p of this.def.phases) {
      if (p.trigger.kind === 'hpBelow' && frac < p.trigger.frac) await this.firePhase(p);
    }
  }

  /** every summoned unit is down (the scene watches its own units) */
  async onAllSummonsDead(): Promise<void> {
    if (!this.everSummoned) return;
    for (const p of this.def.phases) {
      if (p.trigger.kind === 'bothSummonsDead') await this.firePhase(p);
    }
  }

  /** the opening riddle resolved (§A6 Ch.4 consequences are phase actions) */
  async onRiddleAnswered(ok: boolean): Promise<void> {
    for (const p of this.def.phases) {
      if (p.trigger.kind === 'riddleAnswered' && p.trigger.ok === ok) await this.firePhase(p);
    }
  }

  /** a Pray resolved at this tier (Hoaxula's mercy listens here) */
  async onPrayTier(tier: PrayTier): Promise<void> {
    for (const p of this.def.phases) {
      if (p.trigger.kind === 'prayTierAtLeast' && prayTierAtLeast(tier, p.trigger.tier)) {
        await this.firePhase(p);
      }
    }
  }

  /* ---------------- firing ---------------- */

  private async firePhase(p: BossPhaseDef): Promise<void> {
    const repeats = p.once === false;
    if (!repeats && this.fired.has(p.id)) return;
    this.fired.add(p.id);
    for (const a of p.actions) await this.runAction(a);
  }

  private async runAction(a: PhaseAction): Promise<void> {
    switch (a.kind) {
      case 'scriptLine':
        await this.fx.scriptLine(a.line);
        return;
      case 'setForm': {
        const forms = this.def.forms ?? [];
        if (forms.length === 0) return;
        let next: BossFormDef | undefined;
        if (a.form === 'cycle') {
          const i = forms.findIndex((f) => f.id === this.form?.id);
          next = forms[(i + 1) % forms.length];
        } else {
          next = forms.find((f) => f.id === a.form);
        }
        if (!next || next.id === this.form?.id) return;
        this.form = next;
        this.cracked = 0; // a fresh form arrives whole
        await this.fx.setForm(next);
        return;
      }
      case 'summon':
        this.everSummoned = true;
        await this.fx.summon(a.enemy, a.n);
        return;
      case 'healSelf':
        await this.fx.healSelf(a.amount);
        return;
      case 'stealEquipped':
        await this.fx.stealEquipped();
        return;
      case 'returnStolen':
        await this.fx.returnStolen();
        return;
      case 'setSpeedMul':
        this.speedMul = a.mul;
        return;
      case 'endBattleMercy':
        this.mercy = true;
        await this.fx.endBattleMercy();
        return;
      case 'stunSelf':
        this.stunned += a.turns;
        return;
      case 'partyStatus':
        await this.fx.partyStatus(a.status, a.turns);
        return;
    }
  }
}

/** deterministic pick for tests; the scene rolls its own index for play */
export function pickRiddle(pool: RiddleDef[], index: number): RiddleDef {
  return pool[((index % pool.length) + pool.length) % pool.length];
}
