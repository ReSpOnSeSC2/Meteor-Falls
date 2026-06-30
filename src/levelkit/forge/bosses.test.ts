/**
 * THE TEN BOSS TEMPLATES — proven HEADLESSLY (S15g Movement Three, ADR-046,
 * the phases.test.ts pattern). Each template drives its §A6 gimmick over the
 * real PhaseRunner and asserts the machine FIRES; the four template extensions
 * (noise-grounding, evasion, the golem heal-inversion, the latch archetype)
 * are exercised on synthetic + drafted defs. Plus: every drafted boss parses,
 * is byte-stable (hash-pinned), and CANNOT masquerade as the shipped Grin.
 */
import { describe, expect, it } from 'vitest';
import { PhaseRunner, NOISE_TURNS, type PhaseEffects } from '../../battle/phases';
import { BOSS_SCRIPTS } from '../../data/bosses';
import { BossScriptDefSchema } from '../../schemas';
import { ENEMIES } from '../../data/enemies';
import {
  airborneGrounded,
  elementalGolem,
  formSwap,
  latchDrain,
  mercyEnding,
  riddle,
  scriptedSurvival,
  summoner,
  thresholdHeal,
  untargetableUntilNoise,
} from './bosses';
import { DRAFT_BOSS_SCRIPTS, DRAFT_BOSS_IDS } from '../../data/drafts/bosses';

/** the phases.test.ts recorder — every effect call lands in `log` in order */
function recorder(): { fx: PhaseEffects; log: string[] } {
  const log: string[] = [];
  const fx: PhaseEffects = {
    scriptLine: (id) => void log.push(`line:${id}`),
    setForm: (f) => void log.push(`form:${f.id}`),
    summon: (e, n) => void log.push(`summon:${e}x${n}`),
    healSelf: (a) => void log.push(`heal:${a}`),
    stealEquipped: () => void log.push('steal'),
    returnStolen: () => void log.push('return'),
    endBattleMercy: () => void log.push('mercy'),
    partyStatus: (s, t) => void log.push(`status:${s}:${t}`),
    awaken: (id) => void log.push(`awaken:${id}`),
  };
  return { fx, log };
}

function fnv(o: unknown): string {
  const s = JSON.stringify(o);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

describe('S15g M3c — 1. formSwap (the Gilded Grin shape)', () => {
  const def = formSwap('test_grin', {
    opening: { id: 'solid', name: 'SOLID', physicalImmune: true, crackedBy: 'freeze', spriteSuffix: '' },
    other: { id: 'hollow', name: 'HOLLOW', vibeImmune: true, spriteSuffix: '_hollow' },
    telegraphLine: 'tele_draft',
    awakeningOnForm: { form: 'hollow', awakening: 'cold_reads' },
  });

  it('telegraphs one turn before every swap, then alternates', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    expect(r.form?.id).toBe('solid');
    for (let t = 1; t <= 11; t++) await r.onBossTurnStart();
    expect(log).toEqual(['line:tele_draft', 'form:hollow', 'line:tele_draft', 'form:solid', 'line:tele_draft', 'form:hollow']);
  });

  it('immunities ride the forms; the awakening is due exactly once', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(def, fx);
    expect(r.damageMul('physical')).toBe(0); // solid clangs
    expect(r.damageMul('vibe')).toBe(1);
    for (let t = 1; t <= 3; t++) await r.onBossTurnStart(); // → hollow
    expect(r.awakeningDue()).toBe('cold_reads');
    expect(r.awakeningDue()).toBeNull();
    expect(r.damageMul('vibe')).toBe(0); // hollow shrugs Vibe
  });
});

describe('S15g M3c — 2. latchDrain (the Titanic Tick archetype)', () => {
  it('clamps on turn 1 and drains until the cure releases it', async () => {
    const def = latchDrain('test_tick', { amount: 30, latchLine: 'latch_draft' });
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    expect(r.latchAmount).toBe(0);
    await r.onBossTurnStart();
    expect(log).toEqual(['line:latch_draft']);
    expect(r.latchAmount).toBe(30); // the scene drains this per turn
    r.releaseLatch();
    expect(r.latchAmount).toBe(0);
  });
});

describe('S15g M3c — 3. summoner (Headmaster Mainframe)', () => {
  it('opens with a wave and refills the instant both are down, forever', async () => {
    const def = summoner('test_mainframe', { minion: 'prefect_drone', n: 2, openLine: 'open_draft' });
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onAllSummonsDead(); // nothing summoned yet — silence
    expect(log).toEqual([]);
    await r.onBossTurnStart();
    expect(log).toEqual(['line:open_draft', 'summon:prefect_dronex2']);
    await r.onAllSummonsDead();
    await r.onAllSummonsDead();
    expect(log.filter((l) => l.startsWith('summon')).length).toBe(3);
  });
});

describe('S15g M3c — 4. thresholdHeal (Cobra Raja)', () => {
  it('sheds once through the threshold and gazes every 3rd turn', async () => {
    const def = thresholdHeal('test_raja', {
      frac: 0.4,
      healAmount: 800,
      healLine: 'shed_draft',
      gaze: { every: 3, status: 'paralyzed', turns: 2 },
    });
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onHpFrac(0.55);
    expect(log).toEqual([]);
    await r.onHpFrac(0.39);
    await r.onHpFrac(0.2); // still under — but the skin only sheds once
    expect(log).toEqual(['line:shed_draft', 'heal:800']);
    for (let t = 1; t <= 3; t++) await r.onBossTurnStart();
    expect(log).toContain('status:paralyzed:2'); // the gaze landed on turn 3
  });
});

describe('S15g M3c — 5. riddle (the Laughing Sphinx)', () => {
  const def = riddle('test_sphinx', {
    intro: 'intro_draft',
    pool: [
      { q: 'a?', options: ['x', 'y'], correct: 1 },
      { q: 'b?', options: ['x', 'y'], correct: 0 },
    ],
    stunTurns: 3,
    wrong: { status: 'crying', turns: 3 },
  });

  it('correct stuns the boss 3 turns', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onRiddleAnswered(true);
    expect(await r.onBossTurnStart()).toBe('skip');
    expect(await r.onBossTurnStart()).toBe('skip');
    expect(await r.onBossTurnStart()).toBe('skip');
    expect(await r.onBossTurnStart()).toBe('act');
  });

  it('wrong starts the party Crying', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onRiddleAnswered(false);
    expect(log).toEqual(['status:crying:3']);
  });
});

describe('S15g M3c — 6. mercyEnding (Count Hoaxula)', () => {
  it('steals, unmasks at 50%, and Pray-good returns the gear + ends in mercy', async () => {
    const def = mercyEnding('test_hoaxula', {
      theatrical: { id: 'theatrical', name: 'THEATRICAL', spriteSuffix: '' },
      unmasked: { id: 'unmasked', name: 'UNMASKED', spriteSuffix: '_unmasked' },
      unmaskAt: 0.5,
      unmaskLine: 'unmask_draft',
      stealAt: 2,
      stealLine: 'steal_draft',
      prayTier: 'good',
    });
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onBossTurnStart();
    await r.onBossTurnStart(); // turn 2 → steal
    expect(log).toEqual(['line:steal_draft', 'steal']);
    await r.onHpFrac(0.49); // unmask
    expect(log).toContain('form:unmasked');
    await r.onPrayTier('nothing');
    expect(r.mercy).toBe(false);
    await r.onPrayTier('good');
    expect(log.slice(-2)).toEqual(['return', 'mercy']);
    expect(r.mercy).toBe(true);
  });
});

describe('S15g M3c — 7. airborneGrounded (the Paper Dragon)', () => {
  const def = airborneGrounded('test_dragon', {
    airborne: { id: 'airborne', name: 'AIRBORNE', spriteSuffix: '' },
    noise: ['volt', 'bottle_rockets'],
    groundedTurns: 2,
    desperateAt: 0.3,
    desperateLine: 'burn_draft',
    speedMul: 2,
    burning: { id: 'burning', name: 'BURNING', spriteSuffix: '_burning' },
  });

  it('is physical-immune airborne; NOISE grounds it for the beat', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(def, fx);
    expect(r.damageMul('physical')).toBe(0); // airborne shrugs bats
    expect(await r.noiseOut('firecracker')).toBe(false); // deaf to that noise
    expect(await r.noiseOut('volt')).toBe(true); // Volt knocks it down
    expect(r.damageMul('physical')).toBe(1); // grounded: bats land
    for (let i = 0; i < NOISE_TURNS; i++) await r.onBossTurnStart();
    expect(r.damageMul('physical')).toBe(0); // back in the air
  });

  it('self-immolates when low — burning form at doubled speed', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onHpFrac(0.29);
    expect(log).toEqual(['form:burning', 'line:burn_draft']);
    expect(r.speedMul).toBe(2);
  });
});

describe('S15g M3c — 8. scriptedSurvival (Whiskerzilla)', () => {
  const def = scriptedSurvival('test_whisker', {
    bell: { enemy: 'flat_bell', n: 1, ringLine: 'ring_draft', brokenLine: 'purr_draft' },
    pounce: { every: 3, line: 'pounce_draft' },
    boredAt: 6,
    boredLine: 'bored_draft',
  });

  it('the Flat Bell grants evasion until broken', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onBossTurnStart(); // ring
    expect(r.evasion).toBe(true);
    await r.onAllSummonsDead(); // bell breaks
    expect(r.evasion).toBe(false);
  });

  it('victory does not defeat it — it gets bored and ends in mercy', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(def, fx);
    for (let t = 1; t <= 6; t++) await r.onBossTurnStart();
    expect(r.mercy).toBe(true); // bored at turn 6
  });
});

describe('S15g M3c — 9. untargetableUntilNoise (the Whisperwig)', () => {
  const def = untargetableUntilNoise('test_wig', {
    burrowed: { id: 'burrowed', name: 'BURROWED', spriteSuffix: '' },
    exposed: { id: 'exposed', name: 'OUT', spriteSuffix: '_out', line: 'out_draft' },
    noise: ['volt', 'firecracker'],
    awakening: 'thunder_snore',
    hush: { every: 3, turns: 2 },
  });

  it('burrows untargetable until noise surfaces it (+ the awakening)', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    expect(r.targetable()).toBe(false); // burrowed in the ear canal
    expect(await r.noiseOut('volt')).toBe(true);
    expect(r.targetable()).toBe(true); // forced out
    expect(log).toContain('form:exposed');
    expect(r.awakeningDue()).toBe('thunder_snore'); // Mia's Vibe Volt α, once
    expect(r.awakeningDue()).toBeNull();
  });

  it('whispers party-wide Hushed every 3rd turn', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    for (let t = 1; t <= 3; t++) await r.onBossTurnStart();
    expect(log).toContain('status:hushed:2');
  });
});

describe('S15g M3c — 10. elementalGolem (Frost Sentinel / Tiki Magma Golem)', () => {
  it('physical clangs until the RIGHT element cracks it; the WRONG element heals', async () => {
    const frost = elementalGolem('test_frost', {
      form: { id: 'frost', name: 'FROST', spriteSuffix: '' },
      weakTo: 'fire',
      healedBy: 'freeze',
    });
    const { fx } = recorder();
    const r = new PhaseRunner(frost, fx);
    expect(r.damageMul('physical')).toBe(0); // stone shrugs bats
    expect(r.crackBy('freeze')).toBe(false); // the wrong element doesn't crack
    expect(r.healsFromElement('freeze')).toBe(true); // it HEALS instead
    expect(r.crackBy('fire')).toBe(true); // fire is the key
    expect(r.damageMul('physical')).toBe(1); // cracked: bats land
    expect(r.healsFromElement('fire')).toBe(false);
  });
});

describe('S15g M3c — the drafts parse, pin, and cannot masquerade', () => {
  it('every drafted boss parses as a BossScriptDef', () => {
    for (const [id, sc] of Object.entries(DRAFT_BOSS_SCRIPTS)) {
      expect(BossScriptDefSchema.safeParse(sc).success, id).toBe(true);
      expect(sc.boss, id).toBe(id); // the key drives the matching enemy
    }
  });

  it('the COUNT is law — no drafts remain (every §A6 boss + both Ch.10 minibosses promoted; THE HUSH is the bespoke finale)', () => {
    expect(Object.keys(DRAFT_BOSS_SCRIPTS).sort()).toEqual([...DRAFT_BOSS_IDS].sort());
    expect(DRAFT_BOSS_IDS.length).toBe(0);
  });

  it('no draft collides with a shipped boss script or a shipped §A7 enemy', () => {
    for (const id of DRAFT_BOSS_IDS) {
      expect(BOSS_SCRIPTS[id], id).toBeUndefined(); // not in the shipped registry
      expect(ENEMIES[id], id).toBeUndefined(); // its enemy is unshipped (drafts only)
    }
  });

  it('is byte-stable, twice + hash-pinned (a refactor that shifts one field fails here)', () => {
    expect(JSON.stringify(DRAFT_BOSS_SCRIPTS)).toBe(JSON.stringify(DRAFT_BOSS_SCRIPTS));
    expect(fnv(DRAFT_BOSS_SCRIPTS)).toBe('5465b825'); // empty: every §A6 boss + both Ch.10 minibosses promoted to BOSS_SCRIPTS; THE HUSH is the bespoke finale (the forge holds no draft now)
  });
});
