/**
 * S21 (ADR-127) — PARTY FATE. A choice can bench a companion and bring them back;
 * a benched hero is gone from the active party but their `<id>_left` flag (read by
 * the ending cards) is set, and rejoin rebuilds them.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GS } from './state';
import {
  departHero,
  rejoinHero,
  isPresent,
  withholdUltimate,
  isWithholding,
  awakenedAbilityIds,
  isWithheldAbility,
} from './party';

beforeEach(() => GS.reset());

describe('party fate — depart + rejoin', () => {
  it('benches a hero and records the leaving flag', () => {
    rejoinHero('faye', 6); // seed a 2-hero party
    expect(isPresent('faye')).toBe(true);
    expect(departHero('faye')).toBe(true);
    expect(isPresent('faye')).toBe(false);
    expect(GS.flag('faye_left')).toBe(true);
  });

  it('rejoin brings a benched hero back and clears the leaving flag', () => {
    rejoinHero('pippa', 26);
    departHero('pippa');
    expect(GS.flag('pippa_left')).toBe(true);
    rejoinHero('pippa', 30);
    expect(isPresent('pippa')).toBe(true);
    expect(GS.flag('pippa_left')).toBe(false);
  });

  it('round-trips and restores the exact damaged, equipped, boosted hero record', () => {
    rejoinHero('pippa', 26);
    const pippa = GS.hero('pippa')!;
    pippa.name = 'Pip';
    pippa.exp += 77;
    pippa.hp = 3;
    pippa.pp = 1;
    pippa.down = true;
    pippa.stats.speed += 5;
    pippa.bag = ['paper_fan', 'scroll_of_calm'];
    pippa.equip = { weapon: 'paper_fan' };
    pippa.boosts = { speed: 4, hp: 2 };
    const exact = JSON.parse(JSON.stringify(pippa));

    expect(departHero('pippa')).toBe(true);
    // The bench owns a deep-enough copy, not aliases to the removed object.
    pippa.bag.push('corn_dog');
    pippa.stats.speed = 999;
    expect(GS.data.departedHeroes.pippa).toEqual(exact);

    GS.deserialize(GS.serialize());
    expect(GS.data.departedHeroes.pippa).toEqual(exact);
    rejoinHero('pippa', 99);
    expect(GS.hero('pippa')).toEqual(exact);
    expect(GS.data.departedHeroes.pippa).toBeUndefined();
  });

  it('departure and rejoin are idempotent and never duplicate a hero', () => {
    rejoinHero('pippa', 26);
    expect(departHero('pippa')).toBe(true);
    const exactBench = JSON.parse(JSON.stringify(GS.data.departedHeroes.pippa));
    expect(departHero('pippa')).toBe(false);
    expect(GS.data.departedHeroes.pippa).toEqual(exactBench);

    rejoinHero('pippa', 40);
    rejoinHero('pippa', 40);
    expect(GS.data.party.filter((hero) => hero.id === 'pippa')).toHaveLength(1);
    expect(GS.data.departedHeroes.pippa).toBeUndefined();
    expect(GS.flag('pippa_left')).toBe(false);
  });

  it('departing an absent hero is a no-op', () => {
    expect(departHero('dorin')).toBe(false);
  });

  it('withhold flags an ultimate lock the finale reads', () => {
    withholdUltimate('dorin');
    expect(isWithholding('dorin')).toBe(true);
    withholdUltimate('dorin', false);
    expect(isWithholding('dorin')).toBe(false);
  });
});

describe('party fate — the IRON withhold gates the awakened ultimate in battle (ADR-130)', () => {
  it("Dorin's awakened ability set is exactly Comet Ω (a story grant, not a level unlock)", () => {
    expect(awakenedAbilityIds('dorin').has('vibe_comet_o')).toBe(true);
    expect(awakenedAbilityIds('dorin').has('vibe_comet_g')).toBe(false); // γ is a level unlock
  });

  it('with no withhold flag, the ultimate is freely usable', () => {
    expect(isWithheldAbility('dorin', 'vibe_comet_o')).toBe(false);
  });

  it('withholding drops ONLY the awakened ultimate, never his level-unlock comets', () => {
    withholdUltimate('dorin');
    expect(isWithheldAbility('dorin', 'vibe_comet_o')).toBe(true);
    expect(isWithheldAbility('dorin', 'vibe_comet_g')).toBe(false);
  });

  it("one hero's withhold never gates another hero's ultimate", () => {
    withholdUltimate('dorin');
    expect(isWithheldAbility('rex', 'vibe_surge_x')).toBe(false);
  });
});
