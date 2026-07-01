/**
 * THE GREAT VERIFICATION (S18 M24, ADR-094) — pins the §A9 COMBAT curves that
 * `npm run balance` prints by eye: per-hero growth, the Vibe ability ladders'
 * tier leaps, boss HP vs TIME-TO-KILL at the §A6 target levels, and that the
 * landed Ch.1–2 slice is provably COMPLETABLE (B4). The economy half lives in
 * balance.test.ts; this is the combat half.
 */
import { describe, it, expect } from 'vitest';
import {
  expectedPhysical,
  expectedAbilityDamage,
  heroBestNuke,
  heroDamagePerRound,
  abilitiesByLevel,
  AWAKENING_LEVEL,
  growthRow,
  ladder,
  bossCheck,
  allBossChecks,
  allReadVsSpam,
  allBreakEconomy,
  breakLoopDpr,
  BOSS_PARTY,
  finaleHushChecks,
  FINALE_HUSH_HP,
  STOLEN_LIGHT_CHIP,
  type FinaleCheck,
} from './verify';
import { ABILITIES } from '../data/abilities';
import { AWAKENINGS } from '../data/awakenings';
import { ENEMIES } from '../data/enemies';
import { CHAPTER_MANIFESTS } from '../data/chapters';
import { WEAK_MUL, RESIST_MUL, HOLY_PIERCE_MUL } from './formulas';
import type { HeroId } from '../schemas';

const HEROES: HeroId[] = ['rex', 'faye', 'milo', 'pippa', 'dorin'];

describe('per-character growth curves are well-formed (§A9)', () => {
  it('every stat climbs (or holds) with level, HP/PP grow, for all five heroes', () => {
    for (const id of HEROES) {
      let prev = growthRow(id, 1);
      for (let lv = 2; lv <= 52; lv++) {
        const g = growthRow(id, lv);
        expect(g.hp, `${id} HP @${lv}`).toBeGreaterThan(prev.hp);
        expect(g.offense, `${id} Off @${lv}`).toBeGreaterThanOrEqual(prev.offense);
        expect(g.defense).toBeGreaterThanOrEqual(prev.defense);
        expect(g.speed).toBeGreaterThanOrEqual(prev.speed);
        prev = g;
      }
    }
  });

  it('the Vibe heroes grow Vibe; Milo and Pippa never do (§A3 — no old light)', () => {
    for (const id of ['rex', 'faye', 'dorin'] as HeroId[]) {
      expect(growthRow(id, 52).vibe, `${id} Vibe`).toBeGreaterThan(growthRow(id, 1).vibe);
    }
    for (const id of ['milo', 'pippa'] as HeroId[]) {
      expect(growthRow(id, 1).vibe).toBe(0);
      expect(growthRow(id, 52).vibe).toBe(0);
      expect(growthRow(id, 52).pp).toBe(0); // and no PP bar
    }
  });
});

describe('the Vibe ability ladders climb (§A3/ADR-035)', () => {
  it('every signature ladder rung costs more PP and hits harder than the one below', () => {
    for (const base of ['Vibe Surge', 'Vibe Fire', 'Vibe Freeze', 'Vibe Volt']) {
      const rungs = ladder(base);
      expect(rungs.length, base).toBeGreaterThanOrEqual(4);
      for (let i = 1; i < rungs.length; i++) {
        expect(rungs[i].power, `${base} ${rungs[i].tier} power`).toBeGreaterThan(rungs[i - 1].power);
        expect(rungs[i].pp, `${base} ${rungs[i].tier} pp`).toBeGreaterThan(rungs[i - 1].pp);
      }
    }
  });

  it('the signature lines LEAP at α→β (the awakening promise)', () => {
    // ADR-131: Surge α was strengthened into a real early nuke (power 20→38) so it
    // clearly out-damages a bat swing through Ch.1–2 — which intentionally GENTLES
    // its α→β leap (β is still a clear single-hit upgrade for 3× the PP, just not the
    // old ~2.6×; α now carries the solo-Jay opener on its own). Mia's Fire keeps the
    // big awakening jump — her α stays a small opener, so β is the leap there.
    const MIN_LEAP: Record<string, number> = { 'Vibe Surge': 1.4, 'Vibe Fire': 2.4 };
    for (const base of ['Vibe Surge', 'Vibe Fire']) {
      const rungs = ladder(base);
      const leap = rungs[1].power / rungs[0].power;
      expect(leap, `${base} α→β`).toBeGreaterThanOrEqual(MIN_LEAP[base]);
      expect(leap).toBeLessThanOrEqual(2.9);
    }
  });
});

describe('expected-damage helpers read the formulas correctly', () => {
  it('expectedPhysical is between a clean swing and a SMAAASH', () => {
    const normal = 20 * 2 - 5;
    const smash = 20 * 3 - 2;
    const e = expectedPhysical(20, 5, 30);
    expect(e).toBeGreaterThanOrEqual(normal);
    expect(e).toBeLessThan(smash);
  });

  it('a matching boss weakness multiplies a Vibe cast ×WEAK_MUL (1.8, ADR-134)', () => {
    // a big-power ability so integer rounding doesn't skew the ratio
    const fireX = ABILITIES.vibe_fire_x;
    const plain = expectedAbilityDamage(fireX, 40, new Set());
    const weak = expectedAbilityDamage(fireX, 40, new Set(['fire']));
    expect(weak).toBeGreaterThan(plain);
    expect(weak / plain).toBeCloseTo(WEAK_MUL, 1);
    expect(WEAK_MUL).toBe(1.8);
  });

  it('the WRONG element is ~×0.4 (holy still pierces to ×0.75), an ABSORBED element deals 0 (ADR-134)', () => {
    const freezeX = ABILITIES.vibe_freeze_x; // element: freeze
    const plain = expectedAbilityDamage(freezeX, 40, new Set());
    const resisted = expectedAbilityDamage(freezeX, 40, new Set(), new Set(['freeze']));
    const absorbed = expectedAbilityDamage(freezeX, 40, new Set(), new Set(), new Set(['freeze']));
    expect(resisted / plain).toBeCloseTo(RESIST_MUL, 1); // ×0.4, a real reason to rotate off
    expect(RESIST_MUL).toBe(0.4);
    expect(absorbed).toBe(0); // absorbing an element is worse than useless — it heals the foe
    // holy's identity: it pierces a slice of the resist, landing ~×0.75 not ×0.4
    const starX = ABILITIES.starsong_x; // element: holy
    const starPlain = expectedAbilityDamage(starX, 40, new Set());
    const starResist = expectedAbilityDamage(starX, 40, new Set(), new Set(['holy']));
    expect(starResist / starPlain).toBeCloseTo(HOLY_PIERCE_MUL, 1);
  });

  it('heals and pure-status casts deal no damage', () => {
    expect(expectedAbilityDamage(ABILITIES.lifeup_a, 40, new Set())).toBe(0);
    expect(expectedAbilityDamage(ABILITIES.hypno_a, 40, new Set())).toBe(0);
  });

  it("PP-affordability filters out a nuke the hero can't pay for", () => {
    // a low-level Jay can't afford the 96-PP Surge Σ even once
    const lowNuke = heroBestNuke('rex', 8, new Set());
    expect(lowNuke?.ability.id).not.toBe('vibe_surge_x');
    // by L52 his bar is deep enough that Σ is on the table
    const ids = abilitiesByLevel('rex', 52).map((a) => a.id);
    expect(ids).toContain('vibe_surge_x');
  });
});

describe('ADR-134 elemental identity: same-tier parity, and the RIGHT element beats the biggest', () => {
  // Mia's four damaging elements, by tier (γ/Ω/Σ — the "nuke" tiers where the old
  // "biggest number wins" bug lived; α/β stay leap-gated openers).
  const TIER = {
    γ: { fire: 'vibe_fire_g', freeze: 'vibe_freeze_g', volt: 'vibe_volt_g', star: 'starsong_g' },
    Ω: { fire: 'vibe_fire_o', freeze: 'vibe_freeze_o', volt: 'vibe_volt_o', star: 'starsong_o' },
    Σ: { fire: 'vibe_fire_x', freeze: 'vibe_freeze_x', volt: 'vibe_volt_x', star: 'starsong_x' },
  } as const;
  const pw = (id: string): number => ABILITIES[id].power;

  it('Freeze = Volt = Starsong at every nuke tier — so the element multiplier, not the number, decides the pick', () => {
    for (const t of ['γ', 'Ω', 'Σ'] as const) {
      const { freeze, volt, star } = TIER[t];
      expect(pw(freeze), `${t} freeze/volt parity`).toBe(pw(volt));
      expect(pw(volt), `${t} volt/starsong parity`).toBe(pw(star));
    }
  });

  it('Fire sits 10–15% under parity on direct power — it makes the difference up in burn DoT (its identity)', () => {
    for (const t of ['γ', 'Ω', 'Σ'] as const) {
      const ceiling = pw(TIER[t].freeze);
      const ratio = pw(TIER[t].fire) / ceiling;
      expect(ratio, `Fire ${t} vs parity`).toBeGreaterThanOrEqual(0.83);
      expect(ratio, `Fire ${t} vs parity`).toBeLessThanOrEqual(0.9);
    }
  });

  it('the RIGHT element beats spam: hitting a weakness out-damages the biggest neutral nuke when that element is resisted', () => {
    // Mia at L52. Against a freeze-weak foe she picks Freeze Σ (×1.8); against a
    // freeze-RESISTING foe her best nuke is a NEUTRAL element (no bonus). The read wins.
    const onWeakness = heroBestNuke('faye', 52, new Set(['freeze']));
    const offElement = heroBestNuke('faye', 52, new Set(), new Set(), new Set(['freeze']));
    expect(onWeakness, 'on-weakness nuke').toBeTruthy();
    expect(offElement, 'off-element nuke').toBeTruthy();
    expect(onWeakness!.dmg).toBeGreaterThan(offElement!.dmg);
    // and the pick actually ROTATES onto the weak element rather than the biggest raw nuke
    expect(onWeakness!.ability.element).toBe('freeze');
  });

  it('no same-tier nuke is strictly dominant: at parity, no non-Fire element out-powers another', () => {
    for (const t of ['γ', 'Ω', 'Σ'] as const) {
      const powers = [TIER[t].freeze, TIER[t].volt, TIER[t].star].map(pw);
      expect(Math.max(...powers)).toBe(Math.min(...powers)); // all equal → none dominant
    }
  });
});

describe('ADR-134 the Break loop: PLAYING THE READ beats SPAMMING the biggest number', () => {
  const checks = allReadVsSpam();

  it('breakLoopDpr is an uplift over the base DPR (the ×2 window pays), bigger for trash', () => {
    expect(breakLoopDpr(1000, true)).toBeGreaterThan(1000); // even a break-resistant boss gains
    expect(breakLoopDpr(1000, false)).toBeGreaterThan(breakLoopDpr(1000, true)); // trash breaks faster
  });

  it('every boss falls at LEAST as fast to a party that plays the read as one that spams', () => {
    for (const c of checks) {
      expect(c.readDpr, `${c.name} read≥spam DPR`).toBeGreaterThanOrEqual(c.spamDpr);
      expect(c.readTtk, `${c.name} read≤spam TTK`).toBeLessThanOrEqual(c.spamTtk);
    }
  });

  it('across the whole suite the read is STRICTLY faster — the right action beats the biggest', () => {
    const readTtk = checks.reduce((a, c) => a + c.readTtk, 0);
    const spamTtk = checks.reduce((a, c) => a + c.spamTtk, 0);
    const readDpr = checks.reduce((a, c) => a + c.readDpr, 0);
    const spamDpr = checks.reduce((a, c) => a + c.spamDpr, 0);
    expect(readTtk).toBeLessThan(spamTtk); // clears the game in fewer rounds
    expect(readDpr).toBeGreaterThan(spamDpr); // and out-damages it every step
  });

  it('the model covers all ten bosses and some carry an exploitable weakness (the read has teeth)', () => {
    expect(checks.length).toBe(10);
    expect(checks.some((c) => c.weakness.length > 0)).toBe(true);
  });
});

describe('ADR-134 Milo & Pippa are not dead weight late (the flat-tool crew earns its keep)', () => {
  const ledger = allBreakEconomy();

  it("Milo's siege SCALES with the boss — it climbs from hundreds early to thousands at the Hush", () => {
    const early = ledger.find((r) => r.chapter === 1)!;
    const late = ledger.find((r) => r.chapter === 10)!;
    expect(late.siege).toBeGreaterThan(early.siege * 5); // no longer a flat 360 against a 150k boss
    expect(late.siege).toBeGreaterThan(3000); // 360 + 2% of 150k = 3,360
    // and it climbs monotonically with boss HP (the %-max-HP bite tracks the fight)
    for (let i = 1; i < ledger.length; i++) expect(ledger[i].siege).toBeGreaterThanOrEqual(ledger[i - 1].siege);
  });

  it("Milo's control + Pippa's mark ACCELERATE the break — fewer actions to stagger the boss", () => {
    for (const r of ledger) {
      expect(r.actionsHelped, `Ch.${r.chapter} helped<plain`).toBeLessThan(r.actionsPlain);
    }
    // it roughly halves the setup (a 3-action break becomes ~2) — a material acceleration
    const totalPlain = ledger.reduce((a, r) => a + r.actionsPlain, 0);
    const totalHelped = ledger.reduce((a, r) => a + r.actionsHelped, 0);
    expect(totalHelped).toBeLessThanOrEqual(totalPlain * 0.7);
  });

  it("Milo's siege carries a %-max-HP rider AND deepens a break (the two-part flat-tool fix)", () => {
    expect(ABILITIES.siege_rocket.pctMaxHp).toBe(0.02);
    expect(ABILITIES.siege_rocket.deepensBreak).toBe(true);
  });
});

describe('every §A6 boss falls in a fair number of turns at its target level', () => {
  const checks = allBossChecks();

  it('boss HP and target level climb together across the ten chapters', () => {
    for (let i = 1; i < checks.length; i++) {
      expect(checks[i].hp, `Ch.${checks[i].chapter} HP`).toBeGreaterThan(checks[i - 1].hp);
      expect(checks[i].level).toBeGreaterThanOrEqual(checks[i - 1].level);
    }
  });

  it('every boss TTK is in the fair 2–25 window (conservative: base stats, no weapons)', () => {
    for (const b of checks) {
      expect(b.ttk, `${b.name} TTK`).toBeGreaterThanOrEqual(2);
      expect(b.ttk, `${b.name} TTK`).toBeLessThanOrEqual(25);
    }
  });

  it('the party grows to match — DPR climbs as the bosses do', () => {
    for (let i = 1; i < checks.length; i++) {
      expect(checks[i].partyDpr).toBeGreaterThan(checks[i - 1].partyDpr);
    }
  });

  it('the party never over-counts: Jay solos the Tick, the party grows to five', () => {
    expect(BOSS_PARTY[1]).toEqual(['rex']);
    expect(BOSS_PARTY[10]).toHaveLength(5);
  });
});

describe('the Hush finale stays fair at every reachable party size (§4.3, ADR-130)', () => {
  const checks = finaleHushChecks();
  const byId = (id: string): FinaleCheck => {
    const f = checks.find((c) => c.id === id);
    expect(f, `finale variant '${id}'`).toBeDefined();
    return f as FinaleCheck;
  };

  it('every reachable loadout (3/4/5 × Ω × Stolen Light) lands in the fair TTK 4–10 window', () => {
    // tighter than the 2–25 suite window on purpose: the finale is the one hand-tuned
    // set-piece, and §4.3 mandates 4–10 across party sizes and loadouts.
    expect(checks.length).toBeGreaterThanOrEqual(5);
    for (const f of checks) {
      expect(f.ttk, `${f.id} TTK`).toBeGreaterThanOrEqual(4);
      expect(f.ttk, `${f.id} TTK`).toBeLessThanOrEqual(10);
    }
  });

  it('all three party sizes 3/4/5 are represented', () => {
    expect(new Set(checks.map((f) => f.size))).toEqual(new Set([3, 4, 5]));
  });

  it('the warm full-five is the canon baseline — it equals bossCheck(10)', () => {
    const warm = byId('warm');
    const canon = bossCheck(10);
    expect(warm.size).toBe(5);
    expect(warm.hp).toBe(canon.hp);
    expect(warm.partyDpr).toBe(canon.partyDpr);
    expect(warm.ttk).toBe(canon.ttk);
  });

  it('losing the powerhouse (Dorin) costs you — those paths are no easier than warm', () => {
    const warm = byId('warm');
    expect(byId('iron_dorin_left').ttk).toBeGreaterThanOrEqual(warm.ttk);
    expect(byId('iron_strings_cold').ttk).toBeGreaterThanOrEqual(warm.ttk);
  });

  it('withholding Comet Ω strictly weakens Dorin (the IRON battle-gate has teeth)', () => {
    const weak = new Set<string>();
    const full = heroDamagePerRound('dorin', 52, weak, 52);
    const held = heroDamagePerRound('dorin', 52, weak, 52, new Set(['vibe_comet_o']));
    expect(held).toBeLessThan(full);
  });

  it('the Stolen Light is a chip, not a nuke (well under a tenth of the party DPR)', () => {
    expect(STOLEN_LIGHT_CHIP).toBeGreaterThan(0);
    expect(STOLEN_LIGHT_CHIP).toBeLessThan(byId('warm').partyDpr * 0.1);
  });

  it('money > combat: every eased HP is ≤ the canon Hush HP (< the Ch.10 Fortune target)', () => {
    const canonHp = CHAPTER_MANIFESTS['10'].boss.hp;
    expect(FINALE_HUSH_HP[5]).toBe(canonHp);
    for (const hp of Object.values(FINALE_HUSH_HP)) expect(hp).toBeLessThanOrEqual(canonHp);
  });
});

describe('the landed Ch.1–2 slice is COMPLETABLE start-to-finish (B4)', () => {
  for (const ch of [1, 2]) {
    const m = CHAPTER_MANIFESTS[String(ch)];
    it(`Ch.${ch} "${m.title}" is shipped with live maps, quests, and a beatable boss`, () => {
      expect(m.status).toBe('shipped');
      expect(m.maps.length).toBeGreaterThan(0);
      expect(m.quests.length).toBeGreaterThan(0);
      // the boss is live in ENEMIES, flagged a boss, at its canon HP
      const live = ENEMIES[m.boss.id];
      expect(live, `${m.boss.id} live`).toBeDefined();
      expect(live.boss).toBe(true);
      expect(live.hp).toBe(m.boss.hp);
      // and the party at the §A6 level can actually fell it
      const b = bossCheck(ch);
      expect(b.ttk).toBeGreaterThanOrEqual(2);
      expect(b.ttk).toBeLessThanOrEqual(25);
    });
  }

  it('the chapter gate chain is coherent: Ch.2 stands behind Ch.1', () => {
    // ch2_complete and ch1_complete are distinct progression flags
    expect(CHAPTER_MANIFESTS['1'].targetLevel).toBeLessThan(CHAPTER_MANIFESTS['2'].targetLevel);
  });
});

describe('AWAKENING_LEVEL stays honest both directions (verify.ts ⇄ ADR-035)', () => {
  it('every awakening has a sane earned-by level, and there are no orphan rows', () => {
    for (const a of Object.values(AWAKENINGS)) {
      const lv = AWAKENING_LEVEL[a.id];
      expect(lv, `${a.id} level`).toBeDefined();
      expect(lv).toBeGreaterThanOrEqual(1);
      expect(lv).toBeLessThanOrEqual(60);
    }
    for (const id of Object.keys(AWAKENING_LEVEL)) {
      expect(AWAKENINGS[id], `AWAKENING_LEVEL '${id}' is a real awakening`).toBeDefined();
    }
  });
});
