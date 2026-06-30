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

  it('a matching boss weakness multiplies a Vibe cast ×1.5', () => {
    const fireA = ABILITIES.vibe_fire_a;
    const plain = expectedAbilityDamage(fireA, 40, new Set());
    const weak = expectedAbilityDamage(fireA, 40, new Set(['fire']));
    expect(weak).toBeGreaterThan(plain);
    expect(weak / plain).toBeCloseTo(1.5, 1);
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
