/**
 * THE PHASE MACHINE, proven headlessly (S14 — Bible Prompt 15's done-when):
 * every §A6 canon trigger type fires as data so Prompts 29–34 are data-only.
 * The Gilded Grin's swap runs off its REAL script (src/data/bosses.ts);
 * the other gimmicks run synthetic defs shaped exactly like their chapters
 * will ship them (summons-refill, skin-shed heal, riddle branch, mercy-end).
 */
import { describe, expect, it } from 'vitest';
import { PhaseRunner, pickRiddle, prayTierAtLeast, CRACK_TURNS, type PhaseEffects } from './phases';
import { BOSS_SCRIPTS } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import type { BossScriptDef } from '../schemas';

/** effects recorder — every call lands in `log` in order */
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

describe('THE GILDED GRIN — the §A6 Ch.2 swap, on its real script', () => {
  it('telegraphs one turn before every swap, then alternates forms', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.gilded_grin, fx);
    expect(r.form?.id).toBe('solid');
    for (let t = 1; t <= 11; t++) await r.onBossTurnStart();
    expect(log).toEqual([
      'line:idol_grin_wider', // turn 2 — it grins wider
      'form:hollow', // turn 3 — the gold turns out to be empty
      'line:idol_grin_wider', // turn 6
      'form:solid', // turn 7 — gold again
      'line:idol_grin_wider', // turn 10
      'form:hollow', // turn 11
    ]);
  });

  it('SOLID GOLD shrugs bats, HOLLOW shrugs Vibe — and PRAY always lands', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.gilded_grin, fx);
    expect(r.damageMul('physical')).toBe(0); // solid: clang
    expect(r.damageMul('vibe')).toBe(1);
    expect(r.damageMul('pray')).toBe(1);
    for (let t = 1; t <= 3; t++) await r.onBossTurnStart(); // → hollow
    expect(r.form?.id).toBe('hollow');
    expect(r.damageMul('physical')).toBe(1); // bats land
    expect(r.damageMul('vibe')).toBe(0); // the Vibe slides off nothing
    expect(r.damageMul('pray')).toBe(1);
  });

  it('Vibe Freeze CRACKS the gold — physical lands while brittle, then it seals', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.gilded_grin, fx);
    expect(r.crackBy('fire')).toBe(false); // only frost reads the seams
    expect(r.damageMul('physical')).toBe(0);
    expect(r.crackBy('freeze')).toBe(true); // the §A6 edge case, taught
    expect(r.crackBy('freeze')).toBe(false); // refill, not a fresh read
    expect(r.damageMul('physical')).toBe(1); // brittle: bats land on gold
    for (let i = 0; i < CRACK_TURNS; i++) await r.onBossTurnStart();
    expect(r.damageMul('physical')).toBe(0); // the gold sealed itself
  });

  it("Mia's awakening is due exactly once — the first HOLLOW reveal (ADR-035)", async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.gilded_grin, fx);
    expect(r.awakeningDue()).toBeNull(); // solid: nothing yet
    for (let t = 1; t <= 3; t++) await r.onBossTurnStart();
    expect(r.awakeningDue()).toBe('cold_reads'); // hollow, the first time
    expect(r.awakeningDue()).toBeNull(); // never again
    for (let t = 4; t <= 11; t++) await r.onBossTurnStart(); // hollow again at 11
    expect(r.form?.id).toBe('hollow');
    expect(r.awakeningDue()).toBeNull();
  });

  it("Jay's POWER SHIELD Σ awakens at the Grin's half-dead desperation blow — once (S16, ADR-035)", async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.gilded_grin, fx);
    await r.onHpFrac(0.6); // still above the threshold — nothing yet
    expect(log).toEqual([]);
    await r.onHpFrac(0.44); // the desperation blow: telegraph, then the wall answers
    expect(log).toEqual(['line:idol_gathering', 'awaken:the_wall_that_answers']);
    await r.onHpFrac(0.2); // never twice — the moment fired once
    expect(log).toEqual(['line:idol_gathering', 'awaken:the_wall_that_answers']);
  });

  it('a fresh form arrives whole — swapping clears any standing crack', async () => {
    const { fx } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.gilded_grin, fx);
    r.crackBy('freeze');
    for (let t = 1; t <= 3; t++) await r.onBossTurnStart(); // → hollow
    for (let t = 4; t <= 7; t++) await r.onBossTurnStart(); // → solid again
    expect(r.form?.id).toBe('solid');
    expect(r.damageMul('physical')).toBe(0); // the old crack didn't carry
  });
});

describe('THE HEADMASTER MAINFRAME — the §A6 Ch.3 summon loop, on its real script (ADR-099)', () => {
  it('opens with two Prefect Drones, then refills the pair every time both are down', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.headmaster_mainframe, fx);
    await r.onAllSummonsDead(); // nothing summoned yet — the machine is silent
    expect(log).toEqual([]);
    await r.onBossTurnStart(); // turn 1 — supervision is assigned
    expect(log).toEqual(['line:mainframe_open', 'summon:prefect_dronex2']);
    await r.onAllSummonsDead(); // both drones down → a fresh pair, forever
    await r.onAllSummonsDead();
    expect(log).toEqual([
      'line:mainframe_open', 'summon:prefect_dronex2',
      'line:mainframe_refill', 'summon:prefect_dronex2',
      'line:mainframe_refill', 'summon:prefect_dronex2',
    ]);
  });

  it('overclocks ONCE through 40% HP — its last bluster, no new mechanic', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.headmaster_mainframe, fx);
    await r.onHpFrac(0.5); // above the threshold — nothing
    expect(log).toEqual([]);
    await r.onHpFrac(0.39); // the cooling fans scream
    await r.onHpFrac(0.1); // never twice
    expect(log).toEqual(['line:mainframe_overclock']);
  });

  it('the §A6 cooling-fan weak point lives on the enemy, not the script — Vibe Freeze literally DOUBLES (ADR-099)', () => {
    // the summoner declares NO forms/immunities — Milo's Spy + Vibe Freeze land because
    // the live enemy is weak to freeze AND carries weakMul:2, so a freeze hit is ×2
    // (the generic §A7 weakness is ×1.5), exactly as §A6 promises ("doubles damage").
    expect(BOSS_SCRIPTS.headmaster_mainframe.forms).toBeUndefined();
    expect(ENEMIES.headmaster_mainframe.weakness).toContain('freeze');
    expect(ENEMIES.headmaster_mainframe.weakMul).toBe(2);
    expect(ENEMIES.headmaster_mainframe.boss).toBe(true);
    expect(ENEMIES.headmaster_mainframe.mind_immune).toBe(true);
    expect(ENEMIES.headmaster_mainframe.hp).toBe(750);
  });
});

describe('WHISKERZILLA — the §A6 Ch.5 mercy/survival, on its real script', () => {
  it('turn 1 rings the Flat Bell in and blurs the cat (a summoned second target + evasion)', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.whiskerzilla, fx);
    expect(r.evasion).toBe(false);
    expect(await r.onBossTurnStart()).toBe('act'); // turn 1
    expect(log).toEqual(['line:whisker_bell_ring', 'summon:flat_bellx1']);
    expect(r.evasion).toBe(true); // the ringing bell blurs Whiskerzilla
  });

  it('breaking the Flat Bell drops the blur — the purr gives every move away (evasion off)', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.whiskerzilla, fx);
    await r.onAllSummonsDead(); // nothing rung yet — the bell trigger stays silent
    expect(log).toEqual([]);
    await r.onBossTurnStart(); // turn 1 — the bell rings, evasion on
    expect(r.evasion).toBe(true);
    await r.onAllSummonsDead(); // the Flat Bell is broken
    expect(r.evasion).toBe(false);
    expect(log).toEqual(['line:whisker_bell_ring', 'summon:flat_bellx1', 'line:whisker_purr']);
  });

  it('POUNCEs the party Flat every 3rd turn, then gets bored at 12 → mercy (a win without a kill)', async () => {
    const { fx, log } = recorder();
    const r = new PhaseRunner(BOSS_SCRIPTS.whiskerzilla, fx);
    expect(r.mercy).toBe(false);
    for (let t = 1; t <= 12; t++) await r.onBossTurnStart();
    expect(log).toEqual([
      'line:whisker_bell_ring', 'summon:flat_bellx1', // turn 1 — the bell rings in
      'line:whisker_pounce', 'status:paralyzed:1', // turn 3 — tail-wiggle POUNCE
      'line:whisker_pounce', 'status:paralyzed:1', // turn 6
      'line:whisker_pounce', 'status:paralyzed:1', // turn 9
      'line:whisker_pounce', 'status:paralyzed:1', // turn 12 — one last pounce…
      'line:whisker_bored', 'mercy', // …then it loses interest (endBattleMercy → victory)
    ]);
    expect(r.mercy).toBe(true); // the scene resolves victory WITHOUT a kill
  });

  it('the survival gimmick rides DATA — 4000 HP, mind_immune, no weakness, no form swaps', () => {
    expect(ENEMIES.whiskerzilla.hp).toBe(4000);
    expect(ENEMIES.whiskerzilla.boss).toBe(true);
    expect(ENEMIES.whiskerzilla.mind_immune).toBe(true);
    expect(ENEMIES.whiskerzilla.weakness).toEqual([]); // the bell + the Defend read IS the gimmick
    expect(BOSS_SCRIPTS.whiskerzilla.forms).toBeUndefined();
    expect(ENEMIES.flat_bell.hp).toBe(150); // the summoned second target, broken to drop the blur
  });
});

describe('the OTHER canon triggers (synthetic defs shaped like their chapters)', () => {
  it('summons-refill: bothSummonsDead re-summons every time (the Mainframe)', async () => {
    const def: BossScriptDef = {
      boss: 'test_mainframe',
      phases: [
        { id: 'open', trigger: { kind: 'turnCount', n: 1 }, actions: [{ kind: 'summon', enemy: 'blazer_smiler', n: 2 }] },
        { id: 'refill', trigger: { kind: 'bothSummonsDead' }, once: false, actions: [{ kind: 'summon', enemy: 'blazer_smiler', n: 2 }] },
      ],
    };
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onAllSummonsDead(); // nothing was ever summoned — silence
    expect(log).toEqual([]);
    await r.onBossTurnStart();
    expect(log).toEqual(['summon:blazer_smilerx2']);
    await r.onAllSummonsDead();
    await r.onAllSummonsDead(); // both down again later — refills again
    expect(log).toEqual(['summon:blazer_smilerx2', 'summon:blazer_smilerx2', 'summon:blazer_smilerx2']);
  });

  it('skin-shed heal: hpBelow fires ONCE through the threshold (Cobra Raja)', async () => {
    const def: BossScriptDef = {
      boss: 'test_raja',
      phases: [
        {
          id: 'shed',
          trigger: { kind: 'hpBelow', frac: 0.4 },
          actions: [{ kind: 'scriptLine', line: 'npc_mom' }, { kind: 'healSelf', amount: 800 }],
        },
      ],
    };
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onHpFrac(0.55);
    expect(log).toEqual([]);
    await r.onHpFrac(0.39);
    await r.onHpFrac(0.2); // still under — but the skin only sheds once
    expect(log).toEqual(['line:npc_mom', 'heal:800']);
  });

  it('riddle branch: correct stuns the boss 3 turns; wrong sets the party Crying (the Sphinx)', async () => {
    const def: BossScriptDef = {
      boss: 'test_sphinx',
      phases: [
        { id: 'right', trigger: { kind: 'riddleAnswered', ok: true }, actions: [{ kind: 'stunSelf', turns: 3 }] },
        { id: 'wrong', trigger: { kind: 'riddleAnswered', ok: false }, actions: [{ kind: 'partyStatus', status: 'crying', turns: 3 }] },
      ],
    };
    {
      const { fx, log } = recorder();
      const r = new PhaseRunner(def, fx);
      await r.onRiddleAnswered(true);
      expect(log).toEqual([]); // stun is runner state, not an effect call
      expect(await r.onBossTurnStart()).toBe('skip'); // §A6: skip its first 3 turns
      expect(await r.onBossTurnStart()).toBe('skip');
      expect(await r.onBossTurnStart()).toBe('skip');
      expect(await r.onBossTurnStart()).toBe('act');
    }
    {
      const { fx, log } = recorder();
      const r = new PhaseRunner(def, fx);
      await r.onRiddleAnswered(false);
      expect(log).toEqual(['status:crying:3']);
      expect(await r.onBossTurnStart()).toBe('act'); // wrong answers don't stun
    }
  });

  it("mercy-end: prayTierAtLeast('good') ends it on good or better (Hoaxula)", async () => {
    const def: BossScriptDef = {
      boss: 'test_hoaxula',
      phases: [
        { id: 'mercy', trigger: { kind: 'prayTierAtLeast', tier: 'good' }, actions: [{ kind: 'endBattleMercy' }] },
      ],
    };
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onPrayTier('nothing');
    await r.onPrayTier('strange');
    await r.onPrayTier('backfire');
    expect(log).toEqual([]);
    expect(r.mercy).toBe(false);
    await r.onPrayTier('good');
    expect(log).toEqual(['mercy']);
    expect(r.mercy).toBe(true);
    // the ranking helper itself, pinned
    expect(prayTierAtLeast('miraculous', 'good')).toBe(true);
    expect(prayTierAtLeast('wonderful', 'good')).toBe(true);
    expect(prayTierAtLeast('nothing', 'good')).toBe(false);
  });

  it('steal-and-return + setSpeedMul express as data (Hoaxula / Paper Dragon)', async () => {
    const def: BossScriptDef = {
      boss: 'test_theatrics',
      phases: [
        { id: 'steal', trigger: { kind: 'turnCount', n: 1 }, actions: [{ kind: 'stealEquipped' }] },
        { id: 'desperate', trigger: { kind: 'hpBelow', frac: 0.25 }, actions: [{ kind: 'setSpeedMul', mul: 2 }] },
      ],
    };
    const { fx, log } = recorder();
    const r = new PhaseRunner(def, fx);
    await r.onBossTurnStart();
    expect(log).toEqual(['steal']);
    expect(r.speedMul).toBe(1);
    await r.onHpFrac(0.2);
    expect(r.speedMul).toBe(2); // the scene reads this as an extra action
  });

  it('the riddle pool plumbing picks deterministically and wraps (built for the Sphinx)', () => {
    const pool = [
      { q: 'What walks?', options: ['Me', 'You'], correct: 1 },
      { q: 'What waits?', options: ['Sand', 'More sand', 'A bus'], correct: 0 },
    ];
    expect(pickRiddle(pool, 0).q).toBe('What walks?');
    expect(pickRiddle(pool, 1).q).toBe('What waits?');
    expect(pickRiddle(pool, 2).q).toBe('What walks?'); // wraps
    expect(pickRiddle(pool, -1).q).toBe('What waits?'); // negatives wrap too
  });
});
