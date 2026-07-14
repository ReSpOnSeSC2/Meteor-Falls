import { describe, expect, it } from 'vitest';
import { PhaseRunner, type PhaseEffects } from '../battle/phases';
import { applyMushroomize, recoverMushroomizedParty } from '../engine/mushroomize';
import { freshMushroomize } from '../engine/state';
import { s } from '../spritegen/scale';
import { BOSS_SCRIPTS } from './bosses';
import { ENEMIES, ORIGAMI_REFOLD_TURNS, enemyElementProfile } from './enemies';
import { CH8_WORLD } from './maps_ch8';

const CH8_REGULARS = [
  'paper_lantern_wisp',
  'spore_puffer',
  'origami_warrior',
  'porcelain_warlord',
] as const;

function recorder(): { fx: PhaseEffects; log: string[] } {
  const log: string[] = [];
  return {
    log,
    fx: {
      scriptLine: (id) => void log.push(`line:${id}`),
      setForm: (form) => void log.push(`form:${form.id}`),
      summon: (enemy, n) => void log.push(`summon:${enemy}x${n}`),
      healSelf: (amount) => void log.push(`heal:${amount}`),
      stealEquipped: () => void log.push('steal'),
      returnStolen: () => void log.push('return'),
      endBattleMercy: () => void log.push('mercy'),
      partyStatus: (status, turns) => void log.push(`status:${status}:${turns}`),
      partyDamage: (amount) => void log.push(`damage:${amount}`),
      awaken: (id) => void log.push(`awaken:${id}`),
    },
  };
}

describe('Chapter 8 focused regular roster', () => {
  it('pins exactly four authored regular contracts and their curve', () => {
    expect(CH8_REGULARS).toEqual([
      'paper_lantern_wisp',
      'spore_puffer',
      'origami_warrior',
      'porcelain_warlord',
    ]);
    expect(CH8_REGULARS.map((id) => [id, ENEMIES[id].hp, ENEMIES[id].level])).toEqual([
      ['paper_lantern_wisp', 5_500, 36],
      ['spore_puffer', 6_500, 37],
      ['origami_warrior', 8_000, 38],
      ['porcelain_warlord', 11_000, 40],
    ]);
    for (const id of CH8_REGULARS) {
      expect(ENEMIES[id].boss, id).not.toBe(true);
      expect(ENEMIES[id].sprite, id).toBe(`battle_${id}`);
      expect(ENEMIES[id].mini, id).toBe(`mini_${id}`);
      expect(ENEMIES[id].drops?.length, id).toBeGreaterThan(0);
    }
  });

  it('uses the real Mushroomized token, a weakness-reversing refold, and a same-roster porcelain split', () => {
    expect(ENEMIES.spore_puffer.moves.find((move) => move.name === 'spore cloud')).toMatchObject({
      kind: 'status',
      status: 'mushroomize',
    });
    expect(ENEMIES.origami_warrior.moves.find((move) => move.name === 'refold')).toMatchObject({
      kind: 'refold',
    });
    expect(ORIGAMI_REFOLD_TURNS).toBe(4);
    expect(enemyElementProfile(ENEMIES.origami_warrior)).toEqual({
      weakness: ['fire', 'volt'],
      resists: ['freeze'],
    });
    expect(enemyElementProfile(ENEMIES.origami_warrior, true)).toEqual({
      weakness: ['volt', 'freeze'],
      resists: ['fire'],
    });
    expect(ENEMIES.porcelain_warlord.moves.find((move) => move.kind === 'split')).toMatchObject({
      summon: 'paper_lantern_wisp',
      count: 2,
    });
  });

  it('feeds Spore Puffer infliction into the persistent status and defeat-recovery domains', () => {
    const puffer = ENEMIES.spore_puffer;
    const cloud = puffer.moves.find((move) => move.name === 'spore cloud');
    expect(cloud).toMatchObject({ kind: 'status', status: 'mushroomize' });
    if (!cloud || cloud.kind !== 'status' || cloud.status !== 'mushroomize') {
      throw new Error('Spore Puffer lost its Mushroomized battle hook');
    }

    const safe = CH8_WORLD.sporeForest.recovery;
    const recovery = {
      map: 'spore_forest',
      x: s(safe.x * 16 + 8),
      y: s(safe.y * 16 + 12),
      facing: safe.facing,
    };
    const inflicted = applyMushroomize(freshMushroomize(), {
      phase: 0,
      source: puffer.id,
      recovery,
    });
    expect(inflicted).toEqual({
      active: true,
      phase: 0,
      source: 'spore_puffer',
      recovery,
    });

    const defeated = recoverMushroomizedParty(inflicted);
    expect(defeated.recovery).toEqual(recovery);
    expect(defeated.state).toEqual(freshMushroomize());
  });
});

describe('Paper Dragon executable contract', () => {
  it('pins enemy data and the live script together', () => {
    const dragon = ENEMIES.paper_dragon;
    const script = BOSS_SCRIPTS.paper_dragon;
    expect(dragon).toMatchObject({
      hp: 45_000,
      level: 40,
      offense: 80,
      defense: 42,
      speed: 34,
      weakness: [],
      resists: ['volt'],
      boss: true,
      mind_immune: true,
      sprite: 'battle_paper_dragon',
    });
    expect(script.boss).toBe(dragon.id);
    expect(script.initialForm).toBe('airborne');
    expect(script.forms).toEqual([
      expect.objectContaining({
        id: 'airborne',
        physicalImmune: true,
        groundedBy: ['volt', 'bottle_rockets'],
        groundedTurns: 2,
      }),
      expect.objectContaining({
        id: 'burning',
        spriteSuffix: '_burning',
      }),
    ]);
    expect(script.phases).toEqual([
      expect.objectContaining({
        id: 'desperate',
        trigger: { kind: 'hpBelow', frac: 0.3 },
      }),
    ]);
  });

  it('is physical-immune only while airborne and grounds for exactly two boss turns', async () => {
    const { fx } = recorder();
    const runner = new PhaseRunner(BOSS_SCRIPTS.paper_dragon, fx);
    expect(runner.form?.id).toBe('airborne');
    expect(runner.damageMul('physical')).toBe(0);
    expect(await runner.noiseOut('firecracker')).toBe(false);
    expect(await runner.noiseOut('volt')).toBe(true);
    expect(runner.damageMul('physical')).toBe(1);
    await runner.onBossTurnStart();
    expect(runner.damageMul('physical')).toBe(1);
    await runner.onBossTurnStart();
    expect(runner.damageMul('physical')).toBe(0);

    expect(await runner.noiseOut('bottle_rockets')).toBe(true);
    expect(runner.damageMul('physical')).toBe(1);
  });

  it('burns once below 30%, switches art family, and doubles speed once', async () => {
    const { fx, log } = recorder();
    const runner = new PhaseRunner(BOSS_SCRIPTS.paper_dragon, fx);
    await runner.onHpFrac(0.3);
    expect(log).toEqual([]);
    await runner.onHpFrac(0.299);
    expect(log).toEqual(['form:burning', 'line:dragon_burn']);
    expect(runner.form?.id).toBe('burning');
    expect(runner.spriteFor(ENEMIES.paper_dragon.sprite)).toBe('battle_paper_dragon_burning');
    expect(runner.speedMul).toBe(2);
    expect(runner.damageMul('physical')).toBe(1);
    await runner.onHpFrac(0.1);
    expect(log).toEqual(['form:burning', 'line:dragon_burn']);
    expect(runner.speedMul).toBe(2);
  });
});
